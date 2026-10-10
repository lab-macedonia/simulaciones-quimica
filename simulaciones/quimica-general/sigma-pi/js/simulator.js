window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};
/* Enlaces σ y π — motor 3D sin dependencias externas.
   Reescrito: orbitales p como lóbulos reales, solapamiento σ frontal y π lateral,
   y demostración de rotación que rompe el enlace π. */

const BOND_DATA = {
  single: {
    name:"Enlace simple", formula:"Etano · C₂H₆", sigma:1, pi:0, hybrid:"sp³",
    geometry:"tetraédrica", angle:"109,5°", sigmaOrigin:"sp³–sp³", pOrbitals:"0 por C",
    rotation:"relativamente libre",
    caption:"El enlace σ se forma por solapamiento frontal de orbitales híbridos sp³.",
    explanation:"Cada carbono presenta hibridación sp³. El enlace C–C corresponde a un enlace σ producido por solapamiento frontal de orbitales híbridos sp³. La geometría alrededor de cada carbono es aproximadamente tetraédrica, con ángulos ideales cercanos a 109,5°. Como no existe un enlace π entre los carbonos, la rotación alrededor del eje C–C es relativamente libre."
  },
  double: {
    name:"Enlace doble", formula:"Eteno · C₂H₄", sigma:1, pi:1, hybrid:"sp²",
    geometry:"trigonal plana", angle:"120°", sigmaOrigin:"sp²–sp²", pOrbitals:"1 por C",
    rotation:"restringida",
    caption:"El enlace doble contiene 1 σ y 1 π.",
    explanation:"Cada carbono presenta hibridación sp² y conserva un orbital p sin hibridar. El enlace C=C contiene un enlace σ por solapamiento frontal de orbitales sp² y un enlace π por solapamiento lateral de los orbitales p. La geometría es trigonal plana con ángulos ideales cercanos a 120°. La rotación está restringida porque destruiría el solapamiento lateral necesario para mantener el enlace π."
  },
  triple: {
    name:"Enlace triple", formula:"Etino · C₂H₂", sigma:1, pi:2, hybrid:"sp",
    geometry:"lineal", angle:"180°", sigmaOrigin:"sp–sp", pOrbitals:"2 por C",
    rotation:"no equivalente a un enlace simple",
    caption:"El enlace triple contiene 1 σ y 2 π en planos perpendiculares.",
    explanation:"Cada carbono presenta hibridación sp y conserva dos orbitales p sin hibridar. El enlace C≡C contiene un enlace σ por solapamiento frontal de orbitales sp y dos enlaces π formados por dos pares de orbitales p mutuamente perpendiculares. La disposición alrededor de cada carbono es lineal y el ángulo ideal es 180°."
  },
  benzene: {
    name:"Anillo aromático", formula:"Benceno · C₆H₆", sigma:"12 (6 C–C + 6 C–H)", pi:"6 e⁻ deslocalizados",
    hybrid:"sp²", geometry:"hexagonal plana", angle:"120°", sigmaOrigin:"sp²–sp² (anillo) y sp²–1s (C–H)",
    pOrbitals:"1 por C (6 en total)",
    rotation:"no aplica: es un anillo rígido, no un enlace simple libre para girar",
    caption:"Los 6 orbitales p forman un único sistema π deslocalizado por encima y por debajo del anillo.",
    explanation:"Cada uno de los 6 carbonos presenta hibridación sp² y conserva un orbital p perpendicular al plano del anillo. En lugar de formar tres enlaces π localizados (como sugeriría una estructura de Kekulé con enlaces alternados), los 6 orbitales p se solapan lateralmente de forma continua, generando un sistema π deslocalizado con 6 electrones distribuidos sobre todo el anillo. Por eso las seis longitudes de enlace C–C son idénticas (≈139 pm), un valor intermedio entre un enlace simple C–C (≈154 pm) y uno doble C=C (≈134 pm). Esta deslocalización le confiere al benceno una estabilidad extra —la energía de resonancia, de unas 36 kcal/mol (≈150 kJ/mol)— por encima de la de un ciclohexatrieno hipotético con enlaces alternados."
  }
};

