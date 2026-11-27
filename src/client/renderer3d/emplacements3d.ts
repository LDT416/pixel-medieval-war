import * as T from 'three';
import type {SimWorld} from '../../sim/world';
import {toX, toZ, terrainHeight} from './terrain3d';

/**
 * 炮兵阵地的立体表现：炮前的土胸墙（半埋的土垄）、柳条筐、炮后的弹药车和炮弹堆、踩秃的泥地。
 * 尺寸按画面上的炮组立牌比例放大（立牌约是碰撞体的 4 倍），否则会被炮身挡住。
 */
const CAP = 160;
const FRENCH = 0x55603a, BRITISH = 0x6b6f72;
export class Emplacements3d {
    private berm: T.InstancedMesh; private gabion: T.InstancedMesh; private chest: T.InstancedMesh;
    private wheel: T.InstancedMesh; private balls: T.InstancedMesh; private patch: T.InstancedMesh;
    private o = new T.Object3D(); private c = new T.Color(); private built = -1; private count = 0;
    constructor(scene: T.Scene) {
        const earth = new T.MeshStandardMaterial({color: 0x6f5636, roughness: 1});
        const mound = new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        this.berm = new T.InstancedMesh(mound, earth, CAP);
        this.gabion = new T.InstancedMesh(new T.CylinderGeometry(.24, .22, .52, 8), new T.MeshStandardMaterial({color: 0x8a6a3c, roughness: .95}), CAP * 3);
        this.chest = new T.InstancedMesh(new T.BoxGeometry(1.05, .5, .58), new T.MeshStandardMaterial({roughness: .8}), CAP);
        this.wheel = new T.InstancedMesh(new T.CylinderGeometry(.33, .33, .08, 10), new T.MeshStandardMaterial({color: 0x3b2c1e, roughness: .9}), CAP * 2);
        this.balls = new T.InstancedMesh(new T.IcosahedronGeometry(.11, 1), new T.MeshStandardMaterial({color: 0x2f3134, metalness: .5, roughness: .45}), CAP * 6);
        const disc = new T.CircleGeometry(1, 20); disc.rotateX(-Math.PI / 2);
        this.patch = new T.InstancedMesh(disc, new T.MeshStandardMaterial({color: 0x4f3e2a, roughness: 1, transparent: true, opacity: .55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}), CAP);
        this.patch.renderOrder = 1;
        for (const m of [this.berm, this.gabion, this.chest, this.wheel, this.balls, this.patch]) {
            m.count = 0; m.frustumCulled = false; m.castShadow = m !== this.patch; m.receiveShadow = true; scene.add(m);
        }
    }
    reset() { this.built = -1; this.count = 0; for (const m of [this.berm, this.gabion, this.chest, this.wheel, this.balls, this.patch]) m.count = 0; }
    private put(m: T.InstancedMesh, i: number, x: number, z: number, lift: number, yaw: number, sx: number, sy: number, sz: number, roll = 0) {
        const o = this.o;
        o.position.set(x, terrainHeight(x, z) + lift, z); o.rotation.set(0, yaw, roll); o.scale.set(sx, sy, sz); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
    }
    update(w: SimWorld) {
        const list = w.earthworks.list;
        if (list.length === this.count && w.tick - this.built < 15) return;
        this.built = w.tick; this.count = Math.min(CAP, list.length);
        let gb = 0, wh = 0, bl = 0;
        for (let i = 0; i < this.count; i++) {
            const e = list[i];
            const gx = toX(e.gx), gz = toZ(e.gy), nx = e.nx, nz = e.ny, tx = -nz, tz = nx;
            const yaw = -Math.atan2(nz, nx);
            // 构筑过程：部署结束后约 4 秒内土垄从地里“堆”起来。
            const grow = Math.min(1, (w.tick - e.built) / 120 + .15);
            const bx = gx + nx * 1.55, bz = gz + nz * 1.55;
            this.put(this.berm, i, bx, bz, -.1, yaw, .75, .42 * grow, 1.65);
            for (const k of [-1, 1]) this.put(this.gabion, gb++, bx + nx * .2 + tx * k * 1.05, bz + nz * .2 + tz * k * 1.05, .22 * grow, 0, 1, grow, 1);
            const cx = gx - nx * 2.3 + tx * .9, cz = gz - nz * 2.3 + tz * .9;
            this.put(this.chest, i, cx, cz, .5, yaw, 1, 1, 1);
            this.chest.setColorAt(i, this.c.setHex(e.faction ? BRITISH : FRENCH));
            for (const k of [-1, 1]) this.put(this.wheel, wh++, cx + tx * k * .33, cz + tz * k * .33, .33, yaw, 1, 1, 1, Math.PI / 2);
            const px = gx - nx * .8 - tx * 1.1, pz = gz - nz * .8 - tz * 1.1;
            const pile: [number, number, number][] = [[0, 0, .11], [.22, 0, .11], [.11, .19, .11], [.11, .07, .29], [-.22, .05, .11], [-.11, .22, .11]];
            for (const [a, b, h] of pile) this.put(this.balls, bl++, px + tx * a + nx * b, pz + tz * a + nz * b, h, 0, 1, 1, 1);
            this.put(this.patch, i, gx + nx * .3, gz + nz * .3, .05, yaw, 2.6, 1, 1.9);
        }
        this.berm.count = this.chest.count = this.patch.count = this.count;
        this.gabion.count = gb; this.wheel.count = wh; this.balls.count = bl;
        for (const m of [this.berm, this.gabion, this.chest, this.wheel, this.balls, this.patch]) {
            m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
    }
}
