import type {Faction, Kind, Unit} from '../sim/types';
import {banner} from './banners';

const ink='#25282b', boot='#34302d', steel='#adb9bc', glint='#edf0dd', ivory='#e5ddc6';
const hide='#925d42', skin='#e8b384', brass='#bd893e', gilt='#f5ce77', walnut='#70503a';
const pixelScale=1.25;
const circle=Math.PI*2;
type Action='stand'|'march'|'run'|'aim'|'load'|'thrust'|'recoil'|'throw';
type Result={art:HTMLCanvasElement; footX:number; footY:number};
const cache=new Map<string,Result>();
const shades=(f:Faction)=>f?['#68232d','#b93a37','#e36149']:['#203857','#356294','#6287ab'];
export const spritePalette=(_k:Kind,f:Faction)=>[ink,ivory,skin,walnut,brass,steel,shades(f)[1]];

class Pixels {
    constructor(private c:CanvasRenderingContext2D) {}
    box(col:string,x:number,y:number,w=1,h=1) {
        this.c.fillStyle=col; this.c.fillRect(Math.round(x),Math.round(y),w,h);
    }
    line(col:string,x:number,y:number,ex:number,ey:number) {
        const n=Math.max(1,Math.ceil(Math.max(Math.abs(ex-x),Math.abs(ey-y))));
        this.c.fillStyle=col;
        for(let i=0;i<=n;i++)this.c.fillRect(Math.round(x+(ex-x)*i/n),Math.round(y+(ey-y)*i/n),1,1);
    }
    oval(col:string,x:number,y:number,rx:number,ry:number) {
        for(let dy=-ry;dy<=ry;dy++){
            const span=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/(ry+.3))**2)));
            this.box(col,x-span,y+dy,span*2+1);
        }
    }
}

