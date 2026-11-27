// 刺刀冲锋结局统计：每次步兵连进入 assault，20 秒后比较双方损失与谁先溃散。
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false });
const { SimWorld } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const N = Number(process.env.SEEDS || 8), w = new SimWorld(1200, 1);
const res = { assaults: 0, targetBroke: 0, attackerBroke: 0, neither: 0, atkLoss: 0, defLoss: 0, holdKills: 0, assaultKills: 0, holdTicks: 0, assaultTicks: 0 };
for (let s = 1; s <= N; s++) {
    w.reset(1200, s * 7919);
    const open = new Map(), prevOrder = new Map(), prevKills = new Map();
    while (!w.ended) {
        w.step();
        for (const c of w.companies) {
            if (c.kind !== 'line_infantry' && c.kind !== 'guard_grenadier') continue;
            const k = c.kills - (prevKills.get(c.id) ?? 0); prevKills.set(c.id, c.kills);
            if (c.status !== 'rout' && c.status !== 'gone') {
                if (c.order === 'assault') { res.assaultKills += k; res.assaultTicks++; }
                else if (c.order === 'hold' || c.order === 'advance') { res.holdKills += k; res.holdTicks++; }
            }
            if (c.order === 'assault' && prevOrder.get(c.id) !== 'assault' && c.forced >= 0) {
                const t = w.companies[c.forced];
                open.set(c.id, { t, start: w.tick, a0: c.alive, t0: t.alive });
            }
            prevOrder.set(c.id, c.order);
            const o = open.get(c.id);
            if (o && (w.tick - o.start >= 600 || w.ended)) {
                open.delete(c.id); res.assaults++;
                const tb = o.t.status === 'rout' || o.t.status === 'gone', ab = c.status === 'rout' || c.status === 'gone';
                if (tb && !ab) res.targetBroke++; else if (ab) res.attackerBroke++; else res.neither++;
                res.atkLoss += 1 - c.alive / o.a0; res.defLoss += 1 - o.t.alive / Math.max(1, o.t0);
            }
        }
    }
}
console.log(JSON.stringify({ ...res, atkLoss: (res.atkLoss / res.assaults).toFixed(3), defLoss: (res.defLoss / res.assaults).toFixed(3),
    killsPerSecHolding: (res.holdKills / res.holdTicks * 30).toFixed(4), killsPerSecAssaulting: (res.assaultKills / res.assaultTicks * 30).toFixed(4) }));
