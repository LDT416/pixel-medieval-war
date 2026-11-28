import {artillery as isArtillery, guard as isGuard, mounted as isMounted, standard as isStandard} from './units/abilities';
import type { Soldier, BattleEvent, Company, Round } from './arenaTypes';
import type { SimWorld } from './world';
import { WIDTH, HEIGHT, behindCrest } from './maps';
import { cavalryImpactMult } from './cavalry';

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
export function damage(w: SimWorld, u: Soldier, amount: number, dx: number, dy: number, explosive: boolean, by: Company | null, fromMelee = false) {
    if (u.hp <= 0) return false;
    // H2：火力或突袭命中炮位时，70% 打死一名炮手（crew - 1），30% 打在炮身上扣血
    if (isArtillery(u) && u.crew > 0) {
        if (w.rng.next() < 0.7) {
            u.crew = Math.max(0, u.crew - 1);
            u.hitAt = w.tick;
            emit(w, 'hit', u, dx, dy, explosive);
            const c = w.companies[u.company];
            shake(c, 4.2);
            if (u.crew === 0) {
                w.artilleryStats.silencedGuns++;
                w.say(`${c.name}一门火炮的炮组全部阵亡，陷入哑火`, c.faction, u.x, u.y, 1);
            }
            return false;
        }
    }

    u.hp = Math.max(0, u.hp - amount); u.hitAt = w.tick;
    emit(w, 'hit', u, dx, dy, explosive);
    if (u.hp > 0) return false;
    u.diedAt=w.tick;u.moving = false; u.vx = 0; u.vy = 0;
    w.alive[u.faction]--; w.dead[u.faction]++;
    emit(w, 'death', u, dx, dy, explosive);
    const c = w.companies[u.company];
    c.ammo-=u.ammo;c.alive--;c.losses++;c.recentLosses.push(w.tick);if(!c.alive){c.order='hold';c.forced=-1;}
    const lost = 1 - c.alive / c.peak;
    shake(c, (isArtillery(c) ? 42 : isGuard(c) ? 32 : 40) / Math.max(6, c.peak) * (1 + lost * 1.05));
    if (isStandard(u) && --c.colors === 0 && c.alive > 3) {
        shake(c, 12);
        if (isGuard(c) || (w.tick > 900 && w.rng.next() < .2)) w.say(`${c.name}的军旗倒下了`, c.faction, u.x, u.y, 1);
    }
    if (by && by.faction!==u.faction) by.kills++;
    if (u.general) w.generalDown(u,explosive?'炮弹':'骑兵');
    return true;
}
/** 营级齐射窗口：同一批射手严格落在同一个 3 tick 窗口内开火（无随机延迟）。 */
export function battalionFireWindow(w: SimWorld, c: Company, t: Company, shooters: Soldier[], mode: Company['fireMode'], battalionId: number, guardFirstVolley: boolean) {
    if (!shooters.length || c.ammo <= 0 || c.status === 'rout') return;
    c.fireMode = mode;
    c.target = t.id;
    c.volleys++;
    if (c.firingSince < 0) { c.firingSince = w.tick; c.firstVolleyAt = w.tick; }
    for (const u of shooters) {
        u.fireAt = mode === 'free' ? w.tick + 1 : w.tick + 1 + (u.slot % 3);
        u.shotTarget = t.id;
    }
    t.underFire = w.tick + 90;
    const losing = c.losses > Math.max(1, c.kills) * 1.3;
    shake(c, 0.06 * (losing ? 1.5 : 1));
    shake(t, (guardFirstVolley ? 0.30 : 0.16) * (t.formation === 'column' ? 0.7 : 1) * (t.losses > Math.max(1, t.kills) * 1.3 ? 1.5 : 1));
    if (battalionId >= 0) {
        const b = w.battalions[battalionId];
        if (b) c.smoke = Math.max(c.smoke, b.smoke);
    }
}
/** 散兵线自由射击（轻步兵 / 来复枪兵）：各自瞄准、自由开火。 */
export function skirmishFire(w: SimWorld, c: Company) {
    if (c.ammo <= 0 || c.status === 'rout' || c.formation !== 'skirmish') return;
    const isRifle = c.variant === 'rifles';
    const effRange = isRifle ? RANGE.effective * 1.5 : RANGE.effective;
    // 选最近且可见的敌连；来复枪兵优先炮兵和军官在场的连
    let best: Company | null = null, bestScore = Infinity;
    for (const o of w.companies) {
        if (o.faction === c.faction || o.alive <= 0 || o.status === 'gone' || o.line === 5) continue;
        const d = dist(c, o);
        if (d > effRange || !w.sight.canSee(w, c, o)) continue;
        if (d > 260 && behindCrest(o.x, o.y, o.faction)) continue;
        let s = d;
        if (isRifle && isArtillery(o)) s *= 0.65;
        if (o.status === 'rout') s *= 1.6;
        if (s < bestScore) { bestScore = s; best = o; }
    }
    if (!best) { c.reloadAt = w.tick + 12; return; }
    const ready = c.members.filter(u => u.hp > 0 && u.ammo > 0 && !u.moving && u.loadedAt <= w.tick && u.fireAt <= w.tick);
    if (!ready.length) { c.reloadAt = w.tick + 6; return; }
    c.fireMode = 'free'; c.target = best.id;
    if (c.firingSince < 0) { c.firingSince = w.tick; c.firstVolleyAt = w.tick; }
    for (const u of ready) {
        u.fireAt = w.tick + 1;
        u.shotTarget = best.id;
    }
    for (const u of c.members) {
        if (Math.floor(u.slot / Math.max(1, c.files)) === 0) u.kneelUntil = w.tick + 10;
    }
    best.underFire = w.tick + 60;
    c.reloadAt = w.tick + 10;
}
/** 首轮齐射后切换到排或列射击。删除 2700 帧自动转自由射击与 rng(0,35) 随机延迟。 */
export function volley(w:SimWorld,c:Company,t:Company,close=false){
    if(c.ammo<=0 || c.status==='rout')return;
    // 近卫掷弹兵沉着射击：首轮齐射前 > 600px 不开火（非近距冲锋齐射）
    if(isGuard(c) && !close && c.firingSince<0 && dist(c,t)>600)return;
    // 射击纪律：目标连里混着己方士兵（正在白刃或骑兵冲进去了），整连不向它开火。
    let mixed=false;const reach=Math.max(40,t.files*7+20);
    w.hash.visit(t.x,t.y,reach,o=>{if(!mixed&&o.faction===c.faction)mixed=true;});
    if(mixed){w.ballistics.discipline.heldFire++;c.reloadAt=w.tick+15;return;}
    const first=c.firingSince<0;
    const lowAmmo=c.ammo < Math.max(1, c.peak * 40) * 0.25;
    const mode=first?'first':(c.status==='shaken'||lowAmmo||c.formation==='square'||c.formation==='skirmish')?'free':c.faction===1?'platoon':'rank';
    const groups=mode==='platoon'?2:c.ranks;
    const dx=t.x-c.x,dy=t.y-c.y,side=-dx*c.hy+dy*c.hx;
    const facing=(dx*c.hx+dy*c.hy)/Math.max(1,Math.hypot(dx,dy));
    // 方阵只有朝向敌人的那几面开火，不能隔着方阵内部打到对面的自己人。
    const faceToward=(u:Soldier)=>c.formation!=='square' || ((u.x-c.x)*dx+(u.y-c.y)*dy)/Math.max(1,Math.hypot(u.x-c.x,u.y-c.y)*Math.hypot(dx,dy))>.45;
    const canTurn=(u:Soldier)=>!close || facing>=.5 || (facing<-.707 ? u.slot>=Math.max(0,c.capacity-c.files) : (side>0 ? u.slot%c.files>=c.files/2 : u.slot%c.files<c.files/2));
    const shooters=c.members.filter(u=>u.hp>0 && u.ammo>0 && !u.moving && u.loadedAt<=w.tick && u.fireAt<=w.tick &&
        (c.formation!=='column' || u.slot<c.files*2) && canTurn(u) && faceToward(u));
    const groupOf=(u:Soldier)=>mode==='platoon'?Math.min(1,Math.floor(u.slot%c.files*2/c.files)):Math.floor(u.slot/c.files)%c.ranks;
    let group=c.nextGroup%groups;
    if(shooters.length && !shooters.some(u=>groupOf(u)===group))group=groupOf(shooters[0]);
    const ready=shooters.filter(u=>first || mode==='free' || groupOf(u)===group);
    if(!ready.length){c.reloadAt=w.tick+6;return;}
    if(!close && !first && mode==='rank' && !shooters.some(u=>groupOf(u)!==group) && c.members.some(u=>u.hp>0 && u.ammo>0 && groupOf(u)!==group && (c.formation!=='column'||u.slot<c.files*2)) && w.tick-c.firstVolleyAt>110){
        c.reloadAt=w.tick+6;return;
    }
    c.fireMode=mode;c.target=t.id;c.volleys++;
    if(first){c.firingSince=w.tick;c.firstVolleyAt=w.tick;}
    const cycle=Math.round(86*(isGuard(c)?.9:1)*(1+.15*c.fatigue+(w.weather==='rain'?.15:0)));
    for(const u of ready){
        u.fireAt=mode==='free'?w.tick+1:w.tick+1+(u.slot%3);
        u.shotTarget=t.id;
        if(close){u.fireAt=-1;shoot(w,u,c);}
    }
    for(const u of c.members){
        const rank=Math.floor(u.slot/c.files)%c.ranks;
        if((first && rank===0)||(!first && rank<group))u.kneelUntil=w.tick+12;
    }
    c.nextGroup=(group+1)%groups;c.reloadAt=w.tick+(first?cycle:mode==='free'?12:Math.max(12,Math.round(cycle/groups)));
    t.underFire=w.tick+90;
    const losing=c.losses>Math.max(1,c.kills)*1.3;
    shake(c,.06*(losing?1.5:1));shake(t,.18*(t.formation==='column'?.7:1)*(t.losses>Math.max(1,t.kills)*1.3?1.5:1));
}
/** 选一名瞄准对象：来复枪兵优先瞄准军官和炮手，其他优先前两排近处敌兵。 */
function pickAim(w:SimWorld,u:Soldier,c:Company,t:Company){
    if(c.variant==='rifles'){
        const prio=t.members.find(v=>v.hp>0 && (v.officer || isArtillery(v)));
        if(prio)return prio;
    }
    const front=t.formation==='line'?t.files*2:t.members.length;
    let best:Soldier|null=null,bd=Infinity;
    for(let i=0;i<4;i++){
        const v=t.members[w.rng.int(0,Math.max(0,Math.min(t.members.length,front)-1))];
        if(!v||v.hp<=0)continue;
        const d=(v.x-u.x)**2+(v.y-u.y)**2;
        if(d<bd){bd=d;best=v;}
    }
    if(!best)for(const v of t.members)if(v.hp>0){best=v;break;}
    return best;
}
/** 综合散布系数：硝烟、疲劳、动摇、射击模式、天气与兵种训练。越大越散。 */
function spreadOf(w:SimWorld,c:Company,t:Company){
    const ownSmoke=c.battalion>=0?Math.max(c.smoke,w.battalions[c.battalion]?.smoke??0):c.smoke;
    const enemySmoke=t.battalion>=0?Math.max(t.smoke,w.battalions[t.battalion]?.smoke??0):t.smoke;
    const guardFirst=isGuard(c) && c.fireMode==='first';
    const rifleMult=c.variant==='rifles'?.6:1;
    return (1+.8*ownSmoke+.35*enemySmoke)*(1+.4*c.fatigue)*(c.status==='shaken'?1.5:1)
        *(guardFirst?.75:c.fireMode==='first'?.82:c.fireMode==='free'?1.25:1)
        *(isGuard(c)?.85:1)*rifleMult*(w.weather==='rain'?1.12:1);
}
export function shoot(w:SimWorld,u:Soldier,c:Company){
    const t=w.companies[u.shotTarget];
    if(!t || !w.sight.canSee(w,c,t) || t.status==='gone' || c.status==='rout' || u.moving || u.ammo<=0 || c.assaultStage==='rush')return;
    const aim=pickAim(w,u,c,t);if(!aim)return;
    // 射击纪律：火线上有站立的友军就不开火（新兵偶尔会失误照开）。
    const kneeling=u.kneelUntil>w.tick;
    if(w.ballistics.meleeNear(w,u,aim.x,aim.y)){w.ballistics.discipline.heldFire++;u.fireAt=-1;return;}
    const spread=spreadOf(w,c,t);
    if(w.ballistics.laneBlocked(w,u,aim.x,aim.y,kneeling?.72:1,spread)){
        if(w.rng.next()>(c.status==='shaken'?.001:.0002)){w.ballistics.discipline.heldFire++;u.fireAt=-1;return;}
        w.ballistics.discipline.ignored++;
    }
    u.ammo--;c.ammo--;u.shotsFired++;
    const rifleReload=c.variant==='rifles'?1.6:1;
    u.loadedAt=w.tick+Math.round(w.rng.int(156,176)*rifleReload*(isGuard(c)?.9:1)*(1+.15*c.fatigue+(w.weather==='rain'?.15:0)+(u.shotsFired>15?.15:0)));
    c.smoke=Math.min(1,c.smoke+.04);
    const dx=aim.x-u.x,dy=aim.y-u.y,d=Math.max(1,Math.hypot(dx,dy));
    u.firedAt=w.tick;u.pose='aim';
    if(w.weather==='rain' && w.rng.next()<.3)return;
    const fire=emit(w,'fire',u,dx/d,dy/d,false);
    if(c.battalion>=0)fire.battalion=c.battalion;
    fire.shotDist=d; fire.formation=c.formation;
    const shot=w.ballistics.musket(w,u,c,aim,spread);
    fire.endX=shot.x;fire.endY=shot.y;fire.struck=shot.struck;
    w.events.push({type:'tileImpact',kind:u.kind,unitId:u.id,faction:u.faction,x:shot.x,y:shot.y,dx:0,dy:0,explosive:false,struck:shot.struck});
}
/** 白刃战一击。骑兵砍阵线如切菜，撞方阵则寸步难行。 */
export function strike(w: SimWorld, u: Soldier, foe: Soldier) {
    const c = w.companies[u.company], fc = w.companies[foe.company];
    const dx = foe.x - u.x, dy = foe.y - u.y, d = Math.max(1, Math.hypot(dx, dy));
    emit(w, 'slash', u, dx / d, dy / d, false);
    let dmg = isMounted(u) ? w.rng.int(3, 9) : w.rng.int(4, 10);
    if (isMounted(u)) {
        // B2 动量冲击伤害 & E1/E2/E3 骑兵变体差异
        if (w.tick - c.chargeAt <= 50 && c.impactSpeed > 0) {
            dmg *= 1.35 * (c.impactSpeed / 235) * (c.impactSpeed < 140 ? 0.5 : 1.0);
        } else {
            dmg *= 0.65;
        }
        dmg *= cavalryImpactMult(c, isMounted(foe));
        if (fc.formation === 'square' && fc.formUntil <= w.tick && fc.status !== 'rout') {
            dmg *= c.variant === 'lancer' ? 0.45 : 0.28;
        }
    }
    if (fc.status === 'rout') dmg *= 1.15;
    if (isGuard(u)) dmg *= 1.2;
    if (c.status === 'shaken') dmg *= .75;
    const killed = damage(w, foe, dmg, dx / d, dy / d, false, c, true);
    if (killed) w.ballistics.meleeKills++;
    u.cooldown = w.rng.int(92, 126);
    u.firedAt = w.tick;
}

