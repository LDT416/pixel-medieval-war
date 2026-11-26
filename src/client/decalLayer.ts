import { WIDTH, HEIGHT } from '../sim/maps';
import type { Faction, Kind, SimEvent } from '../sim/types';
import { banner } from './banners';

export type Mark = [number, number, number, number, string];
type RemnantType = 'corpse' | 'gibs' | 'crater' | 'blood' | 'flag' | 'rubble';

interface Remnant {
    kind: RemnantType;
    x: number;
    y: number;
    born: number;
    ttl: number;
    faction: Faction;
    unitKind: Kind;
    variant: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
}

const TTL_60S = 1800; // 60 秒（30 TPS × 60 = 1800 ticks）后平滑淡出并消失！
const FADE_TICKS = 240; // 最后 8 秒渐变消散
const MAX_REMNANTS = 960;
const corpseCache = new Map<string, HTMLCanvasElement>();

function bakeCorpse(kind: Kind, f: Faction, variant: number): HTMLCanvasElement {
    const key = `${kind}/${f}/${variant}`;
    const hit = corpseCache.get(key);
    if (hit) return hit;
    const mounted = kind === 'cuirassier';
    const art = document.createElement('canvas');
    art.width = mounted ? 38 : 28;
    art.height = mounted ? 22 : 18;
    const c = art.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    const ink = '#25282b', ivory = '#e5ddc6', boot = '#34302d', skin = '#e2af82', walnut = '#70503a', steel = '#adb9bc', gilt = '#f2cc73';
    const [dark, coat, edge] = f ? ['#68232d', '#b93a37', '#df5e47'] : ['#203857', '#356294', '#5f84a8'];
    const cx = Math.floor(art.width / 2), cy = Math.floor(art.height / 2);

    // 倒地身下的暗红小血泊（克制真实，不遮盖精致像素尸体！）
    c.fillStyle = '#4a0b12cc';
    c.fillRect(cx - 8, cy - 3, 16, 7);
    c.fillStyle = '#7b111bcc';
    c.fillRect(cx - 5, cy - 2, 10, 5);

    c.save();
    c.translate(cx, cy);
    if (variant & 1) c.scale(-1, 1);
    const tilt = variant < 2 ? 0 : 1;

    if (mounted) {
        // 倒地战马剪影 + 倒地银甲胸甲骑兵
        const horseDark = f ? '#4c2d1e' : '#3a2419', horseMid = f ? '#7b4d31' : '#5e3e2c';
        c.fillStyle = ink; c.fillRect(-15, -5, 19, 10);
        c.fillStyle = horseDark; c.fillRect(-14, -4, 17, 8);
        c.fillStyle = horseMid; c.fillRect(-13, -3, 14, 5);
        c.fillStyle = coat; c.fillRect(-8, -4, 7, 5);
        c.fillStyle = gilt; c.fillRect(-8, 0, 7, 1);
        // 骑兵倒在马旁（亮银胸甲 + 掉落钢盔与长弯刀）
        c.fillStyle = ink; c.fillRect(1, -2 + tilt, 13, 6);
        c.fillStyle = ivory; c.fillRect(2, -1 + tilt, 4, 4);
        c.fillStyle = boot; c.fillRect(0, 0 + tilt, 3, 3);
        c.fillStyle = steel; c.fillRect(6, -1 + tilt, 5, 4);
        c.fillStyle = '#edf0dd'; c.fillRect(7, -1 + tilt, 3, 2);
        c.fillStyle = skin; c.fillRect(11, 0 + tilt, 3, 3);
        // 滚落的钢盔与马刀
        c.fillStyle = steel; c.fillRect(14, -4, 4, 3);
        c.fillStyle = gilt; c.fillRect(15, -5, 2, 1);
        c.fillStyle = steel; c.fillRect(4, 5, 11, 1);
        c.fillStyle = gilt; c.fillRect(3, 4, 2, 2);
    } else {
        // 精雕倒地线列步兵 / 近卫掷弹兵尸体（带完整 ink 描边、阵营上衣、白背带、白裤黑靴、掉落军帽与步枪！）
        c.fillStyle = ink;
        c.fillRect(-10, -3 + tilt, 19, 7);
        // 黑靴 + 白裤
        c.fillStyle = boot; c.fillRect(-10, -2 + tilt, 3, 2); c.fillRect(-10, 1 + tilt, 3, 2);
        c.fillStyle = '#b4ad9c'; c.fillRect(-7, -2 + tilt, 5, 2);
        c.fillStyle = ivory; c.fillRect(-7, 1 + tilt, 5, 2);
        // 蓝/红军服上衣 + 交叉白背带
        c.fillStyle = dark; c.fillRect(-2, -2 + tilt, 7, 5);
        c.fillStyle = coat; c.fillRect(-2, -2 + tilt, 6, 4);
        c.fillStyle = edge; c.fillRect(-1, -2 + tilt, 4, 1);
        c.fillStyle = ivory; c.fillRect(-2, 0 + tilt, 6, 1);
        c.fillRect(0, -2 + tilt, 1, 4);
        // 头与脸
        c.fillStyle = skin; c.fillRect(5, -1 + tilt, 3, 3);
        // 滚落的军帽 / 熊皮帽
        if (kind === 'guard_grenadier') {
            c.fillStyle = ink; c.fillRect(9, -4, 4, 6);
            c.fillStyle = '#484542'; c.fillRect(10, -3, 2, 4);
            c.fillStyle = gilt; c.fillRect(9, 1, 2, 1);
        } else {
            c.fillStyle = ink; c.fillRect(9, -3, 4, 4);
            c.fillStyle = '#49474d'; c.fillRect(10, -3, 2, 2);
            c.fillStyle = gilt; c.fillRect(10, -1, 1, 1);
        }
        // 掉落在身旁的步枪与亮银刺刀
        c.fillStyle = walnut; c.fillRect(-4, 4, 9, 2);
        c.fillStyle = steel; c.fillRect(4, 4, 7, 1);
        c.fillStyle = '#edf0dd'; c.fillRect(9, 4, 3, 1);
    }
    c.restore();
    corpseCache.set(key, art);
    return art;
}

