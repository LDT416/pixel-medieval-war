import {probeBattles} from './probe-battles.mjs';
const {seeds,signature,results}=await probeBattles('fresh');
const counts={break:0,repulsed:0,melee:0};
for(const r of results){
    console.log(JSON.stringify({seed:r.seed,...r.counts}));
    for(const k of Object.keys(counts))counts[k]+=r.counts[k];
}
const total=Object.values(counts).reduce((a,b)=>a+b,0),perGame=total/seeds;
const rate=Object.fromEntries(Object.entries(counts).map(([k,n])=>[k,total?n/total:0]));
console.log(JSON.stringify({seeds,signature,total,perGame,counts,rate}));
