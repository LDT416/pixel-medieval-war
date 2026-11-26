import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { SimWorld } from '../src/sim/world';
import { KINDS, strength, TPS, UNITS } from '../src/sim/config';
import { attack, hit, rangeOf } from '../src/sim/combat';
import { createMap, HEIGHT, WIDTH } from '../src/sim/maps';
import type { Faction, CommandAction } from '../src/sim/types';

const kinds = ['line_infantry', 'guard_grenadier', 'cuirassier', 'field_cannon', 'bannerman'] as const;
assert.deepEqual([...KINDS].sort(), [...kinds].sort());
assert.deepEqual(kinds.map(k => strength[k]), [30, 24, 14, 1, 3]);
assert.equal(WIDTH, 6800);
assert.equal(HEIGHT, 2600);
for (const map of ['twin', 'gorge', 'darkwood'] as const) {
    const a = createMap(map);
    assert.deepEqual(a, createMap(map));
    for (const faction of [0, 1]) {
        assert.equal(a.filter(s => s.type === 'keep' && s.faction === faction).length, 1);
        assert.equal(a.filter(s => s.type === 'barracks' && s.faction === faction).length, 2);
    }
    for (const landmark of ['windmill', 'church', 'haystack', 'ruins', 'pond', 'tents'] as const) {
        assert.ok(a.some(s => s.type === landmark), `map ${map} includes ${landmark}`);
    }
}
for (const file of readdirSync('src/sim', {recursive:true}).filter(f => String(f).endsWith('.ts'))) {
    const src = readFileSync('src/sim/' + file, 'utf8');
    assert.doesNotMatch(src, /\b(?:Math\.random|Date\.now|window|document|resolveCollisions)\b/, String(file));
}
for (const file of readdirSync('src/client').filter(f => f.endsWith('.ts'))) {
    const source=readFileSync('src/client/'+file,'utf8');
    assert.doesNotMatch(source,/\bshake\b|imageSmoothingEnabled\s*=\s*true/i,file);
}
console.log('PASS five-company roster, three deterministic maps, pure simulation');

function blank() {
    const w = new SimWorld();
    w.reset(4, 'gorge', 'sandbox');
    w.units = [];
    w.groups.clear();
    w.byUnit.clear();
    return w;
}

function send(w: SimWorld, action: CommandAction, faction: Faction = 0) {
    return w.step([{...action, faction, tick:w.tick}], false);
}

function advance(w: SimWorld, n: number) {
    for (let t = 0; t < n; t++) w.step([]);
}

{
    const w = blank(), p = {x:2000, y:1100};
    const a = w.spawn(0, 'line_infantry', 30, p, 'line');
    assert.equal(new Set(a.map(u => u.slot)).size, 30);
    assert.equal(new Set(a.map(u => u.group)).size, 1);
    assert.ok(new Set(a.map(u => u.y)).size > 3 || new Set(a.map(u => u.x)).size > 10);
    w.spawn(1, 'line_infantry', 30, {x:p.x+220,y:p.y}, 'line');
    advance(w, 30);
    const restored = new SimWorld();
    restored.restore(JSON.parse(JSON.stringify(w.snapshot())));
    advance(w, 210);
    advance(restored, 210);
    assert.deepEqual(w.snapshot(), restored.snapshot(), 'exact replay after JSON round trip');
    console.log('PASS unique organic company slots, deterministic in-contact replay');
}

{
    const w = blank(), p = {x:2100, y:1040};
    const a = w.spawn(0, 'line_infantry', 30, p, 'line');
    const b = w.spawn(1, 'line_infantry', 30, {x:p.x,y:p.y+160}, 'line');
    const directions = new Set<number>();
    let stationary = 0, casualties = 0, fire = 0;
    const until = TPS*4;
    const origins = new Map<number, {x:number;y:number}>();
    for (let t=0; t<until; t++) {
        const events = w.step([]);
        for (const e of events) {
            if (e.type === 'fire' && e.kind === 'line_infantry') {
                const u = w.byUnit.get(e.unitId!);
                if (u && Math.abs(u.aimY) > Math.abs(u.aimX)) directions.add(Math.sign(u.aimY));
                if (u) origins.set(u.id,{x:u.x,y:u.y});
                fire++;
            }
            if (e.type === 'death') casualties++;
        }
        for (const u of [...a,...b]) {
            const origin = origins.get(u.id);
            if (origin && u.hp>0 && !u.routed && u.pose === 'reload' && u.cooldown>5
                && Math.hypot(u.x-origin.x,u.y-origin.y)<.05) stationary++;
        }
    }
    assert.deepEqual([...directions].sort(),[-1,1]);
    assert.ok(stationary > 30, 'standing ramrod reload after firing vertically');
    assert.ok(fire>=30 && casualties>0 && casualties<fire*.5, 'sparse casualties from dense volleys');
    console.log('PASS upward/downward salvos and stationary reload:',fire,'shots,',casualties,'casualties');
}

