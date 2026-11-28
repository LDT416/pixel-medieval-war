/**
 * 任务书 13 验收探针：线列步兵营与射击操典（"排队枪毙"）。
 * 用法：SEEDS=24 SCALE=2400 node tests/firefight-probe.mjs
 * 可选：REPORT=docs/shots/T13/firefight-probe.json
 *
 * 指标精确定义（与任务书 13 F 节一致）：
 * - F1 交火距离中位数：每一发火枪弹出膛时，射手到所瞄准士兵的距离（所有局合并中位数）。
 * - F2 对射间距中位数：每 30 tick 采样一次，对每一对正在互相射击的营，取两营中心沿射击方向的距离。
 * - F3 齐射集中度：同一个营在任意 3 tick 闭窗口 [t, t+2] 内开火 >= 8 发算作一次齐射；
 *      齐射集中度 = 属于齐射的火枪弹数 / 全部非散兵非方阵火枪弹数。
 * - F4 横队连续性：每 30 tick 采样一次，对每一个处于横队、命令为 hold 或已停下的营，
 *      检查所有相邻连对，满足（侧翼间隙 <= 30px 且前后错位 <= 40px）的连对数 / 全部连对数。
 * - F5 冲锋前对射时长中位数：每个营第一次下令刺刀冲锋时，距离它第一次齐射的 tick 数。
 * - F6 近距冲锋占比：发起距离 <= 400px 的刺刀冲锋次数 / 全部刺刀冲锋次数。
 * - F7 火枪杀伤占比：ballistics.stats.musket.kills / 全部阵亡。
 * - F8 白刃杀伤占比：ballistics.meleeKills / 全部阵亡。
 * - F9 火枪命中率：ballistics.stats.musket.hits / ballistics.stats.musket.sent。
 * - F10 火枪友军误伤占比：ballistics.stats.musket.friendly / ballistics.stats.musket.hits。
 * - F11 战斗时长：所有局的 endTick 平均（需 >= 14400 tick）与最短（需 >= 7200 tick）。
 * - F12 每营平均首轮齐射次数：所有局内每个营 firstVolleyCount 的均值。
 * - F14 散兵线位置占比：有轻步兵连（voltigeur）的营推进时，每 30 tick 采样，
 *      轻步兵连沿营朝向投影在营前 [300, 500]px 内的采样数 / 全部推进采样数。
 */
import { build } from 'esbuild';
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync } from 'node:fs';

const bundle = isMainThread
    ? (await build({
        stdin: { contents: "export * from './src/sim/world'; export { measureBattalionContinuity, activeCompanies } from './src/sim/battalion';", resolveDir: process.cwd() },
        bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent'
    })).outputFiles[0].text
    : workerData.bundle;

const { SimWorld, TIMEOUT, PURSUIT, measureBattalionContinuity, activeCompanies } =
    await import('data:text/javascript;base64,' + Buffer.from(bundle).toString('base64'));

