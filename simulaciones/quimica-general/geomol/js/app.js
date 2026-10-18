window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};
/* GeoMol — motor de visualización 3D (sin dependencias externas)
   Reescrito: esferas con iluminación, radios tipo CPK, orbitales p como lóbulos,
   suma vectorial real de dipolos, rotación por teclado y respeto a prefers-reduced-motion. */

/* ---------- Datos de geometría VSEPR ---------- */
const GEOM = {
  "AX2":   {eg:"lineal",                 mg:"lineal",              ang:"180°",             hyb:"sp",   pts:[[1,0,0],[-1,0,0]], lp:[]},
  "AX3":   {eg:"trigonal plana",         mg:"trigonal plana",      ang:"120°",             hyb:"sp²",  pts:[[1,0,0],[-.5,.866,0],[-.5,-.866,0]], lp:[]},
  "AX2E":  {eg:"trigonal plana",         mg:"angular",             ang:"<120°",            hyb:"sp²",  pts:[[.7,.72,0],[.7,-.72,0]], lp:[[-1,0,0]]},
  "AX4":   {eg:"tetraédrica",            mg:"tetraédrica",         ang:"109,5°",           hyb:"sp³",  pts:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]], lp:[]},
  "AX3E":  {eg:"tetraédrica",            mg:"piramidal trigonal",  ang:"≈107°",            hyb:"sp³",  pts:[[1,1,1],[-1,-1,1],[-1,1,-1]], lp:[[1,-1,-1]]},
  "AX2E2": {eg:"tetraédrica",            mg:"angular",             ang:"≈104,5°",          hyb:"sp³",  pts:[[1,1,1],[-1,-1,1]], lp:[[-1,1,-1],[1,-1,-1]]},
  "AX5":   {eg:"bipiramidal trigonal",   mg:"bipiramidal trigonal",ang:"90°, 120°, 180°",  hyb:"sp³d (etiqueta VSEPR tradicional)", pts:[[1,0,0],[-.5,.866,0],[-.5,-.866,0],[0,0,1],[0,0,-1]], lp:[]},
  "AX4E":  {eg:"bipiramidal trigonal",   mg:"balancín",            ang:"<90°, <120°",      hyb:"sp³d (tradicional)", pts:[[1,0,0],[-.5,.866,0],[0,0,1],[0,0,-1]], lp:[[-.5,-.866,0]]},
  "AX3E2": {eg:"bipiramidal trigonal",   mg:"forma de T",          ang:"≈90°, 180°",       hyb:"sp³d (tradicional)", pts:[[1,0,0],[0,0,1],[0,0,-1]], lp:[[-.5,.866,0],[-.5,-.866,0]]},
  "AX2E3": {eg:"bipiramidal trigonal",   mg:"lineal",              ang:"180°",             hyb:"sp³d (tradicional)", pts:[[0,0,1],[0,0,-1]], lp:[[1,0,0],[-.5,.866,0],[-.5,-.866,0]]},
  "AX6":   {eg:"octaédrica",             mg:"octaédrica",          ang:"90°, 180°",        hyb:"sp³d² (etiqueta VSEPR tradicional)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], lp:[]},
  "AX5E":  {eg:"octaédrica",             mg:"piramidal cuadrada",  ang:"≈90°, 180°",       hyb:"sp³d² (tradicional)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]], lp:[[0,0,-1]]},
  "AX4E2": {eg:"octaédrica",             mg:"cuadrada plana",      ang:"90°, 180°",        hyb:"sp³d² (tradicional)", pts:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]], lp:[[0,0,1],[0,0,-1]]}
};

