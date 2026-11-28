/**
 * 任务书 14 场景测试 S5～S8：
 * - S5：一个骑兵连在 2500px 外，敌方步兵营正在和第三方对射、侧翼暴露。检查骑兵绕到侧翼冲锋，冲击时为菱形，速度 >= 200。
 * - S6：一个敌骑兵连以小跑朝己方骑兵移动，距离 1100px。检查己方在 90 tick 内发起反冲锋。
 * - S7：一门炮朝东，敌人在其正北方。检查这门炮不开火，并在 G4 规定的时间（>= 150 tick）完成转向后才开火。
 * - S8：步兵用火枪集中射击一门炮。检查 crew 递减，装填时间相应变长。
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const r = await build({
    stdin: { contents: "export * from './src/sim/world'; export { formUp } from './src/sim/strategy'; export { alignBattalionCompanies } from './src/sim/battalion'; export { gunFire } from './src/sim/combat';", resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent'
});
const { SimWorld, formUp, alignBattalionCompanies, gunFire } =
    await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));

function isolateWorld(seed = 505) {
    const w = new SimWorld(2400, seed);
    w.weather = 'clear';
    w.tick = w.deployEnd + 600;
    w.director.cannonadeEnd = [w.deployEnd, w.deployEnd];
    w.reinforcement = null;
    w.layout.woods = []; w.layout.farms = []; w.layout.farm = null; w.layout.ridgeOwner = -1; w.layout.ridges = [];
    w.crowd.reset(w.layout);
    for (const b of w.battalions) {
        b.order = 'hold'; b.skirmishers = [];
        b.x = b.homeX = b.gx = b.faction === 0 ? 300 : 15700;
        b.y = b.homeY = b.gy = 300;
        alignBattalionCompanies(w, b, true);
    }
    for (const c of w.companies) {
        c.order = 'hold'; c.forced = -1; c.status = 'steady';
        c.chargePhase = 'idle'; c.cavTask = 'none'; c.restUntil = 0;
        if (c.battalion < 0 || c.battalionSlot < 0) {
            c.x = c.homeX = c.gx = c.faction === 0 ? 300 : 15700;
            c.y = c.homeY = c.gy = 7600;
            formUp(c);
        } else {
            formUp(c);
        }
    }
    return w;
}

function placeCompany(c, x, y, hx, hy, form) {
    c.x = c.homeX = c.gx = x; c.y = c.homeY = c.gy = y;
    c.hx = hx; c.hy = hy; c.formation = form; c.formUntil = 0; c.morale = c.base = 75; c.status = 'steady';
    formUp(c);
    if (c.kind === 'field_cannon') {
        const a = Math.atan2(hy, hx);
        for (const g of c.members) { g.aim = a; g.reaimTargetAim = a; g.reaimKind = 'none'; g.reaimUntil = 0; g.crew = 6; g.cooldown = 0; }
    }
}

// ---- S5: 骑兵 2500px 外，敌步兵营正在对射且侧翼暴露 -> 绕侧翼菱形冲锋，冲击速度 >= 200 ----
function testS5() {
    const w = isolateWorld(501);
    const b0 = w.battalions.find(b => b.faction === 0 && b.kind === 'line_infantry');
    const b1 = w.battalions.find(b => b.faction === 1 && b.kind === 'line_infantry');
    const cav = w.companies.find(c => c.faction === 0 && c.kind === 'cuirassier' && c.line !== 5);
    // 双方步兵营正面 820px 对射
    b0.x = b0.homeX = b0.gx = 7600; b0.y = b0.homeY = b0.gy = 4000; b0.hx = 1; b0.hy = 0; b0.order = 'hold'; b0.firingSince = w.tick - 120; b0.stoppedAt = w.tick - 120; b0.aligned = true;
    b1.x = b1.homeX = b1.gx = 8420; b1.y = b1.homeY = b1.gy = 4000; b1.hx = -1; b1.hy = 0; b1.order = 'hold'; b1.firingSince = w.tick - 120; b1.stoppedAt = w.tick - 120; b1.aligned = true;
    alignBattalionCompanies(w, b0, true); alignBattalionCompanies(w, b1, true);
    for (const id of [...b0.companies, ...b1.companies]) { const c = w.companies[id]; c.formation = 'line'; formUp(c); }
    // 我方骑兵位于 2500px 外的斜后侧翼
    placeCompany(cav, 6800, 2100, 1, 0, 'column');
    w.hash.rebuild(w.units); w.sight.scan(w);

    let impact = null;
    for (let i = 0; i < 1200; i++) {
        w.step();
        impact = w.cavalryImpacts.find(imp => imp.company === cav.id);
        if (impact) break;
    }
    console.log('S5:', impact);
    assert.ok(impact, 'S5: 骑兵应完成对暴露侧翼步兵营的冲锋冲击');
    assert.equal(impact.formation, 'diamond', 'S5: 冲击时应为菱形队形');
    assert.ok(impact.speed >= 200, `S5: 冲击速度应 >= 200，实测 ${impact.speed.toFixed(1)}`);
}

// ---- S6: 敌骑兵连以小跑朝己方骑兵移动，距离 1100px -> 己方 90 tick 内发起反冲锋 ----
function testS6() {
    const w = isolateWorld(602);
    const c0 = w.companies.find(c => c.faction === 0 && c.kind === 'cuirassier' && c.line !== 5);
    const c1 = w.companies.find(c => c.faction === 1 && c.kind === 'cuirassier' && c.line !== 5);
    placeCompany(c0, 7000, 4000, 1, 0, 'diamond');
    placeCompany(c1, 8100, 4000, -1, 0, 'diamond');
    // 敌骑兵以小跑朝己方移动
    c1.order = 'hold'; c1.homeX = 6800; c1.homeY = 4000; c1.cavSpeed = 140; c1.vx = -140; c1.vy = 0;
    w.hash.rebuild(w.units); w.sight.scan(w);

    const startTick = w.tick;
    let counterTick = -1;
    for (let i = 0; i < 90; i++) {
        w.step();
        if (c0.cavTask === 'counter' && c0.order === 'charge') {
            counterTick = w.tick - startTick;
            break;
        }
    }
    console.log('S6:', { counterTick, cavTask: c0.cavTask, order: c0.order });
    assert.ok(counterTick >= 0 && counterTick <= 90, `S6: 应在 90 tick 内发起反冲锋，实测 ${counterTick}`);
}

// ---- S7: 一门炮朝东，敌人在正北方 -> 不开火，经 G4 (>= 150 tick) 转向后才开火 ----
function testS7() {
    const w = isolateWorld(703);
    const bat = w.companies.find(c => c.faction === 0 && c.kind === 'field_cannon');
    const enemy = w.companies.find(c => c.faction === 1 && c.kind === 'line_infantry');
    // 只留第一门炮做精准单炮测试
    for (let i = 1; i < bat.members.length; i++) bat.members[i].hp = 0;
    bat.alive = 1;
    placeCompany(bat, 8000, 4600, 1, 0, 'battery'); // 朝东 aim = 0
    placeCompany(enemy, 8000, 3200, 0, 1, 'line');  // 正北方 (角度 -90°)
    enemy.battalion = -1;
    const gun = bat.members[0];
    gun.aim = 0; gun.reaimKind = 'none'; gun.reaimUntil = 0; gun.cooldown = 0;
    w.hash.rebuild(w.units); w.sight.scan(w);

    // 验证直接强行射界外开火会触发断言
    let threw = false;
    try { gunFire(w, gun, bat, enemy); } catch { threw = true; }
    assert.ok(threw, 'S7: 射界外直接调用 gunFire 必须触发断言');

    const startTick = w.tick;
    let firstFireTick = -1, sawLimber = false;
    for (let i = 0; i < 360; i++) {
        w.step();
        if (gun.reaimKind === 'limber') sawLimber = true;
        if (w.events.some(e => e.type === 'fire' && e.unitId === gun.id)) {
            firstFireTick = w.tick - startTick;
            break;
        }
    }
    console.log('S7:', { sawLimber, firstFireTick, finalAimDeg: +(gun.aim * 180 / Math.PI).toFixed(1) });
    assert.ok(sawLimber, 'S7: 正北偏角 90° > 30° 应触发挂车转向（G4）');
    assert.ok(firstFireTick >= 150, `S7: 挂车转向耗时应 >= 150 tick 后才开火，实测 ${firstFireTick}`);
}

// ---- S8: 步兵集中火枪射击一门炮 -> crew 递减，装填时间相应变长 ----
function testS8() {
    const w = isolateWorld(804);
    const bat = w.companies.find(c => c.faction === 1 && c.kind === 'field_cannon');
    const shooters = w.companies.filter(c => c.faction === 0 && c.kind === 'line_infantry').slice(0, 3);
    for (let i = 1; i < bat.members.length; i++) bat.members[i].hp = 0;
    bat.alive = 1;
    placeCompany(bat, 8000, 4000, -1, 0, 'battery');
    const gun = bat.members[0];
    gun.crew = 6; gun.hp = 800; // 给足炮身血量以便观察炮手递减
    shooters.forEach((sc, idx) => {
        sc.battalion = -1;
        placeCompany(sc, 7550, 3900 + idx * 100, 1, 0, 'line');
        sc.forced = bat.id;
    });
    w.hash.rebuild(w.units); w.sight.scan(w);

    const cooldownByCrew = new Map();
    let minCrew = 6;
    for (let i = 0; i < 1200 && minCrew > 1; i++) {
        w.step();
        if (gun.crew < minCrew) minCrew = gun.crew;
        if (w.events.some(e => e.type === 'fire' && e.unitId === gun.id)) {
            if (!cooldownByCrew.has(gun.crew)) cooldownByCrew.set(gun.crew, gun.cooldown);
        }
        // 让炮定期满冷却以便采样不同 crew 下的新装填时间
        if (i % 15 === 0 && gun.crew > 0 && gun.cooldown > 25 && !cooldownByCrew.has(gun.crew)) {
            gun.cooldown = 0;
        }
    }
    const cdFull = cooldownByCrew.get(6) ?? 0;
    const cdReduced = [...cooldownByCrew.entries()].filter(([cr]) => cr < 6 && cr > 0).map(([, cd]) => cd);
    console.log('S8:', { initialCrew: 6, minCrew, cooldownByCrew: Object.fromEntries(cooldownByCrew) });
    assert.ok(minCrew < 6, `S8: 步兵集火后炮组人数应递减，实测 minCrew=${minCrew}`);
    assert.ok(cdFull > 0 && cdReduced.some(cd => cd > cdFull), 'S8: 炮组减员后装填时间应变长');
}

testS5();
testS6();
testS7();
testS8();
console.log('All Task 14 scenarios (S5-S8) PASSED!');
