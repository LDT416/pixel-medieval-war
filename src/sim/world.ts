import {BUILDINGS,newRealm,pay} from './buildings';
import {civicCommand,economyTick,work} from './economy';
import {lordCommands} from './aiDirector';
import {environmentTick,supportTick} from './environment';
import type {MapId,Mode,Difficulty,FireCell,Barrel,Drop} from './types';
import { UNITS, KINDS } from './config';
import { attack, distanceTo, hit, kill, launch, updateProjectiles } from './combat';
import { Grid, indexAt } from './grid';
import { FlowField } from './flowField';
import { slotOffset } from './formation';
import { HEIGHT, WIDTH, CELL, bridgeSize, lanes, riverX, createMap, water } from './maps';
import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import type { BuildType, Command, Faction, Formation, Group, Kind, Point, Projectile, SimEvent, Snapshot, Stat, Structure, Unit } from './types';
const blankStats = () => Object.fromEntries(KINDS.map(k => [k, { kills: 0, damage: 0 }])) as Record<Kind, Stat>;
const clamp = (v: number, max: number) => Math.max(3, Math.min(max - 3, v));
export class SimWorld {
    map:MapId='twin';
    mode:Mode='sandbox';
    difficulty:Difficulty='normal';
    realms=[newRealm(),newRealm()];
    fires:FireCell[]=[]; barrels:Barrel[]=[]; drops:Drop[]=[];
    news='铁冠北境与赤棘血朝结下百年弑君灭族之仇。两军不受降。';
    tick = 0;
    next = 10000;
    scenario = 0;
    revision = 0;
    dirty = true;
    winner: Faction | null = null;
    rng = new Rng(78951);
    grid = new Grid();
    hash = new SpatialHash();
    fields = new Map<string, FlowField>();
    units: Unit[] = [];
    structures: Structure[] = [];
    projectiles: Projectile[] = [];
    groups = new Map<number, Group>();
    byUnit = new Map<number, Unit>();
    byStructure = new Map<number, Structure>();
    events: SimEvent[] = [];
    stats = [blankStats(), blankStats()];
    dead = [0, 0];
    launches = [0, 0];
    bridges = 0;
    buildings = 0;
    constructor(index = 0) { this.reset(index); }
    reset(index: number,map:MapId=this.map,mode:Mode=this.mode,difficulty:Difficulty=this.difficulty) {
        this.map=map; this.mode=mode; this.difficulty=difficulty;
        this.grid=new Grid(map); this.realms=[newRealm(),newRealm()]; this.fires=[]; this.barrels=[];this.drops=[];
        this.news='铁冠北境与赤棘血朝结下百年弑君灭族之仇。寸土不让，绝不受降。';
        const bridgeYs=lanes(map);
        this.tick = 0;
        this.next = 10000;
        this.rng.state = 78951 + index;
        this.scenario = index;
        this.winner = null;
        this.units = [];
        this.projectiles = [];
        this.events = [];
        this.groups.clear();
        this.byUnit.clear();
        this.fields.clear();
        this.structures = createMap(map);
        this.byStructure = new Map(this.structures.map(s => [s.id, s]));
        this.stats = [blankStats(), blankStats()];
        this.dead = [0, 0];
        this.launches = [0, 0];
        this.bridges = this.buildings = 0;
        this.rebuild();
        for (const s of this.structures)
            if (s.type === 'tower')
                this.garrison(s, 3);
        if(mode==='lord'){
            for(const f of [0,1] as const){
                const keep=this.keep(f)!,d=f===0?1:-1;
                const p={x:keep.x-d*116,y:keep.y-80};
                this.spawn(f,'peasant',4,p,'skirmish').forEach((u,i)=>u.prefer=i%2?'gold':'wood');
                const guards=this.honorGuard(f,{x:keep.x+d*224,y:keep.y});
                for(const u of guards) this.groups.get(u.group)!.point={x:u.x,y:u.y};
            }
            this.hash.rebuild(this.units); return;
        }
        if (index === 4)
            return;
        for (const f of [0, 1] as const) {
            const d = f === 0 ? -1 : 1;
            const deploy = (kind: Kind, n: number, offset: number, y: number, form: Formation = 'skirmish') => this.spawn(f, kind, n, { x: riverX(y) + d * offset, y }, form);
            this.honorGuard(f,{x:riverX(bridgeYs[0])+d*310,y:bridgeYs[0]-55});
            if(index===0||index===2){
                deploy('war_elephant',3,205,bridgeYs[0]);deploy('hwacha',2,355,bridgeYs[0]+20);
                deploy('fire_bomber',8,145,bridgeYs[0]+55);deploy('ballista',3,365,bridgeYs[0]-40);
            }
            if (index === 1) {
                deploy(f === 0 ? 'halberdier' : 'heavy_lancer', f === 0 ? 144 : 100, 220, 655, f === 0 ? 'phalanx' : 'skirmish');
                continue;
            }
            if (index === 2) {
                for (const by of bridgeYs) {
                    deploy('militia', 156, 170, by);
                    deploy('halberdier', 96, 320, by, 'phalanx');
                    deploy('musketeer', 48, 440, by, 'line');
                }
                continue;
            }
            if (index === 3) {
                const gate = this.structures.find(s => s.type === 'gate' && s.faction === 1)!;
                for (const side of [-1, 1]) {
                    if (f === 0) {
                        const guns = this.spawn(f, 'field_cannon', 6, { x: gate.x - 310, y: gate.y + side * 90 }, 'line');
                        const engines = this.spawn(f, 'catapult', 3, { x: gate.x - 455, y: gate.y + side * 115 }, 'line');
                        for (const group of [guns, engines])
                            this.groups.get(group[0].group)!.targetId = gate.id;
                        this.spawn(f, 'musketeer', 72, { x: gate.x - 230, y: gate.y + side * 90 }, 'line');
                        this.spawn(f, 'shieldman', 36, { x: gate.x - 160, y: gate.y + side * 68 }, 'phalanx');
                    }
                    else {
                        this.spawn(f, 'musketeer', 60, { x: gate.x - 95, y: gate.y + side * 110 }, 'line');
                        this.spawn(f, 'shieldman', 44, { x: gate.x - 60, y: gate.y + side * 65 }, 'phalanx');
                        this.spawn(f, 'field_cannon', 3, { x: gate.x + 82, y: gate.y + side * 155 }, 'line');
                    }
                }
                continue;
            }
            for (const [lane, by] of bridgeYs.entries()) {
                deploy('halberdier', 72, 130, by, 'phalanx');
                deploy('shieldman', 42, 230, by + 80, 'phalanx');
                deploy('musketeer', 36, 270, by - 52, 'line');
                deploy('bowman', 24, 390, by + 65, 'line');
                deploy('heavy_lancer', 20, 765, by + (lane ? -95 : 120), 'phalanx');
                deploy('scout_cavalry', 12, 620, by - 155);
                deploy('militia', 30, 930, by + (lane ? -175 : 190), 'phalanx');
                deploy('plate_knight', 18, 465, by + 145, 'phalanx');
                deploy('catapult', 3, 435, by - 18, 'line');
                deploy('field_cannon', 4, 285, by + (lane ? 35 : 10), 'line');
            }
        }
        this.hash.rebuild(this.units);
    }
    keep(f:Faction) {return this.structures.find(s=>s.type==='keep'&&s.faction===f&&s.hp>0);}
    honorGuard(f:Faction,p:Point) {
        const leader=this.spawn(f,'bannerman',1,p,'line')[0], troops=[leader], d=f===0?1:-1;
        for(const [role,dx,dy] of [['drum',-8,-24],['horn',-8,24],['guard',27,-15],['guard',27,15]] as const){
            const u=this.spawn(f,'halberdier',1,{x:p.x+dx*d,y:p.y+dy},'phalanx')[0];
            u.leader=leader.id; u.escort=role;u.guardSide=Math.sign(dy);troops.push(u);
        }
        return troops;
    }
    finishBuilding(s:Structure) {
        this.dirty=true;
        if(s.type==='outpost') this.garrison(s,2);
    }
    approach(u:Unit,p:Point,speed=UNITS[u.kind].speed) {
        const f=u.faction;
        let dx=p.x-u.x, dy=p.y-u.y;
        const distance=Math.hypot(dx,dy);
        if(distance>65 || distance>0&&!this.grid.walk(u.x+dx/distance*12,u.y+dy/distance*12,f)){
            const dir=this.field(f,p).direction(indexAt(u.x,u.y));
            if(dir.x||dir.y){dx=dir.x;dy=dir.y;}
        }
        const length=Math.hypot(dx,dy)||1;
        speed*=this.grid.shallows[indexAt(u.x,u.y)] ? 0.58 : 1;
        speed*=(u.auraUntil??-1)>=this.tick?1.2:1;
        const x=clamp(u.x+dx/length*speed,WIDTH),y=clamp(u.y+dy/length*speed,HEIGHT);
        if(this.grid.walk(x,u.y,f)) u.x=x;
        if(this.grid.walk(u.x,y,f)) u.y=y;
        if(dx) u.face=dx>0?1:-1;
    }
    private garrison(s: Structure, n: number) {
        if (s.faction < 0)
            return;
        const troops = this.spawn(s.faction as Faction, 'bowman', n, s, 'line', s.id);
        troops.forEach((u, i) => { u.x = s.x + (i - (n - 1) / 2) * 13; u.y = s.y - 6; u.z = s.type === 'tower' ? 48 : 38; });
    }
    private rebuild() { this.grid.rebuild(this.structures); this.fields.clear(); this.dirty = false; this.revision++; }
    private nearby(p: Point, f: Faction) {
        if (this.grid.walk(p.x, p.y, f))
            return p;
        for (let r = 1; r < 50; r++)
            for (let i = -r; i <= r; i++)
                for (const [ox, oy] of [[i, -r], [i, r], [-r, i], [r, i]]) {
                    const x = clamp(p.x + ox * CELL, WIDTH), y = clamp(p.y + oy * CELL, HEIGHT);
                    if (this.grid.walk(x, y, f))
                        return { x, y };
                }
        return p;
    }
    spawn(f: Faction, kind: Kind, count: number, c: Point, formation: Formation, tower = 0) {
        const group = this.next++, n = Math.min(600, Math.max(1, Math.floor(count))), added: Unit[] = [];
        this.groups.set(group, { id: group, count: n, point: null, targetId: 0, anchor: { ...c } });
        for (let slot = 0; slot < n; slot++) {
            const o = slotOffset(slot, n, formation, f), p0 = { x: clamp(c.x + o.x, WIDTH), y: clamp(c.y + o.y, HEIGHT) }, p = tower ? p0 : this.nearby(p0, f);
            const u: Unit = {
                ...p, id: this.next++, z: 0, vx: 0, vy: 0, vz: 0, face: f === 0 ? 1 : -1, formation, slot, group, faction: f, kind, hp: UNITS[kind].hp, cooldown: this.rng.int(0, 28), swing: 0, charge: 0, tower, target: 0, lastAttacker: 1 - f, lastKind: 'militia', lethalFall: false
            };
            this.units.push(u);
            this.byUnit.set(u.id, u);
            added.push(u);
        }
        return added;
    }
    blueprint(kind: BuildType, p: Point, f: Faction): {
        structure: Structure;
        valid: boolean;
    } {
        let x = Math.round(p.x / CELL) * CELL, y = Math.round(p.y / CELL) * CELL;
        let [,,,w,h,hp] = BUILDINGS[kind];
        if (kind === 'pontoon') {
            const b = bridgeSize(y,this.map,x);
            x = b.x;
            w = b.w;
        }
        const s: Structure = {
            id: this.next, type: kind, x, y, w, h, hp, maxHp: hp, faction: f
        };
        const fits = x - w / 2 >= 0 && x + w / 2 < WIDTH && y - h / 2 >= 0 && y + h / 2 < HEIGHT;
        const overlap = this.structures.some(a => a.hp > 0 && Math.abs(a.x - x) < (a.w + w) / 2 && Math.abs(a.y - y) < (a.h + h) / 2);
        const occupied = kind !== 'pontoon' && this.units.some(u => u.hp > 0 && !u.tower && u.z < 10 && Math.abs(u.x - x) < w / 2 + 4 && Math.abs(u.y - y) < h / 2 + 4);
        const legalTerrain = kind === 'pontoon' ? water(p.x, p.y,this.map) : !occupied && [-1, 0, 1].every(i => [-1, 0, 1].every(j => !water(x + i * w / 2, y + j * h / 2,this.map)));
        return { structure: s, valid: fits && !overlap && legalTerrain && (kind !== 'outpost' || this.structures.filter(a => a.hp > 0 && a.type === 'outpost' && a.faction === f).length < 4) };
    }
    private apply(c: Command) {
        if (c.type === 'restore') {
            this.restore(c.payload.state);
            return;
        }
        if (c.type === 'scenario') {
            this.reset(c.payload.index,c.payload.map,c.payload.mode,c.payload.difficulty);
            return;
        }
        if(c.type==='repair'){
            const site=this.byStructure.get(c.payload.site),ids=new Set(c.payload.ids);
            if(site&&site.hp>0&&(site.faction===c.faction||site.type==='bridge'||site.type==='pontoon'&&site.faction===-1))
                for(const u of this.units)if(u.faction===c.faction&&ids.has(u.id)&&(u.kind==='sapper'||u.kind==='peasant'))u.job=site.id;
            return;
        }
        if(c.type==='garrison'){
            const tower=this.byStructure.get(c.payload.tower),ids=new Set(c.payload.ids);
            if(tower&&tower.faction===c.faction&&tower.hp>0&&!tower.needed&&['outpost','tower'].includes(tower.type)){
                for(const u of this.units)if(ids.has(u.id)&&u.faction===c.faction&&!u.tower&&['longbowman','bowman'].includes(u.kind)) u.enterTower=tower.id;
            }
            return;
        }
        if(c.type==='train'||c.type==='age'||c.type==='rally'||c.type==='gather'||c.type==='guard'||c.type==='research'){civicCommand(this,c);return;}
        if (c.type === 'spawn') {
            const p = c.payload;
            if(this.mode!=='sandbox') return;
            this.spawn(c.faction, p.kind, p.count, p, p.formation);
            return;
        }
        if (c.type === 'build') {
            const p = c.payload, b = this.blueprint(p.kind, p, c.faction);
            if (!b.valid)
                return;
            const s = b.structure;
            if(this.mode==='lord'){
                if(!this.units.some(u=>u.hp>0&&u.faction===c.faction&&(u.kind==='sapper'||u.kind==='peasant'))||!pay(this.realms[c.faction],BUILDINGS[p.kind][1],BUILDINGS[p.kind][2])){
                    if(c.faction===0) this.news='建造受阻：需要存活的工人及足够的木材、黄金。';return;
                }
                s.work=0;s.needed=135;s.hp=s.maxHp*.1;
                const worker=this.units.filter(u=>u.faction===c.faction&&u.hp>0&&(u.kind==='peasant'||u.kind==='sapper')).sort((a,b)=>distanceTo(a,s)-distanceTo(b,s))[0];
                worker.job=s.id;
            }
            s.id = this.next++;
            this.structures.push(s);
            this.byStructure.set(s.id, s);
            this.rebuild();
            if(!s.needed && s.type==='outpost') this.garrison(s,2);
            return;
        }
        if(c.type!=='formation'&&c.type!=='order') return;
        const p = c.payload, ids = p.ids ? new Set(p.ids) : null;
        const troops = this.units.filter(u => !u.tower && u.hp > 0 && u.faction === c.faction && (!ids || ids.has(u.id)) && (!p.kind || u.kind === p.kind));
        // Preserve independent deployment groups for global orders; a local selection forms its own squad.
        const partitions = new Map<number, Unit[]>();
        for (const u of troops) {
            const k = ids ? 0 : u.group;
            let part = partitions.get(k);
            if (!part) {
                part = [];
                partitions.set(k, part);
            }
            part.push(u);
        }
        for(const u of troops) if(c.type==='order') u.enterTower=undefined;
        for (const part of partitions.values()) {
            const id = this.next++, old = this.groups.get(part[0].group)!;
            this.groups.set(id, { id, count: part.length, anchor: { ...old.anchor }, point: c.type === 'order' ? c.payload.point : old.point, targetId: c.type === 'order' ? c.payload.structureId ?? 0 : old.targetId });
            part.forEach((u, i) => { u.group = id; u.slot = i; u.target = 0; if (c.type === 'formation')
                u.formation = c.payload.formation; });
        }
    }
    damageStructure(s: Structure, amount: number, f: Faction, k: Kind) {
        if (s.hp <= 0)
            return;
        if(s.type==='rock'||s.type==='mine') return;
        if(this.realms[f].powder&&(UNITS[k].traits.includes('powder')||UNITS[k].traits.includes('siege'))) amount*=1.2;
        this.stats[f][k].damage += Math.min(s.hp, amount);
        s.hp = Math.max(0, s.hp - amount);
        if (s.hp)
            return;
        const bridge = s.type === 'bridge' || s.type === 'pontoon';
        if (bridge)
            this.bridges++;
        else if (s.type !== 'tree')
            this.buildings++;
        this.events.push({ type: 'collapse', x: s.x, y: s.y, structure: { ...s }, power: s.type === 'tree' ? 1 : 7 });
        this.dirty = true;
        const side=s.faction===0?'铁冠':'赤棘';
        if(bridge) this.news=(s.type==='bridge'?'石桥':'木桥')+'轰塌！桥上死敌坠河溺毙！';
        else if(s.type==='tower'||s.type==='outpost') this.news='箭塔倾覆，驻塔死敌坠地摔成肉泥！';
        else if(s.type==='keep') this.news=s.faction===1?'百年血仇终结——赤棘主堡沦为尸山焦土，屠城大胜！':'铁冠主堡陷落，全军惨遭血洗！';
        else if(s.type in BUILDINGS) this.news='火焚敌营！'+side+BUILDINGS[s.type as BuildType][0]+'已化作焦土！';
        if (s.type === 'keep' && this.winner === null)
            this.winner = s.faction===0?1:0;
        for (const u of this.units) {
            if (u.hp <= 0)
                continue;
            if (u.tower === s.id) {
                u.tower = 0;
                u.lethalFall = true;
                u.lastAttacker = f;
                u.lastKind = k;
                launch(this, u, this.rng.next() * 2 - 1, this.rng.next() * 2 - 1, 9);
            }
            else if (!bridge&&s.type!=='tree'&&!u.tower&&distanceTo(u,s)<22){
                const len=Math.hypot(u.x-s.x,u.y-s.y)||1;u.lastAttacker=f;u.lastKind=k;launch(this,u,(u.x-s.x)/len,(u.y-s.y)/len,9);
            }
            else if (bridge && !u.tower && Math.abs(u.x - s.x) <= s.w / 2 && Math.abs(u.y - s.y) <= s.h / 2) {
                kill(this, u, f, k);
                this.events.push({ type: 'splash', x: u.x, y: u.y });
            }
        }
    }
    private field(f: Faction, p: Point) {
        const key = f + ':' + indexAt(p.x, p.y);
        let field = this.fields.get(key);
        if (!field) {
            field = new FlowField(this.grid, p, f);
            if(this.fields.size>=96) this.fields.delete(this.fields.keys().next().value!);
            this.fields.set(key, field);
        }
        return field;
    }
    private advance(u: Unit, objectives: (Structure | undefined)[]) {
        if (u.hp <= 0)
            return;
        u.swing = Math.max(0, u.swing - 1);
        u.cooldown--;
        if (!u.tower && (u.z > 0 || u.vz !== 0)) {
            if ((this.tick + u.id) % 4 === 0)
                this.events.push({ type: 'trail', x: u.x, y: u.y, z: u.z, dx: u.vx * .2, dy: u.vy * .2 });
            u.x = clamp(u.x + u.vx, WIDTH);
            u.y = clamp(u.y + u.vy, HEIGHT);
            u.z += u.vz;
            u.vz -= .78;
            u.vx *= .96;
            u.vy *= .96;
            if (u.z <= 0) {
                const impact = Math.abs(u.vz);
                u.z = u.vz = u.vx = u.vy = 0;
                if (u.lethalFall || (!this.grid.terrain[indexAt(u.x, u.y)] && !this.grid.walk(u.x, u.y, u.faction)))
                    kill(this, u, u.lastAttacker as Faction, u.lastKind);
                else {
                    hit(this, u, u.lastAttacker as Faction, u.lastKind, impact * 1.8, 0, 0);
                    if (!this.grid.walk(u.x, u.y, u.faction))
                        Object.assign(u, this.nearby(u, u.faction));
                }
            }
            return;
        }
        if(u.enterTower){
            const tower=this.byStructure.get(u.enterTower), seats=tower?.type==='outpost'?2:3;
            const occupied=this.units.filter(n=>n.tower===u.enterTower&&n.hp>0);
            if(tower&&tower.hp>0&&occupied.length<seats){
                if(distanceTo(u,tower)>25){this.approach(u,tower);return;}
                const seat=Array.from({length:seats},(_,i)=>tower.x+(i-(seats-1)/2)*13).find(x=>!occupied.some(n=>Math.abs(n.x-x)<1));
                u.tower=tower.id;u.x=seat??tower.x;u.y=tower.y-6;u.z=tower.type==='tower'?48:38;
            }
            u.enterTower=undefined;
        }
        if(work(this,u)||supportTick(this,u)) return;
        const def = UNITS[u.kind], group = this.groups.get(u.group)!, f = u.faction, goal = objectives[f], range = def.range + (u.tower ? 130 : 0);
        let foe = this.byUnit.get(u.target);
        if (foe && (foe.hp <= 0 || Math.hypot(foe.x - u.x, foe.y - u.y) > range + 110 || (foe.tower && range < 60)))
            foe = undefined;
        if ((this.tick + u.id) % 12 === 0) {
            let score = Infinity;
            const flank = def.traits.includes('flank');
            this.hash.visit(u.x, u.y, range + (flank ? 185 : 50), n => {
                if (n.faction === f || n.hp <= 0 || (n.tower && range < 60))
                    return;
                let d = Math.hypot(n.x - u.x, n.y - u.y);
                if(flank && (n.kind==='peasant'||n.kind==='monk'||UNITS[n.kind].traits.includes('siege'))) d*=.11;
                else if (flank && UNITS[n.kind].range > 60)
                    d *= .23;
                if (d < score) {
                    foe = n;
                    score = d;
                }
            });
            u.target = foe?.id ?? 0;
        }
        const ordered=this.byStructure.get(group.targetId);
        let designated=ordered&&ordered.hp>0?ordered:undefined;
        if(!designated&&(u.kind==='sapper'||u.kind==='battering_ram')){
            let nearest=115;
            for(const s of this.structures){
                if(s.hp<=0||s.faction===f||s.faction===-1&&!['bridge','pontoon'].includes(s.type)) continue;
                if((s.type==='bridge'||s.type==='pontoon')&&u.kind==='battering_ram')continue;
                const d=distanceTo(u,s);if(d<nearest){nearest=d;designated=s;}
            }
        }
        let target: Structure | Unit | undefined = designated ?? foe;
        if (!target && !group.point)
            target = goal;
        if (target && distanceTo(u, target) <= range) {
            if (u.cooldown <= 0) attack(this,u,target);
            if(foe && u.kind==='horse_archer' && distanceTo(u,foe)<range*.84) {
                const len=Math.hypot(u.x-foe.x,u.y-foe.y)||1;
                const x=clamp(u.x+(u.x-foe.x)/len*def.speed,WIDTH), y=clamp(u.y+(u.y-foe.y)/len*def.speed,HEIGHT);
                if(this.grid.walk(x,y,f)){u.x=x;u.y=y;}
            }
            return;
        }
        if (u.tower)
            return;
        const point = designated ?? group.point ?? goal;
        if (!point)
            return;
        const off = slotOffset(u.slot, group.count, u.formation, f), dest = { x: point.x + (group.point ? off.x : 0), y: point.y + (group.point ? off.y : 0) };
        let dx = 0, dy = 0;
        let tx = foe && !designated ? foe.x : dest.x, ty = foe && !designated ? foe.y : dest.y;
        if (foe && !designated && def.traits.includes('flank') && UNITS[foe.kind].range > 60) {
            const forward = f === 0 ? 1 : -1;
            if ((foe.x - u.x) * forward > 34) {
                tx += forward * 28;
                ty += u.slot % 2 ? 58 : -58;
            }
        }
        const dist = Math.hypot(tx - u.x, ty - u.y);
        if (dist < 4 && group.point)
            return;
        const near = foe !== undefined || dist < 120 || !!group.point && Math.hypot(u.x - point.x, u.y - point.y) < 85;
        if (near) {
            dx = tx - u.x;
            dy = ty - u.y;
        }
        else {
            const dir = this.field(f, point).direction(indexAt(u.x, u.y));
            dx = dir.x;
            dy = dir.y;
        }
        const norm = Math.hypot(dx, dy) || 1;
        dx /= norm;
        dy /= norm;
        const gap = u.formation === 'skirmish' ? 15 : u.formation === 'line' ? 12 : 9;
        let sx = 0, sy = 0;
        this.hash.visit(u.x, u.y, gap, n => {
            if (n.id === u.id || n.tower || n.z > 3)
                return;
            const ax = u.x - n.x, ay = u.y - n.y, r = Math.hypot(ax, ay);
            if (r > .01) {
                sx += ax / r * (1 - r / gap);
                sy += ay / r * (1 - r / gap);
            }
            else {
                sx += u.id % 2 ? .6 : -.6;
                sy += u.id % 3 ? .4 : -.4;
            }
        });
        if (!foe && !group.point) {
            sx += Math.max(-.7, Math.min(.7, (group.anchor.x + off.x - u.x) * .023));
            sy += Math.max(-.7, Math.min(.7, (group.anchor.y + off.y - u.y) * .023));
        }
        const speed = def.speed * ((u.auraUntil??-1)>=this.tick?1.2:1) * (this.grid.shallows[indexAt(u.x,u.y)] ? 0.58 : 1) * (u.formation === 'phalanx' ? .7 : 1), mx = (dx + sx * .92) * speed, my = (dy + sy * .92) * speed;
        let moved = false;
        if (this.grid.walk(u.x + mx, u.y, f)) {
            u.x = clamp(u.x + mx, WIDTH);
            moved = Math.abs(mx) > .08;
        }
        if (this.grid.walk(u.x, u.y + my, f)) {
            u.y = clamp(u.y + my, HEIGHT);
            moved = moved || Math.abs(my) > .08;
        }
        if (!moved || near && !this.grid.walk(u.x + dx * 13, u.y + dy * 13, f)) {
            const obstacle = this.byStructure.get(this.grid.blockers[indexAt(u.x + dx * 14, u.y + dy * 14)]);
            if (obstacle && obstacle.hp > 0 && obstacle.faction !== f && !['bridge', 'pontoon'].includes(obstacle.type) && u.cooldown <= 0)
                attack(this, u, obstacle);
            else {
                const dir = this.field(f, point).direction(indexAt(u.x, u.y));
                if (this.grid.walk(u.x + dir.x * speed, u.y + dir.y * speed, f)) {
                    u.x += dir.x * speed;
                    u.y += dir.y * speed;
                }
            }
        }
        if (moved) {
            if(this.grid.shallows[indexAt(u.x,u.y)] && (this.tick+u.id)%18===0)
                this.events.push({type:'wade',x:u.x,y:u.y});
            if (Math.abs(dx) > .15)
                u.face = dx > 0 ? 1 : -1;
            u.charge = Math.min(70, u.charge + 1);
        }
    }
    step(commands: Command[], advance = true): SimEvent[] {
        this.events = [];
        const due = this.tick;
        for (const c of commands)
            if (c.tick === due)
                this.apply(c);
        if (this.dirty)
            this.rebuild();
        if (!advance)
            return this.events;
        for(const command of lordCommands(this)) this.apply(command);
        economyTick(this);
        this.hash.rebuild(this.units);
        environmentTick(this);
        const active = new Map<number, {
            x: number;
            y: number;
            n: number;
        }>();
        for (const u of this.units) {
            if (u.tower || u.hp <= 0)
                continue;
            let a = active.get(u.group);
            if (!a) {
                a = { x: 0, y: 0, n: 0 };
                active.set(u.group, a);
            }
            a.x += u.x;
            a.y += u.y;
            a.n++;
        }
        for (const [id, a] of active)
            this.groups.get(id)!.anchor = { x: a.x / a.n, y: a.y / a.n };
        const goals = [0, 1].map(f => this.structures.find(s => s.faction !== f && s.faction !== -1 && s.type === 'gate' && s.hp > 0) ?? this.structures.find(s => s.faction !== f && s.faction !== -1 && s.type === 'keep' && s.hp > 0));
        for (const u of this.units)
            this.advance(u, goals);
        updateProjectiles(this);
        this.units = this.units.filter(u => { if (u.hp > 0)
            return true; this.byUnit.delete(u.id); return false; });
        if (this.dirty)
            this.rebuild();
        this.tick++;
        return this.events;
    }
    snapshot(): Snapshot { return structuredClone({
        map:this.map,mode:this.mode,difficulty:this.difficulty,realms:this.realms,fires:this.fires,barrels:this.barrels,drops:this.drops,news:this.news,
        tick: this.tick, seed: this.rng.state, next: this.next, scenario: this.scenario, units: this.units, structures: this.structures, projectiles: this.projectiles, groups: [...this.groups.values()], stats: this.stats, dead: this.dead, launches: this.launches, bridges: this.bridges, buildings: this.buildings, winner: this.winner
    }); }
    restore(state: Snapshot) {
        const s = structuredClone(state);
        this.map=s.map??'twin';this.mode=s.mode??'sandbox';this.difficulty=s.difficulty??'normal';
        this.realms=s.realms??[newRealm(),newRealm()];this.fires=s.fires??[];this.barrels=s.barrels??[];this.drops=s.drops??[];this.news=s.news??'两军重新列阵。';
        this.grid=new Grid(this.map);
        this.tick = s.tick;
        this.rng.state = s.seed;
        this.next = s.next;
        this.scenario = s.scenario;
        this.units = s.units;
        this.structures = s.structures;
        this.projectiles = s.projectiles;
        this.groups = new Map(s.groups.map(g => [g.id, g]));
        this.stats = s.stats.map(row=>({...blankStats(),...row}));
        this.dead = s.dead;
        this.launches = s.launches;
        this.bridges = s.bridges;
        this.buildings = s.buildings;
        this.winner = s.winner;
        this.byUnit = new Map(this.units.map(u => [u.id, u]));
        this.byStructure = new Map(this.structures.map(t => [t.id, t]));
        this.hash.rebuild(this.units);
        this.rebuild();
    }
}
