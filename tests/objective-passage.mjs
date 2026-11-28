import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    stdin: { contents: `
        export * from './src/sim/objectivePassage';
        export * from './src/sim/campaignObjectives';
        export { createCampaignLayout, onRoad, riverAt } from './src/sim/maps';
        export { Crowd } from './src/sim/crowd';
        export { Rng } from './src/sim/rng';
        export { SimWorld } from './src/sim/world';
        export { formUp } from './src/sim/strategy';
    `, resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { objectiveStop, objectiveWaitingStop, blocksObjectivePassage, CampaignObjectives, CAPTURE_TICKS, createCampaignLayout,
    onRoad, riverAt, Crowd, Rng, SimWorld, formUp } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

// Check each generated destination against the game's own capture clock.
const checks = { bridge: 0, farm: 0, ridge: 0 };
let local = 0, waiting = 0;
for (let seed = 1; seed <= 24; seed++) {
    const layout = createCampaignLayout(new Rng(seed), seed % 2);
    for (const site of layout.objectives) {
        const from = { x: seed % 2 ? 30 : layout.width - 30, y: site.y };
        const stop = objectiveStop(layout, site, from);
        assert.ok(stop, `seed ${seed} ${site.name} has no stop`);
        assert.deepEqual(objectiveStop(layout, site, from), stop);
        assert.ok(!onRoad(stop.x, stop.y, layout));
        assert.ok(Math.abs(stop.x - riverAt(stop.y, layout)) > layout.river.width / 2);
        assert.ok(!blocksObjectivePassage(layout, site, stop));
        const observer = { ...stop, kind: 'line_infantry', faction: 0, status: 'steady', alive: 1, captures: 0 };
        const marker = { ...site, owner: 1, heldTicks: [0, 0] };
        const clock = new CampaignObjectives();
        const world = { layout: { ...layout, objectives: [marker] }, companies: [observer], tick: 0, winner: null, say() {} };
        for (let tick = 30; tick <= CAPTURE_TICKS; tick += 30) {
            world.tick = tick;
            clock.update(world);
        }
        assert.equal(marker.owner, 0);
        checks[site.kind]++;
        if (site.kind === 'bridge') {
            const wide = objectiveStop(layout, site, from, 55);
            const bay = wide ?? objectiveWaitingStop(layout, site, from, 55);
            assert.ok(bay, `seed ${seed} bridge has no free bank`);
            assert.ok((bay.x - riverAt(bay.y, layout)) * (from.x - riverAt(from.y, layout)) > 0);
            assert.ok(!onRoad(bay.x, bay.y, layout));
            if (wide) local++;
            else { waiting++; assert.ok(Math.hypot(bay.x - site.x, bay.y - site.y) > 135); }
        }
    }
}
assert.ok(local && waiting);

const bridge = { id: 0, kind: 'bridge', name: '桥', x: 1000, y: 600, w: 170, h: 54 };
const layout = { ...createCampaignLayout(new Rng(1), 0), width: 2000, height: 1200,
    river: { width: 90, points: [{ x: 1000, y: 0 }, { x: 1000, y: 1200 }] },
    roads: [{ width: 44, points: [{ x: 0, y: 600 }, { x: 2000, y: 600 }] }],
    bridges: [bridge], objectives: [bridge], farms: [], woods: [], farm: null };
const from = { x: 650, y: 600 };
const first = objectiveStop(layout, bridge, from);
const second = objectiveStop(layout, bridge, from, 24, [first]);
assert.ok(first && second && first.x < bridge.x && second.x < bridge.x);
assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= 52);
assert.ok(blocksObjectivePassage(layout, bridge, bridge));
assert.ok(!blocksObjectivePassage(layout, bridge, from));
assert.equal(objectiveStop({ ...layout, river: { ...layout.river, width: 2000 } }, bridge, from), null);
assert.equal(objectiveWaitingStop({ ...layout, river: { ...layout.river, width: 2000 } }, bridge, from), null);

