import * as T from 'three';
export class PostFx {
    private target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
    private scene=new T.Scene();private camera=new T.Camera();
    private uniforms={frame:{value:this.target.texture},pixel:{value:new T.Vector2()}};
    constructor(){
        const mat=new T.ShaderMaterial({uniforms:this.uniforms,depthTest:false,depthWrite:false,
            vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
            fragmentShader:`uniform sampler2D frame;uniform vec2 pixel;varying vec2 v;
            void main(){
                vec3 center=texture2D(frame,v).rgb;
                float defocus=max(1.-smoothstep(0.,.12,v.y),smoothstep(.84,1.,v.y));
                vec3 sum=center*2.,glow=vec3(0.);
                for(int k=0;k<6;k++){
                    float a=float(k)*1.0472;vec2 off=vec2(cos(a),sin(a))*pixel;
                    sum+=texture2D(frame,v+off*2.3*defocus).rgb;
                    vec3 c=texture2D(frame,v+off*3.2).rgb;
                    glow+=max(c-vec3(1.),vec3(0.))*smoothstep(.15,.9,c.r-c.b);
                }
                vec3 rgb=mix(center,sum*.125,defocus)+glow*.042;
                rgb*=1.-.15*smoothstep(.2,.73,length((v-.5)*vec2(.94,1.)));
                gl_FragColor=vec4(rgb,1.);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`});
        this.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),mat));
    }
    size(w:number,h:number){this.target.setSize(w,h);this.uniforms.pixel.value.set(1/w,1/h);}
    draw(r:T.WebGLRenderer,s:T.Scene,c:T.Camera){
        r.setRenderTarget(this.target);r.render(s,c);r.setRenderTarget(null);r.render(this.scene,this.camera);
    }
}
