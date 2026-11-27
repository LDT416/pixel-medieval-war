import type {Kind} from './arenaTypes';

export const PACE={
    footMarch:64, guardMarch:66, footRush:114, footFlee:90,
    horseWalk:70, horseTrot:140, horseSprint:235, sprintTicks:120,
    wagon:60, courier:200, maxFatiguePenalty:.15, strideLength:32,
    deploymentTicks:360, limberTicks:75
} as const;
export const RANGE={musket:420,effective:230,scatter:320,round:2500} as const;
export const marchSpeed:Record<Kind,number>={
    line_infantry:PACE.footMarch,guard_grenadier:PACE.guardMarch,bannerman:PACE.footMarch,
    cuirassier:PACE.horseTrot,field_cannon:PACE.wagon
};
