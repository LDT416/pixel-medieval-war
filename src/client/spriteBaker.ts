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
    const [dark,coat,edge]=shades(f), steps=[-2,0,2,0];
    const walking=a==='march'||a==='run', loading=a==='load', back=dy<-.37;
    const stride=walking?steps[frame%4]*(a==='run'?1.5:1):0;
    const rise=walking&&frame%2===1?-1:0;
    const lean=a==='thrust'||a==='run'?2:0;
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
            const beat=frame%2?2:-2;p.line(walnut,-3,-13+rise,4,-15+rise+beat);p.line(gilt,7,-14+rise,2,-13+rise-beat);
            hand(-3,-13+rise);hand(6,-14+rise);
        }
        if(role===2){
            p.line('#503c27',1,-16+rise,11,-15+rise);p.box(gilt,10,-15+rise,2);
            hand(4,-15+rise);hand(8,-15+rise);
        }
        return;
    }
    if(a==='aim'||a==='thrust'){
        const y=-12,x=Math.abs(dy)>.85?4:0,l=a==='thrust'?17:14;
        p.line(walnut,x-3*dx,y-3*dy,x+dx*l,y+dy*l);
        p.line(steel,x+3*dx,y-1+3*dy,x+dx*l,y-1+dy*l);
        p.line(ink,x+4*dx,y+1+4*dy,x+9*dx,y+1+9*dy);
        p.box(gilt,x+2*dx,y+2*dy);
        if(a==='thrust')p.line(glint,x+dx*(l-2),y-1+dy*(l-2),x+dx*(l+4),y-1+dy*(l+4));
        hand(x+2*dx,y+2*dy);hand(x+7*dx,y+7*dy);
    }else if(a==='throw'){
        // Musket slung while the throwing arm carries through in the target direction.
        p.line(walnut,-5,-6,-2,-20);p.line(steel,-3,-17,-1,-25);
        const handX=frame<2?-5:2+Math.round(dx*6),handY=frame<2?-21:-15+Math.round(dy*5);
        p.line(coat,1,-14,handX,handY);p.line(edge,1,-13,handX,handY+1);hand(handX,handY);
        if(frame<2){p.oval(ink,handX,handY-2,2,2);p.box('#bd9d6c',handX+1,handY-5);}
    }else if(loading){
        p.box(walnut,5,-18,2,15);p.box(steel,5,-21,1,12);p.box(brass,6,-11);
        const arm=[-19,-22,-18,-14,-12,-16][frame%6];
        p.box(glint,6,arm-5,1,11);p.line(coat,2,-13,4,arm+1);hand(5,arm);
        p.line(edge,-2,-11,4,-10);hand(4,-10);
    }else if(a==='run'){
        p.line(walnut,-5,-5,6,-15+rise);p.line(steel,3,-13+rise,8,-18+rise);hand(2,-10+rise);
    }else{
        p.line(walnut,-1,-5+rise,6,-19+rise);p.line(steel,3,-14+rise,8,-23+rise);
        p.line(glint,7,-21+rise,9,-25+rise);hand(2,-11+rise);
    }
}

