import assert from 'node:assert/strict';
import { SimWorld } from '../src/sim/world';
import { KINDS, capacity, crews, UNITS } from '../src/sim/config';
import { fieldArmy } from '../src/sim/strategy';
import { attack, launch, kill } from '../src/sim/combat';
import type { CommandAction } from '../src/sim/types';
assert.equal(KINDS.length, 18);
const w = new SimWorld(4);
w.reset(4, 'gorge', 'sandbox');
const act = (action: CommandAction) => w.step([{ tick: w.tick, faction: 0, ...action }], false);
const run = (n: number) => { for (let i = 0; i < n; i++)
    w.step([]); };
const trees = () => w.structures.filter(s => s.type === 'tree' && s.hp > 0).length;
const initial = trees(), r = w.realms[0], start = { ...r };
run(800);
assert.ok(trees() < initial && r.gold > start.gold && r.wood > start.wood, 'actual worker harvest');
assert.equal(r.phase, 'PATROL_GATHER');
for (let i = 2; i <= 4; i++) {
    act({ type: 'cottage', payload: {} });
    assert.equal(r.age, i);
    assert.ok(w.structures.some(s => s.type === 'wheat' && s.age === i));
}
assert.deepEqual(capacity, [0, 8, 14, 22, 32]);
w.spawn(0, 'halberdier', 45, { x: 960, y: 880 }, 'phalanx');
run(1);
assert.equal(r.phase, 'WAVE_ASSAULT');
const army = w.units.filter(u => u.faction === 0 && fieldArmy(u));
army.slice(3).forEach(u => kill(w, u, 1, 'musketeer'));
army.slice(0, 3).forEach(u => u.x = 1420);
run(1);
assert.equal(r.phase, 'RETREAT_REGROUP');
run(400);
assert.equal(r.phase, 'PATROL_GATHER');
for (const kind of KINDS) {
    const unit = w.spawn(0, kind, 1, { x: 930, y: 800 }, 'line')[0];
    const target = w.spawn(1, 'plate_knight', 1, { x: 1050, y: 800 }, 'line')[0];
    w.hash.rebuild(w.units);
    w.events = [];
    w.projectiles = [];
    attack(w, unit, target);
    assert.ok(w.events.length, 'attack ' + kind);
    if (kind === 'volley_gunner' || kind === 'organ_gun')
        assert.equal(w.projectiles.length, kind === 'organ_gun' ? 10 : 6);
    if (kind === 'davinci_tank' || crews[kind]) {
        launch(w, unit, 1, 1, 100);
        assert.equal(unit.z, 0);
    }
    if (crews[kind]) {
        const team = w.units.filter(u => u.gun === unit.id);
        assert.equal(team.length, crews[kind]);
        team.forEach(u => kill(w, u, 1, 'rifleman'));
        assert.equal(unit.crew, 0);
        w.projectiles = [];
        attack(w, unit, target);
        assert.equal(w.projectiles.length, 0);
    }
}
w.reset(4, 'gorge', 'lord');
const home = w.keep(0)!;
for (let i = 0; i < 15; i++)
    act({ type: 'train', payload: { kind: 'peasant' } });
assert.equal(home.queue?.length, 4);
const snap = w.snapshot();
run(300);
const replay = w.snapshot();
w.restore(snap);
run(300);
assert.deepEqual(w.snapshot(), replay);
// Isolate delivery size from walking distance by sampling cargo at the same ripe field.
w.reset(4, 'gorge', 'sandbox');
const worker = w.units.find(u => u.kind === 'peasant' && u.faction === 0)!, field = w.structures.find(s => s.type === 'wheat' && s.faction === 0)!;
for (let i = 1; i <= 4; i++) {
    if (i > 1)
        act({ type: 'cottage', payload: {} });
    worker.x = field.x;
    worker.y = field.y + field.h / 2 + 10;
    worker.job = field.id;
    worker.cargo = 0;
    worker.laborTick = 39;
    run(1);
    assert.equal(worker.cargo, Math.round(32 * (1 + .28 * (i - 1))));
}
for (const map of ['darkwood', 'gorge', 'twin'] as const) {
    w.reset(4, map, 'sandbox');
    for (const f of [0, 1] as const) {
        const keep = w.keep(f)!;
        w.spawn(f, 'halberdier', 13, { x: keep.x + (f ? -360 : 360), y: 880 }, 'phalanx');
        w.spawn(f, 'field_cannon', 1, { x: keep.x + (f ? -130 : 130), y: 880 }, 'line');
    }
    let fired = false;
    for (let i = 0; i < 1900; i++) {
        const events = w.step([]);
        if (events.some(e => e.type === 'fire' && e.kind === 'field_cannon'))
            fired = true;
    }
    assert.ok(fired && w.dead[0] + w.dead[1] > 0, 'natural combat ' + map);
    for (const gun of w.units.filter(u => u.kind === 'field_cannon'))
        assert.ok(Math.abs(gun.x - (gun.faction ? 4190 : 610)) < 500);
}
w.reset(4, 'gorge', 'lord', 'brutal');
w.player = 1;
for (let i = 0; i < 10000 && w.winner === null; i++)
    w.step([]);
assert.equal(w.winner, 0);
assert.ok(w.realms[0].age > 1);
console.log('PASS 18 units, projectiles, crew casualties, knockback immunity, resource collection, cottages, cap, wave, retreat and deterministic replay');
