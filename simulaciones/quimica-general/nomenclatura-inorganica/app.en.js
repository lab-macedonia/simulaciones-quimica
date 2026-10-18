/* Nomenclatura inorgánica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE;
  var CA = {
    na: { s: 'Na', q: 1, n: "sodium", c: 0xab5cf2 }, k: { s: 'K', q: 1, n: "potassium", c: 0x8f40d4 }, ag: { s: 'Ag', q: 1, n: "silver", c: 0xc0c0c0 }, nh4: { s: 'NH₄', q: 1, n: "ammonium", c: 0x4f7cff, poly: true },
    mg: { s: 'Mg', q: 2, n: "magnesium", c: 0x8aff00 }, ca: { s: 'Ca', q: 2, n: "calcium", c: 0x3dff00 }, zn: { s: 'Zn', q: 2, n: "zinc", c: 0x7d80b0 }, al: { s: 'Al', q: 3, n: "aluminium", c: 0xbfa6a6 },
    fe2: { s: 'Fe', q: 2, n: "iron", c: 0xe06633, ox: true, trad: "ferrous" }, fe3: { s: 'Fe', q: 3, n: "iron", c: 0xc2410c, ox: true, trad: "ferric" }, cu1: { s: 'Cu', q: 1, n: "copper", c: 0xc88033, ox: true, trad: "cuprous" }, cu2: { s: 'Cu', q: 2, n: "copper", c: 0x2f9e44, ox: true, trad: "cupric" }, pb2: { s: 'Pb', q: 2, n: "lead", c: 0x575961, ox: true, trad: "plumbous" }
  };
  var AN = {
    f: { s: 'F', q: 1, n: "fluoride", c: 0x7ee08a, pre: "fluoride" }, cl: { s: 'Cl', q: 1, n: "chloride", c: 0x3ddc5a }, br: { s: 'Br', q: 1, n: "bromide", c: 0xa0522d }, i: { s: 'I', q: 1, n: "iodide", c: 0x9a4fd0 },
    o: { s: 'O', q: 2, n: "oxide", c: 0xff4d4d }, s: { s: 'S', q: 2, n: "sulfide", c: 0xe6c229 }, oh: { s: 'OH', q: 1, n: "hydroxide", c: 0xff8787, poly: true },
    no3: { s: 'NO₃', q: 1, n: "nitrate", c: 0x4f7cff, poly: true, ca: 'N', no: 3 }, no2: { s: 'NO₂', q: 1, n: "nitrite", c: 0x5c7cfa, poly: true, ca: 'N', no: 2 }, so4: { s: 'SO₄', q: 2, n: "sulfate", c: 0xe6c229, poly: true, ca: 'S', no: 4 }, so3: { s: 'SO₃', q: 2, n: "sulfite", c: 0xf2d14f, poly: true, ca: 'S', no: 3 },
    co3: { s: 'CO₃', q: 2, n: "carbonate", c: 0x56606b, poly: true, ca: 'C', no: 3 }, po4: { s: 'PO₄', q: 3, n: "phosphate", c: 0xff9a3d, poly: true, ca: 'P', no: 4 }, clo4: { s: 'ClO₄', q: 1, n: "perchlorate", c: 0x3ddc5a, poly: true, ca: 'Cl', no: 4 }, mno4: { s: 'MnO₄', q: 1, n: "permanganate", c: 0xcc5de8, poly: true, ca: 'Mn', no: 4 }
  };
  var HAL = [['ClO⁻', "hypochlorite", '+1', 'HClO', "hypochlorous acid"], ['ClO₂⁻', "chlorite", '+3', 'HClO₂', "chlorous acid"], ['ClO₃⁻', "chlorate", '+5', 'HClO₃', "chloric acid"], ['ClO₄⁻', "perchlorate", '+7', 'HClO₄', "perchloric acid"]];
  var PRE = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa'];
  var ROM = ['', 'I', 'II', 'III', 'IV'];
  var S = { c: 'na', a: 'cl', p: 0, h: 0 }, g = null, lab = [], cats = [], ans = [], links = [];
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratio() { var c = CA[S.c], a = AN[S.a], l = c.q * a.q / gcd(c.q, a.q); return { nc: l / c.q, na: l / a.q }; }
  function fml(c, a, r) { function part(x, n) { var s = x.s; if (n > 1 && x.poly) s = '(' + s + ')'; return s + (n > 1 ? sub(n) : ''); } return part(c, r.nc) + part(a, r.na); }
  function sub(n) { return String(n).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }); }
  function stock(c, a) { return c.n + (c.ox ? '(' + ROM[c.q] + ')' : '') + ' ' + a.n; }
  function trad(c, a) { return (c.trad || c.n) + ' ' + a.n; }
  function sist(c, a, r) { if (a.poly && a.s !== 'OH') return null; var cn = (r.nc > 1 ? PRE[r.nc] : '') + c.n; if (a.s === 'OH') return cn + ' ' + (r.na > 1 ? PRE[r.na] : '') + 'hydroxide'; if (a.s === 'O') return cn + ' ' + (r.na > 1 ? PRE[r.na] + 'oxide' : (r.nc > 1 ? 'monoxide' : 'oxide')); return cn + ' ' + (r.na > 1 ? PRE[r.na] : '') + a.n; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Ions and charge balance", "Formulas", "An ionic compound is neutral: Σ(+ charges) = Σ(− charges)",
        "<p>An ionic compound is formed with <b>cations</b> (+) and <b>anions</b> (−) in the proportion that cancels the charge. It is found with the <b>crisscross method</b>: the charge of one ion becomes the subscript of the other (Al³⁺ and O²⁻ → Al₂O₃). Polyatomic ions take parentheses if their subscript is greater than 1: Ca(OH)₂, Al₂(SO₄)₃. Choose a cation and an anion and watch the assembly.</p>"],
      ["Stock nomenclature", 'Stock', "cation + anion; the oxidation state goes in Roman numerals if there are several",
        "<p>In <b>Stock</b> nomenclature the cation is named first, then the anion. If the metal has <b>more than one oxidation state</b> (Fe, Cu, Pb, Sn…), it is written in <b>Roman numerals in parentheses</b>: FeCl₃ = iron(III) chloride; FeCl₂ = iron(II) chloride. For metals with a single state (Na, Ca, Al) it is not written.</p>"],
      ["Systematic and traditional", "Other nomenclatures", "Prefixes mono-, di-, tri-… and suffixes -ous / -ic",
        "<p>The <b>systematic</b> one uses multiplicative prefixes: Fe₂O₃ = diiron trioxide; CaCl₂ = calcium dichloride. The <b>traditional</b> one uses suffixes for metals with two states: the lower ends in <b>-ous</b> and the higher in <b>-ic</b> (ferrous/ferric, cuprous/cupric). Today IUPAC recommends <b>Stock</b> and systematic; the traditional one is kept because of its use.</p>"],
      ["Halogen oxoanions", "Oxoanions", "hypo- … -ite < -ite < -ate < per- … -ate according to the number of oxygens",
        "<p>Halogens form <b>oxoanions</b> with different numbers of O: <b>hypochlorite (ClO⁻, +1), chlorite (ClO₂⁻, +3), chlorate (ClO₃⁻, +5) and perchlorate (ClO₄⁻, +7)</b>. The suffix <b>-ite</b> indicates fewer O and <b>-ate</b> more; <b>hypo-</b> and <b>per-</b> mark the extremes. The same pattern holds for nitrite/nitrate (+3/+5) and sulfite/sulfate (+4/+6). Move the control to go through the series.</p>"],
      ["Acids, oxoacids and hydroxides", "Acids", "-ide → hydro-…-ic acid ; -ate → -ic acid ; -ite → -ous acid",
        "<p>An <b>acid</b> is H⁺ + anion. If the anion ends in <b>-ide</b>, the acid is “<b>hydro...ic acid</b>” (HCl(aq): hydrochloric acid). If it ends in <b>-ate</b>, “<b>...ic acid</b>” (H₂SO₄: sulfuric acid); if it ends in <b>-ite</b>, “<b>...ous acid</b>” (H₂SO₃: sulfurous acid). A <b>hydroxide</b> is cation + OH⁻: Ca(OH)₂ calcium hydroxide.</p>"]
    ];
  }
  var def = {
    key: 'nomenclatura-inorganica', title: "Inorganic Nomenclature", subtitle: "3D Simulator · general chemistry", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 6, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'q', label: "Charges", icon: '±' }],
    build: function (ctx) { g = new T.Group(); ctx.scene.add(g); for (var i = 0; i < 6; i++) { var c = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ roughness: 0.35 })); g.add(c); cats.push(c); } for (i = 0; i < 6; i++) { var a = new T.Group(); g.add(a); ans.push(a); } for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { var ck = Object.keys(CA), ak = Object.keys(AN); if (i === 0) { var j = Math.min(5, Math.floor(f.local * 6)); S.c = ['na', 'mg', 'al', 'ca', 'k', 'al'][j]; S.a = ['cl', 'o', 'o', 'oh', 'so4', 'so4'][j]; } if (i === 1) { var j1 = Math.min(3, Math.floor(f.local * 4)); S.c = ['fe2', 'fe3', 'cu1', 'cu2'][j1]; S.a = 'cl'; } if (i === 2) { var j2 = Math.min(2, Math.floor(f.local * 3)); S.c = ['fe3', 'al', 'ca'][j2]; S.a = ['o', 'o', 'cl'][j2]; } if (i === 3) { S.h = Math.min(3, Math.floor(f.local * 4)); } if (i === 4) { var j4 = Math.min(2, Math.floor(f.local * 3)); S.c = ['ca', 'na', 'al'][j4]; S.a = ['oh', 'no3', 'so4'][j4]; } S.p = (f.local * 4) % 1; if (i === 3) S.p = 1; }
      lab.forEach(function (l) { l.vis(false); }); cats.forEach(function (c) { c.visible = false; }); ans.forEach(function (a) { a.visible = false; });
      S.h = Math.max(0, Math.min(3, S.h | 0)); var c = CA[S.c], a = AN[S.a], r = ratio(), q = sm(S.p), qOn = ctx.layer('q');
      if (i === 3 && !P.manual) { var h = HAL[S.h]; var cl = new T.Color(0x3ddc5a); ans[0].visible = true; if (ans[0].userData.k !== 'h' + S.h) { ans[0].userData.k = 'h' + S.h; while (ans[0].children.length) ans[0].remove(ans[0].children[0]); var ce = new T.Mesh(new T.SphereGeometry(1.1, 18, 12), new T.MeshStandardMaterial({ color: 0x3ddc5a })); ans[0].add(ce); for (var k = 0; k < S.h + 1; k++) { var o = new T.Mesh(new T.SphereGeometry(0.62, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); var ang = k * 2 * Math.PI / (S.h + 1) + 0.4, hh = S.h === 3 ? [1, 1, 1, 1][k] : 0; o.position.set(Math.cos(ang) * 1.9, Math.sin(ang) * 1.9, S.h === 3 ? ((k % 2) ? 1 : -1) * 0.8 : 0); ans[0].add(o); } } ans[0].position.set(0, 0, 0); ans[0].rotation.y = now * 0.5; ans[0].scale.setScalar(1.5); lab[0].pos(0, 5.5, 0).set(h[0] + ' · ' + h[1] + " (O.S. of Cl = " + h[2] + ')', 'bl-lead').vis(true); lab[1].pos(0, -5, 0).set(h[3] + ' → ' + h[4], 'bl-d').vis(true); lab[2].pos(0, -6.4, 0).set("more O → higher oxidation state → suffix -ite → -ate", 'bl-d').vis(true); return; }
      var rows = Math.max(r.nc, r.na), colX = function (j, n) { return (j - (n - 1) / 2) * 3.2; };
      for (var j3 = 0; j3 < r.nc; j3++) { var m = cats[j3]; m.visible = true; m.material.color.setHex(c.c); var rad = c.poly ? 1.2 : (c.q === 1 ? 1.2 : 1.0); m.scale.setScalar(rad); var tx = colX(j3, r.nc), ty = 3.2, sx = tx - 14 * (1 - q); m.position.set(sx, ty, 0); if (qOn) lab[j3].pos(tx + 0, ty + 1.6, 0).set(c.q + '+', 'bl-pos').vis(q > 0.9); }
      for (var j4 = 0; j4 < r.na; j4++) { var gp = ans[j4]; gp.visible = true; if (gp.userData.k !== S.a) { gp.userData.k = S.a; while (gp.children.length) gp.remove(gp.children[0]); var ctr = new T.Mesh(new T.SphereGeometry(a.poly ? 0.8 : 1.3, 18, 12), new T.MeshStandardMaterial({ color: a.c })); gp.add(ctr); if (a.poly) { var nO = a.no || 1; if (a.s === 'OH') { var ox = new T.Mesh(new T.SphereGeometry(0.55, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); ox.position.set(0, 0.9, 0); gp.children[0].material.color.setHex(0xff4d4d); gp.children[0].scale.setScalar(1.2); gp.remove(ox); var hh2 = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); hh2.position.set(0, 1.2, 0); gp.add(hh2); } else { var cnt = nO; if (a.s === 'NO₂') cnt = 2; for (var k2 = 0; k2 < cnt; k2++) { var o2 = new T.Mesh(new T.SphereGeometry(0.55, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); var an2 = k2 * 2 * Math.PI / cnt; o2.position.set(Math.cos(an2) * 1.35, Math.sin(an2) * 1.35, cnt === 4 ? (k2 % 2 ? 0.7 : -0.7) : 0); gp.add(o2); } } } }
        var tx2 = colX(j4, r.na), ty2 = -3.2, sx2 = tx2 + 14 * (1 - q); gp.position.set(sx2, ty2, 0); if (qOn) lab[3 + j4 % 3].pos(tx2, ty2 - 2.4, 0).set(a.q + '−', 'bl-neg').vis(q > 0.9); }
      var rr = ratio(), fm = fml(c, a, rr); var sis = sist(c, a, rr);
      lab[6].pos(0, 7, 0).set(fm, 'bl-lead').vis(true); lab[7].pos(0, -7.4, 0).set(stock(c, a), 'bl-pos').vis(q > 0.8);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.c) u.c.set(S.c); if (u.a) u.a.set(S.a); if (u.h !== undefined && u.h) u.h.set(S.h); },
    hud: function () { var c = CA[S.c], a = AN[S.a], r = ratio(); return { eq: { chip: fml(c, a, r), name: stock(c, a), body: '<div class="eqline"><small>Stock</small>' + stock(c, a) + "</div><div class=\"eqline\"><small>Systematic</small>" + (sist(c, a, r) || '—') + "</div><div class=\"eqline\"><small>Traditional</small>" + (c.trad ? trad(c, a) : stock(c, a)) + "</div><div class=\"eqline\"><small>Charge crisscross</small>" + c.q + '+ / ' + a.q + '− → ' + r.nc + ' : ' + r.na + '</div>' }, legend: [{ label: "Spheres above", color: '#ab5cf2', text: "cations (+)" }, { label: "Below", color: '#3ddc5a', text: "anions (−)" }] }; },
    measures: function () { var c = CA[S.c], a = AN[S.a], r = ratio(); return [["Formula", fml(c, a, r)], ["Cation", c.s + (c.q > 1 ? '^' + c.q + '+' : '⁺')], ["Anion", a.s + '^' + a.q + '−'], ["Cation : anion ratio", r.nc + ' : ' + r.na], ['Stock', stock(c, a)]]; },
    ideas: ["Crisscross: charge of one = subscript of the other (simplify).", "Fe, Cu, Pb: Roman numeral in Stock.", "-ite: fewer O · -ate: more O.", "-ide → hydro-…-ic acid · -ate → -ic · -ite → -ous."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Cation"); el.appendChild(c);
      ui.c = kit.ui.options({ label: "Cation", cols: 4, value: S.c, options: Object.keys(CA).map(function (k) { return { v: k, label: CA[k].s + (CA[k].q > 1 ? sup(CA[k].q) + '⁺' : '⁺') }; }), onChange: function (v) { ctx.goManual(); S.c = v; S.p = 0; } }); c.appendChild(ui.c);
      var d = kit.ui.card("Anion"); el.appendChild(d); ui.a = kit.ui.options({ label: "Anion", cols: 4, value: S.a, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].s }; }), onChange: function (v) { ctx.goManual(); S.a = v; S.p = 0; } }); d.appendChild(ui.a);
      ui.p = kit.ui.slider({ label: "Assembly", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); d.appendChild(kit.ui.sliders([ui.p]));
      ui.h = kit.ui.slider({ label: "Chlorine oxoanion (no. of O − 1)", min: 0, max: 3, step: 1, value: S.h, format: function (v) { return HAL[Math.max(0, Math.min(3, v | 0))][1]; }, onInput: function (v) { ctx.goManual(); S.h = Math.max(0, Math.min(3, v | 0)); } }); d.appendChild(kit.ui.sliders([ui.h]));
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      function sup(q) { return ['', '', '²', '³'][q] || ''; }
    },
    graphs: [{ title: "Oxidation state of Cl in its oxoanions", h: 200, note: "More oxygens → higher oxidation state and greater oxidizing power per oxygen… stability of the anion.", draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 14, B = 40, pw = w - L - Rr, ph = h - Tp - B, bw = pw / 4; cx.font = '10px system-ui'; cx.textAlign = 'center'; [1, 3, 5, 7].forEach(function (v, j) { cx.fillStyle = j === S.h ? '#ffa94d' : '#69db7c'; cx.fillRect(L + j * bw + 8, Tp + ph * (1 - v / 8), bw - 16, ph * v / 8); cx.fillStyle = col.ink; cx.fillText('+' + v, L + j * bw + bw / 2, Tp + ph * (1 - v / 8) - 3); cx.fillStyle = col.muted; cx.fillText(HAL[j][1], L + j * bw + bw / 2, h - B + 14); cx.fillText(HAL[j][0], L + j * bw + bw / 2, h - B + 28); });
    } }],
    calc: function () { var c = CA[S.c], a = AN[S.a], r = ratio(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }; return '<div class="card-kicker">' + stock(c, a) + '</div><table class="calc-table">' + row("Cation", c.s + ' ' + c.q + '+') + row("Anion", a.s + ' ' + a.q + '−') + row("LCM of the charges", String(c.q * a.q / gcd(c.q, a.q))) + row("Ratio", r.nc + " cation(s) × " + c.q + ' = ' + r.na + " anion(s) × " + a.q) + row("Formula", '<b>' + fml(c, a, r) + '</b>') + row("Systematic", sist(c, a, r) || "use Stock (polyatomic anion)") + row("Traditional", c.trad ? trad(c, a) : stock(c, a)) + '</table>'; },
    quiz: [
      { q: "The formula of aluminium oxide is…", options: ['Al₂O₃', 'AlO', 'Al₃O₂', 'Al₂O'], answer: 0, why: "Crisscross: Al³⁺ and O²⁻." },
      { q: "FeCl₃ is called…", options: ["iron(III) chloride", "iron(II) chloride", "iron chlorate", "ferrous chloride"], answer: 0, why: 'Fe³⁺.' },
      { q: "The ClO₃⁻ ion is…", options: ["chlorate", "chlorite", "hypochlorite", "perchlorate"], answer: 0, why: "3 O: -ate." },
      { q: "H₂SO₃ is the acid…", options: ["sulfurous", "sulfuric", "hydrosulfuric", "persulfuric"], answer: 0, why: "-ite → -ous." },
      { q: "Ca(OH)₂ is called…", options: ["calcium hydroxide", "calcium oxide", "calcium peroxide", "calcium hydride"], answer: 0, why: "Cation + OH⁻." },
      { q: "Fe₂O₃ in systematic nomenclature is…", options: ["diiron trioxide", "iron oxide", "trihiron dioxide", "iron monoxide"], answer: 0, why: "Multiplicative prefixes." }
    ],
    help: { intro: "Choose a cation and an anion; the ions assemble in the proportion that balances the charges and the three names are shown. The oxoanion control goes through hypochlorite → perchlorate.", items: [["Above", 'cationes.'], ["Below", "anions (polyatomic ones with red O)."]] }
  };
  MSim.create(def);
})();
