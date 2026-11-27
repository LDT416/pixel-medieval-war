import * as T from 'three';
import {bake} from '../spriteBaker';
import {kinds,type Faction,type Kind} from '../../sim/arenaTypes';

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
    const moves:Motion[]=['stand','march','run','aim','load','thrust','recoil','die','flee','kneel','kneelLoad'];
    const counts=[6,8,8,6,8,6,8,6,8,4,4],cols=44,cw=92,ch=78,foot=56;
    const countFor=(k:Kind,a:Motion,n:number)=>(a==='stand'||a==='aim') && k!=='bannerman'?2:n;
    const footGroup=(k:Kind)=>k==='line_infantry'||k==='guard_grenadier';
    const total=2*(Object.keys(roles) as Kind[]).reduce((n,k)=>n+roles[k].length*moves.reduce((sum,a,i)=>
        sum+((a==='kneel'||a==='kneelLoad')&&!footGroup(k)?0:countFor(k,a,counts[i])),0),0);
    const canvas=document.createElement('canvas');canvas.width=cols*cw;canvas.height=Math.ceil(total/cols)*ch;
    const legacy=document.createElement('canvas');legacy.width=canvas.width;
    const extra=2*kinds.filter(footGroup).reduce((n,k)=>n+roles[k].length*8,0);
    legacy.height=Math.ceil((total-extra)/cols)*ch;
    let c=legacy.getContext('2d')!;c.imageSmoothingEnabled=false;
    const tiles:Tile[]=[],groups:Group[]=[];
    const key=(f:Faction,k:Kind,role:number,m:Motion,fr:number)=>[f,k,role,m,fr].join('/');
    const cells=new Map<string,number>();
    function draw(f:Faction,k:Kind,role:number,motion:Motion,fr:number){
        const kneeling=motion==='kneel'||motion==='kneelLoad';
        const a=motion==='kneel'?'stand':motion==='kneelLoad'?'load':motion;
        const b=bake(k,f,a==='die'?'stand':a==='flee'?'run':a,0,fr,role,3,false,a==='flee');
        const i=tiles.length,x=i%cols*cw,y=Math.floor(i/cols)*ch;
        c.save();c.beginPath();c.rect(x,y,cw,ch);c.clip();c.translate(x+cw/2,y+foot);
        if(kneeling)c.scale(1,.72);
        if(a==='die'){c.translate(0,fr*.7);c.rotate(-fr*.29);}
        const scale=k==='cuirassier'?1.42:1.5;
        c.scale(scale,scale);
        if(a==='stand'&&fr)c.translate(0,-.5);
        if(a==='aim'&&fr)c.translate(-1,0);
        c.drawImage(b.art,-b.footX,-b.footY);
        // 在目标像素密度上补画衣扣、肩饰、火枪背带和帽徽。
        if(k==='line_infantry'||k==='guard_grenadier'){
            c.scale(1/scale,1/scale);
            const lean=(a==='run'||a==='flee'?2:a==='thrust'?3:0)*scale,bob=(a==='march'||a==='run'||a==='flee') && fr%2?-1:0;
            c.fillStyle='#f4ce82';for(let j=0;j<3;j++)c.fillRect(Math.round(lean+1),-19+j*3+bob,1,1);
            c.fillStyle=role===3?'#e4b657':'#b3a58e';c.fillRect(Math.round(lean-4),-20+bob,3,1);
            if(a!=='flee'){c.fillStyle='#e2cc91';c.fillRect(Math.round(lean),-29+bob,1,2);}
        }
        c.restore();
        cells.set(key(f,k,role,motion,fr),i);
        tiles.push([x,y,cw,ch,cw/2,foot]);
    }
    // Preserve original atlas coordinates, including fractional scaling at each tile.
    const original:Motion[]=['stand','march','aim','load','thrust','recoil','run','die','flee'];
    for(const f of [0,1] as const)for(const k of kinds)for(const a of original)
        for(const role of roles[k])for(let fr=0;fr<countFor(k,a,counts[moves.indexOf(a)]);fr++)draw(f,k,role,a,fr);
    c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(legacy,0,0);
    for(const f of [0,1] as const)for(const k of kinds)if(footGroup(k))
        for(const role of roles[k])for(const a of ['kneel','kneelLoad'] as const)for(let fr=0;fr<4;fr++)draw(f,k,role,a,fr);
    for(const f of [0,1] as const)for(const k of kinds)for(const role of roles[k]){
        const frames:number[]=[];
        moves.forEach((motion,ai)=>{
            const a=footGroup(k)?motion:motion==='kneel'?'stand':motion==='kneelLoad'?'load':motion;
            const n=countFor(k,a,counts[moves.indexOf(a)]);
            for(let fr=0;fr<counts[ai];fr++){
                const i=cells.get(key(f,k,role,a,fr%n))!;frames.push(i,i,i,i);
            }
        });
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
    const w=current.fallback?92:65,h=current.fallback?78:57,label=140;
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
            const [sx,sy,sw,sh,fx,fy]=data.tiles[index];
            c.save();c.translate(label+(i*4+d+.5)*w,y+(current!.fallback?56:48));
            if(current!.fallback && d===1)c.scale(-1,1);
            c.drawImage(image,sx,sy,sw,sh,-fx,-fy,sw,sh);c.restore();
        }});
    });
    return canvas;
}
