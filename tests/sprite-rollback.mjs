import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {once} from 'node:events';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const before='1fd1e4d51485f88ad5ff31be4fe5c2538ecab3e6';
const file='src/client/renderer3d/spriteAtlas.ts';
const original=execFileSync('git',['show',before+':'+file],{encoding:'utf8'});
const reference=original+`
export function historical(){
    const tex=atlas();
    return {image:tex.image,cells,cols,cw,ch,key,actions,frameCount};
}`;
const source=async (contents,name)=>(await build({stdin:{contents,resolveDir:resolve('src/client/renderer3d'),loader:'ts'},bundle:true,platform:'browser',format:'iife',globalName:name,write:false,minify:true})).outputFiles[0].text;
const browser=process.env.CDP_URL||'http://127.0.0.1:9679';
const tab=await(await fetch(browser+'/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);await once(ws,'open');
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const reply=JSON.parse(data),p=pending.get(reply.id);if(!p)return;pending.delete(reply.id);if(reply.error)p.reject(Error(reply.error.message));else p.resolve(reply.result);};
async function evaluate(expression){
    const job=new Promise((resolve,reject)=>pending.set(++id,{resolve,reject}));
    ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
    const r=await job;if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;
}
try{
    await evaluate(await source(reference,'OldAtlas'));
    await evaluate(await source("export {loadSoldiers} from './soldierSheets'",'ActiveAtlas'));
    const report=await evaluate(`(async()=>{
        const ref=OldAtlas.historical(),cur=await ActiveAtlas.loadSoldiers();
        const pixels=img=>new Uint32Array(img.getContext('2d').getImageData(0,0,img.width,img.height).data.buffer);
        const old=pixels(ref.image),now=pixels(cur.image);
        let changedPixels=0,frames=0;const mismatches=[];
        for(const g of cur.data.groups)for(const a of ref.actions)for(let fr=0;fr<ref.frameCount(g.kind,a);fr++){
            const i=ref.cells.get(ref.key(g.f,g.kind,a,fr,g.role)),sx=i%ref.cols*ref.cw,sy=Math.floor(i/ref.cols)*ref.ch;
            const tile=cur.data.tiles[g.frames[cur.offsets[a]+fr*4]], [tx,ty,width,height,fx,fy]=tile;
            if(width!==ref.cw||height!==ref.ch||fx!==46||fy!==56)throw Error('frame geometry');
            for(let y=0;y<height;y++){
                let p=(sy+y)*ref.image.width+sx,q=(ty+y)*cur.image.width+tx;
                for(let x=0;x<width;x++)if(old[p++]!==now[q++]){changedPixels++;if(mismatches.length<5)mismatches.push([g.kind,a,fr,sx+x,sy+y,old[p-1],now[q-1]]);}
            }
            frames++;
        }
        const kinds=['line_infantry','guard_grenadier','cuirassier','field_cannon','bannerman'];
        const guide=document.createElement('canvas');guide.width=980;guide.height=392;
        const c=guide.getContext('2d');c.fillStyle='#262e2f';c.fillRect(0,0,980,392);c.imageSmoothingEnabled=false;
        c.fillStyle='#efe3c8';c.font='18px sans-serif';c.textAlign='center';
        ['线列步兵','近卫掷弹兵','骑兵','野战炮兵','旗手'].forEach((name,i)=>c.fillText(name,144+i*181,33));
        for(let f=0;f<2;f++){
            c.fillStyle='#ccb998';c.font='15px sans-serif';c.fillText(f?'联军':'法军',31,116+f*163);
            kinds.forEach((kind,i)=>{
                const g=cur.groups.get(f+'/'+kind+'/0'),index=g.frames[cur.offsets[kind==='field_cannon'?'aim':'march']+4];
                const [x,y,w,h]=cur.data.tiles[index];c.drawImage(cur.image,x,y,w,h,52+i*181,35+f*163,w*2,h*2);
            });
        }
        return {frames,changedPixels,mismatches,groups:cur.data.groups.length,actions:ref.actions.length,width:cur.image.width,height:cur.image.height,png:guide.toDataURL()};
    })()`);
    const png=report.png;delete report.png;assert.equal(report.changedPixels,0,JSON.stringify(report.mismatches));assert.equal(report.groups,38);assert.equal(report.frames,2176);
    const dir='docs/shots/T9/sprites';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/all-types.png',Buffer.from(png.split(',')[1],'base64'));
    writeFileSync(dir+'/comparison.json',JSON.stringify({reference:before,...report},null,2));console.log(JSON.stringify(report));
}finally{ws.close();await fetch(browser+'/json/close/'+tab.id);}
