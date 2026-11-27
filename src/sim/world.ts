import { scales, type Scale, type Faction, type Kind, type Soldier, type BattleEvent, type Round, type Company, type General,
    type News, type Trait, type Weather, type Posture, type Formation, type Order, type Reinforcement } from './arenaTypes';
import { WIDTH, HEIGHT, CX, CY, LINE_GAP, createLayout, setLayout, ridgeLine, type Layout } from './maps';
import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import { Director } from './aiDirector';
import { advance, updateCompany, formUp, rout } from './strategy';
import { resolveRounds, shake } from './combat';

export const ARMY = ['法兰西帝国', '反法同盟'] as const;
const GENERALS: { name: string; title: string; trait: Trait }[][] = [
    [{ name: '拿破仑', title: '皇帝', trait: 'cunning' }, { name: '内伊', title: '元帅', trait: 'aggressive' },
     { name: '苏尔特', title: '元帅', trait: 'steadfast' }, { name: '格鲁希', title: '元帅', trait: 'cautious' }],
    [{ name: '威灵顿', title: '公爵', trait: 'steadfast' }, { name: '乌克斯布里奇', title: '伯爵', trait: 'aggressive' },
     { name: '希尔', title: '勋爵', trait: 'cautious' }, { name: '布吕歇尔', title: '元帅', trait: 'cunning' }]
];
const HP: Record<Kind, number> = { line_infantry: 100, guard_grenadier: 116, cuirassier: 135, bannerman: 90, field_cannon: 230 };
const SPEED: Record<Kind, number> = { line_infantry: 64, guard_grenadier: 66, cuirassier: 125, bannerman: 64, field_cannon: 40 };
const VALUE: Record<Kind, number> = { line_infantry: 1, guard_grenadier: 1.55, cuirassier: 1.35, bannerman: .6, field_cannon: 9 };
export const TIMEOUT = 10800, PURSUIT = 210;

export class SimWorld {
    units: Soldier[] = []; companies: Company[] = []; generals: General[] = []; news: News[] = [];
    events: BattleEvent[] = []; rounds: Round[] = [];
    alive: [number, number] = [0, 0]; dead: [number, number] = [0, 0]; fled: [number, number] = [0, 0];
    start: [number, number] = [0, 0]; reinforced: [number, number] = [0, 0]; broken: [boolean, boolean] = [false, false];
    winner: Faction | null = null; endTick = -1; ended = false; reason = '';
    hash = new SpatialHash(); rng = new Rng(1815); director = new Director();
    stationaryFrames=0; flips=0; toggles=0; slotMoves=0;
    get jitter(){
        const seconds=Math.max(1,this.stationaryFrames/30);
        return {flipsPerSec:this.flips/seconds, poseTogglesPerSec:this.toggles/seconds, slotSwapsPerDeath:this.slotMoves/Math.max(1,this.dead[0]+this.dead[1])};
    }
    tick = 0; scale: Scale = 1200; seed = 1815;
    weather: Weather = 'clear'; posture: [Posture, Posture] = ['attack', 'defend']; layout!: Layout;
    reinforcement: Reinforcement | null = null; openingOdds = .5;
    constructor(scale: Scale = 1200, seed = 1815) { this.reset(scale, seed); }

