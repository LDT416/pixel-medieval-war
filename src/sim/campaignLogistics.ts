import type {Company,Faction,Order} from './arenaTypes';
import {sectorOf,type Sector} from './maps';
import type {Point} from './types';
import type {SimWorld} from './world';

const SECTORS=[0,1,2] as const;
const FACTIONS=[0,1] as const;
import {PACE} from './scale';
const COURIER_SPEED=PACE.courier;
const rifle=(c:Company)=>c.kind==='line_infantry'||c.kind==='guard_grenadier';
const present=(c:Company)=>c.alive>0&&c.status!=='rout'&&c.status!=='gone';
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
interface Corps {id:number;faction:Faction;sector:Sector;commanderId:number}
interface Brigade extends Corps {corps:number;companies:number[]}
interface Wagon extends Point {id:number;faction:Faction;sector:Sector;stock:number;destroyed:boolean}
interface Courier extends Point {
    id:number;faction:Faction;dx:number;dy:number;company:number;order:Order;
    target:number;point?:Point; relief?:{front:number;reserve:number}; returning?:boolean;
}

/** 指挥员引用战场上的实体。传令与弹药车只使用模拟帧及实体坐标。 */
export class CampaignLogistics{
    corps:Corps[]=[];brigades:Brigade[]=[];wagons:Wagon[]=[];couriers:Courier[]=[];
    delivered=0;lost=0;issued=0;resupplied=0;rotations=0;
    handovers:{tick:number;front:number;reserve:number;distance:number;x:number;y:number}[]=[];
    private relieving=new Map<number,{front:number;since:number;active:boolean;retireSent:number}>();
    private returningVia=new Map<number,Point>();
    private resting=new Map<number,number>();
    private reliefCooldown=new Map<number,number>();

