// Build first with npm run build. Run from the repository root.
// T15B_URL selects a deployed site. By default the script serves dist using Vite preview.
// T15B_SHOTS selects the evidence directory. PLAYWRIGHT_MODULE can point at an installed Playwright.
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const {setTimeout: sleep} = require('node:timers/promises');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const shots = path.resolve(process.env.T15B_SHOTS || 'docs/shots/T15B/local');
const seed = Number(process.env.T15B_SEED || 7919);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function buildIdentity(page, documentResponse) {
    assert.ok(documentResponse?.ok(), 'the document loaded');
    const pack = {};
    const html = await fs.readFile('dist/index.html');
    pack['index.html'] = hash(await documentResponse.body());
    assert.equal(pack['index.html'], hash(html), 'the loaded HTML matches the production build');
    const scripts = (await fs.readdir('dist/assets')).filter(name => name.endsWith('.js')).sort();
    assert.ok(scripts.length > 0, 'the production bundle emitted JavaScript');
    for (const file of scripts) {
        const relative = 'assets/' + file;
        pack[relative] = await page.evaluate(async asset => {
            const result = await fetch(new URL(asset, document.baseURI), {cache: 'no-store'});
            if (!result.ok) throw new Error('Asset request failed: ' + result.status + ' ' + asset);
            const bytes = await crypto.subtle.digest('SHA-256', await result.arrayBuffer());
            return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
        }, relative);
        assert.equal(pack[relative], hash(await fs.readFile(path.join('dist', relative))), relative);
    }
    return pack;
}

// Run on a paused page. Read all simulation coordinates in their stable array order.
async function fingerprint(page) {
    return page.evaluate(async () => {
        const w = window.__arenaDebug.world;
        const values = [w.tick, w.rng.state, ...w.dead, ...w.fled];
        for (const b of w.battalions) values.push(b.id, b.x, b.y, b.gx, b.gy);
        for (const c of w.companies) values.push(c.id, c.x, c.y, c.homeX, c.homeY, c.alive);
        for (const u of w.units) values.push(u.id, u.x, u.y, u.hp);
        const sum = await crypto.subtle.digest('SHA-256', Float64Array.from(values));
        return {tick: w.tick, seed: w.seed, scale: w.scale, units: w.units.length,
            sha256: Array.from(new Uint8Array(sum), v => v.toString(16).padStart(2, '0')).join('')};
    });
}

function sample(page) {
    return page.evaluate(() => {
        const d = window.__arenaDebug, state = d.getState(), canvas = document.getElementById('battlefield');
        return {tick: state.tick, drawCalls: state.drawCalls, fps: state.fps, canvas: [canvas.width, canvas.height],
            ended: state.ended, waits: {...d.world.marchCohesion.stats}};
    });
}

async function main() {
    await fs.mkdir(shots, {recursive: true});
    let browser, server, page;
    const report = {seed, errors: [], samples: []};
    try {
        let url;
        if (process.env.T15B_URL) url = new URL(process.env.T15B_URL);
        else {
            const {preview} = await import('vite');
            server = await preview({preview: {host: '127.0.0.1', port: 0}});
            url = new URL('http://127.0.0.1:' + server.httpServer.address().port + '/');
        }
        url.searchParams.set('seed', String(seed));
        report.url = url.href;
        const args = ['--enable-unsafe-swiftshader'];
        if (server) args.push('--no-proxy-server');
        browser = await chromium.launch({channel: 'chrome', headless: true, args});
        report.browser = browser.version();
        const context = await browser.newContext({viewport: {width: 1280, height: 800}});
        page = await context.newPage();
        page.on('pageerror', e => report.errors.push(e.message));
        page.on('console', msg => { if (msg.type() === 'error') report.errors.push(msg.text()); });
        const documentResponse = await page.goto(url.href);
        report.build = await buildIdentity(page, documentResponse);
        await page.waitForFunction(() => window.__arenaDebug?.world.scale === 2400);
        report.opening = await fingerprint(page);
        assert.equal(report.opening.tick, 0);
        assert.equal(report.opening.seed, seed);
        await page.getByRole('button', {name: '不押注，直接观战'}).click();
        await page.locator('[data-speed="4"]').click();
        const start = performance.now();
        report.samples.push(await sample(page));
        await page.screenshot({path: path.join(shots, 'march-start.png')});
        do {
            await sleep(5000);
            report.samples.push({...await sample(page), elapsedMs: Math.round(performance.now() - start)});
            assert.deepEqual(report.errors, []);
        } while (performance.now() - start < 60000);
        report.elapsedMs = Math.round(performance.now() - start);
        const first = report.samples[0], last = report.samples.at(-1);
        assert.ok(last.tick - first.tick >= 60, 'the game advanced during real-time playback');
        assert.ok(report.samples.every(s => s.drawCalls > 0 && s.canvas.every(n => n > 0)), 'the canvas rendered each sample');
        assert.ok(report.samples.some(s => s.fps > 0));
        await page.screenshot({path: path.join(shots, 'march-playing.png')});
        await page.locator('#pause').click();
        report.checkpoint = await fingerprint(page);

        // Reach the UI's replay button without making the real-time observation depend on battle length.
        let endTick = report.checkpoint.tick;
        let ended = false;
        while (!ended && endTick < 36210) {
            const next = await page.evaluate(() => {
                const d = window.__arenaDebug;
                d.stepFrames(300);
                return {tick: d.world.tick, ended: d.world.ended};
            });
            assert.ok(next.tick > endTick || next.ended, 'the paused simulation can be stepped');
            endTick = next.tick;
            ended = next.ended;
        }
        assert.ok(ended, 'the battle reached the victory screen');
        report.endTick = endTick;
        await page.getByRole('button', {name: '重演本局'}).click();
        report.replayOpening = await fingerprint(page);
        assert.deepEqual(report.replayOpening, report.opening);
        await page.screenshot({path: path.join(shots, 'replay-opening.png')});
        await page.getByRole('button', {name: '不押注，直接观战'}).click();
        await page.locator('#pause').click();
        const replayStart = (await sample(page)).tick;
        assert.ok(replayStart <= report.checkpoint.tick);
        await page.evaluate(target => {
            const d = window.__arenaDebug;
            while (d.world.tick < target) {
                const before = d.world.tick;
                d.stepFrames(Math.min(300, target - before));
                if (d.world.tick === before) throw new Error('Replay stalled at ' + before);
            }
        }, report.checkpoint.tick);
        report.replayCheckpoint = await fingerprint(page);
        assert.deepEqual(report.replayCheckpoint, report.checkpoint);
        assert.deepEqual(report.errors, []);
        report.passed = true;
        console.log(JSON.stringify({shots, elapsedMs: report.elapsedMs, endTick, checkpoint: report.checkpoint,
            errors: report.errors}));
    } catch (error) {
        report.passed = false;
        report.failure = error.message;
        if (page) await page.screenshot({path: path.join(shots, 'failure.png'), timeout: 5000}).catch(() => {});
        throw error;
    } finally {
        await fs.writeFile(path.join(shots, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
        await browser?.close();
        await server?.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
