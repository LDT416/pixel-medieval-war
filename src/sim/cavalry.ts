import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type {CavalryTask, Company, Faction} from './arenaTypes';
import type {SimWorld} from './world';
import {WIDTH, HEIGHT, inRect, inWoods, layout} from './maps';
import {PACE} from './scale';
import {dist, shake} from './combat';
import {activeCompanies} from './battalion';
import {setFormation} from './strategy';

/**
 * 计算菱形队形每行的骑兵人数：1, 3, 5, 7, ..., 7, 5, 3, 1。
 * 22 人精确为 [1, 3, 5, 7, 5, 1]，连长位于最前方尖端（slot 0）。
 */
export function diamondRowCounts(n: number): number[] {
    if (n <= 0) return [];
    if (n === 1) return [1];
    if (n <= 4) return [1, n - 1];
    // 构建递增前半段与递减后半段，保证首行永远为 1
    let maxW = 3;
    while (maxW * maxW < n * 2 - 1) maxW += 2;
    // 先构建完整对称菱形 [1, 3, ..., maxW, maxW-2, ..., 1]
    const rows: number[] = [];
    for (let w = 1; w <= maxW; w += 2) rows.push(w);
    for (let w = maxW - 2; w >= 1; w -= 2) rows.push(w);
    let sum = rows.reduce((a, b) => a + b, 0);
    // 若超出 n，先从后半段倒数第二行往中间缩减，尽量保留前后尖端 1
    while (sum > n) {
        let reduced = false;
        for (let i = rows.length - 2; i >= 1 && sum > n; i--) {
            if (rows[i] > 1) {
                const take = Math.min(rows[i] - 1, sum - n);
                rows[i] -= take;
                sum -= take;
                reduced = true;
            }
        }
        if (!reduced) {
            // 去掉多余尾部行
            const last = rows.pop()!;
            sum -= last;
            if (sum < n) {
                rows.push(n - sum);
                sum = n;
            }
        }
    }
    return rows.filter(r => r > 0);
}

/** 返回菱形队形中第 i 个骑兵相对连中心的 (横向, 纵深) 偏移：横向 22px，纵深 26px。 */
export function diamondSlotOffset(n: number, i: number): [number, number] {
    const rows = diamondRowCounts(Math.max(1, n));
    let rem = i;
    for (let r = 0; r < rows.length; r++) {
        const cnt = rows[r];
        if (rem < cnt) {
            const lat = (rem - (cnt - 1) * 0.5) * 22;
            const dep = r * 26;
            return [lat, dep];
        }
        rem -= cnt;
    }
    return [0, rows.length * 26];
}

/** 骑兵变体速度倍率：胸甲 ×0.95、骠骑 ×1.08、枪骑 ×1.0。 */
export function cavalrySpeedMult(c: Company): number {
    if (c.variant === 'hussar') return 1.08;
    if (c.variant === 'lancer') return 1.0;
    return 0.95; // 胸甲骑兵（默认无变体）
}

/** 骑兵变体冲击伤害倍率：胸甲 ×1.3、骠骑 ×0.85、枪骑 ×1.0（对骑兵 ×0.9）。 */
export function cavalryImpactMult(c: Company, targetIsMounted: boolean): number {
    if (c.variant === 'hussar') return 0.85;
    if (c.variant === 'lancer') return targetIsMounted ? 0.9 : 1.0;
    return 1.3; // 胸甲骑兵
}

/** 冲锋撞击方向倍率：正面 ×1.0，侧面(60°~120°) ×1.8，后背(>120°) ×2.5。 */
export function impactDirectionMult(attacker: {x: number; y: number}, target: {x: number; y: number; hx: number; hy: number}): {mult: number; arc: 'front'|'flank'|'rear'} {
    const dx = attacker.x - target.x, dy = attacker.y - target.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return {mult: 1.0, arc: 'front'};
    const dot = (dx * target.hx + dy * target.hy) / d;
    if (dot >= 0.5) return {mult: 1.0, arc: 'front'};
    if (dot <= -0.5) return {mult: 2.5, arc: 'rear'};
    return {mult: 1.8, arc: 'flank'};
}

