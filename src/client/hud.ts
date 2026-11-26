import { portrait } from './portraits';
import { banner } from './banners';
import { KINDS, strength, UNITS } from '../sim/config';
import { MAPS } from '../sim/maps';
import type { Faction, Kind, Mode } from '../sim/types';
export const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const button = (id: string, label: string) => '<button id="' + id + '">' + label + '</button>';
function flag(f: Faction, w: number, h: number) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    c.drawImage(banner(f), 5, 3, 40, 28, 0, 0, w, h);
    return canvas;
}
export function mount() {
    el('app').innerHTML = `<main id="cover"><div class="folio">
    <header><b>战役图册　·　一八一五</b><span>ÉDITION VI　/　6.0</span></header>
    <div class="painting"><img id="art" alt="英法两军在星堡前列阵齐射" width="640" height="360">
    <div class="title"><small>CAMPAGNE DE BELGIQUE　/　JUIN 1815</small><h1>拿破仑 1815</h1><strong>精品像素线列</strong></div></div>
    <section class="parchment"><div class="campaign"><h2>选择阵营</h2><div id="nations"></div></div>
    <div class="setup"><label>战场地图<select id="maps">${Object.entries(MAPS).map(([v, n]) => '<option value="' + v + '">' + n + '</option>').join('')}</select></label>
    <label>对手难度<select id="difficulty"><option value="easy">新兵</option><option value="normal" selected>老兵</option><option value="brutal">近卫</option></select></label></div>
    <div class="starts">${button('lord', '⚔　领主对抗') + button('sandbox', '自由沙盒')}</div><div id="loadError" role="alert" hidden></div>
    </section></div></main>
    <main id="battle" hidden><canvas id="world" aria-label="战场"></canvas>
    <div id="top"><b id="forces"><span id="fr"></span><span id="gb"></span></b><span id="resources"></span>${button('menu', '☰ 菜单')}</div>
    <aside id="settings" hidden>${button('pause', '暂停') + button('speed', '1×') + button('music', '军歌 开') + button('sound', '音效 开') + button('gore', '炼狱血海') + button('side', '切换阵营') + button('save', '保存布阵') + button('restore', '恢复布阵') + button('back', '返回封面')}
    <small>点己方士兵选连，再点地面行军，点城墙或桥面驻防。右键或单指拖动，滚轮或双指缩放。</small></aside>
    <aside id="detail" hidden><div id="unitInfo"></div><div id="forms"></div></aside>
    <canvas id="mini" aria-label="战术地图，点击定位"></canvas>
    <div id="orders"><small id="phase"></small>${button('charge', '⚔ 全军冲锋') + button('recall', '🛡 撤回星堡') + button('rampart', '🏰 高台驻防')}</div>
    <div id="notice" role="status"></div><section id="dock" aria-label="征募连队"><div id="cards"></div></section></main>`;
    for (const f of [1, 0] as const) {
        const b = document.createElement('button');
        b.id = 'nation' + f;
        b.className = 'nation';
        b.setAttribute('aria-pressed', String(f === 1));
        b.innerHTML = '<span><b>' + (f ? '大不列颠王国' : '法兰西第一帝国') + '</b><small>' + (f ? '威灵顿 · 红衫军' : '拿破仑 · 蓝衫军') + '</small></span><i>✓</i>';
        b.prepend(flag(f, 42, 30));
        el('nations').append(b);
        const score = document.createElement('span');
        score.id = 'score' + f;
        el(f ? 'gb' : 'fr').append(flag(f, 22, 15), score);
    }
}
export function roster(f: Faction, mode: Mode, choose: (k: Kind) => void) {
    const cards = el('cards');
    cards.replaceChildren();
    for (const k of KINDS) {
        const b = document.createElement('button');
        b.dataset.kind = k;
        b.setAttribute('aria-pressed', 'false');
        b.title = (mode === 'sandbox' ? '选择投放' : '招募') + UNITS[k].name;
        const name = document.createElement('b');
        name.textContent = UNITS[k].short;
        const qty = k === 'field_cannon' ? '1 门 · 3 炮手' : strength[k] + (k === 'cuirassier' ? ' 骑' : ' 人');
        const price = document.createElement('small');
        price.textContent = mode === 'lord' ? qty + ' · ' + UNITS[k].gold : qty;
        b.append(portrait(k, f), name, price);
        b.onclick = () => choose(k);
        cards.append(b);
    }
}
