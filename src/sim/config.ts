import type {Kind} from './types';
interface Definition {name:string;role:string;hp:number;damage:number;armor:number;speed:number;range:number;reload:number;penetration:number;traits:string[];wood:number;gold:number}
export const UNITS: Record<Kind,Definition> = {
    peasant: {"name":"农夫","role":"经济","hp":32,"damage":4,"armor":0.02,"speed":2.4,"range":15,"reload":45,"penetration":0,"traits":["labor"],"wood":0,"gold":20},
    sapper: {"name":"战地工兵","role":"步兵","hp":86,"damage":24,"armor":0.21,"speed":1.45,"range":24,"reload":60,"penetration":0.15,"traits":["builder"],"wood":28,"gold":65},
    bannerman: {"name":"英法皇家仪仗队","role":"仪仗","hp":128,"damage":14,"armor":0.28,"speed":1.2,"range":24,"reload":34,"penetration":0.1,"traits":["aura"],"wood":30,"gold":85},
    shieldman: {"name":"哥特重盾步兵","role":"步兵","hp":120,"damage":15,"armor":0.36,"speed":1.22,"range":19,"reload":28,"penetration":0.05,"traits":["shield"],"wood":24,"gold":55},
    halberdier: {"name":"皇家重甲长戟兵","role":"步兵","hp":142,"damage":27,"armor":0.4,"speed":1.15,"range":35,"reload":32,"penetration":0.45,"traits":["brace","armor"],"wood":35,"gold":85},
    zweihander: {"name":"双手大剑客","role":"步兵","hp":138,"damage":34,"armor":0.32,"speed":1.28,"range":38,"reload":39,"penetration":0.28,"traits":["sweep"],"wood":28,"gold":95},
    plate_knight: {"name":"哥特全身板甲骑士","role":"步兵","hp":205,"damage":35,"armor":0.74,"speed":1.05,"range":24,"reload":38,"penetration":0.18,"traits":["cleave","armor"],"wood":45,"gold":125},
    musketeer: {"name":"线列燧发火枪手","role":"火枪","hp":64,"damage":48,"armor":0.12,"speed":1.15,"range":285,"reload":96,"penetration":0.85,"traits":["powder"],"wood":30,"gold":65},
    guard_grenadier: {"name":"熊皮帽近卫掷弹兵","role":"火枪","hp":118,"damage":54,"armor":0.25,"speed":1.18,"range":300,"reload":92,"penetration":0.86,"traits":["powder"],"wood":42,"gold":110},
    rifleman: {"name":"绿衣线膛狙击猎兵","role":"火枪","hp":58,"damage":68,"armor":0.1,"speed":1.42,"range":445,"reload":110,"penetration":0.9,"traits":["powder"],"wood":45,"gold":105},
    volley_gunner: {"name":"七管齐射重火铳手","role":"火枪","hp":82,"damage":21,"armor":0.16,"speed":1.12,"range":195,"reload":122,"penetration":0.82,"traits":["powder","scatter"],"wood":48,"gold":100},
    dragoon: {"name":"龙骑兵","role":"火枪","hp":108,"damage":34,"armor":0.22,"speed":5.1,"range":245,"reload":66,"penetration":0.65,"traits":["mount","powder","flank"],"wood":50,"gold":125},
    heavy_lancer: {"name":"哥特披甲重骑兵","role":"骑兵","hp":215,"damage":36,"armor":0.54,"speed":4.6,"range":32,"reload":34,"penetration":0.22,"traits":["mount","charge","armor","flank"],"wood":55,"gold":150},
    scout_cavalry: {"name":"骠骑轻骑兵","role":"骑兵","hp":98,"damage":20,"armor":0.16,"speed":5.8,"range":26,"reload":24,"penetration":0.1,"traits":["mount","flank"],"wood":35,"gold":95},
    davinci_tank: {"name":"达芬奇木甲战车","role":"重炮机械","hp":680,"damage":58,"armor":0.85,"speed":0.75,"range":210,"reload":150,"penetration":0.65,"traits":["siege","armor","powder"],"wood":160,"gold":190},
    field_cannon: {"name":"长管野战加农炮","role":"重炮机械","hp":240,"damage":88,"armor":0.35,"speed":0.85,"range":2450,"reload":185,"penetration":0.78,"traits":["siege","rolling","powder"],"wood":105,"gold":140},
    siege_mortar: {"name":"哥特重型臼炮","role":"重炮机械","hp":290,"damage":110,"armor":0.36,"speed":0.7,"range":2600,"reload":225,"penetration":0.7,"traits":["siege","arc"],"wood":120,"gold":165},
    organ_gun: {"name":"管风琴连发炮","role":"重炮机械","hp":210,"damage":36,"armor":0.3,"speed":0.8,"range":2250,"reload":240,"penetration":0.8,"traits":["siege","powder","salvo"],"wood":110,"gold":148}
};
export const KINDS=Object.keys(UNITS) as Kind[];
export const SIDES=['法兰西王国','英格兰王国'];
export const TPS=30;
export const crews:Partial<Record<Kind,number>>={field_cannon:3,siege_mortar:4,organ_gun:2};
export const capacity=[0,12,20,30,44];
export const batchSize = (kind: Kind) => (kind === 'peasant' || kind === 'bannerman' || UNITS[kind].role === '重炮机械') ? 1 : 5;
