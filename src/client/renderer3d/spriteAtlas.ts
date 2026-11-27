import * as T from 'three';
import {PACE} from '../../sim/scale';
import type {Company,Soldier} from '../../sim/arenaTypes';
import {toX,toZ,terrainHeight} from './terrain3d';
import {loadSoldiers,groupKey,type Sheet,type Motion} from './soldierSheets';
export {atlasPreview} from './soldierSheets';
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
    private sheet?:Sheet;
    private unitGroups=new WeakMap<Soldier,{group:Sheet['data']['groups'][number];kneelAt:number}>();
    readonly ready:Promise<void>;
    constructor(scene:T.Scene) {
        const tex=new T.Texture(),cap=2400,g=new T.PlaneGeometry(1,1);
        this.uv=attribute(g,'aUvRect',cap,4);this.flip=attribute(g,'aFlipFlash',cap,2);
        this.tint=attribute(g,'aTint',cap,3);

        const mat=new T.MeshLambertMaterial({map:tex,alphaTest:.45,side:T.DoubleSide});
        const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:tex,alphaTest:.45,side:T.DoubleSide});
        const atlasPixel={value:new T.Vector2()};
        for(const m of [mat,depth])m.onBeforeCompile=s=>{
            s.vertexShader='attribute vec4 aUvRect;attribute vec2 aFlipFlash;attribute vec3 aTint;varying vec4 vTintHit;\n'+s.vertexShader.replace('#include <uv_vertex>',
            '#include <uv_vertex>\n vMapUv=aUvRect.xy+vec2(mix(uv.x,1.-uv.x,aFlipFlash.x),uv.y)*aUvRect.zw;vTintHit=vec4(aTint,aFlipFlash.y);');
            if(m===depth)return;
            s.uniforms.rimColor=this.rim;s.uniforms.atlasPixel=atlasPixel;
            s.fragmentShader='varying vec4 vTintHit;uniform vec3 rimColor;uniform vec2 atlasPixel;\n'+s.fragmentShader
            .replace('#include <lights_lambert_pars_fragment>',T.ShaderChunk.lights_lambert_pars_fragment.replace('saturate( dot( geometryNormal, directLight.direction ) )','(0.5+0.5*dot(geometryNormal,directLight.direction))'))
            .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *=vTintHit.rgb;')
            .replace('#include <opaque_fragment>',`float edge=1.-min(texture2D(map,vMapUv+vec2(0.,atlasPixel.y)).a,texture2D(map,vMapUv-vec2(atlasPixel.x,0.)).a);
                outgoingLight+=rimColor*edge*.115+vec3(vTintHit.w*.8);
                #include <opaque_fragment>`);
        };
        this.mesh=new T.InstancedMesh(g,mat,cap);this.mesh.customDepthMaterial=depth;
        this.mesh.castShadow=this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
        const ag=new T.PlaneGeometry(1,1);ag.rotateX(-Math.PI/2);
        this.ao=new T.InstancedMesh(ag,new T.MeshBasicMaterial({map:softOval(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),cap);
        this.ao.frustumCulled=false;this.ao.renderOrder=1;scene.add(this.mesh,this.ao);
        this.mesh.count=this.ao.count=0;
        this.ready=loadSoldiers().then(sheet=>{
            this.sheet=sheet;mat.map=depth.map=sheet.tex;atlasPixel.value.set(1/sheet.data.width,1/sheet.data.height);
            mat.needsUpdate=depth.needsUpdate=true;tex.dispose();
        });
    }
    draw(units:Soldier[],companies:Company[],tick:number,alpha:number){
        const sheet=this.sheet;if(!sheet)return;
        let n=0;const o=this.o,cap=this.mesh.instanceMatrix.count;
        for(const u of units)if((u.hp>0 || tick-u.diedAt<12) && n<cap){
            const c=companies[u.company];
            const offset=u.officer && u.hp>0 && !c.engaged && c.status!=='rout' && (c.formation==='line'||c.formation==='column');
            const ox=offset?c.hx*6+c.hy*13:0,oy=offset?c.hy*6-c.hx*13:0;
            const x=toX(ox+u.px+(u.x-u.px)*alpha),z=toZ(oy+u.py+(u.y-u.py)*alpha),h=terrainHeight(x,z);
            let state=this.unitGroups.get(u);
            if(!state){
                const count=u.kind==='guard_grenadier'||u.kind==='field_cannon'?2:3;
                // 制服按连队固定，旗鼓分工、帽穗与脚步相位再区分个人。
                const role=u.general?4:u.kind==='cuirassier' && u.staff?5:u.officer?3:
                    u.kind==='bannerman'?(u.id%3===0?1:u.faction && u.id%2?2:0):c.id%count;
                state={group:sheet.groups.get(groupKey(u.faction,u.kind,role))!,kneelAt:-1};
                this.unitGroups.set(u,state);
            }
            const motion:Motion=u.hp<=0?'die':c.status==='rout'?'flee':u.pose as Motion;
            if(motion==='kneel'){if(state.kneelAt<0)state.kneelAt=tick;}else state.kneelAt=-1;
            const phase=motion==='kneel'?Math.min(3,(tick-state.kneelAt)/2):motion==='die'?(tick-u.diedAt)/2:(motion==='march'||motion==='run'||motion==='flee')?u.stride*sheet.counts[motion]/PACE.strideLength:motion==='load'||motion==='kneelLoad'?(tick-u.firedAt)/8:
                motion==='recoil'?(tick-u.firedAt)/2:(tick+u.id)/5;
            const fr=Math.max(0,Math.floor(phase))%sheet.counts[motion];
            // 相机北向固定，溃逃与白刃用运动朝向；阵列其余时候保持团朝向。
            const free=c.status==='rout'||c.engaged;
            const dx=free?u.face*Math.max(8,Math.abs(u.vx)):c.hx, dz=free?u.vy:c.hy;
            const diagonal=Math.abs(dz)>.54*Math.abs(dx),dir=diagonal?(dz>=0?2:3):(dx>=0?0:1);
            const flip=sheet.fallback?dx<0:diagonal && dx<0;
            const i=state.group.frames[sheet.offsets[motion]+fr*4+dir];
            const [sx,sy,w,hp,fx,fy]=sheet.data.tiles[i],sheetW=sheet.data.width,sheetH=sheet.data.height;
            this.uv.setXYZW(n,sx/sheetW,1-(sy+hp)/sheetH,w/sheetW,hp/sheetH);
            const tint=.91+(u.id*17%10)*.01;
            this.tint.setXYZ(n,tint,tint,tint*.99);
            this.flip.setXY(n,Number(flip),Math.max(0,1-(tick-u.hitAt)/4));
            const px=(sheet.fallback?.083:.074)*(u.general?1.22:1);
            const rise=(fy-hp/2)*px;
            o.position.set(x+(flip?-1:1)*(w/2-fx)*px,h+.045+rise*.99027,z-rise*.13917);
            const stagger=u.hp>0?Math.max(0,1-(tick-u.hitAt)/4)*u.face*.15:0;
            o.rotation.set(-.139626,0,stagger);o.scale.set(w*px,hp*px,1);o.updateMatrix();this.mesh.setMatrixAt(n,o.matrix);
            o.rotation.set(0,0,0);o.position.set(x,h+.045,z);
            const big=u.kind==='cuirassier'||u.kind==='field_cannon';
            o.scale.set(big?3.7:1.7,1,big?1.5:.91);o.updateMatrix();this.ao.setMatrixAt(n,o.matrix);n++;
        }
        this.mesh.count=this.ao.count=n;
        for(const a of [this.mesh.instanceMatrix,this.ao.instanceMatrix,this.uv,this.flip,this.tint])upload(a,n);
    }
}
