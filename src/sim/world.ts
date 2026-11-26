import {resolveCollisions,faceToward} from './physics';
import {BUILDINGS,newRealm,pay} from './buildings';
import {civicCommand,economyTick,work} from './economy';
import {lordCommands} from './aiDirector';
import {environmentTick} from './environment';
import type {MapId,Mode,Difficulty,FireCell,Barrel,Drop} from './types';
import {strategyTick, moveSlot, regimentSlot, artillery, assignSlots, issueWave} from './strategy';
import { UNITS, KINDS, crews,rankFire,shelter,canGarrison,strength,formationSize } from './config';
import { attack, distanceTo, hit, kill, launch, updateProjectiles } from './combat';
import { Grid, indexAt } from './grid';
import { FlowField } from './flowField';
import { slotOffset } from './formation';
import { HEIGHT, WIDTH, CELL, bridgeSize, riverX, createMap, water } from './maps';
import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import type { BuildType, Command, Faction, Formation, Group, Kind, Point, Projectile, SimEvent, Snapshot, Stat, Structure, Unit } from './types';
const blankStats = () => Object.fromEntries(KINDS.map(k => [k, { kills: 0, damage: 0 }])) as Record<Kind, Stat>;
const clamp = (v: number, max: number) => Math.max(3, Math.min(max - 3, v));
export class SimWorld {
    player:Faction=1;
    map:MapId='darkwood';
    mode:Mode='sandbox';
    difficulty:Difficulty='normal';
    realms=[newRealm(),newRealm()];
    fires:FireCell[]=[]; barrels:Barrel[]=[]; drops:Drop[]=[];
    news='滑铁卢战役 · 两军正在集结';
    tick = 0;
    next = 10000;
    scenario = 0;
    revision = 0;
    dirty = true;
    winner: Faction | null = null;
    rng = new Rng(78951);
    grid = new Grid();
    hash = new SpatialHash();
    fronts=[{x:970,y:880,breached:false},{x:3830,y:880,breached:false}];
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
        this.fronts=[{x:972,y:880,breached:false},{x:3828,y:880,breached:false}];
        this.grid=new Grid(map); this.realms=[newRealm(),newRealm()]; this.fires=[]; this.barrels=[];this.drops=[];
        this.news='滑铁卢战役 · 两军正在集结';
        
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
        for(const f of [0,1] as const){
            const base=this.keep(f)!,d=f?-1:1,p={x:base.x+370*d,y:880};
            this.spawn(f,'peasant',6,{x:base.x-120*d,y:738},'line');
            this.spawn(f,'line_infantry',mode==='sandbox'?120:30,p,'line');
            this.spawn(f,'sapper',3,{x:p.x-d*85,y:1110},'line');
            this.spawn(f,'hussar',8,{x:p.x+d*92,y:1190},'line');
        }
        this.hash.rebuild(this.units);
    }
    keep(f:Faction) {return this.structures.find(s=>s.type==='keep'&&s.faction===f&&s.hp>0);}
    reinforce(f:Faction,kind:Kind,count:number,p:Point){
        const troops=this.spawn(f,kind,count,p,'line');
        if(strength[kind]<=1)return troops;
        const fresh=this.groups.get(troops[0].group)!;
        const groups=new Map<number,Unit[]>();
        for(const u of this.units)if(u.group!==fresh.id&&u.hp>0&&u.kind===kind&&u.faction===f&&!u.tower&&!u.gun){
            const a=groups.get(u.group)??[];a.push(u);groups.set(u.group,a);
        }
        const remaining=troops.slice();
        for(const [id,a] of groups){
            const g=this.groups.get(id)!;
            if(a.length!==this.units.filter(n=>n.hp>0&&n.group===id).length||g.resting&&(g.restTick===undefined||this.tick-g.restTick<90))continue;
            const n=Math.min(remaining.length,strength[kind]-a.length);
            if(n<=0)continue;
            const recruits=remaining.splice(0,n);
            for(const recruit of recruits)recruit.formation=a[0].formation;
            assignSlots(g,[...a,...recruits]);g.resting=false;g.restTick=undefined;
        }
        if(remaining.length)assignSlots(fresh,remaining);else this.groups.delete(fresh.id);
        return troops;
    }
    finishBuilding() { this.dirty=true; }
    approach(u:Unit,p:Point,speed=UNITS[u.kind].speed,pathTarget=p) {
        const f=u.faction;
        let dx=p.x-u.x, dy=p.y-u.y;
        const distance=Math.hypot(dx,dy);
        if(distance>0&&!this.grid.walk(u.x+dx/distance*12,u.y+dy/distance*12,f)){
            const dir=this.field(f,pathTarget).direction(indexAt(u.x,u.y));
            if(dir.x||dir.y){dx=dir.x;dy=dir.y;}
        }
        const length=Math.hypot(dx,dy)||1;
        speed*=this.grid.shallows[indexAt(u.x,u.y)] ? 0.58 : 1;
        speed*=(u.auraUntil??-1)>=this.tick?1.2:1;
        const x=clamp(u.x+dx/length*speed,WIDTH),y=clamp(u.y+dy/length*speed,HEIGHT);
        if(this.grid.walk(x,u.y,f)) u.x=x;
        if(this.grid.walk(u.x,y,f)) u.y=y;

    }
    private garrison(s: Structure, n: number) {
        if (s.faction < 0)
            return;
        const troops = this.spawn(s.faction as Faction, 'line_infantry', n, s, 'line', s.id);
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
        this.groups.set(group, { id: group, count: n, point: null, targetId: 0, anchor: { x:c.x,y:c.y } });
        for (let slot = 0; slot < n; slot++) {
            const o = slotOffset(slot, n, formation, f,formationSize(kind)), p0 = { x: clamp(c.x + o.x, WIDTH), y: clamp(c.y + o.y, HEIGHT) }, p = tower ? p0 : this.nearby(p0, f);
            const u: Unit = {
                ...p, id: this.next++, z: 0, vx: 0, vy: 0, vz: 0, face: f === 0 ? 1 : -1, formation, slot, faceLock:0,rankIndex:0,pose:"march1", group, faction: f, kind, hp: UNITS[kind].hp, cooldown: this.rng.int(0, 28), swing: 0, charge: 0, tower, target: 0, lastAttacker: 1 - f, crew:crews[kind],morale:kind==='guard_grenadier'?100:75,lastKind: kind, lethalFall: false
            };
            this.units.push(u);
            this.byUnit.set(u.id, u);
            added.push(u);
        }
        assignSlots(this.groups.get(group)!,added);
        if(crews[kind])for(const gun of added){
            const team=this.spawn(f,'sapper',crews[kind]!,gun,'line');
            team.forEach((man,i)=>{man.gun=gun.id;man.slot=i;});
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
        return { structure: s, valid: fits && !overlap && legalTerrain && (kind !== 'redoubt' || this.structures.filter(a => a.hp > 0 && a.type === 'redoubt' && a.faction === f).length < 4) };
    }
    private apply(c: Command) {
        if(c.type==='charge'||c.type==='recall'){issueWave(this,c.faction,c.type==='charge');return;}
        if(c.type==='policy'||c.type==='cottage'){civicCommand(this,c);return;}
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
            if(tower&&(tower.faction===c.faction||tower.faction===-1)&&tower.hp>0&&!tower.needed&&shelter(tower.type)){
                for(const u of this.units)if(ids.has(u.id)&&u.faction===c.faction&&!u.tower&&!u.gun&&canGarrison(u.kind)) u.enterTower=tower.id;
            }
            return;
        }
        if(c.type==='train'||c.type==='age'||c.type==='rally'||c.type==='gather'||c.type==='research'){civicCommand(this,c);return;}
        if (c.type === 'spawn') {
            const p = c.payload;
            if(this.mode!=='sandbox') return;
            let remaining=Math.max(1,Math.min(600,Math.floor(p.count)));
            while(remaining>0){const part=Math.min(remaining,strength[p.kind]);this.spawn(c.faction,p.kind,part,p,p.formation);remaining-=part;}
            return;
        }
        if (c.type === 'build') {
            const p = c.payload, b = this.blueprint(p.kind, p, c.faction);
            if(p.kind==='redoubt'&&!this.fronts[c.faction].breached&&!this.structures.some(s=>s.type==='farmhouse'&&s.hp>0&&s.faction===c.faction)){this.news='推进越过中线或占领拉海圣后可修筑炮台';return;}
            if (!b.valid)
                return;
            const s = b.structure;
            if(this.mode==='lord'){
                const builders=this.units.filter(u=>u.hp>0&&!u.gun&&!u.tower&&u.faction===c.faction&&(u.kind==='sapper'||u.kind==='peasant')).sort((a,b)=>Number(b.kind==='sapper')-Number(a.kind==='sapper')||distanceTo(a,s)-distanceTo(b,s));
                if(!builders.length||!pay(this.realms[c.faction],BUILDINGS[p.kind][1],BUILDINGS[p.kind][2])){
                    if(c.faction===this.player) this.news='建造受阻：需要存活的工人及足够的木材、军粮。';return;
                }
                s.work=0;s.needed=135;s.hp=s.maxHp*.1;
                builders[0].job=s.id;
            }
            s.id = this.next++;
            this.structures.push(s);
            this.byStructure.set(s.id, s);
            this.rebuild();

            return;
        }
        if(c.type!=='formation'&&c.type!=='order') return;
        const p = c.payload, ids = p.ids ? new Set(p.ids) : null;
        const groups=new Set(this.units.filter(u=>u.hp>0&&u.faction===c.faction&&(!ids||ids.has(u.id))&&(!p.kind||u.kind===p.kind)).map(u=>u.group));
        for(const id of groups){
            const g=this.groups.get(id)!;
            g.firingLine=undefined;g.contactTick=undefined;g.reformUntil=this.tick+420;g.reform=c.type==='formation'?{...g.anchor}:undefined;
            if(c.type==='order'){g.point=c.payload.point;g.targetId=c.payload.structureId??0;}
            g.volleyStart=undefined;
            for(const u of this.units)if(u.group===id){
                if(c.type==='formation')u.formation=c.payload.formation;
                else{
                    u.manual=true;u.enterTower=undefined;
                    if(u.tower){const site=this.byStructure.get(u.tower)!;u.tower=0;u.z=0;const exit=this.nearby({x:site.x+site.w/2+15,y:site.y},u.faction);u.x=exit.x;u.y=exit.y;}
                }
            }
        }
    }
    damageStructure(s: Structure, amount: number, f: Faction, k: Kind) {
        if (s.hp <= 0)
            return;
        if(s.type==='rock'||s.type==='mine') return;
        if(shelter(s.type)&&(k==='field_cannon'||k==='howitzer'))amount*=3;
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
        const side=s.faction===0?'法军':'英军';
        if(bridge) this.news=(s.type==='bridge'?'石桥':'木桥')+'轰塌！桥上死敌坠河溺毙！';
        else if(s.type==='tower'||s.type==='redoubt') this.news='城防炮楼坍塌，守军撤离。';
        else if(s.type==='keep') this.news=side+'星堡陷落，战役结束。';
        else if(s.type in BUILDINGS) this.news='火焚敌营！'+side+BUILDINGS[s.type as BuildType][0]+'已化作焦土！';
        if(s.type==='redoubt'||s.type==='farmhouse'||s.type==='windmill')this.news='据点坍塌，幸存守军已撤出。';
        if (s.type === 'keep' && this.winner === null)
            this.winner = s.faction===0?1:0;
        let deaths=Math.floor(this.units.filter(u=>u.hp>0&&u.tower===s.id).length/2);
        for (const u of this.units) {
            if (u.hp <= 0)
                continue;
            if (u.tower === s.id) {
                u.tower = 0;
                u.z=0;
                if(deaths-->0)kill(this,u,f,k);
                else{const exit=this.nearby({x:s.x+(u.id%2?1:-1)*(s.w/2+22),y:s.y+(u.slot%7-3)*16},u.faction);u.x=exit.x;u.y=exit.y;u.morale=25;}
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
        if(u.gun){
            const gun=this.byUnit.get(u.gun);
            if(gun&&gun.hp>0){const x=gun.x+(u.slot%2?1:-1)*30,y=gun.y+(u.slot<2?13:-13);
                if(Math.hypot(x-u.x,y-u.y)>2)this.approach(u,{x,y},3.8,gun);
                u.swing=!gun.moving&&gun.cooldown%35<8?3:0;return;}
            u.gun=undefined;
        }
        if(u.enterTower){
            const site=this.byStructure.get(u.enterTower);
            if(site&&site.hp>0&&(site.faction===-1||site.faction===u.faction)){
                const occupants=this.units.filter(n=>n.hp>0&&n.tower===site.id);
                if(occupants.length<(site.type==='tower'?8:60)){
                    if(distanceTo(u,site)>22){this.approach(u,site);return;}
                    const seat=occupants.length;
                    u.tower=site.id;site.faction=u.faction;u.z=18;
                    u.x=site.x+((seat%6)/5-.5)*site.w*.85;u.y=site.y+(seat%2?.22:-.16)*site.h;
                }
            }
            u.enterTower=undefined;
        }
        const g=this.groups.get(u.group)!,def=UNITS[u.kind],f=u.faction;
        if(g.resting&&!u.tower&&!crews[u.kind]&&u.kind!=='peasant'&&u.kind!=='supply_wagon'){moveSlot(this,u,g);return;}
        if(!u.tower&&work(this,u))return;
        if(crews[u.kind]){artillery(this,u);return;}
        if(u.manual&&g.point&&!g.targetId&&!u.tower&&Math.hypot(g.anchor.x-g.point.x,g.anchor.y-g.point.y)>100){moveSlot(this,u,g);return;}
        if(u.commandRole==='drum'&&(this.tick+u.id)%48===0)this.events.push({type:'drum',x:u.x,y:u.y,faction:f});
        const melee=u.formation==='melee'&&!u.tower,range=(melee?35:def.range)+(u.tower?130:0);
        let target:Unit|Structure|undefined,best=Infinity;
        this.hash.visit(u.x,u.y,range+4,n=>{
            if(n.faction===f||n.hp<=0||n.crew===0||n.tower&&def.traits.includes('mount')&&u.kind!=='dragoon')return;
            const dist=distanceTo(u,n);if(dist>range)return;
            const raid=def.traits.includes('flank')&&(n.kind==='supply_wagon'||n.gun||n.kind==='peasant');
            const score=dist*(raid?.08:u.kind==='rifleman'&&(n.gun||n.commandRole==='flag')?.12:1);
            if(score<best){best=score;target=n.tower?(this.byStructure.get(n.tower)??n):n;}
        });
        const ordered=this.byStructure.get(g.targetId);
        if(ordered&&ordered.hp>0&&distanceTo(u,ordered)<=range)target=ordered;
        if(!target&&(!g.point||g.targetId)){const goal=objectives[f];if(goal&&distanceTo(u,goal)<=range)target=goal;}
        if(g.reform&&!u.tower&&(!target||distanceTo(u,target)>=36)){
            const slot=regimentSlot(u,g);
            if(Math.hypot(u.x-g.reform.x-slot.x,u.y-g.reform.y-slot.y)>18){moveSlot(this,u,g);return;}
        }
        if(target){
            const dist=distanceTo(u,target),close=dist<36&&!u.tower;
            const formed=!close&&!u.tower&&rankFire(u.kind)&&u.formation==='line'&&g.count>=12;
            if(formed){
                if(!g.firingLine)g.lineFacing=Math.sign(target.x-g.anchor.x)||(f?-1:1);
                g.contactTick=this.tick;g.firingLine??={...g.anchor};g.volleyStart??=this.tick;
                const period=this.realms[f].powder?79:96,phase=(this.tick-g.volleyStart)%period,fire=Math.round(u.rankIndex*period/3);
                if(phase===fire)attack(this,u,target);
                const elapsed=this.tick-(u.firedAt??-1000);
                u.pose=elapsed===0?'aim':elapsed<period-5?(u.rankIndex===0?'kneel':'reload'):'aim';
            }else{
                u.pose=close||melee?'bayonet':'aim';
                if(u.cooldown<=0||close&&u.cooldown>25)attack(this,u,target);
            }
            if(u.squareSide===undefined)faceToward(u,formed?g.lineFacing!:target.x-u.x);
            return;
        }
        if(!u.tower)moveSlot(this,u,g);
    }
    step(commands: Command[], advance = true): SimEvent[] {
        this.events = [];
        const due = this.tick;
        for (const c of commands)
            if (c.tick === due)
                this.apply(c);
        if (this.dirty)
            this.rebuild();
        if (!advance){
            if(commands.some(c=>c.type==='spawn'||c.type==='order'))resolveCollisions(this);
            return this.events;
        }
        for(const command of lordCommands(this)) this.apply(command);
        economyTick(this);
        strategyTick(this);
        this.hash.rebuild(this.units);
        environmentTick(this);
        const goals = [0, 1].map(f => this.structures.find(s => s.faction !== f && s.faction !== -1 && s.type === 'gate' && s.hp > 0) ?? this.structures.find(s => s.faction !== f && s.faction !== -1 && s.type === 'keep' && s.hp > 0));
        for (const u of this.units){
            const oldX=u.x,oldY=u.y;u.faceLock=Math.max(0,u.faceLock-1);
            const group=this.groups.get(u.group);
            u.squareSide=u.formation==='square'&&group&&group.count>=8&&!u.commandRole?Math.floor(u.slot*4/group.count):undefined;
            u.pose=u.formation==='melee'||u.squareSide!==undefined?'bayonet':Math.floor(this.tick/7)%2?'march2':'march1';
            this.advance(u,goals);
            u.moving=Math.hypot(u.x-oldX,u.y-oldY)>.12;
            if(u.moving&&UNITS[u.kind].traits.includes('mount'))u.charge=Math.min(70,u.charge+1);
            if(u.moving&&Math.abs(u.x-oldX)>.65){
                const forward=u.faction?-1:1,g=this.groups.get(u.group);
                if(u.squareSide===undefined)faceToward(u,rankFire(u.kind)&&u.formation==='line'&&!g?.resting&&!g?.point?forward:u.x-oldX);
            }
        }
        resolveCollisions(this);
        updateProjectiles(this);
        this.units = this.units.filter(u => { if (u.hp > 0)
            return true; this.byUnit.delete(u.id); return false; });
        for(const s of this.structures)if((s.type==='farmhouse'||s.type==='windmill')&&s.faction!==-1&&!this.units.some(u=>u.tower===s.id))s.faction=-1;
        if (this.dirty)this.rebuild();
        this.tick++;
        return this.events;
    }
    snapshot(): Snapshot { return structuredClone({
        fronts:this.fronts,player:this.player,map:this.map,mode:this.mode,difficulty:this.difficulty,realms:this.realms,fires:this.fires,barrels:this.barrels,drops:this.drops,news:this.news,
        tick: this.tick, seed: this.rng.state, next: this.next, scenario: this.scenario, units: this.units, structures: this.structures, projectiles: this.projectiles, groups: [...this.groups.values()], stats: this.stats, dead: this.dead, launches: this.launches, bridges: this.bridges, buildings: this.buildings, winner: this.winner
    }); }
    restore(state: Snapshot) {
        const s = structuredClone(state);
        this.player=s.player??1;this.map=s.map??'twin';this.mode=s.mode??'sandbox';this.difficulty=s.difficulty??'normal';
        this.realms=s.realms??[newRealm(),newRealm()];this.fires=s.fires??[];this.barrels=s.barrels??[];this.drops=s.drops??[];this.news=s.news??'两军重新列阵。';
        this.grid=new Grid(this.map);
        this.fronts=s.fronts??[{x:972,y:880,breached:false},{x:3828,y:880,breached:false}];
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
