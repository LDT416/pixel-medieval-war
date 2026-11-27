import type {Company} from '../arenaTypes';
import {guard,lineTroop} from './abilities';

export function supportOptions(c:Company,canRotate:boolean){
    const infantry=lineTroop(c)||guard(c);
    const stock=c.ammo/Math.max(1,c.alive*40);
    const fatigue=c.fatigue;
    const shortage=infantry?Math.max(0,1-stock):0;
    return [
        {action:'rotate',label:'申请换班',score:canRotate&&infantry&&c.line===0?Math.max(shortage*.90,fatigue*.74,(1-c.morale/Math.max(1,c.base))*.86):0},
        {action:'recover',label:'原地恢复',score:c.order==='hold'||c.order==='reserve'?fatigue*.68:0},
        {action:'continue',label:'维持当前命令',score:.55}
    ].sort((a,b)=>b.score-a.score);
}
