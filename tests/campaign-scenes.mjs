import {build} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function discover(w,scenes,seed){
    const requests=new Map(),dispatch=new Map();
    if(!scenes.deployment){
        const p=w.plans.find(p=>p.role==='attack'),d=p.destinations.find(d=>d.role==='front');
        scenes.deployment={seed,company:d.company,name:w.companies[d.company].name,sector:d.sector,end:w.deployEnd};
    }
    let seen=0;
    while(!w.ended&&(!scenes.relief||!scenes.reinforcement)){
        w.step();
        for(const m of w.logistics.couriers)if(m.relief&&!requests.has(m.id))requests.set(m.id,{tick:w.tick,front:m.relief.front,reserve:m.relief.reserve});
        const news=w.news.slice(seen);seen=w.news.length;
        for(const n of news)if(n.text.includes('投入')&&n.text.includes('增援')){
            const p=w.plans[n.faction],c=p.reserve.map(id=>w.companies[id]).find(c=>n.text.includes(c.name));
            const m=c&&w.logistics.couriers.find(m=>m.company===c.id);
            if(m)dispatch.set(m.id,{seed,order:m.order,target:m.target,company:c.id,name:c.name,tick:w.tick,x:c.x,y:c.y,text:n.text,point:m.point});
        }
        for(const [id,r] of dispatch)if(!w.logistics.couriers.some(m=>m.id===id)){
            const c=w.companies[r.company];
            if(c.order===r.order&&c.forced===r.target&&!scenes.reinforcement)scenes.reinforcement={...r,arrived:w.tick,owner:c.faction};
            dispatch.delete(id);
        }
        const h=w.logistics.handovers.at(-1);
        if(h&&!scenes.relief){
            const request=[...requests.values()].filter(r=>r.front===h.front&&r.reserve===h.reserve).at(-1);
            if(request)scenes.relief={...h,seed,requested:request.tick,frontName:w.companies[h.front].name,reserveName:w.companies[h.reserve].name};
        }
    }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const pack=await build({stdin:{contents:"export * from './src/sim/world';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(pack.outputFiles[0].text).toString('base64'));
const scenes={};
for(let i=1;i<=60&&(!scenes.relief||!scenes.reinforcement);i++){
    const seed=i*7919,w=new SimWorld(1200,seed);discover(w,scenes,seed);
    console.log(seed,'ticks',w.tick,'real handovers',w.logistics.rotations,'reserve',!!scenes.reinforcement,'relief',!!scenes.relief);
}
const dir='docs/shots/T8C';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/scenes.json',JSON.stringify(scenes,null,2));
if(!scenes.relief||!scenes.reinforcement)throw Error('Missing genuine campaign event');console.log(scenes);
}
