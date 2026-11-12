/* Acidez orgánica y pKa — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



/* Constructor de geometrías 3D a partir de una notación tipo SMILES (sin anillos, salvo el fenilo «Ph»).
   MSim.build('CC{ol}O{ol}') -> { a:[[el,x,y,z]], b:[[i,j,orden]], tag:[etiqueta|null por átomo] }
   Reglas: sp3 tetraédrico (zigzag anti), sp2 plano (trans), sp lineal; los H se completan por valencia.
   Etiquetas: átomo{nombre} (los H unidos a N, O, S heredan la etiqueta; con «nombre+» también los de C). */
(function () {
  var T = THREE, V = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1 };
  var BL = { 'C-C1': 1.54, 'C-C2': 1.34, 'C-C3': 1.20, 'C-O1': 1.43, 'C-O2': 1.22, 'C-N1': 1.47, 'C-N2': 1.28, 'C-N3': 1.16, 'C-F1': 1.35, 'C-Cl1': 1.77, 'C-Br1': 1.94, 'C-I1': 2.14, 'C-S1': 1.82, 'C-S2': 1.60, 'C-H1': 1.09, 'H-O1': 0.96, 'H-N1': 1.01, 'H-S1': 1.34, 'N-O1': 1.40, 'N-O2': 1.22, 'O-S2': 1.45, 'O-P2': 1.48, 'O-P1': 1.60, 'C-P1': 1.84, 'O-O1': 1.45, 'N-N1': 1.45, 'H-P1': 1.42 };
  function bl(a, b, o) { var k = [a, b].sort().join('-') + o; return BL[k] || BL[[b, a].join('-') + o] || 1.5; }
  function parse(s) {
    var i = 0, root = null, nodes = [];
    function seq(parent, ord) {
      var prev = parent;
      while (i < s.length) {
        var ch = s[i];
        if (ch === '(') { i++; seq(prev, 1); continue; }
        if (ch === ')') { i++; return; }
        if (ch === '=') { ord = 2; i++; continue; } if (ch === '#') { ord = 3; i++; continue; } if (ch === '-') { i++; continue; }
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length;
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - sum); }
  function perp(u, ref) { var p = ref ? ref.clone().sub(u.clone().multiplyScalar(ref.dot(u))) : null; if (!p || p.lengthSq() < 1e-6) { p = Math.abs(u.x) < 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1); p.sub(u.clone().multiplyScalar(p.dot(u))); } return p.normalize(); }
  function build(s) {
    var tr = parse(s), A = [], B = [], TAG = [];
    function add(el, p, tag) { A.push([el, p.x, p.y, p.z]); TAG.push(tag || null); return A.length - 1; }
    function bond(i, j, o) { B.push([i, j, o || 1]); }
    function dirsFor(h, u, ref, isRoot) {
      var e1 = perp(u, ref), e2 = new T.Vector3().crossVectors(u, e1), out = [];
      if (h === 'sp') { out = [u.clone().negate()]; if (isRoot) out.unshift(u.clone()); return out; }
      if (h === 'sp2') { out = [u.clone().multiplyScalar(-0.5).addScaledVector(e1, -0.866), u.clone().multiplyScalar(-0.5).addScaledVector(e1, 0.866)]; if (isRoot) out.unshift(u.clone()); return out; }
      for (var i = 0; i < 3; i++) { var f = Math.PI + i * 2 * Math.PI / 3; out.push(u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, 0.9428 * Math.cos(f)).addScaledVector(e2, 0.9428 * Math.sin(f))); }
      if (isRoot) out.unshift(u.clone()); return out;
    }
    function place(n, pos, u, gp, idx) {
      n.pos = pos; var ref = gp ? gp.clone().sub(pos) : null; var h = hyb(n), tagH = n.tag && (n.inh || n.el === 'N' || n.el === 'O' || n.el === 'S') ? n.tag : null;
      if (h === 'ring') {
        var R = 1.40, uu = u ? u : new T.Vector3(0, 1, 0), w = perp(uu, ref), ctr = pos.clone().addScaledVector(uu, -R), ids = [idx];
        for (var k = 1; k < 6; k++) { var th = k * Math.PI / 3, p = ctr.clone().addScaledVector(uu, Math.cos(th) * R).addScaledVector(w, Math.sin(th) * R); var id = add('C', p, n.tag); ids.push(id); }
        for (k = 0; k < 6; k++) bond(ids[k], ids[(k + 1) % 6], k % 2 ? 1 : 2);
        for (k = 0; k < 6; k++) { if (k === 0 && u) continue; var q = new T.Vector3(A[ids[k]][1], A[ids[k]][2], A[ids[k]][3]), d = q.clone().sub(ctr).normalize(), hp = q.clone().addScaledVector(d, 1.08), hid = add('H', hp, n.inh ? n.tag : null); bond(ids[k], hid, 1); }
        return;
      }
      var subs = n.kids.slice(), nh = nH(n), dirs = dirsFor(h, u || new T.Vector3(0, 1, 0), ref, !n.par), si = 0;
      subs.forEach(function (c) { var d = dirs[si++] || dirs[0], len = bl(n.el, c.el === 'Ph' ? 'C' : c.el, c.ord), p = pos.clone().addScaledVector(d, len), id = add(c.el === 'Ph' ? 'C' : c.el, p, c.tag); bond(idx, id, c.ord); place(c, p, d.clone().negate(), n.par ? n.par.pos : null, id); });
      for (var k = 0; k < nh; k++) { var d2 = dirs[si++] || dirs[0], hl = bl(n.el, 'H', 1), hp2 = pos.clone().addScaledVector(d2, hl), hid2 = add('H', hp2, tagH); bond(idx, hid2, 1); }
    }
    var r = tr.root, rp = new T.Vector3(0, 0, 0), ri = add(r.el === 'Ph' ? 'C' : r.el, rp, r.tag); place(r, rp, null, null, ri);
    var c = new T.Vector3(); A.forEach(function (a) { c.x += a[1]; c.y += a[2]; c.z += a[3]; }); c.multiplyScalar(1 / A.length); A.forEach(function (a) { a[1] -= c.x; a[2] -= c.y; a[3] -= c.z; });
    return { a: A, b: B, tag: TAG };
  }
  MSim.build = build;
})();


