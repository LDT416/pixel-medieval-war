import assert from 'node:assert/strict';
import {probeBattles} from './probe-battles.mjs';
const {seeds,signature,results}=await probeBattles('noAssault');
const wins=[0,0];let illegalOrders=0;
for(const r of results){
    if(r.disabled===r.winner)wins[r.disabled]++;
    illegalOrders+=r.illegalOrders;
    console.log(JSON.stringify({seed:r.seed,disabled:r.disabled,winner:r.winner,illegalOrders:r.illegalOrders}));
}
const disabledWinRate=(wins[0]+wins[1])/results.length;
console.log(JSON.stringify({seeds,games:results.length,signature,disabledWins:wins,disabledWinRate,illegalOrders}));
assert.equal(illegalOrders,0,'被禁方出现了步兵冲锋命令');
