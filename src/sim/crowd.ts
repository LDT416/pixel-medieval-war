import {artillery as isArtillery} from './units/abilities';
import type {Soldier,Company} from './arenaTypes';
import type {SimWorld} from './world';
import type {Layout} from './maps';
import {treesFor} from './sceneryLayout';

const CELL=40,MAX_PUSH=1.5;
type Obstacle={x:number;y:number;halfX:number;halfY:number;round:boolean};
import {footprints as shapes} from './units/unitTypes';
function extent(u:Soldier,c:Company,nx:number,ny:number){
    const {a,b}=u.body;
    if(a===b)return a;
    const dot=nx*c.hx+ny*c.hy;
    return a*b/Math.sqrt(a*a+(b*b-a*a)*Math.min(1,dot*dot));
}
function weight(u:Soldier,c:Company){return isArtillery(u)&&!c.limbered?0:1/u.body.mass;}
export class Crowd {
    private scenery=new Map<number,Obstacle[]>();
    private bins:Soldier[][]=[];
    private occupied:number[]=[];
    private columns=1;
    private goalX:number[]=[];private goalY:number[]=[];
    private layout!:Layout;
    private slide:number[]=[];
    private lastX:number[]=[];private lastY:number[]=[];
    reset(l:Layout){
        this.layout=l;this.columns=Math.ceil(l.width/CELL)+2;
        this.slide=[];this.bins=[];this.occupied=[];this.lastX=[];this.lastY=[];this.scenery.clear();
        const add=(o:Obstacle)=>{
            for(let j=Math.floor((o.y-o.halfY-14)/CELL);j<=Math.floor((o.y+o.halfY+14)/CELL);j++)
                for(let i=Math.floor((o.x-o.halfX-14)/CELL);i<=Math.floor((o.x+o.halfX+14)/CELL);i++){
                    const key=j*this.columns+i,list=this.scenery.get(key);
                    if(list)list.push(o);else this.scenery.set(key,[o]);
                }
        };
        for(const t of treesFor(l))add({x:t.x,y:t.y,halfX:6.8*t.size,halfY:6.8*t.size,round:true});
        for(const f of l.farms){
            const s=f.w/9.5,dir=l.ridgeOwner===0?-1:1;
            const rect=(x:number,y:number,w:number,h:number)=>add({x:f.x+x*dir*s,y:f.y+y*dir*s,halfX:w*s/2,halfY:h*s/2,round:false});
            rect(2.85,.95,2.45,2.6);rect(-.1,-2.35,3.05,1.65);
            for(const y of [-3.4,3.4])rect(0,y,9.35,.25);
            rect(4.62,0,.24,6.9);
            for(const y of [-2.18,2.18])rect(-4.62,y,.25,2.55);
        }
    }
    private key(x:number,y:number){return Math.floor(y/CELL)*this.columns+Math.floor(x/CELL);}
    private walls(u:Soldier,c:Company){
        const walls=this.scenery.get(this.key(u.x,u.y));if(!walls)return;
        for(const o of walls){
            const dx=u.x-o.x,dy=u.y-o.y;
            let nx=dx,ny=dy,depth=0;
            if(!o.round){
                nx=dx-Math.max(-o.halfX,Math.min(o.halfX,dx));ny=dy-Math.max(-o.halfY,Math.min(o.halfY,dy));
                if(nx===0&&ny===0){
                    if(o.halfX-Math.abs(dx)<o.halfY-Math.abs(dy)){nx=Math.sign(dx)||1;depth=o.halfX-Math.abs(dx);}
                    else{ny=Math.sign(dy)||1;depth=o.halfY-Math.abs(dy);}
                }
            }
            const d=Math.hypot(nx,ny);if(!d){nx=1;ny=0;}else{nx/=d;ny/=d;}
            const overlap=extent(u,c,nx,ny)+(o.round?o.halfX:0)+(depth>0?depth:-d);
            if(overlap>0){u.x+=nx*overlap;u.y+=ny*overlap;}
        }
    }
    private fill(w:SimWorld){
        for(const k of this.occupied)this.bins[k].length=0;
        this.occupied.length=0;
        for(const u of w.units)if(u.hp>0){
            const k=this.key(u.x,u.y);let bin=this.bins[k];
            if(!bin){bin=[];this.bins[k]=bin;}
            if(!bin.length)this.occupied.push(k);
            bin.push(u);
        }
    }
    private pairs(visit:(a:Soldier,b:Soldier)=>void){
        for(const k of this.occupied){
            const us=this.bins[k];
            for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++)visit(us[i],us[j]);
            for(const next of [k+1,k+this.columns-1,k+this.columns,k+this.columns+1]){
                const vs=this.bins[next];
                if(vs?.length)for(const u of us)for(const v of vs)visit(u,v);
            }
        }
    }
    private insert(u:Soldier){
        const k=this.key(u.x,u.y);let bin=this.bins[k];
        if(!bin){bin=[];this.bins[k]=bin;}
        if(!bin.length)this.occupied.push(k);
        bin.push(u);
    }
    private clearance(w:SimWorld,u:Soldier,x:number,y:number){
        const ua=u.body.a,ub=u.body.b,radius=ua+11.5;
        let clearance=1;
        const rows=Math.floor((y+radius)/CELL),cols=Math.floor((x+radius)/CELL);
        for(let j=Math.floor((y-radius)/CELL);j<=rows;j++)for(let i=Math.floor((x-radius)/CELL);i<=cols;i++){
            const bin=this.bins[j*this.columns+i];if(!bin)continue;
            for(const v of bin){
                if(v===u)continue;
                const dx=x-v.x,dy=y-v.y,limit=ua+v.body.a,d2=dx*dx+dy*dy;
                if(d2>=limit*limit)continue;
                const d=Math.sqrt(d2);
                if(ua===ub && v.body.a===v.body.b){clearance=Math.min(clearance,d-limit);continue;}
                const nx=d?dx/d:1,ny=d?dy/d:0;
                clearance=Math.min(clearance,d-extent(u,w.companies[u.company],nx,ny)-extent(v,w.companies[v.company],nx,ny));
            }
        }
        return clearance;
    }
    private anchor(w:SimWorld,u:Soldier){
        const x=u.x,y=u.y;
        // 只在首次入场时为每个精灵分配空位，正常行进始终从上帧实位出发。
        for(let i=0;i<500;i++){
            const radius=3*Math.sqrt(i),a=i*2.399963;
            u.x=x+Math.cos(a)*radius;u.y=y+Math.sin(a)*radius;
            this.walls(u,w.companies[u.company]);
            if(this.clearance(w,u,u.x,u.y)>=0)break;
        }
        this.lastX[u.id]=u.x;this.lastY[u.id]=u.y;this.insert(u);
    }
    step(w:SimWorld){
        for(const k of this.occupied)this.bins[k].length=0;
        this.occupied.length=0;
        const {goalX,goalY}=this;
        for(const u of w.units)if(u.hp>0){
            goalX[u.id]=u.x;goalY[u.id]=u.y;
            if(this.lastX[u.id]===undefined){this.anchor(w,u);continue;}
            u.x=this.lastX[u.id];u.y=this.lastY[u.id];this.insert(u);
        }
        for(let j=0;j<w.units.length;j++){
            const u=w.units[(j+w.tick)%w.units.length];if(u.hp<=0)continue;
            const x=u.x,y=u.y,k=this.key(x,y),c=w.companies[u.company];
            const dx=goalX[u.id]-x,dy=goalY[u.id]-y;
            // 部署路径是动画的理想位置；排队时也只能按本地步态追赶。
            const parked=w.tick>w.deployEnd && u.body===shapes.gun && !c.limbered && c.status!=='rout';
            if(parked || (!dx && !dy && u.body.a===u.body.b)){
                if(u.moving)u.stride-=Math.hypot(dx,dy);
                if(parked)u.moving=false;
                u.px=x;u.py=y;u.vx=0;u.vy=0;continue;
            }
            const maxStep=(c.sprintUntil>w.tick?235:Math.max(114,u.speed))*1.05/30;
            const t=Math.min(1,maxStep/(Math.hypot(dx,dy)||1));
            u.x=x+dx*t;u.y=y+dy*t;this.walls(u,c);
            let score=this.clearance(w,u,u.x,u.y);
            if(score<0){
                const sx=u.x-x,sy=u.y-y,rest=this.clearance(w,u,x,y);
                let bestX=x,bestY=y,best=rest;
                for(const [ax,ay] of [[sx,0],[0,sy],[sx*.5,sy*.5]]){
                    u.x=x+ax;u.y=y+ay;this.walls(u,c);
                    score=this.clearance(w,u,u.x,u.y);
                    if(score>=0 || score>best){bestX=u.x;bestY=u.y;best=score;if(score>=0)break;}
                }
                u.x=bestX;u.y=bestY;
                if(Math.hypot(u.x-x,u.y-y)<.12 && Math.hypot(dx,dy)>1 && weight(u,c)){
                    const sign=this.slide[u.id]??(u.id%2?1:-1);
                    for(const side of [sign,-sign]){
                        u.x=x-sy*side*.85+sx*.15;u.y=y+sx*side*.85+sy*.15;
                        this.walls(u,c);
                        if(this.clearance(w,u,u.x,u.y)>=0){this.slide[u.id]=side;best=0;break;}
                        u.x=bestX;u.y=bestY;
                    }
                }
                if(best<0 && weight(u,c)){
                    // 转身会改变椭圆轮廓。只修复残余穿插，限制本帧修正距离。
                    const kx=this.clearance(w,u,u.x+.2,u.y)-this.clearance(w,u,u.x-.2,u.y);
                    const ky=this.clearance(w,u,u.x,u.y+.2)-this.clearance(w,u,u.x,u.y-.2);
                    const length=Math.hypot(kx,ky)||1,step=Math.min(MAX_PUSH,-best*.5)*weight(u,c);
                    u.x+=step*kx/length;u.y+=step*ky/length;this.walls(u,c);
                }
            }
            u.x=Math.max(2,Math.min(this.layout.width-2,u.x));u.y=Math.max(2,Math.min(this.layout.height-2,u.y));
            if(this.key(u.x,u.y)!==k){const list=this.bins[k];list.splice(list.indexOf(u),1);this.insert(u);}
            const moved=Math.hypot(u.x-x,u.y-y);
            if(u.moving)u.stride+=moved-Math.hypot(dx,dy);
            u.px=x;u.py=y;u.vx=(u.x-x)*30;u.vy=(u.y-y)*30;
            this.lastX[u.id]=u.x;this.lastY[u.id]=u.y;
        }
    }
    overlaps(w:SimWorld,inspect?:(a:Soldier,b:Soldier)=>void){
        let count=0;this.fill(w);
        this.pairs((a,b)=>{
            const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
            if(d>=a.body.a+b.body.a)return;
            const nx=d?dx/d:1,ny=d?dy/d:0;
            const x=extent(a,w.companies[a.company],nx,ny),y=extent(b,w.companies[b.company],nx,ny);
            if(x+y-d>.30*Math.min(x,y)){count++;inspect?.(a,b);}
        });
        return count;
    }
}
