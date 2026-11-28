import './style.css';
import './client/mobileHud.css';
import {CompanyFollow} from './client/companyFollow';
import {BattleSound} from './client/battleSound';
import {TacticalMiniMap} from './client/tacticalMiniMap';
import { atlasPreview } from './client/renderer3d/spriteAtlas';
import type { News } from './sim/arenaTypes';
import { SimWorld } from './sim/world';
import { simulationScales, TICKS, type Scale, type Faction } from './sim/arenaTypes';
import { ArenaRenderer3d } from './client/renderer3d/arenaRenderer3d';
import { lightings, type Lighting } from './client/renderer3d/lightingPresets';
import { Hud, payout, type Purse, type Bet } from './client/hud';

const PURSE_KEY='napoleon-1815-purse';
function loadPurse():Purse{
    try{const p=JSON.parse(localStorage.getItem(PURSE_KEY)||'');if(p && p.points>0)return p;}catch{/* 首次游玩 */}
    return {points:100,wins:0,losses:0,streak:0};
}
const newSeed=()=>(Math.random()*2**32)>>>0;

async function start(){
    const params=new URLSearchParams(location.search);
    const world=new SimWorld(1200,Number(params.get('seed'))||newSeed()),canvas=document.querySelector<HTMLCanvasElement>('#battlefield')!;
    const arena=await ArenaRenderer3d.create(canvas);
    let paused=true,speed=1,accumulator=0,slowmo=0,fps=0,frameCount=0,fpsTime=0,hudTime=0;
    let skipping=false,skipFrom=0;
    let auto=true,focusUntil=0,lastFocusNews=0,hotX=world.frontline().x,hotY=world.frontline().y,settled=false;
    let priority=0,follow=-1,slowUntil=0;
    const queue:{n:News;p:number}[]=[];
    let purse=loadPurse(),bet:Bet|null=null;
    const hud=new Hud(document.querySelector('#hud')!,{zoom:f=>arena.zoomBy(f),next:()=>{
        if(hud.intelOpen || world.ended)return;
        skipFrom=world.news.length;setSpeed(4);skipping=true;
    },jump:(x,y)=>{arena.userAt=performance.now();arena.focus(x,y,95);},scale:setScale,light:cycleLighting,pause:toggle,speed:setSpeed,
        restart:()=>reset(world.scale,newSeed()),replay:()=>reset(world.scale,world.seed),home:()=>{arena.userAt=performance.now();arena.home(world);},
        auto:()=>{auto=!auto;controls();},bet:placeBet});
    const miniMap=new TacticalMiniMap(document.querySelector('#hud')!,arena);
    arena.tracers.installControl();const sound=new BattleSound(arena);
    const companyFollow=new CompanyFollow(world,arena,canvas);
    const skipDeployment=document.createElement('button');
    skipDeployment.type='button';skipDeployment.className='labeled';skipDeployment.textContent='跳过部署';
    document.querySelector('#hud nav.controls')?.append(skipDeployment);
    let deploymentPlayback=false;
    skipDeployment.onclick=()=>{
        if(hud.intelOpen || world.tick>=world.deployEnd)return;
        while(world.tick<world.deployEnd)world.step();
        deploymentPlayback=false;accumulator=0;controls();
    };
    function controls(){
        skipDeployment.hidden=hud.intelOpen || world.tick>=world.deployEnd;
        hud.controls(world.scale,arena.lighting,paused,deploymentPlayback?4:speed,auto,purse,bet);
    }
    function reset(scale:Scale,seed:number){
        deploymentPlayback=false;skipping=false;world.reset(scale,seed);arena.reset();
        arena.setLighting(world.weather==='rain'?'storm':world.weather==='fog'?'fog':'golden');
        paused=true;slowmo=accumulator=0;settled=false;priority=0;follow=-1;slowUntil=0;queue.length=0;document.body.classList.remove('commander-down');bet=null;lastFocusNews=0;focusUntil=0;
        const p=world.frontline();hotX=p.x;hotY=p.y;arena.focus(p.x,p.y,330);
        const url=new URL(location.href);url.searchParams.set('seed',String(seed));history.replaceState(null,'',url);
        hud.intel(world,purse);controls();hud.update(world,performance.now());
    }
    function placeBet(side:Faction|-1,stake:number){
        if(side!==-1 && stake>0 && stake<=purse.points){
            const p=world.openingOdds;bet={side,stake,payout:payout(side?1-p:p)};
        }
        hud.hideIntel();
        if(innerWidth<=600 && innerHeight>innerWidth && !sessionStorage.getItem('1815-orientation')){
            sessionStorage.setItem('1815-orientation','1');const tip=document.createElement('div');tip.className='orientation-tip glass';tip.textContent='横屏观战效果更佳';document.body.append(tip);setTimeout(()=>tip.remove(),3200);
        }
        sound.onBattleStart(side);
        deploymentPlayback=world.tick<world.deployEnd;paused=false;arena.focus(hotX,hotY,210);controls();
    }
    function settle(){
        if(settled||world.winner===null)return;settled=true;
        let delta=0;
        if(bet){
            const won=bet.side===world.winner;
            delta=won?Math.round(bet.stake*(bet.payout-1)):-bet.stake;
            purse.points+=delta;purse.streak=won?purse.streak+1:0;if(won)purse.wins++;else purse.losses++;
            if(purse.points<=0)purse={...purse,points:100};
            localStorage.setItem(PURSE_KEY,JSON.stringify(purse));
        }
        hud.victory(world,bet,delta,purse);controls();
    }
    function toggle(){if(hud.intelOpen)return;paused=!paused;controls();}
    function cycleLighting(){arena.setLighting(lightings[(lightings.indexOf(arena.lighting)+1)%lightings.length]);controls();}
    function setLighting(mode:Lighting){if(lightings.includes(mode)){arena.setLighting(mode);controls();}}
    function setScale(n:number){if(simulationScales.includes(n as Scale))reset(n as Scale,world.seed);}
    function setSpeed(n:number){deploymentPlayback=false;skipping=false;if(n===0){paused=true;controls();return;}if([.25,1,2,4].includes(n)){speed=n;if(!hud.intelOpen)paused=false;controls();}}
    window.addEventListener('keydown',e=>{
        if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
        if(e.code==='Space'){e.preventDefault();if(hud.intelOpen)placeBet(-1,0);else toggle();}
        else if(e.code==='KeyR')reset(world.scale,newSeed());
        else if(e.code==='Home'){e.preventDefault();arena.userAt=performance.now();arena.home(world);}
    });
    /** 自动导播：大事件推近镜头，平时跟着伤亡最集中的地方走。 */
    function director(now:number){
        for(const e of world.events)if(e.type==='death'){hotX+=(e.x-hotX)*.03;hotY+=(e.y-hotY)*.03;}
        while(lastFocusNews<world.news.length){
            const n=world.news[lastFocusNews++];
            const p=/全军震动|全线崩溃/.test(n.text)?6:/近卫军.*(出击|退却)|预备队从/.test(n.text)?5:/兑现了诺言|终于赶到/.test(n.text)?4:/全面崩溃/.test(n.text)?3:/马刀|撞进|七零八落/.test(n.text)?2:/上刺刀/.test(n.text)?1:0;
            if(p)queue.push({n,p});
        }
        for(let i=queue.length-1;i>=0;i--)if(queue[i].n.tick<world.tick-300)queue.splice(i,1);
        if(companyFollow.selected>=0 || !auto || paused || now-arena.userAt<8000)return;
        queue.sort((a,b)=>b.p-a.p || a.n.tick-b.n.tick);
        if(queue.length && (now>=focusUntil || queue[0].p>priority)){
            const {n,p}=queue.shift()!;priority=p;follow=-1;
            focusUntil=now+(p===2?4000:3500);
            if(/全军震动/.test(n.text)){slowUntil=now+1200;document.body.classList.add('commander-down');}
            if(p===2)follow=world.companies.find(c=>n.text.startsWith(c.name))?.id??-1;
            arena.focus(n.x,n.y,p===6?70:p===3?160:p===2?110:125);return;
        }
        if(now<focusUntil && follow>=0){const c=world.companies[follow];arena.focus(c.x,c.y);return;}
        if(now>=focusUntil){follow=-1;priority=0;}
        if(now>focusUntil){focusUntil=now+1200;arena.focus(hotX,hotY,Math.max(170,Math.min(260,arena.zoom)));}
    }
    const debug={atlas:()=>atlasPreview().toDataURL(),getState:()=>({tick:world.tick,jitter:world.jitter,camera:arena.cameraInfo,fps:Math.round(fps),drawCalls:arena.drawCalls,tracers:arena.tracers.stats,chargeDrums:sound.drums,following:companyFollow.selected,alive:[...world.alive],dead:[...world.dead],fled:[...world.fled],
        winner:world.winner,ended:world.ended,seed:world.seed,weather:world.weather,scale:world.scale,lighting:arena.lighting,activeSmoke:arena.smoke.count,
        odds:world.odds(),morale:[world.armyMorale(0),world.armyMorale(1)],news:world.news.length,...arena.gore.stats}),
        setScale,setLighting,setSpeed,restart:()=>reset(world.scale,newSeed()),replay:(seed:number)=>reset(world.scale,seed),startBattle:()=>placeBet(-1,0),
        world,stepFrames:(n:number)=>{
            if(!paused || !Number.isFinite(n))return;
            for(let i=0;i<Math.min(15000,n) && !world.ended;i++){world.step();arena.events(world);arena.advanceEffects(world,1/TICKS);}
            if(world.ended)settle();
            hud.update(world,performance.now());
        },panTo:(x:number,z:number)=>{arena.userAt=performance.now();arena.panTo(x,z);},zoomTo:(d:number)=>{arena.userAt=performance.now();arena.zoomTo(d);}};
    Object.assign(window,{__arenaDebug:debug});
    reset(arena.mobileMode?1200:2400,world.seed);document.getElementById('notice')!.hidden=true;
    let last=performance.now();
    function frame(now:number){
        const elapsed=Math.max(0,(now-last)/1000);last=now;
        const real=Math.min(.2,elapsed);let dt=paused?0:real*(deploymentPlayback?4:speed);
        if(world.winner!==null && !world.ended && !paused){slowmo+=elapsed;if(slowmo<1.8)dt=real*.3;}
        if(now<slowUntil && !paused)dt=real*.3;else document.body.classList.remove("commander-down");
        if(!world.ended){
            accumulator+=dt*TICKS;
            const stepLimit=Math.min(8,Math.ceil(speed*2)+1);
            const catchUpDeadline=performance.now()+1000/60;
            let steps=0;
            while(accumulator>=1 && !world.ended && steps<stepLimit){world.step();arena.events(world);sound.step(world);director(now);accumulator--;steps++;
                if(world.tick===world.deployEnd){deploymentPlayback=false;accumulator=0;controls();break;}
                if(skipping && world.news.length>skipFrom){
                    const event=world.news.slice(skipFrom).find(n=>n.weight>=2);skipFrom=world.news.length;
                    if(event){setSpeed(1);arena.focus(event.x,event.y,110);accumulator=0;break;}
                }
                if(accumulator>=1 && performance.now()>=catchUpDeadline)break;
            }
            if(world.ended)accumulator=0;
            else if(accumulator>=1)accumulator%=1;
        }
        if(world.ended)settle();
        companyFollow.tick(now);director(now);sound.update(real,paused||hud.intelOpen||(world.ended&&world.winner===null),world);
        arena.render(world,real,world.ended?real:dt,accumulator);
        fpsTime+=elapsed;frameCount++;
        if(fpsTime>=.5){fps=frameCount/fpsTime;arena.observeFps(fps);fpsTime=frameCount=0;}
        hudTime+=elapsed;if(hudTime>.15){hud.update(world,now);miniMap.update(world);hudTime=0;
            const host=document.getElementById('labels')!;
            host.replaceChildren();
            if(arena.zoom<90 && !world.ended && !hud.intelOpen){
                const near=world.companies.filter(c=>c.alive && c.status!=='gone').map(c=>({c,p:arena.screen(c.x,c.y)})).filter(({p})=>Math.abs(p.x)<.97 && Math.abs(p.y)<.92 && Math.abs(p.z)<1 && p.y<.62).sort((a,b)=>a.p.x*a.p.x+a.p.y*a.p.y-b.p.x*b.p.x-b.p.y*b.p.y).slice(0,12);
                for(const {c,p} of near){const el=document.createElement('span');el.textContent=(c.status==='rout'?'↩ ':c.formation==='square'?'□ ':c.order==='charge'?'⚔ ':'')+c.name;
                    el.style.left=(p.x+1)*50+'%';el.style.top=(1-p.y)*50+'%';el.style.setProperty('--morale',c.morale+'%');host.append(el);}
            }}
        requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange',()=>{last=performance.now();});
    requestAnimationFrame(frame);
}
start().catch((error:unknown)=>{
    console.error(error);const notice=document.getElementById('notice')!;
    notice.hidden=false;notice.textContent='战场加载失败 · '+(error instanceof Error?error.message:String(error));
});
