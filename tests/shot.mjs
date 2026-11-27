// Drive the production preview in a headless browser over CDP and save screenshots.
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
const browser = 'http://127.0.0.1:9527', page = 'http://127.0.0.1:4185/?seed=' + (process.argv[2] || '424242');
const plan = JSON.parse((await import('node:fs')).readFileSync(process.argv[3], 'utf8')); // [[waitTick, name, js]]
mkdirSync('shots', { recursive: true });
const tab = await (await fetch(browser + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(), problems = [];
ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.j(m.error) : p.r(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') problems.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push(m.params.args.map(a => a.value || a.description).join(' '));
};
const call = (method, params = {}) => new Promise((r, j) => { pending.set(++id, { r, j }); ws.send(JSON.stringify({ id, method, params })); });
const ev = async e => { const x = await call('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (x.exceptionDetails) throw Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text); return x.result.value; };
const shot = async name => { const { data } = await call('Page.captureScreenshot', { format: 'png' }); writeFileSync('shots/' + name + '.png', Buffer.from(data, 'base64')); console.log('saved', name); };
try {
    for (const d of ['Runtime', 'Page']) await call(d + '.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 860, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: page });
    for (let i = 0; i < 120 && !(await ev('!!window.__arenaDebug')); i++) await delay(250);
    await delay(1500);
    for (const [tick, name, js] of plan) {
        if (js) await ev(js);
        for (let i = 0; i < 2400; i++) { const s = await ev('window.__arenaDebug.getState()'); if (s.tick >= tick || s.ended) break; await delay(100); }
        await delay(400);
        if (name) { await shot(name); console.log(JSON.stringify(await ev('(()=>{const s=window.__arenaDebug.getState();return {tick:s.tick,fps:s.fps,alive:s.alive,odds:+s.odds.toFixed(2),ended:s.ended,winner:s.winner,smoke:s.activeSmoke,corpses:s.landedCorpses}})()'))); }
    }
    console.log('problems', problems);
} finally { ws.close(); await fetch(browser + '/json/close/' + tab.id); }