// Run two parked groups and three crossing walkers through the production crowd solver.
function walkAcross() {
    const crowd = new Crowd();
    crowd.reset(layout);
    const units = [], companies = [{ hx: 1, hy: 0 }, { hx: 1, hy: 0 }, { hx: 1, hy: 0 }];
    function add(x, y, company) {
        units.push({ id: units.length, company, kind: 'line_infantry', hp: 1, x, y,
            body: { a: 5, b: 5, mass: 1 }, speed: 60, moving: false, stride: 0 });
    }
    for (const [index, stop] of [first, second].entries()) {
        for (const dx of [-9, 9]) for (const dy of [-9, 9]) add(stop.x + dx, stop.y + dy, index);
    }
    for (const y of [588, 600, 612]) add(790, y, 2);
    const walkers = units.slice(-3);
    const world = { units, companies, tick: 0, deployEnd: 0 };
    crowd.step(world);
    for (let tick = 1; tick <= 230; tick++) {
        world.tick = tick;
        for (const unit of walkers) unit.x += 2;
        crowd.step(world);
        assert.equal(crowd.overlaps(world), 0);
    }
    assert.ok(walkers.every(unit => unit.x >= 1250));
    return units.map(unit => [unit.x, unit.y]);
}
assert.deepEqual(walkAcross(), walkAcross());

const game = new SimWorld(1200, 42);
while (game.tick < game.deployEnd + 150) game.step();
const stationed = game.companies.filter(c => c.objectiveParking);
assert.ok(stationed.some(c => c.line === 6));
assert.ok(stationed.some(c => c.battalion >= 0));
for (const c of stationed) {
    const site = game.layout.objectives[c.objectiveParking.site];
    for (const u of c.members) assert.ok(!blocksObjectivePassage(game.layout, site, u, u.body.a), `${c.name}: blocked deployment passage`);
}

// Bring a full battalion to the entrance, then let ordinary couriers and movement take over.
const bat = game.battalions[0], companies = bat.companies.map(id => game.companies[id]);
const destination = game.layout.objectives.find(p => p.kind === 'bridge');
const entrance = { x: destination.x - 230, y: destination.y - 180 };
game.director.update = () => {}; game.sight.canSee = () => false;
Object.assign(bat, { ...entrance, homeX: destination.x, homeY: destination.y, order: 'hold', stoppedAt: -1, aligned: false });
for (const [i, c] of companies.entries()) {
    const x = entrance.x - i * 100, y = entrance.y;
    Object.assign(c, { x, y, homeX: x, homeY: y, order: 'hold', objectiveParking: undefined, hx: 1, hy: 0, formation: 'line', engaged: false });
    formUp(c);
    Object.assign(game.generals[c.faction].unit, { x, y });
    assert.ok(game.logistics.dispatch(game, c, 'hold', -1, destination) > 0);
}
game.crowd.reset(game.layout); game.crowd.step(game); game.hash.rebuild(game.units);
for (let i = 0; i < 1000; i++) game.step();
const distances = companies.map(c => Math.round(Math.hypot(c.x - c.homeX, c.y - c.homeY)));
for (const c of companies) {
    assert.equal(c.objectiveParking?.site, destination.id);
    for (const u of c.members) assert.ok(!blocksObjectivePassage(game.layout, destination, u, u.body.a), `${c.name}: blocked bridge`);
}
assert.ok(Math.max(...distances) < 24, JSON.stringify(distances));
assert.ok(bat.aligned && bat.stoppedAt >= 0);
const released = companies[0];
Object.assign(game.generals[released.faction].unit, { x: released.x, y: released.y });
assert.ok(game.logistics.dispatch(game, released, 'rally', -1, entrance) > 0);
game.step();
assert.equal(released.objectiveParking, undefined, 'new order releases the bay');
console.log('Objective parking: capture clock passed', checks, 'wide bridge groups', { local, waiting },
    'and three walkers crossed two parked groups without overlap. Battalion arrival distances:', distances);
