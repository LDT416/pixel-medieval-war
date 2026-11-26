import type {SimWorld} from './world';
import type {Faction,Group,Point,Unit} from './types';
import {UNITS,crews,rankFire,formationSize,shelter,strength,canGarrison} from './config';
import {slotOffset} from './formation';
import {distanceTo,attack} from './combat';
import {roadY} from './maps';
import {faceToward} from './physics';

export const fieldArmy=(u:Unit)=>u.hp>0&&!u.tower&&!u.gun&&!['peasant','supply_wagon'].includes(u.kind)&&!crews[u.kind];
export const threshold=(age:number)=>55+30*(age-1);
export function issueWave(w:SimWorld,f:Faction,charge:boolean){
    const r=w.realms[f];r.phase=charge?'WAVE_ASSAULT':'RETREAT_REGROUP';r.wave++;
    r.baseline=w.units.filter(u=>u.faction===f&&fieldArmy(u)).length;
    for(const u of w.units)if(u.faction===f&&fieldArmy(u)){
        const g=w.groups.get(u.group)!;g.point=null;g.targetId=0;g.reform=undefined;g.firingLine=undefined;u.manual=false;
        if(!charge){g.resting=true;g.restTick=undefined;u.enterTower=undefined;}
    }
    if(charge){const home=w.keep(f);if(home)w.events.push({type:'horn',x:home.x,y:home.y,faction:f});}
}
export function assignSlots(g:Group,troops:Unit[]){
    g.count=troops.length;g.peak=Math.max(g.peak??0,g.count);
    const files=Math.ceil(g.count/3);
    troops.forEach((u,i)=>{u.group=g.id;u.slot=i;u.rankIndex=Math.floor(i/files);u.commandRole=undefined;});
    if(rankFire(troops[0].kind)&&g.count>=20){
        troops[Math.floor(g.count/2)].commandRole='flag';troops[Math.floor(g.count/2)+1].commandRole='drum';
    }
}
export function restPost(w:SimWorld,f:Faction,p:Point){
    let best:Point={x:f?3828:972,y:880},dist=Math.hypot(best.x-p.x,best.y-p.y);
    for(const s of w.structures)if(s.type==='redoubt'&&s.hp>0&&!s.needed&&s.faction===f&&distanceTo(p,s)<dist){
        best={x:s.x+(f?100:-100),y:s.y};dist=distanceTo(p,s);
    }
    return best;
}
export function strategyTick(w:SimWorld){
    const units=new Map<number,Unit[]>();
    for(const u of w.units)if(u.hp>0){const a=units.get(u.group);if(a)a.push(u);else units.set(u.group,[u]);}
    for(const [id,g] of w.groups){
        const a=units.get(id);if(!a?.length){w.groups.delete(id);continue;}
        const free=a.filter(u=>!u.tower);if(!free.length)continue;
        const u=free[0],f=u.faction;
        g.anchor={x:free.reduce((s,n)=>s+n.x,0)/free.length,y:free.reduce((s,n)=>s+n.y,0)/free.length};
        if(!fieldArmy(u))continue;
        const morale=free.reduce((s,n)=>s+(n.morale??75),0)/free.length;
        if(!g.resting&&(a.length<(g.peak??g.count)*.22||morale<25)){assignSlots(g,a);g.resting=true;g.restTick=undefined;g.firingLine=undefined;g.reform=undefined;g.point=null;g.targetId=0;for(const n of free)n.enterTower=undefined;}
        if(g.resting){
            const post=restPost(w,f,g.anchor);g.destination=post;g.volleyStart=undefined;
            if(Math.hypot(post.x-g.anchor.x,post.y-g.anchor.y)>135){g.restTick=undefined;continue;}
            g.restTick??=w.tick;
            if(w.tick-g.restTick<90)continue;
            for(const n of free){n.morale=85;n.hp=Math.min(UNITS[n.kind].hp,n.hp+1);}
            const ally=[...units.values()].find(other=>w.groups.has(other[0].group)&&other!==a&&other[0].faction===f&&other[0].kind===u.kind&&!other.some(n=>n.tower)&&!w.groups.get(other[0].group)?.resting&&other.length+free.length<=strength[u.kind]);
            if(ally){const group=w.groups.get(ally[0].group)!;ally.push(...free);assignSlots(group,ally);if(free.length===a.length)w.groups.delete(id);else assignSlots(g,a.filter(n=>n.tower));}
            else if(free.length>=Math.min(20,strength[u.kind])||w.realms[f].phase==='RETREAT_REGROUP'){g.resting=false;g.peak=a.length;g.restTick=undefined;}
            else {const main=w.units.find(n=>n.faction===f&&n.group!==id&&fieldArmy(n)&&(w.groups.get(n.group)?.count??0)>=20&&!w.groups.get(n.group)?.resting);if(main){g.resting=false;g.peak=a.length;g.escortGroup=main.group;}}
            continue;
        }
        const escort=g.escortGroup&&w.groups.get(g.escortGroup);
        const enemy=w.keep(f?0:1);
        if(!enemy)continue;
        const dir=f?-1:1, flank=UNITS[u.kind].traits.includes('mount'),lane=flank?(id%2?255:1505):w.map==='twin'?(id%2?520:1240):880;
        const bridge=w.map==='twin'&&w.structures.filter(s=>['pontoon','bridge'].includes(s.type)&&s.hp>0&&!s.needed).sort((a,b)=>Math.abs(a.y-lane)-Math.abs(b.y-lane))[0];
        const advance=w.realms[f].phase==='WAVE_ASSAULT';
        const ahead=Math.min(4600,Math.max(200,g.anchor.x+dir*80));
        const crossing=bridge&&Math.abs(g.anchor.x-bridge.x)<400;
        if(g.contactTick!==undefined&&w.tick-g.contactTick>8){g.volleyStart=undefined;g.firingLine=undefined;}
        if(g.reform&&(w.tick>(g.reformUntil??Infinity)||free.every(n=>{const off=regimentSlot(n,g);return Math.hypot(n.x-g.reform!.x-off.x,n.y-g.reform!.y-off.y)<20;})))g.reform=undefined;
        const objective=w.byStructure.get(g.targetId);
        const raid=flank&&advance?w.units.filter(n=>n.faction!==f&&n.hp>0&&!n.tower&&(n.kind==='supply_wagon'||n.gun||n.kind==='peasant')&&distanceTo(g.anchor,n)<(n.kind==='supply_wagon'?800:380)).sort((a,b)=>Number(b.kind==='supply_wagon')-Number(a.kind==='supply_wagon')||distanceTo(g.anchor,a)-distanceTo(g.anchor,b))[0]:undefined;

        g.destination=g.reform??(objective&&objective.hp>0?objective:undefined)??g.point??g.firingLine??raid??(escort?escort.anchor:undefined)??(advance?{x:ahead,y:crossing?bridge.y:roadY(ahead,lane)}:restPost(w,f,g.anchor));
        if(!u.manual&&advance&&canGarrison(u.kind)&&w.tick%40===0){
            const site=w.structures.find(s=>['farmhouse','windmill'].includes(s.type)&&s.hp>0&&s.faction===-1&&distanceTo(g.anchor,s)<205);
            if(site)free.slice(0,60).forEach(n=>n.enterTower=site.id);
        }
    }
    for(const f of [0,1] as const){
        const army=w.units.filter(u=>u.faction===f&&fieldArmy(u)&&!w.groups.get(u.group)?.resting);
        const r=w.realms[f],dir=f?-1:1;
        w.fronts[f]={x:army.length?army.reduce((s,u)=>s+u.x,0)/army.length:f?3828:972,y:880,breached:army.some(u=>(u.x-2400)*dir>0)};
        if(r.phase==='WAVE_ASSAULT'&&army.length<r.baseline*.22)issueWave(w,f,false);
        if(r.phase==='RETREAT_REGROUP'&&!w.units.some(u=>u.faction===f&&w.groups.get(u.group)?.resting)){r.phase='PATROL_GATHER';r.cooldownUntil=w.tick+120;}
        if(r.phase==='PATROL_GATHER'&&w.tick>=(r.cooldownUntil??0)&&army.length>=threshold(r.age))issueWave(w,f,true);
    }
}
export function regimentSlot(u:Unit,g:Group){
    let off=slotOffset(u.slot,g.count,u.formation,u.faction,formationSize(u.kind));
    if(u.kind==='rifleman'&&u.formation==='line'){
        off.x+=Math.sin(u.slot*7.17)*9;off.y+=Math.cos(u.slot*2.13)*5;
    }
    if(u.formation==='square'&&u.commandRole)off={x:0,y:u.commandRole==='flag'?-8:8};
    return off;
}
export function moveSlot(w:SimWorld,u:Unit,g:Group){
    const dest=g.destination??g.anchor,off=regimentSlot(u,g);
    const x=dest.x+off.x,y=dest.y+off.y;
    if(Math.hypot(x-u.x,y-u.y)>3)w.approach(u,{x,y},UNITS[u.kind].speed,dest);
    if(u.squareSide===0||u.squareSide===2)faceToward(u,(u.faction?-1:1)*(u.squareSide===2?-1:1));
}
export function artillery(w:SimWorld,u:Unit){
    if(!u.crew){u.moving=false;return;}
    const f=u.faction,base=w.keep(f);if(!base)return;
    const g=w.groups.get(u.group)!;
    const fort=w.structures.find(s=>s.type==='redoubt'&&s.hp>0&&!s.needed&&s.faction===f);
    const guns=w.units.filter(n=>n.hp>0&&n.faction===f&&crews[n.kind]);
    const index=guns.indexOf(u),row=Math.floor(index/4),file=index%4;
    const position=g.point??(fort?{x:fort.x+(f?1:-1)*(70+row*85),y:fort.y+40+file*78}:{x:base.x+(f?-1:1)*((u.kind==='horse_artillery'?500:350)-row*85),y:1160+file*78});
    const ordered=w.byStructure.get(g.targetId),target=ordered&&ordered.hp>0?ordered:undefined;
    u.deployed=!target&&Math.hypot(position.x-u.x,position.y-u.y)<(u.deployed?32:10);
    u.moving=!target&&!u.deployed;
    if(u.moving){w.approach(u,position);return;}
    if(u.cooldown>0)return;
    const range=UNITS[u.kind].range;
    const site=target&&target.hp>0?target:w.structures.find(s=>s.faction===1-f&&s.hp>0&&shelter(s.type)&&distanceTo(u,s)<=range&&w.units.some(n=>n.tower===s.id));
    let foe:Unit|undefined,best=range;
    for(const n of w.units)if(n.faction!==f&&n.hp>0){const dist=distanceTo(u,n);if(dist<best){best=dist;foe=n;}}
    const goal=site??foe??w.keep(f?0:1);if(goal&&distanceTo(u,goal)<=range)attack(w,u,goal);
}
