/**
 * 任务书 13 & 14 浏览器冒烟测试与截图存证脚本（不改前端代码，通过 CDP 驱动生产构建）。
 * 用法：node tests/browser-smoke-t13-t14.mjs [seed]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const browser = 'http://127.0.0.1:9527';
const seed = process.argv[2] || '31676';
const page = `http://127.0.0.1:4185/?seed=${seed}`;

mkdirSync('docs/shots/T13', { recursive: true });
mkdirSync('docs/shots/T14', { recursive: true });

const tab = await (await fetch(browser + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let id = 0;
const pending = new Map();
const problems = [];

ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.j(m.error) : p.r(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
        problems.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        problems.push(m.params.args.map(a => a.value || a.description).join(' '));
    }
};

const call = (method, params = {}) => new Promise((r, j) => {
    pending.set(++id, { r, j });
    ws.send(JSON.stringify({ id, method, params }));
});

const ev = async (expr) => {
    const x = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) throw Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text);
    return x.result.value;
};

const shot = async (path) => {
    await delay(450);
    const { data } = await call('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path, Buffer.from(data, 'base64'));
    console.log('saved', path);
};

try {
    for (const d of ['Runtime', 'Page']) await call(d + '.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 860, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: page });
    for (let i = 0; i < 120 && !(await ev('!!window.__arenaDebug')); i++) await delay(250);
    await delay(1500);

    // 确认 2400 人规模并开战
    await ev(`(() => {
        const d = window.__arenaDebug;
        if (d.getState().scale !== 2400) d.setScale(2400);
        d.startBattle();
    })()`);
    await delay(1800);
    // 关掉自动导播并暂停，用 stepFrames 稳定快进
    await ev(`(() => {
        const autoBtn = document.getElementById('auto');
        if (autoBtn && autoBtn.classList.contains('on')) autoBtn.click();
        window.__arenaDebug.setSpeed(0);
    })()`);

    const shotsMeta = {};

    // 1. 快进寻找线列步兵营对射瞬间并聚焦（镜头距离 110）
    const duelFocus = await ev(`(() => {
        const d = window.__arenaDebug, w = d.world;
        for (let i = 0; i < 3600 && !w.ended; i += 30) {
            d.stepFrames(30);
            const b = w.battalions.find(x => x.firingSince >= 0 && x.target >= 0 && w.battalions[x.target]?.firingSince >= 0);
            if (b) {
                const tb = w.battalions[b.target];
                const mx = (b.x + tb.x) * 0.5, my = (b.y + tb.y) * 0.5;
                d.panTo((mx - w.layout.width * 0.5) * 0.05, (my - w.layout.height * 0.5) * 0.05);
                d.zoomTo(110);
                return { tick: w.tick, mx, my, dist: Math.hypot(tb.x - b.x, tb.y - b.y), bName: b.name, tName: tb.name };
            }
        }
        return null;
    })()`);
    shotsMeta.duel1 = duelFocus;
    await shot('docs/shots/T13/line-firefight-1.png');

    // 再步进 75 tick 拍第二张齐射与硝烟展开图
    await ev('window.__arenaDebug.stepFrames(75)');
    await shot('docs/shots/T13/line-firefight-2.png');

    // 2. 快进寻找骑兵菱形冲锋瞬间
    const cavFocus = await ev(`(() => {
        const d = window.__arenaDebug, w = d.world;
        for (let i = 0; i < 3000 && !w.ended; i += 15) {
            d.stepFrames(15);
            const c = w.companies.find(x => x.kind === 'cuirassier' && x.line !== 5 && x.formation === 'diamond' && (x.chargePhase === 'gallop' || x.chargePhase === 'charge'));
            if (c) {
                d.panTo((c.x - w.layout.width * 0.5) * 0.05, (c.y - w.layout.height * 0.5) * 0.05);
                d.zoomTo(95);
                return { tick: w.tick, name: c.name, phase: c.chargePhase, speed: Math.round(c.cavSpeed), formation: c.formation };
            }
        }
        return null;
    })()`);
    shotsMeta.cavalry = cavFocus;
    await shot('docs/shots/T14/cavalry-diamond-charge.png');

    // 3. 聚焦炮兵阵地朝前方射击
    const artyFocus = await ev(`(() => {
        const d = window.__arenaDebug, w = d.world;
        const c = w.companies.find(x => x.kind === 'field_cannon' && x.alive > 0 && x.status !== 'rout');
        if (c) {
            d.panTo((c.x - w.layout.width * 0.5) * 0.05, (c.y - w.layout.height * 0.5) * 0.05);
            d.zoomTo(95);
            return { tick: w.tick, name: c.name, variant: c.variant, crews: c.members.map(g => g.crew), aimsDeg: c.members.map(g => Math.round(g.aim * 180 / Math.PI)) };
        }
        return null;
    })()`);
    shotsMeta.artillery = artyFocus;
    await shot('docs/shots/T14/artillery-arc.png');

    // 4. 完整跑完这场 2400 人战斗至结束，验证零报错
    const endState = await ev(`(() => {
        const d = window.__arenaDebug, w = d.world;
        while (!w.ended && w.tick < 36300) d.stepFrames(600);
        return d.getState();
    })()`);

    const report = {
        seed,
        scale: endState.scale,
        endTick: endState.tick,
        ended: endState.ended,
        winner: endState.winner,
        alive: endState.alive,
        dead: endState.dead,
        fled: endState.fled,
        shotsMeta,
        problems
    };
    writeFileSync('docs/shots/T14/browser-smoke.json', JSON.stringify(report, null, 2));
    writeFileSync('docs/shots/T13/browser-smoke.json', JSON.stringify(report, null, 2));
    console.log('BROWSER SMOKE:', JSON.stringify(report, null, 2));
    if (problems.length > 0 || !endState.ended) {
        process.exitCode = 1;
    }
} finally {
    ws.close();
    await fetch(browser + '/json/close/' + tab.id);
}
