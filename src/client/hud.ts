import {sectorOf} from '../sim/maps';
import {showDeployment,showDebrief} from './battlePlansView';
import { scales, TRAITS, WEATHER, type Scale, type Faction, type Company } from '../sim/arenaTypes';
import type { Lighting } from './renderer3d/lightingPresets';
import { ARMY, type SimWorld } from '../sim/world';
import { terrainText } from '../sim/maps';

const icons:Record<string,string>={
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    storm:'<path d="M6 16a5 5 0 0 1 .3-10 6 6 0 0 1 11 2 4 4 0 0 1 .7 8h-3m-5-3-2 5h4l-2 4"/>',
    fog:'<path d="M4 9h13M7 13h13M3 17h12M9 5h8"/>',
    restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',
    play:'<path d="m8 4 11 8-11 8Z" fill="currentColor"/>',
    home:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
    time:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    swords:'<path d="m4 3 3 1 11 13-2 2L4 6Zm16 0-3 1-5 6m-3 3-4 4 2 2 4-5M3 16l6 5m6 0 6-5M3 21l3-3m12 0 3 3"/>',
    pan:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4m-8 12 4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',
    camera:'<path d="M3 8h4l2-3h6l2 3h4v11H3Z"/><circle cx="12" cy="13" r="3.5"/>',
    replay:'<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/>'
};
const icon=(k:string)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[k]+'</svg>';
const laurel='<svg viewBox="0 0 60 56" aria-hidden="true"><defs><g id="sprig"><path d="M28 49C11 46 6 33 8 17" fill="none" stroke="currentColor"/><path d="M13 39Q5 39 3 32Q10 32 13 39M9 31Q2 28 3 22Q9 25 9 31M8 24Q4 18 7 12Q11 18 8 24M10 18Q9 12 14 8Q14 15 10 18M17 44Q9 46 5 41Q11 39 17 44M23 47Q16 52 10 48Q16 44 23 47M11 34Q10 27 15 24Q16 30 11 34M16 41Q13 34 18 31Q20 37 16 41M21 45Q19 39 23 36Q26 41 21 45"/></g></defs><g fill="currentColor"><use href="#sprig"/><use href="#sprig" transform="translate(60 0) scale(-1 1)"/></g><text x="30" y="36" fill="currentColor" text-anchor="middle" font-size="28" font-family="Georgia,serif" font-style="italic">N</text><path fill="currentColor" d="m24 10 2 4h8l2-4-4 2-2-5-2 5Z"/></svg>';
const flag=(f:number)=>'<i aria-hidden="true" class="flag '+(f?'british':'french')+'"></i>';
const LIGHT_LABEL:Record<Lighting,[string,string]>={golden:['sun','黄金斜阳'],storm:['storm','阴云血战'],fog:['fog','晨雾弥漫']};
export const formatTime=(ticks:number)=>{const s=Math.floor(ticks/30);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
export const payout=(p:number)=>Math.round(Math.min(5,Math.max(1.1,.94/Math.max(.01,p)))*20)/20;

export interface Purse {points:number;wins:number;losses:number;streak:number}
export interface Bet {side:Faction;stake:number;payout:number}
interface Controls {next:()=>void;zoom:(factor:number)=>void;jump:(x:number,y:number)=>void;scale:(n:Scale)=>void;light:()=>void;pause:()=>void;speed:(n:number)=>void;restart:()=>void;replay:()=>void;home:()=>void;auto:()=>void;bet:(side:Faction|-1,stake:number)=>void}

function roster(w:SimWorld,f:Faction){
    const n={line:0,guard:0,cav:0,guns:0};
    for(const c of w.companies)if(c.faction===f && c.line!==5){
        if(c.kind==='field_cannon')n.guns+=c.alive;else if(c.kind==='cuirassier')n.cav+=c.alive;else if(c.kind==='guard_grenadier')n.guard+=c.alive;else n.line+=c.alive;
    }
    return n;
}
export class Hud{
    private root:HTMLElement;private stakeAmount=25;private shownNews=0;private headlineUntil=0;
    private get(id:string){return this.root.querySelector<HTMLElement>('#'+id)!;}
    constructor(root:HTMLElement,private cb:Controls){
        this.root=root;
        root.innerHTML=`<header class="mast"><div class="insignia">${laurel}</div><div><h1>Napoléon <span>1815</span></h1><p>千军斗蛐蛐 · 押注观战</p></div></header>
        <section class="strength glass" aria-label="双方兵力"><div class="sides">
        <div class="army">${flag(0)}<span><b>法兰西帝国</b><small id="gen0"></small></span><strong id="fr">0</strong></div>
        <i class="crossed">${icon('swords')}</i>
        <div class="army east"><strong id="gb">0</strong><span><b>反法同盟</b><small id="gen1"></small></span>${flag(1)}</div></div>
        <div class="balance" title="仍在作战的兵力"><i id="ratio"></i></div>
        <div class="morale"><span><i id="m0"></i></span><em>士气</em><span class="east"><i id="m1"></i></span></div>
        <div class="odds"><span id="odds0"></span><em>战局天平</em><span id="odds1"></span></div>
        <div class="ledger"><span class="clock">${icon('time')}<time id="clock">00:00</time></span><span id="record"></span></div></section>
        <button id="mobile-settings" class="glass mobile-ctrl" aria-label="战场设置" aria-expanded="false">⚙</button>
        <button id="strength-toggle" class="mobile-ctrl" aria-label="展开兵力详情" aria-expanded="false"></button>
        <div class="zoom-panel glass"><button id="zoom-in" title="放大" aria-label="放大">＋</button><button id="zoom-out" title="缩小" aria-label="缩小">－</button></div>
        <nav class="controls glass" aria-label="战场控制">
        <div class="controlrow"><div class="segments" aria-label="总兵力">${scales.map(n=>`<button data-scale="${n}" title="总兵力 ${n}">${n}</button>`).join('')}</div>
        <button id="light" class="labeled"></button></div>
        <div class="controlrow playback"><button id="pause" class="square" aria-label="暂停"></button><div class="speeds">${[.25,1,2,4,8,16].map(n=>`<button data-speed="${n}">${n}×</button>`).join('')}</div><button id="restart" class="labeled" title="随机新战局 (R)">${icon('restart')}新战局</button></div>
        <div class="controlrow"><button id="next-event" class="labeled">跳至大事 »</button><button id="auto" class="labeled" title="自动导播：镜头跟随冲锋、溃败等关键时刻">${icon('camera')}<span></span></button><span id="purse" class="purse"></span></div></nav>
        <div id="headline" class="headline" hidden></div>
        <button id="major" class="major glass" aria-pressed="false">只看大事</button><div id="labels"></div><ol id="ticker" class="ticker" aria-live="polite"></ol>
        <div class="hint glass">${icon('pan')} 拖拽/WASD 移动 <b>·</b> 滚轮缩放 <b>·</b> 空格暂停 <b>·</b> R 新战局</div>
        <button id="home" class="home glass" title="回到交战中心 (Home)" aria-label="回到交战中心">${icon('home')}</button>
        <div id="intel" class="overlay" hidden><section class="intel-card glass" role="dialog" aria-labelledby="intel-title"></section></div>
        <div id="victory" class="overlay" hidden><section class="victory-card glass" role="dialog" aria-labelledby="victor"><div class="victory-mark">${laurel}</div><h2 id="victor"></h2><p id="reason" class="reason"></p>
        <dl><div><dt>交战时长</dt><dd id="duration"></dd></div><div><dt>法军伤亡/溃逃</dt><dd id="loss0"></dd></div><div><dt>联军伤亡/溃逃</dt><dd id="loss1"></dd></div></dl>
        <section id="analysis" class="battle-analysis"></section><p id="mvp" class="mvp"></p><p id="betresult" class="betresult"></p>
        <div class="actions"><button id="again">${icon('restart')}新战局</button><button id="replay" class="ghost">${icon('replay')}重演本局</button></div></section></div>`;
        this.get('zoom-in').onclick=()=>cb.zoom(.68);this.get('zoom-out').onclick=()=>cb.zoom(1/.68);
        this.get('next-event').onclick=cb.next;
        for(const [id,cls] of [['mobile-settings','settings-open'],['strength-toggle','strength-open']]){
            const b=this.get(id);b.onclick=()=>b.setAttribute('aria-expanded',String(root.classList.toggle(cls)));
        }
        const ticker=this.get('ticker');let y=0;
        ticker.addEventListener('touchstart',e=>{y=e.touches[0].clientY;},{passive:true});
        ticker.addEventListener('touchend',e=>{const dy=e.changedTouches[0].clientY-y;
            if(dy<-25)root.classList.add('news-open');else if(dy>25 && !ticker.scrollTop)root.classList.remove('news-open');
        },{passive:true});
        root.querySelectorAll<HTMLButtonElement>('[data-scale]').forEach(b=>b.onclick=()=>cb.scale(Number(b.dataset.scale) as Scale));
        root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b=>b.onclick=()=>cb.speed(Number(b.dataset.speed)));
        this.get('major').onclick=()=>{const b=this.get('major');const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));this.get('ticker').classList.toggle('major-only',on);};
        for(const [id,fn] of Object.entries({light:cb.light,pause:cb.pause,restart:cb.restart,again:cb.restart,replay:cb.replay,home:cb.home,auto:cb.auto}))this.get(id).onclick=fn;
    }
    controls(scale:Scale,light:Lighting,paused:boolean,speed:number,auto:boolean,purse:Purse,bet:Bet|null){
        this.root.querySelectorAll<HTMLButtonElement>('[data-scale],[data-speed]').forEach(b=>{
            b.setAttribute('aria-pressed',String(b.dataset.scale?Number(b.dataset.scale)===scale:Number(b.dataset.speed)===speed));
        });
        const [ic,label]=LIGHT_LABEL[light];this.get('light').innerHTML=icon(ic)+label;
        const p=this.get('pause');p.innerHTML=icon(paused?'play':'pause');p.setAttribute('aria-label',paused?'继续':'暂停');p.title=paused?'继续 (Space)':'暂停 (Space)';
        const a=this.get('auto');a.setAttribute('aria-pressed',String(auto));a.querySelector('span')!.textContent=auto?'自动导播 开':'自动导播 关';
        this.get('purse').innerHTML=`军饷 <b>${purse.points}</b>`+(bet?` · 押${bet.side?'联军':'法军'} ${bet.stake}`:'');
    }
    /** 开战前的情报卡：双方统帅、兵力、天气地形与赔率。 */
    intel(w:SimWorld,purse:Purse){
        const card=this.root.querySelector<HTMLElement>('.intel-card')!;
        const p0=w.openingOdds,odds=[payout(p0),payout(1-p0)];
        const side=(f:Faction)=>{
            const g=w.generals[f],r=roster(w,f),t=TRAITS[g.trait];
            return `<div class="side ${f?'east':''}"><h3>${flag(f)}${ARMY[f]}</h3>
            <p class="general"><b>${g.title}${g.name}</b><span class="trait">${t.label}</span></p><p class="trait-text">${t.text}</p>
            <ul><li><span>战列步兵</span><b>${r.line}</b></li><li><span>近卫军</span><b>${r.guard}</b></li><li><span>骑兵</span><b>${r.cav}</b></li><li><span>火炮</span><b>${r.guns} 门</b></li></ul>
            <p class="stance">${w.posture[f]==='attack'?'⚔ 主动进攻':'🛡 据守待敌'}</p>
            <button class="bet" data-side="${f}">押${f?'联军':'法军'} <b>×${odds[f].toFixed(2)}</b></button></div>`;
        };
        const stakes=[10,25,50,100].filter(s=>s<=purse.points);
        if(!stakes.includes(this.stakeAmount))this.stakeAmount=stakes[Math.min(1,stakes.length-1)]??purse.points;
        card.innerHTML=`<h2 id="intel-title">战前情报</h2>
        <p class="conditions"><span>${WEATHER[w.weather].label}</span>${esc(WEATHER[w.weather].text)}</p>
        <p class="conditions"><span>地形</span>${esc(terrainText(w.layout,['法军','联军']))}</p>
        <p class="conditions"><span>变数</span>战场之外或许还有援军在路上……</p>
        <div class="sides-intel">${side(0)}<div class="vs">VS</div>${side(1)}</div>
        <div class="stake"><span>军饷 <b>${purse.points}</b>　战绩 ${purse.wins} 胜 ${purse.losses} 负${purse.streak>1?`　连胜 ${purse.streak}`:''}</span>
        <span class="chips">下注 ${(stakes.length?stakes:[purse.points]).map(s=>`<button data-stake="${s}" aria-pressed="${s===this.stakeAmount}">${s}</button>`).join('')}</span></div>
        <button class="watch ghost" data-side="-1">不押注，直接观战</button>`;
        showDeployment(card,w);
        card.querySelectorAll<HTMLButtonElement>('[data-stake]').forEach(b=>b.onclick=()=>{
            this.stakeAmount=Number(b.dataset.stake);card.querySelectorAll('[data-stake]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
        });
        card.querySelectorAll<HTMLButtonElement>('[data-side]').forEach(b=>b.onclick=()=>this.cb.bet(Number(b.dataset.side) as Faction|-1,this.stakeAmount));
        this.get('intel').hidden=false;this.get('victory').hidden=true;
        this.root.classList.add('intel-open');this.root.classList.remove('victory-open');
        this.shownNews=0;this.get('ticker').innerHTML='';this.get('headline').hidden=true;
    }
    hideIntel(){this.get('intel').hidden=true;this.root.classList.remove('intel-open');}
    get intelOpen(){return !this.get('intel').hidden;}
    update(w:SimWorld,now:number){
        const alive=[this.get('fr'),this.get('gb')];
        alive.forEach((e,i)=>e.textContent=String(w.effective(i as Faction)));
        for(const f of [0,1] as const){
            const g=w.generals[f];this.get('gen'+f).textContent=(g.alive?'':'✝ ')+g.title+g.name;
            const m=w.armyMorale(f);const bar=this.get('m'+f);bar.style.width=Math.max(0,Math.min(100,m))+'%';bar.className=m<30?'low':m<45?'mid':'';
        }
        const e0=w.effective(0),e1=w.effective(1);
        this.get('ratio').style.width=(100*e0/Math.max(1,e0+e1))+'%';
        const p=w.odds();this.get('odds0').textContent=Math.round(p*100)+'%';this.get('odds1').textContent=Math.round((1-p)*100)+'%';
        this.get('clock').textContent=formatTime(w.winner!==null && w.endTick>=0?w.endTick:w.tick);
        const fledNow=w.fled[0]+w.fled[1]+w.routing(0)+w.routing(1);
        this.get('record').textContent=`阵亡 ${w.dead[0]+w.dead[1]}　·　溃逃 ${fledNow}`;
        if(w.news.length<this.shownNews)this.shownNews=0;
        if(w.news.length>this.shownNews){
            const list=this.get('ticker');
            for(const n of w.news.slice(this.shownNews)){
                if(n.weight<1)continue;
                const sector=['左翼','中央','右翼'][sectorOf(n.y,w.layout)];
                const category=sector+n.text.replace(/^.*?(?=拔出马刀|上刺刀|掉转马头|丢下火枪|在.*喝令下重整)/,'').split('，')[0];
                const prior=Array.from(list.children).find(el=>(el as HTMLElement).dataset.key===category && Number((el as HTMLElement).dataset.tick)>=n.tick-150 && el.classList.contains('f'+n.faction)) as HTMLElement|undefined;
                const li=prior??document.createElement('li');li.dataset.key=category;li.dataset.tick=String(n.tick);li.dataset.count=String(Number(li.dataset.count||0)+1);li.className='f'+n.faction+' w'+n.weight;
                li.innerHTML=`<time>${formatTime(n.tick)}</time><small class="sector-name">${sector}</small>${esc(n.text)}${Number(li.dataset.count)>1?" ×"+li.dataset.count:""}`;li.tabIndex=0;li.onclick=()=>this.cb.jump(n.x,n.y);li.onkeydown=e=>{if(e.key==="Enter")li.click()};list.prepend(li);
                if(n.weight>=3){const h=this.get('headline');h.textContent=n.text;h.className='headline f'+n.faction;h.hidden=false;this.headlineUntil=now+4200;}
            }
            while(list.children.length>32)list.lastElementChild!.remove();
            this.shownNews=w.news.length;
        }
        if(now>this.headlineUntil)this.get('headline').hidden=true;
    }
    victory(w:SimWorld,bet:Bet|null,delta:number,purse:Purse){
        const f=w.winner as Faction;
        this.get('victor').textContent=ARMY[f]+'胜利';
        this.get('reason').textContent=w.reason;
        this.get('duration').textContent=formatTime(w.endTick);
        this.get('loss0').textContent=`${w.dead[0]} / ${w.fled[0]+w.routing(0)}`;this.get('loss1').textContent=`${w.dead[1]} / ${w.fled[1]+w.routing(1)}`;
        let best:Company|null=null;for(const c of w.companies)if(c.line!==5 && (!best||c.kills>best.kills))best=c;
        this.get('mvp').innerHTML=best?`头号战功：<b>${esc(best.name)}</b>（${best.faction?'联军':'法军'}）歼敌 ${best.kills} 人`:'';
        this.get('betresult').innerHTML=bet?(delta>0?`<span class="won">押中了！赢得 ${delta} 军饷</span>`:`<span class="lost">押错了，输掉 ${-delta} 军饷</span>`)+`　余额 ${purse.points}`:'本局未押注';
        const pct=(v:number)=>Math.round(v*100)+'%', end=Math.max(1,w.tick);
        const sx=(tick:number)=>tick/end*360, sy=(v:number)=>84-v*80;
        const points=w.timeline.map(p=>sx(p.tick)+','+sy(p.odds)).join(' ');
        const name=(k:string)=>k==='decisive'?'决定性转折':'最大逆转';
        const causes=(p:typeof w.turningPoints[number])=>p.causes.map(n=>esc(n.text)).join(' · ')||'附近无重大战报';
        const marks=w.turningPoints.map(p=>`<g><title>${causes(p)}</title><path d="M${sx(p.tick)} 4v80" stroke="#b69c69"/><circle cx="${sx(p.tick)}" cy="${sy(p.to)}" r="3" fill="#ffcf77"/></g>`).join('');
        const ranked=[...w.companies].filter(c=>c.line!==5).sort((a,b)=>b.kills-a.kills || a.id-b.id);
        const worst=ranked.reduce((a,b)=>b.losses/b.peak>a.losses/a.peak?b:a);
        const rows=ranked.slice(0,3).map(c=>`<tr><td>${c.faction?'联':'法'} · ${esc(c.name)}</td><td>${c.kills}</td><td>${c.losses}</td><td>${c.routs}/${c.rallies}</td></tr>`).join('');
        const losses=['line_infantry','guard_grenadier','cuirassier','field_cannon'].map((kind,i)=>{
            const sides=[0,1].map(f=>{
                const units=w.units.filter(u=>u.faction===f && (u.kind===kind || (i===0 && u.kind==='bannerman')));
                return units.filter(u=>u.hp<=0 && !u.escaped).length+' / '+units.filter(u=>u.escaped || u.hp>0 && w.companies[u.company].status==='rout').length;
            });return '<tr><td>'+['步兵','近卫','骑兵','炮兵'][i]+'</td><td>'+sides.join('</td><td>')+'</td></tr>';
        }).join('');
        this.get('analysis').innerHTML=`<h3>法军胜率走势</h3><svg viewBox="0 0 360 90" aria-label="法军胜率随时间变化"><path d="M0 44h360" stroke="#aaa" stroke-dasharray="3 3"/><polyline fill="none" stroke="#84aed6" stroke-width="2" points="${points}"/>${marks}</svg>
            ${w.turningPoints.map(p=>`<p><b>${formatTime(p.tick)} · ${name(p.kind)}</b>　${pct(p.from)} → ${pct(p.to)}<br>${causes(p)}</p>`).join('')}
            <h3>战功榜</h3><table><thead><tr><th>连队</th><th>歼敌</th><th>阵亡</th><th>溃散/重整</th></tr></thead><tbody>${rows}</tbody></table>
            <p>伤亡率最高 · ${esc(worst.name)}（${worst.losses}/${worst.peak}）</p>
            <h3>阵亡 / 溃逃</h3><table><thead><tr><th>兵种</th><th>法军</th><th>联军</th></tr></thead><tbody>${losses}</tbody></table>`;
        showDebrief(this.get('analysis'),w);
        this.get('victory').hidden=false;this.root.classList.add('victory-open');
    }
    hideVictory(){this.get('victory').hidden=true;this.root.classList.remove('victory-open');}
}
