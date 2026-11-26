import type { Kind, Formation } from './types';
export type Trait = 'labor' | 'builder' | 'heal' | 'aura' | 'pike' | 'sweep' | 'rage' | 'bolt' | 'scatter' | 'ignite' | 'kite' | 'stomp' | 'pierce' | 'salvo' | 'ram' | 'shield' | 'brace' | 'cleave' | 'flank' | 'mount' | 'charge' | 'arrow' | 'powder' | 'siege' | 'arc' | 'rolling' | 'armor';
interface Definition {
    name: string;
    role: string;
    traits: Trait[];
    hp: number;
    damage: number;
    armor: number;
    speed: number;
    range: number;
    reload: number;
    penetration: number;
    detail: string;
    tags: string[];
}
export const UNITS: Record<Kind, Definition> = {
    peasant: {"name":"农民","role":"劳役征税","hp":32,"damage":4,"armor":0.02,"speed":2.8,"range":15,"reload":45,"penetration":0,"traits":["labor"],"tags":["劳役征税"],"detail":"背着木料与金砂往返主堡。敌骑屠农时，口粮和血金一起落地。"},
    sapper: {"name":"战地工兵","role":"黑火药拆迁","hp":86,"damage":16,"armor":0.21,"speed":2.5,"range":24,"reload":100,"penetration":0.15,"traits":["builder"],"tags":["黑火药拆迁"],"detail":"厚皮甲里藏着引信。以常人两倍半的速度修筑工事，再用药桶炸穿敌门。"},
    monk: {"name":"铁血军医","role":"后列救治","hp":70,"damage":5,"armor":0.1,"speed":2.4,"range":16,"reload":60,"penetration":0,"traits":["heal"],"tags":["后列救治"],"detail":"修士盯紧板甲和象甲的裂口，以暗金十字续命，让前排再杀一轮。"},
    bannerman: {"name":"皇家战旗手","role":"王旗督战","hp":116,"damage":13,"armor":0.26,"speed":2.35,"range":24,"reload":34,"penetration":0.1,"traits":["aura"],"tags":["王旗督战"],"detail":"王旗所至，行军与挥刃加快两成。掌旗官被斩首，染血残旗永留原地。"},
    pikeman: {"name":"长矛兵","role":"反骑矛阵","hp":82,"damage":18,"armor":0.16,"speed":2.35,"range":44,"reload":29,"penetration":0.15,"traits":["pike"],"tags":["反骑矛阵"],"detail":"矛列剖开马腹，截断冲锋。对骑兵和战象造成 2.2 倍穿刺。"},
    zweihander: {"name":"双手大剑客","role":"破阵顺劈","hp":135,"damage":32,"armor":0.32,"speed":2.15,"range":38,"reload":39,"penetration":0.28,"traits":["sweep"],"tags":["破阵顺劈"],"detail":"双手剑横扫身前，一刀连斩最多四名挤在一起的死敌。"},
    berserker: {"name":"狂战双斧手","role":"浴血破木","hp":92,"damage":19,"armor":0.02,"speed":3.3,"range":23,"reload":18,"penetration":0.12,"traits":["rage"],"tags":["浴血破木"],"detail":"每一道伤口都催快双斧，濒死时攻速与伤害最高增加八成，木桥拒马吃双倍斧伤。"},
    longbowman: {"name":"皇家长弓手","role":"河岸狙杀","hp":62,"damage":25,"armor":0.1,"speed":2.15,"range":395,"reload":52,"penetration":0.25,"traits":["arrow","arc"],"tags":["河岸狙杀"],"detail":"长弓从对岸钉穿锁甲，驻塔后箭雨直落敌阵腹地。"},
    crossbowman: {"name":"破甲重弩手","role":"平射碎甲","hp":76,"damage":38,"armor":0.2,"speed":1.95,"range":280,"reload":61,"penetration":0.6,"traits":["bolt"],"tags":["平射碎甲"],"detail":"铁弩平射穿透六成护甲，专挑重戟卫和板甲骑士的胸口。"},
    blunderbuss: {"name":"霰弹喇叭枪手","role":"桥头霰射","hp":76,"damage":19,"armor":0.14,"speed":2.1,"range":165,"reload":66,"penetration":0.42,"traits":["powder","scatter"],"tags":["桥头霰射"],"detail":"截短枪管一次喷出七颗铁砂，在桥头近距离轰穿密集步骑。"},
    fire_bomber: {"name":"燃烧瓶掷弹兵","role":"焚林纵火","hp":58,"damage":28,"armor":0.1,"speed":2.25,"range":200,"reload":87,"penetration":0.22,"traits":["powder","ignite"],"tags":["焚林纵火"],"detail":"黑油瓶砸开火场。树木、木桥与躲在林后的敌兵一并烧焦。"},
    horse_archer: {"name":"草原弓骑兵","role":"游射屠农","hp":98,"damage":18,"armor":0.15,"speed":4.5,"range":242,"reload":43,"penetration":0.13,"traits":["mount","arrow","kite","flank"],"tags":["游射屠农"],"detail":"骑手退马仍能开弓，在铁甲步兵追来前射杀采金农夫。"},
    war_elephant: {"name":"披甲战象","role":"践踏破城","hp":940,"damage":65,"armor":0.52,"speed":1.5,"range":46,"reload":54,"penetration":0.38,"traits":["mount","stomp","armor"],"tags":["践踏破城"],"detail":"双弓手据象背射杀逃兵，铁足掀飞整片盾墙。火焰会造成 1.8 倍灼伤。"},
    ballista: {"name":"重型贯通弩炮","role":"贯列钢矛","hp":230,"damage":87,"armor":0.25,"speed":0.98,"range":490,"reload":113,"penetration":0.92,"traits":["siege","pierce"],"tags":["贯列钢矛"],"detail":"巨矛一线贯穿最多八人，轰穿象甲后把后排一并钉飞。"},
    hwacha: {"name":"多管火箭车","role":"燃矢覆盖","hp":225,"damage":22,"armor":0.21,"speed":0.98,"range":455,"reload":145,"penetration":0.25,"traits":["siege","powder","salvo"],"tags":["燃矢覆盖"],"detail":"十四支火箭覆盖桥头，火尾掠过人群，留下向林地蔓延的火种。"},
    battering_ram: {"name":"铁皮冲城车","role":"抵箭撞城","hp":470,"damage":100,"armor":0.38,"speed":1.6,"range":32,"reload":43,"penetration":0.2,"traits":["siege","ram"],"tags":["抵箭撞城"],"detail":"铁皮顶棚挡去八成轻远程伤害，悬锤专撞城门、箭塔与矮墙。"},
    militia: {
        name: '民兵', role: '轻装步兵', hp: 45, damage: 9, armor: .04, speed: 2.6, range: 18, reload: 22, penetration: 0, traits: [], tags: ['人海', '短兵'], detail: '短弓以成片抛射压住桥头，驻塔弓手专射盾墙后的轻兵。'
    },
    shieldman: {
        name: '盾剑步兵', role: '防御步兵', hp: 110, damage: 15, armor: .31, speed: 2, range: 19, reload: 28, penetration: .05, traits: ['shield'], tags: ['正面格挡', '前排'], detail: '铁边盾挡去正面箭伤的 55%，剑尖从盾缝刺进敌腹。'
    },
    halberdier: {
        name: '皇家重甲长戟兵', role: '重装步兵', hp: 135, damage: 26, armor: .38, speed: 1.85, range: 35, reload: 32, penetration: .45, traits: ['brace', 'armor'], tags: ['破甲', '反骑兵', '抗击退'], detail: '精钢斧刃穿透 45% 护甲，对骑兵造成 2.8 倍伤害。铁壁方阵能迎面刺杀冲锋重骑。'
    },
    plate_knight: {
        name: '重甲板甲骑士', role: '重装步兵', hp: 190, damage: 33, armor: .72, speed: 1.6, range: 24, reload: 38, penetration: .18, traits: ['cleave', 'armor'], tags: ['高护甲', '顺劈'], detail: '板甲抵去七成常规伤害，战锤砸碎敌人膝骨并短距击飞。'
    },
    scout_cavalry: {
        name: '轻骑游骑兵', role: '侧翼骑兵', hp: 95, damage: 17, armor: .16, speed: 5.4, range: 25, reload: 25, penetration: .1, traits: ['mount', 'flank'], tags: ['绕后', '轻骑'], detail: '游骑绕过盾墙，优先猎杀采金农夫、军医与攻城炮组。'
    },
    heavy_lancer: {
        name: '重装板甲冲锋骑兵', role: '冲锋骑兵', hp: 200, damage: 31, armor: .54, speed: 3.8, range: 31, reload: 35, penetration: .2, traits: ['mount', 'charge', 'armor'], tags: ['冲锋', '范围击飞'], detail: '铁蹄在冲锋中掀翻人墙，迎面撞入长戟方阵或拒马就会被刺穿。'
    },
    bowman: {
        name: '短弓手', role: '远程步兵', hp: 50, damage: 15, armor: .08, speed: 2.2, range: 240, reload: 52, penetration: .05, traits: ['arrow', 'arc'], tags: ['抛射', '箭雨'], detail: '高抛箭雨越过友军和矮墙。集中火力可以压制轻步兵。'
    },
    musketeer: {
        name: '火绳枪手', role: '火药步兵', hp: 62, damage: 64, armor: .12, speed: 1.9, range: 270, reload: 96, penetration: .85, traits: ['powder'], tags: ['85% 破甲', '齐射'], detail: '排枪线列穿透 85% 护甲，一轮白烟过后只剩碎甲与血。'
    },
    catapult: {
        name: '配重投石车', role: '远程攻城器', hp: 280, damage: 95, armor: .26, speed: .8, range: 560, reload: 170, penetration: .35, traits: ['siege', 'arc'], tags: ['范围轰击', '3× 拆迁'], detail: '配重巨石将密集步兵轰飞，对桥梁和城防造成三倍拆迁伤害。'
    },
    field_cannon: {
        name: '野战加农炮', role: '火药攻城器', hp: 220, damage: 85, armor: .25, speed: 1, range: 470, reload: 130, penetration: .78, traits: ['siege', 'rolling', 'powder'], tags: ['弹跳穿透', '重炮'], detail: '实心铁球连续弹跳，沿直线碾碎两排敌军。'
    }
};
export const KINDS = Object.keys(UNITS) as Kind[];
export const FORMS: Record<Formation, string> = { phalanx: '铁壁方阵', line: '排枪线列', skirmish: '散兵冲锋' };
export const SCENARIOS = ['双桥血河全面战争', '长戟方阵迎战百骑铁流', '桥头千人绞肉机', '黑火药排枪与加农炮轰城', '自由布阵'];
export const SIDES = ['铁冠北境', '赤棘血朝'];
export const TPS = 30;
