import type {Faction} from './types';
import type {SimWorld} from './world';
import {artillery} from './units/abilities';

/**
 * 炮兵阵地：部署结束时，每门炮前方筑起一道土胸墙（附柳条筐）。
 * 胸墙是真实的掩体：从正面飞来、高度低于胸墙的火枪弹、霰弹和跳弹会被泥土吃掉。
 */
export interface Emplacement {
    x: number; y: number;      // 胸墙中心
    nx: number; ny: number;    // 朝向敌方的法线
    gx: number; gy: number;    // 炮位
    faction: Faction; company: number; gun: number; built: number;
}
export const PARAPET = {half: 17, height: .7, offset: 19} as const;

export class Earthworks {
    list: Emplacement[] = [];
    /** 开战时是否已构筑过初始阵地。 */
    dug = false;
    /** 统计：胸墙挡下的弹丸数。 */
    absorbed = {musket: 0, scatter: 0, round: 0};
    reset() { this.list = []; this.dug = false; this.absorbed = {musket: 0, scatter: 0, round: 0}; }

    /** 为指定炮兵连（或全部炮兵）构筑阵地。已有阵地的炮不重复构筑。 */
    dig(w: SimWorld, only?: number) {
        for (const c of w.companies) {
            if (!artillery(c) || c.alive <= 0 || (only !== undefined && c.id !== only)) continue;
            const len = Math.hypot(c.hx, c.hy) || 1, nx = c.hx / len, ny = c.hy / len;
            for (const g of c.members) {
                if (g.hp <= 0 || this.list.some(e => e.gun === g.id && Math.hypot(e.gx - g.x, e.gy - g.y) < 30)) continue;
                this.list.push({x: g.x + nx * PARAPET.offset, y: g.y + ny * PARAPET.offset, nx, ny, gx: g.x, gy: g.y,
                    faction: c.faction, company: c.id, gun: g.id, built: w.tick});
            }
        }
    }
    /**
     * 射线（起点、单位方向、长度、高度函数）最先撞上的胸墙距离；没有则返回 Infinity。
     * 只挡从胸墙正面射来的弹丸；己方炮弹从胸墙后方高处出膛，不受影响。
     */
    block(x: number, y: number, dx: number, dy: number, range: number, height: (s: number) => number) {
        let best = Infinity;
        for (const e of this.list) {
            if (dx * e.nx + dy * e.ny >= -.2) continue;
            // 胸墙线段方向 t = (-ny, nx)。求射线与线段交点。
            const tx = -e.ny, ty = e.nx, den = dx * ty - dy * tx;
            if (Math.abs(den) < 1e-6) continue;
            const ox = e.x - x, oy = e.y - y;
            const s = (ox * ty - oy * tx) / den, u = (ox * dy - oy * dx) / den;
            if (s <= 0 || s > range || s >= best || Math.abs(u) > PARAPET.half) continue;
            if (height(s) < PARAPET.height) best = s;
        }
        return best;
    }
}
