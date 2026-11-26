import './style.css';
import { mount, el, roster } from './client/hud';
import { coverArt } from './client/coverArt';
import { artReady } from './client/artLoader';
import { upgradeLegacy, migrateMarks } from './client/legacySave';
import { Renderer, type Overlay } from './client/renderer';
import { Input } from './client/input';
import { BattleAudio } from './client/audio';
import { SimWorld } from './sim/world';
import { LocalTransport } from './net/transport';
import { TPS, UNITS, strength, shelter } from './sim/config';
import { WIDTH, HEIGHT } from './sim/maps';
import type { CommandAction, Difficulty, Faction, Kind, MapId, Mode, Point, Unit } from './sim/types';
mount();
coverArt(el('art'));
const canvas = el<HTMLCanvasElement>('world'), world = new SimWorld(4), queue = new LocalTransport(), audio = new BattleAudio();
const view = new Renderer(canvas, el('mini')), cam = view.camera, selected = new Set<number>();
const overlay: Overlay = { selected, box: null, faction: 1, order: null };
let nation: Faction = 1, side: Faction = 1, playing = false, paused = false, speed = 1, accum = 0, last = 0, lastHud = 0;
let placement: Kind | null = null, noticeAt = 0, history = '', orderAt = 0;
const send = (action: CommandAction) => queue.send(world.tick, side, action);
function say(msg: string) { el('notice').textContent = msg; noticeAt = performance.now(); }
function select(units: Unit[]) {
    selected.clear();
    for (const u of units)
        selected.add(u.id);
    el('detail').hidden = !units.length;
}
function place(k: Kind | null) {
    placement = k;
    for (const b of el('cards').querySelectorAll('button'))
        b.setAttribute('aria-pressed', String(b.dataset.kind === k));
}
function cards() {
    roster(side, world.mode, k => {
        if (world.mode === 'lord') {
            if (world.realms[side].gold < UNITS[k].gold) {
                say('军费不足，等待下一批拨款');
                return;
            }
            send({ type: 'train', payload: { kind: k } });
            say(UNITS[k].name + '正在星堡集结');
        }
        else {
            select([]);
            place(placement === k ? null : k);
            if (placement)
                say('轻点地图投放' + UNITS[k].name);
        }
    });
}
function tap(point: Point) {
    if (placement && world.mode === 'sandbox') {
        send({ type: 'spawn', payload: { ...point, kind: placement, count: strength[placement], formation: 'line' } });
        place(null);
        return;
    }
    if (selected.size) {
        const site = world.structures.find(s => s.hp > 0 && shelter(s.type) && (s.faction === side || s.faction === -1) && Math.abs(point.x - s.x) < s.w / 2 && Math.abs(point.y - s.y) < s.h / 2);
        if (site)
            send({ type: 'garrison', payload: { tower: site.id, ids: [...selected] } });
        else
            send({ type: 'order', payload: { ids: [...selected], point } });
        overlay.order = point;
        orderAt = performance.now();
        select([]);
        return;
    }
    let hit: Unit | undefined, best = 25 / cam.zoom;
    for (const u of world.units)
        if (u.faction === side) {
            const distance = Math.hypot(u.x - point.x, u.y - 10 - point.y);
            if (distance < best) {
                best = distance;
                hit = u;
            }
        }
    if (hit)
        select(world.units.filter(u => u.group === hit.group));
}
const input = new Input(canvas, cam, tap, (a, b) => select(world.units.filter(u => u.faction === side &&
    u.x >= Math.min(a.x, b.x) && u.x <= Math.max(a.x, b.x) && u.y >= Math.min(a.y, b.y) && u.y <= Math.max(a.y, b.y))), () => playing);
function hud() {
    const r = world.realms[side];
    for (const f of [0, 1] as const)
        el('score' + f).textContent = String(world.units.filter(u => u.faction === f).length);
    el('resources').textContent = world.mode === 'lord' ? '军费 ' + r.gold : '自由沙盒';
    const orders = { auto: '星堡集结', charge: '全军推进', recall: '星堡整备', rampart: '高台驻防' };
    el('phase').textContent = r.order === 'auto' && r.wave ? '第 ' + r.wave + ' 批出击' : orders[r.order];
    for (const ord of ['charge', 'recall', 'rampart'] as const)
        el(ord).setAttribute('aria-pressed', String(r.order === ord));
    if (selected.size) {
        const units = world.units.filter(u => selected.has(u.id)), u = units[0];
        if (!u)
            select([]);
        else
            el('unitInfo').textContent = UNITS[u.kind].name + ' · ' + (u.crew ? '1 门 / 3 炮手' : units.length + ' 人') +
                (u.routed ? ' · 溃退' : units.some(n => n.tower) ? ' · 高地驻防' : ' · 士气 ' + u.morale);
    }
    if (world.news !== history) {
        say(world.news);
        history = world.news;
    }
    if (performance.now() - noticeAt > 3400 && world.winner === null)
        el('notice').textContent = '';
    if (performance.now() - orderAt > 1800)
        overlay.order = null;
    canvas.dataset.camera = [cam.x, cam.y, cam.zoom].map(n => n.toFixed(3)).join(',');
    canvas.dataset.player = String(world.player);
}
function focusHome() {
    const fort = world.keep(side);
    cam.zoom = cam.base * (cam.w < 700 ? 1.75 : 2.25);
    cam.x = fort.x + (side ? -1 : 1) * 171;
    cam.y = fort.y;
    cam.clamp();
}
function controls() {
    cards();
    el('side').hidden = world.mode !== 'sandbox';
    el('side').textContent = '布阵方 · ' + (side ? '英军' : '法军');
    el('speed').textContent = speed + '×';
    el('pause').textContent = paused ? '继续' : '暂停';
    overlay.faction = side;
}
function start(mode: Mode) {
    audio.unlock();
    audio.start(nation);
    side = nation;
    world.player = nation;
    world.reset(4, el<HTMLSelectElement>('maps').value as MapId, mode, el<HTMLSelectElement>('difficulty').value as Difficulty);
    playing = true;
    paused = false;
    speed = 1;
    accum = 0;
    last = performance.now();
    placement = null;
    queue.clear();
    input.reset();
    select([]);
    overlay.order = null;
    el('cover').hidden = true;
    el('battle').hidden = false;
    el('settings').hidden = true;
    view.resize();
    view.reset(world);
    focusHome();
    controls();
    history = world.news;
    say(mode === 'lord' ? '星堡正在集结，点连队可单独下令' : '选兵种，再点地图投放连队');
    hud();
}
for (const f of [0, 1] as const)
    el('nation' + f).onclick = () => {
        nation = f;
        for (const i of [0, 1])
            el('nation' + i).setAttribute('aria-pressed', String(i === f));
    };