const MOLS = {
  "CO2": {name:"CO₂", ax:"AX2",   pol:"apolar", center:"C",  outer:["O","O"], ex:"Los dos dipolos C→O tienen igual magnitud y direcciones opuestas; se cancelan."},
  "BF3": {name:"BF₃", ax:"AX3",   pol:"apolar", center:"B",  outer:["F","F","F"], ex:"Tres dipolos B→F se cancelan por la simetría trigonal plana."},
  "SO2": {name:"SO₂", ax:"AX2E",  pol:"polar",  center:"S",  outer:["O","O"], ex:"La forma angular impide que los dipolos S→O se cancelen."},
  "CH4": {name:"CH₄", ax:"AX4",   pol:"apolar", center:"C",  outer:["H","H","H","H"], ex:"Los pequeños dipolos C–H se compensan aproximadamente por simetría tetraédrica."},
  "NH3": {name:"NH₃", ax:"AX3E",  pol:"polar",  center:"N",  outer:["H","H","H"], ex:"La geometría piramidal trigonal produce un momento dipolar neto (reforzado por el par libre)."},
  "H2O": {name:"H₂O", ax:"AX2E2", pol:"polar",  center:"O",  outer:["H","H"], ex:"La forma angular produce un momento dipolar neto."},
  "PCl5":{name:"PCl₅",ax:"AX5",   pol:"apolar", center:"P",  outer:["Cl","Cl","Cl","Cl","Cl"], ex:"En el modelo ideal de bipirámide trigonal, los dipolos equivalentes se cancelan."},
  "SF4": {name:"SF₄", ax:"AX4E",  pol:"polar",  center:"S",  outer:["F","F","F","F"], ex:"La forma de balancín es asimétrica y deja un dipolo neto."},
  "ClF3":{name:"ClF₃",ax:"AX3E2", pol:"polar",  center:"Cl", outer:["F","F","F"], ex:"La forma de T no cancela todos los dipolos."},
  "XeF2":{name:"XeF₂",ax:"AX2E3", pol:"apolar", center:"Xe", outer:["F","F"], ex:"La molécula es lineal y los dipolos Xe–F opuestos se cancelan."},
  "SF6": {name:"SF₆", ax:"AX6",   pol:"apolar", center:"S",  outer:["F","F","F","F","F","F"], ex:"La simetría octaédrica cancela los dipolos equivalentes."},
  "BrF5":{name:"BrF₅",ax:"AX5E",  pol:"polar",  center:"Br", outer:["F","F","F","F","F"], ex:"La pirámide cuadrada es asimétrica y produce un dipolo neto."},
  "XeF4":{name:"XeF₄",ax:"AX4E2", pol:"apolar", center:"Xe", outer:["F","F","F","F"], ex:"La geometría cuadrada plana cancela los cuatro dipolos Xe–F."}
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
      ctx.fillText("μ neto", ex+6, ey);
      ctx.restore();
    } else {
      ctx.restore();
      ctx.fillStyle=P.success; ctx.font="bold 15px Inter, sans-serif"; ctx.textAlign="center";
      ctx.fillText("μ neto ≈ 0", W/2, H-22);
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
  document.getElementById("molExplain").textContent=`${m.ax}: ${g.pts.length} átomos enlazados y ${g.lp.length} par(es) libre(s) en el átomo central.`;
  document.getElementById("polExplain").textContent=m.ex;
  drawMolecule(document.getElementById("molCanvas"), k, "explore");
  const infoPanel=document.getElementById("infoPanel"), box=document.getElementById("practiceBox");
  if(practice){
    infoPanel.style.display="none"; box.style.display="block";
    box.innerHTML=`<p><strong>${m.name}</strong> — antes de mirar los datos, predice:</p>
      <label>Notación AXₙEₘ <input id="guessAx" type="text" placeholder="ej: AX2E2" style="width:110px"></label>
      <label style="margin-left:8px">Geometría molecular <input id="guessGeo" type="text" placeholder="ej: angular" style="width:170px"></label>
      <button id="revealAnswer" class="btn primary" type="button" style="margin-left:8px">Revelar</button>
      <p id="practiceFeedback" class="muted" style="margin-top:8px"></p>`;
    document.getElementById("revealAnswer").onclick=()=>{
      const ax=(document.getElementById("guessAx").value||"").trim().toUpperCase().replace(/\s/g,"");
      const geoRaw=(document.getElementById("guessGeo").value||"").trim();
      const okAx=ax===m.ax, okGeo=matchesGeometry(geoRaw,g.mg);
      document.getElementById("practiceFeedback").innerHTML=(okAx?"✓":"✗")+` AXₙEₘ: tu respuesta ${ax||"(vacío)"}, correcta <strong>${m.ax}</strong>. `+(okGeo?"✓":"✗")+` Geometría correcta: <strong>${g.mg}</strong>.`;
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
    "Modelo molecular 3D. Arrastra con el mouse, usa dos dedos en pantallas táctiles, o las flechas del teclado para rotar."
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
    document.getElementById("buildEg").textContent="combinación no incluida";
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
    "Modelo 3D de polaridad. Arrastra con el mouse, usa dos dedos en pantallas táctiles, o las flechas del teclado para rotar.");
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
      `Modelo 3D de ${MOLS[k].name}. Arrastra o usa las flechas para rotar.`);
  });
}

