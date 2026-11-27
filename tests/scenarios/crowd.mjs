import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function run(){
    const w=new SimWorld(600,42),companies=w.companies.filter(c=>c.kind==='line_infantry').slice(0,2);
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
    const w=new SimWorld(600,42),u=w.units.find(v=>v.kind==='line_infantry');
    w.units=[u];w.crowd.reset({...w.layout,woods:[],ridgeOwner:1,farms:[{x:900,y:800,w:190,h:140}]});
    u.x=770;u.y=y;w.crowd.step(w);
    for(let i=0;i<70;i++){w.tick++;u.x+=1.4;w.crowd.step(w);}
    return u.x;
}
const gate=farmWalk(800),wall=farmWalk(845);
assert.ok(gate>850 && wall<808,'courtyard accessible through gate, blocked along fence');
const w=new SimWorld(600,42),gun=w.units.find(u=>u.kind==='field_cannon');
w.units=[gun];w.crowd.reset({...w.layout,woods:[],farms:[]});
gun.x=500;gun.y=500;w.crowd.step(w);w.tick=w.deployEnd+1;
gun.x=510;w.crowd.step(w);assert.equal(gun.x,500);
w.companies[gun.company].limbered=true;gun.x=510;w.crowd.step(w);assert.ok(gun.x>500);
console.log(JSON.stringify({gate,wall,limberedX:gun.x}));
