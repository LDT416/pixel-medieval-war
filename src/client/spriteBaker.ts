import type { Faction, Kind } from '../sim/types';
// Native pixel matrices face east. Animation is baked once, never drawn per soldier.
const matrices: Record<Kind, string[]> = {
    peasant: ["...lll.....","..wlllw....",".llllllw..m","...kfs..sm.","..wlfs..w..",".wwclb.w...","blwgfsw....",".bwbb.w....","..wwbw.....","..bb.b.....",".dd..dd...."],
    sapper: ["..msh....q..",".mssmb..gg..","..kfs..wbbw.",".wbfs..hssm.","llwccs.wllw.","bwgbwfswbbw.","bwwbb..mhhm.","..wdb..wwww.","..b.b.......",".dd.dd......"],
    bannerman: ["..g..gcccct.","..w..wTTcTt.","..w..wTcgcct","..w..wcggcc.","..ah.wcccct.",".mssmwTTc...","..kfsw..t...",".hccsw......",".scgsw......","..cgbw......","..m.mw......",".kk.kk......"],
    shieldman: ["..hh....",".masb...",".khfs..a","..kcc..s","hgbcg.sb","hcgcbs..","hgccb...",".gcdb...","..m.m...",".kk.kk.."],
    halberdier: ["..ah..a.",".mhmb.ha",".kks..mh","..ms..wg",".ahc.w..",".mcgs...","..cmb...","..kmb...","..m.m...",".kk.kk.."],
    zweihander: ["..tah.......aa.",".Thssh.....ahs.","..mkfs....ahs..",".hsmgs...ahs...",".mccss..ahs....",".scgms.ahs.....","..mcfgggg......","..mbfw.........","..m.wm.........",".kk..kk........"],
    plate_knight: [".tTc....","..hac..a",".hssm..h",".mkhs.a.",".hsm.hh.","hmccgs..",".smmb...","..gbm...","..s.s...",".kk.kk.."],
    musketeer: ["..kkkk.........",".kkgkkk........","...kfs.........","..gcac....aaaaa","..ccacffwwsssss","..caccwww......","...gcb.........","...aba.........","...a.a.........","..kk.kk........"],
    guard_grenadier: ["...kkkk.........","..kkmkkk........","..kkmkkk........","..kkkkkk........","...kffs.........","..ggcagg...aaaaa","..ccacffwwsssss.","..cacccww.......","...bbb..........","...a.a..........","..kk.kk........."],
    rifleman: ["..tTtt.............",".ttgttt............","...kfs.............","..Tctt....ssssssaaa","..cccsffwwwwww.....","..ctcbww...........","...bcb.............","...b.b.............","..kk.kk............"],
    volley_gunner: ["..lll.......gh.",".wlllwb....ggs.","..kfs....ggssm.",".wccs..gggsmm..",".Tcgssggmmk....","..bfswwk.......","..wwwb.........","..bdb..........","..m.m..........",".kk.kk........."],
    dragoon: ["....tw......","...wTwb...b.","....kfs..bwb","....ccc..wlfssssss","....Tcs.wlbwwww...","..wwccwwlkw.",".wlwgbwwb...","bwwwwwwwb...","..bb..bb....","..b....b....",".kk...kk...."],
    heavy_lancer: ["...tTT...a..","....ham..ll.","...hksm..wm.","....mms..hsh","....hcs.hshm","..hmccswmgb.",".hsmTgmhmb..","bmcchmssm...","..mk..mk....","..m....m....",".kk...kk...."],
    scout_cavalry: ["....tw......","...wTwb...b.","....kfs..bwb","....ccc..wlf","....Tcs.wlbw","..wwccwwlkw.",".wlwgbwwb...","bwwwwwwwb...","..bb..bb....","..b....b....",".kk...kk...."],
    davinci_tank: ["..........g...........",".........gsg..........","........wwlww.........","......wllwlwlww.......","....wllwwlwlwlwww.....","..wllwlwwlwlwlwlwww...",".ggggggggggggggggggg..","wwkkllkklllkklllkkllww","ssmmwwsswwwsswwwmmwwss",".gggwwggwwwggwwwggggg.","..wwwwwwwwwwwwwwwww...","....kkk.......kkk....."],
    field_cannon: ["....................","....................","....................","................hma.",".............hahksh.","..........ahmsshhms.",".......hahmssmmsmk..",".....hmssmmsmmkk....","....msmmmsmkk.......","....kmmggkllb.......","....blwwlwgwll......","...blwgwgbwgwg......","..blwbwwwwlwwl......",".bwwb.lwgwgwgb......",".....blwwlwll.......","......bwwwwb........"],
    siege_mortar: ["....shhhhs.....","...hkkkkmhh....","...smkkkmhh....","....hsssms.....","....mhshsm.....",".....mssm......","...wggggwww....","..bwwllwllwb...",".bwwggbwwggwb..","..bwwb..bwwb..."],
    organ_gun: ["....hs.hs.hs.hs.hs.","....ms.ms.ms.ms.ms.","...hs.hs.hs.hs.hs..","...ms.ms.ms.ms.ms..","..hsshsshsshsshss..","..ggggggggggggggg..","..bwlwwwwwlwwwwwb..","..bwwgbwwwbgwgb....","...bwb.....bwb....."]
};
function colors(faction: Faction): Record<string, string> {
    return {
        k: '#202325', d: '#322d2a', b: '#46352b', w: '#84613e', l: '#b59a64',
        f: '#c69c71', s: '#9ba6ab', a: '#e2e8f0', h: '#c1c9c8', m: '#697778', g: '#c7a35e',
        q: '#aaa183', c: faction === 0 ? '#265cc2' : '#cc2b2b', T: faction === 0 ? '#78a1c0' : '#d18870', t: faction === 0 ? '#36566b' : '#702e2a'
    };
}
const sprites = new Map<string, HTMLCanvasElement>();
const palettes = new Map<string, readonly string[]>();
export function sprite(kind: Kind, faction: Faction, frame = 0, flash = false): HTMLCanvasElement {
    frame = ((Math.floor(frame) % 3) + 3) % 3;
    const key = kind + faction + frame + Number(flash);
    const known = sprites.get(key);
    if (known)
        return known;
    const matrix = matrices[kind], atlas = colors(faction);
    if(kind==='rifleman'){atlas.c='#365e39';atlas.T='#658348';atlas.t='#254634';}
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(...matrix.map(row => row.length));
    canvas.height = matrix.length;
    const ctx = canvas.getContext('2d')!;
    const siege = ['siege_mortar','field_cannon','organ_gun','davinci_tank'].includes(kind);
    for (let y = 0; y < matrix.length; y++)
        for (let x = 0; x < matrix[y].length; x++) {
            const color = atlas[matrix[y][x]];
            if (!color)
                continue;
            let dx = x, dy = y;
            if (frame === 1 && !siege) {
                if (y >= matrix.length - 2)
                    dx += x < canvas.width / 2 ? -1 : 1;
                else if (y < matrix.length - 4)
                    dy++;
            }
            if (frame === 2) {
                if (siege && kind === 'siege_mortar' && y < 7)
                    dx -= Math.floor((7 - y) / 2);
                else if (siege && kind === 'field_cannon' && y < 9)
                    dx--;
                else if (!siege && x >= 5 && y < 7) {
                    dx++;
                    dy = Math.min(6, dy + 1);
                }
                else if (!siege && y < 6)
                    dx++;
            }
            ctx.fillStyle = flash && 'sham'.includes(matrix[y][x]) ? '#b1a79a' : color;
            ctx.fillRect(dx, dy, 1, 1);
        }
    if(!matrix.some(row=>/[ctT]/.test(row))){
        const x=Math.max(1,Math.floor(canvas.width*.36)),y=Math.floor(canvas.height*.6);
        ctx.fillStyle=atlas.t;ctx.fillRect(x,y,4,3);ctx.fillStyle=atlas.c;ctx.fillRect(x,y,3,2);ctx.fillStyle=atlas.T;ctx.fillRect(x,y,1,2);
    }
    if(kind==='rifleman'){ctx.fillStyle=faction?'#cc2b2b':'#265cc2';ctx.fillRect(2,2,2,1);}
    sprites.set(key, canvas);
    return canvas;
}
export function spritePalette(kind: Kind, faction: Faction): readonly string[] {
    const key = kind + faction;
    let result = palettes.get(key);
    if (!result) {
        const atlas = colors(faction);
        result = [...new Set([...matrices[kind].join('').split('').map(c => atlas[c]).filter(Boolean),atlas.c,atlas.T])];
        palettes.set(key, result);
    }
    return result;
}
