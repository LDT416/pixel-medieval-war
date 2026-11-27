import type {SimWorld} from '../../sim/world';
import type {Layout} from '../../sim/maps';
import type {Point} from '../../sim/types';

export const armyInk=['#294968','#8d4136','#243343'];
const frontSamples=13;
/** 取各纬度附近双方最前沿部队的中线。没有部队的区域延续初始分界。 */
export function frontLine(w:SimWorld){
    const {width,height}=w.layout,front:number[]=[];
    const live=w.companies.filter(c=>c.alive && c.line!==5 && c.status!=='rout' && c.status!=='gone');
    for(let i=0;i<frontSamples;i++){
        const y=i*height/(frontSamples-1);let west=-Infinity,east=Infinity;
        for(const c of live){
            const weight=Math.abs(c.y-y)*.6;
            if(c.faction===0)west=Math.max(west,c.x-weight);else east=Math.min(east,c.x+weight);
        }
        front.push(Number.isFinite(west+east)?Math.max(0,Math.min(width,(west+east)/2)):width/2);
    }
    return front;
}
function path(ctx:CanvasRenderingContext2D,points:Point[]){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
}
export function paintMap(canvas:HTMLCanvasElement,l:Layout,front:number[],labels:boolean){
    const ctx=canvas.getContext('2d')!,k=canvas.width/l.width,H=l.height,W=l.width;
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle='#d3c8a4';ctx.fillRect(0,0,W,H);
    const points=front.map((x,i)=>({x,y:i*H/(front.length-1)}));
    for(const [edge,color] of [[0,'rgba(74,111,158,.18)'],[W,'rgba(171,85,69,.17)']] as const){
        path(ctx,[{x:edge,y:0},...points,{x:edge,y:H}]);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    if(labels){
        ctx.lineWidth=.7/k;ctx.strokeStyle='#a2987973';
        for(let x=0;x<W;x+=1000){path(ctx,[{x,y:0},{x,y:H}]);ctx.stroke();}
        for(let y=0;y<H;y+=1000){path(ctx,[{x:0,y},{x:W,y}]);ctx.stroke();}
    }
    ctx.strokeStyle='#9a906b';ctx.lineWidth=1/k;
    for(const r of l.ridges)for(let i=1;i<=3;i++){
        ctx.beginPath();ctx.ellipse(r.x,r.y,r.width*(.5+i*.4),r.length*(.18+i*.14),0,0,2*Math.PI);ctx.stroke();
    }
    ctx.fillStyle='#879472';
    for(const g of l.woods){ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*.87,-.18,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#80a5ab';ctx.lineWidth=Math.max(2/k,l.river.width);path(ctx,l.river.points);ctx.stroke();
    for(const road of l.roads){ctx.lineWidth=Math.max(1/k,road.width*.65);ctx.strokeStyle='#baa17c';path(ctx,road.points);ctx.stroke();}
    for(const f of l.farms){ctx.fillStyle='#8a7057';ctx.fillRect(f.x-f.w*.5,f.y-f.h*.5,f.w,f.h);}
    ctx.strokeStyle='#88785c';ctx.lineWidth=1.7/k;ctx.setLineDash([6/k,4/k]);path(ctx,points);ctx.stroke();ctx.setLineDash([]);
    ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='500 '+(15/k)+'px "Microsoft YaHei", sans-serif';
    for(const p of l.objectives){
        const r=(labels?4:2.4)/k;ctx.fillStyle=armyInk[p.owner]??'#756d55';ctx.strokeStyle='#eee3be';ctx.lineWidth=1.2/k;
        ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r,p.y);ctx.lineTo(p.x,p.y+r);ctx.lineTo(p.x-r,p.y);ctx.closePath();ctx.fill();ctx.stroke();
        if(labels){ctx.fillStyle='#423d30';ctx.fillText(p.name,p.x+r*1.8,p.y);}
    }
    if(labels){
        ctx.font='600 '+(20/k)+'px serif';ctx.fillStyle='#59543d';
        ['左翼','中央','右翼'].forEach((n,i)=>ctx.fillText(n,W*.034,H*(i+.45)/3));
        ctx.strokeStyle='#7c7457';ctx.lineWidth=3/k;ctx.strokeRect(1.5/k,1.5/k,W-3/k,H-3/k);
    }
    ctx.setTransform(1,0,0,1,0,0);
}
