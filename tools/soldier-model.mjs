// 原创模型，以像素为长度单位。局部 +X 为身体正面，+Z 为近侧。
import * as T from 'three';

export const roles={
    line_infantry:[0,1,2,3],guard_grenadier:[0,1,3],cuirassier:[0,1,2,3,4,5],
    bannerman:[0,1,2],field_cannon:[0,1,3]
};
export const motions={stand:4,march:8,run:8,aim:2,load:8,thrust:6,recoil:8,die:6,flee:8,kneel:4,kneelLoad:8};
export const labels={
    line_infantry:[['燧发枪兵','掷弹兵','轻步兵','步兵军官'],['红衫线列兵','轻步兵','高地团','步兵军官']],
    guard_grenadier:[['熊皮帽近卫','近卫猎兵','','近卫军官'],['近卫步兵','来复枪兵','','近卫军官']],
    cuirassier:[['胸甲骑兵','卡宾枪骑兵','枪骑兵','骑兵军官','总司令','参谋'],['龙骑兵','近卫骑兵','轻骑兵','骑兵军官','总司令','参谋']],
    bannerman:[['军旗','鼓手','营旗'],['国王旗','鼓手','团旗']],
    field_cannon:[['徒步炮组','骑炮组','','炮组军官'],['皇家炮组','骑炮组','','炮组军官']]
};
const palettes=[
    ['20252b','34373c','514941','81766a','a69a83','cad0bf','f8eed1','693d38','a8644d','dc9470','f2c49a','17293b','233f62','365d84','6688a4','5e2930','a53b38','e45a42','604423','ac743b','d9ae5b','ffe39a','285347','54835c','9dac70','47545d','8196a0','c2d0cc','4e362e','87543b','b77e54','ead8ad'],
    ['22252a','34373b','51483e','817567','ada391','d2d3bd','fbefd3','683c37','a85f4a','db9672','f4c39b','172c3e','23445a','3b6073','71919a','702c34','ae3d40','df5c48','644526','a7793f','d9af60','ffe59c','244b40','50805c','9bac78','47545f','8296a3','c7d2cf','50392e','86573f','b7835b','ecd8ad']
];
export const palette=f=>palettes[f].map(s=>parseInt(s,16));
// 以有限色阶绘制制服和装备，保留暗部、中间色及受光面。
const shades={
    ink:[0,1,2],hair:[28,2,29],skin:[8,9,10],cream:[4,5,6],navy:[11,12,13],blue:[12,13,14],
    red:[15,16,17],green:[22,23,24],gold:[19,20,21],steel:[25,26,27],wood:[28,29,30],
    leather:[2,28,29],white:[4,5,6],black:[0,1,3],ochre:[18,19,20],gray:[3,4,5]
};
const geometries={
    box:new T.BoxGeometry(), oval:new T.SphereGeometry(1,8,6),
    cylinder:new T.CylinderGeometry(1,1,1,10),taper:new T.CylinderGeometry(.80,1,1,8),
    cone:new T.ConeGeometry(1,1,7)
};
const up=new T.Vector3(0,1,0);
function parts(){
    const meshes=[];
    function make(type,paint,x,y,z,w,h,d){
        const o=new T.Object3D();o.position.set(x,y,z);o.scale.set(w,h,d);
        meshes.push({geometry:geometries[type],paint:shades[paint],o});return o;
    }
    function box(c,x,y,z,w,h,d){return make('box',c,x,y,z,w,h,d);}
    function oval(c,x,y,z,w,h,d){return make('oval',c,x,y,z,w,h,d);}
    function cyl(c,x,y,z,rx,h,rz,taper=false){return make(taper?'taper':'cylinder',c,x,y,z,rx,h,rz);}
    function rod(c,a,b,rad,flat=1){
        const delta=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
        const o=cyl(c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,rad,delta.length(),rad*flat);
        o.quaternion.setFromUnitVectors(up,delta.normalize());return o;
    }
    return {meshes,box,oval,cyl,rod};
}
function uniform(f,k,r){
    if(r===4)return 'gray';
    if(k==='field_cannon')return 'navy';
    if(k==='bannerman'&&r===1&&!f)return 'red';
    if(k==='guard_grenadier'&&r===1)return 'green';
    return f?'red':'blue';
}
function hat(m,f,k,r,x,y,z){
    const {box,cyl,oval,rod}=m;
    const officer=r===3||r===4||r===5;
    if(officer){
        oval('black',x,y+1,z,4.8,1.4,3.2);
        oval('black',x,y+2.4,z,3.5,2.2,1.8);
        rod('gold',[x-3.6,y+1,z+1.6],[x+.5,y+2.7,z+1.6],.42);
        oval('red',x+.7,y+2.6,z+2,1,.9,.48);return;
    }
    const bear=(k==='guard_grenadier'&&!(f&&r===1))||(f&&k==='line_infantry'&&r===2);
    if(bear){
        oval('black',x-.4,y+3.7,z,3.2,5.1,2.9);
        cyl('gold',x+.6,y+.6,z,2.88,.8,2.76);
        oval(f?'cream':'red',x-.3,y+4,z+2.5,.9,2.8,.7);return;
    }
    if(k==='cuirassier' && r<=1){
        oval(r===1?'gold':'steel',x,y+1.5,z,3.35,2.6,2.8);
        box('gold',x,y+3.4,z,3.9,1,.9);
        oval('black',x-2.4,y+1.1,z,1.3,3.4,.96);return;
    }
    if(!f && k==='cuirassier'&&r===2){
        cyl('black',x,y+1.3,z,2.9,3.2,2.5);
        box('red',x-.4,y+3.65,z,6,1.3,5.6).rotation.y=Math.PI/4;return;
    }
    cyl('black',x,y+2,z,2.9,4.75,2.6,true);
    box('black',x+2.5,y,z,3.5,.75,4.8);
    cyl('gold',x,y+.3,z,2.95,.65,2.64);
    box('gold',x+2.48,y+1.8,z,1,1.6,1.2);
    oval(r===2?'green':r===1&&!f?'red':'cream',x-.4,y+4.9,z+1.7,1,1.9,.85);
}
function flag(m,f,regiment,x,y,z,phase){
    m.rod('wood',[x,y-10,z],[x,y+23,z],.54);
    m.oval('gold',x,y+23.7,z,1.3,1,.7);
    if(!f)m.box('gold',x,y+24,z,3.7,.7,.65);
    const W=12,H=8;
    for(let i=0;i<W;i++)for(let j=0;j<H;j++){
        let c=i<4?'blue':i<8?'cream':'red';
        if(f){
            const d=Math.min(Math.abs(i/(W-1)-j/(H-1)),Math.abs(1-i/(W-1)-j/(H-1)));
            c=d<.055?'red':d<.16?'cream':'navy';
            if(i===5||i===6||j===3||j===4)c='red';
            else if(i===4||i===7||j===2||j===5)c='cream';
            if(regiment && (i>5||j>3))c=i===8&&j>=3&&j<=6||j===5&&i>=7&&i<=9?'gold':'ochre';
        }
        if(!f && regiment && j===6)c='gold';
        // 布面沿长边扭转，近侧和背侧都能辨出国色。
        m.box(c,x-(i+.5)*.93,y+21-j+.5*Math.sin(i*.65+phase),z+Math.sin(i*.55+phase)*(i*.11),1.05,1.18,.62);
    }
}
function horse(m,f,r,phase,moving){
    const coat=r===4||f&&r===0?'gray':f&&r===1?'black':'wood';
    m.oval(coat,-1,13,0,10.9,4.45,3.6);
    m.oval(coat,6,17.4,0,3.7,7,2.8).rotation.z=-.4;
    m.oval(coat,10.2,21,0,4.35,2.6,2.15).rotation.z=-.35;
    for(const side of [-1,1]){
        m.oval('ink',11.3,22.45,side*1.79,.6,.6,.4);
        m.oval(coat,8.75,24.3,side*1.22,.72,1.55,.6);
        for(const fore of [-1,1]){
            const x=fore*6.6,z=side*2.2,step=moving?Math.sin(phase+(fore===side?0:Math.PI))*3.6:0;
            const lift=moving?Math.max(0,Math.cos(phase+(fore===side?0:Math.PI)))*2.9:0;
            const knee=[x+step*.45+lift*.38,6.7+lift,z],foot=[x+step,1+lift,z];
            m.rod(coat,[x,12,z],knee,1.2);m.rod(coat,knee,foot,.76);
            m.box('ink',foot[0]+.56,foot[1]-.4,z,2.35,1.15,1.55);
        }
        m.rod('leather',[4,17,side*2.6],[12,20,side*2.1],.40);
        m.box('navy',-1,14.1,side*3.15,7,3.2,.8);m.box('gold',-1,12.85,side*3.57,6.55,.55,.5);
    }
    m.rod('ink',[-10,15,0],[-13.4,8+Math.sin(phase),0],1.35);
    m.box('leather',-.5,17.1,0,6.8,1.6,6.3);
}
function human(m,f,k,r,a,fr,mounted=false){
    const period=motions[a],phase=fr*2*Math.PI/period,walk=['march','run','flee'].includes(a);
    const crouch=a==='kneel'||a==='kneelLoad',run=a==='run'||a==='flee',load=a==='load'||a==='kneelLoad';
    const lunge=a==='thrust'?[0,.24,.7,1,.56,.08][fr%6]:0;
    const lean=run?1.9:a==='aim'?1.2:lunge*2.1;
    const bob=walk?Math.abs(Math.sin(phase))*.75:a==='stand'?.34*Math.sin(phase):0;
    const bend=a==='kneel'?[.30,.59,.84,1][fr%4]:crouch?1:0;
    const hip=mounted?20:14-6.5*bend,dy=hip-14+bob;
    const coat=uniform(f,k,r), officer=r>=3,band=k==='bannerman',drum=band&&r===1;
    const trouser=k==='guard_grenadier'&&f&&r===1?'gray':'cream';
    for(const side of [-1,1]){
        const z=side*(mounted?3.5:2.05),sw=walk?Math.sin(phase+(side===1?0:Math.PI))*(run?5.8:3.85):side*.94;
        const lift=walk?Math.max(0,Math.cos(phase+(side===1?0:Math.PI)))*(run?3.5:2.2):0;
        const knee=mounted?[2,hip-3,z]:crouch?(side===1?[.6+4.2*bend,8-1.7*bend,z]:[.6-2.6*bend,8-6.2*bend,z]):[.58+sw*.45+lift*.55,8+bob+lift,z];
        const foot=mounted?[-.3,hip-8,z]:crouch?(side===1?[.9+4.6*bend,1.1,z]:[-.9-5.1*bend,1.1,z]):[sw,1.1+lift,z];
        m.rod(trouser,[0,hip,z],knee,1.72);m.rod(mounted?'black':trouser,knee,foot,1.16);
        m.box('black',foot[0]+.75,foot[1]-.25,z,3.45,1.75,2.35);
    }
    m.oval(coat,-.65+lean*.4,14.5+dy,0,2.8,3.7,3.6);
    m.box(coat,lean*.55,19.6+dy,0,6.7,9.7,7.8).rotation.z=-lean*.034;
    m.box('red',lean,24.25+dy,0,4.95,1.45,6.35);
    // 正背和两侧都有皮带、弹药包和翻领。
    for(const side of [-1,1]){
        m.rod('cream',[lean+1.25,24+dy,side*4.03],[-1.4,15.8+dy,side*4.03],.48);
        m.rod('cream',[lean-1.6,23.8+dy,side*4.03],[2.4,16.4+dy,side*4.03],.52);
        m.oval(officer?'gold':r===1?'red':coat,lean,23.45+dy,side*4.1,2.15,1.3,1.55);
    }
    for (const side of [-1,1])m.rod('cream',[lean*.55+3.46,23.95+dy,side*3.3],[lean*.55+3.46,16.1+dy,-side*2.7],.60);
    m.box('cream',.35,15.8+dy,0,6.9,1,7.9);
    if(!mounted&&!officer&&!band){
        m.box('leather',-3.55,19.3+dy,0,2.55,6.0,6.0);
        m.rod('gray',[-3.35,23+dy,-3.8],[-3.35,23+dy,3.8],1.18);
    }
    m.box('black',-2,15+dy,3.55,2.8,2.15,1.2);
    if(mounted && r<=1){m.oval(r===1?'gold':'steel',lean+1.65,20.45+dy,0,2.28,4,3.55);}
    if(r===4||r===5){m.box(r===4?'gray':'navy',-2.8,18.6+dy,0,2.15,11,7.95).rotation.z=-.23;}
    if(k==='line_infantry'&&f&&r===2){
        m.cyl('green',0,13.5+dy,0,3.3,5.5,4.4,true);
        for(const s of [-1,1])for(let i=-2;i<=2;i+=2)m.box('red',i,13.5+dy,s*3.92,.55,4,.45);
    }
    const hx=lean+.4,hy=27.2+dy;
    m.oval('hair',hx-.3,hy+.2,0,2.72,3.1,2.5);
    m.box('skin',hx+.80,hy,0,4.65,5.0,5.55);
    m.box('skin',hx+3,hy+.1,0,1.1,1.35,1.8);
    m.box('ink',hx+2.40,hy+1,2.77,1,.68,.55);
    m.box('hair',hx-.89,hy+1,2.74,1.25,2.3,.65);
    m.box('skin',hx+2.3,hy-1.2,2.8,1.2,1.1,.55);
    if(a!=='flee')hat(m,f,k,r,hx,hy+2.4,0);
    const weaponless=a==='flee';
    const high=load?Math.sin(phase)*2.5:0;
    let hands=[[3.9,18+dy,2.9],[3.2,17.1+dy,-2.8]];
    let butt=[.7,12+dy,2.85], muzzle=[8.5,30.5+dy,3.5];
    if(a==='aim'||a==='thrust'){
        const kick=a==='aim'?fr*1.5:0;
        butt=[-.8+lunge*2-kick,21.6+dy,2.1];muzzle=[15.55+lunge*2-kick,22.1+dy+(a==='thrust'?[-2,-.5,1,0,2.4,.8][fr%6]:0),2.1];
        hands=[[3.1+lunge-kick,21+dy,2.55],[8.5+lunge-kick,21.8+dy,1.1]];
    }else if(load){
        butt=[4.7,12+dy,2.5];muzzle=[5.1,29+dy,2.5];
        const reach=Math.cos(phase)*2.0;
        hands=[[4.9+reach,22.6+dy+high*1.8,2.5],[5.3-reach*.36,17+dy,1.4]];
        muzzle[0]+=reach*.65;
        m.rod('steel',[5.2+reach,21+dy+high,3.1],[5.3+reach,32+dy+high,3.1],.43);
    }else if(walk){
        hands[0][1]+=Math.sin(phase)*1.8;hands[1][0]+=Math.sin(phase)*2;
        muzzle[0]+=Math.sin(phase)*1.5;butt[0]+=Math.sin(phase)*1.5;
    }
    if(band&&!weaponless){
        if(drum){
            m.cyl('ochre',4.5,16.3+dy,0,3.9,4.5,3.8);
            for(const y of [14.1,18.55])m.cyl('cream',4.5,y+dy,0,4,.65,3.9);
            for(const side of [-1,1]){
                const beat=Math.sin(phase+side*1.55)*1.65;
                m.rod('cream',[2.3,14.2+dy,side*3],[4.3,18.2+dy,side*3.6],.48);
                m.rod('wood',[1.4,21+dy,side*3.8],[6.1,20.7+dy+beat,side*1.8],.48);
            }
        }else flag(m,f,r===2,3.4,18.8+dy,2.65,phase);
    }else if(!weaponless && (!mounted && !officer)){
        m.rod('wood',butt,muzzle,1.03);
        const start=[butt[0]*.72+muzzle[0]*.28,butt[1]*.72+muzzle[1]*.28+.62,muzzle[2]];
        m.rod('steel',start,muzzle,.66);
        const d=new T.Vector3(muzzle[0]-butt[0],muzzle[1]-butt[1],0).normalize();
        m.rod('cream',muzzle,[muzzle[0]+d.x*3,muzzle[1]+d.y*3,muzzle[2]],.39);
    }else if(!weaponless){
        const hand=hands[0];
        if(mounted&&r===2&&!f){
            const tip=[hand[0]+(a==='thrust'?19:8),hand[1]+(a==='thrust'?2:18),hand[2]];
            m.rod('wood',[hand[0]-3,hand[1]-6,hand[2]],tip,.65);
            m.box('red',tip[0]-1.5,tip[1]-2.2,tip[2],3.5,1.5,.55);
        }else{
            const spread=(a==='thrust'?1:lunge)+(a==='aim'?.5:0);
            m.rod('steel',hand,[hand[0]+4+7*spread,hand[1]+9-5*spread,hand[2]],.64);
            m.box('gold',hand[0],hand[1]+1,hand[2],2.8,.8,1.25);
        }
    }
    for(const [j,side] of [1,-1].entries()){
        const hand=hands[j],shoulder=[lean,22.6+dy,side*3.6],elbow=[(shoulder[0]+hand[0])/2-1,hand[1]-.6,side*4.05];
        m.rod(coat,shoulder,elbow,1.43);m.rod(coat,elbow,hand,1.07);
        m.oval('skin',...hand,1.05,1.17,.94);
    }
}
function artillery(m,f,r,a,fr){
    const phase=fr*2*Math.PI/motions[a],back=a==='recoil'?Math.sin(phase/2)*3:0;
    m.rod('wood',[-12-back,2,0],[4-back,7,0],1.8);
    for(const z of [-4,4]){
        const ring=new T.TorusGeometry(4.4,.7,5,12),obj=new T.Object3D();
        obj.position.set(2-back,4.7,z);m.meshes.push({geometry:ring,paint:shades.wood,o:obj});
        for(let j=0;j<6;j++){const a=j*Math.PI/6+back*.24;m.rod('wood',[2-back+Math.cos(a)*4.2,4.7+Math.sin(a)*4.2,z],[2-back-Math.cos(a)*4.2,4.7-Math.sin(a)*4.2,z],.47);}
        m.oval('steel',2-back,4.7,z,1.0,1.0,.88);
    }
    m.rod('ochre',[-2-back,7,0],[11-back,10,0],1.72);
    m.rod('gold',[8.8-back,9.5,0],[10.9-back,10,0],2.1);
    m.oval('ink',11.15-back,10.05,0,.65,1.35,1.35);
    for(const [j,side] of [-1,1].entries()){
        const sub=parts();human(sub,f,'field_cannon',r===3&&j===0?3:r===1?1:0,a==='recoil'?'kneelLoad':a==='march'?'march':'stand',fr,false);
        const t=new T.Matrix4().compose(new T.Vector3(-7+j*3,0,side*5),new T.Quaternion(),new T.Vector3(.68,.68,.68));
        for(const part of sub.meshes){part.o.updateMatrix();part.o.applyMatrix4(t);m.meshes.push(part);}
    }
}
export function model(f,k,r,a,frame){
    const m=parts(),mounted=k==='cuirassier';
    if(k==='field_cannon')artillery(m,f,r,a,frame);
    else{
        if(mounted)horse(m,f,r,frame*Math.PI/4,['march','run','flee'].includes(a));
        human(m,f,k,r,a,frame,mounted);
    }
    const fallen=a==='die'?frame/(motions.die-1):0;
    const root=new T.Matrix4().makeRotationZ(fallen*1.45);
    return {parts:m.meshes,root};
}
