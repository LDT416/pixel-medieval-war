import { inRect, riverAt, type Layout, type Objective } from './maps';
import { treesFor } from './sceneryLayout';
import type { Point } from './types';
import type { Company } from './arenaTypes';
import type { SimWorld } from './world';
import { guard, lineTroop } from './units/abilities';

// The center must remain inside the radius used by CampaignObjectives.update.
export const objectiveClaimRadius = { bridge: 135, farm: 158, ridge: 230 } as const;
const rings = [.40, .60, .75, .88, .98];
const waitingRings = [1.12, 1.40, 1.75, 2.15, 2.65, 3.25];
const directions = Array.from({ length: 32 }, (_, index) => {
    const angle = index * Math.PI / 16;
    return { x: Math.cos(angle), y: Math.sin(angle) };
});

function segmentDistanceSq(x: number, y: number, a: Point, b: Point) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return (x - a.x - dx * along) ** 2 + (y - a.y - dy * along) ** 2;
}

function touchesRoad(layout: Layout, x: number, y: number, clearance: number) {
    for (const road of layout.roads) {
        const limit = (road.width / 2 + clearance) ** 2;
        for (let i = 1; i < road.points.length; i++) {
            if (segmentDistanceSq(x, y, road.points[i - 1], road.points[i]) <= limit) return true;
        }
    }
    return false;
}

function inPassage(layout: Layout, objective: Objective, x: number, y: number, clearance: number, hasRoad: boolean) {
    if (touchesRoad(layout, x, y, clearance)) return true;
    for (const bridge of layout.bridges) {
        if (inRect(bridge, x, y, clearance)) return true;
    }
    // Farm roads terminate at the gate and bridge roads can terminate at the bank.
    // Keep the continuation across the landmark clear, including on maps without a road.
    return (objective.kind !== 'ridge' || !hasRoad) && Math.abs(y - objective.y) <= 18 + clearance;
}

/** True only when a stationary footprint would obstruct local traffic at this landmark. */
export function blocksObjectivePassage(layout: Layout, objective: Objective, position: Point, clearance = 24) {
    const radius = objectiveClaimRadius[objective.kind];
    if ((position.x - objective.x) ** 2 + (position.y - objective.y) ** 2 >= (radius + clearance) ** 2) return false;
    return inPassage(layout, objective, position.x, position.y, clearance,
        objective.kind === 'ridge' && touchesRoad(layout, objective.x, objective.y, radius));
}

interface OccupiedStop extends Point { clearance?: number }

function findStop(layout: Layout, objective: Objective, approachingFrom: Point, clearance: number,
    occupied: readonly OccupiedStop[], searchRings: readonly number[]): Point | null {
    const radius = objectiveClaimRadius[objective.kind];
    const reach = radius * searchRings[searchRings.length - 1];
    const nearTrees = treesFor(layout).filter(tree =>
        (tree.x - objective.x) ** 2 + (tree.y - objective.y) ** 2 <= (reach + clearance + tree.size * 6.8) ** 2);
    const hasRoad = objective.kind === 'ridge' && touchesRoad(layout, objective.x, objective.y, radius);
    const river = layout.river;
    const incomingBank = approachingFrom.x - riverAt(approachingFrom.y, layout);
    const requireSameBank = objective.kind === 'bridge' && river.points.length >= 2 && Math.abs(incomingBank) > river.width / 2;
    let best: Point | null = null, bestDistance = Infinity;
    for (const fraction of searchRings) {
        for (const dir of directions) {
            const x = objective.x + radius * fraction * dir.x;
            const y = objective.y + radius * fraction * dir.y;
            if (x < clearance || x > layout.width - clearance || y < clearance || y > layout.height - clearance) continue;
            const distance = (x - approachingFrom.x) ** 2 + (y - approachingFrom.y) ** 2;
            if (distance >= bestDistance || inPassage(layout, objective, x, y, clearance, hasRoad)) continue;
            if (requireSameBank && (x - riverAt(y, layout)) * incomingBank <= 0) continue;
            let touchesRiver = false;
            for (let i = 1; i < river.points.length; i++) {
                if (segmentDistanceSq(x, y, river.points[i - 1], river.points[i]) < (river.width / 2 + clearance) ** 2) {
                    touchesRiver = true;
                    break;
                }
            }
            if (touchesRiver) continue;
            if (layout.farms.some(farm => inRect(farm, x, y, clearance))) continue;
            if (nearTrees.some(tree => (x - tree.x) ** 2 + (y - tree.y) ** 2 < (clearance + tree.size * 6.8) ** 2)) continue;
            if (occupied.some(stop => (x - stop.x) ** 2 + (y - stop.y) ** 2 < (clearance + (stop.clearance ?? clearance) + 4) ** 2)) continue;
            best = { x, y };
            bestDistance = distance;
        }
        // Overflow queues fill the closest available ring before spilling farther out.
        if (best && searchRings === waitingRings) break;
    }
    return best;
}

/** Choose a dry, off-road stop inside the capture area. Call once when assigning a destination. */
export function objectiveStop(layout: Layout, objective: Objective, approachingFrom: Point, clearance = 24,
    occupied: readonly OccupiedStop[] = []): Point | null {
    return findStop(layout, objective, approachingFrom, clearance, occupied, rings);
}

/** Overflow stays outside the capture area and leaves the bridge on the incoming bank free. */
export function objectiveWaitingStop(layout: Layout, objective: Objective, approachingFrom: Point, clearance = 24,
    occupied: readonly OccupiedStop[] = []): Point | null {
    return findStop(layout, objective, approachingFrom, clearance, occupied, waitingRings);
}

export interface ObjectiveParking extends Point {
    site: number; clearance: number; offsets: [number, number][];
    battalionX?: number; battalionY?: number;
}

export function parkingAtHome(c: Company) {
    const p = c.objectiveParking;
    return p && (c.order === 'hold' || c.order === 'reserve') && c.homeX === p.x && c.homeY === p.y &&
        c.formation !== 'square' && !c.engaged ? p : undefined;
}

/** A stationary foot company uses centered rows. Reserve enough room for every member, including jitter and arrival tolerance. */
export function reserveObjectiveStop(w: SimWorld, c: Company, site: Objective, from: Point): ObjectiveParking | undefined {
    if ((!lineTroop(c) && !guard(c)) || c.line === 5) return;
    const active = c.objectiveParking;
    if (active?.site === site.id && parkingAtHome(c)) return active;
    const count = Math.max(1, c.capacity, c.members.length);
    const columns = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / columns);
    const offsets: [number, number][] = [];
    let extent = 0;
    for (let i = 0; i < count; i++) {
        const lat = (i % columns - (columns - 1) / 2) * 14;
        const depth = (Math.floor(i / columns) - (rows - 1) / 2) * 14;
        offsets.push([lat, depth]);
        extent = Math.max(extent, Math.hypot(lat, depth));
    }
    // A 4.5px body, up to sqrt(8)px positional jitter and a 3px movement dead zone.
    const clearance = Math.ceil(extent + 11);
    const occupied: ObjectiveParking[] = [];
    for (const other of w.companies) {
        const p = other.objectiveParking;
        if (other !== c && other.faction === c.faction && other.alive && other.status !== 'rout' && p) occupied.push(p);
    }
    const stop = objectiveStop(w.layout, site, from, clearance, occupied) ?? objectiveWaitingStop(w.layout, site, from, clearance, occupied);
    if (!stop) return;
    const b = w.battalions[c.battalion];
    return c.objectiveParking = { ...stop, site: site.id, clearance, offsets, battalionX: b?.homeX, battalionY: b?.homeY };
}
