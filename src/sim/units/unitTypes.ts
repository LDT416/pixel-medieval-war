import type {Kind} from '../types';
import type {Formation} from '../arenaTypes';
import {PACE} from '../scale';

export const footprints={
    foot:{a:4.5,b:4.5,mass:1},horse:{a:11,b:5.5,mass:6},gun:{a:14,b:14,mass:10}
} as const;
type Frame=keyof typeof footprints;
type Group='line'|'guard'|'mounted'|'standard'|'artillery';
interface FormationProfile {
    allowed: readonly Formation[];
    changeTicks: number;
    squareTicks: number;
}
const infantry:FormationProfile={allowed:['line','column','square'],changeTicks:55,squareTicks:58};
const guard:FormationProfile={...infantry,squareTicks:36};
const cavalry:FormationProfile={allowed:['wedge','column','staff'],changeTicks:55,squareTicks:0};
const battery:FormationProfile={allowed:['battery','column'],changeTicks:55,squareTicks:0};
interface UnitType {formation:FormationProfile;group:Group;frame:Frame;hp:number;morale:number;speed:number;value:number;capacity:number}
export const unitTypes:Record<Kind,UnitType>={
    line_infantry:{formation:infantry,group:'line',frame:'foot',hp:100,morale:66,speed:PACE.footMarch,value:1,capacity:32},
    guard_grenadier:{formation:guard,group:'guard',frame:'foot',hp:116,morale:92,speed:PACE.guardMarch,value:1.55,capacity:30},
    cuirassier:{formation:cavalry,group:'mounted',frame:'horse',hp:135,morale:76,speed:PACE.horseTrot,value:1.35,capacity:22},
    bannerman:{formation:infantry,group:'standard',frame:'foot',hp:90,morale:66,speed:PACE.footMarch,value:.6,capacity:1},
    field_cannon:{formation:battery,group:'artillery',frame:'gun',hp:230,morale:72,speed:PACE.wagon,value:9,capacity:5}
};
