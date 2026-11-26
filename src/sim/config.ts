import type { Kind } from './types';
interface Definition {
    name: string;
    short: string;
    hp: number;
    damage: number;
    speed: number;
    range: number;
    reload: number;
    gold: number;
}
export const UNITS: Record<Kind, Definition> = {
    line_infantry: { name: '线列火枪连', short: '线列', hp: 65, damage: 70, speed: 1.67, range: 285, reload: 117, gold: 80 },
    guard_grenadier: { name: '熊皮帽近卫刺刀连', short: '近卫', hp: 100, damage: 78, speed: 1.72, range: 280, reload: 117, gold: 115 },
    cuirassier: { name: '胸甲重骑兵连', short: '重骑', hp: 162, damage: 84, speed: 4.55, range: 32, reload: 29, gold: 110 },
    field_cannon: { name: '野战重炮组', short: '重炮', hp: 255, damage: 122, speed: 1.20, range: 785, reload: 195, gold: 135 },
    bannerman: { name: '团旗与军鼓仪仗组', short: '旗鼓', hp: 62, damage: 0, speed: 1.85, range: 0, reload: 45, gold: 35 }
};
export const KINDS = Object.keys(UNITS) as Kind[];
export const TPS = 30;
export const strength: Record<Kind, number> = { line_infantry: 30, guard_grenadier: 24, cuirassier: 14, field_cannon: 1, bannerman: 3 };
export const rankFire = (k: Kind) => k === 'line_infantry' || k === 'guard_grenadier';
export const shelter = (t: string) => ['keep', 'bridge', 'farmhouse', 'redoubt'].includes(t);
export const formationSize = (k: Kind) => k === 'cuirassier' ? 26 : 15;
