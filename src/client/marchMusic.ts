import type { Faction } from '../sim/arenaTypes';

export type MusicMode = 'duel' | 'fr' | 'gb' | 'off';
export type BattlePhase = 'march' | 'battle' | 'assault' | 'victory';
type ChordName = 'C' | 'D' | 'D7' | 'Em' | 'F' | 'G' | 'G7' | 'A' | 'A7' | 'Am' | 'Bm' | 'E7';

interface NoteStep {
    pitch: number;
    beats: number;
    chord?: ChordName;
    /** 标记该音符是否为小节强拍（驱动大号低音与军鼓重拍）。 */
    downbeat?: boolean;
    /** 标记是否处于后半拍（驱动圆号柱式伴奏）。 */
    offbeat?: boolean;
    /** 华彩/高潮点加军镲。 */
    cymbal?: boolean;
}

export interface MarchTrack {
    id: string;
    faction: Faction;
    title: string;
    subtitle: string;
    bpm: number;
    /** 6/8 拍或常规 2/4、4/4 拍用于军鼓花式节奏选择。 */
    meter: '2/4' | '4/4' | '6/8';
    fanfareOnly?: boolean;
    steps: NoteStep[];
}

const C3 = 48, D3 = 50, E3 = 52, F3 = 53, Fs3 = 54, G3 = 55, Gs3 = 56, A3 = 57, B3 = 59;
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67, Gs4 = 68, A4 = 69, B4 = 71;
const C5 = 72, Cs5 = 73, D5 = 74, E5 = 76, F5 = 77, Fs5 = 78, G5 = 79, A5 = 81, B5 = 83;
const C6 = 84, D6 = 86, E6 = 88;

const CHORDS: Record<ChordName, { bass: number; fifth: number; triad: [number, number, number] }> = {
    C:  { bass: 36, fifth: 43, triad: [48, 52, 55] },
    D:  { bass: 38, fifth: 45, triad: [50, 54, 57] },
    D7: { bass: 38, fifth: 45, triad: [50, 54, 60] },
    Em: { bass: 40, fifth: 47, triad: [52, 55, 59] },
    F:  { bass: 41, fifth: 48, triad: [53, 57, 60] },
    G:  { bass: 43, fifth: 38, triad: [55, 59, 62] },
    G7: { bass: 43, fifth: 38, triad: [55, 59, 65] },
    A:  { bass: 45, fifth: 40, triad: [57, 61, 64] },
    A7: { bass: 45, fifth: 40, triad: [57, 61, 67] },
    Am: { bass: 45, fifth: 40, triad: [57, 60, 64] },
    Bm: { bass: 47, fifth: 42, triad: [59, 62, 66] },
    E7: { bass: 40, fifth: 47, triad: [52, 56, 62] },
};

type RawNote = [pitch: number, beats: number, chord?: ChordName, cymbal?: boolean];

/** 将紧凑乐谱编译为带小节强弱拍标记的音符序列，便于自动编排铜管和声与军鼓节奏。 */
function compileScore(raw: RawNote[], barBeats: number, initialChord: ChordName, pickupBeats = 0): NoteStep[] {
    let pos = pickupBeats ? barBeats - pickupBeats : 0;
    let currentChord = initialChord;
    const out: NoteStep[] = [];
    for (const [pitch, beats, chord, cymbal] of raw) {
        if (chord) currentChord = chord;
        const beatInBar = pos % barBeats;
        const isWholeBeat = Math.abs(beatInBar - Math.round(beatInBar)) < 0.04;
        const roundedBeat = Math.round(beatInBar);
        const downbeat = isWholeBeat && (barBeats === 4 ? roundedBeat === 0 || roundedBeat === 2 : roundedBeat === 0);
        const offbeat = isWholeBeat && !downbeat;
        out.push({ pitch, beats, chord: currentChord, downbeat, offbeat, cymbal });
        pos += beats;
    }
    return out;
}