function infantry(p:Pixels,f:Faction,guard:boolean,a:Action,frame:number,dx:number,dy:number,role=-1) {
    const [dark,coat,edge]=shades(f), steps=[-2,-1,0,1,2,1,0,-1];
    const walking=a==='march'||a==='run'||a==='thrust', loading=a==='load', back=dy<-.37;
    const stride=walking?steps[frame%8]*(a==='run'||a==='thrust'?1.45:1):0;
    const rise=walking&&frame%2===1?-1:0;
    const lean=a==='thrust'?3:a==='run'?2:0;
    const headX=lean+(loading?1:0), headY=rise+(loading?1:0);
    for(const [hip,foot,color] of [[-2,-2-stride,'#a49e91'],[1,1+stride,ivory]] as const){
        p.line(color,hip,-5,foot,-2);p.line(color,hip+1,-5,foot+1,-2);
        p.box(boot,foot,-2,2,2);p.box(ink,foot,0,3);
    }
    // Shoulder wings, cutaway coat tails, rolled blanket and cartridge pouch.
    p.box(ink,lean-4,rise-14,7,8);p.box(dark,lean-4,rise-12,2,8);
    p.box(coat,lean-3,rise-14,5,7);p.box(edge,lean-2,rise-14,3);
    p.box(coat,lean-3,rise-7,3,3);p.box(dark,lean,rise-7,3,3);
    p.box(ivory,lean-3,rise-7,6);p.box(brass,lean,rise-7);
    p.line(ivory,lean-3,rise-14,lean+2,rise-8);
    if(!back)p.line('#c2bca9',lean+2,rise-14,lean-3,rise-8);
    p.box('#534539',lean-5,rise-13,2,5);p.box('#aaa394',lean-5,rise-14,3,2);
    p.box(boot,lean-4,rise-8,3,2);
    p.box(guard?gilt:ivory,lean-3,rise-14,2);
    if(guard){p.box(brass,lean-4,rise-13,2,2);p.box(gilt,lean+2,rise-14,2,2);}
    p.box(back?walnut:hide,headX-2,headY-18,5,4);
    if(back){
        p.box('#684b39',headX-2,headY-17,4,2);p.box(hide,headX+2,headY-16);
        p.box('#a19a87',lean-3,rise-13,5,2);p.box('#4b4036',lean-3,rise-11,5,4);
        p.box('#87725b',lean-2,rise-11,3);p.box(ivory,lean-1,rise-10,1,3);
    }else if(dy>.6){
        p.box(skin,headX-2,headY-17,5,3);p.box(boot,headX-2,headY-17);p.box(boot,headX+1,headY-17);
        p.box(hide,headX,headY-15);
    }else{
        p.box(skin,headX,headY-17,3,3);p.box(skin,headX+3,headY-16);p.box(ink,headX+1,headY-17);
    }
    p.box('#9b3330',headX-1,rise-15,3);
    if(guard){
        p.box(ink,headX-3,headY-25,6,8);p.box('#383738',headX-2,headY-26,4,2);
        p.box('#55504a',headX-2,headY-24,2,3);p.box('#454341',headX+1,headY-25,1,2);
        p.box('#b94438',headX-4,headY-24,2,5);p.box(brass,headX,headY-19,3);
    }else{
        p.box(ink,headX-3,headY-22,6,5);p.box('#464449',headX-3,headY-22,5);
        p.box('#674f38',headX-3,headY-19,6);p.box(ink,headX-2,headY-18,7);
        p.box(gilt,headX+1,headY-20);p.box(f?'#f3efdc':'#be493c',headX-2,headY-24,2,2);
    }
    const hand=(x:number,y:number)=>{p.box(hide,x-1,y,3,2);p.box(skin,x,y,2);};
    if(role>=0){
        if(role===0){hand(2,-12+rise);hand(2,-8+rise);}
        if(role===1){
            p.box('#563c32',0,-11+rise,9,8);p.box('#ba7844',1,-10+rise,7,5);
            for(let i=0;i<3;i++)p.line(ivory,i*3,-10+rise,i*3+2,-5+rise);
            p.box(ivory,0,-12+rise,9,2);p.box(brass,0,-5+rise,9,2);
            const beat=[-3,-1,2,3,1,-2][frame%6];p.line(walnut,-3,-13+rise,4,-15+rise+beat);p.line(gilt,7,-14+rise,2,-13+rise-beat);
            hand(-3,-13+rise);hand(6,-14+rise);
        }
        if(role===2){
            p.line('#503c27',1,-16+rise,11,-15+rise);p.box(gilt,10,-15+rise,2);
            hand(4,-15+rise);hand(8,-15+rise);
        }
        return;
    }
    if(a==='aim'||a==='thrust'){
        const lunge=a==='thrust'&&frame%2===1?2:0;
        const y=a==='thrust'?-10+rise:-12, x=(Math.abs(dy)>.85?4:0)+(a==='thrust'?2:0), l=a==='thrust'?16+lunge:14;
        // 步兵枪托、铁管与亮银长刺刀（刺刀冲锋时端平前冲、寒光毕露！）
        p.line(ink,x-3*dx,y+1-3*dy,x+dx*l,y+1+dy*l);
        p.line(walnut,x-3*dx,y-3*dy,x+dx*(l-3),y+dy*(l-3));
        p.line(steel,x+3*dx,y-1+3*dy,x+dx*l,y-1+dy*l);
        p.box(gilt,x+2*dx,y+2*dy);
        if(a==='thrust'){
            // 超清晰三棱长刺刀 + 亮白剑锋高光 + 冲锋臂袖
            p.line(coat,lean-1,rise-12,x+2*dx,y+2*dy);
            p.line(edge,lean+1,rise-12,x+7*dx,y+7*dy);
            p.line(ink,x+dx*(l-1),y+dy*(l-1),x+dx*(l+7),y+dy*(l+7));
            p.line(steel,x+dx*(l-1),y-1+dy*(l-1),x+dx*(l+7),y-1+dy*(l+7));
            p.line(glint,x+dx*(l+1),y-1+dy*(l+1),x+dx*(l+8),y-1+dy*(l+8));
            if(lunge) p.box('#ffffff',x+dx*(l+8),y-1+dy*(l+8),2,1);
        }
        hand(x+2*dx,y+2*dy);hand(x+7*dx,y+7*dy);
    }else if(a==='throw'){
        // Musket slung while the throwing arm carries through in the target direction.
        p.line(walnut,-5,-6,-2,-20);p.line(steel,-3,-17,-1,-25);
        const handX=frame<2?-5:2+Math.round(dx*6),handY=frame<2?-21:-15+Math.round(dy*5);
        p.line(coat,1,-14,handX,handY);p.line(edge,1,-13,handX,handY+1);hand(handX,handY);
        if(frame<2){p.oval(ink,handX,handY-2,2,2);p.box('#bd9d6c',handX+1,handY-5);}
    }else if(loading){
        p.box(walnut,5,-18,2,15);p.box(steel,5,-21,1,12);p.box(brass,6,-11);
        const arm=[-16,-17,-21,-23,-19,-14,-12,-15][frame%8];
        p.box(glint,6,arm-5,1,11);p.line(coat,2,-13,4,arm+1);hand(5,arm);
        p.line(edge,-2,-11,4,-10);hand(4,-10);
    }else if(a==='run'){
        p.line(walnut,-5,-5,6,-15+rise);p.line(steel,3,-13+rise,8,-18+rise);hand(2,-10+rise);
    }else{
        p.line(walnut,-1,-5+rise,6,-19+rise);p.line(steel,3,-14+rise,8,-23+rise);
        p.line(glint,7,-21+rise,9,-25+rise);hand(2,-11+rise);
    }
}

