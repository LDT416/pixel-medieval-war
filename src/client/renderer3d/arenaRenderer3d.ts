import * as T from 'three';
import type { SimWorld } from '../../sim/world';
import { roundPosition } from '../../sim/combat';
import { Standees,upload } from './spriteAtlas';
import { createTerrain,terrainHeight,toX,toZ,HALF_W,HALF_H } from './terrain3d';
import { BattlefieldLight,type Lighting } from './lightingPresets';
import { PostFx } from './postFx';
import { GoreSystem } from './goreSystem3d';
import { SmokeSystem } from './smokeSystem3d';
const elevation=39*Math.PI/180;
export class ArenaRenderer3d{
    private renderer:T.WebGLRenderer;private scene=new T.Scene();
    private camera=new T.PerspectiveCamera(28,1,.3,1600);
    lights:BattlefieldLight; smoke:SmokeSystem; gore!:GoreSystem;
    private standees:Standees;private post=new PostFx();private terrain:ReturnType<typeof createTerrain>;
    private target=new T.Vector3();private goal=new T.Vector3();private distance=158;private desired=158;
    private held=new Set<string>();private balls:T.InstancedMesh;private matrix=new T.Matrix4();
    private drag:{id:number;x:number;y:number}|null=null;
    /** 最近一次手动操作镜头的时间（毫秒），自动导播在此后一段时间内让位。 */
    userAt=-1e9;
    get drawCalls(){return this.renderer.info.render.calls;}
    get lighting(){return this.lights.mode;}
    get zoom(){return this.desired;}
    private constructor(private canvas:HTMLCanvasElement){
        this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
        this.renderer.shadowMap.enabled=true;
        // r187 folds the former PCFSoftShadowMap into its filtered PCF implementation.
        this.renderer.shadowMap.type=T.PCFShadowMap;
        this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.09;
        this.renderer.info.autoReset=false;
        this.lights=new BattlefieldLight(this.scene);this.terrain=createTerrain(this.scene);
        this.standees=new Standees(this.scene);this.smoke=new SmokeSystem(this.scene,this.lights);
        this.balls=new T.InstancedMesh(new T.IcosahedronGeometry(.16,1),new T.MeshStandardMaterial({color:0x302b28}),120);
        this.balls.count=0;this.balls.frustumCulled=false;this.scene.add(this.balls);
        this.resize();this.desired=this.distance=Math.min(300,Math.max(190,330/this.camera.aspect));this.controls();
        new ResizeObserver(()=>this.resize()).observe(canvas);
    }
    static async create(canvas:HTMLCanvasElement){
        const arena=new ArenaRenderer3d(canvas);
        [arena.gore]=await Promise.all([GoreSystem.create(arena.scene,arena.lights),arena.terrain.load()]);
        return arena;
    }
    private resize(){
        const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);
        const dpr=Math.min(window.devicePixelRatio,1.5,1700/Math.max(w,h));
        this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);this.post.size(Math.floor(w*dpr),Math.floor(h*dpr));
        this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    }
    screen(x:number,y:number){const sx=toX(x),sz=toZ(y);return new T.Vector3(sx,terrainHeight(sx,sz)+3,sz).project(this.camera);}
    panTo(x:number,z:number){this.goal.set(T.MathUtils.clamp(x,-HALF_W,HALF_W),0,T.MathUtils.clamp(z,-HALF_H,HALF_H));}
    zoomTo(d:number){this.desired=T.MathUtils.clamp(d,28,420);}
    /** 自动导播：平滑推到模拟坐标 (x,y)。 */
    focus(x:number,y:number,d?:number){this.panTo(toX(x),toZ(y));if(d)this.zoomTo(d);}
    home(world:SimWorld){const p=world.frontline();this.panTo(toX(p.x),toZ(p.y));}
    setLighting(mode:Lighting){this.lights.set(mode);this.standees.rim.value.copy(this.lights.rim);}
    /** 新一局：地形随地图种子重建，清空残留。 */
    reset(){this.terrain.rebuild();this.gore.reset();this.smoke.reset();this.lights.reset();this.balls.count=0;this.panTo(0,0);}
    advanceEffects(w:SimWorld,dt:number){this.gore.update(dt);this.smoke.update(w.ended?[]:w.units,dt);}
    events(w:SimWorld){for(const e of w.events){this.gore.event(e);this.smoke.event(e);}}
    private controls(){
        const c=this.canvas,touch=()=>{this.userAt=performance.now();};
        c.addEventListener('contextmenu',e=>e.preventDefault());
        c.addEventListener('pointerdown',e=>{
            if(e.button!==0 && e.button!==2)return;
            c.setPointerCapture(e.pointerId);this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};c.classList.add('dragging');touch();
        });
        c.addEventListener('pointermove',e=>{
            const d=this.drag;if(!d || e.pointerId!==d.id)return;
            const k=this.distance*.505/c.clientHeight;
            this.panTo(this.goal.x-(e.clientX-d.x)*k,this.goal.z-(e.clientY-d.y)*k/Math.sin(elevation));
            d.x=e.clientX;d.y=e.clientY;touch();
        });
        c.addEventListener('lostpointercapture',()=>{this.drag=null;c.classList.remove('dragging');});
        c.addEventListener('wheel',e=>{e.preventDefault();touch();this.zoomTo(this.desired*Math.exp(Math.sign(e.deltaY)*Math.min(.28,Math.abs(e.deltaY)*.0016)));},{passive:false});
        const keys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
        window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(keys.includes(k)){e.preventDefault();this.held.add(k);touch();}});
        window.addEventListener('keyup',e=>this.held.delete(e.key.toLowerCase()));
        window.addEventListener('blur',()=>this.held.clear());
    }
    render(w:SimWorld,realDt:number,dt:number,alpha:number){
        const key=(a:string,b:string)=>Number(this.held.has(a)||this.held.has(b));
        const step=this.distance*.68*realDt;
        if(this.held.size)this.panTo(this.goal.x+(key('d','arrowright')-key('a','arrowleft'))*step,this.goal.z+(key('s','arrowdown')-key('w','arrowup'))*step);
        const smooth=1-Math.exp(-realDt*(performance.now()-this.userAt<1500?11:2.6));
        this.distance=T.MathUtils.lerp(this.distance,this.desired,smooth);this.target.lerp(this.goal,smooth);
        this.target.y=terrainHeight(this.target.x,this.target.z);
        this.camera.position.copy(this.target);this.camera.position.y+=this.distance*Math.sin(elevation);this.camera.position.z+=this.distance*Math.cos(elevation);this.camera.lookAt(this.target);
        this.terrain.wind.value+=dt;this.lights.update(this.target,this.distance,this.camera.aspect,dt);
        this.standees.draw(w.units,w.companies,w.tick,alpha);this.advanceEffects(w,dt);
        this.balls.count=Math.min(w.rounds.length,this.balls.instanceMatrix.count);
        for(let i=0;i<this.balls.count;i++){
            const p=roundPosition(w.rounds[i],alpha),x=toX(p.x),z=toZ(p.y);
            this.balls.setMatrixAt(i,this.matrix.makeTranslation(x,terrainHeight(x,z)+p.h,z));
        }
        upload(this.balls.instanceMatrix,this.balls.count);this.renderer.info.reset();
        this.post.draw(this.renderer,this.scene,this.camera);
    }
}
