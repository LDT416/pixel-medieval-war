import {upgradeLegacy,currentKind} from './client/legacySave';
import {portrait} from './client/portraits';
import {BUILDINGS} from './sim/buildings';
import './style.css';
import { mount, el, roster, categories } from './client/hud';
import { coverArt } from './client/coverArt';
import { Renderer, type Overlay } from './client/renderer';
import { Input } from './client/input';
import { BattleAudio } from './client/audio';
import { SimWorld } from './sim/world';
import { LocalTransport } from './net/transport';
import { capacity, crews, UNITS, TPS,strength,shelter,KINDS } from './sim/config';
import { fieldArmy, threshold } from './sim/strategy';
import { WIDTH, HEIGHT,riverX } from './sim/maps';
import type { CommandAction, Difficulty, Faction, Kind, MapId, Mode, Point } from './sim/types';
mount();
const canvas = el<HTMLCanvasElement>('world'), world = new SimWorld(4), queue = new LocalTransport(), audio = new BattleAudio();
const view = new Renderer(canvas, el('mini')), cam = view.camera, selected = new Set<number>(), repeat = new Set<Kind>();
const overlay: Overlay = { selected, box: null, hover: null, order: null, build: null, faction: 1 };
coverArt(el('art'));
let placement: Kind | null = null, chosen: Kind = 'line_infantry';
let nation: Faction = 1, side: Faction = 1, playing = false, paused = false, speed = 1, category = '', scope = 0, accum = 0, last = 0, lastHud = 0, lastCover = -1, noticeAt = 0, history = '';
const send = (a: CommandAction) => queue.send(world.tick, side, a);
const say = (msg: string) => { el('notice').textContent = msg; noticeAt = performance.now(); };
const own = () => world.units.filter(u => u.faction === side && fieldArmy(u));
const recruit = (kind: Kind) => { chosen = kind; send({ type: 'train', payload: { kind } }); };
function refreshCards() { el('cards').hidden = !category; if (category)
    roster(category, side, repeat, recruit, k => { if (repeat.has(k))
        repeat.delete(k);
    else
        repeat.add(k); }, k=>{chosen=k;send({type:"train",payload:{kind:k,full:true}});}); }
function selectedUnits(ids: number[]) { selected.clear(); for (const id of ids)
    selected.add(id);
    const first=world.units.find(u=>selected.has(u.id));el('detail').hidden=!first;
    if(first){const title=document.createElement('span');title.textContent=UNITS[first.kind].name+' · '+selected.size+' 人';el('unitInfo').replaceChildren(portrait(first.kind,side),title);}
    el('group').textContent = selected.size ? '⚑ ' + selected.size + ' 人' : '⚑ 选团'; }
