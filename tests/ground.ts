import { SimWorld } from '../src/sim/world';
import { preloaded } from '../src/client/artLoader';
import { DecalLayer } from '../src/client/decalLayer';
import { VfxPool } from '../src/client/vfxPool';
import type { Faction, Unit } from '../src/sim/types';
import { drawUnitSprite } from '../src/client/spriteBaker';

export function battleSave() {
    const w = new SimWorld();
    w.reset(4,'gorge','sandbox');
    w.units=[];
    w.byUnit.clear();
    w.groups.clear();
    for (const f of [0,1] as Faction[]) {
        for (let lane=0; lane<5; lane++) {
            const p={x:2800+(f?1:-1)*102, y:850+lane*115};
            w.spawn(f,'line_infantry',30,p,'line');
        }
    }
    return w.snapshot();
}

export async function persistentMarks() {
    await preloaded;
    const layer=new DecalLayer(), vfx=new VfxPool(layer);
    const ctx=layer.ctx;
    vfx.consume([{type:'death', x:1900, y:850, dx:1, dy:0, faction:1, kind:'line_infantry',flag:true}]);
    for (let i=0;i<120;i++) vfx.update(1/30);
    const area=()=>ctx.getImageData(1825,775,150,150).data;
    // Chrome may switch from GPU to CPU after repeated readbacks. Settle the readback path first.
    area(); area();
    const before=area();
    if (!before.some(Boolean) || !layer.marks.length) throw Error('death did not leave a mark');
    for (let i=0;i<90;i++) vfx.update(1/30);
    const after=area();
    if (!before.every((n,i)=>n===after[i])) throw Error('settled blood or debris flickers');
    const saved=structuredClone(layer.marks);
    layer.restore(saved);
    const restored=area();
    if (!before.every((n,i)=>n===restored[i])) throw Error('restored marks differ pixel by pixel');
    return saved.length;
}

export function animationFrames() {
    const w=new SimWorld(),p={x:64,y:75};
    const canvas=document.createElement('canvas');
    canvas.width=128;canvas.height=128;
    const c=canvas.getContext('2d',{willReadFrequently:true})!;
    c.imageSmoothingEnabled=false;
    function frame(u:Unit,tick:number,dx=1,dy=0){
        c.clearRect(0,0,128,128);
        drawUnitSprite(c,u,tick,dx,dy,false,false,p.x,p.y);
        return canvas.toDataURL();
    }
    const foot=w.spawn(0,'line_infantry',1,p,'line')[0];
    foot.pose='aim';foot.moving=false;
    const aim=new Set(Array.from({length:8},(_,i)=>frame(foot,8,Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4))));
    if(aim.size!==8)throw Error('missing directional infantry sprites');
    foot.pose='reload';
    const ramrod=new Set(Array.from({length:6},(_,i)=>frame(foot,30+i*5)));
    if(ramrod.size<4)throw Error('missing ramrod stroke');
    const cavalry=w.spawn(0,'cuirassier',1,p,'line')[0];cavalry.moving=true;
    const horseFrames=new Set(Array.from({length:4},(_,i)=>{cavalry.marchDistance=i*7;return frame(cavalry,20);}));
    if(horseFrames.size!==4)throw Error('missing four-frame horse gait');
    const gun=w.spawn(0,'field_cannon',1,p,'line')[0];
    gun.moving=false;gun.firedAt=0;gun.cooldown=195;
    function barrelTip(t:number) {
        frame(gun,t);
        const px=c.getImageData(0,0,128,128).data;
        let right=-1;
        for(let i=0;i<px.length;i+=4) {
            if(px[i]===241 && px[i+1]===204 && px[i+2]===127)right=Math.max(right,(i/4)%128);
        }
        if(right<0)throw Error('missing bronze reinforcement bands');
        return right;
    }
    const muzzle=[barrelTip(0),barrelTip(2),barrelTip(50)];
    if(muzzle[0]-muzzle[1]<7 || muzzle[0]-muzzle[1]>10 || muzzle[2]!==muzzle[0])throw Error('recoil distance '+muzzle.join('/'));
    gun.moving=true;
    const wheels=new Set(Array.from({length:4},(_,i)=>{gun.marchDistance=i*2.4;return frame(gun,40);}));
    if(wheels.size<3)throw Error('missing rolling gun wheel frames');
    const vfx=new VfxPool(new DecalLayer());
    vfx.consume([{type:'fire',x:0,y:0,kind:'line_infantry',dx:0,dy:1}]);
    const clouds=vfx.snapshot().filter(p=>p.life>=1.4&&p.life<=2.4&&p.size>=25);
    const spark=vfx.snapshot().filter(p=>p.size===3&&p.life<.1);
    if(clouds.length<4||clouds.length>6||spark.length!==1)throw Error('incorrect smoke density, duration or muskets spark size');
    return {aim:aim.size,ramrod:ramrod.size,horse:horseFrames.size,wheel:wheels.size,recoilPixels:muzzle[0]-muzzle[1],clouds:clouds.length};
}
