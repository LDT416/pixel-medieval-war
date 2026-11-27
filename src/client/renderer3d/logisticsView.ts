import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {SimWorld} from '../../sim/world';
import {toX,toZ,terrainHeight} from './terrain3d';

function sculpt(kind:'rider'|'wagon'|'brigade'|'corps',f:number){
    const parts:T.BufferGeometry[]=[],coat=f?'#954538':'#385a81',gold='#dfbd71';
    function part(g:T.BufferGeometry,col:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,rz=0){
        const shape=g.index?g.toNonIndexed():g;shape.deleteAttribute('uv');shape.scale(sx,sy,sz);shape.rotateX(rx);shape.rotateZ(rz);shape.translate(x,y,z);
        shape.computeVertexNormals();const colors=new Float32Array(shape.attributes.position.count*3),c=new T.Color(col);
        for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
        shape.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(shape);
    }
    const box=(col:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,rz=0)=>part(new T.BoxGeometry(),col,x,y,z,sx,sy,sz,0,rz);
    if(kind==='rider'){
        const horse='#79523d';box(horse,0,.95,0,1.55,.64,.55);
        box(horse,.69,1.25,0,.37,.81,.40,-.35);box(horse,.92,1.58,0,.60,.30,.35);
        for(const x of [-.52,.54])for(const z of [-.20,.20])box('#503c32',x,.43,z,.16,.83,.14,(x+z)*.17);
        box('#40362d',-.87,.91,0,.16,.66,.17,-.32);box('#593f30',-.03,1.31,0,.69,.15,.62);
        box(coat,-.06,1.62,0,.41,.55,.4);box('#f2d1a7',-.03,2.02,0,.30,.30,.29);
        box('#35363a',-.04,2.25,0,.36,.23,.32);box(gold,.08,1.57,.21,.07,.42,.035,-.4);
        box('#b68c58',-.27,1.44,.28,.31,.23,.14);box('#f5e3bf',-.27,1.54,.30,.23,.035,.08);
    }else if(kind==='wagon'){
        box('#775639',0,.65,0,2.15,.22,1.10);box('#ad895f',0,.96,0,1.86,.48,1.04);
        for(const x of [-.56,0,.56])box('#786448',x,1.22,0,.05,.05,1.03);
        box(coat,0,1.30,0,1.78,.14,.99);
        for(const x of [-.69,.69])for(const z of [-.62,.62]){
            part(new T.CylinderGeometry(.37,.37,.12,10),'#473d32',x,.40,z,1,1,1,Math.PI/2);
            part(new T.CylinderGeometry(.22,.22,.13,8),'#997853',x,.40,z,1,1,1,Math.PI/2);
        }
        box('#8a704c',1.44,.52,-.36,1,.08,.08);box('#8a704c',1.44,.52,.36,1,.08,.08);
    }else{
        box('#87754c',0,1.65,0,.05,3.3,.05);
        const n=kind==='corps'?2:1;
        for(let i=0;i<n;i++){
            const y=3.06-i*.36;
            const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,-.36,0,.8,-.16,0],3));
            part(g,i===0?gold:coat,0,y,0,1,1,1);
        }
    }
    return mergeGeometries(parts);
}
export class LogisticsView{
    private group=new T.Group();
    private batches=new Map<string,T.InstancedMesh>();
    private o=new T.Object3D();private material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
    constructor(scene:T.Scene){scene.add(this.group);}
    private put(kind:'rider'|'wagon'|'brigade'|'corps',f:number,x:number,y:number,angle:number,scale:number){
        const key=kind+f;let b=this.batches.get(key);
        if(!b){b=new T.InstancedMesh(sculpt(kind,f),this.material,256);b.count=0;b.castShadow=true;b.receiveShadow=true;b.frustumCulled=false;this.group.add(b);this.batches.set(key,b);}
        if(b.count>=b.instanceMatrix.count)return;
        const px=toX(x),pz=toZ(y);this.o.position.set(px,terrainHeight(px,pz)+.03,pz);this.o.rotation.y=angle;this.o.scale.setScalar(scale);
        this.o.updateMatrix();b.setMatrixAt(b.count++,this.o.matrix);
    }
    update(w:SimWorld,opacity:number){
        const log=w.logistics;this.group.visible=opacity>.01;if(!this.group.visible)return;
        for(const b of this.batches.values())b.count=0;
        for(const c of log.couriers)this.put('rider',c.faction,c.x,c.y,-Math.atan2(c.dy,c.dx),1.22);
        for(const v of log.wagons)if(!v.destroyed)this.put('wagon',v.faction,v.x,v.y,v.faction?Math.PI:0,1.5);
        for(const [kind,leaders] of [['brigade',log.brigades],['corps',log.corps]] as const)for(const c of leaders){
            const u=w.units[c.commanderId];if(u&&u.hp>0)this.put(kind,c.faction,u.x-4,u.y,0,kind==='corps'?1.22:1);
        }
        if(this.material.transparent!==(opacity<.99)){this.material.transparent=opacity<.99;this.material.needsUpdate=true;}
        this.material.opacity=opacity;
        for(const b of this.batches.values()){b.instanceMatrix.needsUpdate=true;b.visible=b.count>0;}
    }
}
