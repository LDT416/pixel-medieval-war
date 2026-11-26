import assert from 'node:assert/strict';
import {upgradeLegacy} from '../src/client/legacySave';
import {SimWorld} from '../src/sim/world';

// Exercise the saved roster, orders and accounting using the names serialized by v4.
const source=new SimWorld(),old=source.snapshot(),home=old.structures.find(s=>s.type==='keep')!;
const man=old.units.find(u=>u.kind==='line_infantry')!;
Object.assign(man,{kind:'musketeer',lastKind:'halberdier',formation:'phalanx',escort:'guard'});
Object.assign(home,{queue:[{kind:'siege_mortar',progress:1,total:18}]});
Object.assign(old.stats[0],{musketeer:{kills:7,damage:320}});
old.structures=old.structures.filter(s=>!['farmhouse','windmill'].includes(s.type));
const restored=new SimWorld();restored.restore(upgradeLegacy(old));
assert.equal(restored.byUnit.get(man.id)?.formation,'square');
assert.equal(restored.byUnit.get(man.id)?.kind,'line_infantry');
assert.equal(restored.byUnit.get(man.id)?.lastKind,'line_infantry');
assert.equal(restored.byStructure.get(home.id)?.queue?.[0].kind,'howitzer');
assert.equal(restored.stats[0].line_infantry.kills,7);
assert.ok(restored.structures.some(s=>s.type==='windmill'));
restored.step([]);
console.log('PASS v4 save roster, formation, production and statistics migration');
