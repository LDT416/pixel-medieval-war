import type { Unit } from './types';
// Only coincident moving feet drift apart. Neighbours may freely overlap.
export function softSpacing(units: Unit[]) {
    const pixels = new Set<number>();
    for (const u of units) {
        if (!u.moving || u.routed || u.tower || u.hp <= 0)
            continue;
        const key = (u.x | 0) + 8192 * (u.y | 0);
        if (pixels.has(key)) {
            u.x += (u.id % 2 ? 1 : -1) * .14;
            u.y += (u.id % 3 ? 1 : -1) * .09;
        }
        pixels.add(key);
    }
}
