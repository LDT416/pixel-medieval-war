import {boardActions} from './units/weapons';
import {artillery as isArtillery, guard as isGuard, mounted as isMounted, standard as isStandard} from './units/abilities';
import type { Soldier, BattleEvent, Company, Round } from './arenaTypes';
import type { SimWorld } from './world';
import { WIDTH, HEIGHT, behindCrest } from './maps';

import {RANGE} from './scale';
export const MUSKET=RANGE.effective,CANISTER=RANGE.scatter;
export const gunRange = (w: SimWorld) => w.weather === 'fog' ? 1350 : RANGE.round;
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export function emit(w: SimWorld, type: BattleEvent['type'], u: Soldier, dx: number, dy: number, explosive: boolean, x = u.x, y = u.y) {
    const e:BattleEvent={type,x,y,dx,dy,explosive,unitId:u.id,kind:u.kind,faction:u.faction};
    w.events.push(e);return e;
}
/** 士气打击。士气是这场斗蛐蛐的核心：大部分连队不是被杀光，而是被吓跑。 */
export function shake(c: Company, amount: number) {
    if (c.status === 'gone') return;
    c.morale = Math.max(0, c.morale - amount);
}
export function damage(w: SimWorld, u: Soldier, amount: number, dx: number, dy: number, explosive: boolean, by: Company | null) {
    if (u.hp <= 0) return false;


    u.hp = Math.max(0, u.hp - amount); u.hitAt = w.tick;
    emit(w, 'hit', u, dx, dy, explosive);
    if (u.hp > 0) return false;
    u.diedAt=w.tick;u.moving = false; u.vx = 0; u.vy = 0;
    w.alive[u.faction]--; w.dead[u.faction]++;
    emit(w, 'death', u, dx, dy, explosive);
    const c = w.companies[u.company];
    c.ammo-=u.ammo;c.alive--;c.losses++;if(!c.alive){c.order='hold';c.forced=-1;}
    const lost = 1 - c.alive / c.peak;
    shake(c, (isArtillery(c) ? 70 : isGuard(c) ? 62 : 95) / Math.max(6, c.peak) * (1 + lost * 1.4));
    if (isStandard(u) && --c.colors === 0 && c.alive > 3) {
        shake(c, 12);
        if (isGuard(c) || (w.tick > 900 && w.rng.next() < .2)) w.say(`${c.name}的军旗倒下了`, c.faction, u.x, u.y, 1);
    }
    if (by && by.faction!==u.faction) by.kills++;
    if (u.general) w.generalDown(u,explosive?'炮弹':'骑兵');
    return true;
}
/** 首轮齐射后切换到排或翼射击。每名射手独立保留装填与弹药状态。 */
export function volley(w:SimWorld,c:Company,t:Company,close=false){
    if(c.ammo<=0 || c.status==='rout')return;
    const first=c.firingSince<0, age=w.tick-c.firingSince;
    const mode=first?'first':c.status==='shaken'||age>2700?'free':c.faction===1 && c.id%3===0?'platoon':'rank';
    const groups=mode==='platoon'?4:c.ranks;
    const dx=t.x-c.x,dy=t.y-c.y,side=-dx*c.hy+dy*c.hx;
    const facing=(dx*c.hx+dy*c.hy)/Math.max(1,Math.hypot(dx,dy));
    const canTurn=(u:Soldier)=>!close || facing>=.5 || (facing<-.707 ? u.slot>=Math.max(0,c.capacity-c.files) : (side>0 ? u.slot%c.files>=c.files/2 : u.slot%c.files<c.files/2));
    const shooters=c.members.filter(u=>u.hp>0 && u.ammo>0 && !u.moving && u.loadedAt<=w.tick && u.fireAt<=w.tick &&
        (c.formation!=='column' || u.slot<c.files*2) && canTurn(u));
    const groupOf=(u:Soldier)=>mode==='platoon'?Math.min(3,Math.floor(u.slot%c.files*4/c.files)):Math.floor(u.slot/c.files)%c.ranks;
    let group=c.nextGroup%groups;
    if(shooters.length && !shooters.some(u=>groupOf(u)===group))group=groupOf(shooters[0]);
    const ready=shooters.filter(u=>first || mode==='free' || groupOf(u)===group);
    if(!ready.length){c.reloadAt=w.tick+6;return;}
    if(!close && !first && mode==='rank' && !shooters.some(u=>groupOf(u)!==group) && c.members.some(u=>u.hp>0 && u.ammo>0 && groupOf(u)!==group && (c.formation!=='column'||u.slot<c.files*2)) && w.tick-c.firstVolleyAt>110){
        c.reloadAt=w.tick+6;return;
    }
    c.fireMode=mode;c.target=t.id;c.volleys++;
    if(first){c.firingSince=w.tick;c.firstVolleyAt=w.tick;}
    const cycle=Math.round(82*(isGuard(c)?.9:1)*(1+.15*c.fatigue+(w.weather==='rain'?.15:0)));
    for(const u of ready){
        u.fireAt=w.tick+1+(mode==='free'?w.rng.int(0,35):(u.slot%c.files)%5);
        u.shotTarget=t.id;
        if(close){u.fireAt=-1;shoot(w,u,c);}
    }
    for(const u of c.members){
        const rank=Math.floor(u.slot/c.files)%c.ranks;
        if((first && rank===0)||(!first && rank<group))u.kneelUntil=w.tick+10;
    }
    c.nextGroup=(group+1)%groups;c.reloadAt=w.tick+(first?cycle:mode==='free'?15:Math.max(12,Math.round(cycle/groups)));
    t.underFire=w.tick+90;
    const losing=c.losses>Math.max(1,c.kills)*1.3;
    shake(c,.08*(losing?1.5:1));shake(t,.20*(t.formation==='column'?.7:1)*(t.losses>Math.max(1,t.kills)*1.3?1.5:1));
}
export function shoot(w:SimWorld,u:Soldier,c:Company){
    const t=w.companies[u.shotTarget];
    if(!t || t.status==='gone' || c.status==='rout' || u.moving || u.ammo<=0 || c.assaultStage==='rush')return;
    u.ammo--;c.ammo--;u.shotsFired++;
    u.loadedAt=w.tick+Math.round(w.rng.int(75,90)*(isGuard(c)?.9:1)*(1+.15*c.fatigue+(w.weather==='rain'?.15:0)+(u.shotsFired>15?.15:0)));
    c.smoke=Math.min(1,c.smoke+.04);
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.max(1, Math.hypot(dx, dy));
    u.firedAt = w.tick; u.pose = 'aim';
    if (w.weather === 'rain' && w.rng.next() < .3) return;
    const fire=emit(w, 'fire', u, dx / d, dy / d, false);
    // A game action selects a board cell. Its occupant is read only when the marker expires.
    const at=w.boardShots.place(w,u,'musket',t.x+w.rng.int(-110,110),t.y+w.rng.int(-110,110),w.tick+boardActions.musket.flashTicks);
    fire.endX=at.x;fire.endY=at.y;
}
/** 白刃战一击。骑兵砍阵线如切菜，撞方阵则寸步难行。 */
export function strike(w: SimWorld, u: Soldier, foe: Soldier) {
    const c = w.companies[u.company], fc = w.companies[foe.company];
    const dx = foe.x - u.x, dy = foe.y - u.y, d = Math.max(1, Math.hypot(dx, dy));
    emit(w, 'slash', u, dx / d, dy / d, false);
    let dmg = isMounted(u) ? w.rng.int(45, 120) : w.rng.int(28, 78);
    if (isMounted(u) && fc.formation === 'square' && fc.formUntil <= w.tick && fc.status !== 'rout') dmg *= .28;
    if (fc.status === 'rout') dmg *= 1.6;
    if (isGuard(u)) dmg *= 1.2;
    if (c.status === 'shaken') dmg *= .75;
    damage(w, foe, dmg, dx / d, dy / d, false, c);
    u.cooldown = w.rng.int(22, 44);
    u.firedAt = w.tick;
}

