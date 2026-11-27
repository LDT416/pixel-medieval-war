import assert from 'node:assert/strict';
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
if(seeds>=40){
    assert.ok(perGame>=3,'每局至少三次对满编高士气连队冲锋');
    assert.ok(rate.break>=.23 && rate.break<=.47,'守方崩溃比例');
    assert.ok(rate.repulsed>=.28 && rate.repulsed<=.52,'冲锋受阻比例');
    assert.ok(rate.melee>=.13 && rate.melee<=.37,'白刃战比例');
}
