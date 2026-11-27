import * as T from 'three';
import { Rng } from '../../sim/rng';
import { WIDTH, HEIGHT, layout, ridge, inRect } from '../../sim/maps';

/** 模拟像素 → 场景单位（0.05）。场地中心为原点。 */
export const SCALE=.05;
export const toX=(x:number)=>(x-WIDTH/2)*SCALE;
export const toZ=(y:number)=>(y-HEIGHT/2)*SCALE;
export const fromX=(x:number)=>x/SCALE+WIDTH/2;
export const fromZ=(z:number)=>z/SCALE+HEIGHT/2;
export const HALF_W=WIDTH/2*SCALE, HALF_H=HEIGHT/2*SCALE;
const RIDGE=3.8;
export function terrainHeight(x:number,z:number) {
    return .71*Math.sin(x*.048+z*.033)+.43*Math.cos(z*.083-x*.017)+.23*Math.sin(x*.093+z*.069)+RIDGE*ridge(fromX(x),fromZ(z));
}
export function normalAt(x:number,z:number,out:T.Vector3) {
    return out.set(terrainHeight(x-.25,z)-terrainHeight(x+.25,z),.5,terrainHeight(x,z-.25)-terrainHeight(x,z+.25)).normalize();
}
function meadowTexture(){
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=1024;
    const c=canvas.getContext('2d')!, rng=new Rng(1799), img=c.createImageData(1024,1024);
    // Periodic value noise at several brush sizes keeps all four tile edges continuous.
    function noiseGrid(n:number){
        const grid=Float32Array.from({length:n*n},()=>rng.next());
        return (u:number,v:number)=>{
            const x=u*n,y=v*n, i=Math.floor(x),j=Math.floor(y);
            let a=x-i,b=y-j;a=a*a*(3-2*a);b=b*b*(3-2*b);
            const at=(dx:number,dy:number)=>grid[((j+dy)%n)*n+(i+dx)%n];
            return (at(0,0)*(1-a)+at(1,0)*a)*(1-b)+(at(0,1)*(1-a)+at(1,1)*a)*b;
        };
    }
    const field=noiseGrid(4), clover=noiseGrid(17), grain=noiseGrid(64);
    for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
        const u=x/1024,v=y/1024,s=field(u,v)*.50+clover(u,v)*.33+grain(u,v)*.17;
        const furrow=Math.pow(.5+.5*Math.sin(2*Math.PI*(u*4+v*6+.22*Math.sin(v*6.283))),10)*clover(u,v);
        const ochre=Math.max(0,s-.52)*110, j=(y*1024+x)*4, n=(rng.next()-.5)*7;
        img.data[j]=39+s*58+ochre*1.35+furrow*16+n;
        img.data[j+1]=72+s*59+ochre*.25+furrow*7+n;
        img.data[j+2]=37+s*36+furrow*5+n;img.data[j+3]=255;
    }
    c.putImageData(img,0,0);
    const colors=['#b5ad6a','#8f9a5b','#c2aa64','#4d633c','#717e4a','#d3c588'];
    for(let i=0;i<43000;i++){
        const x=rng.int(0,1023),y=rng.int(0,1023);
        c.globalAlpha=.12+rng.next()*.32;c.fillStyle=colors[rng.int(0,5)];
        const w=rng.int(1,5);c.fillRect(x,y,w,1);if(w>2)c.fillRect(x+w-1,y-1,2,1);
    }
    for(let patch=0;patch<240;patch++){
        const cx=rng.int(0,1023),cy=rng.int(0,1023),clover=rng.next()<.38;
        const pigment=clover?'#809962':'#b6a36c';
        for(let j=0;j<58;j++){
            const angle=rng.next()*Math.PI*2,r=Math.sqrt(rng.next());
            const x=Math.round(1024+cx+Math.cos(angle)*r*26)%1024;
            const y=Math.round(1024+cy+Math.sin(angle)*r*11)%1024;
            c.globalAlpha=.22+rng.next()*.3;c.fillStyle=pigment;
            c.fillRect(x,y,clover?3:1,2);c.fillRect((x+2)%1024,(y+1023)%1024,2,1);
            if(!clover && j%5===0){c.fillStyle='#e2d4a1';c.fillRect((x+3)%1024,(y+1022)%1024,2,1);}
        }
    }
    const texture=new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(12,10);texture.anisotropy=4;
    return texture;
}

