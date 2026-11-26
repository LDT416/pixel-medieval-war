import { WIDTH, HEIGHT, bridgeSize, bridgeYs, riverWidth, riverX, water as mapWater, shoreAt, ford } from '../sim/maps';
// World art uses a two-world-pixel brush. Quantized value noise makes contiguous
// patches of lichen, turf and exposed earth without putting noise over the UI.
function hash(x: number, y: number, seed = 0) {
    let n = Math.imul(x + seed + 23, 0x1f123bb5) ^ Math.imul(y + 37, 0x5f356495);
    n = Math.imul(n ^ (n >>> 15), 0x85ebca6b);
    return (n ^ (n >>> 13)) >>> 0;
}
function field(cols: number, rows: number, seed: number) {
    const grid = new Float32Array((cols + 2) * (rows + 2));
    for (let i = 0; i < grid.length; i++)
        grid[i] = hash(i % (cols + 2), Math.floor(i / (cols + 2)), seed) / 4294967295;
    return (x: number, y: number) => {
        const px = x * cols / WIDTH, py = y * rows / HEIGHT, a = Math.floor(px), b = Math.floor(py), i = a + b * (cols + 2);
        const dx = px - a, dy = py - b;
        return (grid[i] + (grid[i + 1] - grid[i]) * dx) * (1 - dy) + (grid[i + cols + 2] + (grid[i + cols + 3] - grid[i + cols + 2]) * dx) * dy;
    };
}
const hex = (c: string) => {
    const v = parseInt(c.slice(1), 16);
    return (0xff000000 | ((v & 255) << 16) | (v & 0xff00) | (v >>> 16)) >>> 0;
};
const swatches = (colors: string) => colors.split(' ').map(hex);
type XY = [
    number,
    number
];
let cached: HTMLCanvasElement | undefined;
let cachedMap = '';
export function bakeTerrain(map:import('../sim/types').MapId='twin'): HTMLCanvasElement {
    if (cached && cachedMap===map)
        return cached;
    cachedMap=map;
    const water=(x:number,y:number)=>mapWater(x,y,map);
    const native = document.createElement('canvas');
    native.width = WIDTH / 2;
    native.height = HEIGHT / 2;
    const g = native.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    const w = native.width, h = native.height, pixels = g.createImageData(w, h), dst = new Uint32Array(pixels.data.buffer);
    const large = field(16, 11, 12), medium = field(84, 56, 221), small = field(329, 194, 73);
    const green = swatches(map==='gorge'?'#33342c #38392e #404331 #464837 #4d503a #54553d #595b42 #606047 #67634b':map==='darkwood'?'#202a23 #252e25 #283428 #2a372b #303c2d #394333 #414a36 #4b533a #565941':'#283025 #2b3326 #303828 #343e2b #3b442f #434a33 #4b5038 #54563c #5d5b41');
    const road = swatches('#3b352a #433b2e #4b4233 #514635 #59503c #645843 #71614a');
    const gravel = swatches('#474734 #50523c #56553e #615941 #696047 #756a50');
    const bank = swatches('#5b5841 #686247 #777157 #79705a #67644e #514e3f #423f34 #383a32');
    const river = swatches('#14262d #182834 #1a2c37 #1e333e #233b45 #2a4048 #30464b #384e50 #445952');
    const rMask = new Uint8Array(w * h);
    const woods = new Uint8Array(w * h);
    for (const [cx, cy] of [[220, 430], [620, 290], [1140, 325], [1660, 260], [2240, 230], [2740, 300], [3370, 350], [3650, 600], [290, 1450], [620, 1850], [1240, 1810], [1700, 1950], [2330, 1880], [2760, 1780], [3360, 1850], [3670, 1450], [1350, 1090], [2480, 1040], [380, 780], [3470, 925]]) {
        for (let y = Math.max(0, (cy - 178) >> 1); y < Math.min(h, (cy + 178) >> 1); y++)
            for (let x = Math.max(0, (cx - 234) >> 1); x < Math.min(w, (cx + 234) >> 1); x++) {
                const nx = (2 * x - cx) / 234, ny = (2 * y - cy) / 178, v = Math.max(0, 1 - nx * nx - ny * ny);
                woods[x + y * w] = Math.max(woods[x + y * w], Math.floor(v * 255));
            }
    }
    const duff = swatches('#22291e #273021 #2c3425 #333a29 #3a402d #424530');
    function route(points: XY[], radius: number) {
        // Mark a soft distance band. Neighbouring segments share a round end cap.
        for (let i = 1; i < points.length; i++) {
            const [x1, y1] = points[i - 1], [x2, y2] = points[i], dx = x2 - x1, dy = y2 - y1, dot = dx * dx + dy * dy;
            if (dot === 0)
                continue;
            const xMin = Math.max(0, Math.floor((Math.min(x1, x2) - radius - 2) / 2)), xMax = Math.min(w - 1, Math.ceil((Math.max(x1, x2) + radius + 2) / 2));
            const yMin = Math.max(0, Math.floor((Math.min(y1, y2) - radius - 2) / 2)), yMax = Math.min(h - 1, Math.ceil((Math.max(y1, y2) + radius + 2) / 2));
            for (let j = yMin; j <= yMax; j++)
                for (let k = xMin; k <= xMax; k++) {
                    const x = k * 2, y = j * 2, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / dot));
                    const ax = x - x1 - t * dx, ay = y - y1 - t * dy;
                    const ratio = (ax * ax + ay * ay) / (radius * radius);
                    if (ratio < 1) {
                        const id = k + j * w;
                        rMask[id] = Math.max(rMask[id], Math.round((1 - Math.sqrt(ratio)) * 255));
                    }
                }
        }
    }
    const north = bridgeSize(bridgeYs[0]).x, south = bridgeSize(bridgeYs[1]).x;
    route([[-60, 1088], [120, 1075], [480, 1030], [692, 1050], [880, 1052], [1060, 989], [1230, 890], [1450, 842], [1610, 743], [1780, 670], [north, 655], [2180, 652], [2388, 700], [2550, 800], [2738, 855], [2910, 980], [3075, 1050], [3170, 1050], [3550, 1040], [3890, 1070]], 47);
    route([[826, 1050], [1005, 1122], [1170, 1260], [1350, 1325], [1480, 1420], [1695, 1470], [south, 1470], [2205, 1470], [2375, 1410], [2540, 1362], [2750, 1284], [2910, 1140], [3075, 1050]], 48);
    route([[1130, 828], [992, 766], [792, 650], [640, 510], [408, 398], [210, 267], [-40, 178]], 21);
    route([[1440, 841], [1378, 759], [1248, 730], [1105, 788], [990, 816], [900, 920], [880, 1052]], 24);
    route([[1180, 1260], [1140, 1390], [1055, 1439], [938, 1480], [824, 1540], [659, 1668], [420, 1710], [170, 1840]], 24);
    route([[1640, 1465], [1572, 1580], [1460, 1707], [1410, 1850], [1305, 2010]], 19);
    route([[2910, 982], [2885, 824], [2975, 715], [2950, 620], [2840, 583], [2730, 470], [2670, 329]], 25);
    route([[2375, 1410], [2370, 1260], [2506, 1180], [2675, 1220], [2775, 1290], [2880, 1402], [3050, 1440], [3290, 1590], [3560, 1666]], 24);
    route([[2410, 700], [2386, 538], [2325, 414], [2280, 260]], 17);
    route([[3080, 1050], [3225, 1165], [3390, 1245], [3500, 1355], [3740, 1390]], 18);
    if(map==='bottleneck')route([[820,1050],[1400,1100],[riverX(1080),1080],[2630,1040],[3090,1050]],74);
    if(map==='darkwood')for(const y of [490,1080,1630])route([[780,1050],[1230,y+40],[1750,y],[2180,y+110],[2660,y+60],[3050,1050]],38);
    const centers = new Float32Array(h), half = new Float32Array(h);
    for (let j = 0; j < h; j++) {
        centers[j] = riverX(2 * j);
        half[j] = riverWidth(2 * j,map) / 2;
    }
    for (let j = 0; j < h; j++) {
        const y = j * 2, center = centers[j], riverHalf = half[j];
        for (let k = 0; k < w; k++) {
            const x = k * 2, id = k + j * w, core = large(x, y), n = medium(x, y), micro = small(x, y);
            const detail = hash(k >> 1, j >> 1, 611) % 6, material = core * .49 + n * .32 + micro * .19;
            let col = green[Math.min(8, Math.max(0, Math.floor((material - .13) * 10.6)))];
            if (woods[id] > 84 + (n - .5) * 135 + micro * 67)
                col = duff[Math.min(5, Math.floor(material * 6))];
            const shore = shoreAt(x,y,map,center,riverHalf);
            const bankNoise = n * 24 + micro * 10 - 16;
            const bankEdge = shore + bankNoise;
            if (shore < 0) {
                const depth = -shore;
                const tone = Math.floor((micro * .5 + n * .27 + core * .23) * 2.6);
                const range = depth < 7 ? 6 : depth < 18 + n * 8 ? 5 : depth < 34 + n * 8 ? 4 : depth < 51 + n * 12 ? 3 : depth < 70 + n * 10 ? 2 : 0;
                col = river[Math.min(8, range + tone)];
            }
            else if (bankEdge < 22) {
                const step = bankEdge < 1 ? 7 : bankEdge < 5 ? 6 : bankEdge < 10 ? 5 : bankEdge < 12 ? 3 : bankEdge < 16 ? 4 : bankEdge < 19 ? 1 : 2;
                col = bank[Math.min(7, Math.max(0, step + (detail === 0 ? -1 : 0)))];
            }
            else if (bankEdge < 46 + (n - .5) * 25) {
                col = gravel[Math.min(5, Math.floor(material * 5) + (detail === 0 ? 1 : 0))];
            }
            const castle = Math.min(Math.max(Math.abs(x - 670) / 217, Math.abs(y - 1050) / 173), Math.max(Math.abs(x - 3160) / 217, Math.abs(y - 1050) / 173));
            if (castle < 1 + (micro - .5) * .15)
                col = gravel[Math.max(0, Math.min(5, Math.floor(n * 3 + micro * 2 + core)))];
            if (shore >= 0 && rMask[id] > 0) {
                const t = rMask[id] / 255, edge = (micro - .45) * .20 + (n - .5) * .13;
                if (t > .13 + edge) {
                    let tone = Math.floor(n * 2.8 + micro * 1.7 + core * 1.6);
                    if (Math.abs(t - .47) < .11 && detail !== 1)
                        tone--;
                    if (t > .78)
                        tone++;
                    if (t < .27 + edge)
                        tone--;
                    col = road[Math.min(6, Math.max(0, tone))];
                }
                else if (t > .07 + edge)
                    col = gravel[Math.min(4, Math.floor(n * 4))];
            }
            dst[id] = shore<0 && map==='isles' && ford(y) ? river[6+detail%3] : col;
        }
    }
    g.putImageData(pixels, 0, 0);
    // Coordinates for all the following small objects are in half-size art pixels.
    const rect = (c: string, x: number, y: number, W = 1, H = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(W)), Math.max(1, Math.round(H))); };
    const line = (c: string, x: number, y: number, X: number, Y: number, sz = 1) => {
        const n = Math.max(Math.abs(X - x), Math.abs(Y - y), 1);
        for (let i = 0; i <= n; i++)
            rect(c, x + (X - x) * i / n, y + (Y - y) * i / n, sz, sz);
    };
    const poly = (c: string, ...p: number[]) => {
        const ys = p.filter((_, i) => i % 2 === 1);
        for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
            const cuts: number[] = [];
            for (let i = 0; i < p.length; i += 2) {
                const j = (i + 2) % p.length, a = p[i + 1], b = p[j + 1];
                if ((a <= y + .5 && b > y + .5) || (a > y + .5 && b <= y + .5))
                    cuts.push(p[i] + (p[j] - p[i]) * (y + .5 - a) / (b - a));
            }
            cuts.sort((a, b) => a - b);
            for (let i = 0; i < cuts.length - 1; i += 2) {
                const left = Math.ceil(cuts[i]), right = Math.ceil(cuts[i + 1]);
                if (right > left)
                    rect(c, left, y, right - left);
            }
        }
    };
    function stone(x: number, y: number, s: number, v: number, moss = true) {
        const rx = Math.max(2, s), ry = Math.max(1, Math.round(s * .48)), height = Math.max(2, Math.round(s * (.37 + (v % 4) * .04)));
        poly('#2c3029', x - rx - 2, y - 1, x + rx * .55, y - ry, x + rx + 4, y + 1, x + rx * .55, y + ry + 2, x - rx * .65, y + ry + 1);
        poly('#525449', x - rx, y, x - rx * .73, y - ry - height * .35, x - rx * .2, y - ry - height, x + rx * .47, y - ry - height * .85, x + rx, y - ry * .3, x + rx * .85, y + ry * .5, x + rx * .12, y + ry, x - rx * .75, y + ry * .46);
        poly(moss ? '#888878' : '#929184', x - rx * .77, y - ry - height * .32, x - rx * .22, y - ry - height, x + rx * .44, y - ry - height * .85, x + rx * .46, y - ry * .94, x - rx * .12, y - ry * .4);
        poly('#656a5c', x - rx * .76, y - ry - height * .28, x - rx * .11, y - ry * .4, x + rx * .09, y + ry * .64, x - rx * .7, y + ry * .35);
        line('#a2a18b', x - rx * .4, y - ry - height * .77, x - rx * .04, y - ry - height * .94);
        if (moss && s > 5) {
            rect('#6c714d', x - rx * .36, y - ry - height * .7, rx * .5);
            rect('#595e42', x - rx * .83, y, rx * .43);
        }
        if (s > 10) {
            line('#50574e', x + rx * .2, y - ry - height * .64, x + rx * .1, y - ry * .45);
            line('#50574e', x + rx * .1, y - ry * .45, x + rx * .32, y + ry * .25);
        }
    }
    function farm(X: number, Y: number, W: number, H: number, seed: number) {
        const x = X / 2, y = Y / 2, ww = W / 2, hh = H / 2, slant = ww * .15;
        poly('#3d3c2d', x, y, x + ww, y - 4, x + ww + slant, y + hh - 4, x + slant, y + hh);
        poly('#5b5139', x + 2, y + 2, x + ww - 2, y - 2, x + ww + slant - 2, y + hh - 5, x + slant + 2, y + hh - 2);
        for (let j = 4; j < hh - 2; j += 3) {
            const xx = x + slant * j / hh;
            line('#443f2c', xx + 2, y + j, xx + ww - 2, y + j - 4);
            for (let i = 2; i < ww - 2; i += 3) {
                const v = hash(i, j, seed), yy = y + j - 4 * i / ww;
                if (v % 9 === 0)
                    continue;
                rect(v % 3 ? '#78704a' : '#5c6540', xx + i, yy - 1, 2);
                if (seed % 2 && v % 3)
                    rect('#98905e', xx + i, yy - 2);
            }
        }
        // Low split-rail fences surround the worked strip, with an open lane.
        line('#524732', x - 1, y - 1, x + ww - 1, y - 5);
        for (let i = 0; i < ww; i += 9) {
            const yy = y - 4 * i / ww;
            rect('#4d422e', x + i, yy - 4, 2, 5);
            rect('#99815a', x + i, yy - 4);
        }
        for (let j = 8; j < hh; j += 10) {
            rect('#4d422e', x + slant * j / hh - 1, y + j - 3, 2, 5);
            rect('#99815a', x + slant * j / hh - 1, y + j - 3);
        }
    }
    const lots = [[1070, 687, 105, 52], [1200, 653, 86, 70], [1250, 808, 86, 57], [830, 1470, 91, 58], [912, 1552, 106, 62], [1035, 1550, 75, 49], [2708, 1376, 85, 63], [2805, 1400, 116, 73], [2600, 1300, 76, 54], [2810, 485, 91, 57], [2940, 503, 90, 62], [3040, 608, 77, 65]];
    for (const [i, a] of lots.entries())
        farm(a[0], a[1], a[2], a[3], i + 9);
    const inFarm = (x: number, y: number) => lots.some(([a, b, c, d]) => x >= a - 3 && x <= a + c * 1.15 + 3 && y >= b - 10 && y <= b + d + 3);
    const clear = (x: number, y: number) => !water(x, y) && !rMask[Math.floor(x / 2) + Math.floor(y / 2) * w] && !inFarm(x, y) && Math.min(Math.max(Math.abs(x - 670) / 215, Math.abs(y - 1050) / 160), Math.max(Math.abs(x - 3160) / 215, Math.abs(y - 1050) / 160)) > 1;
    let state = 85063;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    // Thin seams of stratified rock give unoccupied corners a shape at overview zoom.
    for (const [X, Y, length] of [[240, 650, 145], [880, 248, 110], [1220, 570, 140], [1550, 360, 125], [1750, 1130, 85], [200, 1740, 120], [1180, 1960, 120], [2210, 412, 80], [2490, 1640, 135], [2630, 944, 92], [3180, 345, 155], [3540, 1190, 112], [2860, 1920, 115], [3450, 1600, 90]]) {
        for (let k = 0; k < length; k += 8 + random() * 12) {
            const x = X + k, y = Y + Math.sin(k / 36) * 12 - k * .21 + random() * 11;
            if (clear(x, y))
                stone(x / 2, y / 2, 5 + Math.sin(Math.PI * k / length) * 8 + random() * 4, k | 0);
        }
    }
    for (let i = 0; i < 1100; i++) {
        const x = random() * WIDTH, y = random() * HEIGHT;
        if (!clear(x, y) || small(x, y) < .40)
            continue;
        const s = 1 + Math.pow(random(), 3) * 6;
        stone(x / 2, y / 2, s, i);
        if (s > 4)
            stone(x / 2 + s + 2, y / 2 + 1, 2 + (i % 3), i + 1);
    }
    // Broken flagstones and embedded gravel run along the two wagon tracks.
    for (let i = 0; i < 55000; i++) {
        const x = (random() * w) | 0, y = (random() * h) | 0, mask = rMask[x + y * w];
        if (mask < 34 || water(x * 2, y * 2))
            continue;
        const broad = mask > 90 && mask < 180, sw = broad ? 2 + random() * 3 : 1 + random() * 2;
        const col = broad ? '#716750' : '#625944';
        rect(i % 4 === 0 ? '#423d31' : col, x, y, sw);
        if (broad && i % 3 === 0) {
            rect('#827863', x, y - 1, sw - 1);
            rect('#534d3b', x + 1, y + 1, sw);
        }
    }
    for (let i = 0; i < 7900; i++) {
        const x = random() * WIDTH, y = random() * HEIGHT;
        if (!clear(x, y) || medium(x, y) < .37 || woods[Math.floor(x / 2) + Math.floor(y / 2) * w] > 124)
            continue;
        const xx = x / 2, yy = y / 2, m = medium(x, y), largeBush = i % 97 === 0;
        if (largeBush) {
            for (let t = 0; t < 4; t++) {
                const X = xx + random() * 8 - 4, Y = yy + random() * 4 - 2;
                rect('#303929', X - 2, Y - 1, 6, 3);
                rect('#46533a', X - 2, Y - 3, 5, 3);
                rect('#64704a', X - 2, Y - 3, 2);
            }
        }
        else if (i % 43 === 0) {
            line('#403e2e', xx - 4, yy + 1, xx + 4, yy - 2, 2);
            line('#817958', xx - 4, yy, xx + 3, yy - 2);
            line('#726b50', xx, yy - 1, xx + 1, yy - 4);
        }
        else {
            rect('#343c2b', xx + 1, yy + 1, 4);
            rect(m > .5 ? '#6d704a' : '#515c3d', xx, yy - 1, 1, 3);
            rect(m > .5 ? '#7b7950' : '#606a46', xx - 1, yy - 2);
            rect('#5b6442', xx + 2, yy - 1, 1, 2);
            rect('#71734c', xx + 3, yy - 2);
        }
    }
    for (let i = 0; i < 2300; i++) {
        const y = random() * HEIGHT, c = riverX(y), radius = riverWidth(y,map) / 2, side = random() < .5 ? -1 : 1;
        const x = c + (random() * 2 - 1) * radius * .96, xx = x / 2, yy = y / 2;
        if(!water(x,y)) continue;
        const band = Math.abs(x - c) / radius;
        rect(band > .73 ? '#435956' : '#29424b', xx, yy, 1 + random() * 5);
        if (i % 6 === 0) {
            rect(band > .7 ? '#566760' : '#35505a', xx + 2, yy - 1, 2 + random() * 4);
            rect('#203944', xx + 6, yy + 1, 4);
        }
        if (i % 11 === 0) {
            const d = radius + 5 + random() * 21, X = (c + side * d) / 2;
            stone(X, yy, 1 + random() * 4, i);
            if (i % 22 === 0) {
                line('#596347', X - 2, yy, X - 3, yy - 4);
                line('#797951', X, yy, X + 1, yy - 6);
            }
        }
    }
    for (const [y, offset] of [[234, -.46], [490, .62], [845, -.78], [1005, .53], [1190, -.26], [1575, .70], [1778, -.68], [2035, .54]]) {
        const x = (riverX(y) + riverWidth(y,map) / 2 * offset) / 2;
        if(!water(x*2,y)) continue;
        const yy = y / 2;
        for (let i = 0; i < 4; i++) {
            const xx = x + random() * 12, Y = yy + random() * 9;
            for (let j = 0; j < 3; j++)
                rect(['#435e63', '#657873', '#3a565d'][j], xx - 7 + j, Y + 3 + j, 14 - j * 3);
            stone(xx, Y, 3 + random() * 4, i, false);
        }
    }
    const full = document.createElement('canvas');
    full.width = WIDTH;
    full.height = HEIGHT;
    const ctx = full.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(native, 0, 0, WIDTH, HEIGHT);
    cached = full;
    return full;
}
