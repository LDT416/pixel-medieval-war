// node tests/profile-switch.mjs. Count performance.now calls during 600 step() calls
// including deployment and combat, with profiling off and on. Hash the JSON of every
// unit's [x,y,hp] in array order; both runs must match. Initialization is excluded.
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const r=await build({entryPoints:['src/sim/world.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].contents).toString('base64'));
const clock=globalThis.performance;
const summaries=[];
for(const profiled of [false,true]){
    const w=new SimWorld(1200,7919);w.profile=profiled?{}:null;let calls=0;
    try{
        Object.defineProperty(globalThis,'performance',{configurable:true,value:{now(){calls++;return clock.now()}}});
        for(let i=0;i<600;i++)w.step();
    } finally {Object.defineProperty(globalThis,'performance',{configurable:true,value:clock})}
    const signature=createHash('sha256').update(JSON.stringify(w.units.map(u=>[u.x,u.y,u.hp]))).digest('hex');
    if(!profiled)assert.equal(calls,0);else assert.equal(Object.keys(w.profile).length,6);
    summaries.push(signature);
    console.log(JSON.stringify({profiled,tick:w.tick,calls,phases:w.profile&&Object.keys(w.profile),signature}));
}
assert.equal(summaries[0],summaries[1]);
