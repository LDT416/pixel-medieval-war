import type { SimEvent } from '../sim/types';
export class BattleAudio {
    muted = false;
    private ctx?: AudioContext;
    private bus?: GainNode;
    private voices = 0;
    private noise?: AudioBuffer;
    private last = new Map<string, number>();
    unlock() {
        if (!this.ctx) {
            const a = this.ctx = new AudioContext(), g = this.bus = a.createGain(), lim = a.createDynamicsCompressor();
            g.gain.value = .22;
            g.connect(lim);
            lim.connect(a.destination);
            this.noise = a.createBuffer(1, a.sampleRate * .7, a.sampleRate);
            const data = this.noise.getChannelData(0);
            for (let i = 0; i < data.length; i++)
                data[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended')
            void this.ctx.resume();
    }
    play(events: SimEvent[]) {
        const a = this.ctx;
        if (!a || !this.bus || this.muted || a.state !== 'running')
            return;
        for (const e of events) {
            const key = e.type === 'fire' ? e.kind : e.type;
            if (!key || this.voices >= 10)
                continue;
            const heavy = key === 'field_cannon' || key === 'catapult' || key === 'collapse' || key === 'impact';
            const music=key==='drum'||key==='horn';
            const gun = key === 'musketeer'||key==='blunderbuss'||key==='hwacha', metal = key === 'slash' || key === 'block', bow = key === 'bowman';
            if (!(music || heavy || gun || metal || bow || key === 'hit'))
                continue;
            const now = a.currentTime;
            if (now - (this.last.get(key) ?? -1) < (heavy ? .15 : .085))
                continue;
            this.last.set(key, now);
            const env = a.createGain(), filter = a.createBiquadFilter(), time = key==='horn'?.65:key==='drum'?.28:heavy ? .38 : gun ? .17 : bow ? .14 : .09;
            let src: AudioBufferSourceNode | OscillatorNode;
            if (music || metal || bow || key === 'hit') {
                const osc = a.createOscillator();
                osc.type = key==='horn'?'sawtooth':metal ? 'triangle' : bow ? 'sawtooth' : 'sine';
                const hz = key==='drum'?108:key==='horn'?146.83:metal ? 880 : bow ? 420 : 130;
                osc.frequency.setValueAtTime(hz, now);
                osc.frequency.exponentialRampToValueAtTime(hz * (key==='horn'?1.5:.27), now + time);
                src = osc;
            }
            else {
                const n = a.createBufferSource();
                n.buffer = this.noise!;
                src = n;
            }
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(heavy ? 1200 : gun ? 4200 : 2600, now);
            filter.frequency.exponentialRampToValueAtTime(heavy ? 48 : 220, now + time);
            env.gain.setValueAtTime(heavy ? .65 : gun ? .31 : .12, now);
            env.gain.exponentialRampToValueAtTime(.001, now + time);
            src.connect(filter);
            filter.connect(env);
            env.connect(this.bus);
            this.voices++;
            src.onended = () => { this.voices--; src.disconnect(); filter.disconnect(); env.disconnect(); };
            src.start(now);
            src.stop(now + time);
        }
    }
}
