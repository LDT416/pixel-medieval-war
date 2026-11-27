import type { Soldier, Faction } from './arenaTypes';
import { HEIGHT } from './maps';
const LANES = 12;
// A forward observer per sector gives each soldier a reachable distant objective.
export class Frontline {
    sectors: (Soldier | undefined)[][] = [Array(LANES), Array(LANES)];
    private artillery: (Soldier | undefined)[][] = [Array(LANES), Array(LANES)];
    batteryOnWing(u: Soldier) {
        const row=this.artillery[1-u.faction],lane=Math.floor(u.homeY/HEIGHT*LANES);
        for(let offset=0;offset<4;offset++){
            const a=row[lane-offset],b=row[lane+offset];
            if(a && a.hp>0)return a;
            if(b && b.hp>0)return b;
        }
    }
    update(units: Soldier[]) {
        for (const row of this.artillery) row.fill(undefined);
        for (const sectors of this.sectors) sectors.fill(undefined);
        for (const u of units) if (u.hp > 0) {
            const row = this.sectors[u.faction], lane = Math.floor(u.y / HEIGHT * LANES);
            if(u.kind==='field_cannon')this.artillery[u.faction][lane]=u;
            const old = row[lane];
            if (!old || (u.faction ? old.x > u.x : old.x < u.x)) row[lane] = u;
        }
    }
    opponent(u: Soldier) {
        const row = this.sectors[(1-u.faction) as Faction];
        const base = Math.floor(u.y / HEIGHT * LANES);
        for (let i=0; i<LANES; i++) {
            const left=row[base-i], right=row[base+i];
            if (left && left.hp>0) return left;
            if (right && right.hp>0) return right;
        }
    }
}
