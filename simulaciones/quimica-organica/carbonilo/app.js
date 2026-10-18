/* Adición nucleófila al carbonilo — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
/* Núcleo común de los simuladores 3D · Laboratorio MACEDONIA (UMCE) — construido sobre ../../kit/simkit.js */
(function () {
  'use strict';
  var T = THREE, fmt = SimKit.fmt, clamp = SimKit.clamp;
  var EL = { H: [0xf2f2f2, 0.31], C: [0x56606b, 0.76], N: [0x4f7cff, 0.71], O: [0xff4d4d, 0.66], S: [0xe6c229, 1.0], P: [0xff9a3d, 1.07], F: [0x7ee08a, 0.57], Cl: [0x3ddc5a, 1.02], Br: [0xa0522d, 1.2], I: [0x9a4fd0, 1.33], Na: [0xab5cf2, 1.5], K: [0x8f40d4, 1.9], Cu: [0xc88033, 1.3], Zn: [0x7d80b0, 1.2], Ag: [0xc0c0c0, 1.4], Fe: [0xe06633, 1.3], Co: [0xf090a0, 1.25], Ni: [0x50d050, 1.25], Cr: [0x8a99c7, 1.3], Mn: [0x9c7ac7, 1.3], Ti: [0xbfc2c7, 1.4], Ca: [0x3dff00, 1.8], Mg: [0x8aff00, 1.5], Pt: [0xd0d0e0, 1.35], Li: [0xcc80ff, 1.3] };
  var matCache = {}, sphereGeo, cylGeo;
  function mat(el) { if (!matCache[el]) { var d = EL[el] || [0xcccccc, 1]; matCache[el] = new T.MeshStandardMaterial({ color: d[0], roughness: 0.4, metalness: 0.1 }); } return matCache[el]; }
  var bondMat = null;
  /* geo = { a: [[el,x,y,z],...], b: [[i,j],...] }, opts = { gs: escala de coordenadas, ar: escala de radios } */
  function mol(geo, o) {
    o = o || {}; var gs = o.gs || 0.5, ar = o.ar || 0.42, g = new T.Group();
    sphereGeo = sphereGeo || new T.SphereGeometry(1, 16, 12); cylGeo = cylGeo || new T.CylinderGeometry(1, 1, 1, 8, 1, true);
    bondMat = bondMat || new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 });
    geo.a.forEach(function (a) { var m = new T.Mesh(sphereGeo, o.mat ? o.mat : mat(a[0])); m.scale.setScalar((EL[a[0]] ? EL[a[0]][1] : 1) * ar * (o.rs || 1)); m.position.set(a[1] * gs, a[2] * gs, a[3] * gs); g.add(m); });
    (geo.b || []).forEach(function (b) {
      var p = new T.Vector3(geo.a[b[0]][1], geo.a[b[0]][2], geo.a[b[0]][3]).multiplyScalar(gs), q = new T.Vector3(geo.a[b[1]][1], geo.a[b[1]][2], geo.a[b[1]][3]).multiplyScalar(gs);
      var d = q.clone().sub(p), len = d.length(), order = b[2] || 1;
      for (var k = 0; k < order; k++) {
        var c = new T.Mesh(cylGeo, bondMat), off = new T.Vector3(0, 0, (k - (order - 1) / 2) * 0.16 * (o.bw || 1));
        c.scale.set(0.055 * (o.bw || 1), len, 0.055 * (o.bw || 1)); c.position.copy(p).add(q).multiplyScalar(0.5).add(off); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); g.add(c);
      }
    });
    return g;
  }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function sci(x, d) { if (x === 0) return '0'; var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (e > -3 && e < 4) return fmt(x, d == null ? (Math.abs(x) < 1 ? 4 : 2) : d); var m = x / Math.pow(10, e); return fmt(m, 2) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }

  function create(def) {
    var ctx = { T: T, THREE: T, fmt: fmt, clamp: clamp, ease: ease, kv: kv, sci: sci, mol: mol, mat: mat, EL: EL, P: { manual: false, camGoal: null }, ui: {}, def: def, now: 0, dt: 0 };
    var nSt = def.nStages || 6, STAGES = []; for (var q = 0; q < nSt; q++) STAGES.push({ name: '', short: '', title: '', text: '', dur: def.dur || 10 });
    var kit, labels = [], lastSync = -1, lastHud = '', lastCalc = '', calcCard = null, graphUi = [];
    ctx.STAGES = STAGES;
    function applyStageDom() {
      var s = STAGES[kit.state.stage]; document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
      var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
      if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
    }
    ctx.refreshStages = function () {
      def.stages(ctx).forEach(function (a, i) { var t = STAGES[i]; if (!t) return; t.name = a[0]; t.short = a[1]; t.title = a[2]; t.text = a[3]; if (a[4]) t.dur = a[4]; });
      if (kit) applyStageDom();
    };
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast('La lección controla la simulación'); if (def.onStage) def.onStage(kit.state.stage, ctx); };
    ctx.layer = function (id) { return kit.layer(id); };
    ctx.view = function (id) { var v = (def.views || []).filter(function (x) { return x.id === id; })[0]; if (v) ctx.P.camGoal = { pos: new T.Vector3(v.pos[0], v.pos[1], v.pos[2]), target: new T.Vector3(v.target[0], v.target[1], v.target[2]) }; };
    ctx.btnRow = function (list) {
      var r = document.createElement('div'); r.className = 'row';
      list.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn' + (b.primary ? ' primary' : ''); e.textContent = b.t; e.addEventListener('click', b.fn); if (b.id) ui(b.id, e); r.appendChild(e); });
      return r;
    };
    function ui(id, e) { ctx.ui[id] = e; }
    ctx.label = function (txt, cls) {
      var d = document.createElement('div'); d.className = 'bond-label ' + (cls || 'bl-d'); d.textContent = txt; var o = new T.CSS2DObject(d); ctx.scene.add(o);
      var L = { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; return L; }, pos: function (x, y, z) { o.position.set(x, y, z); return L; }, vis: function (b) { o.visible = !!b && (L.force !== false) && ctx.layer('labels') !== false; return L; } };
      labels.push(L); return L;
    };
    ctx.redraw = function () { graphUi.forEach(function (g) { g.redraw(); }); };
    function resize() {
      if (!ctx.renderer) return; var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight; if (w < 2 || h < 2) return;
      var cam = ctx.camera; cam.aspect = w / h; cam.zoom = clamp(cam.aspect / 1.6, 0.4, 1.15) * (w > 900 ? (def.zoom || 1) : 0.9);
      var off = w > 900 ? Math.min(280, w * (def.offset == null ? 0.25 : def.offset)) : 0; if (off) cam.setViewOffset(w, h, -off, 0, w, h); else cam.clearViewOffset();
      cam.updateProjectionMatrix(); ctx.renderer.setSize(w, h); ctx.labelRenderer.setSize(w, h);
    }
    function syncHud() {
      if (!def.hud) return; var h = def.hud(ctx), key = JSON.stringify(h); if (key === lastHud) return; lastHud = key; if (h.eq) kit.setEq(h.eq); if (h.legend) kit.setLegend(h.legend);
    }
    var tabs = [];
    if (def.lab) tabs.push({ id: 'lab', label: 'Lab', build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
    if (def.graphs) tabs.push({ id: 'graf', label: 'Gráficos', build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || 'Cálculo', build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: 'Desafío', build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card('Desafío'); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ('Preguntas de repaso (' + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || 'Simulador 3D', accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ('Visor 3D · ' + def.title),
      stages: STAGES, mainTabLabel: 'Guía', tabs: tabs, measuresTitle: 'Medidas en vivo', measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: 'Etiquetas', icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: 'Libre', pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
      onView: function (id) { ctx.view(id); },
      onTheme: function (th) { if (ctx.scene) { ctx.scene.background = new T.Color(th === 'dark' ? bg[0] : bg[1]); } ctx.theme = th; if (def.onTheme) def.onTheme(th, ctx); },
      onStage: function (i) { ctx.refreshStages(); if (ctx.P.manual) return; if (def.stageViews && def.stageViews[i]) ctx.view(def.stageViews[i]); if (def.onStage) def.onStage(i, ctx); },
      onGuide: function () { if (ctx.P.manual) ctx.toLesson(); },
      onResize: resize,
      render: function () { ctx.renderer.render(ctx.scene, ctx.camera); ctx.labelRenderer.render(ctx.scene, ctx.camera); },
      onFrame: function (f) {
        var dt = Math.min(f.dt, 0.05); ctx.now = f.now; ctx.dt = dt; ctx.f = f;
        def.frame && def.frame(ctx, f, dt);
        if (ctx.P.camGoal) { ctx.camera.position.lerp(ctx.P.camGoal.pos, 0.08); ctx.controls.target.lerp(ctx.P.camGoal.target, 0.08); if (ctx.camera.position.distanceTo(ctx.P.camGoal.pos) < 0.05) ctx.P.camGoal = null; }
        if (f.now - lastSync > 0.15) { lastSync = f.now; syncHud(); if (calcCard && def.calc) { var h = def.calc(ctx); if (h !== lastCalc) { lastCalc = h; calcCard.innerHTML = h; } } ctx.redraw(); def.sync && def.sync(ctx); }
        ctx.controls.update(); ctx.renderer.render(ctx.scene, ctx.camera); ctx.labelRenderer.render(ctx.scene, ctx.camera);
      },
      init: function (k) {
        kit = k; ctx.kit = k; ctx.kit = k; ctx.kit = k; var cont = k.viewport, v0 = (def.views || [{ pos: [0, 6, 22], target: [0, 3, 0] }])[0];
        var scene = ctx.scene = new T.Scene(), cam = ctx.camera = new T.PerspectiveCamera(45, 1, 0.1, 400); cam.position.set(v0.pos[0], v0.pos[1], v0.pos[2]);
        var r = ctx.renderer = new T.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); cont.appendChild(r.domElement);
        var lr = ctx.labelRenderer = new T.CSS2DRenderer(); lr.domElement.className = 'labels-layer'; cont.appendChild(lr.domElement);
        var c = ctx.controls = new T.OrbitControls(cam, r.domElement); c.enableDamping = true; c.dampingFactor = 0.06; c.minDistance = def.minDist || 5; c.maxDistance = def.maxDist || 80; c.target.set(v0.target[0], v0.target[1], v0.target[2]);
        c.addEventListener('start', function () { ctx.P.camGoal = null; });
        scene.add(new T.AmbientLight(0xffffff, 0.85)); var dl = new T.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 16, 12); scene.add(dl); var dl2 = new T.DirectionalLight(0x88aaff, 0.4); dl2.position.set(-8, 4, -8); scene.add(dl2);
        k.cfg.onTheme(k.state.theme); def.build(ctx); resize(); ctx.refreshStages(); syncHud(); def.afterInit && def.afterInit(ctx);
      },
      help: def.help || { intro: 'Sigue la lección con el reproductor o explora libremente en la pestaña «Lab». Con «Volver a la lección» el guion retoma el control.', items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();

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
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length; var cat = false, an = false; if (el === 'C' && s[i] === '+') { cat = true; i++; } else if (s[i] === '^') { an = true; i++; }
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, cat: cat, an: an, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (nd.cat) nd.tag = 'cat'; if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.cat) return 'sp2'; if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - (n.cat ? 1 : 0) - (n.an ? 1 : 0) - sum); }
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
  var fmt = SimKit.fmt, R = 8.314, GS = 1.3;
  var CB = {
    form: { n: 'formaldehído', r: ['', ''], K: 2300, E: [0, 0], nm: 'metanal' },
    etanal: { n: 'etanal', r: ['C', ''], K: 1.0, nm: 'etanal' },
    prop: { n: 'propanona', r: ['C', 'C'], K: 0.0014, nm: 'propanona' },
    acf: { n: 'acetofenona', r: ['C', 'Ph'], K: 1e-5, nm: 'acetofenona' }
  };
  var NU = {
    H2O: { n: 'H₂O', frag: 'O{nu}', t: 'H₂O', col: 0xff4d4d, r: 0.7, tn: 'hidrato (gem-diol)', pn: { form: 'metanodiol', etanal: 'etano-1,1-diol', prop: 'propano-2,2-diol', acf: '1-feniletano-1,1-diol' }, how: 'hidratación (catálisis ácida o básica)' },
    MeOH: { n: 'CH₃OH', frag: 'O{nu}C', t: 'CH₃OH', col: 0xff8787, r: 0.75, tn: 'hemiacetal', pn: { form: 'metoximetanol', etanal: '1-metoxietanol', prop: '2-metoxipropan-2-ol', acf: '1-metoxi-1-feniletanol' }, how: 'formación de hemiacetal' },
    CN: { n: 'CN⁻ (HCN)', frag: 'C{nu}#N', t: 'CN⁻', col: 0x4f7cff, r: 0.7, tn: 'cianohidrina', pn: { form: 'hidroxiacetonitrilo', etanal: '2-hidroxipropanonitrilo', prop: '2-hidroxi-2-metilpropanonitrilo', acf: '2-hidroxi-2-fenilpropanonitrilo' }, how: 'adición de cianuro (KCN/HCN)' },
    H: { n: 'H⁻ (NaBH₄)', frag: '', t: 'H⁻', col: 0xeeeeee, r: 0.42, tn: 'alcohol', pn: { form: 'metanol', etanal: 'etanol', prop: 'propan-2-ol', acf: '1-feniletanol' }, how: 'reducción con hidruro (NaBH₄, LiAlH₄)' },
    Me: { n: 'CH₃⁻ (CH₃MgBr)', frag: 'C{nu}', t: 'CH₃⁻', col: 0x56606b, r: 0.8, tn: 'alcohol', pn: { form: 'etanol', etanal: 'propan-2-ol', prop: '2-metilpropan-2-ol', acf: '2-fenilpropan-2-ol' }, how: 'reactivo de Grignard (1.º RMgX; 2.º H₃O⁺)' }
  };
  var LG = {
    Cl: { n: 'cloruro de acilo', s: 'Cl{lg}', t: 'Cl⁻', col: 0x3ddc5a, r: 0.95, pka: -7, ex: 'cloruro de etanoílo' },
    An: { n: 'anhídrido', s: 'O{lg}C(=O)C', t: 'CH₃COO⁻', col: 0xff8787, r: 0.8, pka: 4.8, ex: 'anhídrido etanoico' },
    Es: { n: 'éster', s: 'O{lg}C', t: 'CH₃O⁻', col: 0xff6b6b, r: 0.7, pka: 15.5, ex: 'etanoato de metilo' },
    Am: { n: 'amida', s: 'N{lg}', t: 'NH₂⁻', col: 0x4f7cff, r: 0.7, pka: 38, ex: 'etanamida' }
  };
  var S = { cb: 'etanal', nu: 'H2O', lg: 'Cl', mode: 'add', prog: 0, anim: false };
  var cache = {}, G = {}, labs = {}, arrows = [];
  function wrap(x) { return x ? '(' + x + ')' : ''; }
  function smi(kind, cb, nu, lg) {
    var r = CB[cb].r, R = wrap(r[0]) + wrap(r[1]);
    if (kind === 'r') return 'C{c}(=O{o})' + R;
    if (kind === 't') return 'C{c}(O^{o})' + wrap(NU[nu].frag) + R;
    if (kind === 'p') return 'C{c}(O{o})' + wrap(NU[nu].frag) + R;
    if (kind === 'hem') return 'C{c}(O{o})(O{nu}C)' + R;
    if (kind === 'ace') return 'C{c}(O{o}C)(O{nu}C)' + R;
    if (kind === 'ar') return 'C{c}(=O{o})(C)' + LG[lg].s;
    if (kind === 'at') return 'C{c}(O^{o})(C)(O{nu})' + LG[lg].s;
    if (kind === 'ap') return 'C{c}(=O{o})(C)O{nu}';
    return 'C';
  }
  function nb(g, i) { var o = []; g.b.forEach(function (b) { if (b[0] === i) o.push(b[1]); else if (b[1] === i) o.push(b[0]); }); return o; }
  function align(g, o, a, b, up) {
    var P = g.a.map(function (q) { return new THREE.Vector3(q[1], q[2], q[3]); }), po = P[o], e1 = po.clone().sub(P[a]).normalize(), y;
    if (up != null) { var u = P[up].clone().sub(po); y = u.sub(e1.clone().multiplyScalar(u.dot(e1))).normalize(); } else { y = new THREE.Vector3().crossVectors(P[a].clone().sub(po), P[b].clone().sub(po)).normalize(); if (y.y < 0) y.negate(); }
    var z = new THREE.Vector3().crossVectors(e1, y); g.a.forEach(function (q, i) { var d = P[i].clone().sub(po); q[1] = d.dot(e1); q[2] = d.dot(y); q[3] = d.dot(z); }); return g;
  }
  function geo(kind) {
    var key = kind + S.cb + S.nu + S.lg; if (cache[key]) return cache[key];
    var g = MSim.build(smi(kind, S.cb, S.nu, S.lg)), c = g.tag.indexOf('c'), o = g.tag.indexOf('o'), nu = g.tag.indexOf('nu');
    if (kind === 'r' || kind === 'ar') { var oth = nb(g, c).filter(function (m) { return m !== o; })[0]; align(g, c, o, oth, null); }
    else { var up = nu; if (up < 0) up = nb(g, c).filter(function (m) { return g.a[m][0] === 'H'; })[0]; if (up == null) up = nb(g, c).filter(function (m) { return m !== o; })[0]; align(g, c, o, null, up); }
    g.O = o; g.C = c; g.nu = nu; cache[key] = g; return g;
  }
  function grp(ctx, kind) { var key = kind + S.cb + S.nu + S.lg; if (!G.g[key]) { var g = ctx.mol(geo(kind), { gs: GS, ar: 0.46 }); g.visible = false; ctx.scene.add(g); G.g[key] = g; } return G.g[key]; }
  function hideAll() { Object.keys(G.g).forEach(function (k) { G.g[k].visible = false; G.g[k].position.set(0, 0, 0); }); }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function setArrow(T, ar, p0, p1, bl, on) { if (ar.mesh) { ar.mesh.geometry.dispose(); ar.group.remove(ar.mesh); ar.mesh = null; } ar.group.visible = on; if (!on) return; var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bl), cur = new T.QuadraticBezierCurve3(p0, mid, p1); ar.mesh = new T.Mesh(new T.TubeGeometry(cur, 14, 0.05, 6, false), ar.mat); ar.group.add(ar.mesh); var tan = p1.clone().sub(cur.getPoint(0.92)).normalize(); ar.head.position.copy(p1); ar.head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan); }
  function bondTo(T, m, p, q) { var d = q.clone().sub(p), L = d.length(); m.scale.set(1, Math.max(1e-3, L), 1); m.position.copy(p).add(q).multiplyScalar(0.5); if (L > 1e-6) m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
  function V(x, y, z) { return new THREE.Vector3(x * GS, y * GS, z * GS); }
  var BD = new THREE.Vector3(0.292, 0.956, 0);
  function stages() {
    return [
      ['El grupo carbonilo', 'Carbonilo', 'C=O es plano, polar y el carbono es electrófilo', '<p>El <b>carbonilo C=O</b> es plano (sp², 120°) y muy polar: el oxígeno, más electronegativo, atrae el par π (forma resonante C⁺–O⁻). El carbono tiene carga parcial <b>δ+</b> y es el sitio de ataque de <b>nucleófilos</b>; el oxígeno (δ−) es básico. El orbital π* (LUMO, lóbulos azules) tiene su mayor coeficiente sobre el <b>carbono</b>.</p>'],
      ['Trayectoria de Bürgi–Dunitz', 'Trayectoria', 'El nucleófilo ataca al C desde arriba, a ≈ 107° del enlace C=O', '<p>El nucleófilo se aproxima al plano del carbonilo con un ángulo de unos <b>107°</b> respecto del enlace C=O (<b>ángulo de Bürgi–Dunitz</b>): compromiso entre máximo solapamiento con el π* y mínima repulsión con los electrones del O. Los grupos R voluminosos bloquean esta trayectoria (impedimento estérico).</p>'],
      ['Adición nucleófila', 'Adición', 'El par del nucleófilo forma el enlace; el π pasa al oxígeno', '<p>Dos flechas curvas: el par de Nu⁻ forma el enlace Nu–C y el par π del C=O pasa al oxígeno, que queda como <b>alcóxido</b> (O⁻). El carbono cambia de <b>sp² plano a sp³ tetraédrico</b>: es el <b>intermedio tetraédrico</b>. El paso es reversible salvo con nucleófilos fuertes (H⁻, R⁻).</p>'],
      ['Protonación: el producto', 'Protonación', 'El alcóxido capta H⁺ y da el alcohol (o derivado)', '<p>El alcóxido se protona (H₃O⁺ en el tratamiento ácido): se forma el <b>alcohol</b>. Según el nucleófilo el producto es un <b>gem-diol</b> (H₂O), un <b>hemiacetal</b> (ROH), una <b>cianohidrina</b> (CN⁻), o un <b>alcohol</b> por reducción (H⁻) o con Grignard (R⁻, nuevo enlace C–C).</p>'],
      ['Aldehído vs cetona', 'Reactividad', 'Los aldehídos son más reactivos que las cetonas', '<p>Dos razones: <b>electrónica</b> (una cetona tiene dos grupos alquilo donadores que reducen el δ+ del C) y <b>estérica</b> (dos R dificultan el acceso; en el producto sp³ hay más aglomeración). Constante de hidratación: formaldehído ≈ 2300, etanal ≈ 1, propanona ≈ 0,0014.</p>'],
      ['Hemiacetales y acetales', 'Acetales', 'Con exceso de alcohol y H⁺ el hemiacetal pasa a acetal', '<p>El <b>hemiacetal</b> (inestable) se convierte en <b>acetal</b> con otro ROH y catálisis ácida (se pierde H₂O). Los acetales son <b>estables en medio básico</b>: se usan como <b>grupos protectores</b> de aldehídos y cetonas. En los azúcares, el hemiacetal cíclico es la forma piranosa/furanosa.</p>'],
      ['Derivados de ácido: sustitución acílica', 'Acilo', 'Adición–eliminación: el intermedio expulsa un grupo saliente', '<p>En <b>ácidos y derivados</b> (R–CO–L) el intermedio tetraédrico puede <b>expulsar L⁻</b> y regenerar el C=O: <b>sustitución nucleófila acílica</b> (adición–eliminación). Reactividad según la capacidad de L como grupo saliente (pKa de HL): <b>cloruro de acilo ≫ anhídrido &gt; éster ≈ ácido &gt; amida</b>.</p>']
    ];
  }
  function state(si, p, now) {
    var r = { main: null, nu: null, lg: null, arr: [null, null], lobes: false, dip: false, hp: null, txt: '', path: false, angle: false, cmp: false, tri: false };
    var cbd = CB[S.cb], nuI = NU[S.nu];
    if (si === 0) { r.main = 'r'; r.lobes = true; r.dip = true; r.txt = cbd.n; }
    else if (si === 1) { r.main = 'r'; r.lobes = true; var d = 4.4 - 1.9 * sm(p); r.nu = BD.clone().multiplyScalar(d * GS); r.path = true; r.angle = true; r.txt = 'Nu⁻ se aproxima a 107°'; }
    else if (si === 2) { var e = sm(p / 0.85); if (p < 0.85) { r.main = 'r'; var dd = 2.5 - 0.9 * e; r.nu = BD.clone().multiplyScalar(dd * GS); r.lobes = true; r.arr[0] = { a: r.nu.clone(), b: V(0, 0.5, 0), bl: new THREE.Vector3(0.5, 0.8, 0) }; r.arr[1] = { a: V(-0.3, 0.3, 0), b: V(-1.5, 0.7, 0), bl: new THREE.Vector3(0, 0.9, 0) }; r.txt = 'ataque nucleófilo'; } else { r.main = 't'; r.txt = 'intermedio tetraédrico (alcóxido)'; } }
    else if (si === 3) { if (p < 0.55) { r.main = 't'; r.hp = V(-4, 3, 0).lerp(V(-1.9, 0.9, 0), sm(p / 0.5)); r.arr[0] = { a: V(-1.5, 0.3, 0), b: r.hp.clone(), bl: new THREE.Vector3(-0.3, 0.8, 0) }; r.txt = 'protonación del O⁻'; } else { r.main = 'p'; r.txt = nuI.tn + ': ' + nuI.pn[S.cb]; } }
    else if (si === 4) { r.cmp = true; r.txt = 'aldehído frente a cetona'; r.lobes = true; }
    else if (si === 5) { r.tri = true; r.txt = 'carbonilo → hemiacetal → acetal'; }
    else { var lg = LG[S.lg]; if (p < 0.3) { r.main = 'ar'; r.nu = V(0.3, 1, 0).normalize().multiplyScalar((4.4 - 1.9 * sm(p / 0.3)) * GS); r.txt = 'H₂O ataca al ' + lg.n; } else if (p < 0.62) { r.main = 'at'; r.txt = 'intermedio tetraédrico'; } else { r.main = 'ap'; var e2 = sm((p - 0.62) / 0.38); r.lg = V(1.6, -0.6, 0).add(V(3.4, -1.0, 0).multiplyScalar(e2)); r.txt = 'se expulsa ' + lg.t + ' → ácido carboxílico'; r.arr[0] = e2 < 0.5 ? { a: V(-1.3, 0.3, 0), b: V(-0.5, 0.0, 0), bl: new THREE.Vector3(0, 0.6, 0) } : null; } }
    return r;
  }
  var def = {
    key: 'carbonilo', title: 'Adición nucleófila al carbonilo', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#fb7185', light: '#be123c' }, stages: stages, nStages: 7, dur: 10, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 5, 12], target: [0, 0.5, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1.5, 14], target: [0, 0.5, 0] }, { id: 'sup', label: 'Superior', pos: [0, 15, 3], target: [0, 0, 0] }, { id: 'lado', label: 'Lateral', pos: [14, 2, 0], target: [0, 0.5, 0] }],
    layers: [{ id: 'orb', label: 'Orbitales π*', icon: '☁' }, { id: 'arrows', label: 'Flechas curvas', icon: '↷' }, { id: 'chg', label: 'Cargas parciales', icon: 'δ' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; G.g = {}; G.nu = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: 0xff4d4d, roughness: 0.35 })); G.hp = new T.Mesh(new T.SphereGeometry(0.36, 16, 12), new T.MeshStandardMaterial({ color: 0xffffff })); G.lgm = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: 0x3ddc5a, roughness: 0.35 }));
      G.pathM = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 6), new T.MeshBasicMaterial({ color: 0x555d6b, transparent: true, opacity: 0.6 })); G.dp = new T.Mesh(new T.ConeGeometry(0.2, 0.55, 12), new T.MeshBasicMaterial({ color: 0xffd43b })); G.dpl = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshBasicMaterial({ color: 0xffd43b }));
      [G.nu, G.hp, G.lgm, G.pathM, G.dp, G.dpl].forEach(function (m) { m.visible = false; s.add(m); });
      var lm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.34, depthWrite: false }); G.lobes = []; for (var i = 0; i < 8; i++) { var l = new T.Mesh(new T.SphereGeometry(1, 18, 12), lm); l.visible = false; s.add(l); G.lobes.push(l); }
      var dm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.34, depthWrite: false }), dr = new T.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.34, depthWrite: false }); G.dC = new T.Mesh(new T.SphereGeometry(0.9, 20, 14), dm); G.dO = new T.Mesh(new T.SphereGeometry(0.9, 20, 14), dr); G.dC.visible = G.dO.visible = false; s.add(G.dC); s.add(G.dO);
      G.arcs = new T.Mesh(new T.TorusGeometry(1, 0.025, 6, 30, 1.87), new T.MeshBasicMaterial({ color: 0xffd43b })); G.arcs.visible = false; s.add(G.arcs);
      for (i = 0; i < 2; i++) { var ar = { group: new T.Group(), mat: new T.MeshBasicMaterial({ color: 0xff7a3d }), mesh: null, head: new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), new T.MeshBasicMaterial({ color: 0xff7a3d })) }; ar.group.add(ar.head); s.add(ar.group); ar.group.visible = false; arrows.push(ar); }
      labs.t = ctx.label('', 'bl-lead'); labs.a = ctx.label('', 'bl-d'); labs.b = ctx.label('', 'bl-warn'); labs.c = ctx.label('', 'bl-d'); labs.d = ctx.label('', 'bl-d'); labs.e = ctx.label('', 'bl-d'); labs.f = ctx.label('', 'bl-lead');
    },
    frame: function (ctx, f, dt) {
      var T = ctx.T, now = (G.now = (G.now || 0) + dt), si, pp;
      if (!ctx.P.manual) { si = f.i; pp = f.local; if (S._st !== si) { S._st = si; S.mode = si === 6 ? 'acyl' : 'add'; if (si < 6) { S.cb = si === 4 ? S.cb : 'etanal'; S.nu = si === 3 ? 'H2O' : 'H2O'; } if (si === 3) { S.nu = 'CN'; } if (si < 3) S.nu = 'H2O'; } }
      else { if (S.mode === 'add') { var q = Math.min(0.9999, S.prog) * 3; si = 1 + Math.floor(q); pp = q - Math.floor(q); if (S.prog >= 1) { si = 3; pp = 1; } if (S.prog <= 0) { si = 0; pp = 0; } } else { si = 6; pp = S.prog; } if (S.cmpOn) si = 4; }
      G.si = si; hideAll(); var orb = ctx.layer('orb'), aro = ctx.layer('arrows'), chg = ctx.layer('chg');
      [G.nu, G.hp, G.lgm, G.pathM, G.dp, G.dpl, G.dC, G.dO, G.arcs].forEach(function (m) { m.visible = false; }); G.lobes.forEach(function (l) { l.visible = false; }); Object.keys(labs).forEach(function (k) { labs[k].vis(false); }); arrows.forEach(function (a) { a.group.visible = false; });
      var st = state(si, pp, now), nuI = NU[S.nu];
      function lobe(i, x, y, z, sx, sy, sz) { var l = G.lobes[i]; l.visible = orb; l.position.set(x, y, z); l.scale.set(sx, sy, sz); }
      if (st.cmp) {
        var save = S.cb; S.cb = 'etanal'; var ga = grp(ctx, 'r'); ga.visible = true; ga.position.x = -4; S.cb = 'prop'; var gb = grp(ctx, 'r'); gb.visible = true; gb.position.x = 4; S.cb = save;
        lobe(0, -4 + 0, 0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(1, -4, -0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(2, 4, 0.8 * GS, 0, 0.55 * GS, 0.5 * GS, 0.5 * GS); lobe(3, 4, -0.8 * GS, 0, 0.55 * GS, 0.5 * GS, 0.5 * GS);
        labs.t.pos(-4, 4.1, 0).set('etanal · δ+ mayor · K(hidr.) ≈ 1', 'bl-lead').vis(true); labs.a.pos(4, 4.1, 0).set('propanona · δ+ menor · K ≈ 0,0014', 'bl-warn').vis(true); labs.b.pos(-4, -3.4, 0).set('1 grupo R · menos impedimento', 'bl-d').vis(true); labs.c.pos(4, -3.4, 0).set('2 grupos R · más impedimento', 'bl-d').vis(true);
      } else if (st.tri) {
        var s1 = S.cb; var g1 = grp(ctx, 'r'); g1.visible = true; g1.position.x = -6; var g2 = grp(ctx, 'hem'); g2.visible = true; g2.position.x = 0; var g3 = grp(ctx, 'ace'); g3.visible = true; g3.position.x = 6;
        labs.t.pos(-6, 3.8, 0).set('carbonilo', 'bl-lead').vis(true); labs.a.pos(0, 3.8, 0).set('hemiacetal', 'bl-warn').vis(true); labs.b.pos(6, 3.8, 0).set('acetal (estable en base)', 'bl-lead').vis(true); labs.c.pos(-3, 0.3, 0).set('+ CH₃OH  →', 'bl-d').vis(true); labs.d.pos(3, 0.3, 0).set('+ CH₃OH, H⁺  (−H₂O) →', 'bl-d').vis(true);
      } else {
        var g = grp(ctx, st.main); g.visible = true; var kinds = { r: 'carbonilo', t: 'intermedio tetraédrico', p: nuI.tn, ar: LG[S.lg].ex, at: 'intermedio tetraédrico', ap: 'ácido etanoico' };
        labs.t.pos(0, 3.9, 0).set(S.mode === 'acyl' || si === 6 ? kinds[st.main] : kinds[st.main] + ' · ' + CB[S.cb].n, 'bl-lead').vis(true); labs.f.pos(0, -3.4, 0).set(st.txt, 'bl-d').vis(true);
        if (st.lobes && (st.main === 'r')) { lobe(0, 0, 0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(1, 0, -0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(2, -1.25 * GS, 0.6 * GS, 0, 0.4 * GS, 0.4 * GS, 0.4 * GS); lobe(3, -1.25 * GS, -0.6 * GS, 0, 0.4 * GS, 0.4 * GS, 0.4 * GS); }
        if (st.dip && chg) { G.dC.visible = G.dO.visible = true; G.dC.position.set(0, 0, 0); G.dO.position.set(-1.22 * GS, 0, 0); labs.a.pos(0.2, 1.7, 0).set('C δ+', 'bl-lead').vis(true); labs.b.pos(-1.7, 1.5, 0).set('O δ−', 'bl-warn').vis(true); G.dpl.visible = G.dp.visible = true; bondTo(T, G.dpl, V(0.9, 1.9, 0), V(-1.2, 1.9, 0)); G.dp.position.set(-1.3 * GS, 1.9 * GS, 0); G.dp.rotation.set(0, 0, Math.PI / 2); G.dpl.position.y = 1.9 * GS; labs.c.pos(-0.1, -1.7, 0).set('120° · plano sp²', 'bl-d').vis(true); }
        if (st.nu) { G.nu.visible = true; G.nu.position.copy(st.nu); var nr = S.mode === 'acyl' || si === 6 ? 0.7 : nuI.r; G.nu.scale.setScalar(nr); G.nu.material.color.setHex(si === 6 ? 0xff4d4d : nuI.col); labs.d.pos(st.nu.x, st.nu.y + 1.1, st.nu.z).set(si === 6 ? 'H₂O' : nuI.t, 'bl-warn').vis(true); }
        if (st.path) { G.pathM.visible = true; var A = new T.Vector3(0, 0, 0), B = BD.clone().multiplyScalar(4.6 * GS); bondTo(T, G.pathM, A, B); }
        if (st.angle) { G.arcs.visible = true; G.arcs.scale.setScalar(1.7 * GS); G.arcs.position.set(0, 0, 0); G.arcs.rotation.set(0, 0, 0); G.arcs.rotation.z = Math.atan2(BD.y, BD.x); G.arcs.rotation.z = Math.PI + 0; var ang0 = Math.PI; G.arcs.rotation.z = ang0 - 1.87; labs.e.pos(-0.7 * GS, 1.9 * GS, 0).set('107°', 'bl-lead').vis(true); }
        if (st.hp) { G.hp.visible = true; G.hp.position.copy(st.hp); labs.e.pos(st.hp.x, st.hp.y + 0.9, st.hp.z).set('H⁺', 'bl-warn').vis(true); }
        if (st.lg) { G.lgm.visible = true; G.lgm.position.copy(st.lg); G.lgm.scale.setScalar(LG[S.lg].r); G.lgm.material.color.setHex(LG[S.lg].col); labs.e.pos(st.lg.x, st.lg.y + 1.1, st.lg.z).set(LG[S.lg].t, 'bl-warn').vis(true); }
        st.arr.forEach(function (a, j) { if (a) setArrow(T, arrows[j], a.a, a.b, a.bl, aro); });
      }
    },
    sync: function () { }, 
    hud: function () { if (S.mode === 'acyl') { var l = LG[S.lg]; return { eq: { chip: 'Acilo', name: l.n + ' + H₂O', body: '<div class="eqline"><small>Grupo saliente</small>' + l.t + '</div><div class="eqline"><small>pKa de HL</small>' + l.pka + '</div><div class="eqline"><small>Producto</small>ácido carboxílico</div>' }, legend: [{ label: 'Nu', color: '#ff4d4d', text: 'nucleófilo' }, { label: 'L⁻', color: '#3ddc5a', text: 'grupo saliente' }] }; }
      var c = CB[S.cb], n = NU[S.nu]; return { eq: { chip: 'C=O', name: c.n + ' + ' + n.n, body: '<div class="eqline"><small>Mecanismo</small>' + n.how + '</div><div class="eqline"><small>Producto</small>' + n.pn[S.cb] + ' (' + n.tn + ')</div><div class="eqline"><small>K de hidratación</small>' + MSim.sci(c.K, 2) + '</div>' }, legend: [{ label: 'π*', color: '#4dabf7', text: 'LUMO del carbonilo' }, { label: 'δ+', color: '#4dabf7', text: 'C electrófilo' }, { label: 'δ−', color: '#ff4d4d', text: 'O nucleófilo/básico' }, { label: 'Flecha', color: '#ff7a3d', text: 'par de electrones' }] }; },
    measures: function () { if (S.mode === 'acyl') { var l = LG[S.lg]; return [['Derivado', l.n + ' (' + l.ex + ')'], ['Grupo saliente', l.t], ['pKa del ácido conjugado HL', String(l.pka)], ['Reactividad', ['muy alta', 'alta', 'moderada', 'baja'][['Cl', 'An', 'Es', 'Am'].indexOf(S.lg)]], ['Mecanismo', 'adición–eliminación']]; }
      var c = CB[S.cb], n = NU[S.nu]; return [['Carbonilo', c.n], ['Nucleófilo', n.n], ['Reacción', n.how], ['Producto', n.pn[S.cb]], ['K hidratación', MSim.sci(c.K, 2)], ['% hidratado (en agua)', fmt(100 * c.K / (1 + c.K), 2) + ' %'], ['Ángulo de ataque', '≈ 107° (Bürgi–Dunitz)']]; },
    ideas: ['C=O: <b>C δ+</b> electrófilo; O δ− básico; plano sp².', '<b>Bürgi–Dunitz</b>: ataque a ≈ 107° del C=O.', 'Adición: <b>sp² → sp³</b>; intermedio tetraédrico (alcóxido).', '<b>Aldehído &gt; cetona</b> (electrónico + estérico).', 'Derivados de ácido: adición–eliminación; reactividad ↔ grupo saliente.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Adición nucleófila a C=O'); el.appendChild(c);
      ui.cb = kit.ui.options({ label: 'Carbonilo', cols: 4, value: S.cb, options: Object.keys(CB).map(function (k) { return { v: k, label: CB[k].n }; }), onChange: function (v) { ctx.goManual(); S.cb = v; S.mode = 'add'; S.prog = 0; ui.prog.set(0); S.cmpOn = false; } }); c.appendChild(ui.cb);
      ui.nu = kit.ui.options({ label: 'Nucleófilo', cols: 5, value: S.nu, options: Object.keys(NU).map(function (k) { return { v: k, label: NU[k].t, sub: NU[k].tn.split(' ')[0] }; }), onChange: function (v) { ctx.goManual(); S.nu = v; S.mode = 'add'; S.prog = 0; ui.prog.set(0); S.cmpOn = false; } }); c.appendChild(ui.nu);
      ui.prog = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.prog = v / 100; S.cmpOn = false; } }); c.appendChild(kit.ui.sliders([ui.prog]));
      c.appendChild(ctx.btnRow([{ t: 'Animar', primary: true, fn: function () { ctx.goManual(); S.anim = true; S.prog = 0; S.cmpOn = false; } }, { t: 'Aldehído vs cetona', fn: function () { ctx.goManual(); S.cmpOn = !S.cmpOn; } }, { t: 'Volver a la lección', fn: function () { S.cmpOn = false; ctx.toLesson(); } }]));
      var c2 = kit.ui.card('Derivados de ácido (sustitución acílica)'); el.appendChild(c2);
      ui.lg = kit.ui.options({ label: 'Derivado + H₂O', cols: 4, value: S.lg, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n.split(' ')[0], sub: 'pKa(HL) ' + LG[k].pka }; }), onChange: function (v) { ctx.goManual(); S.lg = v; S.mode = 'acyl'; S.prog = 0; S.anim = true; S.cmpOn = false; } }); c2.appendChild(ui.lg);
      var _f = def.frame; def.frame = function (cx2, f, dt) { if (S.anim && cx2.P.manual) { S.prog = Math.min(1, S.prog + dt / 9); ui.prog.set(S.prog * 100); if (S.prog >= 1) S.anim = false; } _f(cx2, f, dt); };
    },
    graphs: [
      { title: 'Perfil de energía de la adición', h: 230, note: 'Aldehído (azul) frente a cetona (rosa): barreras más bajas y producto más estable para el aldehído. Esquema cualitativo.', draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 14, B = 26, pw = w - L - Rr, ph = h - Tp - B, cv = [{ p: [0, 55, 20, 42, 5], col: '#4dabf7', lab: 'aldehído' }, { p: [0, 72, 42, 62, 28], col: '#f06595', lab: 'cetona' }], mx = 85, mn = -5, sx = function (x) { return L + pw * x; }, sy = function (v) { return Tp + ph - ph * (v - mn) / (mx - mn); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var v = mn + (mx - mn) * i / 4, y = sy(v); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(v, 0), L - 4, y + 3); } cx.textAlign = 'center'; cx.fillText('coordenada de reacción  ·  eje y: E (kJ/mol)', L + pw / 2, h - 3);
        cv.forEach(function (k, n) { cx.strokeStyle = k.col; cx.lineWidth = 2.6; cx.beginPath(); for (var j = 0; j <= 120; j++) { var x = j / 120, t = x * 4, ii = Math.min(3, Math.floor(t)), u = t - ii, s = u * u * (3 - 2 * u), y = sy(k.p[ii] + (k.p[ii + 1] - k.p[ii]) * s); if (j === 0) cx.moveTo(sx(x), y); else cx.lineTo(sx(x), y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = k.col; cx.textAlign = 'left'; cx.fillText(k.lab, L + 8, Tp + 12 + n * 14); }); } },
      { title: 'Constante de hidratación K = [hidrato]/[C=O]', h: 190, note: 'log₁₀ K (agua, 25 °C): formaldehído 3,4 · etanal 0,0 · propanona −2,9 · acetofenona ≈ −5 (estimado).', draw: function (cx, w, h, c) {
        var ks = ['form', 'etanal', 'prop', 'acf'], ph = (h - 24) / 4, L = 108, sc = (w - L - 30) / 10, x0 = L + 6 * sc; cx.font = '11px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, 4); cx.lineTo(x0, h - 20); cx.stroke();
        ks.forEach(function (k, i) { var v = Math.log10(CB[k].K), y = 6 + i * ph; cx.fillStyle = k === S.cb ? '#fb7185' : '#9aa7b4'; cx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc) + 1, ph - 7); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(CB[k].n, L - 6, y + ph / 2 + 1); cx.textAlign = v < 0 ? 'left' : 'right'; cx.fillText(fmt(v, 1), v < 0 ? x0 + 4 : x0 - 4, y + ph / 2 + 1); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText('log₁₀ K', w / 2, h - 5); } },
      { title: 'Derivados de ácido: poder de grupo saliente', h: 190, note: 'pKa del ácido conjugado HL (menor = mejor grupo saliente = derivado más reactivo).', draw: function (cx, w, h, c) {
        var ks = ['Cl', 'An', 'Es', 'Am'], ph = (h - 24) / 4, L = 120, sc = (w - L - 40) / 50, x0 = L + 8 * sc; cx.font = '11px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, 4); cx.lineTo(x0, h - 20); cx.stroke();
        ks.forEach(function (k, i) { var v = LG[k].pka, y = 6 + i * ph; cx.fillStyle = k === S.lg ? '#fb7185' : '#9aa7b4'; cx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc) + 1, ph - 7); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(LG[k].n, L - 6, y + ph / 2 + 1); cx.textAlign = v < 0 ? 'right' : 'left'; cx.fillText(v, v < 0 ? x0 + v * sc - 4 : x0 + v * sc + 4, y + ph / 2 + 1); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText('pKa (HL)', w / 2, h - 5); } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (S.mode === 'acyl') { var l = LG[S.lg]; return '<div class="calc-step">Hidrólisis de ' + l.ex + '</div><table class="calc-table">' + row('Paso 1', 'H₂O ataca al C=O → intermedio tetraédrico') + row('Paso 2', 'se expulsa ' + l.t + ' y se regenera C=O') + row('pKa de HL', '<b>' + l.pka + '</b>') + row('Producto', 'ácido etanoico + HL') + '</table><p class="muted small">Cuanto menor el pKa de HL, mejor grupo saliente y más rápida la sustitución acílica.</p>'; }
      var c = CB[S.cb], n = NU[S.nu], pct = 100 * c.K / (1 + c.K); return '<div class="calc-step">1 · Reacción</div><table class="calc-table">' + row('Carbonilo', c.n) + row('Nucleófilo', n.n) + row('Tipo', n.how) + row('Producto', '<b>' + n.pn[S.cb] + '</b> (' + n.tn + ')') + '</table><div class="calc-step">2 · Equilibrio de hidratación</div><table class="calc-table">' + row('K = [hidrato]/[C=O]', MSim.sci(c.K, 2)) + row('% hidratado', '<b>' + fmt(pct, 3) + ' %</b>') + row('ΔG° = −RT ln K (298 K)', fmt(-R * 298 * Math.log(c.K) / 1000, 1) + ' kJ/mol') + '</table>';
    },
    quiz: [
      { q: '¿Qué átomo del grupo carbonilo es electrófilo?', options: ['El carbono', 'El oxígeno', 'Ambos igual', 'Ninguno'], answer: 0, why: 'El O atrae los electrones; el C queda δ+ y es atacado por nucleófilos.' },
      { q: 'Tras la adición de un nucleófilo, el carbono carbonílico pasa de…', options: ['sp² plano a sp³ tetraédrico', 'sp³ a sp²', 'sp a sp²', 'no cambia'], answer: 0, why: 'El π se rompe: se forma el intermedio tetraédrico.' },
      { q: 'El ángulo de Bürgi–Dunitz es aproximadamente…', options: ['107°', '90°', '120°', '180°'], answer: 0, why: 'El nucleófilo se aproxima a ≈ 107° respecto del enlace C=O.' },
      { q: '¿Por qué los aldehídos son más reactivos que las cetonas?', options: ['Menos impedimento y mayor δ+ en C', 'Tienen OH', 'Son más ácidos', 'Tienen más O'], answer: 0, why: 'Un solo grupo R: menos donación electrónica y menos impedimento.' },
      { q: 'La reducción de la propanona con NaBH₄ da…', options: ['propan-2-ol', 'propan-1-ol', 'propanal', 'propano'], answer: 0, why: 'H⁻ se adiciona al C=O; tras protonar: alcohol secundario.' },
      { q: 'CH₃MgBr + propanona (y luego H₃O⁺) da…', options: ['2-metilpropan-2-ol', 'propan-2-ol', 'butan-2-ol', '2-metilpropanal'], answer: 0, why: 'El CH₃⁻ forma un enlace C–C: alcohol terciario (terc-butanol).' },
      { q: 'La cianohidrina del etanal es…', options: ['2-hidroxipropanonitrilo', 'propanonitrilo', 'etanol', '2-cianoetanol'], answer: 0, why: 'CN⁻ se adiciona al C=O y el O⁻ se protona: CH₃CH(OH)CN.' },
      { q: 'El derivado de ácido más reactivo frente a nucleófilos es…', options: ['cloruro de acilo', 'amida', 'éster', 'ácido carboxílico'], answer: 0, why: 'Cl⁻ es el mejor grupo saliente (pKa de HCl ≈ −7).' }
    ],
    help: { intro: 'Sigue la lección o elige carbonilo y nucleófilo en «Lab» y mueve el avance de la reacción; en la tarjeta inferior se ensaya la sustitución acílica.', items: [['Lóbulos azules', 'orbital π* (LUMO) del carbonilo.'], ['Flechas', 'movimiento de pares de electrones.'], ['Cargas', 'δ+ en C y δ− en O.'], ['Gráficos', 'perfil de energía, K de hidratación y grupos salientes.']] }
  };
  MSim.create(def);
})();