{
    const w = blank(), keep = w.keep(0)!;
    const a = w.spawn(0,'line_infantry',30,{x:keep.x+350,y:keep.y},'line');
    send(w,{type:'rampart',payload:{}});
    let defenders = a.filter(u=>u.tower);
    for (let t=0; t<TPS*50 && defenders.length<30; t++) {
        w.step([]);
        defenders = a.filter(u=>u.tower);
    }
    assert.equal(defenders.length,30,'company reaches rampart');
    const field = w.spawn(0,'line_infantry',1,{x:keep.x+700,y:keep.y},'line')[0];
    const high=defenders[0], highHp=high.hp, fieldHp=field.hp;
    assert.ok(Math.abs(rangeOf(high)/rangeOf(field)-1.2)<1e-8);
    hit(w, high, 1, 'line_infantry', 12, 1, 0, true);
    hit(w, field, 1, 'line_infantry', 12, 1, 0, true);
    assert.ok(Math.abs((highHp-high.hp)/(fieldHp-field.hp)-.5)<1e-8);
    const target=w.spawn(1,'line_infantry',1,{x:high.x+165,y:high.y},'line')[0];
    high.cooldown=field.cooldown=0;
    attack(w, high, target);
    const elevatedShot=w.projectiles.at(-1)!;
    attack(w, field, target);
    assert.ok(Math.abs(elevatedShot.damage/w.projectiles.at(-1)!.damage-1.35)<1e-8);
    console.log('PASS walking to rampart slots, +35% attack, +20% range, 50% projectile cover');
}

{
    const w=blank(), keep=w.keep(0)!;
    const a=w.spawn(0,'line_infantry',30,{x:1900,y:keep.y},'line');
    a.slice(0,14).forEach(u=>hit(w,u,1,'field_cannon',10000,-1,0,true));
    const u=a[20];
    let old = {x:u.x,y:u.y},maxSpeed=0;
    for (let i=0;i<12;i++) {
        w.step([]);
        if (u.routed && Math.abs(u.x-keep.x)<Math.abs(old.x-keep.x)) maxSpeed=Math.max(maxSpeed,Math.hypot(u.x-old.x,u.y-old.y));
        old={x:u.x,y:u.y};
    }
    assert.ok(u.routed && maxSpeed>=UNITS.line_infantry.speed*2.05, 'routed survivors sprint towards their own fortress');
    const group=w.groups.get(u.group)!;
    for(let t=0;t<TPS*40 && (group.count!==30 || group.state!=='advance');t++)w.step([]);
    assert.equal(group.count,30,'the survivors receive replacements');
    assert.equal(group.state,'advance','the rested company can sortie again in sandbox');
    console.log('PASS immediate company rout at 14/30 losses:',(maxSpeed/UNITS.line_infantry.speed).toFixed(2)+'×');
}

{
    const w=blank(), p={x:1800,y:1100};
    const gun=w.spawn(0,'field_cannon',1,p,'line')[0];
    assert.equal(gun.crew,3);
    const enemy=w.spawn(1,'line_infantry',30,{x:p.x+250,y:p.y},'line');
    const start={x:gun.x,y:gun.y};
    gun.cooldown=0;
    attack(w,gun,enemy[15]);
    assert.ok(w.projectiles.some(e=>e.kind==='ball'));
    assert.equal(gun.cooldown/TPS,6.5);
    assert.deepEqual({x:gun.x,y:gun.y},start);
    // Give the battery a stationary, compact line to verify the ball reaches its target.
    for(const u of enemy){u.x=p.x+250+(u.slot%3)*6;u.y=p.y+(Math.floor(u.slot/3)-4)*5;}
    w.projectiles=[];gun.cooldown=0;attack(w,gun,enemy[15]);
    for(let t=0;t<30&&w.projectiles.some(p=>p.kind==='ball');t++)w.step([]);
    assert.ok(w.dead[1]>=3,'a solid shot inflicts clustered casualties');
    console.log('PASS three-person gun crew and live solid shot:',w.dead[1],'casualties');
}