const ART=['farmhouse','oak','beech','spruce','bush','haystack','hedge'] as const;
type Art=typeof ART[number];
/** 农庄与树林：用仓库里现成的 px_*.png 像素画做成立牌，随每局地图重新摆放。 */
class Scenery {
    private group=new T.Group();private mats=new Map<Art,{mat:T.Material;depth:T.Material;aspect:number}>();
    private plane=new T.PlaneGeometry(1,1).translate(0,.5,0).rotateX(-8*Math.PI/180);
    constructor(scene:T.Scene){scene.add(this.group);}
    async load(){
        const loader=new T.TextureLoader();
        await Promise.all(ART.map(async name=>{
            try{
                const t=await loader.loadAsync('./art/px_'+name+'.png');
                t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.colorSpace=T.SRGBColorSpace;
                const img=t.image as {width:number;height:number};
                this.mats.set(name,{aspect:img.width/Math.max(1,img.height),
                    mat:new T.MeshLambertMaterial({map:t,alphaTest:.5,side:T.DoubleSide}),
                    depth:new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:t,alphaTest:.5,side:T.DoubleSide})});
            }catch{/* 缺图时直接跳过该装饰 */}
        }));
    }
    private put(name:Art,x:number,z:number,height:number,flip=false){
        const m=this.mats.get(name);if(!m)return;
        const mesh=new T.Mesh(this.plane,m.mat);mesh.customDepthMaterial=m.depth as T.MeshDepthMaterial;
        mesh.castShadow=mesh.receiveShadow=true;
        mesh.position.set(x,terrainHeight(x,z)-.15,z);mesh.scale.set(height*m.aspect*(flip?-1:1),height,1);
        this.group.add(mesh);
    }
    rebuild(){
        this.group.clear();
        const rng=new Rng(Math.floor(layout.seed*1000)+7);
        const f=layout.farm;
        if(f){
            const x=toX(f.x),z=toZ(f.y);
            this.put('farmhouse',x,z-1,f.w*SCALE*.95);
            this.put('haystack',x+f.w*SCALE*.55,z+2.5,2.8);
            this.put('haystack',x-f.w*SCALE*.6,z+3.2,2.4,true);
            for(let i=-2;i<=2;i++)this.put('hedge',x+i*f.w*SCALE*.24,z+f.h*SCALE*.62,1.3,i%2===0);
        }
        const kinds:Art[]=['oak','beech','spruce','oak','bush'];
        for(const g of layout.woods){
            const n=Math.round(g.r*g.r/2300);
            const list:{x:number;z:number;h:number;a:Art}[]=[];
            for(let i=0;i<n;i++){
                const a=rng.next()*Math.PI*2,r=Math.sqrt(rng.next())*g.r;
                list.push({x:toX(g.x+Math.cos(a)*r),z:toZ(g.y+Math.sin(a)*r*.9),h:5.5+rng.next()*4,a:kinds[rng.int(0,kinds.length-1)]});
            }
            list.sort((p,q)=>p.z-q.z);
            for(const t of list)this.put(t.a,t.x,t.z,t.a==='bush'?t.h*.45:t.h,rng.next()<.5);
        }
    }
}