/** 1. 法军：《出征之歌》Le Chant du Départ (Méhul 1794, C大调 4/4) */
const chantDuDepart: MarchTrack = {
    id: 'fr_chant_du_depart',
    faction: 0,
    title: '出征之歌',
    subtitle: 'Le Chant du Départ · 1794',
    bpm: 112,
    meter: '4/4',
    steps: compileScore([
        // A: "La victoire en chantant nous ouvre la barrière"
        [E4, 1, 'C', true], [G4, 1], [C5, 1], [C5, 1],
        [B4, 1, 'G7'], [D5, 1], [D5, 2],
        [E5, 1, 'C'], [C5, 1], [D5, 1, 'G7'], [B4, 1],
        [C5, 4, 'C'],
        // "La Liberté guide nos pas..."
        [E5, 1, 'C'], [E5, 1], [F5, 1, 'F'], [E5, 1],
        [D5, 1, 'G'], [C5, 1], [B4, 1], [A4, 1],
        [G4, 1, 'C'], [C5, 1], [B4, 1, 'G7'], [D5, 1],
        [C5, 4, 'C'],
        // B: "Et du Nord au Midi, la trompette guerrière"
        [D5, 1, 'G', true], [B4, 1], [G4, 1], [B4, 1],
        [C5, 1, 'C'], [E5, 1], [E5, 2],
        [D5, 1, 'G'], [B4, 1], [G4, 1], [B4, 1],
        [C5, 1, 'C'], [E5, 1], [E5, 2],
        // 凯旋尾句：回到 C 大调主和弦
        [E5, 1, 'C'], [F5, 1, 'F'], [G5, 1, 'C'], [E5, 1],
        [D5, 1, 'G7'], [C5, 1], [B4, 1], [D5, 1],
        [C5, 3, 'C', true], [0, 1],
    ], 4, 'C'),
};

/** 2. 法军：《洋葱之歌》Chanson de l'Oignon (6/8 + 2/4 拿破仑大军团经典行军曲) */
const on6 = 1 / 3; // 6/8拍中1个八分音符 = 1/3 附点四分拍
const oignonPickup: RawNote[] = [[D4, on6], [D4, on6], [D4, on6]];
const chansonOignon: MarchTrack = {
    id: 'fr_oignon',
    faction: 0,
    title: '洋葱之歌',
    subtitle: "Chanson de l'Oignon · 1800",
    bpm: 112,
    meter: '6/8',
    steps: [
        ...compileScore([
            ...oignonPickup,
            [G4, 1, 'G', true], [A4, 2 * on6], [A4, on6],
            [B4, 2 * on6], [B4, on6], [A4, on6], [B4, on6], [A4, on6],
            [G4, 2 * on6], [G4, on6], [B4, 2 * on6, 'D7'], [B4, on6],
            [A4, 1, 'D7'],
            ...oignonPickup,
            [G4, 1, 'G'], [A4, 2 * on6], [A4, on6],
            [B4, 2 * on6], [B4, on6], [A4, on6], [B4, on6], [A4, on6],
            [G4, 1, 'G'], [A4, on6, 'D7'], [B4, on6], [A4, on6],
            [G4, 1.5, 'G'], [0, 0.5],
        ], 2, 'G', 1),
        // 副歌 "Au pas, camarades!" 转2/4拍刚劲齐步走
        ...compileScore([
            [D5, 0.5, 'G', true], [B4, 0.5], [B4, 0.25], [B4, 0.25], [B4, 0.5],
            [D5, 0.5], [B4, 0.5], [B4, 0.25], [B4, 0.25], [B4, 0.5],
            [D5, 0.5, 'C'], [E5, 0.5], [D5, 0.5, 'G'], [C5, 0.5],
            [B4, 0.5, 'D7'], [C5, 1.5],
            [C5, 0.5, 'D7', true], [A4, 0.5], [A4, 0.25], [A4, 0.25], [A4, 0.5],
            [C5, 0.5], [A4, 0.5], [A4, 0.25], [A4, 0.25], [A4, 0.5],
            [C5, 0.5, 'D7'], [D5, 0.5], [C5, 0.5], [B4, 0.5],
            [A4, 0.5, 'D7'], [B4, 1.5, 'G'],
            // 再来一遍收束至主音 G4
            [D5, 0.5, 'G'], [B4, 0.5], [B4, 0.25], [B4, 0.25], [B4, 0.5],
            [D5, 0.5], [B4, 0.5], [B4, 0.25], [B4, 0.25], [B4, 0.5],
            [D5, 0.5, 'C'], [E5, 0.5], [D5, 0.5, 'G'], [C5, 0.5],
            [B4, 0.5, 'D7'], [C5, 1.5],
            [C5, 0.5, 'D7'], [A4, 0.5], [A4, 0.25], [A4, 0.25], [A4, 0.5],
            [C5, 0.5], [A4, 0.5], [A4, 0.25], [A4, 0.25], [A4, 0.5],
            [C5, 0.5, 'D7'], [D5, 0.5], [C5, 0.5], [B4, 0.5],
            [A4, 0.5, 'D7'], [G4, 1.5, 'G', true],
        ], 2, 'G'),
    ],
};

