import './v4';
import assert from 'node:assert/strict';
import {SimWorld} from '../src/sim/world';
import {resolveCollisions,faceToward,radius} from '../src/sim/physics';
import {attack,hit,kill,launch} from '../src/sim/combat';
import {createMap} from '../src/sim/maps';
import {strategyTick} from '../src/sim/strategy';
import type {Faction,CommandAction} from '../src/sim/types';
function fixture(){
    const w=new SimWorld();w.reset(4,'gorge','sandbox');w.units=[];w.byUnit.clear();w.groups.clear();
    w.structures=w.structures.filter(s=>s.type!=='tree');w.dirty=true;w.step([],false);w.hash.rebuild([]);return w;
}
function order(w:SimWorld,action:CommandAction,f:Faction=0){w.step([{...action,faction:f,tick:w.tick}],false);}
{
    const w=fixture(),a=w.spawn(0,'line_infantry',1,{x:1600,y:900},'line')[0],b=w.spawn(1,'cuirassier',1,a,'line')[0];
    const old={x:a.x,y:a.y};resolveCollisions(w);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=radius(a)+radius(b));
    assert.ok(Math.hypot(a.x-old.x,a.y-old.y)>Math.hypot(b.x-old.x,b.y-old.y)*2.59);
    faceToward(a,-1);for(let i=0;i<14;i++){a.faceLock--;faceToward(a,1);assert.equal(a.face,-1);}
    console.log('PASS coincident bodies, inverse mass and facing lock');
}
{
    const w=fixture(),a=w.spawn(0,'line_infantry',120,{x:1580,y:870},'line');
    const b=w.spawn(1,'line_infantry',120,{x:1750,y:870},'line');for(const u of b)u.hp=1e6;
    for(const u of a)u.hp=1e6;
    const counts=[40,0,0,0,40,40,40];const ticks=[0,1,3,31,32,64,96];
    for(let t=0;t<=96;t++){const events=w.step([]);const shots=events.filter(e=>e.type==='fire'&&a.some(u=>u.id===e.unitId));
        if(ticks.includes(t))assert.equal(shots.length,counts[ticks.indexOf(t)],'volley '+t);
        if(shots.length)assert.ok(shots.every(e=>w.byUnit.get(e.unitId!)!.rankIndex===Math.floor((t%96)/32)));
        if(t===1||t===3)assert.ok(a.filter(u=>u.rankIndex===0).every(u=>u.pose==='kneel'));
        // Isolate cadence from projectile knockback; the separate ballistics fixtures use real impacts.
        w.projectiles=[];
    }
    const u=a[0],t=b[0];t.x=u.x+22;t.y=u.y;const hp=t.hp;attack(w,u,t);assert.equal(u.pose,'bayonet');assert.ok(t.hp<hp);
    console.log('PASS 40/40/40 rank volleys, kneeling, bayonet');
}
{
    const w=fixture(),s=w.structures.find(n=>n.type==='farmhouse')!,a=w.spawn(0,'line_infantry',66,s,'line');
    for(const u of a){u.x=s.x+s.w/2+10;u.y=s.y;}
    order(w,{type:'garrison',payload:{tower:s.id,ids:a.map(u=>u.id)}});
    w.step([]);const defenders=a.filter(u=>u.tower===s.id);assert.equal(defenders.length,60);
    const u=defenders[0],hp=u.hp;hit(w,u,1,'cuirassier',80,1,0,8);assert.equal(u.hp,hp);
    const field=a.find(n=>!n.tower)!;const hp2=field.hp;hit(w,u,1,'line_infantry',10,1,0);hit(w,field,1,'line_infantry',10,1,0);
    assert.ok(Math.abs((hp-u.hp)/(hp2-field.hp)-.35)<1e-8);
    const gun=w.spawn(1,'howitzer',1,{x:s.x+200,y:s.y},'line')[0];s.hp=200;
    attack(w,gun,s);for(let i=0;i<20&&s.hp>0;i++)w.step([]);
    assert.equal(s.hp,0);assert.equal(defenders.filter(u=>u.hp>0).length,30);assert.ok(defenders.every(u=>!u.tower));
    console.log('PASS 60 seats, cover, cavalry immunity, howitzer collapse and survivors');
}
{
    const w=fixture(),p={x:972,y:880},a=w.spawn(0,'line_infantry',120,p,'line');
    a.slice(14).forEach(u=>u.hp=0);strategyTick(w);const g=w.groups.get(a[0].group)!;assert.ok(g.resting);
    const reinforcements=w.spawn(0,'line_infantry',30,p,'line');
    for(let i=0;i<500;i++)w.step([]);assert.equal(a[0].group,reinforcements[0].group);
    for(let i=0;i<3;i++)w.reinforce(0,'line_infantry',30,p);
    const n=w.units.filter(u=>u.group===a[0].group).length;assert.equal(n,120);
    assert.equal(new Set(w.units.filter(u=>u.group===a[0].group).map(u=>u.slot)).size,120);
    console.log('PASS shattering, rest, merging and regiment overflow');
}
{
    const w=fixture(),p={x:1450,y:970};
    const guns=w.spawn(0,'field_cannon',1,p,'line'),gun=guns[0],foe=w.spawn(1,'hussar',1,{x:p.x+120,y:p.y},'line')[0];
    attack(w,gun,foe);assert.equal(w.projectiles.length,6);w.projectiles=[];w.realms[0].grape=true;attack(w,gun,foe);assert.equal(w.projectiles.length,12);
    const a=w.spawn(1,'line_infantry',120,{x:1800,y:880},'square'),horse=w.spawn(0,'cuirassier',1,{x:a[0].x-20,y:a[0].y},'line')[0];horse.charge=65;w.hash.rebuild(w.units);attack(w,horse,a[0]);assert.ok(horse.hp<100);
    const save=w.snapshot(),clone=fixture();clone.restore(save);
    for(let i=0;i<25;i++){w.step([]);clone.step([]);}assert.deepEqual(w.snapshot(),clone.snapshot());
    console.log('PASS grape upgrade, square, deterministic snapshot replay');
}
for(const map of ['twin','darkwood','gorge'] as const){
    const features=createMap(map);assert.deepEqual(features,createMap(map));
    assert.equal(new Set(features.filter(s=>s.type==='tree').map(s=>s.treeArt)).size,4);
}
console.log('PASS three reproducible forest maps');

