import type { Formation, Faction } from './types';
export function slotOffset(slot:number,count:number,form:Formation,f:Faction,gap=16){
    const direction=f?-1:1;
    if(form==='square' && count>=8){
        const side=Math.floor(slot*4/count), first=Math.ceil(side*count/4), size=Math.ceil((side+1)*count/4)-first;
        const half=Math.ceil(count/4)*gap/2, tangent=((slot-first)/size*2-1)*half;
        return {x:[half,-tangent,-half,tangent][side]*direction,y:[tangent,half,-tangent,-half][side]};
    }
    const ranks=Math.min(count,form==='melee'?7:3), files=Math.ceil(count/ranks);
    const row=Math.floor(slot/files), file=slot%files, offset=(file-(files-1)/2)*gap;
    const bow=form==='crescent'?(1-Math.sqrt(Math.max(0,1-(file/Math.max(1,files-1)*2-1)**2)))*files*gap*.38:0;
    return {x:((ranks/2-.5-row)*gap+bow)*direction,y:offset};
}
