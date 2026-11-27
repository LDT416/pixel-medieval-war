// node tests/crowd-isolation.mjs. At ticks 1, 360 and 900, bound each company by the
// AABB of its living units. Count soldiers in non-engaged, non-routing companies whose
// box is >150px from every other living company's box. The denominator is all living soldiers.
// This conservative coverage diagnostic is independent of the overlap and performance gates.
import {build} from 'esbuild';
const r=await build({stdin:{contents:"export * from './src/sim/world'",resolveDir:process.cwd()},
    bundle:true,platform:'node',format:'esm',write:false});
const {SimWorld}=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].contents).toString('base64'));
for(const scale of [3600,20000]){
    const w=new SimWorld(scale,7919);
    for(let i=0;i<1000 && !w.ended;i++){
        w.step();if(![1,360,900].includes(w.tick))continue;
        const b=w.companies.map(c=>({c,minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity,n:0}));
        for(const u of w.units)if(u.hp>0){
            const box=b[u.company];box.n++;
            box.minX=Math.min(box.minX,u.x);box.minY=Math.min(box.minY,u.y);
            box.maxX=Math.max(box.maxX,u.x);box.maxY=Math.max(box.maxY,u.y);
        }
        let isolated=0,alive=0;
        for(const box of b)if(box.n){
            alive+=box.n;if(box.c.engaged || box.c.status==='rout')continue;
            if(b.every(o=>{
                if(o===box || !o.n)return true;
                const dx=Math.max(0,o.minX-box.maxX,box.minX-o.maxX),dy=Math.max(0,o.minY-box.maxY,box.minY-o.maxY);
                return dx*dx+dy*dy>150**2;
            }))isolated+=box.n;
        }
        console.log(JSON.stringify({scale,tick:w.tick,alive,isolated,percent:100*isolated/alive}));
    }
}
