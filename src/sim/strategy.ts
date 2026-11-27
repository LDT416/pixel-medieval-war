import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted, standard as isStandard} from './units/abilities';
import type { Soldier, Company, Formation } from './arenaTypes';
import type { SimWorld } from './world';
import { WIDTH, HEIGHT, movementAt, behindCrest, inWoods, inRect, layout } from './maps';
import { MUSKET, CANISTER, gunRange, dist, shake, emit, volley, shoot, strike, gunFire } from './combat';

import {formationTicks,setupTicks} from './units/roster';
import {unitTypes} from './units/unitTypes';
import {PACE} from './scale';

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
        if(c.capacity<4)return [(i-(c.capacity-1)/2)*sp,0];
        // Each edge owns its starting corner. Its final slot stops one spacing before the next corner.
        const side=Math.ceil(c.capacity/4),half=side*sp/2;
        const edge = Math.floor(i / side) % 4, j = i % side, t = j * sp - half;
        return edge === 0 ? [t, -half] : edge === 1 ? [half, t] : edge === 2 ? [-t, half] : [-half, -t];
    }
    const files = Math.max(1, c.files), rank = Math.floor(i / files), file = i % files;
    return [(file - (files - 1) / 2) * sp, rank * dp];
}

/** 农庄守军在两栋建筑之间列队，进驻时随连中心平滑走入院内。 */
function courtyard(c:Company,slot:number){
    const f=layout.farm!;
    const cols=7, rows=Math.max(1,Math.ceil(c.capacity/cols));
    const facing=layout.ridgeOwner===0 || layout.ridgeOwner===-1 && c.homeX<WIDTH/2?-1:1;
    return [c.x+((Math.floor(slot/cols)-(rows-1)/2)*9-10)*facing,
        c.y+((slot%cols-3)*9+8)*facing];
}
/** 按当前队形把全连士兵直接摆到位（开局与援军入场时使用）。 */
export function formUp(c: Company) {
    c.files = filesFor(c, c.members.length);
    c.capacity=c.members.length;
    c.members.forEach((u, i) => {
        u.slot = i;
        const [lat, dep] = slotOffset(c,i);
        u.x = Math.min(WIDTH - 3, Math.max(3, c.x - lat * c.hy - dep * c.hx + u.jx));
        u.y = Math.min(HEIGHT - 3, Math.max(3, c.y + lat * c.hx - dep * c.hy + u.jy));
        if(c.line===6 && layout.farm)[u.x,u.y]=courtyard(c,i);
        u.px=u.x; u.py=u.y;
    });
}
function moveToward(w: SimWorld, u: Soldier, tx: number, ty: number, speed: number) {
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
    let sp = speed;
    if (inWoods(u.x, u.y)) sp *= isMounted(u) ? .45 : .75;
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
    const ok = moveToward(w, u, u.x + away * 200, u.y + u.jy * 3 + Math.sin((w.tick + u.id * 37) * .02) * 60, isMounted(u)?PACE.horseTrot:PACE.footFlee);
    u.pose = 'run'; faceToward(u,away);
    if (ok && (u.x <= 4 || u.x >= WIDTH - 4)) {
        c.ammo-=u.ammo;u.escaped=true;u.hp = 0; u.moving = false;
        w.alive[u.faction]--; w.fled[u.faction]++; c.alive--;
    }
}
function meleeStep(w: SimWorld, u: Soldier, c: Company) {
    if (isArtillery(u) || c.order==='rally') return false;
    const fixed=c.formation==='square' && c.formUntil<=w.tick;
    const closing=c.contactId>=0 && w.tick-c.contactAt<=45;
    let foe = u.foe >= 0 ? w.units[u.foe] : undefined;
    if ((w.tick + u.id) % 6 === 0 || !foe || foe.hp <= 0) {
        let best = Infinity, found: Soldier | undefined;
        w.hash.visit(u.x, u.y, fixed || !c.engaged?16:80, o => {
            if ((closing || c.engaged) && o.company!==c.contactId && o.foe!==u.id)return;
            if (o.faction === u.faction || (!fixed && !closing && !c.engaged && o.foe!==u.id)) return;
            const d = (o.x - u.x) ** 2 + (o.y - u.y) ** 2;
            if (d < best) { best = d; found = o; }
        });
        foe = found as Soldier | undefined; u.foe = foe ? foe.id : -1;
    }
    if (!foe) return false;
    const reach = isMounted(u) ? 22 : 16;
    const d = Math.hypot(foe.x - u.x, foe.y - u.y);
    if((fixed && d>16) || (!fixed && !closing && !c.engaged && (d>16 || foe.foe!==u.id))){u.foe=-1;return false;}
    faceToward(u,foe.x-u.x);
    if (d <= reach) {
        u.moving = false; u.vx = u.vy = 0; u.pose = 'thrust';
        if(w.companies[foe.company].status!=='rout' && w.tick-u.firedAt<30 && w.tick-foe.firedAt<30 && foe.pose==='thrust'){
            if(foe.foe===u.id && dist(c,w.companies[foe.company])<=120){
                c.lastMelee=w.tick;c.contactId=foe.company;
                const other=w.companies[foe.company];other.lastMelee=w.tick;other.contactId=c.id;
            }
        }
        if (!u.cooldown) strike(w, u, foe);
        return true;
    }
    if ((!closing && !c.engaged && d > 30) || fixed) { u.foe = -1; return false; }
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
    const [lat, dep] = slotOffset(c,u.slot);
    let tx=c.x-lat*c.hy-dep*c.hx+u.jx, ty=c.y+lat*c.hx-dep*c.hy+u.jy;
    if(c.line===6 && layout.farm)[tx,ty]=courtyard(c,u.slot);
    
    const charging = c.order === 'charge' || (c.order === 'assault' && c.target>=0 && w.sight.canSee(w,c,w.companies[c.target]) && dist(c,w.companies[c.target]) < 320);
    const gait=c.sprintUntil>w.tick?PACE.horseSprint:c.assaultStage==='rush'?PACE.footRush:u.speed;
    const moved=moveToward(w,u,tx,ty,gait*(1-PACE.maxFatiguePenalty*c.fatigue));
    faceToward(u,c.hx);
    if (moved) {
        u.marchUntil=w.tick+12;
        u.pose = isMounted(u) || charging ? 'run' : 'march';

        return;
    }
    if(u.pose==='march' && w.tick<u.marchUntil && w.tick-u.firedAt>70 && u.fireAt<w.tick)return;
    const since = w.tick - u.firedAt;
    if(u.ammo>=0 && (isLineTroop(u)||isGuard(u)) && (u.loadedAt>w.tick+3 || u.kneelUntil>w.tick)){
        u.pose=u.loadedAt>w.tick?'kneelLoad':'kneel';return;
    }
    if (isArtillery(u)) u.pose = since < 14 ? 'recoil' : u.cooldown > 30 ? 'load' : 'aim';
    else if (u.fireAt > w.tick && u.fireAt - w.tick < 26) u.pose = 'aim';
    else if (since < 70 && !isMounted(u) && !isStandard(u)) u.pose = since < 6 ? 'aim' : 'load';
    else u.pose = 'stand';
}

