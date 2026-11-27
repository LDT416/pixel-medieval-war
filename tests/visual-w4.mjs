import { mkdirSync,writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const browser=process.env.CDP_URL||'http://127.0.0.1:9527',url=process.env.GAME_URL||'http://127.0.0.1:4185/';
const dir='docs/shots/W4';
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

// 寻找真实种子对局中可复算的镜头；只用模拟快进挑选，录制时再从头重演。
async function plan(scale){
    return ev(`(()=>{
        d.setScale(${scale});if(w.weather==='rain')return {};
        const batteries=new Map(),bounces=[];let muskets,shots,bounce;
        while(!w.ended && w.tick<50000 && (!bounce||!muskets)){
            w.step();
            for(let i=0;i<w.events.length;i++){
                const e=w.events[i];
                if(e.type==='bounce')bounces.push({tick:w.tick,gun:e.unitId,x:e.x,y:e.y});
                if(e.type!=='fire')continue;
                const gun=w.units[e.unitId],c=w.companies[gun.company],t=w.companies[c.target];
                if(!t)continue;
                if(!muskets && !e.explosive && e.struck){
                    muskets={tick:w.tick,x:(c.x+e.endX)/2,y:(c.y+e.endY)/2,company:c.id};
                }
                if(!e.explosive || shots)continue;
                const ball=w.rounds.find(r=>r.gun===gun && r.age<2);if(!ball)continue;
                const series=batteries.get(c.id)||[];
                if(!series.length || series.at(-1).tick!==w.tick){
                    series.push({tick:w.tick,x:(gun.x+ball.tx)/2,y:(gun.y+ball.ty)/2,endX:ball.tx,endY:ball.ty,
                        flight:ball.duration,roll:ball.roll,company:c.id,gun:gun.id,distance:Math.hypot(gun.x-ball.tx,gun.y-ball.ty)});
                    if(series.length>4)series.shift();batteries.set(c.id,series);
                }
                if(series.length===4 && series[3].tick-series[0].tick<450 && series.some(s=>s.roll>=120))shots=series.slice();
            }
            if(shots&&!bounce){
                bounce=bounces.find(b=>shots.some(s=>b.gun===s.gun&&b.tick>=s.tick+s.flight&&b.tick<=s.tick+s.flight+35));
                if(!bounce&&w.tick>shots[3].tick+shots[3].flight+40)shots=undefined;
            }
        }
        return {muskets,shots,bounce};
    })()`);
}
async function position(seed,scale,p,zoom,lead){
    await ev(`d.replay(${seed});d.setScale(${scale});d.startBattle();d.setSpeed(0);
        while(!w.ended&&w.tick<${Math.max(0,p.tick-lead-60)})w.step();
        d.stepFrames(Math.max(0,${p.tick-lead}-w.tick));
        d.panTo((${p.x}-w.layout.width/2)*.05,(${p.y}-w.layout.height/2)*.05);d.zoomTo(${zoom});`);
    await delay(850);
}
async function film(name,frames,step,company){
    // 20 FPS 时间采样，浏览器原生截图包含 HUD 与校射标记。
    const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','20','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-movflags','+faststart',dir+'/'+name+'.mp4'],{stdio:['pipe','ignore','inherit']});
    const done=once(encoder,'exit');let residual=0,maxSegments=0,markerFrames=0,bestScore=0;
    for(let i=0;i<frames;i++){
        residual+=step;const ticks=Math.floor(residual);residual-=ticks;
        await ev(`d.stepFrames(${ticks});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
        const {segments,marker,shooting,hits}=await ev(`({segments:d.getState().tracers.segments,
            marker:[...document.querySelectorAll(".range-callout")].some(e=>!e.hidden),
            shooting:w.companies[${company}].members.filter(u=>u.hp>0&&w.tick-u.firedAt<3).length,
            hits:w.events.filter(e=>e.struck&&!e.explosive&&w.units[e.unitId].company===${company}).length})`);
        maxSegments=Math.max(maxSegments,segments);if(marker)markerFrames++;
        const score=name==='volley'?shooting+hits*3:marker?Math.min(99,segments):0;
        if(score>bestScore){await shot(name);bestScore=score;}
        const data=Buffer.from((await call('Page.captureScreenshot',{format:'jpeg',quality:81})).data,'base64');
        if(!encoder.stdin.write(data))await once(encoder.stdin,'drain');
    }
    encoder.stdin.end();assert.equal((await done)[0],0);return {frames,maxSegments,markerFrames,bestScore};
}
async function performanceRun(seed,p,mode){
    await position(seed,1800,p,85,0);
    await ev(`while(d.getState().tracers.mode!=='${mode}')document.querySelector('#tracer-mode').click();d.setSpeed(1)`);
    await delay(1800);const fps=[],calls=[],segments=[];
    for(let i=0;i<16;i++){await delay(500);const s=await ev('d.getState()');fps.push(s.fps);calls.push(s.tracers.drawCalls);segments.push(s.tracers.segments);}
    await ev('d.setSpeed(0)');
    const sorted=[...fps].sort((a,b)=>a-b);
    return {fps,median:(sorted[7]+sorted[8])/2,maxCalls:Math.max(...calls),maxSegments:Math.max(...segments)};
}
try{
    await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1100,height:680,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:url+'?seed=42'});for(let i=0;i<150&&!await ev('!!window.__arenaDebug');i++)await delay(200);
    await ev("window.d=__arenaDebug;window.w=d.world;if(document.querySelector('#auto').textContent.includes('开'))document.querySelector('#auto').click()");
    let seed,scene;
    const seeds=process.env.W4_SEED?[Number(process.env.W4_SEED)]:[42,...Array.from({length:14},(_,i)=>(i+1)*7919)];
    for(seed of seeds){
        await ev('d.replay('+seed+')');scene=await plan(1200);if(scene.muskets&&scene.shots&&scene.bounce)break;
    }
    assert.ok(scene.muskets&&scene.shots&&scene.bounce,'No complete firing sequence with a recorded bounce');
    console.log('scenes',JSON.stringify({seed,scene}));
    const p=scene.shots[0],last=scene.shots.at(-1),startLead=8;
    await position(seed,1200,scene.muskets,58,8);
    const volley=await film('volley',150,1.5,scene.muskets.company);
    const mid={...p,x:scene.shots.reduce((s,t)=>s+t.x,0)/4,y:scene.shots.reduce((s,t)=>s+t.y,0)/4};
    await position(seed,1200,mid,Math.max(160,Math.min(282,p.distance*.09)),startLead);
    const ticks=last.tick-p.tick+last.flight+35+startLead,frames=Math.min(300,Math.ceil(ticks/1.5));
    const battery=await film('battery',frames,ticks/frames,p.company);
    const benchmark=await plan(1800);assert.ok(benchmark.muskets);
    const on=await performanceRun(seed,benchmark.muskets,'clear'),off=await performanceRun(seed,benchmark.muskets,'off');
    const report={seed,scale:1200,zoom:{volley:58,battery:Math.max(160,Math.min(282,p.distance*.09))},scene,volley,battery,benchmark:{scale:1800,on,off,delta:off.median-on.median},errors};
    writeFileSync(dir+'/measurements.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
    assert.ok(volley.bestScore>0 && volley.maxSegments>0 && battery.maxSegments>0 && battery.markerFrames>0);assert.ok(on.maxSegments>0 && on.maxCalls<=2 && off.maxCalls===0 && off.median-on.median<=5);assert.equal(errors.length,0);
}finally{ws.close();await fetch(browser+'/json/close/'+tab.id);}
