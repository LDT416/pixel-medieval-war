// Browser-level verification against a running preview and a dedicated Chromium instance.
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const preview = process.env.ARENA_PREVIEW || 'http://127.0.0.1:4185/';
const browser = process.env.ARENA_BROWSER || 'http://127.0.0.1:9527';
const battleScale = Number(process.env.ARENA_QA_SCALE || 1200);
assert.ok([1200, 2400, 3600].includes(battleScale));

const tab = await (await fetch(browser + '/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
});

const pending = new Map();
const problems = [];
const assets = new Set();
let serial = 0;

socket.onmessage = ({ data }) => {
    const { id, method, params, result, error } = JSON.parse(data);
    if (id) {
        const request = pending.get(id);
        pending.delete(id);
        if (error) request.reject(error);
        else request.resolve(result);
    } else if (method === 'Runtime.exceptionThrown') {
        problems.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
    } else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
        problems.push(params.args.map(a => a.value || a.description).join(' '));
    } else if (method === 'Network.responseReceived' && params.response.url.includes('/art/gore/')) {
        const response = params.response;
        if (response.status !== 200) problems.push(response.status + ' ' + response.url);
        assets.add(response.url);
    }
};

function call(method, params = {}) {
    const id = ++serial;
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
}

async function evaluate(expression) {
    const reply = await call('Runtime.evaluate', { expression, returnByValue: true });
    if (reply.exceptionDetails) throw Error(reply.exceptionDetails.exception?.description || reply.exceptionDetails.text);
    return reply.result.value;
}

const state = () => evaluate('window.__arenaDebug?.getState()');
async function waitFor(check, timeout = 25000) {
    const until = Date.now() + timeout;
    let latest;
    do {
        assert.deepEqual(problems, []);
        latest = await state();
        if (latest && check(latest)) return latest;
        await delay(150);
    } while (Date.now() < until);
    const notice = await evaluate('document.querySelector("#notice")?.textContent');
    throw Error('Timed out with ' + JSON.stringify(latest) + ' / ' + notice);
}

try {
    for (const domain of ['Runtime', 'Network', 'Page']) await call(domain + '.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 780, deviceScaleFactor: 1, mobile: false });
    await call('Page.bringToFront');
    await call('Page.navigate', { url: preview });

    await waitFor(s => s.tick === 0);
    // 开局停在战前情报卡，跳过押注直接开战。
    await evaluate('window.__arenaDebug.startBattle()');
    const initial = await waitFor(s => s.tick >= 3);
    assert.equal(initial.scale, 2400);
    assert.equal(initial.goreTexturesLoaded, 7);
    assert.ok(initial.drawCalls > 0);
    assert.equal(assets.size, 7);
    for (const url of assets) assert.ok(url.startsWith(new URL('./art/gore/', preview).href));

    await evaluate("document.querySelectorAll('[data-scale]')[2].click()");
    assert.equal((await state()).scale, 3600);
    await evaluate('window.__arenaDebug.setSpeed(0)');
    const frozen = await state();
    await delay(350);
    assert.equal((await state()).tick, frozen.tick);

    await evaluate(`window.__arenaDebug.setScale(${battleScale});
        window.__arenaDebug.startBattle();
        window.__arenaDebug.setLighting('storm');
        window.__arenaDebug.zoomTo(48);
        window.__arenaDebug.setSpeed(16);`);
    const combat = await waitFor(s => s.activeSmoke > 0 && s.landedGore > 0 && s.landedCorpses > 0 && s.bloodPools > 0, 120000);
    assert.equal(combat.lighting, 'storm');
    console.log('Combat', combat);

    const final = await waitFor(s => s.ended, 240000);
    assert.ok(final.winner === 0 || final.winner === 1);
    await delay(800);
    assert.equal(await evaluate('document.querySelector("#victory").hidden'), false);
    const settled = await state();
    assert.ok(settled.bloodPools >= combat.bloodPools && settled.landedGore >= combat.landedGore);
    console.log('Victory', settled);

    await evaluate("document.querySelector('#again').click(); window.__arenaDebug.setSpeed(0)");
    const reset = await state();
    assert.deepEqual(reset.alive, [battleScale / 2, battleScale / 2]);
    for (const key of ['landedGore', 'landedCorpses', 'bloodPools', 'activeAirGore', 'activeSmoke']) {
        assert.equal(reset[key], 0);
    }
    assert.deepEqual(problems, []);
    console.log('Production WebGL preview assertions passed.');
} finally {
    socket.close();
    await fetch(browser + '/json/close/' + tab.id);
}
