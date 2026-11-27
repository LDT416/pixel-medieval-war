import {build} from 'esbuild';
import fs from 'node:fs';
const built=await build({stdin:{contents:"export * from './src/sim/world';",resolveDir:process.cwd()},platform:'node',format:'esm',bundle:true,write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const plan={},add=(key,w,p)=>{if(!plan[key])plan[key]={seed:w.seed,tick:w.tick,x:p.x,y:p.y}};
for(const seed of [42,...Array.from({length:60},(_,i)=>(i+1)*7919)]){
 const w=new SimWorld(1200,seed);if(w.layout.farm)add('farm',w,w.layout.farm);
 let cursor=0,gun,first=[],reloc;const landings=new Map();
 while(!w.ended){
 w.step();
 for(const n of w.news.slice(cursor)){if(n.text.includes('攻占了农庄'))add('capture',w,n);if(n.text.includes('发起冲锋'))add('charge',w,n);if(n.text.includes('全面崩溃'))add('collapse',w,n)}cursor=w.news.length;
 for(const e of w.events){
 if(e.type==='fire' && e.explosive)add('gun',w,e);
 if(e.type==='impact'){landings.set(e.unitId,{seed,tick:w.tick,x:e.x,y:e.y});gun??=e.unitId;if(e.unitId===gun && w.tick<=600)first.push({seed,tick:w.tick,x:e.x,y:e.y,id:gun});if(first.length===3&&!plan.ranging)plan.ranging=first.slice();}
 if(e.type==='bounce'&&!plan.impact)plan.impact=landings.get(e.unitId);
 if(e.type==='fire'&&!e.explosive && w.tick>1500)add('volley',w,e);
 }
 if(!reloc)reloc=w.companies.find(c=>c.limbered);
 if(reloc && !reloc.limbered && reloc.deployUntil===w.tick)add('redeploy',w,reloc);
 if(w.tick===3640 && !w.ended && w.winner===null)add('haze',w,w.frontline());
 }
 if(['impact','capture','charge','collapse','ranging','redeploy','farm','haze'].every(k=>plan[k]))break;
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(plan,null,2));console.log(plan);
