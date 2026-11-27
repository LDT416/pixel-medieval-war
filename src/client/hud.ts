import { scales, type Scale } from '../sim/arenaTypes';
import type { Lighting } from './renderer3d/lightingPresets';
import type { SimWorld } from '../sim/world';

const icons:Record<string,string>={
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    storm:'<path d="M6 16a5 5 0 0 1 .3-10 6 6 0 0 1 11 2 4 4 0 0 1 .7 8h-3m-5-3-2 5h4l-2 4"/>',
    restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',
    play:'<path d="m8 4 11 8-11 8Z" fill="currentColor"/>',
    home:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
    time:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    swords:'<path d="m4 3 3 1 11 13-2 2L4 6Zm16 0-3 1-5 6m-3 3-4 4 2 2 4-5M3 16l6 5m6 0 6-5M3 21l3-3m12 0 3 3"/>',
    pan:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4m-8 12 4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>'
};
const icon=(k:string)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[k]+'</svg>';
const laurel='<svg viewBox="0 0 60 56" aria-hidden="true"><defs><g id="sprig"><path d="M28 49C11 46 6 33 8 17" fill="none" stroke="currentColor"/><path d="M13 39Q5 39 3 32Q10 32 13 39M9 31Q2 28 3 22Q9 25 9 31M8 24Q4 18 7 12Q11 18 8 24M10 18Q9 12 14 8Q14 15 10 18M17 44Q9 46 5 41Q11 39 17 44M23 47Q16 52 10 48Q16 44 23 47M11 34Q10 27 15 24Q16 30 11 34M16 41Q13 34 18 31Q20 37 16 41M21 45Q19 39 23 36Q26 41 21 45"/></g></defs><g fill="currentColor"><use href="#sprig"/><use href="#sprig" transform="translate(60 0) scale(-1 1)"/></g><text x="30" y="36" fill="currentColor" text-anchor="middle" font-size="28" font-family="Georgia,serif" font-style="italic">N</text><path fill="currentColor" d="m24 10 2 4h8l2-4-4 2-2-5-2 5Z"/></svg>';
const flag=(f:number)=>'<i aria-hidden="true" class="flag '+(f?'british':'french')+'"></i>';
export const formatTime=(ticks:number)=>{const s=Math.floor(ticks/30);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
interface Controls {scale:(n:Scale)=>void;light:()=>void;pause:()=>void;speed:(n:number)=>void;restart:()=>void;home:()=>void}
export class Hud{
    private root:HTMLElement;
    private alive:HTMLElement[];private bar:HTMLElement;private record:HTMLElement;private clock:HTMLElement;private overlay:HTMLElement;
    private get(id:string){return this.root.querySelector<HTMLElement>('#'+id)!;}
    constructor(root:HTMLElement,cb:Controls){
        this.root=root;
        root.innerHTML=`<header class="mast"><div class="insignia">${laurel}</div><div><h1>Napoléon <span>1815</span></h1><p>草原千军斗蛐蛐</p></div></header>
        <section class="strength glass" aria-label="双方兵力"><div class="sides">
        <div class="army">${flag(0)}<span>法兰西帝国</span><strong id="fr">600</strong></div>
        <i class="crossed">${icon('swords')}</i>
        <div class="army east"><strong id="gb">600</strong><span>不列颠联合</span>${flag(1)}</div></div>
        <div class="balance"><i id="ratio"></i></div>
        <div class="ledger"><span class="clock">${icon('time')}<time id="clock">00:00</time></span><span id="record"></span></div></section>
        <nav class="controls glass" aria-label="战场控制">
        <div class="controlrow"><div class="segments" aria-label="总兵力">${scales.map(n=>`<button data-scale="${n}" title="总兵力 ${n}">${n}</button>`).join('')}</div>
        <button id="light" class="labeled"></button></div>
        <div class="controlrow playback"><button id="pause" class="square" aria-label="暂停"></button><div class="speeds">${[.25,1,2].map(n=>`<button data-speed="${n}">${n}×</button>`).join('')}</div><button id="restart" class="labeled">${icon('restart')}重新开战</button></div></nav>
        <div class="hint glass">${icon('pan')} 拖拽/WASD 移动视角 <b>·</b> 滚轮缩放 <b>·</b> 空格暂停 <b>·</b> R 重开</div>
        <button id="home" class="home glass" title="回到交战中心 (Home)" aria-label="回到交战中心">${icon('home')}</button>
        <div id="victory" hidden><section class="victory-card glass" role="dialog" aria-labelledby="victor"><div class="victory-mark">${laurel}</div><h2 id="victor"></h2>
        <dl><div><dt>交战时长</dt><dd id="duration"></dd></div><div><dt>总伤亡</dt><dd id="casualties"></dd></div><div><dt>炮击残片落地</dt><dd id="landed"></dd></div></dl><button id="again">${icon('restart')}再来一局</button></section></div>`;
        this.alive=[this.get('fr'),this.get('gb')];this.clock=this.get('clock');this.record=this.get('record');this.bar=this.get('ratio');this.overlay=this.get('victory');
        root.querySelectorAll<HTMLButtonElement>('[data-scale]').forEach(b=>b.onclick=()=>cb.scale(Number(b.dataset.scale) as Scale));
        root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b=>b.onclick=()=>cb.speed(Number(b.dataset.speed)));
        for(const [id,fn] of Object.entries({light:cb.light,pause:cb.pause,restart:cb.restart,again:cb.restart,home:cb.home}))this.get(id).onclick=fn;
    }
    controls(scale:Scale,light:Lighting,paused:boolean,speed:number){
        this.root.querySelectorAll<HTMLButtonElement>('[data-scale],[data-speed]').forEach(b=>{
            b.setAttribute('aria-pressed',String(b.dataset.scale?Number(b.dataset.scale)===scale:Number(b.dataset.speed)===speed));
        });
        this.get('light').innerHTML=icon(light==='golden'?'sun':'storm')+(light==='golden'?'黄金斜阳':'阴云血战');
        const p=this.get('pause');p.innerHTML=icon(paused?'play':'pause');p.setAttribute('aria-label',paused?'继续':'暂停');p.title=paused?'继续 (Space)':'暂停 (Space)';
    }
    update(w:SimWorld,corpses:number,gore:number,show:boolean){
        this.alive.forEach((e,i)=>e.textContent=String(w.alive[i]));this.bar.style.width=(100*w.alive[0]/(w.alive[0]+w.alive[1]))+'%';
        this.clock.textContent=formatTime(w.tick);this.record.textContent='伤亡 '+(w.dead[0]+w.dead[1])+'　·　遗体 '+corpses+'　·　残片 '+gore;
        if(show && w.winner!==null){
            this.get('victor').textContent=(w.winner?'不列颠联合':'法兰西帝国')+'胜利';
            this.get('duration').textContent=formatTime(w.tick);this.get('casualties').textContent=String(w.dead[0]+w.dead[1]);this.get('landed').textContent=String(gore);
        }
        if(show && this.overlay.hidden)this.get('again').tabIndex=0;
        this.overlay.hidden=!show;
    }
}
