import type { Soldier, Company, Formation } from './arenaTypes';
import type { SimWorld } from './world';
import { WIDTH, HEIGHT, behindCrest, inWoods, inRect, layout } from './maps';
import { MUSKET, CANISTER, gunRange, dist, shake, volley, shoot, strike, impact, gunFire } from './combat';

const SPACING: Record<Formation, [number, number]> = {
    line: [13, 15], column: [13, 14], square: [13, 13], battery: [62, 0], wedge: [25, 32], staff: [22, 18]
};
export function filesFor(c: Company, n: number) {
    switch (c.formation) {
        case 'line': return Math.max(1, Math.ceil(n / c.ranks));
        case 'column': return Math.min(n, 9);
        case 'wedge': return Math.max(1, Math.ceil(n / 2));
        case 'battery': return n;
        default: return Math.max(1, Math.ceil(n / 2));
    }
}
/** 连内第 i 个士兵相对连中心的（横向, 纵深）偏移。 */
function slotOffset(c: Company, i: number): [number, number] {
    const [sp, dp] = SPACING[c.formation];
    if (c.formation === 'square') {
        const n = Math.max(4, c.capacity), side = Math.ceil(n / 4), half = (side - 1) * sp / 2;
        const edge = Math.floor(i / side) % 4, j = i % side, t = j * sp - half;
        return edge === 0 ? [t, -half] : edge === 1 ? [half, t] : edge === 2 ? [-t, half] : [-half, -t];
    }
    const files = Math.max(1, c.files), rank = Math.floor(i / files), file = i % files;
    return [(file - (files - 1) / 2) * sp, rank * dp];
}

/** 按当前队形把全连士兵直接摆到位（开局与援军入场时使用）。 */
export function formUp(c: Company) {
    c.files = filesFor(c, c.members.length);
    c.capacity=c.members.length;
    c.members.forEach((u, i) => {
        u.slot = i;
        const [lat, dep] = slotOffset(c, i);
        u.x = Math.min(WIDTH - 3, Math.max(3, c.x - lat * c.hy - dep * c.hx + u.jx));
        u.y = Math.min(HEIGHT - 3, Math.max(3, c.y + lat * c.hx - dep * c.hy + u.jy));
        u.px=u.x; u.py=u.y;
    });
}
function moveToward(w: SimWorld, u: Soldier, tx: number, ty: number, speed: number) {
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
    let sp = speed;
    if (inWoods(u.x, u.y)) sp *= u.kind === 'cuirassier' ? .45 : .75;
    if (w.weather === 'rain') sp *= .88;
    const step = Math.min(d, sp / 30);
    if (d < (u.moving ? 1 : 3)) { u.vx = u.vy = 0; u.moving = false; return false; }
    u.vx = dx / d * step * 30; u.vy = dy / d * step * 30;
    u.x = Math.min(WIDTH - 2, Math.max(2, u.x + u.vx / 30));
    u.y = Math.min(HEIGHT - 2, Math.max(2, u.y + u.vy / 30));
    u.moving = true; u.stride += step;
    return true;
}
function faceToward(u:Soldier, dx:number){
    const dir=Math.sign(dx);
    if(dir===u.face || dir===0){u.turnFrames=0;return;}
    if(++u.turnFrames>=10){u.face=dir;u.turnFrames=0;}
}
function flee(w: SimWorld, u: Soldier, c: Company) {
    const away = u.faction ? 1 : -1;
    const ok = moveToward(w, u, u.x + away * 200, u.y + u.jy * 3 + Math.sin((w.tick + u.id * 37) * .02) * 60, u.speed * (u.kind === 'cuirassier' ? 1.05 : 1.3));
    u.pose = 'run'; faceToward(u,away);
    if (ok && (u.x <= 4 || u.x >= WIDTH - 4)) {
        u.escaped=true;u.hp = 0; u.moving = false;
        w.alive[u.faction]--; w.fled[u.faction]++; c.alive--;
    }
}
function meleeStep(w: SimWorld, u: Soldier, c: Company) {
    if (u.kind === 'field_cannon') return false;
    let foe = u.foe >= 0 ? w.units[u.foe] : undefined;
    if ((w.tick + u.id) % 6 === 0 || !foe || foe.hp <= 0) {
        let best = Infinity, found: Soldier | undefined;
        w.hash.visit(u.x, u.y, c.engaged ? 80 : 16, o => {
            if (o.faction === u.faction || (!c.engaged && o.foe!==u.id)) return;
            const d = (o.x - u.x) ** 2 + (o.y - u.y) ** 2;
            if (d < best) { best = d; found = o; }
        });
        foe = found as Soldier | undefined; u.foe = foe ? foe.id : -1;
    }
    if (!foe) return false;
    const reach = u.kind === 'cuirassier' ? 22 : 16;
    const d = Math.hypot(foe.x - u.x, foe.y - u.y);
    if(!c.engaged && (d>16 || foe.foe!==u.id)){u.foe=-1;return false;}
    faceToward(u,foe.x-u.x);
    if (d <= reach) {
        u.moving = false; u.vx = u.vy = 0; u.pose = 'thrust';
        if (!u.cooldown) strike(w, u, foe);
        return true;
    }
    if (!c.engaged && d > 30) { u.foe = -1; return false; }
    moveToward(w, u, foe.x - (foe.x - u.x) / d * reach * .8, foe.y - (foe.y - u.y) / d * reach * .8, u.speed * 1.15);
    u.pose = 'run';
    return true;
}

