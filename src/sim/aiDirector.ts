import type { SimWorld } from './world';
import type { BuildType, Command, CommandAction, Kind } from './types';
import { BUILDINGS, producer, ready } from './buildings';
import { lanes, riverX } from './maps';
import { UNITS } from './config';
export const LORDS = { easy: '愚庸领主', normal: '铁血男爵', brutal: '嗜血暴君' };
export function lordCommands(w: SimWorld): Command[] {
    if (w.mode !== 'lord' || w.winner !== null)
        return [];
    const tier = w.difficulty === 'easy' ? 0 : w.difficulty === 'normal' ? 1 : 2, interval = [155, 100, 65][tier];
    if (w.tick % interval)
        return [];
    const out: Command[] = [], issue = (a: CommandAction) => out.push({ ...a, faction: 1, tick: w.tick });
    const realm = w.realms[1], own = w.units.filter(u => u.faction === 1 && u.hp > 0), enemy = w.units.filter(u => u.faction === 0 && u.hp > 0 && !u.tower);
    const sites = w.structures.filter(s => s.faction === 1 && s.hp > 0);
    const train = (kind: Kind) => issue({ type: 'train', payload: { kind } });
    const farmers = own.filter(u => u.kind === 'peasant').length + sites.reduce((n, s) => n + (s.queue?.filter(q => q.kind === 'peasant').length ?? 0), 0);
    if (farmers < [6, 10, 14][tier])
        train('peasant');
    const stage = Math.floor(w.tick / interval);
    const crossings = lanes(w.map), muster = { x: 2590, y: crossings[0] };
    if (stage === 0)
        issue({ type: 'rally', payload: muster });
    if (stage % 8 === 0) {
        const workers = own.filter(u => u.kind === 'peasant');
        const woodCount = Math.ceil(workers.length * (realm.gold > realm.wood + 200 ? .72 : realm.wood > realm.gold + 150 ? .36 : .5));
        const lumber = workers.filter(u => u.prefer === 'wood');
        const shortage = woodCount - lumber.length;
        const change = shortage > 0 ? workers.filter(u => u.prefer !== 'wood').slice(0, shortage) : lumber.slice(0, -shortage);
        if (change.length)
            issue({ type: 'gather', payload: { resource: shortage > 0 ? 'wood' : 'gold', ids: change.map(u => u.id) } });
    }
    const plan: BuildType[] = ['barracks', 'range', 'stables', 'abbey', 'siege_workshop', 'outpost', 'palisade'];
    const missing = plan.find(type => !sites.some(s => s.type === type));
    if (missing) {
        const [, wood, gold] = BUILDINGS[missing];
        if (realm.wood >= wood && realm.gold >= gold) {
            const forward = missing === 'outpost' || missing === 'palisade';
            for (let i = 0; i < 100; i++) {
                const x = (forward ? riverX(crossings[0]) + (w.map === 'isles' ? 420 : 210) : 2700) + (i % 10) * 62, y = (forward ? crossings[0] - 110 : 790) + Math.floor(i / 10) * 68;
                if (w.blueprint(missing, { x, y }, 1).valid) {
                    issue({ type: 'build', payload: { kind: missing, x, y } });
                    break;
                }
            }
        }
    }
    const targetAge = realm.age < 3 && sites.some(s => s.type === (realm.age === 1 ? 'range' : 'siege_workshop') && ready(s));
    if (targetAge)
        issue({ type: 'age', payload: { x: 0, y: 0 } });
    if (realm.age >= 2 && sites.some(s => s.type === 'abbey' && ready(s)) && stage % 7 === 0)
        issue({ type: 'research', payload: { tech: realm.steel ? 'powder' : 'steel' } });
    const cavalry = enemy.filter(u => UNITS[u.kind].traits.includes('mount')).length, armor = enemy.filter(u => UNITS[u.kind].armor >= .32).length;
    const density = new Map<string, number>();
    for (const u of enemy) {
        const cell = Math.floor(u.x / 180) + ',' + Math.floor(u.y / 180);
        density.set(cell, (density.get(cell) ?? 0) + 1);
    }
    const massed = Math.max(0, ...density.values()) >= 16;
    const counters: Kind[] = cavalry > enemy.length * .26 ? ['halberdier', 'pikeman'] : armor > enemy.length * .32 ? ['musketeer', 'crossbowman'] : massed ? ['hwacha', 'fire_bomber', 'blunderbuss'] : ['shieldman', 'bowman'];
    const wave: Kind[] = ['scout_cavalry', 'horse_archer', 'halberdier', 'musketeer', 'war_elephant', 'catapult', 'ballista', 'battering_ram'];
    const picks: Kind[] = [stage % 3 ? counters[stage % counters.length] : wave[Math.floor(stage / 3) % wave.length], ...counters, 'militia'];
    for (const kind of picks) {
        const [, type, age, wood, gold] = producer(kind);
        const reserve = (missing ? BUILDINGS[missing][2] : 0) + (targetAge ? (realm.age === 1 ? 260 : 420) : 0);
        if (age <= realm.age && sites.some(s => s.type === type && ready(s) && !s.queue?.length) && realm.gold >= gold + (stage % 5 ? reserve : 0) && realm.wood >= wood + (targetAge && stage % 5 ? (realm.age === 1 ? 220 : 340) : 0)) {
            train(kind);
            break;
        }
    }
    if (stage % 6 === 0) {
        const raid = own.filter(u => u.kind === 'scout_cavalry' || u.kind === 'horse_archer'), farmer = enemy.find(u => u.kind === 'peasant');
        if (raid.length && farmer) {
            const flankY = crossings[crossings.length - 1];
            const point = stage % 12 === 6 && raid.some(u => u.x > 2200) ? { x: riverX(flankY) - 260, y: flankY } : { x: farmer.x, y: farmer.y };
            issue({ type: 'order', payload: { ids: raid.map(u => u.id), point } });
        }
    }
    if (stage % 12 === 0 && stage > 0) {
        const army = own.filter(u => !u.tower && !u.escort && !['bannerman', 'peasant', 'sapper', 'horse_archer', 'scout_cavalry'].includes(u.kind));
        for (const formation of ['phalanx', 'line'] as const) {
            const ids = army.filter(u => (formation === 'phalanx' ? ['pikeman', 'halberdier'] : ['crossbowman', 'musketeer', 'blunderbuss']).includes(u.kind)).map(u => u.id);
            if (ids.length)
                issue({ type: 'formation', payload: { ids, formation } });
        }
        if (army.length)
            issue({ type: 'order', payload: { ids: army.map(u => u.id), point: null } });
    }
    return out;
}
