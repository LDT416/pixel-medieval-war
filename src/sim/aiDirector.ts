import type { SimWorld } from './world';
import { rankFire } from './config';
import type { Kind } from './types';
const rotation: Kind[] = ['line_infantry', 'guard_grenadier', 'line_infantry', 'field_cannon', 'cuirassier', 'bannerman'];
export function campaignTick(w: SimWorld) {
    if (w.tick % 30 !== 0)
        return;
    for (const f of [0, 1] as const) {
        const realm = w.realms[f], enemyAI = f !== w.player;
        if (w.mode === 'lord')
            realm.gold = Math.min(800, realm.gold + (enemyAI ? { easy: 6, normal: 9, brutal: 13 }[w.difficulty] : 9));
        if (w.mode === 'lord' && w.tick > 0 && w.tick % 240 === 0 && w.units.filter(u => u.faction === f && u.hp > 0).length < 156) {
            const kind = rotation[realm.rosterIndex % rotation.length];
            if (w.recruit(f, kind))
                realm.rosterIndex++;
        }
        if (enemyAI && w.mode === 'lord') {
            const fort = w.keep(f)!;
            const danger = w.units.some(u => u.faction !== f && Math.abs(u.x - fort.x) < 820 && Math.abs(u.y - fort.y) < 550);
            if (danger) {
                const guard = [...w.groups.values()].find(g => g.faction === f && rankFire(g.kind) && g.state === 'assemble');
                if (guard)
                    w.post(guard, fort);
            }
        }
        if (realm.order === 'auto' || realm.order === 'charge') {
            const ready = [...w.groups.values()].filter(g => g.faction === f && g.state === 'assemble' && g.readyAt <= w.tick);
            if (ready.length >= 2 || ready.some(g => w.tick - g.readyAt >= 210) || realm.order === 'charge') {
                for (const g of ready) {
                    g.state = 'advance';
                    g.manual = false;
                    g.point = null;
                }
                if (ready.length)
                    realm.wave++;
            }
        }
    }
}
