import type { Faction, MapId, Point, Structure, StructureType } from './types';
import { Rng } from './rng';
export const WIDTH = 5600, HEIGHT = 2200, CELL = 16, COLS = Math.ceil(WIDTH / CELL), ROWS = Math.ceil(HEIGHT / CELL);
export const bridgeYs = [660, 1540];
export const MAPS: Record<MapId, string> = { gorge: '滑铁卢乡间高道', darkwood: '阿登自然橡林', twin: '双桥血河与星堡' };
export function lanesForMap(map: MapId) { return map === 'twin' ? bridgeYs : [660, 1100, 1540]; }
export function riverX(y: number) { return WIDTH / 2 + Math.sin((y - 1100) / 330) * 105 + Math.sin(y / 161) * 44; }
export function riverWidth(y: number, map: MapId = 'twin') { return (map === 'twin' ? 184 : map === 'darkwood' ? 60 : 44) * (1 + .12 * Math.sin(y / 159)); }
export function shoreAt(x: number, y: number, map: MapId, center = riverX(y), half = riverWidth(y, map) / 2) { return Math.abs(x - center) - half; }
export function water(x: number, y: number, map: MapId = 'twin') { return shoreAt(x, y, map) < 0; }
export function bridgeSize(y: number, map: MapId = 'twin') {
    let left = Infinity, right = -Infinity;
    for (let dy = -56; dy <= 56; dy += 8) {
        const x = riverX(y + dy), r = riverWidth(y + dy, map) / 2;
        left = Math.min(left, x - r);
        right = Math.max(right, x + r);
    }
    return { x: (left + right) / 2, w: right - left + 82 };
}
export function roadY(x: number, lane: number) {
    const progress = Math.min(1, Math.max(0, (Math.min(x, WIDTH - x) - 730) / 900));
    const bend = Math.min(1, Math.abs(x - riverX(lane)) / 380) * progress;
    return 1100 + (lane - 1100) * progress + bend * (Math.sin(x / 220 + lane / 480) * 33 + Math.sin(x / 480) * 46);
}
export function siteCapacity(site: Structure) { return site.type === 'keep' ? 120 : site.type === 'bridge' ? 48 : 30; }
export function rampartSlot(site: Structure, index: number, f: Faction): Point {
    const slot = index % siteCapacity(site), sign = f === 0 ? 1 : -1;
    let x: number, y: number;
    if (site.type === 'keep') {
        const wall = Math.floor(slot / 30), n = slot % 30;
        if (wall === 0 || wall === 3) {
            x = (wall === 0 ? 1 : -1) * sign * (157 + ((n % 3) - 1) * 10);
            y = (Math.floor(n / 3) - 4.5) * 16;
        }
        else {
            x = (Math.floor(n / 3) - 4.5) * 19;
            y = (wall === 1 ? -121 : 115) + (n % 3 - 1) * 9;
        }
    }
    else if (site.type === 'bridge') {
        x = (Math.floor(slot / 6) - 3.5) * site.w / 9;
        y = (slot % 6 - 2.5) * 10;
    }
    else {
        x = (slot % 10 - 4.5) * site.w / 12;
        y = (Math.floor(slot / 10) - 1) * 10;
    }
    return { x: site.x + x, y: site.y + y };
}
export function onHighGround(s: Structure, p: Point) {
    const x = Math.abs(p.x - s.x), y = p.y - s.y;
    if (s.type === 'keep')
        return (Math.abs(x - 157) <= 22 && Math.abs(y) < 88) || (x < 103 && (Math.abs(y + 121) < 19 || Math.abs(y - 115) < 19));
    if (s.type === 'bridge')
        return x <= s.w / 2 && Math.abs(y) <= s.h / 2;
    return (s.type === 'farmhouse' || s.type === 'redoubt') && x < s.w * .46 && Math.abs(y) < s.h * .26;
}
function valueNoise(x: number, y: number, seed: number) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const sample = (a: number, b: number) => { let h = Math.imul(a + seed, 374761393) ^ Math.imul(b, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const smooth = (n: number) => n * n * (3 - 2 * n), u = smooth(x - ix), v = smooth(y - iy);
    return (sample(ix, iy) * (1 - u) + sample(ix + 1, iy) * u) * (1 - v) + (sample(ix, iy + 1) * (1 - u) + sample(ix + 1, iy + 1) * u) * v;
}
export function createMap(map: MapId = 'twin'): Structure[] {
    const result: Structure[] = [], rng = new Rng(map === 'darkwood' ? 21812 : map === 'twin' ? 9451 : 7193);
    function place(type: StructureType, x: number, y: number, w: number, h: number, hp: number, faction: Structure['faction'] = -1) {
        result.push({ id: result.length + 1, type, x, y, w, h, hp, maxHp: hp, faction });
    }
    for (const y of lanesForMap(map)) {
        const b = bridgeSize(y, map);
        place('bridge', b.x, y, b.w, 88, 2200);
    }
    for (const f of [0, 1] as const) {
        const x = f ? 4950 : 650, d = f ? -1 : 1;
        place('keep', x, 1100, 560, 520, 7500, f);
        for (const y of [730, 1470])
            place('barracks', x - d * 65, y, 300, 240, 1800, f);
    }
    place('farmhouse', map === 'gorge' ? 2360 : 2210, 897, 165, 118, 2100);
    place('redoubt', 3190, 1350, 146, 87, 1200);
    const clearings = result.slice(), seed = map === 'darkwood' ? 13 : map === 'twin' ? 31 : 47;
    for (let i = 0; i < 3800; i++) {
        const x = rng.int(25, WIDTH - 25), y = rng.int(25, HEIGHT - 25);
        const edge = Math.min(x, WIDTH - x, y, HEIGHT - y);
        const noise = .62 * valueNoise(x / 410, y / 330, seed) + .27 * valueNoise(x / 150, y / 180, seed) + .11 * valueNoise(x / 53, y / 66, seed);
        if (noise + Math.max(0, 1 - edge / 210) * .54 < (map === 'darkwood' ? .50 : map === 'twin' ? .59 : .64))
            continue;
        if (water(x, y, map) || clearings.some(s => Math.abs(s.x - x) < s.w / 2 + 40 && Math.abs(s.y - y) < s.h / 2 + 44))
            continue;
        if (lanesForMap(map).some(l => Math.abs(y - roadY(x, l)) < (l === 1100 ? 80 : 46)))
            continue;
        if (Math.min(Math.abs(x - 1050), Math.abs(x - 4550)) < 230 && Math.abs(y - 1100) < 440)
            continue;
        if (result.some(s => s.type === 'tree' && (s.x - x) ** 2 + (s.y - y) ** 2 < 26 ** 2))
            continue;
        const roll = rng.next(), scale = .75 + rng.next() * .6;
        place('tree', x, y, 27 * scale, 24 * scale, 75);
        Object.assign(result[result.length - 1], { treeArt: roll < .55 ? 'oak' : roll < .8 ? 'beech' : roll < .92 ? 'spruce' : 'bush', scale, flip: rng.next() < .5 });
    }
    return result;
}
