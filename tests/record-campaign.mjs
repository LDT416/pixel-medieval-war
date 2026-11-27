import {writeFileSync,mkdirSync} from 'node:fs';
import {discover} from './campaign-scenes.mjs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';

const dir='docs/shots/T8C';mkdirSync(dir,{recursive:true});
const cdp=process.env.CDP_URL||'http://127.0.0.1:9537',game=process.env.GAME_URL||'http://127.0.0.1:28731/';
const tab=await(await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
await once(ws,'open');let seq=0;const requests=new Map(),errors=[],report={};
ws.onmessage=({data})=>{const e=JSON.parse(data);if(e.id){const [yes,no]=requests.get(e.id);requests.delete(e.id);e.error?no(Error(e.error.message)):yes(e.result);}
    if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text);};
const call=(method,params={})=>new Promise((yes,no)=>{requests.set(++seq,[yes,no]);ws.send(JSON.stringify({id:seq,method,params}));});
async function ev(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;}
async function image(path){const p=await call('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(p.data,'base64'));}
async function start(seed,tick){
    await ev(`d.replay(${seed});d.startBattle();d.setSpeed(0);
        if(document.getElementById('auto').getAttribute('aria-pressed')==='true')document.getElementById('auto').click();
        while(w.tick<${Math.max(0,tick-45)})w.step(); d.stepFrames(${tick}-w.tick);`);
}
async function film(name,scene,ticks,caption,view){
    await start(scene.seed,ticks[0]);await ev(view);
    await delay(1000);
    const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','18','-i','-','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/'+name+'.mp4'],{stdio:['pipe','ignore','inherit']});
    const done=once(encoder,'exit');
    for(let i=0;i<ticks.length;i++){
        await ev(`d.stepFrames(${ticks[i]}-w.tick);${view};cap.textContent=${caption};new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
        if(i===Math.floor(ticks.length*.66))await image(dir+'/'+name+'.png');
        const b=Buffer.from((await call('Page.captureScreenshot',{format:'jpeg',quality:83})).data,'base64');
        if(!encoder.stdin.write(b))await once(encoder.stdin,'drain');
    }
    encoder.stdin.end();assert.equal((await done)[0],0);
    report[name]={seed:scene.seed,frames:ticks.length,begin:ticks[0],end:ticks.at(-1),camera:await ev('d.getState().camera')};
}
function ramp(a,b,n){return Array.from({length:n},(_,i)=>Math.round(a+(b-a)*i/(n-1)));}
try{
    await call('Page.enable');await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1100,height:680,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:game});for(let i=0;i<150&&!await ev('!!window.__arenaDebug');i++)await delay(200);
    await ev(`window.d=__arenaDebug;window.w=d.world;window.cap=document.createElement('p');
        cap.style.cssText='position:fixed;bottom:8px;left:50%;transform:translateX(-50%);white-space:nowrap;margin:0;padding:8px 15px;color:#fff4dd;background:#18211cf0;border:1px solid #948669;font:15px sans-serif;pointer-events:none;z-index:1000';
        document.body.append(cap);window.look=(x,y,z)=>{d.panTo((x-w.layout.width/2)*.05,(y-w.layout.height/2)*.05);d.zoomTo(z)};`);
    await ev(`window.planned={};window.discover=${discover.toString()};`);
    let scenes;
    for(let i=1;i<=60;i++){
        scenes=await ev(`d.replay(${i*7919});d.setScale(1200);discover(w,planned,${i*7919});planned`);
        if(scenes.reinforcement&&scenes.relief)break;
    }
    assert.ok(scenes.relief&&scenes.reinforcement);
    writeFileSync(dir+'/scenes.json',JSON.stringify(scenes,null,2));console.log('browser scenes',JSON.stringify(scenes));
    mkdirSync('docs/shots/W1',{recursive:true});
    await start(scenes.deployment.seed,0);
    for(const [name,expr,z] of [['bridge','w.layout.bridges[0]',83],['farm','w.layout.farms[0]',68],['ridge','w.layout.ridges[0]',270]]){
        await ev(`cap.hidden=true;{const p=${expr};look(p.x,p.y,${z});}`);await delay(1250);await image('docs/shots/W1/'+name+'.png');
    }
    await ev('cap.hidden=false;');
    const de=scenes.deployment,re=scenes.reinforcement,ro=scenes.relief;
    await film('deployment',de,ramp(0,de.end,170),`'部署 · '+w.companies[${de.company}].name+(w.tick<1050?'纵队沿道路进场':'展开到预定阵位')`,
        `{const c=w.companies[${de.company}];look(c.x,c.y,w.tick<115?260:w.tick<900?130:82)}`);
    const deployCheck=await ev(`(()=>{const c=w.companies[${de.company}],p=w.plans[c.faction].destinations.find(p=>p.company===c.id);return Math.hypot(c.x-p.x,c.y-p.y)})()`);
    assert.ok(deployCheck<1);
    await film('reinforcement',re,[...ramp(re.tick-90,re.tick+65,45),...ramp(re.tick+66,re.arrived,48),...ramp(re.arrived+1,re.arrived+520,70)],
        `w.tick<${re.tick}?'预备队待命':w.tick<${re.arrived}?'增援命令已派出 · '+w.companies[${re.company}].name:'传令兵送达 · '+w.companies[${re.company}].name+'向战区调动'`,
        `{const c=w.companies[${re.company}],m=w.logistics.couriers.find(m=>m.company===c.id),follow=m&&w.tick>${re.tick+20}?m:c;look(follow.x,follow.y,m?155:102)}`);
    assert.ok(await ev(`w.news.some(n=>n.tick===${re.tick}&&n.text===${JSON.stringify(re.text)})`),'reserve news differs from scene plan');
    await film('relief',ro,[...ramp(ro.requested-30,ro.tick-110,70),...ramp(ro.tick-109,ro.tick+110,84),...ramp(ro.tick+111,ro.tick+480,64)],
        `w.tick<${ro.tick}?'二线前移 · '+w.companies[${ro.reserve}].name+'接近一线':w.companies[${ro.reserve}].name+'接防 · '+w.companies[${ro.front}].name+'侧撤休整'`,
        `{const c=w.companies[${ro.front}],r=w.companies[${ro.reserve}],dx=r.x-c.x,dy=r.y-c.y;look(c.x+dx*.5,c.y+dy*.5,Math.min(280,Math.max(75,Math.abs(dx)*.075,Math.abs(dy)*.13)))}`);
    const handover=await ev(`w.logistics.handovers.find(h=>h.front===${ro.front}&&h.reserve===${ro.reserve})`);
    assert.ok(handover&&handover.distance<=105);assert.equal(handover.tick,ro.tick);
    report.relief.handover=handover;assert.deepEqual(errors,[]);writeFileSync(dir+'/recordings.json',JSON.stringify(report,null,2));console.log(report);
}finally{ws.close();await fetch(cdp+'/json/close/'+tab.id);}
