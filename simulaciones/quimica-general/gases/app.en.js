/* Gases ideales y reales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var R = 0.08206, Rj = 8.314;
  MSim.EL.He = [0xd9ffff, 0.55];
  var G = {
    He: { f: 'He', M: 4.003, a: 0.0346, b: 0.0238, geo: { a: [['He', 0, 0, 0]], b: [] } },
    H2: { f: 'H₂', M: 2.016, a: 0.244, b: 0.0266, geo: { a: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]], b: [[0, 1]] } },
    N2: { f: 'N₂', M: 28.01, a: 1.370, b: 0.0387, geo: { a: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]], b: [[0, 1]] } },
    O2: { f: 'O₂', M: 32.00, a: 1.382, b: 0.0319, geo: { a: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], b: [[0, 1]] } },
    CH4: { f: 'CH₄', M: 16.04, a: 2.303, b: 0.0431, geo: { a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', -0.63, -0.63, 0.63], ['H', -0.63, 0.63, -0.63], ['H', 0.63, -0.63, -0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] } },
    CO2: { f: 'CO₂', M: 44.01, a: 3.658, b: 0.0429, geo: { a: [['O', -1.16, 0, 0], ['C', 0, 0, 0], ['O', 1.16, 0, 0]], b: [[0, 1, 2], [1, 2, 2]] } }
  };
  var S = { gas: 'N2', n: 1, T: 300, V: 10, isoP: 0, sp: 1 };       // isoP>0: presión fija (atm), V se calcula
  var W = 3.5, hA = 5, pools = [], box, tint, piston, rod, lab = {}, SC = 20;
  function g() { return G[S.gas]; }
  function Pid(n, T, V) { return n * R * T / V; }
  function Pre(n, T, V) { var b = g().b, a = g().a, Ve = V - n * b; if (Ve <= 0.001) return Infinity; return n * R * T / Ve - a * n * n / (V * V); }
  function vrms() { return Math.sqrt(3 * Rj * S.T / (g().M / 1000)); }
  function vmp() { return Math.sqrt(2 * Rj * S.T / (g().M / 1000)); }
  var fmt = SimKit.fmt;
  function fp(x) { return isFinite(x) ? fmt(x, x < 10 ? 2 : (x < 100 ? 1 : 0)) : '∞'; }

  function hOf(V) { return 0.5 * V; }
  function syncCounts(ctx) {
    var want = Math.min(80, Math.round(S.n * SC));
    while (pools.length < want) { var m = ctx.mol(g().geo, { gs: 0.5, ar: 0.42 }); m.position.set((Math.random() * 2 - 1) * (W - 0.8), 0.5 + Math.random() * Math.max(0.3, hA - 1), (Math.random() * 2 - 1) * (W - 0.8)); ctx.scene.add(m); pools.push({ g: m, v: new ctx.T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), ph: Math.random() * 6 }); }
    while (pools.length > want) { var p = pools.splice(Math.floor(Math.random() * pools.length), 1)[0]; ctx.scene.remove(p.g); }
  }
  function rebuildGas(ctx) { pools.forEach(function (p) { ctx.scene.remove(p.g); }); pools = []; }

  var stagesTxt = function (ctx) {
    var gg = g(), n = 1, P0 = Pid(1, 300, 10);
    return [
      ["State variables", 'Variables', "P, V, T and n describe a gas: PV = nRT",
        "<p>An ideal gas is described by its <b>pressure</b> (collisions with the walls), <b>volume</b>, <b>temperature</b> (mean kinetic energy) and <b>amount of substance</b>. Their relation is <b>PV = nRT</b> with R = 0.08206 atm·L/(mol·K).</p><p>Example: 1.00 mol of N₂ at 300 K in 10.0 L → P = <b>" + fmt(P0, 2) + ' atm</b>.</p>'],
      ["Boyle's law", 'Boyle', "T and n constant: on compression, P × V = constant",
        "<p>The volume is reduced from 10.0 L to 2.5 L at <b>300 K</b>. The molecules hit the walls more often and the pressure increases in the same proportion: P × V = nRT = <b>" + fmt(R * 300, 2) + " atm·L</b>.</p><p>A quarter of the volume → <b>four times</b> the pressure (" + fmt(P0, 2) + ' → ' + fmt(P0 * 4, 2) + ' atm).</p>'],
      ["Gay-Lussac's law", 'Gay-Lussac', "V and n constant: P is proportional to T",
        "<p>With the piston fixed (V = 5.0 L) the gas is heated from 200 K to 500 K. The molecules move faster, collide more frequently and with more force: <b>P / T = nR / V</b> is constant.</p>"],
      ["Charles's law", 'Charles', "P and n constant: V is proportional to T",
        "<p>With the piston free under a constant <b>1.00 atm</b> (0.30 mol), on heating from 200 K to 500 K the gas <b>expands</b>: V = nRT / P goes from " + fmt(0.3 * R * 200, 1) + ' L a ' + fmt(0.3 * R * 500, 1) + " L. <b>V / T = nR / P</b> is constant.</p>"],
      ["Molecular speeds", 'Maxwell', "Molecules do not all have the same speed: Maxwell–Boltzmann distribution",
        "<p>At a given temperature there are slow and fast molecules. The <b>root-mean-square</b> speed is <b>v<sub>rms</sub> = √(3RT/M)</b>: for N₂ at 300 K it is <b>" + fmt(Math.sqrt(3 * Rj * 300 / 0.02801), 0) + " m/s</b>. As T rises the curve broadens and shifts; at equal T the light gases (H₂, He) are faster.</p><p>The mean kinetic energy per mole, <b>3/2 RT</b>, depends only on T.</p>"],
      ["Real gases", "Real", "At high pressure and low T the real gas departs from the ideal",
        "<p>The ideal model ignores the volume of the molecules and their attractions. The <b>van der Waals equation</b>, <b>(P + a n²/V²)(V − nb) = nRT</b>, includes them. With CO₂ at 250 K and decreasing volume the real pressure falls <b>below</b> the ideal (attractions dominate, <b>Z &lt; 1</b>) and, at very small volumes, above it (the molecules' own volumes dominate, Z &gt; 1).</p>"]
    ];
  };

  var def = {
    key: 'gases', title: "Ideal and real gases", subtitle: "3D Simulator · general chemistry", accent: { dark: '#9ae6b4', light: '#2f855a' },
    stages: stagesTxt, dur: 12,
    views: [{ id: 'libre', label: "Free", pos: [0, 6, 22], target: [0, 3.2, 0] }, { id: 'frontal', label: "Front", pos: [0, 4, 24], target: [0, 3, 0] }, { id: 'lado', label: "Side", pos: [24, 6, 3], target: [0, 3, 0] }, { id: 'superior', label: "Top", pos: [0, 28, 3], target: [0, 2, 0] }],
    layers: [{ id: 'real', label: "Show real gas (van der Waals)", icon: '≈', on: false }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene;
      var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.13, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      box = new T.Mesh(new T.BoxGeometry(2 * W + 0.3, 1, 2 * W + 0.3), gm); s.add(box);
      piston = new T.Mesh(new T.BoxGeometry(2 * W + 0.5, 0.3, 2 * W + 0.5), new T.MeshStandardMaterial({ color: 0x59667a, roughness: 0.6 })); s.add(piston);
      rod = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 8, 12), new T.MeshStandardMaterial({ color: 0x8a97a8 })); s.add(rod);
      var plate = new T.Mesh(new T.BoxGeometry(2 * W + 1.4, 0.3, 2 * W + 1.4), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; s.add(plate);
      var hm = new T.MeshBasicMaterial({ color: 0xff6030, transparent: true, opacity: 0 }); tint = new T.Mesh(new T.BoxGeometry(2 * W + 1.2, 0.12, 2 * W + 1.2), hm); tint.position.y = -0.34; s.add(tint);
      lab.P = ctx.label('', 'bl-lead'); lab.Pr = ctx.label('', 'bl-warn'); lab.T = ctx.label('', 'bl-warn'); lab.V = ctx.label('', 'bl-d');
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, u = ctx.ease(f.local), x;
        S.gas = i === 5 ? 'CO2' : 'N2'; S.isoP = 0;
        if (i === 0) { S.n = 1; S.T = 300; S.V = 10; }
        if (i === 1) { S.n = 1; S.T = 300; S.V = 10 - 7.5 * u; }
        if (i === 2) { S.n = 1; S.V = 5; S.T = 200 + 300 * u; }
        if (i === 3) { S.n = 0.3; S.isoP = 1; S.T = 200 + 300 * u; }
        if (i === 4) { S.n = 1; S.V = 8; S.T = 200 + 400 * u; }
        if (i === 5) { S.n = 1; S.T = 250; S.V = 12 - 10.2 * u; }
        ctx.layerReal = i === 5;
      }
      if (S.isoP > 0) S.V = clamp(S.n * R * S.T / S.isoP, 1.5, 13);
      if (pools.gas !== S.gas) { rebuildGas(ctx); pools.gas = S.gas; }
      syncCounts(ctx);
      var h0 = hOf(S.V); hA += (h0 - hA) * Math.min(1, dt * 5); var h = hA;
      box.scale.y = h; box.position.y = h / 2; piston.position.y = h + 0.15; rod.position.y = h + 4;
      tint.material.opacity = clamp((S.T - 100) / 600, 0, 1) * 0.9; tint.material.color.setHSL(0.04 + 0.03 * (1 - (S.T - 100) / 600), 1, 0.5);
      var sp = S.sp * Math.min(2.4, 0.3 * Math.sqrt(S.T / g().M) * (S.gas === 'He' || S.gas === 'H2' ? 0.6 : 1.0)), Rr = W - 0.3, top = h - 0.3;
      pools.forEach(function (m) {
        var p = m.g.position, v = m.v; p.x += v.x * sp * dt; p.y += v.y * sp * dt; p.z += v.z * sp * dt;
        if (p.x < -Rr) { p.x = -Rr; v.x = Math.abs(v.x); } if (p.x > Rr) { p.x = Rr; v.x = -Math.abs(v.x); }
        if (p.z < -Rr) { p.z = -Rr; v.z = Math.abs(v.z); } if (p.z > Rr) { p.z = Rr; v.z = -Math.abs(v.z); }
        if (p.y < 0.35) { p.y = 0.35; v.y = Math.abs(v.y); } if (p.y > top) { p.y = top; v.y = -Math.abs(v.y); }
        m.g.rotation.x += dt * 0.6; m.g.rotation.y += dt * 0.5;
      });
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), showR = ctx.layer('real') || ctx.layerReal;
      lab.P.pos(0, h + 1.9, 0).set(showR ? "Ideal P = " + fp(pi) + ' atm' : 'P = ' + fp(pi) + ' atm').vis(true);
      lab.Pr.pos(0, h + 3.3, 0).set("Real P (vdW) = " + fp(pr) + ' atm').vis(showR);
      lab.T.pos(W + 2.6, 1.0, 0).set(fmt(S.T, 0) + ' K').vis(true);
      lab.V.pos(-W - 2.8, h / 2, 0).set('V = ' + fmt(S.V, 1) + ' L · n = ' + fmt(S.n, 2) + ' mol').vis(true);
    },
    sync: function (ctx) { if (ctx.ui.sT && !ctx.P.manual) { ctx.ui.sT.set(S.T); ctx.ui.sV.set(S.V); ctx.ui.sN.set(S.n); } },
    hud: function (ctx) {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), gg = g();
      return { eq: { chip: 'Gas', name: 'PV = nRT', body: '<div class="eqline"><small>Gas</small>' + gg.f + ' (M = ' + fmt(gg.M, 2) + " g/mol)</div><div class=\"eqline\"><small>Ideal P</small>" + fp(pi) + ' atm = ' + fmt(pi * 101.325, 0) + " kPa</div><div class=\"eqline\"><small>Real P (van der Waals)</small>" + fp(pr) + " atm</div><small>R = 0.08206 atm·L/(mol·K) = 8.314 J/(mol·K)</small>" },
        legend: [{ label: gg.f, color: '#9ae6b4', text: "gas molecule (sphere = atom)" }, { label: "Bottom plate", color: '#ff6030', text: "more intense at higher T" }] };
    },
    measures: function () {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V);
      return [['Gas', g().f], ['n', fmt(S.n, 2) + ' mol'], ['T', fmt(S.T, 0) + ' K (' + fmt(S.T - 273.15, 0) + ' °C)'], ['V', fmt(S.V, 2) + ' L'], ['P (ideal)', fp(pi) + ' atm'], ['P (van der Waals)', fp(pr) + ' atm'], ['Z = PV/nRT (real)', fmt(pr * S.V / (S.n * R * S.T), 3)], ['v<sub>rms</sub>', fmt(vrms(), 0) + ' m/s'], ["most probable v", fmt(vmp(), 0) + ' m/s'], ["mean E<sub>k</sub> (per mole)", fmt(1.5 * Rj * S.T / 1000, 2) + ' kJ/mol']];
    },
    ideas: ["<b>PV = nRT</b>: pressure, volume, temperature and amount of gas are linked.", "<b>Boyle</b> (T, n const): P·V = const · <b>Charles</b> (P, n const): V/T = const · <b>Gay-Lussac</b> (V, n const): P/T = const.", "<b>Temperature</b> measures the mean kinetic energy: E<sub>k</sub> = 3/2 kT per molecule.", "At equal T, light molecules are faster: v<sub>rms</sub> = √(3RT/M).", "Real gases deviate from the ideal at <b>high P and low T</b> (van der Waals)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Control panel"); el.appendChild(c);
      ui.gasOpts = kit.ui.options({ label: 'Gas', cols: 3, value: S.gas, options: Object.keys(G).map(function (k) { return { v: k, label: G[k].f, sub: fmt(G[k].M, 1) + ' g/mol' }; }), onChange: function (v) { ctx.goManual(); S.gas = v; rebuildGas(ctx); } });
      c.appendChild(ui.gasOpts);
      ui.sN = kit.ui.slider({ label: 'n', min: 0.2, max: 3, step: 0.05, value: S.n, format: function (v) { return fmt(v, 2) + ' mol'; }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.sT = kit.ui.slider({ label: 'T', min: 100, max: 700, step: 5, value: S.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = v; } });
      ui.sV = kit.ui.slider({ label: 'V', min: 1.5, max: 13, step: 0.1, value: S.V, format: function (v) { return fmt(v, 1) + ' L'; }, onInput: function (v) { ctx.goManual(); S.isoP = 0; S.V = v; } });
      c.appendChild(kit.ui.sliders([ui.sN, ui.sT, ui.sV]));
      ui.sSp = kit.ui.slider({ label: "Animation speed", min: 0.1, max: 2, step: 0.05, value: S.sp, format: function (v) { return fmt(v, 2) + '×'; }, onInput: function (v) { S.sp = v; } }); c.appendChild(ui.sSp);
      c.appendChild(ctx.btnRow([{ t: "Constant P (1 atm)", fn: function () { ctx.goManual(); S.isoP = S.isoP ? 0 : 1; kit.toast(S.isoP ? "Free piston at 1 atm: V = nRT/P" : "Volume set by the control"); } }, { t: "Restart", fn: function () { ctx.goManual(); S.n = 1; S.T = 300; S.V = 10; S.isoP = 0; S.gas = 'N2'; rebuildGas(ctx); ui.gasOpts.set('N2'); ui.sN.set(1); ui.sT.set(300); ui.sV.set(10); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Turn on the “Show real gas” layer to compare with van der Waals. With constant P the volume is calculated (max. 13 L).</p>");
    },
    graphs: [
      { title: "P–V isotherm", h: 230, note: "Dashed line: ideal gas; solid line: van der Waals at the current T. The dot is the current state.", draw: function (cx, w, h, c) {
        var L = 42, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, V0 = 1.5, V1 = 13, pm = 0; for (var v = V0; v <= V1; v += 0.25) pm = Math.max(pm, Pid(S.n, S.T, v)); pm = Math.max(1, Math.min(pm, 60)) * 1.05;
        var sx = function (v) { return L + pw * (v - V0) / (V1 - V0); }, sy = function (p) { return Tp + ph - ph * Math.min(p, pm) / pm; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(pm * i / 4, 1), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var j = 0; j <= 4; j++) cx.fillText(fmt(V0 + (V1 - V0) * j / 4, 1), L + pw * j / 4, h - B + 13); cx.fillText("V (L) · y axis: P (atm)", L + pw / 2, h - 4);
        cx.setLineDash([5, 4]); cx.strokeStyle = c.muted; cx.beginPath(); for (v = V0; v <= V1; v += 0.1) { var yy = sy(Pid(S.n, S.T, v)); if (v === V0) cx.moveTo(sx(v), yy); else cx.lineTo(sx(v), yy); } cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#38a169'; cx.lineWidth = 2.4; cx.beginPath(); var st = false; for (v = V0; v <= V1; v += 0.1) { var pr = Pre(S.n, S.T, v); if (!isFinite(pr)) continue; if (!st) { cx.moveTo(sx(v), sy(pr)); st = true; } else cx.lineTo(sx(v), sy(pr)); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.V), sy(Pid(S.n, S.T, S.V)), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
      { title: "Maxwell–Boltzmann speed distribution", h: 220, note: "Thick curve: current T. Thin: T/2 and 2T. Vertical line: v<sub>rms</sub> at the current T.", draw: function (cx, w, h, c) {
        var L = 14, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, Mm = g().M / 1000, vmx = 2800;
        var f = function (v, T0) { return 4 * Math.PI * Math.pow(Mm / (2 * Math.PI * Rj * T0), 1.5) * v * v * Math.exp(-Mm * v * v / (2 * Rj * T0)); };
        var peak = 0; [S.T / 2, S.T, S.T * 2].forEach(function (T0) { for (var v = 0; v <= vmx; v += 20) peak = Math.max(peak, f(v, T0)); }); peak *= 1.08;
        var sx = function (v) { return L + pw * v / vmx; }, sy = function (y) { return Tp + ph - ph * y / peak; };
        cx.font = '10.5px system-ui'; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var j = 0; j <= 4; j++) cx.fillText(fmt(vmx * j / 4, 0), L + pw * j / 4, h - B + 13); cx.fillText("speed (m/s)", L + pw / 2, h - 4);
        [[S.T / 2, '#9aa7b4', 1.4], [S.T * 2, '#e3b341', 1.4], [S.T, '#38a169', 2.8]].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = a[2]; cx.beginPath(); for (var v = 0; v <= vmx; v += 10) { var y = sy(f(v, a[0])); if (v === 0) cx.moveTo(sx(v), y); else cx.lineTo(sx(v), y); } cx.stroke(); }); cx.lineWidth = 1;
        cx.strokeStyle = c.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(vrms()), Tp); cx.lineTo(sx(vrms()), Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText('v_rms ' + fmt(vrms(), 0), Math.min(sx(vrms()) + 4, L + pw - 70), Tp + 10); } },
      { title: "Compressibility factor Z", h: 210, note: "Z = PV/nRT. Z = 1 is the ideal gas. Calculated with van der Waals for 1 mol at the current T (P ≤ 300 atm).", draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, pts = [], Pm = 300, gg = g(), nn = 1;
        for (var v = gg.b * 1.15; v < 60; v *= 1.025) { var p = nn * R * S.T / (v - nn * gg.b) - gg.a / (v * v); if (p > 0.05 && p <= Pm) pts.push([p, p * v / (R * S.T)]); }
        var zmin = Math.min(0.2, Math.min.apply(null, pts.map(function (a) { return a[1]; }).concat([1]))), zmax = Math.max(1.6, Math.max.apply(null, pts.map(function (a) { return a[1]; }).concat([1])));
        var sx = function (p) { return L + pw * Math.log(p / 0.05) / Math.log(Pm / 0.05); }, sy = function (z) { return Tp + ph - ph * (z - zmin) / (zmax - zmin); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var z = zmin + (zmax - zmin) * i / 4, y = sy(z); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(z, 2), L - 5, y + 3); }
        cx.textAlign = 'center'; [0.1, 1, 10, 100].forEach(function (p) { cx.fillText(p, sx(p), h - B + 13); }); cx.fillText("P (atm, log scale)", L + pw / 2, h - 4);
        cx.strokeStyle = c.ink; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(L, sy(1)); cx.lineTo(L + pw, sy(1)); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#38a169'; cx.lineWidth = 2.4; cx.beginPath(); pts.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (a, k) { if (k === 0) cx.moveTo(sx(a[0]), sy(a[1])); else cx.lineTo(sx(a[0]), sy(a[1])); }); cx.stroke(); cx.lineWidth = 1;
        var pr = Pre(S.n, S.T, S.V); if (isFinite(pr) && pr > 0.05 && pr <= Pm) { cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(pr), sy(pr * S.V / (S.n * R * S.T)), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } } }
    ],
    calc: function () {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), gg = g(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return "<div class=\"card-kicker\">Calculation with the current state</div><div class=\"calc-step\">1 · Ideal gas: P = nRT / V</div><table class=\"calc-table\">" + row('n · R · T', fmt(S.n, 2) + ' × 0,08206 × ' + fmt(S.T, 0) + ' = ' + fmt(S.n * R * S.T, 2) + ' atm·L') + row('P = (nRT) ÷ V', fmt(S.n * R * S.T, 2) + ' ÷ ' + fmt(S.V, 2) + ' = <b>' + fp(pi) + ' atm</b> (' + fmt(pi * 101.325, 0) + ' kPa)') + '</table>' +
        '<div class="calc-step">2 · Van der Waals (' + gg.f + ': a = ' + gg.a + ' atm·L²/mol², b = ' + gg.b + ' L/mol)</div><table class="calc-table">' + row('nRT ÷ (V − nb)', isFinite(pr) ? fmt(S.n * R * S.T / (S.V - S.n * gg.b), 2) + ' atm' : '—') + row('a n² ÷ V²', fmt(gg.a * S.n * S.n / (S.V * S.V), 2) + ' atm') + row("Real P", '<b>' + fp(pr) + ' atm</b>') + row('Z = PV/nRT', fmt(pr * S.V / (S.n * R * S.T), 3)) + '</table>' +
        "<div class=\"calc-step\">3 · Molecular speeds</div><table class=\"calc-table\">" + row('v<sub>rms</sub> = √(3RT/M)', '√(3 × 8,314 × ' + fmt(S.T, 0) + ' ÷ ' + fmt(gg.M / 1000, 5) + ') = <b>' + fmt(vrms(), 0) + ' m/s</b>') + row("most probable v √(2RT/M)", fmt(vmp(), 0) + ' m/s') + row("mean E<sub>k</sub> = 3/2 RT", fmt(1.5 * Rj * S.T / 1000, 2) + ' kJ/mol') + '</table>';
    },
    quiz: [
      { q: "What volume does 1.00 mol of ideal gas occupy at 0 °C (273.15 K) and 1.00 atm?", options: ['22,4 L', '24,5 L', '1,00 L', '8,21 L'], answer: 0, why: "V = nRT/P = 1.00 × 0.08206 × 273.15 / 1.00 = 22.41 L (molar volume at STP)." },
      { q: "A gas occupies 2.0 L at 1.0 atm. It is compressed to 0.50 L at constant temperature. What is the new pressure?", options: ["4.0 atm", "0.25 atm", "2.0 atm", "0.50 atm"], answer: 0, why: "Boyle's law: P₁V₁ = P₂V₂ → P₂ = 1.0 × 2.0 / 0.50 = 4.0 atm." },
      { q: "A gas occupies 3.0 L at 300 K and constant pressure. What volume does it occupy at 450 K?", options: ['4,5 L', '2,0 L', '3,0 L', '6,8 L'], answer: 0, why: "Charles's law (T in kelvin): V₂ = V₁ · T₂/T₁ = 3.0 × 450/300 = 4.5 L." },
      { q: "At the same temperature, which gas has the higher root-mean-square speed, H₂ or O₂?", options: ["H₂, about 4 times faster", "O₂, about 4 times faster", "Both equally", "H₂, twice as fast"], answer: 0, why: "v_rms = √(3RT/M): v(H₂)/v(O₂) = √(32/2.016) ≈ 4." },
      { q: "At the same temperature, the mean kinetic energy per molecule of He and Xe is…", options: ["Equal", "Greater in He", "Greater in Xe", "Zero in Xe"], answer: 0, why: "The mean translational kinetic energy is 3/2 kT and depends only on T, not on mass." },
      { q: "Real gases depart more from ideal behavior at…", options: ["High pressure and low temperature", "Low pressure and high temperature", "Low pressure and low temperature", "High temperature and high pressure alike"], answer: 0, why: "At high P the molecules are close together (their volume matters) and at low T the intermolecular attractions are relevant compared with the kinetic energy." },
      { q: "How many moles of ideal gas are there in 5.00 L at 2.00 atm and 300 K?", options: ["0.406 mol", "2.46 mol", "0.0406 mol", "4.06 mol"], answer: 0, why: "n = PV/RT = (2.00 × 5.00) / (0.08206 × 300) = 10.0 / 24.6 = 0.406 mol." },
      { q: "A mixture of 2.0 mol of N₂ and 1.0 mol of O₂ is at a total of 3.0 atm. What is the partial pressure of N₂?", options: ["2.0 atm", "1.0 atm", "3.0 atm", "1.5 atm"], answer: 0, why: "Dalton's law: p(N₂) = x(N₂) · P = (2/3) × 3.0 = 2.0 atm." }
    ],
    help: { intro: "Change gas, n, T and V in “Lab”, or follow the lesson. With “Back to the lesson” the script regains control.", items: [["Container", "the molecules bounce off the walls; the piston sets the volume; the bottom plate turns redder as T rises."], ["Real gas", "turn on the “Show real gas” layer to compare with van der Waals."], ["Graphs", "P–V isotherm, Maxwell–Boltzmann distribution and compressibility factor Z."], ["Calculation", "PV = nRT, van der Waals and molecular speeds with the current values."]] }
  };
  MSim.create(def);
})();