/** 3. 法军：《胜利属于我们》La Victoire est à nous (Grétry / 帝国近卫军进行曲, G大调 2/4) */
const victoireEstANous: MarchTrack = {
    id: 'fr_victoire',
    faction: 0,
    title: '胜利属于我们',
    subtitle: 'La Victoire est à nous · 帝国近卫曲',
    bpm: 114,
    meter: '2/4',
    steps: compileScore([
        // 弱起
        [G4, 0.5, 'G'], [G4, 0.5],
        // A 段
        [B4, 1, 'G', true], [D5, 1],
        [G5, 1], [D5, 0.5], [C5, 0.5],
        [B4, 1, 'D7'], [A4, 1],
        [G4, 1, 'G'], [G4, 0.5], [G4, 0.5],
        [B4, 1, 'G'], [D5, 1],
        [G5, 1, 'C'], [Fs5, 0.5, 'D'], [E5, 0.5],
        [D5, 1.5, 'D'], [D5, 0.5],
        [E5, 1, 'C'], [E5, 1],
        [D5, 1, 'G'], [C5, 1, 'C'],
        [B4, 1, 'G'], [A4, 1, 'D7'],
        [G4, 1, 'G'], [B4, 1],
        [D5, 1, 'D7'], [C5, 1],
        [B4, 1], [A4, 1],
        [G4, 1.5, 'G', true], [0, 0.5],
        // B 段
        [D5, 1, 'G', true], [D5, 1],
        [B4, 1], [G5, 1],
        [D5, 1, 'D7'], [C5, 1],
        [B4, 1, 'G'], [A4, 1, 'D7'],
        [D5, 1, 'G'], [D5, 1],
        [B4, 1], [G5, 1],
        [D5, 1, 'C'], [E5, 0.5], [D5, 0.5],
        [C5, 2, 'C'],
        [B4, 1, 'G'], [C5, 1, 'C'],
        [D5, 1, 'G'], [G5, 1],
        [E5, 1, 'C'], [D5, 1, 'G'],
        [C5, 1, 'Am'], [B4, 1, 'G'],
        [A4, 1, 'D7'], [C5, 1],
        [B4, 1, 'G'], [A4, 1, 'D7'],
        [G4, 2, 'G', true],
    ], 2, 'G', 1),
};

/** 4. 法军高潮/凯旋号角：《马赛曲》La Marseillaise (Rouget de Lisle 1792, G大调 4/4) */
const marseillaise: MarchTrack = {
    id: 'fr_marseillaise',
    faction: 0,
    title: '马赛曲',
    subtitle: 'La Marseillaise · 1792',
    bpm: 114,
    meter: '4/4',
    fanfareOnly: true,
    steps: compileScore([
        // "Allons enfants de la Patrie"
        [D4, 0.75, 'D7'], [D4, 0.25],
        [G4, 1, 'G', true], [G4, 1], [A4, 1, 'D7'], [A4, 1],
        [D5, 1.5, 'G'], [B4, 0.5], [G4, 0.75], [G4, 0.25], [B4, 0.75], [G4, 0.25],
        [E4, 1, 'C'], [C5, 2, 'Am'], [A4, 0.75, 'D7'], [Fs4, 0.25],
        [G4, 2, 'G'], [0, 1], [G4, 0.75], [A4, 0.25],
        // "Contre nous de la tyrannie"
        [B4, 1, 'G', true], [B4, 1], [B4, 1], [C5, 0.75], [B4, 0.25],
        [B4, 1, 'D7'], [A4, 1], [0, 1], [A4, 0.75], [B4, 0.25],
        [C5, 1, 'D7'], [C5, 1], [C5, 1], [D5, 0.75], [A4, 0.25],
        [D5, 2, 'G'], [0, 1], [D5, 0.75, 'D7'], [D5, 0.25],
        // "L'étendard sanglant est levé!"
        [D5, 1.5, 'G', true], [B4, 0.5], [G4, 1], [D5, 0.75], [B4, 0.25],
        [G4, 3, 'G', true], [0, 1],
    ], 4, 'D7', 1),
};

