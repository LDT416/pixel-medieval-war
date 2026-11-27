import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type { Company, Faction } from './arenaTypes';
import type { Sector } from './maps';
import type { SimWorld } from './world';
import {dist} from './combat';

const names=['左翼','中央','右翼'];
const sectors=[0,1,2] as const;
const foot=(c:Company)=>isLineTroop(c)||isGuard(c);
const active=(c:Company)=>c.alive>0 && c.status!=='rout' && c.status!=='gone';
type Task={until:number; purpose:'point'|'reserve'|'screen'};

export class CommandPlan {
    private nextPhase=[0,0];
    private tasks=new Map<number,Task>();
    private used=new Set<number>();
    private squareUntil=new Map<number,number>();
    reset(){
        this.nextPhase=[0,0];this.tasks.clear();this.used.clear();this.squareUntil.clear();
    }
    assigned(c:Company,tick:number){return (this.tasks.get(c.id)?.until??-1)>tick;}
    wantsSquare(c:Company,tick:number){return (this.squareUntil.get(c.id)??-1)>tick;}
    private assign(w:SimWorld,c:Company,purpose:Task['purpose'],order:'hold'|'advance'|'charge',target=-1,point?:{x:number;y:number}){
        const id=w.logistics.dispatch(w,c,order,target,point);
        if(id<0)return false;
        this.tasks.set(c.id,{purpose,until:w.tick+(purpose==='point'?2700:900)});
        return true;
    }
    review(w:SimWorld,f:Faction){
        const plan=w.plans[f], own=w.companies.filter(c=>c.faction===f&&c.line!==5),enemy=w.sight.visibleToArmy(w,f).filter(c=>active(c)&&c.line!==5);
        const friendly=own.filter(c=>active(c)&&!w.lostSectors[f][c.sector]&&!w.logistics.isCommitted(c));
        const available=friendly.filter(c=>!c.engaged&&!this.assigned(c,w.tick));
        const ready=plan.reserve.map(id=>w.companies[id]).filter(c=>c&&available.includes(c)&&!this.used.has(c.id));
        const points=w.layout.objectives;
        const missing=points.filter(p=>p.owner!==f && plan.destinations.some(d=>d.role==='garrison' && d.objectiveId===p.id));
        const urgent=sectors.map(sector=>{
            const group=own.filter(c=>c.sector===sector),initial=group.reduce((a,c)=>a+c.peak,0);
            return {sector,remaining:initial?group.reduce((a,c)=>a+(active(c)?c.alive:0),0)/initial:1};
        }).sort((a,b)=>a.remaining-b.remaining)[0];
        const danger=missing[0]?.sector??(urgent.remaining<.60?urgent.sector:null);
        const troops=enemy.filter(c=>c.sector===plan.mainEffort);
        const target=troops.find(c=>foot(c))??troops[0];
        const opening=w.tick-w.deployEnd;
        let stage=this.nextPhase[f];
        while(stage<plan.phases.length && opening>=plan.phases[stage].trigger){
            const phase=plan.phases[stage++];
            w.say(w.generals[f].name+'开始'+phase.name+'，主攻方向为'+names[plan.mainEffort],f,target?.x??w.layout.width/2,(plan.mainEffort+.5)*w.layout.height/3,2);
            if(phase.orders==='charge'){
                const vulnerable=enemy.filter(c=>isArtillery(c)||c.status==='shaken');
                for(const horse of available.filter(c=>isMounted(c) && w.tick>=c.blownUntil && c.order==='hold')){
                    const mark=vulnerable.filter(c=>c.sector===horse.sector && dist(horse,c)<1650)
                        .sort((a,b)=>dist(horse,a)-dist(horse,b))[0];
                    if(mark)this.assign(w,horse,'screen','charge',mark.id);
                }
            }
            if(target && phase.orders==='advance'){
                for(const c of available.filter(c=>c.sector===plan.mainEffort && c.line===0 && c.order==='hold'))w.logistics.dispatch(w,c,'advance',target.id);
            }
        }
        this.nextPhase[f]=stage;
        const commit= danger!==null || (stage>=plan.phases.length && opening>7000);
        if(commit && ready.length){
            const sector=danger??plan.mainEffort;
            const point=missing[0]??points.find(p=>p.sector===sector);
            const contact=enemy.filter(c=>c.sector===sector).sort((a,b)=>dist(a,point??ready[0])-dist(b,point??ready[0]))[0];
            const c=ready.sort((a,b)=>dist(a,point??target??a)-dist(b,point??target??b))[0];
            if(this.assign(w,c,'reserve',point && danger!==null?'hold':'advance',point && danger!==null?-1:contact?.id??-1,point)){
                this.used.add(c.id);plan.reserveAt??=w.tick;
                w.say(w.generals[f].name+'投入'+c.name+'，增援'+names[sector],f,c.x,c.y,3);
            }
        }
        if(target){
            const batteries=troops.filter(c=>isArtillery(c));
            for(const c of available.filter(c=>isArtillery(c)&&c.sector===plan.mainEffort)){
                const aim=batteries.length>1?batteries.reduce((a,b)=>dist(c,a)<dist(c,b)?a:b):target;
                if(c.forced!==aim.id && dist(c,aim)<2450)w.logistics.dispatch(w,c,'hold',aim.id);
            }
        }
        for(const horse of available.filter(c=>isMounted(c) && c.order==='hold' && w.tick>=c.blownUntil)){
            const escort=friendly.filter(c=>foot(c) && c.sector===horse.sector && (c.order==='advance'||c.order==='assault'))
                .sort((a,b)=>dist(horse,a)-dist(horse,b))[0];
            if(!escort || dist(horse,escort)<600 || enemy.some(e=>dist(e,horse)<450))continue;
            const point={x:escort.x+(f?1:-1)*240,y:escort.y+(horse.id%2?165:-165)};
            this.assign(w,horse,'screen','hold',-1,point);
        }
        for(const sector of sectors){
            const horse=enemy.filter(c=>isMounted(c) && c.sector===sector && c.order==='charge');
            if(horse.length)for(const c of friendly.filter(c=>c.line===1 && c.sector===sector && c.id%2===0)){
                if(horse.some(h=>dist(h,c)<480))this.squareUntil.set(c.id,w.tick+310);
            }
            const point=points.find(p=>p.sector===sector && p.owner!==f && (plan.role==='attack'||missing.includes(p)));
            if(!point || w.lostSectors[f][sector] || !opening || friendly.some(c=>foot(c)&&dist(c,point)<135))continue;
            const c=available.filter(c=>c.sector===sector && foot(c) && c.line!==6 && (!plan.reserve.includes(c.id)||this.used.has(c.id)) && c.status==='steady' && !this.assigned(c,w.tick))
                .sort((a,b)=>dist(a,point)-dist(b,point))[0];
            if(c && dist(c,point)<1950 && !enemy.some(e=>dist(e,c)<250) && this.assign(w,c,'point','hold',-1,point)){
                w.say(c.name+'受令前往'+point.name,f,c.x,c.y,1);
            }
        }
        if(plan.breakthrough===null){
            const taken=points.find(p=>p.owner===f&&friendly.some(c=>c.captures>0&&dist(c,p)<230));
            const broken=w.lostSectors[1-f].findIndex(Boolean);
            if(taken || broken>=0)plan.breakthrough=taken?.sector??broken as Sector;
        }
    }
}
