export type Faction = 0 | 1;
export type Kind = 'line_infantry' | 'guard_grenadier' | 'cuirassier' | 'field_cannon' | 'bannerman';
export type Formation = 'line' | 'square' | 'crescent' | 'melee';
export type MapId = 'twin' | 'darkwood' | 'gorge';
export type Mode = 'sandbox' | 'lord';
export type Difficulty = 'easy' | 'normal' | 'brutal';
export interface Point {
    x: number;
    y: number;
}
export type StructureType = 'keep' | 'barracks' | 'tree' | 'bridge' | 'farmhouse' | 'redoubt' | 'windmill' | 'church' | 'haystack' | 'ruins' | 'pond' | 'tents';
export interface Structure extends Point {
    id: number;
    type: StructureType;
    w: number;
    h: number;
    hp: number;
    maxHp: number;
    faction: Faction | -1;
    treeArt?: 'oak' | 'beech' | 'spruce' | 'bush';
    scale?: number;
    flip?: boolean;
    cannonCooldowns?: number[];
    cannonAim?: { x: number; y: number; firedAt: number }[];
}
export interface Unit extends Point {
    id: number;
    kind: Kind;
    faction: Faction;
    hp: number;
    group: number;
    slot: number;
    formation: Formation;
    z: number;
    vx: number;
    vy: number;
    face: number;
    aimX: number;
    aimY: number;
    moving: boolean;
    marchDistance: number;
    offset: Point;
    cooldown: number;
    firedAt?: number;
    thrownAt?: number;
    grenadeAt?: number;
    tower: number;
    morale: number;
    crew?: number;
    routed: boolean;
    target: number;
    pose: 'march1' | 'march2' | 'aim' | 'reload' | 'bayonet' | 'kneel' | 'throw';
}
export type GroupState = 'assemble' | 'advance' | 'hold' | 'garrison' | 'retreat' | 'rest';
export interface Group {
    id: number;
    kind: Kind;
    faction: Faction;
    count: number;
    peak: number;
    state: GroupState;
    anchor: Point;
    point: Point | null;
    lane: number;
    home: Point;
    readyAt: number;
    site: number;
    seat: number;
    nextVolley: number;
    volleyAt: number;
    enemy: number;
    restTick: number;
    manual: boolean;
    assaultTarget?: number;
    scatteredUntil?: number;
    path?: Point[];
    pathGoal?: Point;
    pathTick?: number;
}
export interface Realm {
    gold: number;
    wave: number;
    rosterIndex: number;
    order: 'charge' | 'recall' | 'rampart' | 'auto';
}
export interface Projectile extends Point {
    id: number;
    kind: 'bullet' | 'ball' | 'flask';
    faction: Faction;
    source: Kind;
    damage: number;
    vx: number;
    vy: number;
    z: number;
    vz: number;
    gravity: number;
    target: number;
    remaining: number;
}
export type EventKind = 'hit' | 'death' | 'fire' | 'impact' | 'collapse' | 'slash' | 'drum' | 'horn' | 'launch' | 'splash' | 'block' | 'trail' | 'wade' | 'heal' | 'arrowland' | 'shell' | 'burst';
export interface SimEvent extends Point {
    type: EventKind;
    z?: number;
    dx?: number;
    dy?: number;
    kind?: Kind;
    faction?: Faction;
    structure?: Structure;
    power?: number;
    unitId?: number;
    flag?: boolean;
    explosive?: boolean;
}
export type CommandAction = {
    type: 'charge' | 'recall' | 'rampart';
    payload: {};
} | {
    type: 'train';
    payload: {
        kind: Kind;
    };
} | {
    type: 'spawn';
    payload: Point & {
        kind: Kind;
        count: number;
        formation: Formation;
    };
} | {
    type: 'formation';
    payload: {
        ids: number[];
        formation: Formation;
    };
} | {
    type: 'order';
    payload: {
        ids: number[];
        point: Point | null;
    };
} | {
    type: 'garrison';
    payload: {
        ids: number[];
        tower: number;
    };
} | {
    type: 'restore';
    payload: {
        state: Snapshot;
    };
} | {
    type: 'scenario';
    payload: {
        index: number;
        map?: MapId;
        mode?: Mode;
        difficulty?: Difficulty;
    };
};
export type Command = {
    tick: number;
    faction: Faction;
} & CommandAction;
export interface Stat {
    kills: number;
    damage: number;
}
export interface Snapshot {
    version: 6;
    tick: number;
    seed: number;
    next: number;
    scenario: number;
    player: Faction;
    map: MapId;
    mode: Mode;
    difficulty: Difficulty;
    realms: Realm[];
    news: string;
    units: Unit[];
    structures: Structure[];
    projectiles: Projectile[];
    groups: Group[];
    stats: Record<Kind, Stat>[];
    dead: number[];
    winner: Faction | null;
}
