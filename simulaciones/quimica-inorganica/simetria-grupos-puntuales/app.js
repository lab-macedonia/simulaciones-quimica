/* Simetría molecular y grupos puntuales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  function ring(n, r, z, el, off) { var a = []; for (var k = 0; k < n; k++) { var t = (off || 0) + k * 2 * Math.PI / n; a.push([el, r * Math.cos(t), r * Math.sin(t), z]); } return a; }
  var Z = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0], D = Math.PI / 180, r3 = Math.sqrt(3) / 2;
  var MOL = {
    h2o: { n: 'Agua', f: 'H₂O', g: 'C₂v', a: [['O', 0, 0, 0.12], ['H', 0.76, 0, -0.47], ['H', -0.76, 0, -0.47]], b: [[0, 1], [0, 2]], po: true, ch: false, lin: false, cn: 'C₂', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₂(z)', 'C', Z, 180], ['σv(xz)', 's', Y], ['σv′(yz)', 's', X]] },
    nh3: { n: 'Amoníaco', f: 'NH₃', g: 'C₃v', a: [['N', 0, 0, 0.3]].concat(ring(3, 0.95, -0.1, 'H', 0)), b: [[0, 1], [0, 2], [0, 3]], po: true, ch: false, lin: false, cn: 'C₃', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(z)', 'C', Z, 120], ['C₃²(z)', 'C', Z, 240], ['σv(xz)', 's', Y], ['σv′', 's', [-r3, -0.5, 0].map(function (v, i) { return i === 0 ? r3 : (i === 1 ? -0.5 : 0); })], ['σv″', 's', [r3, 0.5, 0]]] },
    ch4: { n: 'Metano', f: 'CH₄', g: 'Td', a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', 0.63, -0.63, -0.63], ['H', -0.63, 0.63, -0.63], ['H', -0.63, -0.63, 0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], po: false, ch: false, lin: false, cn: 'C₃ (×4)', c2p: true, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(1,1,1)', 'C', [1, 1, 1], 120], ['C₂(z)', 'C', Z, 180], ['S₄(z)', 'S', Z, 90], ['σd(x=y)', 's', [1, -1, 0]]] },
    bf3: { n: 'Trifluoruro de boro', f: 'BF₃', g: 'D₃h', a: [['B', 0, 0, 0]].concat(ring(3, 1.3, 0, 'F', 0)), b: [[0, 1], [0, 2], [0, 3]], po: false, ch: false, lin: false, cn: 'C₃', c2p: true, sh: true, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(z)', 'C', Z, 120], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['S₃(z)', 'S', Z, 120]] },
    sf6: { n: 'Hexafluoruro de azufre', f: 'SF₆', g: 'Oh', a: [['S', 0, 0, 0], ['F', 1.56, 0, 0], ['F', -1.56, 0, 0], ['F', 0, 1.56, 0], ['F', 0, -1.56, 0], ['F', 0, 0, 1.56], ['F', 0, 0, -1.56]], b: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]], po: false, ch: false, lin: false, cn: 'C₄', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C₄(z)', 'C', Z, 90], ['C₃(1,1,1)', 'C', [1, 1, 1], 120], ['C₂(1,1,0)', 'C', [1, 1, 0], 180], ['σh(xy)', 's', Z], ['σd(x=y)', 's', [1, -1, 0]], ['i', 'i'], ['S₄(z)', 'S', Z, 90]] },
    co2: { n: 'Dióxido de carbono', f: 'CO₂', g: 'D∞h', a: [['C', 0, 0, 0], ['O', 0, 0, 1.16], ['O', 0, 0, -1.16]], b: [[0, 1, 2], [0, 2, 2]], po: false, ch: false, lin: true, cn: 'C∞', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C∞(z) 60°', 'C', Z, 60], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['i', 'i']] },
    hcl: { n: 'Cloruro de hidrógeno', f: 'HCl', g: 'C∞v', a: [['Cl', 0, 0, -0.64], ['H', 0, 0, 0.64]], b: [[0, 1]], po: true, ch: false, lin: true, cn: 'C∞', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C∞(z) 60°', 'C', Z, 60], ['σv(xz)', 's', Y]] },
    tdce: { n: 'trans-1,2-Dicloroeteno', f: 'C₂H₂Cl₂', g: 'C₂h', a: [['C', -0.67, 0, 0], ['C', 0.67, 0, 0], ['Cl', -1.45, 1.4, 0], ['H', -1.2, -0.95, 0], ['Cl', 1.45, -1.4, 0], ['H', 1.2, 0.95, 0]], b: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]], po: false, ch: false, lin: false, cn: 'C₂', c2p: false, sh: true, sv: false, inv: true,
      ops: [['E', 'E'], ['C₂(z)', 'C', Z, 180], ['σh(xy)', 's', Z], ['i', 'i']] },
    c6h6: { n: 'Benceno', f: 'C₆H₆', g: 'D₆h', a: ring(6, 1.4, 0, 'C', 0).concat(ring(6, 2.48, 0, 'H', 0)), b: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5, 2], [5, 0], [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]], po: false, ch: false, lin: false, cn: 'C₆', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C₆(z)', 'C', Z, 60], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['i', 'i']] },
    chfclbr: { n: 'CHFClBr (quiral)', f: 'CHFClBr', g: 'C₁', a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['F', 0.9, -0.9, -0.9], ['Cl', -1.2, 1.2, -1.2], ['Br', -1.4, -1.4, 1.4]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], po: true, ch: true, lin: false, cn: '—', c2p: false, sh: false, sv: false, inv: false,
      ops: [['E', 'E']] }
  };
  var KEYS = Object.keys(MOL);
  var S = { m: 'h2o', o: 0, run: -1, uT: 0 }, g = null, mg = null, gg = null, axis = null, plane = null, lab = [], key = '', gmat = null;
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function opMatrix(op) {
    var M = new T.Matrix4(); if (op[1] === 'E') return M;
    if (op[1] === 'i') return M.makeScale(-1, -1, -1);
    var n = norm(op[2] || Z), v = new T.Vector3(n[0], n[1], n[2]), R = new T.Matrix4(), P = new T.Matrix4();
    if (op[1] === 'C') return M.makeRotationAxis(v, op[3] * D);
    var refl = function (m) { var a = v.x, b = v.y, c = v.z; m.set(1 - 2 * a * a, -2 * a * b, -2 * a * c, 0, -2 * a * b, 1 - 2 * b * b, -2 * b * c, 0, -2 * a * c, -2 * b * c, 1 - 2 * c * c, 0, 0, 0, 0, 1); return m; };
    if (op[1] === 's') return refl(M);
    R.makeRotationAxis(v, op[3] * D); P = refl(new T.Matrix4()); return P.multiply(R);
  }
  function applyOp(M, p) { return new T.Vector3(p[1], p[2], p[3]).applyMatrix4(M); }
  function valid(m, op) { var M = opMatrix(op), ok = true; m.a.forEach(function (at) { var q = applyOp(M, at), found = false; m.a.forEach(function (b) { if (b[0] === at[0] && Math.hypot(b[1] - q.x, b[2] - q.y, b[3] - q.z) < 0.05) found = true; }); if (!found) ok = false; }); return ok; }
  function stages() {
    return [
      ['Operaciones y elementos', 'Operaciones', 'E, Cₙ, σ, i y Sₙ: operación y elemento de simetría',
        '<p>Una <b>operación de simetría</b> deja la molécula en una posición indistinguible de la inicial; el <b>elemento de simetría</b> es el eje, plano o punto respecto del cual se realiza. Las operaciones son: la <b>identidad E</b>, la <b>rotación propia C<sub>n</sub></b> (360°/n), la <b>reflexión σ</b> en un plano, la <b>inversión i</b> por el centro y la <b>rotación impropia S<sub>n</sub></b> (rotación 360°/n seguida de reflexión en el plano perpendicular). Aquí se aplican al agua.</p>'],
      ['Grupos puntuales', 'Grupos', 'El conjunto de operaciones forma el grupo puntual',
        '<p>El conjunto de todas las operaciones de una molécula es su <b>grupo puntual</b>: H₂O es <b>C₂v</b>, NH₃ <b>C₃v</b>, CH₄ <b>T<sub>d</sub></b>, BF₃ <b>D₃h</b>, SF₆ <b>O<sub>h</sub></b>, CO₂ <b>D<sub>∞h</sub></b>. Recorre las moléculas y comprueba qué operaciones la dejan invariante: el simulador verifica que cada átomo cae sobre otro igual.</p>'],
      ['Asignar el grupo', 'Asignar', 'Diagrama de decisión: lineal → alta simetría → Cₙ → C₂ ⟂ → σ',
        '<p>Para <b>asignar el grupo</b>: 1) ¿es lineal? (D<sub>∞h</sub> si tiene i; C<sub>∞v</sub> si no). 2) ¿tiene simetría alta (varios C<sub>n</sub> con n ≥ 3: T<sub>d</sub>, O<sub>h</sub>)? 3) Busca el <b>eje principal C<sub>n</sub></b>. 4) ¿Hay n ejes C₂ perpendiculares? (D). 5) Planos: σh (D<sub>nh</sub>, C<sub>nh</sub>), σv (C<sub>nv</sub>). La pestaña «Cálculo» recorre el diagrama para la molécula elegida.</p>'],
      ['Polaridad y quiralidad', 'Propiedades', 'Polar: C₁, Cₛ, Cₙ, Cₙv · Quiral: sin eje impropio (C₁, Cₙ, Dₙ)',
        '<p>La simetría predice propiedades. Una molécula puede tener <b>momento dipolar</b> sólo si pertenece a <b>C₁, C<sub>s</sub>, C<sub>n</sub> o C<sub>nv</sub></b> (H₂O, NH₃, HCl). Es <b>quiral</b> si carece de eje impropio S<sub>n</sub> (incluidos σ e i): grupos <b>C₁, C<sub>n</sub> y D<sub>n</sub></b>. CHFClBr es C₁: quiral. SF₆ y CH₄ tienen muchos elementos y no son polares.</p>']
    ];
  }
  function polar(m) { return m.po ? 'sí' : 'no'; }
  var def = {
    key: 'simetria-grupos-puntuales', title: 'Simetría molecular y grupos puntuales', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#3bc9db', light: '#0b7285' },
    stages: stages, nStages: 4, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [16, 6, 18], target: [16, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [16, 0, 22], target: [16, 0, 0] }],
    layers: [{ id: 'el', label: 'Elemento', icon: '⟂' }, { id: 'ghost', label: 'Imagen', icon: '◌' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(21, 0, 0); ctx.scene.add(g); mg = new T.Group(); g.add(mg); gg = new T.Group(); gg.matrixAutoUpdate = false; g.add(gg);
      axis = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 8), new T.MeshBasicMaterial({ color: 0xffd43b })); g.add(axis);
      plane = new T.Mesh(new T.CircleGeometry(5, 32), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.28, side: T.DoubleSide, depthWrite: false })); g.add(plane);
      gmat = new T.MeshStandardMaterial({ color: 0xff922b, transparent: true, opacity: 0.45 });
      for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.m = 'h2o'; S.o = Math.min(3, Math.floor(f.local * 4)); S.uT = (f.local * 4) % 1; } if (i === 1) { var ks = ['h2o', 'nh3', 'ch4', 'bf3', 'sf6', 'co2', 'hcl']; var q = Math.min(ks.length - 1, Math.floor(f.local * ks.length)); S.m = ks[q]; S.o = Math.min(MOL[S.m].ops.length - 1, 1 + Math.floor(((f.local * ks.length) % 1) * (MOL[S.m].ops.length - 1))); S.uT = (f.local * ks.length * 2) % 1; } if (i === 2) { var k2 = ['tdce', 'c6h6', 'sf6', 'nh3'], q2 = Math.min(3, Math.floor(f.local * 4)); S.m = k2[q2]; S.o = 1; S.uT = (f.local * 8) % 1; } if (i === 3) { var k3 = ['chfclbr', 'h2o', 'ch4', 'co2'], q3 = Math.min(3, Math.floor(f.local * 4)); S.m = k3[q3]; S.o = Math.min(1, MOL[S.m].ops.length - 1); S.uT = (f.local * 8) % 1; } }
      else if (S.run >= 0) { S.uT += dt * 0.6; if (S.uT >= 1) { S.uT = 1; S.run = -1; } }
      var m = MOL[S.m]; if (S.o >= m.ops.length) S.o = 0;
      if (key !== S.m) { key = S.m; while (mg.children.length) mg.remove(mg.children[0]); while (gg.children.length) gg.remove(gg.children[0]); mg.add(ctx.mol(m, { gs: 3.6, ar: 1.3 })); gg.add(ctx.mol(m, { gs: 3.6, ar: 1.3, mat: gmat })); }
      var op = m.ops[S.o], u = Math.max(0, Math.min(1, S.uT)), e = u * u * (3 - 2 * u), M = opMatrix(op), I = new T.Matrix4(), els = ctx.layer('el'), gh = ctx.layer('ghost');
      mg.quaternion.identity(); mg.matrixAutoUpdate = true; gg.visible = false; axis.visible = false; plane.visible = false;
      if (op[1] === 'C') { var n = norm(op[2]); mg.quaternion.setFromAxisAngle(new T.Vector3(n[0], n[1], n[2]), op[3] * D * e); axis.visible = els; axis.scale.set(1, 15, 1); axis.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n[0], n[1], n[2])); axis.position.set(0, 0, 0); }
      else if (op[1] !== 'E') { gg.visible = gh && u > 0; var Me = new T.Matrix4(); Me.elements = I.elements.map(function (x, k) { return x + e * (M.elements[k] - x); }); gg.matrix.copy(Me); gg.matrixWorldNeedsUpdate = true;
        if (op[1] === 's') { var n2 = norm(op[2]); plane.visible = els; plane.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(n2[0], n2[1], n2[2])); plane.position.set(0, 0, 0); }
        if (op[1] === 'S') { var n3 = norm(op[2]); plane.visible = els; axis.visible = els; plane.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(n3[0], n3[1], n3[2])); axis.scale.set(1, 15, 1); axis.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n3[0], n3[1], n3[2])); }
        if (op[1] === 'i') { axis.visible = false; } }
      var ok = valid(m, op);
      lab[0].pos(21, 6.4, 0).set(m.n + ' (' + m.f + ') · grupo ' + m.g, 'bl-lead').vis(true);
      lab[1].pos(21, -4.2, 0).set('operación: ' + op[0] + (ok ? ' ✓ la molécula coincide consigo misma' : ' ✗'), ok ? 'bl-pos' : 'bl-neg').vis(true);
      lab[2].pos(21, -5.6, 0).set('polar: ' + polar(m) + ' · quiral: ' + (m.ch ? 'sí' : 'no'), 'bl-d').vis(true);
      lab[3].pos(16, 0, 0).set('', 'bl-d').vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); if (u.o) { } },
    hud: function () { var m = MOL[S.m], op = m.ops[Math.min(S.o, m.ops.length - 1)]; return { eq: { chip: m.g, name: 'Grupo puntual', body: '<div class="eqline"><small>Molécula</small>' + m.f + '</div><div class="eqline"><small>Operación</small>' + op[0] + '</div><div class="eqline"><small>Polar</small>' + polar(m) + '</div><div class="eqline"><small>Quiral</small>' + (m.ch ? 'sí' : 'no') + '</div>' }, legend: [{ label: 'Línea amarilla', color: '#ffd43b', text: 'eje de simetría' }, { label: 'Disco azul', color: '#74c0fc', text: 'plano de simetría' }, { label: 'Naranja', color: '#ff922b', text: 'imagen tras la operación' }] }; },
    measures: function () { var m = MOL[S.m]; return [['Molécula', m.f], ['Grupo puntual', m.g], ['Eje principal', m.cn], ['Operaciones mostradas', String(m.ops.length)], ['Polar', polar(m)], ['Quiral', m.ch ? 'sí' : 'no']]; },
    ideas: ['Operación ≠ elemento de simetría.', 'Sₙ = Cₙ seguido de σ perpendicular.', 'Polar: C₁, Cₛ, Cₙ, Cₙv.', 'Quiral: sin ejes impropios.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Molécula y operación'); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Molécula', cols: 2, value: S.m, options: KEYS.map(function (k) { return { v: k, label: MOL[k].f, sub: MOL[k].g }; }), onChange: function (v) { ctx.goManual(); S.m = v; S.o = 0; S.uT = 0; rebuildOps(); } });
      c.appendChild(ui.m); var holder = document.createElement('div'); c.appendChild(holder);
      function rebuildOps() { holder.innerHTML = ''; var m = MOL[S.m], row = []; m.ops.forEach(function (op, k) { row.push({ t: op[0], fn: function () { ctx.goManual(); S.o = k; S.uT = 0; S.run = k; } }); }); holder.appendChild(ctx.btnRow(row)); }
      rebuildOps(); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Número de operaciones por grupo', h: 190, note: 'Orden del grupo: cuántas operaciones lo forman.', draw: function (cx, w, h, col) {
      var d = [['C₁', 1], ['C₂v', 4], ['C₃v', 6], ['D₃h', 12], ['Td', 24], ['Oh', 48]], L = 12, B = 26, Tp = 14, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * Math.log(x[1] + 1) / Math.log(50), cur = x[0].replace('v', 'v') === MOL[S.m].g.replace('C₂v', 'C₂v'); cx.fillStyle = cur ? '#ffa94d' : '#3bc9db'; cx.fillRect(L + j * bw + 6, Tp + ph - hh, bw - 12, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 10); cx.fillText(String(x[1]), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () {
      var m = MOL[S.m], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, hi = /Td|Oh/.test(m.g);
      var path = [['1. ¿Es lineal?', m.lin ? 'sí → ' + (m.inv ? 'tiene i: <b>D∞h</b>' : 'sin i: <b>C∞v</b>') : 'no']];
      if (!m.lin) { path.push(['2. ¿Varios Cₙ con n ≥ 3?', hi ? 'sí → <b>' + m.g + '</b>' : 'no']); if (!hi) { path.push(['3. Eje principal', m.cn]); path.push(['4. ¿Hay C₂ perpendiculares?', m.c2p ? 'sí → familia D' : 'no → familia C o S']); path.push(['5. Planos', (m.sh ? 'σh presente' : 'sin σh') + ' · ' + (m.sv ? 'σv presentes' : 'sin σv')]); path.push(['Grupo', '<b>' + m.g + '</b>']); } }
      return '<div class="card-kicker">' + m.n + ' (' + m.f + ')</div><table class="calc-table">' + path.map(function (p) { return row(p[0], p[1]); }).join('') + row('Polar', m.po ? 'sí (grupo C₁, Cₛ, Cₙ o Cₙv)' : 'no') + row('Quiral', m.ch ? 'sí (sin ejes impropios)' : 'no (tiene σ, i o Sₙ)') + '</table>';
    },
    quiz: [
      { q: 'El grupo puntual del agua es…', options: ['C₂v', 'C₃v', 'D₂h', 'Cₛ'], answer: 0, why: 'Un C₂ y dos planos σv.' },
      { q: 'Sₙ consiste en…', options: ['rotación 360°/n seguida de reflexión en el plano perpendicular', 'sólo una reflexión', 'inversión doble', 'dos rotaciones'], answer: 0, why: 'Es una rotación impropia.' },
      { q: 'Una molécula polar no puede pertenecer a…', options: ['Td', 'C₂v', 'C₃v', 'C∞v'], answer: 0, why: 'Td tiene dipolo nulo por simetría.' },
      { q: 'CHFClBr es quiral porque su grupo puntual es…', options: ['C₁', 'Cₛ', 'C₂v', 'Td'], answer: 0, why: 'Sin planos, centro ni ejes impropios.' },
      { q: 'El CO₂ tiene grupo…', options: ['D∞h', 'C∞v', 'C₂v', 'D₃h'], answer: 0, why: 'Lineal con centro de inversión.' },
      { q: 'La inversión i lleva el punto (x, y, z) a…', options: ['(−x, −y, −z)', '(x, y, −z)', '(−x, y, z)', '(y, x, z)'], answer: 0, why: 'Reflexión a través del centro.' }
    ],
    help: { intro: 'Elige una molécula y pulsa una operación: la imagen naranja muestra el resultado y se verifica que coincida con la molécula original. «Cálculo» recorre el diagrama para asignar el grupo.', items: [['Línea amarilla', 'eje de rotación.'], ['Disco azul', 'plano de reflexión.']] }
  };
  MSim.create(def);
})();
