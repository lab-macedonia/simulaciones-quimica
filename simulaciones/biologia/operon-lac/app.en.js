/* Operón lac y regulación génica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var MU = { wt: "Wild-type strain", laci: "lacI⁻ mutant (no repressor)", laco: "lacOᶜ mutant (constitutive operator)" };
  var S = { lac: 0, glu: 0, mu: 'wt' }, g = null, rep = null, pol = null, cap = null, mr = [], en = [], lab = [], gene = {};
  function bound() { if (S.mu !== 'wt') return 0; return S.lac ? 0.02 : 0.98; }
  function capAct() { return S.glu ? 0.1 : 1; }
  function expr(lac, glu, mu) { var o = { lac: S.lac, glu: S.glu, mu: S.mu }; if (lac != null) { S.lac = lac; S.glu = glu; S.mu = mu; } var b = bound(), v = Math.max(0.01, (1 - b)) * (0.1 + 0.9 * capAct()) * 100; if (S.mu === 'laco' && S.glu === 0) v = 100 * 0.9 + 10; S.lac = o.lac; S.glu = o.glu; S.mu = o.mu; return Math.min(100, v); }
  function lvl() { return expr(); }
  function stages() {
    return [
      ["Operon components", "Components", "lacI encodes the repressor; P is the promoter; O the operator; lacZ, lacY and lacA the structural genes",
        "<p>The <b>lac operon</b> of <i>E. coli</i> groups three genes that are transcribed together: <b>lacZ</b> (β-galactosidase, which breaks down lactose), <b>lacY</b> (permease) and <b>lacA</b> (transacetylase). Upstream are the <b>promoter</b> (P) and the <b>operator</b> (O). The regulatory gene <b>lacI</b> produces the <b>repressor</b>, which binds to the operator.</p>"],
      ["Without lactose: repression", "Without lactose", "The repressor blocks the operator and RNA polymerase does not advance",
        "<p>Without lactose, the <b>LacI repressor</b> binds to the <b>operator</b> and <b>blocks</b> RNA polymerase: there is almost no transcription (basal expression ≈ 1–2 %). The cell does not spend energy on enzymes it does not need: this is <b>negative control</b>.</p>"],
      ["With lactose: induction", "With lactose", "Allolactose binds to the repressor and releases it from the operator",
        "<p>Lactose is converted into <b>allolactose</b>, the <b>inducer</b>, which binds to the repressor and changes its shape: the repressor <b>lets go</b> of the operator. RNA polymerase transcribes lacZYA, a polycistronic mRNA forms and all three enzymes appear.</p>"],
      ["Glucose and cAMP–CAP", "Glucose and CAP", "With glucose, cAMP is low, CAP–cAMP does not form and the promoter is weak",
        "<p><b>Glucose</b> is the preferred source. When it is abundant, <b>cAMP</b> is low and the activator <b>CAP</b> does not bind to the promoter: even with lactose, transcription is <b>low</b> (<b>catabolite repression</b>, positive control). Without glucose, <b>CAP–cAMP</b> helps recruit the polymerase and expression is maximal.</p>"],
      ["Mutants (challenge)", "Mutants", "lacI⁻ and lacOᶜ express without lactose",
        "<p>A <b>lacI⁻</b> mutant produces no functional repressor; a <b>lacOᶜ</b> mutant has an operator to which the repressor cannot bind. In both cases the operon is expressed <b>constitutively</b>, even without lactose. Predict the expression under each condition and check.</p>"]
    ];
  }
  var X = { I: 14, P: 17, O: 19.2, Z: 22, Y: 25, A: 28 };
  var def = {
    key: 'operon-lac', title: "The lac operon and gene regulation", subtitle: "3D Simulator · molecular biology", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [15, 6, 22], target: [15, 1, 0] }, { id: 'frontal', label: "Front", pos: [15, 1, 26], target: [15, 1, 0] }],
    layers: [{ id: 'prod', label: "mRNA and enzymes", icon: '◉' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var dna = new T.Mesh(new T.BoxGeometry(16.5, 0.18, 0.5), new T.MeshStandardMaterial({ color: 0x748ffc })); dna.position.set(21.25, 0, 0); g.add(dna);
      function seg(k, w, c) { var m = new T.Mesh(new T.BoxGeometry(w, 0.9, 0.9), new T.MeshStandardMaterial({ color: c })); m.position.set(X[k], 0, 0); g.add(m); gene[k] = m; }
      seg('I', 1.8, 0x9775fa); seg('P', 1.4, 0x51cf66); seg('O', 0.9, 0xff6b6b); seg('Z', 2.4, 0xffa94d); seg('Y', 2.4, 0xffd43b); seg('A', 2.4, 0x63e6be);
      rep = new T.Mesh(new T.SphereGeometry(0.8, 18, 14), new T.MeshStandardMaterial({ color: 0x9775fa })); g.add(rep);
      pol = new T.Mesh(new T.SphereGeometry(0.9, 18, 14), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(pol);
      cap = new T.Mesh(new T.OctahedronGeometry(0.5), new T.MeshStandardMaterial({ color: 0xffd43b })); g.add(cap);
      for (i = 0; i < 6; i++) { var m = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xffe8cc })); g.add(m); mr.push(m); }
      for (i = 0; i < 9; i++) { var e = new T.Mesh(new T.SphereGeometry(0.35, 10, 8), new T.MeshStandardMaterial({ color: [0xffa94d, 0xffd43b, 0x63e6be][i % 3] })); g.add(e); en.push(e); }
      for (i = 0; i < 9; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 1) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 2) { S.lac = 1; S.glu = 0; S.mu = 'wt'; } if (i === 3) { S.lac = 1; S.glu = f.local < 0.5 ? 0 : 1; S.mu = 'wt'; } if (i === 4) { S.lac = 0; S.glu = 0; S.mu = f.local < 0.5 ? 'laci' : 'laco'; } }
      var b = bound(), v = lvl() / 100, th = ctx.now, on = ctx.layer('prod');
      var blocked = b > 0.5;
      rep.position.set(blocked ? X.O : X.I + 1.5 + Math.sin(th) * 0.5, blocked ? 1.1 : 3.2 + Math.cos(th * 0.8) * 0.4, 0); rep.visible = S.mu !== 'laci';
      rep.material.color.setHex(S.lac ? 0xd0bfff : 0x9775fa);
      gene.O.material.color.setHex(S.mu === 'laco' ? 0x7a0000 : 0xff6b6b);
      var u = (th * 0.25) % 1; var run = v > 0.3;
      pol.position.set(run ? X.P + 1 + u * (X.A + 1 - X.P - 1) : X.P - 0.3, run ? 1.3 : 2.3 + Math.sin(th) * 0.2, 0); pol.scale.setScalar(run ? 1 : 0.8);
      cap.visible = !S.glu; cap.position.set(X.P - 1.5, 1.2, 0);
      mr.forEach(function (m, j) { m.visible = on && j < Math.round(v * 6); m.position.set(X.P + 1 + j * 1.8, -1.4 - (j % 2) * 0.4, 0); });
      en.forEach(function (e, j) { e.visible = on && j < Math.round(v * 9); e.position.set(X.Z + (j % 5) * 1.3 - 1, -3 - Math.floor(j / 5) * 0.9, 0); });
      lab[0].pos(X.I, 1.7, 0).set('lacI', 'bl-d').vis(true); lab[1].pos(X.P, 1.7, 0).set('P', 'bl-d').vis(true); lab[2].pos(X.O, 3.2, 0).set('O', 'bl-d').vis(true);
      lab[3].pos(X.Z, 1.7, 0).set('lacZ', 'bl-d').vis(true); lab[4].pos(X.Y, 1.7, 0).set('lacY', 'bl-d').vis(true); lab[5].pos(X.A, 1.7, 0).set('lacA', 'bl-d').vis(true);
      lab[6].pos(21, 6.4, 0).set((S.mu === 'wt' ? (S.lac ? "With lactose" : "Without lactose") : MU[S.mu]) + ' · ' + (S.glu ? "with glucose" : "without glucose"), 'bl-lead').vis(true);
      lab[7].pos(21, -5.2, 0).set("Expression: " + fmt(v * 100, 0) + " % of maximum", v > 0.5 ? 'bl-pos' : 'bl-neg').vis(true);
      lab[8].pos(X.I + 1.5, 4.8, 0).set(S.mu === 'laci' ? "no functional repressor" : "repressor", 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lac) u.lac.set(S.lac); if (u.glu) u.glu.set(S.glu); if (u.mu) u.mu.set(S.mu); },
    hud: function () { return { eq: { chip: 'lac', name: "Regulation", body: "<div class=\"eqline\"><small>Repressor at O</small>" + fmt(bound() * 100, 0) + " %</div><div class=\"eqline\"><small>CAP–cAMP</small>" + (S.glu ? 'inactivo' : "active") + "</div><div class=\"eqline\"><small>Expression</small>" + fmt(lvl(), 0) + ' %</div>' }, legend: [{ label: "Purple sphere", color: '#9775fa', text: "LacI repressor" }, { label: "Blue sphere", color: '#4dabf7', text: "RNA polymerase" }, { label: "Octahedron", color: '#ffd43b', text: 'CAP–AMPc' }] }; },
    measures: function () { return [['Cepa', MU[S.mu]], ['Lactosa', S.lac ? "present" : "absent"], ["Glucose", S.glu ? "present" : "absent"], ["Repressor bound to O", fmt(bound() * 100, 0) + ' %'], ['CAP–AMPc', S.glu ? 'inactivo' : "active"], ["β-galactosidase", fmt(lvl(), 0) + ' %']]; },
    ideas: ["Without lactose: repressor on O.", "Allolactose releases the repressor.", "Glucose → low cAMP → CAP inactive.", "lacI⁻ and lacOᶜ: constitutive expression."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Culture conditions"); el.appendChild(c);
      ui.lac = kit.ui.options({ label: 'Lactosa', cols: 2, value: S.lac, options: [{ v: 0, label: 'Ausente' }, { v: 1, label: 'Presente' }], onChange: function (v) { ctx.goManual(); S.lac = +v; } });
      ui.glu = kit.ui.options({ label: "Glucose", cols: 2, value: S.glu, options: [{ v: 0, label: 'Ausente' }, { v: 1, label: 'Presente' }], onChange: function (v) { ctx.goManual(); S.glu = +v; } });
      ui.mu = kit.ui.options({ label: 'Cepa', cols: 1, value: S.mu, options: Object.keys(MU).map(function (k) { return { v: k, label: MU[k] }; }), onChange: function (v) { ctx.goManual(); S.mu = v; } });
      c.appendChild(ui.lac); c.appendChild(ui.glu); c.appendChild(ui.mu); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Expression in the four conditions", h: 210, note: "Wild-type strain: relative β-galactosidase level.", draw: function (cx, w, h, col) {
      var d = [["−lac −glu", 0, 0], ["+lac −glu", 1, 0], ['+lac +glu', 1, 1], ["−lac +glu", 0, 1]], L = 10, B = 28, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var v = expr(x[1], x[2], 'wt'), hh = ph * v / 100, cur = (S.mu === 'wt' && S.lac === x[1] && S.glu === x[2]); cx.fillStyle = cur ? '#ff922b' : '#69db7c'; cx.fillRect(L + j * bw + 6, Tp + ph - hh, bw - 12, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(fmt(v, 0) + ' %', L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, c4 = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (x) { return (x[0] ? '+' : '−') + 'lac ' + (x[1] ? '+' : '−') + 'glu: <b>' + fmt(expr(x[0], x[1], 'wt'), 0) + ' %</b>'; }).join('<br>'); return '<div class="card-kicker">' + MU[S.mu] + '</div><table class="calc-table">' + row("Fraction of operator occupied", '<b>' + fmt(bound() * 100, 0) + ' %</b>') + row("CAP activation", '<b>' + fmt(capAct() * 100, 0) + " %</b> (factor 0.1 + 0.9·CAP)") + row("Expression", "(1 − occupancy) × activation = <b>" + fmt(lvl(), 0) + ' %</b>') + row("Wild type, 4 conditions", c4) + '</table>'; },
    quiz: [
      { q: "Without lactose, the LacI repressor…", options: ["binds to the operator and blocks transcription", "binds to the promoter and activates it", "is degraded", "binds to CAP"], answer: 0, why: "Negative control." },
      { q: "The true inducer of the lac operon is…", options: ["allolactose", "glucose", "cAMP", "β-galactosidase"], answer: 0, why: "It binds to the repressor and releases it." },
      { q: "With lactose and glucose, expression is…", options: ["low", "maximum", "always zero", "equal to that without lactose and without glucose"], answer: 0, why: "Catabolite repression: CAP inactive." },
      { q: "A lacOᶜ mutant…", options: ["is expressed without lactose", "is never expressed", "has no lacZ", "produces more repressor"], answer: 0, why: "The repressor does not recognize the operator." },
      { q: "The lacZ gene encodes…", options: ["β-galactosidase", "permease", "the repressor", "CAP"], answer: 0, why: "It hydrolyzes lactose into glucose and galactose." },
      { q: "CAP–cAMP acts as…", options: ["an activator (positive control)", "repressor", "inducer", "operator"], answer: 0, why: "It helps recruit RNA polymerase." }
    ],
    help: { intro: "Choose lactose, glucose and strain. You will see whether the repressor blocks the operator, whether the polymerase advances and how much mRNA and enzyme are formed.", items: [["Purple sphere", 'represor.'], ["Lower spheres", "mRNA and enzymes."]] }
  };
  MSim.create(def);
})();
