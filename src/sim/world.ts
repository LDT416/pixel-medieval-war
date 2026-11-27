import { kinds, scales, type Scale, type Faction, type Soldier, type BattleEvent, type Round } from './arenaTypes';
import { WIDTH, createMap } from './maps';
import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import { Frontline } from './aiDirector';
import { advance } from './strategy';
import { resolveRounds } from './combat';

export class SimWorld {
    units: Soldier[]=[]; structures=createMap(); events:BattleEvent[]=[]; rounds:Round[]=[];
    alive:[number,number]=[0,0]; dead:[number,number]=[0,0]; winner:Faction|null=null;
    hash=new SpatialHash(); front=new Frontline(); rng=new Rng(1815);
    tick=0; scale:Scale=1200;
    constructor(scale:Scale=1200,private seed=1815){this.reset(scale);}
    reset(scale:Scale=this.scale) {
        if(!scales.includes(scale)) throw new RangeError('Unsupported army scale');
        this.scale=scale; this.tick=0; this.winner=null; this.rng.state=this.seed;
        this.units.length=this.rounds.length=this.events.length=0;
        const half=scale/2;
        this.alive=[half,half]; this.dead=[0,0];
        for(const faction of [0,1] as const) {
            const counts=[.55,.20,.18,.04,.03].map(f=>Math.round(half*f));
            for (let k=0;k<kinds.length;k++) for(let i=0;i<counts[k];i++) {
                const kind=kinds[k], n=counts[k];
                const ranks=k===0?Math.ceil(n/75):k===1?Math.ceil(n/40):k===2?Math.ceil(n/24):1;
                const file=Math.floor(i/ranks), rank=i%ranks, files=Math.ceil(n/ranks);
                const t=(file+.5)/files;
                const company=Math.floor(t*8);
                let y=505+company*178+(t*8-company)*133, x=1440-rank*32-(company%2)*36;
                if(k===1){x=1100-rank*36; y=765+company*112+(t*8-company)*75;}
                if(k===2){const wing=t<.5?t*2:(t-.5)*2; y=(t<.5?249:1907)+wing*235; x=1405-rank*45;}
                if(k===3){x=1425-(i%3)*33;y=511+t*1380;}
                if(k===4){x=900-(i%2)*100;y=495+t*1410;}
                x+=this.rng.int(-3,3); y+=this.rng.int(-3,3);
                const face=faction?-1:1;
                this.units.push({id:this.units.length,faction,kind,company,x:faction?WIDTH-x:x,y,homeY:y,
                    hp:[88,114,128,84,105][k],face,pose:'march',moving:true,vx:face*[68,74,131,72,45][k],vy:0,
                    speed:[68,74,131,72,45][k]*(.98+(company%3)*.02),target:-1,cooldown:company*2+i%3,
                    hitAt:-999,firedAt:-999,stride:this.rng.int(0,15),charge:false});
            }
        }
        this.hash.rebuild(this.units);this.front.update(this.units);
    }
    step() {
        this.events.length=0;
        if(this.winner!==null)return;
        this.tick++; this.hash.rebuild(this.units); this.front.update(this.units);
        resolveRounds(this);
        const start=this.tick%2*this.scale/2;
        for(let i=0;i<this.scale;i++){
            const u=this.units[(i+start)%this.scale];
            if(u.hp>0) advance(this,u);
        }
        if(!this.alive[0] || !this.alive[1]){
            this.winner=this.alive[0]?0:1;
            this.rounds.length=0;
            for(const u of this.units)if(u.hp>0){
                u.moving=false;u.vx=0;u.vy=0;u.pose='stand';
            }
        }
    }
    frontline() {
        const sums=[[0,0,0],[0,0,0]];
        for(const row of this.front.sectors) for(const u of row) if(u && u.hp>0) {
            const s=sums[u.faction]; s[0]+=u.x;s[1]+=u.y;s[2]++;
        }
        const live=sums.filter(s=>s[2]);
        return {x:live.reduce((n,s)=>n+s[0]/s[2],0)/live.length,y:live.reduce((n,s)=>n+s[1]/s[2],0)/live.length};
    }
}
