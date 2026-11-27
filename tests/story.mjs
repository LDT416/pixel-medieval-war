import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false });
const { SimWorld } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const w = new SimWorld(1200, Number(process.argv[2] || 6 * 7919));
while (!w.ended) w.step();
const t = n => (n / 30 | 0) + 's';
console.log(w.weather, w.generals.map(g => g.name + g.trait), w.posture, w.layout.ridgeOwner, !!w.layout.farm, 'odds', w.openingOdds.toFixed(2));
for (const n of w.news) console.log(t(n.tick).padStart(5), n.weight, n.faction, n.text);
console.log('winner', w.winner, w.reason, t(w.tick));
