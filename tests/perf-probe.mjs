// 性能探针：逐帧计时整场模拟。用法：SCALE=3600 SEEDS=2 MAXTICK=6000 node tests/perf-probe.mjs
// PROF=1 时额外按阶段（AI、连队、士兵、碰撞、弹道……）拆分耗时。
// 每局从 tick 0 开始，每次完整调用 step() 取一个毫秒样本。默认跑至结束（包括追击）。
// p50/p99 是升序样本下标 floor(N*p) 的值；mean 是整段循环墙钟毫秒 / 实际 tick 数。
// worstP99 取所有局中最大的已报告 p99；meanMs 是逐局报告 mean 的算术平均。
// phases 是各阶段累计毫秒 / 本局 tick 数，含部署及结算；构造和排序不计入单步样本。
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false, logLevel: 'silent' });
const { SimWorld, TIMEOUT, PURSUIT } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const scale = Number(process.env.SCALE || 3600), seeds = Number(process.env.SEEDS || 1), maxTick = Number(process.env.MAXTICK || TIMEOUT + PURSUIT);
const results = [];
for (let s = 1; s <= seeds; s++) {
    const w = new SimWorld(scale, s * 7919), times = [];
    const phases = w.profile = process.env.PROF ? {} : null;
    const t0 = performance.now();
    while (!w.ended && w.tick <= maxTick) { const a = performance.now(); w.step(); times.push(performance.now() - a); }
    const total = performance.now() - t0; times.sort((a, b) => a - b);
    const q = p => +times[Math.min(times.length - 1, Math.floor(times.length * p))].toFixed(2);
    const row = { seed: w.seed, scale, units: w.units.length, ticks: w.tick, mean: +(total / w.tick).toFixed(2), p50: q(.5), p99: q(.99), max: +times[times.length - 1].toFixed(1), winner: w.winner, dead: w.dead };
    if (phases) row.phases = Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, +(v / w.tick).toFixed(3)]));
    results.push(row); console.log(JSON.stringify(row));
}
const p99 = results.map(r => r.p99).sort((a, b) => a - b);
console.log(JSON.stringify({ scale, worstP99: p99[p99.length - 1], meanMs: +(results.reduce((a, r) => a + r.mean, 0) / results.length).toFixed(2) }));