function cavalry(p:Pixels,f:Faction,frame:number,moving:boolean,thrust:boolean){
    const [dark,coat]=shades(f),g=moving?frame%4:1;
    const feet=moving?[[-4,4,-3,5],[-2,2,2,3],[4,-3,4,-3],[1,-4,0,-5]][g]:[0,2,-1,1];
    const bob=moving&&g%2===0?-1:0;
    for(let i=0;i<4;i++){
        const hip=i<2?-8+i*2:6+(i-2)*2;
        const knee=hip+feet[i]*.55,y=-5+(moving&&i%2===g%2?-1:0);
        p.line(i%2?'#ae825a':'#664836',hip,-11+bob,knee,y);
        p.line(i%2?'#8c5f42':'#533e32',knee,y,hip+feet[i],moving&&g===2?-2:-1);
        p.box(ink,hip+feet[i],moving&&g===2?-2:0,3);
    }
    p.oval('#5a4235',0,-11+bob,11,5);p.oval('#976a48',0,-12+bob,10,4);p.box('#b58b63',-8,-14+bob,7);
    p.line(ink,-9,-14+bob,-15,-9+bob+g%2);p.line('#514130',-10,-14+bob,-15,-7+bob+g%2);
    p.oval('#83593c',8,-15+bob,4,5);p.box('#644c39',9,-21+bob,5,5);
    p.box('#956e4d',11,-20+bob,6,4);p.box('#b59673',15,-18+bob,3,3);
    p.box(ink,10,-23+bob,2,4);p.box(hide,13,-22+bob,1,3);p.box(ink,14,-20+bob);
    p.line(ivory,12,-19+bob,15,-16+bob);p.line('#3e342c',4,-14+bob,15,-17+bob);
    p.box(dark,-7,-15+bob,10,6);p.box(brass,-7,-10+bob,10);
    p.box('#593f2e',-4,-15+bob,7,2);p.box(boot,-1,-14+bob,3,6);p.box(ink,0,-9+bob,4,2);
    p.box(coat,-4,-23+bob,6,8);p.box('#5a7079',-2,-23+bob,5,7);
    p.box(steel,-2,-23+bob,4,5);p.box(glint,0,-22+bob,2,3);p.line(brass,-2,-23+bob,2,-18+bob);
    p.box(skin,-1,-26+bob,4,3);p.box('#555c60',-3,-29+bob,6,3);p.box(steel,-2,-29+bob,5);
    p.box(gilt,-1,-30+bob,3);p.box(ink,-2,-27+bob,7);
    p.line(f?'#c84939':'#252829',-2,-30+bob,-6,-28+bob-g%2);p.line(dark,-4,-22+bob,-9,-17+bob+g%2);
    p.box(skin,3,-20+bob,3,2);p.line(brass,4,-21+bob,6,-19+bob);
    p.line(steel,5,-21+bob,thrust?16:12,thrust?-20+bob:-28+bob);
    p.box(glint,thrust?16:12,thrust?-21+bob:-29+bob);
    if(moving){p.box('#a49a6a',-14-g,-1,3);p.box('#c0ac82',-18-g,-3,2);}
}

function wheel(p:Pixels,x:number,y:number,frame:number){
    for(let i=0;i<8;i++){
        const theta=(i+frame/4)*circle/8;
        p.line('#996a40',x,y,x+Math.cos(theta)*5,y+Math.sin(theta)*5);
    }
    for(let i=0;i<40;i++){
        const theta=i*circle/40;
        p.box(ink,x+Math.cos(theta)*6,y+Math.sin(theta)*6);
        p.box(Math.sin(theta)<0?'#bd8c53':'#755038',x+Math.cos(theta)*5,y+Math.sin(theta)*5);
    }
    p.box('#4e3c2e',x-1,y-1,3,3);p.box(gilt,x,y);
}

function crew(p:Pixels,f:Faction,x:number,y:number,role:number,frame:number,pushing:boolean){
    const step=pushing?[0,1,0,-1][frame%4]:0,lean=pushing?2:0;
    const coat=f?'#334d6c':'#314b74';
    p.box('#b7ac92',x-2,y-6,2,5);p.box(ivory,x+1,y-6,2,4);
    p.box(boot,x-2-step,y-2,3,2);p.box(ink,x+1+step,y-2,3,2);
    p.box(coat,x-3+lean,y-12,6,7);p.line(ivory,x-2+lean,y-12,x+2+lean,y-7);
    p.box('#be5540',x-3+lean,y-7,5);p.box(skin,x+lean,y-15,3,3);
    p.box(ink,x-2+lean,y-18,5,4);p.box(brass,x+1+lean,y-17);p.box(ink,x-2+lean,y-15,7);
    p.box('#bd493e',x-2+lean,y-19);
    const beat=[0,1,2,1][frame%4];
    if(pushing){
        p.line(coat,x+1,y-11,x+5,y-8);p.box(skin,x+4,y-8,2);
    }else if(role===0){
        p.line(walnut,x-4,y-6-beat,x+9,y-14-beat);p.box('#c9bb98',x+7,y-15-beat,4,3);p.box(skin,x+3,y-10-beat,2);
    }else if(role===1){
        p.oval('#272a2a',x+4,y-9+beat,3,3);p.box('#7c827e',x+3,y-11+beat,2);p.box(skin,x+2,y-8+beat,2);
    }else{
        p.line('#886342',x+2,y-8,x+8,y-13-beat);p.box('#c79056',x+8,y-13-beat);p.box(skin,x+3,y-9,2);
    }
}

