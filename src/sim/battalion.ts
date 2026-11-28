import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type {Battalion, Company, Soldier} from './arenaTypes';
import type {SimWorld} from './world';
import {WIDTH, HEIGHT, behindCrest, inRect, inWoods, layout, movementAt} from './maps';
import {RANGE, PACE} from './scale';
import {dist, shake, battalionFireWindow, skirmishFire} from './combat';
import {formationTicks} from './units/roster';
import {setFormation} from './strategy';

const LINE_SPACING = 13;
const COMPANY_GAP = 16; // 营内相邻两连侧翼净间距（≤ 30px）

export function isSkirmisherCompany(c: Company): boolean {
    return c.variant === 'voltigeur' || c.variant === 'rifles';
}

export function activeCompanies(w: SimWorld, b: Battalion): Company[] {
    const out: Company[] = [];
    for (const id of b.companies) {
        const c = w.companies[id];
        if (c && c.alive > 0 && c.status !== 'rout' && c.status !== 'gone') out.push(c);
    }
    return out;
}

export function companyHalfWidth(c: Company): number {
    const effFiles = Math.max(1, c.files - 2 * c.margin);
    return Math.max(12, (effFiles - 1) * LINE_SPACING * 0.5);
}

/** 计算营内各活跃连沿横队切向 (-hy, hx) 的中心偏移，保证相邻侧翼间隙稳定在 COMPANY_GAP。 */
export function battalionOffsets(comps: Company[]): number[] {
    if (!comps.length) return [];
    const widths = comps.map(c => companyHalfWidth(c) * 2);
    const total = widths.reduce((s, v) => s + v, 0) + COMPANY_GAP * Math.max(0, comps.length - 1);
    const offsets: number[] = [];
    let cursor = -total * 0.5;
    for (let i = 0; i < comps.length; i++) {
        offsets.push(cursor + widths[i] * 0.5);
        cursor += widths[i] + COMPANY_GAP;
    }
    return offsets;
}

/** 测量营内相邻横队连对的连续性：间隙 ≤ 30px 且前后错位 ≤ 40px。 */
export function measureBattalionContinuity(w: SimWorld, b: Battalion): {ok: number; total: number; maxGap: number; maxSkew: number} {
    const comps = activeCompanies(w, b).filter(c => c.formation === 'line' && Math.abs(c.refuseAngle) < 0.1);
    if (comps.length < 2) return {ok: 0, total: 0, maxGap: 0, maxSkew: 0};
    const tx = -b.hy, ty = b.hx;
    let ok = 0, maxGap = 0, maxSkew = 0;
    for (let i = 0; i < comps.length - 1; i++) {
        const a = comps[i], b2 = comps[i + 1];
        const dx = b2.x - a.x, dy = b2.y - a.y;
        const lat = Math.abs(dx * tx + dy * ty);
        const gap = Math.max(0, lat - companyHalfWidth(a) - companyHalfWidth(b2));
        const skew = Math.abs(dx * b.hx + dy * b.hy);
        if (gap > maxGap) maxGap = gap;
        if (skew > maxSkew) maxSkew = skew;
        if (gap <= 30 && skew <= 40) ok++;
    }
    return {ok, total: comps.length - 1, maxGap, maxSkew};
}

/** 按营中心和朝向把营内各连的 homeX/homeY 与当前位置严格对齐（布阵时调用）。 */
export function alignBattalionCompanies(w: SimWorld, b: Battalion, moveNow = false) {
    const comps = activeCompanies(w, b);
    if (!comps.length) return;
    const offsets = battalionOffsets(comps);
    const tx = -b.hy, ty = b.hx;
    for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        c.battalionSlot = i;
        const px = Math.max(120, Math.min(WIDTH - 120, b.x + tx * offsets[i]));
        const py = Math.max(120, Math.min(HEIGHT - 120, b.y + ty * offsets[i]));
        c.homeX = px; c.homeY = py;
        if (moveNow) {
            c.x = c.gx = px; c.y = c.gy = py;
            c.hx = b.hx; c.hy = b.hy;
        }
    }
    // 轻步兵/来复枪散兵连放在营前 400px
    const skirms = b.skirmishers.map(id => w.companies[id]).filter(c => c && c.alive > 0 && c.status !== 'gone');
    for (let i = 0; i < skirms.length; i++) {
        const sc = skirms[i];
        const lat = (i - (skirms.length - 1) * 0.5) * 260;
        const sx = Math.max(120, Math.min(WIDTH - 120, b.x + b.hx * 400 + tx * lat));
        const sy = Math.max(120, Math.min(HEIGHT - 120, b.y + b.hy * 400 + ty * lat));
        sc.homeX = sx; sc.homeY = sy;
        if (moveNow) {
            sc.x = sc.gx = sx; sc.y = sc.gy = sy;
            sc.hx = b.hx; sc.hy = b.hy;
            sc.formation = 'skirmish';
        }
    }
}

