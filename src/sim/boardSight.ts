import type {Company, Faction} from './arenaTypes';
import type {SimWorld} from './world';

const TILE = 160;
export const REPORT_LIFETIME = 300;
type Report = Readonly<{id:number; column:number; row:number; tick:number}>;

export class BoardSight {
    private reports = [new Map<number,Report>(), new Map<number,Report>()];

    canSee(w:SimWorld, observer:Company, other:Company) {
        if (observer.faction === other.faction || observer.alive <= 0 || other.alive <= 0 ||
            observer.status === 'gone' || observer.status === 'rout' || other.status === 'gone') return false;
        const radius = w.weather === 'fog' ? 9 : w.weather === 'rain' ? 17 : 22;
        return Math.abs(Math.floor(observer.x/TILE) - Math.floor(other.x/TILE)) <= radius &&
            Math.abs(Math.floor(observer.y/TILE) - Math.floor(other.y/TILE)) <= radius;
    }

    visibleToArmy(w:SimWorld, faction:Faction) {
        const own = w.companies.filter(c => c.faction === faction && c.alive > 0 && c.status !== 'rout' && c.status !== 'gone');
        return w.companies.filter(c => c.faction !== faction && own.some(observer => this.canSee(w, observer, c)));
    }

    scan(w:SimWorld) {
        for (const faction of [0,1] as const) {
            const reports = this.reports[faction];
            for (const [id,report] of reports) if (w.tick-report.tick >= REPORT_LIFETIME) reports.delete(id);
            for (const c of this.visibleToArmy(w,faction)) {
                reports.set(c.id, Object.freeze({id:c.id, column:Math.floor(c.x/TILE), row:Math.floor(c.y/TILE), tick:w.tick}));
            }
        }
    }

    latest(w:SimWorld, faction:Faction) {
        let latest:Report|undefined;
        for (const report of this.reports[faction].values()) {
            if (w.tick-report.tick < REPORT_LIFETIME && (!latest || report.tick > latest.tick)) latest=report;
        }
        return latest;
    }
}
