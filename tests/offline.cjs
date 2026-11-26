const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {build}=require('esbuild'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const fs=require('node:fs'),http=require('node:http'),root=path.resolve('dist');
 const prefix='/campaign/1815/';
 const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return;}
    const name=url.pathname.slice(prefix.length)||'index.html',p=path.resolve(root,name);
    if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',name.endsWith('.webp')?'image/webp':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');
    fs.createReadStream(p).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const assets=fs.readdirSync(path.resolve('public/art')).filter(f=>f.endsWith('.webp')).sort();
 assert.equal(assets.length,26);assert.deepEqual(fs.readdirSync(path.join(root,'art')).sort(),assets);
 for(const name of assets)assert.ok(fs.readFileSync(path.join(root,'art',name)).equals(fs.readFileSync(path.resolve('public/art',name))));
 const base='http://127.0.0.1:'+server.address().port+prefix;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
 try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true});
 const page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#art')?.naturalWidth===1280);
 if(process.env.COVER_SCREENSHOT)await page.screenshot({path:process.env.COVER_SCREENSHOT});
 for(const [nation,mode,map] of [[1,'lord','darkwood'],[0,'sandbox','gorge'],[0,'lord','twin'],[1,'sandbox','darkwood']]){
    await page.click('#nation'+nation);await page.selectOption('#maps',map);await page.click('#'+mode);await page.click('#menu');await page.click('#save');
    const snap=await page.evaluate(()=>JSON.parse(localStorage.getItem('napoleon-5.2')).world);
    assert.deepEqual([snap.player,snap.mode,snap.map],[nation,mode,map]);
    if(mode==='sandbox'){await page.click('#codex');assert.equal(await page.locator('#entries img').count(),15);await page.click('#closeBook');
       await page.click('#cat0');assert.equal(await page.locator('[data-kind]').count(),3);await page.click('[data-kind="line_infantry"]');await page.locator('.unitCard>button:last-child').first().click();
       await page.click('#group');await page.getByRole('button',{name:'空心方阵',exact:true}).click();await page.click('#save');await page.click('#restore');}
    await page.click('#back');
 }
 await page.setViewportSize({width:390,height:844});await page.click('#lord');
 const cdp=await ctx.newCDPSession(page);const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id}))});
 const camera=()=>page.locator('#world').getAttribute('data-camera').then(v=>v.split(',').map(Number));
 await page.waitForTimeout(300);const initial=await camera();
 await touch('touchStart',[[80,350,1]]);await touch('touchMove',[[135,385,1]]);await touch('touchEnd',[]);await page.waitForTimeout(220);const pan=await camera();
 assert.notEqual(pan[0],initial[0]);await page.waitForTimeout(950);
 const before=await camera();await touch('touchStart',[[125,370,1],[205,370,2]]);await touch('touchMove',[[95,390,1],[255,390,2]]);await touch('touchEnd',[]);
 await page.waitForTimeout(300);const after=await camera();assert.ok(Math.abs(after[2]/before[2]-2)<.03);
 for(const [a,b,i,o] of [[165,175,0,195],[370,390,1,422]])assert.ok(Math.abs(before[i]+(a-o)/before[2]-after[i]-(b-o)/after[2])<3,'pinch anchor');
 await page.click('#menu');await page.click('#back');await page.selectOption('#maps','twin');await page.click('#sandbox');
 await page.click('#menu');await page.click('#bridge');await page.waitForTimeout(200);await page.click('#menu');await page.click('#save');
 const bridgeSave=await page.evaluate(()=>JSON.parse(localStorage.getItem('napoleon-5.2')).world);
 assert.ok(bridgeSave.structures.some(s=>s.type==='pontoon'&&s.hp>0),'mobile one-tap crossing');
 // Load a late-battle checkpoint through the normal UI and run the last shell to impact.
 await page.evaluate(()=>{
    const key='napoleon-5.2',save=JSON.parse(localStorage.getItem(key)),s=save.world;
    const fort=s.structures.find(t=>t.type==='keep'&&t.faction!==s.player);fort.hp=1;
    s.projectiles.push({id:s.next++,kind:'stone',source:'howitzer',faction:s.player,x:fort.x,y:fort.y,z:1,vx:0,vy:0,vz:-1,gravity:.32,damage:100,remaining:1,bounces:0,target:fort.id,hit:[]});
    localStorage.setItem(key,JSON.stringify(save));
 });
 await page.click('#restore');await page.click('#pause');await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('征战胜利'));
 await page.click('#back');
 const g=await build({entryPoints:['tests/ground.ts'],bundle:true,write:false,format:'iife',globalName:'GroundQA'});
 const fixture=await ctx.newPage();await fixture.goto(base);await fixture.addScriptTag({content:g.outputFiles[0].text});
 const pixels=await fixture.evaluate(()=>GroundQA.pixelTest());console.log(pixels);
 assert.equal(pixels.spriteCount,32);assert.equal(pixels.portraitCount,16);assert.equal(pixels.panErrors+pixels.zoomErrors+pixels.impactErrors,0);
 assert.deepEqual(errors,[]);assert.equal(new Set(requests.filter(u=>u.endsWith('.webp'))).size,26);assert.ok(requests.every(u=>u.startsWith(base)));
 const local=await browser.newContext({offline:true});const file=await local.newPage();
 file.on('pageerror',e=>errors.push(e.message));file.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await file.goto(pathToFileURL(path.resolve('dist/index.html')).href);await file.click('#sandbox');await file.click('#menu');await file.click('#codex');
 assert.equal(await file.locator('#entries img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth>0).length),15);
 await local.close();assert.deepEqual(errors,[]);console.log('PASS subpath deployment, 26 decoded images, four starts, all maps, 390x844 drag and anchored pinch, no console errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
