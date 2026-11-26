import type { BuildType, Kind, Realm, StructureType } from './types';
export const BUILDINGS: Record<BuildType, [
    string,
    number,
    number,
    number,
    number,
    number
]> = {
    barracks: ['近卫军营', 120, 40, 90, 72, 1600], range: ['靶场与火器坊', 140, 60, 94, 68, 1350],
    stables: ['皇家马厩', 150, 80, 116, 74, 1450], academy: ['陆军学院与兵工厂', 120, 100, 84, 82, 1500],
    foundry: ['重炮铸造厂', 220, 120, 112, 86, 1850], palisade: ['木栅拒马', 35, 0, 38, 85, 550],
    lowwall: ['石砌矮墙', 55, 20, 40, 105, 800], pontoon: ['临时浮桥', 70, 0, 0, 84, 900], redoubt: ['沙袋野战炮台', 130, 40, 55, 52, 1100]
};
export const newRealm = (): Realm => ({ phase:"PATROL_GATHER",wave:0,baseline:0,policy:"auto",wood:520,gold:680, age: 1, grape:false, steel: false, powder: false, farmersKilled: 0, rally: null });
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
