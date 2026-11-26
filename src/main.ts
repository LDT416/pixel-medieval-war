import './style.css';
import { mount, el, roster, categories } from './client/hud';
import { coverArt } from './client/coverArt';
import { Renderer, type Overlay } from './client/renderer';
import { Input } from './client/input';
import { BattleAudio } from './client/audio';
import { SimWorld } from './sim/world';
import { LocalTransport } from './net/transport';
import { capacity, crews, UNITS, TPS } from './sim/config';
import { fieldArmy, threshold } from './sim/strategy';
import { WIDTH, HEIGHT } from './sim/maps';
import type { CommandAction, Difficulty, Faction, Kind, MapId, Mode, Point } from './sim/types';
mount();
const canvas = el<HTMLCanvasElement>('world'), paint = coverArt(el('art')), world = new SimWorld(4), queue = new LocalTransport(), audio = new BattleAudio();
const view = new Renderer(canvas, el('mini')), cam = view.camera, selected = new Set<number>(), repeat = new Set<Kind>();
const overlay: Overlay = { selected, box: null, hover: null, order: null, build: null, faction: 1 };
let placement: Kind | null = null, chosen: Kind = 'halberdier';
let nation: Faction = 1, side: Faction = 1, playing = false, paused = false, speed = 1, category = '', scope = 0, accum = 0, last = 0, lastHud = 0, lastCover = -1, noticeAt = 0, history = '';
const send = (a: CommandAction) => queue.send(world.tick, side, a);
const say = (msg: string) => { el('notice').textContent = msg; noticeAt = performance.now(); };
const own = () => world.units.filter(u => u.faction === side && fieldArmy(u));
const recruit = (kind: Kind) => { chosen = kind; send({ type: 'train', payload: { kind } }); };
function refreshCards() { el('cards').hidden = !category; if (category)
    roster(category, side, repeat, recruit, k => { if (repeat.has(k))
        repeat.delete(k);
    else
        repeat.add(k); }); }
function selectedUnits(ids: number[]) { selected.clear(); for (const id of ids)
    selected.add(id); el('group').textContent = selected.size ? '⚑ ' + selected.size + ' 人' : '⚑ 选团'; }
