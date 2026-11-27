import assert from 'node:assert/strict';
import {availableParallelism} from 'node:os';
import {createHash} from 'node:crypto';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {build} from 'esbuild';

const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0,16);
if(isMainThread){
    const jobs=Number(process.env.JOBS??Math.min(4,availableParallelism()));
    assert.ok(Number.isInteger(jobs)&&jobs>0,'JOBS 必须为正整数');
    const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
    const source=bundle.outputFiles[0].text;
    const chunks=Array.from({length:Math.min(20,jobs)},()=>[]);
    for(let i=0;i<20;i++)chunks[i%chunks.length].push((i+1)*7919);
    const rows=(await Promise.all(chunks.map(seeds=>new Promise((resolve,reject)=>{
        const w=new Worker(new URL(import.meta.url),{workerData:{source,seeds}}),results=[];
        w.on('message',row=>{results.push(row);console.log(JSON.stringify(row));});
        w.once('error',reject);w.once('exit',code=>code?reject(Error('子进程退出 '+code)):resolve(results));
    })))).flat();
    assert.equal(rows.length,40);
    const victories=rows.filter(r=>r.winner!==r.legacySide).length;
    const sideWins=[0,1].map(side=>rows.filter(r=>r.legacySide!==side&&r.winner===side).length);
    const report={engine:createHash('sha256').update(source).digest('hex').slice(0,12),pairedSeeds:20,battles:rows.length,modernVictories:victories,modernByFaction:sideWins,modernWinRate:victories/rows.length};
    console.log(JSON.stringify(report));assert.ok(report.modernWinRate>=.65,'新导演胜率应至少65%');
}else{
    const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(workerData.source).toString('base64'));
    for(const seed of workerData.seeds){
        let fixture;
        for(const legacySide of [0,1]){
            const w=new SimWorld(1200,seed,legacySide);
            assert.equal(w.plans?.length,2,'当前引擎缺少战前计划');
            assert.equal(w.legacySide,legacySide,'旧导演必须实际控制指定一侧');
            assert.deepEqual(w.plans.map(p=>p.legacy),[legacySide===0,legacySide===1],'仅测试指定一方使用保留的旧计划');
            const terrain=w.layout,roster=w.units.map(u=>[u.faction,u.kind,u.hp]);
            const initial=digest([w.weather,terrain.width,terrain.height,terrain.farms,terrain.river,terrain.bridges,terrain.woods,terrain.ridges,w.posture,roster]);
            if(legacySide===0)fixture=initial;else assert.equal(initial,fixture,'交换导演时地图和兵力应一致');
            while(!w.ended)w.step();
            assert.ok(w.winner===0||w.winner===1);
            parentPort.postMessage({seed,legacySide,fixture:initial,winner:w.winner,seconds:w.endTick/30,reason:w.reason});
        }
    }
}
