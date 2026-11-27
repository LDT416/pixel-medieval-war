import type { Faction } from './types';
import type { Rng } from './rng';

/** 战场尺寸（模拟像素）。渲染层按 0.05 换算：320 × 160 场景单位。 */
export const WIDTH = 6400, HEIGHT = 3200, CELL = 16;
export const CX = WIDTH / 2, CY = HEIGHT / 2;
/** 双方主阵线到场地中线的距离。 */
export const LINE_GAP = 950;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Grove { x: number; y: number; r: number }
export interface Layout {
    seed: number;
    /** 山脊归属方（-1 表示开阔遭遇战，无山脊）。 */
    ridgeOwner: Faction | -1; ridgeX: number; ridgeWidth: number;
    farm: Rect | null; farmOwner: Faction | -1;
    woods: Grove[];
}
export let layout: Layout = { seed: 0, ridgeOwner: -1, ridgeX: CX, ridgeWidth: 330, farm: null, farmOwner: -1, woods: [] };
export function setLayout(l: Layout) { layout = l; }

export function createLayout(rng: Rng, defender: Faction | -1): Layout {
    const l: Layout = { seed: rng.next() * 100, ridgeOwner: defender, ridgeX: CX, ridgeWidth: 300 + rng.int(0, 80), farm: null, farmOwner: -1, woods: [] };
    if (defender >= 0) {
        const face = defender ? -1 : 1;
        l.ridgeX = CX - face * (LINE_GAP - 70);
        if (rng.next() < .8) {
            l.farm = { x: CX - face * (LINE_GAP - 380), y: CY + rng.int(-650, 650), w: 190, h: 140 };
            l.farmOwner = defender;
        }
    } else if (rng.next() < .65) {
        l.farm = { x: CX + rng.int(-120, 120), y: CY + rng.int(-500, 500), w: 190, h: 140 };
        l.farmOwner = rng.next() < .5 ? 0 : 1;
    }
    const groves = rng.int(1, 3);
    for (let i = 0; i < groves; i++) {
        const top = (i + rng.int(0, 1)) % 2 === 0;
        l.woods.push({ x: CX + rng.int(-750, 750), y: top ? rng.int(260, 640) : HEIGHT - rng.int(260, 640), r: rng.int(170, 290) });
    }
    return l;
}
export function ridgeLine(y: number) { return layout.ridgeX + 80 * Math.sin(y * .0016 + layout.seed); }
/** 0..1 的山脊高度，模拟与渲染共用。 */
export function ridge(x: number, y: number) {
    if (layout.ridgeOwner < 0) return 0;
    const d = (x - ridgeLine(y)) / layout.ridgeWidth;
    return Math.exp(-d * d) * (.82 + .18 * Math.sin(y * .0023 + layout.seed * 2));
}
export function inRect(r: Rect | null, x: number, y: number, pad = 0) {
    return !!r && Math.abs(x - r.x) < r.w / 2 + pad && Math.abs(y - r.y) < r.h / 2 + pad;
}
export function inWoods(x: number, y: number, pad = 0) {
    for (const g of layout.woods) if ((x - g.x) ** 2 + (y - g.y) ** 2 < (g.r + pad) ** 2) return true;
    return false;
}
/** 命中率系数：农庄石墙 0.35，树林 0.6。 */
export function coverAt(x: number, y: number) {
    if (inRect(layout.farm, x, y, 12)) return .35;
    if (inWoods(x, y)) return .6;
    return 1;
}
/** 是否躲在己方山脊的反斜面上（敌方炮弹会砸在山脊上弹不过来）。 */
export function behindCrest(x: number, y: number, faction: Faction) {
    if (layout.ridgeOwner !== faction) return false;
    const behind = (ridgeLine(y) - x) * (faction ? -1 : 1);
    return behind > 15 && behind < 460;
}
export function terrainText(l: Layout, names: [string, string]) {
    const parts: string[] = [];
    if (l.ridgeOwner >= 0) parts.push(`${names[l.ridgeOwner === 1 ? 1 : 0]}据守一道山脊，可藏在反斜面躲避炮击`);
    else parts.push('开阔原野，双方正面遭遇');
    if (l.farm) parts.push(`${names[l.farmOwner === 1 ? 1 : 0]}占据石墙农庄`);
    if (l.woods.length) parts.push(`侧翼有 ${l.woods.length} 片树林，骑兵难以通行`);
    return parts.join('；');
}
