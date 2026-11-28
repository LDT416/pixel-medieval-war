import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    stdin: { contents: "export * from './src/sim/marchRoutes'; export * from './src/sim/maps'; export * from './src/sim/rng';", resolveDir: process.cwd() },
    platform: 'node', bundle: true, format: 'esm', write: false
});
const { MarchRoutes, createCampaignLayout, Rng, inRect, onRoad } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function fixture() {
    const layout = createCampaignLayout(new Rng(1815), 1);
    return { ...layout, width: 3200, height: 1600, farms: [], woods: [], bridges: [], roads: [], river: { width: 0, points: [] } };
}
function sample(start, path) {
    const samples = [];
    let a = start;
    for (const b of path) {
        const count = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 8));
        for (let i = 1; i <= count; i++) samples.push({ x: a.x + (b.x - a.x) * i / count, y: a.y + (b.y - a.y) * i / count });
        a = b;
    }
    return samples;
}
const layout = fixture(), start = { x: 140, y: 800 }, goal = { x: 2990, y: 800 };
const query = (planner, traffic = []) => planner.path(start.x, start.y, goal.x, goal.y, traffic, 0);
const flat = new MarchRoutes(layout);
assert.deepEqual(query(flat), [goal], 'straight travel stays straight');
const crowd = Array.from({ length: 8 }, (_, i) => ({ id: i, x: 1440 + (i % 4) * 60, y: 760 + (i >> 2) * 50, faction: 0, alive: 35, status: 'steady' }));
const detour = query(flat, crowd);
assert.deepEqual(detour.at(-1), goal);
assert.ok(detour.some(p => Math.abs(p.y - start.y) > 130), 'a stationary queue diverts incoming traffic');
assert.deepEqual(query(flat, crowd.map(c => ({ ...c, faction: 1 }))), [goal]);
assert.deepEqual(query(flat, crowd.map(c => ({ ...c, alive: 0 }))), [goal]);

const forest = { x: 1100, y: 805, r: 320 }, farm = { x: 2050, y: 930, w: 230, h: 410 };
const blockedLayout = { ...layout, woods: [forest], farms: [farm] }, blocked = new MarchRoutes(blockedLayout);
const around = query(blocked);
assert.deepEqual(around.at(-1), goal);
assert.ok(around.length > 1);
for (const p of sample(start, around)) {
    assert.ok(Math.hypot(p.x - forest.x, p.y - forest.y) >= forest.r + 17, 'segment cuts a grove');
    assert.ok(!inRect(farm, p.x, p.y, 17), 'segment cuts a compound wall');
}
const entering = blocked.path(start.x, start.y, farm.x, farm.y, [], 0);
assert.deepEqual(entering.at(-1), { x: farm.x, y: farm.y });
assert.ok(entering.at(-3).x < farm.x - farm.w / 2 && entering.at(-3).y === farm.y && entering.at(-2).y === farm.y, 'enter through the mapped gate');
assert.deepEqual(blocked.path(entering.at(-2).x, entering.at(-2).y, farm.x, farm.y, [], 0), [{ x: farm.x, y: farm.y }], 'a replan after entering continues to the station');
assert.deepEqual(new MarchRoutes(blockedLayout).path(start.x, start.y, goal.x, goal.y, [], 0), around);
const farEdge = { x: forest.x + forest.r - 25, y: forest.y };
const reach = blocked.path(start.x, start.y, farEdge.x, farEdge.y, [], 0);
assert.deepEqual(reach.at(-1), farEdge);
assert.ok(sample(start, reach).filter(p => Math.hypot(p.x - forest.x, p.y - forest.y) < forest.r).length < 7, 'approach the near edge of the station without traversing the entire grove');
const wall = new MarchRoutes({ ...layout, farms: [{ x: 1600, y: 800, w: 350, h: 2200 }] });
assert.deepEqual(query(wall), [], 'a wall spanning the map makes the destination unreachable');
assert.deepEqual(wall.waypoint(0, start.x, start.y, goal.x, goal.y, 0, [], 0), start, 'unreachable party stays in place');

const roads = { ...layout, roads: [{ width: 44, points: [{ x: 0, y: 650 }, { x: 3200, y: 650 }] }] };
const road = query(new MarchRoutes(roads));
assert.deepEqual(road.at(-1), goal);
const roadSamples = sample(start, road);
assert.ok(roadSamples.filter(p => onRoad(p.x, p.y, roads)).length > roadSamples.length * .55, 'a faster parallel road is used for most of a long trip');
const way = blocked.waypoint(0, start.x, start.y, goal.x, goal.y, 1, [], 0);
assert.deepEqual(way, around[0]);
assert.deepEqual(blocked.waypoint(0, way.x, way.y, goal.x, goal.y, 2, [], 0), around.length > 2 ? around[1] : null);
assert.equal(blocked.waypoint(0, 2500, 200, 2800, 200, 3, [], 0), null, 'a new destination discards a stale route');
const shifted = new MarchRoutes({ ...layout, farms: [{ x: 1250, y: 760, w: 110, h: 60 }] });
assert.equal(shifted.waypoint(0, 180, 640, 1500, 640, 0, [], 0), null);
assert.ok(shifted.waypoint(0, 180, 640, 1500, 780, 1, [], 0), 'small endpoint changes must recheck the last segment for a wall');
console.log(JSON.stringify({ straight: 1, roadPercent: Math.round(100 * roadSamples.filter(p => onRoad(p.x, p.y, roads)).length / roadSamples.length), obstacleTurns: around.length - 1, congestionTurns: detour.length - 1, deterministic: true }));
