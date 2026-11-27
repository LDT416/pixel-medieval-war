import {BattleAudio} from './audio';
import type {SimWorld} from '../sim/world';
import type {ArenaRenderer3d} from './renderer3d/arenaRenderer3d';

export class BattleSound {
    private audio=new BattleAudio();
    private activity=0;
    private unlocked=false;
    get drums(){return this.audio.signalCount;}
    constructor(private arena:ArenaRenderer3d){
        const button=document.createElement('button');
        button.type='button';button.id='battle-sound';button.className='labeled';
        const refresh=()=>{
            button.textContent=this.audio.muted?'声音 · 关':'声音 · 开';
            button.setAttribute('aria-label',this.audio.muted?'打开战场声音':'静音');
            button.setAttribute('aria-pressed',String(!this.audio.muted));
        };
        this.audio.setMuted(localStorage.getItem('1815-sound')==='off');refresh();
        const unlock=()=>{
            if(!this.unlocked && !this.audio.muted && typeof AudioContext!=='undefined'){
                this.audio.unlock();this.unlocked=true;
            }
        };
        window.addEventListener('pointerdown',unlock,{capture:true});
        window.addEventListener('keydown',unlock,{capture:true});
        button.onclick=()=>{
            this.audio.setMuted(!this.audio.muted);localStorage.setItem('1815-sound',this.audio.muted?'off':'on');
            unlock();refresh();
        };
        document.querySelector('#tracer-mode')?.after(button);
        document.addEventListener('visibilitychange',()=>{
            if(document.hidden)this.audio.environment(0,0);
        });
    }
    step(w:SimWorld){
        if(!this.unlocked||this.audio.muted)return;
        const ear=this.arena.cameraInfo;
        if(w.events.length){this.audio.play(w.events,ear);this.activity+=w.events.filter(e=>e.type==='fire'||e.type==='impact').length;}
        if(w.tick%10===0 && ear.distance<300){
            const horse=w.companies.find(c=>c.alive&&c.kind==='cuirassier'&&Math.hypot(c.vx,c.vy)>5&&Math.hypot(c.x-ear.x,c.y-ear.y)<600);
            if(horse)this.audio.play([{type:'hoof',x:horse.x,y:horse.y}],ear);
        }
        if(w.tick%30===0){
            for(const c of w.companies)if(c.kind==='cuirassier'&&c.order==='charge'&&w.tick-c.chargeAt<30)
                this.audio.play([{type:'horn',x:c.x,y:c.y}],ear);
        }
    }
    update(dt:number,paused:boolean){
        this.activity*=Math.exp(-dt*2);
        this.audio.environment(this.arena.zoom,paused||document.hidden?0:this.activity);
    }
}
