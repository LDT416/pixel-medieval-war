import type {Faction,Kind} from '../types';
import {unitTypes} from './unitTypes';
export const variants={
    voltigeur:{base:'line_infantry',name:['轻步兵连','轻步兵连'],pace:1.025},
    rifles:{base:'line_infantry',name:['来复枪连','第95来复枪连'],pace:1},
    lancer:{base:'cuirassier',name:['波兰枪骑兵连','枪骑兵连'],pace:1},
    hussar:{base:'cuirassier',name:['骠骑兵连','轻骑兵连'],pace:1.06},
    horse_battery:{base:'field_cannon',name:['骑炮兵连','皇家骑炮兵连'],pace:1.08},
    howitzer:{base:'field_cannon',name:['榴弹炮连','榴弹炮连'],pace:.95}
} as const;
export type Variant=keyof typeof variants;
export function selectVariant(kind:Kind,faction:Faction,line:number,ordinal:number):Variant|null{
    switch(unitTypes[kind].group){
        case 'line':return ordinal===2?'voltigeur':ordinal===5&&faction===1?'rifles':null;
        case 'mounted':return line===5?null:ordinal===1?'hussar':ordinal===2&&faction===0?'lancer':null;
        case 'artillery':return ordinal===1?'horse_battery':ordinal===2?'howitzer':null;
        default:return null;
    }
}
