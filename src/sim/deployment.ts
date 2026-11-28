import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type {Company,Faction,Formation,Order} from './arenaTypes';
import {sectorOf,type Layout,type Objective,type Sector} from './maps';
import {PACE} from './scale';
import {Rng} from './rng';
import {formUp} from './strategy';
import {battalionOffsets, companyHalfWidth} from './battalion';
import type {Point} from './types';
import {blocksObjectivePassage,reserveObjectiveStop} from './objectivePassage';
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

function evaluate(w:SimWorld,r:Rng):SectorIntel[]{
    const l=w.layout,error=w.weather==='fog'?.25:w.weather==='rain'?.20:.14;
    return zones.map(sector=>{
        const count=(pts:Point[])=>pts.filter(p=>sectorOf(p.y,l)===sector).length;
        const woods=count(l.woods),farms=count(l.farms),high=count(l.ridges),cross=count(l.bridges);
        const cover=Math.min(1,(woods*.20+farms*.22+high*.18));
        const roadLinks=l.roads.filter(road=>road.points.some(p=>sectorOf(p.y,l)===sector)).length;
        const sectorBudget=w.scale/6;
        return {sector,cover,openness:1-cover,passage:Math.min(1,.20+cross*.28+roadLinks*.11),elevation:Math.min(1,high*.55),
            enemyEstimate:Math.round(sectorBudget*(1+(r.next()*2-1)*error))};
    });
}
function planSide(w:DeploymentWorld,f:Faction,r:Rng,bridgeGuns:Map<number,Objective>):BattlePlan{
    const l=w.layout,face=f?-1:1,trait=w.generals[f].trait,attacking=w.posture[f]==='attack',own=w.companies.filter(c=>c.faction===f);
    const intel=evaluate(w,r),total=Math.max(1,intel.reduce((s,p)=>s+p.enemyEstimate,0));
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
        if (!legacy && foot(c) && formation==='line') {
            const files=Math.ceil(c.members.length/c.ranks);
            const clearance=Math.hypot((files-1)*6.5,(c.ranks-1)*15)+11;
            const site=objective ?? l.objectives.find(p=>blocksObjectivePassage(l,p,{x,y},clearance));
            if(site){
                const stop=reserveObjectiveStop(w,c,site,{x:f?l.width:0,y});
                x=stop?.x??c.x; y=stop?.y??c.y;
            }
        }
        plan.destinations.push({company:c.id,x,y,sector:sectorOf(y,l),role,formation,...(objective?{objectiveId:objective.id}:{})});
        if(role==='reserve')plan.reserve.push(c.id);
    }
    if(legacy){
        for(const c of own)add(c,c.homeX,c.homeY,c.line===5?'staff':c.line===4?'battery':c.line===3?'horse':c.line===6?'garrison':c.line===1||c.line===2?'reserve':'front',c.formation);
        return plan;
    }
    const companies=own.filter(foot),guns=own.filter(c=>isArtillery(c)),horses=own.filter(c=>isMounted(c)&&c.line!==5);
    const ownBats=w.battalions.filter(b=>b.faction===f);
    // 按营整体布阵：确保营内各连紧挨（间隙 ≤ 30px、错位 0），营与营留 60～120px 间隔，二线在后方 400～600px。
    const placeBattalion=(b:typeof ownBats[number],bx:number,by:number,role:Role)=>{
        const comps=b.companies.map(id=>w.companies[id]).filter(Boolean);
        const batWidth=comps.reduce((s,c)=>s+companyHalfWidth(c)*2,0)+16*Math.max(0,comps.length-1);
        const safeY=clamp(by, 180 + batWidth*0.5, l.height - 180 - batWidth*0.5);
        const safeX=clamp(bx, 220, l.width - 220);
        b.x=b.homeX=b.gx=safeX; b.y=b.homeY=b.gy=safeY;
        b.hx=face; b.hy=0; b.sector=sectorOf(safeY,l);
        const offsets=battalionOffsets(comps);
        const tx=0, ty=face; // tx=-hy=0, ty=hx=face
        comps.forEach((c,i)=>{
            const cx=safeX+tx*offsets[i], cy=safeY+ty*offsets[i];
            add(c, cx, cy, role, 'line');
        });
        const skirms=b.skirmishers.map(id=>w.companies[id]).filter(Boolean);
        skirms.forEach((sc,i)=>{
            const lat=(i-(skirms.length-1)*0.5)*240;
            add(sc, safeX+face*400, safeY+ty*lat, 'front', 'skirmish');
        });
        return batWidth;
    };
    const batHalfWidth=(b:typeof ownBats[number])=>{
        const comps=b.companies.map(id=>w.companies[id]).filter(Boolean);
        return (comps.reduce((s,c)=>s+companyHalfWidth(c)*2,0)+16*Math.max(0,comps.length-1))*0.5;
    };
    const layoutLine=(bats:typeof ownBats, baseX:(y:number)=>number, depthOffset:number, role:Role, spreadSectors=false, sectorOffset=0)=>{
        if(!bats.length)return;
        const widths=bats.map(b=>batHalfWidth(b)*2);
        const gap=90;
        if(spreadSectors && bats.length>=2){
            // 多营跨战区覆盖左翼、中央、右翼，杜绝空战区被骑兵速推；同战区内营间留 90px（60～120px）间隔
            const perSector:[typeof ownBats,typeof ownBats,typeof ownBats]=[[],[],[]];
            const order:[Sector,Sector,Sector]=[mainEffort,feint,other];
            bats.forEach((b,i)=>perSector[order[(i+sectorOffset)%3]].push(b));
            for(const sec of [0,1,2] as const){
                const group=perSector[sec];
                if(!group.length)continue;
                const gw=group.map(b=>batHalfWidth(b)*2);
                const tw=gw.reduce((s,v)=>s+v,0)+gap*Math.max(0,group.length-1);
                let curY=clamp(center(sec,l)-tw*0.5, 220, Math.max(220, l.height-220-tw));
                for(let i=0;i<group.length;i++){
                    const by=curY+gw[i]*0.5;
                    placeBattalion(group[i], baseX(by)-face*depthOffset, by, role);
                    curY+=gw[i]+gap;
                }
            }
            return;
        }
        const totalW=widths.reduce((s,v)=>s+v,0)+gap*Math.max(0,bats.length-1);
        const centerY=spreadSectors?center([mainEffort,feint,other][sectorOffset%3],l):l.height*0.5;
        let curY=clamp(centerY-totalW*0.5, 220, Math.max(220, l.height-220-totalW));
        for(let i=0;i<bats.length;i++){
            const by=curY+widths[i]*0.5;
            const bx=baseX(by)-face*depthOffset;
            placeBattalion(bats[i], bx, by, role);
            curY+=widths[i]+gap;
        }
    };
    const lineBats=ownBats.filter(b=>b.kind==='line_infantry');
    const guardBats=ownBats.filter(b=>b.kind==='guard_grenadier');
    const frontBats=lineBats.filter(b=>b.line===0);
    const secondBats=lineBats.filter(b=>b.line!==0);
    const batCompIds=new Set(ownBats.flatMap(b=>[...b.companies,...b.skirmishers]));
    const looseFoot=companies.filter(c=>!batCompIds.has(c.id));

    layoutLine(frontBats, frontX, 0, 'front', true, 0);
    layoutLine(secondBats, frontX, 500, 'reserve', true, frontBats.length);
    layoutLine(guardBats, frontX, attacking ? 720 : (trait==='steadfast'||trait==='cautious'?780:560), 'reserve', false, 0);

    // 未编入营的独立步兵连（例如农庄守军）
    if(looseFoot.length){
        const farmObj=l.objectives.find(p=>p.kind==='farm');
        looseFoot.forEach((c,i)=>{
            if(!attacking && c.line===6 && farmObj){
                add(c, farmObj.x, farmObj.y, 'garrison', 'line', farmObj);
            }else{
                const y=center(feint,l)+(i-(looseFoot.length-1)*0.5)*180;
                add(c, frontX(y)-face*200, y, 'front', c.variant==='voltigeur'||c.variant==='rifles'?'skirmish':'line');
            }
        });
    }
    if(attacking){
        let assigned=0;
        const totalGuns=guns.reduce((s,c)=>s+c.alive,0);
        guns.forEach((c,i)=>{
            const sector=assigned<totalGuns*.60?mainEffort:feint;assigned+=c.alive;
            const y=center(sector,l)+(i-(guns.length-1)/2)*160;add(c,frontX(y)-face*180,y,'battery','battery');
        });
    }else{
        const ridgeGuns=guns.filter(c=>!bridgeGuns.has(c.id));
        guns.forEach(c=>{
            const bridge=bridgeGuns.get(c.id);
            const y=bridge?.y??center(mainEffort,l)+(ridgeGuns.indexOf(c)-(ridgeGuns.length-1)/2)*160;
            add(c,bridge?bridge.x-face*130:l.ridgeX+Math.sin(y*.0016+l.seed)*80,y,'battery','battery',bridge);
        });
    }
    const wing=[...intel].filter(p=>p.sector!==1).sort((a,b)=>b.openness-a.openness)[0].sector;
    horses.forEach((c,i)=>{
        const sector=attacking?wing:i%2?2:0;
        const y=center(sector,l)+(i-(horses.length-1)/2)*140;
        add(c,frontX(y)-face*(attacking?470:660),y,'horse','diamond');
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
type MarchTraffic=Pick<Company,'id'|'faction'|'alive'|'status'|'x'|'y'>;
function openingStart(w:DeploymentWorld,d:Destination,i:number):MarchTraffic {
    const c=w.companies[d.company],f=c.faction;
    const end=w.deployEnd??1350,delay=(i%8)*15,stop=end-(i%5)*11;
    // The opening camera shows only the last few seconds of the trip. Plan that visible
    // stretch from its original starting point, keeping the simulation clock and destination.
    const approach=routePoints(f,i,d,w.layout);
    const budget=(stop-delay)*(isMounted(c)?PACE.horseTrot:c.speed)/30;
    let start=approach[0],remaining=budget;
    for(let j=approach.length-1;j>0;j--){
        const a=approach[j-1],b=approach[j],length=dist(a,b);
        if(length>remaining){
            start={x:b.x+(a.x-b.x)*remaining/length,y:b.y+(a.y-b.y)*remaining/length};
            break;
        }
        remaining-=length;
    }
    return {...start,id:c.id,faction:f,alive:c.alive,status:c.status};
}
function setupRoute(w:DeploymentWorld,d:Destination,i:number,legacy:boolean,start:MarchTraffic,traffic:MarchTraffic[]):Route{
    const c=w.companies[d.company],f=c.faction,face=f?-1:1;
    const delay=(i%8)*15,stop=(w.deployEnd??1350)-(i%5)*11;
    const path=w.marchRoutes.path(start.x,start.y,d.x,d.y,traffic,f,c.id);
    // A disconnected destination is staged in place. Never interpolate across a blocked edge.
    const points=path.length?[start,...path]:[d,d];
    const cumulative=[0];for(let j=1;j<points.length;j++)cumulative[j]=cumulative[j-1]+dist(points[j],points[j-1]);
    c.homeX=c.x=d.x;c.homeY=c.y=d.y;c.hx=face;c.hy=0;c.sector=d.sector;c.initialFront=c.homeX+face*170;
    if(!legacy){
        if(d.role==='garrison'){
            if(c.line!==6&&d.objectiveId!==undefined&&w.layout.objectives[d.objectiveId].kind==='farm'){c.base+=8;c.morale+=8;}
            c.line=6;c.order='hold';
        }else if(foot(c)){
            c.line=d.role==='reserve'?(isGuard(c)?2:1):0;c.order=d.role==='reserve'?'reserve':'hold';
            c.name=c.name.replace('（农庄守军）','');
            if(c.battalion>=0 && c.battalionSlot>=0 && w.battalions[c.battalion]){
                w.battalions[c.battalion].line=c.line;
                w.battalions[c.battalion].order=c.order;
            }
        }
    }
    c.formation=d.formation;formUp(c);
    const station=new Float32Array(c.members.length*2),march=new Float32Array(station.length);
    for(const [k,u] of c.members.entries()){station[2*k]=u.x-d.x;station[2*k+1]=u.y-d.y;}
    const finalLine=c.line;c.line=0;c.formation=isArtillery(c)?'battery':finalLine===5?'staff':'column';formUp(c,false);c.line=finalLine;
    for(const [k,u] of c.members.entries()){march[2*k]=(u.x-d.x)*face;march[2*k+1]=(u.y-d.y)*face;}
    return {c,d,points,cumulative,length:cumulative[cumulative.length-1],delay,stop,march,station,finished:false};
}
/** 保持炮兵连 4～6 门炮编制完整，不拆成 1 门孤炮。 */
function detachBridgeGuns(_w:DeploymentWorld){
    return new Map<number,Objective>();
}
export function prepareDeployment(w:DeploymentWorld):[BattlePlan,BattlePlan]{
    const bridgeGuns=detachBridgeGuns(w);
    const plans=([0,1] as const).map(f=>planSide(w,f,new Rng(w.seed^(f?0x61726368:0x706c616e)),bridgeGuns)) as [BattlePlan,BattlePlan];
    routes.set(w,plans.flatMap(p=>{
        const traffic=p.destinations.map((d,i)=>openingStart(w,d,i));
        return p.destinations.map((d,i)=>setupRoute(w,d,i,p.legacy,traffic[i],traffic));
    }));
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
        const {c,d,points,march,station}=route;
        const t=route.length===0?1:clamp((w.tick-route.delay)/(route.stop-route.delay),0,1);
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
        if(t===1){c.formation=d.formation;c.hx=face;c.hy=0;formUp(c);c.vx=c.vy=0;route.finished=true;if(isArtillery(c)){const a=Math.atan2(c.hy,c.hx);for(const g of c.members){g.aim=a;g.reaimTargetAim=a;g.reaimKind='none';}}}
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
