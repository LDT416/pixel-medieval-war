import {artillery as isArtillery} from './units/abilities';
import type {Faction} from './arenaTypes';
import type {SimWorld} from './world';

const SECOND=30;
export const CAPTURE_TICKS=45*SECOND, MAJORITY_TICKS=120*SECOND, MAJORITY_FROM=600*SECOND;
export class CampaignObjectives {
    private progress=new Map<number,{faction:Faction;ticks:number}>();
    private majority:[number,number]=[0,0];
    private taken:[boolean,boolean]=[false,false];
    claim(id:number):Readonly<{faction:Faction;ticks:number}>|undefined{return this.progress.get(id);}
    reset(){this.progress.clear();this.majority=[0,0];this.taken=[false,false];}
    /** 每模拟秒调用。无人、对峙及短暂穿过据点都不会改变旗色。 */
    update(w:SimWorld){
        const {objectives,farm}=w.layout;
        for(const p of objectives){
            const radius=p.kind==='ridge'?230:p.kind==='bridge'?135:158;
            const nearby=w.companies.filter(c=>c.line!==5&&!isArtillery(c)&&c.status!=='gone'&&c.status!=='rout'&&c.alive>0&&
                (c.x-p.x)**2+(c.y-p.y)**2<radius*radius);
            const present=[nearby.some(c=>c.faction===0),nearby.some(c=>c.faction===1)];
            if(present[0]!==present[1]){
                const faction=present[0]?0:1;
                if(faction!==p.owner){
                    let claim=this.progress.get(p.id);
                    if(claim?.faction!==faction){claim={faction,ticks:0};this.progress.set(p.id,claim);}
                    claim.ticks+=SECOND;
                    if(claim.ticks>=CAPTURE_TICKS){
                        if(p.owner>=0)this.taken[faction]=true;
                        const c=nearby.reduce((a,b)=>b.alive>a.alive?b:a);
                        p.owner=faction;c.captures++;this.progress.delete(p.id);
                        if(p.kind==='farm'&&farm&&farm.x===p.x&&farm.y===p.y){
                            w.layout.farmOwner=faction;
                            for(const old of w.companies)if(old.line===6&&old.faction!==faction)old.line=1;
                        }
                        w.say(c.name+'占领'+p.name,faction,p.x,p.y,2);
                    }
                }else this.progress.delete(p.id);
            }else this.progress.delete(p.id);
            if(p.owner===0||p.owner===1)p.heldTicks[p.owner]+=SECOND;
        }
        for(const f of [0,1] as const){
            const owns=objectives.filter(p=>p.owner===f).length;
            this.majority[f]=this.taken[f]&&owns>objectives.length/2?this.majority[f]+SECOND:0;
            if(w.winner===null&&w.tick>=MAJORITY_FROM&&this.majority[f]>=MAJORITY_TICKS){
                w.breakArmy(f===0?1:0,(f===0?'法兰西帝国':'反法同盟')+'持续控制多数战略要点');break;
            }
        }
    }
}
