// Run npm run build, then node tests/browser-perf.cjs from the repo root.
// Requires Chrome, Playwright (or PLAYWRIGHT_MODULE pointing to it), and FFmpeg on PATH.
// T12_SHOTS selects the evidence directory. T12_PORT selects a local Vite preview port.
// Capture adjacent requestAnimationFrame timestamps on the same 3600-unit page for >=60 s
// with 4x game speed and CDP CPU rate 4. Each sample is [ms since first RAF, difference
// from previous RAF in ms, difference in simulation ticks]. Count every interval >250 ms.
// For the 2400-unit smoke test, advance through the existing paused debug API until ended.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {mkdir,writeFile,mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const {spawnSync}=require('node:child_process');
const {gzipSync}=require('node:zlib');
const assert=require('node:assert/strict');
const path=require('node:path');
const shots=path.resolve(process.env.T12_SHOTS || 'docs/shots/T12/local');
const port=Number(process.env.T12_PORT || 4183);
const site='http://127.0.0.1:'+port+'/?seed=15838';

(async()=>{
    await mkdir(shots,{recursive:true});
    const {preview}=await import('vite');
    const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
    let browser,framesDir;
    try {
        browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader','--no-proxy-server']});
        console.log(JSON.stringify({browser:browser.version(),site,viewport:[1280,800]}));
        const smoke=await browser.newContext({viewport:{width:1280,height:800}});
        const errors=[];
        function observe(page){
            page.on('pageerror',e=>errors.push(e.message));
            page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
        }
        const page=await smoke.newPage();observe(page);
        await page.goto(site);
        await page.waitForFunction(()=>window.__arenaDebug?.world?.scale===2400);
        console.log(JSON.stringify(await page.evaluate(()=>{
            const gl=document.querySelector('#battlefield').getContext('webgl2');
            const ext=gl?.getExtension('WEBGL_debug_renderer_info');
            return {webglRenderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};
        })));
        await page.locator('[data-side="-1"]').click();
        const controls=await page.evaluate(()=>{
            document.querySelector('#next-event').click();
            return {speed:Array.from(document.querySelectorAll('[data-speed]'),b=>Number(b.dataset.speed)),
                scale:Array.from(document.querySelectorAll('[data-scale]'),b=>Number(b.dataset.scale)),
                active:Number(document.querySelector('[data-speed][aria-pressed=true]').dataset.speed)};
        });
        assert.deepEqual(controls,{speed:[.25,1,2,4],scale:[1200,2400,3600],active:4});
        console.log(JSON.stringify(controls));
        await page.screenshot({path:path.join(shots,'speed.png')});
        await page.evaluate(()=>window.__arenaDebug.setSpeed(0));
        let state;
        do {
            state=await page.evaluate(()=>{
                const d=window.__arenaDebug;d.stepFrames(180);
                return {tick:d.world.tick,ended:d.world.ended,winner:d.world.winner};
            });
        } while(!state.ended && state.tick<=36210);
        assert.ok(state.ended);
        await page.screenshot({path:path.join(shots,'victory-2400.png')});
        console.log(JSON.stringify({smoke:state,errors}));
        await smoke.close();
        const rec=await browser.newContext({viewport:{width:1280,height:800}});
        const battle=await rec.newPage();observe(battle);await battle.goto(site);
        await battle.waitForFunction(()=>window.__arenaDebug?.world?.scale===2400);
        await battle.evaluate(()=>window.__arenaDebug.setScale(3600));
        await battle.locator('[data-side="-1"]').click();
        await battle.locator('[data-speed="4"]').click();
        const dev=await rec.newCDPSession(battle);
        await dev.send('Emulation.setCPUThrottlingRate',{rate:4});
        framesDir=await mkdtemp(path.join(tmpdir(),'t12-capture-'));
        const images=[],pending=[];
        dev.on('Page.screencastFrame',frame=>{
            const file='frame-'+String(images.length).padStart(6,'0')+'.jpg';
            images.push({file,time:frame.metadata.timestamp});
            pending.push(writeFile(path.join(framesDir,file),Buffer.from(frame.data,'base64')));
            dev.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{});
        });
        await dev.send('Page.startScreencast',{format:'jpeg',quality:65,maxWidth:960,maxHeight:600});
        const traceDone=new Promise(r=>dev.once('Tracing.tracingComplete',r));
        await dev.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.frame',transferMode:'ReturnAsStream'});
        const frames=await battle.evaluate(()=>new Promise(resolve=>{
            const rows=[];let first,last,previous;
            function frame(now){
                const tick=window.__arenaDebug.world.tick;
                if(first===undefined){first=now;performance.mark('T12-start');}
                else rows.push([now-first,now-last,tick-previous]);
                last=now;previous=tick;
                if(now-first<60000)requestAnimationFrame(frame);
                else {performance.mark('T12-end');resolve(rows);}
            }
            requestAnimationFrame(frame);
        }));
        await dev.send('Tracing.end');
        const {stream}=await traceDone,parts=[];
        for(;;){const row=await dev.send('IO.read',{handle:stream});
            parts.push(Buffer.from(row.data,row.base64Encoded?'base64':'utf8'));if(row.eof)break;
        }
        await dev.send('IO.close',{handle:stream});
        const traceFile=path.join(shots,'chrome-performance.json.gz');
        await writeFile(traceFile,gzipSync(Buffer.concat(parts)));
        await writeFile(path.join(shots,'raf-3600.json'),JSON.stringify({
            columns:['elapsedMs','frameIntervalMs','simSteps'],cpuThrottle:4,speed:4,frames}));
        const maxMs=Math.max(...frames.map(r=>r[1])),maxSteps=Math.max(...frames.map(r=>r[2]));
        console.log(JSON.stringify({rafFrames:frames.length,elapsedMs:frames.at(-1)[0],maxMs,maxSteps,
            above250ms:frames.filter(r=>r[1]>250).length,errors}));
        await dev.send('Page.stopScreencast');await rec.close();await Promise.all(pending);
        assert.ok(images.length>1);
        const list=images.map((im,i)=>"file '"+im.file+"'\nduration "+
            Math.max(.001,(images[i+1]?.time??im.time+.05)-im.time)).join('\n')+"\nfile '"+images.at(-1).file+"'\n";
        await writeFile(path.join(framesDir,'list.txt'),list);
        const enc=spawnSync('ffmpeg',['-v','error','-y','-f','concat','-i','list.txt','-fps_mode','vfr','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p',path.join(shots,'throttle-3600.mp4')],{cwd:framesDir,encoding:'utf8'});
        assert.equal(enc.status,0,enc.error?.message || enc.stderr);console.log('Screencast frames',images.length);
        assert.deepEqual(errors,[]);assert.ok(maxSteps<=8);assert.ok(maxMs<=250,'RAF interval exceeded 250 ms');
    } finally {
        await browser?.close();await server.close();
        if(framesDir && path.dirname(framesDir)===path.resolve(tmpdir()) && path.basename(framesDir).startsWith('t12-capture-')){
            await rm(framesDir,{recursive:true,force:true});
        }
    }
})().catch(e=>{console.error(e);process.exitCode=1});
