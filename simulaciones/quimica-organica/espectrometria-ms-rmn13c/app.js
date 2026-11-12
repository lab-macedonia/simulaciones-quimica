/* Espectrometría de masas y RMN de 13C — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

/* Utilidades para simuladores de mecanismos: puesta en escena de moléculas, flechas curvas con electrón viajero y acoplamiento de grupos. */
(function () {
  var T = THREE;
  MSim.idx = function (g, tag, nth) { var c = 0, n = nth || 0; for (var i = 0; i < g.tag.length; i++) { if (g.tag[i] === tag) { if (c === n) return i; c++; } } return -1; };
  MSim.vec = function (g, i) { return new T.Vector3(g.a[i][1], g.a[i][2], g.a[i][3]); };
  /* quita el primer H con la etiqueta dada (p. ej. el H que se pierde al formar el anión) */
  MSim.strip = function (g, tag) {
    var k = -1, i; for (i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === tag) { k = i; break; } }
    var map = {}, A = [], TG = [], B = []; g.a.forEach(function (a, j) { if (j !== k) { map[j] = A.length; A.push(a.slice()); TG.push(g.tag[j]); } });
    g.b.forEach(function (b) { if (b[0] !== k && b[1] !== k) B.push([map[b[0]], map[b[1]], b[2]]); });
    return { a: A, b: B, tag: TG, h: k >= 0 ? g.a[k].slice(1) : null };
  };
  /* posición mundial del átomo i de un grupo creado con ctx.mol(geo, {gs}) */
  MSim.wp = function (grp, g, i, gs) { grp.updateMatrixWorld(true); return grp.localToWorld(MSim.vec(g, i).multiplyScalar(gs || 1)); };
  /* coloca el grupo de modo que el átomo i quede en «target» y el resto de la molécula se extienda hacia «away» */
  MSim.dock = function (grp, g, i, target, away, gs) {
    var p = MSim.vec(g, i).multiplyScalar(gs || 1), v = p.clone().negate(); if (v.lengthSq() < 1e-6) v.set(1, 0, 0); v.normalize();
    grp.quaternion.setFromUnitVectors(v, away.clone().normalize()); grp.position.copy(target).sub(p.applyQuaternion(grp.quaternion));
  };
  MSim.stage = function (ctx) {
    var cache = {};
    return {
      begin: function () { Object.keys(cache).forEach(function (k) { cache[k].visible = false; cache[k].quaternion.set(0, 0, 0, 1); }); },
      put: function (key, geo, x, y, z, o) {
        o = o || {}; var g = cache[key];
        if (!g) {
          g = new T.Group(); g.userData.geo = geo; g.userData.gs = o.gs || 1; g.add(ctx.mol(geo, { gs: o.gs || 1, ar: o.ar || 0.46 }));
          (o.halos || []).forEach(function (h) { var i = MSim.idx(geo, h.tag, h.nth); if (i < 0) return; var a = geo.a[i], m = new T.Mesh(new T.SphereGeometry(h.r || 0.7, 18, 12), new T.MeshBasicMaterial({ color: h.color, transparent: true, opacity: h.op == null ? 0.38 : h.op, depthWrite: false })); m.position.set(a[1] * (o.gs || 1), a[2] * (o.gs || 1), a[3] * (o.gs || 1)); m.userData.halo = h.kind || 'halo'; g.add(m); });
          ctx.scene.add(g); cache[key] = g;
        }
        g.visible = true; g.position.set(x || 0, y || 0, z || 0); return g;
      },
      get: function (k) { return cache[k]; },
      halos: function (on, kind) { Object.keys(cache).forEach(function (k) { cache[k].children.forEach(function (c) { if (c.userData.halo && (!kind || c.userData.halo === kind)) c.visible = on; }); }); }
    };
  };
  MSim.arrow = function (ctx, color) {
    var grp = new T.Group(), mat = new T.MeshBasicMaterial({ color: color || 0xff7a3d }), mesh = null, head = new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), mat), dot = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), new T.MeshBasicMaterial({ color: 0xffeb3b })), curve = null, key = '';
    grp.add(head); grp.add(dot); ctx.scene.add(grp); grp.visible = false;
    return {
      group: grp,
      set: function (p0, p1, bend, on) {
        grp.visible = !!on; if (!on) return;
        var k = [p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, bend.x, bend.y, bend.z].map(function (v) { return v.toFixed(2); }).join();
        if (k !== key) {
          key = k; if (mesh) { mesh.geometry.dispose(); grp.remove(mesh); }
          var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bend); curve = new T.QuadraticBezierCurve3(p0, mid, p1);
          mesh = new T.Mesh(new T.TubeGeometry(curve, 16, 0.05, 6, false), mat); grp.add(mesh);
          var tan = p1.clone().sub(curve.getPoint(0.9)).normalize(); head.position.copy(p1).addScaledVector(tan, -0.15); head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan);
        }
      },
      tick: function (now) { if (grp.visible && curve) dot.position.copy(curve.getPoint((now * 0.7) % 1)); }
    };
  };
})();


