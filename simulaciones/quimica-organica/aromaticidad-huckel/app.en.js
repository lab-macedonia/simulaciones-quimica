/* Aromaticidad y regla de Hückel — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  // tipo: planar + cíclico + conjugado; ne = electrones π; el = elementos del anillo; kek = órdenes de enlace (Kekulé)
  var C = [
    { id: "benzene", n: "Benzene", f: 'C₆H₆', ring: 6, ne: 6, el: 'CCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: "All six C–C bonds measure 1.39 Å (neither single nor double). Resonance energy ≈ 150 kJ/mol: it does not hydrogenate or add like an alkene." },
    { id: 'cb', n: "Cyclobutadiene", f: 'C₄H₄', ring: 4, ne: 4, el: 'CCCC', kek: [2, 1, 2, 1], q: '', cls: 'anti', rect: true, note: "4n π electrons: antiaromatic. It distorts to a rectangle (1.34 and 1.57 Å) and is so unstable that it can only be isolated at very low temperature." },
    { id: 'cot', n: "Cyclooctatetraene (COT)", f: 'C₈H₈', ring: 8, ne: 8, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '', cls: 'non', tub: true, note: "It would have 8 π electrons: if planar it would be antiaromatic. It folds into a tub shape and behaves like four isolated double bonds." },
    { id: 'cpm', n: "Cyclopentadienyl anion", f: 'C₅H₅⁻', ring: 5, ne: 6, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁻', cls: 'aro', note: "6 π electrons in a planar 5-carbon ring: aromatic. It explains the acidity of cyclopentadiene (pKa ≈ 16) and ferrocene." },
    { id: 'cpp', n: "Cyclopentadienyl cation", f: 'C₅H₅⁺', ring: 5, ne: 4, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁺', cls: 'anti', note: "4 π electrons: antiaromatic, very unstable (not known as a stable species)." },
    { id: 'trop', n: "Tropylium cation", f: 'C₇H₇⁺', ring: 7, ne: 6, el: 'CCCCCCC', kek: [2, 1, 2, 1, 2, 1, 1], q: '⁺', cls: 'aro', note: "6 π electrons over 7 C: aromatic. It is so stable that it exists as a salt (tropylium bromide)." },
    { id: 'cpr', n: "Cyclopropenyl cation", f: 'C₃H₃⁺', ring: 3, ne: 2, el: 'CCC', kek: [2, 1, 1], q: '⁺', cls: 'aro', note: "2 π electrons (n = 0): the smallest aromatic ring; it is prepared as a stable salt." },
    { id: 'cot2', n: "COT dianion", f: 'C₈H₈²⁻', ring: 8, ne: 10, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '²⁻', cls: 'aro', note: "10 π electrons: the ring flattens and is aromatic (4n + 2 with n = 2). It is obtained with metallic K." },
    { id: "pyrrole", n: "Pyrrole", f: 'C₄H₅N', ring: 5, ne: 6, el: 'NCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', hs: { 0: 'NH' }, note: "The lone pair of N (in a p orbital) contributes 2 electrons to the π system: 4 from the two C=C + 2 = 6. That is why the N of pyrrole is not basic." },
    { id: "pyridine", n: "Pyridine", f: 'C₅H₅N', ring: 6, ne: 6, el: 'NCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: "Like benzene: 6 π electrons. The lone pair of N is in the plane (sp² orbital), outside the π system: pyridine is basic (pKa of the pyridinium ion ≈ 5.2)." },
    { id: "furan", n: "Furan", f: 'C₄H₄O', ring: 5, ne: 6, el: 'OCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', note: "One lone pair of O contributes 2 electrons to the π system (the other pair stays in the plane): 6 π electrons, moderately aromatic." },
    { id: 'cpd', n: "Cyclopenta-1,3-diene", f: 'C₅H₆', ring: 5, ne: 4, el: 'CCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'non', sp3: true, note: "The sp³ carbon (CH₂) interrupts the conjugation: it is not a fully conjugated cyclic system, so it is not aromatic." }
  ];
  var CID = {}; C.forEach(function (c) { CID[c.id] = c; });
  var CLS = { aro: "aromatic", anti: "antiaromatic", non: "nonaromatic" };
  var S = { cs: "benzene", mo: 0, delo: true, si: 0, run: false, prog: 0 }, grp = null, key_ = '', lobes = [], tor = [], lab = {}, matB, matR;
  function ordr(n) { var ks = []; for (var k = 0; k < n; k++) ks.push(k); ks.sort(function (a, b) { var xa = 2 * Math.cos(2 * Math.PI * a / n), xb = 2 * Math.cos(2 * Math.PI * b / n); return Math.abs(xa - xb) < 1e-9 ? a - b : xb - xa; }); return ks; }
  function xk(n, k) { return 2 * Math.cos(2 * Math.PI * k / n); }
  function occ(n, ne) { var o = ordr(n), res = {}, left = ne, i = 0; while (i < n) { var j = i; while (j < n && Math.abs(xk(n, o[j]) - xk(n, o[i])) < 1e-9) j++; var g = j - i, take = Math.min(left, 2 * g), base = Math.floor(take / g), extra = take - base * g; for (var q = i; q < j; q++) res[o[q]] = base + ((q - i) < extra ? 1 : 0); left -= take; i = j; } return res; }
  function coef(n, k) { var c = []; for (var j = 0; j < n; j++) { if (2 * k === n) c.push(j % 2 ? -1 : 1); else if (k === 0) c.push(1); else if (2 * k < n) c.push(Math.cos(2 * Math.PI * k * j / n)); else c.push(Math.sin(2 * Math.PI * (n - k) * j / n) * 1.0); } return c; }
  function energy(c) { var n = c.ring, o = occ(n, c.ne), s = 0; for (var k = 0; k < n; k++) s += (o[k] || 0) * xk(n, k); return s; }
  function lin(c) { var e = 0, left = c.ne; for (var m = 1; m <= c.ring; m++) { var t = Math.min(2, left); e += t * 2 * Math.cos(m * Math.PI / (c.ring + 1)); left -= t; } return e; }
  function de(c) { return energy(c) - lin(c); }
  function huckel(c) { var m = c.ne - 2; return m % 4 === 0 ? '4n + 2 (n = ' + (m / 4) + ')' : (c.ne % 4 === 0 ? '4n (n = ' + (c.ne / 4) + ')' : '—'); }
  function geo(c) {
    var n = c.ring, A = [], B = [], R = 1.4 / (2 * Math.sin(Math.PI / n)), i;
    for (i = 0; i < n; i++) {
      var th = 2 * Math.PI * i / n - Math.PI / 2, x = R * Math.cos(th), z = R * Math.sin(th), y = 0;
      if (c.rect) { var sx = (i === 0 || i === 3) ? -1 : 1, sz = (i < 2) ? -1 : 1; x = sx * 0.78; z = sz * 0.67; if (i === 1) { x = 0.78; z = -0.67; } if (i === 2) { x = 0.78; z = 0.67; } if (i === 3) { x = -0.78; z = 0.67; } if (i === 0) { x = -0.78; z = -0.67; } }
      if (c.tub) { R = 1.46 / (2 * Math.sin(Math.PI / n)) * 0.9; x = R * Math.cos(th); z = R * Math.sin(th); y = [0.55, 0.55, -0.55, -0.55, 0.55, 0.55, -0.55, -0.55][i]; }
      A.push([c.el[i], x, y, z]);
    }
    for (i = 0; i < n; i++) { var j = (i + 1) % n, ord = (c.cls === 'aro' && S.delo) ? 1 : c.kek[i]; B.push([i, j, ord]); }
    for (i = 0; i < n; i++) {
      var a = A[i]; if (c.el[i] === 'O' || (c.el[i] === 'N' && !(c.hs && c.hs[i]))) continue; var r = Math.sqrt(a[1] * a[1] + a[3] * a[3]) || 1, dx = a[1] / r, dz = a[3] / r;
      if (c.sp3 && i === 0) { A.push(['H', a[1] + dx * 0.6, a[2] + 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); A.push(['H', a[1] + dx * 0.6, a[2] - 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); continue; }
      var L = c.el[i] === 'N' ? 1.01 : 1.09; A.push(['H', a[1] + dx * L, a[2] * 1.1, a[3] + dz * L]); B.push([i, A.length - 1, 1]);
    }
    return { a: A, b: B, R: R };
  }
  function rebuild(ctx) {
    var c = CID[S.cs]; if (grp) ctx.scene.remove(grp); grp = new T.Group(); var g = geo(c); grp.add(ctx.mol(g, { gs: 1, ar: 0.5, bw: 1.2 })); lobes = []; tor = [];
    var sg = new T.SphereGeometry(1, 16, 12);
    for (var i = 0; i < c.ring; i++) { var a = g.a[i]; for (var s = 0; s < 2; s++) { var m = new T.Mesh(sg, matB); m.position.set(a[1], a[2] + (s ? -0.85 : 0.85), a[3]); m.userData = { i: i, s: s, y0: a[2] }; grp.add(m); lobes.push(m); } }
    var rr = Math.max(0.9, g.R); for (var u = 0; u < 2; u++) { var t = new T.Mesh(new T.TorusGeometry(rr, 0.16, 10, 48), new T.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.y = u ? -0.85 : 0.85; grp.add(t); tor.push(t); }
    ctx.scene.add(grp); key_ = S.cs + '|' + S.delo; S.mo = Math.min(S.mo, c.ring - 1);
  }
  function stages() {
    return [
      ["The four criteria", "Criteria", "Cyclic, planar, fully conjugated and with 4n + 2 π electrons",
        "<p>A compound is <b>aromatic</b> if it is <b>cyclic, planar, with a p orbital on every ring atom (complete conjugation)</b> and has <b>4n + 2 π electrons</b> (2, 6, 10, 14…). If it meets the rest but has <b>4n π electrons</b> (4, 8, 12…) it is <b>antiaromatic</b> (destabilized); if it fails any of the structural criteria it is <b>nonaromatic</b>.</p>"],
      ["Benzene", "Benzene", "Six π electrons delocalized over the whole ring",
        "<p>In <b>benzene</b> the six p orbitals overlap in two clouds (toroids) above and below the plane: the π electrons do not belong to three double bonds, but to the whole ring. All six C–C bonds are equal (1.39 Å). Switch between <b>Kekulé</b> (localized) and <b>delocalized</b> in “Lab” and see how the classical model is only one of the resonance forms.</p>"],
      ["π molecular orbitals", "π orbitals", "The n p orbitals give n MOs: energies α + 2β·cos(2πk/n)",
        "<p>The n p orbitals of a ring form n molecular orbitals with energies <b>E<sub>k</sub> = α + 2β cos(2πk/n)</b>. The <b>Frost circle</b> brings them together: a polygon with one vertex at the bottom inscribed in a circle of radius 2|β|. For benzene: one lowest-energy MO, two degenerate ones, two degenerate ones and one of highest energy. The 6 electrons exactly fill the three bonding MOs: <b>closed shell</b>. The blue and red lobes are the phases of the selected MO.</p>"],
      ["Antiaromaticity", "Antiaromatics", "With 4n π electrons there are unpaired electrons",
        "<p>With <b>4 π electrons</b> (cyclobutadiene) or <b>8 π electrons</b> (planar COT) the last two electrons occupy two <b>degenerate nonbonding MOs</b>: <b>open shell</b>, unpaired and very reactive. The molecule escapes antiaromaticity by <b>distorting</b>: cyclobutadiene becomes rectangular and COT folds into a tub shape (nonaromatic).</p>"],
      ["Aromatic ions", "Ions", "A charged ring can also be aromatic",
        "<p>The <b>cyclopentadienyl anion</b> (6 e⁻), the <b>tropylium cation</b> (6 e⁻), the <b>cyclopropenyl cation</b> (2 e⁻) and the <b>COT dianion</b> (10 e⁻) satisfy 4n + 2. They explain why <b>cyclopentadiene</b> has a pKa of ≈ 16 (very acidic for a hydrocarbon) and why tropylium bromide is a stable salt.</p>"],
      ["Heterocycles", "Heterocycles", "The heteroatom contributes 0 or 2 electrons to the π system",
        "<p>In <b>pyrrole</b> and <b>furan</b> a lone pair of the heteroatom is in a p orbital and <b>contributes 2 electrons</b> to the sextet: 4 + 2 = 6. In <b>pyridine</b>, the N pair is in the plane (sp²) and <b>does not count</b>: the 6 electrons come from the three C=C and N keeps its basicity. That is why pyrrole is not basic and pyridine is.</p>"]
    ];
  }
  var LESSON = [["benzene", 'cb', 'cpd', "benzene"], ["benzene"], ["benzene", 'trop'], ['cb', 'cot', 'cpp'], ['cpm', 'trop', 'cpr', 'cot2'], ["pyrrole", "pyridine", "furan"]];
  var def = {
    key: 'aromaticidad-huckel', title: "Aromaticity and Hückel's rule", subtitle: "3D simulator · organic chemistry", accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 6, 11], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 14, 0.5], target: [0, 0, 0] }, { id: 'lado', label: "Side", pos: [0, 0.5, 13], target: [0, 0, 0] }],
    layers: [{ id: 'orb', label: "Chosen π orbital", icon: '☁' }, { id: 'tor', label: "π cloud (toroids)", icon: '◯' }, { id: 'spin', label: "Rotate", icon: '⟳' }],
    build: function (ctx) { matB = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false }); matR = new T.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: 0.55, depthWrite: false }); ['t', 'a', 'b'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var l = LESSON[f.i], ix = Math.min(l.length - 1, Math.floor(f.local * l.length)); if (S._st !== f.i || S._ix !== ix) { S._st = f.i; S._ix = ix; S.cs = l[ix]; S.delo = f.i !== 1 || f.local > 0.4; S.mo = 0; } if (f.i === 2) { S.mo = Math.min(CID[S.cs].ring - 1, Math.floor(f.local * 2 % 1 * CID[S.cs].ring)); } }
      if (S.cs + '|' + S.delo !== key_) rebuild(ctx);
      var c = CID[S.cs], n = c.ring, o = ordr(n), k = o[Math.min(S.mo, n - 1)], cf = coef(n, k), orb = ctx.layer('orb'), tr = ctx.layer('tor');
      if (ctx.layer('spin')) grp.rotation.y += dt * 0.3;
      lobes.forEach(function (m) { var u = m.userData, cc = c.cls === 'non' ? (u.i % 2 ? 0 : 0) : cf[u.i], s = Math.abs(cc), sign = (cc >= 0 ? 1 : -1) * (u.s ? -1 : 1); if (c.tub || c.sp3) { m.visible = false; return; } m.visible = orb && s > 0.02; m.material = sign > 0 ? matB : matR; m.scale.set(0.55 * Math.max(0.15, s), 0.8 * Math.max(0.15, s), 0.55 * Math.max(0.15, s)); m.position.y = u.y0 + (u.s ? -1 : 1) * (0.2 + 0.7 * Math.max(0.15, s)); });
      tor.forEach(function (t) { t.visible = tr && c.cls === 'aro' && S.delo; });
      lab.t.pos(0, 3.3, 0).set(c.n + ' · ' + c.f + (c.q ? '' : ''), 'bl-lead').vis(true); lab.a.pos(0, -3.0, 0).set(c.ne + ' e⁻ π · ' + huckel(c) + ' · ' + CLS[c.cls], c.cls === 'aro' ? 'bl-neg' : (c.cls === 'anti' ? 'bl-warn' : 'bl-d')).vis(true);
      lab.b.pos(0, -3.9, 0).set("MO " + (Math.min(S.mo, n - 1) + 1) + ' de ' + n + ' · E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β', 'bl-d').vis(orb && !c.tub && !c.sp3);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo) u.mo.set(S.mo); },
    hud: function () { var c = CID[S.cs]; return { eq: { chip: 'Hückel', name: c.n + ' · ' + c.f, body: "<div class=\"eqline\"><small>π electrons</small>" + c.ne + ' (' + huckel(c) + ")</div><div class=\"eqline\"><small>Classification</small>" + CLS[c.cls] + "</div><div class=\"eqline\"><small>Cyclization versus open chain</small>" + f2(de(c)) + " β (+ stabilizes, − destabilizes)</div>" }, legend: [{ label: "Blue", color: '#4dabf7', text: "+ phase of the p orbital" }, { label: "Red", color: '#ff6b5e', text: "− phase" }, { label: "Purple", color: '#c084fc', text: "delocalized π cloud" }] }; },
    measures: function () { var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n); var homo = -9, lumo = 9; od.forEach(function (k) { var x = xk(n, k); if ((o[k] || 0) > 0) homo = Math.max(-9, homo === -9 ? x : Math.min(homo, x)); else lumo = Math.min(lumo, x); }); var open = od.some(function (k) { var v = o[k] || 0; return v === 1; }); return [["Compound", c.n], ["Ring", n + " atoms"], ["π electrons", String(c.ne)], ["Rule", huckel(c)], ["Classification", CLS[c.cls]], ["Shell", open ? "open (unpaired)" : "closed"], ["π energy", f2(energy(c)) + ' |β|'], ["E. versus open chain", f2(de(c)) + ' |β|']]; },
    ideas: ["Aromatic: <b>cyclic, planar, conjugated and 4n + 2 π electrons</b>.", "With <b>4n π electrons</b> and planar: antiaromatic (open shell); the molecule distorts to escape.", "The heteroatom contributes 2 electrons if its pair is in a p orbital (pyrrole, furan) and 0 if it is in the plane (pyridine).", "Frost circle: E<sub>k</sub> = α + 2β cos(2πk/n)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("π system"); el.appendChild(c);
      ui.cs = kit.ui.options({ label: "Compound", cols: 3, value: S.cs, options: C.map(function (x) { return { v: x.id, label: x.n.replace("Cyclooctatetraene (COT)", 'COT').replace("Cation ", "Cation ").replace("Cyclopentadienyl anion", 'Cp⁻').replace("Cyclopentadienyl cation", 'Cp⁺').replace("Cyclopenta-1,3-diene", "Cyclopentadiene").replace("COT dianion", 'COT²⁻'), sub: x.ne + ' e⁻ · ' + CLS[x.cls] }; }), onChange: function (v) { ctx.goManual(); S.cs = v; S.mo = 0; } }); c.appendChild(ui.cs);
      ui.mo = kit.ui.slider({ label: "π orbital (from lowest to highest energy)", min: 0, max: 7, step: 1, value: S.mo, format: function (v) { return String(v + 1); }, onInput: function (v) { ctx.goManual(); S.mo = Math.min(v, CID[S.cs].ring - 1); } }); c.appendChild(kit.ui.sliders([ui.mo]));
      ui.dl = kit.ui.seg([{ v: 'd', label: "Delocalized" }, { v: 'k', label: 'Kekulé' }], S.delo ? 'd' : 'k', function (v) { ctx.goManual(); S.delo = v === 'd'; }); var r = document.createElement('div'); r.className = 'row'; r.appendChild(ui.dl); c.appendChild(r);
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card("What to observe"); el.appendChild(t); var p = document.createElement('p'); p.className = 'muted small'; t.appendChild(p); ui.tip = p; ui.refresh = function () { if (ui._k !== S.cs) { ui._k = S.cs; p.innerHTML = CID[S.cs].note; } };
    },
    graphs: [
      { title: "Frost circle and orbital filling", h: 270, note: "Each vertex is a π MO; the height indicates its energy (down = bonding). Arrows: electrons. The chosen MO is highlighted.", draw: function (cx, w, h, col) {
        var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), mk = od[Math.min(S.mo, n - 1)], r = Math.min(w / 2 - 34, h / 2 - 28), cx0 = w / 2, cy0 = h / 2;
        cx.strokeStyle = col.line; cx.lineWidth = 1; cx.beginPath(); cx.arc(cx0, cy0, r, 0, 7); cx.stroke(); cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(cx0 - r - 10, cy0); cx.lineTo(cx0 + r + 10, cy0); cx.stroke(); cx.setLineDash([]); cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText("α (nonbonding)", cx0 + r + 8 > w - 80 ? 4 : cx0 + r + 6, cy0 - 3);
        cx.strokeStyle = col.muted; cx.beginPath(); for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n, X = cx0 + r * Math.sin(ang), Y = cy0 + r * Math.cos(ang); if (k === 0) cx.moveTo(X, Y); else cx.lineTo(X, Y); } cx.closePath(); cx.stroke();
        for (k = 0; k < n; k++) { var an = 2 * Math.PI * k / n, X2 = cx0 + r * Math.sin(an), Y2 = cy0 + r * Math.cos(an), e = o[k] || 0, sel = k === mk; cx.strokeStyle = sel ? '#f472b6' : col.ink; cx.lineWidth = sel ? 3.2 : 2; cx.beginPath(); cx.moveTo(X2 - 15, Y2); cx.lineTo(X2 + 15, Y2); cx.stroke(); cx.lineWidth = 1; cx.font = 'bold 14px system-ui'; cx.textAlign = 'center'; if (e >= 1) { cx.fillStyle = '#4dabf7'; cx.fillText('↑', X2 - 5, Y2 - 3); } if (e === 2) { cx.fillStyle = '#ff9f43'; cx.fillText('↓', X2 + 5, Y2 - 3); } }
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText("antibonding", cx0, 12); cx.fillText("bonding", cx0, h - 4);
      } },
      { title: "Stabilization by cyclization (|β|)", h: 250, note: "E(ring) − E(open polyene with the same atoms and electrons). Positive: aromatic; negative: antiaromatic. (Planar COT has an open shell and folds.)", draw: function (cx, w, h, col) {
        var arr = C.filter(function (c) { return c.cls !== 'non'; }), L = 98, R = 40, Tp = 8, B = 10, rh = (h - Tp - B) / arr.length, pw = w - L - R, lo = -1, hi = 1.6, zx = L + pw * (0 - lo) / (hi - lo); cx.font = '10px system-ui';
        cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(zx, Tp); cx.lineTo(zx, h - B); cx.stroke();
        arr.forEach(function (c, i) { var y = Tp + i * rh, v = de(c), sel = c.id === S.cs, x1 = L + pw * (Math.min(0, v) - lo) / (hi - lo), x2 = L + pw * (Math.max(0, v) - lo) / (hi - lo); cx.fillStyle = sel ? '#f472b6' : (c.cls === 'aro' ? '#51cf66' : '#ff8787'); cx.fillRect(x1, y + 3, Math.max(2, x2 - x1), rh - 6); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.n.replace("Cyclopentadienyl anion", 'Cp⁻').replace("Cyclopentadienyl cation", 'Cp⁺').replace("Cation ", '').replace("COT dianion", 'COT²⁻'), L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f2(v), (v >= 0 ? x2 : x1) + (v >= 0 ? 4 : -34), y + rh / 2 + 3); });
      } }
    ],
    calc: function () {
      var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, rows = od.map(function (k) { return row("MO " + (od.indexOf(k) + 1), 'E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β · ' + (o[k] || 0) + ' e⁻'); }).join('');
      return '<div class="card-kicker">' + c.n + ' · ' + c.f + "</div><div class=\"calc-step\">1 · π electron count</div><table class=\"calc-table\">" + row("π electrons", '<b>' + c.ne + '</b>') + row("Rule", huckel(c)) + row("Structure", c.sp3 ? "interrupted by an sp³ C" : (c.tub ? "not planar (tub)" : "planar, conjugated")) + row("Classification", '<b>' + CLS[c.cls] + '</b>') + "</table><div class=\"calc-step\">2 · Molecular orbitals (Hückel)</div><table class=\"calc-table\">" + rows + '</table>' +
        "<div class=\"calc-step\">3 · Comparison with the open polyene</div><table class=\"calc-table\">" + row("E<sub>π</sub> (ring)", c.ne + 'α + ' + f2(energy(c)) + 'β') + row("E<sub>π</sub> (open chain of " + n + ' C)', c.ne + 'α + ' + f2(lin(c)) + 'β') + row("Difference", '<b>' + f2(de(c)) + ' |β|</b>' + (de(c) > 0.05 ? " (the ring stabilizes)" : " (the ring destabilizes)")) + '</table>';
    },
    quiz: [
      { q: "Which of these satisfies Hückel's rule (4n + 2)?", options: ["Benzene (6 π electrons)", "Cyclobutadiene (4 π electrons)", "Planar cyclooctatetraene (8 π electrons)", "Cyclopentadienyl cation (4 π electrons)"], answer: 0, why: '6 = 4(1) + 2.' },
      { q: "Why is cyclobutadiene antiaromatic?", options: ["It is planar and cyclic with 4 π electrons (4n)", "It is not planar", "It has no double bonds", "It has too many electrons"], answer: 0, why: "With 4n π electrons there are two unpaired electrons in degenerate nonbonding MOs." },
      { q: "Why is cyclooctatetraene not aromatic?", options: ["It folds into a tub shape to avoid antiaromaticity", "It has 6 π electrons", "It has no sp² carbons", "It is too small"], answer: 0, why: "With 8 π electrons a planar COT would be antiaromatic; it distorts and there is no complete cyclic conjugation." },
      { q: "How many π electrons does the cyclopentadienyl anion have?", options: ['6', '4', '5', '8'], answer: 0, why: "4 from the two C=C + 2 from the carbanion lone pair = 6: aromatic." },
      { q: "Why is pyrrole not basic while pyridine is?", options: ["In pyrrole the N pair is part of the π sextet; in pyridine it is in the plane", "Pyridine has more carbon atoms", "Pyrrole has a positively charged N", "Pyridine is not aromatic"], answer: 0, why: "Protonating the N of pyrrole would destroy the aromatic sextet; the pyridine pair (sp²) does not participate." },
      { q: "Which molecule is aromatic?", options: ["Tropylium cation (C₇H₇⁺)", "Cyclopentadienyl cation (C₅H₅⁺)", "Cyclopenta-1,3-diene", "Cyclobutadiene"], answer: 0, why: "Tropylium has 6 π electrons in a planar, fully conjugated ring." },
      { q: "In the Frost circle of benzene, how many bonding π MOs are there?", options: ['3', '2', '6', '1'], answer: 0, why: "There is one lowest-energy MO and two degenerate ones, all bonding; the 6 electrons fill them." },
      { q: "Explain the acidity of cyclopentadiene (pKa ≈ 16):", options: ["Its conjugate base is aromatic (6 π electrons)", "It has an OH group", "It is a carboxylic acid", "It loses a vinylic proton"], answer: 0, why: "Deprotonation of the CH₂ generates the cyclopentadienyl anion, which is aromatic and highly stabilized." }
    ],
    help: { intro: "Choose a compound in “Lab” or follow the lesson. The blue/red lobes are the phases of the chosen π orbital; the purple toroids, the delocalized π cloud.", items: [["π orbital", "the control chooses one MO among the n possible."], ["Kekulé / Delocalized", "compares the classical model with the π cloud."], ["Frost circle", "energies and filling in “Graphs”."], ["Calculation", "Hückel's rule and delocalization energy."]] }
  };
  def.sync = function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo && !ctx.P.manual) u.mo.set(S.mo); if (u.refresh) u.refresh(); };
  MSim.create(def);
})();
