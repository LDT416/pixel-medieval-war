import type { MapId, Structure, StructureType } from './types';
import { Rng } from './rng';
export const WIDTH = 4800, HEIGHT = 1760, CELL = 16, COLS = 300, ROWS = 110;
export const bridgeYs = [520, 1240];
export function riverX(y: number) { return 2360 + Math.sin(y / 312 + .7) * 114 + Math.sin(y / 137) * 32 + y * .045; }
export const MAPS:Record<MapId,string>={darkwood:'幽暗密林古道',gorge:'铁血大草原',twin:'双桥血河与林谷'};
export function riverWidth(y:number,map:MapId='twin'){return map==='twin'?208+Math.sin(y/165)*26+Math.cos(y/93)*12:0;}
export function shoreAt(x:number,y:number,map:MapId,center=riverX(y),half=riverWidth(y,map)/2){return half?Math.abs(x-center)-half:WIDTH;}
export function water(x:number,y:number,map:MapId='twin') {return shoreAt(x,y,map)<0;}
export function ford(y:number) {return Math.abs(y-740)<52 || Math.abs(y-1380)<54;}
export function bridgeSize(y:number,map:MapId='twin',at=riverX(y)) {
    let left=at,right=at;
    for(let offset=-42;offset<=42;offset+=14) {
        let a=at,b=at;
        while(a>0 && water(a,y+offset,map)) a-=8;
        while(b<WIDTH && water(b,y+offset,map)) b+=8;
        left=Math.min(left,a);right=Math.max(right,b);
    }
    return {x:(left+right)/2,w:right-left+48};
}
export function createMap(map:MapId='twin'): Structure[] {
    const result: Structure[] = [], rng = new Rng(21812);
    function place(type: StructureType, x: number, y: number, w: number, h: number, hp: number, faction: Structure['faction'] = -1) { result.push({
        id: result.length + 1, type, x, y, w, h, hp, maxHp: hp, faction
    }); }
    if(map==='twin')for(const y of bridgeYs){const b=bridgeSize(y,map);place('bridge',b.x,y,b.w,116,3600);}
    for (const f of [0, 1] as const) {
        const x = f === 0 ? 610 : 4190, d = f === 0 ? 1 : -1;
        place('keep', x, 880, 210, 170, 6500, f);
        place('gate', x + d * 175, 880, 40, 82, 1500, f);
        for (const sy of [-1, 1]) {
            place('wall', x + d * 175, 880 + sy * 95, 40, 112, 2100, f);
            place('wall', x + d * 84, 880 + sy * 150, 158, 34, 2100, f);
            place('tower', x + d * 175, 880 + sy * 152, 65, 66, 1450, f);
        }
    }

    for(const f of [0,1] as const){
        const d=f?-1:1,base=f?4190:610;
        place('house',base-d*110,650,66,50,520,f);
        place('wheat',base,640,100,65,400,f);
        for(let i=0;i<34;i++) place('tree',base-d*(210+rng.int(0,140)),600+i*13,26,25,65);
    }
    const step=map==='darkwood'?43:map==='twin'?77:170;
    for(let x=1320;x<3480;x+=step)for(let y=30;y<1740;y+=step){
        const tx=x+rng.int(-8,8),ty=y+rng.int(-8,8);
        if([520,880,1240].some(l=>Math.abs(ty-l)<(map==='darkwood'?44:85))||water(tx,ty,map))continue;
        if(map==='gorge'&&rng.next()>.08||map==='twin'&&Math.abs(tx-2400)>590)continue;
        place('tree',tx,ty,step===43?45:34,step===43?45:28,75);
    }
    return result;
}
