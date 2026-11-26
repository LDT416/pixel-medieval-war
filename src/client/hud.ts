import { portrait } from './portraits';
import { banner } from './banners';
import { KINDS, UNITS } from '../sim/config';
import type { Faction, Kind } from '../sim/types';
export const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const categories = ['步兵', '火枪', '骑兵', '重炮机械', '仪仗'];
const btn = (id: string, label: string) => '<button id="' + id + '">' + label + '</button>';
export function mount() {
    el('app').innerHTML = `<main id="cover">
        <div class="folio">
        <header><b>⚜　千军战记</b><span>GOTHIC RENAISSANCE　 /　 v4.0</span>
        </header>
        <div class="painting">
        <canvas id="art" aria-label="日照下英法要塞与火枪军团对峙的像素画"></canvas>
        <div class="title"><small>ANGLO-FRENCH LINE &amp; GOTHIC SIEGE</small><h1>血战千军</h1><strong>─　哥特文艺复兴　─</strong></div></div>
        <section class="parchment">
        <div class="campaign"><h2>选择阵营</h2>
        <div id="nations"></div></div>
        <div class="setup">
        <label>战场地图<select id="maps">
        <option value="darkwood">幽暗密林古道</option>
        <option value="gorge">铁血大草原</option>
        <option value="twin">双桥血河与林谷</option></select></label>
        <label>领主难度<select id="difficulty">
        <option value="easy">新兵领主（简单）</option>
        <option value="normal" selected>铁血公爵（普通 · 推荐）</option>
        <option value="brutal">战争暴君（残酷）</option></select></label></div>
        <div class="starts">
            ${btn('lord', '⚔　开始领主征战') + btn('sandbox', '⚗　自由沙盒演武')}</div>
        </section></div>
        </main>
        <main id="battle" hidden>
        <canvas id="world"></canvas>
        <div id="top"><b id="forces"><span id="fr"></span><span id="gb"></span></b><span id="resources"></span>
            ${btn('policy', '自动平衡') + btn('menu', '☰ 菜单')}</div>
        <aside id="settings" hidden>
            ${btn('music', '军歌 开') + btn('sound', '音效 开') + btn('gore', '🩸 炼狱血海') + btn('pause', '暂停') + btn('speed', '1×') + btn('side', '切换布阵方') + btn('place', '沙盒放置') + btn('save', '保存布阵') + btn('restore', '恢复布阵') + btn('workshop', '建军事工坊') + btn('bridge', '架浮桥') + btn('stakes', '筑拒马') + btn('back', '返回封面')}</aside>
        <canvas id="mini"></canvas>
        <div id="orders">
            ${btn('charge', '⚔ 全军冲锋')}<small id="phase"></small>
            ${btn('recall', '🛡 全军回守') + btn('group', '⚑ 选团')}</div>
        <div id="notice" role="status"></div>
        <section id="dock">
        <div id="cards" hidden></div>
        <nav>
            ${btn('hire', '＋ 农夫') + btn('cottage', '⌂ 升农舍') + categories.map((x, i) => btn("cat" + i, x)).join('')}</nav>
        </section>
        </main>`;
    for (const f of [0, 1] as const) {
        const flag = document.createElement('canvas');
        flag.width = 22;
        flag.height = 15;
        flag.getContext('2d')!.drawImage(banner(f), 5, 4, 40, 28, 0, 0, 22, 15);
        const value = document.createElement('span');
        value.id = 'score' + f;
        el(f ? 'gb' : 'fr').append(flag, value);
    }
    for (const f of [1, 0] as const) {
        const b = document.createElement('button');
        b.id = 'nation' + f;
        b.className = 'nation';
        b.setAttribute('aria-pressed', String(f === 1));
        b.innerHTML = '<span><b>' + (f ? '英格兰王国' : '法兰西王国') + '</b><small>' + (f ? '红衫军 · 大不列颠掷弹兵' : '蓝衫军 · 洋葱之歌') + '</small></span><i>✓</i>';
        const flag = document.createElement('canvas');
        flag.width = 42;
        flag.height = 30;
        flag.getContext('2d')!.drawImage(banner(f), 5, 3, 41, 31, 0, 0, 42, 30);
        b.prepend(flag);
        el('nations').append(b);
    }
}
export function roster(category: string, f: Faction, auto: Set<Kind>, recruit: (k: Kind) => void, repeat: (k: Kind) => void) {
    const panel = el('cards');
    panel.replaceChildren();
    if (category === '重炮机械') {
        const w = document.createElement('button');
        w.id = 'quick-workshop';
        w.title = '一键在要塞腹地自动建造军事工坊（解锁重炮与达芬奇战车）';
        w.innerHTML = '<div style="width:48px;height:48px;display:grid;place-items:center;font-size:24px;background:#26292e;border:1px solid #91774a;color:#e5c57e">⚙</div><span>建军事工坊</span><small>解锁重炮机械</small>';
        w.onclick = () => el('workshop').click();
        panel.append(w);
    }
    for (const k of KINDS.filter(k => UNITS[k].role === category)) {
        const b = document.createElement('button');
        b.dataset.kind = k;
        b.title = '点击征召，长按切换持续产兵';
        b.append(portrait(k, f));
        const label = document.createElement('span');
        label.innerText = UNITS[k].name;
        b.append(label);
        const cost = document.createElement('small');
        cost.innerText = auto.has(k) ? '↻ 持续征召' : '粮 ' + UNITS[k].gold + ' · 木 ' + UNITS[k].wood;
        b.append(cost);
        let timer = 0, held = false;
        b.onpointerdown = e => { b.setPointerCapture(e.pointerId); held = false; timer = window.setTimeout(() => { held = true; repeat(k); cost.innerText = auto.has(k) ? '↻ 持续征召' : '粮 ' + UNITS[k].gold + ' · 木 ' + UNITS[k].wood; }, 480); };
        b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => clearTimeout(timer);
        b.onclick = () => { if (!held)
            recruit(k); held = false; };
        panel.append(b);
    }
}
