import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
import {availableParallelism} from 'node:os';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';

const bundle=isMainThread?(await build({stdin:{contents:"export * from './src/sim/world';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false})).outputFiles[0].text:workerData.bundle;
const {SimWorld,TIMEOUT,PURSUIT}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const sum=values=>values.reduce((a,b)=>a+b,0);
const mean=values=>sum(values)/values.length;
const median=values=>{const a=[...values].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};

function battle(world,inspect=false){
    let hits=0,deaths=0,cannonDeaths=0,moved=false;
    const times=[];
    while(!world.ended&&world.tick<TIMEOUT+PURSUIT+60){
        const t=inspect?performance.now():0;world.step();if(inspect)times.push(performance.now()-t);
        for(const e of world.events){
            if(e.type==='hit')hits++;
            if(e.type==='death'){deaths++;if(e.explosive)cannonDeaths++;}
        }
        if(inspect&&world.tick%10===0)for(const u of world.units){
            assert.ok(Number.isFinite(u.x+u.y+u.vx+u.vy),'finite position');
            assert.ok(u.x>=0&&u.x<world.layout.width&&u.y>=0&&u.y<world.layout.height,'in bounds');
            moved||=u.moving;
        }
    }
    assert.ok(world.ended&&[0,1].includes(world.winner));
    assert.ok(world.turningPoints.length>=1);
    assert.equal(world.timeline.length,Math.floor(world.tick/30));
    assert.equal(sum(world.dead)+sum(world.fled)+sum(world.alive),sum(world.start)+sum(world.reinforced),'troop accounting');
    if(inspect)assert.ok(moved&&hits>0);
    assert.ok(deaths>0);
    const loser=1-world.winner,dead=world.dead[loser],fled=world.fled[loser],routing=world.routing(loser);
    const failedGenerals=world.generals.filter(g=>!g.alive).map(g=>g.name);
    const sectorNews=[0,0,0],majorNews=world.news.filter(n=>n.weight>=2);
    for(const n of majorNews)sectorNews[Math.max(0,Math.min(2,Math.floor(n.y*3/world.layout.height)))]++;
    const row={seed:world.seed,weather:world.weather,scale:world.scale,winner:world.winner,endSeconds:world.endTick/30,reason:world.reason,
        dead:[...world.dead],fled:[...world.fled],initial:[...world.start],reinforced:[...world.reinforced],loserRouting:routing,
        loserLossFraction:(dead+fled+routing)/world.start[loser],failedGenerals,deaths,cannonDeaths,cannonShare:cannonDeaths/deaths,sectorNews};
    times.sort((a,b)=>a-b);
    return {row,p99:inspect?times[Math.floor(times.length*.99)]:0,avg:inspect?mean(times):0};
}
function signature(w){return JSON.stringify(w.turningPoints)+w.units.map(u=>u.hp+','+u.x.toFixed(2)+','+u.y.toFixed(2)).join(';');}
if(!isMainThread){
    const world=new SimWorld(1200,42);
    for(const i of workerData.seeds){world.reset(1200,i*7919);parentPort.postMessage(battle(world).row);}
}else{
    const baseline=[],failures=[];
    const check=(ok,name)=>{if(!ok)failures.push(name);};
    const world=new SimWorld(1200,7);
    assert.equal(world.layout.width,16000);assert.equal(world.layout.height,8000);
    for(const scale of [1200,2400,3600]){
        world.reset(scale,42);assert.deepEqual(world.alive,[scale/2,scale/2]);
        const {row,p99,avg}=battle(world,true),jitter=world.jitter;
        console.log(scale,row.endSeconds.toFixed(1)+'s',row.reason,'avg',avg.toFixed(2)+'ms','p99',p99.toFixed(2)+'ms');
        if(scale===1200)check(jitter.flipsPerSec<.05&&jitter.poseTogglesPerSec<.1&&jitter.slotSwapsPerDeath<=2,'jitter');
        if(scale===3600)check(p99<8,'3600-unit tick p99');
        baseline.push({scale,p99,avg,jitter});
        if(scale<3600){
            const first=signature(world);world.reset(scale,42);battle(world);
            assert.equal(signature(world),first,'deterministic replay');
        }
    }
    const sample=Number(process.env.SEEDS||24),workers=Math.max(1,Math.min(sample,Number(process.env.CAMPAIGN_WORKERS||Math.min(8,availableParallelism()-1))));
    const rows=[];
    await Promise.all(Array.from({length:workers},(_,k)=>new Promise((resolve,reject)=>{
        const seeds=Array.from({length:sample},(_,i)=>i+1).filter(i=>(i-1)%workers===k);
        const worker=new Worker(new URL(import.meta.url),{workerData:{seeds,bundle}});
        worker.on('message',r=>{rows.push(r);console.log('seed',r.seed,r.endSeconds.toFixed(0)+'s','winner',r.winner,'loss',r.loserLossFraction.toFixed(3),'cannon',r.cannonShare.toFixed(3),r.reason);});
        worker.on('error',reject);worker.on('exit',code=>code?reject(Error('Campaign worker exited '+code)):resolve());
    })));
    rows.sort((a,b)=>a.seed-b.seed);assert.equal(rows.length,sample);
    const stats={seeds:sample,medianSeconds:median(rows.map(r=>r.endSeconds)),minSeconds:Math.min(...rows.map(r=>r.endSeconds)),maxSeconds:Math.max(...rows.map(r=>r.endSeconds)),
        loserLossFraction:mean(rows.map(r=>r.loserLossFraction)),generalDeathFraction:mean(rows.map(r=>Number(r.failedGenerals.length>0))),
        wins:[0,1].map(f=>rows.filter(r=>r.winner===f).length),cannonShare:mean(rows.map(r=>r.cannonShare)),pooledCannonShare:sum(rows.map(r=>r.cannonDeaths))/sum(rows.map(r=>r.deaths))};
    const destination=process.env.CAMPAIGN_REPORT;
    if(destination){
        mkdirSync('docs/shots/W1',{recursive:true});
        writeFileSync(destination,JSON.stringify({rules:{duration:'victory tick / 30, excludes pursuit animation',loserLoss:'(dead + escaped + remaining routing) / starting loser strength',generalDeaths:'games with at least one fallen commander in chief / games',cannonShare:'unweighted mean of cannon death fractions per game; pooled ratio also reported'},stats,baseline,rows,failures},null,2));
    }
    console.log(stats);assert.deepEqual(failures,[]);console.log('Battle assertions passed.');
}
