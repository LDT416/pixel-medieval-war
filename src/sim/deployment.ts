import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type {Company,Faction,Formation,Order} from './arenaTypes';
import {sectorOf,type Layout,type Objective,type Sector} from './maps';
import {PACE} from './scale';
import {Rng} from './rng';
import {formUp} from './strategy';
import type {Point} from './types';
import type {SimWorld} from './world';

type Role='front'|'reserve'|'battery'|'horse'|'staff'|'garrison'|'woods';
export interface Destination extends Point {company:number;sector:Sector;role:Role;formation:Formation;objectiveId?:number}
export interface SectorIntel {sector:Sector;cover:number;openness:number;passage:number;elevation:number;enemyEstimate:number}
export interface BattlePlan{
    faction:Faction;role:'attack'|'defend';legacy:boolean;mainEffort:Sector;feint:Sector;reserve:number[];
    destinations:Destination[];phases:{name:string;trigger:number;orders:Order}[];intel:SectorIntel[];breakthrough:Sector|null;reserveAt:number|null;
}
type DeploymentWorld=SimWorld & {legacySide?:Faction|null;deployEnd?:number};
type Route={c:Company;d:Destination;points:Point[];cumulative:number[];length:number;delay:number;stop:number;
    march:Float32Array;station:Float32Array;finished:boolean};
const routes=new WeakMap<SimWorld,Route[]>();
const zones=[0,1,2] as const,zoneNames=['左翼','中央','右翼'];
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const foot=(c:Company)=>isLineTroop(c)||isGuard(c);
const center=(s:Sector,l:Layout)=>(s+.5)*l.height/3;

