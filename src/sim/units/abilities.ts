import type {Kind} from '../types';
import {unitTypes} from './unitTypes';
type Member={kind:Kind};
export const mounted=(u:Member)=>unitTypes[u.kind].group==='mounted';
export const artillery=(u:Member)=>unitTypes[u.kind].group==='artillery';
export const standard=(u:Member)=>unitTypes[u.kind].group==='standard';
export const guard=(u:Member)=>unitTypes[u.kind].group==='guard';
export const lineTroop=(u:Member)=>unitTypes[u.kind].group==='line';