    reset(scale: Scale = this.scale, seed = this.seed) {
        if (!scales.includes(scale)) throw new RangeError('Unsupported army scale');
        this.scale = scale; this.seed = seed >>> 0; this.rng.state = this.seed;
        this.stationaryFrames=this.flips=this.toggles=this.slotMoves=0; this.tick = 0; this.winner = null; this.ended = false; this.endTick = -1; this.reason = '';
        this.units = []; this.companies = []; this.news = []; this.rounds = []; this.events = [];
        this.alive = [0, 0]; this.dead = [0, 0]; this.fled = [0, 0]; this.start = [0, 0]; this.reinforced = [0, 0]; this.broken = [false, false];
        const r = this.rng.next();
        this.weather = r < .55 ? 'clear' : r < .8 ? 'rain' : 'fog';
        this.generals = [0, 1].map(f => {
            const pick = GENERALS[f][this.rng.int(0, 3)];
            return { faction: f as Faction, ...pick, unit: null, company: -1, alive: true };
        });
        const stance = (t: Trait): Posture => t === 'aggressive' ? 'attack' : t === 'cunning' ? (this.rng.next() < .6 ? 'attack' : 'defend') : 'defend';
        this.posture = [stance(this.generals[0].trait), stance(this.generals[1].trait)];
        if (this.posture[0] === 'defend' && this.posture[1] === 'defend') this.posture[this.rng.int(0, 1)] = 'attack';
        const defender: Faction | -1 = this.posture[0] === 'defend' ? 0 : this.posture[1] === 'defend' ? 1 : -1;
        this.layout = createLayout(this.rng, defender); setLayout(this.layout);
        for (const f of [0, 1] as const) this.deploy(f, scale / 2);
        this.reinforcement = null;
        if (this.rng.next() < .42) {
            const f = this.rng.int(0, 1) as Faction;
            this.reinforcement = { faction: f, tick: this.rng.int(2600, 4800), arrived: false, count: Math.round(scale / 2 * .16),
                name: f ? '普鲁士比洛军' : '格鲁希元帅的右翼军' };
        }
        this.director.reset(this);
        this.hash.rebuild(this.units);
        this.openingOdds = this.odds();
    }
    private company(f: Faction, kind: Kind, name: string, line: number, n: number, x: number, y: number, formation: Formation, order: Order, ranks: number) {
        const trait = this.generals[f].trait, face = f ? -1 : 1;
        let base = { line_infantry: 66, guard_grenadier: 92, cuirassier: 76, bannerman: 66, field_cannon: 72 }[kind] + this.rng.int(-7, 7);
        if (trait === 'aggressive') base += 4;
        if (trait === 'steadfast' && kind !== 'cuirassier') base += 9;
        if (line === 5) base = 100;
        const c: Company = { id: this.companies.length, faction: f, kind, name, members: [], alive: 0, peak: 0,
            x, y, relocated:false, limbered:false, deployUntil:0, initialFront:x+face*170, vx:0, vy:0, capacity:n, lastShrink:-90, margin:0, hx: face, hy: 0, gx: x, gy: y, homeX: x, homeY: y, formation, formUntil: 0, files: 1, ranks,
            order, status: 'steady', morale: base, base, target: -1, forced: -1, reloadAt: 0, hitChance: 0,
            engaged: false, checkedAt: -999, chargeAt: -999, line, kills: 0, underFire: 0, speed: SPEED[kind] * (line === 5 ? .8 : 1), colors: 0, rallied: 0 };
        this.companies.push(c);
        for (let i = 0; i < n; i++) this.soldier(c, kind);
        return c;
    }
    private soldier(c: Company, kind: Kind) {
        const u: Soldier = { id: this.units.length, faction: c.faction, kind, company: c.id, slot: c.members.length, x: c.x, y: c.y, vx: 0, vy: 0,
            hp: HP[kind], face: c.hx, moving: false, pose: 'stand', hitAt: -999, firedAt: -999, fireAt: -1,
            stride: this.rng.int(0, 15), speed: SPEED[kind] * (.97 + this.rng.next() * .06), cooldown: this.rng.int(0, 90), foe: -1,
            aimTarget:-1, aimX:0, aimY:0, rangeError:0, shotsOnTarget:0, px:c.x, py:c.y, turnFrames:0, marchUntil:0, general: false, jx: this.rng.next() * 4 - 2, jy: this.rng.next() * 4 - 2 };
        if (kind === 'bannerman') c.colors++;
        c.members.push(u); c.alive++; c.peak++;
        this.units.push(u); this.alive[c.faction]++;
        return u;
    }
    private deploy(f: Faction, total: number) {
        const g = this.generals[f], trait = g.trait, face = f ? -1 : 1, defending = this.layout.ridgeOwner === f;
        const r = () => this.rng.next();
        const guns = Math.max(4, Math.round(total * (.017 + r() * .01 + (trait === 'cautious' ? .008 : 0))));
        const cav = Math.round(total * (.12 + r() * .08 + (trait === 'aggressive' ? .03 : 0)));
        const guard = Math.round(total * (.09 + r() * .08));
        const banner = Math.round(total * .035), staff = 3;
        const line = total - guns - cav - guard - banner - staff;
        const frontX = (y: number) => defending ? ridgeLine(y) + face * 170 : CX - face * LINE_GAP;
        const ranks = f ? 2 : 3;
        let num = this.rng.int(3, 18);
        const nextNum = () => (num += this.rng.int(1, 4));
        const lineName = () => f ? `第${nextNum()}步兵团` : `第${nextNum()}战列步兵团`;
        const split = (count: number, size: number) => { const k = Math.max(1, Math.round(count / size)); return Array.from({ length: k }, (_, i) => Math.floor(count * (i + 1) / k) - Math.floor(count * i / k)); };
        const infantry: Company[] = [];
        // 战列步兵：六成上一线，其余作二线。
        const lineSizes = split(line, 32), firstN = Math.ceil(lineSizes.length * .6), secondN = lineSizes.length - firstN;
        const band = 2250;
        lineSizes.forEach((n, i) => {
            const first = i < firstN, k = first ? i : i - firstN, m = first ? firstN : secondN;
            const y = CY + (k - (m - 1) / 2) * Math.min(260, band / Math.max(1, m)) + (first ? 0 : 110);
            const x = frontX(y) - face * (first ? 0 : 330);
            infantry.push(this.company(f, 'line_infantry', lineName(), first ? 0 : 1, n, x, y, 'line', 'hold', ranks));
        });
        // 据点守军
        const farm = this.layout.farm;
        if (farm && this.layout.farmOwner === f && infantry.length > 2) {
            let best = infantry[0];
            for (const c of infantry) if (Math.abs(c.y - farm.y) + (c.line ? 0 : 400) < Math.abs(best.y - farm.y) + (best.line ? 0 : 400)) best = c;
            best.line = 6; best.x = best.homeX = farm.x; best.y = best.homeY = farm.y; best.name += '（农庄守军）'; best.base += 8; best.morale += 8;
        }
        // 近卫预备队
        split(guard, 30).forEach((n, i, all) => {
            const y = CY + (i - (all.length - 1) / 2) * 200;
            const c = this.company(f, 'guard_grenadier', f ? `第${i + 1}近卫步兵团` : `老近卫军第${i + 1}掷弹兵团`, 2, n, frontX(y) - face * 700, y, 'column', 'reserve', ranks);
            infantry.push(c);
        });
        // 骑兵分列两翼
        let cavNum = this.rng.int(1, 9);
        split(cav, 22).forEach((n, i) => {
            const wing = i % 2 ? 1 : -1, row = Math.floor(i / 2);
            const y = CY + wing * (band / 2 + 160 + (row % 2) * 120);
            const x = frontX(CY) - face * (180 + row * 120);
            this.company(f, 'cuirassier', f ? `第${cavNum += this.rng.int(1, 4)}龙骑兵团` : `第${cavNum += this.rng.int(1, 3)}胸甲骑兵团`, 3, n, x, y, 'wedge', 'hold', 2);
        });
        // 炮兵部署在阵前或山脊顶
        const letters = 'ABCDEFGHIJKLMN';
        split(guns, 5).forEach((n, i, all) => {
            const y = CY + (i - (all.length - 1) / 2) * Math.min(520, band / all.length);
            const x = frontX(y) - face * 170;
            this.company(f, 'field_cannon', f ? `皇家炮兵${letters[i]}连` : `第${i + 1}近卫炮兵连`, 4, n, x, y, 'battery', 'hold', 1);
        });
        // 旗手与鼓手编入步兵连
        for (let i = 0; i < banner; i++) this.soldier(infantry[i % infantry.length], 'bannerman');
        // 总司令与两名副官
        const hq = this.company(f, 'cuirassier', `${g.title}${g.name}的参谋部`, 5, staff, frontX(CY) - face * 1000, CY, 'staff', 'hold', 1);
        hq.members[0].general = true; g.unit = hq.members[0]; g.company = hq.id; g.alive = true;
        for (const c of this.companies) if (c.faction === f) {
            // 旗手排在连队最后，不占火力位置。
            c.members.sort((a, b) => Number(a.kind === 'bannerman') - Number(b.kind === 'bannerman'));
            formUp(c);
        }
        this.start[f] = total;
    }
    private arrive(r: Reinforcement) {
        r.arrived = true;
        const f = r.faction, face = f ? -1 : 1, top = this.rng.next() < .5, ranks = f ? 2 : 3;
        const y0 = top ? 90 : HEIGHT - 90, ys = top ? 1 : -1;
        const cav = r.count > 80 ? 22 : 0, guns = r.count >= 100 ? 4 : 0, inf = r.count - cav - guns;
        const k = Math.max(1, Math.round(inf / 32));
        let num = this.rng.int(10, 30);
        const born: Company[] = [];
        for (let i = 0; i < k; i++) {
            const n = Math.floor(inf * (i + 1) / k) - Math.floor(inf * i / k);
            born.push(this.company(f, 'line_infantry', f ? `普鲁士第${num += 3}团` : `格鲁希军第${num += 3}团`, 7, n, CX - face * (250 + i * 170), y0 + ys * (i % 2) * 60, 'column', 'advance', ranks));
        }
        if (cav) born.push(this.company(f, 'cuirassier', f ? '普鲁士枪骑兵团' : '格鲁希军龙骑兵团', 3, cav, CX - face * (250 + k * 170), y0, 'wedge', 'hold', 2));
        if (guns) born.push(this.company(f, 'field_cannon', f ? '普鲁士炮兵连' : '格鲁希军炮兵连', 4, guns, CX - face * 650, y0 + ys * 80, 'battery', 'hold', 1));
        for (const c of born) { c.hx = 0; c.hy = ys; formUp(c); c.hx = face; c.hy = 0; this.reinforced[f] += c.alive; }
        this.say(f ? `${r.name}从侧翼杀到！布吕歇尔兑现了诺言` : `${r.name}终于赶到战场！`, f, CX - face * 400, y0, 3);
        for (const c of this.companies) if (c.status !== 'gone') {
            if (c.faction === f) c.morale = Math.min(c.base, c.morale + 10); else shake(c, 7);
        }
    }

