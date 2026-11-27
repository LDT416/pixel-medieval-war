import type {Soldier} from './arenaTypes';
import type {SimWorld} from './world';
import {damage} from './combat';

import {boardActions,type Token} from './units/weapons';
const CELL=32;
const codes:Token[]=['musket','round','scatter'];
export class BoardShots {
    private due:number[]=[];private x:number[]=[];private y:number[]=[];
    private source:number[]=[];private kind:number[]=[];private count=0;
    stats={musket:{sent:0,hits:0,friendly:0},round:{sent:0,hits:0,friendly:0},scatter:{sent:0,hits:0,friendly:0}};
    place(w:SimWorld,source:Soldier,kind:Token,x:number,y:number,due:number){
        const i=this.count++;
        this.due[i]=due;this.x[i]=(Math.floor(x/CELL)+.5)*CELL;this.y[i]=(Math.floor(y/CELL)+.5)*CELL;
        this.source[i]=source.id;this.kind[i]=codes.indexOf(kind);this.stats[kind].sent++;
        return {x:this.x[i],y:this.y[i]};
    }
    step(w:SimWorld){
        let write=0;
        for(let i=0;i<this.count;i++){
            if(this.due[i]>w.tick){
                if(write!==i){this.due[write]=this.due[i];this.x[write]=this.x[i];this.y[write]=this.y[i];this.source[write]=this.source[i];this.kind[write]=this.kind[i];}
                write++;continue;
            }
            const source=w.units[this.source[i]],kind=codes[this.kind[i]],x=this.x[i],y=this.y[i];
            let id=Infinity, bestDistance=Infinity;
            w.hash.visit(x,y,CELL,unit=>{
                if(unit.id===source.id || unit.x<x-CELL/2 || unit.x>=x+CELL/2 || unit.y<y-CELL/2 || unit.y>=y+CELL/2)return;
                const distance=(unit.x-x)**2+(unit.y-y)**2;
                if(distance<bestDistance || (distance===bestDistance && unit.id<id)){bestDistance=distance;id=unit.id;}
            });
            const receiver=w.units[id];
            if(receiver){
                const hp=receiver.hp;
                damage(w,receiver,boardActions[kind].points,0,0,kind!=='musket',w.companies[source.company]);
                if(receiver.hp<hp){const tally=this.stats[kind];tally.hits++;if(receiver.faction===source.faction)tally.friendly++;}
            }
            if(kind==='musket')w.events.push({type:'tileImpact',kind:source.kind,unitId:source.id,faction:source.faction,x,y,dx:0,dy:0,explosive:false,struck:!!receiver});
        }
        this.count=write;
    }
}
