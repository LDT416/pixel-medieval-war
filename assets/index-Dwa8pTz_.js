const Xs=["line_infantry","guard_grenadier","cuirassier","bannerman","field_cannon"],Ca=[600,1200,1800],Cc=30,Pa=4400,vi=2400;function Pc(){return[]}class Di{constructor(e){this.state=e}state;next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}int(e,t){return e+Math.floor(this.next()*(t-e+1))}}const Nn=64,us=Math.ceil(Pa/Nn),vo=Math.ceil(vi/Nn);class Lc{buckets=Array.from({length:us*vo},()=>[]);insert(e){this.buckets[Math.floor(e.y/Nn)*us+Math.floor(e.x/Nn)]?.push(e)}rebuild(e){for(const t of this.buckets)t.length=0;for(const t of e)t.hp>0&&this.insert(t)}visit(e,t,n,s){const r=Math.max(0,Math.floor((e-n)/Nn)),a=Math.min(us-1,Math.floor((e+n)/Nn)),o=Math.max(0,Math.floor((t-n)/Nn)),c=Math.min(vo-1,Math.floor((t+n)/Nn));for(let l=o;l<=c;l++)for(let u=r;u<=a;u++)for(const h of this.buckets[l*us+u])h.hp>0&&(h.x-e)**2+(h.y-t)**2<=n*n&&s(h)}}const wn=12;class Dc{sectors=[Array(wn),Array(wn)];artillery=[Array(wn),Array(wn)];batteryOnWing(e){const t=this.artillery[1-e.faction],n=Math.floor(e.homeY/vi*wn);for(let s=0;s<4;s++){const r=t[n-s],a=t[n+s];if(r&&r.hp>0)return r;if(a&&a.hp>0)return a}}update(e){for(const t of this.artillery)t.fill(void 0);for(const t of this.sectors)t.fill(void 0);for(const t of e)if(t.hp>0){const n=this.sectors[t.faction],s=Math.floor(t.y/vi*wn);t.kind==="field_cannon"&&(this.artillery[t.faction][s]=t);const r=n[s];(!r||(t.faction?r.x>t.x:r.x<t.x))&&(n[s]=t)}}opponent(e){const t=this.sectors[1-e.faction],n=Math.floor(e.y/vi*wn);for(let s=0;s<wn;s++){const r=t[n-s],a=t[n+s];if(r&&r.hp>0)return r;if(a&&a.hp>0)return a}}}function Mi(i,e,t,n,s,r,a=t.x,o=t.y){i.events.push({type:e,x:a,y:o,dx:n,dy:s,explosive:r,unitId:t.id,kind:t.kind,faction:t.faction})}function Br(i,e,t,n,s,r=!1){e.hp<=0||(e.hp=Math.max(0,e.hp-t),e.hitAt=i.tick,Mi(i,"hit",e,n,s,r),e.hp||(e.moving=!1,e.vx=0,e.vy=0,i.alive[e.faction]--,i.dead[e.faction]++,Mi(i,"death",e,n,s,r)))}function Ic(i,e,t,n,s){if(e.firedAt=i.tick,e.kind==="field_cannon"){e.pose="recoil",e.cooldown=i.rng.int(155,215);let r=t.x,a=t.y,o=-1;for(let c=0;c<4;c++){const l=t.x+i.rng.int(-45,45),u=t.y+i.rng.int(-40,40);let h=0;i.hash.visit(l,u,37,d=>{d.faction!==e.faction&&h++}),h>o&&(o=h,r=l,a=u)}i.rounds.push({x:e.x,y:e.y,tx:r,ty:a,age:0,duration:Math.max(5,Math.ceil(Math.hypot(r-e.x,a-e.y)/42)),gun:e}),Mi(i,"fire",e,n,s,!0);return}e.charge?(Mi(i,"slash",e,n,s,!1),Br(i,t,i.rng.int(32,e.kind==="cuirassier"?100:72),n,s),e.cooldown=i.rng.int(26,50)):(e.pose="aim",Mi(i,"fire",e,n,s,!1),i.rng.next()<.79&&Br(i,t,i.rng.int(65,124),n,s),e.cooldown=80-(i.tick+e.company*7)%26+i.rng.int(0,12))}function Nc(i){for(let e=i.rounds.length-1;e>=0&&!(!i.alive[0]||!i.alive[1]);e--){const t=i.rounds[e];++t.age<t.duration||(Mi(i,"impact",t.gun,0,0,!0,t.tx,t.ty),i.hash.visit(t.tx,t.ty,51,n=>{if(n.faction===t.gun.faction)return;const s=n.x-t.tx,r=n.y-t.ty,a=Math.max(1,Math.hypot(s,r));Br(i,n,155-a*1.9,s/a,r/a,!0)}),i.rounds.splice(e,1))}}function Uc(i,e){const t=e.kind==="field_cannon",n=e.kind==="cuirassier";let s=i.units[e.target];if((i.tick+e.id)%18===0){let T=1/0;i.hash.visit(e.x,e.y,t?450:235,b=>{if(b.faction===e.faction)return;const w=(b.x-e.x)**2+(b.y-e.y)**2,E=n&&b.kind==="field_cannon"?w*.28:w;E<T&&(T=E,s=b)})}const r=n&&e.id%4<2;if(r){const T=i.front.batteryOnWing(e);T&&(s=T)}if((!s||s.hp<=0)&&(s=i.front.opponent(e)),e.vx=0,e.vy=0,e.moving=!1,!s){e.pose="stand";return}e.target=s.id;const a=s.x-e.x,o=s.y-e.y,c=Math.max(.01,Math.hypot(a,o));Math.abs(a)>2&&(e.face=Math.sign(a)),e.cooldown>0&&e.cooldown--,!t&&(n||e.kind==="bannerman"||c<72||e.kind==="guard_grenadier"&&c<245||i.tick>980&&c<270)&&(e.charge=!0);const l=t?1140:e.charge?n?27:20:205+e.company%4*9;if(c<=l){const T=i.tick-e.firedAt;e.pose=e.charge?"thrust":t&&T<12?"recoil":e.cooldown>14?"load":"aim",e.cooldown||Ic(i,e,s,a/c,o/c);return}const u=e.faction?-1:1,h=n&&(e.x-2200)*u<140&&Math.abs(a)>270,d=!n&&Math.abs(a)>390&&i.tick<620,f=e.homeY+(r?e.homeY<vi/2?-85:85:0),g=h?f:d?e.homeY*.9+s.y*.1:s.y,S=h?u*350:a,p=g-e.y,m=Math.max(1,Math.hypot(S,p)),x=e.speed*(e.charge&&!n?1.58:1);e.vx=x*S/m,e.vy=x*p/m,c<300&&(i.tick+e.id)%4===0&&i.hash.visit(e.x,e.y,13,T=>{if(T.id===e.id)return;const b=e.x-T.x,w=e.y-T.y,E=Math.max(.2,Math.hypot(b,w)),_=(13-E)*5;e.vx+=b/E*_,e.vy+=w/E*_}),e.x=Math.min(Pa-1,Math.max(1,e.x+e.vx/30)),e.y=Math.min(vi-1,Math.max(1,e.y+e.vy/30)),e.moving=!0,e.stride+=x/30,e.pose=n||e.charge?"run":"march"}class Fc{constructor(e=1200,t=1815){this.seed=t,this.reset(e)}seed;units=[];structures=Pc();events=[];rounds=[];alive=[0,0];dead=[0,0];winner=null;hash=new Lc;front=new Dc;rng=new Di(1815);tick=0;scale=1200;reset(e=this.scale){if(!Ca.includes(e))throw new RangeError("Unsupported army scale");this.scale=e,this.tick=0,this.winner=null,this.rng.state=this.seed,this.units.length=this.rounds.length=this.events.length=0;const t=e/2;this.alive=[t,t],this.dead=[0,0];for(const n of[0,1]){const s=[.55,.2,.18,.04,.03].map(r=>Math.round(t*r));for(let r=0;r<Xs.length;r++)for(let a=0;a<s[r];a++){const o=Xs[r],c=s[r],l=r===0?Math.ceil(c/75):r===1?Math.ceil(c/40):r===2?Math.ceil(c/24):1,u=Math.floor(a/l),h=a%l,d=Math.ceil(c/l),f=(u+.5)/d,g=Math.floor(f*8);let S=505+g*178+(f*8-g)*133,p=1440-h*32-g%2*36;if(r===1&&(p=1100-h*36,S=765+g*112+(f*8-g)*75),r===2){const x=f<.5?f*2:(f-.5)*2;S=(f<.5?249:1907)+x*235,p=1405-h*45}r===3&&(p=1425-a%3*33,S=511+f*1380),r===4&&(p=900-a%2*100,S=495+f*1410),p+=this.rng.int(-3,3),S+=this.rng.int(-3,3);const m=n?-1:1;this.units.push({id:this.units.length,faction:n,kind:o,company:g,x:n?Pa-p:p,y:S,homeY:S,hp:[88,114,128,84,105][r],face:m,pose:"march",moving:!0,vx:m*[68,74,131,72,45][r],vy:0,speed:[68,74,131,72,45][r]*(.98+g%3*.02),target:-1,cooldown:g*2+a%3,hitAt:-999,firedAt:-999,stride:this.rng.int(0,15),charge:!1})}}this.hash.rebuild(this.units),this.front.update(this.units)}step(){if(this.events.length=0,this.winner!==null)return;this.tick++,this.hash.rebuild(this.units),this.front.update(this.units),Nc(this);const e=this.tick%2*this.scale/2;for(let t=0;t<this.scale;t++){const n=this.units[(t+e)%this.scale];n.hp>0&&Uc(this,n)}if(!this.alive[0]||!this.alive[1]){this.winner=this.alive[0]?0:1,this.rounds.length=0;for(const t of this.units)t.hp>0&&(t.moving=!1,t.vx=0,t.vy=0,t.pose="stand")}}frontline(){const e=[[0,0,0],[0,0,0]];for(const n of this.front.sectors)for(const s of n)if(s&&s.hp>0){const r=e[s.faction];r[0]+=s.x,r[1]+=s.y,r[2]++}const t=e.filter(n=>n[2]);return{x:t.reduce((n,s)=>n+s[0]/s[2],0)/t.length,y:t.reduce((n,s)=>n+s[1]/s[2],0)/t.length}}}const La="187",Oc=0,Mo=1,Bc=2,Zi=1,zc=2,qi=3,ei=0,It=1,Ft=2,Si=0,$i=1,So=2,Eo=3,yo=4,Gc=5,xi=100,Hc=101,kc=102,Vc=103,Wc=104,Xc=200,qc=201,Yc=202,Kc=203,wl=204,Rl=205,Zc=206,$c=207,Jc=208,Qc=209,jc=210,eh=211,th=212,nh=213,ih=214,zr=0,Gr=1,Hr=2,ji=3,kr=4,Vr=5,Wr=6,Xr=7,Da=0,sh=1,rh=2,En=0,Cl=1,Pl=2,Ll=3,Ia=4,Dl=5,Il=6,Nl=7,Ul=300,bi=301,es=302,ar=303,or=304,qs=1e3,Mn=1001,qr=1002,ct=1003,ah=1004,ds=1005,Ct=1006,lr=1007,On=1008,Gt=1009,Fl=1010,Ol=1011,ts=1012,Na=1013,cn=1014,jt=1015,nn=1016,Ua=1017,Fa=1018,Ti=1020,Bl=35902,zl=35899,Gl=1021,Hl=1022,ln=1023,kn=1026,Bn=1027,Oa=1028,Ba=1029,ti=1030,za=1031,Ga=1033,Bs=33776,zs=33777,Gs=33778,Hs=33779,Yr=35840,Kr=35841,Zr=35842,$r=35843,Jr=36196,Qr=37492,jr=37496,ea=37488,ta=37489,Ys=37490,na=37491,ia=37808,sa=37809,ra=37810,aa=37811,oa=37812,la=37813,ca=37814,ha=37815,ua=37816,da=37817,fa=37818,pa=37819,ma=37820,ga=37821,_a=36492,xa=36494,va=36495,Ma=36283,Sa=36284,Ks=36285,Ea=36286,oh=3200,lh=3201,Zs=0,ch=1,Fn="",Rt="srgb",$s="srgb-linear",Js="linear",$e="srgb",cr=7680,hh=519,uh=512,dh=513,fh=514,kl=515,ph=516,mh=517,Vl=518,Wl=519,gh=35044,Xl=35048,bo="300 es",en=2e3,ns=2001;function _h(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function is(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function xh(){const i=is("canvas");return i.style.display="block",i}const To={};function Ao(...i){const e="THREE."+i.shift();console.log(e,...i)}function ql(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ce(...i){i=ql(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Ye(...i){i=ql(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function ks(...i){const e=i.join(" ");e in To||(To[e]=!0,Ce(...i))}function vh(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const Mh={[zr]:zr,[Hr]:Wr,[kr]:kr,[ji]:Vr,[Gr]:Gr,[Wr]:Hr,[Xr]:Xr,[Vr]:ji};class ni{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const s=n[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}}const At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wo=1234567;const Ji=Math.PI/180,ss=180/Math.PI;function Ii(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]).toLowerCase()}function Ve(i,e,t){return Math.max(e,Math.min(t,i))}function Ha(i,e){return(i%e+e)%e}function Sh(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function Eh(i,e,t){return i!==e?(t-i)/(e-i):0}function Qi(i,e,t){return(1-t)*i+t*e}function yh(i,e,t,n){return Qi(i,e,1-Math.exp(-t*n))}function bh(i,e=1){return e-Math.abs(Ha(i,e*2)-e)}function Th(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Ah(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function wh(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Rh(i,e){return i+Math.random()*(e-i)}function Ch(i){return i*(.5-Math.random())}function Ph(i){i!==void 0&&(wo=i);let e=wo+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Lh(i){return i*Ji}function Dh(i){return i*ss}function Ih(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Nh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Yl(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Uh(i,e,t,n,s){const r=Math.cos,a=Math.sin,o=r(t/2),c=a(t/2),l=r((e+n)/2),u=a((e+n)/2),h=r((e-n)/2),d=a((e-n)/2),f=r((n-e)/2),g=a((n-e)/2);switch(s){case"XYX":i.set(o*u,c*h,c*d,o*l);break;case"YZY":i.set(c*d,o*u,c*h,o*l);break;case"ZXZ":i.set(c*h,c*d,o*u,o*l);break;case"XZX":i.set(o*u,c*g,c*f,o*l);break;case"YXY":i.set(c*f,o*u,c*g,o*l);break;case"ZYZ":i.set(c*g,c*f,o*u,o*l);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function ka(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Kl(i,e){if(e.constructor===Float32Array)return i;const t=ka(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/t,-1)}function Zl(i,e){if(e.constructor===Float32Array)return i;const t=ka(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*t)}const fs={DEG2RAD:Ji,RAD2DEG:ss,generateUUID:Ii,clamp:Ve,euclideanModulo:Ha,mapLinear:Sh,inverseLerp:Eh,lerp:Qi,damp:yh,pingpong:bh,smoothstep:Th,smootherstep:Ah,randInt:wh,randFloat:Rh,randFloatSpread:Ch,seededRandom:Ph,degToRad:Lh,radToDeg:Dh,isPowerOfTwo:Ih,ceilPowerOfTwo:Nh,floorPowerOfTwo:Yl,setQuaternionFromProperEuler:Uh,normalize:Zl,denormalize:Kl},io=class io{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};io.prototype.isVector2=!0;let ze=io;class Ni{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let c=n[s+0],l=n[s+1],u=n[s+2],h=n[s+3],d=r[a+0],f=r[a+1],g=r[a+2],S=r[a+3];if(h!==S||c!==d||l!==f||u!==g){let p=c*d+l*f+u*g+h*S;p<0&&(d=-d,f=-f,g=-g,S=-S,p=-p);let m=1-o;if(p<.9995){const x=Math.acos(p),T=Math.sin(x);m=Math.sin(m*x)/T,o=Math.sin(o*x)/T,c=c*m+d*o,l=l*m+f*o,u=u*m+g*o,h=h*m+S*o}else{c=c*m+d*o,l=l*m+f*o,u=u*m+g*o,h=h*m+S*o;const x=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=x,l*=x,u*=x,h*=x}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,s,r,a){const o=n[s],c=n[s+1],l=n[s+2],u=n[s+3],h=r[a],d=r[a+1],f=r[a+2],g=r[a+3];return e[t]=o*g+u*h+c*f-l*d,e[t+1]=c*g+u*d+l*h-o*f,e[t+2]=l*g+u*f+o*d-c*h,e[t+3]=u*g-o*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),u=o(s/2),h=o(r/2),d=c(n/2),f=c(s/2),g=c(r/2);switch(a){case"XYZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"YZX":this._x=d*u*h+l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h-d*f*g;break;case"XZY":this._x=d*u*h-l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h+d*f*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=n+o+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(r-l)*f,this._z=(a-s)*f}else if(n>o&&n>h){const f=2*Math.sqrt(1+n-o-h);this._w=(u-c)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+l)/f}else if(o>h){const f=2*Math.sqrt(1+o-n-h);this._w=(r-l)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(c+u)/f}else{const f=2*Math.sqrt(1+h-n-o);this._w=(a-s)/f,this._x=(r+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ve(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+a*o+s*l-r*c,this._y=s*u+a*c+r*o-n*l,this._z=r*u+a*l+n*c-s*o,this._w=a*u-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),u=Math.sin(l);c=Math.sin(c*l)/u,t=Math.sin(t*l)/u,this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const so=class so{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ro.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ro.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*s-o*n),u=2*(o*t-r*s),h=2*(r*n-a*t);return this.x=t+c*l+a*h-o*u,this.y=n+c*u+o*l-r*h,this.z=s+c*h+r*u-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return hr.copy(this).projectOnVector(e),this.sub(hr)}reflect(e){return this.sub(hr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};so.prototype.isVector3=!0;let F=so;const hr=new F,Ro=new Ni,ro=class ro{constructor(e,t,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l)}set(e,t,n,s,r,a,o,c,l){const u=this.elements;return u[0]=e,u[1]=s,u[2]=o,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=a,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],S=s[0],p=s[3],m=s[6],x=s[1],T=s[4],b=s[7],w=s[2],E=s[5],_=s[8];return r[0]=a*S+o*x+c*w,r[3]=a*p+o*T+c*E,r[6]=a*m+o*b+c*_,r[1]=l*S+u*x+h*w,r[4]=l*p+u*T+h*E,r[7]=l*m+u*b+h*_,r[2]=d*S+f*x+g*w,r[5]=d*p+f*T+g*E,r[8]=d*m+f*b+g*_,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8];return t*a*u-t*o*l-n*r*u+n*o*c+s*r*l-s*a*c}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8],h=u*a-o*l,d=o*c-u*r,f=l*r-a*c,g=t*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/g;return e[0]=h*S,e[1]=(s*l-u*n)*S,e[2]=(o*n-s*a)*S,e[3]=d*S,e[4]=(u*t-s*c)*S,e[5]=(s*r-o*t)*S,e[6]=f*S,e[7]=(n*c-l*t)*S,e[8]=(a*t-n*r)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-s*l,s*c,-s*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return ks("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ur.makeScale(e,t)),this}rotate(e){return ks("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ur.makeRotation(-e)),this}translate(e,t){return ks("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ur.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};ro.prototype.isMatrix3=!0;let Le=ro;const ur=new Le,Co=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Po=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Fh(){const i={enabled:!0,workingColorSpace:$s,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===$e&&(s.r=yn(s.r),s.g=yn(s.g),s.b=yn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===$e&&(s.r=Ei(s.r),s.g=Ei(s.g),s.b=Ei(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Fn?Js:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[$s]:{primaries:e,whitePoint:n,transfer:Js,toXYZ:Co,fromXYZ:Po,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Rt},outputColorSpaceConfig:{drawingBufferColorSpace:Rt}},[Rt]:{primaries:e,whitePoint:n,transfer:$e,toXYZ:Co,fromXYZ:Po,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Rt}}}),i}const We=Fh();function yn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ei(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let si;class Oh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{si===void 0&&(si=is("canvas")),si.width=e.width,si.height=e.height;const s=si.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=si}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=is("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=yn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(yn(t[n]/255)*255):t[n]=yn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Bh=0;class Va{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Bh++}),this.uuid=Ii(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(dr(s[a].image)):r.push(dr(s[a]))}else r=dr(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function dr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Oh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}let zh=0;const fr=new F;class Et extends ni{constructor(e=Et.DEFAULT_IMAGE,t=Et.DEFAULT_MAPPING,n=Mn,s=Mn,r=Ct,a=On,o=ln,c=Gt,l=Et.DEFAULT_ANISOTROPY,u=Fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zh++}),this.uuid=Ii(),this.name="",this.source=new Va(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new ze(0,0),this.repeat=new ze(1,1),this.center=new ze(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(fr).x}get height(){return this.source.getSize(fr).y}get depth(){return this.source.getSize(fr).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ul)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case qs:e.x=e.x-Math.floor(e.x);break;case Mn:e.x=e.x<0?0:1;break;case qr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case qs:e.y=e.y-Math.floor(e.y);break;case Mn:e.y=e.y<0?0:1;break;case qr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Et.DEFAULT_IMAGE=null;Et.DEFAULT_MAPPING=Ul;Et.DEFAULT_ANISOTROPY=1;const ao=class ao{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],g=c[9],S=c[2],p=c[6],m=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-S)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+S)<.1&&Math.abs(g+p)<.1&&Math.abs(l+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(l+1)/2,b=(f+1)/2,w=(m+1)/2,E=(u+d)/4,_=(h+S)/4,y=(g+p)/4;return T>b&&T>w?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=E/n,r=_/n):b>w?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=E/s,r=y/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=_/r,s=y/r),this.set(n,s,r,t),this}let x=Math.sqrt((p-g)*(p-g)+(h-S)*(h-S)+(d-u)*(d-u));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(h-S)/x,this.z=(d-u)/x,this.w=Math.acos((l+f+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this.w=Ve(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this.w=Ve(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};ao.prototype.isVector4=!0;let it=ao;class Gh extends ni{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ct,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new it(0,0,e,t),this.scissorTest=!1,this.viewport=new it(0,0,e,t),this.textures=[];const s=n.count;for(let r=0;r<s;r++)this.textures[r]=new Et({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Ct,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new Va(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class tn extends Gh{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class $l extends Et{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ct,this.minFilter=ct,this.wrapR=Mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Hh extends Et{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ct,this.minFilter=ct,this.wrapR=Mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const er=class er{constructor(e,t,n,s,r,a,o,c,l,u,h,d,f,g,S,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l,u,h,d,f,g,S,p)}set(e,t,n,s,r,a,o,c,l,u,h,d,f,g,S,p){const m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=c,m[2]=l,m[6]=u,m[10]=h,m[14]=d,m[3]=f,m[7]=g,m[11]=S,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new er().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,s=1/ri.setFromMatrixColumn(e,0).length(),r=1/ri.setFromMatrixColumn(e,1).length(),a=1/ri.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const d=a*u,f=a*h,g=o*u,S=o*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+g*l,t[5]=d-S*l,t[9]=-o*c,t[2]=S-d*l,t[6]=g+f*l,t[10]=a*c}else if(e.order==="YXZ"){const d=c*u,f=c*h,g=l*u,S=l*h;t[0]=d+S*o,t[4]=g*o-f,t[8]=a*l,t[1]=a*h,t[5]=a*u,t[9]=-o,t[2]=f*o-g,t[6]=S+d*o,t[10]=a*c}else if(e.order==="ZXY"){const d=c*u,f=c*h,g=l*u,S=l*h;t[0]=d-S*o,t[4]=-a*h,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*u,t[9]=S-d*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const d=a*u,f=a*h,g=o*u,S=o*h;t[0]=c*u,t[4]=g*l-f,t[8]=d*l+S,t[1]=c*h,t[5]=S*l+d,t[9]=f*l-g,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const d=a*c,f=a*l,g=o*c,S=o*l;t[0]=c*u,t[4]=S-d*h,t[8]=g*h+f,t[1]=h,t[5]=a*u,t[9]=-o*u,t[2]=-l*u,t[6]=f*h+g,t[10]=d-S*h}else if(e.order==="XZY"){const d=a*c,f=a*l,g=o*c,S=o*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+S,t[5]=a*u,t[9]=f*h-g,t[2]=g*h-f,t[6]=o*u,t[10]=S*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(kh,e,Vh)}lookAt(e,t,n){const s=this.elements;return Ot.subVectors(e,t),Ot.lengthSq()===0&&(Ot.z=1),Ot.normalize(),Rn.crossVectors(n,Ot),Rn.lengthSq()===0&&(Math.abs(n.z)===1?Ot.x+=1e-4:Ot.z+=1e-4,Ot.normalize(),Rn.crossVectors(n,Ot)),Rn.normalize(),ps.crossVectors(Ot,Rn),s[0]=Rn.x,s[4]=ps.x,s[8]=Ot.x,s[1]=Rn.y,s[5]=ps.y,s[9]=Ot.y,s[2]=Rn.z,s[6]=ps.z,s[10]=Ot.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],S=n[6],p=n[10],m=n[14],x=n[3],T=n[7],b=n[11],w=n[15],E=s[0],_=s[4],y=s[8],N=s[12],C=s[1],I=s[5],G=s[9],q=s[13],L=s[2],k=s[6],J=s[10],z=s[14],te=s[3],W=s[7],Q=s[11],j=s[15];return r[0]=a*E+o*C+c*L+l*te,r[4]=a*_+o*I+c*k+l*W,r[8]=a*y+o*G+c*J+l*Q,r[12]=a*N+o*q+c*z+l*j,r[1]=u*E+h*C+d*L+f*te,r[5]=u*_+h*I+d*k+f*W,r[9]=u*y+h*G+d*J+f*Q,r[13]=u*N+h*q+d*z+f*j,r[2]=g*E+S*C+p*L+m*te,r[6]=g*_+S*I+p*k+m*W,r[10]=g*y+S*G+p*J+m*Q,r[14]=g*N+S*q+p*z+m*j,r[3]=x*E+T*C+b*L+w*te,r[7]=x*_+T*I+b*k+w*W,r[11]=x*y+T*G+b*J+w*Q,r[15]=x*N+T*q+b*z+w*j,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],g=e[3],S=e[7],p=e[11],m=e[15],x=c*f-l*d,T=o*f-l*h,b=o*d-c*h,w=a*f-l*u,E=a*d-c*u,_=a*h-o*u;return t*(S*x-p*T+m*b)-n*(g*x-p*w+m*E)+s*(g*T-S*w+m*_)-r*(g*b-S*E+p*_)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],c=e[2],l=e[6],u=e[10];return t*(a*u-o*l)-n*(r*u-o*c)+s*(r*l-a*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],g=e[12],S=e[13],p=e[14],m=e[15],x=t*o-n*a,T=t*c-s*a,b=t*l-r*a,w=n*c-s*o,E=n*l-r*o,_=s*l-r*c,y=u*S-h*g,N=u*p-d*g,C=u*m-f*g,I=h*p-d*S,G=h*m-f*S,q=d*m-f*p,L=x*q-T*G+b*I+w*C-E*N+_*y;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const k=1/L;return e[0]=(o*q-c*G+l*I)*k,e[1]=(s*G-n*q-r*I)*k,e[2]=(S*_-p*E+m*w)*k,e[3]=(d*E-h*_-f*w)*k,e[4]=(c*C-a*q-l*N)*k,e[5]=(t*q-s*C+r*N)*k,e[6]=(p*b-g*_-m*T)*k,e[7]=(u*_-d*b+f*T)*k,e[8]=(a*G-o*C+l*y)*k,e[9]=(n*C-t*G-r*y)*k,e[10]=(g*E-S*b+m*x)*k,e[11]=(h*b-u*E-f*x)*k,e[12]=(o*N-a*I-c*y)*k,e[13]=(t*I-n*N+s*y)*k,e[14]=(S*T-g*w-p*x)*k,e[15]=(u*w-h*T+d*x)*k,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,l=r*a,u=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,u*o+n,u*c-s*a,0,l*c-s*o,u*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,l=r+r,u=a+a,h=o+o,d=r*l,f=r*u,g=r*h,S=a*u,p=a*h,m=o*h,x=c*l,T=c*u,b=c*h,w=n.x,E=n.y,_=n.z;return s[0]=(1-(S+m))*w,s[1]=(f+b)*w,s[2]=(g-T)*w,s[3]=0,s[4]=(f-b)*E,s[5]=(1-(d+m))*E,s[6]=(p+x)*E,s[7]=0,s[8]=(g+T)*_,s[9]=(p-x)*_,s[10]=(1-(d+S))*_,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=ri.set(s[0],s[1],s[2]).length();const o=ri.set(s[4],s[5],s[6]).length(),c=ri.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Zt.copy(this);const l=1/a,u=1/o,h=1/c;return Zt.elements[0]*=l,Zt.elements[1]*=l,Zt.elements[2]*=l,Zt.elements[4]*=u,Zt.elements[5]*=u,Zt.elements[6]*=u,Zt.elements[8]*=h,Zt.elements[9]*=h,Zt.elements[10]*=h,t.setFromRotationMatrix(Zt),n.x=a,n.y=o,n.z=c,this}makePerspective(e,t,n,s,r,a,o=en,c=!1){const l=this.elements,u=2*r/(t-e),h=2*r/(n-s),d=(t+e)/(t-e),f=(n+s)/(n-s);let g,S;if(c)g=r/(a-r),S=a*r/(a-r);else if(o===en)g=-(a+r)/(a-r),S=-2*a*r/(a-r);else if(o===ns)g=-a/(a-r),S=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=S,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=en,c=!1){const l=this.elements,u=2/(t-e),h=2/(n-s),d=-(t+e)/(t-e),f=-(n+s)/(n-s);let g,S;if(c)g=1/(a-r),S=a/(a-r);else if(o===en)g=-2/(a-r),S=-(a+r)/(a-r);else if(o===ns)g=-1/(a-r),S=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=h,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=g,l[14]=S,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};er.prototype.isMatrix4=!0;let je=er;const ri=new F,Zt=new je,kh=new F(0,0,0),Vh=new F(1,1,1),Rn=new F,ps=new F,Ot=new F,Lo=new je,Do=new Ni;class bn{constructor(e=0,t=0,n=0,s=bn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ve(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ve(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ve(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ve(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Lo.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Lo,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Do.setFromEuler(this),this.setFromQuaternion(Do,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}bn.DEFAULT_ORDER="XYZ";class Jl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Wh=0;const Io=new F,ai=new Ni,pn=new je,ms=new F,Bi=new F,Xh=new F,qh=new Ni,No=new F(1,0,0),Uo=new F(0,1,0),Fo=new F(0,0,1),Oo={type:"added"},Yh={type:"removed"},oi={type:"childadded",child:null},pr={type:"childremoved",child:null};class ht extends ni{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=Ii(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ht.DEFAULT_UP.clone();const e=new F,t=new bn,n=new Ni,s=new F(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new je},normalMatrix:{value:new Le}}),this.matrix=new je,this.matrixWorld=new je,this.matrixAutoUpdate=ht.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ai.setFromAxisAngle(e,t),this.quaternion.multiply(ai),this}rotateOnWorldAxis(e,t){return ai.setFromAxisAngle(e,t),this.quaternion.premultiply(ai),this}rotateX(e){return this.rotateOnAxis(No,e)}rotateY(e){return this.rotateOnAxis(Uo,e)}rotateZ(e){return this.rotateOnAxis(Fo,e)}translateOnAxis(e,t){return Io.copy(e).applyQuaternion(this.quaternion),this.position.add(Io.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(No,e)}translateY(e){return this.translateOnAxis(Uo,e)}translateZ(e){return this.translateOnAxis(Fo,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(pn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ms.copy(e):ms.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Bi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?pn.lookAt(Bi,ms,this.up):pn.lookAt(ms,Bi,this.up),this.quaternion.setFromRotationMatrix(pn),s&&(pn.extractRotation(s.matrixWorld),ai.setFromRotationMatrix(pn),this.quaternion.premultiply(ai.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ye("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Oo),oi.child=e,this.dispatchEvent(oi),oi.child=null):Ye("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Yh),pr.child=e,this.dispatchEvent(pr),pr.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),pn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),pn.multiply(e.parent.matrixWorld)),e.applyMatrix4(pn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Oo),oi.child=e,this.dispatchEvent(oi),oi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bi,e,Xh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bi,qh,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),u=a(e.images),h=a(e.shapes),d=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){const c=[];for(const l in o){const u=o[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}ht.DEFAULT_UP=new F(0,1,0);ht.DEFAULT_MATRIX_AUTO_UPDATE=!0;ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class gs extends ht{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Kh={type:"move"};class mr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new gs,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new gs,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new F,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new F),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new gs,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new F,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new F,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const S of e.hand.values()){const p=t.getJointPose(S,n),m=this._getHandJoint(l,S);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.quaternion,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.quaternion,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Kh)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new gs;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Ql={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Cn={h:0,s:0,l:0},_s={h:0,s:0,l:0};function gr(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class De{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Rt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,We.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=We.workingColorSpace){return this.r=e,this.g=t,this.b=n,We.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=We.workingColorSpace){if(e=Ha(e,1),t=Ve(t,0,1),n=Ve(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=gr(a,r,e+1/3),this.g=gr(a,r,e),this.b=gr(a,r,e-1/3)}return We.colorSpaceToWorking(this,s),this}setStyle(e,t=Rt){function n(r){r!==void 0&&parseFloat(r)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Rt){const n=Ql[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=yn(e.r),this.g=yn(e.g),this.b=yn(e.b),this}copyLinearToSRGB(e){return this.r=Ei(e.r),this.g=Ei(e.g),this.b=Ei(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Rt){return We.workingToColorSpace(wt.copy(this),e),Math.round(Ve(wt.r*255,0,255))*65536+Math.round(Ve(wt.g*255,0,255))*256+Math.round(Ve(wt.b*255,0,255))}getHexString(e=Rt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=We.workingColorSpace){We.workingToColorSpace(wt.copy(this),t);const n=wt.r,s=wt.g,r=wt.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,l;const u=(o+a)/2;if(o===a)c=0,l=0;else{const h=a-o;switch(l=u<=.5?h/(a+o):h/(2-a-o),a){case n:c=(s-r)/h+(s<r?6:0);break;case s:c=(r-n)/h+2;break;case r:c=(n-s)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=We.workingColorSpace){return We.workingToColorSpace(wt.copy(this),t),e.r=wt.r,e.g=wt.g,e.b=wt.b,e}getStyle(e=Rt){We.workingToColorSpace(wt.copy(this),e);const t=wt.r,n=wt.g,s=wt.b;return e!==Rt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Cn),this.setHSL(Cn.h+e,Cn.s+t,Cn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Cn),e.getHSL(_s);const n=Qi(Cn.h,_s.h,t),s=Qi(Cn.s,_s.s,t),r=Qi(Cn.l,_s.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const wt=new De;De.NAMES=Ql;class Wa{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new De(e),this.density=t}clone(){return new Wa(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class jl extends ht{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const $t=new F,mn=new F,_r=new F,gn=new F,li=new F,ci=new F,Bo=new F,xr=new F,vr=new F,Mr=new F,Sr=new it,Er=new it,yr=new it;class Qt{constructor(e=new F,t=new F,n=new F){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),$t.subVectors(e,t),s.cross($t);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){$t.subVectors(s,t),mn.subVectors(n,t),_r.subVectors(e,t);const a=$t.dot($t),o=$t.dot(mn),c=$t.dot(_r),l=mn.dot(mn),u=mn.dot(_r),h=a*l-o*o;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(l*c-o*u)*d,g=(a*u-o*c)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,gn)===null?!1:gn.x>=0&&gn.y>=0&&gn.x+gn.y<=1}static getInterpolation(e,t,n,s,r,a,o,c){return this.getBarycoord(e,t,n,s,gn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,gn.x),c.addScaledVector(a,gn.y),c.addScaledVector(o,gn.z),c)}static getInterpolatedAttribute(e,t,n,s,r,a){return Sr.setScalar(0),Er.setScalar(0),yr.setScalar(0),Sr.fromBufferAttribute(e,t),Er.fromBufferAttribute(e,n),yr.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Sr,r.x),a.addScaledVector(Er,r.y),a.addScaledVector(yr,r.z),a}static isFrontFacing(e,t,n,s){return $t.subVectors(n,t),mn.subVectors(e,t),$t.cross(mn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return $t.subVectors(this.c,this.b),mn.subVectors(this.a,this.b),$t.cross(mn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Qt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Qt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return Qt.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return Qt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Qt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let a,o;li.subVectors(s,n),ci.subVectors(r,n),xr.subVectors(e,n);const c=li.dot(xr),l=ci.dot(xr);if(c<=0&&l<=0)return t.copy(n);vr.subVectors(e,s);const u=li.dot(vr),h=ci.dot(vr);if(u>=0&&h<=u)return t.copy(s);const d=c*h-u*l;if(d<=0&&c>=0&&u<=0&&c-u>0)return a=c/(c-u),t.copy(n).addScaledVector(li,a);Mr.subVectors(e,r);const f=li.dot(Mr),g=ci.dot(Mr);if(g>=0&&f<=g)return t.copy(r);const S=f*l-c*g;if(S<=0&&l>=0&&g<=0)return o=l/(l-g),t.copy(n).addScaledVector(ci,o);const p=u*g-f*h;if(p<=0&&h-u>=0&&f-g>=0)return Bo.subVectors(r,s),o=(h-u)/(h-u+(f-g)),t.copy(s).addScaledVector(Bo,o);const m=1/(p+S+d);return a=S*m,o=d*m,t.copy(n).addScaledVector(li,a).addScaledVector(ci,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class ii{constructor(e=new F(1/0,1/0,1/0),t=new F(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Jt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Jt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Jt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Jt):Jt.fromBufferAttribute(r,a),Jt.applyMatrix4(e.matrixWorld),this.expandByPoint(Jt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),xs.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),xs.copy(n.boundingBox)),xs.applyMatrix4(e.matrixWorld),this.union(xs)}const s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Jt),Jt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(zi),vs.subVectors(this.max,zi),hi.subVectors(e.a,zi),ui.subVectors(e.b,zi),di.subVectors(e.c,zi),Pn.subVectors(ui,hi),Ln.subVectors(di,ui),qn.subVectors(hi,di);let t=[0,-Pn.z,Pn.y,0,-Ln.z,Ln.y,0,-qn.z,qn.y,Pn.z,0,-Pn.x,Ln.z,0,-Ln.x,qn.z,0,-qn.x,-Pn.y,Pn.x,0,-Ln.y,Ln.x,0,-qn.y,qn.x,0];return!br(t,hi,ui,di,vs)||(t=[1,0,0,0,1,0,0,0,1],!br(t,hi,ui,di,vs))?!1:(Ms.crossVectors(Pn,Ln),t=[Ms.x,Ms.y,Ms.z],br(t,hi,ui,di,vs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Jt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Jt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(_n[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),_n[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),_n[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),_n[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),_n[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),_n[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),_n[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),_n[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(_n),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const _n=[new F,new F,new F,new F,new F,new F,new F,new F],Jt=new F,xs=new ii,hi=new F,ui=new F,di=new F,Pn=new F,Ln=new F,qn=new F,zi=new F,vs=new F,Ms=new F,Yn=new F;function br(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Yn.fromArray(i,r);const o=s.x*Math.abs(Yn.x)+s.y*Math.abs(Yn.y)+s.z*Math.abs(Yn.z),c=e.dot(Yn),l=t.dot(Yn),u=n.dot(Yn);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>o)return!1}return!0}const lt=new F,Ss=new ze;let Zh=0;class Hn extends ni{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Zh++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=gh,this.updateRanges=[],this.gpuType=jt,this.version=0,this._normalizationScale=e!==void 0?ka(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ss.fromBufferAttribute(this,t),Ss.applyMatrix3(e),this.setXY(t,Ss.x,Ss.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)lt.fromBufferAttribute(this,t),lt.applyMatrix3(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)lt.fromBufferAttribute(this,t),lt.applyMatrix4(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)lt.fromBufferAttribute(this,t),lt.applyNormalMatrix(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)lt.fromBufferAttribute(this,t),lt.transformDirection(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):Kl(e,this.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):Zl(e,this.array)}}class ec extends Hn{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class tc extends Hn{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class yt extends Hn{constructor(e,t,n){super(new Float32Array(e),t,n)}}const $h=new ii,Gi=new F,Tr=new F;class as{constructor(e=new F,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):$h.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Gi.subVectors(e,this.center);const t=Gi.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Gi,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Tr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Gi.copy(e.center).add(Tr)),this.expandByPoint(Gi.copy(e.center).sub(Tr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Jh=0;const Xt=new je,Ar=new ht,fi=new F,Bt=new ii,Hi=new ii,xt=new F;class dn extends ni{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jh++}),this.uuid=Ii(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(_h(e)?tc:ec)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Le().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Xt.makeRotationFromQuaternion(e),this.applyMatrix4(Xt),this}rotateX(e){return Xt.makeRotationX(e),this.applyMatrix4(Xt),this}rotateY(e){return Xt.makeRotationY(e),this.applyMatrix4(Xt),this}rotateZ(e){return Xt.makeRotationZ(e),this.applyMatrix4(Xt),this}translate(e,t,n){return Xt.makeTranslation(e,t,n),this.applyMatrix4(Xt),this}scale(e,t,n){return Xt.makeScale(e,t,n),this.applyMatrix4(Xt),this}lookAt(e){return Ar.lookAt(e),Ar.updateMatrix(),this.applyMatrix4(Ar.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(fi).negate(),this.translate(fi.x,fi.y,fi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new yt(n,3))}else{const n=Math.min(e.length,t.count);for(let s=0;s<n;s++){const r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ii);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ye("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new F(-1/0,-1/0,-1/0),new F(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];Bt.setFromBufferAttribute(r),this.morphTargetsRelative?(xt.addVectors(this.boundingBox.min,Bt.min),this.boundingBox.expandByPoint(xt),xt.addVectors(this.boundingBox.max,Bt.max),this.boundingBox.expandByPoint(xt)):(this.boundingBox.expandByPoint(Bt.min),this.boundingBox.expandByPoint(Bt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ye('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new as);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ye("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new F,1/0);return}if(e){const n=this.boundingSphere.center;if(Bt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];Hi.setFromBufferAttribute(o),this.morphTargetsRelative?(xt.addVectors(Bt.min,Hi.min),Bt.expandByPoint(xt),xt.addVectors(Bt.max,Hi.max),Bt.expandByPoint(xt)):(Bt.expandByPoint(Hi.min),Bt.expandByPoint(Hi.max))}Bt.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)xt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(xt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],c=this.morphTargetsRelative;for(let l=0,u=o.count;l<u;l++)xt.fromBufferAttribute(o,l),c&&(fi.fromBufferAttribute(e,l),xt.add(fi)),s=Math.max(s,n.distanceToSquared(xt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Ye('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ye("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Hn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[],l=new Uint8Array(n.count);for(let N=0;N<n.count;N++)o[N]=new F,c[N]=new F;const u=new F,h=new F,d=new F,f=new ze,g=new ze,S=new ze,p=new F,m=new F;function x(N,C,I){l[N]=l[C]=l[I]=1,u.fromBufferAttribute(n,N),h.fromBufferAttribute(n,C),d.fromBufferAttribute(n,I),f.fromBufferAttribute(r,N),g.fromBufferAttribute(r,C),S.fromBufferAttribute(r,I),h.sub(u),d.sub(u),g.sub(f),S.sub(f);const G=1/(g.x*S.y-S.x*g.y);isFinite(G)&&(p.copy(h).multiplyScalar(S.y).addScaledVector(d,-g.y).multiplyScalar(G),m.copy(d).multiplyScalar(g.x).addScaledVector(h,-S.x).multiplyScalar(G),o[N].add(p),o[C].add(p),o[I].add(p),c[N].add(m),c[C].add(m),c[I].add(m))}let T=this.groups;T.length===0&&(T=[{start:0,count:e.count}]);for(let N=0,C=T.length;N<C;++N){const I=T[N],G=I.start,q=I.count;for(let L=G,k=G+q;L<k;L+=3)x(e.getX(L+0),e.getX(L+1),e.getX(L+2))}const b=new F,w=new F,E=new F,_=new F;function y(N){E.fromBufferAttribute(s,N),_.copy(E);const C=o[N];b.copy(C),b.sub(E.multiplyScalar(E.dot(C))).normalize(),w.crossVectors(_,C);const G=w.dot(c[N])<0?-1:1;a.setXYZW(N,b.x,b.y,b.z,G)}for(let N=0,C=n.count;N<C;++N)l[N]&&y(N);this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Hn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new F,r=new F,a=new F,o=new F,c=new F,l=new F,u=new F,h=new F;if(e)for(let d=0,f=e.count;d<f;d+=3){const g=e.getX(d+0),S=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,S),a.fromBufferAttribute(t,p),u.subVectors(a,r),h.subVectors(s,r),u.cross(h),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,S),l.fromBufferAttribute(n,p),o.add(u),c.add(u),l.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(S,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)xt.fromBufferAttribute(e,t),xt.normalize(),e.setXYZ(t,xt.x,xt.y,xt.z)}toNonIndexed(){function e(o,c){const l=o.array,u=o.itemSize,h=o.normalized,d=new l.constructor(c.length*u);let f=0,g=0;for(let S=0,p=c.length;S<p;S++){o.isInterleavedBufferAttribute?f=c[S]*o.data.stride+o.offset:f=c[S]*u;for(let m=0;m<u;m++)d[g++]=l[f++]}return new Hn(d,u,h)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new dn,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],l=e(c,n);t.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let u=0,h=l.length;u<h;u++){const d=l[u],f=e(d,n);c.push(f)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){const f=l[h];u.push(f.toJSON(e.data))}u.length>0&&(s[c]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const s=e.attributes;for(const l in s){const u=s[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],h=r[l];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,u=a.length;l<u;l++){const h=a[l];this.addGroup(h.start,h.count,h.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const wr=new F,Qh=new F,jh=new Le;class Un{constructor(e=new F(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=wr.subVectors(n,t).cross(Qh.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const s=e.delta(wr),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||jh.getNormalMatrix(e),s=this.coplanarPoint(wr).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let eu=0;class Ui extends ni{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:eu++}),this.uuid=Ii(),this.name="",this.type="Material",this.blending=$i,this.side=ei,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=wl,this.blendDst=Rl,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new De(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=hh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=cr,this.stencilZFail=cr,this.stencilZPass=cr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(t){const r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new De().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Un().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ze().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ze().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const xn=new F,Rr=new F,Es=new F,ys=new F;class tu{constructor(e=new F,t=new F(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=xn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(xn.copy(this.origin).addScaledVector(this.direction,t),xn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Rr.copy(e).add(t).multiplyScalar(.5),Es.copy(t).sub(e).normalize(),ys.copy(this.origin).sub(Rr);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Es),o=ys.dot(this.direction),c=-ys.dot(Es),l=ys.lengthSq(),u=Math.abs(1-a*a);let h,d,f,g;if(u>0)if(h=a*c-o,d=a*o-c,g=r*u,h>=0)if(d>=-g)if(d<=g){const S=1/u;h*=S,d*=S,f=h*(h+a*d+2*o)+d*(a*h+d+2*c)+l}else d=r,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*c)+l;else d=-r,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*c)+l;else d<=-g?(h=Math.max(0,-(-a*r+o)),d=h>0?-r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l):d<=g?(h=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(h=Math.max(0,-(a*r+o)),d=h>0?r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l);else d=a>0?-r:r,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Rr).addScaledVector(Es,d),f}intersectSphere(e,t){if(e.radius<0)return null;xn.subVectors(e.center,this.origin);const n=xn.dot(this.direction),s=xn.dot(xn)-n*n,r=e.radius*e.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),h>=0?(o=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(o=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,xn)!==null}intersectTriangle(e,t,n,s,r){const a=this.origin,o=this.direction,c=o.x,l=o.y,u=o.z,h=e.x-a.x,d=e.y-a.y,f=e.z-a.z,g=t.x-a.x,S=t.y-a.y,p=t.z-a.z,m=n.x-a.x,x=n.y-a.y,T=n.z-a.z,b=Math.abs(c),w=Math.abs(l),E=Math.abs(u);let _,y,N,C,I,G,q,L,k,J,z,te;if(b>=w&&b>=E?(N=c,G=h,k=g,te=m,c>=0?(_=l,y=u,C=d,I=f,q=S,L=p,J=x,z=T):(_=u,y=l,C=f,I=d,q=p,L=S,J=T,z=x)):w>=E?(N=l,G=d,k=S,te=x,l>=0?(_=u,y=c,C=f,I=h,q=p,L=g,J=T,z=m):(_=c,y=u,C=h,I=f,q=g,L=p,J=m,z=T)):(N=u,G=f,k=p,te=T,u>=0?(_=c,y=l,C=h,I=d,q=g,L=S,J=m,z=x):(_=l,y=c,C=d,I=h,q=S,L=g,J=x,z=m)),N===0)return null;const W=_/N,Q=y/N,j=1/N,Se=C-W*G,Ie=I-Q*G,K=q-W*k,pe=L-Q*k,xe=J-W*te,Ae=z-Q*te,me=xe*pe-Ae*K,Ue=Se*Ae-Ie*xe,at=K*Ie-pe*Se;if(s){if(me<0||Ue<0||at<0)return null}else if((me<0||Ue<0||at<0)&&(me>0||Ue>0||at>0))return null;const Re=me+Ue+at;if(Re===0)return null;const Ke=j*(me*G+Ue*k+at*te);return(Re>0?Ke<0:Ke>0)?null:this.at(Ke/Re,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class nc extends Ui{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=Da,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const zo=new je,Kn=new tu,bs=new as,Go=new F,Ts=new F,As=new F,ws=new F,Cr=new F,Rs=new F,Ho=new F,Cs=new F;class Yt extends ht{constructor(e=new dn,t=new nc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const o=this.morphTargetInfluences;if(r&&o){Rs.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=o[c],h=r[c];u!==0&&(Cr.fromBufferAttribute(h,e),a?Rs.addScaledVector(Cr,u):Rs.addScaledVector(Cr.sub(t),u))}t.add(Rs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),bs.copy(n.boundingSphere),bs.applyMatrix4(r),Kn.copy(e.ray).recast(e.near),!(bs.containsPoint(Kn.origin)===!1&&(Kn.intersectSphere(bs,Go)===null||Kn.origin.distanceToSquared(Go)>(e.far-e.near)**2))&&(zo.copy(r).invert(),Kn.copy(e.ray).applyMatrix4(zo),!(n.boundingBox!==null&&Kn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Kn)))}_computeIntersections(e,t,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,S=d.length;g<S;g++){const p=d[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),T=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,w=T;b<w;b+=3){const E=o.getX(b),_=o.getX(b+1),y=o.getX(b+2);s=Ps(this,m,e,n,l,u,h,E,_,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{const g=Math.max(0,f.start),S=Math.min(o.count,f.start+f.count);for(let p=g,m=S;p<m;p+=3){const x=o.getX(p),T=o.getX(p+1),b=o.getX(p+2);s=Ps(this,a,e,n,l,u,h,x,T,b),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,S=d.length;g<S;g++){const p=d[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),T=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,w=T;b<w;b+=3){const E=b,_=b+1,y=b+2;s=Ps(this,m,e,n,l,u,h,E,_,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{const g=Math.max(0,f.start),S=Math.min(c.count,f.start+f.count);for(let p=g,m=S;p<m;p+=3){const x=p,T=p+1,b=p+2;s=Ps(this,a,e,n,l,u,h,x,T,b),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}}function nu(i,e,t,n,s,r,a,o){let c;if(e.side===It?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,e.side===ei,o),c===null)return null;Cs.copy(o),Cs.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Cs);return l<t.near||l>t.far?null:{distance:l,point:Cs.clone(),object:i}}function Ps(i,e,t,n,s,r,a,o,c,l){i.getVertexPosition(o,Ts),i.getVertexPosition(c,As),i.getVertexPosition(l,ws);const u=nu(i,e,t,n,Ts,As,ws,Ho);if(u){const h=new F;Qt.getBarycoord(Ho,Ts,As,ws,h),s&&(u.uv=Qt.getInterpolatedAttribute(s,o,c,l,h,new ze)),r&&(u.uv1=Qt.getInterpolatedAttribute(r,o,c,l,h,new ze)),a&&(u.normal=Qt.getInterpolatedAttribute(a,o,c,l,h,new F),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a:o,b:c,c:l,normal:new F,materialIndex:0};Qt.getNormal(Ts,As,ws,d.normal),u.face=d,u.barycoord=h}return u}class ic extends Et{constructor(e=null,t=1,n=1,s,r,a,o,c,l=ct,u=ct,h,d){super(null,a,o,c,l,u,s,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ya extends Hn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const pi=new je,ko=new je,Ls=[],Vo=new ii,iu=new je,ki=new Yt,Vi=new as;class Ai extends Yt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ya(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,iu)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ii),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,pi),Vo.copy(e.boundingBox).applyMatrix4(pi),this.boundingBox.union(Vo)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new as),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,pi),Vi.copy(e.boundingSphere).applyMatrix4(pi),this.boundingSphere.union(Vi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture!==null?e.morphTexture.clone():null,this.instanceColor=e.instanceColor!==null?e.instanceColor.clone():null,this.count=e.count,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){const n=this.matrixWorld,s=this.count;if(ki.geometry=this.geometry,ki.material=this.material,ki.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Vi.copy(this.boundingSphere),Vi.applyMatrix4(n),e.ray.intersectsSphere(Vi)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,pi),ko.multiplyMatrices(n,pi),ki.matrixWorld=ko,ki.raycast(e,Ls);for(let a=0,o=Ls.length;a<o;a++){const c=Ls[a];c.instanceId=r,c.object=this,t.push(c)}Ls.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ya(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ic(new Float32Array(s*this.count),s,this.count,Oa,jt));const r=this.morphTexture.source.data.data;let a=0;for(let l=0;l<n.length;l++)a+=n[l];const o=this.geometry.morphTargetsRelative?1:1-a,c=s*e;return r[c]=o,r.set(n,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Zn=new as,su=new ze(.5,.5),Ds=new F;class rs{constructor(e=new Un,t=new Un,n=new Un,s=new Un,r=new Un,a=new Un){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=en,n=!1){const s=this.planes,r=e.elements,a=r[0],o=r[1],c=r[2],l=r[3],u=r[4],h=r[5],d=r[6],f=r[7],g=r[8],S=r[9],p=r[10],m=r[11],x=r[12],T=r[13],b=r[14],w=r[15];if(s[0].setComponents(l-a,f-u,m-g,w-x).normalize(),s[1].setComponents(l+a,f+u,m+g,w+x).normalize(),s[2].setComponents(l+o,f+h,m+S,w+T).normalize(),s[3].setComponents(l-o,f-h,m-S,w-T).normalize(),n)s[4].setComponents(c,d,p,b).normalize(),s[5].setComponents(l-c,f-d,m-p,w-b).normalize();else if(s[4].setComponents(l-c,f-d,m-p,w-b).normalize(),t===en)s[5].setComponents(l+c,f+d,m+p,w+b).normalize();else if(t===ns)s[5].setComponents(c,d,p,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Zn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Zn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Zn)}intersectsSprite(e){Zn.center.set(0,0,0);const t=su.distanceTo(e.center);return Zn.radius=.7071067811865476+t,Zn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Zn)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(Ds.x=s.normal.x>0?e.max.x:e.min.x,Ds.y=s.normal.y>0?e.max.y:e.min.y,Ds.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Ds)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const Wo=new je;class Xa{constructor(){this.coordinateSystem=en,this._frustums=[],this._count=0}setFromArrayCamera(e){const t=e.cameras,n=this._frustums;for(let s=0;s<t.length;s++){const r=t[s];Wo.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new rs),n[s].setFromProjectionMatrix(Wo,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;const t=this._frustums,n=e._frustums;for(let s=0;s<e._count;s++)t[s]===void 0&&(t[s]=new rs),t[s].copy(n[s]);return this._count=e._count,this}clone(){return new Xa().copy(this)}}class sc extends Et{constructor(e=[],t=bi,n,s,r,a,o,c,l,u){super(e,t,n,s,r,a,o,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class tr extends Et{constructor(e,t,n,s,r,a,o,c,l){super(e,t,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class wi extends Et{constructor(e,t,n=cn,s,r,a,o=ct,c=ct,l,u=kn,h=1){if(u!==kn&&u!==Bn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:h};super(d,s,r,a,o,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Va(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class rc extends wi{constructor(e,t=cn,n=bi,s,r,a=ct,o=ct,c,l=kn){const u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,n,s,r,a,o,c,l),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class ac extends Et{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class os extends dn{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new yt(l,3)),this.setAttribute("normal",new yt(u,3)),this.setAttribute("uv",new yt(h,2));function g(S,p,m,x,T,b,w,E,_,y,N){const C=b/_,I=w/y,G=b/2,q=w/2,L=E/2,k=_+1,J=y+1;let z=0,te=0;const W=new F;for(let Q=0;Q<J;Q++){const j=Q*I-q;for(let Se=0;Se<k;Se++){const Ie=Se*C-G;W[S]=Ie*x,W[p]=j*T,W[m]=L,l.push(W.x,W.y,W.z),W[S]=0,W[p]=0,W[m]=E>0?1:-1,u.push(W.x,W.y,W.z),h.push(Se/_),h.push(1-Q/y),z+=1}}for(let Q=0;Q<y;Q++)for(let j=0;j<_;j++){const Se=d+j+k*Q,Ie=d+j+k*(Q+1),K=d+(j+1)+k*(Q+1),pe=d+(j+1)+k*Q;c.push(Se,Ie,pe),c.push(Ie,K,pe),te+=6}o.addGroup(f,te,N),f+=te,d+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new os(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class qa extends dn{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};const r=[],a=[];o(s),l(n),u(),this.setAttribute("position",new yt(r,3)),this.setAttribute("normal",new yt(r.slice(),3)),this.setAttribute("uv",new yt(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(x){const T=new F,b=new F,w=new F;for(let E=0;E<t.length;E+=3)f(t[E+0],T),f(t[E+1],b),f(t[E+2],w),c(T,b,w,x)}function c(x,T,b,w){const E=w+1,_=[];for(let y=0;y<=E;y++){_[y]=[];const N=x.clone().lerp(b,y/E),C=T.clone().lerp(b,y/E),I=E-y;for(let G=0;G<=I;G++)G===0&&y===E?_[y][G]=N:_[y][G]=N.clone().lerp(C,G/I)}for(let y=0;y<E;y++)for(let N=0;N<2*(E-y)-1;N++){const C=Math.floor(N/2);N%2===0?(d(_[y][C+1]),d(_[y+1][C]),d(_[y][C])):(d(_[y][C+1]),d(_[y+1][C+1]),d(_[y+1][C]))}}function l(x){const T=new F;for(let b=0;b<r.length;b+=3)T.x=r[b+0],T.y=r[b+1],T.z=r[b+2],T.normalize().multiplyScalar(x),r[b+0]=T.x,r[b+1]=T.y,r[b+2]=T.z}function u(){const x=new F;for(let T=0;T<r.length;T+=3){x.x=r[T+0],x.y=r[T+1],x.z=r[T+2];const b=p(x)/2/Math.PI+.5,w=m(x)/Math.PI+.5;a.push(b,1-w)}g(),h()}function h(){for(let x=0;x<a.length;x+=6){const T=a[x+0],b=a[x+2],w=a[x+4],E=Math.max(T,b,w),_=Math.min(T,b,w);E>.9&&_<.1&&(T<.2&&(a[x+0]+=1),b<.2&&(a[x+2]+=1),w<.2&&(a[x+4]+=1))}}function d(x){r.push(x.x,x.y,x.z)}function f(x,T){const b=x*3;T.x=e[b+0],T.y=e[b+1],T.z=e[b+2]}function g(){const x=new F,T=new F,b=new F,w=new F,E=new ze,_=new ze,y=new ze;for(let N=0,C=0;N<r.length;N+=9,C+=6){x.set(r[N+0],r[N+1],r[N+2]),T.set(r[N+3],r[N+4],r[N+5]),b.set(r[N+6],r[N+7],r[N+8]),E.set(a[C+0],a[C+1]),_.set(a[C+2],a[C+3]),y.set(a[C+4],a[C+5]),w.copy(x).add(T).add(b).divideScalar(3);const I=p(w);S(E,C+0,x,I),S(_,C+2,T,I),S(y,C+4,b,I)}}function S(x,T,b,w){w<0&&x.x===1&&(a[T]=x.x-1),b.x===0&&b.z===0&&(a[T]=w/2/Math.PI+.5)}function p(x){return Math.atan2(x.z,-x.x)}function m(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new qa(e.vertices,e.indices,e.radius,e.detail)}}class Ya extends qa{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Ya(e.radius,e.detail)}}class hn extends dn{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(s),l=o+1,u=c+1,h=e/o,d=t/c,f=[],g=[],S=[],p=[];for(let m=0;m<u;m++){const x=m*d-a;for(let T=0;T<l;T++){const b=T*h-r;g.push(b,-x,0),S.push(0,0,1),p.push(T/o),p.push(1-m/c)}}for(let m=0;m<c;m++)for(let x=0;x<o;x++){const T=x+l*m,b=x+l*(m+1),w=x+1+l*(m+1),E=x+1+l*m;f.push(T,b,E),f.push(b,w,E)}this.setIndex(f),this.setAttribute("position",new yt(g,3)),this.setAttribute("normal",new yt(S,3)),this.setAttribute("uv",new yt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new hn(e.width,e.height,e.widthSegments,e.heightSegments)}}class Ka extends dn{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let l=0;const u=[],h=new F,d=new F,f=[],g=[],S=[],p=[];for(let m=0;m<=n;m++){const x=[],T=m/n,b=a+T*o,w=e*Math.cos(b),E=Math.sqrt(e*e-w*w);let _=0;m===0&&a===0?_=.5/t:m===n&&c===Math.PI&&(_=-.5/t);for(let y=0;y<=t;y++){const N=y/t,C=s+N*r;h.x=-E*Math.cos(C),h.y=w,h.z=E*Math.sin(C),g.push(h.x,h.y,h.z),d.copy(h).normalize(),S.push(d.x,d.y,d.z),p.push(N+_,1-T),x.push(l++)}u.push(x)}for(let m=0;m<n;m++)for(let x=0;x<t;x++){const T=u[m][x+1],b=u[m][x],w=u[m+1][x],E=u[m+1][x+1];(m!==0||a>0)&&f.push(T,b,E),(m!==n-1||c<Math.PI)&&f.push(b,w,E)}this.setIndex(f),this.setAttribute("position",new yt(g,3)),this.setAttribute("normal",new yt(S,3)),this.setAttribute("uv",new yt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ka(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}function Ri(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];if(Xo(s))s.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Xo(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Lt(i){const e={};for(let t=0;t<i.length;t++){const n=Ri(i[t]);for(const s in n)e[s]=n[s]}return e}function Xo(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function ru(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function oc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:We.workingColorSpace}const au={clone:Ri,merge:Lt};var ou=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,lu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class un extends Ui{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ou,this.fragmentShader=lu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ri(e.uniforms),this.uniformsGroups=ru(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new De().setHex(s.value);break;case"v2":this.uniforms[n].value=new ze().fromArray(s.value);break;case"v3":this.uniforms[n].value=new F().fromArray(s.value);break;case"v4":this.uniforms[n].value=new it().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Le().fromArray(s.value);break;case"m4":this.uniforms[n].value=new je().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class cu extends un{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Za extends Ui{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new De(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zs,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class lc extends Ui{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zs,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=Da,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class cc extends Ui{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=oh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class hu extends Ui{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Pr={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(qo(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!qo(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function qo(i){try{const e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class uu{constructor(e,t,n){const s=this;let r=!1,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){const h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){const f=l[h],g=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const du=new uu;class $a{constructor(e){this.manager=e!==void 0?e:du,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}}$a.DEFAULT_MATERIAL_NAME="__DEFAULT";const mi=new WeakMap;class fu extends $a{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=Pr.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let h=mi.get(a);h===void 0&&(h=[],mi.set(a,h)),h.push({onLoad:t,onError:s})}return a}const o=is("img");function c(){u(),t&&t(this);const h=mi.get(this)||[];for(let d=0;d<h.length;d++){const f=h[d];f.onLoad&&f.onLoad(this)}mi.delete(this),r.manager.itemEnd(e)}function l(h){u(),s&&s(h),Pr.remove(`image:${e}`);const d=mi.get(this)||[];for(let f=0;f<d.length;f++){const g=d[f];g.onError&&g.onError(h)}mi.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){o.removeEventListener("load",c,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Pr.add(`image:${e}`,o),r.manager.itemStart(e),o.fetchPriority=this.priority,o.src=e,o}}class pu extends $a{constructor(e){super(e)}load(e,t,n,s){const r=new Et,a=new fu(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}}class Ja extends ht{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new De(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class mu extends Ja{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ht.DEFAULT_UP),this.updateMatrix(),this.groundColor=new De(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const Lr=new je,Yo=new F,Ko=new F;class hc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ze(512,512),this.mapType=Gt,this.map=null,this.mapPass=null,this.matrix=new je,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new rs,this._frameExtents=new ze(1,1),this._viewportCount=1,this._viewports=[new it(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera;Yo.setFromMatrixPosition(e.matrixWorld),t.position.copy(Yo),Ko.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ko),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){Lr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Lr,e.coordinateSystem,e.reversedDepth);const r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,c=s?s.x/r.x:0,l=s?s.y/r.y:0;e.coordinateSystem===ns||e.reversedDepth?t.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),t.multiply(Lr)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Is=new F,Ns=new Ni,rn=new F;class Qa extends ht{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new je,this.projectionMatrix=new je,this.projectionMatrixInverse=new je,this.coordinateSystem=en,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Is,Ns,rn),rn.x===1&&rn.y===1&&rn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Is,Ns,rn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Is,Ns,rn),rn.x===1&&rn.y===1&&rn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Is,Ns,rn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Dn=new F,Zo=new ze,$o=new ze;class qt extends Qa{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=ss*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ji*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ss*2*Math.atan(Math.tan(Ji*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Dn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Dn.x,Dn.y).multiplyScalar(-e/Dn.z),Dn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Dn.x,Dn.y).multiplyScalar(-e/Dn.z)}getViewSize(e,t){return this.getViewBounds(e,Zo,$o),t.subVectors($o,Zo)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ji*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,t-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class gu extends hc{constructor(){super(new qt(90,1,.5,500)),this.isPointLightShadow=!0}}class _u extends Ja{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new gu}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class uc extends Qa{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=s+t,c=s-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class xu extends hc{constructor(){super(new uc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class vu extends Ja{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ht.DEFAULT_UP),this.updateMatrix(),this.target=new ht,this.shadow=new xu}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}const gi=-90,_i=1;class ba extends ht{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new qt(gi,_i,e,t);s.layers=this.layers,this.add(s);const r=new qt(gi,_i,e,t);r.layers=this.layers,this.add(r);const a=new qt(gi,_i,e,t);a.layers=this.layers,this.add(a);const o=new qt(gi,_i,e,t);o.layers=this.layers,this.add(o);const c=new qt(gi,_i,e,t);c.layers=this.layers,this.add(c);const l=new qt(gi,_i,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,c]=t;for(const l of t)this.remove(l);if(e===en)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===ns)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.mipmapsAutoUpdate=S,e.setRenderTarget(n,5,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Mu extends qt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}}function Jo(i,e,t,n){const s=Su(n);switch(t){case Gl:return i*e;case Oa:return i*e/s.components*s.byteLength;case Ba:return i*e/s.components*s.byteLength;case ti:return i*e*2/s.components*s.byteLength;case za:return i*e*2/s.components*s.byteLength;case Hl:return i*e*3/s.components*s.byteLength;case ln:return i*e*4/s.components*s.byteLength;case Ga:return i*e*4/s.components*s.byteLength;case Bs:case zs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Gs:case Hs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Kr:case $r:return Math.max(i,16)*Math.max(e,8)/4;case Yr:case Zr:return Math.max(i,8)*Math.max(e,8)/2;case Jr:case Qr:case ea:case ta:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case jr:case Ys:case na:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ia:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case sa:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case ra:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case aa:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case oa:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case la:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case ca:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ha:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ua:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case da:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case fa:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case pa:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ma:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case ga:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case _a:case xa:case va:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ma:case Sa:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Ks:case Ea:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Su(i){switch(i){case Gt:case Fl:return{byteLength:1,components:1};case ts:case Ol:case nn:return{byteLength:2,components:1};case Ua:case Fa:return{byteLength:2,components:4};case cn:case Na:case jt:return{byteLength:4,components:1};case Bl:case zl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:La}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=La);function dc(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Eu(i){const e=new WeakMap;function t(o,c){const l=o.array,u=o.usage,h=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,u),o.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:h}}function n(o,c,l){const u=c.array,h=c.updateRanges;if(i.bindBuffer(l,o),h.length===0)i.bufferSubData(l,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],S=h[f];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++d,h[d]=S)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const S=h[f];i.bufferSubData(l,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var yu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Tu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Au=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ru=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Cu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Pu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Lu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Du=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Iu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Nu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Uu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Fu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ou=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Bu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,zu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Hu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ku=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Vu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Wu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Xu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,qu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Ku=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Zu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,$u=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ju=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Qu="gl_FragColor = linearToOutputTexel( gl_FragColor );",ju=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ed=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,td=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,nd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,id=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,sd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,rd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ad=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,od=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ld=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,cd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,hd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ud=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,dd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,fd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,pd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,md=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,gd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,_d=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,xd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,vd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Md=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Sd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ed=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,yd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bd=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Td=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ad=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Rd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Cd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Pd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ld=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Dd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Id=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Nd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ud=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Fd=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Od=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,zd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Gd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Hd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,kd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Xd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Kd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Zd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$d=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Jd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Qd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,jd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ef=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,tf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,nf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,sf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,rf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,af=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,of=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,lf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,cf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,uf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,df=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ff=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,pf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,mf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,gf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,_f=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,xf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,vf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Mf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Ef=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const yf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,bf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Af=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Pf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Lf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Df=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,If=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Nf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Uf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ff=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Of=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Bf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,kf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Wf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Xf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Kf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$f=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Qf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,jf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ep=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,tp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,np=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Oe={alphahash_fragment:yu,alphahash_pars_fragment:bu,alphamap_fragment:Tu,alphamap_pars_fragment:Au,alphatest_fragment:wu,alphatest_pars_fragment:Ru,aomap_fragment:Cu,aomap_pars_fragment:Pu,batching_pars_vertex:Lu,batching_vertex:Du,begin_vertex:Iu,beginnormal_vertex:Nu,bsdfs:Uu,iridescence_fragment:Fu,bumpmap_pars_fragment:Ou,clipping_planes_fragment:Bu,clipping_planes_pars_fragment:zu,clipping_planes_pars_vertex:Gu,clipping_planes_vertex:Hu,color_fragment:ku,color_pars_fragment:Vu,color_pars_vertex:Wu,color_vertex:Xu,common:qu,defaultnormal_vertex:Yu,displacementmap_pars_vertex:Ku,displacementmap_vertex:Zu,emissivemap_fragment:$u,emissivemap_pars_fragment:Ju,colorspace_fragment:Qu,colorspace_pars_fragment:ju,envmap_fragment:ed,envmap_common_pars_fragment:td,envmap_pars_fragment:nd,envmap_pars_vertex:id,envmap_physical_pars_fragment:pd,envmap_vertex:sd,fog_vertex:rd,fog_pars_vertex:ad,fog_fragment:od,fog_pars_fragment:ld,gradientmap_pars_fragment:cd,lightmap_pars_fragment:hd,lights_lambert_fragment:ud,lights_lambert_pars_fragment:dd,lights_pars_begin:fd,lights_toon_fragment:md,lights_toon_pars_fragment:gd,lights_phong_fragment:_d,lights_phong_pars_fragment:xd,lights_physical_fragment:vd,lights_physical_pars_fragment:Md,lights_fragment_begin:Sd,lights_fragment_maps:Ed,lights_fragment_end:yd,lightprobes_pars_fragment:bd,logdepthbuf_fragment:Td,logdepthbuf_pars_fragment:Ad,logdepthbuf_pars_vertex:wd,logdepthbuf_vertex:Rd,map_fragment:Cd,map_pars_fragment:Pd,map_particle_fragment:Ld,map_particle_pars_fragment:Dd,metalnessmap_fragment:Id,metalnessmap_pars_fragment:Nd,morphinstance_vertex:Ud,morphcolor_vertex:Fd,morphnormal_vertex:Od,morphtarget_pars_vertex:Bd,morphtarget_vertex:zd,normal_fragment_begin:Gd,normal_fragment_maps:Hd,normal_pars_fragment:kd,normal_pars_vertex:Vd,normal_vertex:Wd,normalmap_pars_fragment:Xd,clearcoat_normal_fragment_begin:qd,clearcoat_normal_fragment_maps:Yd,clearcoat_pars_fragment:Kd,iridescence_pars_fragment:Zd,opaque_fragment:$d,packing:Jd,premultiplied_alpha_fragment:Qd,project_vertex:jd,dithering_fragment:ef,dithering_pars_fragment:tf,roughnessmap_fragment:nf,roughnessmap_pars_fragment:sf,shadowmap_pars_fragment:rf,shadowmap_pars_vertex:af,shadowmap_vertex:of,shadowmask_pars_fragment:lf,skinbase_vertex:cf,skinning_pars_vertex:hf,skinning_vertex:uf,skinnormal_vertex:df,specularmap_fragment:ff,specularmap_pars_fragment:pf,tonemapping_fragment:mf,tonemapping_pars_fragment:gf,transmission_fragment:_f,transmission_pars_fragment:xf,uv_pars_fragment:vf,uv_pars_vertex:Mf,uv_vertex:Sf,worldpos_vertex:Ef,background_vert:yf,background_frag:bf,backgroundCube_vert:Tf,backgroundCube_frag:Af,cube_vert:wf,cube_frag:Rf,depth_vert:Cf,depth_frag:Pf,distance_vert:Lf,distance_frag:Df,equirect_vert:If,equirect_frag:Nf,linedashed_vert:Uf,linedashed_frag:Ff,meshbasic_vert:Of,meshbasic_frag:Bf,meshlambert_vert:zf,meshlambert_frag:Gf,meshmatcap_vert:Hf,meshmatcap_frag:kf,meshnormal_vert:Vf,meshnormal_frag:Wf,meshphong_vert:Xf,meshphong_frag:qf,meshphysical_vert:Yf,meshphysical_frag:Kf,meshtoon_vert:Zf,meshtoon_frag:$f,points_vert:Jf,points_frag:Qf,shadow_vert:jf,shadow_frag:ep,sprite_vert:tp,sprite_frag:np},fe={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new ze(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new ze(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},on={basic:{uniforms:Lt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:Oe.meshbasic_vert,fragmentShader:Oe.meshbasic_frag},lambert:{uniforms:Lt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new De(0)},envMapIntensity:{value:1}}]),vertexShader:Oe.meshlambert_vert,fragmentShader:Oe.meshlambert_frag},phong:{uniforms:Lt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphong_vert,fragmentShader:Oe.meshphong_frag},standard:{uniforms:Lt([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag},toon:{uniforms:Lt([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new De(0)}}]),vertexShader:Oe.meshtoon_vert,fragmentShader:Oe.meshtoon_frag},matcap:{uniforms:Lt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:Oe.meshmatcap_vert,fragmentShader:Oe.meshmatcap_frag},points:{uniforms:Lt([fe.points,fe.fog]),vertexShader:Oe.points_vert,fragmentShader:Oe.points_frag},dashed:{uniforms:Lt([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Oe.linedashed_vert,fragmentShader:Oe.linedashed_frag},depth:{uniforms:Lt([fe.common,fe.displacementmap]),vertexShader:Oe.depth_vert,fragmentShader:Oe.depth_frag},normal:{uniforms:Lt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:Oe.meshnormal_vert,fragmentShader:Oe.meshnormal_frag},sprite:{uniforms:Lt([fe.sprite,fe.fog]),vertexShader:Oe.sprite_vert,fragmentShader:Oe.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Oe.background_vert,fragmentShader:Oe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Oe.backgroundCube_vert,fragmentShader:Oe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Oe.cube_vert,fragmentShader:Oe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Oe.equirect_vert,fragmentShader:Oe.equirect_frag},distance:{uniforms:Lt([fe.common,fe.displacementmap,{referencePosition:{value:new F},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Oe.distance_vert,fragmentShader:Oe.distance_frag},shadow:{uniforms:Lt([fe.lights,fe.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:Oe.shadow_vert,fragmentShader:Oe.shadow_frag}};on.physical={uniforms:Lt([on.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new ze(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Le},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new ze},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new ze},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag};const Us={r:0,b:0,g:0},ip=new je,fc=new Le;fc.set(-1,0,0,0,1,0,0,0,1);function sp(i,e,t,n,s,r){const a=new De(0);let o=s===!0?0:1,c,l,u=null,h=0,d=null;function f(x){let T=x.isScene===!0?x.background:null;if(T&&T.isTexture){const b=x.backgroundBlurriness>0;T=e.get(T,b)}return T}function g(x){let T=!1;const b=f(x);b===null?p(a,o):b&&b.isColor&&(p(b,1),T=!0);const w=i.xr.getEnvironmentBlendMode();w==="additive"?t.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||T)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(x,T){const b=f(T);b&&b.isCubeTexture?(l===void 0&&(l=new Yt(new os(1,1,1),new un({name:"BackgroundCubeMaterial",uniforms:Ri(on.backgroundCube.uniforms),vertexShader:on.backgroundCube.vertexShader,fragmentShader:on.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,E,_){this.matrixWorld.copyPosition(_.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=b,l.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(ip.makeRotationFromEuler(T.backgroundRotation)).transpose(),b.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(fc),l.material.toneMapped=We.getTransfer(b.colorSpace)!==$e,(u!==b||h!==b.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,u=b,h=b.version,d=i.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new Yt(new hn(2,2),new un({name:"BackgroundMaterial",uniforms:Ri(on.background.uniforms),vertexShader:on.background.vertexShader,fragmentShader:on.background.fragmentShader,side:ei,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.toneMapped=We.getTransfer(b.colorSpace)!==$e,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||h!==b.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=b,h=b.version,d=i.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function p(x,T){x.getRGB(Us,oc(i)),t.buffers.color.setClear(Us.r,Us.g,Us.b,T,r)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,T=1){a.set(x),o=T,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(x){o=x,p(a,o)},render:g,addToRenderList:S,dispose:m}}function rp(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,a=!1;function o(I,G,q,L,k){let J=!1;const z=h(I,L,q,G);r!==z&&(r=z,l(r.object)),J=f(I,L,q,k),J&&g(I,L,q,k),k!==null&&e.update(k,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,b(I,G,q,L),k!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function c(){return i.createVertexArray()}function l(I){return i.bindVertexArray(I)}function u(I){return i.deleteVertexArray(I)}function h(I,G,q,L){const k=L.wireframe===!0;let J=n[G.id];J===void 0&&(J={},n[G.id]=J);const z=I.isInstancedMesh===!0?I.id:0;let te=J[z];te===void 0&&(te={},J[z]=te);let W=te[q.id];W===void 0&&(W={},te[q.id]=W);let Q=W[k];return Q===void 0&&(Q=d(c()),W[k]=Q),Q}function d(I){const G=[],q=[],L=[];for(let k=0;k<t;k++)G[k]=0,q[k]=0,L[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:q,attributeDivisors:L,object:I,attributes:{},index:null}}function f(I,G,q,L){const k=r.attributes,J=G.attributes;let z=0;const te=q.getAttributes();for(const W in te)if(te[W].location>=0){const j=k[W];let Se=J[W];if(Se===void 0&&(W==="instanceMatrix"&&I.instanceMatrix&&(Se=I.instanceMatrix),W==="instanceColor"&&I.instanceColor&&(Se=I.instanceColor)),j===void 0||j.attribute!==Se||Se&&j.data!==Se.data)return!0;z++}return r.attributesNum!==z||r.index!==L}function g(I,G,q,L){const k={},J=G.attributes;let z=0;const te=q.getAttributes();for(const W in te)if(te[W].location>=0){let j=J[W];j===void 0&&(W==="instanceMatrix"&&I.instanceMatrix&&(j=I.instanceMatrix),W==="instanceColor"&&I.instanceColor&&(j=I.instanceColor));const Se={};Se.attribute=j,j&&j.data&&(Se.data=j.data),k[W]=Se,z++}r.attributes=k,r.attributesNum=z,r.index=L}function S(){const I=r.newAttributes;for(let G=0,q=I.length;G<q;G++)I[G]=0}function p(I){m(I,0)}function m(I,G){const q=r.newAttributes,L=r.enabledAttributes,k=r.attributeDivisors;q[I]=1,L[I]===0&&(i.enableVertexAttribArray(I),L[I]=1),k[I]!==G&&(i.vertexAttribDivisor(I,G),k[I]=G)}function x(){const I=r.newAttributes,G=r.enabledAttributes;for(let q=0,L=G.length;q<L;q++)G[q]!==I[q]&&(i.disableVertexAttribArray(q),G[q]=0)}function T(I,G,q,L,k,J,z){z===!0?i.vertexAttribIPointer(I,G,q,k,J):i.vertexAttribPointer(I,G,q,L,k,J)}function b(I,G,q,L){S();const k=L.attributes,J=q.getAttributes(),z=G.defaultAttributeValues;for(const te in J){const W=J[te];if(W.location>=0){let Q=k[te];if(Q===void 0&&(te==="instanceMatrix"&&I.instanceMatrix&&(Q=I.instanceMatrix),te==="instanceColor"&&I.instanceColor&&(Q=I.instanceColor)),Q!==void 0){const j=Q.normalized,Se=Q.itemSize,Ie=e.get(Q);if(Ie===void 0)continue;const K=Ie.buffer,pe=Ie.type,xe=Ie.bytesPerElement,Ae=pe===i.INT||pe===i.UNSIGNED_INT||Q.gpuType===Na;if(Q.isInterleavedBufferAttribute){const me=Q.data,Ue=me.isInterleavedBuffer===!0?me.stride:me.itemSize,at=Q.offset;if(me.isInstancedInterleavedBuffer||me.isInstancedBufferAttribute){for(let Re=0;Re<W.locationSize;Re++)m(W.location+Re,me.meshPerAttribute);I.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=me.meshPerAttribute*me.count)}else for(let Re=0;Re<W.locationSize;Re++)p(W.location+Re);i.bindBuffer(i.ARRAY_BUFFER,K);for(let Re=0;Re<W.locationSize;Re++)T(W.location+Re,Se/W.locationSize,pe,j,Ue*xe,(at+Se/W.locationSize*Re)*xe,Ae)}else{if(Q.isInstancedBufferAttribute){for(let me=0;me<W.locationSize;me++)m(W.location+me,Q.meshPerAttribute);I.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let me=0;me<W.locationSize;me++)p(W.location+me);i.bindBuffer(i.ARRAY_BUFFER,K);for(let me=0;me<W.locationSize;me++)T(W.location+me,Se/W.locationSize,pe,j,Se*xe,Se/W.locationSize*me*xe,Ae)}}else if(z!==void 0){const j=z[te];if(j!==void 0)switch(j.length){case 2:i.vertexAttrib2fv(W.location,j);break;case 3:i.vertexAttrib3fv(W.location,j);break;case 4:i.vertexAttrib4fv(W.location,j);break;default:i.vertexAttrib1fv(W.location,j)}}}}x()}function w(){N();for(const I in n){const G=n[I];for(const q in G){const L=G[q];for(const k in L){const J=L[k];for(const z in J)u(J[z].object),delete J[z];delete L[k]}}delete n[I]}}function E(I){if(n[I.id]===void 0)return;const G=n[I.id];for(const q in G){const L=G[q];for(const k in L){const J=L[k];for(const z in J)u(J[z].object),delete J[z];delete L[k]}}delete n[I.id]}function _(I){for(const G in n){const q=n[G];for(const L in q){const k=q[L];if(k[I.id]===void 0)continue;const J=k[I.id];for(const z in J)u(J[z].object),delete J[z];delete k[I.id]}}}function y(I){for(const G in n){const q=n[G],L=I.isInstancedMesh===!0?I.id:0,k=q[L];if(k!==void 0){for(const J in k){const z=k[J];for(const te in z)u(z[te].object),delete z[te];delete k[J]}delete q[L],Object.keys(q).length===0&&delete n[G]}}}function N(){C(),a=!0,r!==s&&(r=s,l(r.object))}function C(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:N,resetDefaultState:C,dispose:w,releaseStatesOfGeometry:E,releaseStatesOfObject:y,releaseStatesOfProgram:_,initAttributes:S,enableAttribute:p,disableUnusedAttributes:x}}function ap(i,e,t){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function a(c,l,u){u!==0&&(i.drawArraysInstanced(n,c,l,u),t.update(l,n,u))}function o(c,l,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,u);let d=0;for(let f=0;f<u;f++)d+=l[f];t.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function op(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const _=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(_.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(_){return!(_!==ln&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(_){const y=_===nn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(_!==Gt&&_!==jt&&!y&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(_){if(_==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";_="mediump"}return _==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const u=c(l);u!==l&&(Ce("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=t.logarithmicDepthBuffer===!0&&h===!1;t.reversedDepthBuffer===!0&&h===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&h===!0&&Ce("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:x,maxVaryings:T,maxFragmentUniforms:b,maxSamples:w,samples:E}}function lp(i){const e=this;let t=null,n=0,s=!1,r=!1;const a=new Un,o=new Le,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,S=h.clipIntersection,p=h.clipShadows,m=i.get(h);if(!s||g===null||g.length===0||r&&!p)r?u(null):l();else{const x=r?0:n,T=x*4;let b=m.clippingState||null;c.value=b,b=u(g,d,T,f);for(let w=0;w!==T;++w)b[w]=t[w];m.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,f,g){const S=h!==null?h.length:0;let p=null;if(S!==0){if(p=c.value,g!==!0||p===null){const m=f+S*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let T=0,b=f;T!==S;++T,b+=4)a.copy(h[T]).applyMatrix4(x,o),a.normal.toArray(p,b),p[b+3]=a.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,p}}class ja extends tn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new sc(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new os(5,5,5),r=new un({name:"CubemapFromEquirect",uniforms:Ri(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:Si});r.uniforms.tEquirect.value=t;const a=new Yt(s,r),o=t.minFilter;return t.minFilter===On&&(t.minFilter=Ct),new ba(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}}const Qo=256,cp=3,hp=20,pc=256,mc=16,up=3,dp=new F,fp=new De;class Qs{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ba(1,10,null),this._boxMesh=new Yt(new os(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){const{size:a=256,position:o=dp}=r,c=this._renderer;this._setSize(a);const l=this._allocateTarget(),u=this._getSourceTarget(!0);t>0&&(u.texture.mipmapsAutoUpdate=!1);const h=c.autoClear,d=c.autoClearColor,f=c.autoClearDepth,g=c.autoClearStencil,S=e.background;c.autoClear=!0,c.autoClearColor=!0,c.autoClearDepth=!0,c.autoClearStencil=!0,S===null&&(e.background=c.getClearColor(fp));const p=new ba(n,s,u);return p.position.copy(o),p.update(c,e),c.autoClear=h,c.autoClearColor=d,c.autoClearDepth=f,c.autoClearStencil=g,e.background=S,t>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(l,t)),this._applyPMREM(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=tl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=el(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Qo,Yl(e))}_fromTexture(e,t){e.mapping===bi||e.mapping===es?this._setSize(e.image.length===0?Qo:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);const n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){const e=this._cubeSize,t=jo(e,!1,!1),n=Math.log2(e)-cp;for(let s=0;s<=n;s++)t.texture.mipmaps.push({width:e>>s,height:e>>s});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){const t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=jo(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){const s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=e,r.activeMipmapLevel=t;const a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,s),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===bi||e.mapping===es?(this._cubemapMaterial===null&&(this._cubemapMaterial=tl()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=el()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=pp(),this._integrationMaterial=mp());const t=this._cubeSize,n=e.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;const r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/mc);for(let a=0;a<=n;a++){const o=Qs.lodToRoughness(a,n);if(a>n-up)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{const c=o>0?Math.log2(t)+.5*Math.log2(6/(pc*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=c,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=gp());const n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(e,0,n),s.envMap.value=e.texture,this._renderCube(r,0,n)}}function jo(i,e,t){return new ja(i,{minFilter:On,generateMipmaps:e,type:nn,colorSpace:$s,depthBuffer:t})}function ls(i,e,t){return new un({name:i,uniforms:e,vertexShader:Oe.cube_vert,fragmentShader:t,side:It,blending:Si,depthTest:!1,depthWrite:!1})}function pp(){return ls("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${pc}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function mp(){return ls("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:mc}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function gp(){return ls("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${hp}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function el(){return ls("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function tl(){return ls("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function _p(i){let e=new WeakMap,t=new WeakMap,n=null;function s(d,f=!1){return d==null?null:f?a(d):r(d)}function r(d){if(d&&d.isTexture){const f=d.mapping;if(f===ar||f===or)if(e.has(d)){const g=e.get(d).texture;return o(g,d.mapping)}else{const g=d.image;if(g&&g.height>0){const S=new ja(g.height);return S.fromEquirectangularTexture(i,d),e.set(d,S),d.addEventListener("dispose",l),o(S.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture&&d.isPMREMTexture!==!0){const f=d.mapping,g=f===ar||f===or,S=f===bi||f===es;if(g||S){let p=t.get(d);const m=p!==void 0?p.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return n===null&&(n=new Qs(i)),p=g?n.fromEquirectangular(d,p):n.fromCubemap(d,p),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),p.texture;if(p!==void 0)return p.texture;{const x=d.image;return g&&x&&x.height>0||S&&x&&c(x)?(n===null&&(n=new Qs(i)),p=g?n.fromEquirectangular(d):n.fromCubemap(d),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),d.addEventListener("dispose",u),p.texture):null}}}return d}function o(d,f){return f===ar?d.mapping=bi:f===or&&(d.mapping=es),d}function c(d){let f=0;const g=6;for(let S=0;S<g;S++)d[S]!==void 0&&f++;return f===g}function l(d){const f=d.target;f.removeEventListener("dispose",l);const g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function u(d){const f=d.target;f.removeEventListener("dispose",u);const g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function h(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:h}}function xp(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&ks("WebGLRenderer: "+n+" extension not supported."),s}}}function vp(i,e,t,n){const s={},r=new WeakMap,a=new FinalizationRegistry(g=>delete s[g]);function o(g){c(g.target)}function c(g){g.index!==null&&e.remove(g.index);for(const p in g.attributes)e.remove(g.attributes[p]);g.removeEventListener("dispose",o),delete s[g.id],a.unregister(g);const S=r.get(g);S&&(e.remove(S),r.delete(g)),n.releaseStatesOfGeometry(g),g.isInstancedBufferGeometry===!0&&delete g._maxInstanceCount,t.memory.geometries--}function l(g,S){return s[S.id]!==void 0||(S.addEventListener("dispose",o),s[S.id]=new WeakRef(S),a.register(S,S.id,S),t.memory.geometries++),S}function u(g){const S=g.attributes;for(const p in S)e.update(S[p],i.ARRAY_BUFFER)}function h(g){const S=g.index,p=g.attributes.position;let m=0;if(p===void 0)return;const x=S!==null?S.array.length:p.array.length/3-1,T=p.count>=65535?tc:ec,b=new T(Math.ceil(x/3)*6,1),w=b.array;if(S!==null){const _=S.array;m=S.version;for(let y=0,N=0;y<x;y+=3){const C=_[y+0],I=_[y+1],G=_[y+2];w[N++]=C,w[N++]=I,w[N++]=I,w[N++]=G,w[N++]=G,w[N++]=C}}else{m=p.version;for(let _=0,y=0;_<x;_+=3){const N=_+0,C=_+1,I=_+2;w[y++]=N,w[y++]=C,w[y++]=C,w[y++]=I,w[y++]=I,w[y++]=N}}b.version=m;const E=r.get(g);E&&e.remove(E),r.set(g,b)}function d(g){const S=r.get(g);if(S){const p=g.index;p!==null&&S.version<p.version&&h(g)}else h(g);return r.get(g)}function f(){for(const g in s){const S=s[g].deref();S!==void 0&&c(S)}}return{get:l,update:u,getWireframeAttribute:d,dispose:f}}function Mp(i,e,t){let n;function s(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function c(h,d){i.drawElements(n,d,r,h*a),t.update(d,n,1)}function l(h,d,f){f!==0&&(i.drawElementsInstanced(n,d,r,h*a,f),t.update(d,n,f))}function u(h,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,h,0,f);let S=0;for(let p=0;p<f;p++)S+=d[p];t.update(S,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Sp(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Ye("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Ep(i,e,t){const n=new WeakMap,s=new it;function r(a,o,c){const l=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(o);if(d===void 0||d.count!==h){let C=function(){y.dispose(),n.delete(o),o.removeEventListener("dispose",C)};var f=C;d!==void 0&&d.texture.dispose();const g=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,p=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],x=o.morphAttributes.normal||[],T=o.morphAttributes.color||[];let b=0;g===!0&&(b=1),S===!0&&(b=2),p===!0&&(b=3);let w=o.attributes.position.count*b,E=1;w>e.maxTextureSize&&(E=Math.ceil(w/e.maxTextureSize),w=e.maxTextureSize);const _=new Float32Array(w*E*4*h),y=new $l(_,w,E,h);y.type=jt,y.needsUpdate=!0;const N=b*4;for(let I=0;I<h;I++){const G=m[I],q=x[I],L=T[I],k=w*E*4*I;for(let J=0;J<G.count;J++){const z=J*N;g===!0&&(s.fromBufferAttribute(G,J),_[k+z+0]=s.x,_[k+z+1]=s.y,_[k+z+2]=s.z,_[k+z+3]=0),S===!0&&(s.fromBufferAttribute(q,J),_[k+z+4]=s.x,_[k+z+5]=s.y,_[k+z+6]=s.z,_[k+z+7]=0),p===!0&&(s.fromBufferAttribute(L,J),_[k+z+8]=s.x,_[k+z+9]=s.y,_[k+z+10]=s.z,_[k+z+11]=L.itemSize===4?s.w:1)}}d={count:h,texture:y,size:new ze(w,E)},n.set(o,d),o.addEventListener("dispose",C)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let g=0;for(let p=0;p<l.length;p++)g+=l[p];const S=o.morphTargetsRelative?1:1-g;c.getUniforms().setValue(i,"morphTargetBaseInfluence",S),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function yp(i,e,t,n,s){let r=new WeakMap;function a(l){const u=s.render.frame,h=l.geometry,d=e.get(l,h);if(r.get(d)!==u&&(e.update(d),r.set(d,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==u&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,u))),l.isSkinnedMesh){const f=l.skeleton;r.get(f)!==u&&(f.update(),r.set(f,u))}return d}function o(){r=new WeakMap}function c(l){const u=l.target;u.removeEventListener("dispose",c),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}const bp={[Cl]:"LINEAR_TONE_MAPPING",[Pl]:"REINHARD_TONE_MAPPING",[Ll]:"CINEON_TONE_MAPPING",[Ia]:"ACES_FILMIC_TONE_MAPPING",[Il]:"AGX_TONE_MAPPING",[Nl]:"NEUTRAL_TONE_MAPPING",[Dl]:"CUSTOM_TONE_MAPPING"};function Tp(i,e,t,n,s,r){const a=new tn(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null,l=null;const u=new dn;u.setAttribute("position",new yt([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new yt([0,2,0,0,2,0],2));const h=new cu({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Yt(u,h),f=new uc(-1,1,1,-1,0,1);let g=null,S=null,p=!1,m,x=null,T=[],b=!1;this.setSize=function(w,E){a.setSize(w,E),o!==null&&o.setSize(w,E),c!==null&&c.setSize(w,E);for(let _=0;_<T.length;_++){const y=T[_];y.setSize&&y.setSize(w,E)}},this.setEffects=function(w){T=w,b=T.length>0&&T[0].isRenderPass===!0;const E=a.width,_=a.height;T.length>0&&o===null&&(o=new tn(E,_,{type:nn,depthBuffer:!1,stencilBuffer:!1}),c=new tn(E,_,{type:nn,depthBuffer:!1,stencilBuffer:!1}));const y=s===!0&&T.some(N=>N.needsDepthTexture===!0);y!==(a.depthTexture!==null)&&(y===!0&&l===null&&(l=new wi(E,_),r===!0&&(l.format=Bn,l.type=Ti)),a.dispose(),a.depthTexture=y?l:null,a.resolveDepthBuffer=y,a.storeMultisampledDepthBuffer=y);for(let N=0;N<T.length;N++){const C=T[N];C.setSize&&C.setSize(E,_),y&&C.needsDepthTexture===!0&&C.setDepthTexture&&C.setDepthTexture(l)}},this.begin=function(w,E){if(p||w.toneMapping===En&&T.length===0)return!1;if(x=E,E!==null){const _=E.width,y=E.height;(a.width!==_||a.height!==y)&&this.setSize(_,y)}return b===!1&&w.setRenderTarget(a),m=w.toneMapping,w.toneMapping=En,!0},this.hasRenderPass=function(){return b},this.end=function(w,E){w.toneMapping=m,p=!0;let _=a,y=o;for(let N=0;N<T.length;N++){const C=T[N];C.enabled!==!1&&(C.render(w,y,_,E),C.needsSwap!==!1&&(_=y,y=y===o?c:o))}if(g!==w.outputColorSpace||S!==w.toneMapping){g=w.outputColorSpace,S=w.toneMapping,h.defines={},We.getTransfer(g)===$e&&(h.defines.SRGB_TRANSFER="");const N=bp[S];N&&(h.defines[N]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=_.texture,w.setRenderTarget(x),w.render(d,f),x=null,p=!1},this.isCompositing=function(){return p},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),u.dispose(),h.dispose()}}const gc=new Et,_c=new wi(1,1),xc=new rc(1),vc=new $l,Mc=new Hh,Sc=new sc,nl=[],il=[],sl=new Float32Array(16),rl=new Float32Array(9),al=new Float32Array(4);function Fi(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=nl[s];if(r===void 0&&(r=new Float32Array(s),nl[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function ft(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function pt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function nr(i,e){let t=il[e];t===void 0&&(t=new Int32Array(e),il[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Ap(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function wp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ft(t,e))return;i.uniform2fv(this.addr,e),pt(t,e)}}function Rp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(ft(t,e))return;i.uniform3fv(this.addr,e),pt(t,e)}}function Cp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ft(t,e))return;i.uniform4fv(this.addr,e),pt(t,e)}}function Pp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ft(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),pt(t,e)}else{if(ft(t,n))return;al.set(n),i.uniformMatrix2fv(this.addr,!1,al),pt(t,n)}}function Lp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ft(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),pt(t,e)}else{if(ft(t,n))return;rl.set(n),i.uniformMatrix3fv(this.addr,!1,rl),pt(t,n)}}function Dp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ft(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),pt(t,e)}else{if(ft(t,n))return;sl.set(n),i.uniformMatrix4fv(this.addr,!1,sl),pt(t,n)}}function Ip(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Np(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ft(t,e))return;i.uniform2iv(this.addr,e),pt(t,e)}}function Up(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ft(t,e))return;i.uniform3iv(this.addr,e),pt(t,e)}}function Fp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ft(t,e))return;i.uniform4iv(this.addr,e),pt(t,e)}}function Op(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Bp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ft(t,e))return;i.uniform2uiv(this.addr,e),pt(t,e)}}function zp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ft(t,e))return;i.uniform3uiv(this.addr,e),pt(t,e)}}function Gp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ft(t,e))return;i.uniform4uiv(this.addr,e),pt(t,e)}}function ir(i){return i.version===0&&(i.compareFunction=Wl,i.needsUpdate=!0),i}function Hp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=ir(_c):r=gc,t.setTexture2D(e||r,s)}function kp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Mc,s)}function Vp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=ir(xc):r=Sc,t.setTextureCube(e||r,s)}function Wp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||vc,s)}function Xp(i){switch(i){case 5126:return Ap;case 35664:return wp;case 35665:return Rp;case 35666:return Cp;case 35674:return Pp;case 35675:return Lp;case 35676:return Dp;case 5124:case 35670:return Ip;case 35667:case 35671:return Np;case 35668:case 35672:return Up;case 35669:case 35673:return Fp;case 5125:return Op;case 36294:return Bp;case 36295:return zp;case 36296:return Gp;case 35678:case 36198:case 36298:case 36306:case 35682:return Hp;case 35679:case 36299:case 36307:return kp;case 35680:case 36300:case 36308:case 36293:return Vp;case 36289:case 36303:case 36311:case 36292:return Wp}}function qp(i,e){i.uniform1fv(this.addr,e)}function Yp(i,e){const t=Fi(e,this.size,2);i.uniform2fv(this.addr,t)}function Kp(i,e){const t=Fi(e,this.size,3);i.uniform3fv(this.addr,t)}function Zp(i,e){const t=Fi(e,this.size,4);i.uniform4fv(this.addr,t)}function $p(i,e){const t=Fi(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Jp(i,e){const t=Fi(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Qp(i,e){const t=Fi(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function jp(i,e){i.uniform1iv(this.addr,e)}function em(i,e){i.uniform2iv(this.addr,e)}function tm(i,e){i.uniform3iv(this.addr,e)}function nm(i,e){i.uniform4iv(this.addr,e)}function im(i,e){i.uniform1uiv(this.addr,e)}function sm(i,e){i.uniform2uiv(this.addr,e)}function rm(i,e){i.uniform3uiv(this.addr,e)}function am(i,e){i.uniform4uiv(this.addr,e)}function om(i,e,t){const n=this.cache,s=e.length,r=nr(t,s);ft(n,r)||(i.uniform1iv(this.addr,r),pt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ir(_c):a=gc;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function lm(i,e,t){const n=this.cache,s=e.length,r=nr(t,s);ft(n,r)||(i.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Mc,r[a])}function cm(i,e,t){const n=this.cache,s=e.length,r=nr(t,s);ft(n,r)||(i.uniform1iv(this.addr,r),pt(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=ir(xc):a=Sc;for(let o=0;o!==s;++o)t.setTextureCube(e[o]||a,r[o])}function hm(i,e,t){const n=this.cache,s=e.length,r=nr(t,s);ft(n,r)||(i.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||vc,r[a])}function um(i){switch(i){case 5126:return qp;case 35664:return Yp;case 35665:return Kp;case 35666:return Zp;case 35674:return $p;case 35675:return Jp;case 35676:return Qp;case 5124:case 35670:return jp;case 35667:case 35671:return em;case 35668:case 35672:return tm;case 35669:case 35673:return nm;case 5125:return im;case 36294:return sm;case 36295:return rm;case 36296:return am;case 35678:case 36198:case 36298:case 36306:case 35682:return om;case 35679:case 36299:case 36307:return lm;case 35680:case 36300:case 36308:case 36293:return cm;case 36289:case 36303:case 36311:case 36292:return hm}}class dm{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Xp(t.type)}}class fm{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=um(t.type)}}class pm{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(e,t[o.id],n)}}}const Dr=/(\w+)(\])?(\[|\.)?/g;function ol(i,e){i.seq.push(e),i.map[e.id]=e}function mm(i,e,t){const n=i.name,s=n.length;for(Dr.lastIndex=0;;){const r=Dr.exec(n),a=Dr.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){ol(t,l===void 0?new dm(o,i,e):new fm(o,i,e));break}else{let h=t.map[o];h===void 0&&(h=new pm(o),ol(t,h)),t=h}}}class Vs{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);mm(o,c,this)}const s=[],r=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){const o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const a=e[s];a.id in t&&n.push(a)}return n}}function ll(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const gm=37297;let _m=0;function xm(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const cl=new Le;function vm(i){We._getMatrix(cl,We.workingColorSpace,i);const e=`mat3( ${cl.elements.map(t=>t.toFixed(4))} )`;switch(We.getTransfer(i)){case Js:return[e,"LinearTransferOETF"];case $e:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function hl(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+xm(i.getShaderSource(e),o)}else return r}function Mm(i,e){const t=vm(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const Sm={[Cl]:"Linear",[Pl]:"Reinhard",[Ll]:"Cineon",[Ia]:"ACESFilmic",[Il]:"AgX",[Nl]:"Neutral",[Dl]:"Custom"};function Em(i,e){const t=Sm[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Fs=new F;function ym(){We.getLuminanceCoefficients(Fs);const i=Fs.x.toFixed(4),e=Fs.y.toFixed(4),t=Fs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function bm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Yi).join(`
`)}function Tm(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Am(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Yi(i){return i!==""}function ul(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function dl(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const wm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ta(i){return i.replace(wm,Rm)}function Rm(i,e){const t=Oe[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return Ta(t)}const Cm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function fl(i){return i.replace(Cm,Pm)}function Pm(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function pl(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Lm={[Zi]:"SHADOWMAP_TYPE_PCF",[qi]:"SHADOWMAP_TYPE_VSM"};function Dm(i){return Lm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Im={[es]:"ENVMAP_MODE_REFRACTION"};function Nm(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Im[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Um={[Da]:"ENVMAP_BLENDING_MULTIPLY",[sh]:"ENVMAP_BLENDING_MIX",[rh]:"ENVMAP_BLENDING_ADD"};function Fm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Um[i.combine]||"ENVMAP_BLENDING_NONE"}function Om(i,e,t,n){const s=i.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=Dm(t),l=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=Nm(t),h=Fm(t),d=bm(t),f=Tm(r),g=s.createProgram();let S,p,m=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(S=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(Yi).join(`
`),S.length>0&&(S+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(Yi).join(`
`),p.length>0&&(p+=`
`)):(S=[pl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Yi).join(`
`),p=[pl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==En?"#define TONE_MAPPING":"",t.toneMapping!==En?Oe.tonemapping_pars_fragment:"",t.toneMapping!==En?Em("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Oe.colorspace_pars_fragment,Mm("linearToOutputTexel",t.outputColorSpace),ym(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Yi).join(`
`)),a=Ta(a),a=ul(a,t),a=dl(a,t),o=Ta(o),o=ul(o,t),o=dl(o,t),a=fl(a),o=fl(o),t.isRawShaderMaterial!==!0&&(m=`#version 300 es
`,S=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+S,p=["#define varying in",t.glslVersion===bo?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===bo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const x=m+S+a,T=m+p+o,b=ll(s,s.VERTEX_SHADER,x),w=ll(s,s.FRAGMENT_SHADER,T);s.attachShader(g,b),s.attachShader(g,w),t.index0AttributeName!==void 0?s.bindAttribLocation(g,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(g,0,"position"),s.linkProgram(g);function E(C){if(i.debug.checkShaderErrors){const I=s.getProgramInfoLog(g)||"",G=s.getShaderInfoLog(b)||"",q=s.getShaderInfoLog(w)||"",L=I.trim(),k=G.trim(),J=q.trim();let z=!0,te=!0;if(s.getProgramParameter(g,s.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,g,b,w);else{const W=hl(s,b,"vertex"),Q=hl(s,w,"fragment");Ye("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(g,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+L+`
`+W+`
`+Q)}else L!==""?Ce("WebGLProgram: Program Info Log:",L):(k===""||J==="")&&(te=!1);te&&(C.diagnostics={runnable:z,programLog:L,vertexShader:{log:k,prefix:S},fragmentShader:{log:J,prefix:p}})}s.deleteShader(b),s.deleteShader(w),_=new Vs(s,g),y=Am(s,g)}let _;this.getUniforms=function(){return _===void 0&&E(this),_};let y;this.getAttributes=function(){return y===void 0&&E(this),y};let N=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=s.getProgramParameter(g,gm)),N},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(g),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=_m++,this.cacheKey=e,this.usedTimes=1,this.program=g,this.vertexShader=b,this.fragmentShader=w,this}let Bm=0;class zm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Gm(e),t.set(e,n)),n}}class Gm{constructor(e){this.id=Bm++,this.code=e,this.usedTimes=0}}function Hm(i){return i===ti||i===Ys||i===Ks}function km(i,e,t,n,s,r){const a=new Jl,o=new zm,c=new Set,l=[],u=new Map,h=n.logarithmicDepthBuffer,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function f(_){return c.add(_),_===0?"uv":`uv${_}`}function g(_,y,N,C,I,G){const q=C.fog,L=I.geometry,k=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?C.environment:null,J=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,z=e.get(_.envMap||k,J),te=d[_.type];let W=n.precision;_.precision!==null&&(W=n.getMaxPrecision(_.precision),W!==_.precision&&Ce("WebGLProgram.getParameters:",_.precision,"not supported, using",W,"instead."));const Q=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,j=Q!==void 0?Q.length:0;let Se=0;L.morphAttributes.position!==void 0&&(Se=1),L.morphAttributes.normal!==void 0&&(Se=2),L.morphAttributes.color!==void 0&&(Se=3);let Ie,K,pe,xe;if(te){const de=on[te];Ie=de.vertexShader,K=de.fragmentShader}else{Ie=_.vertexShader,K=_.fragmentShader;const de=o.getVertexShaderStage(_),Ze=o.getFragmentShaderStage(_);o.update(_,de,Ze),pe=de.id,xe=Ze.id}const Ae=i.getRenderTarget(),me=i.state.buffers.depth.getReversed(),Ue=I.isInstancedMesh===!0,at=I.isBatchedMesh===!0,Re=!!_.map,Ke=!!_.matcap,Je=!!z,Ge=Je&&z.isPMREMTexture===!0,Mt=!!_.aoMap,ut=!!_.lightMap,Nt=!!_.bumpMap&&_.wireframe===!1,st=!!_.normalMap,sn=!!_.displacementMap,mt=!!_.emissiveMap,Ht=!!_.metalnessMap,kt=!!_.roughnessMap,Vt=_.anisotropy>0,D=_.clearcoat>0,Wt=_.diffuseRoughness>0,tt=_.dispersion>0,nt=_.retroreflectivity>0,ue=_.iridescence>0,dt=_.sheen>0,we=_.transmission>0,Pe=Vt&&!!_.anisotropyMap,A=D&&!!_.clearcoatMap,v=D&&!!_.clearcoatNormalMap,O=D&&!!_.clearcoatRoughnessMap,ee=Wt&&!!_.diffuseRoughnessMap,$=ue&&!!_.iridescenceMap,se=ue&&!!_.iridescenceThicknessMap,ce=dt&&!!_.sheenColorMap,X=dt&&!!_.sheenRoughnessMap,Y=!!_.specularMap,ae=!!_.specularColorMap,R=!!_.specularIntensityMap,Z=we&&!!_.transmissionMap,V=we&&!!_.thicknessMap,oe=!!_.gradientMap,ie=!!_.alphaMap,re=_.alphaTest>0,ye=!!_.alphaHash,Be=!!_.extensions;let ne=En;_.toneMapped&&(Ae===null||Ae.isXRRenderTarget===!0)&&(ne=i.toneMapping);const Te=Ge?z.isCompressedCubeTexture?z.image[0].mipmaps:z.mipmaps:null,Fe={shaderID:te,shaderType:_.type,shaderName:_.name,vertexShader:Ie,fragmentShader:K,defines:_.defines,customVertexShaderID:pe,customFragmentShaderID:xe,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:W,batching:at,batchingColor:at&&I._colorsTexture!==null,instancing:Ue,instancingColor:Ue&&I.instanceColor!==null,instancingMorph:Ue&&I.morphTexture!==null,outputColorSpace:Ae===null?i.outputColorSpace:Ae.isXRRenderTarget===!0?Ae.texture.colorSpace:We.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Re,matcap:Ke,envMap:Je,envMapMode:Je&&z.mapping,envMapPMREM:Ge,envMapMaxLod:Ge?Te.length-1:null,envMapSize:Ge?Te[0].width:null,aoMap:Mt,lightMap:ut,bumpMap:Nt,normalMap:st,displacementMap:sn,emissiveMap:mt,normalMapObjectSpace:st&&_.normalMapType===ch,normalMapTangentSpace:st&&_.normalMapType===Zs,packedNormalMap:st&&_.normalMapType===Zs&&Hm(_.normalMap.format),metalnessMap:Ht,roughnessMap:kt,anisotropy:Vt,anisotropyMap:Pe,clearcoat:D,clearcoatMap:A,clearcoatNormalMap:v,clearcoatRoughnessMap:O,diffuseRoughness:Wt,diffuseRoughnessMap:ee,dispersion:tt,retroreflection:nt,iridescence:ue,iridescenceMap:$,iridescenceThicknessMap:se,sheen:dt,sheenColorMap:ce,sheenRoughnessMap:X,specularMap:Y,specularColorMap:ae,specularIntensityMap:R,transmission:we,transmissionMap:Z,thicknessMap:V,gradientMap:oe,opaque:_.transparent===!1&&_.blending===$i&&_.alphaToCoverage===!1,alphaMap:ie,alphaTest:re,alphaHash:ye,combine:_.combine,mapUv:Re&&f(_.map.channel),aoMapUv:Mt&&f(_.aoMap.channel),lightMapUv:ut&&f(_.lightMap.channel),bumpMapUv:Nt&&f(_.bumpMap.channel),normalMapUv:st&&f(_.normalMap.channel),displacementMapUv:sn&&f(_.displacementMap.channel),emissiveMapUv:mt&&f(_.emissiveMap.channel),metalnessMapUv:Ht&&f(_.metalnessMap.channel),roughnessMapUv:kt&&f(_.roughnessMap.channel),anisotropyMapUv:Pe&&f(_.anisotropyMap.channel),clearcoatMapUv:A&&f(_.clearcoatMap.channel),clearcoatNormalMapUv:v&&f(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:O&&f(_.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ee&&f(_.diffuseRoughnessMap.channel),iridescenceMapUv:$&&f(_.iridescenceMap.channel),iridescenceThicknessMapUv:se&&f(_.iridescenceThicknessMap.channel),sheenColorMapUv:ce&&f(_.sheenColorMap.channel),sheenRoughnessMapUv:X&&f(_.sheenRoughnessMap.channel),specularMapUv:Y&&f(_.specularMap.channel),specularColorMapUv:ae&&f(_.specularColorMap.channel),specularIntensityMapUv:R&&f(_.specularIntensityMap.channel),transmissionMapUv:Z&&f(_.transmissionMap.channel),thicknessMapUv:V&&f(_.thicknessMap.channel),alphaMapUv:ie&&f(_.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(st||Vt),vertexNormals:!!L.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!L.attributes.uv&&(Re||ie),fog:!!q,useFog:_.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||L.attributes.normal===void 0&&st===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:me,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:j,morphTextureStride:Se,numSunLights:y.sun.length,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numSunLightShadows:y.sunShadowMap.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numLightProbeGrids:G.filter(de=>de.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&N.length>0,shadowMapType:i.shadowMap.type,toneMapping:ne,decodeVideoTexture:Re&&_.map.isVideoTexture===!0&&We.getTransfer(_.map.colorSpace)===$e,decodeVideoTextureEmissive:mt&&_.emissiveMap.isVideoTexture===!0&&We.getTransfer(_.emissiveMap.colorSpace)===$e,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ft,flipSided:_.side===It,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Be&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Be&&_.extensions.multiDraw===!0||at)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Fe.vertexUv1s=c.has(1),Fe.vertexUv2s=c.has(2),Fe.vertexUv3s=c.has(3),c.clear(),Fe}function S(_){const y=[];if(_.shaderID?y.push(_.shaderID):(y.push(_.customVertexShaderID),y.push(_.customFragmentShaderID)),_.defines!==void 0)for(const N in _.defines)y.push(N),y.push(_.defines[N]);return _.isRawShaderMaterial===!1&&(p(y,_),m(y,_),y.push(i.outputColorSpace)),y.push(_.customProgramCacheKey),y.join()}function p(_,y){_.push(y.precision),_.push(y.outputColorSpace),_.push(y.envMapMode),_.push(y.envMapPMREM),_.push(y.envMapMaxLod),_.push(y.envMapSize),_.push(y.mapUv),_.push(y.alphaMapUv),_.push(y.lightMapUv),_.push(y.aoMapUv),_.push(y.bumpMapUv),_.push(y.normalMapUv),_.push(y.displacementMapUv),_.push(y.emissiveMapUv),_.push(y.metalnessMapUv),_.push(y.roughnessMapUv),_.push(y.anisotropyMapUv),_.push(y.clearcoatMapUv),_.push(y.clearcoatNormalMapUv),_.push(y.clearcoatRoughnessMapUv),_.push(y.diffuseRoughnessMapUv),_.push(y.iridescenceMapUv),_.push(y.iridescenceThicknessMapUv),_.push(y.sheenColorMapUv),_.push(y.sheenRoughnessMapUv),_.push(y.specularMapUv),_.push(y.specularColorMapUv),_.push(y.specularIntensityMapUv),_.push(y.transmissionMapUv),_.push(y.thicknessMapUv),_.push(y.combine),_.push(y.fogExp2),_.push(y.sizeAttenuation),_.push(y.morphTargetsCount),_.push(y.numSunLights),_.push(y.numDirLights),_.push(y.numPointLights),_.push(y.numSpotLights),_.push(y.numSpotLightMaps),_.push(y.numHemiLights),_.push(y.numRectAreaLights),_.push(y.numSunLightShadows),_.push(y.numDirLightShadows),_.push(y.numPointLightShadows),_.push(y.numSpotLightShadows),_.push(y.numSpotLightShadowsWithMaps),_.push(y.numLightProbes),_.push(y.numLightProbeGrids),_.push(y.shadowMapType),_.push(y.toneMapping),_.push(y.numClippingPlanes),_.push(y.numClipIntersection),_.push(y.depthPacking)}function m(_,y){a.disableAll(),y.instancing&&a.enable(0),y.instancingColor&&a.enable(1),y.instancingMorph&&a.enable(2),y.matcap&&a.enable(3),y.envMap&&a.enable(4),y.normalMapObjectSpace&&a.enable(5),y.normalMapTangentSpace&&a.enable(6),y.clearcoat&&a.enable(7),y.iridescence&&a.enable(8),y.alphaTest&&a.enable(9),y.vertexColors&&a.enable(10),y.vertexAlphas&&a.enable(11),y.vertexUv1s&&a.enable(12),y.vertexUv2s&&a.enable(13),y.vertexUv3s&&a.enable(14),y.vertexTangents&&a.enable(15),y.anisotropy&&a.enable(16),y.alphaHash&&a.enable(17),y.batching&&a.enable(18),y.dispersion&&a.enable(19),y.retroreflection&&a.enable(24),y.diffuseRoughness&&a.enable(25),y.batchingColor&&a.enable(20),y.gradientMap&&a.enable(21),y.packedNormalMap&&a.enable(22),y.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reversedDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),y.numLightProbeGrids>0&&a.enable(22),y.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function x(_){const y=d[_.type];let N;if(y){const C=on[y];N=au.clone(C.uniforms)}else N=_.uniforms;return N}function T(_,y){let N=u.get(y);return N!==void 0?++N.usedTimes:(N=new Om(i,y,_,s),l.push(N),u.set(y,N)),N}function b(_){if(--_.usedTimes===0){const y=l.indexOf(_);l[y]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function w(_){o.remove(_)}function E(){o.dispose()}return{getParameters:g,getProgramCacheKey:S,getUniforms:x,acquireProgram:T,releaseProgram:b,releaseShaderCache:w,programs:l,dispose:E}}function Vm(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Wm(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function ml(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function gl(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,g,S,p,m){let x=i[e];return x===void 0?(x={id:d.id,object:d,geometry:f,material:g,materialVariant:a(d),groupOrder:S,renderOrder:d.renderOrder,z:p,group:m},i[e]=x):(x.id=d.id,x.object=d,x.geometry=f,x.material=g,x.materialVariant=a(d),x.groupOrder=S,x.renderOrder=d.renderOrder,x.z=p,x.group=m),e++,x}function c(d,f,g,S,p,m,x){x.reversedDepth===!0&&(p=-p);const T=o(d,f,g,S,p,m);g.transmission>0?n.push(T):g.transparent===!0?s.push(T):t.push(T)}function l(d,f,g,S,p,m){const x=o(d,f,g,S,p,m);g.transmission>0?n.unshift(x):g.transparent===!0?s.unshift(x):t.unshift(x)}function u(d,f){t.length>1&&t.sort(d||Wm),n.length>1&&n.sort(f||ml),s.length>1&&s.sort(f||ml)}function h(){for(let d=e,f=i.length;d<f;d++){const g=i[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:h,sort:u}}function Xm(){let i=new WeakMap;function e(n,s){const r=i.get(n);let a;return r===void 0?(a=new gl,i.set(n,[a])):s>=r.length?(a=new gl,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function qm(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new F,color:new De};break;case"SpotLight":t={position:new F,direction:new F,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new F,color:new De,distance:0,decay:0};break;case"HemisphereLight":t={direction:new F,skyColor:new De,groundColor:new De};break;case"RectAreaLight":t={color:new De,position:new F,halfWidth:new F,halfHeight:new F};break}return i[e.id]=t,t}}}function Ym(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Km=0;function Zm(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function $m(i){const e=new qm,t=Ym(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new F);const s=new F,r=new je,a=new je;function o(l){let u=0,h=0,d=0;for(let G=0;G<9;G++)n.probe[G].set(0,0,0);let f=0,g=0,S=0,p=0,m=0,x=0,T=0,b=0,w=0,E=0,_=0,y=0,N=0,C=0;l.sort(Zm);for(let G=0,q=l.length;G<q;G++){const L=l[G],k=L.color,J=L.intensity,z=L.distance;let te=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===ti?te=L.shadow.map.texture:te=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)u+=k.r*J,h+=k.g*J,d+=k.b*J;else if(L.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(L.sh.coefficients[W],J);C++}else if(L.isSunLight){const W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const Q=L.shadow,j=t.get(L);j.shadowIntensity=Q.intensity,j.shadowBias=Q.bias,j.shadowNormalBias=Q.normalBias,j.shadowRadius=Q.radius,j.shadowMapSize.copy(Q.mapSize).multiply(Q.getFrameExtents()),n.sunShadow[g]=j,n.sunShadowMap[g]=te;const Se=Q.getViewportCount();for(let Ie=0;Ie<Se;Ie++)n.sunShadowMatrix[S+Ie]=Q.getMatrix(Ie),n.sunShadowCascade[S+Ie]=Q._cascadeData[Ie];S+=Se,g++}n.sun[f]=W,f++}else if(L.isDirectionalLight){const W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const Q=L.shadow,j=t.get(L);j.shadowIntensity=Q.intensity,j.shadowBias=Q.bias,j.shadowNormalBias=Q.normalBias,j.shadowRadius=Q.radius,j.shadowMapSize=Q.mapSize,n.directionalShadow[p]=j,n.directionalShadowMap[p]=te,n.directionalShadowMatrix[p]=L.shadow.matrix,w++}n.directional[p]=W,p++}else if(L.isSpotLight){const W=e.get(L);W.position.setFromMatrixPosition(L.matrixWorld),W.color.copy(k).multiplyScalar(J),W.distance=z,W.coneCos=Math.cos(L.angle),W.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),W.decay=L.decay,n.spot[x]=W;const Q=L.shadow;if(L.map&&(n.spotLightMap[y]=L.map,y++,Q.updateMatrices(L),L.castShadow&&N++),n.spotLightMatrix[x]=Q.matrix,L.castShadow){const j=t.get(L);j.shadowIntensity=Q.intensity,j.shadowBias=Q.bias,j.shadowNormalBias=Q.normalBias,j.shadowRadius=Q.radius,j.shadowMapSize=Q.mapSize,n.spotShadow[x]=j,n.spotShadowMap[x]=te,_++}x++}else if(L.isRectAreaLight){const W=e.get(L);W.color.copy(k).multiplyScalar(J),W.halfWidth.set(L.width*.5,0,0),W.halfHeight.set(0,L.height*.5,0),n.rectArea[T]=W,T++}else if(L.isPointLight){const W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),W.distance=L.distance,W.decay=L.decay,L.castShadow){const Q=L.shadow,j=t.get(L);j.shadowIntensity=Q.intensity,j.shadowBias=Q.bias,j.shadowNormalBias=Q.normalBias,j.shadowRadius=Q.radius,j.shadowMapSize=Q.mapSize,j.shadowCameraNear=Q.camera.near,j.shadowCameraFar=Q.camera.far,n.pointShadow[m]=j,n.pointShadowMap[m]=te,n.pointShadowMatrix[m]=L.shadow.matrix,E++}n.point[m]=W,m++}else if(L.isHemisphereLight){const W=e.get(L);W.skyColor.copy(L.color).multiplyScalar(J),W.groundColor.copy(L.groundColor).multiplyScalar(J),n.hemi[b]=W,b++}}T>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=fe.LTC_FLOAT_1,n.rectAreaLTC2=fe.LTC_FLOAT_2):(n.rectAreaLTC1=fe.LTC_HALF_1,n.rectAreaLTC2=fe.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const I=n.hash;(I.sunLength!==f||I.directionalLength!==p||I.pointLength!==m||I.spotLength!==x||I.rectAreaLength!==T||I.hemiLength!==b||I.numSunShadows!==g||I.numDirectionalShadows!==w||I.numPointShadows!==E||I.numSpotShadows!==_||I.numSpotMaps!==y||I.numLightProbes!==C)&&(n.sun.length=f,n.directional.length=p,n.spot.length=x,n.rectArea.length=T,n.point.length=m,n.hemi.length=b,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.directionalShadowMatrix.length=w,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=_,n.spotShadowMap.length=_,n.spotLightMatrix.length=_+y-N,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=N,n.numLightProbes=C,I.sunLength=f,I.directionalLength=p,I.pointLength=m,I.spotLength=x,I.rectAreaLength=T,I.hemiLength=b,I.numSunShadows=g,I.numDirectionalShadows=w,I.numPointShadows=E,I.numSpotShadows=_,I.numSpotMaps=y,I.numLightProbes=C,n.version=Km++)}function c(l,u){let h=0,d=0,f=0,g=0,S=0,p=0;const m=u.matrixWorldInverse;for(let x=0,T=l.length;x<T;x++){const b=l[x];if(b.isSunLight){const w=n.sun[h];w.direction.setFromMatrixPosition(b.matrixWorld),w.direction.transformDirection(m),h++}else if(b.isDirectionalLight){const w=n.directional[d];w.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(m),d++}else if(b.isSpotLight){const w=n.spot[g];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(m),w.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(m),g++}else if(b.isRectAreaLight){const w=n.rectArea[S];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(m),a.identity(),r.copy(b.matrixWorld),r.premultiply(m),a.extractRotation(r),w.halfWidth.set(b.width*.5,0,0),w.halfHeight.set(0,b.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),S++}else if(b.isPointLight){const w=n.point[f];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(m),f++}else if(b.isHemisphereLight){const w=n.hemi[p];w.direction.setFromMatrixPosition(b.matrixWorld),w.direction.transformDirection(m),p++}}}return{setup:o,setupView:c,state:n}}function _l(i){const e=new $m(i),t=[],n=[],s=[];function r(h){u.camera=h,t.length=0,n.length=0,s.length=0}function a(h){h.isLightProbeGrid?s.push(h):t.push(h)}function o(h){n.push(h)}function c(){e.setup(t),s.sort((h,d)=>h.priority-d.priority||h.id-d.id)}function l(h){e.setupView(t,h)}const u={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function Jm(i){let e=new WeakMap;function t(s,r=0){const a=e.get(s);let o;return a===void 0?(o=new _l(i),e.set(s,[o])):r>=a.length?(o=new _l(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Qm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,jm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,eg=[new F(1,0,0),new F(-1,0,0),new F(0,1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1)],tg=[new F(0,-1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1),new F(0,-1,0),new F(0,-1,0)],xl=new je,Wi=new F,Ir=new F;function ng(i,e,t){let n=new rs;const s=new ze,r=new ze,a=new it,o=new cc,c=new hu,l={},u=t.maxTextureSize,h={[ei]:It,[It]:ei,[Ft]:Ft},d=new un({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ze},radius:{value:4}},vertexShader:Qm,fragmentShader:jm}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new dn;g.setAttribute("position",new Hn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Yt(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Zi;let m=this.type;this.render=function(E,_,y){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;this.type===zc&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Zi);const N=i.getRenderTarget(),C=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),G=i.state;G.setBlending(Si),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const q=m!==this.type;q&&_.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(k=>k.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,k=E.length;L<k;L++){const J=E[L],z=J.shadow;if(z===void 0){Ce("WebGLShadowMap:",J,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const te=z.getFrameExtents();s.multiply(te),r.copy(z.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/te.x),s.x=r.x*te.x,z.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/te.y),s.y=r.y*te.y,z.mapSize.y=r.y));const W=i.state.buffers.depth.getReversed();if(z.camera._reversedDepth=W,z.map===null||q===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===qi){if(J.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new tn(s.x,s.y,{format:ti,type:nn,minFilter:Ct,magFilter:Ct,generateMipmaps:!1}),z.map.texture.name=J.name+".shadowMap",z.map.depthTexture=new wi(s.x,s.y,jt),z.map.depthTexture.name=J.name+".shadowMapDepth",z.map.depthTexture.format=kn,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=ct,z.map.depthTexture.magFilter=ct}else J.isPointLight?(z.map=new ja(s.x),z.map.depthTexture=new rc(s.x,cn)):(z.map=new tn(s.x,s.y),z.map.depthTexture=new wi(s.x,s.y,cn)),z.map.depthTexture.name=J.name+".shadowMap",z.map.depthTexture.format=kn,this.type===Zi?(z.map.depthTexture.compareFunction=W?Vl:kl,z.map.depthTexture.minFilter=Ct,z.map.depthTexture.magFilter=Ct):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=ct,z.map.depthTexture.magFilter=ct);z.camera.updateProjectionMatrix()}z.map.isWebGLCubeRenderTarget!==!0&&(z.map.width!==s.x||z.map.height!==s.y)&&z.map.setSize(s.x,s.y);const Q=z.map.isWebGLCubeRenderTarget?6:z.getViewportCount();J.isPointLight!==!0&&z.updateMatrices(J,y);const j=(z.camera.layers.mask&4294967294)!==0?z.camera.layers:y.layers;for(let Se=0;Se<Q;Se++){const Ie=z.getCamera(Se);if(J.isPointLight){const K=z.camera,pe=z.matrix,xe=J.distance||K.far;xe!==K.far&&(K.far=xe,K.updateProjectionMatrix()),Wi.setFromMatrixPosition(J.matrixWorld),K.position.copy(Wi),Ir.copy(K.position),Ir.add(eg[Se]),K.up.copy(tg[Se]),K.lookAt(Ir),K.updateMatrixWorld(),pe.makeTranslation(-Wi.x,-Wi.y,-Wi.z),xl.multiplyMatrices(K.projectionMatrix,K.matrixWorldInverse),z._frustum.setFromProjectionMatrix(xl,K.coordinateSystem,K.reversedDepth)}if(z.map.isWebGLCubeRenderTarget)i.setRenderTarget(z.map,Se),i.clear();else{Se===0&&(i.setRenderTarget(z.map),i.clear());const K=z.getViewport(Se);a.set(r.x*K.x,r.y*K.y,r.x*K.z,r.y*K.w),G.viewport(a)}n=z.getFrustum(Se),b(_,y,Ie,J,j,this.type)}z.isPointLightShadow!==!0&&this.type===qi&&x(z,y),z.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(N,C,I)};function x(E,_){const y=e.update(S);d.defines.VSM_SAMPLES!==E.blurSamples&&(d.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null?E.mapPass=new tn(s.x,s.y,{format:ti,type:nn}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),d.uniforms.shadow_pass.value=E.map.depthTexture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(_,null,y,d,S,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(_,null,y,f,S,null)}function T(E,_,y,N){let C=null;const I=y.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(I!==void 0)C=I;else if(C=y.isPointLight===!0?c:o,i.localClippingEnabled&&_.clipShadows===!0&&Array.isArray(_.clippingPlanes)&&_.clippingPlanes.length!==0||_.displacementMap&&_.displacementScale!==0||_.alphaMap&&_.alphaTest>0||_.map&&_.alphaTest>0||_.alphaToCoverage===!0){const G=C.uuid,q=_.uuid;let L=l[G];L===void 0&&(L={},l[G]=L);let k=L[q];k===void 0&&(k=C.clone(),L[q]=k,_.addEventListener("dispose",w)),C=k}if(C.visible=_.visible,C.wireframe=_.wireframe,N===qi?C.side=_.shadowSide!==null?_.shadowSide:_.side:C.side=_.shadowSide!==null?_.shadowSide:h[_.side],C.alphaMap=_.alphaMap,C.alphaTest=_.alphaToCoverage===!0?.5:_.alphaTest,C.map=_.map,C.clipShadows=_.clipShadows,C.clippingPlanes=_.clippingPlanes,C.clipIntersection=_.clipIntersection,C.displacementMap=_.displacementMap,C.displacementScale=_.displacementScale,C.displacementBias=_.displacementBias,C.wireframeLinewidth=_.wireframeLinewidth,C.linewidth=_.linewidth,y.isPointLight===!0&&C.isMeshDistanceMaterial===!0){const G=i.properties.get(C);G.light=y}return C}function b(E,_,y,N,C,I){if(E.visible===!1)return;if(E.layers.test(C)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&I===qi)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,E.matrixWorld);const L=e.update(E),k=E.material;if(Array.isArray(k)){const J=L.groups;for(let z=0,te=J.length;z<te;z++){const W=J[z],Q=k[W.materialIndex];if(Q&&Q.visible){const j=T(E,Q,N,I);E.onBeforeShadow(i,E,_,y,L,j,W),i.renderBufferDirect(y,null,L,j,E,W),E.onAfterShadow(i,E,_,y,L,j,W)}}}else if(k.visible){const J=T(E,k,N,I);E.onBeforeShadow(i,E,_,y,L,J,null),i.renderBufferDirect(y,null,L,J,E,null),E.onAfterShadow(i,E,_,y,L,J,null)}}const q=E.children;for(let L=0,k=q.length;L<k;L++)b(q[L],_,y,N,C,I)}function w(E){E.target.removeEventListener("dispose",w);for(const y in l){const N=l[y],C=E.target.uuid;C in N&&(N[C].dispose(),delete N[C])}}}function ig(i,e){function t(){let R=!1;const Z=new it;let V=null;const oe=new it(0,0,0,0);return{setMask:function(ie){V!==ie&&!R&&(i.colorMask(ie,ie,ie,ie),V=ie)},setLocked:function(ie){R=ie},setClear:function(ie,re,ye,Be,ne){ne===!0&&(ie*=Be,re*=Be,ye*=Be),Z.set(ie,re,ye,Be),oe.equals(Z)===!1&&(i.clearColor(ie,re,ye,Be),oe.copy(Z))},reset:function(){R=!1,V=null,oe.set(-1,0,0,0)}}}function n(){let R=!1,Z=!1,V=null,oe=null,ie=null;return{setReversed:function(re){if(Z!==re){const ye=e.get("EXT_clip_control");re?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),Z=re;const Be=ie;ie=null,this.setClear(Be)}},getReversed:function(){return Z},setTest:function(re){re?me(i.DEPTH_TEST):Ue(i.DEPTH_TEST)},setMask:function(re){V!==re&&!R&&(i.depthMask(re),V=re)},setFunc:function(re){if(Z&&(re=Mh[re]),oe!==re){switch(re){case zr:i.depthFunc(i.NEVER);break;case Gr:i.depthFunc(i.ALWAYS);break;case Hr:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case kr:i.depthFunc(i.EQUAL);break;case Vr:i.depthFunc(i.GEQUAL);break;case Wr:i.depthFunc(i.GREATER);break;case Xr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}oe=re}},setLocked:function(re){R=re},setClear:function(re){ie!==re&&(ie=re,Z&&(re=1-re),i.clearDepth(re))},reset:function(){R=!1,V=null,oe=null,ie=null,Z=!1}}}function s(){let R=!1,Z=null,V=null,oe=null,ie=null,re=null,ye=null,Be=null,ne=null;return{setTest:function(Te){R||(Te?me(i.STENCIL_TEST):Ue(i.STENCIL_TEST))},setMask:function(Te){Z!==Te&&!R&&(i.stencilMask(Te),Z=Te)},setFunc:function(Te,Fe,de){(V!==Te||oe!==Fe||ie!==de)&&(i.stencilFunc(Te,Fe,de),V=Te,oe=Fe,ie=de)},setOp:function(Te,Fe,de){(re!==Te||ye!==Fe||Be!==de)&&(i.stencilOp(Te,Fe,de),re=Te,ye=Fe,Be=de)},setLocked:function(Te){R=Te},setClear:function(Te){ne!==Te&&(i.clearStencil(Te),ne=Te)},reset:function(){R=!1,Z=null,V=null,oe=null,ie=null,re=null,ye=null,Be=null,ne=null}}}const r=new t,a=new n,o=new s;let c={};const l=new WeakMap;let u={},h={},d={},f=new WeakMap,g=[],S=null,p=!1,m=null,x=null,T=null,b=null,w=null,E=null,_=null,y=new De(0,0,0),N=0,C=!1,I=null,G=null,q=null,L=null,k=null;const J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,te=0;const W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(W)[1]),z=te>=1):W.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),z=te>=2);let Q=null,j={};const Se=i.getParameter(i.SCISSOR_BOX),Ie=i.getParameter(i.VIEWPORT),K=new it().fromArray(Se),pe=new it().fromArray(Ie);function xe(R,Z,V,oe){const ie=new Uint8Array(4),re=i.createTexture();i.bindTexture(R,re),i.texParameteri(R,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(R,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ye=0;ye<V;ye++)R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY?i.texImage3D(Z,0,i.RGBA,1,1,oe,0,i.RGBA,i.UNSIGNED_BYTE,ie):i.texImage2D(Z+ye,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ie);return re}const Ae={};Ae[i.TEXTURE_2D]=xe(i.TEXTURE_2D,i.TEXTURE_2D,1),Ae[i.TEXTURE_CUBE_MAP]=xe(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ae[i.TEXTURE_2D_ARRAY]=xe(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ae[i.TEXTURE_3D]=xe(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),me(i.DEPTH_TEST),a.setFunc(ji),Nt(!1),st(Mo),me(i.CULL_FACE),Mt(Si);function me(R){u[R]!==!0&&(i.enable(R),u[R]=!0)}function Ue(R){u[R]!==!1&&(i.disable(R),u[R]=!1)}function at(R,Z){return d[R]!==Z?(i.bindFramebuffer(R,Z),d[R]=Z,R===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=Z),R===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=Z),!0):!1}function Re(R,Z){let V=g,oe=!1;if(R){V=f.get(Z),V===void 0&&(V=[],f.set(Z,V));const ie=R.textures;if(V.length!==ie.length||V[0]!==i.COLOR_ATTACHMENT0){for(let re=0,ye=ie.length;re<ye;re++)V[re]=i.COLOR_ATTACHMENT0+re;V.length=ie.length,oe=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,oe=!0);oe&&i.drawBuffers(V)}function Ke(R){return S!==R?(i.useProgram(R),S=R,!0):!1}const Je={[xi]:i.FUNC_ADD,[Hc]:i.FUNC_SUBTRACT,[kc]:i.FUNC_REVERSE_SUBTRACT};Je[Vc]=i.MIN,Je[Wc]=i.MAX;const Ge={[Xc]:i.ZERO,[qc]:i.ONE,[Yc]:i.SRC_COLOR,[wl]:i.SRC_ALPHA,[jc]:i.SRC_ALPHA_SATURATE,[Jc]:i.DST_COLOR,[Zc]:i.DST_ALPHA,[Kc]:i.ONE_MINUS_SRC_COLOR,[Rl]:i.ONE_MINUS_SRC_ALPHA,[Qc]:i.ONE_MINUS_DST_COLOR,[$c]:i.ONE_MINUS_DST_ALPHA,[eh]:i.CONSTANT_COLOR,[th]:i.ONE_MINUS_CONSTANT_COLOR,[nh]:i.CONSTANT_ALPHA,[ih]:i.ONE_MINUS_CONSTANT_ALPHA};function Mt(R,Z,V,oe,ie,re,ye,Be,ne,Te){if(R===Si){p===!0&&(Ue(i.BLEND),p=!1);return}if(p===!1&&(me(i.BLEND),p=!0),R!==Gc){if(R!==m||Te!==C){if((x!==xi||w!==xi)&&(i.blendEquation(i.FUNC_ADD),x=xi,w=xi),Te)switch(R){case $i:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case So:i.blendFunc(i.ONE,i.ONE);break;case Eo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case yo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Ye("WebGLState: Invalid blending: ",R);break}else switch(R){case $i:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case So:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Eo:Ye("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case yo:Ye("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ye("WebGLState: Invalid blending: ",R);break}T=null,b=null,E=null,_=null,y.set(0,0,0),N=0,m=R,C=Te}return}ie=ie||Z,re=re||V,ye=ye||oe,(Z!==x||ie!==w)&&(i.blendEquationSeparate(Je[Z],Je[ie]),x=Z,w=ie),(V!==T||oe!==b||re!==E||ye!==_)&&(i.blendFuncSeparate(Ge[V],Ge[oe],Ge[re],Ge[ye]),T=V,b=oe,E=re,_=ye),(Be.equals(y)===!1||ne!==N)&&(i.blendColor(Be.r,Be.g,Be.b,ne),y.copy(Be),N=ne),m=R,C=!1}function ut(R,Z){R.side===Ft?Ue(i.CULL_FACE):me(i.CULL_FACE);let V=R.side===It;Z&&(V=!V),Nt(V),R.blending===$i&&R.transparent===!1?Mt(Si):Mt(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),a.setFunc(R.depthFunc),a.setTest(R.depthTest),a.setMask(R.depthWrite),r.setMask(R.colorWrite);const oe=R.stencilWrite;o.setTest(oe),oe&&(o.setMask(R.stencilWriteMask),o.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),o.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),mt(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?me(i.SAMPLE_ALPHA_TO_COVERAGE):Ue(i.SAMPLE_ALPHA_TO_COVERAGE)}function Nt(R){I!==R&&(R?i.frontFace(i.CW):i.frontFace(i.CCW),I=R)}function st(R){R!==Oc?(me(i.CULL_FACE),R!==G&&(R===Mo?i.cullFace(i.BACK):R===Bc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ue(i.CULL_FACE),G=R}function sn(R){R!==q&&(z&&i.lineWidth(R),q=R)}function mt(R,Z,V){R?(me(i.POLYGON_OFFSET_FILL),(L!==Z||k!==V)&&(L=Z,k=V,a.getReversed()&&(Z=-Z,V=-V),i.polygonOffset(Z,V))):Ue(i.POLYGON_OFFSET_FILL)}function Ht(R){R?me(i.SCISSOR_TEST):Ue(i.SCISSOR_TEST)}function kt(R){R===void 0&&(R=i.TEXTURE0+J-1),Q!==R&&(i.activeTexture(R),Q=R)}function Vt(R,Z,V){V===void 0&&(Q===null?V=i.TEXTURE0+J-1:V=Q);let oe=j[V];oe===void 0&&(oe={type:void 0,texture:void 0},j[V]=oe),(oe.type!==R||oe.texture!==Z)&&(Q!==V&&(i.activeTexture(V),Q=V),i.bindTexture(R,Z||Ae[R]),oe.type=R,oe.texture=Z)}function D(){const R=j[Q];R!==void 0&&R.type!==void 0&&(i.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function Wt(){try{i.compressedTexImage2D(...arguments)}catch(R){Ye("WebGLState:",R)}}function tt(){try{i.compressedTexImage3D(...arguments)}catch(R){Ye("WebGLState:",R)}}function nt(){try{i.texSubImage2D(...arguments)}catch(R){Ye("WebGLState:",R)}}function ue(){try{i.texSubImage3D(...arguments)}catch(R){Ye("WebGLState:",R)}}function dt(){try{i.compressedTexSubImage2D(...arguments)}catch(R){Ye("WebGLState:",R)}}function we(){try{i.compressedTexSubImage3D(...arguments)}catch(R){Ye("WebGLState:",R)}}function Pe(){try{i.texStorage2D(...arguments)}catch(R){Ye("WebGLState:",R)}}function A(){try{i.texStorage3D(...arguments)}catch(R){Ye("WebGLState:",R)}}function v(){try{i.texImage2D(...arguments)}catch(R){Ye("WebGLState:",R)}}function O(){try{i.texImage3D(...arguments)}catch(R){Ye("WebGLState:",R)}}function ee(R){return h[R]!==void 0?h[R]:i.getParameter(R)}function $(R,Z){h[R]!==Z&&(i.pixelStorei(R,Z),h[R]=Z)}function se(R){K.equals(R)===!1&&(i.scissor(R.x,R.y,R.z,R.w),K.copy(R))}function ce(R){pe.equals(R)===!1&&(i.viewport(R.x,R.y,R.z,R.w),pe.copy(R))}function X(R,Z){let V=l.get(Z);V===void 0&&(V=new WeakMap,l.set(Z,V));let oe=V.get(R);oe===void 0&&(oe=i.getUniformBlockIndex(Z,R.name),i.uniformBlockBinding(Z,oe,oe),V.set(R,oe))}function Y(R,Z,V){const ie=l.get(Z).get(R);c[ie]!==V&&(i.bindBufferBase(i.UNIFORM_BUFFER,ie,V),c[ie]=V)}function ae(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},h={},Q=null,j={},d={},c={},f=new WeakMap,g=[],S=null,p=!1,m=null,x=null,T=null,b=null,w=null,E=null,_=null,y=new De(0,0,0),N=0,C=!1,I=null,G=null,q=null,L=null,k=null,K.set(0,0,i.canvas.width,i.canvas.height),pe.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:me,disable:Ue,bindFramebuffer:at,drawBuffers:Re,useProgram:Ke,setBlending:Mt,setMaterial:ut,setFlipSided:Nt,setCullFace:st,setLineWidth:sn,setPolygonOffset:mt,setScissorTest:Ht,activeTexture:kt,bindTexture:Vt,unbindTexture:D,compressedTexImage2D:Wt,compressedTexImage3D:tt,texImage2D:v,texImage3D:O,pixelStorei:$,getParameter:ee,updateUBOMapping:X,uniformBlockBinding:Y,texStorage2D:Pe,texStorage3D:A,texSubImage2D:nt,texSubImage3D:ue,compressedTexSubImage2D:dt,compressedTexSubImage3D:we,scissor:se,viewport:ce,reset:ae}}function sg(i,e,t,n,s,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ze,u=new WeakMap,h=new Set;let d;const f=new WeakMap,g=new Set,S=new FinalizationRegistry(A=>g.delete(A));let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(A,v){return p?new OffscreenCanvas(A,v):is("canvas")}function x(A,v,O){let ee=1;const $=Pe(A);if(($.width>O||$.height>O)&&(ee=O/Math.max($.width,$.height)),ee<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const se=Math.floor(ee*$.width),ce=Math.floor(ee*$.height);d===void 0&&(d=m(se,ce));const X=v?m(se,ce):d;return X.width=se,X.height=ce,X.getContext("2d").drawImage(A,0,0,se,ce),Ce("WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+se+"x"+ce+")."),X}else return"data"in A&&Ce("WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),A;return A}function T(A){return A.generateMipmaps}function b(A){i.generateMipmap(A)}function w(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(A,v,O,ee,$,se=!1){if(A!==null){if(i[A]!==void 0)return i[A];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ce;ee&&(ce=e.get("EXT_texture_norm16"),ce||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let X=v;if(v===i.RED&&(O===i.FLOAT&&(X=i.R32F),O===i.HALF_FLOAT&&(X=i.R16F),O===i.UNSIGNED_BYTE&&(X=i.R8),O===i.UNSIGNED_SHORT&&ce&&(X=ce.R16_EXT),O===i.SHORT&&ce&&(X=ce.R16_SNORM_EXT)),v===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.R8UI),O===i.UNSIGNED_SHORT&&(X=i.R16UI),O===i.UNSIGNED_INT&&(X=i.R32UI),O===i.BYTE&&(X=i.R8I),O===i.SHORT&&(X=i.R16I),O===i.INT&&(X=i.R32I)),v===i.RG&&(O===i.FLOAT&&(X=i.RG32F),O===i.HALF_FLOAT&&(X=i.RG16F),O===i.UNSIGNED_BYTE&&(X=i.RG8),O===i.UNSIGNED_SHORT&&ce&&(X=ce.RG16_EXT),O===i.SHORT&&ce&&(X=ce.RG16_SNORM_EXT)),v===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RG8UI),O===i.UNSIGNED_SHORT&&(X=i.RG16UI),O===i.UNSIGNED_INT&&(X=i.RG32UI),O===i.BYTE&&(X=i.RG8I),O===i.SHORT&&(X=i.RG16I),O===i.INT&&(X=i.RG32I)),v===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RGB8UI),O===i.UNSIGNED_SHORT&&(X=i.RGB16UI),O===i.UNSIGNED_INT&&(X=i.RGB32UI),O===i.BYTE&&(X=i.RGB8I),O===i.SHORT&&(X=i.RGB16I),O===i.INT&&(X=i.RGB32I)),v===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),O===i.UNSIGNED_INT&&(X=i.RGBA32UI),O===i.BYTE&&(X=i.RGBA8I),O===i.SHORT&&(X=i.RGBA16I),O===i.INT&&(X=i.RGBA32I)),v===i.RGB&&(O===i.UNSIGNED_SHORT&&ce&&(X=ce.RGB16_EXT),O===i.SHORT&&ce&&(X=ce.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(X=i.R11F_G11F_B10F)),v===i.RGBA){const Y=se?Js:We.getTransfer($);O===i.FLOAT&&(X=i.RGBA32F),O===i.HALF_FLOAT&&(X=i.RGBA16F),O===i.UNSIGNED_BYTE&&(X=Y===$e?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&ce&&(X=ce.RGBA16_EXT),O===i.SHORT&&ce&&(X=ce.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function _(A,v){let O;return A?v===null||v===cn||v===Ti?O=i.DEPTH24_STENCIL8:v===jt?O=i.DEPTH32F_STENCIL8:v===ts&&(O=i.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===cn||v===Ti?O=i.DEPTH_COMPONENT24:v===jt?O=i.DEPTH_COMPONENT32F:v===ts&&(O=i.DEPTH_COMPONENT16),O}function y(A,v){return T(A)===!0||A.isFramebufferTexture&&A.minFilter!==ct&&A.minFilter!==Ct?Math.log2(Math.max(v.width,v.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?v.mipmaps.length:1}function N(A){const v=new WeakRef(A);n.get(A).__ref=v,g.add(v),S.register(A,v,v)}function C(A){const v=n.get(A).__ref;v!==void 0&&(g.delete(v),S.unregister(v))}function I(A){q(A.target)}function G(A){L(A.target)}function q(A){A.removeEventListener("dispose",I),C(A),J(A),A.isVideoTexture&&u.delete(A),A.isHTMLTexture&&h.delete(A)}function L(A){A.removeEventListener("dispose",G),C(A),te(A)}function k(){for(const A of g){const v=A.deref();v!==void 0&&(v.isRenderTarget===!0?L(v):q(v))}g.clear(),h.clear()}function J(A){const v=n.get(A);if(v.__webglInit===void 0)return;const O=A.source,ee=f.get(O);if(ee){const $=ee[v.__cacheKey];$.usedTimes--,$.usedTimes===0&&z(A),Object.keys(ee).length===0&&f.delete(O)}n.remove(A)}function z(A){const v=n.get(A);i.deleteTexture(v.__webglTexture);const O=A.source,ee=f.get(O);delete ee[v.__cacheKey],a.memory.textures--}function te(A){const v=n.get(A);v.__depthDisposeCallback&&v.__depthDisposeCallback();const O=A.depthTexture;if(O&&O.renderTarget===A&&q(O),A.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(v.__webglFramebuffer[$]))for(let se=0;se<v.__webglFramebuffer[$].length;se++)i.deleteFramebuffer(v.__webglFramebuffer[$][se]);else i.deleteFramebuffer(v.__webglFramebuffer[$]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[$])}else{if(Array.isArray(v.__webglFramebuffer))for(let $=0;$<v.__webglFramebuffer.length;$++)i.deleteFramebuffer(v.__webglFramebuffer[$]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let $=0;$<v.__webglColorRenderbuffer.length;$++)v.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[$]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const ee=A.textures;for(let $=0,se=ee.length;$<se;$++){const ce=n.get(ee[$]);ce.__webglTexture&&(i.deleteTexture(ce.__webglTexture),a.memory.textures--),n.remove(ee[$])}n.remove(A)}let W=0;function Q(){W=0}function j(){return W}function Se(A){W=A}function Ie(){const A=W;return A>=s.maxTextures&&Ce("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),W+=1,A}function K(A){const v=[];return v.push(A.wrapS),v.push(A.wrapT),v.push(A.wrapR||0),v.push(A.magFilter),v.push(A.minFilter),v.push(A.anisotropy),v.push(A.internalFormat),v.push(A.format),v.push(A.type),v.push(A.generateMipmaps),v.push(A.mipmapsAutoUpdate),v.push(A.premultiplyAlpha),v.push(A.flipY),v.push(A.unpackAlignment),v.push(A.colorSpace),v.join()}function pe(A,v){const O=n.get(A);if(A.isVideoTexture&&dt(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&O.__version!==A.version){const ee=A.image;if(ee===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{ut(O,A,v);return}}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+v)}function xe(A,v){const O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){ut(O,A,v);return}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+v)}function Ae(A,v){const O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){ut(O,A,v);return}t.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+v)}function me(A,v){const O=n.get(A);if(A.version>0&&O.__version!==A.version){Nt(O,A,v);return}t.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+v)}const Ue={[qs]:i.REPEAT,[Mn]:i.CLAMP_TO_EDGE,[qr]:i.MIRRORED_REPEAT},at={[ct]:i.NEAREST,[ah]:i.NEAREST_MIPMAP_NEAREST,[ds]:i.NEAREST_MIPMAP_LINEAR,[Ct]:i.LINEAR,[lr]:i.LINEAR_MIPMAP_NEAREST,[On]:i.LINEAR_MIPMAP_LINEAR},Re={[uh]:i.NEVER,[Wl]:i.ALWAYS,[dh]:i.LESS,[kl]:i.LEQUAL,[fh]:i.EQUAL,[Vl]:i.GEQUAL,[ph]:i.GREATER,[mh]:i.NOTEQUAL};function Ke(A,v){if(v.type===jt&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===Ct||v.magFilter===lr||v.magFilter===ds||v.magFilter===On||v.minFilter===Ct||v.minFilter===lr||v.minFilter===ds||v.minFilter===On)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,Ue[v.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Ue[v.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Ue[v.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,at[v.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,at[v.minFilter]),v.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Re[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ct||v.minFilter!==ds&&v.minFilter!==On||v.type===jt&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){const O=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function Je(A,v){let O=!1;A.__webglInit===void 0&&(A.__webglInit=!0,v.addEventListener("dispose",I),N(v));const ee=v.source;let $=f.get(ee);$===void 0&&($={},f.set(ee,$));const se=K(v);if(se!==A.__cacheKey){$[se]===void 0&&($[se]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=!0),$[se].usedTimes++;const ce=$[A.__cacheKey];ce!==void 0&&($[A.__cacheKey].usedTimes--,ce.usedTimes===0&&z(v)),A.__cacheKey=se,A.__webglTexture=$[se].texture}return O}function Ge(A,v,O){return Math.floor(Math.floor(A/O)/v)}function Mt(A,v,O,ee){const se=A.updateRanges;if(se.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,v.width,v.height,O,ee,v.data);else{se.sort((R,Z)=>R.start-Z.start);let ce=0;for(let R=1;R<se.length;R++){const Z=se[ce],V=se[R],oe=Z.start+Z.count,ie=Ge(V.start,v.width,4),re=Ge(Z.start,v.width,4);V.start<=oe+1&&ie===re&&Ge(V.start+V.count-1,v.width,4)===ie?Z.count=Math.max(Z.count,V.start+V.count-Z.start):(++ce,se[ce]=V)}se.length=ce+1;const X=t.getParameter(i.UNPACK_ROW_LENGTH),Y=t.getParameter(i.UNPACK_SKIP_PIXELS),ae=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,v.width);for(let R=0,Z=se.length;R<Z;R++){const V=se[R],oe=Math.floor(V.start/4),ie=Math.ceil(V.count/4),re=oe%v.width,ye=Math.floor(oe/v.width),Be=ie,ne=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,re),t.pixelStorei(i.UNPACK_SKIP_ROWS,ye),t.texSubImage2D(i.TEXTURE_2D,0,re,ye,Be,ne,O,ee,v.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,X),t.pixelStorei(i.UNPACK_SKIP_PIXELS,Y),t.pixelStorei(i.UNPACK_SKIP_ROWS,ae)}}function ut(A,v,O){let ee=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(ee=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(ee=i.TEXTURE_3D);const $=Je(A,v),se=v.source;t.bindTexture(ee,A.__webglTexture,i.TEXTURE0+O);const ce=n.get(se);if(se.version!==ce.__version||$===!0){if(t.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)===!1){const ne=We.getPrimaries(We.workingColorSpace),Te=v.colorSpace===Fn?null:We.getPrimaries(v.colorSpace),Fe=v.colorSpace===Fn||ne===Te?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Fe)}t.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment);let Y=x(v.image,!1,s.maxTextureSize);Y=we(v,Y);const ae=r.convert(v.format,v.colorSpace),R=r.convert(v.type);let Z=E(v.internalFormat,ae,R,v.normalized,v.colorSpace,v.isVideoTexture);Ke(ee,v);let V;const oe=v.mipmaps,ie=v.isVideoTexture!==!0,re=ce.__version===void 0||$===!0,ye=se.dataReady,Be=y(v,Y);if(v.isDepthTexture)Z=_(v.format===Bn,v.type),re&&(ie?t.texStorage2D(i.TEXTURE_2D,1,Z,Y.width,Y.height):t.texImage2D(i.TEXTURE_2D,0,Z,Y.width,Y.height,0,ae,R,null));else if(v.isDataTexture)if(oe.length>0){ie&&re&&t.texStorage2D(i.TEXTURE_2D,Be,Z,oe[0].width,oe[0].height);for(let ne=0,Te=oe.length;ne<Te;ne++)V=oe[ne],ie?ye&&t.texSubImage2D(i.TEXTURE_2D,ne,0,0,V.width,V.height,ae,R,V.data):t.texImage2D(i.TEXTURE_2D,ne,Z,V.width,V.height,0,ae,R,V.data);v.generateMipmaps=!1}else ie?(re&&t.texStorage2D(i.TEXTURE_2D,Be,Z,Y.width,Y.height),ye&&Mt(v,Y,ae,R)):t.texImage2D(i.TEXTURE_2D,0,Z,Y.width,Y.height,0,ae,R,Y.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){ie&&re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Be,Z,oe[0].width,oe[0].height,Y.depth);for(let ne=0,Te=oe.length;ne<Te;ne++)if(V=oe[ne],v.format!==ln)if(ae!==null)if(ie){if(ye)if(v.layerUpdates.size>0){const Fe=Jo(V.width,V.height,v.format,v.type);for(const de of v.layerUpdates){const Ze=V.data.subarray(de*Fe/V.data.BYTES_PER_ELEMENT,(de+1)*Fe/V.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ne,0,0,de,V.width,V.height,1,ae,Ze)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ne,0,0,0,V.width,V.height,Y.depth,ae,V.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ne,Z,V.width,V.height,Y.depth,0,V.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ie?ye&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ne,0,0,0,V.width,V.height,Y.depth,ae,R,V.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ne,Z,V.width,V.height,Y.depth,0,ae,R,V.data);v.layerUpdates.size>0&&v.clearLayerUpdates()}else{ie&&re&&t.texStorage2D(i.TEXTURE_2D,Be,Z,oe[0].width,oe[0].height);for(let ne=0,Te=oe.length;ne<Te;ne++)V=oe[ne],v.format!==ln?ae!==null?ie?ye&&t.compressedTexSubImage2D(i.TEXTURE_2D,ne,0,0,V.width,V.height,ae,V.data):t.compressedTexImage2D(i.TEXTURE_2D,ne,Z,V.width,V.height,0,V.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ie?ye&&t.texSubImage2D(i.TEXTURE_2D,ne,0,0,V.width,V.height,ae,R,V.data):t.texImage2D(i.TEXTURE_2D,ne,Z,V.width,V.height,0,ae,R,V.data)}else if(v.isDataArrayTexture)if(ie){if(re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Be,Z,Y.width,Y.height,Y.depth),ye)if(v.layerUpdates.size>0){const ne=Jo(Y.width,Y.height,v.format,v.type);for(const Te of v.layerUpdates){const Fe=Y.data.subarray(Te*ne/Y.data.BYTES_PER_ELEMENT,(Te+1)*ne/Y.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Te,Y.width,Y.height,1,ae,R,Fe)}v.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Y.width,Y.height,Y.depth,ae,R,Y.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Z,Y.width,Y.height,Y.depth,0,ae,R,Y.data);else if(v.isData3DTexture)ie?(re&&t.texStorage3D(i.TEXTURE_3D,Be,Z,Y.width,Y.height,Y.depth),ye&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Y.width,Y.height,Y.depth,ae,R,Y.data)):t.texImage3D(i.TEXTURE_3D,0,Z,Y.width,Y.height,Y.depth,0,ae,R,Y.data);else if(v.isFramebufferTexture){if(re)if(ie)t.texStorage2D(i.TEXTURE_2D,Be,Z,Y.width,Y.height);else{let ne=Y.width,Te=Y.height;for(let Fe=0;Fe<Be;Fe++)t.texImage2D(i.TEXTURE_2D,Fe,Z,ne,Te,0,ae,R,null),ne>>=1,Te>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in i){const ne=i.canvas;if(ne.hasAttribute("layoutsubtree")||ne.setAttribute("layoutsubtree","true"),Y.parentNode!==ne){ne.appendChild(Y),h.add(v),ne.onpaint=Te=>{const Fe=Te.changedElements;for(const de of h)Fe.includes(de.image)&&(de.needsUpdate=!0)},ne.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Y);else{const Fe=i.RGBA,de=i.RGBA,Ze=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Fe,de,Ze,Y)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(oe.length>0){if(ie&&re){const ne=Pe(oe[0]);t.texStorage2D(i.TEXTURE_2D,Be,Z,ne.width,ne.height)}for(let ne=0,Te=oe.length;ne<Te;ne++)V=oe[ne],ie?ye&&t.texSubImage2D(i.TEXTURE_2D,ne,0,0,ae,R,V):t.texImage2D(i.TEXTURE_2D,ne,Z,ae,R,V);v.generateMipmaps=!1}else if(ie){if(re){const ne=Pe(Y);t.texStorage2D(i.TEXTURE_2D,Be,Z,ne.width,ne.height)}ye&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ae,R,Y)}else t.texImage2D(i.TEXTURE_2D,0,Z,ae,R,Y);T(v)&&v.mipmapsAutoUpdate===!0&&b(ee),ce.__version=se.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function Nt(A,v,O){if(v.image.length!==6)return;const ee=Je(A,v),$=v.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+O);const se=n.get($);if($.version!==se.__version||ee===!0){t.activeTexture(i.TEXTURE0+O);const ce=We.getPrimaries(We.workingColorSpace),X=v.colorSpace===Fn?null:We.getPrimaries(v.colorSpace),Y=v.colorSpace===Fn||ce===X?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Y);const ae=v.isCompressedTexture||v.image[0].isCompressedTexture,R=v.image[0]&&v.image[0].isDataTexture,Z=[];for(let de=0;de<6;de++)!ae&&!R?Z[de]=x(v.image[de],!0,s.maxCubemapSize):Z[de]=R?v.image[de].image:v.image[de],Z[de]=we(v,Z[de]);const V=Z[0],oe=r.convert(v.format,v.colorSpace),ie=r.convert(v.type);let re=E(v.internalFormat,oe,ie,v.normalized,v.colorSpace);const ye=v.isVideoTexture!==!0,Be=se.__version===void 0||ee===!0,ne=$.dataReady;let Te=y(v,V);Ke(i.TEXTURE_CUBE_MAP,v);let Fe;if(v.isDepthTexture){if(re=_(v.format===Bn,v.type),Be)if(ye)t.texStorage2D(i.TEXTURE_CUBE_MAP,1,re,V.width,V.height);else for(let de=0;de<6;de++)t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,re,V.width,V.height,0,oe,ie,null)}else if(ae){ye&&Be&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,re,V.width,V.height);for(let de=0;de<6;de++){Fe=Z[de].mipmaps;for(let Ze=0;Ze<Fe.length;Ze++){const gt=Fe[Ze];v.format!==ln?oe!==null?ye?ne&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze,0,0,gt.width,gt.height,oe,gt.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze,re,gt.width,gt.height,0,gt.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ye?ne&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze,0,0,gt.width,gt.height,oe,ie,gt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze,re,gt.width,gt.height,0,oe,ie,gt.data)}}}else{if(Fe=v.mipmaps,ye&&Be){Fe.length>0&&Te++;const de=Pe(Z[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,re,de.width,de.height)}for(let de=0;de<6;de++)if(R){ye?ne&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,0,0,Z[de].width,Z[de].height,oe,ie,Z[de].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,re,Z[de].width,Z[de].height,0,oe,ie,Z[de].data);for(let Ze=0;Ze<Fe.length;Ze++){const Tn=Fe[Ze].image[de].image;ye?ne&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze+1,0,0,Tn.width,Tn.height,oe,ie,Tn.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze+1,re,Tn.width,Tn.height,0,oe,ie,Tn.data)}}else{ye?ne&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,0,0,oe,ie,Z[de]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,re,oe,ie,Z[de]);for(let Ze=0;Ze<Fe.length;Ze++){const gt=Fe[Ze];ye?ne&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze+1,0,0,oe,ie,gt.image[de]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ze+1,re,oe,ie,gt.image[de])}}}T(v)&&v.mipmapsAutoUpdate===!0&&b(i.TEXTURE_CUBE_MAP),se.__version=$.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function st(A,v,O,ee,$,se){const ce=r.convert(O.format,O.colorSpace),X=r.convert(O.type),Y=E(O.internalFormat,ce,X,O.normalized,O.colorSpace),ae=n.get(v),R=n.get(O);if(R.__renderTarget=v,!ae.__hasExternalTextures){const Z=Math.max(1,v.width>>se),V=Math.max(1,v.height>>se);$===i.TEXTURE_3D||$===i.TEXTURE_2D_ARRAY?t.texImage3D($,se,Y,Z,V,v.depth,0,ce,X,null):t.texImage2D($,se,Y,Z,V,0,ce,X,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),ue(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,$,R.__webglTexture,0,nt(v)):($===i.TEXTURE_2D||$>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ee,$,R.__webglTexture,se),t.bindFramebuffer(i.FRAMEBUFFER,null)}function sn(A,v,O){if(i.bindRenderbuffer(i.RENDERBUFFER,A),v.depthBuffer){const ee=v.depthTexture,$=ee&&ee.isDepthTexture?ee.type:null,se=_(v.stencilBuffer,$),ce=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ue(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt(v),se,v.width,v.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt(v),se,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,se,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ce,i.RENDERBUFFER,A)}else{const ee=v.textures;for(let $=0;$<ee.length;$++){const se=ee[$],ce=r.convert(se.format,se.colorSpace),X=r.convert(se.type),Y=E(se.internalFormat,ce,X,se.normalized,se.colorSpace);ue(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt(v),Y,v.width,v.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt(v),Y,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,Y,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function mt(A,v,O){const ee=v.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const $=n.get(v.depthTexture);$.__renderTarget=v;const se=ee?v.depthTexture.image[0]:v.depthTexture.image;(!$.__webglTexture||se.width!==v.width||se.height!==v.height)&&(se.width=v.width,se.height=v.height,v.depthTexture.needsUpdate=!0),ee?me(v.depthTexture,0):pe(v.depthTexture,0);const ce=$.__webglTexture,X=nt(v),Y=ee?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,ae=v.depthTexture.format===Bn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(v.depthTexture.format===kn)ue(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ae,Y,ce,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,ae,Y,ce,0);else if(v.depthTexture.format===Bn)ue(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ae,Y,ce,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,ae,Y,ce,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ht(A){const v=n.get(A),O=A.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==A.depthTexture){const ee=A.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),ee){const $=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,ee.removeEventListener("dispose",$)};ee.addEventListener("dispose",$),v.__depthDisposeCallback=$}v.__boundDepthTexture=ee}if(A.depthTexture&&!v.__autoAllocateDepthBuffer)if(O)for(let ee=0;ee<6;ee++)mt(v.__webglFramebuffer[ee],A,ee);else A.texture.mipmaps.length>0?mt(v.__webglFramebuffer[0],A,0):mt(v.__webglFramebuffer,A,0);else if(O){v.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[ee]),v.__webglDepthbuffer[ee]===void 0)v.__webglDepthbuffer[ee]=i.createRenderbuffer(),sn(v.__webglDepthbuffer[ee],A,!1);else{const $=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,se=v.__webglDepthbuffer[ee];i.bindRenderbuffer(i.RENDERBUFFER,se),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,se)}}else if(A.texture.mipmaps.length>0?t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),sn(v.__webglDepthbuffer,A,!1);else{const $=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,se=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,se),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,se)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function kt(A,v,O){const ee=n.get(A);v!==void 0&&st(ee.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Ht(A)}function Vt(A){const v=A.texture,O=n.get(A),ee=n.get(v);A.addEventListener("dispose",G),N(A);const $=A.textures,se=A.isWebGLCubeRenderTarget===!0,ce=$.length>1;if(ce||(ee.__webglTexture===void 0&&(ee.__webglTexture=i.createTexture()),ee.__version=v.version,a.memory.textures++),se){O.__webglFramebuffer=[];for(let X=0;X<6;X++)if(v.mipmaps.length>0){O.__webglFramebuffer[X]=[];for(let Y=0;Y<v.mipmaps.length;Y++)O.__webglFramebuffer[X][Y]=i.createFramebuffer()}else O.__webglFramebuffer[X]=i.createFramebuffer()}else{if(v.mipmaps.length>0){O.__webglFramebuffer=[];for(let X=0;X<v.mipmaps.length;X++)O.__webglFramebuffer[X]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(ce)for(let X=0,Y=$.length;X<Y;X++){const ae=n.get($[X]);ae.__webglTexture===void 0&&(ae.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&ue(A)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let X=0;X<$.length;X++){const Y=$[X];O.__webglColorRenderbuffer[X]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[X]);const ae=r.convert(Y.format,Y.colorSpace),R=r.convert(Y.type),Z=E(Y.internalFormat,ae,R,Y.normalized,Y.colorSpace,A.isXRRenderTarget===!0),V=nt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,V,Z,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+X,i.RENDERBUFFER,O.__webglColorRenderbuffer[X])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),sn(O.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(se){t.bindTexture(i.TEXTURE_CUBE_MAP,ee.__webglTexture),Ke(i.TEXTURE_CUBE_MAP,v);for(let X=0;X<6;X++)if(v.mipmaps.length>0)for(let Y=0;Y<v.mipmaps.length;Y++)st(O.__webglFramebuffer[X][Y],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,Y);else st(O.__webglFramebuffer[X],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);T(v)?b(i.TEXTURE_CUBE_MAP):v.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,v.mipmaps.length-1),t.unbindTexture()}else if(ce){for(let X=0,Y=$.length;X<Y;X++){const ae=$[X],R=n.get(ae);let Z=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Z=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Z,R.__webglTexture),Ke(Z,ae),st(O.__webglFramebuffer,A,ae,i.COLOR_ATTACHMENT0+X,Z,0),T(ae)&&b(Z)}t.unbindTexture()}else{let X=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(X=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(X,ee.__webglTexture),Ke(X,v),v.mipmaps.length>0)for(let Y=0;Y<v.mipmaps.length;Y++)st(O.__webglFramebuffer[Y],A,v,i.COLOR_ATTACHMENT0,X,Y);else st(O.__webglFramebuffer,A,v,i.COLOR_ATTACHMENT0,X,0);T(v)?b(X):v.mipmaps.length>0&&i.texParameteri(X,i.TEXTURE_MAX_LEVEL,v.mipmaps.length-1),t.unbindTexture()}A.depthBuffer&&Ht(A)}function D(A){const v=A.textures;for(let O=0,ee=v.length;O<ee;O++){const $=v[O];if(T($)&&$.mipmapsAutoUpdate===!0){const se=w(A),ce=n.get($).__webglTexture;t.bindTexture(se,ce),b(se),t.unbindTexture()}}}const Wt=[];function tt(A){if(A.samples>0){if(ue(A)===!1){const v=A.textures,O=A.width,ee=A.height;let $=i.COLOR_BUFFER_BIT;const se=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=n.get(A),X=v.length>1;if(X)for(let ae=0;ae<v.length;ae++)t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let ae=0;ae<v.length;ae++){if(A.resolveDepthBuffer&&(A.depthBuffer&&($|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&($|=i.STENCIL_BUFFER_BIT)),X){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ce.__webglColorRenderbuffer[ae]);const R=n.get(v[ae]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,R,0)}i.blitFramebuffer(0,0,O,ee,0,0,O,ee,$,i.NEAREST),c===!0&&(Wt.length=0,Wt.push(i.COLOR_ATTACHMENT0+ae),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&Wt.push(se),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Wt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),X)for(let ae=0;ae<v.length;ae++){t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,ce.__webglColorRenderbuffer[ae]);const R=n.get(v[ae]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,R,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&c){const v=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function nt(A){return Math.min(s.maxSamples,A.samples)}function ue(A){const v=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function dt(A){const v=a.render.frame;u.get(A)!==v&&(u.set(A,v),A.update())}function we(A,v){const O=A.colorSpace,ee=A.format,$=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||O!==$s&&O!==Fn&&(We.getTransfer(O)===$e?(ee!==ln||$!==Gt)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ye("WebGLTextures: Unsupported texture color space:",O)),v}function Pe(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=Ie,this.resetTextureUnits=Q,this.getTextureUnits=j,this.setTextureUnits=Se,this.setTexture2D=pe,this.setTexture2DArray=xe,this.setTexture3D=Ae,this.setTextureCube=me,this.rebindTextures=kt,this.setupRenderTarget=Vt,this.updateRenderTargetMipmap=D,this.updateMultisampleRenderTarget=tt,this.setupDepthRenderbuffer=Ht,this.setupFrameBufferTexture=st,this.useMultisampledRTT=ue,this.dispose=k}function rg(i,e){function t(n,s=Fn){let r;const a=We.getTransfer(s);if(n===Gt)return i.UNSIGNED_BYTE;if(n===Ua)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Fa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Bl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===zl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Fl)return i.BYTE;if(n===Ol)return i.SHORT;if(n===ts)return i.UNSIGNED_SHORT;if(n===Na)return i.INT;if(n===cn)return i.UNSIGNED_INT;if(n===jt)return i.FLOAT;if(n===nn)return i.HALF_FLOAT;if(n===Gl)return i.ALPHA;if(n===Hl)return i.RGB;if(n===ln)return i.RGBA;if(n===kn)return i.DEPTH_COMPONENT;if(n===Bn)return i.DEPTH_STENCIL;if(n===Oa)return i.RED;if(n===Ba)return i.RED_INTEGER;if(n===ti)return i.RG;if(n===za)return i.RG_INTEGER;if(n===Ga)return i.RGBA_INTEGER;if(n===Bs||n===zs||n===Gs||n===Hs)if(a===$e)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Bs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Hs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Bs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Gs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Hs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Yr||n===Kr||n===Zr||n===$r)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Yr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Kr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Zr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===$r)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Jr||n===Qr||n===jr||n===ea||n===ta||n===Ys||n===na)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Jr||n===Qr)return a===$e?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===jr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===ea)return r.COMPRESSED_R11_EAC;if(n===ta)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ys)return r.COMPRESSED_RG11_EAC;if(n===na)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ia||n===sa||n===ra||n===aa||n===oa||n===la||n===ca||n===ha||n===ua||n===da||n===fa||n===pa||n===ma||n===ga)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ia)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===sa)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ra)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===aa)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===oa)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===la)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ca)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ha)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ua)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===da)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===fa)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===pa)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ma)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ga)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===_a||n===xa||n===va)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===_a)return a===$e?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===xa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===va)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ma||n===Sa||n===Ks||n===Ea)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ma)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Sa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ks)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ea)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ti?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const ag=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,og=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class lg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new ac(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new un({vertexShader:ag,fragmentShader:og,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Yt(new hn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class cg extends ni{constructor(e,t){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,l=null,u=null,h=null,d=null,f=null,g=null;const S=typeof XRWebGLBinding<"u",p=new lg,m={},x=t.getContextAttributes();let T=null,b=null;const w=[],E=[],_=new ze;let y=null,N=null;const C=new qt;C.viewport=new it;const I=new qt;I.viewport=new it;const G=[C,I],q=new Mu;let L=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let pe=w[K];return pe===void 0&&(pe=new mr,w[K]=pe),pe.getTargetRaySpace()},this.getControllerGrip=function(K){let pe=w[K];return pe===void 0&&(pe=new mr,w[K]=pe),pe.getGripSpace()},this.getHand=function(K){let pe=w[K];return pe===void 0&&(pe=new mr,w[K]=pe),pe.getHandSpace()};function J(K){const pe=E.indexOf(K.inputSource);if(pe===-1)return;const xe=w[pe];xe!==void 0&&(xe.update(K.inputSource,K.frame,l||a),xe.dispatchEvent({type:K.type,data:K.inputSource}))}function z(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",z),s.removeEventListener("inputsourceschange",te);for(let K=0;K<w.length;K++){const pe=E[K];pe!==null&&(E[K]=null,w[K].disconnect(pe))}L=null,k=null,p.reset();for(const K in m)delete m[K];if(e.setRenderTarget(T),f=null,d=null,h=null,s=null,b=null,Ie.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(_.width,_.height,!1),N!==null){const K=N.camera;K.fov=N.fov,K.zoom=N.zoom,K.updateProjectionMatrix(),N=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h===null&&S&&(h=new XRWebGLBinding(s,t)),h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(T=e.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",z),s.addEventListener("inputsourceschange",te),x.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(_),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,Ae=null,me=null;x.depth&&(me=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=x.stencil?Bn:kn,Ae=x.stencil?Ti:cn);const Ue={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:r};h=this.getBinding(),d=h.createProjectionLayer(Ue),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new tn(d.textureWidth,d.textureHeight,{format:ln,type:Gt,depthTexture:new wi(d.textureWidth,d.textureHeight,Ae,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{const xe={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,xe),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new tn(f.framebufferWidth,f.framebufferHeight,{format:ln,type:Gt,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Ie.setContext(s),Ie.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function te(K){for(let pe=0;pe<K.removed.length;pe++){const xe=K.removed[pe],Ae=E.indexOf(xe);Ae>=0&&(E[Ae]=null,w[Ae].disconnect(xe))}for(let pe=0;pe<K.added.length;pe++){const xe=K.added[pe];let Ae=E.indexOf(xe);if(Ae===-1){for(let Ue=0;Ue<w.length;Ue++)if(Ue>=E.length){E.push(xe),Ae=Ue;break}else if(E[Ue]===null){E[Ue]=xe,Ae=Ue;break}if(Ae===-1)break}const me=w[Ae];me&&me.connect(xe)}}function W(K,pe){pe===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(pe.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let pe=K.near,xe=K.far;p.texture!==null&&(p.depthNear>0&&(pe=p.depthNear),p.depthFar>0&&(xe=p.depthFar)),q.near=I.near=C.near=pe,q.far=I.far=C.far=xe,(L!==q.near||k!==q.far)&&(s.updateRenderState({depthNear:q.near,depthFar:q.far}),L=q.near,k=q.far),q.layers.mask=K.layers.mask|6,C.layers.mask=q.layers.mask&-5,I.layers.mask=q.layers.mask&-3;const Ae=K.parent,me=q.cameras;W(q,Ae);for(let Ue=0;Ue<me.length;Ue++)W(me[Ue],Ae);q.projectionMatrix.copy(C.projectionMatrix),q.projectionMatrixInverse.copy(C.projectionMatrixInverse),N===null&&K.isPerspectiveCamera&&(N={camera:K,fov:K.fov,zoom:K.zoom}),Q(K,q,Ae)};function Q(K,pe,xe){xe===null?K.matrix.copy(pe.matrixWorld):(K.matrix.copy(xe.matrixWorld),K.matrix.invert(),K.matrix.multiply(pe.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(pe.projectionMatrix),K.projectionMatrixInverse.copy(pe.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=ss*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return q},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(K){c=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(q)},this.getCameraTexture=function(K){return m[K]};let j=null;function Se(K,pe){if(u=pe.getViewerPose(l||a),g=pe,u!==null){const xe=u.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let Ae=!1;xe.length!==q.cameras.length&&(q.cameras.length=0,Ae=!0);for(let Re=0;Re<xe.length;Re++){const Ke=xe[Re];let Je=null;if(f!==null)Je=f.getViewport(Ke);else{const Mt=h.getViewSubImage(d,Ke);Je=Mt.viewport,Re===0&&(e.setRenderTargetTextures(b,Mt.colorTexture,Mt.depthStencilTexture),e.setRenderTarget(b))}let Ge=G[Re];Ge===void 0&&(Ge=new qt,Ge.layers.enable(Re),Ge.viewport=new it,G[Re]=Ge),Ge.matrix.fromArray(Ke.transform.matrix),Ge.matrix.decompose(Ge.position,Ge.quaternion,Ge.scale),Ge.projectionMatrix.fromArray(Ke.projectionMatrix),Ge.projectionMatrixInverse.copy(Ge.projectionMatrix).invert(),Ge.viewport.set(Je.x,Je.y,Je.width,Je.height),Re===0&&(q.matrix.copy(Ge.matrix),q.matrix.decompose(q.position,q.quaternion,q.scale)),Ae===!0&&q.cameras.push(Ge)}const me=s.enabledFeatures;if(me&&me.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){h=n.getBinding();const Re=h.getDepthInformation(xe[0]);Re&&Re.isValid&&Re.texture&&p.init(Re,s.renderState)}if(me&&me.includes("camera-access")&&S){e.state.unbindTexture(),h=n.getBinding();for(let Re=0;Re<xe.length;Re++){const Ke=xe[Re].camera;if(Ke){let Je=m[Ke];Je||(Je=new ac,m[Ke]=Je);const Ge=h.getCameraImage(Ke);Je.sourceTexture=Ge}}}}for(let xe=0;xe<w.length;xe++){const Ae=E[xe],me=w[xe];Ae!==null&&me!==void 0&&me.update(Ae,pe,l||a)}j&&j(K,pe),pe.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pe}),g=null}const Ie=new dc;Ie.setAnimationLoop(Se),this.setAnimationLoop=function(K){j=K},this.dispose=function(){}}}const hg=new je,Ec=new Le;Ec.set(-1,0,0,0,1,0,0,0,1);function ug(i,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,oc(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,x,T,b){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(p,m):m.isMeshLambertMaterial?(r(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(p,m),h(p,m)):m.isMeshPhongMaterial?(r(p,m),u(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(p,m),d(p,m),m.isMeshPhysicalMaterial&&f(p,m,b)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),S(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?c(p,m,x,T):m.isSpriteMaterial?l(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===It&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===It&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);const x=e.get(m),T=x.envMap,b=x.envMapRotation;T&&(p.envMap.value=T,p.envMapRotation.value.setFromMatrix4(hg.makeRotationFromEuler(b)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Ec),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,x,T){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=T*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function l(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function u(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function h(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.diffuseRoughness>0&&(p.diffuseRoughness.value=m.diffuseRoughness,m.diffuseRoughnessMap&&(p.diffuseRoughnessMap.value=m.diffuseRoughnessMap,t(m.diffuseRoughnessMap,p.diffuseRoughnessMapTransform))),m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===It&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.retroreflectivity>0&&(p.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessMinimum,p.iridescenceThicknessMaximum.value=m.iridescenceThicknessMaximum,m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function S(p,m){const x=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function dg(i,e,t,n){let s={},r={};function a(x,T){const b=T.program;n.uniformBlockBinding(x,b,s[x.id])}function o(x,T){let b=s[x.id];b===void 0&&(g(x),b=c(x),s[x.id]=b,x.addEventListener("dispose",p));const w=T.program;n.updateUBOMapping(x,w);const E=e.render.frame;r[x.id]!==E&&(l(x),r[x.id]=E)}function c(x){const T=i.createBuffer(),b=x.__size,w=x.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,b,w),i.bindBuffer(i.UNIFORM_BUFFER,null),T}function l(x){const T=s[x.id],b=x.uniforms,w=x.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let E=0,_=b.length;E<_;E++){const y=b[E];if(Array.isArray(y))for(let N=0,C=y.length;N<C;N++)u(y[N],E,N,w);else u(y,E,0,w)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(x,T,b,w){if(d(x,T,b,w)===!0){const E=x.__offset,_=x.value;if(Array.isArray(_)){let y=0;for(let N=0;N<_.length;N++){const C=_[N],I=S(C,!0);h(C,x.__data,y),y+=I.storage/Float32Array.BYTES_PER_ELEMENT}}else h(_,x.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,E,x.__data)}}function h(x,T,b){typeof x=="number"||typeof x=="boolean"?T[b]=x:x.isMatrix3?(T[b]=x.elements[0],T[b+1]=x.elements[1],T[b+2]=x.elements[2],T[b+3]=0,T[b+4]=x.elements[3],T[b+5]=x.elements[4],T[b+6]=x.elements[5],T[b+7]=0,T[b+8]=x.elements[6],T[b+9]=x.elements[7],T[b+10]=x.elements[8],T[b+11]=0):ArrayBuffer.isView(x)?T.set(x.subarray(0,T.length-b),b):x.toArray(T,b)}function d(x,T,b,w){const E=x.value,_=T+"_"+b;if(Array.isArray(E)){w[_]===void 0&&(w[_]=[]);const y=w[_];let N=!1;for(let C=0;C<E.length;C++)f(E[C],y,C)===!0&&(N=!0);return N}return f(E,w,_)}function f(x,T,b){if(T[b]===void 0)return typeof x=="number"||typeof x=="boolean"?T[b]=x:ArrayBuffer.isView(x)?T[b]=x.slice():T[b]=x.clone(),!0;{const w=T[b];if(typeof x=="number"||typeof x=="boolean"){if(w!==x)return T[b]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(w.equals(x)===!1)return w.copy(x),!0}}return!1}function g(x){const T=x.uniforms;let b=0;const w=16;for(let _=0,y=T.length;_<y;_++){const N=Array.isArray(T[_])?T[_]:[T[_]];for(let C=0,I=N.length;C<I;C++){const G=N[C],q=Array.isArray(G.value)?G.value:[G.value],L=Array.isArray(T[_])||Array.isArray(G.value);let k=b;for(let z=0,te=q.length;z<te;z++){const W=q[z],Q=S(W,L),j=b%w,Se=j%Q.boundary,Ie=j+Se;b+=Se,Ie!==0&&w-Ie<Q.storage&&(b+=w-Ie),z===0&&(k=b),b+=Q.storage}const J=G.type==="int"?Int32Array:G.type==="uint"?Uint32Array:Float32Array;G.__data=new J((b-k)/Float32Array.BYTES_PER_ELEMENT),G.__offset=k}}const E=b%w;return E>0&&(b+=w-E),x.__size=b,x.__cache={},this}function S(x,T){const b={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(b.boundary=4,b.storage=4):x.isVector2?(b.boundary=8,b.storage=8):x.isVector3||x.isColor?(b.boundary=16,b.storage=12):x.isVector4?(b.boundary=16,b.storage=16):x.isMatrix3?(b.boundary=16,b.storage=48):x.isMatrix4?(b.boundary=16,b.storage=64):x.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(b.boundary=16,b.storage=x.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",x),T===!0&&(b.boundary=16,b.storage=Math.ceil(b.storage/16)*16),b}function p(x){const T=x.target;T.removeEventListener("dispose",p),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function m(){for(const x in s)i.deleteBuffer(s[x]);s={},r={}}return{bind:a,update:o,dispose:m}}const fg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let an=null;function pg(){return an===null&&(an=new ic(fg,16,16,ti,nn),an.name="DFG_LUT",an.minFilter=Ct,an.magFilter=Ct,an.wrapS=Mn,an.wrapT=Mn,an.generateMipmaps=!1,an.needsUpdate=!0),an}class mg{constructor(e={}){const{canvas:t=xh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Gt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;const S=f,p=new Set([Ga,za,Ba]),m=new Set([Gt,cn,ts,Ti,Ua,Fa]),x=new Uint32Array(4),T=new Int32Array(4),b={textures:[],min:[],max:[],resolution:[]};let w=null,E=null;const _=[],y=[];let N=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=En,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const C=this;let I=!1,G=null,q=null,L=null,k=null;this._outputColorSpace=Rt;let J=0,z=0,te=null,W=-1,Q=null;const j=new it,Se=new it;let Ie=null;const K=new De(0);let pe=0,xe=t.width,Ae=t.height,me=1,Ue=null,at=null;const Re=new it(0,0,xe,Ae),Ke=new it(0,0,xe,Ae);let Je=!1;const Ge=new rs,Mt=new Xa;let ut=!1,Nt=!1;const st=new je,sn=new F,mt=new it,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let kt=!1;function Vt(){return te===null?me:1}let D=n;function Wt(M,P){return t.getContext(M,P)}let tt,nt,ue,dt,we,Pe,A,v,O,ee,$,se,ce,X,Y,ae,R,Z,V,oe,ie,re,ye;try{const M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${La}`),t.addEventListener("webglcontextlost",Te,!1),t.addEventListener("webglcontextrestored",Fe,!1),t.addEventListener("webglcontextcreationerror",de,!1),D===null){const P="webgl2";if(D=Wt(P,M),D===null)throw Wt(P)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Be()}catch(M){throw t.removeEventListener("webglcontextlost",Te,!1),t.removeEventListener("webglcontextrestored",Fe,!1),t.removeEventListener("webglcontextcreationerror",de,!1),Ye("WebGLRenderer: "+M.message),M}function Be(){tt=new xp(D),tt.init(),ie=new rg(D,tt),nt=new op(D,tt,e,ie),ue=new ig(D,tt),nt.reversedDepthBuffer&&d&&ue.buffers.depth.setReversed(!0),q=D.createFramebuffer(),L=D.createFramebuffer(),k=D.createFramebuffer(),dt=new Sp(D),we=new Vm,Pe=new sg(D,tt,ue,we,nt,ie,dt),A=new _p(C),v=new Eu(D),re=new rp(D,v),O=new vp(D,v,dt,re),ee=new yp(D,O,v,re,dt),Z=new Ep(D,nt,Pe),Y=new lp(we),$=new km(C,A,tt,nt,re,Y),se=new ug(C,we),ce=new Xm,X=new Jm(tt),R=new sp(C,A,ue,ee,g,c),ae=new ng(C,ee,nt),ye=new dg(D,dt,nt,ue),V=new ap(D,tt,dt),oe=new Mp(D,tt,dt),dt.programs=$.programs,C.capabilities=nt,C.extensions=tt,C.properties=we,C.renderLists=ce,C.shadowMap=ae,C.state=ue,C.info=dt}S!==Gt&&(N=new Tp(S,t.width,t.height,o,s,r));const ne=new cg(C,D);this.xr=ne,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const M=tt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=tt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return me},this.setPixelRatio=function(M){M!==void 0&&(me=M,this.setSize(xe,Ae,!1))},this.getSize=function(M){return M.set(xe,Ae)},this.setSize=function(M,P,H=!0){if(ne.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}xe=M,Ae=P,t.width=Math.floor(M*me),t.height=Math.floor(P*me),H===!0&&(t.style.width=M+"px",t.style.height=P+"px"),N!==null&&N.setSize(t.width,t.height),this.setViewport(0,0,M,P)},this.getDrawingBufferSize=function(M){return M.set(xe*me,Ae*me).floor()},this.setDrawingBufferSize=function(M,P,H){xe=M,Ae=P,me=H,t.width=Math.floor(M*H),t.height=Math.floor(P*H),this.setViewport(0,0,M,P)},this.setEffects=function(M){if(S===Gt){Ye("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let P=0;P<M.length;P++)if(M[P].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}N.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(j)},this.getViewport=function(M){return M.copy(Re)},this.setViewport=function(M,P,H,U){M.isVector4?Re.set(M.x,M.y,M.z,M.w):Re.set(M,P,H,U),ue.viewport(j.copy(Re).multiplyScalar(Vt()).round())},this.getScissor=function(M){return M.copy(Ke)},this.setScissor=function(M,P,H,U){M.isVector4?Ke.set(M.x,M.y,M.z,M.w):Ke.set(M,P,H,U),ue.scissor(Se.copy(Ke).multiplyScalar(Vt()).round())},this.getScissorTest=function(){return Je},this.setScissorTest=function(M){ue.setScissorTest(Je=M)},this.setOpaqueSort=function(M){Ue=M},this.setTransparentSort=function(M){at=M},this.getClearColor=function(M){return M.copy(R.getClearColor())},this.setClearColor=function(){R.setClearColor(...arguments)},this.getClearAlpha=function(){return R.getClearAlpha()},this.setClearAlpha=function(){R.setClearAlpha(...arguments)},this.clear=function(M=!0,P=!0,H=!0){let U=0;if(M){let B=!1;if(te!==null){const he=te.texture.format;B=p.has(he)}if(B){const he=te.texture.type,_e=m.has(he),le=R.getClearColor(),ge=R.getClearAlpha(),Ee=le.r,Ne=le.g,He=le.b;_e?(x[0]=Ee,x[1]=Ne,x[2]=He,x[3]=ge,D.clearBufferuiv(D.COLOR,0,x)):(T[0]=Ee,T[1]=Ne,T[2]=He,T[3]=ge,D.clearBufferiv(D.COLOR,0,T))}else U|=D.COLOR_BUFFER_BIT}P&&(U|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(U|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U!==0&&D.clear(U)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),G=M},this.dispose=function(){t.removeEventListener("webglcontextlost",Te,!1),t.removeEventListener("webglcontextrestored",Fe,!1),t.removeEventListener("webglcontextcreationerror",de,!1),R.dispose(),ce.dispose(),X.dispose(),Pe.dispose(),we.dispose(),A.dispose(),ee.dispose(),O.dispose(),re.dispose(),ye.dispose(),$.dispose(),ne.dispose(),ne.removeEventListener("sessionstart",lo),ne.removeEventListener("sessionend",co),Vn.stop()};function Te(M){M.preventDefault(),Ao("WebGLRenderer: Context Lost."),I=!0}function Fe(){Ao("WebGLRenderer: Context Restored."),I=!1;const M=dt.autoReset,P=ae.enabled,H=ae.autoUpdate,U=ae.needsUpdate,B=ae.type;Be(),dt.autoReset=M,ae.enabled=P,ae.autoUpdate=H,ae.needsUpdate=U,ae.type=B}function de(M){Ye("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Ze(M){const P=M.target;P.removeEventListener("dispose",Ze),gt(P)}function gt(M){Tn(M),we.remove(M)}function Tn(M){const P=we.get(M).programs;P!==void 0&&(P.forEach(function(H){$.releaseProgram(H)}),M.isShaderMaterial&&$.releaseShaderCache(M))}this.renderBufferDirect=function(M,P,H,U,B,he){P===null&&(P=Ht);const _e=B.isMesh&&B.matrixWorld.determinantAffine()<0,le=Ac(M,P,H,U,B);ue.setMaterial(U,_e);let ge=H.index,Ee=1;if(U.wireframe===!0){if(ge=O.getWireframeAttribute(H),ge===void 0)return;Ee=2}const Ne=H.drawRange,He=H.attributes.position;let ve=Ne.start*Ee,ke=(Ne.start+Ne.count)*Ee;he!==null&&(ve=Math.max(ve,he.start*Ee),ke=Math.min(ke,(he.start+he.count)*Ee)),ge!==null?(ve=Math.max(ve,0),ke=Math.min(ke,ge.count)):He!=null&&(ve=Math.max(ve,0),ke=Math.min(ke,He.count));const ot=ke-ve;if(ot<0||ot===1/0)return;re.setup(B,U,le,H,ge);let et,Qe=V;if(ge!==null&&(et=v.get(ge),Qe=oe,Qe.setIndex(et)),B.isMesh)U.wireframe===!0?(ue.setLineWidth(U.wireframeLinewidth*Vt()),Qe.setMode(D.LINES)):Qe.setMode(D.TRIANGLES);else if(B.isLine){let bt=U.linewidth;bt===void 0&&(bt=1),ue.setLineWidth(bt*Vt()),B.isLineSegments?Qe.setMode(D.LINES):B.isLineLoop?Qe.setMode(D.LINE_LOOP):Qe.setMode(D.LINE_STRIP)}else B.isPoints?Qe.setMode(D.POINTS):B.isSprite&&Qe.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(tt.get("WEBGL_multi_draw"))Qe.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{const bt=B._multiDrawStarts,Me=B._multiDrawCounts,Pt=B._multiDrawCount,qe=ge?v.get(ge).bytesPerElement:1,Wn=we.get(U).currentProgram.getUniforms();for(let Tt=0;Tt<Pt;Tt++)Wn.setValue(D,"_gl_DrawID",Tt),Qe.render(bt[Tt]/qe,Me[Tt])}else if(B.isInstancedMesh)Qe.renderInstances(ve,ot,B.count);else if(H.isInstancedBufferGeometry){const bt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Me=Math.min(H.instanceCount,bt);Qe.renderInstances(ve,ot,Me)}else Qe.render(ve,ot)};function oo(M,P,H,U){G!==null&&M.isNodeMaterial&&G.setObject(U,M),ut===!0&&Y.setState(M,H,!1),M.transparent===!0&&M.side===Ft&&M.forceSinglePass===!1?(M.side=It,M.needsUpdate=!0,Oi(M,P,U),M.side=ei,M.needsUpdate=!0,Oi(M,P,U),M.side=Ft):Oi(M,P,U)}this.compile=function(M,P,H=null){H===null&&(H=M),G!==null&&G.renderStart(M,P,H),E=X.get(H),E.init(P),y.push(E),H.traverseVisible(function(B){B.isLight&&B.layers.test(P.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),M!==H&&M.traverseVisible(function(B){B.isLight&&B.layers.test(P.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),E.setupLights(),G!==null&&G.updateLights(E.state.lightsArray),Nt=this.localClippingEnabled,ut=Y.init(this.clippingPlanes,Nt),ut===!0&&Y.setGlobalState(this.clippingPlanes,P),G!==null&&ae.render(E.state.shadowsArray,H,P);const U=new Set;return M.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;const he=B.material;if(he)if(Array.isArray(he))for(let _e=0;_e<he.length;_e++){const le=he[_e];oo(le,H,P,B),U.add(le)}else oo(he,H,P,B),U.add(he)}),E=y.pop(),G!==null&&G.renderEnd(),U},this.compileAsync=function(M,P,H=null){const U=this.compile(M,P,H);return new Promise(B=>{function he(){if(U.forEach(function(_e){const ge=we.get(_e).currentProgram;(ge===void 0||ge.isReady())&&U.delete(_e)}),U.size===0){B(M);return}setTimeout(he,10)}tt.get("KHR_parallel_shader_compile")!==null?he():setTimeout(he,10)})};let sr=null;function bc(M){sr&&sr(M)}function lo(){Vn.stop()}function co(){Vn.start()}const Vn=new dc;Vn.setAnimationLoop(bc),typeof self<"u"&&Vn.setContext(self),this.setAnimationLoop=function(M){sr=M,ne.setAnimationLoop(M),M===null?Vn.stop():Vn.start()},ne.addEventListener("sessionstart",lo),ne.addEventListener("sessionend",co),this.render=function(M,P){if(P!==void 0&&P.isCamera!==!0){Ye("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;G!==null&&G.renderStart(M,P);const H=ne.enabled===!0&&ne.isPresenting===!0,U=N!==null&&(te===null||H)&&N.begin(C,te);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),ne.enabled===!0&&ne.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(ne.cameraAutoUpdate===!0&&ne.updateCamera(P),P=ne.getCamera()),M.isScene===!0&&M.onBeforeRender(C,M,P,te),E=X.get(M,y.length),E.init(P),E.state.textureUnits=Pe.getTextureUnits(),y.push(E),st.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),P.isArrayCamera?Mt.setFromArrayCamera(P):Ge.setFromProjectionMatrix(st,en,P.reversedDepth),Nt=this.localClippingEnabled,ut=Y.init(this.clippingPlanes,Nt),w=ce.get(M,_.length),w.init(),_.push(w),this.info.render.frame++,ne.enabled===!0&&ne.isPresenting===!0){const _e=C.xr.getDepthSensingMesh();_e!==null&&rr(_e,P,-1/0,C.sortObjects)}rr(M,P,0,C.sortObjects),w.finish(),G!==null&&G.updateLights(E.state.lightsArray),C.sortObjects===!0&&w.sort(Ue,at),kt=ne.enabled===!1||ne.isPresenting===!1||ne.hasDepthSensing()===!1,kt&&R.addToRenderList(w,M),this.info.autoReset===!0&&this.info.reset(),ut===!0&&Y.beginShadows();const B=E.state.shadowsArray;if(ae.render(B,M,P),ut===!0&&Y.endShadows(),(U&&N.hasRenderPass())===!1){const _e=w.opaque,le=w.transmissive;if(E.setupLights(),P.isArrayCamera){const ge=P.cameras;if(le.length>0)for(let Ee=0,Ne=ge.length;Ee<Ne;Ee++){const He=ge[Ee];uo(_e,le,M,He)}kt&&R.render(M);for(let Ee=0,Ne=ge.length;Ee<Ne;Ee++){const He=ge[Ee];ho(w,M,He,He.viewport)}}else le.length>0&&uo(_e,le,M,P),kt&&R.render(M),ho(w,M,P)}te!==null&&z===0&&(Pe.updateMultisampleRenderTarget(te),Pe.updateRenderTargetMipmap(te)),U&&N.end(C),M.isScene===!0&&M.onAfterRender(C,M,P),re.resetDefaultState(),W=-1,Q=null,y.pop(),y.length>0?(E=y[y.length-1],Pe.setTextureUnits(E.state.textureUnits),ut===!0&&Y.setGlobalState(C.clippingPlanes,E.state.camera)):E=null,_.pop(),_.length>0?w=_[_.length-1]:w=null,G!==null&&G.renderEnd()};function rr(M,P,H,U){if(M.visible===!1)return;if(M.layers.test(P.layers)){if(M.isGroup)H=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(P);else if(M.isLight)E.pushLight(M),M.castShadow&&E.pushShadow(M);else if(M.isSprite){const _e=P.isArrayCamera?Mt:Ge;if(!M.frustumCulled||M.intersectsFrustum(_e)){U&&mt.setFromMatrixPosition(M.matrixWorld).applyMatrix4(st);const le=ee.update(M),ge=M.material;ge.visible&&w.push(M,le,ge,H,mt.z,null,P)}}else if(M.isMesh||M.isLine||M.isPoints){const _e=P.isArrayCamera?Mt:Ge;if(!M.frustumCulled||M.intersectsFrustum(_e)){const le=ee.update(M),ge=M.material;if(U&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),mt.copy(M.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),mt.copy(le.boundingSphere.center)),mt.applyMatrix4(M.matrixWorld).applyMatrix4(st)),Array.isArray(ge)){const Ee=le.groups;for(let Ne=0,He=Ee.length;Ne<He;Ne++){const ve=Ee[Ne],ke=ge[ve.materialIndex];ke&&ke.visible&&w.push(M,le,ke,H,mt.z,ve,P)}}else ge.visible&&w.push(M,le,ge,H,mt.z,null,P)}}}const he=M.children;for(let _e=0,le=he.length;_e<le;_e++)rr(he[_e],P,H,U)}function ho(M,P,H,U){const{opaque:B,transmissive:he,transparent:_e}=M;E.setupLightsView(H),ut===!0&&Y.setGlobalState(C.clippingPlanes,H),U&&ue.viewport(j.copy(U)),B.length>0&&cs(B,P,H),he.length>0&&cs(he,P,H),_e.length>0&&cs(_e,P,H),ue.buffers.depth.setTest(!0),ue.buffers.depth.setMask(!0),ue.buffers.color.setMask(!0),ue.setPolygonOffset(!1)}function uo(M,P,H,U){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[U.id]===void 0){const ve=tt.has("EXT_color_buffer_half_float")||tt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[U.id]=new tn(1,1,{generateMipmaps:!0,type:ve?nn:Gt,minFilter:On,samples:Math.max(4,nt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:We.workingColorSpace})}const he=E.state.transmissionRenderTarget[U.id],_e=U.viewport||j;he.setSize(_e.z*C.transmissionResolutionScale,_e.w*C.transmissionResolutionScale);const le=C.getRenderTarget(),ge=C.getActiveCubeFace(),Ee=C.getActiveMipmapLevel();C.setRenderTarget(he),C.getClearColor(K),pe=C.getClearAlpha(),pe<1&&C.setClearColor(16777215,.5),C.clear(),kt&&R.render(H);const Ne=C.toneMapping;C.toneMapping=En;const He=U.viewport;if(U.viewport!==void 0&&(U.viewport=void 0),E.setupLightsView(U),ut===!0&&Y.setGlobalState(C.clippingPlanes,U),cs(M,H,U),Pe.updateMultisampleRenderTarget(he),Pe.updateRenderTargetMipmap(he),tt.has("WEBGL_multisampled_render_to_texture")===!1){let ve=!1;for(let ke=0,ot=P.length;ke<ot;ke++){const et=P[ke],{object:Qe,geometry:bt,material:Me,group:Pt}=et;if(Me.side===Ft&&Qe.layers.test(U.layers)){const qe=Me.side;Me.side=It,Me.needsUpdate=!0,fo(Qe,H,U,bt,Me,Pt),Me.side=qe,Me.needsUpdate=!0,ve=!0}}ve===!0&&(Pe.updateMultisampleRenderTarget(he),Pe.updateRenderTargetMipmap(he))}C.setRenderTarget(le,ge,Ee),C.setClearColor(K,pe),He!==void 0&&(U.viewport=He),C.toneMapping=Ne}function cs(M,P,H){const U=P.isScene===!0?P.overrideMaterial:null;for(let B=0,he=M.length;B<he;B++){const _e=M[B],{object:le,geometry:ge,group:Ee}=_e;let Ne=_e.material;Ne.allowOverride===!0&&U!==null&&(Ne=U),le.layers.test(H.layers)&&fo(le,P,H,ge,Ne,Ee)}}function fo(M,P,H,U,B,he){G!==null&&B.isNodeMaterial&&G.setObject(M,B),M.onBeforeRender(C,P,H,U,B,he),M.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(C,P,H,U,M,he),B.transparent===!0&&B.side===Ft&&B.forceSinglePass===!1?(B.side=It,B.needsUpdate=!0,C.renderBufferDirect(H,P,U,B,M,he),B.side=ei,B.needsUpdate=!0,C.renderBufferDirect(H,P,U,B,M,he),B.side=Ft):C.renderBufferDirect(H,P,U,B,M,he),M.onAfterRender(C,P,H,U,B,he)}function po(M){let P=0;for(const H of M)H.texture!==null&&P++;return P}function Oi(M,P,H){P.isScene!==!0&&(P=Ht);const U=we.get(M),B=E.state.lights,he=E.state.shadowsArray,_e=B.state.version,le=$.getParameters(M,B.state,he,P,H,E.state.lightProbeGridArray),ge=$.getProgramCacheKey(le);let Ee=U.programs;U.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?P.environment:null,U.fog=P.fog;const Ne=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;U.envMap=A.get(M.envMap||U.environment,Ne),U.envMapRotation=U.environment!==null&&M.envMap===null?P.environmentRotation:M.envMapRotation,Ee===void 0&&(M.addEventListener("dispose",Ze),Ee=new Map,U.programs=Ee,U.programVariants=new Map);let He=Ee.get(ge);if(He!==void 0){if(U.currentProgram===He&&U.lightsStateVersion===_e)return go(M,le),He}else le.uniforms=$.getUniforms(M),G!==null&&M.isNodeMaterial&&G.build(M,H,le),M.onBeforeCompile(le,C),He=$.acquireProgram(le,ge),Ee.set(ge,He),U.uniforms=le.uniforms;const ve=U.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(ve.clippingPlanes=Y.uniform),go(M,le),U.needsLights=Rc(M),U.lightsStateVersion=_e,U.needsLights&&(ve.ambientLightColor.value=B.state.ambient,ve.lightProbe.value=B.state.probe,ve.sunLights.value=B.state.sun,ve.sunLightShadows.value=B.state.sunShadow,ve.directionalLights.value=B.state.directional,ve.directionalLightShadows.value=B.state.directionalShadow,ve.spotLights.value=B.state.spot,ve.spotLightShadows.value=B.state.spotShadow,ve.rectAreaLights.value=B.state.rectArea,ve.ltc_1.value=B.state.rectAreaLTC1,ve.ltc_2.value=B.state.rectAreaLTC2,ve.pointLights.value=B.state.point,ve.pointLightShadows.value=B.state.pointShadow,ve.hemisphereLights.value=B.state.hemi,ve.sunShadowMatrix.value=B.state.sunShadowMatrix,ve.sunShadowCascade.value=B.state.sunShadowCascade,ve.directionalShadowMatrix.value=B.state.directionalShadowMatrix,ve.spotLightMatrix.value=B.state.spotLightMatrix,ve.spotLightMap.value=B.state.spotLightMap,ve.pointShadowMatrix.value=B.state.pointShadowMatrix),U.numLightProbeGrids=po(E.state.lightProbeGridArray),U.currentProgram=He,U.uniformsList=null,He}function Tc(M,P,H,U,B){const he=we.get(M),_e=he.currentProgram.id+","+U+","+B;let le=he.programVariants.get(_e);return le===void 0?(le=Oi(M,P,H),he.programVariants.set(_e,le)):(he.currentProgram=le,he.uniformsList=null,he.outputColorSpace=U,he.toneMapping=B),le}function mo(M){if(M.uniformsList===null){const P=M.currentProgram.getUniforms();M.uniformsList=Vs.seqWithValue(P.seq,M.uniforms)}return M.uniformsList}function go(M,P){const H=we.get(M);H.outputColorSpace=P.outputColorSpace,H.batching=P.batching,H.batchingColor=P.batchingColor,H.instancing=P.instancing,H.instancingColor=P.instancingColor,H.instancingMorph=P.instancingMorph,H.skinning=P.skinning,H.morphTargets=P.morphTargets,H.morphNormals=P.morphNormals,H.morphColors=P.morphColors,H.morphTargetsCount=P.morphTargetsCount,H.numClippingPlanes=P.numClippingPlanes,H.numIntersection=P.numClipIntersection,H.vertexAlphas=P.vertexAlphas,H.vertexTangents=P.vertexTangents,H.toneMapping=P.toneMapping}function Ac(M,P,H,U,B){P.isScene!==!0&&(P=Ht),Pe.resetTextureUnits();const he=P.fog,_e=U.isMeshStandardMaterial||U.isMeshLambertMaterial||U.isMeshPhongMaterial?P.environment:null,le=te===null?C.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:We.workingColorSpace,ge=U.isMeshStandardMaterial||U.isMeshLambertMaterial&&!U.envMap||U.isMeshPhongMaterial&&!U.envMap,Ee=A.get(U.envMap||_e,ge),Ne=U.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,He=!!H.attributes.tangent&&(!!U.normalMap||U.anisotropy>0),ve=!!H.morphAttributes.position,ke=!!H.morphAttributes.normal,ot=!!H.morphAttributes.color;let et=En;U.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(et=C.toneMapping);const Qe=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,bt=Qe!==void 0?Qe.length:0,Me=we.get(U),Pt=E.state.lights;if(ut===!0&&(Nt===!0||M!==Q)){const rt=M===Q&&U.id===W;Y.setState(U,M,rt)}let qe=!1,Wn=!1;U.version===Me.__version?Me.needsLights&&Me.lightsStateVersion!==Pt.state.version||B.isBatchedMesh&&Me.batching===!1||!B.isBatchedMesh&&Me.batching===!0||B.isBatchedMesh&&Me.batchingColor===!0&&B._colorsTexture===null||B.isBatchedMesh&&Me.batchingColor===!1&&B._colorsTexture!==null||B.isInstancedMesh&&Me.instancing===!1||!B.isInstancedMesh&&Me.instancing===!0||B.isSkinnedMesh&&Me.skinning===!1||!B.isSkinnedMesh&&Me.skinning===!0||B.isInstancedMesh&&Me.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Me.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Me.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Me.instancingMorph===!1&&B.morphTexture!==null||Me.envMap!==Ee||U.fog===!0&&Me.fog!==he||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==Y.numPlanes||Me.numIntersection!==Y.numIntersection)||Me.vertexAlphas!==Ne||Me.vertexTangents!==He||Me.morphTargets!==ve||Me.morphNormals!==ke||Me.morphColors!==ot||Me.morphTargetsCount!==bt||Me.numLightProbeGrids!==po(E.state.lightProbeGridArray)?qe=!0:(Me.outputColorSpace!==le||Me.toneMapping!==et)&&(Wn=!0):(qe=!0,Me.__version=U.version);let Tt=Me.currentProgram;(qe===!0||Wn===!0)&&(Tt=Wn===!0?Tc(U,P,B,le,et):Oi(U,P,B),G&&U.isNodeMaterial&&G.onUpdateProgram(U,Tt,Me));let hs=!1,An=!1,Xn=!1;const Xe=Tt.getUniforms(),St=Me.uniforms;if(ue.useProgram(Tt.program)&&(hs=!0,An=!0,Xn=!0),U.id!==W&&(W=U.id,An=!0),hs||Q!==M){ue.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Xe.setValue(D,"projectionMatrix",M.projectionMatrix),Xe.setValue(D,"viewMatrix",M.matrixWorldInverse);const _t=Xe.map.cameraPosition;_t!==void 0&&_t.setValue(D,sn.setFromMatrixPosition(M.matrixWorld)),nt.logarithmicDepthBuffer&&Xe.setValue(D,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial)&&Xe.setValue(D,"isOrthographic",M.isOrthographicCamera===!0),Q!==M&&(Q=M,An=!0,Xn=!0)}if(Me.needsLights&&(Pt.state.sunShadowMap.length>0&&Xe.setValue(D,"sunShadowMap",Pt.state.sunShadowMap,Pe),Pt.state.directionalShadowMap.length>0&&Xe.setValue(D,"directionalShadowMap",Pt.state.directionalShadowMap,Pe),Pt.state.spotShadowMap.length>0&&Xe.setValue(D,"spotShadowMap",Pt.state.spotShadowMap,Pe),Pt.state.pointShadowMap.length>0&&Xe.setValue(D,"pointShadowMap",Pt.state.pointShadowMap,Pe)),B.isSkinnedMesh){Xe.setOptional(D,B,"bindMatrix"),Xe.setOptional(D,B,"bindMatrixInverse");const rt=B.skeleton;rt&&(rt.boneTexture===null&&rt.computeBoneTexture(),Xe.setValue(D,"boneTexture",rt.boneTexture,Pe))}B.isBatchedMesh&&(Xe.setOptional(D,B,"batchingTexture"),Xe.setValue(D,"batchingTexture",B._matricesTexture,Pe),Xe.setOptional(D,B,"batchingIdTexture"),Xe.setValue(D,"batchingIdTexture",B._indirectTexture,Pe),Xe.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&Xe.setValue(D,"batchingColorTexture",B._colorsTexture,Pe));const Kt=H.morphAttributes;if((Kt.position!==void 0||Kt.normal!==void 0||Kt.color!==void 0)&&Z.update(B,H,Tt),(An||Me.receiveShadow!==B.receiveShadow)&&(Me.receiveShadow=B.receiveShadow,Xe.setValue(D,"receiveShadow",B.receiveShadow)),(U.isMeshStandardMaterial||U.isMeshLambertMaterial||U.isMeshPhongMaterial)&&U.envMap===null&&P.environment!==null&&(St.envMapIntensity.value=P.environmentIntensity),St.dfgLUT!==void 0&&(St.dfgLUT.value=pg()),An){if(Xe.setValue(D,"toneMappingExposure",C.toneMappingExposure),Me.needsLights&&wc(St,Xn),he&&U.fog===!0&&se.refreshFogUniforms(St,he),se.refreshMaterialUniforms(St,U,me,Ae,E.state.transmissionRenderTarget[M.id]),Me.needsLights&&Me.numLightProbeGrids>0){const rt=b;let _t=0;for(const fn of E.state.lightProbeGridArray)fn.texture!==null&&(rt.textures[_t]=fn.texture,rt.min[_t]=fn.boundingBox.min,rt.max[_t]=fn.boundingBox.max,rt.resolution[_t]=fn.resolution,_t++);for(const fn in rt)rt[fn].length=_t;St.probesSH.value=rt.textures,St.probesMin.value=rt.min,St.probesMax.value=rt.max,St.probesResolution.value=rt.resolution}Vs.upload(D,mo(Me),St,Pe)}if(U.isShaderMaterial&&U.uniformsNeedUpdate===!0&&(Vs.upload(D,mo(Me),St,Pe),U.uniformsNeedUpdate=!1),U.isSpriteMaterial&&Xe.setValue(D,"center",B.center),Xe.setValue(D,"modelViewMatrix",B.modelViewMatrix),Xe.setValue(D,"normalMatrix",B.normalMatrix),Xe.setValue(D,"modelMatrix",B.matrixWorld),U.uniformsGroups!==void 0){const rt=U.uniformsGroups;for(let _t=0,fn=rt.length;_t<fn;_t++){const xo=rt[_t];ye.update(xo,Tt),ye.bind(xo,Tt)}}return Tt}function wc(M,P){M.ambientLightColor.needsUpdate=P,M.lightProbe.needsUpdate=P,M.sunLights.needsUpdate=P,M.sunLightShadows.needsUpdate=P,M.directionalLights.needsUpdate=P,M.directionalLightShadows.needsUpdate=P,M.pointLights.needsUpdate=P,M.pointLightShadows.needsUpdate=P,M.spotLights.needsUpdate=P,M.spotLightShadows.needsUpdate=P,M.rectAreaLights.needsUpdate=P,M.hemisphereLights.needsUpdate=P}function Rc(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return J},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return te},this.setRenderTargetTextures=function(M,P,H){const U=we.get(M);U.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,U.__autoAllocateDepthBuffer===!1&&(U.__useRenderToTexture=!1),we.get(M.texture).__webglTexture=P,we.get(M.depthTexture).__webglTexture=U.__autoAllocateDepthBuffer?void 0:H,U.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,P){const H=we.get(M);H.__webglFramebuffer=P,H.__useDefaultFramebuffer=P===void 0},this.setRenderTarget=function(M,P=0,H=0){te=M,J=P,z=H;let U=null,B=!1,he=!1;if(M){const le=we.get(M);if(le.__useDefaultFramebuffer!==void 0){ue.bindFramebuffer(D.FRAMEBUFFER,le.__webglFramebuffer),j.copy(M.viewport),Se.copy(M.scissor),Ie=M.scissorTest,ue.viewport(j),ue.scissor(Se),ue.setScissorTest(Ie),W=-1;return}else if(le.__webglFramebuffer===void 0)Pe.setupRenderTarget(M);else if(le.__hasExternalTextures)Pe.rebindTextures(M,we.get(M.texture).__webglTexture,we.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Ne=M.depthTexture;if(le.__boundDepthTexture!==Ne){if(Ne!==null&&we.has(Ne)&&(M.width!==Ne.image.width||M.height!==Ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Pe.setupDepthRenderbuffer(M)}}const ge=M.texture;(ge.isData3DTexture||ge.isDataArrayTexture||ge.isCompressedArrayTexture)&&(he=!0);const Ee=we.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ee[P])?U=Ee[P][H]:U=Ee[P],B=!0):M.samples>0&&Pe.useMultisampledRTT(M)===!1?U=we.get(M).__webglMultisampledFramebuffer:Array.isArray(Ee)?U=Ee[H]:U=Ee,j.copy(M.viewport),Se.copy(M.scissor),Ie=M.scissorTest}else j.copy(Re).multiplyScalar(me).floor(),Se.copy(Ke).multiplyScalar(me).floor(),Ie=Je;if(H!==0&&(U=q),ue.bindFramebuffer(D.FRAMEBUFFER,U)&&ue.drawBuffers(M,U),ue.viewport(j),ue.scissor(Se),ue.setScissorTest(Ie),B){const le=we.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+P,le.__webglTexture,H)}else if(he){const le=P;for(let ge=0;ge<M.textures.length;ge++){const Ee=we.get(M.textures[ge]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+ge,Ee.__webglTexture,H,le)}}else if(M!==null&&H!==0){const le=we.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,le.__webglTexture,H)}W=-1};function _o(M){const P=we.get(M);return(P.__readFormat!==M.format||P.__readType!==M.type)&&(P.__readFormat=M.format,P.__readType=M.type,P.__formatReadable=nt.textureFormatReadable(M.format),P.__typeReadable=nt.textureTypeReadable(M.type)),P}this.readRenderTargetPixels=function(M,P,H,U,B,he,_e,le=0){if(!(M&&M.isWebGLRenderTarget)){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=we.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(ge=ge[_e],Array.isArray(ge)&&(ge=ge[0])),ge){ue.bindFramebuffer(D.FRAMEBUFFER,ge);try{const Ee=M.textures[le],Ne=Ee.format,He=Ee.type;M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+le);const ve=_o(Ee);if(ve.__formatReadable===!1){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(ve.__typeReadable===!1){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=M.width-U&&H>=0&&H<=M.height-B&&D.readPixels(P,H,U,B,ie.convert(Ne),ie.convert(He),he)}finally{const Ee=te!==null?we.get(te).__webglFramebuffer:null;ue.bindFramebuffer(D.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(M,P,H,U,B,he,_e,le=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=we.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(ge=ge[_e],Array.isArray(ge)&&(ge=ge[0])),ge)if(P>=0&&P<=M.width-U&&H>=0&&H<=M.height-B){ue.bindFramebuffer(D.FRAMEBUFFER,ge);const Ee=M.textures[le],Ne=Ee.format,He=Ee.type;M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+le);const ve=_o(Ee);if(ve.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(ve.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ke=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,ke),D.bufferData(D.PIXEL_PACK_BUFFER,he.byteLength,D.STREAM_READ),D.readPixels(P,H,U,B,ie.convert(Ne),ie.convert(He),0),D.bindBuffer(D.PIXEL_PACK_BUFFER,null);const ot=te!==null?we.get(te).__webglFramebuffer:null;ue.bindFramebuffer(D.FRAMEBUFFER,ot);const et=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await vh(D,et,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,ke),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,he),D.bindBuffer(D.PIXEL_PACK_BUFFER,null),D.deleteBuffer(ke),D.deleteSync(et),he}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,P=null,H=0){const U=Math.pow(2,-H),B=Math.floor(M.image.width*U),he=Math.floor(M.image.height*U),_e=P!==null?P.x:0,le=P!==null?P.y:0;Pe.setTexture2D(M,0),D.copyTexSubImage2D(D.TEXTURE_2D,H,0,0,_e,le,B,he),ue.unbindTexture()},this.copyTextureToTexture=function(M,P,H=null,U=null,B=0,he=0){let _e,le,ge,Ee,Ne,He,ve,ke,ot;const et=M.isCompressedTexture?M.mipmaps[he]:M.image;if(H!==null)_e=H.max.x-H.min.x,le=H.max.y-H.min.y,ge=H.isBox3?H.max.z-H.min.z:1,Ee=H.min.x,Ne=H.min.y,He=H.isBox3?H.min.z:0;else{const Xe=Math.pow(2,-B);_e=Math.floor(et.width*Xe),le=Math.floor(et.height*Xe),M.isDataArrayTexture?ge=et.depth:M.isData3DTexture?ge=Math.floor(et.depth*Xe):ge=1,Ee=0,Ne=0,He=0}U!==null?(ve=U.x,ke=U.y,ot=U.z):(ve=0,ke=0,ot=0);const Qe=ie.convert(P.format),bt=ie.convert(P.type);let Me;P.isData3DTexture?(Pe.setTexture3D(P,0),Me=D.TEXTURE_3D):P.isDataArrayTexture||P.isCompressedArrayTexture?(Pe.setTexture2DArray(P,0),Me=D.TEXTURE_2D_ARRAY):(Pe.setTexture2D(P,0),Me=D.TEXTURE_2D),ue.activeTexture(D.TEXTURE0),ue.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,P.flipY),ue.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),ue.pixelStorei(D.UNPACK_ALIGNMENT,P.unpackAlignment);const Pt=ue.getParameter(D.UNPACK_ROW_LENGTH),qe=ue.getParameter(D.UNPACK_IMAGE_HEIGHT),Wn=ue.getParameter(D.UNPACK_SKIP_PIXELS),Tt=ue.getParameter(D.UNPACK_SKIP_ROWS),hs=ue.getParameter(D.UNPACK_SKIP_IMAGES);ue.pixelStorei(D.UNPACK_ROW_LENGTH,et.width),ue.pixelStorei(D.UNPACK_IMAGE_HEIGHT,et.height),ue.pixelStorei(D.UNPACK_SKIP_PIXELS,Ee),ue.pixelStorei(D.UNPACK_SKIP_ROWS,Ne),ue.pixelStorei(D.UNPACK_SKIP_IMAGES,He);const An=M.isDataArrayTexture||M.isData3DTexture,Xn=P.isDataArrayTexture||P.isData3DTexture;if(M.isDepthTexture){const Xe=we.get(M),St=we.get(P),Kt=we.get(Xe.__renderTarget),rt=we.get(St.__renderTarget);ue.bindFramebuffer(D.READ_FRAMEBUFFER,Kt.__webglFramebuffer),ue.bindFramebuffer(D.DRAW_FRAMEBUFFER,rt.__webglFramebuffer);for(let _t=0;_t<ge;_t++)An&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,we.get(M).__webglTexture,B,He+_t),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,we.get(P).__webglTexture,he,ot+_t)),D.blitFramebuffer(Ee,Ne,Ee+_e,Ne+le,ve,ke,ve+_e,ke+le,D.DEPTH_BUFFER_BIT,D.NEAREST);ue.bindFramebuffer(D.READ_FRAMEBUFFER,null),ue.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(B!==0||M.isRenderTargetTexture||we.has(M)){const Xe=we.get(M),St=we.get(P);ue.bindFramebuffer(D.READ_FRAMEBUFFER,L),ue.bindFramebuffer(D.DRAW_FRAMEBUFFER,k);for(let Kt=0;Kt<ge;Kt++)An?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Xe.__webglTexture,B,He+Kt):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Xe.__webglTexture,B),Xn?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,St.__webglTexture,he,ot+Kt):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,St.__webglTexture,he),B!==0?D.blitFramebuffer(Ee,Ne,Ee+_e,Ne+le,ve,ke,ve+_e,ke+le,D.COLOR_BUFFER_BIT,D.NEAREST):Xn?D.copyTexSubImage3D(Me,he,ve,ke,ot+Kt,Ee,Ne,_e,le):D.copyTexSubImage2D(Me,he,ve,ke,Ee,Ne,_e,le);ue.bindFramebuffer(D.READ_FRAMEBUFFER,null),ue.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else Xn?M.isDataTexture||M.isData3DTexture?D.texSubImage3D(Me,he,ve,ke,ot,_e,le,ge,Qe,bt,et.data):P.isCompressedArrayTexture?D.compressedTexSubImage3D(Me,he,ve,ke,ot,_e,le,ge,Qe,et.data):D.texSubImage3D(Me,he,ve,ke,ot,_e,le,ge,Qe,bt,et):M.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,he,ve,ke,_e,le,Qe,bt,et.data):M.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,he,ve,ke,et.width,et.height,Qe,et.data):D.texSubImage2D(D.TEXTURE_2D,he,ve,ke,_e,le,Qe,bt,et);ue.pixelStorei(D.UNPACK_ROW_LENGTH,Pt),ue.pixelStorei(D.UNPACK_IMAGE_HEIGHT,qe),ue.pixelStorei(D.UNPACK_SKIP_PIXELS,Wn),ue.pixelStorei(D.UNPACK_SKIP_ROWS,Tt),ue.pixelStorei(D.UNPACK_SKIP_IMAGES,hs),he===0&&P.generateMipmaps===!0&&P.mipmapsAutoUpdate===!0&&D.generateMipmap(Me),ue.unbindTexture()},this.initRenderTarget=function(M){we.get(M).__webglFramebuffer===void 0&&Pe.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Pe.setTextureCube(M,0):M.isData3DTexture?Pe.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Pe.setTexture2DArray(M,0):Pe.setTexture2D(M,0),ue.unbindTexture()},this.resetState=function(){J=0,z=0,te=null,ue.reset(),re.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return en}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=We._getDrawingBufferColorSpace(e),t.unpackColorSpace=We._getUnpackColorSpace()}}const vl=new Map,Ml=["#263b65","#35558c","#4869a3"],Nr=["#c9bda2","#e2d9bd","#f4edd5"],Ur=["#92363d","#b44243","#d4544c"];function gg(i,e=0,t=!1){const n=Math.floor(e)%6,s=[i,n,t].join("/"),r=vl.get(s);if(r)return r;const a=document.createElement("canvas");a.width=48,a.height=64;const o=a.getContext("2d");o.imageSmoothingEnabled=!1;for(let c=0;c<40;c++){const l=c*.21+n*Math.PI/3,u=Math.round(Math.sin(l)*c*.085),h=Math.cos(l)>.45?2:Math.cos(l)<-.25?0:1;for(let d=0;d<25;d++){const f=c/39,g=d/24;let S=f<1/3?Ml:f<2/3?Nr:Ur;if(i){const p=Math.min(Math.abs(f-g),Math.abs(1-f-g));S=p<.036?Ur:p<.105?Nr:Ml,(Math.abs(f-.5)<.105||Math.abs(g-.5)<.155)&&(S=Nr),(Math.abs(f-.5)<.061||Math.abs(g-.5)<.09)&&(S=Ur)}t&&c>25&&d>17+c*7%9||(o.fillStyle=t?["#4c4136","#6c5641","#87755b"][h]:S[h],o.fillRect(5+c,6+d+u,1,1))}}return o.fillStyle="#544330",o.fillRect(2,4,3,60),o.fillStyle="#cfaa61",o.fillRect(2,4,1,60),o.fillStyle="#e8cb7f",o.fillRect(2,0,2,6),o.fillRect(1,2,4,2),i||(o.fillRect(0,1,2,1),o.fillRect(4,1,3,1)),vl.set(s,a),a}const be="#25282b",Qn="#34302d",zt="#adb9bc",zn="#edf0dd",Ut="#e5ddc6",Gn="#925d42",Sn="#e8b384",Jn="#bd893e",vt="#f5ce77",vn="#70503a",Aa=Math.PI*2,Sl=new Map,eo=i=>i?["#68232d","#b93a37","#e36149"]:["#203857","#356294","#6287ab"];class _g{constructor(e){this.c=e}c;box(e,t,n,s=1,r=1){this.c.fillStyle=e,this.c.fillRect(Math.round(t),Math.round(n),s,r)}line(e,t,n,s,r){const a=Math.max(1,Math.ceil(Math.max(Math.abs(s-t),Math.abs(r-n))));this.c.fillStyle=e;for(let o=0;o<=a;o++)this.c.fillRect(Math.round(t+(s-t)*o/a),Math.round(n+(r-n)*o/a),1,1)}oval(e,t,n,s,r){for(let a=-r;a<=r;a++){const o=Math.round(s*Math.sqrt(Math.max(0,1-(a/(r+.3))**2)));this.box(e,t-o,n+a,o*2+1)}}}function xg(i,e,t,n,s,r,a,o=-1){const[c,l,u]=eo(e),h=[-2,0,2,0],d=n==="march"||n==="run"||n==="thrust",f=n==="load",g=a<-.37,S=d?h[s%4]*(n==="run"||n==="thrust"?1.45:1):0,p=d&&s%2===1?-1:0,m=n==="thrust"?3:n==="run"?2:0,x=m+(f?1:0),T=p+(f?1:0);for(const[w,E,_]of[[-2,-2-S,"#a49e91"],[1,1+S,Ut]])i.line(_,w,-5,E,-2),i.line(_,w+1,-5,E+1,-2),i.box(Qn,E,-2,2,2),i.box(be,E,0,3);i.box(be,m-4,p-14,7,8),i.box(c,m-4,p-12,2,8),i.box(l,m-3,p-14,5,7),i.box(u,m-2,p-14,3),i.box(l,m-3,p-7,3,3),i.box(c,m,p-7,3,3),i.box(Ut,m-3,p-7,6),i.box(Jn,m,p-7),i.line(Ut,m-3,p-14,m+2,p-8),g||i.line("#c2bca9",m+2,p-14,m-3,p-8),i.box("#534539",m-5,p-13,2,5),i.box("#aaa394",m-5,p-14,3,2),i.box(Qn,m-4,p-8,3,2),i.box(t?vt:Ut,m-3,p-14,2),t&&(i.box(Jn,m-4,p-13,2,2),i.box(vt,m+2,p-14,2,2)),i.box(g?vn:Gn,x-2,T-18,5,4),g?(i.box("#684b39",x-2,T-17,4,2),i.box(Gn,x+2,T-16),i.box("#a19a87",m-3,p-13,5,2),i.box("#4b4036",m-3,p-11,5,4),i.box("#87725b",m-2,p-11,3),i.box(Ut,m-1,p-10,1,3)):a>.6?(i.box(Sn,x-2,T-17,5,3),i.box(Qn,x-2,T-17),i.box(Qn,x+1,T-17),i.box(Gn,x,T-15)):(i.box(Sn,x,T-17,3,3),i.box(Sn,x+3,T-16),i.box(be,x+1,T-17)),i.box("#9b3330",x-1,p-15,3),t?(i.box(be,x-3,T-25,6,8),i.box("#383738",x-2,T-26,4,2),i.box("#55504a",x-2,T-24,2,3),i.box("#454341",x+1,T-25,1,2),i.box("#b94438",x-4,T-24,2,5),i.box(Jn,x,T-19,3)):(i.box(be,x-3,T-22,6,5),i.box("#464449",x-3,T-22,5),i.box("#674f38",x-3,T-19,6),i.box(be,x-2,T-18,7),i.box(vt,x+1,T-20),i.box(e?"#f3efdc":"#be493c",x-2,T-24,2,2));const b=(w,E)=>{i.box(Gn,w-1,E,3,2),i.box(Sn,w,E,2)};if(o>=0){if(o===0&&(b(2,-12+p),b(2,-8+p)),o===1){i.box("#563c32",0,-11+p,9,8),i.box("#ba7844",1,-10+p,7,5);for(let E=0;E<3;E++)i.line(Ut,E*3,-10+p,E*3+2,-5+p);i.box(Ut,0,-12+p,9,2),i.box(Jn,0,-5+p,9,2);const w=s%2?2:-2;i.line(vn,-3,-13+p,4,-15+p+w),i.line(vt,7,-14+p,2,-13+p-w),b(-3,-13+p),b(6,-14+p)}o===2&&(i.line("#503c27",1,-16+p,11,-15+p),i.box(vt,10,-15+p,2),b(4,-15+p),b(8,-15+p));return}if(n==="aim"||n==="thrust"){const w=n==="thrust"&&s%2===1?2:0,E=n==="thrust"?-10+p:-12,_=(Math.abs(a)>.85?4:0)+(n==="thrust"?2:0),y=n==="thrust"?16+w:14;i.line(be,_-3*r,E+1-3*a,_+r*y,E+1+a*y),i.line(vn,_-3*r,E-3*a,_+r*(y-3),E+a*(y-3)),i.line(zt,_+3*r,E-1+3*a,_+r*y,E-1+a*y),i.box(vt,_+2*r,E+2*a),n==="thrust"&&(i.line(l,m-1,p-12,_+2*r,E+2*a),i.line(u,m+1,p-12,_+7*r,E+7*a),i.line(be,_+r*(y-1),E+a*(y-1),_+r*(y+7),E+a*(y+7)),i.line(zt,_+r*(y-1),E-1+a*(y-1),_+r*(y+7),E-1+a*(y+7)),i.line(zn,_+r*(y+1),E-1+a*(y+1),_+r*(y+8),E-1+a*(y+8)),w&&i.box("#ffffff",_+r*(y+8),E-1+a*(y+8),2,1)),b(_+2*r,E+2*a),b(_+7*r,E+7*a)}else if(n==="throw"){i.line(vn,-5,-6,-2,-20),i.line(zt,-3,-17,-1,-25);const w=s<2?-5:2+Math.round(r*6),E=s<2?-21:-15+Math.round(a*5);i.line(l,1,-14,w,E),i.line(u,1,-13,w,E+1),b(w,E),s<2&&(i.oval(be,w,E-2,2,2),i.box("#bd9d6c",w+1,E-5))}else if(f){i.box(vn,5,-18,2,15),i.box(zt,5,-21,1,12),i.box(Jn,6,-11);const w=[-19,-22,-18,-14,-12,-16][s%6];i.box(zn,6,w-5,1,11),i.line(l,2,-13,4,w+1),b(5,w),i.line(u,-2,-11,4,-10),b(4,-10)}else n==="run"?(i.line(vn,-5,-5,6,-15+p),i.line(zt,3,-13+p,8,-18+p),b(2,-10+p)):(i.line(vn,-1,-5+p,6,-19+p),i.line(zt,3,-14+p,8,-23+p),i.line(zn,7,-21+p,9,-25+p),b(2,-11+p))}function vg(i,e,t,n,s){const[r,a,o]=eo(e),c=n?t%4:1,l=n?[[-3,-1],[3,-4],[7,-2],[1,0]][c]:[1,0],u=n?[[5,-2],[-2,0],[-6,-3],[1,-1]][c]:[-1,0],h=n?[0,-2,-1,0][c]:0,d=e?"#4a2c1c":"#362218",f=e?"#7e4e31":"#5e3d2b",g=e?"#ad754c":"#8a6045";i.line(be,-9,-12+h,-10+u[0]*.6,-5+h),i.line(d,-8,-12+h,-9+u[0]*.6,-5+h),i.line(d,-9+u[0]*.6,-5+h,-8+u[0],u[1]),i.box(be,-9+u[0],u[1]-1,3,2),i.line(be,8,-12+h,9+l[0]*.6,-6+h),i.line(d,7,-12+h,8+l[0]*.6,-6+h),i.line(d,8+l[0]*.6,-6+h,9+l[0],l[1]),i.box(be,8+l[0],l[1]-1,3,2),i.line(be,-11,-15+h,-19,-10+h+(c%2?2:-1)),i.line("#3f3229",-12,-14+h,-18,-9+h+(c%2?2:-1)),i.line(be,-12,-13+h,-17,-7+h+(c%2?2:-1)),i.oval(be,0,-13+h,13,6),i.oval(d,0,-12+h,12,5),i.oval(f,0,-13+h,11,4),i.oval(g,2,-15+h,8,2),i.box(g,-9,-15+h,5,2),i.line(be,7,-16+h,11,-11+h),i.box(vt,9,-13+h,2,1),i.line(be,-7,-11+h,-7-u[0]*.5,-5+h),i.line(g,-6,-11+h,-6-u[0]*.5,-5+h),i.line(f,-6-u[0]*.5,-5+h,-5-u[0],Math.min(0,u[1]+1)),i.box(be,-6-u[0],Math.min(0,u[1]+1)-1,3,2),i.line(be,8,-11+h,9-l[0]*.5,-6+h),i.line(g,9,-11+h,10-l[0]*.5,-6+h),i.line(f,10-l[0]*.5,-6+h,11-l[0],Math.min(0,l[1]+1)),i.box(be,10-l[0],Math.min(0,l[1]+1)-1,3,2),i.oval(be,10,-18+h,5,6),i.oval(f,10,-18+h,4,5),i.line(g,11,-21+h,12,-15+h),i.box(be,10,-25+h,8,6),i.box(f,11,-24+h,6,4),i.box(g,14,-23+h,5,3),i.box(be,18,-22+h,2,3),i.box(Ut,17,-21+h,2,2),i.line(be,8,-23+h,9,-15+h),i.box(be,11,-27+h,2,3),i.box(g,12,-26+h,1,2),i.box(be,15,-23+h,1,1),i.box(vt,16,-20+h,1,1),i.line(be,3,-16+h,16,-20+h),i.box(be,-9,-17+h,14,8),i.box(r,-8,-16+h,12,6),i.box(a,-7,-15+h,10,4),i.box(o,-6,-15+h,4,2),i.box(vt,-8,-10+h,12,1),i.box(vt,-7,-12+h,2,1),i.box("#563925",-5,-17+h,8,3),i.box(Ut,-2,-15+h,4,4),i.box(be,-2,-12+h,5,7),i.box(Qn,-1,-12+h,3,5),i.box(zt,0,-6+h,3,1),i.line(be,-4,-24+h,-13,-19+h+(c%2?1:-2)),i.line(r,-4,-23+h,-12,-18+h+(c%2?1:-2)),i.line(a,-4,-22+h,-11,-17+h+(c%2?1:-2)),i.line(o,-5,-21+h,-10,-16+h+(c%2?1:-2)),i.box(be,-5,-25+h,10,10),i.box(a,-4,-24+h,8,8),i.box(r,-4,-22+h,2,6),i.box("#5d6870",-2,-24+h,6,7),i.box(zt,-1,-24+h,5,6),i.box(zn,0,-23+h,3,3),i.box(vt,-4,-24+h,2,2),i.box(Ut,-3,-17+h,7,1),i.box(Jn,0,-17+h,2,1),i.box(Gn,-2,-28+h,5,4),i.box(Sn,-1,-28+h,4,3),i.box(be,1,-28+h,1,1),i.box("#9b3330",-1,-25+h,3,1),i.box(be,-4,-33+h,9,5),i.box("#4e5860",-3,-32+h,7,3),i.box(zt,-2,-32+h,5,2),i.box(zn,-1,-32+h,3,1),i.box(vt,0,-34+h,3,2),i.box(be,-2,-29+h,8,1),i.line(be,-2,-33+h,-9,-29+h-c%2),i.line(e?"#cc3930":"#262b30",-2,-32+h,-8,-28+h-c%2),i.line(e?"#f0745d":"#4c5258",-3,-31+h,-7,-27+h-c%2),i.box(a,2,-23+h,3,3),i.box(Gn,3,-21+h,3,2),i.box(Sn,4,-21+h,2,1),i.box(vt,5,-22+h,3,2),s?(i.line(be,7,-20+h,21,-18+h),i.line(zt,7,-21+h,21,-19+h),i.line(zn,10,-22+h,22,-19+h)):(i.line(be,7,-22+h,15,-33+h),i.line(zt,6,-22+h,14,-33+h),i.line(zn,9,-26+h,15,-34+h)),n&&(i.box("#b5a97d",-15-c,-1,3,2),i.box("#d4c49a",-19-c,-3,2,2))}function El(i,e,t,n){for(let s=0;s<8;s++){const r=(s+n/4)*Aa/8;i.line("#6c4b2d",e,t,e+Math.cos(r)*5.5,t+Math.sin(r)*5.5),i.line("#a87948",e,t,e+Math.cos(r)*4.5,t+Math.sin(r)*4.5)}for(let s=0;s<44;s++){const r=s*Aa/44;i.box(be,e+Math.cos(r)*6.5,t+Math.sin(r)*6.5),i.box(Math.sin(r)<0?"#c99658":"#785134",e+Math.cos(r)*5.5,t+Math.sin(r)*5.5)}i.box(be,e-2,t-2,5,5),i.box("#564131",e-1,t-1,3,3),i.box(vt,e,t)}function Fr(i,e,t,n,s,r,a){const[o,c,l]=eo(e),u=a?[-1,0,1,0][r%4]:0,h=a&&r%2===1?-1:0,f=t+(a?2:0),g=n+h;i.line("#a49e91",t-2,n-5,t-2-u,n-2),i.line("#a49e91",t-1,n-5,t-1-u,n-2),i.line(Ut,t+1,n-5,t+1+u,n-2),i.line(Ut,t+2,n-5,t+2+u,n-2),i.box(Qn,t-2-u,n-2,2,2),i.box(be,t-2-u,n,3,1),i.box(Qn,t+1+u,n-2,2,2),i.box(be,t+1+u,n,3,1),i.box(be,f-4,g-14,8,8),i.box(o,f-4,g-12,2,7),i.box(c,f-3,g-14,6,7),i.box(l,f-2,g-14,3,1),i.box(c,f-3,g-7,3,2),i.box(o,f,g-7,3,2),i.box(Ut,f-3,g-7,6,1),i.box(Jn,f,g-7,1,1),i.line(Ut,f-3,g-14,f+2,g-8),i.line("#c2bca9",f+2,g-14,f-3,g-8),i.box(vt,f-3,g-14,2,1),i.box(Gn,f-2,g-18,5,4),i.box(Sn,f,g-17,3,3),i.box(Sn,f+3,g-16,1,1),i.box(be,f+1,g-17,1,1),i.box("#9b3330",f-1,g-15,3,1),i.box(be,f-3,g-22,6,5),i.box("#464449",f-3,g-22,5,1),i.box("#674f38",f-3,g-19,6,1),i.box(be,f-2,g-18,7,1),i.box(vt,f+1,g-20,1,1),i.box("#cf3e34",f-2,g-24,2,2);const S=[0,1,2,1][r%4],p=(m,x)=>{i.box(Gn,m-1,x,3,2),i.box(Sn,m,x,2,1)};a?(i.line(c,f+1,g-12,f+6,g-9),i.line(l,f+1,g-11,f+5,g-9),p(f+5,g-9)):s===0?(i.line(be,f-4,g-5-S,f+10,g-14-S),i.line(vn,f-4,g-6-S,f+10,g-15-S),i.box(be,f+7,g-17-S,5,4),i.box("#d8cbb0",f+8,g-16-S,3,2),p(f+3,g-10-S)):s===1?(i.oval(be,f+5,g-10+S,3,3),i.oval("#3a4044",f+5,g-10+S,2,2),i.box(zn,f+4,g-11+S,1,1),p(f+2,g-9+S)):(i.line(be,f+2,g-7,f+9,g-13-S),i.line("#8c6642",f+2,g-8,f+9,g-14-S),i.box("#f27b2b",f+9,g-15-S,2,2),i.box("#fff09a",f+9,g-15-S,1,1),p(f+3,g-9))}function Mg(i,e,t,n,s,r,a){const o=t==="march"||t==="run",c=t==="recoil"?[0,7,7,6,5,4,3,2,1][n]:0,l=-Math.round(c*s),u=-Math.round(c*r),h=u-6,d=o||t==="recoil"&&n>=3;Fr(i,e,-14,-5,0,n,d),Fr(i,e,1,-8,1,n,d);const f=o?n:t==="recoil"?c:0;El(i,l+2,h-4,f),i.line(be,l-18*s,u-1-18*r,l+5*s,u-7+5*r),i.line(be,l-18*s,u-4-18*r,l+5*s,u-10+5*r),i.line(vn,l-17*s,u-2-17*r,l+4*s,u-8+4*r),i.line("#b98c52",l-16*s,u-3-16*r,l+3*s,u-9+3*r),i.box(zt,l-15*s,u-3-15*r,2,2);const g=(S,p,m,x,T=0)=>{const b=l+s*S-r*T,w=u-10+r*S+s*T;for(let E=0;E<m;E++)i.line(x,b-r*E,w+s*E,l+s*p-r*(T+E),u-10+r*p+s*(T+E))};g(-6,18,7,be,-3),g(-5,17,5,"#573f28",-2),g(-5,17,3,"#b3833e",-1),g(-4,17,1,"#f4d88c",-1);for(const S of[-4,2,10,16])g(S,S+1,7,"#6e4d26",-3),g(S,S+1,2,"#f7df94",-3);g(18,18,3,be,-1),El(i,l-1,h,f),Fr(i,e,-18,6,2,n,o),o||(i.box(be,-25,2,10,7),i.box("#563e2c",-24,3,8,5),i.box("#a87e4b",-24,3,8,2),i.box(vt,-22,3,1,5),i.box(vt,-18,3,1,5),i.box(be,4,2,7,7),i.box("#62533f",5,3,5,5),i.box(zt,5,3,5,1),i.box("#9d9582",5,6,5,1))}function Sg(i,e,t,n,s,r,a,o){const c=[i,e,t,n,s,r,a,Number(o)].join("/"),l=Sl.get(c);if(l)return l;const u=i==="field_cannon",h=i==="cuirassier",d=i==="bannerman",f=document.createElement("canvas");f.width=u?68:h?50:d?46:50,f.height=u?58:h?44:d?47:42;const g=Math.floor(f.width/2),S=f.height-(u?18:h?6:d?3:9),p=f.getContext("2d");p.imageSmoothingEnabled=!1,p.translate(g,S);const m=n*Aa/16,x=Math.cos(m),T=Math.sin(m);x<-.001&&(p.scale(-1,1),p.translate(-1,0));const b=new _g(p);u?Mg(b,e,t,s,Math.abs(x),T):h?vg(b,e,s,t==="march"||t==="run",t==="thrust"):(xg(b,e,i==="guard_grenadier",t,s,Math.abs(x),T,d?r:-1),d&&r===0&&p.drawImage(gg(e,s),2,-36,21,37));const w={art:f,footX:g,footY:S};return Sl.set(c,w),w}const Ci=i=>(i-2200)*.05,Pi=i=>(i-1200)*.05;function Dt(i,e){return .71*Math.sin(i*.048+e*.033)+.43*Math.cos(e*.083-i*.017)+.23*Math.sin(i*.093+e*.069)}function Eg(i,e,t){return t.set(Dt(i-.25,e)-Dt(i+.25,e),.5,Dt(i,e-.25)-Dt(i,e+.25)).normalize()}function yg(){const i=document.createElement("canvas");i.width=i.height=1024;const e=i.getContext("2d"),t=new Di(1799),n=e.createImageData(1024,1024);function s(u){const h=Float32Array.from({length:u*u},()=>t.next());return(d,f)=>{const g=d*u,S=f*u,p=Math.floor(g),m=Math.floor(S);let x=g-p,T=S-m;x=x*x*(3-2*x),T=T*T*(3-2*T);const b=(w,E)=>h[(m+E)%u*u+(p+w)%u];return(b(0,0)*(1-x)+b(1,0)*x)*(1-T)+(b(0,1)*(1-x)+b(1,1)*x)*T}}const r=s(4),a=s(17),o=s(64);for(let u=0;u<1024;u++)for(let h=0;h<1024;h++){const d=h/1024,f=u/1024,g=r(d,f)*.5+a(d,f)*.33+o(d,f)*.17,S=Math.pow(.5+.5*Math.sin(2*Math.PI*(d*4+f*6+.22*Math.sin(f*6.283))),10)*a(d,f),p=Math.max(0,g-.52)*110,m=(u*1024+h)*4,x=(t.next()-.5)*7;n.data[m]=39+g*58+p*1.35+S*16+x,n.data[m+1]=72+g*59+p*.25+S*7+x,n.data[m+2]=37+g*36+S*5+x,n.data[m+3]=255}e.putImageData(n,0,0);const c=["#b5ad6a","#8f9a5b","#c2aa64","#4d633c","#717e4a","#d3c588"];for(let u=0;u<43e3;u++){const h=t.int(0,1023),d=t.int(0,1023);e.globalAlpha=.12+t.next()*.32,e.fillStyle=c[t.int(0,5)];const f=t.int(1,5);e.fillRect(h,d,f,1),f>2&&e.fillRect(h+f-1,d-1,2,1)}for(let u=0;u<240;u++){const h=t.int(0,1023),d=t.int(0,1023),f=t.next()<.38,g=f?"#809962":"#b6a36c";for(let S=0;S<58;S++){const p=t.next()*Math.PI*2,m=Math.sqrt(t.next()),x=Math.round(1024+h+Math.cos(p)*m*26)%1024,T=Math.round(1024+d+Math.sin(p)*m*11)%1024;e.globalAlpha=.22+t.next()*.3,e.fillStyle=g,e.fillRect(x,T,f?3:1,2),e.fillRect((x+2)%1024,(T+1023)%1024,2,1),!f&&S%5===0&&(e.fillStyle="#e2d4a1",e.fillRect((x+3)%1024,(T+1022)%1024,2,1))}}const l=new tr(i);return l.colorSpace=Rt,l.wrapS=l.wrapT=qs,l.repeat.set(12,10),l.anisotropy=4,l}function bg(i){const e=yg(),t=new hn(660,540,440,360);t.rotateX(-Math.PI/2);const n=t.attributes.position,s=[];for(let S=0;S<n.count;S++){const p=n.getX(S),m=n.getZ(S);n.setY(S,Dt(p,m));const x=.5+.5*Math.sin(p*.067+m*.094+1.8*Math.sin(m*.063)),T=Math.exp(-((m-10*Math.sin(p*.044)-p*.18-15)**2)/3);s.push(.78+x*.2+T*.13,.88+x*.08-T*.14,.76+x*.15-T*.03)}t.setAttribute("color",new yt(s,3)),t.computeVertexNormals();const r=new Za({map:e,vertexColors:!0,roughness:.93,bumpMap:e,bumpScale:.08,roughnessMap:e});r.onBeforeCompile=S=>{S.fragmentShader=S.fragmentShader.replace("#include <map_fragment>",`vec4 primaryGrass=texture2D(map,vMapUv);
            vec2 crossField=mat2(.73,.48,-.48,.73)*vMapUv+vec2(.37,.65);
            vec4 brush=texture2D(map,crossField);
            diffuseColor*=mix(primaryGrass,brush,.32);`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
 roughnessFactor=.74+.23*roughnessFactor;`)};const a=new Yt(t,r);a.receiveShadow=!0,i.add(a);const o=new Di(29),c=new dn,l=[];for(let S=0;S<5;S++){const p=o.next()*.34-.17,m=o.next()*.28-.14,x=.12+o.next()*.21;l.push(p-.035,0,m,p+.035,0,m,p+.08,x,m-.06)}c.setAttribute("position",new yt(l,3)),c.computeVertexNormals();const u=new lc({side:Ft,color:16777215}),h={value:0};u.onBeforeCompile=S=>{S.uniforms.uWind=h,S.vertexShader=`uniform float uWind;
`+S.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
 transformed.x+=position.y*.28*sin(uWind*1.7+instanceMatrix[3].x*.34+instanceMatrix[3].z*.4);`)};const d=new Ai(c,u,3600),f=new ht,g=new De;for(let S=0;S<d.count;S++){const p=(o.next()-.5)*250,m=(o.next()-.5)*150;f.position.set(p,Dt(p,m),m),f.rotation.y=o.next()*6.28,f.scale.setScalar(.55+o.next()*.95),f.updateMatrix(),d.setMatrixAt(S,f.matrix),d.setColorAt(S,g.setHex([8357448,11050069,6649416,11250280][S%4]))}return d.receiveShadow=!0,d.castShadow=!0,i.add(d),h}const wa=["stand","march","aim","load","thrust","recoil","run"],Ra=new Map,jn=16,Ws=76,js=64,yc=48;function Ki(i,e,t,n,s){return[i,e,t,n,s].join("/")}function Tg(){const i=document.createElement("canvas");i.width=jn*Ws,i.height=18*js;const e=i.getContext("2d");e.imageSmoothingEnabled=!1;let t=0;for(const s of[0,1])for(const r of Xs)for(const a of wa){const o=r==="bannerman"?2:1,c=a==="stand"||a==="aim"?1:4;for(let l=0;l<o;l++)for(let u=0;u<c;u++){const h=Sg(r,s,a,0,u,l,3,!1),d=t%jn*Ws,f=Math.floor(t/jn)*js;e.drawImage(h.art,d+Ws/2-h.footX,f+yc-h.footY),Ra.set(Ki(s,r,a,u,l),t++)}}const n=new tr(i);return n.minFilter=n.magFilter=ct,n.generateMipmaps=!1,n.colorSpace=Rt,n}function yi(i,e,t,n){const s=new ya(new Float32Array(t*n),n).setUsage(Xl);return i.setAttribute(e,s),s}function Li(i,e,t=0){e<=0||(i.clearUpdateRanges(),i.addUpdateRange(t*i.itemSize,e*i.itemSize),i.needsUpdate=!0)}function Ag(){const i=document.createElement("canvas");i.width=i.height=64;const e=i.getContext("2d"),t=e.createRadialGradient(32,32,1,32,32,31);return t.addColorStop(0,"rgba(20,14,10,.66)"),t.addColorStop(.45,"rgba(25,20,13,.42)"),t.addColorStop(1,"rgba(24,18,12,0)"),e.fillStyle=t,e.fillRect(0,0,64,64),new tr(i)}class wg{mesh;ao;rim={value:new De("#e7bb77")};uv;flip;o=new ht;frames=new Map;unitFrames=new WeakMap;constructor(e){const t=Tg(),n=2200,s=new hn(Ws*.084,js*.084);s.translate(0,(yc-js/2)*.084,0),s.rotateX(-8*Math.PI/180),this.uv=yi(s,"aUvRect",n,4),this.flip=yi(s,"aFlipFlash",n,2);const r=yi(s,"aTint",n,3);for(let l=0;l<n;l++){const u=.88+l*17%13*.01;r.setXYZ(l,u,u,u*.99)}const a=new lc({map:t,alphaTest:.45,side:Ft}),o=new cc({depthPacking:lh,map:t,alphaTest:.45,side:Ft});for(const l of[a,o])l.onBeforeCompile=u=>{u.vertexShader=`attribute vec4 aUvRect;attribute vec2 aFlipFlash;attribute vec3 aTint;varying vec4 vTintHit;
`+u.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
 vMapUv=aUvRect.xy+vec2(mix(uv.x,1.-uv.x,aFlipFlash.x),uv.y)*aUvRect.zw;vTintHit=vec4(aTint,aFlipFlash.y);`),l!==o&&(u.uniforms.rimColor=this.rim,u.fragmentShader=`varying vec4 vTintHit;uniform vec3 rimColor;
`+u.fragmentShader.replace("#include <lights_lambert_pars_fragment>",Oe.lights_lambert_pars_fragment.replace("saturate( dot( geometryNormal, directLight.direction ) )","(0.5+0.5*dot(geometryNormal,directLight.direction))")).replace("#include <map_fragment>",`#include <map_fragment>
 diffuseColor.rgb *=vTintHit.rgb;`).replace("#include <opaque_fragment>",`float edge=1.-min(texture2D(map,vMapUv+vec2(0.,1./1152.)).a,texture2D(map,vMapUv-vec2(1./1216.,0.)).a);
                outgoingLight+=rimColor*edge*.115+vec3(vTintHit.w*.8);
                #include <opaque_fragment>`))};this.mesh=new Ai(s,a,n),this.mesh.customDepthMaterial=o,this.mesh.castShadow=this.mesh.receiveShadow=!0,this.mesh.frustumCulled=!1;const c=new hn(1,1);c.rotateX(-Math.PI/2),this.ao=new Ai(c,new nc({map:Ag(),transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2}),n),this.ao.frustumCulled=!1,this.ao.renderOrder=1,e.add(this.mesh,this.ao);for(const l of[0,1])for(const u of Xs)for(const h of wa)for(let d=0;d<(u==="bannerman"?2:1);d++)this.frames.set(Ki(l,u,h,0,d),Array.from({length:4},(f,g)=>Ra.get(Ki(l,u,h,g,d))??Ra.get(Ki(l,u,h,0,d))))}draw(e,t,n){let s=0;const r=this.o;for(const a of e)if(a.hp>0){const o=Ci(a.x+a.vx*n/30),c=Pi(a.y+a.vy*n/30),l=Dt(o,c),u=a.kind==="bannerman"&&a.id%3===0?1:0,h=(a.moving?Math.floor(a.stride/7):Math.floor((t-a.firedAt)/4))&3;let d=this.unitFrames.get(a);if(!d){d={};for(const S of wa)d[S]=this.frames.get(Ki(a.faction,a.kind,S,0,u));this.unitFrames.set(a,d)}const f=d[a.pose][h];this.uv.setXYZW(s,(f%jn+0)/jn,1-(Math.floor(f/jn)+1)/18,1/jn,1/18),this.flip.setXY(s,+(a.face<0),Math.max(0,1-(t-a.hitAt)/4)),r.position.set(o,l+.045,c),r.scale.set(1,1,1),r.updateMatrix(),this.mesh.setMatrixAt(s,r.matrix);const g=a.kind==="cuirassier"||a.kind==="field_cannon";r.scale.set(g?3.7:1.7,1,g?1.5:.91),r.updateMatrix(),this.ao.setMatrixAt(s,r.matrix),s++}this.mesh.count=this.ao.count=s;for(const a of[this.mesh.instanceMatrix,this.ao.instanceMatrix,this.uv,this.flip])Li(a,s)}}const Rg={golden:{sun:16765590,power:2.6,sky:14936548,earth:8486999,fill:1.38,fog:14995103,density:.00165,zenith:10203059,rim:15580023},storm:{sun:10205140,power:1.7,sky:10465732,earth:4541001,fill:1.28,fog:8622749,density:.0037,zenith:3885916,rim:10930672}};class Cg{constructor(e){this.scene=e,this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.normalBias=.025,this.sun.shadow.bias=-15e-5,this.sun.shadow.radius=1.1,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=600;const t=new Yt(new Ka(850,20,12),this.skyMat);t.renderOrder=-5,e.add(this.sun,this.sun.target,this.hemi,t,...this.flashes),this.set("golden")}scene;sun=new vu;hemi=new mu;flashes=Array.from({length:9},()=>new _u(16753473,0,16,1.6));mode="golden";rim=new De;skyMat=new un({side:It,depthWrite:!1,uniforms:{top:{value:new De},haze:{value:new De}},vertexShader:"varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform vec3 top,haze;varying float h;void main(){gl_FragColor=vec4(mix(haze,top,smoothstep(-.06,.74,h)),1.);}"});direction=new F(-.8,.56,.54).normalize();right=new F().crossVectors(new F(0,1,0),this.direction).normalize();up=new F().crossVectors(this.direction,this.right);center=new F;set(e){const t=Rg[e];this.mode=e,this.rim.setHex(t.rim),this.sun.color.setHex(t.sun),this.sun.intensity=t.power,this.hemi.color.setHex(t.sky),this.hemi.groundColor.setHex(t.earth),this.hemi.intensity=t.fill,this.scene.fog=new Wa(t.fog,t.density),this.scene.background=new De(t.fog),this.skyMat.uniforms.haze.value.setHex(t.fog),this.skyMat.uniforms.top.value.setHex(t.zenith)}flash(e,t,n,s){let r=this.flashes[0];for(const a of this.flashes){if(!s&&a.intensity>0&&a.position.distanceToSquared(this.center.set(e,t,n))<9){r=a;break}a.intensity<r.intensity&&(r=a)}r.position.set(e,t+1.35,n),r.distance=s?17:7,r.intensity=Math.max(r.intensity,(s?95:16)*(this.mode==="storm"?1.55:1))}update(e,t,n,s){for(const l of this.flashes)l.intensity*=Math.exp(-s*13),l.intensity<.02&&(l.intensity=0);const r=Math.max(12,Math.ceil(t*.31*Math.max(n,1.5)/2)*2),a=2*r/2048,o=this.center.copy(e);o.addScaledVector(this.right,Math.round(o.dot(this.right)/a)*a-o.dot(this.right)),o.addScaledVector(this.up,Math.round(o.dot(this.up)/a)*a-o.dot(this.up)),this.sun.target.position.copy(o),this.sun.position.copy(o).addScaledVector(this.direction,270);const c=this.sun.shadow.camera;c.right!==r&&(c.left=c.bottom=-r,c.right=c.top=r,c.updateProjectionMatrix())}reset(){for(const e of this.flashes)e.intensity=0}}class Pg{target=new tn(1,1,{type:nn,minFilter:Ct,magFilter:Ct});scene=new jl;camera=new Qa;uniforms={frame:{value:this.target.texture},pixel:{value:new ze}};constructor(){const e=new un({uniforms:this.uniforms,depthTest:!1,depthWrite:!1,vertexShader:"varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}",fragmentShader:`uniform sampler2D frame;uniform vec2 pixel;varying vec2 v;
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
            }`});this.scene.add(new Yt(new hn(2,2),e))}size(e,t){this.target.setSize(e,t),this.uniforms.pixel.value.set(1/e,1/t)}draw(e,t,n){e.setRenderTarget(this.target),e.render(t,n),e.setRenderTarget(null),e.render(this.scene,this.camera)}}const Lg=["gore_intestines","gore_organs","gore_bones","gore_chunks","corpses_france","corpses_britain","vfx_cannon_blast"],Dg=[128,128,128,128,160,160,192,256];function Ig(i,e,t,n){const s=Dg[t],r=s/4,a=.002*s,o=t%4*256+n%4*r,c=Math.floor(t/4)*256+Math.floor(n/4)*r;i.setXYZW(e,(o+a)/1024,1-(c+r-a)/512,(r-2*a)/1024,(r-2*a)/512)}async function Ng(){const i=new pu,e=await Promise.all(Lg.map(a=>i.loadAsync("./art/gore/"+a+".png"))),t=document.createElement("canvas");t.width=1024,t.height=512;const n=t.getContext("2d");n.imageSmoothingEnabled=!1,e.forEach((a,o)=>{a.magFilter=a.minFilter=ct,a.colorSpace=Rt,a.generateMipmaps=!1,n.drawImage(a.image,o%4*256,Math.floor(o/4)*256),a.dispose()});const s=new Di(165);for(let a=0;a<16;a++){n.save(),n.translate(768+a%4*64+32,256+Math.floor(a/4)*64+32);const o=a>=8&&a<12,c=a>=12,l=new Path2D;for(let u=0;u<40;u++){const h=u/40*Math.PI*2,d=(c?12:21)+s.next()*(c?3:5)+Math.sin(h*3+a)*2.7,f=Math.cos(h)*d,g=Math.sin(h)*d*.78;u?l.lineTo(f,g):l.moveTo(f,g)}l.closePath(),n.fillStyle=o?"#4a3928":c?"#a22224":"#57151d",n.fill(l),n.save(),n.clip(l);for(let u=0;u<110;u++)n.fillStyle=o?["#352b23","#604b34","#816642"][u%3]:["#721c27","#661821","#8e2631"][u%3],n.fillRect(s.int(-27,24),s.int(-22,21),s.int(2,9),s.int(1,4));if(n.restore(),!c)for(let u=0;u<10;u++)n.fillStyle=o?"#685338":"#76202a",n.fillRect(s.int(-29,27),s.int(-27,26),2,2);n.restore()}const r=new tr(t);return r.colorSpace=Rt,r.minFilter=r.magFilter=ct,r.generateMipmaps=!1,r}const Ug=new F(0,1,0),yl=new F,$n=new ht;class Xi{constructor(e,t,n,s,r){this.scene=e,this.mat=t,this.capacity=n,this.flat=s,this.layer=r,t.onBeforeCompile=a=>{a.vertexShader=`attribute vec4 aUvRect;
`+a.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
 vMapUv=aUvRect.xy+uv*aUvRect.zw;`)},this.allocate()}scene;mat;capacity;flat;layer;count=0;pages=[];allocate(){const e=new hn(1,1);this.flat&&e.rotateX(-Math.PI/2);const t=yi(e,"aUvRect",this.capacity,4),n=new Ai(e,this.mat,this.capacity);n.count=0,n.frustumCulled=!1,n.receiveShadow=!0,n.renderOrder=this.layer,n.instanceMatrix.setUsage(Xl),this.scene.add(n),this.pages.push({mesh:n,uv:t,dirty:1/0,end:0})}put(e,t,n,s,r,a,o,c=0,l=this.count){const u=Math.floor(l/this.capacity),h=l%this.capacity;u>=this.pages.length&&this.allocate();const d=this.pages[u];return d.mesh.count=Math.max(h+1,d.mesh.count),this.count=Math.max(this.count,l+1),this.flat?(Eg(n,r,yl),$n.quaternion.setFromUnitVectors(Ug,yl),$n.rotateY(o),s=Dt(n,r)+.018+this.layer*.023+h%200*18e-5):$n.rotation.set(-.23+c,0,o,"XYZ"),$n.position.set(n,s,r),$n.scale.setScalar(a),$n.updateMatrix(),d.mesh.setMatrixAt(h,$n.matrix),Ig(d.uv,h,e,t),d.dirty=Math.min(d.dirty,h),d.end=Math.max(d.end,h+1),l}sync(){for(const e of this.pages)e.end>e.dirty&&(Li(e.mesh.instanceMatrix,e.end-e.dirty,e.dirty),Li(e.uv,e.end-e.dirty,e.dirty),e.dirty=1/0,e.end=0)}clear(){this.count=0;for(const e of this.pages)e.mesh.count=0,e.dirty=1/0,e.end=0}}class to{constructor(e,t,n){this.lights=n;const s=(r,a=0)=>new Za({map:t,alphaTest:.45,roughness:r,metalness:a,side:Ft,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});this.wet=s(.14,.08),this.pools=new Xi(e,this.wet,5e3,!0,1),this.craters=new Xi(e,s(.98),1200,!0,0),this.corpses=new Xi(e,s(.82),2500,!0,3),this.debris=new Xi(e,s(.42),12e3,!0,4),this.flying=new Xi(e,s(.65),4096,!1,5)}lights;air=[];blasts=[];growth=[];pools;craters;corpses;debris;flying;rng=new Di(1815);wet;static async create(e,t){return new to(e,await Ng(),t)}get stats(){return{activeAirGore:this.air.filter(e=>e.sheet<4).length,landedCorpses:this.corpses.count,landedGore:this.debris.count,bloodPools:this.pools.count,goreTexturesLoaded:7}}blood(e,t,n,s=!1){const r=this.rng.int(0,7),a=this.rng.next()*6.28,o=this.pools.put(7,r,e,0,t,s?n*.45:n,a);s&&this.growth.push({x:e,z:t,size:n,ang:a,index:o,frame:r,age:0})}blast(e,t,n){const s=Dt(e,t);this.blasts.push({x:e,z:t,y:s+n*.43,age:0,size:n}),this.craters.put(7,this.rng.int(8,11),e,0,t,n*.88,this.rng.next()*6.28),this.lights.flash(e,s,t,!0)}event(e){const t=Ci(e.x),n=Pi(e.y),s=Dt(t,n);if(e.type==="impact"){this.blast(t,n,4.1);return}if(e.type!=="death")return;const r=()=>this.rng.next();e.explosive?this.blast(t,n,2.6+r()*1.2):(this.corpses.put(e.faction?5:4,this.rng.int(0,15),t,0,n,e.kind==="cuirassier"?3.2:2.5,r()*6.28),this.blood(t,n,2.3+r()*.9,!0));const a=(o,c)=>{const l=o===7;for(let u=0;u<c;u++){const h=r()*Math.PI*2,d=(.4+r())*(e.explosive?5.1:2.8);this.air.push({sheet:o,frame:l?12+this.rng.int(0,3):this.rng.int(0,15),x:t,y:s+.52+r()*.65,z:n,vx:Math.cos(h)*d+(e.explosive?0:e.dx*3.4),vz:Math.sin(h)*d+(e.explosive?0:e.dy*3.4),vy:2+r()*(e.explosive?8:4),angle:h,spin:(r()-.5)*14,size:l?.14+r()*.26:.45+r()*.7,bounces:l?0:this.rng.int(1,2)})}};if(e.explosive)for(let o=0;o<4;o++)a(o,(o===0||o===3?4:3)+this.rng.int(0,1));a(7,e.explosive?this.rng.int(10,14):this.rng.int(5,8))}update(e){this.flying.clear();for(let t=this.air.length-1;t>=0;t--){const n=this.air[t];n.vy-=15*e,n.x+=n.vx*e,n.y+=n.vy*e,n.z+=n.vz*e,n.angle+=n.spin*e;const s=Dt(n.x,n.z)+.07;if(n.y<=s&&n.vy<0)if(this.blood(n.x,n.z,n.size*(n.sheet===7?2:1.22)),n.y=s,n.bounces-- >0)n.vy*=-.34,n.vx*=.55,n.vz*=.55,n.spin*=.57;else{n.sheet!==7&&this.debris.put(n.sheet,n.frame,n.x,0,n.z,n.size,n.angle),this.air[t]=this.air[this.air.length-1],this.air.pop();continue}this.flying.put(n.sheet,n.frame,n.x,n.y,n.z,n.size,n.angle,Math.sin(n.angle)*.55)}for(let t=this.blasts.length-1;t>=0;t--){const n=this.blasts[t];if(n.age+=e,n.age>=.64){this.blasts.splice(t,1);continue}this.flying.put(6,Math.min(15,Math.floor(n.age*25)),n.x,n.y,n.z,n.size,0)}for(let t=this.growth.length-1;t>=0;t--){const n=this.growth[t];n.age=Math.min(1,n.age+e*1.6),this.pools.put(7,n.frame,n.x,0,n.z,n.size*(.45+.55*n.age),n.ang,0,n.index),n.age===1&&this.growth.splice(t,1)}this.wet.roughness=this.lights.mode==="storm"?.095:.14;for(const t of[this.pools,this.corpses,this.craters,this.debris,this.flying])t.sync()}reset(){this.air.length=this.blasts.length=this.growth.length=0,this.rng.state=1815;for(const e of[this.pools,this.corpses,this.craters,this.debris,this.flying])e.clear()}}const Os=5600;class Fg{constructor(e,t){this.lights=t;const n=new hn(1,1);this.shape=yi(n,"aPuff",Os,4),this.style=yi(n,"aStyle",Os,3);const s=new un({uniforms:this.uniforms,transparent:!0,depthWrite:!1,side:Ft,vertexShader:`attribute vec4 aPuff;attribute vec3 aStyle;uniform vec4 uLight[9];
            varying vec2 v;varying vec3 style;varying float fire;
            void main(){v=uv*2.-1.;style=aStyle;vec4 mv=modelViewMatrix*vec4(aPuff.xyz,1.);
                fire=0.;for(int i=0;i<9;i++){vec3 d=aPuff.xyz-uLight[i].xyz;fire+=uLight[i].w/(2.+dot(d,d));}
                if(aStyle.y>4.5 && aStyle.y<5.5){
                    mv=modelViewMatrix*vec4(aPuff.xyz+vec3(position.x,0.,position.y)*aPuff.w,1.);
                }else mv.xy+=position.xy*aPuff.w;
                gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform vec3 uSun,uSky;varying vec2 v;varying vec3 style;varying float fire;
            void main(){
                float age=style.x,k=style.y,phase=style.z,r=length(v);
                float warp=.09*sin(5.*v.x+phase+age)*cos(4.*v.y-phase)+.045*sin(v.x*12.+v.y*6.+phase);
                float edge=1.-smoothstep(.51,1.,r+warp);
                float bulb=sqrt(max(0.,1.-dot(v,v)));
                float top=clamp(.43+v.y*.46-v.x*.23+bulb*.24,0.,1.);
                vec3 dye=k<.5?vec3(.50,.40,.235):k<1.5?vec3(.44,.29,.14):vec3(.64,.65,.60);
                if(k>2.5 && k<3.5)dye=mix(vec3(.12,.104,.088),vec3(.66,.67,.65),smoothstep(.05,.59,age));
                if(k>5.5)dye=vec3(.25,.19,.095);
                vec3 col=dye*mix(uSky,uSun,top)+vec3(1.,.41,.09)*min(fire*.10,1.3)*edge;
                float alpha=edge*(1.-age)*(k<1.5?.27:.53)*smoothstep(0.,.075,age+.025);
                if(k>3.5 && k<4.5){col=vec3(5.,2.3,.42);alpha=(1.-smoothstep(.08,1.,r))*(1.-age);}
                if(k>4.5 && k<5.5){alpha=(1.-smoothstep(.025,.14,abs(r-.77)))*(1.-age)*.41;col=vec3(.46,.36,.21);}
                if(alpha<.007)discard;gl_FragColor=vec4(col,alpha);
            }`});this.mesh=new Ai(n,s,Os),this.mesh.count=0,this.mesh.frustumCulled=!1,this.mesh.renderOrder=8,e.add(this.mesh)}lights;items=[];rng=new Di(53);mesh;shape;style;uniforms={uSun:{value:new De},uSky:{value:new De},uLight:{value:Array.from({length:9},()=>new it)}};get count(){return this.items.length}add(e,t,n,s,r,a,o,c,l){this.items.length>=Os||this.items.push({x:e,y:t,z:n,kind:s,size:r,life:a,vx:o,vy:c,vz:l,age:0,seed:this.rng.next()*9})}event(e){if(e.type!=="impact"&&e.type!=="fire")return;const t=Ci(e.x),n=Pi(e.y),s=Dt(t,n),r=()=>this.rng.next();if(e.type==="impact"){this.add(t,s+.15,n,5,5,.85,0,.1,0);for(let l=0;l<10;l++)this.add(t,s+.2,n,6,1+r(),1+r(),(r()-.5)*6,2+r()*4,(r()-.5)*6);return}const a=e.explosive,o=t+e.dx*(a?1.65:1.2),c=n+e.dy;this.lights.flash(o,s,c,a),this.add(o,s+1.1,c,4,a?2.6:.92,.105,e.dx*1.5,0,e.dy);for(let l=0;l<(a?11:3);l++){const u=(a?2.8:1.2)*r();this.add(o+(r()-.5)*.3,s+1.06,c,a?3:2,(a?1.8:.65)*(1+r()*.55),(a?3.4:2.1)+r(),e.dx*u+.33,.32+r()*.62,e.dy*u+.13)}}update(e,t){const n=()=>this.rng.next();for(const s of e)if(s.hp>0&&s.moving){const r=s.kind==="cuirassier",a=r?3.4:s.pose==="run"?1.75:.7;if(n()>t*a)continue;const o=Math.max(1,Math.hypot(s.vx,s.vy)),c=r?1.2:.37,l=Ci(s.x)-s.vx/o*c+(n()-.5)*.32,u=Pi(s.y)-s.vy/o*c;this.add(l,Dt(l,u)+.08+n()*.17,u,r?1:0,r?1.32:s.pose==="run"?.85:.55,1.1+n()*(r?1.2:.75),.32-s.vx/o*.36,r?.44:s.pose==="run"?.3:.16,.14)}this.uniforms.uSun.value.setHex(this.lights.mode==="golden"?16771004:13096673),this.uniforms.uSky.value.setHex(this.lights.mode==="golden"?11055539:7899289),this.lights.flashes.forEach((s,r)=>this.uniforms.uLight.value[r].set(s.position.x,s.position.y,s.position.z,s.intensity));for(let s=this.items.length-1;s>=0;s--){const r=this.items[s];if(r.age+=t,r.age>=r.life){this.items[s]=this.items[this.items.length-1],this.items.pop();continue}r.x+=r.vx*t,r.y+=r.vy*t,r.z+=r.vz*t,r.kind===6&&(r.vy=Math.max(-.8,r.vy-t*5))}this.items.forEach((s,r)=>{const a=s.age/s.life;this.shape.setXYZW(r,s.x,s.y,s.z,s.size*(s.kind===4?1:.46+a*(s.kind===3?3.3:1.8))),this.style.setXYZ(r,a,s.kind,s.seed)}),this.mesh.count=this.count,Li(this.shape,this.count),Li(this.style,this.count)}reset(){this.items.length=0,this.mesh.count=0,this.rng.state=53}}const Or=39*Math.PI/180;class no{constructor(e){this.canvas=e,this.renderer=new mg({canvas:e,antialias:!1,powerPreference:"high-performance"}),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Zi,this.renderer.toneMapping=Ia,this.renderer.toneMappingExposure=1.09,this.renderer.info.autoReset=!1,this.lights=new Cg(this.scene),this.wind=bg(this.scene),this.standees=new wg(this.scene),this.smoke=new Fg(this.scene,this.lights),this.balls=new Ai(new Ya(.16,1),new Za({color:3156776}),100),this.balls.count=0,this.balls.frustumCulled=!1,this.scene.add(this.balls),this.resize(),this.desired=this.distance=Math.min(260,Math.max(168,300/this.camera.aspect)),this.controls(),new ResizeObserver(()=>this.resize()).observe(e)}canvas;renderer;scene=new jl;camera=new qt(28,1,.3,1200);lights;smoke;gore;standees;post=new Pg;wind;target=new F;goal=new F;distance=158;desired=158;held=new Set;balls;matrix=new je;drag=null;get drawCalls(){return this.renderer.info.render.calls}get lighting(){return this.lights.mode}static async create(e){const t=new no(e);return t.gore=await to.create(t.scene,t.lights),t}resize(){const e=Math.max(1,this.canvas.clientWidth),t=Math.max(1,this.canvas.clientHeight),n=Math.min(window.devicePixelRatio,1.5,1700/Math.max(e,t));this.renderer.setPixelRatio(n),this.renderer.setSize(e,t,!1),this.post.size(Math.floor(e*n),Math.floor(t*n)),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}panTo(e,t){this.goal.set(fs.clamp(e,-110,110),0,fs.clamp(t,-60,60))}zoomTo(e){this.desired=fs.clamp(e,13,295)}home(e){const t=e.frontline();this.panTo(Ci(t.x),Pi(t.y))}setLighting(e){this.lights.set(e),this.standees.rim.value.copy(this.lights.rim)}reset(){this.gore.reset(),this.smoke.reset(),this.lights.reset(),this.balls.count=0,this.panTo(0,0)}events(e){for(const t of e.events)this.gore.event(t),this.smoke.event(t)}controls(){const e=this.canvas;e.addEventListener("contextmenu",n=>n.preventDefault()),e.addEventListener("pointerdown",n=>{n.button!==0&&n.button!==2||(e.setPointerCapture(n.pointerId),this.drag={id:n.pointerId,x:n.clientX,y:n.clientY},e.classList.add("dragging"))}),e.addEventListener("pointermove",n=>{const s=this.drag;if(!s||n.pointerId!==s.id)return;const r=this.distance*.505/e.clientHeight;this.panTo(this.goal.x-(n.clientX-s.x)*r,this.goal.z-(n.clientY-s.y)*r/Math.sin(Or)),s.x=n.clientX,s.y=n.clientY}),e.addEventListener("lostpointercapture",()=>{this.drag=null,e.classList.remove("dragging")}),e.addEventListener("wheel",n=>{n.preventDefault(),this.zoomTo(this.desired*Math.exp(Math.sign(n.deltaY)*Math.min(.28,Math.abs(n.deltaY)*.0016)))},{passive:!1});const t=["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"];window.addEventListener("keydown",n=>{const s=n.key.toLowerCase();t.includes(s)&&(n.preventDefault(),this.held.add(s))}),window.addEventListener("keyup",n=>this.held.delete(n.key.toLowerCase())),window.addEventListener("blur",()=>this.held.clear())}render(e,t,n,s){const r=(c,l)=>Number(this.held.has(c)||this.held.has(l)),a=this.distance*.68*t;this.panTo(this.goal.x+(r("d","arrowright")-r("a","arrowleft"))*a,this.goal.z+(r("s","arrowdown")-r("w","arrowup"))*a);const o=1-Math.exp(-t*11);this.distance=fs.lerp(this.distance,this.desired,o),this.target.lerp(this.goal,o),this.target.y=Dt(this.target.x,this.target.z),this.camera.position.copy(this.target),this.camera.position.y+=this.distance*Math.sin(Or),this.camera.position.z+=this.distance*Math.cos(Or),this.camera.lookAt(this.target),this.wind.value+=n,this.lights.update(this.target,this.distance,this.camera.aspect,n),this.standees.draw(e.units,e.tick,s),this.gore.update(n),this.smoke.update(e.winner===null?e.units:[],n),this.balls.count=Math.min(e.rounds.length,100);for(let c=0;c<this.balls.count;c++){const l=e.rounds[c],u=Math.min(1,(l.age+s)/l.duration),h=Ci(l.x+(l.tx-l.x)*u),d=Pi(l.y+(l.ty-l.y)*u);this.balls.setMatrixAt(c,this.matrix.makeTranslation(h,Dt(h,d)+.5+8*u*(1-u),d))}Li(this.balls.instanceMatrix,this.balls.count),this.renderer.info.reset(),this.post.draw(this.renderer,this.scene,this.camera)}}const Og={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',storm:'<path d="M6 16a5 5 0 0 1 .3-10 6 6 0 0 1 11 2 4 4 0 0 1 .7 8h-3m-5-3-2 5h4l-2 4"/>',restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',play:'<path d="m8 4 11 8-11 8Z" fill="currentColor"/>',home:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',time:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',swords:'<path d="m4 3 3 1 11 13-2 2L4 6Zm16 0-3 1-5 6m-3 3-4 4 2 2 4-5M3 16l6 5m6 0 6-5M3 21l3-3m12 0 3 3"/>',pan:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4m-8 12 4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>'},In=i=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+Og[i]+"</svg>",bl='<svg viewBox="0 0 60 56" aria-hidden="true"><defs><g id="sprig"><path d="M28 49C11 46 6 33 8 17" fill="none" stroke="currentColor"/><path d="M13 39Q5 39 3 32Q10 32 13 39M9 31Q2 28 3 22Q9 25 9 31M8 24Q4 18 7 12Q11 18 8 24M10 18Q9 12 14 8Q14 15 10 18M17 44Q9 46 5 41Q11 39 17 44M23 47Q16 52 10 48Q16 44 23 47M11 34Q10 27 15 24Q16 30 11 34M16 41Q13 34 18 31Q20 37 16 41M21 45Q19 39 23 36Q26 41 21 45"/></g></defs><g fill="currentColor"><use href="#sprig"/><use href="#sprig" transform="translate(60 0) scale(-1 1)"/></g><text x="30" y="36" fill="currentColor" text-anchor="middle" font-size="28" font-family="Georgia,serif" font-style="italic">N</text><path fill="currentColor" d="m24 10 2 4h8l2-4-4 2-2-5-2 5Z"/></svg>',Tl=i=>'<i aria-hidden="true" class="flag '+(i?"british":"french")+'"></i>',Al=i=>{const e=Math.floor(i/30);return String(Math.floor(e/60)).padStart(2,"0")+":"+String(e%60).padStart(2,"0")};class Bg{root;alive;bar;record;clock;overlay;get(e){return this.root.querySelector("#"+e)}constructor(e,t){this.root=e,e.innerHTML=`<header class="mast"><div class="insignia">${bl}</div><div><h1>Napoléon <span>1815</span></h1><p>草原千军斗蛐蛐</p></div></header>
        <section class="strength glass" aria-label="双方兵力"><div class="sides">
        <div class="army">${Tl(0)}<span>法兰西帝国</span><strong id="fr">600</strong></div>
        <i class="crossed">${In("swords")}</i>
        <div class="army east"><strong id="gb">600</strong><span>不列颠联合</span>${Tl(1)}</div></div>
        <div class="balance"><i id="ratio"></i></div>
        <div class="ledger"><span class="clock">${In("time")}<time id="clock">00:00</time></span><span id="record"></span></div></section>
        <nav class="controls glass" aria-label="战场控制">
        <div class="controlrow"><div class="segments" aria-label="总兵力">${Ca.map(n=>`<button data-scale="${n}" title="总兵力 ${n}">${n}</button>`).join("")}</div>
        <button id="light" class="labeled"></button></div>
        <div class="controlrow playback"><button id="pause" class="square" aria-label="暂停"></button><div class="speeds">${[.25,1,2].map(n=>`<button data-speed="${n}">${n}×</button>`).join("")}</div><button id="restart" class="labeled">${In("restart")}重新开战</button></div></nav>
        <div class="hint glass">${In("pan")} 拖拽/WASD 移动视角 <b>·</b> 滚轮缩放 <b>·</b> 空格暂停 <b>·</b> R 重开</div>
        <button id="home" class="home glass" title="回到交战中心 (Home)" aria-label="回到交战中心">${In("home")}</button>
        <div id="victory" hidden><section class="victory-card glass" role="dialog" aria-labelledby="victor"><div class="victory-mark">${bl}</div><h2 id="victor"></h2>
        <dl><div><dt>交战时长</dt><dd id="duration"></dd></div><div><dt>总伤亡</dt><dd id="casualties"></dd></div><div><dt>炮击残片落地</dt><dd id="landed"></dd></div></dl><button id="again">${In("restart")}再来一局</button></section></div>`,this.alive=[this.get("fr"),this.get("gb")],this.clock=this.get("clock"),this.record=this.get("record"),this.bar=this.get("ratio"),this.overlay=this.get("victory"),e.querySelectorAll("[data-scale]").forEach(n=>n.onclick=()=>t.scale(Number(n.dataset.scale))),e.querySelectorAll("[data-speed]").forEach(n=>n.onclick=()=>t.speed(Number(n.dataset.speed)));for(const[n,s]of Object.entries({light:t.light,pause:t.pause,restart:t.restart,again:t.restart,home:t.home}))this.get(n).onclick=s}controls(e,t,n,s){this.root.querySelectorAll("[data-scale],[data-speed]").forEach(a=>{a.setAttribute("aria-pressed",String(a.dataset.scale?Number(a.dataset.scale)===e:Number(a.dataset.speed)===s))}),this.get("light").innerHTML=In(t==="golden"?"sun":"storm")+(t==="golden"?"黄金斜阳":"阴云血战");const r=this.get("pause");r.innerHTML=In(n?"play":"pause"),r.setAttribute("aria-label",n?"继续":"暂停"),r.title=n?"继续 (Space)":"暂停 (Space)"}update(e,t,n,s){this.alive.forEach((r,a)=>r.textContent=String(e.alive[a])),this.bar.style.width=100*e.alive[0]/(e.alive[0]+e.alive[1])+"%",this.clock.textContent=Al(e.tick),this.record.textContent="伤亡 "+(e.dead[0]+e.dead[1])+"　·　遗体 "+t+"　·　残片 "+n,s&&e.winner!==null&&(this.get("victor").textContent=(e.winner?"不列颠联合":"法兰西帝国")+"胜利",this.get("duration").textContent=Al(e.tick),this.get("casualties").textContent=String(e.dead[0]+e.dead[1]),this.get("landed").textContent=String(n)),s&&this.overlay.hidden&&(this.get("again").tabIndex=0),this.overlay.hidden=!s}}async function zg(){const i=new Fc,e=document.querySelector("#battlefield"),t=await no.create(e);let n=!1,s=1,r=0,a=0,o=0,c=0,l=0,u=0;const h=new Bg(document.querySelector("#hud"),{scale:m,light:()=>p(t.lighting==="golden"?"storm":"golden"),pause:S,speed:x,restart:()=>g(i.scale),home:()=>t.home(i)});function d(){h.controls(i.scale,t.lighting,n,s)}function f(){const E=t.gore.stats;h.update(i,E.landedCorpses,E.landedGore,i.winner!==null&&a>=1.8)}function g(E){i.reset(E),t.reset(),n=!1,a=r=0,d(),f()}function S(){n=!n,d()}function p(E){(E==="golden"||E==="storm")&&(t.setLighting(E),d())}function m(E){Ca.includes(E)&&g(E)}function x(E){if(E===0){n=!0,d();return}[.25,1,2].includes(E)&&(s=E,n=!1,d())}window.addEventListener("keydown",E=>{E.repeat||E.ctrlKey||E.metaKey||E.altKey||(E.code==="Space"?(E.preventDefault(),S()):E.code==="KeyR"?g(i.scale):E.code==="Home"&&(E.preventDefault(),t.home(i)))}),Object.assign(window,{__arenaDebug:{getState:()=>({tick:i.tick,fps:Math.round(o),drawCalls:t.drawCalls,alive:[...i.alive],dead:[...i.dead],winner:i.winner,scale:i.scale,lighting:t.lighting,activeSmoke:t.smoke.count,...t.gore.stats}),setScale:m,setLighting:p,setSpeed:x,restart:()=>g(i.scale),panTo:(E,_)=>t.panTo(E,_),zoomTo:E=>t.zoomTo(E)}}),d(),f(),document.getElementById("notice").hidden=!0;let b=performance.now();function w(E){const _=Math.max(0,(E-b)/1e3);b=E;const y=Math.min(.12,_);let N=n?0:y*s;if(i.winner!==null)n||(a+=_,N=y*(a<1.8?.3:1)),r=0;else{for(r+=N*Cc;r>=1&&i.winner===null;)i.step(),t.events(i),r--;i.winner!==null&&(r=0)}t.render(i,y,N,r),l+=_,c++,l>=.5&&(o=c/l,l=c=0),u+=_,u>.1&&(f(),u=0),requestAnimationFrame(w)}document.addEventListener("visibilitychange",()=>{b=performance.now()}),requestAnimationFrame(w)}zg().catch(i=>{console.error(i);const e=document.getElementById("notice");e.hidden=!1,e.textContent="战场加载失败 · "+(i instanceof Error?i.message:String(i))});
