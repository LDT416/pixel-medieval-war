import type { Company, Faction } from './arenaTypes';
import { movementAt, type Layout, type Rect } from './maps';
import type { Point } from './types';

type Traffic = Pick<Company, 'id' | 'faction' | 'x' | 'y' | 'alive' | 'status'>;
type Edge = { to: number; cost: number; length: number };
type Route = { goal: Point; points: Point[]; next: number; review: number };
const CELL = 160, CLEARANCE = 18;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function projection(a: Point, b: Point, p: Point) {
    const dx = b.x - a.x, dy = b.y - a.y;
    return clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
}
function inFarm(p: Point, r: Rect) {
    return Math.abs(r.x - p.x) <= r.w / 2 + CLEARANCE && Math.abs(r.y - p.y) <= r.h / 2 + CLEARANCE;
}
function insideYard(p: Point, f: Rect) {
    return Math.abs(p.x - f.x) < f.w / 2 && Math.abs(p.y - f.y) < f.h / 2;
}
function crossesFarm(a: Point, b: Point, r: Rect) {
    // Clip the centerline against the padded external walls.
    const dx = b.x - a.x, dy = b.y - a.y, w = r.w / 2 + CLEARANCE, h = r.h / 2 + CLEARANCE;
    let enter = 0, exit = 1;
    if (dx === 0) {
        if (Math.abs(a.x - r.x) > w) return false;
    } else {
        const t1 = (r.x - w - a.x) / dx, t2 = (r.x + w - a.x) / dx;
        enter = Math.max(enter, Math.min(t1, t2)); exit = Math.min(exit, Math.max(t1, t2));
    }
    if (dy === 0) {
        if (Math.abs(a.y - r.y) > h) return false;
    } else {
        const t1 = (r.y - h - a.y) / dy, t2 = (r.y + h - a.y) / dy;
        enter = Math.max(enter, Math.min(t1, t2)); exit = Math.min(exit, Math.max(t1, t2));
    }
    return enter <= exit;
}

// The heap contains cell indices. Equal priorities are resolved by cell order.
class Frontier {
    private ids: number[] = [];
    private weights: number[] = [];
    get length() { return this.ids.length; }
    private earlier(id: number, weight: number, at: number) {
        return weight < this.weights[at] || (weight === this.weights[at] && id < this.ids[at]);
    }
    push(id: number, weight: number) {
        let i = this.ids.length;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (!this.earlier(id, weight, parent)) break;
            this.ids[i] = this.ids[parent]; this.weights[i] = this.weights[parent]; i = parent;
        }
        this.ids[i] = id; this.weights[i] = weight;
    }
    pop() {
        const first = this.ids[0], last = this.ids.pop()!, weight = this.weights.pop()!;
        if (!this.ids.length) return first;
        let i = 0;
        while (2 * i + 1 < this.ids.length) {
            let child = 2 * i + 1;
            if (child + 1 < this.ids.length && this.earlier(this.ids[child + 1], this.weights[child + 1], child)) child++;
            if (weight < this.weights[child] || (weight === this.weights[child] && last <= this.ids[child])) break;
            this.ids[i] = this.ids[child]; this.weights[i] = this.weights[child]; i = child;
        }
        this.ids[i] = last; this.weights[i] = weight;
        return first;
    }
}

/** Routes for ordinary map travel. Road, river, scenery and traffic all use world coordinates. */
export class MarchRoutes {
    private readonly columns: number;
    private readonly rows: number;
    private readonly nodes: Point[] = [];
    private readonly edges: Edge[][] = [];
    private readonly traffic: Float32Array;
    private readonly costs: Float64Array;
    private readonly endCosts: Float64Array;
    private readonly parents: Int32Array;
    private readonly closed: Uint8Array;
    private readonly routes = new Map<number, Route>();

