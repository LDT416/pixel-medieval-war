import type { Faction, Kind } from '../sim/types';
import { banner } from './banners';

export const pixelArt = [
    'cover_1815', 'oak', 'beech', 'spruce', 'bush', 'hedge', 'bridge',
    'starfort', 'barracks', 'farmhouse', 'redoubt',
    'windmill', 'church', 'haystack', 'ruins', 'pond', 'tents'
] as const;

const bandPortraits = new Map<Faction, string>();
function bandPortrait(faction: Faction) {
    const saved = bandPortraits.get(faction);
    if (saved) return saved;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#202a2a';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#354044';
    ctx.fillRect(3, 3, 58, 58);
    ctx.drawImage(banner(faction, 0), 7, 3, 55, 59);
    const ink = (color: string, x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    };
    ink('#202326', 27, 40, 30, 19);
    ink('#944533', 29, 42, 26, 15);
    for (let x = 29; x < 54; x += 8) {
        for (let j = 0; j < 8; j++) ink('#dbb86a', x + j, 43 + Math.min(j, 7 - j) * 3, 1, 3);
    }
    ink('#b68143', 26, 39, 31, 4);
    ink('#e8d6a1', 28, 38, 27, 3);
    ink('#d1a95e', 28, 56, 27, 2);
    for (let i = 0; i < 11; i++) ink('#e4c899', 31 + i * 2, 34 - i, 3, 1);
    const url = canvas.toDataURL();
    bandPortraits.set(faction, url);
    return url;
}

export function portraitKey(kind: Kind, faction: Faction) {
    if (kind === 'line_infantry') return faction ? 'portrait_line_gb' : 'portrait_line_fr';
    if (kind === 'bannerman') return faction ? 'portrait_band_gb' : 'portrait_band_fr';
    return 'portrait_' + kind;
}

export function artPath(name: string) {
    if (name === 'portrait_band_fr' || name === 'portrait_band_gb') return bandPortrait(name.endsWith('_gb') ? 1 : 0);
    return './art/' + name + (name.startsWith('px_') ? '.png' : '.webp');
}

const keys = [
    ...pixelArt.map(name => 'px_' + name),
    'portrait_line_fr', 'portrait_line_gb', 'portrait_guard_grenadier',
    'portrait_cuirassier', 'portrait_field_cannon', 'portrait_band_fr', 'portrait_band_gb'
];
export const artwork = new Map<string, HTMLImageElement>();
export let artRevision = 0;
export const artReady: Promise<void> = Promise.all(keys.map(async key => {
    const img = new Image();
    img.src = artPath(key);
    try {
        await img.decode();
    } catch {
        throw new Error('素材加载失败：' + key);
    }
    artwork.set(key, img);
})).then(() => { artRevision++; });
export const preloaded = artReady;
