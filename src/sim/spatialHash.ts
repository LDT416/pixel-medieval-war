import type { Unit } from './types';
const SIZE = 64, STRIDE = 64;
export class SpatialHash {
    private buckets: Unit[][] = Array.from({ length: STRIDE * 36 }, () => []);
    rebuild(units: Unit[]) { for (const b of this.buckets)
        b.length = 0; for (const u of units)
        if (u.hp > 0)
            this.buckets[(Math.floor(u.y / SIZE) * STRIDE + Math.floor(u.x / SIZE))]?.push(u); }
    visit(x: number, y: number, r: number, fn: (u: Unit) => void) {
        const minX = Math.max(0, Math.floor((x - r) / SIZE)), maxX = Math.min(59, Math.floor((x + r) / SIZE));
        const top = Math.max(0, Math.floor((y - r) / SIZE)), bottom = Math.min(33, Math.floor((y + r) / SIZE));
        for (let row = top; row <= bottom; row++)
            for (let col = minX; col <= maxX; col++)
                for (const u of this.buckets[row * STRIDE + col])
                    if (u.hp > 0 && (u.x - x) ** 2 + (u.y - y) ** 2 <= r * r)
                        fn(u);
    }
}
