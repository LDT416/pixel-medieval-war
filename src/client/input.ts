import type { Point } from '../sim/types';
import type { Camera } from './camera';
export class Input {
    points = new Map<number, Point>();
    keys = new Set<string>();
    box: {
        start: Point;
        end: Point;
    } | null = null;
    private velocity = { x: 0, y: 0 };
    private origin: Point | null = null;
    private drag = false;
    private multi = false;
    private pan = false;
    private stamp = 0;
    constructor(canvas: HTMLCanvasElement, public cam: Camera, tap: (p: Point) => void, select: (a: Point, b: Point) => void, active: () => boolean) {
        const pos = (e: PointerEvent | WheelEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        canvas.oncontextmenu = e => e.preventDefault();
        canvas.onpointerdown = e => {
            if (!active())
                return;
            canvas.setPointerCapture(e.pointerId);
            const p = pos(e);
            this.points.set(e.pointerId, p);
            this.velocity = { x: 0, y: 0 };
            this.stamp = e.timeStamp;
            if (this.points.size === 1) {
                this.origin = p;
                this.drag = this.multi = false;
                this.pan = e.pointerType !== 'mouse' || e.button === 2;
            }
            else {
                this.multi = true;
                this.box = null;
            }
        };
        canvas.onpointermove = e => {
            const prev = this.points.get(e.pointerId);
            if (!prev)
                return;
            const before = [...this.points.values()], p = pos(e);
            this.points.set(e.pointerId, p);
            const after = [...this.points.values()];
            if (after.length >= 2) {
                const [a, b] = before, [n, m] = after, old = Math.hypot(a.x - b.x, a.y - b.y);
                const ox = (a.x + b.x) / 2, oy = (a.y + b.y) / 2, anchor = cam.world(ox, oy);
                if (old > 1)
                    cam.scale(Math.hypot(n.x - m.x, n.y - m.y) / old, ox, oy);
                const now = cam.world((n.x + m.x) / 2, (n.y + m.y) / 2);
                cam.x += anchor.x - now.x;
                cam.y += anchor.y - now.y;
                cam.clamp();
                return;
            }
            if (!this.origin)
                return;
            this.drag ||= Math.hypot(p.x - this.origin.x, p.y - this.origin.y) > 5;
            if (this.drag || this.multi) {
                if (this.pan) {
                    const dt = Math.max(8, e.timeStamp - this.stamp) / 1000;
                    const dx = (prev.x - p.x) / cam.zoom, dy = (prev.y - p.y) / cam.zoom;
                    cam.x += dx;
                    cam.y += dy;
                    cam.clamp();
                    this.velocity = { x: dx / dt, y: dy / dt };
                }
                else
                    this.box = { start: this.origin, end: p };
            }
            this.stamp = e.timeStamp;
        };
        const end = (e: PointerEvent, cancel: boolean) => {
            if (!this.points.delete(e.pointerId))
                return;
            if (!cancel && !this.multi) {
                const p = pos(e);
                if (this.box)
                    select(cam.world(this.box.start.x, this.box.start.y), cam.world(p.x, p.y));
                else if (!this.drag && e.button !== 2)
                    tap(cam.world(p.x, p.y));
            }
            this.box = null;
            if (cancel || this.multi || e.timeStamp - this.stamp > 90)
                this.velocity = { x: 0, y: 0 };
            this.origin = [...this.points.values()][0] ?? null;
        };
        canvas.onpointerup = e => end(e, false);
        canvas.onpointercancel = e => end(e, true);
        canvas.onlostpointercapture = e => end(e, true);
        canvas.onwheel = e => { e.preventDefault(); const p = pos(e); cam.scale(Math.exp(-e.deltaY * .0018), p.x, p.y); };
        addEventListener('keydown', e => { if (active())
            this.keys.add(e.key.toLowerCase()); });
        addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
        addEventListener('blur', () => this.reset());
    }
    reset() { this.keys.clear(); this.points.clear(); this.velocity = { x: 0, y: 0 }; this.box = null; }
    update(dt: number) {
        const c = this.cam, k = this.keys, s = 600 * dt / c.zoom;
        c.x += (Number(k.has('d')) - Number(k.has('a'))) * s;
        c.y += (Number(k.has('s')) - Number(k.has('w'))) * s;
        if (!this.points.size) {
            c.x += this.velocity.x * dt;
            c.y += this.velocity.y * dt;
            const decay = Math.exp(-7 * dt);
            this.velocity.x *= decay;
            this.velocity.y *= decay;
        }
        c.clamp();
    }
}
