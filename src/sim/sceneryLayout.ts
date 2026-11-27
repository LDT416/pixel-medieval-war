import type {Layout} from './maps';
import {Rng} from './rng';

export function treesFor(l:Layout){
    const rng=new Rng(Math.floor(l.seed*1000)+7);
    const trees:{x:number;y:number;size:number;yaw:number;crown:number;understory:string|null}[]=[];
    for(const g of l.woods)for(let i=0;i<Math.round(g.r*g.r/2300);i++){
        const a=rng.next()*Math.PI*2,r=Math.sqrt(rng.next())*g.r;
        trees.push({x:g.x+Math.cos(a)*r,y:g.y+Math.sin(a)*r,size:.8+rng.next()*.45,yaw:rng.next()*Math.PI*2,
            crown:rng.int(0,2),understory:i%3===0?(i%9===0?'Rock':'Shrub'):null});
    }
    return trees;
}