/** 5. 联军：《英国掷弹兵进行曲》The British Grenadiers (G大调 4/4) */
const grenadierStrain: RawNote[] = [
    [D4, 1, 'G', true], [G4, 1], [D4, 1], [G4, 1],
    [A4, 1, 'D7'], [B4, 2, 'G'], [A4, 1, 'D7'],
    [B4, 0.5, 'G'], [C5, 0.5], [D5, 1], [G4, 1, 'C'],
    [B4, 0.5, 'D7'], [A4, 0.5], [G4, 0.5], [Fs4, 0.5], [G4, 3, 'G'],
];
const britishGrenadiers: MarchTrack = {
    id: 'gb_grenadiers',
    faction: 1,
    title: '英国掷弹兵进行曲',
    subtitle: 'The British Grenadiers · 18世纪',
    bpm: 116,
    meter: '4/4',
    steps: compileScore([
        // Opening + Strain
        [D4, 1, 'D7'],
        [G4, 1, 'G', true], [G4, 1], [A4, 1, 'D7'], [B4, 2, 'G'],
        [C5, 1, 'C'], [B4, 0.5, 'D7'], [A4, 0.5], [G4, 1, 'G'],
        [B4, 0.5, 'D7'], [A4, 0.5], [G4, 0.5], [Fs4, 0.5], [G4, 3, 'G'],
        [D4, 1, 'D7'],
        ...grenadierStrain,
        // B 段 ("But of all the world's brave heroes...")
        [E5, 0.5, 'C'], [E5, 0.5],
        [D5, 1.5, 'G', true], [E5, 0.5], [D5, 1, 'D7'], [C5, 1],
        [B4, 1.5, 'G'], [C5, 0.5], [D5, 1], [D5, 1],
        [E5, 1, 'C'], [E5, 1], [D5, 0.5, 'G'], [C5, 0.5], [B4, 0.5], [A4, 0.5],
        [G4, 2, 'G'], [Fs4, 1, 'D7'], [D4, 0.5], [D4, 0.5],
        ...grenadierStrain.slice(1),
        [0, 1],
    ], 4, 'D7', 1),
};

/** 6. 联军：《我留下的姑娘》The Girl I Left Behind Me (滑铁卢英军行军横笛曲, G大调 2/4) */
const girlLeftBehind: MarchTrack = {
    id: 'gb_girl_behind',
    faction: 1,
    title: '我留下的姑娘',
    subtitle: 'The Girl I Left Behind Me · 1815行军笛曲',
    bpm: 116,
    meter: '2/4',
    steps: compileScore([
        // 弱起 g/f/
        [G5, 0.25, 'G'], [Fs5, 0.25],
        // A 段
        [E5, 0.5, 'C', true], [D5, 0.5], [B4, 0.5, 'G'], [G4, 0.5],
        [A4, 0.25, 'D7'], [B4, 0.25], [A4, 0.25], [G4, 0.25], [E4, 0.5, 'C'], [D4, 0.5, 'D7'],
        [G4, 0.5, 'G'], [G4, 0.5], [G4, 0.25], [A4, 0.25], [B4, 0.25], [C5, 0.25],
        [D5, 1, 'D7'], [B4, 0.5, 'G'], [G5, 0.25], [Fs5, 0.25],
        [E5, 0.5, 'C', true], [D5, 0.5], [B4, 0.5, 'G'], [G4, 0.5],
        [A4, 0.25, 'D7'], [B4, 0.25], [A4, 0.25], [G4, 0.25], [E4, 0.5, 'C'], [G4, 0.5],
        [Fs4, 0.5, 'D7'], [A4, 0.5], [D4, 0.5], [E4, 0.25], [Fs4, 0.25],
        [G4, 1, 'G'], [G4, 0.5], [D5, 0.25], [C5, 0.25],
        // B 段
        [B4, 0.5, 'G', true], [D5, 0.5], [E5, 0.5, 'C'], [Fs5, 0.5, 'D'],
        [G5, 0.5, 'G'], [D5, 0.5], [B4, 0.5], [G4, 0.5],
        [B4, 0.5, 'G'], [D5, 0.5], [E5, 0.5, 'C'], [Fs5, 0.5, 'D'],
        [G5, 1, 'G'], [Fs5, 0.5, 'D'], [G5, 0.25], [Fs5, 0.25],
        [E5, 0.5, 'C', true], [D5, 0.5], [B4, 0.5, 'G'], [G4, 0.5],
        [A4, 0.25, 'D7'], [B4, 0.25], [A4, 0.25], [G4, 0.25], [E4, 0.5, 'C'], [G4, 0.5],
        [Fs4, 0.5, 'D7'], [A4, 0.5], [D4, 0.5], [E4, 0.25], [Fs4, 0.25],
        [G4, 1, 'G', true], [G4, 0.5], [0, 0.5],
    ], 2, 'G', 0.5),
};

