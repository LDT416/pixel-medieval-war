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
    for(let x=5;x<46;x++)for(let y=5;y<32;y++){
        const nx=(x-5)/40,ny=(y-5)/26,diag=Math.min(Math.abs(nx-ny),Math.abs(1-nx-ny));
        const red='#cc2b2b',white='#f4eedf',blue='#2653ae';
        let color=f?(diag<.035?red:diag<.115?white:blue):nx<.33?blue:nx<.67?white:red;
        if(f&&(Math.abs(nx-.5)<.11||Math.abs(ny-.5)<.17))color=white;
        if(f&&(Math.abs(nx-.5)<.062||Math.abs(ny-.5)<.10))color=red;
        dot(x,y,color);
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
    img.alt = f ? '英格兰米字旗' : '法兰西三色旗';
    return img;
}
