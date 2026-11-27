import * as T from 'three';
import type { Soldier,BattleEvent } from '../../sim/arenaTypes';
import { Rng } from '../../sim/rng';
import { attribute,upload } from './spriteAtlas';
import { toX,toZ,terrainHeight } from './terrain3d';
import type { BattlefieldLight } from './lightingPresets';
const CAP=5600;
type Puff={x:number;y:number;z:number;vx:number;vy:number;vz:number;life:number;age:number;size:number;kind:number;seed:number};
export class SmokeSystem{
    private items:Puff[]=[];private rng=new Rng(53);private mesh:T.InstancedMesh;
    private shape:T.InstancedBufferAttribute;private style:T.InstancedBufferAttribute;
    private uniforms={uSun:{value:new T.Color()},uSky:{value:new T.Color()},uLight:{value:Array.from({length:9},()=>new T.Vector4())}};
    get count(){return this.items.length;}
    constructor(scene:T.Scene,private lights:BattlefieldLight){
        const g=new T.PlaneGeometry(1,1);this.shape=attribute(g,'aPuff',CAP,4);this.style=attribute(g,'aStyle',CAP,3);
        const mat=new T.ShaderMaterial({uniforms:this.uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
            vertexShader:`attribute vec4 aPuff;attribute vec3 aStyle;uniform vec4 uLight[9];
            varying vec2 v;varying vec3 style;varying float fire;
            void main(){v=uv*2.-1.;style=aStyle;vec4 mv=modelViewMatrix*vec4(aPuff.xyz,1.);
                fire=0.;for(int i=0;i<9;i++){vec3 d=aPuff.xyz-uLight[i].xyz;fire+=uLight[i].w/(2.+dot(d,d));}
                if(aStyle.y>4.5 && aStyle.y<5.5){
                    mv=modelViewMatrix*vec4(aPuff.xyz+vec3(position.x,0.,position.y)*aPuff.w,1.);
                }else mv.xy+=position.xy*aPuff.w;
                gl_Position=projectionMatrix*mv;}`,
            fragmentShader:`uniform vec3 uSun,uSky;varying vec2 v;varying vec3 style;varying float fire;
            void main(){
                float age=style.x,k=style.y,phase=style.z,r=length(v);
                float warp=.09*sin(5.*v.x+phase+age)*cos(4.*v.y-phase)+.045*sin(v.x*12.+v.y*6.+phase);
                float edge=1.-smoothstep(.51,1.,r+warp);
                float bulb=sqrt(max(0.,1.-dot(v,v)));
                float top=clamp(.43+v.y*.46-v.x*.23+bulb*.24,0.,1.);
                vec3 dye=k<.5?vec3(.50,.40,.235):k<1.5?vec3(.44,.29,.14):vec3(.64,.65,.60);
                if(k>2.5 && k<3.5)dye=mix(vec3(.12,.104,.088),vec3(.66,.67,.65),smoothstep(.05,.59,age));
                if(k>5.5)dye=vec3(.25,.19,.095);
                vec3 col=dye*mix(uSky,uSun,top)+vec3(1.,.41,.09)*min(fire*.10,1.3)*edge;
                float alpha=edge*(1.-age)*(k<1.5?.27:.53)*smoothstep(0.,.075,age+.025);
                if(k>3.5 && k<4.5){col=vec3(5.,2.3,.42);alpha=(1.-smoothstep(.08,1.,r))*(1.-age);}
                if(k>4.5 && k<5.5){alpha=(1.-smoothstep(.025,.14,abs(r-.77)))*(1.-age)*.41;col=vec3(.46,.36,.21);}
                if(alpha<.007)discard;gl_FragColor=vec4(col,alpha);
            }`});
        this.mesh=new T.InstancedMesh(g,mat,CAP);this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.renderOrder=8;scene.add(this.mesh);
    }
    private add(x:number,y:number,z:number,kind:number,size:number,life:number,vx:number,vy:number,vz:number){
        if(this.items.length>=CAP)return;
        this.items.push({x,y,z,kind,size,life,vx,vy,vz,age:0,seed:this.rng.next()*9});
    }
    event(e:BattleEvent){
        if(e.type!=='impact' && e.type!=='fire')return;
        const x=toX(e.x),z=toZ(e.y),y=terrainHeight(x,z),r=()=>this.rng.next();
        if(e.type==='impact'){
            this.add(x,y+.15,z,5,5,.85,0,.10,0);
            for(let i=0;i<10;i++)this.add(x,y+.2,z,6,1+r(),1+r(),(r()-.5)*6,2+r()*4,(r()-.5)*6);
            return;
        }
        const gun=e.explosive,mx=x+e.dx*(gun?1.65:1.2),mz=z+e.dy;
        this.lights.flash(mx,y,mz,gun);
        this.add(mx,y+1.1,mz,4,gun?2.6:.92,.105,e.dx*1.5,0,e.dy);
        if(!gun && this.items.length>3200)return;
        for(let i=0;i<(gun?11:3);i++){
            const speed=(gun?2.8:1.2)*r();
            this.add(mx+(r()-.5)*.3,y+1.06,mz,gun?3:2,(gun?1.8:.65)*(1+r()*.55),(gun?3.4:2.1)+r(),e.dx*speed+.33,.32+r()*.62,e.dy*speed+.13);
        }
    }
    update(units:Soldier[],dt:number){
        const r=()=>this.rng.next(),emitDt=Math.min(dt,.05);
        for(const u of units)if(u.hp>0 && u.moving){
            const horse=u.kind==='cuirassier', rate=horse?3.4:u.pose==='run'?1.75:.70;
            if(r()>emitDt*rate)continue;
            const speed=Math.max(1,Math.hypot(u.vx,u.vy)), offset=horse?1.2:.37;
            const x=toX(u.x)-u.vx/speed*offset+(r()-.5)*.32,z=toZ(u.y)-u.vy/speed*offset;
            this.add(x,terrainHeight(x,z)+.08+r()*.17,z,horse?1:0,horse?1.32:u.pose==='run'?.85:.55,
                1.1+r()*(horse?1.2:.75),.32-u.vx/speed*.36,horse?.44:u.pose==='run'?.30:.16,.14);
        }
        this.uniforms.uSun.value.setHex(this.lights.mode==='golden'?0xffe7bc:0xc7d6e1);
        this.uniforms.uSky.value.setHex(this.lights.mode==='golden'?0xa8b1b3:0x788899);
        this.lights.flashes.forEach((l,i)=>this.uniforms.uLight.value[i].set(l.position.x,l.position.y,l.position.z,l.intensity));
        for(let i=this.items.length-1;i>=0;i--){
            const p=this.items[i];p.age+=dt;
            if(p.age>=p.life){this.items[i]=this.items[this.items.length-1];this.items.pop();continue;}
            p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
            if(p.kind===6)p.vy=Math.max(-.8,p.vy-dt*5);
        }
        this.items.forEach((p,i)=>{
            const t=p.age/p.life;
            this.shape.setXYZW(i,p.x,p.y,p.z,p.size*(p.kind===4?1: .46+t*(p.kind===3?3.3:1.8)));
            this.style.setXYZ(i,t,p.kind,p.seed);
        });
        this.mesh.count=this.count;upload(this.shape,this.count);upload(this.style,this.count);
    }
    reset(){this.items.length=0;this.mesh.count=0;this.rng.state=53;}
}
