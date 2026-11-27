import * as T from 'three';
import {layout,type Corridor} from '../../sim/maps';
import {toX,toZ,terrainHeight,SCALE} from './terrain3d';

/** 以同一条地理中心线生成连续带状表面，世界高度跟随每侧地面。 */
function ribbon(path:Corridor,color:number,offset:number){
    const samples:{x:number;y:number}[]=[];
    for(let i=1;i<path.points.length;i++){
        const a=path.points[i-1],b=path.points[i],len=Math.hypot(b.x-a.x,b.y-a.y);
        const n=Math.max(1,Math.ceil(len/45));
        for(let j=0;j<n;j++){const t=j/n;samples.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    if(!samples.length)return null;
    samples.push(path.points[path.points.length-1]);
    const positions:number[]=[],indices:number[]=[];
    for(let i=0;i<samples.length;i++){
        const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],p=samples[i];
        const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
        for(const sign of [-1,1]){
            const x=toX(p.x-sign*dy/n*path.width/2),z=toZ(p.y+sign*dx/n*path.width/2);
            positions.push(x,terrainHeight(x,z)+offset,z);
        }
        if(i){const j=i*2;indices.push(j-2,j-1,j,j,j-1,j+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const material=new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.9,polygonOffset:true,polygonOffsetFactor:-3});
    const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;return mesh;
}
export class Paths3d{
    readonly group=new T.Group();
    constructor(scene:T.Scene){scene.add(this.group);}
    rebuild(){
        this.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});
        this.group.clear();
        const water=ribbon(layout.river,0x598b92,.085);
        if(water)this.group.add(water);
        for(const road of layout.roads){
            const lane=ribbon(road,0xa99c74,.06);if(lane)this.group.add(lane);
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