function evaluate(w:SimWorld,f:Faction,r:Rng):SectorIntel[]{
    const l=w.layout,error=w.weather==='fog'?.25:w.weather==='rain'?.20:.14;
    return zones.map(sector=>{
        const count=(pts:Point[])=>pts.filter(p=>sectorOf(p.y,l)===sector).length;
        const woods=count(l.woods),farms=count(l.farms),high=count(l.ridges),cross=count(l.bridges);
        const cover=Math.min(1,(woods*.20+farms*.22+high*.18));
        const roadLinks=l.roads.filter(road=>road.points.some(p=>sectorOf(p.y,l)===sector)).length;
        const truth=w.companies.filter(c=>c.faction!==f&&c.line!==5&&sectorOf(c.y,l)===sector).reduce((s,c)=>s+c.alive,0);
        return {sector,cover,openness:1-cover,passage:Math.min(1,.20+cross*.28+roadLinks*.11),elevation:Math.min(1,high*.55),
            enemyEstimate:Math.round(truth*(1+(r.next()*2-1)*error))};
    });
}
function planSide(w:DeploymentWorld,f:Faction,r:Rng,bridgeGuns:Map<number,Objective>):BattlePlan{
    const l=w.layout,face=f?-1:1,trait=w.generals[f].trait,attacking=w.posture[f]==='attack',own=w.companies.filter(c=>c.faction===f);
    const intel=evaluate(w,f,r),total=Math.max(1,intel.reduce((s,p)=>s+p.enemyEstimate,0));
    const scored=intel.map(s=>({sector:s.sector,score:attacking?
        .58*(1-s.enemyEstimate/total)+s.openness*(trait==='aggressive'?.21:.12)+s.passage*.14+(trait==='cunning'&&s.sector!==1?.16:0)+r.next()*.22:
        s.enemyEstimate/total+s.cover*.2+s.passage*.1+r.next()*.10})).sort((a,b)=>b.score-a.score);
    const mainEffort=scored[0].sector,feint=scored[1].sector,other=scored[2].sector;
    const legacy=w.legacySide===f,slow=trait==='cautious'?1.23:trait==='aggressive'?.77:1;
    const plan:BattlePlan={faction:f,role:attacking?'attack':'defend',legacy,mainEffort,feint,intel,reserve:[],destinations:[],breakthrough:null,reserveAt:null,
        phases:[{name:'炮火准备',trigger:0,orders:'hold'},{name:'散兵接近',trigger:Math.round(490*slow),orders:'advance'},
            {name:'主攻部队展开',trigger:Math.round(1120*slow),orders:'advance'},{name:'骑兵扩张战果',trigger:Math.round(3500*slow),orders:'charge'},
            {name:'投入预备队',trigger:Math.round(6500*slow),orders:'advance'}]};
    const frontX=(y:number)=>attacking?l.width/2-face*l.lineGap:l.ridgeX+Math.sin(y*.0016+l.seed)*80-face*112;
    function add(c:Company,x:number,y:number,role:Role,formation:Formation,objective?:Objective){
        x=clamp(x,150,l.width-150);y=clamp(y,160,l.height-160);
        plan.destinations.push({company:c.id,x,y,sector:sectorOf(y,l),role,formation,...(objective?{objectiveId:objective.id}:{})});
        if(role==='reserve')plan.reserve.push(c.id);
    }
    if(legacy){
        for(const c of own)add(c,c.homeX,c.homeY,c.line===5?'staff':c.line===4?'battery':c.line===3?'horse':c.line===6?'garrison':c.line===1||c.line===2?'reserve':'front',c.formation);
        return plan;
    }
    const companies=own.filter(foot),guns=own.filter(c=>isArtillery(c)),horses=own.filter(c=>isMounted(c)&&c.line!==5);
    // 所有选位读取部署前的样本。分派完成后再改变实体坐标。
    if(attacking){
        const soldiers=companies.reduce((s,c)=>s+c.alive,0);
        const ordered=[...companies.filter(c=>c.line!==2),...companies.filter(c=>c.line===2)];
        let used=0,head=0;
        for(const c of ordered){
            if(used>=soldiers*.50 && Math.abs(used-soldiers*.55)<Math.abs(used+c.alive-soldiers*.55))break;
            used+=c.alive;head++;
        }
        const feintCount=Math.max(1,Math.round((ordered.length-head)*.47));
        ordered.forEach((c,i)=>{
            const sector=i<head?mainEffort:i<head+feintCount?feint:other;
            const position=i<head?i:i<head+feintCount?i-head:i-head-feintCount;
            const count=i<head?head:i<head+feintCount?feintCount:ordered.length-head-feintCount;
            const rank=i<head&&position%4===3||sector===other;
            const y=center(sector,l)+(position-(count-1)/2)*Math.min(178,l.height/(4*Math.max(1,count)));
            add(c,frontX(y)-face*(rank?470:0),y,rank?'reserve':'front',rank?'column':'line');
        });
        let assigned=0;
        const totalGuns=guns.reduce((s,c)=>s+c.alive,0);
        guns.forEach((c,i)=>{
            const sector=assigned<totalGuns*.60?mainEffort:feint;assigned+=c.alive;
            const y=center(sector,l)+(i-(guns.length-1)/2)*105;add(c,frontX(y)-face*160,y,'battery','battery');
        });
    }else{
        const line=companies.filter(c=>isLineTroop(c)),guards=companies.filter(c=>isGuard(c));
        const positions=l.objectives.filter(p=>p.kind==='farm'||p.kind==='bridge');
        const unused=[...line,...guards];
        for(const p of positions){
            const index=unused.findIndex(c=>c.line===6&&p.kind==='farm'&&p.x===l.farm?.x);
            const c=unused.splice(index>=0?index:0,1)[0];if(!c)break;
            add(c,p.x-face*(p.kind==='bridge'?46:0),p.y,'garrison','line',p);
        }
        const cover=l.woods.filter(p=>sectorOf(p.y,l)!==1).sort((a,b)=>Math.abs(a.x-l.ridgeX)-Math.abs(b.x-l.ridgeX))[0];
        if(cover&&unused.length>4){
            const c=unused.shift()!;add(c,cover.x,cover.y,'woods','line');
        }
        const front=unused.filter(c=>!isGuard(c)),reserve=unused.filter(c=>isGuard(c));
        front.forEach((c,i)=>{
            const y=center(mainEffort,l)+(i-(front.length-1)/2)*Math.min(226,l.height/(3*Math.max(front.length,1)));
            const depth=front.length>=3&&i%4===1;
            add(c,frontX(y)-face*(depth?260:0),y,depth?'reserve':'front',depth?'column':'line');
        });
        reserve.forEach((c,i)=>{
            const y=l.height*.5+(i-(reserve.length-1)/2)*158;
            add(c,frontX(y)-face*(trait==='steadfast'||trait==='cautious'?680:440),y,'reserve','column');
        });
        const ridgeGuns=guns.filter(c=>!bridgeGuns.has(c.id));
        guns.forEach(c=>{
            const bridge=bridgeGuns.get(c.id);
            const y=bridge?.y??center(mainEffort,l)+(ridgeGuns.indexOf(c)-(ridgeGuns.length-1)/2)*136;
            add(c,bridge?bridge.x-face*130:l.ridgeX+Math.sin(y*.0016+l.seed)*80,y,'battery','battery',bridge);
        });
    }
    const wing=[...intel].filter(p=>p.sector!==1).sort((a,b)=>b.openness-a.openness)[0].sector;
    horses.forEach((c,i)=>{
        const sector=attacking?wing:i%2?2:0;
        const y=center(sector,l)+(i-(horses.length-1)/2)*118;
        add(c,frontX(y)-face*(attacking?470:660),y,'horse','wedge');
    });
    const staff=own.find(c=>c.line===5);
    if(staff){const y=center(1,l);add(staff,frontX(y)-face*1290,y,'staff','staff');}
    return plan;
}

