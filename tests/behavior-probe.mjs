import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
if(isMainThread){
    const source=(await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false})).outputFiles[0].text;
    const count=Number(process.env.SEEDS??20),tasks=Math.min(count,4),rows=[];
    await Promise.all(Array.from({length:tasks},(_,lane)=>new Promise((resolve,reject)=>{
        const seeds=Array.from({length:count},(_,i)=>i+1).filter((_,i)=>i%tasks===lane);
        const job=new Worker(new URL(import.meta.url),{workerData:{source,seeds}});
        job.on('message',row=>rows.push(row));job.on('error',reject);
        job.on('exit',code=>code?reject(Error('worker '+code)):resolve());
    })));
    rows.sort((a,b)=>a.seed-b.seed);assert.equal(rows.length,count);
    for(const row of rows)console.log(JSON.stringify(row));
    const total=key=>rows.reduce((s,r)=>s+r[key],0);
    console.log(JSON.stringify({games:rows.length,engagedToggles:total('engagedToggles'),actualHandovers:total('handovers'),refilledRounds:total('refilled'),squareTransitions:total('flips'),within4s:total('quick'),worstPerCompanyIn30s:Math.max(...rows.map(r=>r.worst))}));
}else{
    const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(workerData.source).toString('base64'));
    for(const ordinal of workerData.seeds){
        const w=new SimWorld(1200,ordinal*7919),last=new Map(),recent=new Map(),engaged=new Map();let engagedToggles=0,flips=0,quick=0,worst=0;
        while(!w.ended){
            w.step();
            for(const c of w.companies){
                if(c.status==='gone')continue;
                if(c.kind!=='cuirassier'){
                    if(engaged.has(c.id)&&engaged.get(c.id)!==c.engaged)engagedToggles++;
                    engaged.set(c.id,c.engaged);
                }
                const was=last.get(c.id);
                if(was && was!==c.formation && (was==='square'||c.formation==='square')){
                    const history=(recent.get(c.id)??[]).filter(t=>t>w.tick-900);
                    if(history.length && w.tick-history.at(-1)<120)quick++;
                    history.push(w.tick);recent.set(c.id,history);worst=Math.max(worst,history.length);flips++;
                }
                last.set(c.id,c.formation);
            }
        }
        parentPort.postMessage({seed:w.seed,handovers:w.logistics.handovers.length,refilled:w.logistics.resupplied,engagedToggles,flips,quick,worst,ballistics:w.ballistics.stats});
    }
}
