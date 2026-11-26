// Optional browser runner. Pass a Playwright module path when it is installed outside the project.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
    const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
    try{
        const context=await browser.newContext({offline:true,viewport:{width:1440,height:900}});
        const page=await context.newPage(), faults=[], requests=[];
        page.on('pageerror',e=>faults.push(e.message));
        page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
        await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
        const act=id=>page.locator('[data-act="'+id+'"]').first().click();
        await page.waitForFunction(()=>Number(document.querySelector('#dead')?.textContent?.replaceAll(',',''))>0);
        await act('pause');
        const count=await page.locator('#brushes canvas').count();assert.equal(count,26);
        assert.equal(await page.locator('#brushes canvas').evaluateAll(cs=>new Set(cs.map(c=>c.toDataURL())).size),26);
        await act('codex');
        await page.selectOption('#book-filter','5');
        assert.equal(await page.locator('.codex-list button').count(),5);
        await act('entry-hwacha');assert.equal(await page.locator('.codex-card h2').innerText(),'多管火箭车');
        await act('close');
        await act('save');
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-siege-deployment-v1')));
        assert.ok(saved.marks.length>0);assert.ok(saved.units.length>500);
        await act('restore');await act('save');
        const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-siege-deployment-v1')));
        assert.deepEqual(restored.marks,saved.marks);assert.deepEqual(restored.particles,saved.particles);
        await page.selectOption('#scenario','4');
        for(const mode of ['sandbox','lord']){
            await act(mode);
            for(const map of ['twin','bottleneck','isles','darkwood','gorge']){
                await page.selectOption('#map-choice',map);
                await act('save');
                const info=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('blood-siege-deployment-v1'));return [s.mode,s.map,s.structures.filter(t=>t.type==='keep').length]});
                assert.deepEqual(info,[mode,map,2]);
            }
        }
        await page.selectOption('#difficulty','brutal');
        await act('unit-peasant');await act('save');
        const lord=await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-siege-deployment-v1')));
        assert.equal(lord.difficulty,'brutal');
        assert.ok(lord.structures.find(s=>s.type==='keep'&&s.faction===0).queue.some(q=>q.kind==='peasant'));
        await act('sandbox');await page.selectOption('#map-choice','twin');await page.selectOption('#scenario','0');
        if(process.env.BATTLE_SCREENSHOT) await page.screenshot({path:process.env.BATTLE_SCREENSHOT});
        await page.waitForTimeout(3000);
        console.log('默认战场帧率采样',await page.locator('#fps').innerText());
        await act('pause');
        const harness=await require('esbuild').build({entryPoints:['tests/ground.ts'],platform:'browser',format:'iife',globalName:'GroundQA',bundle:true,write:false});
        const fixture=await context.newPage();
        await fixture.addScriptTag({content:harness.outputFiles[0].text});
        const pixels=await fixture.evaluate(()=>GroundQA.pixelTest());
        console.log('地表像素回归',pixels);
        assert.equal(pixels.spriteCount,52);assert.equal(pixels.flagFrames,6);
        assert.equal(pixels.panErrors,0);assert.equal(pixels.zoomErrors,0);assert.equal(pixels.impactErrors,0);
        assert.deepEqual(faults,[]);assert.deepEqual(requests,[]);
        console.log('离线 file:// 通过。26 张立绘各异，图鉴筛选、双模式五图、征召、存档贴图与空中粒子往返一致。网络请求及页面异常均为零。');
    }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
