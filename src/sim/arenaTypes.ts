import type { Faction, Kind } from './types';
export type { Faction, Kind };
export const kinds: Kind[] = ['line_infantry','guard_grenadier','cuirassier','bannerman','field_cannon'];
export type Scale = 600 | 1200 | 1800;
export const scales: Scale[] = [600,1200,1800];
export const TICKS = 30;
export type Action = 'stand'|'march'|'run'|'aim'|'load'|'thrust'|'recoil';
export interface Soldier {
    id: number; faction: Faction; kind: Kind; company: number; x: number; y: number;
    vx: number; vy: number; hp: number; target: number; cooldown: number; face: number;
    moving: boolean; pose: Action; hitAt: number; firedAt: number; stride: number;
    homeY: number; speed: number; charge: boolean;
}
export interface BattleEvent {
    type: 'fire'|'hit'|'death'|'impact'|'slash';
    x: number; y: number; dx: number; dy: number; faction: Faction; kind: Kind;
    explosive: boolean; unitId: number;
}
export interface Round { x:number; y:number; tx:number; ty:number; age:number; duration:number; gun:Soldier }

