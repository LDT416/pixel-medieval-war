// 攻守平衡探针：统计守方胜率、刺刀冲锋成败、方阵与横队来回切换。
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false });
const { SimWorld } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const N = Number(process.env.SEEDS || 20), w = new SimWorld(1200, 1);
let defWins = 0, defGames = 0, meet = 0, assaults = 0, broke = 0, flips = 0, quick = 0, cavCycles = 0, engagedFlips = 0, worst = 0;
for (let s = 1; s <= N; s++) {
    w.reset(1200, s * 7919);
    const p0 = [...w.posture];
    const last = new Map(), lastChange = new Map(), cav = new Map(), eng = new Map(), hist = new Map();
    while (!w.ended) {
        w.step();
        for (const c of w.companies) {
            if (c.status === 'gone') continue;
            const was = last.get(c.id);
            if (was && was !== c.formation && (was === 'square' || c.formation === 'square')) {
                flips++; if (w.tick - (lastChange.get(c.id) ?? -1e9) < 120) quick++; lastChange.set(c.id, w.tick);
                const h = (hist.get(c.id) ?? []).filter(t => t > w.tick - 900); h.push(w.tick); hist.set(c.id, h); worst = Math.max(worst, h.length);
            }
            last.set(c.id, c.formation);
            if (c.kind === 'cuirassier') { if (cav.get(c.id) === 'rally' && c.order === 'charge') cavCycles++; cav.set(c.id, c.order); }
            else { const e = eng.get(c.id); if (e !== undefined && e !== c.engaged) engagedFlips++; eng.set(c.id, c.engaged); }
        }
    }
    for (const n of w.news) { if (n.text.includes('上刺刀')) assaults++; if (n.text.includes('刺刀面前崩溃')) broke++; }
    const d = p0.indexOf('defend');
    if (d < 0) meet++; else { defGames++; if (w.winner === d) defWins++; }
    console.log(`seed ${s} posture=${p0.join('-')} winner=${w.winner} ${(w.tick / 30) | 0}s`);
}
console.log(JSON.stringify({ seeds: N, defenderWinRate: (defWins / defGames).toFixed(2), defGames, meetingGames: meet,
    assaultNews: assaults, bayonetBreaks: broke, squareLineFlips: flips, flipsWithin4s: quick, worstFlipsOneCompanyIn30s: worst,
    cavRallyThenRecharge: cavCycles, infantryEngagedToggles: engagedFlips }));
