import type {Soldier, Company} from './arenaTypes';
import type {SimWorld} from './world';
import {damage, emit} from './combat';
import {mounted, artillery} from './units/abilities';
import {RANGE} from './scale';

/**
 * 实体弹道。所有远程杀伤都沿真实路径判定：弹丸飞过谁、在谁的身高范围内，就打中谁，不分敌我。
 * 高度单位：1.0 ≈ 站立步兵身高。跪姿 0.6，骑兵 1.7，火炮 0.8。
 */
export type ShotKind = 'musket' | 'round' | 'scatter' | 'shell';
type Tally = {sent: number; hits: number; friendly: number; kills: number};

export function bodyHeight(w: SimWorld, u: Soldier) {
    if (mounted(u)) return 1.7;
    if (artillery(u)) return u.crew > 0 ? .98 : .8;
    return u.kneelUntil > w.tick || u.pose === 'kneel' || u.pose === 'kneelLoad' ? .55 : 1;
}
/** 命中判定用的横截面半径（像素）。骑兵按朝向近似取均值。 */
export function bodyRadius(u: Soldier) { return u.body.a === u.body.b ? u.body.a : (u.body.a + u.body.b) * .5; }

function gauss(w: SimWorld) { return (w.rng.next() + w.rng.next() + w.rng.next() - 1.5) * 1.414; }

export interface RayHit { unit: Soldier; s: number }
/**
 * 沿射线找第一个被弹丸穿过的个体。height(s) 给出距离 s 处的弹丸高度。
 * skip 用于排除射手本人。
 */
export function traceRay(w: SimWorld, x: number, y: number, dx: number, dy: number, range: number,
    height: (s: number) => number, skip: number, filter?: (u: Soldier) => boolean): RayHit | null {
    const found: {best: RayHit | null} = {best: null};
    const step = 56;
    for (let s0 = 0; s0 < range + step; s0 += step) {
        if (found.best && found.best.s < s0 - 28) break;
        const sClamped = Math.min(range, s0);
        // 高度超过所有单位最大身高（骑兵 1.7）且相邻步也在高空时，无需查询空间哈希
        const hMid = height(sClamped);
        if (hMid > 1.85 && height(Math.max(0, sClamped - step * .5)) > 1.85 && height(Math.min(range, sClamped + step * .5)) > 1.85) continue;
        const cx = x + dx * sClamped, cy = y + dy * sClamped;
        w.hash.visit(cx, cy, 36, u => {
            if (u.id === skip || (filter && !filter(u))) return;
            const ox = u.x - x, oy = u.y - y, s = ox * dx + oy * dy;
            if (s <= 2 || s > range || (found.best && s >= found.best.s)) return;
            const r = bodyRadius(u), perp = Math.abs(ox * dy - oy * dx);
            if (perp > r) return;
            const h = height(s);
            if (h <= 0 || h > bodyHeight(w, u)) return;
            found.best = {unit: u, s};
        });
    }
    return found.best;
}

export class Ballistics {
    stats: Record<ShotKind, Tally> = {
        musket: {sent: 0, hits: 0, friendly: 0, kills: 0},
        round: {sent: 0, hits: 0, friendly: 0, kills: 0},
        scatter: {sent: 0, hits: 0, friendly: 0, kills: 0},
        shell: {sent: 0, hits: 0, friendly: 0, kills: 0}
    };
    /** 射击纪律检查次数与因火线上有友军而放弃的次数。 */
    discipline = {checks: 0, heldFire: 0, ignored: 0};
    /** 累计瞄准距离，用于统计平均交火距离。 */
    shotRange = 0;
    /** 白刃战阵亡计数。 */
    meleeKills = 0;
    /** 友军误伤诊断：同连 / 他连；命中距离；被击中者是否跪姿；射手连是否在白刃中。 */
    friendlyWhy = {sameCompany: 0, otherCompany: 0, nearSum: 0, victimKneeling: 0, shooterInMelee: 0};

    private record(kind: ShotKind, shooter: Soldier, victim: Soldier, killed: boolean) {
        const t = this.stats[kind]; t.hits++;
        if (victim.faction === shooter.faction) t.friendly++;
        if (killed) t.kills++;
    }

