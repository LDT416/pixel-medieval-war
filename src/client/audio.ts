import type { SimEvent } from '../sim/types';
type SoundEvent={type:SimEvent['type']|'bounce'|'hoof';x:number;y:number;kind?:string};
type Listener={x:number;y:number;distance:number};
export class BattleAudio {
    muted = false;
    private ctx?: AudioContext;
    private bus?: GainNode;
    private voices = 0;
    private noise?: AudioBuffer;
    private last = new Map<string, number>();
    music = true;
    private nation = 1;
    private cursor = 0;
    private nextNote = 0;
    private beat = 0;
    private loud = false;
    private fanfare = -1;
    private musicBus?: GainNode;
    private ambience?: GainNode;
    private drums=0;
    get signalCount(){return this.drums;}
    setMuted(muted:boolean){
        this.muted=muted;
        if(this.bus && this.ctx)this.bus.gain.setTargetAtTime(muted?0:.22,this.ctx.currentTime,.025);
    }
    environment(distance:number,intensity:number){
        if(!this.ctx||!this.ambience)return;
        const far=Math.min(1,Math.max(0,(distance-90)/600));
        this.ambience.gain.setTargetAtTime(far*Math.min(.18,intensity*.015),this.ctx.currentTime,.4);
    }
    start(nation: number) { this.nation = nation; this.cursor = this.beat = 0; this.loud = false; this.fanfare = -1; this.nextNote = this.ctx?.currentTime ?? 0; }
    stop() { if (this.musicBus)
        this.musicBus.gain.value = 0; }
    sequence(assault: boolean, paused: boolean) {
        const a = this.ctx;
        if (!a || !this.bus || !this.musicBus)
            return;
        this.musicBus.gain.value = this.music && !paused ? 1 : 0;
        if (!this.music || paused) {
            this.nextNote = a.currentTime;
            return;
        }
        if (!this.nation && assault && !this.loud)
            this.fanfare = 0;
        this.loud = assault;
        if (this.nextNote < a.currentTime)
            this.nextNote = a.currentTime;
        const quarter = 60 / (this.nation ? 124 : 114);
        const tone = (pitch: number, duration: number, wave: OscillatorType, volume: number) => {
            const o = a.createOscillator(), g = a.createGain();
            o.type = wave;
            o.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
            g.gain.setValueAtTime(.001, this.nextNote);
            g.gain.linearRampToValueAtTime(volume, this.nextNote + .009);
            g.gain.exponentialRampToValueAtTime(.001, this.nextNote + duration);
            o.connect(g);
            g.connect(this.musicBus!);
            o.start(this.nextNote);
            o.stop(this.nextNote + duration + .01);
            o.onended = () => { o.disconnect(); g.disconnect(); };
        };
        while (this.nextNote < a.currentTime + .12) {
            const fan = this.fanfare >= 0, score = fan ? marseillaise : this.nation ? grenadiers : onion;
            const index = fan ? this.fanfare : this.cursor % score.length, [pitch, steps] = score[index];
            const pulse = !fan && !this.nation && index < onionVerse.length ? quarter / 3 : quarter / 2;
            const duration = steps * pulse;
            tone(pitch, duration * .91, fan ? 'sawtooth' : 'square', .095);
            if (assault)
                tone(pitch + 12, duration * .85, 'triangle', .09);
            for (let i = 0; i < steps; i++) {
                const beat = this.beat + i, at = this.nextNote + i * pulse;
                if (beat % 2 === 0) {
                    const save = this.nextNote;
                    this.nextNote = at;
                    tone(beat % 4 ? 50 : 43, pulse * 1.6, 'triangle', .24);
                    this.nextNote = save;
                }
                if (beat % (assault ? 2 : 4) === 1) {
                    const n = a.createBufferSource(), filter = a.createBiquadFilter(), g = a.createGain();
                    n.buffer = this.noise!;
                    filter.type = 'highpass';
                    filter.frequency.value = 1600;
                    g.gain.setValueAtTime(assault ? .16 : .06, at);
                    g.gain.exponentialRampToValueAtTime(.001, at + .075);
                    n.connect(filter);
                    filter.connect(g);
                    g.connect(this.musicBus!);
                    n.start(at);
                    n.stop(at + .08);
                    n.onended = () => { n.disconnect(); filter.disconnect(); g.disconnect(); };
                }
            }
            this.nextNote += duration;
            this.beat += steps;
            if (fan) {
                if (++this.fanfare >= score.length)
                    this.fanfare = -1;
            }
            else
                this.cursor++;
        }
    }
    unlock() {
        if (!this.ctx) {
            const a = this.ctx = new AudioContext(), g = this.bus = a.createGain(), lim = a.createDynamicsCompressor();
            g.gain.value = this.muted?0:.22;
            this.musicBus = a.createGain();
            this.musicBus.connect(g);
            g.connect(lim);
            lim.connect(a.destination);
            this.noise = a.createBuffer(1, a.sampleRate * .7, a.sampleRate);
            const data = this.noise.getChannelData(0);
            for (let i = 0; i < data.length; i++)
                data[i] = Math.random() * 2 - 1;
            const bed=a.createBufferSource(),filter=a.createBiquadFilter();
            bed.buffer=this.noise;bed.loop=true;filter.type='lowpass';filter.frequency.value=380;
            this.ambience=a.createGain();this.ambience.gain.value=0;
            bed.connect(filter);filter.connect(this.ambience);this.ambience.connect(g);bed.start();
        }
        if (this.ctx.state === 'suspended')
            void this.ctx.resume();
    }
    play(events:readonly SoundEvent[],listener?:Listener) {
        const a = this.ctx;
        if (!a || !this.bus || this.muted || a.state !== 'running')
            return;
        const volleyLayers=new Map<string,number>();
        for (const e of events) {
            const key = e.type === 'fire' ? e.kind : e.type;
            if (!key || (this.voices >= 10 && key!=='drum'))
                continue;
            const heavy = key === 'field_cannon' || key === 'collapse' || key === 'impact';
            const music = key === 'drum' || key === 'horn';
            const gun = ['line_infantry', 'guard_grenadier'].includes(key), metal = key === 'slash' || key === 'block';
            const goreDeath = key === 'death', hoof=key==='hoof';
            const far=listener?Math.min(1,listener.distance/1100):0;
            const offset=listener?Math.hypot(listener.x-e.x,listener.y-e.y):0;
            const radius=heavy?8400:music?5000:2400;
            const level=1/(1+(offset/radius)**2)*(heavy?1-.24*far:1-.68*far);
            if(level<((heavy||music)?.008:.04))continue;
            if (!(hoof || music || heavy || gun || metal || key === 'hit' || goreDeath))
                continue;
            const now = a.currentTime;
            const minGap = heavy ? .14 : gun ? .042 : goreDeath ? .07 : .085;
            const layer=gun?(volleyLayers.get(key)??0):0;
            if(layer>=4||layer===0&&now-(this.last.get(key)??-1)<minGap)continue;
            if(gun)volleyLayers.set(key,layer+1);
            this.last.set(key, now);
            // 排枪微错峰齐鸣（制造几十支火枪同时轰隆-噼啪的层次感）
            const startAt = gun ? now + layer*.012 + Math.random()*.012 : now;
            const env = a.createGain(), filter = a.createBiquadFilter(), time = key === 'horn' ? .65 : key === 'drum' ? .28 : heavy ? .46 : gun ? .19 : goreDeath ? .11 : .09;
            let src: AudioBufferSourceNode | OscillatorNode;
            if (hoof || music || metal || key === 'hit' || goreDeath) {
                const osc = a.createOscillator();
                osc.type = key === 'horn' ? 'sawtooth' : metal ? 'triangle' : 'sine';
                const hz = hoof?72:key === 'drum' ? 108 : key === 'horn' ? 146.83 : metal ? 880 : goreDeath ? 92 : 145;
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
            filter.frequency.setValueAtTime((heavy ? 1100 : gun ? 4600 : goreDeath ? 420 : 2600)*(1-.65*far), startAt);
            filter.frequency.exponentialRampToValueAtTime(heavy ? 42 : gun ? 280 : 120, startAt + time);
            env.gain.setValueAtTime(level*(heavy ? .72 : gun ? .34 : goreDeath ? .22 : key==='drum'?.86:hoof?.28:.19), startAt);
            env.gain.exponentialRampToValueAtTime(.001, startAt + time);
            src.connect(filter);
            filter.connect(env);
            env.connect(this.bus);
            this.voices++;if(key==='drum')this.drums++;
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
                wg.gain.linearRampToValueAtTime(.09*level, now + .18);
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
type Notes = number[][];
const strain: Notes = [[74, 2], [79, 2], [74, 2], [79, 2], [81, 2], [83, 4], [81, 2], [83, 1], [84, 1], [86, 2], [79, 2], [83, 1], [81, 1], [79, 1], [78, 1], [79, 6]];
const opening: Notes = [[74, 2], [79, 2], [79, 2], [81, 2], [83, 4], [84, 2], [83, 1], [81, 1], [79, 2], ...strain.slice(9)];
const grenadiers: Notes = [...opening, ...strain, [88, 1], [88, 1], [86, 3], [88, 1], [86, 2], [84, 2], [83, 3], [84, 1], [86, 2], [86, 2], [88, 2], [88, 2], [86, 1], [84, 1], [83, 1], [81, 1], [79, 4], [78, 2], [74, 1], [74, 1], ...strain.slice(1)];
// Traditional melody in G. Durations use eighth notes; the refrain uses simple duple time.
const pickup: Notes = [[62, 1], [62, 1], [62, 1], [67, 3], [69, 2], [69, 1], [71, 2], [71, 1], [69, 1], [71, 1], [69, 1]];
const onionVerse: Notes = [...pickup, [67, 2], [67, 1], [71, 2], [71, 1], [69, 3], ...pickup, [67, 3], [69, 1], [71, 1], [69, 1], [67, 3]];
const call = (a: number, b: number): Notes => [[a, 1], [b, 1], [b, .5], [b, .5], [b, 1]];
const answer = (end: number): Notes => [...call(74, 71), ...call(74, 71), [74, 1], [76, 1], [74, 1], [72, 1], [71, 1], [72, 3], ...call(72, 69), ...call(72, 69), [72, 1], [74, 1], [72, 1], [71, 1], [69, 1], [end, 3]];
const onion = [...onionVerse, ...answer(71), ...answer(67)];
const marseillaise: Notes = [[74, 1], [74, 1], [74, 2], [79, 4], [79, 2], [81, 2], [81, 2], [86, 2], [83, 3], [79, 1], [79, 2], [83, 2], [79, 3], [76, 1], [72, 2], [81, 2]];
