import {KINDS} from '../sim/config';
import type {Kind,Faction} from '../sim/types';
export const artPath=(name:string)=>'./art/'+name+'.webp';
export function portraitKey(k:Kind,f:Faction){
    return 'portrait_'+(k==='line_infantry'?(f?'line_gb':'line_fr'):k);
}
const files=['cover_1815','portrait_line_fr',...KINDS.filter(k=>k!=='supply_wagon').map(k=>portraitKey(k,1)),
    ...['oak','beech','spruce','bush','starfort','farmhouse','windmill','cottage','redoubt'].map(k=>'scenery_'+k)];
export const artwork=new Map<string,HTMLImageElement>();
export let artRevision=0;
export const preloaded=Promise.all(files.map(async key=>{
    const img=new Image();img.src=artPath(key);
    try{await img.decode();artwork.set(key,img);artRevision++;}catch{/* Individual assets have local drawing or text fallbacks. */}
}));
