import {Paths3d} from './paths3d';
import {Scenery} from './scenery3d';
import * as T from 'three';
import { Rng } from '../../sim/rng';
import { WIDTH, HEIGHT, layout, ridge, inRect } from '../../sim/maps';

/** 模拟像素 → 场景单位（0.05）。场地中心为原点。 */
export const SCALE=.05;
export const toX=(x:number)=>(x-WIDTH/2)*SCALE;
export const toZ=(y:number)=>(y-HEIGHT/2)*SCALE;
export const fromX=(x:number)=>x/SCALE+WIDTH/2;
export const fromZ=(z:number)=>z/SCALE+HEIGHT/2;
export let HALF_W=WIDTH/2*SCALE, HALF_H=HEIGHT/2*SCALE;
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
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1.75,1.75);texture.anisotropy=4;
    return texture;
}

export function createTerrain(scene:T.Scene) {
    const tex=meadowTexture();
    const chunk=2000*SCALE;
    const chunks=new Map<string,{mesh:T.Mesh<T.PlaneGeometry,T.MeshStandardMaterial>;detail:number}>();
    const mat=new T.MeshStandardMaterial({map:tex,vertexColors:true,roughness:.93,bumpMap:tex,bumpScale:.08,roughnessMap:tex});
    mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader
        .replace('#include <map_fragment>', `vec4 primaryGrass=texture2D(map,vMapUv);
            vec2 crossField=mat2(.73,.48,-.48,.73)*vMapUv+vec2(.37,.65);
            vec4 brush=texture2D(map,crossField);
            diffuseColor*=mix(primaryGrass,brush,.32);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor=.74+.23*roughnessFactor;');};

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
    const mobile=matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints>0 && Math.min(screen.width,screen.height)<=600;
    const tufts=new T.InstancedMesh(tuft,tuftMat,mobile?3250:6500),o=new T.Object3D(),col=new T.Color();
    const spots=Array.from({length:tufts.count},()=>[rng.next()-.5,rng.next()-.5,rng.next()*6.28,.55+rng.next()*.95]);
    for(let i=0;i<tufts.count;i++)tufts.setColorAt(i,col.setHex([0x7f8648,0xa89c55,0x657648,0xabaa68][i%4]));
    tufts.receiveShadow=true;tufts.castShadow=true;scene.add(tufts);
    const scenery=new Scenery(scene,time), paths=new Paths3d(scene);
    let lastView='',grassX=Infinity,grassZ=Infinity;
    function tile(ix:number,iz:number,detail:number){
        const left=ix*chunk-HALF_W,back=iz*chunk-HALF_H;
        const g=new T.PlaneGeometry(chunk,chunk,detail,detail);g.rotateX(-Math.PI/2);
        const pos=g.attributes.position,uv=g.attributes.uv,colors=new Float32Array(pos.count*3);
        for(let i=0;i<pos.count;i++){
            const x=left+chunk/2+pos.getX(i),z=back+chunk/2+pos.getZ(i),sx=fromX(x),sy=fromZ(z);
            pos.setY(i,terrainHeight(x,z));uv.setXY(i,x/chunk,z/chunk);
            const dry=.5+.5*Math.sin(x*.067+z*.094+1.8*Math.sin(z*.063)),crest=ridge(sx,sy);
            const yard=layout.farms.some(f=>inRect(f,sx,sy,60))?1:0;
            colors.set([.78+dry*.20+crest*.10+yard*.12,.88+dry*.08-crest*.02-yard*.06,.76+dry*.15+crest*.08-yard*.08],i*3);
        }
        g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();
        const mesh=new T.Mesh(g,mat);mesh.position.set(left+chunk/2,0,back+chunk/2);
        mesh.receiveShadow=true;scene.add(mesh);return mesh;
    }
    function updateView(x:number,z:number,distance:number,aspect:number){
        const ix=Math.floor((x+HALF_W)/chunk),iz=Math.floor((z+HALF_H)/chunk);
        const rx=Math.max(1,Math.ceil(distance*.52*aspect/chunk)+1),rz=Math.max(1,Math.ceil(distance*.65/chunk)+1);
        const near=distance<360,key=[ix,iz,rx,rz,near].join('/');
        if(key!==lastView){
            lastView=key;
            const wanted=new Set<string>();
            for(let j=Math.max(-2,iz-rz);j<=Math.min(Math.ceil(2*HALF_H/chunk)+1,iz+rz);j++){
                for(let i=Math.max(-2,ix-rx);i<=Math.min(Math.ceil(2*HALF_W/chunk)+1,ix+rx);i++){
                    const name=i+','+j,detail=near && Math.abs(i-ix)<=1 && Math.abs(j-iz)<=1?48:12;
                    wanted.add(name);
                    const old=chunks.get(name);if(old?.detail===detail)continue;
                    if(old){scene.remove(old.mesh);old.mesh.geometry.dispose();}
                    chunks.set(name,{mesh:tile(i,j,detail),detail});
                }
            }
            for(const [name,t] of chunks)if(!wanted.has(name)){scene.remove(t.mesh);t.mesh.geometry.dispose();chunks.delete(name);}
        }
        tufts.visible=distance<325;
        if(!tufts.visible)return;
        const gx=Math.round(x/16)*16,gz=Math.round(z/16)*16;
        if(gx===grassX && gz===grassZ)return;
        grassX=gx;grassZ=gz;
        // 固定世界坐标格点替换离开镜头的草，不让已有草簇随镜头滑动。
        const span=160;
        for(let i=0;i<spots.length;i++){
            const [ox,oz,r,s]=spots[i];
            const px=ox*span+Math.round((gx-ox*span)/span)*span,pz=oz*span+Math.round((gz-oz*span)/span)*span;
            o.position.set(px,terrainHeight(px,pz),pz);o.rotation.y=r;o.scale.setScalar(s);o.updateMatrix();tufts.setMatrixAt(i,o.matrix);
        }
        tufts.instanceMatrix.needsUpdate=true;tufts.computeBoundingSphere();
    }
    function rebuild(){
        HALF_W=WIDTH*SCALE/2;HALF_H=HEIGHT*SCALE/2;
        for(const t of chunks.values()){scene.remove(t.mesh);t.mesh.geometry.dispose();}
        chunks.clear();lastView='';grassX=grassZ=Infinity;
        updateView(0,0,158,1.7);paths.rebuild();scenery.rebuild();
    }
    rebuild();
    return {wind:time,updateView,rebuild,load:async()=>{await scenery.load();scenery.rebuild();}};
}
