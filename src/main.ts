import type {MapId,Mode,Difficulty} from './sim/types';
import type {Mark} from './client/decalLayer';
import './style.css';
import { SimWorld } from './sim/world';
import { LocalTransport } from './net/transport';
import { TPS } from './sim/config';
import type { BuildType, CommandAction, Formation, Kind, Snapshot } from './sim/types';
import { Hud, type Controls } from './client/hud';
import { Renderer } from './client/renderer';
import { Input, selectBrush, switchSide } from './client/input';
import { BattleAudio } from './client/audio';
const world = new SimWorld(), transport = new LocalTransport(), audio = new BattleAudio();
const state: Controls = {
    faction: 0, kind: 'halberdier', form: 'phalanx', count: 10, build: null, selected: new Set(), mode: 'spawn', speed: 1, paused: false, muted: false, scope: 'all'
};
if (innerWidth <= 760)
    document.body.classList.add('hide-side');
const hud = new Hud(state, world, action), renderer = new Renderer(hud.canvas, hud.mini), input = new Input(world, renderer, hud, state, send, action);
const storageKey = 'blood-siege-deployment-v1';
function openingVolley() {
    if (world.scenario !== 0||world.mode!=='sandbox') return;
    // Start on the first exchange of fire, with live projectiles and their matching effects.
    for (let tick = 0; tick < TPS; tick++) {
        renderer.vfx.consume(world.step([]));
        renderer.vfx.update(1 / TPS);
    }
}
openingVolley();
type Deployment=Snapshot & {marks?:Mark[]; particles?:ReturnType<typeof renderer.vfx.snapshot>};
function capture():Deployment {return Object.assign(world.snapshot(),{marks:structuredClone(renderer.decals.marks),particles:renderer.vfx.snapshot()});}
let initial=capture(), saved:Deployment|null=null,lastWinner=world.winner;
function send(a: CommandAction) { transport.send(world.tick, state.faction, a); }
function resetView(paused = false) {
    state.selected.clear();
    document.getElementById('flag-dispatch')!.hidden = true;
    input.settingRally = false;
    state.hall = undefined;
    state.faction = 0;
    state.build = null;
    state.mode = world.mode === 'lord' ? 'select' : 'spawn';
    input.overlay.order = null;
    renderer.reset(world);
    hud.close();
    state.paused = paused;
    hud.rebuildBrushes();
    hud.refresh();
    accum = 0;
}
function action(id: string) {
    if(id==='lord'||id==='sandbox'||id.startsWith('map-')||id.startsWith('difficulty-')||id.startsWith('scenario')){
        const mode:Mode=id==='lord'||id==='sandbox'?id:world.mode;
        if((id==='lord'||id==='sandbox')&&mode===world.mode){hud.close();return;}
        const map=id.startsWith('map-')?id.slice(4) as MapId:world.map;
        const difficulty=id.startsWith('difficulty-')?id.slice(11) as Difficulty:world.difficulty;
        const index=id.startsWith('scenario')?Number(id.slice(8)):mode==='lord'?0:world.scenario;
        transport.clear();send({type:'scenario',payload:{map,difficulty,mode,index}});
        world.step(transport.drain(world.tick),false);lastWinner=null;resetView();
        renderer.camera.frameScenario(index);
        if(mode==='lord'){renderer.camera.scale(1.6);renderer.camera.x=960;renderer.camera.y=1050;renderer.camera.clamp();}
        openingVolley();initial=capture();hud.update(0,renderer.camera.zoom/renderer.camera.base,renderer.camera);
        return;
    }
    if(id==='age')send({type:'age',payload:{x:0,y:0}});
    else if(id==='wood'||id==='gold')send({type:'gather',payload:{resource:id,ids:state.selected.size?[...state.selected]:undefined}});
    else if(id==='steel'||id==='powder')send({type:'research',payload:{tech:id}});
    else if(id==='honor'){
        if(world.mode==='lord')send({type:'train',payload:{kind:'guard'}});
        else {
            const keep=world.keep(state.faction),d=state.faction===0?1:-1;
            const pos=keep?{x:keep.x+d*224,y:keep.y}:{x:renderer.camera.x-d*260,y:renderer.camera.y};
            send({type:'guard',payload:pos});
            hud.toast('已部署皇家仪仗队');
        }
    }else if(id==='rally'){input.settingRally=true;hud.toast('点击地图设置新兵集结点');}
    else if (id === 'troops' || id === 'works') {
        state.hall=undefined;
        selectBrush(state, id === 'works' ? 'palisade' : state.kind, id === 'works');
        hud.rebuildBrushes();
    }
    else if (id.startsWith('unit-') || id.startsWith('build-')){
        selectBrush(state,id.split('-')[1] as Kind|BuildType,id.startsWith('build-'));
        if(world.mode==='lord'&&id.startsWith('unit-')){send({type:'train',payload:{kind:state.kind,building:state.hall}});state.mode='select';}
    }
    else if (id === 'f0' || id === 'f1') {
        if(world.mode==='lord'&&id==='f1')return;
        switchSide(state, id === 'f0' ? 0 : 1);
        hud.rebuildBrushes();
    }
    else if (/^n\d+$/.test(id))
        state.count = Number(id.slice(1));
    else if (id.startsWith('form-')) {
        state.form = id.slice(5) as Formation;
        if (state.selected.size)
            send({ type: 'formation', payload: { formation: state.form, ids: [...state.selected] } });
    }
    else if (id === 'apply') {
        const scope = input.scope();
        if (scope.ids?.length === 0) {
            hud.toast('请先框选部队');
            return;
        }
        send({ type: 'formation', payload: { ...scope, formation: state.form } });
        hud.toast('已下达变阵指令');
    }
    else if (id === 'save') {
        world.step(transport.drain(world.tick), false);
        saved = capture();
        try {
            localStorage.setItem(storageKey, JSON.stringify(saved));
            hud.toast('布阵已保存在此浏览器');
        }
        catch {
            hud.toast('已保存到本次会话，浏览器存储空间不足');
        }
    }
    else if (id === 'restore') {
        let snapshot = saved;
        if (!snapshot) {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw) as Deployment;
                    if (Array.isArray(parsed.groups) && Array.isArray(parsed.structures) && Array.isArray(parsed.units) && parsed.stats?.length === 2)
                        snapshot = parsed;
                }
            }
            catch { /* Use this scenario's initial deployment if storage is unavailable. */ }
        }
        transport.clear();
        send({ type: 'restore', payload: { state: snapshot ?? initial } });
        world.step(transport.drain(world.tick), false);
        lastWinner = world.winner;
        resetView(true);
        const data=snapshot??initial;
        if(data.marks) renderer.decals.restore(data.marks);
        if(data.particles) renderer.vfx.restore(data.particles);
        hud.update(0,renderer.camera.zoom/renderer.camera.base,renderer.camera);
        hud.toast(snapshot ? '已恢复保存的布阵（已暂停，按空格开战）' : '已恢复剧本初始布阵（已暂停，按空格开战）');
    }
    else if (id === 'audio') {
        state.muted = !state.muted;
        audio.muted = state.muted;
        if (!state.muted)
            audio.unlock();
    }
    else if (id === 'pause') {
        state.paused = !state.paused;
        accum = 0;
    }
    else if (id.startsWith('speed')) {
        state.speed = Number(id.slice(5));
        state.paused = false;
    }
    else if (id === 'plus' || id === 'minus')
        renderer.camera.scale(id === 'plus' ? 1.25 : .8);
    else if (id === 'spawnmode' || id === 'selectmode' || id === 'order') {
        state.mode = id === 'spawnmode' ? 'spawn' : id === 'selectmode' ? 'select' : 'order';
        if (state.mode === 'spawn')
            state.selected.clear();
        if (id === 'order')
            hud.toast('点击地面集结，或点击建筑下达攻击指令');
    }
    else if (id === 'attack') {
        const scope = state.selected.size ? { ids: [...state.selected] } : input.scope();
        if (scope.ids?.length === 0) {
            hud.toast('请先框选部队');
            return;
        }
        send({ type: 'order', payload: { ...scope, point: null } });
        hud.toast('部队开始向敌方城堡推进');
    }
    hud.refresh();
}
document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
let last = performance.now(), accum = 0, frames = 0, fps = 0, sample = last, screenFrames = 0;
function frame(now: number) {
    const dt = Math.min(.12, (now - last) / 1000);
    last = now;
    if (!state.paused)
        accum += dt * state.speed;
    const quantum = 1 / TPS;
    if (state.paused) {
        const commands = transport.drain(world.tick);
        if (commands.length)
            renderer.vfx.consume(world.step(commands, false));
    }
    for (let i = 0; !state.paused && accum >= quantum && i < 12; i++) {
        const events = world.step(transport.drain(world.tick));
        renderer.vfx.consume(events);
        audio.play(events);
        hud.dispatch(events);
        renderer.vfx.update(quantum);
        accum -= quantum;
        if (world.winner !== null && world.winner !== lastWinner) {
            lastWinner = world.winner;
            hud.open('victory');
            state.paused = true;
            hud.refresh();
            accum = 0;
        }
    }
    input.update(dt);
    renderer.draw(world, input.overlay, screenFrames++ % 4 === 0);
    frames++;
    if (now - sample >= 350) {
        fps = frames * 1000 / (now - sample);
        sample = now;
        frames = 0;
        hud.update(fps, renderer.camera.zoom / renderer.camera.base, renderer.camera);
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
