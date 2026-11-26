import type { Faction } from '../sim/types';
const flags = new Map<string, HTMLCanvasElement>();
// Each column of cloth carries its border, embroidery and tears through the same six folds.
export function banner(f: Faction, frame = 0, burnt = false) {
    const phase = Math.floor(frame) % 6, key = [f, phase, burnt].join('/');
    const known = flags.get(key);
    if (known)
        return known;
    const art = document.createElement('canvas');
    art.width = 48;
    art.height = 64;
    const c = art.getContext('2d')!;
    const silver = f ? '#ba9050' : '#c4d1cf', light = f ? '#e4b779' : '#f0e9cf';
    const dye = f ? ['#491c25', '#69232c', '#8d3036', '#a13b3b'] : ['#172d41', '#203e55', '#31546a', '#42677a'];
    function dot(x: number, y: number, tone: string) {
        const wave = Math.round(Math.sin(x * .14 + phase) * x / 20);
        c.fillStyle = burnt ? (tone === light ? '#827254' : tone === silver ? '#66583f' : ['#272525', '#382c29', '#49342c', '#574033'][(x >> 3) % 4]) : tone;
        if (burnt && x > 24 && y > 25 + (x * 7 % 13) && ((x + y * 2) % 17 < 4 || y > 52 - x % 8))
            return;
        c.fillRect(x, y + wave, 1, 1);
    }
    for (let x = 5; x < 46; x++) {
        const hem = 58 - Math.round(Math.max(0, 15 - Math.abs(x - 25)) * .88) - (x > 36 ? (x * 7) % 8 : 0);
        for (let y = 5; y < hem; y++) {
            const edge = x === 5 || x === 43 || y === 6 || y === hem - 2;
            const fold = Math.min(3, Math.max(0, Math.floor(1.8 + Math.sin(x * .43 + phase * .5) * 1.35)));
            let col = edge ? silver : dye[fold];
            if (y === 10 || x === 9 || x === 40)
                col = dye[3];
            if (!f) {
                const cross = (Math.abs((x - 24) - (y - 28) * .79) < 1.5 || Math.abs((x - 24) + (y - 28) * .79) < 1.5) && y > 14 && y < 42;
                if (cross)
                    col = y > 36 ? '#b49a5b' : silver;
                if (y >= 21 && y <= 32 && x > 13 && x < 36 && y >= 21 + Math.min((x - 14) % 6, 6 - (x - 14) % 6) * 2)
                    col = y === 30 ? light : silver;
                if (y === 33 && x >= 15 && x <= 34)
                    col = '#869491';
                if (y >= 38 && y <= 40 && (x >= 12 && x <= 19 || x >= 29 && x <= 36))
                    col = '#ac915a';
            }
            else {
                const dx = x - 25, dy = y - 27, r = Math.hypot(dx, dy);
                if (Math.abs(r - 13) < 1.7 || r < 17 && r > 12 && ((Math.atan2(dy, dx) + 6.3) * 2.05) % 1 < .16)
                    col = r > 13 ? silver : '#201d20';
                if (r < 8.5)
                    col = '#bb4837';
                if (Math.abs(dx) < 5 && dy > -5 && dy < 4 || Math.abs(dx) < 3 && dy >= 4 && dy <= 7)
                    col = '#d4c9a6';
                if (dy === 0 && (dx === -3 || dx === 2) || dy === 3 && dx === 0)
                    col = '#41272a';
            }
            dot(x, y, col);
        }
    }
    c.fillStyle = '#503b29';
    c.fillRect(2, 1, 3, 63);
    c.fillStyle = '#c4a366';
    c.fillRect(2, 1, 1, 63);
    c.fillStyle = light;
    c.fillRect(1, 2, 5, 3);
    c.fillRect(3, 0, 2, 7);
    flags.set(key, art);
    return art;
}
export function flagImage(f: Faction, burnt = false) {
    const c = banner(f, 0, burnt), img = document.createElement('img');
    img.src = c.toDataURL();
    img.className = 'heraldry';
    img.alt = f ? '赤棘血朝纹章' : '铁冠北境纹章';
    return img;
}
