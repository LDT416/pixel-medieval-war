import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {writeFileSync} from 'node:fs';
// Node 中把导出器的 Blob 读为二进制。
globalThis.FileReader=class {async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend()}};
const scene=new T.Scene(),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,flatShading:true});
let parts=[];
function part(shape,color,x,y,z,sx,sy,sz,ry=0){
 const g=shape.index?shape.toNonIndexed():shape;
 g.deleteAttribute('uv');g.scale(sx,sy,sz);g.rotateY(ry);g.translate(x,y,z);g.computeVertexNormals();
 const c=new T.Color(color), colors=[];for(let i=0;i<g.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));parts.push(g);
}
const box=(col,x,y,z,a,b,c)=>part(new T.BoxGeometry(),col,x,y,z,a,b,c);
const lump=(col,x,y,z,a,b,c,turn=0)=>part(new T.IcosahedronGeometry(1,0),col,x,y,z,a,b,c,turn);
function finish(name){const mesh=new T.Mesh(mergeGeometries(parts),mat);mesh.name=name;scene.add(mesh);parts=[]}
function house(x,z,w,h,d,stone,roof){
 box(stone,x,h/2,z,w,h,d);
 // 三角形山墙与屋脊
 const profile=new T.Shape();profile.moveTo(-w*.55,0);profile.lineTo(0,h*.47);profile.lineTo(w*.55,0);profile.closePath();
 part(new T.ExtrudeGeometry(profile,{depth:d+.2,bevelEnabled:false}),roof,x,h,z-d/2-.1,1,1,1);
 for(const side of [-1,1])for(const dx of [-.29,0,.29])for(const floor of [.3,.76])
 box('#454b49',x+dx*w,floor*h,z+side*d*.505,.28,.39,.04);
 box('#5d4838',x+w*.505,.54,z,.06,1.08,.57);box('#9c8271',x-.4,h*1.18,z+.38,.35,.95,.36);
}
house(2.85,.95,2.45,2.6,3.4,'#c9b99b','#985b45');house(-.1,-2.35,3.05,1.65,1.65,'#a28c72','#67615b');
for(const z of [-3.4,3.4])box('#a99e85',0,.48,z,9.35,.96,.25);
box('#b2a78d',4.62,.5,0,.24,1,6.9);
for(const z of [-2.18,2.18])box('#a99e85',-4.62,.48,z,.25,.96,2.55);
for(const z of [-1.05,1.05])box('#bdb197',-4.62,.8,z,.4,1.6,.42);
box('#66533b',-4.62,1.56,0,.34,.22,2.5);
for(const z of [-2.4,2.5])for(let j=0;j<3;j++)lump('#75804b',-3+j*.8,.43,z,.6,.68,.45,j);
for(const z of [1.5,2.2])lump('#bd9853',1.7,.4,z,.73,.57,.65);
finish('Farm');
part(new T.CylinderGeometry(.14,.34,3.2,7),'#736447',0,1.6,0,1,1,1);finish('Trunk');
for(let i=0;i<3;i++){
 if(i===2){for(let j=0;j<3;j++)part(new T.ConeGeometry(2.15-j*.43,3.75-j*.55,7),['#405940','#53734d','#6e8157'][j],0,2.7+j*1.1,0,1,1,1,j*.7)}
 else{const colors=i?['#708047','#88914c','#9e9a59']:['#576f43','#70804a','#86945a'];for(let j=0;j<7;j++){const a=j*2.4,r=j===6?0:1.25;lump(colors[j%3],Math.cos(a)*r,3.2+j*.28,Math.sin(a)*r,1.6,i?2.05:1.6,1.55,a)}}
 finish('Crown'+i);
}
lump('#778553',0,.64,0,1,.85,.92);lump('#65744b',.63,.4,.25,.73,.65,.62);finish('Shrub');
lump('#918e79',0,.35,0,.74,.56,.67);finish('Rock');
const glb=await new GLTFExporter().parseAsync(scene,{binary:true});writeFileSync(new URL('../public/models/battlefield.glb',import.meta.url),Buffer.from(glb));
