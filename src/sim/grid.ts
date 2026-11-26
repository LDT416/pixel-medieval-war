import { CELL, COLS, ROWS, WIDTH, HEIGHT, water, onHighGround } from './maps';
import type { Faction, MapId, Point, Structure } from './types';
export const indexAt = (x: number, y: number) => Math.min(COLS - 1, Math.max(0, Math.floor(x / CELL))) + COLS * Math.min(ROWS - 1, Math.max(0, Math.floor(y / CELL)));
const NAV_STEP = 2;
const NAV_CELL = CELL * NAV_STEP;
const NCOLS = Math.ceil(COLS / NAV_STEP);
const NROWS = Math.ceil(ROWS / NAV_STEP);
const NSIZE = NCOLS * NROWS;
const DIRS: readonly [number, number, number][] = [
    [1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10],
    [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]
];

export class Grid {
    private pass = new Uint8Array(COLS * ROWS);
    private solidPass = new Uint8Array(COLS * ROWS);
    private nav = new Uint8Array(NSIZE);
    readonly ground = new Int32Array(COLS * ROWS);
    // Pre-allocated deterministic A* scratch buffers (zero GC churn)
    private gScore = new Int32Array(NSIZE);
    private parent = new Int32Array(NSIZE);
    private stamp = new Int32Array(NSIZE);
    private closed = new Int32Array(NSIZE);
    private heapNode = new Int32Array(NSIZE);
    private heapF = new Int32Array(NSIZE);
    private searchId = 0;

