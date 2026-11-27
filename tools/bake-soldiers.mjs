// 用 Three.js 的低模几何进行离线正交光栅化。每个像素只采样中心一次。
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import * as T from 'three';
import {roles,motions,labels,palette,model} from './soldier-model.mjs';

const folder=new URL('../public/art/soldiers/',import.meta.url);
mkdirSync(folder,{recursive:true});
const directions=[-.37,Math.PI+.37,-1.04,1.10];
const elevation=39*Math.PI/180,cs=Math.cos(elevation),sn=Math.sin(elevation);
const colors=[0,...palette(0),...palette(1)];
const chunkWidth=4096,raw=new Uint8Array(chunkWidth*4096);
let atlasX=1,atlasY=1,lineHeight=0;
const table=[],groups=[],known=new Map();
const counts=Object.values(motions),names=Object.keys(motions);
const angles=directions.map(a=>new T.Matrix4().makeRotationY(a));
const transform=new T.Matrix4(),basis=new T.Matrix4(),v=new T.Vector3();

function project(parts,root,faction,dir,width,height,fall){
    const pixels=new Uint8Array(width*height), depth=new Float32Array(width*height).fill(-Infinity);
    // 物体原点与脚跟对齐。每种朝向用同一个像素格，不做图像旋转或放大。
    const anchorX=width/2+Math.round(Math.cos(directions[dir])*fall*(width===32?12:8)),anchorY=height-7,scale=width===32?.94:1.08;
    basis.multiplyMatrices(angles[dir],root);
    for(const {geometry,o,paint} of parts){
        o.updateMatrix();transform.multiplyMatrices(basis,o.matrix);
        const positions=geometry.attributes.position,indices=geometry.index?.array;
        const verts=new Float32Array(positions.count*3);
        for(let i=0;i<positions.count;i++){
            v.fromBufferAttribute(positions,i).applyMatrix4(transform);
            verts[i*3]=anchorX+v.x*scale;
            verts[i*3+1]=anchorY-(cs*v.y-sn*v.z)*scale;
            verts[i*3+2]=(sn*v.y+cs*v.z)*scale;
        }
        for(let i=0;i<(indices?.length??positions.count);i+=3){
            const a=(indices?indices[i]:i)*3,b=(indices?indices[i+1]:i+1)*3,c=(indices?indices[i+2]:i+2)*3;
            const x=verts[a],y=verts[a+1],z=verts[a+2];
            const bx=verts[b]-x,by=verts[b+1]-y,bz=verts[b+2]-z;
            const cx=verts[c]-x,cy=verts[c+1]-y,cz=verts[c+2]-z;
            const area=bx*cy-by*cx;
            if(area>=-.00001)continue;
            const nx=by*cz-bz*cy,ny=bz*cx-bx*cz,nz=area;
            const light=(nx*.38+ny*.81-nz*.44)/Math.hypot(nx,ny,nz);
            const color=1+faction*32+paint[light>.39?2:light>-.12?1:0];
            const x0=Math.max(1,Math.ceil(Math.min(x,verts[b],verts[c])-.5)),x1=Math.min(width-2,Math.floor(Math.max(x,verts[b],verts[c])-.5));
            const y0=Math.max(1,Math.ceil(Math.min(y,verts[b+1],verts[c+1])-.5)),y1=Math.min(height-2,Math.floor(Math.max(y,verts[b+1],verts[c+1])-.5));
            for(let py=y0;py<=y1;py++)for(let px=x0;px<=x1;px++){
                const dx=px+.5-x,dy=py+.5-y,u=(dx*cy-dy*cx)/area,t=(bx*dy-by*dx)/area;
                if(u<0||t<0||u+t>1)continue;
                const d=z+u*bz+t*cz,idx=py*width+px;
                if(d>depth[idx]){depth[idx]=d;pixels[idx]=color;}
            }
        }
    }
    const outlined=pixels.slice();
    let left=width,right=-1,top=height,bottom=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const i=y*width+x;
        if(!pixels[i]&&(pixels[i-1]||pixels[i+1]||pixels[i-width]||pixels[i+width]))outlined[i]=1+32*faction;
        if(outlined[i]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    }
    if(right<left)throw Error('模型投影为空');
    const w=right-left+1,h=bottom-top+1,packed=Buffer.alloc(w*h);
    for(let y=0;y<h;y++)packed.set(outlined.subarray((top+y)*width+left,(top+y)*width+left+w),y*w);
    return {w,h,x:anchorX-left,y:anchorY-top,pixels:packed};
}
function pack(tile){
    const {w,h,x,y,pixels}=tile;
    const sig=[w,h,x,y,createHash('sha1').update(pixels).digest('hex')].join('/');
    let i=known.get(sig);
    if(i===undefined){
        if(atlasX+w+1>chunkWidth){atlasX=1;atlasY+=lineHeight+2;lineHeight=0;}
        if(atlasY+h+1>4096)throw Error('图集超过 4096，请分图集');
        for(let row=0;row<h;row++)raw.set(pixels.subarray(row*w,row*w+w),(atlasY+row)*chunkWidth+atlasX);
        i=table.length;table.push([atlasX,atlasY,w,h,x,y]);known.set(sig,i);
        atlasX+=w+2;lineHeight=Math.max(lineHeight,h);
    }
    return i;
}
for(const f of [0,1])for(const [kind,list] of Object.entries(roles))for(const role of list){
    const frames=[],mounted=kind==='cuirassier'||kind==='field_cannon';
    for(const [a,count] of Object.entries(motions))for(let fr=0;fr<count;fr++){
        const m=model(f,kind,role,a,fr);
        for(let dir=0;dir<4;dir++)frames.push(pack(project(m.parts,m.root,f,dir,mounted?64:32,mounted?56:48,a==='die'?fr/(count-1):0)));
    }
    groups.push({f,kind,role,label:labels[kind][f][role],frames});
}
const height=atlasY+lineHeight+1;
function pngChunk(type,bytes){
    const name=Buffer.from(type),data=Buffer.concat([name,bytes]);let crc=0xffffffff;
    for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    const prefix=Buffer.alloc(4),suffix=Buffer.alloc(4);prefix.writeUInt32BE(bytes.length);suffix.writeUInt32BE((crc^0xffffffff)>>>0);
    return Buffer.concat([prefix,data,suffix]);
}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(chunkWidth);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=3;
const bytes=Buffer.alloc((chunkWidth+1)*height);
for(let y=0;y<height;y++)bytes.set(raw.subarray(y*chunkWidth,(y+1)*chunkWidth),y*(chunkWidth+1)+1);
const plte=Buffer.from(colors.flatMap(n=>[n>>16,(n>>8)&255,n&255]));
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),
    pngChunk('PLTE',plte),pngChunk('tRNS',Buffer.from([0])),pngChunk('IDAT',deflateSync(bytes,{level:9})),pngChunk('IEND',Buffer.alloc(0))]);
writeFileSync(new URL('regiments.png',folder),png);
writeFileSync(new URL('regiments.json',folder),JSON.stringify({version:1,width:chunkWidth,height,motions:names,counts,groups,tiles:table}));
console.log(groups.length+' 套外观 · '+groups.reduce((s,g)=>s+g.frames.length,0)+' 帧 · '+table.length+' 个独立图块 · '+chunkWidth+'×'+height+' · PNG '+png.length+' 字节');
