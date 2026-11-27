import assert from 'node:assert/strict';
import {build} from 'esbuild';
const pack=await build({stdin:{contents:"export * from './src/sim/world';export * from './src/sim/campaignObjectives';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const {SimWorld,CAPTURE_TICKS,MAJORITY_TICKS,MAJORITY_FROM}=await import('data:text/javascript;base64,'+Buffer.from(pack.outputFiles[0].text).toString('base64'));
const w=new SimWorld(1200,42),sites=w.layout.objectives;
for(const p of sites)p.owner=1;
for(const c of w.companies){c.x=1;c.y=1;}
const advance=n=>{for(let i=0;i<n;i+=30){w.tick+=30;w.objectives.update(w);}};
advance(MAJORITY_FROM+30);assert.equal(w.winner,null,'initial deployment majority cannot win');
const own=w.companies.filter(c=>c.faction===0&&c.line!==5&&c.kind==='line_infantry');
const opponent=w.companies.find(c=>c.faction===1&&c.line!==5&&c.kind==='line_infantry');
const target=sites[0],held=target.heldTicks[1];Object.assign(own[0],{x:target.x,y:target.y});
advance(CAPTURE_TICKS-30);assert.equal(target.owner,1);Object.assign(opponent,{x:target.x,y:target.y});
advance(30);assert.equal(target.owner,1);opponent.x=1;opponent.y=1;advance(30);assert.equal(target.owner,1,'contested occupation must restart');
advance(CAPTURE_TICKS-30);assert.equal(target.owner,0);assert.equal(target.heldTicks[1],held+CAPTURE_TICKS*2-30);
const count=Math.floor(sites.length/2)+1;
for(let i=1;i<count;i++)Object.assign(own[i],{x:sites[i].x,y:sites[i].y});
advance(CAPTURE_TICKS);assert.equal(w.winner,null);advance(MAJORITY_TICKS-60);assert.equal(w.winner,null);
advance(30);assert.equal(w.winner,0);console.log('VP capture, contest, holding clocks, deployment protection and timed majority passed');
