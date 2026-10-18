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


(function () {
  var T = THREE;
  var UC = [0xff922b, 0x4dabf7, 0x69db7c, 0xf06595, 0xffd43b, 0xb197fc];
  var TP = { geo: { n: 'Geraniol', u: 2, cls: 'monoterpeno', f: 'C₁₀H₁₈O', oh: true, src: 'rosas, citronela' }, far: { n: 'Farnesol', u: 3, cls: 'sesquiterpeno', f: 'C₁₅H₂₆O', oh: true, src: 'tilo, citronela' }, ggo: { n: 'Geranilgeraniol', u: 4, cls: 'diterpeno', f: 'C₂₀H₃₄O', oh: true, src: 'precursor de retinol y fitol' } };
  var ST = {
    col: { n: 'Colesterol', f: 'C₂₇H₄₆O', c3: 'OH', db: 'C5=C6', c17: 'cadena', me10: true, me13: true, arom: false, role: 'membranas; precursor de las demás hormonas' },
    tes: { n: 'Testosterona', f: 'C₁₉H₂₈O₂', c3: 'O', db: 'C4=C5', c17: 'OH', me10: true, me13: true, arom: false, role: 'hormona sexual masculina (andrógeno)' },
    est: { n: 'Estradiol', f: 'C₁₈H₂₄O₂', c3: 'OH', db: 'aro', c17: 'OH', me10: false, me13: true, arom: true, role: 'hormona sexual femenina (estrógeno); anillo A aromático' },
    pro: { n: 'Progesterona', f: 'C₂₁H₃₀O₂', c3: 'O', db: 'C4=C5', c17: 'acetilo', me10: true, me13: true, arom: false, role: 'gestágeno; mantenimiento del embarazo' }
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
      ['La regla del isopreno', 'Isopreno', 'Todos los terpenos se construyen con unidades de 5 carbonos (C₅)',
        '<p>Los <b>terpenos</b> son productos naturales formados por unidades de <b>isopreno (2-metilbuta-1,3-dieno, C₅H₈)</b> unidas «cabeza con cola». Se clasifican por el número de unidades: <b>monoterpenos</b> (2 unidades, C₁₀), <b>sesquiterpenos</b> (3, C₁₅), <b>diterpenos</b> (4, C₂₀), <b>triterpenos</b> (6, C₃₀) y <b>tetraterpenos</b> (8, C₄₀, carotenoides). Cada color de la figura marca una unidad.</p>'],
      ['Terpenos lineales', 'Lineales', 'Geraniol (C₁₀) → farnesol (C₁₅) → geranilgeraniol (C₂₀)',
        '<p>La biosíntesis usa <b>pirofosfato de isopentenilo (IPP)</b> y <b>de dimetilalilo (DMAPP)</b>: un DMAPP + un IPP dan <b>geranil-PP</b> (C₁₀); otro IPP, <b>farnesil-PP</b> (C₁₅); otro, <b>geranilgeranil-PP</b> (C₂₀). Los alcoholes correspondientes (<b>geraniol, farnesol, geranilgeraniol</b>) conservan el patrón: cada unidad aporta una cadena de 4 C con un metilo en el tercero.</p>'],
      ['Del escualeno al colesterol', 'Escualeno', 'Dos farnesil-PP → escualeno (C₃₀) → ciclación → lanosterol → colesterol',
        '<p>Dos moléculas de farnesil-PP se unen «cola con cola» para dar <b>escualeno</b> (C₃₀). La <b>escualeno monooxigenasa</b> forma el epóxido y una cascada de ciclación (como las vistas en adición electrofílica) cierra <b>cuatro anillos</b> y genera el <b>lanosterol</b>. En unos 19 pasos más se pierden 3 metilos y se obtiene el <b>colesterol</b> (C₂₇). Mueve el control para ver el plegamiento.</p>'],
      ['El esqueleto esteroidal', 'Esqueleto', 'Cuatro anillos fusionados: tres de 6 miembros (A, B, C) y uno de 5 (D)',
        '<p>Los <b>esteroides</b> comparten el núcleo de <b>ciclopentanoperhidrofenantreno</b>: anillos <b>A, B, C</b> (ciclohexano) y <b>D</b> (ciclopentano), numerados C1–C17. Los metilos <b>C18</b> (en C13) y <b>C19</b> (en C10) suelen apuntar hacia arriba (β). Las fusiones de anillos son <i>trans</i>, lo que da un esqueleto casi plano y rígido que se inserta entre los lípidos de la membrana.</p>'],
      ['Hormonas esteroidales', 'Hormonas', 'Pequeños cambios en los sustituyentes cambian la función biológica',
        '<p>Con el mismo esqueleto, los <b>sustituyentes</b> determinan la función: el <b>colesterol</b> tiene OH en C3, doble enlace C5=C6 y una cadena lateral de 8 C en C17; la <b>testosterona</b> tiene C3=O, C4=C5 y OH en C17; el <b>estradiol</b> tiene el anillo A aromático (sin C19) con OH fenólico; la <b>progesterona</b> tiene C3=O, C4=C5 y un grupo acetilo en C17. Compara las cuatro.</p>']
    ];
  }
  var def = {
    key: 'terpenos-esteroides', title: 'Terpenos y esteroides', subtitle: 'Simulador 3D · química orgánica avanzada', accent: { dark: '#e599f7', light: '#862e9c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 5, 20], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'col', label: 'Colores por unidad', icon: '●' }],
    build: function (ctx) { g = new T.Group(); ctx.scene.add(g); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, mode; if (!P.manual) { if (i === 0) { S.tp = 'geo'; mode = 'ter'; } else if (i === 1) { S.tp = ['geo', 'far', 'ggo'][Math.min(2, Math.floor(f.local * 3))]; mode = 'ter'; } else if (i === 2) { mode = 'sq'; S.cyc = f.local; } else if (i === 3) { S.st = 'col'; mode = 'st'; } else { S.st = ['col', 'tes', 'est', 'pro'][Math.min(3, Math.floor(f.local * 4))]; mode = 'st'; } S.mode = mode; }
      mode = S.mode || 'ter'; var key = mode + (mode === 'ter' ? S.tp : (mode === 'st' ? S.st : 'sq'));
      if (g.userData.key !== key) { g.userData.key = key; while (g.children.length) g.remove(g.children[0]); g.add(mode === 'ter' ? terpene(TP[S.tp]) : (mode === 'st' ? steroid(ST[S.st]) : squalene())); }
      var obj = g.children[0]; if (mode === 'sq' && obj) { var pts = obj.userData.pts; obj.children.forEach(function (c, j) { }); }
      lab.forEach(function (l) { l.vis(false); });
      if (mode === 'ter') { var t = TP[S.tp]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.25; lab[0].pos(0, 5, 0).set(t.n + ' · ' + t.cls + ' (' + t.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -4.8, 0).set(t.u + ' unidades de isopreno · ' + t.u * 5 + ' C · ' + t.src, 'bl-d').vis(true); }
      else if (mode === 'st') { var s = ST[S.st]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.3; lab[0].pos(0, 7, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -6.2, 0).set(s.role, 'bl-d').vis(true); lab[2].pos(-6.2, -3.4, 0).set('C3: ' + (s.c3 === 'OH' ? 'OH' : 'C=O'), 'bl-d').vis(true); lab[3].pos(6.8, 3.2, 0).set('C17: ' + (s.c17 === 'cadena' ? 'cadena C₈' : (s.c17 === 'OH' ? 'OH' : 'acetilo')), 'bl-d').vis(true); }
      else { var q = sm(S.cyc); obj.children.forEach(function (c, j) { }); g.rotation.y = ctx.now * 0.2; lab[0].pos(0, 6.5, 0).set('Escualeno (C₃₀): 6 unidades de isopreno', 'bl-lead').vis(true); lab[1].pos(0, -6, 0).set(q < 0.5 ? 'cadena plegada (silla–bote–silla–bote)' : 'ciclación: 4 anillos → lanosterol', 'bl-d').vis(true); var pp = obj.userData.pts; obj.children.forEach(function (c, j) { if (j < pp.length) { var p0 = pp[j], th = j * 0.55 + q * j * 0.12, r = (3.6 - j * 0.03) * (1 - 0.45 * q); c.position.set(r * Math.cos(th), -4 + j * (0.33 - 0.12 * q), r * Math.sin(th)); } }); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.tp) u.tp.set(S.tp); if (u.st) u.st.set(S.st); },
    hud: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return { eq: { chip: 'C₁₇', name: s.n, body: '<div class="eqline"><small>Fórmula</small>' + s.f + '</div><div class="eqline"><small>C3</small>' + (s.c3 === 'OH' ? 'hidroxilo' : 'carbonilo') + '</div><div class="eqline"><small>Doble enlace</small>' + (s.db === 'aro' ? 'anillo A aromático' : s.db) + '</div><div class="eqline"><small>Función</small>' + s.role + '</div>' }, legend: [{ label: 'Gris', color: '#56606b', text: 'carbono' }, { label: 'Rojo', color: '#ff4d4d', text: 'oxígeno' }] }; } var t = TP[S.tp]; return { eq: { chip: 'C' + t.u * 5, name: t.n, body: '<div class="eqline"><small>Clase</small>' + t.cls + '</div><div class="eqline"><small>Unidades C₅</small>' + t.u + '</div><div class="eqline"><small>Fórmula</small>' + t.f + '</div>' }, legend: UC.slice(0, t.u).map(function (c, j) { return { label: 'Unidad ' + (j + 1), color: '#' + c.toString(16).padStart(6, '0'), text: 'isopreno C₅' }; }) }; },
    measures: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return [['Esteroide', s.n], ['Fórmula', s.f], ['C3', s.c3 === 'OH' ? 'OH' : '=O'], ['C17', s.c17], ['Metilo C19', s.me10 ? 'sí' : 'no (anillo A aromático)'], ['Función', s.role]]; } var t = TP[S.tp]; return [['Terpeno', t.n], ['Clase', t.cls], ['Unidades de isopreno', String(t.u)], ['Carbonos', String(t.u * 5)], ['Fuente', t.src]]; },
    ideas: ['Terpeno = n × C₅ (regla del isopreno).', 'Escualeno → lanosterol → colesterol.', 'Esteroide: 3 anillos de 6 + 1 de 5.', 'Colesterol → hormonas: cambian los sustituyentes.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Elige qué ver'); el.appendChild(c);
      ui.tp = kit.ui.options({ label: 'Terpeno lineal', cols: 3, value: S.tp, options: Object.keys(TP).map(function (k) { return { v: k, label: TP[k].n, sub: TP[k].cls }; }), onChange: function (v) { ctx.goManual(); S.tp = v; S.mode = 'ter'; } }); c.appendChild(ui.tp);
      ui.st = kit.ui.options({ label: 'Esteroide', cols: 2, value: S.st, options: Object.keys(ST).map(function (k) { return { v: k, label: ST[k].n }; }), onChange: function (v) { ctx.goManual(); S.st = v; S.mode = 'st'; } }); c.appendChild(ui.st);
      ui.cy = kit.ui.slider({ label: 'Plegamiento del escualeno', min: 0, max: 1, step: 0.01, value: S.cyc, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'sq'; S.cyc = v; } }); c.appendChild(kit.ui.sliders([ui.cy]));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Carbonos según el n.º de unidades de isopreno', h: 200, note: 'C = 5 × n. Resaltado: tu terpeno.', draw: function (cx, w, h, col) {
      var D = [[1, 'Hemiterpeno'], [2, 'Monoterpeno'], [3, 'Sesquiterpeno'], [4, 'Diterpeno'], [6, 'Triterpeno'], [8, 'Tetraterpeno']], L = 90, Rr = 30, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
      D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.mode || 'ter') === 'ter' && TP[S.tp].u === d[0]; cx.fillStyle = cur ? '#e599f7' : '#845ef7'; cx.globalAlpha = cur ? 1 : 0.65; cx.fillRect(L, y + 4, pw * d[0] * 5 / 40, bh - 8); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[1], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText('C' + d[0] * 5, L + pw * d[0] * 5 / 40 + 4, y + bh / 2 + 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return '<div class="card-kicker">' + s.n + '</div><table class="calc-table">' + row('Fórmula', s.f) + row('Anillos', 'A, B, C (6 C) + D (5 C)') + row('C3', s.c3 === 'OH' ? 'OH' : 'C=O') + row('C17', s.c17) + row('Función', s.role) + '</table>'; } var t = TP[S.tp]; return '<div class="card-kicker">' + t.n + '</div><table class="calc-table">' + row('Unidades C₅', t.u) + row('Carbonos', t.u + ' × 5 = <b>' + t.u * 5 + '</b>') + row('Fórmula', t.f) + row('Dobles enlaces C=C', String(t.u) + ' (uno por unidad)') + '</table>'; },
    quiz: [
      { q: 'Los terpenos se forman a partir de unidades de…', options: ['isopreno (C₅)', 'acetato (C₂)', 'glucosa (C₆)', 'etileno'], answer: 0, why: 'Regla del isopreno.' },
      { q: 'Un sesquiterpeno tiene…', options: ['15 carbonos', '10 carbonos', '20 carbonos', '30 carbonos'], answer: 0, why: '3 unidades × 5.' },
      { q: 'El precursor del colesterol es…', options: ['escualeno', 'glucosa', 'ácido palmítico', 'ATP'], answer: 0, why: 'Escualeno → lanosterol → colesterol.' },
      { q: 'El núcleo esteroidal tiene…', options: ['3 anillos de 6 y 1 de 5', '4 anillos de 6', '2 de 6 y 2 de 5', '1 aromático de 6'], answer: 0, why: 'A, B, C de seis; D de cinco.' },
      { q: 'El estradiol difiere de la testosterona porque tiene…', options: ['anillo A aromático', 'una cadena lateral de 8 C', 'un grupo acetilo', 'dos cetonas'], answer: 0, why: 'Pierde el metilo C19 y aromatiza.' }
    ],
    help: { intro: 'Cada color marca una unidad de isopreno. En «Esteroide» ves el núcleo A–D con sus sustituyentes; el control de plegamiento muestra el escualeno cerrándose.', items: [['Colores', 'unidades C₅.'], ['Esferas rojas', 'oxígeno.']] }
  };
  MSim.create(def);
})();
