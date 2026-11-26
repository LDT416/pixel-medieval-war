import type {Faction, SimEvent} from '../sim/types';
import {DecalLayer} from './decalLayer';
import {banner} from './banners';
import {muzzleOffset} from './spriteBaker';

enum Effect { Blood, Gib, Smoke, Spark, Water, Wood, Steel, Ring, Flag, Aura, Skullcap=11, Dust=13 }
interface Particle {
    x:number; y:number; z:number; vx:number; vy:number; vz:number;
    life:number; size:number; color:string; mode:Effect; faction:Faction;
    initialLife:number; variant:number;
}
interface Bounds {x:number; y:number; w:number; h:number}
const clouds:HTMLCanvasElement[][]=[];
const soot=['#f4f5f0','#dce0db','#b9c0bd'];
// Bake stepped cloud silhouettes with lit upwind edges and dense folded undersides.
function cloud(variant:number,phase:number){
    const row=clouds[variant]??(clouds[variant]=[]);
    if(row[phase])return row[phase];
    const art=document.createElement('canvas');art.width=32;art.height=25;
    const c=art.getContext('2d')!;c.imageSmoothingEnabled=false;
    const lobes=[[7,15,5,4],[12,11,6,6],[21,12,7,5],[25,15,5,4],[16,16,7,5],[9,11,4,4]];
    for(const [i,lobe] of lobes.entries()){
        const [cx,cy,rx,ry]=lobe;
        const theta=(variant*1.9+i*1.25+phase*.7);
        const x=cx+Math.round(Math.cos(theta)*2),y=cy+Math.round(Math.sin(theta)*1.7);
        for(let dy=-ry;dy<=ry;dy++){
            const r=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/(ry+.3))**2)));
            c.fillStyle=dy>ry*.45?soot[2]:dy<=-ry*.35?soot[0]:soot[1];
            c.fillRect(x-r,y+dy,r*2+1,1);
        }
    }
    row[phase]=art;return art;
}

