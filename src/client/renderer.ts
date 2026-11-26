import { Camera } from './camera';
import { DecalLayer } from './decalLayer';
import { VfxPool } from './vfxPool';
import { drawUnitSprite } from './spriteBaker';
import { drawStructure, drawFortFlag } from './scenery';
import { bakeTerrain, drawRoadFurniture } from './terrain';
import { HEIGHT, WIDTH } from '../sim/maps';
import type { SimWorld } from '../sim/world';
import type { Faction, Point, Unit } from '../sim/types';
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
    private visible: Unit[] = [];
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
    private bake(w: SimWorld) {
        if (this.landscape.width !== WIDTH) {
            this.landscape.width = WIDTH;
            this.landscape.height = HEIGHT;
        }
        const c = this.landscape.getContext('2d', { alpha: false })!;
        c.imageSmoothingEnabled = false;
        c.drawImage(bakeTerrain(w.map), 0, 0, WIDTH, HEIGHT);
        drawRoadFurniture(c, w.map);
        for (const s of [...w.structures].sort((a, b) => a.y - b.y))
            drawStructure(c, s);
        const mini = this.miniature.getContext('2d')!;
        mini.imageSmoothingEnabled = false;
        mini.drawImage(this.landscape, 0, 0, this.mini.width, this.mini.height);
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
        for (const fort of w.bases)
            drawFortFlag(c, fort, w.tick);
        this.visible.length = 0;
        for (const u of w.units)
            if (u.x > left - 75 && u.x < left + width + 75 && u.y > upper - 65 && u.y < upper + height + 85)
                this.visible.push(u);
        this.visible.sort((a, b) => a.y - b.y || a.id - b.id);
        const now = performance.now();
        for (const u of this.visible) {
            const x = Math.round(u.x - (1 - alpha) * u.vx), y = Math.round(u.y - (1 - alpha) * u.vy);
            const size = u.kind === 'field_cannon' ? 18 : u.kind === 'cuirassier' ? 13 : 6;
            c.fillStyle = '#1e261d65';
            c.fillRect(x - size, y - 2, size * 2, 4);
            if (o.selected.has(u.id)) {
                c.fillStyle = u.tower ? '#93d4cc' : '#f2cc70';
                c.fillRect(x - size, y + 2, size * 2, 2);
            }
            drawUnitSprite(c, u, w.tick - 1 + alpha, u.aimX, u.aimY, u.routed, (this.vfx.flashes.get(u.id) ?? 0) > now, x, y);
        }
        for (const p of w.projectiles) {
            const x = Math.round(p.x), y = Math.round(p.y - p.z);
            if (p.kind === 'bullet') {
                c.fillStyle = '#e5d7a8';
                c.fillRect(x, y, 2, 1);
            }
            else {
                const n = p.kind === 'ball' ? 6 : 4;
                c.fillStyle = '#272928';
                c.fillRect(x - n / 2, y - n / 2, n, n);
                c.fillStyle = '#929187';
                c.fillRect(x - 1, y - 2, 2, 1);
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
