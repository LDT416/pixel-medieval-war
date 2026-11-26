import type { Unit } from './types';
import type { SpatialHash } from './spatialHash';
import type { Grid } from './grid';
import { WIDTH, HEIGHT } from './maps';

const radiusOf = (u: Unit) => u.kind === 'field_cannon' ? 15 : u.kind === 'cuirassier' ? 9 : 5.2;

// 恰到好处的轻柔和体积：平时可紧密肩并肩不鬼畜，过桥时真实挤成一团涌过石拱桥！
export function softSpacing(units: Unit[], hash: SpatialHash, grid: Grid) {
    for (const u of units) {
        if (u.hp <= 0 || u.tower)
            continue;
        if (u.kind === 'field_cannon' && u.pose !== 'march1' && u.pose !== 'march2')
            continue;
        const r1 = radiusOf(u);
        let pushX = 0, pushY = 0;
        hash.visit(u.x, u.y, r1 + 15, other => {
            if (other.id === u.id || other.hp <= 0 || other.tower)
                return;
            const r2 = radiusOf(other), minDist = r1 + r2;
            const dx = u.x - other.x, dy = u.y - other.y;
            const d2 = dx * dx + dy * dy;
            if (d2 >= minDist * minDist)
                return;
            if (d2 < .01) {
                pushX += (u.id > other.id ? 1 : -1) * .6;
                pushY += ((u.id % 3) - 1) * .4;
                return;
            }
            const d = Math.sqrt(d2), overlap = (minDist - d) * .32;
            pushX += (dx / d) * overlap;
            pushY += (dy / d) * overlap;
        });
        if (!pushX && !pushY)
            continue;
        const resist = (u.pose === 'reload' || u.pose === 'aim') ? .22 : 1;
        pushX *= resist;
        pushY *= resist;
        const maxStep = 2.2;
        const mag = Math.hypot(pushX, pushY);
        if (mag > maxStep) {
            pushX = pushX / mag * maxStep;
            pushY = pushY / mag * maxStep;
        }
        const nx = Math.max(4, Math.min(WIDTH - 4, u.x + pushX));
        const ny = Math.max(4, Math.min(HEIGHT - 4, u.y + pushY));
        if (grid.walk(nx, u.y))
            u.x = nx;
        if (grid.walk(u.x, ny))
            u.y = ny;
    }
}