/** 7. 联军：《百战进行曲》Lilliburlero (Henry Purcell, 英国陆军百年 6/8 军乐) */
const lilliburlero: MarchTrack = {
    id: 'gb_lilliburlero',
    faction: 1,
    title: '百战进行曲',
    subtitle: 'Lilliburlero · Henry Purcell',
    bpm: 118,
    meter: '6/8',
    steps: compileScore([
        // 弱起 D4
        [D4, on6, 'D7'],
        // A 段 x2
        [G4, on6, 'G', true], [A4, on6], [G4, on6], [B4, 2 * on6], [B4, on6],
        [A4, on6, 'D7'], [B4, on6], [A4, on6], [C5, 1],
        [B4, on6, 'G'], [D5, on6], [G4, on6], [C5, 2 * on6, 'C'], [B4, on6],
        [A4, on6, 'D7'], [G4, on6], [Fs4, on6], [G4, 1, 'G'],
        [G4, on6, 'G', true], [A4, on6], [G4, on6], [B4, 2 * on6], [B4, on6],
        [A4, on6, 'D7'], [B4, on6], [A4, on6], [C5, 1],
        [B4, on6, 'G'], [D5, on6], [G4, on6], [C5, 2 * on6, 'C'], [B4, on6],
        [A4, on6, 'D7'], [G4, on6], [Fs4, on6], [G4, 1, 'G'],
        // B 段
        [G5, 2 * on6, 'G', true], [D5, on6], [E5, 2 * on6, 'C'], [D5, on6],
        [G5, 2 * on6, 'G'], [D5, on6], [E5, 2 * on6, 'C'], [D5, on6],
        [D5, on6, 'D'], [E5, on6], [Fs5, on6], [G5, on6, 'G'], [Fs5, on6], [E5, on6],
        [D5, on6, 'Bm'], [C5, on6], [B4, on6], [A4, 1, 'A7'],
        [D5, on6, 'D7', true], [C5, on6], [B4, on6], [A4, on6], [B4, on6], [C5, on6],
        [D5, on6], [C5, on6], [B4, on6], [A4, on6], [B4, on6], [C5, on6],
        [B4, on6, 'G'], [D5, on6], [G4, on6], [C5, 2 * on6, 'C'], [B4, on6],
        [A4, on6, 'D7'], [G4, on6], [Fs4, on6], [G4, 2 * on6, 'G', true], [0, on6],
    ], 2, 'D7', on6),
};

/** 8. 联军高潮/凯旋号角：《统治吧，不列颠尼亚！》Rule, Britannia! (Thomas Arne 1740, D大调 4/4) */
const ruleBritannia: MarchTrack = {
    id: 'gb_rule_britannia',
    faction: 1,
    title: '统治吧，不列颠尼亚',
    subtitle: 'Rule, Britannia! · Thomas Arne 1740',
    bpm: 108,
    meter: '4/4',
    fanfareOnly: true,
    steps: compileScore([
        [A4, 1, 'A7'],
        [D5, 1, 'D', true], [D5, 0.5], [D5, 0.5], [D5, 1], [Fs5, 0.5], [E5, 0.5],
        [D5, 1], [Cs5, 0.5, 'A7'], [B4, 0.5], [A4, 1.5, 'D'], [A4, 0.5],
        [B4, 1, 'G', true], [B4, 0.5], [Cs5, 0.5], [D5, 1, 'D'], [D5, 0.5], [E5, 0.5],
        [Fs5, 1, 'D'], [G5, 0.5, 'G'], [E5, 0.5, 'A7'], [Fs5, 1.5, 'D'], [A4, 0.5],
        [D5, 1, 'D', true], [Fs4, 0.5], [G4, 0.5], [A4, 1, 'A7'], [B4, 0.5], [Cs5, 0.5],
        [D5, 1, 'D'], [Fs4, 0.5], [G4, 0.5], [A4, 1.5, 'A7'], [E5, 0.5],
        [Fs5, 1, 'D', true], [E5, 0.5], [D5, 0.5], [A5, 1, 'A'], [Cs5, 0.5], [D5, 0.5],
        [E5, 1, 'A7'], [D5, 0.5], [Cs5, 0.5], [D5, 2, 'D', true], [0, 1],
    ], 4, 'A7', 1),
};

