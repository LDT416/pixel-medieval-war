/**
 * 任务书 14 验收探针（第一部分）：骑兵菱形冲锋与战术 AI。
 * 用法：SEEDS=24 SCALE=2400 node tests/cavalry-probe.mjs
 * 可选：REPORT=docs/shots/T14/cavalry-probe.json
 *
 * 指标精确定义（与任务书 14 J 节一致）：
 * - J1 骑兵罚站占比：在全线推进开始之后（w.tick >= director.cannonadeEnd[c.faction]），每 30 tick 采样一次，
 *      对每个可用骑兵连（未溃散、未阵亡、未在休息期 w.tick >= restUntil、非参谋部），
 *      统计（速度 < 10 且 1500px 内有可攻击敌军）的采样数 / 全部采样数。
 * - J2 每骑兵连每局平均冲锋次数：每次进入 gallop/charge 阶段计为一次，总冲锋次数 / 全部参战骑兵连数。
 * - J3 冲击时为菱形队形的比例：cavalryImpacts 中 formation === 'diamond' 的次数 / 全部冲击次数。
 * - J4 冲击速度中位数：cavalryImpacts 中接触瞬间速度（speed）的中位数。
 * - J5 冲锋后重新出动比例：经历过（冲锋 -> 重整 -> 再冲锋）的骑兵连数 / 至少冲过一次锋的骑兵连数。
 * - J6 撞侧面或后背目标 300 tick 内溃散比例：arc !== 'front' 的冲击中 targetRoutedWithin300 占比。
 * - J7 正面撞已结成方阵目标溃散比例：arc === 'front' && vsSquare 的冲击中 targetRoutedWithin300 占比。
 * - J8 骑兵战术任务多样性（D 节 6 种）：24 局合计覆盖种数（需 6 种）与每局平均覆盖种数（需 >= 3 种）。
 */
import { build } from 'esbuild';
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync } from 'node:fs';

const bundle = isMainThread
    ? (await build({
        stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() },
        bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent'
    })).outputFiles[0].text
    : workerData.bundle;

const { SimWorld, TIMEOUT, PURSUIT } =
    await import('data:text/javascript;base64,' + Buffer.from(bundle).toString('base64'));

function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const ALL_TASKS = ['counter', 'flank', 'pursue', 'threaten', 'battery', 'screen'];

