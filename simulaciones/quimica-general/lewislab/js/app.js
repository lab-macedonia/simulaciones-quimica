window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};

const ATOMS=[
["H",1,1,"Un electrón de valencia; suele formar un enlace."],["C",14,4,"Cuatro electrones de valencia; suele formar cuatro enlaces covalentes."],
["N",15,5,"Cinco electrones de valencia; en moléculas neutras comunes suele formar tres enlaces y un par libre."],
["O",16,6,"Seis electrones de valencia; suele formar dos enlaces y dos pares libres."],["F",17,7,"Siete electrones de valencia; suele formar un enlace."],
["P",15,5,"Cinco electrones de valencia; puede participar en estructuras hipervalentes."],["S",16,6,"Seis electrones de valencia; presenta múltiples patrones de enlace."],
["Cl",17,7,"Siete electrones de valencia; suele formar un enlace en compuestos sencillos."],["Br",17,7,"Siete electrones de valencia."],["I",17,7,"Siete electrones de valencia."]
];
const MOL={
"H2O":{name:"Agua",cls:"Inorgánica",ve:8,charge:0,note:"Dos enlaces O–H y dos pares libres sobre O.",atoms:[["O",360,210],["H",250,300],["H",470,300]],bonds:[[0,1,1],[0,2,1]],lp:[[0,2]],steps:["Contar: O aporta 6 e⁻ y 2 H aportan 2 e⁻.","Elegir O como átomo central y formar dos enlaces simples O–H.","Completar los 8 electrones totales: quedan dos pares libres sobre O.","Verificar: H cumple dueto y O cumple octeto."]},
"CO2":{name:"Dióxido de carbono",cls:"Inorgánica",ve:16,charge:0,note:"Dos enlaces dobles reducen las cargas formales a cero.",atoms:[["O",210,210],["C",360,210],["O",510,210]],bonds:[[0,1,2],[1,2,2]],lp:[[0,2],[2,2]],steps:["Contar 16 electrones de valencia.","Esqueleto O–C–O.","Completar octetos terminales.","El C queda con 4 electrones; convertir pares libres de O en enlaces.","La estructura O=C=O satisface octetos y minimiza cargas formales."]},
"NH3":{name:"Amoníaco",cls:"Inorgánica",ve:8,charge:0,note:"N conserva un par libre.",atoms:[["N",360,205],["H",240,300],["H",360,330],["H",480,300]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,1]],steps:["N aporta 5 e⁻ y 3 H aportan 3 e⁻: total 8.","N es central; formar tres enlaces N–H.","Quedan 2 e⁻, que forman un par libre sobre N.","N alcanza octeto y cada H, dueto."]},
"BF3":{name:"Trifluoruro de boro",cls:"Excepción: octeto incompleto",ve:24,charge:0,note:"El B queda rodeado por 6 electrones en la estructura dominante de Lewis.",atoms:[["B",360,210],["F",230,305],["F",360,70],["F",490,305]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[1,3],[2,3],[3,3]],steps:["Contar 24 e⁻.","B es central; formar tres enlaces B–F.","Completar octetos de F.","No quedan electrones: B queda con seis electrones a su alrededor.","BF₃ es una excepción de octeto incompleto."]},
"NO2":{name:"Dióxido de nitrógeno",cls:"Excepción: electrón impar",ve:17,charge:0,note:"Es un radical: hay un electrón desapareado.",atoms:[["N",360,210],["O",225,210],["O",495,210]],bonds:[[0,1,2],[0,2,1]],lp:[[1,2],[2,3]],rad:[0],steps:["Contar 17 e⁻: el número impar anticipa un radical.","Construir O–N–O y completar electrones.","No es posible dar octeto convencional a todos los átomos con 17 e⁻.","Una representación contiene un enlace doble, uno simple y un electrón desapareado; hay resonancia."]},
"PCl5":{name:"Pentacloruro de fósforo",cls:"Excepción: hipervalente",ve:40,charge:0,note:"Lewis coloca 10 electrones alrededor del P; úsalo como modelo de contabilidad, no como prueba de hibridación d.",atoms:[["P",360,210],["Cl",180,210],["Cl",540,210],["Cl",360,55],["Cl",245,340],["Cl",475,340]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[0,5,1]],lp:[[1,3],[2,3],[3,3],[4,3],[5,3]],steps:["Contar 40 e⁻.","P se ubica al centro y forma cinco enlaces simples P–Cl.","Completar octetos de los Cl.","El esquema de Lewis deja 10 electrones alrededor de P.","La descripción moderna de hipervalencia requiere modelos de enlace más ricos que 'usar orbitales d expandidos'."]},
"CH4":{name:"Metano",cls:"Orgánica",ve:8,charge:0,note:"C forma cuatro enlaces simples.",atoms:[["C",360,210],["H",225,210],["H",495,210],["H",360,70],["H",360,350]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:[],steps:["C aporta 4 e⁻ y 4 H aportan 4 e⁻.","Colocar C central y cuatro H terminales.","Formar cuatro enlaces C–H.","Todos los electrones quedan enlazantes; C tiene octeto."]},
"C2H4":{name:"Eteno",cls:"Orgánica",ve:12,charge:0,note:"La estructura contiene un enlace doble C=C.",atoms:[["C",300,210],["C",420,210],["H",205,120],["H",205,300],["H",515,120],["H",515,300]],bonds:[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],lp:[],steps:["Total: 12 e⁻ de valencia.","Unir los dos C y completar enlaces C–H.","Con solo enlace C–C, cada C queda incompleto.","Formar un segundo enlace entre los C: aparece C=C.","Cada C alcanza octeto."]},
"C2H2":{name:"Etino",cls:"Orgánica",ve:10,charge:0,note:"La estructura contiene un enlace triple C≡C.",atoms:[["H",180,210],["C",310,210],["C",410,210],["H",540,210]],bonds:[[0,1,1],[1,2,3],[2,3,1]],lp:[],steps:["Total: 10 e⁻.","Esqueleto H–C–C–H.","Los C quedan incompletos con enlace simple.","Convertir pares enlazantes adicionales en un triple enlace C≡C.","Cada C alcanza octeto."]},
"CH3OH":{name:"Metanol",cls:"Orgánica",ve:14,charge:0,note:"El O presenta dos pares libres.",atoms:[["C",300,210],["O",430,210],["H",540,210],["H",230,110],["H",190,210],["H",230,310]],bonds:[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1]],lp:[[1,2]],steps:["Contar 14 e⁻.","Conectividad CH₃–O–H.","Formar cinco enlaces simples (10 e⁻).","Colocar los 4 e⁻ restantes como dos pares libres en O.","C y O cumplen octeto; H cumple dueto."]},
"CH3COOH":{name:"Ácido acético",cls:"Orgánica",ve:24,charge:0,note:"El grupo carboxilo combina C=O y C–O–H.",atoms:[["C",220,210],["C",360,210],["O",470,120],["O",470,300],["H",590,300],["H",135,120],["H",100,210],["H",135,300]],bonds:[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[0,5,1],[0,6,1],[0,7,1]],lp:[[2,2],[3,2]],steps:["Contar 24 e⁻.","Usar el esqueleto CH₃–C–O–H con un segundo O unido al C carbonílico.","Completar enlaces C–H y O–H.","Formar C=O para satisfacer el octeto del carbono carbonílico.","Ubicar dos pares libres en cada O."]},
"CO":{name:"Monóxido de carbono",cls:"Cargas formales",ve:10,charge:0,note:"Molécula neutra pero con cargas formales: C es −1 y O es +1. Actívalas con el botón.",atoms:[["C",290,210],["O",450,210]],bonds:[[0,1,3]],lp:[[0,1],[1,1]],steps:["Contar 10 e⁻ de valencia (C: 4, O: 6).","Formar un enlace entre C y O.","Para dar octeto a ambos se necesita un triple enlace C≡O.","Queda un par libre sobre C y otro sobre O.","Las cargas formales son C = −1 y O = +1, aunque la molécula es neutra."]},
"O3":{name:"Ozono, O₃",cls:"Cargas formales · resonancia",ve:18,charge:0,note:"En cada contribuyente el O central es +1 y un O terminal es −1. Actívalas con el botón.",atoms:[["O",240,255],["O",360,165],["O",480,255]],bonds:[[1,0,2],[1,2,1]],lp:[[0,2],[1,1],[2,3]],steps:["Contar 18 e⁻ de valencia.","Esqueleto angular O–O–O.","Formar un enlace doble y uno simple desde el O central.","Completar octetos con pares libres.","El O central queda con carga formal +1 y un O terminal con −1; existe resonancia."]},
"NH4+":{name:"Amonio, NH₄⁺",cls:"Ion poliatómico",ve:8,charge:1,note:"El N forma cuatro enlaces y no tiene par libre: su carga formal es +1. Actívala con el botón.",atoms:[["N",360,205],["H",230,205],["H",490,205],["H",360,80],["H",360,330]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:[],steps:["Contar los e⁻ de valencia: N(5) + 4·H(1) − 1 (por la carga +) = 8.","Colocar N central y cuatro H.","Formar cuatro enlaces N–H.","No quedan pares libres; el N tiene carga formal +1."]},
"H3O+":{name:"Hidronio, H₃O⁺",cls:"Ion poliatómico",ve:8,charge:1,note:"El O forma tres enlaces y conserva un par libre: su carga formal es +1. Actívala con el botón.",atoms:[["O",360,200],["H",240,275],["H",480,275],["H",360,80]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,1]],steps:["Contar los e⁻ de valencia: O(6) + 3·H(1) − 1 = 8.","Colocar O central y tres H.","Formar tres enlaces O–H (6 e⁻).","Quedan 2 e⁻ como un par libre sobre O.","El O tiene carga formal +1."]}
};
const RES={
"O3":{name:"Ozono",forms:[
{atoms:[["O",220,210],["O",360,210],["O",500,210]],bonds:[[0,1,2],[1,2,1]],lp:[[0,2],[1,1],[2,3]],charges:[[1,1],[2,-1]]},
{atoms:[["O",220,210],["O",360,210],["O",500,210]],bonds:[[0,1,1],[1,2,2]],lp:[[0,3],[1,1],[2,2]],charges:[[0,-1],[1,1]]}],
ex:"Los dos enlaces O–O son equivalentes en el híbrido real; los dibujos localizados son contribuyentes."},
"NO3-":{name:"Nitrato, NO₃⁻",forms:[
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,2],[0,2,1],[0,3,1]],lp:[[1,2],[2,3],[3,3]],charges:[[0,1],[2,-1],[3,-1]]},
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,2],[0,3,1]],lp:[[1,3],[2,2],[3,3]],charges:[[0,1],[1,-1],[3,-1]]},
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,1],[0,3,2]],lp:[[1,3],[2,3],[3,2]],charges:[[0,1],[1,-1],[2,-1]]}],
ex:"Los tres enlaces N–O resultan equivalentes por deslocalización; la carga negativa se distribuye sobre los oxígenos."},
"CO3--":{name:"Carbonato, CO₃²⁻",forms:[
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,2],[0,2,1],[0,3,1]],lp:[[1,2],[2,3],[3,3]],charges:[[2,-1],[3,-1]]},
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,2],[0,3,1]],lp:[[1,3],[2,2],[3,3]],charges:[[1,-1],[3,-1]]},
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,1],[0,3,2]],lp:[[1,3],[2,3],[3,2]],charges:[[1,-1],[2,-1]]}],
ex:"Tres contribuyentes equivalentes distribuyen la densidad π y la carga negativa."}
};
const EXC=[
["Octeto incompleto","BF₃, BCl₃, BeCl₂","El átomo central puede quedar con menos de ocho electrones. B en BF₃ tiene seis electrones a su alrededor en la estructura dominante."],
["Electrones impares","NO, NO₂, ClO₂","Un total impar de electrones produce radicales; no todos los átomos pueden alcanzar simultáneamente un octeto convencional."],
["Hipervalencia","PCl₅, SF₄, SF₆, XeF₄","Lewis puede ubicar más de ocho electrones alrededor de átomos de períodos ≥3. Es un esquema contable; no implica por sí mismo hibridación con orbitales d."],
["Dueto","H, He","El hidrógeno se estabiliza con dos electrones alrededor, no ocho."],
["Cargas formales","CO, NO₃⁻, O₃","Las cargas formales ayudan a comparar contribuyentes y a rastrear la contabilidad de electrones."],
["Resonancia","O₃, NO₃⁻, CO₃²⁻, acetato","Una sola estructura de Lewis localizada puede ser insuficiente para representar la deslocalización electrónica."]
];
/* Electrones de valencia por símbolo (para carga formal) */
const VAL={H:1,B:3,Be:2,C:4,N:5,O:6,F:7,P:5,S:6,Cl:7,Br:7,I:7,Xe:8};
/* Carga formal = e⁻ de valencia − e⁻ no enlazantes − nº de enlaces (orden sumado).
   Devuelve solo las cargas ≠ 0 en formato [[i,c],...]. */