export const FRENCH_TRACKS: MarchTrack[] = [chantDuDepart, chansonOignon, victoireEstANous, marseillaise];
export const BRITISH_TRACKS: MarchTrack[] = [britishGrenadiers, girlLeftBehind, lilliburlero, ruleBritannia];
export const ALL_TRACKS: MarchTrack[] = [...FRENCH_TRACKS, ...BRITISH_TRACKS];

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** 古典战地军乐合成器：横笛 + 铜管合奏 + 圆号和声 + 大号低音 + 军鼓滚奏。 */
export class MarchMusic {
    mode: MusicMode = 'duel';
    private ctx?: AudioContext;
    private out?: GainNode;
    private musicGain?: GainNode;
    private reverbIn?: GainNode;
    private noise?: AudioBuffer;
    private fifeWave?: PeriodicWave;
    private brassWave?: PeriodicWave;
    private track: MarchTrack = chantDuDepart;
    private cursor = 0;
    private nextAt = 0;
    private turnFaction: Faction = 0;
    private lastWinner: Faction | null = null;
    private preferredSide: Faction | -1 = -1;
    private frIndex = 0;
    private gbIndex = 0;
    private listener?: (track: MarchTrack) => void;

    get currentTrack(): MarchTrack {
        return this.track;
    }

    onTrackChange(cb: (track: MarchTrack) => void) {
        this.listener = cb;
        cb(this.track);
    }

    init(ctx: AudioContext, targetBus: GainNode, noise: AudioBuffer) {
        if (this.ctx === ctx) return;
        this.ctx = ctx;
        this.noise = noise;
        const master = this.out = ctx.createGain();
        master.gain.value = 1;
        master.connect(targetBus);

        const dry = this.musicGain = ctx.createGain();
        dry.gain.value = 0.88;
        dry.connect(master);

        // 战地原野立体声空气延迟尾音（模拟旷野传来的军乐队空间感）
        const revIn = this.reverbIn = ctx.createGain();
        revIn.gain.value = 0.24;
        const d1 = ctx.createDelay(0.5);
        const d2 = ctx.createDelay(0.5);
        d1.delayTime.value = 0.085;
        d2.delayTime.value = 0.145;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2100;
        const fb = ctx.createGain();
        fb.gain.value = 0.22;
        revIn.connect(d1);
        d1.connect(lp);
        lp.connect(d2);
        d2.connect(fb);
        fb.connect(d1);
        lp.connect(master);
        d2.connect(master);

        // 定制木管横笛谐波波形（基音饱满，奇次谐波轻柔）
        this.fifeWave = ctx.createPeriodicWave(
            new Float32Array([0, 0, 0, 0, 0]),
            new Float32Array([0, 1.0, 0.26, 0.12, 0.04])
        );
        // 定制铜管号角谐波波形（丰富偶奇谐波但高频圆润不刺耳）
        this.brassWave = ctx.createPeriodicWave(
            new Float32Array([0, 0, 0, 0, 0, 0, 0]),
            new Float32Array([0, 1.0, 0.72, 0.52, 0.34, 0.2, 0.1])
        );
        this.nextAt = ctx.currentTime + 0.05;
    }

    setMode(mode: MusicMode) {
        this.mode = mode;
        if (mode === 'fr' && this.track.faction !== 0) {
            this.selectTrack(this.pickRegular(0));
        } else if (mode === 'gb' && this.track.faction !== 1) {
            this.selectTrack(this.pickRegular(1));
        }
    }

    onBattleStart(betSide: Faction | -1) {
        this.preferredSide = betSide;
        this.lastWinner = null;
        if (this.mode === 'off') return;
        const firstSide: Faction = this.mode === 'fr' ? 0 : this.mode === 'gb' ? 1 : betSide === -1 ? (Math.random() < 0.5 ? 0 : 1) : betSide;
        this.turnFaction = firstSide;
        this.selectTrack(this.pickRegular(firstSide));
    }

    nextTrack() {
        if (this.mode === 'off') this.mode = 'duel';
        const nextSide: Faction = this.mode === 'fr' ? 0 : this.mode === 'gb' ? 1 : (this.track.faction === 0 ? 1 : 0);
        this.turnFaction = nextSide;
        this.selectTrack(this.pickRegular(nextSide));
    }

    private pickRegular(faction: Faction): MarchTrack {
        const pool = (faction === 0 ? FRENCH_TRACKS : BRITISH_TRACKS).filter(t => !t.fanfareOnly);
        if (faction === 0) {
            const t = pool[this.frIndex % pool.length];
            this.frIndex++;
            return t;
        }
        const t = pool[this.gbIndex % pool.length];
        this.gbIndex++;
        return t;
    }

    private pickFanfare(faction: Faction): MarchTrack {
        const list = faction === 0 ? FRENCH_TRACKS : BRITISH_TRACKS;
        return list.find(t => t.fanfareOnly) ?? list[0];
    }

