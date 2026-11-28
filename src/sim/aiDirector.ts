import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type { Company, Faction } from './arenaTypes';
import type { SimWorld } from './world';
import { inRect, inWoods, layout, WIDTH } from './maps';
import { MUSKET, dist } from './combat';
import { CommandPlan } from './commandPlan';
import { activeCompanies, meetsAssaultConditions, recentLossFraction, isFlankOrRear } from './battalion';
import { evaluateCavalryAI } from './cavalry';

const CANNONADE = { aggressive: 330, cunning: 560, steadfast: 650, cautious: 900 };
const ASSAULT = { aggressive: 58, cunning: 50, steadfast: 44, cautious: 36 };
const EAGER = { aggressive: 1, cunning: 1.1, steadfast: 1.7, cautious: 1.9 };

/** 两军各自的“总司令”：决定炮火准备多久、何时全线推进、骑兵何时出击、近卫军何时押上。 */
export class Director {
    readonly plan=new CommandPlan();
    cannonadeEnd: [number, number] = [0, 0];
    secondWave: [number, number] = [0, 0];
    advanced: [boolean, boolean] = [false, false];
    reset(w: SimWorld) {
        this.plan.reset();
        for (const f of [0, 1] as const) {
            const trait = w.generals[f].trait;
            this.cannonadeEnd[f] = w.posture[f] === 'attack' ? w.deployEnd+CANNONADE[trait] + w.rng.int(0, 240) : 0;
            this.secondWave[f] = 0;
            this.advanced[f]=false;
        }
    }
    update(w: SimWorld) {
        for (const f of [0, 1] as const) if (!w.broken[f] && w.legacySide!==f){
            if((w.tick-w.deployEnd-1)%300===0)this.plan.review(w,f);
            this.army(w,f);
        }
    }
    private army(w: SimWorld, f: Faction) {
        const g = w.generals[f], trait = g.trait, attack = w.posture[f] === 'attack', face = f ? -1 : 1;
        const own = w.companies.filter(c => c.faction === f && c.alive>0 && c.status !== 'gone' && !w.logistics.isCommitted(c) && !w.lostSectors[f][c.sector]);
        const seen=w.sight.visibleToArmy(w,f);
        const plan=w.plans[f];
        const free=(c:Company)=>!this.plan.assigned(c,w.tick) && !plan.reserve.includes(c.id);
        const leader = g.alive ? g.title + g.name : '代理指挥官';
        // ---- 全线推进（按营下发，保持横队整体性） ----
        const issueBattalionOrder = (b: typeof w.battalions[number], order: 'advance' | 'hold' | 'assault', target = -1) => {
            b.order = order;
            if (order === 'advance') b.closing = false;
            for (const id of b.companies) {
                const c = w.companies[id];
                if (c && c.alive > 0 && c.status !== 'rout' && c.status !== 'gone') w.logistics.dispatch(w, c, order, target);
            }
        };
        if (attack && !this.advanced[f] && w.tick >= this.cannonadeEnd[f]) {
            this.advanced[f] = true; this.secondWave[f] = w.tick + 1800;
            let x = 0, y = 0, n = 0;
            for (const b of w.battalions) if (b.faction === f && b.line === 0 && !w.lostSectors[f][b.sector]) {
                issueBattalionOrder(b, 'advance'); x += b.x; y += b.y; n++;
            }
            for (const c of own) if (c.battalion < 0 && c.line === 0 && free(c)) { w.logistics.dispatch(w,c,'advance'); x += c.x; y += c.y; n++; }
            w.say(`${leader}下令：全线推进！`, f, n ? x / n : WIDTH / 2, n ? y / n : 1600, 2);
        }
        if (this.secondWave[f] && w.tick >= this.secondWave[f]) {
            this.secondWave[f] = 0;
            for (const b of w.battalions) if (b.faction === f && b.line === 1 && (b.order === 'hold' || b.order === 'reserve') && !w.lostSectors[f][b.sector]) {
                issueBattalionOrder(b, 'advance');
            }
            for (const c of own) if (c.battalion < 0 && c.line === 1 && (c.order === 'hold' || c.order === 'reserve') && free(c)) w.logistics.dispatch(w,c,'advance');
        }
        // 梯次投入：二线营在中盘投入，近卫营与翼侧未交火营在深盘投入总攻
        if (w.tick > w.deployEnd + 2700 && w.tick % 240 === 1) {
            const anyFrontEngaged = w.battalions.some(b => b.faction === f && b.firingSince >= 0);
            if (anyFrontEngaged || w.tick > w.deployEnd + 4500) {
                for (const b of w.battalions) if (b.faction === f && !w.lostSectors[f][b.sector]) {
                    const dueLine1 = b.line === 1 && (b.order === 'reserve' || b.order === 'hold');
                    const dueGuard = b.line === 2 && w.tick > w.deployEnd + 4800 && (b.order === 'reserve' || b.order === 'hold');
                    const dueIdleFront = b.line === 0 && b.order === 'hold' && b.firstVolleyCount === 0 && w.tick > w.deployEnd + 3600;
                    if (!dueLine1 && !dueGuard && !dueIdleFront) continue;
                    const comps = activeCompanies(w, b);
                    if (comps.length && comps.reduce((s, c) => s + c.morale, 0) / comps.length > 46) {
                        issueBattalionOrder(b, 'advance');
                        if (b.line === 2) w.say(`${leader}投入${b.name}参加总攻！`, f, b.x, b.y, 2);
                    }
                }
            }
        }
        // 攻方：重整好或待命的营再次投入进攻。
        if (attack && this.advanced[f] && !this.secondWave[f] && w.tick % 150 === 1) {
            for (const b of w.battalions) if (b.faction === f && (b.line <= 2 || b.line === 7) && (b.order === 'hold' || b.order === 'reserve') && !w.lostSectors[f][b.sector]) {
                const comps = activeCompanies(w, b);
                if (comps.length && comps.reduce((s, c) => s + c.morale, 0) / comps.length > 50) issueBattalionOrder(b, 'advance');
            }
            for (const c of own) if (c.battalion < 0 && free(c) && (c.line <= 1 || c.line === 7) && c.order === 'hold' && c.status === 'steady' && c.morale > 50 && !isMounted(c)) w.logistics.dispatch(w,c,'advance');
        }
        // 守方：敌军疲态尽显或久战后转入全线反击。
        if (!attack && w.tick > 3600 && w.tick % 90 === 1) {
            const visiblyWorn=seen.length>0 && seen.every(c=>c.status==='rout' || c.morale<38);
            if (visiblyWorn || w.tick > 16500) {
                w.posture[f] = 'attack'; this.advanced[f] = true;
                for (const b of w.battalions) if (b.faction === f && !w.lostSectors[f][b.sector] && activeCompanies(w, b).length) issueBattalionOrder(b, 'advance');
                for (const c of own) if (c.battalion < 0 && free(c) && c.line !== 6 && c.line !== 5 && c.line !== 4 && !isMounted(c) && c.status !== 'rout') w.logistics.dispatch(w,c,'advance');
                w.say(f ? `${leader}挥舞帽子：全线前进！` : `${leader}下令：全线反击！`, f, w.frontline().x, w.frontline().y, 3);
            }
        }
        // ---- 刺刀冲锋（严格执行任务书 13 D4：必须 <= 400px 且满足 5 条件之一） ----
        if (!w.noAssault[f]) {
            for (const b of w.battalions) {
                if (b.faction !== f || w.lostSectors[f][b.sector]) continue;
                const comps = activeCompanies(w, b);
                if (!comps.length) continue;
                if (b.order === 'assault' || b.order === 'rally' || b.order === 'reserve') continue;
                if (comps.some(c => c.engaged || c.formation === 'square' || w.tick < c.assaultReady)) { b.closing = false; continue; }
                const avgMorale = comps.reduce((s, c) => s + c.morale, 0) / comps.length;
                if (avgMorale < 42) { b.closing = false; continue; }
                const tComp = b.targetCompany >= 0 ? w.companies[b.targetCompany] : undefined;
                const tBat = b.target >= 0 ? w.battalions[b.target] : null;
                if (!tComp || tComp.faction === f || tComp.alive <= 0 || tComp.status === 'gone' || tComp.status === 'rout' || tComp.line === 5 || isMounted(tComp)) { b.closing = false; continue; }
                const tPos = (tBat && activeCompanies(w, tBat).length > 0) ? tBat : tComp;
                const d = dist(b, tPos);
                const cond = meetsAssaultConditions(w, b, tBat, tComp);
                // 正常交战要求至少打过首轮齐射后再压近或冲锋（除非已被迫贴脸 <= 220px 或侧后突袭）
                const readyToCharge = b.firstVolleyCount >= 1 || d <= 220 || isFlankOrRear(b, tBat ?? tComp);
                if (cond && readyToCharge && d <= 400) {
                    b.order = 'assault'; b.closing = false;
                    const firstTime = b.firstChargeAt < 0;
                    if (firstTime) b.firstChargeAt = w.tick;
                    w.assaultOrders.push({tick: w.tick, battalion: b.id, company: comps[0].id, dist: d, sinceFirstFire: b.firingSince >= 0 ? w.tick - b.firingSince : 0});
                    for (const c of comps) {
                        c.order = 'assault'; c.forced = tComp.id; c.charges++;
                        c.freshAtStart = tComp.alive === tComp.peak && tComp.morale > 60;
                    }
                    if (b.kind === 'guard_grenadier' || w.rng.next() < 0.35) w.say(`${b.name}上刺刀，全营冲锋！`, f, b.x, b.y, b.kind === 'guard_grenadier' ? 2 : 1);
                } else if (cond && readyToCharge && d > 400 && d <= 1250 && (b.firingSince >= 0 || b.order === 'advance')) {
                    // 满足优势条件但尚未进入 400px：以横队压近至 340px，进入 400px 内再发起刺刀冲锋
                    b.closing = true;
                    if (b.order === 'hold') { b.order = 'advance'; for (const c of comps) c.order = 'advance'; }
                } else {
                    b.closing = false;
                }
            }
            // 未编入营的独立步兵连（不含农庄守军与散兵连）
            for (const c of own) {
                if (c.battalion >= 0 || c.status !== 'steady' || (!isLineTroop(c) && !isGuard(c)) || c.line === 6 || c.formation === 'skirmish') continue;
                if (w.tick < c.assaultReady || c.engaged || c.formation === 'square') continue;
                if (c.order !== 'advance' && c.order !== 'hold') continue;
                const t = c.target >= 0 ? w.companies[c.target] : undefined;
                if (!t || t.faction === f || t.alive <= 0 || t.status === 'gone' || t.status === 'rout' || t.line === 5 || isMounted(t)) continue;
                const d = dist(c, t);
                if (d > 400) continue;
                const cond = t.morale < 40 || t.status === 'shaken' || recentLossFraction(w, t) > 0.15 || t.ammo <= 0 || isFlankOrRear(c, t) || (c.firingSince >= 0 && w.tick - c.firingSince >= 900 && c.morale >= t.morale + 15);
                if (cond) {
                    c.order = 'assault'; c.forced = t.id; c.charges++;
                    w.assaultOrders.push({tick: w.tick, battalion: -1, company: c.id, dist: d, sinceFirstFire: c.firingSince >= 0 ? w.tick - c.firingSince : 0});
                    c.freshAtStart = t.alive === t.peak && t.morale > 60;
                    if (isGuard(c) || w.rng.next() < .22) w.say(`${c.name}上刺刀，冲锋！`, f, c.x, c.y, isGuard(c) ? 2 : 1);
                }
            }
        }
        // ---- 骑兵战术任务评估（任务书 14 D 节：去掉 60% 跳过，6 种任务择优执行） ----
        evaluateCavalryAI(w, f, own, seen);
        // ---- 参谋部跟随主力 ----
        const staff = w.companies[g.company];
        if (staff && staff.status !== 'gone' && staff.status !== 'rout') {
            let x = 0, y = 0, n = 0;
            for (const c of own) if ((c.line === 0 || c.line === 1) && c.status !== 'rout') { x += c.x; y += c.y; n++; }
            if (n) { staff.homeX = Math.min(WIDTH - 80, Math.max(80, x / n - face * 1080)); staff.homeY = y / n; }
        }
    }
}