const QUIZ = [
  {q:"¿Cuántos enlaces σ y π hay entre los carbonos de un enlace doble C=C?",
   options:["2 σ y 0 π","1 σ y 1 π","0 σ y 2 π","2 σ y 1 π"], answer:1,
   fb:"Todo enlace múltiple tiene exactamente un σ; el resto son π. En C=C: 1 σ + 1 π."},
  {q:"¿Qué hibridación presenta cada carbono en el eteno, C₂H₄?",
   options:["sp³","sp²","sp","p"], answer:1,
   fb:"El carbono con un enlace doble usa 3 orbitales híbridos (sp²) y deja 1 orbital p para el π."},
  {q:"¿Cuál es el ángulo ideal asociado a una geometría lineal?",
   options:["90°","109,5°","120°","180°"], answer:3,
   fb:"La geometría lineal (hibridación sp, como en el etino) tiene un ángulo ideal de 180°."},
  {q:"¿Qué tipo de solapamiento produce un enlace π?",
   options:["Frontal","Lateral","Nuclear","Iónico"], answer:1,
   fb:"El π nace del solapamiento lateral de orbitales p paralelos; el frontal produce el σ."},
  {q:"Un carbono sp posee, sin hibridar:",
   options:["0 orbitales p","1 orbital p","2 orbitales p","3 orbitales p"], answer:2,
   fb:"sp combina 1 s + 1 p, dejando 2 orbitales p libres que forman los dos enlaces π del triple."},
  {q:"¿Por qué las seis longitudes de enlace C–C del benceno son idénticas?",
   options:["Porque no hay enlaces π","Porque los 6 electrones π están deslocalizados en todo el anillo, no en enlaces dobles fijos","Porque el benceno no es plano","Porque cada carbono es sp³"], answer:1,
   fb:"La deslocalización del sistema π sobre los 6 carbonos promedia el orden de enlace, dando una longitud C–C uniforme (~139 pm), intermedia entre un enlace simple y uno doble."},
  {q:"¿Cuántos electrones participan en el sistema π deslocalizado del benceno?",
   options:["2","4","6","12"], answer:2,
   fb:"Cada uno de los 6 carbonos sp² aporta 1 electrón de su orbital p sin hibridar: 6 electrones π en total, deslocalizados sobre todo el anillo."},
  {q:"Entre C–C, C=C y C≡C, ¿cuál es el enlace más corto?",
   options:["C–C","C=C","C≡C","los tres miden igual"], answer:2,
   fb:"A mayor orden de enlace, mayor atracción entre los carbonos y menor longitud: C≡C (~120 pm) < C=C (~134 pm) < C–C (~154 pm)."},
  {q:"¿Por qué existe el isómero cis y el trans del 2-buteno pero no del butano?",
   options:["porque el butano no tiene carbonos","porque la rotación libre del enlace simple interconvierte las formas del butano","porque el 2-buteno es un gas","porque el butano es aromático"], answer:1,
   fb:"En el butano el enlace C–C rota libremente y las conformaciones se interconvierten. En el 2-buteno el enlace π impide la rotación y fija a los sustituyentes en cis o trans."},
  {q:"La energía de resonancia del benceno (~150 kJ/mol) representa:",
   options:["la energía de un enlace σ","la estabilidad extra frente a un ciclohexatrieno hipotético con enlaces alternados","la energía para romper el anillo","el calor de combustión"], answer:1,
   fb:"Es la diferencia entre la energía real del benceno (deslocalizado) y la calculada para una estructura con tres enlaces dobles localizados: la deslocalización estabiliza."}
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
  const prims=[];
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
  prims.sort((pa,pb)=>pa.z-pb.z).forEach(pp=>pp.draw());
  if(showLab){
    ctx.font="bold 16px Inter,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=P.purple; ctx.fillText("π deslocalizado (6 e⁻ sobre y bajo el anillo)", W/2, 22);
    ctx.fillStyle=P.success; ctx.font="bold 14px Inter,sans-serif";
    ctx.fillText("σ (anillo hexagonal)", W/2, H-14);
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
    if(ro){ ro.textContent="Anillo aromático: los 6 electrones π están deslocalizados en un sistema continuo sobre y bajo el plano. No hay un enlace π localizado que 'romper' con un giro; usa arrastrar/flechas para verlo desde distintos ángulos."; ro.className="muted"; }
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

  // orden por profundidad de todas las piezas
  const prims=[];

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
      ro.textContent = `Giro C–C: ${deg}°. Sin enlace π, la rotación no tiene costo apreciable.`;
      ro.className="muted";
    }else{
      const pct=Math.round(align*100);
      ro.textContent = `Giro C–C: ${deg}° · solapamiento π ≈ ${pct}%.` + (align<0.25 ? "  ⚠ El enlace π prácticamente se rompe." : "");
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
    ectx.fillText("Sin enlace π: no hay barrera de rotación que graficar.", mL, H/2+4);
    return;
  }
  if(type==="benzene"){
    ectx.fillStyle=P.muted; ectx.font="11px Inter,sans-serif"; ectx.textAlign="left";
    ectx.fillText("No hay un solo enlace π que romper por rotación: la estabilidad del anillo viene de la deslocalización.", mL, H/2-6);
    ectx.fillStyle=P.purple; ectx.font="bold 12px Inter,sans-serif";
    ectx.fillText("Energía de resonancia ≈ 36 kcal/mol (≈150 kJ/mol) sobre un ciclohexatrieno hipotético.", mL, H/2+12);
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
  ectx.fillText("0° (π intacto)", mL, H-3);
  ectx.textAlign="right";
  ectx.fillText("90° (π roto)", W-mR, H-3);
  ectx.textAlign="left";
  ectx.fillText("Modelo cualitativo (∝ cos²θ), no valores de energía DFT.", mL, top+9);
}

/* ---------- Nota de isomería cis/trans ligada a la rotación restringida ---------- */
function drawCisTransNote(type){
  const el=document.getElementById("cisTransNote"); if(!el) return;
  if(type==="benzene"){
    el.textContent="El anillo es plano y los 6 enlaces C–C son equivalentes, así que el benceno mismo no presenta isomería cis/trans. En derivados sustituidos sí aparece un tipo distinto de isomería: la posición relativa de los sustituyentes en el anillo (orto, meta, para).";
    return;
  }
  if(type==="double"){
    el.textContent="Como el enlace π impide la rotación libre, un C=C con sustituyentes distintos en cada carbono puede existir como isómeros geométricos (cis/trans o E/Z) que no se interconvierten a temperatura ambiente.";
  } else if(type==="single"){
    el.textContent="Al no haber enlace π, la rotación alrededor de un enlace simple es libre: los enlaces simples C–C no generan isomería cis/trans.";
  } else {
    el.textContent="Con dos enlaces π perpendiculares, la geometría lineal del triple enlace no deja sustituyentes en posiciones relativas que puedan generar isomería cis/trans.";
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
    single:{n:3,label:"sp³",desc:"1 orbital s + 3 orbitales p  →  4 orbitales híbridos sp³ equivalentes"},
    double:{n:2,label:"sp²",desc:"1 orbital s + 2 orbitales p  →  3 orbitales híbridos sp² equivalentes (queda 1 p puro para el π)"},
    triple:{n:1,label:"sp",desc:"1 orbital s + 1 orbital p  →  2 orbitales híbridos sp equivalentes (quedan 2 p puros para los π)"},
    benzene:{n:2,label:"sp²",desc:"Por cada C: 1 orbital s + 2 orbitales p  →  3 sp² (queda 1 p puro que forma el sistema π del anillo)"}
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
    const m={single:"En un enlace simple C–C, la rotación alrededor del eje σ es relativamente libre.",
             double:"En C=C, la rotación está restringida porque se perdería el solapamiento lateral del enlace π.",
             triple:"En C≡C existen dos enlaces π perpendiculares y una geometría lineal.",
             benzene:"En el benceno no hay un enlace C–C simple aislado para girar: los 6 carbonos forman un anillo rígido con un sistema π deslocalizado."};
    fb.textContent=m[type];
  }
}
function updateSimulation(type){ twist=0; updateStats(type); render();
  const rb=document.getElementById("rotateButton");
  if(rb) rb.textContent = type==="benzene" ? "Girar el anillo 360°" : "Probar rotación C–C";
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
    if(sel && Number(sel.value)===correctIdx){ score++; fb.className="qfb good"; fb.textContent="✓ Correcto. "+item.fb; }
    else { fb.className="qfb bad"; fb.textContent="✗ "+item.fb; }
  });
  const pct=Math.round(score/qOrder.length*100);
  const result=document.getElementById("quizResult");
  result.className="quiz-result "+(pct>=80?"good":pct>=50?"mid":"low");
  result.textContent=`Resultado: ${score}/${qOrder.length} (${pct}%).`;
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
  box.innerHTML="<h2>Clave de respuestas — σ/π</h2>"+qOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Respuesta correcta: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
  box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
});

setupTabs(); setupCanvas(); renderQuiz(); updateSimulation("single");
