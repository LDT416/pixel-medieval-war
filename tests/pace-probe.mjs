import assert from 'node:assert/strict';
import {build} from 'esbuild';
const {outputFiles}=await build({stdin:{contents:"export {SimWorld} from './src/sim/world';",resolveDir:process.cwd()},platform:'node',format:'esm',bundle:true,write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const seed=Number(process.argv[2]??23757),w=new SimWorld(1200,seed);
let firstGun=null,firstCasualty=null,idle=0,frames=0;
const position=new Map(),samples=new Map();
function sample(key,value){
    const acc=samples.get(key)??{count:0,total:0,max:0};
    acc.count++;acc.total+=value;acc.max=Math.max(acc.max,value);samples.set(key,acc);
}
while(w.winner===null){
    w.step();frames++;
    const fire=w.events.some(e=>e.type==='fire');
    if(firstGun===null && w.events.some(e=>e.type==='fire' && e.explosive))firstGun=w.tick/30;
    if(firstCasualty===null && w.dead[0]+w.dead[1]>0)firstCasualty=w.tick/30;
    const maneuver=w.tick>w.deployEnd && w.companies.some(c=>c.alive>0 && c.status!=='rout' &&
        ((c.engaged || c.underFire>w.tick) || (Math.hypot(c.vx,c.vy)>3 && ['advance','assault','charge'].includes(c.order))));
    if(!fire && !maneuver)idle++;
    for(const u of w.units){
        if(u.hp<=0)continue;
        const last=position.get(u.id);position.set(u.id,[u.x,u.y]);
        if(!last)continue;
        const speed=Math.hypot(u.x-last[0],u.y-last[1])*30;
        if(speed<=3)continue;
        sample(u.kind,speed);
        const c=w.companies[u.company];
        if(c.sprintUntil>w.tick)sample('horseSprint',speed);
        if(c.assaultStage==='rush')sample('footRush',speed);
    }
}
const movement=Object.fromEntries([...samples].map(([name,s])=>[name,{count:s.count,mean:s.total/s.count,max:s.max}]));
console.log(JSON.stringify({seed,frames,firstGun,firstCasualty,idleFraction:idle/frames,movement}));
assert.ok(firstGun!==null && firstGun<=30,'首次开炮不超过30秒');
assert.ok(firstCasualty!==null && firstCasualty<=90,'首次伤亡不超过90秒');
assert.ok(idle/frames<=.1,'全场空闲占比不超过10%');
assert.ok(movement.cuirassier.mean>movement.line_infantry.mean,'移动中的骑兵应快于步兵');