function nearestEnemy(w: SimWorld, c: Company, filter?: (o: Company) => boolean) {
    let best: Company | undefined, bd = Infinity;
    for (const o of w.companies) {
        if (o.faction === c.faction || o.status === 'gone' || o.alive <= 0 || o.line === 5 || !w.sight.canSee(w,c,o) || (filter && !filter(o))) continue;
        const d = dist(c, o);
        if (d < bd) { bd = d; best = o; }
    }
    return { c: best, d: bd };
}
function pickTarget(w: SimWorld, c: Company) {
    const visible=(o:Company)=>{
        if(!w.sight.canSee(w,c,o))return false;
        if(isArtillery(c)){
            const dx=o.x-c.x,dy=o.y-c.y,d2=dx*dx+dy*dy||1;
            for(const g of layout.woods){
                const a=Math.max(0,Math.min(1,((g.x-c.x)*dx+(g.y-c.y)*dy)/d2));
                if((c.x+a*dx-g.x)**2+(c.y+a*dy-g.y)**2<g.r*g.r)return false;
            }
        }else if(!isMounted(c) && dist(c,o)>260 && behindCrest(o.x,o.y,o.faction))return false;
        return true;
    };
    const forced = w.companies[c.forced];
    if (forced && forced.status !== 'gone' && forced.alive > 0 && (forced.line!==5 || isMounted(c) && c.order==='charge') && visible(forced)) return forced;
    c.forced = -1;
    const reach = isArtillery(c) ? gunRange(w) : w.weather === 'fog' ? 1000 : 2600;
    let best: Company | undefined, score = Infinity;
    for (const o of w.companies) {
        if (o.faction === c.faction || o.status === 'gone' || o.alive <= 0 || o.line === 5) continue;
        const d = dist(c, o);
        if (d > reach || !visible(o)) continue;
        let s = d + Math.abs(o.homeY-c.homeY)*.48 + Math.abs(o.y - c.y) * (isArtillery(c) ? .2 : .9);
        if (isMounted(c)) {
            s *= o.status === 'rout' ? .45 : o.formation === 'square' ? 3 : isArtillery(o) ? .55 : o.status === 'shaken' ? .6 : o.formUntil > w.tick && w.tick-o.leftSquare>300 ? .5 : 1;
            if (inWoods(o.x, o.y) || inRect(layout.farm, o.x, o.y, 30)) s *= 5;
        } else if (isArtillery(c)) {
            s *= o.formation === 'square' || o.formation === 'column' ? .6 : isArtillery(o) ? .85 : 1;
            if (o.status === 'rout') s *= 2.5;
        } else if (o.status === 'rout') s *= 1.8;
        if (s < score) { score = s; best = o; }
    }
    return best;
}
function setFormation(w: SimWorld, c: Company, f: Formation) {
    if (c.formation === f || !unitTypes[c.kind].formation.allowed.includes(f)) return;
    if(f==='square' && w.tick-c.leftSquare<120)return;
    c.capacity=c.members.length; c.margin=0; c.lastShrink=w.tick;
    const squareChange=c.formation==='square' || f==='square';
    if(c.formation==='square')c.leftSquare=w.tick;
    if(f==='square')c.formedSquareAt=w.tick;
    c.formation = f;
    c.formUntil = w.tick + formationTicks(c,f,c.status==='shaken');
    c.files = filesFor(c, c.members.length);
    if(!squareChange){c.members.forEach((u,i)=>u.slot=i);return;}
    const free=c.members.map((_,i)=>{
        const [lat,dep]=slotOffset(c,i);
        return {i,x:c.x-lat*c.hy-dep*c.hx,y:c.y+lat*c.hx-dep*c.hy};
    });
    for(const u of c.members){
        let best=0,min=Infinity;
        for(let i=0;i<free.length;i++){
            const p=free[i],d=(p.x-u.x)**2+(p.y-u.y)**2;
            if(d<min){min=d;best=i;}
        }
        u.slot=free[best].i;free.splice(best,1);
    }
}
function compact(w:SimWorld,c:Company){
    const lost=c.members.length!==c.alive;
    if(lost)c.members=c.members.filter(u=>u.hp>0);
    if(!c.alive || c.status==='rout')return;
    const width=c.files, rows=Math.ceil(c.capacity/width);
    const shrink=c.formation!=='square' && width-2*c.margin>2 && w.tick-c.lastShrink>=90
        && (c.alive<=(width-2*c.margin)*rows*.7 || (lost && rows>1 && !c.members.some(u=>u.slot>=width*(rows-1))));
    if(!lost && !shrink)return;
    const occupied=new Map(c.members.map(u=>[u.slot,u]));
    function move(u:Soldier,slot:number){occupied.delete(u.slot);u.slot=slot;occupied.set(slot,u);w.slotMoves++;}
    if(c.formation==='square'){
        // 前边缺员，只由后边同列补上，其余三边保持原位。
        const side=Math.ceil(c.capacity/4);
        for(let j=0;j<side;j++){
            if(occupied.has(j))continue;
            const rear=occupied.get(3*side-j);
            if(rear)move(rear,j);
        }
        return;
    }
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
    c.contactId=-1;c.lastMelee=-9999; c.routs++; c.status = 'rout'; c.engaged = false; c.order = 'rally'; c.forced = -1;
    for (const u of c.members) { u.foe = -1; u.fireAt = -1; }
    if(!w.broken[c.faction] && c.line!==5){
        w.recentRouts=w.recentRouts.filter(r=>r.tick>=w.tick-300 && r.c!==c);
        w.recentRouts.push({tick:w.tick,c,x:c.x,y:c.y});
        const near=w.recentRouts.filter(r=>r.c.faction===c.faction && Math.hypot(r.x-c.x,r.y-c.y)<=500);
        if(near.length>=3){
            const x=near.reduce((a,r)=>a+r.x,0)/near.length,y=near.reduce((a,r)=>a+r.y,0)/near.length;
            w.say((c.faction?'联军':'法军')+(y<HEIGHT/3?'左翼':y>HEIGHT*2/3?'右翼':'中央')+'全面崩溃！',c.faction,x,y,3);
            w.recentRouts=w.recentRouts.filter(r=>!near.includes(r));
        }
    }
    if (quiet) return;
    if (isGuard(c)) {
        w.say(c.faction ? '近卫军退却了！整条战线为之一震' : '“近卫军退却了！”（La Garde recule!）恐慌在法军中蔓延', c.faction, c.x, c.y, 3);
        for (const o of w.companies) if (o.faction === c.faction) shake(o, 10);
    } else if (c.peak >= 8 && w.rng.next() < (isMounted(c) ? .5 : .7)) {
        w.say(`${c.name}${isMounted(c) ? '掉转马头逃离战场' : '丢下火枪，四散溃逃！'}`, c.faction, c.x, c.y, 1);
    }
    for (const o of w.companies) if (o !== c && o.faction === c.faction && o.status !== 'gone' && dist(o, c) < 380) shake(o, 5);
}

