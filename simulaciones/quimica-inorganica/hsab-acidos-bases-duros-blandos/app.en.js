/* Ácidos y bases duros y blandos (HSAB) — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var AC = {
    h: { n: 'H⁺', q: 1, r: 25, h: 2, p: 0.0 }, li: { n: 'Li⁺', q: 1, r: 76, h: 2, p: 0.1 }, mg: { n: 'Mg²⁺', q: 2, r: 72, h: 2, p: 0.1 }, al: { n: 'Al³⁺', q: 3, r: 54, h: 2, p: 0.05 }, fe3: { n: 'Fe³⁺', q: 3, r: 65, h: 2, p: 0.15 },
    fe2: { n: 'Fe²⁺', q: 2, r: 78, h: 1, p: 0.45 }, cu2: { n: 'Cu²⁺', q: 2, r: 73, h: 1, p: 0.5 }, zn: { n: 'Zn²⁺', q: 2, r: 74, h: 1, p: 0.45 },
    cu1: { n: 'Cu⁺', q: 1, r: 77, h: 0, p: 0.8 }, ag: { n: 'Ag⁺', q: 1, r: 115, h: 0, p: 0.85 }, hg: { n: 'Hg²⁺', q: 2, r: 102, h: 0, p: 0.95 }, pt: { n: 'Pt²⁺', q: 2, r: 80, h: 0, p: 0.8 }
  };
  var BA = {
    f: { n: 'F⁻', q: 1, r: 133, h: 2, p: 0.1 }, oh: { n: 'OH⁻', q: 1, r: 140, h: 2, p: 0.15 }, o: { n: 'O²⁻', q: 2, r: 140, h: 2, p: 0.15 }, h2o: { n: 'H₂O', q: 0, r: 140, h: 2, p: 0.15 }, nh3: { n: 'NH₃', q: 0, r: 150, h: 2, p: 0.25 },
    cl: { n: 'Cl⁻', q: 1, r: 181, h: 1, p: 0.45 }, br: { n: 'Br⁻', q: 1, r: 196, h: 1, p: 0.55 },
    i: { n: 'I⁻', q: 1, r: 220, h: 0, p: 0.85 }, s: { n: 'S²⁻', q: 2, r: 184, h: 0, p: 0.9 }, scn: { n: "SCN⁻ (S)", q: 1, r: 190, h: 0, p: 0.8 }, cn: { n: 'CN⁻', q: 1, r: 190, h: 0, p: 0.8 }, co: { n: 'CO', q: 0, r: 200, h: 0, p: 0.75 }
  };
  var CL = ["soft", "borderline", "hard"], CC = ['#ffa94d', '#74c0fc', '#9775fa'];
  var S = { a: 'al', b: 'f', a2: 'hg', b2: 'o', a3: 'hg', b3: 's' }, g = null, pairs = [], lab = [];
  function score(a, b) {
    var A = AC[a], B = BA[b], d = Math.abs(A.h - B.h), s = 3 - 1.5 * d;
    if (A.h === 2 && B.h === 2) s += 0.6 * Math.min(2.5, (A.q * Math.max(B.q, 0.6)) / ((A.r + B.r) / 100));
    if (A.h === 0 && B.h === 0) s += 1.5 * A.p * B.p;
    return Math.max(0, s);
  }
  function sums() { var r = score(S.a, S.b) + score(S.a2, S.b2), p = score(S.a, S.b2) + score(S.a2, S.b); return { r: r, p: p }; }
  function stages() {
    return [
      ["Hard and soft", "Hard / soft", "Hard: small, highly charged, weakly polarizable. Soft: large, weakly charged, highly polarizable",
        "<p>Pearson classified acids (electron-pair acceptors) and bases (donors) as <b>hard</b> or <b>soft</b>. <b>Hard</b> species are small, highly charged and weakly <b>polarizable</b> (Al³⁺, F⁻, OH⁻); <b>soft</b> ones are large, low-charged and highly polarizable (Hg²⁺, Ag⁺, I⁻, S²⁻). The spheres show size and the translucent “cloud” shows polarizability.</p>"],
      ["Classification", "Classification", "Three categories: hard, borderline and soft",
        "<p>Between the two extremes are <b>borderline</b> species (Fe²⁺, Cu²⁺, Zn²⁺; Cl⁻, Br⁻). Go through the table of cations and bases and see how radius and cloud change. The criterion is qualitative: hardness is not a directly measurable quantity but a guide based on trends.</p>"],
      ["Pairing", "Pairing", "Hard with hard, soft with soft",
        "<p>Pearson's rule: <b>hard acids prefer hard bases and soft acids prefer soft bases</b>. Hard–hard bonds are mainly <b>ionic</b> (charge/radius); soft–soft bonds are more <b>covalent</b> (polarizability). Choose an acid and a base: the qualitative score rises when both match and the sphere moves closer.</p>"],
      ["Exchange reactions", "Exchange", "AB + CD ⇌ AD + CB: favors hard–hard and soft–soft pairs",
        "<p>In an <b>exchange</b> reaction A₁B₁ + A₂B₂ ⇌ A₁B₂ + A₂B₁, the equilibrium shifts toward the side with the <b>higher total score</b>. Try Al³⁺/Hg²⁺ with O²⁻/S²⁻: aluminum ends up with oxygen and mercury with sulfur.</p>"],
      ["Minerals", "Minerals", "Al₂O₃ in oxides; HgS and Cu₂S in sulfides",
        "<p><b>Geochemistry</b> follows HSAB: hard cations (Al³⁺, Mg²⁺, Fe³⁺) occur as <b>oxides and silicates</b> (bauxite, olivine); soft ones (Hg²⁺, Cu⁺, Ag⁺, Pt²⁺) as <b>sulfides</b> (cinnabar HgS, chalcocite Cu₂S). This guides extraction: sulfides are roasted; aluminum oxides are dissolved in base.</p>"]
    ];
  }
  function mkPair(ctx, x, y) {
    var P = { g: new T.Group() }; P.g.position.set(x, y, 0); g.add(P.g);
    P.a = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0x4dabf7 })); P.b = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xff8787 }));
    P.ca = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.2, depthWrite: false })); P.cb = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xff8787, transparent: true, opacity: 0.2, depthWrite: false }));
    P.g.add(P.a); P.g.add(P.b); P.g.add(P.ca); P.g.add(P.cb); pairs.push(P); return P;
  }
  function setPair(P, a, b, vis) {
    var A = AC[a], B = BA[b], ra = 0.35 + A.r / 100 * 0.9, rb = 0.35 + B.r / 100 * 0.9, sc = score(a, b), d = (ra + rb) * (1.25 - Math.min(1, sc / 4.5) * 0.45);
    P.g.visible = vis; P.a.scale.setScalar(ra); P.b.scale.setScalar(rb); P.ca.scale.setScalar(ra * (1.05 + A.p * 0.7)); P.cb.scale.setScalar(rb * (1.05 + B.p * 0.7));
    P.ca.material.opacity = 0.1 + A.p * 0.3; P.cb.material.opacity = 0.1 + B.p * 0.3; P.a.material.color.set(CC[A.h]); P.b.material.color.set(CC[B.h]);
    P.ca.material.color.set(CC[A.h]); P.cb.material.color.set(CC[B.h]); P.a.position.x = -d / 2 * (rb / (ra + rb)) * 1.0 - 0; P.a.position.x = -d * rb / (ra + rb); P.b.position.x = d * ra / (ra + rb); P.ca.position.x = P.a.position.x; P.cb.position.x = P.b.position.x; return sc;
  }
  var def = {
    key: 'hsab-acidos-bases-duros-blandos', title: "Hard and soft acids and bases (HSAB)", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [16, 5, 24], target: [16, 0, 0] }, { id: 'frontal', label: "Front", pos: [16, 0, 28], target: [16, 0, 0] }],
    layers: [{ id: 'cloud', label: "Cloud", icon: '◌' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); mkPair(ctx, 13, 4); mkPair(ctx, 13, -4); mkPair(ctx, 25, 4); mkPair(ctx, 25, -4);
      for (var i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i, ka = Object.keys(AC), kb = Object.keys(BA);
      if (!P.manual) {
        if (i === 0) { S.a = ['al', 'hg'][f.local < 0.5 ? 0 : 1]; S.b = f.local < 0.5 ? 'f' : 'i'; }
        if (i === 1) { S.a = ka[Math.min(ka.length - 1, Math.floor(f.local * ka.length))]; S.b = kb[Math.min(kb.length - 1, Math.floor(f.local * kb.length))]; }
        if (i === 2) { var st = Math.min(3, Math.floor(f.local * 4)); S.a = ['al', 'al', 'hg', 'hg'][st]; S.b = ['f', 'i', 'f', 'i'][st]; }
        if (i === 3) { S.a = 'al'; S.b = 'o'; S.a2 = 'hg'; S.b2 = 's'; }
        if (i === 4) { var m = Math.min(2, Math.floor(f.local * 3)); S.a = ['al', 'hg', 'cu1'][m]; S.b = 'o'; S.a2 = ['al', 'hg', 'cu1'][m]; S.b2 = 's'; }
      }
      var ex = i >= 3 || (P.manual && false), cl = ctx.layer('cloud'), sm = sums(), s1, s2, s3, s4;
      var stg = P.manual ? 3 : i; ex = stg >= 3;
      if (stg >= 3) {
        if (stg === 3) { S.a = 'al'; S.b = 'o'; S.a2 = 'hg'; S.b2 = 's'; }
        s1 = setPair(pairs[0], S.a, S.b, true); s2 = setPair(pairs[1], S.a2, S.b2, true); s3 = setPair(pairs[2], S.a, S.b2, true); s4 = setPair(pairs[3], S.a2, S.b, true);
      } else { s1 = setPair(pairs[0], S.a, S.b, true); setPair(pairs[1], S.a, S.b, false); setPair(pairs[2], S.a, S.b, false); setPair(pairs[3], S.a, S.b, false); pairs[0].g.position.set(18, 0, 0); }
      pairs[0].g.scale.setScalar(stg >= 3 ? 1 : 1.9);
      if (stg >= 3) pairs[0].g.position.set(13, 4, 0); pairs.forEach(function (p) { p.ca.visible = p.cb.visible = cl; });
      var A = AC[S.a], B = BA[S.b];
      lab[0].pos(stg >= 3 ? 13 : 18, stg >= 3 ? 8 : 4.6, 0).set(stg >= 3 ? AC[S.a].n + ' ' + BA[S.b].n + '  +  ' + AC[S.a2].n + ' ' + BA[S.b2].n : A.n + ' + ' + B.n, 'bl-lead').vis(true);
      lab[1].pos(stg >= 3 ? 13 : 18, stg >= 3 ? -8.3 : -4.2, 0).set(stg >= 3 ? "reactants: score " + fmt(sm.r, 1) : "acid " + CL[A.h] + " · base " + CL[B.h] + " · score " + fmt(s1, 1), 'bl-d').vis(true);
      lab[2].pos(25, 8, 0).set(stg >= 3 ? AC[S.a].n + ' ' + BA[S.b2].n + '  +  ' + AC[S.a2].n + ' ' + BA[S.b].n : '', 'bl-lead').vis(stg >= 3);
      lab[3].pos(25, -8.3, 0).set(stg >= 3 ? "products: score " + fmt(sm.p, 1) : '', 'bl-d').vis(stg >= 3);
      lab[4].pos(19, 0, 0).set(stg >= 3 ? (sm.r > sm.p + 0.2 ? "← favors reactants" : (sm.p > sm.r + 0.2 ? "favors products →" : "≈ equilibrium")) : '', sm.p > sm.r ? 'bl-pos' : 'bl-neg').vis(stg >= 3);
      lab[5].pos(0, 0, 0).set('', 'bl-d').vis(false); lab[6].pos(0, 0, 0).set('', 'bl-d').vis(false); lab[7].pos(0, 0, 0).set('', 'bl-d').vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; ['a', 'b', 'a2', 'b2'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var A = AC[S.a], B = BA[S.b]; return { eq: { chip: "HSAB", name: 'Pareja', body: "<div class=\"eqline\"><small>Acid</small>" + A.n + ' (' + CL[A.h] + ")</div><div class=\"eqline\"><small>Base</small>" + B.n + ' (' + CL[B.h] + ")</div><div class=\"eqline\"><small>Score</small>" + fmt(score(S.a, S.b), 2) + "</div><div class=\"eqline\"><small>Exchange</small>" + (sums().p > sums().r + 0.2 ? "products" : (sums().r > sums().p + 0.2 ? "reactants" : "≈ equilibrium")) + '</div>' }, legend: [{ label: "Purple", color: '#9775fa', text: "hard" }, { label: 'Celeste', color: '#74c0fc', text: "borderline" }, { label: "Orange", color: '#ffa94d', text: "soft" }] }; },
    measures: function () { var A = AC[S.a], B = BA[S.b], s = sums(); return [["Acid", A.n + ' · ' + CL[A.h]], ["Ionic radius", A.r + ' pm'], ['Carga/radio', fmt(A.q / A.r * 100, 2)], ['Base', B.n + ' · ' + CL[B.h]], ["Pair score", fmt(score(S.a, S.b), 2)], ["Σ reactants / products", fmt(s.r, 1) + ' / ' + fmt(s.p, 1)]]; },
    ideas: ["Hard–hard and soft–soft are preferred.", "Hard: small, highly charged.", "Soft: large and polarizable.", "Adding scores predicts the exchange."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Acid–base pair"); el.appendChild(c);
      function oa(o) { return Object.keys(o).map(function (k) { return { v: k, label: o[k].n, sub: CL[o[k].h] }; }); }
      ui.a = kit.ui.options({ label: "Acid (cation)", cols: 3, value: S.a, options: oa(AC), onChange: function (v) { ctx.goManual(); S.a = v; } });
      ui.b = kit.ui.options({ label: 'Base', cols: 3, value: S.b, options: oa(BA), onChange: function (v) { ctx.goManual(); S.b = v; } });
      c.appendChild(ui.a); c.appendChild(ui.b);
      var d = kit.ui.card("Exchange reaction"); el.appendChild(d);
      ui.a2 = kit.ui.options({ label: "Second acid", cols: 3, value: S.a2, options: oa(AC), onChange: function (v) { ctx.goManual(); S.a2 = v; } });
      ui.b2 = kit.ui.options({ label: "Second base", cols: 3, value: S.b2, options: oa(BA), onChange: function (v) { ctx.goManual(); S.b2 = v; } });
      d.appendChild(ui.a2); d.appendChild(ui.b2); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Score: reactants versus products", h: 190, note: "The equilibrium shifts toward the side with the higher score.", draw: function (cx, w, h, col) {
      var s = sums(), L = 20, B = 26, Tp = 14, ph = h - Tp - B, bw = (w - 2 * L) / 2, mx = Math.max(s.r, s.p, 1) * 1.1; cx.font = '11px system-ui'; cx.textAlign = 'center';
      [["Reactants", s.r, '#74c0fc'], ["Products", s.p, '#69db7c']].forEach(function (x, j) { var hh = ph * x[1] / mx; cx.fillStyle = x[2]; cx.fillRect(L + j * bw + 20, Tp + ph - hh, bw - 40, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 10); cx.fillText(fmt(x[1], 1), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }, { title: "Ionic radius and hardness (cations)", h: 200, note: "Soft ones (orange) tend to be larger and less charged.", draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B; Object.keys(AC).forEach(function (k) { var a = AC[k], x = L + pw * (a.r / 120), y = Tp + ph * (1 - a.q / 3.4); cx.fillStyle = CC[a.h]; cx.beginPath(); cx.arc(x, y, k === S.a ? 7 : 4.5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '9px system-ui'; cx.textAlign = 'center'; cx.fillText(a.n, x, y - 8); });
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText("radius (pm) →", L + pw / 2, h - 8); cx.textAlign = 'right'; cx.fillText("charge", L - 4, Tp + 8);
    } }],
    calc: function () { var s = sums(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, nm = function (a, b) { return AC[a].n + '–' + BA[b].n; }; return "<div class=\"card-kicker\">Qualitative score: 3 − 1.5·|Δhardness| + ionic (hard–hard) or covalent (soft–soft) terms</div><table class=\"calc-table\">" + row(nm(S.a, S.b), fmt(score(S.a, S.b), 2)) + row(nm(S.a2, S.b2), fmt(score(S.a2, S.b2), 2)) + row(nm(S.a, S.b2), fmt(score(S.a, S.b2), 2)) + row(nm(S.a2, S.b), fmt(score(S.a2, S.b), 2)) + row("Σ reactants", '<b>' + fmt(s.r, 2) + '</b>') + row("Σ products", '<b>' + fmt(s.p, 2) + '</b>') + row("Prediction", '<b>' + (s.p > s.r + 0.2 ? "products are favored" : (s.r > s.p + 0.2 ? "reactants are favored" : "comparable equilibrium")) + '</b>') + '</table>'; },
    quiz: [
      { q: "According to HSAB, a hard acid prefers to bind to a base…", options: ["hard", "soft", "any one equally", "neutral"], answer: 0, why: "Hard with hard and soft with soft." },
      { q: "A soft acid is…", options: ['Hg²⁺', 'Al³⁺', 'Mg²⁺', 'H⁺'], answer: 0, why: "Large, polarizable and of moderate charge." },
      { q: "Polarizability is greater in…", options: ['I⁻', 'F⁻', 'OH⁻', 'O²⁻'], answer: 0, why: "Larger size, more deformable cloud." },
      { q: "Mercury occurs in nature mainly as…", options: ["sulfide (HgS)", "oxide", "silicate", "fluoride"], answer: 0, why: "Soft Hg²⁺ ↔ soft S²⁻." },
      { q: "In Al³⁺ + F⁻ the bond is mainly…", options: ["ionic", "nonpolar covalent", "metallic", "van der Waals"], answer: 0, why: "Hard–hard: high charge/radius." },
      { q: "HgS + Al₂O₃ ⇌ Hg and Al exchanged (HgO + Al₂S₃) shifts toward…", options: ["the reactants", "the products", "no preference", "gas only"], answer: 0, why: "The original pairs are hard–hard and soft–soft." }
    ],
    help: { intro: "Choose an acid and a base: sphere size reflects radius and the cloud reflects polarizability. The exchange between two pairs is further below.", items: [["Central sphere", "ion or molecule."], ["Translucent cloud", 'polarizabilidad.']] }
  };
  MSim.create(def);
})();
