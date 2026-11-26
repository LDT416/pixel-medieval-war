import type { SimEvent } from '../sim/types';
import { DecalLayer } from './decalLayer';
import {banner} from './banners';
import { spritePalette } from './spriteBaker';
interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    size: number;
    color: string;
    mode: number;
    angle:number;
    faction:0|1;
}
export class VfxPool {
    private pool: Particle[] = Array.from({ length: 3500 }, () => ({
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, size: 0, color: '', mode: 0, angle:0, faction: 0
    }));
    private cursor = 0;
    snapshot(){return this.pool.filter(p=>p.life>0).map(p=>({...p}));}
    restore(particles:Particle[]){this.reset();for(const p of particles){Object.assign(this.pool[this.cursor],p);this.cursor=(this.cursor+1)%this.pool.length;}}
    private land(p:Particle){
        if(p.mode===1) this.decals.stamp(p.x,p.y,p.size,p.color,Math.min(4,p.size));
        if(p.mode===8) this.decals.fallen(p.x,p.y,p.faction);
        p.life=0;
    }
    readonly flashes = new Map<number, number>();
    constructor(private decals: DecalLayer) { }
    reset() { for (const p of this.pool)
        p.life = 0; this.flashes.clear();this.cursor=0; }
    private add(e: SimEvent, color: string, size: number, mode: number, life: number, spread: number, vz: number) {
        const p = this.pool[this.cursor];
        this.cursor = (this.cursor + 1) % this.pool.length;
        if(p.life>0)this.land(p);
        Object.assign(p, {
            x: e.x, y: e.y, z: e.z ?? 4, vx: (Math.random() - .5) * spread + (e.dx ?? 0) * 2, vy: (Math.random() - .5) * spread + (e.dy ?? 0) * 2, vz, life, size, color, mode, faction:e.faction??0,angle:Math.atan2(e.dy??0,e.dx??1)
        });
    }
    consume(events: SimEvent[]) {
        const now = performance.now();
        for (const [id, end] of this.flashes)
            if (end <= now)
                this.flashes.delete(id);
        for (const e of events) {
            this.decals.event(e);
            if (e.type === 'hit' && e.unitId)
                this.flashes.set(e.unitId, now + 50);
            if (e.type === 'death' && e.kind) {
                const sample=spritePalette(e.kind,e.faction??0);
                const colors=['#5b2626','#662c2c','#503431',sample.includes('#697778')?'#4b4941':'#514637'];
                for(let i=0;i<6;i++) this.add({...e,z:Math.min(12,e.z??4)},colors[i%4],3+i%3,1,.28+.04*i,5,2+i%3);
                if(e.kind==='bannerman') this.add({...e,z:23},'#734137',24,8,.48,5,3);
            }
            else if (e.type === 'trail')
                this.add(e, '#a31824', 3, 0, 4, 1, 0);
            else if (e.type === 'hit') {
                for (let i = 0, n = e.kind === 'berserker'?12:e.kind === 'musketeer' ? 8 : 3 + Math.random() * 6 | 0; i < n; i++)
                    this.add(e, i % 2 ? '#8f3034' : '#6d2729', 2 + i % 2, 0, 3, e.kind === 'musketeer' ? 9 : 5, Math.random() * 5);
            }
            else if (e.type === 'fire' && (['musketeer','field_cannon','catapult','hwacha','blunderbuss'].includes(e.kind??''))) {
                for (let i = 0; i < (e.kind === 'field_cannon' ? 20 : 8); i++)
                    this.add(e, ['#83827c', '#b4b3a8', '#a8adb5'][i % 3], 4 + i % 7, 2, .45 + Math.random() * .65, 3, 1.1 + Math.random());
                const muzzle={...e,x:e.x+(e.dx??1)*15,y:e.y+(e.dy??0)*15};
                this.add(muzzle, '#e8ab50', e.kind==='field_cannon'?17:9,3,.1,0,0);
                if(e.kind==='blunderbuss')this.add(muzzle,'#e6a956',22,10,.12,0,0);
            }
            else if (e.type === 'impact' || e.type === 'collapse') {
                if(e.structure?.type!=='tree') this.add({...e,z:0},'#ac8761',26,7,.45,0,0);
                for (let i = 0; i < 18; i++)
                    this.add(e, e.structure?.type === 'tree' ? '#8c7754' : i % 3 ? '#706d60' : '#acaa9d', 3 + i % 6, 2, .8, 8, Math.random() * 4);
            }
            else if(e.type==='drum'||e.type==='horn'||e.type==='heal'){
                this.add({...e,z:1},e.type==='heal'?'#bfaa63':e.faction?'#9c5151':'#b59a60',e.type==='heal'?45:26,e.type==='heal'?9:7,.5,0,0);
            }
            else if(e.type==='wade'){
                for(let i=0;i<3;i++) this.add(e,'#4d7377',3,4,.22,3,1.6);
            }
            else if (e.type === 'splash') {
                for (let i = 0; i < 12; i++)
                    this.add(e, '#83a6ab', 3, 4, .55, 6, 4 + Math.random() * 4);
            }
            else if (e.type === 'arrowland') {
                this.add(e, '#ab9770', 5, 5, 1.8, 0, 0);
            }
            else if (e.type === 'slash' || e.type === 'block') {
                this.add(e, e.type === 'block' ? '#ffbe3b' : '#d6dde6', 7, 6, .10, 0, 0);
            }
        }
    }
    update(dt: number) {
        const k = dt * 30;
        for (const p of this.pool) {
            if (p.life <= 0)
                continue;
            p.life -= dt;
            p.x += p.vx * k;
            p.y += p.vy * k;
            p.z += p.vz * k;
            if (p.mode === 0 || p.mode === 1 || p.mode === 8 || p.mode === 4) {
                p.vz -= .66 * k;
                if (p.z <= 0 || p.life<=0) this.land(p);
            }
            if (p.mode === 2) {
                p.vx *= Math.pow(.95, k);
                p.vy *= Math.pow(.95, k);
            }
        }
    }
    draw(c: CanvasRenderingContext2D) {
        for (const p of this.pool) {
            if (p.life <= 0)
                continue;
            c.fillStyle = p.color;
            if (p.mode === 2)
                c.globalAlpha = Math.min(.75, p.life * .9);
            const x = Math.round(p.x), y = Math.round(p.y - p.z);
            if(p.mode===10){
                c.save();c.translate(x,y);c.rotate(p.angle);c.fillStyle='#bc703d';c.fillRect(0,-2,16,4);c.fillRect(9,-5,10,3);c.fillRect(9,2,10,3);c.fillStyle=p.color;c.fillRect(1,-1,19,3);c.restore();
            }else if(p.mode===7||p.mode===9){
                const r=4+p.size*(1-Math.min(1,p.life/.5));c.strokeStyle=p.color;c.globalAlpha=p.life;c.lineWidth=3;
                c.beginPath();c.ellipse(x,y,r,r*.48,0,0,Math.PI*2);c.stroke();
                if(p.mode===9){c.fillRect(x-2,y-17,4,12);c.fillRect(x-6,y-13,12,4);}
            }else if(p.mode===8){c.save();c.translate(x,y);c.rotate((p.faction?-1:1)*(1-p.life/.48));c.drawImage(banner(p.faction),-3,-49,36,50);c.restore();}
            else if (p.mode === 6) {
                c.fillRect(x, y - 4, 3, 5);
                c.fillRect(x + 3, y - 6, 4, 3);
                c.fillRect(x + 7, y - 7, 3, 2);
            }
            else if (p.mode === 5) {
                c.fillRect(x, y, 2, 6);
                c.fillRect(x - 1, y, 2, 2);
            }
            else
                c.fillRect(x, y, p.size, p.size);
            c.globalAlpha = 1;
        }
    }
}
