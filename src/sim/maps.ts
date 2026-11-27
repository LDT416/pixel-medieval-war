import type { Faction, Point } from './types';
import type { Rng } from './rng';

export const CELL=16;
export type Sector=0|1|2;
export interface Rect extends Point { w:number; h:number }
export interface Grove extends Point { r:number }
export interface Corridor { points:Point[]; width:number }
export interface Bridge extends Rect { kind:'bridge'|'ford' }
export interface Ridge extends Point { width:number; length:number }
export interface Objective extends Point {
    id:number; name:string; sector:Sector; kind:'farm'|'bridge'|'ridge';
    owner:Faction|-1; heldTicks:[number,number];
}
export interface Layout {
    seed:number; width:number; height:number; lineGap:number;
    ridgeOwner:Faction|-1; ridgeX:number; ridgeWidth:number;
    farm:Rect|null; farmOwner:Faction|-1; woods:Grove[];
    farms:Rect[]; river:Corridor; roads:Corridor[]; bridges:Bridge[];
    ridges:Ridge[]; objectives:Objective[];
}
export const CAMPAIGN_SIZE={width:16000,height:8000};
const CLASSIC_SIZE={width:6400,height:3200};
type Size=typeof CLASSIC_SIZE;
function empty(size:Size):Layout {
    return {...size,seed:0,lineGap:950,ridgeOwner:-1,ridgeX:size.width/2,ridgeWidth:330,farm:null,farmOwner:-1,woods:[],
        farms:[],river:{points:[],width:0},roads:[],bridges:[],ridges:[],objectives:[]};
}
export let layout=empty(CLASSIC_SIZE);
export let WIDTH=layout.width, HEIGHT=layout.height, CX=WIDTH/2, CY=HEIGHT/2, LINE_GAP=layout.lineGap;
export function setLayout(l:Layout){
    layout=l;WIDTH=l.width;HEIGHT=l.height;CX=WIDTH/2;CY=HEIGHT/2;LINE_GAP=l.lineGap;
}
export function sectorOf(y:number,l=layout):Sector{return Math.min(2,Math.max(0,Math.floor(y*3/l.height))) as Sector;}
function landmark(l:Layout,p:Point,name:string,kind:Objective['kind'],owner:Faction|-1){
    l.objectives.push({id:l.objectives.length,name,kind,x:p.x,y:p.y,owner,sector:sectorOf(p.y,l),heldTicks:[0,0]});
}
export function riverAt(y:number,l=layout){
    const p=l.river.points;
    if(p.length<2)return -Infinity;
    const t=Math.max(0,Math.min(p.length-1,y/l.height*(p.length-1)));
    const i=Math.min(p.length-2,Math.floor(t));
    return p[i].x+(p[i+1].x-p[i].x)*(t-i);
}
/** 新地图只在开局取随机数，通行地表随后由同一份几何数据派生。 */
export function createCampaignLayout(rng:Rng,defender:Faction|-1,size:Size=CAMPAIGN_SIZE):Layout{
    const l=empty(size),{width,height}=l,cx=width/2,cy=height/2,orientation=defender===0?-1:1;
    l.seed=rng.next()*100;l.lineGap=rng.int(2330,2840);
    l.ridgeOwner=defender;l.ridgeWidth=rng.int(330,460);
    l.ridgeX=cx+orientation*l.lineGap;
    l.ridges.push({x:l.ridgeX,y:cy,width:l.ridgeWidth,length:height*.48});
    if(rng.next()<.65)l.ridges.push({x:cx-orientation*rng.int(1000,1700),y:height*(rng.next()<.5?.2:.8),width:260,length:height*.17});
    const channels=24,offset=rng.int(-450,450);
    l.river.width=rng.int(75,120);
    for(let i=0;i<=channels;i++){
        const t=i/channels,phase=l.seed;
        l.river.points.push({x:cx+offset+410*Math.sin(t*7.3+phase)+155*Math.sin(t*17.8+phase*.63),y:t*height});
    }
    const crossings=rng.int(1,2),bridgeNames=['磨坊桥','石滩渡'];
    for(let i=0;i<crossings;i++){
        const y=height*(crossings===1?.5+rng.next()*.08:(i===0?.22:.73)+rng.next()*.08);
        const b:Bridge={x:riverAt(y,l),y,w:l.river.width+85,h:i===0?55:85,kind:i===0?'bridge':'ford'};
        l.bridges.push(b);landmark(l,b,bridgeNames[i],'bridge',defender);
    }
    const count=rng.int(2,3),sectors=count===2?[0,2]:[0,1,2];
    for(let i=0;i<count;i++){
        const y=height*(sectors[i]+.38+rng.next()*.24)/3;
        const f:Rect={x:cx+orientation*rng.int(510,1430),y,w:rng.int(186,207),h:rng.int(135,150)};
        l.farms.push(f);landmark(l,f,['圣安娜农庄','白桦村','风车庄园'][sectors[i]],'farm',defender);
    }
    l.farm=l.farms[Math.floor(count/2)];l.farmOwner=defender;
    for(const [i,r] of l.ridges.entries())landmark(l,r,i===0?'长岭':'西丘','ridge',i===0?defender:-1);
    const nWoods=rng.int(2,4);
    for(let i=0;i<nWoods;i++){
        const y=(i+.4+.2*rng.next())*height/nWoods,r=rng.int(245,445);
        let x=cx+(rng.next()-.5)*3500;
        if(Math.abs(x-riverAt(y,l))<r+120)x=riverAt(y,l)+r+160;
        l.woods.push({x,y,r});
    }
    for(const b of l.bridges){
        const dy=rng.int(-380,380),edgeY=b.y+dy;
        l.roads.push({width:44,points:[{x:0,y:edgeY},{x:cx*.65,y:edgeY-dy*.55},{x:b.x-b.w*.7,y:b.y},
            {x:b.x+b.w*.7,y:b.y},{x:width*.76,y:edgeY+dy*.3},{x:width,y:edgeY-dy*.2}]});
    }
    for(const f of l.farms){
        const b=l.bridges.reduce((a,b)=>Math.abs(a.y-f.y)<Math.abs(b.y-f.y)?a:b);
        l.roads.push({width:39,points:[{x:b.x+orientation*(b.w/2),y:b.y},{x:f.x-150*orientation,y:(f.y+b.y)/2},{x:f.x-100*orientation,y:f.y}]});
    }
    return l;
}
export function createLayout(rng:Rng,defender:Faction|-1):Layout{
    const l=empty(CLASSIC_SIZE),cx=l.width/2,cy=l.height/2;
    l.seed=rng.next()*100;l.ridgeOwner=defender;l.ridgeWidth=300+rng.int(0,80);
    if(defender>=0){
        const face=defender?-1:1;l.ridgeX=cx-face*(l.lineGap-70);
        if(rng.next()<.8){l.farm={x:cx-face*(l.lineGap-380),y:cy+rng.int(-650,650),w:190,h:140};l.farmOwner=defender;}
    }else if(rng.next()<.65){
        l.farm={x:cx+rng.int(-120,120),y:cy+rng.int(-500,500),w:190,h:140};l.farmOwner=rng.next()<.5?0:1;
    }
    if(l.farm){l.farms.push(l.farm);landmark(l,l.farm,'石墙农庄','farm',l.farmOwner);}
    const groves=rng.int(1,3);
    for(let i=0;i<groves;i++){
        const top=(i+rng.int(0,1))%2===0;
        l.woods.push({x:cx+rng.int(-750,750),y:top?rng.int(260,640):l.height-rng.int(260,640),r:rng.int(170,290)});
    }
    return l;
}
export function ridgeLine(y:number){return layout.ridgeX+80*Math.sin(y*.0016+layout.seed);}
export function ridge(x:number,y:number){
    if(!layout.ridges.length){
        if(layout.ridgeOwner<0)return 0;
        const d=(x-ridgeLine(y))/layout.ridgeWidth;
        return Math.exp(-d*d)*(.82+.18*Math.sin(y*.0023+layout.seed*2));
    }
    let h=0;
    for(const r of layout.ridges){
        const dx=(x-r.x-80*Math.sin(y*.0016+layout.seed))/r.width,dy=(y-r.y)/r.length;
        h=Math.max(h,Math.exp(-dx*dx-dy*dy)*(.88+.12*Math.sin(y*.0023+layout.seed*2)));
    }
    return h;
}
export function inRect(r:Rect|null,x:number,y:number,pad=0){
    return !!r && Math.abs(x-r.x)<r.w/2+pad && Math.abs(y-r.y)<r.h/2+pad;
}
export function inWoods(x:number,y:number,pad=0){
    for(const g of layout.woods)if((x-g.x)**2+(y-g.y)**2<(g.r+pad)**2)return true;
    return false;
}
export function coverAt(x:number,y:number){
    for(const f of layout.farms)if(inRect(f,x,y,12))return .35;
    return inWoods(x,y)?.6:1;
}
export function behindCrest(x:number,y:number,faction:Faction){
    if(layout.ridgeOwner!==faction)return false;
    const behind=(ridgeLine(y)-x)*(faction?-1:1);
    return behind>15 && behind<460;
}
export function onRoad(x:number,y:number,l=layout){
    for(const road of l.roads)for(let i=1;i<road.points.length;i++){
        const a=road.points[i-1],b=road.points[i],pad=road.width/2;
        if(x<Math.min(a.x,b.x)-pad || x>Math.max(a.x,b.x)+pad || y<Math.min(a.y,b.y)-pad || y>Math.max(a.y,b.y)+pad)continue;
        const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
        if((x-a.x-t*dx)**2+(y-a.y-t*dy)**2<=pad*pad)return true;
    }
    return false;
}
export function movementAt(x:number,y:number,l=layout){
    if(Math.abs(x-riverAt(y,l))<l.river.width/2){
        const crossing=l.bridges.find(b=>inRect(b,x,y));
        return crossing?.kind==='bridge'?1.3:crossing?.kind==='ford'?.78:.45;
    }
    return onRoad(x,y,l)?1.3:1;
}
export function terrainText(l:Layout,names:[string,string]){
    if(l.river.points.length)return `左翼、中央与右翼共有 ${l.farms.length} 处村庄农庄、${l.ridges.length} 道山脊与 ${l.bridges.length} 处渡口。沿道路行军更快。`;
    const parts=[];
    parts.push(l.ridgeOwner>=0?`${names[l.ridgeOwner===1?1:0]}据守一道山脊，可藏在反斜面躲避炮击`:'开阔原野，双方正面遭遇');
    if(l.farm)parts.push(`${names[l.farmOwner===1?1:0]}占据石墙农庄`);
    if(l.woods.length)parts.push(`侧翼有 ${l.woods.length} 片树林，骑兵难以通行`);
    return parts.join('；');
}
