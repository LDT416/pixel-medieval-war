import { Camera } from './camera';
import { DecalLayer } from './decalLayer';
import { VfxPool } from './vfxPool';
import { drawUnitSprite } from './spriteBaker';
import { drawStructure, drawFortCannons, drawFortFlag } from './scenery';
import { bakeTerrain, drawRoadFurniture } from './terrain';
import { HEIGHT, WIDTH, riverWidth, riverX } from '../sim/maps';
import type { SimWorld } from '../sim/world';
import type { Faction, Point, Structure, Unit } from '../sim/types';
const colors = ['#558fca', '#cb5047'];
export interface Overlay {
    selected: Set<number>;
    box: {
        start: Point;
        end: Point;
    } | null;
    faction: Faction;
    order: Point | null;
}
export class Renderer {
    camera = new Camera();
    decals = new DecalLayer();
    vfx = new VfxPool(this.decals);
    private landscape = document.createElement('canvas');
    private miniature = document.createElement('canvas');
    private revision = -1;
    private visible: Array<{ y: number; id: number; u?: Unit; s?: Structure }> = [];
    private c: CanvasRenderingContext2D;
    constructor(public canvas: HTMLCanvasElement, public mini: HTMLCanvasElement) {
        this.c = canvas.getContext('2d', { alpha: false })!;
        this.miniature.width = mini.width = 208;
        this.miniature.height = mini.height = 82;
        new ResizeObserver(() => this.resize()).observe(canvas);
    }
    resize() {
        const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
        if (!w || !h)
            return;
        if (w !== this.canvas.width || h !== this.canvas.height || !this.camera.initialized) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.c.imageSmoothingEnabled = false;
            this.camera.resize(w, h);
        }
    }
    reset(_w: SimWorld) { this.revision = -1; this.vfx.reset(); this.decals.clear(); }
    private isGroundStructure(s: Structure) {
        return s.type === 'bridge' || s.type === 'keep' || s.type === 'pond' || s.type === 'redoubt' || (s.type === 'tree' && s.treeArt === 'bush');
    }
    private bake(w: SimWorld) {
        if (this.landscape.width !== WIDTH) {
            this.landscape.width = WIDTH;
            this.landscape.height = HEIGHT;
        }
        const c = this.landscape.getContext('2d', { alpha: false })!;
        c.imageSmoothingEnabled = false;
        c.drawImage(bakeTerrain(w.map), 0, 0, WIDTH, HEIGHT);
        drawRoadFurniture(c, w.map);
        // 底图只烘焙贴地元素（桥、星堡底座、池塘、低土垒、灌木）；树木与高大建筑进入主循环 Y-Sort 实现真实遮挡！
        for (const s of [...w.structures].sort((a, b) => a.y - b.y))
            if (this.isGroundStructure(s))
                drawStructure(c, s);
        const mini = this.miniature.getContext('2d')!;
        mini.imageSmoothingEnabled = false;
        mini.drawImage(this.landscape, 0, 0, this.mini.width, this.mini.height);
        for (const s of w.structures)
            if (!this.isGroundStructure(s) && s.hp > 0) {
                mini.fillStyle = s.type === 'tree' ? '#364d2c' : '#857d6a';
                mini.fillRect(Math.round(s.x * this.mini.width / WIDTH), Math.round(s.y * this.mini.height / HEIGHT), s.type === 'tree' ? 2 : 4, s.type === 'tree' ? 2 : 3);
            }
        c.drawImage(this.decals.canvas, 0, 0);
        this.decals.composite = c;
        this.revision = w.revision;
    }
    draw(w: SimWorld, o: Overlay, redrawMini: boolean, alpha = 1) {
        if (this.revision !== w.revision)
            this.bake(w);
        const cam = this.camera, c = this.c, scale = cam.zoom, top = cam.world(0, 0);
        const left = Math.round(top.x), upper = Math.round(top.y), width = cam.w / scale, height = cam.h / scale;
        c.setTransform(scale, 0, 0, scale, Math.round(-left * scale), Math.round(-upper * scale));
        c.imageSmoothingEnabled = false;
        c.drawImage(this.landscape, 0, 0);
        this.drawFlowingRiver(c, w, upper, height);
        this.decals.draw(c, { x: left, y: upper, w: width, h: height }, w.tick);
        for (const fort of w.bases) {
            drawFortCannons(c, fort, w.tick);
            drawFortFlag(c, fort, w.tick);
        }
        // 统一收集视口内活体士兵 + 树木/高大建筑，按脚底 y 深度排序绘制（士兵走到树后会被树冠真实遮挡！）
        this.visible.length = 0;
        for (const u of w.units)
            if (u.x > left - 75 && u.x < left + width + 75 && u.y > upper - 75 && u.y < upper + height + 90)
                this.visible.push({ y: u.y, id: u.id, u });
        for (const s of w.structures) {
            if (s.hp <= 0 || this.isGroundStructure(s))
                continue;
            const padX = Math.max(90, s.w * .75), padY = Math.max(120, s.h);
            if (s.x > left - padX && s.x < left + width + padX && s.y > upper - padY && s.y < upper + height + padY) {
                const footY = s.type === 'tree' ? s.y : s.type === 'barracks' || s.type === 'farmhouse' ? s.y + s.h * .28 : s.y + s.h * .12;
                this.visible.push({ y: footY, id: s.id, s });
            }
        }
        this.visible.sort((a, b) => a.y - b.y || a.id - b.id);
        const now = performance.now();
        for (const item of this.visible) {
            if (item.s) {
                drawStructure(c, item.s);
                continue;
            }
            const u = item.u!;
            const x = Math.round(u.x - (1 - alpha) * u.vx), y = Math.round(u.y - (1 - alpha) * u.vy);
            const size = u.kind === 'field_cannon' ? 18 : u.kind === 'cuirassier' ? 14 : 6;
            c.fillStyle = '#1e261d65';
            c.fillRect(x - size, y - 2, size * 2, 4);
            if (o.selected.has(u.id)) {
                c.fillStyle = u.tower ? '#93d4cc' : '#f2cc70';
                c.fillRect(x - size, y + 2, size * 2, 2);
            }
            drawUnitSprite(c, u, w.tick - 1 + alpha, u.aimX, u.aimY, u.routed, (this.vfx.flashes.get(u.id) ?? 0) > now, x, y);
        }
        // 浅淡白金色流光弹道（一轮齐射划出一整排璀璨柔和白金流光！）
        for (const p of w.projectiles) {
            const x = p.x, y = p.y - p.z;
            const spd = Math.hypot(p.vx, p.vy) || 1;
            const ux = p.vx / spd, uy = (p.vy - p.vz) / spd;
            if (p.kind === 'bullet') {
                const tail = 24;
                c.save();
                c.lineCap = 'round';
                c.strokeStyle = 'rgba(248, 226, 152, 0.36)';
                c.lineWidth = 2.6;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x - ux * tail, y - uy * tail);
                c.stroke();
                c.strokeStyle = 'rgba(255, 252, 236, 0.86)';
                c.lineWidth = 1.2;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x - ux * (tail * .62), y - uy * (tail * .62));
                c.stroke();
                c.fillStyle = '#fffef4';
                c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
                c.restore();
            }
            else if (p.kind === 'ball') {
                const tail = 36;
                c.save();
                c.lineCap = 'round';
                c.strokeStyle = 'rgba(246, 214, 134, 0.42)';
                c.lineWidth = 4.2;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x - ux * tail, y - uy * tail);
                c.stroke();
                c.strokeStyle = 'rgba(255, 248, 224, 0.78)';
                c.lineWidth = 1.8;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x - ux * (tail * .6), y - uy * (tail * .6));
                c.stroke();
                c.fillStyle = '#333436';
                c.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
                c.fillStyle = '#f8e7b4';
                c.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 2);
                c.restore();
            }
            else {
                c.fillStyle = '#383834';
                c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
                c.fillStyle = '#ffcb6b';
                c.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 2);
            }
        }
        this.vfx.draw(c, { x: left, y: upper, w: width, h: height });
        if (o.order) {
            c.strokeStyle = '#eed58d';
            c.lineWidth = 2 / scale;
            c.strokeRect(o.order.x - 7, o.order.y - 7, 14, 14);
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (o.box) {
            const { start: a, end: b } = o.box;
            c.fillStyle = '#e9d28d22';
            c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
            c.strokeStyle = '#efcc85';
            c.lineWidth = 1;
            c.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        }
        if (redrawMini)
            this.minimap(w);
    }
    // 动态流动像素小溪/河流：只渲染当前视口河段，严格避开全部石桥桥面并在桥拱下游激起细腻白沫！
    private drawFlowingRiver(c: CanvasRenderingContext2D, w: SimWorld, upper: number, height: number) {
        const y0 = Math.max(0, Math.floor((upper - 32) / 18) * 18);
        const y1 = Math.min(HEIGHT, Math.ceil((upper + height + 32) / 18) * 18);
        const flow = w.tick * 1.35;
        const bridges = w.structures.filter(s => s.type === 'bridge' && s.hp > 0);
        c.imageSmoothingEnabled = false;
        for (let row = y0; row <= y1; row += 18) {
            const wy = (row + (flow % 18)) | 0;
            if (wy < 2 || wy > HEIGHT - 2) continue;
            const cx = riverX(wy), half = riverWidth(wy, w.map) * .45;
            if (half < 10) continue;
            const seed = Math.floor((row - Math.floor(flow / 18) * 18) / 18);
            const lanes = half > 60 ? 5 : 3;
            for (let k = 0; k < lanes; k++) {
                const h = ((seed * 73 + k * 197) ^ (seed * 13)) & 255;
                const len = 8 + (h & 7) * 2;
                // 严格裁剪掉与任意石桥桥面及下缘石拱立面重叠的水波纹（绝不画到桥面或桥拱砖石上！）
                let onBridge = false;
                for (const b of bridges) {
                    if (wy + len > b.y - b.h * .85 - 12 && wy < b.y + b.h * .5 + 98) { onBridge = true; break; }
                }
                if (onBridge) continue;
                const ratio = ((k + .5) / lanes) * 2 - 1 + (((h & 15) / 15) - .5) * .28;
                const clamped = Math.max(-.86, Math.min(.86, ratio));
                const rx = Math.round(cx + clamped * half);
                const isCenter = Math.abs(clamped) < .45;
                c.fillStyle = (h & 3) === 0 ? 'rgba(218, 240, 245, 0.48)' : isCenter ? 'rgba(130, 194, 218, 0.44)' : 'rgba(92, 154, 184, 0.36)';
                c.fillRect(rx, wy, 2, len);
                if ((h & 7) === 1) {
                    c.fillStyle = 'rgba(242, 250, 252, 0.56)';
                    c.fillRect(rx - 1, wy + 2, 4, 2);
                }
            }
        }
        // 桥拱下游激流白沫涟漪（严格在石拱桥南侧桥洞水面下方涌出！）
        for (const b of bridges) {
            const southArch = b.y + b.h * .5 + 100;
            if (southArch + 36 < upper || southArch - 10 > upper + height) continue;
            const cx = riverX(southArch + 12), half = riverWidth(southArch + 12, w.map) * .42;
            const phase = (w.tick * 1.8) % 28;
            for (let k = -2; k <= 2; k++) {
                const fx = Math.round(cx + k * (half * .42));
                const fy = Math.round(southArch + ((phase + Math.abs(k) * 9) % 28));
                c.fillStyle = 'rgba(225, 244, 248, 0.58)';
                c.fillRect(fx - 4, fy, 9, 2);
                c.fillStyle = 'rgba(164, 212, 228, 0.42)';
                c.fillRect(fx - 6, fy + 3, 13, 2);
            }
        }
    }
    private minimap(w: SimWorld) {
        const c = this.mini.getContext('2d')!, rx = this.mini.width / WIDTH, ry = this.mini.height / HEIGHT;
        c.imageSmoothingEnabled = false;
        c.drawImage(this.miniature, 0, 0);
        for (const u of w.units) {
            c.fillStyle = colors[u.faction];
            c.fillRect(u.x * rx, u.y * ry, 2, 2);
        }
        for (const s of w.bases) {
            c.fillStyle = colors[s.faction as Faction];
            c.fillRect(s.x * rx - 3, s.y * ry - 3, 6, 6);
        }
        const cam = this.camera, t = cam.world(0, 0);
        c.strokeStyle = '#f6e7bb';
        c.strokeRect(t.x * rx + .5, t.y * ry + .5, cam.w / cam.zoom * rx - 1, cam.h / cam.zoom * ry - 1);
    }
}
