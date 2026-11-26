export type Faction = 0 | 1;
export type Kind = 'peasant' | 'sapper' | 'monk' | 'bannerman' | 'pikeman' | 'zweihander' | 'berserker' | 'longbowman' | 'crossbowman' | 'blunderbuss' | 'fire_bomber' | 'horse_archer' | 'war_elephant' | 'ballista' | 'hwacha' | 'battering_ram' | 'militia' | 'shieldman' | 'halberdier' | 'plate_knight' | 'scout_cavalry' | 'heavy_lancer' | 'bowman' | 'musketeer' | 'catapult' | 'field_cannon';
export type Formation = 'phalanx' | 'line' | 'skirmish';
export type MapId = 'twin' | 'bottleneck' | 'isles' | 'darkwood' | 'gorge';
export type Mode = 'sandbox' | 'lord';
export type Difficulty = 'easy' | 'normal' | 'brutal';
export type Facility = 'barracks' | 'range' | 'stables' | 'abbey' | 'siege_workshop';
export type Resource = 'wood' | 'gold';
export type Tech = 'steel' | 'powder';
export interface Realm {wood:number; gold:number; age:number; steel:boolean; powder:boolean; farmersKilled:number; rally:Point|null}
export interface FireCell extends Point {end:number; faction:Faction; kind:Kind; spread:number}
export interface Barrel extends Point {due:number; faction:Faction}
export interface Drop extends Point {resource:Resource; amount:number}
export type StructureType = Facility | 'mine' | 'rock' | 'keep' | 'tower' | 'gate' | 'wall' | 'lowwall' | 'palisade' | 'bridge' | 'pontoon' | 'tree' | 'house' | 'outpost';
export type BuildType = Facility | 'lowwall' | 'palisade' | 'pontoon' | 'outpost';
export interface Point {
    x: number;
    y: number;
}
export interface Body extends Point {
    z: number;
    vx: number;
    vy: number;
    vz: number;
}
export interface Structure extends Point {
    id: number;
    type: StructureType;
    w: number;
    h: number;
    hp: number;
    maxHp: number;
    stock?: number; work?:number; needed?:number; age?:number; queue?:{kind:Kind|'guard'; progress:number; total:number}[]; rally?:Point;
    faction: Faction | -1;
}
export interface Unit extends Body {
    id: number;
    faction: Faction;
    kind: Kind;
    hp: number;
    formation: Formation;
    group: number;
    slot: number;
    cooldown: number;
    face: number;
    swing: number;
    charge: number;
    tower: number;
    target: number;
    lastAttacker: number;
    lastKind: Kind;
    lethalFall: boolean;
    enterTower?:number; job?:number; cargo?:number; resource?:Resource; prefer?:Resource; auraUntil?:number; escort?:'drum'|'horn'|'guard'; leader?:number; guardSide?:number; laborTick?:number;
}
export type Shot = 'spear' | 'rocket' | 'flask' | 'pellet' | 'bolt' | 'arrow' | 'bullet' | 'stone' | 'ball';
export interface Projectile extends Body {
    id: number;
    kind: Shot;
    faction: Faction;
    source: Kind;
    damage: number;
    remaining: number;
    target: number;
    bounces: number;
    hit: number[];
    gravity: number;
}
export type EventKind = 'wade' | 'heal' | 'drum' | 'horn' | 'hit' | 'death' | 'launch' | 'splash' | 'fire' | 'impact' | 'collapse' | 'block' | 'slash' | 'arrowland' | 'trail';
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
}
type Action = {type:'repair';payload:{site:number;ids:number[]}} | {type:'garrison';payload:{tower:number;ids:number[]}} | {type:'train';payload:{kind:Kind|'guard'; building?:number}} | {type:'age'|'guard';payload:Point} | {type:'research';payload:{tech:Tech}} | {type:'rally';payload:Point & {building?:number}} | {type:'gather';payload:{resource:Resource;ids?:number[];target?:number}} | {
    type: 'spawn';
    payload: Point & {
        kind: Kind;
        count: number;
        formation: Formation;
    };
} | {
    type: 'build';
    payload: Point & {
        kind: BuildType;
    };
} | {
    type: 'formation';
    payload: {
        formation: Formation;
        ids?: number[];
        kind?: Kind;
    };
} | {
    type: 'order';
    payload: {
        point: Point | null;
        ids?: number[];
        kind?: Kind;
        structureId?: number;
    };
} | {
    type: 'scenario';
    payload: {
        index: number; map?:MapId; mode?:Mode; difficulty?:Difficulty;
    };
} | {
    type: 'restore';
    payload: {
        state: Snapshot;
    };
};
export type Command = {
    tick: number;
    faction: Faction;
} & Action;
export type CommandAction = Action;
export interface Group {
    id: number;
    count: number;
    point: Point | null;
    targetId: number;
    anchor: Point;
}
export interface Stat {
    kills: number;
    damage: number;
}
export interface Snapshot {
    map?:MapId; mode?:Mode; difficulty?:Difficulty; realms?:Realm[]; fires?:FireCell[]; barrels?:Barrel[]; drops?:Drop[]; news?:string;
    tick: number;
    seed: number;
    next: number;
    scenario: number;
    units: Unit[];
    structures: Structure[];
    projectiles: Projectile[];
    groups: Group[];
    stats: Record<Kind, Stat>[];
    dead: number[];
    launches: number[];
    bridges: number;
    buildings: number;
    winner: Faction | null;
}
