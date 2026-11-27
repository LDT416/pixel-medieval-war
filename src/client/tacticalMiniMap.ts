import {CAPTURE_TICKS} from '../sim/campaignObjectives';
import type {SimWorld} from '../sim/world';
import type {ArenaRenderer3d} from './renderer3d/arenaRenderer3d';

export class TacticalMiniMap {
    private canvas=document.createElement('canvas');
    private wrap=document.createElement('aside');
    private button=document.createElement('button');
    private ctx:CanvasRenderingContext2D;
    private objectives=document.createElement('div');
    private legend=document.createElement('div');
    private mapWidth=1;private mapHeight=1;
    constructor(root:HTMLElement,private arena:ArenaRenderer3d){
        this.wrap.className='tactical-map glass';this.wrap.setAttribute('aria-label','战区小地图');
        this.button.type='button';this.button.className='map-toggle';this.button.textContent='战区图';this.button.title='展开或收起小地图';
        this.wrap.classList.toggle('collapsed',arena.mobileMode);this.button.setAttribute('aria-expanded',String(!arena.mobileMode));
        this.button.onclick=()=>this.button.setAttribute('aria-expanded',String(!this.wrap.classList.toggle('collapsed')));
        this.canvas.width=320;this.canvas.height=160;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','点击或拖动小地图移动视野');
        this.ctx=this.canvas.getContext('2d')!;this.objectives.className='map-vps';this.wrap.append(this.button,this.canvas,this.objectives);root.append(this.wrap);
        this.legend.className='map-legend glass';this.legend.textContent='× 步兵　／ 骑兵　● 火炮　♛ 近卫　◇ 据点　✉ 传令　▤ 补给';this.legend.hidden=true;root.append(this.legend);
        const jump=(x:number,y:number)=>{const b=this.canvas.getBoundingClientRect();this.arena.viewPoint(Math.max(0,Math.min(1,(x-b.left)/b.width))*this.mapWidth,Math.max(0,Math.min(1,(y-b.top)/b.height))*this.mapHeight);};
        this.canvas.onpointerdown=e=>{this.canvas.setPointerCapture(e.pointerId);jump(e.clientX,e.clientY);};
        this.canvas.onpointermove=e=>{if(this.canvas.hasPointerCapture(e.pointerId))jump(e.clientX,e.clientY);};
        this.canvas.onkeydown=e=>{
            const dx=Number(e.key==='ArrowRight')-Number(e.key==='ArrowLeft'),dy=Number(e.key==='ArrowDown')-Number(e.key==='ArrowUp');
            if(dx||dy){e.preventDefault();e.stopPropagation();const view=arena.cameraInfo;arena.viewPoint(view.x+dx*this.mapWidth*.07,view.y+dy*this.mapHeight*.07);}
        };
    }
    update(w:SimWorld){
        this.mapWidth=w.layout.width;this.mapHeight=w.layout.height;this.legend.hidden=this.arena.zoom<300;
        if(this.wrap.classList.contains('collapsed'))return;
        const ctx=this.ctx,W=this.canvas.width,H=this.canvas.height,sx=W/this.mapWidth,sy=H/this.mapHeight;
        ctx.drawImage(this.arena.mapSheet,0,0,W,H);
        for(const c of w.companies){
            if(!c.alive||c.status==='gone')continue;
            ctx.fillStyle=c.faction?'#8c2925':'#234b83';ctx.fillRect(Math.round(c.x*sx)-1,Math.round(c.y*sy)-1,3,3);
        }
        for(const v of w.logistics.wagons)if(!v.destroyed){
            ctx.fillStyle=v.faction?'#823a32':'#324e73';
            ctx.fillRect(v.x*sx-3,v.y*sy-2,6,4);ctx.fillStyle='#eadfab';ctx.fillRect(v.x*sx-2,v.y*sy-.5,4,1);
        }
        for(const rider of w.logistics.couriers){
            const x=rider.x*sx,y=rider.y*sy;ctx.fillStyle='#fff1bb';ctx.strokeStyle=rider.faction?'#823a32':'#324e73';
            ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+3,y+2);ctx.lineTo(x-3,y+2);ctx.closePath();ctx.fill();ctx.stroke();
        }
        ctx.save();ctx.strokeStyle='#fff9dc';ctx.lineWidth=2;ctx.shadowColor='#282824';ctx.shadowBlur=2;ctx.beginPath();
        this.arena.visiblePolygon.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.closePath();ctx.stroke();ctx.restore();
        const objectives=w.layout.objectives;
        const claims=objectives.flatMap(p=>{
            const claim=w.objectives.claim(p.id);
            return claim?[p.name+' '+(claim.faction?'联':'法')+' '+Math.ceil((CAPTURE_TICKS-claim.ticks)/30)+'秒']:[];});
        const totals=([0,1] as const).map(f=>{
            const controlled=objectives.filter(p=>p.owner===f).length;
            const ticks=objectives.reduce((s,p)=>s+(p.heldTicks[f]||0),0);
            return (f?'联':'法')+' '+controlled+'◇ · '+Math.floor(ticks/30)+'秒';
        }).join('　');
        this.objectives.textContent=claims.length?claims.join('　'):totals;
        this.objectives.title=objectives.map(p=>p.name+' · 法 '+Math.floor(p.heldTicks[0]/30)+' / 联 '+Math.floor(p.heldTicks[1]/30)+' 秒').join('\n');
    }
}
