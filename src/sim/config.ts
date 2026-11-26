import type {Kind} from './types';
interface Definition {name:string;role:string;hp:number;damage:number;armor:number;speed:number;range:number;reload:number;penetration:number;traits:string[];wood:number;gold:number}
export const UNITS: Record<Kind,Definition> = {
    peasant: {"name":"农夫","role":"经济","hp":32,"damage":4,"armor":0.02,"speed":2.8,"range":15,"reload":45,"penetration":0,"traits":["labor"],"wood":0,"gold":18},
    sapper: {"name":"战地工兵","role":"步兵","hp":86,"damage":24,"armor":0.21,"speed":2.5,"range":24,"reload":60,"penetration":0.15,"traits":["builder"],"wood":10,"gold":32},
    bannerman: {"name":"英法皇家仪仗队","role":"仪仗","hp":116,"damage":13,"armor":0.26,"speed":2.35,"range":24,"reload":34,"penetration":0.1,"traits":["aura"],"wood":20,"gold":70},
    shieldman: {"name":"哥特重盾步兵","role":"步兵","hp":110,"damage":15,"armor":0.31,"speed":2,"range":19,"reload":28,"penetration":0.05,"traits":["shield"],"wood":8,"gold":24},
    halberdier: {"name":"皇家重甲长戟兵","role":"步兵","hp":135,"damage":26,"armor":0.38,"speed":1.85,"range":35,"reload":32,"penetration":0.45,"traits":["brace","armor"],"wood":12,"gold":35},
    zweihander: {"name":"双手大剑客","role":"步兵","hp":135,"damage":32,"armor":0.32,"speed":2.15,"range":38,"reload":39,"penetration":0.28,"traits":["sweep"],"wood":8,"gold":42},
    plate_knight: {"name":"哥特全身板甲骑士","role":"步兵","hp":190,"damage":33,"armor":0.72,"speed":1.6,"range":24,"reload":38,"penetration":0.18,"traits":["cleave","armor"],"wood":16,"gold":50},
    musketeer: {"name":"线列燧发火枪手","role":"火枪","hp":62,"damage":52,"armor":0.12,"speed":1.9,"range":270,"reload":90,"penetration":0.85,"traits":["powder"],"wood":10,"gold":26},
    guard_grenadier: {"name":"熊皮帽近卫掷弹兵","role":"火枪","hp":115,"damage":56,"armor":0.24,"speed":2,"range":290,"reload":88,"penetration":0.85,"traits":["powder"],"wood":14,"gold":49},
    rifleman: {"name":"绿衣线膛狙击猎兵","role":"火枪","hp":56,"damage":72,"armor":0.1,"speed":2.6,"range":440,"reload":105,"penetration":0.9,"traits":["powder"],"wood":16,"gold":45},
    volley_gunner: {"name":"七管齐射重火铳手","role":"火枪","hp":80,"damage":22,"armor":0.16,"speed":2,"range":185,"reload":115,"penetration":0.82,"traits":["powder","scatter"],"wood":18,"gold":42},
    dragoon: {"name":"龙骑兵","role":"火枪","hp":105,"damage":35,"armor":0.2,"speed":4.4,"range":240,"reload":60,"penetration":0.65,"traits":["mount","powder","flank"],"wood":20,"gold":56},
    heavy_lancer: {"name":"哥特披甲重骑兵","role":"骑兵","hp":200,"damage":31,"armor":0.54,"speed":3.8,"range":31,"reload":35,"penetration":0.2,"traits":["mount","charge","armor"],"wood":20,"gold":75},
    scout_cavalry: {"name":"骠骑轻骑兵","role":"骑兵","hp":95,"damage":17,"armor":0.16,"speed":5.4,"range":25,"reload":25,"penetration":0.1,"traits":["mount","flank"],"wood":12,"gold":40},
    davinci_tank: {"name":"达芬奇木甲战车","role":"重炮机械","hp":640,"damage":55,"armor":0.84,"speed":0.85,"range":200,"reload":150,"penetration":0.65,"traits":["siege","armor","powder"],"wood":160,"gold":190},
    field_cannon: {"name":"长管野战加农炮","role":"重炮机械","hp":240,"damage":85,"armor":0.35,"speed":1,"range":2380,"reload":180,"penetration":0.78,"traits":["siege","rolling","powder"],"wood":105,"gold":140},
    siege_mortar: {"name":"哥特重型臼炮","role":"重炮机械","hp":290,"damage":106,"armor":0.36,"speed":0.8,"range":2550,"reload":225,"penetration":0.7,"traits":["siege","arc"],"wood":120,"gold":165},
    organ_gun: {"name":"管风琴连发炮","role":"重炮机械","hp":210,"damage":35,"armor":0.3,"speed":0.95,"range":2250,"reload":240,"penetration":0.8,"traits":["siege","powder","salvo"],"wood":110,"gold":148}
};
export const KINDS=Object.keys(UNITS) as Kind[];
export const SIDES=['法兰西王国','英格兰王国'];
export const TPS=30;
export const crews:Partial<Record<Kind,number>>={field_cannon:3,siege_mortar:4,organ_gun:2};
export const capacity=[0,8,14,22,32];
