import {ignite} from './environment';
import { UNITS, shelter,rankFire } from './config';
import { indexAt } from './grid';
import { WIDTH, HEIGHT } from './maps';
import type { Faction, Kind, Point, Projectile, Structure, Unit } from './types';
import type { SimWorld } from './world';
const has = (kind: Kind, t: Parameters<typeof UNITS[Kind]['traits']['includes']>[0]) => UNITS[kind].traits.includes(t);
export const distanceTo = (u: Point, t: Unit | Structure) => 'w' in t ? Math.hypot(Math.max(0, Math.abs(u.x - t.x) - t.w / 2), Math.max(0, Math.abs(u.y - t.y) - t.h / 2)) : Math.hypot(u.x - t.x, u.y - t.y);
export function kill(w: SimWorld, u: Unit, f: Faction, kind: Kind) {
    if (u.hp === -9999)
        return;
    u.hp = -9999;
    if(u.gun){const gun=w.byUnit.get(u.gun);if(gun)gun.crew=Math.max(0,(gun.crew??1)-1);}
    w.dead[u.faction]++;
    if (f !== u.faction){
        w.stats[f][kind].kills++;
        if(w.mode==='lord') w.realms[f].gold+=u.kind==='peasant'?14:3;
        if(u.kind==='peasant'){
            w.realms[f].farmersKilled++;
            w.news=u.faction===0?'敌骑突袭！法军农夫惨遭英军屠戮！':'血洗资源点：英军农夫已被斩杀！';
            w.drops.push({x:u.x,y:u.y,resource:u.resource??'gold',amount:Math.max(3,Math.floor((u.cargo??0)/2))});
        }
    }
    if(u.kind==='supply_wagon')for(let i=0;i<8;i++)w.drops.push({x:u.x+(i%4-1.5)*11,y:u.y+(i<4?-7:7),resource:'gold',amount:10});
    if(u.commandRole==='flag') w.news=u.faction===0?'法军仪仗掌旗官惨遭斩首！法军王旗坠入血泊！':'英军掌旗官被斩首，血旗坠地！';
    w.events.push({
        type: 'death',flag:u.commandRole==='flag', x: u.x, y: u.y, z: u.z, faction: u.faction, kind: u.kind, dx: u.vx, dy: u.vy
    });
}
export function launch(w: SimWorld, u: Unit, dx: number, dy: number, strength: number) {
    if (u.hp <= 0 || u.tower || u.gun || has(u.kind,"siege"))
        return;
    const k = strength / ((u.auraUntil??-1)>=w.tick?1.4:1) / (has(u.kind, 'brace') ? 2.6 : 1) / (u.formation === 'square' ? 1.75 : 1);
    u.vx = dx * k;
    u.vy = dy * k;
    u.vz = Math.max(u.vz, k * .9);
    u.z = Math.max(u.z, 1);
    w.launches[u.faction]++;
    w.events.push({ type: 'launch', x: u.x, y: u.y, kind: u.kind, power: k });
}
export function hit(w: SimWorld, u: Unit, f: Faction, kind: Kind, raw: number, dx: number, dy: number, force = 0, arrow = false) {
    if (u.hp <= 0)
        return;
    let dmg = raw * (1 - Math.min(.9,UNITS[u.kind].armor) * (1 - UNITS[kind].penetration));
    if(u.tower){if(has(kind,'mount')&&kind!=='dragoon')return;dmg*=.35;}
    if(has(u.kind,'siege')&&has(kind,'powder')&&w.structures.some(s=>s.type==='redoubt'&&s.faction===u.faction&&s.hp>0&&!s.needed&&distanceTo(u,s)<80))dmg*=.55;
    if(u.kind==='rifleman'&&w.grid.nearTree[indexAt(u.x,u.y)]&&!has(kind,'siege'))dmg*=.68;
    if(kind==='rocket_crew')u.morale=Math.max(0,(u.morale??75)-35);
    if(kind==='rifleman'&&w.rng.next()<.24)dmg*=2;
    if((arrow||has(kind,'powder')&&!has(kind,'siege')) && has(u.kind, 'shield') && dx * u.face < 0) {
        dmg *= .4;
        w.events.push({ type: 'block', x: u.x, y: u.y });
    }
    if (has(kind, 'brace') && has(u.kind, 'mount'))
        dmg *= 2.8;
    w.stats[f][kind].damage += Math.min(u.hp, dmg);
    u.hp -= dmg;
    u.morale=Math.max(0,(u.morale??75)-Math.min(16,Math.ceil(dmg/8)));
    u.lastAttacker = f;
    u.lastKind = kind;
    w.events.push({
        type: 'hit', x: u.x, y: u.y, z: u.z, dx, dy, kind, unitId: u.id
    });
    if (u.hp <= 0)
        kill(w, u, f, kind);
    else if (force)
        launch(w, u, dx, dy, force);
}
function siegeImpact(w: SimWorld, p: Projectile, r: number) {
    w.events.push({ type: 'impact', x: p.x, y: p.y, kind: p.source, power: r / 10 });
    w.hash.visit(p.x, p.y, r, u => {
        if (u.faction === p.faction || u.tower)
            return;
        const dx = u.x - p.x, dy = u.y - p.y, len = Math.hypot(dx, dy) || 1;
        hit(w, u, p.faction, p.source, p.damage * (1 - .45 * len / r), dx / len, dy / len, 10 + w.rng.next() * 6);
    });
    for (const s of w.structures)
        if (s.hp > 0 && distanceTo(p, s) < r && s.faction !== p.faction)
            w.damageStructure(s, p.damage, p.faction, p.source);
}
export function attack(w: SimWorld, u: Unit, t: Unit | Structure) {
    const def = UNITS[u.kind], lx = t.x - u.x, ly = t.y - u.y, len = Math.hypot(lx, ly) || 1, dx = lx / len, dy = ly / len;
    if(u.crew===0)return;
    u.firedAt=w.tick;
    u.swing = 6;
    u.cooldown=Math.round(def.reload*(w.realms[u.faction].powder&&has(u.kind,'powder')&&!has(u.kind,'siege')?.82:1));
    const close=!u.tower&&distanceTo(u,t)<36;
    if(close&&['火枪','步兵'].includes(def.role)&&!has(u.kind,'mount')&&u.kind!=='sapper'){
        u.pose='bayonet';u.cooldown=22;
        const thrust=(u.kind==='highlander'?54:u.kind==='guard_grenadier'?46:25)*(w.realms[u.faction].steel?1.3:1);
        if('kind' in t)hit(w,t,u.faction,u.kind,thrust,dx,dy);
        else{
            const defender=w.units.find(n=>n.tower===t.id&&n.hp>0);
            if(defender)hit(w,defender,u.faction,u.kind,thrust/.35,dx,dy);
            w.damageStructure(t,thrust,u.faction,u.kind);
            if(u.kind==='guard_grenadier'&&(u.grenadeAt??0)<=w.tick){u.grenadeAt=w.tick+165;w.damageStructure(t,90,u.faction,u.kind);ignite(w,t,u.faction,u.kind);}
        }
        w.events.push({type:'slash',x:u.x+dx*10,y:u.y+dy*8,kind:u.kind});return;
    }
    if('w' in t&&def.traits.includes('flank')&&(t.type==='house'||t.type==='wheat'))ignite(w,t,u.faction,u.kind);
    if (def.range > 50) {
        const grenade=u.kind==='guard_grenadier'&&(u.formation!=='line'||'w' in t)&&len<175&&(u.grenadeAt??0)<=w.tick;
        if(grenade)u.grenadeAt=w.tick+165;
        const kind:Projectile['kind']=grenade?'flask':u.kind==='howitzer'?'stone':u.kind==='rocket_crew'?'rocket':has(u.kind,'rolling')?(len<190?'pellet':'ball'):has(u.kind,'scatter')?'pellet':'bullet';
        const ticks = Math.max(2, Math.ceil(len / (['spear','pellet','bolt'].includes(kind)?48:kind === 'bullet' ? 42 : kind === 'ball' ? 32 : kind === 'stone' ? 24 : 18)));
        const z = u.tower ? u.z : kind === 'stone' ? 18 : 10, gravity = ['spear','pellet','bolt','bullet'].includes(kind) ? 0 : kind === 'ball' ? .23 : kind === 'stone' ? .32 : .38;
        // 火枪低精度与列阵密集弹幕增益：散兵射偏且低伤，严整列队齐射打出密集弹幕爆发伤害！
        let dmg = def.damage, aimX = lx, aimY = ly;
        if (kind === 'bullet' && def.role === '火枪' && !u.tower) {
            let peers = 0;
            w.hash.visit(u.x, u.y, 46, n => {
                if (n.id !== u.id && n.faction === u.faction && n.hp > 0 && UNITS[n.kind].role === '火枪')
                    peers++;
            });
            const formed = peers >= 3 && u.formation==='line' && rankFire(u.kind);
            const isSniper = u.kind === 'rifleman';
            const spread = isSniper ? (formed ? .04 : .12) : formed ? .11 : .30;
            const angle = Math.atan2(ly, lx) + (w.rng.next() - .5) * 2 * spread;
            const shotDist = Math.max(len * 1.18, def.range * .95);
            aimX = Math.cos(angle) * shotDist;
            aimY = Math.sin(angle) * shotDist;
            dmg = formed ? def.damage * 1.55 : def.damage * .55;
        }
        const flightTicks = kind === 'bullet' ? Math.max(3, Math.ceil(Math.hypot(aimX, aimY) / 40)) : ticks;
        const projectile: Projectile = {
            id: w.next++, kind, faction: u.faction, source: u.kind, damage: dmg, x: u.x, y: u.y, z, vx: aimX / flightTicks, vy: aimY / flightTicks, vz: (-z / flightTicks) + gravity * (flightTicks + 1) / 2, gravity, remaining: flightTicks, bounces: kind === 'ball' ? w.rng.int(2, 3) : 0, target: t.id, hit: []
        };
        if(kind==='pellet'){
            const refined=has(u.kind,'siege')&&w.realms[u.faction].grape;
            const count=refined?12:6;
            for(let i=0;i<count;i++){
                const side=(i-(count-1)/2)*len*.045;
                w.projectiles.push({...projectile,id:w.next++,vx:(lx-dy*side)/ticks,vy:(ly+dx*side)/ticks,hit:[]});
            }
        }else w.projectiles.push(projectile);
        w.events.push({
            type: 'fire',unitId:u.id, x: u.x, y: u.y, z, dx, dy, kind: u.kind
        });
        return;
    }
    w.events.push({ type: 'slash', x: u.x + dx * 9, y: u.y + dy * 8, dx, dy, kind: u.kind });
    let charged = has(u.kind, 'charge') && u.charge >= 26;
    if ('w' in t) {
        if (charged && t.type === 'palisade') {
            hit(w, u, t.faction === 1 ? 1 : 0, 'sapper', 160, -dx, -dy, 7);
            u.charge = 0;
        }
        if(u.kind==='sapper'&&t.type!=='tree'){
            w.barrels.push({x:u.x+dx*16,y:u.y+dy*16,due:w.tick+50,faction:u.faction});
        }else w.damageStructure(t,def.damage*(u.kind==='sapper'&&t.type==='tree'?4:1),u.faction,u.kind);
        return;
    }
    let bracedInfantry=false;
    if(t.formation==='square'&&rankFire(t.kind)&&(w.groups.get(t.group)?.count??0)>=8){
        w.hash.visit(t.x,t.y,38,n=>{if(n.id!==t.id&&n.group===t.group&&n.formation==='square'&&!n.tower)bracedInfantry=true;});
    }
    if(has(u.kind,'mount')&&bracedInfantry){
        hit(w,u,t.faction,t.kind,180*(w.realms[t.faction].steel?1.3:1),-dx,-dy,9);u.charge=0;return;
    }
    const chargeDmg = charged ? (bracedInfantry ? .55 : 1.75) : 1;
    const chargeForce = charged ? (bracedInfantry ? 0 : UNITS[t.kind].role === '火枪' ? 12 : 9) : has(u.kind, 'cleave') ? 3 : 0;
    hit(w, t, u.faction, u.kind, def.damage * chargeDmg*(u.kind==='lancer'&&has(t.kind,'mount')?1.55:1), dx, dy, chargeForce);
    if (charged || has(u.kind, 'cleave'))
        w.hash.visit(t.x, t.y, charged ? (bracedInfantry ? 24 : 56) : 24, n => { if (n.id !== t.id && n.faction !== u.faction && !n.tower) {
            const isGunner = UNITS[n.kind].role === '火枪';
            hit(w, n, u.faction, u.kind, def.damage * (bracedInfantry ? .35 : isGunner ? 1.05 : .75), dx, dy, charged ? (bracedInfantry ? 0 : isGunner ? 12 : 8) : 3);
        } });
    u.charge = 0;
}
export function updateProjectiles(w: SimWorld) {
    for (const p of w.projectiles) {
        const ox = p.x, oy = p.y, startZ = p.z;
        p.x += p.vx;
        p.y += p.vy;
        p.vz -= p.gravity;
        p.z += p.vz;
        p.remaining--;
        const speed = Math.hypot(p.vx, p.vy) || 1, dx = p.vx / speed, dy = p.vy / speed;
        if(p.kind==='spear'||p.kind==='pellet'||p.kind==='bolt'||p.kind==='bullet'){
            const steps=Math.max(1,Math.ceil(speed/8));
            for(let i=1;i<=steps&&p.remaining!==-999;i++){
                const x=ox+p.vx*i/steps,y=oy+p.vy*i/steps;
                const wall=w.byStructure.get(w.grid.blockers[indexAt(x,y)]);
                if(wall&&wall.hp>0&&wall.faction!==p.faction&&!['bridge','pontoon'].includes(wall.type)){
                    if(shelter(wall.type)){
                        const defenders=w.units.filter(n=>n.tower===wall.id&&n.hp>0);
                        if(defenders.length)hit(w,defenders[p.id%defenders.length],p.faction,p.source,p.damage,dx,dy);
                    }
                    w.damageStructure(wall,p.damage*(shelter(wall.type)?.05:1),p.faction,p.source);p.remaining=-999;break;
                }
                w.hash.visit(x,y,p.kind==='bullet'?10:12,u=>{
                    if(u.hp<=0||u.faction===p.faction||u.tower||p.hit.includes(u.id)||p.remaining===-999) return;
                    p.hit.push(u.id);hit(w,u,p.faction,p.source,p.damage,dx,dy,p.kind==='spear'?10:p.kind==='bullet'?4:0,p.kind==='bolt');
                    if(p.kind!=='spear'||p.hit.length>=8) p.remaining=-999;
                });
            }
            if(p.remaining<=0)p.remaining=-999;
            continue;
        }
        if (p.kind === 'ball' || p.kind === 'arrow') {
            const steps = Math.max(1, Math.ceil(speed / 7));
            for (let i = 1; i <= steps; i++) {
                const x = ox + p.vx * i / steps, y = oy + p.vy * i / steps, z = startZ + (p.z - startZ) * i / steps;
                const s = w.byStructure.get(w.grid.blockers[indexAt(x, y)]);
                if (s && s.hp > 0 && s.faction !== p.faction && s.type !== 'bridge' && s.type !== 'pontoon' &&
                    ((p.kind === 'ball' && z < 25) || (p.kind === 'arrow' && z < 24 && ((s.type === 'tree' && w.rng.next() < .18) || s.id === p.target)))) {
                    w.damageStructure(s, p.damage, p.faction, p.source);
                    p.remaining = -999;
                    break;
                }
                if (p.kind === 'ball' && z < 30) {
                    w.hash.visit(x, y, 15, u => { if (u.faction === p.faction || p.hit.includes(u.id) || u.tower)
                        return; p.hit.push(u.id); hit(w, u, p.faction, p.source, p.damage, dx, dy, 8); });
                }
            }
        }
        if (p.remaining === -999) {
            if (p.kind === 'ball')
                siegeImpact(w, p, 28);
            continue;
        }
        if (p.remaining <= 0 || p.z <= 0) {
            if(p.kind==='rocket'||p.kind==='flask'){siegeImpact(w,p,p.kind==='rocket'?85:52);ignite(w,p,p.faction,p.source);}
            else if (p.kind === 'stone')
                siegeImpact(w, p, 83);
            else if (p.kind === 'ball') {
                siegeImpact(w, p, 29);
                if (p.bounces-- > 0 && p.x > 20 && p.x < WIDTH - 20 && p.y > 20 && p.y < HEIGHT - 20) {
                    p.z = 1;
                    p.vz = 2.7 + p.bounces * .4;
                    p.remaining = Math.ceil(p.vz * 2 / p.gravity);
                    p.vx *= .82;
                    p.vy *= .82;
                    continue;
                }
            }
            else {
                const t = w.byUnit.get(p.target), s = w.byStructure.get(p.target);
                if (t && t.hp > 0 && Math.hypot(t.x - p.x, t.y - p.y) < 32)
                    hit(w, t, p.faction, p.source, p.damage, dx, dy, 0, p.kind === 'arrow');
                else if (s && s.hp > 0)
                    w.damageStructure(s, p.damage, p.faction, p.source);
                if (p.kind === 'arrow')
                    w.events.push({ type: 'arrowland', x: p.x, y: p.y, dx, dy });
            }
            p.remaining = -999;
        }
    }
    w.projectiles = w.projectiles.filter(p => p.remaining !== -999 && p.x >= 0 && p.x < WIDTH && p.y >= 0 && p.y < HEIGHT);
}
