import { UNITS, rankFire } from './config';
import { rangeOf, distanceTo, attack } from './combat';
import { HEIGHT, WIDTH, rampartSlot, roadY, riverX, riverWidth, lanesForMap } from './maps';
import type { Group, Point, Unit, Structure } from './types';
import type { SimWorld } from './world';
function move(p: Point, to: Point, speed: number) {
    const dx = to.x - p.x, dy = to.y - p.y, dist = Math.hypot(dx, dy);
    if (dist < .15)
        return;
    const fraction = Math.min(1, speed / dist);
    p.x += dx * fraction;
    p.y += dy * fraction;
}
function crossing(w: SimWorld, p: Point, to: Point, g: Group): Point {
    const river = riverX(p.y), sign = Math.sign(to.x - p.x), half = riverWidth(p.y, w.map) / 2;
    if (sign === 0 || Math.sign(p.x - river) === Math.sign(to.x - riverX(to.y)) && Math.abs(p.x - river) > half + 52)
        return to;
    const lanes = lanesForMap(w.map);
    let lane = g.lane;
    if (g.manual || g.state === 'retreat' || g.state === 'garrison' || g.state === 'hold')
        lane = lanes.reduce((a, b) => Math.abs(b - p.y) + Math.abs(b - to.y) < Math.abs(a - p.y) + Math.abs(a - to.y) ? b : a);
    const center = riverX(lane), edge = riverWidth(lane, w.map) / 2 + 85;
    if (Math.abs(p.x - river) > half + 62 && Math.abs(p.y - lane) > 7)
        return { x: center - sign * edge, y: lane };
    if (Math.abs(p.y - lane) > 8)
        return { x: p.x, y: lane };
    if ((p.x - center) * sign < edge)
        return { x: center + sign * edge, y: lane };
    return to;
}
function march(w: SimWorld, u: Unit, dest: Point, speed: number, g: Group) {
    const next = { x: u.x, y: u.y };
    move(next, dest, speed);
    if (!w.grid.walk(next.x, next.y)) {
        const path = crossing(w, u, dest, g);
        next.x = u.x;
        next.y = u.y;
        move(next, path, speed);
        if (!w.grid.walk(next.x, next.y)) {
            if (w.grid.walk(u.x, next.y))
                next.x = u.x;
            else if (w.grid.walk(next.x, u.y))
                next.y = u.y;
            else
                return;
        }
    }
    u.x = next.x;
    u.y = next.y;
}
function setRout(w: SimWorld, g: Group) {
    g.state = 'retreat';
    g.site = 0;
    g.point = null;
    g.manual = false;
    g.restTick = 0;
    if (g.faction === w.player)
        w.news = UNITS[g.kind].short + '连溃退，幸存者正赶回星堡';
}
export function strategyTick(w: SimWorld, members: Map<number, Unit[]>) {
    for (const g of w.groups.values()) {
        const troops = members.get(g.id);
        if (!troops?.length)
            continue;
        const first = troops[0], refuge = w.refuge(g);
        const flags = w.units.some(u => u.hp > 0 && u.faction === g.faction && u.kind === 'bannerman' && !u.routed && distanceTo(u, g.anchor) < 170);
        const loss = 1 - troops.length / g.peak, threshold = g.kind === 'guard_grenadier' ? .54 : flags ? .45 : .4;
        const morale = Math.max(0, Math.round((g.kind === 'guard_grenadier' ? 100 : 80) * (1 - loss / (threshold + .02)) + (flags ? 8 : 0)));
        if (g.state !== 'retreat' && g.state !== 'rest' && (loss > threshold || troops.every(u => u.morale <= 0))) {
            setRout(w, g);
            g.anchor = { x: troops.reduce((n, u) => n + u.x, 0) / troops.length, y: troops.reduce((n, u) => n + u.y, 0) / troops.length };
        }
        g.count = troops.length;
        for (const u of troops) {
            u.routed = g.state === 'retreat';
            u.morale = morale;
        }
        if (g.state === 'retreat' && troops.every(u => distanceTo(u, refuge) < 100)) {
            g.state = 'rest';
            g.restTick = w.tick;
        }
        if (g.state === 'rest' && w.tick - g.restTick >= 110) {
            w.refit(g, troops, refuge);
            continue;
        }
        let enemy: Group | undefined, nearest = Infinity;
        for (const other of w.groups.values()) {
            if (other.faction === g.faction || !members.has(other.id))
                continue;
            const dist = distanceTo(g.anchor, other.anchor);
            const score = g.kind === 'cuirassier' && members.get(other.id)!.some(u => u.pose === 'reload') ? dist * .75 : dist;
            if (score < nearest) {
                nearest = score;
                enemy = other;
            }
        }
        g.enemy = enemy?.id ?? 0;
        const foes = enemy ? members.get(enemy.id) : undefined;
        if (enemy && g.kind === 'guard_grenadier' && g.state === 'advance' && !g.manual && nearest < 330 &&
            foes?.some(u => u.pose === 'reload'))
            g.assaultTarget = enemy.id;
        const assault = g.state === 'advance' && !g.manual && rankFire(g.kind) &&
            (first.formation === 'melee' || (enemy !== undefined && g.assaultTarget === enemy.id));
        const engaging = enemy && distanceTo(g.anchor, enemy.anchor) < (assault ? 15 : rangeOf(first) * .85);
        const forward = g.faction ? -1 : 1;
        let goal = g.point ?? g.home, speed = UNITS[g.kind].speed;
        if (g.state === 'retreat' || g.state === 'rest') {
            goal = refuge;
            speed *= 2.1;
        }
        else if (g.state === 'garrison') {
            const site = w.byStructure.get(g.site);
            if (site)
                goal = rampartSlot(site, g.seat, g.faction);
        }
        else if (g.state === 'advance') {
            if (g.manual && g.point) {
                goal = g.point;
                if (distanceTo(g.anchor, goal) < 2)
                    g.state = 'hold';
            }
            else if (g.kind === 'bannerman') {
                const leaders = [...w.groups.values()].filter(n => n.faction === g.faction && rankFire(n.kind) && n.state === 'advance');
                const leader = leaders.sort((a, b) => distanceTo(g.anchor, a.anchor) - distanceTo(g.anchor, b.anchor))[0];
                goal = leader ? { x: leader.anchor.x - forward * 28, y: leader.anchor.y } : g.home;
            }
            else if (enemy && distanceTo(g.anchor, enemy.anchor) < (g.kind === 'cuirassier' ? 640 : 550)) {
                goal = enemy.anchor;
            }
            else {
                const end = w.keep(g.faction ? 0 : 1)!;
                const nextX = g.anchor.x + forward * 100;
                goal = Math.abs(end.x - g.anchor.x) < 140 ? end : { x: nextX, y: roadY(nextX, g.lane) };
            }
            if (engaging && !g.manual && g.kind !== 'cuirassier')
                goal = g.anchor;
        }
        if (g.state === 'assemble')
            goal = g.home;
        move(g.anchor, crossing(w, g.anchor, goal, g), speed);
        if (g.kind === 'bannerman' && w.tick % 48 === 0 && g.state !== 'retreat' && troops.some(u => u.slot === 1))
            w.events.push({ type: 'drum', ...g.anchor, faction: g.faction });
        if (foes && rankFire(g.kind) && nearest < rangeOf(first) + 210 && w.tick >= g.nextVolley && troops.some(u => u.cooldown === 0)) {
            if (troops.some(u => foes.some(n => distanceTo(u, n) <= rangeOf(u)))) {
                g.volleyAt = w.tick;
                g.nextVolley = w.tick + 125;
            }
        }
        for (const u of troops) {
            if (u.hp <= 0)
                continue;
            const prevX = u.x, prevY = u.y;
            u.cooldown = Math.max(0, u.cooldown - 1);
            let target: Unit | Structure | undefined;
            if (foes && nearest < rangeOf(u) + 320 && g.state !== 'retreat' && g.state !== 'rest' && u.kind !== 'bannerman') {
                const grenadier = u.kind === 'guard_grenadier' && u.slot % 6 === 0 && (u.grenadeAt ?? 0) <= w.tick;
                const reach = assault ? (grenadier ? 125 : 28) : rangeOf(u), offset = (u.slot * 7 + Math.floor(w.tick / 125) * 3) % foes.length;
                for (let i = 0; i < foes.length; i++) {
                    const n = foes[(offset + i) % foes.length];
                    if (n.hp > 0 && Math.abs(n.x - u.x) <= reach && distanceTo(u, n) <= reach) {
                        target = n;
                        break;
                    }
                }
            }
            if (!target && g.state === 'advance' && !g.manual && u.kind !== 'bannerman') {
                const end = w.keep(g.faction ? 0 : 1)!;
                if (end.hp > 0 && distanceTo(u, end) < rangeOf(u) + 10)
                    target = end;
            }
            const age = w.tick - (u.firedAt ?? -1000);
            const loading = age > 4 && u.cooldown > 0 && u.firedAt !== undefined && g.state !== 'retreat' && g.state !== 'rest';
            const site = g.site ? w.byStructure.get(g.site) : undefined;
            const slot = site ? rampartSlot(site, g.seat + u.slot, g.faction) : undefined;
            const deploying = slot && distanceTo(u, slot) > 3;
            const ordered = (g.manual || g.state === 'hold' && w.realms[g.faction].order !== 'auto') && g.point && distanceTo(u, g.point) > 115;
            const scattered = !u.tower && g.state !== 'retreat' && g.state !== 'rest' && w.tick < (g.scatteredUntil ?? 0);
            if (scattered) {
                const fallback = { x: u.x - forward * 10, y: u.y + (u.slot % 2 ? 8 : -8) };
                march(w, u, fallback, UNITS[u.kind].speed * 1.25, g);
                u.pose = 'march2';
                u.target = 0;
            }
            else if (target && !deploying && !ordered) {
                const dist = distanceTo(u, target) || 1;
                u.aimX = (target.x - u.x) / dist;
                u.aimY = (target.y - u.y) / dist;
                if (Math.abs(u.aimX) > .06)
                    u.face = Math.sign(u.aimX);
                u.target = target.id;
                u.pose = w.tick - (u.thrownAt ?? -1000) < 8 ? 'throw' : loading ? 'reload' : dist < 30 ? 'bayonet' : 'aim';
                const volley = w.tick - g.volleyAt;
                if (!u.cooldown && (dist < 30 || assault || !rankFire(u.kind) || !('kind' in target) || (volley >= u.slot % 4 && volley < 6)))
                    attack(w, u, target);
            }
            else if (loading) {
                u.pose = 'reload';
            }
            else {
                const bridge = Math.abs(g.anchor.x - riverX(g.anchor.y)) < riverWidth(g.anchor.y, w.map) / 2 + 80;
                const center = g.state === 'retreat' ? refuge : g.anchor;
                const desired = slot ?? { x: center.x + u.offset.x, y: center.y + u.offset.y * (bridge ? .31 : 1) };
                const waypoint = g.state === 'retreat' ? crossing(w, u, desired, g) : desired;
                desired.x = Math.min(WIDTH - 4, Math.max(4, desired.x));
                desired.y = Math.min(HEIGHT - 4, Math.max(4, desired.y));
                march(w, u, waypoint, g.state === 'retreat' ? speed : speed * 1.15, g);
                u.pose = Math.floor(u.marchDistance / 6) % 2 ? 'march1' : 'march2';
                u.target = 0;
            }
            u.vx = u.x - prevX;
            u.vy = u.y - prevY;
            u.moving = Math.abs(u.vx) + Math.abs(u.vy) > .05;
            if (u.moving) {
                const length = Math.hypot(u.vx, u.vy);
                u.marchDistance += length;
                u.aimX = u.vx / length;
                u.aimY = u.vy / length;
                if (Math.abs(u.aimX) > .1)
                    u.face = Math.sign(u.vx);
            }
            u.tower = w.grid.heightSite(u, w.byStructure);
        }
    }
}
