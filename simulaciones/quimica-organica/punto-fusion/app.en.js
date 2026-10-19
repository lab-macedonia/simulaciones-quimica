/* Punto de fusión y pureza — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, R = 8.314;
  var CM = { ba: { n: "Benzoic acid", Tm: 122.4, H: 18000, c: 0xf8f9fa }, ur: { n: "Urea", Tm: 133, H: 14000, c: 0xe9ecef }, na: { n: "Naphthalene", Tm: 80.3, H: 19100, c: 0xdee2e6 }, ac: { n: "Acetanilide", Tm: 114.3, H: 21600, c: 0xf1f3f5 }, sa: { n: "Salicylic acid", Tm: 159, H: 25000, c: 0xe9ecef } };
  var S = { cm: 'ba', xi: 0, rate: 2, T: 25, run: false, mix: 'none', obs: null }, lab = [], g = null, cap = null, sol = null, liqm = null, tube = null;
  function ints(k, xi) { var c = CM[k], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * xi, Te = c.Tm - 35, liq = Math.max(Te + 1, c.Tm - dT); return { onset: xi > 0.001 ? Math.max(Te, c.Tm - Math.min(35, 4 + 90 * xi)) : c.Tm - 0.3, clear: xi > 0.001 ? liq : c.Tm + 0.3 }; }
  function range() { var i = ints(S.cm, S.xi), lag = 0.9 * S.rate; return { on: i.onset, cl: i.clear, onM: i.onset + lag * 0.5, clM: i.clear + lag }; }
  function frac(Tt) { var r = range(); return Math.max(0, Math.min(1, (Tt - r.onM) / Math.max(0.2, r.clM - r.onM))); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.4, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ["What the melting point measures", "Fundamentals", "The temperature at which a crystalline solid turns into a liquid; it is a criterion of identity and purity",
        "<p>The <b>melting point</b> is the temperature at which solid and liquid coexist. A <b>pure</b> compound melts over a <b>narrow range</b> (0.5–1 °C). It is measured in a <b>capillary</b> tube with a few millimeters of sample, inside a heating block with a thermometer. Two values are recorded: <b>onset</b> (first drop) and <b>end</b> (all liquid).</p>"],
      ["Impurities: depression and broadening", "Purity", "An impurity lowers and broadens the melting range",
        "<p>An impurity soluble in the liquid <b>lowers the melting point</b> (freezing-point depression): ΔT ≈ R·T<sub>m</sub>²·x<sub>imp</sub>/ΔH<sub>fus</sub>. The solid begins to melt at a temperature close to the <b>eutectic</b> and finishes lower than the pure compound: the range <b>broadens</b>. That is why a wide range indicates an impure sample.</p>"],
      ["Heating rate", "Rate", "Heating fast shifts and broadens the observed range",
        "<p>The sample and the thermometer are not in equilibrium if heated fast: the observed value is <b>above</b> the true one and the range appears wider. The recommended approach is to get quickly to ~15 °C below the expected value and then heat at <b>1–2 °C/min</b>. Use the rate control and compare.</p>"],
      ["Mixed melting point", "Mixed", "If the mixture with a standard does not lower the melting point, both are the same compound",
        "<p>To identify an unknown, it is mixed with a <b>standard</b> and the <b>mixed melting point</b> is measured. If they are the same compound, the melting point <b>does not change</b>; if they are different, the mixture <b>melts lower and over a wide range</b>. Turn on “Mix with another compound” to simulate it.</p>"],
      ["Solid–liquid diagram", "Diagram", "Eutectic: the mixture with the lowest melting point",
        "<p>The T–x diagram shows the <b>liquidus</b> curve (above it everything is liquid) and the <b>solidus</b> or eutectic line (below it everything is solid). Between them solid and liquid coexist. The observed range corresponds to the vertical distance between both curves at the sample composition.</p>"]
    ];
  }
  var def = {
    key: 'punto-fusion', title: "Melting Point and Purity", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [4, 3, 16], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 18], target: [0, 0, 0] }],
    layers: [{ id: 'cap', label: "Zoom on the capillary", icon: '🔍' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g);
      var blk = new T.Mesh(new T.BoxGeometry(8, 9, 5), mat(0x868e96, 1)); blk.position.set(-3, 0, -1); g.add(blk);
      var win = new T.Mesh(new T.BoxGeometry(5, 5, 0.2), mat(0xa5d8ff, 0.3)); win.position.set(-3, 0, 1.55); g.add(win);
      tube = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 10, 12, 1, true), mat(0xdee2e6, 0.4)); tube.position.set(-3, 0, 1.2); g.add(tube);
      sol = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xf8f9fa, 1)); sol.position.set(-3, -2, 1.2); g.add(sol);
      liqm = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xffd8a8, 0.6)); liqm.position.set(-3, -2, 1.2); g.add(liqm);
      var th = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 14, 10), mat(0xe03131, 0.8)); th.position.set(-1.5, 2, 1.2); g.add(th);
      cap = new T.Group(); cap.position.set(7, 0, 0); g.add(cap);
      for (var i = 0; i < 36; i++) { var cr = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), mat(0xf8f9fa, 1)); cr.userData = { a: Math.random() * 6.28, r: Math.random(), y: Math.random() }; cap.add(cr); }
      var gl = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 7, 20, 1, true), mat(0xdee2e6, 0.25)); cap.add(gl);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, c = CM[S.cm], r;
      if (!P.manual) { var i = f.i; S.xi = i === 0 ? 0 : (i === 1 ? 0.12 * f.local : (i === 3 ? 0.2 : (i === 4 ? 0.1 : 0))); S.rate = i === 2 ? 1 + 9 * f.local : 2; S.mix = i === 3 ? 'diff' : 'none'; S.T = 20 + (c.Tm + 15 - 20) * Math.min(1, f.local * 1.05); }
      else if (S.run) { S.T += S.rate / 60 * dt * 20; if (S.T > c.Tm + 20) { S.T = c.Tm + 20; S.run = false; } }
      var xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi; var save = S.xi; S.xi = xe; r = range(); var fr = frac(S.T); S.xi = save;
      sol.scale.y = 1.5 + 1.5 * (1 - fr); sol.position.y = -4.5 + sol.scale.y / 2; liqm.scale.y = 1.5 * fr + 0.01; liqm.position.y = -4.5 + sol.scale.y + liqm.scale.y / 2 - 0.5; liqm.visible = fr > 0.01; sol.visible = fr < 0.999;
      cap.children.forEach(function (m, j) { if (j >= 36) return; var u = m.userData; m.visible = ctx.layer('cap') && (j / 36) > fr; m.position.set(Math.cos(u.a) * u.r * 1.5, -3 + u.y * 5.5 * (1 - 0.3 * fr), Math.sin(u.a) * u.r * 1.5); m.material.color.setHex(0xf8f9fa); });
      cap.visible = ctx.layer('cap'); cap.rotation.y = now * 0.3;
      var a = ints(S.cm, xe);
      lab[0].pos(-3, 7, 0).set(c.n + (S.mix === 'diff' ? ' + otro compuesto' : ''), 'bl-lead').vis(true);
      lab[1].pos(-3, -6.5, 0).set('T = ' + fmt(S.T, 1) + ' °C · ' + (fr <= 0 ? "solid" : (fr >= 1 ? "liquid" : "melting " + fmt(fr * 100, 0) + ' %')), fr > 0 && fr < 1 ? 'bl-pos' : 'bl-d').vis(true);
      lab[2].pos(-3, -7.5, 0).set("Range: " + fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C (Δ ' + fmt(a.clear - a.onset, 1) + ')', 'bl-d').vis(true); lab[3].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cm) u.cm.set(S.cm); if (u.xi) u.xi.set(S.xi); if (u.rate) u.rate.set(S.rate); if (u.T) u.T.set(S.T); },
    hud: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), pure = a.clear - a.onset < 2; return { eq: { chip: fmt(a.clear - a.onset, 1), name: c.n, body: "<div class=\"eqline\"><small>Onset</small>" + fmt(a.onset, 1) + " °C</div><div class=\"eqline\"><small>End</small>" + fmt(a.clear, 1) + " °C</div><div class=\"eqline\"><small>Literature value</small>" + fmt(c.Tm, 1) + " °C</div><div class=\"eqline\"><small>Purity</small>" + (pure ? "narrow range: pure" : "wide range: impure") + '</div>' }, legend: [{ label: "White crystals", color: '#f8f9fa', text: "solid" }, { label: "Orange liquid", color: '#ffd8a8', text: "molten" }] }; },
    measures: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), r = range(); return [["Compound", c.n], ["Literature", fmt(c.Tm, 1) + ' °C'], ["Impurity", fmt(xe * 100, 0) + ' %'], ["True range", fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C'], ["Rate", fmt(S.rate, 1) + ' °C/min'], ["Observed (with lag)", fmt(r.onM, 1) + ' – ' + fmt(r.clM, 1) + ' °C']]; },
    ideas: ["Pure: range ≤ 1 °C and close to the literature value.", "Impurity: lowers and broadens the range.", "Heat slowly: 1–2 °C/min.", "Mixed, no change → same compound."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Sample"); el.appendChild(c);
      ui.cm = kit.ui.options({ label: "Compound", cols: 2, value: S.cm, options: Object.keys(CM).map(function (k) { return { v: k, label: CM[k].n, sub: CM[k].Tm + ' °C' }; }), onChange: function (v) { ctx.goManual(); S.cm = v; S.T = 25; } }); c.appendChild(ui.cm);
      ui.xi = kit.ui.slider({ label: "Impurity (mole fraction)", min: 0, max: 0.3, step: 0.01, value: S.xi, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.xi = v; } });
      ui.rate = kit.ui.slider({ label: "Heating rate", min: 0.5, max: 10, step: 0.5, value: S.rate, format: function (v) { return fmt(v, 1) + ' °C/min'; }, onInput: function (v) { ctx.goManual(); S.rate = v; } });
      ui.T = kit.ui.slider({ label: "Block temperature", min: 20, max: 190, step: 0.5, value: S.T, format: function (v) { return fmt(v, 1) + ' °C'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.T = v; } });
      c.appendChild(kit.ui.sliders([ui.xi, ui.rate, ui.T]));
      c.appendChild(kit.ui.options({ label: "Mixed melting point", cols: 2, value: S.mix, options: [{ v: 'none', label: "No mixture" }, { v: 'diff', label: "Mix with another compound" }], onChange: function (v) { ctx.goManual(); S.mix = v; } }));
      c.appendChild(ctx.btnRow([{ t: "▶ Heat", primary: true, fn: function () { ctx.goManual(); S.T = 25; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Solid–liquid diagram (T–x)", h: 250, note: "Orange: liquidus. Gray: solidus (eutectic). The dot marks your sample.", draw: function (cx, w, h, col) {
      var c = CM[S.cm], L = 42, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, Tlo = c.Tm - 45, Thi = c.Tm + 6, i, sx = function (x) { return L + pw * x / 0.4; }, sy = function (t) { return Tp + ph * (1 - (t - Tlo) / (Thi - Tlo)); };
      cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 10, 1), sx(i / 10), h - B + 14); cx.fillText("impurity mole fraction", L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var t = Tlo + (Thi - Tlo) * i / 4; cx.fillText(fmt(t, 0), L - 4, sy(t) + 3); }
      cx.lineWidth = 2; cx.strokeStyle = '#ff922b'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = 0.4 * i / 80, tt = ints(S.cm, x).clear; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x), sy(tt)); } cx.stroke();
      cx.strokeStyle = '#868e96'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x2 = 0.4 * i / 80, to = ints(S.cm, x2).onset; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x2), sy(to)); } cx.stroke(); cx.lineWidth = 1;
      var a = ints(S.cm, S.xi); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(sx(S.xi), sy(a.clear), 4, 0, 6.28); cx.fill(); cx.beginPath(); cx.arc(sx(S.xi), sy(a.onset), 4, 0, 6.28); cx.fill();
    } }],
    calc: function () { var c = CM[S.cm], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * S.xi, a = ints(S.cm, S.xi), row = function (a1, b) { return '<tr><th>' + a1 + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row("T<sub>m</sub> literature", fmt(c.Tm, 1) + ' °C') + row('ΔH<sub>fus</sub>', fmt(c.H / 1000, 1) + ' kJ/mol') + row('ΔT = R·T<sub>m</sub>²·x/ΔH', '8,314 × ' + fmt(Tm, 1) + '² × ' + fmt(S.xi, 2) + ' / ' + fmt(c.H, 0) + ' = <b>' + fmt(dT, 1) + ' K</b>') + row("Range", fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C') + "</table><p class=\"muted small\">Didactic model: ideal depression and simplified solidus.</p>"; },
    quiz: [
      { q: "A pure sample melts…", options: ["over a narrow range", "over a wide range", "at any T", "without change"], answer: 0, why: "Typical range 0.5–1 °C." },
      { q: "An impurity causes…", options: ["it lowers and broadens the range", "it raises the melting point", "nothing changes", "it only darkens"], answer: 0, why: "Melting point depression." },
      { q: "Recommended rate near the melting point:", options: ["1–2 °C/min", "20 °C/min", '10 °C/s', "no heating"], answer: 0, why: "To maintain thermal equilibrium." },
      { q: "In a mixed melting point, if the value does not change, then…", options: ["they are the same compound", "they are different", "it is impure", "there is an error"], answer: 0, why: "A mixture of different compounds melts lower." },
      { q: "The eutectic temperature is…", options: ["the minimum melting temperature of the mixture", "the maximum", "the boiling point", "room T"], answer: 0, why: "The solidus line." }
    ],
    help: { intro: "Choose the compound, add impurity and press “Heat” or drag the block temperature. The zoom shows the crystals in the capillary.", items: [["Tube", "capillary with sample."], ["Range", "onset – end of melting."]] }
  };
  MSim.create(def);
})();
