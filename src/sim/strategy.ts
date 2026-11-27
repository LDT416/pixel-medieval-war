import type { Soldier } from './arenaTypes';
import type { SimWorld } from './world';
import { HEIGHT, WIDTH } from './maps';
import { strike } from './combat';

export function advance(w: SimWorld, u: Soldier) {
    const gun = u.kind === 'field_cannon', horse = u.kind === 'cuirassier';
    let target: Soldier | undefined = w.units[u.target];
    // Stagger local searches across a company. Keep a valid target between searches.
    if ((w.tick + u.id) % 18 === 0) {
        let best = Infinity;
        w.hash.visit(u.x,u.y,gun ? 450 : 235, other => {
            if (other.faction === u.faction) return;
            const d = (other.x-u.x)**2+(other.y-u.y)**2;
            const score = horse && other.kind === 'field_cannon' ? d*.28 : d;
            if (score < best) { best=score; target=other; }
        });
    }
    const raiding=horse && u.id%4<2;
    if(raiding){
        const battery=w.front.batteryOnWing(u);
        if(battery)target=battery;
    }
    if (!target || target.hp<=0) target=w.front.opponent(u);
    u.vx=0; u.vy=0; u.moving=false;
    if (!target) { u.pose='stand'; return; }
    u.target=target.id;
    const dx=target.x-u.x, dy=target.y-u.y, distance=Math.max(.01,Math.hypot(dx,dy));
    if (Math.abs(dx)>2) u.face=Math.sign(dx);
    if (u.cooldown>0) u.cooldown--;
    if (!gun && (horse || u.kind==='bannerman' || distance<72 ||
        (u.kind==='guard_grenadier' && distance<245) || (w.tick>980 && distance<270))) u.charge=true;
    const range=gun ? 1140 : u.charge ? (horse ? 27 : 20) : 205+(u.company%4)*9;
    if (distance<=range) {
        const age=w.tick-u.firedAt;
        u.pose=u.charge?'thrust':gun && age<12?'recoil':u.cooldown>14?'load':'aim';
        if (!u.cooldown) strike(w,u,target,dx/distance,dy/distance);
        return;
    }
    // March in ranks until contact. Wing cavalry ride past the front before wheeling inward.
    const forward=(u.faction?-1:1);
    const flanking=horse && (u.x-2200)*forward<140 && Math.abs(dx)>270;
    const formed=!horse && Math.abs(dx)>390 && w.tick<620;
    const wingY=u.homeY+(raiding?(u.homeY<HEIGHT/2?-85:85):0);
    const goalY=flanking ? wingY : formed ? u.homeY*.90+target.y*.10 : target.y;
    const mx=flanking?forward*350:dx, my=goalY-u.y;
    const length=Math.max(1,Math.hypot(mx,my));
    const speed=u.speed*(u.charge && !horse ? 1.58 : 1);
    u.vx=speed*mx/length; u.vy=speed*my/length;
    // A distributed contact check prevents companies collapsing onto a single pixel.
    if (distance<300 && (w.tick+u.id)%4===0) {
        w.hash.visit(u.x,u.y,13,other=>{
            if (other.id===u.id) return;
            const sx=u.x-other.x, sy=u.y-other.y, d=Math.max(.2,Math.hypot(sx,sy));
            const repel=(13-d)*5;
            u.vx+=sx/d*repel; u.vy+=sy/d*repel;
        });
    }
    u.x=Math.min(WIDTH-1,Math.max(1,u.x+u.vx/30));
    u.y=Math.min(HEIGHT-1,Math.max(1,u.y+u.vy/30));
    u.moving=true; u.stride+=speed/30;
    u.pose=horse || u.charge?'run':'march';
}
