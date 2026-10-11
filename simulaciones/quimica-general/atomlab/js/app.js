window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};

const EVENTS=[
{y:"1803–1808",t:"Dalton",k:"Modelo",e:"Leyes de conservación de la masa, proporciones definidas y proporciones múltiples, desarrolladas a partir del trabajo experimental de varios químicos.",x:"La materia puede interpretarse como formada por unidades discretas características de cada elemento.",l:"No contiene estructura interna ni explica electricidad, espectros o isótopos.",note:"Dalton sintetizó evidencia química previa; no hubo un único 'experimento de Dalton' que produjera el modelo.",v:"dalton"},
{y:"1897",t:"Thomson",k:"Descubrimiento + modelo",e:"Desviación de rayos catódicos mediante campos eléctricos y magnéticos; la relación carga/masa era independiente del material del cátodo.",x:"El átomo es divisible y contiene partículas negativas: electrones.",l:"El modelo de carga positiva difusa no predijo las grandes desviaciones de partículas α.",note:"El experimento de Millikan midió posteriormente la carga elemental y complementó la caracterización del electrón.",v:"thomson"},
{y:"1909 / 1911",t:"Rutherford",k:"Experimento → modelo nuclear",e:"Geiger y Marsden observaron la dispersión de partículas α en láminas metálicas; muy pocas se desviaban a ángulos muy grandes.",x:"La carga positiva y casi toda la masa están concentradas en un núcleo muy pequeño; gran parte del átomo es espacio vacío.",l:"La electrodinámica clásica no explica la estabilidad de electrones orbitando ni los espectros discretos.",note:"El experimento se realizó en 1909; Rutherford publicó la interpretación nuclear en 1911.",v:"rutherford"},
{y:"1913",t:"Bohr",k:"Modelo",e:"El espectro lineal del hidrógeno y la necesidad de explicar su estabilidad inspiraron estados estacionarios cuantizados.",x:"Para H, los niveles de energía cuantizados explican con éxito las frecuencias del espectro.",l:"No describe adecuadamente átomos multielectrónicos ni la estructura fina completa; conserva órbitas definidas.",note:"Es un modelo históricamente crucial y aún útil para introducir niveles energéticos, pero no es la descripción cuántica moderna.",v:"bohr"},
{y:"1924",t:"de Broglie",k:"Hipótesis teórica",e:"La dualidad onda-partícula conocida para la luz sugirió asociar una longitud de onda a la materia.",x:"Abrió la posibilidad de describir al electrón con propiedades ondulatorias.",l:"Necesitaba confirmación experimental y una formulación dinámica completa.",note:"de Broglie no propuso un nuevo 'modelo planetario'; introdujo una relación conceptual decisiva para la mecánica cuántica.",v:"wave"},
{y:"1926",t:"Schrödinger",k:"Teoría cuántica",e:"La formulación ondulatoria de la mecánica cuántica permitió calcular estados estacionarios y distribuciones espaciales.",x:"Los electrones se describen por estados cuánticos y orbitales; no por trayectorias clásicas determinadas.",l:"La interpretación requiere conceptos probabilísticos y otras extensiones para una descripción relativista completa.",note:"Un orbital no es una órbita ni una superficie rígida: representa información sobre un estado y una distribución de probabilidad.",v:"quantum"},
{y:"1927",t:"Davisson–Germer",k:"Experimento",e:"Un haz de electrones dispersado por un cristal de níquel produjo máximos de difracción compatibles con una longitud de onda de de Broglie.",x:"Proporcionó evidencia experimental directa del comportamiento ondulatorio de electrones.",l:"Confirma una propiedad cuántica, pero por sí solo no constituye un modelo atómico completo.",note:"Este experimento conecta la hipótesis de de Broglie con la descripción cuántica.",v:"wave"},
{y:"1927",t:"Heisenberg",k:"Principio / teoría",e:"La mecánica cuántica establece límites fundamentales a la preparación simultánea de ciertas variables conjugadas.",x:"Refuerza que no debe imaginarse al electrón con posición y momento clásicos perfectamente definidos.",l:"No es un modelo pictórico del átomo; es una propiedad de la teoría cuántica.",note:"La incertidumbre no es simplemente un problema de instrumentos defectuosos.",v:"quantum"},
{y:"1932",t:"Chadwick",k:"Descubrimiento",e:"Bombardeo de berilio con partículas α produjo una radiación neutra capaz de expulsar protones de materiales ricos en hidrógeno.",x:"Identificó el neutrón y completó la descripción básica de la composición nuclear.",l:"No constituye por sí solo un 'modelo de Chadwick' equivalente a Dalton, Thomson o Bohr.",note:"El neutrón explica mejor la masa nuclear e isotopía, dentro de una imagen nuclear ya establecida.",v:"nucleus"}
];
function setupTabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")})}
const RM=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function defs(){return `<defs>
<radialGradient id="nuc" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#8fd0e8"/><stop offset="0.5" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></radialGradient>
<radialGradient id="ele" cx="36%" cy="32%" r="72%"><stop offset="0" stop-color="#d8c6ef"/><stop offset="1" stop-color="var(--purple)"/></radialGradient>
<radialGradient id="pos" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="var(--soft)"/><stop offset="1" stop-color="rgba(41,137,179,0.05)"/></radialGradient>
<marker id="arrp" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--purple)"/></marker>
</defs>`;}
function nucleus(cx,cy,r){return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:url(#nuc)"/><ellipse cx="${cx-r*0.32}" cy="${cy-r*0.36}" rx="${r*0.34}" ry="${r*0.24}" fill="rgba(255,255,255,0.55)"/>`;}
function electron(cx,cy,r){return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:url(#ele)"/><circle cx="${cx-r*0.35}" cy="${cy-r*0.4}" r="${r*0.28}" fill="rgba(255,255,255,0.6)"/>`;}
function orbiter(inner,dur,phase,cx,cy){
  cx=cx==null?350:cx; cy=cy==null?180:cy;
  const p0=(phase||0)*180/Math.PI;                 // desfase inicial en grados
  if(RM){                                            // sin animación: colocar en el ángulo de fase
    return `<g transform="rotate(${p0} ${cx} ${cy})">${inner}</g>`;
  }
  return `<g><animateTransform attributeName="transform" type="rotate" from="${p0} ${cx} ${cy}" to="${p0+360} ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite"/>${inner}</g>`;
}
function modelSVG(v){let h=defs();
if(v==="dalton")h+=`<circle cx="350" cy="180" r="95" style="fill:url(#nuc)"/><ellipse cx="322" cy="150" rx="30" ry="20" fill="rgba(255,255,255,0.45)"/><text x="350" y="300" text-anchor="middle" fill="var(--muted)">esfera maciza e indivisible, sin estructura interna</text>`;
if(v==="thomson"){
  // "budín de pasas" fiel a la propuesta: esfera de carga positiva difusa con
  // corpúsculos (electrones) incrustados en anillos, como planteó Thomson (1904)
  h+=`<circle cx="350" cy="180" r="115" style="fill:url(#pos)" stroke="var(--accent)" stroke-width="3"/>`;
  for(let i=0;i<10;i++){const a=i*Math.PI/5+0.3;h+=`<text x="${350+78*Math.cos(a)}" y="${184+78*Math.sin(a)}" text-anchor="middle" fill="var(--accent)" opacity="0.55" font-size="15">+</text>`;}
  for(let i=0;i<5;i++){const a=i*2*Math.PI/5-Math.PI/2;h+=electron(350+52*Math.cos(a),180+52*Math.sin(a),10);}
  h+=electron(350,180,10);
  h+=`<circle cx="350" cy="180" r="52" fill="none" stroke="var(--purple)" stroke-width="1" stroke-dasharray="3 5" opacity="0.5"/>`;
  h+=`<text x="350" y="330" text-anchor="middle" fill="var(--muted)">esfera positiva difusa con corpúsculos en anillos (budín de pasas)</text>`}
if(v==="rutherford"){
  // 1911: núcleo diminuto y átomo casi vacío. Se muestran electrones en órbitas,
  // pero el modelo NO explica por qué serían estables (su límite, indicado en el pie).
  h+=`<circle cx="350" cy="180" r="150" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="2 7" opacity="0.55"/>`;
  const RO=[[70,0],[104,2.1],[134,4.0]];
  RO.forEach(([r,a0],i)=>{
    h+=`<circle cx="350" cy="180" r="${r}" fill="none" stroke="var(--purple)" stroke-width="1.4" opacity="0.45"/>`;
    h+=orbiter(electron(350+r,180,7),12+i*6,a0);
  });
  h+=nucleus(350,180,6);
  h+=`<text x="350" y="322" text-anchor="middle" fill="var(--muted)">núcleo diminuto y átomo casi vacío; el modelo no explica por qué las órbitas serían estables</text>`;
  h+=`<text x="350" y="342" text-anchor="middle" fill="var(--muted)" font-size="11">a escala real: si el átomo midiera 100 m, el núcleo mediría ~1 mm</text>`}
if(v==="nucleus"){
  // Chadwick (1932): la novedad es la composición del núcleo. Electrones en una órbita
  // visible alrededor y, al costado, una vista ampliada del núcleo con p⁺ y n⁰.
  h+=`<circle cx="300" cy="180" r="120" fill="none" stroke="var(--purple)" stroke-width="1.4" opacity="0.45"/>`;
  h+=orbiter(electron(420,180,7),13,0,300,180)+orbiter(electron(180,180,7),19,3.14159,300,180);
  h+=nucleus(300,180,11);
  // vista ampliada del núcleo (recuadro a la derecha)
  const bx=560,by=180;
  h+=`<circle cx="${bx}" cy="${by}" r="46" fill="var(--panel2)" stroke="var(--border)" stroke-width="1"/>`;
  h+=`<line x1="311" y1="180" x2="${bx-46}" y2="${by}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>`;
  const NP=[[bx,by-16,"p"],[bx+16,by-6,"n"],[bx-16,by-4,"n"],[bx+2,by+2,"p"],[bx-14,by+14,"p"],[bx+16,by+14,"n"],[bx,by+18,"n"]];
  NP.forEach(([x,y,t])=>{
    h+= t==="p" ? `<circle cx="${x}" cy="${y}" r="9" style="fill:url(#nuc)"/><text x="${x}" y="${y+3.5}" text-anchor="middle" font-size="11" fill="#fff">+</text>`
                : `<circle cx="${x}" cy="${y}" r="9" fill="#9aa3ad"/><circle cx="${x-3}" cy="${y-3}" r="2.4" fill="rgba(255,255,255,0.6)"/>`;
  });
  h+=`<text x="${bx}" y="${by+64}" text-anchor="middle" fill="var(--muted)" font-size="11">núcleo: protones (+) y neutrones (n⁰)</text>`;
  h+=`<text x="300" y="322" text-anchor="middle" fill="var(--muted)">el neutrón explica la masa nuclear y la existencia de isótopos</text>`}
if(v==="bohr"){
  // radios fieles a r ∝ n² (16, 64, 144) y emisión de un fotón en la transición 3→2
  h+=nucleus(350,180,10);
  [[16,1],[64,2],[144,3]].forEach(([r,n])=>{
    h+=`<circle class="orbit" cx="350" cy="180" r="${r}"/>`;
    h+=`<text x="${350+r+8}" y="176" fill="var(--muted)" font-size="11">n=${n}</text>`;
  });
  h+=orbiter(electron(414,180,8),12);
  h+=`<path d="M 350 36 L 350 112" stroke="var(--purple)" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#arrp)"/>`;
  h+=`<path d="M 356 60 q 8 6 0 12 q -8 6 0 12 q 8 6 0 12" fill="none" stroke="var(--orangeTone,#d98a2b)" stroke-width="2"/>`;
  h+=`<text x="374" y="70" fill="var(--muted)" font-size="11">fotón: ΔE = hν</text>`;
  h+=`<text x="350" y="345" text-anchor="middle" fill="var(--muted)">órbitas cuantizadas con r ∝ n²; saltar entre niveles emite o absorbe luz</text>`}
if(v==="wave"){
  // de Broglie fiel a la propuesta: onda ESTACIONARIA circular, nλ = 2πr (aquí n=6)
  h+=nucleus(350,180,9);
  let d="",R=110,A=16,n=6;
  for(let i=0;i<=360;i++){const t=i*Math.PI/180;const r=R+A*Math.cos(n*t);
    d+=(i===0?"M":"L")+(350+r*Math.cos(t)).toFixed(1)+" "+(180+r*Math.sin(t)).toFixed(1);}
  h+=`<path d="${d} Z" fill="none" stroke="var(--purple)" stroke-width="3.5"/>`;
  h+=`<circle cx="350" cy="180" r="${R}" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 6" opacity="0.5"/>`;
  h+=`<text x="350" y="330" text-anchor="middle" fill="var(--muted)">onda estacionaria: solo caben órbitas donde n·λ = 2πr (aquí n = 6)</text>`}
if(v==="quantum"){
  // nube de probabilidad como densidad de puntos (mayor cerca del núcleo), no órbitas
  let seed=42;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let i=0;i<340;i++){
    const u=rnd(),ang=rnd()*2*Math.PI;
    const r=-46*Math.log(1-u*0.985);           // decaimiento exponencial tipo 1s
    if(r>150)continue;
    h+=`<circle cx="${(350+r*Math.cos(ang)).toFixed(1)}" cy="${(180+r*Math.sin(ang)*0.92).toFixed(1)}" r="1.6" fill="var(--purple)" opacity="${(0.75*Math.exp(-r/70)+0.08).toFixed(2)}"/>`;
  }
  h+=nucleus(350,180,8);
  h+=`<text x="350" y="335" text-anchor="middle" fill="var(--muted)">densidad de probabilidad |ψ|²: dónde es más probable encontrar al electrón</text>`}
return h}
function history(){let T=document.getElementById("timeline");EVENTS.forEach((e,i)=>{let d=document.createElement("button");d.className="era";d.innerHTML=`<strong>${e.y}</strong><br>${e.t}<br><small>${e.k}</small>`;d.onclick=()=>showEvent(i);T.appendChild(d)});showEvent(0)}
function showEvent(i){let e=EVENTS[i];document.querySelectorAll(".era").forEach((x,j)=>x.classList.toggle("active",i===j));document.getElementById("yearBadge").textContent=e.y;document.getElementById("kindBadge").textContent=e.k;document.getElementById("modelTitle").textContent=e.t;document.getElementById("evidence").textContent=e.e;document.getElementById("explained").textContent=e.x;document.getElementById("limits").textContent=e.l;document.getElementById("historyNote").textContent=e.note;const svg=document.getElementById("modelSvg");const box=document.getElementById("atomBox");if(window.Atom3D&&Atom3D.show(e.v)){svg.hidden=true;box.setAttribute("aria-label",`${e.t} (${e.y}), modelo 3D. ${e.x}`)}else{document.getElementById("atom3d").style.display="none";svg.hidden=false;svg.innerHTML=modelSVG(e.v);svg.setAttribute("role","img");svg.setAttribute("aria-label",`${e.t} (${e.y}). ${e.e} ${e.x}`)}}
const dec=x=>String(x).replace(".",",");   // convención latinoamericana: coma decimal
const canvas=document.getElementById("expCanvas"),ctx=canvas.getContext("2d");let particles=[];
function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--panel2");ctx.fillRect(0,0,canvas.width,canvas.height)}
function experiment(){let type=document.getElementById("expSelect").value,v=+document.getElementById("expRange").value;clear();if(type==="thomson")drawThomson(v);if(type==="millikan")drawMillikan(v);if(type==="rutherford")drawRutherford(v);if(type==="bohr")drawBohr(v);if(type==="davisson")drawDavisson(v);
  const parts=["expTitle","expQuestion","expObservation","expInference"].map(id=>document.getElementById(id).textContent).filter(Boolean);
  canvas.setAttribute("aria-label", parts.join(". "));
}
function drawMillikan(v){
  document.getElementById("expTitle").textContent="Gota de aceite de Millikan";
  document.getElementById("expQuestion").textContent="¿Qué voltaje deja la gota suspendida, y qué revela ese equilibrio sobre la carga?";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted"),text=getComputedStyle(document.body).getPropertyValue("--text");
  const VEQ=60, nQ=3;                                 // esta gota lleva q = 3e; equilibrio en V = 60
  // cámara + atomizador + gotas de contexto
  ctx.strokeStyle=muted;ctx.lineWidth=2;ctx.setLineDash([6,5]);
  ctx.strokeRect(150,38,400,312);ctx.setLineDash([]);
  ctx.fillStyle=muted;ctx.beginPath();ctx.arc(112,70,13,0,Math.PI*2);ctx.fill();
  ctx.fillRect(122,64,32,12);
  ctx.beginPath();ctx.moveTo(154,66);ctx.lineTo(170,70);ctx.lineTo(154,74);ctx.closePath();ctx.fill();
  ctx.font="11px Inter,sans-serif";ctx.textAlign="center";ctx.fillStyle=muted;ctx.fillText("atomizador",118,98);
  ctx.fillStyle="rgba(90,100,112,0.45)";
  [[240,120],[300,240],[430,140],[470,265]].forEach(pp=>{ctx.beginPath();ctx.arc(pp[0],pp[1],3.2,0,Math.PI*2);ctx.fill()});
  // placas
  ctx.fillStyle=P.accent;ctx.fillRect(170,55,360,14);ctx.fillRect(170,321,360,14);
  ctx.fillStyle=text;ctx.font="12px Inter,sans-serif";
  ctx.fillText("placa positiva",350,32);ctx.fillText("placa negativa",350,364);
  // dinámica: posición y fuerzas según el voltaje aplicado
  const net=v-VEQ;                                    // >0: sube, <0: cae
  const cy=188 - Math.max(-58,Math.min(58,net*1.5));
  const cx=350;
  const fUp=26+v*0.5, fDn=26+VEQ*0.5;                 // longitudes ∝ qE y mg
  ctx.fillStyle="#3a3f45";ctx.beginPath();ctx.arc(cx,cy,11,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=P.danger;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(cx-40,cy);ctx.lineTo(cx-40,cy-fUp);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-40,cy-fUp);ctx.lineTo(cx-45,cy-fUp+10);ctx.lineTo(cx-35,cy-fUp+10);ctx.closePath();ctx.fillStyle=P.danger;ctx.fill();
  ctx.strokeStyle=P.success;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(cx+40,cy);ctx.lineTo(cx+40,cy+fDn);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+40,cy+fDn);ctx.lineTo(cx+45,cy+fDn-10);ctx.lineTo(cx+35,cy+fDn-10);ctx.closePath();ctx.fillStyle=P.success;ctx.fill();
  ctx.font="12px Inter,sans-serif";
  ctx.fillStyle=P.danger;ctx.textAlign="right";ctx.fillText("qE",cx-48,cy-fUp/2);
  ctx.fillStyle=P.success;ctx.textAlign="left";ctx.fillText("mg",cx+48,cy+fDn/2);
  // estado
  ctx.textAlign="center";ctx.font="bold 13px Inter,sans-serif";
  if(Math.abs(net)<=3){
    ctx.fillStyle="#2c7a52";
    ctx.fillText("⚖ equilibrio: qE = mg",350,300);
    ctx.font="12px Inter,sans-serif";ctx.fillStyle=text;
    ctx.fillText(`q = mg/E = ${nQ}e = ${dec((nQ*1.602).toFixed(3))}×10⁻¹⁹ C`,350,300+18);
  }else{
    ctx.fillStyle=text;
    ctx.fillText(net<0?"la gota cae (qE < mg): sube el voltaje":"la gota asciende (qE > mg): baja el voltaje",350,300);
  }
  document.getElementById("expObservation").textContent=
    Math.abs(net)<=3
    ? `Con el voltaje de equilibrio, la fuerza eléctrica compensa exactamente al peso. Repitiendo con muchas gotas, los valores de q obtenidos son siempre múltiplos enteros de un mismo mínimo: esta gota lleva ${nQ}e.`
    : "Ajusta el voltaje hasta que las dos flechas se igualen y la gota quede suspendida entre las placas. De ese equilibrio (qE = mg) se despeja la carga q de la gota.";
  document.getElementById("expInference").textContent="Inferencia: la carga eléctrica está cuantizada; el valor mínimo común a todas las gotas es la carga elemental, e ≈ 1,602×10⁻¹⁹ C.";
}
function drawThomson(v){
  document.getElementById("expTitle").textContent="Tubo de rayos catódicos (Thomson)";
  document.getElementById("expQuestion").textContent="¿Qué revela la desviación del haz al aplicar un campo eléctrico entre las placas?";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted"),text=getComputedStyle(document.body).getPropertyValue("--text");
  const yAxis=195, volt=v-50;                       // control: voltaje de placas (−50 a +50)
  // tubo
  ctx.strokeStyle=muted;ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(34,118,626,158,26);ctx.stroke();
  // cátodo con brillo
  ctx.fillStyle=P.purple;ctx.fillRect(52,yAxis-26,10,52);
  const glow=ctx.createRadialGradient(66,yAxis,2,66,yAxis,34);
  glow.addColorStop(0,"rgba(138,99,201,0.5)");glow.addColorStop(1,"rgba(138,99,201,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(66,yAxis,34,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=text;ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
  ctx.fillText("cátodo (−)",64,300);
  // ánodo colimador (dos barras con rendija)
  ctx.fillStyle=muted;
  ctx.fillRect(150,126,10,54);ctx.fillRect(150,210,10,58);
  ctx.fillText("ánodo / colimador",158,300);
  // placas de desviación
  const pxa=280,pxb=440;
  ctx.fillStyle=P.accent;ctx.fillRect(pxa,128,pxb-pxa,12);ctx.fillRect(pxa,252,pxb-pxa,12);
  ctx.fillStyle=text;
  ctx.fillText(volt>=0?"placa +":"placa −",(pxa+pxb)/2,120);
  ctx.fillText(volt>=0?"placa −":"placa +",(pxa+pxb)/2,282);
  // flechas de campo E entre placas (de + a −)
  if(Math.abs(volt)>3){
    const dir=volt>=0?1:-1;                          // + arriba → E apunta hacia abajo
    ctx.strokeStyle="rgba(41,137,179,0.5)";ctx.lineWidth=1.4;
    for(let x=pxa+22;x<pxb-10;x+=36){
      const y1=dir>0?146:246,y2=dir>0?246:146;
      ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-4,y2-8*dir);ctx.lineTo(x+4,y2-8*dir);ctx.closePath();
      ctx.fillStyle="rgba(41,137,179,0.5)";ctx.fill();
    }
  }
  // pantalla fluorescente
  ctx.fillStyle="rgba(44,122,82,0.25)";ctx.fillRect(636,126,14,142);
  ctx.fillStyle=text;ctx.fillText("pantalla",640,300);
  // haz: recto → parábola entre placas → recto hasta la pantalla (deflexión ∝ V)
  const k=volt*0.00028;                              // curvatura ∝ campo, calibrada para no salir del tubo
  ctx.strokeStyle=P.purpleLight;ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(66,yAxis);
  ctx.lineTo(pxa,yAxis);
  let yEnd=yAxis,slope=0;
  for(let x=pxa;x<=pxb;x+=6){const t=x-pxa;const y=yAxis - k*t*t/24;ctx.lineTo(x,y);yEnd=y;slope=-k*(pxb-pxa)/12;}
  const yScreen=yEnd+slope*(643-pxb);
  ctx.lineTo(643,yScreen);ctx.stroke();
  // punto de impacto
  ctx.fillStyle="#2c7a52";ctx.beginPath();ctx.arc(643,Math.max(132,Math.min(262,yScreen)),5,0,Math.PI*2);ctx.fill();
  // lectura
  ctx.fillStyle=text;ctx.font="bold 12px Inter,sans-serif";ctx.textAlign="left";
  ctx.fillText(`voltaje de placas: ${volt>0?"+":""}${volt} (arbitrario)`,46,102);
  ctx.fillStyle=muted;ctx.font="12px Inter,sans-serif";
  ctx.fillText(`desviación en pantalla: ${dec(Math.abs(yAxis-yScreen).toFixed(0))} px, hacia la placa ${volt>=0?"positiva":"negativa"}`,46,86);
  ctx.textAlign="center";
  document.getElementById("expObservation").textContent=
    Math.abs(volt)<4
    ? "Sin campo entre las placas, el haz viaja en línea recta y produce un punto central en la pantalla."
    : `El haz se curva dentro de las placas y llega desplazado a la pantalla, siempre hacia la placa ${volt>=0?"positiva":"negativa"}: las partículas del haz tienen carga negativa. A mayor voltaje, mayor desviación.`;
  document.getElementById("expInference").textContent="Inferencia: los rayos catódicos son partículas con carga negativa y masa (los electrones). Combinando la desviación eléctrica con una magnética, Thomson midió la relación carga/masa (e/m) e infirió que el átomo tiene estructura interna.";
}
function drawRutherford(v){
  document.getElementById("expTitle").textContent="Dispersión de partículas α (Geiger–Marsden–Rutherford)";
  document.getElementById("expQuestion").textContent="¿Cómo se distribuyen las partículas dispersadas en función del ángulo, y qué revela esa distribución?";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted"),text=getComputedStyle(document.body).getPropertyValue("--text");
  const fx=300,fy=176,R=150;
  // energía de las α (control) → distancia de máximo acercamiento d ∝ 1/E
  const d=4+((100-v)/100)*22;
  const theta=bb=>2*Math.atan(d/(2*Math.abs(bb)))*Math.sign(bb);

  // fuente: caja de plomo con rendija
  ctx.fillStyle=muted;ctx.fillRect(30,fy-24,34,48);
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--panel2")||"#eef2f6";
  ctx.fillRect(58,fy-4,8,8);
  ctx.fillStyle=text;ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
  ctx.fillText("fuente α",47,fy+40);ctx.fillText("(radio en plomo)",47,fy+54);

  // pantalla de ZnS en arco (±150°: incluye la retrodispersión, el hallazgo clave)
  // brillo ∝ ley de Rutherford N(θ) ∝ 1/sen⁴(θ/2), en escala logarítmica
  const Imax=Math.log10(1/Math.pow(Math.sin(2*Math.PI/180),4));
  for(let deg=-150;deg<=150;deg+=0.75){
    const th=deg*Math.PI/180;
    let alpha;
    if(Math.abs(deg)<4){ alpha=1; }
    else{
      const L=Math.log10(1/Math.pow(Math.sin(Math.abs(th)/2),4));
      alpha=0.05+0.92*Math.max(0,L/Imax);
    }
    const x1=fx+Math.cos(th)*(R-8),y1=fy+Math.sin(th)*(R-8);
    const x2=fx+Math.cos(th)*(R+8),y2=fy+Math.sin(th)*(R+8);
    ctx.strokeStyle=`rgba(118,84,164,${alpha.toFixed(3)})`;ctx.lineWidth=3.6;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  ctx.strokeStyle=muted;ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(fx,fy,R-10,-150*Math.PI/180,150*Math.PI/180);ctx.stroke();
  ctx.fillStyle=text;ctx.font="11px Inter,sans-serif";
  ctx.fillText("pantalla de ZnS (móvil)",fx+70,fy-R+18);

  // lámina de oro: franja delgada con átomos tenues (casi todo es vacío)
  ctx.fillStyle="rgba(197,163,78,0.35)";ctx.fillRect(fx-4,fy-120,8,240);
  ctx.fillStyle="rgba(122,95,30,0.5)";
  for(let yy=fy-108;yy<=fy+108;yy+=24){ctx.beginPath();ctx.arc(fx,yy,2,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#c5a34e";ctx.beginPath();ctx.arc(fx,fy,4.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=muted;ctx.textAlign="center";
  ctx.fillText("lámina de oro",fx,fy+128);

  // trayectorias con parámetro de impacto (hipérbolas aproximadas)
  const IMP=[-140,-95,-60,-34,-16,-6,6,16,34,60,95,140];
  IMP.forEach(bb=>{
    const th=theta(bb),deg=Math.abs(th*180/Math.PI);
    const col=deg>90?P.danger:(deg>20?P.orange:P.accent);
    ctx.strokeStyle=col;ctx.lineWidth=deg>90?2.6:(deg>20?2:1.4);
    const y0=fy+bb;
    ctx.beginPath();ctx.moveTo(66,y0);
    ctx.lineTo(fx-46,y0);
    const ex=fx+Math.cos(th)*46, ey=y0+Math.sin(th)*46;
    ctx.quadraticCurveTo(fx,y0,ex,ey);
    const reach=R-14-46;
    ctx.lineTo(ex+Math.cos(th)*reach, ey+Math.sin(th)*reach);
    ctx.stroke();
  });

  // lecturas: en la esquina inferior izquierda (zona despejada), sin recuadro de fondo
  const b90=d/2, bmax=150, ratio=Math.max(2,Math.round(bmax/b90));
  ctx.textAlign="left";
  ctx.fillStyle=text;ctx.font="bold 12px Inter,sans-serif";
  ctx.fillText(`energía de las α: ${v} (arbitraria)`,16,326);
  ctx.fillStyle=muted;ctx.font="11px Inter,sans-serif";
  ctx.fillText("acercamiento máximo d ∝ 1/E",16,343);
  ctx.fillText(`distribución en pantalla: N(θ) ∝ 1/sen⁴(θ/2)`,16,360);
  ctx.fillText(`rebote (θ>90°): ~1 de cada ${ratio} aquí; ~1 de cada 8000 real`,16,377);
  ctx.textAlign="center";

  document.getElementById("expObservation").textContent=
    `El brillo de la pantalla cae bruscamente con el ángulo siguiendo N(θ) ∝ 1/sen⁴(θ/2): casi todas las partículas pasan sin desviarse, pero unas pocas —las que se acercan a menos de d del núcleo— se desvían mucho e incluso rebotan (θ > 90°). Con más energía, d disminuye y la retrodispersión se vuelve aún más rara.`;
  document.getElementById("expInference").textContent=
    "Inferencia: solo una carga positiva concentrada en una región diminuta puede producir esa distribución angular. El ajuste cuantitativo de la ley 1/sen⁴(θ/2) fue la evidencia decisiva del núcleo atómico (1911).";
}
function drawBohr(v){
  document.getElementById("expTitle").textContent="Espectro de emisión del hidrógeno";
  document.getElementById("expQuestion").textContent="¿Por qué aparecen líneas discretas, y qué salto de nivel produce cada una?";
  const sel=3+Math.min(3,Math.floor(v/25.01));      // el control selecciona la transición n=3..6 → 2
  const x0=40,x1=660,yTop=34,yBot=94,w=x1-x0;
  ctx.fillStyle="#0a0a0a";ctx.fillRect(x0,yTop,w,yBot-yTop);
  const xOf=l=>x0+(l-400)/300*w;
  const lines=[[410.2,"#8b3ff2",6],[434.0,"#4a5be0",5],[486.1,"#25b7c9",4],[656.3,"#e23b3b",3]];
  ctx.save();
  lines.forEach(([l,c,n])=>{const x=xOf(l);const on=n===sel;
    ctx.globalAlpha=on?1:0.25;ctx.strokeStyle=c;ctx.shadowColor=c;ctx.shadowBlur=on?12:4;ctx.lineWidth=on?5:3.5;
    ctx.beginPath();ctx.moveTo(x,yTop+4);ctx.lineTo(x,yBot-4);ctx.stroke();});
  ctx.restore();
  const muted=getComputedStyle(document.body).getPropertyValue("--muted"),text=getComputedStyle(document.body).getPropertyValue("--text");
  ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
  lines.forEach(([l,,n],i)=>{ctx.fillStyle=n===sel?text:muted;ctx.fillText(dec(l.toFixed(1))+" nm",xOf(l),yBot+(i%2?26:14));});
  // diagrama de niveles (espaciado uniforme por legibilidad; energías reales)
  const dTop=118,dBot=336,dL=90,dR=430,step=(dBot-dTop)/5;
  const En=n=>-13.6/(n*n);
  const yFor=n=>dBot-(n-1)*step;
  ctx.lineWidth=1;ctx.font="11px Inter,sans-serif";
  for(let n=1;n<=6;n++){const y=yFor(n);
    ctx.strokeStyle=muted;ctx.beginPath();ctx.moveTo(dL,y);ctx.lineTo(dR,y);ctx.stroke();
    ctx.fillStyle=text;ctx.textAlign="left";ctx.fillText(`n=${n}`,dR+6,y+4);
    ctx.fillStyle=muted;ctx.textAlign="right";ctx.fillText(`${dec(En(n).toFixed(2))} eV`,dL-6,y+4);}
  const y2=yFor(2);
  lines.forEach(([l,c,nStart],i)=>{const x=dL+40+i*70,yStart=yFor(nStart);const on=nStart===sel;
    ctx.globalAlpha=on?1:0.22;
    ctx.strokeStyle=c;ctx.lineWidth=on?3.2:2;ctx.beginPath();ctx.moveTo(x,yStart);ctx.lineTo(x,y2-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-4,y2-8);ctx.lineTo(x+4,y2-8);ctx.closePath();ctx.fillStyle=c;ctx.fill();
    ctx.globalAlpha=1;});
  // lectura de la transición seleccionada
  const dE=13.6*(0.25-1/(sel*sel)), lam=1240/dE;
  ctx.fillStyle=text;ctx.font="bold 13px Inter,sans-serif";ctx.textAlign="left";
  ctx.fillText(`transición seleccionada: n=${sel} → n=2`,470,150);
  ctx.font="12px Inter,sans-serif";ctx.fillStyle=muted;
  ctx.fillText(`ΔE = ${dec(dE.toFixed(2))} eV`,470,172);
  ctx.fillText(`λ = 1240/ΔE ≈ ${dec(lam.toFixed(0))} nm`,470,190);
  ctx.fillText("mueve el control para elegir",470,214);
  ctx.fillText("otra transición",470,228);
  ctx.fillText("Niveles espaciados de forma uniforme",470,260);
  ctx.fillText("por legibilidad; energías reales.",470,274);
  ctx.textAlign="center";
  document.getElementById("expObservation").textContent=`El hidrógeno emite solo en frecuencias discretas. La transición n=${sel}→2 libera ΔE = ${dec(dE.toFixed(2))} eV, que corresponde a la línea de ≈${dec(lam.toFixed(0))} nm resaltada en el espectro. Todas las líneas visibles de Balmer terminan en n=2.`;
  document.getElementById("expInference").textContent="Inferencia: cada línea es la diferencia de energía entre dos niveles cuantizados, ΔE = hν. Bohr explicó así el espectro del hidrógeno con órbitas de energía fija.";
}
function drawDavisson(v){
  document.getElementById("expTitle").textContent="Difracción de electrones (Davisson–Germer)";
  document.getElementById("expQuestion").textContent="¿Cómo puede un haz de partículas producir máximos de intensidad en ángulos discretos, como lo haría una onda?";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted"),text=getComputedStyle(document.body).getPropertyValue("--text");
  const CX=250,CY=195,R=225;
  // λ de de Broglie relativa al espaciado d del cristal: más energía (control) → λ más corta
  const lam=1.02-(v/100)*0.72;              // λ/d ∈ [0.30, 1.02]
  const N=5;                                 // nº de centros dispersores coherentes (nitidez de máximos)

  // cañón de electrones + haz incidente
  ctx.fillStyle=muted;ctx.fillRect(28,CY-16,44,32);
  ctx.fillStyle=text;ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
  ctx.fillText("cañón de e⁻",50,CY+34);
  ctx.strokeStyle=P.accent;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(72,CY);ctx.lineTo(CX-26,CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX-26,CY);ctx.lineTo(CX-38,CY-6);ctx.lineTo(CX-38,CY+6);ctx.closePath();
  ctx.fillStyle=P.accent;ctx.fill();

  // cristal de níquel: red de átomos
  ctx.fillStyle=muted;
  for(let i=0;i<3;i++)for(let j=0;j<9;j++){
    ctx.beginPath();ctx.arc(CX-6+i*13,CY-64+j*16,3.4,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=text;ctx.fillText("cristal de Ni",CX+4,CY+96);
  ctx.font="10px Inter,sans-serif";ctx.fillStyle=muted;
  ctx.fillText("espaciado d",CX+4,CY+110);

  // pantalla/detector en arco con intensidad ∝ patrón de interferencia de N centros
  const inten=th=>{
    const u=Math.PI*Math.sin(th)/lam;
    if(Math.abs(Math.sin(u))<1e-6) return 1;
    const r=Math.sin(N*u)/(N*Math.sin(u));
    return r*r;
  };
  for(let deg=-72;deg<=72;deg+=0.6){
    const th=deg*Math.PI/180, I=inten(th);
    const x1=CX+Math.cos(th)*(R-9),y1=CY+Math.sin(th)*(R-9);
    const x2=CX+Math.cos(th)*(R+9),y2=CY+Math.sin(th)*(R+9);
    ctx.strokeStyle=`rgba(118,84,164,${0.06+0.94*I})`;ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  ctx.strokeStyle=muted;ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(CX,CY,R-11,-72*Math.PI/180,72*Math.PI/180);ctx.stroke();
  ctx.fillStyle=text;ctx.font="11px Inter,sans-serif";
  ctx.fillText("detector móvil / pantalla",CX+R-62,CY+R-24);

  // rayos hacia los máximos (n = 0, ±1, ±2 mientras |nλ/d| < 1)
  const maxima=[];
  for(let n=-2;n<=2;n++){const sn=n*lam;if(Math.abs(sn)<0.985)maxima.push({n,th:Math.asin(sn)});}
  maxima.forEach(m=>{
    ctx.strokeStyle=m.n===0?"rgba(118,84,164,0.75)":"rgba(118,84,164,0.5)";
    ctx.lineWidth=m.n===0?2.6:2;
    ctx.beginPath();ctx.moveTo(CX,CY);
    ctx.lineTo(CX+Math.cos(m.th)*(R-14),CY+Math.sin(m.th)*(R-14));ctx.stroke();
    if(m.n!==0){
      ctx.fillStyle=text;ctx.font="10px Inter,sans-serif";
      const lx=CX+Math.cos(m.th)*(R-34),ly=CY+Math.sin(m.th)*(R-34);
      ctx.fillText(`n=${m.n>0?"+":""}${m.n}`,lx,ly);
    }
  });

  // lectura numérica
  const th1=maxima.find(m=>m.n===1);
  ctx.fillStyle=text;ctx.font="bold 13px Inter,sans-serif";ctx.textAlign="left";
  ctx.fillText(`λ ≈ ${dec(lam.toFixed(2))}·d`,36,58);
  ctx.font="12px Inter,sans-serif";ctx.fillStyle=muted;
  ctx.fillText("condición de máximos: d·sen θ = n·λ",36,76);
  ctx.fillText(th1?`primer máximo (n=1) en θ ≈ ${(th1.th*180/Math.PI).toFixed(0)}°`:"λ > d: solo sobrevive el máximo central (n=0)",36,94);
  ctx.textAlign="center";

  document.getElementById("expObservation").textContent=
    th1
    ? `La intensidad detectada no es uniforme: presenta máximos nítidos en ángulos discretos. Con la energía actual del haz (λ ≈ ${dec(lam.toFixed(2))}·d), el primer máximo lateral aparece en θ ≈ ${(th1.th*180/Math.PI).toFixed(0)}°. Al aumentar la energía, λ se acorta y los máximos se acercan al centro.`
    : `Con electrones tan lentos, λ (≈ ${dec(lam.toFixed(2))}·d) supera el espaciado del cristal y no puede cumplirse d·sen θ = λ: solo se observa el máximo central. Aumenta la energía del haz para ver aparecer los máximos laterales.`;
  document.getElementById("expInference").textContent="Inferencia: los electrones exhiben interferencia constructiva y destructiva, es decir, comportamiento ondulatorio con λ = h/p, tal como propuso de Broglie (1924) y confirmaron Davisson y Germer (1927).";
}
function comparisons(){let items=[["Dalton","Átomo sin estructura interna","No distingue partículas subatómicas."],["Thomson","Electrones en carga positiva difusa","Introduce el electrón."],["Rutherford","Núcleo pequeño y átomo mayoritariamente vacío","Concentra masa y carga positiva."],["Bohr","Estados energéticos cuantizados","Explica H con órbitas permitidas."],["Cuántico","Estados, orbitales y probabilidades","Abandona trayectorias planetarias definidas."],["Chadwick","Neutrón en el núcleo","Completa la composición nuclear básica."]];document.getElementById("compareGrid").innerHTML=items.map(x=>`<article><span class="badge">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("")}
const QUIZ=[
  ["Según el modelo de Thomson, ante una lámina delgada las partículas α deberían:",["sufrir muchas retrodispersiones","atravesar con desviaciones pequeñas en general","desaparecer","transformarse en electrones"],1,"Con carga positiva difusa (Thomson) no habría un núcleo concentrado, así que se esperaban solo desviaciones pequeñas. Las grandes desviaciones observadas contradijeron el modelo."],
  ["La observación clave del experimento de Rutherford fue:",["un espectro continuo","grandes desviaciones en muy pocas α","que la carga del electrón es positiva","la ausencia de núcleo"],1,"Que una fracción muy pequeña de partículas α se desviara fuertemente reveló una región diminuta con casi toda la masa y la carga positiva: el núcleo."],
  ["¿Qué evidencia apoya directamente la naturaleza ondulatoria de los electrones?",["la ley de Proust","el experimento de Davisson–Germer","la lámina de oro","el experimento de Millikan"],1,"Davisson–Germer observaron máximos de difracción de electrones en un cristal, confirmando la hipótesis ondulatoria de de Broglie."],
  ["En el modelo cuántico moderno, un orbital es:",["una órbita circular","una trayectoria elíptica","un estado cuántico con una distribución espacial de probabilidad asociada","el núcleo"],2,"Un orbital no es una trayectoria: describe un estado cuántico y la distribución de probabilidad de encontrar al electrón."],
  ["El neutrón, descubierto por Chadwick (1932):",["reemplaza al modelo de Bohr","explica mejor la masa nuclear y los isótopos","tiene carga positiva","es lo mismo que un electrón"],1,"El neutrón completó la composición nuclear básica y explica la masa nuclear y la existencia de isótopos, dentro de la imagen nuclear ya establecida."],
  ["El experimento de Millikan demostró que:",["el electrón no tiene masa","la carga eléctrica está cuantizada en múltiplos de e","el núcleo contiene protones","los electrones son ondas"],1,"Todas las gotas tenían cargas múltiplo entero de un mismo valor mínimo: la carga elemental e ≈ 1,602×10⁻¹⁹ C."],
  ["En el espectro de emisión del hidrógeno, cada línea corresponde a:",["un electrón distinto","una transición entre dos niveles de energía","un isótopo","una molécula de H₂"],1,"Cada línea es un salto de un nivel alto a uno más bajo; su color depende de la diferencia de energía ΔE = hν."],
  ["¿Cuántos nodos radiales tiene un orbital 3s del hidrógeno?",["0","1","2","3"],2,"El número de nodos radiales es n − ℓ − 1 = 3 − 0 − 1 = 2: superficies esféricas donde la densidad de probabilidad es cero."],
  ["Un orbital 2p tiene:",["un plano nodal que pasa por el núcleo y ningún nodo radial","una esfera nodal y ningún plano","dos nodos radiales","ningún nodo"],0,"Para ℓ = 1 hay un nodo angular (un plano) y n − ℓ − 1 = 0 nodos radiales."],
  ["Los colores rojo y azul de los lóbulos de un orbital indican:",["carga positiva y negativa","el signo (fase) de la función de onda ψ","dos electrones distintos","la energía del orbital"],1,"Es el signo de ψ. La probabilidad depende de |ψ|², por eso ambas fases son igualmente probables; el signo importa al combinar orbitales (enlaces)."],
  ["¿En qué se diferencia un orbital de una órbita de Bohr?",["son lo mismo con otro nombre","el orbital es una distribución de probabilidad, no una trayectoria","el orbital siempre es esférico","la órbita se calcula con Schrödinger"],1,"Una órbita es una trayectoria definida; un orbital describe un estado cuántico y la probabilidad de encontrar al electrón en cada región."],
  ["Si se aumenta la energía de los electrones en el experimento de difracción, los máximos laterales:",["se alejan del centro","desaparecen siempre","se acercan al centro","no cambian"],2,"Más energía significa mayor momento y λ = h/p más corta; con λ menor, la condición d·sen θ = nλ se cumple a ángulos más pequeños."]
];
let aqOrder=[];
const ashuffle=window.LabUtils.shuffle;
function quiz(){
  aqOrder=ashuffle(QUIZ.map(q=>{const opts=q[1].map((o,j)=>({o,correct:j===q[2]}));return {q:q[0],opts:ashuffle(opts.slice()),fb:q[3]};}));
  let d=document.getElementById("quiz");
  d.innerHTML=aqOrder.map((item,i)=>`<div class="quizq"><strong>${i+1}. ${item.q}</strong>${item.opts.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}"> ${o.o}</label>`).join("")}<p class="qfb" data-fb="${i}" style="display:none;margin:6px 0 0;font-size:.92rem"></p></div>`).join("");
  document.getElementById("checkQuiz").onclick=()=>{let n=0;aqOrder.forEach((item,i)=>{const s=document.querySelector(`input[name=q${i}]:checked`);const fb=document.querySelector(`[data-fb="${i}"]`);const ci=item.opts.findIndex(o=>o.correct);fb.style.display="block";if(s&&+s.value===ci){n++;fb.className="qfb good";fb.textContent="✓ Correcto. "+item.fb;}else{fb.className="qfb bad";fb.textContent="✗ "+item.fb;}});const r=document.getElementById("quizResult");r.textContent=`Resultado: ${n}/${aqOrder.length}`;r.className=n===aqOrder.length?"good":(n>=aqOrder.length/2?"":"bad");};
  document.getElementById("resetQuiz").onclick=quiz;
  document.getElementById("printAnswers").onclick=()=>{
    const box=document.getElementById("answerKey");
    box.innerHTML="<h2>Clave de respuestas — AtomLab</h2>"+aqOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Respuesta correcta: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
    box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
  };
  document.getElementById("quizResult").textContent="";
}
document.getElementById("theme").onclick=()=>{document.body.classList.toggle("dark");experiment();};document.getElementById("runExp").onclick=experiment;document.getElementById("expSelect").onchange=experiment;document.getElementById("expRange").oninput=experiment;setupTabs();history();comparisons();quiz();experiment();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(experiment);
