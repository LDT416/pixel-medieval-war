import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ server: {middlewareMode:true}, appType:'custom' });
try {
    const load = path => vite.ssrLoadModule('/src/sim/'+path+'.ts');
    const {SimWorld}=await load('world'), {MAPS,WIDTH,HEIGHT}=await load('maps');
    const {UNITS,KINDS}=await load('config'), {BUILDINGS,ROSTER}=await load('buildings');
    const {attack,updateProjectiles,hit}=await load('combat'), {ignite}=await load('environment');
    const {lordCommands}=await load('aiDirector');
    const {supportTick}=await load('environment'),{work}=await load('economy');
    function command(w,type,payload,faction=0){return w.step([{tick:w.tick,type,payload,faction}],false);}
    function start(mode='lord',map='twin',difficulty='normal'){
        const w=new SimWorld(4);
        command(w,'scenario',{index:mode==='lord'?0:4,map,mode,difficulty});return w;
    }
    const run=(w,ticks)=>{for(let i=0;i<ticks;i++)w.step([]);};
    function place(w,kind,count,p,faction=0) {
        const before=w.next;
        command(w,'spawn',{kind,count,...p,formation:'line'},faction);
        return w.units.filter(u=>u.id>=before);
    }
    const stage={x:1450,y:820};
    assert.equal(KINDS.length,26);
    assert.equal(WIDTH,3840);assert.equal(HEIGHT,2160);
    const sandbox=start('sandbox');
    for(const kind of KINDS){
        const [u]=place(sandbox,kind,1,stage);
        assert.equal(u.kind,kind);assert.ok(UNITS[kind].detail.length>=16);assert.ok(ROSTER[kind]);
    }
    for(const map of Object.keys(MAPS)){
        const lord=start('lord',map), free=start('sandbox',map);
        assert.deepEqual(lord.grid.terrain,free.grid.terrain);
        assert.equal(lord.units.filter(u=>u.kind==='peasant').length,8);
        assert.equal(lord.structures.filter(s=>s.type==='mine').length,map==='isles'?7:4);
        const crossings=lord.structures.filter(s=>s.type==='bridge'||s.type==='pontoon').length;
        assert.equal(crossings,{twin:2,bottleneck:1,isles:6,darkwood:0,gorge:0}[map]);
        run(lord,360);
        assert.ok(lord.structures.some(s=>s.faction===1&&s.type==='barracks'));
        console.log(MAPS[map], '双模式通过；初始桥',crossings,'浅滩格',lord.grid.shallows.reduce((a,b)=>a+b,0),'树木',free.structures.filter(s=>s.type==='tree').length);
    }
    const w=start(), base=w.keep(0);
    assert.deepEqual([w.realms[0].wood,w.realms[0].gold],[260,240]);
    command(w,'train',{kind:'war_elephant'});assert.equal(base.queue,undefined);
    const n=w.units.length;command(w,'spawn',{kind:'war_elephant',count:9,...stage,formation:'line'});assert.equal(w.units.length,n);
    command(w,'train',{kind:'sapper'});assert.deepEqual([w.realms[0].wood,w.realms[0].gold],[245,200]);
    run(w,90);assert.ok(w.units.some(u=>u.kind==='sapper'&&u.faction===0));
    const forks=start();command(forks,'restore',{state:w.snapshot()});
    run(w,190);run(forks,190);assert.deepEqual(w.snapshot(),forks.snapshot());
    const treasury=w.realms[0];treasury.gold=10000;treasury.wood=10000;
    for(const type of ['barracks','range','stables','abbey','siege_workshop']){
        let point;
        for(let i=0;i<160&&!point;i++){
            const p={x:450+i%12*56,y:635+Math.floor(i/12)*58};
            if(w.blueprint(type,p,0).valid)point=p;
        }
        assert.ok(point);command(w,'build',{kind:type,...point});
        let elapsed=0;while(!w.structures.some(s=>s.faction===0&&s.type===type&&!s.needed)&&elapsed++<1400)w.step([]);
        assert.ok(elapsed<1400,type+' 建造超时');
    }
    command(w,'age',stage);command(w,'age',stage);
    command(w,'research',{tech:'steel'});command(w,'research',{tech:'powder'});
    assert.equal(treasury.age,3);assert.ok(treasury.steel&&treasury.powder);
    for(const kind of KINDS) command(w,'train',{kind});
    command(w,'train',{kind:'guard'});assert.equal(w.structures.flatMap(s=>s.faction===0?s.queue??[]:[]).length,27);
    command(w,'rally',{x:720,y:800});run(w,1450);
    assert.equal(w.structures.flatMap(s=>s.faction===0?s.queue??[]:[]).length,0);
    assert.ok(w.units.filter(u=>u.escort==='horn'&&u.faction===0).length>=2);
    console.log('26 种沙盒部署、26 种 RTS 扣费排队、5 座设施建设、时代、双科技、仪仗队和中途存档续跑通过');
    for(const [kind,count] of [['hwacha',14],['blunderbuss',7],['ballista',1]]){
        const arena=start('sandbox'),[u]=place(arena,kind,1,stage);
        const targets=place(arena,'plate_knight',10,{x:stage.x+70,y:stage.y},1);
        targets.forEach((t,i)=>{t.x=u.x+60+i*22;t.y=u.y;});
        arena.hash.rebuild(arena.units);attack(arena,u,targets[0]);
        assert.equal(arena.projectiles.length,count);
        for(let i=0;i<60;i++)updateProjectiles(arena);
        if(kind==='ballista')assert.equal(targets.filter(t=>t.hp<UNITS[t.kind].hp).length,8);
        if(kind==='hwacha')assert.ok(arena.fires.length>0);
    }
    const fire=start('sandbox','darkwood');const tree=fire.structures.find(s=>s.type==='tree');
    ignite(fire,tree,0,'fire_bomber');run(fire,160);assert.equal(tree.hp,0);
    console.log('七弹丸、十四支火箭、八体贯穿、树木烧毁通过');
    // Dedicated fixtures isolate traits that seldom occur together in an opening battle.
    const drill=start('sandbox'), [bearer]=place(drill,'bannerman',1,stage);
    const [axe]=place(drill,'berserker',1,stage), [victim]=place(drill,'war_elephant',1,{x:stage.x+18,y:stage.y},1);
    drill.hash.rebuild(drill.units);drill.tick=(10-bearer.id%10)%10;
    supportTick(drill,bearer);assert.ok(axe.auraUntil>=drill.tick);
    attack(drill,axe,victim);assert.equal(axe.cooldown,UNITS.berserker.reload/1.2);
    axe.hp=1;attack(drill,axe,victim);assert.ok(axe.cooldown<UNITS.berserker.reload/2);
    const [monk]=place(drill,'monk',1,stage);drill.hash.rebuild(drill.units);
    drill.tick=(53-monk.id%53)%53;supportTick(drill,monk);assert.ok(axe.hp>1);
    const [sword]=place(drill,'zweihander',1,stage), row=place(drill,'shieldman',6,stage,1);
    victim.x+=300;row.forEach((u,i)=>{u.x=sword.x+16;u.y=sword.y+2*i;});drill.hash.rebuild(drill.units);
    attack(drill,sword,row[0]);assert.equal(row.filter(u=>u.hp<UNITS.shieldman.hp).length,4);
    const [pike]=place(drill,'pikeman',1,stage);victim.charge=50;const hp=victim.hp;
    hit(drill,victim,0,'pikeman',10,1,0);assert.equal(victim.charge,0);
    assert.ok(Math.abs(hp-victim.hp-22*(1-UNITS.war_elephant.armor*(1-UNITS.pikeman.penetration)))<1e-8);
    const [ram]=place(drill,'battering_ram',1,stage);const ramHP=ram.hp;
    hit(drill,ram,1,'bowman',100,-1,0,0,true);
    assert.ok(Math.abs(ramHP-ram.hp-20*(1-UNITS.battering_ram.armor*(1-UNITS.bowman.penetration)))<1e-8);
    const [worker]=place(drill,'peasant',1,stage),[engineer]=place(drill,'sapper',1,stage);
    const keep=drill.keep(0);keep.needed=100;keep.work=0;
    for(const u of [worker,engineer]){u.job=keep.id;u.x=keep.x-keep.w/2-4;u.y=keep.y;work(drill,u);}
    assert.equal(keep.work,3.5);
    const bridge=drill.structures.find(s=>s.type==='bridge');
    engineer.x=bridge.x-bridge.w/2+2;engineer.y=bridge.y;
    attack(drill,engineer,bridge);assert.equal(drill.barrels.length,1);assert.equal(drill.barrels[0].due,drill.tick+50);
    const bhp=bridge.hp;run(drill,52);assert.ok(bridge.hp<bhp);
    const [carrier]=place(drill,'peasant',1,stage,1);carrier.cargo=34;carrier.resource='wood';
    hit(drill,carrier,0,'militia',500,1,0);assert.equal(drill.drops.at(-1).amount,17);assert.equal(drill.realms[0].farmersKilled,1);
    const field=start('sandbox');let built=0;
    for(let i=0;i<180&&built<5;i++){const p={x:420+i%14*66,y:505+Math.floor(i/14)*62};if(field.blueprint('outpost',p,0).valid){command(field,'build',{kind:'outpost',...p});built++;}}
    assert.equal(built,4);const tower=field.structures.find(s=>s.type==='outpost'),garrison=field.units.filter(u=>u.tower===tower.id);
    assert.equal(garrison.length,2);
    field.damageStructure(tower,tower.hp,1,'catapult');run(field,90);
    assert.ok(garrison.every(u=>!field.byUnit.has(u.id)));
    console.log('仪仗光环、低血狂暴、军医、四体顺劈、反骑打断、冲城车抵箭、工兵工速与引信、资源掉落、四塔上限与驻军坠亡通过');
    const campaigns=[...['easy','normal','brutal'].map(d=>['twin',d]),...Object.keys(MAPS).filter(m=>m!=='twin').map(m=>[m,'normal'])];
    for(const [map,difficulty] of campaigns){
        const ai=start('lord',map,difficulty);
        const sites=new Set(),trained=new Set();let maxFarm=0;
        for(let i=0;i<16000&&ai.winner===null;i++){
            for(const c of lordCommands(ai))assert.equal(c.faction,1);
            ai.step([]);
            if(i%30===0){for(const s of ai.structures)if(s.faction===1&&s.hp>0&&!s.needed)sites.add(s.type);
                for(const u of ai.units)if(u.faction===1)trained.add(u.kind);
                maxFarm=Math.max(maxFarm,ai.units.filter(u=>u.kind==='peasant'&&u.faction===1).length);}
        }
        assert.ok(['barracks','range','stables','abbey','siege_workshop','palisade','outpost'].every(type=>sites.has(type)));assert.equal(ai.realms[1].age,3);assert.equal(maxFarm,{easy:6,normal:10,brutal:14}[difficulty]);assert.equal(ai.winner,1);
        console.log(MAPS[map],difficulty,'tick',ai.tick,'T'+ai.realms[1].age,'双科技',[ai.realms[1].steel,ai.realms[1].powder],'农夫峰值',maxFarm,'已建',Array.from(sites).join(','),'兵种',Array.from(trained).join(','),'胜方',ai.winner);
    }
} finally {await vite.close();}
