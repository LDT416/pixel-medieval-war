import type {Battalion, Company} from './arenaTypes';
import type {SimWorld} from './world';

interface Wait {
    started: number;
    lastGain: number;
    bestGap: number;
    released: boolean;
}

// A value of one starts a pause. Zero resumes the normal march.
const memberGap = (pixels: number) => (pixels - 35) / (78 - 35);
const neighborGap = (pixels: number) => (pixels - 200) / (350 - 200);

function remaining(b: Battalion) {
    if (b.closing || (b.order !== 'hold' && b.order !== 'reserve' &&
        !(b.order === 'advance' && b.stoppedAt < 0))) return 0;
    return Math.hypot(b.gx - b.x, b.gy - b.y);
}

function interrupted(w: SimWorld, c: Company) {
    return c.engaged || c.underFire > w.tick || c.formation === 'square';
}

function separateTrip(w: SimWorld, b: Battalion, c: Company) {
    const parking = c.objectiveParking;
    return w.logistics.isCommitted(c) || (parking && (b.order === 'hold' || b.order === 'reserve') &&
        parking.battalionX === b.homeX && parking.battalionY === b.homeY);
}

function hasCompanions(w: SimWorld, b: Battalion) {
    let moving = false;
    for (const id of b.companies) {
        const c = w.companies[id];
        if (!c || !c.alive || c.status === 'gone' || c.status === 'rout' || separateTrip(w, b, c)) continue;
        if (interrupted(w, c)) return false;
        moving = true;
    }
    return moving;
}

// Measure each member against its own lateral slot, even if the march turns
// or moves sideways relative to the formation's current facing.
function internalGap(w: SimWorld, b: Battalion, comps: Company[], offsets: number[], ux: number, uy: number) {
    let gap = 0;
    let members = 0;
    for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        if (separateTrip(w, b, c)) continue;
        if (interrupted(w, c)) return -1;
        members++;
        const slotX = Math.max(80, Math.min(w.layout.width - 80, b.x - b.hy * offsets[i]));
        const slotY = Math.max(80, Math.min(w.layout.height - 80, b.y + b.hx * offsets[i]));
        gap = Math.max(gap, (slotX - c.x) * ux + (slotY - c.y) * uy);
    }
    return members ? gap : -1;
}

export class MarchCohesion {
    private waits = new Map<number, Wait>();
    readonly stats = {memberWaits: 0, neighborWaits: 0, heldUpdates: 0, timeoutReleases: 0};

    reset() {
        this.waits.clear();
        this.stats.memberWaits = this.stats.neighborWaits = this.stats.heldUpdates = this.stats.timeoutReleases = 0;
    }

    shouldWait(w: SimWorld, b: Battalion, comps: Company[], offsets: number[]): boolean {
        const length = remaining(b);
        const ux = length > 24 ? (b.gx - b.x) / length : 0;
        const uy = length > 24 ? (b.gy - b.y) / length : 0;
        const local = length > 24 ? internalGap(w, b, comps, offsets, ux, uy) : -1;
        if (local < 0) {
            this.waits.delete(b.id);
            return false;
        }

        let neighbor = 0;
        for (const other of w.battalions) {
            if (other === b || other.faction !== b.faction || other.line !== b.line ||
                (b.order === 'advance') !== (other.order === 'advance')) continue;
            const advancing = b.order === 'advance';
            if (advancing && b.sector !== other.sector) continue;
            const reach = advancing ? 1400 : 700;
            if (Math.hypot(b.gx - other.gx, b.gy - other.gy) > reach) continue;
            const otherLength = remaining(other);
            if (otherLength <= 24) continue;
            const vx = (other.gx - other.x) / otherLength, vy = (other.gy - other.y) / otherLength;
            if (ux * vx + uy * vy < .88) continue;
            // Both groups use the same bisector so a pair cannot wait on each other.
            const sx = ux + vx, sy = uy + vy, norm = Math.hypot(sx, sy);
            const dx = b.x - other.x, dy = b.y - other.y;
            if (Math.abs(dx * sy - dy * sx) > 1200 * norm) continue;
            const lag = (dx * sx + dy * sy) / norm;
            if (lag > neighbor && hasCompanions(w, other)) neighbor = lag;
        }

        const ownGap = memberGap(local), peerGap = neighborGap(neighbor);
        const gap = Math.max(ownGap, peerGap);
        let wait = this.waits.get(b.id);
        if (gap <= 0) {
            if (wait) this.waits.delete(b.id);
            return false;
        }
        if (!wait) {
            if (gap <= 1) return false;
            wait = {started: w.tick, lastGain: w.tick, bestGap: gap, released: false};
            this.waits.set(b.id, wait);
            if (ownGap >= peerGap) this.stats.memberWaits++;
            else this.stats.neighborWaits++;
        }
        if (wait.released) return false;
        if (gap < wait.bestGap - .1) {
            wait.bestGap = gap;
            wait.lastGain = w.tick;
        }
        // A stalled follower must not continually re-arm the same hold. Rejoin
        // once the group has closed the gap or takes a different order.
        if (w.tick - wait.lastGain >= 90 || w.tick - wait.started >= 450) {
            wait.released = true;
            this.stats.timeoutReleases++;
            return false;
        }
        this.stats.heldUpdates++;
        return true;
    }
}
