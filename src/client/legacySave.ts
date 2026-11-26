import { SimWorld } from '../sim/world';
import { WIDTH, HEIGHT } from '../sim/maps';
import { KINDS, UNITS, strength } from '../sim/config';
import type { Faction, Formation, Kind, Point, Snapshot, MapId, Mode, Difficulty } from '../sim/types';
import type { Mark } from './decalLayer';
interface OldUnit extends Point {
    kind: string;
    id: number;
    group: number;
    faction: Faction;
    hp: number;
    formation: Formation;
    tower?: number;
    gun?: number;
}
interface OldState {
    map?: MapId;
    mode?: Mode;
    difficulty?: Difficulty;
    player?: Faction;
    scenario: number;
    tick: number;
    seed: number;
    units: OldUnit[];
    groups: {
        id: number;
        point?: Point;
        resting?: boolean;
    }[];
    realms?: {
        gold: number;
    }[];
    dead?: number[];
    winner: Faction | null;
    structures: {
        type: string;
        faction: Faction;
        hp: number;
        maxHp: number;
    }[];
    stats?: Record<string, {
        kills: number;
        damage: number;
    }>[];
}
const scale = (p: Point) => ({ x: p.x * WIDTH / 4800, y: p.y * HEIGHT / 1760 });
function kindFor(k: string): Kind | null {
    if (KINDS.includes(k as Kind))
        return k as Kind;
    if (['peasant', 'supply_wagon'].includes(k))
        return null;
    if (/artillery|howitzer|mortar|organ_gun|tank|rocket/.test(k))
        return 'field_cannon';
    if (/hussar|dragoon|lancer|cavalry/.test(k))
        return 'cuirassier';
    if (/highlander|guard|knight|zweihander/.test(k))
        return 'guard_grenadier';
    return 'line_infantry';
}
export function migrateMarks(marks: Mark[]): Mark[] {
    return marks.map(([x, y, w, h, c]) => [Math.round(x * WIDTH / 4800), Math.round(y * HEIGHT / 1760), w, h, c]);
}
export function upgradeLegacy(old: OldState): Snapshot {
    const w = new SimWorld(old.scenario);
    w.reset(old.scenario, old.map ?? 'twin', old.mode ?? 'sandbox', old.difficulty ?? 'normal');
    w.units = [];
    w.groups.clear();
    w.byUnit.clear();
    w.tick = old.tick;
    w.rng.state = old.seed;
    w.player = old.player ?? 1;
    const companies = new Map<string, OldUnit[]>();
    for (const u of old.units) {
        if (u.hp <= 0 || u.gun || !kindFor(u.kind))
            continue;
        const key = [u.faction, u.group, kindFor(u.kind), u.tower ?? 0].join('/');
        const company = companies.get(key) ?? [];
        company.push(u);
        companies.set(key, company);
    }
    for (const company of companies.values()) {
        const first = company[0], k = kindFor(first.kind)!;
        for (let start = 0; start < company.length; start += strength[k]) {
            const entries = company.slice(start, start + strength[k]);
            const p = scale({ x: entries.reduce((v, u) => v + u.x, 0) / entries.length, y: entries.reduce((v, u) => v + u.y, 0) / entries.length });
            const troops = w.spawn(first.faction, k, entries.length, p, 'line'), g = w.groups.get(troops[0].group)!;
            troops.forEach((u, i) => { u.hp = Math.min(UNITS[k].hp, entries[i].hp); });
            const prior = old.groups.find(g => g.id === first.group);
            if (first.tower)
                w.post(g, w.keep(first.faction));
            else if (prior?.resting)
                g.state = 'retreat';
            else if (prior?.point) {
                g.point = scale(prior.point);
                g.manual = true;
            }
        }
    }
    for (const f of [0, 1] as const) {
        w.realms[f].gold = old.realms?.[f]?.gold ?? 260;
        const fort = old.structures.find(s => s.type === 'keep' && s.faction === f);
        if (fort && fort.maxHp > 0)
            w.keep(f).hp = Math.round(w.keep(f).maxHp * fort.hp / fort.maxHp);
        for (const [oldKind, stats] of Object.entries(old.stats?.[f] ?? {})) {
            const k = kindFor(oldKind);
            if (k) {
                w.stats[f][k].damage += stats.damage;
                w.stats[f][k].kills += stats.kills;
            }
        }
    }
    w.dead = old.dead ?? [0, 0];
    w.winner = old.winner;
    w.news = '旧版部队已按新编制整队';
    return w.snapshot();
}
