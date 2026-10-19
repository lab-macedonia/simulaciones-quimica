window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};
/* Enlaces σ y π — motor 3D sin dependencias externas.
   Reescrito: orbitales p como lóbulos reales, solapamiento σ frontal y π lateral,
   y demostración de rotación que rompe el enlace π. */

const BOND_DATA = {
  single: {
    name:"Single bond", formula:"Ethane · C₂H₆", sigma:1, pi:0, hybrid:"sp³",
    geometry:"tetrahedral", angle:"109,5°", sigmaOrigin:"sp³–sp³", pOrbitals:"0 per C",
    rotation:"relatively free",
    caption:"The σ bond forms by head-on overlap of sp³ hybrid orbitals.",
    explanation:"Each carbon is sp³ hybridized. The C–C bond corresponds to a σ bond produced by head-on overlap of sp³ hybrid orbitals. The geometry around each carbon is approximately tetrahedral, with ideal angles close to 109.5°. Since there is no π bond between the carbons, rotation about the C–C axis is relatively free."
  },
  double: {
    name:"Double bond", formula:"Ethene · C₂H₄", sigma:1, pi:1, hybrid:"sp²",
    geometry:"trigonal planar", angle:"120°", sigmaOrigin:"sp²–sp²", pOrbitals:"1 per C",
    rotation:"restricted",
    caption:"The double bond contains 1 σ and 1 π.",
    explanation:"Each carbon is sp² hybridized and keeps one unhybridized p orbital. The C=C bond contains one σ bond from head-on overlap of sp² orbitals and one π bond from side-by-side overlap of the p orbitals. The geometry is trigonal planar with ideal angles close to 120°. Rotation is restricted because it would destroy the side-by-side overlap needed to maintain the π bond."
  },
  triple: {
    name:"Triple bond", formula:"Ethyne · C₂H₂", sigma:1, pi:2, hybrid:"sp",
    geometry:"linear", angle:"180°", sigmaOrigin:"sp–sp", pOrbitals:"2 per C",
    rotation:"not equivalent to a single bond",
    caption:"The triple bond contains 1 σ and 2 π in perpendicular planes.",
    explanation:"Each carbon is sp hybridized and keeps two unhybridized p orbitals. The C≡C bond contains one σ bond from head-on overlap of sp orbitals and two π bonds formed by two mutually perpendicular pairs of p orbitals. The arrangement around each carbon is linear and the ideal angle is 180°."
  },
  benzene: {
    name:"Aromatic ring", formula:"Benzene · C₆H₆", sigma:"12 (6 C–C + 6 C–H)", pi:"6 delocalized e⁻",
    hybrid:"sp²", geometry:"planar hexagonal", angle:"120°", sigmaOrigin:"sp²–sp² (ring) and sp²–1s (C–H)",
    pOrbitals:"1 per C (6 in total)",
    rotation:"not applicable: it is a rigid ring, not a single bond free to rotate",
    caption:"The 6 p orbitals form a single delocalized π system above and below the ring.",
    explanation:"Each of the 6 carbons is sp² hybridized and keeps a p orbital perpendicular to the plane of the ring. Instead of forming three localized π bonds (as a Kekulé structure with alternating bonds would suggest), the 6 p orbitals overlap side by side continuously, generating a delocalized π system with 6 electrons spread over the whole ring. That is why the six C–C bond lengths are identical (≈139 pm), a value intermediate between a C–C single bond (≈154 pm) and a C=C double bond (≈134 pm). This delocalization gives benzene extra stability —the resonance energy, about 36 kcal/mol (≈150 kJ/mol)— above that of a hypothetical cyclohexatriene with alternating bonds."
  }
};

const QUIZ = [
  {q:"How many σ and π bonds are there between the carbons of a C=C double bond?",
   options:["2 σ y 0 π","1 σ y 1 π","0 σ y 2 π","2 σ y 1 π"], answer:1,
   fb:"Every multiple bond has exactly one σ; the rest are π. In C=C: 1 σ + 1 π."},
  {q:"What hybridization does each carbon have in ethene, C₂H₄?",
   options:["sp³","sp²","sp","p"], answer:1,
   fb:"The carbon with a double bond uses 3 hybrid orbitals (sp²) and leaves 1 p orbital for the π."},
  {q:"What is the ideal angle associated with a linear geometry?",
   options:["90°","109,5°","120°","180°"], answer:3,
   fb:"Linear geometry (sp hybridization, as in ethyne) has an ideal angle of 180°."},
  {q:"What type of overlap produces a π bond?",
   options:["Front","Side","Nuclear","Ionic"], answer:1,
   fb:"The π arises from side-by-side overlap of parallel p orbitals; head-on overlap produces the σ."},
  {q:"An sp carbon has, unhybridized:",
   options:["0 p orbitals","1 p orbital","2 p orbitals","3 p orbitals"], answer:2,
   fb:"sp combines 1 s + 1 p, leaving 2 free p orbitals that form the two π bonds of the triple bond."},
  {q:"Why are the six C–C bond lengths in benzene identical?",
   options:["Because there are no π bonds","Because the 6 π electrons are delocalized over the whole ring, not in fixed double bonds","Because benzene is not planar","Because each carbon is sp³"], answer:1,
   fb:"Delocalization of the π system over the 6 carbons averages the bond order, giving a uniform C–C length (~139 pm), intermediate between a single and a double bond."},
  {q:"How many electrons take part in the delocalized π system of benzene?",
   options:["2","4","6","12"], answer:2,
   fb:"Each of the 6 sp² carbons contributes 1 electron from its unhybridized p orbital: 6 π electrons in total, delocalized over the whole ring."},
  {q:"Among C–C, C=C and C≡C, which is the shortest bond?",
   options:["C–C","C=C","C≡C","all three are the same length"], answer:2,
   fb:"The higher the bond order, the greater the attraction between the carbons and the shorter the length: C≡C (~120 pm) < C=C (~134 pm) < C–C (~154 pm)."},
  {q:"Why do cis and trans isomers of 2-butene exist but not of butane?",
   options:["because butane has no carbons","because free rotation about the single bond interconverts the forms of butane","because 2-butene is a gas","because butane is aromatic"], answer:1,
   fb:"In butane the C–C bond rotates freely and the conformations interconvert. In 2-butene the π bond prevents rotation and fixes the substituents as cis or trans."},
  {q:"The resonance energy of benzene (~150 kJ/mol) represents:",
   options:["the energy of a σ bond","the extra stability relative to a hypothetical cyclohexatriene with alternating bonds","the energy to break the ring","the heat of combustion"], answer:1,
   fb:"It is the difference between the real energy of benzene (delocalized) and that calculated for a structure with three localized double bonds: delocalization stabilizes."}
];

