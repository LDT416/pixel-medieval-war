import type { Command, CommandAction, Faction } from '../sim/types';
export interface Transport {
    send(tick: number, faction: Faction, action: CommandAction): void;
    drain(tick: number): Command[];
}
export class LocalTransport implements Transport {
    private queue: Command[] = [];
    send(tick: number, faction: Faction, action: CommandAction) { this.queue.push({ tick, faction, ...action }); }
    drain(tick: number) { const due = this.queue.filter(c => c.tick === tick); this.queue = this.queue.filter(c => c.tick > tick); return due; }
    clear() { this.queue = []; }
}
