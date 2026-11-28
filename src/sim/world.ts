import {guard as isGuard,lineTroop as isLineTroop,artillery as isArtillery,standard as isStandard} from './units/abilities';
import { simulationScales, type Scale, type Faction, type Kind, type Soldier, type BattleEvent, type Round, type Company, type Battalion, type General,
    type Sample, type TurningPoint, type News, type Trait, type Weather, type Posture, type Formation, type Order, type Reinforcement } from './arenaTypes';
import { WIDTH, HEIGHT, CX, CY, LINE_GAP, layout as activeLayout, createCampaignLayout, setLayout, ridgeLine, type Layout } from './maps';
import { Rng } from './rng';
import {BoardSight} from './boardSight';
import {Ballistics} from './projectiles';
import {Earthworks} from './emplacements';
import {Crowd} from './crowd';
import {MarchCohesion} from './marchCohesion';
import {MarchRoutes} from './marchRoutes';
import { SpatialHash } from './spatialHash';
import { Director } from './aiDirector';
import { LegacyDirector } from './legacyDirector';
import { prepareDeployment, marchDeployment, type BattlePlan } from './deployment';
import { CampaignLogistics } from './campaignLogistics';
import { CampaignObjectives } from './campaignObjectives';
import { advance, updateCompany, formUp, rout } from './strategy';
import { alignBattalionCompanies, updateBattalions, isSkirmisherCompany } from './battalion';
import { resolveRounds, shake } from './combat';

export const ARMY = ['法兰西帝国', '反法同盟'] as const;
const GENERALS: { name: string; title: string; trait: Trait }[][] = [
    [{ name: '拿破仑', title: '皇帝', trait: 'cunning' }, { name: '内伊', title: '元帅', trait: 'aggressive' },
     { name: '苏尔特', title: '元帅', trait: 'steadfast' }, { name: '格鲁希', title: '元帅', trait: 'cautious' }],
    [{ name: '威灵顿', title: '公爵', trait: 'steadfast' }, { name: '乌克斯布里奇', title: '伯爵', trait: 'aggressive' },
     { name: '希尔', title: '勋爵', trait: 'cautious' }, { name: '布吕歇尔', title: '元帅', trait: 'cunning' }]
];
import {PACE} from './scale';
import {footprints,unitTypes} from './units/unitTypes';
import {selectVariant,variants} from './units/roster';
export const TIMEOUT = 36000, PURSUIT = 210;

function recordPhase(profile: Record<string,number>, phase: string, start: number) {
    const end=performance.now();
    profile[phase]=(profile[phase] ?? 0)+(end-start);
    return end;
}

