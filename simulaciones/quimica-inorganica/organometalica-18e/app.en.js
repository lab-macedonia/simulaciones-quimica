/* Organometálica: regla de 18 electrones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var LT = {
    co: { n: 'CO', e: 2, c: 0x868e96, nm: "carbonyl (η¹)" }, cl: { n: 'Cl', e: 1, c: 0x3ddc5a, nm: "chlorine" }, p: { n: 'PPh₃', e: 2, c: 0xff922b, nm: "triphenylphosphine" }, h: { n: 'H', e: 1, c: 0xf8f9fa, nm: "hydride" },
    cp: { n: 'Cp', e: 5, c: 0xf06595, nm: "cyclopentadienyl (η⁵)" }, ene: { n: 'C₂H₄', e: 2, c: 0x40c057, nm: "ethene (η²)" }, alk: { n: 'R', e: 1, c: 0x20c997, nm: "alkyl (ethyl)" }
  };
  var OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], SP = OCT.slice(0, 4), s3 = 1 / Math.sqrt(3);
  var TBP = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]], TET = [[s3, s3, s3], [s3, -s3, -s3], [-s3, s3, -s3], [-s3, -s3, s3]];
  function fill(arr, t, dirs) { return dirs.map(function (d, i) { return { t: t, d: d }; }); }
  var C = {
    cr: { n: 'Cr(CO)₆', m: 'Cr', g: 6, q: 0, geom: "octahedral", L: fill(0, 'co', OCT), d: "d⁶ · low spin" },
    fe: { n: 'Fe(CO)₅', m: 'Fe', g: 8, q: 0, geom: "trigonal bipyramid", L: fill(0, 'co', TBP), d: 'd⁸' },
    ni: { n: 'Ni(CO)₄', m: 'Ni', g: 10, q: 0, geom: "tetrahedral", L: fill(0, 'co', TET), d: 'd¹⁰' },
    v: { n: 'V(CO)₆', m: 'V', g: 5, q: 0, geom: "octahedral", L: fill(0, 'co', OCT), d: 'd⁵ · 17 e⁻: radical' },
    mn: { n: '[Mn(CO)₆]⁺', m: 'Mn', g: 7, q: 1, geom: "octahedral", L: fill(0, 'co', OCT), d: 'd⁶' },
    fc: { n: "Fe(η⁵-Cp)₂ (ferrocene)", m: 'Fe', g: 8, q: 0, geom: "sandwich", L: [{ t: 'cp', d: [0, 0, 1] }, { t: 'cp', d: [0, 0, -1] }], d: 'd⁶ (Fe²⁺)' },
    vas: { n: 'IrCl(CO)(PPh₃)₂ (Vaska)', m: 'Ir', g: 9, q: 0, geom: "square planar", L: [{ t: 'cl', d: SP[0] }, { t: 'p', d: SP[1] }, { t: 'co', d: SP[2] }, { t: 'p', d: SP[3] }], d: 'd⁸ · 16 e⁻' },
    zeise: { n: '[PtCl₃(C₂H₄)]⁻ (Zeise)', m: 'Pt', g: 10, q: -1, geom: "square planar", L: [{ t: 'cl', d: SP[0] }, { t: 'cl', d: SP[1] }, { t: 'cl', d: SP[2] }, { t: 'ene', d: SP[3] }], d: 'd⁸ · 16 e⁻' },
    wil: { n: 'RhCl(PPh₃)₃ (Wilkinson)', m: 'Rh', g: 9, q: 0, geom: "square planar", L: [{ t: 'cl', d: SP[0] }, { t: 'p', d: SP[1] }, { t: 'p', d: SP[2] }, { t: 'p', d: SP[3] }], d: 'd⁸ · 16 e⁻' }
  };
  function sl(a) { return a.map(function (x, i) { return x ? { t: x, d: OCT[i] } : null; }); }
  var CYC = [
    { n: 'RhCl(PPh₃)₃', ox: 'Rh(I)', L: sl(['cl', 'p', 'p', 'p', null, null]), nm: "starting complex (16 e⁻)" },
    { n: 'RhCl(PPh₃)₂', ox: 'Rh(I)', L: sl(['cl', null, 'p', 'p', null, null]), nm: "active species (14 e⁻)" },
    { n: 'RhClH₂(PPh₃)₂', ox: 'Rh(III)', L: sl(['cl', 'h', 'p', 'p', 'h', null]), nm: "dihydride (16 e⁻)" },
    { n: 'RhClH₂(PPh₃)₂(C₂H₄)', ox: 'Rh(III)', L: sl(['cl', 'h', 'p', 'p', 'h', 'ene']), nm: "coordinated alkene (18 e⁻)" },
    { n: 'RhClH(Et)(PPh₃)₂', ox: 'Rh(III)', L: sl(['cl', 'h', 'p', 'p', 'alk', null]), nm: "alkyl hydride (16 e⁻)" },
    { n: 'RhCl(PPh₃)₂ + C₂H₆', ox: 'Rh(I)', L: sl(['cl', null, 'p', 'p', null, null]), nm: "ethane released (14 e⁻)" }
  ];
  var STEPN = ["Loss of PPh₃ (dissociation)", "Oxidative addition of H₂", "Alkene coordination", "Migratory insertion (H transfer)", "Reductive elimination → alkane"];
  var S = { c: 'cr', cs: 0, q: 0, mode: 'comp', run: false, _st: -1 }, lab = [], grp = null, cnt = [], key_ = '', leave = [], tag = {};
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function count(c) { var e = c.g - c.q, parts = [{ t: 'm', e: c.g }]; if (c.q) parts.push({ t: 'q', e: -c.q }); c.L.forEach(function (l) { e += LT[l.t].e; parts.push({ t: l.t, e: LT[l.t].e }); }); return { e: e, parts: parts }; }
  function cycCount(st) { var e = 9; st.L.forEach(function (l) { if (l) e += LT[l.t].e; }); return e; }
  function stages() {
    return [
      ["The 18-electron rule", "18 rule", "A transition metal reaches stability with 18 valence e⁻: 9 orbitals (5 d + 1 s + 3 p) filled",
        "<p>In <b>organometallic complexes</b> the transition metal tends to surround itself with ligands until it completes <b>18 valence electrons</b>: it fills its <b>nine orbitals</b> (<b>5 d + 1 s + 3 p</b>) with pairs, the “noble gas configuration”. It is the rule analogous to the octet rule. It is obeyed especially with <b>strong-field and π-acceptor</b> ligands (CO, phosphines, alkenes, Cp). There are reasonable exceptions: <b>d⁸ square planar</b> complexes are stable with <b>16 e⁻</b>.</p>"],
      ["How to count electrons", "Counting", "No. of electrons = metal group + ligand contribution − charge",
        "<p><b>Neutral (covalent) method</b>: metal electrons = <b>group number</b> (Cr 6, Fe 8, Ni 10, Rh 9…); each ligand contributes: <b>CO, PR₃, alkene: 2 e⁻</b>; <b>Cl, H, alkyl: 1 e⁻</b>; <b>Cp (η⁵): 5 e⁻</b>; 1 is added for each negative charge and 1 subtracted for each positive one. Example: Cr(CO)₆ = 6 + 6×2 = <b>18</b>. In the 3D panel, each cube is an electron and its color indicates the origin (blue: metal; others: ligands).</p>"],
      ["Metal carbonyls", "Carbonyls", "Cr(CO)₆, Fe(CO)₅, Ni(CO)₄ obey 18 e⁻; V(CO)₆ (17 e⁻) is a radical",
        "<p>Binary carbonyls are the classic example: <b>Ni(CO)₄</b> (10 + 8 = 18, tetrahedral), <b>Fe(CO)₅</b> (8 + 10 = 18, trigonal bipyramid), <b>Cr(CO)₆</b> (6 + 12 = 18, octahedral). <b>V(CO)₆</b> has 17 e⁻: it is a stable radical that is <b>easily reduced</b> to [V(CO)₆]⁻ (18 e⁻) or dimerizes. CO is a σ donor and a <b>π acceptor</b> (M→CO back-donation), which weakens the C≡O bond and strengthens M–C.</p>"],
      ["Ferrocene: η⁵-Cp ligand", "Ferrocene", "Fe + 2 Cp (5 e⁻ each, neutral method) = 18 e⁻: sandwich complex",
        "<p><b>Ferrocene</b>, Fe(η⁵-C₅H₅)₂, has the iron between two cyclopentadienyl rings bound through the <b>five carbons</b> (hapticity η⁵). Neutral count: <b>8 (Fe) + 2 × 5 = 18 e⁻</b>; in the ionic method: Fe²⁺ (d⁶) + 2 Cp⁻ (6 e⁻ each) = 6 + 12 = 18. Very stable, aromatic in the rings: it is a model of <b>sandwich organometallic chemistry</b> and undergoes electrophilic substitution reactions like benzene.</p>"],
      ["16-electron square planar complexes", '16 e⁻ (d⁸)', "Reactive toward oxidative addition: they go to 18 e⁻",
        "<p><b>Square planar d⁸</b> complexes (Ir(I), Rh(I), Pt(II), Pd(II)) have <b>16 e⁻</b>: the d<sub>x²−y²</sub> orbital is empty and there are free sites, so they are <b>coordinatively unsaturated</b> and very reactive. Examples: <b>IrCl(CO)(PPh₃)₂ (Vaska)</b>, <b>[PtCl₃(C₂H₄)]⁻ (Zeise)</b>, <b>RhCl(PPh₃)₃ (Wilkinson)</b>. They can add H₂, alkenes, etc. and go to 18 e⁻ (octahedral d⁶).</p>"],
      ["Wilkinson catalytic cycle", "Catalysis", "Alkene hydrogenation: dissociation → oxidative addition → coordination → insertion → reductive elimination",
        "<p><b>Wilkinson's catalyst</b> hydrogenates alkenes under mild conditions. Cycle: <b>(1)</b> loss of PPh₃ (16 → 14 e⁻); <b>(2)</b> <b>oxidative addition of H₂</b> (Rh(I) → Rh(III), 14 → 16 e⁻); <b>(3)</b> alkene coordination (16 → 18 e⁻); <b>(4)</b> <b>migratory insertion</b> of the alkene into the Rh–H bond (18 → 16 e⁻, forms an alkyl); <b>(5)</b> <b>reductive elimination</b> of the alkane (Rh(III) → Rh(I), 16 → 14 e⁻). The catalyst is regenerated. The steps alternate 14, 16 and 18 e⁻.</p>"]
    ];
  }
  function lig(type, d, scale) {
    var g = new T.Group(), c = LT[type].c, m = function (r, x, y, z, col) { var s = new T.Mesh(new T.SphereGeometry(r, 16, 12), new T.MeshStandardMaterial({ color: col || c, roughness: 0.4 })); s.position.set(x, y, z); g.add(s); return s; };
    var dir = V(d[0], d[1], d[2]).normalize(), up = Math.abs(dir.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0), perp = dir.clone().cross(up).normalize(), perp2 = dir.clone().cross(perp).normalize();
    function at(dist, p1, p2) { return dir.clone().multiplyScalar(dist).addScaledVector(perp, p1 || 0).addScaledVector(perp2, p2 || 0); }
    function bond(a, b, w) { var dd = b.clone().sub(a), cy = new T.Mesh(new T.CylinderGeometry(w || 0.07, w || 0.07, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); cy.position.copy(a).add(b).multiplyScalar(0.5); cy.scale.y = dd.length(); cy.quaternion.setFromUnitVectors(V(0, 1, 0), dd.clone().normalize()); g.add(cy); }
    var p0 = V(0, 0, 0);
    if (type === 'co') { var a = at(2.0), b = at(3.15); m(0.38, a.x, a.y, a.z, 0x495057); m(0.38, b.x, b.y, b.z, 0xff4d4d); bond(p0, a); bond(a, b, 0.1); }
    else if (type === 'cl') { var a2 = at(2.3); m(0.65, a2.x, a2.y, a2.z); bond(p0, a2); }
    else if (type === 'h') { var a3 = at(1.5); m(0.28, a3.x, a3.y, a3.z); bond(p0, a3, 0.05); }
    else if (type === 'p') { var a4 = at(2.4); m(0.55, a4.x, a4.y, a4.z); bond(p0, a4); for (var k = 0; k < 3; k++) { var an = k * 2.094, q = at(3.5, Math.cos(an) * 1.1, Math.sin(an) * 1.1); m(0.55, q.x, q.y, q.z, 0xffd8a8); bond(a4, q, 0.06); } }
    else if (type === 'cp') { for (var j = 0; j < 5; j++) { var an2 = j * 1.2566, q2 = at(1.75, Math.cos(an2) * 1.2, Math.sin(an2) * 1.2); m(0.34, q2.x, q2.y, q2.z); } var t = new T.Mesh(new T.TorusGeometry(1.2, 0.04, 6, 30), new T.MeshStandardMaterial({ color: c })); t.position.copy(at(1.75)); t.quaternion.setFromUnitVectors(V(0, 0, 1), dir); g.add(t); bond(p0, at(1.75), 0.05); }
    else if (type === 'ene') { var e1 = at(2.1, 0.62, 0), e2 = at(2.1, -0.62, 0); m(0.34, e1.x, e1.y, e1.z); m(0.34, e2.x, e2.y, e2.z); bond(e1, e2, 0.09); bond(p0, at(2.1), 0.04); }
    else if (type === 'alk') { var r1 = at(2.0), r2 = at(3.4, 0.5, 0); m(0.36, r1.x, r1.y, r1.z); m(0.36, r2.x, r2.y, r2.z); bond(p0, r1); bond(r1, r2); }
    g.userData.dir = dir; return g;
  }
  function metalMesh(sym) { var cols = { Cr: 0x7048e8, Fe: 0xe8590c, Ni: 0x2f9e44, V: 0x868e96, Mn: 0xcc5de8, Ir: 0x4c6ef5, Pt: 0xadb5bd, Rh: 0xe64980 }; return new T.Mesh(new T.SphereGeometry(0.85, 24, 18), new T.MeshStandardMaterial({ color: cols[sym] || 0xe8590c, roughness: 0.3, metalness: 0.3 })); }
  function counter(e, parts, ctx) {
    cnt.forEach(function (c) { ctx.scene.remove(c); }); cnt = [];
    var idx = 0; parts.forEach(function (p) { var n = Math.abs(p.e), col = p.t === 'm' ? 0x4dabf7 : (p.t === 'q' ? 0xfab005 : LT[p.t].c); for (var i = 0; i < n; i++) { if (idx >= 24) break; var c = Math.floor(idx / 6), r = idx % 6; var m = new T.Mesh(new T.BoxGeometry(0.62, 0.62, 0.62), new T.MeshStandardMaterial({ color: col, roughness: 0.4, emissive: col, emissiveIntensity: 0.15 })); m.position.set(-11.8 + c * 0.9, -3 + r * 0.9, 0); ctx.scene.add(m); cnt.push(m); idx++; } });
    for (var j = idx; j < 18; j++) { var m2 = new T.Mesh(new T.BoxGeometry(0.62, 0.62, 0.62), new T.MeshBasicMaterial({ color: 0x868e96, wireframe: true })); m2.position.set(-11.8 + Math.floor(j / 6) * 0.9, -3 + (j % 6) * 0.9, 0); ctx.scene.add(m2); cnt.push(m2); }
  }
  var cache = {}, ckey = '';
  var def = {
    key: 'organometalica-18e', title: "Organometallic: 18 e⁻ rule", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#a78bfa', light: '#5b21b6' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [4, 5, 17], target: [-2, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 18], target: [-2, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 18, 2], target: [-2, 0, 0] }],
    layers: [{ id: 'lig', label: "Ligands", icon: 'L' }, { id: 'cnt', label: "Electron counter", icon: '▦' }],
    build: function (ctx) { grp = new T.Group(); grp.position.set(1, 0, 0); ctx.scene.add(grp); ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab.push(ctx.label('', 'bl-d')); }); lab.t = lab[0]; },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.mode = i === 5 ? 'cyc' : 'comp';
        if (i === 0) S.c = 'cr'; else if (i === 1) S.c = ['cr', 'fe', 'ni'][Math.min(2, Math.floor(l * 3))]; else if (i === 2) S.c = ['ni', 'fe', 'cr', 'v', 'mn'][Math.min(4, Math.floor(l * 5))]; else if (i === 3) S.c = 'fc'; else if (i === 4) S.c = ['vas', 'zeise', 'wil'][Math.min(2, Math.floor(l * 3))];
        else { var seg = l * 5, st = Math.min(4, Math.floor(seg)); S.cs = st; S.q = sm((seg - st) / 0.85); }
      } else if (S.run && S.mode === 'cyc') { S.q += dt / 3; if (S.q >= 1) { S.q = 0; S.cs++; if (S.cs > 4) { S.cs = 0; S.run = false; } } }
      var cOn = ctx.layer('cnt'), lOn = ctx.layer('lig');
      if (S.mode === 'comp') {
        var c = C[S.c], k = 'c|' + S.c; if (ckey !== k) { ckey = k; grp.children.slice().forEach(function (x) { grp.remove(x); }); var m = metalMesh(c.m); grp.add(m); c.L.forEach(function (lg) { var g = lig(lg.t, lg.d); grp.add(g); }); var cc = count(c); counter(cc.e, cc.parts, ctx); }
        grp.rotation.y = now * 0.3; grp.children.forEach(function (x, i) { if (i > 0) x.visible = lOn; }); cnt.forEach(function (x) { x.visible = cOn; });
        var cc2 = count(c); lab[0].pos(1, 5.6, 0).set(c.n, 'bl-lead').vis(true); lab[1].pos(-11, 3.4, 0).set(cc2.e + ' e⁻', cc2.e === 18 ? 'bl-pos' : (cc2.e === 16 ? 'bl-warn' : 'bl-neg')).vis(cOn);
        lab[2].pos(1, -5.2, 0).set(c.g + (c.q ? (c.q > 0 ? ' − ' + c.q : ' + ' + (-c.q)) : '') + ' + ' + c.L.map(function (l) { return LT[l.t].e; }).join(' + ') + ' = ' + cc2.e + ' e⁻', 'bl-d').vis(true);
        lab[3].pos(1, -6.2, 0).set(c.geom + ' · ' + c.d, 'bl-d').vis(true); lab[4].vis(false);
      } else {
        var A = CYC[S.cs], B = CYC[S.cs === 4 ? 5 : S.cs + 1], key2 = 'y|' + S.cs; if (ckey !== key2) { ckey = key2; grp.children.slice().forEach(function (x) { grp.remove(x); }); grp.add(metalMesh('Rh')); cache = {}; leave = []; for (var s2 = 0; s2 < 6; s2++) { var a = A.L[s2], b = B.L[s2], same = a && b && a.t === b.t; if (same) { var g1 = lig(a.t, OCT[s2]); grp.add(g1); cache['s' + s2] = { g: g1, kind: 'stay' }; } else { if (a) { var g2 = lig(a.t, OCT[s2]); grp.add(g2); cache['o' + s2] = { g: g2, kind: 'out', dir: OCT[s2] }; } if (b) { var g3 = lig(b.t, OCT[s2]); grp.add(g3); cache['i' + s2] = { g: g3, kind: 'in', dir: OCT[s2] }; } if (!b && !a) { } } }
          var vg = new T.Group(); OCT.forEach(function (d, s3) { if (!B.L[s3] && !A.L[s3]) return; }); }
        var q = S.q; Object.keys(cache).forEach(function (kk) { var o = cache[kk]; if (o.kind === 'out') { o.g.scale.setScalar(Math.max(0.001, 1 - q)); o.g.position.set(o.dir[0], o.dir[1], o.dir[2]).multiplyScalar(2.5 * q); } else if (o.kind === 'in') { o.g.scale.setScalar(Math.max(0.001, q)); o.g.position.set(o.dir[0], o.dir[1], o.dir[2]).multiplyScalar(2.5 * (1 - q)); } o.g.visible = lOn; });
        grp.rotation.y = now * 0.25;
        var e0 = cycCount(A), e1 = cycCount(B), cur = q < 0.5 ? A : B, ecur = q < 0.5 ? e0 : e1;
        var parts = [{ t: 'm', e: 9 }]; cur.L.forEach(function (l) { if (l) parts.push({ t: l.t, e: LT[l.t].e }); });
        var ck = 'ct|' + S.cs + (q < 0.5 ? 'a' : 'b'); if (tag.k !== ck) { tag.k = ck; counter(ecur, parts, ctx); } cnt.forEach(function (x) { x.visible = cOn; });
        lab[0].pos(1, 5.6, 0).set("Step " + (S.cs + 1) + ': ' + STEPN[S.cs], 'bl-lead').vis(true); lab[1].pos(-11, 3.4, 0).set(ecur + ' e⁻', ecur === 18 ? 'bl-pos' : (ecur === 16 ? 'bl-warn' : 'bl-neg')).vis(cOn);
        lab[2].pos(1, -5.2, 0).set((q < 0.5 ? A.n : B.n) + ' · ' + cur.ox, 'bl-d').vis(true); lab[3].pos(1, -6.2, 0).set(e0 + ' e⁻ → ' + e1 + ' e⁻ · ' + (S.cs === 1 ? 'Rh(I) → Rh(III)' : (S.cs === 4 ? 'Rh(III) → Rh(I)' : cur.ox)), 'bl-d').vis(true); lab[4].vis(false);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.c) u.c.set(S.c); if (u.cs) u.cs.set(S.cs); if (!ctx.P.manual && u.q) u.q.set(S.q); },
    hud: function () { if (S.mode === 'cyc') { var a = CYC[S.cs], b = CYC[S.cs === 4 ? 5 : S.cs + 1]; return { eq: { chip: 'Rh', name: "Wilkinson cycle", body: "<div class=\"eqline\"><small>Step</small>" + (S.cs + 1) + ' · ' + STEPN[S.cs] + "</div><div class=\"eqline\"><small>From</small>" + a.n + ' (' + cycCount(a) + ' e⁻)</div><div class="eqline"><small>A</small>' + b.n + ' (' + cycCount(b) + ' e⁻)</div>' }, legend: [{ label: "Blue cube", color: '#4dabf7', text: "metal electrons" }, { label: "Others", color: '#ff922b', text: "ligand electrons" }] }; } var c = C[S.c], cc = count(c); return { eq: { chip: String(cc.e), name: c.n, body: "<div class=\"eqline\"><small>Geometry</small>" + c.geom + "</div><div class=\"eqline\"><small>Valence e⁻</small>" + cc.e + "</div><div class=\"eqline\"><small>State</small>" + (cc.e === 18 ? "18 e⁻ (saturated)" : (cc.e === 16 ? "16 e⁻ (d⁸, unsaturated)" : cc.e + ' e⁻ (radical)')) + '</div>' }, legend: [{ label: "Blue cube", color: '#4dabf7', text: "metal electrons" }, { label: "Others", color: '#ff922b', text: "ligand electrons" }, { label: "Mesh", color: '#868e96', text: "electrons missing to reach 18" }] }; },
    measures: function () { if (S.mode === 'cyc') { var a = CYC[S.cs]; return [["Step", (S.cs + 1) + " of 5"], ["Species", a.n], ["No. of e⁻", String(cycCount(a))], ["Oxidation state", a.ox], ["Description", a.nm]]; } var c = C[S.c], cc = count(c); return [["Compound", c.n], ['Metal', c.m + " (group " + c.g + ')'], ["Charge", String(c.q)], ["valence e⁻", String(cc.e)], ["Geometry", c.geom], ["Configuration", c.d]]; },
    ideas: ["<b>18 e⁻</b> = 5 d + 1 s + 3 p filled.", "Neutral count: group + ligands − charge (CO 2, Cl 1, Cp 5).", "d⁸ square planar: <b>16 e⁻</b>, reactive.", "Wilkinson: 16 → 14 → 16 → 18 → 16 → 14 e⁻.", "Oxidative addition: +2 to the oxidation state; reductive elimination: −2."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Compound"); el.appendChild(c);
      ui.c = kit.ui.options({ label: "Complex", cols: 3, value: S.c, options: Object.keys(C).map(function (k) { return { v: k, label: C[k].n.replace(/ \(.*\)/, ''), sub: count(C[k]).e + ' e⁻' }; }), onChange: function (v) { ctx.goManual(); S.mode = 'comp'; S.c = v; ckey = ''; } }); c.appendChild(ui.c);
      var d = kit.ui.card("Wilkinson cycle"); el.appendChild(d);
      ui.cs = kit.ui.slider({ label: "Cycle step", min: 0, max: 4, step: 1, value: S.cs, format: function (v) { return (v + 1) + '. ' + STEPN[v]; }, onInput: function (v) { ctx.goManual(); S.mode = 'cyc'; S.cs = v; S.q = 0; ckey = ''; } });
      ui.q = kit.ui.slider({ label: "Step progress", min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'cyc'; S.run = false; S.q = v; } }); d.appendChild(kit.ui.sliders([ui.cs, ui.q]));
      d.appendChild(ctx.btnRow([{ t: "▶ Go through the cycle", primary: true, fn: function () { ctx.goManual(); S.mode = 'cyc'; S.cs = 0; S.q = 0; S.run = true; ckey = ''; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Valence electrons per species", h: 240, note: "Line: 18 e⁻. The 16 e⁻ (d⁸) species are coordinatively unsaturated.", draw: function (cx, w, h, col) {
        var ks = Object.keys(C), L = 32, Rr = 10, Tp = 12, B = 44, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ks.length, sy = function (v) { return Tp + ph - ph * v / 20; }, i; cx.font = '9.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 20; i += 5) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 4, sy(i) + 3); }
        ks.forEach(function (k, j) { var e = count(C[k]).e, cur = S.mode === 'comp' && k === S.c; cx.fillStyle = e === 18 ? '#40c057' : (e === 16 ? '#fab005' : '#fa5252'); cx.globalAlpha = cur ? 1 : 0.7; cx.fillRect(L + j * bw + 4, sy(e), bw - 8, Tp + ph - sy(e)); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(e, L + j * bw + bw / 2, sy(e) - 4); cx.save(); cx.translate(L + j * bw + bw / 2, h - B + 8); cx.rotate(-0.7); cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.fillText(C[k].n.replace(/ \(.*\)/, ''), 0, 0); cx.restore(); });
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(L, sy(18)); cx.lineTo(L + pw, sy(18)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: "Wilkinson cycle: electrons per species", h: 210, note: "Alternation 16 → 14 → 16 → 18 → 16 → 14 e⁻ with Rh(I)/Rh(III) changes.", draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B, bw = pw / CYC.length, sy = function (v) { return Tp + ph - ph * (v - 10) / 10; }, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 10; i <= 20; i += 2) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 4, sy(i) + 3); }
        CYC.forEach(function (s, j) { var e = cycCount(s), cur = S.mode === 'cyc' && (j === S.cs || (j === S.cs + 1)); cx.fillStyle = s.ox === 'Rh(III)' ? '#a78bfa' : '#4dabf7'; cx.globalAlpha = cur ? 1 : 0.7; cx.fillRect(L + j * bw + 6, sy(e), bw - 12, Tp + ph - sy(e)); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(e, L + j * bw + bw / 2, sy(e) - 4); cx.fillStyle = col.muted; cx.fillText((j + 1), L + j * bw + bw / 2, h - B + 14); cx.fillText(s.ox, L + j * bw + bw / 2, h - B + 26); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'cyc') { var a = CYC[S.cs], b = CYC[S.cs === 4 ? 5 : S.cs + 1]; return "<div class=\"card-kicker\">Step " + (S.cs + 1) + ': ' + STEPN[S.cs] + '</div><table class="calc-table">' + row("Before", a.n + ' → 9 (Rh) ' + a.L.map(function (l) { return l ? '+ ' + LT[l.t].e : ''; }).join(' ') + ' = <b>' + cycCount(a) + ' e⁻</b> (' + a.ox + ')') + row("After", b.n + ' = <b>' + cycCount(b) + ' e⁻</b> (' + b.ox + ')') + '</table><p class="muted small">' + ["To leave a free site, one PPh₃ dissociates.", "H₂ breaks its bond and the metal is oxidized: Rh(I) → Rh(III).", "The alkene contributes 2 e⁻ and completes the 18.", "The alkene inserts into Rh–H and forms the alkyl group.", "The alkyl and the hydride join and leave as an alkane; Rh(III) → Rh(I)."][S.cs] + '</p>'; }
      var c = C[S.c], cc = count(c); return '<div class="card-kicker">' + c.n + "</div><div class=\"calc-step\">Neutral count</div><table class=\"calc-table\">" + row('Metal (' + c.m + ')', "group " + c.g + ' → ' + c.g + ' e⁻') + c.L.map(function (l, i) { return ''; }).join('') + Object.keys(c.L.reduce(function (o, l) { o[l.t] = (o[l.t] || 0) + 1; return o; }, {})).map(function (t) { var n = c.L.filter(function (l) { return l.t === t; }).length; return row(n + ' × ' + LT[t].n, n + ' × ' + LT[t].e + ' = ' + n * LT[t].e + ' e⁻'); }).join('') + (c.q ? row("Charge " + (c.q > 0 ? '+' : '') + c.q, (c.q > 0 ? '−' : '+') + Math.abs(c.q) + ' e⁻') : '') + row('Total', '<b>' + cc.e + ' e⁻</b> → ' + (cc.e === 18 ? "<span class=\"calc-ok\">obeys the 18 rule</span>" : (cc.e === 16 ? "<span class=\"calc-hi\">16 e⁻: unsaturated d⁸</span>" : "<span class=\"calc-hi\">radical / unsaturated</span>"))) + '</table>';
    },
    quiz: [
      { q: "Cr(CO)₆ has… valence electrons.", options: ['18', '16', '12', '14'], answer: 0, why: '6 (Cr) + 6 × 2 (CO) = 18.' },
      { q: "Ferrocene obeys the 18 rule with…", options: ['8 + 2 × 5', '8 + 2 × 3', '10 + 2 × 4', '6 + 6 × 2'], answer: 0, why: "Fe (8) plus two Cp (5 e⁻ each, neutral method)." },
      { q: "Square planar d⁸ complexes have…", options: ['16 e⁻', '18 e⁻', '14 e⁻', '20 e⁻'], answer: 0, why: "The d_{x²−y²} is left empty." },
      { q: "In the Wilkinson cycle, the oxidative addition of H₂ changes the state of Rh from…", options: ["I to III", "III to I", '0 a I', "II to IV"], answer: 0, why: "H₂ contributes two hydride ligands and oxidizes the metal by 2 units." },
      { q: "CO is a ligand that is…", options: ["σ-donor and π-acceptor", "σ-donor only", "π-donor", "ionic"], answer: 0, why: "M → π*(CO) back-donation." },
      { q: "Ni(CO)₄ is…", options: ["tetrahedral and 18 e⁻", "planar and 16 e⁻", "octahedral", "a radical"], answer: 0, why: "10 + 8 = 18 and d¹⁰ → tetrahedral." },
      { q: "Reductive elimination…", options: ["lowers the oxidation state of the metal by 2", "raises it by 2", "does not change it", "adds ligands"], answer: 0, why: "A bond forms between two ligands that leave the metal." },
      { q: "V(CO)₆ is special because…", options: ["it has 17 e⁻", "it has 20 e⁻", "it is planar", "it is ionic"], answer: 0, why: "5 + 12 = 17: stable radical." }
    ],
    help: { intro: "Choose a complex to see its geometry and the electron counter (each cube is one e⁻); the gray mesh indicates those missing up to 18. With the “Cycle step” control you go through the Wilkinson catalyst.", items: [["Blue cube", "metal electrons."], ["Other colors", "contributed by each type of ligand."]] }
  };
  MSim.create(def);
})();