function routePoints(f:Faction,index:number,d:Destination,l:Layout){
    const face=f?-1:1,edge=f?l.width-90:90;
    const roads=l.roads.filter(p=>p.points.some(q=>q.x<1)&&p.points.some(q=>q.x>=l.width));
    const candidates=roads.map(road=>f?[...road.points].reverse():road.points);
    const road=candidates.sort((a,b)=>Math.abs(a[0].y-d.y)-Math.abs(b[0].y-d.y))[0];
    const entryY=road?.[0].y??d.y;
    const points:Point[]=[{x:edge,y:clamp(entryY+(index%7-3)*88,130,l.height-130)}];
    if(road){
        const endX=edge+(d.x-edge)*.65, lane=(index%3-1)*9;
        for(let j=1;j<road.length;j++){
            const prev=road[j-1],next=road[j];
            if((next.x-endX)*face<0){points.push({x:next.x,y:next.y+lane});continue;}
            const t=clamp((endX-prev.x)/(next.x-prev.x||1),0,1);
            points.push({x:endX,y:prev.y+(next.y-prev.y)*t+lane});break;
        }
        points.splice(1,0,{x:edge+face*160,y:entryY+lane});
    }
    points.push({x:d.x-face*Math.min(290,l.width*.025),y:d.y},d);
    // 用短二次曲线转入支路，让长纵队转弯时依次旋转到新方向。
    const rounded:Point[]=[points[0]];
    for(let i=1;i<points.length-1;i++){
        const a=points[i-1],b=points[i],c=points[i+1],ab=dist(a,b),bc=dist(b,c);
        if(ab<1||bc<1)continue;
        const reach=Math.min(110,ab*.32,bc*.32);
        const p={x:b.x+(a.x-b.x)*reach/ab,y:b.y+(a.y-b.y)*reach/ab};
        const q={x:b.x+(c.x-b.x)*reach/bc,y:b.y+(c.y-b.y)*reach/bc};
        for(let j=0;j<=6;j++){
            const t=j/6,v=1-t;
            rounded.push({x:v*v*p.x+2*v*t*b.x+t*t*q.x,y:v*v*p.y+2*v*t*b.y+t*t*q.y});
        }
    }
    rounded.push(d);return rounded;
}
function setupRoute(w:DeploymentWorld,d:Destination,i:number,legacy:boolean):Route{
    const c=w.companies[d.company],f=c.faction,face=f?-1:1,points=routePoints(f,i,d,w.layout);
    const cumulative=[0];for(let j=1;j<points.length;j++)cumulative[j]=cumulative[j-1]+dist(points[j],points[j-1]);
    c.homeX=c.x=d.x;c.homeY=c.y=d.y;c.hx=face;c.hy=0;c.sector=d.sector;c.initialFront=c.homeX+face*170;
    if(!legacy){
        if(d.role==='garrison'){
            if(c.line!==6&&d.objectiveId!==undefined&&w.layout.objectives[d.objectiveId].kind==='farm'){c.base+=8;c.morale+=8;}
            c.line=6;c.order='hold';
        }else if(foot(c)){
            c.line=d.role==='reserve'?(isGuard(c)?2:1):0;c.order=d.role==='reserve'?'reserve':'hold';
            c.name=c.name.replace('（农庄守军）','');
        }
    }
    c.formation=d.formation;formUp(c);
    const station=new Float32Array(c.members.length*2),march=new Float32Array(station.length);
    for(const [k,u] of c.members.entries()){station[2*k]=u.x-d.x;station[2*k+1]=u.y-d.y;}
    const finalLine=c.line;c.line=0;c.formation=isArtillery(c)?'battery':finalLine===5?'staff':'column';formUp(c);c.line=finalLine;
    for(const [k,u] of c.members.entries()){march[2*k]=(u.x-d.x)*face;march[2*k+1]=(u.y-d.y)*face;}
    const end=w.deployEnd??1350;
    return {c,d,points,cumulative,length:cumulative[cumulative.length-1],delay:(i%8)*15,stop:end-(i%5)*11,march,station,finished:false};
}
/** 桥头抽调单炮：保留原有炮手实体、总兵力与炮数，炮群余部仍可驻守山脊。 */
function detachBridgeGuns(w:DeploymentWorld){
    const posts=new Map<number,Objective>(),f=w.layout.ridgeOwner;
    if(f<0||w.legacySide===f)return posts;
    const batteries=w.companies.filter(c=>c.faction===f&&isArtillery(c));
    for(const p of w.layout.objectives.filter(o=>o.kind==='bridge')){
        const source=[...batteries].sort((a,b)=>b.members.length-a.members.length)[0];
        if(!source||source.members.length<2)break;
        const gun=source.members.pop()!;source.alive--;source.peak--;source.capacity--;
        const id=w.companies.length;
        const detachment:Company={...source,id,name:source.name+' · '+p.name+'炮组',members:[gun],alive:1,peak:1,capacity:1,
            files:1,cavalryDistances:new Map(),colors:0,ammo:0};
        gun.company=id;gun.slot=0;gun.officer=true;
        w.companies.push(detachment);posts.set(id,p);
    }
    return posts;
}
export function prepareDeployment(w:DeploymentWorld):[BattlePlan,BattlePlan]{
    const bridgeGuns=detachBridgeGuns(w);
    const plans=([0,1] as const).map(f=>planSide(w,f,new Rng(w.seed^(f?0x61726368:0x706c616e)),bridgeGuns)) as [BattlePlan,BattlePlan];
    routes.set(w,plans.flatMap(p=>p.destinations.map((d,i)=>setupRoute(w,d,i,p.legacy))));
    marchDeployment(w);
    for(const p of plans){
        const guns=p.destinations.filter(d=>d.role==='battery'&&d.sector===p.mainEffort).reduce((s,d)=>s+w.companies[d.company].alive,0);
        const y=center(p.mainEffort,w.layout),g=w.generals[p.faction];
        w.say(g.name+(p.legacy?'采用原有阵位':p.role==='attack'?'将主攻放在'+zoneNames[p.mainEffort]+'，集结'+guns+'门炮':'决定据守要点，重点防守'+zoneNames[p.mainEffort]),p.faction,w.layout.width/2,y,2);
    }
    return plans;
}
export function marchDeployment(w:DeploymentWorld){
    const active=routes.get(w);if(!active)return;
    for(const route of active){
        if(route.finished)continue;
        const {c,d,points,march,station}=route,t=clamp((w.tick-route.delay)/(route.stop-route.delay),0,1);
        // 镜头从进场路线末段开始，按兵种步态走完部署路程。
        const speed=isMounted(c)?PACE.horseTrot:c.speed;
        const shown=Math.min(route.length,(route.stop-route.delay)*speed/30);
        const s=route.length-shown+t*shown;let j=1;
        while(j<points.length-1&&route.cumulative[j]<s)j++;
        const a=points[j-1],b=points[j],length=Math.max(.001,route.cumulative[j]-route.cumulative[j-1]);
        const u=clamp((s-route.cumulative[j-1])/length,0,1),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;
        const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,unfold=clamp((t-.82)/.18,0,1);
        const blend=unfold*unfold*(3-2*unfold),face=c.faction?-1:1;
        c.vx=w.tick?(x-c.x)*30:0;c.vy=w.tick?(y-c.y)*30:0;c.x=x;c.y=y;c.hx=dx;c.hy=dy;
        if(t===1){c.formation=d.formation;c.hx=face;c.hy=0;formUp(c);c.vx=c.vy=0;route.finished=true;}
        for(let k=0;k<c.members.length;k++){
            const unit=c.members[k],front=march[2*k],lateral=march[2*k+1];
            const offX=front*face*(1-blend)+station[2*k]*blend;
            const offY=lateral*face*(1-blend)+station[2*k+1]*blend;
            const px=unit.x,py=unit.y;unit.x=clamp(x+offX,3,w.layout.width-3);unit.y=clamp(y+offY,3,w.layout.height-3);
            unit.px=w.tick?px:unit.x;unit.py=w.tick?py:unit.y;unit.vx=t>0&&t<1?(unit.x-px)*30:0;unit.vy=t>0&&t<1?(unit.y-py)*30:0;
            if(w.tick && t>0 && t<1)unit.stride+=Math.hypot(unit.x-px,unit.y-py);
            unit.face=t===1?face:dx<0?-1:1;unit.moving=t>0&&t<1;unit.pose=unit.moving?'march':'stand';
        }
    }
}