    constructor(map: MapId, sites: Structure[]) {
        for (let i = 0; i < this.pass.length; i++) {
            const x = (i % COLS + .5) * CELL, y = (Math.floor(i / COLS) + .5) * CELL;
            const ok = Number(!water(x, y, map));
            this.pass[i] = ok;
            this.solidPass[i] = ok;
        }
        for (const s of sites) {
            if (s.hp <= 0)
                continue;
            if (s.type === 'tree') {
                if (s.treeArt === 'bush')
                    continue;
                const r = 7;
                for (let row = Math.max(0, Math.floor((s.y - r) / CELL)); row < ROWS && row * CELL < s.y + r; row++)
                    for (let col = Math.max(0, Math.floor((s.x - r) / CELL)); col < COLS && col * CELL < s.x + r; col++)
                        this.pass[col + row * COLS] = 0;
                continue;
            }
            if (s.type === 'keep') {
                for (let row = Math.max(0, Math.floor((s.y - s.h / 2) / CELL)); row < ROWS && row * CELL < s.y + s.h / 2; row++)
                    for (let col = Math.max(0, Math.floor((s.x - s.w / 2) / CELL)); col < COLS && col * CELL < s.x + s.w / 2; col++) {
                        const i = col + row * COLS, p = { x: (col + .5) * CELL, y: (row + .5) * CELL };
                        this.ground[i] = s.id;
                        if (!onHighGround(s, p) && Math.abs(p.x - s.x) < 126 && Math.abs(p.y - s.y) < 92) {
                            this.pass[i] = 0;
                            this.solidPass[i] = 0;
                        }
                    }
                continue;
            }
            const solidObstacle = ['barracks', 'windmill', 'church', 'ruins', 'pond', 'haystack', 'tents'].includes(s.type);
            const padX = solidObstacle ? s.w * .30 : s.w / 2;
            const padY = solidObstacle ? s.h * .26 : s.h / 2;
            for (let row = Math.max(0, Math.floor((s.y - padY) / CELL)); row < ROWS && row * CELL < s.y + padY; row++)
                for (let col = Math.max(0, Math.floor((s.x - padX) / CELL)); col < COLS && col * CELL < s.x + padX; col++) {
                    const i = col + row * COLS;
                    if (s.type === 'bridge') {
                        this.pass[i] = 1;
                        this.solidPass[i] = 1;
                    }
                    else if (solidObstacle) {
                        this.pass[i] = 0;
                        this.solidPass[i] = 0;
                    }
                    if (s.type === 'bridge' || s.type === 'farmhouse' || s.type === 'redoubt')
                        this.ground[i] = s.id;
                }
        }
        // Build 32px coarse nav grid from solid obstacles & water (bridges force open)
        for (let nr = 0; nr < NROWS; nr++) {
            for (let nc = 0; nc < NCOLS; nc++) {
                let open = 0, total = 0;
                for (let dy = 0; dy < NAV_STEP; dy++) {
                    const r = nr * NAV_STEP + dy;
                    if (r >= ROWS) continue;
                    for (let dx = 0; dx < NAV_STEP; dx++) {
                        const c = nc * NAV_STEP + dx;
                        if (c >= COLS) continue;
                        total++;
                        if (this.solidPass[c + r * COLS]) open++;
                    }
                }
                this.nav[nc + nr * NCOLS] = open === total ? 1 : 0;
            }
        }
        // Ensure bridge center decks remain passable on coarse nav grid, and keep A* marching paths wide of starfort corner bastions
        for (const s of sites) {
            if (s.hp <= 0) continue;
            if (s.type === 'keep') {
                for (let nr = Math.max(0, Math.floor((s.y - 148) / NAV_CELL)); nr < NROWS && nr * NAV_CELL <= s.y + 148; nr++)
                    for (let nc = Math.max(0, Math.floor((s.x - 196) / NAV_CELL)); nc < NCOLS && nc * NAV_CELL <= s.x + 196; nc++)
                        this.nav[nc + nr * NCOLS] = 0;
            }
            if (s.type === 'bridge') {
                for (let nr = Math.max(0, Math.floor((s.y - s.h * .42) / NAV_CELL)); nr < NROWS && nr * NAV_CELL <= s.y + s.h * .42; nr++)
                    for (let nc = Math.max(0, Math.floor((s.x - s.w * .52) / NAV_CELL)); nc < NCOLS && nc * NAV_CELL <= s.x + s.w * .52; nc++)
                        this.nav[nc + nr * NCOLS] = 1;
            }
        }
    }
    walk(x: number, y: number, _f?: Faction) { return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !!this.pass[indexAt(x, y)]; }
    walkSolid(x: number, y: number) { return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !!this.solidPass[indexAt(x, y)]; }
    walkNav(x: number, y: number) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
        const nc = Math.min(NCOLS - 1, Math.max(0, Math.floor(x / NAV_CELL)));
        const nr = Math.min(NROWS - 1, Math.max(0, Math.floor(y / NAV_CELL)));
        return !!this.nav[nc + nr * NCOLS];
    }
    lineClear(ax: number, ay: number, bx: number, by: number, useNav = false): boolean {
        const dist = Math.hypot(bx - ax, by - ay);
        if (dist < 16) return useNav ? this.walkNav(bx, by) : this.walkSolid(bx, by);
        const steps = Math.ceil(dist / 16);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
            if (useNav ? !this.walkNav(px, py) : !this.walkSolid(px, py))
                return false;
        }
        return true;
    }
    private snapNav(x: number, y: number): number {
        const sc = Math.min(NCOLS - 1, Math.max(0, Math.floor(x / NAV_CELL)));
        const sr = Math.min(NROWS - 1, Math.max(0, Math.floor(y / NAV_CELL)));
        if (this.nav[sc + sr * NCOLS]) return sc + sr * NCOLS;
        for (let r = 1; r <= 8; r++) {
            let best = -1, bestD = Infinity;
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const nc = sc + dx, nr = sr + dy;
                    if (nc < 0 || nc >= NCOLS || nr < 0 || nr >= NROWS) continue;
                    const idx = nc + nr * NCOLS;
                    if (!this.nav[idx]) continue;
                    const d = dx * dx + dy * dy;
                    if (d < bestD) { bestD = d; best = idx; }
                }
            }
            if (best >= 0) return best;
        }
        return -1;
    }
    findPath(from: Point, to: Point): Point[] {
        if (this.lineClear(from.x, from.y, to.x, to.y))
            return [{ x: to.x, y: to.y }];
        const start = this.snapNav(from.x, from.y);
        const goal = this.snapNav(to.x, to.y);
        if (start < 0 || goal < 0 || start === goal)
            return [{ x: to.x, y: to.y }];
        const sid = ++this.searchId;
        const gc = goal % NCOLS, gr = Math.floor(goal / NCOLS);
        const heur = (c: number, r: number) => {
            const dx = Math.abs(c - gc), dy = Math.abs(r - gr);
            return 10 * (dx + dy) - 6 * Math.min(dx, dy);
        };
        let heapLen = 0;
        const push = (node: number, f: number) => {
            let i = heapLen++;
            this.heapNode[i] = node;
            this.heapF[i] = f;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (this.heapF[p] <= this.heapF[i]) break;
                const tn = this.heapNode[p], tf = this.heapF[p];
                this.heapNode[p] = this.heapNode[i]; this.heapF[p] = this.heapF[i];
                this.heapNode[i] = tn; this.heapF[i] = tf;
                i = p;
            }
        };
        const pop = () => {
            const top = this.heapNode[0];
            heapLen--;
            if (heapLen > 0) {
                this.heapNode[0] = this.heapNode[heapLen];
                this.heapF[0] = this.heapF[heapLen];
                let i = 0;
                while (true) {
                    const l = (i << 1) + 1, r = l + 1;
                    let sm = i;
                    if (l < heapLen && this.heapF[l] < this.heapF[sm]) sm = l;
                    if (r < heapLen && this.heapF[r] < this.heapF[sm]) sm = r;
                    if (sm === i) break;
                    const tn = this.heapNode[sm], tf = this.heapF[sm];
                    this.heapNode[sm] = this.heapNode[i]; this.heapF[sm] = this.heapF[i];
                    this.heapNode[i] = tn; this.heapF[i] = tf;
                    i = sm;
                }
            }
            return top;
        };
        this.stamp[start] = sid;
        this.gScore[start] = 0;
        this.parent[start] = -1;
        push(start, heur(start % NCOLS, Math.floor(start / NCOLS)));
        let found = -1, closest = start, closestH = heur(start % NCOLS, Math.floor(start / NCOLS));
        let expanded = 0;
        while (heapLen > 0 && expanded < 3200) {
            const cur = pop();
            if (this.closed[cur] === sid) continue;
            this.closed[cur] = sid;
            expanded++;
            if (cur === goal) { found = cur; break; }
            const cc = cur % NCOLS, cr = Math.floor(cur / NCOLS);
            const hCur = heur(cc, cr);
            if (hCur < closestH) { closestH = hCur; closest = cur; }
            const baseG = this.gScore[cur];
            for (let d = 0; d < 8; d++) {
                const dx = DIRS[d][0], dy = DIRS[d][1], cost = DIRS[d][2];
                const nc = cc + dx, nr = cr + dy;
                if (nc < 0 || nc >= NCOLS || nr < 0 || nr >= NROWS) continue;
                const next = nc + nr * NCOLS;
                if (!this.nav[next] || this.closed[next] === sid) continue;
                // Prevent diagonal corner-cutting through solid obstacles
                if (dx !== 0 && dy !== 0 && (!this.nav[cc + dx + cr * NCOLS] || !this.nav[cc + (cr + dy) * NCOLS]))
                    continue;
                const ng = baseG + cost;
                if (this.stamp[next] !== sid || ng < this.gScore[next]) {
                    this.stamp[next] = sid;
                    this.gScore[next] = ng;
                    this.parent[next] = cur;
                    push(next, ng + heur(nc, nr));
                }
            }
        }
        const end = found >= 0 ? found : closest;
        if (end === start) return [{ x: to.x, y: to.y }];
        const raw: Point[] = [];
        for (let cur = end; cur >= 0 && cur !== start; cur = this.parent[cur]) {
            raw.push({ x: (cur % NCOLS + .5) * NAV_CELL, y: (Math.floor(cur / NCOLS) + .5) * NAV_CELL });
        }
        raw.reverse();
        if (found >= 0) raw.push({ x: to.x, y: to.y });
        // String-pull smoothing so units march along clean diagonal lines instead of zigzags
        const smooth: Point[] = [];
        let anchor: Point = from, i = 0;
        while (i < raw.length) {
            let best = i;
            for (let j = Math.min(raw.length - 1, i + 10); j > i; j--) {
                if (this.lineClear(anchor.x, anchor.y, raw[j].x, raw[j].y)) {
                    best = j;
                    break;
                }
            }
            smooth.push(raw[best]);
            anchor = raw[best];
            i = best + 1;
        }
        return smooth;
    }
    heightSite(p: {
        x: number;
        y: number;
    }, sites: Map<number, Structure>) {
        const site = sites.get(this.ground[indexAt(p.x, p.y)]);
        return site && site.hp > 0 && onHighGround(site, p) ? site.id : 0;
    }
}
