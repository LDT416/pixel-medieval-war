import * as T from 'three';
import type { BattleEvent, Round } from '../../sim/arenaTypes';
import {roundPosition} from '../../sim/combat';
import type { SimWorld } from '../../sim/world';
import {attribute,upload} from './spriteAtlas';
import {toX,toZ,terrainHeight} from './terrain3d';
import type { SmokeSystem } from './smokeSystem3d';

type Mode='clear'|'subtle'|'off';
type Point={x:number;y:number;z:number};
type Segment={a:Point;b:Point;born:number;life:number;kind:number};
type Mark={p:Point;tick:number;node:HTMLSpanElement};
const CAP=4096;

function position(x:number,y:number,h:number):Point{
    const sx=toX(x),sz=toZ(y);return {x:sx,y:terrainHeight(sx,sz)+h,z:sz};
}
/** 当前帧的飞行短划共用一批面向镜头的窄带。 */
export class Tracers3d{
    mode:Mode='subtle';
    private maxLength=0;
    private mesh:T.InstancedMesh;
    private start:T.InstancedBufferAttribute;private end:T.InstancedBufferAttribute;private style:T.InstancedBufferAttribute;
    private segments:Segment[]=[];
    private previous=new Map<Round,Point>();

    private calibration=new Map<number,{overshoot:boolean}>();
    private labels:Mark[]=[];
    private stored:{p:Point;end:number}[]=[];
    private size={value:new T.Vector2(1024,680)};private strength={value:1};
    private shake:{p:Point;tick:number}|null=null;private projection=new T.Vector3();
    constructor(scene:T.Scene){
        const g=new T.PlaneGeometry(1,1);
        this.start=attribute(g,'aStart',CAP,3);this.end=attribute(g,'aEnd',CAP,3);this.style=attribute(g,'aTrail',CAP,3);
        const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{viewport:this.size,strength:this.strength},
            vertexShader:`attribute vec3 aStart,aEnd,aTrail; uniform vec2 viewport;varying vec2 v;varying vec3 style;
            void main(){
                vec4 a=projectionMatrix*viewMatrix*vec4(aStart,1.),b=projectionMatrix*viewMatrix*vec4(aEnd,1.);
                vec2 d=(b.xy/max(.01,b.w)-a.xy/max(.01,a.w))*viewport;
                vec2 normal=vec2(-d.y,d.x)/max(length(d),.01);
                gl_Position=mix(a,b,uv.x);
                gl_Position.xy+=normal*(uv.y*2.-1.)*(aTrail.y<.5?1.65:2.25)*gl_Position.w/viewport;
                v=uv;style=aTrail;
            }`,
            fragmentShader:`uniform float strength;varying vec2 v;varying vec3 style;
            void main(){
                bool musket=style.y<.5;float age=style.x;

                float alpha=(1.-age)*strength*(1.-smoothstep(.42,1.,abs(v.y*2.-1.)));
                vec3 color=musket?vec3(2.7,1.85,.65):mix(vec3(.89,.89,.82),vec3(.32,.32,.30),age);
                gl_FragColor=vec4(color,alpha*(musket?.93:.78));
            }`});
        this.mesh=new T.InstancedMesh(g,mat,CAP);this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.renderOrder=7;scene.add(this.mesh);
    }
    installControl(){
        const nav=document.querySelector<HTMLElement>('#hud nav.controls');
        if(!nav)return;
        const row=document.createElement('div');row.className='controlrow';
        const button=document.createElement('button');button.className='labeled';button.id='tracer-mode';
        const modes:Mode[]=['clear','subtle','off'],names={clear:'清晰',subtle:'写实',off:'关闭'};
        const label=()=>{button.textContent='弹道线 · '+names[this.mode];};
        button.onclick=()=>{this.mode=modes[(modes.indexOf(this.mode)+1)%modes.length];label();};label();
        row.append(button);nav.append(row);
    }
    private line(a:Point,b:Point,tick:number,life:number,kind:number){
        if(this.mode!=='off')this.segments.push({a,b,born:tick,life,kind});
    }
    private musket(w:SimWorld,e:BattleEvent){
        const target=w.companies[w.units[e.unitId].company].target;
        const t=w.companies[target];if(!t && e.endX===undefined)return;
        // 未命中时只扰动视觉落点，不消耗模拟的随机序列。
        const h=Math.imul(e.unitId+1,2654435761)^Math.imul(w.tick+1,2246822519);
        const x=e.endX??t.x+((h&255)/255-.5)*65,y=e.endY??t.y+(((h>>>8)&255)/255-.5)*65;
        const a=position(e.x+e.dx*12,e.y+e.dy*12,1.08),b=position(x,y,e.struck?.9:.12);
        this.line(a,b,w.tick,3,0);
    }
    private mark(p:Point,tick:number,overshoot:boolean){
        const node=document.createElement('span');node.className='range-callout';node.textContent=overshoot?'↑ 远弹':'↓ 近弹';
        const host=document.querySelector('#hud');if(!host)return;
        if(this.labels.length>=6)this.labels.shift()!.node.remove();
        node.hidden=true;host.append(node);this.labels.push({p,tick,node});
    }
    observe(w:SimWorld,smoke:SmokeSystem){
        const now=w.tick;this.segments=this.segments.filter(s=>now-s.born<s.life);
        this.stored=this.stored.filter(s=>s.end>now);
        for(const e of w.events){
            if(e.type==='tileImpact'){const p=position(e.x,e.y,.1);smoke.bulletImpact(p.x,p.y,p.z,!!e.struck);continue;}
            if(e.type==='fire' && !e.explosive){this.musket(w,e);continue;}
            if(e.type==='fire' && e.explosive)this.shake={p:position(e.x,e.y,0),tick:now};
            if(e.type==='impact'){
                const call=this.calibration.get(e.unitId);
                if(call){if(this.mode==='clear')this.mark(position(e.x,e.y,1.6),now,call.overshoot);this.calibration.delete(e.unitId);}
            }
        }
        const live=new Set(w.rounds);
        for(const r of this.previous.keys())if(!live.has(r)){
            const raw=roundPosition(r),p=position(raw.x,raw.y,.2);
            this.stored.push({p,end:now+120});this.previous.delete(r);
        }
        for(const r of w.rounds){
            const p=roundPosition(r),next=position(p.x,p.y,p.h),prev=this.previous.get(r);
            if(!prev){
                const t=w.companies[r.gun.aimTarget];
                if(t && r.gun.shotsOnTarget<=3){
                    const error=(r.tx-t.x)*r.dx+(r.ty-t.y)*r.dy;
                    if(Math.abs(error)>20)this.calibration.set(r.gun.id,{overshoot:error>0});
                }
            }else this.line(prev,next,now,1,1);
            this.previous.set(r,next);
        }
        if(this.segments.length>CAP)this.segments.splice(0,this.segments.length-CAP);
    }
    draw(tick:number,alpha:number,width:number,height:number,zoom:number,camera:T.Camera){
        const time=tick+alpha;this.size.value.set(width,height);this.strength.value=this.mode==='subtle'?.35:1;
        let n=0;
        if(this.mode!=='off' && zoom<=300)for(const s of this.segments){
            const age=(time-s.born)/s.life;if(age>=1)continue;
            const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,dz=s.b.z-s.a.z;
            const distance=Math.hypot(dx,dy,dz);if(distance<.0001)continue;
            const head=s.kind===0?Math.max(1/6,age):1;
            const tail=Math.max(0,head-(s.kind===0?.5:1.2)/distance);
            this.start.setXYZ(n,s.a.x+dx*tail,s.a.y+dy*tail,s.a.z+dz*tail);
            this.end.setXYZ(n,s.a.x+dx*head,s.a.y+dy*head,s.a.z+dz*head);
            this.maxLength=Math.max(this.maxLength,distance*(head-tail));
            this.style.setXYZ(n,s.kind===0?age:0,s.kind,0);n++;
        }
        this.mesh.count=n;this.mesh.visible=n>0;
        for(const a of [this.start,this.end,this.style])upload(a,n);
        const placed:{x:number;y:number}[]=[];
        this.labels=this.labels.filter(m=>{
            if(time-m.tick>42){m.node.remove();return false;}
            const p=this.projection.set(m.p.x,m.p.y,m.p.z).project(camera);
            m.node.hidden=zoom>300 || this.mode!=='clear' || Math.abs(p.x)>1 || Math.abs(p.y)>1 || Math.abs(p.z)>1;
            if(!m.node.hidden){
                const x=(p.x+1)*width*.5;let y=(1-p.y)*height*.5;
                while(placed.some(t=>Math.abs(t.x-x)<48&&Math.abs(t.y-y)<16))y-=16;
                placed.push({x,y});m.node.style.left=x/width*100+'%';m.node.style.top=y/height*100+'%';
                m.node.style.opacity=String(Math.min(1,(42-time+m.tick)/12));
            }
            return true;
        });
    }
    cameraKick(x:number,z:number,zoom:number,tick:number){
        const s=this.shake;if(!s || zoom>=120 || Math.hypot(s.p.x-x,s.p.z-z)>20)return 0;
        const age=tick-s.tick;return age>=0 && age<4?.13*(1-age/4)*Math.cos(age*2.6):0;
    }
    get resting(){return this.stored;}
    get stats(){return {segments:this.mesh.count,drawCalls:Number(this.mesh.visible),mode:this.mode,maxLength:this.maxLength};}
    reset(){this.maxLength=0;this.segments=[];this.previous.clear();this.calibration.clear();this.stored=[];this.shake=null;
        for(const l of this.labels)l.node.remove();this.labels=[];this.mesh.count=0;this.mesh.visible=false;}
}