(function () {
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var CP = [
    { id: 'etano', n: 'Etano', fam: 'C–H de alcano', s: 'CC{a+}', pka: 50, dl: { a: 1 }, tip: 'El par de electrones del carbanión sp³ queda en un orbital con solo 25 % de carácter s, concentrado en un único carbono: base conjugada muy inestable.' },
    { id: 'eteno', n: 'Eteno', fam: 'C–H de alqueno', s: 'C{a+}=C', pka: 44, dl: { a: 1 }, tip: 'Carbanión sp² (33 % de carácter s): el par está más cerca del núcleo que en sp³, y la base conjugada es algo más estable.' },
    { id: 'etino', n: 'Etino (acetileno)', fam: 'C–H de alquino', s: 'C{a+}#C', pka: 25, dl: { a: 1 }, tip: 'Carbanión sp (50 % de carácter s): el par de electrones está muy retenido por el núcleo. Por eso el C–H terminal es el más ácido de los hidrocarburos.' },
    { id: 'nh3', n: 'Amoníaco', fam: 'N–H', s: 'N{a}', pka: 38, dl: { a: 1 }, tip: 'El N es más electronegativo que el C, así que NH₂⁻ es más estable que CH₃⁻; pero es mucho menos electronegativo que el O.' },
    { id: 'acetona', n: 'Propanona (H en α)', fam: 'C–H α a carbonilo', s: 'CC(=O{d})C{a+}', pka: 19.3, dl: { a: 0.4, d: 0.6 }, tip: 'El enolato deslocaliza la carga entre el carbono α y el oxígeno del carbonilo (resonancia): por eso un C–H es tan ácido como un alcohol.' },
    { id: 'metanol', n: 'Metanol', fam: 'O–H de alcohol', s: 'CO{a}', pka: 15.5, dl: { a: 1 }, tip: 'El alcóxido concentra la carga en el O (electronegativo) y está bien solvatado por el agua.' },
    { id: 'etanol', n: 'Etanol', fam: 'O–H de alcohol', s: 'CCO{a}', pka: 15.9, dl: { a: 1 }, tip: 'El grupo etilo, donador de electrones, desestabiliza apenas el alcóxido: el etanol es algo menos ácido que el metanol.' },
    { id: 'tbuoh', n: 'terc-Butanol', fam: 'O–H de alcohol', s: 'CC(C)(C)O{a}', pka: 17, dl: { a: 1 }, tip: 'Tres grupos metilo donadores y un entorno voluminoso que solvata mal al anión: es el menos ácido de los alcoholes de la lista (≈17–18).' },
    { id: 'etanotiol', n: 'Etanotiol', fam: 'S–H de tiol', s: 'CCS{a}', pka: 10.6, dl: { a: 1 }, tip: 'El S es menos electronegativo que el O, pero es mucho más grande y polarizable: la carga se reparte en un volumen mayor y el tiolato es más estable que el alcóxido.' },
    { id: 'fenol', n: 'Fenol', fam: 'O–H de fenol', s: 'O{a}Ph{d}', pka: 10.0, dl: { a: 0.4, d: 0.6 }, tip: 'En el fenóxido la carga negativa se deslocaliza hacia el anillo (posiciones orto y para) por resonancia: 5–6 unidades de pKa más ácido que el etanol.' },
    { id: 'formico', n: 'Ácido metanoico (fórmico)', fam: 'Ácido carboxílico', s: 'C(=O{d})O{a}', pka: 3.75, dl: { a: 0.5, d: 0.5 }, tip: 'En el carboxilato la carga se reparte por igual entre los dos oxígenos (los dos enlaces C–O son equivalentes, 1,5).' },
    { id: 'acetico', n: 'Ácido etanoico (acético)', fam: 'Ácido carboxílico', s: 'CC(=O{d})O{a}', pka: 4.76, dl: { a: 0.5, d: 0.5 }, tip: 'El acetato reparte la carga entre dos O electronegativos: base conjugada muy estabilizada por resonancia.' },
    { id: 'benzoico', n: 'Ácido benzoico', fam: 'Ácido carboxílico', s: 'O{a}C(=O{d})Ph', pka: 4.20, dl: { a: 0.5, d: 0.5 }, tip: 'El anillo (sp²) atrae electrones por inducción y estabiliza algo más el carboxilato que un grupo metilo.' },
    { id: 'fluoro', n: 'Ácido fluoroetanoico', fam: 'Efecto inductivo', s: 'F{i}CC(=O{d})O{a}', pka: 2.59, dl: { a: 0.5, d: 0.5 }, tip: 'El flúor, muy electronegativo, retira densidad electrónica por los enlaces σ y estabiliza el carboxilato.' },
    { id: 'cloro', n: 'Ácido cloroetanoico', fam: 'Efecto inductivo', s: 'Cl{i}CC(=O{d})O{a}', pka: 2.86, dl: { a: 0.5, d: 0.5 }, tip: 'Un cloro en α baja el pKa casi dos unidades respecto del ácido acético.' },
    { id: 'dicloro', n: 'Ácido dicloroetanoico', fam: 'Efecto inductivo', s: 'Cl{i}C(Cl{i})C(=O{d})O{a}', pka: 1.29, dl: { a: 0.5, d: 0.5 }, tip: 'Dos cloros: el efecto inductivo se suma (aditivo).' },
    { id: 'tricloro', n: 'Ácido tricloroetanoico', fam: 'Efecto inductivo', s: 'Cl{i}C(Cl{i})(Cl{i})C(=O{d})O{a}', pka: 0.65, dl: { a: 0.5, d: 0.5 }, tip: 'Tres cloros: es unas 10 000 veces más ácido que el ácido acético (ΔpKa ≈ 4,1).' }
  ];
  var CID = {}; CP.forEach(function (c) { CID[c.id] = c; });
  var BS = [
    { id: 'OH', n: 'HO⁻ (hidróxido)', ph: 15.7, ex: 'NaOH' }, { id: 'HCO3', n: 'HCO₃⁻ (bicarbonato)', ph: 6.35, ex: 'NaHCO₃' },
    { id: 'NH3', n: 'NH₃ (amoníaco)', ph: 9.25, ex: 'NH₃' }, { id: 'AcO', n: 'CH₃COO⁻ (acetato)', ph: 4.76, ex: 'CH₃COONa' },
    { id: 'EtO', n: 'EtO⁻ (etóxido)', ph: 15.9, ex: 'EtONa' }, { id: 'NH2', n: 'NH₂⁻ (amiduro)', ph: 38, ex: 'NaNH₂' },
    { id: 'H', n: 'H⁻ (hidruro)', ph: 35, ex: 'NaH' }
  ];
  var BID = {}; BS.forEach(function (b) { BID[b.id] = b; });
  var T = THREE;
  // geometría del ácido y de su base conjugada (se quita el primer H con etiqueta «a»)
  CP.forEach(function (c) {
    var g = MSim.build(c.s), k = -1, i; for (i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === 'a') { k = i; break; } }
    var map = {}, A = [], TG = [], B = []; g.a.forEach(function (a, j) { if (j !== k) { map[j] = A.length; A.push(a.slice()); TG.push(g.tag[j]); } });
    g.b.forEach(function (b) { if (b[0] !== k && b[1] !== k) B.push([map[b[0]], map[b[1]], b[2]]); });
    c.acid = g; c.hpos = g.a[k]; c.hk = k; c.base = { a: A, b: B, tag: TG };
    var cnt = {}; TG.forEach(function (t) { if (t && c.dl[t]) cnt[t] = (cnt[t] || 0) + 1; }); c.share = TG.map(function (t) { return t && c.dl[t] ? c.dl[t] / cnt[t] : 0; });
    c.nsite = c.share.filter(function (x) { return x > 0; }).length;
  });
  var S = { cp: 'acetico', b: 'OH', pH: 4.76, ph0: true, pr: 0, tt: -1 };
  var NP = 60, perm = [], hA, aA, dummy, gAcid = null, gBase = null, clouds = [], proton, bSph, lab = {}, arrows = [], key_ = '';
  for (var q = 0; q < NP; q++) perm.push(q); var sd = 7; perm.sort(function (a, b) { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 - 0.5; });
  function K(c, b) { return Math.pow(10, b.ph - c.pka); }
  function alpha(pka, pH) { return 1 / (1 + Math.pow(10, pka - pH)); }
  function sciK(x) { return MSim.sci(x, 1); }
  function dG(c, b) { return -5.708 * Math.log(K(c, b)) / Math.LN10; }

  var LESSON = [
    { list: ['acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ['etano', 'nh3', 'etino', 'acetona', 'etanol', 'fenol', 'acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ['etano', 'eteno', 'etino'], bs: ['NH2'], pH: function (c) { return 12; } },
    { list: ['etano', 'nh3', 'etanol', 'etanotiol'], bs: ['OH'], pH: function (c) { return 12; } },
    { list: ['etanol', 'fenol', 'acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ['acetico', 'fluoro', 'cloro', 'dicloro', 'tricloro'], bs: ['OH'], pH: function (c) { return 2; } },
    { list: ['fenol', 'fenol', 'etanol', 'acetona'], bs: ['HCO3', 'OH', 'OH', 'NH2'], pH: function (c, f) { return c.pka; } }
  ];
  function stages() {
    var a = CID.acetico, e = CID.etanol, ph = CID.fenol, t = CID.tricloro;
    return [
      ['Ácido y base de Brønsted', 'Brønsted', 'HA + B⁻ ⇌ A⁻ + HB: la acidez es la estabilidad de A⁻',
        '<p>Un <b>ácido de Brønsted</b> cede H⁺; su <b>base conjugada</b> A⁻ es lo que queda. La fuerza se mide con <b>pKa = −log Ka</b>: a menor pKa, mayor acidez. Para ' + a.n + ', pKa = <b>' + f2(a.pka) + '</b>.</p><p>El equilibrio ácido–base tiene <b>K = 10<sup>pKa(HB) − pKa(HA)</sup></b>: se desplaza hacia el ácido más débil. Y <b>cuanto más estable es A⁻, más ácido es HA</b>; todos los efectos que siguen son formas de estabilizar la carga negativa.</p>'],
      ['La escala de pKa', 'Escala', 'De 50 (alcano) a 0,65 (ácido tricloroacético): 50 órdenes de magnitud',
        '<p>Los pKa de los compuestos orgánicos cubren unas <b>50 unidades</b>: <b>alcanos ≈ 50 · amoníaco 38 · alquinos 25 · cetonas (H en α) ≈ 19 · alcoholes 16–17 · fenoles 10 · ácidos carboxílicos 3–5</b>. La diferencia entre etano y ácido acético es de ~10<sup>45</sup> veces en Ka.</p><p>La barra de la derecha en «Gráficos» ordena todos los compuestos; la línea punteada marca el pKa del ácido conjugado de la base elegida: un ácido por <b>debajo</b> de la línea se desprotona casi por completo.</p>'],
      ['Hibridación del carbono', 'Hibridación', 'sp ≫ sp² ≫ sp³: más carácter s, anión más estable',
        '<p>Un orbital con más <b>carácter s</b> está más cerca del núcleo y retiene mejor el par de electrones: <b>sp (50 % s) &gt; sp² (33 %) &gt; sp³ (25 %)</b>. Así: <b>etano 50 → eteno 44 → etino 25</b>. Por eso el H de un alquino terminal se arranca con NaNH₂, pero no con NaOH.</p>'],
      ['Electronegatividad y tamaño', 'Electroneg.', 'En una fila: C–H < N–H < O–H; en una columna: S–H más ácido que O–H',
        '<p>Al avanzar por el periodo aumenta la electronegatividad y la base conjugada se estabiliza: <b>CH₃⁻ (50) &lt; NH₂⁻ (38) &lt; HO⁻ (15,7)</b>. Al bajar en el grupo domina el <b>tamaño y la polarizabilidad</b>: el S⁻ reparte la carga en un volumen mayor, de modo que el <b>etanotiol (10,6) es más ácido que el etanol (15,9)</b>.</p>'],
      ['Resonancia', 'Resonancia', 'Si la carga se deslocaliza, A⁻ se estabiliza mucho',
        '<p>En el <b>alcóxido</b> la carga queda en un O. En el <b>fenóxido</b> se reparte por el anillo, y en el <b>carboxilato</b> entre dos O equivalentes: pKa <b>15,9 → 10,0 → 4,76</b>. Cada nube roja muestra cuántos átomos comparten la carga: cuantos más sitios, menor densidad de carga en cada uno y mayor estabilidad.</p>'],
      ['Efecto inductivo', 'Inductivo', 'Átomos electronegativos cercanos retiran densidad electrónica por enlaces σ',
        '<p>Sustituyentes electronegativos próximos al carboxilato estabilizan la carga a través de los enlaces σ (<b>efecto inductivo −I</b>), y es <b>aditivo</b> y <b>decrece con la distancia</b>. Para CH₃COOH → ClCH₂COOH → Cl₂CHCOOH → Cl₃CCOOH: pKa <b>' + f2(a.pka) + ' → ' + f2(CID.cloro.pka) + ' → ' + f2(CID.dicloro.pka) + ' → ' + f2(t.pka) + '</b>. Las flechas apuntan hacia el cloro.</p>'],
      ['Predecir el equilibrio', 'Predecir', 'K = 10^(pKa de HB − pKa de HA): ¿se desplaza hacia productos?',
        '<p>Para saber si una base desprotona a un ácido compara los pKa: si <b>pKa(HB) &gt; pKa(HA)</b>, el equilibrio favorece los productos (K &gt; 1). Ejemplos: <b>fenol + HCO₃⁻</b> (6,35 &lt; 10,0): casi no se desprotona; <b>fenol + HO⁻</b>: completo; <b>etanol + HO⁻</b>: ≈ equilibrio (K ≈ 0,6); <b>propanona + NH₂⁻</b>: completo. Con NaOH se obtiene fenóxido, pero no acetiluro.</p>']
    ];
  }
  function rebuild(ctx) {
    var c = CID[S.cp], sc = ctx.scene; [gAcid, gBase].forEach(function (g) { if (g) sc.remove(g); });
    gAcid = new T.Group(); gAcid.add(ctx.mol(c.acid, { gs: 1.0, ar: 0.46 })); gAcid.position.x = -6;
    var hp = c.hpos, hh = new T.Mesh(new T.SphereGeometry(0.62, 18, 12), new T.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.45, depthWrite: false })); hh.position.set(hp[1], hp[2], hp[3]); gAcid.add(hh);
    gBase = new T.Group(); gBase.add(ctx.mol(c.base, { gs: 1.0, ar: 0.46 })); gBase.position.x = 6;
    clouds = []; c.share.forEach(function (sh, i) {
      if (!sh) return; var a = c.base.a[i], r = 0.5 + 1.15 * Math.sqrt(sh), m = new T.Mesh(new T.SphereGeometry(r, 22, 16), new T.MeshBasicMaterial({ color: 0xff5c5c, transparent: true, opacity: 0.25 + 0.3 * sh, depthWrite: false }));
      m.position.set(a[1], a[2], a[3]); m.userData = { r: r, sh: sh, i: i }; gBase.add(m); clouds.push(m);
    });
    arrows = [];
    c.acid.a.forEach(function (a, i) { if (c.acid.tag[i] === 'i') { var cc = c.acid.a[c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][0] === i ? c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][1] : c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][0]]; var from = new T.Vector3(cc[1], cc[2], cc[3]), to = new T.Vector3(a[1], a[2], a[3]), d = to.clone().sub(from), L = d.length(); var ar = new T.ArrowHelper(d.clone().normalize(), from.clone().addScaledVector(d.clone().normalize(), L * 0.25), L * 0.55, 0xffa94d, 0.4, 0.28); gAcid.add(ar); arrows.push(ar); } });
    sc.add(gAcid); sc.add(gBase); key_ = S.cp;
  }
  function setCp(id) { S.cp = id; }
  var def = {
    key: 'acidez-organica-pka', title: 'Acidez orgánica y pKa', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#fb923c', light: '#c2410c' },
    stages: stages, nStages: 7, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 2, 27], target: [0, 0.5, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0.5, 27], target: [0, 0.5, 0] }, { id: 'sup', label: 'Superior', pos: [0, 26, 5], target: [0, 0, 0] }],
    layers: [{ id: 'cloud', label: 'Nube de carga', icon: '◉' }, { id: 'ion', label: 'Ionización', icon: '⚛' }],
    build: function (ctx) {
      var s = ctx.scene, sg = new T.SphereGeometry(1, 12, 9); dummy = new T.Object3D();
      hA = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0x9aa7b4, roughness: 0.5 }), NP); aA = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xff5c5c, roughness: 0.4 }), NP); hA.frustumCulled = aA.frustumCulled = false; s.add(hA); s.add(aA);
      proton = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xaa8800, roughness: 0.3 })); s.add(proton);
      bSph = new T.Mesh(new T.SphereGeometry(0.9, 22, 16), new T.MeshStandardMaterial({ color: 0x4f8bff, roughness: 0.4, transparent: true, opacity: 0.85 })); bSph.position.set(0, 5.2, 0); s.add(bSph);
      lab.a = ctx.label('', 'bl-warn'); lab.b = ctx.label('', 'bl-lead'); lab.t = ctx.label('', 'bl-d'); lab.n1 = ctx.label('', 'bl-d'); lab.n2 = ctx.label('', 'bl-d'); lab.io = ctx.label('', 'bl-d'); lab.k = ctx.label('', 'bl-pos');
      lab.c = []; for (var i = 0; i < 8; i++) lab.c.push(ctx.label('', 'bl-warn'));
      rebuild(ctx);
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var st = LESSON[f.i], n = st.list.length, ix = Math.min(n - 1, Math.floor(f.local * n)); if (S._st !== f.i || S._ix !== ix) { S._st = f.i; S._ix = ix; S.cp = st.list[ix]; S.b = st.bs[Math.min(ix, st.bs.length - 1)]; S.pH = f.i === 6 ? 7 : st.pH(CID[S.cp]); }
      }
      if (S.cp !== key_) rebuild(ctx);
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b), now = ctx.now;
      // protón: sale del ácido hacia la base; si K<1 vuelve
      var p = (now * 0.3) % 1, hw = new T.Vector3(c.hpos[1] - 6, c.hpos[2], c.hpos[3]), bw = new T.Vector3(0, 4.3, 0), q = Kk >= 1 ? ctx.ease(Math.min(1, p / 0.6)) : Math.sin(Math.min(1, p / 0.8) * Math.PI) * 0.45;
      proton.position.lerpVectors(hw, bw, q); proton.visible = true;
      var land = Kk >= 1 && p > 0.6; bSph.material.color.setHex(land ? 0xff9f43 : 0x4f8bff);
      var cl = ctx.layer('cloud'); clouds.forEach(function (m) { m.visible = cl; var pu = 1 + 0.06 * Math.sin(now * 3 + m.userData.i); m.scale.setScalar(pu); });
      arrows.forEach(function (ar) { ar.visible = ctx.layer('cloud'); });
      // ionización según pH
      var al = alpha(c.pka, S.pH), nA = Math.round(NP * al), io = ctx.layer('ion');
      for (var i = 0; i < NP; i++) { var pp = perm[i], col = pp % 20, row = Math.floor(pp / 20); dummy.position.set((col - 9.5) * 0.9, -5.4 - row * 0.9, 0); dummy.scale.setScalar(0.3); dummy.updateMatrix(); if (i < nA) aA.setMatrixAt(i, dummy.matrix); else hA.setMatrixAt(i - nA, dummy.matrix); }
      aA.count = io ? nA : 0; hA.count = io ? NP - nA : 0; aA.instanceMatrix.needsUpdate = true; hA.instanceMatrix.needsUpdate = true;
      lab.a.pos(-6, 4.3, 0).set('HA · pKa ' + f2(c.pka), 'bl-warn').vis(true); lab.b.pos(6, 4.3, 0).set('A⁻ · carga sobre ' + c.nsite + (c.nsite === 1 ? ' átomo' : ' átomos'), 'bl-lead').vis(true);
      lab.t.pos(0, 7.1, 0).set(b.n + ' · pKa(HB) ' + f2(b.ph), 'bl-d').vis(true);
      lab.n1.pos(-6, -3.1, 0).set(c.n, 'bl-d').vis(true); lab.n2.pos(6, -3.1, 0).set(c.fam, 'bl-d').vis(true);
      lab.k.pos(0, 2.3, 0).set((Kk >= 1 ? '→ ' : '← ') + 'K = ' + sciK(Kk), Kk >= 1 ? 'bl-neg' : 'bl-warn').vis(true);
      lab.io.pos(0, -4.5, 0).set('pH ' + f2(S.pH) + ' · [A⁻] = ' + f1(al * 100) + ' %', 'bl-d').vis(io);
      lab.c.forEach(function (L, k) { var m = clouds[k]; if (m && cl && clouds.length <= 8) { L.pos(6 + m.position.x, m.position.y + m.userData.r + 0.45, m.position.z).set('δ⁻ ' + fmt(m.userData.sh * 100, 0) + ' %', 'bl-warn').vis(true); } else L.vis(false); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cp) u.cp.set(S.cp); if (u.b) u.b.set(S.b); if (!ctx.P.manual && u.pH) u.pH.set(S.pH); },
    hud: function () {
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b);
      return { eq: { chip: 'pKa', name: 'HA + B ⇌ A⁻ + HB', body: '<div class="eqline"><small>Ácido</small>' + c.n + '</div><div class="eqline"><small>pKa (HA)</small>' + f2(c.pka) + '</div><div class="eqline"><small>Base</small>' + b.n + ' (pKa de HB = ' + f2(b.ph) + ')</div><div class="eqline"><small>K</small>' + sciK(Kk) + (Kk >= 1 ? ' · favorece productos' : ' · favorece reactivos') + '</div>' },
        legend: [{ label: 'H ácido', color: '#ffd43b', text: 'protón que se pierde' }, { label: 'Nube', color: '#ff5c5c', text: 'carga negativa de A⁻' }, { label: 'Flecha', color: '#ffa94d', arrow: true, text: 'efecto inductivo (−I)' }] };
    },
    measures: function () { var c = CID[S.cp], b = BID[S.b], Kk = K(c, b); return [['Ácido', c.n], ['Tipo', c.fam], ['pKa', f2(c.pka)], ['Ka', sciK(Math.pow(10, -c.pka))], ['Base', b.n], ['pKa de HB', f2(b.ph)], ['K del equilibrio', sciK(Kk)], ['ΔG° (25 °C)', f1(dG(c, b)) + ' kJ/mol'], ['pH', f2(S.pH)], ['[A⁻] a ese pH', f1(alpha(c.pka, S.pH) * 100) + ' %']]; },
    ideas: ['<b>pKa = −log Ka</b>: menor pKa ⇒ ácido más fuerte. Cada unidad es un factor 10 en Ka.', 'Cuanto más estable es la <b>base conjugada</b>, más ácido es el compuesto: hibridación, electronegatividad/tamaño, resonancia e inducción.', '<b>K = 10<sup>pKa(HB) − pKa(HA)</sup></b>: el equilibrio se desplaza hacia el ácido más débil.', '<b>Henderson–Hasselbalch</b>: pH = pKa + log([A⁻]/[HA]); a pH = pKa el ácido está 50 % ionizado.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Ácido'); el.appendChild(c);
      ui.cp = kit.ui.options({ label: 'Compuesto', cols: 3, value: S.cp, options: CP.map(function (x) { return { v: x.id, label: x.n.replace(/ \(.*\)/, ''), sub: 'pKa ' + f2(x.pka) }; }), onChange: function (v) { ctx.goManual(); setCp(v); } }); c.appendChild(ui.cp);
      var b = kit.ui.card('Base y pH'); el.appendChild(b);
      ui.b = kit.ui.options({ label: 'Base', cols: 3, value: S.b, options: BS.map(function (x) { return { v: x.id, label: x.ex, sub: 'pKa de HB ' + f2(x.ph) }; }), onChange: function (v) { ctx.goManual(); S.b = v; } }); b.appendChild(ui.b);
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.05, value: S.pH, format: function (v) { return f2(v); }, onInput: function (v) { ctx.goManual(); S.pH = v; } }); b.appendChild(kit.ui.sliders([ui.pH]));
      b.appendChild(ctx.btnRow([{ t: 'pH = pKa del ácido', fn: function () { ctx.goManual(); S.pH = CID[S.cp].pka; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card('Por qué es así'); el.appendChild(t); var tx = document.createElement('p'); tx.className = 'muted small'; t.appendChild(tx); ui.tip = tx;
      ui.refresh = function () { var k2 = S.cp; if (ui._k !== k2) { ui._k = k2; tx.innerHTML = CID[k2].tip; } };
    },
    graphs: [
      { title: 'Escala de pKa', h: 330, note: 'Barras: pKa de cada compuesto (más corto = más ácido). La línea punteada es el pKa del ácido conjugado de la base elegida.', draw: function (cx, w, h, col) {
        var arr = CP.slice().sort(function (a, b) { return a.pka - b.pka; }), L = 128, R = 34, T0 = 8, rh = (h - T0 - 22) / arr.length, pw = w - L - R, mx = 52, b = BID[S.b];
        cx.font = '10px system-ui'; arr.forEach(function (c, i) { var y = T0 + i * rh, sel = c.id === S.cp; cx.fillStyle = sel ? '#ff9f43' : (c.pka < b.ph ? '#8aa0b4' : '#5b6d7e'); cx.fillRect(L, y + 2, Math.max(2, pw * c.pka / mx), rh - 4); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.n.replace(/ \(.*\)/, ''), L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f2(c.pka), L + pw * c.pka / mx + 4, y + rh / 2 + 3); });
        var xb = L + pw * b.ph / mx; cx.strokeStyle = '#4f8bff'; cx.setLineDash([4, 3]); cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(xb, T0); cx.lineTo(xb, h - 20); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; cx.fillStyle = '#4f8bff'; cx.textAlign = 'center'; cx.fillText('pKa(HB) = ' + f2(b.ph), Math.min(w - 50, Math.max(L + 40, xb)), h - 6);
      } },
      { title: 'Ionización según el pH', h: 200, note: 'Fracción de A⁻ = 1 / (1 + 10^(pKa − pH)). A pH = pKa vale 50 %.', draw: function (cx, w, h, col) {
        var c = CID[S.cp], L = 38, R = 12, Tp = 12, B = 30, pw = w - L - R, ph = h - Tp - B, sx = function (p) { return L + pw * p / 14; }, sy = function (a) { return Tp + ph - ph * a; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var y = sy(j / 4); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(Math.round(j * 25) + ' %', L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q2 = 0; q2 <= 14; q2 += 2) cx.fillText(String(q2), sx(q2), h - B + 13); cx.fillText('pH', L + pw / 2, h - 4);
        cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.6; cx.beginPath(); for (var i = 0; i <= 100; i++) { var p = 14 * i / 100, yy = sy(alpha(c.pka, p)); if (i === 0) cx.moveTo(sx(p), yy); else cx.lineTo(sx(p), yy); } cx.stroke(); cx.lineWidth = 1;
        cx.setLineDash([4, 3]); cx.strokeStyle = '#4f8bff'; var xp = sx(Math.min(14, Math.max(0, c.pka))); cx.beginPath(); cx.moveTo(xp, Tp); cx.lineTo(xp, Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#4f8bff'; cx.textAlign = 'left'; cx.fillText('pKa ' + f2(c.pka) + (c.pka > 14 ? ' (fuera de escala)' : ''), Math.min(xp + 4, w - 90), Tp + 10);
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.pH), sy(alpha(c.pka, S.pH)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, al = alpha(c.pka, S.pH), d = b.ph - c.pka;
      return '<div class="card-kicker">' + c.n + ' + ' + b.ex + '</div><div class="calc-step">1 · Constante del equilibrio</div><table class="calc-table">' + row('ΔpKa', 'pKa(HB) − pKa(HA) = ' + f2(b.ph) + ' − ' + f2(c.pka) + ' = <b>' + f2(d) + '</b>') + row('K', '10<sup>' + f2(d) + '</sup> = <b>' + sciK(Kk) + '</b>') + row('Conclusión', Kk >= 1 ? '<span class="calc-ok">favorece productos (A⁻ + HB)</span>' : '<span class="calc-hi">favorece reactivos (HA + B⁻)</span>') + '</table>' +
        '<div class="calc-step">2 · Energía libre</div><table class="calc-table">' + row('ΔG°', '−RT ln K = −5,708 kJ/mol × ΔpKa = <b>' + f1(dG(c, b)) + ' kJ/mol</b>') + '</table>' +
        '<div class="calc-step">3 · Ionización en agua al pH elegido</div><table class="calc-table">' + row('pH', f2(S.pH)) + row('[A⁻]/[HA]', '10<sup>pH − pKa</sup> = 10<sup>' + f2(S.pH - c.pka) + '</sup> = ' + sciK(Math.pow(10, S.pH - c.pka))) + row('Fracción ionizada', '<b>' + f1(al * 100) + ' %</b>') + '</table>' + (c.pka > 15.7 ? '<p class="muted small">Con pKa &gt; 15,7 el agua no sirve como disolvente de A⁻: el hidróxido es una base demasiado débil. Se usa una base más fuerte en disolvente no prótico.</p>' : '');
    },
    quiz: [
      { q: '¿Cuál de estos compuestos es el ácido más fuerte?', options: ['Ácido tricloroetanoico (pKa 0,65)', 'Ácido etanoico (pKa 4,76)', 'Fenol (pKa 10,0)', 'Etanol (pKa 15,9)'], answer: 0, why: 'A menor pKa, mayor acidez; los tres cloros estabilizan el carboxilato por efecto inductivo.' },
      { q: '¿Por qué el etino (pKa 25) es mucho más ácido que el etano (pKa 50)?', options: ['El carbanión sp tiene 50 % de carácter s: el par está más cerca del núcleo', 'El C–H del etino es más largo', 'El etino tiene más hidrógenos', 'El etano es más polar'], answer: 0, why: 'A mayor carácter s, orbital más estable y base conjugada menos energética (sp > sp² > sp³).' },
      { q: '¿Por qué el fenol (10,0) es más ácido que el etanol (15,9)?', options: ['El fenóxido deslocaliza la carga en el anillo por resonancia', 'El fenol tiene más átomos de carbono', 'El etanol es un ácido de Lewis', 'El fenol no forma puentes de hidrógeno'], answer: 0, why: 'La carga del O⁻ se reparte hacia las posiciones orto y para del anillo, estabilizando la base conjugada.' },
      { q: 'Fenol (pKa 10,0) + HO⁻ (pKa de H₂O = 15,7). ¿Cuánto vale K?', options: ['≈ 5 × 10⁵ (favorece productos)', '≈ 2 × 10⁻⁶ (favorece reactivos)', '≈ 1,6', '≈ 5,7'], answer: 0, why: 'K = 10^(15,7 − 10,0) = 10^5,7 ≈ 5 × 10⁵.' },
      { q: 'A pH = pKa, ¿qué fracción del ácido está ionizada?', options: ['50 %', '10 %', '90 %', '99 %'], answer: 0, why: 'Con pH = pKa, [A⁻] = [HA] (Henderson–Hasselbalch).' },
      { q: 'El ácido acético (pKa 4,76) está en una disolución de pH 6,76. ¿Cuál es [A⁻]/[HA]?', options: ['100', '10', '0,01', '2'], answer: 0, why: 'log([A⁻]/[HA]) = pH − pKa = 2, luego la razón es 10² = 100 (≈ 99 % ionizado).' },
      { q: '¿Qué base sirve para desprotonar casi por completo al etino (pKa 25)?', options: ['NaNH₂ (pKa de NH₃ = 38)', 'NaOH (pKa de H₂O = 15,7)', 'NaHCO₃ (pKa de H₂CO₃ = 6,35)', 'CH₃COONa (pKa 4,76)'], answer: 0, why: 'La base debe tener un ácido conjugado de pKa bastante mayor que 25; solo el amiduro cumple.' },
      { q: 'El etanotiol (10,6) es más ácido que el etanol (15,9), aunque el S es menos electronegativo que el O. ¿Por qué?', options: ['El S⁻ es más grande y polarizable: reparte mejor la carga', 'El enlace S–H es más fuerte', 'El S forma más puentes de hidrógeno', 'El etanol está más ionizado'], answer: 0, why: 'Al bajar en el grupo prevalece el tamaño (polarizabilidad) sobre la electronegatividad.' }
    ],
    help: { intro: 'Elige un compuesto y una base en «Lab», o sigue la lección. Observa la nube roja de la base conjugada: cuantos más átomos la comparten, más estable es y más ácido el compuesto.', items: [['Protón amarillo', 'sale del ácido hacia la base; si K &lt; 1 vuelve a su lugar.'], ['Nube roja', 'reparte la carga negativa de A⁻ (δ⁻ por átomo).'], ['Flechas', 'efecto inductivo hacia los halógenos.'], ['Esferas de abajo', 'fracción ionizada al pH elegido (gris HA, rojo A⁻).'], ['Gráficos', 'escala de pKa y curva de ionización.'], ['Controles', '«Compuesto», «Base» y «pH».']], try: ['Compara etanol y fenol: en el fenóxido la nube roja se reparte por el anillo y el fenol resulta más ácido.', 'Elige un ácido con halógenos cerca del grupo ácido: el efecto inductivo baja el pKa.', 'Ajusta el pH al pKa: la mitad de las esferas queda ionizada.'] }
  };
  MSim.create(def);
})();
