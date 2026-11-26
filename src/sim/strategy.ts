import type { SimWorld } from './world';
import type { Faction, Unit } from './types';
import { crews, UNITS } from './config';
import { attack, distanceTo } from './combat';
export const fieldArmy = (u: Unit) => u.hp > 0 && !u.tower && !u.gun && u.kind !== 'peasant' && !crews[u.kind];
export const threshold = (age: number) => Math.min(48, 24 + 12 * (age - 1));
export function issueWave(w: SimWorld, f: Faction, charge: boolean) {
    const r = w.realms[f], troops = w.units.filter(u => u.faction === f && fieldArmy(u));
    if (charge && !troops.length)
        return;
    r.phase = charge ? 'WAVE_ASSAULT' : 'RETREAT_REGROUP';
    r.wave++;
    r.baseline = troops.length;
    troops.forEach((u, i) => { u.marchSlot = i; u.wave = r.wave; u.manual = false; u.target = 0; w.groups.get(u.group)!.point = null; });
    if (charge) {
        const keep = w.keep(f);
        if (keep)
            w.events.push({ type: 'horn', x: keep.x, y: keep.y, faction: f, power: 4 });
    }
}
export function strategyTick(w: SimWorld) {
    for (const f of [0, 1] as const) {
        const r = w.realms[f], army = w.units.filter(u => u.faction === f && fieldArmy(u)), active = army.filter(u => u.wave === r.wave);
        const front = army.filter(u => u.wave === r.wave && !u.escort && !u.manual && u.kind !== 'bannerman' && !UNITS[u.kind].traits.includes('flank'));
        const sum = { x: 0, y: 0 };
        for (const unit of front) {
            sum.x += unit.x;
            sum.y += unit.y;
        }
        w.fronts[f] = { x: front.length ? sum.x / front.length : (f ? 3830 : 970), y: front.length ? sum.y / front.length : 880,
            breached: front.length >= 3 && front.filter(u => Math.abs(u.x - (f ? 610 : 4190)) < 1100).length >= Math.ceil(front.length * .65) };
        if (r.phase === 'WAVE_ASSAULT' && (active.length < r.baseline * .25 || active.length <= 3 && active.length < r.baseline))
            issueWave(w, f, false);
        else if (r.phase === 'RETREAT_REGROUP' && active.every(u => Math.hypot(u.x - (f ? 3828 : 972), u.y - 880) < 205)) {
            r.phase = 'PATROL_GATHER';
            r.cooldownUntil = w.tick + 120;
        }
        else if (r.phase === 'PATROL_GATHER' && w.tick >= (r.cooldownUntil ?? 0) && army.filter(u => Math.abs(u.x - (f ? 4190 : 610)) < 670).length >= threshold(r.age))
            issueWave(w, f, true);
    }
}
export function strategyMove(w: SimWorld, u: Unit) {
    if (u.tower)
        return false;
    const f = u.faction, d = f ? -1 : 1, base = f ? 4190 : 610, r = w.realms[f], def = UNITS[u.kind];
    if (crews[u.kind]) {
        if (!u.crew) {
            u.moving = false;
            return true;
        }
        const breakthrough = w.fronts[f].breached;
        const post = { x: base + d * (breakthrough ? 2480 : (u.kind === 'organ_gun' ? 405 : 175) + (u.id % 4) * 36), y: breakthrough ? 880 : 1175 + (u.id % 5) * 24 };
        u.moving = Math.hypot(post.x - u.x, post.y - u.y) > 8;
        if (u.moving) {
            w.approach(u, post, def.speed);
            return true;
        }
        if (u.cooldown <= 0) {
            let target: Unit | undefined, score = Infinity;
            for (const n of w.units)
                if (n.faction !== f && n.hp > 0) {
                    const dist = distanceTo(u, n);
                    if (dist <= def.range && dist < score) {
                        target = n;
                        score = dist;
                    }
                }
            const goal = target ?? (breakthrough ? w.keep(f ? 0 : 1) : undefined);
            if (goal && distanceTo(u, goal) <= def.range)
                attack(w, u, goal);
        }
        return true;
    }
    if (u.manual && r.phase !== 'RETREAT_REGROUP')
        return false;
    const assault = r.phase === 'WAVE_ASSAULT' && u.wave === r.wave;
    const rank = u.kind === 'bannerman' ? 0 : def.role === '火枪' ? -70 : 90;
    let x = base + d * (362 + rank + Math.floor(u.id % 24 / 8) * 16);
    let y = 880 + (u.id % 8 - 3.5) * 23;
    if (assault) {
        const front = w.fronts[f], slot = u.marchSlot ?? u.id;
        if (u.kind === 'bannerman') {
            x = front.x - d * 60;
            y = front.y;
        }
        else {
            let near = false;
            w.hash.visit(u.x, u.y, def.range + 65, n => { if (n.faction !== f && n.hp > 0 && (!n.tower || def.range > 65))
                near = true; });
            if (near || Math.abs(u.x - (4800 - base)) < 420)
                return false;
            if (def.traits.includes('flank')) {
                const flankY = slot % 2 ? 520 : 1240;
                const raid = w.structures.find(s => s.type === 'house' && s.faction !== f && s.hp > 0);
                const p = Math.abs(u.x - base) < 2200 ? { x: base + d * 2300, y: flankY } : raid;
                if (!p)
                    return false;
                if (raid && distanceTo(u, raid) < 65)
                    return false;
                w.approach(u, p);
                return true;
            }
            // March together on a shared lane. A destroyed crossing delegates routing to the flow field.
            const bridge = w.map === 'twin' ? w.structures.find(s => (s.type === 'bridge' || s.type === 'pontoon') && s.hp > 0) : undefined;
            if (w.map === 'twin' && !bridge)
                return false;
            const lane = bridge?.y ?? 880, narrow = w.map !== 'gorge' && Math.abs(u.x - 2400) < 1170;
            const depth = u.kind === 'shieldman' ? 110 : def.role === '火枪' ? 41 : 88;
            x = front.x + d * (depth - Math.floor(slot % 32 / 8) * 13);
            y = lane + (slot % 8 - 3.5) * (narrow ? 9 : 23);
            if ((x - u.x) * d > 0 || Math.abs(y - u.y) > 18)
                w.approach(u, { x, y }, Math.min(1.85, def.speed));
            return true;
        }
    }
    else
        y += Math.floor(w.tick / 80 + u.id) % 2 ? 12 : -12;
    if (r.phase !== 'RETREAT_REGROUP' && u.kind !== 'bannerman') {
        let enemy: Unit | undefined;
        w.hash.visit(u.x, u.y, def.range, n => { if (n.faction !== f && n.hp > 0)
            enemy = n; });
        if (enemy) {
            if (def.role === '火枪') {
                u.target = enemy.id;
                return false;
            }
            if (u.cooldown <= 0)
                attack(w, u, enemy);
            return true;
        }
    }
    if (Math.hypot(x - u.x, y - u.y) > 6)
        w.approach(u, { x, y });
    else if (!assault && w.tick % 30 === 0) {
        u.hp = Math.min(def.hp, u.hp + 1);
        u.morale = Math.min(100, (u.morale ?? 75) + 4);
    }
    return true;
}
