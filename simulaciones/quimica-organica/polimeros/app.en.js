/* Polímeros: adición y condensación — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var P = {
    pe: { n: "Polyethylene (PE)", k: 'a', m: 'CH₂=CH₂', M: 28.05, side: null, c: 0x868e96, u: '–CH₂–CH₂–', use: "bags, packaging", tg: '−120' },
    pp: { n: "Polypropylene (PP)", k: 'a', m: 'CH₂=CH–CH₃', M: 42.08, side: 'me', c: 0x4dabf7, u: '–CH₂–CH(CH₃)–', use: "caps, fibers, syringes", tg: '−10' },
    ps: { n: "Polystyrene (PS)", k: 'a', m: 'CH₂=CH–C₆H₅', M: 104.15, side: 'ph', c: 0xffa94d, u: '–CH₂–CH(C₆H₅)–', use: "packaging, insulation (foam)", tg: '100' },
    pvc: { n: "PVC", k: 'a', m: 'CH₂=CHCl', M: 62.5, side: 'cl', c: 0x51cf66, u: '–CH₂–CHCl–', use: "pipes, cables", tg: '80' },
    n66: { n: "Nylon 6,6", k: 'c', m: "adipic acid + hexamethylenediamine", M: 226.32, side: null, c: 0xcc5de8, u: '–[NH(CH₂)₆NHCO(CH₂)₄CO]–', use: "fibers, gears", tg: '50' },
    pet: { n: 'PET', k: 'c', m: "terephthalic acid + ethylene glycol", M: 192.17, side: null, c: 0x22b8cf, u: '–[OCH₂CH₂OCOC₆H₄CO]–', use: "bottles, polyester fibers", tg: '70' }
  };
  var W = 18.015, S = { p: 'pe', n: 20, ext: 0.98, ph: 0 }, g = null, bb = [], sg = [], ws = [], lab = [], curN = 0;
  function pol() { return P[S.p]; }
  function Xn() { return 1 / (1 - S.ext); }
  function Mn() { var q = pol(); return q.k === 'a' ? S.n * q.M : (Xn() / 2) * q.M; }
  function disp() { return pol().k === 'a' ? 1.5 : 1 + S.ext; }
  function stages() {
    return [
      ["Monomers and polymers", "Monomer", "A polymer is a chain of many monomers joined covalently",
        "<p>A <b>polymer</b> is a macromolecule formed by repetition of a <b>unit</b> derived from a <b>monomer</b>. There are two main mechanisms: <b>addition</b> (monomers with a double bond, no loss of atoms) and <b>condensation</b> (a small molecule such as H₂O is released). Change the polymer in “Lab”.</p>"],
      ["Addition polymerization", "Addition", "Initiation → propagation → termination (radicals)",
        "<p>In <b>radical addition</b>, an initiator generates a radical that attacks the monomer's C=C (<b>initiation</b>); the new radical keeps adding monomers (<b>propagation</b>) until two radicals combine or disproportionate (<b>termination</b>). The chain grows one unit at a time; the product has the same empirical formula as the monomer.</p>"],
      ["Condensation polymerization", "Condensation", "H₂O is released at each bond; the molar mass rises at the end",
        "<p>In <b>condensation</b>, different functional groups react (acid + amine → amide; acid + alcohol → ester) and <b>H₂O</b> is released at each link. Any species can react with any other, so the size is large only when the <b>conversion p</b> approaches 1: <b>X<sub>n</sub> = 1/(1 − p)</b> (Carothers equation).</p>"],
      ["Molar mass and dispersity", "Molar mass", "Mn = n · M₀ · Đ = Mw/Mn ≥ 1",
        "<p>A polymer does not have a single molar mass: it is a <b>distribution</b>. The <b>number average Mn</b> counts every chain equally; the <b>mass average Mw</b> gives more weight to long chains. The <b>dispersity</b> Đ = Mw/Mn equals 1 only if all chains are identical; in condensation, Đ = 1 + p ≈ 2.</p>"],
      ["Structure and properties", "Properties", "Large substituents increase rigidity (Tg)",
        "<p><b>Structure</b> determines properties: bulky substituents (phenyl in PS) or polar ones (Cl in PVC, amides in nylon) <b>restrict motion</b> and raise the glass transition temperature (Tg). Nylon forms <b>hydrogen bonds</b> between chains, giving strong fibers. Compare the six polymers.</p>"]
    ];
  }
  var def = {
    key: 'polimeros', title: "Polymers: addition and condensation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 6, 22], target: [6, 0, 0] }, { id: 'frontal', label: "Front", pos: [6, 0, 26], target: [6, 0, 0] }],
    layers: [{ id: 'side', label: "Substituents", icon: '◉' }, { id: 'w', label: "Released H₂O", icon: '💧' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, sp = new T.SphereGeometry(0.34, 12, 9);
      for (i = 0; i < 82; i++) { var b = new T.Mesh(sp, new T.MeshStandardMaterial({ color: 0x56606b, roughness: 0.4 })); g.add(b); bb.push(b); }
      for (i = 0; i < 41; i++) { var s = new T.Mesh(new T.SphereGeometry(0.5, 12, 9), new T.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.4 })); g.add(s); sg.push(s); }
      for (i = 0; i < 20; i++) { var w = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xff4d4d })); g.add(w); ws.push(w); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var Pm = ctx.P, i = f.i, q = pol();
      if (!Pm.manual) { if (i === 0) { S.p = ['pe', 'pp', 'ps', 'pvc'][Math.min(3, Math.floor(f.local * 4))]; S.n = 12; } if (i === 1) { S.p = 'ps'; S.n = Math.max(1, Math.round(1 + 39 * f.local)); } if (i === 2) { S.p = f.local < 0.5 ? 'n66' : 'pet'; S.ext = 0.5 + 0.495 * ((f.local * 2) % 1); } if (i === 3) { S.p = 'pe'; S.n = 20 + Math.round(20 * f.local); } if (i === 4) { S.p = ['pe', 'pp', 'ps', 'pvc', 'n66', 'pet'][Math.min(5, Math.floor(f.local * 6))]; S.n = 24; } }
      q = pol(); var n = q.k === 'a' ? Math.min(40, S.n) : Math.max(2, Math.min(40, Math.round(Xn() / 2 * 1)));
      if (q.k === 'c') n = Math.min(40, Math.max(2, Math.round(2 + (S.ext - 0.5) / 0.5 * 38)));
      curN = n; var nb = n * 2, sOn = ctx.layer('side'), wOn = ctx.layer('w'), L = n * 0.55;
      bb.forEach(function (b, j) { b.visible = j < nb; var t = j / 2, x = 0 + j * 0.62 - 1; b.position.set(x, (j % 2 ? 0.42 : -0.42), Math.sin(j * 0.18) * 0.7); b.material.color.setHex(q.k === 'c' ? ((j % 4 < 2) ? q.c : 0xffe066) : 0x56606b); });
      sg.forEach(function (s, j) { var show = j < n && sOn && (q.side || q.k === 'c'); s.visible = !!show; var x = 0 + (2 * j + 1) * 0.62 - 1; s.position.set(x, 1.5, Math.sin((2 * j + 1) * 0.18) * 0.7 + (q.side === 'ph' ? 0.3 : 0)); var sc = q.side === 'ph' ? 1.8 : (q.side === 'cl' ? 1.3 : (q.side === 'me' ? 0.9 : 1.1)); if (q.k === 'c') { sc = 0.9; s.position.y = -1.4; s.position.x = (2 * j) * 0.62 - 1; } s.scale.setScalar(sc); s.material.color.setHex(q.side === 'cl' ? 0x3ddc5a : (q.side === 'ph' ? 0xffa94d : (q.k === 'c' ? 0x4f7cff : 0x9aa5b1))); });
      var nw = q.k === 'c' ? Math.min(20, n) : 0; ws.forEach(function (w, j) { w.visible = wOn && j < nw; var u = ((ctx.now * 0.25 + j * 0.37) % 1); w.position.set(1 + j * 1.1, -2.2 - u * 3, 0.6); w.scale.setScalar(1 - u * 0.6); });
      var sc0 = Math.min(1.8, 20 / (nb * 0.62 + 2)); g.scale.setScalar(sc0); g.position.set(13 - (nb * 0.62 / 2) * sc0, 0, 0);
      lab[0].pos(13, 6, 0).set(q.n + ' · n = ' + n, 'bl-lead').vis(true);
      lab[1].pos(13, -6.2, 0).set(q.k === 'a' ? "Addition: " + q.m : "Condensation: " + q.m, 'bl-d').vis(true);
      lab[2].pos(13, -7.6, 0).set('unidad: ' + q.u, 'bl-d').vis(true);
      lab[3].pos(13, 4.2, 0).set("Mn ≈ " + fmt(Mn(), 0) + " g/mol", 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.p) u.p.set(S.p); if (u.n) u.n.set(S.n); if (u.ext) u.ext.set(S.ext); },
    hud: function () { var q = pol(); return { eq: { chip: 'n', name: "Chain", body: "<div class=\"eqline\"><small>Type</small>" + (q.k === 'a' ? "addition" : "condensation") + "</div><div class=\"eqline\"><small>Unit M₀</small>" + fmt(q.M, 2) + " g/mol</div><div class=\"eqline\"><small>Mn</small>" + fmt(Mn(), 0) + " g/mol</div><div class=\"eqline\"><small>Đ</small>" + fmt(disp(), 2) + '</div>' }, legend: [{ label: "Spheres", color: '#56606b', text: "backbone atoms" }, { label: "Side color", color: '#4dabf7', text: "substituent or functional group" }] }; },
    measures: function () { var q = pol(); return [["Polymer", q.n], ["Mechanism", q.k === 'a' ? "addition" : "condensation"], ["M₀ (unit)", fmt(q.M, 2) + " g/mol"], ['Xn', q.k === 'a' ? String(S.n) : fmt(Xn(), 1)], ['Mn', fmt(Mn(), 0) + " g/mol"], ["Đ (Mw/Mn)", fmt(disp(), 2)], ["Approx. Tg", q.tg + ' °C'], ['Usos', q.use]]; },
    ideas: ["Addition: no loss of atoms.", "Condensation: releases H₂O.", "Xn = 1/(1 − p).", 'Đ ≥ 1.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Polymer"); el.appendChild(c);
      ui.p = kit.ui.options({ label: "Polymer", cols: 2, value: S.p, options: Object.keys(P).map(function (k) { return { v: k, label: P[k].n, sub: P[k].k === 'a' ? "addition" : "condensation" }; }), onChange: function (v) { ctx.goManual(); S.p = v; } });
      ui.n = kit.ui.slider({ label: "Degree of polymerization (addition)", min: 1, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.ext = kit.ui.slider({ label: "Conversion p (condensation)", min: 0.5, max: 0.995, step: 0.005, value: S.ext, format: function (v) { return fmt(v, 3); }, onInput: function (v) { ctx.goManual(); S.ext = v; } });
      c.appendChild(ui.p); c.appendChild(kit.ui.sliders([ui.n, ui.ext])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Carothers equation", h: 200, note: "Xn = 1/(1 − p). A high degree requires conversion very close to 1.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var p = 0.5 + 0.495 * i / 100, x = L + pw * i / 100, y = Tp + ph * (1 - Math.min(1, (1 / (1 - p)) / 200)); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ext - 0.5) / 0.495, Tp + ph * (1 - Math.min(1, Xn() / 200)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('p = 0,5', L, h - 8); cx.fillText('p = 0,995', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText("Xn 200", L - 4, Tp + 8);
    } }, { title: "Size distribution (condensation)", h: 190, note: "Flory most probable distribution: number fraction of chains with x units.", draw: function (cx, w, h, col) {
      var L = 20, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, p = S.ext, i, mx = 1 - p; cx.fillStyle = '#4dabf7';
      for (i = 1; i <= 40; i++) { var v = (1 - p) * Math.pow(p, i - 1); cx.fillRect(L + pw * (i - 1) / 40 + 1, Tp + ph * (1 - v / mx), pw / 40 - 2, ph * v / mx); }
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('x = 1', L, h - 8); cx.fillText('x = 40', L + pw, h - 8);
    } }],
    calc: function () {
      var q = pol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (q.k === 'a') return '<div class="card-kicker">' + q.n + " · addition</div><table class=\"calc-table\">" + row('Mn', 'n · M₀ = ' + S.n + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + " g/mol</b>") + row("Monomer", q.m + ' (M = ' + fmt(q.M, 2) + ')') + row('Subproducto', "none: the unit keeps the monomer's formula") + row("Typical Đ", '≈ ' + fmt(disp(), 2)) + '</table>';
      return '<div class="card-kicker">' + q.n + " · condensation</div><table class=\"calc-table\">" + row("Xn (Carothers)", '1/(1 − ' + fmt(S.ext, 3) + ') = <b>' + fmt(Xn(), 1) + '</b>') + row('Mn', "(Xn/2) · M₀ = " + fmt(Xn() / 2, 1) + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + " g/mol</b>") + row("Released H₂O", "1 mol H₂O per bond (18.015 g/mol)") + row('Đ', '1 + p = <b>' + fmt(disp(), 2) + '</b>') + '</table>';
    },
    quiz: [
      { q: "The addition polymerization of ethene produces…", options: ["polyethylene without releasing by-products", "nylon", "PET and water", "polystyrene"], answer: 0, why: "The C=C opens." },
      { q: "In a polycondensation, what is released is…", options: ["a small molecule (H₂O)", "a radical", "no product", "always H₂"], answer: 0, why: "Each amide/ester bond releases H₂O." },
      { q: "According to Carothers, with p = 0.99 the degree of polymerization is…", options: ['100', '99', '10', '1000'], answer: 0, why: '1/(1 − 0,99).' },
      { q: "A polymer with Đ = 1.0 has…", options: ["all chains of the same size", "very diverse chains", "only monomers", "higher Mw than Mn"], answer: 0, why: "Mw = Mn." },
      { q: "Which polymer has a phenyl substituent?", options: ["polystyrene", "PVC", "polypropylene", "polyethylene"], answer: 0, why: "Styrene = vinylbenzene." },
      { q: "Nylon 6,6 is formed by the reaction of…", options: ["a diacid and a diamine", "ethylene and propylene", "a diol and a vinyl diester", "vinyl chloride"], answer: 0, why: "Amide bonds are formed." }
    ],
    help: { intro: "Choose a polymer and its size. The dark spheres are the backbone; the colored ones, substituents or functional groups. In condensation, the released water molecules fall.", items: [["Red spheres", "H₂O released."], ["Side spheres", "substituent or functional group."]] }
  };
  MSim.create(def);
})();
