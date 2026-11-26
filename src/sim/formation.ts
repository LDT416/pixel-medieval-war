import type { Formation, Faction } from './types';
export function slotOffset(slot: number, count: number, form: Formation, f: Faction) {
    const ranks = form === 'line' ? Math.min(3, count) : Math.ceil(Math.sqrt(count) * .66);
    const files = Math.ceil(count / ranks), gap = form === 'phalanx' ? 12 : form === 'line' ? 16 : 23;
    return { x: (Math.floor(slot / files) - (ranks - 1) / 2) * gap * (f === 0 ? -1 : 1), y: (slot % files - (files - 1) / 2) * gap };
}