function computeFormalCharges(st,includeZero){
  const n=st.atoms.length;
  const nb=Array(n).fill(0);      // electrones no enlazantes
  const bo=Array(n).fill(0);      // suma de órdenes de enlace
  (st.lp||[]).forEach(([i,pairs])=>{ nb[i]+=pairs*2; });
  (st.rad||[]).forEach(i=>{ nb[i]+=1; });
  (st.bonds||[]).forEach(([a,b,o])=>{ bo[a]+=o; bo[b]+=o; });
  const out=[];
  st.atoms.forEach((a,i)=>{
    const v=VAL[a[0]]; if(v==null) return;
    const fc=v-nb[i]-bo[i];
    if(includeZero || fc!==0) out.push([i,fc]);
  });
  return out;
}

function tabSetup(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")})}
function atomSetup(){const s=document.getElementById("atomSelect");ATOMS.forEach((a,i)=>s.add(new Option(`${a[0]} — ${a[2]} e⁻ valencia`,i)));s.value=1;const r=document.getElementById("electronRange");function draw(){const a=ATOMS[+s.value], n=Math.min(+r.value,a[2]);r.max=a[2];if(+r.value>a[2])r.value=a[2];let h=`<span>${a[0]}</span>`;["t1","r1","b1","l1","t2","r2","b2","l2"].slice(0,n).forEach(c=>h+=`<i class="dot ${c}"></i>`);document.getElementById("lewisSymbol").innerHTML=h;document.getElementById("aGroup").textContent=a[1];document.getElementById("aValence").textContent=a[2];document.getElementById("atomExplain").textContent=a[3]}s.onchange=()=>{r.value=ATOMS[+s.value][2];draw()};r.oninput=draw;draw()}
function bondLines(a,b,o){const [,,x1,y1]=["","",a[1],a[2]], x2=b[1], y2=b[2];let dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,px=-dy/L*7,py=dx/L*7;let arr=[];for(let k=0;k<o;k++){let off=(k-(o-1)/2);arr.push(`<line class="bond" x1="${x1+px*off}" y1="${y1+py*off}" x2="${x2+px*off}" y2="${y2+py*off}"/>`)}return arr.join("")}
/* Electronegatividad de Pauling (subconjunto usado por la suite) */
const EN={H:2.20,B:2.04,C:2.55,N:3.04,O:3.44,F:3.98,P:2.19,S:2.58,Cl:3.16,Br:2.96,I:2.66,Xe:2.60};
function polarityArrows(st){
  if(!st.bonds) return "";
  let h="";
  st.bonds.forEach(([a,b])=>{
    const A=st.atoms[a],B=st.atoms[b],chiA=EN[A[0]],chiB=EN[B[0]];
    if(chiA==null||chiB==null||Math.abs(chiA-chiB)<0.35) return;
    const lo=chiA<chiB?A:B, hi=chiA<chiB?B:A;
    const t1=0.30,t2=0.70,x1=lo[1]+(hi[1]-lo[1])*t1,y1=lo[2]+(hi[2]-lo[2])*t1,x2=lo[1]+(hi[1]-lo[1])*t2,y2=lo[2]+(hi[2]-lo[2])*t2;
    const ang=Math.atan2(y2-y1,x2-x1),hl=7;
    h+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke=P.orange stroke-width="2.6"/>`+
       `<polygon points="${x2},${y2} ${x2-hl*Math.cos(ang-0.4)},${y2-hl*Math.sin(ang-0.4)} ${x2-hl*Math.cos(ang+0.4)},${y2-hl*Math.sin(ang+0.4)}" fill=P.orange/>`+
       `<line x1="${x1-6*Math.cos(ang)}" y1="${y1-6*Math.sin(ang)-6}" x2="${x1-6*Math.cos(ang)}" y2="${y1-6*Math.sin(ang)+6}" stroke=P.orange stroke-width="2.4"/>`;
  });
  return h;
}
/* Detecta átomos cuyo total de electrones alrededor (enlazantes + no enlazantes) se aparta
   del octeto esperado (dueto para H). No marca radicales, cuya cuenta impar ya se explica aparte. */
function octetDeviations(st){
  if(!st.atoms) return [];
  const n=st.atoms.length, nb=Array(n).fill(0), bo=Array(n).fill(0);
  (st.lp||[]).forEach(([i,pairs])=>{ nb[i]+=pairs*2; });
  (st.bonds||[]).forEach(([a,b,o])=>{ bo[a]+=o; bo[b]+=o; });
  const rad=new Set(st.rad||[]);
  const out=[];
  st.atoms.forEach((a,i)=>{
    if(rad.has(i)) return;
    const expected = a[0]==="H" ? 2 : 8;
    const count = nb[i] + bo[i]*2;
    if(count!==expected) out.push([i,count,expected]);
  });
  return out;
}
function octetRings(st){
  let h="";
  octetDeviations(st).forEach(([i,count,expected])=>{
    const a=st.atoms[i], over=count>expected, col=over?P.danger:"#9a6418";
    h+=`<circle cx="${a[1]}" cy="${a[2]}" r="36" fill="none" stroke="${col}" stroke-width="2.4" stroke-dasharray="5 4"/>`+
       `<text x="${a[1]}" y="${a[2]+52}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}">${count}e⁻ (${over?"hipervalente":"octeto incompleto"})</text>`;
  });
  return h;
}
function render(svgId,st,showAll=true){const svg=document.getElementById(svgId);let h="";
  st.bonds?.forEach(b=>h+=bondLines(st.atoms[b[0]],st.atoms[b[1]],b[2]));
  if(st.showPolarity) h+=polarityArrows(st);
  st.atoms.forEach((a,i)=>{
    h+=`<circle class="atomNode" cx="${a[1]}" cy="${a[2]}" r="29"/>`+
       `<ellipse cx="${a[1]-8}" cy="${a[2]-10}" rx="13" ry="9" fill="rgba(255,255,255,0.28)"/>`+
       `<text x="${a[1]}" y="${a[2]+8}" text-anchor="middle" fill="var(--text)" font-size="22" font-weight="800">${a[0]}</text>`;
  });
  // pares libres: dos puntos orientados perpendiculares al radio, pegados al átomo
  (st.lp||[]).forEach(([i,n])=>{const a=st.atoms[i];
    for(let k=0;k<n;k++){
      const ang=(-Math.PI/2)+(k*2*Math.PI/Math.max(1,n));
      const cx=a[1]+42*Math.cos(ang), cy=a[2]+42*Math.sin(ang);
      const px=-Math.sin(ang)*4.5, py=Math.cos(ang)*4.5;   // perpendicular al radio
      h+=`<circle class="lp" cx="${cx-px}" cy="${cy-py}" r="3.6"/><circle class="lp" cx="${cx+px}" cy="${cy+py}" r="3.6"/>`;
    }});
  (st.rad||[]).forEach(i=>{const a=st.atoms[i];h+=`<circle class="lp" cx="${a[1]}" cy="${a[2]-45}" r="4"/>`});
  if(st.showOctet) h+=octetRings(st);
  // cargas formales: 0 en gris discreto; ≠0 en círculo destacado
  (st.charges||[]).forEach(([i,c])=>{const a=st.atoms[i];const cx=a[1]+26,cy=a[2]-26;
    if(c===0){
      h+=`<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="12" fill="var(--muted)">0</text>`;
    }else{
      const txt=(c>0?"+":"−")+(Math.abs(c)>1?Math.abs(c):"");
      h+=`<circle cx="${cx}" cy="${cy}" r="11" fill="var(--panel)" stroke="var(--accent2)" stroke-width="1.5"/>`+
         `<text class="charge" x="${cx}" y="${cy+5}" text-anchor="middle" font-size="15">${txt}</text>`;
    }
  });
  svg.innerHTML=h}
let curMol="H2O",step=0,showFC=false;
const GEOMOL_KEYS={"H2O":"H2O","CO2":"CO2","NH3":"NH3","CH4":"CH4","BF3":"BF3","PCl5":"PCl5"};
function molSetup(){const box=document.getElementById("molButtons");Object.keys(MOL).forEach(k=>{let b=document.createElement("button");b.className="molbtn";b.textContent=k;b.onclick=()=>selectMol(k);box.appendChild(b)});
  const fc=document.getElementById("fcToggle");
  if(fc)fc.onclick=()=>{showFC=!showFC;fc.setAttribute("aria-pressed",showFC?"true":"false");fc.classList.toggle("primary",showFC);fc.textContent=showFC?"Ocultar cargas formales":"Mostrar cargas formales";drawMol()};
  const pol=document.getElementById("polToggle");
  if(pol)pol.onclick=()=>{showPol=!showPol;pol.setAttribute("aria-pressed",showPol?"true":"false");pol.classList.toggle("primary",showPol);pol.textContent=showPol?"Ocultar polaridad de enlaces":"Mostrar polaridad de enlaces";drawMol()};
  const oct=document.getElementById("octetToggle");
  if(oct)oct.onclick=()=>{showOctet=!showOctet;oct.setAttribute("aria-pressed",showOctet?"true":"false");oct.classList.toggle("primary",showOctet);oct.textContent=showOctet?"Ocultar desviaciones del octeto":"Mostrar desviaciones del octeto";drawMol()};
  const v3d=document.getElementById("viewIn3D");
  if(v3d)v3d.addEventListener("click",e=>{ if(v3d.classList.contains("disabled")) e.preventDefault(); });
  selectMol("H2O");document.getElementById("nextStep").onclick=()=>{step=Math.min(step+1,MOL[curMol].steps.length-1);showSteps()};document.getElementById("prevStep").onclick=()=>{step=Math.max(0,step-1);showSteps()}}
let showPol=false, showOctet=false;
function drawMol(){let m=MOL[curMol];
  const extra={showPolarity:showPol, showOctet:showOctet};
  if(showFC){extra.charges=computeFormalCharges(m,true);}
  render("molSvg",{...m,...extra});}
function selectMol(k){curMol=k;step=0;document.querySelectorAll(".molbtn").forEach(b=>b.classList.toggle("active",b.textContent===k));let m=MOL[k];document.getElementById("molBadge").textContent=k;document.getElementById("classBadge").textContent=m.cls;document.getElementById("molTitle").textContent=m.name;document.getElementById("totalVE").textContent=m.ve;document.getElementById("molCharge").textContent=m.charge?m.charge:"0";document.getElementById("molNote").textContent=m.note;drawMol();showSteps();
  const link=document.getElementById("viewIn3D");
  if(link){
    const gk=GEOMOL_KEYS[k]; link.hidden=false;
    if(gk){
      link.href=`../geomol/index.html?mol=${gk}`; link.classList.remove("disabled"); link.removeAttribute("aria-disabled");
      link.title="Ver esta molécula en el visor 3D de GeoMol";
    }else{
      link.href="#"; link.classList.add("disabled"); link.setAttribute("aria-disabled","true");
      link.title="GeoMol aún no incluye esta especie (por ejemplo, moléculas orgánicas multicéntricas e iones no están en su motor de un solo átomo central).";
    }
  }
}
function showSteps(){document.getElementById("steps").innerHTML=MOL[curMol].steps.map((s,i)=>`<div class="step ${i===step?"active":""}"><strong>${i+1}.</strong> ${s}</div>`).join("")}
const BUILDS={CO2:{target:[2,2],atoms:MOL.CO2.atoms,edges:[[0,1],[1,2]],hint:"CO₂ necesita dos enlaces dobles para completar el octeto del C y minimizar cargas."},
C2H2:{target:[1,3,1],atoms:MOL.C2H2.atoms,edges:[[0,1],[1,2],[2,3]],hint:"Los H solo forman un enlace; entre los carbonos se requiere un triple enlace."},
NO3:{target:[2,1,1],atoms:RES["NO3-"].forms[0].atoms,edges:[[0,1],[0,2],[0,3]],hint:"Construye uno de los contribuyentes de resonancia del nitrato: un N=O y dos N–O."},
BF3:{target:[1,1,1],atoms:MOL.BF3.atoms,edges:[[0,1],[0,2],[0,3]],hint:"BF₃ es una excepción: no necesitas formar dobles enlaces para 'forzar' un octeto en B."}};
let bk="CO2",orders=[];
function builderSetup(){let s=document.getElementById("builderSelect");Object.keys(BUILDS).forEach(k=>s.add(new Option(k,k)));s.onchange=()=>loadBuilder(s.value);document.getElementById("checkBuilder").onclick=checkBuilder;document.getElementById("resetBuilder").onclick=()=>loadBuilder(bk);loadBuilder("CO2")}
function loadBuilder(k){bk=k;orders=BUILDS[k].edges.map(()=>1);document.getElementById("builderHint").textContent=BUILDS[k].hint;drawBuilder()}
function drawBuilder(){const B=BUILDS[bk], st={atoms:B.atoms,bonds:B.edges.map((e,i)=>[e[0],e[1],orders[i]])};render("builderSvg",st);let c=document.getElementById("builderControls");c.innerHTML="";B.edges.forEach((e,i)=>{let b=document.createElement("button");b.className="btn";b.textContent=`Enlace ${i+1}: ${["","—","=","≡"][orders[i]]}`;b.onclick=()=>{orders[i]=orders[i]%3+1;drawBuilder()};c.appendChild(b)})}
function checkBuilder(){let ok=orders.every((x,i)=>x===BUILDS[bk].target[i]);let p=document.getElementById("builderFeedback");p.className=ok?"good":"bad";p.textContent=ok?"Correcto: el patrón de órdenes de enlace coincide con el contribuyente objetivo.":"Aún no. Revisa octetos, duetos y la pista del ejercicio."}
function resSetup(){let s=document.getElementById("resSelect");Object.keys(RES).forEach(k=>s.add(new Option(RES[k].name,k)));s.onchange=()=>showRes(s.value);showRes("O3")}
function scoreForm(f){
  const charges=f.charges||[];
  const sumAbs=charges.reduce((a,[,c])=>a+Math.abs(c),0);
  let adjPenalty=0;
  (f.bonds||[]).forEach(([a,b])=>{
    const ca=charges.find(c=>c[0]===a), cb=charges.find(c=>c[0]===b);
    if(ca && cb && ca[1]!==0 && Math.sign(ca[1])===Math.sign(cb[1])) adjPenalty++;
  });
  let enBonus=0;
  charges.forEach(([i,c])=>{ if(c<0){ const chi=EN[f.atoms[i][0]]; if(chi!=null) enBonus+=chi; } });
  return { sumAbs, adjPenalty, composite: sumAbs*100 + adjPenalty*50 - enBonus };
}
function showRes(k){let R=RES[k],buttons=document.getElementById("resButtons");
  const scored=R.forms.map(scoreForm), comps=scored.map(s=>s.composite), min=Math.min(...comps);
  buttons.innerHTML="";
  R.forms.forEach((f,i)=>{let b=document.createElement("button");b.className="btn"+(comps[i]===min?" primary":"");b.textContent=`Contribuyente ${i+1} (Σ|carga|=${scored[i].sumAbs})`+(comps[i]===min?" ★":"");b.onclick=()=>render("resSvg",f);buttons.appendChild(b)});
  render("resSvg",R.forms[0]);
  const allTied=comps.every(c=>c===min);
  const stab=allTied
    ? `Los ${R.forms.length} contribuyentes son equivalentes: misma suma de cargas formales, la carga negativa ya recae sobre el átomo más electronegativo disponible en cada uno, y no hay cargas iguales en átomos adyacentes. Por eso la estructura real es un híbrido deslocalizado, no ninguno de estos dibujos por separado.`
    : `El o los contribuyentes marcados con ★ combinan la menor suma de cargas formales, la ubicación más favorable de la carga negativa (sobre el átomo más electronegativo) y ausencia de cargas iguales en átomos adyacentes.`;
  document.getElementById("resExplain").innerHTML=R.ex+"<br><br><strong>Comparación de estabilidad:</strong> "+stab;
}
function excSetup(){document.getElementById("exceptionGrid").innerHTML=EXC.map(e=>`<article class="exception"><span class="badge alt">${e[0]}</span><h2 style="font-size:1.05rem">${e[1]}</h2><p>${e[2]}</p></article>`).join("")}
const QUIZ=[
  ["¿Cuántos electrones de valencia tiene O?",["4","5","6","8"],2,"El oxígeno está en el grupo 16: tiene 6 electrones de valencia."],
  ["¿Qué especie es un radical con número impar de electrones?",["CO₂","NO₂","CH₄","BF₃"],1,"NO₂ suma 17 electrones de valencia (número impar), por lo que queda un electrón desapareado."],
  ["En CO₂, el patrón principal de enlaces es:",["O–C–O","O=C=O","O≡C–O","O≡C≡O"],1,"Dos enlaces dobles O=C=O completan el octeto del carbono y llevan las cargas formales a cero."],
  ["La resonancia significa que:",["la molécula oscila entre dibujos","los dibujos son contribuyentes de una estructura deslocalizada","se rompen enlaces continuamente","solo existe una forma correcta"],1,"El híbrido real es una sola estructura deslocalizada; los contribuyentes son representaciones límite, no moléculas que se alternan."],
  ["La carga formal de un átomo se calcula como:",["e⁻ valencia − e⁻ no enlazantes − nº de enlaces","protones − electrones","e⁻ valencia + enlaces","nº de pares libres × 2"],0,"Carga formal = electrones de valencia − electrones no enlazantes − número de enlaces (orden sumado)."],
  ["En el CO, las cargas formales son:",["ambas cero","C = +1 y O = −1","C = −1 y O = +1","C = −2 y O = +2"],2,"Con triple enlace y un par libre en cada átomo: C tiene 4−2−3 = −1 y O tiene 6−2−3 = +1, aunque la molécula es neutra."],
  ["Un átomo de fósforo con 5 enlaces (como en PCl₅) es un ejemplo de:",["octeto incompleto","radical","expansión del octeto (hipervalencia)","resonancia"],2,"El P aloja 10 electrones alrededor: excede el octeto, algo posible desde el tercer período."],
  ["Entre dos contribuyentes de resonancia, suele ser más estable el que:",["tiene más cargas formales","coloca la carga negativa en el átomo menos electronegativo","minimiza las cargas formales y pone la negativa en el átomo más electronegativo","tiene más enlaces dobles siempre"],2,"Menos separación de carga y carga negativa sobre el átomo que mejor la soporta (el más electronegativo) dan el contribuyente dominante."]
];
let lqOrder=[];
const lshuffle=window.LabUtils.shuffle;
function quizSetup(){
  lqOrder=lshuffle(QUIZ.map(x=>{
    const opts=x[1].map((o,j)=>({o,correct:j===x[2]}));
    return {q:x[0],opts:lshuffle(opts.slice()),fb:x[3]};
  }));
  let q=document.getElementById("quiz");
  q.innerHTML=lqOrder.map((item,i)=>`<div class="quizq"><strong>${i+1}. ${item.q}</strong>${item.opts.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}"> ${o.o}</label>`).join("")}<p class="qfb" data-fb="${i}" style="display:none;margin:6px 0 0;font-size:.92rem"></p></div>`).join("");
  document.getElementById("checkQuiz").onclick=()=>{let n=0;lqOrder.forEach((item,i)=>{const s=document.querySelector(`input[name=q${i}]:checked`);const fb=document.querySelector(`[data-fb="${i}"]`);const ci=item.opts.findIndex(o=>o.correct);fb.style.display="block";if(s&&+s.value===ci){n++;fb.className="qfb good";fb.textContent="✓ Correcto. "+item.fb;}else{fb.className="qfb bad";fb.textContent="✗ "+item.fb;}});const r=document.getElementById("quizResult");r.textContent=`Resultado: ${n}/${lqOrder.length}`;r.className=n===lqOrder.length?"good":(n>=lqOrder.length/2?"":"bad");};
  document.getElementById("resetQuiz").onclick=quizSetup;
  document.getElementById("quizResult").textContent="";
  const pa=document.getElementById("printAnswers");
  if(pa)pa.onclick=()=>{
    const box=document.getElementById("answerKey");
    box.innerHTML="<h2>Clave de respuestas — LewisLab</h2>"+lqOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Respuesta correcta: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
    box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
  };
}
document.getElementById("theme").onclick=()=>{document.body.classList.toggle("dark");drawMol();};tabSetup();atomSetup();molSetup();builderSetup();resSetup();excSetup();quizSetup();