export function gunFire(w: SimWorld, g: Soldier, c: Company, t: Company) {
    const d = dist(g, t);
    g.pose = 'recoil';
    if (d < CANISTER) {
        g.firedAt=w.tick;emit(w,'fire',g,(t.x-g.x)/Math.max(1,d),(t.y-g.y)/Math.max(1,d),true);
        w.boardShots.place(w,g,'scatter',t.x+w.rng.int(-48,48),t.y+w.rng.int(-48,48),w.tick+boardActions.scatter.flashTicks);
        g.cooldown=w.rng.int(210,270);
        return;
    }
    const aim = t;
    if(g.aimTarget!==t.id || Math.hypot(t.x-g.aimX,t.y-g.aimY)>150){
        g.aimTarget=t.id;g.aimX=t.x;g.aimY=t.y;g.shotsOnTarget=0;
        g.rangeError=(w.rng.next()<.5?-1:1)*w.rng.int(120,260)*(w.weather==='fog'?2:1);
    }
    for(const o of c.members)if(o.hp>0 && o.shotsOnTarget>0 && o.aimTarget===t.id && Math.hypot(t.x-o.aimX,t.y-o.aimY)<=150 && Math.abs(o.rangeError)<Math.abs(g.rangeError))g.rangeError=o.rangeError;
    const lx=(t.x-g.x)/d, ly=(t.y-g.y)/d;
    const lateral=(w.rng.next()+w.rng.next()-1)*(14+d*.03)*(g.shotsOnTarget<2?1.8:1);
    // 少数游戏弹道越过原目标；落点始终根据这枚弹的方向生成，不查询后排单位的位置。
    const longMiss=w.rng.next()<.22;
    const offset=g.rangeError+(longMiss?w.rng.int(560,1600):0);
    const ax=aim.x+lx*offset-ly*lateral, ay=aim.y+ly*offset+lx*lateral;
    const dd=Math.max(1,Math.hypot(ax-g.x,ay-g.y)),dx=(ax-g.x)/dd,dy=(ay-g.y)/dd;
    const tx=ax,ty=ay;
    let roll=(w.weather==='rain'?100:280)*(longMiss?2.2:1);

    g.firedAt=w.tick;g.rangeError*=w.weather==='fog'?.7:.55;g.shotsOnTarget++;
    if (behindCrest(ax, ay, t.faction)){
        roll*=.3;
        if(w.tick-([...w.news].reverse().find(n=>n.text.includes('炮弹砸在山脊'))?.tick??-1000)>900)w.say('炮弹砸在山脊上，没能弹过去',g.faction,ax,ay,1);
    }
    w.boardShots.place(w,g,'round',tx,ty,w.tick+Math.max(6,Math.ceil(dd/60))-1);
    w.rounds.push({ x: g.x, y: g.y, tx, ty, dx, dy, age: 0, duration: Math.max(6, Math.ceil(dd / 60)), roll, rolled: 0, speed: 24,
        gun: g, faction: g.faction, company: c.id });
    emit(w, 'fire', g, dx, dy, true);
    g.cooldown = w.rng.int(210,270);
}
export function roundPosition(r: Round, alpha = 0) {
    if (r.age + alpha < r.duration) {
        const t = Math.min(1, (r.age + alpha) / r.duration);
        return { x: r.x + (r.tx - r.x) * t, y: r.y + (r.ty - r.y) * t, h: 8 * t * (1 - t) + .5 };
    }
    const s = Math.min(r.roll, r.rolled + r.speed * alpha);
    return { x: r.tx + r.dx * s, y: r.ty + r.dy * s, h: .25 + Math.abs(Math.sin(s * .035)) * 1.1 * (1 - s / Math.max(1, r.roll)) };
}
export function resolveRounds(w: SimWorld) {
    for (let i = w.rounds.length - 1; i >= 0; i--) {
        const r = w.rounds[i];
        r.age++;
        if (r.age < r.duration) continue;
        if (r.age === r.duration) emit(w, 'impact', r.gun, r.dx, r.dy, true, r.tx, r.ty);
        const step = Math.min(r.speed, r.roll - r.rolled);
        r.rolled += step; r.speed *= .985;
        const px = r.tx + r.dx * r.rolled, py = r.ty + r.dy * r.rolled;
        if(Math.floor(r.rolled/120)>Math.floor((r.rolled-step)/120))emit(w,'bounce',r.gun,r.dx,r.dy,true,px,py);
        if (r.rolled >= r.roll || r.speed < 5 || px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) w.rounds.splice(i, 1);
    }
}
