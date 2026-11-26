const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {build}=require('esbuild');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const prefix='/campaign/1815/', root=path.resolve('dist');
const expectedAssets=['cover_1815','oak','beech','spruce','bush','hedge','bridge','starfort','barracks','farmhouse','redoubt'].map(k=>'px_'+k+'.png').sort();
const mime={'.png':'image/png','.webp':'image/webp','.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css'};
function staticServer(){
    return http.createServer((req,res)=>{
        const url=new URL(req.url,'http://localhost');
        if (!url.pathname.startsWith(prefix)) return res.writeHead(404).end();
        const name=url.pathname.slice(prefix.length)||'index.html', file=path.resolve(root,name);
        if (name==='qa.html') return res.writeHead(200,{'content-type':mime['.html']}).end('<!doctype html><title>QA</title>');
        if (!file.startsWith(root+path.sep)||!fs.existsSync(file)) return res.writeHead(404).end();
        res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
        fs.createReadStream(file).pipe(res);
    });
}

async function gestures(page,ctx) {
    const cdp=await ctx.newCDPSession(page);
    const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id}))});
    const camera=()=>page.locator('#world').getAttribute('data-camera').then(v=>v.split(',').map(Number));
    const mini=page.locator('#mini');
    await mini.evaluate(e=>{
        const r=e.getBoundingClientRect();
        e.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*.5,clientY:r.top+r.height*.5}));
    });
    await page.waitForTimeout(260);
    const first=await camera();
    await touch('touchStart',[[100,430,1]]);
    await touch('touchMove',[[125,435,1]]);
    await touch('touchMove',[[150,440,1]]);
    await touch('touchEnd',[]);
    await page.waitForTimeout(220);
    const pan=await camera();
    assert.ok(first[0]-pan[0]>50/first[2]+1,'drag keeps moving after finger lifts');
    await page.waitForTimeout(1200);
    const before=await camera();
    await touch('touchStart',[[125,420,1],[205,420,2]]);
    await touch('touchMove',[[95,435,1],[255,435,2]]);
    await touch('touchEnd',[]);
    await page.waitForTimeout(320);
    const after=await camera();
    assert.ok(Math.abs(after[2]/before[2]-2)<.035,'two-finger 2x zoom');
    for(const [a,b,i,origin] of [[165,175,0,195],[420,435,1,422]]) {
        const drift=before[i]+(a-origin)/before[2]-after[i]-(b-origin)/after[2];
        assert.ok(Math.abs(drift)<3,'world anchor drift: '+drift);
    }
    await cdp.detach();
}

async function benchmark(page,save) {
    await page.evaluate(s=>{
        localStorage.setItem('napoleon-6.0',JSON.stringify({world:s,marks:[],particles:[],side:0}));
    },save);
    await page.locator('#restore').evaluate(b=>b.click());
    await page.locator('#pause').evaluate(b=>b.click());
    await page.locator('#mini').evaluate(e=>{
        const r=e.getBoundingClientRect();
        e.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*.5,clientY:r.top+r.height*.5}));
    });
    if (await page.locator('#settings').isVisible()) await page.locator('#menu').click();
    const times=await page.evaluate(()=>new Promise(resolve=>{
        const intervals=[];
        let first=0,last=0;
        function sample(t){
            if(!first) first=t;
            if (last && t-first>700) intervals.push(t-last);
            last=t;
            if(t-first<5800) requestAnimationFrame(sample); else resolve(intervals);
        }
        requestAnimationFrame(sample);
    }));
    await page.locator('#save').evaluate(b=>b.click());
    const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('napoleon-6.0')).world);
    const alive=s.units.filter(u=>u.hp>0).length;
    assert.ok(s.tick>100 && alive<300,'battle is actively simulating and taking losses');
    const fps=times.length*1000/times.reduce((a,b)=>a+b,0);
    const sorted=[...times].sort((a,b)=>a-b);
    return {start:300,alive,ticks:s.tick,frames:times.length,fps:+fps.toFixed(1),p95Ms:+sorted[Math.floor(sorted.length*.95)].toFixed(1)};
}

