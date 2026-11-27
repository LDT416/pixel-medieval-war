// 模拟层回归：随机种子对局能分出胜负、数值有限、同种子可复现、1800 人性能达标，并统计胜率分布。
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({ stdin: { contents: "export * from './src/sim/world'; export * from './src/sim/maps';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false });
const { SimWorld, WIDTH, HEIGHT, TIMEOUT, PURSUIT } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.equal(WIDTH, 6400); assert.equal(HEIGHT, 3200);

function battle(world, check = true) {
    let hits = 0, deaths = 0, explosive = 0, moved = false;
    const times = [];
    while (!world.ended && world.tick < TIMEOUT + PURSUIT + 60) {
        const t0 = performance.now(); world.step(); times.push(performance.now() - t0);
        for (const e of world.events) { if (e.type === 'hit') hits++; if (e.type === 'death') { deaths++; if (e.explosive) explosive++; } }
        if (check && world.tick % 10 === 0) for (const u of world.units) {
            assert.ok(Number.isFinite(u.x + u.y + u.vx + u.vy), 'finite');
            assert.ok(u.x >= 0 && u.x < WIDTH && u.y >= 0 && u.y < HEIGHT, 'in bounds');
            moved ||= u.moving;
        }
    }
    assert.ok(world.ended, 'battle ended');
    assert.ok(world.winner === 0 || world.winner === 1);
    const total = world.start[0] + world.start[1] + world.reinforced[0] + world.reinforced[1];
    assert.equal(world.dead[0] + world.dead[1] + world.fled[0] + world.fled[1] + world.alive[0] + world.alive[1], total);
    if (check) assert.ok(moved && hits > 0);
    times.sort((a, b) => a - b);
    return { tick: world.tick, winner: world.winner, dead: [...world.dead], fled: [...world.fled], explosive, hits, deaths,
        p99: times[Math.floor(times.length * .99)], avg: times.reduce((a, b) => a + b, 0) / times.length,
        sig: world.units.map(u => u.hp + ',' + u.x.toFixed(2)).join(';') };
}
const world = new SimWorld(1200, 7);
for (const scale of [600, 1200, 1800]) {
    world.reset(scale, 42);
    assert.deepEqual(world.alive, [scale / 2, scale / 2]);
    const a = battle(world);
    console.log(`${scale}: ${(a.tick / 30).toFixed(0)}s winner=${a.winner} dead=${a.dead} fled=${a.fled} cannon-kills=${a.explosive} avg=${a.avg.toFixed(2)}ms p99=${a.p99.toFixed(2)}ms reason=${world.reason}`);
    if(scale===1200){
        const j=world.jitter;
        console.log('jitter',j);
        assert.ok(j.flipsPerSec<.05 && j.poseTogglesPerSec<.1 && j.slotSwapsPerDeath<=2);
    }
    if (scale === 1800) assert.ok(a.p99 < 8, '1800-unit tick p99 exceeded 8 ms');
    if (scale <= 1200) { world.reset(scale, 42); assert.equal(battle(world).sig, a.sig, 'deterministic replay'); }
}
// 胜率与时长分布
const ratios=[];
const N = Number(process.env.SEEDS || 24), wins = [0, 0], lens = [], events = {};
for (let s = 1; s <= N; s++) {
    world.reset(1200, s * 7919);
    const r = battle(world, false);
    assert.ok(r.deaths>0); ratios.push(r.explosive/r.deaths);
    wins[r.winner]++; lens.push(r.tick / 30);
    const tags = [world.weather, world.generals[0].name + '/' + world.generals[1].name, world.posture.join('-')];
    if (world.reinforcement?.arrived) tags.push('援军' + world.reinforcement.faction);
    if (!world.generals[0].alive || !world.generals[1].alive) tags.push('将领阵亡');
    const big = world.news.filter(n => n.weight >= 2).length;
    for (const n of world.news) { const k = n.text.replace(/第\d+|[A-Z]连|“.*?”/g, '').slice(0, 8); events[k] = (events[k] || 0) + 1; }
    console.log(`seed ${s}: ${(r.tick / 30).toFixed(0)}s  win=${r.winner}  odds0=${world.openingOdds.toFixed(2)}  dead=${r.dead} fled=${r.fled}  headlines=${big}  ${tags.join(' ')}  | ${world.reason}`);
}
lens.sort((a, b) => a - b);
console.log('wins', wins, 'median', lens[Math.floor(N / 2)].toFixed(0) + 's', 'min', lens[0].toFixed(0), 'max', lens[N - 1].toFixed(0));
const ratio=ratios.reduce((a,b)=>a+b,0)/N;
console.log('cannon share',ratio.toFixed(4));
if(N>=60){assert.ok(ratio>=.22 && ratio<=.38);assert.ok(wins.every(w=>w/N>=.4 && w/N<=.6));assert.ok(lens[0]>=70 && lens[Math.floor(N/2)]>=120 && lens[Math.floor(N/2)]<=200);}
if (process.env.VERBOSE) console.log(events);
console.log('Battle assertions passed.');
