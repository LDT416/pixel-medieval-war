import assert from 'node:assert/strict';
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false, logLevel:'silent' });
const { SimWorld, TIMEOUT, PURSUIT } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const N=Number(process.env.SEEDS||2), scale=Number(process.env.SCALE||1200);
assert.ok(Number.isSafeInteger(N) && N > 0, 'SEEDS must be a positive integer');
assert.ok([1200, 2400, 3600].includes(scale), 'unsupported SCALE');
let gdead=0,absorbed={musket:0,scatter:0,round:0};let w0why={sameCompany:0,otherCompany:0,nearSum:0,victimKneeling:0,shooterInMelee:0},range=0;const tot={musket:{sent:0,hits:0,friendly:0,kills:0},round:{sent:0,hits:0,friendly:0,kills:0},scatter:{sent:0,hits:0,friendly:0,kills:0}};let deaths=0,ticks=0,held=0,ign=0,checks=0,p99=[];
for(let s=1;s<=N;s++){const w=new SimWorld(scale,s*7919);const times=[];
 while(!w.ended && w.tick <= TIMEOUT + PURSUIT){const t0=performance.now();w.step();times.push(performance.now()-t0);}
 assert.ok(w.ended && w.endTick >= 0, 'simulation did not finish');
 for(const kind of Object.keys(absorbed)) absorbed[kind] += w.earthworks.absorbed[kind];
 gdead += w.generals.filter(g => !g.alive).length;
 for(const k in tot)for(const f in tot[k])tot[k][f]+=w.ballistics.stats[k][f];
 for(const k in w0why)w0why[k]+=w.ballistics.friendlyWhy[k];range+=w.ballistics.shotRange;deaths+=w.dead[0]+w.dead[1];ticks+=w.endTick;held+=w.ballistics.discipline.heldFire;ign+=w.ballistics.discipline.ignored;checks+=w.ballistics.discipline.checks;
 times.sort((a,b)=>a-b);p99.push(times[Math.floor(times.length*.99)].toFixed(2));
 console.log(`seed ${w.seed}: ${(w.endTick/30|0)}s winner=${w.winner} dead=${w.dead} fled=${w.fled} parapet=${JSON.stringify(w.earthworks.absorbed)}`);}
const pct=(a,b)=>(100*a/Math.max(1,b)).toFixed(1)+'%';
console.log(JSON.stringify({musketHitRate:pct(tot.musket.hits,tot.musket.sent),musketFriendly:pct(tot.musket.friendly,tot.musket.hits),
 roundShots:tot.round.sent,roundKills:tot.round.kills,killsPerBall:(tot.round.kills/Math.max(1,tot.round.sent)).toFixed(2),roundFriendly:pct(tot.round.friendly,tot.round.hits),
 canisterHits:tot.scatter.hits,canisterFriendly:pct(tot.scatter.friendly,tot.scatter.hits),
 why:JSON.stringify(w0why),avgShotRange:(range/Math.max(1,tot.musket.sent)).toFixed(0),cannonShare:pct(tot.round.kills+tot.scatter.kills,deaths),heldFire:held,ignored:ign,laneChecks:checks,generalsDead:gdead,parapetAbsorbed:absorbed,avgSec:(ticks/N/30|0),p99}));