(function () {
  var f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var ENVC = { a: 0x4dabf7, b: 0x51cf66, c: 0xffd43b, d: 0xff922b, e: 0xcc5de8 };
  var A = 'all';
  var M = {
    etoh: { n: 'Etanol', f: 'C₂H₆O', s: 'C{a1}C{b1}O{o}', M: 46, cn: { a: [18, 'CH₃'], b: [58, 'CH₂–O'] }, pk: [[27, 23, 'C₂H₃⁺', ['a1', 'b1']], [29, 30, 'C₂H₅⁺ / HCO⁺', ['a1', 'b1']], [31, 100, 'CH₂=OH⁺ (rotura α)', ['b1', 'o']], [45, 50, '[M−H]⁺', A], [46, 22, 'M⁺•', A]] },
    prop: { n: 'Propanona', f: 'C₃H₆O', s: 'C{a1}C{b1}(=O{o})C{a2}', M: 58, cn: { a: [30, 'CH₃–C=O'], b: [206, 'C=O'] }, pk: [[15, 18, 'CH₃⁺', ['a1']], [43, 100, 'CH₃C≡O⁺ (rotura α)', ['a1', 'b1', 'o']], [58, 45, 'M⁺•', A]] },
    buta: { n: 'Butanona', f: 'C₄H₈O', s: 'C{a1}C{b1}C{c1}(=O{o})C{d1}', M: 72, cn: { a: [7, 'CH₃–CH₂'], b: [37, 'CH₂–C=O'], c: [209, 'C=O'], d: [29, 'CH₃–C=O'] }, pk: [[29, 25, 'C₂H₅⁺', ['a1', 'b1']], [43, 100, 'CH₃C≡O⁺ (rotura α)', ['d1', 'c1', 'o']], [57, 25, 'C₂H₅C≡O⁺ (rotura α)', ['a1', 'b1', 'c1', 'o']], [72, 30, 'M⁺•', A]] },
    pen3: { n: 'Pentan-3-ona', f: 'C₅H₁₀O', s: 'C{a1}C{b1}C{c1}(=O{o})C{b2}C{a2}', M: 86, cn: { a: [8, 'CH₃'], b: [35, 'CH₂–C=O'], c: [211, 'C=O'] }, pk: [[29, 45, 'C₂H₅⁺', ['a1', 'b1']], [57, 100, 'C₂H₅C≡O⁺ (rotura α)', ['a1', 'b1', 'c1', 'o']], [86, 30, 'M⁺•', A]] },
    pen2: { n: 'Pentan-2-ona', f: 'C₅H₁₀O', s: 'C{a1}C{b1}C{c1}C{d1}(=O{o})C{e1}', M: 86, cn: { a: [13.7, 'CH₃'], b: [17.3, 'CH₂'], c: [45.7, 'CH₂–C=O'], d: [209, 'C=O'], e: [29.9, 'CH₃–C=O'] }, pk: [[43, 100, 'CH₃C≡O⁺ (rotura α)', ['e1', 'd1', 'o']], [58, 40, 'ion de McLafferty (CH₂=C(OH)CH₃)⁺•', ['c1', 'd1', 'e1', 'o']], [71, 10, 'C₃H₇C≡O⁺', ['a1', 'b1', 'c1', 'd1', 'o']], [86, 20, 'M⁺•', A]] },
    brom: { n: 'Bromoetano', f: 'C₂H₅Br', s: 'C{a1}C{b1}Br{o}', M: 108, iso: 'Br', cn: { a: [20, 'CH₃'], b: [28, 'CH₂–Br'] }, pk: [[27, 65, 'C₂H₃⁺', ['a1', 'b1']], [29, 100, 'C₂H₅⁺', ['a1', 'b1']], [108, 58, 'M⁺• (⁷⁹Br)', A], [110, 57, 'M+2 (⁸¹Br)', A]] },
    clor: { n: 'Cloroetano', f: 'C₂H₅Cl', s: 'C{a1}C{b1}Cl{o}', M: 64, iso: 'Cl', cn: { a: [19, 'CH₃'], b: [40, 'CH₂–Cl'] }, pk: [[27, 60, 'C₂H₃⁺', ['a1', 'b1']], [28, 100, 'C₂H₄⁺•', ['a1', 'b1']], [29, 45, 'C₂H₅⁺', ['a1', 'b1']], [64, 55, 'M⁺• (³⁵Cl)', A], [66, 18, 'M+2 (³⁷Cl)', A]] },
    dea: { n: 'Dietilamina', f: 'C₄H₁₁N', s: 'C{a1}C{b1}N{o}C{b2}C{a2}', M: 73, cn: { a: [15, 'CH₃'], b: [44, 'CH₂–N'] }, pk: [[30, 40, 'CH₂=NH₂⁺', ['b1', 'o']], [44, 15, 'C₂H₆N⁺', ['b1', 'o', 'a1']], [58, 100, 'CH₃CH₂NH=CH₂⁺ (rotura α)', ['b1', 'o', 'b2', 'a2']], [73, 25, 'M⁺•', A]] }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var SCALE = [['C–C alquilo', 5, 45], ['C–N', 30, 60], ['C–Cl / C–Br', 20, 65], ['C–O', 50, 90], ['C=C, aromático', 100, 150], ['C=O (ácido, éster)', 160, 185], ['C=O (aldehído, cetona)', 190, 220]];
  var S = { m: 'prop', hi: 0, env: -1, view: 'ms', hide: false, _st: -1, _mk: '' }, lab = {}, SG, halos = [];
  function envs(k) { return Object.keys(M[k].cn); }
  function nC(k, e) { var c = 0; G[k].tag.forEach(function (t, i) { if (t && t[0] === e && G[k].a[i][0] === 'C') c++; }); return c; }
  function stages() {
    return [
      ['Ion molecular', 'Ion molecular', 'M + e⁻ → M⁺• + 2 e⁻: el pico de mayor m/z da la masa molar',
        '<p>En <b>espectrometría de masas</b> (impacto electrónico) la molécula pierde un electrón y forma el <b>ion molecular M⁺•</b>, cuya relación <b>m/z</b> es la masa molar (con z = 1). Los iones se separan por m/z y se registra su abundancia relativa; el pico más intenso es el <b>pico base</b> (100 %). <b>Regla del nitrógeno</b>: M impar ⇔ número impar de átomos de N (dietilamina, M = 73). Los iones inestables dan fragmentos más ligeros.</p>'],
      ['Isótopos de Cl y Br', 'Isótopos', 'Cl: M / M+2 = 3 : 1 · Br: M / M+2 = 1 : 1',
        '<p>Los halógenos tienen isótopos naturales muy característicos: <b>³⁵Cl : ³⁷Cl = 75,8 : 24,2 ≈ 3 : 1</b>; <b>⁷⁹Br : ⁸¹Br = 50,7 : 49,3 ≈ 1 : 1</b>. Un compuesto con un Cl muestra picos <b>M y M+2 en proporción 3:1</b>; con un Br, <b>1:1</b>. Además el ¹³C (1,1 %) produce un pequeño pico <b>M+1</b> ≈ 1,1 % por C, útil para contar carbonos.</p>'],
      ['Fragmentación', 'Fragmentación', 'Rotura α, McLafferty: el ion se rompe por los enlaces más débiles y da el catión más estable',
        '<p>El M⁺• se fragmenta. En cetonas, aminas y alcoholes domina la <b>rotura α</b> (el enlace C–C junto al heteroátomo): propanona → <b>CH₃C≡O⁺ (m/z 43)</b>; dietilamina → <b>m/z 58</b>; etanol → <b>CH₂=OH⁺ (m/z 31)</b>. Si hay un H en γ al C=O, ocurre la <b>transposición de McLafferty</b> (pentan-2-ona → <b>m/z 58</b>, con pérdida de eteno). Los fragmentos resaltados se muestran en la molécula.</p>'],
      ['RMN de ¹³C: señales', 'Señales', 'Una señal por cada carbono químicamente distinto',
        '<p>En <b>RMN de ¹³C</b> (desacoplada de protón) cada carbono <b>no equivalente</b> da una señal. La <b>simetría</b> reduce el número: la <b>propanona</b> (dos CH₃ equivalentes) da 2 señales; la <b>pentan-3-ona</b>, 3; la <b>butanona</b>, 4 y la <b>pentan-2-ona</b>, 5. Los colores de la molécula muestran los carbonos equivalentes (mismo color). La intensidad no es proporcional al número de C.</p>'],
      ['Desplazamiento químico', 'δ (ppm)', 'Los carbonos más desprotegidos (C=O, C–O) salen a mayor δ',
        '<p>El <b>desplazamiento químico δ</b> (ppm, respecto al TMS) depende del entorno electrónico: los átomos electronegativos y los carbonilos <b>desprotegen</b> el carbono. Aproximadamente: <b>alquilo 5–45 · C–N 30–60 · C–O 50–90 · C=C/aromático 100–150 · C=O de ácido/éster 160–185 · C=O de aldehído/cetona 190–220</b> ppm. La señal a ≈ 209 ppm de la butanona identifica un carbonilo de cetona.</p>'],
      ['Resolver una estructura', 'Resolver', 'Combina M⁺•, fragmentos y nº de señales de ¹³C',
        '<p>Estrategia: 1) <b>M</b> y regla del N → fórmula; 2) isótopos (Cl/Br); 3) <b>fragmentos</b> característicos (43 = CH₃CO, 57 = C₂H₅CO, 58 = McLafferty/α de amina); 4) <b>nº de señales ¹³C</b> y sus δ → grupos funcionales y simetría. En «Lab» activa «Modo problema» para ocultar el nombre y deducir la estructura sólo con los espectros.</p>']
    ];
  }
  var SEG = [['prop', 'etoh', 'dea'], ['clor', 'brom'], ['prop', 'pen2', 'dea', 'etoh'], ['prop', 'pen3', 'buta', 'pen2'], ['buta'], ['pen3', 'brom', 'dea', 'pen2']];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var def = {
    key: 'espectrometria-ms-rmn13c', title: 'Espectrometría de masas y RMN de ¹³C', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#818cf8', light: '#3730a3' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 3, 15], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0.5, 15], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 15, 2], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: 'Fragmento / entornos de C', icon: '◎' }],
    build: function (ctx) {
      SG = MSim.stage(ctx); Object.keys(M).forEach(function (k) { SG.put(k, G[k], 0, 0, 0, { gs: 1.5 }); });
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
      Object.keys(M).forEach(function (k) { var g = SG.get(k); g.userData.hs = []; G[k].a.forEach(function (a, i) { var t = G[k].tag[i]; if (!t || a[0] === 'H') return; var h = new T.Mesh(new T.SphereGeometry(0.95, 18, 12), new T.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.42, depthWrite: false })); h.position.set(a[1] * 1.5, a[2] * 1.5, a[3] * 1.5); h.userData = { tag: t }; g.add(h); g.userData.hs.push(h); }); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, sq = SEG[i], n = sq.length, ix = Math.min(n - 1, Math.floor(f.local * n)), lq = (f.local * n) % 1; S.m = sq[ix]; S.hide = false;
        S.view = (i <= 2) ? 'ms' : 'cn'; var m = M[S.m];
        if (i === 0) { S.hi = m.pk.length - 1; } else if (i === 1) { S.hi = m.pk.length - Math.floor(lq * 2.2) - 1; if (S.hi < 0) S.hi = m.pk.length - 1; } else if (i === 2) { S.hi = Math.min(m.pk.length - 2, Math.floor(lq * (m.pk.length - 1))); }
        else if (i === 3) { S.env = -1; } else if (i === 4) { S.env = Math.floor(lq * 4.99) % envs(S.m).length; } else { S.view = lq < 0.5 ? 'ms' : 'cn'; S.hi = Math.min(m.pk.length - 1, Math.floor(lq * 2 * m.pk.length)); S.env = -1; }
        if (i !== 4 && i !== 5 && i !== 3) S.env = -1;
      }
      var m = M[S.m]; SG.begin(); var g = SG.put(S.m, G[S.m], 0, 0.5, 0, { gs: 1.5 }); g.rotation.y = now * 0.25; var on = ctx.layer('halo');
      var pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))], fr = pk[3];
      g.userData.hs.forEach(function (h) {
        var t = h.userData.tag, c = null;
        if (S.view === 'cn') { var e = t[0]; if (ENVC[e] && m.cn[e]) { c = ENVC[e]; if (S.env >= 0 && envs(S.m)[S.env] !== e) { c = null; } } }
        else if (fr) { if (fr === A || fr.indexOf(t) >= 0) c = fr === A ? 0x4dabf7 : 0xff922b; }
        h.visible = on && !!c; if (c) h.material.color.setHex(c);
      });
      var hide = S.hide;
      lab.t.pos(0, 5.6, 0).set(hide ? 'Compuesto problema' : m.n + ' · ' + m.f, 'bl-lead').vis(true);
      lab.a.pos(0, -4.6, 0).set(S.view === 'ms' ? 'm/z ' + pk[0] + ' · ' + pk[1] + ' % · ' + (hide ? '?' : pk[2]) : (S.env >= 0 ? envs(S.m)[S.env] && 'δ ' + m.cn[envs(S.m)[S.env]][0] + ' ppm · ' + m.cn[envs(S.m)[S.env]][1] : envs(S.m).length + ' señales de ¹³C (' + G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length + ' C)'), 'bl-pos').vis(true);
      lab.b.pos(0, -5.6, 0).set('M = ' + m.M + (m.M % 2 ? ' (impar → N impar)' : ' (par)') + (m.iso ? ' · patrón ' + (m.iso === 'Cl' ? '3:1 (Cl)' : '1:1 (Br)') : ''), 'bl-d').vis(!hide || true);
      lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); },
    hud: function () { var m = M[S.m], pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))]; return { eq: { chip: 'MS', name: S.hide ? 'Compuesto problema' : m.n, body: '<div class="eqline"><small>M⁺•</small>' + m.M + '</div><div class="eqline"><small>Pico seleccionado</small>m/z ' + pk[0] + '</div><div class="eqline"><small>Señales ¹³C</small>' + envs(S.m).length + '</div>' }, legend: [{ label: 'Naranja', color: '#ff922b', text: 'fragmento del pico' }, { label: 'Colores', color: '#4dabf7', text: 'carbonos equivalentes (¹³C)' }] }; },
    measures: function () { var m = M[S.m], pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))]; return [['Compuesto', S.hide ? '?' : m.n], ['Fórmula', S.hide ? '?' : m.f], ['M⁺• (m/z)', String(m.M)], ['Pico base', String(m.pk.filter(function (p) { return p[1] === 100; })[0][0])], ['Pico seleccionado', 'm/z ' + pk[0] + ' (' + pk[1] + ' %)'], ['Señales ¹³C', String(envs(S.m).length)], ['Átomos de C', String(G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length)]]; },
    ideas: ['<b>M⁺•</b> = masa molar; M impar ⇒ N impar.', 'Cl: M:M+2 = 3:1 · Br: 1:1.', 'Rotura α y McLafferty explican picos base.', '¹³C: una señal por C no equivalente.', 'δ: alquilo < C–O < C=C < C=O.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Compuesto'); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Molécula', cols: 2, value: S.m, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].n, sub: M[k].f }; }), onChange: function (v) { ctx.goManual(); S.m = v; S.hi = M[v].pk.length - 1; S.env = -1; } }); c.appendChild(ui.m);
      ui.hi = kit.ui.slider({ label: 'Pico de masas (índice)', min: 0, max: 4, step: 1, value: 0, format: function (v) { var m = M[S.m]; var p = m.pk[Math.min(v, m.pk.length - 1)]; return 'm/z ' + p[0]; }, onInput: function (v) { ctx.goManual(); S.view = 'ms'; S.hi = Math.min(v, M[S.m].pk.length - 1); } });
      ui.env = kit.ui.slider({ label: 'Entorno de carbono (¹³C)', min: 0, max: 4, step: 1, value: 0, format: function (v) { var e = envs(S.m); var k = e[Math.min(v, e.length - 1)]; return 'δ ' + M[S.m].cn[k][0]; }, onInput: function (v) { ctx.goManual(); S.view = 'cn'; S.env = Math.min(v, envs(S.m).length - 1); } }); c.appendChild(kit.ui.sliders([ui.hi, ui.env]));
      c.appendChild(ctx.btnRow([{ t: 'Modo problema', fn: function () { ctx.goManual(); S.hide = !S.hide; } }, { t: 'Ver ¹³C', fn: function () { ctx.goManual(); S.view = 'cn'; S.env = -1; } }, { t: 'Ver masas', fn: function () { ctx.goManual(); S.view = 'ms'; } }, { t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Espectro de masas (IE)', h: 230, note: 'Abundancia relativa frente a m/z; el pico seleccionado en naranja.', draw: function (cx, w, h, col) {
        var m = M[S.m], L = 36, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = Math.ceil((m.M + 8) / 10) * 10, sx = function (v) { return L + pw * v / mx; }, i;
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 100; i += 25) { var y = Tp + ph - ph * i / 100; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= mx; i += 10) cx.fillText(i, sx(i), h - B + 13); cx.fillText('m/z   ·   % abundancia', L + pw / 2, h - 4);
        m.pk.forEach(function (p, k) { var cur = k === S.hi; cx.strokeStyle = cur ? '#ff922b' : '#818cf8'; cx.lineWidth = cur ? 5 : 3.5; cx.beginPath(); cx.moveTo(sx(p[0]), Tp + ph); cx.lineTo(sx(p[0]), Tp + ph - ph * p[1] / 100); cx.stroke(); cx.fillStyle = col.ink; cx.fillText(p[0], sx(p[0]), Tp + ph - ph * p[1] / 100 - 5); }); cx.lineWidth = 1;
      } },
      { title: 'Espectro de ¹³C (desacoplado)', h: 210, note: 'Una línea por tipo de carbono; δ en ppm decrece hacia la derecha.', draw: function (cx, w, h, col) {
        var m = M[S.m], ks = envs(S.m), L = 14, Rr = 14, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (d) { return L + pw * (1 - d / 220); }, i;
        cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; for (i = 0; i <= 200; i += 50) { cx.beginPath(); cx.moveTo(sx(i), Tp + ph); cx.lineTo(sx(i), Tp + ph + 4); cx.stroke(); cx.fillText(i, sx(i), h - B + 14); } cx.beginPath(); cx.moveTo(L, Tp + ph); cx.lineTo(L + pw, Tp + ph); cx.stroke(); cx.fillText('δ (ppm)', L + pw / 2, h - 4);
        ks.forEach(function (k, j) { var d = m.cn[k][0], cur = S.env === j, c = '#' + ('000000' + ENVC[k].toString(16)).slice(-6), hh = ph * (0.55 + 0.1 * Math.min(2, nC(S.m, k))); cx.strokeStyle = c; cx.lineWidth = cur ? 5 : 3; cx.beginPath(); cx.moveTo(sx(d), Tp + ph); cx.lineTo(sx(d), Tp + ph - hh); cx.stroke(); cx.fillStyle = col.ink; cx.fillText(d, sx(d), Tp + ph - hh - 5); }); cx.lineWidth = 1;
      } },
      { title: 'Escala de desplazamientos químicos', h: 210, note: 'Intervalos típicos de δ ¹³C; los puntos son las señales del compuesto actual.', draw: function (cx, w, h, col) {
        var m = M[S.m], L = 118, Rr = 10, Tp = 10, B = 26, pw = w - L - Rr, rh = (h - Tp - B) / SCALE.length, sx = function (d) { return L + pw * d / 220; }, i;
        cx.font = '10px system-ui'; SCALE.forEach(function (s, k) { cx.fillStyle = 'rgba(129,140,248,.45)'; cx.fillRect(sx(s[1]), Tp + k * rh + 3, sx(s[2]) - sx(s[1]), rh - 6); cx.fillStyle = col.muted; cx.textAlign = 'right'; cx.fillText(s[0], L - 6, Tp + k * rh + rh / 2 + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 200; i += 50) cx.fillText(i, sx(i), h - B + 14);
        envs(S.m).forEach(function (k) { var d = m.cn[k][0]; cx.strokeStyle = '#' + ('000000' + ENVC[k].toString(16)).slice(-6); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx(d), Tp); cx.lineTo(sx(d), h - B); cx.stroke(); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = M[S.m], nc = G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length, pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))];
      return '<div class="card-kicker">' + (S.hide ? 'Compuesto problema' : m.n + ' · ' + m.f) + '</div><div class="calc-step">1 · Masas</div><table class="calc-table">' + row('M⁺•', 'm/z ' + m.M + (m.M % 2 ? ' → N impar' : ' → N par (0, 2…)')) + row('M+1 (¹³C)', '≈ 1,1 % × ' + nc + ' C = <b>' + f1(1.1 * nc) + ' %</b> de M') + (m.iso ? row('M+2', m.iso === 'Cl' ? '≈ 32 % de M (³⁷Cl)' : '≈ 97 % de M (⁸¹Br)') : '') + row('Pico seleccionado', 'm/z ' + pk[0] + ' (' + pk[1] + ' %) · ' + (S.hide ? '?' : pk[2]) + (pk[0] < m.M ? ' · pérdida de ' + (m.M - pk[0]) + ' u' : '')) + '</table>' +
        '<div class="calc-step">2 · ¹³C</div><table class="calc-table">' + envs(S.m).map(function (k) { return row('δ ' + m.cn[k][0], m.cn[k][1] + ' (' + nC(S.m, k) + ' C)'); }).join('') + row('Señales', envs(S.m).length + ' de ' + nc + ' C') + '</table>';
    },
    quiz: [
      { q: 'Un compuesto con M = 73 contiene…', options: ['un número impar de N', 'ningún N', 'un número par de N', 'un Cl'], answer: 0, why: 'Regla del nitrógeno.' },
      { q: 'Un pico M y M+2 en proporción 3:1 indica…', options: ['Cl', 'Br', 'S', 'N'], answer: 0, why: '³⁵Cl:³⁷Cl ≈ 3:1.' },
      { q: 'El pico base de la propanona (m/z 43) corresponde a…', options: ['CH₃C≡O⁺', 'CH₃⁺', 'C₃H₇⁺', 'M⁺•'], answer: 0, why: 'Rotura α del enlace C–C junto al C=O.' },
      { q: 'La pentan-3-ona da en ¹³C…', options: ['3 señales', '5 señales', '2 señales', '1 señal'], answer: 0, why: 'Dos CH₃ y dos CH₂ equivalentes, más el C=O.' },
      { q: 'Una señal de ¹³C a 209 ppm indica…', options: ['C=O de cetona o aldehído', 'un alcano', 'un C–O', 'un aromático'], answer: 0, why: 'Carbonilos de aldehído/cetona: 190–220 ppm.' },
      { q: 'La transposición de McLafferty requiere…', options: ['un H en γ al C=O', 'un halógeno', 'un anillo', 'un doble enlace C=C'], answer: 0, why: 'Transferencia de un H en γ a través de un estado de 6 miembros.' },
      { q: 'En ¹³C desacoplado la intensidad de una señal…', options: ['no es proporcional al nº de C', 'es proporcional', 'es siempre 1', 'depende del disolvente sólo'], answer: 0, why: 'Depende de la relajación y del efecto NOE.' },
      { q: 'El bromoetano muestra M y M+2 en proporción…', options: ['1:1', '3:1', '9:1', '1:3'], answer: 0, why: '⁷⁹Br y ⁸¹Br son casi equiprobables.' }
    ],
    help: { intro: 'Elige la molécula y recorre picos de masas o entornos de ¹³C en «Lab». Los halos de la molécula muestran el fragmento de cada pico (naranja) o los carbonos equivalentes (color).', items: [['Molécula', 'halos naranjas = fragmento del pico de masas elegido; en ¹³C, cada color agrupa los carbonos equivalentes.'], ['Controles', '«Molécula», «Pico de masas (índice)» y «Entorno de carbono (¹³C)»; «Ver masas» y «Ver ¹³C» cambian de espectro.'], ['Modo problema', 'oculta el nombre y la fórmula para que deduzcas la estructura.'], ['Gráficos', '«Espectro de masas (IE)», «Espectro de ¹³C (desacoplado)» y «Escala de desplazamientos químicos».']], try: ['Busca el ion molecular M⁺•: si M es impar, la molécula tiene un número impar de N.', 'Con un compuesto clorado compara M y M+2: relación 3 : 1 (con Br, 1 : 1).', 'Activa el modo problema y deduce la estructura con el número de señales de ¹³C y sus δ.'] }
  };
  MSim.create(def);
})();
