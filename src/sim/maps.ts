import type { MapId, Structure, StructureType } from './types';
import { Rng } from './rng';
export const WIDTH = 3840, HEIGHT = 2160, CELL = 16, COLS = 240, ROWS = 135;
export const bridgeYs = [655, 1470];
export function riverX(y: number) { return 1920 + Math.sin(y / 312 + .7) * 114 + Math.sin(y / 137) * 32 + y * .045; }
export const MAPS: Record<MapId,string> = {twin:'双桥血河', bottleneck:'绝望孤桥', isles:'群岛浅滩', darkwood:'黑森林古道', gorge:'铁血高地'};
export function lanes(map:MapId) {return map==='bottleneck'?[1080]:map==='isles'?[470,1080,1690]:bridgeYs;}
export function riverWidth(y: number,map:MapId='twin') { if(map==='gorge'||map==='darkwood') return 0; if(map==='isles') return 710+55*Math.sin(y/270); if(map==='bottleneck') return 100+230*Math.sin(Math.PI*y/HEIGHT)**2; return 208 + Math.sin(y / 165) * 26 + Math.cos(y / 93) * 12; }
export function shoreAt(x:number,y:number,map:MapId,center=riverX(y),half=riverWidth(y,map)/2) {
    if(!half) return WIDTH;
    const outer=Math.abs(x-center)-half;
    if(map!=='isles'||outer>50) return outer;
    const nearest=Math.min(Math.abs(y-470),Math.abs(y-1080),Math.abs(y-1690));
    return Math.max(outer,(1-Math.hypot((x-center)/153,nearest/224))*150);
}
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
    for (const y of lanes(map)) {
        if(!riverWidth(y,map)) continue;
        for(const offset of map==='isles'?[-245,245]:[0]) {
            const b=bridgeSize(y,map,riverX(y)+offset);
            place(map==='isles'?'pontoon':'bridge',b.x,y,b.w,map==='bottleneck'?190:116,map==='isles'?1200:3600);
        }
    }
    for (const f of [0, 1] as const) {
        const x = f === 0 ? 670 : 3160, d = f === 0 ? 1 : -1;
        place('keep', x, 1050, 210, 170, 6500, f);
        place('gate', x + d * 175, 1050, 40, 82, 1500, f);
        for (const sy of [-1, 1]) {
            place('wall', x + d * 175, 1050 + sy * 95, 40, 112, 2100, f);
            place('wall', x + d * 84, 1050 + sy * 150, 158, 34, 2100, f);
            place('tower', x + d * 175, 1050 + sy * 152, 65, 66, 1450, f);
        }
    }
    const clusters = [[220, 430], [620, 290], [1140, 325], [1660, 260], [2240, 230], [2740, 300], [3370, 350], [3650, 600], [290, 1450], [620, 1850], [1240, 1810], [1700, 1950], [2330, 1880], [2760, 1780], [3360, 1850], [3670, 1450], [1350, 1090], [2480, 1040], [380, 780], [3470, 925]];
    const deposits=map==='gorge'?[[850,475],[2990,475],[980,1710],[2860,1710]]:[[590,810],[3250,810],[800,1500],[3040,1500]];
    for(const [x,y] of [...deposits,...(map==='isles'?[470,1080,1690].map(y=>[riverX(y),y]):[])]) {
        place('mine',x,y,65,46,2000); result[result.length-1].stock=map==='isles'?6400:4200;
    }
    if(map==='gorge') for(const side of [-1,1]) for(let i=0;i<12;i++) place('rock',1860+side*110+rng.int(-100,100),1080+side*(160+i*51),80+rng.int(0,50),55,100000);
    if(map==='darkwood') for(let i=0;i<40;i++) clusters.push([rng.int(1130,2670),rng.int(80,2080)]);
    if(map==='bottleneck') for(const y of [96,2040]) for(const d of [-1,1]) for(let i=0;i<4;i++) clusters.push([riverX(y)+d*(60+55*i),y]);
    for (const [cx, cy] of clusters) {
        for (let i = 0; i < rng.int(24, 47); i++) {
            const x = cx + rng.int(-190, 190), y = cy + rng.int(-125, 125);
            if (!water(x, y,map) && !result.some(s => Math.abs(s.x - x) < (s.w + 20) / 2 && Math.abs(s.y - y) < (s.h + 20) / 2))
                place('tree', x, y, rng.int(18, 32), rng.int(20, 30), 70);
        }
    }
    for (const [cx, cy] of [[1090, 780], [2670, 1280], [950, 1430], [2870, 590]])
        for (let i = 0; i < 5; i++)
            place('house', cx + (i % 3) * 65 + rng.int(-10, 10), cy + Math.floor(i / 3) * 65 + rng.int(-10, 10), 46, 36, 260);
    if(map==='darkwood') for(const s of result) if(s.type==='house') s.hp=0;
    return result;
}
