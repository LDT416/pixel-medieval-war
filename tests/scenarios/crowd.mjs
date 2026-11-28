import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world';export {formUp} from './src/sim/strategy'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld,formUp}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function run(){
    const w=new SimWorld(1200,42),companies=w.companies.filter(c=>c.kind==='line_infantry').slice(0,2);
    const row=companies[0].members.slice(0,6),relief=companies[1].members.slice(0,3);
    w.units=[...row,...relief];w.crowd.reset({...w.layout,farms:[],woods:[]});
    row.forEach((u,i)=>{u.x=800;u.y=600+[-45,-35,-25,25,35,45][i];});
    relief.forEach((u,i)=>{u.x=735;u.y=600+(i-1)*12;});
    w.crowd.step(w);
    let peak=0,crossed=0;
    for(let frame=1;frame<=100;frame++){
        w.tick=frame;
        for(const u of relief)u.x+=1.5;
        if(frame>60)for(const u of row)u.x-=1;
        w.crowd.step(w);peak=Math.max(peak,w.crowd.overlaps(w));
        if(frame===50)crossed=relief.filter(u=>u.x>800&&Math.abs(u.y-600)<25).length;
    }
    assert.equal(crossed,3);assert.equal(peak,0);assert.ok(row.every(u=>u.x<770));
    return {crossed,peak,final:w.units.map(u=>[u.x,u.y])};
}
const first=run();assert.deepEqual(run(),first);
console.log('S9 controlled passage',JSON.stringify(first));

// Exercise the same local geometry with and without an opening in the route.
function farmWalk(y){
    const w=new SimWorld(1200,42),u=w.units.find(v=>v.kind==='line_infantry');
    w.units=[u];w.crowd.reset({...w.layout,woods:[],ridgeOwner:1,farms:[{x:900,y:800,w:190,h:140}]});
    u.x=770;u.y=y;w.crowd.step(w);
    for(let i=0;i<70;i++){w.tick++;u.x+=1.4;w.crowd.step(w);}
    return u.x;
}
const gate=farmWalk(800),wall=farmWalk(845);
assert.ok(gate>850 && wall<808,'courtyard accessible through gate, blocked along fence');
const w=new SimWorld(1200,42),gun=w.units.find(u=>u.kind==='field_cannon');
w.units=[gun];w.crowd.reset({...w.layout,woods:[],farms:[]});
gun.x=500;gun.y=500;w.crowd.step(w);w.tick=w.deployEnd+1;
gun.x=510;w.crowd.step(w);assert.equal(gun.x,500);
w.companies[gun.company].limbered=true;gun.x=510;w.crowd.step(w);assert.ok(gun.x>500);
console.log(JSON.stringify({gate,wall,limberedX:gun.x}));

// The initial square and subsequent reshapes share a slot coordinate function.
const squares=new SimWorld(1200,42);
const template=squares.companies.find(c=>c.kind==='line_infantry'&&c.line!==6);
for(let n=1;n<=64;n++){
    const c={...template,x:1000,y:1000,line:0,hx:1,hy:0,formation:'square',
        members:Array.from({length:n},()=>({...template.members[0],jx:0,jy:0}))};
    formUp(c);
    for(let i=0;i<n;i++)for(let j=0;j<i;j++){
        const a=c.members[i],b=c.members[j];
        assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=13,'square size '+n+' has conflicting slots '+i+' and '+j);
    }
}
console.log('Square layout: 1–64 members, minimum spacing 13px.');

// The longer axis of a turning neighbour can enter an already parked walker's space.
const turning=new SimWorld(1200,42);
const walker=turning.units.find(u=>u.kind==='line_infantry');
const mount=turning.units.find(u=>u.kind==='cuirassier' && !u.staff);
const parked=turning.units.find(u=>u.kind==='field_cannon');
const group=turning.companies[mount.company];
turning.units=[walker,mount];
turning.crowd.reset({...turning.layout,woods:[],farms:[]});
Object.assign(group,{hx:0,hy:1});
Object.assign(walker,{x:512,y:600});
Object.assign(mount,{x:500,y:600});
turning.crowd.step(turning);
assert.equal(turning.crowd.overlaps(turning),0);
Object.assign(group,{hx:1,hy:0});
for(let n=0;n<5;n++){ turning.tick++;turning.crowd.step(turning); }
assert.ok(walker.x>512,'parked walker makes room for the turning footprint');
assert.equal(turning.crowd.overlaps(turning),0);

// Two equal heavy footprints share the correction after turning from narrow to broad.
const horses=turning.companies.filter(c=>c.kind==='cuirassier' && c.line!==5).slice(0,2);
const mounts=horses.map(c=>c.members.find(u=>u.body.a!==u.body.b));
turning.units=mounts;
turning.crowd.reset({...turning.layout,woods:[],farms:[]});
horses.forEach(c=>Object.assign(c,{hx:0,hy:1}));
mounts.forEach((u,i)=>Object.assign(u,{x:640+12*i,y:700}));
turning.crowd.step(turning);
assert.equal(turning.crowd.overlaps(turning),0);
horses.forEach(c=>Object.assign(c,{hx:1,hy:0}));
assert.equal(turning.crowd.overlaps(turning),1);
for(let n=0;n<4;n++){turning.tick++;turning.crowd.step(turning);}
assert.equal(turning.crowd.overlaps(turning),0,'equal-mass mounts resolve a turn in four ticks');
assert.ok(mounts[0].x<639 && mounts[1].x>653,'both movable bodies contribute');

// A parked 14px footprint can reach across a bin boundary beyond the old 11.5px search radius.
turning.units=[parked,walker];
turning.crowd.reset({...turning.layout,woods:[],farms:[]});
turning.companies[parked.company].limbered=false;
turning.tick=turning.deployEnd+1;
Object.assign(parked,{x:520.1,y:720});
Object.assign(walker,{x:501,y:720});
turning.crowd.step(turning);
turning.tick++;walker.x=503.8;turning.crowd.step(turning);
assert.ok(Math.hypot(walker.x-parked.x,walker.y-parked.y)>=walker.body.a+parked.body.a-1e-6,'the next bin is within the actual contact radius');
assert.equal(parked.x,520.1);
console.log('Turned and adjacent-bin footprints resolved.');