export class DecalLayer {
    canvas = document.createElement('canvas');
    ctx: CanvasRenderingContext2D;
    composite?: CanvasRenderingContext2D;
    marks: Mark[] = [];
    inferno = true;
    private items: Remnant[] = [];
    private currentTick = 0;

    constructor() {
        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
    }

    setTick(tick: number) {
        this.currentTick = tick;
        if (this.items.length === 0) return;
        let write = 0;
        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            if (tick - it.born < it.ttl)
                this.items[write++] = it;
        }
        this.items.length = write;
    }

    clear() {
        this.marks = [];
        this.items = [];
        this.composite = undefined;
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    }

    restore(_marks: Mark[]) {
        this.clear();
    }

    private h(x: number, y: number, salt: number) {
        let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt, 1442695041)) | 0;
        n = (n ^ (n >>> 13)) * 1274126177;
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    }

    private push(item: Remnant) {
        if (this.items.length >= MAX_REMNANTS)
            this.items.shift();
        this.items.push(item);
    }

    stamp(x: number, y: number, size: number, color: string, _h = size) {
        this.push({
            kind: 'blood', x: Math.round(x), y: Math.round(y),
            born: this.currentTick, ttl: TTL_60S,
            faction: 0, unitKind: 'line_infantry', variant: 0,
            dx: 0, dy: 0, size: Math.max(2, Math.round(size)), color
        });
    }

    stampGib(x: number, y: number, size: number, color: string, _bloody = true) {
        this.push({
            kind: 'blood', x: Math.round(x), y: Math.round(y),
            born: this.currentTick, ttl: TTL_60S,
            faction: 0, unitKind: 'line_infantry', variant: 1,
            dx: 0, dy: 0, size: Math.max(3, Math.round(size)), color
        });
    }

    fallen(x: number, y: number, f: Faction) {
        this.push({
            kind: 'flag', x: Math.round(x), y: Math.round(y),
            born: this.currentTick, ttl: TTL_60S,
            faction: f, unitKind: 'bannerman', variant: 0,
            dx: 0, dy: 0, size: 1, color: ''
        });
    }

    event(e: SimEvent) {
        if (e.type === 'death') {
            const v = Math.floor(this.h(e.x, e.y, 17) * 4);
            this.push({
                kind: e.explosive ? 'gibs' : 'corpse',
                x: Math.round(e.x), y: Math.round(e.y),
                born: this.currentTick, ttl: TTL_60S,
                faction: e.faction ?? 0,
                unitKind: e.kind ?? 'line_infantry',
                variant: v,
                dx: e.dx ?? 1, dy: e.dy ?? 0,
                size: this.inferno ? 1.15 : 1,
                color: ''
            });
        } else if (e.type === 'impact') {
            this.push({
                kind: 'crater', x: Math.round(e.x), y: Math.round(e.y),
                born: this.currentTick, ttl: TTL_60S,
                faction: 0, unitKind: 'field_cannon', variant: Math.floor(this.h(e.x, e.y, 31) * 4),
                dx: e.dx ?? 0, dy: e.dy ?? 0,
                size: (e.power ?? 5) > 4 ? 1.15 : .8,
                color: ''
            });
        } else if (e.type === 'collapse' && e.structure) {
            const s = e.structure;
            this.push({
                kind: 'rubble', x: Math.round(s.x), y: Math.round(s.y),
                born: this.currentTick, ttl: TTL_60S * 3,
                faction: 0, unitKind: 'field_cannon', variant: s.type === 'tree' ? 1 : 0,
                dx: s.w, dy: s.h, size: 1, color: ''
            });
        }
    }

    draw(c: CanvasRenderingContext2D, bounds: { x: number; y: number; w: number; h: number }, tick: number) {
        this.setTick(tick);
        if (this.items.length === 0) return;
        const left = bounds.x - 60, right = bounds.x + bounds.w + 60;
        const top = bounds.y - 60, bottom = bounds.y + bounds.h + 60;
        c.imageSmoothingEnabled = false;

        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            if (it.x < left || it.x > right || it.y < top || it.y > bottom)
                continue;
            const rem = it.ttl - (tick - it.born);
            if (rem <= 0) continue;
            const alpha = rem < FADE_TICKS ? rem / FADE_TICKS : 1;
            if (alpha < 1) c.globalAlpha = alpha;

            if (it.kind === 'corpse') {
                // 普通击杀：精致倒地像素士兵尸体！
                const sprite = bakeCorpse(it.unitKind, it.faction, it.variant);
                c.drawImage(sprite, Math.round(it.x - sprite.width * .62), Math.round(it.y - sprite.height * .62), Math.round(sprite.width * 1.25), Math.round(sprite.height * 1.25));
            } else if (it.kind === 'gibs') {
                // 炮弹/手榴弹直击炸裂：四散血肉块 + 碎布白骨 + 浓稠血渍！
                const cloth = it.faction === 1 ? '#a82226' : '#264d91';
                const s = it.size;
                c.fillStyle = '#470910';
                c.fillRect(it.x - Math.round(13 * s), it.y - Math.round(6 * s), Math.round(26 * s), Math.round(12 * s));
                c.fillStyle = '#7e0f19';
                c.fillRect(it.x - Math.round(9 * s), it.y - Math.round(4 * s), Math.round(18 * s), Math.round(8 * s));
                // 7 块清晰可见的炮击血肉块与白骨碎衣
                for (let k = 0; k < 7; k++) {
                    const ang = this.h(it.x, it.y, 40 + k) * Math.PI * 2;
                    const dist = 4 + this.h(it.x, it.y, 60 + k) * 18 * s;
                    const gx = Math.round(it.x + Math.cos(ang) * dist);
                    const gy = Math.round(it.y + Math.sin(ang) * dist * .6);
                    c.fillStyle = '#3c070d';
                    c.fillRect(gx - 1, gy, 6, 4);
                    c.fillStyle = k === 0 ? '#e3d5ba' : k === 1 ? cloth : k % 2 ? '#b41b28' : '#7b0e17';
                    c.fillRect(gx, gy - 1, 4 + (k % 2), 3 + (k % 2));
                    if (k % 2 === 1) {
                        c.fillStyle = '#db4348';
                        c.fillRect(gx + 1, gy - 1, 2, 1);
                    }
                }
            } else if (it.kind === 'crater') {
                const s = it.size;
                c.fillStyle = '#3b3226';
                c.fillRect(Math.round(it.x - 19 * s), Math.round(it.y - 8 * s), Math.round(38 * s), Math.round(16 * s));
                c.fillStyle = '#25211c';
                c.fillRect(Math.round(it.x - 13 * s), Math.round(it.y - 6 * s), Math.round(26 * s), Math.round(12 * s));
                c.fillStyle = '#151311';
                c.fillRect(Math.round(it.x - 7 * s), Math.round(it.y - 3 * s), Math.round(14 * s), Math.round(6 * s));
                c.fillStyle = '#993b1a';
                c.fillRect(it.x - 3, it.y - 1, 4, 2);
            } else if (it.kind === 'blood') {
                if (it.variant === 1) {
                    c.fillStyle = '#5c0b13';
                    c.fillRect(it.x - 1, it.y, it.size + 2, Math.max(2, it.size - 1));
                }
                c.fillStyle = it.color;
                c.fillRect(it.x, it.y, it.size, Math.max(2, it.size - 1));
            } else if (it.kind === 'flag') {
                c.save();
                c.translate(it.x, it.y);
                c.rotate(it.faction ? -.98 : 1.04);
                c.drawImage(banner(it.faction, 2), -3, -49, 36, 50);
                c.restore();
            } else if (it.kind === 'rubble') {
                if (it.variant === 1) {
                    c.fillStyle = '#382f23'; c.fillRect(it.x - 5, it.y, 12, 7);
                    c.fillStyle = '#726047'; c.fillRect(it.x - 3, it.y - 2, 8, 5);
                } else {
                    for (let k = 0; k < 24; k++) {
                        c.fillStyle = ['#32312c', '#4a473e', '#5d574a'][k % 3];
                        c.fillRect(Math.round(it.x + (this.h(it.x, k, 1) - .5) * it.dx * .7), Math.round(it.y + (this.h(it.y, k, 2) - .5) * it.dy * .6), 7, 5);
                    }
                }
            }
            if (alpha < 1) c.globalAlpha = 1;
        }
    }
}
