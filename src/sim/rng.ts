export class Rng {
    constructor(public state: number) { }
    next() { this.state = (this.state + 0x6d2b79f5) >>> 0; let v = this.state; v = Math.imul(v ^ (v >>> 15), v | 1); v ^= v + Math.imul(v ^ (v >>> 7), v | 61); return ((v ^ (v >>> 14)) >>> 0) / 4294967296; }
    int(min: number, max: number) { return min + Math.floor(this.next() * (max - min + 1)); }
}
