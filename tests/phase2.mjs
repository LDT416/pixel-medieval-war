import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/sim/world'; export * from './src/sim/maps';",resolveDir:process.cwd()},platform:'node',format:'esm',bundle:true,write:false});
const {SimWorld,createMap,water,WIDTH,HEIGHT,CELL}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.deepEqual(createMap(),[]); assert.equal(WIDTH,4400);assert.equal(HEIGHT,2400);
for(let x=0;x<WIDTH;x+=CELL)for(let y=0;y<HEIGHT;y+=CELL)assert.equal(water(x,y),false);
const world=new SimWorld();
assert.equal(world.scale,1200);
for(const scale of [600,1200,1800]){
    world.reset(scale);assert.deepEqual(world.alive,[scale/2,scale/2]);
    for(const f of [0,1]){
        const side=world.units.filter(u=>u.faction===f);
        for(const [kind,fraction] of Object.entries({line_infantry:.55,guard_grenadier:.20,cuirassier:.18,bannerman:.04,field_cannon:.03})){
            assert.equal(side.filter(u=>u.kind===kind).length,Math.round(scale/2*fraction));
        }
    }
    function battle(){
        let explosive=0,moved=false, hits=0, elapsed=0;
        const times=[];
        while(world.winner===null && world.tick<9000){
            const start=performance.now(); world.step(); const ms=performance.now()-start;
            elapsed+=ms; times.push(ms);
            for(const e of world.events){if(e.type==='death' && e.explosive)explosive++;if(e.type==='hit')hits++;}
            for(const u of world.units){
                assert.ok(Number.isFinite(u.x+u.y+u.vx+u.vy) && u.x>=0 && u.x<WIDTH && u.y>=0 && u.y<HEIGHT);
                moved ||= u.moving && Math.abs(u.vx)+Math.abs(u.vy)>0;
            }
        }
        assert.ok(world.winner===0 || world.winner===1);assert.equal(world.alive[1-world.winner],0);
        assert.ok(world.alive[world.winner]>0 && moved && explosive>0 && hits>0);
        assert.equal(world.dead[0]+world.dead[1]+world.alive[0]+world.alive[1],scale);
        times.sort((a,b)=>a-b);
        const p99=times[Math.floor(times.length*.99)];
        if(scale===1800) assert.ok(p99<8,'1800-unit tick p99 exceeded 8 ms');
        assert.equal(world.rounds.length,0);
        console.log(scale+' troops, '+world.tick+' ticks, '+explosive+' explosive deaths, avg '+(elapsed/world.tick).toFixed(2)+'ms, p99 '+times[Math.floor(times.length*.99)].toFixed(2)+'ms');
        return [world.tick,world.winner,...world.dead,explosive,hits,...world.units.map(u=>[u.hp,u.x,u.y])];
    }
    const expected=battle();
    if(scale<=1200){world.reset(scale);assert.deepEqual(battle(),expected);}
}
console.log('Meadow battle assertions passed.');
