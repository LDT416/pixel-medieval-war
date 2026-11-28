import { BattleAudio } from './audio';
import type { BattlePhase, MusicMode } from './marchMusic';
import type { Faction } from '../sim/arenaTypes';
import type { SimWorld } from '../sim/world';
import type { ArenaRenderer3d } from './renderer3d/arenaRenderer3d';

const MUSIC_MODES: MusicMode[] = ['duel', 'fr', 'gb', 'off'];
const MUSIC_LABELS: Record<MusicMode, string> = {
    duel: '军乐 · 双边',
    fr: '军乐 · 法军',
    gb: '军乐 · 联军',
    off: '军乐 · 关',
};

export class BattleSound {
    private audio = new BattleAudio();
    private activity = 0;
    private unlocked = false;
    private musicBtn: HTMLButtonElement;
    private trackBadge: HTMLSpanElement;

    get drums() { return this.audio.signalCount; }

    constructor(private arena: ArenaRenderer3d) {
        const button = document.createElement('button');
        button.type = 'button'; button.id = 'battle-sound'; button.className = 'labeled';
        const refresh = () => {
            button.textContent = this.audio.muted ? '声音 · 关' : '声音 · 开';
            button.setAttribute('aria-label', this.audio.muted ? '打开战场声音' : '静音');
            button.setAttribute('aria-pressed', String(!this.audio.muted));
        };
        this.audio.setMuted(localStorage.getItem('1815-sound') === 'off');
        refresh();

        const savedMusic = localStorage.getItem('1815-music') as MusicMode | null;
        if (savedMusic && MUSIC_MODES.includes(savedMusic)) this.audio.setMusicMode(savedMusic);

        const unlock = () => {
            if (!this.unlocked && !this.audio.muted && typeof AudioContext !== 'undefined') {
                this.audio.unlock();
                this.unlocked = true;
            }
        };
        window.addEventListener('pointerdown', unlock, { capture: true });
        window.addEventListener('keydown', unlock, { capture: true });
        button.onclick = () => {
            this.audio.setMuted(!this.audio.muted);
            localStorage.setItem('1815-sound', this.audio.muted ? 'off' : 'on');
            unlock();
            refresh();
        };
        document.querySelector('#tracer-mode')?.after(button);

        // 军乐控制行：模式切换（双边轮奏 / 法军 / 联军 / 关） + 曲目展示 + 切歌
        const row = document.createElement('div');
        row.className = 'controlrow music-row';
        const musicBtn = this.musicBtn = document.createElement('button');
        musicBtn.type = 'button'; musicBtn.id = 'battle-music'; musicBtn.className = 'labeled';
        const trackBadge = this.trackBadge = document.createElement('span');
        trackBadge.id = 'battle-track'; trackBadge.className = 'music-track';
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button'; nextBtn.id = 'battle-music-next'; nextBtn.className = 'labeled music-next';
        nextBtn.textContent = '⏭'; nextBtn.title = '切换另一首/另一方古典军乐'; nextBtn.setAttribute('aria-label', '切换军乐曲目');

        const refreshMusic = () => {
            const m = this.audio.march.mode;
            musicBtn.textContent = MUSIC_LABELS[m];
            musicBtn.setAttribute('aria-pressed', String(m !== 'off'));
            musicBtn.title = '点击切换军乐阵营：双边轮奏 / 法兰西帝国 / 反法同盟 / 关闭';
            const t = this.audio.march.currentTrack;
            trackBadge.textContent = m === 'off' ? '已静音' : `♪ ${t.faction ? '联' : '法'}·${t.title}`;
            trackBadge.className = `music-track ${m === 'off' ? 'off' : 'f' + t.faction}`;
            trackBadge.title = m === 'off' ? '' : t.subtitle;
        };
        this.audio.onTrackChange(refreshMusic);
        refreshMusic();

        musicBtn.onclick = () => {
            const cur = this.audio.march.mode;
            const next = MUSIC_MODES[(MUSIC_MODES.indexOf(cur) + 1) % MUSIC_MODES.length];
            this.audio.setMusicMode(next);
            localStorage.setItem('1815-music', next);
            unlock();
            refreshMusic();
        };
        nextBtn.onclick = () => {
            if (this.audio.march.mode === 'off') {
                this.audio.setMusicMode('duel');
                localStorage.setItem('1815-music', 'duel');
            }
            this.audio.nextTrack();
            unlock();
            refreshMusic();
        };
        row.append(musicBtn, trackBadge, nextBtn);
        document.querySelector('#hud nav.controls')?.append(row);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.audio.environment(0, 0);
                this.audio.updateMusic(true, 'march', null);
            }
        });
    }

    onBattleStart(betSide: Faction | -1) {
        if (!this.unlocked && !this.audio.muted && typeof AudioContext !== 'undefined') {
            this.audio.unlock();
            this.unlocked = true;
        }
        this.audio.onBattleStart(betSide);
    }

    step(w: SimWorld) {
        if (!this.unlocked || this.audio.muted) return;
        const ear = this.arena.cameraInfo;
        if (w.events.length) {
            this.audio.play(w.events, ear);
            this.activity += w.events.filter(e => e.type === 'fire' || e.type === 'impact').length;
        }
        if (w.tick % 10 === 0 && ear.distance < 300) {
            const horse = w.companies.find(c => c.alive && c.kind === 'cuirassier' && Math.hypot(c.vx, c.vy) > 5 && Math.hypot(c.x - ear.x, c.y - ear.y) < 600);
            if (horse) this.audio.play([{ type: 'hoof', x: horse.x, y: horse.y }], ear);
        }
        if (w.tick % 30 === 0) {
            for (const c of w.companies) if (c.kind === 'cuirassier' && c.order === 'charge' && w.tick - c.chargeAt < 30)
                this.audio.play([{ type: 'horn', x: c.x, y: c.y }], ear);
        }
    }

    update(dt: number, paused: boolean, world?: SimWorld) {
        this.activity *= Math.exp(-dt * 2);
        this.audio.environment(this.arena.zoom, paused || document.hidden ? 0 : this.activity);
        if (!this.unlocked) return;
        let phase: BattlePhase = 'battle';
        let winner: Faction | null = null;
        if (world) {
            winner = world.winner;
            if (winner !== null) phase = 'victory';
            else if (world.tick < world.deployEnd) phase = 'march';
            else if (world.companies.some(c => c.alive && (c.order === 'charge' || c.assaultStage === 'rush' || c.assaultStage === 'melee'))) phase = 'assault';
        }
        this.audio.updateMusic(paused || document.hidden, phase, winner);
    }
}
