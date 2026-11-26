import { WIDTH, HEIGHT } from '../sim/maps';
import type { SimEvent, Faction } from '../sim/types';
import { banner } from './banners';
export type Mark = [
    number,
    number,
    number,
    number,
    string
];
export class DecalLayer {
    canvas = document.createElement('canvas');
    ctx: CanvasRenderingContext2D;
    composite?: CanvasRenderingContext2D;
    marks: Mark[] = [];
    constructor() { this.canvas.width = WIDTH; this.canvas.height = HEIGHT; this.ctx = this.canvas.getContext('2d')!; }
    clear() { this.marks = []; this.composite = undefined; this.ctx.clearRect(0, 0, WIDTH, HEIGHT); }
    restore(marks: Mark[]) { this.clear(); for (const m of marks)
        this.record(m); }
    private record(m: Mark) {
        this.marks.push(m);
        const [x, y, w, h, color] = m;
        for (const ctx of [this.ctx, this.composite]) {
            if (!ctx)
                continue;
            if (color === 'flag') {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.translate(x, y);
                ctx.rotate(w ? -.98 : 1.04);
                ctx.drawImage(banner(w as Faction, 2), -3, -49, 36, 50);
                ctx.fillStyle = '#531920';
                ctx.fillRect(7, -29, 9, 4);
                ctx.fillRect(14, -27, 4, 7);
                ctx.restore();
            }
            else {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, w, h);
            }
        }
    }
    stamp(x: number, y: number, size: number, color: string, h = size) { this.record([Math.round(x), Math.round(y), size, h, color]); }
    fallen(x: number, y: number, f: Faction) { this.record([Math.round(x), Math.round(y), f, 0, 'flag']); }
    event(e: SimEvent) {
        if (e.type === 'death') {
            this.stamp(e.x - 6, e.y - 2, 12, '#4b2223', 5);
            this.stamp(e.x - 4, e.y - 4, 8, '#542324', 8);
            this.stamp(e.x + 2, e.y, 7, '#602829', 4);
        }
        else if (e.type === 'impact') {
            this.stamp(e.x - 16, e.y - 6, 32, '#35342c', 12);
            this.stamp(e.x - 11, e.y - 9, 23, '#302e28', 17);
            this.stamp(e.x - 7, e.y - 4, 16, '#262521', 9);
        }
        else if (e.type === 'collapse' && e.structure) {
            const s = e.structure;
            if (s.type === 'bridge' || s.type === 'pontoon') {
                for (const side of [-1, 1]) {
                    this.stamp(s.x + side * (s.w / 2 - 7) - 5, s.y - s.h / 2, 10, '#4c4439', Math.round(s.h));
                    this.stamp(s.x + side * (s.w / 2 - 10), s.y, 10, '#3b3531', 12);
                }
                return;
            }
            if (s.type === 'tree') {
                this.stamp(s.x - 5, s.y, 12, '#382f23', 7);
                this.stamp(s.x - 3, s.y - 2, 8, '#726047', 5);
                return;
            }
            for (let i = 0; i < 54; i++)
                this.stamp(s.x + ((i * 47 % 61) / 61 - .5) * s.w, s.y + ((i * 19 % 59) / 59 - .5) * s.h, 6 + i % 9, ['#393933', '#4d4b41', '#595448'][i % 3], 4 + i % 5);
        }
    }
}
