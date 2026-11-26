import {flagImage} from './banners';
import {BUILDINGS,ROSTER,CATEGORIES,AGES} from '../sim/buildings';
import {MAPS} from '../sim/maps';
import {LORDS} from '../sim/aiDirector';
import { FORMS, KINDS, SCENARIOS, SIDES, TPS, UNITS } from '../sim/config';
import type { SimEvent, BuildType, Faction, Formation, Kind, Point } from '../sim/types';
import { SimWorld } from '../sim/world';
import { portrait } from './portraits';
export const BUILD_NAMES=Object.fromEntries(Object.entries(BUILDINGS).map(([key,row])=>[key,row[0]])) as Record<BuildType,string>;
const filters=(id:string)=>'<select id="'+id+'" aria-label="兵系筛选">'+CATEGORIES.map((v,i)=>'<option value="'+i+'">'+v+'</option>').join('')+'</select>';
const paths: Record<string, string> = {
    swords: 'M4 3l3 1 10 12-2 2L4 6z M3 16l4 4 M15 15l5 5 M20 3l-3 1-5 6 M9 14l-5 6 M13 18l6-5',
    book: 'M3 4q5-1 9 2 4-3 9-2v14q-5-1-9 2-4-3-9-2z M12 6v14',
    chart: 'M3 20h18 M6 17v-5h2v5 M11 17V8h2v9 M16 17V4h2v13',
    shield: 'M4 3h16v9q-1 6-8 10-7-4-8-10z M12 6v11',
    sound: 'M3 9h4l5-5v16l-5-5H3z M16 8q4 4 0 8 M19 4q8 8 0 16',
    mute: 'M3 9h4l5-5v16l-5-5H3z M16 9l6 6 M22 9l-6 6',
    fort: 'M2 20V5h3v3h3V5h3v7h2V5h3v3h3V5h3v15z M10 20v-5h4v5',
    chevron: 'M6 9l6 6 6-6', fold: 'M15 5l-7 7 7 7', flag: 'M5 21V3l6 1 7-1v10l-7 1-6-1',
    play: 'M7 4l13 8-13 8z', pause: 'M7 5v14 M16 5v14', save: 'M4 3h13l4 4v14H4z M8 3v7h8V3 M8 21v-7h9v7',
    restore: 'M3 10a9 9 0 1 1 1 8 M3 3v7h7', trash: 'M3 6h18 M8 3h8 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
    clock: 'M12 3a9 9 0 1 1-.1 0 M12 6v6l4 2', target: 'M12 3a9 9 0 1 1-.1 0 M12 0v6 M12 18v6 M0 12h6 M18 12h6',
    skull: 'M5 16c-6-15 20-18 14 0l-4 1v4H9v-4z M8 11h2 M14 11h2', wing: 'M2 17l5-8 13-5-4 7-9 3 M10 14l-2 6',
    move: 'M3 10l8-7 9 7 M11 3v18', hand: 'M5 12V7l3 2V4l3 1V2l3 2v2l3-1v3l3-1v8l-4 6H9z',
    select: 'M4 3l13 9-6 2-3 6z', plus: 'M12 4v16 M4 12h16', minus: 'M4 12h16', map: 'M2 5l7-2 6 2 7-2v16l-7 2-6-2-7 2z M9 3v16 M15 5v16',
    dot: 'M12 4l7 8-7 8-7-8z', close: 'M5 5l14 14 M19 5L5 19', help: 'M8 8a4 4 0 1 1 7 3l-3 2v2 M12 18v2', info: 'M12 3a9 9 0 1 1-.1 0 M12 10v7 M12 7v1',
    tool: 'M5 4l4 2-1 3 8 8 3-1 2 3-3 2-3-2-1-2-8-8-3-1z',
    phalanx: 'M3 4h7v6H3z M14 4h7v6h-7z M3 14h7v6H3z M14 14h7v6h-7z', line: 'M2 6h20 M2 12h20 M2 18h20', skirmish: 'M3 3h3v3H3z M17 5h3v3h-3z M9 12h3v3H9z M3 18h3v3H3z M18 18h3v3h-3z',
    panel: 'M3 4h18v16H3z M9 4v16', hour: 'M5 3h14 M5 21h14 M7 3q0 6 5 9-5 3-5 9 M17 3q0 6-5 9 5 3 5 9',
    palisade: 'M3 20l4-14 4 14 M13 20l4-14 4 14 M2 13h20 M3 17h18',
    lowwall: 'M2 9h20v11H2z M2 14h20 M8 9v5 M16 9v5 M12 14v6',
    pontoon: 'M2 8h20 M2 16h20 M6 6v12 M12 6v12 M18 6v12 M2 20q5-2 10 0t10 0'
};
const BUILD_ICONS: Record<BuildType, string> = { barracks:'swords',range:'target',abbey:'plus',siege_workshop:'tool',stables:'wing',palisade: 'palisade', lowwall: 'lowwall', pontoon: 'pontoon', outpost: 'fort' };
export function icon(name: string, size = 16) { return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="square" stroke-linejoin="miter"><path d="' + (paths[name] ?? paths.dot) + '"/></svg>'; }
function crest() { return '<svg class="crest" viewBox="0 0 42 48" aria-hidden="true"><path fill="#655236" d="M1 7l7 3V5l7 3 6-8 6 8 7-3v5l7-3-3 28-17 13L4 35z"/><path fill="#d4b67b" d="M4 10l7 3V9l6 2 4-6 4 6 6-2v4l7-3-3 23-14 11L7 33z"/><path fill="#662b27" d="M9 16l12-3 12 3-2 15-10 9-10-9z"/><path fill="#ac5140" d="M10 16l11-3v26l-10-9z"/><path fill="#ddc797" d="M14 18l3 1 10 13-2 2-10-13z M28 18l-3 1-10 13 2 2 10-13z M12 29l2-2 7 6-2 2z M30 29l-2-2-7 6 2 2z"/></svg>'; }
export interface Controls {
    hall?:number;
    faction: Faction;
    kind: Kind;
    form: Formation;
    count: number;
    build: BuildType | null;
    mode: 'spawn' | 'select' | 'order';
    selected: Set<number>;
    speed: number;
    paused: boolean;
    muted: boolean;
    scope: 'all' | 'kind' | 'selected';
}
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const action = (id: string, content: string, title = '') => '<button type="button" data-act="' + id + '"' + (title ? ' title="' + title + '" aria-label="' + title + '"' : '') + '>' + content + '</button>';
const num = (v: number) => Math.round(v).toLocaleString('en-US');
export class Hud {
    readonly canvas: HTMLCanvasElement;
    readonly mini: HTMLCanvasElement;
    private category=0;
    private bookCategory=0;
    private dialog = '';
    private codex: Kind = 'halberdier';
    private infoKey = '';
    private toastTimer = 0;
    private scenario = -1;
    private focusedKind: Kind = 'halberdier';
    constructor(private state: Controls, private world: SimWorld, private cb: (action: string) => void) {
        $('app').innerHTML = `<header id="top"><div class="brand">${crest()}<div><h1>血战千军</h1><span>BLOOD &amp; SIEGE</span></div></div><nav>${action('sandbox', icon('swords') + '血腥沙盒')}${action('lord',icon('fort')+'领主血仇对决')}${action('codex', icon('book') + '兵种图鉴')}${action('report', icon('chart') + '战局简报')}</nav><div class="header-right"><span class="online"><i></i>战场在线</span>${action('audio', icon('sound'), '音效开关')}${action('help', icon('help'), '操作指南')}${action('top', icon('panel'), '收起顶部 HUD')}</div></header>
 <div id="layout"><aside id="arsenal"><div class="sidehead"><div>${icon('swords', 19)}<h2>军械库</h2></div>${action('sidebar', icon('fold', 15), '收起军械库')}</div>
 <div class="side-scroll"><section id="campaign">
 <div class="campaign-picks"><label>战场<select id="map-choice">${Object.entries(MAPS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')}</select></label><label class="lord-only">敌方领主<select id="difficulty">${Object.entries(LORDS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')}</select></label></div>
 <div class="lord-only"><strong id="treasury"></strong><p id="production"></p><div class="realm-actions">${action('age','晋升时代')}${action('rally','设集结点')}${action('steel','精钢锻甲','木100 金140 · 护甲 +10%')}${action('powder','烈性黑火药','木100 金140 · 火器与攻城伤害 +20%')}${action('wood','指派伐木')}${action('gold','指派采金')}</div></div></section><section><h3>部署阵营</h3><div id="factions" class="seg twins">${SIDES.map((s, i) => action('f' + i, flagImage(i as Faction).outerHTML + s)).join('')}</div></section>
 <section class="library"><div id="category" class="tabs">${action('troops', icon('swords', 14) + '兵种')}${action('works', icon('fort', 14) + '工事')}</div>${filters('unit-filter')}<div class="honor-action">${action('honor','征召皇家仪仗队','沙盒免费部署 · 领主需要 T2 修道院、木60 金350。含掌旗官、鼓手、号手与两名长戟卫士。')}</div><div id="brushes"></div></section>
 <section class="sandbox-only"><h3>部署数量</h3><div id="counts" class="seg">${[1, 10, 50, 200].map(n => action('n' + n, '×' + n)).join('')}</div></section>
 <section><h3>军团战阵</h3><div id="forms" class="forms">${Object.entries(FORMS).map(([k, v]) => action('form-' + k, icon(k, 13) + v)).join('')}</div>
 <div class="apply"><select id="scope" aria-label="阵型指令范围"><option value="all">全体友军</option><option value="kind">当前兵种</option><option value="selected">框选部队</option></select>${action('apply', '应用阵型')}</div></section>
 </div><div class="sidefoot">${action('save', icon('save', 14) + '保存布阵')}${action('restore', icon('restore', 14) + '恢复布阵')}${action('clear', icon('trash', 14), '清空全场')}</div></aside>
 <main><div id="scenario-bar"><div class="scenario-switch">${icon('flag', 20)}<div class="scenario-meta"><small>当前剧本</small><div class="scenario-select-wrap"><select id="scenario" aria-label="当前剧本">${SCENARIOS.map((s, i) => '<option value="' + i + '">' + s + '</option>').join('')}</select>${icon('chevron', 12)}</div></div></div><div class="counters"><span class="blue">${flagImage(0).outerHTML}<b id="blue-count">0</b><small>铁冠北境</small></span><span class="red">${flagImage(1).outerHTML}<b id="red-count">0</b><small>赤棘血朝</small></span><span>${icon('skull', 15)}<b id="dead">0</b><small>累计击杀</small></span><span>${icon('wing', 15)}<b id="air">0</b><small>击飞碎尸</small></span><span><b id="farm-kills">0</b><small>屠农</small></span></div></div>
 <div id="stage"><canvas id="battle" aria-label="双桥血河实时战场"></canvas><div class="map-stamp"><span class="rec"></span><b id="live">实时战斗</b><span id="clock">00:00</span></div><div class="north"><span>N</span><i></i></div>
 <div id="map-tools">${action('sidebar', icon('panel'), '显示或收起军械库')}${action('spawnmode', icon('plus'), '部署部队或工事')}${action('selectmode', icon('select'), '选择部队')}${action('order', icon('flag'), '指定集结点或攻击建筑')}${action('attack', icon('swords'), '向敌方城堡进攻')}</div>
 <div class="zoom">${action('minus', icon('minus', 12), '缩小')}<span id="zoom">1.0×</span>${action('plus', icon('plus', 12), '放大')}</div>
 <div id="minipanel"><div><b>${icon('map', 13)}战术地图</b><span id="coords">1920 / 1080</span></div><canvas id="mini" aria-label="点击或拖动小地图定位"></canvas></div>
 <div id="flag-dispatch" hidden role="status"></div><div id="bulletin"></div><div id="toast" role="status"></div></div>
 <div id="command"><div id="unit-info"></div><div class="pace"><div><span class="micro">${icon('clock', 12)}战场节奏</span><b id="speed-label">1.0×</b></div><div class="playback">${action('pause', icon('pause', 14), '暂停或继续战斗')}${[.5, 1, 2, 4].map(n => action('speed' + n, n + '×')).join('')}</div></div></div></main></div>
 <footer><span><i></i><b id="fps">– FPS</b><em></em>30 TPS</span><div><kbd>W A S D</kbd> 移动镜头 <kbd>滚轮</kbd> 缩放 <kbd>左键拖拽</kbd> 框选 <kbd>空格</kbd> 暂停</div><span>PHASE 02</span></footer>
 <div id="tooltip"></div><div id="modal" hidden></div>`;
        this.canvas = $<HTMLCanvasElement>('battle');
        this.mini = $<HTMLCanvasElement>('mini');
        $('app').addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (b)
            this.click(b.dataset.act!); });
        $<HTMLSelectElement>('scenario').onchange = e => this.cb('scenario' + (e.target as HTMLSelectElement).value);
        $<HTMLSelectElement>('scope').onchange = e => { this.state.scope = (e.target as HTMLSelectElement).value as Controls['scope']; };
        $<HTMLSelectElement>('map-choice').onchange=e=>this.cb('map-'+(e.target as HTMLSelectElement).value);
        $<HTMLSelectElement>('difficulty').onchange=e=>this.cb('difficulty-'+(e.target as HTMLSelectElement).value);
        $<HTMLSelectElement>('unit-filter').onchange=e=>{this.category=Number((e.target as HTMLSelectElement).value);this.rebuildBrushes();this.refresh();};
        this.rebuildBrushes();
        this.refresh();
        this.update(0, 1, { x: 1920, y: 1080 });
    }
    private click(id: string) {
        if (id === 'codex' || id === 'report' || id === 'help') {
            this.open(id);
            return;
        }
        if (id === 'close') {
            this.close();
            return;
        }
        if (id.startsWith('entry-')) {
            this.codex = id.substring(6) as Kind;
            this.open('codex');
            return;
        }
        if (id === 'clear') {
            this.open('clear');
            return;
        }
        if (id === 'erase') {
            this.close();
            this.cb('scenario4');
            return;
        }
        if (id === 'top') {
            document.body.classList.toggle('hide-top');
            return;
        }
        if (id === 'sidebar') {
            document.body.classList.toggle('hide-side');
            return;
        }
        this.cb(id);
        this.refresh();
    }
    private active(id: string, yes: boolean) { document.querySelectorAll('[data-act="' + id + '"]').forEach(e => { e.classList.toggle('active', yes); e.setAttribute('aria-pressed', '' + yes); }); }
    private img(k: Kind, f = this.state.faction) { const c = portrait(k, f), a = document.createElement('canvas'); a.width = a.height = 48; a.getContext('2d')!.drawImage(c, 0, 0); a.setAttribute('aria-label', UNITS[k].name); return a; }
    selectHall(id:number){
        const hall=this.world.byStructure.get(id);
        if(!hall)return;
        this.state.hall=id;this.category=0;$<HTMLSelectElement>('unit-filter').value='0';this.state.build=null;
        this.rebuildBrushes();this.refresh();
        this.toast((hall.type==='keep'?'主堡':BUILD_NAMES[hall.type as BuildType])+' · 点击兵种加入生产队列');
    }
    rebuildBrushes() {
        const el = $('brushes'), s = this.state;
        el.replaceChildren();
        $<HTMLSelectElement>('unit-filter').hidden=!!s.build;
        if (s.build) {
            for (const [k, label] of Object.entries(BUILD_NAMES)) {
                const b = document.createElement('button');
                b.dataset.act = 'build-' + k;
                b.innerHTML = icon(BUILD_ICONS[k as BuildType], 24) + '<span>' + label + (this.world.mode==='lord'?' · '+BUILDINGS[k as BuildType][1]+'木 '+BUILDINGS[k as BuildType][2]+'金':'')+'</span>';
                el.append(b);
            }
        }
        else
            (Object.keys(ROSTER) as Kind[]).filter(k=>(!this.category||ROSTER[k][0]===this.category)&&(!s.hall||this.world.byStructure.get(s.hall)?.type===ROSTER[k][1])).forEach(k => { const b = document.createElement('button'); b.dataset.act = 'unit-' + k; b.append(this.img(k)); const span = document.createElement('span'); span.textContent = UNITS[k].name; if(this.world.mode==='lord'){const price=document.createElement('small');price.textContent='T'+ROSTER[k][2]+' · 木'+ROSTER[k][3]+' 金'+ROSTER[k][4];span.append(price);} b.append(span); el.append(b); b.onpointerenter = e => { if (e.pointerType === 'touch')
                return; const tip = $('tooltip'); tip.innerHTML = '<div><b>' + UNITS[k].name + '</b><small>' + UNITS[k].role + '</small></div><p>' + UNITS[k].detail + '</p>'; tip.prepend(this.img(k)); tip.style.display = 'grid'; const r = b.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - 252, $('arsenal').getBoundingClientRect().right + 8) + 'px'; tip.style.top = Math.min(innerHeight - 160, r.top) + 'px'; }; b.onpointerleave = () => $('tooltip').style.display = 'none'; });
    }
    refresh() {
        const s = this.state;
        document.body.classList.toggle('lord-mode',this.world.mode==='lord');
        this.active('sandbox',this.world.mode==='sandbox');this.active('lord',this.world.mode==='lord');
        $<HTMLSelectElement>('map-choice').value=this.world.map;$<HTMLSelectElement>('difficulty').value=this.world.difficulty;
        for (const f of [0, 1])
            this.active('f' + f, f === s.faction);
        this.active('troops', !s.build);
        this.active('works', !!s.build);
        for (const k of KINDS)
            this.active('unit-' + k, !s.build && k === s.kind);
        for (const k in BUILD_NAMES)
            this.active('build-' + k, s.build === k);
        for (const n of [1, 10, 50, 200])
            this.active('n' + n, n === s.count);
        for (const k in FORMS)
            this.active('form-' + k, s.form === k);
        for (const n of [.5, 1, 2, 4])
            this.active('speed' + n, n === s.speed);
        for (const [id, m] of [['spawnmode', 'spawn'], ['selectmode', 'select'], ['order', 'order']])
            this.active(id, s.mode === m);
        $('speed-label').textContent = s.paused ? '已暂停' : s.speed.toFixed(1) + '×';
        document.querySelector('[data-act="pause"]')!.innerHTML = icon(s.paused ? 'play' : 'pause', 14);
        document.querySelector('[data-act="audio"]')!.innerHTML = icon(s.muted ? 'mute' : 'sound');
        $('live').textContent = s.paused ? '战场暂停' : '实时战斗';
        document.body.classList.toggle('paused', s.paused);
        $('battle').style.cursor = s.mode === 'select' ? 'default' : 'crosshair';
        this.info();
    }
    private info() {
        const s = this.state, u = s.selected.size ? this.world.byUnit.get(s.selected.values().next().value!) : undefined, k = u?.kind ?? s.kind, f = u?.faction ?? s.faction, def = UNITS[k];
        const key = [k, f, s.selected.size, s.build, s.count, s.mode].join('/');
        if (this.infoKey === key)
            return;
        this.infoKey = key;
        this.focusedKind = k;
        const el = $('unit-info');
        el.innerHTML = '<div class="portrait-frame"></div><div class="unit-copy"><span class="micro"><i></i>' + (s.selected.size ? '已选部队 · ' + s.selected.size : s.build ? '工事画笔' : '当前部署兵种') + '</span><h2>' + (s.build && !u ? BUILD_NAMES[s.build] : def.name) + '</h2><div class="tags">' + (s.build && !u ? ['可破坏工事', s.build === 'pontoon' ? '河面铺设' : '陆地建造'] : def.tags).map(t => '<span>' + t + '</span>').join('') + '</div></div><div class="quickstats">' + (s.build && !u ? '' : '<span>生命 <b>' + def.hp + '</b></span><span>攻击 <b>' + def.damage + '</b></span><span>护甲 <b>' + Math.round(def.armor * 100) + '%</b></span>') + '</div>';
        if (s.build && !u)
            el.firstElementChild!.innerHTML = icon(BUILD_ICONS[s.build], 40);
        else
            el.firstElementChild!.append(this.img(k, f));
    }
    update(fps: number, zoom: number, p: Point) {
        const w = this.world, field = [0, 0], guards = [0, 0];
        for (const u of w.units)
            (u.tower ? guards : field)[u.faction]++;
        for (const f of [0, 1] as const) {
            const count = $(f === 0 ? 'blue-count' : 'red-count');
            count.textContent = num(field[f]);
            count.parentElement!.title = SIDES[f] + ' · 野战部队 ' + field[f] + '，驻塔弓手 ' + guards[f];
        }
        $('bulletin').textContent=w.news;
        if(w.tick>=Number($('flag-dispatch').dataset.until??0)||w.tick<2)$('flag-dispatch').hidden=true;
        if(w.mode==='lord'){
            const r=w.realms[0];
            const built=new Set(w.structures.filter(s=>s.faction===0&&s.hp>0&&!s.needed).map(s=>s.type));
            for(const b of document.querySelectorAll<HTMLButtonElement>('#brushes [data-act^="unit-"]')){
                const k=b.dataset.act!.slice(5) as Kind,[,hall,age,wood,gold]=ROSTER[k];
                const available=built.has(hall)&&r.age>=age&&r.wood>=wood&&r.gold>=gold;
                b.classList.toggle('locked',!available);b.title='T'+age+' '+(hall==='keep'?'主堡':BUILD_NAMES[hall as BuildType])+' · 木'+wood+' 金'+gold;
            }
            $('treasury').textContent='T'+r.age+' '+AGES[r.age]+'　木 '+r.wood+'　金 '+r.gold;
            const site=w.byStructure.get(this.state.hall??0);
            const queues=w.structures.filter(s=>s.faction===0&&s.hp>0&&s.queue?.length);
            $('production').textContent=queues.map(s=>(s.type==='keep'?'主堡':BUILD_NAMES[s.type as BuildType])+' · '+(s.queue![0].kind==='guard'?'仪仗队':UNITS[s.queue![0].kind as Kind].name)+' '+Math.floor(s.queue![0].progress*100/s.queue![0].total)+'% ×'+s.queue!.length).join(' / ')||(site?'当前建筑 · '+(site.type==='keep'?'主堡':BUILD_NAMES[site.type as BuildType]):'暂无生产队列');
            const age=document.querySelector<HTMLButtonElement>('[data-act="age"]')!;age.disabled=r.age===3;age.textContent=r.age===3?'已达 T3 终极':r.age===1?'升T2 · 220木/260金':'升T3 · 340木/420金';
            for(const tech of ['steel','powder'] as const) document.querySelector<HTMLButtonElement>('[data-act="'+tech+'"]')!.disabled=r[tech];
            if(site&&site.hp<=0){this.state.hall=undefined;this.rebuildBrushes();}
        }
        $('dead').textContent = num(w.dead[0] + w.dead[1]);
        $('farm-kills').textContent=num(w.realms[0].farmersKilled+w.realms[1].farmersKilled);
        $('air').textContent = num(w.launches[0] + w.launches[1]);
        $('fps').textContent = Math.round(fps) + ' FPS';
        const t = Math.floor(w.tick / TPS);
        $('clock').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
        $('coords').textContent = Math.round(p.x) + ' / ' + Math.round(p.y);
        $('zoom').textContent = zoom.toFixed(1) + '×';
        if (w.scenario !== this.scenario) {
            this.scenario = w.scenario;
            $<HTMLSelectElement>('scenario').value = String(w.scenario);
        }
        for (const id of this.state.selected)
            if (!w.byUnit.has(id))
                this.state.selected.delete(id);
        this.info();
    }
    dispatch(events:SimEvent[]){
        const fallen=events.find(e=>e.type==='death'&&e.kind==='bannerman');
        if(!fallen)return;
        const f=fallen.faction??0,el=$('flag-dispatch');el.hidden=false;el.dataset.until=String(this.world.tick+110);
        el.replaceChildren(flagImage(f,true),document.createTextNode(f?'赤棘掌旗官被斩首，血旗坠地！':'铁冠仪仗掌旗官惨遭斩首！铁冠王旗坠入血泊！'));
    }
    toast(text: string) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => $('toast').classList.remove('show'), 2100); }
    close() { if (this.dialog === 'victory')
        this.state.paused = false; this.dialog = ''; $('modal').hidden = true; $('modal').replaceChildren(); this.active('codex', false); this.active('report', false); this.refresh(); }
    get modalOpen() { return !!this.dialog; }
    open(name: string) {
        if (name === 'codex' && this.dialog !== 'codex')
            this.codex = this.focusedKind;
        this.dialog = name;
        this.active('sandbox', false);
        this.active('codex', name === 'codex');
        this.active('report', name === 'report');
        const modal = $('modal');
        modal.hidden = false;
        const title = ({ codex: '兵种图鉴', report: '战局简报', help: '操作指南', clear: '清空全场', victory: '战役结算' } as Record<string, string>)[name];
        modal.innerHTML = '<article role="dialog" aria-modal="true" aria-label="' + title + '"><header><h2>' + icon(name === 'codex' ? 'book' : name === 'help' ? 'help' : 'flag', 20) + title + '</h2>' + action('close', icon('close'), '关闭') + '</header><div id="dialog-body"></div></article>';
        const body = $('dialog-body');
        if (name === 'codex') {
            const k = this.codex, d = UNITS[k];
            body.innerHTML = '<div class="codex-list"></div><div class="codex-card"><div class="large-art"></div><span class="micro">' + d.role + '</span><h2>' + d.name + '</h2><div class="tags">' + d.tags.map(t => '<span>' + t + '</span>').join('') + '</div><p>' + d.detail + '</p><div class="codex-data">' + [['生命', d.hp], ['攻击', d.damage], ['护甲', Math.round(d.armor * 100) + '%'], ['破甲', Math.round(d.penetration * 100) + '%'], ['征召', 'T'+ROSTER[k][2]+' 木'+ROSTER[k][3]+' 金'+ROSTER[k][4]],['攻击距离', d.range], ['攻击间隔', (d.reload / TPS).toFixed(2) + ' 秒']].map(([l, v]) => '<div>' + l + '<b>' + v + '</b></div>').join('') + '</div></div>';
            const list = body.querySelector('.codex-list')!;
            const selector=document.createElement('div');selector.innerHTML=filters('book-filter');list.append(selector);
            const filter=$<HTMLSelectElement>('book-filter');filter.value=String(this.bookCategory);
            filter.onchange=()=>{this.bookCategory=Number(filter.value);this.codex=KINDS.find(k=>!this.bookCategory||ROSTER[k][0]===this.bookCategory)!;this.open('codex');};
            for (const kind of KINDS.filter(k=>!this.bookCategory||ROSTER[k][0]===this.bookCategory)) {
                const b = document.createElement('button');
                b.dataset.act = 'entry-' + kind;
                b.classList.toggle('active', kind === k);
                b.append(this.img(kind), document.createTextNode(UNITS[kind].name));
                list.append(b);
            }
            body.querySelector('.large-art')!.append(this.img(k));
        }
        else if (name === 'help') {
            body.innerHTML = '<div class="help-list">' + [['沙盒左键', '选择画笔后点击战场部署部队或工事'],['领主征召','点击兵种扣费排队。点击己方建筑可查看该处可训练的兵种。'],['农夫采集','在侧栏指派伐木或采金。框选农夫后，可右键指定一棵树或一处矿脉。'], ['左键拖拽', '框选当前阵营的局部士兵'], ['右键单击', '指挥部队集结、攻击建筑，或让选中的弓手进入有空位的己方箭塔'], ['右键拖拽 / WASD / 方向键', '平移战场镜头'], ['滚轮 / 小地图', '缩放或跳转镜头'], ['空格 / Esc', '暂停战斗或关闭面板']].map(([a, b]) => '<div><kbd>' + a + '</kbd><span>' + b + '</span></div>').join('') + '</div>';
        }
        else if (name === 'clear') {
            body.innerHTML = '<p>清空双方野战部队并返回「自由布阵」。可以从已保存的布阵恢复。</p><div class="dialog-actions">' + action('close', '取消') + action('erase', '清空全场') + '</div>';
        }
        else {
            const w = this.world;
            body.innerHTML = (name === 'victory' ? '<div class="victory-flags">'+flagImage(0,w.winner!==0).outerHTML+flagImage(1,w.winner!==1).outerHTML+'</div><h2>'+(w.winner===0?'赤棘主堡沦为焦土，铁冠屠城大胜！':'铁冠主堡陷落，全军惨遭血洗！')+'</h2>' : '') + '<div class="report-totals">' + [['累计击杀', w.dead[0] + w.dead[1]],['屠农',w.realms[0].farmersKilled+w.realms[1].farmersKilled], ['击飞人次', w.launches[0] + w.launches[1]], ['断桥', w.bridges], ['建筑拆毁', w.buildings]].map(([l, n]) => '<div><b>' + num(Number(n)) + '</b>' + l + '</div>').join('') + '</div><div class="report-grid">' + ([0, 1] as const).map(f => { const max = Math.max(1, ...KINDS.map(k => w.stats[f][k].damage)), maxKills = Math.max(1, ...KINDS.map(k => w.stats[f][k].kills)); return '<section class="side-' + f + '"><h3>' + SIDES[f] + '</h3><small>兵种　　击杀 / 输出伤害</small>' + KINDS.map((k, i) => { const stat = w.stats[f][k]; return '<div class="report-row"><label>' + UNITS[k].name + '</label><span>' + num(stat.kills) + ' / ' + num(stat.damage) + '</span><i style="width:' + stat.damage / max * 100 + '%"></i><i class="kills" style="width:' + stat.kills / maxKills * 100 + '%"></i></div>'; }).join('') + '</section>'; }).join('') + '</div><div class="dialog-actions">' + action('restore', '恢复布阵') + action('close', '返回战场') + '</div>';
        }
        modal.querySelector<HTMLElement>('button')?.focus();
    }
}