function tap(p: Point) {
    if (placement && world.mode === 'sandbox') {
        send({ type: 'spawn', payload: { ...p, kind: placement, count: 1, formation: 'line' } });
        placement = null;
        return;
    }
    if (overlay.build) {
        send({ type: 'build', payload: { ...p, kind: overlay.build } });
        overlay.build = null;
        return;
    }
    if (selected.size) {
        const structure = world.structures.find(s => s.hp > 0 && s.faction !== side && Math.abs(s.x - p.x) < s.w / 2 && Math.abs(s.y - p.y) < s.h / 2);
        send({ type: 'order', payload: { point: p, ids: [...selected], structureId: structure?.id } });
        overlay.order = p;
        selectedUnits([]);
        return;
    }
    const troops = own(), hit = troops.filter(u => Math.hypot(u.x - p.x, u.y - p.y) < 32 / cam.zoom).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (hit)
        selectedUnits(troops.filter(u => Math.hypot(u.x - hit.x, u.y - hit.y) <= 280).map(u => u.id));
}
const input = new Input(canvas, cam, tap, (a, b) => selectedUnits(own().filter(u => u.x >= Math.min(a.x, b.x) && u.x <= Math.max(a.x, b.x) && u.y >= Math.min(a.y, b.y) && u.y <= Math.max(a.y, b.y)).map(u => u.id)), () => playing);
function hud() {
    const r = world.realms[side], army = own(), count = (f: number) => world.units.filter(u => u.faction === f && !u.gun).length;
    el('top').dataset.mode = world.mode;
    for (const f of [0, 1] as const)
        el('score' + f).textContent = count(f) + ' ⚔' + world.dead[1 - f];
    el('resources').textContent = '粮 ' + r.gold + '　木 ' + r.wood + '　农 ' + world.units.filter(u => u.kind === 'peasant' && u.faction === side).length + '/' + capacity[r.age];
    el('policy').textContent = ({ auto: '⚖ 平衡', gold: '🌾 种田', wood: '🪵 砍树' })[r.policy];
    el('phase').textContent = ({ PATROL_GATHER: '集结', WAVE_ASSAULT: '冲锋', RETREAT_REGROUP: '回撤' })[r.phase] + ' ' + army.length + '/' + threshold(r.age);
    el('cottage').textContent = r.age === 4 ? '⌂ T4 庄园' : '⌂ 升农舍';
    el('cottage').title = 'T' + r.age + ' · 升级需要 ' + r.age * 75 + ' 粮、' + r.age * 80 + ' 木';
    canvas.dataset.player = String(world.player);
    if (history !== world.news) {
        history = world.news;
        say(history);
    }
    if (world.winner === null && performance.now() - noticeAt > 3400)
        el('notice').textContent = '';
    canvas.dataset.camera = [cam.x, cam.y, cam.zoom].map(n => n.toFixed(3)).join(',');
}
function start(mode: Mode) {
    audio.unlock();
    audio.start(nation);
    queue.clear();
    side = nation;
    world.player = nation;
    world.reset(4, el<HTMLSelectElement>('maps').value as MapId, mode, el<HTMLSelectElement>('difficulty').value as Difficulty);
    placement = null;
    el('place').hidden = mode !== 'sandbox';
    playing = true;
    paused = false;
    accum = 0;
    speed = 1;
    category = '';
    scope = 0;
    repeat.clear();
    input.reset();
    selectedUnits([]);
    overlay.order = null;
    overlay.build = null;
    overlay.faction = side;
    el('cover').hidden = true;
    el('battle').hidden = false;
    el('settings').hidden = true;
    el('side').hidden = mode !== 'sandbox';
    el('pause').textContent = '暂停';
    el('speed').textContent = '1×';
    el('side').textContent = '布阵方 ' + (side ? '英' : '法');
    refreshCards();
    view.resize();
    view.reset(world);
    const compact = cam.w < 900;
    cam.zoom = cam.base * (compact ? 1.15 : 1.75);
    cam.x = side ? (compact ? 4020 : 3920) : (compact ? 780 : 880);
    cam.y = 880;
    cam.clamp();
    history = world.news;
    el('notice').textContent = '';
    hud();
}
for (const f of [0, 1] as const)
    el('nation' + f).onclick = () => { nation = f; for (const i of [0, 1])
        el('nation' + i).setAttribute('aria-pressed', String(i === f)); };
for (const mode of ['lord', 'sandbox'] as const)
    el(mode).onclick = () => start(mode);
el('back').onclick = () => { playing = false; input.reset(); audio.stop(); el('battle').hidden = true; el('cover').hidden = false; };
el('menu').onclick = () => { el('settings').hidden = !el('settings').hidden; };
el('music').onclick = () => { audio.music = !audio.music; el('music').textContent = '军歌 ' + (audio.music ? '开' : '关'); };
el('sound').onclick = () => { audio.muted = !audio.muted; el('sound').textContent = '音效 ' + (audio.muted ? '关' : '开'); };
el('gore').onclick = () => {
    const next = !view.decals.inferno;
    view.decals.inferno = next;
    view.vfx.inferno = next;
    el('gore').textContent = next ? '🩸 炼狱血海' : '🩸 常规血腥';
    say(next ? '已开启炼狱血海模式：碎尸、血带与炮火震撼全开' : '已切换为常规血腥浓度');
};
el('pause').onclick = () => { paused = !paused; accum = 0; el('pause').textContent = paused ? '继续' : '暂停'; };
el('speed').onclick = () => { speed = speed === 4 ? 1 : speed * 2; el('speed').textContent = speed + '×'; };
el('side').onclick = () => { side = side ? 0 : 1; overlay.faction = side; repeat.clear(); selectedUnits([]); refreshCards(); cam.x = side ? 3920 : 880; cam.clamp(); el('side').textContent = '布阵方 ' + (side ? '英' : '法'); hud(); };
el('place').onclick = () => { placement = chosen; el('settings').hidden = true; say('轻点地图放置' + UNITS[chosen].name); };
el('save').onclick = () => { world.step(queue.drain(world.tick), false); try {
    localStorage.setItem('gothic-v4', JSON.stringify({ world: world.snapshot(), marks: view.decals.marks, particles: view.vfx.snapshot(), side, auto: [...repeat] }));
    say('布阵已保存');
}
catch {
    say('浏览器存储空间不足');
} };
el('restore').onclick = () => {
    try {
        const data = JSON.parse(localStorage.getItem('gothic-v4') ?? 'null');
        if (!data) {
            say('尚无已保存布阵');
            return;
        }
        queue.clear();
        world.restore(data.world);
        nation = world.player;
        side = data.side;
        overlay.faction = side;
        selectedUnits([]);
        overlay.order = null;
        overlay.build = null;
        placement = null;
        repeat.clear();
        for (const k of data.auto ?? [])
            repeat.add(k);
        view.reset(world);
        view.decals.restore(data.marks);
        view.vfx.restore(data.particles);
        el('side').hidden = el('place').hidden = world.mode !== 'sandbox';
        audio.start(nation);
        paused = true;
        el('pause').textContent = '继续';
        refreshCards();
        say('布阵已恢复');
    }
    catch {
        say('无法读取布阵');
    }
};
el('hire').onclick = () => recruit('peasant');
for (const type of ['cottage', 'policy', 'charge', 'recall'] as const)
    el(type).onclick = () => send({ type, payload: {} });
