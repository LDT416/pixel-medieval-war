import * as T from 'three';
import {bake} from '../spriteBaker';
import type {Faction,Kind} from '../../sim/arenaTypes';

export type Motion='stand'|'march'|'run'|'aim'|'load'|'thrust'|'recoil'|'die'|'flee'|'kneel'|'kneelLoad';
export type Tile=[number,number,number,number,number,number];
interface Group {f:Faction;kind:Kind;role:number;label:string;frames:number[]}
interface Manifest {version:number;width:number;height:number;motions:Motion[];counts:number[];tiles:Tile[];groups:Group[]}
export interface Sheet{
    image:CanvasImageSource; tex:T.Texture; data:Manifest; groups:Map<string,Group>;
    offsets:Record<Motion,number>; counts:Record<Motion,number>; fallback:boolean;
}
let shared:Promise<Sheet>|undefined, current:Sheet|undefined;
export const groupKey=(f:number,k:Kind,r:number)=>f+'/'+k+'/'+r;
function sheet(tex:T.Texture,data:Manifest,fallback:boolean):Sheet{
    const offsets={} as Record<Motion,number>,counts={} as Record<Motion,number>;let base=0;
    data.motions.forEach((a,i)=>{offsets[a]=base;counts[a]=data.counts[i];base+=counts[a]*4;});
    const groups=new Map(data.groups.map(g=>[groupKey(g.f,g.kind,g.role),g]));
    const image=tex.image as HTMLCanvasElement|HTMLImageElement;
    if(data.version!==1||data.groups.some(g=>g.frames.length!==base)||image.width!==data.width||image.height!==data.height)throw Error('角色图集版本或尺寸不符');
    tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;tex.colorSpace=T.SRGBColorSpace;
    return {tex,image,data,offsets,counts,groups,fallback};
}
const roles:Record<Kind,number[]>={line_infantry:[0,1,2,3],guard_grenadier:[0,1,3],cuirassier:[0,1,2,3,4,5],field_cannon:[0,1,3],bannerman:[0,1,2]};
function fallbackSheet(){
    // 缺失离线图集时，仅绘制并缓存一套旧精灵的原生像素；左右朝向共用。
    const moves:Motion[]=['stand','march','run','aim','load','thrust','recoil','die','flee','kneel','kneelLoad'];
    const counts=[2,8,8,2,8,6,8,6,8,4,4],cols=60,cw=68,ch=58;
    const total=2*Object.values(roles).reduce((n,v)=>n+v.length,0)*counts.reduce((a,b)=>a+b);
    const canvas=document.createElement('canvas');canvas.width=cols*cw;canvas.height=Math.ceil(total/cols)*ch;
    const ctx=canvas.getContext('2d')!,tiles:Tile[]=[],groups:Group[]=[];ctx.imageSmoothingEnabled=false;
    for(const f of [0,1] as const)for(const k of Object.keys(roles) as Kind[])for(const role of roles[k]){
        const frames:number[]=[];
        moves.forEach((a,ai)=>{for(let fr=0;fr<counts[ai];fr++){
            const act=a==='die'?'stand':a==='flee'?'run':a==='kneel'?'stand':a==='kneelLoad'?'load':a;
            const b=bake(k,f,act,0,fr,role,3,false,a==='flee');
            const i=tiles.length,x=(i%cols)*cw,y=Math.floor(i/cols)*ch,w=b.art.width,h=b.art.height;
            ctx.save();ctx.beginPath();ctx.rect(x,y,cw,ch);ctx.clip();
            if(a==='die'){ctx.translate(x+b.footX,y+b.footY);ctx.rotate(-fr*.30);ctx.drawImage(b.art,-b.footX,-b.footY);}
            else if(a==='kneel'||a==='kneelLoad'){const split=b.footY-5;ctx.drawImage(b.art,0,0,w,split,x,y+3,w,split);ctx.drawImage(b.art,0,split+3,w,h-split-3,x,y+split+3,w,h-split-3);}
            else ctx.drawImage(b.art,x,y);
            ctx.restore();tiles.push([x,y,cw,ch,b.footX,b.footY]);frames.push(i,i,i,i);
        }});
        groups.push({f,kind:k,role,label:k+' '+role,frames});
    }
    return sheet(new T.CanvasTexture(canvas),{version:1,width:canvas.width,height:canvas.height,motions:moves,counts,tiles,groups},true);
}
export function loadSoldiers(){
    if(!shared)shared=(async()=>{
        if(new URLSearchParams(location.search).get('sprites')!=='baked'){
            current=fallbackSheet();
            return current;
        }
        try{
            const [data,tex]=await Promise.all([
                fetch('./art/soldiers/regiments.json').then(r=>{if(!r.ok)throw Error(String(r.status));return r.json() as Promise<Manifest>}),
                new T.TextureLoader().loadAsync('./art/soldiers/regiments.png')
            ]);
            current=sheet(tex,data,false);
        }catch{current=fallbackSheet();}
        return current;
    })();
    return shared;
}
export function atlasPreview(){
    if(!current)throw Error('角色图集正在载入');
    const {data,image,counts,offsets}=current;
    const w=65,h=57,label=140;
    const canvas=document.createElement('canvas');canvas.width=label+data.motions.length*4*w;canvas.height=78+data.groups.length*h;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.fillStyle='#272e33';c.fillRect(0,0,canvas.width,canvas.height);
    const names:Record<Motion,string>={stand:'站立',march:'行军',run:'奔跑',aim:'瞄准',load:'装填',thrust:'突刺',recoil:'后坐',die:'倒地',flee:'溃逃',kneel:'跪姿',kneelLoad:'跪姿装填'};
    c.fillStyle='#f4e9cd';c.font='bold 17px sans-serif';c.fillText('1815 · 角色图鉴',10,24);
    data.motions.forEach((a,i)=>{const x=label+i*4*w;c.fillStyle='#d5bc80';c.fillText(names[a],x+6,28);
        c.font='13px sans-serif';['侧右','侧左','斜前','斜后'].forEach((t,d)=>c.fillText(t,x+d*w+16,56));});
    data.groups.forEach((g,j)=>{
        const y=78+j*h;c.fillStyle=j%2?'#303a3d':'#343d40';c.fillRect(0,y,canvas.width,h-1);
        c.fillStyle=g.f?'#ffc5ae':'#b2d5f1';c.font='14px sans-serif';c.fillText((g.f?'联军':'法军')+' · '+g.label,9,y+32);
        data.motions.forEach((a,i)=>{for(let d=0;d<4;d++){
            const fr=a==='die'?counts[a]-1:Math.floor(counts[a]/3),index=g.frames[offsets[a]+fr*4+d];
            const [sx,sy,sw,sh,fx,fy]=data.tiles[index];c.drawImage(image,sx,sy,sw,sh,label+(i*4+d)*w+32-fx,y+48-fy,sw,sh);
        }});
    });
    return canvas;
}
