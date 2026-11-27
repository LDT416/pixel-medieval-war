import {availableParallelism} from 'node:os';
import {createHash} from 'node:crypto';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {build} from 'esbuild';

export async function probeBattles(mode){
    const seeds=Number(process.env.SEEDS??40),jobs=Number(process.env.JOBS??Math.min(4,availableParallelism()));
    if(!Number.isInteger(seeds)||seeds<1||!Number.isInteger(jobs)||jobs<1)throw Error('SEEDS 与 JOBS 必须是正整数');
    const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
    const source=bundle.outputFiles[0].text,signature=createHash('sha256').update(source).digest('hex').slice(0,12);
    const options=mode==='noAssault'?[0,1]:[null],runs=[];
    for(let i=1;i<=seeds;i++)for(const disabled of options)runs.push({seed:i*7919,disabled});
    const chunks=Array.from({length:Math.min(jobs,runs.length)},()=>[]);
    runs.forEach((run,i)=>chunks[i%chunks.length].push(run));
    const results=(await Promise.all(chunks.map(chunk=>new Promise((resolve,reject)=>{
        const worker=new Worker(new URL(import.meta.url),{workerData:{source,runs:chunk}});
        worker.once('message',resolve);worker.once('error',reject);
        worker.once('exit',code=>{if(code!==0)reject(Error('探针工作线程退出 '+code));});
    })))).flat().sort((a,b)=>a.seed-b.seed||a.disabled-b.disabled);
    return {seeds,signature,results};
}
if(!isMainThread){
    const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(workerData.source).toString('base64'));
    const results=[];
    for(const {seed,disabled} of workerData.runs){
        const w=new SimWorld(1200,seed);
        if(disabled!==null)w.noAssault[disabled]=true;
        let illegalOrders=0;
        while(!w.ended){
            w.step();
            if(disabled!==null && w.companies.some(c=>c.faction===disabled && c.order==='assault' && (c.kind==='line_infantry'||c.kind==='guard_grenadier')))illegalOrders++;
        }
        const counts={break:0,repulsed:0,melee:0};
        for(const q of w.charges)if(q.fresh)counts[q.outcome]++;
        results.push({seed,disabled,winner:w.winner,illegalOrders,counts});
    }
    parentPort.postMessage(results);
}