export class SimWorld {
    readonly deployEnd=PACE.deploymentTicks;
    rearGuard:[number|null,number|null]=[null,null];
    plans!: [BattlePlan,BattlePlan];
    private legacy?: LegacyDirector;
    lostSectors:boolean[][]=[[],[]];
    readonly noAssault:[boolean,boolean]=[false,false];
    charges:{tick:number;company:number;target:number;fresh:boolean;outcome:'break'|'repulsed'|'melee'}[]=[];
    assaultOrders:{tick:number;battalion:number;company:number;dist:number;sinceFirstFire:number}[]=[];
    cavalryImpacts:{tick:number;company:number;target:number;formation:Formation;speed:number;arc:'front'|'flank'|'rear';vsSquare:boolean;targetMoraleAfter:number;targetRoutedWithin300:boolean}[]=[];
    cavalryChargeEvents:{tick:number;company:number;task:string;target:number}[]=[];
    cavalryTaskCounts:Record<string,number>={};
    artilleryStats={reaims:0,limberTurns:0,slowedReloads:0,silencedGuns:0,shellExplosions:0};
    recentRouts:{tick:number;c:Company;x:number;y:number}[]=[];
    timeline:Sample[]=[];turningPoints:TurningPoint[]=[];
    units: Soldier[] = []; companies: Company[] = []; battalions: Battalion[] = []; generals: General[] = []; news: News[] = [];
    readonly volleyShooters:Soldier[]=[];
    events: BattleEvent[] = []; rounds: Round[] = [];
    alive: [number, number] = [0, 0]; dead: [number, number] = [0, 0]; fled: [number, number] = [0, 0];
    start: [number, number] = [0, 0]; reinforced: [number, number] = [0, 0]; broken: [boolean, boolean] = [false, false];
    winner: Faction | null = null; endTick = -1; ended = false; reason = '';
    sight=new BoardSight();
    readonly marchCohesion=new MarchCohesion();
    marchRoutes!:MarchRoutes;
    ballistics=new Ballistics();
    /** 炮兵阵地的土胸墙。 */
    earthworks=new Earthworks();
    crowd=new Crowd(); hash = new SpatialHash(); rng = new Rng(1815); director = new Director(); logistics=new CampaignLogistics(); objectives=new CampaignObjectives();
    stationaryFrames=0; flips=0; toggles=0; slotMoves=0;
    get jitter(){
        const seconds=Math.max(1,this.stationaryFrames/30);
        return {flipsPerSec:this.flips/seconds, poseTogglesPerSec:this.toggles/seconds, slotSwapsPerDeath:this.slotMoves/Math.max(1,this.dead[0]+this.dead[1])};
    }
    tick = 0; scale: Scale = 1200; seed = 1815;
    weather: Weather = 'clear'; posture: [Posture, Posture] = ['attack', 'defend']; layout!: Layout;
    reinforcement: Reinforcement | null = null; openingOdds = .5;
    constructor(scale: Scale = 1200, seed = 1815, readonly legacySide:Faction|null=null) { this.reset(scale, seed); }