function cannon(p:Pixels,f:Faction,a:Action,frame:number,dx:number,dy:number,crewCount:number){
    const marching=a==='march'||a==='run', recoil=a==='recoil'?[0,7,7,6,5,4,3,2,1][frame]:0;
    const x=-Math.round(recoil*dx),y=-Math.round(recoil*dy),wy=y-6;
    const pushing=marching||a==='recoil'&&frame>=3;
    if(crewCount>0)crew(p,f,-13,-5,0,frame,pushing);
    if(crewCount>1)crew(p,f,0,-7,1,frame,pushing);
    // Back wheel, oak trail and bronze barrel casting all travel with the carriage.
    const rotation=marching?frame:a==='recoil'?recoil:0;
    wheel(p,x+2,wy-4,rotation);
    p.line(ink,x-17*dx,y-2-17*dy,x+4*dx,y-8+4*dy);
    p.line(walnut,x-17*dx,y-3-17*dy,x+4*dx,y-9+4*dy);
    p.line('#b78a4e',x-15*dx,y-4-15*dy,x+3*dx,y-9+3*dy);
    const barrel=(from:number,to:number,thickness:number,col:string,offset=0)=>{
        const ax=x+dx*from-dy*offset,ay=y-10+dy*from+dx*offset;
        for(let i=0;i<thickness;i++)p.line(col,ax-dy*i,ay+dx*i,x+dx*to-dy*(offset+i),y-10+dy*to+dx*(offset+i));
    };
    barrel(-5,16,5,'#49372b',-2);barrel(-5,16,3,'#9d733c',-1);barrel(-4,16,1,'#edce85',-1);
    for(const ring of [-4,2,10,15]){barrel(ring,ring+1,6,'#76532e',-3);barrel(ring,ring+1,2,'#f1cc7f',-3);}
    barrel(17,17,3,ink,-1);wheel(p,x-1,wy,rotation);
    if(crewCount>2)crew(p,f,-17,5,2,frame,marching);
    if(!marching){
        p.box('#4d392a',-24,3,8,5);p.box('#9a7547',-24,3,8);p.box('#c6a75e',-22,3,1,5);p.box('#c6a75e',-18,3,1,5);
        p.box('#584b39',5,3,5,5);p.box(steel,5,3,5);p.box('#99927d',5,6,5);
    }
}

function heading(dx:number,dy:number){
    return ((Math.round(Math.atan2(dy,dx)*16/circle)%16)+16)%16;
}
function bake(kind:Kind,f:Faction,a:Action,dir:number,frame:number,role:number,crewCount:number,flash:boolean):Result {
    const key=[kind,f,a,dir,frame,role,crewCount,Number(flash)].join('/');
    const known=cache.get(key);if(known)return known;
    const gun=kind==='field_cannon', mounted=kind==='cuirassier',band=kind==='bannerman';
    const art=document.createElement('canvas');
    art.width=gun?65:mounted?42:band?46:46;art.height=gun?54:band?47:40;
    const footX=Math.floor(art.width/2),footY=art.height-(gun?17:band?3:9);
    const c=art.getContext('2d')!;c.imageSmoothingEnabled=false;
    c.translate(footX,footY);
    const angle=dir*circle/16,dx=Math.cos(angle),dy=Math.sin(angle);
    if(dx<-.001){c.scale(-1,1);c.translate(-1,0);}
    const p=new Pixels(c);
    if(gun)cannon(p,f,a,frame,Math.abs(dx),dy,crewCount);
    else if(mounted)cavalry(p,f,frame,a==='march'||a==='run',a==='thrust');
    else{
        infantry(p,f,kind==='guard_grenadier',a,frame,Math.abs(dx),dy,band?role:-1);
        if(band&&role===0)c.drawImage(banner(f,frame),2,-36,21,37);
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
    if(retreating||u.moving){
        action=retreating?'run':'march';
        frame=Math.floor((u.marchDistance??tick)/(gun?2.4:mounted?7:4))%4;
    }else if(u.kind==='guard_grenadier'&&throwAge>=0&&throwAge<8){
        action='throw';frame=Math.min(3,Math.floor(throwAge/2));
    }else if(u.pose==='bayonet')action='thrust';
    else if(gun&&since>=0&&since<40){
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
