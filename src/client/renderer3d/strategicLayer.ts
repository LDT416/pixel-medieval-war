import * as T from 'three';
import type {SimWorld} from '../../sim/world';
import type {Company} from '../../sim/arenaTypes';
import {toX,toZ,terrainHeight,SCALE} from './terrain3d';
import {LogisticsView} from './logisticsView';
import {plansFor,deploymentActive} from '../battlePlansView';
import {armyInk,frontLine,paintMap} from './campaignMap';

const cap=512,columns=10;
type Marker={x:number;y:number;f:number;symbol:number;alive:number;peak:number;morale:number;status:number;gx:number;gy:number;alpha:number;intent:boolean};
function flagAtlas(){
    const canvas=document.createElement('canvas');canvas.width=columns*64;canvas.height=3*40;
    const c=canvas.getContext('2d')!;
    for(let f=0;f<3;f++)for(let s=0;s<columns;s++){
        const x=s*64,y=f*40;c.fillStyle='#333329';c.fillRect(x+1,y+1,62,38);
        c.fillStyle=armyInk[f];c.fillRect(x+3,y+3,58,34);
        c.strokeStyle='#e8d6a2';c.lineWidth=1;c.strokeRect(x+5.5,y+5.5,53,29);
        c.strokeStyle=c.fillStyle='#f4e7c6';c.lineWidth=2.3;
        if(s<=1||s===3){c.beginPath();c.moveTo(x+21,y+26);c.lineTo(x+43,y+12);if(s!==1){c.moveTo(x+21,y+12);c.lineTo(x+43,y+26);}c.stroke();}
        if(s===2){c.beginPath();c.arc(x+32,y+19,5,0,Math.PI*2);c.fill();}
        if(s===3){c.beginPath();c.moveTo(x+26,y+8);c.lineTo(x+28,y+4);c.lineTo(x+32,y+8);c.lineTo(x+36,y+4);c.lineTo(x+38,y+8);c.closePath();c.fill();}
        if(s>=4){c.textAlign='center';c.textBaseline='middle';c.font='bold 17px Georgia, sans-serif';c.fillText(['HQ','I','II','III','✉','▤'][s-4],x+32,y+20);}
    }
    const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.minFilter=t.magFilter=T.LinearFilter;return t;
}
function makeFlags(){
    const g=new T.PlaneGeometry(1,1),attr=(name:string,n:number)=>{
        const a=new T.InstancedBufferAttribute(new Float32Array(cap*n),n).setUsage(T.DynamicDrawUsage);g.setAttribute(name,a);return a;
    };
    const anchor=attr('aAnchor',4),info=attr('aInfo',4),state=attr('aState',2);
    const uniforms={atlas:{value:flagAtlas()},clock:{value:0},fade:{value:0},middle:{value:0}};
    const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:false,
        vertexShader:`attribute vec4 aAnchor,aInfo;attribute vec2 aState;uniform float clock,middle;
        varying vec2 v;varying vec4 info;varying float state;varying float blend;
        void main(){v=uv;info=aInfo;state=aState.x;blend=aState.y;vec2 p=position.xy;float broken=step(2.5,state)*step(state,3.5);
        p=mat2(1.,broken*.22,-broken*.22,1.)*p;
        vec4 view=modelViewMatrix*vec4(aAnchor.xyz,1.);
        p.x+=state==2.?sin(clock*16.+aAnchor.x)*.055:0.;
        view.xy+=vec2(p.x*1.56,p.y*(1.+middle))*aAnchor.w;
        view.y+=middle*aAnchor.w*(.6+.8*aInfo.z);gl_Position=projectionMatrix*view;}`,
        fragmentShader:`uniform sampler2D atlas;uniform float clock,fade,middle;varying vec2 v;varying vec4 info;varying float state;varying float blend;
        void main(){vec3 ink;float alpha=fade*blend;vec2 q=v;float pole=middle*.46;
        if(v.y<pole){if(abs(v.x-.08)>.024)discard;gl_FragColor=vec4(.43,.35,.22,alpha);return;}
        q.y=(v.y-pole)/(1.-pole);
        if(q.y<.16){float strength=q.y>.08?info.z:info.w;ink=q.y>.08?vec3(.85,.76,.51):mix(vec3(.64,.27,.16),vec3(.44,.66,.40),info.w);if(v.x>strength)ink=vec3(.19,.21,.18);}
        else{vec2 local=vec2(v.x,(q.y-.16)/.84);vec2 uv=vec2((info.x+local.x)/10.,(2.-info.y+local.y)/3.);ink=texture2D(atlas,uv).rgb;
        if(state==1. && (local.x<.17||local.x>.83) && (local.y<.18||local.y>.82))ink=vec3(1.,.82,.47);
        if(state==3.)ink=mix(ink,vec3(.85,.19,.12),.18+.2*sin(clock*8.));
        if(state==2. && local.x>.78 && abs(local.y-.52)<(.96-local.x))ink=vec3(1.,.8,.35);
        if(state==4. && local.x>.76 && min(abs(local.y-(local.x-.76)*3.-.23),abs(local.y+(local.x-.76)*3.-.76))<.045)ink=vec3(1.,.87,.66);}
        gl_FragColor=vec4(ink,alpha);#include <colorspace_fragment>
        }`.replace(';#include',';\n#include')});
    const mesh=new T.InstancedMesh(g,material,cap);mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=25;
    return {mesh,anchor,info,state,uniforms};
}
function marker(c:Company):Marker {
    const symbol=c.line===5?4:c.kind==='cuirassier'?1:c.kind==='field_cannon'?2:c.kind==='guard_grenadier'?3:0;
    return {x:c.x,y:c.y,f:c.line===7&&c.faction===1?2:c.faction,symbol,alive:c.alive,peak:c.peak,morale:c.morale,
        status:c.status==='rout'?3:c.engaged?4:c.order==='charge'||c.order==='assault'?2:c.formation==='square'?1:0,gx:c.gx,gy:c.gy,alpha:1,intent:c.order==='advance'||c.order==='charge'||c.order==='assault'};
}
export class StrategicLayer{
    readonly overview=new T.Scene();
    private logistics:LogisticsView;
    readonly sheet=document.createElement('canvas');
    private flags=makeFlags();private group=new T.Group();
    private plane:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
    private arrows:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
    private arrowPos=new Float32Array(cap*42*3);private arrowColor=new Float32Array(cap*42*3);
    private front:number[]=[];private targetFront:number[]=[];private nextTick=-1;private nextPaint=0;
    private prevLayout:SimWorld['layout']|undefined;
    private gain=0;private paper=0;
    constructor(private scene:T.Scene){
        this.logistics=new LogisticsView(scene);this.sheet.width=1024;this.sheet.height=512;
        const tex=new T.CanvasTexture(this.sheet);tex.colorSpace=T.SRGBColorSpace;
        const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,fog:false});
        this.plane=new T.Mesh(new T.PlaneGeometry(1,1),mat);this.plane.rotation.x=-Math.PI/2;this.plane.position.y=5.6;this.plane.renderOrder=20;
        const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(this.arrowPos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(this.arrowColor,3).setUsage(T.DynamicDrawUsage));
        this.arrows=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,depthWrite:false,depthTest:false}));this.arrows.frustumCulled=false;this.arrows.renderOrder=22;
        this.group.add(this.plane,this.flags.mesh,this.arrows);scene.add(this.group);this.overview.background=new T.Color('#b6ad91');
    }
    get full(){return this.paper>.995;}
    get soldierOpacity(){return 1-this.gain;}
    private gather(w:SimWorld){
        const out:Marker[]=[],corps=new Map<string,Marker>();
        for(const c of w.companies){
            if(!c.alive||c.status==='gone')continue;
            const m=marker(c);
            if(this.paper<.995)out.push({...m,alpha:1-this.paper});
            if(this.paper<.005)continue;
            const sector=c.sector;
            const key=c.faction+'-'+sector,group=corps.get(key);
            if(!group){corps.set(key,{...m,symbol:5+sector,alpha:this.paper,x:m.x*m.alive,y:m.y*m.alive,morale:m.morale*m.alive,status:0});}
            else{group.x+=m.x*m.alive;group.y+=m.y*m.alive;group.morale+=m.morale*m.alive;group.alive+=m.alive;group.peak+=m.peak;}
        }
        const log=w.logistics;
        if(this.gain>.005 && this.paper<.995){
            for(const [symbol,list] of [[8,log.couriers],[9,log.wagons.filter(v=>!v.destroyed)]] as const)for(const v of list){
                out.push({x:v.x,y:v.y,gx:v.x,gy:v.y,f:v.faction,symbol,alive:1,peak:1,morale:100,status:0,alpha:this.gain*(1-this.paper),intent:false});
            }
        }
        if(deploymentActive(w)){
            for(const p of plansFor(w))for(const dest of p.destinations){
                const c=w.companies[dest.company];
                if(!c||Math.hypot(c.x-dest.x,c.y-dest.y)<100)continue;
                out.push({...marker(c),x:dest.x,y:dest.y,status:0,intent:false,alpha:.32*(1-this.paper)});
            }
        }
        for(const m of corps.values()){m.x/=m.alive;m.y/=m.alive;m.morale/=m.alive;out.push(m);}
        return out;
    }
    private drawArrows(markers:Marker[],d:number,fade:number){
        let n=0;
        const vertex=(x:number,z:number,f:number)=>{this.arrowPos.set([x,7,z],n*3);this.arrowColor.set(f===0?[.17,.34,.52]:[.58,.26,.19],n*3);n++;};
        for(const m of markers){
            const x=toX(m.x),z=toZ(m.y),dx=(m.gx-m.x)*SCALE,dz=(m.gy-m.y)*SCALE,len=Math.hypot(dx,dz);
            if(!m.intent || len<3 || m.status===3 || m.symbol>=5 || this.paper>.995)continue;
            const ux=dx/len,uz=dz/len,wide=Math.min(d*.0018,len*.065);
            const curve=(t:number)=>{const bow=Math.sin(t*Math.PI)*Math.min(len*.12,5)*(m.f?1:-1);return [x+dx*t-uz*bow,z+dz*t+ux*bow];};
            for(let j=0;j<5;j++){
                const a=curve(j*.17),b=curve((j+1)*.17);
                for(const [p,s] of [[a,1],[a,-1],[b,1],[b,1],[a,-1],[b,-1]] as [number[],number][]){vertex(p[0]-uz*wide*s,p[1]+ux*wide*s,m.f);}
            }
            const b=curve(.85);vertex(b[0]-uz*wide*3,b[1]+ux*wide*3,m.f);vertex(b[0]+uz*wide*3,b[1]-ux*wide*3,m.f);vertex(x+dx,z+dz,m.f);
        }
        const g=this.arrows.geometry;g.setDrawRange(0,n);g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=true;this.arrows.material.opacity=.6*fade*(1-this.paper);this.arrows.visible=n>0;
    }
    update(w:SimWorld,d:number,dt:number,viewHeight:number,now:number){
        const ease=(a:number,b:number)=>a+(Math.sign(b-a)*Math.min(Math.abs(b-a),dt/.3));
        this.gain=ease(this.gain,d>=300?1:0);this.paper=ease(this.paper,d>=900?1:0);
        this.logistics.update(w,1-this.gain);
        const middle=Math.min(1,Math.max(0,(d-80)/20)),fade=Math.max(middle,this.gain);
        if(this.prevLayout!==w.layout){this.prevLayout=w.layout;this.front=[];this.nextTick=-1;this.nextPaint=0;}
        if(w.tick>=this.nextTick){this.targetFront=frontLine(w);if(!this.front.length)this.front=[...this.targetFront];this.nextTick=w.tick+60;}
        for(let i=0;i<this.front.length;i++)this.front[i]+=(this.targetFront[i]-this.front[i])*(1-Math.exp(-dt*2));
        if(now>=this.nextPaint){paintMap(this.sheet,w.layout,this.front,true);this.plane.material.map!.needsUpdate=true;this.nextPaint=now+(this.paper?240:900);}
        this.plane.scale.set(w.layout.width*SCALE,w.layout.height*SCALE,1);this.plane.material.opacity=this.gain*(.72+.28*this.paper);this.plane.visible=this.gain>.005;
        const parent=this.full?this.overview:this.scene;if(this.group.parent!==parent)parent.add(this.group);
        this.group.visible=fade>.005;if(!this.group.visible)return;
        const flags=this.flags,units=this.gather(w);
        flags.uniforms.clock.value=now*.001;flags.uniforms.fade.value=fade;flags.uniforms.middle.value=1-this.gain;
        const pixels=(1-this.gain)*12+this.gain*(this.paper>.5?27:20),size=Math.max(.14,d*pixels*.5/viewHeight);
        units.slice(0,cap).forEach((m,i)=>{
            const x=toX(m.x),z=toZ(m.y);
            flags.anchor.setXYZW(i,x,(this.paper>.5?7:terrainHeight(x,z)+1.9),z,size);
            flags.info.setXYZW(i,m.symbol,m.f,m.alive/Math.max(1,m.peak),Math.max(0,Math.min(1,m.morale/100)));
            flags.state.setXY(i,m.status,m.alpha);
        });
        flags.anchor.needsUpdate=flags.info.needsUpdate=flags.state.needsUpdate=true;flags.mesh.count=Math.min(cap,units.length);
        this.drawArrows(units,d,this.gain);
    }
}