/** 动态计算己方战线后方 600～900px 的重整集结点（C3）。 */
export function computeRallyPoint(w: SimWorld, c: Company): {x: number; y: number} {
    const face = c.faction ? -1 : 1;
    let sumX = 0, sumY = 0, cnt = 0;
    for (const o of w.companies) {
        if (o.faction === c.faction && (o.line === 0 || o.line === 1) && o.alive > 0 && o.status !== 'rout' && o.status !== 'gone') {
            sumX += o.x; sumY += o.y; cnt++;
        }
    }
    const baseX = cnt ? sumX / cnt : c.x;
    const baseY = cnt ? sumY / cnt : c.y;
    const backDist = 660 + (c.id % 4) * 70; // 660 ~ 870px，位于 600~900px 内
    const wingSign = c.y < baseY ? -1 : 1;
    const rx = Math.max(160, Math.min(WIDTH - 160, baseX - face * backDist));
    const ry = Math.max(200, Math.min(HEIGHT - 200, baseY + wingSign * (320 + (c.id % 3) * 140)));
    return {x: rx, y: ry};
}

/** 启动骑兵脱离进入 rally 重整阶段（B5 + C3）。 */
export function enterCavalryRally(w: SimWorld, c: Company, countAsCharge = true) {
    if (countAsCharge) {
        c.chargeCount++;
        if (c.chargeCount >= 3) {
            c.restUntil = w.tick + 1800; // B5：连续冲锋 3 次后必须休息 >= 1800 tick
            c.chargeCount = 0;
        }
    }
    const pt = computeRallyPoint(w, c);
    c.homeX = pt.x; c.homeY = pt.y;
    c.chargePhase = 'rally';
    c.rallyStartAt = w.tick;
    c.order = 'rally';
    c.forced = -1;
    c.chargeOpponent = -1;
    c.contactId = -1;
    c.engaged = false;
    c.lastMelee = -9999;
    c.flankWaypoint = null;
    c.threatenTarget = -1;
    for (const u of c.members) u.foe = -1;
    if (c.formation !== 'diamond') setFormation(w, c, 'diamond');
}

