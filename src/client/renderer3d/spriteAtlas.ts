import * as T from 'three';
import { bake } from '../spriteBaker';
import { kinds, type Action, type Company, type Soldier } from '../../sim/arenaTypes';
import { toX,toZ,terrainHeight } from './terrain3d';

type Motion=Action|'die'|'flee';
const counts:Record<Motion,number>={march:8,run:8,load:8,recoil:8,thrust:6,aim:2,stand:2,die:6,flee:8};
const variants=(k:string)=>k==='bannerman'?[0,1,2]:k==='cuirassier'?[0,1,2,3,4,5]:k==='guard_grenadier'||k==='field_cannon'?[0,1,3]:[0,1,2,3];
const actions:Motion[]=['stand','march','aim','load','thrust','recoil','run','die','flee'];
const cells=new Map<string,number>(), cols=44, cw=92,ch=78, foot=56;
const frameCount=(k:string,a:Motion)=>k==='bannerman' && (a==='aim'||a==='stand')?6:counts[a];
const rows=Math.ceil(2*kinds.reduce((n,k)=>n+variants(k).length*actions.reduce((sum,a)=>sum+frameCount(k,a),0),0)/cols);
function key(f:number,k:string,a:string,frame:number,role:number){return [f,k,a,frame,role].join('/');}
let atlasCanvas:HTMLCanvasElement;
function atlas(){
    const canvas=document.createElement('canvas');canvas.width=cols*cw;canvas.height=rows*ch;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    let i=0;
    for(const f of [0,1] as const)for(const k of kinds)for(const a of actions){
        for(const role of variants(k))for(let fr=0;fr<frameCount(k,a);fr++){
            const b=bake(k,f,a==='die'?'stand':a==='flee'?'run':a,0,fr,role,3,false,a==='flee'),x=i%cols*cw,y=Math.floor(i/cols)*ch;
            c.save();c.beginPath();c.rect(x,y,cw,ch);c.clip();c.translate(x+cw/2,y+foot);
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
            cells.set(key(f,k,a,fr,role),i++);
        }
    }
    atlasCanvas=canvas;
    const t=new T.CanvasTexture(canvas);t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.colorSpace=T.SRGBColorSpace;return t;
}
export function atlasPreview(){
    const canvas=atlasCanvas;
    const guide=document.createElement('canvas'); guide.width=160+actions.length*cw;guide.height=40+2*kinds.reduce((n,k)=>n+variants(k).length,0)*ch;
    const ctx=guide.getContext('2d')!;ctx.fillStyle='#242b30';ctx.fillRect(0,0,guide.width,guide.height);ctx.font='14px sans-serif';ctx.fillStyle='#efdfc3';
    ctx.fillText('1815 · 角色图鉴',8,24);
    ['站立','行军','瞄准','装填','突刺','后坐','奔跑','阵亡','溃逃'].forEach((label,i)=>ctx.fillText(label,193+i*cw,24));
    ctx.translate(0,40);
    let row=0;
    for(const f of [0,1])for(const k of kinds)for(const role of variants(k)){
        ctx.fillText((f?'联军':'法军')+' '+({line_infantry:'步兵',guard_grenadier:'近卫',field_cannon:'炮组',bannerman:'军乐旗组',cuirassier:'骑兵'}[k])+' '+(k==='bannerman'?['旗手','鼓手','团旗'][role]:['一','二','三','军官','统帅','参谋'][role]),8,row*ch+40);
        actions.forEach((a,col)=>{const pose=a==='die'?5:a==='load'?3:a==='march'?2:0;const i=cells.get(key(f,k,a,pose,role))!;ctx.drawImage(canvas,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,160+col*cw,row*ch,cw,ch)});
        row++;
    }
    return guide;
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
    private tint:T.InstancedBufferAttribute; private uv:T.InstancedBufferAttribute; private flip:T.InstancedBufferAttribute;
    private o=new T.Object3D();
    private frames=new Map<string,number[]>();
    private unitFrames=new WeakMap<Soldier,Record<Motion,number[]>>();
    constructor(scene:T.Scene) {
        const tex=atlas(),cap=2400,g=new T.PlaneGeometry(cw*.055,ch*.055);
        g.translate(0,(foot-ch/2)*.055,0);g.rotateX(-8*Math.PI/180);
        this.uv=attribute(g,'aUvRect',cap,4);this.flip=attribute(g,'aFlipFlash',cap,2);
        this.tint=attribute(g,'aTint',cap,3);

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
            .replace('#include <opaque_fragment>',`float edge=1.-min(texture2D(map,vMapUv+vec2(0.,1./${rows*ch}.)).a,texture2D(map,vMapUv-vec2(1./${cols*cw}.,0.)).a);
                outgoingLight+=rimColor*edge*.115+vec3(vTintHit.w*.8);
                #include <opaque_fragment>`);
        };
        this.mesh=new T.InstancedMesh(g,mat,cap);this.mesh.customDepthMaterial=depth;
        this.mesh.castShadow=this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
        const ag=new T.PlaneGeometry(1,1);ag.rotateX(-Math.PI/2);
        this.ao=new T.InstancedMesh(ag,new T.MeshBasicMaterial({map:softOval(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),cap);
        this.ao.frustumCulled=false;this.ao.renderOrder=1;scene.add(this.mesh,this.ao);
        for(const f of [0,1])for(const k of kinds)for(const a of actions)for(const role of variants(k)){
            this.frames.set(key(f,k,a,0,role),Array.from({length:frameCount(k,a)},(_,i)=>cells.get(key(f,k,a,i,role))??cells.get(key(f,k,a,0,role))!));
        }
    }
    draw(units:Soldier[],companies:Company[],tick:number,alpha:number){
        let n=0;const o=this.o,cap=this.mesh.instanceMatrix.count;
        for(const u of units)if((u.hp>0 || tick-u.diedAt<12) && n<cap){
            const c=companies[u.company];
            const offset=u.officer && u.hp>0 && !c.engaged && c.status!=='rout' && (c.formation==='line'||c.formation==='column');
            const ox=offset?c.hx*6+c.hy*13:0,oy=offset?c.hy*6-c.hx*13:0;
            const x=toX(ox+u.px+(u.x-u.px)*alpha),z=toZ(oy+u.py+(u.y-u.py)*alpha),h=terrainHeight(x,z);
            const role=u.general?4:u.kind==='cuirassier' && u.staff?5:u.officer?3:u.kind==='bannerman'?(u.id%3===0?1:u.faction && u.id%2?2:0):u.id%(u.kind==='guard_grenadier'||u.kind==='field_cannon'?2:3);
            const motion:Motion=u.hp<=0?'die':c.status==='rout'?'flee':u.pose;
            const phase=motion==='die'?(tick-u.diedAt)/2:u.moving?u.stride/4:motion==='load'?(tick-u.firedAt)/7:motion==='recoil'?(tick-u.firedAt)/2:(tick+u.id)/5;
            const fr=Math.floor(phase)%frameCount(u.kind,motion);
            let animation=this.unitFrames.get(u);
            if(!animation){
                animation={} as Record<Motion,number[]>;
                for(const a of actions)animation[a]=this.frames.get(key(u.faction,u.kind,a,0,role))!;
                this.unitFrames.set(u,animation);
            }
            const i=animation[motion][fr];
            this.uv.setXYZW(n,(i%cols+.0)/cols,1-(Math.floor(i/cols)+1)/rows,1/cols,1/rows);
            const tint=.88+(u.id*17%13)*.01;this.tint.setXYZ(n,tint,tint,tint*.99);
            this.flip.setXY(n,Number(u.face<0),Math.max(0,1-(tick-u.hitAt)/4));
            // 总司令放大 1.3 倍，方便在千军之中一眼找到。
            o.position.set(x,h+.045,z);o.scale.setScalar(u.general?1.3:1);o.updateMatrix();this.mesh.setMatrixAt(n,o.matrix);
            const big=u.kind==='cuirassier'||u.kind==='field_cannon';
            o.scale.set(big?3.7:1.7,1,big?1.5:.91);o.updateMatrix();this.ao.setMatrixAt(n,o.matrix);n++;
        }
        this.mesh.count=this.ao.count=n;
        for(const a of [this.mesh.instanceMatrix,this.ao.instanceMatrix,this.uv,this.flip,this.tint])upload(a,n);
    }
}
