// 使用独立的本机 Chromium 调试端口和预览服务器进行真实页面验收。
// node tests/viewports.mjs [浏览器端口] [预览端口] [mobile|strategic|all]
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {setTimeout as wait} from 'node:timers/promises';
const host='http://127.0.0.1:'+(process.argv[2]||9567);
const url='http://127.0.0.1:'+(process.argv[3]||4197)+'/?seed=42',job=process.argv[4]||'all';
const tab=await(await fetch(host+'/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((yes,no)=>{ws.onopen=yes;ws.onerror=no;});
let id=0;const pending=new Map(),errors=[];
ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const [yes,no]=pending.get(m.id);pending.delete(m.id);m.error?no(m.error):yes(m.result);}
else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
else if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error')errors.push(m.params.args.map(a=>a.value??a.description).join(' '));};
const call=(method,params={})=>new Promise((yes,no)=>{pending.set(++id,[yes,no]);ws.send(JSON.stringify({id,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
const shot=async path=>{const {data}=await call('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(data,'base64'));};
async function metrics(width,height,mobile,ratio=1){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:ratio,mobile,screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0}});
    await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:mobile?5:1});
}
async function loadPage(){
    await call('Page.navigate',{url});
    for(let i=0;i<180 && !await ev('!!window.__arenaDebug');i++)await wait(200);
    assert.ok(await ev('!!window.__arenaDebug'),'等待游戏加载');
    await ev("window.d=__arenaDebug;window.state=()=>d.getState();window.w=d.world;d.startBattle();d.setSpeed(0);if(document.getElementById('auto').getAttribute('aria-pressed')==='true')document.getElementById('auto').click()");
}
async function movie(path,action){
    const dir=mkdtempSync(join(tmpdir(),'1815-capture-')),frames=[];
    let done=false,problem;
    const recording=(async()=>{while(!done){
        const at=performance.now(),{data}=await call('Page.captureScreenshot',{format:'jpeg',quality:75});
        const file=String(frames.length).padStart(5,'0')+'.jpg';writeFileSync(join(dir,file),Buffer.from(data,'base64'));frames.push({at,file});await wait(38);
    }})();
    try{await action();}catch(e){problem=e;}finally{done=true;await recording;}
    if(!problem){
        const lines=frames.flatMap((f,i)=>["file '"+f.file+"'",'duration '+(((frames[i+1]?.at??performance.now())-f.at)/1000).toFixed(5)]);
        lines.push("file '"+frames.at(-1).file+"'");writeFileSync(join(dir,'capture.txt'),lines.join('\n'));
        const proc=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(dir,'capture.txt'),'-vf','fps=24,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',path],{encoding:'utf8'});
        if(proc.status!==0)problem=Error(proc.stderr||'ffmpeg 编码失败');
    }
    rmSync(dir,{recursive:true,force:true});if(problem)throw problem;
}
const touch=(type,arr)=>call('Input.dispatchTouchEvent',{type,touchPoints:arr.map(([x,y],id)=>({x,y,id,radiusX:4,radiusY:4,force:.8}))});
async function mobile(){
    mkdirSync('docs/shots/W3',{recursive:true});
    const report={};
    for(const device of [{name:'iPhone14',w:390,h:844,r:3},{name:'Pixel7',w:412,h:915,r:2.625}]){
        await metrics(device.w,device.h,true,device.r);await loadPage();assert.equal(await ev('w.scale'),600);
        const c=await ev('w.companies.find(c=>c.line===0)??w.companies[0]');
        await ev(`d.panTo((${c.x}-w.layout.width/2)*.05,(${c.y}-w.layout.height/2)*.05);d.zoomTo(115)`);
        await wait(3600);await shot('docs/shots/W3/'+device.name+'-portrait.png');
        assert.equal(await ev("getComputedStyle(document.querySelector('.controls')).display"),'none');
        await ev("document.getElementById('mobile-settings').click()");assert.notEqual(await ev("getComputedStyle(document.querySelector('.controls')).display"),'none');
        await ev("document.getElementById('mobile-settings').click()");
        await metrics(device.h,device.w,true,device.r);await wait(500);
        await shot('docs/shots/W3/'+device.name+'-landscape.png');
        report[device.name]={scale:await ev('w.scale'),portrait:[device.w,device.h],landscape:[device.h,device.w],dpr:await ev("document.getElementById('battlefield').width/document.getElementById('battlefield').clientWidth")};
    }
    await metrics(390,844,true,2);await ev('d.zoomTo(260)');await wait(700);
    const before=await ev('state().camera');
    await movie('docs/shots/W3/pinch-pan.mp4',async()=>{
        await wait(450);await touch('touchStart',[[160,470],[230,470]]);
        for(let i=1;i<=20;i++){await touch('touchMove',[[160-i*4,470],[230+i*4,470]]);await wait(45);}
        await touch('touchEnd',[]);await wait(600);
        await touch('touchStart',[[100,430],[280,430]]);
        for(let i=1;i<=18;i++){await touch('touchMove',[[100+i*3,430+i*2],[280+i*3,430+i*2]]);await wait(40);}
        await touch('touchEnd',[]);await wait(600);
        await touch('touchStart',[[165,415]]);for(let i=1;i<=16;i++){await touch('touchMove',[[165+i*4,415-i*3]]);await wait(38);}await touch('touchEnd',[]);await wait(850);
    });
    const after=await ev('state().camera');console.log('手势镜头',before,after);assert.ok(after.distance<before.distance*.6);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>30);
    report.gesture={before,after};
    const old=await ev('state().camera.desired');await ev("document.getElementById('zoom-out').click()");assert.ok(await ev('state().camera.desired')>old);
    const t=await ev('state().camera.desired');for(let i=0;i<2;i++){await touch('touchStart',[[156,460]]);await wait(30);await touch('touchEnd',[]);await wait(65);}
    assert.ok(await ev('state().camera.desired')<t*.8);
    writeFileSync('docs/shots/W3/measurements.json',JSON.stringify(report,null,2));
}
async function strategic(){
    mkdirSync('docs/shots/W2',{recursive:true});await metrics(1440,860,false);await loadPage();
    await ev("d.setScale(1800);d.startBattle();d.setSpeed(1);if(document.getElementById('auto').getAttribute('aria-pressed')==='true')document.getElementById('auto').click()");
    const c=await ev('w.companies.find(c=>c.line===0)??w.companies[0]');
    await ev(`d.panTo((${c.x}-w.layout.width/2)*.05,(${c.y}-w.layout.height/2)*.05);d.zoomTo(40)`);await wait(2500);
    const measure=async()=>{const samples=[];for(let i=0;i<10;i++){await wait(500);samples.push(await ev('({fps:state().fps,drawCalls:state().drawCalls})'));}return samples;};
    const near=await measure();await shot('docs/shots/W2/near.png');
    await movie('docs/shots/W2/zoom-tour.mp4',async()=>{
        await wait(400);
        for(const d of [80,150,260,380,640,900,1250,2100]){await ev('d.zoomTo('+d+')');await wait(310);}
        await ev('d.panTo(0,0);d.zoomTo(2100)');await wait(1000);
        for(const d of [1300,800,470,300,170,90,40]){await ev('d.zoomTo('+d+')');await wait(340);}
        await ev(`d.panTo((${c.x}-w.layout.width/2)*.05,(${c.y}-w.layout.height/2)*.05)`);await wait(700);
    });
    for(const [name,d] of [['flags',170],['counters',550],['overview',2300]]){await ev((name==='flags'?`d.panTo((${c.x}-w.layout.width/2)*.05,(${c.y}-w.layout.height/2)*.05)`:'d.panTo(0,0)')+';d.zoomTo('+d+')');await wait(1000);await shot('docs/shots/W2/'+name+'.png');}
    const far=await measure();assert.ok(far.every(v=>v.drawCalls<=10),'全图绘制调用预算');
    const median=a=>[...a].sort((x,y)=>x.fps-y.fps)[Math.floor(a.length/2)].fps;
    writeFileSync('docs/shots/W2/measurements.json',JSON.stringify({near,far,nearMedian:median(near),farMedian:median(far)},null,2));
    assert.ok(median(far)>=median(near),'全图帧率');
}
try{await call('Runtime.enable');await call('Page.enable');if(job!=='strategic')await mobile();if(job!=='mobile')await strategic();assert.deepEqual(errors,[]);console.log('镜头、交互与渲染验收通过');}
finally{ws.close();await fetch(host+'/json/close/'+tab.id);}