    reset(w:SimWorld){
        this.handovers=[];this.relieving.clear();this.returningVia.clear();this.resting.clear();this.reliefCooldown.clear();this.couriers=[];this.wagons=[];this.corps=[];this.brigades=[];
        this.delivered=this.lost=this.issued=this.resupplied=this.rotations=0;
        this.sync(w);
        for(const corps of this.corps){
            const {faction,sector}=corps;
            const group=w.companies.filter(c=>c.corps===corps.id&&c.line!==5);
            const reserve=group.filter(c=>rifle(c)&&c.line!==0);
            const anchors=reserve.length?reserve:group;
            const x=anchors.reduce((s,c)=>s+c.homeX,0)/Math.max(1,anchors.length)+(faction?1:-1)*240;
            const y=anchors.reduce((s,c)=>s+c.homeY,0)/Math.max(1,anchors.length);
            this.wagons.push({id:corps.id,faction,sector,x:Math.max(80,Math.min(w.layout.width-80,x)),
                y:Math.max(80,Math.min(w.layout.height-80,y)),stock:group.reduce((s,c)=>s+c.ammo,0),destroyed:false});
        }
    }
    sync(w:SimWorld){
        if(this.brigades.length){
            const registered=new Set(this.brigades.flatMap(b=>b.companies));
            for(const c of w.companies){
                if(c.line===5||registered.has(c.id))continue;
                const sector=sectorOf(c.homeY,w.layout),corps=c.faction*3+sector;
                const group=this.brigades.filter(b=>b.corps===corps).sort((a,b)=>a.companies.length-b.companies.length)[0];
                if(!group)continue;
                let brigade=group;
                if(group.companies.length>=5){
                    const moved=group.companies.splice(-2);
                    brigade={id:this.brigades.length,faction:c.faction,sector,corps,companies:moved,commanderId:w.companies[moved[0]].members[0].id};
                    this.brigades.push(brigade);for(const id of moved)w.companies[id].brigade=brigade.id;
                }
                c.sector=sector;c.corps=corps;c.brigade=brigade.id;brigade.companies.push(c.id);
            }
            return;
        }
        for(const faction of FACTIONS){
            const troops=w.companies.filter(c=>c.faction===faction&&c.line!==5);
            const sectors=SECTORS.map(sector=>troops.filter(c=>sectorOf(c.homeY,w.layout)===sector));
            // 小规模局的边翼也应组成完整旅。将邻区最靠近该翼的连纳入指挥。
            for(const sector of SECTORS){
                while(sectors[sector].length<3){
                    const donor=SECTORS.filter(i=>i!==sector&&sectors[i].length>3)
                        .sort((a,b)=>Math.abs(a-sector)-Math.abs(b-sector)||sectors[b].length-sectors[a].length)[0];
                    if(donor===undefined)break;
                    const center=(sector+.5)*w.layout.height/3;
                    sectors[donor].sort((a,b)=>Math.abs(a.homeY-center)-Math.abs(b.homeY-center));
                    sectors[sector].push(sectors[donor].shift()!);
                }
            }
            for(const sector of SECTORS){
                const group=sectors[sector].sort((a,b)=>a.homeY-b.homeY||a.id-b.id);
                if(!group.length)continue;
                const corps=faction*3+sector,groups=Math.max(1,Math.round(group.length/4)),leaders=new Set<number>();
                for(let i=0;i<groups;i++){
                    const units=group.slice(Math.floor(i*group.length/groups),Math.floor((i+1)*group.length/groups));
                    const id=this.brigades.length,commanderId=units[0].members[0].id;
                    this.brigades.push({id,faction,sector,corps,commanderId,companies:units.map(c=>c.id)});leaders.add(commanderId);
                    for(const c of units){c.brigade=id;c.sector=sector;c.corps=corps;}
                }
                const commander=group.map(c=>c.members[0]).find(u=>!leaders.has(u.id))??group[0].members[1]??group[0].members[0];
                this.corps.push({id:corps,faction,sector,commanderId:commander.id});
            }
        }
    }
    isResting(c:Company){return this.resting.has(c.id);}
    isRelieving(c:Company){return this.relieving.get(c.id)?.active===true;}
    isCommitted(c:Company){
        if(this.resting.has(c.id)||this.relieving.has(c.id))return true;
        for(const task of this.relieving.values())if(task.front===c.id)return true;
        return false;
    }
    dispatch(w:SimWorld,c:Company,order:Order,target=-1,point?:Point){
        const general=w.generals[c.faction].unit;
        if(!general||general.hp<=0||!present(c)||w.winner!==null||w.broken[c.faction]||w.lostSectors[c.faction][c.sector])return -1;
        const previous=this.couriers.find(m=>m.company===c.id);
        if(previous){
            if(previous.relief||previous.returning)return previous.id;
            const samePoint=previous.point&&point?distance(previous.point,point)<10:!previous.point&&!point;
            if(previous.order===order&&previous.target===target&&samePoint)return previous.id;
            // 新令从指挥部另派骑手，作废旧令。
            this.couriers.splice(this.couriers.indexOf(previous),1);
        }
        if(this.resting.has(c.id))return -1;
        const id=++this.issued;
        this.couriers.push({id,faction:c.faction,company:c.id,order,target,point:point?{...point}:undefined,x:general.x,y:general.y,dx:c.faction?-1:1,dy:0});
        return id;
    }
    private intercepted(w:SimWorld,p:Point,faction:Faction,radius:number,horseOnly:boolean){
        let hit=false;
        w.hash.visit(p.x,p.y,radius,u=>{
            if(u.faction!==faction&&!u.staff&&(!horseOnly||u.kind==='cuirassier')&&present(w.companies[u.company]))hit=true;
        });
        return hit;
    }
    private wagonFor(c:Company){
        return this.wagons.filter(v=>v.faction===c.faction&&!v.destroyed&&v.stock>0)
            .sort((a,b)=>Number(a.sector!==c.sector)-Number(b.sector!==c.sector)||distance(a,c)-distance(b,c))[0];
    }
    requestRelief(w:SimWorld,front:Company,second?:Company){
        if(front.line!==0||!present(front)||this.isCommitted(front)||w.tick<(this.reliefCooldown.get(front.id)??0))return false;
        const wagon=this.wagonFor(front);if(!wagon)return false;
        const candidates=w.companies.filter(c=>c.faction===front.faction&&c.sector===front.sector&&c.line===1&&rifle(c)&&
            present(c)&&!c.engaged&&!this.isCommitted(c)&&c.morale>=42&&c.ammo>c.alive*6&&!this.couriers.some(m=>m.company===c.id));
        const reserve=second?candidates.find(c=>c===second):candidates.sort((a,b)=>distance(a,front)-distance(b,front))[0];
        if(!reserve)return false;
        const id=this.dispatch(w,reserve,'reserve',-1,{x:front.x,y:front.y});
        const courier=this.couriers.find(m=>m.id===id);if(!courier)return false;
        courier.relief={front:front.id,reserve:reserve.id};
        this.relieving.set(reserve.id,{front:front.id,since:w.tick,active:false,retireSent:-1});
        this.reliefCooldown.set(front.id,w.tick+900);
        return true;
    }
    private deliver(w:SimWorld,m:Courier,c:Company){
        if(m.returning){
            const pending=[...this.relieving].find(([,task])=>task.front===c.id);
            if(!pending)return;
            if(distance(c,w.companies[pending[0]])>105){pending[1].retireSent=-1;return;}
        }
        c.order=m.order;c.forced=m.target;
        if(m.point){c.homeX=m.point.x;c.homeY=m.point.y;}
        if(m.order==='assault'||m.order==='charge')c.chargeAt=w.tick;
        if(m.returning){
            c.line=1;this.resting.set(c.id,w.tick);
            if(m.point)this.returningVia.set(c.id,m.point);
            const pair=[...this.relieving].find(([,task])=>task.front===c.id);
            if(pair){
                const [id]=pair,reserve=w.companies[id];reserve.line=0;this.relieving.delete(id);
                this.rotations++;this.handovers.push({tick:w.tick,front:c.id,reserve:id,distance:distance(reserve,c),x:c.x,y:c.y});
                w.say(reserve.name+'接替'+c.name+'的一线阵地',c.faction,c.x,c.y,2);
            }
        }else if(m.relief){
            const pair=this.relieving.get(c.id);if(pair)pair.active=true;
        }
    }
    private advanceReliefs(w:SimWorld){
        for(const [id,task] of this.relieving){
            const reserve=w.companies[id],front=w.companies[task.front];
            if(!present(front)||!present(reserve)||w.lostSectors[front.faction][front.sector]||w.tick-task.since>9000){
                this.relieving.delete(id);
                this.couriers=this.couriers.filter(m=>!(m.relief?.reserve===id||m.returning&&m.company===front.id));
                continue;
            }
            if(!task.active)continue;
            // 一线两侧各留通道；二线必须实际到达，前一线才收到撤出通知。
            const offset=id%2?1:-1;
            reserve.order='reserve';reserve.forced=-1;reserve.homeX=front.x;reserve.homeY=front.y+offset*34;
            if(distance(reserve,front)>95)continue;
            if(task.retireSent>=0&&(this.couriers.some(m=>m.returning&&m.company===front.id)||w.tick-task.retireSent<120))continue;
            const wagon=this.wagonFor(front);if(!wagon){this.relieving.delete(id);continue;}
            const via={x:front.x+(front.faction?1:-1)*135,y:front.y-offset*110};
            const messageId=this.dispatch(w,front,'rally',-1,via);
            const m=this.couriers.find(r=>r.id===messageId);if(m){m.returning=true;task.retireSent=w.tick;}
        }
    }
    private supply(w:SimWorld){
        for(const wagon of this.wagons){
            if(wagon.destroyed)continue;
            if(this.intercepted(w,wagon,wagon.faction,75,true)){
                wagon.destroyed=true;wagon.stock=0;
                w.say('后方弹药车被骑兵截获',wagon.faction,wagon.x,wagon.y,2);
            }
        }
        for(const c of w.companies){
            if(!present(c)||c.line===5)continue;
            const moving=Math.hypot(c.vx,c.vy)>2;
            const firing=w.tick-c.firingSince<150&&c.firingSince>=0||w.tick-c.lastMelee<45;
            const rate=c.assaultStage==='rush'||c.order==='charge'&&moving?.0045:c.engaged||firing?.0026:moving?.0012:-.005;
            c.fatigue=Math.max(0,Math.min(1,c.fatigue+rate));
            if(c.fatigue>.6&&(c.engaged||firing))c.morale=Math.max(0,c.morale-(c.fatigue-.6)*.12);
            if(!rifle(c))continue;
            const wagon=this.wagonFor(c),rest=this.resting.get(c.id);
            if(rest!==undefined&&(!wagon||wagon.destroyed)){this.resting.delete(c.id);continue;}
            if(rest!==undefined&&wagon){
                const via=this.returningVia.get(c.id);
                if(via&&distance(c,via)<46)this.returningVia.delete(c.id);
                const target=this.returningVia.get(c.id)??wagon;c.order='rally';c.homeX=target.x;c.homeY=target.y;
            }
            if(!moving&&!c.engaged&&wagon&&distance(c,wagon)<170){
                for(const u of c.members){
                    if(u.hp<=0||u.escaped||u.kind==='bannerman')continue;
                    const add=Math.min(4,40-u.ammo,wagon.stock);
                    u.ammo+=add;c.ammo+=add;wagon.stock-=add;this.resupplied+=add;
                }
                if(rest!==undefined){
                    c.morale=Math.min(c.base,c.morale+.65);
                    if(c.fatigue<.30&&c.ammo>=c.alive*18&&w.tick-rest>300)this.resting.delete(c.id);
                }
            }
            if(w.tick%150===0&&c.line===0&&(c.morale<42||c.ammo<c.alive*6||c.losses>c.peak*.2&&c.morale<c.base*.72))this.requestRelief(w,c);
        }
    }
    step(w:SimWorld){
        if(w.winner!==null){this.couriers.length=0;return;}
        for(let i=this.couriers.length-1;i>=0;i--){
            const m=this.couriers[i],c=w.companies[m.company];
            if(!present(c)||w.broken[c.faction]||w.lostSectors[c.faction][c.sector]){
                this.couriers.splice(i,1);continue;
            }
            const dx=c.x-m.x,dy=c.y-m.y,d=Math.hypot(dx,dy),step=Math.min(d,COURIER_SPEED/30);
            if(d){m.dx=dx/d;m.dy=dy/d;m.x+=m.dx*step;m.y+=m.dy*step;}
            if(this.intercepted(w,m,m.faction,21,false)){
                this.couriers.splice(i,1);this.lost++;if(m.relief)this.relieving.delete(m.relief.reserve);
                w.say('通往'+c.name+'的传令兵阵亡，命令丢失',c.faction,m.x,m.y,1);continue;
            }
            if(d<=COURIER_SPEED/30){
                this.couriers.splice(i,1);this.delivered++;this.deliver(w,m,c);
            }
        }
        if(w.tick%6===0)this.advanceReliefs(w);
        if(w.tick%30===0)this.supply(w);
    }
}
