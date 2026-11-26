import {portrait} from '../src/client/portraits';
import { Renderer, type Overlay } from '../src/client/renderer';
import { SimWorld } from '../src/sim/world';
import { KINDS } from '../src/sim/config';
import { sprite, spritePalette } from '../src/client/spriteBaker';
import { banner } from '../src/client/banners';
export function pixelTest() {
    const portraits=new Set<string>();
    const images = new Set<string>();
    for (const k of KINDS)
        for (const f of [0, 1] as const) {
            for (const frame of [0, 1, 2]) {
                const c = sprite(k, f, frame);
                if (c.width < 4 || c.height < 4)
                    throw Error(k);
            }
            const art=portrait(k,f);if(art.width!==48||art.height!==48)throw Error('portrait size');portraits.add(art.toDataURL());
            images.add(sprite(k, f).toDataURL());
            if (spritePalette(k, f).length < 4)
                throw Error('精灵色表 ' + k);
        }
    const wave = new Set(Array.from({ length: 6 }, (_, i) => banner(0, i).toDataURL()));
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:480px;height:280px';
    document.body.append(canvas);
    const r = new Renderer(canvas, document.createElement('canvas')), cam = r.camera, w = new SimWorld(4);
    const overlay: Overlay = { selected: new Set(), box: null, hover: null, build: null, faction: 0, order: null };
    cam.x = 1460;
    cam.y = 920;
    cam.zoom = .75;
    r.draw(w, overlay, false);
    const e = { x: 1460, y: 920, faction: 0 as const, kind: 'bannerman' as const, type: 'death' as const };
    r.vfx.consume([e]);
    for (let i = 0; i < 16; i++)
        r.vfx.update(1 / 30);
    const marks = r.decals.marks.length;
    if (r.vfx.snapshot().some(p => p.mode === 1 || p.mode === 8) || !r.decals.marks.some(m => m[4] === 'flag'))
        throw Error('倒旗或落地印章超时');
    function sample(x = 194) { r.draw(w, overlay, false); return r.c.getImageData(x, 95, 92, 86).data; }
    const first = sample();
    let panErrors = 0, zoomErrors = 0, impactErrors = 0;
    cam.x += 40;
    const pan = sample(164);
    for (let i = 0; i < pan.length; i++)
        if (pan[i] !== first[i])
            panErrors++;
    cam.x -= 40;
    cam.scale(.8);
    sample();
    cam.scale(1.25);
    const back = sample();
    for (let i = 0; i < back.length; i++)
        if (back[i] !== first[i])
            zoomErrors++;
    r.vfx.consume([{ type: 'impact', x: 300, y: 400, power: 9, kind: 'field_cannon' }]);
    for (let j = 0; j < 5; j++) {
        r.vfx.update(1 / 30);
        const after = sample();
        for (let i = 0; i < after.length; i++)
            if (after[i] !== back[i])
                impactErrors++;
    }
    canvas.remove();
    return { portraitCount:portraits.size,spriteCount: images.size, flagFrames: wave.size, marks, panErrors, zoomErrors, impactErrors };
}
