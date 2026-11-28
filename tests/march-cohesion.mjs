import assert from 'node:assert/strict';
import {build} from 'esbuild';

const {outputFiles} = await build({
    stdin: {contents: "export {MarchCohesion} from './src/sim/marchCohesion'; export {SimWorld} from './src/sim/world'",
        resolveDir: process.cwd()},
    platform: 'node', format: 'esm', bundle: true, write: false,
});
const {MarchCohesion, SimWorld} = await import('data:text/javascript;base64,' +
    Buffer.from(outputFiles[0].contents).toString('base64'));

function shouldWait(cohesion, w, b) {
    return cohesion.shouldWait(w, b, b.companies.map(id => w.companies[id]), [-160, 160]);
}

function fixture(faction = 0) {
    const direction = faction ? -1 : 1;
    const w = {tick: 420, companies: [], battalions: [], layout: {width: 16000, height: 8000},
        logistics: {isCommitted: c => !!c.committed}};
    const cohesion = new MarchCohesion();
    function group(x, y) {
        const id = w.battalions.length;
        const b = {id, faction, x: 8000 + x * direction, y, gx: 8000 + 6000 * direction, gy: y, hx: direction, hy: 0,
            order: 'advance', line: 0, stoppedAt: -1, closing: false, sector: 1, companies: []};
        w.battalions.push(b);
        for (const lateral of [-160, 160]) {
            b.companies.push(w.companies.length);
            w.companies.push({x: b.x, y: b.y + direction * lateral, alive: 32, status: 'steady',
                engaged: false, underFire: 0, formation: 'line'});
        }
        return b;
    }
    function move(b, pixels) {
        b.x += pixels * direction;
        for (const id of b.companies) w.companies[id].x += pixels * direction;
    }
    return {w, cohesion, group, move};
}

function catchUp(faction) {
    const {w, cohesion, group, move} = fixture(faction);
    const front = group(3000, 1800), back = group(2400, 2100);
    const startX = front.x;
    let resumed = null;
    for (let i = 0; i < 200; i++, w.tick++) {
        const waiting = shouldWait(cohesion, w, front);
        assert.equal(shouldWait(cohesion, w, back), false, 'the trailing group keeps its usual pace');
        if (waiting) assert.equal(front.x, startX);
        else {
            if (resumed === null) resumed = Math.abs(front.x - back.x);
            move(front, 3);
        }
        move(back, 3);
    }
    assert.ok(resumed !== null && resumed <= 200);
    assert.equal(cohesion.stats.neighborWaits, 1);
    assert.equal(cohesion.stats.timeoutReleases, 0);
    return {held: cohesion.stats.heldUpdates, resumed};
}

const east = catchUp(0);
assert.deepEqual(catchUp(1), east, 'both map directions should have the same march behavior');
assert.deepEqual(catchUp(0), east, 'running the march twice must give the same result');

{
    const {w, cohesion, group} = fixture();
    const b = group(1800, 1700);
    const rear = w.companies[b.companies[1]];
    assert.equal(shouldWait(cohesion, w, b), false);
    rear.x -= 110;
    assert.equal(shouldWait(cohesion, w, b), true, 'a lone group should wait for its own member');
    rear.x = b.x - 50;
    assert.equal(shouldWait(cohesion, w, b), true);
    rear.x = b.x - 34;
    assert.equal(shouldWait(cohesion, w, b), false);
    assert.equal(cohesion.stats.memberWaits, 1);
    rear.x = b.x - 110;
    rear.committed = true;
    assert.equal(shouldWait(cohesion, w, b), false, 'a member on a separate assignment must not delay the group');
    rear.committed = false;
    rear.y = b.y + 300;
    rear.x = b.x;
    assert.equal(shouldWait(cohesion, w, b), false, 'lateral spacing is not lag');
}

{
    const {w, cohesion, group} = fixture();
    const front = group(3000, 1700), stalled = group(2400, 1900);
    assert.equal(shouldWait(cohesion, w, front), true);
    w.tick += 90;
    for (let i = 0; i < 200; i++, w.tick++) assert.equal(shouldWait(cohesion, w, front), false);
    assert.equal(cohesion.stats.timeoutReleases, 1, 'a stalled follower gets one bounded wait');
    cohesion.reset();
    assert.equal(cohesion.stats.heldUpdates, 0);
    assert.equal(shouldWait(cohesion, w, front), true);
    stalled.order = 'hold';
    assert.equal(shouldWait(cohesion, w, front), false, 'a new stop order releases other groups');
    stalled.order = 'advance';
    stalled.sector = 2;
    assert.equal(shouldWait(cohesion, w, front), false);
    stalled.sector = 1;
    stalled.faction = 1;
    assert.equal(shouldWait(cohesion, w, front), false);
    stalled.faction = 0;
    for (const id of stalled.companies) w.companies[id].status = 'gone';
    assert.equal(shouldWait(cohesion, w, front), false);
}

{
    const {w, cohesion, group} = fixture();
    const lead = group(1600, 3000), tail = group(1600, 2400);
    for (const b of [lead, tail]) {
        b.order = b === lead ? 'hold' : 'reserve';
        b.line = 1;
        b.gx = b.x;
        b.gy = 5000;
    }
    assert.equal(shouldWait(cohesion, w, lead), true, 'companions traveling north to a shared stop wait');
    assert.equal(shouldWait(cohesion, w, tail), false, 'lateral slots are already in position');
    tail.gy = 6600;
    assert.equal(shouldWait(cohesion, w, lead), false, 'distant destinations are independent trips');
    const delayed = w.companies[lead.companies[1]];
    delayed.y -= 100;
    assert.equal(shouldWait(cohesion, w, lead), true, 'delay is measured along the Y route');
    lead.homeX = lead.gx;
    lead.homeY = lead.gy;
    delayed.objectiveParking = {battalionX: lead.homeX, battalionY: lead.homeY};
    assert.equal(shouldWait(cohesion, w, lead), false, 'a separate parking assignment is not march lag');
    delete delayed.objectiveParking;
    delayed.y += 100;
    assert.equal(shouldWait(cohesion, w, lead), false);
    // Same nearby destinations but diverging directions must not lock each other.
    lead.gx = lead.x - 330;
    lead.gy = lead.y + 300;
    tail.gx = tail.x + 330;
    tail.gy = lead.gy;
    assert.equal(shouldWait(cohesion, w, lead), false);
}

// Exercise the normal world entry point. A detached helper could pass every fixture above.
const world = new SimWorld(2400, 7919);
while (world.tick < 2800 && !world.marchCohesion.stats.heldUpdates) world.step();
assert.ok(world.marchCohesion.stats.memberWaits > 0, 'a normal march must notice actual member positions');
const firstWaitAt = world.tick;
world.reset(2400, 7919);
assert.equal(world.marchCohesion.stats.heldUpdates, 0);
console.log(JSON.stringify({sameDirectionCatchUp: east, singleGroupCatchUp: true, stalledFollowerReleased: true,
    firstWaitAt}));
