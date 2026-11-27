import './style.css';
import { SimWorld } from './sim/world';
import { scales, TICKS, type Scale, type Faction } from './sim/arenaTypes';
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
    let auto=true,focusUntil=0,lastFocusNews=0,hotX=world.frontline().x,hotY=world.frontline().y,settled=false;
    let purse=loadPurse(),bet:Bet|null=null;
    const hud=new Hud(document.querySelector('#hud')!,{scale:setScale,light:cycleLighting,pause:toggle,speed:setSpeed,
        restart:()=>reset(world.scale,newSeed()),replay:()=>reset(world.scale,world.seed),home:()=>{arena.userAt=performance.now();arena.home(world);},
        auto:()=>{auto=!auto;controls();},bet:placeBet});
    function controls(){hud.controls(world.scale,arena.lighting,paused,speed,auto,purse,bet);}
    function reset(scale:Scale,seed:number){
        world.reset(scale,seed);arena.reset();
        arena.setLighting(world.weather==='rain'?'storm':world.weather==='fog'?'fog':'golden');
        paused=true;slowmo=accumulator=0;settled=false;bet=null;lastFocusNews=0;focusUntil=0;
        const p=world.frontline();hotX=p.x;hotY=p.y;arena.focus(p.x,p.y,330);
        history.replaceState(null,'','?seed='+seed);
        hud.intel(world,purse);controls();hud.update(world,performance.now());
    }
    function placeBet(side:Faction|-1,stake:number){
        if(side!==-1 && stake>0 && stake<=purse.points){
            const p=world.openingOdds;bet={side,stake,payout:payout(side?1-p:p)};
        }
        hud.hideIntel();paused=false;arena.focus(hotX,hotY,210);controls();
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
    function setScale(n:number){if(scales.includes(n as Scale))reset(n as Scale,world.seed);}
    function setSpeed(n:number){if(n===0){paused=true;controls();return;}if([.25,1,2,4].includes(n)){speed=n;if(!hud.intelOpen)paused=false;controls();}}
    window.addEventListener('keydown',e=>{
        if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
        if(e.code==='Space'){e.preventDefault();if(hud.intelOpen)placeBet(-1,0);else toggle();}
        else if(e.code==='KeyR')reset(world.scale,newSeed());
        else if(e.code==='Home'){e.preventDefault();arena.userAt=performance.now();arena.home(world);}
    });
    /** 自动导播：大事件推近镜头，平时跟着伤亡最集中的地方走。 */
    function director(now:number){
        for(const e of world.events)if(e.type==='death'){hotX+=(e.x-hotX)*.03;hotY+=(e.y-hotY)*.03;}
        if(!auto || paused || now-arena.userAt<8000)return;
        for(let i=world.news.length-1;i>=0 && world.news[i].tick>lastFocusNews;i--){
            const n=world.news[i];
            if(n.weight>=2 && now>focusUntil-2500){
                lastFocusNews=n.tick;focusUntil=now+(n.weight>=3?6000:4200);
                arena.focus(n.x,n.y,n.weight>=3?105:135);return;
            }
        }
        if(now>focusUntil){focusUntil=now+1200;arena.focus(hotX,hotY,Math.max(170,Math.min(260,arena.zoom)));}
    }
    const debug={getState:()=>({tick:world.tick,fps:Math.round(fps),drawCalls:arena.drawCalls,alive:[...world.alive],dead:[...world.dead],fled:[...world.fled],
        winner:world.winner,ended:world.ended,seed:world.seed,weather:world.weather,scale:world.scale,lighting:arena.lighting,activeSmoke:arena.smoke.count,
        odds:world.odds(),morale:[world.armyMorale(0),world.armyMorale(1)],news:world.news.length,...arena.gore.stats}),
        setScale,setLighting,setSpeed,restart:()=>reset(world.scale,newSeed()),replay:(seed:number)=>reset(world.scale,seed),startBattle:()=>placeBet(-1,0),
        world,panTo:(x:number,z:number)=>{arena.userAt=performance.now();arena.panTo(x,z);},zoomTo:(d:number)=>{arena.userAt=performance.now();arena.zoomTo(d);}};
    Object.assign(window,{__arenaDebug:debug});
    reset(1200,world.seed);document.getElementById('notice')!.hidden=true;
    let last=performance.now();
    function frame(now:number){
        const elapsed=Math.max(0,(now-last)/1000);last=now;
        const real=Math.min(.2,elapsed);let dt=paused?0:real*speed;
        if(world.winner!==null && !world.ended && !paused){slowmo+=elapsed;if(slowmo<1.8)dt=real*.3;}
        if(!world.ended){
            accumulator+=dt*TICKS;
            let steps=0;
            while(accumulator>=1 && !world.ended && steps<12){world.step();arena.events(world);director(now);accumulator--;steps++;}
            if(world.ended)accumulator=0;
        }
        if(world.ended)settle();
        director(now);
        arena.render(world,real,world.ended?real:dt,accumulator);
        fpsTime+=elapsed;frameCount++;
        if(fpsTime>=.5){fps=frameCount/fpsTime;fpsTime=frameCount=0;}
        hudTime+=elapsed;if(hudTime>.15){hud.update(world,now);hudTime=0;}
        requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange',()=>{last=performance.now();});
    requestAnimationFrame(frame);
}
start().catch((error:unknown)=>{
    console.error(error);const notice=document.getElementById('notice')!;
    notice.hidden=false;notice.textContent='战场加载失败 · '+(error instanceof Error?error.message:String(error));
});