function cavalry(p:Pixels,f:Faction,frame:number,moving:boolean,thrust:boolean,role=0){
    // 与步兵完全统一的 16-bit 精细像素画风：1px ink 深墨勾边 + 3 阶明暗 + 高清装备细节
    const [dark,coat,edge]=shades(f), g=moving?Math.floor(frame/2)%4:1;
    const frontFoot=moving?[[-3,-1],[3,-4],[7,-2],[1,0]][g]:[1,0];
    const rearFoot=moving?[[5,-2],[-2,0],[-6,-3],[1,-1]][g]:[-1,0];
    const bob=moving?[0,-1,-2,-2,-1,0,1,0][frame%8]:0;
    const pale=role===4 || (f && role===0);
    const hDark=pale?'#716e67':f?'#4a2c1c':'#362218', hMid=pale?'#b5b4a7':f?'#7e4e31':'#5e3d2b', hLit=pale?'#e3e0ce':f?'#ad754c':'#8a6045';

    // 远侧马腿（ink 描边 + 暗部着色 + 铁蹄）
    p.line(ink,-9,-12+bob,-10+rearFoot[0]*.6,-5+bob);
    p.line(hDark,-8,-12+bob,-9+rearFoot[0]*.6,-5+bob);
    p.line(hDark,-9+rearFoot[0]*.6,-5+bob,-8+rearFoot[0],rearFoot[1]);
    p.box(ink,-9+rearFoot[0],rearFoot[1]-1,3,2);
    p.line(ink,8,-12+bob,9+frontFoot[0]*.6,-6+bob);
    p.line(hDark,7,-12+bob,8+frontFoot[0]*.6,-6+bob);
    p.line(hDark,8+frontFoot[0]*.6,-6+bob,9+frontFoot[0],frontFoot[1]);
    p.box(ink,8+frontFoot[0],frontFoot[1]-1,3,2);

    // 飘逸黑亮马尾（带 ink 外轮廓）
    p.line(ink,-11,-15+bob,-19,-10+bob+(g%2?2:-1));
    p.line('#3f3229',-12,-14+bob,-18,-9+bob+(g%2?2:-1));
    p.line(ink,-12,-13+bob,-17,-7+bob+(g%2?2:-1));

    // 精雕战马躯干（1px ink 轮廓 + 肌肉明暗三层渐变）
    p.oval(ink,0,-13+bob,13,6);
    p.oval(hDark,0,-12+bob,12,5);
    p.oval(hMid,0,-13+bob,11,4);
    p.oval(hLit,2,-15+bob,8,2);
    p.box(hLit,-9,-15+bob,5,2);
    // 胸前皮革挽具与铜扣
    p.line(ink,7,-16+bob,11,-11+bob);
    p.box(gilt,9,-13+bob,2,1);

    // 近侧马腿（明亮立体，四蹄清晰）
    p.line(ink,-7,-11+bob,-7-rearFoot[0]*.5,-5+bob);
    p.line(hLit,-6,-11+bob,-6-rearFoot[0]*.5,-5+bob);
    p.line(hMid,-6-rearFoot[0]*.5,-5+bob,-5-rearFoot[0],Math.min(0,rearFoot[1]+1));
    p.box(ink,-6-rearFoot[0],Math.min(0,rearFoot[1]+1)-1,3,2);
    p.line(ink,8,-11+bob,9-frontFoot[0]*.5,-6+bob);
    p.line(hLit,9,-11+bob,10-frontFoot[0]*.5,-6+bob);
    p.line(hMid,10-frontFoot[0]*.5,-6+bob,11-frontFoot[0],Math.min(0,frontFoot[1]+1));
    p.box(ink,10-frontFoot[0],Math.min(0,frontFoot[1]+1)-1,3,2);

    // 昂扬骏马脖颈、马头、鬃毛、眼眸与缰绳
    p.oval(ink,10,-18+bob,5,6);
    p.oval(hMid,10,-18+bob,4,5);
    p.line(hLit,11,-21+bob,12,-15+bob);
    p.box(ink,10,-25+bob,8,6);
    p.box(hMid,11,-24+bob,6,4);
    p.box(hLit,14,-23+bob,5,3);
    p.box(ink,18,-22+bob,2,3);
    p.box(ivory,17,-21+bob,2,2);
    p.line(ink,8,-23+bob,9,-15+bob); // 浓密马鬃
    p.box(ink,11,-27+bob,2,3); p.box(hLit,12,-26+bob,1,2); // 竖起双耳
    p.box(ink,15,-23+bob,1,1); // 眼睛
    p.box(gilt,16,-20+bob,1,1); // 铜马嚼
    p.line(ink,3,-16+bob,16,-20+bob); // 缰绳

    // 皇家阵营鞍褥（带 ink 边 + 金丝镶边 + 骑兵皮靴马镫）
    p.box(ink,-9,-17+bob,14,8);
    p.box(dark,-8,-16+bob,12,6);
    p.box(coat,-7,-15+bob,10,4);
    p.box(edge,-6,-15+bob,4,2);
    p.box(gilt,-8,-10+bob,12,1);
    p.box(gilt,-7,-12+bob,2,1);
    p.box('#563925',-5,-17+bob,8,3);
    p.box(ivory,-2,-15+bob,4,4); // 白色马裤
    p.box(ink,-2,-12+bob,5,7);
    p.box(boot,-1,-12+bob,3,5);
    p.box(steel,0,-6+bob,3,1); // 亮银马镫

    // 迎风翻飞的阵营短披风（与步兵同三色阶）
    p.line(ink,-4,-24+bob,-13,-19+bob+(g%2?1:-2));
    p.line(dark,-4,-23+bob,-12,-18+bob+(g%2?1:-2));
    p.line(coat,-4,-22+bob,-11,-17+bob+(g%2?1:-2));
    p.line(edge,-5,-21+bob,-10,-16+bob+(g%2?1:-2));

    // 骑兵上身：精确对齐步兵比例的 ink 勾边 + 三阶军装 + 亮银胸甲 + 步兵同款面容
    p.box(ink,-5,-25+bob,10,10);
    p.box(coat,-4,-24+bob,8,8);
    p.box(dark,-4,-22+bob,2,6);
    p.box('#5d6870',-2,-24+bob,6,7);
    p.box(steel,-1,-24+bob,5,6);
    p.box(glint,0,-23+bob,3,3);
    p.box(gilt,-4,-24+bob,2,2); // 金色肩章
    p.box(ivory,-3,-17+bob,7,1);
    p.box(brass,0,-17+bob,2,1); // 铜皮带扣

    // 步兵同款精雕面容 + 铜脊马鬃胸甲骑兵钢盔
    p.box(hide,-2,-28+bob,5,4);
    p.box(skin,-1,-28+bob,4,3);
    p.box(ink,1,-28+bob,1,1);
    p.box('#9b3330',-1,-25+bob,3,1);
    p.box(ink,-4,-33+bob,9,5);
    p.box('#4e5860',-3,-32+bob,7,3);
    p.box(steel,-2,-32+bob,5,2);
    p.box(glint,-1,-32+bob,3,1);
    p.box(gilt,0,-34+bob,3,2); // 鎏金头盔脊
    p.box(ink,-2,-29+bob,8,1); // 帽檐
    // 飘扬马鬃羽饰
    p.line(ink,-2,-33+bob,-9,-29+bob-(g%2));
    p.line(f?'#cc3930':'#262b30',-2,-32+bob,-8,-28+bob-(g%2));
    p.line(f?'#f0745d':'#4c5258',-3,-31+bob,-7,-27+bob-(g%2));

    // 手持雪亮弧形重骑兵马刀（行军高举 / 冲锋前刺寒光四射）
    p.box(coat,2,-23+bob,3,3);
    p.box(hide,3,-21+bob,3,2);
    p.box(skin,4,-21+bob,2,1);
    p.box(gilt,5,-22+bob,3,2); // 铜护手
    if(thrust){
        p.line(ink,7,-20+bob,21,-18+bob);
        p.line(steel,7,-21+bob,21,-19+bob);
        p.line(glint,10,-22+bob,22,-19+bob);
    }else{
        p.line(ink,7,-22+bob,15,-33+bob);
        p.line(steel,6,-22+bob,14,-33+bob);
        p.line(glint,9,-26+bob,15,-34+bob);
    }
    if(moving){p.box('#b5a97d',-15-g,-1,3,2);p.box('#d4c49a',-19-g,-3,2,2);}
}

