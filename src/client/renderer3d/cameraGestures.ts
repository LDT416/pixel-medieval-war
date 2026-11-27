type Point={x:number;y:number};
interface GestureCamera {
    distance:()=>number;
    clampZoom:(d:number)=>number;
    zoom:(d:number)=>void;
    move:(x:number,z:number)=>void;
    touch:()=>void;
}
/** 平面与屏幕射线的交点相对相机注视点的偏移（场景单位）。 */
export function groundOffset(nx:number,ny:number,d:number,aspect:number){
    const angle=39*Math.PI/180, f=Math.tan(14*Math.PI/180);
    const t=d*Math.sin(angle)/(Math.sin(angle)-ny*f*Math.cos(angle));
    return {x:t*nx*f*aspect,z:d*Math.cos(angle)+t*(-Math.cos(angle)-ny*f*Math.sin(angle))};
}
export class CameraGestures{
    private fingers=new Map<number,Point>();
    private initial:Point|null=null;
    private lastTap:{p:Point;time:number}|null=null;
    private lastMove=0;
    private velocity={x:0,z:0};
    private multi=false;
    constructor(private canvas:HTMLCanvasElement,private camera:GestureCamera){
        canvas.addEventListener('pointerdown',this.down);
        canvas.addEventListener('pointermove',this.move);
        canvas.addEventListener('pointerup',e=>this.release(e,false));
        canvas.addEventListener('pointercancel',e=>this.release(e,true));
        canvas.addEventListener('lostpointercapture',e=>this.release(e,true));
        canvas.addEventListener('contextmenu',e=>e.preventDefault());
        canvas.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
        canvas.addEventListener('wheel',e=>{
            e.preventDefault();camera.touch();
            this.zoomAt({x:e.clientX,y:e.clientY},camera.distance()*Math.exp(Math.sign(e.deltaY)*Math.min(.3,Math.abs(e.deltaY)*.0018)));
        },{passive:false});
    }
    private offset(p:Point,d:number){
        const b=this.canvas.getBoundingClientRect();
        return groundOffset((p.x-b.left)/b.width*2-1,1-(p.y-b.top)/b.height*2,d,b.width/b.height);
    }
    private zoomAt(at:Point,next:number){
        const d=this.camera.clampZoom(next),a=this.offset(at,this.camera.distance()),b=this.offset(at,d);
        this.camera.move(a.x-b.x,a.z-b.z);this.camera.zoom(d);
    }
    private pair(){
        const [a,b]=this.fingers.values();
        return b?{p:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},span:Math.hypot(a.x-b.x,a.y-b.y)}:{p:a,span:0};
    }
    private down=(e:PointerEvent)=>{
        if(e.button!==0 && e.button!==2)return;
        this.camera.touch();const p={x:e.clientX,y:e.clientY};
        this.fingers.set(e.pointerId,p);this.canvas.setPointerCapture(e.pointerId);
        this.initial=this.fingers.size===1?p:null;this.multi=this.fingers.size>1;
        this.velocity={x:0,z:0};this.lastMove=e.timeStamp;this.canvas.classList.add('dragging');
    };
    private move=(e:PointerEvent)=>{
        if(!this.fingers.has(e.pointerId))return;
        const prev=this.pair();this.fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=this.pair();
        const d=this.camera.distance(),zoom=next.span>2&&prev.span>2?this.camera.clampZoom(d*prev.span/next.span):d;
        const from=this.offset(prev.p,d),to=this.offset(next.p,zoom);
        const dx=from.x-to.x,dz=from.z-to.z;
        const dt=Math.max(8,e.timeStamp-this.lastMove)/1000;
        this.velocity={x:dx/dt,z:dz/dt};this.lastMove=e.timeStamp;
        this.camera.touch();this.camera.move(dx,dz);this.camera.zoom(zoom);
    };
    private release(e:PointerEvent,cancel:boolean){
        if(!this.fingers.delete(e.pointerId))return;
        if(this.fingers.size){this.initial=null;this.velocity={x:0,z:0};return;}
        this.canvas.classList.remove('dragging');
        const p={x:e.clientX,y:e.clientY};
        if(!cancel && !this.multi && this.initial && Math.hypot(p.x-this.initial.x,p.y-this.initial.y)<7){
            if(this.lastTap && e.timeStamp-this.lastTap.time<340 && Math.hypot(p.x-this.lastTap.p.x,p.y-this.lastTap.p.y)<32){
                const delta=this.offset(p,this.camera.distance());this.camera.move(delta.x,delta.z);
                this.camera.zoom(this.camera.clampZoom(this.camera.distance()*.58));this.lastTap=null;
            }else this.lastTap={p,time:e.timeStamp};
            this.velocity={x:0,z:0};
        }
        if(cancel || this.multi || e.timeStamp-this.lastMove>75)this.velocity={x:0,z:0};
        this.multi=false;this.initial=null;
    }
    update(dt:number){
        if(this.fingers.size || Math.hypot(this.velocity.x,this.velocity.z)<.08)return;
        const fade=Math.exp(-12*dt),travel=(1-fade)/12;
        this.camera.move(this.velocity.x*travel,this.velocity.z*travel);
        this.velocity.x*=fade;this.velocity.z*=fade;
    }
}
