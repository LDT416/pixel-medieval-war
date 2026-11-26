import { riverX } from './maps';
import type { SimWorld } from './world';
import type { Command, Kind } from './types';
import { capacity, UNITS } from './config';
export function lordCommands(w: SimWorld): Command[] {
    const f = w.player === 0 ? 1 : 0, r = w.realms[f], interval = { easy: 55, normal: 34, brutal: 22 }[w.difficulty];
    if (w.mode !== 'lord' || w.tick % interval)
        return [];
    const home = w.keep(f);
    if (!home)
        return [];
    if (w.map === 'twin' && !w.structures.some(s => (s.type === 'pontoon' || s.type === 'bridge') && s.hp > 0) && r.wood >= 70) {
        const y = 880;
        return [{ tick: w.tick, faction: f, type: 'build', payload: { kind: 'pontoon', x: riverX(y), y } }];
    }
    const workers = w.units.filter(u => u.faction === f && u.kind === 'peasant').length;
    if (workers >= capacity[r.age] && r.age < 4 && r.wood >= 80 * r.age && r.gold > 75 * r.age + 80)
        return [{ tick: w.tick, faction: f, type: 'cottage', payload: {} }];
    const step = Math.floor(w.tick / interval);
    if (step % 7 === 2 && !w.structures.some(s => s.faction === f && s.type === 'foundry' && s.hp > 0) && r.wood > 220)
        return [{ tick: w.tick, faction: f, type: 'build', payload: { kind: 'foundry', x: home.x, y: home.y + 285 } }];
    const facility=step%8===3?'barracks':'academy';
    if(step%8>=3&&r.age>=2&&!w.structures.some(s=>s.type===facility&&s.faction===f&&s.hp>0))
        for(let i=0;i<24;i++){const p={x:home.x+(i%6-2)*112,y:home.y+230+Math.floor(i/6)*94};
            if(w.blueprint(facility,p,f).valid)return [{tick:w.tick,faction:f,type:'build',payload:{kind:facility,...p}}];}
    if(step%8===6&&r.age>=2&&w.structures.some(s=>s.faction===f&&s.type==='academy'&&!s.needed)){
        const tech=(['powder','steel','grape'] as const).find(t=>!r[t]);if(tech)return [{tick:w.tick,faction:f,type:'research',payload:{tech}}];}
    const foes = w.units.filter(u => u.faction !== f && !u.tower);
    const guns = foes.filter(u => UNITS[u.kind].role === '火枪').length, armor = foes.filter(u => UNITS[u.kind].armor > .35).length;
    let options: Kind[] = guns > armor ? ['cuirassier', 'hussar', 'line_infantry', 'guard_grenadier', 'dragoon'] : ['rifleman', 'line_infantry', 'volley_gunner', 'field_cannon', 'howitzer'];
    if (step % 2 === 0)
        options = ['line_infantry', 'line_infantry', 'rifleman', 'guard_grenadier', 'rocket_crew'];
    const canBuild = w.structures.some(s => s.type === 'foundry' && s.faction === f && s.hp > 0 && !s.needed);
    options = options.filter(k => UNITS[k].role !== '重炮机械' || canBuild);
    const kind = workers < capacity[r.age] && step % 4 === 1 ? 'peasant' : options[w.rng.int(0, options.length - 1)];
    return [{ tick: w.tick, faction: f, type: 'train', payload: { kind } }];
}