function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function runSeed(seed, scale) {
    const w = new SimWorld(scale, seed);
    const shotDists = [];
    const duelDists = [];
    const batShotTicks = new Map(); // battalionId -> number[]
    let nonBatLineShots = 0;
    let contOk = 0, contTotal = 0;
    let skirmOk = 0, skirmTotal = 0;
    const batLastFire = new Map();

    while (!w.ended && w.tick < TIMEOUT + PURSUIT + 60) {
        w.step();
        for (const e of w.events) {
            if (e.type === 'fire' && !e.explosive) {
                if (typeof e.shotDist === 'number') shotDists.push(e.shotDist);
                const form = e.formation;
                if (form !== 'skirmish' && form !== 'square') {
                    const bid = e.battalion ?? -1;
                    if (bid >= 0) {
                        let list = batShotTicks.get(bid);
                        if (!list) { list = []; batShotTicks.set(bid, list); }
                        list.push(w.tick);
                        batLastFire.set(bid, w.tick);
                    } else {
                        nonBatLineShots++;
                    }
                }
            }
        }
        if (w.tick > w.deployEnd && w.tick % 30 === 0 && w.winner === null) {
            // F2 对射间距：正在互相射击的营对
            const seenPairs = new Set();
            for (const b of w.battalions) {
                if (b.firingSince < 0 || b.target < 0) continue;
                const tb = w.battalions[b.target];
                if (!tb || tb.firingSince < 0) continue;
                if (tb.target !== b.id) continue;
                if (w.tick - (batLastFire.get(b.id) ?? -999) > 180 || w.tick - (batLastFire.get(tb.id) ?? -999) > 180) continue;
                const key = b.id < tb.id ? `${b.id}:${tb.id}` : `${tb.id}:${b.id}`;
                if (seenPairs.has(key)) continue;
                seenPairs.add(key);
                const dx = tb.x - b.x, dy = tb.y - b.y;
                const proj = Math.abs(dx * b.hx + dy * b.hy);
                duelDists.push(proj > 10 ? proj : Math.hypot(dx, dy));
            }
            // F4 横队连续性
            for (const b of w.battalions) {
                const comps = activeCompanies(w, b);
                if (comps.length < 2) continue;
                const stopped = b.order === 'hold' || (b.stoppedAt >= 0 && Math.hypot(b.gx - b.x, b.gy - b.y) <= 28);
                if (!stopped) continue;
                const m = measureBattalionContinuity(w, b);
                contOk += m.ok; contTotal += m.total;
            }
            // F14 散兵线：有轻步兵连（voltigeur）的营推进时
            for (const b of w.battalions) {
                if (b.order !== 'advance' || b.stoppedAt >= 0 || !b.skirmishers.length) continue;
                if (!activeCompanies(w, b).length) continue;
                for (const sid of b.skirmishers) {
                    const sc = w.companies[sid];
                    if (!sc || sc.variant !== 'voltigeur' || sc.alive <= 0 || sc.status === 'rout' || sc.status === 'gone') continue;
                    // 若附近有敌军迫使回撤（敌步兵 <= 600 或敌骑兵 <= 900）不计入推进前出采样
                    const threatened = w.companies.some(o => o.faction !== sc.faction && o.alive > 0 && o.status !== 'gone' && o.status !== 'rout' && o.line !== 5 &&
                        Math.hypot(o.x - sc.x, o.y - sc.y) <= (o.kind === 'cuirassier' ? 900 : 600));
                    if (threatened) continue;
                    const fwd = (sc.x - b.x) * b.hx + (sc.y - b.y) * b.hy;
                    skirmTotal++;
                    if (fwd >= 300 && fwd <= 500) skirmOk++;
                }
            }
        }
    }

    // F3 齐射集中度：按营统计每发弹是否落在含 >= 8 发的 3 tick 闭窗口 [t, t+2] 内
    let volleyShots = 0, eligibleShots = nonBatLineShots;
    for (const ticks of batShotTicks.values()) {
        eligibleShots += ticks.length;
        // 统计每个 tick 的发数，再计算 3 tick 滑动和
        const byTick = new Map();
        for (const t of ticks) byTick.set(t, (byTick.get(t) ?? 0) + 1);
        for (const [t, cnt] of byTick) {
            const w0 = (byTick.get(t - 2) ?? 0) + (byTick.get(t - 1) ?? 0) + cnt;
            const w1 = (byTick.get(t - 1) ?? 0) + cnt + (byTick.get(t + 1) ?? 0);
            const w2 = cnt + (byTick.get(t + 1) ?? 0) + (byTick.get(t + 2) ?? 0);
            if (Math.max(w0, w1, w2) >= 8) volleyShots += cnt;
        }
    }

    // F5 & F6
    const firstChargeByBat = new Map();
    let chargesTotal = 0, chargesClose = 0;
    for (const ao of w.assaultOrders) {
        chargesTotal++;
        if (ao.dist <= 400) chargesClose++;
        if (ao.battalion >= 0 && !firstChargeByBat.has(ao.battalion)) {
            firstChargeByBat.set(ao.battalion, ao.sinceFirstFire);
        }
    }
    const preChargeDurations = [...firstChargeByBat.values()];

    // F12
    const bats = w.battalions.filter(b => b.line <= 2);
    const firstVolleySum = bats.reduce((s, b) => s + b.firstVolleyCount, 0);

    const deaths = w.dead[0] + w.dead[1];
    return {
        seed, scale, endTick: w.endTick > 0 ? w.endTick : w.tick, winner: w.winner,
        deaths,
        musket: { ...w.ballistics.stats.musket },
        round: { ...w.ballistics.stats.round },
        scatter: { ...w.ballistics.stats.scatter },
        shell: { ...w.ballistics.stats.shell },
        meleeKills: w.ballistics.meleeKills,
        shotDists, duelDists,
        volleyShots, eligibleShots,
        contOk, contTotal,
        skirmOk, skirmTotal,
        preChargeDurations, chargesTotal, chargesClose,
        batCount: bats.length, firstVolleySum
    };
}

