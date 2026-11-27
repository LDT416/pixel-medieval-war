// 只读扫描完整对局，从真实射击事件挑出可复现的摄影机位置与时间段。
import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
const [seedArg='42',output='scene-plan.json']=process.argv.slice(2);
const seed=Number(seedArg);
const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const w=new SimWorld(1200,seed),fire=new Map(),signals=new Map(),charges=[];
while(!w.ended){
    w.step();
    for(const c of w.companies){
        if(c.assaultStage==='signal' && c.assaultUntil===w.tick+24){
            if(!signals.has(c.id))signals.set(c.id,[]);
            signals.get(c.id).push({tick:w.tick,target:c.target,peak:c.alive});
        }
    }
    for(const e of w.events){
        if(e.type!=='fire'||e.explosive)continue;
        const u=w.units[e.unitId],c=w.companies[u.company],target=w.companies[u.shotTarget];
        if(!target||!['guard_grenadier','line_infantry'].includes(c.kind))continue;
        if(!fire.has(c.id))fire.set(c.id,[]);
        const rows=fire.get(c.id),group=c.fireMode==='platoon'?Math.min(3,Math.floor((u.slot%c.files)*4/c.files)):Math.floor(u.slot/c.files)%c.ranks;
        let row=rows.at(-1);
        if(!row||row.volley!==c.volleys||row.target!==target.id){
            row={tick:w.tick,volley:c.volleys,target:target.id,mode:c.fireMode,distance:Math.round(Math.hypot(c.x-target.x,c.y-target.y)),groups:[],shots:0,alive:c.alive,kneeling:0,standing:0};rows.push(row);
        }
        if(!row.groups.includes(group))row.groups.push(group);
        row.shots++;
        const front=c.members.filter(v=>v.hp>0&&v.slot<c.files);
        row.kneeling=Math.max(row.kneeling,front.filter(v=>v.pose==='kneel'||v.pose==='kneelLoad').length);
        row.standing=Math.max(row.standing,front.filter(v=>v.pose!=='kneel'&&v.pose!=='kneelLoad').length);
    }
    while(charges.length<w.charges.length)charges.push({...w.charges[charges.length]});
}
const scenes=[];
for(const faction of [0,1]){
    let best=null,bestScore=-Infinity;
    for(const [id,shots] of fire){
        const c=w.companies[id];if(c.faction!==faction)continue;
        for(let i=0;i<shots.length;i++){
            const a=shots[i];if(!['rank','platoon'].includes(a.mode))continue;
            const pack=[];
            for(let j=i;j<shots.length&&shots[j].tick<a.tick+422;j++)if(shots[j].mode===a.mode)pack.push(shots[j]);
            const groups=new Set(pack.flatMap(g=>g.groups)),needed=a.mode==='platoon'?4:(faction?2:3);
            if(groups.size!==needed)continue;
            const score=pack.reduce((s,r)=>s+r.shots*.4+Math.min(8,r.kneeling),0)+pack.length*3+(a.mode==='platoon'?10:0);
            if(score<=bestScore)continue;
            bestScore=score;best={kind:faction?'british':'french',company:id,name:c.name,start:a.tick-10,end:a.tick+440,mode:a.mode,groups:[...groups].sort(),shots:pack};
        }
    }
    if(best)scenes.push(best);
}
let bestCharge=null,score=-Infinity;
for(const charge of charges){
    if(charge.outcome==='repulsed')continue;
    const signal=signals.get(charge.company)?.findLast(s=>s.tick<=charge.tick&&s.target===charge.target);
    if(!signal||charge.tick-signal.tick>850)continue;
    const attackingShots=fire.get(charge.company)?.filter(f=>f.target===charge.target&&f.tick>=signal.tick-160&&f.tick<=signal.tick+24)??[];
    const attacker=attackingShots.findLast(f=>f.tick<signal.tick)??attackingShots.at(-1);
    const defender=fire.get(charge.target)?.findLast(f=>f.target===charge.company&&f.tick>=signal.tick&&f.tick<=charge.tick+2&&f.distance<110);
    const value=(attacker?1000:0)+(defender?1000:0)+(attacker&&attacker.tick<signal.tick?250:0)+(attacker?.shots??0)*2+(defender?.shots??0)*4+signal.peak*.1;
    if(value<=score)continue;score=value;
    bestCharge={kind:'charge',company:charge.company,name:w.companies[charge.company].name,target:charge.target,defenderName:w.companies[charge.target].name,
        start:Math.min(attacker?.tick??signal.tick,signal.tick)-45,end:charge.tick+68,signal:signal.tick,rush:signal.tick+24,contact:charge.tick,outcome:charge.outcome,attacker,defender};
}
if(bestCharge)scenes.push(bestCharge);
writeFileSync(output,JSON.stringify({seed,scale:1200,scenes},null,2));
console.log(seed,scenes.map(s=>({kind:s.kind,company:s.company,start:s.start,end:s.end,groups:s.groups,volleys:s.shots?.length,attacker:s.attacker?.shots,defender:s.defender?.shots})));
if(scenes.length!==3 || !bestCharge.attacker || !bestCharge.defender)process.exitCode=1;
