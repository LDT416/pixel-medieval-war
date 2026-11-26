import {banner} from './banners';
import {sprite} from './spriteBaker';
import type { Faction, Kind } from '../sim/types';
// All contours are scan converted at native resolution, including the diagonal blades.
function ink(ctx: CanvasRenderingContext2D) {
    const box = (c: string, x: number, y: number, w = 1, h = 1) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
    };
    function line(c: string, x: number, y: number, X: number, Y: number, width = 1) {
        const n = Math.max(Math.abs(X - x), Math.abs(Y - y), 1);
        for (let i = 0; i <= n; i++)
            box(c, Math.round(x + (X - x) * i / n), Math.round(y + (Y - y) * i / n), width, width);
    }
    function shape(c: string, ...points: number[]) {
        const ys = points.filter((_, i) => i % 2 === 1);
        for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
            const cuts: number[] = [];
            for (let i = 0; i < points.length; i += 2) {
                const j = (i + 2) % points.length;
                const a = points[i + 1], b = points[j + 1], scan = y + .5;
                if ((a <= scan && b > scan) || (b <= scan && a > scan)) {
                    cuts.push(points[i] + (scan - a) * (points[j] - points[i]) / (b - a));
                }
            }
            cuts.sort((a, b) => a - b);
            for (let i = 0; i + 1 < cuts.length; i += 2)
                box(c, Math.ceil(cuts[i]), y, Math.ceil(cuts[i + 1]) - Math.ceil(cuts[i]), 1);
        }
    }
    return { box, line, shape };
}
const cache = new Map<string, HTMLCanvasElement>();
const black = '#151719', deep = '#2b3031', iron = '#485355', steel = '#788581', silver = '#adb4a6', glint = '#dedfca';
const wood = '#79563a', woodLight = '#b08a58', gold = '#b3965c', bone = '#d8bc87', skin = '#a47c57', beard = '#4b3d32';
export function portrait(kind: Kind, faction: Faction = 0): HTMLCanvasElement {
    const key = kind + faction;
    const cached = cache.get(key);
    if (cached)
        return cached;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const { box, line, shape } = ink(ctx);
    const cloth = faction === 0 ? '#4c7185' : '#914d41';
    const edge = faction === 0 ? '#83a0a4' : '#c98464';
    const shade = faction === 0 ? '#293f50' : '#522f32';
    const bg = faction === 0 ? '#252c2b' : '#302927';
    box('#1c2020', 0, 0, 48, 48);
    shape(bg, 0, 0, 48, 0, 48, 35, 29, 28, 0, 41);
    // Scratched iron behind the figure. A few displaced pixels break the flat ground.
    for (let i = 0; i < 85; i++) {
        const x = (i * 13 + (i * i >> 2)) % 48, y = (i * 29 + (i * i >> 4)) % 48;
        box(i % 3 ? '#303530' : '#3b3c32', x, y, i % 4 === 0 ? 2 : 1);
    }
    const armored = ['halberdier','plate_knight','heavy_lancer','shieldman','pikeman','zweihander','crossbowman','bannerman'].includes(kind);
    function torso() {
        shape(black, 0, 48, 1, 41, 7, 34, 16, 31, 18, 26, 28, 25, 32, 30, 38, 32, 44, 39, 48, 48);
        shape(shade, 1, 48, 3, 41, 10, 35, 20, 31, 29, 30, 36, 34, 42, 40, 44, 48);
        shape(cloth, 4, 47, 6, 41, 13, 35, 19, 33, 18, 38, 13, 41, 13, 48);
        shape(armored ? iron : '#534639', 16, 34, 26, 30, 34, 33, 36, 39, 32, 48, 13, 48);
        shape(armored ? steel : wood, 17, 34, 25, 32, 32, 33, 31, 36, 24, 40, 16, 39);
        shape(armored ? silver : woodLight, 16, 34, 24, 32, 29, 32, 25, 34, 19, 36, 15, 36);
        line(black, 16, 41, 26, 43, 2);
        line(armored ? steel : woodLight, 16, 41, 26, 43);
        line(armored ? iron : wood, 26, 43, 33, 39);
        shape(black, 4, 39, 5, 35, 10, 31, 17, 30, 20, 34, 16, 39, 10, 40);
        shape(armored ? steel : cloth, 5, 37, 9, 33, 15, 31, 18, 34, 15, 37, 10, 39);
        line(armored ? silver : edge, 6, 36, 12, 32);
        box(armored ? glint : bone, 12, 32, 3);
        line(armored ? iron : shade, 5, 38, 10, 39);
        for (let i = 0; i < 3; i++) {
            box(gold, 7 + i * 3, 37 + (i % 2));
            box(iron, 13 + i * 2, 45 + i % 2);
        }
        line(black, 15, 46, 33, 33, 3);
        line(wood, 15, 46, 33, 33, 2);
        box(gold, 24, 39, 4, 3);
        box(deep, 25, 40, 2);
    }
    function face() {
        shape(black, 14, 13, 18, 9, 28, 9, 33, 14, 32, 19, 35, 23, 32, 24, 31, 29, 26, 32, 19, 30, 15, 26);
        shape(beard, 16, 16, 21, 12, 29, 13, 32, 17, 31, 19, 34, 23, 31, 24, 30, 28, 25, 31, 20, 29, 17, 25);
        shape(skin, 18, 16, 25, 13, 30, 15, 30, 19, 32, 22, 30, 23, 30, 26, 27, 28, 23, 27, 20, 24, 17, 23);
        shape('#c69c70', 22, 15, 28, 14, 30, 16, 28, 18, 22, 19, 20, 18);
        box(beard, 27, 19, 4);
        box(black, 29, 20);
        box(bone, 30, 21, 2);
        box('#d2ac7e', 25, 22, 3);
        box(beard, 28, 25, 3);
        box('#bd9470', 27, 26, 2);
        box(skin, 17, 20, 3, 4);
        box(wood, 18, 21);
        line('#79654f', 20, 26, 24, 29);
    }
    function helmet(full: boolean, crest: boolean) {
        shape(black, 12, 16, 14, 11, 18, 8, 23, 6, 29, 8, 32, 12, 32, 15, 35, 18, 33, 21, 24, 20, 21, 27, 16, 29, 13, 27);
        shape(iron, 14, 15, 16, 11, 21, 8, 26, 8, 30, 11, 31, 15, 33, 17, 26, 17, 18, 21, 15, 25);
        shape(steel, 15, 15, 17, 11, 22, 9, 25, 9, 21, 12, 19, 16, 14, 18);
        shape(silver, 19, 11, 22, 8, 26, 8, 22, 10);
        line(silver, 24, 8, 27, 15);
        box(glint, 24, 9);
        line(black, 13, 19, 32, 15, 2);
        line(steel, 14, 18, 32, 15);
        box(silver, 27, 15, 5);
        shape(deep, 15, 22, 19, 19, 22, 19, 21, 24, 18, 27, 15, 26);
        box(gold, 17, 20);
        line(steel, 15, 25, 17, 26);
        if (full) {
            shape(black, 19, 19, 32, 16, 35, 18, 34, 24, 31, 28, 27, 31, 20, 28, 18, 24);
            shape(iron, 20, 20, 33, 17, 34, 19, 31, 24, 28, 29, 21, 27);
            shape(steel, 21, 22, 33, 19, 32, 22, 28, 27, 24, 27);
            line(black, 22, 21, 32, 18);
            line(silver, 22, 20, 32, 17);
            for (let i = 0; i < 3; i++)
                line(deep, 24 + i * 2, 24, 25 + i * 2, 25);
            box(glint, 30, 20, 3);
            box(gold, 20, 23);
            box(steel, 22, 28, 4);
        }
        if (crest) {
            shape(black, 8, 11, 8, 7, 12, 4, 19, 2, 24, 3, 26, 6, 25, 9, 21, 9, 20, 6, 16, 6, 14, 9);
            shape(cloth, 8, 10, 10, 6, 15, 3, 21, 3, 24, 5, 24, 7, 21, 7, 18, 5, 15, 6, 13, 9);
            line(edge, 11, 6, 16, 4);
            box(edge, 18, 3, 3);
            box(gold, 22, 7, 3, 2);
        }
    }
    function hand(x: number, y: number) {
        box(black, x - 1, y - 1, 6, 5);
        box(armored ? steel : skin, x, y, 4, 3);
        box(armored ? silver : bone, x, y, 3);
        box(armored ? iron : wood, x + 3, y + 2, 2, 2);
    }
    function pole(x: number, y: number, X: number, Y: number) {
        line(black, x - 1, y, X - 1, Y, 4);
        line(wood, x, y, X, Y, 2);
        line(woodLight, x, y, X, Y);
    }
    function wheel(x: number, y: number, r: number) {
        for (let j = -r; j <= r; j++)
            for (let i = -r; i <= r; i++) {
                const d = i * i + j * j;
                if (d <= (r + 1) * (r + 1) && (d >= (r - 2) * (r - 2) || Math.abs(i) <= 1 || Math.abs(j) <= 1 || Math.abs(i + j) <= 1 || Math.abs(i - j) <= 1)) {
                    box(d > r * r ? black : d > (r - 1) * (r - 1) ? steel : i + j < 0 ? woodLight : wood, x + i, y + j);
                }
            }
        box(gold, x - 1, y - 1, 3, 3);
        box(bone, x - 1, y - 1);
    }
    if(['war_elephant','hwacha','ballista','battering_ram'].includes(kind)){
        const native=sprite(kind,faction);
        ctx.drawImage(native,1,kind==='war_elephant'?9:12,46,kind==='war_elephant'?35:30);
        if(kind==='war_elephant'){
            line(gold,9,22,25,22,2);for(let i=0;i<5;i++)box(bone,10+i*3,24,1,2);
            shape(glint,34,33,40,31,44,26,43,32,39,35,35,36);
            box(black,38,26,2);box(bone,39,26);
        }else{
            wheel(12,38,5);wheel(34,38,5);
            if(kind==='ballista'){line(bone,8,23,37,12);shape(silver,35,11,45,6,40,14,36,15);}
            if(kind==='hwacha')for(let i=0;i<5;i++){line(woodLight,7+i*7,27,15+i*7,12);shape('#c45d37',13+i*7,14,16+i*7,7,17+i*7,12,15+i*7,16);}
            if(kind==='battering_ram')for(let i=0;i<6;i++){line(silver,7+i*5,17,3+i*5,24);box(gold,6+i*6,26,2);}
        }
    }else if (kind === 'catapult' || kind === 'field_cannon') {
        shape('#141716', 0, 42, 11, 34, 41, 33, 47, 38, 42, 45, 21, 47);
        wheel(14, 33, 7);
        if (kind === 'catapult') {
            shape(black, 2, 34, 4, 30, 33, 25, 45, 31, 44, 38, 17, 44);
            shape(wood, 4, 32, 32, 27, 43, 31, 17, 38);
            line(woodLight, 4, 32, 18, 37);
            line(woodLight, 18, 37, 41, 31);
            pole(7, 34, 19, 14);
            pole(33, 30, 22, 14);
            pole(19, 37, 22, 14);
            line(black, 18, 15, 33, 3, 4);
            line(woodLight, 19, 16, 33, 3, 2);
            line('#b3ae86', 34, 4, 39, 15);
            line('#8c8968', 35, 4, 43, 13);
            shape(black, 36, 15, 42, 12, 46, 13, 45, 17, 40, 19);
            box(steel, 40, 13, 4, 2);
            box(silver, 40, 13, 2);
            shape(black, 9, 18, 15, 15, 20, 18, 19, 26, 12, 28, 8, 25);
            shape(iron, 10, 19, 16, 17, 19, 19, 18, 24, 13, 26, 10, 25);
            box(steel, 10, 19, 5, 2);
            line(gold, 13, 19, 13, 25);
            for (let i = 0; i < 4; i++) {
                box(gold, 20 + i, 15, 1, 4);
                box(silver, 20 + i, 15);
            }
            wheel(30, 36, 7);
        }
        else {
            pole(3, 39, 28, 27);
            pole(5, 41, 30, 30);
            shape(black, 6, 26, 8, 22, 29, 13, 37, 9, 42, 10, 46, 16, 43, 20, 34, 22, 13, 33, 7, 32);
            shape(iron, 7, 26, 12, 23, 33, 14, 39, 12, 43, 14, 43, 18, 36, 19, 15, 30, 10, 31);
            shape(steel, 9, 25, 35, 13, 39, 13, 35, 16, 12, 27);
            line(silver, 12, 24, 36, 13);
            for (let i = 0; i < 3; i++) {
                const x = 13 + i * 8, y = 23 - i * 4;
                line(deep, x, y, x + 3, y + 7, 2);
                line(silver, x, y, x + 2, y + 4);
            }
            shape(silver, 36, 12, 40, 10, 44, 12, 46, 16, 44, 19, 41, 20, 38, 17);
            shape(black, 39, 12, 41, 12, 44, 15, 44, 17, 42, 18, 39, 15);
            wheel(23, 34, 9);
            box(iron, 39, 37, 4, 3);
            box(steel, 40, 36, 2);
            box(deep, 42, 40, 4, 3);
        }
    }
    else {
        torso();
        face();
        if (armored)
            helmet(kind === 'plate_knight' || kind === 'heavy_lancer', kind === 'plate_knight' || kind === 'heavy_lancer');
        if (kind === 'militia' || kind === 'scout_cavalry') {
            shape(black, 12, 19, 14, 12, 18, 8, 27, 8, 31, 11, 33, 16, 27, 17, 22, 16, 18, 22, 14, 24);
            shape(kind === 'militia' ? wood : cloth, 14, 18, 15, 13, 19, 10, 26, 9, 30, 12, 31, 15, 23, 14, 19, 17, 16, 22);
            line(kind === 'militia' ? woodLight : edge, 16, 14, 22, 10);
            line(black, 16, 18, 30, 14);
            box(steel, 28, 14, 3);
        }
        if (['bowman','longbowman','horse_archer'].includes(kind)) {
            shape(black, 8, 31, 12, 25, 11, 16, 15, 10, 24, 5, 29, 7, 34, 14, 33, 17, 26, 14, 22, 18, 21, 24, 25, 29, 19, 33);
            shape('#505849', 10, 30, 14, 24, 13, 16, 17, 11, 25, 7, 29, 9, 32, 14, 26, 12, 22, 15, 19, 20, 19, 25, 23, 29, 18, 31);
            line('#89917a', 15, 16, 23, 9);
            line('#64725d', 13, 28, 16, 24);
            box('#a6a68a', 23, 9, 3);
            line(black, 38, 7, 44, 17, 2);
            line(black, 44, 17, 45, 32, 2);
            line(black, 45, 32, 36, 47, 2);
            line(woodLight, 38, 7, 44, 17);
            line(woodLight, 44, 17, 45, 32);
            line(woodLight, 45, 32, 36, 47);
            line('#bbb298', 38, 8, 36, 46);
            line(woodLight, 21, 37, 47, 25);
            hand(35, 32);
        }
        if (kind === 'musketeer'||kind==='blunderbuss') {
            shape(black, 7, 19, 13, 15, 17, 9, 26, 7, 30, 10, 30, 13, 39, 13, 36, 17, 21, 19);
            shape('#604f3b', 11, 17, 16, 15, 18, 10, 26, 9, 28, 12, 28, 15, 36, 14, 29, 16, 19, 18);
            line(woodLight, 17, 14, 28, 12);
            box(gold, 25, 13, 3, 2);
            line(black, 12, 46, 45, 19, 5);
            line(wood, 12, 45, 44, 20, 4);
            line(steel, 22, 36, 44, 18, 2);
            line(silver, 24, 34, 44, 18);
            box(black, 43, 17, 3, 3);
            box(silver, 43, 17, 2);
            box(gold, 24, 35, 4, 2);
            hand(27, 34);
        }
        if (kind === 'militia') {
            pole(31, 48, 39, 14);
            line(black, 35, 14, 41, 16, 2);
            for (let i = 0; i < 3; i++) {
                line(iron, 35 + i * 3, 15, 37 + i * 3, 5 + i % 2, 2);
                line(silver, 35 + i * 3, 15, 37 + i * 3, 5 + i % 2);
            }
            hand(32, 36);
        }
        if(kind==='peasant'||kind==='sapper'){
            shape(kind==='peasant'?woodLight:iron,7,19,11,15,16,14,18,7,26,6,30,11,31,14,37,15,37,18,23,19);
            line(kind==='peasant'?bone:silver,10,16,28,13);
            pole(28,48,41,16);
            if(kind==='peasant'){shape(steel,32,12,39,12,45,18,46,24,43,20,37,16);line(glint,32,12,38,13);}
            else {box(wood,1,31,11,16);box(iron,1,32,11,3);box(steel,1,42,11,2);line(gold,5,31,8,27);shape(silver,37,13,45,14,46,19,36,18);}
            hand(31,37);
        }
        if(kind==='monk'){
            shape('#50463d',10,29,12,15,18,6,25,4,33,12,34,17,27,13,21,15,20,25,25,29,17,34);
            line('#a29270',13,19,19,10,2);pole(35,48,38,13);box(gold,37,4,3,16);box(bone,32,9,13,3);box(gold,22,34,2,9);box(bone,20,36,6,2);
        }
        if(kind==='bannerman'){ctx.drawImage(banner(faction),0,1,18,32);pole(2,47,2,27);hand(2,38);}
        if(kind==='pikeman'){pole(24,48,39,11);shape(silver,37,14,44,1,43,11,39,16);line(glint,39,11,43,3);hand(29,36);}
        if(kind==='zweihander'){shape(silver,26,35,34,19,46,1,47,8,36,29,30,37);line(glint,29,31,45,4,2);pole(21,47,29,33);line(gold,22,31,34,37,2);hand(25,38);}
        if(kind==='berserker')for(const side of [0,1]){
            const x=side?35:6;pole(x-5,48,x+3,21);shape(steel,x-4,14,x+1,17,x+7,15,x+9,12,x+10,23,x+5,27,x-2,24,x-6,22);
            line(glint,x-5,20,x,24,2);hand(x-2,38);
            box('#864a3b',20,19,2,6);
        }
        if(kind==='crossbowman'){pole(13,46,41,22);line(steel,26,15,41,22,3);line(steel,41,22,45,36,3);line(bone,26,15,29,33);line(bone,29,33,45,36);line(glint,26,35,46,17);hand(22,36);}
        if(kind==='blunderbuss'){shape(gold,32,27,36,19,38,12,46,19,46,23,37,28);line(bone,38,13,45,19);line(black,39,15,44,19,2);}
        if(kind==='fire_bomber'){shape('#595444',11,18,13,10,21,7,30,8,34,14,29,16,21,13,17,19);box(wood,35,22,5,6);shape('#585a3c',35,27,40,27,45,33,44,41,40,44,33,43,29,39,30,32);line(gold,30,33,42,30,2);line('#da723d',37,22,42,16,2);box('#f1b95e',42,14,2,4);hand(30,40);}
        if(kind==='longbowman'){pole(6,45,2,17);for(let i=0;i<3;i++){line(bone,3+i*3,27,2+i*3,10);box(edge,1+i*3,9,3,5);}line(glint,38,6,35,45);}
        if (kind === 'halberdier') {
            pole(27, 49, 40, 7);
            shape(black, 36, 14, 40, 2, 42, 1, 41, 11, 46, 9, 46, 16, 43, 21, 36, 22, 37, 18, 31, 17);
            shape(steel, 37, 14, 41, 3, 40, 13, 44, 12, 45, 10, 45, 15, 42, 20, 37, 21, 39, 17, 33, 16);
            shape(silver, 37, 14, 41, 3, 39, 14);
            line(glint, 45, 12, 44, 16);
            line(silver, 44, 16, 40, 20);
            box(gold, 36, 17, 3, 2);
            hand(31, 37);
        }
        if (kind === 'plate_knight') {
            shape(black, 28, 37, 29, 32, 43, 4, 46, 2, 46, 10, 34, 35, 31, 37);
            shape(steel, 29, 35, 32, 28, 44, 5, 45, 4, 44, 10, 33, 34);
            line(glint, 31, 31, 44, 5);
            line(iron, 33, 32, 44, 10);
            line(black, 25, 32, 36, 37, 3);
            line(gold, 25, 32, 36, 37, 2);
            line(wood, 29, 36, 25, 45, 2);
            hand(27, 38);
        }
        if (kind === 'shieldman') {
            shape(black, 0, 32, 7, 28, 16, 31, 19, 34, 18, 43, 12, 48, 4, 45);
            shape(silver, 1, 33, 7, 30, 16, 33, 17, 35, 16, 42, 11, 47, 5, 44);
            shape(cloth, 3, 34, 7, 32, 15, 34, 15, 41, 11, 44, 6, 42);
            line(edge, 7, 33, 10, 44, 2);
            line(bone, 5, 37, 13, 36);
            line(black, 33, 40, 41, 15, 4);
            line(steel, 34, 39, 42, 14, 2);
            line(glint, 34, 37, 42, 14);
            line(gold, 30, 37, 37, 39, 2);
            hand(32, 40);
        }
        if (kind === 'scout_cavalry' || kind === 'heavy_lancer'||kind==='horse_archer') {
            // Horse in the foreground: ears, long angular muzzle, cheek plate and reins.
            shape(black, 21, 48, 24, 38, 28, 31, 28, 24, 32, 27, 34, 23, 35, 29, 39, 30, 43, 35, 47, 39, 46, 43, 42, 44, 36, 40, 34, 48);
            const horse = kind === 'heavy_lancer' ? iron : '#866649';
            shape(horse, 23, 48, 26, 38, 30, 32, 29, 26, 32, 30, 34, 26, 34, 31, 38, 32, 42, 36, 46, 40, 44, 42, 41, 41, 35, 38, 32, 48);
            line(kind === 'heavy_lancer' ? silver : '#b18a5e', 32, 31, 39, 34, 2);
            line(black, 37, 34, 39, 35);
            box(bone, 37, 34);
            box(black, 44, 39, 2);
            line(woodLight, 34, 35, 39, 40);
            line(wood, 38, 39, 21, 42);
            line(deep, 28, 34, 25, 44, 2);
            if (kind === 'heavy_lancer') {
                pole(2, 47, 9, 6);
                shape(silver, 8, 10, 11, 1, 11, 8, 9, 12);
                shape(cloth, 8, 11, 4, 12, 0, 10, 2, 15, 7, 15);
                hand(4, 35);
            }
            else {
                line(black, 4, 40, 10, 16, 3);
                line(silver, 5, 40, 11, 16);
                line(glint, 9, 22, 11, 16);
                line(gold, 2, 38, 8, 40);
                hand(4, 40);
            }
        }
    }
    cache.set(key, canvas);
    return canvas;
}
