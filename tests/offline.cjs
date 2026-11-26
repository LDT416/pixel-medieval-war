const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {build}=require('esbuild'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
 try{
 const ctx=await browser.newContext({offline:true,viewport:{width:1440,height:900},hasTouch:true});
 const page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await page.waitForFunction(()=>document.querySelector('#art')?.width===640);
 if(process.env.COVER_SCREENSHOT)await page.screenshot({path:process.env.COVER_SCREENSHOT});
 for(const [nation,mode,map] of [[1,'lord','darkwood'],[0,'sandbox','gorge'],[0,'lord','twin'],[1,'sandbox','darkwood']]){
    await page.click('#nation'+nation);await page.selectOption('#maps',map);await page.click('#'+mode);await page.click('#menu');await page.click('#save');
    const snap=await page.evaluate(()=>JSON.parse(localStorage.getItem('gothic-v4')).world);
    assert.deepEqual([snap.player,snap.mode,snap.map],[nation,mode,map]);
    if(mode==='sandbox'){await page.click('#cat1');assert.equal(await page.locator('[data-kind]').count(),5);await page.click('[data-kind="musketeer"]');}
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
 await page.click('#menu');await page.click('#back');
 const g=await build({entryPoints:['tests/ground.ts'],bundle:true,write:false,format:'iife',globalName:'GroundQA'});
 const fixture=await ctx.newPage();await fixture.addScriptTag({content:g.outputFiles[0].text});
 const pixels=await fixture.evaluate(()=>GroundQA.pixelTest());console.log(pixels);
 assert.equal(pixels.spriteCount,36);assert.equal(pixels.portraitCount,36);assert.equal(pixels.panErrors+pixels.zoomErrors+pixels.impactErrors,0);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('PASS offline four starts, all maps, 390x844 drag and anchored pinch, no console errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
