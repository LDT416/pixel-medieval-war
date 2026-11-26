import {artRevision} from './artLoader';
import {banner} from './banners';
import {BUILDINGS} from '../sim/buildings';
import {UNITS} from '../sim/config';
import { Camera } from './camera';
import { DecalLayer } from './decalLayer';
import { VfxPool } from './vfxPool';
import { sprite } from './spriteBaker';
import { drawStructure } from './scenery';
import { bakeTerrain } from './terrain';
import { HEIGHT, WIDTH,supplyBend } from '../sim/maps';
import { indexAt } from '../sim/grid';
import { SimWorld } from '../sim/world';
import type { BuildType, Faction, Point, Unit } from '../sim/types';
const colors = ['#558fca', '#cb5047'];
export interface Overlay {
    selected: Set<number>;
    box: {
        start: Point;
        end: Point;
    } | null;
    hover: Point | null;
    build: BuildType | null;
    faction: Faction;
    order: Point | null;
}
export class Renderer {
    c: CanvasRenderingContext2D;
    camera = new Camera();
    decals = new DecalLayer();
    vfx = new VfxPool(this.decals);
    ground?: HTMLCanvasElement;
    private landscape = document.createElement('canvas');
    private artVersion=-1;
    private fixedRevision = -1;
    private fixedWorld?: SimWorld;
    private miniTerrain = document.createElement('canvas');
    constructor(public canvas: HTMLCanvasElement, public mini: HTMLCanvasElement) {
        this.c = canvas.getContext('2d', { alpha: false })!;
        this.landscape.width = WIDTH;
        this.landscape.height = HEIGHT;
        this.mini.width = 216;
        this.mini.height = 112;
        this.miniTerrain.width = 216;
        this.miniTerrain.height = 112;
        this.resize();
    }
    resize() { const rect = this.canvas.getBoundingClientRect(), w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height)); if (this.canvas.width !== w || this.canvas.height !== h || !this.camera.initialized) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.camera.resize(w, h);
        this.c.imageSmoothingEnabled = false;
    } }
    reset(w: SimWorld) { this.fixedRevision = -1; this.vfx.reset(); this.decals.clear(); for (const s of w.structures)
        if (s.hp <= 0)
            this.decals.event({ type: 'collapse', x: s.x, y: s.y, structure: s }); }
    private bake(w: SimWorld) {
        const ctx = this.landscape.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        this.ground=bakeTerrain(w.map);
        ctx.drawImage(this.ground, 0, 0);
        for(const farm of w.structures)if(farm.type==='house'&&farm.hp>0&&farm.faction!==-1){
            const keep=w.keep(farm.faction);if(!keep)continue;
            const bend=supplyBend(farm,keep);
            ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
            for(const [width,color] of [[18,'#8c795d'],[13,'#afa080']] as const){
                ctx.lineWidth=width;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(farm.x,farm.y+24);
                ctx.lineTo(bend.x,bend.y);ctx.lineTo(keep.x,keep.y);ctx.stroke();
            }
            ctx.restore();
        }
        const shade=ctx.createRadialGradient(0,0,0,0,0,70);
        shade.addColorStop(0,'#23302160');shade.addColorStop(1,'#29382000');
        for(const t of w.structures)if(t.type==='tree'&&t.hp>0){
            ctx.save();ctx.translate(t.x,t.y);ctx.scale(1,.73);ctx.fillStyle=shade;ctx.fillRect(-70,-70,140,140);ctx.restore();
        }
        const ordered = [...w.structures].sort((a, b) => a.y - b.y);
        for (const s of ordered)
            if (!['keep', 'tower', 'redoubt','windmill','farmhouse'].includes(s.type))
                drawStructure(ctx, s, 0);
        const mini = this.miniTerrain.getContext('2d')!;
        mini.imageSmoothingEnabled = false;
        mini.drawImage(this.landscape, 0, 0, 216, 112);
        ctx.drawImage(this.decals.canvas,0,0);
        this.decals.composite=ctx;
        this.artVersion=artRevision;
        this.fixedRevision = w.revision;
        this.fixedWorld = w;
    }
    private unit(u: Unit, tick: number, selected: boolean, now: number) {
        const c = this.c, isSiege = UNITS[u.kind].traits.includes('siege');
        const frame=u.squareSide===1?'braceSouth':u.squareSide===3?'braceNorth':u.gun?(u.swing?'reload':u.pose):u.kind==='sapper'&&u.swing?'bayonet':u.pose;
        const art=sprite(u.kind,u.faction,frame,(this.vfx.flashes.get(u.id)??0)>now),scale=isSiege?1.7:1.26;
        const wid = art.width * scale, h = art.height * scale, x = Math.round(u.x), y = Math.round(u.y);
        c.fillStyle = '#141a1544';
        c.fillRect(x - wid * .42, y - 2, wid * .84, 5);
        c.fillStyle = '#141a1599';
        c.fillRect(x - wid * .32, y - 1, wid * .64, 3);
        if (selected) {
            c.strokeStyle = '#e7c475';
            c.lineWidth = 2;
            c.strokeRect(x - wid * .56, y - 3, wid * 1.12, 6);
        }
        c.save();
        c.translate(x, y - u.z);
        c.scale(u.face, 1);
        if (u.z > 5 && !u.tower)
            c.rotate((tick + u.id) * .23);
        if(u.crew!==undefined){
            c.fillStyle='#b9a677';for(let i=0;!u.moving&&i<6;i++)c.fillRect(-25+i*9,-2+i%2*3,8,4);
            c.fillStyle='#342e26';c.fillRect(-18,-h-7,36,4);
            c.fillStyle='#e6c36b';c.fillRect(-18,-h-7,36*Math.max(0,1-u.cooldown/UNITS[u.kind].reload),3);
            if(!u.crew)c.filter='brightness(.45)';
        }
        c.drawImage(art, -wid / 2, -h, wid, h);
        if(u.kind==='horse_artillery'&&u.moving){
            c.drawImage(sprite('dragoon',u.faction,frame),15,-20,24,20);
            c.fillStyle='#8c7655';c.fillRect(6,-6,18,1);
        }
        if(u.gun){
            c.fillStyle='#b9a580';c.fillRect(0,-12+(u.swing?3:0),16,2);c.fillStyle='#ece8dc';c.fillRect(13,-14+(u.swing?3:0),5,5);
        }
        if(u.cargo){c.fillStyle=u.resource==='gold'?'#907442':'#775735';c.fillRect(-9,-17,8,10);c.fillStyle=u.resource==='gold'?'#c3a564':'#a08760';c.fillRect(-9,-17,7,3);}
        if(u.commandRole==='flag') c.drawImage(banner(u.faction,Math.floor(tick/7)),0,-70,40,70);
        const beat=Math.floor(tick/8)%2;
        if(u.commandRole==='drum'){
            c.fillStyle='#493122';c.fillRect(0,-16,14,12);c.fillStyle='#c09a51';c.fillRect(0,-17,14,3);c.fillRect(0,-7,14,2);
            for(let i=0;i<3;i++){c.fillStyle='#957146';c.fillRect(i*5+1,-14,2,7);}
            c.fillStyle='#dbbf88';c.fillRect(1,-22+beat*4,8,2);c.fillRect(10,-18-beat*4,7,2);
        }else if(u.escort==='horn'){c.fillStyle='#c6a15c';c.fillRect(4,-20-beat,16,3);c.fillRect(18,-23-beat,5,7);c.fillStyle='#e4c682';c.fillRect(21,-25-beat,3,10);}
        c.restore();
    }
    private plaque(x: number, y: number, text: string, f: number, small = false) {
        const c = this.c, p = this.camera.screen({ x, y });
        c.save();
        c.font = (small ? '11px' : 'bold 13px') + ' "Microsoft YaHei", sans-serif';
        const width = Math.ceil(c.measureText(text).width) + (small ? 18 : 34);
        const px = Math.round(p.x - width / 2) + .5, py = Math.round(p.y) + .5;
        if (px + width < 0 || py < 0 || px > this.canvas.width || py > this.canvas.height) {
            c.restore();
            return;
        }
        c.fillStyle = small ? '#181c19b8' : '#15191bf2';
        c.fillRect(px, py, width, small ? 20 : 25);
        c.strokeStyle = small ? '#756c5277' : f === 0 ? '#56758a' : '#895e4b';
        c.lineWidth = 1;
        c.strokeRect(px, py, width, small ? 20 : 25);
        if (!small) {
            c.fillStyle = colors[f];
            c.fillRect(px + 8, py + 6, 7, 9);
            c.fillRect(px + 10, py + 15, 3, 2);
        }
        c.fillStyle = small ? '#c2bca2' : '#e6e2d2';
        c.textBaseline = 'middle';
        c.fillText(text, px + (small ? 9 : 23), py + (small ? 10 : 12));
        c.restore();
    }
    draw(w: SimWorld, o: Overlay, redrawMini: boolean) {
        this.resize();
        if (this.fixedRevision !== w.revision || this.fixedWorld !== w || this.artVersion!==artRevision)
            this.bake(w);
        const cam = this.camera, c = this.c, s = cam.zoom, top = cam.world(0, 0);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.fillStyle = '#20271f';
        c.fillRect(0, 0, cam.w, cam.h);
        const tx=Math.round(-Math.floor(top.x)*s), ty=Math.round(-Math.floor(top.y)*s);
        c.setTransform(s,0,0,s,tx,ty);
        const cw = cam.w / s, ch = cam.h / s;
        // One sample grid for the terrain and all permanent ground marks.
        c.imageSmoothingEnabled=false;
        c.drawImage(this.landscape,0,0);
        c.imageSmoothingEnabled=false;
        for(const a of w.fires){
            const phase=(Math.floor(w.tick/4)+a.x)%5;
            for(let i=0;i<5;i++){const x=a.x+i*7-16,y=a.y+(i%3)*5;
                c.fillStyle='#543630';c.fillRect(x+phase,y-23,8,10);
                c.fillStyle='#ad4f27';c.fillRect(x,y-12-phase,7,12+phase);c.fillStyle='#dd8d40';c.fillRect(x+2,y-6,4,6);}
        }
        for(const b of w.barrels){c.fillStyle='#725037';c.fillRect(b.x-5,b.y-11,10,12);c.fillStyle='#968476';c.fillRect(b.x-5,b.y-8,10,2);c.fillStyle='#f7aa55';c.fillRect(b.x,b.y-14,3,3);}
        for(const d of w.drops){c.fillStyle=d.resource==='gold'?'#b8994a':'#926d43';c.fillRect(d.x-3,d.y-2,7,4);}

        for (const t of w.structures)
            if (t.hp > 0 && ['keep', 'tower', 'redoubt','windmill','farmhouse'].includes(t.type))
                drawStructure(c, t, w.tick);
        // 残血要塞/箭塔/农舍升腾高空战火黑烟柱与跳动橘红火舌
        for (const t of w.structures) {
            if (t.hp <= 0 || !t.maxHp || t.hp >= t.maxHp * .68 || t.type === 'tree' || t.type === 'mine')
                continue;
            const dmg = 1 - t.hp / t.maxHp, plumes = t.type === 'keep' ? 4 : 2;
            for (let i = 0; i < plumes; i++) {
                const cycle = ((w.tick * 1.4 + t.id * 17 + i * 29) % 48);
                const sx = Math.round(t.x + (i - (plumes - 1) / 2) * 26 + Math.sin((w.tick + i * 19) * .08) * 6);
                const sy = Math.round(t.y - t.h * .65 - cycle * 1.65);
                c.fillStyle = cycle < 14 ? '#e06b24' : cycle < 26 ? '#453c38' : '#2c2928';
                c.globalAlpha = Math.max(.18, (.78 - cycle / 62) * (.55 + dmg * .45));
                const sz = 7 + Math.floor(cycle * .22);
                c.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
                if (cycle < 10) {
                    c.fillStyle = '#ffd15c';
                    c.fillRect(sx - 2, sy - 2, 4, 5);
                }
            }
            c.globalAlpha = 1;
        }
        for(const t of w.structures){
            if(t.hp<=0) continue;
            const first=t.queue?.[0], progress=t.needed?(t.work??0)/t.needed:first?first.progress/first.total:0;
            if(progress||first){c.fillStyle='#201f1b';c.fillRect(t.x-26,t.y-t.h-10,52,6);c.fillStyle='#c5a369';c.fillRect(t.x-25,t.y-t.h-9,Math.round(progress*50),4);}
        }
        const now = performance.now();
        for (const u of w.units) {
            if (u.x < top.x - 65 || u.x > top.x + cw + 65 || u.y < top.y - 65 || u.y - u.z > top.y + ch + 65)
                continue;
            if(u.hp<=0)continue;
            if(u.tower){
                if(w.tick-(u.firedAt??-99)<6){
                    const position=Math.round(u.y-u.z);
                    c.fillStyle=colors[u.faction];c.fillRect(u.x-2,position-2,5,3);
                    c.fillStyle='#d9b288';c.fillRect(u.x+u.face*2,position-4,3,2);
                    c.fillStyle='#6d6051';c.fillRect(u.face>0?u.x+3:u.x-12,position,10,2);
                }
                continue;
            }
            this.unit(u, w.tick, o.selected.has(u.id), now);
        }
        for (const p of w.projectiles) {
            const y = p.y - p.z;
            c.fillStyle = '#14191499';
            c.fillRect(p.x - 3, p.y, 7, 3);
            if (['arrow','bullet','bolt','spear','rocket','pellet'].includes(p.kind)) {
                c.strokeStyle = p.kind==='rocket'?'#db813d':p.kind==='spear'?'#c2c6b8':p.kind === 'bullet' ? '#ffc873' : '#c1b9a2';
                c.lineWidth = p.kind === 'bullet' ? 3 : 2;
                c.beginPath();
                c.moveTo(p.x, y);
                c.lineTo(p.x - p.vx * .7, y - (p.vy - p.vz) * .7);
                c.stroke();
            }
            else {
                c.fillStyle = p.kind === 'stone' ? '#363938' : '#201f20';
                c.fillRect(p.x - 6, y - 5, 12, 10);
                c.fillStyle = '#9a988a';
                c.fillRect(p.x - 5, y - 5, 6, 3);
            }
        }
        if(o.selected.size){const leader=w.units.find(u=>o.selected.has(u.id));
            if(leader){c.fillStyle='#1c2d25';c.fillRect(leader.x-25,leader.y-65,52,17);c.fillStyle='#f8d989';c.font='12px sans-serif';c.fillText('⚑ '+o.selected.size,leader.x-20,leader.y-52);}}
        this.vfx.draw(c);
        if (o.build && o.hover) {
            const b = w.blueprint(o.build, o.hover, o.faction), t = b.structure, col = b.valid ? '#d7c389' : '#e25a51';
            c.save();
            c.globalAlpha = .55;
            drawStructure(c, t, w.tick);
            c.restore();
            c.fillStyle = b.valid ? '#a8b78944' : '#c4423844';
            c.fillRect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h);
            c.strokeStyle = col;
            c.lineWidth = 2 / s;
            c.strokeRect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h);
            c.lineWidth = 1 / s;
            for (let x = t.x - t.w / 2 + 16; x < t.x + t.w / 2; x += 16)
                c.fillRect(x, t.y - t.h / 2, 1 / s, t.h);
            for (let y = t.y - t.h / 2 + 16; y < t.y + t.h / 2; y += 16)
                c.fillRect(t.x - t.w / 2, y, t.w, 1 / s);
        }
        if (o.order) {
            c.strokeStyle = '#d8bd7b';
            c.lineWidth = 2 / s;
            c.beginPath();
            c.arc(o.order.x, o.order.y, 18, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = '#e4c479';
            c.fillRect(o.order.x - 4, o.order.y - 4, 8, 8);
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        for (const t of w.structures)
            if (t.type === 'keep' && t.hp > 0)
                this.plaque(t.x, t.y + t.h * .64, t.faction === 0 ? '法兰西星堡' : '英格兰星堡', t.faction);
        if (cam.zoom < cam.base * 1.7)
            for(const t of w.structures) if(t.hp>0&&(t.type==='bridge'||t.type==='pontoon'))
                this.plaque(t.x,t.y-100,t.type==='pontoon'?'临时浮桥':t.y<1080?'北境石桥':'南境石桥',0,true);
        for(const t of w.structures)if(t.hp>0&&['farmhouse','windmill','redoubt'].includes(t.type)){
            const n=w.units.filter(u=>u.tower===t.id).length;
            this.plaque(t.x,t.y+t.h*.52,(t.type==='farmhouse'?'拉海圣农庄':t.type==='windmill'?'高地风车':'沙袋炮台')+(n?' · '+n+'/60':''),t.faction,true);
        }
        if(o.hover){
            const t=w.byStructure.get(w.grid.blockers[indexAt(o.hover.x,o.hover.y)]);
            if(t&&t.hp>0&&(t.type==='mine'||t.type in BUILDINGS))this.plaque(t.x,t.y-t.h-18,t.type==='mine'?'金矿余量 '+t.stock:BUILDINGS[t.type as BuildType][0]+' · '+Math.ceil(t.hp)+' HP',0,true);
        }
        if (o.box) {
            const a = o.box.start, b = o.box.end;
            c.fillStyle = '#d4b46b24';
            c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
            c.strokeStyle = '#dfc584';
            c.strokeRect(a.x + .5, a.y + .5, b.x - a.x, b.y - a.y);
        }
        if (redrawMini)
            this.minimap(w);
    }
    private minimap(w: SimWorld) {
        const c = this.mini.getContext('2d')!, mw = this.mini.width, mh = this.mini.height, rx = mw / WIDTH, ry = mh / HEIGHT;
        c.drawImage(this.miniTerrain, 0, 0);
        for (const u of w.units) {
            c.fillStyle = colors[u.faction];
            c.fillRect(u.x * rx, u.y * ry, 1.6, 1.6);
        }
        for (const t of w.structures)
            if (t.type === 'keep' && t.hp > 0) {
                c.fillStyle = colors[t.faction];
                c.fillRect(t.x * rx - 3, t.y * ry - 3, 6, 6);
                c.strokeStyle = '#d5c69d';
                c.strokeRect(t.x * rx - 3, t.y * ry - 3, 6, 6);
            }
        const cam = this.camera, t = cam.world(0, 0);
        c.strokeStyle = '#e9d6a3';
        c.lineWidth = 1;
        c.strokeRect(t.x * rx + .5, t.y * ry + .5, cam.w / cam.zoom * rx - 1, cam.h / cam.zoom * ry - 1);
    }
}