export class VfxPool {
    private live:Particle[]=[];
    private spare:Particle[]=[];
    readonly flashes=new Map<number,number>();
    inferno=true;
    constructor(private decals:DecalLayer){}
    snapshot(){return this.live.map(p=>({...p}));}
    restore(particles:Particle[]){
        this.reset();
        for(const p of particles.slice(-3200)){
            const entry=this.spare.pop()??{} as Particle;
            Object.assign(entry,p,{initialLife:p.initialLife??p.life,variant:p.variant??0});
            this.live.push(entry);
        }
    }
    reset(){
        this.spare.push(...this.live);this.live.length=0;this.flashes.clear();
    }
    private land(p:Particle){
        if(p.mode===Effect.Blood)this.decals.stamp(p.x,p.y,p.size,'#680f19',Math.max(2,p.size-1));
        else if(p.mode===Effect.Gib||p.mode===Effect.Skullcap)this.decals.stampGib(p.x,p.y,p.size,p.color,p.mode===Effect.Gib);
        else if(p.mode===Effect.Flag)this.decals.fallen(p.x,p.y,p.faction);
    }
    private add(e:SimEvent,mode:Effect,color:string,size:number,life:number,spread=0,vz=0){
        if(this.live.length>=3200){
            const oldest=this.live[0];this.land(oldest);
            this.live[0]=this.live.pop()!;this.spare.push(oldest);
        }
        const p=this.spare.pop()??{} as Particle;
        p.x=e.x;p.y=e.y;p.z=e.z??0;p.vx=(Math.random()-.5)*spread;p.vy=(Math.random()-.5)*spread;p.vz=vz;
        p.life=p.initialLife=life;p.variant=Math.floor(Math.random()*4);
        p.mode=mode;p.size=size;p.color=color;p.faction=e.faction??0;
        this.live.push(p);return p;
    }
    private smoke(e:SimEvent) {
        if(!e.kind)return;
        const gun=e.kind==='field_cannon',dx=e.dx??1,dy=e.dy??0;
        const offset=muzzleOffset(e.kind,dx,dy);
        const muzzle={...e,x:e.x+offset.x,y:e.y+offset.y};
        const spark=this.add(muzzle,Effect.Spark,'#f4bd74',gun?4:3,.067);
        spark.z=e.z??0;
        const count=gun?8:4+(Math.random()*3|0);
        for(let i=0;i<count;i++){
            const t=i/(count-1),side=(Math.random()-.5)*(gun?9:4);
            const life=1.4+Math.random();
            const p=this.add(muzzle,Effect.Smoke,'',gun?42+Math.random()*21:28+Math.random()*13,life);
            const advance=t*(gun?14:5);p.x+=dx*advance-dy*side;p.y+=dy*advance+dx*side;
            p.vx=dx*(15+t*(gun?125:68))+(Math.random()-.5)*15;
            p.vy=dy*(15+t*(gun?125:68))+(Math.random()-.5)*13;
            p.vz=6+Math.random()*9;
        }
    }
    consume(events:SimEvent[]){
        const now=performance.now(),dense=this.inferno;
        for(const [id,until] of this.flashes)if(until<=now)this.flashes.delete(id);
        for(const e of events){
            this.decals.event(e);
            if(e.type==='fire'){this.smoke(e);continue;}
            if(e.type==='death'){
                const cloth=e.faction?'#a73232':'#2c5082';
                const colors=['#79131e','#a31b29','#d9cdb3',cloth,e.kind==='cuirassier'?'#b2bfbd':cloth];
                for(let i=0;i<(dense?14:7);i++){
                    const p=this.add(e,Effect.Gib,colors[i%colors.length],3+i%3,.85,138,35+Math.random()*95);
                    p.z+=8;
                }
                for(let i=0;i<(dense?10:4);i++)this.add(e,Effect.Blood,i%2?'#b4212b':'#790e19',2+i%2,.8,152,45+Math.random()*110);
                if(e.kind!=='field_cannon'){
                    const hat=this.add(e,Effect.Skullcap,e.kind==='cuirassier'?'#bcc8cc':'#262528',e.kind==='guard_grenadier'?6:4,1.3,85,116);
                    hat.z+=19;
                }
                if(e.flag)this.add(e,Effect.Flag,'#715135',23,1,100,60).z+=25;
            }else if(e.type==='hit'){
                if(e.unitId)this.flashes.set(e.unitId,now+55);
                for(let i=0;i<(dense?7:3);i++){
                    const p=this.add(e,Effect.Blood,i%2?'#a51924':'#710f18',2+i%2,.65,140,30+Math.random()*88);
                    p.z+=5;
                }
            }else if(e.type==='trail')this.add(e,Effect.Blood,'#a81e25',3,.5,16,2);
            else if(e.type==='impact'||e.type==='collapse'){
                for(let i=0;i<(dense?13:8);i++)
                    this.add(e,Effect.Dust,i%3?'#8d836c':'#b9ae91',4+i%6,.35+Math.random()*.5,120,15+Math.random()*55);
            }else if(e.type==='drum'||e.type==='horn'||e.type==='heal'){
                this.add(e,Effect.Aura,e.faction?'#bf6259':'#598ab2',25,.45);
            }else if(e.type==='wade'||e.type==='splash'){
                for(let i=0;i<(e.type==='wade'?2:7);i++)this.add(e,Effect.Water,'#91b2bb',2,.4,45,20+Math.random()*55);
            }else if(e.type==='arrowland')this.add(e,Effect.Wood,'#867657',3,.85);
            else if(e.type==='slash'||e.type==='block')this.add(e,Effect.Steel,'#d8dacc',4,.09);
        }
    }
    update(dt:number){
        const damping=Math.exp(-2.4*dt),dustDamping=Math.exp(-1.6*dt);
        for(let i=this.live.length-1;i>=0;i--){
            const p=this.live[i];
            p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
            const solid=p.mode===Effect.Blood||p.mode===Effect.Gib||p.mode===Effect.Skullcap||p.mode===Effect.Flag||p.mode===Effect.Water;
            if(solid)p.vz-=330*dt;
            if(p.life<=0||solid&&p.z<=0){
                this.land(p);
                const last=this.live.pop()!;
                if(i<this.live.length)this.live[i]=last;
                this.spare.push(p);continue;
            }
            if(p.mode===Effect.Smoke){p.vx=5+(p.vx-5)*damping;p.vy*=damping;p.vz+=1.6*dt;}
            else if(p.mode===Effect.Dust){p.vx*=dustDamping;p.vy*=dustDamping;}
        }
    }
    draw(c:CanvasRenderingContext2D,bounds?:Bounds){
        const left=bounds?bounds.x-75:-Infinity,right=bounds?bounds.x+bounds.w+75:Infinity;
        const top=bounds?bounds.y-75:-Infinity,bottom=bounds?bounds.y+bounds.h+75:Infinity;
        for(const p of this.live){
            const x=Math.round(p.x),y=Math.round(p.y-p.z);
            if(x<left||x>right||y<top||y>bottom)continue;
            const age=p.initialLife-p.life;
            if(p.mode===Effect.Smoke){
                const growth=.24+.76*Math.min(1,age*3.5)+age*.37;
                const w=Math.round(p.size*growth),h=Math.round(w*.77);
                const phase=Math.floor(age*4)%4;
                c.globalAlpha=Math.min(.88,p.life/.85)*Math.min(1,.3+age*8);
                c.drawImage(cloud(p.variant,phase),x-(w>>1),y-(h>>1),w,h);c.globalAlpha=1;
            }else if(p.mode===Effect.Flag){
                c.drawImage(banner(p.faction),x,y-29,22,29);
            }else if(p.mode===Effect.Aura||p.mode===Effect.Ring){
                c.globalAlpha=p.life/p.initialLife*.48;c.strokeStyle=p.color;c.lineWidth=1.5;
                c.beginPath();c.ellipse(x,y,9+age*40,3+age*11,0,0,circle);c.stroke();c.globalAlpha=1;
            }else if(p.mode===Effect.Skullcap){
                c.fillStyle=p.color;c.fillRect(x-2,y-2,p.size,p.size-1);
                c.fillStyle=brassColor;c.fillRect(x-1,y+1,p.size-1,1);
            }else if(p.mode===Effect.Spark){
                c.fillStyle='#b78050';c.fillRect(x-1,y-1,p.size,2);
                c.fillStyle=p.color;c.fillRect(x,y-1,1,3);
            }else{
                c.fillStyle=p.color;
                if(p.mode===Effect.Dust)c.globalAlpha=p.life/p.initialLife*.7;
                c.fillRect(x,y,p.size,p.mode===Effect.Steel?1:p.size);c.globalAlpha=1;
            }
        }
    }
}
const circle=Math.PI*2,brassColor='#c09858';
