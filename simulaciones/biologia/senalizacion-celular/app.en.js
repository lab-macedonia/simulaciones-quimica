/* Señalización celular: receptor → segundo mensajero — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, KD = 10, KB = 10, XR = [10, 13, 16, 19, 22];
  var S = { L: 2, eff: 1, B: 0, pde: 0, tox: 0, rtk: 0, c: 0 }, g = null, rec = [], lig = [], gp = [], acm = null, cm = [], pk = [], sub = [], pl = [], lab = [], Hc = [];
  function theta() { return (Math.pow(10, S.L)) / (Math.pow(10, S.L) + KD * (1 + S.B / KB)); }
  function act() { return Math.min(1, theta() * S.eff + S.tox * 0.6); }
  function prod() { return 8 * act(); }
  function kdeg() { return 0.8 * (1 - 0.8 * S.pde); }
  function css() { return prod() / kdeg(); }
  function pka(c) { var n = 1.7, e = 2; return Math.pow(c, n) / (Math.pow(e, n) + Math.pow(c, n)); }
  function ssResp(logL) { var th = Math.pow(10, logL) / (Math.pow(10, logL) + KD * (1 + S.B / KB)), a = Math.min(1, th * S.eff + S.tox * 0.6); return pka(8 * a / kdeg()); }
  function stages() {
    return [
      ["Ligand and receptor", "Receptor", "Receptor occupancy follows θ = [L] / ([L] + K<sub>d</sub>)",
        "<p>A <b>ligand</b> (hormone, neurotransmitter) binds reversibly to a membrane <b>receptor</b>. The fraction of occupied receptors is <b>θ = [L]/([L] + K<sub>d</sub>)</b>; when [L] = K<sub>d</sub>, half are occupied. Raise the ligand concentration and watch the receptors fill.</p>"],
      ["G protein and adenylyl cyclase", "G protein", "The receptor activates several G proteins; the α subunit activates adenylyl cyclase",
        "<p>An occupied G protein-coupled receptor (<b>GPCR</b>) acts as a catalyst: it exchanges GDP for GTP on <b>several G proteins</b> (first amplification). The <b>Gα·GTP</b> subunit activates <b>adenylyl cyclase</b>, which converts ATP into <b>cAMP</b>.</p>"],
      ["cAMP, PKA and phosphodiesterase", "cAMP and PKA", "cAMP accumulates until synthesis and degradation balance",
        "<p>Adenylyl cyclase synthesizes <b>hundreds of cAMP molecules</b> per second (second amplification). <b>cAMP</b> activates <b>protein kinase A (PKA)</b>, which phosphorylates many substrate proteins (third amplification). <b>Phosphodiesterase (PDE)</b> degrades cAMP and ends the signal; an inhibitor such as caffeine prolongs it.</p>"],
      ["Agonists, antagonists and toxin", "Drugs", "A competitive antagonist shifts the dose–response curve to the right",
        "<p>A <b>partial agonist</b> produces a smaller maximal response even when it occupies all receptors. A <b>competitive antagonist</b> occupies the site without activating it and <b>shifts the curve</b>: more agonist is needed for the same response (higher apparent EC₅₀). <b>Cholera toxin</b> blocks the active Gα and keeps the cyclase switched on, producing excess cAMP.</p>"],
      ["Receptor tyrosine kinase", "RTK", "The ligand dimerizes the receptor and triggers autophosphorylation",
        "<p><b>Receptor tyrosine kinases (RTKs)</b> do not use classical second messengers: the ligand causes receptor <b>dimerization</b>, and the receptor <b>autophosphorylates</b> on tyrosines. The phosphotyrosines recruit adaptor proteins that activate <b>Ras → MAPK cascade</b> and control cell proliferation. Compare with the GPCR cascade.</p>"]
    ];
  }
  var def = {
    key: 'senalizacion-celular', title: "Cell signaling: receptor → second messenger", subtitle: "3D Simulator · biology", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [17, 3, 24], target: [17, -3, 0] }, { id: 'frontal', label: "Front", pos: [17, -2, 28], target: [17, -3, 0] }],
    layers: [{ id: 'lig', label: "Ligands", icon: '●' }, { id: 'cm', label: "cAMP", icon: '·' }],
    build: function (ctx) {
      g = new T.Group(); g.scale.setScalar(0.7); g.position.set(11.5, 2.1, 0); ctx.scene.add(g); var i, M = function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5 }); };
      var mem = new T.Mesh(new T.BoxGeometry(20, 0.5, 6), new T.MeshStandardMaterial({ color: 0xffd8a8, transparent: true, opacity: 0.8 })); mem.position.set(16, 0, 0); g.add(mem);
      XR.forEach(function (x) { var r = new T.Mesh(new T.CylinderGeometry(0.45, 0.6, 1.8, 12), M(0x748ffc)); r.position.set(x, 0.9, 0); g.add(r); rec.push(r); var G = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), M(0xadb5bd)); G.position.set(x, -1, 0); g.add(G); gp.push(G); var P = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), M(0xffd43b)); g.add(P); pl.push(P); });
      for (i = 0; i < 20; i++) { var l = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), M(0xff922b)); g.add(l); lig.push(l); }
      acm = new T.Mesh(new T.BoxGeometry(2.2, 1.6, 1.6), M(0xadb5bd)); acm.position.set(25.5, -0.3, 0); g.add(acm);
      for (i = 0; i < 70; i++) { var c = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), M(0x22b8cf)); g.add(c); cm.push(c); }
      for (i = 0; i < 4; i++) { var p = new T.Mesh(new T.SphereGeometry(0.7, 12, 10), M(0x868e96)); p.position.set(11 + i * 4.5, -8, 0); g.add(p); pk.push(p); }
      for (i = 0; i < 12; i++) { var s = new T.Mesh(new T.BoxGeometry(0.7, 0.7, 0.7), M(0x868e96)); s.position.set(9 + i * 1.8, -11, 0); g.add(s); sub.push(s); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k, d = Math.min(dt || 0.016, 0.05), th, on = ctx.layer('lig'), con = ctx.layer('cm'), th0 = ctx.now;
      if (!P.manual) { S.rtk = i === 4 ? 1 : 0; S.B = 0; S.eff = 1; S.pde = 0; S.tox = 0; if (i === 0) S.L = -1 + 3.5 * f.local; if (i === 1) S.L = 2.5; if (i === 2) { S.L = f.local < 0.5 ? 2.5 : -2; S.pde = f.local > 0.75 ? 1 : 0; } if (i === 3) { S.L = 2; S.B = f.local < 0.33 ? 0 : (f.local < 0.66 ? 100 : 0); S.tox = f.local > 0.66 ? 1 : 0; } if (i === 4) S.L = 2.5; }
      S.c += d * 2 * (prod() - kdeg() * S.c); Hc.push(S.c); if (Hc.length > 400) Hc.shift();
      th = theta(); var nOcc = Math.round(th * 5), nG = Math.round(act() * 5), rtk = S.rtk === 1, pk0 = pka(S.c);
      rec.forEach(function (r, j) { var occ = j < nOcc; r.material.color.setHex(occ ? 0x4263eb : 0x748ffc); r.rotation.z = rtk && occ ? (j % 2 ? 0.35 : -0.35) : 0; });
      lig.forEach(function (l, j) { var nl = Math.min(20, Math.round(3 + (S.L + 2) * 3)); l.visible = on && j < nl + 0; if (j < nOcc) { l.position.set(XR[j], 2.3, 0); } else { var a = j * 2.4 + th0 * 0.5; l.position.set(9 + (j * 1.7) % 15 + Math.sin(a) * 0.5, 3.5 + (j % 5) * 1.0 + Math.cos(a) * 0.4, Math.sin(a * 1.3) * 2); } });
      gp.forEach(function (G, j) { G.visible = !rtk; G.material.color.setHex(j < nG ? 0xffd43b : 0xadb5bd); G.position.y = -1 - (j < nG ? 0.4 : 0); });
      acm.visible = !rtk; acm.material.color.setHex(act() > 0.3 ? 0x40c057 : 0xadb5bd);
      pl.forEach(function (p, j) { p.visible = rtk && j < nOcc; p.position.set(XR[j] + (j % 2 ? -0.5 : 0.5), -0.7, 0); });
      var nc = Math.min(70, Math.round(S.c * 7)); cm.forEach(function (c, j) { c.visible = con && !rtk && j < nc; var a = j * 2.4 + th0 * (0.4 + (j % 3) * 0.1), r = 1 + (j % 9) * 0.9; c.position.set(16 + Math.cos(a) * (3 + (j % 7) * 1.7), -2.6 - ((j * 0.37) % 4.5) + Math.sin(a) * 0.3, Math.sin(a * 1.1) * 2); });
      pk.forEach(function (p, j) { p.visible = !rtk; p.material.color.set(0x868e96).lerp(new T.Color(0xf03e3e), pk0); });
      sub.forEach(function (s, j) { var on2 = rtk ? j / 12 < Math.min(1, th * S.eff) : j / 12 < pk0; s.material.color.setHex(on2 ? 0xffd43b : 0x868e96); });
      lab[0].pos(22.70, 6.02, 0).set("Occupied receptors: " + nOcc + ' / 5 (θ = ' + fmt(th, 2) + ')', 'bl-lead').vis(true);
      lab[1].pos(20.60, 0.35, 0).set(rtk ? "dimerization and autophosphorylation" : "Active G proteins: " + nG + ' / 5', 'bl-d').vis(true);
      lab[2].pos(29.35, 3.22, 0).set("Adenylyl cyclase", 'bl-d').vis(!rtk);
      lab[3].pos(22.70, -2.80, 0).set(rtk ? "Ras → MAPK" : "cAMP = " + fmt(S.c, 1) + ' µM', rtk ? 'bl-pos' : 'bl-d').vis(true);
      lab[4].pos(22.70, -4.41, 0).set(rtk ? "Cell proliferation" : "Active PKA: " + fmt(pk0 * 100, 0) + ' %', 'bl-pos').vis(true);
      lab[5].pos(22.70, -6.58, 0).set("Phosphorylated substrate proteins", 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['L', 'eff', 'B', 'pde'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); if (u.tox) u.tox.set(S.tox); if (u.rtk) u.rtk.set(S.rtk); },
    hud: function () { return { eq: { chip: 'cAMP', name: "Signal", body: "<div class=\"eqline\"><small>[Ligand]</small>" + fmt(Math.pow(10, S.L), Math.pow(10, S.L) < 10 ? 2 : 0) + " nM</div><div class=\"eqline\"><small>Occupancy θ</small>" + fmt(theta(), 2) + "</div><div class=\"eqline\"><small>cAMP</small>" + fmt(S.c, 1) + " µM</div><div class=\"eqline\"><small>Active PKA</small>" + fmt(pka(S.c) * 100, 0) + ' %</div>' }, legend: [{ label: "Orange", color: '#ff922b', text: "ligand" }, { label: 'Cian', color: '#22b8cf', text: "cAMP" }, { label: "Yellow", color: '#ffd43b', text: "active G protein / phosphate" }] }; },
    measures: function () { return [['[Ligando]', fmt(Math.pow(10, S.L), 2) + ' nM'], ["Occupancy", fmt(theta() * 100, 0) + ' %'], ["cAMP (current)", fmt(S.c, 2) + ' µM'], ["cAMP (equilibrium)", fmt(css(), 2) + ' µM'], ["Active PKA", fmt(pka(S.c) * 100, 0) + ' %'], ["Approx. amplification", '≈ 10 000×']]; },
    ideas: ["θ = [L]/([L] + Kd).", "One receptor activates many G proteins.", "PDE terminates the signal.", "Competitive antagonist: curve to the right."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Ligand and drugs"); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('L', "Ligand (log nM)", -2, 4, 0.1, function (v) { return fmt(Math.pow(10, v), Math.pow(10, v) < 10 ? 2 : 0) + ' nM'; }), sl('eff', "Agonist efficacy", 0.1, 1, 0.05, function (v) { return fmt(v, 2); }), sl('B', "Competitive antagonist", 0, 1000, 10, function (v) { return v + ' nM'; }), sl('pde', "PDE inhibitor (caffeine)", 0, 1, 0.05, function (v) { return fmt(v * 100, 0) + ' %'; })]));
      ui.tox = kit.ui.options({ label: "Cholera toxin", cols: 2, value: S.tox, options: [{ v: 0, label: 'No' }, { v: 1, label: "Yes" }], onChange: function (v) { ctx.goManual(); S.tox = +v; } });
      ui.rtk = kit.ui.options({ label: "Receptor type", cols: 2, value: S.rtk, options: [{ v: 0, label: 'GPCR' }, { v: 1, label: "RTK" }], onChange: function (v) { ctx.goManual(); S.rtk = +v; } });
      c.appendChild(ui.tox); c.appendChild(ui.rtk); c.appendChild(ctx.btnRow([{ t: "Reset cAMP", fn: function () { S.c = 0; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Dose–response (PKA)", h: 210, note: "Sigmoid curve: response at equilibrium vs. log [ligand]. The antagonist shifts it to the right.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#8ce99a'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 60; i++) { var lg = -2 + 6 * i / 60, y = Tp + ph * (1 - ssResp(lg)), x = L + pw * i / 60; i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.L + 2) / 6, Tp + ph * (1 - ssResp(S.L)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText("0.01 nM", L, h - 8); cx.fillText('10 µM', L + pw, h - 8); cx.fillText("log [L]", L + pw / 2, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph);
    } }, { title: "cAMP over time", h: 190, note: "Rises until synthesis = degradation.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 22, pw = w - L - R, ph = h - Tp - B, mx = 12; cx.strokeStyle = '#22b8cf'; cx.lineWidth = 2; cx.beginPath(); Hc.forEach(function (v, i) { var x = L + pw * (i + (400 - Hc.length)) / 400, y = Tp + ph * (1 - Math.min(1, v / mx)); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillText('12 µM', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph); cx.textAlign = 'center'; cx.fillText("time →", L + pw / 2, h - 6);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, L = Math.pow(10, S.L); return "<div class=\"card-kicker\">K<sub>d</sub> = 10 nM · K<sub>b</sub> = 10 nM</div><table class=\"calc-table\">" + row('θ', fmt(L, 2) + ' / (' + fmt(L, 2) + ' + 10·(1 + ' + fmt(S.B, 0) + '/10)) = <b>' + fmt(theta(), 3) + '</b>') + row("Activation", "θ × efficacy" + (S.tox ? ' + toxina' : '') + ' = <b>' + fmt(act(), 2) + '</b>') + row("cAMP (equilibrium)", "synthesis / degradation = " + fmt(prod(), 1) + ' / ' + fmt(kdeg(), 2) + ' = <b>' + fmt(css(), 1) + ' µM</b>') + row("Active PKA", 'c<sup>1,7</sup> / (2<sup>1,7</sup> + c<sup>1,7</sup>) = <b>' + fmt(pka(S.c) * 100, 0) + ' %</b>') + row("Amplification", "≈ 10 G × 100 cAMP × 10 substrates ≈ <b>10,000×</b> per receptor") + '</table>'; },
    quiz: [
      { q: "If [L] = K<sub>d</sub>, the fraction of occupied receptors is…", options: ['0,5', '0,1', '0,9', '1'], answer: 0, why: 'θ = K/(K + K) = 0,5.' },
      { q: "An activated receptor can activate…", options: ["several G proteins", "a single G protein", "none", "only ATP"], answer: 0, why: "First amplification." },
      { q: "Phosphodiesterase…", options: ["degrades cAMP and shuts off the signal", "synthesizes cAMP", "phosphorylates PKA", "binds the ligand"], answer: 0, why: "cAMP → AMP." },
      { q: "A competitive antagonist shifts the dose–response curve…", options: ["on the right", "to the left", "pointing up", "does not change it"], answer: 0, why: "More agonist is needed." },
      { q: "Cholera toxin causes…", options: ["excess cAMP from permanently active Gα", "lack of cAMP", "receptor blockade", "PKA degradation"], answer: 0, why: "It keeps adenylyl cyclase active." },
      { q: "A receptor tyrosine kinase is activated by…", options: ["dimerization and autophosphorylation", "cAMP", "opening of a channel", "GTP hydrolysis only"], answer: 0, why: "Then Ras → MAPK." }
    ],
    help: { intro: "Change the ligand concentration, efficacy and drugs. You will see how receptors fill, G proteins are activated and cAMP rises. The dose–response curve is in \"Graphs\".", items: [["Orange spheres", 'ligandos.'], ["Cyan spheres", "cAMP."]] }
  };
  MSim.create(def);
})();