    private selectTrack(track: MarchTrack) {
        this.track = track;
        this.cursor = 0;
        if (this.ctx) this.nextAt = Math.max(this.nextAt, this.ctx.currentTime + 0.04);
        this.listener?.(track);
    }

    update(paused: boolean, phase: BattlePhase, winner: Faction | null, muted: boolean) {
        const ctx = this.ctx;
        if (!ctx || !this.out || !this.musicGain || !this.reverbIn) return;
        const active = !muted && !paused && this.mode !== 'off' && ctx.state === 'running';
        this.out.gain.setTargetAtTime(active ? 1 : 0, ctx.currentTime, 0.06);
        if (!active) {
            this.nextAt = ctx.currentTime + 0.04;
            return;
        }

        // 决胜时刻：自动奏响胜利方的皇家/帝国凯旋乐章
        if (winner !== null && winner !== this.lastWinner) {
            this.lastWinner = winner;
            if (this.mode === 'duel' || (this.mode === 'fr' && winner === 0) || (this.mode === 'gb' && winner === 1)) {
                this.selectTrack(this.pickFanfare(winner));
            }
        }

        if (this.nextAt < ctx.currentTime - 0.08) this.nextAt = ctx.currentTime;

        while (this.nextAt < ctx.currentTime + 0.16) {
            if (this.cursor >= this.track.steps.length) {
                if (winner !== null) {
                    // 胜利后保持在凯旋或胜利方标准进行曲循环
                    const side = this.mode === 'fr' ? 0 : this.mode === 'gb' ? 1 : winner;
                    this.selectTrack(this.pickRegular(side));
                } else if (this.mode === 'duel') {
                    this.turnFaction = this.track.faction === 0 ? 1 : 0;
                    if (phase === 'assault' && Math.random() < 0.35) {
                        const lead = this.preferredSide === 0 || this.preferredSide === 1 ? this.preferredSide : this.turnFaction;
                        this.selectTrack(this.pickFanfare(lead));
                    } else {
                        this.selectTrack(this.pickRegular(this.turnFaction));
                    }
                } else {
                    const side: Faction = this.mode === 'fr' ? 0 : 1;
                    this.selectTrack(phase === 'assault' && !this.track.fanfareOnly ? this.pickFanfare(side) : this.pickRegular(side));
                }
            }

            const step = this.track.steps[this.cursor++];
            const dur = step.beats * (60 / this.track.bpm);
            this.scheduleStep(step, this.nextAt, dur, phase);
            this.nextAt += dur;
        }
    }

    private scheduleStep(step: NoteStep, at: number, dur: number, phase: BattlePhase) {
        if (step.pitch > 0) {
            // 1. 军笛/短笛：全阶段领奏，行军阶段最清晰
            const fifePitch = step.pitch < 66 ? step.pitch + 12 : step.pitch;
            this.playFife(midiToHz(fifePitch), at, dur * 0.9, phase === 'march' ? 0.18 : 0.14);

            // 2. 帝国铜管：接敌与冲锋阶段高亢吹响
            if (phase !== 'march') {
                const brassVol = phase === 'assault' || phase === 'victory' ? 0.16 : 0.11;
                this.playBrass(midiToHz(step.pitch), at, dur * 0.92, brassVol);
            }
        }

        // 3. 大号低音与圆号柱式伴奏（进行曲律动灵魂）
        if (step.chord) {
            const c = CHORDS[step.chord];
            if (step.downbeat) {
                this.playBass(midiToHz(c.bass), at, Math.min(0.42, dur * 0.95), phase === 'march' ? 0.17 : 0.22);
                this.playBassDrum(at, phase === 'assault' || phase === 'victory' ? 0.28 : 0.2);
                if (phase !== 'march') this.playSnare(at, 0.095, false);
            } else if (step.offbeat) {
                const chordVol = phase === 'march' ? 0.042 : 0.065;
                this.playHornChord(c.triad.map(midiToHz), at, Math.min(0.22, dur * 0.72), chordVol);
                this.playSnare(at, phase === 'assault' || phase === 'victory' ? 0.15 : 0.115, true);
            } else if ((phase === 'assault' || phase === 'victory') && step.beats >= 0.5) {
                this.playSnare(at, 0.075, false);
            }
        }

        if (step.cymbal && (phase === 'assault' || phase === 'victory')) {
            this.playCymbal(at, 0.09);
        }
    }

    private playFife(hz: number, at: number, dur: number, vol: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.setPeriodicWave(this.fifeWave!);
        osc.frequency.setValueAtTime(hz, at);
        lfo.frequency.value = 5.4;
        lfoGain.gain.value = hz * 0.0045;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.022);
        g.gain.setValueAtTime(vol * 0.85, at + Math.max(0.03, dur * 0.65));
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