/** 选定营的目标（优先敌营，也可敌连），目标距离按营中心计算。 */
function pickBattalionTarget(w: SimWorld, b: Battalion, comps: Company[]): {battalion: Battalion | null; company: Company | null; d: number} {
    const anySees = (o: Company) => comps.some(c => w.sight.canSee(w, c, o));
    // 检查强制目标
    for (const c of comps) {
        if (c.forced >= 0) {
            const f = w.companies[c.forced];
            if (f && f.faction !== b.faction && f.alive > 0 && f.status !== 'gone' && f.line !== 5 && anySees(f)) {
                const tb = f.battalion >= 0 ? w.battalions[f.battalion] : null;
                if (tb && activeCompanies(w, tb).length > 0) return {battalion: tb, company: f, d: dist(b, tb)};
                return {battalion: null, company: f, d: dist(b, f)};
            }
        }
    }
    const reach = w.weather === 'fog' ? 1500 : 7500;
    let bestBat: Battalion | null = null, bestComp: Company | null = null, bestScore = Infinity, bestDist = Infinity;

    for (const eb of w.battalions) {
        if (eb.faction === b.faction) continue;
        const eComps = activeCompanies(w, eb);
        if (!eComps.length) continue;
        const d = dist(b, eb);
        if (d > reach) continue;
        const seenComp = eComps.find(ec => anySees(ec) && !(d > 260 && behindCrest(ec.x, ec.y, ec.faction)));
        if (!seenComp) continue;
        const score = d + Math.abs(eb.y - b.y) * 0.75 + (eb.kind === 'guard_grenadier' ? -30 : 0);
        if (score < bestScore) {
            bestScore = score; bestDist = d; bestBat = eb; bestComp = seenComp;
        }
    }
    // 也检查非营敌连（炮兵、守军、独立步兵），仅在更近时优先
    for (const o of w.companies) {
        if (o.faction === b.faction || o.battalion >= 0 || o.alive <= 0 || o.status === 'gone' || o.line === 5) continue;
        if (isMounted(o) && o.status === 'rout') continue;
        const d = dist(b, o);
        if (d > reach || !anySees(o)) continue;
        if (!isMounted(o) && d > 260 && behindCrest(o.x, o.y, o.faction)) continue;
        const pen = o.status === 'rout' ? 1.8 : isMounted(o) ? 1.35 : 1.05;
        const score = (d + Math.abs(o.y - b.y) * 0.75) * pen;
        if (score < bestScore) {
            bestScore = score; bestDist = d; bestBat = null; bestComp = o;
        }
    }
    return {battalion: bestBat, company: bestComp, d: bestDist};
}

/** 计算某营近 300 tick 的伤亡占 300 tick 前兵力的比例。 */
export function recentLossFraction(w: SimWorld, target: Battalion | Company): number {
    const cutoff = w.tick - 300;
    if ('companies' in target) {
        let alive = 0, lost = 0;
        for (const id of target.companies) {
            const c = w.companies[id];
            if (!c) continue;
            alive += c.alive;
            while (c.recentLosses.length && c.recentLosses[0] < cutoff) c.recentLosses.shift();
            lost += c.recentLosses.length;
        }
        return lost / Math.max(1, alive + lost);
    }
    while (target.recentLosses.length && target.recentLosses[0] < cutoff) target.recentLosses.shift();
    return target.recentLosses.length / Math.max(1, target.alive + target.recentLosses.length);
}

/** 判定攻击方是否位于目标侧面或后方（与目标朝向夹角 > 60°）。 */
export function isFlankOrRear(attacker: {x: number; y: number}, target: {x: number; y: number; hx: number; hy: number}): boolean {
    const dx = attacker.x - target.x, dy = attacker.y - target.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return false;
    const dot = (dx * target.hx + dy * target.hy) / d;
    return dot < 0.5; // cos(60°) = 0.5
}

/** 检查 D4 的 5 条刺刀冲锋条件（不含距离限制，用于决定压近和冲锋）。 */
export function meetsAssaultConditions(w: SimWorld, b: Battalion, tBat: Battalion | null, tComp: Company): boolean {
    const comps = activeCompanies(w, b);
    if (!comps.length) return false;
    const ownMorale = comps.reduce((s, c) => s + c.morale * c.alive, 0) / Math.max(1, comps.reduce((s, c) => s + c.alive, 0));

    let tMorale = tComp.morale, tShaken = tComp.status === 'shaken' || tComp.status === 'rout', tAmmo = tComp.ammo;
    let tHeading = {x: tComp.x, y: tComp.y, hx: tComp.hx, hy: tComp.hy};
    let lossFrac = recentLossFraction(w, tComp);

    if (tBat) {
        const eComps = activeCompanies(w, tBat);
        if (eComps.length) {
            const eAlive = eComps.reduce((s, c) => s + c.alive, 0);
            tMorale = eComps.reduce((s, c) => s + c.morale * c.alive, 0) / Math.max(1, eAlive);
            tShaken = tMorale < 40 || eComps.filter(c => c.status === 'shaken').length >= Math.ceil(eComps.length * 0.5);
            tAmmo = eComps.reduce((s, c) => s + c.ammo, 0);
            tHeading = {x: tBat.x, y: tBat.y, hx: tBat.hx, hy: tBat.hy};
            lossFrac = recentLossFraction(w, tBat);
        }
    }
    // 1. 目标士气 < 40 或动摇
    if (tMorale < 40 || tShaken) return true;
    // 2. 目标最近 300 tick 伤亡超 15%
    if (lossFrac > 0.15) return true;
    // 3. 目标弹药耗尽
    if (tAmmo <= 0) return true;
    // 4. 位于目标侧面或后方（夹角 > 60°）
    if (isFlankOrRear(b, tHeading)) return true;
    // 5. 与目标持续对射 >= 900 tick 且自身士气高 15 以上
    if (b.firingSince >= 0 && w.tick - b.firingSince >= 900 && ownMorale >= tMorale + 15) return true;
    return false;
}

