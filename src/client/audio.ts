import type { Faction, SimEvent } from '../sim/types';
import { MarchMusic, type BattlePhase, type MarchTrack, type MusicMode } from './marchMusic';

type SoundEvent = { type: SimEvent['type'] | 'bounce' | 'hoof' | 'tileImpact'; x: number; y: number; kind?: string };
type Listener = { x: number; y: number; distance: number };

export class BattleAudio {
    muted = false;
    private ctx?: AudioContext;
    private bus?: GainNode;
    private voices = 0;
    private noise?: AudioBuffer;
    private last = new Map<string, number>();
    private musicBus?: GainNode;
    private ambience?: GainNode;
    private drums = 0;
    readonly march = new MarchMusic();

    get signalCount() { return this.drums; }

    setMuted(muted: boolean) {
        this.muted = muted;
        if (this.bus && this.ctx) this.bus.gain.setTargetAtTime(muted ? 0 : .22, this.ctx.currentTime, .025);
    }

    setMusicMode(mode: MusicMode) {
        this.march.setMode(mode);
    }

    onBattleStart(betSide: Faction | -1) {
        this.march.onBattleStart(betSide);
    }

    nextTrack() {
        this.march.nextTrack();
    }

    onTrackChange(cb: (track: MarchTrack) => void) {
        this.march.onTrackChange(cb);
    }

    updateMusic(paused: boolean, phase: BattlePhase, winner: Faction | null) {
        this.march.update(paused, phase, winner, this.muted);
    }

    environment(distance: number, intensity: number) {
        if (!this.ctx || !this.ambience) return;
        const far = Math.min(1, Math.max(0, (distance - 90) / 600));
        this.ambience.gain.setTargetAtTime(far * Math.min(.18, intensity * .015), this.ctx.currentTime, .4);
    }

    unlock() {
        if (!this.ctx) {
            const a = this.ctx = new AudioContext(), g = this.bus = a.createGain(), lim = a.createDynamicsCompressor();
            g.gain.value = this.muted ? 0 : .22;
            this.musicBus = a.createGain();
            this.musicBus.connect(g);
            g.connect(lim);
            lim.connect(a.destination);
            this.noise = a.createBuffer(1, a.sampleRate * .7, a.sampleRate);
            const data = this.noise.getChannelData(0);
            for (let i = 0; i < data.length; i++)
                data[i] = Math.random() * 2 - 1;
            const bed = a.createBufferSource(), filter = a.createBiquadFilter();
            bed.buffer = this.noise; bed.loop = true; filter.type = 'lowpass'; filter.frequency.value = 380;
            this.ambience = a.createGain(); this.ambience.gain.value = 0;
            bed.connect(filter); filter.connect(this.ambience); this.ambience.connect(g); bed.start();
            this.march.init(a, this.musicBus, this.noise);
        }
        if (this.ctx.state === 'suspended')
            void this.ctx.resume();
    }

    play(events: readonly SoundEvent[], listener?: Listener) {
        const a = this.ctx;
        if (!a || !this.bus || this.muted || a.state !== 'running')
            return;
        const volleyLayers = new Map<string, number>();
        for (const e of events) {
            const key = e.type === 'fire' ? e.kind : e.type;
            if (!key || (this.voices >= 10 && key !== 'drum'))
                continue;
            const heavy = key === 'field_cannon' || key === 'collapse' || key === 'impact';
            const music = key === 'drum' || key === 'horn';
            const gun = ['line_infantry', 'guard_grenadier'].includes(key), metal = key === 'slash' || key === 'block';
            const goreDeath = key === 'death', hoof = key === 'hoof';
            const far = listener ? Math.min(1, listener.distance / 1100) : 0;
            const offset = listener ? Math.hypot(listener.x - e.x, listener.y - e.y) : 0;
            const radius = heavy ? 8400 : music ? 5000 : 2400;
            const level = 1 / (1 + (offset / radius) ** 2) * (heavy ? 1 - .24 * far : 1 - .68 * far);
            if (level < ((heavy || music) ? .008 : .04)) continue;
            if (!(hoof || music || heavy || gun || metal || key === 'hit' || goreDeath))
                continue;
            const now = a.currentTime;
            const minGap = heavy ? .14 : gun ? .042 : goreDeath ? .07 : .085;
            const layer = gun ? (volleyLayers.get(key) ?? 0) : 0;
            if (layer >= 4 || layer === 0 && now - (this.last.get(key) ?? -1) < minGap) continue;
            if (gun) volleyLayers.set(key, layer + 1);
            this.last.set(key, now);
            // 排枪微错峰齐鸣（制造几十支火枪同时轰隆-噼啪的层次感）
            const startAt = gun ? now + layer * .012 + Math.random() * .012 : now;
            const env = a.createGain(), filter = a.createBiquadFilter(), time = key === 'horn' ? .65 : key === 'drum' ? .28 : heavy ? .46 : gun ? .19 : goreDeath ? .11 : .09;
            let src: AudioBufferSourceNode | OscillatorNode;
            if (hoof || music || metal || key === 'hit' || goreDeath) {
                const osc = a.createOscillator();
                osc.type = key === 'horn' ? 'sawtooth' : metal ? 'triangle' : 'sine';
                const hz = hoof ? 72 : key === 'drum' ? 108 : key === 'horn' ? 146.83 : metal ? 880 : goreDeath ? 92 : 145;
                osc.frequency.setValueAtTime(hz, startAt);
                osc.frequency.exponentialRampToValueAtTime(hz * (key === 'horn' ? 1.5 : .24), startAt + time);
                src = osc;
            }
            else {
                const n = a.createBufferSource();
                n.buffer = this.noise!;
                src = n;
            }
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime((heavy ? 1100 : gun ? 4600 : goreDeath ? 420 : 2600) * (1 - .65 * far), startAt);
            filter.frequency.exponentialRampToValueAtTime(heavy ? 42 : gun ? 280 : 120, startAt + time);
            env.gain.setValueAtTime(level * (heavy ? .72 : gun ? .34 : goreDeath ? .22 : key === 'drum' ? .86 : hoof ? .28 : .19), startAt);
            env.gain.exponentialRampToValueAtTime(.001, startAt + time);
            src.connect(filter);
            filter.connect(env);
            env.connect(this.bus);
            this.voices++; if (key === 'drum') this.drums++;
            src.onended = () => { this.voices--; src.disconnect(); filter.disconnect(); env.disconnect(); };
            src.start(startAt);
            src.stop(startAt + time + .01);
            // 重炮破空呼啸声（Incoming Shell Whistle）
            if (key === 'field_cannon' && this.voices < 10) {
                const w = a.createOscillator(), wg = a.createGain();
                w.type = 'sine';
                w.frequency.setValueAtTime(540, now + .08);
                w.frequency.exponentialRampToValueAtTime(160, now + .46);
                wg.gain.setValueAtTime(.001, now + .08);
                wg.gain.linearRampToValueAtTime(.09 * level, now + .18);
                wg.gain.exponentialRampToValueAtTime(.001, now + .46);
                w.connect(wg);
                wg.connect(this.bus);
                this.voices++;
                w.onended = () => { this.voices--; w.disconnect(); wg.disconnect(); };
                w.start(now + .08);
                w.stop(now + .48);
            }
        }
    }
}
