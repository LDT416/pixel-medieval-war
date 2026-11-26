import { CELL, COLS, ROWS, WIDTH, HEIGHT, water, onHighGround } from './maps';
import type { Faction, MapId, Structure } from './types';
export const indexAt = (x: number, y: number) => Math.min(COLS - 1, Math.max(0, Math.floor(x / CELL))) + COLS * Math.min(ROWS - 1, Math.max(0, Math.floor(y / CELL)));
export class Grid {
    private pass = new Uint8Array(COLS * ROWS);
    readonly ground = new Int32Array(COLS * ROWS);
    constructor(map: MapId, sites: Structure[]) {
        for (let i = 0; i < this.pass.length; i++) {
            const x = (i % COLS + .5) * CELL, y = (Math.floor(i / COLS) + .5) * CELL;
            this.pass[i] = Number(!water(x, y, map));
        }
        for (const s of sites) {
            if (s.hp <= 0 || s.type === 'tree' || s.type === 'barracks')
                continue;
            for (let row = Math.max(0, Math.floor((s.y - s.h / 2) / CELL)); row < ROWS && row * CELL < s.y + s.h / 2; row++)
                for (let col = Math.max(0, Math.floor((s.x - s.w / 2) / CELL)); col < COLS && col * CELL < s.x + s.w / 2; col++) {
                    const i = col + row * COLS, p = { x: (col + .5) * CELL, y: (row + .5) * CELL };
                    if (s.type === 'bridge')
                        this.pass[i] = 1;
                    // Store the candidate site for exact rampart geometry at the feet.
                    this.ground[i] = s.id;
                }
        }
    }
    walk(x: number, y: number, _f?: Faction) { return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !!this.pass[indexAt(x, y)]; }
    heightSite(p: {
        x: number;
        y: number;
    }, sites: Map<number, Structure>) {
        const site = sites.get(this.ground[indexAt(p.x, p.y)]);
        return site && site.hp > 0 && onHighGround(site, p) ? site.id : 0;
    }
}
