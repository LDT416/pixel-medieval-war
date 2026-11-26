import type {Kind} from './types';
interface Definition {name:string;role:string;hp:number;damage:number;armor:number;speed:number;range:number;reload:number;penetration:number;traits:string[];wood:number;gold:number}
export const UNITS: Record<Kind,Definition> = {
    peasant: {"name":"农夫","role":"经济","hp":32,"damage":4,"armor":0.02,"speed":2.4,"range":15,"reload":45,"penetration":0,"traits":["labor"],"wood":0,"gold":20},
    sapper: {"name":"战地工兵","role":"步兵","hp":86,"damage":24,"armor":0.21,"speed":1.45,"range":24,"reload":60,"penetration":0.15,"traits":["builder"],"wood":28,"gold":65},
    line_infantry: {"name":"线列步兵团","role":"火枪","hp":64,"damage":48,"armor":0.12,"speed":1.15,"range":285,"reload":96,"penetration":0.85,"traits":["powder"],"wood":30,"gold":65},
    guard_grenadier: {"name":"熊皮帽近卫掷弹兵","role":"火枪","hp":118,"damage":54,"armor":0.25,"speed":1.18,"range":300,"reload":92,"penetration":0.86,"traits":["powder"],"wood":42,"gold":110},
    rifleman: {"name":"绿衣线膛狙击猎兵","role":"火枪","hp":58,"damage":68,"armor":0.1,"speed":1.42,"range":445,"reload":110,"penetration":0.9,"traits":["powder"],"wood":45,"gold":105},
    volley_gunner: {"name":"七管齐射重火铳手","role":"火枪","hp":82,"damage":21,"armor":0.16,"speed":1.12,"range":195,"reload":122,"penetration":0.82,"traits":["powder","scatter"],"wood":48,"gold":100},
    dragoon: {"name":"龙骑兵","role":"火枪","hp":108,"damage":34,"armor":0.22,"speed":5.1,"range":245,"reload":66,"penetration":0.65,"traits":["mount","powder","flank"],"wood":50,"gold":125},
    cuirassier: {"name":"胸甲重骑兵连","role":"骑兵","hp":215,"damage":36,"armor":0.54,"speed":4.6,"range":32,"reload":34,"penetration":0.22,"traits":["mount","charge","armor","flank"],"wood":55,"gold":150},
    hussar: {"name":"骠骑轻骑兵","role":"骑兵","hp":98,"damage":20,"armor":0.16,"speed":5.8,"range":26,"reload":24,"penetration":0.1,"traits":["mount","flank"],"wood":35,"gold":95},
    field_cannon: {"name":"12 磅野战重炮","role":"重炮机械","hp":240,"damage":88,"armor":0.35,"speed":0.85,"range":2450,"reload":185,"penetration":0.78,"traits":["siege","rolling","powder"],"wood":105,"gold":140},
    howitzer: {"name":"重型攻城榴弹炮","role":"重炮机械","hp":290,"damage":110,"armor":0.36,"speed":0.7,"range":2600,"reload":225,"penetration":0.7,"traits":["siege","arc"],"wood":120,"gold":165},
    horse_artillery: {"name":"马拉轻骑快炮","role":"重炮机械","hp":210,"damage":36,"armor":0.3,"speed":2.8,"range":2250,"reload":148,"penetration":0.8,"traits":["siege","rolling","powder"],"wood":110,"gold":148},
    highlander: {"name":"高地刺刀突击团","role":"火枪","hp":118,"damage":46,"armor":0.25,"speed":1.8,"range":300,"reload":92,"penetration":0.86,"traits":["powder"],"wood":42,"gold":110},
    lancer: {"name":"枪骑兵连","role":"骑兵","hp":215,"damage":36,"armor":0.24,"speed":5.4,"range":32,"reload":34,"penetration":0.65,"traits":["mount","charge","armor","flank"],"wood":55,"gold":150},
    rocket_crew: {"name":"康格里夫火箭连","role":"火枪","hp":82,"damage":67,"armor":0.16,"speed":1.12,"range":485,"reload":155,"penetration":0.82,"traits":["rocket"],"wood":48,"gold":100},
    supply_wagon: {"name":"军需补给车","role":"经济","hp":110,"damage":0,"armor":0.02,"speed":2.5,"range":15,"reload":45,"penetration":0,"traits":["wagon"],"wood":0,"gold":20}
};
export const KINDS=Object.keys(UNITS) as Kind[];
export const SIDES=['法兰西第一帝国','大不列颠王国'];
export const TPS=30;
export const crews:Partial<Record<Kind,number>>={field_cannon:3,howitzer:4,horse_artillery:2};
export const capacity=[0,12,20,30,44];
export const strength:Record<Kind,number>={line_infantry:120,guard_grenadier:90,highlander:90,rifleman:60,volley_gunner:40,rocket_crew:30,cuirassier:40,lancer:40,dragoon:40,hussar:40,field_cannon:1,howitzer:1,horse_artillery:1,peasant:1,sapper:20,supply_wagon:1};
export const rankFire=(k:Kind)=>['line_infantry','guard_grenadier','highlander'].includes(k);
export const shelter=(t:string)=>['farmhouse','windmill','redoubt','tower','lowwall','wall'].includes(t);
export const canGarrison=(k:Kind)=>rankFire(k)||['rifleman','volley_gunner','sapper'].includes(k);
export const batchSize=(k:Kind)=>strength[k]<=30?strength[k]:strength[k]===40?20:30;
export const formationSize=(k:Kind)=>UNITS[k].traits.includes('mount')?27:k==='rifleman'?27:16;