    step() {
        this.events.length = 0;
        if (this.ended) return;
        this.tick++;
        this.hash.rebuild(this.units);
        const rf = this.reinforcement;
        if (rf && !rf.arrived && this.tick >= rf.tick && this.winner === null && !this.broken[rf.faction]) this.arrive(rf);
        if (this.tick % 30 === 1 && this.winner === null) this.director.update(this);
        for (let i = this.tick % 6; i < this.companies.length; i += 6) updateCompany(this, this.companies[i]);
        for(const c of this.companies) if(c.status!=='gone' && c.status!=='rout'){c.x+=c.vx/30;c.y+=c.vy/30;}
        resolveRounds(this);
        const n = this.units.length, start = this.tick % 2 * (n >> 1);
        for (let i = 0; i < n; i++) {
            const u = this.units[(i + start) % n];
            u.px=u.x; u.py=u.y;
            if (u.hp <= 0) continue;
            const c=this.companies[u.company], face=u.face, pose=u.pose;
            advance(this,u);
            if(!c.engaged && c.status!=='rout' && c.formUntil<=this.tick && c.vx===0 && c.vy===0){
                this.stationaryFrames++;
                if(face!==u.face)this.flips++;
                if((pose==='march' && u.pose==='stand')||(pose==='stand' && u.pose==='march'))this.toggles++;
            }
        }
        if (this.tick % 15 === 0 && this.winner === null) this.checkVictory();
        if (this.winner !== null && this.tick - this.endTick >= PURSUIT) {
            this.ended = true; this.rounds.length = 0;
            for (const u of this.units) if (u.hp > 0) { u.moving = false; u.vx = u.vy = 0; u.pose = 'stand'; }
        }
    }
    private checkVictory() {
        for (const f of [0, 1] as const) {
            if (this.broken[f]) continue;
            const total = this.start[f] + this.reinforced[f], eff = this.effective(f);
            if (this.alive[f] === 0 || eff < total * .2) this.breakArmy(f, `${ARMY[f]}的兵力消耗殆尽`);
            else if (this.armyMorale(f) < 21 && eff < total * .5) this.breakArmy(f, `${ARMY[f]}军心崩溃`);
        }
        if (this.winner === null && this.tick >= TIMEOUT) {
            const loser: Faction = this.odds() < .5 ? 0 : 1;
            this.breakArmy(loser, `夜幕降临，${ARMY[loser]}趁夜撤离战场`);
        }
    }
    breakArmy(f: Faction, why: string) {
        if (this.broken[f]) return;
        this.broken[f] = true;
        for (const c of this.companies) if (c.faction === f) rout(this, c, true);
        this.say(`${ARMY[f]}全线崩溃！`, f, this.frontline().x, this.frontline().y, 3);
        if (this.winner === null) { this.winner = (1 - f) as Faction; this.endTick = this.tick; this.reason = why; }
    }
    generalDown(u: Soldier) {
        const g = this.generals[u.faction];
        if (!g.alive) return;
        g.alive = false;
        this.say(`${g.title}${g.name}${this.rng.next() < .5 ? '中弹落马' : '被炮弹击中'}！全军震动`, u.faction, u.x, u.y, 3);
        for (const c of this.companies) if (c.faction === u.faction) shake(c, 14);
    }
    say(text: string, faction: Faction | -1, x: number, y: number, weight: number) {
        this.news.push({ tick: this.tick, text, faction, x, y, weight });
        if (this.news.length > 240) this.news.shift();
    }
    /** 仍在战斗（未溃逃）的兵力。 */
    effective(f: Faction) {
        let n = 0;
        for (const c of this.companies) if (c.faction === f && c.line !== 5 && c.status !== 'rout' && c.status !== 'gone') n += c.alive;
        return n;
    }
    /** 当前仍在场上溃逃的兵力。 */
    routing(f: Faction) {
        let n = 0;
        for (const c of this.companies) if (c.faction === f && c.line !== 5 && c.status === 'rout') n += c.alive;
        return n;
    }
    armyMorale(f: Faction) {
        let s = 0, n = 0;
        for (const c of this.companies) if (c.faction === f && c.line !== 5 && c.status !== 'gone') { s += c.morale * c.alive; n += c.alive; }
        return n ? s / n : 0;
    }
    private power(f: Faction) {
        let p = 0;
        for (const c of this.companies) if (c.faction === f && c.line !== 5 && c.status !== 'rout' && c.status !== 'gone')
            p += c.alive * VALUE[c.kind] * (.35 + c.morale / 100) * (c.line === 6 ? 1.5 : 1);
        if (this.generals[f].alive) p *= 1.05;
        if (this.layout.ridgeOwner === f) p *= 1.12;
        const rf = this.reinforcement;
        if (rf && !rf.arrived && rf.faction === f && this.tick > 0) p *= 1.04;
        return p;
    }
    /** 法军获胜概率的粗略估计（0..1），用于赔率与“战局天平”。 */
    odds() {
        if (this.winner !== null) return this.winner === 0 ? 1 : 0;
        const a = this.power(0) ** 1.6, b = this.power(1) ** 1.6;
        return a + b > 0 ? a / (a + b) : .5;
    }
    frontline() {
        const sums = [[0, 0, 0], [0, 0, 0]];
        for (const c of this.companies) if (c.status !== 'gone' && c.status !== 'rout' && c.line !== 5 && c.line !== 2) {
            const s = sums[c.faction]; s[0] += c.x * c.alive; s[1] += c.y * c.alive; s[2] += c.alive;
        }
        const live = sums.filter(s => s[2]);
        if (!live.length) return { x: CX, y: CY };
        return { x: live.reduce((n, s) => n + s[0] / s[2], 0) / live.length, y: live.reduce((n, s) => n + s[1] / s[2], 0) / live.length };
    }
    companyOf(u: Soldier) { return this.companies[u.company]; }
    get width() { return WIDTH; }
}
