/* Retrosíntesis y síntesis multipaso — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE;
  var TG = {
    t2m: { n: "2-methyl-2-butanol", s: 'O{o}C{a}(C)(C)CC', cls: "tertiary alcohol", R: [
      { d: "Cut C–ethyl", nuc: 'CCBr{x}', nn: 'EtMgBr', el: 'CC{c}(=O{o})C', en: 'acetona', sy: 'Et⁻ + (CH₃)₂C⁺–O⁻', note: "Only one large fragment; both reagents are cheap.", ok: 3 },
      { d: "Cut C–methyl", nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'CCC{c}(=O{o})C', en: "butanone", sy: 'CH₃⁻ + CH₃CH₂(CH₃)C⁺–O⁻', note: "Equivalent to the previous one: two possible routes.", ok: 3 }] },
    fe: { n: "1-phenylethanol", s: 'O{o}C{a}(C)Ph', cls: "secondary alcohol", R: [
      { d: "Cut C–methyl", nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'O{o}=C{c}Ph', en: "benzaldehyde", sy: 'CH₃⁻ + PhCH⁺–O⁻', note: "Aromatic aldehyde: it has no α H, it does not enolize.", ok: 3 },
      { d: "Cut C–phenyl", nuc: 'Br{x}Ph', nn: 'PhMgBr', el: 'CC{c}=O{o}', en: "acetaldehyde", sy: 'Ph⁻ + CH₃CH⁺–O⁻', note: "Acetaldehyde is volatile and enolizes: less convenient.", ok: 2 }] },
    pe: { n: '3-pentanol', s: 'O{o}C{a}(CC)CC', cls: "symmetrical secondary alcohol", R: [
      { d: "Cut C–ethyl", nuc: 'CCBr{x}', nn: 'EtMgBr', el: 'CCC{c}=O{o}', en: 'propanal', sy: 'Et⁻ + CH₃CH₂CH⁺–O⁻', note: "The two possible disconnections are identical by symmetry.", ok: 3 }] },
    fa: { n: "Phenylacetic acid", s: 'O{o}C{a}(=O)CPh', cls: "carboxylic acid", R: [
      { d: "Cut CH₂–COOH", nuc: 'Cl{x}CPh', nn: 'PhCH₂MgCl', el: 'O=C{c}=O{o}', en: 'CO₂', sy: 'PhCH₂⁻ + ⁺CO₂⁻', note: "“COOH” synthon: one carbon is added with CO₂.", ok: 3 }] },
    fp: { n: "2-phenyl-2-propanol", s: 'O{o}C{a}(C)(C)Ph', cls: "tertiary alcohol", R: [
      { d: "Cut C–methyl", nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'CC{c}(=O{o})Ph', en: "acetophenone", sy: 'CH₃⁻ + PhC⁺(CH₃)–O⁻', note: "It is the shortest route.", ok: 3 },
      { d: "Cut C–phenyl", nuc: 'Br{x}Ph', nn: 'PhMgBr', el: 'CC{c}(=O{o})C', en: 'acetona', sy: 'Ph⁻ + (CH₃)₂C⁺–O⁻', note: "Equivalent alternative.", ok: 3 },
      { d: "From an ester", nuc: 'CBr{x}', nn: '2 CH₃MgBr', el: 'O{o}=C{c}(OC)Ph', en: "methyl benzoate", sy: '2 CH₃⁻ + PhC⁺(OMe)–O⁻', note: "Two equivalents of Grignard add two identical methyl groups.", ok: 2 }] }
  };
  var bars = [], S = { t: 't2m', d: 0, p: 0, N: 5, y: 85 }, SG = null, lab = [], arr = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Thinking backwards", "Retrosynthesis", "Start from the target molecule and disconnect until simple materials are reached",
        "<p><b>Retrosynthesis</b> (E. J. Corey) starts from the <b>target molecule</b> and mentally “takes it apart” with a retrosynthetic arrow <b>⇒</b>, until available starting materials are reached. Each <b>disconnection</b> cuts a bond where a known reaction exists that forms it. The ideal fragments are <b>synthons</b> (imaginary cations/anions) whose <b>synthetic equivalent</b> is a real reagent.</p>"],
      ["Disconnecting an alcohol", "C–C disconnection", "The C–C bond next to the carbon bearing the OH is formed with a Grignard",
        "<p>An <b>alcohol</b> is disconnected at the C–C bond next to the carbinol carbon: one fragment is a <b>carbanion</b> (nucleophilic synthon, equivalent <b>R–MgX</b>) and the other a <b>C=O</b> (electrophilic synthon). Choose a target and a disconnection and move “Progress” to see how the fragments separate.</p>"],
      ["Synthons and synthetic equivalents", "Synthons", "R⁻ ↔ R–MgBr ; R₂C⁺–O⁻ ↔ R₂C=O",
        "<p>A synthon does not exist: its <b>synthetic equivalent</b> does. <b>R⁻</b> is obtained with <b>R–MgBr</b> or R–Li; the <b>⁺C–O⁻</b> synthon (polarized carbonyl) is the <b>aldehyde, ketone, ester or CO₂</b>. There are often <b>several possible disconnections</b>: choose the one that gives simpler, cheaper fragments with no incompatible groups.</p>"],
      ["Functional group interconversion", "FGI", "Alcohol ⇄ carbonyl ⇄ acid: the functional group is changed in order to disconnect",
        "<p>Sometimes the target cannot be disconnected directly and a <b>functional group interconversion (FGI)</b> is applied: for example, a 2° alcohol ⇐ ketone (reduction with NaBH₄), a ketone ⇐ 2° alcohol (oxidation), an acid ⇐ Grignard + CO₂ or ⇐ oxidation of a 1° alcohol. FGI chains steps of the synthesis together.</p>"],
      ["Overall yield", "Yield", "In a linear route the yield is multiplied: y₁·y₂·…·yₙ",
        "<p>The <b>overall yield</b> of a linear synthesis is the product of the yields of each step: 5 steps at 85 % give 0.85⁵ = <b>44 %</b>. A <b>convergent synthesis</b> prepares fragments separately and joins them at the end: with the same number of steps it loses less. That is why it pays to shorten the route and be convergent.</p>"]
    ];
  }
  var def = {
    key: 'retrosintesis', title: "Retrosynthesis and Multistep Synthesis", subtitle: "3D simulator · advanced organic chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 3, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Reactive centers", icon: '◎' }],
    build: function (ctx) { SG = MSim.stage(ctx); for (var q = 0; q < 10; q++) { var bx = new T.Mesh(new T.BoxGeometry(1.2, 1, 1.2), new T.MeshStandardMaterial({ color: 0x9775fa, roughness: 0.4 })); bx.visible = false; ctx.scene.add(bx); bars.push(bx); } for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.t = 'fe'; S.d = 0; S.p = 0.1 + 0.2 * f.local; } else if (i === 1) { S.t = ['t2m', 'fe', 'pe', 'fa', 'fp'][Math.min(4, Math.floor(f.local * 5))]; S.d = 0; S.p = (f.local * 5) % 1; } else if (i === 2) { S.t = 'fp'; S.d = Math.min(2, Math.floor(f.local * 3)); S.p = 1; } else if (i === 3) { S.t = 'fp'; S.d = 0; S.p = 0.5; } else { S.N = 2 + Math.round(f.local * 6); } }
      SG.begin(); lab.forEach(function (l) { l.vis(false); });
      var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)], p = S.p, tg = MSim.build(t.s);
      if (i === 3 && !P.manual) { var chain = [['O{o}C{a}(C)(C)Ph', "2-phenyl-2-propanol"], ['CC{a}(=O{o})Ph', "acetophenone"], ['O{o}C{a}(C)Ph', "1-phenylethanol"]], k = Math.min(2, Math.floor(f.local * 3)); SG.put('ch' + k, MSim.build(chain[k][0]), 0, 0, 0, []); lab[0].pos(0, 4.8, 0).set(chain[k][1], 'bl-lead').vis(true); lab[1].pos(0, -4.8, 0).set(["⇐ Grignard (CH₃MgBr + acetophenone)", "⇐ oxidation of 1-phenylethanol (FGI)", "⇐ reduction of acetophenone (NaBH₄)"][k], 'bl-d').vis(true); return; }
      bars.forEach(function (b) { b.visible = false; }); if (i === 4 && !P.manual) { var y = S.y / 100; for (var k = 0; k < S.N; k++) { var h = 8 * Math.pow(y, k + 1); bars[k].visible = true; bars[k].scale.y = h; bars[k].position.set(-9 + k * 2, -4 + h / 2, 0); } lab[0].pos(0, 5.5, 0).set("Linear route of " + S.N + " steps · overall yield " + fmt(Math.pow(y, S.N) * 100, 1) + ' %', 'bl-lead').vis(true); lab[1].pos(0, -5.4, 0).set("height = cumulative yield after each step", 'bl-d').vis(true); return; }
      if (p < 0.5) { var g1 = SG.put('t' + S.t, tg, 0, 0, 0, [{ tag: 'a', nth: 0, color: 0xff6b6b, r: 0.8, op: 0.3 }]); g1.position.x = -2 * sm(p / 0.5); lab[0].pos(g1.position.x, 4.8, 0).set(t.n + ' (' + t.cls + ')', 'bl-lead').vis(true); lab[1].pos(g1.position.x, -4.6, 0).set('⇒ ' + d.d, 'bl-d').vis(true); }
      else {
        var q = sm((p - 0.5) / 0.5), nu = MSim.build(d.nuc), el = MSim.build(d.el);
        SG.put('nu' + S.t + S.d, nu, -5 - 2 * q, 0, 0, [{ tag: 'x', nth: 0, color: 0x4dabf7, r: 0.8, op: 0.35 }]); SG.put('el' + S.t + S.d, el, 5 + 2 * q, 0, 0, [{ tag: 'c', nth: 0, color: 0xff6b6b, r: 0.8, op: 0.35 }]);
        lab[0].pos(-7, 4.2, 0).set(d.nn, 'bl-pos').vis(true); lab[1].pos(7, 4.2, 0).set(d.en, 'bl-neg').vis(true); lab[2].pos(0, -4.6, 0).set('sintones: ' + d.sy, 'bl-d').vis(q > 0.3); lab[3].pos(0, 5.6, 0).set('⇒ ' + t.n, 'bl-lead').vis(true);
      }
      SG.halos(ctx.layer('halo'));
    },
    sync: function (ctx) { var u = ctx.ui; if (u.t) u.t.set(S.t); if (u.d) u.d.set(S.d); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)]; return { eq: { chip: '⇒', name: t.n, body: "<div class=\"eqline\"><small>Disconnection</small>" + d.d + "</div><div class=\"eqline\"><small>Nucleophile</small>" + d.nn + "</div><div class=\"eqline\"><small>Electrophile</small>" + d.en + "</div><div class=\"eqline\"><small>Synthons</small>" + d.sy + '</div>' }, legend: [{ label: "Blue halo", color: '#4dabf7', text: "nucleophilic synthon" }, { label: "Red halo", color: '#ff6b6b', text: "electrophilic synthon" }] }; },
    measures: function () { var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)]; return [["Target", t.n], ["Class", t.cls], ["Disconnection", d.d], ["Reactants", d.nn + ' + ' + d.en], ["Note", d.note], ["Steps / overall yield", S.N + " steps · " + fmt(Math.pow(S.y / 100, S.N) * 100, 1) + ' %']]; },
    ideas: ["Disconnect next to the carbon bearing the OH.", "Synthon ≠ reagent: look for the synthetic equivalent.", "Prefer short, convergent routes.", "FGI: alcohol ⇄ carbonyl ⇄ acid."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Target"); el.appendChild(c);
      ui.t = kit.ui.options({ label: "Target molecule", cols: 1, value: S.t, options: Object.keys(TG).map(function (k) { return { v: k, label: TG[k].n, sub: TG[k].cls }; }), onChange: function (v) { ctx.goManual(); S.t = v; S.d = 0; } }); c.appendChild(ui.t);
      ui.d = kit.ui.options({ label: "Disconnection", cols: 1, value: S.d, options: [0, 1, 2].map(function (k) { return { v: k, label: "Route " + (k + 1) }; }), onChange: function (v) { ctx.goManual(); S.d = Math.min(v, TG[S.t].R.length - 1); } }); c.appendChild(ui.d);
      ui.p = kit.ui.slider({ label: "Disconnection progress", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } });
      var sn = kit.ui.slider({ label: "No. of steps", min: 2, max: 10, step: 1, value: S.N, format: function (v) { return String(v); }, onInput: function (v) { S.N = v; } });
      var sy = kit.ui.slider({ label: "Yield per step", min: 50, max: 99, step: 1, value: S.y, format: function (v) { return v + ' %'; }, onInput: function (v) { S.y = v; } });
      c.appendChild(kit.ui.sliders([ui.p, sn, sy])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Overall yield versus no. of steps", h: 240, note: "Lines: different yields per step. Dot: your choice.", draw: function (cx, w, h, col) {
      var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 1; i <= 10; i += 1) cx.fillText(i, L + pw * (i - 1) / 9, h - B + 14); cx.fillText("no. of steps", L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(i * 25 + ' %', L - 4, Tp + ph * (1 - i / 4) + 3);
      [[70, '#fa5252'], [80, '#fab005'], [90, '#69db7c'], [95, '#4dabf7']].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = 2; cx.beginPath(); for (var n = 1; n <= 10; n++) { var y = Math.pow(a[0] / 100, n); (n > 1 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (n - 1) / 9, Tp + ph * (1 - y)); } cx.stroke(); cx.fillStyle = a[1]; cx.textAlign = 'left'; cx.fillText(a[0] + ' %', L + pw + 2 - 30, Tp + ph * (1 - Math.pow(a[0] / 100, 10)) - 3); });
      cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.N - 1) / 9, Tp + ph * (1 - Math.pow(S.y / 100, S.N)), 5, 0, 6.28); cx.fill();
    } }],
    calc: function () { var y = S.y / 100, lin = Math.pow(y, S.N), half = Math.ceil(S.N / 2), conv = Math.pow(y, half + 1), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">Overall yield</div><table class=\"calc-table\">" + row("Linear route (" + S.N + " steps)", fmt(y, 2) + '<sup>' + S.N + '</sup> = <b>' + fmt(lin * 100, 1) + ' %</b>') + row("Convergent (2 branches of " + half + " + joining)", fmt(y, 2) + '<sup>' + (half + 1) + '</sup> = <b>' + fmt(conv * 100, 1) + ' %</b>') + row("Improvement", fmt(conv / lin, 2) + " times") + row("Mass from 10 g (linear)", fmt(10 * lin, 2) + " g (relative)") + '</table>'; },
    quiz: [
      { q: "The arrow ⇒ in a retrosynthetic analysis means…", options: ["“can be prepared from”", "reacts with", "equilibrium", "resonance"], answer: 0, why: "It indicates the disconnection backward." },
      { q: "The synthetic equivalent of the R⁻ synthon is…", options: ["R–MgBr", 'R–Br', 'R–OH', 'R⁺'], answer: 0, why: "Grignard reagent." },
      { q: "A 3° alcohol is disconnected with…", options: ["Grignard + ketone", "Grignard + CO₂", "oxidation", "hydrolysis"], answer: 0, why: "Ketone + R–MgX." },
      { q: "5 steps at 80 % give an overall yield of…", options: ['33 %', '80 %', '40 %', '20 %'], answer: 0, why: '0,8⁵ ≈ 0,33.' },
      { q: "A convergent synthesis allows…", options: ["higher overall yield", "more linear steps", "fewer reagents", "avoiding analysis"], answer: 0, why: "Fewer steps in the longest route." }
    ],
    help: { intro: "Choose a target and a route; move “Progress” to see how the molecule separates into nucleophile and electrophile. Adjust steps and yields for the overall calculation.", items: [['Synthons', 'blue halo = nucleophilic synthon; red halo = electrophilic synthon.'], ['Controls', '“Target molecule”, “Disconnection” and “Disconnection progress”; “No. of steps” and “Yield per step” compute the overall yield.'], ['Chart', '“Overall yield versus no. of steps”.']], try: ['Disconnect a tertiary alcohol next to the carbon bearing the OH: Grignard + ketone.', 'With 5 steps at 80 % each, the overall yield is ≈ 33 %.', 'Compare a short route with a long one: the short one usually gives the higher overall yield.'] }
  };
  MSim.create(def);
})();