export function advance(w: SimWorld, u: Soldier) {
    const c = w.companies[u.company];
    if (u.cooldown > 0) u.cooldown--;
    if (u.fireAt === w.tick) shoot(w, u, c);
    if (c.status === 'rout') { flee(w, u, c); return; }
    if ((c.engaged || u.foe >= 0 || (w.tick + u.id) % 6 === 0) && meleeStep(w, u, c)) return;
    const [lat, dep] = slotOffset(c, u.slot);
    const tx = c.x - lat * c.hy - dep * c.hx + u.jx, ty = c.y + lat * c.hx - dep * c.hy + u.jy;
    const far = Math.abs(tx - u.x) + Math.abs(ty - u.y) > 30;
    const charging = c.order === 'charge' || (c.order === 'assault' && dist(c, w.companies[c.target] ?? c) < 320);
    const moved = moveToward(w, u, tx, ty, u.speed * (far ? 1.3 : 1.1) * (charging ? 1.45 : 1));
    faceToward(u,c.hx);
    if (moved) {
        u.marchUntil=w.tick+12;
        u.pose = u.kind === 'cuirassier' || charging ? 'run' : 'march';

        return;
    }
    if(u.pose==='march' && w.tick<u.marchUntil && w.tick-u.firedAt>70 && u.fireAt<w.tick)return;
    const since = w.tick - u.firedAt;
    if (u.kind === 'field_cannon') u.pose = since < 14 ? 'recoil' : u.cooldown > 30 ? 'load' : 'aim';
    else if (u.fireAt > w.tick && u.fireAt - w.tick < 26) u.pose = 'aim';
    else if (since < 70 && u.kind !== 'cuirassier' && u.kind !== 'bannerman') u.pose = since < 6 ? 'aim' : 'load';
    else u.pose = 'stand';
}

