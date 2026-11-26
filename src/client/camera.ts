import { WIDTH, HEIGHT } from '../sim/maps';
import type { Point } from '../sim/types';
export class Camera {
    x = WIDTH / 2;
    y = HEIGHT / 2;
    zoom = .45;
    w = 1;
    h = 1;
    base = .45;
    initialized = false;
    frameScenario(scenario: number) {
        this.initialized = false;
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;
        this.resize(this.w, this.h);
        if (scenario === 1 || scenario === 3) {
            this.zoom = this.base * (this.w > 650 ? 2.25 : 1.25);
            this.x = scenario === 1 ? 1990 : 2800;
            this.y = scenario === 1 ? 655 : 1050;
            this.clamp();
        }
    }
    resize(w: number, h: number) { const ratio = this.zoom / this.base; this.w = w; this.h = h; this.base = Math.max(w / WIDTH, h / HEIGHT); this.zoom = this.base * (this.initialized ? ratio : w > 650 ? Math.min(1.32, Math.max(1, w / 2850 / this.base)) : 1); this.initialized = true; this.clamp(); }
    clamp() { const a = this.w / (2 * this.zoom), b = this.h / (2 * this.zoom); this.x = Math.max(a, Math.min(WIDTH - a, this.x)); this.y = Math.max(b, Math.min(HEIGHT - b, this.y)); }
    world(x: number, y: number) { return { x: this.x + (x - this.w / 2) / this.zoom, y: this.y + (y - this.h / 2) / this.zoom }; }
    screen(p: Point) { return { x: (p.x - this.x) * this.zoom + this.w / 2, y: (p.y - this.y) * this.zoom + this.h / 2 }; }
    scale(factor: number, x = this.w / 2, y = this.h / 2) { const before = this.world(x, y); this.zoom = Math.max(this.base, Math.min(this.base * 6, this.zoom * factor)); const after = this.world(x, y); this.x += before.x - after.x; this.y += before.y - after.y; this.clamp(); }
}
