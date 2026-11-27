import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const bundle=await build({stdin:{contents:"export {SimWorld} from './src/sim/world'",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const source=bundle.outputFiles[0].text;
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const digest=v=>createHash('sha256').update(JSON.stringify(v,(_,a)=>a instanceof Map?[...a]:a)).digest('hex');
const isInf=u=>u.kind==='line_infantry'||u.kind==='guard_grenadier';
function snapshot(w){
    return digest([w.posture,w.weather,w.layout,w.plans,w.units,w.companies.map(({members,...c})=>c),
        w.generals.map(({unit,...g})=>g),w.logistics,w.events,w.news,w.reinforcement,w.tick]);
}
function observe(seed){
    const w=new SimWorld(1200,seed);
    assert.equal(w.plans?.length,2,'缺少双方真实计划');
    assert.ok(w.deployEnd>=900&&w.deployEnd<=1800,'部署应持续30～60个模拟秒');
    const opening=snapshot(w),posture=[...w.posture];
    while(w.tick<w.deployEnd&&!w.ended)w.step();
    assert.equal(w.tick,w.deployEnd,'部署提前结束');
    const live=w.units.filter(u=>u.hp>0&&!u.escaped&&w.companies[u.company].status!=='rout'&&w.companies[u.company].status!=='gone');
    const attackers=[];
    for(const [f,stance] of posture.entries())if(stance==='attack'){
        const sector=w.plans[f].mainEffort;assert.ok([0,1,2].includes(sector));
        const troops=live.filter(u=>u.faction===f&&w.companies[u.company].line!==5);
        const count=filter=>{
            const all=troops.filter(filter);
            return {main:all.filter(u=>Math.max(0,Math.min(2,Math.floor(3*u.y/w.layout.height)))===sector).length,total:all.length};
        };
        const infantry=count(isInf),artillery=count(u=>u.kind==='field_cannon');
        assert.ok(infantry.total&&artillery.total,'攻方没有可统计兵员');
        attackers.push({faction:f,sector,feint:w.plans[f].feint,infantry,artillery});
    }
    const defender=posture.indexOf('defend');
    const positions=w.layout.objectives.filter(p=>p.kind==='farm'||p.kind==='bridge');
    const forts=defender<0?null:positions.map(p=>{
        const radius=p.kind==='bridge'?135:158;
        const garrison=live.filter(u=>u.faction===defender&&isInf(u)&&Math.hypot(u.x-p.x,u.y-p.y)<=radius);
        return {name:p.name,owner:p.owner,garrison:garrison.length,held:p.owner===defender&&garrison.length>0};
    });
    if(forts)assert.ok(forts.length>0,'守方地图应有须驻守的要点');
    return {opening,end:snapshot(w),deploymentTick:w.tick,posture,defender,attackers,forts};
}
const rows=[];
for(let i=1;i<=20;i++){
    const seed=i*7919,a=observe(seed),b=observe(seed);
    assert.deepEqual(a,b,'同种子从开局到部署终点完整状态应相同，seed='+seed);
    rows.push({seed,...a});console.log(JSON.stringify(rows.at(-1)));
}
const attacks=rows.flatMap(r=>r.attackers),defenses=rows.filter(r=>r.forts!==null);
const mean=key=>attacks.reduce((s,r)=>s+r[key].main/r[key].total,0)/attacks.length;
const variants=new Set(attacks.map(r=>r.sector+'/'+r.feint));
const held=defenses.filter(r=>r.forts.every(p=>p.held)).length;
const report={seeds:rows.length,deterministic:rows.length,engine:createHash('sha256').update(source).digest('hex').slice(0,12),attackers:attacks.length,variants:[...variants].sort(),defendingBattles:defenses.length,meetingEngagements:rows.length-defenses.length,allStrongpointsHeld:held,defenseRate:held/defenses.length,infantryMean:mean('infantry'),artilleryMean:mean('artillery')};
console.log(JSON.stringify(report));
assert.ok(variants.size>=3,'主攻与佯攻组合至少三种');
assert.ok(report.infantryMean>=.5,'主攻战区的实际步兵平均占比至少50%');
assert.ok(report.artilleryMean>=.6,'主攻战区的实际火炮平均占比至少60%');
assert.ok(report.defenseRate>=.9,'全部农庄和桥梁实际有驻守，至少占守方案例的90%');