    reset(scale: Scale = this.scale, seed = this.seed) {
        if (!simulationScales.includes(scale)) throw new RangeError('Unsupported army scale');
        this.sight=new BoardSight();this.ballistics=new Ballistics();this.earthworks.reset();this.scale = scale; this.seed = seed >>> 0; this.rng.state = this.seed;
        this.stationaryFrames=this.flips=this.toggles=this.slotMoves=0; this.tick = 0; this.winner = null; this.ended = false; this.endTick = -1; this.reason = '';
        this.rearGuard=[null,null];this.lostSectors=[[false,false,false],[false,false,false]];this.charges=[];this.assaultOrders=[];this.cavalryImpacts=[];this.cavalryChargeEvents=[];this.cavalryTaskCounts={};this.artilleryStats={reaims:0,limberTurns:0,slowedReloads:0,silencedGuns:0,shellExplosions:0};this.recentRouts=[];this.timeline=[];this.turningPoints=[];this.units = []; this.companies = []; this.battalions = []; this.news = []; this.rounds = []; this.events = [];
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
        this.layout = createCampaignLayout(this.rng, defender); setLayout(this.layout);this.crowd.reset(this.layout);
        this.marchRoutes=new MarchRoutes(this.layout);
        this.marchCohesion.reset();
        for (const f of [0, 1] as const) this.deploy(f, scale / 2);
        this.reinforcement = null;
        if (this.rng.next() < .42) {
            const f = this.rng.int(0, 1) as Faction;
            this.reinforcement = { faction: f, tick: this.rng.int(10000, 18000), arrived: false, count: Math.round(scale / 2 * .16),
                name: f ? '普鲁士比洛军' : '格鲁希元帅的右翼军' };
        }
        this.plans=prepareDeployment(this);
        this.crowd.step(this);
        this.director.reset(this);
        if(this.legacySide!==null){
            const next=this.rng.state;
            this.legacy=new LegacyDirector();this.legacy.reset(this);
            this.legacy.cannonadeEnd[this.legacySide]+=this.deployEnd;
            this.legacy.guardAt[this.legacySide]+=this.deployEnd;
            this.rng.state=next;
        }
        this.logistics.reset(this);this.objectives.reset();
        this.hash.rebuild(this.units);
        this.openingOdds = this.odds();

    }
    private company(f: Faction, kind: Kind, name: string, line: number, n: number, x: number, y: number, formation: Formation, order: Order, ranks: number) {
        const trait = this.generals[f].trait, face = f ? -1 : 1;
        const type=unitTypes[kind];
        const ordinal=this.companies.filter(c=>c.faction===f && c.kind===kind).length;
        const variant=selectVariant(kind,f,line,ordinal);
        const pace=variant?variants[variant].pace:1;
        if(variant)name+=' · '+variants[variant].name[f];
        let base = type.morale + this.rng.int(-7, 7);
        if (trait === 'aggressive') base += 4;
        if (trait === 'steadfast' && type.group!=='mounted') base += 9;
        if (line === 5) base = 100;
        const c: Company = { id: this.companies.length, faction: f, kind, variant, name, members: [], alive: 0, peak: 0,
            x,y,sector:Math.max(0,Math.min(2,Math.floor(y*3/HEIGHT))) as 0|1|2,brigade:Math.floor(this.companies.length/4),corps:f*3+Math.max(0,Math.min(2,Math.floor(y*3/HEIGHT))),ammo:0,fatigue:0,smoke:0,fireMode:'first',firingSince:-1,nextGroup:0,firstVolleyAt:-999,sprintUntil:0,sprintReady:0,assaultStage:'idle',assaultUntil:0,assaultReady:0,freshAtStart:false,cavalryDistances:new Map(),lastHorse:-9999,leftSquare:-9999,formedSquareAt:-9999,chargeOpponent:-1,lastMelee:-9999,contactId:-1,contactAt:-9999,blownUntil:0,relocated:false, limbered:false, deployUntil:0, initialFront:x+face*170, vx:0, vy:0, capacity:n, lastShrink:-90, margin:0, hx: face, hy: 0, gx: x, gy: y, homeX: x, homeY: y, formation, formUntil: 0, files: 1, ranks,
            order, status: 'steady', morale: base, base, target: -1, forced: -1, reloadAt: 0,
            engaged: false, checkedAt: -999, chargeAt: -999, line,
            battalion: -1, battalionSlot: -1, refuseAngle: 0, refuseUntil: 0, recentLosses: [],
            chargePhase: 'idle', cavTask: 'none', cavSpeed: 0, impactSpeed: 0,
            chargeCount: 0, restUntil: 0, rallyStartAt: 0,
            pursueStartX: 0, pursueStartY: 0, pursueStartTick: 0,
            threatenUntil: 0, threatenTarget: -1, flankWaypoint: null,
            losses:0,volleys:0,routs:0,charges:0,captures:0,rallies:0,wooded:false, kills: 0, underFire: 0, speed: type.speed * pace * (line === 5 ? .8 : 1), colors: 0, rallied: 0 };
        this.companies.push(c);
        for (let i = 0; i < n; i++) this.soldier(c, kind);
        return c;
    }
    private soldier(c: Company, kind: Kind) {
        const u: Soldier = { body:footprints[unitTypes[kind].frame], id: this.units.length, faction: c.faction, kind, company: c.id, slot: c.members.length, x: c.x, y: c.y, vx: 0, vy: 0,
            ammo:isLineTroop({kind})||isGuard({kind})?40:0,shotsFired:0,loadedAt:0,shotTarget:-1,kneelUntil:0,hp: unitTypes[kind].hp, face: c.hx, moving: false, pose: 'stand', hitAt: -999, firedAt: -999, fireAt: -1,
            stride: this.rng.int(0, 15), speed: unitTypes[kind].speed * (c.variant && c.kind===kind?variants[c.variant].pace:1) * (.97 + this.rng.next() * .06), cooldown: this.rng.int(0, 90), foe: -1,
            aimTarget:-1, aimX:0, aimY:0, rangeError:0, shotsOnTarget:0,
            aim: Math.atan2(c.hy, c.hx), crew: isArtillery({kind}) ? 6 : 0, reaimUntil: 0, reaimTargetAim: Math.atan2(c.hy, c.hx), reaimKind: 'none', captured: false,
            px:c.x, py:c.y, turnFrames:0, marchUntil:0, staff:c.line===5, officer:c.members.length===0 && c.line!==5, diedAt:-999, escaped:false, general: false, jx: this.rng.next() * 4 - 2, jy: this.rng.next() * 4 - 2 };
        if (isStandard(u)) c.colors++;
        c.ammo+=u.ammo;c.members.push(u); c.alive++; c.peak++;
        this.units.push(u); this.alive[c.faction]++;
        return u;
    }
    private deploy(f: Faction, total: number) {
        const g = this.generals[f], trait = g.trait, face = f ? -1 : 1, defending = this.layout.ridgeOwner === f;
        const r = () => this.rng.next();
        // F1：每方火炮数 = 每千人 4～6 门（按该方兵力四舍五入，至少 2 门；2400 人局每方 5～6 门）
        const gunsPerK = 4.2 + r() * 1.2 + (trait === 'cautious' ? 0.35 : 0);
        const guns = Math.max(2, Math.round((total / 1000) * Math.min(5.9, gunsPerK)));
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
        // 战列步兵：按营编组（每营 4～6 连），轻步兵/来复枪作为营前散兵连。
        const lineSizes = split(line, unitTypes.line_infantry.capacity);
        const band = HEIGHT * .78;
        const lineCompanies: Company[] = [];
        const skirmishCompanies: Company[] = [];
        lineSizes.forEach((n, i) => {
            const c = this.company(f, 'line_infantry', lineName(), 0, n, frontX(CY), CY, 'line', 'hold', ranks);
            infantry.push(c);
            if (isSkirmisherCompany(c)) {
                c.formation = 'skirmish';
                skirmishCompanies.push(c);
            } else {
                lineCompanies.push(c);
            }
        });
        // 据点守军：从普通战列连中抽一个独立守军连
        const farm = this.layout.farm;
        if (farm && this.layout.farmOwner === f && lineCompanies.length > 5) {
            const garrison = lineCompanies.pop()!;
            garrison.line = 6; garrison.x = garrison.homeX = farm.x; garrison.y = garrison.homeY = farm.y;
            garrison.name += '（农庄守军）'; garrison.base += 8; garrison.morale += 8;
        }
        // 把普通战列连划为若干个 4～6 连的营
        const groupIntoBattalions = (list: Company[], minSize: number, maxSize: number): Company[][] => {
            if (!list.length) return [];
            const targetSize = Math.min(maxSize, Math.max(minSize, 5));
            let k = Math.max(1, Math.round(list.length / targetSize));
            while (k > 1 && Math.floor(list.length / k) < minSize) k--;
            while (Math.ceil(list.length / k) > maxSize && list.length >= (k + 1) * minSize) k++;
            const groups: Company[][] = [];
            for (let i = 0; i < k; i++) {
                const start = Math.floor(i * list.length / k), end = Math.floor((i + 1) * list.length / k);
                if (end > start) groups.push(list.slice(start, end));
            }
            return groups;
        };
        const lineBatGroups = groupIntoBattalions(lineCompanies, 4, 6);
        const firstBatN = Math.max(1, Math.ceil(lineBatGroups.length * 0.65));
        const secondBatN = lineBatGroups.length - firstBatN;
        const lineBattalions: Battalion[] = [];
        const createBat = (kind: Kind, name: string, lineNo: number, comps: Company[], bx: number, by: number, order: Order): Battalion => {
            const bid = this.battalions.length;
            const sec = Math.max(0, Math.min(2, Math.floor(by * 3 / HEIGHT))) as 0 | 1 | 2;
            const b: Battalion = {
                id: bid, faction: f, kind, name, sector: sec, line: lineNo,
                companies: comps.map(c => c.id), skirmishers: [],
                x: bx, y: by, hx: face, hy: 0, gx: bx, gy: by, homeX: bx, homeY: by,
                order, fireMode: f === 1 ? 'platoon' : 'rank',
                target: -1, targetCompany: -1,
                fireSeq: 0, nextFireAt: 0, firingSince: -1, firstVolleyCount: 0,
                stoppedAt: -1, aligned: false, closing: false,
                smoke: 0, initialAmmo: comps.reduce((s, c) => s + c.ammo, 0),
                refusedLeft: false, refusedRight: false, firstChargeAt: -1
            };
            this.battalions.push(b);
            comps.forEach((c, idx) => {
                c.battalion = bid; c.battalionSlot = idx; c.line = lineNo; c.order = order; c.sector = sec;
            });
            return b;
        };
        lineBatGroups.forEach((group, bi) => {
            const first = bi < firstBatN, k = first ? bi : bi - firstBatN, m = first ? firstBatN : secondBatN;
            const y = CY + (k - (m - 1) / 2) * (band / Math.max(1, m));
            const x = frontX(y) - face * (first ? 0 : 500);
            const b = createBat('line_infantry', f ? `第${bi + 1}步兵营` : `第${bi + 1}战列步兵营`, first ? 0 : 1, group, x, y, 'hold');
            lineBattalions.push(b);
        });
        // 将轻步兵/来复枪连配属给一线战列步兵营（若无一线营则配给第一个营）
        const frontBats = lineBattalions.filter(b => b.line === 0);
        const hostBats = frontBats.length ? frontBats : lineBattalions;
        skirmishCompanies.forEach((sc, i) => {
            const host = hostBats[i % Math.max(1, hostBats.length)];
            if (host) {
                host.skirmishers.push(sc.id);
                sc.battalion = host.id;
                sc.battalionSlot = -1;
                sc.line = 0;
                sc.sector = host.sector;
            }
        });
        // 近卫预备队：编成近卫营（3～5 连）
        const guardComps: Company[] = [];
        split(guard, unitTypes.guard_grenadier.capacity).forEach((n, i) => {
            const c = this.company(f, 'guard_grenadier', f ? `第${i + 1}近卫步兵连` : `老近卫军第${i + 1}掷弹兵连`, 2, n, frontX(CY) - face * 720, CY, 'line', 'reserve', ranks);
            infantry.push(c);
            guardComps.push(c);
        });
        const guardBatGroups = groupIntoBattalions(guardComps, 3, 5);
        guardBatGroups.forEach((group, bi) => {
            const y = CY + (bi - (guardBatGroups.length - 1) / 2) * 900;
            const x = frontX(y) - face * 720;
            createBat('guard_grenadier', f ? `第${bi + 1}近卫步兵营` : `老近卫军第${bi + 1}掷弹兵营`, 2, group, x, y, 'reserve');
        });
        // 骑兵分列两翼（默认菱形队形准备冲锋）
        let cavNum = this.rng.int(1, 9);
        split(cav, unitTypes.cuirassier.capacity).forEach((n, i) => {
            const wing = i % 2 ? 1 : -1, row = Math.floor(i / 2);
            const y = CY + wing * (band / 2 + 160 + (row % 2) * 120);
            const x = frontX(CY) - face * (560 + row * 140);
            this.company(f, 'cuirassier', f ? `第${cavNum += this.rng.int(1, 4)}龙骑兵团` : `第${cavNum += this.rng.int(1, 3)}胸甲骑兵团`, 3, n, x, y, 'diamond', 'hold', 2);
        });
        // 炮兵部署在阵前或山脊顶（F2：每连 4～6 门炮）
        const letters = 'ABCDEFGHIJKLMN';
        const batCount = guns <= 6 ? 1 : Math.max(1, Math.round(guns / 5));
        const gunSplits = Array.from({ length: batCount }, (_, i) => Math.floor(guns * (i + 1) / batCount) - Math.floor(guns * i / batCount));
        gunSplits.forEach((n, i, all) => {
            const y = CY + (i - (all.length - 1) / 2) * Math.min(520, band / all.length);
            const x = frontX(y) - face * 170;
            this.company(f, 'field_cannon', f ? `皇家炮兵${letters[i]}连` : `第${i + 1}近卫炮兵连`, 4, n, x, y, 'battery', 'hold', 1);
        });
        // 旗手与鼓手编入步兵连
        for (let i = 0; i < banner; i++) this.soldier(infantry[i % infantry.length], 'bannerman');
        // 总司令与两名副官
        const hq = this.company(f, 'cuirassier', `${g.title}${g.name}的参谋部`, 5, staff, frontX(CY) - face * 1250, CY, 'staff', 'hold', 1);
        hq.members[0].general = true; g.unit = hq.members[0]; g.company = hq.id; g.alive = true;
        for (const c of this.companies) if (c.faction === f) {
            // 旗手排在连队最后，不占火力位置。
            c.members.sort((a, b) => Number(isStandard(a)) - Number(isStandard(b)));
            formUp(c);
        }
        for (const b of this.battalions) if (b.faction === f) {
            b.initialAmmo = b.companies.reduce((s, id) => s + (this.companies[id]?.ammo ?? 0), 0);
            alignBattalionCompanies(this, b, true);
            for (const id of [...b.companies, ...b.skirmishers]) formUp(this.companies[id]);
        }
        this.start[f] = total;
    }
    private arrive(r: Reinforcement) {
        r.arrived = true;
        const f = r.faction, face = f ? -1 : 1, top = this.rng.next() < .5, ranks = f ? 2 : 3;
        const y0 = top ? 90 : HEIGHT - 90, ys = top ? 1 : -1;
        const cav = r.count > 80 ? 22 : 0, guns = Math.round((r.count / 1000) * 5), inf = r.count - cav - guns;
        const k = Math.max(1, Math.round(inf / 32));
        let num = this.rng.int(10, 30);
        const born: Company[] = [];
        const infBorn: Company[] = [];
        for (let i = 0; i < k; i++) {
            const n = Math.floor(inf * (i + 1) / k) - Math.floor(inf * i / k);
            const c = this.company(f, 'line_infantry', f ? `普鲁士第${num += 3}连` : `格鲁希军第${num += 3}连`, 7, n, CX - face * (250 + i * 170), y0 + ys * (i % 2) * 60, 'line', 'advance', ranks);
            born.push(c); infBorn.push(c);
        }
        if (infBorn.length >= 2) {
            const bid = this.battalions.length;
            const bx = CX - face * 450, by = y0 + ys * 60;
            const b: Battalion = {
                id: bid, faction: f, kind: 'line_infantry', name: f ? '普鲁士援军营' : '格鲁希军援军营',
                sector: Math.max(0, Math.min(2, Math.floor(by * 3 / HEIGHT))) as 0 | 1 | 2, line: 7,
                companies: infBorn.map(c => c.id), skirmishers: [],
                x: bx, y: by, hx: face, hy: 0, gx: bx, gy: by, homeX: bx, homeY: by,
                order: 'advance', fireMode: f === 1 ? 'platoon' : 'rank',
                target: -1, targetCompany: -1, fireSeq: 0, nextFireAt: 0, firingSince: -1, firstVolleyCount: 0,
                stoppedAt: -1, aligned: false, closing: false, smoke: 0,
                initialAmmo: infBorn.reduce((s, c) => s + c.ammo, 0),
                refusedLeft: false, refusedRight: false, firstChargeAt: -1
            };
            this.battalions.push(b);
            infBorn.forEach((c, idx) => { c.battalion = bid; c.battalionSlot = idx; });
            alignBattalionCompanies(this, b, true);
        }
        if (cav) born.push(this.company(f, 'cuirassier', f ? '普鲁士枪骑兵团' : '格鲁希军龙骑兵团', 3, cav, CX - face * (250 + k * 170), y0, 'diamond', 'hold', 2));
        if (guns) born.push(this.company(f, 'field_cannon', f ? '普鲁士炮兵连' : '格鲁希军炮兵连', 4, guns, CX - face * 650, y0 + ys * 80, 'battery', 'hold', 1));
        for (const c of born) { c.hx = 0; c.hy = ys; formUp(c); c.hx = face; c.hy = 0; for (const u of c.members) if (isArtillery(u)) { u.aim = Math.atan2(c.hy, c.hx); u.reaimTargetAim = u.aim; } this.reinforced[f] += c.alive; }
        this.logistics.sync(this);
        this.say(f ? `${r.name}从侧翼杀到！布吕歇尔兑现了诺言` : `${r.name}终于赶到战场！`, f, CX - face * 400, y0, 3);
        for (const c of this.companies) if (c.status !== 'gone') {
            if (c.faction === f) c.morale = Math.min(c.base, c.morale + 10); else shake(c, 7);
        }
    }