        osc.connect(g);
        g.connect(this.musicGain!);
        g.connect(this.reverbIn!);

        osc.start(at);
        lfo.start(at);
        osc.stop(at + dur + 0.02);
        lfo.stop(at + dur + 0.02);
        osc.onended = () => { osc.disconnect(); lfo.disconnect(); lfoGain.disconnect(); g.disconnect(); };
    }

    private playBrass(hz: number, at: number, dur: number, vol: number) {
        const ctx = this.ctx!;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        o1.setPeriodicWave(this.brassWave!);
        o2.setPeriodicWave(this.brassWave!);
        o1.frequency.setValueAtTime(hz * 0.997, at);
        o2.frequency.setValueAtTime(hz * 1.003, at);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(480, at);
        filter.frequency.exponentialRampToValueAtTime(2500, at + Math.min(0.08, dur * 0.35));
        filter.frequency.exponentialRampToValueAtTime(1400, at + dur);

        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.028);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

        o1.connect(filter);
        o2.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain!);
        g.connect(this.reverbIn!);

        o1.start(at);
        o2.start(at);
        o1.stop(at + dur + 0.02);
        o2.stop(at + dur + 0.02);
        o1.onended = () => { o1.disconnect(); o2.disconnect(); filter.disconnect(); g.disconnect(); };
    }

    private playHornChord(freqs: number[], at: number, dur: number, vol: number) {
        const ctx = this.ctx!;
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.value = 1150;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        filter.connect(g);
        g.connect(this.musicGain!);
        g.connect(this.reverbIn!);

        const oscs = freqs.map((f) => {
            const o = ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.setValueAtTime(f, at);
            o.connect(filter);
            o.start(at);
            o.stop(at + dur + 0.01);
            return o;
        });
        oscs[0].onended = () => {
            for (const o of oscs) o.disconnect();
            filter.disconnect();
            g.disconnect();
        };
    }

    private playBass(hz: number, at: number, dur: number, vol: number) {
        const ctx = this.ctx!;
        const o = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(hz, at);
        filter.type = 'lowpass';
        filter.frequency.value = 340;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain!);
        o.start(at);
        o.stop(at + dur + 0.02);
        o.onended = () => { o.disconnect(); filter.disconnect(); g.disconnect(); };
    }

    private playSnare(at: number, vol: number, flam: boolean) {
        const hit = (t: number, v: number) => {
            const ctx = this.ctx!;
            const n = ctx.createBufferSource();
            n.buffer = this.noise!;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 2400;
            bp.Q.value = 0.9;
            const g = ctx.createGain();
            g.gain.setValueAtTime(v, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
            n.connect(bp);
            bp.connect(g);
            g.connect(this.musicGain!);
            g.connect(this.reverbIn!);
            n.start(t);
            n.stop(t + 0.1);
            n.onended = () => { n.disconnect(); bp.disconnect(); g.disconnect(); };

            const body = ctx.createOscillator();
            const bg = ctx.createGain();
            body.type = 'triangle';
            body.frequency.setValueAtTime(190, t);
            body.frequency.exponentialRampToValueAtTime(105, t + 0.055);
            bg.gain.setValueAtTime(v * 0.7, t);
            bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
            body.connect(bg);
            bg.connect(this.musicGain!);
            body.start(t);
            body.stop(t + 0.065);
            body.onended = () => { body.disconnect(); bg.disconnect(); };
        };
        if (flam) hit(Math.max(this.ctx!.currentTime, at - 0.032), vol * 0.48);
        hit(Math.max(this.ctx!.currentTime, at), vol);
    }

    private playBassDrum(at: number, vol: number) {
        const ctx = this.ctx!;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(98, at);
        o.frequency.exponentialRampToValueAtTime(42, at + 0.14);
        g.gain.setValueAtTime(vol, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
        o.connect(g);
        g.connect(this.musicGain!);
        o.start(at);
        o.stop(at + 0.2);
        o.onended = () => { o.disconnect(); g.disconnect(); };
    }

    private playCymbal(at: number, vol: number) {
        const ctx = this.ctx!;
        const n = ctx.createBufferSource();
        n.buffer = this.noise!;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 5200;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
        n.connect(hp);
        hp.connect(g);
        g.connect(this.musicGain!);
        g.connect(this.reverbIn!);
        n.start(at);
        n.stop(at + 0.58);
        n.onended = () => { n.disconnect(); hp.disconnect(); g.disconnect(); };
    }
}
