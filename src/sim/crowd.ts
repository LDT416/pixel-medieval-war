import {artillery as isArtillery} from './units/abilities';
import type {Soldier,Company} from './arenaTypes';
import type {SimWorld} from './world';
import type {Layout} from './maps';
import {treesFor} from './sceneryLayout';

const CELL=40,MAX_PUSH=1.5;
// Every new arrival searches the same spiral. Keep the exact offsets used by the original search.
const anchorX=new Float64Array(500),anchorY=new Float64Array(500);
for(let i=0;i<anchorX.length;i++){
    const radius=3*Math.sqrt(i),angle=i*2.399963;
    anchorX[i]=Math.cos(angle)*radius;anchorY[i]=Math.sin(angle)*radius;
}
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
    private scenery:Obstacle[][]=[];
    private nearby:Soldier[]=[];
    private blockers:Soldier[]=[];
    private bodyVersion:number[]=[];private solvedAt:number[]=[];private witnessMask:number[]=[];
    private rejected=0;
    private nearX=0;private nearY=0;private nearPad=0;
    private bins:Soldier[][]=[];
    private occupied:number[]=[];
    private diagnostics:Soldier[][]=[];
    private columns=1;
    private layout!:Layout;
    private slide:number[]=[];
    private lastX:number[]=[];private lastY:number[]=[];
    // A stationary solver result remains valid until a body in its neighbourhood changes.
    private changed:Float64Array=new Float64Array();
    private clock=0;
    private fixedAt:number[]=[];private fixedGoalX:number[]=[];private fixedGoalY:number[]=[];
    private fixedLimit:number[]=[];private bodyHeadingX:number[]=[];private bodyHeadingY:number[]=[];
    private occupiedByUnit:boolean[]=[];
    private nearWall:Uint8Array=new Uint8Array();
    reset(l:Layout){
        this.layout=l;this.columns=Math.ceil(l.width/CELL)+2;
        this.changed=new Float64Array(this.columns*(Math.ceil(l.height/CELL)+2));
        this.nearWall=new Uint8Array(this.changed.length);this.clock=0;
        this.fixedAt=[];this.fixedGoalX=[];this.fixedGoalY=[];this.fixedLimit=[];this.blockers=[];
        this.bodyVersion=[];this.solvedAt=[];this.witnessMask=[];
        this.bodyHeadingX=[];this.bodyHeadingY=[];this.occupiedByUnit=[];
        this.slide=[];this.bins=new Array(this.changed.length);this.diagnostics=new Array(this.changed.length);
        this.occupied=[];this.lastX=[];this.lastY=[];this.scenery=new Array(this.changed.length);this.nearby.length=0;
        const add=(o:Obstacle)=>{
            for(let j=Math.floor((o.y-o.halfY-14)/CELL);j<=Math.floor((o.y+o.halfY+14)/CELL);j++)
                for(let i=Math.floor((o.x-o.halfX-14)/CELL);i<=Math.floor((o.x+o.halfX+14)/CELL);i++){
                    const key=j*this.columns+i,list=this.scenery[key];
                    if(list)list.push(o);else this.scenery[key]=[o];
                    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)this.nearWall[key+dj*this.columns+di]=1;
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
    private invalidate(key:number){
        const version=++this.clock, cols=this.columns, cells=this.changed;
        for(let start=key-cols-1;start<=key+cols-1;start+=cols){
            cells[start]=version;cells[start+1]=version;cells[start+2]=version;
        }
    }
    private walls(u:Soldier,c:Company){
        const walls=this.scenery[this.key(u.x,u.y)];if(!walls)return;
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
        for(const k of this.occupied)this.diagnostics[k].length=0;
        this.occupied.length=0;
        for(const u of w.units)if(u.hp>0){
            const k=this.key(u.x,u.y);let bin=this.diagnostics[k];
            if(!bin){bin=[];this.diagnostics[k]=bin;}
            if(!bin.length)this.occupied.push(k);
            bin.push(u);
        }
    }
    private pairs(visit:(a:Soldier,b:Soldier)=>void){
        for(const k of this.occupied){
            const us=this.diagnostics[k];
            for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++)visit(us[i],us[j]);
            for(const next of [k+1,k+this.columns-1,k+this.columns,k+this.columns+1]){
                const vs=this.diagnostics[next];
                if(vs?.length)for(const u of us)for(const v of vs)visit(u,v);
            }
        }
    }
    private insert(u:Soldier){
        const k=this.key(u.x,u.y);let bin=this.bins[k];
        if(!bin){bin=[];this.bins[k]=bin;}
        bin.push(u);
    }
    // A blocked step tests several nearby slide positions while every other unit is frozen.
    // Gather the possible colliders once; a wall projection outside this box uses the full grid.
    private gather(u:Soldier,x:number,y:number,pad:number){
        const near=this.nearby;near.length=0;
        this.nearX=x;this.nearY=y;this.nearPad=pad;
        const reach=u.body.a+shapes.gun.a+pad;
        const left=Math.floor((x-reach)/CELL),right=Math.floor((x+reach)/CELL);
        const top=Math.floor((y-reach)/CELL),bottom=Math.floor((y+reach)/CELL);
        for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
            const bin=this.bins[row*this.columns+col];if(!bin)continue;
            for(const v of bin){
                if(v===u)continue;
                const limit=u.body.a+v.body.a;
                const dx=Math.max(0,Math.abs(this.lastX[v.id]-x)-pad),dy=Math.max(0,Math.abs(this.lastY[v.id]-y)-pad);
                if(dx*dx+dy*dy<limit*limit)near.push(v);
            }
        }
    }
    private localClearance(w:SimWorld,u:Soldier,x:number,y:number){
        if(Math.abs(x-this.nearX)>this.nearPad || Math.abs(y-this.nearY)>this.nearPad)
            return this.clearance(w,u,x,y);
        let best=1;
        const radius=u.body.a+11.5;
        for(const v of this.nearby){
            const dx=x-this.lastX[v.id],dy=y-this.lastY[v.id],limit=u.body.a+v.body.a,d2=dx*dx+dy*dy;
            if(d2>=limit*limit)continue;
            // The legacy search spans cells out to a+11.5. A 14px gun can straddle that cutoff.
            if(v.body.a>11.5 && (Math.floor(this.lastX[v.id]/CELL)<Math.floor((x-radius)/CELL) ||
                Math.floor(this.lastX[v.id]/CELL)>Math.floor((x+radius)/CELL) ||
                Math.floor(this.lastY[v.id]/CELL)<Math.floor((y-radius)/CELL) ||
                Math.floor(this.lastY[v.id]/CELL)>Math.floor((y+radius)/CELL)))continue;
            const d=Math.sqrt(d2);
            if(u.body.a===u.body.b && v.body.a===v.body.b){best=Math.min(best,d-limit);continue;}
            const nx=d?dx/d:1,ny=d?dy/d:0;
            best=Math.min(best,d-extent(u,w.companies[u.company],nx,ny)-extent(v,w.companies[v.company],nx,ny));
        }
        return best;
    }
    // The previous blocker is just a candidate. Retest it at the current position and heading.
    private blocked(w:SimWorld,u:Soldier,x:number,y:number,attempt:number){
        const key=u.id*6+attempt,v=this.blockers[key];
        this.rejected|=1<<attempt;
        if(v && v.hp>0){
            const dx=x-this.lastX[v.id],dy=y-this.lastY[v.id],d2=dx*dx+dy*dy,limit=u.body.a+v.body.a;
            if(d2<limit*limit){
                const d=Math.sqrt(d2),radius=u.body.a+11.5;
                if(v.body.a<=11.5 || (Math.floor(this.lastX[v.id]/CELL)>=Math.floor((x-radius)/CELL) &&
                    Math.floor(this.lastX[v.id]/CELL)<=Math.floor((x+radius)/CELL) &&
                    Math.floor(this.lastY[v.id]/CELL)>=Math.floor((y-radius)/CELL) &&
                    Math.floor(this.lastY[v.id]/CELL)<=Math.floor((y+radius)/CELL))){
                    if(u.body.a===u.body.b && v.body.a===v.body.b && d<limit)return true;
                    const nx=d?dx/d:1,ny=d?dy/d:0;
                    if(d-extent(u,w.companies[u.company],nx,ny)-extent(v,w.companies[v.company],nx,ny)<0)return true;
                }
            }
        }
        if(this.clearance(w,u,x,y,true,key)<0)return true;
        this.rejected&=~(1<<attempt);
        return false;
    }
    private witnessesUnchanged(id:number){
        const time=this.solvedAt[id],mask=this.witnessMask[id];
        if(!mask || this.bodyVersion[id]>time)return false;
        for(let i=0;i<6;i++)if(mask & (1<<i)){
            const v=this.blockers[id*6+i];
            if(!v || !v.hp || this.bodyVersion[v.id]>time)return false;
        }
        return true;
    }
    private clearance(w:SimWorld,u:Soldier,x:number,y:number,blockedOnly=false,cacheKey=-1){
        const ua=u.body.a,ub=u.body.b,radius=ua+11.5;
        let clearance=1;
        const rows=Math.floor((y+radius)/CELL),cols=Math.floor((x+radius)/CELL);
        for(let j=Math.floor((y-radius)/CELL);j<=rows;j++)for(let i=Math.floor((x-radius)/CELL);i<=cols;i++){
            const bin=this.bins[j*this.columns+i];if(!bin)continue;
            for(const v of bin){
                if(v===u)continue;
                const dx=x-this.lastX[v.id],dy=y-this.lastY[v.id],limit=ua+v.body.a,d2=dx*dx+dy*dy;
                if(d2>=limit*limit)continue;
                const d=Math.sqrt(d2);
                if(ua===ub && v.body.a===v.body.b){
                    clearance=Math.min(clearance,d-limit);
                }else{
                    const nx=d?dx/d:1,ny=d?dy/d:0;
                    clearance=Math.min(clearance,d-extent(u,w.companies[u.company],nx,ny)-extent(v,w.companies[v.company],nx,ny));
                }
                if(blockedOnly && clearance<0){
                    if(cacheKey>=0)this.blockers[cacheKey]=v;
                    return -1;
                }
            }
        }
        return clearance;
    }
    private anchor(w:SimWorld,u:Soldier){
        const x=u.x,y=u.y;
        // 只在首次入场时为每个精灵分配空位，正常行进始终从上帧实位出发。
        for(let i=0;i<500;i++){
            u.x=x+anchorX[i];u.y=y+anchorY[i];
            this.walls(u,w.companies[u.company]);
            if(this.clearance(w,u,u.x,u.y,true)>=0)break;
        }
        this.lastX[u.id]=u.x;this.lastY[u.id]=u.y;this.insert(u);
    }
    step(w:SimWorld){
        // The grid stores accepted positions. Movement and deployment can write new goals
        // to unit.x/y without invalidating neighbour queries made earlier in this tick.
        if(!this.blockers.length)this.blockers=new Array(w.units.length*6);
        for(const u of w.units){
            if(u.hp<=0){
                if(this.occupiedByUnit[u.id]){
                    const key=this.key(this.lastX[u.id],this.lastY[u.id]);
                    const bin=this.bins[key];bin.splice(bin.indexOf(u),1);this.invalidate(key);
                    this.occupiedByUnit[u.id]=false;
                }
                continue;
            }
            if(this.lastX[u.id]===undefined){
                const goalX=u.x,goalY=u.y;
                this.anchor(w,u);this.occupiedByUnit[u.id]=true;
                this.invalidate(this.key(u.x,u.y));u.x=goalX;u.y=goalY;continue;
            }
            if(u.body.a!==u.body.b){
                const c=w.companies[u.company];
                if(this.bodyHeadingX[u.id]!==c.hx || this.bodyHeadingY[u.id]!==c.hy){
                    this.bodyHeadingX[u.id]=c.hx;this.bodyHeadingY[u.id]=c.hy;
                    this.invalidate(this.key(this.lastX[u.id],this.lastY[u.id]));
                    this.bodyVersion[u.id]=this.clock;
                }
            }
        }
        for(let j=0;j<w.units.length;j++){
            const u=w.units[(j+w.tick)%w.units.length];if(u.hp<=0)continue;
            const goalX=u.x,goalY=u.y,x=this.lastX[u.id],y=this.lastY[u.id];
            const k=this.key(x,y),c=w.companies[u.company],dx=goalX-x,dy=goalY-y;
            u.x=x;u.y=y;
            // 部署路径是动画的理想位置；排队时也只能按本地步态追赶。
            const parked=w.tick>w.deployEnd && u.body===shapes.gun && !c.limbered && c.status!=='rout';
            if(parked || (!dx && !dy && u.body.a===u.body.b)){
                if(u.moving)u.stride-=Math.hypot(dx,dy);
                if(parked)u.moving=false;
                u.px=x;u.py=y;u.vx=0;u.vy=0;continue;
            }
            const maxStep=(c.sprintUntil>w.tick?235:Math.max(114,u.speed))*1.05/30;
            const stamp=this.changed[k];
            if(this.fixedGoalX[u.id]===goalX && this.fixedGoalY[u.id]===goalY &&
                this.fixedLimit[u.id]===maxStep && (this.fixedAt[u.id]===stamp ||
                (this.witnessesUnchanged(u.id) && this.clearance(w,u,x,y,true)>=0))){
                if(u.moving)u.stride-=Math.hypot(dx,dy);
                u.px=x;u.py=y;u.vx=0;u.vy=0;continue;
            }
            this.rejected=0;
            let clearRest=false;
            const oldSlide=this.slide[u.id];
            const distance=Math.hypot(dx,dy);
            const t=Math.min(1,maxStep/(distance||1));
            const nearWall=this.nearWall[k]!==0 || maxStep+MAX_PUSH>=CELL;
            u.x=x+dx*t;u.y=y+dy*t;if(nearWall)this.walls(u,c);
            if(this.blocked(w,u,u.x,u.y,0)){
                const sx=u.x-x,sy=u.y-y;
                const rest=this.clearance(w,u,x,y);
                clearRest=rest>=0;
                if(rest<0)this.gather(u,x,y,maxStep+1);
                let bestX=x,bestY=y,best=rest;
                for(let attempt=0;attempt<3;attempt++){
                    u.x=x+(attempt===0?sx:attempt===1?0:sx*.5);
                    u.y=y+(attempt===0?0:attempt===1?sy:sy*.5);if(nearWall)this.walls(u,c);
                    const score=rest<0?this.localClearance(w,u,u.x,u.y):
                        this.blocked(w,u,u.x,u.y,attempt+1)?-1:1;
                    if(score>=0 || score>best){
                        bestX=u.x;bestY=u.y;best=score;
                        if(score>=0){if(bestX!==x || bestY!==y)clearRest=false;break;}
                    }
                }
                u.x=bestX;u.y=bestY;
                if(Math.hypot(u.x-x,u.y-y)<.12 && distance>1 && weight(u,c)){
                    const sign=this.slide[u.id]??(u.id%2?1:-1);
                    for(let attempt=0;attempt<2;attempt++){
                        const side=attempt===0?sign:-sign;
                        u.x=x-sy*side*.85+sx*.15;u.y=y+sx*side*.85+sy*.15;
                        if(nearWall)this.walls(u,c);
                        if(!this.blocked(w,u,u.x,u.y,attempt+4)){this.slide[u.id]=side;best=0;break;}
                        u.x=bestX;u.y=bestY;
                    }
                }
                if(best<0 && weight(u,c)){
                    // 转身会改变椭圆轮廓。只修复残余穿插，限制本帧修正距离。
                    const kx=this.localClearance(w,u,u.x+.2,u.y)-this.localClearance(w,u,u.x-.2,u.y);
                    const ky=this.localClearance(w,u,u.x,u.y+.2)-this.localClearance(w,u,u.x,u.y-.2);
                    const length=Math.hypot(kx,ky)||1,step=Math.min(MAX_PUSH,-best*.5)*weight(u,c);
                    u.x+=step*kx/length;u.y+=step*ky/length;if(nearWall)this.walls(u,c);
                }
            }
            u.x=Math.max(2,Math.min(this.layout.width-2,u.x));u.y=Math.max(2,Math.min(this.layout.height-2,u.y));
            if(this.key(u.x,u.y)!==k){const list=this.bins[k];list.splice(list.indexOf(u),1);this.insert(u);}
            const moved=Math.hypot(u.x-x,u.y-y);
            if(moved){
                this.invalidate(k);
                const dest=this.key(u.x,u.y);if(dest!==k)this.invalidate(dest);
                this.bodyVersion[u.id]=this.clock;
                this.fixedAt[u.id]=-1;this.witnessMask[u.id]=0;
            }else if(!this.nearWall[k] && oldSlide===this.slide[u.id] && maxStep*1.1+2*shapes.gun.a+1<CELL && u.body!==shapes.gun){
                this.fixedAt[u.id]=stamp;
                this.fixedGoalX[u.id]=goalX;this.fixedGoalY[u.id]=goalY;this.fixedLimit[u.id]=maxStep;
                this.solvedAt[u.id]=this.clock;this.witnessMask[u.id]=clearRest?this.rejected:0;
            }else{this.fixedAt[u.id]=-1;this.witnessMask[u.id]=0;}
            if(u.moving)u.stride+=moved-distance;
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