/** 实心弹飞行顶点高度：远射吊得高，近射几乎平射。 */
const apexOf=(d:number)=>Math.min(6,.4+d*.0024);
/** 弹道上某点的高度（0=地面，1=人高）。飞行段：炮口 1.0 → 落点 0；滚跳段：一跳一跳逐渐变低。 */
function flightHeight(t:number,apex:number){return 1*(1-t)+4*apex*t*(1-t);}
function bounceHeight(s:number,roll:number,energy:number){return Math.abs(Math.sin(s*Math.PI/140))*1.35*Math.max(.25,energy)*(1-s/Math.max(1,roll));}
/**
 * 预测这一炮的低空段（会撞人的部分）是否经过己方部队。用于炮兵的射击纪律。
 * riskTolerance 越大越敢冒险（激进统帅）。
 */
function endangersFriends(w:SimWorld,g:Soldier,tx:number,ty:number,roll:number,dx:number,dy:number,risk:number){
    const d=Math.hypot(tx-g.x,ty-g.y),apex=apexOf(d);
    let near=0;
    const probe=(x:number,y:number)=>w.hash.visit(x,y,26,u=>{if(u.faction===g.faction && u.company!==g.company)near++;});
    for(let s=60;s<d;s+=40){const t=s/d;if(flightHeight(t,apex)<1.3)probe(g.x+(tx-g.x)*t,g.y+(ty-g.y)*t);}
    for(let s=0;s<=roll;s+=30)if(bounceHeight(s,roll,1)<1.3)probe(tx+dx*s,ty+dy*s);
    return near>risk*20;
}
const MAX_GUN_ARC = (8 * Math.PI) / 180;
export function angleDiffRad(a: number, b: number) {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
}
export function gunFire(w: SimWorld, g: Soldier, c: Company, t: Company) {
    // H3 / H4：炮组全灭哑火或炮连溃散，停止射击
    if (g.crew <= 0 || c.status === 'rout' || g.captured) return false;
    // G2 / G6 / J10：硬断言只能射击炮口方向 ±8° 以内的目标
    const targetAng = Math.atan2(t.y - g.y, t.x - g.x);
    const diff = Math.abs(angleDiffRad(g.aim, targetAng));
    if (diff > MAX_GUN_ARC + 1e-5) {
        throw new Error(`Artillery fired outside ±8° arc: ${(diff * 180 / Math.PI).toFixed(2)}°`);
    }
    const crewScale = 6 / Math.max(1, g.crew);
    if (g.crew < 6) w.artilleryStats.slowedReloads++;
    const risk=w.generals[c.faction]?.trait==='aggressive'?.15:w.generals[c.faction]?.trait==='cautious'?0:.05;
    const d = dist(g, t);
    if (d < CANISTER) {
        const dx=(t.x-g.x)/Math.max(1,d),dy=(t.y-g.y)/Math.max(1,d);
        // 霰弹锥里有友军就不打。
        let friends=0;
        for(let s=30;s<d+40;s+=30)w.hash.visit(g.x+dx*s,g.y+dy*s,18+s*.13,u=>{if(u.faction===g.faction&&u.company!==g.company)friends++;});
        if(friends>risk*10){w.ballistics.discipline.heldFire++;g.cooldown=20;return false;}
        g.pose='recoil';g.firedAt=w.tick;emit(w,'fire',g,dx,dy,true);
        w.ballistics.canister(w,g,c,t.x,t.y);
        g.cooldown=Math.round(w.rng.int(150,190)*crewScale);
        return true;
    }
    if(g.aimTarget!==t.id || Math.hypot(t.x-g.aimX,t.y-g.aimY)>150){
        g.aimTarget=t.id;g.aimX=t.x;g.aimY=t.y;g.shotsOnTarget=0;
        const baseErr = Math.max(120, Math.round(d * 0.08));
        g.rangeError=(w.rng.next()<.5?-1:1)*w.rng.int(baseErr, Math.round(baseErr * 1.9))*(w.weather==='fog'?2:1);
    }
    for(const o of c.members)if(o.hp>0 && o.shotsOnTarget>0 && o.aimTarget===t.id && Math.hypot(t.x-o.aimX,t.y-o.aimY)<=150 && Math.abs(o.rangeError)<Math.abs(g.rangeError))g.rangeError=o.rangeError;
    const lx=(t.x-g.x)/d, ly=(t.y-g.y)/d;
    const lateral=(w.rng.next()+w.rng.next()-1)*(15+d*.032)*(g.shotsOnTarget<2?1.8:1);
    const ax=t.x+lx*g.rangeError-ly*lateral, ay=t.y+ly*g.rangeError+lx*lateral;
    const dd=Math.max(1,Math.hypot(ax-g.x,ay-g.y)),dx=(ax-g.x)/dd,dy=(ay-g.y)/dd;

    // I1：榴弹炮（howitzer）高抛物线越过友军，只检查落点 150px 内有无友军
    if (c.variant === 'howitzer') {
        const hAx = t.x + lx * g.rangeError * 1.35 - ly * lateral * 1.35;
        const hAy = t.y + ly * g.rangeError * 1.35 + lx * lateral * 1.35;
        const hDd = Math.max(1, Math.hypot(hAx - g.x, hAy - g.y)), hDx = (hAx - g.x) / hDd, hDy = (hAy - g.y) / hDd;
        let nearFriend = 0;
        w.hash.visit(hAx, hAy, 150, u => { if (u.faction === g.faction && u.company !== g.company) nearFriend++; });
        if (nearFriend > 0) { w.ballistics.discipline.heldFire++; g.cooldown = 25; return false; }
        g.pose = 'recoil'; g.firedAt = w.tick; g.rangeError *= w.weather === 'fog' ? .7 : .55; g.shotsOnTarget++;
        w.ballistics.countShell();
        w.rounds.push({
            x: g.x, y: g.y, tx: hAx, ty: hAy, dx: hDx, dy: hDy, age: 0, duration: Math.max(12, Math.ceil(hDd / 45)),
            roll: 0, rolled: 0, speed: 0, gun: g, faction: g.faction, company: c.id,
            apex: Math.min(9, 2.2 + hDd * 0.004), energy: 1, hit: new Set([g.id]), touched: [], lastH: 1,
            shell: true, fuse: w.rng.int(30, 60), landed: false
        });
        emit(w, 'fire', g, hDx, hDy, true);
        g.cooldown = Math.round(w.rng.int(365, 435) * crewScale);
        return true;
    }

    let roll=(w.weather==='rain'?140:420);
    if (behindCrest(ax, ay, t.faction)) roll*=.3;
    // 射击纪律：低空段或弹跳走廊经过己方部队，就不开这一炮，交给炮兵连换目标。
    if(endangersFriends(w,g,ax,ay,roll,dx,dy,risk)){w.ballistics.discipline.heldFire++;g.cooldown=25;return false;}
    g.pose='recoil';g.firedAt=w.tick;g.rangeError*=w.weather==='fog'?.7:.55;g.shotsOnTarget++;
    if (behindCrest(ax, ay, t.faction) && w.tick-([...w.news].reverse().find(n=>n.text.includes('炮弹砸在山脊'))?.tick??-1000)>900)
        w.say('炮弹砸在山脊上，没能弹过去',g.faction,ax,ay,1);
    w.ballistics.countRound();
    w.rounds.push({ x: g.x, y: g.y, tx: ax, ty: ay, dx, dy, age: 0, duration: Math.max(6, Math.ceil(dd / 60)), roll, rolled: 0, speed: 24,
        gun: g, faction: g.faction, company: c.id, apex: apexOf(dd), energy: 1, hit: new Set([g.id]), touched: [], lastH: 1 });
    emit(w, 'fire', g, dx, dy, true);
    g.cooldown = Math.round(w.rng.int(335,405)*crewScale);
    return true;
}
export function roundPosition(r: Round, alpha = 0) {
    if (r.age + alpha < r.duration) {
        const t = Math.min(1, (r.age + alpha) / r.duration);
        return { x: r.x + (r.tx - r.x) * t, y: r.y + (r.ty - r.y) * t, h: flightHeight(t, r.apex) * 1.6 + .15 };
    }
    if (r.shell) return { x: r.tx, y: r.ty, h: 0.15 };
    const s = Math.min(r.roll, r.rolled + r.speed * alpha);
    return { x: r.tx + r.dx * s, y: r.ty + r.dy * s, h: .2 + bounceHeight(s, r.roll, r.energy) * 1.6 };
}
/** 推进所有实心弹与榴弹：实心弹低空段与跳弹掠过人群；榴弹落地冒烟后经 30～60 tick 引信爆炸飞散破片。 */
export function resolveRounds(w: SimWorld) {
    for (let i = w.rounds.length - 1; i >= 0; i--) {
        const r = w.rounds[i];
        r.age++;
        if (r.shell) {
            if (r.age < r.duration) continue;
            if (!r.landed) {
                r.landed = true;
                emit(w, 'shell', r.gun, r.dx, r.dy, true, r.tx, r.ty);
                continue;
            }
            r.fuse = (r.fuse ?? 0) - 1;
            if (r.fuse <= 0) {
                emit(w, 'burst', r.gun, 0, 0, true, r.tx, r.ty);
                w.artilleryStats.shellExplosions++;
                w.ballistics.shellBurst(w, r, r.tx, r.ty);
                w.rounds.splice(i, 1);
            }
            continue;
        }
        if (r.age <= r.duration) {
            const t0=(r.age-1)/r.duration,t1=Math.min(1,r.age/r.duration);
            const h0=flightHeight(t0,r.apex),h1=flightHeight(t1,r.apex);
            if(Math.min(h0,h1)<1.8)w.ballistics.sweep(w,r,r.x+(r.tx-r.x)*t0,r.y+(r.ty-r.y)*t0,r.x+(r.tx-r.x)*t1,r.y+(r.ty-r.y)*t1,h0,h1);
            if (r.age === r.duration) emit(w, 'impact', r.gun, r.dx, r.dy, true, r.tx, r.ty);
            continue;
        }
        const s0 = r.rolled, step = Math.min(r.speed, r.roll - r.rolled);
        r.rolled += step; r.speed *= .985;
        const ha=bounceHeight(s0,r.roll,r.energy),hb=bounceHeight(r.rolled,r.roll,r.energy);
        w.ballistics.sweep(w,r,r.tx+r.dx*s0,r.ty+r.dy*s0,r.tx+r.dx*r.rolled,r.ty+r.dy*r.rolled,Math.min(ha,hb),Math.min(ha,hb));
        const px = r.tx + r.dx * r.rolled, py = r.ty + r.dy * r.rolled;
        if(Math.floor(r.rolled/140)>Math.floor(s0/140))emit(w,'bounce',r.gun,r.dx,r.dy,true,px,py);
        if (r.rolled >= r.roll || r.speed < 5 || r.energy <= 0 || px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) w.rounds.splice(i, 1);
    }
}
