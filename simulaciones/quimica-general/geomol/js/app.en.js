window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};
/* GeoMol — motor de visualización 3D (sin dependencias externas)
   Reescrito: esferas con iluminación, radios tipo CPK, orbitales p como lóbulos,
   suma vectorial real de dipolos, rotación por teclado y respeto a prefers-reduced-motion. */

/* ---------- Datos de geometría VSEPR ---------- */
const GEOM = {
  "AX2":   {eg:"linear",                 mg:"linear",              ang:"180°",             hyb:"sp",   pts:[[1,0,0],[-1,0,0]], lp:[]},
  "AX3":   {eg:"trigonal planar",         mg:"trigonal planar",      ang:"120°",             hyb:"sp²",  pts:[[1,0,0],[-.5,.866,0],[-.5,-.866,0]], lp:[]},
  "AX2E":  {eg:"trigonal planar",         mg:"bent",             ang:"<120°",            hyb:"sp²",  pts:[[.7,.72,0],[.7,-.72,0]], lp:[[-1,0,0]]},
  "AX4":   {eg:"tetrahedral",            mg:"tetrahedral",         ang:"109,5°",           hyb:"sp³",  pts:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]], lp:[]},
  "AX3E":  {eg:"tetrahedral",            mg:"trigonal pyramidal",  ang:"≈107°",            hyb:"sp³",  pts:[[1,1,1],[-1,-1,1],[-1,1,-1]], lp:[[1,-1,-1]]},
  "AX2E2": {eg:"tetrahedral",            mg:"bent",             ang:"≈104,5°",          hyb:"sp³",  pts:[[1,1,1],[-1,-1,1]], lp:[[-1,1,-1],[1,-1,-1]]},
  "AX5":   {eg:"trigonal bipyramidal",   mg:"trigonal bipyramidal",ang:"90°, 120°, 180°",  hyb:"sp³d (traditional VSEPR label)", pts:[[1,0,0],[-.5,.866,0],[-.5,-.866,0],[0,0,1],[0,0,-1]], lp:[]},
  "AX4E":  {eg:"trigonal bipyramidal",   mg:"seesaw",            ang:"<90°, <120°",      hyb:"sp³d (traditional)", pts:[[1,0,0],[-.5,.866,0],[0,0,1],[0,0,-1]], lp:[[-.5,-.866,0]]},
  "AX3E2": {eg:"trigonal bipyramidal",   mg:"T-shaped",          ang:"≈90°, 180°",       hyb:"sp³d (traditional)", pts:[[1,0,0],[0,0,1],[0,0,-1]], lp:[[-.5,.866,0],[-.5,-.866,0]]},
  "AX2E3": {eg:"trigonal bipyramidal",   mg:"linear",              ang:"180°",             hyb:"sp³d (traditional)", pts:[[0,0,1],[0,0,-1]], lp:[[1,0,0],[-.5,.866,0],[-.5,-.866,0]]},
  "AX6":   {eg:"octahedral",             mg:"octahedral",          ang:"90°, 180°",        hyb:"sp³d² (traditional VSEPR label)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], lp:[]},
  "AX5E":  {eg:"octahedral",             mg:"square pyramidal",  ang:"≈90°, 180°",       hyb:"sp³d² (traditional)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]], lp:[[0,0,-1]]},
  "AX4E2": {eg:"octahedral",             mg:"square planar",      ang:"90°, 180°",        hyb:"sp³d² (traditional)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]], lp:[[0,0,1],[0,0,-1]]}
};

const MOLS = {
  "CO2": {name:"CO₂", ax:"AX2",   pol:"nonpolar", center:"C",  outer:["O","O"], ex:"The two C→O dipoles have equal magnitude and opposite directions; they cancel."},
  "BF3": {name:"BF₃", ax:"AX3",   pol:"nonpolar", center:"B",  outer:["F","F","F"], ex:"Three B→F dipoles cancel by the trigonal planar symmetry."},
  "SO2": {name:"SO₂", ax:"AX2E",  pol:"polar",  center:"S",  outer:["O","O"], ex:"The bent shape prevents the S→O dipoles from canceling."},
  "CH4": {name:"CH₄", ax:"AX4",   pol:"nonpolar", center:"C",  outer:["H","H","H","H"], ex:"The small C–H dipoles approximately offset each other by tetrahedral symmetry."},
  "NH3": {name:"NH₃", ax:"AX3E",  pol:"polar",  center:"N",  outer:["H","H","H"], ex:"The trigonal pyramidal geometry produces a net dipole moment (reinforced by the lone pair)."},
  "H2O": {name:"H₂O", ax:"AX2E2", pol:"polar",  center:"O",  outer:["H","H"], ex:"The bent shape produces a net dipole moment."},
  "PCl5":{name:"PCl₅",ax:"AX5",   pol:"nonpolar", center:"P",  outer:["Cl","Cl","Cl","Cl","Cl"], ex:"In the ideal trigonal bipyramid model, the equivalent dipoles cancel."},
  "SF4": {name:"SF₄", ax:"AX4E",  pol:"polar",  center:"S",  outer:["F","F","F","F"], ex:"The seesaw shape is asymmetric and leaves a net dipole."},
  "ClF3":{name:"ClF₃",ax:"AX3E2", pol:"polar",  center:"Cl", outer:["F","F","F"], ex:"The T shape does not cancel all the dipoles."},
  "XeF2":{name:"XeF₂",ax:"AX2E3", pol:"nonpolar", center:"Xe", outer:["F","F"], ex:"The molecule is linear and the opposite Xe–F dipoles cancel."},
  "SF6": {name:"SF₆", ax:"AX6",   pol:"nonpolar", center:"S",  outer:["F","F","F","F","F","F"], ex:"Octahedral symmetry cancels the equivalent dipoles."},
  "BrF5":{name:"BrF₅",ax:"AX5E",  pol:"polar",  center:"Br", outer:["F","F","F","F","F"], ex:"The square pyramid is asymmetric and produces a net dipole."},
  "XeF4":{name:"XeF₄",ax:"AX4E2", pol:"nonpolar", center:"Xe", outer:["F","F","F","F"], ex:"The square planar geometry cancels the four Xe–F dipoles."}
};

/* ---------- Tabla de elementos: color CPK, radio de dibujo y electronegatividad (Pauling) ---------- */
const ELEM = {
  H:  {color:P.nearWhite, radius:0.62, chi:2.20},
  C:  {color:P.carbon, radius:0.92, chi:2.55},
  N:  {color:"#3552d6", radius:0.86, chi:3.04},
  O:  {color:"#e23b3b", radius:0.84, chi:3.44},
  F:  {color:"#63c34a", radius:0.80, chi:3.98},
  Cl: {color:"#3bb34a", radius:1.05, chi:3.16},
  Br: {color:"#a5502e", radius:1.18, chi:2.96},
  S:  {color:"#e0b32a", radius:1.12, chi:2.58},
  P:  {color:"#e8792a", radius:1.12, chi:2.19},
  B:  {color:"#e59a9a", radius:0.95, chi:2.04},
  Xe: {color:"#3f9fb0", radius:1.28, chi:2.60},
  X:  {color:"#8b95a1", radius:0.90, chi:2.50}
};
const elem = s => ELEM[s] || ELEM.X;

/* ---------- Estado de cámara ---------- */
let yaw = .6, pitch = .38, drag = false, last = [0,0];
let practice = false;
/* Normaliza nombres de geometría y exige coincidencia de todas las palabras clave,
   evitando falsos positivos entre geometrías distintas que comparten una palabra
   (p.ej. "trigonal plana" vs "piramidal trigonal" vs "bipiramidal trigonal"). */
function normGeo(s){
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")   // quita tildes
    .replace(/[^a-z\s]/g,"").trim();
}
function matchesGeometry(input, correct){
  const a=normGeo(input), b=normGeo(correct);
  if(!a) return false;
  if(a===b) return true;
  const wordsB=b.split(/\s+/).filter(w=>w.length>3);   // palabras significativas del nombre correcto
  const wordsA=new Set(a.split(/\s+/).filter(w=>w.length>3));
  return wordsB.length>0 && wordsB.every(w=>wordsA.has(w)) && wordsA.size===wordsB.length;
}
function exportCanvas(id,name){const c=document.getElementById(id);if(!c)return;const a=document.createElement("a");a.download=name+".png";a.href=c.toDataURL("image/png");a.click();}
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Utilidades de color ---------- */
const {mix,lighten,darken}=window.LabUtils;

/* ---------- Geometría 3D ---------- */
function norm(p){const L=Math.hypot(p[0],p[1],p[2])||1;return [p[0]/L,p[1]/L,p[2]/L];}
function rot(p){
  const [x,y,z]=p, cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  const x1=x*cy - z*sy, z1=x*sy + z*cy;
  return [x1, y*cp - z1*sp, y*sp + z1*cp];
}
/* Proyección con perspectiva suave. Devuelve [px, py, depth, pscale] */
const CAM = 6.2, FOC = 4.6;
function project(p, W, H, world = 2.15){
  const r = rot(p);
  const s = FOC / (CAM - r[2]*world);     // factor de perspectiva
  return [W/2 + r[0]*world*s*56, H/2 - r[1]*world*s*56, r[2], s];
}

/* ---------- Fondo del lienzo ---------- */
function paintBg(ctx,W,H){
  const panel = getComputedStyle(document.body).getPropertyValue("--panel2").trim() || "#eef2f6";
  const g = ctx.createRadialGradient(W*0.38, H*0.32, 20, W*0.5, H*0.5, Math.max(W,H)*0.75);
  g.addColorStop(0, lighten(panel, 0.10));
  g.addColorStop(1, darken(panel, 0.06));
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
}

/* ---------- Esfera sombreada (átomo) ---------- */
function drawSphere(ctx, x, y, r, color, depth){
  const fog = (1 - (depth+1)/2) * 0.30;          // átomos lejanos, ligeramente hacia el fondo
  const base = mix(color, "#5b6572", fog);
  const g = ctx.createRadialGradient(x - r*0.38, y - r*0.42, r*0.08, x, y, r);
  g.addColorStop(0, lighten(base, 0.55));
  g.addColorStop(0.45, base);
  g.addColorStop(1, darken(base, 0.42));
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = darken(base,0.55); ctx.stroke();
  // brillo especular
  ctx.beginPath(); ctx.arc(x - r*0.34, y - r*0.38, r*0.16, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fill();
}

/* ---------- Enlace tipo cilindro (sombreado transversal) ---------- */
function drawBond(ctx, x1, y1, x2, y2, w){
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
  const g = ctx.createLinearGradient(x1+nx*w, y1+ny*w, x1-nx*w, y1-ny*w);
  g.addColorStop(0, "#8b95a1"); g.addColorStop(0.5, "#cfd6dd"); g.addColorStop(1, "#6b7580");
  ctx.beginPath();
  ctx.moveTo(x1+nx*w, y1+ny*w); ctx.lineTo(x2+nx*w, y2+ny*w);
  ctx.lineTo(x2-nx*w, y2-ny*w); ctx.lineTo(x1-nx*w, y1-ny*w); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
}

/* ---------- Lóbulo de par libre (orbital) ---------- */
function drawLonePair(ctx, cx, cy, px, py, depth){
  const ang = Math.atan2(py-cy, px-cx);
  const fog = (1-(depth+1)/2)*0.25;
  const col = mix(P.purpleLight, "#5b6572", fog);
  ctx.save(); ctx.translate(px,py); ctx.rotate(ang);
  const g = ctx.createRadialGradient(-6,0,2,0,0,20);
  g.addColorStop(0, "rgba(180,150,220,0.85)");
  g.addColorStop(1, "rgba(138,99,201,0.10)");
  ctx.fillStyle = g;
  // dos lóbulos (representación esquemática del par)
  [-7,7].forEach(off=>{ ctx.beginPath(); ctx.ellipse(2, off, 15, 8, 0, 0, Math.PI*2); ctx.fill(); });
  ctx.restore();
  ctx.fillStyle = col; ctx.font = "bold 11px Inter, sans-serif"; ctx.textAlign="center";
  ctx.fillText("··", px, py+4);
}

/* ---------- Flecha de dipolo ---------- */
function drawArrow(ctx, x1, y1, x2, y2, color, width){
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, a=Math.atan2(dy,dx);
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=width||2.2;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const h=Math.min(12, L*0.5);
  ctx.beginPath(); ctx.moveTo(x2,y2);
  ctx.lineTo(x2-h*Math.cos(a-0.42), y2-h*Math.sin(a-0.42));
  ctx.lineTo(x2-h*Math.cos(a+0.42), y2-h*Math.sin(a+0.42));
  ctx.closePath(); ctx.fill();
}

/* ---------- Cálculo del dipolo neto (suma vectorial en 3D) ---------- */
function netDipole(m){
  const g = GEOM[m.ax];
  const cChi = elem(m.center).chi;
  let net=[0,0,0]; const bonds=[];
  g.pts.forEach((p,i)=>{
    const u=norm(p);
    const oChi=elem(m.outer[i]||"X").chi;
    const d=oChi-cChi;                       // signo: >0 dipolo hacia el átomo externo
    const mag=Math.abs(d);
    const dir = d>=0 ? 1 : -1;               // apunta al átomo más electronegativo
    bonds.push({u, mag, dir});
    net[0]+=u[0]*mag*dir; net[1]+=u[1]*mag*dir; net[2]+=u[2]*mag*dir;
  });
  const mu=Math.hypot(net[0],net[1],net[2]);
  return {net, mu, bonds};
}

/* ---------- Render principal de la molécula ---------- */
function drawMolecule(canvas, key, mode){
  // mode: "explore" (dipolos según toggle) | "polarity" (muestra dipolos de enlace + neto)
  const ctx=canvas.getContext("2d"), W=canvas.width, H=canvas.height;
  const m=MOLS[key], g=GEOM[m.ax];
  paintBg(ctx,W,H);

  const showLone   = mode==="polarity" ? false : (document.getElementById("loneToggle")?.checked ?? true);
  const showDipole = mode==="polarity" ? true  : (document.getElementById("dipoleToggle")?.checked ?? true);

  const C = project([0,0,0], W, H);
  const atoms = g.pts.map((p,i)=>{
    const u=norm(p); const pr=project(u,W,H);
    return {pr, i, sym:m.outer[i]||"X", u};
  });
  const lps = g.lp.map(p=>({pr:project(norm(p),W,H), u:norm(p)}));

  // auto-ajuste: escala la escena para que la molécula ocupe una fracción similar
  // del lienzo sin importar su geometría (CO₂ lineal vs SF₆ octaédrica)
  let minX=C[0],maxX=C[0],minY=C[1],maxY=C[1];
  atoms.forEach(a=>{
    const r=elem(a.sym).radius*34*a.pr[3];
    minX=Math.min(minX,a.pr[0]-r); maxX=Math.max(maxX,a.pr[0]+r);
    minY=Math.min(minY,a.pr[1]-r); maxY=Math.max(maxY,a.pr[1]+r);
  });
  const extent=Math.max(maxX-minX, maxY-minY, 1);
  const zoom=Math.max(0.9, Math.min(1.55, (Math.min(W,H)*0.78)/extent));

  // sombra de contacto: ancla la molécula al "suelo" del lienzo
  const shW=(maxX-minX)*0.5*zoom+30;
  const shY=H/2+(maxY-H/2)*zoom+26;
  const sg=ctx.createRadialGradient(W/2,shY,4,W/2,shY,shW);
  sg.addColorStop(0,"rgba(30,40,55,0.16)"); sg.addColorStop(1,"rgba(30,40,55,0)");
  ctx.fillStyle=sg;
  ctx.beginPath(); ctx.ellipse(W/2,shY,shW,Math.max(10,shW*0.16),0,0,Math.PI*2); ctx.fill();

  ctx.save();
  ctx.translate(W/2,H/2); ctx.scale(zoom,zoom); ctx.translate(-W/2,-H/2);

  const dip = showDipole ? netDipole(m) : null;
  const rc = elem(m.center).radius*40*C[3];

  // Escena 3D con Three.js (kit/mol3d.js): enlaces, pares libres, dipolos y esferas con iluminación y buffer de profundidad
  const items=[];
  atoms.forEach(a=>{ items.push({t:"c", a:[0,0,0], b:a.u, r:0.032, color:"#aab4bf"}); });
  if(showLone) g.lp.forEach(p=>{ const u=norm(p); items.push({t:"e", c:[u[0]*0.78,u[1]*0.78,u[2]*0.78], dir:u, len:0.34, wid:0.19, color:P.purpleLight, opacity:0.62, shin:30}); });
  if(showDipole){
    atoms.forEach(a=>{
      const b=dip.bonds[a.i]; if(b.mag<=0.02) return;
      let p1=a.u.map(v=>v*0.30), p2=a.u.map(v=>v*0.72);
      if(b.dir<0){ const t=p1; p1=p2; p2=t; }
      items.push({t:"a", a:p1, b:p2, r:0.044, head:0.17, color:P.accent, shin:20});
    });
  }
  atoms.forEach(a=>{ const e=elem(a.sym); items.push({t:"s", p:a.u, r:e.radius*0.2824, color:e.color}); });
  items.push({t:"s", p:[0,0,0], r:elem(m.center).radius*0.332, color:elem(m.center).color});
  const gl = window.Mol3D && Mol3D.render(W,H,{yaw,pitch,world:2.15,camd:CAM,focpx:56*FOC},items);
  if(gl) ctx.drawImage(gl,0,0,W,H);

  // rótulos 2D (símbolo de cada átomo)
  atoms.forEach(a=>{
    const e=elem(a.sym), r=e.radius*34*a.pr[3];
    ctx.fillStyle = a.sym==="H" ? "#2a3440" : P.labelLight;
    ctx.font = `bold ${Math.max(11, r*0.62)}px Inter, sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(a.sym, a.pr[0], a.pr[1]);
  });
  ctx.fillStyle = m.center==="H" ? "#2a3440" : P.labelLight;
  ctx.font=`bold ${Math.max(13, rc*0.6)}px Inter, sans-serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(m.center, C[0], C[1]);

  // 6) dipolo neto resultante (solo en modo polaridad)
  if(mode==="polarity" && dip){
    const scale = 60;
    const r=rot(dip.net);
    const ex=W/2 + r[0]*scale, ey=H/2 - r[1]*scale;
    if(dip.mu>0.06){
      const dx=ex-C[0], dy=ey-C[1], dlen=Math.hypot(dx,dy)||1;
      const offset=rc+6;                              // arranca en el borde de la esfera, no sobre su etiqueta
      const sx=C[0]+(dx/dlen)*offset, sy=C[1]+(dy/dlen)*offset;
      drawArrow(ctx, sx, sy, ex, ey, P.danger, 4.2);
      ctx.fillStyle=P.danger; ctx.font="bold 15px Inter, sans-serif"; ctx.textAlign="left";
      ctx.textBaseline="alphabetic";
      ctx.fillText("net μ", ex+6, ey);
      ctx.restore();
    } else {
      ctx.restore();
      ctx.fillStyle=P.success; ctx.font="bold 15px Inter, sans-serif"; ctx.textAlign="center";
      ctx.fillText("net μ ≈ 0", W/2, H-22);
    }
  } else {
    ctx.restore();
  }
  ctx.textBaseline="alphabetic";
}

/* ---------- Interfaz ---------- */
function tabs(){
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.getElementById(b.dataset.tab).classList.add("active");
    if(b.dataset.tab==="compara") compare();   // re-renderiza con el estado actual de los toggles
  });
}

function selectMol(k){
  const m=MOLS[k], g=GEOM[m.ax];
  document.getElementById("axBadge").textContent=m.ax;
  document.getElementById("polBadge").textContent=m.pol;
  document.getElementById("molName").textContent=m.name;
  document.getElementById("eg").textContent=g.eg;
  document.getElementById("mg").textContent=g.mg;
  document.getElementById("ang").textContent=g.ang;
  document.getElementById("hyb").textContent=g.hyb;
  document.getElementById("molExplain").textContent=`${m.ax}: ${g.pts.length} bonded atoms and ${g.lp.length} lone pair(s) on the central atom.`;
  document.getElementById("polExplain").textContent=m.ex;
  drawMolecule(document.getElementById("molCanvas"), k, "explore");
  const infoPanel=document.getElementById("infoPanel"), box=document.getElementById("practiceBox");
  if(practice){
    infoPanel.style.display="none"; box.style.display="block";
    box.innerHTML=`<p><strong>${m.name}</strong> — before looking at the data, predict:</p>
      <label>AXₙEₘ notation <input id="guessAx" type="text" placeholder="e.g.: AX2E2" style="width:110px"></label>
      <label style="margin-left:8px">Molecular geometry <input id="guessGeo" type="text" placeholder="e.g.: bent" style="width:170px"></label>
      <button id="revealAnswer" class="btn primary" type="button" style="margin-left:8px">Reveal</button>
      <p id="practiceFeedback" class="muted" style="margin-top:8px"></p>`;
    document.getElementById("revealAnswer").onclick=()=>{
      const ax=(document.getElementById("guessAx").value||"").trim().toUpperCase().replace(/\s/g,"");
      const geoRaw=(document.getElementById("guessGeo").value||"").trim();
      const okAx=ax===m.ax, okGeo=matchesGeometry(geoRaw,g.mg);
      document.getElementById("practiceFeedback").innerHTML=(okAx?"✓":"✗")+` AXₙEₘ: your answer ${ax||"(empty)"}, correct <strong>${m.ax}</strong>. `+(okGeo?"✓":"✗")+` Correct geometry: <strong>${g.mg}</strong>.`;
      infoPanel.style.display="";
    };
  } else {
    infoPanel.style.display=""; box.style.display="none";
  }
}

function setupSelects(){
  ["molSelect","polSelect"].forEach(id=>{
    const s=document.getElementById(id);
    Object.keys(MOLS).forEach(k=>s.add(new Option(`${MOLS[k].name} — ${MOLS[k].ax}`, k)));
  });
  document.getElementById("molSelect").value="H2O";
  document.getElementById("molSelect").onchange=e=>selectMol(e.target.value);
  document.getElementById("polSelect").value="CO2";
  document.getElementById("polSelect").onchange=e=>showPol(e.target.value);
  selectMol("H2O"); showPol("CO2");
}

function redraw(){
  const c=document.getElementById("molCanvas");
  drawMolecule(c, document.getElementById("molSelect").value, "explore");
}

function attachDrag(c, onRotate, label){
  if(!c || c.dataset.dragReady) return;
  c.dataset.dragReady="1";
  c.setAttribute("tabindex","0");
  c.setAttribute("role","img");
  if(label) c.setAttribute("aria-label",label);
  const activePointers=new Map();
  const isTouch = e=>e.pointerType==="touch";
  c.onpointerdown=e=>{
    activePointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(isTouch(e) && activePointers.size<2) return;   // un solo dedo: se deja hacer scroll normal de página
    drag=true; last=[e.clientX,e.clientY]; c.setPointerCapture(e.pointerId);
  };
  c.onpointermove=e=>{
    if(!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(!drag) return;
    yaw+=(e.clientX-last[0])*.01; pitch+=(e.clientY-last[1])*.01; last=[e.clientX,e.clientY]; onRotate();
  };
  c.onpointerup=e=>{ activePointers.delete(e.pointerId); if(activePointers.size<2) drag=false; };
  c.onpointercancel=e=>{ activePointers.delete(e.pointerId); drag=false; };
  c.onkeydown=e=>{
    const step=0.12;
    if(e.key==="ArrowLeft"){yaw-=step;e.preventDefault();}
    else if(e.key==="ArrowRight"){yaw+=step;e.preventDefault();}
    else if(e.key==="ArrowUp"){pitch-=step;e.preventDefault();}
    else if(e.key==="ArrowDown"){pitch+=step;e.preventDefault();}
    else return;
    onRotate();
  };
}
function setupDrag(){
  attachDrag(
    document.getElementById("molCanvas"),
    redraw,
    "3D molecular model. Drag with the mouse, use two fingers on touch screens, or the keyboard arrows to rotate."
  );
}

function loop(){
  if(!drag && !REDUCED){
    const auto=+document.getElementById("autoRotate").value/1000;
    if(auto>0){ yaw+=auto*.02; redraw(); }   // sin auto-rotación no hay nada que animar: evita redibujar a 60 fps
  }
  requestAnimationFrame(loop);
}

function build(){
  const x=+document.getElementById("xRange").value, e=+document.getElementById("eRange").value;
  const key=`AX${x}${e?`E${e>1?e:""}`:""}`;
  const g=GEOM[key];
  document.getElementById("buildAx").textContent=key;
  if(g){
    document.getElementById("buildEg").textContent=g.eg;
    document.getElementById("buildMg").textContent=g.mg;
    document.getElementById("buildAng").textContent=g.ang;
    document.getElementById("buildHyb").textContent=g.hyb;
  }else{
    document.getElementById("buildEg").textContent="combination not included";
    document.getElementById("buildMg").textContent="—";
    document.getElementById("buildAng").textContent="—";
    document.getElementById("buildHyb").textContent="—";
  }
  document.querySelectorAll(".axgrid button").forEach(b=>b.classList.toggle("active", b.textContent===key));
}

function setupBuild(){
  const box=document.getElementById("axButtons");
  Object.keys(GEOM).forEach(k=>{
    const b=document.createElement("button"); b.textContent=k;
    b.onclick=()=>{
      const mm=k.match(/^AX(\d)(?:E(\d*)?)?$/);
      document.getElementById("xRange").value=mm[1];
      document.getElementById("eRange").value=mm[2]===undefined?0:(mm[2]===""?1:+mm[2]);
      build();
    };
    box.appendChild(b);
  });
  document.getElementById("xRange").oninput=build;
  document.getElementById("eRange").oninput=build;
  build();
}

function showPol(k){
  const m=MOLS[k];
  document.getElementById("polTitle").textContent=`${m.name}: ${m.pol}`;
  document.getElementById("polText").textContent=m.ex;
  const c=document.getElementById("polCanvas");
  drawMolecule(c, k, "polarity");
  attachDrag(c, ()=>drawMolecule(c, document.getElementById("polSelect").value, "polarity"),
    "3D polarity model. Drag with the mouse, use two fingers on touch screens, or the keyboard arrows to rotate.");
}

function compare(){
  const keys=["CO2","SO2","CH4","NH3","H2O","BF3","SF4","XeF4","SF6"];
  document.getElementById("compareGrid").innerHTML=keys.map(k=>{
    const m=MOLS[k], g=GEOM[m.ax];
    return `<article class="miniMol"><canvas id="cmp_${k}" width="220" height="160" style="width:100%;height:auto;border-radius:8px;cursor:grab" title="Arrastra para rotar"></canvas><span class="badge">${m.name}</span><h2 style="font-size:1.05rem">${m.ax} · ${g.mg}</h2><p>${g.ang} · ${m.pol}</p></article>`;
  }).join("");
  keys.forEach(k=>{
    const c=document.getElementById("cmp_"+k);
    if(!c) return;
    drawMolecule(c,k,"explore");
    attachDrag(c, ()=>drawMolecule(c,k,"explore"),
      `3D model of ${MOLS[k].name}. Arrastra o usa las flechas para rotar.`);
  });
}

/* ---------- Mini-desafío con retroalimentación ---------- */
const Q=[
  ["AX₃E corresponds to:",["tetrahedral","trigonal pyramidal","bent","linear"],1,
   "AX₃E has 4 electron domains (tetrahedral electron geometry) but one lone pair, so the molecular shape is trigonal pyramidal."],
  ["Why is CO₂ nonpolar even though C=O is polar?",["there are no dipoles","the dipoles cancel because of the linear geometry","C and O have equal electronegativity","because it is AX₂E₂"],1,
   "Each C=O bond is polar, but since it is linear (AX₂) the two opposite dipoles cancel: net μ ≈ 0."],
  ["Correct order of angles:",["H₂O > NH₃ > CH₄","CH₄ > NH₃ > H₂O","NH₃ > CH₄ > H₂O","all 109.5°"],1,
   "Lone pairs compress the angle: CH₄ (109.5°) > NH₃ (≈107°) > H₂O (≈104.5°)."],
  ["XeF₄ is:",["tetrahedral, polar","square planar, nonpolar","linear, polar","seesaw"],1,
   "XeF₄ is AX₄E₂: the two lone pairs sit in opposite axial positions and the molecule is square planar and nonpolar."],
  ["SF₄ (AX₄E) has the shape of a:",["tetrahedron","seesaw","flat square","trigonal pyramid"],1,
   "With 5 domains and 1 equatorial lone pair, the resulting molecular shape is seesaw."],
  ["Which of these molecules is polar?",["CO₂","BF₃","SF₆","SO₂"],3,
   "SO₂ is bent (AX₂E): its S→O dipoles do not cancel. The other three are symmetric and nonpolar."],
  ["In VSEPR, a double bond counts as:",["two electron domains","one electron domain","half a domain","depends on the atom"],1,
   "Each bond (single, double or triple) occupies a single direction in space: one electron domain."],
  ["Why does the lone pair compress bond angles?",["it takes up less space than a bond","it is located farther from the nucleus","it exerts greater repulsion by being closer to the central atom","it has no effect"],2,
   "The lone pair is held only by the central atom, is concentrated closer to it and repels the bonding pairs more, closing the angles."]
];
let qOrder=[];
const shuffle=window.LabUtils.shuffle;
function quiz(){
  // barajamos preguntas y opciones, conservando la respuesta correcta
  qOrder = shuffle(Q.map(q=>{
    const opts=q[1].map((o,j)=>({o, correct:j===q[2]}));
    return {q:q[0], opts:shuffle(opts.slice()), fb:q[3]};
  }));
  document.getElementById("quiz").innerHTML = qOrder.map((item,i)=>`
    <div class="quizq" data-i="${i}">
      <strong>${i+1}. ${item.q}</strong>
      ${item.opts.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}"> ${o.o}</label>`).join("")}
      <p class="qfb" data-fb="${i}" style="display:none;margin:6px 0 0;font-size:.92rem"></p>
    </div>`).join("");
  document.getElementById("quizResult").textContent="";
  document.getElementById("checkQuiz").onclick=()=>{
    let n=0;
    qOrder.forEach((item,i)=>{
      const sel=document.querySelector(`input[name=q${i}]:checked`);
      const fb=document.querySelector(`[data-fb="${i}"]`);
      const correctIdx=item.opts.findIndex(o=>o.correct);
      fb.style.display="block";
      if(sel && +sel.value===correctIdx){ n++; fb.className="qfb good"; fb.textContent="✓ Correct. "+item.fb; }
      else { fb.className="qfb bad"; fb.textContent="✗ Check: "+item.fb; }
    });
    const r=document.getElementById("quizResult");
    r.textContent=`Result: ${n}/${qOrder.length}`;
    r.className = n===qOrder.length ? "good" : (n>=qOrder.length/2 ? "" : "bad");
  };
  document.getElementById("resetQuiz").onclick=quiz;
}

/* ---------- Arranque ---------- */
document.getElementById("theme").onclick=()=>{document.body.classList.toggle("dark");redraw();showPol(document.getElementById("polSelect").value);};
const comparaVisible=()=>document.getElementById("compara")?.classList.contains("active");
document.getElementById("loneToggle").onchange=()=>{redraw(); if(comparaVisible()) compare();};
document.getElementById("dipoleToggle").onchange=()=>{redraw(); if(comparaVisible()) compare();};
document.getElementById("exportMol").onclick=()=>exportCanvas("molCanvas","geomol_"+document.getElementById("molSelect").value);
document.getElementById("exportPol").onclick=()=>exportCanvas("polCanvas","geomol_polaridad_"+document.getElementById("polSelect").value);
document.getElementById("practiceToggle").onclick=()=>{
  practice=!practice;
  const b=document.getElementById("practiceToggle");
  b.setAttribute("aria-pressed",practice?"true":"false"); b.textContent=practice?"Exit practice mode":"Practice mode";
  selectMol(document.getElementById("molSelect").value);
};
document.getElementById("printAnswers").onclick=()=>{
  const box=document.getElementById("answerKey");
  box.innerHTML="<h2>Answer key — GeoMol</h2>"+qOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Correct answer: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
  box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
};
tabs(); setupSelects(); setupDrag(); setupBuild(); compare(); quiz(); loop();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{redraw();showPol(document.getElementById("polSelect").value);compare();});
try{
  const qp=new URLSearchParams(location.search).get("mol");
  if(qp && MOLS[qp]){ document.getElementById("molSelect").value=qp; selectMol(qp); document.querySelector('.tab[data-tab="explora"]').click(); }
}catch(e){}
