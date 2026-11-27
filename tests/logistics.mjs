import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
const packed=await build({stdin:{contents:"export * from './src/sim/world';export * from './src/sim/maps';export * from './src/sim/rng';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld,createCampaignLayout,movementAt,riverAt,Rng}=await import('data:text/javascript;base64,'+Buffer.from(packed.outputFiles[0].text).toString('base64'));
const report={maps:0,deployed:0};
for(let seed=1;seed<=80;seed++){
    const l=createCampaignLayout(new Rng(seed*7919),seed%2);
    assert.deepEqual(l,createCampaignLayout(new Rng(seed*7919),seed%2));
    assert.equal(l.width,16000);assert.equal(l.height,8000);
    assert.ok(l.farms.length>=2&&l.farms.length<=3);assert.ok(l.bridges.length>=1&&l.bridges.length<=2);
    assert.ok(l.woods.length>=2&&l.woods.length<=4);assert.ok(l.ridges.length>=1&&l.ridges.length<=2);
    for(const b of l.bridges){
        assert.equal(b.x,riverAt(b.y,l));assert.equal(movementAt(b.x,b.y,l),b.kind==='bridge'?1.3:.78);
    }
    assert.equal(movementAt(riverAt(0,l),0,l),.45);assert.equal(movementAt(l.roads[0].points[0].x,l.roads[0].points[0].y,l),1.3);
    report.maps++;
}
for(const scale of [600,1200,1800]){
    for(let seed=1;seed<=15;seed++){
        const w=new SimWorld(scale,seed*7919),s=w.logistics;
        assert.equal(s.corps.length,6);assert.equal(s.wagons.length,6);
        const ids=new Set();
        for(const b of s.brigades){
            assert.ok(b.companies.length>=3&&b.companies.length<=5);assert.ok(w.units[b.commanderId].hp>0);
            for(const id of b.companies){
                assert.equal(w.companies[id].brigade,b.id);assert.equal(w.companies[id].corps,b.corps);assert.ok(!ids.has(id));ids.add(id);
            }
        }
        assert.equal(ids.size,w.companies.filter(c=>c.line!==5).length);report.deployed++;
    }
}
// 控制布置：单独推进后勤时钟，验证命令延迟与截获不受导演下一轮命令影响。
const w=new SimWorld(1200,7919),l=w.logistics;
const c=w.companies.find(c=>c.line===0&&c.faction===0),hq=w.generals[0].unit;
hq.x=1000;hq.y=1000;c.x=1300;c.y=1000;c.order='hold';
const advance=n=>{for(let i=0;i<n;i++){w.tick++;l.step(w);}};
const order=l.dispatch(w,c,'advance');assert.equal(l.dispatch(w,c,'advance'),order);advance(44);assert.equal(c.order,'hold');advance(1);assert.equal(c.order,'advance');
report.deliveryTicks=45;report.deliveryPixels=300;
const enemy=w.units.find(u=>u.faction===1&&u.kind==='cuirassier'&&!u.staff);
enemy.x=1150;enemy.y=1000;w.hash.rebuild(w.units);
l.dispatch(w,c,'reserve');advance(30);assert.equal(c.order,'advance');assert.equal(l.lost,1);report.intercepted=l.lost;
const v=l.wagons.find(v=>v.id===c.corps);
c.x=v.x;c.y=v.y;c.vx=c.vy=0;c.engaged=false;
const u=c.members.find(u=>u.ammo===40);const original=v.stock;u.ammo=30;c.ammo-=10;
advance(30);assert.equal(u.ammo,34);assert.equal(v.stock,original-4);report.supplyRound=original-v.stock;
c.vx=10;advance(30);const marching=c.fatigue;assert.ok(marching>0);c.vx=0;advance(30);assert.ok(c.fatigue<marching);
enemy.x=v.x;enemy.y=v.y;w.hash.rebuild(w.units);advance(30);assert.ok(v.destroyed&&v.stock===0);report.wagonsRaided=1;
const g=new SimWorld(1800,42),s=g.logistics;
const front=g.companies.find(c=>c.line===0&&g.companies.some(r=>r.faction===c.faction&&r.sector===c.sector&&r.line===1&&r.kind==='line_infantry'));
const reserve=g.companies.find(r=>r.faction===front.faction&&r.sector===front.sector&&r.line===1&&r.kind==='line_infantry');
const depot=s.wagons.find(v=>v.id===front.corps);front.ammo=0;for(const u of front.members)u.ammo=0;
front.x=4000;front.y=3000;reserve.x=4400;reserve.y=3100;
const chief=g.generals[front.faction].unit;chief.x=4500;chief.y=3100;
assert.equal(s.requestRelief(g,front,g.companies.find(c=>c.faction!==front.faction)),false);
assert.ok(s.requestRelief(g,front,reserve));
for(let i=0;i<150;i++){g.tick++;s.step(g);}
assert.ok(s.isRelieving(reserve));assert.equal(front.line,0);assert.equal(s.rotations,0,'first line waits for actual relief');
for(let i=0;i<1800&&!s.isResting(front);i++){
    g.tick++;s.step(g);
    const dx=reserve.homeX-reserve.x,dy=reserve.homeY-reserve.y,d=Math.hypot(dx,dy);
    if(d>0){reserve.x+=dx/d*Math.min(2,d);reserve.y+=dy/d*Math.min(2,d);}
}
assert.ok(s.isResting(front));assert.equal(front.line,1);assert.equal(reserve.line,0);assert.equal(s.handovers.length,1);
assert.ok(s.handovers[0].distance<=105);assert.notEqual(front.homeY,depot.y,'first line exits via a side gap');
front.x=front.homeX;front.y=front.homeY;
for(let i=0;i<30;i++){g.tick++;s.step(g);}
assert.equal(front.homeX,depot.x);assert.equal(front.homeY,depot.y);
report.rotation={front:front.id,reserve:reserve.id,deliveries:s.delivered,distance:s.handovers[0].distance};
const dir='docs/shots/T9';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/logistics.json',JSON.stringify(report,null,2));console.log(report);
