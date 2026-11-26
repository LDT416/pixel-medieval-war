import {banner} from './banners';
import type { Structure } from '../sim/types';
// High-contrast masonry, timber and conifers painted at native pixel resolution.
// The ground renderer supplies the projection; sprites sit on their world footprints.
const basalt = ['#404445', '#4c5050', '#535653', '#5d605b', '#67695f', '#77776b'];
const timber = ['#493a2c', '#594532', '#6e5339', '#876641', '#997952', '#ae8960'];
const outline = '#202526', mortar = '#393d3c', light = '#909084';
const atlas = new Map<string, HTMLCanvasElement>();
function noise(a: number, b: number, c: number) {
    let n = Math.imul(a + 89, 15485863) ^ Math.imul(b + 167, 32452843) ^ Math.imul(c + 19, 49979687);
    n = Math.imul(n ^ (n >>> 15), 0x85ebca6b);
    return (n ^ (n >>> 13)) >>> 0;
}
function makeScenery(type: Structure['type'], faction: number, variant: number, aspect: number): HTMLCanvasElement {
    let W = 64, H = 60;
    switch (type) {
        case 'keep':
            W = 140;
            H = 118;
            break;
        case 'tower':
        case 'outpost':
            W = 42;
            H = 58;
            break;
        case 'tree':
            W = 30;
            H = 38;
            break;
        case 'house':
            W = 41;
            H = 38;
            break;
        case 'bridge':
        case 'pontoon':
            W = Math.max(24, Math.min(256, Math.round(34 * aspect)));
            H = 42;
            break;
        case 'wall':
        case 'lowwall':
        case 'palisade':
            W = Math.max(19, Math.min(180, Math.round(23 * aspect)));
            H = 30;
            break;
        case 'gate':
            W = 52;
            H = 46;
            break;
    }
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d')!;
    const dot = (c: string, x: number, y: number, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const line = (c: string, x: number, y: number, X: number, Y: number, thick = 1) => {
        const n = Math.max(Math.abs(X - x), Math.abs(Y - y), 1);
        for (let i = 0; i <= n; i++)
            dot(c, x + (X - x) * i / n, y + (Y - y) * i / n, thick, thick);
    };
    function poly(c: string, ...p: number[]) {
        const ys = p.filter((_, i) => i % 2);
        for (let y = Math.floor(Math.min(...ys)); y < Math.max(...ys); y++) {
            const cuts: number[] = [];
            for (let i = 0; i < p.length; i += 2) {
                const j = (i + 2) % p.length, a = p[i + 1], b = p[j + 1];
                if ((a <= y + .5 && b > y + .5) || (b <= y + .5 && a > y + .5))
                    cuts.push(p[i] + (y + .5 - a) * (p[j] - p[i]) / (b - a));
            }
            cuts.sort((a, b) => a - b);
            for (let i = 0; i < cuts.length - 1; i += 2)
                dot(c, Math.ceil(cuts[i]), y, Math.ceil(cuts[i + 1]) - Math.ceil(cuts[i]));
        }
    }
    function bricks(x: number, y: number, w: number, h: number, dark = false, unit = 6) {
        dot(mortar, x, y, w, h);
        for (let row = 0; row * 3 < h; row++) {
            for (let col = -1; col * unit < w; col++) {
                const left = x + col * unit + (row % 2) * Math.floor(unit / 2);
                const begin = Math.max(x, left), end = Math.min(x + w, left + unit - 1);
                if (end <= begin)
                    continue;
                const rand = noise(col, row, variant + x + y);
                dot(basalt[dark ? rand % 3 : 1 + rand % 4], begin, y + row * 3, end - begin, Math.min(2, h - row * 3));
                if (!dark && rand % 5 === 0)
                    dot(basalt[5], begin, y + row * 3, Math.min(3, end - begin));
            }
        }
    }
    const banner = faction === 0 ? '#356c9a' : '#a1473b', bannerLight = faction === 0 ? '#8baab4' : '#d2a274', bannerDark = faction === 0 ? '#213e51' : '#663232';
    function hanging(x: number, y: number, w: number, h: number) {
        poly(outline, x - 1, y - 1, x + w + 1, y - 1, x + w + 1, y + h - 3, x + w / 2, y + h + 1, x - 1, y + h - 2);
        poly(banner, x, y, x + w, y, x + w, y + h - 4, x + w / 2, y + h - 1, x, y + h - 3);
        dot(bannerDark, x + w - 2, y, 2, h - 3);
        dot(bannerLight, x + 1, y, 1, h - 4);
        dot('#d0b379', x - 2, y - 1, w + 4);
        dot('#c5b789', x + Math.floor(w / 2), y + 3, 1, 5);
        dot('#c5b789', x + Math.floor(w / 2) - 1, y + 4, 3);
    }
    function windows(x: number, y: number, count: number, gap: number, height = 8) {
        for (let i = 0; i < count; i++) {
            const X = x + i * gap;
            dot(basalt[5], X + 2, y - 1, 2);
            dot('#848679', X + 1, y, 4, 2);
            dot(outline, X + 1, y + 2, 4, height - 2);
            dot('#151c1e', X + 2, y + 1, 2, height - 1);
            dot('#696b60', X + 5, y + 2, 1, height - 2);
            dot(light, X, y + height, 6);
            if (height > 7)
                dot('#a37f43', X + 2, y + 5, 1, 2);
        }
    }
    function crenels(x: number, y: number, w: number, step = 6) {
        dot(outline, x, y + 4, w, 3);
        dot('#797c72', x, y + 3, w, 2);
        dot('#a0a094', x, y + 3, w);
        for (let i = 0; i < w; i += step) {
            const sw = Math.min(step - 2, w - i);
            dot(outline, x + i, y, sw + 1, 4);
            dot(basalt[4], x + i, y, sw, 3);
            dot(light, x + i, y, sw);
            dot(basalt[5], x + i, y, 1, 3);
        }
    }
    function slate(x: number, y: number, w: number, h: number) {
        const top = x + Math.floor(w * .42);
        poly(outline, x - 2, y + h, top, y - 2, top + Math.floor(w * .20), y - 2, x + w + 2, y + h, x + w + 2, y + h + 3, x - 2, y + h + 3);
        poly('#48535b', x, y + h, top, y, top + Math.floor(w * .20), y, x + w, y + h);
        poly('#2f3942', top + Math.floor(w * .20), y, x + w, y + h, x + w * .49, y + h);
        for (let j = 3; j < h; j += 3) {
            const l = top - (top - x) * (j / h), r = top + w * .20 + (x + w - top - w * .20) * (j / h);
            dot('#39434b', Math.ceil(l), y + j, r - l);
            for (let k = l + 1 + (j % 2) * 2; k < r - 2; k += 5)
                dot(k < x + w * .51 ? '#707b7b' : '#465258', k, y + j - 1, 2);
        }
        line('#87918b', top, y, x, y + h);
        dot('#727870', top, y - 1, w * .20);
        dot('#77796a', x - 2, y + h, w + 4);
        dot(outline, x - 2, y + h + 1, w + 4);
    }
    function turret(x: number, y: number, w: number, h: number, capped = false) {
        dot(outline, x - 1, y, w + 2, h);
        bricks(x, y, w, h);
        bricks(x + w - 4, y, 4, h, true);
        dot('#76796f', x, y, 1, h - 1);
        dot(mortar, x - 1, y + h - 4, w + 2, 2);
        dot(basalt[5], x - 1, y + h - 4, w + 2);
        if (capped)
            slate(x - 2, y - Math.floor(w * .82), w + 4, Math.floor(w * .82));
        else {
            dot(outline, x - 2, y - 3, w + 4, 8);
            dot('#525953', x - 1, y - 3, w + 2, 6);
            crenels(x - 2, y - 5, w + 4);
            dot('#353d3d', x + 3, y, w - 6, 2);
            crenels(x - 2, y + 2, w + 4);
        }
        windows(x + Math.floor(w / 2) - 3, y + 12, 1, 0, h > 30 ? 8 : 5);
    }
    function portal(x: number, y: number, w: number, h: number) {
        const a = Math.floor(w / 2);
        poly('#89897a', x - 3, y + 7, x + 1, y + 1, x + a, y - 3, x + w - 1, y + 1, x + w + 3, y + 7, x + w + 3, y + h, x - 3, y + h);
        poly(outline, x - 1, y + 8, x + 2, y + 3, x + a, y - 1, x + w - 2, y + 3, x + w + 1, y + 8, x + w + 1, y + h, x - 1, y + h);
        for (let i = 0; i < w; i += 2) {
            const rise = Math.round(Math.abs(i - a) * .67);
            dot(timber[1 + i % 4], x + i, y + 1 + rise, 2, h - rise - 1);
            dot(timber[0], x + i + 1, y + 1 + rise, 1, h - rise - 1);
        }
        dot('#303334', x, y + h - 8, w, 2);
        dot('#303334', x, y + h - 3, w, 2);
        for (let i = 2; i < w; i += 4) {
            dot(light, x + i, y + h - 8);
            dot('#9b9681', x + i, y + h - 3);
        }
        dot(outline, x + a, y + 3, 1, h - 3);
        for (let i = 0; i < 5; i++) {
            const xx = x - 3 + Math.round((w + 4) * i / 4), yy = y + Math.round(Math.abs(i - 2) * 2) - 1;
            dot('#444641', xx, yy, 2, 2);
        }
    }
    if (type === 'keep') {
        // Receding ward, steep slate roofs, paired watch turrets, curtain and gatehouse.
        poly('#151c1c', 2, 96, 13, 79, 116, 80, 139, 95, 139, 108, 112, 117, 25, 114, 3, 107);
        poly('#45483d', 5, 97, 19, 81, 113, 83, 134, 96, 128, 108, 24, 111);
        turret(94, 35, 19, 46, true);
        turret(29, 39, 18, 45, true);
        dot(outline, 37, 40, 60, 55);
        bricks(38, 40, 58, 55);
        bricks(86, 40, 10, 54, true);
        slate(34, 14, 66, 30);
        for (let i = 0; i < 3; i++) {
            const x = 46 + i * 13;
            poly(outline, x, 35, x + 4, 28, x + 9, 34, x + 9, 40, x, 40);
            dot('#707777', x + 2, 35, 5, 4);
            dot('#272e31', x + 4, 35, 2, 4);
            line('#9c9c89', x, 35, x + 4, 29);
        }
        dot(light, 36, 44, 62, 2);
        windows(43, 50, 4, 12, 11);
        dot(basalt[5], 38, 66, 56, 2);
        windows(44, 72, 4, 11, 8);
        hanging(66, 48, 7, 21);
        turret(25, 56, 16, 40, true);
        turret(93, 55, 15, 40, true);
        bricks(9, 86, 121, 19);
        bricks(9, 100, 121, 5, true);
        crenels(9, 81, 121, 7);
        turret(9, 82, 18, 28);
        turret(111, 82, 18, 28);
        bricks(51, 76, 34, 33);
        bricks(82, 77, 4, 32, true);
        crenels(51, 71, 35);
        portal(59, 88, 18, 22);
        hanging(50, 86, 5, 14);
        hanging(80, 86, 5, 14);
        dot('#95958a', 57, 110, 23, 2);
        dot('#6e7065', 55, 112, 27, 2);
        for (const x of [31, 99]) {
            dot(outline, x, 86, 4, 6);
            dot('#39382a', x, 85, 3, 4);
            dot('#d2924a', x, 84, 2, 3);
            dot('#ebbd71', x + 1, 83, 1, 3);
        }
    }
    else if (type === 'tower' || type === 'outpost') {
        if (type === 'tower') {
            turret(7, 15, 28, 40);
            bricks(4, 49, 34, 7);
            dot(light, 4, 49, 34);
            dot(outline, 4, 55, 34);
            hanging(22, 28, 7, 15);
            windows(11, 35, 1, 0, 7);
        }
        else {
            for (const x of [7, 12, 29, 34]) {
                dot(outline, x, 22, 4, 34);
                dot(timber[3], x + 1, 23, 2, 31);
            }
            line(timber[4], 8, 28, 32, 49, 2);
            line(timber[2], 32, 28, 8, 49, 2);
            dot(outline, 3, 12, 36, 13);
            dot(timber[2], 4, 13, 34, 10);
            for (let x = 5; x < 38; x += 4) {
                dot(timber[4], x, 11, 2, 10);
                dot(timber[5], x, 10, 2);
            }
            dot(timber[0], 3, 19, 36, 2);
            dot(timber[4], 3, 21, 36, 2);
            hanging(19, 25, 7, 14);
            line(timber[4], 17, 28, 14, 55);
            line(timber[4], 22, 28, 19, 55);
            for (let y = 30; y < 54; y += 4)
                dot(timber[3], 16 - Math.floor((y - 30) / 8), y, 5);
        }
    }
    else if (type === 'gate') {
        bricks(3, 17, 46, 26);
        crenels(3, 12, 46);
        portal(14, 21, 23, 22);
        turret(2, 13, 9, 31);
        turret(41, 13, 9, 31);
        hanging(3, 24, 5, 10);
    }
    else if (type === 'wall' || type === 'lowwall') {
        const y = type === 'wall' ? 6 : 14;
        bricks(0, y + 4, W, H - y - 7);
        dot('#757971', 0, H - 5, W, 2);
        dot(outline, 0, H - 3, W, 3);
        crenels(0, y, W, 7);
        if (type === 'wall')
            for (let x = 6; x < W - 2; x += 16)
                dot(outline, x, y + 12, 1, 4);
    }
    else if (type === 'palisade') {
        for (let x = 1; x < W; x += 5) {
            const y = 8 + noise(x, 0, variant) % 4;
            line(outline, x, y, x + 2, 27, 4);
            line(timber[2], x + 1, y, x + 3, 26, 2);
            poly(timber[5], x, y + 3, x + 1, y - 4, x + 4, y + 3);
            line(timber[4], x + 1, y + 3, x + 3, 23);
        }
        dot(timber[0], 0, 20, W, 3);
        dot(timber[3], 0, 20, W);
        for (let x = 2; x < W - 2; x += 9) {
            line(timber[0], x, 28, x + 6, 13, 3);
            line(timber[4], x + 1, 28, x + 7, 13);
            dot('#bbb18f', x + 3, 21);
        }
    }
    else if (type === 'bridge' || type === 'pontoon') {
        if (type === 'bridge') {
            bricks(0, 7, W, 29);
            bricks(0, 32, W, 8, true);
            for (let x = 13; x < W - 10; x += 22) {
                poly('#222b2d', x - 5, 40, x - 5, 38, x - 3, 35, x, 34, x + 3, 35, x + 5, 38, x + 5, 40);
            }
            dot('#7d7e72', 0, 31, W, 2);
            dot(outline, 0, 40, W);
            for (let row = 0; row < 7; row++)
                for (let col = -1; col * 8 < W; col++) {
                    const x = col * 8 + (row % 2) * 4;
                    dot(basalt[2 + noise(row, col, 1) % 4], x, 10 + row * 3, 7, 2);
                }
            for (const y of [5, 29]) {
                dot(outline, 0, y, W, 4);
                dot(basalt[5], 0, y, W, 2);
                for (let x = 0; x < W; x += 13) {
                    dot(outline, x, y - 3, 4, 5);
                    dot(light, x, y - 3, 4);
                    dot(basalt[4], x, y - 2, 3, 3);
                }
            }
        }
        else {
            dot(timber[0], 0, 8, W, 25);
            for (let x = 0; x < W; x += 4) {
                const dy = noise(x, 3, variant) % 3;
                dot(timber[2 + dy], x, 8 + dy, 3, 23);
                dot(timber[4], x, 9 + dy, 1, 20);
            }
            for (const y of [8, 31]) {
                dot(timber[4], 0, y, W);
                for (let x = 1; x < W; x += 15) {
                    dot(timber[0], x, y - 4, 3, 7);
                    dot(timber[5], x, y - 4, 2);
                }
            }
        }
    }
    else if (type === 'house') {
        const offset = variant % 3;
        poly('#252b26', 1, 31, 8, 23, 34, 21, 41, 27, 40, 32, 28, 37, 7, 35);
        dot(outline, 4, 18, 30, 16);
        bricks(5, 22, 28, 12);
        dot('#89816a', 6, 21, 25, 9);
        dot(timber[1], 6, 21, 2, 11);
        dot(timber[1], 18, 21, 2, 12);
        line(timber[1], 8, 22, 16, 30);
        line(timber[1], 21, 30, 29, 23);
        dot(outline, 20, 25, 5, 9);
        dot(timber[2], 21, 26, 3, 8);
        dot('#291f18', 10, 23, 4, 4);
        dot('#b09457', 11, 24, 2, 2);
        poly(outline, 1, 21, 11, 7, 26, 5, 38, 16, 34, 23, 12, 26);
        poly(variant % 2 ? '#6e6247' : '#6a5140', 2, 20, 12, 8, 26, 6, 34, 17, 31, 21, 12, 24);
        poly('#473e31', 26, 6, 38, 16, 35, 21, 31, 20);
        for (let y = 0; y < 11; y += 2)
            for (let j = 0; j < 11; j++) {
                const x = 11 - y * .75 + j * 1.65;
                dot(timber[2 + noise(j, y, variant) % 3], x, 9 + y - Math.round(j / 7), 2);
            }
        line('#ae9871', 11, 7, 25, 5);
        dot(mortar, 23 + offset, 3, 4, 8);
        dot(basalt[5], 22 + offset, 3, 5, 2);
        boxBarrel(34, 28);
    }
    else if (type === 'tree') {
        const yOff = variant % 3, xMid = 14 + (variant % 3) - 1;
        poly('#22291e', 2, 32, 10, 27, 24, 28, 30, 32, 27, 35, 12, 37);
        dot('#393529', xMid - 2, 25, 5, 10);
        dot('#67543a', xMid - 1, 29, 2, 6);
        dot('#483d2e', xMid + 1, 29, 2, 5);
        const green = variant % 3 === 0 ? ['#1b2624', '#273833', '#37473b', '#495644', '#59624c'] : ['#1c2722', '#2a382c', '#3c4935', '#4d563c', '#606342'];
        for (let tier = 0; tier < 4; tier++) {
            const bottom = 32 - tier * 5 - yOff, spread = 13 - tier * 2, top = bottom - 15 + tier;
            poly(green[0], xMid - spread, bottom - 1, xMid - spread + 3, bottom - 5, xMid - spread + 2, bottom - 5, xMid - 2, top + 3, xMid, top - 3, xMid + 3, top + 4, xMid + spread - 2, bottom - 5, xMid + spread - 3, bottom - 5, xMid + spread + 1, bottom - 1, xMid + spread - 3, bottom, xMid + spread - 2, bottom + 1, xMid + 3, bottom - 1, xMid + 1, bottom + 2, xMid - 5, bottom, xMid - 8, bottom + 1);
            poly(green[1], xMid - spread + 1, bottom - 2, xMid - 4, top + 5, xMid, top - 2, xMid + 3, top + 6, xMid + spread - 2, bottom - 2, xMid + 4, bottom - 3, xMid + 3, bottom - 1, xMid - 2, bottom - 3, xMid - 5, bottom - 1);
            poly(green[2], xMid - spread + 2, bottom - 3, xMid - 3, top + 5, xMid, top - 1, xMid - 1, top + 7, xMid + 1, top + 8, xMid - 4, bottom - 4, xMid - 6, bottom - 3, xMid - 4, bottom - 6);
            for (let k = 0; k < spread + 1; k++) {
                const n = noise(k, tier, variant);
                const a = n % spread;
                dot(green[2 + n % 2], xMid - a + 1, bottom - 3 - Math.floor((spread - a) / 3) - (n % 3), 1 + n % 2);
            }
        }
        dot(green[4], xMid, 1 + yOff, 1, 2);
    }
    function boxBarrel(x: number, y: number) {
        dot(outline, x, y, 5, 6);
        dot(timber[3], x + 1, y, 3, 6);
        dot(timber[5], x + 1, y, 3);
        dot(ironColor, x, y + 2, 5);
        dot(ironColor, x, y + 5, 5);
    }
    return canvas;
}
const ironColor = '#67695f';
export function drawStructure(ctx: CanvasRenderingContext2D, s: Structure, tick: number) {
    if (s.hp <= 0)
        return;
    const variant = s.type === 'tree' || s.type === 'house' ? s.id % 9 : 0;
    const aspect = Math.round(s.w / Math.max(1, s.h) * 8) / 8;
    const key = s.type + '|' + s.faction + '|' + variant + '|' + aspect;
    let art = atlas.get(key);
    if (!art) {
        const hall=['barracks','range','stables','abbey','siege_workshop'].includes(s.type);
        art = makeScenery(hall?'house':s.type, s.faction, variant, aspect);
        const g=art.getContext('2d')!;
        const ink=(color:string,x:number,y:number,w:number,h:number)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
        if(s.type==='mine'||s.type==='rock'){
            const mine=s.type==='mine';
            for(let i=0;i<18;i++){
                const x=3+i*19%46,y=20+i*13%25,size=8+i%8;
                ink('#333832',x,y,size+3,size);ink(mine?'#746447':'#60635c',x,y-2,size,size-3);
                ink(mine?'#b09551':'#777a70',x+1,y-2,size-4,3);if(mine)ink('#cfb16a',x+3,y+2,3,4);
            }
        }
        if(hall){
            ink('#342d25',14,20,13,11);ink('#a58653',15,20,11,1);
            if(s.type==='abbey'){ink('#bca46d',19,4,2,23);ink('#dac593',15,8,10,2);}
            if(s.type==='range')for(let i=0;i<3;i++)ink(['#cab18a','#7e3e30','#d9c695'][i],16+i*2,21+i*2,10-i*4,9-i*4);
            if(s.type==='stables'){ink('#b29970',18,22,2,5);ink('#b29970',23,22,2,5);ink('#b29970',19,27,5,2);}
            if(s.type==='siege_workshop'){ink('#474341',29,7,5,16);ink('#81786a',28,6,7,2);ink('#bd9758',18,24,7,3);}
            if(s.type==='barracks')for(let i=0;i<6;i++){ink('#c8c7b8',17+i,22+i,2,1);ink('#c8c7b8',23-i,22+i,2,1);}
        }
        atlas.set(key, art);
    }
    const stretch = s.type === 'bridge' || s.type === 'pontoon' ? 1.23 : s.type === 'keep' ? 1.61 : s.type === 'tree' ? 2.12 : s.type === 'wall' || s.type === 'lowwall' ? 1.16 : 1.5;
    const width = Math.ceil(s.w * (s.type === 'tree' ? 1.58 : 1.04)), height = Math.ceil(s.h * stretch);
    const left = Math.round(s.x - width / 2), bottom = Math.round(s.y + s.h / 2), top = bottom - height;
    ctx.drawImage(art, left, top, width, height);
    if(s.type==='keep'){
        const x=Math.round(s.x+2),y=Math.round(top+height*.16);
        ctx.drawImage(banner(s.faction===1?1:0,Math.floor(tick/7)),x,y-68,50,70);
        for(let i=1;i<(s.age??1);i++){const bx=Math.round(s.x+(i===1?-1:1)*width*.32);ctx.drawImage(banner(s.faction===1?1:0,Math.floor(tick/7)),bx,y-8,22,30);}
    }
    if (s.type === 'tower' || s.type === 'outpost') {
        const scale = Math.max(1, Math.round(width / art.width));
        const x = Math.round(left + width * (.32)), y = Math.round(top + height * (.23));
        const n = Math.floor(tick / 6) % 6, colors = s.faction === 0 ? ['#263e50', '#386fa3', '#80a6c0'] : ['#592b2b', '#a43f3a', '#c8986e'];
        ctx.fillStyle = '#4b4132';
        ctx.fillRect(x, y - 14 * scale, 2 * scale, 15 * scale);
        ctx.fillStyle = '#c4b07e';
        ctx.fillRect(x, y - 15 * scale, scale, 15 * scale);
        for (let i = 1; i <= 13; i++) {
            const sway = Math.round(Math.sin(i * .43 + n) * 1.1);
            ctx.fillStyle = colors[i % 6 < 2 ? 0 : 1];
            ctx.fillRect(x + i * scale, y + (-14 + sway) * scale, scale, (i > 9 ? 4 : 6) * scale);
            ctx.fillStyle = colors[2];
            ctx.fillRect(x + i * scale, y + (-14 + sway) * scale, scale, scale);
        }
    }
    if (s.hp < s.maxHp * .49 && !['tree', 'pontoon', 'palisade'].includes(s.type)) {
        const step = Math.max(1, Math.round(width / 78));
        ctx.fillStyle = '#252323';
        let x = Math.round(s.x + width * .12), y = Math.round(bottom - height * .34);
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(x, y, step * 2, step * 2);
            x += (i % 3 === 0 ? -1 : 1) * step;
            y += step;
        }
        if (s.type === 'keep') {
            for (let i = 0; i < 8; i++) {
                const phase = (tick / 3 + i * 4) % 21;
                ctx.fillStyle = i % 2 ? '#767771' : '#505454';
                ctx.fillRect(Math.round(s.x + step * (9 + phase / 4 + Math.sin(i + tick / 12) * 2)), Math.round(top + height * .53 - phase * step), step * (3 + i % 3), step * 3);
            }
            ctx.fillStyle = '#ca6837';
            ctx.fillRect(Math.round(s.x + 7 * step), Math.round(top + height * .53), 4 * step, 5 * step);
            ctx.fillStyle = '#f3b756';
            ctx.fillRect(Math.round(s.x + 8 * step), Math.round(top + height * .53) + step, 2 * step, (2 + tick % 3) * step);
        }
    }
}
