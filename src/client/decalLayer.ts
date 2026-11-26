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
    inferno = true;
    constructor() { this.canvas.width = WIDTH; this.canvas.height = HEIGHT; this.ctx = this.canvas.getContext('2d')!; }
    clear() { this.marks = []; this.composite = undefined; this.ctx.clearRect(0, 0, WIDTH, HEIGHT); }
    restore(marks: Mark[]) { this.clear(); for (const m of marks)
        this.record(m); }
    private h(x: number, y: number, salt: number) {
        let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt, 1442695041)) | 0;
        n = (n ^ (n >>> 13)) * 1274126177;
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    }
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
    stamp(x: number, y: number, size: number, color: string, h = size) { this.record([Math.round(x), Math.round(y), Math.max(2, Math.round(size)), Math.max(2, Math.round(h)), color]); }
    stampGib(x: number, y: number, size: number, color: string, bloody = true) {
        const s = Math.max(3, Math.round(size));
        if (bloody)
            this.stamp(x - 1, y, s + 2, '#5e0b13', Math.max(2, s - 1));
        this.stamp(x, y, s, color, Math.max(2, Math.min(4, s)));
    }
    fallen(x: number, y: number, f: Faction) { this.record([Math.round(x), Math.round(y), f, 0, 'flag']); }
    event(e: SimEvent) {
        const dense = this.inferno;
        if (e.type === 'death') {
            const r1 = this.h(e.x, e.y, 1), r2 = this.h(e.x, e.y, 2);
            // 多层浓稠血泊基底（整像素贴死地图，永不闪烁）
            const pw = dense ? 16 + Math.floor(r1 * 8) : 12;
            const ph = dense ? 7 + Math.floor(r2 * 4) : 5;
            this.stamp(e.x - pw / 2, e.y - ph / 2, pw, '#470a11', ph);
            this.stamp(e.x - pw * .36, e.y - ph * .55, pw * .72, '#7d0d17', ph * .95);
            this.stamp(e.x - 3 + (r1 - .5) * 6, e.y - 2, dense ? 8 : 5, '#a81522', dense ? 5 : 4);
            // 定向喷溅血带（沿子弹/武器冲量拖出血痕）
            const dx = e.dx ?? (r1 > .5 ? 1 : -1), dy = e.dy ?? (r2 - .5) * .6;
            const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
            const streak = dense ? 6 : 3;
            for (let i = 1; i <= streak; i++) {
                const dist = 5 + i * (dense ? 5.2 : 4.2);
                const jitter = (this.h(e.x, e.y, 10 + i) - .5) * 7;
                this.stamp(e.x + ux * dist - uy * jitter, e.y + uy * dist * .6 + ux * jitter * .4, Math.max(3, 7 - i), i < 3 ? '#7c0d16' : '#530b12', Math.max(2, 5 - Math.floor(i / 2)));
            }
            // 尸体碎肉、白骨、红蓝破衣/银甲与折断武器永久烘焙到地表贴图
            const cloth = e.faction === 1 ? '#9e2022' : '#20478e';
            const armored = e.kind === 'plate_knight' || e.kind === 'halberdier' || e.kind === 'heavy_lancer' || e.kind === 'shieldman';
            const gibs = dense ? 7 : 4;
            for (let i = 0; i < gibs; i++) {
                const a = this.h(e.x, e.y, 30 + i) * Math.PI * 2;
                const d = 3 + this.h(e.x, e.y, 50 + i) * (dense ? 16 : 10);
                const gx = e.x + Math.cos(a) * d, gy = e.y + Math.sin(a) * d * .58;
                const col = i === 0 ? '#dfd2b8' : i === 1 ? (armored ? '#c2ccd6' : cloth) : i % 2 ? '#8f121b' : '#570d14';
                this.stamp(gx, gy, 3 + (i % 2), col, 2 + (i % 2));
            }
            // 零星折断银色武器杆 / 碎盾留在血泊中
            if (dense && r1 > .42) {
                this.stamp(e.x + (r2 - .5) * 14, e.y + (r1 - .5) * 6, 11, '#665037', 2);
                this.stamp(e.x + (r2 - .5) * 14 + 9, e.y + (r1 - .5) * 6, 4, '#cfd7df', 2);
            }
        }
        else if (e.type === 'impact') {
            const scale = dense ? 1.25 : 1;
            this.stamp(e.x - 20 * scale, e.y - 8 * scale, 40 * scale, '#3b3226', 16 * scale);
            this.stamp(e.x - 14 * scale, e.y - 10 * scale, 28 * scale, '#27241f', 19 * scale);
            this.stamp(e.x - 8 * scale, e.y - 5 * scale, 17 * scale, '#151312', 10 * scale);
            // 焦黑炮坑中点缀灼烧余烬斑与血泥犁沟
            if (dense) {
                this.stamp(e.x - 4, e.y - 1, 4, '#8f3618', 3);
                this.stamp(e.x + 5, e.y + 2, 3, '#b0481d', 2);
                if (e.dx || e.dy) {
                    const ux = e.dx ?? 0, uy = e.dy ?? 0, len = Math.hypot(ux, uy) || 1;
                    for (let i = 1; i <= 5; i++)
                        this.stamp(e.x + (ux / len) * i * 9 - 4, e.y + (uy / len) * i * 5 - 2, 8, i % 2 ? '#342a21' : '#571519', 4);
                }
            }
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
            for (let i = 0; i < 64; i++)
                this.stamp(s.x + ((i * 47 % 61) / 61 - .5) * s.w, s.y + ((i * 19 % 59) / 59 - .5) * s.h, 6 + i % 9, ['#32312c', '#4a473e', '#5d574a', '#24211e'][i % 4], 4 + i % 5);
        }
    }
}
