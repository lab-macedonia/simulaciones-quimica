/* Pilas galvánicas y ecuación de Nernst — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var F = 96485, Rg = 8.314, fmt = SimKit.fmt, f2 = function (x) { return fmt(x, 2); }, f3 = function (x) { return fmt(x, 3); };
  var MET = {
    Mg: { E: -2.37, n: 2, name: "magnesium", col: 0x8aff00, M: 24.31 }, Al: { E: -1.66, n: 3, name: "aluminium", col: 0xc9d1d9, M: 26.98 }, Zn: { E: -0.76, n: 2, name: 'zinc', col: 0x8f94c8, M: 65.38 },
    Fe: { E: -0.44, n: 2, name: "iron", col: 0xe06633, M: 55.85 }, Ni: { E: -0.26, n: 2, name: "nickel", col: 0x50d050, M: 58.69 }, Sn: { E: -0.14, n: 2, name: "tin", col: 0xbfc2c7, M: 118.71 },
    Pb: { E: -0.13, n: 2, name: "lead", col: 0x7a8392, M: 207.2 }, Cu: { E: 0.34, n: 2, name: "copper", col: 0xc88033, M: 63.55 }, Ag: { E: 0.80, n: 1, name: "silver", col: 0xdadada, M: 107.87 }
  };
  var ORDER = ['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'Cu', 'Ag'];
  var S = { a: 'Zn', c: 'Cu', Ca: 1, Cc: 1, x: 0, closed: false, T: 298 };
  function ion(m) { var n = MET[m].n; return m + (n > 1 ? n : '') + (n > 0 ? '⁺' : ''); }
  function sup(n) { return n === 1 ? '⁺' : (n === 2 ? '²⁺' : '³⁺'); }
  function ionf(m) { return m + sup(MET[m].n); }
  function lcm(a, b) { var x = a, y = b; while (y) { var t = y; y = x % y; x = t; } return a * b / x; }
  function nTot() { return lcm(MET[S.a].n, MET[S.c].n); }
  function E0() { return MET[S.c].E - MET[S.a].E; }
  function ca() { return S.Ca + nTot() / MET[S.a].n * S.x; }
  function cc() { return Math.max(1e-12, S.Cc - nTot() / MET[S.c].n * S.x); }
  function lnQ() { var n = nTot(); return (n / MET[S.a].n) * Math.log(ca()) - (n / MET[S.c].n) * Math.log(cc()); }
  function Q() { return Math.exp(lnQ()); }
  function E() { return E0() - Rg * S.T / (nTot() * F) * lnQ(); }
  function K() { return Math.exp(nTot() * F * E0() / (Rg * S.T)); }
  function dG0() { return -nTot() * F * E0() / 1000; }
  function xmax() { return Math.min(S.Cc * MET[S.c].n / nTot(), 1e9) * 0.999; }
  function xeq() { var lo = 0, hi = xmax(); if (E() <= 0) return 0; var snap = S.x; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; S.x = m; if (E() > 0) lo = m; else hi = m; } S.x = snap; return (lo + hi) / 2; }
  function setPair(a, c) { if (MET[a].E > MET[c].E) { var t = a; a = c; c = t; } S.a = a; S.c = c; S.x = 0; }

  var el = {}, lab = {}, ionsA, ionsC, ionsB, electrons = [], curves = {}, needle, dummy, anodeM, cathM, liqA, liqC;
  var pA = [], pC = [], pAn = [], pB = [];
  function stages() {
    var save = { a: S.a, c: S.c, Ca: S.Ca, Cc: S.Cc, x: S.x }, out = [];
    function st(p, fn) { S.a = p[0]; S.c = p[1]; S.Ca = p[2]; S.Cc = p[3]; S.x = p[4] || 0; out.push(fn()); }
    st(['Zn', 'Cu', 1, 1], function () { return ["Galvanic cell", "Cell", "A spontaneous redox reaction generates electric current",
      "<p>A <b>galvanic cell</b> separates oxidation and reduction into two <b>half-cells</b>. At the <b>anode</b> (−) the metal is <b>oxidized</b> and releases electrons; at the <b>cathode</b> (+) a metal ion is <b>reduced</b>. The electrons travel through the <b>external wire</b> from the anode to the cathode, and the <b>salt bridge</b> closes the circuit with ions.</p><p>Here: <b>Zn(s) | Zn²⁺(1 M) ‖ Cu²⁺(1 M) | Cu(s)</b> (Daniell cell).</p>"]; });
    st(['Zn', 'Cu', 1, 1], function () { return ["Potentials", 'E°', "E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub> = 1.10 V",
      "<p>Each half-reaction has a <b>standard reduction potential</b> E° (1 M, 25 °C, relative to the hydrogen electrode). The one with the higher E° is reduced (cathode). For Zn–Cu: <b>E°<sub>cell</sub> = +0.34 − (−0.76) = +1.10 V</b>. E° &gt; 0 ⇒ spontaneous reaction; E° does not depend on the coefficients (intensive property).</p>"]; });
    st(['Zn', 'Cu', 1, 1, 0.5], function () { return ["Closed circuit", "Current", "On closing the circuit: Zn dissolves and Cu is deposited",
      "<p>Anode: <b>Zn → Zn²⁺ + 2e⁻</b> (the plate gets thinner). Cathode: <b>Cu²⁺ + 2e⁻ → Cu</b> (the plate gets thicker). Electrons flow from Zn to Cu; in the salt bridge <b>cations migrate toward the cathode</b> and <b>anions toward the anode</b>, maintaining electrical neutrality. [Zn²⁺] increases and [Cu²⁺] decreases.</p>"]; });
    st(['Zn', 'Cu', 1, 0.01], function () { return ["Nernst equation", 'Nernst', "E = E° − (RT/nF)·ln Q: concentration changes the voltage",
      "<p>Outside standard conditions: <b>E = E° − (0.0592/n)·log Q</b> at 25 °C, with Q = [Zn²⁺]/[Cu²⁺]. If [Cu²⁺] drops from 1 to 0.01 M: Q = 100 and <b>E = 1.10 − 0.0296·2 = " + f2(1.10 - 0.02958 * 2) + " V</b>. Less reactant ⇒ less driving force.</p>"]; });
    st(['Sn', 'Pb', 0.1, 1.0], function () { return ["Equilibrium", "Equilibrium", "When Q = K the cell runs down: E = 0",
      "<p>On discharge, Q increases until it equals <b>K</b>; then <b>E = 0</b> and there is no more current: it is equilibrium. With a pair of small E° (Sn–Pb, E° = 0.01 V, K = 10<sup>nFE°/(2.303RT)</sup> = <b>" + fmt(Math.pow(10, 2 * 0.01 / 0.05916), 1) + "</b>) you can see E fall to zero as the reaction proceeds. Relation: <b>ΔG° = −nFE° = −RT ln K</b>.</p>"]; });
    st(['Zn', 'Ag', 1, 1], function () { return ["Other cells and ΔG", "ΔG° and series", "ΔG° = −nFE°: the higher the E°, the more spontaneous",
      "<p>With the potential series any cell can be predicted. Zn–Cu: E° = 1.10 V, n = 2 ⇒ <b>ΔG° = −2 × 96,485 × 1.10 = −212 kJ</b> and <b>K ≈ 10³⁷</b>. Zn–Ag: E° = 0.80 − (−0.76) = 1.56 V, ΔG° = −" + fmt(2 * F * 1.56 / 1000, 0) + " kJ. A metal displaces from their salts those of higher E° (Zn displaces Cu²⁺ and Ag⁺).</p>"]; });
    S.a = save.a; S.c = save.c; S.Ca = save.Ca; S.Cc = save.Cc; S.x = save.x; return out;
  }
  function curveFrom(T, pts) { return new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })); }

  var def = {
    key: 'pilas-galvanicas', title: "Galvanic Cells and the Nernst Equation", subtitle: "3D Simulator · general chemistry", accent: { dark: '#fcd34d', light: '#a16207' },
    stages: stages, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 8, 24], target: [0, 4.6, 0] }, { id: 'frontal', label: "Front", pos: [0, 6, 26], target: [0, 4.6, 0] }, { id: 'anodo', label: "Anode", pos: [-9, 5, 12], target: [-6, 3, 0] }, { id: 'catodo', label: "Cathode", pos: [9, 5, 12], target: [6, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 30, 4], target: [0, 3, 0] }],
    layers: [{ id: 'ions', label: "Ions", icon: '⊕' }, { id: 'elec', label: "Electrons", icon: 'e⁻' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; dummy = new T.Object3D();
      var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.14, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      var plate = new T.Mesh(new T.BoxGeometry(22, 0.3, 8), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; s.add(plate);
      [-5.5, 5.5].forEach(function (x, k) {
        var cup = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 4.6, 36, 1, true), gm); cup.position.set(x, 2.3, 0); s.add(cup);
        var lm = new T.MeshStandardMaterial({ color: 0xaad4ff, transparent: true, opacity: 0.42, roughness: 0.2 }), lq = new T.Mesh(new T.CylinderGeometry(2.35, 2.35, 3.3, 36), lm); lq.position.set(x, 1.85, 0); s.add(lq); if (k) liqC = lm; else liqA = lm;
        var em = new T.MeshStandardMaterial({ color: 0xccc, roughness: 0.35, metalness: 0.7 }), e = new T.Mesh(new T.BoxGeometry(1, 1, 1), em); s.add(e); if (k) { cathM = e; } else anodeM = e; e.position.set(x, 3, 0);
      });
      // puente salino
      var br = curveFrom(T, [[-4.2, 3.2, 0.5], [-3.6, 5.8, 0.5], [0, 6.7, 0.5], [3.6, 5.8, 0.5], [4.2, 3.2, 0.5]]);
      var bt = new T.Mesh(new T.TubeGeometry(br, 40, 0.34, 12, false), new T.MeshPhysicalMaterial({ color: 0xe6e0c8, transparent: true, opacity: 0.55, roughness: 0.3 })); s.add(bt); curves.bridge = br;
      // alambres y voltímetro
      var wl = curveFrom(T, [[-5.5, 5.2, -0.6], [-5.5, 8.6, -0.6], [-2.2, 9.2, -0.6], [-1.3, 9.2, -0.6]]), wr = curveFrom(T, [[1.3, 9.2, -0.6], [2.2, 9.2, -0.6], [5.5, 8.6, -0.6], [5.5, 5.2, -0.6]]);
      var wm = new T.MeshStandardMaterial({ color: 0xb87333, metalness: 0.6, roughness: 0.4 });
      s.add(new T.Mesh(new T.TubeGeometry(wl, 30, 0.07, 8, false), wm)); s.add(new T.Mesh(new T.TubeGeometry(wr, 30, 0.07, 8, false), wm)); curves.wl = wl; curves.wr = wr;
      var vm = new T.Mesh(new T.CylinderGeometry(1.5, 1.5, 0.7, 28), new T.MeshStandardMaterial({ color: 0x252b36, roughness: 0.5 })); vm.rotation.x = Math.PI / 2; vm.position.set(0, 9.2, -0.6); s.add(vm);
      var face = new T.Mesh(new T.CircleGeometry(1.35, 28), new T.MeshBasicMaterial({ color: 0xf5f2e6 })); face.position.set(0, 9.2, -0.24); s.add(face);
      needle = new T.Mesh(new T.BoxGeometry(0.06, 1.1, 0.04), new T.MeshBasicMaterial({ color: 0xcc2222 })); needle.geometry.translate(0, 0.55, 0); needle.position.set(0, 8.75, -0.2); s.add(needle);
      // iones y electrones
      var sg = new T.SphereGeometry(1, 10, 8);
      ionsA = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xffffff }), 60); ionsC = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xffffff }), 60); ionsB = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xffffff }), 40);
      [ionsA, ionsC, ionsB].forEach(function (m) { m.frustumCulled = false; s.add(m); });
      function rp() { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 1.9; return { x: Math.cos(a) * r, y: 0.5 + Math.random() * 2.8, z: Math.sin(a) * r, vx: Math.random() - .5, vy: Math.random() - .5, vz: Math.random() - .5 }; }
      for (var i = 0; i < 60; i++) { pA.push(rp()); pC.push(rp()); } for (i = 0; i < 40; i++) pB.push({ u: Math.random(), k: i % 2 });
      var em2 = new T.MeshBasicMaterial({ color: 0xffe14a }); for (i = 0; i < 16; i++) { var e = new T.Mesh(sg, em2); e.scale.setScalar(0.16); s.add(e); electrons.push({ m: e, u: i / 16 }); }
      lab.E = ctx.label('', 'bl-lead'); lab.a = ctx.label('', 'bl-warn'); lab.c = ctx.label('', 'bl-d'); lab.ra = ctx.label('', 'bl-d'); lab.rc = ctx.label('', 'bl-d'); lab.br = ctx.label("Salt bridge", 'bl-d'); lab.ea = ctx.label("Anode (−) · oxidation", 'bl-warn'); lab.ec = ctx.label("Cathode (+) · reduction", 'bl-lead'); lab.ef = ctx.label('e⁻', 'bl-d');
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, u = ctx.ease(f.local), P = [['Zn', 'Cu', 1, 1], ['Zn', 'Cu', 1, 1], ['Zn', 'Cu', 1, 1], ['Zn', 'Cu', 1, 1], ['Sn', 'Pb', 0.1, 1], ['Zn', 'Ag', 1, 1]][i];
        if (S._st !== i) { S._st = i; setPair(P[0], P[1]); S.Ca = P[2]; S.Cc = P[3]; S.x = 0; S.run = 0; }
        S.closed = i >= 2 && i !== 3 && i !== 5 ? true : (i === 5);
        if (i === 2) { S.x = 0.5 * u; } if (i === 3) { S.Cc = Math.max(0.01, 1 - 0.99 * u); S.closed = false; } if (i === 4) { S.x = xeq() * 0.97 * u; S.closed = true; }
        if (i === 5) { S.x = 0; S.closed = false; var k = Math.min(2, Math.floor(f.local * 3)); var pairs = [['Zn', 'Ag'], ['Cu', 'Ag'], ['Mg', 'Cu']]; if (S._p !== k) { S._p = k; setPair(pairs[k][0], pairs[k][1]); } }
      } else if (S.closed) { var e0 = E(); if (e0 > 0.0005) { S.x = Math.min(xmax(), S.x + 0.05 * dt * Math.max(0.05, e0)); } }
      var e = E(), A = MET[S.a], C = MET[S.c], on = S.closed && e > 0.002;
      var T = ctx.T;
      anodeM.material.color.setHex(A.col); cathM.material.color.setHex(C.col);
      var xa = clamp(S.x / Math.max(1e-6, Math.max(S.Ca, 1) * 0.6), 0, 1), aw = Math.max(0.12, 0.9 - 0.7 * Math.min(1, S.x * 1.1)), cw = 0.45 + 0.7 * Math.min(1, S.x * 1.1);
      anodeM.scale.set(aw, 3.6, 1.8); anodeM.position.set(-5.5, 3.0, 0); cathM.scale.set(cw, 3.6, 1.8); cathM.position.set(5.5, 3.0, 0);
      liqC.color.setHex(S.c === 'Cu' ? 0x3b9bff : (S.c === 'Ag' ? 0xd7e6f0 : (S.c === 'Ni' ? 0x7fe07f : 0xcfe6ff))); liqC.opacity = 0.25 + 0.3 * Math.min(1, cc() / 1.2);
      liqA.color.setHex(S.a === 'Cu' ? 0x3b9bff : (S.a === 'Ni' ? 0x7fe07f : 0xcfe6ff)); liqA.opacity = 0.25 + 0.2 * Math.min(1, ca() / 1.2);
      // iones
      var showI = ctx.layer('ions'), na = Math.round(Math.min(60, ca() * 24)), ncn = Math.round(Math.min(60, cc() * 24));
      function inst(im, arr, n, x0, col, r) { im.material.color.setHex(col); im.count = showI ? n : 0; for (var q = 0; q < n; q++) { var p = arr[q]; p.x += p.vx * dt * 0.8; p.y += p.vy * dt * 0.8; p.z += p.vz * dt * 0.8; if (p.x * p.x + p.z * p.z > 3.6) { p.vx *= -1; p.vz *= -1; p.x *= 0.95; p.z *= 0.95; } if (p.y < 0.5) { p.y = 0.5; p.vy = Math.abs(p.vy); } if (p.y > 3.4) { p.y = 3.4; p.vy = -Math.abs(p.vy); } dummy.position.set(x0 + p.x, p.y, p.z); dummy.scale.setScalar(r); dummy.updateMatrix(); im.setMatrixAt(q, dummy.matrix); } im.instanceMatrix.needsUpdate = true; }
      inst(ionsA, pA, na, -5.5, A.col, 0.2); inst(ionsC, pC, ncn, 5.5, C.col === 0xdadada ? 0xffffff : C.col, 0.2);
      // iones del puente
      ionsB.count = on && showI ? 40 : 0; if (on) for (var q = 0; q < 40; q++) { var b = pB[q]; b.u = (b.u + dt * 0.12 * (b.k ? 1 : -1) + 1) % 1; var pt = curves.bridge.getPoint(b.u); dummy.position.copy(pt); dummy.position.y -= 0.05; dummy.scale.setScalar(0.12); dummy.updateMatrix(); ionsB.setMatrixAt(q, dummy.matrix); } ionsB.instanceMatrix.needsUpdate = true; ionsB.material.color.setHex(0xe3b341);
      // electrones
      var spd = on ? 0.15 + 0.25 * Math.min(1, e) : 0, showE = ctx.layer('elec');
      electrons.forEach(function (el) { el.u = (el.u + spd * dt) % 1; var pt = el.u < 0.5 ? curves.wl.getPoint(el.u * 2) : curves.wr.getPoint((el.u - 0.5) * 2); el.m.position.copy(pt); el.m.visible = on && showE; });
      needle.rotation.z = -clamp(e / 2.2, -0.2, 1) * 1.9 + 0.95;
      var showL = true; lab.E.pos(0, 10.8, -0.6).set('E = ' + f2(e) + ' V' + (S.closed ? '' : " (open circuit)"), 'bl-lead').vis(true);
      lab.a.pos(-5.5, 5.4, 0).set(A.name + ' · [' + ionf(S.a) + '] = ' + f3(ca()) + ' M', 'bl-d').vis(true); lab.c.pos(5.5, 5.4, 0).set(C.name + ' · [' + ionf(S.c) + '] = ' + f3(cc()) + ' M', 'bl-d').vis(true);
      lab.ra.pos(-5.5, -0.9, 0).set(S.a + ' → ' + ionf(S.a) + ' + ' + MET[S.a].n + ' e⁻', 'bl-warn').vis(true); lab.rc.pos(5.5, -0.9, 0).set(ionf(S.c) + ' + ' + MET[S.c].n + ' e⁻ → ' + S.c, 'bl-lead').vis(true);
      lab.br.pos(0, 7.3, 0.5).vis(true); lab.ea.pos(-5.5, 6.6, 0).vis(false); lab.ec.pos(5.5, 6.6, 0).vis(false); lab.ef.pos(-3, 8.3, -0.6).vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual) return; u.aOpts && u.aOpts.set(S.a); u.cOpts && u.cOpts.set(S.c); u.sCa && u.sCa.set(Math.log10(S.Ca)); u.sCc && u.sCc.set(Math.log10(S.Cc)); },
    hud: function () { return { eq: { chip: "Cell", name: S.a + '(s) | ' + ionf(S.a) + ' ‖ ' + ionf(S.c) + ' | ' + S.c + '(s)', body: "<div class=\"eqline\"><small>E° cell</small>" + f2(E0()) + ' V</div><div class="eqline"><small>E (Nernst)</small>' + f2(E()) + ' V</div><div class="eqline"><small>Q · K</small>' + MSim.sci(Q(), 2) + ' · ' + MSim.sci(K(), 2) + '</div><div class="eqline"><small>ΔG°</small>' + fmt(dG0(), 1) + ' kJ</div>' }, legend: [{ label: S.a, color: '#' + ('000000' + MET[S.a].col.toString(16)).slice(-6), text: "anode (oxidation)" }, { label: S.c, color: '#' + ('000000' + MET[S.c].col.toString(16)).slice(-6), text: "cathode (reduction)" }, { label: 'e⁻', color: '#ffe14a', text: "electrons in the wire" }, { label: "Bridge", color: '#e3b341', text: "salt bridge ions" }] }; },
    measures: function () { return [["Anode (−)", S.a + ' → ' + ionf(S.a)], ["Cathode (+)", ionf(S.c) + ' → ' + S.c], ["E° cell", f2(E0()) + ' V'], ["n (e⁻ transferred)", String(nTot())], ['[' + ionf(S.a) + ']', f3(ca()) + ' M'], ['[' + ionf(S.c) + ']', f3(cc()) + ' M'], ['Q', MSim.sci(Q(), 2)], ['E (Nernst)', f2(E()) + ' V'], ['K', MSim.sci(K(), 2)], ['ΔG° = −nFE°', fmt(dG0(), 1) + ' kJ/mol'], ["Circuit", S.closed ? "closed" : "open"]]; },
    ideas: ["<b>Anode</b> (−): oxidation · <b>Cathode</b> (+): reduction · electrons go from the anode to the cathode.", "<b>E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub></b>; E° &gt; 0 ⇒ spontaneous.", "<b>Nernst</b>: E = E° − (RT/nF) ln Q; at 25 °C, E = E° − (0.0592/n) log Q.", "<b>ΔG° = −nFE° = −RT ln K</b>; at equilibrium E = 0 and Q = K.", "The <b>salt bridge</b> maintains neutrality and closes the circuit."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Control panel"); el.appendChild(c);
      var opts = ORDER.map(function (k) { return { v: k, label: k, sub: MET[k].E + ' V' }; });
      ui.aOpts = kit.ui.options({ label: "Half-cell 1 (E° in V)", cols: 5, value: S.a, options: opts, onChange: function (v) { ctx.goManual(); if (v === S.c) return; setPair(v, S.c); ui.aOpts.set(S.a); ui.cOpts.set(S.c); } });
      ui.cOpts = kit.ui.options({ label: "Half-cell 2", cols: 5, value: S.c, options: opts, onChange: function (v) { ctx.goManual(); if (v === S.a) return; setPair(S.a, v); ui.aOpts.set(S.a); ui.cOpts.set(S.c); } });
      c.appendChild(ui.aOpts); c.appendChild(ui.cOpts);
      ui.sCa = kit.ui.slider({ label: "log[M⁺] anode", min: -3, max: 0.3, step: 0.05, value: 0, format: function (v) { return fmt(Math.pow(10, v), 3) + ' M'; }, onInput: function (v) { ctx.goManual(); S.Ca = Math.pow(10, v); S.x = 0; } });
      ui.sCc = kit.ui.slider({ label: "log[M⁺] cathode", min: -3, max: 0.3, step: 0.05, value: 0, format: function (v) { return fmt(Math.pow(10, v), 3) + ' M'; }, onInput: function (v) { ctx.goManual(); S.Cc = Math.pow(10, v); S.x = 0; } });
      ui.sT = kit.ui.slider({ label: 'T', min: 273, max: 348, step: 1, value: S.T, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = v; } });
      c.appendChild(kit.ui.sliders([ui.sCa, ui.sCc, ui.sT]));
      c.appendChild(ctx.btnRow([{ t: "Close / open circuit", primary: true, fn: function () { ctx.goManual(); S.closed = !S.closed; kit.toast(S.closed ? "Closed circuit: the cell discharges" : "Open circuit"); } }, { t: "Reset concentrations", fn: function () { ctx.goManual(); S.Ca = 1; S.Cc = 1; S.x = 0; ui.sCa.set(0); ui.sCc.set(0); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Standard reduction potentials at 25 °C (V). With the circuit closed the progress of the reaction is simulated accelerated. The initial concentrations of each half-cell are those of the controls; the anode is always the metal with the lower E°.</p>");
    },
    graphs: [
      { title: "Standard potential series", h: 250, note: "Bars: reduction E°. Current anode and cathode highlighted; E°<sub>cell</sub> is the difference between both.", draw: function (cx, w, h, c) {
        var L = 8, Rr = 10, Tp = 10, B = 18, rows = ORDER.length, ph = (h - Tp - B) / rows, mid = w * 0.3, sc = (w * 0.55) / 3.4;
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(mid, Tp); cx.lineTo(mid, h - B); cx.stroke();
        ORDER.forEach(function (k, i) { var v = MET[k].E, y = Tp + i * ph + 2, sel = k === S.a || k === S.c; cx.globalAlpha = sel ? 1 : 0.45; cx.fillStyle = k === S.a ? '#ff7a5c' : (k === S.c ? '#5cb3ff' : '#9aa7b4'); cx.fillRect(Math.min(mid, mid + v * sc), y, Math.abs(v * sc), ph - 4); cx.globalAlpha = 1; cx.fillStyle = c.ink; cx.textAlign = v < 0 ? 'left' : 'right'; cx.fillText(ionf(k) + '/' + k + ' (' + v + ')', v < 0 ? mid + 6 : mid - 6, y + ph / 2 + 3); });
        cx.textAlign = 'center'; cx.fillStyle = c.muted; cx.fillText('E° (V)', w / 2, h - 3); } },
      { title: "E versus reaction progress", h: 210, note: "As the cell discharges Q grows and E decreases; when Q = K, E = 0. The dot marks the current state.", draw: function (cx, w, h, c) {
        var L = 44, Rr = 10, Tp = 14, B = 28, pw = w - L - Rr, ph = h - Tp - B, xm = Math.max(1e-6, xmax()), snap = S.x, pts = [], i, hi = 0, lo = 0;
        for (i = 0; i <= 80; i++) { S.x = xm * i / 80 * 0.9995; var ev = E(); pts.push([S.x, ev]); } S.x = snap;
        pts.forEach(function (p) { hi = Math.max(hi, p[1]); lo = Math.min(lo, p[1]); }); hi = Math.max(hi, E()) * 1.1; if (hi < 0.05) hi = 0.05; lo = Math.min(lo, 0) - 0.02;
        var sx = function (x) { return L + pw * x / xm; }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(lo + (hi - lo) * i / 4, 2), L - 5, y + 3); }
        cx.textAlign = 'center'; cx.fillText("progress x (mol/L) · y axis: E (V)", L + pw / 2, h - 3); cx.strokeStyle = c.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, sy(0)); cx.lineTo(L + pw, sy(0)); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#d69e2e'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (p, k) { if (k === 0) cx.moveTo(sx(p[0]), sy(p[1])); else cx.lineTo(sx(p[0]), sy(p[1])); }); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(Math.min(S.x, xm)), sy(E()), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
      { title: "Nernst: E versus log Q", h: 190, note: "Line of slope −RT·2.303/(nF) = −0.0592/n V (at 25 °C). Intercept: E°.", draw: function (cx, w, h, c) {
        var L = 44, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, n = nTot(), lq = [-6, 6], e0 = E0(), sl = Rg * S.T * Math.LN10 / (n * F);
        var vals = [e0 - sl * lq[0] * -1, e0 - sl * lq[1]], lo = Math.min(vals[0], vals[1], e0) - 0.05, hi = Math.max(vals[0], vals[1], e0) + 0.05;
        var sx = function (q) { return L + pw * (q - lq[0]) / (lq[1] - lq[0]); }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(lo + (hi - lo) * i / 4, 2), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q = -6; q <= 6; q += 3) cx.fillText(q, sx(q), h - B + 12); cx.fillText('log Q', L + pw / 2, h - 3);
        cx.strokeStyle = '#d69e2e'; cx.lineWidth = 2.6; cx.beginPath(); cx.moveTo(sx(lq[0]), sy(e0 - sl * lq[0])); cx.lineTo(sx(lq[1]), sy(e0 - sl * lq[1])); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; var lg = clamp(lnQ() / Math.LN10, -6, 6); cx.beginPath(); cx.arc(sx(lg), sy(E()), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, n = nTot(), A = MET[S.a], C = MET[S.c], na = n / A.n, nc = n / C.n;
      var qexp = ionf(S.a) + (na > 1 ? '^' + na : '') + ' / ' + ionf(S.c) + (nc > 1 ? '^' + nc : '');
      return '<div class="card-kicker">' + S.a + ' | ' + ionf(S.a) + ' ‖ ' + ionf(S.c) + ' | ' + S.c + "</div><div class=\"calc-step\">1 · Overall reaction (n = " + n + ' e⁻)</div><table class="calc-table">' + row("Anode ×" + na, S.a + ' → ' + ionf(S.a) + ' + ' + A.n + ' e⁻ (E° = ' + A.E + ' V)') + row("Cathode ×" + nc, ionf(S.c) + ' + ' + C.n + ' e⁻ → ' + S.c + ' (E° = ' + C.E + ' V)') + row("E°cell", C.E + ' − (' + A.E + ') = <b>' + f2(E0()) + ' V</b>') + '</table>' +
        "<div class=\"calc-step\">2 · Nernst at " + S.T + ' K</div><table class="calc-table">' + row('Q', '[' + qexp.replace(' / ', '] / [').replace(/\^/g, ']^') + '</b>'.replace('</b>', '') + ' = ' + MSim.sci(Q(), 3)) + row('(RT/nF)', fmt(Rg * S.T / (n * F), 5) + ' V') + row('E = E° − (RT/nF) ln Q', f2(E0()) + ' − ' + fmt(Rg * S.T / (n * F), 5) + ' × ' + fmt(lnQ(), 3) + ' = <b>' + f2(E()) + ' V</b>') + '</table>' +
        "<div class=\"calc-step\">3 · Thermodynamics</div><table class=\"calc-table\">" + row('ΔG° = −nFE°', '−' + n + ' × 96 485 × ' + f2(E0()) + ' = <b>' + fmt(dG0(), 1) + ' kJ/mol</b>') + row('K = e^(nFE°/RT)', '<b>' + MSim.sci(K(), 2) + '</b>') + row('ΔG = −nFE', fmt(-n * F * E() / 1000, 1) + ' kJ/mol') + '</table>' +
        "<div class=\"calc-step\">4 · Mass transferred (progress x = " + f3(S.x) + ' mol/L, 100 mL)</div><table class="calc-table">' + row("Dissolves " + S.a, fmt(na * S.x * 0.1 * A.M, 3) + ' g') + row("Is deposited " + S.c, fmt(nc * S.x * 0.1 * C.M, 3) + ' g') + row("Charge", fmt(n * S.x * 0.1 * F, 0) + ' C') + '</table>';
    },
    quiz: [
      { q: "In the Zn | Zn²⁺ ‖ Cu²⁺ | Cu cell, what happens at the anode?", options: ["Zn is oxidized: Zn → Zn²⁺ + 2e⁻", "Cu²⁺ is reduced", "Zn²⁺ is reduced", "Cu is oxidized"], answer: 0, why: "The anode is always the site of oxidation; zinc (lower E°) gives up electrons." },
      { q: "E° (Zn²⁺/Zn) = −0.76 V and E° (Cu²⁺/Cu) = +0.34 V. What is E°<sub>cell</sub>?", options: ['+1,10 V', '−1,10 V', '+0,42 V', '−0,42 V'], answer: 0, why: "E°cell = E°cathode − E°anode = 0.34 − (−0.76) = +1.10 V (spontaneous)." },
      { q: "For a Cu | Cu²⁺ ‖ Ag⁺ | Ag cell (E°(Ag⁺/Ag) = +0.80 V), E°<sub>cell</sub> is…", options: ['+0,46 V', '+1,14 V', '+0,34 V', '−0,46 V'], answer: 0, why: "0.80 − 0.34 = +0.46 V; silver is reduced and copper is oxidized." },
      { q: "Daniell cell with [Zn²⁺] = 1.0 M and [Cu²⁺] = 0.010 M at 25 °C. According to Nernst, E is…", options: ['1,04 V', '1,16 V', '1,10 V', '0,98 V'], answer: 0, why: "Q = 1/0.010 = 100; E = 1.10 − (0.0592/2)·log 100 = 1.10 − 0.0592 = 1.04 V." },
      { q: "What is ΔG° of the Zn–Cu cell (n = 2, E° = 1.10 V; F = 96,485 C/mol)?", options: ['−212 kJ', '+212 kJ', '−106 kJ', "−2.2 kJ"], answer: 0, why: "ΔG° = −nFE° = −2 × 96,485 × 1.10 = −212 kJ/mol." },
      { q: "In which direction do the electrons flow in the external circuit?", options: ["From the anode to the cathode", "From the cathode to the anode", "Through the salt bridge", "They do not flow"], answer: 0, why: "The electrons released in the oxidation (anode) travel through the wire to the cathode, where they are consumed." },
      { q: "What is the salt bridge for?", options: ["It maintains charge neutrality and closes the circuit", "It supplies electrons", "It increases the cell voltage", "It prevents the anode from dissolving"], answer: 0, why: "It allows ions to flow between half-cells and prevents the buildup of charge that would stop the reaction." },
      { q: "When a cell runs down and reaches equilibrium, what are E and Q?", options: ['E = 0 y Q = K', 'E = E° y Q = 1', 'E = 0 y Q = 1', 'E > 0 y Q = K'], answer: 0, why: "At equilibrium ΔG = 0, so E = 0 and the reaction quotient equals the constant: Q = K." }
    ],
    help: { intro: "Choose the two half-cells and the concentrations in “Lab”; close the circuit to discharge the cell. You can also follow the lesson.", items: [["Voltmeter", "the needle shows E (Nernst) with the current concentrations."], ["Electrodes", "the anode thins and the cathode thickens as it discharges."], ["Graphs", "potential series, E versus progress and Nernst line."], ["Calculation", "overall reaction, Q, E, ΔG°, K and masses transferred."]] }
  };
  MSim.create(def);
})();
