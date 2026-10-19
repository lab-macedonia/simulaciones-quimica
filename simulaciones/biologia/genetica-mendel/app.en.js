/* Genética mendeliana y Hardy–Weinberg — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var CR = { m1: { n: "Aa × Aa", a: ['Aa'], b: ['Aa'] }, m2: { n: "Aa × aa (test cross)", a: ['Aa'], b: ['aa'] }, m3: { n: "AA × aa", a: ['AA'], b: ['aa'] }, d1: { n: "AaBb × AaBb", a: ['Aa', 'Bb'], b: ['Aa', 'Bb'] }, d2: { n: "AaBb × aabb (test cross)", a: ['Aa', 'Bb'], b: ['aa', 'bb'] }, d3: { n: "AABB × aabb", a: ['AA', 'BB'], b: ['aa', 'bb'] } };
  var S = { cr: 'm1', mode: 'cross', n: 160, seed: 1, q0: 0.3, s: 0, N: 500, gen: 0 }, g = null, cells = [], pops = [], lab = [], gSph = null, gOct = null, cache = null;
  function loci(k) { return CR[k].a.length; }
  function gam(p) { var out = ['']; p.forEach(function (l) { var nx = []; out.forEach(function (o) { nx.push(o + l[0]); nx.push(o + l[1]); }); out = nx; }); var u = []; out.forEach(function (x) { if (u.indexOf(x) < 0) u.push(x); }); return CR[S.cr] && p.every(function (l) { return l[0] === l[1]; }) ? [out[0]] : (function () { var r = ['']; p.forEach(function (l) { var nx = []; r.forEach(function (o) { nx.push(o + l[0]); if (l[0] !== l[1]) nx.push(o + l[1]); }); r = nx; }); return r; })(); }
  function geno(g1, g2) { var s = ''; for (var i = 0; i < g1.length; i++) { var a = g1[i], b = g2[i]; s += (a === a.toUpperCase() ? a + b : (b === b.toUpperCase() ? b + a : a + b)); } return s; }
  function grid() { var c = CR[S.cr], g1 = gam(c.a), g2 = gam(c.b), rows = []; g2.forEach(function (y) { g1.forEach(function (x) { rows.push(geno(x, y)); }); }); return { g1: g1, g2: g2, cells: rows }; }
  function cls(gt) { var A = gt[0] === gt[0].toUpperCase() || gt[1] === gt[1].toUpperCase(); var a = (gt.slice(0, 2).toUpperCase() !== gt.slice(0, 2)) || gt.slice(0, 2) === gt.slice(0, 2).toUpperCase() ? (gt.slice(0, 2).toLowerCase() !== gt.slice(0, 2)) : false; var dA = /[A-Z]/.test(gt.slice(0, 2)); if (gt.length === 2) return dA ? 0 : 1; var dB = /[A-Z]/.test(gt.slice(2, 4)); return (dA ? 0 : 2) + (dB ? 0 : 1); }
  function names() { return loci(S.cr) === 1 ? ["Yellow (dominant)", "Green (recessive)"] : ["Yellow smooth", "Yellow wrinkled", "Green smooth", "Green wrinkled"]; }
  function expected() { var G = grid(), k = names().length, e = []; for (var i = 0; i < k; i++) e.push(0); G.cells.forEach(function (c) { e[cls(c)] += 1 / G.cells.length; }); return e; }
  function rng(i) { var x = Math.sin((i + S.seed * 977) * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function observed() { var G = grid(), k = names().length, o = []; for (var i = 0; i < k; i++) o.push(0); for (var j = 0; j < S.n; j++) { var c = G.cells[Math.floor(rng(j) * G.cells.length)]; o[cls(c)]++; } return o; }
  function erfc(x) { var t = 1 / (1 + 0.3275911 * x), y = ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592; return y * t * Math.exp(-x * x); }
  function chi() { var o = observed(), e = expected(), x = 0, df = -1; o.forEach(function (v, i) { if (e[i] > 0) { x += Math.pow(v - e[i] * S.n, 2) / (e[i] * S.n); df++; } }); var p = df === 1 ? erfc(Math.sqrt(x / 2)) : (df === 3 ? erfc(Math.sqrt(x / 2)) + Math.sqrt(2 * x / Math.PI) * Math.exp(-x / 2) : (df === 2 ? Math.exp(-x / 2) : 1)); return { x: x, df: df, p: Math.min(1, p), o: o, e: e }; }
  function traj() { var key = [S.q0, S.s, S.N, S.seed].join('|'); if (cache && cache.k === key) return cache.v; var q = S.q0, v = [q], i; for (i = 1; i <= 40; i++) { q = q * (1 - S.s * q) / (1 - S.s * q * q); if (S.N < 500) { var c = 0; for (var j = 0; j < 2 * S.N; j++) if (rng(i * 1000 + j) < q) c++; q = c / (2 * S.N); } v.push(q); } cache = { k: key, v: v }; return v; }
  function qn() { return traj()[Math.round(S.gen)]; }
  function stages() {
    return [
      ["Monohybrid Punnett square", "Monohybrid", "Aa × Aa → 3 dominant : 1 recessive (1 AA : 2 Aa : 1 aa)",
        "<p>In a <b>monohybrid cross</b> each Aa parent produces A and a gametes with equal probability (<b>law of segregation</b>). The <b>Punnett square</b> combines the gametes: <b>1 AA : 2 Aa : 1 aa</b>, that is, <b>3 dominant phenotype : 1 recessive</b>. Yellow peas are dominant over green ones.</p>"],
      ["Dihybrid cross", "Dihybrid", "AaBb × AaBb → 9 : 3 : 3 : 1",
        "<p>With two genes inherited <b>independently</b> (law of independent assortment), each AaBb parent forms four gametes (AB, Ab, aB, ab). The square has 16 boxes and gives the phenotypic ratio <b>9 : 3 : 3 : 1</b>. Test crosses with the double recessive give 1 : 1 : 1 : 1.</p>"],
      ["χ² test", 'χ²', "Compare observed with expected: χ² = Σ(O − E)²/E",
        "<p>A real sample never matches the expected values exactly. The <b>χ²</b> test measures whether the difference can be due to chance: <b>χ² = Σ (O − E)² / E</b> with df = classes − 1. If <b>p &gt; 0.05</b> the data are compatible with the Mendelian ratio. Change the sample size and the seed.</p>"],
      ["Hardy–Weinberg equilibrium", "Hardy–Weinberg", "p² + 2pq + q² = 1 if no selection, drift, mutation or migration",
        "<p>In a large, randomly mating population with no selection, mutation or migration, the <b>allele frequencies p and q</b> (p + q = 1) stay constant and the genotypes follow <b>p² + 2pq + q² = 1</b> from the first generation. Notice that q does not change across generations.</p>"],
      ["Selection and drift", "Selection and drift", "Selection changes q predictably; random drift, especially in small populations",
        "<p>If recessive homozygotes have lower fitness (selection <b>s</b>), q decreases each generation: <b>q′ = q(1 − s·q)/(1 − s·q²)</b>. In <b>small</b> populations <b>genetic drift</b> makes q fluctuate at random and can fix or lose an allele. Change s and the population size.</p>"]
    ];
  }
  var def = {
    key: 'genetica-mendel', title: "Mendelian genetics and Hardy–Weinberg", subtitle: "3D simulator · genetics", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [22, 6, 24], target: [22, 0, 0] }, { id: 'frontal', label: "Front", pos: [22, 0, 28], target: [22, 0, 0] }],
    layers: [{ id: 'pop', label: "Population", icon: '◉' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i; gSph = new T.SphereGeometry(0.7, 14, 10); gOct = new T.OctahedronGeometry(0.75);
      for (i = 0; i < 16; i++) { var m = new T.Mesh(gSph, new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.5 })); g.add(m); cells.push(m); }
      for (i = 0; i < 50; i++) { var q = new T.Mesh(new T.SphereGeometry(0.25, 10, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(q); pops.push(q); }
      for (i = 0; i < 34; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.cr = 'm1'; S.mode = 'cross'; } if (i === 1) { S.cr = 'd1'; S.mode = 'cross'; } if (i === 2) { S.cr = f.local < 0.5 ? 'm1' : 'd1'; S.mode = 'cross'; S.n = 20 + Math.round(480 * f.local); } if (i === 3) { S.mode = 'hw'; S.s = 0; S.N = 500; S.q0 = 0.3; S.gen = 40 * f.local; } if (i === 4) { S.mode = 'hw'; S.s = f.local < 0.5 ? 0.5 : 0; S.N = f.local < 0.5 ? 500 : 20; S.gen = 40 * ((f.local * 2) % 1); } }
      var cross = S.mode === 'cross', G = grid(), nc = G.cells.length, side = G.g1.length, ncol = side, nrow = G.g2.length, cs = 2.3, x0 = 22, y0 = 5.5, L = 0, th = ctx.now;
      cells.forEach(function (m, j) { m.visible = cross && j < nc; if (!(cross && j < nc)) return; var gt = G.cells[j], c = j % ncol, r = Math.floor(j / ncol); m.position.set(x0 + c * cs, y0 - r * cs, 0); var k = cls(gt), ya = loci(S.cr) === 1 ? k === 0 : k < 2, ro = loci(S.cr) === 1 ? true : k % 2 === 0; m.material.color.setHex(ya ? 0xffd43b : 0x51cf66); m.geometry = ro ? gSph : gOct; m.rotation.y = th * 0.3; });
      var li = 0; function L2(x, y, t, cl) { if (li < lab.length) { lab[li].pos(x, y, 0).set(t, cl || 'bl-d').vis(true); li++; } }
      if (cross) {
        G.g1.forEach(function (x, c) { L2(x0 + c * cs, y0 + 1.5, '♂ ' + x, 'bl-lead'); }); G.g2.forEach(function (y, r) { L2(x0 - 2, y0 - r * cs, '♀ ' + y, 'bl-lead'); });
        G.cells.forEach(function (gt, j) { L2(x0 + (j % ncol) * cs, y0 - Math.floor(j / ncol) * cs - 1.1, gt, 'bl-d'); });
        var e = expected(), nm = names(); L2(26, y0 + 3.2, CR[S.cr].n + ' · ' + nm.map(function (x, k) { return fmt(e[k] * 100, 1) + ' % ' + x.toLowerCase(); }).slice(0, 4).join(' · ').slice(0, 60), 'bl-lead');
      } else { L2(28, 7.2, 'p = ' + fmt(1 - qn(), 3) + ' · q = ' + fmt(qn(), 3) + " · generation " + Math.round(S.gen), 'bl-lead'); }
      for (; li < lab.length; li++) lab[li].vis(false);
      var q = cross ? 0.5 : qn(), pp = 1 - q, nAA = Math.round(50 * pp * pp), nAa = Math.round(50 * 2 * pp * q);
      pops.forEach(function (o, j) { o.visible = ctx.layer('pop') && j < 50; var gt = j < nAA ? 0 : (j < nAA + nAa ? 1 : 2); o.material.color.setHex(gt === 0 ? 0x1c7ed6 : (gt === 1 ? 0x74c0fc : 0xffa94d)); o.position.set(21 + (j % 25) * 0.62, -3.8 - Math.floor(j / 25) * 0.7, 0); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cr) u.cr.set(S.cr); ['n', 'seed', 'q0', 's', 'N', 'gen'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var c = chi(), q = qn(), p = 1 - q; return { eq: { chip: S.mode === 'cross' ? 'χ²' : 'q', name: S.mode === 'cross' ? "Sample" : "Population", body: S.mode === 'cross' ? '<div class="eqline"><small>χ²</small>' + fmt(c.x, 2) + '</div><div class="eqline"><small>gl</small>' + c.df + '</div><div class="eqline"><small>p</small>' + fmt(c.p, 3) + '</div>' : '<div class="eqline"><small>p · q</small>' + fmt(p, 3) + ' · ' + fmt(q, 3) + "</div><div class=\"eqline\"><small>AA · Aa · aa</small>" + fmt(p * p, 3) + ' · ' + fmt(2 * p * q, 3) + ' · ' + fmt(q * q, 3) + "</div><div class=\"eqline\"><small>Generation</small>" + Math.round(S.gen) + '</div>' }, legend: [{ label: "Yellow / green", color: '#ffd43b', text: "seed color (A dominant)" }, { label: "Sphere / octahedron", color: '#adb5bd', text: "smooth / wrinkled (B dominant)" }] }; },
    measures: function () { var c = chi(), q = qn(), p = 1 - q; return [['Cruce', CR[S.cr].n], ['Casillas', String(grid().cells.length)], ['χ² (n = ' + S.n + ')', fmt(c.x, 2)], ['p-valor', fmt(c.p, 3)], ["Frequency of q", fmt(q, 3)], ["Genotypes AA · Aa · aa", fmt(p * p, 2) + ' · ' + fmt(2 * p * q, 2) + ' · ' + fmt(q * q, 2)]]; },
    ideas: ["Aa × Aa → 3 : 1.", "AaBb × AaBb → 9 : 3 : 3 : 1.", "p > 0.05 → consistent with expected.", "Hardy–Weinberg: p² + 2pq + q² = 1."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Cross and sample"); el.appendChild(c);
      ui.cr = kit.ui.options({ label: 'Cruce', cols: 1, value: S.cr, options: Object.keys(CR).map(function (k) { return { v: k, label: CR[k].n }; }), onChange: function (v) { ctx.goManual(); S.cr = v; S.mode = 'cross'; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; if (k === 'n' || k === 'seed') S.mode = 'cross'; else S.mode = 'hw'; } }); return ui[k]; }
      c.appendChild(ui.cr); c.appendChild(kit.ui.sliders([sl('n', "Offspring in the sample", 10, 800, 10, function (v) { return String(v); }), sl('seed', 'Semilla', 1, 30, 1, function (v) { return String(v); })]));
      var d = kit.ui.card("Hardy–Weinberg"); el.appendChild(d);
      d.appendChild(kit.ui.sliders([sl('q0', "Initial frequency q (a)", 0.05, 0.95, 0.05, function (v) { return fmt(v, 2); }), sl('s', "Selection against aa (s)", 0, 1, 0.05, function (v) { return fmt(v, 2); }), sl('N', "Population size (500 = infinite)", 10, 500, 10, function (v) { return v >= 500 ? '∞' : String(v); }), sl('gen', "Generation", 0, 40, 1, function (v) { return String(Math.round(v)); })]));
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Observed versus expected", h: 210, note: "Bars: observed. Marks: expected according to Mendel.", draw: function (cx, w, h, col) {
      var c = chi(), nm = names(), L = 10, B = 40, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / nm.length, mx = Math.max.apply(0, c.o.concat(c.e.map(function (x) { return x * S.n; }))) * 1.1 || 1; cx.font = '10px system-ui'; cx.textAlign = 'center';
      c.o.forEach(function (v, k) { var hh = ph * v / mx; cx.fillStyle = '#69db7c'; cx.fillRect(L + k * bw + 8, Tp + ph - hh, bw - 16, hh); var ey = Tp + ph * (1 - c.e[k] * S.n / mx); cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L + k * bw + 4, ey); cx.lineTo(L + (k + 1) * bw - 4, ey); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.muted; cx.fillText(String(v), L + k * bw + bw / 2, Tp + ph - hh - 3); cx.fillText(nm[k].replace(" (dominant)", '').replace(" (recessive)", ''), L + k * bw + bw / 2, h - 18); });
    } }, { title: "Frequency of q per generation", h: 190, note: "With selection q falls; with drift it fluctuates at random.", draw: function (cx, w, h, col) {
      var v = traj(), L = 30, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); v.forEach(function (q, k) { var x = L + pw * k / 40, y = Tp + ph * (1 - q); k ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      var k2 = Math.round(S.gen); cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * k2 / 40, Tp + ph * (1 - v[k2]), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText("40 gen.", L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('1', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph);
    } }],
    calc: function () { var c = chi(), nm = names(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, q = qn(), p = 1 - q, det = c.o.map(function (v, k) { return nm[k] + ': O = ' + v + ', E = ' + fmt(c.e[k] * S.n, 1); }).join('<br>'); return '<div class="card-kicker">' + CR[S.cr].n + '</div><table class="calc-table">' + row("Phenotypic classes", det) + row('χ²', '<b>' + fmt(c.x, 2) + "</b> · df = " + c.df) + row('p-valor', '<b>' + fmt(c.p, 3) + '</b> → ' + (c.p > 0.05 ? "compatible with expected" : "expected is rejected")) + row("Hardy–Weinberg", 'p = ' + fmt(p, 3) + ' · q = ' + fmt(q, 3) + "<br>p² + 2pq + q² = " + fmt(p * p, 3) + ' + ' + fmt(2 * p * q, 3) + ' + ' + fmt(q * q, 3) + ' = ' + fmt(p * p + 2 * p * q + q * q, 3)) + '</table>'; },
    quiz: [
      { q: "The Aa × Aa cross produces the phenotypic ratio…", options: ['3 : 1', '1 : 1', '9 : 3 : 3 : 1', '1 : 2 : 1'], answer: 0, why: "1 AA : 2 Aa : 1 aa." },
      { q: "The AaBb × AaBb cross (independent genes) produces…", options: ['9 : 3 : 3 : 1', '3 : 1', '1 : 1 : 1 : 1', '1 : 2 : 1'], answer: 0, why: "16 cells." },
      { q: "If q = 0.3 at equilibrium, the frequency of aa is…", options: ['0,09', '0,30', '0,42', '0,49'], answer: 0, why: 'q² = 0,09.' },
      { q: "A p value > 0.05 in the χ² test indicates that…", options: ["the data are consistent with the expected ratio", "the ratio is false", "there is selection", "the trait is sex-linked"], answer: 0, why: "The difference may be due to chance." },
      { q: "Genetic drift is stronger in…", options: ["small populations", "large populations", "populations without variation", "none"], answer: 0, why: "Gamete sampling varies more." },
      { q: "The test cross of a dominant individual uses an individual…", options: ["homozygous recessive", "heterozygous", "homozygous dominant", "haploid"], answer: 0, why: "It reveals the unknown genotype." }
    ],
    help: { intro: "Choose a cross to see the Punnett square with yellow/green and smooth/wrinkled seeds. In \"Lab\" adjust the sample for the χ² test and the Hardy–Weinberg parameters.", items: [["Grid", "Punnett square."], ["Small spheres", "population: AA, Aa and aa."]] }
  };
  MSim.create(def);
})();