function runSeed(seed, scale) {
    const w = new SimWorld(scale, seed);
    let idleSamples = 0, totalSamples = 0;
    const chargedSet = new Set();
    const ralliedAfterCharge = new Set();
    const rechargedSet = new Set();

    while (!w.ended && w.tick < TIMEOUT + PURSUIT + 60) {
        w.step();
        if (w.tick > w.deployEnd && w.tick % 30 === 0 && w.winner === null) {
            for (const c of w.companies) {
                if (c.kind !== 'cuirassier' || c.line === 5 || c.alive <= 0 || c.status === 'rout' || c.status === 'gone') continue;
                if (c.chargePhase === 'gallop' || c.chargePhase === 'charge' || c.chargePhase === 'impact') {
                    if (ralliedAfterCharge.has(c.id)) rechargedSet.add(c.id);
                    chargedSet.add(c.id);
                } else if (c.chargePhase === 'rally' && chargedSet.has(c.id)) {
                    ralliedAfterCharge.add(c.id);
                }
                const startTick = Math.max(w.deployEnd, w.director.cannonadeEnd[c.faction]);
                if (w.tick < startTick || w.tick < c.restUntil) continue;
                totalSamples++;
                const speed = Math.hypot(c.vx, c.vy);
                if (speed < 10) {
                    const hasEnemy = w.companies.some(o => o.faction !== c.faction && o.alive > 0 && o.status !== 'gone' && o.line !== 5 && Math.hypot(o.x - c.x, o.y - c.y) <= 1500);
                    if (hasEnemy) idleSamples++;
                }
            }
        }
    }

    const cavCompanies = w.companies.filter(c => c.kind === 'cuirassier' && c.line !== 5);
    // 也从 cavalryChargeEvents 补充检测冲锋->重整->再冲锋
    const chargesByComp = new Map();
    for (const ev of w.cavalryChargeEvents) {
        chargesByComp.set(ev.company, (chargesByComp.get(ev.company) ?? 0) + 1);
        chargedSet.add(ev.company);
    }
    for (const [cid, cnt] of chargesByComp) {
        if (cnt >= 2 && ralliedAfterCharge.has(cid)) rechargedSet.add(cid);
    }

    const tasksPresent = ALL_TASKS.filter(t => (w.cavalryTaskCounts[t] ?? 0) > 0);
    return {
        seed,
        idleSamples, totalSamples,
        cavCount: cavCompanies.length,
        chargeCount: w.cavalryChargeEvents.length,
        impacts: w.cavalryImpacts.map(i => ({
            diamond: i.formation === 'diamond',
            speed: i.speed,
            arc: i.arc,
            vsSquare: i.vsSquare,
            routed: i.targetRoutedWithin300
        })),
        chargedCompanies: chargedSet.size,
        rechargedCompanies: rechargedSet.size,
        tasksPresent,
        taskCounts: { ...w.cavalryTaskCounts }
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
            console.log(`seed ${r.seed}: idle=${(100 * r.idleSamples / Math.max(1, r.totalSamples)).toFixed(1)}% charges=${r.chargeCount}/${r.cavCount} impacts=${r.impacts.length} tasks=[${r.tasksPresent.join(',')}]`);
        });
        w.on('error', reject);
        w.on('exit', code => code ? reject(new Error('worker exit ' + code)) : resolve());
    })));
    rows.sort((a, b) => a.seed - b.seed);

    let idleSamples = 0, totalSamples = 0, cavCount = 0, chargeCount = 0;
    let diamondImpacts = 0, totalImpacts = 0;
    const speeds = [];
    let chargedComps = 0, rechargedComps = 0;
    let flankRearTotal = 0, flankRearRouted = 0;
    let frontSquareTotal = 0, frontSquareRouted = 0;
    const unionTasks = new Set();
    let taskKindsSum = 0;

    for (const r of rows) {
        idleSamples += r.idleSamples; totalSamples += r.totalSamples;
        cavCount += r.cavCount; chargeCount += r.chargeCount;
        chargedComps += r.chargedCompanies; rechargedComps += r.rechargedCompanies;
        taskKindsSum += r.tasksPresent.length;
        for (const t of r.tasksPresent) unionTasks.add(t);
        for (const imp of r.impacts) {
            totalImpacts++;
            if (imp.diamond) diamondImpacts++;
            speeds.push(imp.speed);
            if (imp.arc !== 'front') {
                flankRearTotal++;
                if (imp.routed) flankRearRouted++;
            }
            if (imp.arc === 'front' && imp.vsSquare) {
                frontSquareTotal++;
                if (imp.routed) frontSquareRouted++;
            }
        }
    }

    const summary = {
        seeds: N, scale,
        J1_idlePct: +(100 * idleSamples / Math.max(1, totalSamples)).toFixed(2),
        J2_avgChargesPerCavCompany: +(chargeCount / Math.max(1, cavCount)).toFixed(2),
        J3_diamondImpactPct: +(100 * diamondImpacts / Math.max(1, totalImpacts)).toFixed(2),
        J4_impactSpeedMedian: +median(speeds).toFixed(1),
        J5_rechargedPct: +(100 * rechargedComps / Math.max(1, chargedComps)).toFixed(2),
        J6_flankRearRoutPct: +(100 * flankRearRouted / Math.max(1, flankRearTotal)).toFixed(2),
        J7_frontSquareRoutPct: +(100 * frontSquareRouted / Math.max(1, frontSquareTotal)).toFixed(2),
        J8_totalDistinctTasks: unionTasks.size,
        J8_distinctTaskList: [...unionTasks],
        J8_avgTasksPerGame: +(taskKindsSum / rows.length).toFixed(2),
        counts: {
            idleSamples, totalSamples, cavCount, chargeCount, totalImpacts,
            chargedComps, rechargedComps, flankRearTotal, flankRearRouted,
            frontSquareTotal, frontSquareRouted
        }
    };
    console.log('\n=== CAVALRY PROBE SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    if (process.env.REPORT) {
        mkdirSync(process.env.REPORT.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
        writeFileSync(process.env.REPORT, JSON.stringify({ summary, perSeed: rows.map(r => ({ seed: r.seed, idlePct: +(100 * r.idleSamples / Math.max(1, r.totalSamples)).toFixed(1), chargeCount: r.chargeCount, cavCount: r.cavCount, impacts: r.impacts.length, tasks: r.tasksPresent })) }, null, 2));
    }
}
