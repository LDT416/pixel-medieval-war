// 用 Chrome CDP 和 WebGL 画布录制真实回放。字幕计时来自本次运行的模拟 tick 与浏览器实时时钟。
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const [url,planPath,selection='all',cdp='http://127.0.0.1:9543',dest='docs/shots/T8B']=process.argv.slice(2);
if(!url||!planPath)throw Error('用法：node tests/record-battle-clips.mjs URL 场景计划 [all|ranks|charge] [CDP] [输出目录]');
const plan=JSON.parse(readFileSync(planPath)),out=resolve(dest);
mkdirSync(out,{recursive:true});
const tab=await(await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
const pending=new Map(),errors=[];let seq=0;
ws.onmessage=({data})=>{
    const e=JSON.parse(data);
    if(e.id){const {r,j}=pending.get(e.id);pending.delete(e.id);e.error?j(Error(e.error.message)):r(e.result);}
    else if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text);
};
const call=(method,params={})=>new Promise((r,j)=>{pending.set(++seq,{r,j});ws.send(JSON.stringify({id:seq,method,params}));});
const evaluate=async expression=>{
    const p=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true,timeout:180000});
    if(p.exceptionDetails)throw Error(p.exceptionDetails.exception?.description??p.exceptionDetails.text);
    return p.result.value;
};
const temp=mkdtempSync(join(tmpdir(),'1815-t8b-'));
function subtitleTime(sec){
    const t=Math.floor(Math.max(0,sec)*1000);
    return [Math.floor(t/3600000),Math.floor(t/60000)%60,Math.floor(t/1000)%60].map(n=>String(n).padStart(2,'0')).join(':')+','+String(t%1000).padStart(3,'0');
}
function label(scene,last){
    if(scene.kind==='charge'){
        if(last>=scene.contact+9)return scene.outcome==='break'?'守军开始溃退':'双方进入白刃战';
        if(last>=scene.defender.tick)return '守军近距离开火';
        if(last>=scene.rush)return '进攻连开始冲刺';
        if(last>=scene.signal && scene.attacker.tick>=scene.signal && last>=scene.attacker.tick)return '冲锋信号 · 停步排射';
        if(last>=scene.signal)return '冲锋信号';
        if(last>=scene.attacker.tick)return '进攻连停步排射';
        return '进攻链接近守军';
    }
    const firing=scene.shots.findLast(s=>s.tick<=last);
    return firing?'第'+(firing.groups[0]+1)+(scene.mode==='platoon'?'组开火':'排开火'):'连队准备射击';
}
async function captureInGame(scene){
    const d=window.__arenaDebug,w=d.world;
    const canvas=document.querySelector('#battlefield'),stream=canvas.captureStream(30);
    const audio=window.__recordAudio?.stream?.getAudioTracks()??[];
    for(const track of audio)stream.addTrack(track.clone());
    const mime=audio.length?'video/webm;codecs=vp9,opus':'video/webm;codecs=vp9';
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6500000}),chunks=[];
    rec.ondataavailable=e=>chunks.push(e.data);
    const stopped=new Promise(r=>rec.onstop=r),start=performance.now(),clock=[],actualFires=[],changes=[],c=w.companies[scene.company];
    const original=w.step,drumsBefore=d.getState().chargeDrums,drumEvents=[];let previous='',kneelPeak=0,frontStoodAgain=false,wasKneeling=false;
    w.step=function(){
        original.call(this);const tick=w.tick;
        clock.push([tick,(performance.now()-start)/1000]);
        for(const e of w.events){if(e.type==='drum'&&w.units[e.unitId].company===c.id)drumEvents.push(tick);if(e.type!=='fire'||e.explosive)continue;const u=w.units[e.unitId];
            const shooter=w.companies[u.company];
            if(u.company===c.id||(scene.kind==='charge'&&u.company===scene.target))actualFires.push({tick,company:u.company,target:u.shotTarget,group:shooter.fireMode==='platoon'?Math.floor(u.slot%shooter.files*4/shooter.files):Math.floor(u.slot/shooter.files)%shooter.ranks});
        }
        if(scene.kind==='charge'&&c.assaultStage!==previous){changes.push({tick,stage:c.assaultStage});previous=c.assaultStage;}
        const front=c.members.filter(u=>u.hp>0&&u.slot<c.files),kneeling=front.filter(u=>u.pose==='kneel'||u.pose==='kneelLoad').length;
        if(wasKneeling&&kneeling<kneelPeak&&front.some(u=>u.pose==='aim'||u.pose==='stand'))frontStoodAgain=true;
        wasKneeling||=kneeling>0;kneelPeak=Math.max(kneelPeak,kneeling);
    };
    const follow=setInterval(window.aimCompany,80);
    rec.start();d.setSpeed(1);
    try{
        await new Promise((ok,fail)=>{const timer=setInterval(()=>{
            if(w.tick>=scene.end){clearInterval(timer);ok();}
            else if(w.ended||performance.now()-start>125000){clearInterval(timer);fail(Error('未到达录屏尾帧 '+w.tick));}
        },20);});
    }finally{d.setSpeed(0);clearInterval(follow);w.step=original;rec.stop();}
    await stopped;stream.getTracks().forEach(t=>t.stop());
    const bytes=await new Promise(r=>{const file=new FileReader();file.onload=()=>r(file.result.split(',')[1]);file.readAsDataURL(new Blob(chunks));});
    return {bytes,clock,actualFires,changes,kneelPeak,frontStoodAgain,audioTracks:audio.length,drumEvents,playedDrums:d.getState().chargeDrums-drumsBefore,charge:w.charges.find(q=>q.tick===scene.contact&&q.company===scene.company)};
}
try{
    await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
    await call('Page.addScriptToEvaluateOnNewDocument',{source:`const prev=AudioNode.prototype.connect; AudioNode.prototype.connect=function(destination,...args){const ret=prev.call(this,destination,...args);if(destination===this.context.destination){window.__recordAudio??=this.context.createMediaStreamDestination();prev.call(this,window.__recordAudio);}return ret;};`});
    await call('Page.navigate',{url:new URL('?seed='+plan.seed,url).href});
    for(let i=0;i<220&&!await evaluate('!!window.__arenaDebug');i++)await delay(150);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:5,y:360,button:'left',clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:5,y:360,button:'left',clickCount:1});
    await evaluate("document.querySelector('#auto')?.click()");
    for(const scene of plan.scenes.filter(s=>selection==='all'||(selection==='charge')===(s.kind==='charge'))){
        console.log('定位',scene.kind,scene.start);
        await evaluate(`(()=>{const d=__arenaDebug,w=d.world;d.replay(${plan.seed});d.startBattle();d.setSpeed(0);while(w.tick<${scene.start}&&!w.ended)w.step();window.aimCompany=()=>{const c=w.companies[${scene.company}],t=w.companies[${scene.target??scene.company}],x=(c.x+t.x)/2,y=(c.y+t.y)/2;d.panTo((x-w.width/2)*.05,(y-w.layout.height/2)*.05);d.zoomTo(${scene.kind==='charge'?36:29})};aimCompany()})()`);
        await delay(1250);
        const {bytes,clock,...evidence}=await evaluate('('+captureInGame.toString()+')('+JSON.stringify(scene)+')');
        if(!clock.length||clock.at(-1)[0]<scene.end)throw Error('片段帧号不完整');
        const file=scene.kind;
        writeFileSync(join(temp,file+'.webm'),Buffer.from(bytes,'base64'));
        const title=scene.kind==='charge'?scene.name+' → '+scene.defenderName:(scene.kind==='french'?'法军三排轮射':'英军'+(scene.mode==='platoon'?'四组滚射':'两排轮射'))+' · '+scene.name;
        const captions=[];let last='';
        for(const [tick,time] of clock){const next=label(scene,tick);if(next!==last){if(captions.length)captions.at(-1).end=time;captions.push({start:captions.length?time:0,end:0,text:next});last=next;}}
        captions.at(-1).end=clock.at(-1)[1]+.1;
        writeFileSync(join(temp,file+'.srt'),captions.map((v,i)=>[i+1,subtitleTime(v.start)+' --> '+subtitleTime(v.end),title+'   |   '+v.text,''].join('\n')).join('\n'),'utf8');
        execFileSync('ffmpeg',['-v','error','-y','-i',file+'.webm','-vf',"fps=30,tpad=stop_mode=clone:stop_duration=0.1,subtitles="+file+".srt:force_style='Fontname=Microsoft YaHei,Fontsize=15,BorderStyle=3,BackColour=&H80000000,Outline=0,MarginV=12'",...(scene.kind==='charge'?[]:['-t','15']),'-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-pix_fmt','yuv420p','-movflags','+faststart',join(out,file+'.mp4')],{cwd:temp});
        const summary={seed:plan.seed,...scene,...evidence,tickRange:[clock[0][0],clock.at(-1)[0]],seconds:Math.round(clock.at(-1)[1]*100)/100};
        writeFileSync(join(out,file+'.json'),JSON.stringify(summary,null,2));console.log(file,summary.seconds,'s',evidence.actualFires.length,'shots');
        if(!evidence.actualFires.length || (scene.kind==='charge'&&!evidence.charge))throw Error('真实事件与计划不符');
        if(scene.groups && scene.groups.some(group=>!evidence.actualFires.some(e=>e.group===group)))throw Error('部分射击组未开火');
        if(scene.kind==='charge'&&(!evidence.playedDrums||!evidence.audioTracks||!evidence.drumEvents.includes(scene.signal)))throw Error('冲锋鼓的实录音轨或事件缺失');
    }
    if(errors.length)throw Error(errors.join('\n'));
}finally{
    ws.close();await fetch(cdp+'/json/close/'+tab.id);rmSync(temp,{recursive:true,force:true});
}
