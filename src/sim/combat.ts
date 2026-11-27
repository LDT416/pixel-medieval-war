import type { Soldier, BattleEvent, Company, Round } from './arenaTypes';
import type { SimWorld } from './world';
import { WIDTH, HEIGHT, coverAt, behindCrest, inRect, layout } from './maps';

export const MUSKET = 230, CANISTER = 320;
export const gunRange = (w: SimWorld) => w.weather === 'fog' ? 1350 : 2480;
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export function emit(w: SimWorld, type: BattleEvent['type'], u: Soldier, dx: number, dy: number, explosive: boolean, x = u.x, y = u.y) {
    w.events.push({ type, x, y, dx, dy, explosive, unitId: u.id, kind: u.kind, faction: u.faction });
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
    u.moving = false; u.vx = 0; u.vy = 0;
    w.alive[u.faction]--; w.dead[u.faction]++;
    emit(w, 'death', u, dx, dy, explosive);
    const c = w.companies[u.company];
    c.alive--;
    const lost = 1 - c.alive / c.peak;
    shake(c, (c.kind === 'field_cannon' ? 70 : c.kind === 'guard_grenadier' ? 62 : 95) / Math.max(6, c.peak) * (1 + lost * 1.4));
    if (u.kind === 'bannerman' && --c.colors === 0 && c.alive > 3) {
        shake(c, 12);
        if (c.kind === 'guard_grenadier' || (w.tick > 900 && w.rng.next() < .2)) w.say(`${c.name}的军旗倒下了`, c.faction, u.x, u.y, 1);
    }
    if (by) by.kills++;
    if (u.general) w.generalDown(u);
    return true;
}
function victim(w: SimWorld, t: Company, front: number) {
    const n = t.members.length;
    for (let i = 0; i < 5; i++) {
        const v = t.members[w.rng.int(0, Math.max(0, Math.min(n, front) - 1))];
        if (v && v.hp > 0) return v;
    }
    for (const v of t.members) if (v.hp > 0) return v;
    return null;
}
/** 整连齐射：按连计算命中率，再给每名射手排一个错开几帧的开火时刻，形成一排排的枪焰涟漪。 */
export function volley(w: SimWorld, c: Company, t: Company) {
    const d = dist(c, t);
    let p = .03 + .15 * Math.pow(1 - Math.min(1, d / MUSKET), 1.5);
    if (t.formation === 'square' || t.formation === 'column') p *= 1.4;
    if (t.kind === 'cuirassier') p *= 1.25;
    if (c.status === 'shaken') p *= .6;
    if (c.formUntil > w.tick) p *= .5;
    if (c.kind === 'guard_grenadier') p *= 1.2;
    p *= .75 * coverAt(t.x, t.y);
    c.hitChance = p; c.target = t.id;
    const steady = c.status === 'steady' && c.formUntil <= w.tick;
    const rearRanksOut = c.formation === 'column' ? c.files * 2 : c.formation === 'square' ? Math.ceil(c.members.length / 2) : 9999;
    for (const u of c.members) {
        if (u.hp <= 0 || u.kind === 'bannerman' || u.slot >= rearRanksOut) continue;
        const file = c.files ? u.slot % c.files : 0;
        u.fireAt = w.tick + 1 + (steady ? Math.floor(file * .7) % 14 : w.rng.int(0, 28));
    }
    c.reloadAt = w.tick + (c.kind === 'guard_grenadier' ? w.rng.int(55,68) : w.rng.int(60,75)) + (c.status === 'shaken' ? 20 : 0);
    t.underFire = w.tick + 90;
    shake(t, .9);
}
export function shoot(w: SimWorld, u: Soldier, c: Company) {
    const t = w.companies[c.target];
    if (!t || t.status === 'gone' || c.status === 'rout') return;
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.max(1, Math.hypot(dx, dy));
    u.firedAt = w.tick; u.pose = 'aim';
    if (w.weather === 'rain' && w.rng.next() < .3) return;
    emit(w, 'fire', u, dx / d, dy / d, false);
    if (w.rng.next() < c.hitChance) {
        const v = victim(w, t, t.formation === 'line' ? t.files * 2 : t.members.length);
        if (v) damage(w, v, w.rng.int(55, 130), dx / d, dy / d, false, c);
    }
}
/** 白刃战一击。骑兵砍阵线如切菜，撞方阵则寸步难行。 */
export function strike(w: SimWorld, u: Soldier, foe: Soldier) {
    const c = w.companies[u.company], fc = w.companies[foe.company];
    const dx = foe.x - u.x, dy = foe.y - u.y, d = Math.max(1, Math.hypot(dx, dy));
    emit(w, 'slash', u, dx / d, dy / d, false);
    let dmg = u.kind === 'cuirassier' ? w.rng.int(45, 120) : w.rng.int(28, 78);
    if (u.kind === 'cuirassier' && fc.formation === 'square' && fc.formUntil <= w.tick && fc.status !== 'rout') dmg *= .28;
    if (fc.status === 'rout') dmg *= 1.6;
    if (u.kind === 'guard_grenadier') dmg *= 1.2;
    if (c.status === 'shaken') dmg *= .75;
    damage(w, foe, dmg, dx / d, dy / d, false, c);
    u.cooldown = w.rng.int(22, 44);
    u.firedAt = w.tick;
}
/** 冲击瞬间：骑兵撞上未结阵的步兵会当场撕开缺口。 */
export function impact(w: SimWorld, c: Company, t: Company) {
    if (c.kind !== 'cuirassier') { shake(t, 8); return; }
    const formedSquare = t.formation === 'square' && t.formUntil <= w.tick && t.status !== 'rout';
    if (formedSquare) {
        shake(c, 16);
        if (w.rng.next() < .5) w.say(`${t.name}结成方阵，${c.name}的冲锋撞得人仰马翻`, t.faction, t.x, t.y, 1);
        return;
    }
    const caught = t.formUntil > w.tick;
    const n = Math.round(t.alive * (caught ? .24 : .15) * c.alive / Math.max(1, c.peak));
    for (let i = 0; i < n; i++) {
        const v = victim(w, t, t.members.length);
        if (v) damage(w, v, w.rng.int(80, 150), c.hx, c.hy, false, c);
    }
    shake(t, t.kind === 'field_cannon' ? 45 : caught ? 40 : 26);
    w.say(caught ? `${t.name}来不及结阵，被${c.name}冲得七零八落！` : `${c.name}撞进了${t.name}的阵线！`, c.faction, t.x, t.y, 2);
}

