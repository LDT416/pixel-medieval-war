import {KINDS,strength} from '../sim/config';
import {createMap} from '../sim/maps';
import {assignSlots} from '../sim/strategy';
import type {Formation,Kind,Snapshot,Stat,StructureType,Unit} from '../sim/types';

const equivalents:Record<string,Kind>={
    musketeer:'line_infantry',shieldman:'line_infantry',halberdier:'line_infantry',zweihander:'highlander',
    plate_knight:'guard_grenadier',bannerman:'line_infantry',guard:'guard_grenadier',
    heavy_lancer:'cuirassier',scout_cavalry:'hussar',davinci_tank:'rocket_crew',siege_mortar:'howitzer',organ_gun:'horse_artillery'
};
export const currentKind=(old:string):Kind=>equivalents[old]??(KINDS.includes(old as Kind)?old as Kind:'line_infantry');
export function upgradeLegacy(s:Snapshot){
    const aliases:Record<string,StructureType>={siege_workshop:'foundry',abbey:'academy',outpost:'redoubt'};
    const formations:Record<string,Formation>={phalanx:'square',skirmish:'crescent'};
    for(const t of s.structures){
        t.type=aliases[t.type]??t.type;
        for(const item of t.queue??[])item.kind=currentKind(item.kind);
    }
    const previousGroups=new Map(s.groups.map(g=>[g.id,g]));
    const companies=new Map<string,Unit[]>();
    for(const u of s.units){
        u.kind=currentKind(u.kind);u.lastKind=currentKind(u.lastKind);u.faceLock=0;u.pose='march1';
        u.formation=formations[u.formation]??u.formation;delete u.escort;delete u.leader;
        const key=[u.group,u.kind,u.tower].join('/');
        const a=companies.get(key)??[];a.push(u);companies.set(key,a);
    }
    s.groups=[];
    for(const a of companies.values()){
        const g=previousGroups.get(a[0].group);if(!g)throw Error('存档缺少编制');
        for(let i=0;i<a.length;i+=strength[a[0].kind]){
            const part=a.slice(i,i+strength[a[0].kind]),group={...g,id:s.next++,peak:part.length};
            assignSlots(group,part);s.groups.push(group);
        }
    }
    for(const p of s.projectiles)p.source=currentKind(p.source);
    for(const fire of s.fires??[])fire.kind=currentKind(fire.kind);
    for(const r of s.realms??[])r.grape=false;
    s.stats=s.stats.map(row=>{
        const result=Object.fromEntries(KINDS.map(k=>[k,{kills:0,damage:0}])) as Record<Kind,Stat>;
        for(const [old,v] of Object.entries(row)){const total=result[currentKind(old)];total.kills+=v.kills;total.damage+=v.damage;}
        return result;
    });
    // Keep modified ground, built structures and cleared forest paths in a saved battle.
    for(const t of s.structures.filter(t=>t.type==='tree')){
        const n=t.id*37%100;t.treeArt=n<55?'oak':n<80?'beech':n<92?'spruce':'bush';t.scale=.75+(t.id*17%31)/50;t.flip=t.id%2===0;
    }
    for(const t of createMap(s.map).filter(t=>['farmhouse','windmill'].includes(t.type))){
        if(s.structures.some(n=>n.type===t.type))continue;
        s.structures.push({...t,id:s.next++});
    }
    return s;
}
