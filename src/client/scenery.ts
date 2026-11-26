import type { Faction, Structure } from '../sim/types';
import { bastionOffsets } from '../sim/maps';
import { artwork } from './artLoader';
import { banner } from './banners';

const paved = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const bridges = new Map<number, HTMLCanvasElement>();

// Keep the supplied stone arch as the near face. Continue its parapet behind
// a walkable cobblestone deck as wide as the formations' simulation footprint.
function bridgeWithDeck(image: HTMLImageElement, depth: number) {
    const cached = bridges.get(depth);
    if (cached) return cached;
    const tile = document.createElement('canvas');
    tile.width = image.naturalWidth;
    tile.height = image.naturalHeight + depth;
    const g = tile.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    // Surveyed upper silhouette of px_bridge, in its native 116-pixel grid.
    // Ranges retain the interrupted end posts and original raised crown.
    const crestRuns = [
        [1,32],[2,31],[1,5],[8,4],[2,5],[5,9],[4,8],[4,7],[3,5],[4,4],
        [5,3],[1,2],[5,1],[27,0],[5,1],[5,3],[4,4],[3,5],[4,7],[4,8],
        [5,9],[1,10],[1,11],[1,5],[8,4],[2,5],[1,32]
    ];
    const surface = g.createImageData(tile.width, tile.height);
    const pixels = surface.data;
    let x = 0;
    for (const [length, crest] of crestRuns) {
        for (let offset = 0; offset < length; offset++, x++) {
            for (let y = 5; y <= depth + 1; y++) {
                const row = Math.floor(y/4), shifted = x + (row % 2)*4;
                const joint = y % 4 === 0 || shifted % 8 === 0;
                const variation = (row*11 + Math.floor(shifted/8)*17) % 7;
                const tone = (x<3 || x>tile.width-4 ? 96 : joint ? 122 : 143) + variation*2;
                const i = ((crest+y)*tile.width+x)*4;
                pixels[i] = tone+12; pixels[i+1] = tone+4; pixels[i+2] = tone-13; pixels[i+3] = 255;
            }
        }
    }
    g.putImageData(surface, 0, 0);
    x = 0;
    for (const [length, crest] of crestRuns) {
        g.drawImage(image, x, crest, length, 5, x, crest, length, 5);
        x += length;
    }
    g.drawImage(image, 0, depth);
    bridges.set(depth, tile);
    return tile;
}

// Native scanline runs of the two open yards. Each band is [top, bottom,
// left, right, ...] inclusive. Roofs, doors and exterior alpha stay intact.
const courtyards = {
    barracks: [
        [56,56,30,46,77,93], [57,57,30,46,60,63,77,93], [58,58,30,93],
        [59,59,30,52,54,69,71,93], [60,60,31,52,54,69,71,92],
        [61,61,31,51,54,69,72,92], [62,62,31,51,54,68,72,92],
        [63,63,31,51,72,92], [64,64,31,51,73,92], [65,65,31,49,74,92],
        [66,66,31,47,76,92], [67,69,31,46,77,92]
    ],
    farmhouse: [
        [46,46,41,60,74,75], [47,59,41,86], [60,60,41,50,52,71,73,86],
        [61,61,40,49,53,70,74,86], [62,62,40,49,75,86], [63,63,40,46,78,87],
        [64,64,40,45,79,87], [65,68,40,44,79,87], [69,72,40,45,79,87],
        [73,77,40,45,78,87]
    ]
};

function pavedCourtyard(image: HTMLImageElement, kind: keyof typeof courtyards) {
    const cached = paved.get(image);
    if (cached) return cached;
    const tile = document.createElement('canvas');
    tile.width = image.naturalWidth;
    tile.height = image.naturalHeight;
    const g = tile.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    const bitmap = g.createImageData(tile.width, tile.height), pixels = bitmap.data;
    for (const [top, bottom, ...spans] of courtyards[kind]) {
        for (let y = top; y <= bottom; y++) {
            const row = Math.floor(y / 3);
            for (let span = 0; span < spans.length; span += 2) {
                for (let x = spans[span]; x <= spans[span + 1]; x++) {
                    const shifted = x + (row % 2) * 3, column = Math.floor(shifted / 6);
                    const joint = y % 3 === 0 || shifted % 6 === 0;
                    const tone = (joint ? 127 : 145) + ((row*17 + column*31) % 7)*2;
                    const i = (x + y * tile.width) * 4;
                    pixels[i] = tone + 9; pixels[i+1] = tone + 3; pixels[i+2] = tone - 12; pixels[i+3] = 255;
                }
            }
        }
    }
    g.putImageData(bitmap, 0, 0);
    g.globalCompositeOperation = 'destination-over';
    g.drawImage(image, 0, 0);
    paved.set(image, tile);
    return tile;
}
// All artwork is baked into the stationary ground layer; unit feet and the top
// of the visible parapets share the same world coordinates as the simulation.
export function drawStructure(ctx: CanvasRenderingContext2D, s: Structure, _tick = 0) {
    if (s.hp <= 0) return;
    const kind = s.type === 'tree' ? s.treeArt ?? 'oak' : s.type === 'keep' ? 'starfort' : s.type;
    const image = artwork.get('px_' + kind);
    if (!image) return;
    ctx.imageSmoothingEnabled = false;
    if (s.type === 'bridge') {
        const scale = s.w / image.naturalWidth;
        const depth = Math.ceil(s.h / scale), deck = bridgeWithDeck(image, depth);
        ctx.drawImage(deck, Math.round(s.x - s.w/2), Math.round(s.y - (depth/2 + 7)*scale),
            Math.round(s.w), Math.round(deck.height*scale));
        return;
    }
    let width = s.w, height = s.h, base = .5;
    if (s.type === 'tree') {
        const scale = s.scale ?? 1;
        width = Math.round(image.naturalWidth * scale);
        height = Math.round(image.naturalHeight * scale);
        base = .9;
        // Small, displaced lozenges break the shadow into visible clusters of pixels.
        const shadeWidth = Math.round(width * .68);
        const left = Math.round(s.x - shadeWidth * .32), y = Math.round(s.y);
        ctx.fillStyle = '#26352260';
        ctx.fillRect(left + 6, y - 8, shadeWidth - 9, 4);
        ctx.fillRect(left, y - 4, shadeWidth, 7);
        ctx.fillRect(left + 5, y + 3, shadeWidth - 8, 4);
        ctx.fillStyle = '#34463270';
        ctx.fillRect(left + 14, y + 7, Math.max(3, shadeWidth - 21), 3);
    } else if (s.type === 'keep') {
        width = 560;
        height = 520;
    } else if (s.type === 'barracks') {
        width = 300;
        height = 240;
    } else if (s.type === 'windmill' || s.type === 'church' || s.type === 'ruins' || s.type === 'haystack' || s.type === 'tents') {
        base = .76;
        const sw = Math.round(width * .72), sh = Math.max(8, Math.round(height * .16));
        ctx.fillStyle = '#24322055';
        ctx.fillRect(Math.round(s.x - sw * .46), Math.round(s.y - sh * .2), sw, sh);
    }

    const x = Math.round(s.x), top = Math.round(s.y - height * base);
    const sprite = s.type === 'barracks' || s.type === 'farmhouse' ? pavedCourtyard(image, s.type) : image;
    if (s.flip) {
        ctx.save();
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -Math.round(width / 2), top, width, height);
        ctx.restore();
    } else {
        ctx.drawImage(sprite, x - Math.round(width / 2), top, width, height);
    }
}