function wheel(p:Pixels,x:number,y:number,frame:number){
    for(let i=0;i<8;i++){
        const theta=(i+frame/4)*circle/8;
        p.line('#6c4b2d',x,y,x+Math.cos(theta)*5.5,y+Math.sin(theta)*5.5);
        p.line('#a87948',x,y,x+Math.cos(theta)*4.5,y+Math.sin(theta)*4.5);
    }
    for(let i=0;i<44;i++){
        const theta=i*circle/44;
        p.box(ink,x+Math.cos(theta)*6.5,y+Math.sin(theta)*6.5);
        p.box(Math.sin(theta)<0?'#c99658':'#785134',x+Math.cos(theta)*5.5,y+Math.sin(theta)*5.5);
    }
    p.box(ink,x-2,y-2,5,5);p.box('#564131',x-1,y-1,3,3);p.box(gilt,x,y);
}

function crew(p:Pixels,f:Faction,x:number,y:number,role:number,frame:number,pushing:boolean){
    // 与步兵完全一致的 16-bit 精致像素人物工艺（ink 轮廓 + 阵营三阶明暗 + 交叉背带 + 高清头饰）
    const [dark,coat,edge]=shades(f);
    const step=pushing?[-1,0,1,0][frame%4]:0, rise=pushing&&frame%2===1?-1:0, lean=pushing?2:0;
    const gx=x+lean, gy=y+rise;
    // 步兵同款明暗双腿与黑皮靴
    p.line('#a49e91',x-2,y-5,x-2-step,y-2);p.line('#a49e91',x-1,y-5,x-1-step,y-2);
    p.line(ivory,x+1,y-5,x+1+step,y-2);p.line(ivory,x+2,y-5,x+2+step,y-2);
    p.box(boot,x-2-step,y-2,2,2);p.box(ink,x-2-step,y,3,1);
    p.box(boot,x+1+step,y-2,2,2);p.box(ink,x+1+step,y,3,1);
    // 步兵同款 ink 描边上衣 + 交叉白背带 + 铜扣 + 弹药盒
    p.box(ink,gx-4,gy-14,8,8);
    p.box(dark,gx-4,gy-12,2,7);
    p.box(coat,gx-3,gy-14,6,7);
    p.box(edge,gx-2,gy-14,3,1);
    p.box(coat,gx-3,gy-7,3,2);p.box(dark,gx,gy-7,3,2);
    p.box(ivory,gx-3,gy-7,6,1);p.box(brass,gx,gy-7,1,1);
    p.line(ivory,gx-3,gy-14,gx+2,gy-8);
    p.line('#c2bca9',gx+2,gy-14,gx-3,gy-8);
    p.box(gilt,gx-3,gy-14,2,1); // 炮兵金肩饰
    // 步兵同款精雕面容 + 炮兵礼帽与赤红羽饰
    p.box(hide,gx-2,gy-18,5,4);
    p.box(skin,gx,gy-17,3,3);p.box(skin,gx+3,gy-16,1,1);p.box(ink,gx+1,gy-17,1,1);
    p.box('#9b3330',gx-1,gy-15,3,1);
    p.box(ink,gx-3,gy-22,6,5);
    p.box('#464449',gx-3,gy-22,5,1);
    p.box('#674f38',gx-3,gy-19,6,1);
    p.box(ink,gx-2,gy-18,7,1);
    p.box(gilt,gx+1,gy-20,1,1);
    p.box('#cf3e34',gx-2,gy-24,2,2); // 炮兵专属火红羽饰

    const beat=[0,1,2,1][frame%4];
    const hand=(hx:number,hy:number)=>{p.box(hide,hx-1,hy,3,2);p.box(skin,hx,hy,2,1);};
    if(pushing){
        p.line(coat,gx+1,gy-12,gx+6,gy-9);p.line(edge,gx+1,gy-11,gx+5,gy-9);
        hand(gx+5,gy-9);
    }else if(role===0){
        // 炮手 1：挥舞木柄海绵通条清理炮膛
        p.line(ink,gx-4,gy-5-beat,gx+10,gy-14-beat);
        p.line(walnut,gx-4,gy-6-beat,gx+10,gy-15-beat);
        p.box(ink,gx+7,gy-17-beat,5,4);
        p.box('#d8cbb0',gx+8,gy-16-beat,3,2);
        hand(gx+3,gy-10-beat);
    }else if(role===1){
        // 炮手 2：托举高亮铁质实心炮弹
        p.oval(ink,gx+5,gy-10+beat,3,3);
        p.oval('#3a4044',gx+5,gy-10+beat,2,2);
        p.box(glint,gx+4,gy-11+beat,1,1);
        hand(gx+2,gy-9+beat);
    }else{
        // 炮手 3：举起闪耀火星的点火绳
        p.line(ink,gx+2,gy-7,gx+9,gy-13-beat);
        p.line('#8c6642',gx+2,gy-8,gx+9,gy-14-beat);
        p.box('#f27b2b',gx+9,gy-15-beat,2,2);
        p.box('#fff09a',gx+9,gy-15-beat,1,1);
        hand(gx+3,gy-9);
    }
}