    constructor(private readonly layout: Layout) {
        this.columns = Math.max(1, Math.ceil(layout.width / CELL));
        this.rows = Math.max(1, Math.ceil(layout.height / CELL));
        const count = this.columns * this.rows;
        this.traffic = new Float32Array(count);
        this.costs = new Float64Array(count); this.endCosts = new Float64Array(count);
        this.parents = new Int32Array(count); this.closed = new Uint8Array(count);
        for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.columns; i++) {
            const p = { x: Math.min((i + .5) * CELL, layout.width - 1), y: Math.min((j + .5) * CELL, layout.height - 1) };
            this.nodes.push(this.snapToRoad(p)); this.edges.push([]);
        }
        const offsets = [[1, 0], [-1, 1], [0, 1], [1, 1]];
        for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.columns; i++) {
            const id = j * this.columns + i, a = this.nodes[id];
            for (const [di, dj] of offsets) {
                const col = i + di, row = j + dj;
                if (col < 0 || col >= this.columns || row >= this.rows) continue;
                const to = row * this.columns + col, b = this.nodes[to];
                if (!this.clear(a, b)) continue;
                const cost = this.segmentCost(a, b, false), length = distance(a, b);
                this.edges[id].push({ to, cost, length });
                this.edges[to].push({ to: id, cost, length });
            }
        }
    }

    private snapToRoad(p: Point) {
        // Narrow roads must survive sampling even when they run between two grid rows.
        let nearest = (CELL * .54) ** 2, result = p;
        for (const road of this.layout.roads) for (let i = 1; i < road.points.length; i++) {
            const a = road.points[i - 1], b = road.points[i], t = projection(a, b, p);
            const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
            const d = (x - p.x) ** 2 + (y - p.y) ** 2;
            if (d < nearest) { nearest = d; result = { x, y }; }
        }
        return result;
    }
    private clear(a: Point, b: Point, allowEndpoints = false) {
        for (const f of this.layout.farms) {
            if (allowEndpoints && (inFarm(a, f) || inFarm(b, f))) continue;
            if (crossesFarm(a, b, f)) return false;
        }
        for (const g of this.layout.woods) {
            const r2 = (g.r + CLEARANCE) ** 2;
            if (allowEndpoints && ((a.x - g.x) ** 2 + (a.y - g.y) ** 2 <= r2 || (b.x - g.x) ** 2 + (b.y - g.y) ** 2 <= r2)) continue;
            const t = projection(a, b, g);
            if ((a.x + (b.x - a.x) * t - g.x) ** 2 + (a.y + (b.y - a.y) * t - g.y) ** 2 <= r2) return false;
        }
        return true;
    }
    private cell(x: number, y: number) {
        return clamp(Math.floor(y / CELL), 0, this.rows - 1) * this.columns + clamp(Math.floor(x / CELL), 0, this.columns - 1);
    }
    private readTraffic(companies: readonly Traffic[], faction: Faction, excludedId?: number) {
        this.traffic.fill(0);
        for (const c of companies) {
            if (c.faction !== faction || c.id === excludedId || c.alive <= 0 || c.status === 'gone') continue;
            const col = Math.floor(c.x / CELL), row = Math.floor(c.y / CELL);
            for (let j = Math.max(0, row - 1); j <= Math.min(this.rows - 1, row + 1); j++) {
                for (let i = Math.max(0, col - 1); i <= Math.min(this.columns - 1, col + 1); i++) {
                    const d = Math.hypot((i + .5) * CELL - c.x, (j + .5) * CELL - c.y);
                    const id = j * this.columns + i;
                    this.traffic[id] = Math.min(3, this.traffic[id] + Math.max(0, 1 - d / (CELL * 1.5)) * .8);
                }
            }
        }
    }
    private segmentCost(a: Point, b: Point, traffic: boolean) {
        const length = distance(a, b), count = Math.max(1, Math.ceil(length / 70));
        let sum = 0;
        for (let i = 0; i < count; i++) {
            const t = (i + .5) / count, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
            sum += 1 / movementAt(x, y, this.layout) + (traffic ? this.traffic[this.cell(x, y)] : 0);
        }
        return length * sum / count;
    }
    private connections(p: Point) {
        const col = clamp(Math.floor(p.x / CELL), 0, this.columns - 1), row = clamp(Math.floor(p.y / CELL), 0, this.rows - 1);
        const links: { id: number; cost: number }[] = [];
        for (let j = Math.max(0, row - 2); j <= Math.min(this.rows - 1, row + 2); j++) {
            for (let i = Math.max(0, col - 2); i <= Math.min(this.columns - 1, col + 2); i++) {
                const id = j * this.columns + i, node = this.nodes[id];
                if (this.edges[id].length && this.clear(p, node)) links.push({ id, cost: this.segmentCost(p, node, true) });
            }
        }
        return links;
    }
    private search(start: Point, goal: Point): Point[] {
        const direct = this.clear(start, goal) ? this.segmentCost(start, goal, true) : Infinity;
        const heuristic = (p: Point) => distance(p, goal) / 1.3; // Fastest terrain in movementAt.
        if (direct <= heuristic(start) + 1) return [goal];
        const queue = new Frontier();
        this.costs.fill(Infinity); this.endCosts.fill(Infinity); this.closed.fill(0);
        for (const link of this.connections(goal)) this.endCosts[link.id] = link.cost;
        for (const link of this.connections(start)) {
            this.costs[link.id] = link.cost; this.parents[link.id] = -1;
            queue.push(link.id, link.cost + heuristic(this.nodes[link.id]));
        }
        let best = direct, last = -1;
        while (queue.length) {
            const id = queue.pop();
            if (this.closed[id]) continue;
            const cost = this.costs[id];
            if (cost + heuristic(this.nodes[id]) >= best) break;
            this.closed[id] = 1;
            if (cost + this.endCosts[id] < best) { best = cost + this.endCosts[id]; last = id; }
            for (const edge of this.edges[id]) {
                if (this.closed[edge.to]) continue;
                const penalty = edge.length * (this.traffic[id] + this.traffic[edge.to]) * .5;
                const next = cost + edge.cost + penalty;
                if (next >= this.costs[edge.to]) continue;
                this.costs[edge.to] = next; this.parents[edge.to] = id;
                queue.push(edge.to, next + heuristic(this.nodes[edge.to]));
            }
        }
        // Tiny savings from grid quantization are not worth a visible bend.
        if (Number.isFinite(direct) && best + Math.min(10, direct * .02) >= direct) return [goal];
        if (last < 0) return [];
        const raw: Point[] = [goal];
        for (let i = last; i >= 0; i = this.parents[i]) raw.push(this.nodes[i]);
        raw.push(start); raw.reverse();
        const result: Point[] = [];
        for (let i = 0; i < raw.length - 1;) {
            let j = i + 1, previousCost = this.segmentCost(raw[i], raw[j], true);
            while (j + 1 < raw.length) {
                const candidate = raw[j + 1];
                previousCost += this.segmentCost(raw[j], candidate, true);
                if (!this.clear(raw[i], candidate) || this.segmentCost(raw[i], candidate, true) > previousCost + 1) break;
                j++;
            }
            result.push(raw[j]); i = j;
        }
        return result;
    }
    // An assigned station or an old save may start inside the terrain mask. Leave by a
    // short local segment before ordinary routing; masking the whole obstacle would
    // let a long route cut across a grove to reach a point just inside its far edge.
    private exit(p: Point, toward: Point): Point[] | null {
        const points: Point[] = [];
        const farm = this.layout.farms.find(f => insideYard(p, f));
        if (farm) {
            const direction = this.layout.ridgeOwner === 0 ? 1 : -1;
            points.push({ x: farm.x + direction * (farm.w / 2 - 8), y: farm.y });
            points.push({ x: farm.x + direction * (farm.w / 2 + CLEARANCE + 2), y: farm.y });
            p = points[1];
        }
        if (this.clear(p, p)) return points;
        const groves = this.layout.woods.filter(g => (p.x - g.x) ** 2 + (p.y - g.y) ** 2 <= (g.r + CLEARANCE) ** 2);
        const farms = this.layout.farms.filter(f => inFarm(p, f));
        const ahead = Math.atan2(toward.y - p.y, toward.x - p.x);
        const angles = [ahead, ...groves.map(g => Math.atan2(p.y - g.y, p.x - g.x))];
        for (let i = 0; i < 16; i++) angles.push(i * Math.PI / 8);
        let best = Infinity, out: Point | null = null;
        for (const angle of angles) {
            const dx = Math.cos(angle), dy = Math.sin(angle);
            let length = 0;
            for (const g of groves) {
                const x = p.x - g.x, y = p.y - g.y, dot = x * dx + y * dy;
                length = Math.max(length, Math.sqrt(Math.max(0, dot * dot + (g.r + CLEARANCE) ** 2 - x * x - y * y)) - dot);
            }
            for (const f of farms) {
                const tx = Math.abs(dx) < 1e-9 ? Infinity : (f.x + Math.sign(dx) * (f.w / 2 + CLEARANCE) - p.x) / dx;
                const ty = Math.abs(dy) < 1e-9 ? Infinity : (f.y + Math.sign(dy) * (f.h / 2 + CLEARANCE) - p.y) / dy;
                length = Math.max(length, Math.min(tx, ty));
            }
            const q = { x: p.x + (length + 1) * dx, y: p.y + (length + 1) * dy };
            const score = length - .01 * Math.cos(angle - ahead);
            if (score >= best || q.x < 0 || q.x > this.layout.width || q.y < 0 || q.y > this.layout.height) continue;
            if (!this.clear(q, q) || !this.clear(p, q, true)) continue;
            best = score; out = q;
        }
        if (!out) return null;
        points.push(out); return points;
    }
    /** Returns an ordered centerline, excluding the start and including the destination; an unreachable destination yields []. */
    path(x: number, y: number, gx: number, gy: number, companies: readonly Traffic[], faction: Faction, excludedId?: number): Point[] {
        this.readTraffic(companies, faction, excludedId);
        const start = { x, y }, goal = { x: gx, y: gy };
        if (x === gx && y === gy) return [goal];
        // Reviewing a route after entering its destination must not turn the party
        // around and send it back out through the same entrance.
        const sameYard = this.layout.farms.some(f => insideYard(start, f) && insideYard(goal, f));
        const shortForestTrip = this.layout.woods.some(g => distance(start, g) <= g.r && distance(goal, g) <= g.r && distance(start, goal) <= g.r);
        if ((sameYard || shortForestTrip) && this.clear(start, goal, true)) return [goal];
        const leaving = this.exit(start, goal), entering = this.exit(goal, start);
        if (!leaving || !entering) return [];
        const from = leaving[leaving.length - 1] ?? start, to = entering[entering.length - 1] ?? goal;
        const middle = this.search(from, to);
        if (!middle.length) return [];
        const points = leaving.concat(middle);
        for (let i = entering.length - 2; i >= 0; i--) points.push(entering[i]);
        if (entering.length) points.push(goal);
        return points.filter((p, i) => !i || distance(p, points[i - 1]) > .01);
    }
    /** Returns a temporary turn, or null for a clear trip to the supplied goal. */
    waypoint(id: number, x: number, y: number, gx: number, gy: number, tick: number, companies: readonly Traffic[], faction: Faction): Readonly<Point> | null {
        let route = this.routes.get(id);
        const here = { x, y }, goal = { x: gx, y: gy };
        if (route) {
            while (route.next < route.points.length - 1) {
                const gap = distance(here, route.points[route.next]);
                if (gap > 10 || (gap >= 1 && !this.clear(here, route.points[route.next + 1]))) break;
                route.next++;
            }
        }
        const shifted = route ? distance(route.goal, goal) : Infinity;
        const lastLegChanged = route && shifted > .01 && route.next >= route.points.length - 1 && !this.clear(here, goal);
        if (!route || tick >= route.review || shifted > CELL || lastLegChanged || (shifted > .01 && !route.points.length)) {
            const points = this.path(x, y, gx, gy, companies, faction, id < 0 ? ~id : undefined);
            route = { points, next: 0, goal, review: tick + 120 + Math.abs(id % 31) };
            this.routes.set(id, route);
        }
        if (!route.points.length) return here;
        return route.next < route.points.length - 1 ? route.points[route.next] : null;
    }
}
