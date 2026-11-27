import { mkdirSync,writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const browser=process.env.CDP_URL||'http://127.0.0.1:9679',url=process.env.GAME_URL||'http://127.0.0.1:4309/';
const dir='docs/shots/T9/visual';
mkdirSync(dir,{recursive:true});
const tab=await(await fetch(browser+'/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
await once(ws,'open');
let id=0;const pending=new Map(),errors=[];
ws.onmessage=({data})=>{
    const p=JSON.parse(data);
    if(p.id){const job=pending.get(p.id);pending.delete(p.id);if(p.error)job.reject(Error(p.error.message));else job.resolve(p.result);}
    else if(p.method==='Runtime.exceptionThrown')errors.push(p.params.exceptionDetails.exception?.description||p.params.exceptionDetails.text);
    else if(p.method==='Runtime.consoleAPICalled'&&p.params.type==='error')errors.push(p.params.args.map(a=>a.value??a.description).join(' '));
};
function call(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function ev(code){const r=await call('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const shot=async name=>writeFileSync(dir+'/'+name+'.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));


async function load(search){
    await call('Page.navigate',{url:url+search});
    for(let i=0;i<240;i++){
        if(await ev('!!window.__arenaDebug && location.search.includes('+JSON.stringify(search.slice(1))+')'))break;
        await delay(250);
    }
    await ev("window.d=__arenaDebug;window.w=d.world;if(document.querySelector('#auto').textContent.includes('开'))document.querySelector('#auto').click();");
}
async function film(name,focus,seed){
    const seek=async (p)=>ev(`d.setScale(1200);d.replay(${seed});d.startBattle();d.setSpeed(0);d.stepFrames(${Math.max(0,p.tick-8)});
        d.panTo((${p.x}-8000)*.05,(${p.y}-4000)*.05);d.zoomTo(72)`);
    await seek(focus.shots?.[0]??focus);
    const child=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','12','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/'+name+'.mp4'],{stdio:['pipe','ignore','inherit']});
    const done=once(child,'exit');let segments=0,maxLength=0,framesWithTraces=0;
    try{
        for(let frame=0;frame<120;frame++){
            if(frame>0 && focus.shots && frame%30===0)await seek(focus.shots[frame/30]);
            await ev(`d.stepFrames(${frame%2?3:2});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
            const stats=await ev('d.getState().tracers');
            segments=Math.max(segments,stats.segments);maxLength=Math.max(maxLength,stats.maxLength);
            if(stats.segments>0)framesWithTraces++;
            if(frame===8)await shot(name);
            const data=Buffer.from((await call('Page.captureScreenshot',{format:'jpeg',quality:79})).data,'base64');
            if(!child.stdin.write(data))await once(child.stdin,'drain');
        }
    }finally{child.stdin.end();}
    assert.equal((await done)[0],0);assert.ok(maxLength<=1.50001&&framesWithTraces>0);
    return {frames:120,fps:12,seconds:10,segments,maxLength,framesWithTraces};
}
const report={};
try{
    await call('Page.enable');await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride',{width:960,height:540,deviceScaleFactor:1,mobile:false});
    await load('?seed=23757');
    await ev('d.setScale(1200)');report.scale=await ev('w.scale');report.defaultSheet=await ev('performance.getEntriesByType("resource").filter(r=>r.name.includes("/art/soldiers/regiments")).length');
    assert.equal(report.defaultSheet,0);
    const focus=await ev(`(()=>{
        d.startBattle();d.setSpeed(0);let volley=null,battery=null;const shots=[];
        while(!w.ended&&w.tick<7000&&(!volley||!battery)){
            w.step();
            for(const e of w.events)if(e.type==='fire'){
                if(!e.explosive&&!volley)volley={tick:w.tick,x:e.x,y:e.y};
                if(e.explosive&&!battery){
                    shots.push({tick:w.tick,x:e.x,y:e.y,id:e.unitId});
                    if(shots.length===4)battery={shots:shots.slice()};
                }
            }
        }
        return {volley,battery};
    })()`);
    assert.ok(focus.volley&&focus.battery,JSON.stringify(focus));report.focus=focus;
    report.volley=await film('volley',focus.volley,23757);report.battery=await film('battery',focus.battery,23757);
    await load('?sprites=baked&seed=23757');
    report.bakedResources=await ev('performance.getEntriesByType("resource").filter(r=>r.name.includes("/art/soldiers/regiments")).map(r=>new URL(r.name).pathname)');
    assert.ok(report.bakedResources.some(p=>p.endsWith('.png')));
    await ev('d.replay(42)');assert.equal(await ev('new URL(location.href).searchParams.get("sprites")'),'baked');
    report.errors=errors;assert.equal(errors.length,0);
    writeFileSync(dir+'/measurements.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{ws.close();await fetch(browser+'/json/close/'+tab.id);}
