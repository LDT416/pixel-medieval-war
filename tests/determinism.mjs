// Run with node tests/determinism.mjs. For each scale run two complete battles with seed 7919.
// Hash every unit in array order, including casualties, escapees and reinforcements.
// Each contributes x, y and hp as little-endian float64 values after the pursuit ends.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const result = await build({
    stdin: {contents: "export * from './src/sim/world'", resolveDir: process.cwd()},
    platform: 'node', format: 'esm', bundle: true, write: false
});
const {SimWorld, TIMEOUT, PURSUIT} = await import('data:text/javascript;base64,' +
    Buffer.from(result.outputFiles[0].contents).toString('base64'));

function replay(scale, seed) {
    const world = new SimWorld(scale, seed);
    while (!world.ended && world.tick <= TIMEOUT + PURSUIT) world.step();
    assert.ok(world.ended, 'battle reached its end');
    const state = Buffer.alloc(world.units.length * 24);
    let offset = 0;
    for (const unit of world.units) {
        for (const value of [unit.x, unit.y, unit.hp]) {
            assert.ok(Number.isFinite(value));
            offset = state.writeDoubleLE(value, offset);
        }
    }
    return {scale, seed, units: world.units.length, tick: world.tick, winner: world.winner,
        sha256: createHash('sha256').update(state).digest('hex')};
}

for (const scale of [2400, 10000]) {
    const first = replay(scale, 7919);
    console.log(JSON.stringify(first));
    const second = replay(scale, 7919);
    console.log(JSON.stringify(second));
    assert.deepEqual(second, first);
}