{
    const w=fixture(),p={x:1450,y:880};
    const troops=[...w.spawn(0,'line_infantry',120,p,'line'),...w.spawn(1,'line_infantry',120,p,'line'),...w.spawn(0,'cuirassier',40,p,'line')];
    resolveCollisions(w);
    for(let i=0;i<troops.length;i++)for(let j=i+1;j<troops.length;j++){
        const a=troops[i],b=troops[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=radius(a)+radius(b)-.00001);
    }
    console.log('PASS 280 overlapping infantry and cavalry resolved on legal ground');
}
{
    const w=fixture();w.mode='lord';w.player=0;w.realms[0].wood=w.realms[0].gold=10000;
    const home=w.keep(0)!,farm=w.structures.find(s=>s.type==='house'&&s.faction===0)!;
    order(w,{type:'train',payload:{kind:'field_cannon'}});assert.equal(home.queue?.length??0,0);
    order(w,{type:'train',payload:{kind:'guard_grenadier'}});assert.equal(home.queue?.length??0,0);
    order(w,{type:'cottage',payload:{}});assert.equal(farm.age,2);
    w.mode='sandbox';
    const worker=w.spawn(0,'sapper',1,{x:1480,y:880},'line')[0];
    for(const [kind,x] of [['academy',1500],['barracks',1650],['foundry',1850]] as const)order(w,{type:'build',payload:{kind,x,y:1000}});
    w.mode='lord';
    for(const tech of ['powder','steel','grape'] as const){order(w,{type:'research',payload:{tech}});assert.equal(w.realms[0][tech],true);}
    order(w,{type:'train',payload:{kind:'guard_grenadier',full:true}});assert.equal(home.queue?.length,1);
    w.mode='sandbox';let delivery=false;
    for(let t=0;t<620;t++){
        w.step([]);if(w.units.some(n=>n.kind==='supply_wagon'&&n.returning))delivery=true;
    }
    assert.ok(delivery,'wagon reaches keep');assert.equal(w.units.filter(u=>u.kind==='guard_grenadier').length,90);
    for(let i=3;i<=4;i++){order(w,{type:'cottage',payload:{}});assert.equal(w.realms[0].age,i);}
    console.log('PASS farm T1–T4, wagon delivery, academy technologies, foundry and guard gates');
}

{
    const w=fixture(),farm=w.structures.find(s=>s.type==='farmhouse')!,p={x:2060,y:1010};
    order(w,{type:'build',payload:{kind:'redoubt',...p}});assert.ok(!w.structures.some(s=>s.type==='redoubt'));
    farm.faction=0;w.spawn(0,'rifleman',5,farm,'line',farm.id);
    w.mode='lord';w.player=0;w.spawn(0,'sapper',1,{x:p.x-82,y:p.y},'line');
    order(w,{type:'build',payload:{kind:'redoubt',...p}});
    const fort=w.structures.find(s=>s.type==='redoubt')!;assert.ok(fort?.needed);
    for(let i=0;i<180&&fort.needed;i++)w.step([]);assert.equal(fort.needed,0);
    const gun=w.spawn(0,'howitzer',1,{x:fort.x-120,y:fort.y+40},'line')[0];
    for(let i=0;i<300&&!gun.deployed;i++)w.step([]);assert.ok(gun.deployed);assert.ok(Math.abs(gun.x-(fort.x-70))<12);
    launch(w,gun,1,0,12);assert.equal(gun.z,0);
    for(const crew of w.units.filter(n=>n.gun===gun.id))kill(w,crew,1,'rifleman');
    assert.equal(gun.crew,0);const n=w.projectiles.length;attack(w,gun,farm);assert.equal(w.projectiles.length,n);
    const wagon=w.spawn(1,'supply_wagon',1,{x:3150,y:1100},'line')[0];kill(w,wagon,0,'hussar');assert.ok(w.drops.length>=8);
    console.log('PASS frontline construction, mobile gun post, crew loss, wagon raid');
}
{
    const w=new SimWorld();const tree=w.structures.find(t=>t.type==='tree'&&t.x>1400&&t.x<1700)!;
    const before=w.grid.walk(tree.x,tree.y,0);assert.equal(before,false);w.damageStructure(tree,tree.hp,0,'sapper');w.step([],false);assert.ok(w.grid.walk(tree.x,tree.y,0));
    console.log('PASS tree removal opens navigation');
}
