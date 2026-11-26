import type {Faction} from '../sim/types';

const flags=new Map<string,HTMLCanvasElement>();
const navy=['#263b65','#35558c','#4869a3'];
const cream=['#c9bda2','#e2d9bd','#f4edd5'];
const madder=['#92363d','#b44243','#d4544c'];

export function banner(f:Faction,frame=0,burnt=false) {
    const phase=Math.floor(frame)%6,key=[f,phase,burnt].join('/');
    const known=flags.get(key);if(known)return known;
    const art=document.createElement('canvas');art.width=48;art.height=64;
    const c=art.getContext('2d')!;c.imageSmoothingEnabled=false;
    for(let x=0;x<40;x++){
        const wave=x*.21+phase*Math.PI/3;
        const lift=Math.round(Math.sin(wave)*x*.085);
        const light=Math.cos(wave)>.45?2:Math.cos(wave)<-.25?0:1;
        for(let y=0;y<25;y++){
            const nx=x/39,ny=y/24;
            let dye=nx<1/3?navy:nx<2/3?cream:madder;
            if(f){
                const diagonal=Math.min(Math.abs(nx-ny),Math.abs(1-nx-ny));
                dye=diagonal<.036?madder:diagonal<.105?cream:navy;
                if(Math.abs(nx-.5)<.105||Math.abs(ny-.5)<.155)dye=cream;
                if(Math.abs(nx-.5)<.061||Math.abs(ny-.5)<.09)dye=madder;
            }
            if(burnt&&x>25&&y>17+(x*7)%9)continue;
            c.fillStyle=burnt?['#4c4136','#6c5641','#87755b'][light]:dye[light];
            c.fillRect(5+x,6+y+lift,1,1);
        }
    }
    c.fillStyle='#544330';c.fillRect(2,4,3,60);
    c.fillStyle='#cfaa61';c.fillRect(2,4,1,60);
    c.fillStyle='#e8cb7f';c.fillRect(2,0,2,6);c.fillRect(1,2,4,2);
    if(!f){c.fillRect(0,1,2,1);c.fillRect(4,1,3,1);}
    flags.set(key,art);return art;
}
export function flagImage(f:Faction,burnt=false){
    const img=document.createElement('img');img.src=banner(f,0,burnt).toDataURL();img.className='heraldry';
    img.alt=f?'英国米字旗':'法国三色旗';return img;
}
