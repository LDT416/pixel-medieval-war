/**
 * 任务书 13 场景测试 S1～S4：
 * - S1：两个营正面相对、相距 3000px，同时下令推进。检查双方在 700～1000px 停下，并完成首轮齐射。
 * - S2：在 S1 的基础上，对一方施加 40 点士气打击。检查另一方在 300 tick 内发起刺刀冲锋。
 * - S3：一个营正在对射，另一个敌营从侧翼 90° 方向、距离 700px 处出现。检查营端的连在 150 tick 内完成转向。
 * - S4：一个满员、士气满的敌营位于 2000px 处。检查在 1200 tick 内不会对它发起冲锋。
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const r = await build({
    stdin: { contents: "export * from './src/sim/world'; export { formUp } from './src/sim/strategy'; export { alignBattalionCompanies, activeCompanies } from './src/sim/battalion';", resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent'
});
const { SimWorld, formUp, alignBattalionCompanies, activeCompanies } =
    await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));

function setupIsolatedWorld(seed = 42) {
    const w = new SimWorld(2400, seed);
    w.weather = 'clear';
    w.tick = w.deployEnd;
    w.reinforcement = null;
    // 移除地形遮挡，避免树林/山脊干扰受控几何场景
    w.layout.woods = [];
    w.layout.farms = [];
    w.layout.farm = null;
    w.layout.ridgeOwner = -1;
    w.layout.ridges = [];
    w.crowd.reset(w.layout);
    // 把所有部队先移到远处待命，再挑选测试用的营放到舞台中央
    for (const b of w.battalions) {
        b.order = 'hold'; b.skirmishers = [];
        b.x = b.homeX = b.gx = b.faction === 0 ? 400 : 15600;
        b.y = b.homeY = b.gy = 400;
        alignBattalionCompanies(w, b, true);
    }
    for (const c of w.companies) {
        c.order = 'hold'; c.forced = -1; c.status = 'steady';
        if (c.battalion < 0 || c.battalionSlot < 0) {
            c.x = c.homeX = c.gx = c.faction === 0 ? 400 : 15600;
            c.y = c.homeY = c.gy = 7500;
            formUp(c);
        } else {
            c.formation = 'line';
            formUp(c);
        }
    }
    return w;
}

function placeBattalion(w, b, x, y, hx, hy, order = 'hold') {
    b.x = b.homeX = b.gx = x; b.y = b.homeY = b.gy = y;
    b.hx = hx; b.hy = hy; b.order = order;
    b.stoppedAt = -1; b.aligned = false; b.firingSince = -1; b.firstVolleyCount = 0; b.closing = false; b.firstChargeAt = -1;
    for (const id of b.companies) {
        const c = w.companies[id];
        c.formation = 'line'; c.order = order; c.forced = -1; c.formUntil = 0;
        c.morale = c.base = 66; c.status = 'steady';
        c.firingSince = -1; c.refuseAngle = 0; c.assaultStage = 'idle'; c.assaultReady = 0;
    }
    alignBattalionCompanies(w, b, true);
    for (const id of b.companies) formUp(w.companies[id]);
}

// ---- S1: 两个营正面相对相距 3000px，同时推进 → 700～1000px 停下并完成首轮齐射 ----
function testS1() {
    const w = setupIsolatedWorld(101);
    const b0 = w.battalions.find(b => b.faction === 0 && b.kind === 'line_infantry');
    const b1 = w.battalions.find(b => b.faction === 1 && b.kind === 'line_infantry');
    placeBattalion(w, b0, 6500, 4000, 1, 0, 'advance');
    placeBattalion(w, b1, 9500, 4000, -1, 0, 'advance');
    w.hash.rebuild(w.units);
    w.sight.scan(w);

    let stopDist = -1;
    for (let i = 0; i < 1500; i++) {
        w.step();
        if (stopDist < 0 && b0.firstVolleyCount >= 1 && b1.firstVolleyCount >= 1) {
            stopDist = Math.hypot(b1.x - b0.x, b1.y - b0.y);
            break;
        }
    }
    console.log('S1:', { stopDist: +stopDist.toFixed(1), b0Volleys: b0.firstVolleyCount, b1Volleys: b1.firstVolleyCount, tick: w.tick });
    assert.ok(b0.firstVolleyCount >= 1 && b1.firstVolleyCount >= 1, 'S1: 双方都应完成首轮齐射');
    assert.ok(stopDist >= 700 && stopDist <= 1000, `S1: 停下对射间距应在 700~1000px，实测 ${stopDist.toFixed(1)}`);
    return { w, b0, b1 };
}

// ---- S2: 在 S1 基础上对一方施加 40 点士气打击，另一方在 300 tick 内发起刺刀冲锋 ----
function testS2() {
    const { w, b0, b1 } = testS1();
    const strikeTick = w.tick;
    for (const id of b1.companies) {
        const c = w.companies[id];
        c.morale = Math.max(15, c.morale - 40);
    }
    let chargeTick = -1, chargeDist = -1;
    for (let i = 0; i < 300; i++) {
        w.step();
        if (b0.order === 'assault') {
            chargeTick = w.tick - strikeTick;
            chargeDist = Math.hypot(b1.x - b0.x, b1.y - b0.y);
            break;
        }
    }
    console.log('S2:', { chargeTick, chargeDist: +chargeDist.toFixed(1), b0Order: b0.order });
    assert.ok(chargeTick >= 0 && chargeTick <= 300, `S2: 应在 300 tick 内发起刺刀冲锋，实测 ${chargeTick}`);
    assert.ok(chargeDist <= 420, `S2: 冲锋发起距离应在 400px 左右，实测 ${chargeDist.toFixed(1)}`);
}

// ---- S3: 正在对射的营遭遇侧翼 90°、700px 敌营，端连在 150 tick 内完成转向 ----
function testS3() {
    const w = setupIsolatedWorld(202);
    const b0 = w.battalions.find(b => b.faction === 0 && b.kind === 'line_infantry');
    const b1s = w.battalions.filter(b => b.faction === 1 && b.kind === 'line_infantry');
    const frontEnemy = b1s[0], flankEnemy = b1s[1];
    assert.ok(b0 && frontEnemy && flankEnemy, 'S3 需要至少两个敌营');
    placeBattalion(w, b0, 7600, 4000, 1, 0, 'hold');
    placeBattalion(w, frontEnemy, 8450, 4000, -1, 0, 'hold');
    w.hash.rebuild(w.units); w.sight.scan(w);
    // 先打一会儿对射
    for (let i = 0; i < 120; i++) w.step();
    // 敌营从正南侧翼 90°、距离 700px 处出现
    placeBattalion(w, flankEnemy, 7600, 4700, 0, -1, 'hold');
    w.hash.rebuild(w.units); w.sight.scan(w);
    const appearTick = w.tick;
    let doneTick = -1, finalAngleDeg = 0;
    const endComp = w.companies[b0.companies[b0.companies.length - 1]];
    for (let i = 0; i < 150; i++) {
        w.step();
        const dotSouth = endComp.hy; // 朝南 (0, 1) 时 hy -> 1
        finalAngleDeg = Math.acos(Math.max(-1, Math.min(1, endComp.hx * b0.hx + endComp.hy * b0.hy))) * 180 / Math.PI;
        if (b0.refusedRight && dotSouth > 0.75) {
            doneTick = w.tick - appearTick;
            break;
        }
    }
    console.log('S3:', { refusedRight: b0.refusedRight, doneTick, finalAngleDeg: +finalAngleDeg.toFixed(1) });
    assert.ok(b0.refusedRight && doneTick >= 0 && doneTick <= 150, `S3: 营端连应在 150 tick 内完成钩形转向，实测 doneTick=${doneTick}`);
}

// ---- S4: 满员、士气满敌营位于 2000px 处，1200 tick 内不会对其发起冲锋 ----
function testS4() {
    const w = setupIsolatedWorld(303);
    const b0 = w.battalions.find(b => b.faction === 0 && b.kind === 'line_infantry');
    const b1 = w.battalions.find(b => b.faction === 1 && b.kind === 'line_infantry');
    placeBattalion(w, b0, 7000, 4000, 1, 0, 'hold');
    placeBattalion(w, b1, 9000, 4000, -1, 0, 'hold');
    // 关闭导演全线推进，只测试 AI 会不会对 2000px 满员敌营下令冲锋
    w.posture = ['defend', 'defend'];
    w.director.cannonadeEnd = [999999, 999999];
    w.hash.rebuild(w.units); w.sight.scan(w);
    let assaulted = false;
    for (let i = 0; i < 1200; i++) {
        w.step();
        if (b0.order === 'assault' || activeCompanies(w, b0).some(c => c.order === 'assault')) {
            assaulted = true; break;
        }
    }
    console.log('S4:', { assaulted, finalDist: +Math.hypot(b1.x - b0.x, b1.y - b0.y).toFixed(1), b0Order: b0.order });
    assert.ok(!assaulted, 'S4: 1200 tick 内不应对 2000px 满员满士气敌营发起冲锋');
}

testS2();
testS3();
testS4();
console.log('All Task 13 scenarios (S1-S4) PASSED!');