if (!isMainThread) {
    for (const seed of workerData.seeds) {
        parentPort.postMessage(runSeed(seed, workerData.scale));
    }
} else {
    const N = Number(process.env.SEEDS || 24);
    const scale = Number(process.env.SCALE || 2400);
    const seeds = Array.from({ length: N }, (_, i) => (i + 1) * 7919);
    const workers = Math.max(1, Math.min(N, Number(process.env.WORKERS || Math.min(8, availableParallelism() - 1))));
    const rows = [];
    await Promise.all(Array.from({ length: workers }, (_, k) => new Promise((resolve, reject) => {
        const slice = seeds.filter((_, i) => i % workers === k);
        const w = new Worker(new URL(import.meta.url), { workerData: { seeds: slice, scale, bundle } });
        w.on('message', r => {
            rows.push(r);
            console.log(`seed ${r.seed}: ${(r.endTick / 30).toFixed(0)}s winner=${r.winner} deaths=${r.deaths} musketKills=${r.musket.kills} melee=${r.meleeKills} volley=${(100 * r.volleyShots / Math.max(1, r.eligibleShots)).toFixed(1)}% cont=${(100 * r.contOk / Math.max(1, r.contTotal)).toFixed(1)}% charges=${r.chargesTotal}`);
        });
        w.on('error', reject);
        w.on('exit', code => code ? reject(new Error('worker exit ' + code)) : resolve());
    })));
    rows.sort((a, b) => a.seed - b.seed);

    const allShotDists = [];
    const allDuelDists = [];
    const allPreCharge = [];
    let volleyShots = 0, eligibleShots = 0, contOk = 0, contTotal = 0, skirmOk = 0, skirmTotal = 0;
    let chargesTotal = 0, chargesClose = 0, batCount = 0, firstVolleySum = 0;
    let deaths = 0, meleeKills = 0, musketSent = 0, musketHits = 0, musketFriendly = 0, musketKills = 0;
    let roundKills = 0, scatterKills = 0, shellKills = 0;

    for (const r of rows) {
        for (const v of r.shotDists) allShotDists.push(v);
        for (const v of r.duelDists) allDuelDists.push(v);
        for (const v of r.preChargeDurations) allPreCharge.push(v);
        volleyShots += r.volleyShots; eligibleShots += r.eligibleShots;
        contOk += r.contOk; contTotal += r.contTotal;
        skirmOk += r.skirmOk; skirmTotal += r.skirmTotal;
        chargesTotal += r.chargesTotal; chargesClose += r.chargesClose;
        batCount += r.batCount; firstVolleySum += r.firstVolleySum;
        deaths += r.deaths; meleeKills += r.meleeKills;
        musketSent += r.musket.sent; musketHits += r.musket.hits;
        musketFriendly += r.musket.friendly; musketKills += r.musket.kills;
        roundKills += r.round.kills; scatterKills += r.scatter.kills; shellKills += (r.shell?.kills ?? 0);
    }

    const endTicks = rows.map(r => r.endTick);
    const avgEndTick = endTicks.reduce((a, b) => a + b, 0) / rows.length;
    const minEndTick = Math.min(...endTicks);

    const summary = {
        seeds: N, scale,
        F1_shotDistMedian: +median(allShotDists).toFixed(1),
        F2_duelDistMedian: +median(allDuelDists).toFixed(1),
        F3_volleyConcentrationPct: +(100 * volleyShots / Math.max(1, eligibleShots)).toFixed(2),
        F4_lineContinuityPct: +(100 * contOk / Math.max(1, contTotal)).toFixed(2),
        F5_preChargeDurationMedian: +median(allPreCharge).toFixed(1),
        F6_closeChargePct: +(100 * chargesClose / Math.max(1, chargesTotal)).toFixed(2),
        F7_musketKillSharePct: +(100 * musketKills / Math.max(1, deaths)).toFixed(2),
        F8_meleeKillSharePct: +(100 * meleeKills / Math.max(1, deaths)).toFixed(2),
        cannonKillSharePct: +(100 * (roundKills + scatterKills + shellKills) / Math.max(1, deaths)).toFixed(2),
        F9_musketHitRatePct: +(100 * musketHits / Math.max(1, musketSent)).toFixed(2),
        F10_musketFriendlyPct: +(100 * musketFriendly / Math.max(1, musketHits)).toFixed(2),
        F11_avgDurationTick: Math.round(avgEndTick),
        F11_avgDurationMin: +(avgEndTick / 1800).toFixed(2),
        F11_minDurationTick: minEndTick,
        F11_minDurationMin: +(minEndTick / 1800).toFixed(2),
        F12_avgFirstVolleysPerBattalion: +(firstVolleySum / Math.max(1, batCount)).toFixed(2),
        F14_skirmisherScreenPct: +(100 * skirmOk / Math.max(1, skirmTotal)).toFixed(2),
        counts: {
            shots: allShotDists.length, duelSamples: allDuelDists.length,
            contTotal, skirmTotal, chargesTotal, preChargeSamples: allPreCharge.length,
            deaths, musketKills, meleeKills, roundKills, scatterKills, batCount
        }
    };
    console.log('\n=== FIREFIGHT PROBE SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));

    if (process.env.REPORT) {
        mkdirSync(process.env.REPORT.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
        writeFileSync(process.env.REPORT, JSON.stringify({ summary, perSeed: rows.map(r => ({ seed: r.seed, endTick: r.endTick, winner: r.winner, deaths: r.deaths, musketKills: r.musket.kills, meleeKills: r.meleeKills, chargesTotal: r.chargesTotal, firstVolleySum: r.firstVolleySum, batCount: r.batCount })) }, null, 2));
    }
}
