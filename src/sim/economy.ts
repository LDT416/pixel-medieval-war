import { BUILDINGS, pay, producer, ready } from './buildings';
import { UNITS } from './config';
import { distanceTo } from './combat';
import type { SimWorld } from './world';
import type { Command, Faction, Structure, Unit } from './types';
export function civicCommand(w: SimWorld, c: Command) {
    const f = c.faction, realm = w.realms[f];
    const refuse = (msg: string) => { if (f === 0)
        w.news = msg; return true; };
    if (c.type === 'train') {
        if (w.mode !== 'lord')
            return true;
        const { kind, building } = c.payload, [, type, age, wood, gold] = producer(kind);
        const hall = w.structures.filter(s => s.faction === f && s.type === type && ready(s) && (!building || building === s.id)).sort((a, b) => (a.queue?.length ?? 0) - (b.queue?.length ?? 0))[0];
        if (!hall || realm.age < age) {
            const label = type === 'keep' ? '主堡' : BUILDINGS[type as keyof typeof BUILDINGS][0];
            const buildingNow = realm.age >= age && w.structures.some(s => s.faction === f && s.type === type && s.hp > 0 && !ready(s));
            return refuse(buildingNow ? label + '仍在施工中，完工后即可征召。' : '征召受阻：需要 T' + age + ' ' + label);
        }
        if (!pay(realm, wood, gold))
            return refuse('木材或黄金不足，征召未入队。');
        (hall.queue ??= []).push({ kind, progress: 0, total: kind === 'guard' ? 210 : 45 + age * 18 + Math.floor(gold / 3) });
        return true;
    }
    if (c.type === 'age') {
        if (w.mode !== 'lord' || realm.age >= 3)
            return true;
        const second = realm.age === 1;
        if (!pay(realm, second ? 220 : 340, second ? 260 : 420))
            return refuse('国库不足，无法晋升时代。');
        realm.age++;
        const keep = w.keep(f);
        if (keep)
            keep.age = realm.age;
        return true;
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
        const troops = kind === 'guard' ? w.honorGuard(f, p) : w.spawn(f, kind, 1, p, kind === 'halberdier' || kind === 'pikeman' ? 'phalanx' : kind === 'musketeer' ? 'line' : 'skirmish');
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
    if (u.kind === 'sapper')
        return false;
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
    const resource = u.prefer ?? 'wood', type = resource === 'wood' ? 'tree' : 'mine';
    if (!job || job.hp <= 0 || job.type !== type || (job.stock ?? 1) <= 0) {
        job = closest(u, w.structures.filter(s => s.type === type && s.hp > 0 && (s.stock ?? 1) > 0));
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
    u.cargo = Math.min(job.stock ?? 40, 40);
    if (type === 'tree')
        w.damageStructure(job, job.hp, f, 'peasant');
    else
        job.stock = (job.stock ?? 0) - u.cargo;
    u.job = undefined;
    return true;
}
