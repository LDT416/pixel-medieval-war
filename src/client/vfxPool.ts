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
    private pool: Particle[] = Array.from({ length: 5000 }, () => ({
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, size: 0, color: '', mode: 0, angle: 0, faction: 0
    }));
    private cursor = 0;
    inferno = true;
    snapshot() { return this.pool.filter(p => p.life > 0).map(p => ({ ...p })); }
    restore(particles: Particle[]) { this.reset(); for (const p of particles) { Object.assign(this.pool[this.cursor], p); this.cursor = (this.cursor + 1) % this.pool.length; } }
    private land(p: Particle) {
        if (p.mode === 0)
            this.decals.stamp(p.x, p.y, Math.max(3, p.size), '#6b0b14', Math.max(2, p.size));
        else if (p.mode === 1)
            this.decals.stampGib(p.x, p.y, p.size, p.color, true);
        else if (p.mode === 11)
            this.decals.stampGib(p.x, p.y, p.size, p.color, false);
        else if (p.mode === 8)
            this.decals.fallen(p.x, p.y, p.faction);
        p.life = 0;
    }
    readonly flashes = new Map<number, number>();
    constructor(private decals: DecalLayer) { }
    reset() {
        for (const p of this.pool)
            p.life = 0;
        this.flashes.clear();
        this.cursor = 0;
    }
    private add(e: SimEvent, color: string, size: number, mode: number, life: number, spread: number, vz: number) {
        const p = this.pool[this.cursor];
        this.cursor = (this.cursor + 1) % this.pool.length;
        if (p.life > 0)
            this.land(p);
        Object.assign(p, {
            x: e.x, y: e.y, z: e.z ?? 4, vx: (Math.random() - .5) * spread + (e.dx ?? 0) * 2.4, vy: (Math.random() - .5) * spread + (e.dy ?? 0) * 2.2, vz, life, size, color, mode, faction: e.faction ?? 0, angle: Math.atan2(e.dy ?? 0, e.dx ?? 1)
        });
    }
    consume(events: SimEvent[]) {
        const now = performance.now(), dense = this.inferno;
        for (const [id, end] of this.flashes)
            if (end <= now)
                this.flashes.delete(id);
        for (const e of events) {
            this.decals.event(e);
            if (e.type === 'hit' && e.unitId)
                this.flashes.set(e.unitId, now + 55);
            if (e.type === 'death' && e.kind) {
                const sample = spritePalette(e.kind, e.faction ?? 0);
                const cloth = e.faction === 1 ? '#b82424' : '#2556b0';
                const armor = sample.includes('#697778') || e.kind === 'plate_knight' || e.kind === 'halberdier' || e.kind === 'heavy_lancer' ? '#cfd8e0' : cloth;
                const colors = ['#9e121c', '#6e0b13', '#dfd2b8', armor, '#d91c28', cloth];
                // 士兵炸碎肉块（落地全部整像素贴死到地图贴图上）
                const gibCount = dense ? 14 : 7;
                for (let i = 0; i < gibCount; i++)
                    this.add({ ...e, z: Math.min(14, e.z ?? 5) }, colors[i % colors.length], 3 + (i % 3), 1, .30 + (i % 4) * .06, dense ? 8.5 : 5.5, 2.5 + (i % 4) * 1.4);
                // 飙血喷泉（高压血珠落地化为永久血斑）
                const bloodCount = dense ? 10 : 4;
                for (let i = 0; i < bloodCount; i++)
                    this.add({ ...e, z: Math.min(12, e.z ?? 6) }, i % 2 ? '#e01b27' : '#8a0f18', 2 + (i % 2), 0, .42, dense ? 7.5 : 4.5, 4 + Math.random() * 5.5);
                // 脱盔爆帽演出（熊皮帽 / 三角帽 / 银铁盔单独飞落贴地）
                if (e.kind === 'guard_grenadier' || e.kind === 'musketeer' || e.kind === 'plate_knight' || e.kind === 'halberdier' || e.kind === 'rifleman') {
                    const hatColor = e.kind === 'plate_knight' || e.kind === 'halberdier' ? '#d4dde6' : e.kind === 'rifleman' ? '#2c4a34' : '#1b1d20';
                    this.add({ ...e, z: 13 }, hatColor, e.kind === 'guard_grenadier' ? 5 : 4, 11, .52, 5.5, 6.2);
                }
                if (e.kind === 'bannerman')
                    this.add({ ...e, z: 23 }, '#734137', 24, 8, .48, 5, 3);
            }
            else if (e.type === 'trail')
                this.add(e, '#c41622', dense ? 3 : 2, 0, .55, 1.5, 0);
            else if (e.type === 'hit') {
                const gunHit = e.kind === 'musketeer' || e.kind === 'guard_grenadier' || e.kind === 'volley_gunner' || e.kind === 'rifleman' || e.kind === 'dragoon';
                const n = dense ? (gunHit ? 12 : 6 + (Math.random() * 5 | 0)) : (gunHit ? 7 : 3 + (Math.random() * 4 | 0));
                for (let i = 0; i < n; i++)
                    this.add(e, i % 2 ? '#e01b27' : '#7a0e17', 2 + (i % 2), 0, .48, gunHit ? 10 : 6, 1.5 + Math.random() * 5.5);
            }
            else if (e.type === 'fire' && (['musketeer', 'field_cannon', 'siege_mortar', 'organ_gun', 'volley_gunner', 'guard_grenadier', 'rifleman', 'dragoon', 'davinci_tank'].includes(e.kind ?? ''))) {
                const isCannon = e.kind === 'field_cannon' || e.kind === 'siege_mortar' || e.kind === 'organ_gun' || e.kind === 'davinci_tank';
                // 排枪浓密白灰硝烟墙（停留更久、缓慢飘升）
                const smokeCount = isCannon ? (dense ? 26 : 18) : (dense ? 12 : 7);
                for (let i = 0; i < smokeCount; i++)
                    this.add({ ...e, x: e.x + (e.dx ?? 1) * 12, y: e.y + (e.dy ?? 0) * 10 }, ['#dde0db', '#f4f4ea', '#c7ccc8'][i % 3], (isCannon ? 6 : 5) + (i % 7), 2, (isCannon ? 1.1 : .85) + Math.random() * .75, isCannon ? 5.5 : 3.2, 1.1 + Math.random() * 1.4);
                const muzzle = { ...e, x: e.x + (e.dx ?? 1) * 15, y: e.y + (e.dy ?? 0) * 15 };
                this.add(muzzle, '#ffd366', isCannon ? 18 : 10, 3, .11, 0, 0);
                if (e.kind === 'volley_gunner' || e.kind === 'organ_gun')
                    this.add(muzzle, '#f0aa4d', 24, 10, .13, 0, 0);
            }
            else if (e.type === 'impact' || e.type === 'collapse') {
                if (e.structure?.type !== 'tree') {
                    // 无震屏高爆 2 帧纯白→明黄瞬间闪光冲击环 + 尘浪
                    this.add({ ...e, z: 2 }, '#fff8d6', 32, 12, .09, 0, 0);
                    this.add({ ...e, z: 0 }, '#c4965e', 34, 7, .48, 0, 0);
                }
                const dust = dense ? 24 : 16;
                for (let i = 0; i < dust; i++)
                    this.add(e, e.structure?.type === 'tree' ? '#8c7754' : i % 4 === 0 ? '#e3772b' : i % 3 ? '#59554a' : '#b8b4a6', 3 + (i % 6), 2, .85, 9.5, 1.5 + Math.random() * 4.5);
            }
            else if (e.type === 'drum' || e.type === 'horn' || e.type === 'heal') {
                this.add({ ...e, z: 1 }, e.type === 'heal' ? '#bfaa63' : e.faction ? '#c24848' : '#4a80c4', e.type === 'heal' ? 45 : 28, e.type === 'heal' ? 9 : 7, .5, 0, 0);
            }
            else if (e.type === 'wade') {
                for (let i = 0; i < 3; i++)
                    this.add(e, '#5a8ea3', 3, 4, .22, 3, 1.6);
            }
            else if (e.type === 'splash') {
                for (let i = 0; i < 14; i++)
                    this.add(e, '#8ab4c2', 3, 4, .55, 6, 4 + Math.random() * 4);
            }
            else if (e.type === 'arrowland') {
                this.add(e, '#ab9770', 5, 5, 1.8, 0, 0);
            }
            else if (e.type === 'slash' || e.type === 'block') {
                this.add(e, e.type === 'block' ? '#ffcf54' : dense ? '#ff424c' : '#e2e8f0', 8, 6, .11, 0, 0);
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
            if (p.mode === 0 || p.mode === 1 || p.mode === 8 || p.mode === 4 || p.mode === 11) {
                p.vz -= .72 * k;
                if (p.z <= 0 || p.life <= 0)
                    this.land(p);
            }
            if (p.mode === 2) {
                p.vx *= Math.pow(.94, k);
                p.vy *= Math.pow(.94, k);
                p.vz = Math.max(.25, p.vz * Math.pow(.95, k));
            }
        }
    }
    draw(c: CanvasRenderingContext2D) {
        for (const p of this.pool) {
            if (p.life <= 0)
                continue;
            c.fillStyle = p.color;
            if (p.mode === 2)
                c.globalAlpha = Math.min(.72, p.life * .75);
            const x = Math.round(p.x), y = Math.round(p.y - p.z);
            if (p.mode === 12) {
                // 高爆瞬间 2 帧纯白/明黄冲击闪环
                const r = 10 + p.size * (1 - p.life / .09);
                c.fillStyle = p.life > .045 ? '#ffffff' : '#ffcf54';
                c.globalAlpha = .85;
                c.beginPath();
                c.ellipse(x, y, r * .65, r * .35, 0, 0, Math.PI * 2);
                c.fill();
                c.strokeStyle = '#fff5cc';
                c.lineWidth = 3;
                c.beginPath();
                c.ellipse(x, y, r, r * .5, 0, 0, Math.PI * 2);
                c.stroke();
            }
            else if (p.mode === 11) {
                // 空中翻滚的熊皮帽 / 三角帽 / 银头盔
                c.save();
                c.translate(x, y);
                c.rotate(p.life * 16);
                c.fillStyle = p.color;
                c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size + 1);
                c.fillStyle = '#d4b46a';
                c.fillRect(-p.size / 2, 0, p.size, 1);
                c.restore();
            }
            else if (p.mode === 10) {
                c.save();
                c.translate(x, y);
                c.rotate(p.angle);
                c.fillStyle = '#bc703d';
                c.fillRect(0, -2, 16, 4);
                c.fillRect(9, -5, 10, 3);
                c.fillRect(9, 2, 10, 3);
                c.fillStyle = p.color;
                c.fillRect(1, -1, 19, 3);
                c.restore();
            }
            else if (p.mode === 7 || p.mode === 9) {
                const r = 4 + p.size * (1 - Math.min(1, p.life / .5));
                c.strokeStyle = p.color;
                c.globalAlpha = Math.min(1, p.life * 2);
                c.lineWidth = 3;
                c.beginPath();
                c.ellipse(x, y, r, r * .48, 0, 0, Math.PI * 2);
                c.stroke();
                if (p.mode === 9) {
                    c.fillRect(x - 2, y - 17, 4, 12);
                    c.fillRect(x - 6, y - 13, 12, 4);
                }
            }
            else if (p.mode === 8) {
                c.save();
                c.translate(x, y);
                c.rotate((p.faction ? -1 : 1) * (1 - p.life / .48));
                c.drawImage(banner(p.faction), -3, -49, 36, 50);
                c.restore();
            }
            else if (p.mode === 6) {
                // 银白刃光 + 猩红染血尾弧
                c.fillStyle = '#e8eef5';
                c.fillRect(x, y - 4, 3, 5);
                c.fillRect(x + 3, y - 6, 4, 3);
                c.fillStyle = p.color;
                c.fillRect(x + 6, y - 7, 4, 3);
                c.fillRect(x + 2, y - 2, 4, 2);
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
