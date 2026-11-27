import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export {Tracers3d} from './src/client/renderer3d/tracers3d';export {Scene,PerspectiveCamera} from 'three'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {Tracers3d,Scene,PerspectiveCamera}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const fx=new Tracers3d(new Scene()),camera=new PerspectiveCamera(),impacts=[];
const w={tick:1,events:[{type:'fire',x:7600,y:4000,dx:1,dy:0,unitId:0,endX:8200,endY:4200}],units:[{company:0}],companies:[{target:0}],rounds:[]};
const smoke={bulletImpact(...args){impacts.push(args);}};
for(let tick=1;tick<=5;tick++){
    w.tick=tick;if(tick===4)w.events.push({type:'tileImpact',x:8200,y:4200,struck:false});fx.observe(w,smoke);fx.draw(tick,.5,960,540,85,camera);
    if(tick===2){assert.equal(fx.stats.segments,1);assert.ok(Math.abs(fx.stats.maxLength-.5)<.00001);}
    assert.equal(impacts.length,Number(tick>=4));
    w.events=[];
}
assert.equal(fx.stats.segments,0);assert.equal(fx.stats.mode,'subtle');
console.log(JSON.stringify({maxMusketLength:fx.stats.maxLength,impactCount:impacts.length,finalSegments:fx.stats.segments}));