    profile: Record<string, number> | null = null;

    step() {
        this.events.length = 0;
        if (this.ended) return;
        const profile=this.profile;
        let phaseStart=profile ? performance.now() : 0;
        if(activeLayout!==this.layout)setLayout(this.layout);
        this.tick++;
        if(this.tick<=this.deployEnd){
            marchDeployment(this);
            if(profile)phaseStart=recordPhase(profile,'companies',phaseStart);
            this.crowd.step(this);
            if(profile)phaseStart=recordPhase(profile,'crowd',phaseStart);
            if(this.tick%30===0)this.sampleTimeline();
            if(profile)recordPhase(profile,'director',phaseStart);
            return;
        }
        this.hash.rebuild(this.units);
        if(!this.earthworks.dug){this.earthworks.dug=true;this.earthworks.dig(this);}
        const rf = this.reinforcement;
        if (rf && !rf.arrived && this.tick >= rf.tick && this.winner === null && !this.broken[rf.faction]) this.arrive(rf);
        this.logistics.step(this);
        if(profile)phaseStart=recordPhase(profile,'hash+logistics',phaseStart);
        if (this.tick % 30 === 1 && this.winner === null){
            this.sight.scan(this);
            this.director.update(this);
            if(this.legacy && this.legacySide!==null && !this.broken[this.legacySide])this.legacy.army(this,this.legacySide);
        }
        if(profile)phaseStart=recordPhase(profile,'director',phaseStart);
        updateBattalions(this);
        for (let i = this.tick % 6; i < this.companies.length; i += 6) updateCompany(this, this.companies[i]);
        for(const c of this.companies) if(c.status!=='gone' && c.status!=='rout'){c.x+=c.vx/30;c.y+=c.vy/30;}
        if(profile)phaseStart=recordPhase(profile,'companies',phaseStart);
        resolveRounds(this);
        if(profile)phaseStart=recordPhase(profile,'rounds',phaseStart);
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
        if(profile)phaseStart=recordPhase(profile,'soldiers',phaseStart);
        this.crowd.step(this);
        if(profile)phaseStart=recordPhase(profile,'crowd',phaseStart);
        if (this.tick % 15 === 0 && this.winner === null) this.checkVictory();
        if (this.tick % 12 === 0 && this.cavalryImpacts.length) {
            for (const imp of this.cavalryImpacts) {
                if (imp.targetRoutedWithin300 || this.tick - imp.tick > 300) continue;
                const tc = this.companies[imp.target];
                if (tc && (tc.status === 'rout' || tc.status === 'gone')) imp.targetRoutedWithin300 = true;
            }
        }
        if(this.tick%30===0){
            if(this.winner===null)this.objectives.update(this);
            this.sampleTimeline();
        }
        if (this.winner !== null && this.tick - this.endTick >= PURSUIT) {
            this.ended = true; this.summarize(); this.rounds.length = 0;
            for (const u of this.units) if (u.hp > 0) { u.moving = false; u.vx = u.vy = 0; u.pose = 'stand'; }
        }
        if(profile)recordPhase(profile,'director',phaseStart);
    }
    private sampleTimeline(){this.timeline.push({tick:this.tick,odds:this.odds(),eff:[this.effective(0),this.effective(1)],morale:[this.armyMorale(0),this.armyMorale(1)]});}
    private summarize(){
        const samples=[{tick:0,odds:this.openingOdds},...this.timeline.filter(p=>p.tick<this.endTick),{tick:this.endTick,odds:this.winner===0?1:0}];
        let cross=-1, fastest=0, swing=0, left=0;
        const windows:number[]=[], sign=this.winner===0?1:-1;
        for(let i=0;i<samples.length;i++){
            while(left+1<i && samples[left+1].tick<=samples[i].tick-900)left++;
            windows.push(left);
            const change=(j:number)=>samples[j].odds-samples[windows[j]].odds;
            if(sign*change(i)>sign*change(fastest))fastest=i;
            if(Math.abs(change(i))>Math.abs(change(swing)))swing=i;
            if(i && sign*(samples[i-1].odds-.5)<0 && sign*(samples[i].odds-.5)>=0)cross=i;
        }
        const point=(kind:TurningPoint['kind'],i:number,start:number):TurningPoint=>{
            const {tick,odds:to}=samples[i],from=samples[start].odds;
            const causes=this.news.filter(n=>n.weight>=2 && Math.abs(n.tick-tick)<=450)
                .sort((a,b)=>b.weight-a.weight || Math.abs(a.tick-tick)-Math.abs(b.tick-tick)).slice(0,3);
            return {kind,tick,delta:to-from,from,to,causes};
        };
        this.turningPoints=[point('decisive',cross<0?fastest:cross,cross<0?windows[fastest]:cross-1),point('swing',swing,windows[swing])];
    }
    private checkVictory() {
        for(const f of [0,1] as const){
            for(const sector of [0,1,2] as const){
                if(this.lostSectors[f][sector])continue;
                const group=this.companies.filter(c=>c.faction===f && c.sector===sector && c.line!==5);
                const peak=group.reduce((n,c)=>n+c.peak,0);
                if(peak<15)continue;
                const eff=group.reduce((n,c)=>n+(c.status==='rout'?0:c.alive),0);
                const morale=group.reduce((n,c)=>n+c.morale*c.alive,0)/Math.max(1,group.reduce((n,c)=>n+c.alive,0));
                if(eff>=.5*peak && morale>=20)continue;
                this.lostSectors[f][sector]=true;
                this.say(ARMY[f]+['左翼','中央','右翼'][sector]+'撤离战区',f,group[0].x,group[0].y,3);
                for(const c of group)if(c.status!=='rout'&&c.alive){c.order='rally';c.forced=-1;c.homeX=c.x+(f?1:-1)*680;}
            }
            if(this.lostSectors[f].filter(Boolean).length>=2 && this.winner===null)this.breakArmy(f,ARMY[f]+'失守两个战区，有序撤退');
        }
        if (this.winner === null && this.tick >= TIMEOUT) {
            const loser: Faction = this.odds() < .5 ? 0 : 1;
            this.breakArmy(loser, `夜幕降临，${ARMY[loser]}趁夜撤离战场`);
        }
    }
    breakArmy(f: Faction, why: string) {
        if (this.broken[f]) return;
        this.broken[f] = true;
        const field=this.companies.filter(c=>c.faction===f && c.status!=='rout' && c.alive>0);
        const screen=field.filter(c=>c.line!==5 && !isArtillery(c) && c.morale>40)
            .sort((a,b)=>(f?1:-1)*(a.x-b.x))[0];
        this.rearGuard[f]=screen?.id??null;
        for(const c of field){
            c.forced=-1;
            c.order=c===screen?'hold':'rally';
            c.homeX=Math.max(80,Math.min(this.width-80,c.x+(c===screen?0:(f?1:-1)*900)));
            c.homeY=c.y;
        }
        if(screen)this.say(screen.name+'留下掩护其余部队撤离',f,screen.x,screen.y,2);
        this.say(`${ARMY[f]}开始全军撤退`, f, this.frontline().x, this.frontline().y, 3);
        if (this.winner === null) { this.winner = (1 - f) as Faction; this.endTick = this.tick; this.reason = why; }
    }
    generalDown(u: Soldier,cause:'炮弹'|'骑兵'='炮弹') {
        const g = this.generals[u.faction];
        if (!g.alive) return;
        g.alive = false;
        this.say(`${g.title}${g.name}${cause==='骑兵'?'遭遇敌骑，落马阵亡':'被流弹击中'}！全军震动`, u.faction, u.x, u.y, 3);
        for (const c of this.companies) if (c.faction === u.faction) shake(c, 14);
    }
    say(text: string, faction: Faction | -1, x: number, y: number, weight: number) {
        this.news.push({ odds:this.odds(),tick: this.tick, text, faction, x, y, weight });

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
            p += c.alive * unitTypes[c.kind].value * (.35 + c.morale / 100) * (c.line === 6 ? 1.5 : 1);
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
    get width() { return this.layout.width; }
}
