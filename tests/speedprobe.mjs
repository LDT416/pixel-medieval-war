// 节奏探针：移动中各兵种的平均地速、首个伤亡时间。用法：node tests/speedprobe.mjs
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/sim/world';", resolveDir: process.cwd() }, platform: 'node', format: 'esm', bundle: true, write: false, logLevel:'silent' });
const { SimWorld } = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const w = new SimWorld(1200, Number(process.argv[2] || 7919*3));
let inf=0,infN=0,cav=0,cavN=0,moving=0,total=0,firstContact=-1;const prev=new Map();
while(!w.ended && w.tick<9000){ w.step();
  for(const u of w.units){ if(u.hp<=0)continue; const p=prev.get(u.id); prev.set(u.id,[u.x,u.y]); if(!p)continue; const d=Math.hypot(u.x-p[0],u.y-p[1])*30; total++;
    if(d>3){moving++; if(u.kind==='cuirassier'){cav+=d;cavN++;} else if(u.kind==='line_infantry'){inf+=d;infN++;}}}
  if(firstContact<0 && w.dead[0]+w.dead[1]>0) firstContact=w.tick; }
console.log(JSON.stringify({infMovingSpeed:(inf/infN).toFixed(1),cavMovingSpeed:(cav/cavN).toFixed(1),movingShare:(moving/total).toFixed(2),firstCasualtySec:(firstContact/30).toFixed(0),width:w.width}));
