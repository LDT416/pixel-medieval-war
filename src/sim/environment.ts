import { UNITS } from './config';
import { attack, hit, distanceTo } from './combat';
import type { SimWorld } from './world';
import { indexAt } from './grid';
import type { Faction, Kind, Point, Unit } from './types';
export function ignite(w: SimWorld, p: Point, faction: Faction, kind: Kind, spread = 3) {
    const x = Math.floor(p.x / 40) * 40 + 20, y = Math.floor(p.y / 40) * 40 + 20;
    if (!w.grid.terrain[indexAt(x, y)] && !w.grid.blockers[indexAt(x, y)])
        return;
    const old = w.fires.find(a => a.x === x && a.y === y);
    if (old) {
        old.end = Math.max(old.end, w.tick + 120);
        return;
    }
    w.fires.push({ x, y, faction, kind, end: w.tick + 150, spread });
}
export function environmentTick(w: SimWorld) {
    for (const b of w.barrels)
        if (b.due === w.tick) {
            w.events.push({ type: 'impact', x: b.x, y: b.y, kind: 'sapper', power: 10 });
            for (const s of w.structures)
                if (s.hp > 0 && s.faction !== b.faction && distanceTo(b, s) < 95)
                    w.damageStructure(s, 760, b.faction, 'sapper');
            w.hash.visit(b.x, b.y, 78, u => { if (u.faction !== b.faction)
                hit(w, u, b.faction, 'sapper', 85, (u.x - b.x) / 78, (u.y - b.y) / 78, 15); });
            ignite(w, b, b.faction, 'sapper');
        }
    w.barrels = w.barrels.filter(b => b.due > w.tick);
    w.fires = w.fires.filter(a => a.end > w.tick);
    if (w.tick % 15 === 0)
        for (const a of [...w.fires]) {
            w.hash.visit(a.x, a.y, 40, u => { if (!u.tower)
                hit(w, u, a.faction, a.kind, 12, 0, 0); });
            for (const s of w.structures)
                if (s.hp > 0 && distanceTo(a, s) < 42 && !['rock', 'mine', 'bridge', 'wall', 'lowwall'].includes(s.type)) {
                    w.damageStructure(s, 29, a.faction, a.kind);
                    if (a.spread > 0 && w.tick % 45 === 0) {
                        for (const [dx, dy] of [[0, 40], [0, -40], [40, 0], [-40, 0]]) {
                            const p = { x: a.x + dx, y: a.y + dy };
                            if (w.structures.some(n => n.hp > 0 && distanceTo(p, n) < 26 && !['mine', 'rock', 'bridge', 'wall', 'lowwall'].includes(n.type)))
                                ignite(w, p, a.faction, a.kind, a.spread - 1);
                        }
                    }
                }
        }
    if (w.tick % 15 === 0)
        w.drops = w.drops.filter(d => {
            let collector: Unit | undefined;
            w.hash.visit(d.x, d.y, 26, u => { if (u.hp > 0 && !u.tower && !collector)
                collector = u; });
            if (!collector)
                return true;
            w.realms[collector.faction][d.resource] += d.amount;
            return false;
        });
}
