import type { BuildType, Kind, Realm, StructureType } from './types';
export const BUILDINGS: Record<BuildType, [
    string,
    number,
    number,
    number,
    number,
    number
]> = {
    barracks: ['兵营', 120, 40, 90, 72, 1600], range: ['靶场与火器坊', 140, 60, 94, 68, 1350],
    stables: ['马厩与兽栏', 150, 80, 116, 74, 1450], abbey: ['修道院与战旗营', 120, 100, 84, 82, 1500],
    siege_workshop: ['攻城器械厂', 220, 120, 112, 86, 1850], palisade: ['木栅拒马', 35, 0, 38, 85, 550],
    lowwall: ['石砌矮墙', 55, 20, 40, 105, 800], pontoon: ['临时浮桥', 70, 0, 0, 84, 900], outpost: ['前哨箭塔', 130, 40, 55, 52, 1100]
};
export const CATEGORIES = ['全部', '经济支援', '步兵', '远程火器', '骑兵巨兽', '攻城器械'];
// Category, producer, required keep age, timber, gold.
export const ROSTER: Record<Kind, [
    number,
    StructureType,
    number,
    number,
    number
]> = {
    peasant: [1, 'keep', 1, 0, 25], sapper: [1, 'keep', 1, 15, 40], monk: [1, 'abbey', 2, 0, 65], bannerman: [1, 'abbey', 2, 20, 70],
    militia: [2, 'keep', 1, 10, 12], shieldman: [2, 'barracks', 1, 15, 35], pikeman: [2, 'barracks', 1, 25, 35], halberdier: [2, 'barracks', 2, 20, 75], zweihander: [2, 'barracks', 2, 10, 70], berserker: [2, 'barracks', 1, 5, 55], plate_knight: [2, 'barracks', 3, 0, 95],
    bowman: [3, 'range', 1, 25, 20], longbowman: [3, 'range', 2, 40, 45], crossbowman: [3, 'range', 1, 35, 45], musketeer: [3, 'range', 2, 20, 75], blunderbuss: [3, 'range', 2, 20, 70], fire_bomber: [3, 'range', 3, 35, 60],
    scout_cavalry: [4, 'stables', 1, 15, 55], horse_archer: [4, 'stables', 2, 30, 65], heavy_lancer: [4, 'stables', 2, 20, 115], war_elephant: [4, 'stables', 3, 40, 240],
    catapult: [5, 'siege_workshop', 2, 120, 100], ballista: [5, 'siege_workshop', 2, 90, 95], hwacha: [5, 'siege_workshop', 3, 110, 120], field_cannon: [5, 'siege_workshop', 3, 80, 160], battering_ram: [5, 'siege_workshop', 1, 100, 70]
};
export const AGES = ['', '领主铁血', '铁骑列阵', '黑火药攻城'];
export const newRealm = (): Realm => ({ wood: 260, gold: 240, age: 1, steel: false, powder: false, farmersKilled: 0, rally: null });
export function pay(realm: Realm, wood: number, gold: number) {
    if (realm.wood < wood || realm.gold < gold)
        return false;
    realm.wood -= wood;
    realm.gold -= gold;
    return true;
}
export const ready = (s: {
    hp: number;
    needed?: number;
}) => s.hp > 0 && !s.needed;
export function producer(kind: Kind | 'guard') { return kind === 'guard' ? [1, 'abbey', 2, 60, 350] as const : ROSTER[kind]; }
