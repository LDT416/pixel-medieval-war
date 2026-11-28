import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const bundle=await build({entryPoints:['src/sim/world.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {SimWorld,TIMEOUT,PURSUIT}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
function signature(w) {
    const state=[
        w.tick,w.rng.state,w.alive,w.dead,w.fled,w.winner,w.reason,w.marchCohesion.stats,
        w.layout.objectives,w.battalions,w.news,
        w.companies.map(c=>[c.id,c.x,c.y,c.gx,c.gy,c.homeX,c.homeY,c.order,c.status,c.formation,c.alive]),
        w.units.map(u=>[u.id,u.x,u.y,u.vx,u.vy,u.hp,u.pose,u.slot])
    ];
    return createHash('sha256').update(JSON.stringify(state)).digest('hex');
}
function play(w,limit) {
    const checkpoints=[signature(w)];
    const previous=w.companies.map(c=>({x:c.x,y:c.y}));
    while (!w.ended && w.tick<limit) {
        w.step();
        if(w.tick<=w.deployEnd) {
            for(const c of w.companies) {
                const p=previous[c.id],travel=Math.hypot(c.x-p.x,c.y-p.y);
                assert.ok(travel<=5.5,'opening center jumped at tick '+w.tick+' / company '+c.id);
                p.x=c.x;p.y=c.y;
            }
            if(w.tick===w.deployEnd) for(const plan of w.plans) for(const d of plan.destinations) {
                const c=w.companies[d.company];
                assert.ok(Math.hypot(c.x-d.x,c.y-d.y)<.001,'company missed its arrival');
            }
        }
        if(w.tick===w.deployEnd || w.tick%450===0 || w.ended || w.tick===limit) checkpoints.push(signature(w));
    }
    if(limit>=TIMEOUT+PURSUIT) assert.ok(w.ended && (w.winner===0 || w.winner===1));
    return {checkpoints,tick:w.tick,winner:w.winner,waits:{...w.marchCohesion.stats}};
}
for(const [scale,seed,limit] of [[2400,7919,TIMEOUT+PURSUIT],[1200,23757,TIMEOUT+PURSUIT],[3600,1815,2100]]) {
    const w=new SimWorld(scale,seed),first=play(w,limit);
    w.reset(1200,105);
    w.step();
    w.reset(scale,seed);
    assert.deepEqual(play(w,limit),first,'replay diverged for '+seed);
    console.log(JSON.stringify({scale,seed,tick:first.tick,winner:first.winner,waits:first.waits,
        matched:first.checkpoints.length,final:first.checkpoints.at(-1)}));
}
