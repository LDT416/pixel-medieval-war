import { COLS, ROWS, CELL } from './maps';
import { Grid, indexAt } from './grid';
import type { Faction, Point } from './types';
const N = COLS * ROWS, INF = 65535;
// All traversable edges cost one. A FIFO bucket is Dijkstra's queue for uniform edge costs.
export class FlowField {
    readonly dist = new Uint16Array(N);
    readonly dx = new Int8Array(N);
    readonly dy = new Int8Array(N);
    constructor(grid: Grid, goal: Point, f: Faction) {
        const pass = grid.pass[f], d = this.dist, q = new Int32Array(N);
        d.fill(INF);
        let seed = indexAt(goal.x, goal.y);
        if (!pass[seed]) {
            let best = Infinity;
            for (let i = 0; i < N; i++)
                if (pass[i]) {
                    const v = ((i % COLS + .5) * CELL - goal.x) ** 2 + ((Math.floor(i / COLS) + .5) * CELL - goal.y) ** 2;
                    if (v < best) {
                        best = v;
                        seed = i;
                    }
                }
        }
        let head = 0, tail = 1;
        q[0] = seed;
        d[seed] = 0;
        while (head < tail) {
            const i = q[head++], v = d[i] + 1, x = i % COLS;
            if (x > 0 && pass[i - 1] && d[i - 1] === INF) {
                d[i - 1] = v;
                q[tail++] = i - 1;
                this.dx[i - 1] = 1;
            }
            if (x < COLS - 1 && pass[i + 1] && d[i + 1] === INF) {
                d[i + 1] = v;
                q[tail++] = i + 1;
                this.dx[i + 1] = -1;
            }
            if (i >= COLS && pass[i - COLS] && d[i - COLS] === INF) {
                d[i - COLS] = v;
                q[tail++] = i - COLS;
                this.dy[i - COLS] = 1;
            }
            if (i < N - COLS && pass[i + COLS] && d[i + COLS] === INF) {
                d[i + COLS] = v;
                q[tail++] = i + COLS;
                this.dy[i + COLS] = -1;
            }
        }
    }
    direction(i: number) {
        let x = this.dx[i], y = this.dy[i];
        const d = this.dist, here = d[i];
        if (x) {
            if (i >= COLS && d[i - COLS] < here && d[i - COLS + x] < here)
                y = -1;
            else if (i < N - COLS && d[i + COLS] < here && d[i + COLS + x] < here)
                y = 1;
        }
        else if (y) {
            const col = i % COLS;
            if (col > 0 && d[i - 1] < here && d[i + y * COLS - 1] < here)
                x = -1;
            else if (col < COLS - 1 && d[i + 1] < here && d[i + y * COLS + 1] < here)
                x = 1;
        }
        return { x, y };
    }
}