(async()=>{
    assert.deepEqual(fs.readdirSync(path.join(root,'art')).filter(n=>/^px_.*\.png$/.test(n)).sort(),expectedAssets);
    for(const file of expectedAssets) assert.ok(fs.readFileSync(path.join(root,'art',file)).equals(fs.readFileSync(path.join('public/art',file))),file);
    const server=staticServer();
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); server.unref();
    const base='http://127.0.0.1:'+server.address().port+prefix;
    const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
    console.log('Browser',browser.version());
    try {
        const fixture=await browser.newPage();
        await fixture.goto(base+'qa.html');
        const bundle=await build({entryPoints:['tests/ground.ts'],bundle:true,write:false,format:'iife',globalName:'QA'});
        await fixture.addScriptTag({content:bundle.outputFiles[0].text});
        console.log('PASS visual poses, artillery recoil and smoke:',await fixture.evaluate(()=>QA.animationFrames()));
        const save=await fixture.evaluate(()=>QA.battleSave());
        console.log('PASS permanent, restored pixel-identical stamps:',await fixture.evaluate(()=>QA.persistentMarks()));
        await fixture.close();
        const metrics=[];
        for(const [w,h,mobile] of [[1440,900,false],[390,844,true]]) {
            const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});
            const page=await ctx.newPage(),errors=[],requests=new Set();
            page.on('pageerror',e=>errors.push(e.message));
            page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
            page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url()); requests.add(new URL(r.url()).pathname.split('/').pop());});
            page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));
            await page.goto(base);
            await page.waitForFunction(()=>document.querySelector('#art')?.naturalWidth===640);
            if(process.env.QA_SCREEN_DIR)await page.screenshot({path:path.resolve(process.env.QA_SCREEN_DIR,'cover-'+w+'.png')});
            for(const [map,mode] of [['darkwood','lord'],['twin','sandbox'],['gorge','sandbox']]) {
                await page.selectOption('#maps',map); await page.click('#'+mode); await page.locator('#world[data-camera]').waitFor();
                const cards=page.locator('#cards button[data-kind]');
                assert.equal(await cards.count(),5);
                await page.locator('#save').evaluate(b=>b.click());
                const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('napoleon-6.0')).world);
                assert.deepEqual([state.map,state.mode],[map,mode]);
                if(mode==='lord') {
                    for(const id of ['charge','recall','rampart']) await page.locator('#'+id).evaluate(b=>b.click());
                    if(mobile) await gestures(page,ctx);
                }
                if(mode==='sandbox') {
                    const before=state.units.filter(u=>u.kind==='line_infantry').length;

                    await page.locator('#cards button[data-kind="line_infantry"]').evaluate(b=>b.click());
                    await page.locator('#world').click({position:{x:w*.5,y:h*.48}});
                    await page.waitForTimeout(150);await page.locator('#save').evaluate(b=>b.click());
                    const n=await page.evaluate(()=>JSON.parse(localStorage.getItem('napoleon-6.0')).world.units.filter(u=>u.kind==='line_infantry').length);
                    assert.equal(n-before,30,'one free company placed through UI');
                }
                if(map==='gorge') {
                    metrics.push({viewport:w+'×'+h,...await benchmark(page,save)});
                    console.log('Battle measurement',metrics.at(-1));
                    if(process.env.QA_SCREEN_DIR)await page.screenshot({path:path.resolve(process.env.QA_SCREEN_DIR,'battle-'+w+'.png')});
                }
                await page.locator('#back').evaluate(b=>b.click());
            }
            assert.deepEqual(errors,[]);
            assert.ok(expectedAssets.every(f=>requests.has(f)), 'all 11 PNGs loaded through subpath');
            await ctx.close();
        }
        const offline=await browser.newContext({offline:true}); const file=await offline.newPage();
        const errors=[];file.on('pageerror',e=>errors.push(e.message));
        file.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));
        await file.goto(pathToFileURL(path.resolve('dist/index.html')).href);
        await file.waitForFunction(()=>document.querySelector('#art')?.naturalWidth===640);
        await file.click('#sandbox');await file.waitForTimeout(500);assert.deepEqual(errors,[]);
        await offline.close();
        console.log('PASS 11 PNGs, modes, placement, offline file launch and 390×844 inertial pan + anchored pinch');
        for(const m of metrics) assert.ok(m.fps>=55,m.viewport+' averaged '+m.fps+' FPS (target ≥55)');
    } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