export function gunFire(w: SimWorld, g: Soldier, c: Company, t: Company) {
    const d = dist(g, t);
    const blocked=(x:number,y:number,dx:number,dy:number,roll:number)=>w.companies.some(p=>{
        if(p===c || p.faction!==c.faction || !p.alive) return false;
        const along=Math.max(0,Math.min(roll,(p.x-x)*dx+(p.y-y)*dy));
        return Math.abs((p.x-g.x)*dy-(p.y-g.y)*dx)<80 && Math.hypot(p.x-x-along*dx,p.y-y-along*dy)<150;
    });
    if(blocked(t.x,t.y,(t.x-g.x)/Math.max(1,d),(t.y-g.y)/Math.max(1,d),0))return;
    g.pose = 'recoil';
    if (d < CANISTER) {
        // 霰弹：近距离一炮扫倒一片。
        const dx = (t.x - g.x) / Math.max(1, d), dy = (t.y - g.y) / Math.max(1, d);
        g.firedAt=w.tick; emit(w, 'fire', g, dx, dy, true);
        const n = w.rng.int(2, 4);
        for (let i = 0; i < n; i++) {
            const v = victim(w, t, t.members.length);
            if (v) damage(w, v, w.rng.int(70, 160), dx, dy, true, c);
        }
        shake(t, 6);
        g.cooldown = w.rng.int(150,190);
        return;
    }
    const aim = victim(w, t, t.members.length) ?? t;
    if(g.aimTarget!==t.id || Math.hypot(t.x-g.aimX,t.y-g.aimY)>150){
        g.aimTarget=t.id;g.aimX=t.x;g.aimY=t.y;g.shotsOnTarget=0;
        g.rangeError=(w.rng.next()<.5?-1:1)*w.rng.int(120,260)*(w.weather==='fog'?2:1);
    }
    for(const o of c.members)if(o.hp>0 && o.shotsOnTarget>0 && o.aimTarget===t.id && Math.hypot(t.x-o.aimX,t.y-o.aimY)<=150 && Math.abs(o.rangeError)<Math.abs(g.rangeError))g.rangeError=o.rangeError;
    const lx=(t.x-g.x)/d, ly=(t.y-g.y)/d;
    const lateral=(w.rng.next()+w.rng.next()-1)*(14+d*.03)*(g.shotsOnTarget<2?1.8:1);
    const ax=aim.x+lx*g.rangeError-ly*lateral, ay=aim.y+ly*g.rangeError+lx*lateral;
    const dd=Math.max(1,Math.hypot(ax-g.x,ay-g.y)),dx=(ax-g.x)/dd,dy=(ay-g.y)/dd;
    const tx=ax,ty=ay;
    let roll=w.weather==='rain'?100:280;
    if(blocked(tx,ty,dx,dy,roll))return;
    g.firedAt=w.tick;g.rangeError*=w.weather==='fog'?.7:.55;g.shotsOnTarget++;
    if (behindCrest(ax, ay, t.faction)) roll *= .3;
    w.rounds.push({ x: g.x, y: g.y, tx, ty, dx, dy, age: 0, duration: Math.max(6, Math.ceil(dd / 60)), roll, rolled: 0, speed: 24,
        gun: g, faction: g.faction, company: c.id, kills: 0, touched: [] });
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
        const source = w.companies[r.company];
        if (r.kills < 3) w.hash.visit(px, py, 8, u => {
            if (u.faction === r.faction || r.kills >= 3) return;
            if (inRect(layout.farm, u.x, u.y, 8) && w.rng.next() < .7) { r.roll = 0; return; }
            damage(w, u, 190, r.dx, r.dy, true, source);
            r.kills++; r.roll -= 28;
            if (!r.touched.includes(u.company)) { r.touched.push(u.company); shake(w.companies[u.company], 3.5); }
        });
        if (r.rolled >= r.roll || r.speed < 5 || px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) w.rounds.splice(i, 1);
    }
}