function cannon(p:Pixels,f:Faction,a:Action,frame:number,dx:number,dy:number,crewCount:number){
    const marching=a==='march'||a==='run', recoil=a==='recoil'?[0,7,7,6,5,4,3,2,1][frame]:0;
    const x=-Math.round(recoil*dx),y=-Math.round(recoil*dy),wy=y-6;
    const pushing=marching||a==='recoil'&&frame>=3;
    if(crewCount>0)crew(p,f,-14,-5,0,frame,pushing);
    if(crewCount>1)crew(p,f,1,-8,1,frame,pushing);
    const rotation=marching?frame:a==='recoil'?recoil:0;
    wheel(p,x+2,wy-4,rotation);
    // 橡木炮架（ink 勾边 + 三阶木纹 + 铁箍）
    p.line(ink,x-18*dx,y-1-18*dy,x+5*dx,y-7+5*dy);
    p.line(ink,x-18*dx,y-4-18*dy,x+5*dx,y-10+5*dy);
    p.line(walnut,x-17*dx,y-2-17*dy,x+4*dx,y-8+4*dy);
    p.line('#b98c52',x-16*dx,y-3-16*dy,x+3*dx,y-9+3*dy);
    p.box(steel,x-15*dx,y-3-15*dy,2,2);
    // 精铸青铜重炮管（ink 轮廓 + 3阶青铜反光 + 加强铜箍 + 炮耳）
    const barrel=(from:number,to:number,thickness:number,col:string,offset=0)=>{
        const ax=x+dx*from-dy*offset,ay=y-10+dy*from+dx*offset;
        for(let i=0;i<thickness;i++)p.line(col,ax-dy*i,ay+dx*i,x+dx*to-dy*(offset+i),y-10+dy*to+dx*(offset+i));
    };
    barrel(-6,18,7,ink,-3);
    barrel(-5,17,5,'#573f28',-2);
    barrel(-5,17,3,'#b3833e',-1);
    barrel(-4,17,1,'#f4d88c',-1);
    for(const ring of [-4,2,10,16]){barrel(ring,ring+1,7,'#6e4d26',-3);barrel(ring,ring+1,2,'#f7df94',-3);}
    barrel(18,18,3,ink,-1);
    wheel(p,x-1,wy,rotation);
    if(crewCount>2)crew(p,f,-18,6,2,frame,marching);
    if(!marching){
        // 精致木制弹药箱与水桶（带 ink 描边与铜带）
        p.box(ink,-25,2,10,7);p.box('#563e2c',-24,3,8,5);p.box('#a87e4b',-24,3,8,2);
        p.box(gilt,-22,3,1,5);p.box(gilt,-18,3,1,5);
        p.box(ink,4,2,7,7);p.box('#62533f',5,3,5,5);p.box(steel,5,3,5,1);p.box('#9d9582',5,6,5,1);
    }
}

