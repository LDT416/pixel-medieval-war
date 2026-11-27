import {artillery as isArtillery, guard as isGuard, lineTroop as isLineTroop, mounted as isMounted} from './units/abilities';
import type { Company, Faction } from './arenaTypes';
import type { SimWorld } from './world';
import { inRect, inWoods, layout, WIDTH } from './maps';
import { MUSKET, dist } from './combat';
import { CommandPlan } from './commandPlan';

const CANNONADE = { aggressive: 330, cunning: 560, steadfast: 650, cautious: 900 };
const ASSAULT = { aggressive: 58, cunning: 50, steadfast: 44, cautious: 36 };
const EAGER = { aggressive: 1, cunning: 1.1, steadfast: 1.7, cautious: 1.9 };

/** 两军各自的“总司令”：决定炮火准备多久、何时全线推进、骑兵何时出击、近卫军何时押上。 */
export class Director {
    readonly plan=new CommandPlan();
    cannonadeEnd: [number, number] = [0, 0];
    secondWave: [number, number] = [0, 0];
    advanced: [boolean, boolean] = [false, false];
    reset(w: SimWorld) {
        this.plan.reset();
        for (const f of [0, 1] as const) {
            const trait = w.generals[f].trait;
            this.cannonadeEnd[f] = w.posture[f] === 'attack' ? w.deployEnd+CANNONADE[trait] + w.rng.int(0, 240) : 0;
            this.secondWave[f] = 0;
            this.advanced[f]=false;
        }
    }
    update(w: SimWorld) {
        for (const f of [0, 1] as const) if (!w.broken[f] && w.legacySide!==f){
            if((w.tick-w.deployEnd-1)%300===0)this.plan.review(w,f);
            this.army(w,f);
        }
    }
    private army(w: SimWorld, f: Faction) {
        const g = w.generals[f], trait = g.trait, attack = w.posture[f] === 'attack', face = f ? -1 : 1;
        const own = w.companies.filter(c => c.faction === f && c.alive>0 && c.status !== 'gone' && !w.logistics.isCommitted(c) && !w.lostSectors[f][c.sector]);
        const seen=w.sight.visibleToArmy(w,f);
        const plan=w.plans[f];
        const free=(c:Company)=>!this.plan.assigned(c,w.tick) && !plan.reserve.includes(c.id);
        const leader = g.alive ? g.title + g.name : '代理指挥官';
        // ---- 全线推进 ----
        if (attack && !this.advanced[f] && w.tick >= this.cannonadeEnd[f]) {
            this.advanced[f] = true; this.secondWave[f] = w.tick + 330;
            let x = 0, y = 0, n = 0;
            for (const c of own) if (c.line === 0 && free(c)) { w.logistics.dispatch(w,c,'advance'); x += c.x; y += c.y; n++; }
            w.say(`${leader}下令：全线推进！`, f, n ? x / n : WIDTH / 2, n ? y / n : 1600, 2);
        }
        if (this.secondWave[f] && w.tick >= this.secondWave[f]) {
            this.secondWave[f] = 0;
            for (const c of own) if (c.line === 1 && c.order === 'hold' && free(c)) w.logistics.dispatch(w,c,'advance');
        }
        // 攻方：重整好的连队再次投入进攻。
        if (attack && this.advanced[f] && !this.secondWave[f] && w.tick % 150 === 1)
            for (const c of own) if (free(c) && (c.line <= 1 || c.line === 7) && c.order === 'hold' && c.status === 'steady' && c.morale > 50 && !isMounted(c)) w.logistics.dispatch(w,c,'advance');
        // 守方：敌军疲态尽显时转入全线反击。
        if (!attack && w.tick > 3600 && w.tick % 90 === 1) {
            const visiblyWorn=seen.length>0 && seen.every(c=>c.status==='rout' || c.morale<38);
            if (visiblyWorn || w.tick > 16500) {
                w.posture[f] = 'attack'; this.advanced[f] = true;
                for (const c of own) if (free(c) && c.line !== 6 && c.line !== 5 && c.line !== 4 && !isMounted(c) && c.status !== 'rout') w.logistics.dispatch(w,c,'advance');
                w.say(f ? `${leader}挥舞帽子：全线前进！` : `${leader}下令：全线反击！`, f, w.frontline().x, w.frontline().y, 3);
            }
        }
        // ---- 刺刀冲锋 ----
        for (const c of own) {
            if (c.status !== 'steady' || (!isLineTroop(c) && !isGuard(c)) || c.line === 6) continue;
            if((!free(c) && c.order!=='advance' && (c.order==='reserve' || (!seen.includes(w.companies[c.target]) || dist(c,w.companies[c.target])>260))) || w.noAssault[f] || w.tick<c.assaultReady || c.engaged || c.formation==='square')continue;
            if (c.order !== 'advance' && c.order !== 'hold') continue;
            const current=w.companies[c.target];
            const viable=(o:Company)=>o.faction!==f && o.alive>0 && o.line!==5 && !isMounted(o) && o.status!=='rout' && o.status!=='gone';
            const reach=w.weather==='fog'?1300:2250;
            const t=current && seen.includes(current) && viable(current)?current:seen.filter(o=>viable(o)&&dist(o,c)<reach)
                .sort((a,b)=>dist(a,c)-dist(b,c))[0];
            if(!t)continue;
            let limit = ASSAULT[trait] - (attack ? 0 : 10) + (isGuard(c) && plan.reserveAt!==null ? 22 : 0);
            if (inRect(layout.farm, t.x, t.y, 20)) limit -= 14;
            const d = dist(c, t);
            const support=own.some(o=>o!==c && o.line!==5 && o.status==='steady' && dist(o,c)<480);
            const fresh=t.alive===t.peak && t.morale>60 && c.morale>50;
            const worn=c.firingSince>=0 && w.tick-c.firingSince>1200;
            const window=w.tick-t.firstVolleyAt<80 && d<150;
            const lowAmmo=c.ammo<8*c.alive;
            if(worn && !support && c.losses>Math.max(1,c.kills)*1.3 && w.logistics.requestRelief(w,c))continue;
            const isolated=!seen.some(o=>o!==t && o.faction===t.faction && o.line!==5 && o.alive>3 && o.status==='steady' && dist(o,t)<250);
            const designated=c.order==='advance' && (c.sector===plan.mainEffort || isolated) && (support || c.morale>65);
            if ((d<reach && (fresh || designated) && (c.id%3!==2 || attack)) || (d<MUSKET+40 && (t.morale<limit || t.alive<c.alive*.45 || window || lowAmmo || (worn && (support || c.kills>=1.2*Math.max(1,c.losses)))))) {
                c.order = 'assault'; c.forced = t.id;
                c.freshAtStart=fresh;c.charges++;
                if (isGuard(c) || w.rng.next() < .22) w.say(`${c.name}上刺刀，冲锋！`, f, c.x, c.y, isGuard(c) ? 2 : 1);
            }
        }
        // ---- 骑兵寻找战机 ----
        if (w.tick > (attack ? this.cannonadeEnd[f] + 150 : 800)) {
            for (const c of own) {
                if (!isMounted(c) || c.line === 5 || c.status !== 'steady' || c.order !== 'hold' || c.morale < 52 || w.tick<c.blownUntil) continue;
                if (w.rng.next() > .4) continue;
                let best: Company | undefined, bs = 0;
                for (const o of seen) {
                    if (o.faction === f || o.status === 'gone' || o.status === 'rout' || (o.alive < 4 && o.line!==5)) continue;
                    const d = dist(c, o);
                    if (d > 1600 || inWoods(o.x, o.y, 30) || inRect(layout.farm, o.x, o.y, 40)) continue;
                    if (o.formation === 'square' && o.formUntil <= w.tick) continue;
                    let s = o.status === 'shaken' ? 2 : o.formUntil > w.tick && o.formation!=='square' && w.tick-o.leftSquare>300 ? 2.4 : 0;
                    if (isArtillery(o) && !seen.some(p => p.faction === o.faction && !isArtillery(p) && p.line !== 5 && p.status !== 'rout' && p.status !== 'gone' && dist(p, o) < 260)) s = Math.max(s, trait === 'cunning' ? 2.6 : 2);
                    if(o.line===5){
                        const cover=own.length && seen.some(p=>p.faction===o.faction && p.line!==5 && p.status==='steady' && p.alive>=6 && dist(p,o)<580);
                        if(cover || d>1150 || !w.generals[o.faction].alive)continue;
                        s=2.8;
                    }
                    if (isLineTroop(o) && o.formation === 'line' && w.tick - o.reloadAt > -40 && w.tick < o.reloadAt) s = Math.max(s, 1.15);
                    if (isMounted(o) && o.order === 'charge' && d < 700) s = Math.max(s, 1.8);
                    s *= 1 - d / 2200;
                    if (s > bs) { bs = s; best = o; }
                }
                if (best && bs >= EAGER[trait] * (1 - Math.min(.35, w.tick / 30000))) {
                    c.charges++;c.order = 'charge'; c.forced = best.id;
                    w.say(`${c.name}拔出马刀，向${best.name}发起冲锋！`, f, c.x, c.y, 2);
                }
            }
        }
        // ---- 参谋部跟随主力 ----
        const staff = w.companies[g.company];
        if (staff && staff.status !== 'gone' && staff.status !== 'rout') {
            let x = 0, y = 0, n = 0;
            for (const c of own) if ((c.line === 0 || c.line === 1) && c.status !== 'rout') { x += c.x; y += c.y; n++; }
            if (n) { staff.homeX = Math.min(WIDTH - 80, Math.max(80, x / n - face * 1080)); staff.homeY = y / n; }
        }
    }
}
