import type { Faction, Kind } from '../sim/types';
// Native pixel matrices face east. Animation is baked once, never drawn per soldier.
const matrices: Record<Kind, string[]> = {
    peasant:['...lll.....','..wlllw....','.llllllw..m','...kfs..sm.','..wlfs..w..','.wwclb.w...','blwgfsw....','.bwbb.w....','..wwbw.....','..bb.b.....','.dd..dd....'],
    sapper:['..msh....q..','.mssmb..gg..','..kfs..wbbw.','.wbfs..hssm.','llwccs.wllw.','bwgbwfswbbw.','bwwbb..mhhm.','..wdb..wwww.','..b.b.......','.dd.dd......'],
    monk:['...gg......','..lqqg...g.','.lqqkk..ggg','.qkfsl...g.','.lqffl...w.','..lggqq..w.','.lqggqsf.w.','.qlgglq.fw.','lqqllqq..w.','qqqllqqq.w.','.bb..bb..w.'],
    bannerman:['..g..gcccct.','..w..wTTcTt.','..w..wTcgcct','..w..wcggcc.','..ah.wcccct.','.mssmwTTc...','..kfsw..t...','.hccsw......','.scgsw......','..cgbw......','..m.mw......','.kk.kk......'],
    pikeman:['..hh...........a','..msm.........hl','..kfs........sw.','.mcgs.......w...','.Tccs.....ww....','..scfs..ww......','..mgbsww........','..cwwb..........','..m..m..........','.kk..kk.........'],
    zweihander:['..tah.......aa.','.Thssh.....ahs.','..mkfs....ahs..','.hsmgs...ahs...','.mccss..ahs....','.scgms.ahs.....','..mcfgggg......','..mbfw.........','..m.wm.........','.kk..kk........'],
    berserker:['..a...wl...aa.','.asb.wllw.hssa','..sw.kffw..ms.','...w.wffw..w..','.ffwswccffsw..','..fwfcggf.w...','...w.cccbw....','....wbgb......','....b..b......','...dd..dd.....'],
    longbowman:['...Tc...l....','..Tcck...l...','..ckfs..q.l..','qw.ctf..q..l.','bw.Tccssqqql.','.wscfs..q..l.','..wccb..q.l..','...dcb..ql...','...b.b..l....','..dd.dd......'],
    crossbowman:['..hm.........','..msm......w.','..kfs.....lqs','.mTcs...wlqs.','.scgsswlgaaa.','..ccfsw..wqs.','..bcc.....lqs','..bdb......w.','..m.m........','.kk.kk.......'],
    blunderbuss:['..lll.......gh.','.wlllwb....ggs.','..kfs....ggssm.','.wccs..gggsmm..','.Tcgssggmmk....','..bfswwk.......','..wwwb.........','..bdb..........','..m.m..........','.kk.kk.........'],
    fire_bomber:['..qww....g....','.wwbw...tlg...','..kfs....w....','..wfs...bgb...','.lcgs..bgTgb..','bwccwffwcccw..','.wwgb..bwwbb..','..bdb.........','..b.b.........','.dd.dd........'],
    horse_archer:['....lT...wl....','...wTwb..q.l...','....kfs..q..l..','....ccsfsqqql..','....Tcs..q.l.b.','....bcb..ql.bwb','..wwwcwwwl..wlf','bwlwgccwwwwlkw.','bwwwwwwwbbw....','..bb..bb.......','..b....b.......','.kk...kk.......'],
    war_elephant:[
      '.......h...h..............','......ms..ms....l.........','......kf..kf...q.l........','.....wccwwccwsqqql........','....lgglgglggl..l.........','....wTcccccccw....hsh.....','...mgggggggggmm..hsshm....','..msmTccccccTmssmhahssm...','.msmmcggccggcmsmmshgssmm..','mssmmsmmggmmsmshsmsgkhsm..','msmmmshssmshssmshmmsmmsm..','mmssmmmsmmmsmmsmmmhssmsm..','m.mmssmmssmmssmm..msmmss.a','.bmmmmmmsmmmmmm...smshaa.a','..mmm..mm...mmm....maaaas.','..msm..mm...msm....am..ss.','..msm..ms...msm........sm.','..hsh..hs...hsh.......ss..','..kkk..kk...kkk......mm...'],
    ballista:['.................aa..','...l............aha..','....lw........ahsw...','.....lww....ahsww....','......lgw.ahsww...ll.','......wggssww..wll...','...qqqgggwwwlll......','.llwwwwggwww.........','...wwggwwllww........','....blwgwbbgwl.......','....bwgwb.bwgwb......','.....bwb...bwb.......'],
    hwacha:['.......t..t..t..t...','......gl.gl.gl.gl...','.....hwa.hwa.hwa.hw.','....hwg.hwg.hwg.hwg.','...hww.hww.hww.hww..','..mgggggggggggggg...','..mwwmwwmwwmwwmwb...','..bwwmwwmwwmwwmb....','...bbwwgggbwwbb.....','....wlggglwww.......','..blwgwbwwbgwgb.....','..bwgwgb..bwgwb.....','...bwwb....bwb......'],
    battering_ram:['.....mhshshshm........','....hshshshshshm......','...hshshshshshshm.....','..hshshshshshshshm....','.msmggmmggmmggmmgm....','...ww..qq....qq.ww....','...ww..qq....qq.ww..m.','..bwlwwwwwwwlwwwwwhhsm','..bbwwlwwlwwwlwwwwhmsm','...ww...ww......ww..m.','..bwgwbwwwwwwwbwgwb...','..wglgw.......wglgw...','...bwb.........bwb....'],
    militia: [
        '........', '..ww....', '.wlwb...', '..kfs..l', '..wcb.w.',
        '.sTcsl..', '..ccb...', '..bdb...', '..b.b...', '.dd.dd..',
    ],
    shieldman: [
        '..hh....', '.masb...', '.khfs..a', '..kcc..s', 'hgbcg.sb',
        'hcgcbs..', 'hgccb...', '.gcdb...', '..m.m...', '.kk.kk..',
    ],
    halberdier: [
        '..ah..a.', '.mhmb.ha', '.kks..mh', '..ms..wg', '.ahc.w..',
        '.mcgs...', '..cmb...', '..kmb...', '..m.m...', '.kk.kk..',
    ],
    plate_knight: [
        '.tTc....', '..hac..a', '.hssm..h', '.mkhs.a.', '.hsm.hh.',
        'hmccgs..', '.smmb...', '..gbm...', '..s.s...', '.kk.kk..',
    ],
    bowman: [
        '..Tc....', '.Tcck...', '.ckfs.w.', '..cf..lw', '.cTcs.ql',
        '.sccwsqw', '..cc..w.', '..dcb...', '..b.b...', '.dd.dd..',
    ],
    musketeer: [
        '..ww....', '.wlwb...', 'bwwwbb..', '..kfs...', '.Tcc..ah',
        '.scgsah.', '..cwwb..', '..dbc...', '..b.b...', '.kk.kk..',
    ],
    scout_cavalry: [
        '....tw......', '...wTwb...b.', '....kfs..bwb', '....ccc..wlf',
        '....Tcs.wlbw', '..wwccwwlkw.', '.wlwgbwwb...',
        'bwwwwwwwb...', '..bb..bb....', '..b....b....', '.kk...kk....',
    ],
    heavy_lancer: [
        '...tTT...a..', '....ham..ll.', '...hksm..wm.',
        '....mms..hsh', '....hcs.hshm', '..hmccswmgb.', '.hsmTgmhmb..',
        'bmcchmssm...', '..mk..mk....', '..m....m....', '.kk...kk....',
    ],
    catapult: [
        '.............h......', '............lwl.....', '...........lwb.q....',
        '..........lwb...q...', '.........lwb....khh.', '........lwb.....mms.',
        '.....wllgwb.........', '....wbbbggw.........', '....wmmblwww........',
        '....bmbwlb.ww.......', '.....bwllb..ww......', '...wwwlwbwwwww......',
        '..bllwglbllwwllb....', '...bgwbwwwbgwwbb....', '....wlw....wlw......',
        '.....b......b.......',
    ],
    field_cannon: [
        '....................', '....................', '....................',
        '................hma.', '.............hahksh.', '..........ahmsshhms.',
        '.......hahmssmmsmk..', '.....hmssmmsmmkk....', '....msmmmsmkk.......',
        '....kmmggkllb.......', '....blwwlwgwll......', '...blwgwgbwgwg......',
        '..blwbwwwwlwwl......', '.bwwb.lwgwgwgb......', '.....blwwlwll.......',
        '......bwwwwb........',
    ],
};
function colors(faction: Faction): Record<string, string> {
    return {
        k: '#202325', d: '#322d2a', b: '#46352b', w: '#84613e', l: '#b59a64',
        f: '#c69c71', s: '#9ba6ab', a: '#e4e5dc', h: '#c1c9c8', m: '#697778', g: '#c7a35e',
        q: '#aaa183', c: faction === 0 ? '#2d6fb8' : '#b82a2a', T: faction === 0 ? '#78a1c0' : '#d18870', t: faction === 0 ? '#36566b' : '#702e2a'
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
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(...matrix.map(row => row.length));
    canvas.height = matrix.length;
    const ctx = canvas.getContext('2d')!;
    const siege = ['catapult','field_cannon','ballista','hwacha','battering_ram'].includes(kind);
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
                if (siege && kind === 'catapult' && y < 7)
                    dx -= Math.floor((7 - y) / 2);
                else if (siege && kind === 'field_cannon' && y < 9)
                    dx--;
                else if (!siege && kind!=='war_elephant' && x >= 5 && y < 7) {
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