function heading(dx:number,dy:number){
    return ((Math.round(Math.atan2(dy,dx)*16/circle)%16)+16)%16;
}
export function bake(kind:Kind,f:Faction,a:Action,dir:number,frame:number,role:number,crewCount:number,flash:boolean,flee=false):Result {
    const key=[kind,f,a,dir,frame,role,crewCount,Number(flash),Number(flee)].join('/');
    const known=cache.get(key);if(known)return known;
    const gun=kind==='field_cannon', mounted=kind==='cuirassier',band=kind==='bannerman';
    const art=document.createElement('canvas');
    art.width=gun?68:mounted?50:band?46:50;art.height=gun?58:mounted?44:band?47:42;
    const footX=Math.floor(art.width/2),footY=art.height-(gun?18:mounted?6:band?3:9);
    const c=art.getContext('2d')!;c.imageSmoothingEnabled=false;
    c.translate(footX,footY);
    const angle=dir*circle/16,dx=Math.cos(angle),dy=Math.sin(angle);
    if(dx<-.001){c.scale(-1,1);c.translate(-1,0);}
    const p=new Pixels(c);
    if(gun)cannon(p,f,a,frame,Math.abs(dx),dy,crewCount);
    else if(mounted)cavalry(p,f,frame,a==='march'||a==='run',a==='thrust',role);
    else{
        infantry(p,f,kind==='guard_grenadier',a,frame,Math.abs(dx),dy,band?(role===2?0:role):flee?4:role===3?3:-1);
        if(band && role!==1){
            c.drawImage(banner(f,frame),2,-36,21,37);
            if(role===2 && f){p.box('#a45338',10,-31,10,10);p.box(gilt,14,-28,2,4);p.box(gilt,12,-27,6,1);}
        }
    }
    if(mounted && role>0){
        if(role===2){p.line(walnut,3,-15,18,-36);p.line(gilt,4,-15,19,-36);for(let j=0;j<4;j++)p.box(j<2?'#bd4040':ivory,16-j,-33+j,7-j);}
        else if(role===4 || role===5 || role===3){p.box(ink,-5,-33,10,2);p.box(ink,-3,-35,6,3);p.box(gilt,1,-33,2);p.box(role===4?'#535a50':shades(f)[1],-4,-23,7,5);}
        else{p.box(f?'#233549':'#ac8549',-2,-24,6,6);p.box(gilt,-1,-24,3);}
    }else if(!gun && !band){
        if(role===3){
            c.clearRect(-5,-30,13,12);p.box(ink,-5,-21,11,2);p.box(ink,-2,-24,5,4);p.box(gilt,1,-22,2);
            p.box(gilt,-4,-14,3,2);p.line(glint,3,-11,a==='aim'||a==='run'?16:10,a==='aim'||a==='run'?-14:-23+(frame%3));p.box(brass,3,-12,3);
        }else if(role===1 || role===2){
            const plume=f?'#66844d':role===1?'#d74d42':'#c8ba48';
            p.box(plume,-4,-26,2,6);p.box(plume,-3,-14,3,2);
            if(f && role===2){p.box(ink,-4,-23,8,5);p.box('#c9b9a0',-3,-24,3);p.box('#354f40',-4,-8,8,5);p.box('#976550',-2,-8,1,5);p.box('#84916c',-4,-6,8);}
            if(f && kind==='guard_grenadier'){p.box('#304b35',-3,-14,5,7);p.line('#9aa778',-2,-14,1,-9);}
        }
    }else if(gun && role>0){p.box(role===3?gilt:steel,-16,-19,4,2);p.box(ink,-17,-17,6);}
    if(band && role===1 && !f){p.box('#a75738',-3,-14,4,5);p.box(gilt,-3,-14,3);}
    if(flee && !gun && !mounted){
        c.clearRect(-5,-32,16,14);p.box('#58463b',0,-19,5,2);
        p.line(shades(f)[1],1,-13,5,-11+frame%3);p.box(skin,5,-11+frame%3,2,2);
    }
    if(flash){c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';p.box('#e5b7a72e',0,0,art.width,art.height);}
    const result={art,footX,footY};cache.set(key,result);return result;
}

export function muzzleOffset(kind:Kind,dx:number,dy:number){
    const angle=heading(dx,dy)*circle/16,gun=kind==='field_cannon';
    const x=Math.cos(angle),y=Math.sin(angle);
    const shoulder=!gun&&Math.abs(y)>.85?(x<-.001?-4:4):0;
    return {x:(shoulder+x*(gun?17:14))*pixelScale,y:((gun?-10:-13)+y*(gun?17:14))*pixelScale};
}

export function drawUnitSprite(c:CanvasRenderingContext2D,u:Unit,tick:number,aimX:number,aimY:number,retreating=false,hitFlash=false,groundX=u.x,groundY=u.y) {
    const dir=heading(aimX||aimY?aimX:u.face,aimY);
    const gun=u.kind==='field_cannon', mounted=u.kind==='cuirassier', band=u.kind==='bannerman';
    const since=tick-(u.firedAt??-10000),throwAge=tick-(u.thrownAt??-10000);
    let action:Action='stand',frame=0;
    if(!retreating&&u.pose==='bayonet'){
        action='thrust';
        frame=u.moving?Math.floor((u.marchDistance??tick)/3.5)%4:Math.floor(tick/5)%2;
    }else if(retreating||u.moving){
        action=retreating?'run':'march';
        frame=Math.floor((u.marchDistance??tick)/(gun?2.4:mounted?7:4))%4;
    }else if(u.kind==='guard_grenadier'&&throwAge>=0&&throwAge<8){
        action='throw';frame=Math.min(3,Math.floor(throwAge/2));
    }else if(gun&&since>=0&&since<40){
        action='recoil';frame=since<1?0:Math.min(8,1+Math.floor((since-1)/5));
    }else if(!gun&&(u.pose==='aim'||since<5))action='aim';
    else if(u.pose==='reload'||u.pose==='kneel'||gun&&u.cooldown>0){
        action='load';frame=Math.floor((tick+u.id%4)/(gun?7:5))%(gun?4:6);
    }
    if(band&&action!=='run')frame=Math.floor((tick+u.slot*3)/5)%6;
    const facing=gun||action==='aim'||action==='thrust'||action==='throw'?dir:
        Math.abs(Math.sin(dir*circle/16))>.80?(Math.sin(dir*circle/16)>0?4:12):Math.cos(dir*circle/16)>=0?0:8;
    const s=bake(u.kind,u.faction,action,facing,frame,band?u.slot%3:0,gun?(u.crew??3):0,hitFlash);
    c.drawImage(s.art,Math.round(groundX-s.footX*pixelScale),Math.round(groundY-u.z-s.footY*pixelScale),s.art.width*pixelScale,s.art.height*pixelScale);
}

// Shared by recruitment previews and tools that need a standalone frame.
export function sprite(k:Kind,f:Faction,pose:Unit['pose']|'braceNorth'|'braceSouth'|number='march1',flash=false){
    const frame=typeof pose==='number'?pose%4:pose==='march2'?2:0;
    const action:Action=pose==='reload'||pose==='kneel'?'load':pose==='bayonet'?'thrust':pose==='aim'||pose==='braceNorth'||pose==='braceSouth'?'aim':'march';
    return bake(k,f,action,pose==='braceNorth'?12:pose==='braceSouth'?4:0,frame,0,3,flash).art;
}
