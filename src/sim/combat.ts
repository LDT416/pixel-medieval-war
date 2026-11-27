import type { Soldier, BattleEvent } from './arenaTypes';
import type { SimWorld } from './world';

function emit(w: SimWorld,type: BattleEvent['type'],u: Soldier,dx:number,dy:number,explosive:boolean,x=u.x,y=u.y) {
    w.events.push({type,x,y,dx,dy,explosive,unitId:u.id,kind:u.kind,faction:u.faction});
}
function damage(w:SimWorld,u:Soldier,amount:number,dx:number,dy:number,explosive=false) {
    if (u.hp<=0) return;
    u.hp=Math.max(0,u.hp-amount); u.hitAt=w.tick;
    emit(w,'hit',u,dx,dy,explosive);
    if (!u.hp) {
        u.moving=false; u.vx=0; u.vy=0;
        w.alive[u.faction]--; w.dead[u.faction]++;
        emit(w,'death',u,dx,dy,explosive);
    }
}
export function strike(w:SimWorld,u:Soldier,t:Soldier,dx:number,dy:number) {
    u.firedAt=w.tick;
    if (u.kind==='field_cannon') {
        u.pose='recoil'; u.cooldown=w.rng.int(155,215);
        // Prefer the most occupied of a few nearby cells for a battery's point of aim.
        let tx=t.x,ty=t.y,best=-1;
        for (let i=0;i<4;i++) {
            const x=t.x+w.rng.int(-45,45), y=t.y+w.rng.int(-40,40);
            let n=0; w.hash.visit(x,y,37,v=>{if(v.faction!==u.faction)n++;});
            if(n>best){best=n;tx=x;ty=y;}
        }
        w.rounds.push({x:u.x,y:u.y,tx,ty,age:0,duration:Math.max(5,Math.ceil(Math.hypot(tx-u.x,ty-u.y)/42)),gun:u});
        emit(w,'fire',u,dx,dy,true); return;
    }
    if (u.charge) {
        emit(w,'slash',u,dx,dy,false);
        damage(w,t,w.rng.int(32,u.kind==='cuirassier'?100:72),dx,dy);
        u.cooldown=w.rng.int(26,50);
    } else {
        u.pose='aim'; emit(w,'fire',u,dx,dy,false);
        if (w.rng.next()<.79) damage(w,t,w.rng.int(65,124),dx,dy);
        // Company beats keep adjacent firing ranks in loose volleys.
        u.cooldown=80-((w.tick+u.company*7)%26)+w.rng.int(0,12);
    }
}
export function resolveRounds(w:SimWorld) {
    for (let i=w.rounds.length-1;i>=0;i--) {
        if (!w.alive[0] || !w.alive[1]) break;
        const r=w.rounds[i]; if (++r.age<r.duration) continue;
        emit(w,'impact',r.gun,0,0,true,r.tx,r.ty);
        w.hash.visit(r.tx,r.ty,51,u=>{
            if(u.faction===r.gun.faction)return;
            const dx=u.x-r.tx,dy=u.y-r.ty,d=Math.max(1,Math.hypot(dx,dy));
            damage(w,u,155-d*1.9,dx/d,dy/d,true);
        });
        w.rounds.splice(i,1);
    }
}
