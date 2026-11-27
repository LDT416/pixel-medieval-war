class gf{constructor(e,t,n){this.w=e,this.arena=t;const i=document.createElement("button");i.textContent="×",i.title="结束跟随",i.onclick=()=>this.stop(),this.card.className="company-follow glass",this.card.hidden=!0,this.plot.width=180,this.plot.height=24,this.plot.setAttribute("aria-label","有效兵力随时间变化"),this.card.append(i,this.name,this.stats,this.plot,this.support,this.intel,this.news),document.querySelector("#hud").append(this.card);let r=null,a;n.addEventListener("pointerdown",o=>{if(a!==void 0){clearTimeout(a),a=void 0,r=null;return}if(!o.isPrimary||o.button!==0){r=null;return}r={x:o.clientX,y:o.clientY,time:o.timeStamp}}),n.addEventListener("pointercancel",()=>{r=null}),n.addEventListener("pointerup",o=>{if(!r||Math.hypot(o.clientX-r.x,o.clientY-r.y)>7||o.timeStamp-r.time>450){r=null;return}r=null;const l=n.getBoundingClientRect(),c=o.clientX-l.left,h=o.clientY-l.top;a=window.setTimeout(()=>{if(a=void 0,this.arena.zoom>=900)return;let d=-1,u=this.arena.mobileMode?24:19;for(const f of this.w.companies){if(!f.alive||f.status==="gone")continue;const p=this.arena.screen(f.x,f.y);if(Math.abs(p.z)>1)continue;const y=Math.hypot((p.x+1)*l.width/2-c,(1-p.y)*l.height/2-h);y<u&&(d=f.id,u=y)}d>=0&&this.start(d)},340)})}w;arena;id=-1;card=document.createElement("section");name=document.createElement("b");stats=document.createElement("p");intel=document.createElement("p");support=document.createElement("p");plot=document.createElement("canvas");news=document.createElement("p");history=new Map;sample=-1;now=0;trackedAt=-1;layout;get selected(){return this.id}start(e){this.id=e,this.trackedAt=this.arena.userAt,this.card.hidden=!1,this.now=0;const t=this.w.companies[e];this.arena.focus(t.x,t.y,Math.min(115,this.arena.zoom))}stop(){this.id=-1,this.card.hidden=!0}tick(e){const t=this.w;if(this.layout!==t.layout&&(this.layout=t.layout,this.stop(),this.history.clear(),this.sample=-1),t.tick>=this.sample){this.sample=t.tick+300;for(const c of t.companies){let h=this.history.get(c.id);h||(h=[],this.history.set(c.id,h)),h.push(c.alive)}}if(this.id<0)return;if(t.ended||this.arena.userAt>this.trackedAt){this.stop();return}const n=t.companies[this.id];if(!n||(this.arena.focus(n.x,n.y),e<this.now))return;this.now=e+220,this.name.textContent=n.name,this.stats.textContent="兵力 "+n.alive+" / "+n.peak+"　士气 "+Math.round(n.morale)+"　歼敌 "+n.kills;const i=t.sight.latest(t,n.faction);this.intel.textContent=i?"己方最近目击　格 ("+i.column+", "+i.row+") · "+Math.floor((t.tick-i.tick)/30)+" 秒前":"己方暂无目击报告";const r=t.logistics.support.get(n.id);this.support.hidden=!r,this.support.textContent=r?"后勤选择　"+r.map(c=>c.label+" "+Math.round(c.score*100)).join(" · "):"";const a=[...this.history.get(n.id)??[],n.alive],o=this.plot.getContext("2d");o.clearRect(0,0,180,24),o.strokeStyle="#e4c88b",o.lineWidth=1.75,o.beginPath(),a.forEach((c,h)=>{const d=h*179/Math.max(1,a.length-1),u=22-20*c/Math.max(1,n.peak);h?o.lineTo(d,u):o.moveTo(d,u)}),o.stroke();let l="";for(let c=t.news.length-1;c>=0;c--)if(t.news[c].text.includes(n.name)){l=t.news[c].text;break}this.news.textContent=l}}class xf{muted=!1;ctx;bus;voices=0;noise;last=new Map;music=!0;nation=1;cursor=0;nextNote=0;beat=0;loud=!1;fanfare=-1;musicBus;ambience;drums=0;get signalCount(){return this.drums}setMuted(e){this.muted=e,this.bus&&this.ctx&&this.bus.gain.setTargetAtTime(e?0:.22,this.ctx.currentTime,.025)}environment(e,t){if(!this.ctx||!this.ambience)return;const n=Math.min(1,Math.max(0,(e-90)/600));this.ambience.gain.setTargetAtTime(n*Math.min(.18,t*.015),this.ctx.currentTime,.4)}start(e){this.nation=e,this.cursor=this.beat=0,this.loud=!1,this.fanfare=-1,this.nextNote=this.ctx?.currentTime??0}stop(){this.musicBus&&(this.musicBus.gain.value=0)}sequence(e,t){const n=this.ctx;if(!n||!this.bus||!this.musicBus)return;if(this.musicBus.gain.value=this.music&&!t?1:0,!this.music||t){this.nextNote=n.currentTime;return}!this.nation&&e&&!this.loud&&(this.fanfare=0),this.loud=e,this.nextNote<n.currentTime&&(this.nextNote=n.currentTime);const i=60/(this.nation?124:114),r=(a,o,l,c)=>{const h=n.createOscillator(),d=n.createGain();h.type=l,h.frequency.value=440*2**((a-69)/12),d.gain.setValueAtTime(.001,this.nextNote),d.gain.linearRampToValueAtTime(c,this.nextNote+.009),d.gain.exponentialRampToValueAtTime(.001,this.nextNote+o),h.connect(d),d.connect(this.musicBus),h.start(this.nextNote),h.stop(this.nextNote+o+.01),h.onended=()=>{h.disconnect(),d.disconnect()}};for(;this.nextNote<n.currentTime+.12;){const a=this.fanfare>=0,o=a?Mf:this.nation?vf:yf,l=a?this.fanfare:this.cursor%o.length,[c,h]=o[l],d=!a&&!this.nation&&l<Ou.length?i/3:i/2,u=h*d;r(c,u*.91,a?"sawtooth":"square",.095),e&&r(c+12,u*.85,"triangle",.09);for(let f=0;f<h;f++){const p=this.beat+f,y=this.nextNote+f*d;if(p%2===0){const m=this.nextNote;this.nextNote=y,r(p%4?50:43,d*1.6,"triangle",.24),this.nextNote=m}if(p%(e?2:4)===1){const m=n.createBufferSource(),g=n.createBiquadFilter(),_=n.createGain();m.buffer=this.noise,g.type="highpass",g.frequency.value=1600,_.gain.setValueAtTime(e?.16:.06,y),_.gain.exponentialRampToValueAtTime(.001,y+.075),m.connect(g),g.connect(_),_.connect(this.musicBus),m.start(y),m.stop(y+.08),m.onended=()=>{m.disconnect(),g.disconnect(),_.disconnect()}}}this.nextNote+=u,this.beat+=h,a?++this.fanfare>=o.length&&(this.fanfare=-1):this.cursor++}}unlock(){if(!this.ctx){const e=this.ctx=new AudioContext,t=this.bus=e.createGain(),n=e.createDynamicsCompressor();t.gain.value=this.muted?0:.22,this.musicBus=e.createGain(),this.musicBus.connect(t),t.connect(n),n.connect(e.destination),this.noise=e.createBuffer(1,e.sampleRate*.7,e.sampleRate);const i=this.noise.getChannelData(0);for(let o=0;o<i.length;o++)i[o]=Math.random()*2-1;const r=e.createBufferSource(),a=e.createBiquadFilter();r.buffer=this.noise,r.loop=!0,a.type="lowpass",a.frequency.value=380,this.ambience=e.createGain(),this.ambience.gain.value=0,r.connect(a),a.connect(this.ambience),this.ambience.connect(t),r.start()}this.ctx.state==="suspended"&&this.ctx.resume()}play(e,t){const n=this.ctx;if(!n||!this.bus||this.muted||n.state!=="running")return;const i=new Map;for(const r of e){const a=r.type==="fire"?r.kind:r.type;if(!a||this.voices>=10&&a!=="drum")continue;const o=a==="field_cannon"||a==="collapse"||a==="impact",l=a==="drum"||a==="horn",c=["line_infantry","guard_grenadier"].includes(a),h=a==="slash"||a==="block",d=a==="death",u=a==="hoof",f=t?Math.min(1,t.distance/1100):0,m=1/(1+((t?Math.hypot(t.x-r.x,t.y-r.y):0)/(o?8400:l?5e3:2400))**2)*(o?1-.24*f:1-.68*f);if(m<(o||l?.008:.04)||!(u||l||o||c||h||a==="hit"||d))continue;const g=n.currentTime,_=o?.14:c?.042:d?.07:.085,v=c?i.get(a)??0:0;if(v>=4||v===0&&g-(this.last.get(a)??-1)<_)continue;c&&i.set(a,v+1),this.last.set(a,g);const M=c?g+v*.012+Math.random()*.012:g,S=n.createGain(),b=n.createBiquadFilter(),x=a==="horn"?.65:a==="drum"?.28:o?.46:c?.19:d?.11:.09;let E;if(u||l||h||a==="hit"||d){const w=n.createOscillator();w.type=a==="horn"?"sawtooth":h?"triangle":"sine";const R=u?72:a==="drum"?108:a==="horn"?146.83:h?880:d?92:145;w.frequency.setValueAtTime(R,M),w.frequency.exponentialRampToValueAtTime(R*(a==="horn"?1.5:.24),M+x),E=w}else{const w=n.createBufferSource();w.buffer=this.noise,E=w}if(b.type="lowpass",b.frequency.setValueAtTime((o?1100:c?4600:d?420:2600)*(1-.65*f),M),b.frequency.exponentialRampToValueAtTime(o?42:c?280:120,M+x),S.gain.setValueAtTime(m*(o?.72:c?.34:d?.22:a==="drum"?.86:u?.28:.19),M),S.gain.exponentialRampToValueAtTime(.001,M+x),E.connect(b),b.connect(S),S.connect(this.bus),this.voices++,a==="drum"&&this.drums++,E.onended=()=>{this.voices--,E.disconnect(),b.disconnect(),S.disconnect()},E.start(M),E.stop(M+x+.01),a==="field_cannon"&&this.voices<10){const w=n.createOscillator(),R=n.createGain();w.type="sine",w.frequency.setValueAtTime(540,g+.08),w.frequency.exponentialRampToValueAtTime(160,g+.46),R.gain.setValueAtTime(.001,g+.08),R.gain.linearRampToValueAtTime(.09*m,g+.18),R.gain.exponentialRampToValueAtTime(.001,g+.46),w.connect(R),R.connect(this.bus),this.voices++,w.onended=()=>{this.voices--,w.disconnect(),R.disconnect()},w.start(g+.08),w.stop(g+.48)}}}}const ko=[[74,2],[79,2],[74,2],[79,2],[81,2],[83,4],[81,2],[83,1],[84,1],[86,2],[79,2],[83,1],[81,1],[79,1],[78,1],[79,6]],_f=[[74,2],[79,2],[79,2],[81,2],[83,4],[84,2],[83,1],[81,1],[79,2],...ko.slice(9)],vf=[..._f,...ko,[88,1],[88,1],[86,3],[88,1],[86,2],[84,2],[83,3],[84,1],[86,2],[86,2],[88,2],[88,2],[86,1],[84,1],[83,1],[81,1],[79,4],[78,2],[74,1],[74,1],...ko.slice(1)],kc=[[62,1],[62,1],[62,1],[67,3],[69,2],[69,1],[71,2],[71,1],[69,1],[71,1],[69,1]],Ou=[...kc,[67,2],[67,1],[71,2],[71,1],[69,3],...kc,[67,3],[69,1],[71,1],[69,1],[67,3]],Nr=(s,e)=>[[s,1],[e,1],[e,.5],[e,.5],[e,1]],Bc=s=>[...Nr(74,71),...Nr(74,71),[74,1],[76,1],[74,1],[72,1],[71,1],[72,3],...Nr(72,69),...Nr(72,69),[72,1],[74,1],[72,1],[71,1],[69,1],[s,3]],yf=[...Ou,...Bc(71),...Bc(67)],Mf=[[74,1],[74,1],[74,2],[79,4],[79,2],[81,2],[81,2],[86,2],[83,3],[79,1],[79,2],[83,2],[79,3],[76,1],[72,2],[81,2]];class Sf{constructor(e){this.arena=e;const t=document.createElement("button");t.type="button",t.id="battle-sound",t.className="labeled";const n=()=>{t.textContent=this.audio.muted?"声音 · 关":"声音 · 开",t.setAttribute("aria-label",this.audio.muted?"打开战场声音":"静音"),t.setAttribute("aria-pressed",String(!this.audio.muted))};this.audio.setMuted(localStorage.getItem("1815-sound")==="off"),n();const i=()=>{!this.unlocked&&!this.audio.muted&&typeof AudioContext<"u"&&(this.audio.unlock(),this.unlocked=!0)};window.addEventListener("pointerdown",i,{capture:!0}),window.addEventListener("keydown",i,{capture:!0}),t.onclick=()=>{this.audio.setMuted(!this.audio.muted),localStorage.setItem("1815-sound",this.audio.muted?"off":"on"),i(),n()},document.querySelector("#tracer-mode")?.after(t),document.addEventListener("visibilitychange",()=>{document.hidden&&this.audio.environment(0,0)})}arena;audio=new xf;activity=0;unlocked=!1;get drums(){return this.audio.signalCount}step(e){if(!this.unlocked||this.audio.muted)return;const t=this.arena.cameraInfo;if(e.events.length&&(this.audio.play(e.events,t),this.activity+=e.events.filter(n=>n.type==="fire"||n.type==="impact").length),e.tick%10===0&&t.distance<300){const n=e.companies.find(i=>i.alive&&i.kind==="cuirassier"&&Math.hypot(i.vx,i.vy)>5&&Math.hypot(i.x-t.x,i.y-t.y)<600);n&&this.audio.play([{type:"hoof",x:n.x,y:n.y}],t)}if(e.tick%30===0)for(const n of e.companies)n.kind==="cuirassier"&&n.order==="charge"&&e.tick-n.chargeAt<30&&this.audio.play([{type:"horn",x:n.x,y:n.y}],t)}update(e,t){this.activity*=Math.exp(-e*2),this.audio.environment(this.arena.zoom,t||document.hidden?0:this.activity)}}const Ft={footMarch:64,guardMarch:66,footRush:114,footFlee:90,horseTrot:140,horseSprint:235,sprintTicks:120,wagon:60,courier:200,maxFatiguePenalty:.15,strideLength:32,deploymentTicks:360,limberTicks:75},Fl={effective:230,scatter:320,round:2500},ku={foot:{a:4.5,b:4.5,mass:1},horse:{a:11,b:5.5,mass:6},gun:{a:14,b:14,mass:10}},Bo={allowed:["line","column","square"],changeTicks:55,squareTicks:58},bf={...Bo,squareTicks:36},Ef={allowed:["wedge","column","staff"],changeTicks:55,squareTicks:0},Tf={allowed:["battery","column"],changeTicks:55,squareTicks:0},Xt={line_infantry:{formation:Bo,group:"line",frame:"foot",hp:100,morale:66,speed:Ft.footMarch,value:1,capacity:32},guard_grenadier:{formation:bf,group:"guard",frame:"foot",hp:116,morale:92,speed:Ft.guardMarch,value:1.55,capacity:30},cuirassier:{formation:Ef,group:"mounted",frame:"horse",hp:135,morale:76,speed:Ft.horseTrot,value:1.35,capacity:22},bannerman:{formation:Bo,group:"standard",frame:"foot",hp:90,morale:66,speed:Ft.footMarch,value:.6,capacity:1},field_cannon:{formation:Tf,group:"artillery",frame:"gun",hp:230,morale:72,speed:Ft.wagon,value:9,capacity:5}},Ve=s=>Xt[s.kind].group==="mounted",mt=s=>Xt[s.kind].group==="artillery",Ts=s=>Xt[s.kind].group==="standard",ft=s=>Xt[s.kind].group==="guard",_n=s=>Xt[s.kind].group==="line",As=30,Bu=45*As,Af=120*As,wf=600*As;class Rf{progress=new Map;majority=[0,0];taken=[!1,!1];claim(e){return this.progress.get(e)}reset(){this.progress.clear(),this.majority=[0,0],this.taken=[!1,!1]}update(e){const{objectives:t,farm:n}=e.layout;for(const i of t){const r=i.kind==="ridge"?230:i.kind==="bridge"?135:158,a=e.companies.filter(l=>l.line!==5&&!mt(l)&&l.status!=="gone"&&l.status!=="rout"&&l.alive>0&&(l.x-i.x)**2+(l.y-i.y)**2<r*r),o=[a.some(l=>l.faction===0),a.some(l=>l.faction===1)];if(o[0]!==o[1]){const l=o[0]?0:1;if(l!==i.owner){let c=this.progress.get(i.id);if(c?.faction!==l&&(c={faction:l,ticks:0},this.progress.set(i.id,c)),c.ticks+=As,c.ticks>=Bu){i.owner>=0&&(this.taken[l]=!0);const h=a.reduce((d,u)=>u.alive>d.alive?u:d);if(i.owner=l,h.captures++,this.progress.delete(i.id),i.kind==="farm"&&n&&n.x===i.x&&n.y===i.y){e.layout.farmOwner=l;for(const d of e.companies)d.line===6&&d.faction!==l&&(d.line=1)}e.say(h.name+"占领"+i.name,l,i.x,i.y,2)}}else this.progress.delete(i.id)}else this.progress.delete(i.id);(i.owner===0||i.owner===1)&&(i.heldTicks[i.owner]+=As)}for(const i of[0,1]){const r=t.filter(a=>a.owner===i).length;if(this.majority[i]=this.taken[i]&&r>t.length/2?this.majority[i]+As:0,e.winner===null&&e.tick>=wf&&this.majority[i]>=Af){e.breakArmy(i===0?1:0,(i===0?"法兰西帝国":"反法同盟")+"持续控制多数战略要点");break}}}}class Cf{constructor(e,t){this.arena=t,this.wrap.className="tactical-map glass",this.wrap.setAttribute("aria-label","战区小地图"),this.button.type="button",this.button.className="map-toggle",this.button.textContent="战区图",this.button.title="展开或收起小地图",this.wrap.classList.toggle("collapsed",t.mobileMode),this.button.setAttribute("aria-expanded",String(!t.mobileMode)),this.button.onclick=()=>this.button.setAttribute("aria-expanded",String(!this.wrap.classList.toggle("collapsed"))),this.canvas.width=320,this.canvas.height=160,this.canvas.tabIndex=0,this.canvas.setAttribute("aria-label","点击或拖动小地图移动视野"),this.ctx=this.canvas.getContext("2d"),this.objectives.className="map-vps",this.wrap.append(this.button,this.canvas,this.objectives),e.append(this.wrap),this.legend.className="map-legend glass",this.legend.textContent="× 步兵　／ 骑兵　● 火炮　♛ 近卫　◇ 据点　✉ 传令　▤ 补给",this.legend.hidden=!0,e.append(this.legend);const n=(i,r)=>{const a=this.canvas.getBoundingClientRect();this.arena.viewPoint(Math.max(0,Math.min(1,(i-a.left)/a.width))*this.mapWidth,Math.max(0,Math.min(1,(r-a.top)/a.height))*this.mapHeight)};this.canvas.onpointerdown=i=>{this.canvas.setPointerCapture(i.pointerId),n(i.clientX,i.clientY)},this.canvas.onpointermove=i=>{this.canvas.hasPointerCapture(i.pointerId)&&n(i.clientX,i.clientY)},this.canvas.onkeydown=i=>{const r=+(i.key==="ArrowRight")-+(i.key==="ArrowLeft"),a=+(i.key==="ArrowDown")-+(i.key==="ArrowUp");if(r||a){i.preventDefault(),i.stopPropagation();const o=t.cameraInfo;t.viewPoint(o.x+r*this.mapWidth*.07,o.y+a*this.mapHeight*.07)}}}arena;canvas=document.createElement("canvas");wrap=document.createElement("aside");button=document.createElement("button");ctx;objectives=document.createElement("div");legend=document.createElement("div");mapWidth=1;mapHeight=1;update(e){if(this.mapWidth=e.layout.width,this.mapHeight=e.layout.height,this.legend.hidden=this.arena.zoom<300,this.wrap.classList.contains("collapsed"))return;const t=this.ctx,n=this.canvas.width,i=this.canvas.height,r=n/this.mapWidth,a=i/this.mapHeight;t.drawImage(this.arena.mapSheet,0,0,n,i);for(const h of e.companies)!h.alive||h.status==="gone"||(t.fillStyle=h.faction?"#8c2925":"#234b83",t.fillRect(Math.round(h.x*r)-1,Math.round(h.y*a)-1,3,3));for(const h of e.logistics.wagons)h.destroyed||(t.fillStyle=h.faction?"#823a32":"#324e73",t.fillRect(h.x*r-3,h.y*a-2,6,4),t.fillStyle="#eadfab",t.fillRect(h.x*r-2,h.y*a-.5,4,1));for(const h of e.logistics.couriers){const d=h.x*r,u=h.y*a;t.fillStyle="#fff1bb",t.strokeStyle=h.faction?"#823a32":"#324e73",t.beginPath(),t.moveTo(d,u-3),t.lineTo(d+3,u+2),t.lineTo(d-3,u+2),t.closePath(),t.fill(),t.stroke()}t.save(),t.strokeStyle="#fff9dc",t.lineWidth=2,t.shadowColor="#282824",t.shadowBlur=2,t.beginPath(),this.arena.visiblePolygon.forEach((h,d)=>d?t.lineTo(h.x*r,h.y*a):t.moveTo(h.x*r,h.y*a)),t.closePath(),t.stroke(),t.restore();const o=e.layout.objectives,l=o.flatMap(h=>{const d=e.objectives.claim(h.id);return d?[h.name+" "+(d.faction?"联":"法")+" "+Math.ceil((Bu-d.ticks)/30)+"秒"]:[]}),c=[0,1].map(h=>{const d=o.filter(f=>f.owner===h).length,u=o.reduce((f,p)=>f+(p.heldTicks[h]||0),0);return(h?"联":"法")+" "+d+"◇ · "+Math.floor(u/30)+"秒"}).join("　");this.objectives.textContent=l.length?l.join("　"):c,this.objectives.title=o.map(h=>h.name+" · 法 "+Math.floor(h.heldTicks[0]/30)+" / 联 "+Math.floor(h.heldTicks[1]/30)+" 秒").join(`
`)}}const Ol="187",Pf=0,zc=1,Lf=2,lr=1,If=2,ir=3,Fi=0,tn=1,Tt=2,ws=0,cr=1,zo=2,Gc=3,Hc=4,Nf=5,Ss=100,Df=101,Uf=102,Ff=103,Of=104,kf=200,Bf=201,zf=202,Gf=203,zu=204,Gu=205,Hf=206,Vf=207,Wf=208,Xf=209,qf=210,Yf=211,$f=212,Kf=213,Zf=214,Go=0,Ho=1,Vo=2,mr=3,Wo=4,Xo=5,qo=6,Yo=7,kl=0,Jf=1,Qf=2,ui=0,Hu=1,Vu=2,Wu=3,Bl=4,Xu=5,qu=6,Yu=7,Vc="attached",jf="detached",$u=300,Ls=301,gr=302,Ya=303,$a=304,Oi=1e3,Xn=1001,ba=1002,_t=1003,Ku=1004,sr=1005,Pt=1006,ga=1007,qn=1008,cn=1009,Zu=1010,Ju=1011,xr=1012,zl=1013,Zn=1014,xn=1015,Dn=1016,Gl=1017,Hl=1018,Is=1020,Qu=35902,ju=35899,ed=1021,td=1022,Cn=1023,ki=1026,Di=1027,Vl=1028,Wl=1029,ts=1030,Xl=1031,ql=1033,xa=33776,_a=33777,va=33778,ya=33779,$o=35840,Ko=35841,Zo=35842,Jo=35843,Qo=36196,jo=37492,el=37496,tl=37488,nl=37489,Ea=37490,il=37491,sl=37808,rl=37809,al=37810,ol=37811,ll=37812,cl=37813,hl=37814,ul=37815,dl=37816,fl=37817,pl=37818,ml=37819,gl=37820,xl=37821,_l=36492,vl=36494,yl=36495,Ml=36283,Sl=36284,Ta=36285,bl=36286,_r=2300,vr=2301,Ka=2302,Wc=2303,Xc=2400,qc=2401,Yc=2402,ep=2500,tp=0,nd=1,El=2,np=3200,id=3201,Aa=0,ip=1,Ii="",xt="srgb",hn="srgb-linear",wa="linear",rt="srgb",Za=7680,sp=519,rp=512,ap=513,op=514,sd=515,lp=516,cp=517,rd=518,ad=519,od=35044,yr=35048,$c="300 es",Pn=2e3,Mr=2001;function hp(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function up(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Sr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function dp(){const s=Sr("canvas");return s.style.display="block",s}const Kc={};function Ra(...s){const e="THREE."+s.shift();console.log(e,...s)}function ld(s){const e=s[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=s[1];t&&t.isStackTrace?s[0]+=" "+t.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function Le(...s){s=ld(s);const e="THREE."+s.shift();{const t=s[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...s)}}function Ue(...s){s=ld(s);const e="THREE."+s.shift();{const t=s[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...s)}}function Rs(...s){const e=s.join(" ");e in Kc||(Kc[e]=!0,Le(...s))}function fp(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const pp={[Go]:Go,[Vo]:qo,[Wo]:Wo,[mr]:Xo,[Ho]:Ho,[qo]:Vo,[Yo]:Yo,[Xo]:mr};class ns{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const i=n[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,e);e.target=null}}}const Kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Zc=1234567;const hr=Math.PI/180,Ns=180/Math.PI;function Jn(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Kt[s&255]+Kt[s>>8&255]+Kt[s>>16&255]+Kt[s>>24&255]+"-"+Kt[e&255]+Kt[e>>8&255]+"-"+Kt[e>>16&15|64]+Kt[e>>24&255]+"-"+Kt[t&63|128]+Kt[t>>8&255]+"-"+Kt[t>>16&255]+Kt[t>>24&255]+Kt[n&255]+Kt[n>>8&255]+Kt[n>>16&255]+Kt[n>>24&255]).toLowerCase()}function Je(s,e,t){return Math.max(e,Math.min(t,s))}function Yl(s,e){return(s%e+e)%e}function mp(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function gp(s,e,t){return s!==e?(t-s)/(e-s):0}function ur(s,e,t){return(1-t)*s+t*e}function xp(s,e,t,n){return ur(s,e,1-Math.exp(-t*n))}function _p(s,e=1){return e-Math.abs(Yl(s,e*2)-e)}function vp(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function yp(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Mp(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Sp(s,e){return s+Math.random()*(e-s)}function bp(s){return s*(.5-Math.random())}function Ep(s){s!==void 0&&(Zc=s);let e=Zc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Tp(s){return s*hr}function Ap(s){return s*Ns}function wp(s){return s>0&&Number.isInteger(s)&&2**Math.round(Math.log2(s))===s}function Rp(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function cd(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Cp(s,e,t,n,i){const r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),d=r((e-n)/2),u=a((e-n)/2),f=r((n-e)/2),p=a((n-e)/2);switch(i){case"XYX":s.set(o*h,l*d,l*u,o*c);break;case"YZY":s.set(l*u,o*h,l*d,o*c);break;case"ZXZ":s.set(l*d,l*u,o*h,o*c);break;case"XZX":s.set(o*h,l*p,l*f,o*c);break;case"YXY":s.set(l*f,o*h,l*p,o*c);break;case"ZYZ":s.set(l*p,l*f,o*h,o*c);break;default:Le("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ua(s){switch(s.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function $l(s,e){if(e.constructor===Float32Array)return s;const t=Ua(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(s/t,-1)}function Kl(s,e){if(e.constructor===Float32Array)return s;const t=Ua(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(s*t)}const rr={DEG2RAD:hr,RAD2DEG:Ns,generateUUID:Jn,clamp:Je,euclideanModulo:Yl,mapLinear:mp,inverseLerp:gp,lerp:ur,damp:xp,pingpong:_p,smoothstep:vp,smootherstep:yp,randInt:Mp,randFloat:Sp,randFloatSpread:bp,seededRandom:Ep,degToRad:Tp,radToDeg:Ap,isPowerOfTwo:wp,ceilPowerOfTwo:Rp,floorPowerOfTwo:cd,setQuaternionFromProperEuler:Cp,normalize:Kl,denormalize:$l},bc=class bc{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};bc.prototype.isVector2=!0;let ke=bc;class xi{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],d=n[i+3],u=r[a+0],f=r[a+1],p=r[a+2],y=r[a+3];if(d!==y||l!==u||c!==f||h!==p){let m=l*u+c*f+h*p+d*y;m<0&&(u=-u,f=-f,p=-p,y=-y,m=-m);let g=1-o;if(m<.9995){const _=Math.acos(m),v=Math.sin(_);g=Math.sin(g*_)/v,o=Math.sin(o*_)/v,l=l*g+u*o,c=c*g+f*o,h=h*g+p*o,d=d*g+y*o}else{l=l*g+u*o,c=c*g+f*o,h=h*g+p*o,d=d*g+y*o;const _=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=_,c*=_,h*=_,d*=_}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,i,r,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],d=r[a],u=r[a+1],f=r[a+2],p=r[a+3];return e[t]=o*p+h*d+l*f-c*u,e[t+1]=l*p+h*u+c*d-o*f,e[t+2]=c*p+h*f+o*u-l*d,e[t+3]=h*p-o*d-l*u-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),d=o(r/2),u=l(n/2),f=l(i/2),p=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d-u*f*p;break;case"YXZ":this._x=u*h*d+c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d+u*f*p;break;case"ZXY":this._x=u*h*d-c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d-u*f*p;break;case"ZYX":this._x=u*h*d-c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d+u*f*p;break;case"YZX":this._x=u*h*d+c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d-u*f*p;break;case"XZY":this._x=u*h*d-c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d+u*f*p;break;default:Le("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],d=t[10],u=n+o+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-i)*f}else if(n>o&&n>d){const f=2*Math.sqrt(1+n-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(r+c)/f}else if(o>d){const f=2*Math.sqrt(1+o-n-d);this._w=(r-c)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+d-n-o);this._w=(a-i)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Je(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,i=-i,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Ec=class Ec{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Jc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Jc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-r*i),d=2*(r*n-a*t);return this.x=t+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=i+l*d+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ja.copy(this).projectOnVector(e),this.sub(Ja)}reflect(e){return this.sub(Ja.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ec.prototype.isVector3=!0;let G=Ec;const Ja=new G,Jc=new xi,Tc=class Tc{constructor(e,t,n,i,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],p=n[8],y=i[0],m=i[3],g=i[6],_=i[1],v=i[4],M=i[7],S=i[2],b=i[5],x=i[8];return r[0]=a*y+o*_+l*S,r[3]=a*m+o*v+l*b,r[6]=a*g+o*M+l*x,r[1]=c*y+h*_+d*S,r[4]=c*m+h*v+d*b,r[7]=c*g+h*M+d*x,r[2]=u*y+f*_+p*S,r[5]=u*m+f*v+p*b,r[8]=u*g+f*M+p*x,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=h*a-o*c,u=o*l-h*r,f=c*r-a*l,p=t*d+n*u+i*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/p;return e[0]=d*y,e[1]=(i*c-h*n)*y,e[2]=(o*n-i*a)*y,e[3]=u*y,e[4]=(h*t-i*l)*y,e[5]=(i*r-o*t)*y,e[6]=f*y,e[7]=(n*l-c*t)*y,e[8]=(a*t-n*r)*y,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Rs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Qa.makeScale(e,t)),this}rotate(e){return Rs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Qa.makeRotation(-e)),this}translate(e,t){return Rs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Qa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Tc.prototype.isMatrix3=!0;let Oe=Tc;const Qa=new Oe,Qc=new Oe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),jc=new Oe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Pp(){const s={enabled:!0,workingColorSpace:hn,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===rt&&(i.r=di(i.r),i.g=di(i.g),i.b=di(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===rt&&(i.r=Cs(i.r),i.g=Cs(i.g),i.b=Cs(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Ii?wa:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[hn]:{primaries:e,whitePoint:n,transfer:wa,toXYZ:Qc,fromXYZ:jc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:xt},outputColorSpaceConfig:{drawingBufferColorSpace:xt}},[xt]:{primaries:e,whitePoint:n,transfer:rt,toXYZ:Qc,fromXYZ:jc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:xt}}}),s}const Ze=Pp();function di(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Cs(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let ss;class Lp{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ss===void 0&&(ss=Sr("canvas")),ss.width=e.width,ss.height=e.height;const i=ss.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=ss}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Sr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=di(r[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(di(t[n]/255)*255):t[n]=di(t[n]);return{data:t,width:e.width,height:e.height}}else return Le("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ip=0;class Zl{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ip++}),this.uuid=Jn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(ja(i[a].image)):r.push(ja(i[a]))}else r=ja(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function ja(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Lp.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(Le("Texture: Unable to serialize Texture."),{})}let Np=0;const eo=new G;class Nt extends ns{constructor(e=Nt.DEFAULT_IMAGE,t=Nt.DEFAULT_MAPPING,n=Xn,i=Xn,r=Pt,a=qn,o=Cn,l=cn,c=Nt.DEFAULT_ANISOTROPY,h=Ii){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=Jn(),this.name="",this.source=new Zl(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ke(0,0),this.repeat=new ke(1,1),this.center=new ke(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(eo).x}get height(){return this.source.getSize(eo).y}get depth(){return this.source.getSize(eo).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Le(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){Le(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==$u)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Oi:e.x=e.x-Math.floor(e.x);break;case Xn:e.x=e.x<0?0:1;break;case ba:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Oi:e.y=e.y-Math.floor(e.y);break;case Xn:e.y=e.y<0?0:1;break;case ba:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Nt.DEFAULT_IMAGE=null;Nt.DEFAULT_MAPPING=$u;Nt.DEFAULT_ANISOTROPY=1;const Ac=class Ac{constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const l=e.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],p=l[9],y=l[2],m=l[6],g=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-y)<.01&&Math.abs(p-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+y)<.1&&Math.abs(p+m)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const v=(c+1)/2,M=(f+1)/2,S=(g+1)/2,b=(h+u)/4,x=(d+y)/4,E=(p+m)/4;return v>M&&v>S?v<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(v),i=b/n,r=x/n):M>S?M<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(M),n=b/i,r=E/i):S<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(S),n=x/r,i=E/r),this.set(n,i,r,t),this}let _=Math.sqrt((m-p)*(m-p)+(d-y)*(d-y)+(u-h)*(u-h));return Math.abs(_)<.001&&(_=1),this.x=(m-p)/_,this.y=(d-y)/_,this.z=(u-h)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this.w=Je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this.w=Je(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ac.prototype.isVector4=!0;let ot=Ac;class Dp extends ns{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t),this.textures=[];const i=n.count;for(let r=0;r<i;r++)this.textures[r]=new Nt({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Pt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const i=Object.assign({},e.textures[t].image);this.textures[t].source=new Zl(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class In extends Dp{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class hd extends Nt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=_t,this.minFilter=_t,this.wrapR=Xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Up extends Nt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=_t,this.minFilter=_t,this.wrapR=Xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const Da=class Da{constructor(e,t,n,i,r,a,o,l,c,h,d,u,f,p,y,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,h,d,u,f,p,y,m)}set(e,t,n,i,r,a,o,l,c,h,d,u,f,p,y,m){const g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=i,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=c,g[6]=h,g[10]=d,g[14]=u,g[3]=f,g[7]=p,g[11]=y,g[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Da().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,i=1/rs.setFromMatrixColumn(e,0).length(),r=1/rs.setFromMatrixColumn(e,1).length(),a=1/rs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){const u=a*h,f=a*d,p=o*h,y=o*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=f+p*c,t[5]=u-y*c,t[9]=-o*l,t[2]=y-u*c,t[6]=p+f*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*h,f=l*d,p=c*h,y=c*d;t[0]=u+y*o,t[4]=p*o-f,t[8]=a*c,t[1]=a*d,t[5]=a*h,t[9]=-o,t[2]=f*o-p,t[6]=y+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*h,f=l*d,p=c*h,y=c*d;t[0]=u-y*o,t[4]=-a*d,t[8]=p+f*o,t[1]=f+p*o,t[5]=a*h,t[9]=y-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*h,f=a*d,p=o*h,y=o*d;t[0]=l*h,t[4]=p*c-f,t[8]=u*c+y,t[1]=l*d,t[5]=y*c+u,t[9]=f*c-p,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,f=a*c,p=o*l,y=o*c;t[0]=l*h,t[4]=y-u*d,t[8]=p*d+f,t[1]=d,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*d+p,t[10]=u-y*d}else if(e.order==="XZY"){const u=a*l,f=a*c,p=o*l,y=o*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=u*d+y,t[5]=a*h,t[9]=f*d-p,t[2]=p*d-f,t[6]=o*h,t[10]=y*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Fp,e,Op)}lookAt(e,t,n){const i=this.elements;return on.subVectors(e,t),on.lengthSq()===0&&(on.z=1),on.normalize(),bi.crossVectors(n,on),bi.lengthSq()===0&&(Math.abs(n.z)===1?on.x+=1e-4:on.z+=1e-4,on.normalize(),bi.crossVectors(n,on)),bi.normalize(),Dr.crossVectors(on,bi),i[0]=bi.x,i[4]=Dr.x,i[8]=on.x,i[1]=bi.y,i[5]=Dr.y,i[9]=on.y,i[2]=bi.z,i[6]=Dr.z,i[10]=on.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],p=n[2],y=n[6],m=n[10],g=n[14],_=n[3],v=n[7],M=n[11],S=n[15],b=i[0],x=i[4],E=i[8],w=i[12],R=i[1],I=i[5],N=i[9],O=i[13],L=i[2],k=i[6],U=i[10],P=i[14],H=i[3],B=i[7],q=i[11],Z=i[15];return r[0]=a*b+o*R+l*L+c*H,r[4]=a*x+o*I+l*k+c*B,r[8]=a*E+o*N+l*U+c*q,r[12]=a*w+o*O+l*P+c*Z,r[1]=h*b+d*R+u*L+f*H,r[5]=h*x+d*I+u*k+f*B,r[9]=h*E+d*N+u*U+f*q,r[13]=h*w+d*O+u*P+f*Z,r[2]=p*b+y*R+m*L+g*H,r[6]=p*x+y*I+m*k+g*B,r[10]=p*E+y*N+m*U+g*q,r[14]=p*w+y*O+m*P+g*Z,r[3]=_*b+v*R+M*L+S*H,r[7]=_*x+v*I+M*k+S*B,r[11]=_*E+v*N+M*U+S*q,r[15]=_*w+v*O+M*P+S*Z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],d=e[6],u=e[10],f=e[14],p=e[3],y=e[7],m=e[11],g=e[15],_=l*f-c*u,v=o*f-c*d,M=o*u-l*d,S=a*f-c*h,b=a*u-l*h,x=a*d-o*h;return t*(y*_-m*v+g*M)-n*(p*_-m*S+g*b)+i*(p*v-y*S+g*x)-r*(p*M-y*b+m*x)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+i*(r*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=e[9],u=e[10],f=e[11],p=e[12],y=e[13],m=e[14],g=e[15],_=t*o-n*a,v=t*l-i*a,M=t*c-r*a,S=n*l-i*o,b=n*c-r*o,x=i*c-r*l,E=h*y-d*p,w=h*m-u*p,R=h*g-f*p,I=d*m-u*y,N=d*g-f*y,O=u*g-f*m,L=_*O-v*N+M*I+S*R-b*w+x*E;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const k=1/L;return e[0]=(o*O-l*N+c*I)*k,e[1]=(i*N-n*O-r*I)*k,e[2]=(y*x-m*b+g*S)*k,e[3]=(u*b-d*x-f*S)*k,e[4]=(l*R-a*O-c*w)*k,e[5]=(t*O-i*R+r*w)*k,e[6]=(m*M-p*x-g*v)*k,e[7]=(h*x-u*M+f*v)*k,e[8]=(a*N-o*R+c*E)*k,e[9]=(n*R-t*N-r*E)*k,e[10]=(p*b-y*M+g*_)*k,e[11]=(d*M-h*b-f*_)*k,e[12]=(o*w-a*I-l*E)*k,e[13]=(t*I-n*w+i*E)*k,e[14]=(y*v-p*S-m*_)*k,e[15]=(h*S-d*v+u*_)*k,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,d=o+o,u=r*c,f=r*h,p=r*d,y=a*h,m=a*d,g=o*d,_=l*c,v=l*h,M=l*d,S=n.x,b=n.y,x=n.z;return i[0]=(1-(y+g))*S,i[1]=(f+M)*S,i[2]=(p-v)*S,i[3]=0,i[4]=(f-M)*b,i[5]=(1-(u+g))*b,i[6]=(m+_)*b,i[7]=0,i[8]=(p+v)*x,i[9]=(m-_)*x,i[10]=(1-(u+y))*x,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=rs.set(i[0],i[1],i[2]).length();const o=rs.set(i[4],i[5],i[6]).length(),l=rs.set(i[8],i[9],i[10]).length();r<0&&(a=-a),Mn.copy(this);const c=1/a,h=1/o,d=1/l;return Mn.elements[0]*=c,Mn.elements[1]*=c,Mn.elements[2]*=c,Mn.elements[4]*=h,Mn.elements[5]*=h,Mn.elements[6]*=h,Mn.elements[8]*=d,Mn.elements[9]*=d,Mn.elements[10]*=d,t.setFromRotationMatrix(Mn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,i,r,a,o=Pn,l=!1){const c=this.elements,h=2*r/(t-e),d=2*r/(n-i),u=(t+e)/(t-e),f=(n+i)/(n-i);let p,y;if(l)p=r/(a-r),y=a*r/(a-r);else if(o===Pn)p=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Mr)p=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=Pn,l=!1){const c=this.elements,h=2/(t-e),d=2/(n-i),u=-(t+e)/(t-e),f=-(n+i)/(n-i);let p,y;if(l)p=1/(a-r),y=a/(a-r);else if(o===Pn)p=-2/(a-r),y=-(a+r)/(a-r);else if(o===Mr)p=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Da.prototype.isMatrix4=!0;let We=Da;const rs=new G,Mn=new We,Fp=new G(0,0,0),Op=new G(1,1,1),bi=new G,Dr=new G,on=new G,eh=new We,th=new xi;class fi{constructor(e=0,t=0,n=0,i=fi.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],d=i[2],u=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(Je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Je(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Je(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Je(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Je(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Le("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return eh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(eh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return th.setFromEuler(this),this.setFromQuaternion(th,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}fi.DEFAULT_ORDER="XYZ";class ud{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let kp=0;const nh=new G,as=new xi,ei=new We,Ur=new G,Ws=new G,Bp=new G,zp=new xi,ih=new G(1,0,0),sh=new G(0,1,0),rh=new G(0,0,1),ah={type:"added"},Gp={type:"removed"},os={type:"childadded",child:null},to={type:"childremoved",child:null};class it extends ns{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kp++}),this.uuid=Jn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=it.DEFAULT_UP.clone();const e=new G,t=new fi,n=new xi,i=new G(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new We},normalMatrix:{value:new Oe}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=it.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=it.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ud,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return as.setFromAxisAngle(e,t),this.quaternion.multiply(as),this}rotateOnWorldAxis(e,t){return as.setFromAxisAngle(e,t),this.quaternion.premultiply(as),this}rotateX(e){return this.rotateOnAxis(ih,e)}rotateY(e){return this.rotateOnAxis(sh,e)}rotateZ(e){return this.rotateOnAxis(rh,e)}translateOnAxis(e,t){return nh.copy(e).applyQuaternion(this.quaternion),this.position.add(nh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ih,e)}translateY(e){return this.translateOnAxis(sh,e)}translateZ(e){return this.translateOnAxis(rh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ei.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ur.copy(e):Ur.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Ws.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ei.lookAt(Ws,Ur,this.up):ei.lookAt(Ur,Ws,this.up),this.quaternion.setFromRotationMatrix(ei),i&&(ei.extractRotation(i.matrixWorld),as.setFromRotationMatrix(ei),this.quaternion.premultiply(as.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ue("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ah),os.child=e,this.dispatchEvent(os),os.child=null):Ue("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Gp),to.child=e,this.dispatchEvent(to),to.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ei.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ei.multiply(e.parent.matrixWorld)),e.applyMatrix4(ei),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ah),os.child=e,this.dispatchEvent(os),os.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ws,e,Bp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ws,zp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,i=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),d=a(e.shapes),u=a(e.skeletons),f=a(e.animations),p=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}it.DEFAULT_UP=new G(0,1,0);it.DEFAULT_MATRIX_AUTO_UPDATE=!0;it.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Ln extends it{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Hp={type:"move"};class no{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ln,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ln,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ln,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const y of e.hand.values()){const m=t.getJointPose(y,n),g=this._getHandJoint(c,y);m!==null&&(g.matrix.fromArray(m.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=m.radius),g.visible=m!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,p=.005;c.inputState.pinching&&u>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Hp)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Ln;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const dd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ei={h:0,s:0,l:0},Fr={h:0,s:0,l:0};function io(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}class Ce{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ze.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=Ze.workingColorSpace){if(e=Yl(e,1),t=Je(t,0,1),n=Je(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=io(a,r,e+1/3),this.g=io(a,r,e),this.b=io(a,r,e-1/3)}return Ze.colorSpaceToWorking(this,i),this}setStyle(e,t=xt){function n(r){r!==void 0&&parseFloat(r)<1&&Le("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Le("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Le("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){const n=dd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Le("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=di(e.r),this.g=di(e.g),this.b=di(e.b),this}copyLinearToSRGB(e){return this.r=Cs(e.r),this.g=Cs(e.g),this.b=Cs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return Ze.workingToColorSpace(Zt.copy(this),e),Math.round(Je(Zt.r*255,0,255))*65536+Math.round(Je(Zt.g*255,0,255))*256+Math.round(Je(Zt.b*255,0,255))}getHexString(e=xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.workingToColorSpace(Zt.copy(this),t);const n=Zt.r,i=Zt.g,r=Zt.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(i-r)/d+(i<r?6:0);break;case i:l=(r-n)/d+2;break;case r:l=(n-i)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Ze.workingColorSpace){return Ze.workingToColorSpace(Zt.copy(this),t),e.r=Zt.r,e.g=Zt.g,e.b=Zt.b,e}getStyle(e=xt){Ze.workingToColorSpace(Zt.copy(this),e);const t=Zt.r,n=Zt.g,i=Zt.b;return e!==xt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ei),this.setHSL(Ei.h+e,Ei.s+t,Ei.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ei),e.getHSL(Fr);const n=ur(Ei.h,Fr.h,t),i=ur(Ei.s,Fr.s,t),r=ur(Ei.l,Fr.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Zt=new Ce;Ce.NAMES=dd;class Jl{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ce(e),this.density=t}clone(){return new Jl(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Ql extends it{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new fi,this.environmentIntensity=1,this.environmentRotation=new fi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Sn=new G,ti=new G,so=new G,ni=new G,ls=new G,cs=new G,oh=new G,ro=new G,ao=new G,oo=new G,lo=new ot,co=new ot,ho=new ot;class Rn{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Sn.subVectors(e,t),i.cross(Sn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Sn.subVectors(i,t),ti.subVectors(n,t),so.subVectors(e,t);const a=Sn.dot(Sn),o=Sn.dot(ti),l=Sn.dot(so),c=ti.dot(ti),h=ti.dot(so),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;const u=1/d,f=(c*l-o*h)*u,p=(a*h-o*l)*u;return r.set(1-f-p,p,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,ni)===null?!1:ni.x>=0&&ni.y>=0&&ni.x+ni.y<=1}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,ni)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ni.x),l.addScaledVector(a,ni.y),l.addScaledVector(o,ni.z),l)}static getInterpolatedAttribute(e,t,n,i,r,a){return lo.setScalar(0),co.setScalar(0),ho.setScalar(0),lo.fromBufferAttribute(e,t),co.fromBufferAttribute(e,n),ho.fromBufferAttribute(e,i),a.setScalar(0),a.addScaledVector(lo,r.x),a.addScaledVector(co,r.y),a.addScaledVector(ho,r.z),a}static isFrontFacing(e,t,n,i){return Sn.subVectors(n,t),ti.subVectors(e,t),Sn.cross(ti).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Sn.subVectors(this.c,this.b),ti.subVectors(this.a,this.b),Sn.cross(ti).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Rn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Rn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return Rn.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return Rn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Rn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let a,o;ls.subVectors(i,n),cs.subVectors(r,n),ro.subVectors(e,n);const l=ls.dot(ro),c=cs.dot(ro);if(l<=0&&c<=0)return t.copy(n);ao.subVectors(e,i);const h=ls.dot(ao),d=cs.dot(ao);if(h>=0&&d<=h)return t.copy(i);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),t.copy(n).addScaledVector(ls,a);oo.subVectors(e,r);const f=ls.dot(oo),p=cs.dot(oo);if(p>=0&&f<=p)return t.copy(r);const y=f*c-l*p;if(y<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(cs,o);const m=h*p-f*d;if(m<=0&&d-h>=0&&f-p>=0)return oh.subVectors(r,i),o=(d-h)/(d-h+(f-p)),t.copy(i).addScaledVector(oh,o);const g=1/(m+y+u);return a=y*g,o=u*g,t.copy(n).addScaledVector(ls,a).addScaledVector(cs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class _i{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(bn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(bn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=bn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,bn):bn.fromBufferAttribute(r,a),bn.applyMatrix4(e.matrixWorld),this.expandByPoint(bn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Or.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Or.copy(n.boundingBox)),Or.applyMatrix4(e.matrixWorld),this.union(Or)}const i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,bn),bn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Xs),kr.subVectors(this.max,Xs),hs.subVectors(e.a,Xs),us.subVectors(e.b,Xs),ds.subVectors(e.c,Xs),Ti.subVectors(us,hs),Ai.subVectors(ds,us),Wi.subVectors(hs,ds);let t=[0,-Ti.z,Ti.y,0,-Ai.z,Ai.y,0,-Wi.z,Wi.y,Ti.z,0,-Ti.x,Ai.z,0,-Ai.x,Wi.z,0,-Wi.x,-Ti.y,Ti.x,0,-Ai.y,Ai.x,0,-Wi.y,Wi.x,0];return!uo(t,hs,us,ds,kr)||(t=[1,0,0,0,1,0,0,0,1],!uo(t,hs,us,ds,kr))?!1:(Br.crossVectors(Ti,Ai),t=[Br.x,Br.y,Br.z],uo(t,hs,us,ds,kr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,bn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(bn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ii[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ii[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ii[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ii[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ii[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ii[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ii[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ii[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ii),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const ii=[new G,new G,new G,new G,new G,new G,new G,new G],bn=new G,Or=new _i,hs=new G,us=new G,ds=new G,Ti=new G,Ai=new G,Wi=new G,Xs=new G,kr=new G,Br=new G,Xi=new G;function uo(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Xi.fromArray(s,r);const o=i.x*Math.abs(Xi.x)+i.y*Math.abs(Xi.y)+i.z*Math.abs(Xi.z),l=e.dot(Xi),c=t.dot(Xi),h=n.dot(Xi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Ct=new G,zr=new ke;let Vp=0;class qt extends ns{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Vp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=od,this.updateRanges=[],this.gpuType=xn,this.version=0,this._normalizationScale=e!==void 0?Ua(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)zr.fromBufferAttribute(this,t),zr.applyMatrix3(e),this.setXY(t,zr.x,zr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):$l(e,this.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):Kl(e,this.array)}}class fd extends qt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class pd extends qt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class St extends qt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const Wp=new _i,qs=new G,fo=new G;class Qn{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Wp.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;qs.subVectors(e,this.center);const t=qs.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(qs,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(fo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(qs.copy(e.center).add(fo)),this.expandByPoint(qs.copy(e.center).sub(fo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Xp=0;const mn=new We,po=new it,fs=new G,ln=new _i,Ys=new _i,Vt=new G;class Bt extends ns{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xp++}),this.uuid=Jn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(hp(e)?pd:fd)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Oe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return mn.makeRotationFromQuaternion(e),this.applyMatrix4(mn),this}rotateX(e){return mn.makeRotationX(e),this.applyMatrix4(mn),this}rotateY(e){return mn.makeRotationY(e),this.applyMatrix4(mn),this}rotateZ(e){return mn.makeRotationZ(e),this.applyMatrix4(mn),this}translate(e,t,n){return mn.makeTranslation(e,t,n),this.applyMatrix4(mn),this}scale(e,t,n){return mn.makeScale(e,t,n),this.applyMatrix4(mn),this}lookAt(e){return po.lookAt(e),po.updateMatrix(),this.applyMatrix4(po.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(fs).negate(),this.translate(fs.x,fs.y,fs.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let i=0,r=e.length;i<r;i++){const a=e[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new St(n,3))}else{const n=Math.min(e.length,t.count);for(let i=0;i<n;i++){const r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&Le("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _i);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ue("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];ln.setFromBufferAttribute(r),this.morphTargetsRelative?(Vt.addVectors(this.boundingBox.min,ln.min),this.boundingBox.expandByPoint(Vt),Vt.addVectors(this.boundingBox.max,ln.max),this.boundingBox.expandByPoint(Vt)):(this.boundingBox.expandByPoint(ln.min),this.boundingBox.expandByPoint(ln.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ue('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ue("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new G,1/0);return}if(e){const n=this.boundingSphere.center;if(ln.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];Ys.setFromBufferAttribute(o),this.morphTargetsRelative?(Vt.addVectors(ln.min,Ys.min),ln.expandByPoint(Vt),Vt.addVectors(ln.max,Ys.max),ln.expandByPoint(Vt)):(ln.expandByPoint(Ys.min),ln.expandByPoint(Ys.max))}ln.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)Vt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Vt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Vt.fromBufferAttribute(o,c),l&&(fs.fromBufferAttribute(e,c),Vt.add(fs)),i=Math.max(i,n.distanceToSquared(Vt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Ue('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ue("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,i=t.normal,r=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new qt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[],c=new Uint8Array(n.count);for(let w=0;w<n.count;w++)o[w]=new G,l[w]=new G;const h=new G,d=new G,u=new G,f=new ke,p=new ke,y=new ke,m=new G,g=new G;function _(w,R,I){c[w]=c[R]=c[I]=1,h.fromBufferAttribute(n,w),d.fromBufferAttribute(n,R),u.fromBufferAttribute(n,I),f.fromBufferAttribute(r,w),p.fromBufferAttribute(r,R),y.fromBufferAttribute(r,I),d.sub(h),u.sub(h),p.sub(f),y.sub(f);const N=1/(p.x*y.y-y.x*p.y);isFinite(N)&&(m.copy(d).multiplyScalar(y.y).addScaledVector(u,-p.y).multiplyScalar(N),g.copy(u).multiplyScalar(p.x).addScaledVector(d,-y.x).multiplyScalar(N),o[w].add(m),o[R].add(m),o[I].add(m),l[w].add(g),l[R].add(g),l[I].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let w=0,R=v.length;w<R;++w){const I=v[w],N=I.start,O=I.count;for(let L=N,k=N+O;L<k;L+=3)_(e.getX(L+0),e.getX(L+1),e.getX(L+2))}const M=new G,S=new G,b=new G,x=new G;function E(w){b.fromBufferAttribute(i,w),x.copy(b);const R=o[w];M.copy(R),M.sub(b.multiplyScalar(b.dot(R))).normalize(),S.crossVectors(x,R);const N=S.dot(l[w])<0?-1:1;a.setXYZW(w,M.x,M.y,M.z,N)}for(let w=0,R=n.count;w<R;++w)c[w]&&E(w);this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new qt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const i=new G,r=new G,a=new G,o=new G,l=new G,c=new G,h=new G,d=new G;if(e)for(let u=0,f=e.count;u<f;u+=3){const p=e.getX(u+0),y=e.getX(u+1),m=e.getX(u+2);i.fromBufferAttribute(t,p),r.fromBufferAttribute(t,y),a.fromBufferAttribute(t,m),h.subVectors(a,r),d.subVectors(i,r),h.cross(d),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,f=t.count;u<f;u+=3)i.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,r),d.subVectors(i,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Vt.fromBufferAttribute(e,t),Vt.normalize(),e.setXYZ(t,Vt.x,Vt.y,Vt.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h);let f=0,p=0;for(let y=0,m=l.length;y<m;y++){o.isInterleavedBufferAttribute?f=l[y]*o.data.stride+o.offset:f=l[y]*h;for(let g=0;g<h;g++)u[p++]=c[f++]}return new qt(u,h,d)}if(this.index===null)return Le("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Bt,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=e(l,n);t.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){const u=c[h],f=e(u,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d];h.push(f.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const i=e.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(t))}const r=e.morphAttributes;for(const c in r){const h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class qp{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=od,this.updateRanges=[],this.version=0,this.uuid=Jn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});const t=lh(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);const n=new this.array.constructor(e.arrayBuffers[t]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});const t=lh(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));const n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}}function lh(s){return s.buffer._uuid===void 0&&(s.buffer._uuid=Jn()),s.byteOffset===0&&s.byteLength===s.buffer.byteLength?s.buffer._uuid:s.buffer._uuid+":"+s.byteOffset+":"+s.byteLength}const Qt=new G;class jl{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i,this._normalizationScale=e!==void 0?Ua(e.array):void 0}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.applyMatrix4(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.applyNormalMatrix(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.transformDirection(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){Ra("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new qt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new jl(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Ra("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):$l(e,this.data.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):Kl(e,this.data.array)}}const mo=new G,Yp=new G,$p=new Oe;class Pi{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=mo.subVectors(n,t).cross(Yp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const i=e.delta(mo),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||$p.getNormalMatrix(e),i=this.coplanarPoint(mo).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Kp=0;class Nn extends ns{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Kp++}),this.uuid=Jn(),this.name="",this.type="Material",this.blending=cr,this.side=Fi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=zu,this.blendDst=Gu,this.blendEquation=Ss,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ce(0,0,0),this.blendAlpha=0,this.depthFunc=mr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=sp,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Za,this.stencilZFail=Za,this.stencilZPass=Za,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Le(`Material: parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){Le(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(t){const r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ce().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Pi().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ke().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ke().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const si=new G,go=new G,Gr=new G,Hr=new G;class Fa{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(si.copy(this.origin).addScaledVector(this.direction,t),si.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){go.copy(e).add(t).multiplyScalar(.5),Gr.copy(t).sub(e).normalize(),Hr.copy(this.origin).sub(go);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Gr),o=Hr.dot(this.direction),l=-Hr.dot(Gr),c=Hr.lengthSq(),h=Math.abs(1-a*a);let d,u,f,p;if(h>0)if(d=a*l-o,u=a*o-l,p=r*h,d>=0)if(u>=-p)if(u<=p){const y=1/h;d*=y,u*=y,f=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-p?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=p?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(go).addScaledVector(Gr,u),f}intersectSphere(e,t){if(e.radius<0)return null;si.subVectors(e.center,this.origin);const n=si.dot(this.direction),i=si.dot(si)-n*n,r=e.radius*e.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(e.min.x-u.x)*c,i=(e.max.x-u.x)*c):(n=(e.max.x-u.x)*c,i=(e.min.x-u.x)*c),h>=0?(r=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),d>=0?(o=(e.min.z-u.z)*d,l=(e.max.z-u.z)*d):(o=(e.max.z-u.z)*d,l=(e.min.z-u.z)*d),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,si)!==null}intersectTriangle(e,t,n,i,r){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,d=e.x-a.x,u=e.y-a.y,f=e.z-a.z,p=t.x-a.x,y=t.y-a.y,m=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,M=Math.abs(l),S=Math.abs(c),b=Math.abs(h);let x,E,w,R,I,N,O,L,k,U,P,H;if(M>=S&&M>=b?(w=l,N=d,k=p,H=g,l>=0?(x=c,E=h,R=u,I=f,O=y,L=m,U=_,P=v):(x=h,E=c,R=f,I=u,O=m,L=y,U=v,P=_)):S>=b?(w=c,N=u,k=y,H=_,c>=0?(x=h,E=l,R=f,I=d,O=m,L=p,U=v,P=g):(x=l,E=h,R=d,I=f,O=p,L=m,U=g,P=v)):(w=h,N=f,k=m,H=v,h>=0?(x=l,E=c,R=d,I=u,O=p,L=y,U=g,P=_):(x=c,E=l,R=u,I=d,O=y,L=p,U=_,P=g)),w===0)return null;const B=x/w,q=E/w,Z=1/w,ae=R-B*N,Se=I-q*N,$=O-B*k,ie=L-q*k,Me=U-B*H,we=P-q*H,fe=Me*ie-we*$,te=ae*we-Se*Me,ye=$*Se-ie*ae;if(i){if(fe<0||te<0||ye<0)return null}else if((fe<0||te<0||ye<0)&&(fe>0||te>0||ye>0))return null;const ue=fe+te+ye;if(ue===0)return null;const $e=Z*(fe*N+te*k+ye*H);return(ue>0?$e<0:$e>0)?null:this.at($e/ue,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Yn extends Nn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ce(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fi,this.combine=kl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ch=new We,qi=new Fa,Vr=new Qn,hh=new G,Wr=new G,Xr=new G,qr=new G,xo=new G,Yr=new G,uh=new G,$r=new G;class Dt extends it{constructor(e=new Bt,t=new Yn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(r&&o){Yr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],d=r[l];h!==0&&(xo.fromBufferAttribute(d,e),a?Yr.addScaledVector(xo,h):Yr.addScaledVector(xo.sub(t),h))}t.add(Yr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Vr.copy(n.boundingSphere),Vr.applyMatrix4(r),qi.copy(e.ray).recast(e.near),!(Vr.containsPoint(qi.origin)===!1&&(qi.intersectSphere(Vr,hh)===null||qi.origin.distanceToSquared(hh)>(e.far-e.near)**2))&&(ch.copy(r).invert(),qi.copy(e.ray).applyMatrix4(ch),!(n.boundingBox!==null&&qi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,qi)))}_computeIntersections(e,t,n){let i;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,y=u.length;p<y;p++){const m=u[p],g=a[m.materialIndex],_=Math.max(m.start,f.start),v=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let M=_,S=v;M<S;M+=3){const b=o.getX(M),x=o.getX(M+1),E=o.getX(M+2);i=Kr(this,g,e,n,c,h,d,b,x,E),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let m=p,g=y;m<g;m+=3){const _=o.getX(m),v=o.getX(m+1),M=o.getX(m+2);i=Kr(this,a,e,n,c,h,d,_,v,M),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,y=u.length;p<y;p++){const m=u[p],g=a[m.materialIndex],_=Math.max(m.start,f.start),v=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=_,S=v;M<S;M+=3){const b=M,x=M+1,E=M+2;i=Kr(this,g,e,n,c,h,d,b,x,E),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let m=p,g=y;m<g;m+=3){const _=m,v=m+1,M=m+2;i=Kr(this,a,e,n,c,h,d,_,v,M),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}}}function Zp(s,e,t,n,i,r,a,o){let l;if(e.side===tn?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,e.side===Fi,o),l===null)return null;$r.copy(o),$r.applyMatrix4(s.matrixWorld);const c=t.ray.origin.distanceTo($r);return c<t.near||c>t.far?null:{distance:c,point:$r.clone(),object:s}}function Kr(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,Wr),s.getVertexPosition(l,Xr),s.getVertexPosition(c,qr);const h=Zp(s,e,t,n,Wr,Xr,qr,uh);if(h){const d=new G;Rn.getBarycoord(uh,Wr,Xr,qr,d),i&&(h.uv=Rn.getInterpolatedAttribute(i,o,l,c,d,new ke)),r&&(h.uv1=Rn.getInterpolatedAttribute(r,o,l,c,d,new ke)),a&&(h.normal=Rn.getInterpolatedAttribute(a,o,l,c,d,new G),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new G,materialIndex:0};Rn.getNormal(Wr,Xr,qr,u.normal),h.face=u,h.barycoord=d}return h}const $s=new ot,dh=new ot,fh=new ot,Jp=new ot,ph=new We,Zr=new G,_o=new Qn,mh=new We,vo=new Fa;class Qp extends Dt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Vc,this.bindMatrix=new We,this.bindMatrixInverse=new We,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new _i),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Zr),this.boundingBox.expandByPoint(Zr)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Qn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Zr),this.boundingSphere.expandByPoint(Zr)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}raycast(e,t){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),_o.copy(this.boundingSphere),_o.applyMatrix4(i),e.ray.intersectsSphere(_o)!==!1&&(mh.copy(i).invert(),vo.copy(e.ray).applyMatrix4(mh),!(this.boundingBox!==null&&vo.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,vo)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new ot,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Vc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===jf?this.bindMatrixInverse.copy(this.bindMatrix).invert():Le("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,i=this.geometry;dh.fromBufferAttribute(i.attributes.skinIndex,e),fh.fromBufferAttribute(i.attributes.skinWeight,e),t.isVector4?($s.copy(t),t.set(0,0,0,0)):($s.set(t.x,t.y,t.z,1),t.set(0,0,0)),$s.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){const a=fh.getComponent(r);if(a!==0){const o=dh.getComponent(r);ph.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(Jp.copy($s).applyMatrix4(ph),a)}}return t.isVector4&&(t.w=$s.w),t.applyMatrix4(this.bindMatrixInverse)}}class md extends it{constructor(){super(),this.isBone=!0,this.type="Bone"}}class ec extends Nt{constructor(e=null,t=1,n=1,i,r,a,o,l,c=_t,h=_t,d,u){super(null,a,o,l,c,h,i,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const gh=new We,jp=new We;class tc{constructor(e=[],t=[]){this.uuid=Jn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.previousBoneMatrices=null,this.boneTexture=null,this.previousBoneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Le("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new We)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new We;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=e.length;r<a;r++){const o=e[r]?e[r].matrixWorld:jp;gh.multiplyMatrices(o,t[r]),gh.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new tc(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new ec(t,e,e,Cn,xn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null),this.previousBoneTexture!==null&&(this.previousBoneTexture.dispose(),this.previousBoneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){const r=e.bones[n];let a=t[r];a===void 0&&(Le("Skeleton: No bone found with UUID:",r),a=new md),this.bones.push(a),this.boneInverses.push(new We().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){const a=t[i];e.bones.push(a.uuid);const o=n[i];e.boneInverses.push(o.toArray())}return e}}class Ds extends qt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const ps=new We,xh=new We,Jr=[],_h=new _i,em=new We,Ks=new Dt,Zs=new Qn;class an extends Dt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ds(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,em)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new _i),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ps),_h.copy(e.boundingBox).applyMatrix4(ps),this.boundingBox.union(_h)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Qn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ps),Zs.copy(e.boundingSphere).applyMatrix4(ps),this.boundingSphere.union(Zs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture!==null?e.morphTexture.clone():null,this.instanceColor=e.instanceColor!==null?e.instanceColor.clone():null,this.count=e.count,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(e,t){const n=this.matrixWorld,i=this.count;if(Ks.geometry=this.geometry,Ks.material=this.material,Ks.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Zs.copy(this.boundingSphere),Zs.applyMatrix4(n),e.ray.intersectsSphere(Zs)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,ps),xh.multiplyMatrices(n,ps),Ks.matrixWorld=xh,Ks.raycast(e,Jr);for(let a=0,o=Jr.length;a<o;a++){const l=Jr[a];l.instanceId=r,l.object=this,t.push(l)}Jr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ds(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new ec(new Float32Array(i*this.count),i,this.count,Vl,xn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Yi=new Qn,tm=new ke(.5,.5),Qr=new G;class br{constructor(e=new Pi,t=new Pi,n=new Pi,i=new Pi,r=new Pi,a=new Pi){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Pn,n=!1){const i=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],d=r[5],u=r[6],f=r[7],p=r[8],y=r[9],m=r[10],g=r[11],_=r[12],v=r[13],M=r[14],S=r[15];if(i[0].setComponents(c-a,f-h,g-p,S-_).normalize(),i[1].setComponents(c+a,f+h,g+p,S+_).normalize(),i[2].setComponents(c+o,f+d,g+y,S+v).normalize(),i[3].setComponents(c-o,f-d,g-y,S-v).normalize(),n)i[4].setComponents(l,u,m,M).normalize(),i[5].setComponents(c-l,f-u,g-m,S-M).normalize();else if(i[4].setComponents(c-l,f-u,g-m,S-M).normalize(),t===Pn)i[5].setComponents(c+l,f+u,g+m,S+M).normalize();else if(t===Mr)i[5].setComponents(l,u,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yi)}intersectsSprite(e){Yi.center.set(0,0,0);const t=tm.distanceTo(e.center);return Yi.radius=.7071067811865476+t,Yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yi)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(Qr.x=i.normal.x>0?e.max.x:e.min.x,Qr.y=i.normal.y>0?e.max.y:e.min.y,Qr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Qr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const vh=new We;class nc{constructor(){this.coordinateSystem=Pn,this._frustums=[],this._count=0}setFromArrayCamera(e){const t=e.cameras,n=this._frustums;for(let i=0;i<t.length;i++){const r=t[i];vh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[i]===void 0&&(n[i]=new br),n[i].setFromProjectionMatrix(vh,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;const t=this._frustums,n=e._frustums;for(let i=0;i<e._count;i++)t[i]===void 0&&(t[i]=new br),t[i].copy(n[i]);return this._count=e._count,this}clone(){return new nc().copy(this)}}class gd extends Nn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ce(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Ca=new G,Pa=new G,yh=new We,Js=new Fa,jr=new Qn,yo=new G,Mh=new G;class ic extends it{constructor(e=new Bt,t=new gd){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)Ca.fromBufferAttribute(t,i-1),Pa.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=Ca.distanceTo(Pa);e.setAttribute("lineDistance",new St(n,1))}else Le("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),jr.copy(n.boundingSphere),jr.applyMatrix4(i),jr.radius+=r,e.ray.intersectsSphere(jr)===!1)return;yh.copy(i).invert(),Js.copy(e.ray).applyMatrix4(yh);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let y=f,m=p-1;y<m;y+=c){const g=h.getX(y),_=h.getX(y+1),v=ea(this,e,Js,l,g,_,y);v&&t.push(v)}if(this.isLineLoop){const y=h.getX(p-1),m=h.getX(f),g=ea(this,e,Js,l,y,m,p-1);g&&t.push(g)}}else{const f=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let y=f,m=p-1;y<m;y+=c){const g=ea(this,e,Js,l,y,y+1,y);g&&t.push(g)}if(this.isLineLoop){const y=ea(this,e,Js,l,p-1,f,p-1);y&&t.push(y)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ea(s,e,t,n,i,r,a){const o=s.geometry.attributes.position;if(Ca.fromBufferAttribute(o,i),Pa.fromBufferAttribute(o,r),t.distanceSqToSegment(Ca,Pa,yo,Mh)>n)return;yo.applyMatrix4(s.matrixWorld);const c=e.ray.origin.distanceTo(yo);if(!(c<e.near||c>e.far))return{distance:c,point:Mh.clone().applyMatrix4(s.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:s}}const Sh=new G,bh=new G;class nm extends ic{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)Sh.fromBufferAttribute(t,i),bh.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Sh.distanceTo(bh);e.setAttribute("lineDistance",new St(n,1))}else Le("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class im extends ic{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class xd extends Nn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ce(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Eh=new We,Tl=new Fa,ta=new Qn,na=new G;class sm extends it{constructor(e=new Bt,t=new xd){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ta.copy(n.boundingSphere),ta.applyMatrix4(i),ta.radius+=r,e.ray.intersectsSphere(ta)===!1)return;Eh.copy(i).invert(),Tl.copy(e.ray).applyMatrix4(Eh);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const u=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=u,y=f;p<y;p++){const m=c.getX(p);na.fromBufferAttribute(d,m),Th(na,m,l,i,e,t,this)}}else{const u=Math.max(0,a.start),f=Math.min(d.count,a.start+a.count);for(let p=u,y=f;p<y;p++)na.fromBufferAttribute(d,p),Th(na,p,l,i,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Th(s,e,t,n,i,r,a){const o=Tl.distanceSqToPoint(s);if(o<t){const l=new G;Tl.closestPointToPoint(s,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class _d extends Nt{constructor(e=[],t=Ls,n,i,r,a,o,l,c,h){super(e,t,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class zi extends Nt{constructor(e,t,n,i,r,a,o,l,c){super(e,t,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Us extends Nt{constructor(e,t,n=Zn,i,r,a,o=_t,l=_t,c,h=ki,d=1){if(h!==ki&&h!==Di)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:d};super(u,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Zl(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class vd extends Us{constructor(e,t=Zn,n=Ls,i,r,a=_t,o=_t,l,c=ki){const h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,n,i,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class yd extends Nt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class is extends Bt{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],d=[];let u=0,f=0;p("z","y","x",-1,-1,n,t,e,a,r,0),p("z","y","x",1,-1,n,t,-e,a,r,1),p("x","z","y",1,1,e,n,t,i,a,2),p("x","z","y",1,-1,e,n,-t,i,a,3),p("x","y","z",1,-1,e,t,n,i,r,4),p("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new St(c,3)),this.setAttribute("normal",new St(h,3)),this.setAttribute("uv",new St(d,2));function p(y,m,g,_,v,M,S,b,x,E,w){const R=M/x,I=S/E,N=M/2,O=S/2,L=b/2,k=x+1,U=E+1;let P=0,H=0;const B=new G;for(let q=0;q<U;q++){const Z=q*I-O;for(let ae=0;ae<k;ae++){const Se=ae*R-N;B[y]=Se*_,B[m]=Z*v,B[g]=L,c.push(B.x,B.y,B.z),B[y]=0,B[m]=0,B[g]=b>0?1:-1,h.push(B.x,B.y,B.z),d.push(ae/x),d.push(1-q/E),P+=1}}for(let q=0;q<E;q++)for(let Z=0;Z<x;Z++){const ae=u+Z+k*q,Se=u+Z+k*(q+1),$=u+(Z+1)+k*(q+1),ie=u+(Z+1)+k*q;l.push(ae,Se,ie),l.push(Se,$,ie),H+=6}o.addGroup(f,H,w),f+=H,u+=P}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new is(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class La extends Bt{constructor(e=1,t=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),r=Math.floor(r);const h=[],d=[],u=[],f=[];let p=0;const y=[],m=n/2;let g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new St(d,3)),this.setAttribute("normal",new St(u,3)),this.setAttribute("uv",new St(f,2));function _(){const M=new G,S=new G;let b=0;const x=(t-e)/n;for(let E=0;E<=r;E++){const w=[],R=E/r,I=R*(t-e)+e;for(let N=0;N<=i;N++){const O=N/i,L=O*l+o,k=Math.sin(L),U=Math.cos(L);S.x=I*k,S.y=-R*n+m,S.z=I*U,d.push(S.x,S.y,S.z),M.set(k,x,U).normalize(),u.push(M.x,M.y,M.z),f.push(O,1-R),w.push(p++)}y.push(w)}for(let E=0;E<i;E++)for(let w=0;w<r;w++){const R=y[w][E],I=y[w+1][E],N=y[w+1][E+1],O=y[w][E+1];(e>0||w!==0)&&(h.push(R,I,O),b+=3),(t>0||w!==r-1)&&(h.push(I,N,O),b+=3)}c.addGroup(g,b,0),g+=b}function v(M){const S=p,b=new ke,x=new G;let E=0;const w=M===!0?e:t,R=M===!0?1:-1;for(let N=1;N<=i;N++)d.push(0,m*R,0),u.push(0,R,0),f.push(.5,.5),p++;const I=p;for(let N=0;N<=i;N++){const L=N/i*l+o,k=Math.cos(L),U=Math.sin(L);x.x=w*U,x.y=m*R,x.z=w*k,d.push(x.x,x.y,x.z),u.push(0,R,0),b.x=k*.5+.5,b.y=U*.5*R+.5,f.push(b.x,b.y),p++}for(let N=0;N<i;N++){const O=S+N,L=I+N;M===!0?h.push(L,L+1,O):h.push(L+1,L,O),E+=3}c.addGroup(g,E,M===!0?1:2),g+=E}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new La(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Oa extends Bt{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};const r=[],a=[];o(i),c(n),h(),this.setAttribute("position",new St(r,3)),this.setAttribute("normal",new St(r.slice(),3)),this.setAttribute("uv",new St(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(_){const v=new G,M=new G,S=new G;for(let b=0;b<t.length;b+=3)f(t[b+0],v),f(t[b+1],M),f(t[b+2],S),l(v,M,S,_)}function l(_,v,M,S){const b=S+1,x=[];for(let E=0;E<=b;E++){x[E]=[];const w=_.clone().lerp(M,E/b),R=v.clone().lerp(M,E/b),I=b-E;for(let N=0;N<=I;N++)N===0&&E===b?x[E][N]=w:x[E][N]=w.clone().lerp(R,N/I)}for(let E=0;E<b;E++)for(let w=0;w<2*(b-E)-1;w++){const R=Math.floor(w/2);w%2===0?(u(x[E][R+1]),u(x[E+1][R]),u(x[E][R])):(u(x[E][R+1]),u(x[E+1][R+1]),u(x[E+1][R]))}}function c(_){const v=new G;for(let M=0;M<r.length;M+=3)v.x=r[M+0],v.y=r[M+1],v.z=r[M+2],v.normalize().multiplyScalar(_),r[M+0]=v.x,r[M+1]=v.y,r[M+2]=v.z}function h(){const _=new G;for(let v=0;v<r.length;v+=3){_.x=r[v+0],_.y=r[v+1],_.z=r[v+2];const M=m(_)/2/Math.PI+.5,S=g(_)/Math.PI+.5;a.push(M,1-S)}p(),d()}function d(){for(let _=0;_<a.length;_+=6){const v=a[_+0],M=a[_+2],S=a[_+4],b=Math.max(v,M,S),x=Math.min(v,M,S);b>.9&&x<.1&&(v<.2&&(a[_+0]+=1),M<.2&&(a[_+2]+=1),S<.2&&(a[_+4]+=1))}}function u(_){r.push(_.x,_.y,_.z)}function f(_,v){const M=_*3;v.x=e[M+0],v.y=e[M+1],v.z=e[M+2]}function p(){const _=new G,v=new G,M=new G,S=new G,b=new ke,x=new ke,E=new ke;for(let w=0,R=0;w<r.length;w+=9,R+=6){_.set(r[w+0],r[w+1],r[w+2]),v.set(r[w+3],r[w+4],r[w+5]),M.set(r[w+6],r[w+7],r[w+8]),b.set(a[R+0],a[R+1]),x.set(a[R+2],a[R+3]),E.set(a[R+4],a[R+5]),S.copy(_).add(v).add(M).divideScalar(3);const I=m(S);y(b,R+0,_,I),y(x,R+2,v,I),y(E,R+4,M,I)}}function y(_,v,M,S){S<0&&_.x===1&&(a[v]=_.x-1),M.x===0&&M.z===0&&(a[v]=S/2/Math.PI+.5)}function m(_){return Math.atan2(_.z,-_.x)}function g(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Oa(e.vertices,e.indices,e.radius,e.detail)}}class sc extends Oa{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new sc(e.radius,e.detail)}}class rc extends Oa{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new rc(e.radius,e.detail)}}class nn extends Bt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,d=e/o,u=t/l,f=[],p=[],y=[],m=[];for(let g=0;g<h;g++){const _=g*u-a;for(let v=0;v<c;v++){const M=v*d-r;p.push(M,-_,0),y.push(0,0,1),m.push(v/o),m.push(1-g/l)}}for(let g=0;g<l;g++)for(let _=0;_<o;_++){const v=_+c*g,M=_+c*(g+1),S=_+1+c*(g+1),b=_+1+c*g;f.push(v,M,b),f.push(M,S,b)}this.setIndex(f),this.setAttribute("position",new St(p,3)),this.setAttribute("normal",new St(y,3)),this.setAttribute("uv",new St(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new nn(e.width,e.height,e.widthSegments,e.heightSegments)}}class ac extends Bt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],d=new G,u=new G,f=[],p=[],y=[],m=[];for(let g=0;g<=n;g++){const _=[],v=g/n,M=a+v*o,S=e*Math.cos(M),b=Math.sqrt(e*e-S*S);let x=0;g===0&&a===0?x=.5/t:g===n&&l===Math.PI&&(x=-.5/t);for(let E=0;E<=t;E++){const w=E/t,R=i+w*r;d.x=-b*Math.cos(R),d.y=S,d.z=b*Math.sin(R),p.push(d.x,d.y,d.z),u.copy(d).normalize(),y.push(u.x,u.y,u.z),m.push(w+x,1-v),_.push(c++)}h.push(_)}for(let g=0;g<n;g++)for(let _=0;_<t;_++){const v=h[g][_+1],M=h[g][_],S=h[g+1][_],b=h[g+1][_+1];(g!==0||a>0)&&f.push(v,M,b),(g!==n-1||l<Math.PI)&&f.push(M,S,b)}this.setIndex(f),this.setAttribute("position",new St(p,3)),this.setAttribute("normal",new St(y,3)),this.setAttribute("uv",new St(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ac(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}function Fs(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];if(Ah(i))i.isRenderTargetTexture?(Le("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone();else if(Array.isArray(i))if(Ah(i[0])){const r=[];for(let a=0,o=i.length;a<o;a++)r[a]=i[a].clone();e[t][n]=r}else e[t][n]=i.slice();else e[t][n]=i}}return e}function jt(s){const e={};for(let t=0;t<s.length;t++){const n=Fs(s[t]);for(const i in n)e[i]=n[i]}return e}function Ah(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function rm(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Md(s){const e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}const am={clone:Fs,merge:jt};var om=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,lm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class vn extends Nn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=om,this.fragmentShader=lm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Fs(e.uniforms),this.uniformsGroups=rm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new Ce().setHex(i.value);break;case"v2":this.uniforms[n].value=new ke().fromArray(i.value);break;case"v3":this.uniforms[n].value=new G().fromArray(i.value);break;case"v4":this.uniforms[n].value=new ot().fromArray(i.value);break;case"m3":this.uniforms[n].value=new Oe().fromArray(i.value);break;case"m4":this.uniforms[n].value=new We().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class cm extends vn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class vi extends Nn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ce(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ce(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Aa,this.normalScale=new ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Un extends vi{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ke(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Je(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new Ce(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ce(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ce(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(e){this._diffuseRoughness>0!=e>0&&this.version++,this._diffuseRoughness=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}get iridescenceThicknessRange(){return Rs('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(e){Rs('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),this.iridescenceThicknessMinimum=e[0],this.iridescenceThicknessMaximum=e[1]}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.diffuseRoughness=e.diffuseRoughness,this.diffuseRoughnessMap=e.diffuseRoughnessMap,this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum,this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class ka extends Nn{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ce(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ce(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Aa,this.normalScale=new ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fi,this.combine=kl,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class oc extends Nn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=np,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class hm extends Nn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Li(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function ar(s){return s!==void 0&&s.inTangents!==void 0&&s.outTangents!==void 0}function um(s){function e(i,r){return s[i]-s[r]}const t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function wh(s,e,t){const n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){const o=t[r]*e;for(let l=0;l!==e;++l)i[a++]=s[o+l]}return i}function dm(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push(...a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=s[i++];while(r!==void 0)}class ks{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break t}if(!(e>=r)){const o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){const o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class fm extends ks{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Xc,endingEnd:Xc}}intervalChanged_(e,t,n){const i=this.parameterPositions;let r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case qc:r=e,o=2*t-n;break;case Yc:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case qc:a=e,l=2*n-t;break;case Yc:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}const c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,p=(n-t)/(i-t),y=p*p,m=y*p,g=-u*m+2*u*y-u*p,_=(1+u)*m+(-1.5-2*u)*y+(-.5+u)*p+1,v=(-1-f)*m+(1.5+f)*y+.5*p,M=f*m-f*y;for(let S=0;S!==o;++S)r[S]=g*a[h+S]+_*a[c+S]+v*a[l+S]+M*a[d+S];return r}}class pm extends ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),d=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*d+a[l+u]*h;return r}}class mm extends ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class gm extends ks{interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,d=this.outTangents;if(!h||!d){const p=(n-t)/(i-t),y=1-p;for(let m=0;m!==o;++m)r[m]=a[c+m]*y+a[l+m]*p;return r}const u=o*2,f=e-1;for(let p=0;p!==o;++p){const y=a[c+p],m=a[l+p],g=f*u+p*2,_=d[g],v=d[g+1],M=e*u+p*2,S=h[M],b=h[M+1],x=_m(n,t,_,S,i);r[p]=Sd(x,y,v,b,m)}return r}}function Sd(s,e,t,n,i){const r=1-s;return r*r*r*e+3*r*r*s*t+3*r*s*s*n+s*s*s*i}function xm(s,e,t,n,i){const r=1-s;return 3*r*r*(t-e)+6*r*s*(n-t)+3*s*s*(i-n)}function _m(s,e,t,n,i){let r=(s-e)/(i-e);for(let a=0;a<8;a++){const o=Sd(r,e,t,n,i)-s;if(Math.abs(o)<1e-10)break;const l=xm(r,e,t,n,i);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}class Fn{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Li(t,this.TimeBufferType),this.values=Li(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Li(e.times,Array),values:Li(e.values,Array)};const i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i),ar(e.settings)&&(n.settings={inTangents:Li(e.settings.inTangents,Array),outTangents:Li(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new mm(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new pm(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new fm(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){const t=new gm(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case _r:t=this.InterpolantFactoryMethodDiscrete;break;case vr:t=this.InterpolantFactoryMethodLinear;break;case Ka:t=this.InterpolantFactoryMethodSmooth;break;case Wc:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Le("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return _r;case this.InterpolantFactoryMethodLinear:return vr;case this.InterpolantFactoryMethodSmooth:return Ka;case this.InterpolantFactoryMethodBezier:return Wc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e;ar(this.settings)&&(Rh(this.settings.inTangents,e),Rh(this.settings.outTangents,e))}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e;ar(this.settings)&&(Ch(this.settings.inTangents,e),Ch(this.settings.outTangents,e))}return this}trim(e,t){const n=this.times,i=n.length;let r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);const o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(Ue("KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,i=this.values,r=n.length;r===0&&(Ue("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){const l=n[o];if(typeof l=="number"&&isNaN(l)){Ue("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Ue("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&up(i))for(let o=0,l=i.length;o!==l;++o){const c=i[o];if(isNaN(c)){Ue("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Ka,r=e.length-1;let a=1;for(let o=1;o<r;++o){let l=!1;const c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(i)l=!0;else{const d=o*n,u=d-n,f=d+n;for(let p=0;p!==n;++p){const y=t[d+p];if(y!==t[u+p]||y!==t[f+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];const d=o*n,u=a*n;for(let f=0;f!==n;++f)t[u+f]=t[d+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,ar(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}}function Rh(s,e){for(let t=0,n=s.length;t!==n;t+=2)s[t]+=e}function Ch(s,e){for(let t=0,n=s.length;t!==n;t+=2)s[t]*=e}Fn.prototype.ValueTypeName="";Fn.prototype.TimeBufferType=Float32Array;Fn.prototype.ValueBufferType=Float32Array;Fn.prototype.DefaultInterpolation=vr;class Bs extends Fn{constructor(e,t,n){super(e,t,n)}}Bs.prototype.ValueTypeName="bool";Bs.prototype.ValueBufferType=Array;Bs.prototype.DefaultInterpolation=_r;Bs.prototype.InterpolantFactoryMethodLinear=void 0;Bs.prototype.InterpolantFactoryMethodSmooth=void 0;class bd extends Fn{constructor(e,t,n,i){super(e,t,n,i)}}bd.prototype.ValueTypeName="color";class Er extends Fn{constructor(e,t,n,i){super(e,t,n,i)}}Er.prototype.ValueTypeName="number";class vm extends ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t);let c=e*o;for(let h=c+o;c!==h;c+=4)xi.slerpFlat(r,0,a,c-o,a,c,l);return r}}class Tr extends Fn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new vm(this.times,this.values,this.getValueSize(),e)}}Tr.prototype.ValueTypeName="quaternion";Tr.prototype.InterpolantFactoryMethodSmooth=void 0;class zs extends Fn{constructor(e,t,n){super(e,t,n)}}zs.prototype.ValueTypeName="string";zs.prototype.ValueBufferType=Array;zs.prototype.DefaultInterpolation=_r;zs.prototype.InterpolantFactoryMethodLinear=void 0;zs.prototype.InterpolantFactoryMethodSmooth=void 0;class Ia extends Fn{constructor(e,t,n,i){super(e,t,n,i)}}Ia.prototype.ValueTypeName="vector";class ym{constructor(e="",t=-1,n=[],i=ep){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=Jn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,i=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(Sm(n[a]).scale(i));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){const t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,a=n.length;r!==a;++r)t.push(Fn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){const r=t.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);const h=um(l);l=wh(l,1,h),c=wh(c,1,h),!i&&l[0]===0&&(l.push(r),c.push(c[0])),a.push(new Er(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){const c=e[o],h=c.name.match(r);if(h&&h.length>1){const d=h[1];let u=i[d];u||(i[d]=u=[]),u.push(c)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return a}resetDuration(){const e=this.tracks;let t=0;for(let n=0,i=e.length;n!==i;++n){const r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function Mm(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Er;case"vector":case"vector2":case"vector3":case"vector4":return Ia;case"color":return bd;case"quaternion":return Tr;case"bool":case"boolean":return Bs;case"string":return zs}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function Sm(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=Mm(s.type);if(s.times===void 0){const n=[],i=[];dm(s.keys,n,i,"value"),s.times=n,s.values=i}let t;return e.parse!==void 0?t=e.parse(s):t=new e(s.name,s.times,s.values,s.interpolation),ar(s.settings)&&(t.settings={inTangents:Li(s.settings.inTangents,Float32Array),outTangents:Li(s.settings.outTangents,Float32Array)}),t}const ci={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(Ph(s)||(this.files[s]=e))},get:function(s){if(this.enabled!==!1&&!Ph(s))return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};function Ph(s){try{const e=s.slice(s.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class bm{constructor(e,t,n){const i=this;let r=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){const d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){const f=c[d],p=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Em=new bm;class Gs{constructor(e){this.manager=e!==void 0?e:Em,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}}Gs.DEFAULT_MATERIAL_NAME="__DEFAULT";const ri={};class Tm extends Error{constructor(e,t){super(e),this.response=t}}class Ed extends Gs{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=ci.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(ri[e]!==void 0){ri[e].push({onLoad:t,onProgress:n,onError:i});return}ri[e]=[],ri[e].push({onLoad:t,onProgress:n,onError:i});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",priority:this.priority,cache:this.cache,signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Le("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=ri[e],d=c.body.getReader(),u=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=u?parseInt(u):0,p=f!==0;let y=0;const m=new ReadableStream({start(g){_();function _(){d.read().then(({done:v,value:M})=>{if(v)g.close();else{y+=M.byteLength;const S=new ProgressEvent("progress",{lengthComputable:p,loaded:y,total:f});for(let b=0,x=h.length;b<x;b++){const E=h[b];E.onProgress&&E.onProgress(S)}g.enqueue(M),_()}},v=>{g.error(v)})}}});return new Response(m)}else throw new Tm(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,f=new TextDecoder(u);return c.arrayBuffer().then(p=>f.decode(p))}}}).then(c=>{ci.add(`file:${e}`,c);const h=ri[e];delete ri[e];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onLoad&&f.onLoad(c)}}).catch(c=>{const h=ri[e];if(h===void 0)throw this.manager.itemError(e),c;delete ri[e];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const ms=new WeakMap;class Am extends Gs{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=ci.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let d=ms.get(a);d===void 0&&(d=[],ms.set(a,d)),d.push({onLoad:t,onError:i})}return a}const o=Sr("img");function l(){h(),t&&t(this);const d=ms.get(this)||[];for(let u=0;u<d.length;u++){const f=d[u];f.onLoad&&f.onLoad(this)}ms.delete(this),r.manager.itemEnd(e)}function c(d){h(),i&&i(d),ci.remove(`image:${e}`);const u=ms.get(this)||[];for(let f=0;f<u.length;f++){const p=u[f];p.onError&&p.onError(d)}ms.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ci.add(`image:${e}`,o),r.manager.itemStart(e),o.fetchPriority=this.priority,o.src=e,o}}class Ba extends Gs{constructor(e){super(e)}load(e,t,n,i){const r=new Nt,a=new Am(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}}class za extends it{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ce(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class wm extends za{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(it.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ce(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const Mo=new We,Lh=new G,Ih=new G;class lc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ke(512,512),this.mapType=cn,this.map=null,this.mapPass=null,this.matrix=new We,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new br,this._frameExtents=new ke(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera;Lh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Lh),Ih.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ih),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,i){Mo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Mo,e.coordinateSystem,e.reversedDepth);const r=this._frameExtents,a=i?i.z/r.x:1,o=i?i.w/r.y:1,l=i?i.x/r.x:0,c=i?i.y/r.y:0;e.coordinateSystem===Mr||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Mo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const ia=new G,sa=new xi,kn=new G;class cc extends it{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new We,this.projectionMatrix=new We,this.projectionMatrixInverse=new We,this.coordinateSystem=Pn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ia,sa,kn),kn.x===1&&kn.y===1&&kn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ia,sa,kn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(ia,sa,kn),kn.x===1&&kn.y===1&&kn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ia,sa,kn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const wi=new G,Nh=new ke,Dh=new ke;class sn extends cc{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ns*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(hr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ns*2*Math.atan(Math.tan(hr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){wi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(wi.x,wi.y).multiplyScalar(-e/wi.z),wi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(wi.x,wi.y).multiplyScalar(-e/wi.z)}getViewSize(e,t){return this.getViewBounds(e,Nh,Dh),t.subVectors(Dh,Nh)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(hr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Rm extends lc{constructor(){super(new sn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,n=Ns*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){const e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}}class Cm extends za{constructor(e,t,n=0,i=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(it.DEFAULT_UP),this.updateMatrix(),this.target=new it,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Rm}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class Pm extends lc{constructor(){super(new sn(90,1,.5,500)),this.isPointLightShadow=!0}}class Td extends za{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Pm}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class hc extends cc{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Lm extends lc{constructor(){super(new hc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Ad extends za{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(it.DEFAULT_UP),this.updateMatrix(),this.target=new it,this.shadow=new Lm}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class dr{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const So=new WeakMap;class Im extends Gs{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Le("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Le("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=ci.get(`image-bitmap:${e}`);if(a!==void 0){if(r.manager.itemStart(e),a.then){a.then(c=>{So.has(a)===!0?(i&&i(So.get(a)),r.manager.itemError(e),r.manager.itemEnd(e)):(t&&t(c),r.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);return}const o={};o.credentials=this.withCredentials||this.crossOrigin!=="anonymous"?"include":"same-origin",o.headers=this.requestHeader,o.priority=this.priority,o.cache=this.cache,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},r.options,{colorSpaceConversion:"none"}))}).then(function(c){return ci.add(`image-bitmap:${e}`,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){i&&i(c),So.set(l,c),ci.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});ci.add(`image-bitmap:${e}`,l),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const gs=-90,xs=1;class Al extends it{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new sn(gs,xs,e,t);i.layers=this.layers,this.add(i);const r=new sn(gs,xs,e,t);r.layers=this.layers,this.add(r);const a=new sn(gs,xs,e,t);a.layers=this.layers,this.add(a);const o=new sn(gs,xs,e,t);o.layers=this.layers,this.add(o);const l=new sn(gs,xs,e,t);l.layers=this.layers,this.add(l);const c=new sn(gs,xs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(const c of t)this.remove(c);if(e===Pn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Mr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;const y=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=y,e.setRenderTarget(n,5,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}}class Nm extends sn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}}const uc="\\[\\]\\.:\\/",Dm=new RegExp("["+uc+"]","g"),dc="[^"+uc+"]",Um="[^"+uc.replace("\\.","")+"]",Fm=/((?:WC+[\/:])*)/.source.replace("WC",dc),Om=/(WCOD+)?/.source.replace("WCOD",Um),km=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",dc),Bm=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",dc),zm=new RegExp("^"+Fm+Om+km+Bm+"$"),Gm=["material","materials","bones","map"];class Hm{constructor(e,t,n){const i=n||at.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class at{constructor(e,t,n){this.path=t,this.parsedPath=n||at.parseTrackName(t),this.node=at.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new at.Composite(e,t,n):new at(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Dm,"")}static parseTrackName(e){const t=zm.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const r=n.nodeName.substring(i+1);Gm.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let a=0;a<r.length;a++){const o=r[a];if(o.name===t||o.uuid===t)return o;const l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,i=t.propertyName;let r=t.propertyIndex;if(e||(e=at.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Le("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ue("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ue("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ue("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ue("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ue("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ue("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ue("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const a=e[i];if(a===void 0){const c=t.nodeName;Ue("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Ue("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ue("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}at.Composite=Hm;at.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};at.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};at.prototype.GetterByBindingType=[at.prototype._getValue_direct,at.prototype._getValue_array,at.prototype._getValue_arrayElement,at.prototype._getValue_toArray];at.prototype.SetterByBindingTypeAndVersioning=[[at.prototype._setValue_direct,at.prototype._setValue_direct_setNeedsUpdate,at.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[at.prototype._setValue_array,at.prototype._setValue_array_setNeedsUpdate,at.prototype._setValue_array_setMatrixWorldNeedsUpdate],[at.prototype._setValue_arrayElement,at.prototype._setValue_arrayElement_setNeedsUpdate,at.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[at.prototype._setValue_fromArray,at.prototype._setValue_fromArray_setNeedsUpdate,at.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];function Uh(s,e,t,n){const i=Vm(n);switch(t){case ed:return s*e;case Vl:return s*e/i.components*i.byteLength;case Wl:return s*e/i.components*i.byteLength;case ts:return s*e*2/i.components*i.byteLength;case Xl:return s*e*2/i.components*i.byteLength;case td:return s*e*3/i.components*i.byteLength;case Cn:return s*e*4/i.components*i.byteLength;case ql:return s*e*4/i.components*i.byteLength;case xa:case _a:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case va:case ya:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Ko:case Jo:return Math.max(s,16)*Math.max(e,8)/4;case $o:case Zo:return Math.max(s,8)*Math.max(e,8)/2;case Qo:case jo:case tl:case nl:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case el:case Ea:case il:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case sl:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case rl:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case al:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case ol:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case ll:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case cl:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case hl:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case ul:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case dl:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case fl:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case pl:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case ml:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case gl:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case xl:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case _l:case vl:case yl:return Math.ceil(s/4)*Math.ceil(e/4)*16;case Ml:case Sl:return Math.ceil(s/4)*Math.ceil(e/4)*8;case Ta:case bl:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Vm(s){switch(s){case cn:case Zu:return{byteLength:1,components:1};case xr:case Ju:case Dn:return{byteLength:2,components:1};case Gl:case Hl:return{byteLength:2,components:4};case Zn:case zl:case xn:return{byteLength:4,components:1};case Qu:case ju:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ol}}));typeof window<"u"&&(window.__THREE__?Le("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ol);function wd(){let s=null,e=!1,t=null,n=null;function i(r,a){n=s.requestAnimationFrame(i),t(r,a)}return{start:function(){e!==!0&&t!==null&&s!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Wm(s){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,d=c.byteLength,u=s.createBuffer();s.bindBuffer(l,u),s.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=s.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=s.SHORT;else if(c instanceof Uint32Array)f=s.UNSIGNED_INT;else if(c instanceof Int32Array)f=s.INT;else if(c instanceof Int8Array)f=s.BYTE;else if(c instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const h=l.array,d=l.updateRanges;if(s.bindBuffer(c,o),d.length===0)s.bufferSubData(c,0,h);else{d.sort((f,p)=>f.start-p.start);let u=0;for(let f=1;f<d.length;f++){const p=d[u],y=d[f];y.start<=p.start+p.count+1?p.count=Math.max(p.count,y.start+y.count-p.start):(++u,d[u]=y)}d.length=u+1;for(let f=0,p=d.length;f<p;f++){const y=d[f];s.bufferSubData(c,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(s.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}var Xm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qm=`#ifdef USE_ALPHAHASH
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
#endif`,Ym=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,$m=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Km=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Zm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Jm=`#ifdef USE_AOMAP
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
#endif`,Qm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jm=`#ifdef USE_BATCHING
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
#endif`,eg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,tg=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ng=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ig=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,sg=`#ifdef USE_IRIDESCENCE
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
#endif`,rg=`#ifdef USE_BUMPMAP
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
#endif`,ag=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,og=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,lg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,cg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ug=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,dg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,fg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,pg=`#define PI 3.141592653589793
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
} // validated`,mg=`vec3 transformedNormal = objectNormal;
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
#endif`,gg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_g=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,yg="gl_FragColor = linearToOutputTexel( gl_FragColor );",Mg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Sg=`#ifdef USE_ENVMAP
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
#endif`,bg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Eg=`#ifdef USE_ENVMAP
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
#endif`,Tg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ag=`#ifdef USE_ENVMAP
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
#endif`,wg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Cg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Pg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lg=`#ifdef USE_GRADIENTMAP
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
}`,Ig=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ng=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Dg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ug=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Fg=`#ifdef USE_ENVMAP
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
#endif`,Og=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,kg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Bg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,zg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Gg=`PhysicalMaterial material;
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
#endif`,Hg=`uniform sampler2D dfgLUT;
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
}`,Vg=`
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
#endif`,Wg=`#if defined( RE_IndirectDiffuse )
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
#endif`,Xg=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qg=`#if NUM_LIGHT_PROBE_GRIDS > 0
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
#endif`,Yg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,$g=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,e0=`#if defined( USE_POINTS_UV )
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
#endif`,t0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,n0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,i0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,s0=`#if defined( USE_MORPHCOLORS )
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
#endif`,r0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,a0=`#ifdef USE_MORPHTARGETS
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
#endif`,o0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,l0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,c0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,h0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,u0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,d0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,f0=`#ifdef USE_NORMALMAP
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
#endif`,p0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,m0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,g0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,x0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,v0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,y0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,M0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,S0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,b0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,E0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,T0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,A0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,w0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,R0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,C0=`float getShadowMask() {
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
}`,P0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,L0=`#ifdef USE_SKINNING
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
#endif`,I0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,N0=`#ifdef USE_SKINNING
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
#endif`,D0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,U0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,F0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,O0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,k0=`#ifdef USE_TRANSMISSION
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
#endif`,B0=`#ifdef USE_TRANSMISSION
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
#endif`,z0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,G0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,H0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,V0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const W0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,X0=`uniform sampler2D t2D;
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
}`,q0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Y0=`uniform float backgroundBlurriness;
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
}`,$0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,K0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Z0=`#include <common>
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
}`,J0=`#if DEPTH_PACKING == 3200
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
}`,Q0=`#define DISTANCE
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
}`,j0=`#define DISTANCE
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
}`,ex=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,tx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nx=`uniform float scale;
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
}`,ix=`uniform vec3 diffuse;
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
}`,sx=`#include <common>
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
}`,rx=`uniform vec3 diffuse;
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
}`,ax=`#define LAMBERT
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
}`,ox=`#define LAMBERT
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
}`,lx=`#define MATCAP
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
}`,cx=`#define MATCAP
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
}`,hx=`#define NORMAL
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
}`,ux=`#define NORMAL
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
}`,dx=`#define PHONG
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
}`,fx=`#define PHONG
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
}`,px=`#define STANDARD
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
}`,mx=`#define STANDARD
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
}`,gx=`#define TOON
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
}`,xx=`#define TOON
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
}`,_x=`uniform float size;
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
}`,vx=`uniform vec3 diffuse;
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
}`,yx=`#include <common>
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
}`,Mx=`uniform vec3 color;
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
}`,Sx=`uniform float rotation;
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
}`,bx=`uniform vec3 diffuse;
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
}`,qe={alphahash_fragment:Xm,alphahash_pars_fragment:qm,alphamap_fragment:Ym,alphamap_pars_fragment:$m,alphatest_fragment:Km,alphatest_pars_fragment:Zm,aomap_fragment:Jm,aomap_pars_fragment:Qm,batching_pars_vertex:jm,batching_vertex:eg,begin_vertex:tg,beginnormal_vertex:ng,bsdfs:ig,iridescence_fragment:sg,bumpmap_pars_fragment:rg,clipping_planes_fragment:ag,clipping_planes_pars_fragment:og,clipping_planes_pars_vertex:lg,clipping_planes_vertex:cg,color_fragment:hg,color_pars_fragment:ug,color_pars_vertex:dg,color_vertex:fg,common:pg,defaultnormal_vertex:mg,displacementmap_pars_vertex:gg,displacementmap_vertex:xg,emissivemap_fragment:_g,emissivemap_pars_fragment:vg,colorspace_fragment:yg,colorspace_pars_fragment:Mg,envmap_fragment:Sg,envmap_common_pars_fragment:bg,envmap_pars_fragment:Eg,envmap_pars_vertex:Tg,envmap_physical_pars_fragment:Fg,envmap_vertex:Ag,fog_vertex:wg,fog_pars_vertex:Rg,fog_fragment:Cg,fog_pars_fragment:Pg,gradientmap_pars_fragment:Lg,lightmap_pars_fragment:Ig,lights_lambert_fragment:Ng,lights_lambert_pars_fragment:Dg,lights_pars_begin:Ug,lights_toon_fragment:Og,lights_toon_pars_fragment:kg,lights_phong_fragment:Bg,lights_phong_pars_fragment:zg,lights_physical_fragment:Gg,lights_physical_pars_fragment:Hg,lights_fragment_begin:Vg,lights_fragment_maps:Wg,lights_fragment_end:Xg,lightprobes_pars_fragment:qg,logdepthbuf_fragment:Yg,logdepthbuf_pars_fragment:$g,logdepthbuf_pars_vertex:Kg,logdepthbuf_vertex:Zg,map_fragment:Jg,map_pars_fragment:Qg,map_particle_fragment:jg,map_particle_pars_fragment:e0,metalnessmap_fragment:t0,metalnessmap_pars_fragment:n0,morphinstance_vertex:i0,morphcolor_vertex:s0,morphnormal_vertex:r0,morphtarget_pars_vertex:a0,morphtarget_vertex:o0,normal_fragment_begin:l0,normal_fragment_maps:c0,normal_pars_fragment:h0,normal_pars_vertex:u0,normal_vertex:d0,normalmap_pars_fragment:f0,clearcoat_normal_fragment_begin:p0,clearcoat_normal_fragment_maps:m0,clearcoat_pars_fragment:g0,iridescence_pars_fragment:x0,opaque_fragment:_0,packing:v0,premultiplied_alpha_fragment:y0,project_vertex:M0,dithering_fragment:S0,dithering_pars_fragment:b0,roughnessmap_fragment:E0,roughnessmap_pars_fragment:T0,shadowmap_pars_fragment:A0,shadowmap_pars_vertex:w0,shadowmap_vertex:R0,shadowmask_pars_fragment:C0,skinbase_vertex:P0,skinning_pars_vertex:L0,skinning_vertex:I0,skinnormal_vertex:N0,specularmap_fragment:D0,specularmap_pars_fragment:U0,tonemapping_fragment:F0,tonemapping_pars_fragment:O0,transmission_fragment:k0,transmission_pars_fragment:B0,uv_pars_fragment:z0,uv_pars_vertex:G0,uv_vertex:H0,worldpos_vertex:V0,background_vert:W0,background_frag:X0,backgroundCube_vert:q0,backgroundCube_frag:Y0,cube_vert:$0,cube_frag:K0,depth_vert:Z0,depth_frag:J0,distance_vert:Q0,distance_frag:j0,equirect_vert:ex,equirect_frag:tx,linedashed_vert:nx,linedashed_frag:ix,meshbasic_vert:sx,meshbasic_frag:rx,meshlambert_vert:ax,meshlambert_frag:ox,meshmatcap_vert:lx,meshmatcap_frag:cx,meshnormal_vert:hx,meshnormal_frag:ux,meshphong_vert:dx,meshphong_frag:fx,meshphysical_vert:px,meshphysical_frag:mx,meshtoon_vert:gx,meshtoon_frag:xx,points_vert:_x,points_frag:vx,shadow_vert:yx,shadow_frag:Mx,sprite_vert:Sx,sprite_frag:bx},_e={common:{diffuse:{value:new Ce(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},envMapRotation:{value:new Oe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new ke(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ce(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Ce(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new Ce(16777215)},opacity:{value:1},center:{value:new ke(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},Vn={basic:{uniforms:jt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:qe.meshbasic_vert,fragmentShader:qe.meshbasic_frag},lambert:{uniforms:jt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Ce(0)},envMapIntensity:{value:1}}]),vertexShader:qe.meshlambert_vert,fragmentShader:qe.meshlambert_frag},phong:{uniforms:jt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Ce(0)},specular:{value:new Ce(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qe.meshphong_vert,fragmentShader:qe.meshphong_frag},standard:{uniforms:jt([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new Ce(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag},toon:{uniforms:jt([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new Ce(0)}}]),vertexShader:qe.meshtoon_vert,fragmentShader:qe.meshtoon_frag},matcap:{uniforms:jt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:qe.meshmatcap_vert,fragmentShader:qe.meshmatcap_frag},points:{uniforms:jt([_e.points,_e.fog]),vertexShader:qe.points_vert,fragmentShader:qe.points_frag},dashed:{uniforms:jt([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qe.linedashed_vert,fragmentShader:qe.linedashed_frag},depth:{uniforms:jt([_e.common,_e.displacementmap]),vertexShader:qe.depth_vert,fragmentShader:qe.depth_frag},normal:{uniforms:jt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:qe.meshnormal_vert,fragmentShader:qe.meshnormal_frag},sprite:{uniforms:jt([_e.sprite,_e.fog]),vertexShader:qe.sprite_vert,fragmentShader:qe.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qe.background_vert,fragmentShader:qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Oe}},vertexShader:qe.backgroundCube_vert,fragmentShader:qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qe.cube_vert,fragmentShader:qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qe.equirect_vert,fragmentShader:qe.equirect_frag},distance:{uniforms:jt([_e.common,_e.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qe.distance_vert,fragmentShader:qe.distance_frag},shadow:{uniforms:jt([_e.lights,_e.fog,{color:{value:new Ce(0)},opacity:{value:1}}]),vertexShader:qe.shadow_vert,fragmentShader:qe.shadow_frag}};Vn.physical={uniforms:jt([Vn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new ke(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Oe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new Ce(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new ke},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new Ce(0)},specularColor:{value:new Ce(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new ke},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag};const ra={r:0,b:0,g:0},Ex=new We,Rd=new Oe;Rd.set(-1,0,0,0,1,0,0,0,1);function Tx(s,e,t,n,i,r){const a=new Ce(0);let o=i===!0?0:1,l,c,h=null,d=0,u=null;function f(_){let v=_.isScene===!0?_.background:null;if(v&&v.isTexture){const M=_.backgroundBlurriness>0;v=e.get(v,M)}return v}function p(_){let v=!1;const M=f(_);M===null?m(a,o):M&&M.isColor&&(m(M,1),v=!0);const S=s.xr.getEnvironmentBlendMode();S==="additive"?t.buffers.color.setClear(0,0,0,1,r):S==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(s.autoClear||v)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function y(_,v){const M=f(v);M&&M.isCubeTexture?(c===void 0&&(c=new Dt(new is(1,1,1),new vn({name:"BackgroundCubeMaterial",uniforms:Fs(Vn.backgroundCube.uniforms),vertexShader:Vn.backgroundCube.vertexShader,fragmentShader:Vn.backgroundCube.fragmentShader,side:tn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,b,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Ex.makeRotationFromEuler(v.backgroundRotation)).transpose(),M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Rd),c.material.toneMapped=Ze.getTransfer(M.colorSpace)!==rt,(h!==M||d!==M.version||u!==s.toneMapping)&&(c.material.needsUpdate=!0,h=M,d=M.version,u=s.toneMapping),c.layers.enableAll(),_.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new Dt(new nn(2,2),new vn({name:"BackgroundMaterial",uniforms:Fs(Vn.background.uniforms),vertexShader:Vn.background.vertexShader,fragmentShader:Vn.background.fragmentShader,side:Fi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,l.material.toneMapped=Ze.getTransfer(M.colorSpace)!==rt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(h!==M||d!==M.version||u!==s.toneMapping)&&(l.material.needsUpdate=!0,h=M,d=M.version,u=s.toneMapping),l.layers.enableAll(),_.unshift(l,l.geometry,l.material,0,0,null))}function m(_,v){_.getRGB(ra,Md(s)),t.buffers.color.setClear(ra.r,ra.g,ra.b,v,r)}function g(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(_,v=1){a.set(_),o=v,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(_){o=_,m(a,o)},render:p,addToRenderList:y,dispose:g}}function Ax(s,e){const t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=u(null);let r=i,a=!1;function o(I,N,O,L,k){let U=!1;const P=d(I,L,O,N);r!==P&&(r=P,c(r.object)),U=f(I,L,O,k),U&&p(I,L,O,k),k!==null&&e.update(k,s.ELEMENT_ARRAY_BUFFER),(U||a)&&(a=!1,M(I,N,O,L),k!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return s.createVertexArray()}function c(I){return s.bindVertexArray(I)}function h(I){return s.deleteVertexArray(I)}function d(I,N,O,L){const k=L.wireframe===!0;let U=n[N.id];U===void 0&&(U={},n[N.id]=U);const P=I.isInstancedMesh===!0?I.id:0;let H=U[P];H===void 0&&(H={},U[P]=H);let B=H[O.id];B===void 0&&(B={},H[O.id]=B);let q=B[k];return q===void 0&&(q=u(l()),B[k]=q),q}function u(I){const N=[],O=[],L=[];for(let k=0;k<t;k++)N[k]=0,O[k]=0,L[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:O,attributeDivisors:L,object:I,attributes:{},index:null}}function f(I,N,O,L){const k=r.attributes,U=N.attributes;let P=0;const H=O.getAttributes();for(const B in H)if(H[B].location>=0){const Z=k[B];let ae=U[B];if(ae===void 0&&(B==="instanceMatrix"&&I.instanceMatrix&&(ae=I.instanceMatrix),B==="instanceColor"&&I.instanceColor&&(ae=I.instanceColor)),Z===void 0||Z.attribute!==ae||ae&&Z.data!==ae.data)return!0;P++}return r.attributesNum!==P||r.index!==L}function p(I,N,O,L){const k={},U=N.attributes;let P=0;const H=O.getAttributes();for(const B in H)if(H[B].location>=0){let Z=U[B];Z===void 0&&(B==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),B==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor));const ae={};ae.attribute=Z,Z&&Z.data&&(ae.data=Z.data),k[B]=ae,P++}r.attributes=k,r.attributesNum=P,r.index=L}function y(){const I=r.newAttributes;for(let N=0,O=I.length;N<O;N++)I[N]=0}function m(I){g(I,0)}function g(I,N){const O=r.newAttributes,L=r.enabledAttributes,k=r.attributeDivisors;O[I]=1,L[I]===0&&(s.enableVertexAttribArray(I),L[I]=1),k[I]!==N&&(s.vertexAttribDivisor(I,N),k[I]=N)}function _(){const I=r.newAttributes,N=r.enabledAttributes;for(let O=0,L=N.length;O<L;O++)N[O]!==I[O]&&(s.disableVertexAttribArray(O),N[O]=0)}function v(I,N,O,L,k,U,P){P===!0?s.vertexAttribIPointer(I,N,O,k,U):s.vertexAttribPointer(I,N,O,L,k,U)}function M(I,N,O,L){y();const k=L.attributes,U=O.getAttributes(),P=N.defaultAttributeValues;for(const H in U){const B=U[H];if(B.location>=0){let q=k[H];if(q===void 0&&(H==="instanceMatrix"&&I.instanceMatrix&&(q=I.instanceMatrix),H==="instanceColor"&&I.instanceColor&&(q=I.instanceColor)),q!==void 0){const Z=q.normalized,ae=q.itemSize,Se=e.get(q);if(Se===void 0)continue;const $=Se.buffer,ie=Se.type,Me=Se.bytesPerElement,we=ie===s.INT||ie===s.UNSIGNED_INT||q.gpuType===zl;if(q.isInterleavedBufferAttribute){const fe=q.data,te=fe.isInterleavedBuffer===!0?fe.stride:fe.itemSize,ye=q.offset;if(fe.isInstancedInterleavedBuffer||fe.isInstancedBufferAttribute){for(let ue=0;ue<B.locationSize;ue++)g(B.location+ue,fe.meshPerAttribute);I.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=fe.meshPerAttribute*fe.count)}else for(let ue=0;ue<B.locationSize;ue++)m(B.location+ue);s.bindBuffer(s.ARRAY_BUFFER,$);for(let ue=0;ue<B.locationSize;ue++)v(B.location+ue,ae/B.locationSize,ie,Z,te*Me,(ye+ae/B.locationSize*ue)*Me,we)}else{if(q.isInstancedBufferAttribute){for(let fe=0;fe<B.locationSize;fe++)g(B.location+fe,q.meshPerAttribute);I.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let fe=0;fe<B.locationSize;fe++)m(B.location+fe);s.bindBuffer(s.ARRAY_BUFFER,$);for(let fe=0;fe<B.locationSize;fe++)v(B.location+fe,ae/B.locationSize,ie,Z,ae*Me,ae/B.locationSize*fe*Me,we)}}else if(P!==void 0){const Z=P[H];if(Z!==void 0)switch(Z.length){case 2:s.vertexAttrib2fv(B.location,Z);break;case 3:s.vertexAttrib3fv(B.location,Z);break;case 4:s.vertexAttrib4fv(B.location,Z);break;default:s.vertexAttrib1fv(B.location,Z)}}}}_()}function S(){w();for(const I in n){const N=n[I];for(const O in N){const L=N[O];for(const k in L){const U=L[k];for(const P in U)h(U[P].object),delete U[P];delete L[k]}}delete n[I]}}function b(I){if(n[I.id]===void 0)return;const N=n[I.id];for(const O in N){const L=N[O];for(const k in L){const U=L[k];for(const P in U)h(U[P].object),delete U[P];delete L[k]}}delete n[I.id]}function x(I){for(const N in n){const O=n[N];for(const L in O){const k=O[L];if(k[I.id]===void 0)continue;const U=k[I.id];for(const P in U)h(U[P].object),delete U[P];delete k[I.id]}}}function E(I){for(const N in n){const O=n[N],L=I.isInstancedMesh===!0?I.id:0,k=O[L];if(k!==void 0){for(const U in k){const P=k[U];for(const H in P)h(P[H].object),delete P[H];delete k[U]}delete O[L],Object.keys(O).length===0&&delete n[N]}}}function w(){R(),a=!0,r!==i&&(r=i,c(r.object))}function R(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:w,resetDefaultState:R,dispose:S,releaseStatesOfGeometry:b,releaseStatesOfObject:E,releaseStatesOfProgram:x,initAttributes:y,enableAttribute:m,disableUnusedAttributes:_}}function wx(s,e,t){let n;function i(l){n=l}function r(l,c){s.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(s.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let f=0;f<h;f++)u+=c[f];t.update(u,n,1)}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Rx(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const x=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(x.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(x){return!(x!==Cn&&n.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(x){const E=x===Dn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(x!==cn&&x!==xn&&!E&&n.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function l(x){if(x==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";x="mediump"}return x==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(Le("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),u=t.logarithmicDepthBuffer===!0&&d===!1;t.reversedDepthBuffer===!0&&d===!1&&Le("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&d===!0&&Le("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),p=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),_=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),v=s.getParameter(s.MAX_VARYING_VECTORS),M=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),S=s.getParameter(s.MAX_SAMPLES),b=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:p,maxTextureSize:y,maxCubemapSize:m,maxAttributes:g,maxVertexUniforms:_,maxVaryings:v,maxFragmentUniforms:M,maxSamples:S,samples:b}}function Cx(s){const e=this;let t=null,n=0,i=!1,r=!1;const a=new Pi,o=new Oe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||i;return i=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){const p=d.clippingPlanes,y=d.clipIntersection,m=d.clipShadows,g=s.get(d);if(!i||p===null||p.length===0||r&&!m)r?h(null):c();else{const _=r?0:n,v=_*4;let M=g.clippingState||null;l.value=M,M=h(p,u,v,f);for(let S=0;S!==v;++S)M[S]=t[S];g.clippingState=M,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,u,f,p){const y=d!==null?d.length:0;let m=null;if(y!==0){if(m=l.value,p!==!0||m===null){const g=f+y*4,_=u.matrixWorldInverse;o.getNormalMatrix(_),(m===null||m.length<g)&&(m=new Float32Array(g));for(let v=0,M=f;v!==y;++v,M+=4)a.copy(d[v]).applyMatrix4(_,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}class fc extends In{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new _d(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new is(5,5,5),r=new vn({name:"CubemapFromEquirect",uniforms:Fs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:tn,blending:ws});r.uniforms.tEquirect.value=t;const a=new Dt(i,r),o=t.minFilter;return t.minFilter===qn&&(t.minFilter=Pt),new Al(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}}const Fh=256,Px=3,Lx=20,Cd=256,Pd=16,Ix=3,Nx=new G,Dx=new Ce;class Na{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Al(1,10,null),this._boxMesh=new Dt(new is(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,i=100,r={}){const{size:a=256,position:o=Nx}=r,l=this._renderer;this._setSize(a);const c=this._allocateTarget(),h=this._getSourceTarget(!0);t>0&&(h.texture.mipmapsAutoUpdate=!1);const d=l.autoClear,u=l.autoClearColor,f=l.autoClearDepth,p=l.autoClearStencil,y=e.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,y===null&&(e.background=l.getClearColor(Dx));const m=new Al(n,i,h);return m.position.copy(o),m.update(l,e),l.autoClear=d,l.autoClearColor=u,l.autoClearDepth=f,l.autoClearStencil=p,e.background=y,t>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=kh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Fh,cd(e))}_fromTexture(e,t){e.mapping===Ls||e.mapping===gr?this._setSize(e.image.length===0?Fh:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);const n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){const e=this._cubeSize,t=Oh(e,!1,!1),n=Math.log2(e)-Px;for(let i=0;i<=n;i++)t.texture.mipmaps.push({width:e>>i,height:e>>i});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){const t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Oh(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){const i=this._boxMesh,r=this._cubeCamera;i.material=n,r.renderTarget=e,r.activeMipmapLevel=t;const a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,i),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===Ls||e.mapping===gr?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bh()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=kh()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=Ux(),this._integrationMaterial=Fx());const t=this._cubeSize,n=e.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;const r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/Pd);for(let a=0;a<=n;a++){const o=Na.lodToRoughness(a,n);if(a>n-Ix)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{const l=o>0?Math.log2(t)+.5*Math.log2(6/(Cd*Math.pow(o,4)))+.5:0;i.roughness.value=o,i.lodBias.value=l,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Ox());const n=this._blurMaterial,i=n.uniforms,r=this._sourceTarget;i.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,i.envMap.value=r.texture,this._renderCube(e,0,n),i.envMap.value=e.texture,this._renderCube(r,0,n)}}function Oh(s,e,t){return new fc(s,{minFilter:qn,generateMipmaps:e,type:Dn,colorSpace:hn,depthBuffer:t})}function Pr(s,e,t){return new vn({name:s,uniforms:e,vertexShader:qe.cube_vert,fragmentShader:t,side:tn,blending:ws,depthTest:!1,depthWrite:!1})}function Ux(){return Pr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Cd}u

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
	`)}function Fx(){return Pr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Pd}},`

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
	`)}function Ox(){return Pr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Lx}
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
	`)}function kh(){return Pr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

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
	`)}function Bh(){return Pr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function kx(s){let e=new WeakMap,t=new WeakMap,n=null;function i(u,f=!1){return u==null?null:f?a(u):r(u)}function r(u){if(u&&u.isTexture){const f=u.mapping;if(f===Ya||f===$a)if(e.has(u)){const p=e.get(u).texture;return o(p,u.mapping)}else{const p=u.image;if(p&&p.height>0){const y=new fc(p.height);return y.fromEquirectangularTexture(s,u),e.set(u,y),u.addEventListener("dispose",c),o(y.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture&&u.isPMREMTexture!==!0){const f=u.mapping,p=f===Ya||f===$a,y=f===Ls||f===gr;if(p||y){let m=t.get(u);const g=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==g)return n===null&&(n=new Na(s)),m=p?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const _=u.image;return p&&_&&_.height>0||y&&_&&l(_)?(n===null&&(n=new Na(s)),m=p?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,f){return f===Ya?u.mapping=Ls:f===$a&&(u.mapping=gr),u}function l(u){let f=0;const p=6;for(let y=0;y<p;y++)u[y]!==void 0&&f++;return f===p}function c(u){const f=u.target;f.removeEventListener("dispose",c);const p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function h(u){const f=u.target;f.removeEventListener("dispose",h);const p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:d}}function Bx(s){const e={};function t(n){if(e[n]!==void 0)return e[n];const i=s.getExtension(n);return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const i=t(n);return i===null&&Rs("WebGLRenderer: "+n+" extension not supported."),i}}}function zx(s,e,t,n){const i={},r=new WeakMap,a=new FinalizationRegistry(p=>delete i[p]);function o(p){l(p.target)}function l(p){p.index!==null&&e.remove(p.index);for(const m in p.attributes)e.remove(p.attributes[m]);p.removeEventListener("dispose",o),delete i[p.id],a.unregister(p);const y=r.get(p);y&&(e.remove(y),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function c(p,y){return i[y.id]!==void 0||(y.addEventListener("dispose",o),i[y.id]=new WeakRef(y),a.register(y,y.id,y),t.memory.geometries++),y}function h(p){const y=p.attributes;for(const m in y)e.update(y[m],s.ARRAY_BUFFER)}function d(p){const y=p.index,m=p.attributes.position;let g=0;if(m===void 0)return;const _=y!==null?y.array.length:m.array.length/3-1,v=m.count>=65535?pd:fd,M=new v(Math.ceil(_/3)*6,1),S=M.array;if(y!==null){const x=y.array;g=y.version;for(let E=0,w=0;E<_;E+=3){const R=x[E+0],I=x[E+1],N=x[E+2];S[w++]=R,S[w++]=I,S[w++]=I,S[w++]=N,S[w++]=N,S[w++]=R}}else{g=m.version;for(let x=0,E=0;x<_;x+=3){const w=x+0,R=x+1,I=x+2;S[E++]=w,S[E++]=R,S[E++]=R,S[E++]=I,S[E++]=I,S[E++]=w}}M.version=g;const b=r.get(p);b&&e.remove(b),r.set(p,M)}function u(p){const y=r.get(p);if(y){const m=p.index;m!==null&&y.version<m.version&&d(p)}else d(p);return r.get(p)}function f(){for(const p in i){const y=i[p].deref();y!==void 0&&l(y)}}return{get:c,update:h,getWireframeAttribute:u,dispose:f}}function Gx(s,e,t){let n;function i(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,u){s.drawElements(n,u,r,d*a),t.update(u,n,1)}function c(d,u,f){f!==0&&(s.drawElementsInstanced(n,u,r,d*a,f),t.update(u,n,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,f);let y=0;for(let m=0;m<f;m++)y+=u[m];t.update(y,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Hx(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case s.TRIANGLES:t.triangles+=o*(r/3);break;case s.LINES:t.lines+=o*(r/2);break;case s.LINE_STRIP:t.lines+=o*(r-1);break;case s.LINE_LOOP:t.lines+=o*r;break;case s.POINTS:t.points+=o*r;break;default:Ue("WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Vx(s,e,t){const n=new WeakMap,i=new ot;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let R=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",R)};var f=R;u!==void 0&&u.texture.dispose();const p=o.morphAttributes.position!==void 0,y=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],_=o.morphAttributes.normal||[],v=o.morphAttributes.color||[];let M=0;p===!0&&(M=1),y===!0&&(M=2),m===!0&&(M=3);let S=o.attributes.position.count*M,b=1;S>e.maxTextureSize&&(b=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const x=new Float32Array(S*b*4*d),E=new hd(x,S,b,d);E.type=xn,E.needsUpdate=!0;const w=M*4;for(let I=0;I<d;I++){const N=g[I],O=_[I],L=v[I],k=S*b*4*I;for(let U=0;U<N.count;U++){const P=U*w;p===!0&&(i.fromBufferAttribute(N,U),x[k+P+0]=i.x,x[k+P+1]=i.y,x[k+P+2]=i.z,x[k+P+3]=0),y===!0&&(i.fromBufferAttribute(O,U),x[k+P+4]=i.x,x[k+P+5]=i.y,x[k+P+6]=i.z,x[k+P+7]=0),m===!0&&(i.fromBufferAttribute(L,U),x[k+P+8]=i.x,x[k+P+9]=i.y,x[k+P+10]=i.z,x[k+P+11]=L.itemSize===4?i.w:1)}}u={count:d,texture:E,size:new ke(S,b)},n.set(o,u),o.addEventListener("dispose",R)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,t);else{let p=0;for(let m=0;m<c.length;m++)p+=c[m];const y=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(s,"morphTargetBaseInfluence",y),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(s,"morphTargetsTextureSize",u.size)}return{update:r}}function Wx(s,e,t,n,i){let r=new WeakMap;function a(c){const h=i.render.frame,d=c.geometry,u=e.get(c,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){const f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function o(){r=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const Xx={[Hu]:"LINEAR_TONE_MAPPING",[Vu]:"REINHARD_TONE_MAPPING",[Wu]:"CINEON_TONE_MAPPING",[Bl]:"ACES_FILMIC_TONE_MAPPING",[qu]:"AGX_TONE_MAPPING",[Yu]:"NEUTRAL_TONE_MAPPING",[Xu]:"CUSTOM_TONE_MAPPING"};function qx(s,e,t,n,i,r){const a=new In(e,t,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null,c=null;const h=new Bt;h.setAttribute("position",new St([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new St([0,2,0,0,2,0],2));const d=new cm({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new Dt(h,d),f=new hc(-1,1,1,-1,0,1);let p=null,y=null,m=!1,g,_=null,v=[],M=!1;this.setSize=function(S,b){a.setSize(S,b),o!==null&&o.setSize(S,b),l!==null&&l.setSize(S,b);for(let x=0;x<v.length;x++){const E=v[x];E.setSize&&E.setSize(S,b)}},this.setEffects=function(S){v=S,M=v.length>0&&v[0].isRenderPass===!0;const b=a.width,x=a.height;v.length>0&&o===null&&(o=new In(b,x,{type:Dn,depthBuffer:!1,stencilBuffer:!1}),l=new In(b,x,{type:Dn,depthBuffer:!1,stencilBuffer:!1}));const E=i===!0&&v.some(w=>w.needsDepthTexture===!0);E!==(a.depthTexture!==null)&&(E===!0&&c===null&&(c=new Us(b,x),r===!0&&(c.format=Di,c.type=Is)),a.dispose(),a.depthTexture=E?c:null,a.resolveDepthBuffer=E,a.storeMultisampledDepthBuffer=E);for(let w=0;w<v.length;w++){const R=v[w];R.setSize&&R.setSize(b,x),E&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(S,b){if(m||S.toneMapping===ui&&v.length===0)return!1;if(_=b,b!==null){const x=b.width,E=b.height;(a.width!==x||a.height!==E)&&this.setSize(x,E)}return M===!1&&S.setRenderTarget(a),g=S.toneMapping,S.toneMapping=ui,!0},this.hasRenderPass=function(){return M},this.end=function(S,b){S.toneMapping=g,m=!0;let x=a,E=o;for(let w=0;w<v.length;w++){const R=v[w];R.enabled!==!1&&(R.render(S,E,x,b),R.needsSwap!==!1&&(x=E,E=E===o?l:o))}if(p!==S.outputColorSpace||y!==S.toneMapping){p=S.outputColorSpace,y=S.toneMapping,d.defines={},Ze.getTransfer(p)===rt&&(d.defines.SRGB_TRANSFER="");const w=Xx[y];w&&(d.defines[w]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=x.texture,S.setRenderTarget(_),S.render(u,f),_=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),d.dispose()}}const Ld=new Nt,Id=new Us(1,1),Nd=new vd(1),Dd=new hd,Ud=new Up,Fd=new _d,zh=[],Gh=[],Hh=new Float32Array(16),Vh=new Float32Array(9),Wh=new Float32Array(4);function Hs(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=zh[i];if(r===void 0&&(r=new Float32Array(i),zh[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function Ot(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function kt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Ga(s,e){let t=Gh[e];t===void 0&&(t=new Int32Array(e),Gh[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function Yx(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function $x(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;s.uniform2fv(this.addr,e),kt(t,e)}}function Kx(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ot(t,e))return;s.uniform3fv(this.addr,e),kt(t,e)}}function Zx(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;s.uniform4fv(this.addr,e),kt(t,e)}}function Jx(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ot(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),kt(t,e)}else{if(Ot(t,n))return;Wh.set(n),s.uniformMatrix2fv(this.addr,!1,Wh),kt(t,n)}}function Qx(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ot(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),kt(t,e)}else{if(Ot(t,n))return;Vh.set(n),s.uniformMatrix3fv(this.addr,!1,Vh),kt(t,n)}}function jx(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ot(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),kt(t,e)}else{if(Ot(t,n))return;Hh.set(n),s.uniformMatrix4fv(this.addr,!1,Hh),kt(t,n)}}function e_(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function t_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;s.uniform2iv(this.addr,e),kt(t,e)}}function n_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ot(t,e))return;s.uniform3iv(this.addr,e),kt(t,e)}}function i_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;s.uniform4iv(this.addr,e),kt(t,e)}}function s_(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function r_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;s.uniform2uiv(this.addr,e),kt(t,e)}}function a_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ot(t,e))return;s.uniform3uiv(this.addr,e),kt(t,e)}}function o_(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;s.uniform4uiv(this.addr,e),kt(t,e)}}function Ha(s){return s.version===0&&(s.compareFunction=ad,s.needsUpdate=!0),s}function l_(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?r=Ha(Id):r=Ld,t.setTexture2D(e||r,i)}function c_(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Ud,i)}function h_(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_CUBE_SHADOW?r=Ha(Nd):r=Fd,t.setTextureCube(e||r,i)}function u_(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Dd,i)}function d_(s){switch(s){case 5126:return Yx;case 35664:return $x;case 35665:return Kx;case 35666:return Zx;case 35674:return Jx;case 35675:return Qx;case 35676:return jx;case 5124:case 35670:return e_;case 35667:case 35671:return t_;case 35668:case 35672:return n_;case 35669:case 35673:return i_;case 5125:return s_;case 36294:return r_;case 36295:return a_;case 36296:return o_;case 35678:case 36198:case 36298:case 36306:case 35682:return l_;case 35679:case 36299:case 36307:return c_;case 35680:case 36300:case 36308:case 36293:return h_;case 36289:case 36303:case 36311:case 36292:return u_}}function f_(s,e){s.uniform1fv(this.addr,e)}function p_(s,e){const t=Hs(e,this.size,2);s.uniform2fv(this.addr,t)}function m_(s,e){const t=Hs(e,this.size,3);s.uniform3fv(this.addr,t)}function g_(s,e){const t=Hs(e,this.size,4);s.uniform4fv(this.addr,t)}function x_(s,e){const t=Hs(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function __(s,e){const t=Hs(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function v_(s,e){const t=Hs(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function y_(s,e){s.uniform1iv(this.addr,e)}function M_(s,e){s.uniform2iv(this.addr,e)}function S_(s,e){s.uniform3iv(this.addr,e)}function b_(s,e){s.uniform4iv(this.addr,e)}function E_(s,e){s.uniform1uiv(this.addr,e)}function T_(s,e){s.uniform2uiv(this.addr,e)}function A_(s,e){s.uniform3uiv(this.addr,e)}function w_(s,e){s.uniform4uiv(this.addr,e)}function R_(s,e,t){const n=this.cache,i=e.length,r=Ga(t,i);Ot(n,r)||(s.uniform1iv(this.addr,r),kt(n,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=Ha(Id):a=Ld;for(let o=0;o!==i;++o)t.setTexture2D(e[o]||a,r[o])}function C_(s,e,t){const n=this.cache,i=e.length,r=Ga(t,i);Ot(n,r)||(s.uniform1iv(this.addr,r),kt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||Ud,r[a])}function P_(s,e,t){const n=this.cache,i=e.length,r=Ga(t,i);Ot(n,r)||(s.uniform1iv(this.addr,r),kt(n,r));let a;this.type===s.SAMPLER_CUBE_SHADOW?a=Ha(Nd):a=Fd;for(let o=0;o!==i;++o)t.setTextureCube(e[o]||a,r[o])}function L_(s,e,t){const n=this.cache,i=e.length,r=Ga(t,i);Ot(n,r)||(s.uniform1iv(this.addr,r),kt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||Dd,r[a])}function I_(s){switch(s){case 5126:return f_;case 35664:return p_;case 35665:return m_;case 35666:return g_;case 35674:return x_;case 35675:return __;case 35676:return v_;case 5124:case 35670:return y_;case 35667:case 35671:return M_;case 35668:case 35672:return S_;case 35669:case 35673:return b_;case 5125:return E_;case 36294:return T_;case 36295:return A_;case 36296:return w_;case 35678:case 36198:case 36298:case 36306:case 35682:return R_;case 35679:case 36299:case 36307:return C_;case 35680:case 36300:case 36308:case 36293:return P_;case 36289:case 36303:case 36311:case 36292:return L_}}class N_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=d_(t.type)}}class D_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=I_(t.type)}}class U_{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(e,t[o.id],n)}}}const bo=/(\w+)(\])?(\[|\.)?/g;function Xh(s,e){s.seq.push(e),s.map[e.id]=e}function F_(s,e,t){const n=s.name,i=n.length;for(bo.lastIndex=0;;){const r=bo.exec(n),a=bo.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){Xh(t,c===void 0?new N_(o,s,e):new D_(o,s,e));break}else{let d=t.map[o];d===void 0&&(d=new U_(o),Xh(t,d)),t=d}}}class Ma{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);F_(o,l,this)}const i=[],r=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(a):r.push(a);i.length>0&&(this.seq=i.concat(r))}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){const o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const a=e[i];a.id in t&&n.push(a)}return n}}function qh(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}const O_=37297;let k_=0;function B_(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Yh=new Oe;function z_(s){Ze._getMatrix(Yh,Ze.workingColorSpace,s);const e=`mat3( ${Yh.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(s)){case wa:return[e,"LinearTransferOETF"];case rt:return[e,"sRGBTransferOETF"];default:return Le("WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function $h(s,e,t){const n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+B_(s.getShaderSource(e),o)}else return r}function G_(s,e){const t=z_(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const H_={[Hu]:"Linear",[Vu]:"Reinhard",[Wu]:"Cineon",[Bl]:"ACESFilmic",[qu]:"AgX",[Yu]:"Neutral",[Xu]:"Custom"};function V_(s,e){const t=H_[e];return t===void 0?(Le("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const aa=new G;function W_(){Ze.getLuminanceCoefficients(aa);const s=aa.x.toFixed(4),e=aa.y.toFixed(4),t=aa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function X_(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(or).join(`
`)}function q_(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Y_(s,e){const t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:s.getAttribLocation(e,a),locationSize:o}}return t}function or(s){return s!==""}function Kh(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function Zh(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const $_=/^[ \t]*#include +<([\w\d./]+)>/gm;function wl(s){return s.replace($_,K_)}function K_(s,e){const t=qe[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return wl(t)}const Z_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jh(s){return s.replace(Z_,J_)}function J_(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Qh(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Q_={[lr]:"SHADOWMAP_TYPE_PCF",[ir]:"SHADOWMAP_TYPE_VSM"};function j_(s){return Q_[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const ev={[gr]:"ENVMAP_MODE_REFRACTION"};function tv(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":ev[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}const nv={[kl]:"ENVMAP_BLENDING_MULTIPLY",[Jf]:"ENVMAP_BLENDING_MIX",[Qf]:"ENVMAP_BLENDING_ADD"};function iv(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":nv[s.combine]||"ENVMAP_BLENDING_NONE"}function sv(s,e,t,n){const i=s.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=j_(t),c=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=tv(t),d=iv(t),u=X_(t),f=q_(r),p=i.createProgram();let y,m,g=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(y=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(or).join(`
`),y.length>0&&(y+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(or).join(`
`),m.length>0&&(m+=`
`)):(y=[Qh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(or).join(`
`),m=[Qh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ui?"#define TONE_MAPPING":"",t.toneMapping!==ui?qe.tonemapping_pars_fragment:"",t.toneMapping!==ui?V_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",qe.colorspace_pars_fragment,G_("linearToOutputTexel",t.outputColorSpace),W_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(or).join(`
`)),a=wl(a),a=Kh(a,t),a=Zh(a,t),o=wl(o),o=Kh(o,t),o=Zh(o,t),a=Jh(a),o=Jh(o),t.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,y=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,m=["#define varying in",t.glslVersion===$c?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===$c?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const _=g+y+a,v=g+m+o,M=qh(i,i.VERTEX_SHADER,_),S=qh(i,i.FRAGMENT_SHADER,v);i.attachShader(p,M),i.attachShader(p,S),t.index0AttributeName!==void 0?i.bindAttribLocation(p,0,t.index0AttributeName):t.hasPositionAttribute===!0&&i.bindAttribLocation(p,0,"position"),i.linkProgram(p);function b(R){if(s.debug.checkShaderErrors){const I=i.getProgramInfoLog(p)||"",N=i.getShaderInfoLog(M)||"",O=i.getShaderInfoLog(S)||"",L=I.trim(),k=N.trim(),U=O.trim();let P=!0,H=!0;if(i.getProgramParameter(p,i.LINK_STATUS)===!1)if(P=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,p,M,S);else{const B=$h(i,M,"vertex"),q=$h(i,S,"fragment");Ue("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(p,i.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+L+`
`+B+`
`+q)}else L!==""?Le("WebGLProgram: Program Info Log:",L):(k===""||U==="")&&(H=!1);H&&(R.diagnostics={runnable:P,programLog:L,vertexShader:{log:k,prefix:y},fragmentShader:{log:U,prefix:m}})}i.deleteShader(M),i.deleteShader(S),x=new Ma(i,p),E=Y_(i,p)}let x;this.getUniforms=function(){return x===void 0&&b(this),x};let E;this.getAttributes=function(){return E===void 0&&b(this),E};let w=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return w===!1&&(w=i.getProgramParameter(p,O_)),w},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=k_++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=M,this.fragmentShader=S,this}let rv=0;class av{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const i=this._getShaderCacheForMaterial(e);return i.has(t)===!1&&(i.add(t),t.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new ov(e),t.set(e,n)),n}}class ov{constructor(e){this.id=rv++,this.code=e,this.usedTimes=0}}function lv(s){return s===ts||s===Ea||s===Ta}function cv(s,e,t,n,i,r){const a=new ud,o=new av,l=new Set,c=[],h=new Map,d=n.logarithmicDepthBuffer,u={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function f(x){return l.add(x),x===0?"uv":`uv${x}`}function p(x,E,w,R,I,N){const O=R.fog,L=I.geometry,k=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?R.environment:null,U=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,P=e.get(x.envMap||k,U),H=u[x.type];let B=n.precision;x.precision!==null&&(B=n.getMaxPrecision(x.precision),B!==x.precision&&Le("WebGLProgram.getParameters:",x.precision,"not supported, using",B,"instead."));const q=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,Z=q!==void 0?q.length:0;let ae=0;L.morphAttributes.position!==void 0&&(ae=1),L.morphAttributes.normal!==void 0&&(ae=2),L.morphAttributes.color!==void 0&&(ae=3);let Se,$,ie,Me;if(H){const xe=Vn[H];Se=xe.vertexShader,$=xe.fragmentShader}else{Se=x.vertexShader,$=x.fragmentShader;const xe=o.getVertexShaderStage(x),st=o.getFragmentShaderStage(x);o.update(x,xe,st),ie=xe.id,Me=st.id}const we=s.getRenderTarget(),fe=s.state.buffers.depth.getReversed(),te=I.isInstancedMesh===!0,ye=I.isBatchedMesh===!0,ue=!!x.map,$e=!!x.matcap,et=!!P,Ge=et&&P.isPMREMTexture===!0,He=!!x.aoMap,lt=!!x.lightMap,wt=!!x.bumpMap&&x.wireframe===!1,bt=!!x.normalMap,On=!!x.displacementMap,zt=!!x.emissiveMap,un=!!x.metalnessMap,dn=!!x.roughnessMap,fn=x.anisotropy>0,z=x.clearcoat>0,pn=x.diffuseRoughness>0,vt=x.dispersion>0,yt=x.retroreflectivity>0,ge=x.iridescence>0,Ut=x.sheen>0,Ne=x.transmission>0,Fe=fn&&!!x.anisotropyMap,C=z&&!!x.clearcoatMap,T=z&&!!x.clearcoatNormalMap,W=z&&!!x.clearcoatRoughnessMap,ne=pn&&!!x.diffuseRoughnessMap,ee=ge&&!!x.iridescenceMap,oe=ge&&!!x.iridescenceThicknessMap,pe=Ut&&!!x.sheenColorMap,J=Ut&&!!x.sheenRoughnessMap,Q=!!x.specularMap,ce=!!x.specularColorMap,D=!!x.specularIntensityMap,j=Ne&&!!x.transmissionMap,K=Ne&&!!x.thicknessMap,he=!!x.gradientMap,re=!!x.alphaMap,le=x.alphaTest>0,Pe=!!x.alphaHash,Ye=!!x.extensions;let se=ui;x.toneMapped&&(we===null||we.isXRRenderTarget===!0)&&(se=s.toneMapping);const Ie=Ge?P.isCompressedCubeTexture?P.image[0].mipmaps:P.mipmaps:null,Xe={shaderID:H,shaderType:x.type,shaderName:x.name,vertexShader:Se,fragmentShader:$,defines:x.defines,customVertexShaderID:ie,customFragmentShaderID:Me,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:B,batching:ye,batchingColor:ye&&I._colorsTexture!==null,instancing:te,instancingColor:te&&I.instanceColor!==null,instancingMorph:te&&I.morphTexture!==null,outputColorSpace:we===null?s.outputColorSpace:we.isXRRenderTarget===!0?we.texture.colorSpace:Ze.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:ue,matcap:$e,envMap:et,envMapMode:et&&P.mapping,envMapPMREM:Ge,envMapMaxLod:Ge?Ie.length-1:null,envMapSize:Ge?Ie[0].width:null,aoMap:He,lightMap:lt,bumpMap:wt,normalMap:bt,displacementMap:On,emissiveMap:zt,normalMapObjectSpace:bt&&x.normalMapType===ip,normalMapTangentSpace:bt&&x.normalMapType===Aa,packedNormalMap:bt&&x.normalMapType===Aa&&lv(x.normalMap.format),metalnessMap:un,roughnessMap:dn,anisotropy:fn,anisotropyMap:Fe,clearcoat:z,clearcoatMap:C,clearcoatNormalMap:T,clearcoatRoughnessMap:W,diffuseRoughness:pn,diffuseRoughnessMap:ne,dispersion:vt,retroreflection:yt,iridescence:ge,iridescenceMap:ee,iridescenceThicknessMap:oe,sheen:Ut,sheenColorMap:pe,sheenRoughnessMap:J,specularMap:Q,specularColorMap:ce,specularIntensityMap:D,transmission:Ne,transmissionMap:j,thicknessMap:K,gradientMap:he,opaque:x.transparent===!1&&x.blending===cr&&x.alphaToCoverage===!1,alphaMap:re,alphaTest:le,alphaHash:Pe,combine:x.combine,mapUv:ue&&f(x.map.channel),aoMapUv:He&&f(x.aoMap.channel),lightMapUv:lt&&f(x.lightMap.channel),bumpMapUv:wt&&f(x.bumpMap.channel),normalMapUv:bt&&f(x.normalMap.channel),displacementMapUv:On&&f(x.displacementMap.channel),emissiveMapUv:zt&&f(x.emissiveMap.channel),metalnessMapUv:un&&f(x.metalnessMap.channel),roughnessMapUv:dn&&f(x.roughnessMap.channel),anisotropyMapUv:Fe&&f(x.anisotropyMap.channel),clearcoatMapUv:C&&f(x.clearcoatMap.channel),clearcoatNormalMapUv:T&&f(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:W&&f(x.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ne&&f(x.diffuseRoughnessMap.channel),iridescenceMapUv:ee&&f(x.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&f(x.iridescenceThicknessMap.channel),sheenColorMapUv:pe&&f(x.sheenColorMap.channel),sheenRoughnessMapUv:J&&f(x.sheenRoughnessMap.channel),specularMapUv:Q&&f(x.specularMap.channel),specularColorMapUv:ce&&f(x.specularColorMap.channel),specularIntensityMapUv:D&&f(x.specularIntensityMap.channel),transmissionMapUv:j&&f(x.transmissionMap.channel),thicknessMapUv:K&&f(x.thicknessMap.channel),alphaMapUv:re&&f(x.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(bt||fn),vertexNormals:!!L.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!L.attributes.uv&&(ue||re),fog:!!O,useFog:x.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||L.attributes.normal===void 0&&bt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:fe,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:Z,morphTextureStride:ae,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:N.filter(xe=>xe.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&w.length>0,shadowMapType:s.shadowMap.type,toneMapping:se,decodeVideoTexture:ue&&x.map.isVideoTexture===!0&&Ze.getTransfer(x.map.colorSpace)===rt,decodeVideoTextureEmissive:zt&&x.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(x.emissiveMap.colorSpace)===rt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Tt,flipSided:x.side===tn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Ye&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ye&&x.extensions.multiDraw===!0||ye)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Xe.vertexUv1s=l.has(1),Xe.vertexUv2s=l.has(2),Xe.vertexUv3s=l.has(3),l.clear(),Xe}function y(x){const E=[];if(x.shaderID?E.push(x.shaderID):(E.push(x.customVertexShaderID),E.push(x.customFragmentShaderID)),x.defines!==void 0)for(const w in x.defines)E.push(w),E.push(x.defines[w]);return x.isRawShaderMaterial===!1&&(m(E,x),g(E,x),E.push(s.outputColorSpace)),E.push(x.customProgramCacheKey),E.join()}function m(x,E){x.push(E.precision),x.push(E.outputColorSpace),x.push(E.envMapMode),x.push(E.envMapPMREM),x.push(E.envMapMaxLod),x.push(E.envMapSize),x.push(E.mapUv),x.push(E.alphaMapUv),x.push(E.lightMapUv),x.push(E.aoMapUv),x.push(E.bumpMapUv),x.push(E.normalMapUv),x.push(E.displacementMapUv),x.push(E.emissiveMapUv),x.push(E.metalnessMapUv),x.push(E.roughnessMapUv),x.push(E.anisotropyMapUv),x.push(E.clearcoatMapUv),x.push(E.clearcoatNormalMapUv),x.push(E.clearcoatRoughnessMapUv),x.push(E.diffuseRoughnessMapUv),x.push(E.iridescenceMapUv),x.push(E.iridescenceThicknessMapUv),x.push(E.sheenColorMapUv),x.push(E.sheenRoughnessMapUv),x.push(E.specularMapUv),x.push(E.specularColorMapUv),x.push(E.specularIntensityMapUv),x.push(E.transmissionMapUv),x.push(E.thicknessMapUv),x.push(E.combine),x.push(E.fogExp2),x.push(E.sizeAttenuation),x.push(E.morphTargetsCount),x.push(E.numSunLights),x.push(E.numDirLights),x.push(E.numPointLights),x.push(E.numSpotLights),x.push(E.numSpotLightMaps),x.push(E.numHemiLights),x.push(E.numRectAreaLights),x.push(E.numSunLightShadows),x.push(E.numDirLightShadows),x.push(E.numPointLightShadows),x.push(E.numSpotLightShadows),x.push(E.numSpotLightShadowsWithMaps),x.push(E.numLightProbes),x.push(E.numLightProbeGrids),x.push(E.shadowMapType),x.push(E.toneMapping),x.push(E.numClippingPlanes),x.push(E.numClipIntersection),x.push(E.depthPacking)}function g(x,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.retroreflection&&a.enable(24),E.diffuseRoughness&&a.enable(25),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),E.packedNormalMap&&a.enable(22),E.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),E.numLightProbeGrids>0&&a.enable(22),E.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function _(x){const E=u[x.type];let w;if(E){const R=Vn[E];w=am.clone(R.uniforms)}else w=x.uniforms;return w}function v(x,E){let w=h.get(E);return w!==void 0?++w.usedTimes:(w=new sv(s,E,x,i),c.push(w),h.set(E,w)),w}function M(x){if(--x.usedTimes===0){const E=c.indexOf(x);c[E]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function S(x){o.remove(x)}function b(){o.dispose()}return{getParameters:p,getProgramCacheKey:y,getUniforms:_,acquireProgram:v,releaseProgram:M,releaseShaderCache:S,programs:c,dispose:b}}function hv(){let s=new WeakMap;function e(a){return s.has(a)}function t(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function uv(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.materialVariant!==e.materialVariant?s.materialVariant-e.materialVariant:s.z!==e.z?s.z-e.z:s.id-e.id}function jh(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function eu(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,p,y,m,g){let _=s[e];return _===void 0?(_={id:u.id,object:u,geometry:f,material:p,materialVariant:a(u),groupOrder:y,renderOrder:u.renderOrder,z:m,group:g},s[e]=_):(_.id=u.id,_.object=u,_.geometry=f,_.material=p,_.materialVariant=a(u),_.groupOrder=y,_.renderOrder=u.renderOrder,_.z=m,_.group=g),e++,_}function l(u,f,p,y,m,g,_){_.reversedDepth===!0&&(m=-m);const v=o(u,f,p,y,m,g);p.transmission>0?n.push(v):p.transparent===!0?i.push(v):t.push(v)}function c(u,f,p,y,m,g){const _=o(u,f,p,y,m,g);p.transmission>0?n.unshift(_):p.transparent===!0?i.unshift(_):t.unshift(_)}function h(u,f){t.length>1&&t.sort(u||uv),n.length>1&&n.sort(f||jh),i.length>1&&i.sort(f||jh)}function d(){for(let u=e,f=s.length;u<f;u++){const p=s[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:l,unshift:c,finish:d,sort:h}}function dv(){let s=new WeakMap;function e(n,i){const r=s.get(n);let a;return r===void 0?(a=new eu,s.set(n,[a])):i>=r.length?(a=new eu,r.push(a)):a=r[i],a}function t(){s=new WeakMap}return{get:e,dispose:t}}function fv(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new G,color:new Ce};break;case"SpotLight":t={position:new G,direction:new G,color:new Ce,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new Ce,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new Ce,groundColor:new Ce};break;case"RectAreaLight":t={color:new Ce,position:new G,halfWidth:new G,halfHeight:new G};break}return s[e.id]=t,t}}}function pv(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let mv=0;function gv(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function xv(s){const e=new fv,t=pv(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new G);const i=new G,r=new We,a=new We;function o(c){let h=0,d=0,u=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let f=0,p=0,y=0,m=0,g=0,_=0,v=0,M=0,S=0,b=0,x=0,E=0,w=0,R=0;c.sort(gv);for(let N=0,O=c.length;N<O;N++){const L=c[N],k=L.color,U=L.intensity,P=L.distance;let H=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===ts?H=L.shadow.map.texture:H=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)h+=k.r*U,d+=k.g*U,u+=k.b*U;else if(L.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(L.sh.coefficients[B],U);R++}else if(L.isSunLight){const B=e.get(L);if(B.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const q=L.shadow,Z=t.get(L);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize.copy(q.mapSize).multiply(q.getFrameExtents()),n.sunShadow[p]=Z,n.sunShadowMap[p]=H;const ae=q.getViewportCount();for(let Se=0;Se<ae;Se++)n.sunShadowMatrix[y+Se]=q.getMatrix(Se),n.sunShadowCascade[y+Se]=q._cascadeData[Se];y+=ae,p++}n.sun[f]=B,f++}else if(L.isDirectionalLight){const B=e.get(L);if(B.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const q=L.shadow,Z=t.get(L);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,n.directionalShadow[m]=Z,n.directionalShadowMap[m]=H,n.directionalShadowMatrix[m]=L.shadow.matrix,S++}n.directional[m]=B,m++}else if(L.isSpotLight){const B=e.get(L);B.position.setFromMatrixPosition(L.matrixWorld),B.color.copy(k).multiplyScalar(U),B.distance=P,B.coneCos=Math.cos(L.angle),B.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),B.decay=L.decay,n.spot[_]=B;const q=L.shadow;if(L.map&&(n.spotLightMap[E]=L.map,E++,q.updateMatrices(L),L.castShadow&&w++),n.spotLightMatrix[_]=q.matrix,L.castShadow){const Z=t.get(L);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,n.spotShadow[_]=Z,n.spotShadowMap[_]=H,x++}_++}else if(L.isRectAreaLight){const B=e.get(L);B.color.copy(k).multiplyScalar(U),B.halfWidth.set(L.width*.5,0,0),B.halfHeight.set(0,L.height*.5,0),n.rectArea[v]=B,v++}else if(L.isPointLight){const B=e.get(L);if(B.color.copy(L.color).multiplyScalar(L.intensity),B.distance=L.distance,B.decay=L.decay,L.castShadow){const q=L.shadow,Z=t.get(L);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,Z.shadowCameraNear=q.camera.near,Z.shadowCameraFar=q.camera.far,n.pointShadow[g]=Z,n.pointShadowMap[g]=H,n.pointShadowMatrix[g]=L.shadow.matrix,b++}n.point[g]=B,g++}else if(L.isHemisphereLight){const B=e.get(L);B.skyColor.copy(L.color).multiplyScalar(U),B.groundColor.copy(L.groundColor).multiplyScalar(U),n.hemi[M]=B,M++}}v>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=_e.LTC_FLOAT_1,n.rectAreaLTC2=_e.LTC_FLOAT_2):(n.rectAreaLTC1=_e.LTC_HALF_1,n.rectAreaLTC2=_e.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const I=n.hash;(I.sunLength!==f||I.directionalLength!==m||I.pointLength!==g||I.spotLength!==_||I.rectAreaLength!==v||I.hemiLength!==M||I.numSunShadows!==p||I.numDirectionalShadows!==S||I.numPointShadows!==b||I.numSpotShadows!==x||I.numSpotMaps!==E||I.numLightProbes!==R)&&(n.sun.length=f,n.directional.length=m,n.spot.length=_,n.rectArea.length=v,n.point.length=g,n.hemi.length=M,n.sunShadow.length=p,n.sunShadowMap.length=p,n.sunShadowMatrix.length=y,n.sunShadowCascade.length=y,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.directionalShadowMatrix.length=S,n.pointShadow.length=b,n.pointShadowMap.length=b,n.pointShadowMatrix.length=b,n.spotShadow.length=x,n.spotShadowMap.length=x,n.spotLightMatrix.length=x+E-w,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=R,I.sunLength=f,I.directionalLength=m,I.pointLength=g,I.spotLength=_,I.rectAreaLength=v,I.hemiLength=M,I.numSunShadows=p,I.numDirectionalShadows=S,I.numPointShadows=b,I.numSpotShadows=x,I.numSpotMaps=E,I.numLightProbes=R,n.version=mv++)}function l(c,h){let d=0,u=0,f=0,p=0,y=0,m=0;const g=h.matrixWorldInverse;for(let _=0,v=c.length;_<v;_++){const M=c[_];if(M.isSunLight){const S=n.sun[d];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(g),d++}else if(M.isDirectionalLight){const S=n.directional[u];S.direction.setFromMatrixPosition(M.matrixWorld),i.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(g),u++}else if(M.isSpotLight){const S=n.spot[p];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),S.direction.setFromMatrixPosition(M.matrixWorld),i.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(g),p++}else if(M.isRectAreaLight){const S=n.rectArea[y];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),a.identity(),r.copy(M.matrixWorld),r.premultiply(g),a.extractRotation(r),S.halfWidth.set(M.width*.5,0,0),S.halfHeight.set(0,M.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),y++}else if(M.isPointLight){const S=n.point[f];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),f++}else if(M.isHemisphereLight){const S=n.hemi[m];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(g),m++}}}return{setup:o,setupView:l,state:n}}function tu(s){const e=new xv(s),t=[],n=[],i=[];function r(d){h.camera=d,t.length=0,n.length=0,i.length=0}function a(d){d.isLightProbeGrid?i.push(d):t.push(d)}function o(d){n.push(d)}function l(){e.setup(t),i.sort((d,u)=>d.priority-u.priority||d.id-u.id)}function c(d){e.setupView(t,d)}const h={lightsArray:t,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function _v(s){let e=new WeakMap;function t(i,r=0){const a=e.get(i);let o;return a===void 0?(o=new tu(s),e.set(i,[o])):r>=a.length?(o=new tu(s),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const vv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,yv=`uniform sampler2D shadow_pass;
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
}`,Mv=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],Sv=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],nu=new We,Qs=new G,Eo=new G;function bv(s,e,t){let n=new br;const i=new ke,r=new ke,a=new ot,o=new oc,l=new hm,c={},h=t.maxTextureSize,d={[Fi]:tn,[tn]:Fi,[Tt]:Tt},u=new vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ke},radius:{value:4}},vertexShader:vv,fragmentShader:yv}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const p=new Bt;p.setAttribute("position",new qt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new Dt(p,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=lr;let g=this.type;this.render=function(b,x,E){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;this.type===If&&(Le("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=lr);const w=s.getRenderTarget(),R=s.getActiveCubeFace(),I=s.getActiveMipmapLevel(),N=s.state;N.setBlending(ws),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const O=g!==this.type;O&&x.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(k=>k.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,k=b.length;L<k;L++){const U=b[L],P=U.shadow;if(P===void 0){Le("WebGLShadowMap:",U,"has no shadow.");continue}if(P.autoUpdate===!1&&P.needsUpdate===!1)continue;i.copy(P.mapSize);const H=P.getFrameExtents();i.multiply(H),r.copy(P.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/H.x),i.x=r.x*H.x,P.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/H.y),i.y=r.y*H.y,P.mapSize.y=r.y));const B=s.state.buffers.depth.getReversed();if(P.camera._reversedDepth=B,P.map===null||O===!0){if(P.map!==null&&(P.map.depthTexture!==null&&(P.map.depthTexture.dispose(),P.map.depthTexture=null),P.map.dispose()),this.type===ir){if(U.isPointLight){Le("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}P.map=new In(i.x,i.y,{format:ts,type:Dn,minFilter:Pt,magFilter:Pt,generateMipmaps:!1}),P.map.texture.name=U.name+".shadowMap",P.map.depthTexture=new Us(i.x,i.y,xn),P.map.depthTexture.name=U.name+".shadowMapDepth",P.map.depthTexture.format=ki,P.map.depthTexture.compareFunction=null,P.map.depthTexture.minFilter=_t,P.map.depthTexture.magFilter=_t}else U.isPointLight?(P.map=new fc(i.x),P.map.depthTexture=new vd(i.x,Zn)):(P.map=new In(i.x,i.y),P.map.depthTexture=new Us(i.x,i.y,Zn)),P.map.depthTexture.name=U.name+".shadowMap",P.map.depthTexture.format=ki,this.type===lr?(P.map.depthTexture.compareFunction=B?rd:sd,P.map.depthTexture.minFilter=Pt,P.map.depthTexture.magFilter=Pt):(P.map.depthTexture.compareFunction=null,P.map.depthTexture.minFilter=_t,P.map.depthTexture.magFilter=_t);P.camera.updateProjectionMatrix()}P.map.isWebGLCubeRenderTarget!==!0&&(P.map.width!==i.x||P.map.height!==i.y)&&P.map.setSize(i.x,i.y);const q=P.map.isWebGLCubeRenderTarget?6:P.getViewportCount();U.isPointLight!==!0&&P.updateMatrices(U,E);const Z=(P.camera.layers.mask&4294967294)!==0?P.camera.layers:E.layers;for(let ae=0;ae<q;ae++){const Se=P.getCamera(ae);if(U.isPointLight){const $=P.camera,ie=P.matrix,Me=U.distance||$.far;Me!==$.far&&($.far=Me,$.updateProjectionMatrix()),Qs.setFromMatrixPosition(U.matrixWorld),$.position.copy(Qs),Eo.copy($.position),Eo.add(Mv[ae]),$.up.copy(Sv[ae]),$.lookAt(Eo),$.updateMatrixWorld(),ie.makeTranslation(-Qs.x,-Qs.y,-Qs.z),nu.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),P._frustum.setFromProjectionMatrix(nu,$.coordinateSystem,$.reversedDepth)}if(P.map.isWebGLCubeRenderTarget)s.setRenderTarget(P.map,ae),s.clear();else{ae===0&&(s.setRenderTarget(P.map),s.clear());const $=P.getViewport(ae);a.set(r.x*$.x,r.y*$.y,r.x*$.z,r.y*$.w),N.viewport(a)}n=P.getFrustum(ae),M(x,E,Se,U,Z,this.type)}P.isPointLightShadow!==!0&&this.type===ir&&_(P,E),P.needsUpdate=!1}g=this.type,m.needsUpdate=!1,s.setRenderTarget(w,R,I)};function _(b,x){const E=e.update(y);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,f.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),b.mapPass===null?b.mapPass=new In(i.x,i.y,{format:ts,type:Dn}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),u.uniforms.shadow_pass.value=b.map.depthTexture,u.uniforms.resolution.value.set(b.map.width,b.map.height),u.uniforms.radius.value=b.radius,s.setRenderTarget(b.mapPass),s.clear(),s.renderBufferDirect(x,null,E,u,y,null),f.uniforms.shadow_pass.value=b.mapPass.texture,f.uniforms.resolution.value.set(b.map.width,b.map.height),f.uniforms.radius.value=b.radius,s.setRenderTarget(b.map),s.clear(),s.renderBufferDirect(x,null,E,f,y,null)}function v(b,x,E,w){let R=null;const I=E.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(I!==void 0)R=I;else if(R=E.isPointLight===!0?l:o,s.localClippingEnabled&&x.clipShadows===!0&&Array.isArray(x.clippingPlanes)&&x.clippingPlanes.length!==0||x.displacementMap&&x.displacementScale!==0||x.alphaMap&&x.alphaTest>0||x.map&&x.alphaTest>0||x.alphaToCoverage===!0){const N=R.uuid,O=x.uuid;let L=c[N];L===void 0&&(L={},c[N]=L);let k=L[O];k===void 0&&(k=R.clone(),L[O]=k,x.addEventListener("dispose",S)),R=k}if(R.visible=x.visible,R.wireframe=x.wireframe,w===ir?R.side=x.shadowSide!==null?x.shadowSide:x.side:R.side=x.shadowSide!==null?x.shadowSide:d[x.side],R.alphaMap=x.alphaMap,R.alphaTest=x.alphaToCoverage===!0?.5:x.alphaTest,R.map=x.map,R.clipShadows=x.clipShadows,R.clippingPlanes=x.clippingPlanes,R.clipIntersection=x.clipIntersection,R.displacementMap=x.displacementMap,R.displacementScale=x.displacementScale,R.displacementBias=x.displacementBias,R.wireframeLinewidth=x.wireframeLinewidth,R.linewidth=x.linewidth,E.isPointLight===!0&&R.isMeshDistanceMaterial===!0){const N=s.properties.get(R);N.light=E}return R}function M(b,x,E,w,R,I){if(b.visible===!1)return;if(b.layers.test(R)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&I===ir)&&(!b.frustumCulled||b.intersectsFrustum(n))){b.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,b.matrixWorld);const L=e.update(b),k=b.material;if(Array.isArray(k)){const U=L.groups;for(let P=0,H=U.length;P<H;P++){const B=U[P],q=k[B.materialIndex];if(q&&q.visible){const Z=v(b,q,w,I);b.onBeforeShadow(s,b,x,E,L,Z,B),s.renderBufferDirect(E,null,L,Z,b,B),b.onAfterShadow(s,b,x,E,L,Z,B)}}}else if(k.visible){const U=v(b,k,w,I);b.onBeforeShadow(s,b,x,E,L,U,null),s.renderBufferDirect(E,null,L,U,b,null),b.onAfterShadow(s,b,x,E,L,U,null)}}const O=b.children;for(let L=0,k=O.length;L<k;L++)M(O[L],x,E,w,R,I)}function S(b){b.target.removeEventListener("dispose",S);for(const E in c){const w=c[E],R=b.target.uuid;R in w&&(w[R].dispose(),delete w[R])}}}function Ev(s,e){function t(){let D=!1;const j=new ot;let K=null;const he=new ot(0,0,0,0);return{setMask:function(re){K!==re&&!D&&(s.colorMask(re,re,re,re),K=re)},setLocked:function(re){D=re},setClear:function(re,le,Pe,Ye,se){se===!0&&(re*=Ye,le*=Ye,Pe*=Ye),j.set(re,le,Pe,Ye),he.equals(j)===!1&&(s.clearColor(re,le,Pe,Ye),he.copy(j))},reset:function(){D=!1,K=null,he.set(-1,0,0,0)}}}function n(){let D=!1,j=!1,K=null,he=null,re=null;return{setReversed:function(le){if(j!==le){const Pe=e.get("EXT_clip_control");le?Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.ZERO_TO_ONE_EXT):Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.NEGATIVE_ONE_TO_ONE_EXT),j=le;const Ye=re;re=null,this.setClear(Ye)}},getReversed:function(){return j},setTest:function(le){le?fe(s.DEPTH_TEST):te(s.DEPTH_TEST)},setMask:function(le){K!==le&&!D&&(s.depthMask(le),K=le)},setFunc:function(le){if(j&&(le=pp[le]),he!==le){switch(le){case Go:s.depthFunc(s.NEVER);break;case Ho:s.depthFunc(s.ALWAYS);break;case Vo:s.depthFunc(s.LESS);break;case mr:s.depthFunc(s.LEQUAL);break;case Wo:s.depthFunc(s.EQUAL);break;case Xo:s.depthFunc(s.GEQUAL);break;case qo:s.depthFunc(s.GREATER);break;case Yo:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}he=le}},setLocked:function(le){D=le},setClear:function(le){re!==le&&(re=le,j&&(le=1-le),s.clearDepth(le))},reset:function(){D=!1,K=null,he=null,re=null,j=!1}}}function i(){let D=!1,j=null,K=null,he=null,re=null,le=null,Pe=null,Ye=null,se=null;return{setTest:function(Ie){D||(Ie?fe(s.STENCIL_TEST):te(s.STENCIL_TEST))},setMask:function(Ie){j!==Ie&&!D&&(s.stencilMask(Ie),j=Ie)},setFunc:function(Ie,Xe,xe){(K!==Ie||he!==Xe||re!==xe)&&(s.stencilFunc(Ie,Xe,xe),K=Ie,he=Xe,re=xe)},setOp:function(Ie,Xe,xe){(le!==Ie||Pe!==Xe||Ye!==xe)&&(s.stencilOp(Ie,Xe,xe),le=Ie,Pe=Xe,Ye=xe)},setLocked:function(Ie){D=Ie},setClear:function(Ie){se!==Ie&&(s.clearStencil(Ie),se=Ie)},reset:function(){D=!1,j=null,K=null,he=null,re=null,le=null,Pe=null,Ye=null,se=null}}}const r=new t,a=new n,o=new i;let l={};const c=new WeakMap;let h={},d={},u={},f=new WeakMap,p=[],y=null,m=!1,g=null,_=null,v=null,M=null,S=null,b=null,x=null,E=new Ce(0,0,0),w=0,R=!1,I=null,N=null,O=null,L=null,k=null;const U=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let P=!1,H=0;const B=s.getParameter(s.VERSION);B.indexOf("WebGL")!==-1?(H=parseFloat(/^WebGL (\d)/.exec(B)[1]),P=H>=1):B.indexOf("OpenGL ES")!==-1&&(H=parseFloat(/^OpenGL ES (\d)/.exec(B)[1]),P=H>=2);let q=null,Z={};const ae=s.getParameter(s.SCISSOR_BOX),Se=s.getParameter(s.VIEWPORT),$=new ot().fromArray(ae),ie=new ot().fromArray(Se);function Me(D,j,K,he){const re=new Uint8Array(4),le=s.createTexture();s.bindTexture(D,le),s.texParameteri(D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(D,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Pe=0;Pe<K;Pe++)D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?s.texImage3D(j,0,s.RGBA,1,1,he,0,s.RGBA,s.UNSIGNED_BYTE,re):s.texImage2D(j+Pe,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,re);return le}const we={};we[s.TEXTURE_2D]=Me(s.TEXTURE_2D,s.TEXTURE_2D,1),we[s.TEXTURE_CUBE_MAP]=Me(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),we[s.TEXTURE_2D_ARRAY]=Me(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),we[s.TEXTURE_3D]=Me(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),fe(s.DEPTH_TEST),a.setFunc(mr),wt(!1),bt(zc),fe(s.CULL_FACE),He(ws);function fe(D){h[D]!==!0&&(s.enable(D),h[D]=!0)}function te(D){h[D]!==!1&&(s.disable(D),h[D]=!1)}function ye(D,j){return u[D]!==j?(s.bindFramebuffer(D,j),u[D]=j,D===s.DRAW_FRAMEBUFFER&&(u[s.FRAMEBUFFER]=j),D===s.FRAMEBUFFER&&(u[s.DRAW_FRAMEBUFFER]=j),!0):!1}function ue(D,j){let K=p,he=!1;if(D){K=f.get(j),K===void 0&&(K=[],f.set(j,K));const re=D.textures;if(K.length!==re.length||K[0]!==s.COLOR_ATTACHMENT0){for(let le=0,Pe=re.length;le<Pe;le++)K[le]=s.COLOR_ATTACHMENT0+le;K.length=re.length,he=!0}}else K[0]!==s.BACK&&(K[0]=s.BACK,he=!0);he&&s.drawBuffers(K)}function $e(D){return y!==D?(s.useProgram(D),y=D,!0):!1}const et={[Ss]:s.FUNC_ADD,[Df]:s.FUNC_SUBTRACT,[Uf]:s.FUNC_REVERSE_SUBTRACT};et[Ff]=s.MIN,et[Of]=s.MAX;const Ge={[kf]:s.ZERO,[Bf]:s.ONE,[zf]:s.SRC_COLOR,[zu]:s.SRC_ALPHA,[qf]:s.SRC_ALPHA_SATURATE,[Wf]:s.DST_COLOR,[Hf]:s.DST_ALPHA,[Gf]:s.ONE_MINUS_SRC_COLOR,[Gu]:s.ONE_MINUS_SRC_ALPHA,[Xf]:s.ONE_MINUS_DST_COLOR,[Vf]:s.ONE_MINUS_DST_ALPHA,[Yf]:s.CONSTANT_COLOR,[$f]:s.ONE_MINUS_CONSTANT_COLOR,[Kf]:s.CONSTANT_ALPHA,[Zf]:s.ONE_MINUS_CONSTANT_ALPHA};function He(D,j,K,he,re,le,Pe,Ye,se,Ie){if(D===ws){m===!0&&(te(s.BLEND),m=!1);return}if(m===!1&&(fe(s.BLEND),m=!0),D!==Nf){if(D!==g||Ie!==R){if((_!==Ss||S!==Ss)&&(s.blendEquation(s.FUNC_ADD),_=Ss,S=Ss),Ie)switch(D){case cr:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case zo:s.blendFunc(s.ONE,s.ONE);break;case Gc:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Hc:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Ue("WebGLState: Invalid blending: ",D);break}else switch(D){case cr:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case zo:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Gc:Ue("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Hc:Ue("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ue("WebGLState: Invalid blending: ",D);break}v=null,M=null,b=null,x=null,E.set(0,0,0),w=0,g=D,R=Ie}return}re=re||j,le=le||K,Pe=Pe||he,(j!==_||re!==S)&&(s.blendEquationSeparate(et[j],et[re]),_=j,S=re),(K!==v||he!==M||le!==b||Pe!==x)&&(s.blendFuncSeparate(Ge[K],Ge[he],Ge[le],Ge[Pe]),v=K,M=he,b=le,x=Pe),(Ye.equals(E)===!1||se!==w)&&(s.blendColor(Ye.r,Ye.g,Ye.b,se),E.copy(Ye),w=se),g=D,R=!1}function lt(D,j){D.side===Tt?te(s.CULL_FACE):fe(s.CULL_FACE);let K=D.side===tn;j&&(K=!K),wt(K),D.blending===cr&&D.transparent===!1?He(ws):He(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),r.setMask(D.colorWrite);const he=D.stencilWrite;o.setTest(he),he&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),zt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?fe(s.SAMPLE_ALPHA_TO_COVERAGE):te(s.SAMPLE_ALPHA_TO_COVERAGE)}function wt(D){I!==D&&(D?s.frontFace(s.CW):s.frontFace(s.CCW),I=D)}function bt(D){D!==Pf?(fe(s.CULL_FACE),D!==N&&(D===zc?s.cullFace(s.BACK):D===Lf?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):te(s.CULL_FACE),N=D}function On(D){D!==O&&(P&&s.lineWidth(D),O=D)}function zt(D,j,K){D?(fe(s.POLYGON_OFFSET_FILL),(L!==j||k!==K)&&(L=j,k=K,a.getReversed()&&(j=-j,K=-K),s.polygonOffset(j,K))):te(s.POLYGON_OFFSET_FILL)}function un(D){D?fe(s.SCISSOR_TEST):te(s.SCISSOR_TEST)}function dn(D){D===void 0&&(D=s.TEXTURE0+U-1),q!==D&&(s.activeTexture(D),q=D)}function fn(D,j,K){K===void 0&&(q===null?K=s.TEXTURE0+U-1:K=q);let he=Z[K];he===void 0&&(he={type:void 0,texture:void 0},Z[K]=he),(he.type!==D||he.texture!==j)&&(q!==K&&(s.activeTexture(K),q=K),s.bindTexture(D,j||we[D]),he.type=D,he.texture=j)}function z(){const D=Z[q];D!==void 0&&D.type!==void 0&&(s.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function pn(){try{s.compressedTexImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function vt(){try{s.compressedTexImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function yt(){try{s.texSubImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ge(){try{s.texSubImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function Ut(){try{s.compressedTexSubImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function Ne(){try{s.compressedTexSubImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function Fe(){try{s.texStorage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function C(){try{s.texStorage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function T(){try{s.texImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function W(){try{s.texImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ne(D){return d[D]!==void 0?d[D]:s.getParameter(D)}function ee(D,j){d[D]!==j&&(s.pixelStorei(D,j),d[D]=j)}function oe(D){$.equals(D)===!1&&(s.scissor(D.x,D.y,D.z,D.w),$.copy(D))}function pe(D){ie.equals(D)===!1&&(s.viewport(D.x,D.y,D.z,D.w),ie.copy(D))}function J(D,j){let K=c.get(j);K===void 0&&(K=new WeakMap,c.set(j,K));let he=K.get(D);he===void 0&&(he=s.getUniformBlockIndex(j,D.name),s.uniformBlockBinding(j,he,he),K.set(D,he))}function Q(D,j,K){const re=c.get(j).get(D);l[re]!==K&&(s.bindBufferBase(s.UNIFORM_BUFFER,re,K),l[re]=K)}function ce(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),h={},d={},q=null,Z={},u={},l={},f=new WeakMap,p=[],y=null,m=!1,g=null,_=null,v=null,M=null,S=null,b=null,x=null,E=new Ce(0,0,0),w=0,R=!1,I=null,N=null,O=null,L=null,k=null,$.set(0,0,s.canvas.width,s.canvas.height),ie.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:fe,disable:te,bindFramebuffer:ye,drawBuffers:ue,useProgram:$e,setBlending:He,setMaterial:lt,setFlipSided:wt,setCullFace:bt,setLineWidth:On,setPolygonOffset:zt,setScissorTest:un,activeTexture:dn,bindTexture:fn,unbindTexture:z,compressedTexImage2D:pn,compressedTexImage3D:vt,texImage2D:T,texImage3D:W,pixelStorei:ee,getParameter:ne,updateUBOMapping:J,uniformBlockBinding:Q,texStorage2D:Fe,texStorage3D:C,texSubImage2D:yt,texSubImage3D:ge,compressedTexSubImage2D:Ut,compressedTexSubImage3D:Ne,scissor:oe,viewport:pe,reset:ce}}function Tv(s,e,t,n,i,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ke,h=new WeakMap,d=new Set;let u;const f=new WeakMap,p=new Set,y=new FinalizationRegistry(C=>p.delete(C));let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(C,T){return m?new OffscreenCanvas(C,T):Sr("canvas")}function _(C,T,W){let ne=1;const ee=Fe(C);if((ee.width>W||ee.height>W)&&(ne=W/Math.max(ee.width,ee.height)),ne<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const oe=Math.floor(ne*ee.width),pe=Math.floor(ne*ee.height);u===void 0&&(u=g(oe,pe));const J=T?g(oe,pe):u;return J.width=oe,J.height=pe,J.getContext("2d").drawImage(C,0,0,oe,pe),Le("WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+oe+"x"+pe+")."),J}else return"data"in C&&Le("WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),C;return C}function v(C){return C.generateMipmaps}function M(C){s.generateMipmap(C)}function S(C){return C.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?s.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function b(C,T,W,ne,ee,oe=!1){if(C!==null){if(s[C]!==void 0)return s[C];Le("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let pe;ne&&(pe=e.get("EXT_texture_norm16"),pe||Le("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=T;if(T===s.RED&&(W===s.FLOAT&&(J=s.R32F),W===s.HALF_FLOAT&&(J=s.R16F),W===s.UNSIGNED_BYTE&&(J=s.R8),W===s.UNSIGNED_SHORT&&pe&&(J=pe.R16_EXT),W===s.SHORT&&pe&&(J=pe.R16_SNORM_EXT)),T===s.RED_INTEGER&&(W===s.UNSIGNED_BYTE&&(J=s.R8UI),W===s.UNSIGNED_SHORT&&(J=s.R16UI),W===s.UNSIGNED_INT&&(J=s.R32UI),W===s.BYTE&&(J=s.R8I),W===s.SHORT&&(J=s.R16I),W===s.INT&&(J=s.R32I)),T===s.RG&&(W===s.FLOAT&&(J=s.RG32F),W===s.HALF_FLOAT&&(J=s.RG16F),W===s.UNSIGNED_BYTE&&(J=s.RG8),W===s.UNSIGNED_SHORT&&pe&&(J=pe.RG16_EXT),W===s.SHORT&&pe&&(J=pe.RG16_SNORM_EXT)),T===s.RG_INTEGER&&(W===s.UNSIGNED_BYTE&&(J=s.RG8UI),W===s.UNSIGNED_SHORT&&(J=s.RG16UI),W===s.UNSIGNED_INT&&(J=s.RG32UI),W===s.BYTE&&(J=s.RG8I),W===s.SHORT&&(J=s.RG16I),W===s.INT&&(J=s.RG32I)),T===s.RGB_INTEGER&&(W===s.UNSIGNED_BYTE&&(J=s.RGB8UI),W===s.UNSIGNED_SHORT&&(J=s.RGB16UI),W===s.UNSIGNED_INT&&(J=s.RGB32UI),W===s.BYTE&&(J=s.RGB8I),W===s.SHORT&&(J=s.RGB16I),W===s.INT&&(J=s.RGB32I)),T===s.RGBA_INTEGER&&(W===s.UNSIGNED_BYTE&&(J=s.RGBA8UI),W===s.UNSIGNED_SHORT&&(J=s.RGBA16UI),W===s.UNSIGNED_INT&&(J=s.RGBA32UI),W===s.BYTE&&(J=s.RGBA8I),W===s.SHORT&&(J=s.RGBA16I),W===s.INT&&(J=s.RGBA32I)),T===s.RGB&&(W===s.UNSIGNED_SHORT&&pe&&(J=pe.RGB16_EXT),W===s.SHORT&&pe&&(J=pe.RGB16_SNORM_EXT),W===s.UNSIGNED_INT_5_9_9_9_REV&&(J=s.RGB9_E5),W===s.UNSIGNED_INT_10F_11F_11F_REV&&(J=s.R11F_G11F_B10F)),T===s.RGBA){const Q=oe?wa:Ze.getTransfer(ee);W===s.FLOAT&&(J=s.RGBA32F),W===s.HALF_FLOAT&&(J=s.RGBA16F),W===s.UNSIGNED_BYTE&&(J=Q===rt?s.SRGB8_ALPHA8:s.RGBA8),W===s.UNSIGNED_SHORT&&pe&&(J=pe.RGBA16_EXT),W===s.SHORT&&pe&&(J=pe.RGBA16_SNORM_EXT),W===s.UNSIGNED_SHORT_4_4_4_4&&(J=s.RGBA4),W===s.UNSIGNED_SHORT_5_5_5_1&&(J=s.RGB5_A1)}return(J===s.R16F||J===s.R32F||J===s.RG16F||J===s.RG32F||J===s.RGBA16F||J===s.RGBA32F)&&e.get("EXT_color_buffer_float"),J}function x(C,T){let W;return C?T===null||T===Zn||T===Is?W=s.DEPTH24_STENCIL8:T===xn?W=s.DEPTH32F_STENCIL8:T===xr&&(W=s.DEPTH24_STENCIL8,Le("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Zn||T===Is?W=s.DEPTH_COMPONENT24:T===xn?W=s.DEPTH_COMPONENT32F:T===xr&&(W=s.DEPTH_COMPONENT16),W}function E(C,T){return v(C)===!0||C.isFramebufferTexture&&C.minFilter!==_t&&C.minFilter!==Pt?Math.log2(Math.max(T.width,T.height))+1:C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?T.mipmaps.length:1}function w(C){const T=new WeakRef(C);n.get(C).__ref=T,p.add(T),y.register(C,T,T)}function R(C){const T=n.get(C).__ref;T!==void 0&&(p.delete(T),y.unregister(T))}function I(C){O(C.target)}function N(C){L(C.target)}function O(C){C.removeEventListener("dispose",I),R(C),U(C),C.isVideoTexture&&h.delete(C),C.isHTMLTexture&&d.delete(C)}function L(C){C.removeEventListener("dispose",N),R(C),H(C)}function k(){for(const C of p){const T=C.deref();T!==void 0&&(T.isRenderTarget===!0?L(T):O(T))}p.clear(),d.clear()}function U(C){const T=n.get(C);if(T.__webglInit===void 0)return;const W=C.source,ne=f.get(W);if(ne){const ee=ne[T.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&P(C),Object.keys(ne).length===0&&f.delete(W)}n.remove(C)}function P(C){const T=n.get(C);s.deleteTexture(T.__webglTexture);const W=C.source,ne=f.get(W);delete ne[T.__cacheKey],a.memory.textures--}function H(C){const T=n.get(C);T.__depthDisposeCallback&&T.__depthDisposeCallback();const W=C.depthTexture;if(W&&W.renderTarget===C&&O(W),C.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(T.__webglFramebuffer[ee]))for(let oe=0;oe<T.__webglFramebuffer[ee].length;oe++)s.deleteFramebuffer(T.__webglFramebuffer[ee][oe]);else s.deleteFramebuffer(T.__webglFramebuffer[ee]);T.__webglDepthbuffer&&s.deleteRenderbuffer(T.__webglDepthbuffer[ee])}else{if(Array.isArray(T.__webglFramebuffer))for(let ee=0;ee<T.__webglFramebuffer.length;ee++)s.deleteFramebuffer(T.__webglFramebuffer[ee]);else s.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&s.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&s.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let ee=0;ee<T.__webglColorRenderbuffer.length;ee++)T.__webglColorRenderbuffer[ee]&&s.deleteRenderbuffer(T.__webglColorRenderbuffer[ee]);T.__webglDepthRenderbuffer&&s.deleteRenderbuffer(T.__webglDepthRenderbuffer)}const ne=C.textures;for(let ee=0,oe=ne.length;ee<oe;ee++){const pe=n.get(ne[ee]);pe.__webglTexture&&(s.deleteTexture(pe.__webglTexture),a.memory.textures--),n.remove(ne[ee])}n.remove(C)}let B=0;function q(){B=0}function Z(){return B}function ae(C){B=C}function Se(){const C=B;return C>=i.maxTextures&&Le("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+i.maxTextures),B+=1,C}function $(C){const T=[];return T.push(C.wrapS),T.push(C.wrapT),T.push(C.wrapR||0),T.push(C.magFilter),T.push(C.minFilter),T.push(C.anisotropy),T.push(C.internalFormat),T.push(C.format),T.push(C.type),T.push(C.generateMipmaps),T.push(C.mipmapsAutoUpdate),T.push(C.premultiplyAlpha),T.push(C.flipY),T.push(C.unpackAlignment),T.push(C.colorSpace),T.join()}function ie(C,T){const W=n.get(C);if(C.isVideoTexture&&Ut(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&W.__version!==C.version){const ne=C.image;if(ne===null)Le("WebGLRenderer: Texture marked for update but no image data found.");else if(ne.complete===!1)Le("WebGLRenderer: Texture marked for update but image is incomplete");else{lt(W,C,T);return}}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,W.__webglTexture,s.TEXTURE0+T)}function Me(C,T){const W=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){lt(W,C,T);return}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(s.TEXTURE_2D_ARRAY,W.__webglTexture,s.TEXTURE0+T)}function we(C,T){const W=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){lt(W,C,T);return}t.bindTexture(s.TEXTURE_3D,W.__webglTexture,s.TEXTURE0+T)}function fe(C,T){const W=n.get(C);if(C.version>0&&W.__version!==C.version){wt(W,C,T);return}t.bindTexture(s.TEXTURE_CUBE_MAP,W.__webglTexture,s.TEXTURE0+T)}const te={[Oi]:s.REPEAT,[Xn]:s.CLAMP_TO_EDGE,[ba]:s.MIRRORED_REPEAT},ye={[_t]:s.NEAREST,[Ku]:s.NEAREST_MIPMAP_NEAREST,[sr]:s.NEAREST_MIPMAP_LINEAR,[Pt]:s.LINEAR,[ga]:s.LINEAR_MIPMAP_NEAREST,[qn]:s.LINEAR_MIPMAP_LINEAR},ue={[rp]:s.NEVER,[ad]:s.ALWAYS,[ap]:s.LESS,[sd]:s.LEQUAL,[op]:s.EQUAL,[rd]:s.GEQUAL,[lp]:s.GREATER,[cp]:s.NOTEQUAL};function $e(C,T){if(T.type===xn&&e.has("OES_texture_float_linear")===!1&&(T.magFilter===Pt||T.magFilter===ga||T.magFilter===sr||T.magFilter===qn||T.minFilter===Pt||T.minFilter===ga||T.minFilter===sr||T.minFilter===qn)&&Le("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(C,s.TEXTURE_WRAP_S,te[T.wrapS]),s.texParameteri(C,s.TEXTURE_WRAP_T,te[T.wrapT]),(C===s.TEXTURE_3D||C===s.TEXTURE_2D_ARRAY)&&s.texParameteri(C,s.TEXTURE_WRAP_R,te[T.wrapR]),s.texParameteri(C,s.TEXTURE_MAG_FILTER,ye[T.magFilter]),s.texParameteri(C,s.TEXTURE_MIN_FILTER,ye[T.minFilter]),T.compareFunction&&(s.texParameteri(C,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(C,s.TEXTURE_COMPARE_FUNC,ue[T.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===_t||T.minFilter!==sr&&T.minFilter!==qn||T.type===xn&&e.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||n.get(T).__currentAnisotropy){const W=e.get("EXT_texture_filter_anisotropic");s.texParameterf(C,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,i.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy}}}function et(C,T){let W=!1;C.__webglInit===void 0&&(C.__webglInit=!0,T.addEventListener("dispose",I),w(T));const ne=T.source;let ee=f.get(ne);ee===void 0&&(ee={},f.set(ne,ee));const oe=$(T);if(oe!==C.__cacheKey){ee[oe]===void 0&&(ee[oe]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,W=!0),ee[oe].usedTimes++;const pe=ee[C.__cacheKey];pe!==void 0&&(ee[C.__cacheKey].usedTimes--,pe.usedTimes===0&&P(T)),C.__cacheKey=oe,C.__webglTexture=ee[oe].texture}return W}function Ge(C,T,W){return Math.floor(Math.floor(C/W)/T)}function He(C,T,W,ne){const oe=C.updateRanges;if(oe.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,T.width,T.height,W,ne,T.data);else{oe.sort((D,j)=>D.start-j.start);let pe=0;for(let D=1;D<oe.length;D++){const j=oe[pe],K=oe[D],he=j.start+j.count,re=Ge(K.start,T.width,4),le=Ge(j.start,T.width,4);K.start<=he+1&&re===le&&Ge(K.start+K.count-1,T.width,4)===re?j.count=Math.max(j.count,K.start+K.count-j.start):(++pe,oe[pe]=K)}oe.length=pe+1;const J=t.getParameter(s.UNPACK_ROW_LENGTH),Q=t.getParameter(s.UNPACK_SKIP_PIXELS),ce=t.getParameter(s.UNPACK_SKIP_ROWS);t.pixelStorei(s.UNPACK_ROW_LENGTH,T.width);for(let D=0,j=oe.length;D<j;D++){const K=oe[D],he=Math.floor(K.start/4),re=Math.ceil(K.count/4),le=he%T.width,Pe=Math.floor(he/T.width),Ye=re,se=1;t.pixelStorei(s.UNPACK_SKIP_PIXELS,le),t.pixelStorei(s.UNPACK_SKIP_ROWS,Pe),t.texSubImage2D(s.TEXTURE_2D,0,le,Pe,Ye,se,W,ne,T.data)}C.clearUpdateRanges(),t.pixelStorei(s.UNPACK_ROW_LENGTH,J),t.pixelStorei(s.UNPACK_SKIP_PIXELS,Q),t.pixelStorei(s.UNPACK_SKIP_ROWS,ce)}}function lt(C,T,W){let ne=s.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(ne=s.TEXTURE_2D_ARRAY),T.isData3DTexture&&(ne=s.TEXTURE_3D);const ee=et(C,T),oe=T.source;t.bindTexture(ne,C.__webglTexture,s.TEXTURE0+W);const pe=n.get(oe);if(oe.version!==pe.__version||ee===!0){if(t.activeTexture(s.TEXTURE0+W),(typeof ImageBitmap<"u"&&T.image instanceof ImageBitmap)===!1){const se=Ze.getPrimaries(Ze.workingColorSpace),Ie=T.colorSpace===Ii?null:Ze.getPrimaries(T.colorSpace),Xe=T.colorSpace===Ii||se===Ie?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Xe)}t.pixelStorei(s.UNPACK_ALIGNMENT,T.unpackAlignment);let Q=_(T.image,!1,i.maxTextureSize);Q=Ne(T,Q);const ce=r.convert(T.format,T.colorSpace),D=r.convert(T.type);let j=b(T.internalFormat,ce,D,T.normalized,T.colorSpace,T.isVideoTexture);$e(ne,T);let K;const he=T.mipmaps,re=T.isVideoTexture!==!0,le=pe.__version===void 0||ee===!0,Pe=oe.dataReady,Ye=E(T,Q);if(T.isDepthTexture)j=x(T.format===Di,T.type),le&&(re?t.texStorage2D(s.TEXTURE_2D,1,j,Q.width,Q.height):t.texImage2D(s.TEXTURE_2D,0,j,Q.width,Q.height,0,ce,D,null));else if(T.isDataTexture)if(he.length>0){re&&le&&t.texStorage2D(s.TEXTURE_2D,Ye,j,he[0].width,he[0].height);for(let se=0,Ie=he.length;se<Ie;se++)K=he[se],re?Pe&&t.texSubImage2D(s.TEXTURE_2D,se,0,0,K.width,K.height,ce,D,K.data):t.texImage2D(s.TEXTURE_2D,se,j,K.width,K.height,0,ce,D,K.data);T.generateMipmaps=!1}else re?(le&&t.texStorage2D(s.TEXTURE_2D,Ye,j,Q.width,Q.height),Pe&&He(T,Q,ce,D)):t.texImage2D(s.TEXTURE_2D,0,j,Q.width,Q.height,0,ce,D,Q.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){re&&le&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Ye,j,he[0].width,he[0].height,Q.depth);for(let se=0,Ie=he.length;se<Ie;se++)if(K=he[se],T.format!==Cn)if(ce!==null)if(re){if(Pe)if(T.layerUpdates.size>0){const Xe=Uh(K.width,K.height,T.format,T.type);for(const xe of T.layerUpdates){const st=K.data.subarray(xe*Xe/K.data.BYTES_PER_ELEMENT,(xe+1)*Xe/K.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,se,0,0,xe,K.width,K.height,1,ce,st)}}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,se,0,0,0,K.width,K.height,Q.depth,ce,K.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,se,j,K.width,K.height,Q.depth,0,K.data,0,0);else Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else re?Pe&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,se,0,0,0,K.width,K.height,Q.depth,ce,D,K.data):t.texImage3D(s.TEXTURE_2D_ARRAY,se,j,K.width,K.height,Q.depth,0,ce,D,K.data);T.layerUpdates.size>0&&T.clearLayerUpdates()}else{re&&le&&t.texStorage2D(s.TEXTURE_2D,Ye,j,he[0].width,he[0].height);for(let se=0,Ie=he.length;se<Ie;se++)K=he[se],T.format!==Cn?ce!==null?re?Pe&&t.compressedTexSubImage2D(s.TEXTURE_2D,se,0,0,K.width,K.height,ce,K.data):t.compressedTexImage2D(s.TEXTURE_2D,se,j,K.width,K.height,0,K.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):re?Pe&&t.texSubImage2D(s.TEXTURE_2D,se,0,0,K.width,K.height,ce,D,K.data):t.texImage2D(s.TEXTURE_2D,se,j,K.width,K.height,0,ce,D,K.data)}else if(T.isDataArrayTexture)if(re){if(le&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Ye,j,Q.width,Q.height,Q.depth),Pe)if(T.layerUpdates.size>0){const se=Uh(Q.width,Q.height,T.format,T.type);for(const Ie of T.layerUpdates){const Xe=Q.data.subarray(Ie*se/Q.data.BYTES_PER_ELEMENT,(Ie+1)*se/Q.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Ie,Q.width,Q.height,1,ce,D,Xe)}T.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,ce,D,Q.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,j,Q.width,Q.height,Q.depth,0,ce,D,Q.data);else if(T.isData3DTexture)re?(le&&t.texStorage3D(s.TEXTURE_3D,Ye,j,Q.width,Q.height,Q.depth),Pe&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,ce,D,Q.data)):t.texImage3D(s.TEXTURE_3D,0,j,Q.width,Q.height,Q.depth,0,ce,D,Q.data);else if(T.isFramebufferTexture){if(le)if(re)t.texStorage2D(s.TEXTURE_2D,Ye,j,Q.width,Q.height);else{let se=Q.width,Ie=Q.height;for(let Xe=0;Xe<Ye;Xe++)t.texImage2D(s.TEXTURE_2D,Xe,j,se,Ie,0,ce,D,null),se>>=1,Ie>>=1}}else if(T.isHTMLTexture){if("texElementImage2D"in s){const se=s.canvas;if(se.hasAttribute("layoutsubtree")||se.setAttribute("layoutsubtree","true"),Q.parentNode!==se){se.appendChild(Q),d.add(T),se.onpaint=Ie=>{const Xe=Ie.changedElements;for(const xe of d)Xe.includes(xe.image)&&(xe.needsUpdate=!0)},se.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,Q);else{const Xe=s.RGBA,xe=s.RGBA,st=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,Xe,xe,st,Q)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(he.length>0){if(re&&le){const se=Fe(he[0]);t.texStorage2D(s.TEXTURE_2D,Ye,j,se.width,se.height)}for(let se=0,Ie=he.length;se<Ie;se++)K=he[se],re?Pe&&t.texSubImage2D(s.TEXTURE_2D,se,0,0,ce,D,K):t.texImage2D(s.TEXTURE_2D,se,j,ce,D,K);T.generateMipmaps=!1}else if(re){if(le){const se=Fe(Q);t.texStorage2D(s.TEXTURE_2D,Ye,j,se.width,se.height)}Pe&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,ce,D,Q)}else t.texImage2D(s.TEXTURE_2D,0,j,ce,D,Q);v(T)&&T.mipmapsAutoUpdate===!0&&M(ne),pe.__version=oe.version,T.onUpdate&&T.onUpdate(T)}C.__version=T.version}function wt(C,T,W){if(T.image.length!==6)return;const ne=et(C,T),ee=T.source;t.bindTexture(s.TEXTURE_CUBE_MAP,C.__webglTexture,s.TEXTURE0+W);const oe=n.get(ee);if(ee.version!==oe.__version||ne===!0){t.activeTexture(s.TEXTURE0+W);const pe=Ze.getPrimaries(Ze.workingColorSpace),J=T.colorSpace===Ii?null:Ze.getPrimaries(T.colorSpace),Q=T.colorSpace===Ii||pe===J?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(s.UNPACK_ALIGNMENT,T.unpackAlignment),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);const ce=T.isCompressedTexture||T.image[0].isCompressedTexture,D=T.image[0]&&T.image[0].isDataTexture,j=[];for(let xe=0;xe<6;xe++)!ce&&!D?j[xe]=_(T.image[xe],!0,i.maxCubemapSize):j[xe]=D?T.image[xe].image:T.image[xe],j[xe]=Ne(T,j[xe]);const K=j[0],he=r.convert(T.format,T.colorSpace),re=r.convert(T.type);let le=b(T.internalFormat,he,re,T.normalized,T.colorSpace);const Pe=T.isVideoTexture!==!0,Ye=oe.__version===void 0||ne===!0,se=ee.dataReady;let Ie=E(T,K);$e(s.TEXTURE_CUBE_MAP,T);let Xe;if(T.isDepthTexture){if(le=x(T.format===Di,T.type),Ye)if(Pe)t.texStorage2D(s.TEXTURE_CUBE_MAP,1,le,K.width,K.height);else for(let xe=0;xe<6;xe++)t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,le,K.width,K.height,0,he,re,null)}else if(ce){Pe&&Ye&&t.texStorage2D(s.TEXTURE_CUBE_MAP,Ie,le,K.width,K.height);for(let xe=0;xe<6;xe++){Xe=j[xe].mipmaps;for(let st=0;st<Xe.length;st++){const Gt=Xe[st];T.format!==Cn?he!==null?Pe?se&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st,0,0,Gt.width,Gt.height,he,Gt.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st,le,Gt.width,Gt.height,0,Gt.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pe?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st,0,0,Gt.width,Gt.height,he,re,Gt.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st,le,Gt.width,Gt.height,0,he,re,Gt.data)}}}else{if(Xe=T.mipmaps,Pe&&Ye){Xe.length>0&&Ie++;const xe=Fe(j[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,Ie,le,xe.width,xe.height)}for(let xe=0;xe<6;xe++)if(D){Pe?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,j[xe].width,j[xe].height,he,re,j[xe].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,le,j[xe].width,j[xe].height,0,he,re,j[xe].data);for(let st=0;st<Xe.length;st++){const Mi=Xe[st].image[xe].image;Pe?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st+1,0,0,Mi.width,Mi.height,he,re,Mi.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st+1,le,Mi.width,Mi.height,0,he,re,Mi.data)}}else{Pe?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,he,re,j[xe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,le,he,re,j[xe]);for(let st=0;st<Xe.length;st++){const Gt=Xe[st];Pe?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st+1,0,0,he,re,Gt.image[xe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,st+1,le,he,re,Gt.image[xe])}}}v(T)&&T.mipmapsAutoUpdate===!0&&M(s.TEXTURE_CUBE_MAP),oe.__version=ee.version,T.onUpdate&&T.onUpdate(T)}C.__version=T.version}function bt(C,T,W,ne,ee,oe){const pe=r.convert(W.format,W.colorSpace),J=r.convert(W.type),Q=b(W.internalFormat,pe,J,W.normalized,W.colorSpace),ce=n.get(T),D=n.get(W);if(D.__renderTarget=T,!ce.__hasExternalTextures){const j=Math.max(1,T.width>>oe),K=Math.max(1,T.height>>oe);ee===s.TEXTURE_3D||ee===s.TEXTURE_2D_ARRAY?t.texImage3D(ee,oe,Q,j,K,T.depth,0,pe,J,null):t.texImage2D(ee,oe,Q,j,K,0,pe,J,null)}t.bindFramebuffer(s.FRAMEBUFFER,C),ge(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ne,ee,D.__webglTexture,0,yt(T)):(ee===s.TEXTURE_2D||ee>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,ne,ee,D.__webglTexture,oe),t.bindFramebuffer(s.FRAMEBUFFER,null)}function On(C,T,W){if(s.bindRenderbuffer(s.RENDERBUFFER,C),T.depthBuffer){const ne=T.depthTexture,ee=ne&&ne.isDepthTexture?ne.type:null,oe=x(T.stencilBuffer,ee),pe=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;ge(T)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,yt(T),oe,T.width,T.height):W?s.renderbufferStorageMultisample(s.RENDERBUFFER,yt(T),oe,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,oe,T.width,T.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,pe,s.RENDERBUFFER,C)}else{const ne=T.textures;for(let ee=0;ee<ne.length;ee++){const oe=ne[ee],pe=r.convert(oe.format,oe.colorSpace),J=r.convert(oe.type),Q=b(oe.internalFormat,pe,J,oe.normalized,oe.colorSpace);ge(T)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,yt(T),Q,T.width,T.height):W?s.renderbufferStorageMultisample(s.RENDERBUFFER,yt(T),Q,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,Q,T.width,T.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function zt(C,T,W){const ne=T.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(s.FRAMEBUFFER,C),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ee=n.get(T.depthTexture);ee.__renderTarget=T;const oe=ne?T.depthTexture.image[0]:T.depthTexture.image;(!ee.__webglTexture||oe.width!==T.width||oe.height!==T.height)&&(oe.width=T.width,oe.height=T.height,T.depthTexture.needsUpdate=!0),ne?fe(T.depthTexture,0):ie(T.depthTexture,0);const pe=ee.__webglTexture,J=yt(T),Q=ne?s.TEXTURE_CUBE_MAP_POSITIVE_X+W:s.TEXTURE_2D,ce=T.depthTexture.format===Di?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(T.depthTexture.format===ki)ge(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ce,Q,pe,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,ce,Q,pe,0);else if(T.depthTexture.format===Di)ge(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ce,Q,pe,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,ce,Q,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function un(C){const T=n.get(C),W=C.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==C.depthTexture){const ne=C.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),ne){const ee=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,ne.removeEventListener("dispose",ee)};ne.addEventListener("dispose",ee),T.__depthDisposeCallback=ee}T.__boundDepthTexture=ne}if(C.depthTexture&&!T.__autoAllocateDepthBuffer)if(W)for(let ne=0;ne<6;ne++)zt(T.__webglFramebuffer[ne],C,ne);else C.texture.mipmaps.length>0?zt(T.__webglFramebuffer[0],C,0):zt(T.__webglFramebuffer,C,0);else if(W){T.__webglDepthbuffer=[];for(let ne=0;ne<6;ne++)if(t.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer[ne]),T.__webglDepthbuffer[ne]===void 0)T.__webglDepthbuffer[ne]=s.createRenderbuffer(),On(T.__webglDepthbuffer[ne],C,!1);else{const ee=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,oe=T.__webglDepthbuffer[ne];s.bindRenderbuffer(s.RENDERBUFFER,oe),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,oe)}}else if(C.texture.mipmaps.length>0?t.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=s.createRenderbuffer(),On(T.__webglDepthbuffer,C,!1);else{const ee=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,oe=T.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,oe),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,oe)}t.bindFramebuffer(s.FRAMEBUFFER,null)}function dn(C,T,W){const ne=n.get(C);T!==void 0&&bt(ne.__webglFramebuffer,C,C.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),W!==void 0&&un(C)}function fn(C){const T=C.texture,W=n.get(C),ne=n.get(T);C.addEventListener("dispose",N),w(C);const ee=C.textures,oe=C.isWebGLCubeRenderTarget===!0,pe=ee.length>1;if(pe||(ne.__webglTexture===void 0&&(ne.__webglTexture=s.createTexture()),ne.__version=T.version,a.memory.textures++),oe){W.__webglFramebuffer=[];for(let J=0;J<6;J++)if(T.mipmaps.length>0){W.__webglFramebuffer[J]=[];for(let Q=0;Q<T.mipmaps.length;Q++)W.__webglFramebuffer[J][Q]=s.createFramebuffer()}else W.__webglFramebuffer[J]=s.createFramebuffer()}else{if(T.mipmaps.length>0){W.__webglFramebuffer=[];for(let J=0;J<T.mipmaps.length;J++)W.__webglFramebuffer[J]=s.createFramebuffer()}else W.__webglFramebuffer=s.createFramebuffer();if(pe)for(let J=0,Q=ee.length;J<Q;J++){const ce=n.get(ee[J]);ce.__webglTexture===void 0&&(ce.__webglTexture=s.createTexture(),a.memory.textures++)}if(C.samples>0&&ge(C)===!1){W.__webglMultisampledFramebuffer=s.createFramebuffer(),W.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let J=0;J<ee.length;J++){const Q=ee[J];W.__webglColorRenderbuffer[J]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,W.__webglColorRenderbuffer[J]);const ce=r.convert(Q.format,Q.colorSpace),D=r.convert(Q.type),j=b(Q.internalFormat,ce,D,Q.normalized,Q.colorSpace,C.isXRRenderTarget===!0),K=yt(C);s.renderbufferStorageMultisample(s.RENDERBUFFER,K,j,C.width,C.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+J,s.RENDERBUFFER,W.__webglColorRenderbuffer[J])}s.bindRenderbuffer(s.RENDERBUFFER,null),C.depthBuffer&&(W.__webglDepthRenderbuffer=s.createRenderbuffer(),On(W.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(oe){t.bindTexture(s.TEXTURE_CUBE_MAP,ne.__webglTexture),$e(s.TEXTURE_CUBE_MAP,T);for(let J=0;J<6;J++)if(T.mipmaps.length>0)for(let Q=0;Q<T.mipmaps.length;Q++)bt(W.__webglFramebuffer[J][Q],C,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+J,Q);else bt(W.__webglFramebuffer[J],C,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);v(T)?M(s.TEXTURE_CUBE_MAP):T.mipmaps.length>0&&s.texParameteri(s.TEXTURE_CUBE_MAP,s.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),t.unbindTexture()}else if(pe){for(let J=0,Q=ee.length;J<Q;J++){const ce=ee[J],D=n.get(ce);let j=s.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(j=C.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(j,D.__webglTexture),$e(j,ce),bt(W.__webglFramebuffer,C,ce,s.COLOR_ATTACHMENT0+J,j,0),v(ce)&&M(j)}t.unbindTexture()}else{let J=s.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(J=C.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(J,ne.__webglTexture),$e(J,T),T.mipmaps.length>0)for(let Q=0;Q<T.mipmaps.length;Q++)bt(W.__webglFramebuffer[Q],C,T,s.COLOR_ATTACHMENT0,J,Q);else bt(W.__webglFramebuffer,C,T,s.COLOR_ATTACHMENT0,J,0);v(T)?M(J):T.mipmaps.length>0&&s.texParameteri(J,s.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),t.unbindTexture()}C.depthBuffer&&un(C)}function z(C){const T=C.textures;for(let W=0,ne=T.length;W<ne;W++){const ee=T[W];if(v(ee)&&ee.mipmapsAutoUpdate===!0){const oe=S(C),pe=n.get(ee).__webglTexture;t.bindTexture(oe,pe),M(oe),t.unbindTexture()}}}const pn=[];function vt(C){if(C.samples>0){if(ge(C)===!1){const T=C.textures,W=C.width,ne=C.height;let ee=s.COLOR_BUFFER_BIT;const oe=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,pe=n.get(C),J=T.length>1;if(J)for(let ce=0;ce<T.length;ce++)t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ce,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ce,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,pe.__webglMultisampledFramebuffer),C.texture.mipmaps.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let ce=0;ce<T.length;ce++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(ee|=s.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(ee|=s.STENCIL_BUFFER_BIT)),J){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,pe.__webglColorRenderbuffer[ce]);const D=n.get(T[ce]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,D,0)}s.blitFramebuffer(0,0,W,ne,0,0,W,ne,ee,s.NEAREST),l===!0&&(pn.length=0,pn.push(s.COLOR_ATTACHMENT0+ce),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&pn.push(oe),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,pn))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),J)for(let ce=0;ce<T.length;ce++){t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ce,s.RENDERBUFFER,pe.__webglColorRenderbuffer[ce]);const D=n.get(T[ce]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ce,s.TEXTURE_2D,D,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){const T=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[T])}}}function yt(C){return Math.min(i.maxSamples,C.samples)}function ge(C){const T=n.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function Ut(C){const T=a.render.frame;h.get(C)!==T&&(h.set(C,T),C.update())}function Ne(C,T){const W=C.colorSpace,ne=C.format,ee=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||W!==hn&&W!==Ii&&(Ze.getTransfer(W)===rt?(ne!==Cn||ee!==cn)&&Le("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ue("WebGLTextures: Unsupported texture color space:",W)),T}function Fe(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=Se,this.resetTextureUnits=q,this.getTextureUnits=Z,this.setTextureUnits=ae,this.setTexture2D=ie,this.setTexture2DArray=Me,this.setTexture3D=we,this.setTextureCube=fe,this.rebindTextures=dn,this.setupRenderTarget=fn,this.updateRenderTargetMipmap=z,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=un,this.setupFrameBufferTexture=bt,this.useMultisampledRTT=ge,this.dispose=k}function Av(s,e){function t(n,i=Ii){let r;const a=Ze.getTransfer(i);if(n===cn)return s.UNSIGNED_BYTE;if(n===Gl)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Hl)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Qu)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===ju)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===Zu)return s.BYTE;if(n===Ju)return s.SHORT;if(n===xr)return s.UNSIGNED_SHORT;if(n===zl)return s.INT;if(n===Zn)return s.UNSIGNED_INT;if(n===xn)return s.FLOAT;if(n===Dn)return s.HALF_FLOAT;if(n===ed)return s.ALPHA;if(n===td)return s.RGB;if(n===Cn)return s.RGBA;if(n===ki)return s.DEPTH_COMPONENT;if(n===Di)return s.DEPTH_STENCIL;if(n===Vl)return s.RED;if(n===Wl)return s.RED_INTEGER;if(n===ts)return s.RG;if(n===Xl)return s.RG_INTEGER;if(n===ql)return s.RGBA_INTEGER;if(n===xa||n===_a||n===va||n===ya)if(a===rt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===xa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===_a)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===va)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ya)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===xa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===_a)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===va)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ya)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===$o||n===Ko||n===Zo||n===Jo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===$o)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ko)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Zo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Jo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Qo||n===jo||n===el||n===tl||n===nl||n===Ea||n===il)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Qo||n===jo)return a===rt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===el)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===tl)return r.COMPRESSED_R11_EAC;if(n===nl)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ea)return r.COMPRESSED_RG11_EAC;if(n===il)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===sl||n===rl||n===al||n===ol||n===ll||n===cl||n===hl||n===ul||n===dl||n===fl||n===pl||n===ml||n===gl||n===xl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===sl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===rl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===al)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ol)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ll)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===cl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===hl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ul)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===dl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===fl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===pl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ml)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===gl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===xl)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===_l||n===vl||n===yl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===_l)return a===rt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===vl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===yl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ml||n===Sl||n===Ta||n===bl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ml)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Sl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ta)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===bl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Is?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}const wv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Rv=`
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

}`;class Cv{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new yd(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new vn({vertexShader:wv,fragmentShader:Rv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Dt(new nn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Pv extends ns{constructor(e,t){super();const n=this;let i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,p=null;const y=typeof XRWebGLBinding<"u",m=new Cv,g={},_=t.getContextAttributes();let v=null,M=null;const S=[],b=[],x=new ke;let E=null,w=null;const R=new sn;R.viewport=new ot;const I=new sn;I.viewport=new ot;const N=[R,I],O=new Nm;let L=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ie=S[$];return ie===void 0&&(ie=new no,S[$]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function($){let ie=S[$];return ie===void 0&&(ie=new no,S[$]=ie),ie.getGripSpace()},this.getHand=function($){let ie=S[$];return ie===void 0&&(ie=new no,S[$]=ie),ie.getHandSpace()};function U($){const ie=b.indexOf($.inputSource);if(ie===-1)return;const Me=S[ie];Me!==void 0&&(Me.update($.inputSource,$.frame,c||a),Me.dispatchEvent({type:$.type,data:$.inputSource}))}function P(){i.removeEventListener("select",U),i.removeEventListener("selectstart",U),i.removeEventListener("selectend",U),i.removeEventListener("squeeze",U),i.removeEventListener("squeezestart",U),i.removeEventListener("squeezeend",U),i.removeEventListener("end",P),i.removeEventListener("inputsourceschange",H);for(let $=0;$<S.length;$++){const ie=b[$];ie!==null&&(b[$]=null,S[$].disconnect(ie))}L=null,k=null,m.reset();for(const $ in g)delete g[$];if(e.setRenderTarget(v),f=null,u=null,d=null,i=null,M=null,Se.stop(),n.isPresenting=!1,e.setPixelRatio(E),e.setSize(x.width,x.height,!1),w!==null){const $=w.camera;$.fov=w.fov,$.zoom=w.zoom,$.updateProjectionMatrix(),w=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&Le("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&Le("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(i,t)),d},this.getFrame=function(){return p},this.getSession=function(){return i},this.setSession=async function($){if(i=$,i!==null){if(v=e.getRenderTarget(),i.addEventListener("select",U),i.addEventListener("selectstart",U),i.addEventListener("selectend",U),i.addEventListener("squeeze",U),i.addEventListener("squeezestart",U),i.addEventListener("squeezeend",U),i.addEventListener("end",P),i.addEventListener("inputsourceschange",H),_.xrCompatible!==!0&&await t.makeXRCompatible(),E=e.getPixelRatio(),e.getSize(x),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,we=null,fe=null;_.depth&&(fe=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=_.stencil?Di:ki,we=_.stencil?Is:Zn);const te={colorFormat:t.RGBA8,depthFormat:fe,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(te),i.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),M=new In(u.textureWidth,u.textureHeight,{format:Cn,type:cn,depthTexture:new Us(u.textureWidth,u.textureHeight,we,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const Me={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,Me),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new In(f.framebufferWidth,f.framebufferHeight,{format:Cn,type:cn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Se.setContext(i),Se.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function H($){for(let ie=0;ie<$.removed.length;ie++){const Me=$.removed[ie],we=b.indexOf(Me);we>=0&&(b[we]=null,S[we].disconnect(Me))}for(let ie=0;ie<$.added.length;ie++){const Me=$.added[ie];let we=b.indexOf(Me);if(we===-1){for(let te=0;te<S.length;te++)if(te>=b.length){b.push(Me),we=te;break}else if(b[te]===null){b[te]=Me,we=te;break}if(we===-1)break}const fe=S[we];fe&&fe.connect(Me)}}function B($,ie){ie===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ie.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(i===null)return;let ie=$.near,Me=$.far;m.texture!==null&&(m.depthNear>0&&(ie=m.depthNear),m.depthFar>0&&(Me=m.depthFar)),O.near=I.near=R.near=ie,O.far=I.far=R.far=Me,(L!==O.near||k!==O.far)&&(i.updateRenderState({depthNear:O.near,depthFar:O.far}),L=O.near,k=O.far),O.layers.mask=$.layers.mask|6,R.layers.mask=O.layers.mask&-5,I.layers.mask=O.layers.mask&-3;const we=$.parent,fe=O.cameras;B(O,we);for(let te=0;te<fe.length;te++)B(fe[te],we);O.projectionMatrix.copy(R.projectionMatrix),O.projectionMatrixInverse.copy(R.projectionMatrixInverse),w===null&&$.isPerspectiveCamera&&(w={camera:$,fov:$.fov,zoom:$.zoom}),q($,O,we)};function q($,ie,Me){Me===null?$.matrix.copy(ie.matrixWorld):($.matrix.copy(Me.matrixWorld),$.matrix.invert(),$.matrix.multiply(ie.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Ns*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function($){l=$,u!==null&&(u.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function($){return g[$]};let Z=null;function ae($,ie){if(h=ie.getViewerPose(c||a),p=ie,h!==null){const Me=h.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let we=!1;Me.length!==O.cameras.length&&(O.cameras.length=0,we=!0);for(let ue=0;ue<Me.length;ue++){const $e=Me[ue];let et=null;if(f!==null)et=f.getViewport($e);else{const He=d.getViewSubImage(u,$e);et=He.viewport,ue===0&&(e.setRenderTargetTextures(M,He.colorTexture,He.depthStencilTexture),e.setRenderTarget(M))}let Ge=N[ue];Ge===void 0&&(Ge=new sn,Ge.layers.enable(ue),Ge.viewport=new ot,N[ue]=Ge),Ge.matrix.fromArray($e.transform.matrix),Ge.matrix.decompose(Ge.position,Ge.quaternion,Ge.scale),Ge.projectionMatrix.fromArray($e.projectionMatrix),Ge.projectionMatrixInverse.copy(Ge.projectionMatrix).invert(),Ge.viewport.set(et.x,et.y,et.width,et.height),ue===0&&(O.matrix.copy(Ge.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),we===!0&&O.cameras.push(Ge)}const fe=i.enabledFeatures;if(fe&&fe.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&y){d=n.getBinding();const ue=d.getDepthInformation(Me[0]);ue&&ue.isValid&&ue.texture&&m.init(ue,i.renderState)}if(fe&&fe.includes("camera-access")&&y){e.state.unbindTexture(),d=n.getBinding();for(let ue=0;ue<Me.length;ue++){const $e=Me[ue].camera;if($e){let et=g[$e];et||(et=new yd,g[$e]=et);const Ge=d.getCameraImage($e);et.sourceTexture=Ge}}}}for(let Me=0;Me<S.length;Me++){const we=b[Me],fe=S[Me];we!==null&&fe!==void 0&&fe.update(we,ie,c||a)}Z&&Z($,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),p=null}const Se=new wd;Se.setAnimationLoop(ae),this.setAnimationLoop=function($){Z=$},this.dispose=function(){}}}const Lv=new We,Od=new Oe;Od.set(-1,0,0,0,1,0,0,0,1);function Iv(s,e){function t(m,g){m.matrixAutoUpdate===!0&&m.updateMatrix(),g.value.copy(m.matrix)}function n(m,g){g.color.getRGB(m.fogColor.value,Md(s)),g.isFog?(m.fogNear.value=g.near,m.fogFar.value=g.far):g.isFogExp2&&(m.fogDensity.value=g.density)}function i(m,g,_,v,M){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(m,g):g.isMeshLambertMaterial?(r(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(m,g),d(m,g)):g.isMeshPhongMaterial?(r(m,g),h(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(m,g),u(m,g),g.isMeshPhysicalMaterial&&f(m,g,M)):g.isMeshMatcapMaterial?(r(m,g),p(m,g)):g.isMeshDepthMaterial?r(m,g):g.isMeshDistanceMaterial?(r(m,g),y(m,g)):g.isMeshNormalMaterial?r(m,g):g.isLineBasicMaterial?(a(m,g),g.isLineDashedMaterial&&o(m,g)):g.isPointsMaterial?l(m,g,_,v):g.isSpriteMaterial?c(m,g):g.isShadowMaterial?(m.color.value.copy(g.color),m.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(m,g){m.opacity.value=g.opacity,g.color&&m.diffuse.value.copy(g.color),g.emissive&&m.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.bumpMap&&(m.bumpMap.value=g.bumpMap,t(g.bumpMap,m.bumpMapTransform),m.bumpScale.value=g.bumpScale,g.side===tn&&(m.bumpScale.value*=-1)),g.normalMap&&(m.normalMap.value=g.normalMap,t(g.normalMap,m.normalMapTransform),m.normalScale.value.copy(g.normalScale),g.side===tn&&m.normalScale.value.negate()),g.displacementMap&&(m.displacementMap.value=g.displacementMap,t(g.displacementMap,m.displacementMapTransform),m.displacementScale.value=g.displacementScale,m.displacementBias.value=g.displacementBias),g.emissiveMap&&(m.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,m.emissiveMapTransform)),g.specularMap&&(m.specularMap.value=g.specularMap,t(g.specularMap,m.specularMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest);const _=e.get(g),v=_.envMap,M=_.envMapRotation;v&&(m.envMap.value=v,m.envMapRotation.value.setFromMatrix4(Lv.makeRotationFromEuler(M)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Od),m.reflectivity.value=g.reflectivity,m.ior.value=g.ior,m.refractionRatio.value=g.refractionRatio),g.lightMap&&(m.lightMap.value=g.lightMap,m.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,m.lightMapTransform)),g.aoMap&&(m.aoMap.value=g.aoMap,m.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,m.aoMapTransform))}function a(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform))}function o(m,g){m.dashSize.value=g.dashSize,m.totalSize.value=g.dashSize+g.gapSize,m.scale.value=g.scale}function l(m,g,_,v){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.size.value=g.size*_,m.scale.value=v*.5,g.map&&(m.map.value=g.map,t(g.map,m.uvTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function c(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.rotation.value=g.rotation,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function h(m,g){m.specular.value.copy(g.specular),m.shininess.value=Math.max(g.shininess,1e-4)}function d(m,g){g.gradientMap&&(m.gradientMap.value=g.gradientMap)}function u(m,g){m.metalness.value=g.metalness,g.metalnessMap&&(m.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,m.metalnessMapTransform)),m.roughness.value=g.roughness,g.roughnessMap&&(m.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,m.roughnessMapTransform)),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)}function f(m,g,_){m.ior.value=g.ior,g.diffuseRoughness>0&&(m.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=g.diffuseRoughnessMap,t(g.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),g.sheen>0&&(m.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),m.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(m.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,m.sheenColorMapTransform)),g.sheenRoughnessMap&&(m.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,m.sheenRoughnessMapTransform))),g.clearcoat>0&&(m.clearcoat.value=g.clearcoat,m.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(m.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,m.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(m.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===tn&&m.clearcoatNormalScale.value.negate())),g.dispersion>0&&(m.dispersion.value=g.dispersion),g.retroreflectivity>0&&(m.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(m.iridescence.value=g.iridescence,m.iridescenceIOR.value=g.iridescenceIOR,m.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(m.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,m.iridescenceMapTransform)),g.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),g.transmission>0&&(m.transmission.value=g.transmission,m.transmissionSamplerMap.value=_.texture,m.transmissionSamplerSize.value.set(_.width,_.height),g.transmissionMap&&(m.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,m.transmissionMapTransform)),m.thickness.value=g.thickness,g.thicknessMap&&(m.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=g.attenuationDistance,m.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(m.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(m.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=g.specularIntensity,m.specularColor.value.copy(g.specularColor),g.specularColorMap&&(m.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,m.specularColorMapTransform)),g.specularIntensityMap&&(m.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,m.specularIntensityMapTransform))}function p(m,g){g.matcap&&(m.matcap.value=g.matcap)}function y(m,g){const _=e.get(g).light;m.referencePosition.value.setFromMatrixPosition(_.matrixWorld),m.nearDistance.value=_.shadow.camera.near,m.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Nv(s,e,t,n){let i={},r={};function a(_,v){const M=v.program;n.uniformBlockBinding(_,M,i[_.id])}function o(_,v){let M=i[_.id];M===void 0&&(p(_),M=l(_),i[_.id]=M,_.addEventListener("dispose",m));const S=v.program;n.updateUBOMapping(_,S);const b=e.render.frame;r[_.id]!==b&&(c(_),r[_.id]=b)}function l(_){const v=s.createBuffer(),M=_.__size,S=_.usage;return s.bindBuffer(s.UNIFORM_BUFFER,v),s.bufferData(s.UNIFORM_BUFFER,M,S),s.bindBuffer(s.UNIFORM_BUFFER,null),v}function c(_){const v=i[_.id],M=_.uniforms,S=_.__cache;s.bindBuffer(s.UNIFORM_BUFFER,v);for(let b=0,x=M.length;b<x;b++){const E=M[b];if(Array.isArray(E))for(let w=0,R=E.length;w<R;w++)h(E[w],b,w,S);else h(E,b,0,S)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function h(_,v,M,S){if(u(_,v,M,S)===!0){const b=_.__offset,x=_.value;if(Array.isArray(x)){let E=0;for(let w=0;w<x.length;w++){const R=x[w],I=y(R,!0);d(R,_.__data,E),E+=I.storage/Float32Array.BYTES_PER_ELEMENT}}else d(x,_.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,b,_.__data)}}function d(_,v,M){typeof _=="number"||typeof _=="boolean"?v[M]=_:_.isMatrix3?(v[M]=_.elements[0],v[M+1]=_.elements[1],v[M+2]=_.elements[2],v[M+3]=0,v[M+4]=_.elements[3],v[M+5]=_.elements[4],v[M+6]=_.elements[5],v[M+7]=0,v[M+8]=_.elements[6],v[M+9]=_.elements[7],v[M+10]=_.elements[8],v[M+11]=0):ArrayBuffer.isView(_)?v.set(_.subarray(0,v.length-M),M):_.toArray(v,M)}function u(_,v,M,S){const b=_.value,x=v+"_"+M;if(Array.isArray(b)){S[x]===void 0&&(S[x]=[]);const E=S[x];let w=!1;for(let R=0;R<b.length;R++)f(b[R],E,R)===!0&&(w=!0);return w}return f(b,S,x)}function f(_,v,M){if(v[M]===void 0)return typeof _=="number"||typeof _=="boolean"?v[M]=_:ArrayBuffer.isView(_)?v[M]=_.slice():v[M]=_.clone(),!0;{const S=v[M];if(typeof _=="number"||typeof _=="boolean"){if(S!==_)return v[M]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(S.equals(_)===!1)return S.copy(_),!0}}return!1}function p(_){const v=_.uniforms;let M=0;const S=16;for(let x=0,E=v.length;x<E;x++){const w=Array.isArray(v[x])?v[x]:[v[x]];for(let R=0,I=w.length;R<I;R++){const N=w[R],O=Array.isArray(N.value)?N.value:[N.value],L=Array.isArray(v[x])||Array.isArray(N.value);let k=M;for(let P=0,H=O.length;P<H;P++){const B=O[P],q=y(B,L),Z=M%S,ae=Z%q.boundary,Se=Z+ae;M+=ae,Se!==0&&S-Se<q.storage&&(M+=S-Se),P===0&&(k=M),M+=q.storage}const U=N.type==="int"?Int32Array:N.type==="uint"?Uint32Array:Float32Array;N.__data=new U((M-k)/Float32Array.BYTES_PER_ELEMENT),N.__offset=k}}const b=M%S;return b>0&&(M+=S-b),_.__size=M,_.__cache={},this}function y(_,v){const M={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(M.boundary=4,M.storage=4):_.isVector2?(M.boundary=8,M.storage=8):_.isVector3||_.isColor?(M.boundary=16,M.storage=12):_.isVector4?(M.boundary=16,M.storage=16):_.isMatrix3?(M.boundary=16,M.storage=48):_.isMatrix4?(M.boundary=16,M.storage=64):_.isTexture?Le("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(M.boundary=16,M.storage=_.byteLength):Le("WebGLRenderer: Unsupported uniform value type.",_),v===!0&&(M.boundary=16,M.storage=Math.ceil(M.storage/16)*16),M}function m(_){const v=_.target;v.removeEventListener("dispose",m),s.deleteBuffer(i[v.id]),delete i[v.id],delete r[v.id]}function g(){for(const _ in i)s.deleteBuffer(i[_]);i={},r={}}return{bind:a,update:o,dispose:g}}const Dv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Bn=null;function Uv(){return Bn===null&&(Bn=new ec(Dv,16,16,ts,Dn),Bn.name="DFG_LUT",Bn.minFilter=Pt,Bn.magFilter=Pt,Bn.wrapS=Xn,Bn.wrapT=Xn,Bn.generateMipmaps=!1,Bn.needsUpdate=!0),Bn}class Fv{constructor(e={}){const{canvas:t=dp(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=cn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;const y=f,m=new Set([ql,Xl,Wl]),g=new Set([cn,Zn,xr,Is,Gl,Hl]),_=new Uint32Array(4),v=new Int32Array(4),M={textures:[],min:[],max:[],resolution:[]};let S=null,b=null;const x=[],E=[];let w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ui,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const R=this;let I=!1,N=null,O=null,L=null,k=null;this._outputColorSpace=xt;let U=0,P=0,H=null,B=-1,q=null;const Z=new ot,ae=new ot;let Se=null;const $=new Ce(0);let ie=0,Me=t.width,we=t.height,fe=1,te=null,ye=null;const ue=new ot(0,0,Me,we),$e=new ot(0,0,Me,we);let et=!1;const Ge=new br,He=new nc;let lt=!1,wt=!1;const bt=new We,On=new G,zt=new ot,un={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let dn=!1;function fn(){return H===null?fe:1}let z=n;function pn(A,F){return t.getContext(A,F)}let vt,yt,ge,Ut,Ne,Fe,C,T,W,ne,ee,oe,pe,J,Q,ce,D,j,K,he,re,le,Pe;try{const A={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ol}`),t.addEventListener("webglcontextlost",Ie,!1),t.addEventListener("webglcontextrestored",Xe,!1),t.addEventListener("webglcontextcreationerror",xe,!1),z===null){const F="webgl2";if(z=pn(F,A),z===null)throw pn(F)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ye()}catch(A){throw t.removeEventListener("webglcontextlost",Ie,!1),t.removeEventListener("webglcontextrestored",Xe,!1),t.removeEventListener("webglcontextcreationerror",xe,!1),Ue("WebGLRenderer: "+A.message),A}function Ye(){vt=new Bx(z),vt.init(),re=new Av(z,vt),yt=new Rx(z,vt,e,re),ge=new Ev(z,vt),yt.reversedDepthBuffer&&u&&ge.buffers.depth.setReversed(!0),O=z.createFramebuffer(),L=z.createFramebuffer(),k=z.createFramebuffer(),Ut=new Hx(z),Ne=new hv,Fe=new Tv(z,vt,ge,Ne,yt,re,Ut),C=new kx(R),T=new Wm(z),le=new Ax(z,T),W=new zx(z,T,Ut,le),ne=new Wx(z,W,T,le,Ut),j=new Vx(z,yt,Fe),Q=new Cx(Ne),ee=new cv(R,C,vt,yt,le,Q),oe=new Iv(R,Ne),pe=new dv,J=new _v(vt),D=new Tx(R,C,ge,ne,p,l),ce=new bv(R,ne,yt),Pe=new Nv(z,Ut,yt,ge),K=new wx(z,vt,Ut),he=new Gx(z,vt,Ut),Ut.programs=ee.programs,R.capabilities=yt,R.extensions=vt,R.properties=Ne,R.renderLists=pe,R.shadowMap=ce,R.state=ge,R.info=Ut}y!==cn&&(w=new qx(y,t.width,t.height,o,i,r));const se=new Pv(R,z);this.xr=se,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){const A=vt.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=vt.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return fe},this.setPixelRatio=function(A){A!==void 0&&(fe=A,this.setSize(Me,we,!1))},this.getSize=function(A){return A.set(Me,we)},this.setSize=function(A,F,Y=!0){if(se.isPresenting){Le("WebGLRenderer: Can't change size while VR device is presenting.");return}Me=A,we=F,t.width=Math.floor(A*fe),t.height=Math.floor(F*fe),Y===!0&&(t.style.width=A+"px",t.style.height=F+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,A,F)},this.getDrawingBufferSize=function(A){return A.set(Me*fe,we*fe).floor()},this.setDrawingBufferSize=function(A,F,Y){Me=A,we=F,fe=Y,t.width=Math.floor(A*Y),t.height=Math.floor(F*Y),this.setViewport(0,0,A,F)},this.setEffects=function(A){if(y===cn){Ue("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let F=0;F<A.length;F++)if(A[F].isOutputPass===!0){Le("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(Z)},this.getViewport=function(A){return A.copy(ue)},this.setViewport=function(A,F,Y,V){A.isVector4?ue.set(A.x,A.y,A.z,A.w):ue.set(A,F,Y,V),ge.viewport(Z.copy(ue).multiplyScalar(fn()).round())},this.getScissor=function(A){return A.copy($e)},this.setScissor=function(A,F,Y,V){A.isVector4?$e.set(A.x,A.y,A.z,A.w):$e.set(A,F,Y,V),ge.scissor(ae.copy($e).multiplyScalar(fn()).round())},this.getScissorTest=function(){return et},this.setScissorTest=function(A){ge.setScissorTest(et=A)},this.setOpaqueSort=function(A){te=A},this.setTransparentSort=function(A){ye=A},this.getClearColor=function(A){return A.copy(D.getClearColor())},this.setClearColor=function(){D.setClearColor(...arguments)},this.getClearAlpha=function(){return D.getClearAlpha()},this.setClearAlpha=function(){D.setClearAlpha(...arguments)},this.clear=function(A=!0,F=!0,Y=!0){let V=0;if(A){let X=!1;if(H!==null){const me=H.texture.format;X=m.has(me)}if(X){const me=H.texture.type,be=g.has(me),de=D.getClearColor(),ve=D.getClearAlpha(),Re=de.r,Be=de.g,Qe=de.b;be?(_[0]=Re,_[1]=Be,_[2]=Qe,_[3]=ve,z.clearBufferuiv(z.COLOR,0,_)):(v[0]=Re,v[1]=Be,v[2]=Qe,v[3]=ve,z.clearBufferiv(z.COLOR,0,v))}else V|=z.COLOR_BUFFER_BIT}F&&(V|=z.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(V|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&z.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),N=A},this.dispose=function(){t.removeEventListener("webglcontextlost",Ie,!1),t.removeEventListener("webglcontextrestored",Xe,!1),t.removeEventListener("webglcontextcreationerror",xe,!1),D.dispose(),pe.dispose(),J.dispose(),Fe.dispose(),Ne.dispose(),C.dispose(),ne.dispose(),W.dispose(),le.dispose(),Pe.dispose(),ee.dispose(),se.dispose(),se.removeEventListener("sessionstart",Rc),se.removeEventListener("sessionend",Cc),Gi.stop()};function Ie(A){A.preventDefault(),Ra("WebGLRenderer: Context Lost."),I=!0}function Xe(){Ra("WebGLRenderer: Context Restored."),I=!1;const A=Ut.autoReset,F=ce.enabled,Y=ce.autoUpdate,V=ce.needsUpdate,X=ce.type;Ye(),Ut.autoReset=A,ce.enabled=F,ce.autoUpdate=Y,ce.needsUpdate=V,ce.type=X}function xe(A){Ue("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function st(A){const F=A.target;F.removeEventListener("dispose",st),Gt(F)}function Gt(A){Mi(A),Ne.remove(A)}function Mi(A){const F=Ne.get(A).programs;F!==void 0&&(F.forEach(function(Y){ee.releaseProgram(Y)}),A.isShaderMaterial&&ee.releaseShaderCache(A))}this.renderBufferDirect=function(A,F,Y,V,X,me){F===null&&(F=un);const be=X.isMesh&&X.matrixWorld.determinantAffine()<0,de=ff(A,F,Y,V,X);ge.setMaterial(V,be);let ve=Y.index,Re=1;if(V.wireframe===!0){if(ve=W.getWireframeAttribute(Y),ve===void 0)return;Re=2}const Be=Y.drawRange,Qe=Y.attributes.position;let Ee=Be.start*Re,je=(Be.start+Be.count)*Re;me!==null&&(Ee=Math.max(Ee,me.start*Re),je=Math.min(je,(me.start+me.count)*Re)),ve!==null?(Ee=Math.max(Ee,0),je=Math.min(je,ve.count)):Qe!=null&&(Ee=Math.max(Ee,0),je=Math.min(je,Qe.count));const Rt=je-Ee;if(Rt<0||Rt===1/0)return;le.setup(X,V,de,Y,ve);let pt,ct=K;if(ve!==null&&(pt=T.get(ve),ct=he,ct.setIndex(pt)),X.isMesh)V.wireframe===!0?(ge.setLineWidth(V.wireframeLinewidth*fn()),ct.setMode(z.LINES)):ct.setMode(z.TRIANGLES);else if(X.isLine){let Yt=V.linewidth;Yt===void 0&&(Yt=1),ge.setLineWidth(Yt*fn()),X.isLineSegments?ct.setMode(z.LINES):X.isLineLoop?ct.setMode(z.LINE_LOOP):ct.setMode(z.LINE_STRIP)}else X.isPoints?ct.setMode(z.POINTS):X.isSprite&&ct.setMode(z.TRIANGLES);if(X.isBatchedMesh)if(vt.get("WEBGL_multi_draw"))ct.renderMultiDraw(X._multiDrawStarts,X._multiDrawCounts,X._multiDrawCount);else{const Yt=X._multiDrawStarts,Te=X._multiDrawCounts,Jt=X._multiDrawCount,nt=ve?T.get(ve).bytesPerElement:1,Hi=Ne.get(V).currentProgram.getUniforms();for(let $t=0;$t<Jt;$t++)Hi.setValue(z,"_gl_DrawID",$t),ct.render(Yt[$t]/nt,Te[$t])}else if(X.isInstancedMesh)ct.renderInstances(Ee,Rt,X.count);else if(Y.isInstancedBufferGeometry){const Yt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Te=Math.min(Y.instanceCount,Yt);ct.renderInstances(Ee,Rt,Te)}else ct.render(Ee,Rt)};function wc(A,F,Y,V){N!==null&&A.isNodeMaterial&&N.setObject(V,A),lt===!0&&Q.setState(A,Y,!1),A.transparent===!0&&A.side===Tt&&A.forceSinglePass===!1?(A.side=tn,A.needsUpdate=!0,Vs(A,F,V),A.side=Fi,A.needsUpdate=!0,Vs(A,F,V),A.side=Tt):Vs(A,F,V)}this.compile=function(A,F,Y=null){Y===null&&(Y=A),N!==null&&N.renderStart(A,F,Y),b=J.get(Y),b.init(F),E.push(b),Y.traverseVisible(function(X){X.isLight&&X.layers.test(F.layers)&&(b.pushLight(X),X.castShadow&&b.pushShadow(X))}),A!==Y&&A.traverseVisible(function(X){X.isLight&&X.layers.test(F.layers)&&(b.pushLight(X),X.castShadow&&b.pushShadow(X))}),b.setupLights(),N!==null&&N.updateLights(b.state.lightsArray),wt=this.localClippingEnabled,lt=Q.init(this.clippingPlanes,wt),lt===!0&&Q.setGlobalState(this.clippingPlanes,F),N!==null&&ce.render(b.state.shadowsArray,Y,F);const V=new Set;return A.traverse(function(X){if(!(X.isMesh||X.isPoints||X.isLine||X.isSprite))return;const me=X.material;if(me)if(Array.isArray(me))for(let be=0;be<me.length;be++){const de=me[be];wc(de,Y,F,X),V.add(de)}else wc(me,Y,F,X),V.add(me)}),b=E.pop(),N!==null&&N.renderEnd(),V},this.compileAsync=function(A,F,Y=null){const V=this.compile(A,F,Y);return new Promise(X=>{function me(){if(V.forEach(function(be){const ve=Ne.get(be).currentProgram;(ve===void 0||ve.isReady())&&V.delete(be)}),V.size===0){X(A);return}setTimeout(me,10)}vt.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let Xa=null;function uf(A){Xa&&Xa(A)}function Rc(){Gi.stop()}function Cc(){Gi.start()}const Gi=new wd;Gi.setAnimationLoop(uf),typeof self<"u"&&Gi.setContext(self),this.setAnimationLoop=function(A){Xa=A,se.setAnimationLoop(A),A===null?Gi.stop():Gi.start()},se.addEventListener("sessionstart",Rc),se.addEventListener("sessionend",Cc),this.render=function(A,F){if(F!==void 0&&F.isCamera!==!0){Ue("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;N!==null&&N.renderStart(A,F);const Y=se.enabled===!0&&se.isPresenting===!0,V=w!==null&&(H===null||Y)&&w.begin(R,H);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(se.cameraAutoUpdate===!0&&se.updateCamera(F),F=se.getCamera()),A.isScene===!0&&A.onBeforeRender(R,A,F,H),b=J.get(A,E.length),b.init(F),b.state.textureUnits=Fe.getTextureUnits(),E.push(b),bt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),F.isArrayCamera?He.setFromArrayCamera(F):Ge.setFromProjectionMatrix(bt,Pn,F.reversedDepth),wt=this.localClippingEnabled,lt=Q.init(this.clippingPlanes,wt),S=pe.get(A,x.length),S.init(),x.push(S),this.info.render.frame++,se.enabled===!0&&se.isPresenting===!0){const be=R.xr.getDepthSensingMesh();be!==null&&qa(be,F,-1/0,R.sortObjects)}qa(A,F,0,R.sortObjects),S.finish(),N!==null&&N.updateLights(b.state.lightsArray),R.sortObjects===!0&&S.sort(te,ye),dn=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,dn&&D.addToRenderList(S,A),this.info.autoReset===!0&&this.info.reset(),lt===!0&&Q.beginShadows();const X=b.state.shadowsArray;if(ce.render(X,A,F),lt===!0&&Q.endShadows(),(V&&w.hasRenderPass())===!1){const be=S.opaque,de=S.transmissive;if(b.setupLights(),F.isArrayCamera){const ve=F.cameras;if(de.length>0)for(let Re=0,Be=ve.length;Re<Be;Re++){const Qe=ve[Re];Lc(be,de,A,Qe)}dn&&D.render(A);for(let Re=0,Be=ve.length;Re<Be;Re++){const Qe=ve[Re];Pc(S,A,Qe,Qe.viewport)}}else de.length>0&&Lc(be,de,A,F),dn&&D.render(A),Pc(S,A,F)}H!==null&&P===0&&(Fe.updateMultisampleRenderTarget(H),Fe.updateRenderTargetMipmap(H)),V&&w.end(R),A.isScene===!0&&A.onAfterRender(R,A,F),le.resetDefaultState(),B=-1,q=null,E.pop(),E.length>0?(b=E[E.length-1],Fe.setTextureUnits(b.state.textureUnits),lt===!0&&Q.setGlobalState(R.clippingPlanes,b.state.camera)):b=null,x.pop(),x.length>0?S=x[x.length-1]:S=null,N!==null&&N.renderEnd()};function qa(A,F,Y,V){if(A.visible===!1)return;if(A.layers.test(F.layers)){if(A.isGroup)Y=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(F);else if(A.isLight)b.pushLight(A),A.castShadow&&b.pushShadow(A);else if(A.isSprite){const be=F.isArrayCamera?He:Ge;if(!A.frustumCulled||A.intersectsFrustum(be)){V&&zt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(bt);const de=ne.update(A),ve=A.material;ve.visible&&S.push(A,de,ve,Y,zt.z,null,F)}}else if(A.isMesh||A.isLine||A.isPoints){const be=F.isArrayCamera?He:Ge;if(!A.frustumCulled||A.intersectsFrustum(be)){const de=ne.update(A),ve=A.material;if(V&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),zt.copy(A.boundingSphere.center)):(de.boundingSphere===null&&de.computeBoundingSphere(),zt.copy(de.boundingSphere.center)),zt.applyMatrix4(A.matrixWorld).applyMatrix4(bt)),Array.isArray(ve)){const Re=de.groups;for(let Be=0,Qe=Re.length;Be<Qe;Be++){const Ee=Re[Be],je=ve[Ee.materialIndex];je&&je.visible&&S.push(A,de,je,Y,zt.z,Ee,F)}}else ve.visible&&S.push(A,de,ve,Y,zt.z,null,F)}}}const me=A.children;for(let be=0,de=me.length;be<de;be++)qa(me[be],F,Y,V)}function Pc(A,F,Y,V){const{opaque:X,transmissive:me,transparent:be}=A;b.setupLightsView(Y),lt===!0&&Q.setGlobalState(R.clippingPlanes,Y),V&&ge.viewport(Z.copy(V)),X.length>0&&Lr(X,F,Y),me.length>0&&Lr(me,F,Y),be.length>0&&Lr(be,F,Y),ge.buffers.depth.setTest(!0),ge.buffers.depth.setMask(!0),ge.buffers.color.setMask(!0),ge.setPolygonOffset(!1)}function Lc(A,F,Y,V){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[V.id]===void 0){const Ee=vt.has("EXT_color_buffer_half_float")||vt.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[V.id]=new In(1,1,{generateMipmaps:!0,type:Ee?Dn:cn,minFilter:qn,samples:Math.max(4,yt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ze.workingColorSpace})}const me=b.state.transmissionRenderTarget[V.id],be=V.viewport||Z;me.setSize(be.z*R.transmissionResolutionScale,be.w*R.transmissionResolutionScale);const de=R.getRenderTarget(),ve=R.getActiveCubeFace(),Re=R.getActiveMipmapLevel();R.setRenderTarget(me),R.getClearColor($),ie=R.getClearAlpha(),ie<1&&R.setClearColor(16777215,.5),R.clear(),dn&&D.render(Y);const Be=R.toneMapping;R.toneMapping=ui;const Qe=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),b.setupLightsView(V),lt===!0&&Q.setGlobalState(R.clippingPlanes,V),Lr(A,Y,V),Fe.updateMultisampleRenderTarget(me),Fe.updateRenderTargetMipmap(me),vt.has("WEBGL_multisampled_render_to_texture")===!1){let Ee=!1;for(let je=0,Rt=F.length;je<Rt;je++){const pt=F[je],{object:ct,geometry:Yt,material:Te,group:Jt}=pt;if(Te.side===Tt&&ct.layers.test(V.layers)){const nt=Te.side;Te.side=tn,Te.needsUpdate=!0,Ic(ct,Y,V,Yt,Te,Jt),Te.side=nt,Te.needsUpdate=!0,Ee=!0}}Ee===!0&&(Fe.updateMultisampleRenderTarget(me),Fe.updateRenderTargetMipmap(me))}R.setRenderTarget(de,ve,Re),R.setClearColor($,ie),Qe!==void 0&&(V.viewport=Qe),R.toneMapping=Be}function Lr(A,F,Y){const V=F.isScene===!0?F.overrideMaterial:null;for(let X=0,me=A.length;X<me;X++){const be=A[X],{object:de,geometry:ve,group:Re}=be;let Be=be.material;Be.allowOverride===!0&&V!==null&&(Be=V),de.layers.test(Y.layers)&&Ic(de,F,Y,ve,Be,Re)}}function Ic(A,F,Y,V,X,me){N!==null&&X.isNodeMaterial&&N.setObject(A,X),A.onBeforeRender(R,F,Y,V,X,me),A.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),X.onBeforeRender(R,F,Y,V,A,me),X.transparent===!0&&X.side===Tt&&X.forceSinglePass===!1?(X.side=tn,X.needsUpdate=!0,R.renderBufferDirect(Y,F,V,X,A,me),X.side=Fi,X.needsUpdate=!0,R.renderBufferDirect(Y,F,V,X,A,me),X.side=Tt):R.renderBufferDirect(Y,F,V,X,A,me),A.onAfterRender(R,F,Y,V,X,me)}function Nc(A){let F=0;for(const Y of A)Y.texture!==null&&F++;return F}function Vs(A,F,Y){F.isScene!==!0&&(F=un);const V=Ne.get(A),X=b.state.lights,me=b.state.shadowsArray,be=X.state.version,de=ee.getParameters(A,X.state,me,F,Y,b.state.lightProbeGridArray),ve=ee.getProgramCacheKey(de);let Re=V.programs;V.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?F.environment:null,V.fog=F.fog;const Be=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;V.envMap=C.get(A.envMap||V.environment,Be),V.envMapRotation=V.environment!==null&&A.envMap===null?F.environmentRotation:A.envMapRotation,Re===void 0&&(A.addEventListener("dispose",st),Re=new Map,V.programs=Re,V.programVariants=new Map);let Qe=Re.get(ve);if(Qe!==void 0){if(V.currentProgram===Qe&&V.lightsStateVersion===be)return Uc(A,de),Qe}else de.uniforms=ee.getUniforms(A),N!==null&&A.isNodeMaterial&&N.build(A,Y,de),A.onBeforeCompile(de,R),Qe=ee.acquireProgram(de,ve),Re.set(ve,Qe),V.uniforms=de.uniforms;const Ee=V.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Ee.clippingPlanes=Q.uniform),Uc(A,de),V.needsLights=mf(A),V.lightsStateVersion=be,V.needsLights&&(Ee.ambientLightColor.value=X.state.ambient,Ee.lightProbe.value=X.state.probe,Ee.sunLights.value=X.state.sun,Ee.sunLightShadows.value=X.state.sunShadow,Ee.directionalLights.value=X.state.directional,Ee.directionalLightShadows.value=X.state.directionalShadow,Ee.spotLights.value=X.state.spot,Ee.spotLightShadows.value=X.state.spotShadow,Ee.rectAreaLights.value=X.state.rectArea,Ee.ltc_1.value=X.state.rectAreaLTC1,Ee.ltc_2.value=X.state.rectAreaLTC2,Ee.pointLights.value=X.state.point,Ee.pointLightShadows.value=X.state.pointShadow,Ee.hemisphereLights.value=X.state.hemi,Ee.sunShadowMatrix.value=X.state.sunShadowMatrix,Ee.sunShadowCascade.value=X.state.sunShadowCascade,Ee.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Ee.spotLightMatrix.value=X.state.spotLightMatrix,Ee.spotLightMap.value=X.state.spotLightMap,Ee.pointShadowMatrix.value=X.state.pointShadowMatrix),V.numLightProbeGrids=Nc(b.state.lightProbeGridArray),V.currentProgram=Qe,V.uniformsList=null,Qe}function df(A,F,Y,V,X){const me=Ne.get(A),be=me.currentProgram.id+","+V+","+X;let de=me.programVariants.get(be);return de===void 0?(de=Vs(A,F,Y),me.programVariants.set(be,de)):(me.currentProgram=de,me.uniformsList=null,me.outputColorSpace=V,me.toneMapping=X),de}function Dc(A){if(A.uniformsList===null){const F=A.currentProgram.getUniforms();A.uniformsList=Ma.seqWithValue(F.seq,A.uniforms)}return A.uniformsList}function Uc(A,F){const Y=Ne.get(A);Y.outputColorSpace=F.outputColorSpace,Y.batching=F.batching,Y.batchingColor=F.batchingColor,Y.instancing=F.instancing,Y.instancingColor=F.instancingColor,Y.instancingMorph=F.instancingMorph,Y.skinning=F.skinning,Y.morphTargets=F.morphTargets,Y.morphNormals=F.morphNormals,Y.morphColors=F.morphColors,Y.morphTargetsCount=F.morphTargetsCount,Y.numClippingPlanes=F.numClippingPlanes,Y.numIntersection=F.numClipIntersection,Y.vertexAlphas=F.vertexAlphas,Y.vertexTangents=F.vertexTangents,Y.toneMapping=F.toneMapping}function ff(A,F,Y,V,X){F.isScene!==!0&&(F=un),Fe.resetTextureUnits();const me=F.fog,be=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?F.environment:null,de=H===null?R.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:Ze.workingColorSpace,ve=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Re=C.get(V.envMap||be,ve),Be=V.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Qe=!!Y.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ee=!!Y.morphAttributes.position,je=!!Y.morphAttributes.normal,Rt=!!Y.morphAttributes.color;let pt=ui;V.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(pt=R.toneMapping);const ct=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Yt=ct!==void 0?ct.length:0,Te=Ne.get(V),Jt=b.state.lights;if(lt===!0&&(wt===!0||A!==q)){const Et=A===q&&V.id===B;Q.setState(V,A,Et)}let nt=!1,Hi=!1;V.version===Te.__version?Te.needsLights&&Te.lightsStateVersion!==Jt.state.version||X.isBatchedMesh&&Te.batching===!1||!X.isBatchedMesh&&Te.batching===!0||X.isBatchedMesh&&Te.batchingColor===!0&&X._colorsTexture===null||X.isBatchedMesh&&Te.batchingColor===!1&&X._colorsTexture!==null||X.isInstancedMesh&&Te.instancing===!1||!X.isInstancedMesh&&Te.instancing===!0||X.isSkinnedMesh&&Te.skinning===!1||!X.isSkinnedMesh&&Te.skinning===!0||X.isInstancedMesh&&Te.instancingColor===!0&&X.instanceColor===null||X.isInstancedMesh&&Te.instancingColor===!1&&X.instanceColor!==null||X.isInstancedMesh&&Te.instancingMorph===!0&&X.morphTexture===null||X.isInstancedMesh&&Te.instancingMorph===!1&&X.morphTexture!==null||Te.envMap!==Re||V.fog===!0&&Te.fog!==me||Te.numClippingPlanes!==void 0&&(Te.numClippingPlanes!==Q.numPlanes||Te.numIntersection!==Q.numIntersection)||Te.vertexAlphas!==Be||Te.vertexTangents!==Qe||Te.morphTargets!==Ee||Te.morphNormals!==je||Te.morphColors!==Rt||Te.morphTargetsCount!==Yt||Te.numLightProbeGrids!==Nc(b.state.lightProbeGridArray)?nt=!0:(Te.outputColorSpace!==de||Te.toneMapping!==pt)&&(Hi=!0):(nt=!0,Te.__version=V.version);let $t=Te.currentProgram;(nt===!0||Hi===!0)&&($t=Hi===!0?df(V,F,X,de,pt):Vs(V,F,X),N&&V.isNodeMaterial&&N.onUpdateProgram(V,$t,Te));let Ir=!1,Si=!1,Vi=!1;const tt=$t.getUniforms(),Wt=Te.uniforms;if(ge.useProgram($t.program)&&(Ir=!0,Si=!0,Vi=!0),V.id!==B&&(B=V.id,Si=!0),Ir||q!==A){ge.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),tt.setValue(z,"projectionMatrix",A.projectionMatrix),tt.setValue(z,"viewMatrix",A.matrixWorldInverse);const Ht=tt.map.cameraPosition;Ht!==void 0&&Ht.setValue(z,On.setFromMatrixPosition(A.matrixWorld)),yt.logarithmicDepthBuffer&&tt.setValue(z,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&tt.setValue(z,"isOrthographic",A.isOrthographicCamera===!0),q!==A&&(q=A,Si=!0,Vi=!0)}if(Te.needsLights&&(Jt.state.sunShadowMap.length>0&&tt.setValue(z,"sunShadowMap",Jt.state.sunShadowMap,Fe),Jt.state.directionalShadowMap.length>0&&tt.setValue(z,"directionalShadowMap",Jt.state.directionalShadowMap,Fe),Jt.state.spotShadowMap.length>0&&tt.setValue(z,"spotShadowMap",Jt.state.spotShadowMap,Fe),Jt.state.pointShadowMap.length>0&&tt.setValue(z,"pointShadowMap",Jt.state.pointShadowMap,Fe)),X.isSkinnedMesh){tt.setOptional(z,X,"bindMatrix"),tt.setOptional(z,X,"bindMatrixInverse");const Et=X.skeleton;Et&&(Et.boneTexture===null&&Et.computeBoneTexture(),tt.setValue(z,"boneTexture",Et.boneTexture,Fe))}X.isBatchedMesh&&(tt.setOptional(z,X,"batchingTexture"),tt.setValue(z,"batchingTexture",X._matricesTexture,Fe),tt.setOptional(z,X,"batchingIdTexture"),tt.setValue(z,"batchingIdTexture",X._indirectTexture,Fe),tt.setOptional(z,X,"batchingColorTexture"),X._colorsTexture!==null&&tt.setValue(z,"batchingColorTexture",X._colorsTexture,Fe));const yn=Y.morphAttributes;if((yn.position!==void 0||yn.normal!==void 0||yn.color!==void 0)&&j.update(X,Y,$t),(Si||Te.receiveShadow!==X.receiveShadow)&&(Te.receiveShadow=X.receiveShadow,tt.setValue(z,"receiveShadow",X.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&F.environment!==null&&(Wt.envMapIntensity.value=F.environmentIntensity),Wt.dfgLUT!==void 0&&(Wt.dfgLUT.value=Uv()),Si){if(tt.setValue(z,"toneMappingExposure",R.toneMappingExposure),Te.needsLights&&pf(Wt,Vi),me&&V.fog===!0&&oe.refreshFogUniforms(Wt,me),oe.refreshMaterialUniforms(Wt,V,fe,we,b.state.transmissionRenderTarget[A.id]),Te.needsLights&&Te.numLightProbeGrids>0){const Et=M;let Ht=0;for(const jn of b.state.lightProbeGridArray)jn.texture!==null&&(Et.textures[Ht]=jn.texture,Et.min[Ht]=jn.boundingBox.min,Et.max[Ht]=jn.boundingBox.max,Et.resolution[Ht]=jn.resolution,Ht++);for(const jn in Et)Et[jn].length=Ht;Wt.probesSH.value=Et.textures,Wt.probesMin.value=Et.min,Wt.probesMax.value=Et.max,Wt.probesResolution.value=Et.resolution}Ma.upload(z,Dc(Te),Wt,Fe)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ma.upload(z,Dc(Te),Wt,Fe),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&tt.setValue(z,"center",X.center),tt.setValue(z,"modelViewMatrix",X.modelViewMatrix),tt.setValue(z,"normalMatrix",X.normalMatrix),tt.setValue(z,"modelMatrix",X.matrixWorld),V.uniformsGroups!==void 0){const Et=V.uniformsGroups;for(let Ht=0,jn=Et.length;Ht<jn;Ht++){const Oc=Et[Ht];Pe.update(Oc,$t),Pe.bind(Oc,$t)}}return $t}function pf(A,F){A.ambientLightColor.needsUpdate=F,A.lightProbe.needsUpdate=F,A.sunLights.needsUpdate=F,A.sunLightShadows.needsUpdate=F,A.directionalLights.needsUpdate=F,A.directionalLightShadows.needsUpdate=F,A.pointLights.needsUpdate=F,A.pointLightShadows.needsUpdate=F,A.spotLights.needsUpdate=F,A.spotLightShadows.needsUpdate=F,A.rectAreaLights.needsUpdate=F,A.hemisphereLights.needsUpdate=F}function mf(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return U},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(A,F,Y){const V=Ne.get(A);V.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),Ne.get(A.texture).__webglTexture=F,Ne.get(A.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:Y,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,F){const Y=Ne.get(A);Y.__webglFramebuffer=F,Y.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(A,F=0,Y=0){H=A,U=F,P=Y;let V=null,X=!1,me=!1;if(A){const de=Ne.get(A);if(de.__useDefaultFramebuffer!==void 0){ge.bindFramebuffer(z.FRAMEBUFFER,de.__webglFramebuffer),Z.copy(A.viewport),ae.copy(A.scissor),Se=A.scissorTest,ge.viewport(Z),ge.scissor(ae),ge.setScissorTest(Se),B=-1;return}else if(de.__webglFramebuffer===void 0)Fe.setupRenderTarget(A);else if(de.__hasExternalTextures)Fe.rebindTextures(A,Ne.get(A.texture).__webglTexture,Ne.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Be=A.depthTexture;if(de.__boundDepthTexture!==Be){if(Be!==null&&Ne.has(Be)&&(A.width!==Be.image.width||A.height!==Be.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Fe.setupDepthRenderbuffer(A)}}const ve=A.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(me=!0);const Re=Ne.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Re[F])?V=Re[F][Y]:V=Re[F],X=!0):A.samples>0&&Fe.useMultisampledRTT(A)===!1?V=Ne.get(A).__webglMultisampledFramebuffer:Array.isArray(Re)?V=Re[Y]:V=Re,Z.copy(A.viewport),ae.copy(A.scissor),Se=A.scissorTest}else Z.copy(ue).multiplyScalar(fe).floor(),ae.copy($e).multiplyScalar(fe).floor(),Se=et;if(Y!==0&&(V=O),ge.bindFramebuffer(z.FRAMEBUFFER,V)&&ge.drawBuffers(A,V),ge.viewport(Z),ge.scissor(ae),ge.setScissorTest(Se),X){const de=Ne.get(A.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+F,de.__webglTexture,Y)}else if(me){const de=F;for(let ve=0;ve<A.textures.length;ve++){const Re=Ne.get(A.textures[ve]);z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+ve,Re.__webglTexture,Y,de)}}else if(A!==null&&Y!==0){const de=Ne.get(A.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,de.__webglTexture,Y)}B=-1};function Fc(A){const F=Ne.get(A);return(F.__readFormat!==A.format||F.__readType!==A.type)&&(F.__readFormat=A.format,F.__readType=A.type,F.__formatReadable=yt.textureFormatReadable(A.format),F.__typeReadable=yt.textureTypeReadable(A.type)),F}this.readRenderTargetPixels=function(A,F,Y,V,X,me,be,de=0){if(!(A&&A.isWebGLRenderTarget)){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=Ne.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&be!==void 0&&(ve=ve[be],Array.isArray(ve)&&(ve=ve[0])),ve){ge.bindFramebuffer(z.FRAMEBUFFER,ve);try{const Re=A.textures[de],Be=Re.format,Qe=Re.type;A.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+de);const Ee=Fc(Re);if(Ee.__formatReadable===!1){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ee.__typeReadable===!1){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=A.width-V&&Y>=0&&Y<=A.height-X&&z.readPixels(F,Y,V,X,re.convert(Be),re.convert(Qe),me)}finally{const Re=H!==null?Ne.get(H).__webglFramebuffer:null;ge.bindFramebuffer(z.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(A,F,Y,V,X,me,be,de=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=Ne.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&be!==void 0&&(ve=ve[be],Array.isArray(ve)&&(ve=ve[0])),ve)if(F>=0&&F<=A.width-V&&Y>=0&&Y<=A.height-X){ge.bindFramebuffer(z.FRAMEBUFFER,ve);const Re=A.textures[de],Be=Re.format,Qe=Re.type;A.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+de);const Ee=Fc(Re);if(Ee.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ee.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const je=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,je),z.bufferData(z.PIXEL_PACK_BUFFER,me.byteLength,z.STREAM_READ),z.readPixels(F,Y,V,X,re.convert(Be),re.convert(Qe),0),z.bindBuffer(z.PIXEL_PACK_BUFFER,null);const Rt=H!==null?Ne.get(H).__webglFramebuffer:null;ge.bindFramebuffer(z.FRAMEBUFFER,Rt);const pt=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await fp(z,pt,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,je),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,me),z.bindBuffer(z.PIXEL_PACK_BUFFER,null),z.deleteBuffer(je),z.deleteSync(pt),me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,F=null,Y=0){const V=Math.pow(2,-Y),X=Math.floor(A.image.width*V),me=Math.floor(A.image.height*V),be=F!==null?F.x:0,de=F!==null?F.y:0;Fe.setTexture2D(A,0),z.copyTexSubImage2D(z.TEXTURE_2D,Y,0,0,be,de,X,me),ge.unbindTexture()},this.copyTextureToTexture=function(A,F,Y=null,V=null,X=0,me=0){let be,de,ve,Re,Be,Qe,Ee,je,Rt;const pt=A.isCompressedTexture?A.mipmaps[me]:A.image;if(Y!==null)be=Y.max.x-Y.min.x,de=Y.max.y-Y.min.y,ve=Y.isBox3?Y.max.z-Y.min.z:1,Re=Y.min.x,Be=Y.min.y,Qe=Y.isBox3?Y.min.z:0;else{const tt=Math.pow(2,-X);be=Math.floor(pt.width*tt),de=Math.floor(pt.height*tt),A.isDataArrayTexture?ve=pt.depth:A.isData3DTexture?ve=Math.floor(pt.depth*tt):ve=1,Re=0,Be=0,Qe=0}V!==null?(Ee=V.x,je=V.y,Rt=V.z):(Ee=0,je=0,Rt=0);const ct=re.convert(F.format),Yt=re.convert(F.type);let Te;F.isData3DTexture?(Fe.setTexture3D(F,0),Te=z.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(Fe.setTexture2DArray(F,0),Te=z.TEXTURE_2D_ARRAY):(Fe.setTexture2D(F,0),Te=z.TEXTURE_2D),ge.activeTexture(z.TEXTURE0),ge.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,F.flipY),ge.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),ge.pixelStorei(z.UNPACK_ALIGNMENT,F.unpackAlignment);const Jt=ge.getParameter(z.UNPACK_ROW_LENGTH),nt=ge.getParameter(z.UNPACK_IMAGE_HEIGHT),Hi=ge.getParameter(z.UNPACK_SKIP_PIXELS),$t=ge.getParameter(z.UNPACK_SKIP_ROWS),Ir=ge.getParameter(z.UNPACK_SKIP_IMAGES);ge.pixelStorei(z.UNPACK_ROW_LENGTH,pt.width),ge.pixelStorei(z.UNPACK_IMAGE_HEIGHT,pt.height),ge.pixelStorei(z.UNPACK_SKIP_PIXELS,Re),ge.pixelStorei(z.UNPACK_SKIP_ROWS,Be),ge.pixelStorei(z.UNPACK_SKIP_IMAGES,Qe);const Si=A.isDataArrayTexture||A.isData3DTexture,Vi=F.isDataArrayTexture||F.isData3DTexture;if(A.isDepthTexture){const tt=Ne.get(A),Wt=Ne.get(F),yn=Ne.get(tt.__renderTarget),Et=Ne.get(Wt.__renderTarget);ge.bindFramebuffer(z.READ_FRAMEBUFFER,yn.__webglFramebuffer),ge.bindFramebuffer(z.DRAW_FRAMEBUFFER,Et.__webglFramebuffer);for(let Ht=0;Ht<ve;Ht++)Si&&(z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ne.get(A).__webglTexture,X,Qe+Ht),z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ne.get(F).__webglTexture,me,Rt+Ht)),z.blitFramebuffer(Re,Be,Re+be,Be+de,Ee,je,Ee+be,je+de,z.DEPTH_BUFFER_BIT,z.NEAREST);ge.bindFramebuffer(z.READ_FRAMEBUFFER,null),ge.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else if(X!==0||A.isRenderTargetTexture||Ne.has(A)){const tt=Ne.get(A),Wt=Ne.get(F);ge.bindFramebuffer(z.READ_FRAMEBUFFER,L),ge.bindFramebuffer(z.DRAW_FRAMEBUFFER,k);for(let yn=0;yn<ve;yn++)Si?z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,tt.__webglTexture,X,Qe+yn):z.framebufferTexture2D(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,tt.__webglTexture,X),Vi?z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Wt.__webglTexture,me,Rt+yn):z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,Wt.__webglTexture,me),X!==0?z.blitFramebuffer(Re,Be,Re+be,Be+de,Ee,je,Ee+be,je+de,z.COLOR_BUFFER_BIT,z.NEAREST):Vi?z.copyTexSubImage3D(Te,me,Ee,je,Rt+yn,Re,Be,be,de):z.copyTexSubImage2D(Te,me,Ee,je,Re,Be,be,de);ge.bindFramebuffer(z.READ_FRAMEBUFFER,null),ge.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else Vi?A.isDataTexture||A.isData3DTexture?z.texSubImage3D(Te,me,Ee,je,Rt,be,de,ve,ct,Yt,pt.data):F.isCompressedArrayTexture?z.compressedTexSubImage3D(Te,me,Ee,je,Rt,be,de,ve,ct,pt.data):z.texSubImage3D(Te,me,Ee,je,Rt,be,de,ve,ct,Yt,pt):A.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,me,Ee,je,be,de,ct,Yt,pt.data):A.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,me,Ee,je,pt.width,pt.height,ct,pt.data):z.texSubImage2D(z.TEXTURE_2D,me,Ee,je,be,de,ct,Yt,pt);ge.pixelStorei(z.UNPACK_ROW_LENGTH,Jt),ge.pixelStorei(z.UNPACK_IMAGE_HEIGHT,nt),ge.pixelStorei(z.UNPACK_SKIP_PIXELS,Hi),ge.pixelStorei(z.UNPACK_SKIP_ROWS,$t),ge.pixelStorei(z.UNPACK_SKIP_IMAGES,Ir),me===0&&F.generateMipmaps===!0&&F.mipmapsAutoUpdate===!0&&z.generateMipmap(Te),ge.unbindTexture()},this.initRenderTarget=function(A){Ne.get(A).__webglFramebuffer===void 0&&Fe.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?Fe.setTextureCube(A,0):A.isData3DTexture?Fe.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?Fe.setTexture2DArray(A,0):Fe.setTexture2D(A,0),ge.unbindTexture()},this.resetState=function(){U=0,P=0,H=null,ge.reset(),le.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}}const kd={width:16e3,height:8e3};function Bd(s){return{...s,seed:0,lineGap:950,ridgeOwner:-1,ridgeX:s.width/2,ridgeWidth:330,farm:null,farmOwner:-1,woods:[],farms:[],river:{points:[],width:0},roads:[],bridges:[],ridges:[],objectives:[]}}let ze=Bd(kd),gt=ze.width,Mt=ze.height,Qi=gt/2,oi=Mt/2,zd=ze.lineGap;function iu(s){ze=s,gt=s.width,Mt=s.height,Qi=gt/2,oi=Mt/2,zd=s.lineGap}function Bi(s,e=ze){return Math.min(2,Math.max(0,Math.floor(s*3/e.height)))}function To(s,e,t,n,i){s.objectives.push({id:s.objectives.length,name:t,kind:n,x:e.x,y:e.y,owner:i,sector:Bi(e.y,s),heldTicks:[0,0]})}function fr(s,e=ze){const t=e.river.points;if(t.length<2)return-1/0;const n=Math.max(0,Math.min(t.length-1,s/e.height*(t.length-1))),i=Math.min(t.length-2,Math.floor(n));return t[i].x+(t[i+1].x-t[i].x)*(n-i)}function Ov(s,e,t=kd){const n=Bd(t),{width:i,height:r}=n,a=i/2,o=r/2,l=e===0?-1:1;n.seed=s.next()*100,n.lineGap=s.int(860,1090),n.ridgeOwner=e,n.ridgeWidth=s.int(330,460),n.ridgeX=a+l*n.lineGap,n.ridges.push({x:n.ridgeX,y:o,width:n.ridgeWidth,length:r*.48}),s.next()<.65&&n.ridges.push({x:a-l*s.int(1e3,1700),y:r*(s.next()<.5?.2:.8),width:260,length:r*.17});const c=24,h=s.int(-450,450);n.river.width=s.int(75,120);for(let m=0;m<=c;m++){const g=m/c,_=n.seed;n.river.points.push({x:a+h+410*Math.sin(g*7.3+_)+155*Math.sin(g*17.8+_*.63),y:g*r})}const d=s.int(1,2),u=["磨坊桥","石滩渡"];for(let m=0;m<d;m++){const g=r*(d===1?.5+s.next()*.08:(m===0?.22:.73)+s.next()*.08),_={x:fr(g,n),y:g,w:n.river.width+85,h:m===0?55:85,kind:m===0?"bridge":"ford"};n.bridges.push(_),To(n,_,u[m],"bridge",e)}const f=s.int(2,3),p=f===2?[0,2]:[0,1,2];for(let m=0;m<f;m++){const g=r*(p[m]+.38+s.next()*.24)/3,_={x:a+l*s.int(510,1430),y:g,w:s.int(186,207),h:s.int(135,150)};n.farms.push(_),To(n,_,["圣安娜农庄","白桦村","风车庄园"][p[m]],"farm",e)}n.farm=n.farms[Math.floor(f/2)],n.farmOwner=e;for(const[m,g]of n.ridges.entries())To(n,g,m===0?"长岭":"西丘","ridge",m===0?e:-1);const y=s.int(2,4);for(let m=0;m<y;m++){const g=(m+.4+.2*s.next())*r/y,_=s.int(245,445);let v=a+(s.next()-.5)*3500;Math.abs(v-fr(g,n))<_+120&&(v=fr(g,n)+_+160),n.woods.push({x:v,y:g,r:_})}for(const m of n.bridges){const g=s.int(-380,380),_=m.y+g;n.roads.push({width:44,points:[{x:0,y:_},{x:a*.65,y:_-g*.55},{x:m.x-m.w*.7,y:m.y},{x:m.x+m.w*.7,y:m.y},{x:i*.76,y:_+g*.3},{x:i,y:_-g*.2}]})}for(const m of n.farms){const g=n.bridges.reduce((_,v)=>Math.abs(_.y-m.y)<Math.abs(v.y-m.y)?_:v);n.roads.push({width:39,points:[{x:g.x+l*(g.w/2),y:g.y},{x:m.x-150*l,y:(m.y+g.y)/2},{x:m.x-100*l,y:m.y}]})}return n}function pc(s){return ze.ridgeX+80*Math.sin(s*.0016+ze.seed)}function Gd(s,e){if(!ze.ridges.length){if(ze.ridgeOwner<0)return 0;const n=(s-pc(e))/ze.ridgeWidth;return Math.exp(-n*n)*(.82+.18*Math.sin(e*.0023+ze.seed*2))}let t=0;for(const n of ze.ridges){const i=(s-n.x-80*Math.sin(e*.0016+ze.seed))/n.width,r=(e-n.y)/n.length;t=Math.max(t,Math.exp(-i*i-r*r)*(.88+.12*Math.sin(e*.0023+ze.seed*2)))}return t}function pi(s,e,t,n=0){return!!s&&Math.abs(e-s.x)<s.w/2+n&&Math.abs(t-s.y)<s.h/2+n}function Os(s,e,t=0){for(const n of ze.woods)if((s-n.x)**2+(e-n.y)**2<(n.r+t)**2)return!0;return!1}function Hd(s,e,t){if(ze.ridgeOwner!==t)return!1;const n=(pc(e)-s)*(t?-1:1);return n>15&&n<460}function Vd(s,e,t=ze){for(const n of t.roads)for(let i=1;i<n.points.length;i++){const r=n.points[i-1],a=n.points[i],o=n.width/2;if(s<Math.min(r.x,a.x)-o||s>Math.max(r.x,a.x)+o||e<Math.min(r.y,a.y)-o||e>Math.max(r.y,a.y)+o)continue;const l=a.x-r.x,c=a.y-r.y,h=Math.max(0,Math.min(1,((s-r.x)*l+(e-r.y)*c)/(l*l+c*c||1)));if((s-r.x-h*l)**2+(e-r.y-h*c)**2<=o*o)return!0}return!1}function kv(s,e,t=ze){if(Math.abs(s-fr(e,t))<t.river.width/2){const n=t.bridges.find(i=>pi(i,s,e));return n?.kind==="bridge"?1.3:n?.kind==="ford"?.78:.45}return Vd(s,e,t)?1.3:1}function Bv(s,e){if(s.river.points.length)return`左翼、中央与右翼共有 ${s.farms.length} 处村庄农庄、${s.ridges.length} 道山脊与 ${s.bridges.length} 处渡口。沿道路行军更快。`;const t=[];return t.push(s.ridgeOwner>=0?`${e[s.ridgeOwner===1?1:0]}据守一道山脊，可藏在反斜面躲避炮击`:"开阔原野，双方正面遭遇"),s.farm&&t.push(`${e[s.farmOwner===1?1:0]}占据石墙农庄`),s.woods.length&&t.push(`侧翼有 ${s.woods.length} 片树林，骑兵难以通行`),t.join("；")}class yi{constructor(e){this.state=e}state;next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}int(e,t){return e+Math.floor(this.next()*(t-e+1))}}function zv(s){const e=document.createElement("canvas");e.width=128,e.height=256;const t=e.getContext("2d"),n=t.createImageData(128,256),i=new yi(s?416:791);for(let a=0;a<256;a++)for(let o=0;o<128;o++){const l=Math.min(o,127-o),c=o/127,h=2*Math.sin(a*Math.PI/32)+1.5*Math.cos(a*Math.PI/16+o*.18),d=(i.next()-.5)*(s?6:19);let u,f,p;if(s){const m=Math.max(0,1-(l+h)/15),g=3*Math.sin(a*Math.PI/16+3*Math.sin(o*.06));u=54+m*62+d+g,f=102+m*20+d+g,p=112-m*25+d+g}else{const m=Math.min(Math.abs(c-.32),Math.abs(c-.69)),g=Math.max(0,1-m*17),_=Math.max(0,1-(l+h)/17);u=144+d-g*21-_*27,f=123+d-g*19-_*7,p=82+d-g*13-_*7}const y=(a*128+o)*4;n.data[y]=u,n.data[y+1]=f,n.data[y+2]=p,n.data[y+3]=Math.max(0,Math.min(255,(l-h)*(s?76:42)))}t.putImageData(n,0,0);for(let a=0;a<(s?620:1e3);a++){const o=i.int(5,122),l=i.int(0,255),c=i.next()>.53;t.fillStyle=s?c?"#a3c2bf":"#315c69":c?"#d6ba88":"#655b43",t.globalAlpha=s?.16+i.next()*.29:.16+i.next()*.26,t.fillRect(o,l,s?i.int(2,10):i.int(1,3),1)}const r=new zi(e);return r.wrapT=Oi,r.magFilter=_t,r.colorSpace=xt,r}function su(s,e,t){const n=[];for(let d=1;d<s.points.length;d++){const u=s.points[d-1],f=s.points[d],p=Math.hypot(f.x-u.x,f.y-u.y),y=Math.max(1,Math.ceil(p/45));for(let m=0;m<y;m++){const g=m/y;n.push({x:u.x+(f.x-u.x)*g,y:u.y+(f.y-u.y)*g})}}if(!n.length)return null;n.push(s.points[s.points.length-1]);const i=[],r=[],a=[];let o=0;for(let d=0;d<n.length;d++){const u=n[Math.max(0,d-1)],f=n[Math.min(n.length-1,d+1)],p=n[d];d&&(o+=Math.hypot(p.x-u.x,p.y-u.y));const y=f.x-u.x,m=f.y-u.y,g=Math.hypot(y,m)||1;for(const _ of[-1,1]){const v=Lt(p.x-_*m/g*s.width/2),M=It(p.y+_*y/g*s.width/2);i.push(v,dt(v,M)+t,M),a.push(_<0?0:1,o/(e?225:135))}if(d){const _=d*2;r.push(_-2,_-1,_,_,_-1,_+1)}}const l=new Bt;l.setAttribute("position",new St(i,3)),l.setAttribute("uv",new St(a,2)),l.setIndex(r),l.computeVertexNormals();const c=new vi({map:zv(e),alphaTest:.2,side:Tt,roughness:e?.58:.96,polygonOffset:!0,polygonOffsetFactor:-3}),h=new Dt(l,c);return h.receiveShadow=!0,h}class Gv{group=new Ln;constructor(e){e.add(this.group)}rebuild(){this.group.traverse(n=>{if(n instanceof Dt){n.geometry.dispose();const i=n.material;i.map?.dispose(),i.dispose()}}),this.group.clear();const e=su(ze.river,!0,.085);e&&this.group.add(e);for(const n of ze.roads){const i=su(n,!1,.06);i&&this.group.add(i)}const t=[];for(const n of ze.bridges){const i=Lt(n.x),r=It(n.y),a=n.w*ut,o=n.h*ut;if(n.kind==="ford"){for(let h=0;h<14;h++){const d=i+(h/13-.5)*a,u=r+Math.sin(h*3.6)*o*.22;t.push({x:d,y:dt(d,u)+.1,z:u,sx:.55,sy:.18,sz:.4,color:10459771})}continue}const l=Math.max(dt(i-a/2,r),dt(i+a/2,r))+.25;t.push({x:i,y:l,z:r,sx:a,sy:.48,sz:o,color:11245166});const c=Math.ceil(a/.38);for(let h=0;h<c;h++)t.push({x:i+((h+.5)/c-.5)*a,y:l+.25,z:r,sx:a/c*.94,sy:.12,sz:o*.96,color:[11440752,10125918,11836024,11045993][h%4]});for(const h of[-1,1]){const d=r+h*o*.49;t.push({x:i,y:l+.49,z:d,sx:a+.06,sy:.18,sz:.14,color:12167824});for(let u=0;u<6;u++)t.push({x:i+(u/5-.5)*a,y:l+.23,z:d,sx:.22,sy:.69,sz:.22,color:9208176})}}if(t.length){const n=new an(new is,new vi({roughness:.93}),t.length),i=new it;t.forEach((r,a)=>{i.position.set(r.x,r.y,r.z),i.scale.set(r.sx,r.sy,r.sz),i.updateMatrix(),n.setMatrixAt(a,i.matrix),n.setColorAt(a,new Ce(r.color))}),n.castShadow=n.receiveShadow=!0,this.group.add(n)}}}function Hv(s,e=!1){const t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},a={},o=s[0].morphTargetsRelative,l=new Bt;l.morphTargetsRelative=o;let c=0;for(let h=0;h<s.length;++h){const d=s[h];let u=0,f=0;if(t!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const p in d.attributes){if(!n.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+p+'" attribute exists among all geometries, or in none of them.'),null;r[p]===void 0&&(r[p]=[]),r[p].push(d.attributes[p]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const p in d.morphAttributes){if(!i.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;if(d.morphAttributes[p].length!==s[0].morphAttributes[p].length)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have the same number of morph targets for the "'+p+'" morph attribute.'),null;a[p]===void 0&&(a[p]=[]),a[p].push(d.morphAttributes[p]),f++}if(f!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of morph attributes."),null;if(e){let p;if(t)p=d.index.count;else if(d.attributes.position!==void 0)p=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,p,h),c+=p}}if(t){let h=0;const d=[];for(let u=0;u<s.length;++u){const f=s[u].index;for(let p=0;p<f.count;++p)d.push(f.getX(p)+h);h+=s[u].attributes.position.count}l.setIndex(d)}for(const h in r){const d=ru(r[h]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,d)}for(const h in a){const d=a[h][0].length;if(d!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<d;++u){const f=[];for(let y=0;y<a[h].length;++y)f.push(a[h][y][u]);const p=ru(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}}return l}function ru(s){let e,t,n,i=-1,r=0;for(let c=0;c<s.length;++c){const h=s[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}const a=new e(r),o=new qt(a,t,n);let l=0;for(let c=0;c<s.length;++c){const h=s[c];if(h.isInterleavedBufferAttribute){const d=l/t;for(let u=0,f=h.count;u<f;u++)for(let p=0;p<t;p++){const y=h.getComponent(u,p);o.setComponent(u+d,p,y)}}else a.set(h.array,l);l+=h.count*t}return i!==void 0&&(o.gpuType=i),o}function au(s,e){if(e===tp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===El||e===nd){let t=s.getIndex();if(t===null){const r=[],a=s.getAttribute("position");if(a!==void 0){for(let o=0;o<a.count;o++)r.push(o);s.setIndex(r),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}const n=t.count-2,i=[];if(e===El)for(let r=1;r<=n;r++)i.push(t.getX(0)),i.push(t.getX(r)),i.push(t.getX(r+1));else for(let r=0;r<n;r++)r%2===0?(i.push(t.getX(r)),i.push(t.getX(r+1)),i.push(t.getX(r+2))):(i.push(t.getX(r+2)),i.push(t.getX(r+1)),i.push(t.getX(r)));return i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}function Vv(s){const e=new Map,t=new Map,n=s.clone();return Wd(s,n,function(i,r){e.set(r,i),t.set(i,r)}),n.traverse(function(i){if(!i.isSkinnedMesh)return;const r=i,a=e.get(i),o=a.skeleton.bones;r.skeleton=a.skeleton.clone(),r.bindMatrix.copy(a.bindMatrix),r.skeleton.bones=o.map(function(l){return t.get(l)}),r.bind(r.skeleton,r.bindMatrix)}),n}function Wd(s,e,t){t(s,e);for(let n=0;n<s.children.length;n++)Wd(s.children[n],e.children[n],t)}class Wv extends Gs{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Kv(t)}),this.register(function(t){return new Zv(t)}),this.register(function(t){return new Jv(t)}),this.register(function(t){return new ay(t)}),this.register(function(t){return new oy(t)}),this.register(function(t){return new ly(t)}),this.register(function(t){return new jv(t)}),this.register(function(t){return new ey(t)}),this.register(function(t){return new ty(t)}),this.register(function(t){return new ny(t)}),this.register(function(t){return new $v(t)}),this.register(function(t){return new iy(t)}),this.register(function(t){return new Qv(t)}),this.register(function(t){return new ry(t)}),this.register(function(t){return new sy(t)}),this.register(function(t){return new qv(t)}),this.register(function(t){return new ou(t,Ke.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new ou(t,Ke.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new cy(t)})}load(e,t,n,i){const r=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const c=dr.extractUrlBase(e);a=dr.resolveURL(c,this.path)}else a=dr.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){i?i(c):console.error(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new Ed(this.manager);l.setPriority(this.priority),l.setCache(this.cache),l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r;const a={},o={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Xd){try{a[Ke.KHR_BINARY_GLTF]=new hy(e)}catch(d){i&&i(d);return}r=JSON.parse(a[Ke.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new by(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,priority:this.priority,cache:this.cache,withCredentials:this.withCredentials,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const d=this.pluginCallbacks[h](c);d.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[d.name]=d,a[d.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){const d=r.extensionsUsed[h],u=r.extensionsRequired||[];switch(d){case Ke.KHR_MATERIALS_UNLIT:a[d]=new Yv;break;case Ke.KHR_DRACO_MESH_COMPRESSION:a[d]=new uy(r,this.dracoLoader);break;case Ke.KHR_TEXTURE_TRANSFORM:a[d]=new dy;break;case Ke.KHR_MESH_QUANTIZATION:a[d]=new fy;break;default:u.indexOf(d)>=0&&o[d]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+d+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){const n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function Xv(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}function At(s,e,t){const n=s.json.materials[e];return n.extensions&&n.extensions[t]?n.extensions[t]:null}const Ke={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DIFFUSE_ROUGHNESS:"KHR_materials_diffuse_roughness",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class qv{constructor(e){this.parser=e,this.name=Ke.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let i=t.cache.get(n);if(i)return i;const r=t.json,l=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let c;const h=new Ce(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],hn);const d=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new Ad(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Td(h),c.distance=d;break;case"spot":c=new Cm(h),c.distance=d,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Gn(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return n._getNodeRef(t.cache,o,l)})}}class Yv{constructor(){this.name=Ke.KHR_MATERIALS_UNLIT}getMaterialType(){return Yn}extendParams(e,t,n){const i=[];e.color=new Ce(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],hn),e.opacity=a[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,xt))}return Promise.all(i)}}class $v{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}}class Kv{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&i.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(i.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){const r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ke(r,r)}return Promise.all(i)}}class Zv{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_DIFFUSE_ROUGHNESS}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return t.diffuseRoughness=n.diffuseRoughnessFactor!==void 0?n.diffuseRoughnessFactor:0,n.diffuseRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"diffuseRoughnessMap",n.diffuseRoughnessTexture)),Promise.all(i)}}class Jv{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_DISPERSION}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion!==void 0?n.dispersion:0),Promise.resolve()}}class Qv{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&i.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessMinimum=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessMaximum=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture)),Promise.all(i)}}class jv{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_SHEEN}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];if(t.sheenColor=new Ce(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){const r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],hn)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&i.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,xt)),n.sheenRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture)),Promise.all(i)}}class ey{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&i.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture)),Promise.all(i)}}class ty{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_VOLUME}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0&&i.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;const r=n.attenuationColor||[1,1,1];return t.attenuationColor=new Ce().setRGB(r[0],r[1],r[2],hn),Promise.all(i)}}class ny{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_IOR}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);return n===null||(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}}class iy{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_SPECULAR}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0&&i.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));const r=n.specularColorFactor||[1,1,1];return t.specularColor=new Ce().setRGB(r[0],r[1],r[2],hn),n.specularColorTexture!==void 0&&i.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,xt)),Promise.all(i)}}class sy{constructor(e){this.parser=e,this.name=Ke.EXT_MATERIALS_BUMP}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0&&i.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture)),Promise.all(i)}}class ry{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return At(this.parser,e,this.name)!==null?Un:null}extendMaterialParams(e,t){const n=At(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&i.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture)),Promise.all(i)}}class ay{constructor(e){this.parser=e,this.name=Ke.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;const r=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}}class oy{constructor(e){this.parser=e,this.name=Ke.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}}class ly{constructor(e){this.parser=e,this.name=Ke.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}}class ou{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){const l=i.byteOffset||0,c=i.byteLength||0,h=i.count,d=i.byteStride,u=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,d,u,i.mode,i.filter).then(function(f){return f.buffer}):a.ready.then(function(){const f=new ArrayBuffer(h*d);return a.decodeGltfBuffer(new Uint8Array(f),h,d,u,i.mode,i.filter),f})})}else return null}}class cy{constructor(e){this.name=Ke.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=t.meshes[n.mesh];for(const c of i.primitives)if(c.mode!==gn.TRIANGLES&&c.mode!==gn.TRIANGLE_STRIP&&c.mode!==gn.TRIANGLE_FAN&&c.mode!==void 0)return null;const a=n.extensions[this.name].attributes,o=[],l={};for(const c in a)o.push(this.parser.getDependency("accessor",a[c]).then(h=>(l[c]=h,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{const h=c.pop(),d=h.isGroup?h.children:[h],u=c[0].count,f=[];for(const p of d){const y=new We,m=new G,g=new xi,_=new G(1,1,1),v=new an(p.geometry,p.material,u);for(let S=0;S<u;S++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,S),l.ROTATION&&g.fromBufferAttribute(l.ROTATION,S),l.SCALE&&_.fromBufferAttribute(l.SCALE,S),v.setMatrixAt(S,y.compose(m,g,_));let M=null;for(const S in l)if(S==="_COLOR_0"){const b=l[S];v.instanceColor=new Ds(b.array,b.itemSize,b.normalized)}else if(S!=="TRANSLATION"&&S!=="ROTATION"&&S!=="SCALE"){if(M===null){const x=v.geometry;M=new Bt,M.name=x.name;for(const E in x.attributes)M.setAttribute(E,x.attributes[E]);for(const E in x.morphAttributes)M.morphAttributes[E]=x.morphAttributes[E];x.index!==null&&M.setIndex(x.index),M.morphTargetsRelative=x.morphTargetsRelative;for(const E of x.groups)M.addGroup(E.start,E.count,E.materialIndex);x.boundingBox!==null&&(M.boundingBox=x.boundingBox.clone()),x.boundingSphere!==null&&(M.boundingSphere=x.boundingSphere.clone()),M.drawRange.start=x.drawRange.start,M.drawRange.count=x.drawRange.count,M.userData=Object.assign({},x.userData),v.geometry=M}const b=l[S];M.setAttribute(S,new Ds(b.array,b.itemSize,b.normalized))}it.prototype.copy.call(v,p),this.parser.assignFinalMaterial(v),f.push(v)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const Xd="glTF",js=12,lu={JSON:1313821514,BIN:5130562};class hy{constructor(e){this.name=Ke.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,js),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Xd)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-js,r=new DataView(e,js);let a=0;for(;a<i;){const o=r.getUint32(a,!0);a+=4;const l=r.getUint32(a,!0);if(a+=4,l===lu.JSON){const c=new Uint8Array(e,js+a,o);this.content=n.decode(c)}else if(l===lu.BIN){const c=js+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class uy{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ke.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(const h in a){const d=Rl[h]||h.toLowerCase();o[d]=a[h]}for(const h in e.attributes){const d=Rl[h]||h.toLowerCase();if(a[h]!==void 0){const u=n.accessors[e.attributes[h]],f=Ps[u.componentType];c[d]=f.name,l[d]=u.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(d,u){i.decodeDracoFile(h,function(f){for(const p in f.attributes){const y=f.attributes[p],m=l[p];m!==void 0&&(y.normalized=m)}d(f)},o,c,hn,u)})})}}class dy{constructor(){this.name=Ke.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){const n=Math.cos(e.rotation),i=Math.sin(e.rotation);e.matrix.set(e.repeat.x*n,e.repeat.y*i,e.offset.x,-e.repeat.x*i,e.repeat.y*n,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}}class fy{constructor(){this.name=Ke.KHR_MESH_QUANTIZATION}}class qd extends ks{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let a=0;a!==i;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,h=i-t,d=(n-t)/h,u=d*d,f=u*d,p=e*c,y=p-c,m=-2*f+3*u,g=f-u,_=1-m,v=g-u+d;for(let M=0;M!==o;M++){const S=a[y+M+o],b=a[y+M+l]*h,x=a[p+M+o],E=a[p+M]*h;r[M]=_*S+v*b+m*x+g*E}return r}}const py=new xi;class my extends qd{interpolate_(e,t,n,i){const r=super.interpolate_(e,t,n,i);return py.fromArray(r).normalize().toArray(r),r}}const gn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Ps={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},cu={9728:_t,9729:Pt,9984:Ku,9985:ga,9986:sr,9987:qn},hu={33071:Xn,33648:ba,10497:Oi},Ao={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Rl={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Ri={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},gy={CUBICSPLINE:void 0,LINEAR:vr,STEP:_r},wo={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function xy(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new vi({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Fi})),s.DefaultMaterial}function $i(s,e,t){for(const n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Gn(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function _y(s,e,t){let n=!1,i=!1,r=!1;for(let c=0,h=e.length;c<h;c++){const d=e[c];if(d.POSITION!==void 0&&(n=!0),d.NORMAL!==void 0&&(i=!0),d.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);const a=[],o=[],l=[];for(let c=0,h=e.length;c<h;c++){const d=e[c];if(n){const u=d.POSITION!==void 0?t.getDependency("accessor",d.POSITION):s.attributes.position;a.push(u)}if(i){const u=d.NORMAL!==void 0?t.getDependency("accessor",d.NORMAL):s.attributes.normal;o.push(u)}if(r){const u=d.COLOR_0!==void 0?t.getDependency("accessor",d.COLOR_0):s.attributes.color;l.push(u)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){const h=c[0],d=c[1],u=c[2];return n&&(s.morphAttributes.position=h),i&&(s.morphAttributes.normal=d),r&&(s.morphAttributes.color=u),s.morphTargetsRelative=!0,s})}function vy(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function yy(s){let e;const t=s.extensions&&s.extensions[Ke.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Ro(t.attributes):e=s.indices+":"+Ro(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+Ro(s.targets[n]);return e}function Ro(s){let e="";const t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function Cl(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function My(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":s.search(/\.ktx2($|\?)/i)>0||s.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const Sy=new We;class by{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Xv,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,a=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;const l=o.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,r=o.indexOf("Firefox")>-1,a=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&a<98?(this.textureLoader=new Ba(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)):(this.textureLoader=new Im(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setWithCredentials(this.options.withCredentials),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Ed(this.options.manager),this.fileLoader.setPriority(this.options.priority),this.fileLoader.setCache(this.options.cache),this.fileLoader.setResponseType("arraybuffer"),(this.options.withCredentials||this.options.crossOrigin==="use-credentials")&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){const o={scene:a[0][i.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:i.asset,parser:n,userData:{}};return $i(r,o,i),Gn(o,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(const l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){const a=t[i].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){const a=e[i];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const i=n.clone(),r=(a,o)=>{const l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(const[c,h]of a.children.entries())r(h,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const i=e(t[n]);if(i)return i}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let i=0;i<t.length;i++){const r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ke.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(r,a){n.load(dr.resolveURL(t.uri,i.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){const t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){const a=Ao[i.type],o=Ps[i.componentType],l=i.normalized===!0,c=new o(i.count*a);return Promise.resolve(new qt(c,a,l))}const r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(a){const o=a[0],l=Ao[i.type],c=Ps[i.componentType],h=c.BYTES_PER_ELEMENT,d=h*l,u=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,p=i.normalized===!0;let y,m;if(f&&f!==d){const g=Math.floor(u/f),_="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+g+":"+i.count;let v=t.cache.get(_);v||(y=new c(o,g*f,i.count*f/h),v=new qp(y,f/h),t.cache.add(_,v)),m=new jl(v,l,u%f/h,p)}else o===null?y=new c(i.count*l):y=new c(o,u,i.count*l),m=new qt(y,l,p);if(i.sparse!==void 0){const g=Ao.SCALAR,_=Ps[i.sparse.indices.componentType],v=i.sparse.indices.byteOffset||0,M=i.sparse.values.byteOffset||0,S=new _(a[1],v,i.sparse.count*g),b=new c(a[2],M,i.sparse.count*l);o!==null&&(m=new qt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let x=0,E=S.length;x<E;x++){const w=S[x];if(m.setX(w,b[x*l]),l>=2&&m.setY(w,b[x*l+1]),l>=3&&m.setZ(w,b[x*l+2]),l>=4&&m.setW(w,b[x*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=p}return m})}loadTexture(e){const t=this.json,n=this.options,r=t.textures[e].source,a=t.images[r];let o=this.textureLoader;if(a.uri){const l=n.manager.getHandler(a.uri);l!==null&&(o=l)}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){const i=this,r=this.json,a=r.textures[e],o=r.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const u=(r.samplers||{})[a.sampler]||{};return h.magFilter=cu[u.magFilter]||Pt,h.minFilter=cu[u.minFilter]||qn,h.wrapS=hu[u.wrapS]||Oi,h.wrapT=hu[u.wrapT]||Oi,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==_t&&h.minFilter!==Pt,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());const a=i.images[e],o=self.URL||self.webkitURL;let l=a.uri||"",c=!1,h;if(t.isKTX2Loader===!0&&a.bufferView!==void 0)h=n.getDependency("bufferView",a.bufferView).then(function(u){return new Promise(function(f,p){t.parse(u,f,p)})});else{if(a.bufferView!==void 0)l=n.getDependency("bufferView",a.bufferView).then(function(u){c=!0;const f=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(f),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");h=Promise.resolve(l).then(function(u){return new Promise(function(f,p){let y=f;t.isImageBitmapLoader===!0&&(y=function(m){const g=new Nt(m);g.needsUpdate=!0,f(g)}),t.load(dr.resolveURL(u,r.path),y,void 0,p)})})}const d=h.then(function(u){return c===!0&&o.revokeObjectURL(l),Gn(u,a),u.userData.mimeType=a.mimeType||My(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=d,d}assignTexture(e,t,n,i){const r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),r.extensions[Ke.KHR_TEXTURE_TRANSFORM]){const o=n.extensions!==void 0?n.extensions[Ke.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const l=r.associations.get(a);a=r.extensions[Ke.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,l)}}return i!==void 0&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new xd,Nn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(o,l)),n=l}else if(e.isLine){const o="LineBasicMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new gd,Nn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(o,l)),n=l}if(i||r||a){let o="ClonedMaterial:"+n.uuid+":";i&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=n.clone(),r&&(l.vertexColors=!0),a&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return vi}loadMaterial(e){const t=this,n=this.json,i=this.extensions,r=n.materials[e];let a;const o={},l=r.extensions||{},c=[];if(l[Ke.KHR_MATERIALS_UNLIT]){const d=i[Ke.KHR_MATERIALS_UNLIT];a=d.getMaterialType(),c.push(d.extendParams(o,r,t))}else{const d=r.pbrMetallicRoughness||{};if(o.color=new Ce(1,1,1),o.opacity=1,Array.isArray(d.baseColorFactor)){const u=d.baseColorFactor;o.color.setRGB(u[0],u[1],u[2],hn),o.opacity=u[3]}d.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",d.baseColorTexture,xt)),o.metalness=d.metallicFactor!==void 0?d.metallicFactor:1,o.roughness=d.roughnessFactor!==void 0?d.roughnessFactor:1,d.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",d.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",d.metallicRoughnessTexture))),a=this._invokeOne(function(u){return u.getMaterialType&&u.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(u){return u.extendMaterialParams&&u.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=Tt);const h=r.alphaMode||wo.OPAQUE;if(h===wo.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===wo.MASK&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==Yn&&(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new ke(1,1),r.normalTexture.scale!==void 0)){const d=r.normalTexture.scale;o.normalScale.set(d,d)}if(r.occlusionTexture!==void 0&&a!==Yn&&(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==Yn){const d=r.emissiveFactor;o.emissive=new Ce().setRGB(d[0],d[1],d[2],hn)}return r.emissiveTexture!==void 0&&a!==Yn&&c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,xt)),Promise.all(c).then(function(){const d=new a(o);return r.name&&(d.name=r.name),Gn(d,r),t.associations.set(d,{materials:e}),r.extensions&&$i(i,d,r),d})}createUniqueName(e){const t=at.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[Ke.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return uu(l,o,t)})}const a=[];for(let o=0,l=e.length;o<l;o++){const c=e[o],h=yy(c),d=i[h];if(d)a.push(d.promise);else{let u;c.extensions&&c.extensions[Ke.KHR_DRACO_MESH_COMPRESSION]?u=r(c):u=uu(new Bt,c,t),c.mode===gn.TRIANGLE_STRIP?u=u.then(f=>au(f,nd)):c.mode===gn.TRIANGLE_FAN&&(u=u.then(f=>au(f,El))),i[h]={primitive:c,promise:u},a.push(u)}}return Promise.all(a)}loadMesh(e){const t=this,n=this.json,i=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let l=0,c=a.length;l<c;l++){const h=a[l].material===void 0?xy(this.cache):this.getDependency("material",a[l].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(async function(l){const c=l.slice(0,l.length-1),h=l[l.length-1],d=[];for(let f=0,p=h.length;f<p;f++){const y=h[f],m=a[f];let g;const _=c[f];if(m.mode===gn.TRIANGLES||m.mode===gn.TRIANGLE_STRIP||m.mode===gn.TRIANGLE_FAN||m.mode===void 0){const v=r.isSkinnedMesh===!0,M=y.hasAttribute("skinIndex")&&y.hasAttribute("skinWeight");v&&M===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),g=v&&M?new Qp(y,_):new Dt(y,_),g.isSkinnedMesh===!0&&g.normalizeSkinWeights()}else if(m.mode===gn.LINES)g=new nm(y,_);else if(m.mode===gn.LINE_STRIP)g=new ic(y,_);else if(m.mode===gn.LINE_LOOP)g=new im(y,_);else if(m.mode===gn.POINTS)g=new sm(y,_);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(g.geometry.morphAttributes).length>0&&vy(g,r),g.name=t.createUniqueName(r.name||"mesh_"+e),Gn(g,r),m.extensions&&$i(i,g,m),t.assignFinalMaterial(g),d.push(g)}for(let f=0,p=d.length;f<p;f++)t.associations.set(d[f],{meshes:e,primitives:f});if(d.length===1)return r.extensions&&$i(i,d[0],r),d[0];const u=new Ln;r.extensions&&$i(i,u,r),t.associations.set(u,{meshes:e});for(let f=0,p=d.length;f<p;f++)u.add(d[f]);return u})}loadCamera(e){let t;const n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new sn(rr.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new hc(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Gn(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const r=i.pop(),a=i,o=[],l=[];for(let c=0,h=a.length;c<h;c++){const d=a[c];if(d){o.push(d);const u=new We;r!==null&&u.fromArray(r.array,c*16),l.push(u)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new tc(o,l)})}loadAnimation(e){const t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,a=[],o=[],l=[],c=[],h=[];for(let d=0,u=i.channels.length;d<u;d++){const f=i.channels[d],p=i.samplers[f.sampler],y=f.target,m=y.node,g=i.parameters!==void 0?i.parameters[p.input]:p.input,_=i.parameters!==void 0?i.parameters[p.output]:p.output;y.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",g)),l.push(this.getDependency("accessor",_)),c.push(p),h.push(y))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(d){const u=d[0],f=d[1],p=d[2],y=d[3],m=d[4],g=[];for(let v=0,M=u.length;v<M;v++){const S=u[v],b=f[v],x=p[v],E=y[v],w=m[v];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();const R=n._createAnimationTracks(S,b,x,E,w);if(R)for(let I=0;I<R.length;I++)g.push(R[I])}const _=new ym(r,void 0,g);return Gn(_,i),_})}createNodeMesh(e){const t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){const a=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=i.weights.length;l<c;l++)o.morphTargetInfluences[l]=i.weights[l]}),a})}loadNode(e){const t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),a=[],o=i.children||[];for(let c=0,h=o.length;c<h;c++)a.push(n.getDependency("node",o[c]));const l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(a),l]).then(function(c){const h=c[0],d=c[1],u=c[2];u!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(u,Sy)});for(let f=0,p=d.length;f<p;f++)h.add(d[f]);if(h.userData.pivot!==void 0&&d.length>0){const f=h.userData.pivot,p=d[0];h.pivot=new G().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){const t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],a=r.name?i.createUniqueName(r.name):"",o=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),r.camera!==void 0&&o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(r.isBone===!0?h=new md:c.length>1?h=new Ln:c.length===1?h=c[0]:h=new it,h!==c[0])for(let d=0,u=c.length;d<u;d++)h.add(c[d]);if(r.name&&(h.userData.name=r.name,h.name=a),Gn(h,r),r.extensions&&$i(n,h,r),r.matrix!==void 0){const d=new We;d.fromArray(r.matrix),h.applyMatrix4(d)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!i.associations.has(h))i.associations.set(h,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){const d=i.associations.get(h);i.associations.set(h,{...d})}return i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],i=this,r=new Ln;n.name&&(r.name=i.createUniqueName(n.name)),Gn(r,n),n.extensions&&$i(t,r,n);const a=n.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(i.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let h=0,d=l.length;h<d;h++){const u=l[h];u.parent!==null?r.add(Vv(u)):r.add(u)}const c=h=>{const d=new Map;for(const[u,f]of i.associations)(u instanceof Nn||u instanceof Nt)&&d.set(u,f);return h.traverse(u=>{const f=i.associations.get(u);f!=null&&d.set(u,f)}),d};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){const a=[],o=e.name?e.name:e.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}Ri[r.path]===Ri.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(o);let h;switch(Ri[r.path]){case Ri.weights:h=Er;break;case Ri.rotation:h=Tr;break;case Ri.translation:case Ri.scale:h=Ia;break;default:n.itemSize===1?h=Er:h=Ia;break}const d=i.interpolation!==void 0?gy[i.interpolation]:vr,u=this._getArrayFromAccessor(n);for(let f=0,p=l.length;f<p;f++){const y=new h(l[f]+"."+Ri[r.path],t.array,u,d);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(y),a.push(y)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=Cl(t.constructor),i=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const i=this instanceof Tr?my:qd;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Ey(s,e,t){const n=e.attributes,i=new _i;if(n.POSITION!==void 0){const o=t.json.accessors[n.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(i.set(new G(l[0],l[1],l[2]),new G(c[0],c[1],c[2])),o.normalized){const h=Cl(Ps[o.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const r=e.targets;if(r!==void 0){const o=new G,l=new G;for(let c=0,h=r.length;c<h;c++){const d=r[c];if(d.POSITION!==void 0){const u=t.json.accessors[d.POSITION],f=u.min,p=u.max;if(f!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),u.normalized){const y=Cl(Ps[u.componentType]);l.multiplyScalar(y)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(o)}s.boundingBox=i;const a=new Qn;i.getCenter(a.center),a.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=a}function uu(s,e,t){const n=e.attributes,i=[];function r(a,o){return t.getDependency("accessor",a).then(function(l){s.setAttribute(o,l)})}for(const a in n){const o=Rl[a]||a.toLowerCase();o in s.attributes||i.push(r(n[a],o))}if(e.indices!==void 0&&!s.index){const a=t.getDependency("accessor",e.indices).then(function(o){s.setIndex(o)});i.push(a)}return Ze.workingColorSpace!==hn&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Ze.workingColorSpace}" not supported.`),Gn(s,e),Ey(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?_y(s,e.targets,t):s})}function mc(s){const e=new yi(Math.floor(s.seed*1e3)+7),t=[];for(const n of s.woods)for(let i=0;i<Math.round(n.r*n.r/2300);i++){const r=e.next()*Math.PI*2,a=Math.sqrt(e.next())*n.r;t.push({x:n.x+Math.cos(r)*a,y:n.y+Math.sin(r)*a,size:.8+e.next()*.45,yaw:e.next()*Math.PI*2,crown:e.int(0,2),understory:i%3===0?i%9===0?"Rock":"Shrub":null})}return t}const Ty=["farmhouse","oak","beech","spruce","bush","haystack","hedge"];class Ay{group=new Ln;mats=new Map;plane=new nn(1,1).translate(0,.5,0).rotateX(-8*Math.PI/180);constructor(e){e.add(this.group)}async load(){const e=new Ba;await Promise.all(Ty.map(async t=>{try{const n=await e.loadAsync("./art/px_"+t+".png");n.magFilter=n.minFilter=_t,n.generateMipmaps=!1,n.colorSpace=xt;const i=n.image;this.mats.set(t,{aspect:i.width/Math.max(1,i.height),mat:new ka({map:n,alphaTest:.5,side:Tt}),depth:new oc({depthPacking:id,map:n,alphaTest:.5,side:Tt})})}catch{}}))}put(e,t,n,i,r=!1){const a=this.mats.get(e);if(!a)return;const o=new Dt(this.plane,a.mat);o.customDepthMaterial=a.depth,o.castShadow=o.receiveShadow=!0,o.position.set(t,dt(t,n)-.15,n),o.scale.set(i*a.aspect*(r?-1:1),i,1),this.group.add(o)}rebuild(){this.group.clear();for(const t of ze.farms){const n=Lt(t.x),i=It(t.y);this.put("farmhouse",n,i-1,t.w*ut*.95),this.put("haystack",n+t.w*ut*.55,i+2.5,2.8),this.put("haystack",n-t.w*ut*.6,i+3.2,2.4,!0);for(let r=-2;r<=2;r++)this.put("hedge",n+r*t.w*ut*.24,i+t.h*ut*.62,1.3,r%2===0)}const e=["oak","beech","spruce"];for(const t of mc(ze).sort((n,i)=>n.y-i.y))this.put(e[t.crown],Lt(t.x),It(t.y),7*t.size,t.yaw>Math.PI)}}class wy{constructor(e,t){this.scene=e,this.wind=t,this.flat=new Ay(e)}scene;wind;flat;models=new Map;batches=[];fallback=!1;async load(){try{const e=await new Wv().loadAsync("./models/battlefield.glb");for(const t of["Farm","Trunk","Crown0","Crown1","Crown2","Shrub","Rock"]){const n=e.scene.getObjectByName(t);if(!(n instanceof Dt))throw Error(t);if(t.startsWith("Crown")){const i=n.material.clone();i.onBeforeCompile=r=>{r.uniforms.uWind=this.wind,r.vertexShader=`uniform float uWind;
`+r.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
 transformed.x+=.026*position.y*sin(uWind*1.7+instanceMatrix[3].x*.34+instanceMatrix[3].z*.4);`)},n.material=i}this.models.set(t,n)}}catch{this.fallback=!0,await this.flat.load()}}rebuild(){if(this.fallback){this.flat.rebuild();return}if(!this.models.size)return;for(const i of this.batches)this.scene.remove(i),i.dispose();this.batches=[];const e=new Map,t=new it,n=(i,r,a,o,l)=>{t.position.set(r,dt(r,a)-.08,a),t.rotation.y=l,t.scale.setScalar(o),t.updateMatrix(),e.has(i)||e.set(i,[]),e.get(i).push(t.matrix.clone())};for(const i of ze.farms)n("Farm",Lt(i.x),It(i.y),i.w*ut/9.5,ze.ridgeOwner===0?Math.PI:0);for(const i of mc(ze)){const r=Lt(i.x),a=It(i.y);n("Trunk",r,a,i.size,i.yaw),n("Crown"+i.crown,r,a,i.size,i.yaw),i.understory&&n(i.understory,r+1.1,a-.8,i.size,i.yaw)}for(const[i,r]of e){const a=this.models.get(i),o=new an(a.geometry,a.material,r.length);r.forEach((l,c)=>o.setMatrixAt(c,l)),o.castShadow=o.receiveShadow=!0,this.scene.add(o),this.batches.push(o)}}}const ut=.05,Lt=s=>(s-gt/2)*ut,It=s=>(s-Mt/2)*ut,Ar=s=>s/ut+gt/2,wr=s=>s/ut+Mt/2;let oa=gt/2*ut,la=Mt/2*ut;const Ry=3.8;function dt(s,e){return .71*Math.sin(s*.048+e*.033)+.43*Math.cos(e*.083-s*.017)+.23*Math.sin(s*.093+e*.069)+Ry*Gd(Ar(s),wr(e))}function Cy(s,e,t){return t.set(dt(s-.25,e)-dt(s+.25,e),.5,dt(s,e-.25)-dt(s,e+.25)).normalize()}function Py(){const s=document.createElement("canvas");s.width=s.height=1024;const e=s.getContext("2d"),t=new yi(1799),n=e.createImageData(1024,1024);function i(h){const d=Float32Array.from({length:h*h},()=>t.next());return(u,f)=>{const p=u*h,y=f*h,m=Math.floor(p),g=Math.floor(y);let _=p-m,v=y-g;_=_*_*(3-2*_),v=v*v*(3-2*v);const M=(S,b)=>d[(g+b)%h*h+(m+S)%h];return(M(0,0)*(1-_)+M(1,0)*_)*(1-v)+(M(0,1)*(1-_)+M(1,1)*_)*v}}const r=i(4),a=i(17),o=i(64);for(let h=0;h<1024;h++)for(let d=0;d<1024;d++){const u=d/1024,f=h/1024,p=r(u,f)*.5+a(u,f)*.33+o(u,f)*.17,y=Math.pow(.5+.5*Math.sin(2*Math.PI*(u*4+f*6+.22*Math.sin(f*6.283))),10)*a(u,f),m=Math.max(0,p-.52)*110,g=(h*1024+d)*4,_=(t.next()-.5)*7;n.data[g]=39+p*58+m*1.35+y*16+_,n.data[g+1]=72+p*59+m*.25+y*7+_,n.data[g+2]=37+p*36+y*5+_,n.data[g+3]=255}e.putImageData(n,0,0);const l=["#b5ad6a","#8f9a5b","#c2aa64","#4d633c","#717e4a","#d3c588"];for(let h=0;h<43e3;h++){const d=t.int(0,1023),u=t.int(0,1023);e.globalAlpha=.12+t.next()*.32,e.fillStyle=l[t.int(0,5)];const f=t.int(1,5);e.fillRect(d,u,f,1),f>2&&e.fillRect(d+f-1,u-1,2,1)}for(let h=0;h<240;h++){const d=t.int(0,1023),u=t.int(0,1023),f=t.next()<.38,p=f?"#809962":"#b6a36c";for(let y=0;y<58;y++){const m=t.next()*Math.PI*2,g=Math.sqrt(t.next()),_=Math.round(1024+d+Math.cos(m)*g*26)%1024,v=Math.round(1024+u+Math.sin(m)*g*11)%1024;e.globalAlpha=.22+t.next()*.3,e.fillStyle=p,e.fillRect(_,v,f?3:1,2),e.fillRect((_+2)%1024,(v+1023)%1024,2,1),!f&&y%5===0&&(e.fillStyle="#e2d4a1",e.fillRect((_+3)%1024,(v+1022)%1024,2,1))}}const c=new zi(s);return c.colorSpace=xt,c.wrapS=c.wrapT=Oi,c.repeat.set(1.75,1.75),c.anisotropy=4,c}function Ly(s){const e=Py(),t=2e3*ut,n=new Map,i=new vi({map:e,vertexColors:!0,roughness:.93,bumpMap:e,bumpScale:.08,roughnessMap:e});i.onBeforeCompile=x=>{x.fragmentShader=x.fragmentShader.replace("#include <map_fragment>",`vec4 primaryGrass=texture2D(map,vMapUv);
            vec2 crossField=mat2(.73,.48,-.48,.73)*vMapUv+vec2(.37,.65);
            vec4 brush=texture2D(map,crossField);
            diffuseColor*=mix(primaryGrass,brush,.32);`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
 roughnessFactor=.74+.23*roughnessFactor;`)};const r=new yi(29),a=new Bt,o=[];for(let x=0;x<5;x++){const E=r.next()*.34-.17,w=r.next()*.28-.14,R=.12+r.next()*.21;o.push(E-.035,0,w,E+.035,0,w,E+.08,R,w-.06)}a.setAttribute("position",new St(o,3)),a.computeVertexNormals();const l=new ka({side:Tt,color:16777215}),c={value:0};l.onBeforeCompile=x=>{x.uniforms.uWind=c,x.vertexShader=`uniform float uWind;
`+x.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
 transformed.x+=position.y*.28*sin(uWind*1.7+instanceMatrix[3].x*.34+instanceMatrix[3].z*.4);`)};const h=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<=600,d=new an(a,l,h?3250:6500),u=new it,f=new Ce,p=Array.from({length:d.count},()=>[r.next()-.5,r.next()-.5,r.next()*6.28,.55+r.next()*.95]);for(let x=0;x<d.count;x++)d.setColorAt(x,f.setHex([8357448,11050069,6649416,11250280][x%4]));d.receiveShadow=!0,d.castShadow=!0,s.add(d);const y=new wy(s,c),m=new Gv(s);let g="",_=1/0,v=1/0;function M(x,E,w){const R=x*t-oa,I=E*t-la,N=new nn(t,t,w,w);N.rotateX(-Math.PI/2);const O=N.attributes.position,L=N.attributes.uv,k=new Float32Array(O.count*3);for(let P=0;P<O.count;P++){const H=R+t/2+O.getX(P),B=I+t/2+O.getZ(P),q=Ar(H),Z=wr(B);O.setY(P,dt(H,B)),L.setXY(P,H/t,B/t);const ae=.5+.5*Math.sin(H*.067+B*.094+1.8*Math.sin(B*.063)),Se=Gd(q,Z),$=ze.farms.some(ie=>pi(ie,q,Z,60))?1:0;k.set([.78+ae*.2+Se*.1+$*.12,.88+ae*.08-Se*.02-$*.06,.76+ae*.15+Se*.08-$*.08],P*3)}N.setAttribute("color",new qt(k,3)),N.computeVertexNormals();const U=new Dt(N,i);return U.position.set(R+t/2,0,I+t/2),U.receiveShadow=!0,s.add(U),U}function S(x,E,w,R){const I=Math.floor((x+oa)/t),N=Math.floor((E+la)/t),O=Math.max(1,Math.ceil(w*.52*R/t)+1),L=Math.max(1,Math.ceil(w*.65/t)+1),k=w<360,U=[I,N,O,L,k].join("/");if(U!==g){g=U;const q=new Set;for(let Z=Math.max(-2,N-L);Z<=Math.min(Math.ceil(2*la/t)+1,N+L);Z++)for(let ae=Math.max(-2,I-O);ae<=Math.min(Math.ceil(2*oa/t)+1,I+O);ae++){const Se=ae+","+Z,$=k&&Math.abs(ae-I)<=1&&Math.abs(Z-N)<=1?48:12;q.add(Se);const ie=n.get(Se);ie?.detail!==$&&(ie&&(s.remove(ie.mesh),ie.mesh.geometry.dispose()),n.set(Se,{mesh:M(ae,Z,$),detail:$}))}for(const[Z,ae]of n)q.has(Z)||(s.remove(ae.mesh),ae.mesh.geometry.dispose(),n.delete(Z))}if(d.visible=w<325,!d.visible)return;const P=Math.round(x/16)*16,H=Math.round(E/16)*16;if(P===_&&H===v)return;_=P,v=H;const B=160;for(let q=0;q<p.length;q++){const[Z,ae,Se,$]=p[q],ie=Z*B+Math.round((P-Z*B)/B)*B,Me=ae*B+Math.round((H-ae*B)/B)*B,we=Ar(ie),fe=wr(Me),te=we<0||we>gt||fe<0||fe>Mt||Math.abs(we-fr(fe))<ze.river.width*.52||Vd(we,fe);u.position.set(ie,dt(ie,Me),Me),u.rotation.y=Se,u.scale.setScalar(te?0:$),u.updateMatrix(),d.setMatrixAt(q,u.matrix)}d.instanceMatrix.needsUpdate=!0,d.computeBoundingSphere()}function b(){oa=gt*ut/2,la=Mt*ut/2;for(const x of n.values())s.remove(x.mesh),x.mesh.geometry.dispose();n.clear(),g="",_=v=1/0,S(0,0,158,1.7),m.rebuild(),y.rebuild()}return b(),{wind:c,updateView:S,rebuild:b,load:async()=>{await y.load(),y.rebuild()}}}const du=new Map,fu=["#263b65","#35558c","#4869a3"],Co=["#c9bda2","#e2d9bd","#f4edd5"],Po=["#92363d","#b44243","#d4544c"];function Iy(s,e=0,t=!1){const n=Math.floor(e)%6,i=[s,n,t].join("/"),r=du.get(i);if(r)return r;const a=document.createElement("canvas");a.width=48,a.height=64;const o=a.getContext("2d");o.imageSmoothingEnabled=!1;for(let l=0;l<40;l++){const c=l*.21+n*Math.PI/3,h=Math.round(Math.sin(c)*l*.085),d=Math.cos(c)>.45?2:Math.cos(c)<-.25?0:1;for(let u=0;u<25;u++){const f=l/39,p=u/24;let y=f<1/3?fu:f<2/3?Co:Po;if(s){const m=Math.min(Math.abs(f-p),Math.abs(1-f-p));y=m<.036?Po:m<.105?Co:fu,(Math.abs(f-.5)<.105||Math.abs(p-.5)<.155)&&(y=Co),(Math.abs(f-.5)<.061||Math.abs(p-.5)<.09)&&(y=Po)}t&&l>25&&u>17+l*7%9||(o.fillStyle=t?["#4c4136","#6c5641","#87755b"][d]:y[d],o.fillRect(5+l,6+u+h,1,1))}}return o.fillStyle="#544330",o.fillRect(2,4,3,60),o.fillStyle="#cfaa61",o.fillRect(2,4,1,60),o.fillStyle="#e8cb7f",o.fillRect(2,0,2,6),o.fillRect(1,2,4,2),s||(o.fillRect(0,1,2,1),o.fillRect(4,1,3,1)),du.set(i,a),a}const Ae="#25282b",es="#34302d",rn="#adb9bc",hi="#edf0dd",en="#e5ddc6",Ui="#925d42",$n="#e8b384",Ni="#bd893e",ht="#f5ce77",Hn="#70503a",Pl=Math.PI*2,pu=new Map,Rr=s=>s?["#68232d","#b93a37","#e36149"]:["#203857","#356294","#6287ab"];class Ny{constructor(e){this.c=e}c;box(e,t,n,i=1,r=1){this.c.fillStyle=e,this.c.fillRect(Math.round(t),Math.round(n),i,r)}line(e,t,n,i,r){const a=Math.max(1,Math.ceil(Math.max(Math.abs(i-t),Math.abs(r-n))));this.c.fillStyle=e;for(let o=0;o<=a;o++)this.c.fillRect(Math.round(t+(i-t)*o/a),Math.round(n+(r-n)*o/a),1,1)}oval(e,t,n,i,r){for(let a=-r;a<=r;a++){const o=Math.round(i*Math.sqrt(Math.max(0,1-(a/(r+.3))**2)));this.box(e,t-o,n+a,o*2+1)}}}function Dy(s,e,t,n,i,r,a,o=-1){const[l,c,h]=Rr(e),d=[-2,-1,0,1,2,1,0,-1],u=n==="march"||n==="run"||n==="thrust",f=n==="load",p=a<-.37,y=u?d[i%8]*(n==="run"||n==="thrust"?1.45:1):0,m=u&&i%2===1?-1:0,g=n==="thrust"?3:n==="run"?2:0,_=g+(f?1:0),v=m+(f?1:0);for(const[S,b,x]of[[-2,-2-y,"#a49e91"],[1,1+y,en]])s.line(x,S,-5,b,-2),s.line(x,S+1,-5,b+1,-2),s.box(es,b,-2,2,2),s.box(Ae,b,0,3);s.box(Ae,g-4,m-14,7,8),s.box(l,g-4,m-12,2,8),s.box(c,g-3,m-14,5,7),s.box(h,g-2,m-14,3),s.box(c,g-3,m-7,3,3),s.box(l,g,m-7,3,3),s.box(en,g-3,m-7,6),s.box(Ni,g,m-7),s.line(en,g-3,m-14,g+2,m-8),p||s.line("#c2bca9",g+2,m-14,g-3,m-8),s.box("#534539",g-5,m-13,2,5),s.box("#aaa394",g-5,m-14,3,2),s.box(es,g-4,m-8,3,2),s.box(t?ht:en,g-3,m-14,2),t&&(s.box(Ni,g-4,m-13,2,2),s.box(ht,g+2,m-14,2,2)),s.box(p?Hn:Ui,_-2,v-18,5,4),p?(s.box("#684b39",_-2,v-17,4,2),s.box(Ui,_+2,v-16),s.box("#a19a87",g-3,m-13,5,2),s.box("#4b4036",g-3,m-11,5,4),s.box("#87725b",g-2,m-11,3),s.box(en,g-1,m-10,1,3)):a>.6?(s.box($n,_-2,v-17,5,3),s.box(es,_-2,v-17),s.box(es,_+1,v-17),s.box(Ui,_,v-15)):(s.box($n,_,v-17,3,3),s.box($n,_+3,v-16),s.box(Ae,_+1,v-17)),s.box("#9b3330",_-1,m-15,3),t?(s.box(Ae,_-3,v-25,6,8),s.box("#383738",_-2,v-26,4,2),s.box("#55504a",_-2,v-24,2,3),s.box("#454341",_+1,v-25,1,2),s.box("#b94438",_-4,v-24,2,5),s.box(Ni,_,v-19,3)):(s.box(Ae,_-3,v-22,6,5),s.box("#464449",_-3,v-22,5),s.box("#674f38",_-3,v-19,6),s.box(Ae,_-2,v-18,7),s.box(ht,_+1,v-20),s.box(e?"#f3efdc":"#be493c",_-2,v-24,2,2));const M=(S,b)=>{s.box(Ui,S-1,b,3,2),s.box($n,S,b,2)};if(o>=0){if(o===0&&(M(2,-12+m),M(2,-8+m)),o===1){s.box("#563c32",0,-11+m,9,8),s.box("#ba7844",1,-10+m,7,5);for(let b=0;b<3;b++)s.line(en,b*3,-10+m,b*3+2,-5+m);s.box(en,0,-12+m,9,2),s.box(Ni,0,-5+m,9,2);const S=[-3,-1,2,3,1,-2][i%6];s.line(Hn,-3,-13+m,4,-15+m+S),s.line(ht,7,-14+m,2,-13+m-S),M(-3,-13+m),M(6,-14+m)}o===2&&(s.line("#503c27",1,-16+m,11,-15+m),s.box(ht,10,-15+m,2),M(4,-15+m),M(8,-15+m));return}if(n==="aim"||n==="thrust"){const S=n==="thrust"&&i%2===1?2:0,b=n==="thrust"?-10+m:-12,x=(Math.abs(a)>.85?4:0)+(n==="thrust"?2:0),E=n==="thrust"?16+S:14;s.line(Ae,x-3*r,b+1-3*a,x+r*E,b+1+a*E),s.line(Hn,x-3*r,b-3*a,x+r*(E-3),b+a*(E-3)),s.line(rn,x+3*r,b-1+3*a,x+r*E,b-1+a*E),s.box(ht,x+2*r,b+2*a),n==="thrust"&&(s.line(c,g-1,m-12,x+2*r,b+2*a),s.line(h,g+1,m-12,x+7*r,b+7*a),s.line(Ae,x+r*(E-1),b+a*(E-1),x+r*(E+7),b+a*(E+7)),s.line(rn,x+r*(E-1),b-1+a*(E-1),x+r*(E+7),b-1+a*(E+7)),s.line(hi,x+r*(E+1),b-1+a*(E+1),x+r*(E+8),b-1+a*(E+8)),S&&s.box("#ffffff",x+r*(E+8),b-1+a*(E+8),2,1)),M(x+2*r,b+2*a),M(x+7*r,b+7*a)}else if(n==="throw"){s.line(Hn,-5,-6,-2,-20),s.line(rn,-3,-17,-1,-25);const S=i<2?-5:2+Math.round(r*6),b=i<2?-21:-15+Math.round(a*5);s.line(c,1,-14,S,b),s.line(h,1,-13,S,b+1),M(S,b),i<2&&(s.oval(Ae,S,b-2,2,2),s.box("#bd9d6c",S+1,b-5))}else if(f){s.box(Hn,5,-18,2,15),s.box(rn,5,-21,1,12),s.box(Ni,6,-11);const S=[-16,-17,-21,-23,-19,-14,-12,-15][i%8];s.box(hi,6,S-5,1,11),s.line(c,2,-13,4,S+1),M(5,S),s.line(h,-2,-11,4,-10),M(4,-10)}else n==="run"?(s.line(Hn,-5,-5,6,-15+m),s.line(rn,3,-13+m,8,-18+m),M(2,-10+m)):(s.line(Hn,-1,-5+m,6,-19+m),s.line(rn,3,-14+m,8,-23+m),s.line(hi,7,-21+m,9,-25+m),M(2,-11+m))}function Uy(s,e,t,n,i,r=0){const[a,o,l]=Rr(e),c=n?Math.floor(t/2)%4:1,h=n?[[-3,-1],[3,-4],[7,-2],[1,0]][c]:[1,0],d=n?[[5,-2],[-2,0],[-6,-3],[1,-1]][c]:[-1,0],u=n?[0,-1,-2,-2,-1,0,1,0][t%8]:0,f=r===4||e&&r===0,p=f?"#716e67":e?"#4a2c1c":"#362218",y=f?"#b5b4a7":e?"#7e4e31":"#5e3d2b",m=f?"#e3e0ce":e?"#ad754c":"#8a6045";s.line(Ae,-9,-12+u,-10+d[0]*.6,-5+u),s.line(p,-8,-12+u,-9+d[0]*.6,-5+u),s.line(p,-9+d[0]*.6,-5+u,-8+d[0],d[1]),s.box(Ae,-9+d[0],d[1]-1,3,2),s.line(Ae,8,-12+u,9+h[0]*.6,-6+u),s.line(p,7,-12+u,8+h[0]*.6,-6+u),s.line(p,8+h[0]*.6,-6+u,9+h[0],h[1]),s.box(Ae,8+h[0],h[1]-1,3,2),s.line(Ae,-11,-15+u,-19,-10+u+(c%2?2:-1)),s.line("#3f3229",-12,-14+u,-18,-9+u+(c%2?2:-1)),s.line(Ae,-12,-13+u,-17,-7+u+(c%2?2:-1)),s.oval(Ae,0,-13+u,13,6),s.oval(p,0,-12+u,12,5),s.oval(y,0,-13+u,11,4),s.oval(m,2,-15+u,8,2),s.box(m,-9,-15+u,5,2),s.line(Ae,7,-16+u,11,-11+u),s.box(ht,9,-13+u,2,1),s.line(Ae,-7,-11+u,-7-d[0]*.5,-5+u),s.line(m,-6,-11+u,-6-d[0]*.5,-5+u),s.line(y,-6-d[0]*.5,-5+u,-5-d[0],Math.min(0,d[1]+1)),s.box(Ae,-6-d[0],Math.min(0,d[1]+1)-1,3,2),s.line(Ae,8,-11+u,9-h[0]*.5,-6+u),s.line(m,9,-11+u,10-h[0]*.5,-6+u),s.line(y,10-h[0]*.5,-6+u,11-h[0],Math.min(0,h[1]+1)),s.box(Ae,10-h[0],Math.min(0,h[1]+1)-1,3,2),s.oval(Ae,10,-18+u,5,6),s.oval(y,10,-18+u,4,5),s.line(m,11,-21+u,12,-15+u),s.box(Ae,10,-25+u,8,6),s.box(y,11,-24+u,6,4),s.box(m,14,-23+u,5,3),s.box(Ae,18,-22+u,2,3),s.box(en,17,-21+u,2,2),s.line(Ae,8,-23+u,9,-15+u),s.box(Ae,11,-27+u,2,3),s.box(m,12,-26+u,1,2),s.box(Ae,15,-23+u,1,1),s.box(ht,16,-20+u,1,1),s.line(Ae,3,-16+u,16,-20+u),s.box(Ae,-9,-17+u,14,8),s.box(a,-8,-16+u,12,6),s.box(o,-7,-15+u,10,4),s.box(l,-6,-15+u,4,2),s.box(ht,-8,-10+u,12,1),s.box(ht,-7,-12+u,2,1),s.box("#563925",-5,-17+u,8,3),s.box(en,-2,-15+u,4,4),s.box(Ae,-2,-12+u,5,7),s.box(es,-1,-12+u,3,5),s.box(rn,0,-6+u,3,1),s.line(Ae,-4,-24+u,-13,-19+u+(c%2?1:-2)),s.line(a,-4,-23+u,-12,-18+u+(c%2?1:-2)),s.line(o,-4,-22+u,-11,-17+u+(c%2?1:-2)),s.line(l,-5,-21+u,-10,-16+u+(c%2?1:-2)),s.box(Ae,-5,-25+u,10,10),s.box(o,-4,-24+u,8,8),s.box(a,-4,-22+u,2,6),s.box("#5d6870",-2,-24+u,6,7),s.box(rn,-1,-24+u,5,6),s.box(hi,0,-23+u,3,3),s.box(ht,-4,-24+u,2,2),s.box(en,-3,-17+u,7,1),s.box(Ni,0,-17+u,2,1),s.box(Ui,-2,-28+u,5,4),s.box($n,-1,-28+u,4,3),s.box(Ae,1,-28+u,1,1),s.box("#9b3330",-1,-25+u,3,1),s.box(Ae,-4,-33+u,9,5),s.box("#4e5860",-3,-32+u,7,3),s.box(rn,-2,-32+u,5,2),s.box(hi,-1,-32+u,3,1),s.box(ht,0,-34+u,3,2),s.box(Ae,-2,-29+u,8,1),s.line(Ae,-2,-33+u,-9,-29+u-c%2),s.line(e?"#cc3930":"#262b30",-2,-32+u,-8,-28+u-c%2),s.line(e?"#f0745d":"#4c5258",-3,-31+u,-7,-27+u-c%2),s.box(o,2,-23+u,3,3),s.box(Ui,3,-21+u,3,2),s.box($n,4,-21+u,2,1),s.box(ht,5,-22+u,3,2),i?(s.line(Ae,7,-20+u,21,-18+u),s.line(rn,7,-21+u,21,-19+u),s.line(hi,10,-22+u,22,-19+u)):(s.line(Ae,7,-22+u,15,-33+u),s.line(rn,6,-22+u,14,-33+u),s.line(hi,9,-26+u,15,-34+u)),n&&(s.box("#b5a97d",-15-c,-1,3,2),s.box("#d4c49a",-19-c,-3,2,2))}function mu(s,e,t,n){for(let i=0;i<8;i++){const r=(i+n/4)*Pl/8;s.line("#6c4b2d",e,t,e+Math.cos(r)*5.5,t+Math.sin(r)*5.5),s.line("#a87948",e,t,e+Math.cos(r)*4.5,t+Math.sin(r)*4.5)}for(let i=0;i<44;i++){const r=i*Pl/44;s.box(Ae,e+Math.cos(r)*6.5,t+Math.sin(r)*6.5),s.box(Math.sin(r)<0?"#c99658":"#785134",e+Math.cos(r)*5.5,t+Math.sin(r)*5.5)}s.box(Ae,e-2,t-2,5,5),s.box("#564131",e-1,t-1,3,3),s.box(ht,e,t)}function Lo(s,e,t,n,i,r,a){const[o,l,c]=Rr(e),h=a?[-1,0,1,0][r%4]:0,d=a&&r%2===1?-1:0,f=t+(a?2:0),p=n+d;s.line("#a49e91",t-2,n-5,t-2-h,n-2),s.line("#a49e91",t-1,n-5,t-1-h,n-2),s.line(en,t+1,n-5,t+1+h,n-2),s.line(en,t+2,n-5,t+2+h,n-2),s.box(es,t-2-h,n-2,2,2),s.box(Ae,t-2-h,n,3,1),s.box(es,t+1+h,n-2,2,2),s.box(Ae,t+1+h,n,3,1),s.box(Ae,f-4,p-14,8,8),s.box(o,f-4,p-12,2,7),s.box(l,f-3,p-14,6,7),s.box(c,f-2,p-14,3,1),s.box(l,f-3,p-7,3,2),s.box(o,f,p-7,3,2),s.box(en,f-3,p-7,6,1),s.box(Ni,f,p-7,1,1),s.line(en,f-3,p-14,f+2,p-8),s.line("#c2bca9",f+2,p-14,f-3,p-8),s.box(ht,f-3,p-14,2,1),s.box(Ui,f-2,p-18,5,4),s.box($n,f,p-17,3,3),s.box($n,f+3,p-16,1,1),s.box(Ae,f+1,p-17,1,1),s.box("#9b3330",f-1,p-15,3,1),s.box(Ae,f-3,p-22,6,5),s.box("#464449",f-3,p-22,5,1),s.box("#674f38",f-3,p-19,6,1),s.box(Ae,f-2,p-18,7,1),s.box(ht,f+1,p-20,1,1),s.box("#cf3e34",f-2,p-24,2,2);const y=[0,1,2,1][r%4],m=(g,_)=>{s.box(Ui,g-1,_,3,2),s.box($n,g,_,2,1)};a?(s.line(l,f+1,p-12,f+6,p-9),s.line(c,f+1,p-11,f+5,p-9),m(f+5,p-9)):i===0?(s.line(Ae,f-4,p-5-y,f+10,p-14-y),s.line(Hn,f-4,p-6-y,f+10,p-15-y),s.box(Ae,f+7,p-17-y,5,4),s.box("#d8cbb0",f+8,p-16-y,3,2),m(f+3,p-10-y)):i===1?(s.oval(Ae,f+5,p-10+y,3,3),s.oval("#3a4044",f+5,p-10+y,2,2),s.box(hi,f+4,p-11+y,1,1),m(f+2,p-9+y)):(s.line(Ae,f+2,p-7,f+9,p-13-y),s.line("#8c6642",f+2,p-8,f+9,p-14-y),s.box("#f27b2b",f+9,p-15-y,2,2),s.box("#fff09a",f+9,p-15-y,1,1),m(f+3,p-9))}function Fy(s,e,t,n,i,r,a){const o=t==="march"||t==="run",l=t==="recoil"?[0,7,7,6,5,4,3,2,1][n]:0,c=-Math.round(l*i),h=-Math.round(l*r),d=h-6,u=o||t==="recoil"&&n>=3;Lo(s,e,-14,-5,0,n,u),Lo(s,e,1,-8,1,n,u);const f=o?n:t==="recoil"?l:0;mu(s,c+2,d-4,f),s.line(Ae,c-18*i,h-1-18*r,c+5*i,h-7+5*r),s.line(Ae,c-18*i,h-4-18*r,c+5*i,h-10+5*r),s.line(Hn,c-17*i,h-2-17*r,c+4*i,h-8+4*r),s.line("#b98c52",c-16*i,h-3-16*r,c+3*i,h-9+3*r),s.box(rn,c-15*i,h-3-15*r,2,2);const p=(y,m,g,_,v=0)=>{const M=c+i*y-r*v,S=h-10+r*y+i*v;for(let b=0;b<g;b++)s.line(_,M-r*b,S+i*b,c+i*m-r*(v+b),h-10+r*m+i*(v+b))};p(-6,18,7,Ae,-3),p(-5,17,5,"#573f28",-2),p(-5,17,3,"#b3833e",-1),p(-4,17,1,"#f4d88c",-1);for(const y of[-4,2,10,16])p(y,y+1,7,"#6e4d26",-3),p(y,y+1,2,"#f7df94",-3);p(18,18,3,Ae,-1),mu(s,c-1,d,f),Lo(s,e,-18,6,2,n,o),o||(s.box(Ae,-25,2,10,7),s.box("#563e2c",-24,3,8,5),s.box("#a87e4b",-24,3,8,2),s.box(ht,-22,3,1,5),s.box(ht,-18,3,1,5),s.box(Ae,4,2,7,7),s.box("#62533f",5,3,5,5),s.box(rn,5,3,5,1),s.box("#9d9582",5,6,5,1))}function Oy(s,e,t,n,i,r,a,o,l=!1){const c=[s,e,t,n,i,r,a,Number(o),Number(l)].join("/"),h=pu.get(c);if(h)return h;const d=s==="field_cannon",u=s==="cuirassier",f=s==="bannerman",p=document.createElement("canvas");p.width=d?68:u?50:f?46:50,p.height=d?58:u?44:f?47:42;const y=Math.floor(p.width/2),m=p.height-(d?18:u?6:f?3:9),g=p.getContext("2d");g.imageSmoothingEnabled=!1,g.translate(y,m);const _=n*Pl/16,v=Math.cos(_),M=Math.sin(_);v<-.001&&(g.scale(-1,1),g.translate(-1,0));const S=new Ny(g);if(d?Fy(S,e,t,i,Math.abs(v),M):u?Uy(S,e,i,t==="march"||t==="run",t==="thrust",r):(Dy(S,e,s==="guard_grenadier",t,i,Math.abs(v),M,f?r===2?0:r:l?4:r===3?3:-1),f&&r!==1&&(g.drawImage(Iy(e,i),2,-36,21,37),r===2&&e&&(S.box("#a45338",10,-31,10,10),S.box(ht,14,-28,2,4),S.box(ht,12,-27,6,1)))),u&&r>0)if(r===2){S.line(Hn,3,-15,18,-36),S.line(ht,4,-15,19,-36);for(let x=0;x<4;x++)S.box(x<2?"#bd4040":en,16-x,-33+x,7-x)}else r===4||r===5||r===3?(S.box(Ae,-5,-33,10,2),S.box(Ae,-3,-35,6,3),S.box(ht,1,-33,2),S.box(r===4?"#535a50":Rr(e)[1],-4,-23,7,5)):(S.box(e?"#233549":"#ac8549",-2,-24,6,6),S.box(ht,-1,-24,3));else if(!d&&!f){if(r===3)g.clearRect(-5,-30,13,12),S.box(Ae,-5,-21,11,2),S.box(Ae,-2,-24,5,4),S.box(ht,1,-22,2),S.box(ht,-4,-14,3,2),S.line(hi,3,-11,t==="aim"||t==="run"?16:10,t==="aim"||t==="run"?-14:-23+i%3),S.box(Ni,3,-12,3);else if(r===1||r===2){const x=e?"#66844d":r===1?"#d74d42":"#c8ba48";S.box(x,-4,-26,2,6),S.box(x,-3,-14,3,2),e&&r===2&&(S.box(Ae,-4,-23,8,5),S.box("#c9b9a0",-3,-24,3),S.box("#354f40",-4,-8,8,5),S.box("#976550",-2,-8,1,5),S.box("#84916c",-4,-6,8)),e&&s==="guard_grenadier"&&(S.box("#304b35",-3,-14,5,7),S.line("#9aa778",-2,-14,1,-9))}}else d&&r>0&&(S.box(r===3?ht:rn,-16,-19,4,2),S.box(Ae,-17,-17,6));f&&r===1&&!e&&(S.box("#a75738",-3,-14,4,5),S.box(ht,-3,-14,3)),l&&!d&&!u&&(g.clearRect(-5,-32,16,14),S.box("#58463b",0,-19,5,2),S.line(Rr(e)[1],1,-13,5,-11+i%3),S.box($n,5,-11+i%3,2,2));const b={art:p,footX:y,footY:m};return pu.set(c,b),b}const ca=["line_infantry","guard_grenadier","cuirassier","bannerman","field_cannon"],gc=[600,1200,1800],gu=30,ky={aggressive:{label:"激进",text:"炮火准备短，频繁刺刀冲锋，骑兵求战心切"},cautious:{label:"谨慎",text:"长时间炮击，多一个炮兵连，只在敌军动摇时出击"},cunning:{label:"狡诈",text:"骑兵迂回侧翼，专挑薄弱处下手"},steadfast:{label:"坚毅",text:"步兵士气更高，伤亡惨重仍不易溃散"}},xu={clear:{label:"晴",text:"视野开阔，炮弹在硬地上弹跳得又远又狠"},rain:{label:"雨后泥泞",text:"三成火枪哑火，炮弹陷进泥里滚不远，行军变慢"},fog:{label:"晨雾",text:"视距缩短，炮兵很难远距离命中"}};let Io,wn;const Yd=(s,e,t)=>s+"/"+e+"/"+t;function $d(s,e,t){const n={},i={};let r=0;e.motions.forEach((l,c)=>{n[l]=r,i[l]=e.counts[c],r+=i[l]*4});const a=new Map(e.groups.map(l=>[Yd(l.f,l.kind,l.role),l])),o=s.image;if(e.version!==1||e.groups.some(l=>l.frames.length!==r)||o.width!==e.width||o.height!==e.height)throw Error("角色图集版本或尺寸不符");return s.minFilter=s.magFilter=_t,s.generateMipmaps=!1,s.colorSpace=xt,{tex:s,image:o,data:e,offsets:n,counts:i,groups:a,fallback:t}}const _s={line_infantry:[0,1,2,3],guard_grenadier:[0,1,3],cuirassier:[0,1,2,3,4,5],field_cannon:[0,1,3],bannerman:[0,1,2]};function _u(){const s=["stand","march","run","aim","load","thrust","recoil","die","flee","kneel","kneelLoad"],e=[6,8,8,6,8,6,8,6,8,4,4],t=44,n=92,i=78,r=56,a=(v,M,S)=>(M==="stand"||M==="aim")&&v!=="bannerman"?2:S,o=v=>v==="line_infantry"||v==="guard_grenadier",l=2*Object.keys(_s).reduce((v,M)=>v+_s[M].length*s.reduce((S,b,x)=>S+((b==="kneel"||b==="kneelLoad")&&!o(M)?0:a(M,b,e[x])),0),0),c=document.createElement("canvas");c.width=t*n,c.height=Math.ceil(l/t)*i;const h=document.createElement("canvas");h.width=c.width;const d=2*ca.filter(o).reduce((v,M)=>v+_s[M].length*8,0);h.height=Math.ceil((l-d)/t)*i;let u=h.getContext("2d");u.imageSmoothingEnabled=!1;const f=[],p=[],y=(v,M,S,b,x)=>[v,M,S,b,x].join("/"),m=new Map;function g(v,M,S,b,x){const E=b==="kneel"||b==="kneelLoad",w=b==="kneel"?"stand":b==="kneelLoad"?"load":b,R=Oy(M,v,w==="die"?"stand":w==="flee"?"run":w,0,x,S,3,!1,w==="flee"),I=f.length,N=I%t*n,O=Math.floor(I/t)*i;u.save(),u.beginPath(),u.rect(N,O,n,i),u.clip(),u.translate(N+n/2,O+r),E&&u.scale(1,.72),w==="die"&&(u.translate(0,x*.7),u.rotate(-x*.29));const L=M==="cuirassier"?1.42:1.5;if(u.scale(L,L),w==="stand"&&x&&u.translate(0,-.5),w==="aim"&&x&&u.translate(-1,0),u.drawImage(R.art,-R.footX,-R.footY),M==="line_infantry"||M==="guard_grenadier"){u.scale(1/L,1/L);const k=(w==="run"||w==="flee"?2:w==="thrust"?3:0)*L,U=(w==="march"||w==="run"||w==="flee")&&x%2?-1:0;u.fillStyle="#f4ce82";for(let P=0;P<3;P++)u.fillRect(Math.round(k+1),-19+P*3+U,1,1);u.fillStyle=S===3?"#e4b657":"#b3a58e",u.fillRect(Math.round(k-4),-20+U,3,1),w!=="flee"&&(u.fillStyle="#e2cc91",u.fillRect(Math.round(k),-29+U,1,2))}u.restore(),m.set(y(v,M,S,b,x),I),f.push([N,O,n,i,n/2,r])}const _=["stand","march","aim","load","thrust","recoil","run","die","flee"];for(const v of[0,1])for(const M of ca)for(const S of _)for(const b of _s[M])for(let x=0;x<a(M,S,e[s.indexOf(S)]);x++)g(v,M,b,S,x);u=c.getContext("2d"),u.imageSmoothingEnabled=!1,u.drawImage(h,0,0);for(const v of[0,1])for(const M of ca)if(o(M))for(const S of _s[M])for(const b of["kneel","kneelLoad"])for(let x=0;x<4;x++)g(v,M,S,b,x);for(const v of[0,1])for(const M of ca)for(const S of _s[M]){const b=[];s.forEach((x,E)=>{const w=o(M)?x:x==="kneel"?"stand":x==="kneelLoad"?"load":x,R=a(M,w,e[s.indexOf(w)]);for(let I=0;I<e[E];I++){const N=m.get(y(v,M,S,w,I%R));b.push(N,N,N,N)}}),p.push({f:v,kind:M,role:S,label:M+" "+S,frames:b})}return $d(new zi(c),{version:1,width:c.width,height:c.height,motions:s,counts:e,tiles:f,groups:p},!0)}function By(){return Io||(Io=(async()=>{if(new URLSearchParams(location.search).get("sprites")!=="baked")return wn=_u(),wn;try{const[s,e]=await Promise.all([fetch("./art/soldiers/regiments.json").then(t=>{if(!t.ok)throw Error(String(t.status));return t.json()}),new Ba().loadAsync("./art/soldiers/regiments.png")]);wn=$d(e,s,!1)}catch{wn=_u()}return wn})()),Io}function zy(){if(!wn)throw Error("角色图集正在载入");const{data:s,image:e,counts:t,offsets:n}=wn,i=wn.fallback?92:65,r=wn.fallback?78:57,a=140,o=document.createElement("canvas");o.width=a+s.motions.length*4*i,o.height=78+s.groups.length*r;const l=o.getContext("2d");l.imageSmoothingEnabled=!1,l.fillStyle="#272e33",l.fillRect(0,0,o.width,o.height);const c={stand:"站立",march:"行军",run:"奔跑",aim:"瞄准",load:"装填",thrust:"突刺",recoil:"后坐",die:"倒地",flee:"溃逃",kneel:"跪姿",kneelLoad:"跪姿装填"};return l.fillStyle="#f4e9cd",l.font="bold 17px sans-serif",l.fillText("1815 · 角色图鉴",10,24),s.motions.forEach((h,d)=>{const u=a+d*4*i;l.fillStyle="#d5bc80",l.fillText(c[h],u+6,28),l.font="13px sans-serif",["侧右","侧左","斜前","斜后"].forEach((f,p)=>l.fillText(f,u+p*i+16,56))}),s.groups.forEach((h,d)=>{const u=78+d*r;l.fillStyle=d%2?"#303a3d":"#343d40",l.fillRect(0,u,o.width,r-1),l.fillStyle=h.f?"#ffc5ae":"#b2d5f1",l.font="14px sans-serif",l.fillText((h.f?"联军":"法军")+" · "+h.label,9,u+32),s.motions.forEach((f,p)=>{for(let y=0;y<4;y++){const m=f==="die"?t[f]-1:Math.floor(t[f]/3),g=h.frames[n[f]+m*4+y],[_,v,M,S,b,x]=s.tiles[g];l.save(),l.translate(a+(p*4+y+.5)*i,u+(wn.fallback?56:48)),wn.fallback&&y===1&&l.scale(-1,1),l.drawImage(e,_,v,M,S,-b,-x,M,S),l.restore()}})}),o}function Kn(s,e,t,n){const i=new Ds(new Float32Array(t*n),n).setUsage(yr);return s.setAttribute(e,i),i}function Wn(s,e,t=0){e<=0||(s.clearUpdateRanges(),s.addUpdateRange(t*s.itemSize,e*s.itemSize),s.needsUpdate=!0)}function Gy(){const s=document.createElement("canvas");s.width=s.height=64;const e=s.getContext("2d"),t=e.createRadialGradient(32,32,1,32,32,31);return t.addColorStop(0,"rgba(20,14,10,.66)"),t.addColorStop(.45,"rgba(25,20,13,.42)"),t.addColorStop(1,"rgba(24,18,12,0)"),e.fillStyle=t,e.fillRect(0,0,64,64),new zi(s)}class Hy{mesh;ao;rim={value:new Ce("#e7bb77")};tint;uv;flip;o=new it;sheet;unitGroups=new WeakMap;ready;constructor(e){const t=new Nt,n=2400,i=new nn(1,1);this.uv=Kn(i,"aUvRect",n,4),this.flip=Kn(i,"aFlipFlash",n,2),this.tint=Kn(i,"aTint",n,3);const r=new ka({map:t,alphaTest:.45,side:Tt}),a=new oc({depthPacking:id,map:t,alphaTest:.45,side:Tt}),o={value:new ke};for(const c of[r,a])c.onBeforeCompile=h=>{h.vertexShader=`attribute vec4 aUvRect;attribute vec2 aFlipFlash;attribute vec3 aTint;varying vec4 vTintHit;
`+h.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
 vMapUv=aUvRect.xy+vec2(mix(uv.x,1.-uv.x,aFlipFlash.x),uv.y)*aUvRect.zw;vTintHit=vec4(aTint,aFlipFlash.y);`),c!==a&&(h.uniforms.rimColor=this.rim,h.uniforms.atlasPixel=o,h.fragmentShader=`varying vec4 vTintHit;uniform vec3 rimColor;uniform vec2 atlasPixel;
`+h.fragmentShader.replace("#include <lights_lambert_pars_fragment>",qe.lights_lambert_pars_fragment.replace("saturate( dot( geometryNormal, directLight.direction ) )","(0.5+0.5*dot(geometryNormal,directLight.direction))")).replace("#include <map_fragment>",`#include <map_fragment>
 diffuseColor.rgb *=vTintHit.rgb;`).replace("#include <opaque_fragment>",`float edge=1.-min(texture2D(map,vMapUv+vec2(0.,atlasPixel.y)).a,texture2D(map,vMapUv-vec2(atlasPixel.x,0.)).a);
                outgoingLight+=rimColor*edge*.115+vec3(vTintHit.w*.8);
                #include <opaque_fragment>`))};this.mesh=new an(i,r,n),this.mesh.customDepthMaterial=a,this.mesh.castShadow=this.mesh.receiveShadow=!0,this.mesh.frustumCulled=!1;const l=new nn(1,1);l.rotateX(-Math.PI/2),this.ao=new an(l,new Yn({map:Gy(),transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2}),n),this.ao.frustumCulled=!1,this.ao.renderOrder=1,e.add(this.mesh,this.ao),this.mesh.count=this.ao.count=0,this.ready=By().then(c=>{this.sheet=c,r.map=a.map=c.tex,o.value.set(1/c.data.width,1/c.data.height),r.needsUpdate=a.needsUpdate=!0,t.dispose()})}draw(e,t,n,i){const r=this.sheet;if(!r)return;let a=0;const o=this.o,l=this.mesh.instanceMatrix.count;for(const c of e)if((c.hp>0||n-c.diedAt<12)&&a<l){const h=t[c.company],d=c.officer&&c.hp>0&&!h.engaged&&h.status!=="rout"&&(h.formation==="line"||h.formation==="column"),u=d?h.hx*6+h.hy*13:0,f=d?h.hy*6-h.hx*13:0,p=Lt(u+c.px+(c.x-c.px)*i),y=It(f+c.py+(c.y-c.py)*i),m=dt(p,y);let g=this.unitGroups.get(c);if(!g){const ie=c.kind==="guard_grenadier"||c.kind==="field_cannon"?2:3,Me=c.general?4:c.kind==="cuirassier"&&c.staff?5:c.officer?3:c.kind==="bannerman"?c.id%3===0?1:c.faction&&c.id%2?2:0:(r.fallback?c.id:h.id)%ie;g={group:r.groups.get(Yd(c.faction,c.kind,Me)),kneelAt:-1},this.unitGroups.set(c,g)}const _=c.hp<=0?"die":h.status==="rout"?"flee":c.pose;_==="kneel"?g.kneelAt<0&&(g.kneelAt=n):g.kneelAt=-1;const v=_==="kneel"?Math.min(3,(n-g.kneelAt)/2):_==="die"?(n-c.diedAt)/2:_==="march"||_==="run"||_==="flee"?c.stride*r.counts[_]/Ft.strideLength:_==="load"||_==="kneelLoad"?(n-c.firedAt)/8:_==="recoil"?(n-c.firedAt)/2:(n+c.id)/5,M=Math.max(0,Math.floor(v))%r.counts[_],S=h.status==="rout"||h.engaged,b=S?c.face*Math.max(8,Math.abs(c.vx)):h.hx,x=S?c.vy:h.hy,E=Math.abs(x)>.54*Math.abs(b),w=E?x>=0?2:3:b>=0?0:1,R=r.fallback?c.face<0:E&&b<0,I=g.group.frames[r.offsets[_]+M*4+w],[N,O,L,k,U,P]=r.data.tiles[I],H=r.data.width,B=r.data.height;this.uv.setXYZW(a,N/H,1-(O+k)/B,L/H,k/B);const q=r.fallback?.88+c.id*17%13*.01:.91+c.id*17%10*.01;this.tint.setXYZ(a,q,q,q*.99),this.flip.setXY(a,Number(R),Math.max(0,1-(n-c.hitAt)/4));const Z=(r.fallback?.055:.074)*(c.general?r.fallback?1.3:1.22:1),ae=(P-k/2)*Z;o.position.set(p+(R?-1:1)*(L/2-U)*Z,m+.045+ae*.99027,y-ae*.13917);const Se=c.hp>0?Math.max(0,1-(n-c.hitAt)/4)*c.face*.15:0;o.rotation.set(-.139626,0,Se),o.scale.set(L*Z,k*Z,1),o.updateMatrix(),this.mesh.setMatrixAt(a,o.matrix),o.rotation.set(0,0,0),o.position.set(p,m+.045,y);const $=c.kind==="cuirassier"||c.kind==="field_cannon";o.scale.set($?3.7:1.7,1,$?1.5:.91),o.updateMatrix(),this.ao.setMatrixAt(a,o.matrix),a++}this.mesh.count=this.ao.count=a;for(const c of[this.mesh.instanceMatrix,this.ao.instanceMatrix,this.uv,this.flip,this.tint])Wn(c,a)}}const vs=160,vu=300;class yu{reports=[new Map,new Map];canSee(e,t,n){if(t.faction===n.faction||t.alive<=0||n.alive<=0||t.status==="gone"||t.status==="rout"||n.status==="gone")return!1;const i=e.weather==="fog"?9:e.weather==="rain"?17:22;return Math.abs(Math.floor(t.x/vs)-Math.floor(n.x/vs))<=i&&Math.abs(Math.floor(t.y/vs)-Math.floor(n.y/vs))<=i}visibleToArmy(e,t){const n=e.companies.filter(i=>i.faction===t&&i.alive>0&&i.status!=="rout"&&i.status!=="gone");return e.companies.filter(i=>i.faction!==t&&n.some(r=>this.canSee(e,r,i)))}scan(e){for(const t of[0,1]){const n=this.reports[t];for(const[i,r]of n)e.tick-r.tick>=vu&&n.delete(i);for(const i of this.visibleToArmy(e,t))n.set(i.id,Object.freeze({id:i.id,column:Math.floor(i.x/vs),row:Math.floor(i.y/vs),tick:e.tick}))}}latest(e,t){let n;for(const i of this.reports[t].values())e.tick-i.tick<vu&&(!n||i.tick>n.tick)&&(n=i);return n}}const xc={musket:{points:60,flashTicks:3},round:{points:110,flashTicks:1},scatter:{points:110,flashTicks:3}},pr=Fl.effective,Kd=Fl.scatter,Ll=s=>s.weather==="fog"?1350:Fl.round,De=(s,e)=>Math.hypot(s.x-e.x,s.y-e.y);function mi(s,e,t,n,i,r,a=t.x,o=t.y){const l={type:e,x:a,y:o,dx:n,dy:i,explosive:r,unitId:t.id,kind:t.kind,faction:t.faction};return s.events.push(l),l}function gi(s,e){s.status!=="gone"&&(s.morale=Math.max(0,s.morale-e))}function Zd(s,e,t,n,i,r,a){if(e.hp<=0||(e.hp=Math.max(0,e.hp-t),e.hitAt=s.tick,mi(s,"hit",e,n,i,r),e.hp>0))return!1;e.diedAt=s.tick,e.moving=!1,e.vx=0,e.vy=0,s.alive[e.faction]--,s.dead[e.faction]++,mi(s,"death",e,n,i,r);const o=s.companies[e.company];o.ammo-=e.ammo,o.alive--,o.losses++,o.alive||(o.order="hold",o.forced=-1);const l=1-o.alive/o.peak;return gi(o,(mt(o)?70:ft(o)?62:95)/Math.max(6,o.peak)*(1+l*1.4)),Ts(e)&&--o.colors===0&&o.alive>3&&(gi(o,12),(ft(o)||s.tick>900&&s.rng.next()<.2)&&s.say(`${o.name}的军旗倒下了`,o.faction,e.x,e.y,1)),a&&a.faction!==e.faction&&a.kills++,e.general&&s.generalDown(e,r?"炮弹":"骑兵"),!0}function No(s,e,t,n=!1){if(e.ammo<=0||e.status==="rout")return;const i=e.firingSince<0,r=s.tick-e.firingSince,a=i?"first":e.status==="shaken"||r>2700?"free":e.faction===1&&e.id%3===0?"platoon":"rank",o=a==="platoon"?4:e.ranks,l=t.x-e.x,c=t.y-e.y,h=-l*e.hy+c*e.hx,d=(l*e.hx+c*e.hy)/Math.max(1,Math.hypot(l,c)),u=v=>!n||d>=.5||(d<-.707?v.slot>=Math.max(0,e.capacity-e.files):h>0?v.slot%e.files>=e.files/2:v.slot%e.files<e.files/2),f=e.members.filter(v=>v.hp>0&&v.ammo>0&&!v.moving&&v.loadedAt<=s.tick&&v.fireAt<=s.tick&&(e.formation!=="column"||v.slot<e.files*2)&&u(v)),p=v=>a==="platoon"?Math.min(3,Math.floor(v.slot%e.files*4/e.files)):Math.floor(v.slot/e.files)%e.ranks;let y=e.nextGroup%o;f.length&&!f.some(v=>p(v)===y)&&(y=p(f[0]));const m=f.filter(v=>i||a==="free"||p(v)===y);if(!m.length){e.reloadAt=s.tick+6;return}if(!n&&!i&&a==="rank"&&!f.some(v=>p(v)!==y)&&e.members.some(v=>v.hp>0&&v.ammo>0&&p(v)!==y&&(e.formation!=="column"||v.slot<e.files*2))&&s.tick-e.firstVolleyAt>110){e.reloadAt=s.tick+6;return}e.fireMode=a,e.target=t.id,e.volleys++,i&&(e.firingSince=s.tick,e.firstVolleyAt=s.tick);const g=Math.round(82*(ft(e)?.9:1)*(1+.15*e.fatigue+(s.weather==="rain"?.15:0)));for(const v of m)v.fireAt=s.tick+1+(a==="free"?s.rng.int(0,35):v.slot%e.files%5),v.shotTarget=t.id,n&&(v.fireAt=-1,Jd(s,v,e));for(const v of e.members){const M=Math.floor(v.slot/e.files)%e.ranks;(i&&M===0||!i&&M<y)&&(v.kneelUntil=s.tick+10)}e.nextGroup=(y+1)%o,e.reloadAt=s.tick+(i?g:a==="free"?15:Math.max(12,Math.round(g/o))),t.underFire=s.tick+90;const _=e.losses>Math.max(1,e.kills)*1.3;gi(e,.08*(_?1.5:1)),gi(t,.2*(t.formation==="column"?.7:1)*(t.losses>Math.max(1,t.kills)*1.3?1.5:1))}function Jd(s,e,t){const n=s.companies[e.shotTarget];if(!n||!s.sight.canSee(s,t,n)||n.status==="gone"||t.status==="rout"||e.moving||e.ammo<=0||t.assaultStage==="rush")return;e.ammo--,t.ammo--,e.shotsFired++,e.loadedAt=s.tick+Math.round(s.rng.int(75,90)*(ft(t)?.9:1)*(1+.15*t.fatigue+(s.weather==="rain"?.15:0)+(e.shotsFired>15?.15:0))),t.smoke=Math.min(1,t.smoke+.04);const i=n.x-e.x,r=n.y-e.y,a=Math.max(1,Math.hypot(i,r));if(e.firedAt=s.tick,e.pose="aim",s.weather==="rain"&&s.rng.next()<.3)return;const o=mi(s,"fire",e,i/a,r/a,!1),l=s.boardShots.place(s,e,"musket",n.x+s.rng.int(-110,110),n.y+s.rng.int(-110,110),s.tick+xc.musket.flashTicks);o.endX=l.x,o.endY=l.y}function Vy(s,e,t){const n=s.companies[e.company],i=s.companies[t.company],r=t.x-e.x,a=t.y-e.y,o=Math.max(1,Math.hypot(r,a));mi(s,"slash",e,r/o,a/o,!1);let l=Ve(e)?s.rng.int(45,120):s.rng.int(28,78);Ve(e)&&i.formation==="square"&&i.formUntil<=s.tick&&i.status!=="rout"&&(l*=.28),i.status==="rout"&&(l*=1.6),ft(e)&&(l*=1.2),n.status==="shaken"&&(l*=.75),Zd(s,t,l,r/o,a/o,!1,n),e.cooldown=s.rng.int(22,44),e.firedAt=s.tick}function Wy(s,e,t,n){const i=De(e,n);if(e.pose="recoil",i<Kd){e.firedAt=s.tick,mi(s,"fire",e,(n.x-e.x)/Math.max(1,i),(n.y-e.y)/Math.max(1,i),!0),s.boardShots.place(s,e,"scatter",n.x+s.rng.int(-48,48),n.y+s.rng.int(-48,48),s.tick+xc.scatter.flashTicks),e.cooldown=s.rng.int(210,270);return}const r=n;(e.aimTarget!==n.id||Math.hypot(n.x-e.aimX,n.y-e.aimY)>150)&&(e.aimTarget=n.id,e.aimX=n.x,e.aimY=n.y,e.shotsOnTarget=0,e.rangeError=(s.rng.next()<.5?-1:1)*s.rng.int(120,260)*(s.weather==="fog"?2:1));for(const v of t.members)v.hp>0&&v.shotsOnTarget>0&&v.aimTarget===n.id&&Math.hypot(n.x-v.aimX,n.y-v.aimY)<=150&&Math.abs(v.rangeError)<Math.abs(e.rangeError)&&(e.rangeError=v.rangeError);const a=(n.x-e.x)/i,o=(n.y-e.y)/i,l=(s.rng.next()+s.rng.next()-1)*(14+i*.03)*(e.shotsOnTarget<2?1.8:1),c=s.rng.next()<.22,h=e.rangeError+(c?s.rng.int(560,1600):0),d=r.x+a*h-o*l,u=r.y+o*h+a*l,f=Math.max(1,Math.hypot(d-e.x,u-e.y)),p=(d-e.x)/f,y=(u-e.y)/f,m=d,g=u;let _=(s.weather==="rain"?100:280)*(c?2.2:1);e.firedAt=s.tick,e.rangeError*=s.weather==="fog"?.7:.55,e.shotsOnTarget++,Hd(d,u,n.faction)&&(_*=.3,s.tick-([...s.news].reverse().find(v=>v.text.includes("炮弹砸在山脊"))?.tick??-1e3)>900&&s.say("炮弹砸在山脊上，没能弹过去",e.faction,d,u,1)),s.boardShots.place(s,e,"round",m,g,s.tick+Math.max(6,Math.ceil(f/60))-1),s.rounds.push({x:e.x,y:e.y,tx:m,ty:g,dx:p,dy:y,age:0,duration:Math.max(6,Math.ceil(f/60)),roll:_,rolled:0,speed:24,gun:e,faction:e.faction,company:t.id}),mi(s,"fire",e,p,y,!0),e.cooldown=s.rng.int(210,270)}function Il(s,e=0){if(s.age+e<s.duration){const n=Math.min(1,(s.age+e)/s.duration);return{x:s.x+(s.tx-s.x)*n,y:s.y+(s.ty-s.y)*n,h:8*n*(1-n)+.5}}const t=Math.min(s.roll,s.rolled+s.speed*e);return{x:s.tx+s.dx*t,y:s.ty+s.dy*t,h:.25+Math.abs(Math.sin(t*.035))*1.1*(1-t/Math.max(1,s.roll))}}function Xy(s){for(let e=s.rounds.length-1;e>=0;e--){const t=s.rounds[e];if(t.age++,t.age<t.duration)continue;t.age===t.duration&&mi(s,"impact",t.gun,t.dx,t.dy,!0,t.tx,t.ty);const n=Math.min(t.speed,t.roll-t.rolled);t.rolled+=n,t.speed*=.985;const i=t.tx+t.dx*t.rolled,r=t.ty+t.dy*t.rolled;Math.floor(t.rolled/120)>Math.floor((t.rolled-n)/120)&&mi(s,"bounce",t.gun,t.dx,t.dy,!0,i,r),(t.rolled>=t.roll||t.speed<5||i<0||r<0||i>=gt||r>=Mt)&&s.rounds.splice(e,1)}}const ai=32,Mu=["musket","round","scatter"];class Su{due=[];x=[];y=[];source=[];kind=[];count=0;stats={musket:{sent:0,hits:0,friendly:0},round:{sent:0,hits:0,friendly:0},scatter:{sent:0,hits:0,friendly:0}};place(e,t,n,i,r,a){const o=this.count++;return this.due[o]=a,this.x[o]=(Math.floor(i/ai)+.5)*ai,this.y[o]=(Math.floor(r/ai)+.5)*ai,this.source[o]=t.id,this.kind[o]=Mu.indexOf(n),this.stats[n].sent++,{x:this.x[o],y:this.y[o]}}step(e){let t=0;for(let n=0;n<this.count;n++){if(this.due[n]>e.tick){t!==n&&(this.due[t]=this.due[n],this.x[t]=this.x[n],this.y[t]=this.y[n],this.source[t]=this.source[n],this.kind[t]=this.kind[n]),t++;continue}const i=e.units[this.source[n]],r=Mu[this.kind[n]],a=this.x[n],o=this.y[n];let l=1/0,c=1/0;e.hash.visit(a,o,ai,d=>{if(d.id===i.id||d.x<a-ai/2||d.x>=a+ai/2||d.y<o-ai/2||d.y>=o+ai/2)return;const u=(d.x-a)**2+(d.y-o)**2;(u<c||u===c&&d.id<l)&&(c=u,l=d.id)});const h=e.units[l];if(h){const d=h.hp;if(Zd(e,h,xc[r].points,0,0,r!=="musket",e.companies[i.company]),h.hp<d){const u=this.stats[r];u.hits++,h.faction===i.faction&&u.friendly++}}r==="musket"&&e.events.push({type:"tileImpact",kind:i.kind,unitId:i.id,faction:i.faction,x:a,y:o,dx:0,dy:0,explosive:!1,struck:!!h})}this.count=t}}const En=40,qy=1.5;function er(s,e,t,n){const{a:i,b:r}=s.body;if(i===r)return i;const a=t*e.hx+n*e.hy;return i*r/Math.sqrt(i*i+(r*r-i*i)*Math.min(1,a*a))}function Do(s,e){return mt(s)&&!e.limbered?0:1/s.body.mass}class Yy{scenery=new Map;bins=new Map;occupied=[];columns=1;goalX=[];goalY=[];layout;slide=[];lastX=[];lastY=[];reset(e){this.layout=e,this.columns=Math.ceil(e.width/En)+2,this.slide=[],this.bins.clear(),this.occupied=[],this.lastX=[],this.lastY=[],this.scenery.clear();const t=n=>{for(let i=Math.floor((n.y-n.halfY-14)/En);i<=Math.floor((n.y+n.halfY+14)/En);i++)for(let r=Math.floor((n.x-n.halfX-14)/En);r<=Math.floor((n.x+n.halfX+14)/En);r++){const a=i*this.columns+r,o=this.scenery.get(a);o?o.push(n):this.scenery.set(a,[n])}};for(const n of mc(e))t({x:n.x,y:n.y,halfX:6.8*n.size,halfY:6.8*n.size,round:!0});for(const n of e.farms){const i=n.w/9.5,r=e.ridgeOwner===0?-1:1,a=(o,l,c,h)=>t({x:n.x+o*r*i,y:n.y+l*r*i,halfX:c*i/2,halfY:h*i/2,round:!1});a(2.85,.95,2.45,2.6),a(-.1,-2.35,3.05,1.65);for(const o of[-3.4,3.4])a(0,o,9.35,.25);a(4.62,0,.24,6.9);for(const o of[-2.18,2.18])a(-4.62,o,.25,2.55)}}key(e,t){return Math.floor(t/En)*this.columns+Math.floor(e/En)}walls(e,t){const n=this.scenery.get(this.key(e.x,e.y));if(n)for(const i of n){const r=e.x-i.x,a=e.y-i.y;let o=r,l=a,c=0;i.round||(o=r-Math.max(-i.halfX,Math.min(i.halfX,r)),l=a-Math.max(-i.halfY,Math.min(i.halfY,a)),o===0&&l===0&&(i.halfX-Math.abs(r)<i.halfY-Math.abs(a)?(o=Math.sign(r)||1,c=i.halfX-Math.abs(r)):(l=Math.sign(a)||1,c=i.halfY-Math.abs(a))));const h=Math.hypot(o,l);h?(o/=h,l/=h):(o=1,l=0);const d=er(e,t,o,l)+(i.round?i.halfX:0)+(c>0?c:-h);d>0&&(e.x+=o*d,e.y+=l*d)}}fill(e){for(const t of this.occupied)this.bins.get(t).length=0;this.occupied.length=0;for(const t of e.units)if(t.hp>0){const n=this.key(t.x,t.y);let i=this.bins.get(n);i||(i=[],this.bins.set(n,i)),i.length||this.occupied.push(n),i.push(t)}}pairs(e){for(const t of this.occupied){const n=this.bins.get(t);for(let i=0;i<n.length;i++)for(let r=i+1;r<n.length;r++)e(n[i],n[r]);for(const i of[t+1,t+this.columns-1,t+this.columns,t+this.columns+1]){const r=this.bins.get(i);if(r?.length)for(const a of n)for(const o of r)e(a,o)}}}insert(e){const t=this.key(e.x,e.y);let n=this.bins.get(t);n||(n=[],this.bins.set(t,n)),n.length||this.occupied.push(t),n.push(e)}clearance(e,t,n,i){const r=t.body.a,a=t.body.b,o=r+14;let l=1;const c=Math.floor((i+o)/En),h=Math.floor((n+o)/En);for(let d=Math.floor((i-o)/En);d<=c;d++)for(let u=Math.floor((n-o)/En);u<=h;u++){const f=this.bins.get(d*this.columns+u);if(f)for(const p of f){if(p===t)continue;const y=n-p.x,m=i-p.y,g=r+p.body.a,_=y*y+m*m;if(_>=g*g)continue;const v=Math.sqrt(_);if(r===a&&p.body.a===p.body.b){l=Math.min(l,v-g);continue}const M=v?y/v:1,S=v?m/v:0;l=Math.min(l,v-er(t,e.companies[t.company],M,S)-er(p,e.companies[p.company],M,S))}}return l}anchor(e,t){const n=t.x,i=t.y;for(let r=0;r<500;r++){const a=3*Math.sqrt(r),o=r*2.399963;if(t.x=n+Math.cos(o)*a,t.y=i+Math.sin(o)*a,this.walls(t,e.companies[t.company]),this.clearance(e,t,t.x,t.y)>=0)break}this.lastX[t.id]=t.x,this.lastY[t.id]=t.y,this.insert(t)}step(e){for(const i of this.occupied)this.bins.get(i).length=0;this.occupied.length=0;const{goalX:t,goalY:n}=this;for(const i of e.units)if(i.hp>0){if(t[i.id]=i.x,n[i.id]=i.y,this.lastX[i.id]===void 0){this.anchor(e,i);continue}i.x=this.lastX[i.id],i.y=this.lastY[i.id],this.insert(i)}for(let i=0;i<e.units.length;i++){const r=e.units[(i+e.tick)%e.units.length];if(r.hp<=0)continue;const a=r.x,o=r.y,l=this.key(a,o),c=e.companies[r.company],h=t[r.id]-a,d=n[r.id]-o,u=e.tick>e.deployEnd&&r.body===ku.gun&&!c.limbered&&c.status!=="rout";if(u||!h&&!d&&r.body.a===r.body.b){r.moving&&(r.stride-=Math.hypot(h,d)),u&&(r.moving=!1),r.px=a,r.py=o,r.vx=0,r.vy=0;continue}const f=(c.sprintUntil>e.tick?235:Math.max(114,r.speed))*1.05/30,p=Math.min(1,f/(Math.hypot(h,d)||1));r.x=a+h*p,r.y=o+d*p,this.walls(r,c);let y=this.clearance(e,r,r.x,r.y);if(y<0){const g=r.x-a,_=r.y-o,v=this.clearance(e,r,a,o);let M=a,S=o,b=v;for(const[x,E]of[[g,0],[0,_],[g*.5,_*.5]])if(r.x=a+x,r.y=o+E,this.walls(r,c),y=this.clearance(e,r,r.x,r.y),(y>=0||y>b)&&(M=r.x,S=r.y,b=y,y>=0))break;if(r.x=M,r.y=S,Math.hypot(r.x-a,r.y-o)<.12&&Math.hypot(h,d)>1&&Do(r,c)){const x=this.slide[r.id]??(r.id%2?1:-1);for(const E of[x,-x]){if(r.x=a-_*E*.85+g*.15,r.y=o+g*E*.85+_*.15,this.walls(r,c),this.clearance(e,r,r.x,r.y)>=0){this.slide[r.id]=E,b=0;break}r.x=M,r.y=S}}if(b<0&&Do(r,c)){const x=this.clearance(e,r,r.x+.2,r.y)-this.clearance(e,r,r.x-.2,r.y),E=this.clearance(e,r,r.x,r.y+.2)-this.clearance(e,r,r.x,r.y-.2),w=Math.hypot(x,E)||1,R=Math.min(qy,-b*.5)*Do(r,c);r.x+=R*x/w,r.y+=R*E/w,this.walls(r,c)}}if(r.x=Math.max(2,Math.min(this.layout.width-2,r.x)),r.y=Math.max(2,Math.min(this.layout.height-2,r.y)),this.key(r.x,r.y)!==l){const g=this.bins.get(l);g.splice(g.indexOf(r),1),this.insert(r)}const m=Math.hypot(r.x-a,r.y-o);r.moving&&(r.stride+=m-Math.hypot(h,d)),r.px=a,r.py=o,r.vx=(r.x-a)*30,r.vy=(r.y-o)*30,this.lastX[r.id]=r.x,this.lastY[r.id]=r.y}}overlaps(e,t){let n=0;return this.fill(e),this.pairs((i,r)=>{const a=i.x-r.x,o=i.y-r.y,l=Math.hypot(a,o);if(l>=i.body.a+r.body.a)return;const c=l?a/l:1,h=l?o/l:0,d=er(i,e.companies[i.company],c,h),u=er(r,e.companies[r.company],c,h);d+u-l>.3*Math.min(d,u)&&(n++,t?.(i,r))}),n}}const Ci=64;class $y{stride=0;rows=0;buckets=[];occupied=[];rebuild(e){const t=Math.ceil(gt/Ci),n=Math.ceil(Mt/Ci);if(this.stride!==t||this.rows!==n)this.stride=t,this.rows=n,this.buckets=new Array(t*n);else for(const i of this.occupied)this.buckets[i].length=0;this.occupied.length=0;for(const i of e)i.hp>0&&this.insert(i)}insert(e){const t=Math.floor(e.y/Ci)*this.stride+Math.floor(e.x/Ci),n=this.buckets[t]??(this.buckets[t]=[]);n.length||this.occupied.push(t),n.push(e)}visit(e,t,n,i){const r=Math.max(0,Math.floor((e-n)/Ci)),a=Math.min(this.stride-1,Math.floor((e+n)/Ci)),o=Math.max(0,Math.floor((t-n)/Ci)),l=Math.min(this.rows-1,Math.floor((t+n)/Ci));for(let c=o;c<=l;c++)for(let h=r;h<=a;h++){const d=this.buckets[c*this.stride+h];if(d)for(const u of d)u.hp>0&&(u.x-e)**2+(u.y-t)**2<=n*n&&i(u)}}}const bu=["左翼","中央","右翼"],Eu=[0,1,2],ha=s=>_n(s)||ft(s),Uo=s=>s.alive>0&&s.status!=="rout"&&s.status!=="gone";class Ky{nextPhase=[0,0];tasks=new Map;used=new Set;squareUntil=new Map;reset(){this.nextPhase=[0,0],this.tasks.clear(),this.used.clear(),this.squareUntil.clear()}assigned(e,t){return(this.tasks.get(e.id)?.until??-1)>t}wantsSquare(e,t){return(this.squareUntil.get(e.id)??-1)>t}assign(e,t,n,i,r=-1,a){return e.logistics.dispatch(e,t,i,r,a)<0?!1:(this.tasks.set(t.id,{purpose:n,until:e.tick+(n==="point"?2700:900)}),!0)}review(e,t){const n=e.plans[t],i=e.companies.filter(_=>_.faction===t&&_.line!==5),r=e.sight.visibleToArmy(e,t).filter(_=>Uo(_)&&_.line!==5),a=i.filter(_=>Uo(_)&&!e.lostSectors[t][_.sector]&&!e.logistics.isCommitted(_)),o=a.filter(_=>!_.engaged&&!this.assigned(_,e.tick)),l=n.reserve.map(_=>e.companies[_]).filter(_=>_&&o.includes(_)&&!this.used.has(_.id)),c=e.layout.objectives,h=c.filter(_=>_.owner!==t&&n.destinations.some(v=>v.role==="garrison"&&v.objectiveId===_.id)),d=Eu.map(_=>{const v=i.filter(S=>S.sector===_),M=v.reduce((S,b)=>S+b.peak,0);return{sector:_,remaining:M?v.reduce((S,b)=>S+(Uo(b)?b.alive:0),0)/M:1}}).sort((_,v)=>_.remaining-v.remaining)[0],u=h[0]?.sector??(d.remaining<.6?d.sector:null),f=r.filter(_=>_.sector===n.mainEffort),p=f.find(_=>ha(_))??f[0],y=e.tick-e.deployEnd;let m=this.nextPhase[t];for(;m<n.phases.length&&y>=n.phases[m].trigger;){const _=n.phases[m++];if(e.say(e.generals[t].name+"开始"+_.name+"，主攻方向为"+bu[n.mainEffort],t,p?.x??e.layout.width/2,(n.mainEffort+.5)*e.layout.height/3,2),_.orders==="charge"){const v=r.filter(M=>mt(M)||M.status==="shaken");for(const M of o.filter(S=>Ve(S)&&e.tick>=S.blownUntil&&S.order==="hold")){const S=v.filter(b=>b.sector===M.sector&&De(M,b)<1650).sort((b,x)=>De(M,b)-De(M,x))[0];S&&this.assign(e,M,"screen","charge",S.id)}}if(p&&_.orders==="advance")for(const v of o.filter(M=>M.sector===n.mainEffort&&M.line===0&&M.order==="hold"))e.logistics.dispatch(e,v,"advance",p.id)}if(this.nextPhase[t]=m,(u!==null||m>=n.phases.length&&y>7e3)&&l.length){const _=u??n.mainEffort,v=h[0]??c.find(b=>b.sector===_),M=r.filter(b=>b.sector===_).sort((b,x)=>De(b,v??l[0])-De(x,v??l[0]))[0],S=l.sort((b,x)=>De(b,v??p??b)-De(x,v??p??x))[0];this.assign(e,S,"reserve",v&&u!==null?"hold":"advance",v&&u!==null?-1:M?.id??-1,v)&&(this.used.add(S.id),n.reserveAt??=e.tick,e.say(e.generals[t].name+"投入"+S.name+"，增援"+bu[_],t,S.x,S.y,3))}if(p){const _=f.filter(v=>mt(v));for(const v of o.filter(M=>mt(M)&&M.sector===n.mainEffort)){const M=_.length>1?_.reduce((S,b)=>De(v,S)<De(v,b)?S:b):p;v.forced!==M.id&&De(v,M)<2450&&e.logistics.dispatch(e,v,"hold",M.id)}}for(const _ of o.filter(v=>Ve(v)&&v.order==="hold"&&e.tick>=v.blownUntil)){const v=a.filter(S=>ha(S)&&S.sector===_.sector&&(S.order==="advance"||S.order==="assault")).sort((S,b)=>De(_,S)-De(_,b))[0];if(!v||De(_,v)<600||r.some(S=>De(S,_)<450))continue;const M={x:v.x+(t?1:-1)*240,y:v.y+(_.id%2?165:-165)};this.assign(e,_,"screen","hold",-1,M)}for(const _ of Eu){const v=r.filter(b=>Ve(b)&&b.sector===_&&b.order==="charge");if(v.length)for(const b of a.filter(x=>x.line===1&&x.sector===_&&x.id%2===0))v.some(x=>De(x,b)<480)&&this.squareUntil.set(b.id,e.tick+310);const M=c.find(b=>b.sector===_&&b.owner!==t&&(n.role==="attack"||h.includes(b)));if(!M||e.lostSectors[t][_]||!y||a.some(b=>ha(b)&&De(b,M)<135))continue;const S=o.filter(b=>b.sector===_&&ha(b)&&b.line!==6&&(!n.reserve.includes(b.id)||this.used.has(b.id))&&b.status==="steady"&&!this.assigned(b,e.tick)).sort((b,x)=>De(b,M)-De(x,M))[0];S&&De(S,M)<1950&&!r.some(b=>De(b,S)<250)&&this.assign(e,S,"point","hold",-1,M)&&e.say(S.name+"受令前往"+M.name,t,S.x,S.y,1)}if(n.breakthrough===null){const _=c.find(M=>M.owner===t&&a.some(S=>S.captures>0&&De(S,M)<230)),v=e.lostSectors[1-t].findIndex(Boolean);(_||v>=0)&&(n.breakthrough=_?.sector??v)}}}const Zy={aggressive:330,cunning:560,steadfast:650,cautious:900},Jy={aggressive:58,cunning:50,steadfast:44,cautious:36},Qy={aggressive:1,cunning:1.1,steadfast:1.7,cautious:1.9};class jy{plan=new Ky;cannonadeEnd=[0,0];secondWave=[0,0];advanced=[!1,!1];reset(e){this.plan.reset();for(const t of[0,1]){const n=e.generals[t].trait;this.cannonadeEnd[t]=e.posture[t]==="attack"?e.deployEnd+Zy[n]+e.rng.int(0,240):0,this.secondWave[t]=0,this.advanced[t]=!1}}update(e){for(const t of[0,1])!e.broken[t]&&e.legacySide!==t&&((e.tick-e.deployEnd-1)%300===0&&this.plan.review(e,t),this.army(e,t))}army(e,t){const n=e.generals[t],i=n.trait,r=e.posture[t]==="attack",a=t?-1:1,o=e.companies.filter(f=>f.faction===t&&f.alive>0&&f.status!=="gone"&&!e.logistics.isCommitted(f)&&!e.lostSectors[t][f.sector]),l=e.sight.visibleToArmy(e,t),c=e.plans[t],h=f=>!this.plan.assigned(f,e.tick)&&!c.reserve.includes(f.id),d=n.alive?n.title+n.name:"代理指挥官";if(r&&!this.advanced[t]&&e.tick>=this.cannonadeEnd[t]){this.advanced[t]=!0,this.secondWave[t]=e.tick+330;let f=0,p=0,y=0;for(const m of o)m.line===0&&h(m)&&(e.logistics.dispatch(e,m,"advance"),f+=m.x,p+=m.y,y++);e.say(`${d}下令：全线推进！`,t,y?f/y:gt/2,y?p/y:1600,2)}if(this.secondWave[t]&&e.tick>=this.secondWave[t]){this.secondWave[t]=0;for(const f of o)f.line===1&&f.order==="hold"&&h(f)&&e.logistics.dispatch(e,f,"advance")}if(r&&this.advanced[t]&&!this.secondWave[t]&&e.tick%150===1)for(const f of o)h(f)&&(f.line<=1||f.line===7)&&f.order==="hold"&&f.status==="steady"&&f.morale>50&&!Ve(f)&&e.logistics.dispatch(e,f,"advance");if(!r&&e.tick>3600&&e.tick%90===1&&(l.length>0&&l.every(p=>p.status==="rout"||p.morale<38)||e.tick>16500)){e.posture[t]="attack",this.advanced[t]=!0;for(const p of o)h(p)&&p.line!==6&&p.line!==5&&p.line!==4&&!Ve(p)&&p.status!=="rout"&&e.logistics.dispatch(e,p,"advance");e.say(t?`${d}挥舞帽子：全线前进！`:`${d}下令：全线反击！`,t,e.frontline().x,e.frontline().y,3)}for(const f of o){if(f.status!=="steady"||!_n(f)&&!ft(f)||f.line===6||!h(f)&&f.order!=="advance"&&(f.order==="reserve"||!l.includes(e.companies[f.target])||De(f,e.companies[f.target])>260)||e.noAssault[t]||e.tick<f.assaultReady||f.engaged||f.formation==="square"||f.order!=="advance"&&f.order!=="hold")continue;const p=e.companies[f.target],y=I=>I.faction!==t&&I.alive>0&&I.line!==5&&!Ve(I)&&I.status!=="rout"&&I.status!=="gone",m=e.weather==="fog"?1300:2250,g=p&&l.includes(p)&&y(p)?p:l.filter(I=>y(I)&&De(I,f)<m).sort((I,N)=>De(I,f)-De(N,f))[0];if(!g)continue;let _=Jy[i]-(r?0:10)+(ft(f)&&c.reserveAt!==null?22:0);pi(ze.farm,g.x,g.y,20)&&(_-=14);const v=De(f,g),M=o.some(I=>I!==f&&I.line!==5&&I.status==="steady"&&De(I,f)<480),S=g.alive===g.peak&&g.morale>60&&f.morale>50,b=f.firingSince>=0&&e.tick-f.firingSince>1200,x=e.tick-g.firstVolleyAt<80&&v<150,E=f.ammo<8*f.alive;if(b&&!M&&f.losses>Math.max(1,f.kills)*1.3&&e.logistics.requestRelief(e,f))continue;const w=!l.some(I=>I!==g&&I.faction===g.faction&&I.line!==5&&I.alive>3&&I.status==="steady"&&De(I,g)<250),R=f.order==="advance"&&(f.sector===c.mainEffort||w)&&(M||f.morale>65);(v<m&&(S||R)&&(f.id%3!==2||r)||v<pr+40&&(g.morale<_||g.alive<f.alive*.45||x||E||b&&(M||f.kills>=1.2*Math.max(1,f.losses))))&&(f.order="assault",f.forced=g.id,f.freshAtStart=S,f.charges++,(ft(f)||e.rng.next()<.22)&&e.say(`${f.name}上刺刀，冲锋！`,t,f.x,f.y,ft(f)?2:1))}if(e.tick>(r?this.cannonadeEnd[t]+150:800))for(const f of o){if(!Ve(f)||f.line===5||f.status!=="steady"||f.order!=="hold"||f.morale<52||e.tick<f.blownUntil||e.rng.next()>.4)continue;let p,y=0;for(const m of l){if(m.faction===t||m.status==="gone"||m.status==="rout"||m.alive<4&&m.line!==5)continue;const g=De(f,m);if(g>1600||Os(m.x,m.y,30)||pi(ze.farm,m.x,m.y,40)||m.formation==="square"&&m.formUntil<=e.tick)continue;let _=m.status==="shaken"?2:m.formUntil>e.tick&&m.formation!=="square"&&e.tick-m.leftSquare>300?2.4:0;if(mt(m)&&!l.some(v=>v.faction===m.faction&&!mt(v)&&v.line!==5&&v.status!=="rout"&&v.status!=="gone"&&De(v,m)<260)&&(_=Math.max(_,i==="cunning"?2.6:2)),m.line===5){if(o.length&&l.some(M=>M.faction===m.faction&&M.line!==5&&M.status==="steady"&&M.alive>=6&&De(M,m)<580)||g>1150||!e.generals[m.faction].alive)continue;_=2.8}_n(m)&&m.formation==="line"&&e.tick-m.reloadAt>-40&&e.tick<m.reloadAt&&(_=Math.max(_,1.15)),Ve(m)&&m.order==="charge"&&g<700&&(_=Math.max(_,1.8)),_*=1-g/2200,_>y&&(y=_,p=m)}p&&y>=Qy[i]*(1-Math.min(.35,e.tick/3e4))&&(f.charges++,f.order="charge",f.forced=p.id,e.say(`${f.name}拔出马刀，向${p.name}发起冲锋！`,t,f.x,f.y,2))}const u=e.companies[n.company];if(u&&u.status!=="gone"&&u.status!=="rout"){let f=0,p=0,y=0;for(const m of o)(m.line===0||m.line===1)&&m.status!=="rout"&&(f+=m.x,p+=m.y,y++);y&&(u.homeX=Math.min(gt-80,Math.max(80,f/y-a*1080)),u.homeY=p/y)}}}const eM={aggressive:330,cunning:560,steadfast:650,cautious:900},tM={aggressive:58,cunning:50,steadfast:44,cautious:36},nM={aggressive:1,cunning:1.1,steadfast:1.7,cautious:1.9};class iM{cannonadeEnd=[0,0];secondWave=[0,0];guardAt=[0,0];advanced=[!1,!1];committed=[!1,!1];reset(e){for(const t of[0,1]){const n=e.generals[t].trait;this.cannonadeEnd[t]=e.posture[t]==="attack"?eM[n]+e.rng.int(0,240):0,this.secondWave[t]=0,this.guardAt[t]=3400+e.rng.int(0,2200)-(n==="aggressive"?800:n==="cautious"?-500:0),this.advanced[t]=this.committed[t]=!1}}update(e){for(const t of[0,1])e.broken[t]||this.army(e,t)}army(e,t){const n=e.generals[t],i=n.trait,r=e.posture[t]==="attack",a=t?-1:1,o=e.companies.filter(h=>h.faction===t&&h.status!=="gone"),l=n.alive?n.title+n.name:"代理指挥官";if(r&&!this.advanced[t]&&e.tick>=this.cannonadeEnd[t]){this.advanced[t]=!0,this.secondWave[t]=e.tick+330;let h=0,d=0,u=0;for(const f of o)f.line===0&&(f.order="advance",h+=f.x,d+=f.y,u++);e.say(`${l}下令：全线推进！`,t,u?h/u:gt/2,u?d/u:1600,2)}if(this.secondWave[t]&&e.tick>=this.secondWave[t]){this.secondWave[t]=0;for(const h of o)h.line===1&&h.order==="hold"&&(h.order="advance")}if(r&&this.advanced[t]&&!this.secondWave[t]&&e.tick%150===1)for(const h of o)(h.line<=1||h.line===7)&&h.order==="hold"&&h.status==="steady"&&h.morale>50&&!Ve(h)&&(h.order="advance");if(!r&&e.tick>3600&&e.tick%90===1){const h=1-t;if(e.armyMorale(h)<38||e.effective(t)>e.effective(h)*1.35||e.tick>7800){e.posture[t]="attack",this.advanced[t]=!0;for(const d of o)d.line!==6&&d.line!==5&&d.line!==4&&!Ve(d)&&d.status!=="rout"&&(d.order="advance");e.say(t?`${l}挥舞帽子：全线前进！`:`${l}下令：全线反击！`,t,e.frontline().x,e.frontline().y,3)}}for(const h of o){if(h.status!=="steady"||!_n(h)&&!ft(h)||h.line===6||h.order!=="advance"&&h.order!=="hold")continue;const d=e.companies[h.target];if(!d||d.status==="gone"||Ve(d)||d.status==="rout")continue;let u=tM[i]-(r?0:10)+(ft(h)&&this.committed[t]?22:0);pi(ze.farm,d.x,d.y,20)&&(u-=14),De(h,d)<pr+40&&(d.morale<u||d.alive<h.alive*.45)&&(h.order="assault",h.forced=d.id,(ft(h)||e.rng.next()<.22)&&e.say(`${h.name}上刺刀，冲锋！`,t,h.x,h.y,ft(h)?2:1))}if(e.tick>(r?this.cannonadeEnd[t]+150:800))for(const h of o){if(!Ve(h)||h.line===5||h.status!=="steady"||h.order!=="hold"||h.morale<52||e.rng.next()>.4)continue;let d,u=0;for(const f of e.companies){if(f.faction===t||f.status==="gone"||f.alive<4||f.line===5)continue;const p=De(h,f);if(p>1600||Os(f.x,f.y,30)||pi(ze.farm,f.x,f.y,40)||f.formation==="square"&&f.formUntil<=e.tick)continue;let y=f.status==="rout"?2.4:f.status==="shaken"?2:f.formUntil>e.tick?2.4:0;mt(f)&&!e.companies.some(m=>m.faction===f.faction&&!mt(m)&&m.line!==5&&m.status!=="rout"&&m.status!=="gone"&&De(m,f)<260)&&(y=Math.max(y,i==="cunning"?2.6:2)),_n(f)&&f.formation==="line"&&e.tick-f.reloadAt>-40&&e.tick<f.reloadAt&&(y=Math.max(y,1.15)),Ve(f)&&f.order==="charge"&&p<700&&(y=Math.max(y,1.8)),y*=1-p/2200,y>u&&(u=y,d=f)}d&&u>=nM[i]*(1-Math.min(.35,e.tick/3e4))&&(h.charges++,h.order="charge",h.forced=d.id,e.say(`${h.name}拔出马刀，向${d.name}发起冲锋！`,t,h.x,h.y,2))}if(!this.committed[t]){const h=e.armyMorale(1-t),d=e.effective(t)/Math.max(1,e.effective(1-t));if(e.tick>this.guardAt[t]||h<46&&e.tick>1500||d<.72&&e.tick>1700){this.committed[t]=!0;let u=0,f=0,p=0;for(const y of o)y.line===2&&y.status!=="rout"&&(y.order="advance",y.base+=6,y.morale+=6,u+=y.x,f+=y.y,p++);p&&e.say(t?"“近卫军，起立！”英军最后的预备队从麦田里站了起来":`${l}押上了最后的赌注：老近卫军出击！`,t,u/p,f/p,3)}}const c=e.companies[n.company];if(c&&c.status!=="gone"&&c.status!=="rout"){let h=0,d=0,u=0;for(const f of o)(f.line===0||f.line===1)&&f.status!=="rout"&&(h+=f.x,d+=f.y,u++);u&&(c.homeX=Math.min(gt-80,Math.max(80,h/u-a*1080)),c.homeY=d/u)}}}const Sa={voltigeur:{base:"line_infantry",name:["轻步兵连","轻步兵连"],pace:1.025,formationTime:.8},rifles:{base:"line_infantry",name:["来复枪连","第95来复枪连"],pace:1,restRecovery:1.2},lancer:{base:"cuirassier",name:["波兰枪骑兵连","枪骑兵连"],pace:1,restRecovery:.85},hussar:{base:"cuirassier",name:["骠骑兵连","轻骑兵连"],pace:1.06,travelFatigue:.8},horse_battery:{base:"field_cannon",name:["骑炮兵连","皇家骑炮兵连"],pace:1.08,setupTicks:60},howitzer:{base:"field_cannon",name:["榴弹炮连","榴弹炮连"],pace:.95}};function Va(s){return s.variant?Sa[s.variant]:void 0}function sM(s,e,t){const n=Xt[s.kind].formation,i=e==="square"?n.squareTicks:n.changeTicks;return Math.round(i*(Va(s)?.formationTime??1)*(t?1.5:1))}function Tu(s){return Va(s)?.setupTicks??Ft.limberTicks}function rM(s){return Va(s)?.travelFatigue??1}function Au(s){return Va(s)?.restRecovery??1}function aM(s,e,t,n){switch(Xt[s].group){case"line":return n===2?"voltigeur":n===5&&e===1?"rifles":null;case"mounted":return t===5?null:n===1?"hussar":n===2&&e===0?"lancer":null;case"artillery":return n===1?"horse_battery":n===2?"howitzer":null;default:return null}}const oM={line:[13,15],column:[13,14],square:[13,13],battery:[62,0],wedge:[25,32],staff:[22,18]};function Qd(s,e){switch(s.formation){case"line":return Math.max(1,Math.ceil(e/s.ranks));case"column":return Math.min(e,9);case"wedge":return Math.max(1,Math.ceil(e/2));case"battery":return e;default:return Math.max(1,Math.ceil(e/2))}}function Wa(s,e){const[t,n]=oM[s.formation];if(s.formation==="square"){if(s.capacity<4)return[(e-(s.capacity-1)/2)*t,0];const o=Math.ceil(s.capacity/4),l=o*t/2,c=Math.floor(e/o)%4,h=e%o,d=h*t-l;return c===0?[d,-l]:c===1?[l,d]:c===2?[-d,l]:[-l,-d]}const i=Math.max(1,s.files),r=Math.floor(e/i);return[(e%i-(i-1)/2)*t,r*n]}function jd(s,e){ze.farm;const t=7,n=Math.max(1,Math.ceil(s.capacity/t)),i=ze.ridgeOwner===0||ze.ridgeOwner===-1&&s.homeX<gt/2?-1:1;return[s.x+((Math.floor(e/t)-(n-1)/2)*9-10)*i,s.y+((e%t-3)*9+8)*i]}function Cr(s){s.files=Qd(s,s.members.length),s.capacity=s.members.length,s.members.forEach((e,t)=>{e.slot=t;const[n,i]=Wa(s,t);e.x=Math.min(gt-3,Math.max(3,s.x-n*s.hy-i*s.hx+e.jx)),e.y=Math.min(Mt-3,Math.max(3,s.y+n*s.hx-i*s.hy+e.jy)),s.line===6&&ze.farm&&([e.x,e.y]=jd(s,t)),e.px=e.x,e.py=e.y})}function _c(s,e,t,n,i){const r=t-e.x,a=n-e.y,o=Math.hypot(r,a);let l=i;Os(e.x,e.y)&&(l*=Ve(e)?.45:.75),s.weather==="rain"&&(l*=.88);const c=Math.min(o,l/30);return o<(e.moving?1:3)?(e.vx=e.vy=0,e.moving=!1,!1):(e.vx=r/o*c*30,e.vy=a/o*c*30,e.x=Math.min(gt-2,Math.max(2,e.x+e.vx/30)),e.y=Math.min(Mt-2,Math.max(2,e.y+e.vy/30)),e.moving=!0,e.stride+=c,!0)}function vc(s,e){const t=Math.sign(e);if(t===s.face||t===0){s.turnFrames=0;return}++s.turnFrames>=10&&(s.face=t,s.turnFrames=0)}function lM(s,e,t){const n=e.faction?1:-1,i=_c(s,e,e.x+n*200,e.y+e.jy*3+Math.sin((s.tick+e.id*37)*.02)*60,Ve(e)?Ft.horseTrot:Ft.footFlee);e.pose="run",vc(e,n),i&&(e.x<=4||e.x>=gt-4)&&(t.ammo-=e.ammo,e.escaped=!0,e.hp=0,e.moving=!1,s.alive[e.faction]--,s.fled[e.faction]++,t.alive--)}function cM(s,e,t){if(mt(e)||t.order==="rally")return!1;const n=t.formation==="square"&&t.formUntil<=s.tick,i=t.contactId>=0&&s.tick-t.contactAt<=45;let r=e.foe>=0?s.units[e.foe]:void 0;if((s.tick+e.id)%6===0||!r||r.hp<=0){let l=1/0,c;s.hash.visit(e.x,e.y,n||!t.engaged?16:80,h=>{if((i||t.engaged)&&h.company!==t.contactId&&h.foe!==e.id||h.faction===e.faction||!n&&!i&&!t.engaged&&h.foe!==e.id)return;const d=(h.x-e.x)**2+(h.y-e.y)**2;d<l&&(l=d,c=h)}),r=c,e.foe=r?r.id:-1}if(!r)return!1;const a=Ve(e)?22:16,o=Math.hypot(r.x-e.x,r.y-e.y);if(n&&o>16||!n&&!i&&!t.engaged&&(o>16||r.foe!==e.id))return e.foe=-1,!1;if(vc(e,r.x-e.x),o<=a){if(e.moving=!1,e.vx=e.vy=0,e.pose="thrust",s.companies[r.company].status!=="rout"&&s.tick-e.firedAt<30&&s.tick-r.firedAt<30&&r.pose==="thrust"&&r.foe===e.id&&De(t,s.companies[r.company])<=120){t.lastMelee=s.tick,t.contactId=r.company;const l=s.companies[r.company];l.lastMelee=s.tick,l.contactId=t.id}return e.cooldown||Vy(s,e,r),!0}return!i&&!t.engaged&&o>30||n?(e.foe=-1,!1):(_c(s,e,r.x-(r.x-e.x)/o*a*.8,r.y-(r.y-e.y)/o*a*.8,e.speed*1.15),e.pose="run",!0)}function hM(s,e){const t=s.companies[e.company];if(e.cooldown>0&&e.cooldown--,e.fireAt===s.tick&&Jd(s,e,t),t.status==="rout"){lM(s,e,t);return}if((t.engaged||e.foe>=0||(s.tick+e.id)%6===0)&&cM(s,e,t))return;const[n,i]=Wa(t,e.slot);let r=t.x-n*t.hy-i*t.hx+e.jx,a=t.y+n*t.hx-i*t.hy+e.jy;t.line===6&&ze.farm&&([r,a]=jd(t,e.slot));const o=t.order==="charge"||t.order==="assault"&&t.target>=0&&s.sight.canSee(s,t,s.companies[t.target])&&De(t,s.companies[t.target])<320,l=t.sprintUntil>s.tick?Ft.horseSprint:t.assaultStage==="rush"?Ft.footRush:e.speed,c=_c(s,e,r,a,l*(1-Ft.maxFatiguePenalty*t.fatigue));if(vc(e,t.hx),c){e.marchUntil=s.tick+12,e.pose=Ve(e)||o?"run":"march";return}if(e.pose==="march"&&s.tick<e.marchUntil&&s.tick-e.firedAt>70&&e.fireAt<s.tick)return;const h=s.tick-e.firedAt;if(e.ammo>=0&&(_n(e)||ft(e))&&(e.loadedAt>s.tick+3||e.kneelUntil>s.tick)){e.pose=e.loadedAt>s.tick?"kneelLoad":"kneel";return}mt(e)?e.pose=h<14?"recoil":e.cooldown>30?"load":"aim":e.fireAt>s.tick&&e.fireAt-s.tick<26?e.pose="aim":h<70&&!Ve(e)&&!Ts(e)?e.pose=h<6?"aim":"load":e.pose="stand"}function wu(s,e,t){let n,i=1/0;for(const r of s.companies){if(r.faction===e.faction||r.status==="gone"||r.alive<=0||r.line===5||!s.sight.canSee(s,e,r)||t)continue;const a=De(e,r);a<i&&(i=a,n=r)}return{c:n,d:i}}function Ru(s,e){const t=o=>{if(!s.sight.canSee(s,e,o))return!1;if(mt(e)){const l=o.x-e.x,c=o.y-e.y,h=l*l+c*c||1;for(const d of ze.woods){const u=Math.max(0,Math.min(1,((d.x-e.x)*l+(d.y-e.y)*c)/h));if((e.x+u*l-d.x)**2+(e.y+u*c-d.y)**2<d.r*d.r)return!1}}else if(!Ve(e)&&De(e,o)>260&&Hd(o.x,o.y,o.faction))return!1;return!0},n=s.companies[e.forced];if(n&&n.status!=="gone"&&n.alive>0&&(n.line!==5||Ve(e)&&e.order==="charge")&&t(n))return n;e.forced=-1;const i=mt(e)?Ll(s):s.weather==="fog"?1e3:2600;let r,a=1/0;for(const o of s.companies){if(o.faction===e.faction||o.status==="gone"||o.alive<=0||o.line===5)continue;const l=De(e,o);if(l>i||!t(o))continue;let c=l+Math.abs(o.homeY-e.homeY)*.48+Math.abs(o.y-e.y)*(mt(e)?.2:.9);Ve(e)?(c*=o.status==="rout"?.45:o.formation==="square"?3:mt(o)?.55:o.status==="shaken"?.6:o.formUntil>s.tick&&s.tick-o.leftSquare>300?.5:1,(Os(o.x,o.y)||pi(ze.farm,o.x,o.y,30))&&(c*=5)):mt(e)?(c*=o.formation==="square"||o.formation==="column"?.6:mt(o)?.85:1,o.status==="rout"&&(c*=2.5)):o.status==="rout"&&(c*=1.8),c<a&&(a=c,r=o)}return r}function ua(s,e,t){if(e.formation===t||!Xt[e.kind].formation.allowed.includes(t)||t==="square"&&s.tick-e.leftSquare<120)return;e.capacity=e.members.length,e.margin=0,e.lastShrink=s.tick;const n=e.formation==="square"||t==="square";if(e.formation==="square"&&(e.leftSquare=s.tick),t==="square"&&(e.formedSquareAt=s.tick),e.formation=t,e.formUntil=s.tick+sM(e,t,e.status==="shaken"),e.files=Qd(e,e.members.length),!n){e.members.forEach((r,a)=>r.slot=a);return}const i=e.members.map((r,a)=>{const[o,l]=Wa(e,a);return{i:a,x:e.x-o*e.hy-l*e.hx,y:e.y+o*e.hx-l*e.hy}});for(const r of e.members){let a=0,o=1/0;for(let l=0;l<i.length;l++){const c=i[l],h=(c.x-r.x)**2+(c.y-r.y)**2;h<o&&(o=h,a=l)}r.slot=i[a].i,i.splice(a,1)}}function uM(s,e){const t=e.members.length!==e.alive;if(t&&(e.members=e.members.filter(d=>d.hp>0)),!e.alive||e.status==="rout")return;const n=e.files,i=Math.ceil(e.capacity/n),r=e.formation!=="square"&&n-2*e.margin>2&&s.tick-e.lastShrink>=90&&(e.alive<=(n-2*e.margin)*i*.7||t&&i>1&&!e.members.some(d=>d.slot>=n*(i-1)));if(!t&&!r)return;const a=new Map(e.members.map(d=>[d.slot,d]));function o(d,u){a.delete(d.slot),d.slot=u,a.set(u,d),s.slotMoves++}if(e.formation==="square"){const d=Math.ceil(e.capacity/4);for(let u=0;u<d;u++){if(a.has(u))continue;const f=a.get(3*d-u);f&&o(f,u)}return}if(t)for(const d of e.members.slice().sort((u,f)=>u.slot-f.slot))d.slot>=n&&!a.has(d.slot-n)&&o(d,d.slot-n);if(!r)return;const l=e.margin,c=[];for(let d=0;d<i;d++)for(let u=l+1;u<n-l-1;u++){const f=d*n+u;a.has(f)||c.push(f)}const h=e.members.filter(d=>d.slot%n===l||d.slot%n===n-l-1);if(!(c.length<h.length)){for(const d of h)c.sort((u,f)=>Math.abs(f-d.slot)-Math.abs(u-d.slot)),o(d,c.pop());e.margin++,e.lastShrink=s.tick}}function Cu(s,e,t=!1){if(!(e.status==="rout"||e.status==="gone")){e.contactId=-1,e.lastMelee=-9999,e.routs++,e.status="rout",e.engaged=!1,e.order="rally",e.forced=-1;for(const n of e.members)n.foe=-1,n.fireAt=-1;if(!s.broken[e.faction]&&e.line!==5){s.recentRouts=s.recentRouts.filter(i=>i.tick>=s.tick-300&&i.c!==e),s.recentRouts.push({tick:s.tick,c:e,x:e.x,y:e.y});const n=s.recentRouts.filter(i=>i.c.faction===e.faction&&Math.hypot(i.x-e.x,i.y-e.y)<=500);if(n.length>=3){const i=n.reduce((a,o)=>a+o.x,0)/n.length,r=n.reduce((a,o)=>a+o.y,0)/n.length;s.say((e.faction?"联军":"法军")+(r<Mt/3?"左翼":r>Mt*2/3?"右翼":"中央")+"全面崩溃！",e.faction,i,r,3),s.recentRouts=s.recentRouts.filter(a=>!n.includes(a))}}if(!t){if(ft(e)){s.say(e.faction?"近卫军退却了！整条战线为之一震":"“近卫军退却了！”（La Garde recule!）恐慌在法军中蔓延",e.faction,e.x,e.y,3);for(const n of s.companies)n.faction===e.faction&&gi(n,10)}else e.peak>=8&&s.rng.next()<(Ve(e)?.5:.7)&&s.say(`${e.name}${Ve(e)?"掉转马头逃离战场":"丢下火枪，四散溃逃！"}`,e.faction,e.x,e.y,1);for(const n of s.companies)n!==e&&n.faction===e.faction&&n.status!=="gone"&&De(n,e)<380&&gi(n,5)}}}function dM(s,e){if(e.status==="gone")return;if(e.smoke=Math.max(0,e.smoke-(s.weather==="fog"?.012:.024)),e.vx=e.vy=0,uM(s,e),e.alive<=0){e.status="gone",e.engaged=!1;return}if(e.status==="rout"){let U=0,P=0;for(const H of e.members)U+=H.x,P+=H.y;e.x=U/e.members.length,e.y=P/e.members.length}e.formation==="column"&&e.formUntil<=s.tick&&e.engaged&&(e.morale=Math.max(0,e.morale-.02));const t=Os(e.x,e.y);t&&!e.wooded&&s.tick>30&&s.say(e.name+"退入树林",e.faction,e.x,e.y,1),e.wooded=t,e.engaged=s.tick-e.lastMelee<30;const n=s.generals[e.faction],i=wu(s,e);let a=s.tick>e.underFire&&!e.engaged?.55:.08;n.alive&&n.unit&&De(n.unit,e)<750&&(a+=.35),e.colors>0&&(a+=.12),n.trait==="cautious"&&(a*=1.3),e.status==="rout"&&(a=i.d>600?.9:0),e.morale=Math.min(e.base,e.morale+a);const o=(ft(e)?12:18)-(n.trait==="steadfast"&&!Ve(e)?5:0);if(e.status==="rout"){if(s.broken[e.faction])return;if(e.morale>42&&i.d>650&&e.alive>=Math.max(3,e.peak*.25)&&e.rallied<2){e.status="shaken",e.rallied++,e.rallies++,e.order=Ve(e)?"rally":"hold";let U=0,P=0;for(const H of e.members)U+=H.x,P+=H.y;e.x=e.homeX=U/e.members.length,e.y=e.homeY=P/e.members.length,e.hx=e.faction?-1:1,e.hy=0,Ve(e)&&(e.blownUntil=s.tick+450),e.formation!=="square"&&ua(s,e,Ve(e)?"wedge":"line"),e.peak>=10&&s.say(`${e.name}在${n.alive?n.title+n.name+"的":"军官的"}喝令下重整旗鼓`,e.faction,e.x,e.y,1)}return}if(e.morale<o){Cu(s,e);return}if(e.status=e.morale<40?"shaken":"steady",e.line===5)return pM(s,e,i.d);const l=Ru(s,e);e.target=l?l.id:-1;const c=l?De(e,l):1/0;if(_n(e)||ft(e)){const U=pi(ze.farm,e.x,e.y,20)||Os(e.x,e.y);let P=!1;for(const H of s.companies){if(H.faction===e.faction||!Ve(H)||H.line===5||H.alive<4||H.status==="rout"||H.status==="gone"||!s.sight.canSee(s,e,H))continue;const B=De(e,H),q=e.cavalryDistances.get(H.id)??B;e.cavalryDistances.set(H.id,B),Math.hypot(H.vx,H.vy)>3&&(B<250||B<450&&q-B>8&&s.tick-e.leftSquare>=60)&&(e.lastHorse=s.tick,P=!0)}(P||s.director.plan.wantsSquare(e,s.tick)&&s.tick-e.leftSquare>=60)&&!U?ua(s,e,"square"):e.formation==="square"&&s.tick-e.lastHorse>=240&&s.tick-e.formedSquareAt>=900?ua(s,e,"line"):e.formation!=="square"&&ua(s,e,!U&&(e.order==="advance"&&c>600||e.order==="assault"&&(e.formation==="column"||c>350&&e.id%3===0))?"column":"line")}if(e.order==="assault"&&s.noAssault[e.faction]&&(e.order="hold",e.assaultStage="idle"),e.order==="assault"&&l&&!Ve(e)&&e.formation!=="square"){if(e.assaultStage==="idle"&&(e.assaultStage="approach",e.freshAtStart=l.alive===l.peak&&l.morale>60),e.assaultStage==="approach"&&c<=150){e.assaultStage="signal",e.assaultUntil=s.tick+24;const U=e.members.find(P=>P.hp>0&&!P.escaped);U&&mi(s,"drum",U,0,0,!1,e.x,e.y),s.say(e.name+"响起冲锋鼓",e.faction,e.x,e.y,1)}e.assaultStage==="signal"&&s.tick===e.assaultUntil-12&&s.tick>=e.reloadAt&&No(s,e,l),e.assaultStage==="signal"&&s.tick>=e.assaultUntil&&(e.assaultStage="rush")}else e.assaultStage="idle";if(mt(e))if(e.order="hold",e.relocated)e.limbered&&Math.hypot(e.x-e.homeX,e.y-e.homeY)<2&&(e.limbered=!1,e.deployUntil=s.tick+Tu(e));else{let U=0,P=0;for(const q of s.companies)q.faction===e.faction&&q.line===0&&q.alive&&q.status!=="rout"&&(U+=q.x,P++);const H=U/P,B=e.faction?-1:1;P&&(H-e.initialFront)*B>600&&(e.homeX=H-B*170,e.limbered=!0,e.relocated=!0,e.deployUntil=s.tick+Tu(e))}let h=e.homeX,d=e.homeY;const u=(Ve(e)?75:55)+(l?.formation==="square"?40:0),f=mt(e)?Ll(s)*.8:pr*.78;if(e.order==="rally"&&Ve(e)&&(e.blownUntil=Math.max(e.blownUntil,e.contactAt+450)),l&&e.order==="advance")if(c>f){const U=(c-f)/c;h=e.x+(l.x-e.x)*U,d=e.y+(l.y-e.y)*U}else h=e.x,d=e.y;else if(l&&(e.order==="assault"||e.order==="charge")){const U=e.order==="assault"?e.assaultStage==="approach"?130:e.assaultStage==="signal"?c:24:u-2;h=l.x-(l.x-e.x)/Math.max(1,c)*U,d=l.y-(l.y-e.y)/Math.max(1,c)*U,e.order==="charge"&&e.chargeOpponent===l.id&&l.formation==="square"&&s.tick-e.chargeAt<90&&(h-=(l.y-e.y)/Math.max(1,c)*15,d+=(l.x-e.x)/Math.max(1,c)*15)}else if(!l&&(e.order==="advance"||e.order==="assault"||e.order==="charge")){const U=wu(s,e).c;h=e.x+(U?Math.sign(U.x-e.x):e.faction?-1:1)*160,d=U?e.y+Math.sign(U.y-e.y)*40:e.y}else e.order==="rally"&&De(e,{x:e.homeX,y:e.homeY})<40&&e.morale>55&&(e.order="hold");if(e.order!=="charge"&&e.assaultStage!=="rush"&&Math.hypot(h-e.x,d-e.y)>80){const U=Math.hypot(h-e.x,d-e.y),P=(h-e.x)/U,H=(d-e.y)/U;for(const B of s.companies){if(B===e||B.faction!==e.faction||!B.alive||B.status==="rout")continue;const q=B.x-e.x,Z=B.y-e.y,ae=q*P+Z*H,Se=q*H-Z*P,$=Math.min(110,(e.files+B.files)*4+16);if(ae<4||ae>120||Math.abs(Se)>=$)continue;const ie=($-Math.abs(Se))*(Se>0?1:Se<0?-1:e.id<B.id?1:-1);h=e.x+P*35-H*ie,d=e.y+H*35+P*ie;break}}e.gx=h,e.gy=d;let p=0,y=0,m=0;for(const U of e.members)y+=U.x,m+=U.y;y/=e.members.length,m/=e.members.length;let g=0,_=0;for(const U of e.members){const[P,H]=Wa(e,U.slot);g-=P*e.hy+H*e.hx,_+=P*e.hx-H*e.hy}p=Math.hypot(y-e.x-g/e.members.length,m-e.y-_/e.members.length),Ve(e)&&e.order==="charge"&&c<250&&e.fatigue<.7&&s.tick>=e.sprintReady&&(e.sprintUntil=s.tick+Ft.sprintTicks,e.sprintReady=e.sprintUntil+450,e.fatigue=Math.min(1,e.fatigue+.12)),e.order!=="charge"&&(e.sprintUntil=0);let M=e.sprintUntil>s.tick?Ft.horseSprint:e.assaultStage==="rush"?Ft.footRush:e.speed;e.formation==="square"&&(M*=.55),M*=kv(e.x,e.y)*(1-Ft.maxFatiguePenalty*e.fatigue),e.limbered&&s.tick<e.deployUntil&&(M=0),e.formUntil>s.tick&&e.formation!=="column"&&(M*=.3);const S=Math.hypot(h-e.x,d-e.y);if(S>1&&p<95){const U=Math.min(S,M*Math.min(1,(95-p)/28)*6/30);e.vx=(h-e.x)/S*U*5,e.vy=(d-e.y)/S*U*5}const b=e.faction?-1:1;let x=l?l.x-e.x:b,E=l?l.y-e.y:0;(e.order==="rally"||e.order==="reserve"||e.order==="hold"&&(!l||c>1200))&&(x=b,E=0);const w=Math.hypot(x,E)||1;x/=w,E/=w;const R=Math.atan2(e.hy,e.hx);let N=Math.atan2(E,x)-R;for(;N>Math.PI;)N-=2*Math.PI;for(;N<-Math.PI;)N+=2*Math.PI;const O=R+Math.max(-.1,Math.min(.1,N));if(e.hx=Math.cos(O),e.hy=Math.sin(O),e.order!=="charge"&&e.order!=="assault"&&(e.chargeOpponent=-1),!l)return;e.assaultStage==="rush"&&c<=62&&(e.assaultStage="melee",e.contactId=l.id,e.contactAt=s.tick,l.contactId=e.id,l.contactAt=s.tick,s.charges.push({tick:s.tick,company:e.id,target:l.id,fresh:e.freshAtStart,outcome:"melee"})),e.assaultStage==="melee"&&(l.status==="rout"||l.status==="gone"||c>150)&&(e.assaultStage="idle",e.assaultReady=s.tick+720,e.homeX=e.x,e.homeY=e.y,e.order="hold",e.forced=-1),(e.order==="assault"||e.order==="charge")&&c<u&&l.status!=="rout"&&e.chargeOpponent!==l.id&&(e.chargeOpponent=l.id,e.contactId=l.id,e.contactAt=s.tick,l.contactId=e.id,l.contactAt=s.tick,e.chargeAt=s.tick,mt(l)&&l.morale<18&&l.status!=="gone"&&l.alive>0&&(e.captures++,Cu(s,l,!0),s.say(e.name+"夺取了敌军炮位",e.faction,l.x,l.y,2)));const L=s.companies[e.chargeOpponent>=0?e.chargeOpponent:e.contactId],k=L&&s.sight.canSee(s,e,L)?L:void 0;if(e.engaged&&k&&(s.tick-e.chargeAt)%18<6&&fM(s,e,k),Ve(e)&&e.order==="charge"&&e.chargeOpponent>=0&&(s.tick-e.chargeAt>200||k?.status==="gone"||k?.status==="rout"||k?.formation==="square"&&s.tick-e.chargeAt>=72)){const U=k?e.x-k.x:-e.hx,P=k?e.y-k.y:-e.hy,H=Math.hypot(U,P)||1;e.homeX=Math.max(80,Math.min(gt-80,e.x+U/H*760)),e.homeY=Math.max(80,Math.min(Mt-80,e.y+P/H*760)),e.blownUntil=s.tick+450,e.engaged=!1,e.contactId=-1,e.lastMelee=-9999,e.order="rally",e.forced=-1;for(const B of e.members)B.foe=-1}if(!e.engaged&&(e.order==="assault"||e.order==="charge")&&l.status==="rout"&&c<220&&!Ve(e)&&(e.order="hold",e.homeX=e.x,e.homeY=e.y),mt(e)){if(!e.limbered&&s.tick>=e.deployUntil&&p<30&&S<5){for(const U of e.members)if(U.hp>0&&!U.cooldown&&!U.moving){const P=c<Kd?l:Ru(s,e)??l;De(U,P)<Ll(s)&&Wy(s,U,e,P)}}}else(!Ve(e)&&e.assaultStage!=="rush"&&e.assaultStage!=="melee"&&!e.engaged&&c<pr&&s.tick>=e.reloadAt&&e.order!=="charge"&&l.status!=="rout"||!Ve(e)&&e.assaultStage!=="rush"&&e.assaultStage!=="melee"&&!e.engaged&&l.status==="rout"&&c<pr&&s.tick>=e.reloadAt)&&No(s,e,l)}function fM(s,e,t){const n=c=>c.formation==="square"&&c.formUntil<=s.tick,i=(c,h)=>c.alive*(Ve(c)?n(h)?.5:1.6:ft(c)?1.4:1)*(.4+c.morale/100)*(n(c)?1.6:1)*(pi(ze.farm,c.x,c.y,20)?1.8:1),r=i(e,t),a=i(t,e),o=r<a?e:t,l=Math.max(r,a)/Math.max(.1,Math.min(r,a));gi(o,Math.min(6,1.2*l))}function pM(s,e,t){const n=s.generals[e.faction],i=e.faction?-1:1,r=s.plans[e.faction].mainEffort;let a;for(const l of s.companies)l.faction!==e.faction||l.sector!==r||l.line>1||!l.alive||l.status==="gone"||l.status==="rout"||(!a||(l.x-a.x)*i>0)&&(a=l);a&&(e.homeX=Math.max(80,Math.min(gt-80,a.x-i*1090)),e.homeY=a.y),t<300&&(e.homeX-=i*18,e.homeX=Math.min(gt-80,Math.max(80,e.homeX)));const o=Math.hypot(e.homeX-e.x,e.homeY-e.y);if(o>1){const l=Math.min(o,e.speed*6/30);e.vx=(e.homeX-e.x)/o*l*5,e.vy=(e.homeY-e.y)/o*l*5}else e.vx=0,e.vy=0;e.hx=i,e.hy=0,!n.alive&&e.alive>0&&t>900&&(e.order="hold")}const ef=new WeakMap,mM=[0,1,2],Pu=["左翼","中央","右翼"],Nl=(s,e)=>Math.hypot(s.x-e.x,s.y-e.y),li=(s,e,t)=>Math.max(e,Math.min(t,s)),tf=s=>_n(s)||ft(s),ji=(s,e)=>(s+.5)*e.height/3;function gM(s,e){const t=s.layout,n=s.weather==="fog"?.25:s.weather==="rain"?.2:.14;return mM.map(i=>{const r=f=>f.filter(p=>Bi(p.y,t)===i).length,a=r(t.woods),o=r(t.farms),l=r(t.ridges),c=r(t.bridges),h=Math.min(1,a*.2+o*.22+l*.18),d=t.roads.filter(f=>f.points.some(p=>Bi(p.y,t)===i)).length,u=s.scale/6;return{sector:i,cover:h,openness:1-h,passage:Math.min(1,.2+c*.28+d*.11),elevation:Math.min(1,l*.55),enemyEstimate:Math.round(u*(1+(e.next()*2-1)*n))}})}function xM(s,e,t,n){const i=s.layout,r=e?-1:1,a=s.generals[e].trait,o=s.posture[e]==="attack",l=s.companies.filter(w=>w.faction===e),c=gM(s,t),h=Math.max(1,c.reduce((w,R)=>w+R.enemyEstimate,0)),d=c.map(w=>({sector:w.sector,score:o?.58*(1-w.enemyEstimate/h)+w.openness*(a==="aggressive"?.21:.12)+w.passage*.14+(a==="cunning"&&w.sector!==1?.16:0)+t.next()*.22:w.enemyEstimate/h+w.cover*.2+w.passage*.1+t.next()*.1})).sort((w,R)=>R.score-w.score),u=d[0].sector,f=d[1].sector,p=d[2].sector,y=s.legacySide===e,m=a==="cautious"?1.23:a==="aggressive"?.77:1,g={faction:e,role:o?"attack":"defend",legacy:y,mainEffort:u,feint:f,intel:c,reserve:[],destinations:[],breakthrough:null,reserveAt:null,phases:[{name:"炮火准备",trigger:0,orders:"hold"},{name:"散兵接近",trigger:Math.round(490*m),orders:"advance"},{name:"主攻部队展开",trigger:Math.round(1120*m),orders:"advance"},{name:"骑兵扩张战果",trigger:Math.round(3500*m),orders:"charge"},{name:"投入预备队",trigger:Math.round(6500*m),orders:"advance"}]},_=w=>o?i.width/2-r*i.lineGap:i.ridgeX+Math.sin(w*.0016+i.seed)*80-r*112;function v(w,R,I,N,O,L){R=li(R,150,i.width-150),I=li(I,160,i.height-160),g.destinations.push({company:w.id,x:R,y:I,sector:Bi(I,i),role:N,formation:O,...L?{objectiveId:L.id}:{}}),N==="reserve"&&g.reserve.push(w.id)}if(y){for(const w of l)v(w,w.homeX,w.homeY,w.line===5?"staff":w.line===4?"battery":w.line===3?"horse":w.line===6?"garrison":w.line===1||w.line===2?"reserve":"front",w.formation);return g}const M=l.filter(tf),S=l.filter(w=>mt(w)),b=l.filter(w=>Ve(w)&&w.line!==5);if(o){const w=M.reduce((U,P)=>U+P.alive,0),R=[...M.filter(U=>U.line!==2),...M.filter(U=>U.line===2)];let I=0,N=0;for(const U of R){if(I>=w*.5&&Math.abs(I-w*.55)<Math.abs(I+U.alive-w*.55))break;I+=U.alive,N++}const O=Math.max(1,Math.round((R.length-N)*.47));R.forEach((U,P)=>{const H=P<N?u:P<N+O?f:p,B=P<N?P:P<N+O?P-N:P-N-O,q=P<N?N:P<N+O?O:R.length-N-O,Z=P<N&&B%4===3||H===p,ae=ji(H,i)+(B-(q-1)/2)*Math.min(178,i.height/(4*Math.max(1,q)));v(U,_(ae)-r*(Z?470:0),ae,Z?"reserve":"front",Z?"column":"line")});let L=0;const k=S.reduce((U,P)=>U+P.alive,0);S.forEach((U,P)=>{const H=L<k*.6?u:f;L+=U.alive;const B=ji(H,i)+(P-(S.length-1)/2)*105;v(U,_(B)-r*160,B,"battery","battery")})}else{const w=M.filter(P=>_n(P)),R=M.filter(P=>ft(P)),I=i.objectives.filter(P=>P.kind==="farm"||P.kind==="bridge"),N=[...w,...R];for(const P of I){const H=N.findIndex(q=>q.line===6&&P.kind==="farm"&&P.x===i.farm?.x),B=N.splice(H>=0?H:0,1)[0];if(!B)break;v(B,P.x-r*(P.kind==="bridge"?46:0),P.y,"garrison","line",P)}const O=i.woods.filter(P=>Bi(P.y,i)!==1).sort((P,H)=>Math.abs(P.x-i.ridgeX)-Math.abs(H.x-i.ridgeX))[0];if(O&&N.length>4){const P=N.shift();v(P,O.x,O.y,"woods","line")}const L=N.filter(P=>!ft(P)),k=N.filter(P=>ft(P));L.forEach((P,H)=>{const B=ji(u,i)+(H-(L.length-1)/2)*Math.min(226,i.height/(3*Math.max(L.length,1))),q=L.length>=3&&H%4===1;v(P,_(B)-r*(q?260:0),B,q?"reserve":"front",q?"column":"line")}),k.forEach((P,H)=>{const B=i.height*.5+(H-(k.length-1)/2)*158;v(P,_(B)-r*(a==="steadfast"||a==="cautious"?680:440),B,"reserve","column")});const U=S.filter(P=>!n.has(P.id));S.forEach(P=>{const H=n.get(P.id),B=H?.y??ji(u,i)+(U.indexOf(P)-(U.length-1)/2)*136;v(P,H?H.x-r*130:i.ridgeX+Math.sin(B*.0016+i.seed)*80,B,"battery","battery",H)})}const x=[...c].filter(w=>w.sector!==1).sort((w,R)=>R.openness-w.openness)[0].sector;b.forEach((w,R)=>{const I=o?x:R%2?2:0,N=ji(I,i)+(R-(b.length-1)/2)*118;v(w,_(N)-r*(o?470:660),N,"horse","wedge")});const E=l.find(w=>w.line===5);if(E){const w=ji(1,i);v(E,_(w)-r*1290,w,"staff","staff")}return g}function _M(s,e,t,n){const i=s?-1:1,r=s?n.width-90:90,l=n.roads.filter(u=>u.points.some(f=>f.x<1)&&u.points.some(f=>f.x>=n.width)).map(u=>s?[...u.points].reverse():u.points).sort((u,f)=>Math.abs(u[0].y-t.y)-Math.abs(f[0].y-t.y))[0],c=l?.[0].y??t.y,h=[{x:r,y:li(c+(e%7-3)*88,130,n.height-130)}];if(l){const u=r+(t.x-r)*.65,f=(e%3-1)*9;for(let p=1;p<l.length;p++){const y=l[p-1],m=l[p];if((m.x-u)*i<0){h.push({x:m.x,y:m.y+f});continue}const g=li((u-y.x)/(m.x-y.x||1),0,1);h.push({x:u,y:y.y+(m.y-y.y)*g+f});break}h.splice(1,0,{x:r+i*160,y:c+f})}h.push({x:t.x-i*Math.min(290,n.width*.025),y:t.y},t);const d=[h[0]];for(let u=1;u<h.length-1;u++){const f=h[u-1],p=h[u],y=h[u+1],m=Nl(f,p),g=Nl(p,y);if(m<1||g<1)continue;const _=Math.min(110,m*.32,g*.32),v={x:p.x+(f.x-p.x)*_/m,y:p.y+(f.y-p.y)*_/m},M={x:p.x+(y.x-p.x)*_/g,y:p.y+(y.y-p.y)*_/g};for(let S=0;S<=6;S++){const b=S/6,x=1-b;d.push({x:x*x*v.x+2*x*b*p.x+b*b*M.x,y:x*x*v.y+2*x*b*p.y+b*b*M.y})}}return d.push(t),d}function vM(s,e,t,n){const i=s.companies[e.company],r=i.faction,a=r?-1:1,o=_M(r,t,e,s.layout),l=[0];for(let f=1;f<o.length;f++)l[f]=l[f-1]+Nl(o[f],o[f-1]);i.homeX=i.x=e.x,i.homeY=i.y=e.y,i.hx=a,i.hy=0,i.sector=e.sector,i.initialFront=i.homeX+a*170,n||(e.role==="garrison"?(i.line!==6&&e.objectiveId!==void 0&&s.layout.objectives[e.objectiveId].kind==="farm"&&(i.base+=8,i.morale+=8),i.line=6,i.order="hold"):tf(i)&&(i.line=e.role==="reserve"?ft(i)?2:1:0,i.order=e.role==="reserve"?"reserve":"hold",i.name=i.name.replace("（农庄守军）",""))),i.formation=e.formation,Cr(i);const c=new Float32Array(i.members.length*2),h=new Float32Array(c.length);for(const[f,p]of i.members.entries())c[2*f]=p.x-e.x,c[2*f+1]=p.y-e.y;const d=i.line;i.line=0,i.formation=mt(i)?"battery":d===5?"staff":"column",Cr(i),i.line=d;for(const[f,p]of i.members.entries())h[2*f]=(p.x-e.x)*a,h[2*f+1]=(p.y-e.y)*a;const u=s.deployEnd??1350;return{c:i,d:e,points:o,cumulative:l,length:l[l.length-1],delay:t%8*15,stop:u-t%5*11,march:h,station:c,finished:!1}}function yM(s){const e=new Map,t=s.layout.ridgeOwner;if(t<0||s.legacySide===t)return e;const n=s.companies.filter(i=>i.faction===t&&mt(i));for(const i of s.layout.objectives.filter(r=>r.kind==="bridge")){const r=[...n].sort((c,h)=>h.members.length-c.members.length)[0];if(!r||r.members.length<2)break;const a=r.members.pop();r.alive--,r.peak--,r.capacity--;const o=s.companies.length,l={...r,id:o,name:r.name+" · "+i.name+"炮组",members:[a],alive:1,peak:1,capacity:1,files:1,cavalryDistances:new Map,colors:0,ammo:0};a.company=o,a.slot=0,a.officer=!0,s.companies.push(l),e.set(o,i)}return e}function MM(s){const e=yM(s),t=[0,1].map(n=>xM(s,n,new yi(s.seed^(n?1634886504:1886151022)),e));ef.set(s,t.flatMap(n=>n.destinations.map((i,r)=>vM(s,i,r,n.legacy)))),nf(s);for(const n of t){const i=n.destinations.filter(o=>o.role==="battery"&&o.sector===n.mainEffort).reduce((o,l)=>o+s.companies[l.company].alive,0),r=ji(n.mainEffort,s.layout),a=s.generals[n.faction];s.say(a.name+(n.legacy?"采用原有阵位":n.role==="attack"?"将主攻放在"+Pu[n.mainEffort]+"，集结"+i+"门炮":"决定据守要点，重点防守"+Pu[n.mainEffort]),n.faction,s.layout.width/2,r,2)}return t}function nf(s){const e=ef.get(s);if(e)for(const t of e){if(t.finished)continue;const{c:n,d:i,points:r,march:a,station:o}=t,l=li((s.tick-t.delay)/(t.stop-t.delay),0,1),c=Ve(n)?Ft.horseTrot:n.speed,h=Math.min(t.length,(t.stop-t.delay)*c/30),d=t.length-h+l*h;let u=1;for(;u<r.length-1&&t.cumulative[u]<d;)u++;const f=r[u-1],p=r[u],y=Math.max(.001,t.cumulative[u]-t.cumulative[u-1]),m=li((d-t.cumulative[u-1])/y,0,1),g=(p.x-f.x)/y,_=(p.y-f.y)/y,v=f.x+(p.x-f.x)*m,M=f.y+(p.y-f.y)*m,S=li((l-.82)/.18,0,1),b=S*S*(3-2*S),x=n.faction?-1:1;n.vx=s.tick?(v-n.x)*30:0,n.vy=s.tick?(M-n.y)*30:0,n.x=v,n.y=M,n.hx=g,n.hy=_,l===1&&(n.formation=i.formation,n.hx=x,n.hy=0,Cr(n),n.vx=n.vy=0,t.finished=!0);for(let E=0;E<n.members.length;E++){const w=n.members[E],R=a[2*E],I=a[2*E+1],N=R*x*(1-b)+o[2*E]*b,O=I*x*(1-b)+o[2*E+1]*b,L=w.x,k=w.y;w.x=li(v+N,3,s.layout.width-3),w.y=li(M+O,3,s.layout.height-3),w.px=s.tick?L:w.x,w.py=s.tick?k:w.y,w.vx=l>0&&l<1?(w.x-L)*30:0,w.vy=l>0&&l<1?(w.y-k)*30:0,s.tick&&l>0&&l<1&&(w.stride+=Math.hypot(w.x-L,w.y-k)),w.face=l===1?x:g<0?-1:1,w.moving=l>0&&l<1,w.pose=w.moving?"march":"stand"}}}function SM(s,e){const t=_n(s)||ft(s),n=s.ammo/Math.max(1,s.alive*40),i=s.fatigue,r=t?Math.max(0,1-n):0;return[{action:"rotate",label:"申请换班",score:e&&t&&s.line===0?Math.max(r*.9,i*.74,(1-s.morale/Math.max(1,s.base))*.86):0},{action:"recover",label:"原地恢复",score:s.order==="hold"||s.order==="reserve"?i*.68:0},{action:"continue",label:"维持当前命令",score:.55}].sort((a,o)=>o.score-a.score)}const da=[0,1,2],bM=[0,1],Lu=Ft.courier,Fo=s=>_n(s)||ft(s),Tn=s=>s.alive>0&&s.status!=="rout"&&s.status!=="gone",An=(s,e)=>Math.hypot(s.x-e.x,s.y-e.y);class EM{corps=[];brigades=[];wagons=[];couriers=[];delivered=0;lost=0;issued=0;resupplied=0;rotations=0;handovers=[];relieving=new Map;returningVia=new Map;support=new Map;resting=new Map;reliefCooldown=new Map;reset(e){this.support.clear(),this.handovers=[],this.relieving.clear(),this.returningVia.clear(),this.resting.clear(),this.reliefCooldown.clear(),this.couriers=[],this.wagons=[],this.corps=[],this.brigades=[],this.delivered=this.lost=this.issued=this.resupplied=this.rotations=0,this.sync(e);for(const t of this.corps){const{faction:n,sector:i}=t,r=e.companies.filter(h=>h.corps===t.id&&h.line!==5),a=r.filter(h=>Fo(h)&&h.line!==0),o=a.length?a:r,l=o.reduce((h,d)=>h+d.homeX,0)/Math.max(1,o.length)+(n?1:-1)*240,c=o.reduce((h,d)=>h+d.homeY,0)/Math.max(1,o.length);this.wagons.push({id:t.id,faction:n,sector:i,x:Math.max(80,Math.min(e.layout.width-80,l)),y:Math.max(80,Math.min(e.layout.height-80,c)),stock:r.reduce((h,d)=>h+d.ammo,0),destroyed:!1})}}sync(e){if(this.brigades.length){const t=new Set(this.brigades.flatMap(n=>n.companies));for(const n of e.companies){if(n.line===5||t.has(n.id))continue;const i=Bi(n.homeY,e.layout),r=n.faction*3+i,a=this.brigades.filter(l=>l.corps===r).sort((l,c)=>l.companies.length-c.companies.length)[0];if(!a)continue;let o=a;if(a.companies.length>=5){const l=a.companies.splice(-2);o={id:this.brigades.length,faction:n.faction,sector:i,corps:r,companies:l,commanderId:e.companies[l[0]].members[0].id},this.brigades.push(o);for(const c of l)e.companies[c].brigade=o.id}n.sector=i,n.corps=r,n.brigade=o.id,o.companies.push(n.id)}return}for(const t of bM){const n=e.companies.filter(r=>r.faction===t&&r.line!==5),i=da.map(r=>n.filter(a=>Bi(a.homeY,e.layout)===r));for(const r of da)for(;i[r].length<3;){const a=da.filter(l=>l!==r&&i[l].length>3).sort((l,c)=>Math.abs(l-r)-Math.abs(c-r)||i[c].length-i[l].length)[0];if(a===void 0)break;const o=(r+.5)*e.layout.height/3;i[a].sort((l,c)=>Math.abs(l.homeY-o)-Math.abs(c.homeY-o)),i[r].push(i[a].shift())}for(const r of da){const a=i[r].sort((d,u)=>d.homeY-u.homeY||d.id-u.id);if(!a.length)continue;const o=t*3+r,l=Math.max(1,Math.round(a.length/4)),c=new Set;for(let d=0;d<l;d++){const u=a.slice(Math.floor(d*a.length/l),Math.floor((d+1)*a.length/l)),f=this.brigades.length,p=u[0].members[0].id;this.brigades.push({id:f,faction:t,sector:r,corps:o,commanderId:p,companies:u.map(y=>y.id)}),c.add(p);for(const y of u)y.brigade=f,y.sector=r,y.corps=o}const h=a.map(d=>d.members[0]).find(d=>!c.has(d.id))??a[0].members[1]??a[0].members[0];this.corps.push({id:o,faction:t,sector:r,commanderId:h.id})}}}isResting(e){return this.resting.has(e.id)}isRelieving(e){return this.relieving.get(e.id)?.active===!0}isCommitted(e){if(this.resting.has(e.id)||this.relieving.has(e.id))return!0;for(const t of this.relieving.values())if(t.front===e.id)return!0;return!1}dispatch(e,t,n,i=-1,r){const a=e.generals[t.faction].unit;if(!a||a.hp<=0||!Tn(t)||e.winner!==null||e.broken[t.faction]||e.lostSectors[t.faction][t.sector])return-1;const o=this.couriers.find(c=>c.company===t.id);if(o){if(o.relief||o.returning)return o.id;const c=o.point&&r?An(o.point,r)<10:!o.point&&!r;if(o.order===n&&o.target===i&&c)return o.id;this.couriers.splice(this.couriers.indexOf(o),1)}if(this.resting.has(t.id))return-1;const l=++this.issued;return this.couriers.push({id:l,faction:t.faction,company:t.id,order:n,target:i,point:r?{...r}:void 0,x:a.x,y:a.y,dx:t.faction?-1:1,dy:0}),l}intercepted(e,t,n,i,r){let a=!1;return e.hash.visit(t.x,t.y,i,o=>{o.faction!==n&&!o.staff&&(!r||Ve(o))&&Tn(e.companies[o.company])&&(a=!0)}),a}wagonFor(e){return this.wagons.filter(t=>t.faction===e.faction&&!t.destroyed&&t.stock>0).sort((t,n)=>+(t.sector!==e.sector)-+(n.sector!==e.sector)||An(t,e)-An(n,e))[0]}requestRelief(e,t,n){if(t.line!==0||!Tn(t)||this.isCommitted(t)||e.tick<(this.reliefCooldown.get(t.id)??0)||!this.wagonFor(t))return!1;const r=e.companies.filter(c=>c.faction===t.faction&&c.sector===t.sector&&c.line===1&&Fo(c)&&Tn(c)&&!c.engaged&&!this.isCommitted(c)&&c.morale>=42&&c.ammo>c.alive*6&&!this.couriers.some(h=>h.company===c.id)),a=n?r.find(c=>c===n):r.sort((c,h)=>An(c,t)-An(h,t))[0];if(!a)return!1;const o=this.dispatch(e,a,"reserve",-1,{x:t.x,y:t.y}),l=this.couriers.find(c=>c.id===o);return l?(l.relief={front:t.id,reserve:a.id},this.relieving.set(a.id,{front:t.id,since:e.tick,active:!1,retireSent:-1}),this.reliefCooldown.set(t.id,e.tick+900),!0):!1}deliver(e,t,n){if(t.returning){const i=[...this.relieving].find(([,r])=>r.front===n.id);if(!i||!Tn(n)||!Tn(e.companies[i[0]]))return;if(An(n,e.companies[i[0]])>105){i[1].retireSent=-1;return}}if(n.order=t.order,n.forced=t.target,t.point&&(n.homeX=t.point.x,n.homeY=t.point.y),(t.order==="assault"||t.order==="charge")&&(n.chargeAt=e.tick),t.returning){n.line=1,this.resting.set(n.id,e.tick),t.point&&this.returningVia.set(n.id,t.point);const i=[...this.relieving].find(([,r])=>r.front===n.id);if(i){const[r]=i,a=e.companies[r];a.line=0,this.relieving.delete(r),this.rotations++,this.handovers.push({tick:e.tick,front:n.id,reserve:r,distance:An(a,n),x:n.x,y:n.y}),e.say(a.name+"接替"+n.name+"的一线阵地",n.faction,n.x,n.y,2)}}else if(t.relief){const i=this.relieving.get(n.id);i&&(i.active=!0)}}advanceReliefs(e){for(const[t,n]of this.relieving){const i=e.companies[t],r=e.companies[n.front];if(!Tn(r)||!Tn(i)||e.lostSectors[r.faction][r.sector]||e.tick-n.since>9e3){this.relieving.delete(t),this.couriers=this.couriers.filter(d=>!(d.relief?.reserve===t||d.returning&&d.company===r.id));continue}if(!n.active)continue;const a=t%2?1:-1;if(i.order="reserve",i.forced=-1,i.homeX=r.x,i.homeY=r.y+a*34,An(i,r)>95||n.retireSent>=0&&(this.couriers.some(d=>d.returning&&d.company===r.id)||e.tick-n.retireSent<120))continue;if(!this.wagonFor(r)){this.relieving.delete(t);continue}const l={x:r.x+(r.faction?1:-1)*135,y:r.y-a*110},c=this.dispatch(e,r,"rally",-1,l),h=this.couriers.find(d=>d.id===c);h&&(h.returning=!0,n.retireSent=e.tick)}}supply(e){for(const t of this.wagons)t.destroyed||this.intercepted(e,t,t.faction,75,!0)&&(t.destroyed=!0,t.stock=0,e.say("后方弹药车被骑兵截获",t.faction,t.x,t.y,2));for(const t of e.companies){if(!Tn(t)||t.line===5)continue;const n=Math.hypot(t.vx,t.vy)>2,i=e.tick-t.firingSince<150&&t.firingSince>=0||e.tick-t.lastMelee<45,r=t.assaultStage==="rush"||t.order==="charge"&&n?.0045:t.engaged||i?.0026:n?.0012:-.005,o=r<0&&t.fatigue>0&&Au(t)!==1&&this.wagons.some(h=>h.faction===t.faction&&!h.destroyed&&h.stock>0&&An(t,h)<170)?Au(t):n&&r>0?rM(t):1;if(t.fatigue=Math.max(0,Math.min(1,t.fatigue+r*o)),t.fatigue>.6&&(t.engaged||i)&&(t.morale=Math.max(0,t.morale-(t.fatigue-.6)*.12)),!Fo(t))continue;const l=this.wagonFor(t),c=this.resting.get(t.id);if(c!==void 0&&(!l||l.destroyed)){this.resting.delete(t.id);continue}if(c!==void 0&&l){const h=this.returningVia.get(t.id);h&&An(t,h)<46&&this.returningVia.delete(t.id);const d=this.returningVia.get(t.id)??l;t.order="rally",t.homeX=d.x,t.homeY=d.y}if(!n&&!t.engaged&&l&&An(t,l)<170){for(const h of t.members){if(h.hp<=0||h.escaped||Ts(h))continue;const d=Math.min(4,40-h.ammo,l.stock);h.ammo+=d,t.ammo+=d,l.stock-=d,this.resupplied+=d}c!==void 0&&(t.morale=Math.min(t.base,t.morale+.65),t.fatigue<.3&&t.ammo>=t.alive*18&&e.tick-c>300&&this.resting.delete(t.id))}}}step(e){if(e.winner!==null){this.couriers.length=0;return}for(let t=this.couriers.length-1;t>=0;t--){const n=this.couriers[t],i=e.companies[n.company];if(!Tn(i)||e.broken[i.faction]||e.lostSectors[i.faction][i.sector]){this.couriers.splice(t,1);continue}const r=i.x-n.x,a=i.y-n.y,o=Math.hypot(r,a),l=Math.min(o,Lu/30);if(o&&(n.dx=r/o,n.dy=a/o,n.x+=n.dx*l,n.y+=n.dy*l),this.intercepted(e,n,n.faction,21,!1)){this.couriers.splice(t,1),this.lost++,n.relief&&this.relieving.delete(n.relief.reserve),e.say("通往"+i.name+"的传令兵阵亡，命令丢失",i.faction,n.x,n.y,1);continue}o<=Lu/30&&(this.couriers.splice(t,1),this.delivered++,this.deliver(e,n,i))}for(let t=e.tick%6;t<e.companies.length;t+=6){const n=e.companies[t];if(!Tn(n)||n.line===5)continue;const i=!this.isCommitted(n)&&e.tick>=(this.reliefCooldown.get(n.id)??0),r=SM(n,i);this.support.set(n.id,r),r[0].action==="rotate"&&e.tick%30<6&&this.requestRelief(e,n)}e.tick%6===0&&this.advanceReliefs(e),e.tick%30===0&&this.supply(e)}}const bs=["法兰西帝国","反法同盟"],TM=[[{name:"拿破仑",title:"皇帝",trait:"cunning"},{name:"内伊",title:"元帅",trait:"aggressive"},{name:"苏尔特",title:"元帅",trait:"steadfast"},{name:"格鲁希",title:"元帅",trait:"cautious"}],[{name:"威灵顿",title:"公爵",trait:"steadfast"},{name:"乌克斯布里奇",title:"伯爵",trait:"aggressive"},{name:"希尔",title:"勋爵",trait:"cautious"},{name:"布吕歇尔",title:"元帅",trait:"cunning"}]],AM=36e3,wM=210;class RM{constructor(e=1200,t=1815,n=null){this.legacySide=n,this.reset(e,t)}legacySide;deployEnd=Ft.deploymentTicks;rearGuard=[null,null];plans;legacy;lostSectors=[[],[]];noAssault=[!1,!1];charges=[];recentRouts=[];timeline=[];turningPoints=[];units=[];companies=[];generals=[];news=[];events=[];rounds=[];alive=[0,0];dead=[0,0];fled=[0,0];start=[0,0];reinforced=[0,0];broken=[!1,!1];winner=null;endTick=-1;ended=!1;reason="";sight=new yu;boardShots=new Su;crowd=new Yy;hash=new $y;rng=new yi(1815);director=new jy;logistics=new EM;objectives=new Rf;stationaryFrames=0;flips=0;toggles=0;slotMoves=0;get jitter(){const e=Math.max(1,this.stationaryFrames/30);return{flipsPerSec:this.flips/e,poseTogglesPerSec:this.toggles/e,slotSwapsPerDeath:this.slotMoves/Math.max(1,this.dead[0]+this.dead[1])}}tick=0;scale=1200;seed=1815;weather="clear";posture=["attack","defend"];layout;reinforcement=null;openingOdds=.5;reset(e=this.scale,t=this.seed){if(!gc.includes(e))throw new RangeError("Unsupported army scale");this.sight=new yu,this.boardShots=new Su,this.scale=e,this.seed=t>>>0,this.rng.state=this.seed,this.stationaryFrames=this.flips=this.toggles=this.slotMoves=0,this.tick=0,this.winner=null,this.ended=!1,this.endTick=-1,this.reason="",this.rearGuard=[null,null],this.lostSectors=[[!1,!1,!1],[!1,!1,!1]],this.charges=[],this.recentRouts=[],this.timeline=[],this.turningPoints=[],this.units=[],this.companies=[],this.news=[],this.rounds=[],this.events=[],this.alive=[0,0],this.dead=[0,0],this.fled=[0,0],this.start=[0,0],this.reinforced=[0,0],this.broken=[!1,!1];const n=this.rng.next();this.weather=n<.55?"clear":n<.8?"rain":"fog",this.generals=[0,1].map(a=>{const o=TM[a][this.rng.int(0,3)];return{faction:a,...o,unit:null,company:-1,alive:!0}});const i=a=>a==="aggressive"||a==="cunning"&&this.rng.next()<.6?"attack":"defend";this.posture=[i(this.generals[0].trait),i(this.generals[1].trait)],this.posture[0]==="defend"&&this.posture[1]==="defend"&&(this.posture[this.rng.int(0,1)]="attack");const r=this.posture[0]==="defend"?0:this.posture[1]==="defend"?1:-1;this.layout=Ov(this.rng,r),iu(this.layout),this.crowd.reset(this.layout);for(const a of[0,1])this.deploy(a,e/2);if(this.reinforcement=null,this.rng.next()<.42){const a=this.rng.int(0,1);this.reinforcement={faction:a,tick:this.rng.int(1e4,18e3),arrived:!1,count:Math.round(e/2*.16),name:a?"普鲁士比洛军":"格鲁希元帅的右翼军"}}if(this.plans=MM(this),this.crowd.step(this),this.director.reset(this),this.legacySide!==null){const a=this.rng.state;this.legacy=new iM,this.legacy.reset(this),this.legacy.cannonadeEnd[this.legacySide]+=this.deployEnd,this.legacy.guardAt[this.legacySide]+=this.deployEnd,this.rng.state=a}this.logistics.reset(this),this.objectives.reset(),this.hash.rebuild(this.units),this.openingOdds=this.odds()}company(e,t,n,i,r,a,o,l,c,h){const d=this.generals[e].trait,u=e?-1:1,f=Xt[t],p=this.companies.filter(v=>v.faction===e&&v.kind===t).length,y=aM(t,e,i,p),m=y?Sa[y].pace:1;y&&(n+=" · "+Sa[y].name[e]);let g=f.morale+this.rng.int(-7,7);d==="aggressive"&&(g+=4),d==="steadfast"&&f.group!=="mounted"&&(g+=9),i===5&&(g=100);const _={id:this.companies.length,faction:e,kind:t,variant:y,name:n,members:[],alive:0,peak:0,x:a,y:o,sector:Math.max(0,Math.min(2,Math.floor(o*3/Mt))),brigade:Math.floor(this.companies.length/4),corps:e*3+Math.max(0,Math.min(2,Math.floor(o*3/Mt))),ammo:0,fatigue:0,smoke:0,fireMode:"first",firingSince:-1,nextGroup:0,firstVolleyAt:-999,sprintUntil:0,sprintReady:0,assaultStage:"idle",assaultUntil:0,assaultReady:0,freshAtStart:!1,cavalryDistances:new Map,lastHorse:-9999,leftSquare:-9999,formedSquareAt:-9999,chargeOpponent:-1,lastMelee:-9999,contactId:-1,contactAt:-9999,blownUntil:0,relocated:!1,limbered:!1,deployUntil:0,initialFront:a+u*170,vx:0,vy:0,capacity:r,lastShrink:-90,margin:0,hx:u,hy:0,gx:a,gy:o,homeX:a,homeY:o,formation:l,formUntil:0,files:1,ranks:h,order:c,status:"steady",morale:g,base:g,target:-1,forced:-1,reloadAt:0,engaged:!1,checkedAt:-999,chargeAt:-999,line:i,losses:0,volleys:0,routs:0,charges:0,captures:0,rallies:0,wooded:!1,kills:0,underFire:0,speed:f.speed*m*(i===5?.8:1),colors:0,rallied:0};this.companies.push(_);for(let v=0;v<r;v++)this.soldier(_,t);return _}soldier(e,t){const n={body:ku[Xt[t].frame],id:this.units.length,faction:e.faction,kind:t,company:e.id,slot:e.members.length,x:e.x,y:e.y,vx:0,vy:0,ammo:_n({kind:t})||ft({kind:t})?40:0,shotsFired:0,loadedAt:0,shotTarget:-1,kneelUntil:0,hp:Xt[t].hp,face:e.hx,moving:!1,pose:"stand",hitAt:-999,firedAt:-999,fireAt:-1,stride:this.rng.int(0,15),speed:Xt[t].speed*(e.variant&&e.kind===t?Sa[e.variant].pace:1)*(.97+this.rng.next()*.06),cooldown:this.rng.int(0,90),foe:-1,aimTarget:-1,aimX:0,aimY:0,rangeError:0,shotsOnTarget:0,px:e.x,py:e.y,turnFrames:0,marchUntil:0,staff:e.line===5,officer:e.members.length===0&&e.line!==5,diedAt:-999,escaped:!1,general:!1,jx:this.rng.next()*4-2,jy:this.rng.next()*4-2};return Ts(n)&&e.colors++,e.ammo+=n.ammo,e.members.push(n),e.alive++,e.peak++,this.units.push(n),this.alive[e.faction]++,n}deploy(e,t){const n=this.generals[e],i=n.trait,r=e?-1:1,a=this.layout.ridgeOwner===e,o=()=>this.rng.next(),l=Math.max(4,Math.round(t*(.017+o()*.01+(i==="cautious"?.008:0)))),c=Math.round(t*(.12+o()*.08+(i==="aggressive"?.03:0))),h=Math.round(t*(.09+o()*.08)),d=Math.round(t*.035),u=3,f=t-l-c-h-d-u,p=O=>a?pc(O)+r*170:Qi-r*zd,y=e?2:3;let m=this.rng.int(3,18);const g=()=>m+=this.rng.int(1,4),_=()=>e?`第${g()}步兵团`:`第${g()}战列步兵团`,v=(O,L)=>{const k=Math.max(1,Math.round(O/L));return Array.from({length:k},(U,P)=>Math.floor(O*(P+1)/k)-Math.floor(O*P/k))},M=[],S=v(f,Xt.line_infantry.capacity),b=Math.ceil(S.length*.6),x=S.length-b,E=Mt*.78;S.forEach((O,L)=>{const k=L<b,U=k?L:L-b,P=k?b:x,H=oi+(U-(P-1)/2)*E/Math.max(1,P)+(k?0:110),B=p(H)-r*(k?0:330);M.push(this.company(e,"line_infantry",_(),k?0:1,O,B,H,"line","hold",y))});const w=this.layout.farm;if(w&&this.layout.farmOwner===e&&M.length>2){let O=M[0];for(const L of M)Math.abs(L.y-w.y)+(L.line?0:400)<Math.abs(O.y-w.y)+(O.line?0:400)&&(O=L);O.line=6,O.x=O.homeX=w.x,O.y=O.homeY=w.y,O.name+="（农庄守军）",O.base+=8,O.morale+=8}v(h,Xt.guard_grenadier.capacity).forEach((O,L,k)=>{const U=oi+(L-(k.length-1)/2)*200,P=this.company(e,"guard_grenadier",e?`第${L+1}近卫步兵团`:`老近卫军第${L+1}掷弹兵团`,2,O,p(U)-r*700,U,"column","reserve",y);M.push(P)});let R=this.rng.int(1,9);v(c,Xt.cuirassier.capacity).forEach((O,L)=>{const k=L%2?1:-1,U=Math.floor(L/2),P=oi+k*(E/2+160+U%2*120),H=p(oi)-r*(560+U*140);this.company(e,"cuirassier",e?`第${R+=this.rng.int(1,4)}龙骑兵团`:`第${R+=this.rng.int(1,3)}胸甲骑兵团`,3,O,H,P,"wedge","hold",2)});const I="ABCDEFGHIJKLMN";v(l,Xt.field_cannon.capacity).forEach((O,L,k)=>{const U=oi+(L-(k.length-1)/2)*Math.min(520,E/k.length),P=p(U)-r*170;this.company(e,"field_cannon",e?`皇家炮兵${I[L]}连`:`第${L+1}近卫炮兵连`,4,O,P,U,"battery","hold",1)});for(let O=0;O<d;O++)this.soldier(M[O%M.length],"bannerman");const N=this.company(e,"cuirassier",`${n.title}${n.name}的参谋部`,5,u,p(oi)-r*1250,oi,"staff","hold",1);N.members[0].general=!0,n.unit=N.members[0],n.company=N.id,n.alive=!0;for(const O of this.companies)O.faction===e&&(O.members.sort((L,k)=>Number(Ts(L))-Number(Ts(k))),Cr(O));this.start[e]=t}arrive(e){e.arrived=!0;const t=e.faction,n=t?-1:1,i=this.rng.next()<.5,r=t?2:3,a=i?90:Mt-90,o=i?1:-1,l=e.count>80?22:0,c=e.count>=100?4:0,h=e.count-l-c,d=Math.max(1,Math.round(h/32));let u=this.rng.int(10,30);const f=[];for(let p=0;p<d;p++){const y=Math.floor(h*(p+1)/d)-Math.floor(h*p/d);f.push(this.company(t,"line_infantry",t?`普鲁士第${u+=3}团`:`格鲁希军第${u+=3}团`,7,y,Qi-n*(250+p*170),a+o*(p%2)*60,"column","advance",r))}l&&f.push(this.company(t,"cuirassier",t?"普鲁士枪骑兵团":"格鲁希军龙骑兵团",3,l,Qi-n*(250+d*170),a,"wedge","hold",2)),c&&f.push(this.company(t,"field_cannon",t?"普鲁士炮兵连":"格鲁希军炮兵连",4,c,Qi-n*650,a+o*80,"battery","hold",1));for(const p of f)p.hx=0,p.hy=o,Cr(p),p.hx=n,p.hy=0,this.reinforced[t]+=p.alive;this.logistics.sync(this),this.say(t?`${e.name}从侧翼杀到！布吕歇尔兑现了诺言`:`${e.name}终于赶到战场！`,t,Qi-n*400,a,3);for(const p of this.companies)p.status!=="gone"&&(p.faction===t?p.morale=Math.min(p.base,p.morale+10):gi(p,7))}step(){if(this.events.length=0,this.ended)return;if(ze!==this.layout&&iu(this.layout),this.tick++,this.tick<=this.deployEnd){nf(this),this.crowd.step(this),this.tick%30===0&&this.sampleTimeline();return}this.hash.rebuild(this.units);const e=this.reinforcement;e&&!e.arrived&&this.tick>=e.tick&&this.winner===null&&!this.broken[e.faction]&&this.arrive(e),this.logistics.step(this),this.tick%30===1&&this.winner===null&&(this.sight.scan(this),this.director.update(this),this.legacy&&this.legacySide!==null&&!this.broken[this.legacySide]&&this.legacy.army(this,this.legacySide));for(let i=this.tick%6;i<this.companies.length;i+=6)dM(this,this.companies[i]);for(const i of this.companies)i.status!=="gone"&&i.status!=="rout"&&(i.x+=i.vx/30,i.y+=i.vy/30);Xy(this),this.boardShots.step(this);const t=this.units.length,n=this.tick%2*(t>>1);for(let i=0;i<t;i++){const r=this.units[(i+n)%t];if(r.px=r.x,r.py=r.y,r.hp<=0)continue;const a=this.companies[r.company],o=r.face,l=r.pose;hM(this,r),!a.engaged&&a.status!=="rout"&&a.formUntil<=this.tick&&a.vx===0&&a.vy===0&&(this.stationaryFrames++,o!==r.face&&this.flips++,(l==="march"&&r.pose==="stand"||l==="stand"&&r.pose==="march")&&this.toggles++)}if(this.crowd.step(this),this.tick%15===0&&this.winner===null&&this.checkVictory(),this.tick%30===0&&(this.winner===null&&this.objectives.update(this),this.sampleTimeline()),this.winner!==null&&this.tick-this.endTick>=wM){this.ended=!0,this.summarize(),this.rounds.length=0;for(const i of this.units)i.hp>0&&(i.moving=!1,i.vx=i.vy=0,i.pose="stand")}}sampleTimeline(){this.timeline.push({tick:this.tick,odds:this.odds(),eff:[this.effective(0),this.effective(1)],morale:[this.armyMorale(0),this.armyMorale(1)]})}summarize(){const e=[{tick:0,odds:this.openingOdds},...this.timeline.filter(c=>c.tick<this.endTick),{tick:this.endTick,odds:this.winner===0?1:0}];let t=-1,n=0,i=0,r=0;const a=[],o=this.winner===0?1:-1;for(let c=0;c<e.length;c++){for(;r+1<c&&e[r+1].tick<=e[c].tick-900;)r++;a.push(r);const h=d=>e[d].odds-e[a[d]].odds;o*h(c)>o*h(n)&&(n=c),Math.abs(h(c))>Math.abs(h(i))&&(i=c),c&&o*(e[c-1].odds-.5)<0&&o*(e[c].odds-.5)>=0&&(t=c)}const l=(c,h,d)=>{const{tick:u,odds:f}=e[h],p=e[d].odds,y=this.news.filter(m=>m.weight>=2&&Math.abs(m.tick-u)<=450).sort((m,g)=>g.weight-m.weight||Math.abs(m.tick-u)-Math.abs(g.tick-u)).slice(0,3);return{kind:c,tick:u,delta:f-p,from:p,to:f,causes:y}};this.turningPoints=[l("decisive",t<0?n:t,t<0?a[n]:t-1),l("swing",i,a[i])]}checkVictory(){for(const e of[0,1]){for(const t of[0,1,2]){if(this.lostSectors[e][t])continue;const n=this.companies.filter(o=>o.faction===e&&o.sector===t&&o.line!==5),i=n.reduce((o,l)=>o+l.peak,0);if(i<15)continue;const r=n.reduce((o,l)=>o+(l.status==="rout"?0:l.alive),0),a=n.reduce((o,l)=>o+l.morale*l.alive,0)/Math.max(1,n.reduce((o,l)=>o+l.alive,0));if(!(r>=.65*i&&a>=25)){this.lostSectors[e][t]=!0,this.say(bs[e]+["左翼","中央","右翼"][t]+"撤离战区",e,n[0].x,n[0].y,3);for(const o of n)o.status!=="rout"&&o.alive&&(o.order="rally",o.forced=-1,o.homeX=o.x+(e?1:-1)*680)}}this.lostSectors[e].filter(Boolean).length>=2&&this.winner===null&&this.breakArmy(e,bs[e]+"失守两个战区，有序撤退")}if(this.winner===null&&this.tick>=AM){const e=this.odds()<.5?0:1;this.breakArmy(e,`夜幕降临，${bs[e]}趁夜撤离战场`)}}breakArmy(e,t){if(this.broken[e])return;this.broken[e]=!0;const n=this.companies.filter(r=>r.faction===e&&r.status!=="rout"&&r.alive>0),i=n.filter(r=>r.line!==5&&!mt(r)&&r.morale>40).sort((r,a)=>(e?1:-1)*(r.x-a.x))[0];this.rearGuard[e]=i?.id??null;for(const r of n)r.forced=-1,r.order=r===i?"hold":"rally",r.homeX=Math.max(80,Math.min(this.width-80,r.x+(r===i?0:(e?1:-1)*900))),r.homeY=r.y;i&&this.say(i.name+"留下掩护其余部队撤离",e,i.x,i.y,2),this.say(`${bs[e]}开始全军撤退`,e,this.frontline().x,this.frontline().y,3),this.winner===null&&(this.winner=1-e,this.endTick=this.tick,this.reason=t)}generalDown(e,t="炮弹"){const n=this.generals[e.faction];if(n.alive){n.alive=!1,this.say(`${n.title}${n.name}${t==="骑兵"?"遭遇敌骑，落马阵亡":"被流弹击中"}！全军震动`,e.faction,e.x,e.y,3);for(const i of this.companies)i.faction===e.faction&&gi(i,14)}}say(e,t,n,i,r){this.news.push({odds:this.odds(),tick:this.tick,text:e,faction:t,x:n,y:i,weight:r})}effective(e){let t=0;for(const n of this.companies)n.faction===e&&n.line!==5&&n.status!=="rout"&&n.status!=="gone"&&(t+=n.alive);return t}routing(e){let t=0;for(const n of this.companies)n.faction===e&&n.line!==5&&n.status==="rout"&&(t+=n.alive);return t}armyMorale(e){let t=0,n=0;for(const i of this.companies)i.faction===e&&i.line!==5&&i.status!=="gone"&&(t+=i.morale*i.alive,n+=i.alive);return n?t/n:0}power(e){let t=0;for(const i of this.companies)i.faction===e&&i.line!==5&&i.status!=="rout"&&i.status!=="gone"&&(t+=i.alive*Xt[i.kind].value*(.35+i.morale/100)*(i.line===6?1.5:1));this.generals[e].alive&&(t*=1.05),this.layout.ridgeOwner===e&&(t*=1.12);const n=this.reinforcement;return n&&!n.arrived&&n.faction===e&&this.tick>0&&(t*=1.04),t}odds(){if(this.winner!==null)return this.winner===0?1:0;const e=this.power(0)**1.6,t=this.power(1)**1.6;return e+t>0?e/(e+t):.5}frontline(){const e=[[0,0,0],[0,0,0]];for(const n of this.companies)if(n.status!=="gone"&&n.status!=="rout"&&n.line!==5&&n.line!==2){const i=e[n.faction];i[0]+=n.x*n.alive,i[1]+=n.y*n.alive,i[2]+=n.alive}const t=e.filter(n=>n[2]);return t.length?{x:t.reduce((n,i)=>n+i[0]/i[2],0)/t.length,y:t.reduce((n,i)=>n+i[1]/i[2],0)/t.length}:{x:Qi,y:oi}}companyOf(e){return this.companies[e.company]}get width(){return this.layout.width}}function CM(s,e){const t=[],n=e?"#954538":"#385a81",i="#dfbd71";function r(o,l,c,h,d,u,f,p,y=0,m=0){const g=o.index?o.toNonIndexed():o;g.deleteAttribute("uv"),g.scale(u,f,p),g.rotateX(y),g.rotateZ(m),g.translate(c,h,d),g.computeVertexNormals();const _=new Float32Array(g.attributes.position.count*3),v=new Ce(l);for(let M=0;M<_.length;M+=3)_[M]=v.r,_[M+1]=v.g,_[M+2]=v.b;g.setAttribute("color",new qt(_,3)),t.push(g)}const a=(o,l,c,h,d,u,f,p=0)=>r(new is,o,l,c,h,d,u,f,0,p);if(s==="rider"){const o="#79523d";a(o,0,.95,0,1.55,.64,.55),a(o,.69,1.25,0,.37,.81,.4,-.35),a(o,.92,1.58,0,.6,.3,.35);for(const l of[-.52,.54])for(const c of[-.2,.2])a("#503c32",l,.43,c,.16,.83,.14,(l+c)*.17);a("#40362d",-.87,.91,0,.16,.66,.17,-.32),a("#593f30",-.03,1.31,0,.69,.15,.62),a(n,-.06,1.62,0,.41,.55,.4),a("#f2d1a7",-.03,2.02,0,.3,.3,.29),a("#35363a",-.04,2.25,0,.36,.23,.32),a(i,.08,1.57,.21,.07,.42,.035,-.4),a("#b68c58",-.27,1.44,.28,.31,.23,.14),a("#f5e3bf",-.27,1.54,.3,.23,.035,.08)}else if(s==="wagon"){a("#775639",0,.65,0,2.15,.22,1.1),a("#ad895f",0,.96,0,1.86,.48,1.04);for(const o of[-.56,0,.56])a("#786448",o,1.22,0,.05,.05,1.03);a(n,0,1.3,0,1.78,.14,.99);for(const o of[-.69,.69])for(const l of[-.62,.62])r(new La(.37,.37,.12,10),"#473d32",o,.4,l,1,1,1,Math.PI/2),r(new La(.22,.22,.13,8),"#997853",o,.4,l,1,1,1,Math.PI/2);a("#8a704c",1.44,.52,-.36,1,.08,.08),a("#8a704c",1.44,.52,.36,1,.08,.08)}else{a("#87754c",0,1.65,0,.05,3.3,.05);const o=s==="corps"?2:1;for(let l=0;l<o;l++){const c=3.06-l*.36,h=new Bt;h.setAttribute("position",new St([0,0,0,0,-.36,0,.8,-.16,0],3)),r(h,l===0?i:n,0,c,0,1,1,1)}}return Hv(t)}class PM{group=new Ln;batches=new Map;o=new it;material=new ka({vertexColors:!0,side:Tt});constructor(e){e.add(this.group)}put(e,t,n,i,r,a){const o=e+t;let l=this.batches.get(o);if(l||(l=new an(CM(e,t),this.material,256),l.count=0,l.castShadow=!0,l.receiveShadow=!0,l.frustumCulled=!1,this.group.add(l),this.batches.set(o,l)),l.count>=l.instanceMatrix.count)return;const c=Lt(n),h=It(i);this.o.position.set(c,dt(c,h)+.03,h),this.o.rotation.y=r,this.o.scale.setScalar(a),this.o.updateMatrix(),l.setMatrixAt(l.count++,this.o.matrix)}update(e,t){const n=e.logistics;if(this.group.visible=t>.01,!!this.group.visible){for(const i of this.batches.values())i.count=0;for(const i of n.couriers)this.put("rider",i.faction,i.x,i.y,-Math.atan2(i.dy,i.dx),1.22);for(const i of n.wagons)i.destroyed||this.put("wagon",i.faction,i.x,i.y,i.faction?Math.PI:0,1.5);for(const[i,r]of[["brigade",n.brigades],["corps",n.corps]])for(const a of r){const o=e.units[a.commanderId];o&&o.hp>0&&this.put(i,a.faction,o.x-4,o.y,0,i==="corps"?1.22:1)}this.material.transparent!==t<.99&&(this.material.transparent=t<.99,this.material.needsUpdate=!0),this.material.opacity=t;for(const i of this.batches.values())i.instanceMatrix.needsUpdate=!0,i.visible=i.count>0}}}const sf=["#294968","#8d4136","#243343"],Iu=13;function rf(s){const{width:e,height:t}=s.layout,n=[],i=s.companies.filter(r=>r.alive&&r.line!==5&&r.status!=="rout"&&r.status!=="gone");for(let r=0;r<Iu;r++){const a=r*t/(Iu-1);let o=-1/0,l=1/0;for(const c of i){const h=Math.abs(c.y-a)*.6;c.faction===0?o=Math.max(o,c.x-h):l=Math.min(l,c.x+h)}n.push(Number.isFinite(o+l)?Math.max(0,Math.min(e,(o+l)/2)):e/2)}return n}function ys(s,e){s.beginPath(),e.forEach((t,n)=>n?s.lineTo(t.x,t.y):s.moveTo(t.x,t.y))}function af(s,e,t,n){const i=s.getContext("2d"),r=s.width/e.width,a=e.height,o=e.width;i.setTransform(s.width/o,0,0,s.height/a,0,0),i.fillStyle="#d3c8a4",i.fillRect(0,0,o,a);const l=t.map((c,h)=>({x:c,y:h*a/(t.length-1)}));for(const[c,h]of[[0,"rgba(74,111,158,.18)"],[o,"rgba(171,85,69,.17)"]])ys(i,[{x:c,y:0},...l,{x:c,y:a}]),i.closePath(),i.fillStyle=h,i.fill();if(n){i.lineWidth=.7/r,i.strokeStyle="#a2987973";for(let c=0;c<o;c+=1e3)ys(i,[{x:c,y:0},{x:c,y:a}]),i.stroke();for(let c=0;c<a;c+=1e3)ys(i,[{x:0,y:c},{x:o,y:c}]),i.stroke()}i.strokeStyle="#9a906b",i.lineWidth=1/r;for(const c of e.ridges)for(let h=1;h<=3;h++)i.beginPath(),i.ellipse(c.x,c.y,c.width*(.5+h*.4),c.length*(.18+h*.14),0,0,2*Math.PI),i.stroke();i.fillStyle="#879472";for(const c of e.woods)i.beginPath(),i.ellipse(c.x,c.y,c.r,c.r*.87,-.18,0,Math.PI*2),i.fill();i.strokeStyle="#80a5ab",i.lineWidth=Math.max(2/r,e.river.width),ys(i,e.river.points),i.stroke();for(const c of e.roads)i.lineWidth=Math.max(1/r,c.width*.65),i.strokeStyle="#baa17c",ys(i,c.points),i.stroke();for(const c of e.farms)i.fillStyle="#8a7057",i.fillRect(c.x-c.w*.5,c.y-c.h*.5,c.w,c.h);i.strokeStyle="#88785c",i.lineWidth=1.7/r,i.setLineDash([6/r,4/r]),ys(i,l),i.stroke(),i.setLineDash([]),i.textAlign="left",i.textBaseline="middle",i.font="500 "+15/r+'px "Microsoft YaHei", sans-serif';for(const c of e.objectives){const h=(n?4:2.4)/r;i.fillStyle=sf[c.owner]??"#756d55",i.strokeStyle="#eee3be",i.lineWidth=1.2/r,i.beginPath(),i.moveTo(c.x,c.y-h),i.lineTo(c.x+h,c.y),i.lineTo(c.x,c.y+h),i.lineTo(c.x-h,c.y),i.closePath(),i.fill(),i.stroke(),n&&(i.fillStyle="#423d30",i.fillText(c.name,c.x+h*1.8,c.y))}n&&(i.font="600 "+20/r+"px serif",i.fillStyle="#59543d",["左翼","中央","右翼"].forEach((c,h)=>i.fillText(c,o*.034,a*(h+.45)/3)),i.strokeStyle="#7c7457",i.lineWidth=3/r,i.strokeRect(1.5/r,1.5/r,o-3/r,a-3/r)),i.setTransform(1,0,0,1,0,0)}function yc(s){return s.plans}function of(s){return s.tick<s.deployEnd}const Dl=["左翼","中央","右翼"];function LM(s,e){const t=yc(e);if(!t.length||!of(e))return;const n=document.createElement("details");n.className="deployment-chart",n.open=!0;const i=document.createElement("summary");i.textContent="双方部署计划",n.append(i);const r=document.createElement("canvas");r.width=800,r.height=280,r.setAttribute("aria-label","双方连队预定阵位"),n.append(r),af(r,e.layout,rf(e),!1);const a=r.getContext("2d"),o=r.width/e.layout.width,l=r.height/e.layout.height;for(const[h,d]of t.entries())for(const u of d.destinations)a.fillStyle=h?"#ab4439a6":"#294d7da6",a.strokeStyle=h?"#792e25":"#274268",a.lineWidth=1,a.fillRect(u.x*o-4,u.y*l-2.5,8,5),a.strokeRect(u.x*o-4,u.y*l-2.5,8,5);const c=document.createElement("p");c.textContent=t.map((h,d)=>(d?"联军":"法军")+(h.role==="defend"?"主防":"主攻")+Dl[h.mainEffort]).join("　·　"),n.append(c),s.querySelector(".sides-intel")?.before(n)}function IM(s,e){const t=yc(e);if(t.length!==2)return;const n=document.createElement("h3");n.textContent="作战计划复盘",s.append(n);for(const[i,r]of t.entries()){const a=document.createElement("p"),o=r.reserveAt==null?"预备队未投入":"第 "+Math.floor(r.reserveAt/30)+" 秒投入预备队";a.textContent=(i?"联军":"法军")+(r.role==="defend"?"主防":"主攻")+Dl[r.mainEffort]+"，"+(r.breakthrough==null?"未记录突破":"实际突破"+Dl[r.breakthrough])+"。"+o+"。",s.append(a)}}const Es=512,Nu=10;function NM(){const s=document.createElement("canvas");s.width=Nu*64,s.height=120;const e=s.getContext("2d");for(let n=0;n<3;n++)for(let i=0;i<Nu;i++){const r=i*64,a=n*40;e.fillStyle="#333329",e.fillRect(r+1,a+1,62,38),e.fillStyle=sf[n],e.fillRect(r+3,a+3,58,34),e.strokeStyle="#e8d6a2",e.lineWidth=1,e.strokeRect(r+5.5,a+5.5,53,29),e.strokeStyle=e.fillStyle="#f4e7c6",e.lineWidth=2.3,(i<=1||i===3)&&(e.beginPath(),e.moveTo(r+21,a+26),e.lineTo(r+43,a+12),i!==1&&(e.moveTo(r+21,a+12),e.lineTo(r+43,a+26)),e.stroke()),i===2&&(e.beginPath(),e.arc(r+32,a+19,5,0,Math.PI*2),e.fill()),i===3&&(e.beginPath(),e.moveTo(r+26,a+8),e.lineTo(r+28,a+4),e.lineTo(r+32,a+8),e.lineTo(r+36,a+4),e.lineTo(r+38,a+8),e.closePath(),e.fill()),i>=4&&(e.textAlign="center",e.textBaseline="middle",e.font="bold 17px Georgia, sans-serif",e.fillText(["HQ","I","II","III","✉","▤"][i-4],r+32,a+20))}const t=new zi(s);return t.colorSpace=xt,t.minFilter=t.magFilter=Pt,t}function DM(){const s=new nn(1,1),e=(l,c)=>{const h=new Ds(new Float32Array(Es*c),c).setUsage(yr);return s.setAttribute(l,h),h},t=e("aAnchor",4),n=e("aInfo",4),i=e("aState",2),r={atlas:{value:NM()},clock:{value:0},fade:{value:0},middle:{value:0}},a=new vn({uniforms:r,transparent:!0,depthWrite:!1,depthTest:!1,vertexShader:`attribute vec4 aAnchor,aInfo;attribute vec2 aState;uniform float clock,middle;
        varying vec2 v;varying vec4 info;varying float state;varying float blend;
        void main(){v=uv;info=aInfo;state=aState.x;blend=aState.y;vec2 p=position.xy;float broken=step(2.5,state)*step(state,3.5);
        p=mat2(1.,broken*.22,-broken*.22,1.)*p;
        vec4 view=modelViewMatrix*vec4(aAnchor.xyz,1.);
        p.x+=state==2.?sin(clock*16.+aAnchor.x)*.055:0.;
        view.xy+=vec2(p.x*1.56,p.y*(1.+middle))*aAnchor.w;
        view.y+=middle*aAnchor.w*(.6+.8*aInfo.z);gl_Position=projectionMatrix*view;}`,fragmentShader:`uniform sampler2D atlas;uniform float clock,fade,middle;varying vec2 v;varying vec4 info;varying float state;varying float blend;
        void main(){vec3 ink;float alpha=fade*blend;vec2 q=v;float pole=middle*.46;
        if(v.y<pole){if(abs(v.x-.08)>.024)discard;gl_FragColor=vec4(.43,.35,.22,alpha);return;}
        q.y=(v.y-pole)/(1.-pole);
        if(q.y<.16){float strength=q.y>.08?info.z:info.w;ink=q.y>.08?vec3(.85,.76,.51):mix(vec3(.64,.27,.16),vec3(.44,.66,.40),info.w);if(v.x>strength)ink=vec3(.19,.21,.18);}
        else{vec2 local=vec2(v.x,(q.y-.16)/.84);vec2 uv=vec2((info.x+local.x)/10.,(2.-info.y+local.y)/3.);ink=texture2D(atlas,uv).rgb;
        if(state==1. && (local.x<.17||local.x>.83) && (local.y<.18||local.y>.82))ink=vec3(1.,.82,.47);
        if(state==3.)ink=mix(ink,vec3(.85,.19,.12),.18+.2*sin(clock*8.));
        if(state==2. && local.x>.78 && abs(local.y-.52)<(.96-local.x))ink=vec3(1.,.8,.35);
        if(state==4. && local.x>.76 && min(abs(local.y-(local.x-.76)*3.-.23),abs(local.y+(local.x-.76)*3.-.76))<.045)ink=vec3(1.,.87,.66);}
        gl_FragColor=vec4(ink,alpha);#include <colorspace_fragment>
        }`.replace(";#include",`;
#include`)}),o=new an(s,a,Es);return o.count=0,o.frustumCulled=!1,o.renderOrder=25,{mesh:o,anchor:t,info:n,state:i,uniforms:r}}function Du(s){const e=s.line===5?4:s.kind==="cuirassier"?1:s.kind==="field_cannon"?2:s.kind==="guard_grenadier"?3:0;return{x:s.x,y:s.y,f:s.line===7&&s.faction===1?2:s.faction,symbol:e,alive:s.alive,peak:s.peak,morale:s.morale,status:s.status==="rout"?3:s.engaged?4:s.order==="charge"||s.order==="assault"?2:s.formation==="square"?1:0,gx:s.gx,gy:s.gy,alpha:1,intent:s.order==="advance"||s.order==="charge"||s.order==="assault"}}class UM{constructor(e){this.scene=e,this.logistics=new PM(e),this.sheet.width=1024,this.sheet.height=512;const t=new zi(this.sheet);t.colorSpace=xt;const n=new Yn({map:t,transparent:!0,depthWrite:!1,side:Tt,toneMapped:!1,fog:!1});this.plane=new Dt(new nn(1,1),n),this.plane.rotation.x=-Math.PI/2,this.plane.position.y=5.6,this.plane.renderOrder=20;const i=new Bt;i.setAttribute("position",new qt(this.arrowPos,3).setUsage(yr)),i.setAttribute("color",new qt(this.arrowColor,3).setUsage(yr)),this.arrows=new Dt(i,new Yn({vertexColors:!0,side:Tt,transparent:!0,depthWrite:!1,depthTest:!1})),this.arrows.frustumCulled=!1,this.arrows.renderOrder=22,this.group.add(this.plane,this.flags.mesh,this.arrows),e.add(this.group),this.overview.background=new Ce("#b6ad91")}scene;overview=new Ql;logistics;sheet=document.createElement("canvas");flags=DM();group=new Ln;plane;arrows;arrowPos=new Float32Array(Es*42*3);arrowColor=new Float32Array(Es*42*3);front=[];targetFront=[];nextTick=-1;nextPaint=0;prevLayout;gain=0;paper=0;get full(){return this.paper>.995}get soldierOpacity(){return 1-this.gain}gather(e){const t=[],n=new Map;for(const r of e.companies){if(!r.alive||r.status==="gone")continue;const a=Du(r);if(this.paper<.995&&t.push({...a,alpha:1-this.paper}),this.paper<.005)continue;const o=r.sector,l=r.faction+"-"+o,c=n.get(l);c?(c.x+=a.x*a.alive,c.y+=a.y*a.alive,c.morale+=a.morale*a.alive,c.alive+=a.alive,c.peak+=a.peak):n.set(l,{...a,symbol:5+o,alpha:this.paper,x:a.x*a.alive,y:a.y*a.alive,morale:a.morale*a.alive,status:0})}const i=e.logistics;if(this.gain>.005&&this.paper<.995)for(const[r,a]of[[8,i.couriers],[9,i.wagons.filter(o=>!o.destroyed)]])for(const o of a)t.push({x:o.x,y:o.y,gx:o.x,gy:o.y,f:o.faction,symbol:r,alive:1,peak:1,morale:100,status:0,alpha:this.gain*(1-this.paper),intent:!1});if(of(e))for(const r of yc(e))for(const a of r.destinations){const o=e.companies[a.company];!o||Math.hypot(o.x-a.x,o.y-a.y)<100||t.push({...Du(o),x:a.x,y:a.y,status:0,intent:!1,alpha:.32*(1-this.paper)})}for(const r of n.values())r.x/=r.alive,r.y/=r.alive,r.morale/=r.alive,t.push(r);return t}drawArrows(e,t,n){let i=0;const r=(o,l,c)=>{this.arrowPos.set([o,7,l],i*3),this.arrowColor.set(c===0?[.17,.34,.52]:[.58,.26,.19],i*3),i++};for(const o of e){const l=Lt(o.x),c=It(o.y),h=(o.gx-o.x)*ut,d=(o.gy-o.y)*ut,u=Math.hypot(h,d);if(!o.intent||u<3||o.status===3||o.symbol>=5||this.paper>.995)continue;const f=h/u,p=d/u,y=Math.min(t*.0018,u*.065),m=_=>{const v=Math.sin(_*Math.PI)*Math.min(u*.12,5)*(o.f?1:-1);return[l+h*_-p*v,c+d*_+f*v]};for(let _=0;_<5;_++){const v=m(_*.17),M=m((_+1)*.17);for(const[S,b]of[[v,1],[v,-1],[M,1],[M,1],[v,-1],[M,-1]])r(S[0]-p*y*b,S[1]+f*y*b,o.f)}const g=m(.85);r(g[0]-p*y*3,g[1]+f*y*3,o.f),r(g[0]+p*y*3,g[1]-f*y*3,o.f),r(l+h,c+d,o.f)}const a=this.arrows.geometry;a.setDrawRange(0,i),a.attributes.position.needsUpdate=a.attributes.color.needsUpdate=!0,this.arrows.material.opacity=.6*n*(1-this.paper),this.arrows.visible=i>0}update(e,t,n,i,r){const a=(p,y)=>p+Math.sign(y-p)*Math.min(Math.abs(y-p),n/.3);this.gain=a(this.gain,t>=300?1:0),this.paper=a(this.paper,t>=900?1:0),this.logistics.update(e,1-this.gain);const o=Math.min(1,Math.max(0,(t-80)/20)),l=Math.max(o,this.gain);this.prevLayout!==e.layout&&(this.prevLayout=e.layout,this.front=[],this.nextTick=-1,this.nextPaint=0),e.tick>=this.nextTick&&(this.targetFront=rf(e),this.front.length||(this.front=[...this.targetFront]),this.nextTick=e.tick+60);for(let p=0;p<this.front.length;p++)this.front[p]+=(this.targetFront[p]-this.front[p])*(1-Math.exp(-n*2));r>=this.nextPaint&&(af(this.sheet,e.layout,this.front,!0),this.plane.material.map.needsUpdate=!0,this.nextPaint=r+(this.paper?240:900)),this.plane.scale.set(e.layout.width*ut,e.layout.height*ut,1),this.plane.material.opacity=this.gain*(.72+.28*this.paper),this.plane.visible=this.gain>.005;const c=this.full?this.overview:this.scene;if(this.group.parent!==c&&c.add(this.group),this.group.visible=l>.005,!this.group.visible)return;const h=this.flags,d=this.gather(e);h.uniforms.clock.value=r*.001,h.uniforms.fade.value=l,h.uniforms.middle.value=1-this.gain;const u=(1-this.gain)*12+this.gain*(this.paper>.5?27:20),f=Math.max(.14,t*u*.5/i);d.slice(0,Es).forEach((p,y)=>{const m=Lt(p.x),g=It(p.y);h.anchor.setXYZW(y,m,this.paper>.5?7:dt(m,g)+1.9,g,f),h.info.setXYZW(y,p.symbol,p.f,p.alive/Math.max(1,p.peak),Math.max(0,Math.min(1,p.morale/100))),h.state.setXY(y,p.status,p.alpha)}),h.anchor.needsUpdate=h.info.needsUpdate=h.state.needsUpdate=!0,h.mesh.count=Math.min(Es,d.length),this.drawArrows(d,t,this.gain)}}function lf(s){const e=Math.min(1,Math.max(0,(s-300)/600));return(39+32*e*e*(3-2*e))*Math.PI/180}function cf(s,e,t,n){const i=lf(t),r=Math.tan(14*Math.PI/180),a=t*Math.sin(i)/(Math.sin(i)-e*r*Math.cos(i));return{x:a*s*r*n,z:t*Math.cos(i)+a*(-Math.cos(i)-e*r*Math.sin(i))}}class FM{constructor(e,t){this.canvas=e,this.camera=t,e.addEventListener("pointerdown",this.down),e.addEventListener("pointermove",this.move),e.addEventListener("pointerup",n=>this.release(n,!1)),e.addEventListener("pointercancel",n=>this.release(n,!0)),e.addEventListener("lostpointercapture",n=>this.release(n,!0)),e.addEventListener("contextmenu",n=>n.preventDefault()),e.addEventListener("gesturestart",n=>n.preventDefault(),{passive:!1}),e.addEventListener("wheel",n=>{n.preventDefault(),t.touch(),this.zoomAt({x:n.clientX,y:n.clientY},t.distance()*Math.exp(Math.sign(n.deltaY)*Math.min(.3,Math.abs(n.deltaY)*.0018)))},{passive:!1})}canvas;camera;fingers=new Map;initial=null;lastTap=null;lastMove=0;velocity={x:0,z:0};multi=!1;offset(e,t){const n=this.canvas.getBoundingClientRect();return cf((e.x-n.left)/n.width*2-1,1-(e.y-n.top)/n.height*2,t,n.width/n.height)}zoomAt(e,t){const n=this.camera.clampZoom(t),i=this.offset(e,this.camera.distance()),r=this.offset(e,n);this.camera.move(i.x-r.x,i.z-r.z),this.camera.zoom(n)}pair(){const[e,t]=this.fingers.values();return t?{p:{x:(e.x+t.x)/2,y:(e.y+t.y)/2},span:Math.hypot(e.x-t.x,e.y-t.y)}:{p:e,span:0}}down=e=>{if(e.button!==0&&e.button!==2)return;this.camera.touch();const t={x:e.clientX,y:e.clientY};this.fingers.set(e.pointerId,t),this.canvas.setPointerCapture(e.pointerId),this.initial=this.fingers.size===1?t:null,this.multi=this.fingers.size>1,this.velocity={x:0,z:0},this.lastMove=e.timeStamp,this.canvas.classList.add("dragging")};move=e=>{if(!this.fingers.has(e.pointerId))return;const t=this.pair();this.fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});const n=this.pair(),i=this.camera.distance(),r=n.span>2&&t.span>2?this.camera.clampZoom(i*t.span/n.span):i,a=this.offset(t.p,i),o=this.offset(n.p,r),l=a.x-o.x,c=a.z-o.z,h=Math.max(8,e.timeStamp-this.lastMove)/1e3;this.velocity={x:l/h,z:c/h},this.lastMove=e.timeStamp,this.camera.touch(),this.camera.move(l,c),this.camera.zoom(r)};release(e,t){if(!this.fingers.delete(e.pointerId))return;if(this.fingers.size){this.initial=null,this.velocity={x:0,z:0};return}this.canvas.classList.remove("dragging");const n={x:e.clientX,y:e.clientY};if(!t&&!this.multi&&this.initial&&Math.hypot(n.x-this.initial.x,n.y-this.initial.y)<7){if(this.lastTap&&e.timeStamp-this.lastTap.time<340&&Math.hypot(n.x-this.lastTap.p.x,n.y-this.lastTap.p.y)<32){const i=this.offset(n,this.camera.distance());this.camera.move(i.x,i.z),this.camera.zoom(this.camera.clampZoom(this.camera.distance()*.58)),this.lastTap=null}else this.lastTap={p:n,time:e.timeStamp};this.velocity={x:0,z:0}}(t||this.multi||e.timeStamp-this.lastMove>75)&&(this.velocity={x:0,z:0}),this.multi=!1,this.initial=null}update(e){if(this.fingers.size||Math.hypot(this.velocity.x,this.velocity.z)<.08)return;const t=Math.exp(-12*e),n=(1-t)/12;this.camera.move(this.velocity.x*n,this.velocity.z*n),this.velocity.x*=t,this.velocity.z*=t}}const Ms=4096;function Ki(s,e,t){const n=Lt(s),i=It(e);return{x:n,y:dt(n,i)+t,z:i}}class OM{mode="subtle";maxLength=0;mesh;start;end;style;segments=[];previous=new Map;calibration=new Map;labels=[];stored=[];size={value:new ke(1024,680)};strength={value:1};shake=null;projection=new G;constructor(e){const t=new nn(1,1);this.start=Kn(t,"aStart",Ms,3),this.end=Kn(t,"aEnd",Ms,3),this.style=Kn(t,"aTrail",Ms,3);const n=new vn({transparent:!0,depthWrite:!1,side:Tt,uniforms:{viewport:this.size,strength:this.strength},vertexShader:`attribute vec3 aStart,aEnd,aTrail; uniform vec2 viewport;varying vec2 v;varying vec3 style;
            void main(){
                vec4 a=projectionMatrix*viewMatrix*vec4(aStart,1.),b=projectionMatrix*viewMatrix*vec4(aEnd,1.);
                vec2 d=(b.xy/max(.01,b.w)-a.xy/max(.01,a.w))*viewport;
                vec2 normal=vec2(-d.y,d.x)/max(length(d),.01);
                gl_Position=mix(a,b,uv.x);
                gl_Position.xy+=normal*(uv.y*2.-1.)*(aTrail.y<.5?1.65:2.25)*gl_Position.w/viewport;
                v=uv;style=aTrail;
            }`,fragmentShader:`uniform float strength;varying vec2 v;varying vec3 style;
            void main(){
                bool musket=style.y<.5;float age=style.x;

                float alpha=(1.-age)*strength*(1.-smoothstep(.42,1.,abs(v.y*2.-1.)));
                vec3 color=musket?vec3(2.7,1.85,.65):mix(vec3(.89,.89,.82),vec3(.32,.32,.30),age);
                gl_FragColor=vec4(color,alpha*(musket?.93:.78));
            }`});this.mesh=new an(t,n,Ms),this.mesh.count=0,this.mesh.frustumCulled=!1,this.mesh.renderOrder=7,e.add(this.mesh)}installControl(){const e=document.querySelector("#hud nav.controls");if(!e)return;const t=document.createElement("div");t.className="controlrow";const n=document.createElement("button");n.className="labeled",n.id="tracer-mode";const i=["clear","subtle","off"],r={clear:"清晰",subtle:"写实",off:"关闭"},a=()=>{n.textContent="弹道线 · "+r[this.mode]};n.onclick=()=>{this.mode=i[(i.indexOf(this.mode)+1)%i.length],a()},a(),t.append(n),e.append(t)}line(e,t,n,i,r){this.mode!=="off"&&this.segments.push({a:e,b:t,born:n,life:i,kind:r})}musket(e,t){const n=e.companies[e.units[t.unitId].company].target,i=e.companies[n];if(!i&&t.endX===void 0)return;const r=Math.imul(t.unitId+1,2654435761)^Math.imul(e.tick+1,2246822519),a=t.endX??i.x+((r&255)/255-.5)*65,o=t.endY??i.y+((r>>>8&255)/255-.5)*65,l=Ki(t.x+t.dx*12,t.y+t.dy*12,1.08),c=Ki(a,o,t.struck?.9:.12);this.line(l,c,e.tick,3,0)}mark(e,t,n){const i=document.createElement("span");i.className="range-callout",i.textContent=n?"↑ 远弹":"↓ 近弹";const r=document.querySelector("#hud");r&&(this.labels.length>=6&&this.labels.shift().node.remove(),i.hidden=!0,r.append(i),this.labels.push({p:e,tick:t,node:i}))}observe(e,t){const n=e.tick;this.segments=this.segments.filter(r=>n-r.born<r.life),this.stored=this.stored.filter(r=>r.end>n);for(const r of e.events){if(r.type==="tileImpact"){const a=Ki(r.x,r.y,.1);t.bulletImpact(a.x,a.y,a.z,!!r.struck);continue}if(r.type==="fire"&&!r.explosive){this.musket(e,r);continue}if(r.type==="fire"&&r.explosive&&(this.shake={p:Ki(r.x,r.y,0),tick:n}),r.type==="impact"){const a=this.calibration.get(r.unitId);a&&(this.mode==="clear"&&this.mark(Ki(r.x,r.y,1.6),n,a.overshoot),this.calibration.delete(r.unitId))}}const i=new Set(e.rounds);for(const r of this.previous.keys())if(!i.has(r)){const a=Il(r),o=Ki(a.x,a.y,.2);this.stored.push({p:o,end:n+120}),this.previous.delete(r)}for(const r of e.rounds){const a=Il(r),o=Ki(a.x,a.y,a.h),l=this.previous.get(r);if(l)this.line(l,o,n,1,1);else{const c=e.companies[r.gun.aimTarget];if(c&&r.gun.shotsOnTarget<=3){const h=(r.tx-c.x)*r.dx+(r.ty-c.y)*r.dy;Math.abs(h)>20&&this.calibration.set(r.gun.id,{overshoot:h>0})}}this.previous.set(r,o)}this.segments.length>Ms&&this.segments.splice(0,this.segments.length-Ms)}draw(e,t,n,i,r,a){const o=e+t;this.size.value.set(n,i),this.strength.value=this.mode==="subtle"?.35:1;let l=0;if(this.mode!=="off"&&r<=300)for(const h of this.segments){const d=(o-h.born)/h.life;if(d>=1)continue;const u=h.b.x-h.a.x,f=h.b.y-h.a.y,p=h.b.z-h.a.z,y=Math.hypot(u,f,p);if(y<1e-4)continue;const m=h.kind===0?Math.max(1/6,d):1,g=Math.max(0,m-(h.kind===0?.5:1.2)/y);this.start.setXYZ(l,h.a.x+u*g,h.a.y+f*g,h.a.z+p*g),this.end.setXYZ(l,h.a.x+u*m,h.a.y+f*m,h.a.z+p*m),this.maxLength=Math.max(this.maxLength,y*(m-g)),this.style.setXYZ(l,h.kind===0?d:0,h.kind,0),l++}this.mesh.count=l,this.mesh.visible=l>0;for(const h of[this.start,this.end,this.style])Wn(h,l);const c=[];this.labels=this.labels.filter(h=>{if(o-h.tick>42)return h.node.remove(),!1;const d=this.projection.set(h.p.x,h.p.y,h.p.z).project(a);if(h.node.hidden=r>300||this.mode!=="clear"||Math.abs(d.x)>1||Math.abs(d.y)>1||Math.abs(d.z)>1,!h.node.hidden){const u=(d.x+1)*n*.5;let f=(1-d.y)*i*.5;for(;c.some(p=>Math.abs(p.x-u)<48&&Math.abs(p.y-f)<16);)f-=16;c.push({x:u,y:f}),h.node.style.left=u/n*100+"%",h.node.style.top=f/i*100+"%",h.node.style.opacity=String(Math.min(1,(42-o+h.tick)/12))}return!0})}cameraKick(e,t,n,i){const r=this.shake;if(!r||n>=120||Math.hypot(r.p.x-e,r.p.z-t)>20)return 0;const a=i-r.tick;return a>=0&&a<4?.13*(1-a/4)*Math.cos(a*2.6):0}get resting(){return this.stored}get stats(){return{segments:this.mesh.count,drawCalls:Number(this.mesh.visible),mode:this.mode,maxLength:this.maxLength}}reset(){this.maxLength=0,this.segments=[],this.previous.clear(),this.calibration.clear(),this.stored=[],this.shake=null;for(const e of this.labels)e.node.remove();this.labels=[],this.mesh.count=0,this.mesh.visible=!1}}const fa=["golden","storm","fog"],kM={golden:{sun:16765590,power:2.6,sky:14936548,earth:8486999,fill:1.38,fog:14995103,density:.00125,zenith:10203059,rim:15580023},storm:{sun:10205140,power:1.7,sky:10465732,earth:4541001,fill:1.28,fog:8622749,density:.0029,zenith:3885916,rim:10930672},fog:{sun:14867659,power:1.35,sky:13685707,earth:7106397,fill:1.55,fog:12830395,density:.0042,zenith:10726310,rim:14538432}};class BM{constructor(e){this.scene=e,this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.normalBias=.025,this.sun.shadow.bias=-15e-5,this.sun.shadow.radius=1.1,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=600;const t=new Dt(new ac(850,20,12),this.skyMat);t.renderOrder=-5,e.add(this.sun,this.sun.target,this.hemi,t,...this.flashes),this.set("golden")}scene;sun=new Ad;hemi=new wm;flashes=Array.from({length:9},()=>new Td(16753473,0,16,1.6));mode="golden";rim=new Ce;skyMat=new vn({side:tn,depthWrite:!1,uniforms:{top:{value:new Ce},haze:{value:new Ce}},vertexShader:"varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform vec3 top,haze;varying float h;void main(){gl_FragColor=vec4(mix(haze,top,smoothstep(-.06,.74,h)),1.);}"});direction=new G(-.8,.56,.54).normalize();right=new G().crossVectors(new G(0,1,0),this.direction).normalize();up=new G().crossVectors(this.direction,this.right);center=new G;set(e){const t=kM[e];this.mode=e,this.rim.setHex(t.rim),this.sun.color.setHex(t.sun),this.sun.intensity=t.power,this.hemi.color.setHex(t.sky),this.hemi.groundColor.setHex(t.earth),this.hemi.intensity=t.fill,this.scene.fog=new Jl(t.fog,t.density),this.scene.background=new Ce(t.fog),this.skyMat.uniforms.haze.value.setHex(t.fog),this.skyMat.uniforms.top.value.setHex(t.zenith)}flash(e,t,n,i){let r=this.flashes[0];for(const a of this.flashes){if(!i&&a.intensity>0&&a.position.distanceToSquared(this.center.set(e,t,n))<9){r=a;break}a.intensity<r.intensity&&(r=a)}r.position.set(e,t+1.35,n),r.distance=i?17:7,r.intensity=Math.max(r.intensity,(i?95:16)*(this.mode==="golden"?1:1.55))}update(e,t,n,i){for(const c of this.flashes)c.intensity*=Math.exp(-i*13),c.intensity<.02&&(c.intensity=0);const r=Math.min(120,Math.max(12,Math.ceil(t*.31*Math.max(n,1.5)/2)*2)),a=2*r/2048,o=this.center.copy(e);o.addScaledVector(this.right,Math.round(o.dot(this.right)/a)*a-o.dot(this.right)),o.addScaledVector(this.up,Math.round(o.dot(this.up)/a)*a-o.dot(this.up)),this.sun.target.position.copy(o),this.sun.position.copy(o).addScaledVector(this.direction,270);const l=this.sun.shadow.camera;l.right!==r&&(l.left=l.bottom=-r,l.right=l.top=r,l.updateProjectionMatrix())}reset(){for(const e of this.flashes)e.intensity=0}}class zM{target=new In(1,1,{type:Dn,minFilter:Pt,magFilter:Pt});scene=new Ql;camera=new cc;uniforms={frame:{value:this.target.texture},pixel:{value:new ke}};constructor(){const e=new vn({uniforms:this.uniforms,depthTest:!1,depthWrite:!1,vertexShader:"varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}",fragmentShader:`uniform sampler2D frame;uniform vec2 pixel;varying vec2 v;
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
            }`});this.scene.add(new Dt(new nn(2,2),e))}size(e,t){this.target.setSize(e,t),this.uniforms.pixel.value.set(1/e,1/t)}draw(e,t,n){e.setRenderTarget(this.target),e.render(t,n),e.setRenderTarget(null),e.render(this.scene,this.camera)}}const GM=["gore_intestines","gore_organs","gore_bones","gore_chunks","corpses_france","corpses_britain","vfx_cannon_blast"],HM=[128,128,128,128,160,160,192,256];function VM(s,e,t,n){const i=HM[t],r=i/4,a=.002*i,o=t%4*256+n%4*r,l=Math.floor(t/4)*256+Math.floor(n/4)*r;s.setXYZW(e,(o+a)/1024,1-(l+r-a)/512,(r-2*a)/1024,(r-2*a)/512)}async function WM(){const s=new Ba,e=await Promise.all(GM.map(a=>s.loadAsync("./art/gore/"+a+".png"))),t=document.createElement("canvas");t.width=1024,t.height=512;const n=t.getContext("2d");n.imageSmoothingEnabled=!1,e.forEach((a,o)=>{a.magFilter=a.minFilter=_t,a.colorSpace=xt,a.generateMipmaps=!1,n.drawImage(a.image,o%4*256,Math.floor(o/4)*256),a.dispose()});const i=new yi(165);for(let a=0;a<16;a++){n.save(),n.translate(768+a%4*64+32,256+Math.floor(a/4)*64+32);const o=a>=8&&a<12,l=a>=12,c=new Path2D;for(let h=0;h<40;h++){const d=h/40*Math.PI*2,u=(l?12:21)+i.next()*(l?3:5)+Math.sin(d*3+a)*2.7,f=Math.cos(d)*u,p=Math.sin(d)*u*.78;h?c.lineTo(f,p):c.moveTo(f,p)}c.closePath(),n.fillStyle=o?"#4a3928":l?"#a22224":"#57151d",n.fill(c),n.save(),n.clip(c);for(let h=0;h<110;h++)n.fillStyle=o?["#352b23","#604b34","#816642"][h%3]:["#721c27","#661821","#8e2631"][h%3],n.fillRect(i.int(-27,24),i.int(-22,21),i.int(2,9),i.int(1,4));if(n.restore(),!l)for(let h=0;h<10;h++)n.fillStyle=o?"#685338":"#76202a",n.fillRect(i.int(-29,27),i.int(-27,26),2,2);n.restore()}const r=new zi(t);return r.colorSpace=xt,r.minFilter=r.magFilter=_t,r.generateMipmaps=!1,r}const XM=new G(0,1,0),Uu=new G,Zi=new it;class tr{constructor(e,t,n,i,r){this.scene=e,this.mat=t,this.capacity=n,this.flat=i,this.layer=r,t.onBeforeCompile=a=>{a.vertexShader=`attribute vec4 aUvRect;
`+a.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
 vMapUv=aUvRect.xy+uv*aUvRect.zw;`)},this.allocate()}scene;mat;capacity;flat;layer;count=0;pages=[];allocate(){const e=new nn(1,1);this.flat&&e.rotateX(-Math.PI/2);const t=Kn(e,"aUvRect",this.capacity,4),n=new an(e,this.mat,this.capacity);n.count=0,n.frustumCulled=!1,n.receiveShadow=!0,n.renderOrder=this.layer,n.instanceMatrix.setUsage(yr),this.scene.add(n),this.pages.push({mesh:n,uv:t,dirty:1/0,end:0})}put(e,t,n,i,r,a,o,l=0,c=this.count,h=1){const d=Math.floor(c/this.capacity),u=c%this.capacity;d>=this.pages.length&&this.allocate();const f=this.pages[d];return f.mesh.count=Math.max(u+1,f.mesh.count),this.count=Math.max(this.count,c+1),this.flat?(Cy(n,r,Uu),Zi.quaternion.setFromUnitVectors(XM,Uu),Zi.rotateY(o),i=dt(n,r)+.018+this.layer*.023+u%200*18e-5):Zi.rotation.set(-.23+l,0,o,"XYZ"),Zi.position.set(n,i,r),Zi.scale.set(a*h,a,a),Zi.updateMatrix(),f.mesh.setMatrixAt(u,Zi.matrix),VM(f.uv,u,e,t),f.dirty=Math.min(f.dirty,u),f.end=Math.max(f.end,u+1),c}sync(){for(const e of this.pages)e.end>e.dirty&&(Wn(e.mesh.instanceMatrix,e.end-e.dirty,e.dirty),Wn(e.uv,e.end-e.dirty,e.dirty),e.dirty=1/0,e.end=0)}clear(){this.count=0;for(const e of this.pages)e.mesh.count=0,e.dirty=1/0,e.end=0}}class Mc{constructor(e,t,n){this.lights=n;const i=(r,a=0)=>new vi({map:t,alphaTest:.45,roughness:r,metalness:a,side:Tt,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});this.wet=i(.14,.08),this.pools=new tr(e,this.wet,5e3,!0,1),this.craters=new tr(e,i(.98),1200,!0,0),this.corpses=new tr(e,i(.82),2500,!0,3),this.debris=new tr(e,i(.42),12e3,!0,4),this.flying=new tr(e,i(.65),4096,!1,5)}lights;air=[];fallen=[];growth=[];pools;craters;corpses;debris;flying;rng=new yi(1815);wet;static async create(e,t){return new Mc(e,await WM(),t)}get stats(){return{activeAirGore:this.air.filter(e=>e.sheet<4).length,landedCorpses:this.corpses.count,landedGore:this.debris.count,bloodPools:this.pools.count,goreTexturesLoaded:7}}blood(e,t,n,i=!1){const r=this.rng.int(0,7),a=this.rng.next()*6.28,o=this.pools.put(7,r,e,0,t,i?n*.45:n,a);i&&this.growth.push({x:e,z:t,size:n,ang:a,index:o,frame:r,age:0})}event(e){const t=Lt(e.x),n=It(e.y),i=dt(t,n);if(e.type==="impact"||e.type==="bounce"){const o=e.type==="impact"?3:1.5;this.craters.put(7,this.rng.int(8,11),t,0,n,.52,-Math.atan2(e.dy,e.dx),0,this.craters.count,o/.52);return}if(e.type!=="death")return;const r=()=>this.rng.next();e.explosive?this.blood(t,n,1.55,!0):(this.fallen.push({e,age:0}),this.blood(t,n,2.3+r()*.9,!0));const a=(o,l)=>{const c=o===7;for(let h=0;h<l;h++){const d=r()*Math.PI*2,u=(.4+r())*(e.explosive?5.1:2.8);this.air.push({sheet:o,frame:c?12+this.rng.int(0,3):this.rng.int(0,15),x:t,y:i+.52+r()*.65,z:n,vx:Math.cos(d)*u+(e.explosive?0:e.dx*3.4),vz:Math.sin(d)*u+(e.explosive?0:e.dy*3.4),vy:2+r()*(e.explosive?8:4),angle:d,spin:(r()-.5)*14,size:c?.14+r()*.26:.45+r()*.7,bounces:c?0:this.rng.int(1,2)})}};if(e.explosive)for(let o=0;o<4;o++)a(o,(o===0||o===3?4:3)+this.rng.int(0,1));a(7,e.explosive?this.rng.int(10,14):this.rng.int(5,8))}update(e){this.flying.clear();for(let t=this.air.length-1;t>=0;t--){const n=this.air[t];n.vy-=15*e,n.x+=n.vx*e,n.y+=n.vy*e,n.z+=n.vz*e,n.angle+=n.spin*e;const i=dt(n.x,n.z)+.07;if(n.y<=i&&n.vy<0)if(this.blood(n.x,n.z,n.size*(n.sheet===7?2:1.22)),n.y=i,n.bounces-- >0)n.vy*=-.34,n.vx*=.55,n.vz*=.55,n.spin*=.57;else{n.sheet!==7&&this.debris.put(n.sheet,n.frame,n.x,0,n.z,n.size,n.angle),this.air[t]=this.air[this.air.length-1],this.air.pop();continue}this.flying.put(n.sheet,n.frame,n.x,n.y,n.z,n.size,n.angle,Math.sin(n.angle)*.55)}for(let t=this.fallen.length-1;t>=0;t--){const n=this.fallen[t];if(n.age+=e,n.age<.4)continue;const i=n.e;this.corpses.put(i.faction?5:4,this.rng.int(0,15),Lt(i.x),0,It(i.y),i.kind==="cuirassier"?3.2:2.5,this.rng.next()*6.28),this.fallen.splice(t,1)}for(let t=this.growth.length-1;t>=0;t--){const n=this.growth[t];n.age=Math.min(1,n.age+e*1.6),this.pools.put(7,n.frame,n.x,0,n.z,n.size*(.45+.55*n.age),n.ang,0,n.index),n.age===1&&this.growth.splice(t,1)}this.wet.roughness=this.lights.mode==="storm"?.095:.14;for(const t of[this.pools,this.corpses,this.craters,this.debris,this.flying])t.sync()}reset(){this.air.length=this.fallen.length=this.growth.length=0,this.rng.state=1815;for(const e of[this.pools,this.corpses,this.craters,this.debris,this.flying])e.clear()}}const nr=5600;class qM{constructor(e,t){this.lights=t,this.soil=new an(new sc(1,0),new vi({color:6837048,flatShading:!0,roughness:.95}),1100),this.soil.count=0,this.soil.frustumCulled=!1,e.add(this.soil);const n=document.createElement("canvas");n.width=256,n.height=32;const i=n.getContext("2d");for(let h=0;h<8;h++){const d=h*32,u=31-h*2;for(let f=0;f<3;f++)i.fillStyle=["#db581a","#ffae33","#fff2a0"][f],i.beginPath(),i.moveTo(d+1,16),i.lineTo(d+8,10+f),i.lineTo(d+u-f*3,13+h%3),i.lineTo(d+u-5-f*3,17),i.lineTo(d+12,22-f),i.fill()}const r=new zi(n);r.magFilter=_t;const a=new Yn({map:r,transparent:!0,depthWrite:!1,blending:zo,side:Tt});a.onBeforeCompile=h=>{h.vertexShader=`attribute float aFrame;
`+h.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
 vMapUv.x=(vMapUv.x+aFrame)/8.;`)};const o=new nn(1,1);o.translate(.5,0,0),Kn(o,"aFrame",256,1),this.flash=new an(o,a,256),this.flash.count=0,this.flash.frustumCulled=!1,e.add(this.flash);const l=new nn(1,1);this.shape=Kn(l,"aPuff",nr,4),this.style=Kn(l,"aStyle",nr,4);const c=new vn({uniforms:this.uniforms,transparent:!0,depthWrite:!1,side:Tt,vertexShader:`attribute vec4 aPuff,aStyle;uniform vec4 uLight[9];
            varying vec2 v;varying vec3 style;varying float fire,clearance;
            void main(){v=uv*2.-1.;style=aStyle.xyz;
                clearance=(aPuff.y-aStyle.w)/max(.05,aPuff.w)+position.x*viewMatrix[1][0]+position.y*viewMatrix[1][1];vec4 mv=modelViewMatrix*vec4(aPuff.xyz,1.);
                fire=0.;for(int i=0;i<9;i++){vec3 d=aPuff.xyz-uLight[i].xyz;fire+=uLight[i].w/(2.+dot(d,d));}
                if(aStyle.y>4.5 && aStyle.y<5.5){
                    mv=modelViewMatrix*vec4(aPuff.xyz+vec3(position.x,0.,position.y)*aPuff.w,1.);
                }else mv.xy+=position.xy*aPuff.w;
                gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uDistant;uniform vec3 uSun,uSky;varying vec2 v;varying vec3 style;varying float fire,clearance;
            void main(){
                float age=style.x,k=style.y,phase=style.z,r=length(v);
                float warp=.09*sin(5.*v.x+phase+age)*cos(4.*v.y-phase)+.045*sin(v.x*12.+v.y*6.+phase);
                float edge=1.-smoothstep(.51,1.,r+warp);
                float bulb=sqrt(max(0.,1.-dot(v,v)));
                float top=clamp(.43+v.y*.46-v.x*.23+bulb*.24,0.,1.);
                vec3 dye=k<.5?vec3(.50,.40,.235):k<1.5?vec3(.44,.29,.14):vec3(.64,.65,.60);
                if(k>2.5 && k<3.5)dye=mix(vec3(.49,.48,.44),vec3(.72,.73,.69),smoothstep(.05,.59,age));
                if(k>7.5)dye=vec3(.55,.08,.07);
                if(k>5.5 && k<6.5)dye=vec3(.25,.19,.095);
                vec3 col=dye*mix(uSky,uSun,top)+vec3(1.,.41,.09)*min(fire*.10,1.3)*edge;
                float alpha=edge*(1.-age)*(k<1.5?.27:.53)*smoothstep(0.,.075,age+.025);
                if(k>6.5)alpha*=.32;
                if(k>3.5 && k<4.5){col=vec3(5.,2.3,.42);alpha=(1.-smoothstep(.08,1.,r))*(1.-age);}
                if(k>4.5 && k<5.5){alpha=(1.-smoothstep(.025,.14,abs(r-.77)))*(1.-age)*.41;col=vec3(.46,.36,.21);}
                if(k<3.5 || k>5.5)alpha*=smoothstep(.015,.28,clearance);
                alpha*=1.-smoothstep(.73,.96,max(abs(v.x),abs(v.y)));
                if(alpha<.007)discard;gl_FragColor=vec4(col,alpha*uDistant);
            }`});this.mesh=new an(l,c,nr),this.mesh.count=0,this.mesh.frustumCulled=!1,this.mesh.renderOrder=8,e.add(this.mesh)}lights;density=new Float32Array(2048);soil;clods=[];flash;flames=[];matrix=new it;distant={value:1};setDistant(e){this.distant.value=1-.6*e}particleLimit=nr;reduceParticles(){this.particleLimit=Math.floor(nr*.45),this.items.length>this.particleLimit&&(this.items.length=this.particleLimit)}items=[];rng=new yi(53);mesh;shape;style;uniforms={uDistant:this.distant,uSun:{value:new Ce},uSky:{value:new Ce},uLight:{value:Array.from({length:9},()=>new ot)}};get count(){return this.items.length}add(e,t,n,i,r,a,o,l,c){this.items.length>=this.particleLimit||this.items.push({x:e,y:t,z:n,kind:i,size:r,life:a,vx:o,vy:l,vz:c,age:0,seed:this.rng.next()*9,floor:dt(e,n)})}bulletImpact(e,t,n,i){const r=i?2+this.rng.int(0,1):1;for(let a=0;a<r;a++)this.add(e,t,n,i?8:1,i?.24:.72,i?.19:.36,(this.rng.next()-.5)*2,.65+this.rng.next(),(this.rng.next()-.5)*1.8)}event(e){if(e.type!=="impact"&&e.type!=="bounce"&&e.type!=="fire")return;const t=Lt(e.x),n=It(e.y),i=dt(t,n),r=()=>this.rng.next();if(e.type==="impact"||e.type==="bounce"){const h=e.type==="bounce",d=h?8:20+this.rng.int(0,20);for(let u=0;u<d&&this.clods.length<1100;u++){const f=1+r()*5;this.clods.push({x:t,y:i+.1,z:n,vx:e.dx*f+(r()-.5)*3,vy:(h?2:3)+r()*4,vz:e.dy*f+(r()-.5)*3,age:0,s:.04+r()*.13})}for(let u=0;u<(h?2:6);u++)this.add(t,i+.2,n,1,1+r()*2,2+r()*2,e.dx*.6+.4,r()*.4,e.dy*.6);return}const a=e.explosive,o=t+e.dx*(a?1.65:1.2),l=n+e.dy;this.lights.flash(o,i,l,a),this.flames.length<256&&this.flames.push({x:o,y:i+1.1,z:l,angle:-Math.atan2(e.dy,e.dx),age:0,size:a?2.8:1.05}),a&&this.add(o,i+.12,l,5,2.8,.55,0,0,0);const c=Math.min(31,Math.max(0,Math.floor(e.y/Mt*32)))*64+Math.min(63,Math.max(0,Math.floor(e.x/gt*64)));if(this.density[c]=Math.min(25,this.density[c]+(a?2:.45)),!(!a&&this.items.length>3200))for(let h=0;h<(a?11:3);h++){const d=(a?2.8:1.2)*r();this.add(o+(r()-.5)*.3,i+1.06,l,a?3:2,(a?1.8:.65)*(1+r()*.55),(a?6:2)+r()*(a?4:2),e.dx*d+.33,.32+r()*.62,e.dy*d+.13)}}update(e,t){const n=this.matrix;this.clods=this.clods.filter(l=>l.age<4),this.clods.forEach((l,c)=>{l.age+=t,l.vy-=t*12,l.x+=l.vx*t,l.z+=l.vz*t;const h=dt(l.x,l.z)+l.s;l.y=Math.max(h,l.y+l.vy*t),l.y===h&&(l.vx=l.vz=l.vy=0),n.position.set(l.x,l.y,l.z),n.rotation.set(l.age*.5,c,l.age),n.scale.setScalar(l.s*Math.min(1,4-l.age)),n.updateMatrix(),this.soil.setMatrixAt(c,n.matrix)}),this.soil.count=this.clods.length,Wn(this.soil.instanceMatrix,this.soil.count),this.flames=this.flames.filter(l=>l.age<.11);const i=this.flash.geometry.getAttribute("aFrame");this.flames.forEach((l,c)=>{n.position.set(l.x,l.y,l.z),n.rotation.set(0,l.angle,0),n.scale.set(l.size,l.size*.6,1),n.updateMatrix(),this.flash.setMatrixAt(c,n.matrix),i.setX(c,Math.min(7,Math.floor(l.age/.11*8))),l.age+=t}),this.flash.count=this.flames.length,Wn(this.flash.instanceMatrix,this.flash.count),Wn(i,this.flash.count);const r=Math.exp(-t/8);for(let l=0;l<this.density.length;l++){const c=this.density[l]*=r;if(c>1&&this.rng.next()<t*Math.min(2,c*.18)){const h=Lt((l%64+.5)*gt/64),d=It((Math.floor(l/64)+.5)*Mt/32);this.add(h,dt(h,d)+1.8,d,7,3+Math.min(5,c),4,.45,.2,.18)}}const a=()=>this.rng.next(),o=Math.min(t,.05);for(const l of e)if(l.hp>0&&l.moving){const c=l.kind==="cuirassier",h=c?3.4:l.pose==="run"?1.75:.7;if(a()>o*h)continue;const d=Math.max(1,Math.hypot(l.vx,l.vy)),u=c?1.2:.37,f=Lt(l.x)-l.vx/d*u+(a()-.5)*.32,p=It(l.y)-l.vy/d*u;this.add(f,dt(f,p)+.08+a()*.17,p,c?1:0,c?1.32:l.pose==="run"?.85:.55,1.1+a()*(c?1.2:.75),.32-l.vx/d*.36,c?.44:l.pose==="run"?.3:.16,.14)}this.uniforms.uSun.value.setHex(this.lights.mode==="golden"?16771004:13096673),this.uniforms.uSky.value.setHex(this.lights.mode==="golden"?11055539:7899289),this.lights.flashes.forEach((l,c)=>this.uniforms.uLight.value[c].set(l.position.x,l.position.y,l.position.z,l.intensity));for(let l=this.items.length-1;l>=0;l--){const c=this.items[l];if(c.age+=t,c.age>=c.life){this.items[l]=this.items[this.items.length-1],this.items.pop();continue}c.x+=c.vx*t,c.y+=c.vy*t,c.z+=c.vz*t,c.kind===6&&(c.vy=Math.max(-.8,c.vy-t*5))}this.items.forEach((l,c)=>{const h=l.age/l.life;this.shape.setXYZW(c,l.x,l.y,l.z,l.size*(l.kind===4?1:.46+h*(l.kind===3?3.3:1.8))),this.style.setXYZW(c,h,l.kind,l.seed,l.floor)}),this.mesh.count=this.count,Wn(this.shape,this.count),Wn(this.style,this.count)}reset(){this.clods=[],this.flames=[],this.flash.count=this.soil.count=0,this.density.fill(0),this.items.length=0,this.mesh.count=0,this.rng.state=53}}class Sc{constructor(e){this.canvas=e,this.renderer=new Fv({canvas:e,antialias:!1,powerPreference:"high-performance"}),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=lr,this.renderer.toneMapping=Bl,this.renderer.toneMappingExposure=1.09,this.renderer.info.autoReset=!1,this.lights=new BM(this.scene),this.terrain=Ly(this.scene),this.standees=new Hy(this.scene),this.smoke=new qM(this.scene,this.lights),this.balls=new an(new rc(.4,1),new vi({color:3750977,metalness:.45,roughness:.51}),320),this.strategy=new UM(this.scene),this.balls.count=0,this.balls.frustumCulled=!1,this.scene.add(this.balls),this.resize(),this.desired=this.distance=Math.min(300,Math.max(190,330/this.camera.aspect)),this.controls(),new ResizeObserver(()=>this.resize()).observe(e)}canvas;renderer;scene=new Ql;tracers=new OM(this.scene);camera=new sn(28,1,.3,24e3);lights;smoke;gore;standees;post=new zM;terrain;target=new G;goal=new G;distance=158;desired=158;held=new Set;balls;matrix=new We;strategy;get mapSheet(){return this.strategy.sheet}gestures;quality=0;slowSamples=0;mobile=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0&&Math.min(innerWidth,innerHeight)<=600;userAt=-1e9;get drawCalls(){return this.renderer.info.render.calls}get lighting(){return this.lights.mode}get zoom(){return this.distance}get mobileMode(){return this.mobile}get cameraInfo(){return{distance:this.distance,desired:this.desired,x:Ar(this.target.x),y:wr(this.target.z),quality:this.quality}}get visiblePolygon(){return[[-1,1],[1,1],[1,-1],[-1,-1]].map(([e,t])=>{const n=cf(e,t,this.distance,this.camera.aspect);return{x:Ar(this.target.x+n.x),y:wr(this.target.z+n.z)}})}observeFps(e){!this.mobile||this.quality>=3||(this.slowSamples=e<30?this.slowSamples+1:0,!(this.slowSamples<4)&&(this.slowSamples=0,this.quality++,this.quality===1?this.renderer.shadowMap.enabled=!1:this.quality===2?this.smoke.reduceParticles():this.resize()))}static async create(e){const t=new Sc(e);return[t.gore]=await Promise.all([Mc.create(t.scene,t.lights),t.terrain.load(),t.standees.ready]),t}resize(){const e=Math.max(1,this.canvas.clientWidth),t=Math.max(1,this.canvas.clientHeight),n=Math.min(window.devicePixelRatio,this.mobile?1.25:1.5,1700/Math.max(e,t))*(this.quality>=3?.7:1);this.renderer.setPixelRatio(n),this.renderer.setSize(e,t,!1),this.post.size(Math.floor(e*n),Math.floor(t*n)),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}screen(e,t){const n=Lt(e),i=It(t);return new G(n,dt(n,i)+3,i).project(this.camera)}panTo(e,t){this.goal.set(rr.clamp(e,-gt*ut/2,gt*ut/2),0,rr.clamp(t,-Mt*ut/2,Mt*ut/2))}limitZoom(e){const t=Math.max(1050,gt*ut*2.65/this.camera.aspect,Mt*ut*1.9);return rr.clamp(e,28,t)}zoomTo(e){this.desired=this.limitZoom(e)}zoomBy(e){this.userAt=performance.now(),this.zoomTo(this.desired*e)}viewPoint(e,t){this.userAt=performance.now(),this.focus(e,t)}focus(e,t,n){this.panTo(Lt(e),It(t)),n&&this.zoomTo(n)}home(e){const t=e.frontline();this.panTo(Lt(t.x),It(t.y))}setLighting(e){this.lights.set(e),this.standees.rim.value.copy(this.lights.rim)}reset(){this.terrain.rebuild(),this.gore.reset(),this.smoke.reset(),this.tracers.reset(),this.lights.reset(),this.balls.count=0,this.panTo(0,0)}advanceEffects(e,t){this.gore.update(t),this.smoke.update(e.ended?[]:e.units,t)}events(e){this.tracers.observe(e,this.smoke);for(const t of e.events)this.gore.event(t),this.smoke.event(t)}controls(){const e=this.canvas,t=()=>{this.userAt=performance.now()};this.gestures=new FM(e,{distance:()=>this.desired,clampZoom:i=>this.limitZoom(i),zoom:i=>this.zoomTo(i),touch:t,move:(i,r)=>this.panTo(this.goal.x+i,this.goal.z+r)});const n=["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"];window.addEventListener("keydown",i=>{const r=i.key.toLowerCase();n.includes(r)&&(i.preventDefault(),this.held.add(r),t())}),window.addEventListener("keyup",i=>this.held.delete(i.key.toLowerCase())),window.addEventListener("blur",()=>this.held.clear())}render(e,t,n,i){this.gestures.update(t);const r=(d,u)=>Number(this.held.has(d)||this.held.has(u)),a=this.distance*.68*t;this.held.size&&this.panTo(this.goal.x+(r("d","arrowright")-r("a","arrowleft"))*a,this.goal.z+(r("s","arrowdown")-r("w","arrowup"))*a);const o=1-Math.exp(-t*(performance.now()-this.userAt<1500?11:2.6));this.distance=rr.lerp(this.distance,this.desired,o),this.target.lerp(this.goal,o),this.target.y=dt(this.target.x,this.target.z);const l=lf(this.distance);this.camera.position.copy(this.target),this.camera.position.y+=this.distance*Math.sin(l)+this.tracers.cameraKick(this.target.x,this.target.z,this.distance,e.tick+i),this.camera.position.z+=this.distance*Math.cos(l),this.camera.lookAt(this.target),this.terrain.updateView(this.target.x,this.target.z,this.distance,this.camera.aspect),this.terrain.wind.value+=n,this.lights.update(this.target,this.distance,this.camera.aspect,n),this.strategy.update(e,this.distance,t,this.canvas.clientHeight,performance.now());const c=this.strategy.soldierOpacity;this.smoke.setDistant(1-c),this.standees.mesh.visible=this.standees.ao.visible=c>.005;const h=this.standees.mesh.material;h.transparent!==c<.995&&(h.transparent=c<.995,h.needsUpdate=!0),h.opacity=c,h.alphaTest=.45*c,this.standees.ao.material.opacity=c,this.standees.mesh.visible&&this.standees.draw(e.units,e.companies,e.tick,i),this.advanceEffects(e,n),this.balls.count=Math.min(e.rounds.length,this.balls.instanceMatrix.count);for(let d=0;d<this.balls.count;d++){const u=Il(e.rounds[d],i),f=Lt(u.x),p=It(u.y);this.balls.setMatrixAt(d,this.matrix.makeTranslation(f,dt(f,p)+u.h,p))}for(const d of this.tracers.resting){if(this.balls.count>=this.balls.instanceMatrix.count)break;this.balls.setMatrixAt(this.balls.count++,this.matrix.makeTranslation(d.p.x,d.p.y,d.p.z))}this.tracers.draw(e.tick,i,this.canvas.clientWidth,this.canvas.clientHeight,this.distance,this.camera),Wn(this.balls.instanceMatrix,this.balls.count),this.renderer.info.reset(),this.post.draw(this.renderer,this.strategy.full?this.strategy.overview:this.scene,this.camera)}}const YM={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',storm:'<path d="M6 16a5 5 0 0 1 .3-10 6 6 0 0 1 11 2 4 4 0 0 1 .7 8h-3m-5-3-2 5h4l-2 4"/>',fog:'<path d="M4 9h13M7 13h13M3 17h12M9 5h8"/>',restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',play:'<path d="m8 4 11 8-11 8Z" fill="currentColor"/>',home:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',time:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',swords:'<path d="m4 3 3 1 11 13-2 2L4 6Zm16 0-3 1-5 6m-3 3-4 4 2 2 4-5M3 16l6 5m6 0 6-5M3 21l3-3m12 0 3 3"/>',pan:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4m-8 12 4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',camera:'<path d="M3 8h4l2-3h6l2 3h4v11H3Z"/><circle cx="12" cy="13" r="3.5"/>',replay:'<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/>'},zn=s=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+YM[s]+"</svg>",Fu='<svg viewBox="0 0 60 56" aria-hidden="true"><defs><g id="sprig"><path d="M28 49C11 46 6 33 8 17" fill="none" stroke="currentColor"/><path d="M13 39Q5 39 3 32Q10 32 13 39M9 31Q2 28 3 22Q9 25 9 31M8 24Q4 18 7 12Q11 18 8 24M10 18Q9 12 14 8Q14 15 10 18M17 44Q9 46 5 41Q11 39 17 44M23 47Q16 52 10 48Q16 44 23 47M11 34Q10 27 15 24Q16 30 11 34M16 41Q13 34 18 31Q20 37 16 41M21 45Q19 39 23 36Q26 41 21 45"/></g></defs><g fill="currentColor"><use href="#sprig"/><use href="#sprig" transform="translate(60 0) scale(-1 1)"/></g><text x="30" y="36" fill="currentColor" text-anchor="middle" font-size="28" font-family="Georgia,serif" font-style="italic">N</text><path fill="currentColor" d="m24 10 2 4h8l2-4-4 2-2-5-2 5Z"/></svg>',Oo=s=>'<i aria-hidden="true" class="flag '+(s?"british":"french")+'"></i>',$M={golden:["sun","黄金斜阳"],storm:["storm","阴云血战"],fog:["fog","晨雾弥漫"]},pa=s=>{const e=Math.floor(s/30);return String(Math.floor(e/60)).padStart(2,"0")+":"+String(e%60).padStart(2,"0")},Ji=s=>s.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Ul=s=>Math.round(Math.min(5,Math.max(1.1,.94/Math.max(.01,s)))*20)/20;function KM(s,e){const t={line:0,guard:0,cav:0,guns:0};for(const n of s.companies)n.faction===e&&n.line!==5&&(n.kind==="field_cannon"?t.guns+=n.alive:n.kind==="cuirassier"?t.cav+=n.alive:n.kind==="guard_grenadier"?t.guard+=n.alive:t.line+=n.alive);return t}class ZM{constructor(e,t){this.cb=t,this.root=e,e.innerHTML=`<header class="mast"><div class="insignia">${Fu}</div><div><h1>Napoléon <span>1815</span></h1><p>千军斗蛐蛐 · 押注观战</p></div></header>
        <section class="strength glass" aria-label="双方兵力"><div class="sides">
        <div class="army">${Oo(0)}<span><b>法兰西帝国</b><small id="gen0"></small></span><strong id="fr">0</strong></div>
        <i class="crossed">${zn("swords")}</i>
        <div class="army east"><strong id="gb">0</strong><span><b>反法同盟</b><small id="gen1"></small></span>${Oo(1)}</div></div>
        <div class="balance" title="仍在作战的兵力"><i id="ratio"></i></div>
        <div class="morale"><span><i id="m0"></i></span><em>士气</em><span class="east"><i id="m1"></i></span></div>
        <div class="odds"><span id="odds0"></span><em>战局天平</em><span id="odds1"></span></div>
        <div class="ledger"><span class="clock">${zn("time")}<time id="clock">00:00</time></span><span id="record"></span></div></section>
        <button id="mobile-settings" class="glass mobile-ctrl" aria-label="战场设置" aria-expanded="false">⚙</button>
        <button id="strength-toggle" class="mobile-ctrl" aria-label="展开兵力详情" aria-expanded="false"></button>
        <div class="zoom-panel glass"><button id="zoom-in" title="放大" aria-label="放大">＋</button><button id="zoom-out" title="缩小" aria-label="缩小">－</button></div>
        <nav class="controls glass" aria-label="战场控制">
        <div class="controlrow"><div class="segments" aria-label="总兵力">${gc.map(r=>`<button data-scale="${r}" title="总兵力 ${r}">${r}</button>`).join("")}</div>
        <button id="light" class="labeled"></button></div>
        <div class="controlrow playback"><button id="pause" class="square" aria-label="暂停"></button><div class="speeds">${[.25,1,2,4,8,16].map(r=>`<button data-speed="${r}">${r}×</button>`).join("")}</div><button id="restart" class="labeled" title="随机新战局 (R)">${zn("restart")}新战局</button></div>
        <div class="controlrow"><button id="next-event" class="labeled">跳至大事 »</button><button id="auto" class="labeled" title="自动导播：镜头跟随冲锋、溃败等关键时刻">${zn("camera")}<span></span></button><span id="purse" class="purse"></span></div></nav>
        <div id="headline" class="headline" hidden></div>
        <button id="major" class="major glass" aria-pressed="false">只看大事</button><div id="labels"></div><ol id="ticker" class="ticker" aria-live="polite"></ol>
        <div class="hint glass">${zn("pan")} 拖拽/WASD 移动 <b>·</b> 滚轮缩放 <b>·</b> 空格暂停 <b>·</b> R 新战局</div>
        <button id="home" class="home glass" title="回到交战中心 (Home)" aria-label="回到交战中心">${zn("home")}</button>
        <div id="intel" class="overlay" hidden><section class="intel-card glass" role="dialog" aria-labelledby="intel-title"></section></div>
        <div id="victory" class="overlay" hidden><section class="victory-card glass" role="dialog" aria-labelledby="victor"><div class="victory-mark">${Fu}</div><h2 id="victor"></h2><p id="reason" class="reason"></p>
        <dl><div><dt>交战时长</dt><dd id="duration"></dd></div><div><dt>法军伤亡/溃逃</dt><dd id="loss0"></dd></div><div><dt>联军伤亡/溃逃</dt><dd id="loss1"></dd></div></dl>
        <section id="analysis" class="battle-analysis"></section><p id="mvp" class="mvp"></p><p id="betresult" class="betresult"></p>
        <div class="actions"><button id="again">${zn("restart")}新战局</button><button id="replay" class="ghost">${zn("replay")}重演本局</button></div></section></div>`,this.get("zoom-in").onclick=()=>t.zoom(.68),this.get("zoom-out").onclick=()=>t.zoom(1/.68),this.get("next-event").onclick=t.next;for(const[r,a]of[["mobile-settings","settings-open"],["strength-toggle","strength-open"]]){const o=this.get(r);o.onclick=()=>o.setAttribute("aria-expanded",String(e.classList.toggle(a)))}const n=this.get("ticker");let i=0;n.addEventListener("touchstart",r=>{i=r.touches[0].clientY},{passive:!0}),n.addEventListener("touchend",r=>{const a=r.changedTouches[0].clientY-i;a<-25?e.classList.add("news-open"):a>25&&!n.scrollTop&&e.classList.remove("news-open")},{passive:!0}),e.querySelectorAll("[data-scale]").forEach(r=>r.onclick=()=>t.scale(Number(r.dataset.scale))),e.querySelectorAll("[data-speed]").forEach(r=>r.onclick=()=>t.speed(Number(r.dataset.speed))),this.get("major").onclick=()=>{const r=this.get("major"),a=r.getAttribute("aria-pressed")!=="true";r.setAttribute("aria-pressed",String(a)),this.get("ticker").classList.toggle("major-only",a)};for(const[r,a]of Object.entries({light:t.light,pause:t.pause,restart:t.restart,again:t.restart,replay:t.replay,home:t.home,auto:t.auto}))this.get(r).onclick=a}cb;root;stakeAmount=25;shownNews=0;headlineUntil=0;get(e){return this.root.querySelector("#"+e)}controls(e,t,n,i,r,a,o){this.root.querySelectorAll("[data-scale],[data-speed]").forEach(u=>{u.setAttribute("aria-pressed",String(u.dataset.scale?Number(u.dataset.scale)===e:Number(u.dataset.speed)===i))});const[l,c]=$M[t];this.get("light").innerHTML=zn(l)+c;const h=this.get("pause");h.innerHTML=zn(n?"play":"pause"),h.setAttribute("aria-label",n?"继续":"暂停"),h.title=n?"继续 (Space)":"暂停 (Space)";const d=this.get("auto");d.setAttribute("aria-pressed",String(r)),d.querySelector("span").textContent=r?"自动导播 开":"自动导播 关",this.get("purse").innerHTML=`军饷 <b>${a.points}</b>`+(o?` · 押${o.side?"联军":"法军"} ${o.stake}`:"")}intel(e,t){const n=this.root.querySelector(".intel-card"),i=e.openingOdds,r=[Ul(i),Ul(1-i)],a=l=>{const c=e.generals[l],h=KM(e,l),d=ky[c.trait];return`<div class="side ${l?"east":""}"><h3>${Oo(l)}${bs[l]}</h3>
            <p class="general"><b>${c.title}${c.name}</b><span class="trait">${d.label}</span></p><p class="trait-text">${d.text}</p>
            <ul><li><span>战列步兵</span><b>${h.line}</b></li><li><span>近卫军</span><b>${h.guard}</b></li><li><span>骑兵</span><b>${h.cav}</b></li><li><span>火炮</span><b>${h.guns} 门</b></li></ul>
            <p class="stance">${e.posture[l]==="attack"?"⚔ 主动进攻":"🛡 据守待敌"}</p>
            <button class="bet" data-side="${l}">押${l?"联军":"法军"} <b>×${r[l].toFixed(2)}</b></button></div>`},o=[10,25,50,100].filter(l=>l<=t.points);o.includes(this.stakeAmount)||(this.stakeAmount=o[Math.min(1,o.length-1)]??t.points),n.innerHTML=`<h2 id="intel-title">战前情报</h2>
        <p class="conditions"><span>${xu[e.weather].label}</span>${Ji(xu[e.weather].text)}</p>
        <p class="conditions"><span>地形</span>${Ji(Bv(e.layout,["法军","联军"]))}</p>
        <p class="conditions"><span>变数</span>战场之外或许还有援军在路上……</p>
        <div class="sides-intel">${a(0)}<div class="vs">VS</div>${a(1)}</div>
        <div class="stake"><span>军饷 <b>${t.points}</b>　战绩 ${t.wins} 胜 ${t.losses} 负${t.streak>1?`　连胜 ${t.streak}`:""}</span>
        <span class="chips">下注 ${(o.length?o:[t.points]).map(l=>`<button data-stake="${l}" aria-pressed="${l===this.stakeAmount}">${l}</button>`).join("")}</span></div>
        <button class="watch ghost" data-side="-1">不押注，直接观战</button>`,LM(n,e),n.querySelectorAll("[data-stake]").forEach(l=>l.onclick=()=>{this.stakeAmount=Number(l.dataset.stake),n.querySelectorAll("[data-stake]").forEach(c=>c.setAttribute("aria-pressed",String(c===l)))}),n.querySelectorAll("[data-side]").forEach(l=>l.onclick=()=>this.cb.bet(Number(l.dataset.side),this.stakeAmount)),this.get("intel").hidden=!1,this.get("victory").hidden=!0,this.root.classList.add("intel-open"),this.root.classList.remove("victory-open"),this.shownNews=0,this.get("ticker").innerHTML="",this.get("headline").hidden=!0}hideIntel(){this.get("intel").hidden=!0,this.root.classList.remove("intel-open")}get intelOpen(){return!this.get("intel").hidden}update(e,t){[this.get("fr"),this.get("gb")].forEach((l,c)=>l.textContent=String(e.effective(c)));for(const l of[0,1]){const c=e.generals[l];this.get("gen"+l).textContent=(c.alive?"":"✝ ")+c.title+c.name;const h=e.armyMorale(l),d=this.get("m"+l);d.style.width=Math.max(0,Math.min(100,h))+"%",d.className=h<30?"low":h<45?"mid":""}const i=e.effective(0),r=e.effective(1);this.get("ratio").style.width=100*i/Math.max(1,i+r)+"%";const a=e.odds();this.get("odds0").textContent=Math.round(a*100)+"%",this.get("odds1").textContent=Math.round((1-a)*100)+"%",this.get("clock").textContent=pa(e.winner!==null&&e.endTick>=0?e.endTick:e.tick);const o=e.fled[0]+e.fled[1]+e.routing(0)+e.routing(1);if(this.get("record").textContent=`阵亡 ${e.dead[0]+e.dead[1]}　·　溃逃 ${o}`,e.news.length<this.shownNews&&(this.shownNews=0),e.news.length>this.shownNews){const l=this.get("ticker");for(const c of e.news.slice(this.shownNews)){if(c.weight<1)continue;const h=["左翼","中央","右翼"][Bi(c.y,e.layout)],d=h+c.text.replace(/^.*?(?=拔出马刀|上刺刀|掉转马头|丢下火枪|在.*喝令下重整)/,"").split("，")[0],f=Array.from(l.children).find(p=>p.dataset.key===d&&Number(p.dataset.tick)>=c.tick-150&&p.classList.contains("f"+c.faction))??document.createElement("li");if(f.dataset.key=d,f.dataset.tick=String(c.tick),f.dataset.count=String(Number(f.dataset.count||0)+1),f.className="f"+c.faction+" w"+c.weight,f.innerHTML=`<time>${pa(c.tick)}</time><small class="sector-name">${h}</small>${Ji(c.text)}${Number(f.dataset.count)>1?" ×"+f.dataset.count:""}`,f.tabIndex=0,f.onclick=()=>this.cb.jump(c.x,c.y),f.onkeydown=p=>{p.key==="Enter"&&f.click()},l.prepend(f),c.weight>=3){const p=this.get("headline");p.textContent=c.text,p.className="headline f"+c.faction,p.hidden=!1,this.headlineUntil=t+4200}}for(;l.children.length>32;)l.lastElementChild.remove();this.shownNews=e.news.length}t>this.headlineUntil&&(this.get("headline").hidden=!0)}victory(e,t,n,i){const r=e.winner;this.get("victor").textContent=bs[r]+"胜利",this.get("reason").textContent=e.reason,this.get("duration").textContent=pa(e.endTick),this.get("loss0").textContent=`${e.dead[0]} / ${e.fled[0]+e.routing(0)}`,this.get("loss1").textContent=`${e.dead[1]} / ${e.fled[1]+e.routing(1)}`;let a=null;for(const v of e.companies)v.line!==5&&(!a||v.kills>a.kills)&&(a=v);this.get("mvp").innerHTML=a?`头号战功：<b>${Ji(a.name)}</b>（${a.faction?"联军":"法军"}）歼敌 ${a.kills} 人`:"",this.get("betresult").innerHTML=t?(n>0?`<span class="won">押中了！赢得 ${n} 军饷</span>`:`<span class="lost">押错了，输掉 ${-n} 军饷</span>`)+`　余额 ${i.points}`:"本局未押注";const o=v=>Math.round(v*100)+"%",l=Math.max(1,e.tick),c=v=>v/l*360,h=v=>84-v*80,d=e.timeline.map(v=>c(v.tick)+","+h(v.odds)).join(" "),u=v=>v==="decisive"?"决定性转折":"最大逆转",f=v=>v.causes.map(M=>Ji(M.text)).join(" · ")||"附近无重大战报",p=e.turningPoints.map(v=>`<g><title>${f(v)}</title><path d="M${c(v.tick)} 4v80" stroke="#b69c69"/><circle cx="${c(v.tick)}" cy="${h(v.to)}" r="3" fill="#ffcf77"/></g>`).join(""),y=[...e.companies].filter(v=>v.line!==5).sort((v,M)=>M.kills-v.kills||v.id-M.id),m=y.reduce((v,M)=>M.losses/M.peak>v.losses/v.peak?M:v),g=y.slice(0,3).map(v=>`<tr><td>${v.faction?"联":"法"} · ${Ji(v.name)}</td><td>${v.kills}</td><td>${v.losses}</td><td>${v.routs}/${v.rallies}</td></tr>`).join(""),_=["line_infantry","guard_grenadier","cuirassier","field_cannon"].map((v,M)=>{const S=[0,1].map(b=>{const x=e.units.filter(E=>E.faction===b&&(E.kind===v||M===0&&E.kind==="bannerman"));return x.filter(E=>E.hp<=0&&!E.escaped).length+" / "+x.filter(E=>E.escaped||E.hp>0&&e.companies[E.company].status==="rout").length});return"<tr><td>"+["步兵","近卫","骑兵","炮兵"][M]+"</td><td>"+S.join("</td><td>")+"</td></tr>"}).join("");this.get("analysis").innerHTML=`<h3>法军胜率走势</h3><svg viewBox="0 0 360 90" aria-label="法军胜率随时间变化"><path d="M0 44h360" stroke="#aaa" stroke-dasharray="3 3"/><polyline fill="none" stroke="#84aed6" stroke-width="2" points="${d}"/>${p}</svg>
            ${e.turningPoints.map(v=>`<p><b>${pa(v.tick)} · ${u(v.kind)}</b>　${o(v.from)} → ${o(v.to)}<br>${f(v)}</p>`).join("")}
            <h3>战功榜</h3><table><thead><tr><th>连队</th><th>歼敌</th><th>阵亡</th><th>溃散/重整</th></tr></thead><tbody>${g}</tbody></table>
            <p>伤亡率最高 · ${Ji(m.name)}（${m.losses}/${m.peak}）</p>
            <h3>阵亡 / 溃逃</h3><table><thead><tr><th>兵种</th><th>法军</th><th>联军</th></tr></thead><tbody>${_}</tbody></table>`,IM(this.get("analysis"),e),this.get("victory").hidden=!1,this.root.classList.add("victory-open")}hideVictory(){this.get("victory").hidden=!0,this.root.classList.remove("victory-open")}}const hf="napoleon-1815-purse";function JM(){try{const s=JSON.parse(localStorage.getItem(hf)||"");if(s&&s.points>0)return s}catch{}return{points:100,wins:0,losses:0,streak:0}}const ma=()=>Math.random()*2**32>>>0;async function QM(){const s=new URLSearchParams(location.search),e=new RM(1200,Number(s.get("seed"))||ma()),t=document.querySelector("#battlefield"),n=await Sc.create(t);let i=!0,r=1,a=0,o=0,l=0,c=0,h=0,d=0,u=!1,f=0,p=!0,y=0,m=0,g=e.frontline().x,_=e.frontline().y,v=!1,M=0,S=-1,b=0;const x=[];let E=JM(),w=null;const R=new ZM(document.querySelector("#hud"),{zoom:te=>n.zoomBy(te),next:()=>{R.intelOpen||e.ended||(f=e.news.length,$(16),u=!0)},jump:(te,ye)=>{n.userAt=performance.now(),n.focus(te,ye,95)},scale:Se,light:Z,pause:q,speed:$,restart:()=>P(e.scale,ma()),replay:()=>P(e.scale,e.seed),home:()=>{n.userAt=performance.now(),n.home(e)},auto:()=>{p=!p,U()},bet:H}),I=new Cf(document.querySelector("#hud"),n);n.tracers.installControl();const N=new Sf(n),O=new gf(e,n,t),L=document.createElement("button");L.type="button",L.className="labeled",L.textContent="跳过部署",document.querySelector("#hud nav.controls")?.append(L);let k=!1;L.onclick=()=>{if(!(R.intelOpen||e.tick>=e.deployEnd)){for(;e.tick<e.deployEnd;)e.step();k=!1,a=0,U()}};function U(){L.hidden=R.intelOpen||e.tick>=e.deployEnd,R.controls(e.scale,n.lighting,i,k?4:r,p,E,w)}function P(te,ye){k=!1,u=!1,e.reset(te,ye),n.reset(),n.setLighting(e.weather==="rain"?"storm":e.weather==="fog"?"fog":"golden"),i=!0,o=a=0,v=!1,M=0,S=-1,b=0,x.length=0,document.body.classList.remove("commander-down"),w=null,m=0,y=0;const ue=e.frontline();g=ue.x,_=ue.y,n.focus(ue.x,ue.y,330);const $e=new URL(location.href);$e.searchParams.set("seed",String(ye)),history.replaceState(null,"",$e),R.intel(e,E),U(),R.update(e,performance.now())}function H(te,ye){if(te!==-1&&ye>0&&ye<=E.points){const ue=e.openingOdds;w={side:te,stake:ye,payout:Ul(te?1-ue:ue)}}if(R.hideIntel(),innerWidth<=600&&innerHeight>innerWidth&&!sessionStorage.getItem("1815-orientation")){sessionStorage.setItem("1815-orientation","1");const ue=document.createElement("div");ue.className="orientation-tip glass",ue.textContent="横屏观战效果更佳",document.body.append(ue),setTimeout(()=>ue.remove(),3200)}k=e.tick<e.deployEnd,i=!1,n.focus(g,_,210),U()}function B(){if(v||e.winner===null)return;v=!0;let te=0;if(w){const ye=w.side===e.winner;te=ye?Math.round(w.stake*(w.payout-1)):-w.stake,E.points+=te,E.streak=ye?E.streak+1:0,ye?E.wins++:E.losses++,E.points<=0&&(E={...E,points:100}),localStorage.setItem(hf,JSON.stringify(E))}R.victory(e,w,te,E),U()}function q(){R.intelOpen||(i=!i,U())}function Z(){n.setLighting(fa[(fa.indexOf(n.lighting)+1)%fa.length]),U()}function ae(te){fa.includes(te)&&(n.setLighting(te),U())}function Se(te){gc.includes(te)&&P(te,e.seed)}function $(te){if(k=!1,u=!1,te===0){i=!0,U();return}[.25,1,2,4,8,16].includes(te)&&(r=te,R.intelOpen||(i=!1),U())}window.addEventListener("keydown",te=>{te.repeat||te.ctrlKey||te.metaKey||te.altKey||(te.code==="Space"?(te.preventDefault(),R.intelOpen?H(-1,0):q()):te.code==="KeyR"?P(e.scale,ma()):te.code==="Home"&&(te.preventDefault(),n.userAt=performance.now(),n.home(e)))});function ie(te){for(const ye of e.events)ye.type==="death"&&(g+=(ye.x-g)*.03,_+=(ye.y-_)*.03);for(;m<e.news.length;){const ye=e.news[m++],ue=/全军震动|全线崩溃/.test(ye.text)?6:/近卫军.*(出击|退却)|预备队从/.test(ye.text)?5:/兑现了诺言|终于赶到/.test(ye.text)?4:/全面崩溃/.test(ye.text)?3:/马刀|撞进|七零八落/.test(ye.text)?2:/上刺刀/.test(ye.text)?1:0;ue&&x.push({n:ye,p:ue})}for(let ye=x.length-1;ye>=0;ye--)x[ye].n.tick<e.tick-300&&x.splice(ye,1);if(!(O.selected>=0||!p||i||te-n.userAt<8e3)){if(x.sort((ye,ue)=>ue.p-ye.p||ye.n.tick-ue.n.tick),x.length&&(te>=y||x[0].p>M)){const{n:ye,p:ue}=x.shift();M=ue,S=-1,y=te+(ue===2?4e3:3500),/全军震动/.test(ye.text)&&(b=te+1200,document.body.classList.add("commander-down")),ue===2&&(S=e.companies.find($e=>ye.text.startsWith($e.name))?.id??-1),n.focus(ye.x,ye.y,ue===6?70:ue===3?160:ue===2?110:125);return}if(te<y&&S>=0){const ye=e.companies[S];n.focus(ye.x,ye.y);return}te>=y&&(S=-1,M=0),te>y&&(y=te+1200,n.focus(g,_,Math.max(170,Math.min(260,n.zoom))))}}Object.assign(window,{__arenaDebug:{atlas:()=>zy().toDataURL(),getState:()=>({tick:e.tick,jitter:e.jitter,camera:n.cameraInfo,fps:Math.round(l),drawCalls:n.drawCalls,tracers:n.tracers.stats,chargeDrums:N.drums,following:O.selected,alive:[...e.alive],dead:[...e.dead],fled:[...e.fled],winner:e.winner,ended:e.ended,seed:e.seed,weather:e.weather,scale:e.scale,lighting:n.lighting,activeSmoke:n.smoke.count,odds:e.odds(),morale:[e.armyMorale(0),e.armyMorale(1)],news:e.news.length,...n.gore.stats}),setScale:Se,setLighting:ae,setSpeed:$,restart:()=>P(e.scale,ma()),replay:te=>P(e.scale,te),startBattle:()=>H(-1,0),world:e,stepFrames:te=>{if(!(!i||!Number.isFinite(te))){for(let ye=0;ye<Math.min(15e3,te)&&!e.ended;ye++)e.step(),n.events(e),n.advanceEffects(e,1/gu);e.ended&&B(),R.update(e,performance.now())}},panTo:(te,ye)=>{n.userAt=performance.now(),n.panTo(te,ye)},zoomTo:te=>{n.userAt=performance.now(),n.zoomTo(te)}}}),P(n.mobileMode?600:1200,e.seed),document.getElementById("notice").hidden=!0;let we=performance.now();function fe(te){const ye=Math.max(0,(te-we)/1e3);we=te;const ue=Math.min(.2,ye);let $e=i?0:ue*(k?4:r);if(e.winner!==null&&!e.ended&&!i&&(o+=ye,o<1.8&&($e=ue*.3)),te<b&&!i?$e=ue*.3:document.body.classList.remove("commander-down"),!e.ended){a+=$e*gu;let et=0;for(;a>=1&&!e.ended&&et<96;){if(e.step(),n.events(e),N.step(e),ie(te),a--,et++,e.tick===e.deployEnd){k=!1,a=0,U();break}if(u&&e.news.length>f){const Ge=e.news.slice(f).find(He=>He.weight>=2);if(f=e.news.length,Ge){$(1),n.focus(Ge.x,Ge.y,110),a=0;break}}}e.ended&&(a=0)}if(e.ended&&B(),O.tick(te),ie(te),N.update(ue,i||e.ended),n.render(e,ue,e.ended?ue:$e,a),h+=ye,c++,h>=.5&&(l=c/h,n.observeFps(l),h=c=0),d+=ye,d>.15){R.update(e,te),I.update(e),d=0;const et=document.getElementById("labels");if(et.replaceChildren(),n.zoom<90&&!e.ended&&!R.intelOpen){const Ge=e.companies.filter(He=>He.alive&&He.status!=="gone").map(He=>({c:He,p:n.screen(He.x,He.y)})).filter(({p:He})=>Math.abs(He.x)<.97&&Math.abs(He.y)<.92&&Math.abs(He.z)<1&&He.y<.62).sort((He,lt)=>He.p.x*He.p.x+He.p.y*He.p.y-lt.p.x*lt.p.x-lt.p.y*lt.p.y).slice(0,12);for(const{c:He,p:lt}of Ge){const wt=document.createElement("span");wt.textContent=(He.status==="rout"?"↩ ":He.formation==="square"?"□ ":He.order==="charge"?"⚔ ":"")+He.name,wt.style.left=(lt.x+1)*50+"%",wt.style.top=(1-lt.y)*50+"%",wt.style.setProperty("--morale",He.morale+"%"),et.append(wt)}}}requestAnimationFrame(fe)}document.addEventListener("visibilitychange",()=>{we=performance.now()}),requestAnimationFrame(fe)}QM().catch(s=>{console.error(s);const e=document.getElementById("notice");e.hidden=!1,e.textContent="战场加载失败 · "+(s instanceof Error?s.message:String(s))});