export function drawFortCannons(ctx: CanvasRenderingContext2D, fort: Structure, tick: number) {
    if (fort.type !== 'keep' || fort.faction === -1 || fort.hp <= 0) return;
    const f = fort.faction as Faction;
    const offsets = bastionOffsets(f);
    const defaultDx = f === 0 ? 1 : -1;
    const coat = f === 0 ? '#325a96' : '#b23b32';
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < offsets.length; i++) {
        const cx = Math.round(fort.x + offsets[i].x);
        const cy = Math.round(fort.y + offsets[i].y);
        const aim = fort.cannonAim?.[i];
        const dx = aim ? aim.x : defaultDx;
        const dy = aim ? aim.y : 0;
        const ang = Math.atan2(dy, dx);
        const age = aim ? tick - aim.firedAt : 999;
        const recoil = age >= 0 && age < 14 ? (1 - age / 14) * 5.5 : 0;

        // Bastion stone emplacement platform
        ctx.fillStyle = '#2a2c2866';
        ctx.fillRect(cx - 12, cy - 8, 24, 18);
        ctx.fillStyle = '#6f6b60';
        ctx.fillRect(cx - 10, cy - 9, 20, 16);
        ctx.fillStyle = '#928c7c';
        ctx.fillRect(cx - 8, cy - 7, 16, 12);

        // Miniature artilleryman operating the bastion cannon
        const gx = cx + (dx >= 0 ? -9 : 6), gy = cy - 4;
        ctx.fillStyle = '#1e2024';
        ctx.fillRect(gx, gy - 5, 3, 2); // shako
        ctx.fillStyle = '#e8c4a0';
        ctx.fillRect(gx, gy - 3, 3, 2); // face
        ctx.fillStyle = coat;
        ctx.fillRect(gx, gy - 1, 3, 4); // coat
        ctx.fillStyle = '#d8d4ca';
        ctx.fillRect(gx, gy + 3, 3, 3); // trousers

        // Rotating wooden carriage + heavy brass barrel with recoil
        ctx.save();
        ctx.translate(cx, cy - 1);
        ctx.rotate(ang);
        ctx.fillStyle = '#4e3522';
        ctx.fillRect(-8 - recoil, -5, 11, 10);
        ctx.fillStyle = '#241a14';
        ctx.fillRect(-6 - recoil, -7, 6, 2);
        ctx.fillRect(-6 - recoil, 5, 6, 2);
        ctx.fillStyle = '#a8833e';
        ctx.fillRect(-5 - recoil, -3, 18, 6);
        ctx.fillStyle = '#d8b464';
        ctx.fillRect(-4 - recoil, -2, 16, 2);
        ctx.fillStyle = '#684e22';
        ctx.fillRect(11 - recoil, -4, 3, 8); // muzzle ring
        if (age >= 0 && age <= 4) {
            ctx.fillStyle = 'rgba(255, 248, 204, 0.92)';
            ctx.fillRect(14, -4, 9 - age, 8);
            ctx.fillStyle = 'rgba(255, 255, 245, 0.95)';
            ctx.fillRect(15, -2, 5, 4);
        }
        ctx.restore();
    }
}

export function drawFortFlag(ctx: CanvasRenderingContext2D, s: Structure, tick: number) {
    if (s.type !== 'keep' || s.faction === -1 || s.hp <= 0) return;
    ctx.imageSmoothingEnabled = false;
    const flag = banner(s.faction, Math.floor(tick / 5));
    ctx.drawImage(flag, Math.round(s.x - 4), Math.round(s.y - 216), 47, 63);
}
