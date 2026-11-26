import {ignite} from './environment';
import { UNITS } from './config';
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
    w.dead[u.faction]++;
    if (f !== u.faction){
        w.stats[f][kind].kills++;
        if(w.mode==='lord') w.realms[f].gold+=u.kind==='peasant'?14:3;
        if(u.kind==='peasant'){
            w.realms[f].farmersKilled++;
            w.news=u.faction===0?'敌骑突袭！铁冠农夫惨遭赤棘屠戮！':'血洗资源点：赤棘农夫已被斩杀！';
            w.drops.push({x:u.x,y:u.y,resource:u.resource??'gold',amount:Math.max(3,Math.floor((u.cargo??0)/2))});
        }
    }
    if(u.kind==='bannerman') w.news=u.faction===0?'铁冠仪仗掌旗官惨遭斩首！铁冠王旗坠入血泊！':'赤棘掌旗官被斩首，血旗坠地！';
    w.events.push({
        type: 'death', x: u.x, y: u.y, z: u.z, faction: u.faction, kind: u.kind, dx: u.vx, dy: u.vy
    });
}
export function launch(w: SimWorld, u: Unit, dx: number, dy: number, strength: number) {
    if (u.hp <= 0 || u.tower)
        return;
    const k = strength / ((u.auraUntil??-1)>=w.tick?1.4:1) / (has(u.kind, 'brace') ? 2.6 : 1) / (u.formation === 'phalanx' ? 1.75 : 1);
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
    let dmg = raw * (1 - Math.min(.9,UNITS[u.kind].armor*(w.realms[u.faction].steel?1.1:1)) * (1 - UNITS[kind].penetration));
    if(w.realms[f].powder&&(has(kind,'powder')||has(kind,'siege'))) dmg*=1.2;
    if(u.kind==='battering_ram' && (arrow||kind==='crossbowman'||kind==='blunderbuss')) dmg*=.2;
    if(kind==='ballista'&&u.kind==='war_elephant') dmg*=1.65;
    if(kind==='pikeman'&&has(u.kind,'mount')) {dmg*=2.2;u.charge=0;}
    if (arrow && has(u.kind, 'shield') && dx * u.face < 0) {
        dmg *= .45;
        w.events.push({ type: 'block', x: u.x, y: u.y });
    }
    if (has(kind, 'brace') && has(u.kind, 'mount'))
        dmg *= 2.8;
    w.stats[f][kind].damage += Math.min(u.hp, dmg);
    u.hp -= dmg;
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
            w.damageStructure(s, p.damage * (p.kind === 'stone' ? 3 : 1.6), p.faction, p.source);
}
export function attack(w: SimWorld, u: Unit, t: Unit | Structure) {
    const def = UNITS[u.kind], lx = t.x - u.x, ly = t.y - u.y, len = Math.hypot(lx, ly) || 1, dx = lx / len, dy = ly / len;
    u.face = dx < 0 ? -1 : 1;
    u.swing = 6;
    const fury=has(u.kind,'rage')?1+.8*(1-u.hp/def.hp):1;
    u.cooldown=def.reload/fury;
    if (u.formation === 'line' && (u.kind === 'musketeer' || u.kind === 'bowman'))
        u.cooldown = def.reload - ((w.tick + u.slot % 3 * 3) % def.reload);
    if((u.auraUntil??-1)>=w.tick) u.cooldown/=1.2;
    if (def.range > 50) {
        const kind = has(u.kind,'pierce')?'spear':has(u.kind,'salvo')?'rocket':has(u.kind,'scatter')?'pellet':has(u.kind,'ignite')?'flask':has(u.kind,'bolt')?'bolt':u.kind === 'musketeer' ? 'bullet' : u.kind === 'catapult' ? 'stone' : u.kind === 'field_cannon' ? 'ball' : 'arrow';
        const ticks = Math.max(2, Math.ceil(len / (['spear','pellet','bolt'].includes(kind)?48:kind === 'bullet' ? 42 : kind === 'ball' ? 12 : kind === 'stone' ? 9 : 12)));
        const z = u.tower ? 46 : kind === 'stone' ? 18 : 10, gravity = ['spear','pellet','bolt','bullet'].includes(kind) ? 0 : kind === 'ball' ? .23 : kind === 'stone' ? .48 : .38;
        const projectile: Projectile = {
            id: w.next++, kind, faction: u.faction, source: u.kind, damage: def.damage, x: u.x, y: u.y, z, vx: lx / ticks, vy: ly / ticks, vz: (-z / ticks) + gravity * (ticks + 1) / 2, gravity, remaining: ticks, bounces: kind === 'ball' ? w.rng.int(2, 3) : 0, target: t.id, hit: []
        };
        if(kind==='pellet'||kind==='rocket'){
            const count=kind==='rocket'?14:7;
            for(let i=0;i<count;i++){
                const side=kind==='rocket'?w.rng.int(-82,82):((i-3)/3)*len*.29;
                const along=kind==='rocket'?w.rng.int(-70,70):0;
                w.projectiles.push({...projectile,id:w.next++,vx:(lx+dx*along-dy*side)/ticks,vy:(ly+dy*along+dx*side)/ticks,hit:[]});
            }
        }else {
            if(kind==='spear'){projectile.remaining=Math.ceil((def.range+60)/Math.max(1,Math.hypot(projectile.vx,projectile.vy)));projectile.vz=0;}
            w.projectiles.push(projectile);
        }
        w.events.push({
            type: 'fire', x: u.x, y: u.y, z, dx, dy, kind: u.kind
        });
        return;
    }
    w.events.push({ type: 'slash', x: u.x + dx * 9, y: u.y + dy * 8, dx, dy, kind: u.kind });
    let charged = has(u.kind, 'charge') && u.charge >= 36;
    if(charged&&'kind' in t&&t.kind==='pikeman'&&t.face*dx<0){u.charge=0;charged=false;hit(w,u,t.faction,t.kind,UNITS.pikeman.damage,-dx,-dy);if(u.hp<=0)return;}
    if ('w' in t) {
        if (charged && t.type === 'palisade') {
            hit(w, u, t.faction === 1 ? 1 : 0, 'halberdier', 160, -dx, -dy, 7);
            u.charge = 0;
        }
        if(u.kind==='sapper'&&t.type!=='tree'){
            w.barrels.push({x:u.x+dx*16,y:u.y+dy*16,due:w.tick+50,faction:u.faction});
        }else w.damageStructure(t,def.damage*fury*(u.kind==='battering_ram'?4:u.kind==='berserker'&&['pontoon','palisade'].includes(t.type)?2:1),u.faction,u.kind);
        return;
    }
    if (charged && has(t.kind, 'brace') && t.formation === 'phalanx' && t.face * dx < 0) {
        hit(w, u, t.faction, t.kind, 999, -dx, -dy, 8);
        u.charge = 0;
        return;
    }
    if(has(u.kind,'sweep')||has(u.kind,'stomp')){
        let count=1;
        w.hash.visit(u.x,u.y,has(u.kind,'stomp')?69:54,n=>{
            if(n.id===t.id||n.faction===u.faction||n.tower||n.hp<=0||(n.x-u.x)*dx+(n.y-u.y)*dy<0) return;
            if(u.kind==='zweihander'&&count>=4) return;
            count++;hit(w,n,u.faction,u.kind,def.damage,dx,dy,u.kind==='war_elephant'?15:2);
        });
    }
    hit(w, t, u.faction, u.kind, def.damage * fury * (charged ? 1.6 : 1), dx, dy, u.kind==='war_elephant'?16:charged ? 9 : has(u.kind, 'cleave') ? 3 : 0);
    if (charged || has(u.kind, 'cleave'))
        w.hash.visit(t.x, t.y, charged ? 46 : 24, n => { if (n.id !== t.id && n.faction !== u.faction && !n.tower)
            hit(w, n, u.faction, u.kind, def.damage * .75, dx, dy, charged ? 10 : 3); });
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
        if(p.kind==='spear'||p.kind==='pellet'||p.kind==='bolt'){
            const steps=Math.max(1,Math.ceil(speed/8));
            for(let i=1;i<=steps&&p.remaining!==-999;i++){
                const x=ox+p.vx*i/steps,y=oy+p.vy*i/steps;
                const wall=w.byStructure.get(w.grid.blockers[indexAt(x,y)]);
                if(wall&&wall.hp>0&&wall.faction!==p.faction&&!['bridge','pontoon'].includes(wall.type)){
                    w.damageStructure(wall,p.damage,p.faction,p.source);p.remaining=-999;break;
                }
                w.hash.visit(x,y,12,u=>{
                    if(u.hp<=0||u.faction===p.faction||p.hit.includes(u.id)||p.remaining===-999) return;
                    p.hit.push(u.id);hit(w,u,p.faction,p.source,p.damage,dx,dy,p.kind==='spear'?10:0,p.kind==='bolt');
                    if(p.kind!=='spear'||p.hit.length>=8) p.remaining=-999;
                });
            }
            if(p.remaining<=0)p.remaining=-999;
            continue;
        }
        if (p.kind === 'bullet' || p.kind === 'ball' || p.kind === 'arrow') {
            const steps = Math.max(1, Math.ceil(speed / 7));
            for (let i = 1; i <= steps; i++) {
                const x = ox + p.vx * i / steps, y = oy + p.vy * i / steps, z = startZ + (p.z - startZ) * i / steps;
                const s = w.byStructure.get(w.grid.blockers[indexAt(x, y)]);
                if (s && s.hp > 0 && s.faction !== p.faction && s.type !== 'bridge' && s.type !== 'pontoon' &&
                    (p.kind === 'bullet' || (p.kind === 'ball' && z < 25) || (p.kind === 'arrow' && z < 24 && ((s.type === 'tree' && w.rng.next() < .18) || s.id === p.target)))) {
                    w.damageStructure(s, p.damage * (p.kind === 'ball' ? 2 : 1), p.faction, p.source);
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
            if(p.kind==='rocket'||p.kind==='flask'){siegeImpact(w,p,p.kind==='rocket'?38:52);ignite(w,p,p.faction,p.source);}
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
                    hit(w, t, p.faction, p.source, p.damage, dx, dy, p.kind === 'bullet' ? 6 : 0, p.kind === 'arrow');
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
