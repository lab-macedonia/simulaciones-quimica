/* Fármacos y receptores — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var LG = { ag: { n: "Full agonist", e: 1, c: 0x40c057 }, pa: { n: "Partial agonist", e: 0.4, c: 0xfab005 }, an: { n: "Antagonist", e: 0, c: 0xfa5252 } };
  var DR = { asp: { n: "Aspirin", mw: 180, lp: 1.2, hd: 1, ha: 4 }, ibu: { n: "Ibuprofen", mw: 206, lp: 3.5, hd: 1, ha: 2 }, par: { n: "Paracetamol (acetaminophen)", mw: 151, lp: 0.5, hd: 2, ha: 2 }, ato: { n: "Atorvastatin", mw: 559, lp: 5.7, hd: 4, ha: 7 }, cic: { n: "Cyclosporine", mw: 1203, lp: 3, hd: 5, ha: 12 } };
  var S = { lg: 'ag', logL: -7, logKd: -7, antag: false, logB: -7, logKb: -8, dr: 'asp', mode: 'rec' }, g = null, lab = [], recs = [], lig = [], rnd = [], drs = [];
  function occ(L, Kd, B, Kb) { return L / (L + Kd * (1 + B / Kb)); }
  function resp(logL, e, withB) { var L = Math.pow(10, logL), Kd = Math.pow(10, S.logKd), B = withB ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return e * occ(L, Kd, B, Kb); }
  function lip(d) { var v = (d.mw > 500 ? 1 : 0) + (d.lp > 5 ? 1 : 0) + (d.hd > 5 ? 1 : 0) + (d.ha > 10 ? 1 : 0); return v; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Receptors and ligands", "Receptor", "A drug binds reversibly to its receptor: occupancy = [L]/([L] + Kd)",
        "<p>A <b>receptor</b> is a protein (in the membrane or inside the cell) that recognizes a <b>ligand</b> with high affinity and specificity. Binding is reversible, L + R ⇌ LR, with dissociation constant <b>K<sub>d</sub> = [L][R]/[LR]</b>: the lower the K<sub>d</sub>, the higher the affinity. The fraction of occupied receptors is <b>[L]/([L] + K<sub>d</sub>)</b>: 50 % when [L] = K<sub>d</sub>.</p>"],
      ["Agonists, partial agonists and antagonists", "Efficacy", "Efficacy (e) distinguishes what the drug does once bound",
        "<p><b>Affinity</b> is the ability to bind; <b>efficacy</b> is the ability to <b>activate</b> the receptor. The <b>full agonist</b> (e = 1) produces the maximum response; the <b>partial</b> one (0 &lt; e &lt; 1) produces a smaller response even when occupying all the receptors; the <b>antagonist</b> (e = 0) binds without activating and <b>blocks</b> the agonist. Change the type of ligand and watch the illuminated receptors.</p>"],
      ["Dose–response curve", "Dose–response", "Response versus log[L]: sigmoid with EC₅₀ at the midpoint",
        "<p>The <b>dose–response curve</b> (response versus log [L]) is a sigmoid. The <b>EC<sub>50</sub></b> is the concentration that produces 50 % of the maximum effect, and measures <b>potency</b>; the <b>E<sub>max</sub></b> measures efficacy. A partial agonist has a lower E<sub>max</sub>. With a simple model (no amplification), EC<sub>50</sub> = K<sub>d</sub>.</p>"],
      ["Competitive antagonism", "Antagonist", "The antagonist shifts the curve to the right without reducing the Emax",
        "<p>A <b>competitive antagonist</b> competes for the same site. It decreases the occupancy by the agonist: <b>[A]/([A] + K<sub>d</sub>(1 + [B]/K<sub>b</sub>))</b>. The curve <b>shifts to the right</b> (EC<sub>50</sub> increases) but <b>keeps the E<sub>max</sub></b>: it is overcome with more agonist. The shift (dose ratio) is <b>1 + [B]/K<sub>b</sub></b> (Schild analysis).</p>"],
      ["From molecule to medicine", 'Lipinski', "Lipinski's rules: MW ≤ 500 · logP ≤ 5 · H donors ≤ 5 · H acceptors ≤ 10",
        "<p>For a drug to be absorbed <b>orally</b>, it should meet <b>Lipinski's rule of five</b>: molar mass ≤ 500 g/mol, logP ≤ 5, ≤ 5 H-bond donors and ≤ 10 acceptors. More than one violation predicts poor absorption or permeability. There are exceptions (cyclosporine, natural products). Choose a drug and compare its properties.</p>"]
    ];
  }
  var def = {
    key: 'farmacos-receptores', title: "Drugs and Receptors", subtitle: "3D Simulator · biochemistry and pharmacology", accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [0, 10, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 2], target: [0, 0, 0] }],
    layers: [{ id: 'lig', label: "Ligands", icon: '●' }, { id: 'act', label: "Active receptors", icon: '✦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var mb = new T.Mesh(new T.BoxGeometry(22, 0.6, 14), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.45 })); mb.position.y = -1; g.add(mb);
      var seed = 7; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (i = 0; i < 40; i++) { var rc = new T.Mesh(new T.CylinderGeometry(0.55, 0.45, 2.2, 10), new T.MeshStandardMaterial({ color: 0x74c0fc, roughness: 0.5, emissive: 0x000000 })); rc.position.set(-9.5 + (i % 10) * 2.1, 0.2, -5 + Math.floor(i / 10) * 3.3 + (i % 2) * 0.4); g.add(rc); recs.push(rc); var lg = new T.Mesh(new T.SphereGeometry(0.45, 12, 8), new T.MeshStandardMaterial({ color: 0x40c057 })); lg.position.copy(rc.position).add(new T.Vector3(0, 1.5, 0)); g.add(lg); lig.push(lg); rnd.push([r(), r()]); }
      for (i = 0; i < 5; i++) { var bar = new T.Mesh(new T.BoxGeometry(1.6, 1, 1.6), new T.MeshStandardMaterial({ color: 0x4dabf7 })); bar.visible = false; g.add(bar); drs.push(bar); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 4 ? 'lip' : 'rec'; if (i === 0) { S.lg = 'ag'; S.antag = false; S.logL = -9 + 4 * Math.min(1, f.local * 1.1); } if (i === 1) { S.lg = ['ag', 'pa', 'an'][Math.min(2, Math.floor(f.local * 3))]; S.logL = -5.5; S.antag = false; } if (i === 2) { S.lg = 'ag'; S.logL = -9 + 5 * f.local; S.antag = false; } if (i === 3) { S.lg = 'ag'; S.antag = true; S.logL = -9 + 5 * f.local; } if (i === 4) S.dr = Object.keys(DR)[Math.min(4, Math.floor(f.local * 5))]; }
      lab.forEach(function (l) { l.vis(false); }); drs.forEach(function (b) { b.visible = false; });
      var lOn = ctx.layer('lig'), aOn = ctx.layer('act');
      if (S.mode === 'lip') {
        recs.forEach(function (r) { r.visible = false; }); lig.forEach(function (l) { l.visible = false; }); var d = DR[S.dr], vals = [d.mw / 500, d.lp / 5, d.hd / 5, d.ha / 10], names = ["MW ≤ 500", 'logP ≤ 5', 'HBD ≤ 5', 'HBA ≤ 10'];
        vals.forEach(function (v, j) { var b = drs[j]; b.visible = true; var hh = Math.max(0.2, v * 6); b.scale.y = hh; b.position.set(-7.5 + j * 5, hh / 2 - 1, 0); b.material.color.setHex(v > 1 ? 0xfa5252 : 0x40c057); lab[j].pos(-7.5 + j * 5, -2.6, 0).set(names[j], 'bl-d').vis(true); });
        lab[4].pos(0, 8.6, 0).set(d.n + ' · infracciones: ' + lip(d), lip(d) > 1 ? 'bl-neg' : 'bl-pos').vis(true); lab[5].pos(0, -4.4, 0).set("height = value / limit (1 = Lipinski limit)", 'bl-d').vis(true); return;
      }
      var e = LG[S.lg].e, L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), oL = L / (L + Kd * (1 + B / Kb)), oB = (S.antag ? (B / Kb) / (1 + B / Kb + L / Kd) : 0) * 1, tot = 1 + L / Kd + B / Kb; oB = (B / Kb) / tot; oL = (L / Kd) / tot;
      var nL = 0, nB = 0, nA = 0;
      recs.forEach(function (r, j) { var u = rnd[j][0], v = rnd[j][1], state = u < oL ? 'L' : (u < oL + oB ? 'B' : 'F'), act = state === 'L' && v < e; lig[j].visible = lOn && state !== 'F'; lig[j].material.color.setHex(state === 'L' ? LG[S.lg].c : 0xfa5252); lig[j].position.y = 1.5 + 0.1 * Math.sin(now * 2 + j); r.material.emissive.setHex(act && aOn ? 0xfab005 : 0x000000); r.material.emissiveIntensity = 0.8; r.visible = true; if (state === 'L') nL++; if (state === 'B') nB++; if (act) nA++; });
      lab[0].pos(0, 6.6, 0).set(LG[S.lg].n + ' · [L] = ' + (L < 1e-6 ? fmt(L * 1e9, 1) + ' nM' : fmt(L * 1e6, 2) + ' µM'), 'bl-lead').vis(true);
      lab[1].pos(0, -4.6, 0).set("occupancy " + fmt(oL * 100, 0) + " % · response " + fmt(e * oL * 100, 0) + " % of maximum" + (S.antag ? " · antagonist occupies " + fmt(oB * 100, 0) + ' %' : ''), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lg) u.lg.set(S.lg); if (u.L) u.L.set(S.logL); if (u.dr) u.dr.set(S.dr); },
    hud: function () { var L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), o = L / (L + Kd * (1 + B / Kb)), e = LG[S.lg].e; return { eq: { chip: fmt(o * 100, 0) + '%', name: LG[S.lg].n, body: "<div class=\"eqline\"><small>Occupancy</small>" + fmt(o * 100, 1) + " %</div><div class=\"eqline\"><small>Efficacy e</small>" + fmt(e, 1) + "</div><div class=\"eqline\"><small>Response</small>" + fmt(e * o * 100, 1) + " %</div><div class=\"eqline\"><small>Apparent EC₅₀</small>" + fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM</div>' }, legend: [{ label: "Green", color: '#40c057', text: "bound agonist" }, { label: "Red", color: '#fa5252', text: "bound antagonist" }, { label: "Yellow receptor", color: '#fab005', text: "activated receptor" }] }; },
    measures: function () { var Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return [["Ligand", LG[S.lg].n], ['Kd', fmt(Kd * 1e9, 1) + ' nM'], ['log[L]', fmt(S.logL, 1)], ["Antagonist", S.antag ? fmt(B * 1e9, 1) + ' nM (Kb ' + fmt(Kb * 1e9, 1) + ' nM)' : "absent"], ["Dose ratio", fmt(1 + B / Kb, 2)]]; },
    ideas: ["Occupancy = [L]/([L] + Kd).", "Affinity ≠ efficacy.", "Competitive antagonist: curve to the right, same Emax.", "Lipinski: ≤ 1 violation for oral route."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Ligand"); el.appendChild(c);
      ui.lg = kit.ui.options({ label: "Type", cols: 1, value: S.lg, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n, sub: 'e = ' + LG[k].e }; }), onChange: function (v) { ctx.goManual(); S.mode = 'rec'; S.lg = v; } }); c.appendChild(ui.lg);
      ui.L = kit.ui.slider({ label: 'log [L] (M)', min: -10, max: -3, step: 0.1, value: S.logL, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'rec'; S.logL = v; } });
      var sk = kit.ui.slider({ label: 'log Kd (M)', min: -9, max: -5, step: 0.1, value: S.logKd, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.logKd = v; } });
      var sb = kit.ui.slider({ label: "log [antagonist] (M)", min: -10, max: -4, step: 0.1, value: S.logB, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.antag = true; S.logB = v; } });
      c.appendChild(kit.ui.sliders([ui.L, sk, sb]));
      c.appendChild(ctx.btnRow([{ t: "Antagonist: yes/no", fn: function () { ctx.goManual(); S.antag = !S.antag; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var d = kit.ui.card('Lipinski'); el.appendChild(d); ui.dr = kit.ui.options({ label: "Drug", cols: 2, value: S.dr, options: Object.keys(DR).map(function (k) { return { v: k, label: DR[k].n }; }), onChange: function (v) { ctx.goManual(); S.mode = 'lip'; S.dr = v; } }); d.appendChild(ui.dr);
    },
    graphs: [
      { title: "Dose–response curve", h: 250, note: "Green line: agonist alone. Red line: with antagonist (shifted). Dot: your dose.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, e = LG[S.lg].e; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = -10; i <= -3; i++) cx.fillText(i, L + pw * (i + 10) / 7, h - B + 14); cx.fillText("log [L]", L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(i * 25 + '%', L - 4, Tp + ph * (1 - i / 4) + 3);
        function crv(withB, color) { cx.strokeStyle = color; cx.lineWidth = 2; cx.beginPath(); for (var k = 0; k <= 100; k++) { var lg = -10 + 7 * k / 100; (k ? cx.lineTo : cx.moveTo).call(cx, L + pw * (lg + 10) / 7, Tp + ph * (1 - resp(lg, Math.max(e, 0.001), withB))); } cx.stroke(); }
        crv(false, '#40c057'); if (S.antag) crv(true, '#fa5252'); cx.lineWidth = 1;
        var rr = resp(S.logL, e, S.antag); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.logL + 10) / 7, Tp + ph * (1 - rr), 5, 0, 6.28); cx.fill();
        cx.strokeStyle = col.muted; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - e / 2)); cx.lineTo(L + pw, Tp + ph * (1 - e / 2)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: "Lipinski's rule", h: 220, note: "Bars: drug value / limit. Red = exceeds the limit.", draw: function (cx, w, h, col) {
        var d = DR[S.dr], D = [["MW", d.mw / 500, d.mw + " g/mol"], ['logP', d.lp / 5, fmt(d.lp, 1)], ["H donors", d.hd / 5, String(d.hd)], ["H acceptors", d.ha / 10, String(d.ha)]], L = 88, Rr = 50, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / 4; cx.font = '10px system-ui';
        D.forEach(function (a, j) { var y = Tp + j * bh, v = Math.min(2.4, a[1]); cx.fillStyle = a[1] > 1 ? '#fa5252' : '#40c057'; cx.fillRect(L, y + 5, pw * v / 2.4, bh - 10); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(a[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(a[2], L + pw * v / 2.4 + 4, y + bh / 2 + 3); });
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw / 2.4, Tp); cx.lineTo(L + pw / 2.4, h - B); cx.stroke(); cx.setLineDash([]);
      } }
    ],
    calc: function () { var Kd = Math.pow(10, S.logKd), L = Math.pow(10, S.logL), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'lip') { var d = DR[S.dr]; return '<div class="card-kicker">' + d.n + '</div><table class="calc-table">' + row("Molar mass", d.mw + ' g/mol ' + (d.mw > 500 ? '✗' : '✓')) + row('logP', fmt(d.lp, 1) + (d.lp > 5 ? ' ✗' : ' ✓')) + row("H donors", d.hd + (d.hd > 5 ? ' ✗' : ' ✓')) + row("H acceptors", d.ha + (d.ha > 10 ? ' ✗' : ' ✓')) + row("Violations", '<b>' + lip(d) + '</b> → ' + (lip(d) > 1 ? "probable poor oral absorption" : "good oral candidate")) + '</table>'; } var o = L / (L + Kd * (1 + B / Kb)); return "<div class=\"card-kicker\">Occupancy</div><table class=\"calc-table\">" + row('[L]', fmt(L * 1e9, 2) + ' nM') + row('Kd', fmt(Kd * 1e9, 2) + ' nM') + row('Factor 1 + [B]/Kb', fmt(1 + B / Kb, 2)) + row("Occupancy", '[L]/([L] + Kd·f) = <b>' + fmt(o * 100, 1) + ' %</b>') + row("Response = e × occupancy", fmt(LG[S.lg].e, 1) + ' × ' + fmt(o, 3) + ' = <b>' + fmt(LG[S.lg].e * o * 100, 1) + ' %</b>') + row("Apparent EC₅₀", fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM') + '</table>'; },
    quiz: [
      { q: "If [L] = Kd, the occupancy is…", options: ['50 %', '100 %', '10 %', '0 %'], answer: 0, why: '[L]/([L] + Kd) = ½.' },
      { q: "An antagonist has efficacy…", options: ["zero", 'uno', "greater than one", "always negative"], answer: 0, why: "It binds without activating." },
      { q: "A competitive antagonist shifts the curve…", options: ["to the right, with the same Emax", "to the left", "reduces the Emax", "does not change"], answer: 0, why: "It increases the EC₅₀." },
      { q: "A partial agonist…", options: ["does not reach the Emax of the full one", "always blocks", "has Kd = 0", "does not bind"], answer: 0, why: 'e < 1.' },
      { q: "Lipinski's rule sets as the maximum molar mass…", options: ["500 g/mol", "1000 g/mol", "150 g/mol", "5000 g/mol"], answer: 0, why: "For oral absorption." }
    ],
    help: { intro: "Each cylinder is a receptor; the green spheres are bound agonists and the red ones, antagonists. A yellow receptor is activated. In “Lipinski” you see the four properties of a drug.", items: [["Yellow receptor", 'activado.'], ["Red sphere", 'antagonista.']] }
  };
  MSim.create(def);
})();