/* ---------- Utilidades de color ---------- */
const {mix,lighten,darken}=window.LabUtils;

/* ---------- Cámara / 3D ---------- */
let yaw=0.55, pitch=0.32, drag=false, last=[0,0];
let twist=0;                 // giro de un carbono en torno al eje C–C (rad)
let animating=false;
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rot(p){
  const [x,y,z]=p, cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  const x1=x*cy - z*sy, z1=x*sy + z*cy;
  return [x1, y*cp - z1*sp, y*sp + z1*cp];
}
function rotX(p,a){const [x,y,z]=p,c=Math.cos(a),s=Math.sin(a);return [x, y*c - z*s, y*s + z*c];}
const CAM=7, FOC=5;
function project(p,W,H){
  const r=rot(p);
  const s=FOC/(CAM - r[2]);
  return [W/2 + r[0]*s*105, H/2 - r[1]*s*105, r[2], s];
}
function norm(p){const L=Math.hypot(p[0],p[1],p[2])||1;return [p[0]/L,p[1]/L,p[2]/L];}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function scale(a,s){return [a[0]*s,a[1]*s,a[2]*s];}

/* ---------- Modelo geométrico ---------- */
const D=1.15;                 // media distancia C–C
const A=[-D,0,0], B=[D,0,0];  // carbonos
const RBEN=1.35;              // radio del anillo aromático (benceno)
const RING=[0,1,2,3,4,5].map(i=>-Math.PI/2+i*Math.PI/3);

function subDirs(type){
  // direcciones (unitarias) de los sustituyentes H de cada carbono, sin la dirección C–C
  const t=109.47*Math.PI/180, ct=Math.cos(t), st=Math.sin(t); // -1/3, 0.9428
  if(type==="single"){
    const a=[], b=[];
    for(let k=0;k<3;k++){
      const ang=(90+k*120)*Math.PI/180;
      a.push(norm([ct, st*Math.cos(ang), st*Math.sin(ang)]));          // componente -x
      const angB=(150+k*120)*Math.PI/180;                              // escalonado
      b.push(norm([-ct, st*Math.cos(angB), st*Math.sin(angB)]));       // componente +x
    }
    return {a,b, porbsA:[], porbsB:[]};
  }
  if(type==="double"){
    const a=[norm([-0.5,0.866,0]), norm([-0.5,-0.866,0])];
    const b=[norm([0.5,0.866,0]),  norm([0.5,-0.866,0])];
    return {a,b, porbsA:[[0,0,1]], porbsB:[[0,0,1]]};                    // p perpendicular al plano
  }
  // triple
  const a=[norm([-1,0,0])], b=[norm([1,0,0])];
  return {a,b, porbsA:[[0,1,0],[0,0,1]], porbsB:[[0,1,0],[0,0,1]]};
}