    /** 火线上是否有站立的友军（不含跪姿前排）。用不带散布的瞄准线检查。 */
    /** 目标身边 24px 内有己方士兵（白刃混战中），不向那里开火。 */
    meleeNear(w: SimWorld, u: Soldier, tx: number, ty: number) {
        let n = 0; w.hash.visit(tx, ty, 24, o => { if (o.faction === u.faction) n++; }); return n > 0;
    }
    laneBlocked(w: SimWorld, u: Soldier, tx: number, ty: number, muzzle = 1, spread = 1) {
        const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
        if (d < 1) return false;
        this.discipline.checks++;
        const ux = dx / d, uy = dy / d, c = w.companies[u.company];
        const own = c.formation === 'column' ? 36 : c.ranks * 15 + 8;
        let blocked = false;
        const cone = Math.min(.15, .088 * spread);
        // 火线是一个随距离张开的扇面：步长与局部查询半径成正比，几何无缝覆盖且大幅减少远距哈希次数。
        for (let s0 = 10; s0 < d + 120 && !blocked; ) {
            const rad = 26 + s0 * cone;
            w.hash.visit(u.x + ux * s0, u.y + uy * s0, rad, o => {
                if (blocked || o.faction !== u.faction || o.id === u.id) return;
                const ox = o.x - u.x, oy = o.y - u.y, s = ox * ux + oy * uy;
                if (s <= 1 || s > d + 110) return;
                if (Math.abs(ox * uy - oy * ux) > bodyRadius(o) + 6 + s * cone) return;
                if (o.company === u.company && s < own && bodyHeight(w, o) < muzzle - .1) return;
                blocked = true;
            });
            s0 += Math.max(30, Math.round(rad * 1.45));
        }
        return blocked;
    }
    /**
     * 一发火枪弹。aim 是瞄准的敌兵；spread 是综合散布系数（训练、硝烟、疲劳、动摇）。
     * 返回弹丸的终点供视觉使用。
     */
    musket(w: SimWorld, u: Soldier, c: Company, aim: Soldier, spread: number) {
        this.stats.musket.sent++;
        const ax = aim.x - u.x, ay = aim.y - u.y, d = Math.max(1, Math.hypot(ax, ay));
        this.shotRange += d;
        const kneeling = u.kneelUntil > w.tick || u.pose === 'kneel' || u.pose === 'kneelLoad';
        const muzzle = kneeling ? .72 : 1;
        // 横向散布（弧度）与纵向散布（到达目标距离处的高度偏差），精度随距离自然衰减。
        const yaw = Math.max(-.075, Math.min(.075, gauss(w) * .020 * spread));
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        const dx = (ax * cos - ay * sin) / d, dy = (ax * sin + ay * cos) / d;
        const heightAtTarget = .62 + gauss(w) * (.55 + d * .0092) * spread;
        const dev = heightAtTarget - muzzle;
        const maxRange = c.variant === 'rifles' ? Math.round(RANGE.musket * 1.25) : RANGE.musket;
        // 本连纵深之内弹道保持枪口高度：后排是从前排的列间空隙射出去的（队列操典）。
        const s0 = Math.min(d * .6, c.formation === 'column' ? 36 : c.formation === 'square' ? 12 : c.ranks * 15 + 8);
        const k = (s: number) => s <= s0 ? 0 : (s - s0) / (d - s0);
        const height = (s: number) => muzzle + dev * k(s) * k(s);
        const ground = dev < 0 ? Math.min(maxRange, s0 + (d - s0) * Math.sqrt(muzzle / -dev)) : maxRange;
        // 炮兵阵地的土胸墙挡住低飞的弹丸。
        const wall = w.earthworks.block(u.x, u.y, dx, dy, ground, height);
        const reach = Math.min(ground, wall);
        const hit = traceRay(w, u.x, u.y, dx, dy, reach, height, u.id, o => !(o.company === u.company && Math.hypot(o.x - u.x, o.y - u.y) <= s0 && bodyHeight(w, o) < muzzle - .1));
        if (!hit && wall < ground) w.earthworks.absorbed.musket++;
        const end = hit ? hit.s : reach;
        if (hit) {
            if (hit.unit.faction === u.faction) { const f = this.friendlyWhy; if (hit.unit.company === u.company) { f.sameCompany++; if (f.sameCompany <= 12) (globalThis as any).__ffLog?.push({sr: Math.floor(u.slot / Math.max(1, c.files)), vr: Math.floor(hit.unit.slot / Math.max(1, c.files)), sk: kneeling, vh: bodyHeight(w, hit.unit), s: Math.round(hit.s), h: +height(hit.s).toFixed(2), d: Math.round(d), form: c.formation, pose: u.pose, mode: c.fireMode, files: c.files}); } else f.otherCompany++; f.nearSum += hit.s; if (bodyHeight(w, hit.unit) < .8) f.victimKneeling++; if (c.engaged) f.shooterInMelee++; }
            const killed = damage(w, hit.unit, w.rng.int(85, 145), dx, dy, false, c);
            this.record('musket', u, hit.unit, killed);
        }
        return {x: u.x + dx * end, y: u.y + dy * end, struck: !!hit, dx, dy};
    }

