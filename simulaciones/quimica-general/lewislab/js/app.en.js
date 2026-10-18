window.LabUtils||(window.LabUtils=(()=>{function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}function mix(x,t2,t){const a=hex2rgb(x),b=hex2rgb(t2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}return{shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};})());
const P = window.LAB_PALETTE || {purple:"#7654a4",purpleLight:"#8a63c9",orange:"#d98a2b",danger:"#a23e3e",success:"#2c7a52",accent:"#2989b3",carbon:"#404750",nearWhite:"#f4f6f8",labelLight:"#f4f7fa",muted:"#667085"};

const ATOMS=[
["H",1,1,"One valence electron; it usually forms one bond."],["C",14,4,"Four valence electrons; it usually forms four covalent bonds."],
["N",15,5,"Five valence electrons; in common neutral molecules it usually forms three bonds and one lone pair."],
["O",16,6,"Six valence electrons; it usually forms two bonds and two lone pairs."],["F",17,7,"Seven valence electrons; it usually forms one bond."],
["P",15,5,"Five valence electrons; it can take part in hypervalent structures."],["S",16,6,"Six valence electrons; it shows multiple bonding patterns."],
["Cl",17,7,"Seven valence electrons; it usually forms one bond in simple compounds."],["Br",17,7,"Seven valence electrons."],["I",17,7,"Seven valence electrons."]
];
const MOL={
"H2O":{name:"Water",cls:"Inorganic",ve:8,charge:0,note:"Two O–H bonds and two lone pairs on O.",atoms:[["O",360,210],["H",250,300],["H",470,300]],bonds:[[0,1,1],[0,2,1]],lp:[[0,2]],steps:["Count: O contributes 6 e⁻ and 2 H contribute 2 e⁻.","Choose O as the central atom and form two O–H single bonds.","Complete the 8 total electrons: two lone pairs remain on O.","Check: H fulfills the duet and O fulfills the octet."]},
"CO2":{name:"Carbon dioxide",cls:"Inorganic",ve:16,charge:0,note:"Two double bonds reduce the formal charges to zero.",atoms:[["O",210,210],["C",360,210],["O",510,210]],bonds:[[0,1,2],[1,2,2]],lp:[[0,2],[2,2]],steps:["Count 16 valence electrons.","O–C–O skeleton.","Complete the terminal octets.","C is left with 4 electrons; convert O lone pairs into bonds.","The O=C=O structure satisfies octets and minimizes formal charges."]},
"NH3":{name:"Ammonia",cls:"Inorganic",ve:8,charge:0,note:"N keeps one lone pair.",atoms:[["N",360,205],["H",240,300],["H",360,330],["H",480,300]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,1]],steps:["N contributes 5 e⁻ and 3 H contribute 3 e⁻: total 8.","N is central; form three N–H bonds.","2 e⁻ remain, forming a lone pair on N.","N reaches an octet and each H a duet."]},
"BF3":{name:"Boron trifluoride",cls:"Exception: incomplete octet",ve:24,charge:0,note:"B is surrounded by 6 electrons in the dominant Lewis structure.",atoms:[["B",360,210],["F",230,305],["F",360,70],["F",490,305]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[1,3],[2,3],[3,3]],steps:["Count 24 e⁻.","B is central; form three B–F bonds.","Complete the octets of F.","No electrons remain: B is left with six electrons around it.","BF₃ is an incomplete-octet exception."]},
"NO2":{name:"Nitrogen dioxide",cls:"Exception: odd electron",ve:17,charge:0,note:"It is a radical: there is an unpaired electron.",atoms:[["N",360,210],["O",225,210],["O",495,210]],bonds:[[0,1,2],[0,2,1]],lp:[[1,2],[2,3]],rad:[0],steps:["Count 17 e⁻: the odd number anticipates a radical.","Build O–N–O and complete the electrons.","It is not possible to give all atoms a conventional octet with 17 e⁻.","One representation contains a double bond, a single bond and an unpaired electron; there is resonance."]},
"PCl5":{name:"Phosphorus pentachloride",cls:"Exception: hypervalent",ve:40,charge:0,note:"Lewis places 10 electrons around P; use it as an accounting model, not as proof of d hybridization.",atoms:[["P",360,210],["Cl",180,210],["Cl",540,210],["Cl",360,55],["Cl",245,340],["Cl",475,340]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[0,5,1]],lp:[[1,3],[2,3],[3,3],[4,3],[5,3]],steps:["Count 40 e⁻.","P goes in the center and forms five P–Cl single bonds.","Complete the octets of the Cl atoms.","The Lewis scheme leaves 10 electrons around P.","The modern description of hypervalence requires bonding models richer than 'using expanded d orbitals'."]},
"CH4":{name:"Methane",cls:"Organic",ve:8,charge:0,note:"C forms four single bonds.",atoms:[["C",360,210],["H",225,210],["H",495,210],["H",360,70],["H",360,350]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:[],steps:["C contributes 4 e⁻ and 4 H contribute 4 e⁻.","Place C in the center and four terminal H.","Form four C–H bonds.","All electrons end up bonding; C has an octet."]},
"C2H4":{name:"Ethene",cls:"Organic",ve:12,charge:0,note:"The structure contains a C=C double bond.",atoms:[["C",300,210],["C",420,210],["H",205,120],["H",205,300],["H",515,120],["H",515,300]],bonds:[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],lp:[],steps:["Total: 12 valence e⁻.","Join the two C and complete the C–H bonds.","With only a C–C bond, each C is left incomplete.","Form a second bond between the C atoms: C=C appears.","Each C reaches an octet."]},
"C2H2":{name:"Ethyne",cls:"Organic",ve:10,charge:0,note:"The structure contains a C≡C triple bond.",atoms:[["H",180,210],["C",310,210],["C",410,210],["H",540,210]],bonds:[[0,1,1],[1,2,3],[2,3,1]],lp:[],steps:["Total: 10 e⁻.","H–C–C–H skeleton.","The C atoms are incomplete with a single bond.","Convert additional bonding pairs into a C≡C triple bond.","Each C reaches an octet."]},
"CH3OH":{name:"Methanol",cls:"Organic",ve:14,charge:0,note:"O has two lone pairs.",atoms:[["C",300,210],["O",430,210],["H",540,210],["H",230,110],["H",190,210],["H",230,310]],bonds:[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1]],lp:[[1,2]],steps:["Count 14 e⁻.","CH₃–O–H connectivity.","Form five single bonds (10 e⁻).","Place the remaining 4 e⁻ as two lone pairs on O.","C and O fulfill the octet; H fulfills the duet."]},
"CH3COOH":{name:"Acetic acid",cls:"Organic",ve:24,charge:0,note:"The carboxyl group combines C=O and C–O–H.",atoms:[["C",220,210],["C",360,210],["O",470,120],["O",470,300],["H",590,300],["H",135,120],["H",100,210],["H",135,300]],bonds:[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[0,5,1],[0,6,1],[0,7,1]],lp:[[2,2],[3,2]],steps:["Count 24 e⁻.","Use the CH₃–C–O–H skeleton with a second O attached to the carbonyl C.","Complete the C–H and O–H bonds.","Form C=O to satisfy the octet of the carbonyl carbon.","Place two lone pairs on each O."]},
"CO":{name:"Carbon monoxide",cls:"Formal charges",ve:10,charge:0,note:"Neutral molecule but with formal charges: C is −1 and O is +1. Turn them on with the button.",atoms:[["C",290,210],["O",450,210]],bonds:[[0,1,3]],lp:[[0,1],[1,1]],steps:["Count 10 valence e⁻ (C: 4, O: 6).","Form a bond between C and O.","To give both an octet a C≡O triple bond is needed.","One lone pair remains on C and another on O.","The formal charges are C = −1 and O = +1, although the molecule is neutral."]},
"O3":{name:"Ozone, O₃",cls:"Formal charges · resonance",ve:18,charge:0,note:"In each contributor the central O is +1 and a terminal O is −1. Turn them on with the button.",atoms:[["O",240,255],["O",360,165],["O",480,255]],bonds:[[1,0,2],[1,2,1]],lp:[[0,2],[1,1],[2,3]],steps:["Count 18 valence e⁻.","Bent O–O–O skeleton.","Form one double bond and one single bond from the central O.","Complete octets with lone pairs.","The central O has a formal charge of +1 and a terminal O has −1; there is resonance."]},
"NH4+":{name:"Ammonium, NH₄⁺",cls:"Polyatomic ion",ve:8,charge:1,note:"N forms four bonds and has no lone pair: its formal charge is +1. Turn it on with the button.",atoms:[["N",360,205],["H",230,205],["H",490,205],["H",360,80],["H",360,330]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:[],steps:["Count the valence e⁻: N(5) + 4·H(1) − 1 (for the + charge) = 8.","Place N in the center and four H.","Form four N–H bonds.","No lone pairs remain; N has a formal charge of +1."]},
"H3O+":{name:"Hydronium, H₃O⁺",cls:"Polyatomic ion",ve:8,charge:1,note:"O forms three bonds and keeps one lone pair: its formal charge is +1. Turn it on with the button.",atoms:[["O",360,200],["H",240,275],["H",480,275],["H",360,80]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,1]],steps:["Count the valence e⁻: O(6) + 3·H(1) − 1 = 8.","Place O in the center and three H.","Form three O–H bonds (6 e⁻).","2 e⁻ remain as a lone pair on O.","O has a formal charge of +1."]}
};
const RES={
"O3":{name:"Ozone",forms:[
{atoms:[["O",220,210],["O",360,210],["O",500,210]],bonds:[[0,1,2],[1,2,1]],lp:[[0,2],[1,1],[2,3]],charges:[[1,1],[2,-1]]},
{atoms:[["O",220,210],["O",360,210],["O",500,210]],bonds:[[0,1,1],[1,2,2]],lp:[[0,3],[1,1],[2,2]],charges:[[0,-1],[1,1]]}],
ex:"The two O–O bonds are equivalent in the real hybrid; the localized drawings are contributors."},
"NO3-":{name:"Nitrate, NO₃⁻",forms:[
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,2],[0,2,1],[0,3,1]],lp:[[1,2],[2,3],[3,3]],charges:[[0,1],[2,-1],[3,-1]]},
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,2],[0,3,1]],lp:[[1,3],[2,2],[3,3]],charges:[[0,1],[1,-1],[3,-1]]},
{atoms:[["N",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,1],[0,3,2]],lp:[[1,3],[2,3],[3,2]],charges:[[0,1],[1,-1],[2,-1]]}],
ex:"The three N–O bonds are equivalent through delocalization; the negative charge is distributed over the oxygens."},
"CO3--":{name:"Carbonate, CO₃²⁻",forms:[
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,2],[0,2,1],[0,3,1]],lp:[[1,2],[2,3],[3,3]],charges:[[2,-1],[3,-1]]},
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,2],[0,3,1]],lp:[[1,3],[2,2],[3,3]],charges:[[1,-1],[3,-1]]},
{atoms:[["C",360,210],["O",190,210],["O",490,80],["O",490,340]],bonds:[[0,1,1],[0,2,1],[0,3,2]],lp:[[1,3],[2,3],[3,2]],charges:[[1,-1],[2,-1]]}],
ex:"Three equivalent contributors distribute the π density and the negative charge."}
};
const EXC=[
["Incomplete octet","BF₃, BCl₃, BeCl₂","The central atom can be left with fewer than eight electrons. B in BF₃ has six electrons around it in the dominant structure."],
["Odd electrons","NO, NO₂, ClO₂","An odd total number of electrons produces radicals; not all atoms can simultaneously reach a conventional octet."],
["Hypervalence","PCl₅, SF₄, SF₆, XeF₄","Lewis can place more than eight electrons around atoms of period ≥3. It is an accounting scheme; it does not by itself imply hybridization with d orbitals."],
["Duet","H, He","Hydrogen is stabilized with two electrons around it, not eight."],
["Formal charges","CO, NO₃⁻, O₃","Formal charges help compare contributors and track the electron accounting."],
["Resonance","O₃, NO₃⁻, CO₃²⁻, acetate","A single localized Lewis structure may be insufficient to represent electron delocalization."]
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
function atomSetup(){const s=document.getElementById("atomSelect");ATOMS.forEach((a,i)=>s.add(new Option(`${a[0]} — ${a[2]} valence e⁻`,i)));s.value=1;const r=document.getElementById("electronRange");function draw(){const a=ATOMS[+s.value], n=Math.min(+r.value,a[2]);r.max=a[2];if(+r.value>a[2])r.value=a[2];let h=`<span>${a[0]}</span>`;["t1","r1","b1","l1","t2","r2","b2","l2"].slice(0,n).forEach(c=>h+=`<i class="dot ${c}"></i>`);document.getElementById("lewisSymbol").innerHTML=h;document.getElementById("aGroup").textContent=a[1];document.getElementById("aValence").textContent=a[2];document.getElementById("atomExplain").textContent=a[3]}s.onchange=()=>{r.value=ATOMS[+s.value][2];draw()};r.oninput=draw;draw()}
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
       `<text x="${a[1]}" y="${a[2]+52}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}">${count}e⁻ (${over?"hypervalent":"incomplete octet"})</text>`;
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
  if(fc)fc.onclick=()=>{showFC=!showFC;fc.setAttribute("aria-pressed",showFC?"true":"false");fc.classList.toggle("primary",showFC);fc.textContent=showFC?"Hide formal charges":"Show formal charges";drawMol()};
  const pol=document.getElementById("polToggle");
  if(pol)pol.onclick=()=>{showPol=!showPol;pol.setAttribute("aria-pressed",showPol?"true":"false");pol.classList.toggle("primary",showPol);pol.textContent=showPol?"Hide bond polarity":"Show bond polarity";drawMol()};
  const oct=document.getElementById("octetToggle");
  if(oct)oct.onclick=()=>{showOctet=!showOctet;oct.setAttribute("aria-pressed",showOctet?"true":"false");oct.classList.toggle("primary",showOctet);oct.textContent=showOctet?"Hide octet deviations":"Show octet deviations";drawMol()};
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
      link.title="View this molecule in the GeoMol 3D viewer";
    }else{
      link.href="#"; link.classList.add("disabled"); link.setAttribute("aria-disabled","true");
      link.title="GeoMol does not yet include this species (for example, multicenter organic molecules and ions are not in its single-central-atom engine).";
    }
  }
}
function showSteps(){document.getElementById("steps").innerHTML=MOL[curMol].steps.map((s,i)=>`<div class="step ${i===step?"active":""}"><strong>${i+1}.</strong> ${s}</div>`).join("")}
const BUILDS={CO2:{target:[2,2],atoms:MOL.CO2.atoms,edges:[[0,1],[1,2]],hint:"CO₂ needs two double bonds to complete the octet of C and minimize charges."},
C2H2:{target:[1,3,1],atoms:MOL.C2H2.atoms,edges:[[0,1],[1,2],[2,3]],hint:"H atoms form only one bond; between the carbons a triple bond is required."},
NO3:{target:[2,1,1],atoms:RES["NO3-"].forms[0].atoms,edges:[[0,1],[0,2],[0,3]],hint:"Build one of the resonance contributors of nitrate: one N=O and two N–O."},
BF3:{target:[1,1,1],atoms:MOL.BF3.atoms,edges:[[0,1],[0,2],[0,3]],hint:"BF₃ is an exception: you do not need to form double bonds to 'force' an octet on B."}};
let bk="CO2",orders=[];
function builderSetup(){let s=document.getElementById("builderSelect");Object.keys(BUILDS).forEach(k=>s.add(new Option(k,k)));s.onchange=()=>loadBuilder(s.value);document.getElementById("checkBuilder").onclick=checkBuilder;document.getElementById("resetBuilder").onclick=()=>loadBuilder(bk);loadBuilder("CO2")}
function loadBuilder(k){bk=k;orders=BUILDS[k].edges.map(()=>1);document.getElementById("builderHint").textContent=BUILDS[k].hint;drawBuilder()}
function drawBuilder(){const B=BUILDS[bk], st={atoms:B.atoms,bonds:B.edges.map((e,i)=>[e[0],e[1],orders[i]])};render("builderSvg",st);let c=document.getElementById("builderControls");c.innerHTML="";B.edges.forEach((e,i)=>{let b=document.createElement("button");b.className="btn";b.textContent=`Bond ${i+1}: ${["","—","=","≡"][orders[i]]}`;b.onclick=()=>{orders[i]=orders[i]%3+1;drawBuilder()};c.appendChild(b)})}
function checkBuilder(){let ok=orders.every((x,i)=>x===BUILDS[bk].target[i]);let p=document.getElementById("builderFeedback");p.className=ok?"good":"bad";p.textContent=ok?"Correct: the bond-order pattern matches the target contributor.":"Not yet. Check octets, duets and the exercise hint."}
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
  R.forms.forEach((f,i)=>{let b=document.createElement("button");b.className="btn"+(comps[i]===min?" primary":"");b.textContent=`Contributor ${i+1} (Σ|charge|=${scored[i].sumAbs})`+(comps[i]===min?" ★":"");b.onclick=()=>render("resSvg",f);buttons.appendChild(b)});
  render("resSvg",R.forms[0]);
  const allTied=comps.every(c=>c===min);
  const stab=allTied
    ? `The ${R.forms.length} contributors are equivalent: same sum of formal charges, the negative charge already falls on the most electronegative atom available in each, and there are no like charges on adjacent atoms. That is why the real structure is a delocalized hybrid, not any of these drawings separately.`
    : `The contributor(s) marked with ★ combine the lowest sum of formal charges, the most favorable placement of the negative charge (on the most electronegative atom) and no like charges on adjacent atoms.`;
  document.getElementById("resExplain").innerHTML=R.ex+"<br><br><strong>Stability comparison:</strong> "+stab;
}
function excSetup(){document.getElementById("exceptionGrid").innerHTML=EXC.map(e=>`<article class="exception"><span class="badge alt">${e[0]}</span><h3>${e[1]}</h3><p>${e[2]}</p></article>`).join("")}
const QUIZ=[
  ["How many valence electrons does O have?",["4","5","6","8"],2,"Oxygen is in group 16: it has 6 valence electrons."],
  ["Which species is a radical with an odd number of electrons?",["CO₂","NO₂","CH₄","BF₃"],1,"NO₂ has 17 valence electrons (an odd number), so one electron is left unpaired."],
  ["In CO₂, the main bonding pattern is:",["O–C–O","O=C=O","O≡C–O","O≡C≡O"],1,"Two double bonds O=C=O complete the octet of carbon and bring the formal charges to zero."],
  ["Resonance means that:",["the molecule oscillates between drawings","the drawings are contributors to a delocalized structure","bonds are continuously broken","only one form is correct"],1,"The real hybrid is a single delocalized structure; the contributors are limiting representations, not molecules that alternate."],
  ["The formal charge of an atom is calculated as:",["valence e⁻ − nonbonding e⁻ − number of bonds","protons − electrons","valence e⁻ + bonds","number of lone pairs × 2"],0,"Formal charge = valence electrons − nonbonding electrons − number of bonds (summed order)."],
  ["In CO, the formal charges are:",["both zero","C = +1 y O = −1","C = −1 y O = +1","C = −2 y O = +2"],2,"With a triple bond and one lone pair on each atom: C has 4−2−3 = −1 and O has 6−2−3 = +1, although the molecule is neutral."],
  ["A phosphorus atom with 5 bonds (as in PCl₅) is an example of:",["incomplete octet","a radical","octet expansion (hypervalence)","resonance"],2,"P accommodates 10 electrons around it: it exceeds the octet, which is possible from the third period on."],
  ["Between two resonance contributors, the more stable one is usually the one that:",["has more formal charges","places the negative charge on the less electronegative atom","minimizes formal charges and puts the negative charge on the more electronegative atom","always has more double bonds"],2,"Less charge separation and the negative charge on the atom that best supports it (the most electronegative) give the dominant contributor."]
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
  document.getElementById("checkQuiz").onclick=()=>{let n=0;lqOrder.forEach((item,i)=>{const s=document.querySelector(`input[name=q${i}]:checked`);const fb=document.querySelector(`[data-fb="${i}"]`);const ci=item.opts.findIndex(o=>o.correct);fb.style.display="block";if(s&&+s.value===ci){n++;fb.className="qfb good";fb.textContent="✓ Correct. "+item.fb;}else{fb.className="qfb bad";fb.textContent="✗ "+item.fb;}});const r=document.getElementById("quizResult");r.textContent=`Result: ${n}/${lqOrder.length}`;r.className=n===lqOrder.length?"good":(n>=lqOrder.length/2?"":"bad");};
  document.getElementById("resetQuiz").onclick=quizSetup;
  document.getElementById("quizResult").textContent="";
  const pa=document.getElementById("printAnswers");
  if(pa)pa.onclick=()=>{
    const box=document.getElementById("answerKey");
    box.innerHTML="<h2>Answer key — LewisLab</h2>"+lqOrder.map((it,i)=>`<p><strong>${i+1}. ${it.q}</strong><br>Correct answer: <strong>${it.opts.find(o=>o.correct).o}</strong><br><span class="muted">${it.fb}</span></p>`).join("");
    box.hidden=false; document.body.appendChild(box); document.body.classList.add("print-answer-key"); const cleanup=()=>{document.body.classList.remove("print-answer-key"); window.removeEventListener("afterprint",cleanup);}; window.addEventListener("afterprint",cleanup); window.print(); setTimeout(cleanup,1500);
  };
}
document.getElementById("theme").onclick=()=>{document.body.classList.toggle("dark");drawMol();};tabSetup();atomSetup();molSetup();builderSetup();resSetup();excSetup();quizSetup();
