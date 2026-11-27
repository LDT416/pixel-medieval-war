import * as T from 'three';
import {layout,type Corridor} from '../../sim/maps';
import {Rng} from '../../sim/rng';
import {toX,toZ,terrainHeight,SCALE} from './terrain3d';

function surface(water:boolean){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
    const ctx=canvas.getContext('2d')!,img=ctx.createImageData(128,256),rng=new Rng(water?416:791);
    for(let y=0;y<256;y++)for(let x=0;x<128;x++){
        const edge=Math.min(x,127-x),t=x/127;
        const wobble=2*Math.sin(y*Math.PI/32)+1.5*Math.cos(y*Math.PI/16+x*.18);
        const grain=(rng.next()-.5)*(water?6:19);
        let r,g,b;
        if(water){
            const bank=Math.max(0,1-(edge+wobble)/15);
            const riffle=3*Math.sin(y*Math.PI/16+3*Math.sin(x*.06));
            r=54+bank*62+grain+riffle;g=102+bank*20+grain+riffle;b=112-bank*25+grain+riffle;
        }else{
            const rut=Math.min(Math.abs(t-.32),Math.abs(t-.69));
            const worn=Math.max(0,1-rut*17),grass=Math.max(0,1-(edge+wobble)/17);
            r=144+grain-worn*21-grass*27;g=123+grain-worn*19-grass*7;b=82+grain-worn*13-grass*7;
        }
        const i=(y*128+x)*4;img.data[i]=r;img.data[i+1]=g;img.data[i+2]=b;
        img.data[i+3]=Math.max(0,Math.min(255,(edge-wobble)*(water?76:42)));
    }
    ctx.putImageData(img,0,0);
    for(let i=0;i<(water?620:1000);i++){
        const x=rng.int(5,122),y=rng.int(0,255),light=rng.next()>.53;
        ctx.fillStyle=water?(light?'#a3c2bf':'#315c69'):(light?'#d6ba88':'#655b43');
        ctx.globalAlpha=water?.16+rng.next()*.29:.16+rng.next()*.26;
        ctx.fillRect(x,y,water?rng.int(2,10):rng.int(1,3),1);
    }
    const texture=new T.CanvasTexture(canvas);texture.wrapT=T.RepeatWrapping;texture.magFilter=T.NearestFilter;texture.colorSpace=T.SRGBColorSpace;
    return texture;
}
/** 以同一条地理中心线生成连续带状表面，世界高度跟随每侧地面。 */
function ribbon(path:Corridor,water:boolean,offset:number){
    const samples:{x:number;y:number}[]=[];
    for(let i=1;i<path.points.length;i++){
        const a=path.points[i-1],b=path.points[i],len=Math.hypot(b.x-a.x,b.y-a.y);
        const n=Math.max(1,Math.ceil(len/45));
        for(let j=0;j<n;j++){const t=j/n;samples.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    if(!samples.length)return null;
    samples.push(path.points[path.points.length-1]);
    const positions:number[]=[],indices:number[]=[],uv:number[]=[];let chain=0;
    for(let i=0;i<samples.length;i++){
        const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],p=samples[i];
        if(i)chain+=Math.hypot(p.x-a.x,p.y-a.y);
        const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
        for(const sign of [-1,1]){
            const x=toX(p.x-sign*dy/n*path.width/2),z=toZ(p.y+sign*dx/n*path.width/2);
            positions.push(x,terrainHeight(x,z)+offset,z);uv.push(sign<0?0:1,chain/(water?225:135));
        }
        if(i){const j=i*2;indices.push(j-2,j-1,j,j,j-1,j+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    const material=new T.MeshStandardMaterial({map:surface(water),alphaTest:.2,side:T.DoubleSide,roughness:water?.58:.96,polygonOffset:true,polygonOffsetFactor:-3});
    const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;return mesh;
}
export class Paths3d{
    readonly group=new T.Group();
    constructor(scene:T.Scene){scene.add(this.group);}
    rebuild(){
        this.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const m=o.material as T.MeshStandardMaterial;m.map?.dispose();m.dispose();}});
        this.group.clear();
        const water=ribbon(layout.river,true,.085);
        if(water)this.group.add(water);
        for(const road of layout.roads){
            const lane=ribbon(road,false,.06);if(lane)this.group.add(lane);
        }
        const forms:{x:number;y:number;z:number;sx:number;sy:number;sz:number;color:number}[]=[];
        for(const b of layout.bridges){
            const x=toX(b.x),z=toZ(b.y),w=b.w*SCALE,d=b.h*SCALE;
            if(b.kind==='ford'){
                for(let i=0;i<14;i++){
                    const px=x+(i/13-.5)*w,pz=z+Math.sin(i*3.6)*d*.22;
                    forms.push({x:px,y:terrainHeight(px,pz)+.1,z:pz,sx:.55,sy:.18,sz:.4,color:0x9f9a7b});
                }
                continue;
            }
            const h=Math.max(terrainHeight(x-w/2,z),terrainHeight(x+w/2,z))+.25;
            forms.push({x,y:h,z,sx:w,sy:.48,sz:d,color:0xab966e});
            const boards=Math.ceil(w/.38);
            for(let i=0;i<boards;i++)forms.push({x:x+((i+.5)/boards-.5)*w,y:h+.25,z,
                sx:w/boards*.94,sy:.12,sz:d*.96,color:[0xae9270,0x9a825e,0xb49a78,0xa88c69][i%4]});
            for(const side of [-1,1]){
                const pz=z+side*d*.49;
                forms.push({x,y:h+.49,z:pz,sx:w+.06,sy:.18,sz:.14,color:0xb9aa90});
                for(let i=0;i<6;i++)forms.push({x:x+(i/5-.5)*w,y:h+.23,z:pz,sx:.22,sy:.69,sz:.22,color:0x8c8170});
            }
        }
        if(forms.length){
            const blocks=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial({roughness:.93}),forms.length),m=new T.Object3D();
            forms.forEach((b,i)=>{m.position.set(b.x,b.y,b.z);m.scale.set(b.sx,b.sy,b.sz);m.updateMatrix();blocks.setMatrixAt(i,m.matrix);blocks.setColorAt(i,new T.Color(b.color));});
            blocks.castShadow=blocks.receiveShadow=true;this.group.add(blocks);
        }
    }
}