    /** 霰弹：一炮数十颗弹丸呈锥形散开，逐颗沿射线判定。 */
    canister(w: SimWorld, g: Soldier, c: Company, tx: number, ty: number) {
        const ax = tx - g.x, ay = ty - g.y, d = Math.max(1, Math.hypot(ax, ay));
        const pellets = 16;
        for (let i = 0; i < pellets; i++) {
            this.stats.scatter.sent++;
            const yaw = (w.rng.next() - .5) * .26;
            const cos = Math.cos(yaw), sin = Math.sin(yaw);
            const dx = (ax * cos - ay * sin) / d, dy = (ax * sin + ay * cos) / d;
            const h0 = .75, h1 = .55 + gauss(w) * .35;
            const range = RANGE.scatter * (.75 + w.rng.next() * .35);
            const hf = (s: number) => h0 + (h1 - h0) * s / range;
            const wall = w.earthworks.block(g.x, g.y, dx, dy, range, hf);
            const hit = traceRay(w, g.x, g.y, dx, dy, Math.min(range, wall), hf, g.id);
            if (!hit && wall < range) w.earthworks.absorbed.scatter++;
            if (hit) {
                const killed = damage(w, hit.unit, w.rng.int(45, 130), dx, dy, false, c);
                this.record('scatter', g, hit.unit, killed);
            } else if (i % 6 === 0) {
                w.events.push({type: 'tileImpact', kind: g.kind, unitId: g.id, faction: g.faction, x: g.x + dx * range, y: g.y + dy * range, dx: 0, dy: 0, explosive: false, struck: false});
            }
        }
    }

    /**
     * 实心弹沿一段路径（上一帧位置 → 当前位置）掠过时，打倒高度范围内的所有人。
     * 返回剩余能量。
     */
    sweep(w: SimWorld, r: RoundLike, x0: number, y0: number, x1: number, y1: number, h0: number, h1: number) {
        const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
        if (len < .01 || r.energy <= 0) return;
        const ux = dx / len, uy = dy / len;
        const source = w.companies[r.company], gun = r.gun;
        // 跳弹撞上胸墙：泥土吃掉大部分动能。
        if (w.earthworks.block(x0, y0, ux, uy, len, s => h0 + (h1 - h0) * s / len) < len) { r.energy -= .7; w.earthworks.absorbed.round++; if (r.energy <= 0) return; }
        const hits: {u: Soldier; s: number}[] = [];
        for (let s0 = 0; s0 <= len + 20; s0 += 30) {
            const cx = x0 + ux * Math.min(len, s0), cy = y0 + uy * Math.min(len, s0);
            w.hash.visit(cx, cy, 30, u => {
                if (r.hit.has(u.id)) return;
                const ox = u.x - x0, oy = u.y - y0, s = ox * ux + oy * uy;
                if (s < 0 || s > len) return;
                if (Math.abs(ox * uy - oy * ux) > bodyRadius(u) + 1.5) return;
                const h = h0 + (h1 - h0) * s / len;
                if (h > bodyHeight(w, u)) return;
                r.hit.add(u.id); hits.push({u, s});
            });
        }
        hits.sort((a, b) => a.s - b.s);
        for (const {u} of hits) {
            if (r.energy <= 0) break;
            const killed = damage(w, u, r.energy > .35 ? 190 : 90, ux, uy, true, source);
            this.record('round', gun, u, killed);
            r.energy -= mounted(u) ? .35 : artillery(u) ? .6 : .16;
            const hc = w.companies[u.company];
            if (!r.touched.includes(hc.id)) { r.touched.push(hc.id); hc.morale = Math.max(0, hc.morale - 3.5); }
        }
    }
    /** 统计口径：实心弹/榴弹“发射数”按炮弹计。 */
    countRound() { this.stats.round.sent++; }
    countShell() { this.stats.shell.sent++; }
    /** 榴弹爆炸：在半径 80px 内用 16～24 条实体射线判定破片，不分敌我。 */
    shellBurst(w: SimWorld, r: RoundLike, bx: number, by: number) {
        const fragments = w.rng.int(16, 24);
        const source = w.companies[r.company], gun = r.gun;
        const touched = new Set<number>();
        for (let i = 0; i < fragments; i++) {
            const ang = (i / fragments) * Math.PI * 2 + (w.rng.next() - 0.5) * 0.25;
            const dx = Math.cos(ang), dy = Math.sin(ang);
            const reach = 80 * (0.65 + w.rng.next() * 0.35);
            const hf = (s: number) => 0.35 + (s / Math.max(1, reach)) * 0.45;
            const hit = traceRay(w, bx, by, dx, dy, reach, hf, -1);
            if (hit) {
                const killed = damage(w, hit.unit, w.rng.int(22, 48), dx, dy, true, source);
                this.record('shell', gun, hit.unit, killed);
                const hc = w.companies[hit.unit.company];
                if (hc && !touched.has(hc.id)) { touched.add(hc.id); hc.morale = Math.max(0, hc.morale - 2.2); }
            }
        }
    }
}
export interface RoundLike { gun: Soldier; company: number; energy: number; hit: Set<number>; touched: number[] }
export function emitImpact(w: SimWorld, g: Soldier, x: number, y: number, struck: boolean) {
    const e = emit(w, 'tileImpact', g, 0, 0, false, x, y); e.struck = struck; return e;
}
