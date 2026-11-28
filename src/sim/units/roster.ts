import type {Faction,Kind} from '../types';
import type {Company,Formation} from '../arenaTypes';
import {PACE} from '../scale';
import {unitTypes} from './unitTypes';
interface VariantSpec {
    base:Kind;name:readonly [string,string];pace:number;
    formationTime?:number;travelFatigue?:number;restRecovery?:number;setupTicks?:number;
}
export const variants={
    voltigeur:{base:'line_infantry',name:['轻步兵连','轻步兵连'],pace:1.025,formationTime:.8},
    rifles:{base:'line_infantry',name:['来复枪连','第95来复枪连'],pace:1,restRecovery:1.2},
    lancer:{base:'cuirassier',name:['波兰枪骑兵连','枪骑兵连'],pace:1,restRecovery:.85},
    hussar:{base:'cuirassier',name:['骠骑兵连','轻骑兵连'],pace:1.08,travelFatigue:.8},
    horse_battery:{base:'field_cannon',name:['骑炮兵连','皇家骑炮兵连'],pace:1.6,setupTicks:45},
    howitzer:{base:'field_cannon',name:['榴弹炮连','榴弹炮连'],pace:.95}
} as const satisfies Record<string,VariantSpec>;
export type Variant=keyof typeof variants;
type CompanyType=Pick<Company,'kind'|'variant'>;
function variantSpec(c:CompanyType):VariantSpec|undefined{return c.variant?variants[c.variant]:undefined;}
export function formationTicks(c:CompanyType,formation:Formation,shaken:boolean){
    const profile=unitTypes[c.kind].formation;
    const ticks=formation==='square'?profile.squareTicks:profile.changeTicks;
    return Math.round(ticks*(variantSpec(c)?.formationTime??1)*(shaken?1.5:1));
}
export function setupTicks(c:CompanyType){return variantSpec(c)?.setupTicks??PACE.limberTicks;}
export function travelFatigue(c:CompanyType){return variantSpec(c)?.travelFatigue??1;}
export function restRecovery(c:CompanyType){return variantSpec(c)?.restRecovery??1;}
export function selectVariant(kind:Kind,faction:Faction,line:number,ordinal:number):Variant|null{
    switch(unitTypes[kind].group){
        case 'line':return ordinal%6===2?'voltigeur':ordinal===5&&faction===1?'rifles':null;
        case 'mounted':return line===5?null:ordinal===1?'hussar':ordinal===2&&faction===0?'lancer':null;
        case 'artillery':return ordinal===0?(faction===0?'horse_battery':'howitzer'):ordinal===1?(faction===0?'howitzer':'horse_battery'):null;
        default:return null;
    }
}