el('group').onclick = () => { const a = own().filter(u => scope % 3 === 0 || (scope % 3 === 1 ? UNITS[u.kind].role === '火枪' : UNITS[u.kind].armor >= .3)); selectedUnits(a.map(u => u.id)); say(['主力', '火枪', '重甲'][scope++ % 3] + ' · ' + a.length + ' 人，轻点地图下令'); };
el('workshop').onclick = () => {
    const base = world.keep(side);
    if (!base)
        return;
    const existing = world.structures.find(s => s.type === 'siege_workshop' && s.faction === side && s.hp > 0);
    if (existing) {
        say(existing.needed ? '军事工坊施工中' : '军事工坊已就绪');
        return;
    }
    for (let i = 0; i < 36; i++) {
        const p = { x: base.x + (i % 6 - 2) * 116, y: base.y + 265 + Math.floor(i / 6) * 90 };
        if (world.blueprint('siege_workshop', p, side).valid) {
            send({ type: 'build', payload: { ...p, kind: 'siege_workshop' } });
            say('军事工坊已选址');
            return;
        }
    }
};
for (const [id, kind] of [['bridge', 'pontoon'], ['stakes', 'palisade']] as const)
    el(id).onclick = () => { overlay.build = kind; el('settings').hidden = true; say(kind === 'pontoon' ? '轻点河面架设浮桥' : '轻点地面修筑拒马'); };
categories.forEach((cat, i) => el('cat' + i).onclick = () => { category = category === cat ? '' : cat; refreshCards(); });
el('mini').onclick = e => { const r = el('mini').getBoundingClientRect(); cam.x = (e.clientX - r.left) / r.width * WIDTH; cam.y = (e.clientY - r.top) / r.height * HEIGHT; cam.clamp(); };
addEventListener('keydown', e => { if (playing && e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    el('pause').click();
} });
function frame(now: number) {
    const dt = Math.min(.1, (now - last) / 1000);
    last = now;
    if (!playing) {
        if (now - lastCover >= 85) {
            paint(now);
            lastCover = now;
        }
    }
    else {
        if (!paused && world.winner === null)
            accum += dt * speed;
        while (accum >= 1 / TPS && world.winner === null) {
            if (world.tick % 60 === 0)
                for (const k of repeat)
                    recruit(k);
            const events = world.step(queue.drain(world.tick));
            audio.play(events);
            view.vfx.consume(events);
            view.vfx.update(1 / TPS);
            accum -= 1 / TPS;
            if (world.winner !== null) {
                say(world.winner === nation ? '攻克敌堡 · 征战胜利' : '要塞失守 · 征战结束');
                history = world.news;
                el('settings').hidden = false;
            }
        }
        if (paused && world.winner === null)
            world.step(queue.drain(world.tick), false);
        audio.sequence(world.realms[nation].phase === 'WAVE_ASSAULT', paused || world.winner !== null);
        input.update(dt);
        overlay.box = input.box;
        view.draw(world, overlay, now - lastHud > 160);
        if (now - lastHud > 160) {
            hud();
            lastHud = now;
        }
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
