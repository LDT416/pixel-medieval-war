import { UNITS, rankFire } from './config';
import type { Faction, Kind, Point, Projectile, Structure, Unit } from './types';
import type { SimWorld } from './world';
export const rangeOf = (u: Unit) => UNITS[u.kind].range * (u.tower ? 1.2 : 1);
export const distanceTo = (p: Point, t: Point) => Math.hypot(t.x - p.x, t.y - p.y);
export function hit(w: SimWorld, u: Unit, f: Faction, kind: Kind, damage: number, dx: number, dy: number, ranged = true, explosive = false) {
    if (u.hp <= 0)
        return;
    const dealt = damage * (ranged && u.tower ? .5 : 1);
    w.stats[f][kind].damage += Math.min(dealt, u.hp);
    u.hp -= dealt;
    u.morale = Math.max(0, u.morale - dealt * .14);
    w.events.push({ type: 'hit', x: u.x, y: u.y, z: u.z, dx, dy, kind, unitId: u.id });
    if (u.hp > 0)
        return;
    u.hp = 0;
    w.dead[u.faction]++;
    w.stats[f][kind].kills++;
    w.events.push({ type: 'death', x: u.x, y: u.y, z: u.z, dx, dy, kind: u.kind, faction: u.faction, flag: u.kind === 'bannerman' && u.slot === 0, explosive });
}
export function attack(w: SimWorld, u: Unit, t: Unit | Structure) {
    if (u.kind === 'bannerman' || u.routed || u.cooldown > 0)
        return;
    const distance = distanceTo(u, t), dx = (t.x - u.x) / (distance || 1), dy = (t.y - u.y) / (distance || 1);
    u.aimX = dx;
    u.aimY = dy;
    if (Math.abs(dx) > .06)
        u.face = Math.sign(dx);
    const damage = UNITS[u.kind].damage * (u.tower ? 1.35 : 1);
    if (u.kind === 'cuirassier' || (distance < 30 && rankFire(u.kind))) {
        u.pose = 'bayonet';
        u.cooldown = u.kind === 'cuirassier' ? 31 : 26;
        const thrust = u.kind === 'guard_grenadier' ? 80 : u.kind === 'cuirassier' ? damage : 32;
        if ('kind' in t) {
            if (u.kind === 'cuirassier' && t.pose === 'reload' && !t.tower) {
                const company = w.groups.get(t.group);
                if (company && w.tick > (company.scatteredUntil ?? -1000) + 90)
                    company.scatteredUntil = w.tick + 19;
            }
            hit(w, t, u.faction, u.kind, thrust, dx, dy, false);
        }
        else
            w.damageStructure(t, thrust, u.faction, u.kind);
        w.events.push({ type: 'slash', x: u.x + dx * 12, y: u.y + dy * 12, dx, dy, kind: u.kind });
        return;
    }
    const grenade = u.kind === 'guard_grenadier' && u.slot % 6 === 0 && distance < 126 && (u.grenadeAt ?? 0) <= w.tick;
    const kind = grenade ? 'flask' : u.kind === 'field_cannon' ? 'ball' : 'bullet';
    if (grenade)
        u.grenadeAt = w.tick + 210;
    u.firedAt = w.tick;
    u.pose = grenade ? 'throw' : 'aim';
    if (grenade)
        u.thrownAt = w.tick;
    u.cooldown = kind === 'ball' ? 195 : w.rng.int(108, 120);
    let tx = t.x, ty = t.y, target = t.id;
    if (kind === 'bullet' && 'kind' in t) {
        // Two-dimensional spread includes vertical misses over the line.
        if (w.rng.next() > .19) {
            target = 0;
            const spread = 20 + w.rng.next() * 50, side = w.rng.next() < .5 ? -1 : 1;
            tx -= dy * spread * side;
            ty += dx * spread * side;
        }
    }
    if (kind === 'ball') {
        tx += w.rng.int(-10, 10);
        ty += w.rng.int(-10, 10);
    }
    const muzzle = kind === 'ball' ? 23 : 18;
    const x = u.x + dx * muzzle, y = u.y + dy * muzzle;
    const ticks = Math.max(2, Math.ceil(distance / (kind === 'bullet' ? 54 : kind === 'ball' ? 32 : 13)));
    const z = u.z + 12, gravity = grenade ? .85 : 0;
    w.projectiles.push({ id: w.next++, x, y, z, vx: (tx - x) / ticks, vy: (ty - y) / ticks,
        vz: (-z / ticks) + gravity * (ticks - 1) / 2, gravity, remaining: ticks, target, kind, source: u.kind,
        damage: grenade ? 94 * (u.tower ? 1.35 : 1) : damage, faction: u.faction });
    if (!grenade)
        w.events.push({ type: 'fire', x: u.x, y: u.y, z: u.z, dx, dy, kind: u.kind, unitId: u.id });
}
function impact(w: SimWorld, p: Projectile) {
    const t = w.byUnit.get(p.target), s = w.byStructure.get(p.target);
    if (p.kind === 'bullet') {
        if (t && t.hp > 0 && distanceTo(p, t) < 19)
            hit(w, t, p.faction, p.source, p.damage, p.vx, p.vy);
    }
    else {
        w.events.push({ type: 'impact', x: p.x, y: p.y, dx: p.vx, dy: p.vy, kind: p.source, power: p.kind === 'ball' ? 6 : 3 });
        const radius = p.kind === 'ball' ? 39 : 28;
        w.hash.visit(p.x, p.y, radius, u => {
            if (u.faction !== p.faction)
                hit(w, u, p.faction, p.source, p.damage * (1 - .28 * distanceTo(p, u) / radius), u.x - p.x, u.y - p.y, true, true);
        });
    }
    if (s && s.hp > 0 && s.faction !== p.faction)
        w.damageStructure(s, p.damage, p.faction, p.source);
}
export function updateProjectiles(w: SimWorld) {
    let live = 0;
    for (const p of w.projectiles) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vz -= p.gravity;
        if (--p.remaining <= 0)
            impact(w, p);
        else
            w.projectiles[live++] = p;
    }
    w.projectiles.length = live;
}