/** 连队大脑，每 6 帧轮询一次：士气、目标、队形、移动、开火。 */
export function updateCompany(w: SimWorld, c: Company) {
    if (c.status === 'gone') return;
    c.smoke=Math.max(0,c.smoke-(w.weather==="fog"?.012:.024));
    c.vx=c.vy=0; compact(w,c);
    if (c.alive <= 0) { c.status = 'gone'; c.engaged = false; return; }
    if(c.status==='rout'){
        // Keep the group marker attached to its surviving walkers during withdrawal.
        let x=0,y=0;for(const u of c.members){x+=u.x;y+=u.y;}
        c.x=x/c.members.length;c.y=y/c.members.length;
    }
    if(c.formation==='column' && c.formUntil<=w.tick && c.engaged)c.morale=Math.max(0,c.morale-.02);
    const wooded=inWoods(c.x,c.y);
    if(wooded && !c.wooded && w.tick>30)w.say(c.name+'退入树林',c.faction,c.x,c.y,1);
    c.wooded=wooded;
    c.engaged=w.tick-c.lastMelee<30;
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
    const breakAt = (isGuard(c) ? 12 : 18) - (g.trait === 'steadfast' && !isMounted(c) ? 5 : 0);
    if (c.status === 'rout') {
        if (w.broken[c.faction]) return;
        if (c.morale > 42 && near.d > 650 && c.alive >= Math.max(3, c.peak * .25) && c.rallied < 2) {
            c.status = 'shaken'; c.rallied++;c.rallies++; c.order = isMounted(c) ? 'rally' : 'hold';
            let mx = 0, my = 0; for (const u of c.members) { mx += u.x; my += u.y; }
            c.x = c.homeX = mx / c.members.length; c.y = c.homeY = my / c.members.length;
            c.hx = c.faction ? -1 : 1; c.hy = 0; if(isMounted(c))c.blownUntil=w.tick+450; if(c.formation!=='square')setFormation(w,c,isMounted(c)?'wedge':'line');
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
    if (isLineTroop(c) || isGuard(c)) {
        const sheltered = inRect(layout.farm, c.x, c.y, 20) || inWoods(c.x, c.y);
        let threat=false;
        for(const horse of w.companies){
            if(horse.faction===c.faction || !isMounted(horse) || horse.line===5 || horse.alive<4 || horse.status==='rout' || horse.status==='gone' || !w.sight.canSee(w,c,horse))continue;
            const distance=dist(c,horse),previous=c.cavalryDistances.get(horse.id)??distance;
            c.cavalryDistances.set(horse.id,distance);
            const moving=Math.hypot(horse.vx,horse.vy)>3;
            if(moving && (distance<250 || (distance<450 && previous-distance>8 && w.tick-c.leftSquare>=60))){
                c.lastHorse=w.tick;threat=true;
            }
        }
        if((threat || (w.director.plan.wantsSquare(c,w.tick) && w.tick-c.leftSquare>=60)) && !sheltered)setFormation(w,c,'square');
        else if(c.formation==='square' && w.tick-c.lastHorse>=240 && w.tick-c.formedSquareAt>=900)setFormation(w,c,'line');
        else if (c.formation !== 'square') setFormation(w, c, !sheltered && ((c.order==='advance' && d>600) || (c.order==='assault' && (c.formation==='column' || (d>350 && c.id%3===0)))) ? 'column' : 'line');
    }
    // ---- 移动目标 ----
    if(c.order==='assault' && w.noAssault[c.faction]){c.order='hold';c.assaultStage='idle';}
    if(c.order==='assault' && t && !isMounted(c) && c.formation!=='square'){
        if(c.assaultStage==='idle'){
            c.assaultStage='approach';c.freshAtStart=t.alive===t.peak && t.morale>60;
        }
        if(c.assaultStage==='approach' && d<=150){
            c.assaultStage='signal';c.assaultUntil=w.tick+24;
            const drummer=c.members.find(u=>u.hp>0&&!u.escaped);
            if(drummer)emit(w,'drum',drummer,0,0,false,c.x,c.y);
            w.say(c.name+'响起冲锋鼓',c.faction,c.x,c.y,1);
        }
        if(c.assaultStage==='signal' && w.tick===c.assaultUntil-12 && w.tick>=c.reloadAt)volley(w,c,t);
        if(c.assaultStage==='signal' && w.tick>=c.assaultUntil)c.assaultStage='rush';
    }else c.assaultStage='idle';
    if(isArtillery(c)){
        c.order='hold';
        if(!c.relocated){
            let sum=0,count=0;
            for(const p of w.companies)if(p.faction===c.faction && p.line===0 && p.alive && p.status!=='rout'){sum+=p.x;count++;}
            const front=sum/count, face=c.faction?-1:1;
            if(count && (front-c.initialFront)*face>600){
                c.homeX=front-face*170; c.limbered=true; c.relocated=true;c.deployUntil=w.tick+setupTicks(c);
            }
        }else if(c.limbered && Math.hypot(c.x-c.homeX,c.y-c.homeY)<2){
            c.limbered=false;c.deployUntil=w.tick+setupTicks(c);
        }
    }
    let gx = c.homeX, gy = c.homeY;
    const contact=(isMounted(c)?75:55)+(t?.formation==='square'?40:0);
    const range = isArtillery(c) ? gunRange(w) * .8 : MUSKET * .78;
    if(c.order==='rally' && isMounted(c))c.blownUntil=Math.max(c.blownUntil,c.contactAt+450);
    if (t && c.order === 'advance') {
        if (d > range) { const k = (d - range) / d; gx = c.x + (t.x - c.x) * k; gy = c.y + (t.y - c.y) * k; }
        else { gx = c.x; gy = c.y; }

    } else if (t && (c.order === 'assault' || c.order === 'charge')) {
        const separation=c.order==='assault'?c.assaultStage==='approach'?130:c.assaultStage==='signal'?d:24:contact-2;
        gx=t.x-(t.x-c.x)/Math.max(1,d)*separation;
        gy=t.y-(t.y-c.y)/Math.max(1,d)*separation;
        if(c.order==='charge' && c.chargeOpponent===t.id && t.formation==='square' && w.tick-c.chargeAt<90){
            gx-=(t.y-c.y)/Math.max(1,d)*15;gy+=(t.x-c.x)/Math.max(1,d)*15;
        }

    } else if (!t && (c.order === 'advance' || c.order === 'assault' || c.order === 'charge')) {
        // 雾中看不见敌人：朝敌方阵地方向摸索前进。
        const e = nearestEnemy(w, c).c;
        gx = c.x + (e ? Math.sign(e.x - c.x) : c.faction ? -1 : 1) * 160; gy = e ? c.y + Math.sign(e.y - c.y) * 40 : c.y;
    } else if (c.order === 'rally' && dist(c, { x: c.homeX, y: c.homeY }) < 40 && c.morale > 55) c.order = 'hold';
    if(c.order!=='charge' && c.assaultStage!=='rush' && Math.hypot(gx-c.x,gy-c.y)>80){
        const len=Math.hypot(gx-c.x,gy-c.y),dx=(gx-c.x)/len,dy=(gy-c.y)/len;
        for(const other of w.companies){
            if(other===c || other.faction!==c.faction || !other.alive || other.status==='rout')continue;
            const rx=other.x-c.x,ry=other.y-c.y,ahead=rx*dx+ry*dy,side=rx*dy-ry*dx;
            const width=Math.min(110,(c.files+other.files)*4+16);
            if(ahead<4 || ahead>120 || Math.abs(side)>=width)continue;
            const offset=(width-Math.abs(side))*(side>0?1:side<0?-1:c.id<other.id?1:-1);
            gx=c.x+dx*35-dy*offset;gy=c.y+dy*35+dx*offset;break;
        }
    }
    c.gx = gx; c.gy = gy;
    // ---- 行进：阵形中心不能跑得比士兵快太多 ----
    let lag = 0, mx = 0, my = 0;
    for (const u of c.members) { mx += u.x; my += u.y; }
    mx /= c.members.length; my /= c.members.length;
    // The anchor is at the front rank. Compare the group with its expected centroid.
    let sx=0,sy=0;
    for(const u of c.members){
        const [lat,depth]=slotOffset(c,u.slot);
        sx-=lat*c.hy+depth*c.hx;sy+=lat*c.hx-depth*c.hy;
    }
    lag = Math.hypot(mx-c.x-sx/c.members.length,my-c.y-sy/c.members.length);
    const mounted=isMounted(c);
    if(mounted && c.order==='charge' && d<250 && c.fatigue<.7 && w.tick>=c.sprintReady){
        c.sprintUntil=w.tick+PACE.sprintTicks;c.sprintReady=c.sprintUntil+450;
        c.fatigue=Math.min(1,c.fatigue+.12);
    }
    if(c.order!=='charge')c.sprintUntil=0;
    let speed=c.sprintUntil>w.tick?PACE.horseSprint:c.assaultStage==='rush'?PACE.footRush:c.speed;
    if(c.formation==='square')speed*=.55;
    speed*=movementAt(c.x,c.y)*(1-PACE.maxFatiguePenalty*c.fatigue);
    if(c.limbered && w.tick<c.deployUntil)speed=0;
    if (c.formUntil > w.tick && c.formation !== 'column') speed *= .3;
    const gd = Math.hypot(gx - c.x, gy - c.y);
    if (gd > 1 && lag < 95) {
        const step = Math.min(gd, speed * Math.min(1,(95-lag)/28) * 6 / 30);
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
    if(c.order!=='charge' && c.order!=='assault')c.chargeOpponent=-1;
    if (!t) return;
    // ---- 接敌 ----

    if(c.assaultStage==='rush' && d<=62){
        c.assaultStage='melee';
        c.contactId=t.id;c.contactAt=w.tick;t.contactId=c.id;t.contactAt=w.tick;
        w.charges.push({tick:w.tick,company:c.id,target:t.id,fresh:c.freshAtStart,outcome:'melee'});
    }
    if(c.assaultStage==='melee' && (t.status==='rout'||t.status==='gone'||d>150)){
        c.assaultStage='idle';c.assaultReady=w.tick+720;
        c.homeX=c.x;c.homeY=c.y;c.order='hold';c.forced=-1;
    }
    if ((c.order === 'assault' || c.order === 'charge') && d < contact && t.status !== 'rout' && c.chargeOpponent!==t.id) {
        c.chargeOpponent=t.id;c.contactId=t.id;c.contactAt=w.tick;t.contactId=c.id;t.contactAt=w.tick;c.chargeAt=w.tick;

        if(isArtillery(t) && t.morale<18 && t.status!=='gone' && t.alive>0){
            c.captures++;rout(w,t,true);w.say(c.name+'夺取了敌军炮位',c.faction,t.x,t.y,2);
        }
    }
    const contactCompany=w.companies[c.chargeOpponent>=0?c.chargeOpponent:c.contactId];
    const opponent=contactCompany && w.sight.canSee(w,c,contactCompany)?contactCompany:undefined;
    if(c.engaged && opponent && (w.tick-c.chargeAt)%18<6)meleePressure(w,c,opponent);
    if(isMounted(c) && c.order==='charge' && c.chargeOpponent>=0 && (w.tick-c.chargeAt>200 || opponent?.status==='gone' || opponent?.status==='rout' || (opponent?.formation==='square' && w.tick-c.chargeAt>=72))){
        const retreatX=opponent?c.x-opponent.x:-c.hx, retreatY=opponent?c.y-opponent.y:-c.hy;
        const length=Math.hypot(retreatX,retreatY)||1;
        c.homeX=Math.max(80,Math.min(WIDTH-80,c.x+retreatX/length*760));c.homeY=Math.max(80,Math.min(HEIGHT-80,c.y+retreatY/length*760));
        c.blownUntil=w.tick+450;c.engaged=false;c.contactId=-1;c.lastMelee=-9999;c.order='rally';c.forced=-1;
        for(const u of c.members)u.foe=-1;
    }
    if (!c.engaged && (c.order === 'assault' || c.order === 'charge') && t.status === 'rout' && d < 220 && !isMounted(c)) {
        c.order = 'hold'; c.homeX = c.x; c.homeY = c.y;
    }
    // ---- 开火 ----
    if (isArtillery(c)) {
        if (!c.limbered && w.tick>=c.deployUntil && lag < 30 && gd < 5) for (const gun of c.members) if (gun.hp > 0 && !gun.cooldown && !gun.moving) {
            const gt = d < CANISTER ? t : pickTarget(w, c) ?? t;
            if (dist(gun, gt) < gunRange(w)) gunFire(w, gun, c, gt);
        }
    } else if (!isMounted(c) && c.assaultStage!=='rush' && c.assaultStage!=='melee' && !c.engaged && d < MUSKET && w.tick >= c.reloadAt && c.order !== 'charge' && t.status !== 'rout') {
        volley(w, c, t);
    } else if (!isMounted(c) && c.assaultStage!=='rush' && c.assaultStage!=='melee' && !c.engaged && t.status === 'rout' && d < MUSKET && w.tick >= c.reloadAt) {
        volley(w, c, t);
    }
}
/** 混战中的意志较量：吃亏的一方士气持续下滑。 */
function meleePressure(w: SimWorld, a: Company, b: Company) {
    const square = (c: Company) => c.formation === 'square' && c.formUntil <= w.tick;
    const power = (c: Company, o: Company) => c.alive * (isMounted(c) ? (square(o) ? .5 : 1.6) : isGuard(c) ? 1.4 : 1)
        * (.4 + c.morale / 100) * (square(c) ? 1.6 : 1) * (inRect(layout.farm, c.x, c.y, 20) ? 1.8 : 1);
    const pa = power(a, b), pb = power(b, a), loser = pa < pb ? a : b, ratio = Math.max(pa, pb) / Math.max(.1, Math.min(pa, pb));
    shake(loser, Math.min(6, 1.2 * ratio));
}
function updateStaff(w: SimWorld, c: Company, threat: number) {
    const g = w.generals[c.faction], face = c.faction ? -1 : 1;
    // 地图有三片交战区。以前把三处横坐标和纵坐标全部平均，指挥标志容易落在两处战区之间。
    const sector=w.plans[c.faction].mainEffort;
    let lead:Company|undefined;
    for(const unit of w.companies){
        if(unit.faction!==c.faction || unit.sector!==sector || unit.line>1 || !unit.alive || unit.status==='gone' || unit.status==='rout')continue;
        if(!lead || (unit.x-lead.x)*face>0)lead=unit;
    }
    if(lead){
        c.homeX=Math.max(80,Math.min(WIDTH-80,lead.x-face*1090));
        c.homeY=lead.y;
    }
    if (threat < 300) { c.homeX -= face * 18; c.homeX = Math.min(WIDTH - 80, Math.max(80, c.homeX)); }
    const gd = Math.hypot(c.homeX - c.x, c.homeY - c.y);
    if (gd > 1) { const s = Math.min(gd, c.speed * 6 / 30); c.vx=(c.homeX-c.x)/gd*s*5; c.vy=(c.homeY-c.y)/gd*s*5; }
    else { c.vx=0;c.vy=0; }
    c.hx = face; c.hy = 0;
    if (!g.alive && c.alive > 0 && threat > 900) c.order = 'hold';
}
