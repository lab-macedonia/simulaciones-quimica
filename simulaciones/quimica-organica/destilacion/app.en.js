/* Destilación simple y fraccionada — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

/* Núcleo común de los simuladores 3D · Laboratorio MACEDONIA (UMCE) — construido sobre ../../kit/simkit.js */
(function () {
  "use strict";
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
      list.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn' + (b.primary ? " primary" : ''); e.textContent = b.t; e.addEventListener('click', b.fn); if (b.id) ui(b.id, e); r.appendChild(e); });
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
    if (def.lab) tabs.push({ id: 'lab', label: "Lab", build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
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
  var AN = { hex: { n: "Hexane", A: 6.87024, B: 1168.72, C: 224.21, c: 0x74c0fc }, tol: { n: "Toluene", A: 6.95464, B: 1344.8, C: 219.482, c: 0xffd43b }, ben: { n: "Benzene", A: 6.90565, B: 1211.033, C: 220.79, c: 0xff8787 }, chx: { n: "Cyclohexane", A: 6.8413, B: 1201.53, C: 222.647, c: 0x69db7c } };
  var PAIRS = { ht: ['hex', 'tol'], bt: ['ben', 'tol'], ct: ['chx', 'tol'] };
  var S = { pair: 'ht', x0: 0.4, N: 1, p: 0, run: false, P: 760 }, lab = [], g = null, liq = null, dist = null, bub = [], rings = [], plates = [];
  function psat(k, t) { var a = AN[k]; return Math.pow(10, a.A - a.B / (t + a.C)); }
  function tb(k) { var a = AN[k]; return a.B / (a.A - Math.log10(S.P)) - a.C; }
  function bubble(x) { var p = PAIRS[S.pair], lo = tb(p[0]) - 5, hi = tb(p[1]) + 5, i, m; for (i = 0; i < 60; i++) { m = (lo + hi) / 2; if (x * psat(p[0], m) + (1 - x) * psat(p[1], m) > S.P) hi = m; else lo = m; } return m; }
  function yOf(x) { var p = PAIRS[S.pair], t = bubble(x); return Math.min(1, x * psat(p[0], t) / S.P); }
  function stairs(x, N) { var pts = [[x, x]], y, i; for (i = 0; i < N; i++) { y = yOf(x); pts.push([x, y]); pts.push([y, y]); x = y; } return { pts: pts, y: x }; }
  function rayleigh(x0, N) { var L = 1, x = x0, n = 120, dV = 0.98 / n, out = [{ f: 0, x: x, t: bubble(x), yd: stairs(x, N).y }], i, yd, f = 0, Ln; for (i = 0; i < n; i++) { yd = stairs(x, N).y; Ln = L - dV; x = Math.max(0.0005, (L * x - yd * dV) / Ln); L = Ln; f += dV; out.push({ f: f, x: x, t: bubble(x), yd: stairs(x, N).y }); } return out; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function cyl(a, b, r, m, parent) { var d = b.clone().sub(a), c = new T.Mesh(new T.CylinderGeometry(r, r, 1, 14, 1, true), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); parent.add(c); return c; }
  function stages() {
    return [
      ["What distillation is", "Fundamentals", "It separates miscible liquids by difference in volatility",
        "<p><b>Distillation</b> separates the components of a liquid mixture by taking advantage of the fact that the <b>more volatile</b> one (lower boiling point) passes into vapor in greater proportion. The vapor is condensed and collected as the <b>distillate</b>. For an ideal mixture, <b>Raoult's law</b> gives the partial pressure: P<sub>i</sub> = x<sub>i</sub>·P<sub>i</sub>°. The mixture boils when P<sub>A</sub> + P<sub>B</sub> = external pressure; the vapor composition is y<sub>A</sub> = x<sub>A</sub>·P<sub>A</sub>°/P.</p>"],
      ["Simple distillation", "Simple", "A single equilibrium stage: suitable if boiling points differ by > 70 °C or for purification",
        "<p>In <b>simple distillation</b> the vapor goes directly to the condenser: this is equivalent to <b>one theoretical plate</b>. The distillate is enriched in the volatile component, but is not completely separated. Setup: flask with <b>boiling chips</b>, head with thermometer (bulb level with the side arm), condenser with water <b>in countercurrent</b> (enters from below) and receiving flask.</p>"],
      ["Fractional distillation", "Fractional", "The column adds theoretical plates: each one repeats the liquid–vapor equilibrium",
        "<p>The <b>fractionating column</b> (Vigreux, packed) causes successive condensations and evaporations; each one is equivalent to a <b>theoretical plate</b> and enriches the vapor in the more volatile component. With more plates, the distillate is purer, but the process is slower. Use the “Theoretical plates” control to see it.</p>"],
      ["T–x–y diagram", "Diagram", "Bubble curve (liquid) and dew curve (vapor): the staircase counts the plates",
        "<p>The <b>temperature–composition diagram</b> has two curves: the <b>bubble</b> curve (boiling T of a liquid of composition x) and the <b>dew</b> curve (vapor composition y). A <b>staircase</b> is built: from x go up to the vapor curve, then go down horizontally to the liquid of that composition (condensate) and repeat. Each step is a theoretical plate.</p>"],
      ["Distillation curve", "Monitoring", "As it distills, the residue becomes depleted and the temperature rises",
        "<p>During distillation, the residue in the flask becomes <b>depleted in the volatile component</b> (Rayleigh equation) and the <b>boiling temperature rises</b>. That is why <b>fractions</b> are collected: the first is the richest in the volatile component. The distillation curve shows T and the instantaneous composition of the distillate versus the fraction distilled.</p>"]
    ];
  }
  var def = {
    key: 'destilacion', title: "Simple and Fractional Distillation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [2, 4, 24], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 3, 26], target: [0, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 6], target: [0, 3, 0] }],
    layers: [{ id: 'vap', label: 'Vapor', icon: '~' }, { id: 'col', label: "Plates", icon: '≡' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.25), i;
      var fl = new T.Mesh(new T.SphereGeometry(2.6, 24, 18), glass); fl.position.set(-9, -3, 0); g.add(fl);
      cyl(new T.Vector3(-9, -1, 0), new T.Vector3(-9, 1.5, 0), 0.7, glass, g);
      liq = new T.Mesh(new T.SphereGeometry(2.35, 24, 18), mat(0xffd43b, 0.7)); liq.position.set(-9, -3.2, 0); g.add(liq);
      cyl(new T.Vector3(-9, 1.5, 0), new T.Vector3(-9, 9, 0), 0.9, glass, g);
      for (i = 0; i < 8; i++) { var r = new T.Mesh(new T.TorusGeometry(0.9, 0.08, 6, 20), mat(0xadb5bd, 1)); r.rotation.x = Math.PI / 2; r.position.set(-9, 2.2 + i * 0.85, 0); g.add(r); rings.push(r); var pl = new T.Mesh(new T.CircleGeometry(0.85, 16), mat(0x4dabf7, 0.4)); pl.rotation.x = -Math.PI / 2; pl.position.copy(r.position); g.add(pl); plates.push(pl); }
      cyl(new T.Vector3(-9, 9, 0), new T.Vector3(-3, 11, 0), 0.5, glass, g);
      cyl(new T.Vector3(-3, 11, 0), new T.Vector3(8, 4, 0), 0.7, glass, g); cyl(new T.Vector3(-1.5, 10, 0), new T.Vector3(6.5, 5, 0), 1.3, mat(0x74c0fc, 0.2), g);
      var rf = new T.Mesh(new T.SphereGeometry(2, 20, 14), glass); rf.position.set(8, 0.6, 0); g.add(rf); cyl(new T.Vector3(8, 4, 0), new T.Vector3(8, 2.2, 0), 0.4, glass, g);
      dist = new T.Mesh(new T.SphereGeometry(1.8, 20, 14), mat(0x74c0fc, 0.8)); dist.position.set(8, 0.4, 0); g.add(dist);
      var bm = new T.Mesh(new T.CylinderGeometry(3.2, 3.6, 1.2, 20), mat(0x495057, 1)); bm.position.set(-9, -6.6, 0); g.add(bm);
      for (i = 0; i < 24; i++) { var b = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), mat(0xffffff, 0.8)); b.userData.ph = Math.random(); g.add(b); bub.push(b); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, p = PAIRS[S.pair];
      if (!P.manual) { var i = f.i; S.N = i === 1 ? 1 : (i === 2 ? 1 + Math.round(f.local * 6) : (i >= 3 ? 4 : 1)); if (i === 0) S.p = 0.1; else S.p = Math.min(1, f.local * 1.05); }
      else if (S.run) { S.p += dt / 12; if (S.p >= 1) { S.p = 1; S.run = false; } }
      var R = rayleigh(S.x0, S.N), k = Math.min(R.length - 1, Math.floor(S.p * 0.9 * (R.length - 1))), cur = R[k], mix = function (x) { var a = new T.Color(AN[p[0]].c), b = new T.Color(AN[p[1]].c); return b.lerp(a, x); };
      liq.material.color.copy(mix(cur.x)); liq.scale.setScalar(1 - 0.4 * S.p); liq.position.y = -3.2 - 0.4 * S.p * 1;
      dist.material.color.copy(mix(cur.yd)); dist.scale.setScalar(0.15 + 0.85 * S.p * 0.9);
      var vOn = ctx.layer('vap'), cOn = ctx.layer('col');
      rings.forEach(function (r, j) { r.visible = cOn && j < S.N + 1; plates[j].visible = cOn && j < S.N + 1; });
      bub.forEach(function (b, j) { var u = (now * 0.35 + b.userData.ph) % 1, up = u; b.position.set(-9 + Math.sin(now * 2 + j) * 0.35, -2 + up * 11, Math.cos(now * 2 + j) * 0.35); b.visible = vOn && S.p > 0.02 && up < 0.5 + 0.1 * S.N; });
      lab[0].pos(-9, 12, 0).set('T = ' + fmt(cur.t, 1) + ' °C', 'bl-lead').vis(true);
      lab[1].pos(8, 4.6 + 2.2, 0).set("Distillate: " + fmt(cur.yd * 100, 0) + ' % ' + AN[p[0]].n, 'bl-pos').vis(true);
      lab[2].pos(-9, -8.5, 0).set("Residue: x = " + fmt(cur.x, 2), 'bl-d').vis(true);
      lab[3].pos(-5.5, 5, 0).set(S.N === 1 ? "No column" : S.N + " theoretical plates", 'bl-d').vis(true); lab[4].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.pair) u.pair.set(S.pair); if (u.x0) u.x0.set(S.x0); if (u.N) u.N.set(S.N); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var p = PAIRS[S.pair], R = rayleigh(S.x0, S.N), cur = R[Math.min(R.length - 1, Math.floor(S.p * 0.9 * (R.length - 1)))]; return { eq: { chip: String(S.N), name: AN[p[0]].n + ' / ' + AN[p[1]].n, body: "<div class=\"eqline\"><small>Boiling T</small>" + fmt(cur.t, 1) + " °C</div><div class=\"eqline\"><small>Distillate</small>" + fmt(cur.yd * 100, 0) + ' % ' + AN[p[0]].n + "</div><div class=\"eqline\"><small>Residue</small>x = " + fmt(cur.x, 2) + '</div>' }, legend: [{ label: AN[p[0]].n, color: '#' + AN[p[0]].c.toString(16).padStart(6, '0'), text: "more volatile (b.p. " + fmt(tb(p[0]), 0) + ' °C)' }, { label: AN[p[1]].n, color: '#' + AN[p[1]].c.toString(16).padStart(6, '0'), text: "less volatile (b.p. " + fmt(tb(p[1]), 0) + ' °C)' }] }; },
    measures: function () { var p = PAIRS[S.pair], st = stairs(S.x0, S.N); return [["Mixture", AN[p[0]].n + ' / ' + AN[p[1]].n], ["initial x (volatile)", fmt(S.x0, 2)], ["Theoretical plates", String(S.N)], ["Initial bubble T", fmt(bubble(S.x0), 1) + ' °C'], ["Initial distillate purity", fmt(st.y * 100, 1) + ' %']]; },
    ideas: ["More plates → purer distillate (but slower).", "The boiling T rises as the residue loses volatile component.", "Boiling chips and water in countercurrent.", "Simple distillation = 1 theoretical plate."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Mixture"); el.appendChild(c);
      ui.pair = kit.ui.options({ label: "Pair", cols: 1, value: S.pair, options: [{ v: 'ht', label: "Hexane / toluene" }, { v: 'bt', label: "Benzene / toluene" }, { v: 'ct', label: "Cyclohexane / toluene" }], onChange: function (v) { ctx.goManual(); S.pair = v; S.p = 0; } }); c.appendChild(ui.pair);
      ui.x0 = kit.ui.slider({ label: "Initial mole fraction of the volatile component", min: 0.1, max: 0.9, step: 0.05, value: S.x0, format: function (v) { return fmt(v, 2); }, onInput: function (v) { ctx.goManual(); S.x0 = v; } });
      ui.N = kit.ui.slider({ label: "Theoretical plates", min: 1, max: 7, step: 1, value: S.N, format: function (v) { return v === 1 ? '1 (simple)' : String(v); }, onInput: function (v) { ctx.goManual(); S.N = v; } });
      ui.p = kit.ui.slider({ label: "Fraction distilled", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.p = v; } });
      c.appendChild(kit.ui.sliders([ui.x0, ui.N, ui.p]));
      c.appendChild(ctx.btnRow([{ t: "▶ Distill", primary: true, fn: function () { ctx.goManual(); S.p = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "T–x–y diagram with plate staircase", h: 280, note: "Blue: bubble curve (liquid). Orange: dew curve (vapor). Green: plate staircase.", draw: function (cx, w, h, col) {
        var p = PAIRS[S.pair], L = 40, Rr = 10, Tp = 12, B = 34, pw = w - L - Rr, ph = h - Tp - B, t0 = tb(p[0]) - 4, t1 = tb(p[1]) + 4, sx = function (x) { return L + pw * (1 - x); }, sy = function (t) { return Tp + ph - ph * (t - t0) / (t1 - t0); }, i, x, t;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; cx.textAlign = 'center';
        for (i = 0; i <= 4; i++) { cx.fillText(fmt(i / 4, 2), sx(i / 4), h - B + 14); } cx.fillText('x, y (' + AN[p[0]].n + ')', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var tt = t0 + (t1 - t0) * i / 4; cx.fillText(fmt(tt, 0), L - 4, sy(tt) + 3); cx.beginPath(); cx.moveTo(L, sy(tt)); cx.lineTo(L + pw, sy(tt)); cx.stroke(); }
        cx.lineWidth = 2; cx.strokeStyle = '#4dabf7'; cx.beginPath(); for (i = 0; i <= 50; i++) { x = i / 50; t = bubble(x); if (i) cx.lineTo(sx(x), sy(t)); else cx.moveTo(sx(x), sy(t)); } cx.stroke();
        cx.strokeStyle = '#ff922b'; cx.beginPath(); for (i = 0; i <= 50; i++) { x = i / 50; t = bubble(x); var y = yOf(x); if (i) cx.lineTo(sx(y), sy(t)); else cx.moveTo(sx(y), sy(t)); } cx.stroke();
        cx.lineWidth = 1.5; cx.strokeStyle = '#40c057'; var st = stairs(S.x0, S.N); cx.beginPath(); var xx = S.x0; cx.moveTo(sx(xx), sy(bubble(xx))); for (i = 0; i < S.N; i++) { var yy = yOf(xx); cx.lineTo(sx(yy), sy(bubble(xx))); cx.lineTo(sx(yy), sy(bubble(yy))); xx = yy; } cx.stroke(); cx.lineWidth = 1;
      } },
      { title: "Distillation curve", h: 230, note: "Red: residue T (°C). Green: % of volatile component in the instantaneous distillate.", draw: function (cx, w, h, col) {
        var R = rayleigh(S.x0, S.N), L = 40, Rr = 40, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, tmin = Math.min.apply(0, R.map(function (r) { return r.t; })), tmax = Math.max.apply(0, R.map(function (r) { return r.t; })) + 1, sx = function (f) { return L + pw * f; }, i;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i * 25, 0) + ' %', sx(i / 4), h - B + 14); cx.fillText("fraction distilled", L + pw / 2, h - 6);
        cx.strokeStyle = '#fa5252'; cx.lineWidth = 2; cx.beginPath(); R.forEach(function (r, j) { var y = Tp + ph - ph * (r.t - tmin) / (tmax - tmin); if (j) cx.lineTo(sx(r.f), y); else cx.moveTo(sx(r.f), y); }); cx.stroke();
        cx.strokeStyle = '#40c057'; cx.beginPath(); R.forEach(function (r, j) { var y = Tp + ph - ph * r.yd; if (j) cx.lineTo(sx(r.f), y); else cx.moveTo(sx(r.f), y); }); cx.stroke(); cx.lineWidth = 1;
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.p * 0.9), Tp); cx.lineTo(sx(S.p * 0.9), Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.textAlign = 'right'; cx.fillStyle = '#fa5252'; cx.fillText(fmt(tmax, 0) + ' °C', L - 4, Tp + 8); cx.fillText(fmt(tmin, 0) + ' °C', L - 4, Tp + ph);
      } }
    ],
    calc: function () {
      var p = PAIRS[S.pair], t = bubble(S.x0), PA = psat(p[0], t), PB = psat(p[1], t), y = S.x0 * PA / S.P, row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return "<div class=\"card-kicker\">First equilibrium (Raoult's law)</div><table class=\"calc-table\">" + row("Bubble T", fmt(t, 1) + ' °C (' + fmt(S.P, 0) + " mmHg)") + row('P° ' + AN[p[0]].n, fmt(PA, 0) + ' mmHg') + row('P° ' + AN[p[1]].n, fmt(PB, 0) + ' mmHg') + row('y = x·P°/P', fmt(S.x0, 2) + ' × ' + fmt(PA, 0) + ' / ' + fmt(S.P, 0) + ' = <b>' + fmt(y, 3) + '</b>') + row("Relative volatility α", fmt(PA / PB, 2)) + row("After " + S.N + " plate(s)", '<b>' + fmt(stairs(S.x0, S.N).y * 100, 1) + " %</b> of " + AN[p[0]].n) + "</table><p class=\"muted small\">Antoine: log₁₀P° = A − B/(T + C). Ideal mixture: approximation without azeotropes.</p>";
    },
    quiz: [
      { q: "In a simple distillation the component collected first is the…", options: ["more volatile", "less volatile", "denser", "more polar"], answer: 0, why: "It has a higher vapor pressure." },
      { q: "Each theoretical plate is equivalent to…", options: ["one liquid–vapor equilibrium", "a filtration", "a solid phase change", "a total reflux"], answer: 0, why: "One evaporation and condensation." },
      { q: "The condenser water must enter through…", options: ["down", "up", "either one", "the center"], answer: 0, why: "Countercurrent: the condenser fills and cools better." },
      { q: "As it distills, the boiling T of the residue…", options: ["rises", "low", "stays constant", "oscillates"], answer: 0, why: "The residue becomes enriched in the less volatile component." },
      { q: "Boiling chips are used to…", options: ["avoid superheating and bumping", "increase polarity", "cool", "filter"], answer: 0, why: "They provide bubble nuclei." },
      { q: "To separate liquids with very similar boiling points it is advisable to use…", options: ["fractional with many plates", "simple", "filtration", "decantation"], answer: 0, why: "Many equilibria are needed." }
    ],
    help: { intro: "Choose a pair, the initial composition and the theoretical plates; press “Distill”. The T–x–y diagram shows the plate staircase.", items: [["Blue rings", "theoretical plates of the column."], ["Bubbles", "rising vapor."]] }
  };
  MSim.create(def);
})();
