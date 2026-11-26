import type { Faction, MapId, Point, Structure, StructureType } from './types';
import { Rng } from './rng';
export const WIDTH = 6800, HEIGHT = 2600, CELL = 16, COLS = Math.ceil(WIDTH / CELL), ROWS = Math.ceil(HEIGHT / CELL);
export const bridgeYs = [780, 1820];
export const MAPS: Record<MapId, string> = { gorge: '滑铁卢乡间高道', darkwood: '阿登自然橡林', twin: '双桥血河与星堡' };
export function lanesForMap(map: MapId) { return map === 'twin' ? bridgeYs : [780, 1300, 1820]; }
export function riverX(y: number) { return WIDTH / 2 + Math.sin((y - HEIGHT / 2) / 360) * 125 + Math.sin(y / 171) * 48; }
export function riverWidth(y: number, map: MapId = 'twin') { return (map === 'twin' ? 196 : map === 'darkwood' ? 66 : 48) * (1 + .12 * Math.sin(y / 159)); }
export function shoreAt(x: number, y: number, map: MapId, center = riverX(y), half = riverWidth(y, map) / 2) { return Math.abs(x - center) - half; }
export function water(x: number, y: number, map: MapId = 'twin') { return shoreAt(x, y, map) < 0; }
export function bridgeSize(y: number, map: MapId = 'twin') {
    let left = Infinity, right = -Infinity;
    for (let dy = -56; dy <= 56; dy += 8) {
        const x = riverX(y + dy), r = riverWidth(y + dy, map) / 2;
        left = Math.min(left, x - r);
        right = Math.max(right, x + r);
    }
    return { x: (left + right) / 2, w: right - left + 86 };
}
export function roadY(x: number, lane: number) {
    const mid = HEIGHT / 2;
    const progress = Math.min(1, Math.max(0, (Math.min(x, WIDTH - x) - 820) / 1020));
    const bend = Math.min(1, Math.abs(x - riverX(lane)) / 420) * progress;
    return mid + (lane - mid) * progress + bend * (Math.sin(x / 250 + lane / 510) * 38 + Math.sin(x / 540) * 52);
}
export function bastionOffsets(f: Faction): Point[] {
    const sign = f === 0 ? 1 : -1;
    return [
        { x: sign * 155, y: -115 },
        { x: sign * 155, y: 112 },
        { x: -sign * 145, y: -112 },
        { x: -sign * 145, y: 110 }
    ];
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
        place('bridge', b.x, y, b.w, 90, 2400);
    }
    const mid = HEIGHT / 2;
    for (const f of [0, 1] as const) {
        const x = f ? WIDTH - 720 : 720, d = f ? -1 : 1;
        place('keep', x, mid, 560, 520, 9500, f);
        const keep = result[result.length - 1];
        keep.cannonCooldowns = [35, 75, 110, 145];
        keep.cannonAim = Array.from({ length: 4 }, () => ({ x: d, y: 0, firedAt: -999 }));
        for (const dy of [-390, 390])
            place('barracks', x - d * 70, mid + dy, 300, 240, 2000, f);
        // 双方军营外围布置行军白帐篷与金黄麦垛补给堆
        place('tents', x + d * 240, mid - 490, 162, 135, 700, f);
        place('tents', x + d * 220, mid + 510, 162, 135, 700, f);
        place('haystack', x - d * 290, mid - 250, 114, 96, 500, f);
        place('haystack', x - d * 280, mid + 270, 114, 96, 500, f);
    }
    // 战场中段丰富历史乡村地标（农庄、风车、石教堂、古废墟、芦苇池塘、麦垛、沙袋炮台）
    place('farmhouse', map === 'gorge' ? 2860 : 2650, 1020, 175, 126, 2200);
    place('redoubt', 3920, 1580, 150, 92, 1400);
    place('windmill', 2260, 1680, 128, 178, 1500);
    place('windmill', 4560, 930, 128, 178, 1500);
    place('church', 4020, 990, 140, 198, 2000);
    place('ruins', 2840, 1630, 146, 128, 1600);
    place('ruins', 3840, 2080, 146, 128, 1600);
    place('pond', 2160, 560, 185, 140, 9999);
    place('pond', 4620, 2040, 185, 140, 9999);
    place('haystack', 2740, 1120, 108, 90, 450);
    place('haystack', 4160, 1060, 108, 90, 450);

    const clearings = result.slice(), seed = map === 'darkwood' ? 13 : map === 'twin' ? 31 : 47;
    for (let i = 0; i < 5200; i++) {
        const x = rng.int(25, WIDTH - 25), y = rng.int(25, HEIGHT - 25);
        const edge = Math.min(x, WIDTH - x, y, HEIGHT - y);
        const noise = .62 * valueNoise(x / 460, y / 370, seed) + .27 * valueNoise(x / 170, y / 200, seed) + .11 * valueNoise(x / 58, y / 70, seed);
        if (noise + Math.max(0, 1 - edge / 240) * .56 < (map === 'darkwood' ? .50 : map === 'twin' ? .59 : .64))
            continue;
        if (water(x, y, map) || clearings.some(s => Math.abs(s.x - x) < s.w / 2 + 44 && Math.abs(s.y - y) < s.h / 2 + 48))
            continue;
        if (lanesForMap(map).some(l => Math.abs(y - roadY(x, l)) < (l === mid ? 88 : 54)))
            continue;
        if (Math.min(Math.abs(x - 1180), Math.abs(x - (WIDTH - 1180))) < 260 && Math.abs(y - mid) < 480)
            continue;
        if (result.some(s => s.type === 'tree' && (s.x - x) ** 2 + (s.y - y) ** 2 < 28 ** 2))
            continue;
        const roll = rng.next(), scale = .82 + rng.next() * .65;
        place('tree', x, y, 24 * scale, 20 * scale, 75);
        Object.assign(result[result.length - 1], { treeArt: roll < .54 ? 'oak' : roll < .79 ? 'beech' : roll < .91 ? 'spruce' : 'bush', scale, flip: rng.next() < .5 });
    }
    return result;
}