function nearestEnemy(w: SimWorld, c: Company, filter?: (o: Company) => boolean) {
    let best: Company | undefined, bd = Infinity;
    for (const o of w.companies) {
        if (o.faction === c.faction || o.status === 'gone' || o.alive <= 0 || o.line === 5 || (filter && !filter(o))) continue;
        const d = dist(c, o);
        if (d < bd) { bd = d; best = o; }
    }
    return { c: best, d: bd };
}
function pickTarget(w: SimWorld, c: Company) {
    const visible=(o:Company)=>{
        if(c.kind==='field_cannon'){
            const dx=o.x-c.x,dy=o.y-c.y,d2=dx*dx+dy*dy||1;
            for(const g of layout.woods){
                const a=Math.max(0,Math.min(1,((g.x-c.x)*dx+(g.y-c.y)*dy)/d2));
                if((c.x+a*dx-g.x)**2+(c.y+a*dy-g.y)**2<g.r*g.r)return false;
            }
        }else if(c.kind!=='cuirassier' && dist(c,o)>260 && behindCrest(o.x,o.y,o.faction))return false;
        return true;
    };
    const forced = w.companies[c.forced];
    if (forced && forced.status !== 'gone' && forced.alive > 0 && visible(forced)) return forced;
    c.forced = -1;
    const reach = c.kind === 'field_cannon' ? gunRange(w) : w.weather === 'fog' ? 1000 : 2600;
    let best: Company | undefined, score = Infinity;
    for (const o of w.companies) {
        if (o.faction === c.faction || o.status === 'gone' || o.alive <= 0 || o.line === 5) continue;
        const d = dist(c, o);
        if (d > reach || !visible(o)) continue;
        let s = d + Math.abs(o.y - c.y) * (c.kind === 'field_cannon' ? .2 : .9);
        if (c.kind === 'cuirassier') {
            s *= o.status === 'rout' ? .45 : o.formation === 'square' ? 3 : o.kind === 'field_cannon' ? .55 : o.status === 'shaken' ? .6 : o.formUntil > w.tick ? .5 : 1;
            if (inWoods(o.x, o.y) || inRect(layout.farm, o.x, o.y, 30)) s *= 5;
        } else if (c.kind === 'field_cannon') {
            s *= o.formation === 'square' || o.formation === 'column' ? .6 : o.kind === 'field_cannon' ? .85 : 1;
            if (o.status === 'rout') s *= 2.5;
        } else if (o.status === 'rout') s *= 1.8;
        if (s < score) { score = s; best = o; }
    }
    return best;
}
function setFormation(w: SimWorld, c: Company, f: Formation) {
    if (c.formation === f) return;
    c.capacity=c.members.length; c.margin=0; c.lastShrink=w.tick;
    c.members.forEach((u,i)=>u.slot=i);
    c.formation = f;
    c.formUntil = w.tick + Math.round((f === 'square' ? (c.kind === 'guard_grenadier' ? 36 : 58) : 55) * (c.status === 'shaken' ? 1.5 : 1));
    c.files = filesFor(c, c.members.length);
}
function compact(w:SimWorld,c:Company){
    const lost=c.members.length!==c.alive;
    if(lost)c.members=c.members.filter(u=>u.hp>0);
    if(!c.alive || c.status==='rout')return;
    const width=c.files, rows=Math.ceil(c.capacity/width);
    const shrink=c.formation!=='square' && width-2*c.margin>2 && w.tick-c.lastShrink>=90
        && c.alive<=(width-2*c.margin)*rows*.7;
    if(!lost && !shrink)return;
    const occupied=new Map(c.members.map(u=>[u.slot,u]));
    function move(u:Soldier,slot:number){occupied.delete(u.slot);u.slot=slot;occupied.set(slot,u);w.slotMoves++;}
    if(c.formation==='square')return; // 空出的边位保留到下次变阵
    if(lost)for(const u of c.members.slice().sort((a,b)=>a.slot-b.slot)){
        if(u.slot>=width && !occupied.has(u.slot-width))move(u,u.slot-width);
    }
    if(!shrink)return;
    const edge=c.margin, holes:number[]=[];
    for(let row=0;row<rows;row++)for(let file=edge+1;file<width-edge-1;file++){
        const slot=row*width+file;
        if(!occupied.has(slot))holes.push(slot);
    }
    const wings=c.members.filter(u=>u.slot%width===edge || u.slot%width===width-edge-1);
    if(holes.length<wings.length)return;
    for(const u of wings){
        holes.sort((a,b)=>Math.abs(b-u.slot)-Math.abs(a-u.slot));
        move(u,holes.pop()!);
    }
    c.margin++; c.lastShrink=w.tick;
}
export function rout(w: SimWorld, c: Company, quiet = false) {
    if (c.status === 'rout' || c.status === 'gone') return;
    c.routs++; c.status = 'rout'; c.engaged = false; c.order = 'rally'; c.forced = -1;
    for (const u of c.members) { u.foe = -1; u.fireAt = -1; }
    if (quiet) return;
    if (c.kind === 'guard_grenadier') {
        w.say(c.faction ? '近卫军退却了！整条战线为之一震' : '“近卫军退却了！”（La Garde recule!）恐慌在法军中蔓延', c.faction, c.x, c.y, 3);
        for (const o of w.companies) if (o.faction === c.faction) shake(o, 10);
    } else if (c.peak >= 8 && w.rng.next() < (c.kind === 'cuirassier' ? .5 : .7)) {
        w.say(`${c.name}${c.kind === 'cuirassier' ? '掉转马头逃离战场' : '丢下火枪，四散溃逃！'}`, c.faction, c.x, c.y, 1);
    }
    for (const o of w.companies) if (o !== c && o.faction === c.faction && o.status !== 'gone' && dist(o, c) < 380) shake(o, 5);
}

