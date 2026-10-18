/* Nomenclatura y fórmulas de complejos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { '+': '⁺', '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴' };
  function sub(n) { return String(n).split('').map(function (c) { return SUB[+c]; }).join(''); }
  var MT = {
    Co: { n: "cobalt", a: "cobaltate", c: 0xe64980, ox: [2, 3] }, Fe: { n: "iron", a: "ferrate", c: 0xe8590c, ox: [2, 3] }, Cr: { n: "chromium", a: "chromate", c: 0x7048e8, ox: [2, 3] },
    Ni: { n: "nickel", a: "nickelate", c: 0x2f9e44, ox: [0, 2] }, Cu: { n: "copper", a: "cuprate", c: 0x1098ad, ox: [1, 2] }, Pt: { n: "platinum", a: "platinate", c: 0x868e96, ox: [2, 4] },
    Zn: { n: "zinc", a: "zincate", c: 0x7d80b0, ox: [2] }, Ag: { n: "silver", a: "argentate", c: 0xced4da, ox: [1] }, Mn: { n: "manganese", a: "manganate", c: 0xcc5de8, ox: [2, 3] }
  };
  var LG = {
    h2o: { n: "aqua", f: 'H₂O', q: 0, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: "water" }, nh3: { n: "ammine", f: 'NH₃', q: 0, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: "ammonia" },
    cl: { n: "chlorine", f: 'Cl', q: -1, d: 1, a: 'Cl', c: 0x3ddc5a, cx: 0, nm: "chloride" }, br: { n: "bromine", f: 'Br', q: -1, d: 1, a: 'Br', c: 0xa0522d, cx: 0, nm: "bromide" },
    f: { n: 'fluoro', f: 'F', q: -1, d: 1, a: 'F', c: 0x7ee08a, cx: 0, nm: "fluoride" }, cn: { n: "cyano", f: 'CN', q: -1, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: "cyanide" },
    oh: { n: "hydroxo", f: 'OH', q: -1, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: "hydroxide" }, co: { n: "carbonyl", f: 'CO', q: 0, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: "carbon monoxide" },
    no2: { n: 'nitro', f: 'NO₂', q: -1, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: 'nitrito (N)' }, scn: { n: "thiocyanate", f: 'SCN', q: -1, d: 1, a: 'S', c: 0xe6c229, cx: 0, nm: "thiocyanate (S)" },
    en: { n: "ethylenediamine", f: 'en', q: 0, d: 2, a: 'N,N', c: 0x4f7cff, cx: 1, nm: "ethane-1,2-diamine" }, ox: { n: "oxalate", f: 'ox', q: -2, d: 2, a: 'O,O', c: 0xff4d4d, cx: 1, nm: "oxalate" }
  };
  var PRE = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'], PRX = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis'], ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var PRESETS = [
    { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Fe', ox: 2, A: 'cn', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Cu', ox: 2, A: 'nh3', nA: 4, B: 'cl', nB: 0, g: 'sp' },
    { m: 'Pt', ox: 2, A: 'cl', nA: 2, B: 'nh3', nB: 2, g: 'sp' }, { m: 'Cr', ox: 3, A: 'en', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Ni', ox: 0, A: 'co', nA: 4, B: 'cl', nB: 0, g: 'tet' },
    { m: 'Ag', ox: 1, A: 'nh3', nA: 2, B: 'cl', nB: 0, g: 'lin' }, { m: 'Co', ox: 3, A: 'nh3', nA: 5, B: 'cl', nB: 1, g: 'oct' }, { m: 'Fe', ox: 3, A: 'ox', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Co', ox: 2, A: 'cl', nA: 4, B: 'cl', nB: 0, g: 'tet' }
  ];
  var S = { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct', _st: -1 }, lab = [], gr = null, ligLab = [];
  function cn() { return S.nA * LG[S.A].d + S.nB * LG[S.B].d; }
  function charge() { return S.ox + S.nA * LG[S.A].q + S.nB * LG[S.B].q; }
  function sup(q) { var a = Math.abs(q); return q === 0 ? '' : (a === 1 ? '' : SUP[a]) + (q > 0 ? '⁺' : '⁻'); }
  function parts() {
    var L = []; if (S.nA > 0) L.push({ id: S.A, n: S.nA }); if (S.nB > 0 && S.B !== S.A) L.push({ id: S.B, n: S.nB }); else if (S.nB > 0 && S.B === S.A) L[0].n += S.nB;
    return L;
  }
  function name() {
    var L = parts(), q = charge(), m = MT[S.m], base;
    L.sort(function (a, b) { return LG[a.id].n.localeCompare(LG[b.id].n, 'es'); });
    var ln = L.map(function (l) { var g = LG[l.id], pre = l.n > 1 ? (g.cx ? PRX[l.n] : PRE[l.n]) : ''; return pre + (g.cx ? '(' + g.n + ')' : g.n); }).join('');
    var met = (q < 0 ? m.a : m.n) + '(' + ROM[S.ox] + ')';
    var nm = (ln + met).replace('aa', 'aa');
    if (q > 0) { var an = q === 1 ? "chloride" : "chloride"; return nm + ' ' + an; }
    if (q < 0) return "potassium " + nm;
    return nm;
  }
  function formula() {
    var L = parts(), q = charge();
    L.sort(function (a, b) { var A = LG[a.id], B = LG[b.id]; if (A.q !== B.q) return A.q < B.q ? -1 : 1; return A.f.localeCompare(B.f); });
    var f = S.m + L.map(function (l) { var g = LG[l.id], poly = g.f.replace(/[^A-Z]/g, '').length > 1 || g.f.length > 2 || g.cx; return l.n > 1 ? (poly ? '(' + g.f + ')' : g.f) + sub(l.n) : (poly ? '(' + g.f + ')' : g.f); }).join('');
    var s = '[' + f + ']' + (q === 0 ? '' : '');
    if (q > 0) s += 'Cl' + (q > 1 ? sub(q) : ''); else if (q < 0) s = 'K' + (q < -1 ? sub(-q) : '') + s;
    return s;
  }
  function valid() { var c = cn(); return c === 2 || c === 4 || c === 6; }
  function verts(g, R) {
    if (g === 'lin') return [[R, 0, 0], [-R, 0, 0]];
    if (g === 'tet') { var k = R / Math.sqrt(3); return [[k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]]; }
    if (g === 'sp') return [[R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R]];
    return [[R, 0, 0], [-R, 0, 0], [0, R, 0], [0, -R, 0], [0, 0, R], [0, 0, -R]];
  }
  var PAIRS = { oct: [[0, 2], [1, 4], [3, 5]], tet: [[0, 1], [2, 3]], sp: [[0, 1], [2, 3]] };
  function geomFor() { var c = cn(); return c === 2 ? 'lin' : (c === 6 ? 'oct' : (S.g === 'sp' ? 'sp' : 'tet')); }
  function gname(g) { return { lin: "linear", tet: "tetrahedral", sp: "square planar", oct: "octahedral" }[g]; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Central atom and ligands", "Structure", "A complex = central metal + ligands bound by coordinate bonds",
        "<p>A <b>complex</b> (coordination compound) has a <b>central metal atom or ion</b> surrounded by <b>ligands</b>, which donate an electron pair to the metal (coordinate covalent bond). The <b>coordination number</b> is the number of donor atoms bound to the metal: <b>2 (linear), 4 (tetrahedral or square planar), 6 (octahedral)</b>. The square brackets enclose the coordination sphere: <b>[Co(NH₃)₆]³⁺</b>.</p>"],
      ["Types of ligands", "Ligands", "Monodentate (1 donor atom) and polydentate or chelates (2 or more)",
        "<p>A <b>monodentate</b> ligand binds through a single atom (H₂O, NH₃, Cl⁻, CN⁻). A <b>bidentate</b> binds through two (ethylenediamine <b>en</b>: NH₂CH₂CH₂NH₂; oxalate <b>ox</b>: C₂O₄²⁻) and forms a <b>chelate</b> (ring), which is more stable. They count toward the coordination number according to their <b>denticity</b>: [Cr(en)₃]³⁺ has 3 × 2 = 6 donors. Ligands can be neutral or anionic, and this affects the total charge.</p>"],
      ["Charge and oxidation number", "Charge", "Charge of the complex = oxidation no. of the metal + sum of the ligand charges",
        "<p>The <b>charge of the complex</b> is the sum of the <b>oxidation number of the metal</b> and the charges of the ligands. Examples: [Co(NH₃)₆]: Co³⁺ + 6·0 = <b>3+</b>; [Fe(CN)₆]: Fe²⁺ + 6·(−1) = <b>4−</b>; [PtCl₂(NH₃)₂]: Pt²⁺ + 2·(−1) + 2·0 = <b>0</b>. If the complex is a cation it is paired with anions (Cl⁻); if it is an anion, with cations (K⁺) to neutralize the charge of the salt.</p>"],
      ["How to name a complex", "Naming", "Ligands in alphabetical order + metal with oxidation no. in Roman numerals",
        "<p>Rules: (1) first the <b>ligands</b>, in <b>alphabetical order</b> (the numerical prefix is ignored); (2) <b>prefixes di-, tri-, tetra-, penta-, hexa-</b> for simple ligands and <b>bis-, tris-, tetrakis-</b> (with parentheses) for complex ligands or chelates; (3) then the <b>metal</b> with its <b>oxidation number</b> in Roman numerals in parentheses. Ligands: H₂O = <i>aqua</i>, NH₃ = <i>ammine</i>, Cl⁻ = <i>chloro</i>, CN⁻ = <i>cyano</i>, OH⁻ = <i>hydroxo</i>, CO = <i>carbonyl</i>.</p>"],
      ["Anionic complexes and salts", "Anions and salts", "If the complex is an anion, the metal ends in -ate",
        "<p>An <b>anionic</b> complex is named with the ending <b>-ate</b> on the metal (<b>ferrate, cobaltate, cuprate, nickelate, platinate, argentate…</b>), and the cation is cited first: <b>potassium hexacyanoferrate(II)</b>, K₄[Fe(CN)₆]. A <b>cationic</b> complex keeps the name of the metal and the anion is cited last: <b>hexaamminecobalt(III) chloride</b>. Neutral complexes are named as they are: tetracarbonylnickel(0).</p>"],
      ["Formula and practice", "Formula", "Formula: metal first, then anionic and neutral ligands in alphabetical order",
        "<p>In the formula, the <b>metal</b> symbol goes first; then the ligands (anionic and then neutral, each group in alphabetical order), with parentheses if the ligand is polyatomic. All inside square brackets with the charge at the top right. In “Lab” create your own complexes: if the sum of donors is not 2, 4 or 6 the simulator warns you; you can also load the classic examples.</p>"]
    ];
  }
  var SEGP = [[0, 7, 3], [0, 4, 8], [0, 1, 3], [0, 3, 4, 8], [1, 3, 9, 4], [2, 3, 5, 6]];
  var def = {
    key: 'nomenclatura-complejos', title: "Nomenclature of Complexes", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [6, 5, 12], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 13], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 13, 1], target: [0, 0, 0] }],
    layers: [{ id: 'lab', label: "Ligand labels", icon: 'L' }, { id: 'bond', label: "Bonds", icon: '─' }],
    build: function (ctx) { for (var i = 0; i < 6; i++) ligLab.push(ctx.label('', 'bl-d')); ['t', 'a', 'b'].forEach(function (k) { lab.push(ctx.label('', 'bl-d')); }); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var sq = SEGP[f.i], n = sq.length, ix = sq[Math.min(n - 1, Math.floor(f.local * n))], p = PRESETS[ix]; if (S._pi !== ix) { S._pi = ix; Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }
      var key = [S.m, S.A, S.nA, S.B, S.nB, S.g, valid()].join('|'); if (key !== S._k) { S._k = key; rebuild(ctx); }
      if (gr) gr.rotation.y = now * 0.3;
      var q = charge(), nmv = valid() ? name() : "(invalid coordination number: " + cn() + ')', fv = valid() ? formula() : '—';
      lab[0].pos(0, 5.6, 0).set(nmv, valid() ? 'bl-lead' : 'bl-warn').vis(true); lab[1].pos(0, -5.2, 0).set(fv, 'bl-pos').vis(true);
      lab[2].pos(0, -6.2, 0).set("CN = " + cn() + ' · ' + (valid() ? gname(geomFor()) : '—') + " · charge " + (q > 0 ? '+' : '') + q + " · oxidation no. " + ROM[S.ox], 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['m', 'A', 'B', 'g'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); ['nA', 'nB', 'ox'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: "CN", name: valid() ? formula().replace(/^K\S*?\[/, '[').replace(/\].*$/, ']') + sup(charge()) : "Invalid complex", body: '<div class="eqline"><small>Metal</small>' + MT[S.m].n + "</div><div class=\"eqline\"><small>Coordination number</small>" + cn() + "</div><div class=\"eqline\"><small>Geometry</small>" + (valid() ? gname(geomFor()) : '—') + "</div><div class=\"eqline\"><small>Charge</small>" + charge() + '</div>' }, legend: [{ label: "Central sphere", color: '#' + ('000000' + MT[S.m].c.toString(16)).slice(-6), text: "metal ion" }, { label: "Spheres", color: '#4f7cff', text: "donor atoms" }] }; },
    measures: function () { return [["Name", valid() ? name() : '—'], ["Formula", valid() ? formula() : '—'], ['Metal', MT[S.m].n + ' (' + ROM[S.ox] + ')'], ["Ligand A", LG[S.A].nm + ' × ' + S.nA], ["Ligand B", S.nB ? LG[S.B].nm + ' × ' + S.nB : '—'], ["Coordination number", String(cn())], ["Charge of the complex", String(charge())]]; },
    ideas: ["Charge = oxidation no. + Σ ligand charges.", "Ligands in alphabetical order; di-/tri- (simple), bis-/tris- (complex).", "Anionic complex: metal in -ate (ferrate, cuprate…).", "Coordination number = donor atoms (denticity × no. of ligands)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Build complex"); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Metal', cols: 5, value: S.m, options: Object.keys(MT).map(function (k) { return { v: k, label: k }; }), onChange: function (v) { ctx.goManual(); S.m = v; if (MT[v].ox.indexOf(S.ox) < 0) S.ox = MT[v].ox[0]; } }); c.appendChild(ui.m);
      ui.ox = kit.ui.slider({ label: "Oxidation number", min: 0, max: 4, step: 1, value: S.ox, format: function (v) { return ROM[v]; }, onInput: function (v) { ctx.goManual(); S.ox = v; } });
      ui.A = kit.ui.options({ label: "Ligand A", cols: 4, value: S.A, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : "neutral" }; }), onChange: function (v) { ctx.goManual(); S.A = v; } }); c.appendChild(ui.A);
      ui.nA = kit.ui.slider({ label: "Amount of A", min: 0, max: 6, step: 1, value: S.nA, format: function (v) { return v + ' × ' + LG[S.A].f; }, onInput: function (v) { ctx.goManual(); S.nA = v; } });
      ui.B = kit.ui.options({ label: "Ligand B", cols: 4, value: S.B, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : "neutral" }; }), onChange: function (v) { ctx.goManual(); S.B = v; } }); c.appendChild(ui.B);
      ui.nB = kit.ui.slider({ label: "Amount of B", min: 0, max: 6, step: 1, value: S.nB, format: function (v) { return v + ' × ' + LG[S.B].f; }, onInput: function (v) { ctx.goManual(); S.nB = v; } });
      c.appendChild(kit.ui.sliders([ui.ox, ui.nA, ui.nB]));
      ui.g = kit.ui.options({ label: "Geometry (CN = 4)", cols: 2, value: S.g, options: [{ v: 'tet', label: "Tetrahedral" }, { v: 'sp', label: "Square planar" }], onChange: function (v) { ctx.goManual(); S.g = v; } }); c.appendChild(ui.g);
      var ex = kit.ui.card("Classic examples"); el.appendChild(ex);
      ex.appendChild(ctx.btnRow(PRESETS.map(function (p, i) { return { t: (function () { var o = {}; Object.keys(S).forEach(function (k) { o[k] = S[k]; }); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); var f = formula(); Object.keys(o).forEach(function (k) { S[k] = o[k]; }); return f.replace(/K\S*\[/, '['); })(), fn: function () { ctx.goManual(); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }; })));
      el.appendChild(document.createElement('div')); ex.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Common ligands", h: 270, note: "Name in the complex, charge and denticity. The ones in use are highlighted.", draw: function (cx, w, h, col) {
        var ks = Object.keys(LG), rh = (h - 22) / ks.length; cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText("ligand", 10, 13); cx.fillText("in complex", 76, 13); cx.textAlign = 'right'; cx.fillText("charge", w - 62, 13); cx.fillText("donors", w - 8, 13);
        ks.forEach(function (k, i) { var g = LG[k], y = 20 + i * rh, on = (k === S.A && S.nA > 0) || (k === S.B && S.nB > 0); if (on) { cx.fillStyle = 'rgba(34,211,238,.22)'; cx.fillRect(4, y, w - 8, rh); } cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(g.f, 10, y + rh / 2 + 3); cx.fillText(g.n, 76, y + rh / 2 + 3); cx.textAlign = 'right'; cx.fillText(g.q, w - 62, y + rh / 2 + 3); cx.fillText(g.d === 1 ? 'mono (' + g.a + ')' : 'bi (' + g.a + ')', w - 8, y + rh / 2 + 3); });
      } },
      { title: "Geometry according to the coordination number", h: 150, note: "CN 2 linear · CN 4 tetrahedral or square planar · CN 6 octahedral.", draw: function (cx, w, h, col) {
        var arr = [[2, "linear", "example: [Ag(NH₃)₂]⁺"], [4, "tetrahedral / planar", "e.g.: [CoCl₄]²⁻, [PtCl₄]²⁻"], [6, "octahedral", "e.g.: [Co(NH₃)₆]³⁺"]], rh = h / 3; cx.font = '11px system-ui'; arr.forEach(function (a, i) { var on = a[0] === cn(); cx.fillStyle = on ? 'rgba(34,211,238,.28)' : 'rgba(134,142,150,.15)'; cx.fillRect(6, i * rh + 3, w - 12, rh - 6); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText("CN " + a[0] + ' · ' + a[1], 14, i * rh + rh / 2 - 2); cx.fillStyle = col.muted; cx.fillText(a[2], 14, i * rh + rh / 2 + 13); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, L = parts(), q = charge();
      var lq = L.map(function (l) { return l.n + ' × (' + LG[l.id].q + ')'; }).join(' + ') || '0';
      return '<div class="card-kicker">' + (valid() ? formula() : "Complex") + "</div><div class=\"calc-step\">1 · Coordination number</div><table class=\"calc-table\">" + L.map(function (l) { return row(LG[l.id].f, l.n + ' × ' + LG[l.id].d + " donor(s) = " + l.n * LG[l.id].d); }).join('') + row("CN", '<b>' + cn() + '</b> → ' + (valid() ? gname(geomFor()) : "not valid")) + "</table><div class=\"calc-step\">2 · Charge</div><table class=\"calc-table\">" + row('Metal', '+' + S.ox) + row("Ligands", lq) + row("Total charge", '<b>' + (q > 0 ? '+' : '') + q + '</b>') + row("Counterion", q > 0 ? q + ' Cl⁻' : (q < 0 ? (-q) + ' K⁺' : "none")) + "</table><div class=\"calc-step\">3 · Name</div><p><b>" + (valid() ? name() : '—') + '</b></p>';
    },
    quiz: [
      { q: "The name of [Co(NH₃)₆]Cl₃ is…", options: ["hexaamminecobalt(III) chloride", "hexaammine chloride of cobalt", "trichloride of hexaamminecobalt(III)", "cobaltate(III) of hexaammine"], answer: 0, why: "The anion (chloride) is named last, after the cationic complex." },
      { q: "K₄[Fe(CN)₆] is…", options: ["potassium hexacyanoferrate(II)", "potassium hexacyanoiron(II)", "potassium hexacyanoferrate(III)", "potassium ferrous cyanide"], answer: 0, why: "Anionic complex: -ate; Fe²⁺ because 4− = x + 6(−1)." },
      { q: "In [Cr(en)₃]³⁺ the coordination number is…", options: ['6', '3', '4', '9'], answer: 0, why: "3 bidentate ligands = 6 donors." },
      { q: "The prefix for three ethylenediamine ligands is…", options: ["tris(ethylenediamine)", 'tri-etilendiamina', "triethylenediamine", "trisethylenediamine"], answer: 0, why: "Complex ligands use bis-, tris- with parentheses." },
      { q: "Ligands are cited in order…", options: ["alphabetical", "of charge", "of size", "random"], answer: 0, why: "Ignoring the numerical prefixes." },
      { q: "The CN⁻ ligand is named…", options: ["cyano", "cyanide", "carbon", "nitrile"], answer: 0, why: "As a ligand: cyano." },
      { q: "The charge of [PtCl₂(NH₃)₂] is…", options: ['0', '2+', '2−', '1+'], answer: 0, why: 'Pt²⁺ + 2(−1) = 0.' },
      { q: "The [Ni(CO)₄] complex is named…", options: ["tetracarbonylnickel(0)", "carbonyl nickelate(0)", "tetracarbonylnickel(IV)", "nickel tetracarbonate"], answer: 0, why: "Neutral complex: no -ate ending." }
    ],
    help: { intro: "Choose metal, oxidation state and ligands A and B; the simulator checks the coordination number, calculates the charge, writes the formula and builds the name.", items: [["Examples", "buttons with classic complexes."], ["CN", '2, 4 o 6.']] }
  };
  function rebuild(ctx) {
    if (gr) ctx.scene.remove(gr); gr = new T.Group(); ctx.scene.add(gr); ligLab.forEach(function (l) { l.vis(false); });
    if (!valid()) return;
    var g = geomFor(), V = verts(g, 3.2), m = MT[S.m];
    var mc = new T.Mesh(new T.SphereGeometry(0.9, 28, 20), new T.MeshStandardMaterial({ color: m.c, roughness: 0.3, metalness: 0.3 })); gr.add(mc);
    var slots = V.map(function () { return null; }), pairs = (PAIRS[g] || []).slice(), pi = 0;
    var seq = []; if (S.nA > 0) { for (var i = 0; i < S.nA; i++) seq.push(S.A); } if (S.nB > 0) { for (i = 0; i < S.nB; i++) seq.push(S.B); }
    var bi = seq.filter(function (id) { return LG[id].d === 2; }), mo = seq.filter(function (id) { return LG[id].d === 1; });
    var used = {}; bi.forEach(function (id) { var p = pairs[pi++]; if (!p) return; slots[p[0]] = { id: id, mate: p[1] }; slots[p[1]] = { id: id, mate: p[0] }; used[p[0]] = used[p[1]] = true; });
    var free = []; slots.forEach(function (s, i) { if (!s) free.push(i); }); mo.forEach(function (id, k) { if (free[k] != null) slots[free[k]] = { id: id, mate: -1 }; });
    var lblI = 0;
    slots.forEach(function (s, i) {
      if (!s) return; var lg = LG[s.id], v = new T.Vector3(V[i][0], V[i][1], V[i][2]);
      var at = new T.Mesh(new T.SphereGeometry(lg.d === 2 ? 0.52 : 0.6, 20, 14), new T.MeshStandardMaterial({ color: lg.c, roughness: 0.4 })); at.position.copy(v); gr.add(at);
      var bd = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); bd.position.copy(v).multiplyScalar(0.5); bd.scale.y = v.length(); bd.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); gr.add(bd);
      if (lg.d === 1 && (s.id === 'h2o' || s.id === 'nh3')) { var nH = s.id === 'h2o' ? 2 : 3, out = v.clone().normalize(); for (var h = 0; h < nH; h++) { var a = h * 6.283 / nH, perp = new T.Vector3(-out.y, out.x, 0); if (perp.lengthSq() < 0.01) perp.set(0, -out.z, out.y); perp.normalize(); var perp2 = out.clone().cross(perp); var hp = v.clone().addScaledVector(out, 0.55).addScaledVector(perp, Math.cos(a) * 0.65).addScaledVector(perp2, Math.sin(a) * 0.65); var hh = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshStandardMaterial({ color: 0xf2f2f2 })); hh.position.copy(hp); gr.add(hh); } }
      if (lg.d === 2 && s.mate > i) { var w = new T.Vector3(V[s.mate][0], V[s.mate][1], V[s.mate][2]), mid = v.clone().add(w).multiplyScalar(0.5), out2 = mid.clone().normalize(), bb = mid.clone().addScaledVector(out2, 1.1); var bk = new T.Mesh(new T.SphereGeometry(0.34, 12, 9), new T.MeshStandardMaterial({ color: 0x56606b })); bk.position.copy(bb); gr.add(bk);[v, w].forEach(function (e) { var d = bb.clone().sub(e), c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshStandardMaterial({ color: 0xadb5bd })); c.position.copy(e).add(bb).multiplyScalar(0.5); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); gr.add(c); }); }
    });
  }
  MSim.create(def);
})();