/** 骑兵状态机推进：负责阶段转换、B1 平滑加速、B4 绕行方阵、C1 追击、C2 脱离与 C3 重整。 */
export function stepCavalryCompany(w: SimWorld, c: Company, t: Company | undefined, d: number): {gx: number; gy: number; speed: number} | null {
    if (!isMounted(c) || c.line === 5) return null;
    const mult = cavalrySpeedMult(c);
    const resting = w.tick < c.restUntil;

    const smoothToward = (want: number) => {
        const cap = resting ? PACE.horseWalk * mult : want;
        const maxDelta = 30; // 每 6 tick 最多变化 30 px/s，保证连续平滑加速不跳变
        if (c.cavSpeed < cap) c.cavSpeed = Math.min(cap, c.cavSpeed + maxDelta);
        else if (c.cavSpeed > cap) c.cavSpeed = Math.max(cap, c.cavSpeed - maxDelta);
        return c.cavSpeed;
    };

    // 1. 重整阶段（C3）：回集结点、变成菱形、恢复士气 ≥ 55 后在 300~450 tick 内恢复可用
    if (c.chargePhase === 'rally' || c.order === 'rally') {
        c.chargePhase = 'rally';
        c.order = 'rally';
        const rd = Math.hypot(c.homeX - c.x, c.homeY - c.y);
        if (c.formation !== 'diamond') setFormation(w, c, 'diamond');
        if (rd < 90) {
            // 在集结点快速整队恢复士气
            c.morale = Math.min(c.base, c.morale + 1.1);
            c.cavSpeed = smoothToward(0);
            const elapsed = w.tick - c.rallyStartAt;
            if (c.morale >= 55 && c.formUntil <= w.tick && elapsed >= 340) {
                c.chargePhase = 'idle';
                c.order = 'hold';
                c.cavTask = 'none';
            }
            return {gx: c.homeX, gy: c.homeY, speed: c.cavSpeed};
        }
        // 即使还在路上，最多 420 tick 后如果已远离敌人且士气达标也能完成重整
        if (w.tick - c.rallyStartAt >= 360 && c.morale >= 55 && c.formUntil <= w.tick) {
            c.homeX = c.x; c.homeY = c.y;
            c.chargePhase = 'idle';
            c.order = 'hold';
            c.cavTask = 'none';
            return {gx: c.x, gy: c.y, speed: smoothToward(0)};
        }
        return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseTrot * mult)};
    }

    // 2. 威慑任务（D4）：推进到敌步兵营前 500px 迫其结方阵，不撞上去，停留 200~400 tick 后撤
    if (c.cavTask === 'threaten' && c.order === 'hold') {
        const tgt = c.threatenTarget >= 0 ? w.companies[c.threatenTarget] : undefined;
        if (!tgt || tgt.alive <= 0 || tgt.status === 'gone' || tgt.status === 'rout') {
            c.cavTask = 'none'; c.threatenTarget = -1;
            return {gx: c.x, gy: c.y, speed: smoothToward(PACE.horseWalk * mult)};
        }
        const td = dist(c, tgt);
        if (c.formation !== 'diamond') setFormation(w, c, 'diamond');
        if (td > 540) {
            // 前出到 480px 处威慑
            const gx = tgt.x + (c.x - tgt.x) / Math.max(1, td) * 460;
            const gy = tgt.y + (c.y - tgt.y) / Math.max(1, td) * 460;
            return {gx, gy, speed: smoothToward(PACE.horseTrot * mult)};
        }
        // 已抵达 460~540px 威慑区，沿切线慢步盘旋保持威胁但不撞上去
        if (c.threatenUntil <= 0) c.threatenUntil = w.tick + 240 + (c.id % 5) * 35; // 240~380 tick
        if (w.tick >= c.threatenUntil) {
            c.cavTask = 'none'; c.threatenTarget = -1; c.threatenUntil = 0;
            enterCavalryRally(w, c, false);
            return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseTrot * mult)};
        }
        const nx = (c.x - tgt.x) / Math.max(1, td), ny = (c.y - tgt.y) / Math.max(1, td);
        const dir = (c.id % 2 ? 1 : -1);
        const gx = Math.max(120, Math.min(WIDTH - 120, tgt.x + nx * 470 - ny * 110 * dir));
        const gy = Math.max(120, Math.min(HEIGHT - 120, tgt.y + ny * 470 + nx * 110 * dir));
        return {gx, gy, speed: smoothToward(PACE.horseWalk * 1.15 * mult)};
    }

    // 3. 追击阶段（C1）：目标溃散后追击至多 1200px（骠骑 1800px）或 300 tick
    if (c.chargePhase === 'pursue') {
        const maxDist = c.variant === 'hussar' ? 1800 : 1200;
        const traveled = Math.hypot(c.x - c.pursueStartX, c.y - c.pursueStartY);
        const elapsed = w.tick - c.pursueStartTick;
        if (!t || t.alive <= 0 || t.status === 'gone' || traveled >= maxDist || elapsed >= 300) {
            enterCavalryRally(w, c, true);
            return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseTrot * mult)};
        }
        return {gx: t.x, gy: t.y, speed: smoothToward(200 * mult)};
    }

    // 4. 冲锋状态机（form -> walk -> trot -> gallop -> charge -> impact）
    if (c.order === 'charge' && t && t.alive > 0 && t.status !== 'gone') {
        if (resting) {
            c.order = 'hold'; c.chargePhase = 'idle'; c.cavTask = 'none';
            return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseWalk * mult)};
        }
        // A2：发起冲锋前必须变成菱形
        if (c.formation !== 'diamond') {
            setFormation(w, c, 'diamond');
            c.chargePhase = 'form';
        }
        if (c.chargePhase === 'form') {
            if (c.formUntil > w.tick) {
                return {gx: c.x, gy: c.y, speed: smoothToward(0)};
            }
            c.chargePhase = d > 1200 ? 'walk' : d > 500 ? 'trot' : 'gallop';
        }

        // 若有侧翼迂回航路点（D2），先绕到侧翼点再折向目标冲锋
        if (c.flankWaypoint) {
            const wd = Math.hypot(c.flankWaypoint.x - c.x, c.flankWaypoint.y - c.y);
            if (wd < 180 || d < 520) {
                c.flankWaypoint = null;
            } else {
                c.chargePhase = wd > 1200 ? 'walk' : 'trot';
                return {gx: c.flankWaypoint.x, gy: c.flankWaypoint.y, speed: smoothToward((c.chargePhase === 'walk' ? PACE.horseWalk : PACE.horseTrot) * mult)};
            }
        }

        // 已经进入接触/冲击阶段
        const isSquare = t.formation === 'square' && t.formUntil <= w.tick && t.status !== 'rout';
        const contact = 75 + (isSquare ? 45 : 0);

        if (c.chargePhase === 'impact') {
            // 目标溃散 → 进入追击 C1
            if (t.status === 'rout') {
                c.chargePhase = 'pursue';
                c.pursueStartX = c.x; c.pursueStartY = c.y; c.pursueStartTick = w.tick;
                return {gx: t.x, gy: t.y, speed: smoothToward(200 * mult)};
            }
            // B4：撞方阵则在方阵前 60px 绕行 72 tick 承受射击后脱离
            if (isSquare) {
                if (w.tick - c.chargeAt >= 72) {
                    enterCavalryRally(w, c, true);
                    return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseTrot * mult)};
                }
                const nx = (c.x - t.x) / Math.max(1, d), ny = (c.y - t.y) / Math.max(1, d);
                const gx = t.x + nx * 85 - ny * 75, gy = t.y + ny * 85 + nx * 75;
                return {gx, gy, speed: smoothToward(PACE.horseTrot * mult)};
            }
            // C2：混战 >= 200 tick 仍未分胜负则脱离
            if (w.tick - c.chargeAt >= 200) {
                enterCavalryRally(w, c, true);
                return {gx: c.homeX, gy: c.homeY, speed: smoothToward(PACE.horseTrot * mult)};
            }
            return {gx: t.x - (t.x - c.x) / Math.max(1, d) * 28, gy: t.y - (t.y - c.y) / Math.max(1, d) * 28, speed: smoothToward(PACE.horseTrot * mult)};
        }

        // 根据距离转换加速阶段：walk(>1200) -> trot(<=1200) -> gallop(<=500) -> charge(<=200)
        const prevPhase = c.chargePhase;
        if (d <= contact) {
            c.chargePhase = 'impact';
            c.impactSpeed = Math.max(c.cavSpeed, 100);
            c.chargeOpponent = t.id;
            c.contactId = t.id;
            c.contactAt = w.tick;
            t.contactId = c.id;
            t.contactAt = w.tick;
            c.chargeAt = w.tick;
            // B2 + B3：接触瞬间结算动量与方向士气冲击
            const speedFactor = (c.impactSpeed / 235) * (c.impactSpeed < 140 ? 0.5 : 1.0);
            const dirInfo = impactDirectionMult(c, t);
            const squareDamp = isSquare ? 0.12 : 1.0;
            const moraleHit = 18 * speedFactor * dirInfo.mult * squareDamp * cavalryImpactMult(c, isMounted(t));
            shake(t, moraleHit);
            // 同步冲击目标所在营的邻近连（如果是侧翼或后背重击）
            if (!isSquare && dirInfo.arc !== 'front' && t.battalion >= 0) {
                const tb = w.battalions[t.battalion];
                if (tb) {
                    for (const cid of tb.companies) {
                        const oc = w.companies[cid];
                        if (oc && oc !== t && oc.alive > 0 && dist(c, oc) < 260) shake(oc, moraleHit * 0.45);
                    }
                }
            }
            w.cavalryImpacts.push({
                tick: w.tick, company: c.id, target: t.id,
                formation: c.formation, speed: c.impactSpeed,
                arc: dirInfo.arc, vsSquare: isSquare,
                targetMoraleAfter: t.morale, targetRoutedWithin300: false
            });
            // 夺炮判定：炮兵士气低或炮组全灭直接缴获
            if (isArtillery(t) && (t.morale < 28 || t.members.every(g => g.hp <= 0 || g.crew <= 0))) {
                c.captures++;
                w.say(c.name + '冲入敌炮阵，夺取炮位！', c.faction, t.x, t.y, 2);
                shake(t, 40);
            }
            if (isSquare) {
                const nx = (c.x - t.x) / Math.max(1, d), ny = (c.y - t.y) / Math.max(1, d);
                return {gx: t.x + nx * 85 - ny * 75, gy: t.y + ny * 85 + nx * 75, speed: smoothToward(PACE.horseTrot * mult)};
            }
            return {gx: t.x - (t.x - c.x) / Math.max(1, d) * 26, gy: t.y - (t.y - c.y) / Math.max(1, d) * 26, speed: smoothToward(PACE.horseTrot * mult)};
        }

        if (d <= 200) {
            c.chargePhase = 'charge';
            c.fatigue = Math.min(1, c.fatigue + 0.008);
            c.sprintUntil = w.tick + 12;
        } else if (d <= 500) {
            c.chargePhase = 'gallop';
            c.fatigue = Math.min(1, c.fatigue + 0.004);
            c.sprintUntil = w.tick + 12;
        } else if (d <= 1200) {
            c.chargePhase = 'trot';
        } else {
            c.chargePhase = 'walk';
        }
        // J2 口径：每次进入 gallop 阶段（从非 gallop/charge 进入）计为一次冲锋
        if ((c.chargePhase === 'gallop' || c.chargePhase === 'charge') && prevPhase !== 'gallop' && prevPhase !== 'charge') {
            c.charges++;
            w.cavalryChargeEvents.push({tick: w.tick, company: c.id, task: c.cavTask, target: t.id});
        }
        const wantSp = c.chargePhase === 'charge' ? 235 : c.chargePhase === 'gallop' ? 200 : c.chargePhase === 'trot' ? 140 : 70;
        const sep = isSquare ? 68 : 22;
        return {
            gx: t.x - (t.x - c.x) / Math.max(1, d) * sep,
            gy: t.y - (t.y - c.y) / Math.max(1, d) * sep,
            speed: smoothToward(wantSp * mult)
        };
    }

    // 5. 掩护侧翼巡逻（D6）或常规移动：不在原地罚站
    c.chargePhase = 'idle';
    const gd = Math.hypot(c.homeX - c.x, c.homeY - c.y);
    if (gd > 25) {
        return {gx: c.homeX, gy: c.homeY, speed: smoothToward((resting ? PACE.horseWalk : PACE.horseTrot) * mult)};
    }
    return {gx: c.homeX, gy: c.homeY, speed: smoothToward(0)};
}

