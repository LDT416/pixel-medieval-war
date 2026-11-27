// 对照两份同一模拟版本的构建，仅替换角色渲染代码；Chrome 需由调用者开启本机 CDP。
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const [oldUrl,newUrl,cdp='http://127.0.0.1:9543',dest='docs/shots/W5']=process.argv.slice(2);
if(!oldUrl||!newUrl)throw Error('用法：node tests/soldier-shots.mjs <旧版URL> <新版URL> [CDP URL] [输出目录]');
mkdirSync(dest,{recursive:true});
const results={};
async function inspect(name,url,images){
    const tab=await(await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
    const pending=new Map(),errors=[];let id=0;
    ws.onmessage=({data})=>{const e=JSON.parse(data);if(e.id){const {r,j}=pending.get(e.id);pending.delete(e.id);e.error?j(Error(e.error.message)):r(e.result);}
        else if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text);
        else if(e.method==='Runtime.consoleAPICalled'&&e.params.type==='error')errors.push(e.params.args.map(a=>a.value??a.description).join(' '));};
    const call=(method,params={})=>new Promise((r,j)=>{pending.set(++id,{r,j});ws.send(JSON.stringify({id,method,params}));});
    const ev=async expression=>{const x=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,timeout:120000});if(x.exceptionDetails)throw Error(x.exceptionDetails.exception?.description??x.exceptionDetails.text);return x.result.value;};
    try{
        await call('Runtime.enable');await call('Page.enable');
        await call('Emulation.setDeviceMetricsOverride',{width:1280,height:768,deviceScaleFactor:1,mobile:false});
        if(name==='fallback'){
            await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
            await call('Network.setBlockedURLs',{urls:['*art/soldiers/regiments.png*','*art/soldiers/regiments.json*']});
        }
        await call('Page.navigate',{url:new URL('?seed=42',url).href});
        for(let i=0;i<200&&!await ev('!!window.__arenaDebug');i++)await delay(150);
        await ev(`window.d=__arenaDebug;window.w=d.world;window.aim=(c,dist)=>{d.panTo((c.x-w.width/2)*.05,(c.y-(w.layout.height??3200)/2)*.05);d.zoomTo(dist)};d.startBattle();d.setSpeed(0);d.setLighting('golden');document.querySelector('#auto')?.click();aim(w.companies.find(c=>c.line===0&&c.faction===0),40)`);
        await delay(1700);
        const shot=async file=>{const png=await call('Page.captureScreenshot',{format:'png'});writeFileSync(join(dest,file),Buffer.from(png.data,'base64'));};
        await shot('close-'+name+'.png');
        if(name==='fallback'){
            const live=await ev('d.setSpeed(1);new Promise(r=>setTimeout(()=>r(d.getState().tick),600))');
            if(live<2||errors.length)throw Error('缺图回退未通过 '+errors.join(' '));
            console.log('缺图回退',live);return;
        }
        if(images){
            const data=await ev('d.atlas()');writeFileSync(join(dest,'atlas.png'),Buffer.from(data.split(',')[1],'base64'));
            // 独立录制真实对局中三段动作，保持 1× 与同一镜头距离。
            const clips=[
                ['march',"w.companies.find(c=>c.kind==='line_infantry' && c.members.filter(u=>u.hp>0 && u.pose==='march').length>=8)",3600],
                ['volley',"(()=>{const e=w.events.find(e=>e.type==='fire' && !e.explosive && w.companies[w.units[e.unitId].company].alive>16);return e&&w.companies[w.units[e.unitId].company]})()",3700],
                ['charge',"w.companies.find(c=>c.kind==='line_infantry' && c.status!=='rout' && c.order==='assault' && c.members.filter(u=>u.hp>0 && u.pose==='run').length>=5)",3500]
            ];
            const events=[],temp=mkdtempSync(join(tmpdir(),'1815-soldier-shots-'));
            try{
            for(const [clip,condition,ms] of clips){
                const scene=await ev(`(()=>{d.replay(42);d.startBattle();d.setSpeed(0);let c;while(!w.ended){w.step();if(c=(${condition}))break}if(!c)throw Error('未找到动作 ${clip}');aim(c,40);window.observed=c;return {tick:w.tick,company:c.name}})()`);
                await delay(800);
                const data=await ev(`(async()=>{const stream=document.querySelector('canvas').captureStream(30);const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>rec.onstop=r);rec.start();d.setSpeed(1);const follow=setInterval(()=>aim(observed,40),100);await new Promise(r=>setTimeout(r,${ms}));clearInterval(follow);d.setSpeed(0);rec.stop();await done;stream.getTracks().forEach(t=>t.stop());return await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks))})})()`);
                writeFileSync(join(temp,clip+'.webm'),Buffer.from(data,'base64'));events.push({clip,...scene});
            }
            execFileSync('ffmpeg',['-v','error','-y',...clips.flatMap(([clip])=>['-i',join(temp,clip+'.webm')]),'-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0,fps=30[v]','-map','[v]','-t','10','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',join(dest,'close-motion.mp4')]);
            }finally{rmSync(temp,{recursive:true,force:true});}
            results.events=events;
        }
        await ev(`d.setScale(3600);d.startBattle();d.setSpeed(0);while(w.tick<1600&&!w.ended)w.step();aim(w.frontline(),130);d.setSpeed(1)`);
        await delay(2200);
        const stats=await ev(`(async()=>{const fps=[],drawCalls=[];for(let i=0;i<16;i++){await new Promise(r=>setTimeout(r,500));const s=d.getState();fps.push(s.fps);drawCalls.push(s.drawCalls)}const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {fps,drawCalls,gpu:ext&&gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}})()`);
        if(errors.length)throw Error(errors.join('\n'));
        console.log(name,stats);results[name]=stats;
    }finally{ws.close();await fetch(cdp+'/json/close/'+tab.id);}
}
if(process.env.W5_FALLBACK_ONLY){await inspect('fallback',newUrl,false);}
else{
await inspect('before',oldUrl,false);await inspect('after',newUrl,true);
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
results.fpsDrop=median(results.before.fps)-median(results.after.fps);
writeFileSync(join(dest,'performance.json'),JSON.stringify(results,null,2));
await inspect('fallback',newUrl,false);
if(results.fpsDrop>5)throw Error('角色渲染帧率下降超过 5 FPS');
}