/** 连队大脑，每 6 帧轮询一次：士气、目标、队形、移动、开火。 */
export function updateCompany(w: SimWorld, c: Company) {
    if (c.status === 'gone') return;
    c.vx=c.vy=0; compact(w,c);
    if (c.alive <= 0) { c.status = 'gone'; c.engaged = false; return; }
    const wooded=inWoods(c.x,c.y);
    if(wooded && !c.wooded && w.tick>30)w.say(c.name+'退入树林',c.faction,c.x,c.y,1);
    c.wooded=wooded;
    const g = w.generals[c.faction];
    const near = nearestEnemy(w, c);
    // ---- 士气 ----
    const calm = w.tick > c.underFire && !c.engaged;
    let regen = calm ? .55 : .08;
    if (g.alive && g.unit && dist(g.unit, c) < 750) regen += .35;
    if (c.colors > 0) regen += .12;
    if (g.trait === 'cautious') regen *= 1.3;
    if (c.status === 'rout') regen = near.d > 600 ? .9 : 0;
    c.morale = Math.min(c.base, c.morale + regen);
    const breakAt = (c.kind === 'guard_grenadier' ? 12 : 18) - (g.trait === 'steadfast' && c.kind !== 'cuirassier' ? 5 : 0);
    if (c.status === 'rout') {
        if (w.broken[c.faction]) return;
        if (c.morale > 42 && near.d > 650 && c.alive >= Math.max(3, c.peak * .25) && c.rallied < 2) {
            c.status = 'shaken'; c.rallied++;c.rallies++; c.order = c.kind === 'cuirassier' ? 'rally' : 'hold';
            let mx = 0, my = 0; for (const u of c.members) { mx += u.x; my += u.y; }
            c.x = c.homeX = mx / c.members.length; c.y = c.homeY = my / c.members.length;
            c.hx = c.faction ? -1 : 1; c.hy = 0; setFormation(w, c, c.kind === 'cuirassier' ? 'wedge' : 'line');
            if (c.peak >= 10) w.say(`${c.name}在${g.alive ? g.title + g.name + '的' : '军官的'}喝令下重整旗鼓`, c.faction, c.x, c.y, 1);
        }
        return;
    }
    if (c.morale < breakAt) { rout(w, c); return; }
    c.status = c.morale < 40 ? 'shaken' : 'steady';
    if (c.line === 5) return updateStaff(w, c, near.d);

    // ---- 目标 ----
    const t = pickTarget(w, c);
    c.target = t ? t.id : -1;
    const d = t ? dist(c, t) : Infinity;
    // ---- 队形 ----
    if (c.kind === 'line_infantry' || c.kind === 'guard_grenadier') {
        const sheltered = inRect(layout.farm, c.x, c.y, 20) || inWoods(c.x, c.y);
        const cav = sheltered ? undefined : nearestEnemy(w, c, o => o.kind === 'cuirassier' && o.status !== 'rout' && o.alive > 3 && (o.order === 'charge' || o.target === c.id));
        if (cav && cav.c && cav.d < 600) setFormation(w, c, 'square');
        else if (c.formation === 'square' && (!cav?.c || cav.d > 720)) setFormation(w, c, 'line');
        else if (c.formation !== 'square') setFormation(w, c, c.order === 'advance' && d > 600 && !sheltered ? 'column' : 'line');
    }
    // ---- 移动目标 ----
    if(c.kind==='field_cannon'){
        c.order='hold';
        if(!c.relocated){
            let sum=0,count=0;
            for(const p of w.companies)if(p.faction===c.faction && p.line===0 && p.alive && p.status!=='rout'){sum+=p.x;count++;}
            const front=sum/count, face=c.faction?-1:1;
            if(count && (front-c.initialFront)*face>600){
                c.homeX=front-face*170; c.limbered=true; c.relocated=true;
            }
        }else if(c.limbered && Math.hypot(c.x-c.homeX,c.y-c.homeY)<2){
            c.limbered=false;c.deployUntil=w.tick+90;
        }
    }
    let gx = c.homeX, gy = c.homeY;
    const range = c.kind === 'field_cannon' ? gunRange(w) * .8 : MUSKET * .78;
    if (t && c.order === 'advance') {
        if (d > range) { const k = (d - range) / d; gx = c.x + (t.x - c.x) * k; gy = c.y + (t.y - c.y) * k; }
        else { gx = c.x; gy = c.y; }
        if (c.formation === 'square') { gx = c.x; gy = c.y; }
    } else if (t && (c.order === 'assault' || c.order === 'charge')) {
        gx = t.x + (t.x - c.x) / Math.max(1, d) * (c.order === 'charge' ? 50 : 0); gy = t.y + (t.y - c.y) / Math.max(1, d) * (c.order === 'charge' ? 50 : 0);
        if (c.order === 'assault' && c.formation === 'square') { gx = c.x; gy = c.y; }
    } else if (!t && (c.order === 'advance' || c.order === 'assault' || c.order === 'charge')) {
        // 雾中看不见敌人：朝敌方阵地方向摸索前进。
        const e = nearestEnemy(w, c).c;
        gx = c.x + (e ? Math.sign(e.x - c.x) : c.faction ? -1 : 1) * 160; gy = e ? c.y + Math.sign(e.y - c.y) * 40 : c.y;
    } else if (c.order === 'rally' && dist(c, { x: c.homeX, y: c.homeY }) < 40 && c.morale > 55) c.order = 'hold';
    c.gx = gx; c.gy = gy;
    // ---- 行进：阵形中心不能跑得比士兵快太多 ----
    let lag = 0, mx = 0, my = 0;
    for (const u of c.members) { mx += u.x; my += u.y; }
    mx /= c.members.length; my /= c.members.length;
    lag = Math.hypot(mx - c.x, my - c.y);
    let speed = c.speed * (c.formation === 'column' ? 1.05 : c.formation === 'square' ? .3 : c.formation === 'line' ? .85 : 1) * (c.status === 'shaken' ? .75 : 1);
    if(c.limbered)speed*=.7;
    if (c.order === 'charge') speed *= 1.35; else if (c.order === 'assault' && d < 320) speed *= 1.45;
    if (c.formUntil > w.tick && c.formation !== 'column') speed *= .3;
    const gd = Math.hypot(gx - c.x, gy - c.y);
    if (gd > 1 && lag < 55) {
        const step = Math.min(gd, speed * 6 / 30);
        c.vx=(gx-c.x)/gd*step*5; c.vy=(gy-c.y)/gd*step*5;
    }
    // 朝向：转向目标，每次最多转 0.1 弧度（整连在原地“轮转”）。
    const face = c.faction ? -1 : 1;
    let ax = t ? t.x - c.x : face, ay = t ? t.y - c.y : 0;
    if (c.order === 'rally' || c.order === 'reserve' || (c.order === 'hold' && (!t || d > 1200))) { ax = face; ay = 0; }
    const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
    const cur = Math.atan2(c.hy, c.hx), want = Math.atan2(ay, ax);
    let delta = want - cur; while (delta > Math.PI) delta -= 2 * Math.PI; while (delta < -Math.PI) delta += 2 * Math.PI;
    const turn = cur + Math.max(-.1, Math.min(.1, delta));
    c.hx = Math.cos(turn); c.hy = Math.sin(turn);
    if (!t) return;
    // ---- 接敌 ----
    const contact = (c.kind === 'cuirassier' ? 75 : 55) + (t.formation === 'square' ? 40 : 0);
    if (c.order === 'assault' && d < 200 && w.tick - c.checkedAt > 240 && t.status !== 'rout') {
        c.checkedAt = w.tick;
        // 刺刀冲锋前的意志较量：多数白刃战在接触前就分出了胜负。
        const nerve = t.morale + (inRect(layout.farm, t.x, t.y, 20) ? 22 : 0) + (t.kind === 'guard_grenadier' ? 15 : 0) + w.rng.int(-12, 12) - c.morale * .55;
        if (nerve < 12 && t.kind !== 'field_cannon') {
            w.say(`${t.name}在${c.name}的刺刀面前崩溃了！`, c.faction, t.x, t.y, 2);
            rout(w, t, true);
        } else {
            t.reloadAt = Math.min(t.reloadAt, w.tick);
            shake(c, 7);
        }
    }
    if ((c.order === 'assault' || c.order === 'charge') && d < contact && t.status !== 'rout' && !c.engaged) {
        c.engaged = true; t.engaged = true; c.chargeAt = w.tick;
        impact(w, c, t);
    }
    if (c.engaged) {
        if (d > contact + 90 || t.status === 'gone') c.engaged = false;
        else if ((w.tick - c.chargeAt) % 18 < 6) meleePressure(w, c, t);
        if (c.kind === 'cuirassier' && (w.tick - c.chargeAt > 200 || t.status === 'rout' || (t.formation === 'square' && w.tick - c.chargeAt > 90))) {
            c.engaged = false; c.order = 'rally'; c.forced = -1;
            for (const u of c.members) u.foe = -1;
        }
    }
    if (!c.engaged && (c.order === 'assault' || c.order === 'charge') && t.status === 'rout' && d < 220 && c.kind !== 'cuirassier') {
        c.order = 'hold'; c.homeX = c.x; c.homeY = c.y;
    }
    // ---- 开火 ----
    if (c.kind === 'field_cannon') {
        if (!c.limbered && w.tick>=c.deployUntil && lag < 30 && gd < 5) for (const gun of c.members) if (gun.hp > 0 && !gun.cooldown && !gun.moving) {
            const gt = d < CANISTER ? t : pickTarget(w, c) ?? t;
            if (dist(gun, gt) < gunRange(w)) gunFire(w, gun, c, gt);
        }
    } else if (c.kind !== 'cuirassier' && !c.engaged && d < MUSKET && w.tick >= c.reloadAt && c.order !== 'charge' && t.status !== 'rout') {
        volley(w, c, t);
    } else if (c.kind !== 'cuirassier' && !c.engaged && t.status === 'rout' && d < MUSKET && w.tick >= c.reloadAt) {
        volley(w, c, t);
    }
}
/** 混战中的意志较量：吃亏的一方士气持续下滑。 */
function meleePressure(w: SimWorld, a: Company, b: Company) {
    const square = (c: Company) => c.formation === 'square' && c.formUntil <= w.tick;
    const power = (c: Company, o: Company) => c.alive * (c.kind === 'cuirassier' ? (square(o) ? .5 : 1.6) : c.kind === 'guard_grenadier' ? 1.4 : 1)
        * (.4 + c.morale / 100) * (square(c) ? 1.6 : 1) * (inRect(layout.farm, c.x, c.y, 20) ? 1.8 : 1);
    const pa = power(a, b), pb = power(b, a), loser = pa < pb ? a : b, ratio = Math.max(pa, pb) / Math.max(.1, Math.min(pa, pb));
    shake(loser, Math.min(6, 1.2 * ratio));
}
function updateStaff(w: SimWorld, c: Company, threat: number) {
    const g = w.generals[c.faction], face = c.faction ? -1 : 1;
    if (threat < 380) { c.homeX -= face * 25; c.homeX = Math.min(WIDTH - 80, Math.max(80, c.homeX)); }
    const gd = Math.hypot(c.homeX - c.x, c.homeY - c.y);
    if (gd > 1) { const s = Math.min(gd, c.speed * 6 / 30); c.vx=(c.homeX-c.x)/gd*s*5; c.vy=(c.homeY-c.y)/gd*s*5; }
    c.hx = face; c.hy = 0;
    if (!g.alive && c.alive > 0 && threat > 900) c.order = 'hold';
}
