import {artPath,portraitKey} from './artLoader';
import {UNITS} from '../sim/config';
import type {Kind,Faction} from '../sim/types';
export function portrait(k:Kind,f:Faction){
    const img=new Image();img.alt=UNITS[k].name;img.className='portrait';img.src=artPath(portraitKey(k,f));
    img.onerror=()=>{img.hidden=true;};return img;
}