{
    const w=new SimWorld(4);
    w.reset(4,'twin','lord');
    for(const f of [0,1] as const) {
        const groups=[...w.groups.values()].filter(g=>g.faction===f);
        assert.ok(groups.filter(g=>g.kind==='line_infantry').length>=2);
        assert.ok(groups.every(g=>g.state==='assemble'));
    }
    const beforeGold=w.realms[0].gold;
    const before=w.units.filter(u=>u.faction===0&&u.kind==='guard_grenadier').length;
    send(w,{type:'train',payload:{kind:'guard_grenadier'}});
    assert.equal(w.units.filter(u=>u.faction===0&&u.kind==='guard_grenadier').length-before,24);
    assert.equal(beforeGold-w.realms[0].gold,UNITS.guard_grenadier.gold);
    advance(w,240);
    assert.ok(w.realms.every(r=>r.wave>0));
    const count=w.units.length;
    advance(w,1);
    assert.ok(w.units.length>=count+30,'automatic levy spawns a full company');
    send(w,{type:'recall',payload:{}});
    assert.ok([...w.groups.values()].filter(g=>g.faction===0).every(g=>g.state==='hold'));
    send(w,{type:'charge',payload:{}});
    assert.ok([...w.groups.values()].filter(g=>g.faction===0).every(g=>g.state==='advance'));
    const company=w.units.filter(u=>u.faction===0 && u.kind==='line_infantry').slice(0,30);
    send(w,{type:'order',payload:{ids:[company[0].id],point:{x:1500,y:730}}});
    assert.deepEqual(w.groups.get(company[0].group)!.point,{x:1500,y:730});
    console.log('PASS lord muster, paid reinforcements, automated waves, recall, charge and company orders');
}

{
    // v6.1: Starfort 4 bastion cannons fire at approaching enemies & compact collision blocks keep center while allowing ramparts
    const w = blank(), keep = w.keep(0)!;
    assert.equal(w.grid.walk(keep.x, keep.y), false, 'starfort inner core has collision');
    w.spawn(1, 'guard_grenadier', 24, { x: keep.x + 520, y: keep.y }, 'line');
    w.spawn(1, 'guard_grenadier', 24, { x: keep.x + 520, y: keep.y + 120 }, 'line');
    let fortShots = 0;
    for (let t = 0; t < TPS * 8; t++) {
        const events = w.step([]);
        for (const e of events)
            if (e.type === 'fire' && e.kind === 'field_cannon' && e.faction === 0) fortShots++;
    }
    assert.ok(fortShots >= 4, `starfort bastion cannons fire independently (${fortShots} shots)`);
    console.log('PASS v6.1 starfort bastion cannons & compact obstacle collision:', fortShots, 'bastion shots');
}

{
    // v6.2: A* pathfinding routes around starfort core & river, edge-road entry, explosive vs corpse death flags
    const w = blank(), keep = w.keep(0)!;
    const path = w.grid.findPath({ x: keep.x - 220, y: keep.y }, { x: keep.x + 260, y: keep.y });
    assert.ok(path.length >= 2, 'A* routes around solid starfort core instead of straight through');
    assert.ok(path.some(pt => Math.abs(pt.y - keep.y) > 70), 'A* detours around starfort perimeter');
    const target1 = w.spawn(1, 'line_infantry', 1, { x: 2400, y: 1200 }, 'line')[0];
    const target2 = w.spawn(1, 'line_infantry', 1, { x: 2440, y: 1200 }, 'line')[0];
    w.events = [];
    hit(w, target1, 0, 'line_infantry', 999, 1, 0, true, false);
    hit(w, target2, 0, 'field_cannon', 999, 1, 0, true, true);
    const deaths = w.events.filter(e => e.type === 'death');
    assert.equal(deaths.length, 2);
    assert.equal(deaths[0].explosive, false, 'musket kill leaves intact corpse');
    assert.equal(deaths[1].explosive, true, 'cannonball kill bursts into gibs');
    console.log('PASS v6.2 A* pathfinding detour, corpse vs cannon-gib death flags');
}
