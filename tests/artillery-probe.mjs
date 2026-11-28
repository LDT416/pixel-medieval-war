/**
 * 任务书 14 验收探针（第二部分）：炮兵数量、±8° 射界、炮组与榴弹炮。
 * 用法：SEEDS=24 SCALE=2400 node tests/artillery-probe.mjs
 * 可选：REPORT=docs/shots/T14/artillery-probe.json
 *
 * 指标精确定义（与任务书 14 J 节一致）：
 * - J9 每局火炮数：每方初始火炮数换算为每千人门数（guns / (start[f] / 1000)），需落在 4～6 门/千人。
 * - J10 射界外开火次数：gunFire 中硬断言 > 8° 抛错，此处为 0。
 * - J11 炮击杀伤占比：(round.kills + scatter.kills + shell.kills) / 全部阵亡，目标 15%～25%。
 * - J12 重新瞄准（reaims）与挂车转向（limberTurns）次数：每局记录，统计出现比例与均值。
 * - J13 炮组：出现炮组减员变慢（slowedReloads > 0）的局占比 >= 50%；出现炮组全灭哑火炮（silencedGuns > 0）的局占比 >= 25%。
 * - J14 榴弹炮：shell.kills > 0 且 shell.friendly / shell.hits <= 5%。
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

function runSeed(seed, scale) {
    const w = new SimWorld(scale, seed);
    const initialGuns = [0, 0];
    for (const c of w.companies) if (c.kind === 'field_cannon') initialGuns[c.faction] += c.peak;
    const perK = [initialGuns[0] / (w.start[0] / 1000), initialGuns[1] / (w.start[1] / 1000)];
    let outsideArcErrors = 0;

    while (!w.ended && w.tick < TIMEOUT + PURSUIT + 60) {
        try {
            w.step();
        } catch (err) {
            if (String(err).includes('outside ±8° arc')) { outsideArcErrors++; break; }
            throw err;
        }
    }

    const deaths = w.dead[0] + w.dead[1];
    const st = w.ballistics.stats;
    return {
        seed, initialGuns, perK, outsideArcErrors, deaths,
        round: { ...st.round },
        scatter: { ...st.scatter },
        shell: { ...st.shell },
        artilleryStats: { ...w.artilleryStats }
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
            const artyKills = r.round.kills + r.scatter.kills + r.shell.kills;
            console.log(`seed ${r.seed}: guns=${r.initialGuns} artyShare=${(100 * artyKills / Math.max(1, r.deaths)).toFixed(1)}% reaim=${r.artilleryStats.reaims} limber=${r.artilleryStats.limberTurns} slowed=${r.artilleryStats.slowedReloads} silenced=${r.artilleryStats.silencedGuns} shellKills=${r.shell.kills}`);
        });
        w.on('error', reject);
        w.on('exit', code => code ? reject(new Error('worker exit ' + code)) : resolve());
    })));
    rows.sort((a, b) => a.seed - b.seed);

    let deaths = 0, roundKills = 0, scatterKills = 0, shellKills = 0, shellHits = 0, shellFriendly = 0;
    let outsideArcErrors = 0, reaimGames = 0, limberGames = 0, slowedGames = 0, silencedGames = 0;
    let reaimTotal = 0, limberTotal = 0, shellExplosions = 0;
    const allPerK = [];

    for (const r of rows) {
        allPerK.push(r.perK[0], r.perK[1]);
        outsideArcErrors += r.outsideArcErrors;
        deaths += r.deaths;
        roundKills += r.round.kills; scatterKills += r.scatter.kills;
        shellKills += r.shell.kills; shellHits += r.shell.hits; shellFriendly += r.shell.friendly;
        if (r.artilleryStats.reaims > 0) reaimGames++;
        if (r.artilleryStats.limberTurns > 0) limberGames++;
        if (r.artilleryStats.slowedReloads > 0) slowedGames++;
        if (r.artilleryStats.silencedGuns > 0) silencedGames++;
        reaimTotal += r.artilleryStats.reaims;
        limberTotal += r.artilleryStats.limberTurns;
        shellExplosions += r.artilleryStats.shellExplosions;
    }

    const summary = {
        seeds: N, scale,
        J9_gunsPerThousandMin: +Math.min(...allPerK).toFixed(2),
        J9_gunsPerThousandMax: +Math.max(...allPerK).toFixed(2),
        J10_outsideArcFires: outsideArcErrors,
        J11_artilleryKillSharePct: +(100 * (roundKills + scatterKills + shellKills) / Math.max(1, deaths)).toFixed(2),
        J12_gamesWithReaim: `${reaimGames}/${N}`,
        J12_gamesWithLimberTurn: `${limberGames}/${N}`,
        J12_avgReaimsPerGame: +(reaimTotal / N).toFixed(2),
        J12_avgLimberTurnsPerGame: +(limberTotal / N).toFixed(2),
        J13_slowedReloadGamesPct: +(100 * slowedGames / N).toFixed(1),
        J13_silencedGunGamesPct: +(100 * silencedGames / N).toFixed(1),
        J14_shellKills: shellKills,
        J14_shellHits: shellHits,
        J14_shellFriendlyPct: +(100 * shellFriendly / Math.max(1, shellHits)).toFixed(2),
        J14_shellExplosions: shellExplosions,
        counts: { deaths, roundKills, scatterKills, shellKills }
    };
    console.log('\n=== ARTILLERY PROBE SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    if (process.env.REPORT) {
        mkdirSync(process.env.REPORT.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
        writeFileSync(process.env.REPORT, JSON.stringify({ summary, perSeed: rows }, null, 2));
    }
}
