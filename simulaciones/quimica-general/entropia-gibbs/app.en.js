/* Entropía y energía libre de Gibbs — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, sci = function (x) { return MSim.sci(x, 2); }, KB = 1.380649e-23, R = 8.314;
  var RX = [
    { id: "ice", n: 'H₂O(s) → H₂O(l)', dh: 6.01, ds: 22.0, nt: "ΔH > 0, ΔS > 0: spontaneous at high T (T > 273 K)" },
    { id: 'nh3', n: 'N₂ + 3 H₂ → 2 NH₃', dh: -92.2, ds: -198.7, nt: 'ΔH < 0, ΔS < 0: espontánea a T baja (T < 464 K)' },
    { id: 'caco3', n: 'CaCO₃ → CaO + CO₂', dh: 178.3, ds: 160.5, nt: "ΔH > 0, ΔS > 0: spontaneous only at high T (≈ 1111 K)" },
    { id: 'comb', n: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O(l)', dh: -890.4, ds: -242.8, nt: "ΔH ≪ 0: spontaneous at almost any practical T" },
    { id: "ozone", n: '2 O₃ → 3 O₂', dh: -285.4, ds: 137.6, nt: "ΔH < 0, ΔS > 0: spontaneous at all T" },
    { id: 'imp', n: '3 O₂ → 2 O₃', dh: 285.4, ds: -137.6, nt: 'ΔH > 0, ΔS < 0: nunca espontánea' }
  ], RID = {}; RX.forEach(function (r) { RID[r.id] = r; });
  var PH = { s: "solid", l: "liquid", g: 'gas' }, SPH = { s: 41, l: 69.9, g: 188.8 };
  var S = { N: 20, kL: 20, mode: 'mix', ph: 0, rx: "ice", Tk: 298, _st: -1 }, NM = 40, seeds = [], lab = {}, ps, dm, part;
  function lnC(n, k) { var s = 0, i; for (i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function dG(r, t) { return r.dh - t * r.ds / 1000; }
  function phS(p) { return p < 0.5 ? SPH.s + (SPH.l - SPH.s) * sm(p * 2) : SPH.l + (SPH.g - SPH.l) * sm((p - 0.5) * 2); }
  function stages() {
    return [
      ["Microstates and macrostates", "Microstates", "The same macroscopic distribution can be achieved in many ways",
        "<p>With <b>N particles</b> distributed between two halves, each specific assignment of every particle is a <b>microstate</b>; the <b>macrostate</b> only says how many are on the left (k). The number of microstates is <b>W = N!/(k!(N−k)!)</b>. With 20 particles there is a single microstate with all on the left, but <b>184,756</b> with 10 and 10.</p>"],
      ['S = k·ln W', "Boltzmann", "Entropy: a measure of the number of accessible microstates",
        "<p>Boltzmann defined <b>S = k<sub>B</sub> ln W</b>, with k<sub>B</sub> = 1.38×10⁻²³ J/K. For one mole, <b>S = R ln(W)</b> per particle. More microstates means greater entropy. An isolated system evolves toward the macrostate with the greatest W, simply because it is <b>the most probable</b>: the 50/50 distribution.</p>"],
      ["Spontaneous expansion", "Expansion", "A gas fills all the available volume: ΔS = nR ln(V₂/V₁) > 0",
        "<p>When the partition is removed, the particles spread throughout the container. For the isothermal expansion of an ideal gas from V to 2V: <b>ΔS = nR ln 2 = +5.76 J/(mol·K)</b>. The process is spontaneous <b>with no change in energy</b>: it is driven by entropy alone. The second law: <b>ΔS<sub>universe</sub> &gt; 0</b> in every spontaneous process.</p>"],
      ["States of matter", "States", 'S(s) < S(l) ≪ S(g): más libertad de movimiento, más microestados',
        "<p>On melting and, above all, on vaporizing, the particles gain freedom: for water, <b>S° = 41 J/(mol·K)</b> (ice, approximate value) <b>→ 69.9 (liquid) → 188.8 (vapor)</b>. More atoms per molecule, greater mass and higher T also increase S. Reactions that <b>produce gas</b> or increase the number of moles have ΔS &gt; 0.</p>"],
      ['ΔG = ΔH − TΔS', "Gibbs", "Combines the effect of the system (ΔH) and the surroundings (ΔS_surr = −ΔH/T)",
        "<p>Since ΔS<sub>surr</sub> = −ΔH/T, the criterion ΔS<sub>univ</sub> &gt; 0 is equivalent to <b>ΔG = ΔH − TΔS &lt; 0</b> (at constant P and T). There are <b>four cases</b> according to the signs: (−,+) always spontaneous; (+,−) never; (−,−) spontaneous at low T; (+,+) spontaneous at high T. The crossover temperature is <b>T = ΔH/ΔS</b>.</p>"],
      ["ΔG, K and equilibrium", 'ΔG° y K', "ΔG° = −RT ln K: a single number summarizes the equilibrium",
        "<p>At equilibrium ΔG = 0 and <b>ΔG° = −RT ln K</b>. If ΔG° &lt; 0, K &gt; 1 (favors products); if ΔG° &gt; 0, K &lt; 1. Every <b>5.7 kJ/mol</b> at 298 K changes K by a factor of 10. Change T and the reaction in “Lab” and watch how K moves with temperature.</p>"]
    ];
  }
  var def = {
    key: 'entropia-gibbs', title: "Entropy and Gibbs Free Energy", subtitle: "3D Simulator · general chemistry", accent: { dark: '#a78bfa', light: '#5f3dc4' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 17], target: [0, 2.5, 0] }, { id: 'frontal', label: "Front", pos: [0, 2.5, 18], target: [0, 2.5, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 3], target: [0, 1, 0] }],
    layers: [{ id: 'part', label: "Marked particle", icon: '●' }],
    build: function (ctx) {
      var s = ctx.scene, g = new T.SphereGeometry(1, 14, 10);
      ps = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.4 }), NM); ps.frustumCulled = false; s.add(ps); dm = new T.Object3D();
      var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(11, 6, 5)), new T.LineBasicMaterial({ color: 0x868e96 })); e.position.set(0, 3, 0); s.add(e);
      part = new T.Mesh(new T.PlaneGeometry(5, 6), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.25, side: T.DoubleSide, depthWrite: false })); part.rotation.y = Math.PI / 2; part.position.set(0, 3, 0); s.add(part);
      for (var i = 0; i < NM; i++) seeds.push([Math.random(), Math.random(), Math.random(), Math.random() * 6.28]);
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.mode = i === 3 ? 'ph' : 'mix'; S.N = 20;
        if (i === 0) { S.kL = Math.round(20 - 10 * sm(l)); S.part = true; }
        else if (i === 1) { S.kL = [20, 18, 15, 12, 10, 10][Math.min(5, Math.floor(l * 6))]; S.part = true; }
        else if (i === 2) { S.part = l < 0.2; var p = sm((l - 0.2) / 0.5); S.kL = Math.round(20 - 10 * p + (l > 0.7 ? Math.round(1.6 * Math.sin(l * 40)) : 0)); }
        else if (i === 3) { S.ph = l; }
        else if (i === 4) { S.rx = RX[Math.min(RX.length - 1, Math.floor(l * RX.length))].id; S.Tk = 200 + 1200 * ((l * RX.length) % 1); }
        else { S.rx = 'nh3'; S.Tk = 250 + 550 * l; }
      }
      var N = S.N, kL = Math.max(0, Math.min(N, S.kL)), partOn = S.part !== false && S.mode === 'mix', wob = 0.12;
      part.visible = S.mode === 'mix' && S.part;
      for (var i = 0; i < NM; i++) {
        if (i >= N) { dm.scale.setScalar(0.0001); dm.position.set(0, -9, 0); }
        else {
          var sd = seeds[i], left = i < kL, x, y, z, rr = S.mode === 'mix';
          if (rr) { x = (left ? -2.6 : 2.6) + (sd[0] * 2 - 1) * 2.3 + 0.2 * Math.sin(now * 1.4 + sd[3]); y = 0.7 + 4.6 * sd[1] + 0.25 * Math.sin(now * 1.1 + sd[3] * 2); z = (sd[2] * 2 - 1) * 2.1 + 0.2 * Math.cos(now * 1.3 + sd[3]); if (!S.part) { x = (sd[0] * 2 - 1) * 4.9 * (left ? 1 : 1); } }
          else { var gx = (i % 5), gy = Math.floor(i / 5) % 4, gz = Math.floor(i / 20); var ln = [(gx - 2) * 1.5, 1 + gy * 1.3, (gz - 0.5) * 2]; var fr = sm(S.ph * 2), gs = sm((S.ph - 0.5) * 2), amp = 0.12 + 0.7 * fr, gas = gs * 4.2; x = ln[0] * (1 + 1.2 * gs) + (sd[0] * 2 - 1) * (amp + gas) * 0.9 * fr + amp * 0.3 * Math.sin(now * 3 + sd[3]); y = Math.max(0.5, Math.min(5.5, ln[1] * (1 + 0.8 * gs) + (sd[1] * 2 - 1) * (amp + gas) * 0.5 * fr + amp * 0.3 * Math.sin(now * 3.3 + sd[3] * 2))); z = ln[2] + (sd[2] * 2 - 1) * (amp + gas * 0.5) * fr + amp * 0.3 * Math.cos(now * 2.7 + sd[3]); x = Math.max(-5, Math.min(5, x)); z = Math.max(-2.2, Math.min(2.2, z)); }
          dm.position.set(x, y, z); dm.scale.setScalar(i === 0 && ctx.layer('part') ? 0.42 : 0.3);
        }
        dm.updateMatrix(); ps.setMatrixAt(i, dm.matrix);
      }
      ps.instanceMatrix.needsUpdate = true;
      if (S.mode === 'mix') {
        var lw = lnC(N, kL), W = Math.exp(lw);
        lab.t.pos(0, 6.9, 0).set('N = ' + N + " · left " + kL + " · right " + (N - kL), 'bl-lead').vis(true);
        lab.a.pos(0, -0.9, 0).set('W = ' + (W < 1e7 ? fmt(W, 0) : sci(W)) + " microstates", 'bl-pos').vis(true);
        lab.b.pos(0, -1.9, 0).set('S = k·ln W = ' + sci(KB * lw) + ' J/K', 'bl-d').vis(true); lab.c.vis(false);
      } else {
        var ph = S.ph < 0.33 ? 's' : (S.ph < 0.67 ? 'l' : 'g');
        lab.t.pos(0, 6.9, 0).set("Water · " + PH[ph], 'bl-lead').vis(true); lab.a.pos(0, -0.9, 0).set('S° ≈ ' + f1(phS(S.ph)) + ' J/(mol·K)', 'bl-pos').vis(true); lab.b.vis(false); lab.c.vis(false);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.k && u.k.set(S.kL); u.ph && u.ph.set(S.ph); u.tk && u.tk.set(S.Tk); } if (u.rx) u.rx.set(S.rx); },
    hud: function () {
      var r = RID[S.rx], g = dG(r, S.Tk);
      if (S.mode === 'mix') { var lw = lnC(S.N, S.kL); return { eq: { chip: 'S', name: 'S = k·ln W', body: '<div class="eqline"><small>W</small>' + (Math.exp(lw) < 1e7 ? fmt(Math.exp(lw), 0) : sci(Math.exp(lw))) + '</div><div class="eqline"><small>ln W</small>' + f2(lw) + "</div><div class=\"eqline\"><small>Distribution</small>" + S.kL + ' | ' + (S.N - S.kL) + '</div>' }, legend: [{ label: '●', color: '#a78bfa', text: "particle" }, { label: "Partition", color: '#74c0fc', text: "removed on expansion" }] }; }
      return { eq: { chip: 'ΔG', name: 'ΔG = ΔH − TΔS', body: "<div class=\"eqline\"><small>Reaction</small>" + r.n + '</div><div class="eqline"><small>ΔH</small>' + f1(r.dh) + ' kJ/mol</div><div class="eqline"><small>ΔS</small>' + f1(r.ds) + " J/(mol·K)</div><div class=\"eqline\"><small>ΔG at " + fmt(S.Tk, 0) + ' K</small>' + f1(g) + ' kJ/mol</div>' }, legend: [{ label: '●', color: '#a78bfa', text: "particle" }] };
    },
    measures: function () { var r = RID[S.rx], g = dG(r, S.Tk), lw = lnC(S.N, S.kL); return [["N / left", S.N + ' / ' + S.kL], ['W', Math.exp(lw) < 1e7 ? fmt(Math.exp(lw), 0) : sci(Math.exp(lw))], ['S = k·lnW', sci(KB * lw) + ' J/K'], ["S° water (phase)", f1(phS(S.ph)) + ' J/(mol·K)'], ["Reaction", r.n], ['ΔG', f1(g) + ' kJ/mol'], ["Crossover T", fmt(r.dh * 1000 / r.ds, 0) + ' K']]; },
    ideas: ["<b>S = k ln W</b>: entropy measures microstates.", "An isolated system evolves toward the most probable macrostate.", "<b>ΔG = ΔH − TΔS</b>; spontaneous if ΔG &lt; 0.", '<b>ΔG° = −RT ln K</b>.', "S(gas) ≫ S(liquid) &gt; S(solid)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Microstates"); el.appendChild(c);
      ui.k = kit.ui.slider({ label: "Particles on the left", min: 0, max: 40, step: 1, value: S.kL, format: function (v) { return v + ' de ' + S.N; }, onInput: function (v) { ctx.goManual(); S.mode = 'mix'; S.part = true; S.kL = Math.min(v, S.N); } });
      ui.n = kit.ui.slider({ label: "Number of particles N", min: 2, max: 40, step: 1, value: S.N, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.mode = 'mix'; S.part = true; S.N = v; S.kL = Math.min(S.kL, v); } });
      ui.ph = kit.ui.slider({ label: "State of water (solid → gas)", min: 0, max: 1, step: 0.01, value: S.ph, format: function (v) { return v < 0.33 ? "solid" : (v < 0.67 ? "liquid" : 'gas'); }, onInput: function (v) { ctx.goManual(); S.mode = 'ph'; S.ph = v; } });
      c.appendChild(kit.ui.sliders([ui.n, ui.k, ui.ph]));
      c.appendChild(ctx.btnRow([{ t: "Remove partition", primary: true, fn: function () { ctx.goManual(); S.mode = 'mix'; S.part = false; S.kL = Math.round(S.N / 2); } }, { t: "All on the left", fn: function () { ctx.goManual(); S.mode = 'mix'; S.part = true; S.kL = S.N; } }]));
      var d = kit.ui.card("Reaction"); el.appendChild(d);
      ui.rx = kit.ui.options({ label: "Process", cols: 2, value: S.rx, options: RX.map(function (x) { return { v: x.id, label: x.n, sub: 'ΔH ' + f1(x.dh) + ' · ΔS ' + f1(x.ds) }; }), onChange: function (v) { ctx.goManual(); S.rx = v; } }); d.appendChild(ui.rx);
      ui.tk = kit.ui.slider({ label: "Temperature", min: 100, max: 1500, step: 5, value: S.Tk, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.Tk = v; } }); d.appendChild(kit.ui.sliders([ui.tk]));
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Microstate distribution W(k)", h: 220, note: "Number of microstates for each distribution k on the left. The maximum (50/50) dominates.", draw: function (cx, w, h, col) {
        var N = S.N, L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = 0, k; for (k = 0; k <= N; k++) mx = Math.max(mx, lnC(N, k)); var bw = pw / (N + 1);
        cx.font = '10.5px system-ui'; cx.textAlign = 'center'; for (k = 0; k <= N; k++) { var v = Math.exp(lnC(N, k) - mx), hh = ph * v; cx.fillStyle = k === S.kL ? '#ff6b3d' : '#a78bfa'; cx.fillRect(L + k * bw + 1, Tp + ph - hh, Math.max(1, bw - 2), hh); if (N <= 20 || k % 5 === 0) { cx.fillStyle = col.muted; cx.fillText(k, L + k * bw + bw / 2, h - B + 13); } }
        cx.fillStyle = col.muted; cx.fillText("k (particles on the left)   ·   relative W", L + pw / 2, h - 4); cx.textAlign = 'right'; cx.fillText("W max = " + (Math.exp(mx) < 1e7 ? fmt(Math.exp(mx), 0) : sci(Math.exp(mx))), w - Rr, Tp + 8);
      } },
      { title: "ΔG(T) of the process", h: 230, note: "Slope = −ΔS; intercept = ΔH. It crosses zero at T = ΔH/ΔS.", draw: function (cx, w, h, col) {
        var r = RID[S.rx], L = 46, Rr = 12, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, tmax = 1500, lo = Math.min(dG(r, 0), dG(r, tmax), 0), hi = Math.max(dG(r, 0), dG(r, tmax), 0), pad = (hi - lo) * 0.1 || 1; lo -= pad; hi += pad;
        var sx = function (t) { return L + pw * t / tmax; }, sy = function (g) { return Tp + ph - ph * (g - lo) / (hi - lo); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var g = lo + (hi - lo) * i / 4; cx.beginPath(); cx.moveTo(L, sy(g)); cx.lineTo(L + pw, sy(g)); cx.stroke(); cx.fillText(fmt(g, 0), L - 5, sy(g) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 1500; i += 500) cx.fillText(i, sx(i), h - B + 13); cx.fillText('T (K)   ·   ΔG (kJ/mol)', L + pw / 2, h - 4);
        cx.strokeStyle = '#ff6b3d'; cx.beginPath(); cx.moveTo(L, sy(0)); cx.lineTo(L + pw, sy(0)); cx.stroke();
        cx.strokeStyle = '#a78bfa'; cx.lineWidth = 2.6; cx.beginPath(); cx.moveTo(sx(0), sy(dG(r, 0))); cx.lineTo(sx(tmax), sy(dG(r, tmax))); cx.stroke(); cx.lineWidth = 1;
        var Tc = r.dh * 1000 / r.ds; if (Tc > 0 && Tc < tmax) { cx.fillStyle = '#ff6b3d'; cx.beginPath(); cx.arc(sx(Tc), sy(0), 4, 0, 7); cx.fill(); cx.textAlign = 'left'; cx.fillText('T = ' + fmt(Tc, 0) + ' K', sx(Tc) + 6, sy(0) - 6); }
        cx.fillStyle = '#fff'; cx.strokeStyle = '#a78bfa'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.Tk), sy(dG(r, S.Tk)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, r = RID[S.rx], g = dG(r, S.Tk), Tc = r.dh * 1000 / r.ds, lw = lnC(S.N, S.kL), Kq = Math.exp(-g * 1000 / (R * S.Tk));
      return "<div class=\"card-kicker\">Microstates</div><table class=\"calc-table\">" + row('W', 'N!/(k!(N−k)!) = <b>' + (Math.exp(lw) < 1e7 ? fmt(Math.exp(lw), 0) : sci(Math.exp(lw))) + '</b>') + row('S', 'k<sub>B</sub> ln W = ' + sci(KB * lw) + ' J/K') + row("Expansion V→2V", 'ΔS = nR ln2 = ' + f2(R * Math.LN2) + ' J/(mol·K)') + '</table>' +
        '<div class="calc-step">Gibbs: ' + r.n + '</div><table class="calc-table">' + row('ΔG', f1(r.dh) + ' − ' + fmt(S.Tk, 0) + ' × (' + f1(r.ds) + '/1000) = <b>' + f1(g) + ' kJ/mol</b>') + row("Crossover T", 'ΔH/ΔS = ' + fmt(Tc, 0) + ' K') + row('K', 'exp(−ΔG/RT) = ' + sci(Kq)) + row("Spontaneous", g < 0 ? "<span class=\"calc-ok\">yes (forward)</span>" : "<span class=\"calc-hi\">no (favors the reverse)</span>") + '</table><p class="muted small">' + r.nt + '.</p>';
    },
    quiz: [
      { q: "For 20 particles, how many microstates does the 10-10 distribution have?", options: ['184 756', '20', '1', '1 048 576'], answer: 0, why: 'C(20,10) = 184 756.' },
      { q: "Boltzmann's equation for entropy is…", options: ['S = k ln W', 'S = ΔH/T', 'S = k/W', 'S = W ln k'], answer: 0, why: 'S = k_B ln W.' },
      { q: "An ideal gas expands isothermally from V to 2V. ΔS per mole is…", options: ['R ln 2', '0', '−R ln 2', 'R/2'], answer: 0, why: 'ΔS = nR ln(V₂/V₁).' },
      { q: "Order S°: H₂O(g), H₂O(l), H₂O(s).", options: ['g > l > s', 's > l > g', 'l > g > s', "they are equal"], answer: 0, why: "More freedom of motion = more microstates." },
      { q: "A reaction with ΔH < 0 and ΔS < 0 is spontaneous…", options: ["at low temperature", "at high temperature", "always", "never"], answer: 0, why: "ΔG = ΔH − TΔS; the −TΔS term becomes positive at high T." },
      { q: "If ΔH > 0 and ΔS > 0, the reaction is spontaneous when…", options: ['T > ΔH/ΔS', 'T < ΔH/ΔS', "always", "never"], answer: 0, why: "As T rises the −TΔS term gains weight." },
      { q: "At 298 K, if ΔG° = −5.7 kJ/mol, K is approximately…", options: ['10', '1', '0,1', '100'], answer: 0, why: "ln K = −ΔG°/RT = 2.3; K ≈ 10." },
      { q: "At equilibrium…", options: ['ΔG = 0', "ΔG° = 0 always", 'ΔS = 0', 'ΔH = 0'], answer: 0, why: "At equilibrium ΔG = 0 (and Q = K)." }
    ],
    help: { intro: "In “Lab” change N, k and the state of water, or choose a reaction and move the temperature to see ΔG. “Remove partition” shows the expansion.", items: [['W', "microstates of the current distribution."], ['ΔG', "ΔH − TΔS; negative = spontaneous."]] }
  };
  MSim.create(def);
})();
