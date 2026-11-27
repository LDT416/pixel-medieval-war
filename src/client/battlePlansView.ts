import type {SimWorld} from '../sim/world';
import {paintMap,frontLine} from './renderer3d/campaignMap';
type Plan={mainEffort:number;feint:number;reserve:number[];destinations:{company:number;x:number;y:number}[];phases:{name:string;trigger:unknown;orders:unknown}[];breakthrough:number|null;reserveAt:number|null};
export function plansFor(w:SimWorld){return (w as SimWorld & {plans?:Plan[]}).plans??[];}
export function deploymentActive(w:SimWorld){return w.tick<((w as SimWorld & {deployEnd?:number}).deployEnd??0);}
const sectors=['左翼','中央','右翼'];
export function showDeployment(card:HTMLElement,w:SimWorld){
    const plans=plansFor(w);
    if(!plans.length || !deploymentActive(w))return;
    const details=document.createElement('details');details.className='deployment-chart';
    const heading=document.createElement('summary');heading.textContent='双方部署计划';details.append(heading);
    const canvas=document.createElement('canvas');canvas.width=800;canvas.height=280;canvas.setAttribute('aria-label','双方连队预定阵位');details.append(canvas);
    paintMap(canvas,w.layout,frontLine(w),false);
    const ctx=canvas.getContext('2d')!,x=canvas.width/w.layout.width,y=canvas.height/w.layout.height;
    for(const [f,p] of plans.entries())for(const dest of p.destinations){
        ctx.fillStyle=f?'#ab4439a6':'#294d7da6';ctx.strokeStyle=f?'#792e25':'#274268';ctx.lineWidth=1;
        ctx.fillRect(dest.x*x-4,dest.y*y-2.5,8,5);ctx.strokeRect(dest.x*x-4,dest.y*y-2.5,8,5);
    }
    const legend=document.createElement('p');legend.textContent=plans.map((p,f)=>(f?'联军':'法军')+'主攻'+sectors[p.mainEffort]).join('　·　');
    details.append(legend);card.querySelector('.sides-intel')?.before(details);
}
export function showDebrief(card:HTMLElement,w:SimWorld){
    const plans=plansFor(w);if(plans.length!==2)return;
    const heading=document.createElement('h3');heading.textContent='作战计划复盘';card.append(heading);
    for(const [f,p] of plans.entries()){
        const row=document.createElement('p'),reserve=p.reserveAt==null?'预备队未投入':'第 '+Math.floor(p.reserveAt/30)+' 秒投入预备队';
        row.textContent=(f?'联军':'法军')+'主攻'+sectors[p.mainEffort]+'，'+(p.breakthrough==null?'未记录突破':'实际突破'+sectors[p.breakthrough])+'。'+reserve+'。';
        card.append(row);
    }
}
