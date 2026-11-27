import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const w=new SimWorld(1200,Number(process.argv[2]??23757));
let sum=0,samples=0,peak=0,steadySum=0,steadySamples=0;
while(w.winner===null){
    w.step();
    if(w.tick%30===0 && w.tick>w.deployEnd){
        const n=w.crowd.overlaps(w);sum+=n;samples++;peak=Math.max(peak,n);
        if(!w.companies.some(c=>c.sprintUntil>w.tick)){steadySum+=n;steadySamples++;}
    }
}
console.log(JSON.stringify({samples,mean:sum/samples,peak,steadySamples,steadyMean:steadySum/steadySamples,jitter:w.jitter}));
assert.ok(steadySamples>0 && steadySum/steadySamples<=1,'稳定帧每秒平均超限对数应不超过1');