/** 检测侧翼 60°～120° 方向、距离 < 800px 的敌军，触发端连钩形转向（D5）。 */
function updateFlankRefusal(w: SimWorld, b: Battalion, comps: Company[]) {
    if (comps.length < 2) {
        b.refusedLeft = false; b.refusedRight = false;
        for (const c of comps) c.refuseAngle = 0;
        return;
    }
    const left = comps[0], right = comps[comps.length - 1];
    // 清除中间连的拒止角度
    for (let i = 1; i < comps.length - 1; i++) comps[i].refuseAngle = 0;
    const tx = -b.hy, ty = b.hx;
    let leftThreat: Company | null = null, leftDist = 800;
    let rightThreat: Company | null = null, rightDist = 800;

    for (const o of w.companies) {
        if (o.faction === b.faction || o.alive <= 0 || o.status === 'gone' || o.status === 'rout' || o.line === 5) continue;
        const dCenter = dist(b, o);
        const dLeft = dist(left, o), dRight = dist(right, o);
        if (Math.min(dCenter, dLeft, dRight) >= 800) continue;
        if (!w.sight.canSee(w, left, o) && !w.sight.canSee(w, right, o)) continue;
        // 相对于营中心的方向与营朝向夹角必须在 60°～120°（|dot| <= 0.5）
        const dx = o.x - b.x, dy = o.y - b.y, len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const dotH = (dx * b.hx + dy * b.hy) / len;
        if (Math.abs(dotH) > 0.5) continue;
        const side = dx * tx + dy * ty;
        if (side < 0 && dLeft < leftDist) { leftDist = dLeft; leftThreat = o; }
        else if (side > 0 && dRight < rightDist) { rightDist = dRight; rightThreat = o; }
    }

    const baseAng = Math.atan2(b.hy, b.hx);
    if (leftThreat) {
        const want = Math.atan2(leftThreat.y - left.y, leftThreat.x - left.x);
        let diff = want - baseAng;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (!b.refusedLeft) {
            left.refuseUntil = w.tick + formationTicks(left, 'line', left.status === 'shaken');
        }
        b.refusedLeft = true;
        left.refuseAngle = diff;
        left.target = leftThreat.id;
    } else {
        b.refusedLeft = false;
        left.refuseAngle = 0;
    }

    if (rightThreat) {
        const want = Math.atan2(rightThreat.y - right.y, rightThreat.x - right.x);
        let diff = want - baseAng;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (!b.refusedRight) {
            right.refuseUntil = w.tick + formationTicks(right, 'line', right.status === 'shaken');
        }
        b.refusedRight = true;
        right.refuseAngle = diff;
        right.target = rightThreat.id;
    } else {
        b.refusedRight = false;
        right.refuseAngle = 0;
    }
}

/** 驱动配属给本营的轻步兵/来复枪散兵连（E1/E2）。 */
function updateBattalionSkirmishers(w: SimWorld, b: Battalion, comps: Company[]) {
    if (!b.skirmishers.length) return;
    const tx = -b.hy, ty = b.hx;
    const skirms = b.skirmishers.map(id => w.companies[id]).filter(c => c && c.alive > 0 && c.status !== 'gone' && c.status !== 'rout');
    if (!skirms.length) return;

    for (let i = 0; i < skirms.length; i++) {
        const sc = skirms[i];
        if (sc.formation !== 'skirmish' && sc.formation !== 'square') setFormation(w, sc, 'skirmish');
        // 检查敌步兵 600px / 敌骑兵 900px 威胁，或本营当前停下准备对射/发起冲锋时退回营后让出火线
        const batStopped = b.stoppedAt >= 0 && Math.hypot(b.gx - b.x, b.gy - b.y) <= 28;
        let retreat = batStopped || b.order === 'assault';
        if (!retreat) {
            for (const o of w.companies) {
                if (o.faction === sc.faction || o.alive <= 0 || o.status === 'gone' || o.status === 'rout' || o.line === 5) continue;
                if (!w.sight.canSee(w, sc, o)) continue;
                const d = dist(sc, o);
                if (isMounted(o) ? d <= 900 : (isLineTroop(o) || isGuard(o)) && d <= 600) {
                    retreat = true; break;
                }
            }
        }
        const lat = (i - (skirms.length - 1) * 0.5) * 260;
        const fwd = retreat || !comps.length ? -55 : 405;
        const px = Math.max(120, Math.min(WIDTH - 120, b.x + b.hx * fwd + tx * lat));
        const py = Math.max(120, Math.min(HEIGHT - 120, b.y + b.hy * fwd + ty * lat));
        sc.homeX = px; sc.homeY = py;
        sc.order = 'hold';
        // 散兵在推进前出时保持在营前 315~485px，偏离该区间先快速归位再自由点射
        const curFwd = (sc.x - b.x) * b.hx + (sc.y - b.y) * b.hy;
        const catchingUp = !retreat && (curFwd < 325 || curFwd > 475);
        if (!catchingUp && sc.formation === 'skirmish' && !sc.engaged && sc.ammo > 0 && w.tick >= sc.reloadAt) {
            skirmishFire(w, sc);
        }
    }
}

