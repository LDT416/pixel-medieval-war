import * as T from 'three';
import { bake } from '../spriteBaker';
import { kinds, type Action, type Soldier } from '../../sim/arenaTypes';
import { toX,toZ,terrainHeight } from './terrain3d';

const actions:Action[]=['stand','march','aim','load','thrust','recoil','run'];
const cells=new Map<string,number>(), cols=16, cw=76,ch=64, foot=48;
function key(f:number,k:string,a:string,frame:number,role:number){return [f,k,a,frame,role].join('/');}
function atlas(){
    const canvas=document.createElement('canvas');canvas.width=cols*cw;canvas.height=18*ch;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    let i=0;
    for(const f of [0,1] as const)for(const k of kinds)for(const a of actions){
        const roles=k==='bannerman'?2:1, frames=a==='stand'||a==='aim'?1:4;
        for(let role=0;role<roles;role++)for(let fr=0;fr<frames;fr++){
            const b=bake(k,f,a,0,fr,role,3,false),x=i%cols*cw,y=Math.floor(i/cols)*ch;
            c.drawImage(b.art,x+cw/2-b.footX,y+foot-b.footY);
            cells.set(key(f,k,a,fr,role),i++);
        }
    }
    const t=new T.CanvasTexture(canvas);t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.colorSpace=T.SRGBColorSpace;return t;
}
export function attribute(g:T.BufferGeometry,name:string,count:number,size:number){
    const a=new T.InstancedBufferAttribute(new Float32Array(count*size),size).setUsage(T.DynamicDrawUsage);
    g.setAttribute(name,a);return a;
}
export function upload(a:T.BufferAttribute,used:number,start=0){
    if(used<=0)return;
    a.clearUpdateRanges();a.addUpdateRange(start*a.itemSize,used*a.itemSize);a.needsUpdate=true;
}
export function softOval(){
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;
    const grad=ctx.createRadialGradient(32,32,1,32,32,31);grad.addColorStop(0,'rgba(20,14,10,.66)');grad.addColorStop(.45,'rgba(25,20,13,.42)');grad.addColorStop(1,'rgba(24,18,12,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);
}
export class Standees {
    mesh:T.InstancedMesh; ao:T.InstancedMesh; rim={value:new T.Color('#e7bb77')};
    private uv:T.InstancedBufferAttribute; private flip:T.InstancedBufferAttribute;
    private o=new T.Object3D();
    private frames=new Map<string,number[]>();
    private unitFrames=new WeakMap<Soldier,Record<Action,number[]>>();
    constructor(scene:T.Scene) {
        const tex=atlas(),cap=2200,g=new T.PlaneGeometry(cw*.084,ch*.084);
        g.translate(0,(foot-ch/2)*.084,0);g.rotateX(-8*Math.PI/180);
        this.uv=attribute(g,'aUvRect',cap,4);this.flip=attribute(g,'aFlipFlash',cap,2);
        const tint=attribute(g,'aTint',cap,3);
        for(let i=0;i<cap;i++){const t=.88+(i*17%13)*.01;tint.setXYZ(i,t,t,t*.99);}
        const mat=new T.MeshLambertMaterial({map:tex,alphaTest:.45,side:T.DoubleSide});
        const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:tex,alphaTest:.45,side:T.DoubleSide});
        for(const m of [mat,depth])m.onBeforeCompile=s=>{
            s.vertexShader='attribute vec4 aUvRect;attribute vec2 aFlipFlash;attribute vec3 aTint;varying vec4 vTintHit;\n'+s.vertexShader.replace('#include <uv_vertex>',
            '#include <uv_vertex>\n vMapUv=aUvRect.xy+vec2(mix(uv.x,1.-uv.x,aFlipFlash.x),uv.y)*aUvRect.zw;vTintHit=vec4(aTint,aFlipFlash.y);');
            if(m===depth)return;
            s.uniforms.rimColor=this.rim;
            s.fragmentShader='varying vec4 vTintHit;uniform vec3 rimColor;\n'+s.fragmentShader
            .replace('#include <lights_lambert_pars_fragment>',T.ShaderChunk.lights_lambert_pars_fragment.replace('saturate( dot( geometryNormal, directLight.direction ) )','(0.5+0.5*dot(geometryNormal,directLight.direction))'))
            .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *=vTintHit.rgb;')
            .replace('#include <opaque_fragment>',`float edge=1.-min(texture2D(map,vMapUv+vec2(0.,1./1152.)).a,texture2D(map,vMapUv-vec2(1./1216.,0.)).a);
                outgoingLight+=rimColor*edge*.115+vec3(vTintHit.w*.8);
                #include <opaque_fragment>`);
        };
        this.mesh=new T.InstancedMesh(g,mat,cap);this.mesh.customDepthMaterial=depth;
        this.mesh.castShadow=this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
        const ag=new T.PlaneGeometry(1,1);ag.rotateX(-Math.PI/2);
        this.ao=new T.InstancedMesh(ag,new T.MeshBasicMaterial({map:softOval(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),cap);
        this.ao.frustumCulled=false;this.ao.renderOrder=1;scene.add(this.mesh,this.ao);
        for(const f of [0,1])for(const k of kinds)for(const a of actions)for(let role=0;role<(k==='bannerman'?2:1);role++){
            this.frames.set(key(f,k,a,0,role),Array.from({length:4},(_,i)=>cells.get(key(f,k,a,i,role))??cells.get(key(f,k,a,0,role))!));
        }
    }
    draw(units:Soldier[],tick:number,alpha:number){
        let n=0;const o=this.o;
        for(const u of units)if(u.hp>0){
            const x=toX(u.x+u.vx*alpha/30),z=toZ(u.y+u.vy*alpha/30),h=terrainHeight(x,z);
            const role=u.kind==='bannerman' && u.id%3===0?1:0;
            const fr=(u.moving?Math.floor(u.stride/7):Math.floor((tick-u.firedAt)/4))&3;
            let animation=this.unitFrames.get(u);
            if(!animation){
                animation={} as Record<Action,number[]>;
                for(const a of actions)animation[a]=this.frames.get(key(u.faction,u.kind,a,0,role))!;
                this.unitFrames.set(u,animation);
            }
            const i=animation[u.pose][fr];
            this.uv.setXYZW(n,(i%cols+.0)/cols,1-(Math.floor(i/cols)+1)/18,1/cols,1/18);
            this.flip.setXY(n,Number(u.face<0),Math.max(0,1-(tick-u.hitAt)/4));
            o.position.set(x,h+.045,z);o.scale.set(1,1,1);o.updateMatrix();this.mesh.setMatrixAt(n,o.matrix);
            const big=u.kind==='cuirassier'||u.kind==='field_cannon';
            o.scale.set(big?3.7:1.7,1,big?1.5:.91);o.updateMatrix();this.ao.setMatrixAt(n,o.matrix);n++;
        }
        this.mesh.count=this.ao.count=n;
        for(const a of [this.mesh.instanceMatrix,this.ao.instanceMatrix,this.uv,this.flip])upload(a,n);
    }
}
