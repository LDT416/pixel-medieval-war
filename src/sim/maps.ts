import type { MapId, Structure, StructureType } from './types';
import { Rng } from './rng';
export const WIDTH = 4800, HEIGHT = 1760, CELL = 16, COLS = 300, ROWS = 110;
export const bridgeYs = [520, 1240];
export function riverX(y: number) { return 2360 + Math.sin(y / 312 + .7) * 114 + Math.sin(y / 137) * 32 + y * .045; }
export const MAPS:Record<MapId,string>={darkwood:'阿登自然古林',gorge:'滑铁卢乡间高地',twin:'双桥血河与农庄'};
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
function valueNoise(x:number,y:number,seed:number){
    const ix=Math.floor(x),iy=Math.floor(y);
    const sample=(a:number,b:number)=>{let h=Math.imul(a+seed,374761393)^Math.imul(b,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
    const smooth=(n:number)=>n*n*(3-2*n),u=smooth(x-ix),v=smooth(y-iy);
    return (sample(ix,iy)*(1-u)+sample(ix+1,iy)*u)*(1-v)+(sample(ix,iy+1)*(1-u)+sample(ix+1,iy+1)*u)*v;
}
export function roadY(x:number,lane:number){
    const bend=Math.sin((x-2400)/230)*30+Math.sin((x-2400)/570)*42;
    return 880+(lane-880)*Math.min(1,Math.max(0,(Math.min(x,WIDTH-x)-820)/560))+bend;
}
// Farm carts meet the estate road south of the wheat before turning towards the fort.
export function supplyBend(farm:Structure,keep:Structure){
    return {x:farm.x+(keep.x-farm.x)*.33,y:farm.y+Math.min(85,(keep.y-farm.y)*.45)};
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
    }
    place('farmhouse', map==='twin'?2110:2310,780,128,92,1800);
    place('windmill',map==='twin'?2700:2550,1190,82,74,1300);
    const clearings=result.slice(), seed=map==='darkwood'?13:map==='twin'?31:47;
    for(let i=0;i<3800;i++){
        const x=rng.int(25,WIDTH-25),y=rng.int(25,HEIGHT-25);
        const edge=Math.min(x,WIDTH-x,y,HEIGHT-y);
        const noise=.62*valueNoise(x/410,y/330,seed)+.27*valueNoise(x/150,y/180,seed)+.11*valueNoise(x/53,y/66,seed);
        if(noise+Math.max(0,1-edge/210)*.54<(map==='darkwood'?.50:map==='twin'?.59:.64))continue;
        if(water(x,y,map)||clearings.some(s=>Math.abs(s.x-x)<s.w/2+40&&Math.abs(s.y-y)<s.h/2+44))continue;
        if([255,520,880,1240,1505].some(l=>Math.abs(y-roadY(x,l))<(l===880?80:46)))continue;
        if(Math.min(Math.abs(x-960),Math.abs(x-3840))<230&&Math.abs(y-880)<360)continue;
        if(result.some(s=>s.type==='tree'&&(s.x-x)**2+(s.y-y)**2<26**2))continue;
        const roll=rng.next(),scale=.75+rng.next()*.6;
        place('tree',x,y,27*scale,24*scale,75);
        Object.assign(result[result.length-1],{treeArt:roll<.55?'oak':roll<.8?'beech':roll<.92?'spruce':'bush',scale,flip:rng.next()<.5});
    }
    return result;
}