export function createTerrain(scene:T.Scene) {
    const tex=meadowTexture(), g=new T.PlaneGeometry(700,560,460,370);
    g.rotateX(-Math.PI/2);
    const pos=g.attributes.position;
    const colors=new Float32Array(pos.count*3);
    g.setAttribute('color',new T.BufferAttribute(colors,3));
    const mat=new T.MeshStandardMaterial({map:tex,vertexColors:true,roughness:.93,bumpMap:tex,bumpScale:.08,roughnessMap:tex});
    mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader
        .replace('#include <map_fragment>', `vec4 primaryGrass=texture2D(map,vMapUv);
            vec2 crossField=mat2(.73,.48,-.48,.73)*vMapUv+vec2(.37,.65);
            vec4 brush=texture2D(map,crossField);
            diffuseColor*=mix(primaryGrass,brush,.32);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor=.74+.23*roughnessFactor;');};
    const ground=new T.Mesh(g,mat);ground.receiveShadow=true;scene.add(ground);
    const rng=new Rng(29), tuft=new T.BufferGeometry(), blades:number[]=[];
    for(let j=0;j<5;j++){
        const x=rng.next()*.34-.17,z=rng.next()*.28-.14,h=.12+rng.next()*.21;
        blades.push(x-.035,0,z,x+.035,0,z,x+.08,h,z-.06);
    }
    tuft.setAttribute('position',new T.Float32BufferAttribute(blades,3));tuft.computeVertexNormals();
    const tuftMat=new T.MeshLambertMaterial({side:T.DoubleSide,color:0xffffff});
    const time={value:0};
    tuftMat.onBeforeCompile=s=>{
        s.uniforms.uWind=time;s.vertexShader='uniform float uWind;\n'+s.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n transformed.x+=position.y*.28*sin(uWind*1.7+instanceMatrix[3].x*.34+instanceMatrix[3].z*.4);');
    };
    const tufts=new T.InstancedMesh(tuft,tuftMat,6500),o=new T.Object3D(),c=new T.Color();
    const spots=Array.from({length:tufts.count},()=>[(rng.next()-.5)*(HALF_W*2+40),(rng.next()-.5)*(HALF_H*2+30),rng.next()*6.28,.55+rng.next()*.95]);
    for(let i=0;i<tufts.count;i++)tufts.setColorAt(i,c.setHex([0x7f8648,0xa89c55,0x657648,0xabaa68][i%4]));
    tufts.receiveShadow=true;tufts.castShadow=true;scene.add(tufts);
    const scenery=new Scenery(scene);
    function rebuild(){
        for(let i=0;i<pos.count;i++){
            const x=pos.getX(i),z=pos.getZ(i),h=terrainHeight(x,z);pos.setY(i,h);
            // Long bands of pasture and dried grass; the ridge crest is drier and the farm yard is trampled.
            const dry=.5+.5*Math.sin(x*.067+z*.094+1.8*Math.sin(z*.063));
            const track=Math.exp(-((z-10*Math.sin(x*.044)-x*.18-15)**2)/3);
            const crest=ridge(fromX(x),fromZ(z)), yard=inRect(layout.farm,fromX(x),fromZ(z),60)?1:0;
            colors[i*3]=.78+dry*.20+track*.13+crest*.10+yard*.12;
            colors[i*3+1]=.88+dry*.08-track*.14-crest*.02-yard*.06;
            colors[i*3+2]=.76+dry*.15-track*.03-crest*.08-yard*.08;
        }
        pos.needsUpdate=true;g.attributes.color.needsUpdate=true;g.computeVertexNormals();
        for(let i=0;i<tufts.count;i++){
            const [x,z,r,s]=spots[i];
            o.position.set(x,terrainHeight(x,z),z);o.rotation.y=r;o.scale.setScalar(s);
            o.updateMatrix();tufts.setMatrixAt(i,o.matrix);
        }
        tufts.instanceMatrix.needsUpdate=true;
        scenery.rebuild();
    }
    rebuild();
    return {wind:time,rebuild,load:async()=>{await scenery.load();scenery.rebuild();}};
}
