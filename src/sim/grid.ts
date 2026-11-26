import { CELL, COLS, ROWS, water, ford } from './maps';
import type { MapId, Faction, Structure } from './types';
export const indexAt = (x: number, y: number) => Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))) + Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL))) * COLS;
export class Grid {
    readonly terrain = new Uint8Array(COLS * ROWS);
    readonly blockers = new Int32Array(COLS * ROWS);
    readonly pass = [new Uint8Array(COLS * ROWS), new Uint8Array(COLS * ROWS)];
    readonly shallows = new Uint8Array(COLS * ROWS);
    constructor(map:MapId = 'twin') { for (let i = 0; i < this.terrain.length; i++)
        { const x=(i%COLS+.5)*CELL,y=(Math.floor(i/COLS)+.5)*CELL; const wet=water(x,y,map); this.shallows[i]=0; this.terrain[i]=this.shallows[i] || Number(!wet); } }
    rebuild(structures: Structure[]) {
        this.blockers.fill(0);
        for (const p of this.pass)
            p.set(this.terrain);
        for (const s of structures) {
            if (s.hp <= 0)
                continue;
            const bridge = (s.type === 'bridge' || s.type === 'pontoon')&&!s.needed;
            const xmin = Math.max(0, Math.ceil((s.x - s.w / 2) / CELL - .5)), xmax = Math.min(COLS - 1, Math.floor((s.x + s.w / 2) / CELL - .5));
            const ymin = Math.max(0, Math.ceil((s.y - s.h / 2) / CELL - .5)), ymax = Math.min(ROWS - 1, Math.floor((s.y + s.h / 2) / CELL - .5));
            for (let y = ymin; y <= ymax; y++)
                for (let x = xmin; x <= xmax; x++) {
                    const i = y * COLS + x;
                    this.blockers[i] = s.id;
                    for (const f of [0, 1] as const)
                        this.pass[f][i] = bridge || ((s.type === 'gate' || s.type === 'palisade') && f === s.faction) ? 1 : 0;
                }
        }
    }
    walk(x: number, y: number, f: Faction) { return this.pass[f][indexAt(x, y)] === 1; }
}
