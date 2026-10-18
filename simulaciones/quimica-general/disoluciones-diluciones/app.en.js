/* Disoluciones y diluciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var SOL = { nacl: { f: 'NaCl', M: 58.44, d: 2.16, c: 0xf1f3f5 }, cuso4: { f: 'CuSO₄', M: 159.61, d: 3.6, c: 0x339af0 }, kmno4: { f: 'KMnO₄', M: 158.03, d: 2.7, c: 0xae3ec9 }, naoh: { f: "NaOH", M: 40.0, d: 2.13, c: 0xe9ecef } };
  var S = { s: 'cuso4', m: 15.96, V: 250, C1: 1.0, V1: 50, V2: 250, cB: 0.2, vB: 150 }, g = null, flask = null, liq = null, dots = [], lab = [], mix = null;
  function M() { return SOL[S.s].M; }
  function C() { return S.m / M() / (S.V / 1000); }
  function Cd() { return S.C1 * S.V1 / S.V2; }
  function mixC() { var a = S.C1 * S.V1 + S.cB * S.vB; return a / (S.V1 + S.vB); }
  function stages() {
    return [
      ["Molarity", "Molarity", "M = moles of solute / liters of solution",
        "<p><b>Molarity</b> is the amount of solute per liter of <b>solution</b>: <b>M = n / V</b>. The solute is weighed, dissolved in some water and <b>made up to the mark</b> in a volumetric flask. Increase the mass of solute and watch the concentration rise and the color intensify.</p>"],
      ["Prepare a solution", "Prepare", "Mass needed = M · V · molar mass",
        "<p>To prepare a volume V at concentration M, weigh <b>m = M · V · M<sub>molar</sub></b> grams. Example: 250 mL of 0.40 M CuSO₄ requires 0.40 × 0.250 × 159.61 = 15.96 g. The final volume is that of the flask, not of the water added.</p>"],
      ["Dilution", "Dilution", "C₁V₁ = C₂V₂: on dilution the volume changes, not the moles",
        "<p>When diluting, solvent is added and the <b>moles of solute do not change</b>: <b>C₁V₁ = C₂V₂</b>. Take an aliquot V₁ of a concentrated solution C₁ and bring it to V₂: the new concentration is C₂ = C₁V₁/V₂. The number of particles is the same, but they are farther apart.</p>"],
      ["Mixing solutions", "Mixture", "Total moles / total volume",
        "<p>When two solutions of the same solute are mixed, the <b>moles add</b> and so do the volumes (approx.): <b>C = (C₁V₁ + C₂V₂) / (V₁ + V₂)</b>. The final concentration lies between the two initial ones.</p>"]
    ];
  }
  function rgb(c, a) { var col = new T.Color(c), w = new T.Color(0xdbeafe); return w.lerp(col, Math.min(1, a)); }
  var def = {
    key: 'disoluciones-diluciones', title: "Solutions and dilutions", subtitle: "3D Simulator · general chemistry", accent: { dark: '#3bc9db', light: '#0b7285' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 5, 22], target: [6, 3, 0] }, { id: 'frontal', label: "Front", pos: [6, 3, 24], target: [6, 3, 0] }],
    layers: [{ id: 'dots', label: "Particles", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      function fl(x) { var G = new T.Group(); G.position.set(x, 0, 0); g.add(G);
        var neck = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 3, 20, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); neck.position.y = 8.5; G.add(neck);
        var bulb = new T.Mesh(new T.SphereGeometry(3, 28, 20), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); bulb.position.y = 3; G.add(bulb);
        var lq = new T.Mesh(new T.SphereGeometry(2.9, 24, 18), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.75 })); lq.position.y = 3; G.add(lq); G.userData.lq = lq; return G; }
      flask = fl(0); mix = fl(8); g.userData.f2 = fl(16);
      for (i = 0; i < 120; i++) { var d = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); flask.add(d); dots.push(d); }
      for (i = 0; i < 120; i++) { var d2 = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); mix.add(d2); dots.push(d2); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.s = 'cuso4'; S.V = 250; S.m = 1 + 39 * f.local; } if (i === 1) { S.s = 'cuso4'; S.V = 250; S.m = 15.96; } if (i === 2) { S.C1 = 1; S.V1 = 50; S.V2 = 50 + 250 * f.local; } if (i === 3) { S.vB = 20 + 280 * f.local; } }
      var s = SOL[S.s], c = C(), on = ctx.layer('dots'), cd = Cd(), cm = mixC(), k;
      var tgt = i === 2 || (P.manual && false);
      flask.userData.lq = flask.children[2]; var sets = [{ g: flask, c: c, n: Math.round(Math.min(120, c * 60)) }, { g: mix, c: i === 2 ? cd : mixC(), n: Math.round(Math.min(120, (i === 2 ? cd : mixC()) * 60)) }];
      flask.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, c / 0.5)));
      mix.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, (i === 2 ? cd : cm) / 0.5)));
      var n1 = sets[0].n, n2 = sets[1].n;
      dots.forEach(function (d, j) { var base = j < 120 ? 0 : 120, idx = j - base, n = base ? n2 : n1; d.visible = on && idx < n; var a = idx * 2.399963, r = 2.2 * Math.cbrt((idx % 37 + 1) / 37); var y = 3 + 2.2 * Math.cos(idx * 0.7) * Math.cbrt(((idx * 7) % 41 + 1) / 41); d.position.set(Math.cos(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5), y - 0.2, Math.sin(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5)); d.material.color.setHex(s.c === 0xf1f3f5 ? 0x1971c2 : 0x212529); });
      var sec = i >= 2;
      mix.visible = sec; g.userData.f2.visible = false; flask.position.x = sec ? 0 : 5; mix.position.x = 9; if (!sec) mix.visible = false;
      lab[0].pos(flask.position.x, 10.5, 0).set(s.f + ' ' + fmt(c, 3) + ' M', 'bl-lead').vis(i !== 2 && i !== 3 || P.manual);
      lab[1].pos(flask.position.x, -1, 0).set(fmt(S.m, 2) + " g in " + fmt(S.V, 0) + ' mL', 'bl-d').vis(!sec);
      lab[2].pos(0, 10.5, 0).set('C₁ = ' + fmt(S.C1, 2) + ' M · V₁ = ' + fmt(S.V1, 0) + ' mL', 'bl-lead').vis(sec);
      lab[3].pos(9, 10.5, 0).set(i === 3 ? 'mezcla: ' + fmt(cm, 3) + ' M' : 'C₂ = ' + fmt(cd, 3) + ' M · V₂ = ' + fmt(S.V2, 0) + ' mL', 'bl-pos').vis(sec);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.s) u.s.set(S.s); if (u.m) u.m.set(S.m); if (u.V) u.V.set(S.V); if (u.C1) u.C1.set(S.C1); if (u.V1) u.V1.set(S.V1); if (u.V2) u.V2.set(S.V2); if (u.cB) u.cB.set(S.cB); if (u.vB) u.vB.set(S.vB); },
    hud: function () { return { eq: { chip: 'M', name: "Concentration", body: "<div class=\"eqline\"><small>n solute</small>" + fmt(S.m / M(), 4) + " mol</div><div class=\"eqline\"><small>Molarity</small>" + fmt(C(), 3) + " M</div><div class=\"eqline\"><small>C₂ (dilution)</small>" + fmt(Cd(), 3) + " M</div><div class=\"eqline\"><small>Mixture</small>" + fmt(mixC(), 3) + ' M</div>' }, legend: [{ label: "Dots", color: '#212529', text: "solute particles" }, { label: "Color", color: '#339af0', text: "more intense = more concentrated" }] }; },
    measures: function () { var s = SOL[S.s]; var pc = S.m / (S.V * 1.0 + S.m) * 100; return [["Solute", s.f], ["Molar mass", fmt(M(), 2) + " g/mol"], ["n solute", fmt(S.m / M(), 4) + ' mol'], ["Molarity", fmt(C(), 3) + ' M'], ['% m/V', fmt(S.m / S.V * 100, 2) + ' %'], ["Dilution C₂", fmt(Cd(), 3) + ' M'], ["Mixture", fmt(mixC(), 3) + ' M']]; },
    ideas: ["M = n / V (of solution).", "Diluting does not change the moles.", 'C₁V₁ = C₂V₂.', "Mixing: sum of moles / total volume."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Prepare a solution"); el.appendChild(c);
      ui.s = kit.ui.options({ label: "Solute", cols: 2, value: S.s, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].f, sub: fmt(SOL[k].M, 1) + " g/mol" }; }), onChange: function (v) { ctx.goManual(); S.s = v; } });
      ui.m = kit.ui.slider({ label: "Mass of solute", min: 0.5, max: 80, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.V = kit.ui.slider({ label: "Flask volume", min: 50, max: 1000, step: 50, value: S.V, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V = v; } });
      c.appendChild(ui.s); c.appendChild(kit.ui.sliders([ui.m, ui.V]));
      var d = kit.ui.card("Dilution (C₁V₁ = C₂V₂)"); el.appendChild(d);
      ui.C1 = kit.ui.slider({ label: 'C₁', min: 0.1, max: 5, step: 0.1, value: S.C1, format: function (v) { return fmt(v, 1) + ' M'; }, onInput: function (v) { ctx.goManual(); S.C1 = v; } });
      ui.V1 = kit.ui.slider({ label: "V₁ (aliquot)", min: 5, max: 200, step: 5, value: S.V1, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V1 = v; } });
      ui.V2 = kit.ui.slider({ label: "V₂ (final volume)", min: 50, max: 1000, step: 10, value: S.V2, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V2 = Math.max(v, S.V1); } });
      ui.cB = kit.ui.slider({ label: "C of the 2nd solution (mixture)", min: 0.05, max: 3, step: 0.05, value: S.cB, format: function (v) { return fmt(v, 2) + ' M'; }, onInput: function (v) { ctx.goManual(); S.cB = v; } });
      ui.vB = kit.ui.slider({ label: "Volume of the 2nd", min: 10, max: 500, step: 10, value: S.vB, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.vB = v; } });
      d.appendChild(kit.ui.sliders([ui.C1, ui.V1, ui.V2, ui.cB, ui.vB])); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Concentration on dilution", h: 220, note: "C₂ = C₁V₁/V₂ for V₂ from V₁ to 1000 mL.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = S.C1; cx.strokeStyle = '#339af0'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var v2 = S.V1 + (1000 - S.V1) * i / 100, c2 = S.C1 * S.V1 / v2, x = L + pw * i / 100, y = Tp + ph * (1 - c2 / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      var px = L + pw * Math.max(0, Math.min(1, (S.V2 - S.V1) / (1000 - S.V1))), py = Tp + ph * (1 - Cd() / mx); cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(px, py, 5, 0, 6.2832); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(fmt(S.V1, 0) + ' mL', L, h - 8); cx.fillText("1000 mL", L + pw, h - 8); cx.textAlign = 'right'; cx.fillText(fmt(mx, 1) + ' M', L - 4, Tp + 8);
    } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, n = S.m / M();
      return '<div class="card-kicker">' + SOL[S.s].f + ' · M = ' + fmt(M(), 2) + " g/mol</div><table class=\"calc-table\">" + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(M(), 2) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row("Molarity", fmt(n, 4) + ' / ' + fmt(S.V / 1000, 3) + ' L = <b>' + fmt(C(), 3) + ' M</b>') + row('C₂ = C₁V₁/V₂', fmt(S.C1, 2) + ' × ' + fmt(S.V1, 0) + ' / ' + fmt(S.V2, 0) + ' = <b>' + fmt(Cd(), 3) + ' M</b>') + row("Dilution factor", '<b>' + fmt(S.V2 / S.V1, 2) + '</b>') + row("Mixture", '(' + fmt(S.C1, 2) + '×' + fmt(S.V1, 0) + ' + ' + fmt(S.cB, 2) + '×' + fmt(S.vB, 0) + ') / ' + fmt(S.V1 + S.vB, 0) + ' = <b>' + fmt(mixC(), 3) + ' M</b>') + '</table>';
    },
    quiz: [
      { q: "How many grams of NaCl (58.44 g/mol) are there in 500 mL of 0.20 M solution?", options: ['5,84 g', '11,7 g', '2,92 g', '58,4 g'], answer: 0, why: '0,20 × 0,500 × 58,44.' },
      { q: "25 mL of 2.0 M HCl are diluted to 100 mL. The final concentration is…", options: ['0,50 M', '8,0 M', '1,0 M', '0,25 M'], answer: 0, why: '2,0 × 25 / 100.' },
      { q: "When a solution is diluted, the moles of solute…", options: ["do not change", "increase", "decrease", "double"], answer: 0, why: "Only solvent is added." },
      { q: "100 mL of 1.0 M are mixed with 100 mL of 0.20 M of the same solute. The final concentration is…", options: ['0,60 M', '1,20 M', '0,20 M', '0,50 M'], answer: 0, why: '(0,10 + 0,020)/0,200.' },
      { q: "Molarity uses the volume of…", options: ["the solution", "the solvent", "the solute", "the water added"], answer: 0, why: "Liters of solution." },
      { q: "To go from 1.0 M to 0.10 M you must…", options: ["dilute 10 times", "dilute 2 times", "concentrate 10 times", "add solute"], answer: 0, why: "Dilution factor = C₁/C₂ = 10." }
    ],
    help: { intro: "In “Lab” choose solute, mass and flask. The dots are solute particles; the color indicates the concentration. Further down are the dilution and the mixing.", items: [["Left flask", "prepared or concentrated solution."], ["Right flask", "diluted solution or mixture."]] }
  };
  MSim.create(def);
})();
