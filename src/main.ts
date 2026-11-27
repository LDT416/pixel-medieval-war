import './style.css';
import { SimWorld } from './sim/world';
import { scales, TICKS, type Scale } from './sim/arenaTypes';
import { ArenaRenderer3d } from './client/renderer3d/arenaRenderer3d';
import type { Lighting } from './client/renderer3d/lightingPresets';
import { Hud } from './client/hud';

async function start(){
    const world=new SimWorld(),canvas=document.querySelector<HTMLCanvasElement>('#battlefield')!;
    const arena=await ArenaRenderer3d.create(canvas);
    let paused=false,speed=1,accumulator=0,climax=0,fps=0,frameCount=0,fpsTime=0,hudTime=0;
    const hud=new Hud(document.querySelector('#hud')!,{scale:setScale,light:()=>setLighting(arena.lighting==='golden'?'storm':'golden'),
        pause:toggle,speed:setSpeed,restart:()=>reset(world.scale),home:()=>arena.home(world)});
    function controls(){hud.controls(world.scale,arena.lighting,paused,speed);}
    function updateHud(){const s=arena.gore.stats;hud.update(world,s.landedCorpses,s.landedGore,world.winner!==null && climax>=1.8);}
    function reset(scale:Scale){world.reset(scale);arena.reset();paused=false;climax=accumulator=0;controls();updateHud();}
    function toggle(){paused=!paused;controls();}
    function setLighting(mode:Lighting){if(mode==='golden'||mode==='storm'){arena.setLighting(mode);controls();}}
    function setScale(n:number){if(scales.includes(n as Scale))reset(n as Scale);}
    function setSpeed(n:number){if(n===0){paused=true;controls();return;}if([.25,1,2].includes(n)){speed=n;paused=false;controls();}}
    window.addEventListener('keydown',e=>{
        if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
        if(e.code==='Space'){e.preventDefault();toggle();}
        else if(e.code==='KeyR')reset(world.scale);
        else if(e.code==='Home'){e.preventDefault();arena.home(world);}
    });
    const debug={getState:()=>({tick:world.tick,fps:Math.round(fps),drawCalls:arena.drawCalls,alive:[...world.alive],dead:[...world.dead],
        winner:world.winner,scale:world.scale,lighting:arena.lighting,activeSmoke:arena.smoke.count,...arena.gore.stats}),
        setScale,setLighting,setSpeed,restart:()=>reset(world.scale),panTo:(x:number,z:number)=>arena.panTo(x,z),zoomTo:(d:number)=>arena.zoomTo(d)};
    Object.assign(window,{__arenaDebug:debug});
    controls();updateHud();document.getElementById('notice')!.hidden=true;
    let last=performance.now();
    function frame(now:number){
        const elapsed=Math.max(0,(now-last)/1000);last=now;
        const real=Math.min(.12,elapsed);let dt=paused?0:real*speed;
        if(world.winner!==null){
            if(!paused){climax+=elapsed;dt=real*(climax<1.8?.3:1);}
            accumulator=0;
        }else{
            accumulator+=dt*TICKS;
            while(accumulator>=1 && world.winner===null){world.step();arena.events(world);accumulator--;}
            if(world.winner!==null)accumulator=0;
        }
        arena.render(world,real,dt,accumulator);
        fpsTime+=elapsed;frameCount++;
        if(fpsTime>=.5){fps=frameCount/fpsTime;fpsTime=frameCount=0;}
        hudTime+=elapsed;if(hudTime>.1){updateHud();hudTime=0;}
        requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange',()=>{last=performance.now();});
    requestAnimationFrame(frame);
}
start().catch((error:unknown)=>{
    console.error(error);const notice=document.getElementById('notice')!;
    notice.hidden=false;notice.textContent='战场加载失败 · '+(error instanceof Error?error.message:String(error));
});