for (const mode of ['lord', 'sandbox'] as const) {
    const b = el<HTMLButtonElement>(mode);
    b.disabled = true;
    b.onclick = () => start(mode);
}
artReady.then(() => { for (const m of ['lord', 'sandbox'])
    el<HTMLButtonElement>(m).disabled = false; })
    .catch((e: Error) => { el('loadError').hidden = false; el('loadError').textContent = e.message; });
el('menu').onclick = () => { el('settings').hidden = !el('settings').hidden; };
el('back').onclick = () => { playing = false; input.reset(); audio.stop(); el('battle').hidden = true; el('cover').hidden = false; };
el('pause').onclick = () => { paused = !paused; accum = 0; el('pause').textContent = paused ? '继续' : '暂停'; };
el('speed').onclick = () => { speed = speed === 4 ? 1 : speed * 2; el('speed').textContent = speed + '×'; };
el('music').onclick = () => { audio.music = !audio.music; el('music').textContent = '军歌 ' + (audio.music ? '开' : '关'); };
el('sound').onclick = () => { audio.muted = !audio.muted; el('sound').textContent = '音效 ' + (audio.muted ? '关' : '开'); };
el('gore').onclick = () => { view.decals.inferno = view.vfx.inferno = !view.decals.inferno; el('gore').textContent = view.decals.inferno ? '炼狱血海' : '常规血迹'; };
el('side').onclick = () => { side = side === 0 ? 1 : 0; input.reset(); select([]); place(null); focusHome(); controls(); hud(); };
for (const ord of ['charge', 'recall', 'rampart'] as const)
    el(ord).onclick = () => { place(null); send({ type: ord, payload: {} }); };
for (const [form, name] of [['line', '三排线列'], ['square', '空心方阵'], ['melee', '刺刀纵队']] as const) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = () => send({ type: 'formation', payload: { ids: [...selected], formation: form } });
    el('forms').append(b);
}
el('mini').onclick = e => { const r = el('mini').getBoundingClientRect(); cam.x = (e.clientX - r.left) / r.width * WIDTH; cam.y = (e.clientY - r.top) / r.height * HEIGHT; cam.clamp(); };
const storageKey = 'napoleon-6.0';
el('save').onclick = () => {
    world.step(queue.drain(world.tick), false);
    try {
        localStorage.setItem(storageKey, JSON.stringify({ world: world.snapshot(), side, marks: view.decals.snapshot(), particles: view.vfx.snapshot() }));
        say('布阵已保存');
    }
    catch {
        say('布阵超过浏览器可用存储空间');
    }
};
el('restore').onclick = () => {
    try {
        const current = localStorage.getItem(storageKey), raw = current ?? localStorage.getItem('napoleon-5.2') ?? localStorage.getItem('gothic-v4');
        if (!raw) {
            say('尚无已保存布阵');
            return;
        }
        const data = JSON.parse(raw);
        world.restore(current ? data.world : upgradeLegacy(data.world));
        nation = world.player;
        side = world.mode === 'lord' ? nation : data.side === 0 ? 0 : 1;
        queue.clear();
        input.reset();
        select([]);
        placement = null;
        overlay.order = null;
        view.reset(world);
        view.decals.restore(current ? data.marks ?? [] : migrateMarks(data.marks ?? []));
        if (current)
            view.vfx.restore(data.particles ?? []);
        paused = true;
        accum = 0;
        speed = 1;
        controls();
        audio.start(nation);
        history = world.news;
        say(current ? '布阵已恢复' : '旧版部队已转换为 v6 编制');
        hud();
    }
    catch {
        say('无法读取布阵');
    }
};
addEventListener('keydown', e => { if (playing && e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    el('pause').click();
} });
function frame(now: number) {
    const dt = Math.min(.1, (now - last) / 1000);
    last = now;
    if (playing) {
        if (!paused && world.winner === null)
            accum += dt * speed;
        while (accum >= 1 / TPS && world.winner === null) {
            const events = world.step(queue.drain(world.tick));
            view.vfx.consume(events);
            view.vfx.update(1 / TPS);
            audio.play(events);
            accum -= 1 / TPS;
            if (world.winner !== null)
                el('settings').hidden = false;
        }
        if (paused && world.winner === null) {
            const pending = queue.drain(world.tick);
            if (pending.length)
                world.step(pending, false);
        }
        audio.sequence(world.realms[nation].wave > 0, paused || world.winner !== null);
        input.update(dt);
        overlay.box = input.box;
        const refresh = now - lastHud >= 150;
        view.draw(world, overlay, refresh, paused || world.winner !== null ? 1 : accum * TPS);
        if (refresh) {
            hud();
            lastHud = now;
        }
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
