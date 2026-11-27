import {WIDTH,HEIGHT} from './maps';
import type { Soldier as Unit } from './arenaTypes';
const SIZE=64;
export class SpatialHash {
    private stride=0;
    private rows=0;
    private buckets:(Unit[]|undefined)[]=[];
    private occupied:number[]=[];
    rebuild(units:Unit[]){
        const stride=Math.ceil(WIDTH/SIZE),rows=Math.ceil(HEIGHT/SIZE);
        if(this.stride!==stride || this.rows!==rows){
            this.stride=stride;this.rows=rows;this.buckets=new Array(stride*rows);
        }else{
            for(const i of this.occupied)this.buckets[i]!.length=0;
        }
        this.occupied.length=0;
        for(const u of units)if(u.hp>0)this.insert(u);
    }
    insert(u:Unit){
        const i=Math.floor(u.y/SIZE)*this.stride+Math.floor(u.x/SIZE);
        const bin=this.buckets[i]??(this.buckets[i]=[]);
        if(!bin.length)this.occupied.push(i);
        bin.push(u);
    }
    visit(x:number,y:number,r:number,fn:(u:Unit)=>void){
        const minX=Math.max(0,Math.floor((x-r)/SIZE)),maxX=Math.min(this.stride-1,Math.floor((x+r)/SIZE));
        const top=Math.max(0,Math.floor((y-r)/SIZE)),bottom=Math.min(this.rows-1,Math.floor((y+r)/SIZE));
        for(let row=top;row<=bottom;row++)for(let col=minX;col<=maxX;col++){
            const bin=this.buckets[row*this.stride+col];if(!bin)continue;
            for(const u of bin)if(u.hp>0 && (u.x-x)**2+(u.y-y)**2<=r*r)fn(u);
        }
    }
}
