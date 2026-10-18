/* Solubilidad y producto de solubilidad (Kps) — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, sci = function (x) { return MSim.sci(x, 2); };
  // a: cationes, b: aniones por fórmula; ka: Ka del ácido conjugado del anión (0 = anión no básico); oh: hidróxido
  var SALTS = [
    { id: 'AgCl', n: 'AgCl', ksp: 1.8e-10, a: 1, b: 1, ion: ['Ag⁺', 'Cl⁻'], col: 0xe9ecef, ka: 0 },
    { id: 'BaSO4', n: 'BaSO₄', ksp: 1.1e-10, a: 1, b: 1, ion: ['Ba²⁺', 'SO₄²⁻'], col: 0xdee2e6, ka: 0 },
    { id: 'PbI2', n: 'PbI₂', ksp: 9.8e-9, a: 1, b: 2, ion: ['Pb²⁺', 'I⁻'], col: 0xffd43b, ka: 0 },
    { id: 'CaF2', n: 'CaF₂', ksp: 3.5e-11, a: 1, b: 2, ion: ['Ca²⁺', 'F⁻'], col: 0xf1f3f5, ka: 6.8e-4, pKa: 3.17 },
    { id: 'CaCO3', n: 'CaCO₃', ksp: 3.4e-9, a: 1, b: 1, ion: ['Ca²⁺', 'CO₃²⁻'], col: 0xe9ecef, ka: 4.7e-11, pKa: 10.33 },
    { id: 'MgOH2', n: 'Mg(OH)₂', ksp: 5.6e-12, a: 1, b: 2, ion: ['Mg²⁺', 'OH⁻'], col: 0xf8f9fa, oh: true }
  ], SID = {};
  SALTS.forEach(function (s) { SID[s.id] = s; });
  var KI = 8.5e-17, KC = 1.8e-10;
  var S = { salt: 'AgCl', lc: -6, pH: 7, rat: 0, T: 0, mode: 'norm', _st: -1 }, NI = 70, NS = 70, lab = {};
  var cat, an, ex, sol, solB, dm, seeds = [];
  function alpha(s, pH) { return s.ka ? s.ka / (s.ka + Math.pow(10, -pH)) : 1; }
  // solubilidad molar (mol/L) con ion común c (M) y pH
  function solub(s, c, pH) {
    if (s.oh) { var oh = Math.pow(10, pH - 14); return Math.min(1, s.ksp / (oh * oh)); }
    var al = alpha(s, pH), lo = -20, hi = 0, g = function (ls) { var x = Math.pow(10, ls); return Math.log(s.a * x) * s.a + s.b * Math.log(al * (s.b * x + c)); };
    var t = Math.log(s.ksp); if (g(hi) < t) return 1; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (g(m) < t) lo = m; else hi = m; } return Math.pow(10, (lo + hi) / 2);
  }
  function cc() { return S.lc <= -6 ? 0 : Math.pow(10, S.lc); }
  function sel(Tt) { var I, Cl, Ag, pI = Math.min(Tt, 0.1), pC = Math.max(0, Tt - 0.1), fl = KI / KC; if (Tt < 0.1) { I = Math.max(0.1 - Tt, fl); Cl = 0.1; Ag = KI / I; } else { Cl = Math.max(0.2 - Tt, 1e-9); Ag = KC / Cl; I = KI / Ag; } return { I: I, Cl: Cl, Ag: Ag, pI: pI, pC: pC }; }
  function stages() {
    var s = SID.AgCl;
    return [
      ["Dissolution equilibrium", "Ksp", "MₐXᵦ(s) ⇌ aMⁿ⁺ + bXᵐ⁻ → Ksp = [M]ᵃ[X]ᵇ",
        "<p>A sparingly soluble salt in contact with its saturated solution is in <b>heterogeneous equilibrium</b>: the solid dissolves and the ions precipitate at the same rate. The constant is the <b>solubility product</b>: <b>Ksp = [M]ᵃ[X]ᵇ</b> (the solid does not appear). For AgCl: Ksp = [Ag⁺][Cl⁻] = <b>" + sci(KC) + '</b>.</p>'],
      ["Molar solubility", "Solubility", "With s = mol/L dissolved: Ksp = aᵃ·bᵇ·s^(a+b)",
        "<p>The <b>molar solubility s</b> is obtained from the stoichiometry: [M] = a·s, [X] = b·s ⇒ <b>Ksp = aᵃbᵇ·s^(a+b)</b>. Examples: AgCl: s = √Ksp = 1.3×10⁻⁵ M; PbI₂: s = ∛(Ksp/4) = 1.3×10⁻³ M. <b>Careful!</b> A smaller Ksp does not always imply lower solubility if the salts have different stoichiometry.</p>"],
      ["Common-ion effect", "Common ion", "Adding an ion of the salt reduces its solubility (Le Châtelier)",
        "<p>If the solution already contains one of the ions (e.g. <b>Cl⁻ from NaCl</b>), the equilibrium shifts toward the solid and the <b>solubility decreases</b>. With [Cl⁻] = c: Ksp = s·(s + c) ⇒ s ≈ Ksp/c if c ≫ s. For example, in 0.1 M NaCl, AgCl has s ≈ 1.8×10⁻⁹ M, about 10,000 times less than in pure water.</p>"],
      ["Effect of pH", 'pH', "Basic anions (F⁻, CO₃²⁻, OH⁻) make the salt more soluble in acidic medium",
        "<p>If the anion is the <b>conjugate base of a weak acid</b> (F⁻, CO₃²⁻, PO₄³⁻, S²⁻), H⁺ consumes it and shifts the equilibrium toward dissolution: <b>the salt dissolves more as the pH drops</b>. In hydroxides, [OH⁻] directly sets the solubility: Mg(OH)₂ → s = Ksp/[OH⁻]². Salts of anions of strong acids (Cl⁻, I⁻, SO₄²⁻) hardly change.</p>"],
      ["Q versus Ksp", "Precipitation", "Q > Ksp: precipitates · Q = Ksp: saturated · Q < Ksp: no solid",
        "<p>With any concentrations the <b>reaction quotient Q = [M]ᵃ[X]ᵇ</b> is calculated. If <b>Q &lt; Ksp</b> the solution is unsaturated; if <b>Q = Ksp</b>, it is saturated; if <b>Q &gt; Ksp</b> it is supersaturated and the amount needed to return to Q = Ksp <b>precipitates</b>. Move the control to see how the solid appears.</p>"],
      ["Selective precipitation", "Selective", "With 0.1 M I⁻ and Cl⁻ and increasing Ag⁺, AgI precipitates first",
        "<p>With <b>[I⁻] = [Cl⁻] = 0.1 M</b>, Ag⁺ is added. AgI (Ksp = " + sci(KI) + ") precipitates at [Ag⁺] ≈ 8.5×10⁻¹⁶ M; AgCl only when [Ag⁺] reaches 1.8×10⁻⁹ M. When AgCl starts, the residual [I⁻] is Ksp(AgI)/[Ag⁺] ≈ <b>4.7×10⁻⁸ M</b>: 99.99995 % of the iodide has already precipitated. This is how ions are separated by <b>fractional precipitation</b>.</p>"]
    ];
  }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var def = {
    key: 'solubilidad-kps', title: "Solubility and Ksp", subtitle: "3D Simulator · general chemistry", accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 5, 16], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 3, 17], target: [0, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 16, 3], target: [0, 2, 0] }],
    layers: [{ id: 'ions', label: "Dissolved ions", icon: '⊕' }, { id: 'solid', label: "Solid", icon: '▦' }],
    build: function (ctx) {
      var s = ctx.scene, g = new T.SphereGeometry(1, 12, 9), box = new T.BoxGeometry(1, 1, 1);
      var mk = function (c, n) { var m = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: c, roughness: 0.4 }), n); m.frustumCulled = false; s.add(m); return m; };
      cat = mk(0x4f8bff, NI); an = mk(0x37b24d, NI); ex = mk(0xcc5de8, NI);
      sol = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.7 }), NS); sol.frustumCulled = false; s.add(sol);
      solB = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.7 }), NS); solB.frustumCulled = false; s.add(solB);
      dm = new T.Object3D();
      var gl = new T.Mesh(new T.CylinderGeometry(4.2, 4.0, 7, 32, 1, true), new T.MeshBasicMaterial({ color: 0xaecbe6, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })); gl.position.y = 3.5; s.add(gl);
      var lq = new T.Mesh(new T.CylinderGeometry(4.1, 3.95, 5.6, 32), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.12, depthWrite: false })); lq.position.y = 2.9; s.add(lq);
      var fl = new T.Mesh(new T.CylinderGeometry(4.0, 4.0, 0.15, 32), new T.MeshStandardMaterial({ color: 0x495057, roughness: 0.6 })); fl.position.y = -0.05; s.add(fl);
      for (var i = 0; i < NI * 2; i++) seeds.push([Math.random(), Math.random(), Math.random(), Math.random() * 6.28]);
      ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P;
      if (!P.manual) {
        var i = f.i, l = f.local; S.mode = i === 5 ? 'sel' : 'norm';
        if (i === 0) { S.salt = 'AgCl'; S.lc = -6; S.pH = 7; S.rat = 0; }
        else if (i === 1) { S.salt = SALTS[Math.min(2, Math.floor(l * 3))].id; S.lc = -6; S.pH = 7; S.rat = 0; }
        else if (i === 2) { S.salt = 'AgCl'; S.lc = -5 + 5 * sm(l); S.pH = 7; S.rat = 0; }
        else if (i === 3) { S.salt = ['CaF2', 'CaCO3', 'MgOH2'][Math.min(2, Math.floor(l * 3))]; S.lc = -6; S.pH = 1 + 12 * ((l * 3) % 1); S.rat = 0; }
        else if (i === 4) { S.salt = 'AgCl'; S.lc = -6; S.pH = 7; S.rat = -3 + 6 * l; }
        else { S.T = 0.2 * sm(l); }
      }
      var s = SID[S.salt], now = ctx.now, nc, na, ne, fs, fsB = 0, sg = 0, ionOn = ctx.layer('ions'), sOn = ctx.layer('solid');
      var cols = { cat: 0x4f8bff, an: 0x37b24d };
      if (S.mode === 'sel') {
        var r = sel(S.T); nc = Math.max(1, Math.round(6 * Math.min(1, Math.log10(r.Ag / 1e-17 + 1) / 10))); na = Math.round(NI * r.Cl / 0.1 * 0.8); ne = Math.round(NI * r.I / 0.1 * 0.8); if (r.I > 0 && ne < 1) ne = 1; fs = Math.min(1, r.pC / 0.1); fsB = Math.min(1, r.pI / 0.1);
        cat.material.color.setHex(0xadb5bd); an.material.color.setHex(0x37b24d); ex.material.color.setHex(0xcc5de8); sol.material.color.setHex(0xe9ecef);
      } else {
        var c = cc(), sv = solub(s, c, S.pH), vis = function (x) { return Math.max(0, Math.min(1, (Math.log10(Math.max(x, 1e-12)) + 9) / 9)); };
        cat.material.color.setHex(0x4f8bff); an.material.color.setHex(0x37b24d); ex.material.color.setHex(0xcc5de8); sol.material.color.setHex(s.col);
        var Q = S.rat, fr = Q > 0 ? 1 - Math.pow(10, -Q) : 0, cat_c = s.a * sv, ratioQ = Math.pow(10, Q);
        var effv = Q < 0 ? sv * Math.pow(ratioQ, 1 / (s.a + s.b)) : sv;
        nc = Math.round(6 + 60 * vis(effv)); na = Math.round(nc * s.b / s.a); if (na > NI) na = NI; ne = c > 0 ? Math.round(Math.min(NI, 8 + 55 * Math.min(1, (Math.log10(c) + 6) / 6))) : 0;
        fs = S.mode === 'norm' && ctx.P && S._st !== 4 && (P.manual || f.i !== 4) ? 0.55 : 0.55;
        if (!P.manual ? f.i === 4 : S.fq) fs = fr > 0 ? 0.15 + 0.8 * fr : (Q < 0 ? 0 : 0.1); if (!P.manual && f.i !== 4 && !S.fq) fs = 0.55;
      }
      if (S.mode === 'norm') {
        // aniones: si hay ion común en solución, el anión extra se pinta violeta
        // (se muestra con el pool ex)
      }
      var R = 3.3, ymin = 0.8, ymax = 5.2;
      function put(m, n, off, spread) { for (var i = 0; i < NI; i++) { if (i >= n || !ionOn) { dm.scale.setScalar(0.0001); dm.position.set(0, -9, 0); } else { var sd = seeds[i + off], r = R * Math.sqrt(sd[0]) * 0.97, th = sd[1] * 6.283 + Math.sin(now * 0.5 + sd[3]) * 0.4; dm.position.set(r * Math.cos(th) + 0.18 * Math.sin(now * 1.3 + sd[3] * 2), ymin + (ymax - ymin) * sd[2] + 0.2 * Math.sin(now * 1.1 + sd[3]), r * Math.sin(th) + 0.18 * Math.cos(now * 1.2 + sd[3])); dm.scale.setScalar(spread); } dm.updateMatrix(); m.setMatrixAt(i, dm.matrix); } m.instanceMatrix.needsUpdate = true; }
      put(cat, nc, 0, S.mode === 'sel' ? 0.17 : 0.2); put(an, na, 70, 0.3); put(ex, S.mode === 'sel' ? ne : ne, 17, 0.3);
      function pile(m, frac, x0) { var n = Math.round(NS * frac); for (var i = 0; i < NS; i++) { if (i >= n || !sOn) { dm.scale.setScalar(0.0001); dm.position.set(0, -9, 0); } else { var sd = seeds[(i * 3 + 5) % seeds.length], r = 2.6 * Math.sqrt((i + 0.5) / NS) * (x0 === 0 ? 1 : 1); var th = i * 2.4 + x0; dm.position.set(r * Math.cos(th) * (x0 ? 0.9 : 1), 0.2 + 0.18 * (1 - r / 2.6) * 2, r * Math.sin(th) * (x0 ? 0.9 : 1)); dm.rotation.set(sd[0], sd[1] * 3, sd[2]); dm.scale.setScalar(0.28); } dm.updateMatrix(); m.setMatrixAt(i, dm.matrix); dm.rotation.set(0, 0, 0); } m.instanceMatrix.needsUpdate = true; }
      pile(sol, S.mode === 'sel' ? fs : (fs || 0), 1); pile(solB, S.mode === 'sel' ? fsB : 0, 4);
      var txt, ct;
      if (S.mode === 'sel') { var r2 = sel(S.T); lab.t.pos(0, 7.6, 0).set("Ag⁺ added: " + fmt(S.T, 3) + ' mol/L', 'bl-lead').vis(true); lab.a.pos(0, 6.8, 0).set('[Ag⁺] = ' + sci(r2.Ag) + ' M', 'bl-d').vis(true); lab.b.pos(-5.4, 3.5, 0).set('[I⁻] = ' + sci(r2.I) + ' M', 'bl-warn').vis(true); lab.c.pos(5.4, 3.5, 0).set('[Cl⁻] = ' + sci(r2.Cl) + ' M', 'bl-pos').vis(true); lab.d.pos(0, -1.1, 0).set(r2.pC > 0 ? "AgCl (white) also precipitates" : (r2.pI > 0 ? "AgI (yellow) precipitates" : "no precipitate"), 'bl-d').vis(true); }
      else {
        var sv2 = solub(s, cc(), S.pH), Qv = Math.pow(sv2 * s.a, s.a) * Math.pow(alpha(s, S.pH) * (s.b * sv2 + cc()), s.b);
        lab.t.pos(0, 7.6, 0).set(s.n + " · Ksp = " + sci(s.ksp), 'bl-lead').vis(true);
        lab.a.pos(0, 6.8, 0).set('s = ' + sci(sv2) + ' mol/L', 'bl-pos').vis(true);
        lab.b.pos(-5.4, 3.5, 0).set(s.ion[0], 'bl-d').vis(true); lab.c.pos(5.4, 3.5, 0).set(s.ion[1] + (cc() > 0 ? " (+ common ion)" : ''), 'bl-d').vis(true);
        lab.d.pos(0, -1.1, 0).set(S.rat ? 'Q/Kps = ' + sci(Math.pow(10, S.rat)) + (S.rat > 0 ? " → precipitates" : (S.rat < 0 ? " → unsaturated" : " → saturated")) : (cc() > 0 ? "[common ion] = " + sci(cc()) + ' M' : "pure water") + (s.ka || s.oh ? ' · pH ' + f1(S.pH) : ''), 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.salt) u.salt.set(S.salt); if (!ctx.P.manual) { u.lc && u.lc.set(S.lc); u.pH && u.pH.set(S.pH); u.rat && u.rat.set(S.rat); u.T && u.T.set(S.T); } },
    hud: function () {
      if (S.mode === 'sel') { var r = sel(S.T); return { eq: { chip: "Ksp", name: 'AgI vs AgCl', body: "<div class=\"eqline\"><small>Ksp AgI</small>" + sci(KI) + "</div><div class=\"eqline\"><small>Ksp AgCl</small>" + sci(KC) + '</div><div class="eqline"><small>[Ag⁺]</small>' + sci(r.Ag) + " M</div><div class=\"eqline\"><small>residual [I⁻]</small>" + sci(r.I) + ' M</div>' }, legend: [{ label: 'Ag⁺', color: '#adb5bd', text: "silver" }, { label: 'I⁻', color: '#cc5de8', text: "iodide" }, { label: 'Cl⁻', color: '#37b24d', text: "chloride" }] }; }
      var s = SID[S.salt], sv = solub(s, cc(), S.pH);
      return { eq: { chip: "Ksp", name: s.n + '(s) ⇌ ' + s.a + s.ion[0] + ' + ' + s.b + s.ion[1], body: "<div class=\"eqline\"><small>Ksp</small>" + sci(s.ksp) + '</div><div class="eqline"><small>s</small>' + sci(sv) + ' mol/L</div><div class="eqline"><small>g/L</small>' + sci(sv * (s.mm || 1)) + '</div>' }, legend: [{ label: s.ion[0], color: '#4f8bff', text: "cation" }, { label: s.ion[1], color: '#37b24d', text: "anion" }, { label: "Solid", color: '#e9ecef', text: "precipitate" }] };
    },
    measures: function () { if (S.mode === 'sel') { var r = sel(S.T); return [["Ag⁺ added", fmt(S.T, 3) + ' M'], ['[Ag⁺]', sci(r.Ag) + ' M'], ['[I⁻]', sci(r.I) + ' M'], ['[Cl⁻]', sci(r.Cl) + ' M'], ["AgI precipitated", fmt(r.pI * 100 / 0.1, 0) + ' %'], ["AgCl precipitated", fmt(r.pC * 100 / 0.1, 0) + ' %']]; } var s = SID[S.salt], sv = solub(s, cc(), S.pH); return [["Salt", s.n], ["Ksp", sci(s.ksp)], ['s (mol/L)', sci(sv)], ['pKps', f2(-Math.log10(s.ksp))], ["[common ion]", cc() ? sci(cc()) + ' M' : '—'], ['pH', f1(S.pH)], ['Q/Kps', sci(Math.pow(10, S.rat))]]; },
    ideas: ["<b>Ksp = [M]ᵃ[X]ᵇ</b>; it is compared with Q to predict precipitation.", "<b>s</b> depends on the stoichiometry: aᵃbᵇ·s^(a+b) = Ksp.", "<b>Common ion</b>: lowers the solubility (s ≈ Ksp/c).", "<b>pH</b>: increases the solubility of salts with basic anions in acidic medium.", "<b>Selective precipitation</b> separates ions with very different Ksp."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Salt and solution"); el.appendChild(c);
      ui.salt = kit.ui.options({ label: "Salt", cols: 3, value: S.salt, options: SALTS.map(function (x) { return { v: x.id, label: x.n, sub: "Ksp " + sci(x.ksp) }; }), onChange: function (v) { ctx.goManual(); S.mode = 'norm'; S.fq = false; S.salt = v; } }); c.appendChild(ui.salt);
      ui.lc = kit.ui.slider({ label: "Common ion (log₁₀ M)", min: -6, max: 0, step: 0.1, value: S.lc, format: function (v) { return v <= -6 ? "none" : '10^' + f1(v) + ' M'; }, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.lc = v; } });
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.1, value: S.pH, format: f1, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.pH = v; } });
      ui.rat = kit.ui.slider({ label: "Q / Ksp (log₁₀)", min: -3, max: 3, step: 0.1, value: S.rat, format: function (v) { return '10^' + f1(v); }, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.fq = true; S.rat = v; } });
      c.appendChild(kit.ui.sliders([ui.lc, ui.pH, ui.rat]));
      var d = kit.ui.card("Selective precipitation"); el.appendChild(d);
      ui.T = kit.ui.slider({ label: "Ag⁺ added", min: 0, max: 0.2, step: 0.002, value: S.T, format: function (v) { return fmt(v, 3) + ' M'; }, onInput: function (v) { ctx.goManual(); S.mode = 'sel'; S.T = v; } }); d.appendChild(kit.ui.sliders([ui.T]));
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { S.fq = false; ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Solubility versus common ion", h: 220, note: "log₁₀ s according to [common ion]. At high concentrations s ≈ Ksp/c.", draw: function (cx, w, h, col) {
        var s = SID[S.salt], L = 44, R = 10, Tp = 10, B = 30, pw = w - L - R, ph = h - Tp - B, xs = function (v) { return L + pw * (v + 6) / 6; }, pts = [], i, mn = 1, mx = -30;
        for (i = 0; i <= 60; i++) { var lc = -6 + 6 * i / 60, y = Math.log10(solub(s, lc <= -6 ? 0 : Math.pow(10, lc), S.pH)); pts.push([lc, y]); mn = Math.min(mn, y); mx = Math.max(mx, y); }
        var lo = Math.floor(mn) - 0.5, hi = Math.ceil(mx) + 0.5, ys = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = Math.ceil(lo); i <= hi; i += Math.max(1, Math.round((hi - lo) / 5))) { cx.beginPath(); cx.moveTo(L, ys(i)); cx.lineTo(L + pw, ys(i)); cx.stroke(); cx.fillText(i, L - 5, ys(i) + 3); }
        cx.textAlign = 'center'; cx.fillText("log [common ion]   ·   log s", L + pw / 2, h - 4); cx.strokeStyle = '#22d3ee'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (p, k) { if (k) cx.lineTo(xs(p[0]), ys(p[1])); else cx.moveTo(xs(p[0]), ys(p[1])); }); cx.stroke(); cx.lineWidth = 1;
        var cur = Math.log10(solub(s, cc(), S.pH)); cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(xs(S.lc), ys(cur), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: "Solubility versus pH", h: 220, note: "The curve rises at low pH for F⁻ and CO₃²⁻ (conjugate bases) and falls at high pH for Mg(OH)₂.", draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 30, pw = w - L - R, ph = h - Tp - B, xs = function (v) { return L + pw * v / 14; }, i, j, all = [];
        var data = ['CaF2', 'CaCO3', 'MgOH2', 'AgCl'].map(function (id) { var s = SID[id], arr = []; for (i = 0; i <= 28; i++) arr.push(Math.log10(solub(s, 0, i / 2))); all = all.concat(arr); return [s, arr]; });
        var lo = Math.floor(Math.min.apply(null, all)) - 0.5, hi = Math.min(0, Math.ceil(Math.max.apply(null, all)) + 0.5), ys = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); }, cl = ['#ff6b6b', '#fcc419', '#4dabf7', '#adb5bd'];
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = Math.ceil(lo); i <= hi; i += Math.max(1, Math.round((hi - lo) / 5))) { cx.beginPath(); cx.moveTo(L, ys(i)); cx.lineTo(L + pw, ys(i)); cx.stroke(); cx.fillText(i, L - 5, ys(i) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 14; i += 2) cx.fillText(i, xs(i), h - B + 13); cx.fillText('pH   ·   log s', L + pw / 2, h - 4);
        data.forEach(function (d, k) { cx.strokeStyle = cl[k]; cx.lineWidth = d[0].id === S.salt ? 3.2 : 1.6; cx.beginPath(); d[1].forEach(function (v, j) { if (j) cx.lineTo(xs(j / 2), ys(v)); else cx.moveTo(xs(0), ys(v)); }); cx.stroke(); cx.fillStyle = cl[k]; cx.textAlign = 'left'; cx.fillText(d[0].n, L + 6 + k * 66, Tp + 10); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'sel') { var r = sel(S.T); return "<div class=\"card-kicker\">AgI and AgCl with increasing Ag⁺</div><div class=\"calc-step\">1 · [Ag⁺] at the start of each precipitation</div><table class=\"calc-table\">" + row('AgI', KI + ' / 0,1 = <b>' + sci(KI / 0.1) + ' M</b>') + row('AgCl', KC + ' / 0,1 = <b>' + sci(KC / 0.1) + ' M</b>') + "</table><div class=\"calc-step\">2 · [I⁻] when AgCl starts</div><table class=\"calc-table\">" + row('[I⁻]', "Ksp(AgI)/[Ag⁺] = <b>" + sci(KI / (KC / 0.1)) + ' M</b>') + row("Fraction remaining", sci(KI / (KC / 0.1) / 0.1)) + "</table><p class=\"muted small\">Now: [Ag⁺] = " + sci(r.Ag) + ' M · [I⁻] = ' + sci(r.I) + ' M.</p>'; }
      var s = SID[S.salt], c = cc(), sv = solub(s, c, S.pH), pf = Math.pow(s.a, s.a) * Math.pow(s.b, s.b), s0 = Math.pow(s.ksp / pf, 1 / (s.a + s.b));
      return '<div class="card-kicker">' + s.n + '(s) ⇌ ' + s.a + ' ' + s.ion[0] + ' + ' + s.b + ' ' + s.ion[1] + "</div><div class=\"calc-step\">1 · Solubility in pure water</div><table class=\"calc-table\">" + row("Ksp", sci(s.ksp) + ' = ' + pf + ' s^' + (s.a + s.b)) + row('s', "(Ksp / " + pf + ')^(1/' + (s.a + s.b) + ') = <b>' + sci(s0) + ' mol/L</b>') + '</table>' +
        "<div class=\"calc-step\">2 · Current conditions</div><table class=\"calc-table\">" + row("Common ion", c ? sci(c) + ' M' : '—') + row('pH', f1(S.pH) + (s.ka ? " (pKa of conjugate acid " + s.pKa + " → free fraction α = " + sci(alpha(s, S.pH)) + ')' : '')) + row('s', '<b>' + sci(sv) + ' mol/L</b> (' + fmt(sv / s0, 2) + " × that of pure water)") + '</table>';
    },
    quiz: [
      { q: "What is the Ksp expression for Ca₃(PO₄)₂?", options: ['[Ca²⁺]³[PO₄³⁻]²', '[Ca²⁺][PO₄³⁻]', '[Ca²⁺]²[PO₄³⁻]³', '[Ca₃(PO₄)₂]'], answer: 0, why: "Each concentration is raised to its coefficient; the solid does not appear." },
      { q: "The molar solubility of AgCl (Ksp = 1.8×10⁻¹⁰) is…", options: ['1,3×10⁻⁵ M', '1,8×10⁻¹⁰ M', '9,0×10⁻¹¹ M', '3,6×10⁻¹⁰ M'], answer: 0, why: "s = √Ksp = 1.3×10⁻⁵ M." },
      { q: "When NaCl is added to a saturated solution of AgCl, the solubility…", options: ["decreases (common ion)", "increases", "does not change", "doubles"], answer: 0, why: "Common-ion effect: the equilibrium shifts toward the solid." },
      { q: "Which salt dissolves more as the pH drops?", options: ['CaF₂', 'AgCl', 'BaSO₄', 'AgI'], answer: 0, why: "F⁻ is the conjugate base of a weak acid (HF); Cl⁻, SO₄²⁻ (almost) and I⁻ do not react significantly." },
      { q: "If Q > Ksp…", options: ["solid precipitates", "more solid dissolves", "the solution is unsaturated", "Ksp increases"], answer: 0, why: "The solution is supersaturated and the excess precipitates until Q = Ksp." },
      { q: "For Mg(OH)₂, when the pH rises the solubility…", options: ["decreases", "increases", "does not change", "always drops to zero"], answer: 0, why: "More OH⁻ in solution: common-ion effect." },
      { q: "With [I⁻] = [Cl⁻] = 0.1 M and increasing Ag⁺, the first to precipitate is…", options: ["AgI (lower Ksp)", 'AgCl', "both at the same time", "none"], answer: 0, why: "With the same anion concentration and 1:1 stoichiometry, the one with the lower Ksp precipitates first." },
      { q: "Two salts with different stoichiometries are compared…", options: ["by their molar solubility s, not by Ksp", "always by Ksp", "by their molar mass", "by color"], answer: 0, why: "Ksp = aᵃbᵇ·s^(a+b) depends on the stoichiometry." }
    ],
    help: { intro: "Choose the salt and move common ion, pH and Q/Ksp in “Lab”. Blue dots are cations, green ones anions and purple ones the extra ion or iodide; the small cubes at the bottom are the solid.", items: [["Common ion", "adds an ion of the salt."], ['pH', "affects basic anions."], ['Q/Kps', "above 1 it precipitates."], ["Ag⁺ added", "selective precipitation of AgI/AgCl."]] }
  };
  MSim.create(def);
})();
