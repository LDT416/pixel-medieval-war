import {supplyBend} from './maps';
import {pay,ready} from './buildings';
import {batchSize,capacity,crews,UNITS,strength,shelter} from './config';
import { distanceTo } from './combat';
import type { SimWorld } from './world';
import type { Command, Faction, Structure, Unit } from './types';
export function civicCommand(w: SimWorld, c: Command) {
    const f = c.faction, realm = w.realms[f];
    const refuse = (msg: string) => { if (f === w.player)
        w.news = msg; return true; };
    const keep=w.keep(f);
    if(!keep)return true;
    if(c.type==='policy'){realm.policy=realm.policy==='auto'?'gold':realm.policy==='gold'?'wood':'auto';return true;}
    if(c.type==='cottage'){
        if(realm.age>=4)return refuse('农舍已达最高等级');
        if(w.mode==='lord'&&!pay(realm,80*realm.age,75*realm.age))return refuse('升级所需木材或军粮不足');
        realm.age++;keep.age=realm.age;
        for(const farm of w.structures)if(farm.type==='house'&&farm.faction===f)farm.age=realm.age;
        for(const type of ['house','wheat'] as const){
            const model=w.structures.find(s=>s.type===type&&s.faction===f)!;
            const s={...model,id:w.next++,age:realm.age,x:model.x+(f?-1:1)*(realm.age===3?0:170),y:model.y-(realm.age>=3?125:0),hp:model.maxHp};
            w.structures.push(s);w.byStructure.set(s.id,s);
        }
        w.dirty=true;return true;
    }
    if(c.type==='train'){
        const kind=c.payload.kind,def=UNITS[kind];
        if(kind==='supply_wagon')return true;
        const pending=(keep.queue??[]).filter(q=>q.kind===kind).length;
        const total=pending+w.units.filter(u=>u.faction===f&&u.kind===kind&&!u.gun).length;
        if(kind==='peasant'&&w.mode==='lord'&&total>=capacity[realm.age])return refuse('农舍已满，请扩建村落');
        if(w.mode==='lord'&&def.role==='重炮机械'&&!w.structures.some(s=>s.type==='foundry'&&s.faction===f&&ready(s)))return refuse('请先建造重炮铸造厂');
        if(w.mode==='lord'&&['guard_grenadier','highlander','cuirassier'].includes(kind)&&!w.structures.some(s=>s.type==='barracks'&&s.faction===f&&ready(s)))return refuse('请先建成近卫军营');
        const cost=c.payload.full?strength[kind]/batchSize(kind):1;
        if(w.mode==='lord'&&!pay(realm,Math.ceil(def.wood*cost),Math.ceil(def.gold*cost)))return refuse('军粮或木材不足');
        (keep.queue??=[]).push({kind,full:c.payload.full,progress:0,total:w.mode==='sandbox'?1:kind==='peasant'?10:18});return true;
    }
    if (c.type === 'research') {
        const key = c.payload.tech;
        if (realm[key])
            return true;
        if (w.mode==='lord'&&(!w.structures.some(s => s.faction === f && s.type === 'academy' && ready(s)) || realm.age < 2))
            return refuse('研发需要 T2 时代与建成的陆军学院。');
        if (w.mode==="lord"&&!pay(realm, 100, 140))
            return refuse('研发需要木材 100、军粮 140。');
        realm[key] = true;
        return true;
    }
    if (c.type === 'rally') {
        const s = w.byStructure.get(c.payload.building ?? 0);
        if (s && s.faction === f)
            s.rally = { x: c.payload.x, y: c.payload.y };
        else
            realm.rally = { x: c.payload.x, y: c.payload.y };
        return true;
    }
    if (c.type === 'gather') {
        const ids = c.payload.ids && new Set(c.payload.ids);
        for (const u of w.units)
            if (u.faction === f && u.kind === 'peasant' && (!ids || ids.has(u.id))) {
                u.prefer = c.payload.resource;
                u.job = c.payload.target;
            }
        return true;
    }
    return false;
}
export function economyTick(w: SimWorld) {
    if (w.mode === 'lord' && w.tick > 0 && w.tick % 75 === 0)
        for (const f of [0, 1] as const)
            if (w.keep(f)) {
                w.realms[f].gold += 18;
                w.realms[f].wood += 8;
            }
    for (const s of w.structures) {
        if(s.faction!==-1&&ready(s)&&w.tick>0){
            if(w.tick%90===0&&shelter(s.type)&&w.units.some(n=>n.tower===s.id&&n.hp>0))w.realms[s.faction].gold+=8;
            if(s.type==='house'&&(s.age??1)>=2&&(w.tick+s.id)%360===0&&!w.units.some(u=>u.farm===s.id)){
                const wagon=w.spawn(s.faction,'supply_wagon',1,{x:s.x,y:s.y+48},'line')[0];
                wagon.farm=s.id;wagon.cargo=64*(s.age??2);
            }
        }
        const item = s.queue?.[0];
        if (!item || !ready(s) || s.faction === -1)
            continue;
        if (++item.progress < item.total)
            continue;
        s.queue!.shift();
        const f = s.faction, p = { x: s.x + (f === 0 ? 1 : -1) * (s.w / 2 + 28), y: s.y }, kind = item.kind;
        if(kind==='peasant'){p.x=s.x-(f?-1:1)*120;p.y=s.y-145;}
        const qty=item.full?strength[kind]:batchSize(kind);
        const troops=item.full?w.spawn(f,kind,qty,p,'line'):w.reinforce(f,kind,qty,p);
        for (const u of troops) {
            const rally=s.rally??w.realms[f].rally;
            if(rally)w.groups.get(u.group)!.point=rally;
        }
    }
}
function closest(u: Unit, sites: Structure[]) {
    let best: Structure | undefined, score = Infinity;
    for (const s of sites) {
        const d = distanceTo(u, s);
        if (d < score) {
            best = s;
            score = d;
        }
    }
    return best;
}
export function work(w: SimWorld, u: Unit) {
    if(u.kind==='supply_wagon'){
        const farm=w.byStructure.get(u.farm??0),keep=w.keep(u.faction);
        const dest=u.returning?farm:keep;
        if(!farm||!keep||!dest||dest.hp<=0){u.hp=0;return true;}
        if(!u.passedBend){
            const bend=supplyBend(farm,keep);
            if(Math.hypot(u.x-bend.x,u.y-bend.y)>10){w.approach(u,bend);return true;}
            u.passedBend=true;
        }
        if(distanceTo(u,dest)>24)w.approach(u,dest);
        else if(u.returning){u.hp=0;}
        else{w.realms[u.faction].gold+=u.cargo??0;w.realms[u.faction].wood+=Math.floor((u.cargo??0)/2);u.cargo=0;u.returning=true;u.passedBend=false;}
        return true;
    }
    if (u.kind !== 'peasant' && u.kind !== 'sapper')
        return false;
    const f = u.faction;
    let threatened=false;
    if(u.kind==='peasant')w.hash.visit(u.x,u.y,110,n=>{if(n.faction!==f)threatened=true;});
    if(threatened){const home=w.keep(f);if(home)w.approach(u,home);return true;}
    let job = w.byStructure.get(u.job ?? 0);
    const isProject = (s: Structure) => s.hp > 0 && (s.faction === f || s.id === u.job && s.faction === -1 && ['bridge', 'pontoon'].includes(s.type)) && (!!s.needed || s.hp < s.maxHp);
    if (!job || !isProject(job)) {
        if ((w.tick + u.id) % 24 === 0 || !job) {
            const site = closest(u, w.structures.filter(isProject));
            if (site) {
                u.job = site.id;
                job = site;
            }
        }
    }
    if (job && isProject(job)) {
        if (distanceTo(u, job) > 26)
            w.approach(u, job);
        else {
            const rate = u.kind === 'sapper' ? 2.5 : 1;
            if (job.needed) {
                job.work = (job.work ?? 0) + rate;
                job.hp = Math.min(job.maxHp, job.hp + rate * job.maxHp / job.needed);
                if (job.work >= job.needed) {
                    job.needed = 0;
                    w.finishBuilding();
                    u.job = undefined;
                }
            }
            else {
                job.hp = Math.min(job.maxHp, job.hp + rate * 1.8);
                if (job.hp >= job.maxHp)
                    u.job = undefined;
            }
        }
        return true;
    }
    if(u.kind==='sapper'){
        const gun=w.units.find(n=>n.faction===f&&n.crew&&n.hp>0&&n.hp<UNITS[n.kind].hp&&distanceTo(u,n)<85);
        if(gun){if(distanceTo(u,gun)>23)w.approach(u,gun);else gun.hp=Math.min(UNITS[gun.kind].hp,gun.hp+1.5);return true;}
        if(u.manual||u.gun)return false;
        const tree=w.structures.find(s=>s.type==='tree'&&s.hp>0&&distanceTo(u,s)<36);
        if(tree&&u.cooldown<=0){w.damageStructure(tree,tree.hp,f,'sapper');w.realms[f].wood+=38;u.cooldown=20;u.swing=6;return true;}
        return false;
    }
    const keep = w.keep(f);
    if (!keep)
        return true;
    if (u.cargo) {
        if (distanceTo(u, keep) > 27)
            w.approach(u, keep);
        else {
            w.realms[f][u.resource ?? 'wood'] += u.cargo;
            u.cargo = 0;
        }
        return true;
    }
    const realm=w.realms[f];
    const workers=w.units.filter(n=>n.faction===f&&n.kind==='peasant'&&n.hp>0);
    const rank=workers.indexOf(u);
    const fraction=realm.policy==='auto'?.5:realm.policy==='gold'?.75:.25;
    const resource=u.prefer??(rank<Math.round(workers.length*fraction)?'gold':'wood');
    const type=resource==='wood'?'tree':'wheat';
    if (!job || job.hp <= 0 || job.type !== type || (job.stock ?? 1) <= 0) {
        job = closest(u, w.structures.filter(s => s.type === type && (type==='tree'||s.faction===f) && s.hp > 0 && (s.stock ?? 1) > 0));
        u.job = job?.id;
    }
    if (!job)
        return true;
    if (distanceTo(u, job) > 25) {
        w.approach(u, job);
        return true;
    }
    if ((u.laborTick ?? 0) % 16 === 0)
        u.swing = 5;
    if ((u.laborTick = (u.laborTick ?? 0) + 1) < 40)
        return true;
    u.laborTick = 0;
    u.resource = resource;
    const level=Math.max(0,...w.structures.filter(s=>s.type==='house'&&s.faction===f&&s.hp>0).map(s=>s.age??1));
    u.cargo=Math.round((level?32:8)*(1+.28*Math.max(0,level-1)));
    if (type === 'tree')
        w.damageStructure(job, job.hp, f, 'peasant');

    u.job = undefined;
    return true;
}