function tap(p: Point) {
    if (placement && world.mode === 'sandbox') {
        const qty=strength[placement],form='line';
        send({ type: 'spawn', payload: { ...p, kind: placement, count: qty, formation: form } });
        placement = null;
        return;
    }
    if (overlay.build) {
        send({ type: 'build', payload: { ...p, kind: overlay.build } });
        overlay.build = null;
        return;
    }
    if (selected.size) {
        const structure = world.structures.find(s => s.hp > 0 && Math.abs(s.x - p.x) < s.w / 2 && Math.abs(s.y - p.y) < s.h / 2);
        if(structure&&shelter(structure.type)&&(structure.faction===-1||structure.faction===side))send({type:'garrison',payload:{tower:structure.id,ids:[...selected]}});
        else send({ type: 'order', payload: { point: p, ids: [...selected], structureId: structure&&structure.faction!==side?structure.id:undefined } });
        overlay.order = p;
        selectedUnits([]);
        return;
    }
    const troops = world.units.filter(u=>u.faction===side&&u.hp>0&&!u.gun&&u.kind!=='supply_wagon'), hit = troops.filter(u => Math.hypot(u.x - p.x, u.y - p.y) < 32 / cam.zoom).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (hit)
        selectedUnits(troops.filter(u => u.group===hit.group).map(u => u.id));
    else{const site=world.structures.find(s=>s.hp>0&&s.faction===side&&shelter(s.type)&&Math.abs(p.x-s.x)<s.w/2&&Math.abs(p.y-s.y)<s.h/2);if(site)selectedUnits(troops.filter(u=>u.tower===site.id).map(u=>u.id));}
}
const input = new Input(canvas, cam, tap, (a, b) => selectedUnits(own().filter(u => u.x >= Math.min(a.x, b.x) && u.x <= Math.max(a.x, b.x) && u.y >= Math.min(a.y, b.y) && u.y <= Math.max(a.y, b.y)).map(u => u.id)), () => playing);
function hud() {
    const r = world.realms[side], army = own(), count = (f: number) => world.units.filter(u => u.faction === f && !u.gun).length;
    const current=world.units.filter(u=>selected.has(u.id));
    if(selected.size&&!current.length)selectedUnits([]);
    if(current.length){
        const info=el('unitInfo').querySelector('span');if(info){const first=current[0],morale=Math.round(current.reduce((total,u)=>total+(u.morale??75),0)/current.length);
            info.textContent=UNITS[first.kind].name+' · '+(first.crew!==undefined?'炮组 '+first.crew+' 人':current.length+' 人')+' · 士气 '+morale;}
        for(const b of el('forms').querySelectorAll('button'))b.setAttribute('aria-pressed',String(current.every(u=>u.formation===b.dataset.form)));
    }
    el('top').dataset.mode = world.mode;
    for (const f of [0, 1] as const)
        el('score' + f).textContent = count(f) + ' ⚔' + world.dead[1 - f];
    el('resources').textContent = '粮 ' + r.gold + '　木 ' + r.wood + '　农 ' + world.units.filter(u => u.kind === 'peasant' && u.faction === side).length + '/' + capacity[r.age];
    for(const id of ['steel','powder','grape'] as const){const button=el<HTMLButtonElement>(id);button.disabled=r[id];button.title=r[id]?'研发完成':'需要 T2 农庄与陆军学院 · 100 木 / 140 粮';}
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
    chosen='line_infantry';
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
    localStorage.setItem('napoleon-5.2', JSON.stringify({ world: world.snapshot(), marks: view.decals.marks, particles: view.vfx.snapshot(), side, auto: [...repeat] }));
    say('布阵已保存');
}
catch {
    say('浏览器存储空间不足');
} };
el('restore').onclick = () => {
    try {
        const current=localStorage.getItem('napoleon-5.2');
        const data=JSON.parse(current??localStorage.getItem('gothic-v4')??'null');
        if (!data) {
            say('尚无已保存布阵');
            return;
        }
        queue.clear();
        world.restore(current?data.world:upgradeLegacy(data.world));
        nation = world.player;
        side = data.side;
        overlay.faction = side;
        selectedUnits([]);
        overlay.order = null;
        overlay.build = null;
        placement = null;
        repeat.clear();
        for (const k of data.auto ?? [])
            repeat.add(current? k : currentKind(k));
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
for(const [id,kind] of [['workshop','foundry'],['academy','academy'],['barracks','barracks'],['redoubt','redoubt'],['lowwall','lowwall']] as const)
    el(id).onclick=()=>{
        const home=world.keep(side);if(!home)return;
        const front=kind==='redoubt'||kind==='lowwall',center=front?{x:Math.max(1720,Math.min(3080,world.fronts[side].x)),y:880}:home;
        for(let i=0;i<60;i++){
            const p={x:center.x+(i%7-3)*110,y:center.y+(front?60:250)+Math.floor(i/7)*80};
            if(world.blueprint(kind,p,side).valid){send({type:'build',payload:{kind,...p}});say(BUILDINGS[kind][0]+'已选址');return;}
        }
        say('附近没有合适的空地');
    };
for(const tech of ['steel','powder','grape'] as const)el(tech).onclick=()=>send({type:'research',payload:{tech}});
for(const [form,label] of [['line','三排线列'],['melee','刺刀纵队'],['square','空心方阵'],['crescent','半圆火网']] as const){
    const button=document.createElement('button');button.textContent=label;button.dataset.form=form;button.onclick=()=>send({type:'formation',payload:{formation:form,ids:[...selected]}});el('forms').append(button);
}
el('codex').onclick=()=>{
    const book=el<HTMLDialogElement>('book');el('entries').replaceChildren();
    for(const k of KINDS.filter(k=>k!=='supply_wagon')){
        const card=document.createElement('article'),name=document.createElement('b'),info=document.createElement('small');
        name.textContent=UNITS[k].name;info.textContent=crews[k]?crews[k]+' 名炮手 · 射程 '+UNITS[k].range:'编制 '+strength[k]+' · 射程 '+UNITS[k].range;
        card.append(portrait(k,side),name,info);el('entries').append(card);
    }
    book.showModal();
};
el('closeBook').onclick=()=>el<HTMLDialogElement>('book').close();
for (const [id, kind] of [['bridge', 'pontoon'], ['stakes', 'palisade']] as const)
    el(id).onclick = () => {
        if(kind==='pontoon'&&cam.w<900){
            if(world.map!=='twin'){say('此战场没有需要架桥的河流');return;}
            for(const y of [880,720,1050,370,1410]){const p={x:riverX(y),y};if(world.blueprint(kind,p,side).valid){send({type:'build',payload:{...p,kind}});el('settings').hidden=true;return;}}
            say('河段暂时无法施工');return;
        }
        overlay.build = kind; el('settings').hidden = true; say(kind === 'pontoon' ? '轻点河面架设浮桥' : '轻点地面修筑拒马'); };
categories.forEach((cat, i) => el('cat' + i).onclick = () => { category = category === cat ? '' : cat; refreshCards(); });
el('mini').onclick = e => { const r = el('mini').getBoundingClientRect(); cam.x = (e.clientX - r.left) / r.width * WIDTH; cam.y = (e.clientY - r.top) / r.height * HEIGHT; cam.clamp(); };
addEventListener('keydown', e => { if (playing && e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    el('pause').click();
} });
function frame(now: number) {
    const dt = Math.min(.1, (now - last) / 1000);
    last = now;
    if(playing){
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