/** 营级大脑：每 6 帧更新机动、队形、侧翼拒止与散兵协同；每帧检查精准 3 tick 齐射口令。 */
export function updateBattalions(w: SimWorld) {
    for (let bi = 0; bi < w.battalions.length; bi++) {
        const b = w.battalions[bi];
        const fullUpdate = (w.tick + bi) % 6 === 0;
        const wantFire = w.tick >= b.nextFireAt && b.order !== 'assault' && b.order !== 'rally';
        if (!fullUpdate && !wantFire) continue;
        const comps = activeCompanies(w, b);
        if (!comps.length) {
            if (fullUpdate) updateBattalionSkirmishers(w, b, comps);
            else b.nextFireAt = w.tick + 18;
            continue;
        }
        if (fullUpdate) {
            // 1. 硝烟消散
            b.smoke = Math.max(0, b.smoke - (w.weather === 'fog' ? 0.012 : 0.024));
            for (const c of comps) c.smoke = Math.max(c.smoke, b.smoke);

            // 2. 同步营命令：如果外部（传令兵/AI/测试脚本）改了营内过半连的命令，同步到营
            const assaultCount = comps.filter(c => c.order === 'assault').length;
            const advanceCount = comps.filter(c => c.order === 'advance').length;
            const rallyCount = comps.filter(c => c.order === 'rally').length;
            if (rallyCount >= Math.ceil(comps.length * 0.5)) { b.order = 'rally'; b.closing = false; }
            else if (assaultCount > 0) { b.order = 'assault'; b.closing = false; }
            else if (advanceCount >= Math.ceil(comps.length * 0.5) && b.order !== 'advance') { b.order = 'advance'; }

            // 3. 选定目标（若彻底更换了新敌营目标且重新进入推进，则对新敌营允许再次进行首轮齐射）
            const prevTarget = b.target;
            const picked = pickBattalionTarget(w, b, comps);
            b.target = picked.battalion ? picked.battalion.id : -1;
            b.targetCompany = picked.company ? picked.company.id : -1;
            if (prevTarget >= 0 && b.target >= 0 && b.target !== prevTarget && b.stoppedAt < 0 && b.firstVolleyCount > 0) {
                b.firingSince = -1;
            }
            const tPos = picked.battalion ?? picked.company;
            const d = picked.d;

            // 4. 更新营朝向（转向目标，平滑缓慢避免破坏横队）
            const face = b.faction ? -1 : 1;
            let ax = tPos ? tPos.x - b.x : face, ay = tPos ? tPos.y - b.y : 0;
            if (b.order === 'rally' || b.order === 'reserve' || (!tPos || d > 2800)) { ax = face; ay = 0; }
            const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
            const cur = Math.atan2(b.hy, b.hx), want = Math.atan2(ay, ax);
            let delta = want - cur;
            while (delta > Math.PI) delta -= 2 * Math.PI;
            while (delta < -Math.PI) delta += 2 * Math.PI;
            const turn = cur + Math.max(-0.08, Math.min(0.08, delta));
            b.hx = Math.cos(turn); b.hy = Math.sin(turn);

            // 5. 推进 → 停下 → 整队 → 对射（D1 / D2 / D3）
            const guardBat = b.kind === 'guard_grenadier';
            const anySquare = comps.some(c => c.formation === 'square');
            const anyEngaged = comps.some(c => c.engaged);

            // 若已在对射中且满足 D4 优势条件，及时切换压近（closing）并在 <= 400px 发起刺刀冲锋
            if (tPos && picked.company && !anySquare && !anyEngaged && !w.noAssault[b.faction] && (b.order === 'advance' || b.order === 'hold') && b.line !== 6) {
                const avgM = comps.reduce((s, c) => s + c.morale, 0) / comps.length;
                if (avgM >= 42 && !comps.some(c => w.tick < c.assaultReady) && picked.company.status !== 'rout' && !isMounted(picked.company)) {
                    const readyCharge = b.firstVolleyCount >= 1 || d <= 220 || isFlankOrRear(b, picked.battalion ?? picked.company);
                    if (readyCharge && meetsAssaultConditions(w, b, picked.battalion, picked.company)) {
                        if (d <= 400) {
                            b.order = 'assault'; b.closing = false;
                            if (b.firstChargeAt < 0) b.firstChargeAt = w.tick;
                            w.assaultOrders.push({tick: w.tick, battalion: b.id, company: comps[0].id, dist: d, sinceFirstFire: b.firingSince >= 0 ? w.tick - b.firingSince : 0});
                            for (const c of comps) {
                                c.order = 'assault'; c.forced = picked.company.id; c.charges++;
                                c.freshAtStart = picked.company.alive === picked.company.peak && picked.company.morale > 60;
                            }
                        } else if (d <= 1250 && (b.firingSince >= 0 || b.order === 'advance')) {
                            b.closing = true;
                            if (b.order === 'hold') { b.order = 'advance'; for (const c of comps) c.order = 'advance'; }
                        }
                    } else {
                        b.closing = false;
                    }
                } else {
                    b.closing = false;
                }
            }
            const stopDist = b.closing ? 340 : (guardBat && b.firstVolleyCount === 0 ? 560 : 855);

            if (b.order === 'assault' && tPos) {
                b.stoppedAt = -1; b.aligned = false;
                b.gx = tPos.x - (tPos.x - b.x) / Math.max(1, d) * 30;
                b.gy = tPos.y - (tPos.y - b.y) / Math.max(1, d) * 30;
                if (picked.company && (picked.company.status === 'rout' || picked.company.status === 'gone') && !anyEngaged && d < 260) {
                    b.order = 'hold'; b.homeX = b.x; b.homeY = b.y;
                    for (const c of comps) { c.order = 'hold'; c.assaultStage = 'idle'; c.forced = -1; }
                }
            } else if (b.order === 'advance') {
                if (tPos) {
                    if (b.stoppedAt < 0) {
                        // 二线/预备营推进时，如果正前方有本方其他营挡路，自动向侧翼空档横移展开
                        let sidestepY = 0;
                        for (const fb of w.battalions) {
                            if (fb === b || fb.faction !== b.faction || !activeCompanies(w, fb).length) continue;
                            const fx = fb.x - b.x, fy = fb.y - b.y;
                            const ahead = fx * b.hx + fy * b.hy;
                            const side = -fx * b.hy + fy * b.hx;
                            if (ahead > 40 && ahead < 520 && Math.abs(side) < 480) {
                                sidestepY = side >= 0 ? -420 : 420;
                                break;
                            }
                        }
                        if (d <= stopDist + 55 && sidestepY === 0) {
                            b.stoppedAt = w.tick; b.aligned = false;
                            b.gx = b.x; b.gy = b.y;
                        } else {
                            const moveD = Math.max(0, d - stopDist);
                            const txDir = -b.hy, tyDir = b.hx;
                            b.gx = Math.max(160, Math.min(WIDTH - 160, b.x + (tPos.x - b.x) / d * moveD + txDir * sidestepY));
                            b.gy = Math.max(160, Math.min(HEIGHT - 160, b.y + (tPos.y - b.y) / d * moveD + tyDir * sidestepY));
                        }
                    } else {
                        // 对射期间原地不动，除非敌人退到射程外或 AI 要求压近（D3）
                        const needMove = b.closing ? d > 385 : d > (guardBat && b.firstVolleyCount === 0 ? 640 : 1060);
                        if (needMove && !anySquare) {
                            b.stoppedAt = -1; b.aligned = false;
                            const moveD = Math.max(0, d - stopDist);
                            b.gx = b.x + (tPos.x - b.x) / Math.max(1, d) * moveD;
                            b.gy = b.y + (tPos.y - b.y) / Math.max(1, d) * moveD;
                        } else {
                            b.gx = b.x; b.gy = b.y;
                        }
                    }
                } else {
                    b.stoppedAt = -1; b.aligned = false;
                    b.gx = Math.max(150, Math.min(WIDTH - 150, b.x + face * 300));
                    b.gy = b.y;
                }
            } else if (b.order === 'hold') {
                b.gx = b.homeX; b.gy = b.homeY;
                if (Math.hypot(b.gx - b.x, b.gy - b.y) <= 25 && b.stoppedAt < 0) {
                    b.stoppedAt = w.tick; b.aligned = false;
                }
            } else if (b.order === 'rally' || b.order === 'reserve') {
                b.stoppedAt = -1; b.aligned = false;
                b.gx = b.homeX; b.gy = b.homeY;
                if (b.order === 'rally' && Math.hypot(b.homeX - b.x, b.homeY - b.y) < 60) {
                    const avgM = comps.reduce((s, c) => s + c.morale, 0) / comps.length;
                    if (avgM > 55) b.order = 'hold';
                }
            }

            // 6. 队形决定：接近 1900px 以内展开连续横队（line），不再贴脸才变横队
            for (const c of comps) {
                if (c.formation === 'square') continue;
                const sheltered = inRect(layout.farm, c.x, c.y, 20) || inWoods(c.x, c.y);
                const wantCol = !sheltered && b.order === 'advance' && d > 2100 && Math.hypot(b.gx - b.x, b.gy - b.y) > 200;
                const wantForm = wantCol ? 'column' : 'line';
                if (c.formation !== wantForm) setFormation(w, c, wantForm);
            }

            // 7. 移动营中心（以营内最慢连的速度协调推进，并检查滞后防止撕裂横队）
            const offsets = battalionOffsets(comps);
            const tx = -b.hy, ty = b.hx;
            let maxLag = 0, minSpeed = Infinity;
            for (let i = 0; i < comps.length; i++) {
                const c = comps[i];
                c.battalionSlot = i;
                const ex = b.x + tx * offsets[i], ey = b.y + ty * offsets[i];
                // Companies with their own parking bay take a separate path on the final approach.
                const parking = c.objectiveParking;
                const separate = parking && (b.order==='hold'||b.order==='reserve') &&
                    parking.battalionX===b.homeX && parking.battalionY===b.homeY && !w.logistics.isCommitted(c);
                const lag = separate ? 0 : Math.hypot(c.x - ex, c.y - ey);
                if (lag > maxLag) maxLag = lag;
                let sp = c.assaultStage === 'rush' ? PACE.footRush : b.closing ? c.speed * 1.25 : c.speed;
                if (c.formation === 'square') sp *= 0.55;
                sp *= movementAt(c.x, c.y) * (1 - PACE.maxFatiguePenalty * c.fatigue);
                if (c.formUntil > w.tick && c.formation !== 'column') sp *= 0.35;
                if (sp < minSpeed) minSpeed = sp;
            }
            const waiting = w.marchCohesion.shouldWait(w,b,comps,offsets);
            const transit = b.order === 'hold' || b.order === 'reserve' || b.order === 'rally' || (b.order === 'advance' && !tPos);
            let stepX = b.gx, stepY = b.gy;
            if (transit && !anySquare && !anyEngaged && !waiting && Math.hypot(stepX-b.x,stepY-b.y)>2) {
                const next=w.marchRoutes.waypoint(b.id,b.x,b.y,stepX,stepY,w.tick,w.companies,b.faction);
                if (next) { stepX=next.x; stepY=next.y; }
            }
            const gd = Math.hypot(stepX - b.x, stepY - b.y);
            if (gd > 2 && !anySquare && !anyEngaged && !waiting && maxLag < 130) {
                const damp = maxLag > 75 ? Math.max(0.45, (130 - maxLag) / 55) : 1;
                const step = Math.min(gd, minSpeed * damp * 6 / 30);
                b.x = Math.max(120, Math.min(WIDTH - 120, b.x + (stepX - b.x) / gd * step));
                b.y = Math.max(120, Math.min(HEIGHT - 120, b.y + (stepY - b.y) / gd * step));
            } else if (anyEngaged) {
                // 白刃中营中心跟随存活连质心
                b.x = comps.reduce((s, c) => s + c.x, 0) / comps.length;
                b.y = comps.reduce((s, c) => s + c.y, 0) / comps.length;
            }

            // 8. 侧翼暴露钩形转向（D5）
            updateFlankRefusal(w, b, comps);

            // 9. 给营内各连下发统一的目标位置、朝向与命令
            for (let i = 0; i < comps.length; i++) {
                const c = comps[i];
                if (w.logistics.isCommitted(c)) continue;
                c.order = b.order;
                const parking=c.objectiveParking;
                if(parking){
                    if((b.order==='hold'||b.order==='reserve') && b.homeX===parking.battalionX && b.homeY===parking.battalionY){
                        c.homeX=parking.x;c.homeY=parking.y;
                        continue;
                    }
                    c.objectiveParking=undefined;
                }
                if (b.order === 'assault') {
                    if (picked.company && c.forced < 0) c.forced = picked.company.id;
                }
                if (Math.abs(c.refuseAngle) > 0.1) {
                    // 钩形转向端连：以内侧端点为轴略向后折转
                    const sign = i === 0 ? -1 : 1;
                    const hw = companyHalfWidth(c);
                    const pivotOffset = offsets[i] - sign * hw;
                    const px = b.x + tx * pivotOffset, py = b.y + ty * pivotOffset;
                    const ang = Math.atan2(b.hy, b.hx) + c.refuseAngle;
                    const nhx = Math.cos(ang), nhy = Math.sin(ang);
                    const ntx = -nhy, nty = nhx;
                    c.homeX = Math.max(80, Math.min(WIDTH - 80, px + ntx * sign * hw));
                    c.homeY = Math.max(80, Math.min(HEIGHT - 80, py + nty * sign * hw));
                } else {
                    c.homeX = Math.max(80, Math.min(WIDTH - 80, b.x + tx * offsets[i]));
                    c.homeY = Math.max(80, Math.min(HEIGHT - 80, b.y + ty * offsets[i]));
                }
            }

            // 10. 检查停步整队完成（D2：全部对齐或最多等 60 tick）
            if (b.stoppedAt >= 0 && !b.aligned) {
                const allLine = comps.every(c => c.formation === 'line' && c.formUntil <= w.tick);
                const cont = measureBattalionContinuity(w, b);
                const atBays=comps.every(c=>!c.objectiveParking || Math.hypot(c.x-c.homeX,c.y-c.homeY)<24);
                const alignedNow = allLine && (cont.total === 0 || cont.ok === cont.total) && maxLag < 24;
                if (atBays && (alignedNow || w.tick - b.stoppedAt >= 60)) {
                    b.aligned = true;
                }
            }

            // 11. 同步轻步兵/来复枪散兵连
            updateBattalionSkirmishers(w, b, comps);
        }

        // ---- 营级射击操典（每帧检查，保证精确 3 tick 齐射窗口） ----
        if (wantFire) {
            fireBattalion(w, b, comps);
        }
    }
}

