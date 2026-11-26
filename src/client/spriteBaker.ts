import {crews,UNITS} from '../sim/config';
import type {Faction,Kind,Unit} from '../sim/types';
type Pose=Unit['pose']|'braceNorth'|'braceSouth';
const cache=new Map<string,HTMLCanvasElement>();
const black='#222527',white='#e9e4cf',skin='#d9ad82',wood='#835c3a',gold='#dfb96c',silver='#c3ced2';
export function spritePalette(k:Kind,f:Faction){return [black,white,skin,wood,gold,silver,k==='rifleman'?'#315a3d':f?'#ae312b':'#285798'];}
export function sprite(k:Kind,f:Faction,pose:Pose|number='march1',flash=false){
    if(typeof pose==='number')pose=(['march1','march2','aim'] as const)[pose%3];
    const key=[k,f,pose,flash].join('/'),known=cache.get(key);if(known)return known;
    const mounted=UNITS[k].traits.includes('mount'),gun=!!crews[k],wagon=k==='supply_wagon';
    const art=document.createElement('canvas');art.width=gun||wagon?28:mounted?18:12;art.height=gun?20:mounted||wagon?16:15;
    const c=art.getContext('2d')!, coat=spritePalette(k,f)[6],step=pose==='march2'?1:0;
    const rect=(col:string,x:number,y:number,w=1,h=1)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    const line=(col:string,x:number,y:number,ex:number,ey:number)=>{
        const n=Math.max(Math.abs(ex-x),Math.abs(ey-y),1);for(let i=0;i<=n;i++)rect(col,Math.round(x+(ex-x)*i/n),Math.round(y+(ey-y)*i/n));};
    const wheel=(x:number,y:number,r:number)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){
        const d=Math.hypot(i,j);if(d<=r&&(d>=r-1||i===0||j===0||Math.abs(i)===Math.abs(j)))rect(d>=r-1?black:wood,x+i,y+j);}
        rect(gold,x,y);};
    if(gun){
        line(wood,1,18,16,10);line(wood,2,18,17,10);
        const muzzle=k==='howitzer'?21:27,high=k==='howitzer'?2:6;
        for(let i=0;i<(k==='howitzer'?6:4);i++)line(i===0?silver:i===1?'#82867e':black,9,10+i,muzzle,high+i);
        rect(gold,9,12,6,2);wheel(12,14,k==='horse_artillery'?4:5);
    }else if(wagon||mounted){
        const x=wagon?12:0;
        rect('#533b2b',x+2,8,11,5);rect('#956a45',x+3,8,9,3);rect('#684b36',x+11,6,4,5);rect(wood,x+13,5,4,3);
        rect(black,x+13,4,1,2);rect(black,x+15,5);line(black,x+2,9,x,13);
        for(const [leg,dx] of [[3,step?2:-1],[10,step?-1:2]]){line(wood,x+leg,12,x+leg+dx,15);rect(black,x+leg+dx,15,2);}
        if(wagon){rect('#594430',0,6,13,6);rect('#b69b6a',1,4,11,5);rect('#d0be94',2,3,9,4);wheel(3,12,3);wheel(10,12,3);}
        else{
            rect(black,6,1,5,2);rect(k==='cuirassier'?silver:gold,7,0,3,1);rect(skin,7,3,3,2);
            rect(k==='cuirassier'?silver:coat,5,5,5,4);rect(gold,5,5,2);line(white,6,5,9,8);rect(black,6,9,2,3);
            if(k==='lancer'){line(wood,9,8,16,0);rect('#c44939',13,1,3);rect(white,12,2,3);}
            else line(k==='dragoon'?wood:silver,9,7,16,k==='dragoon'?6:2);
        }
    }else{
        const kneel=pose==='kneel',thrust=pose==='bayonet',aim=pose==='aim',load=kneel||pose==='reload';
        const x=thrust?4:3,y=kneel?4:1;
        rect(black,x,y,4,3);rect(k==='peasant'?wood:black,x-1,y+2,6);
        rect(k==='rifleman'?'#48754b':gold,x+2,y+1);
        if(k==='guard_grenadier')rect(black,x-1,y-1,5,4);
        rect(skin,x+1,y+3,3,2);rect('#9b7256',x+1,y+4);
        rect(k==='peasant'?'#ae9473':coat,x-1,y+5,5,5);
        line(white,x-1,y+5,x+3,y+9);line(white,x+3,y+5,x,y+8);
        rect(gold,x-1,y+5,2);rect(gold,x+3,y+5);rect(black,x-1,y+10,5);
        if(k==='sapper')rect(white,x,y+7,4,4);
        if(k==='highlander')rect('#416850',x-1,y+10,5,2);
        if(kneel){rect(black,1,13,4,2);rect(black,6,12,2,3);rect(black,7,14,2);}
        else{rect(black,x-1-step,12,2,3);rect(black,x+2+step,11,2,3);rect(black,x+2+step,14,3);}
        if(k==='sapper'||k==='peasant'){
            line(wood,5,y+9,thrust?11:8,thrust?y+6:y+1);rect(k==='sapper'?silver:'#a39c82',thrust?9:7,thrust?y+5:y+1,3,2);
        }else if(pose==='braceNorth'||pose==='braceSouth'){
            const tip=pose==='braceNorth'?0:14;line(wood,3,10,8,tip+(tip? -2:2));line(white,7,tip+(tip?-3:3),8,tip);rect(skin,5,8,2);
        }else if(load){rect(wood,8,3,1,11);rect(silver,8,2,1,5);rect(skin,7,7,2);rect(skin,6,10,3);}
        else if(aim||thrust){rect(wood,3,y+7,8);rect(silver,6,y+6,6);rect(skin,7,y+7,2);if(thrust){rect(white,9,y+5,3);rect(white,11,y+4);}}
        else{line(wood,3,11,9,2);line(silver,7,5,10,0);rect(skin,5,8,2);}
    }
    const facingColor=f?'#ba3834':'#315eb2';
    if(gun){
        rect(facingColor,5,15,3,2);rect(gold,5,15);
        if(k==='horse_artillery'){wheel(3,15,2);rect('#aaa77f',0,10,7,3);}
    }else if(wagon)rect(facingColor,4,5,5,2);
    else if(mounted){rect(facingColor,3,9,4,2);if(k==='hussar'){line(gold,5,5,8,7);rect('#c54e39',6,0);}}
    else{
        rect(facingColor,3,pose==="kneel"?10:7,1,2);
        if(k==='rocket_crew'){line(black,2,12,9,1);line('#aa4d30',3,12,10,1);rect(silver,9,1,2);}
        if(k==='volley_gunner'){const y=pose==='aim'||pose==='bayonet'?6:2;rect('#696e6e',8,y,3,3);rect(black,8,y);rect(black,10,y+1);}
        if(k==='highlander'){rect('#6b884e',2,11,5,2);rect('#903f38',3,11,1,2);rect('#d4473b',3,1,2);}
        if(k==='rifleman')rect(facingColor,3,3,2);
    }
    if(flash){c.globalCompositeOperation='source-atop';rect('#f5e9dc44',0,0,art.width,art.height);}
    cache.set(key,art);return art;
}
