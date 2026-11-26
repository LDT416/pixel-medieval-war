import type { SimWorld } from './world';
import type { Faction, Unit } from './types';
import { crews, UNITS } from './config';
import { attack, distanceTo } from './combat';
export const fieldArmy = (u: Unit) => u.hp > 0 && !u.tower && !u.gun && u.kind !== 'peasant' && !crews[u.kind];
export const threshold = (age: number) => Math.min(180, 55 + 38 * (age - 1));
export function issueWave(w: SimWorld, f: Faction, charge: boolean) {
    const r = w.realms[f], troops = w.units.filter(u => u.faction === f && fieldArmy(u));
    if (charge && !troops.length)
        return;
    r.phase = charge ? 'WAVE_ASSAULT' : 'RETREAT_REGROUP';
    r.wave++;
    r.baseline = troops.length;
    // 按兵种分类独立分配整齐横列槽位，确保几百人步兵与火枪各自排成笔直宽大军阵！
    let meleeIdx = 0, gunIdx = 0, cavIdx = 0;
    for (const u of troops) {
        const def = UNITS[u.kind];
        u.marchSlot = def.traits.includes('mount') ? cavIdx++ : def.role === '火枪' ? gunIdx++ : meleeIdx++;
        u.wave = r.wave;
        u.manual = false;
        u.target = 0;
        w.groups.get(u.group)!.point = null;
    }
    if (charge) {
        const keep = w.keep(f);
        if (keep)
            w.events.push({ type: 'horn', x: keep.x, y: keep.y, faction: f, power: 4 });
    }
}
export function strategyTick(w: SimWorld) {
    for (const f of [0, 1] as const) {
        const r = w.realms[f], army = w.units.filter(u => u.faction === f && fieldArmy(u)), active = army.filter(u => u.wave === r.wave);
        const front = army.filter(u => u.wave === r.wave && !u.escort && !u.manual && u.kind !== 'bannerman' && !UNITS[u.kind].traits.includes('mount'));
        const sum = { x: 0, y: 0 };
        for (const unit of front) {
            sum.x += unit.x;
            sum.y += unit.y;
        }
        w.fronts[f] = { x: front.length ? sum.x / front.length : (f ? 3830 : 970), y: front.length ? sum.y / front.length : 880,
            breached: front.length >= 3 && front.filter(u => Math.abs(u.x - (f ? 610 : 4190)) < 1100).length >= Math.ceil(front.length * .65) };
        if (r.phase === 'WAVE_ASSAULT' && (active.length < r.baseline * .22 || active.length <= 4 && active.length < r.baseline))
            issueWave(w, f, false);
        else if (r.phase === 'RETREAT_REGROUP' && active.every(u => Math.hypot(u.x - (f ? 3828 : 972), u.y - 880) < 260)) {
            r.phase = 'PATROL_GATHER';
            r.cooldownUntil = w.tick + 120;
        }
        else if (r.phase === 'PATROL_GATHER' && w.tick >= (r.cooldownUntil ?? 0) && army.filter(u => Math.abs(u.x - (f ? 4190 : 610)) < 760).length >= threshold(r.age))
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
    const slot = u.marchSlot ?? (u.id % 120);
    // 平时集结演武场：整齐宽正面多排线列（每排24人）
    const gatherPerRank = 24;
    const rankX = u.kind === 'bannerman' ? 10 : def.traits.includes('mount') ? -140 : def.role === '火枪' ? -68 : 96;
    let x = base + d * (370 + rankX - Math.floor(slot / gatherPerRank) * 18);
    let y = 880 + (slot % gatherPerRank - (gatherPerRank - 1) / 2) * 19;
    if (assault) {
        const front = w.fronts[f];
        if (u.kind === 'bannerman') {
            x = front.x - d * 24;
            y = front.y;
        }
        else {
            // 骑兵刻意绕后偷袭敌方后排火枪手、炮兵与农夫，绝不傻撞正面步兵方阵！
            if (def.traits.includes('mount')) {
                const enemyFront = w.fronts[f ? 0 : 1];
                const flankY = slot % 2 ? 255 : 1505;
                // 搜寻敌方最诱人的后排目标（优先火枪手、炮兵、农夫）
                let backTarget: Unit | undefined, bestDist = Infinity;
                for (const n of w.units) {
                    if (n.faction === f || n.hp <= 0 || n.tower)
                        continue;
                    const backVal = UNITS[n.kind].role === '火枪' || n.gun || n.kind === 'peasant';
                    if (!backVal)
                        continue;
                    const dist = distanceTo(u, n);
                    if (dist < bestDist) {
                        bestDist = dist;
                        backTarget = n;
                    }
                }
                // 先高速沿南北翼绕过敌军主战线 220px，再折返从侧后方冲散敌方火枪阵！
                const passedEnemyFront = (u.x - (enemyFront.x + d * 220)) * d >= 0;
                if (!passedEnemyFront && (!backTarget || bestDist > 260)) {
                    w.approach(u, { x: enemyFront.x + d * 280, y: flankY }, def.speed);
                    return true;
                }
                if (backTarget && bestDist < 420) {
                    if (bestDist <= def.range + 10)
                        return false;
                    w.approach(u, backTarget, def.speed);
                    return true;
                }
                const raid = w.structures.find(s => (s.type === 'house' || s.type === 'keep') && s.faction !== f && s.hp > 0);
                if (raid && distanceTo(u, raid) > 65) {
                    w.approach(u, raid, def.speed);
                    return true;
                }
                return false;
            }
            let near = false;
            w.hash.visit(u.x, u.y, def.role === '火枪' ? def.range * .95 : def.range + 75, n => {
                if (n.faction !== f && n.hp > 0 && (!n.tower || def.range > 65))
                    near = true;
            });
            if (near || Math.abs(u.x - (4800 - base)) < 420)
                return false;
            // 几百人宏大整编线列推进：宽正面多排并肩齐步向前！
            const bridge = w.map === 'twin' ? w.structures.find(s => (s.type === 'bridge' || s.type === 'pontoon') && s.hp > 0) : undefined;
            if (w.map === 'twin' && !bridge)
                return false;
            const lane = bridge?.y ?? 880, narrow = w.map !== 'gorge' && Math.abs(u.x - 2400) < 1150;
            const perRank = narrow ? 10 : def.role === '火枪' ? 32 : 26;
            const gapY = narrow ? 10 : 18;
            const depth = u.kind === 'shieldman' ? 115 : def.role === '火枪' ? -18 : 92;
            const row = Math.floor(slot / perRank);
            x = front.x + d * (depth - row * 18);
            y = lane + (slot % perRank - (perRank - 1) / 2) * gapY;
            if ((x - u.x) * d > -8 || Math.abs(y - u.y) > 14)
                w.approach(u, { x, y }, Math.min(1.22, def.speed));
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
