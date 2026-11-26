export type Faction = 0 | 1;
export type Kind = 'peasant' | 'sapper' | 'highlander' | 'rocket_crew' | 'lancer' | 'supply_wagon' | 'line_infantry' | 'guard_grenadier' | 'rifleman' | 'volley_gunner' | 'dragoon' | 'cuirassier' | 'hussar' | 'field_cannon' | 'howitzer' | 'horse_artillery';
export type Formation = 'square' | 'line' | 'crescent' | 'melee';
export type MapId = 'twin' | 'darkwood' | 'gorge';
export type Mode = 'sandbox' | 'lord';
export type Difficulty = 'easy' | 'normal' | 'brutal';
export type Facility = 'barracks' | 'range' | 'stables' | 'academy' | 'foundry';
export type Resource = 'wood' | 'gold';
export type Tech = 'steel' | 'powder' | 'grape';
export type Phase = 'PATROL_GATHER'|'WAVE_ASSAULT'|'RETREAT_REGROUP';
export interface Realm {cooldownUntil?:number;phase:Phase; wave:number; baseline:number; policy:'gold'|'wood'|'auto';wood:number; gold:number; age:number; grape:boolean; steel:boolean; powder:boolean; farmersKilled:number; rally:Point|null}
export interface FireCell extends Point {end:number; faction:Faction; kind:Kind; spread:number}
export interface Barrel extends Point {due:number; faction:Faction}
export interface Drop extends Point {resource:Resource; amount:number}
export type StructureType = Facility | 'wheat' | 'mine' | 'rock' | 'keep' | 'tower' | 'gate' | 'wall' | 'lowwall' | 'palisade' | 'bridge' | 'pontoon' | 'tree' | 'house' | 'farmhouse' | 'windmill' | 'redoubt';
export type BuildType = Facility | 'lowwall' | 'palisade' | 'pontoon' | 'redoubt';
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
    treeArt?:'oak'|'beech'|'spruce'|'bush'; scale?:number; flip?:boolean; stock?: number; work?:number; needed?:number; age?:number; queue?:{kind:Kind; full?:boolean; progress:number; total:number}[]; rally?:Point;
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
    face: number; faceLock:number; squareSide?:number; rankIndex:number; pose:'march1'|'march2'|'aim'|'kneel'|'bayonet'|'reload'; firedAt?:number; commandRole?:'flag'|'drum'; farm?:number; returning?:boolean; passedBend?:boolean;
    swing: number;
    charge: number;
    tower: number;
    target: number;
    lastAttacker: number;
    lastKind: Kind;
    lethalFall: boolean;
    gun?:number; wave?:number; manual?:boolean; crew?:number; morale?:number; grenadeAt?:number; marchSlot?:number; moving?:boolean; deployed?:boolean; enterTower?:number; job?:number; cargo?:number; resource?:Resource; prefer?:Resource; auraUntil?:number; escort?:'drum'|'horn'|'guard'; leader?:number; guardSide?:number; laborTick?:number;
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
    unitId?: number; flag?:boolean;
}
type Action = {type:'charge'|'recall'|'cottage'|'policy';payload:{}} | {type:'repair';payload:{site:number;ids:number[]}} | {type:'garrison';payload:{tower:number;ids:number[]}} | {type:'train';payload:{kind:Kind; full?:boolean; building?:number}} | {type:'age';payload:Point} | {type:'research';payload:{tech:Tech}} | {type:'rally';payload:Point & {building?:number}} | {type:'gather';payload:{resource:Resource;ids?:number[];target?:number}} | {
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
    lineFacing?:number; reformUntil?:number; contactTick?:number; firingLine?:Point; reform?:Point; escortGroup?:number; volleyStart?:number; resting?:boolean; restTick?:number; peak?:number; destination?:Point; targetId: number;
    anchor: Point;
}
export interface Stat {
    kills: number;
    damage: number;
}
export interface Snapshot {
    fronts?:{x:number;y:number;breached:boolean}[]; player?:Faction; map?:MapId; mode?:Mode; difficulty?:Difficulty; realms?:Realm[]; fires?:FireCell[]; barrels?:Barrel[]; drops?:Drop[]; news?:string;
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
