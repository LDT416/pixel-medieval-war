import type { Faction, Kind } from './types';
export type { Faction, Kind };
export const kinds: Kind[] = ['line_infantry','guard_grenadier','cuirassier','bannerman','field_cannon'];
export type Scale = 600 | 1200 | 1800;
export const scales: Scale[] = [600,1200,1800];
export const TICKS = 30;
export type Action = 'stand'|'march'|'run'|'aim'|'load'|'thrust'|'recoil';
/** 连队队形：线列火力最强，纵队行军快，方阵克骑兵但怕炮。 */
export type Formation = 'line'|'column'|'square'|'battery'|'wedge'|'staff';
export type Order = 'hold'|'advance'|'assault'|'charge'|'reserve'|'rally';
export type Status = 'steady'|'shaken'|'rout'|'gone';
export type Trait = 'aggressive'|'cautious'|'cunning'|'steadfast';
export type Weather = 'clear'|'rain'|'fog';
export type Posture = 'attack'|'defend';

export interface Soldier {
    id: number; faction: Faction; kind: Kind; company: number; slot: number;
    x: number; y: number; vx: number; vy: number; hp: number;
    face: number; moving: boolean; pose: Action; hitAt: number; firedAt: number; fireAt: number;
    stride: number; speed: number; cooldown: number; foe: number;
    aimTarget:number; aimX:number; aimY:number; rangeError:number; shotsOnTarget:number;
    px:number; py:number; turnFrames:number; marchUntil:number; staff:boolean; officer:boolean; diedAt:number; escaped:boolean; general: boolean; jx: number; jy: number;
}
export interface Company {
    id: number; faction: Faction; kind: Kind; name: string; members: Soldier[]; alive: number; peak: number;
    x: number; y: number; hx: number; hy: number; gx: number; gy: number; homeX: number; homeY: number;
    cavalryDistances:Map<number,number>; lastHorse:number; leftSquare:number; formedSquareAt:number;
    chargeOpponent:number; lastMelee:number; contactId:number; contactAt:number; blownUntil:number;
    relocated:boolean; limbered:boolean; deployUntil:number; initialFront:number;
    vx:number; vy:number; capacity:number; lastShrink:number; margin:number; formation: Formation; formUntil: number; files: number; ranks: number;
    order: Order; status: Status; morale: number; base: number;
    target: number; forced: number; reloadAt: number; hitChance: number;
    engaged: boolean; checkedAt: number; chargeAt: number;
    /** 0 一线 · 1 二线 · 2 近卫预备队 · 3 骑兵 · 4 炮兵 · 5 参谋部 · 6 据点守军 · 7 援军 */
    line: number;
    losses:number; volleys:number; routs:number; charges:number; captures:number; wooded:boolean; rallies:number; kills: number; underFire: number; speed: number; colors: number; rallied: number;
}
export interface General { faction: Faction; name: string; title: string; trait: Trait; unit: Soldier | null; company: number; alive: boolean }
export interface Sample {tick:number; odds:number; eff:[number,number]; morale:[number,number]}
export interface TurningPoint {tick:number; kind:"decisive"|"swing"; delta:number; from:number; to:number; causes:News[]}
export interface News { odds:number; tick: number; text: string; faction: Faction | -1; x: number; y: number; weight: number }
export interface BattleEvent {
    endX?:number; endY?:number; struck?:boolean;
    type: 'fire'|'hit'|'death'|'impact'|'bounce'|'slash';
    x: number; y: number; dx: number; dy: number; faction: Faction; kind: Kind;
    explosive: boolean; unitId: number;
}
/** 实心弹：先抛物线飞行，落地后沿弹道弹跳滚动，沿途犁倒一串人。 */
export interface Round {
    x: number; y: number; tx: number; ty: number; dx: number; dy: number;
    age: number; duration: number; roll: number; rolled: number; speed: number;
    gun: Soldier; faction: Faction; company: number; kills: number; touched: number[];
}
export interface Reinforcement { faction: Faction; tick: number; arrived: boolean; count: number; name: string }

export const TRAITS: Record<Trait, { label: string; text: string }> = {
    aggressive: { label: '激进', text: '炮火准备短，频繁刺刀冲锋，骑兵求战心切' },
    cautious: { label: '谨慎', text: '长时间炮击，多一个炮兵连，只在敌军动摇时出击' },
    cunning: { label: '狡诈', text: '骑兵迂回侧翼，专挑薄弱处下手' },
    steadfast: { label: '坚毅', text: '步兵士气更高，伤亡惨重仍不易溃散' }
};
export const WEATHER: Record<Weather, { label: string; text: string }> = {
    clear: { label: '晴', text: '视野开阔，炮弹在硬地上弹跳得又远又狠' },
    rain: { label: '雨后泥泞', text: '三成火枪哑火，炮弹陷进泥里滚不远，行军变慢' },
    fog: { label: '晨雾', text: '视距缩短，炮兵很难远距离命中' }
};