/**
 * 任务书 14 D 节：骑兵 6 种战术任务评估（每 30 tick 调用，去掉 60% 跳过概率）。
 * 1. 反冲锋(counter) 2. 侧翼打击(flank) 3. 追击(pursue) 4. 威慑(threaten) 5. 夺炮(battery) 6. 掩护侧翼(screen)
 */
export function evaluateCavalryAI(w: SimWorld, f: Faction, own: Company[], seen: Company[]) {
    const face = f ? -1 : 1;
    const attack = w.posture[f] === 'attack';
    const readyAt = attack ? w.director.cannonadeEnd[f] + 60 : w.deployEnd + 180;
    if (w.tick < readyAt) return;

    const cavs = own.filter(c => isMounted(c) && c.line !== 5 && c.status !== 'rout' && c.status !== 'gone' && c.alive >= 4);
    if (!cavs.length) return;

    // 己方主力战线位置（用于掩护侧翼巡逻）
    const frontFoot = own.filter(c => (isLineTroop(c) || isGuard(c)) && c.line <= 1 && c.status !== 'rout');
    const frontX = frontFoot.length ? frontFoot.reduce((s, c) => s + c.x, 0) / frontFoot.length : WIDTH * 0.5 - face * 1000;
    const minFootY = frontFoot.length ? Math.min(...frontFoot.map(c => c.y)) : HEIGHT * 0.3;
    const maxFootY = frontFoot.length ? Math.max(...frontFoot.map(c => c.y)) : HEIGHT * 0.7;

    // 预分类可见敌军，消除三层嵌套循环（保持完全等价的确定性结果）
    const enemyCav: Company[] = [];
    const enemyGuns: Company[] = [];
    const enemyRout: Company[] = [];
    const enemyFootGuard: Company[] = [];
    const enemyCover: Company[] = [];
    for (const o of seen) {
        if (o.faction === f || o.status === 'gone') continue;
        if (o.status === 'rout') {
            if (o.alive >= 3 && o.line !== 5) enemyRout.push(o);
            continue;
        }
        if (isMounted(o)) {
            if (o.line !== 5 && o.alive >= 3) enemyCav.push(o);
            if (o.alive >= 6) enemyCover.push(o);
        } else if (isArtillery(o)) {
            if (o.alive > 0 && o.members.some(g => g.hp > 0 && g.crew > 0)) enemyGuns.push(o);
        } else if (isLineTroop(o) || isGuard(o)) {
            if (o.alive >= 6) {
                enemyFootGuard.push(o);
                if (o.line === 1 && o.firingSince < 0) enemyCover.push(o);
            }
        }
    }
    const enemyBats = w.battalions.filter(eb => eb.faction !== f).map(eb => ({ eb, comps: activeCompanies(w, eb) })).filter(x => x.comps.length > 0);
    // 预筛未受步兵掩护的敌炮兵连
    const unguardedGuns = enemyGuns.filter(g => !inWoods(g.x, g.y, 20) && !enemyFootGuard.some(p => dist(p, g) <= 400));

    for (const c of cavs) {
        // 冲锋、追击、重整中或处于 1800 tick 休息期不接新攻击任务
        if (c.chargePhase === 'rally' || c.order === 'rally' || c.chargePhase === 'pursue' || c.chargePhase === 'impact') continue;
        if (c.order === 'charge' && (c.chargePhase === 'gallop' || c.chargePhase === 'charge')) continue;
        if (w.tick < c.restUntil) {
            // 休息期慢步巡逻掩护侧翼
            c.cavTask = 'screen';
            const wing = c.id % 2 ? 1 : -1;
            const patrolY = wing < 0 ? Math.max(220, minFootY - 750) : Math.min(HEIGHT - 220, maxFootY + 750);
            c.homeX = Math.max(200, Math.min(WIDTH - 200, frontX - face * 400));
            c.homeY = patrolY;
            continue;
        }
        // 正在执行威慑且尚未到时间，检查是否有紧急反冲锋，否则继续威慑
        const busyThreaten = c.cavTask === 'threaten' && c.threatenTarget >= 0;

        let bestTask: CavalryTask = 'screen';
        let bestScore = 0;
        let bestTarget: Company | null = null;
        let bestWaypoint: {x: number; y: number} | null = null;

        // ---- 1. 反冲锋（counter）：敌骑兵 <= 1200px 且朝己方移动 ----
        for (const o of enemyCav) {
            const d = dist(c, o);
            if (d > 1200) continue;
            const sp = Math.hypot(o.vx, o.vy);
            const approaching = sp > 10 && ((c.x - o.x) * o.vx + (c.y - o.y) * o.vy) > 0;
            const towardLine = sp > 10 && ((frontX - o.x) * o.vx) > 0;
            if (approaching || towardLine || o.order === 'charge') {
                const score = 4.2 - d / 1400;
                if (score > bestScore) { bestScore = score; bestTask = 'counter'; bestTarget = o; bestWaypoint = null; }
            }
        }
        if (busyThreaten && bestTask !== 'counter') continue;

        // ---- 2. 夺炮（battery）：敌炮兵连 400px 内无步兵掩护 ----
        for (const o of unguardedGuns) {
            const d = dist(c, o);
            if (d > 2600) continue;
            const score = 3.4 - d / 2600;
            if (score > bestScore) { bestScore = score; bestTask = 'battery'; bestTarget = o; bestWaypoint = null; }
        }

        // ---- 3. 追击（pursue）：敌部队溃散且距离 <= 2000px ----
        for (const o of enemyRout) {
            const d = dist(c, o);
            if (d > 2000 || inWoods(o.x, o.y, 20)) continue;
            const score = 3.1 - d / 2200 + (c.variant === 'hussar' ? 0.5 : 0);
            if (score > bestScore) { bestScore = score; bestTask = 'pursue'; bestTarget = o; bestWaypoint = null; }
        }

        // ---- 4. 侧翼打击（flank）：敌步兵营正在对射且侧翼/后方 1500px 内无掩护 ----
        for (const { eb, comps: eComps } of enemyBats) {
            const dueling = eb.firingSince >= 0 || eb.stoppedAt >= 0;
            if (!dueling) continue;
            const dBat = dist(c, eb);
            if (dBat > 3200) continue;
            const endComp = dist(c, eComps[0]) <= dist(c, eComps[eComps.length - 1]) ? eComps[0] : eComps[eComps.length - 1];
            if (inWoods(endComp.x, endComp.y, 25) || inRect(layout.farm, endComp.x, endComp.y, 35)) continue;
            if (endComp.formation === 'square' && endComp.formUntil <= w.tick) continue;
            const tx = -eb.hy, ty = eb.hx;
            const sideSign = ((c.x - eb.x) * tx + (c.y - eb.y) * ty) >= 0 ? 1 : -1;
            const flankPt = {
                x: Math.max(160, Math.min(WIDTH - 160, endComp.x + tx * sideSign * 420 - eb.hx * 220)),
                y: Math.max(160, Math.min(HEIGHT - 160, endComp.y + ty * sideSign * 420 - eb.hy * 220))
            };
            const covered = enemyCover.some(p => p.battalion !== eb.id && dist(p, flankPt) < 1500);
            if (!covered) {
                const score = 3.6 - dBat / 3400;
                if (score > bestScore) {
                    bestScore = score; bestTask = 'flank'; bestTarget = endComp;
                    const curArc = impactDirectionMult(c, endComp).arc;
                    bestWaypoint = curArc === 'front' ? flankPt : null;
                }
            }
        }

        // ---- 5. 威慑（threaten）：敌步兵营在开阔地 → 推进至 500px 迫其结方阵，不撞上去 ----
        for (const { eb, comps: eComps } of enemyBats) {
            const lead = eComps[Math.floor(eComps.length / 2)];
            if (lead.formation === 'square') continue;
            const d = dist(c, lead);
            if (d > 2200 || d < 350) continue;
            if (inWoods(lead.x, lead.y, 30) || inRect(layout.farm, lead.x, lead.y, 40)) continue;
            const score = 2.35 - d / 2600 + (eb.firingSince < 0 ? 0.35 : 0);
            if (score > bestScore) { bestScore = score; bestTask = 'threaten'; bestTarget = lead; bestWaypoint = null; }
        }

        // 如果已经在冲锋同一个目标，避免反复打断
        if (c.order === 'charge' && c.forced >= 0 && bestTarget && bestTarget.id === c.forced) continue;

        if (bestTask !== 'screen' && bestTarget && bestScore > 0.8) {
            c.cavTask = bestTask;
            w.cavalryTaskCounts[bestTask] = (w.cavalryTaskCounts[bestTask] ?? 0) + 1;
            if (bestTask === 'threaten') {
                c.order = 'hold';
                c.chargePhase = 'idle';
                c.threatenTarget = bestTarget.id;
                c.threatenUntil = 0;
                c.flankWaypoint = null;
                if (c.formation !== 'diamond') setFormation(w, c, 'diamond');
            } else {
                c.order = 'charge';
                c.forced = bestTarget.id;
                c.flankWaypoint = bestWaypoint;
                c.threatenTarget = -1;
                c.chargePhase = c.formation === 'diamond' && c.formUntil <= w.tick
                    ? (dist(c, bestTarget) > 1200 ? 'walk' : dist(c, bestTarget) > 500 ? 'trot' : 'gallop')
                    : 'form';
                if (c.formation !== 'diamond') setFormation(w, c, 'diamond');
                if (bestTask === 'counter') w.say(`${c.name}迎击敌骑，发起反冲锋！`, f, c.x, c.y, 2);
                else if (bestTask === 'flank') w.say(`${c.name}迂回侧翼，向${bestTarget.name}发起冲锋！`, f, c.x, c.y, 2);
                else if (bestTask === 'battery') w.say(`${c.name}直扑敌炮兵阵地！`, f, c.x, c.y, 2);
            }
        } else {
            // ---- 6. 掩护侧翼（screen）：在己方战线侧翼外 600～1200px 巡逻，绝不原地罚站 ----
            c.cavTask = 'screen';
            w.cavalryTaskCounts.screen = (w.cavalryTaskCounts.screen ?? 0) + 1;
            c.order = 'hold';
            c.chargePhase = 'idle';
            c.flankWaypoint = null;
            const wing = c.id % 2 ? 1 : -1;
            const patrolPhase = Math.floor((w.tick + c.id * 97) / 180) % 2;
            const offsetOut = patrolPhase === 0 ? 700 : 1050;
            const patrolX = Math.max(220, Math.min(WIDTH - 220, frontX + face * (patrolPhase === 0 ? 120 : -260)));
            const patrolY = wing < 0
                ? Math.max(220, minFootY - offsetOut)
                : Math.min(HEIGHT - 220, maxFootY + offsetOut);
            c.homeX = patrolX;
            c.homeY = patrolY;
        }
    }
}
