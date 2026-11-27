import * as T from 'three';
export type Lighting='golden'|'storm'|'fog';
export const lightings:Lighting[]=['golden','storm','fog'];
const presets={
    golden:{sun:0xffd296,power:2.6,sky:0xe3e9e4,earth:0x818057,fill:1.38,fog:0xe4ce9f,density:.00125,zenith:0x9bafb3,rim:0xedbb77},
    storm:{sun:0x9bb7d4,power:1.7,sky:0x9fb1c4,earth:0x454a49,fill:1.28,fog:0x83929d,density:.0029,zenith:0x3b4b5c,rim:0xa6c9f0},
    fog:{sun:0xe2dccb,power:1.35,sky:0xd0d3cb,earth:0x6c6f5d,fill:1.55,fog:0xc3c6bb,density:.0042,zenith:0xa3aba6,rim:0xddd6c0}
};
export class BattlefieldLight {
    sun=new T.DirectionalLight(); hemi=new T.HemisphereLight();
    flashes=Array.from({length:9},()=>new T.PointLight(0xffa341,0,16,1.6));
    mode:Lighting='golden'; rim=new T.Color();
    private skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color()},haze:{value:new T.Color()}},
        vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'uniform vec3 top,haze;varying float h;void main(){gl_FragColor=vec4(mix(haze,top,smoothstep(-.06,.74,h)),1.);}'});
    private direction=new T.Vector3(-.8,.56,.54).normalize();
    private right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),this.direction).normalize();
    private up=new T.Vector3().crossVectors(this.direction,this.right);
    private center=new T.Vector3();
    constructor(private scene:T.Scene) {
        this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
        this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.00015;this.sun.shadow.radius=1.1;
        this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=600;
        const sky=new T.Mesh(new T.SphereGeometry(850,20,12),this.skyMat);sky.renderOrder=-5;
        scene.add(this.sun,this.sun.target,this.hemi,sky,...this.flashes);this.set('golden');
    }
    set(mode:Lighting){
        const p=presets[mode];this.mode=mode;this.rim.setHex(p.rim);
        this.sun.color.setHex(p.sun);this.sun.intensity=p.power;
        this.hemi.color.setHex(p.sky);this.hemi.groundColor.setHex(p.earth);this.hemi.intensity=p.fill;
        this.scene.fog=new T.FogExp2(p.fog,p.density);this.scene.background=new T.Color(p.fog);
        this.skyMat.uniforms.haze.value.setHex(p.fog);this.skyMat.uniforms.top.value.setHex(p.zenith);
    }
    flash(x:number,y:number,z:number,big:boolean){
        let light=this.flashes[0];
        for(const p of this.flashes){
            if(!big && p.intensity>0 && p.position.distanceToSquared(this.center.set(x,y,z))<9){light=p;break;}
            if(p.intensity<light.intensity)light=p;
        }
        light.position.set(x,y+1.35,z);light.distance=big?17:7;
        light.intensity=Math.max(light.intensity,(big?95:16)*(this.mode==='golden'?1:1.55));
    }
    update(target:T.Vector3,distance:number,aspect:number,dt:number){
        for(const p of this.flashes){p.intensity*=Math.exp(-dt*13);if(p.intensity<.02)p.intensity=0;}
        const radius=Math.max(12,Math.ceil(distance*.31*Math.max(aspect,1.5)/2)*2), texel=2*radius/2048;
        const c=this.center.copy(target);
        c.addScaledVector(this.right,Math.round(c.dot(this.right)/texel)*texel-c.dot(this.right));
        c.addScaledVector(this.up,Math.round(c.dot(this.up)/texel)*texel-c.dot(this.up));
        this.sun.target.position.copy(c);this.sun.position.copy(c).addScaledVector(this.direction,270);
        const cam=this.sun.shadow.camera;
        if(cam.right!==radius){cam.left=cam.bottom=-radius;cam.right=cam.top=radius;cam.updateProjectionMatrix();}
    }
    reset(){for(const l of this.flashes)l.intensity=0;}
}
