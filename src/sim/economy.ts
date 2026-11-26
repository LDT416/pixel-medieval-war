import {pay,ready} from './buildings';
import {capacity,crews,UNITS} from './config';
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
        for(const type of ['house','wheat'] as const){
            const model=w.structures.find(s=>s.type===type&&s.faction===f)!;
            const s={...model,id:w.next++,age:realm.age,x:model.x+(f?-1:1)*(realm.age%2===0?220:0),y:model.y-(realm.age>=3?115:0),hp:model.maxHp};
            w.structures.push(s);w.byStructure.set(s.id,s);
        }
        w.dirty=true;return true;
    }
    if(c.type==='train'){
        const kind=c.payload.kind==='guard'?'bannerman':c.payload.kind,def=UNITS[kind];
        const pending=(keep.queue??[]).filter(q=>q.kind===kind).length;
        const total=pending+w.units.filter(u=>u.faction===f&&u.kind===kind&&!u.gun).length;
        if(kind==='davinci_tank'&&total>=2)return refuse('木甲战车已达两台上限');
        if(kind==='peasant'&&w.mode==='lord'&&total>=capacity[realm.age])return refuse('农舍已满，请扩建村落');
        if(w.mode==='lord'&&def.role==='重炮机械'&&!w.structures.some(s=>s.type==='siege_workshop'&&s.faction===f&&ready(s)))return refuse('请先建造军事工坊');
        if(w.mode==='lord'&&!pay(realm,def.wood,def.gold))return refuse('军粮或木材不足');
        (keep.queue??=[]).push({kind,progress:0,total:w.mode==='sandbox'?1:kind==='peasant'?12:30});return true;
    }
    if (c.type === 'research') {
        const key = c.payload.tech;
        if (w.mode !== 'lord' || realm[key])
            return true;
        if (!w.structures.some(s => s.faction === f && s.type === 'abbey' && ready(s)) || realm.age < 2)
            return refuse('研发需要 T2 时代与建成的修道院。');
        if (!pay(realm, 100, 140))
            return refuse('研发需要木材 100、黄金 140。');
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
    if (c.type === 'guard') {
        if (w.mode === 'sandbox')
            w.honorGuard(f, c.payload);
        return true;
    }
    return false;
}
export function economyTick(w: SimWorld) {
    if (w.mode === 'lord' && w.tick > 0 && w.tick % 90 === 0)
        for (const f of [0, 1] as const)
            if (w.keep(f))
                w.realms[f].gold += 6;
    for (const s of w.structures) {
        const item = s.queue?.[0];
        if (!item || !ready(s) || s.faction === -1)
            continue;
        if (++item.progress < item.total)
            continue;
        s.queue!.shift();
        const f = s.faction, p = { x: s.x + (f === 0 ? 1 : -1) * (s.w / 2 + 22), y: s.y }, kind = item.kind;
        if(kind==='peasant'){p.x=s.x-(f?-1:1)*120;p.y=s.y-145;}
        const troops = kind === 'guard'||kind==='bannerman' ? w.honorGuard(f, p) : w.spawn(f, kind, 1, p, kind === 'halberdier' ? 'phalanx' : kind === 'musketeer' ? 'line' : 'skirmish');
        for (const u of troops) {
            if (u.kind === 'peasant')
                u.prefer = w.units.filter(n => n.faction === f && n.kind === 'peasant').length % 2 ? 'wood' : 'gold';
            w.groups.get(u.group)!.point = s.rally ?? w.realms[f].rally;
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
                    w.finishBuilding(job);
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
    const resource=rank<Math.round(workers.length*fraction)?'gold':'wood';
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
