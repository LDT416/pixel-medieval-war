import assert from 'node:assert/strict';
import {build} from 'esbuild';

const {outputFiles}=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'; export {updateCompany} from './src/sim/strategy';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld,updateCompany}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const w=new SimWorld(600,42);
w.weather='fog';
const [observer,ally]=w.companies.filter(c=>c.faction===0 && c.line===0);
const other=w.companies.find(c=>c.faction===1 && c.line===0);
for(const c of w.companies){
    c.x=c.faction===0?1000:14500;c.y=1000;
}
function position(c,x){
    c.x=c.homeX=x;c.y=c.homeY=1000;c.vx=c.vy=0;
    for(const u of c.members){u.x=x;u.y=c.y;}
}
position(observer,5500);position(other,5650);
w.tick=w.deployEnd;w.step();
const first=w.sight.latest(w,0);
assert.deepEqual(first,{id:other.id,column:35,row:6,tick:w.tick});
assert.ok(!w.sight.canSee(w,ally,other));
position(other,13000);
observer.forced=other.id;updateCompany(w,observer);
assert.equal(observer.target,-1);assert.equal(observer.forced,-1);
assert.ok(!w.sight.visibleToArmy(w,0).includes(other));
w.tick=first.tick+299;w.sight.scan(w);
assert.deepEqual(w.sight.latest(w,0),first);
w.tick++;assert.equal(w.sight.latest(w,0),undefined);
w.sight.scan(w);assert.equal(w.sight.latest(w,0),undefined);
position(other,5600);observer.status='rout';w.sight.scan(w);
assert.equal(w.sight.latest(w,0),undefined);
observer.status='steady';w.sight.scan(w);assert.equal(w.sight.latest(w,0).id,other.id);
w.reset(600,42);assert.equal(w.sight.latest(w,0),undefined);
console.log('Visibility passed: local sight, hidden forced order cleared, frozen grid report, expiry at tick 300, routed observer and replay reset.');
