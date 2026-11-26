import { drawStructure } from './scenery';
import { sprite } from './spriteBaker';
import { banner } from './banners';
import type { Faction, Kind, StructureType } from '../sim/types';
export function coverArt(canvas: HTMLCanvasElement) {
    canvas.width = 640;
    canvas.height = 252;
    const layer = document.createElement('canvas');
    layer.width = 640;
    layer.height = 252;
    const g = layer.getContext('2d')!, c = canvas.getContext('2d')!;
    g.imageSmoothingEnabled = c.imageSmoothingEnabled = false;
    let seed = 19373;
    const rand = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
    function dot(color: string, x: number, y: number, w = 1, h = 1) { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); }
    function ridge(base: number, amp: number, color: string, phase: number) {
        for (let x = 0; x < 640; x++) {
            const y = Math.round(base + amp * (Math.sin(x * .014 + phase) + .5 * Math.sin(x * .042 + phase) + .17 * Math.sin(x * .09)));
            dot(color, x, y, 1, 252 - y);
        }
    }
    const sky = ['#7ba9b5', '#92bbc0', '#a7cbca', '#b9d3cb', '#cbdac7', '#d9dfc7', '#e6dfbd', '#efdbaf'];
    for (let y = 0; y < 164; y++) {
        const band = Math.min(7, Math.floor(y / 20));
        dot(sky[band], 0, y, 640, 1);
        for (let x = 0; x < 640; x += 3)
            if (rand() < (y % 20) / 30)
                dot(sky[Math.min(7, band + 1)], x, y, 3, 1);
    }
    for (let y = -28; y <= 28; y++) {
        const r = Math.floor(Math.sqrt(784 - y * y));
        dot('#fff0bb', 316 - r, 57 + y, r * 2, 1);
    }
    for (let i = 0; i < 60; i++) {
        const x = rand() * 640, y = 12 + rand() * 94, n = 9 + rand() * 45;
        for (let j = 0; j < n; j++) {
            const h = Math.round(Math.sin(j / n * Math.PI) * 3 * (1 + Math.sin(j * .32) ** 2));
            dot('#e6e6d0', x + j, y - h, 1, h + 1);
        }
    }
    ridge(123, 12, '#9cafac', 2);
    ridge(138, 12, '#869c93', .4);
    ridge(147, 15, '#708a7c', 4);
    for (let i = 0; i < 390; i++) {
        const x = rand() * 640, y = 149 + rand() * 17;
        dot('#607c67', x, y - 5, 2, 7);
        dot('#76917a', x + 1, y - 7, 1, 9);
    }
    ridge(166, 6, '#899454', 1);
    ridge(178, 8, '#aca25f', .1);
    ridge(192, 6, '#9d874f', 3);
    ridge(217, 4, '#756c44', 4);
    for (let i = 0; i < 4800; i++) {
        const x = rand() * 640, y = 177 + rand() * 77;
        dot(['#d0b77a', '#9e9458', '#596340', '#ac9f64'][i % 4], x, y, 1 + Math.floor(rand() * 5));
    }
    function stone(type: StructureType, f: Faction, x: number, y: number, w: number, h: number) { drawStructure(g, { type, faction: f, id: f + 1, x, y, w, h, hp: 100, maxHp: 100 }, 0, false); }
    for (const f of [0, 1] as const) {
        const at = (x: number) => f ? 640 - x : x;
        stone('keep', f, at(101), 141, 120, 94);
        stone('tower', f, at(43), 157, 39, 74);
        stone('tower', f, at(160), 156, 35, 55);
        for (let i = 0; i < 4; i++)
            stone('wall', f, at(22 + 35 * i), 167, 37, 21);
    }
    function soldier(k: Kind, f: Faction, x: number, y: number, scale: number) {
        const a = sprite(k, f);
        g.save();
        g.translate(Math.round(x), Math.round(y));
        g.scale(f ? -1 : 1, 1);
        g.drawImage(a, -Math.floor(a.width * scale / 2), -a.height * scale, a.width * scale, a.height * scale);
        g.restore();
    }
    for (let row = 0; row < 4; row++)
        for (let i = 0; i < 17; i++)
            for (const f of [0, 1] as const) {
                const x = 8 + i * 12 + row * 8, y = 177 + row * 8 + i * .73;
                soldier(row === 3 ? (i % 3 === 0 ? 'plate_knight' : f ? 'halberdier' : 'guard_grenadier') : 'musketeer', f, f ? 640 - x : x, y, 1 + Number(row === 3));
            }
    soldier('davinci_tank', 0, 268, 179, 2);
    soldier('field_cannon', 1, 372, 191, 2);
    for (let n = 0; n < 2; n++)
        for (let i = 0; i < 9; i++)
            soldier(n ? 'halberdier' : 'guard_grenadier', n as Faction, n ? 640 - i * 15 : i * 15, 252 - i * .6, 3);
    for (const f of [0, 1] as const)
        g.drawImage(banner(f), f ? 591 : 22, 156, 35, 55);
    return (time: number) => {
        c.drawImage(layer, 0, 0);
        for (const f of [0, 1] as const)
            c.drawImage(banner(f, Math.floor(time / 150)), f ? 539 : 101, 3, 43, 62);
        for (let i = 0; i < 45; i++) {
            const phase = (time / 1100 + i * .41) % 3, side = i % 2 ? -1 : 1, x = 320 + side * (69 + i % 7 * 4 - phase * 8), y = 192 + i % 9 - phase * 8;
            c.fillStyle = i % 3 ? '#fcf3da' : '#d6d9c6';
            c.globalAlpha = (1 - phase / 3) * .58;
            c.fillRect(Math.round(x), Math.round(y), 4 + phase * 3, 2 + phase * 2);
        }
        c.globalAlpha = 1;
    };
}
