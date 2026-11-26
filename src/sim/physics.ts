import {UNITS,crews} from './config';
import {WIDTH,HEIGHT} from './maps';
import type {Unit} from './types';
import type {SimWorld} from './world';
export function radius(u:Unit){return crews[u.kind]?22:UNITS[u.kind].traits.includes('mount')||u.kind==='supply_wagon'?12.5:7.5;}
function project(w:SimWorld,u:Unit,dx:number,dy:number){
    const x=u.x+dx,y=u.y+dy;
    if(x<3||x>WIDTH-3||y<3||y>HEIGHT-3||!w.grid.walk(x,y,u.faction))return false;
    u.x=x;u.y=y;return true;
}
export function resolveCollisions(w:SimWorld){
    for(let round=0;round<2;round++){
        w.hash.rebuild(w.units);
        for(const a of w.units){
            if(a.hp<=0||a.tower||a.z>3)continue;
            const ra=radius(a);
            w.hash.visit(a.x,a.y,ra+22,b=>{
                if(a.id>=b.id||b.tower||b.z>3)return;
                const rb=radius(b), dx=b.x-a.x, dy=b.y-a.y, dist=Math.hypot(dx,dy);
                const overlap=ra+rb-dist;
                if(overlap<=0)return;
                const angle=((a.id*97+b.id*79)%360)*Math.PI/180;
                const nx=dist?dx/dist:Math.cos(angle),ny=dist?dy/dist:Math.sin(angle);
                const mass=(r:number)=>r===22?8:r===12.5?2.6:1;
                const shift=(overlap+.001)*mass(rb)/(mass(ra)+mass(rb));
                const moved=project(w,a,-nx*shift,-ny*shift);
                const rest=moved?overlap+.001-shift:overlap+.001;
                if(!project(w,b,nx*rest,ny*rest)&&moved)project(w,a,-nx*rest,-ny*rest);
            });
        }
    }
    // Chained contacts can leave residual penetration after two projections.
    // Commit legal positions in stable ID order; only search when a contact remains.
    w.hash.rebuild([]);
    for(const u of w.units){
        if(u.hp<=0||u.tower||u.z>3)continue;
        const r=radius(u),startX=u.x,startY=u.y;
        const fits=(x:number,y:number)=>{
            if(x<3||x>WIDTH-3||y<3||y>HEIGHT-3||!w.grid.walk(x,y,u.faction))return false;
            let clear=true;
            w.hash.visit(x,y,r+22,n=>{if((n.x-x)**2+(n.y-y)**2<(r+radius(n))**2-.00001)clear=false;});
            return clear;
        };
        if(!fits(startX,startY)){
            let found=false;
            for(const reach of [.015,.1,.4,1,2,4,8,16,24,32,48,64,96,128,176,240,360,480]){
                const samples=Math.max(12,Math.ceil(reach*.65));
                for(let i=0;i<samples;i++){
                    const angle=i*Math.PI*2/samples+u.id*2.4,x=startX+Math.cos(angle)*reach,y=startY+Math.sin(angle)*reach;
                    if(fits(x,y)){u.x=x;u.y=y;found=true;break;}
                }
                if(found)break;
            }
        }
        w.hash.insert(u);
    }
    w.hash.rebuild(w.units);
}
export function faceToward(u:Unit,dx:number){
    const face=Math.sign(dx);
    if(face&&face!==u.face&&u.faceLock===0){u.face=face;u.faceLock=15;}
}
