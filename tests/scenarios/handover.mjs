import assert from 'node:assert/strict';
import {build} from 'esbuild';

const {outputFiles}=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'; export {formUp} from './src/sim/strategy';",resolveDir:process.cwd()},platform:'node',format:'esm',bundle:true,write:false});
const {SimWorld,formUp}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const w=new SimWorld(3600,42);
while(w.tick<w.deployEnd)w.step();
const front=w.companies.find(c=>c.faction===0 && c.line===0 && w.companies.some(r=>r.faction===0 && r.sector===c.sector && r.line===1 && r.kind===c.kind));
const reserve=w.companies.find(r=>r.faction===0 && r.sector===front.sector && r.line===1 && r.kind===front.kind);
function station(c,x,y){
    c.x=c.homeX=c.gx=x;c.y=c.homeY=c.gy=y;c.order='hold';c.vx=c.vy=0;formUp(c);
}
station(front,4000,3000);station(reserve,3690,3080);station(w.companies[w.generals[0].company],3900,3070);
w.crowd.reset(w.layout);w.crowd.step(w);w.hash.rebuild(w.units);
const initial=Math.hypot(front.x-reserve.x,front.y-reserve.y);
assert.ok(initial>300 && w.logistics.requestRelief(w,front,reserve));
let handover;
for(let i=0;i<1800 && !handover && !w.ended;i++){
    assert.equal(front.line,0);
    w.step();
    handover=w.logistics.handovers.find(h=>h.front===front.id);
}
assert.ok(handover,'reserve arrives using normal movement and the courier confirms the handover');
assert.equal(handover.reserve,reserve.id);assert.ok(handover.distance<=105);
assert.equal(front.line,1);assert.equal(reserve.line,0);
console.log(JSON.stringify({initialDistance:initial,handoverDistance:handover.distance,elapsedTicks:handover.tick-w.deployEnd}));
