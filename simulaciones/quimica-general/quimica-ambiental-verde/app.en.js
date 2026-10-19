/* Química ambiental y química verde — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var RX = [
    { n: "Diels–Alder (butadiene + ethene)", ae: 100, mw: [54.09, 28.05], mp: 82.14, note: "cycloaddition: all atoms go into the product", sector: "organic synthesis" },
    { n: "Hydrogenation of ethene", ae: 100, mw: [28.05, 2.02], mp: 30.07, note: "addition: 100 % atom economy", sector: "petrochemistry" },
    { n: 'Haber–Bosch (N₂ + 3H₂ → 2NH₃)', ae: 100, mw: [28.01, 6.05], mp: 34.06, note: "uses all the atoms (but high energy cost)", sector: "basic chemistry" },
    { n: "SN2: bromoethane + NaOH", ae: 30.9, mw: [108.97, 40.0], mp: 46.07, note: "substitution: generates NaBr as waste", sector: "organic synthesis" },
    { n: "Wittig (cyclohexanone + Ph₃P=CH₂)", ae: 25.7, mw: [98.14, 276.3], mp: 96.17, note: "Ph₃P=O (278 g/mol) is an enormous waste", sector: "fine chemistry" },
    { n: "Ibuprofen, Boots synthesis (6 steps)", ae: 40, mw: [], mp: 206.3, note: "classic route with a lot of waste", sector: "pharmaceutical" },
    { n: "Ibuprofen, BHC process (3 steps)", ae: 77, mw: [], mp: 206.3, note: "catalysis (HF recovered, Raney-Ni, Pd): 1997 green chemistry award", sector: "pharmaceutical" }
  ];
  var PR = ["Prevent waste", "Atom economy", "Less hazardous syntheses", "Designing safer products", "Safer solvents and auxiliaries", "Energy efficiency", "Renewable feedstocks", "Avoid unnecessary derivatives", "Catalysis", "Design for degradation", "Real-time analysis", "Inherently safer chemistry"];
  var SEC = [["Petrochemistry", 0.1], ["Basic chemistry", 3], ["Fine chemistry", 20], ["Pharmaceutical", 60]];
  var S = { mode: 'oz', cl: 0.5, co2: 420, so2: 10, rx: 0, y: 90, solv: 5, p: 0 }, g = null, lab = [], earth = null, atmo = null, oz = [], ir = [], drops = [], lake = null, bars = [], rays = [];
  function ozone() { return Math.max(5, 100 - 62 * Math.pow(S.cl, 0.9)); }
  function forcing(c) { return 5.35 * Math.log(c / 280); }
  function dT(c) { return 0.8 * forcing(c); }
  function ph() { return -Math.log10(Math.pow(10, -5.6) + 2.4e-6 * S.so2); }
  function efac() { var r = RX[S.rx], ae = r.ae / 100, y = S.y / 100; return (1 / (ae * y) - 1) + S.solv; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function stages() {
    return [
      ["The ozone layer", "Ozone", "O₃ absorbs UV-B and UV-C in the stratosphere; CFCs destroy it catalytically",
        "<p>In the stratosphere (15–35 km) the Chapman cycle produces and destroys <b>O₃</b>: <b>O₂ + hν(UV) → 2O</b>; <b>O + O₂ → O₃</b>; <b>O₃ + hν → O₂ + O</b>. Ozone absorbs harmful UV radiation. <b>Chlorofluorocarbons (CFCs)</b> release <b>Cl·</b> under UV light: <b>Cl· + O₃ → ClO· + O₂</b>; <b>ClO· + O → Cl· + O₂</b>. Cl· is regenerated: a single atom destroys ~10⁵ O₃ molecules. The <b>Montreal Protocol</b> banned CFCs.</p>"],
      ["Greenhouse effect", "Greenhouse", "CO₂, CH₄, N₂O and H₂O absorb Earth's infrared and re-emit it",
        "<p>The Earth receives visible light and emits <b>infrared</b>. <b>Greenhouse gases</b> (CO₂, CH₄, N₂O, H₂O) absorb that IR (through molecular vibrations that change the dipole moment) and re-emit it toward the surface: without them the mean T would be ≈ −18 °C instead of +15 °C. More CO₂ increases the <b>radiative forcing</b> ΔF = 5.35·ln(C/C₀) W/m² (C₀ = 280 ppm).</p>"],
      ["Acid rain", "Acid rain", "SO₂ and NOₓ are oxidized and form H₂SO₄ and HNO₃ dissolved in the droplets",
        "<p>Normal rain has pH ≈ 5.6 because of dissolved CO₂. <b>SO₂</b> (from burning coal and oil) is oxidized to SO₃ and forms <b>H₂SO₄</b>; engine <b>NOₓ</b> form <b>HNO₃</b>. Acid rain (pH &lt; 5.6) damages forests, acidifies lakes, corrodes marble (CaCO₃ + H₂SO₄ → CaSO₄) and mobilizes toxic Al³⁺. It is mitigated with flue-gas desulfurization and catalytic converters.</p>"],
      ["Green chemistry: atom economy", "Atom economy", "AE = M(product) / ΣM(reactants) × 100",
        "<p><b>Green chemistry</b> seeks to design processes that reduce or eliminate hazardous substances. A key indicator is <b>atom economy</b>: <b>AE = (molar mass of the desired product)/(sum of the molar masses of the reactants) × 100</b>. Additions and cycloadditions (Diels–Alder, hydrogenation) reach 100 %; substitutions and Wittig reactions, much less. Choose a route in the panel.</p>"],
      ["E-factor and the 12 principles", "E-factor", "E = kg of waste / kg of product: pharmaceutical 25–100, petrochemistry < 0.1",
        "<p>The <b>E-factor</b> (Sheldon) is <b>kg of waste per kg of product</b>. It depends on atom economy, <b>yield</b> and solvents. It ranges from &lt; 0.1 in petrochemistry to 25–100 in the pharmaceutical industry. The <b>12 principles of green chemistry</b> (Anastas and Warner) guide design: prevention, atom economy, safer solvents, catalysis, energy efficiency, renewable feedstocks, degradability…</p>"]
    ];
  }
  var def = {
    key: 'quimica-ambiental-verde', title: "Environmental and Green Chemistry", subtitle: "3D Simulator · general chemistry", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [0, 8, 24], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 26], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 26, 3], target: [0, 0, 0] }],
    layers: [{ id: 'a', label: "Molecules / rays", icon: '✦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      earth = new T.Mesh(new T.SphereGeometry(5, 32, 24), new T.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.8 })); earth.position.set(0, -7, 0); g.add(earth);
      var oc = new T.Mesh(new T.SphereGeometry(5.02, 32, 24), new T.MeshStandardMaterial({ color: 0x1c7ed6, transparent: true, opacity: 0.55 })); oc.position.copy(earth.position); g.add(oc);
      atmo = new T.Mesh(new T.SphereGeometry(7.2, 32, 24), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.12, depthWrite: false })); atmo.position.copy(earth.position); g.add(atmo);
      for (i = 0; i < 40; i++) { var o = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x69db7c })); o.userData = { a: Math.random() * 6.28, b: Math.random() * 1.2 + 0.1, r: 6.0 + Math.random() * 0.8 }; g.add(o); oz.push(o); }
      for (i = 0; i < 24; i++) { var r = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.4, 6), new T.MeshBasicMaterial({ color: 0xff6b6b })); r.userData = { a: -0.6 + 1.2 * (i / 24) * 1.0 + 0, o: i / 24 }; g.add(r); ir.push(r); }
      for (i = 0; i < 40; i++) { var d = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0x74c0fc })); d.userData = { x: -9 + Math.random() * 18, o: Math.random() }; g.add(d); drops.push(d); }
      lake = new T.Mesh(new T.BoxGeometry(20, 0.8, 6), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.7 })); lake.position.set(0, -7, 0); g.add(lake);
      for (i = 0; i < 4; i++) { var b = new T.Mesh(new T.BoxGeometry(2.4, 1, 2.4), new T.MeshStandardMaterial({ color: [0x4dabf7, 0x40c057, 0xfa5252, 0xfab005][i] })); b.visible = false; g.add(b); bars.push(b); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = ['oz', 'oz', 'gh', 'ac', 'gc'][i === 1 ? 2 : (i === 2 ? 3 : i)] || 'oz'; S.mode = ['oz', 'gh', 'ac', 'gc', 'gc'][i]; if (i === 0) S.cl = f.local; if (i === 1) S.co2 = 280 + 520 * f.local; if (i === 2) S.so2 = 80 * f.local; if (i === 3) { S.rx = Math.min(6, Math.floor(f.local * 7)); S.y = 90; S.solv = 0; } if (i === 4) { S.rx = 6 - Math.min(2, Math.floor(f.local * 3)); S.solv = 5 * (1 - f.local); S.y = 90; } }
      lab.forEach(function (l) { l.vis(false); }); oz.forEach(function (o) { o.visible = false; }); ir.forEach(function (r) { r.visible = false; }); drops.forEach(function (d) { d.visible = false; }); lake.visible = false; bars.forEach(function (b) { b.visible = false; }); earth.visible = S.mode !== 'gc'; atmo.visible = S.mode !== 'gc'; earth.parent.children[1].visible = S.mode !== 'gc';
      var aOn = ctx.layer('a'); earth.rotation.y = now * 0.1;
      if (S.mode === 'oz') {
        var o3 = ozone(), nO = Math.round(40 * o3 / 100); oz.forEach(function (o, j) { o.visible = aOn && j < nO; var u = o.userData, a = u.a + now * 0.1; o.position.set(Math.cos(a) * u.r * 1.1, -7 + Math.sin(a * 1.0 + u.b) * 5.6 + 0.6 * Math.sin(now + j), Math.sin(a * 1.7) * 3); o.position.set(earth.position.x + 6.4 * Math.cos(a) * Math.cos(u.b - 0.6), earth.position.y + 6.4 * Math.sin(a) * Math.cos(u.b - 0.6) * 0 + 6.4 * Math.sin(u.b - 0.6) + 0.0, 6.4 * Math.sin(a) * Math.cos(u.b - 0.6)); });
        ir.forEach(function (r, j) { r.visible = aOn; var uv = (now * 0.5 + j / ir.length) % 1; r.position.set(-9 + 18 * (j / ir.length), 12 - uv * 16.5, 0); r.material.color.setHex(0xb197fc); r.visible = aOn && (r.position.y > earth.position.y + 5.3); var abs = (o3 / 100); if (r.position.y < 6.5 && r.position.y > 4) r.scale.y = 0.4 + 0.6 * (1 - abs) + 0.2; else r.scale.y = 1; });
        lab[0].pos(0, 11.5, 0).set("Solar UV crosses the stratosphere", 'bl-lead').vis(true); lab[1].pos(8, 1.5, 0).set("O₃ layer: " + fmt(o3, 0) + " % of the original value", o3 < 70 ? 'bl-neg' : 'bl-pos').vis(true); lab[2].pos(0, -13.5, 0).set("Catalytic Cl·: " + fmt(S.cl * 3, 1) + " ppb of stratospheric Cl", 'bl-d').vis(true);
      } else if (S.mode === 'gh') {
        var df = forcing(S.co2), t = dT(S.co2), f2 = Math.min(1, Math.max(0, (S.co2 - 280) / 600));
        ir.forEach(function (r, j) { r.material.color.setHex(0xff6b6b); r.visible = aOn; var u = (now * 0.4 + j / ir.length) % 1, y0 = earth.position.y + 5.2; if (u < 0.55 + 0 * f2) { r.position.set(-8 + 16 * (j / ir.length), y0 + u * 14, 0); r.rotation.z = 0; } else { var back = (j % 24) / 24 < 0.2 + 0.7 * f2; if (back) { r.position.set(-8 + 16 * (j / ir.length), y0 + 7.7 - (u - 0.55) * 8, 0); r.material.color.setHex(0xffa94d); } else { r.position.set(-8 + 16 * (j / ir.length), y0 + u * 14, 0); } } });
        earth.material.color.setRGB(0.18 + 0.5 * f2, 0.62 - 0.35 * f2, 0.27 - 0.1 * f2); atmo.material.color.setRGB(0.45 + 0.55 * f2, 0.75 - 0.4 * f2, 1 - 0.7 * f2); atmo.material.opacity = 0.12 + 0.12 * f2;
        lab[0].pos(0, 11.5, 0).set('CO₂ = ' + fmt(S.co2, 0) + ' ppm · ΔF = ' + fmt(df, 2) + ' W/m² · ΔT ≈ +' + fmt(t, 1) + ' °C', 'bl-lead').vis(true); lab[1].pos(0, -13.5, 0).set("Emitted IR (red) · part re-emitted to the surface (orange)", 'bl-d').vis(true);
      } else if (S.mode === 'ac') {
        var pH = ph(); drops.forEach(function (d) { d.visible = aOn; var u = (now * 0.5 + d.userData.o) % 1; d.position.set(d.userData.x, 9 - u * 15.5, 0); var t = (pH - 3) / 3; d.material.color.setRGB(0.4 + 0.6 * (1 - t), 0.6 + 0.2 * t, 1 - 0.7 * (1 - t) * 0.0); }); lake.visible = true; lake.position.y = -6.5; lake.material.color.setRGB(Math.min(1, 0.2 + (7 - pH) * 0.12), 0.65, Math.max(0.2, 0.95 - (7 - pH) * 0.1)); earth.visible = false; atmo.visible = false; earth.parent.children[1].visible = false;
        lab[0].pos(0, 11.5, 0).set('SO₂ = ' + fmt(S.so2, 0) + " ppb → rain pH = " + fmt(pH, 2), pH < 5.6 ? 'bl-neg' : 'bl-pos').vis(true); lab[1].pos(0, -10, 0).set("SO₂ + ½O₂ + H₂O → H₂SO₄ (normal pH ≈ 5.6)", 'bl-d').vis(true);
      } else {
        var r2 = RX[S.rx], ae = r2.ae / 100, y = S.y / 100, prod = 1, wasteS = (1 / (ae * y) - 1), solvent = S.solv, E = wasteS + solvent; var sc = Math.min(1, 12 / (1 + E)) * 1.0; var tot = prod + wasteS + solvent; var mx = Math.max(tot, 1), hS = 10 / Math.max(mx, 4);
        var hs = [prod * hS, Math.max(0.05, wasteS * hS), Math.max(0.05, solvent * hS)], cum = 0, cols = [0x4dabf7, 0xfa5252, 0xfab005], nm = ["product", "reaction waste", "solvent"];
        hs.forEach(function (h, j) { var b = bars[j]; b.visible = true; b.scale.y = Math.max(0.05, h); b.position.set(-3 + 0, -8 + cum + h / 2, 0); b.scale.x = b.scale.z = 1.4; cum += h; b.position.x = 0; lab[1 + j].pos(3.4, -8 + cum - h / 2, 0).set(nm[j] + ': ' + fmt(j === 0 ? prod : (j === 1 ? wasteS : solvent), 2) + ' kg', 'bl-d').vis(h > 0.2); });
        lab[0].pos(0, 8, 0).set(r2.n + ' · AE = ' + fmt(r2.ae, 1) + ' % · E = ' + fmt(E, 1), E < 5 ? 'bl-pos' : 'bl-neg').vis(true); lab[4].pos(0, -9.4, 0).set("per kg of product", 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cl) u.cl.set(S.cl); if (u.co2) u.co2.set(S.co2); if (u.so2) u.so2.set(S.so2); if (u.rx) u.rx.set(S.rx); },
    hud: function () { if (S.mode === 'oz') return { eq: { chip: 'O₃', name: "Ozone layer", body: "<div class=\"eqline\"><small>Remaining ozone</small>" + fmt(ozone(), 0) + " %</div><div class=\"eqline\"><small>Stratospheric Cl</small>" + fmt(S.cl * 3, 1) + ' ppb</div>' }, legend: [{ label: "Green spheres", color: '#69db7c', text: "O₃ molecules" }] }; if (S.mode === 'gh') return { eq: { chip: 'CO₂', name: "Greenhouse effect", body: '<div class="eqline"><small>CO₂</small>' + fmt(S.co2, 0) + ' ppm</div><div class="eqline"><small>ΔF</small>' + fmt(forcing(S.co2), 2) + ' W/m²</div><div class="eqline"><small>ΔT</small>+' + fmt(dT(S.co2), 1) + ' °C</div>' }, legend: [{ label: "Red", color: '#ff6b6b', text: "emitted infrared" }, { label: "Orange", color: '#ffa94d', text: "re-emitted IR" }] }; if (S.mode === 'ac') return { eq: { chip: fmt(ph(), 1), name: "Acid rain", body: '<div class="eqline"><small>SO₂</small>' + fmt(S.so2, 0) + ' ppb</div><div class="eqline"><small>pH</small>' + fmt(ph(), 2) + '</div>' }, legend: [{ label: "Droplets", color: '#74c0fc', text: "redder = more acidic" }] }; var r = RX[S.rx]; return { eq: { chip: fmt(r.ae, 0) + '%', name: r.n, body: "<div class=\"eqline\"><small>Atom economy</small>" + fmt(r.ae, 1) + " %</div><div class=\"eqline\"><small>E-factor</small>" + fmt(efac(), 1) + "</div><div class=\"eqline\"><small>Typical sector</small>" + r.sector + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "product" }, { label: "Red", color: '#fa5252', text: "reaction waste" }, { label: "Yellow", color: '#fab005', text: "solvent" }] }; },
    measures: function () { if (S.mode === 'oz') return [["Remaining ozone", fmt(ozone(), 0) + ' %'], ["Stratospheric Cl", fmt(S.cl * 3, 1) + ' ppb']]; if (S.mode === 'gh') return [['CO₂', fmt(S.co2, 0) + ' ppm'], ['ΔF', fmt(forcing(S.co2), 2) + ' W/m²'], ["ΔT (sensitivity 0.8 K·m²/W)", '+' + fmt(dT(S.co2), 1) + ' °C']]; if (S.mode === 'ac') return [['SO₂', fmt(S.so2, 0) + ' ppb'], ["Rain pH", fmt(ph(), 2)]]; var r = RX[S.rx]; return [["Route", r.n], ["Atom economy", fmt(r.ae, 1) + ' %'], ["Yield", S.y + ' %'], ["Solvent", fmt(S.solv, 1) + ' kg/kg'], ["E-factor", fmt(efac(), 1)]]; },
    ideas: ["One Cl· destroys ~10⁵ O₃ molecules.", "ΔF = 5.35·ln(C/C₀).", "Normal rain has pH ≈ 5.6.", "Green chemistry: high AE, low E."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Topic"); el.appendChild(c);
      c.appendChild(kit.ui.options({ label: "Scenario", cols: 2, value: S.mode, options: [{ v: 'oz', label: "Ozone" }, { v: 'gh', label: "Greenhouse" }, { v: 'ac', label: "Acid rain" }, { v: 'gc', label: "Green chemistry" }], onChange: function (v) { ctx.goManual(); S.mode = v; } }));
      ui.cl = kit.ui.slider({ label: "Stratospheric chlorine (CFC)", min: 0, max: 1, step: 0.01, value: S.cl, format: function (v) { return fmt(v * 3, 1) + ' ppb'; }, onInput: function (v) { ctx.goManual(); S.mode = 'oz'; S.cl = v; } });
      ui.co2 = kit.ui.slider({ label: "Atmospheric CO₂", min: 280, max: 900, step: 5, value: S.co2, format: function (v) { return v + ' ppm'; }, onInput: function (v) { ctx.goManual(); S.mode = 'gh'; S.co2 = v; } });
      ui.so2 = kit.ui.slider({ label: "SO₂ in the air", min: 0, max: 100, step: 1, value: S.so2, format: function (v) { return v + ' ppb'; }, onInput: function (v) { ctx.goManual(); S.mode = 'ac'; S.so2 = v; } });
      c.appendChild(kit.ui.sliders([ui.cl, ui.co2, ui.so2]));
      var d = kit.ui.card("Green chemistry"); el.appendChild(d); ui.rx = kit.ui.options({ label: "Synthetic route", cols: 1, value: S.rx, options: RX.map(function (r, j) { return { v: j, label: r.n, sub: 'AE ' + r.ae + ' %' }; }), onChange: function (v) { ctx.goManual(); S.mode = 'gc'; S.rx = +v; } }); d.appendChild(ui.rx);
      var sy = kit.ui.slider({ label: "Yield", min: 30, max: 100, step: 1, value: S.y, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'gc'; S.y = v; } });
      var ss = kit.ui.slider({ label: "Solvent (kg / kg product)", min: 0, max: 30, step: 0.5, value: S.solv, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'gc'; S.solv = v; } });
      d.appendChild(kit.ui.sliders([sy, ss])); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Radiative forcing of CO₂", h: 220, note: "ΔF = 5.35·ln(C/280). The dot marks your value.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 300; i <= 900; i += 200) cx.fillText(i, L + pw * (i - 280) / 620, h - B + 14); cx.fillText('CO₂ (ppm)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 6; i += 2) cx.fillText(i, L - 4, Tp + ph * (1 - i / 7) + 3);
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 280; i <= 900; i += 10) { (i > 280 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (i - 280) / 620, Tp + ph * (1 - forcing(i) / 7)); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.co2 - 280) / 620, Tp + ph * (1 - forcing(S.co2) / 7), 5, 0, 6.28); cx.fill();
      } },
      { title: "Rain pH versus SO₂", h: 210, note: "Line: pH 5.6 (clean rain).", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph2 = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 100; i += 20) cx.fillText(i, L + pw * i / 100, h - B + 14); cx.fillText('SO₂ (ppb)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 3; i <= 6; i++) cx.fillText(i, L - 4, Tp + ph2 * (1 - (i - 3) / 3.2) + 3);
        var s0 = S.so2; S.so2 = 0; S.so2 = s0; cx.strokeStyle = '#fa5252'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 100; i += 2) { var p = -Math.log10(Math.pow(10, -5.6) + 2.4e-6 * i); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * i / 100, Tp + ph2 * (1 - (p - 3) / 3.2)); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * S.so2 / 100, Tp + ph2 * (1 - (ph() - 3) / 3.2), 5, 0, 6.28); cx.fill(); cx.strokeStyle = '#69db7c'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph2 * (1 - 2.6 / 3.2)); cx.lineTo(L + pw, Tp + ph2 * (1 - 2.6 / 3.2)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: "Atom economy of different routes", h: 250, note: "Highlighted: the chosen route.", draw: function (cx, w, h, col) {
        var L = 100, Rr = 36, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / RX.length; cx.font = '9.5px system-ui'; RX.forEach(function (r, j) { var y = Tp + j * bh; cx.fillStyle = j === S.rx ? '#ffa94d' : (r.ae > 70 ? '#69db7c' : '#fa5252'); cx.fillRect(L, y + 4, pw * r.ae / 100, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(r.n.length > 24 ? r.n.slice(0, 22) + '…' : r.n, L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(r.ae, 0) + ' %', L + pw * r.ae / 100 + 4, y + bh / 2 + 3); });
      } },
      { title: "E-factor by industrial sector (kg waste/kg product)", h: 190, note: "Typical Sheldon values (logarithmic scale).", draw: function (cx, w, h, col) {
        var L = 90, Rr = 34, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / SEC.length; cx.font = '10px system-ui'; SEC.forEach(function (s, j) { var y = Tp + j * bh, v = Math.log10(s[1] * 100) / Math.log10(10000); cx.fillStyle = '#845ef7'; cx.fillRect(L, y + 5, pw * v, bh - 10); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(s[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText('≈ ' + (s[1] < 1 ? '< 0,1' : (s[1] < 5 ? '1–5' : (s[1] < 30 ? '5–50' : '25–100+'))), L + pw * v + 4, y + bh / 2 + 3); });
      } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'oz') return "<div class=\"card-kicker\">Chlorine catalytic cycle</div><table class=\"calc-table\">" + row("Step 1", 'Cl· + O₃ → ClO· + O₂') + row("Step 2", 'ClO· + O → Cl· + O₂') + row("Net", 'O₃ + O → 2 O₂') + row("Remaining ozone", fmt(ozone(), 0) + ' %') + '</table>'; if (S.mode === 'gh') return "<div class=\"card-kicker\">Radiative forcing</div><table class=\"calc-table\">" + row('ΔF = 5,35·ln(C/C₀)', '5,35 × ln(' + S.co2 + '/280) = <b>' + fmt(forcing(S.co2), 2) + ' W/m²</b>') + row('ΔT ≈ λ·ΔF', '0,8 × ' + fmt(forcing(S.co2), 2) + ' = <b>+' + fmt(dT(S.co2), 1) + ' °C</b>') + row("Doubling (560 ppm)", '+' + fmt(forcing(560), 2) + ' W/m²') + '</table>'; if (S.mode === 'ac') return "<div class=\"card-kicker\">Rain pH</div><table class=\"calc-table\">" + row("Base [H⁺] (CO₂)", "2.5 × 10⁻⁶ M (pH 5.6)") + row("[H⁺] from SO₂", '2 × [H₂SO₄] ≈ ' + (2.4e-6 * S.so2).toExponential(1) + ' M') + row('pH', '<b>' + fmt(ph(), 2) + '</b>') + '</table>'; var r = RX[S.rx]; return '<div class="card-kicker">' + r.n + '</div><table class="calc-table">' + (r.mw.length ? row("Σ M reactants", r.mw.map(function (m) { return fmt(m, 2); }).join(' + ') + ' = ' + fmt(r.mw.reduce(function (a, b) { return a + b; }, 0), 2)) + row("M product", fmt(r.mp, 2)) : '') + row("Atom economy", '<b>' + fmt(r.ae, 1) + ' %</b>') + row("Yield", S.y + ' %') + row("Reaction waste", fmt(1 / (r.ae / 100 * S.y / 100) - 1, 2) + ' kg/kg') + row("Solvent", fmt(S.solv, 1) + ' kg/kg') + row("E-factor", '<b>' + fmt(efac(), 1) + '</b>') + '</table><p class="muted small">' + r.note + '</p>'; },
    quiz: [
      { q: "The Diels–Alder reaction has an atom economy of…", options: ['100 %', '50 %', '25 %', '0 %'], answer: 0, why: "All the atoms go into the product." },
      { q: "CFCs destroy ozone because they release…", options: ["Cl· acting as a catalyst", 'F⁻', 'CO₂', "water"], answer: 0, why: "Cl· is regenerated." },
      { q: "Acid rain is defined by a pH lower than…", options: ['5,6', '7', '4', '3'], answer: 0, why: "Dissolved CO₂ brings it to 5.6." },
      { q: "The E-factor measures…", options: ["kg of waste per kg of product", "the yield", "the energy", "the toxicity"], answer: 0, why: "Sheldon's indicator." },
      { q: "The main gas of sulfuric acid rain is…", options: ['SO₂', 'CH₄', 'N₂', 'O₃'], answer: 0, why: "It is oxidized to H₂SO₄." },
      { q: "A CO₂ increase from 280 to 560 ppm produces a ΔF of…", options: ['≈ 3,7 W/m²', '≈ 1 W/m²', '≈ 10 W/m²', '0'], answer: 0, why: "5.35·ln2." }
    ],
    help: { intro: "Four scenarios: ozone, greenhouse, acid rain and green chemistry. Change the controls (chlorine, CO₂, SO₂, synthetic route) and watch the numbers in the panel.", items: [["Green spheres", 'O₃.'], ["Red rays", 'infrarrojo.']] }
  };
  MSim.create(def);
})();