/* ---------- Mini-desafío con retroalimentación ---------- */
const Q=[
  ["AX₃E corresponde a:",["tetraédrica","piramidal trigonal","angular","lineal"],1,
   "AX₃E tiene 4 dominios electrónicos (geometría electrónica tetraédrica) pero un par libre, así que la forma molecular es piramidal trigonal."],
  ["¿Por qué CO₂ es apolar aunque C=O sea polar?",["no hay dipolos","los dipolos se cancelan por la geometría lineal","C y O tienen igual electronegatividad","porque es AX₂E₂"],1,
   "Cada enlace C=O es polar, pero al ser lineal (AX₂) los dos dipolos opuestos se anulan: μ neto ≈ 0."],
  ["Orden correcto de ángulos:",["H₂O > NH₃ > CH₄","CH₄ > NH₃ > H₂O","NH₃ > CH₄ > H₂O","todos 109,5°"],1,
   "Los pares libres comprimen el ángulo: CH₄ (109,5°) > NH₃ (≈107°) > H₂O (≈104,5°)."],
  ["XeF₄ es:",["tetraédrica polar","cuadrada plana apolar","lineal polar","balancín"],1,
   "XeF₄ es AX₄E₂: los dos pares libres se ubican en posiciones axiales opuestas y la molécula queda cuadrada plana y apolar."],
  ["SF₄ (AX₄E) tiene forma de:",["tetraedro","balancín","cuadrado plano","pirámide trigonal"],1,
   "Con 5 dominios y 1 par libre ecuatorial, la forma molecular resultante es de balancín (see-saw)."],
  ["¿Cuál de estas moléculas es polar?",["CO₂","BF₃","SF₆","SO₂"],3,
   "SO₂ es angular (AX₂E): sus dipolos S→O no se cancelan. Las otras tres son simétricas y apolares."],
  ["En VSEPR, un enlace doble cuenta como:",["dos dominios electrónicos","un dominio electrónico","medio dominio","depende del átomo"],1,
   "Cada enlace (simple, doble o triple) ocupa una sola dirección en el espacio: un dominio electrónico."],
  ["¿Por qué el par libre comprime los ángulos de enlace?",["ocupa menos espacio que un enlace","se ubica más lejos del núcleo","ejerce mayor repulsión al estar más cerca del átomo central","no tiene efecto"],2,
   "El par libre está retenido solo por el átomo central, se concentra más cerca de él y repele más a los pares enlazantes, cerrando los ángulos."]
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
      if(sel && +sel.value===correctIdx){ n++; fb.className="qfb good"; fb.textContent="✓ Correcto. "+item.fb; }
      else { fb.className="qfb bad"; fb.textContent="✗ Revisa: "+item.fb; }
    });
    const r=document.getElementById("quizResult");
    r.textContent=`Resultado: ${n}/${qOrder.length}`;
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
  b.setAttribute("aria-pressed",practice?"true":"false"); b.textContent=practice?"Salir de modo práctica":"Modo práctica";
  selectMol(document.getElementById("molSelect").value);
};
document.getElementById("printAnswers").onclick=()=>{
  const box=document.getElementById("answerKey");
  box.innerHTML="<h2>Clave de respuestas — GeoMol</h2>"+qOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Respuesta correcta: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
  box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
};
tabs(); setupSelects(); setupDrag(); setupBuild(); compare(); quiz(); loop();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{redraw();showPol(document.getElementById("polSelect").value);compare();});
try{
  const qp=new URLSearchParams(location.search).get("mol");
  if(qp && MOLS[qp]){ document.getElementById("molSelect").value=qp; selectMol(qp); document.querySelector('.tab[data-tab="explora"]').click(); }
}catch(e){}
