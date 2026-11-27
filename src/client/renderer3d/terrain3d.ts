import * as T from 'three';
import { Rng } from '../../sim/rng';

export const toX=(x:number)=>(x-2200)*.05;
export const toZ=(y:number)=>(y-1200)*.05;
export function terrainHeight(x:number,z:number) {
    return .71*Math.sin(x*.048+z*.033)+.43*Math.cos(z*.083-x*.017)+.23*Math.sin(x*.093+z*.069);
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
    // Clumps share a local brush direction and colour. Wrap individual marks across tile seams.
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

export function createTerrain(scene:T.Scene) {
    const tex=meadowTexture(), g=new T.PlaneGeometry(660,540,440,360);
    g.rotateX(-Math.PI/2);
    const pos=g.attributes.position, colors=[];
    for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrainHeight(x,z));
        // Long bands of pasture and dried grass create variation beyond the texture tile.
        const dry=.5+.5*Math.sin(x*.067+z*.094+1.8*Math.sin(z*.063));
        const track=Math.exp(-((z-10*Math.sin(x*.044)-x*.18-15)**2)/3);
        colors.push(.78+dry*.20+track*.13,.88+dry*.08-track*.14,.76+dry*.15-track*.03);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
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
    const tufts=new T.InstancedMesh(tuft,tuftMat,3600),o=new T.Object3D(),c=new T.Color();
    for(let i=0;i<tufts.count;i++){
        const x=(rng.next()-.5)*250,z=(rng.next()-.5)*150;
        o.position.set(x,terrainHeight(x,z),z);o.rotation.y=rng.next()*6.28;o.scale.setScalar(.55+rng.next()*.95);
        o.updateMatrix();tufts.setMatrixAt(i,o.matrix);tufts.setColorAt(i,c.setHex([0x7f8648,0xa89c55,0x657648,0xabaa68][i%4]));
    }
    tufts.receiveShadow=true;tufts.castShadow=true;scene.add(tufts);
    return time;
}
