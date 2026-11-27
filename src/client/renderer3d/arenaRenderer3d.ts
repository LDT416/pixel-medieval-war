import * as T from 'three';
import type { SimWorld } from '../../sim/world';
import { Standees,upload } from './spriteAtlas';
import { createTerrain,terrainHeight,toX,toZ } from './terrain3d';
import { BattlefieldLight,type Lighting } from './lightingPresets';
import { PostFx } from './postFx';
import { GoreSystem } from './goreSystem3d';
import { SmokeSystem } from './smokeSystem3d';
const elevation=39*Math.PI/180;
export class ArenaRenderer3d{
    private renderer:T.WebGLRenderer;private scene=new T.Scene();
    private camera=new T.PerspectiveCamera(28,1,.3,1200);
    lights:BattlefieldLight; smoke:SmokeSystem; gore!:GoreSystem;
    private standees:Standees;private post=new PostFx();private wind:{value:number};
    private target=new T.Vector3();private goal=new T.Vector3();private distance=158;private desired=158;
    private held=new Set<string>();private balls:T.InstancedMesh;private matrix=new T.Matrix4();
    private drag:{id:number;x:number;y:number}|null=null;
    get drawCalls(){return this.renderer.info.render.calls;}
    get lighting(){return this.lights.mode;}
    private constructor(private canvas:HTMLCanvasElement){
        this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
        this.renderer.shadowMap.enabled=true;
        // r187 folds the former PCFSoftShadowMap into its filtered PCF implementation.
        this.renderer.shadowMap.type=T.PCFShadowMap;
        this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.09;
        this.renderer.info.autoReset=false;
        this.lights=new BattlefieldLight(this.scene);this.wind=createTerrain(this.scene);
        this.standees=new Standees(this.scene);this.smoke=new SmokeSystem(this.scene,this.lights);
        this.balls=new T.InstancedMesh(new T.IcosahedronGeometry(.16,1),new T.MeshStandardMaterial({color:0x302b28}),100);
        this.balls.count=0;this.balls.frustumCulled=false;this.scene.add(this.balls);
        this.resize();this.desired=this.distance=Math.min(260,Math.max(168,300/this.camera.aspect));this.controls();
        new ResizeObserver(()=>this.resize()).observe(canvas);
    }
    static async create(canvas:HTMLCanvasElement){
        const arena=new ArenaRenderer3d(canvas);arena.gore=await GoreSystem.create(arena.scene,arena.lights);return arena;
    }
    private resize(){
        const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);
        const dpr=Math.min(window.devicePixelRatio,1.5,1700/Math.max(w,h));
        this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);this.post.size(Math.floor(w*dpr),Math.floor(h*dpr));
        this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    }
    panTo(x:number,z:number){this.goal.set(T.MathUtils.clamp(x,-110,110),0,T.MathUtils.clamp(z,-60,60));}
    zoomTo(d:number){this.desired=T.MathUtils.clamp(d,13,295);}
    home(world:SimWorld){const p=world.frontline();this.panTo(toX(p.x),toZ(p.y));}
    setLighting(mode:Lighting){this.lights.set(mode);this.standees.rim.value.copy(this.lights.rim);}
    reset(){this.gore.reset();this.smoke.reset();this.lights.reset();this.balls.count=0;this.panTo(0,0);}
    events(w:SimWorld){for(const e of w.events){this.gore.event(e);this.smoke.event(e);}}
    private controls(){
        const c=this.canvas;
        c.addEventListener('contextmenu',e=>e.preventDefault());
        c.addEventListener('pointerdown',e=>{
            if(e.button!==0 && e.button!==2)return;
            c.setPointerCapture(e.pointerId);this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};c.classList.add('dragging');
        });
        c.addEventListener('pointermove',e=>{
            const d=this.drag;if(!d || e.pointerId!==d.id)return;
            const k=this.distance*.505/c.clientHeight;
            this.panTo(this.goal.x-(e.clientX-d.x)*k,this.goal.z-(e.clientY-d.y)*k/Math.sin(elevation));
            d.x=e.clientX;d.y=e.clientY;
        });
        c.addEventListener('lostpointercapture',()=>{this.drag=null;c.classList.remove('dragging');});
        c.addEventListener('wheel',e=>{e.preventDefault();this.zoomTo(this.desired*Math.exp(Math.sign(e.deltaY)*Math.min(.28,Math.abs(e.deltaY)*.0016)));},{passive:false});
        const keys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
        window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(keys.includes(k)){e.preventDefault();this.held.add(k);}});
        window.addEventListener('keyup',e=>this.held.delete(e.key.toLowerCase()));
        window.addEventListener('blur',()=>this.held.clear());
    }
    render(w:SimWorld,realDt:number,dt:number,alpha:number){
        const key=(a:string,b:string)=>Number(this.held.has(a)||this.held.has(b));
        const step=this.distance*.68*realDt;
        this.panTo(this.goal.x+(key('d','arrowright')-key('a','arrowleft'))*step,this.goal.z+(key('s','arrowdown')-key('w','arrowup'))*step);
        const smooth=1-Math.exp(-realDt*11);
        this.distance=T.MathUtils.lerp(this.distance,this.desired,smooth);this.target.lerp(this.goal,smooth);
        this.target.y=terrainHeight(this.target.x,this.target.z);
        this.camera.position.copy(this.target);this.camera.position.y+=this.distance*Math.sin(elevation);this.camera.position.z+=this.distance*Math.cos(elevation);this.camera.lookAt(this.target);
        this.wind.value+=dt;this.lights.update(this.target,this.distance,this.camera.aspect,dt);
        this.standees.draw(w.units,w.tick,alpha);this.gore.update(dt);this.smoke.update(w.winner===null?w.units:[],dt);
        this.balls.count=Math.min(w.rounds.length,100);
        for(let i=0;i<this.balls.count;i++){
            const r=w.rounds[i],t=Math.min(1,(r.age+alpha)/r.duration),x=toX(r.x+(r.tx-r.x)*t),z=toZ(r.y+(r.ty-r.y)*t);
            this.balls.setMatrixAt(i,this.matrix.makeTranslation(x,terrainHeight(x,z)+.5+8*t*(1-t),z));
        }
        upload(this.balls.instanceMatrix,this.balls.count);this.renderer.info.reset();
        this.post.draw(this.renderer,this.scene,this.camera);
    }
}
