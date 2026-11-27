import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Rng} from '../../sim/rng';
import {layout} from '../../sim/maps';
import {toX,toZ,SCALE,terrainHeight} from './terrain3d';
const ART=['farmhouse','oak','beech','spruce','bush','haystack','hedge'] as const;
type Art=typeof ART[number];
/** 农庄与树林：用仓库里现成的 px_*.png 像素画做成立牌，随每局地图重新摆放。 */
class FlatScenery {
    private group=new T.Group();private mats=new Map<Art,{mat:T.Material;depth:T.Material;aspect:number}>();
    private plane=new T.PlaneGeometry(1,1).translate(0,.5,0).rotateX(-8*Math.PI/180);
    constructor(scene:T.Scene){scene.add(this.group);}
    async load(){
        const loader=new T.TextureLoader();
        await Promise.all(ART.map(async name=>{
            try{
                const t=await loader.loadAsync('./art/px_'+name+'.png');
                t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.colorSpace=T.SRGBColorSpace;
                const img=t.image as {width:number;height:number};
                this.mats.set(name,{aspect:img.width/Math.max(1,img.height),
                    mat:new T.MeshLambertMaterial({map:t,alphaTest:.5,side:T.DoubleSide}),
                    depth:new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:t,alphaTest:.5,side:T.DoubleSide})});
            }catch{/* 缺图时直接跳过该装饰 */}
        }));
    }
    private put(name:Art,x:number,z:number,height:number,flip=false){
        const m=this.mats.get(name);if(!m)return;
        const mesh=new T.Mesh(this.plane,m.mat);mesh.customDepthMaterial=m.depth as T.MeshDepthMaterial;
        mesh.castShadow=mesh.receiveShadow=true;
        mesh.position.set(x,terrainHeight(x,z)-.15,z);mesh.scale.set(height*m.aspect*(flip?-1:1),height,1);
        this.group.add(mesh);
    }
    rebuild(){
        this.group.clear();
        const rng=new Rng(Math.floor(layout.seed*1000)+7);
        for(const f of layout.farms){
            const x=toX(f.x),z=toZ(f.y);
            this.put('farmhouse',x,z-1,f.w*SCALE*.95);
            this.put('haystack',x+f.w*SCALE*.55,z+2.5,2.8);
            this.put('haystack',x-f.w*SCALE*.6,z+3.2,2.4,true);
            for(let i=-2;i<=2;i++)this.put('hedge',x+i*f.w*SCALE*.24,z+f.h*SCALE*.62,1.3,i%2===0);
        }
        const kinds:Art[]=['oak','beech','spruce','oak','bush'];
        for(const g of layout.woods){
            const n=Math.round(g.r*g.r/2300);
            const list:{x:number;z:number;h:number;a:Art}[]=[];
            for(let i=0;i<n;i++){
                const a=rng.next()*Math.PI*2,r=Math.sqrt(rng.next())*g.r;
                list.push({x:toX(g.x+Math.cos(a)*r),z:toZ(g.y+Math.sin(a)*r*.9),h:5.5+rng.next()*4,a:kinds[rng.int(0,kinds.length-1)]});
            }
            list.sort((p,q)=>p.z-q.z);
            for(const t of list)this.put(t.a,t.x,t.z,t.a==='bush'?t.h*.45:t.h,rng.next()<.5);
        }
    }
}


export class Scenery{
    private flat:FlatScenery;
    private models=new Map<string,T.Mesh>();
    private batches:T.InstancedMesh[]=[];
    private fallback=false;
    constructor(private scene:T.Scene,private wind:{value:number}){this.flat=new FlatScenery(scene);}
    async load(){
        try{
            const gltf=await new GLTFLoader().loadAsync('./models/battlefield.glb');
            for(const name of ['Farm','Trunk','Crown0','Crown1','Crown2','Shrub','Rock']){
                const mesh=gltf.scene.getObjectByName(name);
                if(!(mesh instanceof T.Mesh))throw Error(name);
                if(name.startsWith('Crown')){
                    const material=(mesh.material as T.MeshStandardMaterial).clone();
                    material.onBeforeCompile=s=>{s.uniforms.uWind=this.wind;
                        s.vertexShader='uniform float uWind;\n'+s.vertexShader.replace('#include <begin_vertex>',
                            '#include <begin_vertex>\n transformed.x+=.026*position.y*sin(uWind*1.7+instanceMatrix[3].x*.34+instanceMatrix[3].z*.4);');};
                    mesh.material=material;
                }
                this.models.set(name,mesh);
            }
        }catch{this.fallback=true;await this.flat.load();}
    }
    rebuild(){
        if(this.fallback){this.flat.rebuild();return;}
        if(!this.models.size)return;
        for(const m of this.batches){this.scene.remove(m);m.dispose();}this.batches=[];
        const groups=new Map<string,T.Matrix4[]>(),rng=new Rng(Math.floor(layout.seed*1000)+7),o=new T.Object3D();
        const put=(name:string,x:number,z:number,scale:number,yaw:number)=>{
            o.position.set(x,terrainHeight(x,z)-.08,z);o.rotation.y=yaw;o.scale.setScalar(scale);o.updateMatrix();
            if(!groups.has(name))groups.set(name,[]);groups.get(name)!.push(o.matrix.clone());
        };
        for(const f of layout.farms){put('Farm',toX(f.x),toZ(f.y),f.w*SCALE/9.5,layout.farmOwner===0?Math.PI:0);}
        for(const g of layout.woods)for(let i=0;i<Math.round(g.r*g.r/2300);i++){
            const a=rng.next()*Math.PI*2,r=Math.sqrt(rng.next())*g.r,x=toX(g.x+Math.cos(a)*r),z=toZ(g.y+Math.sin(a)*r);
            const size=.8+rng.next()*.45,yaw=rng.next()*Math.PI*2;
            put('Trunk',x,z,size,yaw);put('Crown'+rng.int(0,2),x,z,size,yaw);
            if(i%3===0)put(i%9===0?'Rock':'Shrub',x+1.1,z-.8,size,yaw);
        }
        for(const [name,matrices] of groups){
            const src=this.models.get(name)!,batch=new T.InstancedMesh(src.geometry,src.material,matrices.length);
            matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.castShadow=batch.receiveShadow=true;
            this.scene.add(batch);this.batches.push(batch);
        }
    }
}
