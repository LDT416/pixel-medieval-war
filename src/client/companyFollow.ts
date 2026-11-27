import type {SimWorld} from '../sim/world';
import type {ArenaRenderer3d} from './renderer3d/arenaRenderer3d';

export class CompanyFollow{
    private id=-1;
    private card=document.createElement('section');
    private name=document.createElement('b');
    private stats=document.createElement('p');
    private plot=document.createElement('canvas');
    private news=document.createElement('p');
    private history=new Map<number,number[]>();
    private sample=-1;private now=0;
    private trackedAt=-1;private layout:SimWorld['layout']|undefined;
    get selected(){return this.id;}
    constructor(private w:SimWorld,private arena:ArenaRenderer3d,canvas:HTMLCanvasElement){
        const close=document.createElement('button');close.textContent='×';close.title='结束跟随';close.onclick=()=>this.stop();
        this.card.className='company-follow glass';this.card.hidden=true;
        this.plot.width=180;this.plot.height=24;this.plot.setAttribute('aria-label','有效兵力随时间变化');
        this.card.append(close,this.name,this.stats,this.plot,this.news);document.querySelector('#hud')!.append(this.card);
        let down:{x:number;y:number;time:number}|null=null,pending:number|undefined;
        canvas.addEventListener('pointerdown',e=>{
            if(pending!==undefined){clearTimeout(pending);pending=undefined;down=null;return;}
            if(!e.isPrimary||e.button!==0){down=null;return;}
            down={x:e.clientX,y:e.clientY,time:e.timeStamp};
        });
        canvas.addEventListener('pointercancel',()=>{down=null;});
        canvas.addEventListener('pointerup',e=>{
            if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7||e.timeStamp-down.time>450){down=null;return;}
            down=null;const b=canvas.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
            pending=window.setTimeout(()=>{
                pending=undefined;if(this.arena.zoom>=900)return;
                let best=-1,radius=this.arena.mobileMode?24:19;
                for(const c of this.w.companies){
                    if(!c.alive||c.status==='gone')continue;
                    const p=this.arena.screen(c.x,c.y);if(Math.abs(p.z)>1)continue;
                    const d=Math.hypot((p.x+1)*b.width/2-x,(1-p.y)*b.height/2-y);
                    if(d<radius){best=c.id;radius=d;}
                }
                if(best>=0)this.start(best);
            },340);
        });
    }
    private start(id:number){
        this.id=id;this.trackedAt=this.arena.userAt;this.card.hidden=false;this.now=0;
        const c=this.w.companies[id];this.arena.focus(c.x,c.y,Math.min(115,this.arena.zoom));
    }
    private stop(){this.id=-1;this.card.hidden=true;}
    tick(time:number){
        const w=this.w;
        if(this.layout!==w.layout){this.layout=w.layout;this.stop();this.history.clear();this.sample=-1;}
        if(w.tick>=this.sample){
            this.sample=w.tick+300;
            for(const c of w.companies){
                let h=this.history.get(c.id);if(!h){h=[];this.history.set(c.id,h);}h.push(c.alive);
            }
        }
        if(this.id<0)return;
        if(w.ended||this.arena.userAt>this.trackedAt){this.stop();return;}
        const c=w.companies[this.id];if(!c)return;
        this.arena.focus(c.x,c.y);
        if(time<this.now)return;this.now=time+220;
        this.name.textContent=c.name;
        this.stats.textContent='兵力 '+c.alive+' / '+c.peak+'　士气 '+Math.round(c.morale)+'　歼敌 '+c.kills;
        const h=[...(this.history.get(c.id)??[]),c.alive],ctx=this.plot.getContext('2d')!;
        ctx.clearRect(0,0,180,24);ctx.strokeStyle='#e4c88b';ctx.lineWidth=1.75;ctx.beginPath();
        h.forEach((v,i)=>{const x=i*179/Math.max(1,h.length-1),y=22-20*v/Math.max(1,c.peak);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();
        let latest='';for(let i=w.news.length-1;i>=0;i--)if(w.news[i].text.includes(c.name)){latest=w.news[i].text;break;}
        this.news.textContent=latest;
    }
}
