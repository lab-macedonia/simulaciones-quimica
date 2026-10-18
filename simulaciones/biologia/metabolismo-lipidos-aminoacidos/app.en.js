/* Metabolismo de lípidos y aminoácidos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var STEP = [["Dehydrogenation (FAD)", "acyl-CoA dehydrogenase: forms the Cα=Cβ double bond and produces FADH₂"], ["Hydration", "enoyl-CoA hydratase: adds H₂O and forms 3-hydroxyacyl-CoA"], ["Dehydrogenation (NAD⁺)", "3-hydroxyacyl-CoA dehydrogenase: oxidizes to ketone and produces NADH"], ["Thiolysis", "thiolase: CoA-SH cleaves and releases acetyl-CoA; the chain becomes 2 C shorter"]];
  var AA = [['Ala', "pyruvate", "glucogenic"], ['Asp', "oxaloacetate", "glucogenic"], ['Glu', "α-ketoglutarate", "glucogenic"], ['Leu', "acetyl-CoA", "ketogenic"], ['Lys', "acetyl-CoA", "ketogenic"], ['Phe', "fumarate + acetoacetate", "mixed"], ['Ile', "succinyl-CoA + acetyl-CoA", "mixed"]];
  var S = { n: 16, p: 0, mode: 'chain', aa: 0 }, g = null, lab = [], atoms = [], bonds = [], acet = [], coa = null, tokens = [], shuttle = null, mem = [], amino = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function cyc() { return S.n / 2 - 1; }
  function atp() { return 7 * S.n - 6; }
  function setCyl(m, a, b, r) { var d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, Math.max(0.001, d.length()), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); }
  function stages() {
    return [
      ["Lipids as fuel", "Overview", "One gram of fat yields ≈ 9 kcal, more than double a carbohydrate",
        "<p><b>Triacylglycerols</b> are the most concentrated energy reserve (≈ 37 kJ/g versus ≈ 17 kJ/g for carbohydrates): they are highly reduced and stored without water. Lipases release <b>fatty acids</b> and glycerol; the fatty acids are oxidized in the <b>mitochondrial matrix</b> by <b>β-oxidation</b>, and amino acids are degraded after removal of the amino group.</p>"],
      ["Activation and transport with carnitine", "Transport", "Acyl-CoA does not cross the inner membrane: it does so as acyl-carnitine",
        "<p>In the cytosol <b>acyl-CoA synthetase</b> activates the fatty acid (RCOO⁻ + CoA + ATP → acyl-CoA + AMP + PPᵢ; <b>2 high-energy bonds</b> are spent). The inner mitochondrial membrane is impermeable to acyl-CoA: <b>CPT-I</b> converts it into <b>acyl-carnitine</b>, which enters through a translocase and <b>CPT-II</b> regenerates it in the matrix. CPT-I is the control point (inhibited by <b>malonyl-CoA</b>).</p>"],
      ["β-oxidation: four reactions per cycle", "β-oxidation", "Dehydrogenation, hydration, dehydrogenation and thiolysis",
        "<p>Each cycle repeats: <b>(1)</b> oxidation with <b>FAD</b> (FADH₂); <b>(2)</b> hydration; <b>(3)</b> oxidation with <b>NAD⁺</b> (NADH); <b>(4)</b> <b>thiolysis</b>, which releases a unit of <b>acetyl-CoA</b> (2 C) and leaves an acyl-CoA two carbons shorter. It repeats until only acetyl-CoA remains. Choose the chain length and advance.</p>"],
      ["ATP balance", "Balance", "A fatty acid of n carbons yields 7n − 6 ATP",
        "<p>A saturated fatty acid of <b>n</b> carbons (n even) requires <b>n/2 − 1</b> cycles and produces <b>n/2 acetyl-CoA</b> (10 ATP each in the Krebs cycle), <b>n/2 − 1 FADH₂</b> (1.5 ATP) and <b>n/2 − 1 NADH</b> (2.5 ATP); 2 ATP are subtracted for activation: <b>ATP = 7n − 6</b>. For palmitate (C16): <b>106 ATP</b>. With excess acetyl-CoA the liver forms <b>ketone bodies</b>.</p>"],
      ["Transamination", "Transamination", "The amino group passes to α-ketoglutarate forming glutamate (coenzyme: PLP)",
        "<p>To degrade an amino acid the amino group is removed first: an <b>aminotransferase</b> with <b>pyridoxal phosphate (PLP, vitamin B₆)</b> transfers the –NH₂ group to <b>α-ketoglutarate</b>, which forms <b>glutamate</b>, and the amino acid becomes its <b>α-keto acid</b>. It is a reversible reaction. Amino acids end up collecting their amino group in glutamate.</p>"],
      ["Urea cycle and carbon skeleton", "Urea", "NH₄⁺ → urea (liver); the skeleton enters the Krebs cycle or ketone bodies",
        "<p>Glutamate releases <b>NH₄⁺</b> (glutamate dehydrogenase), which is toxic and which the liver converts into <b>urea</b> in the <b>urea cycle</b> (consumes 4 high-energy bonds) and is excreted in the urine. Carbon skeletons are classified as <b>glucogenic</b> (give pyruvate or other Krebs intermediates → glucose) and <b>ketogenic</b> (give acetyl-CoA or acetoacetate → ketone bodies). Select the amino acid to see its fate.</p>"]
    ];
  }
  var def = {
    key: 'metabolismo-lipidos-aminoacidos', title: "Lipid and Amino Acid Metabolism", subtitle: "3D Simulator · biochemistry", accent: { dark: '#ff922b', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [2, 4, 24], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 26], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 4], target: [0, 0, 0] }],
    layers: [{ id: 'cof', label: "Coenzymes (FADH₂, NADH)", icon: '⚡' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 24; i++) { var a = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: i === 0 ? 0xff4d4d : 0x56606b })); g.add(a); atoms.push(a); var b = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); g.add(b); bonds.push(b); }
      coa = new T.Mesh(new T.SphereGeometry(0.7, 14, 10), new T.MeshStandardMaterial({ color: 0xe6c229 })); g.add(coa);
      for (i = 0; i < 12; i++) { var t = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), new T.MeshStandardMaterial({ color: i % 2 ? 0x4dabf7 : 0xfab005, emissive: i % 2 ? 0x1c7ed6 : 0xe67700, emissiveIntensity: 0.3 })); g.add(t); tokens.push(t); }
      for (i = 0; i < 3; i++) { var m = new T.Mesh(new T.BoxGeometry(i ? 26 : 26, 0.4, 7), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.4 })); m.position.set(0, -2 + i * 4, 0); m.visible = false; g.add(m); mem.push(m); }
      shuttle = new T.Mesh(new T.OctahedronGeometry(0.7), new T.MeshStandardMaterial({ color: 0xff922b })); g.add(shuttle);
      for (i = 0; i < 5; i++) { var bl = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 1.4), new T.MeshStandardMaterial({ color: [0x4dabf7, 0xffd43b, 0xfab005, 0x69db7c, 0xf06595][i], roughness: 0.5 })); bl.visible = false; g.add(bl); amino.push(bl); }
      for (i = 0; i < 10; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 1 ? 'trans' : (i >= 4 ? 'aa' : 'chain'); S.p = i === 0 ? 0.0 : Math.min(1, f.local * 1.05); if (i === 3) S.n = 4 + 2 * Math.round(f.local * 10); else if (i === 2 || i === 0) S.n = 16; if (i === 5) S.aa = Math.min(6, Math.floor(f.local * 7)); }
      lab.forEach(function (l) { l.vis(false); }); atoms.forEach(function (a) { a.visible = false; }); bonds.forEach(function (b) { b.visible = false; }); tokens.forEach(function (t) { t.visible = false; }); coa.visible = false; shuttle.visible = false; mem.forEach(function (m) { m.visible = false; }); amino.forEach(function (b) { b.visible = false; });
      var q = S.p, cOn = ctx.layer('cof');
      if (S.mode === 'chain') {
        var n = S.n, cy = cyc(), tot = q * cy, c = Math.min(cy - 1e-6, Math.floor(tot)), fr = tot - c, st = Math.min(3, Math.floor(fr * 4)); if (cy < 1) { c = 0; }
        if (q >= 1) { c = cy - 1; fr = 1; st = 3; }
        var pos = [], k; for (k = 0; k < n; k++) pos.push(V(-12 + k * 1.05, (k % 2 ? 0.55 : -0.55) + (k - 2 * (c + (fr > 0.99 ? 1 : 0))) * 0, 0));
        var done = Math.min(c + (st === 3 && fr > 0.9 ? 1 : 0) + (q >= 1 ? 0 : 0), cy);
        for (k = 0; k < n; k++) { var cut = k < 2 * done, a = atoms[k]; a.visible = true; a.position.copy(pos[k]); if (cut) { a.position.y += 3.5 + 0.8 * Math.floor(k / 2); a.position.x = -9 + (Math.floor(k / 2)) * 1.6 + (k % 2) * 0.8; a.material.color.setHex(0xffa94d); } else a.material.color.setHex(k === 2 * done ? 0xff4d4d : 0x56606b); if (k > 0) { var b = bonds[k]; var p0 = atoms[k - 1].position, p1 = a.position; var sameGroup = (k < 2 * done) === (k - 1 < 2 * done); b.visible = sameGroup || (k - 1 < 2 * done && k >= 2 * done && false); if (b.visible) setCyl(b, p0, p1, 0.07); } }
        coa.visible = true; coa.position.set(-13.2 + 2 * done * 0 + 0, 0, 0); coa.position.copy(pos[2 * done] ? pos[2 * done].clone().add(V(-1.4, 0, 0)) : V(0, 0, 0)); coa.scale.setScalar(0.8);
        var nT = Math.min(12, Math.floor(tot * 2 + (st >= 2 ? 0 : 0))); for (k = 0; k < Math.min(12, Math.floor(tot) * 2 + (st >= 0 && fr > 0.25 ? 1 : 0) + (st >= 2 ? 1 : 0)); k++) { var tk = tokens[k]; tk.visible = cOn; tk.position.set(-12 + (k % 6) * 1.0 + 6, -4 - Math.floor(k / 6) * 0.9, 0); }
        lab[0].pos(0, 6.2, 0).set("Fatty acid C" + n + " · cycle " + Math.min(cy, c + 1) + ' de ' + cy, 'bl-lead').vis(true);
        lab[1].pos(0, -7, 0).set(q >= 1 ? "Products: " + (n / 2) + " acetyl-CoA · " + cy + ' FADH₂ · ' + cy + ' NADH' : "Reaction " + (st + 1) + ': ' + STEP[st][0], 'bl-d').vis(true);
        lab[2].pos(2, -5.8, 0).set(q >= 1 ? '' : STEP[st][1], 'bl-d').vis(q < 1);
        lab[3].pos(-9, 5.4, 0).set("acetyl-CoA released: " + done, 'bl-pos').vis(true); lab[4].pos(7, -4, 0).set("⚡ FADH₂ (orange) · NADH (blue)", 'bl-d').vis(cOn);
      } else if (S.mode === 'trans') {
        mem.forEach(function (m, j) { m.visible = j !== 1; m.position.y = -4 + j * 6; }); mem[0].position.y = -5; mem[2].position.y = 4;
        var u = sm(q), x = -8 + 16 * u, yy = 7 - 14 * u; shuttle.visible = true; shuttle.position.set(x * 0.2, yy * 0.9, 0); shuttle.rotation.y = now;
        var stg = u < 0.33 ? "cytosol: acyl-CoA → CPT-I → acyl-carnitine" : (u < 0.66 ? "translocase: crosses the inner membrane" : "matrix: CPT-II regenerates acyl-CoA");
        lab[0].pos(0, 9.5, 0).set("Intermembrane space → mitochondrial matrix", 'bl-lead').vis(true); lab[1].pos(0, -9.5, 0).set(stg, 'bl-d').vis(true); lab[2].pos(11, 7, 0).set('citosol', 'bl-d').vis(true); lab[3].pos(11, 0, 0).set("intermembrane space", 'bl-d').vis(true); lab[4].pos(11, -7, 0).set('matriz', 'bl-d').vis(true);
        mem[0].visible = true; mem[2].visible = true; mem[0].position.y = 4; mem[2].position.y = -4;
      } else {
        var aa = AA[S.aa], t = sm(Math.min(1, q * 1.2)); amino.forEach(function (b, j) { b.visible = true; b.rotation.y = now * 0.2; });
        amino[0].position.set(-8, 2, 0); amino[1].position.set(-8, -2.5, 0); amino[2].position.set(8, 2, 0); amino[3].position.set(8, -2.5, 0); amino[4].position.set(0, 0, 0); amino[0].material.color.setHex(0x4dabf7); amino[1].material.color.setHex(0xffd43b); amino[2].material.color.setHex(0xfab005); amino[3].material.color.setHex(0x69db7c);
        var nh = new T.Vector3(-8 + 16 * t, 2 - 0 * t, 0); amino[4].position.set(nh.x, nh.y + 1.2 * Math.sin(Math.PI * t), 0); amino[4].scale.setScalar(0.5);
        lab[0].pos(-8, 5, 0).set(aa[0] + " (amino acid)", 'bl-lead').vis(true); lab[1].pos(8, 5, 0).set("α-ketoglutarate → glutamate", 'bl-lead').vis(true); lab[2].pos(-8, -5.5, 0).set("α-keto acid: " + aa[1], 'bl-d').vis(true); lab[3].pos(0, 3.4, 0).set("–NH₂ (via PLP)", 'bl-warn').vis(true); lab[4].pos(0, -7.5, 0).set(aa[0] + ' es ' + aa[2] + ": skeleton → " + aa[1], 'bl-pos').vis(true);
        amino[1].visible = true; amino[2].visible = true; amino[3].visible = true;
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.n) u.n.set(S.n); if (u.p && !ctx.P.manual) u.p.set(S.p); if (u.aa) u.aa.set(S.aa); },
    hud: function () { return { eq: { chip: 'C' + S.n, name: "Fatty acid C" + S.n, body: "<div class=\"eqline\"><small>Cycles</small>" + cyc() + "</div><div class=\"eqline\"><small>Acetyl-CoA</small>" + S.n / 2 + '</div><div class="eqline"><small>FADH₂ / NADH</small>' + cyc() + ' / ' + cyc() + "</div><div class=\"eqline\"><small>Net ATP</small>" + atp() + '</div>' }, legend: [{ label: "Orange", color: '#fab005', text: "FADH₂ (1.5 ATP)" }, { label: "Blue", color: '#4dabf7', text: "NADH (2.5 ATP)" }] }; },
    measures: function () { return [["Fatty acid", 'C' + S.n + " saturated"], ["β-oxidation cycles", String(cyc())], ["Acetyl-CoA", String(S.n / 2)], ['FADH₂ / NADH', cyc() + ' / ' + cyc()], ["Net ATP", String(atp())], ["ATP per carbon", fmt(atp() / S.n, 2)]]; },
    ideas: ["n/2 − 1 cycles for a fatty acid of n C.", "Net ATP = 7n − 6 (palmitate: 106).", "CPT-I regulates entry into the mitochondrion.", "Amino acids: transamination → urea and C skeleton."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Fatty acid"); el.appendChild(c);
      ui.n = kit.ui.slider({ label: "No. of carbons", min: 4, max: 24, step: 2, value: S.n, format: function (v) { return 'C' + v; }, onInput: function (v) { ctx.goManual(); S.mode = 'chain'; S.n = v; } });
      ui.p = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.005, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.n, ui.p]));
      c.appendChild(ctx.btnRow([{ t: "β-oxidation", fn: function () { ctx.goManual(); S.mode = 'chain'; } }, { t: "Transport", fn: function () { ctx.goManual(); S.mode = 'trans'; } }, { t: "Amino acids", fn: function () { ctx.goManual(); S.mode = 'aa'; } }]));
      var d = kit.ui.card("Amino acid"); el.appendChild(d); ui.aa = kit.ui.options({ label: "Amino acid", cols: 4, value: S.aa, options: AA.map(function (a, i) { return { v: i, label: a[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'aa'; S.aa = +v; } }); d.appendChild(ui.aa); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Net ATP versus chain length", h: 240, note: "ATP = 7n − 6. Dot: your fatty acid. Reference: glucose ≈ 30–32 ATP.", draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, mx = 170; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 4; i <= 24; i += 4) cx.fillText('C' + i, L + pw * (i - 4) / 20, h - B + 14); cx.textAlign = 'right'; for (i = 0; i <= 150; i += 50) cx.fillText(i, L - 4, Tp + ph * (1 - i / mx) + 3);
      cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 4; i <= 24; i += 2) { (i > 4 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (i - 4) / 20, Tp + ph * (1 - (7 * i - 6) / mx)); } cx.stroke(); cx.lineWidth = 1;
      cx.strokeStyle = '#69db7c'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - 31 / mx)); cx.lineTo(L + pw, Tp + ph * (1 - 31 / mx)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#69db7c'; cx.textAlign = 'left'; cx.fillText('glucosa', L + 4, Tp + ph * (1 - 31 / mx) - 3);
      cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.n - 4) / 20, Tp + ph * (1 - atp() / mx), 5, 0, 6.28); cx.fill();
    } }],
    calc: function () { var n = S.n, cy = cyc(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">C balance" + n + '</div><table class="calc-table">' + row("Cycles", 'n/2 − 1 = ' + cy) + row("Acetyl-CoA", n / 2 + ' × 10 = ' + 5 * n + ' ATP') + row('FADH₂', cy + ' × 1,5 = ' + fmt(1.5 * cy, 1) + ' ATP') + row("NADH", cy + ' × 2,5 = ' + fmt(2.5 * cy, 1) + ' ATP') + row("Activation", '−2 ATP') + row('Total', '<b>' + atp() + ' ATP</b> (7n − 6)') + '</table>'; },
    quiz: [
      { q: "Palmitate (C16) undergoes… cycles of β-oxidation.", options: ['7', '8', '16', '6'], answer: 0, why: 'n/2 − 1 = 7.' },
      { q: "The net ATP of palmitate is…", options: ['106', '129', '32', '12'], answer: 0, why: '7·16 − 6.' },
      { q: "Carnitine transports…", options: ["acyl groups into the matrix", 'glucosa', 'O₂', "NADH"], answer: 0, why: "Acyl-carnitine shuttle." },
      { q: "Transamination requires as coenzyme…", options: ["PLP (vitamin B6)", 'FAD', "biotin", "TPP"], answer: 0, why: "Pyridoxal phosphate." },
      { q: "NH₄⁺ is eliminated mainly as…", options: ['urea', "gaseous ammonia", 'glucosa', "uric acid"], answer: 0, why: "Urea cycle in the liver." },
      { q: "A ketogenic amino acid gives rise to…", options: ["acetyl-CoA", "oxaloacetate", "net glucose", 'urea'], answer: 0, why: "Leucine and lysine." }
    ],
    help: { intro: "Choose the chain length and advance to see each β-oxidation cycle; with the buttons you switch to transport or to amino acids.", items: [["Orange spheres", "acetyl-CoA units released."], ["Cubes", "FADH₂ (orange) and NADH (blue)."]] }
  };
  MSim.create(def);
})();
