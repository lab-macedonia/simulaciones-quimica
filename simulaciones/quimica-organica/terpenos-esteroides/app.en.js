/* Terpenos y esteroides — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast("The lesson controls the simulation"); if (def.onStage) def.onStage(kit.state.stage, ctx); };
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
    if (def.graphs) tabs.push({ id: 'graf', label: "Graphs", build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || "Calculation", build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ("Review questions (" + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || "3D Simulator", accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ("3D viewer · " + def.title),
      stages: STAGES, mainTabLabel: "Guide", tabs: tabs, measuresTitle: "Live measurements", measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: "Labels", icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: "Free", pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
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
      help: def.help || { intro: "Follow the lesson with the player or explore freely in the “Lab” tab. With “Back to the lesson” the script takes control again.", items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();


(function () {
  var T = THREE;
  var UC = [0xff922b, 0x4dabf7, 0x69db7c, 0xf06595, 0xffd43b, 0xb197fc];
  var TP = { geo: { n: 'Geraniol', u: 2, cls: "monoterpene", f: 'C₁₀H₁₈O', oh: true, src: "roses, citronella" }, far: { n: 'Farnesol', u: 3, cls: "sesquiterpene", f: 'C₁₅H₂₆O', oh: true, src: "linden, citronella" }, ggo: { n: "Geranylgeraniol", u: 4, cls: "diterpene", f: 'C₂₀H₃₄O', oh: true, src: "precursor of retinol and phytol" } };
  var ST = {
    col: { n: "Cholesterol", f: 'C₂₇H₄₆O', c3: 'OH', db: 'C5=C6', c17: 'cadena', me10: true, me13: true, arom: false, role: "membranes; precursor of the other hormones" },
    tes: { n: "Testosterone", f: 'C₁₉H₂₈O₂', c3: 'O', db: 'C4=C5', c17: 'OH', me10: true, me13: true, arom: false, role: "male sex hormone (androgen)" },
    est: { n: 'Estradiol', f: 'C₁₈H₂₄O₂', c3: 'OH', db: 'aro', c17: 'OH', me10: false, me13: true, arom: true, role: "female sex hormone (estrogen); aromatic A ring" },
    pro: { n: "Progesterone", f: 'C₂₁H₃₀O₂', c3: 'O', db: 'C4=C5', c17: 'acetilo', me10: true, me13: true, arom: false, role: "progestogen; maintenance of pregnancy" }
  };
  var S = { tp: 'geo', st: 'col', p: 0, cyc: 0 }, g = null, lab = [], gTer = null, gSt = null, gSq = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function sph(r, c) { return new T.Mesh(new T.SphereGeometry(r, 14, 10), new T.MeshStandardMaterial({ color: c, roughness: 0.4 })); }
  function cy(a, b, r, c, par) { var m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: c || 0xced4da })), d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, d.length(), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); par.add(m); return m; }
  function addBond(par, A, i, j, ord, color) { var d = A[j].clone().sub(A[i]), nrm = V(-d.y, d.x, 0).normalize().multiplyScalar(0.12); if (ord === 2) { cy(A[i].clone().add(nrm), A[j].clone().add(nrm), 0.05, color, par); cy(A[i].clone().sub(nrm), A[j].clone().sub(nrm), 0.05, color, par); } else cy(A[i], A[j], 0.06, color, par); }
  function terpene(t) {
    var gr = new T.Group(), A = [], U = [], B = [], k, u, idx = 0, dx = 1.25, c = [];
    for (u = 0; u < t.u; u++) { for (k = 0; k < 4; k++) { var x = dx * idx - 0.6 * t.u * 2.3 / 2 * 2 / 2, y = (idx % 2 ? 0.7 : -0.7); A.push(V(x, y, 0)); U.push(u); idx++; } }
    var xs = A.map(function (a) { return a.x; }), mid = (Math.max.apply(0, xs) + Math.min.apply(0, xs)) / 2; A.forEach(function (a) { a.x -= mid; });
    var n = A.length, ord = []; for (k = 0; k < n - 1; k++) ord.push((k % 4 === 1) ? 2 : 1);
    // metilo de cada unidad en c3
    var M = [], MU = []; for (u = 0; u < t.u; u++) { var i3 = u * 4 + 2, dir = A[i3].y > 0 ? 1 : -1; M.push({ i: i3, p: A[i3].clone().add(V(0.0, dir * 1.4, 0)) }); MU.push(u); }
    A.forEach(function (a, j) { var s = sph(0.34, UC[U[j]]); s.position.copy(a); gr.add(s); });
    M.forEach(function (m, j) { var s = sph(0.34, UC[MU[j]]); s.position.copy(m.p); gr.add(s); cy(A[m.i], m.p, 0.06, 0xced4da, gr); });
    for (k = 0; k < n - 1; k++) addBond(gr, A, k, k + 1, ord[k], 0xced4da);
    var oh = sph(0.4, 0xff4d4d); oh.position.copy(A[0].clone().add(V(-1.0, A[0].y > 0 ? 0.6 : -0.6, 0))); gr.add(oh); cy(A[0], oh.position, 0.06, 0xced4da, gr);
    gr.userData.units = t.u; return gr;
  }
  var HEX = [[0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5], [0, -1], [0.866, -0.5]];
  function steroid(s) {
    var gr = new T.Group(), P = {}, S2 = 1.5;
    function pt(x, y) { return V(x * S2, y * S2, 0); }
    // anillo A: centro (0,0)
    var nm = { C10: HEX[0], C1: HEX[1], C2: HEX[2], C3: HEX[3], C4: HEX[4], C5: HEX[5] };
    var cB = [1.732, 0]; P.C6 = [cB[0] + HEX[4][0], cB[1] + HEX[4][1]]; P.C7 = [cB[0] + HEX[5][0], cB[1] + HEX[5][1]]; P.C8 = [cB[0] + HEX[0][0], cB[1] + HEX[0][1]]; P.C9 = [cB[0] + HEX[1][0], cB[1] + HEX[1][1]];
    var cC = [2.598, 1.5]; P.C11 = [cC[0] + HEX[1][0], cC[1] + HEX[1][1]]; P.C12 = [cC[0] + HEX[0][0] - 0 * 0, cC[1] + HEX[0][1]]; P.C13 = [cC[0] + 0.866, cC[1] + 0.5]; P.C14 = [cC[0] + 0.866, cC[1] - 0.5]; P.C12 = [cC[0], cC[1] + 1]; P.C11 = [cC[0] - 0.866, cC[1] + 0.5];
    P.C17 = [4.415, 2.309]; P.C16 = [5.003, 1.5]; P.C15 = [4.415, 0.691];
    var all = { C1: HEX[1], C2: HEX[2], C3: HEX[3], C4: HEX[4], C5: HEX[5], C10: HEX[0], C6: P.C6, C7: P.C7, C8: P.C8, C9: P.C9, C11: P.C11, C12: P.C12, C13: P.C13, C14: P.C14, C15: P.C15, C16: P.C16, C17: P.C17 };
    all.C8 = [cB[0] + HEX[0][0], cB[1] + HEX[0][1]]; all.C9 = [cB[0] + HEX[1][0], cB[1] + HEX[1][1]]; // C8, C9 en B; ajustes de posición abajo
    // reasignación estándar: C9 = vértice B superior izquierdo compartido con C; C8 = vértice B superior derecho
    all.C9 = [1.732, 1.0]; all.C8 = [2.598, 0.5]; all.C14 = [3.464, 1.0]; all.C13 = [3.464, 2.0]; all.C12 = [2.598, 2.5]; all.C11 = [1.732, 2.0]; all.C10 = [0.866, 0.5]; all.C5 = [0.866, -0.5]; all.C6 = [1.732, -1.0]; all.C7 = [2.598, -0.5];
    var bonds = [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'C10'], ['C10', 'C1'], ['C5', 'C6'], ['C6', 'C7'], ['C7', 'C8'], ['C8', 'C9'], ['C9', 'C10'], ['C9', 'C11'], ['C11', 'C12'], ['C12', 'C13'], ['C13', 'C14'], ['C14', 'C8'], ['C13', 'C17'], ['C17', 'C16'], ['C16', 'C15'], ['C15', 'C14']];
    var cx0 = 2.4, cy0 = 1.0, A = {}; Object.keys(all).forEach(function (k) { var v = all[k]; A[k] = V((v[0] - cx0) * S2, (v[1] - cy0) * S2, 0); var s = sph(0.3, 0x56606b); s.position.copy(A[k]); s.userData.k = k; gr.add(s); });
    var dbl = {}; if (s.db === 'C5=C6') dbl['C5-C6'] = 1; if (s.db === 'C4=C5') dbl['C4-C5'] = 1; var ringA = ['C1-C2', 'C2-C3', 'C3-C4', 'C4-C5', 'C5-C10', 'C10-C1'];
    if (s.arom) { dbl['C1-C2'] = 1; dbl['C3-C4'] = 1; dbl['C5-C10'] = 1; }
    bonds.forEach(function (b) { var key = b[0] + '-' + b[1], key2 = b[1] + '-' + b[0]; var o = (dbl[key] || dbl[key2]) ? 2 : 1; var d = A[b[1]].clone().sub(A[b[0]]), nrm = V(-d.y, d.x, 0).normalize().multiplyScalar(0.12); if (o === 2) { cy(A[b[0]].clone().add(nrm), A[b[1]].clone().add(nrm), 0.05, 0xced4da, gr); cy(A[b[0]].clone().sub(nrm), A[b[1]].clone().sub(nrm), 0.05, 0xced4da, gr); } else cy(A[b[0]], A[b[1]], 0.06, 0xced4da, gr); });
    function sub(from, off, col, r, ord) { var p = A[from].clone().add(off), s2 = sph(r || 0.34, col); s2.position.copy(p); gr.add(s2); cy(A[from], p, 0.06, 0xced4da, gr); return p; }
    var cen = A.C3.clone().sub(A.C10).normalize();
    if (s.c3 === 'OH') sub('C3', V(-0.9, -0.8, 0), 0xff4d4d, 0.4); else sub('C3', V(-0.9, -0.8, 0), 0xff4d4d, 0.4, 2);
    if (s.me10) sub('C10', V(0, 0.2, 1.3), 0x56606b, 0.34);
    if (s.me13) sub('C13', V(0, 0.2, 1.3), 0x56606b, 0.34);
    if (s.c17 === 'OH') sub('C17', V(0.6, 1.0, 0), 0xff4d4d, 0.4);
    else if (s.c17 === 'acetilo') { var p1 = sub('C17', V(0.4, 1.2, 0), 0x56606b, 0.34); var p2 = p1.clone().add(V(1.0, 0.5, 0)), o = sph(0.4, 0xff4d4d); o.position.copy(p1.clone().add(V(-0.3, 1.1, 0))); gr.add(o); cy(p1, o.position, 0.06, 0xced4da, gr); var m2 = sph(0.34, 0x56606b); m2.position.copy(p2); gr.add(m2); cy(p1, p2, 0.06, 0xced4da, gr); }
    else if (s.c17 === 'cadena') { var prev = A.C17.clone(), dirs = [V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0)]; dirs.forEach(function (d2, j) { var np = prev.clone().add(d2.clone().multiplyScalar(0.95)), s3 = sph(0.3, 0x56606b); s3.position.copy(np); gr.add(s3); cy(prev, np, 0.06, 0xced4da, gr); prev = np; if (j === 3) { var br = np.clone().add(V(0.0, 1.2, 0.0)); } }); }
    gr.userData.A = A; return gr;
  }
  function squalene() {
    var gr = new T.Group(), pts = [], k, ring = new T.Group();
    for (k = 0; k < 24; k++) { var th = k * 0.55, r = 3.6 - k * 0.03; pts.push(V(r * Math.cos(th) * 1.0, -4 + k * 0.33, r * Math.sin(th))); }
    pts.forEach(function (p, j) { var s = sph(0.28, UC[Math.floor(j / 4) % 6]); s.position.copy(p); gr.add(s); if (j) cy(pts[j - 1], p, 0.06, 0xced4da, gr); });
    gr.userData.pts = pts; return gr;
  }
  function stages() {
    return [
      ["The isoprene rule", "Isoprene", "All terpenes are built from 5-carbon units (C₅)",
        "<p><b>Terpenes</b> are natural products formed from <b>isoprene (2-methylbuta-1,3-diene, C₅H₈)</b> units joined “head to tail”. They are classified by the number of units: <b>monoterpenes</b> (2 units, C₁₀), <b>sesquiterpenes</b> (3, C₁₅), <b>diterpenes</b> (4, C₂₀), <b>triterpenes</b> (6, C₃₀) and <b>tetraterpenes</b> (8, C₄₀, carotenoids). Each color in the figure marks one unit.</p>"],
      ["Linear terpenes", "Linear", "Geraniol (C₁₀) → farnesol (C₁₅) → geranylgeraniol (C₂₀)",
        "<p>Biosynthesis uses <b>isopentenyl pyrophosphate (IPP)</b> and <b>dimethylallyl pyrophosphate (DMAPP)</b>: one DMAPP + one IPP give <b>geranyl-PP</b> (C₁₀); another IPP, <b>farnesyl-PP</b> (C₁₅); another, <b>geranylgeranyl-PP</b> (C₂₀). The corresponding alcohols (<b>geraniol, farnesol, geranylgeraniol</b>) keep the pattern: each unit contributes a 4-C chain with a methyl on the third carbon.</p>"],
      ["From squalene to cholesterol", "Squalene", "Two farnesyl-PP → squalene (C₃₀) → cyclization → lanosterol → cholesterol",
        "<p>Two molecules of farnesyl-PP join “tail to tail” to give <b>squalene</b> (C₃₀). <b>Squalene monooxygenase</b> forms the epoxide and a cyclization cascade (like those seen in electrophilic addition) closes <b>four rings</b> and generates <b>lanosterol</b>. In about 19 more steps 3 methyls are lost and <b>cholesterol</b> (C₂₇) is obtained. Move the control to see the folding.</p>"],
      ["The steroid skeleton", "Skeleton", "Four fused rings: three 6-membered (A, B, C) and one 5-membered (D)",
        "<p><b>Steroids</b> share the <b>cyclopentanoperhydrophenanthrene</b> nucleus: rings <b>A, B, C</b> (cyclohexane) and <b>D</b> (cyclopentane), numbered C1–C17. The methyls <b>C18</b> (on C13) and <b>C19</b> (on C10) usually point up (β). The ring fusions are <i>trans</i>, giving an almost flat, rigid skeleton that inserts between membrane lipids.</p>"],
      ["Steroid hormones", "Hormones", "Small changes in the substituents change the biological function",
        "<p>With the same skeleton, the <b>substituents</b> determine the function: <b>cholesterol</b> has OH at C3, a C5=C6 double bond and an 8-carbon side chain at C17; <b>testosterone</b> has C3=O, C4=C5 and OH at C17; <b>estradiol</b> has an aromatic A ring (no C19) with a phenolic OH; <b>progesterone</b> has C3=O, C4=C5 and an acetyl group at C17. Compare the four.</p>"]
    ];
  }
  var def = {
    key: 'terpenos-esteroides', title: "Terpenes and Steroids", subtitle: "3D simulator · advanced organic chemistry", accent: { dark: '#e599f7', light: '#862e9c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 5, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'col', label: "Colors by unit", icon: '●' }],
    build: function (ctx) { g = new T.Group(); ctx.scene.add(g); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, mode; if (!P.manual) { if (i === 0) { S.tp = 'geo'; mode = 'ter'; } else if (i === 1) { S.tp = ['geo', 'far', 'ggo'][Math.min(2, Math.floor(f.local * 3))]; mode = 'ter'; } else if (i === 2) { mode = 'sq'; S.cyc = f.local; } else if (i === 3) { S.st = 'col'; mode = 'st'; } else { S.st = ['col', 'tes', 'est', 'pro'][Math.min(3, Math.floor(f.local * 4))]; mode = 'st'; } S.mode = mode; }
      mode = S.mode || 'ter'; var key = mode + (mode === 'ter' ? S.tp : (mode === 'st' ? S.st : 'sq'));
      if (g.userData.key !== key) { g.userData.key = key; while (g.children.length) g.remove(g.children[0]); g.add(mode === 'ter' ? terpene(TP[S.tp]) : (mode === 'st' ? steroid(ST[S.st]) : squalene())); }
      var obj = g.children[0]; if (mode === 'sq' && obj) { var pts = obj.userData.pts; obj.children.forEach(function (c, j) { }); }
      lab.forEach(function (l) { l.vis(false); });
      if (mode === 'ter') { var t = TP[S.tp]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.25; lab[0].pos(0, 5, 0).set(t.n + ' · ' + t.cls + ' (' + t.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -4.8, 0).set(t.u + " isoprene units · " + t.u * 5 + ' C · ' + t.src, 'bl-d').vis(true); }
      else if (mode === 'st') { var s = ST[S.st]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.3; lab[0].pos(0, 7, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -6.2, 0).set(s.role, 'bl-d').vis(true); lab[2].pos(-6.2, -3.4, 0).set('C3: ' + (s.c3 === 'OH' ? 'OH' : 'C=O'), 'bl-d').vis(true); lab[3].pos(6.8, 3.2, 0).set('C17: ' + (s.c17 === 'cadena' ? "C₈ chain" : (s.c17 === 'OH' ? 'OH' : "acetyl")), 'bl-d').vis(true); }
      else { var q = sm(S.cyc); obj.children.forEach(function (c, j) { }); g.rotation.y = ctx.now * 0.2; lab[0].pos(0, 6.5, 0).set("Squalene (C₃₀): 6 isoprene units", 'bl-lead').vis(true); lab[1].pos(0, -6, 0).set(q < 0.5 ? "folded chain (chair–boat–chair–boat)" : "cyclization: 4 rings → lanosterol", 'bl-d').vis(true); var pp = obj.userData.pts; obj.children.forEach(function (c, j) { if (j < pp.length) { var p0 = pp[j], th = j * 0.55 + q * j * 0.12, r = (3.6 - j * 0.03) * (1 - 0.45 * q); c.position.set(r * Math.cos(th), -4 + j * (0.33 - 0.12 * q), r * Math.sin(th)); } }); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.tp) u.tp.set(S.tp); if (u.st) u.st.set(S.st); },
    hud: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return { eq: { chip: 'C₁₇', name: s.n, body: "<div class=\"eqline\"><small>Formula</small>" + s.f + '</div><div class="eqline"><small>C3</small>' + (s.c3 === 'OH' ? "hydroxyl" : "carbonyl") + "</div><div class=\"eqline\"><small>Double bond</small>" + (s.db === 'aro' ? "aromatic A ring" : s.db) + "</div><div class=\"eqline\"><small>Function</small>" + s.role + '</div>' }, legend: [{ label: "Gray", color: '#56606b', text: "carbon" }, { label: "Red", color: '#ff4d4d', text: "oxygen" }] }; } var t = TP[S.tp]; return { eq: { chip: 'C' + t.u * 5, name: t.n, body: "<div class=\"eqline\"><small>Class</small>" + t.cls + "</div><div class=\"eqline\"><small>C₅ units</small>" + t.u + "</div><div class=\"eqline\"><small>Formula</small>" + t.f + '</div>' }, legend: UC.slice(0, t.u).map(function (c, j) { return { label: "Unit " + (j + 1), color: '#' + c.toString(16).padStart(6, '0'), text: "isoprene C₅" }; }) }; },
    measures: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return [["Steroid", s.n], ["Formula", s.f], ['C3', s.c3 === 'OH' ? 'OH' : '=O'], ['C17', s.c17], ["C19 methyl", s.me10 ? "yes" : "no (aromatic A ring)"], ["Function", s.role]]; } var t = TP[S.tp]; return [["Terpene", t.n], ["Class", t.cls], ["Isoprene units", String(t.u)], ["Carbons", String(t.u * 5)], ["Source", t.src]]; },
    ideas: ["Terpene = n × C₅ (isoprene rule).", "Squalene → lanosterol → cholesterol.", "Steroid: 3 six-membered rings + 1 five-membered.", "Cholesterol → hormones: the substituents change."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Choose what to view"); el.appendChild(c);
      ui.tp = kit.ui.options({ label: "Linear terpene", cols: 3, value: S.tp, options: Object.keys(TP).map(function (k) { return { v: k, label: TP[k].n, sub: TP[k].cls }; }), onChange: function (v) { ctx.goManual(); S.tp = v; S.mode = 'ter'; } }); c.appendChild(ui.tp);
      ui.st = kit.ui.options({ label: "Steroid", cols: 2, value: S.st, options: Object.keys(ST).map(function (k) { return { v: k, label: ST[k].n }; }), onChange: function (v) { ctx.goManual(); S.st = v; S.mode = 'st'; } }); c.appendChild(ui.st);
      ui.cy = kit.ui.slider({ label: "Squalene folding", min: 0, max: 1, step: 0.01, value: S.cyc, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'sq'; S.cyc = v; } }); c.appendChild(kit.ui.sliders([ui.cy]));
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Carbons by number of isoprene units", h: 200, note: "C = 5 × n. Highlighted: your terpene.", draw: function (cx, w, h, col) {
      var D = [[1, "Hemiterpene"], [2, "Monoterpene"], [3, "Sesquiterpene"], [4, "Diterpene"], [6, "Triterpene"], [8, "Tetraterpene"]], L = 90, Rr = 30, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
      D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.mode || 'ter') === 'ter' && TP[S.tp].u === d[0]; cx.fillStyle = cur ? '#e599f7' : '#845ef7'; cx.globalAlpha = cur ? 1 : 0.65; cx.fillRect(L, y + 4, pw * d[0] * 5 / 40, bh - 8); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[1], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText('C' + d[0] * 5, L + pw * d[0] * 5 / 40 + 4, y + bh / 2 + 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return '<div class="card-kicker">' + s.n + '</div><table class="calc-table">' + row("Formula", s.f) + row("Rings", 'A, B, C (6 C) + D (5 C)') + row('C3', s.c3 === 'OH' ? 'OH' : 'C=O') + row('C17', s.c17) + row("Function", s.role) + '</table>'; } var t = TP[S.tp]; return '<div class="card-kicker">' + t.n + '</div><table class="calc-table">' + row("C₅ units", t.u) + row("Carbons", t.u + ' × 5 = <b>' + t.u * 5 + '</b>') + row("Formula", t.f) + row("C=C double bonds", String(t.u) + " (one per unit)") + '</table>'; },
    quiz: [
      { q: "Terpenes are formed from units of…", options: ["isoprene (C₅)", "acetate (C₂)", "glucose (C₆)", "ethylene"], answer: 0, why: "Isoprene rule." },
      { q: "A sesquiterpene has…", options: ["15 carbons", "10 carbons", "20 carbons", "30 carbons"], answer: 0, why: "3 units × 5." },
      { q: "The precursor of cholesterol is…", options: ["squalene", 'glucosa', "palmitic acid", 'ATP'], answer: 0, why: "Squalene → lanosterol → cholesterol." },
      { q: "The steroid nucleus has…", options: ["3 six-membered rings and 1 five-membered", "4 six-membered rings", "2 six-membered and 2 five-membered", "1 aromatic six-membered ring"], answer: 0, why: "A, B, C six-membered; D five-membered." },
      { q: "Estradiol differs from testosterone because it has…", options: ["aromatic A ring", "an 8-carbon side chain", "an acetyl group", "two ketones"], answer: 0, why: "It loses the C19 methyl and aromatizes." }
    ],
    help: { intro: "Each color marks one isoprene unit. In “Steroid” you see the A–D nucleus with its substituents; the folding control shows squalene closing.", items: [["Colors", "C₅ units."], ["Red spheres", "oxygen."]] }
  };
  MSim.create(def);
})();
