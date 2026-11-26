import { KINDS, UNITS, formationSize, rankFire, strength, shelter } from './config';
import { WIDTH, HEIGHT, bastionOffsets, createMap, lanesForMap, riverX, rampartSlot, siteCapacity } from './maps';
import { Grid } from './grid';
import { campaignTick } from './aiDirector';
import { slotOffset } from './formation';
import { strategyTick } from './strategy';
import { updateProjectiles } from './combat';
import { softSpacing } from './physics';
import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import type { Command, Difficulty, Faction, Formation, Group, Kind, MapId, Mode, Point, Projectile, Realm, SimEvent, Snapshot, Stat, Structure, Unit } from './types';
const blankStats = () => Object.fromEntries(KINDS.map(k => [k, { kills: 0, damage: 0 }])) as Record<Kind, Stat>;
const realm = (): Realm => ({ gold: 260, wave: 0, rosterIndex: 0, order: 'auto' });
const inside = (p: Point) => ({ x: Math.max(4, Math.min(WIDTH - 4, p.x)), y: Math.max(4, Math.min(HEIGHT - 4, p.y)) });
export class SimWorld {
    player: Faction = 1;
    map: MapId = 'gorge';
    mode: Mode = 'sandbox';
    difficulty: Difficulty = 'normal';
    tick = 0;
    next = 10000;
    scenario = 0;
    revision = 0;
    winner: Faction | null = null;
    news = '';
    rng = new Rng(78951);
    hash = new SpatialHash();
    grid!: Grid;
    units: Unit[] = [];
    structures: Structure[] = [];
    projectiles: Projectile[] = [];
    events: SimEvent[] = [];
    groups = new Map<number, Group>();
    byUnit = new Map<number, Unit>();
    byStructure = new Map<number, Structure>();
    bases: Structure[] = [];
    realms = [realm(), realm()];
    stats = [blankStats(), blankStats()];
    dead = [0, 0];
    constructor(index = 0) { this.reset(index); }
    keep(f: Faction) { return this.bases[f]; }
    refuge(g: Group): Point {
        const fort = this.keep(g.faction);
        const dir = g.faction ? -1 : 1;
        return { x: fort.x + dir * 210, y: fort.y + (g.home.y - fort.y) * .4 };
    }
    private homeOrders(g: Group) {
        const order = this.realms[g.faction].order;
        if (order === 'rampart' && this.post(g, this.keep(g.faction)))
            return;
        if (order === 'recall' || order === 'rampart') {
            g.state = 'hold';
            g.point = this.refuge(g);
        }
    }
    private terrain() {
        this.byStructure = new Map(this.structures.map(s => [s.id, s]));
        this.bases = ([0, 1] as const).map(f => this.structures.find(s => s.type === 'keep' && s.faction === f)!);
        this.grid = new Grid(this.map, this.structures);
        this.revision++;
    }
    reset(index: number, map = this.map, mode = this.mode, difficulty = this.difficulty) {
        this.tick = 0;
        this.next = 10000;
        this.scenario = index;
        this.map = map;
        this.mode = mode;
        this.difficulty = difficulty;
        this.winner = null;
        this.rng.state = 78951 + index;
        this.realms = [realm(), realm()];
        this.stats = [blankStats(), blankStats()];
        this.dead = [0, 0];
        this.units = [];
        this.byUnit.clear();
        this.groups.clear();
        this.events = [];
        this.projectiles = [];
        this.structures = createMap(map);
        this.terrain();
        this.news = '两军正在星堡前整队';
        for (const f of [0, 1] as const) {
            const initial: Kind[] = mode === 'lord' ? ['line_infantry', 'line_infantry', 'guard_grenadier', 'bannerman', 'cuirassier', 'field_cannon'] : ['line_infantry', 'bannerman'];
            for (const k of initial)
                this.muster(f, k);
        }
        this.hash.rebuild(this.units);
    }
    private musterPoint(f: Faction) {
        const base = this.keep(f), n = [...this.groups.values()].filter(g => g.faction === f).length;
        return { x: base.x + (f ? -1 : 1) * (304 + Math.floor(n % 9 / 3) * 94), y: base.y + ((n % 3) - 1) * 178 };
    }
    private muster(f: Faction, k: Kind) {
        const p = this.musterPoint(f);
        const dir = f ? -1 : 1;
        const n = [...this.groups.values()].filter(g => g.faction === f).length;
        // 登场新兵从地图外缘乡间小道昂首行军走进战场，再绕过星堡在操场整队出击！
        const entryX = this.tick === 0 ? (f === 0 ? 155 + (n % 3) * 52 : WIDTH - 155 - (n % 3) * 52) : (f === 0 ? 36 : WIDTH - 36);
        const entryY = HEIGHT / 2 + ((n % 3) - 1) * 190;
        const entry = inside({ x: entryX, y: entryY });
        const troops = this.spawn(f, k, strength[k], entry, 'line'), g = this.groups.get(troops[0].group)!;
        g.state = 'assemble';
        g.home = p;
        g.readyAt = this.tick + 125;
        for (const u of troops) {
            u.x = Math.max(6, Math.min(WIDTH - 6, entry.x - dir * ((u.slot % 8) * 9)));
            u.y = Math.max(6, Math.min(HEIGHT - 6, entry.y + (Math.floor(u.slot / 8) - 1.5) * 10));
        }
        this.homeOrders(g);
        return troops;
    }
    recruit(f: Faction, k: Kind) {
        if (!KINDS.includes(k))
            return false;
        if (this.mode === 'lord' && this.realms[f].gold < UNITS[k].gold) {
            if (f === this.player)
                this.news = '军费不足，等待下一批拨款';
            return false;
        }
        if (this.mode === 'lord')
            this.realms[f].gold -= UNITS[k].gold;
        this.muster(f, k);
        return true;
    }
    private add(g: Group, slot: number, form: Formation, p: Point): Unit {
        const f = g.faction, k = g.kind, gap = formationSize(k), offset = slotOffset(slot, g.peak, form, f, gap);
        offset.x += this.rng.int(-5, 5);
        offset.y += this.rng.int(-5, 5);
        const pos = inside({ x: p.x + offset.x, y: p.y + offset.y });
        if (!this.grid.walk(pos.x, pos.y)) {
            const dir = pos.x < riverX(pos.y) ? -1 : 1;
            while (!this.grid.walk(pos.x, pos.y) && pos.x > 4 && pos.x < WIDTH - 4)
                pos.x += dir * 4;
        }
        const u: Unit = { ...pos, id: this.next++, kind: k, faction: f, hp: UNITS[k].hp, group: g.id, slot, formation: form, offset,
            z: 0, vx: 0, vy: 0, face: f ? -1 : 1, aimX: f ? -1 : 1, aimY: 0, moving: false, marchDistance: 0,
            cooldown: 0, tower: 0, morale: k === 'guard_grenadier' ? 100 : 80, routed: false, target: 0, pose: 'march1' };
        if (k === 'field_cannon')
            u.crew = 3;
        u.tower = this.grid.heightSite(u, this.byStructure);
        this.units.push(u);
        this.byUnit.set(u.id, u);
        return u;
    }
    spawn(f: Faction, k: Kind, count: number, center: Point, form: Formation = 'line') {
        const result: Unit[] = [], lanes = lanesForMap(this.map), home = this.musterPoint(f);
        for (let left = Math.min(600, Math.max(1, Math.floor(count))); left > 0;) {
            const n = Math.min(left, strength[k]), id = this.next++, p = inside(center);
            const line = [...this.groups.values()].filter(g => g.faction === f && g.kind === k).length;
            const lane = k === 'cuirassier' ? lanes[f ? lanes.length - 1 : 0] : lanes[line % lanes.length];
            const g: Group = { id, kind: k, faction: f, anchor: { ...p }, home: { ...home }, point: { ...p }, count: n, peak: n, state: 'advance',
                readyAt: this.tick, lane, site: 0, seat: 0, nextVolley: 0, volleyAt: -1000, enemy: 0, restTick: 0, manual: false };
            this.groups.set(id, g);
            for (let slot = 0; slot < n; slot++)
                result.push(this.add(g, slot, form, p));
            left -= n;
        }
        return result;
    }
    refit(g: Group, troops: Unit[], refuge: Point) {
        const used = new Set(troops.map(u => u.slot));
        for (let i = 0; i < g.peak; i++)
            if (!used.has(i))
                this.add(g, i, troops[0].formation, refuge);
        for (const u of troops) {
            u.hp = UNITS[u.kind].hp;
            u.morale = u.kind === 'guard_grenadier' ? 100 : 80;
            u.routed = false;
            u.cooldown = 0;
        }
        g.count = g.peak;
        g.state = 'assemble';
        g.anchor = { ...refuge };
        g.readyAt = this.tick + 90;
        g.enemy = 0;
        this.homeOrders(g);
    }
    post(g: Group, site: Structure) {
        if (!rankFire(g.kind) || !shelter(site.type) || site.hp <= 0 || (site.faction !== -1 && site.faction !== g.faction) || g.state === 'retreat' || g.state === 'rest')
            return false;
        const reserved = [...this.groups.values()].filter(a => a.id !== g.id && a.site === site.id);
        for (let seat = 0; seat + g.peak <= siteCapacity(site); seat++) {
            if (reserved.some(a => seat < a.seat + a.peak && seat + g.peak > a.seat))
                continue;
            g.state = 'garrison';
            g.site = site.id;
            g.seat = seat;
            g.manual = false;
            g.point = rampartSlot(site, seat, g.faction);
            return true;
        }
        return false;
    }
    damageStructure(s: Structure, amount: number, f: Faction, k: Kind) {
        if (s.hp <= 0)
            return;
        this.stats[f][k].damage += Math.min(s.hp, amount);
        s.hp = Math.max(0, s.hp - amount);
        if (s.hp === 0) {
            this.events.push({ type: 'collapse', x: s.x, y: s.y, structure: { ...s } });
            this.revision++;
            if (s.type === 'keep') {
                this.winner = f;
                this.news = f === this.player ? '攻克敌方星堡' : '己方星堡失守';
            }
        }
    }
    private apply(c: Command) {
        const f = c.faction;
        switch (c.type) {
            case 'restore':
                this.restore(c.payload.state);
                return;
            case 'scenario':
                this.reset(c.payload.index, c.payload.map, c.payload.mode, c.payload.difficulty);
                return;
            case 'train':
                this.recruit(f, c.payload.kind);
                return;
            case 'spawn':
                if (this.mode === 'sandbox' && KINDS.includes(c.payload.kind))
                    this.spawn(f, c.payload.kind, c.payload.count, c.payload, c.payload.formation);
                return;
            case 'charge':
            case 'recall':
            case 'rampart': {
                this.realms[f].order = c.type;
                for (const g of this.groups.values()) {
                    if (g.faction !== f || g.state === 'retreat' || g.state === 'rest')
                        continue;
                    if (c.type === 'rampart' && this.post(g, this.keep(f)))
                        continue;
                    g.state = c.type === 'charge' ? 'advance' : 'hold';
                    g.manual = false;
                    g.site = 0;
                    g.point = c.type === 'charge' ? null : this.refuge(g);
                }
                return;
            }
        }
        const ids = new Set(c.payload.ids.map(id => this.byUnit.get(id)?.group));
        for (const id of ids) {
            const g = id ? this.groups.get(id) : undefined;
            if (!g || g.faction !== f || g.state === 'retreat' || g.state === 'rest')
                continue;
            if (c.type === 'garrison') {
                const site = this.byStructure.get(c.payload.tower);
                if (site)
                    this.post(g, site);
            }
            if (c.type === 'order') {
                g.site = 0;
                g.point = c.payload.point && inside(c.payload.point);
                g.manual = !!g.point;
                g.state = 'advance';
            }
            if (c.type === 'formation')
                for (const u of this.units)
                    if (u.group === id) {
                        u.formation = c.payload.formation;
                        u.offset = slotOffset(u.slot, g.peak, u.formation, f, formationSize(u.kind));
                        u.offset.x += ((u.id * 17) % 11) - 5;
                        u.offset.y += ((u.id * 7) % 11) - 5;
                    }
        }
    }
    step(commands: Command[] = [], advance = true): SimEvent[] {
        this.events = [];
        for (const c of commands)
            if (c.tick === this.tick)
                this.apply(c);
        if (!advance || this.winner !== null)
            return this.events;
        campaignTick(this);
        const members = new Map<number, Unit[]>();
        for (const u of this.units)
            if (u.hp > 0) {
                let a = members.get(u.group);
                if (!a) {
                    a = [];
                    members.set(u.group, a);
                }
                a.push(u);
            }
        for (const [id, g] of this.groups)
            if (!members.has(id))
                this.groups.delete(g.id);
        strategyTick(this, members);
        this.fortressCannons();
        this.hash.rebuild(this.units);
        softSpacing(this.units, this.hash, this.grid);
        this.hash.rebuild(this.units);
        updateProjectiles(this);
        this.units = this.units.filter(u => { if (u.hp > 0)
            return true; this.byUnit.delete(u.id); return false; });
        this.tick++;
        return this.events;
    }
    // 沃邦星堡四座突出角台独立火炮系统：超远射程自动开火，让星堡极难攻克！
    private fortressCannons() {
        for (const fort of this.bases) {
            if (!fort || fort.hp <= 0 || fort.faction < 0)
                continue;
            const f = fort.faction as Faction;
            const slots = bastionOffsets(f);
            if (!fort.cannonCooldowns || fort.cannonCooldowns.length !== 4)
                fort.cannonCooldowns = [30, 70, 110, 150];
            if (!fort.cannonAim || fort.cannonAim.length !== 4)
                fort.cannonAim = slots.map(() => ({ x: f ? -1 : 1, y: 0, firedAt: -999 }));
            for (let i = 0; i < 4; i++) {
                if (fort.cannonCooldowns[i] > 0) {
                    fort.cannonCooldowns[i]--;
                    continue;
                }
                const gx = fort.x + slots[i].x, gy = fort.y + slots[i].y;
                let target: Unit | undefined, best = 860;
                for (const u of this.units) {
                    if (u.hp <= 0 || u.faction === f)
                        continue;
                    const d = Math.hypot(u.x - gx, u.y - gy);
                    if (d < best) {
                        best = d;
                        target = u;
                    }
                }
                if (!target)
                    continue;
                const dx = (target.x - gx) / (best || 1), dy = (target.y - gy) / (best || 1);
                fort.cannonCooldowns[i] = 148 + this.rng.int(0, 36);
                fort.cannonAim[i] = { x: dx, y: dy, firedAt: this.tick };
                const tx = target.x + this.rng.int(-14, 14), ty = target.y + this.rng.int(-14, 14);
                const ticks = Math.max(4, Math.ceil(best / 34));
                const x = gx + dx * 18, y = gy + dy * 18, z = 26;
                this.projectiles.push({
                    id: this.next++, x, y, z, vx: (tx - x) / ticks, vy: (ty - y) / ticks, vz: -z / ticks,
                    gravity: 0, remaining: ticks, target: target.id, kind: 'ball', source: 'field_cannon',
                    damage: 138, faction: f
                });
                this.events.push({ type: 'fire', x: gx, y: gy, z, dx, dy, kind: 'field_cannon', faction: f });
            }
        }
    }
    snapshot(): Snapshot {
        return structuredClone({ version: 6, tick: this.tick, seed: this.rng.state, next: this.next, scenario: this.scenario, player: this.player,
            map: this.map, mode: this.mode, difficulty: this.difficulty, realms: this.realms, news: this.news, units: this.units, structures: this.structures,
            projectiles: this.projectiles, groups: [...this.groups.values()], stats: this.stats, dead: this.dead, winner: this.winner });
    }
    restore(state: Snapshot) {
        const s = structuredClone(state);
        if (s.version !== 6)
            throw Error('需要转换旧版布阵');
        this.tick = s.tick;
        this.next = s.next;
        this.rng.state = s.seed;
        this.scenario = s.scenario;
        this.player = s.player;
        this.map = s.map;
        this.mode = s.mode;
        this.difficulty = s.difficulty;
        this.news = s.news;
        this.realms = s.realms;
        this.units = s.units;
        this.structures = s.structures;
        this.projectiles = s.projectiles;
        this.stats = s.stats;
        this.dead = s.dead;
        this.winner = s.winner;
        this.groups = new Map(s.groups.map(g => [g.id, g]));
        this.byUnit = new Map(s.units.map(u => [u.id, u]));
        this.events = [];
        this.terrain();
        this.hash.rebuild(this.units);
    }
}