function pickCompanyAimTarget(w: SimWorld, c: Company, tBat: Battalion | null, fallback: Company): Company {
    if (!tBat) return fallback;
    const eComps = activeCompanies(w, tBat);
    if (!eComps.length) return fallback;
    let best = eComps[0], bd = dist(c, best);
    for (let i = 1; i < eComps.length; i++) {
        const d = dist(c, eComps[i]);
        if (d < bd) { bd = d; best = eComps[i]; }
    }
    return best;
}

function fireBattalion(w: SimWorld, b: Battalion, comps: Company[]) {
    const tBat = b.target >= 0 ? w.battalions[b.target] : null;
    const tComp = b.targetCompany >= 0 ? w.companies[b.targetCompany] : null;
    if (!tComp || tComp.alive <= 0 || tComp.status === 'gone') { b.nextFireAt = w.tick + 12; return; }
    const tPos = (tBat && activeCompanies(w, tBat).length > 0) ? tBat : tComp;
    const d = dist(b, tPos);
    const guardBat = b.kind === 'guard_grenadier';
    const maxFireDist = guardBat && b.firstVolleyCount === 0 ? 600 : RANGE.effective + 80;
    if (d > maxFireDist) { b.nextFireAt = w.tick + 12; return; }

    // C5：行进中不开火；D2：停下整队完成前不开火
    const moving = Math.hypot(b.gx - b.x, b.gy - b.y) > 28;
    if (moving || !b.aligned) { b.nextFireAt = w.tick + 6; return; }

    // 筛选本营参与横队齐射的连（不含方阵、白刃中或正在钩形转向的端连）
    const lineComps = comps.filter(c => !c.engaged && c.formation !== 'square' && c.ammo > 0 && Math.abs(c.refuseAngle) < 0.1 && c.assaultStage !== 'rush');
    if (!lineComps.length) { b.nextFireAt = w.tick + 12; return; }

    // 射击纪律：目标区域混有己方士兵（白刃中）或前方有己方友军营挡住火线则不开火
    const checkTarget = tComp;
    let mixed = false;
    const reach = Math.max(40, checkTarget.files * 7 + 20);
    w.hash.visit(checkTarget.x, checkTarget.y, reach, o => { if (!mixed && o.faction === b.faction) mixed = true; });
    if (mixed) { w.ballistics.discipline.heldFire++; b.nextFireAt = w.tick + 15; return; }

    // 筛选火线畅通的连：按连独立检查正前方有无己方一线步兵连/尚未撤回散兵挡路（避免全营被单侧友军误锁）
    const clearLineComps = lineComps.filter(c => {
        const tc = pickCompanyAimTarget(w, c, tBat, tComp);
        const cdx = tc.x - c.x, cdy = tc.y - c.y, cd = Math.max(1, Math.hypot(cdx, cdy));
        const ux = cdx / cd, uy = cdy / cd;
        for (const fc of w.companies) {
            if (fc.faction !== b.faction || (fc.battalion === b.id && fc.battalionSlot >= 0) || fc.alive <= 0 || fc.status === 'gone' || fc.status === 'rout' || fc.line === 5) continue;
            const ox = fc.x - c.x, oy = fc.y - c.y;
            const along = ox * ux + oy * uy;
            if (along <= 15 || along >= cd - 20) continue;
            const perp = Math.abs(ox * uy - oy * ux);
            if (perp < companyHalfWidth(c) + companyHalfWidth(fc) + 22) return false;
        }
        return true;
    });
    if (!clearLineComps.length) { w.ballistics.discipline.heldFire++; b.nextFireAt = w.tick + 10; return; }

    const avgMorale = clearLineComps.reduce((s, c) => s + c.morale * c.alive, 0) / Math.max(1, clearLineComps.reduce((s, c) => s + c.alive, 0));
    const totalAmmo = comps.reduce((s, c) => s + c.ammo, 0);
    const avgFatigue = clearLineComps.reduce((s, c) => s + c.fatigue, 0) / clearLineComps.length;
    const cycle = Math.round(164 * (guardBat ? 0.9 : 1) * (1 + 0.15 * avgFatigue + (w.weather === 'rain' ? 0.15 : 0)));

    const first = b.firingSince < 0;
    // C3：自由射击只在动摇、弹药 < 25% 时触发（方阵和散兵走各自逻辑）
    const isFree = !first && (avgMorale < 40 || totalAmmo < b.initialAmmo * 0.25);

    if (first) {
        // C1 首轮齐射：全营所有装填完毕且静止的射手在同一个 3 tick 窗口内开火。
        // 三列横队采用史实两列齐射操典（第一列跪姿，第二列站立开火，第三列装填递枪不开火），避免第三列误伤第二列。
        const batch: {c: Company; t: Company; shooters: Soldier[]}[] = [];
        let totalReady = 0, totalEligible = 0;
        for (const c of clearLineComps) {
            const targetForC = pickCompanyAimTarget(w, c, tBat, tComp);
            const eligible = c.members.filter(u => u.hp > 0 && u.ammo > 0 && (c.formation !== 'column' || u.slot < c.files * 2) && (c.ranks < 3 || Math.floor(u.slot / Math.max(1, c.files)) % c.ranks < 2));
            const ready = eligible.filter(u => !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick);
            totalEligible += eligible.length;
            totalReady += ready.length;
            if (ready.length) batch.push({c, t: targetForC, shooters: ready});
        }
        if (totalReady < Math.min(8, Math.ceil(totalEligible * 0.55))) {
            b.nextFireAt = w.tick + 3;
            return;
        }
        b.fireMode = 'first';
        b.firingSince = w.tick;
        b.firstVolleyCount++;
        b.smoke = Math.min(1, b.smoke + 0.16);
        for (const item of batch) {
            for (const u of item.c.members) {
                const rank = Math.floor(u.slot / Math.max(1, item.c.files)) % Math.max(1, item.c.ranks);
                if (rank === 0) u.kneelUntil = w.tick + 18;
            }
            battalionFireWindow(w, item.c, item.t, item.shooters, 'first', b.id, guardBat);
        }
        b.fireSeq = 0;
        b.nextFireAt = w.tick + cycle;
        return;
    }

    if (isFree) {
        // C3 自由射击（无 rng(0,35) 随机延迟，靠装填时间自然错开；前排跪姿避免同连误伤）
        b.fireMode = 'free';
        for (const c of clearLineComps) {
            const targetForC = pickCompanyAimTarget(w, c, tBat, tComp);
            const ready = c.members.filter(u => u.hp > 0 && u.ammo > 0 && !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick && (c.formation !== 'column' || u.slot < c.files * 2) && (c.ranks < 3 || Math.floor(u.slot / Math.max(1, c.files)) % c.ranks < 2));
            if (ready.length) {
                for (const u of c.members) if (Math.floor(u.slot / Math.max(1, c.files)) % Math.max(1, c.ranks) === 0) u.kneelUntil = w.tick + 12;
                battalionFireWindow(w, c, targetForC, ready, 'free', b.id, false);
            }
        }
        b.nextFireAt = w.tick + 6;
        return;
    }

    // C2 后续射击：英军默认分排轮射（platoon），法军默认分列轮射（rank）
    const mode = b.faction === 1 ? 'platoon' : 'rank';
    b.fireMode = mode;

    if (mode === 'platoon') {
        const idx = b.fireSeq % clearLineComps.length;
        const c = clearLineComps[idx];
        const eligible = c.members.filter(u => u.hp > 0 && u.ammo > 0 && (c.formation !== 'column' || u.slot < c.files * 2) && (c.ranks < 3 || Math.floor(u.slot / Math.max(1, c.files)) % c.ranks < 2));
        const ready = eligible.filter(u => !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick);
        // 若单连有效射手 < 28 人，合并下一相邻连齐射，保证每次排射出膛充足（>= 8 发）
        const fireList: {c: Company; ready: Soldier[]}[] = [{c, ready}];
        let sumReady = ready.length, sumEligible = eligible.length;
        let advanceSeq = 1;
        if (sumEligible < 28 && clearLineComps.length > 1) {
            const c2 = clearLineComps[(idx + 1) % clearLineComps.length];
            const e2 = c2.members.filter(u => u.hp > 0 && u.ammo > 0 && (c2.formation !== 'column' || u.slot < c2.files * 2) && (c2.ranks < 3 || Math.floor(u.slot / Math.max(1, c2.files)) % c2.ranks < 2));
            const r2 = e2.filter(u => !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick);
            fireList.push({c: c2, ready: r2});
            sumReady += r2.length; sumEligible += e2.length; advanceSeq = 2;
        }
        if (sumReady < Math.min(14, Math.ceil(sumEligible * 0.78))) {
            b.nextFireAt = w.tick + 3;
            return;
        }
        for (const item of fireList) {
            if (!item.ready.length) continue;
            const targetForC = pickCompanyAimTarget(w, item.c, tBat, tComp);
            for (const u of item.c.members) {
                const rank = Math.floor(u.slot / Math.max(1, item.c.files)) % Math.max(1, item.c.ranks);
                if (rank === 0) u.kneelUntil = w.tick + 18;
            }
            battalionFireWindow(w, item.c, targetForC, item.ready, 'platoon', b.id, false);
        }
        b.smoke = Math.min(1, b.smoke + 0.05);
        b.fireSeq = (idx + advanceSeq) % clearLineComps.length;
        b.nextFireAt = w.tick + 12; // 相邻两连间隔 12 tick（8～15 tick）
    } else {
        // 分列轮射：全营按列轮流开火，各列间隔 = 装填周期 / 列数
        const ranks = Math.max(1, clearLineComps[0].ranks);
        const rank = b.fireSeq % ranks;
        const batch: {c: Company; t: Company; shooters: Soldier[]}[] = [];
        let totalReady = 0, totalEligible = 0;
        for (const c of clearLineComps) {
            const targetForC = pickCompanyAimTarget(w, c, tBat, tComp);
            const eligible = c.members.filter(u => u.hp > 0 && u.ammo > 0 && (c.formation !== 'column' || u.slot < c.files * 2) && Math.floor(u.slot / Math.max(1, c.files)) % Math.max(1, c.ranks) === rank);
            const ready = eligible.filter(u => !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick);
            totalEligible += eligible.length;
            totalReady += ready.length;
            if (ready.length) batch.push({c, t: targetForC, shooters: ready});
        }
        if (totalEligible === 0) {
            b.fireSeq = (rank + 1) % ranks;
            b.nextFireAt = w.tick + 2;
            return;
        }
        if (totalReady < Math.min(10, Math.ceil(totalEligible * 0.7))) {
            b.nextFireAt = w.tick + 3;
            return;
        }
        for (const item of batch) {
            for (const u of item.c.members) {
                const r = Math.floor(u.slot / Math.max(1, item.c.files)) % Math.max(1, item.c.ranks);
                if (r < rank) u.kneelUntil = w.tick + 18;
            }
            battalionFireWindow(w, item.c, item.t, item.shooters, 'rank', b.id, false);
        }
        b.smoke = Math.min(1, b.smoke + 0.07);
        b.fireSeq = (rank + 1) % ranks;
        b.nextFireAt = w.tick + Math.max(18, Math.round(cycle / ranks));
    }
}