/* ---------- Primitivas de dibujo ---------- */
function paintBg(ctx,W,H){
  const panel=(getComputedStyle(document.body).getPropertyValue("--panel-2")||"#eef2f6").trim()||"#eef2f6";
  const g=ctx.createRadialGradient(W*0.4,H*0.32,20,W*0.5,H*0.5,Math.max(W,H)*0.7);
  g.addColorStop(0,lighten(panel,0.08)); g.addColorStop(1,darken(panel,0.05));
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function sphere(ctx,x,y,r,color,depth){
  const fog=(1-(depth+1)/2)*0.28, base=mix(color,"#5b6572",fog);
  const g=ctx.createRadialGradient(x-r*0.38,y-r*0.42,r*0.08,x,y,r);
  g.addColorStop(0,lighten(base,0.55)); g.addColorStop(0.45,base); g.addColorStop(1,darken(base,0.42));
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
  ctx.lineWidth=1; ctx.strokeStyle=darken(base,0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(x-r*0.34,y-r*0.38,r*0.16,0,Math.PI*2); ctx.fillStyle="rgba(255,255,255,0.55)"; ctx.fill();
}
function bond3d(ctx,p1,p2,W,H,wBase){
  const a=project(p1,W,H), b=project(p2,W,H);
  const w=Math.max(2.5, wBase*((a[3]+b[3])/2));
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
  const g=ctx.createLinearGradient(a[0]+nx*w,a[1]+ny*w,a[0]-nx*w,a[1]-ny*w);
  g.addColorStop(0,"#8b95a1"); g.addColorStop(0.5,"#cfd6dd"); g.addColorStop(1,"#6b7580");
  ctx.beginPath();
  ctx.moveTo(a[0]+nx*w,a[1]+ny*w); ctx.lineTo(b[0]+nx*w,b[1]+ny*w);
  ctx.lineTo(b[0]-nx*w,b[1]-ny*w); ctx.lineTo(a[0]-nx*w,a[1]-ny*w); ctx.closePath();
  ctx.fillStyle=g; ctx.fill();
}
/* lóbulo p: elipse con degradado, orientada según la proyección del eje */
function lobe(ctx,center,dir,len,W,H,positive,alpha){
  const tip=add(center,scale(dir,len));
  const c=project(center,W,H), t=project(tip,W,H);
  const ang=Math.atan2(t[1]-c[1], t[0]-c[0]);
  const L=Math.hypot(t[0]-c[0], t[1]-c[1]);
  const rl=Math.max(10, L*0.6), rw=Math.max(7, L*0.32);
  const mx=(c[0]+t[0])/2, my=(c[1]+t[1])/2;
  ctx.save(); ctx.translate(mx,my); ctx.rotate(ang);
  const col= positive ? "#d1463f" : "#2f6bd6";
  const g=ctx.createRadialGradient(rl*0.35,0,2,0,0,rl);
  g.addColorStop(0, positive?`rgba(232,110,90,${alpha})`:`rgba(80,130,225,${alpha})`);
  g.addColorStop(1, positive?`rgba(180,50,45,${alpha*0.15})`:`rgba(40,80,180,${alpha*0.15})`);
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,0,rl,rw,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function porbital(ctx,center,axis,len,W,H,alpha){
  // dumbbell: lóbulo + y lóbulo −
  lobe(ctx,center,axis,len,W,H,true,alpha);
  lobe(ctx,center,scale(axis,-1),len,W,H,false,alpha);
}
/* nube π anular (benceno): polígono translúcido a una altura y dada, encima o debajo del anillo */
function ringCloud(ctx,y,W,H,alpha){
  const pts=RING.map(t=>project([RBEN*Math.cos(t), y, RBEN*Math.sin(t)],W,H));
  ctx.beginPath();
  pts.forEach((pp,i)=> i===0?ctx.moveTo(pp[0],pp[1]):ctx.lineTo(pp[0],pp[1]));
  ctx.closePath();
  const g=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,220);
  g.addColorStop(0,`rgba(150,110,210,${0.40*alpha})`);
  g.addColorStop(1,`rgba(120,90,190,${0.08*alpha})`);
  ctx.fillStyle=g; ctx.fill();
}
/* ---------- Escena del benceno: anillo hexagonal con sistema π deslocalizado ---------- */
function renderBenzene(ctx,W,H,showOrb,showLab){
  const Cs=RING.map(t=>[RBEN*Math.cos(t),0,RBEN*Math.sin(t)]);
  const Hs=Cs.map(c=>{const L=Math.hypot(c[0],c[2])||1; return [c[0]+(c[0]/L)*0.95,0,c[2]+(c[2]/L)*0.95];});
  const items=[];
  for(let i=0;i<6;i++){ items.push({t:"c",a:Cs[i],b:Cs[(i+1)%6],r:0.066,color:"#aab4bf"});
    items.push({t:"c",a:Cs[i],b:Hs[i],r:0.042,color:"#aab4bf"}); }
  if(showOrb){
    Cs.forEach(c=>{ items.push(lobeItem(c,[0,1,0],0.85,true,0.62)); items.push(lobeItem(c,[0,-1,0],0.85,false,0.62)); });
    [0.62,-0.62].forEach(y=>items.push({t:"e",c:[0,y,0],dir:[0,1,0],len:0.05,wid:RBEN*0.92,color:"#9a6ee0",opacity:0.22,shin:10}));
  }
  Cs.forEach(c=>items.push({t:"s",p:c,r:0.25,color:P.carbon}));
  Hs.forEach(h=>items.push({t:"s",p:h,r:0.133,color:P.nearWhite}));
  const useGL=gl3d(ctx,W,H,items);
  if(useGL){
    const lab=(q,rad,t,col)=>{const pr=project(q,W,H); const r=rad*105*pr[3];
      ctx.fillStyle=col; ctx.font=`bold ${Math.max(9,r*0.62)}px Inter,sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t,pr[0],pr[1]);};
    Cs.forEach(c=>lab(c,0.25,"C",P.labelLight)); Hs.forEach(h=>lab(h,0.133,"H","#2a3440"));
  }
  const prims=[];
  if(!useGL){
  prims.push({z:-2.0, draw:()=>ringCloud(ctx,-0.55,W,H,1)});
  prims.push({z:-1.9, draw:()=>ringCloud(ctx, 0.55,W,H,1)});
  for(let i=0;i<6;i++){
    const c1=Cs[i], c2=Cs[(i+1)%6], zc=(rot(c1)[2]+rot(c2)[2])/2;
    prims.push({z:zc, draw:()=>bond3d(ctx,c1,c2,W,H,7)});
  }
  Cs.forEach((c,i)=>{
    const h=Hs[i], zc=(rot(c)[2]+rot(h)[2])/2;
    prims.push({z:zc, draw:()=>bond3d(ctx,c,h,W,H,4.5)});
  });
  if(showOrb){
    Cs.forEach(c=>{
      const zc=rot(c)[2]-0.01;
      prims.push({z:zc, draw:()=>porbital(ctx,c,[0,1,0],0.85,W,H,0.85)});
    });
  }
  Cs.forEach(c=>{
    prims.push({z:rot(c)[2]+0.5, draw:()=>{
      const pr=project(c,W,H); const r=26*pr[3];
      sphere(ctx,pr[0],pr[1],r,P.carbon,pr[2]);
      ctx.fillStyle=P.labelLight; ctx.font=`bold ${r*0.62}px Inter,sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("C",pr[0],pr[1]);
    }});
  });
  Hs.forEach(h=>{
    prims.push({z:rot(h)[2]+0.5, draw:()=>{
      const pr=project(h,W,H); const r=14*pr[3];
      sphere(ctx,pr[0],pr[1],r,P.nearWhite,pr[2]);
      ctx.fillStyle="#2a3440"; ctx.font=`bold ${Math.max(9,r*0.7)}px Inter,sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("H",pr[0],pr[1]);
    }});
  });
  }
  if(!useGL) prims.sort((pa,pb)=>pa.z-pb.z).forEach(pp=>pp.draw());
  if(showLab){
    ctx.font="bold 16px Inter,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=P.purple; ctx.fillText("delocalized π (6 e⁻ above and below the ring)", W/2, 22);
    ctx.fillStyle=P.success; ctx.font="bold 14px Inter,sans-serif";
    ctx.fillText("σ (hexagonal ring)", W/2, H-14);
  }
  ctx.textBaseline="alphabetic";
}
/* nube π: banda translúcida entre los dos carbonos a lo largo del eje del orbital */
function piCloud(ctx,axis,side,W,H,strength){
  if(strength<=0.02) return;
  const off=scale(norm(axis), 0.62*side);
  const pA=add(A,off), pB=add(B,off);
  const a=project(pA,W,H), b=project(pB,W,H);
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
  const w=26*((a[3]+b[3])/2)*strength;
  const g=ctx.createLinearGradient(a[0]+nx*w,a[1]+ny*w,a[0]-nx*w,a[1]-ny*w);
  g.addColorStop(0,`rgba(120,90,190,0)`); g.addColorStop(0.5,`rgba(150,110,210,${0.5*strength})`); g.addColorStop(1,`rgba(120,90,190,0)`);
  ctx.beginPath();
  ctx.moveTo(a[0]+nx*w,a[1]+ny*w); ctx.lineTo(b[0]+nx*w,b[1]+ny*w);
  ctx.lineTo(b[0]-nx*w,b[1]-ny*w); ctx.lineTo(a[0]-nx*w,a[1]-ny*w); ctx.closePath();
  ctx.fillStyle=g; ctx.fill();
}


/* ---------- Capa 3D (Three.js vía Mol3D): copia el render WebGL al canvas 2D ---------- */
function gl3d(ctx,W,H,items){
  if(!(window.Mol3D && Mol3D.available())) return false;
  const gl=Mol3D.render(W,H,{yaw,pitch,world:1,camd:CAM,focpx:FOC*105},items);
  if(!gl) return false;
  ctx.drawImage(gl,0,0,W,H); return true;
}
function lobeItem(center,dir,len,positive,op){
  const d=norm(dir);
  return {t:"e", c:add(center,scale(d,len*0.5)), dir:d, len:len*0.6, wid:len*0.32,
          color:positive?"#d9534a":"#3a74dc", opacity:op, shin:30};
}
/* ---------- Render ---------- */
function currentType(){ return document.getElementById("bondSelect").value; }

function contactShadow(ctx,W,H,w){
  const y=H*0.82;
  const g=ctx.createRadialGradient(W/2,y,4,W/2,y,w);
  g.addColorStop(0,"rgba(30,40,55,0.14)"); g.addColorStop(1,"rgba(30,40,55,0)");
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(W/2,y,w,Math.max(9,w*0.14),0,0,Math.PI*2); ctx.fill();
}
function render(){
  const canvas=document.getElementById("bondCanvas");
  const ctx=canvas.getContext("2d"), W=canvas.width, H=canvas.height;
  paintBg(ctx,W,H);

  const type=currentType();
  const showOrb = document.getElementById("orbitalToggle").checked;
  const showLab = document.getElementById("labelsToggle").checked;

  if(type==="benzene"){
    contactShadow(ctx,W,H,240);
    renderBenzene(ctx,W,H,showOrb,showLab);
    const ro=document.getElementById("twistReadout");
    if(ro){ ro.textContent="Aromatic ring: the 6 π electrons are delocalized in a continuous system above and below the plane. There is no localized π bond to 'break' with a twist; use drag/arrows to view it from different angles."; ro.className="muted"; }
    drawEnergyBar(type, 1, twist);
    drawCisTransNote(type);
    return;
  }

  const dirs=subDirs(type);
  contactShadow(ctx,W,H,260);

  // sustituyentes: carbono B recibe el giro "twist" en torno al eje x
  const Hpos=[];
  dirs.a.forEach(d=> Hpos.push({c:A, p:add(A,scale(d,1.0)), depthOnly:false}));
  dirs.b.forEach(d=> Hpos.push({c:B, p:add(B,scale(rotX(d,twist),1.0)), depthOnly:false}));

  const align=Math.abs(Math.cos(twist));   // 1 alineado → 0 perpendicular

  // 3D real (Three.js); piCloud queda como banda 2D detrás
  const items=[{t:"c",a:A,b:B,r:0.066,color:"#aab4bf"}];
  Hpos.forEach(h=>{ items.push({t:"c",a:h.c,b:h.p,r:0.042,color:"#aab4bf"}); items.push({t:"s",p:h.p,r:0.143,color:P.nearWhite}); });
  items.push({t:"s",p:A,r:0.286,color:P.carbon},{t:"s",p:B,r:0.286,color:P.carbon});
  if(showOrb && type!=="single"){
    dirs.porbsA.forEach((ax,idx)=>{
      const axB=rotX(dirs.porbsB[idx],twist);
      items.push(lobeItem(A,ax,0.95,true,0.68),lobeItem(A,scale(ax,-1),0.95,false,0.68));
      items.push(lobeItem(B,axB,0.95,true,0.68),lobeItem(B,scale(axB,-1),0.95,false,0.68));
    });
    dirs.porbsA.forEach(ax=>{ piCloud(ctx,ax,1,W,H,align); piCloud(ctx,ax,-1,W,H,align); });
  }
  const useGL=gl3d(ctx,W,H,items);
  const prims=[];
  if(useGL){
    const lab=(q,rad,t,col)=>{const pr=project(q,W,H); const r=rad*105*pr[3];
      ctx.fillStyle=col; ctx.font=`bold ${Math.max(9,r*0.62)}px Inter,sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t,pr[0],pr[1]);};
    lab(A,0.286,"C",P.labelLight); lab(B,0.286,"C",P.labelLight); Hpos.forEach(h=>lab(h.p,0.143,"H","#2a3440"));
  } else {

  // enlace C–C (una sola línea σ)
  prims.push({z:0, draw:()=>bond3d(ctx,A,B,W,H,7)});
  // enlaces C–H
  Hpos.forEach(h=>{
    const zc=(rot(h.c)[2]+rot(h.p)[2])/2;
    prims.push({z:zc, draw:()=>bond3d(ctx,h.c,h.p,W,H,4.5)});
  });

  // orbitales p y nubes π
  if(showOrb && type!=="single"){
    dirs.porbsA.forEach((ax,idx)=>{
      const axB = rotX(dirs.porbsB[idx], twist);
      const zA=rot(add(A,scale(norm(ax),0.6)))[2];
      const zB=rot(add(B,scale(norm(axB),0.6)))[2];
      // nube π (detrás de los lóbulos frontales)
      prims.push({z:-0.9, draw:()=>{ piCloud(ctx,ax,1,W,H,align); piCloud(ctx,ax,-1,W,H,align); }});
      prims.push({z:zA-0.01, draw:()=>porbital(ctx,A,norm(ax),0.95,W,H,0.9)});
      prims.push({z:zB-0.01, draw:()=>porbital(ctx,B,norm(axB),0.95,W,H,0.9)});
    });
  }

  // átomos
  [{p:A,sym:"C"},{p:B,sym:"C"}].forEach(a=>{
    prims.push({z:rot(a.p)[2]+0.5, draw:()=>{
      const pr=project(a.p,W,H); const r=30*pr[3];
      sphere(ctx,pr[0],pr[1],r,P.carbon,pr[2]);
      ctx.fillStyle=P.labelLight; ctx.font=`bold ${r*0.62}px Inter,sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("C",pr[0],pr[1]);
    }});
  });
  Hpos.forEach(h=>{
    prims.push({z:rot(h.p)[2]+0.5, draw:()=>{
      const pr=project(h.p,W,H); const r=15*pr[3];
      sphere(ctx,pr[0],pr[1],r,P.nearWhite,pr[2]);
      ctx.fillStyle="#2a3440"; ctx.font=`bold ${Math.max(9,r*0.7)}px Inter,sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("H",pr[0],pr[1]);
    }});
  });

  prims.sort((a,b)=>a.z-b.z).forEach(p=>p.draw());
  }

  // etiquetas σ / π
  if(showLab){
    const mid=project([0,0,0],W,H);
    ctx.font="bold 20px Inter,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=P.success; ctx.fillText("σ", mid[0], mid[1]+34);
    if(type!=="single"){
      ctx.fillStyle=P.purple;
      const top=project([0,0,1.1],W,H); ctx.fillText("π", top[0], top[1]);
      if(type==="triple"){ const side=project([0,1.1,0],W,H); ctx.fillText("π", side[0]+18, side[1]); }
    }
  }
  ctx.textBaseline="alphabetic";

  // lectura del giro
  const ro=document.getElementById("twistReadout");
  if(ro){
    const deg=Math.round(twist*180/Math.PI)%360;
    if(type==="single"){
      ro.textContent = `C–C twist: ${deg}°. With no π bond, rotation has no appreciable cost.`;
      ro.className="muted";
    }else{
      const pct=Math.round(align*100);
      ro.textContent = `C–C twist: ${deg}° · π overlap ≈ ${pct}%.` + (align<0.25 ? "  ⚠ The π bond is practically broken." : "");
      ro.className = align<0.25 ? "feedback bad" : "muted";
    }
  }
  drawEnergyBar(type, align, twist);
  drawCisTransNote(type);
}

/* ---------- Barra cualitativa de energía del enlace π vs. ángulo de giro ---------- */
function drawEnergyBar(type, align, tw){
  const c=document.getElementById("energyBar"); if(!c) return;
  const ectx=c.getContext("2d"), W=c.width, H=c.height;
  ectx.clearRect(0,0,W,H);
  const panel=(getComputedStyle(document.body).getPropertyValue("--panel-2")||"#eef2f6").trim()||"#eef2f6";
  ectx.fillStyle=panel; ectx.fillRect(0,0,W,H);
  const mL=8, mR=8, top=10, bot=H-16;
  if(type==="single"){
    ectx.fillStyle=P.muted; ectx.font="11px Inter,sans-serif"; ectx.textAlign="left";
    ectx.fillText("No π bond: there is no rotation barrier to plot.", mL, H/2+4);
    return;
  }
  if(type==="benzene"){
    ectx.fillStyle=P.muted; ectx.font="11px Inter,sans-serif"; ectx.textAlign="left";
    ectx.fillText("There is no single π bond to break by rotation: the stability of the ring comes from delocalization.", mL, H/2-6);
    ectx.fillStyle=P.purple; ectx.font="bold 12px Inter,sans-serif";
    ectx.fillText("Resonance energy ≈ 36 kcal/mol (≈150 kJ/mol) over a hypothetical cyclohexatriene.", mL, H/2+12);
    return;
  }
  // curva cualitativa: energía relativa del enlace π ∝ cos²(ángulo relativo)
  ectx.strokeStyle=P.purpleLight; ectx.lineWidth=2; ectx.beginPath();
  for(let deg=0; deg<=180; deg++){
    const rad=deg*Math.PI/180, e=Math.pow(Math.cos(rad),2);
    const x=mL+(deg/180)*(W-mL-mR), y=bot-e*(bot-top);
    if(deg===0) ectx.moveTo(x,y); else ectx.lineTo(x,y);
  }
  ectx.stroke();
  // marcador de posición actual
  const curDeg=Math.abs(Math.round(tw*180/Math.PI))%180;
  const cx=mL+(curDeg/180)*(W-mL-mR);
  ectx.fillStyle = align<0.25 ? P.danger : P.accent;
  ectx.beginPath(); ectx.arc(cx, bot-Math.pow(Math.cos(tw),2)*(bot-top), 5, 0, Math.PI*2); ectx.fill();
  ectx.fillStyle=P.muted; ectx.font="11px Inter,sans-serif"; ectx.textAlign="left";
  ectx.fillText("0° (π intact)", mL, H-3);
  ectx.textAlign="right";
  ectx.fillText("90° (π broken)", W-mR, H-3);
  ectx.textAlign="left";
  ectx.fillText("Qualitative model (∝ cos²θ), not DFT energy values.", mL, top+9);
}

/* ---------- Nota de isomería cis/trans ligada a la rotación restringida ---------- */
function drawCisTransNote(type){
  const el=document.getElementById("cisTransNote"); if(!el) return;
  if(type==="benzene"){
    el.textContent="The ring is planar and the 6 C–C bonds are equivalent, so benzene itself shows no cis/trans isomerism. In substituted derivatives a different type of isomerism does appear: the relative position of the substituents on the ring (ortho, meta, para).";
    return;
  }
  if(type==="double"){
    el.textContent="Since the π bond prevents free rotation, a C=C with different substituents on each carbon can exist as geometric isomers (cis/trans or E/Z) that do not interconvert at room temperature.";
  } else if(type==="single"){
    el.textContent="With no π bond, rotation about a single bond is free: C–C single bonds do not generate cis/trans isomerism.";
  } else {
    el.textContent="With two perpendicular π bonds, the linear geometry of the triple bond leaves no substituents in relative positions that could generate cis/trans isomerism.";
  }
}

/* ---------- Estadísticas ---------- */
/* ---------- Diagrama esquemático: mezcla de orbitales puros s + p → orbitales híbridos ---------- */
function drawHybridDiagram(type){
  const c=document.getElementById("hybridDiagram"); if(!c) return;
  const ctx=c.getContext("2d"), W=c.width, H=c.height;
  const panel=(getComputedStyle(document.body).getPropertyValue("--panel-2")||"#eef2f6").trim()||"#eef2f6";
  ctx.clearRect(0,0,W,H); ctx.fillStyle=panel; ctx.fillRect(0,0,W,H);
  const cfg={
    single:{n:3,label:"sp³",desc:"1 s orbital + 3 p orbitals  →  4 equivalent sp³ hybrid orbitals"},
    double:{n:2,label:"sp²",desc:"1 s orbital + 2 p orbitals  →  3 equivalent sp² hybrid orbitals (1 pure p remains for the π)"},
    triple:{n:1,label:"sp",desc:"1 s orbital + 1 p orbital  →  2 equivalent sp hybrid orbitals (2 pure p remain for the π bonds)"},
    benzene:{n:2,label:"sp²",desc:"Per C: 1 s orbital + 2 p orbitals  →  3 sp² (1 pure p remains, forming the π system of the ring)"}
  }[type];
  if(!cfg) return;
  const midY=H/2; ctx.textAlign="center"; ctx.textBaseline="middle";
  let x=42;
  ctx.fillStyle=P.accent; ctx.beginPath(); ctx.arc(x,midY,15,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#fff"; ctx.font="bold 12px Inter,sans-serif"; ctx.fillText("s",x,midY);
  x+=36; ctx.fillStyle=P.muted; ctx.font="18px Inter,sans-serif"; ctx.fillText("+",x,midY); x+=26;
  for(let i=0;i<cfg.n;i++){
    ctx.save(); ctx.translate(x,midY);
    const g1=ctx.createRadialGradient(-10,0,2,-10,0,15); g1.addColorStop(0,"#e8766e"); g1.addColorStop(1,"rgba(232,118,110,0.12)");
    const g2=ctx.createRadialGradient(10,0,2,10,0,15); g2.addColorStop(0,"#5aa0e0"); g2.addColorStop(1,"rgba(90,160,224,0.12)");
    ctx.fillStyle=g1; ctx.beginPath(); ctx.ellipse(-10,0,13,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=g2; ctx.beginPath(); ctx.ellipse(10,0,13,8,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    x+=34;
    if(i<cfg.n-1){ ctx.fillStyle=P.muted; ctx.font="18px Inter,sans-serif"; ctx.fillText("+",x,midY); x+=26; }
  }
  x+=14;
  ctx.strokeStyle=P.carbon; ctx.lineWidth=2.2;
  ctx.beginPath(); ctx.moveTo(x,midY); ctx.lineTo(x+44,midY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+44,midY); ctx.lineTo(x+36,midY-6); ctx.lineTo(x+36,midY+6); ctx.closePath(); ctx.fillStyle=P.carbon; ctx.fill();
  x+=64;
  const nOut=cfg.n+1, cx=x+30;
  ctx.save(); ctx.translate(cx,midY);
  const g=ctx.createRadialGradient(15,0,2,0,0,30); g.addColorStop(0,P.purpleLight); g.addColorStop(1,"rgba(138,99,201,0.08)");
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(11,-8,30,0); ctx.quadraticCurveTo(11,8,0,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="rgba(90,60,140,0.4)"; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
  ctx.fillStyle=P.purple; ctx.font="bold 11px Inter,sans-serif"; ctx.textAlign="center";
  ctx.fillText(`× ${nOut}`, cx+16, midY-24);
  ctx.fillStyle=P.carbon; ctx.font="bold 13px Inter,sans-serif"; ctx.textAlign="left";
  ctx.fillText(cfg.label, cx+38, midY);
  ctx.fillStyle=P.muted; ctx.font="11px Inter,sans-serif"; ctx.textAlign="center";
  ctx.fillText(cfg.desc, W/2, H-10);
}

function updateStats(type){
  const d=BOND_DATA[type];
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  set("sigmaCount",d.sigma); set("piCount",d.pi); set("hybridValue",d.hybrid);
  set("geometryValue",d.geometry); set("angleValue",d.angle); set("bondBadge",d.name);
  set("formulaBadge",d.formula); set("visualCaption",d.caption); set("explanation",d.explanation);
  set("sigmaOrigin",d.sigmaOrigin); set("pOrbitals",d.pOrbitals); set("geometryDetail",d.geometry);
  set("rotationDetail",d.rotation);
  drawHybridDiagram(type);
  const fb=document.getElementById("rotationFeedback");
  if(fb){
    const m={single:"In a C–C single bond, rotation about the σ axis is relatively free.",
             double:"In C=C, rotation is restricted because the side-by-side overlap of the π bond would be lost.",
             triple:"In C≡C there are two perpendicular π bonds and a linear geometry.",
             benzene:"In benzene there is no isolated C–C single bond to rotate: the 6 carbons form a rigid ring with a delocalized π system."};
    fb.textContent=m[type];
  }
}
function updateSimulation(type){ twist=0; updateStats(type); render();
  const rb=document.getElementById("rotateButton");
  if(rb) rb.textContent = type==="benzene" ? "Rotate the ring 360°" : "Try C–C rotation";
}

/* ---------- Demo de rotación ---------- */
function runRotationDemo(){
  if(animating) return;
  const type=currentType();
  animating=true;
  if(type==="benzene"){
    const yaw0=yaw, dur=3200, t0=performance.now();
    function spin(now){
      const k=Math.min(1,(now-t0)/dur);
      yaw = yaw0 + k*Math.PI*2;
      render();
      if(k<1) requestAnimationFrame(spin); else { yaw=yaw0; render(); animating=false; }
    }
    requestAnimationFrame(spin);
    return;
  }
  const target = type==="single" ? Math.PI*2 : Math.PI/2;   // simple: vuelta libre; múltiple: hasta perpendicular
  const dur = type==="single" ? 2600 : 1700;
  const t0=performance.now();
  function step(now){
    const k=Math.min(1,(now-t0)/dur);
    const ease = 0.5-0.5*Math.cos(Math.PI*k);
    twist = target*ease;
    render();
    if(k<1){ requestAnimationFrame(step); }
    else if(type!=="single"){
      setTimeout(()=>{                                        // regresa mostrando que el π se recupera
        const t1=performance.now();
        (function back(n){const kk=Math.min(1,(n-t1)/900); twist=target*(1-kk); render();
          if(kk<1) requestAnimationFrame(back); else animating=false;})(performance.now());
      },700);
    } else { twist=0; render(); animating=false; }
  }
  requestAnimationFrame(step);
}

/* ---------- Interacción ---------- */
function setupCanvas(){
  const c=document.getElementById("bondCanvas");
  const activePointers=new Map();
  const isTouch=e=>e.pointerType==="touch";
  c.onpointerdown=e=>{
    activePointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(isTouch(e) && activePointers.size<2) return;   // un dedo: se deja hacer scroll normal de página
    drag=true; last=[e.clientX,e.clientY]; c.setPointerCapture(e.pointerId);
  };
  c.onpointermove=e=>{
    if(!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(!drag) return;
    yaw+=(e.clientX-last[0])*.01; pitch+=(e.clientY-last[1])*.01; last=[e.clientX,e.clientY]; render();
  };
  c.onpointerup=e=>{ activePointers.delete(e.pointerId); if(activePointers.size<2) drag=false; };
  c.onpointercancel=e=>{ activePointers.delete(e.pointerId); drag=false; };
  c.onkeydown=e=>{
    const s=0.12;
    if(e.key==="ArrowLeft"){yaw-=s;} else if(e.key==="ArrowRight"){yaw+=s;}
    else if(e.key==="ArrowUp"){pitch-=s;} else if(e.key==="ArrowDown"){pitch+=s;} else return;
    e.preventDefault(); render();
  };
}

function toggleOrbitals(){ render(); }
function toggleLabels(){ render(); }
function toggleAnimation(){ /* la animación ambiental de orbitales ya no depende de CSS */ render(); }

function resetSimulation(){
  document.getElementById("bondSelect").value="single";
  document.getElementById("orbitalToggle").checked=true;
  document.getElementById("animationToggle").checked=true;
  document.getElementById("labelsToggle").checked=true;
  yaw=0.55; pitch=0.32; twist=0;
  updateSimulation("single");
}

function setupTabs(){
  document.querySelectorAll(".tab").forEach(button=>{
    button.addEventListener("click",()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

/* ---------- Quiz con retroalimentación y barajado ---------- */
let qOrder=[];
const shuffle=window.LabUtils.shuffle;
function renderQuiz(){
  qOrder=shuffle(QUIZ.map(item=>{
    const opts=item.options.map((o,j)=>({o,correct:j===item.answer}));
    return {q:item.q, opts:shuffle(opts.slice()), fb:item.fb};
  }));
  const container=document.getElementById("quizContainer");
  container.innerHTML=qOrder.map((item,index)=>{
    const options=item.opts.map((o,oi)=>`
      <label class="quiz-option"><input type="radio" name="q${index}" value="${oi}"><span>${o.o}</span></label>`).join("");
    return `<div class="quiz-question"><fieldset><legend>${index+1}. ${item.q}</legend>${options}
      <p class="qfb" data-fb="${index}" style="display:none;margin:6px 0 0;font-size:.92rem"></p></fieldset></div>`;
  }).join("");
  const result=document.getElementById("quizResult");
  result.textContent=""; result.className="quiz-result";
}
function checkQuiz(){
  let score=0;
  qOrder.forEach((item,index)=>{
    const sel=document.querySelector(`input[name="q${index}"]:checked`);
    const fb=document.querySelector(`[data-fb="${index}"]`);
    const correctIdx=item.opts.findIndex(o=>o.correct);
    fb.style.display="block";
    if(sel && Number(sel.value)===correctIdx){ score++; fb.className="qfb good"; fb.textContent="✓ Correct. "+item.fb; }
    else { fb.className="qfb bad"; fb.textContent="✗ "+item.fb; }
  });
  const pct=Math.round(score/qOrder.length*100);
  const result=document.getElementById("quizResult");
  result.className="quiz-result "+(pct>=80?"good":pct>=50?"mid":"low");
  result.textContent=`Result: ${score}/${qOrder.length} (${pct}%).`;
}

/* ---------- Enlaces de eventos ---------- */
document.getElementById("bondSelect").addEventListener("change",()=>updateSimulation(currentType()));
document.getElementById("orbitalToggle").addEventListener("change",toggleOrbitals);
document.getElementById("animationToggle").addEventListener("change",toggleAnimation);
document.getElementById("labelsToggle").addEventListener("change",toggleLabels);
document.getElementById("rotateButton").addEventListener("click",runRotationDemo);
document.getElementById("resetButton").addEventListener("click",resetSimulation);
document.getElementById("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");render();drawHybridDiagram(currentType());});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{render();drawHybridDiagram(currentType());});
document.getElementById("checkQuiz").addEventListener("click",checkQuiz);
document.getElementById("newQuiz").addEventListener("click",renderQuiz);
document.getElementById("printAnswers").addEventListener("click",()=>{
  const box=document.getElementById("answerKey");
  box.innerHTML="<h2>Answer key — σ/π</h2>"+qOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Correct answer: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
  box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
});

setupTabs(); setupCanvas(); renderQuiz(); updateSimulation("single");
