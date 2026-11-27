import * as T from 'three';
import type { BattleEvent } from '../../sim/arenaTypes';
import { Rng } from '../../sim/rng';
import { attribute, upload } from './spriteAtlas';
import { toX,toZ,terrainHeight,normalAt } from './terrain3d';
import type { BattlefieldLight } from './lightingPresets';

const files=['gore_intestines','gore_organs','gore_bones','gore_chunks','corpses_france','corpses_britain','vfx_cannon_blast'];
const sizes=[128,128,128,128,160,160,192,256];
function tile(a:T.InstancedBufferAttribute,index:number,sheet:number,frame:number) {
    const px=sizes[sheet],cell=px/4,inset=.002*px;
    const x=sheet%4*256+frame%4*cell, y=Math.floor(sheet/4)*256+Math.floor(frame/4)*cell;
    a.setXYZW(index,(x+inset)/1024,1-(y+cell-inset)/512,(cell-2*inset)/1024,(cell-2*inset)/512);
}
async function loadArt(){
    const loader=new T.TextureLoader(), textures=await Promise.all(files.map(f=>loader.loadAsync('./art/gore/'+f+'.png')));
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    textures.forEach((t,i)=>{
        t.magFilter=t.minFilter=T.NearestFilter;t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;
        c.drawImage(t.image,i%4*256,Math.floor(i/4)*256);t.dispose();
    });
    const rng=new Rng(165);
    for(let i=0;i<16;i++){
        c.save();c.translate(768+i%4*64+32,256+Math.floor(i/4)*64+32);
        const crater=i>=8 && i<12,drop=i>=12;
        const path=new Path2D();
        for(let j=0;j<40;j++){
            const a=j/40*Math.PI*2, r=(drop?12:21)+rng.next()*(drop?3:5)+Math.sin(a*3+i)*2.7;
            const x=Math.cos(a)*r,y=Math.sin(a)*r*.78;
            if(!j)path.moveTo(x,y);else path.lineTo(x,y);
        }
        path.closePath();c.fillStyle=crater?'#4a3928':drop?'#a22224':'#57151d';c.fill(path);
        c.save();c.clip(path);
        for(let j=0;j<110;j++){
            c.fillStyle=crater?['#352b23','#604b34','#816642'][j%3]:['#721c27','#661821','#8e2631'][j%3];
            c.fillRect(rng.int(-27,24),rng.int(-22,21),rng.int(2,9),rng.int(1,4));
        }
        c.restore();
        if(!drop)for(let j=0;j<10;j++){
            c.fillStyle=crater?'#685338':'#76202a';c.fillRect(rng.int(-29,27),rng.int(-27,26),2,2);
        }
        c.restore();
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
    tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;return tex;
}
interface Page {mesh:T.InstancedMesh;uv:T.InstancedBufferAttribute;dirty:number;end:number}
const up=new T.Vector3(0,1,0),normal=new T.Vector3(),o=new T.Object3D();
class Batch {
    count=0;pages:Page[]=[];
    constructor(private scene:T.Scene,private mat:T.MeshStandardMaterial,private capacity:number,private flat:boolean,private layer:number){
        mat.onBeforeCompile=s=>{
            s.vertexShader='attribute vec4 aUvRect;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vMapUv=aUvRect.xy+uv*aUvRect.zw;');
        };
        this.allocate();
    }
    private allocate(){
        const g=new T.PlaneGeometry(1,1);if(this.flat)g.rotateX(-Math.PI/2);
        const uv=attribute(g,'aUvRect',this.capacity,4),mesh=new T.InstancedMesh(g,this.mat,this.capacity);
        mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.renderOrder=this.layer;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(mesh);this.pages.push({mesh,uv,dirty:Infinity,end:0});
    }
    put(sheet:number,frame:number,x:number,y:number,z:number,size:number,angle:number,tilt=0,index=this.count){
        const p=Math.floor(index/this.capacity),slot=index%this.capacity;
        if(p>=this.pages.length)this.allocate();
        const page=this.pages[p];page.mesh.count=Math.max(slot+1,page.mesh.count);
        this.count=Math.max(this.count,index+1);
        if(this.flat){
            normalAt(x,z,normal);o.quaternion.setFromUnitVectors(up,normal);o.rotateY(angle);
            y=terrainHeight(x,z)+.018+this.layer*.023+(slot%200)*.00018;
        }else{o.rotation.set(-.23+tilt,0,angle,'XYZ');}
        o.position.set(x,y,z);o.scale.setScalar(size);o.updateMatrix();
        page.mesh.setMatrixAt(slot,o.matrix);tile(page.uv,slot,sheet,frame);
        page.dirty=Math.min(page.dirty,slot);page.end=Math.max(page.end,slot+1);
        return index;
    }
    sync(){
        for(const p of this.pages)if(p.end>p.dirty){
            upload(p.mesh.instanceMatrix,p.end-p.dirty,p.dirty);upload(p.uv,p.end-p.dirty,p.dirty);p.dirty=Infinity;p.end=0;
        }
    }
    clear(){this.count=0;for(const p of this.pages){p.mesh.count=0;p.dirty=Infinity;p.end=0;}}
}
interface Piece {sheet:number;frame:number;x:number;y:number;z:number;vx:number;vy:number;vz:number;size:number;angle:number;spin:number;bounces:number}
interface PoolGrowth {x:number;z:number;size:number;ang:number;index:number;frame:number;age:number}
export class GoreSystem {
    private air:Piece[]=[];private blasts:{x:number;y:number;z:number;age:number;size:number}[]=[];
    private growth:PoolGrowth[]=[];private pools:Batch;private craters:Batch;private corpses:Batch;private debris:Batch;private flying:Batch;
    private rng=new Rng(1815);private wet:T.MeshStandardMaterial;
    private constructor(scene:T.Scene,tex:T.Texture,private lights:BattlefieldLight){
        const material=(roughness:number,metalness=0)=>new T.MeshStandardMaterial({map:tex,alphaTest:.45,roughness,metalness,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
        this.wet=material(.14,.08);this.pools=new Batch(scene,this.wet,5000,true,1);
        this.craters=new Batch(scene,material(.98),1200,true,0);this.corpses=new Batch(scene,material(.82),2500,true,3);
        this.debris=new Batch(scene,material(.42),12000,true,4);this.flying=new Batch(scene,material(.65),4096,false,5);
    }
    static async create(scene:T.Scene,lights:BattlefieldLight){return new GoreSystem(scene,await loadArt(),lights);}
    get stats(){return {activeAirGore:this.air.filter(p=>p.sheet<4).length,landedCorpses:this.corpses.count,landedGore:this.debris.count,bloodPools:this.pools.count,goreTexturesLoaded:7};}
    private blood(x:number,z:number,size:number,grow=false){
        const frame=this.rng.int(0,7),ang=this.rng.next()*6.28;
        const index=this.pools.put(7,frame,x,0,z,grow?size*.45:size,ang);
        if(grow)this.growth.push({x,z,size,ang,index,frame,age:0});
    }
    private blast(x:number,z:number,size:number){
        const y=terrainHeight(x,z);this.blasts.push({x,z,y:y+size*.43,age:0,size});
        this.craters.put(7,this.rng.int(8,11),x,0,z,size*.88,this.rng.next()*6.28);
        this.lights.flash(x,y,z,true);
    }
    event(e:BattleEvent) {
        const x=toX(e.x),z=toZ(e.y),h=terrainHeight(x,z);
        if(e.type==='impact'){this.blast(x,z,4.1);return;}
        if(e.type!=='death')return;
        const random=()=>this.rng.next();
        if(e.explosive)this.blast(x,z,2.6+random()*1.2);
        else{
            this.corpses.put(e.faction?5:4,this.rng.int(0,15),x,0,z,e.kind==='cuirassier'?3.2:2.5,random()*6.28);
            this.blood(x,z,2.3+random()*.9,true);
        }
        const spawn=(sheet:number,count:number)=>{
            const droplet=sheet===7;
            for(let i=0;i<count;i++){
                const a=random()*Math.PI*2, speed=(.4+random())*(e.explosive?5.1:2.8);
                this.air.push({sheet,frame:droplet?12+this.rng.int(0,3):this.rng.int(0,15),
                    x,y:h+.52+random()*.65,z,vx:Math.cos(a)*speed+(e.explosive?0:e.dx*3.4),
                    vz:Math.sin(a)*speed+(e.explosive?0:e.dy*3.4),vy:2+random()*(e.explosive?8:4),
                    angle:a,spin:(random()-.5)*14,size:droplet?.14+random()*.26:.45+random()*.70,
                    bounces:droplet?0:this.rng.int(1,2)});
            }
        };
        if(e.explosive)for(let sheet=0;sheet<4;sheet++)spawn(sheet,(sheet===0||sheet===3?4:3)+this.rng.int(0,1));
        spawn(7,e.explosive?this.rng.int(10,14):this.rng.int(5,8));
    }
    update(dt:number){
        this.flying.clear();
        for(let i=this.air.length-1;i>=0;i--){
            const p=this.air[i];p.vy-=15*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.angle+=p.spin*dt;
            const h=terrainHeight(p.x,p.z)+.07;
            if(p.y<=h && p.vy<0){
                this.blood(p.x,p.z,p.size*(p.sheet===7?2:1.22));p.y=h;
                if(p.bounces-->0){p.vy*=-.34;p.vx*=.55;p.vz*=.55;p.spin*=.57;}
                else{
                    if(p.sheet!==7)this.debris.put(p.sheet,p.frame,p.x,0,p.z,p.size,p.angle);
                    this.air[i]=this.air[this.air.length-1];this.air.pop();continue;
                }
            }
            this.flying.put(p.sheet,p.frame,p.x,p.y,p.z,p.size,p.angle,Math.sin(p.angle)*.55);
        }
        for(let i=this.blasts.length-1;i>=0;i--){
            const b=this.blasts[i];b.age+=dt;
            if(b.age>=.64){this.blasts.splice(i,1);continue;}
            this.flying.put(6,Math.min(15,Math.floor(b.age*25)),b.x,b.y,b.z,b.size,0);
        }
        for(let i=this.growth.length-1;i>=0;i--){
            const p=this.growth[i];p.age=Math.min(1,p.age+dt*1.6);
            this.pools.put(7,p.frame,p.x,0,p.z,p.size*(.45+.55*p.age),p.ang,0,p.index);
            if(p.age===1)this.growth.splice(i,1);
        }
        this.wet.roughness=this.lights.mode==='storm'?.095:.14;
        for(const batch of [this.pools,this.corpses,this.craters,this.debris,this.flying])batch.sync();
    }
    reset(){this.air.length=this.blasts.length=this.growth.length=0;this.rng.state=1815;
        for(const b of [this.pools,this.corpses,this.craters,this.debris,this.flying])b.clear();}
}
