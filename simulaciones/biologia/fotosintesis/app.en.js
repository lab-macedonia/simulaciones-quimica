/* Fotosíntesis: reacciones luminosas y ciclo de Calvin — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var S = { mode: 'chloro', q: 0, I: 0.8, co2: 0.8, inh: 'n', run: false, stage: 0, _st: -1 }, lab = {}, gC, gM, gK, ph = [], el = [], hp = [], o2 = [], atp = [], nad = [], rot, memb, lumen, kc = [], lastNow = 0;
  var NPH = 7, NEL = 5, NHP = 36, NO2 = 5, NAT = 10, NNA = 10;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function rate(I, co2) { return (1 - Math.exp(-I / 0.35)) * co2 / (co2 + 0.25) * 1.25; }
  var X = { psII: -6.5, b6f: -2.2, psI: 2.4, fnr: 4.6, atp: 7.4 };
  function stages() {
    return [
      ["The chloroplast", "Chloroplast", "Stacked thylakoids (grana) in the stroma: the light reactions happen in the membrane, the Calvin cycle in the stroma",
        "<p>Photosynthesis takes place in the <b>chloroplast</b>, surrounded by two membranes. Inside, the <b>stroma</b> (fluid) contains the <b>thylakoids</b>, flattened sacs stacked in <b>grana</b>; the interior space of each thylakoid is the <b>lumen</b>. The <b>light reactions</b> (light-dependent) occur in the <b>thylakoid membrane</b>; the <b>Calvin cycle</b> (CO₂ fixation), in the stroma. Overall equation: <b>6 CO₂ + 12 H₂O + light → C₆H₁₂O₆ + 6 O₂ + 6 H₂O</b>.</p>"],
      ["Light and water photolysis", "Light and water", "Photosystem II: light excites chlorophyll P680 and water supplies electrons",
        "<p>The <b>pigments</b> (chlorophylls a and b, carotenoids) capture photons, mainly in the blue (≈ 430–450 nm) and red (≈ 660–680 nm), and transfer the energy to the <b>reaction center</b> of <b>photosystem II (P680)</b>. When excited, P680 gives up an electron; to replace it, the <b>oxygen-evolving complex</b> splits water: <b>2 H₂O → 4 H⁺ + 4 e⁻ + O₂</b>. The O₂ released comes from water, not from CO₂, and the H⁺ remain in the <b>lumen</b>.</p>"],
      ["Electron transport and H⁺ gradient", "e⁻ transport", "PSII → plastoquinone → cytochrome b₆f → plastocyanin → PSI; b₆f pumps H⁺ into the lumen",
        "<p>The electrons pass through the <b>transport chain</b>: <b>PSII → plastoquinone (PQ) → cytochrome b₆f complex → plastocyanin (PC) → PSI</b>. At b₆f the energy released <b>pumps H⁺ from the stroma into the lumen</b>. Together with photolysis, this creates a <b>proton gradient</b> (the lumen reaches pH ≈ 4–5; the stroma ≈ 8): a <b>proton-motive force</b>. A second photon excites <b>PSI (P700)</b> and sends the electron to an even higher energy level (Z scheme).</p>"],
      ["ATP synthase and NADPH", "ATP and NADPH", "H⁺ return to the stroma through ATP synthase (ADP + Pᵢ → ATP); PSI reduces NADP⁺ to NADPH",
        "<p>The H⁺ return to the stroma through <b>ATP synthase</b>: the flow turns its rotor and catalyzes <b>ADP + Pᵢ → ATP</b> (<b>photophosphorylation</b>, about 4 H⁺ per ATP). In PSI, the electrons, through <b>ferredoxin</b> and <b>FNR</b>, reduce <b>NADP⁺ + H⁺ + 2 e⁻ → NADPH</b>. The product of the light phase is <b>ATP + NADPH + O₂</b>; with intense light the carriers saturate.</p>"],
      ["Calvin cycle: fixation and reduction", 'Calvin I', "RuBisCO fixes CO₂ onto RuBP (5C) → 2 × 3-PGA; then ATP and NADPH reduce it to G3P",
        "<p>In the stroma, <b>RuBisCO</b> joins <b>CO₂</b> to <b>ribulose-1,5-bisphosphate (RuBP, 5 C)</b> and the 6 C intermediate splits into <b>2 × 3-phosphoglycerate (3-PGA, 3 C)</b>. Then, 3-PGA is <b>phosphorylated with ATP</b> and <b>reduced with NADPH</b> to <b>glyceraldehyde-3-phosphate (G3P)</b>. For <b>3 CO₂</b> fixed: 3 RuBP + 3 CO₂ → 6 PGA → 6 G3P (6 ATP + 6 NADPH).</p>"],
      ["Regeneration and balance", 'Calvin II', "Of 6 G3P: 1 leaves as product and 5 regenerate 3 RuBP (3 ATP)",
        "<p>Of the 6 G3P, <b>only 1 leaves the cycle</b> (used to synthesize glucose, sucrose or starch); the other <b>5 G3P</b> (15 C) are rearranged to regenerate <b>3 RuBP</b> (15 C) with 3 ATP. Balance per <b>CO₂ fixed: 3 ATP + 2 NADPH</b>. For one glucose (6 CO₂): <b>18 ATP + 12 NADPH</b>. In this way the energy of light is stored in C–H and C–C bonds.</p>"]
    ];
  }
  function mk(g, geo, col, o) { var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: col, roughness: 0.45, transparent: !!(o && o.op), opacity: o && o.op ? o.op : 1, emissive: o && o.em ? o.em : 0x000000, depthWrite: !(o && o.op) })); g.add(m); return m; }
  function cluster(n, col, rad) { var g = new T.Group(); for (var i = 0; i < n; i++) { var a = i / n * 6.283, r = n > 1 ? rad : 0; var m = new T.Mesh(new T.SphereGeometry(0.28, 12, 9), new T.MeshStandardMaterial({ color: col, roughness: 0.4 })); m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.9, 0); g.add(m); } return g; }
  var def = {
    key: 'fotosintesis', title: "Photosynthesis", subtitle: "3D Simulator · biology", accent: { dark: '#4ade80', light: '#15803d' },
    stages: stages, nStages: 6, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 5, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 21], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 21, 2], target: [0, 0, 0] }],
    layers: [{ id: 'ph', label: "Photons", icon: '☀' }, { id: 'e', label: "Electrons", icon: 'e⁻' }, { id: 'h', label: "H⁺ protons", icon: 'H⁺' }, { id: 'p', label: 'ATP / NADPH', icon: '⚡' }],
    build: function (ctx) {
      var s = ctx.scene; gC = new T.Group(); gM = new T.Group(); gK = new T.Group(); s.add(gC); s.add(gM); s.add(gK);
      // cloroplasto
      var env = mk(gC, new T.SphereGeometry(1, 36, 24), 0x2f9e44, { op: 0.16 }); env.scale.set(9, 5.6, 5.6); var env2 = mk(gC, new T.SphereGeometry(1, 36, 24), 0x69db7c, { op: 0.1 }); env2.scale.set(8.4, 5.2, 5.2);
      [[-4.5, 0.5, 0], [-1.6, -0.9, 1], [1.8, 0.6, -1], [4.6, -0.4, 0.5]].forEach(function (p) { for (var i = 0; i < 7; i++) { var d = mk(gC, new T.CylinderGeometry(1.0, 1.0, 0.18, 24), 0x2b8a3e); d.position.set(p[0], p[1] - 0.6 + i * 0.28, p[2]); } });
      for (var k = 0; k < 3; k++) { var st = mk(gC, new T.CylinderGeometry(0.1, 0.1, 3, 8), 0x37b24d); st.rotation.z = Math.PI / 2; st.position.set(-3 + k * 3, -0.2 + k * 0.1, k * 0.2 - 0.2); }
      // membrana
      memb = mk(gM, new T.BoxGeometry(18, 0.5, 6), 0x2b8a3e, { op: 0.75 }); lumen = mk(gM, new T.BoxGeometry(18, 3.4, 6), 0x74c0fc, { op: 0.22 }); lumen.position.y = -1.95;
      var st2 = mk(gM, new T.BoxGeometry(18, 3.4, 6), 0xb2f2bb, { op: 0.1 }); st2.position.y = 1.95;
      var p2 = mk(gM, new T.CylinderGeometry(0.95, 0.95, 1.6, 20), 0x37b24d); p2.position.set(X.psII, 0, 0);
      var b6 = mk(gM, new T.BoxGeometry(1.8, 1.6, 1.4), 0xff922b); b6.position.set(X.b6f, 0, 0);
      var p1 = mk(gM, new T.CylinderGeometry(0.95, 0.95, 1.6, 20), 0x1c7a3a); p1.position.set(X.psI, 0, 0);
      var fn = mk(gM, new T.SphereGeometry(0.55, 14, 10), 0xe599f7); fn.position.set(X.fnr, 1.3, 0);
      var stk = mk(gM, new T.CylinderGeometry(0.22, 0.22, 1.2, 12), 0x4dabf7); stk.position.set(X.atp, 0, 0); rot = mk(gM, new T.CylinderGeometry(0.9, 0.9, 0.9, 6), 0x4c6ef5); rot.position.set(X.atp, 1.1, 0);
      var sg = new T.SphereGeometry(1, 12, 9);
      function pool(arr, n, col, sc, em) { for (var i = 0; i < n; i++) { var m = new T.Mesh(sg, new T.MeshStandardMaterial({ color: col, emissive: em || 0x000000, roughness: 0.4 })); m.scale.setScalar(sc); m.visible = false; gM.add(m); arr.push(m); } }
      pool(ph, NPH, 0xffe066, 0.28, 0xaa8800); pool(el, NEL, 0xfff3bf, 0.17, 0xcc9900); pool(hp, NHP, 0xff6b6b, 0.14); pool(o2, NO2, 0xff4d4d, 0.32); pool(atp, NAT, 0xff9a3d, 0.26); pool(nad, NNA, 0xa5d8ff, 0.24);
      // calvin
      var ring = mk(gK, new T.TorusGeometry(5, 0.07, 8, 80), 0xadb5bd); ring.rotation.x = 0;
      var cols = { rub: 0xb197fc, co2: 0x343a40, pga: 0xff922b, g3p: 0x51cf66 };
      for (var i = 0; i < 3; i++) { var a = cluster(5, cols.rub, 0.55); a.userData = { t: 'rub', i: i }; gK.add(a); kc.push(a); var c = cluster(1, cols.co2, 0); c.userData = { t: 'co2', i: i }; gK.add(c); kc.push(c); }
      for (i = 0; i < 6; i++) { var b = cluster(3, cols.pga, 0.38); b.userData = { t: 'pga', i: i }; gK.add(b); kc.push(b); var g = cluster(3, cols.g3p, 0.38); g.userData = { t: 'g3p', i: i }; gK.add(g); kc.push(g); }
      ['t', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var i = f.i, l = f.local; S.stage = i; S.mode = i === 0 ? 'chloro' : (i <= 3 ? 'memb' : 'calvin'); S.q = i === 4 ? sm(l) * 0.66 : (i === 5 ? 0.66 + 0.34 * sm(l) : sm(l)); S.inh = 'n'; }
      else if (S.run) { S.q += dt / 7; if (S.q >= 1) { S.q = 1; S.run = false; } }
      var mode = S.mode, st = S.stage, q = S.q, I = S.I, rr = rate(I, S.co2), inh = S.inh;
      gC.visible = mode === 'chloro'; gM.visible = mode === 'memb'; gK.visible = mode === 'calvin';
      lab.t.vis(false); ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function (k) { lab[k].vis(false); });
      if (mode === 'chloro') {
        gC.rotation.y = now * 0.18; gC.updateMatrixWorld(true);
        function wpos(x, y, z) { return gC.localToWorld(V(x, y, z)); }
        var p;
        p = wpos(-4.5, 1.8, 0); lab.a.pos(p.x, p.y, p.z).set("grana (thylakoid stacks)", 'bl-d').vis(true);
        p = wpos(0, 3.2, 1.8); lab.b.pos(p.x, p.y, p.z).set("stroma · Calvin cycle", 'bl-pos').vis(true);
        p = wpos(8.6, 0, 0); lab.c.pos(p.x, p.y, p.z).set("outer and inner membranes", 'bl-d').vis(true);
        p = wpos(-1.6, -2, 1); lab.d.pos(p.x, p.y, p.z).set("lumen / thylakoid membrane: light reactions", 'bl-warn').vis(true);
        lab.t.pos(0, 6.6, 0).set('Cloroplasto', 'bl-lead').vis(true);
      } else if (mode === 'memb') {
        var split = st >= 1 || P.manual, etc = (st >= 2 || P.manual) && inh !== 'dcmu', pump = st >= 2 || P.manual, syn = (st >= 3 || P.manual), act = inh === 'dcmu' ? 0 : 1;
        var gr = inh === 'dcmu' ? 0 : (inh === 'dnp' ? 0.12 : (st === 1 ? 0.12 * q : (st === 2 ? sm(q) : (st === 3 ? 1 - 0.2 * Math.sin(q * 3) : q)))) * (P.manual ? 1 : 1);
        if (P.manual && inh === 'n') gr = Math.min(1, q * 1.2) * Math.min(1, I * 1.4);
        var phOn = ctx.layer('ph'), eOn = ctx.layer('e'), hOn = ctx.layer('h'), pOn = ctx.layer('p');
        ph.forEach(function (m, k) { var u = ((now * 0.5 + k / NPH) % 1), tgtX = k % 2 ? X.psI : X.psII, sx = tgtX - 4, p0 = V(sx, 7, 0), p1 = V(tgtX, 0.9, 0); m.visible = phOn && I > 0.02 && k < Math.ceil(NPH * Math.max(0.15, I)) && (st >= 1 || P.manual) && !(k % 2 && st < 2 && !P.manual); m.position.lerpVectors(p0, p1, u); m.scale.setScalar(0.28 * (1 - 0.6 * u * u)); });
        var pathE = [V(X.psII, 0.2, 0), V(X.psII + 2, -1.1, 0.2), V(X.b6f, -0.4, 0), V(X.b6f + 2.2, -1.5, 0.3), V(X.psI, -0.2, 0), V(X.psI + 1.2, 1.2, 0), V(X.fnr, 1.3, 0)];
        el.forEach(function (m, k) { var u = ((now * 0.22 * (0.3 + rr) + k / NEL) % 1) * (pathE.length - 1), j = Math.min(pathE.length - 2, Math.floor(u)), t = u - j; m.position.lerpVectors(pathE[j], pathE[j + 1], t); m.visible = eOn && etc && inh !== 'dcmu' && I > 0.02; });
        var nH = Math.round(NHP * (inh === 'dcmu' ? 0 : (inh === 'dnp' ? 0.1 : gr))); 
        hp.forEach(function (m, k) { var on = k < nH; var sd = (k * 12.9898) % 1, sd2 = (k * 78.233) % 1, sd3 = (k * 37.719) % 1; m.visible = hOn && on; m.position.set(-8 + 16 * Math.abs(Math.sin(k * 1.7)), -0.6 - 2.6 * Math.abs(Math.sin(k * 2.3)) - 0.15 * Math.sin(now * 2 + k), -2.4 + 4.8 * Math.abs(Math.sin(k * 3.1)) + 0.12 * Math.cos(now * 2 + k)); });
        var acid = nH / NHP; lumen.material.color.setRGB(0.45 + 0.5 * acid, 0.75 - 0.35 * acid, 1 - 0.5 * acid);
        o2.forEach(function (m, k) { var u = ((now * 0.3 + k / NO2) % 1); m.visible = split && etc && inh !== 'dcmu' && I > 0.02 && k < 3; m.position.set(X.psII - 0.4 - 2.5 * u, -1.5 - 2 * u + 4 * u * u, 0.8 * Math.sin(k)); });
        var rotSpeed = (inh === 'dcmu' || inh === 'dnp') ? 0 : (syn ? 4 * Math.max(0.1, gr) : 0); rot.rotation.y += rotSpeed * (ctx.dt || 0.016);
        var nA = Math.round(NAT * (syn && inh === 'n' ? (st === 3 ? sm(q) : (P.manual ? Math.min(1, q) : 1)) * Math.min(1, 0.3 + rr) : 0));
        atp.forEach(function (m, k) { m.visible = pOn && k < nA; var u = ((now * 0.4 + k / NAT) % 1); m.position.set(X.atp + 0.8 + 1.4 * Math.sin(k * 2.2) * u, 2.2 + 1.8 * u + 0.1 * k * 0.1, 1.2 * Math.cos(k * 1.9)); });
        var nN = Math.round(NNA * (st >= 3 || P.manual ? (st === 3 ? sm(q) : Math.min(1, q)) : 0) * (inh === 'dcmu' ? 0 : 1));
        nad.forEach(function (m, k) { m.visible = pOn && k < nN; var u = ((now * 0.35 + k / NNA) % 1); m.position.set(X.fnr + 0.6 + 1.0 * Math.sin(k * 1.4) * u, 1.9 + 1.8 * u, 1.3 * Math.cos(k * 2.5)); });
        lab.a.pos(X.psII, 2.6, 0).set('PSII (P680)', 'bl-pos').vis(true); lab.b.pos(X.b6f, 2.6, 0).set("cytochrome b₆f", 'bl-warn').vis(true); lab.c.pos(X.psI, 2.6, 0).set('PSI (P700)', 'bl-pos').vis(true);
        lab.d.pos(X.atp, 3.0, 0).set("ATP synthase", 'bl-d').vis(true); lab.e.pos(-9, 2.4, 0).set("STROMA (pH ≈ 8)", 'bl-d').vis(true); lab.f.pos(-9, -3.4, 0).set('LUMEN (pH ≈ ' + f1(7.5 - 3.2 * acid) + ')', 'bl-warn').vis(true);
        lab.g.pos(X.fnr, 3.4, 0).set('NADP⁺ → NADPH', 'bl-d').vis(nN > 0);
        lab.h.pos(X.psII - 3, -4.3, 0).set('2 H₂O → O₂ + 4 H⁺ + 4 e⁻', 'bl-d').vis(split);
        lab.t.pos(0, 6.6, 0).set(inh === 'dcmu' ? "DCMU inhibitor: PSII blocked" : (inh === 'dnp' ? "Uncoupler: no gradient, no ATP" : "Thylakoid membrane"), inh === 'n' ? 'bl-lead' : 'bl-warn').vis(true);
      } else {
        var cq = q, phase = cq < 0.34 ? 0 : (cq < 0.66 ? 1 : 2), R = 5, pos = function (ang, rr2) { return V(Math.cos(ang) * (rr2 || R), Math.sin(ang) * (rr2 || R), 0); };
        var cnt = { rub: 0, pga: 0, g3p: 0, co2: 0 }; kc.forEach(function (c) { c.visible = false; });
        var a1 = Math.PI * 0.5, a2 = a1 + Math.PI * 2 / 3, a3 = a2 + Math.PI * 2 / 3;
        kc.forEach(function (c) {
          var d = c.userData, i2 = d.i, vis = false, p;
          if (d.t === 'rub') { // 3 RuBP: salen de estación 3 a estación 1; consumidos en fijación; regenerados al final
            if (cq < 0.34) { vis = true; p = pos(a1 + 0.35 - (i2 - 1) * 0.28, R); } else if (cq >= 0.66) { vis = cq > 0.66 + 0.1 * i2; p = pos(a3 + (1 - Math.min(1, (cq - 0.66) / 0.34)) * (a1 - a3) * 0 + (i2 - 1) * 0.28, R); if (cq > 0.9) p = pos(a1 + 0.35 - (i2 - 1) * 0.28, R); }
          } else if (d.t === 'co2') { if (cq < 0.34) { vis = true; var u = sm(cq / 0.34); p = pos(a1 - 0.7, R + 3 * (1 - u)).add(V(-0.3, (i2 - 1) * 0.6, 0)); } }
          else if (d.t === 'pga') { if (cq >= 0.17 && cq < 0.5) { vis = true; var u2 = sm((cq - 0.17) / 0.33); p = pos(a1 - 0.5 - u2 * (Math.PI * 2 / 3 - 0.5) - (i2 - 2.5) * 0.12, R); } else if (cq >= 0.5 && cq < 0.5 + 0.02) vis = false; }
          else if (d.t === 'g3p') { if (cq >= 0.45 && cq < 0.66) { vis = true; var u3 = sm((cq - 0.45) / 0.21); p = pos(a2 + (i2 - 2.5) * 0.12 + 0.1 - u3 * 0.1, R); p.add(V(0, 0, 0)); } else if (cq >= 0.66) { vis = true; if (i2 === 0) { var u4 = sm((cq - 0.66) / 0.34); p = pos(a2 + 0.2 + u4 * 1.2, R + u4 * 3); } else { var u5 = sm(Math.min(1, (cq - 0.66) / 0.28)); p = pos(a2 + 0.1 + u5 * (a3 - a2 - 0.2), R); p.add(V(0, 0, (i2 - 3) * 0.0)); if (cq > 0.94) vis = false; } } }
          if (vis && p) { c.visible = true; c.position.copy(p); c.rotation.z = now * 0.5; cnt[d.t]++; }
        });
        lab.a.pos(0, 7.2, 0).set("Calvin cycle (stroma)", 'bl-lead').vis(true);
        lab.b.pos(0, 5.8, 0).set(phase === 0 ? "① FIXATION: 3 RuBP + 3 CO₂ → 6 PGA (RuBisCO)" : (phase === 1 ? "② REDUCTION: 6 PGA + 6 ATP + 6 NADPH → 6 G3P" : "③ REGENERATION: 5 G3P + 3 ATP → 3 RuBP · 1 G3P leaves"), 'bl-pos').vis(true);
        lab.c.pos(pos(a1, 6.4).x, pos(a1, 6.4).y, 0).set('fijación', 'bl-d').vis(false); 
        lab.d.pos(0, -6.2, 0).set("C: RuBP 5C (violet) · CO₂ (black) · 3-PGA 3C (orange) · G3P 3C (green)", 'bl-d').vis(true);
        lab.e.pos(0, 0, 0).set('Calvin\n' + (phase === 0 ? '6 C × 3 → 2 × 3 C' : ''), 'bl-d').vis(false);
        lab.f.pos(pos(a2 + 0.2, 6.9).x, pos(a2 + 0.2, 6.9).y, 0).set("1 G3P → glucose", 'bl-pos').vis(cq > 0.7);
        lab.g.pos(0, 0.3, 0).set(f1(3) + " ATP + 2 NADPH per CO₂", 'bl-warn').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.mode) u.mode.set(S.mode); if (u.inh) u.inh.set(S.inh); if (!ctx.P.manual && u.q) u.q.set(S.q); },
    hud: function () { var rr = rate(S.I, S.co2), inh = S.inh; var atpR = inh === 'n' ? rr : 0; return { eq: { chip: 'hν', name: '6 CO₂ + 12 H₂O → C₆H₁₂O₆ + 6 O₂ + 6 H₂O', body: "<div class=\"eqline\"><small>Phase</small>" + (S.mode === 'calvin' ? "Calvin cycle" : (S.mode === 'memb' ? "light reactions" : 'cloroplasto')) + "</div><div class=\"eqline\"><small>Relative rate</small>" + fmt(Math.min(1, rr) * (inh === 'dcmu' ? 0 : 1) * 100, 0) + " %</div><div class=\"eqline\"><small>Per CO₂ fixed</small>3 ATP + 2 NADPH</div>" }, legend: [{ label: "Yellow", color: '#ffe066', text: "photon" }, { label: "Light", color: '#fff3bf', text: "electron" }, { label: "Red", color: '#ff6b6b', text: 'H⁺' }, { label: "Orange", color: '#ff9a3d', text: 'ATP' }] }; },
    measures: function () { var rr = rate(S.I, S.co2), inh = S.inh, k = inh === 'dcmu' ? 0 : 1; return [["Light intensity", fmt(S.I * 100, 0) + ' %'], ["Available CO₂", fmt(S.co2 * 100, 0) + ' %'], ["Relative rate", fmt(Math.min(1, rr) * k * 100, 0) + ' %'], ["Treatment", inh === 'n' ? "none" : (inh === 'dcmu' ? "DCMU (blocks PSII)" : "uncoupler (DNP)")], ["ATP per glucose", '18'], ["NADPH per glucose", '12'], ["Minimum photons per glucose", '≈ 48']]; },
    ideas: ["Light: PSII → b₆f → PSI → NADPH; water photolysis releases O₂.", "H⁺ gradient → ATP synthase → ATP.", "Calvin: RuBisCO fixes CO₂; 3 ATP + 2 NADPH per CO₂.", "Of 6 G3P, 1 is net product and 5 regenerate RuBP.", "DCMU blocks PSII; uncouplers dissipate the gradient."],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Scene"); el2.appendChild(c);
      ui.mode = kit.ui.options({ label: "Show", cols: 3, value: S.mode, options: [{ v: 'chloro', label: "Chloroplast" }, { v: 'memb', label: "Light phase" }, { v: 'calvin', label: 'Calvin' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.stage = v === 'memb' ? 3 : (v === 'calvin' ? 4 : 0); S.q = v === 'calvin' ? 0 : 1; } }); c.appendChild(ui.mode);
      ui.inh = kit.ui.options({ label: "Treatment", cols: 3, value: S.inh, options: [{ v: 'n', label: 'Normal' }, { v: 'dcmu', label: 'DCMU', sub: "blocks PSII" }, { v: 'dnp', label: 'DNP', sub: "uncoupler" }], onChange: function (v) { ctx.goManual(); S.inh = v; if (S.mode !== 'memb') { S.mode = 'memb'; S.stage = 3; } S.q = 1; } }); c.appendChild(ui.inh);
      ui.I = kit.ui.slider({ label: "Light intensity", min: 0, max: 1, step: 0.01, value: S.I, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.I = v; } });
      ui.co2 = kit.ui.slider({ label: "CO₂ concentration", min: 0, max: 1, step: 0.01, value: S.co2, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.co2 = v; } });
      ui.q = kit.ui.slider({ label: "Process progress", min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.q = v; } }); c.appendChild(kit.ui.sliders([ui.I, ui.co2, ui.q]));
      c.appendChild(ctx.btnRow([{ t: "▶ Animate", primary: true, fn: function () { ctx.goManual(); S.q = 0; S.run = true; if (S.mode === 'chloro') { S.mode = 'memb'; S.stage = 3; } } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Pigment absorption spectrum", h: 220, note: "Chlorophylls absorb blue and red and reflect green; carotenoids broaden the range.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (n) { return L + pw * (n - 400) / 300; }, sy = function (v) { return Tp + ph - ph * v; }, g = function (x, m, s, a) { return a * Math.exp(-Math.pow((x - m) / s, 2)); }, i, n;
        var bands = [[400, 440, '#7048e8'], [440, 490, '#1c7ed6'], [490, 560, '#2f9e44'], [560, 590, '#fcc419'], [590, 620, '#fd7e14'], [620, 700, '#e03131']]; bands.forEach(function (b) { cx.fillStyle = b[2]; cx.globalAlpha = 0.15; cx.fillRect(sx(b[0]), Tp, sx(b[1]) - sx(b[0]), ph); }); cx.globalAlpha = 1;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (n = 400; n <= 700; n += 50) cx.fillText(n, sx(n), h - B + 13); cx.fillText("wavelength (nm)   ·   relative absorbance", L + pw / 2, h - 4);
        [["chlorophyll a", '#2f9e44', function (x) { return g(x, 430, 22, 0.9) + g(x, 662, 18, 0.75) + 0.04; }], ["chlorophyll b", '#74c0fc', function (x) { return g(x, 455, 22, 0.8) + g(x, 642, 16, 0.55) + 0.04; }], ["carotenoids", '#ff922b', function (x) { return g(x, 450, 28, 0.7) + g(x, 485, 22, 0.55); }]].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 120; i++) { var x = 400 + 300 * i / 120, y = Math.min(1, a[2](x)); if (i) cx.lineTo(sx(x), sy(y)); else cx.moveTo(sx(x), sy(y)); } cx.stroke(); }); cx.lineWidth = 1;
        cx.textAlign = 'left'; [['Chl a', '#2f9e44'], ['Chl b', '#74c0fc'], ["carotenoids", '#ff922b']].forEach(function (a, k) { cx.fillStyle = a[1]; cx.fillText('● ' + a[0], L + 6 + k * 68, Tp + 10); });
      } },
      { title: "Z scheme (redox potential)", h: 230, note: "Each photon raises an electron; the subsequent fall pumps H⁺ and reduces NADP⁺.", draw: function (cx, w, h, col) {
        var Tp = 14, B = 14, ph = h - Tp - B, sy = function (e) { return Tp + ph * (1.4 - e) / 2.6; }, pts = [['H₂O', 0.82, 0.07], ['P680', 1.0, 0.2], ['P680*', -0.6, 0.31], ['PQ', 0.0, 0.43], ['b₆f', 0.1, 0.55], ['PC', 0.37, 0.67], ['P700', 0.45, 0.76], ['P700*', -1.2, 0.84], ['Fd', -0.43, 0.91], ['NADP⁺', -0.32, 0.98]], i;
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = -1; i <= 1; i++) { var y = sy(i); cx.beginPath(); cx.moveTo(36, y); cx.lineTo(w - 6, y); cx.stroke(); cx.fillText(i + ' V', 32, y + 3); }
        var X2 = function (u) { return 44 + (w - 60) * u; }; cx.strokeStyle = '#51cf66'; cx.lineWidth = 2.4; cx.beginPath(); pts.forEach(function (p, k) { var x = X2(p[2]), y = sy(p[1]); if (k) cx.lineTo(x, y); else cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
        pts.forEach(function (p) { cx.fillStyle = '#ffe066'; cx.beginPath(); cx.arc(X2(p[2]), sy(p[1]), 3.5, 0, 7); cx.fill(); cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(p[0], X2(p[2]), sy(p[1]) - 7); });
        cx.fillStyle = '#ffe066'; cx.textAlign = 'left'; cx.fillText('↑ hν', X2(0.25), sy(0.3)); cx.fillText('↑ hν', X2(0.8), sy(-0.4));
      } },
      { title: "Light response curve", h: 210, note: "Relative rate = f(light, CO₂). At high light CO₂ is limiting.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (v) { return L + pw * v; }, sy = function (v) { return Tp + ph - ph * v / 1.05; }, i, k = S.inh === 'dcmu' ? 0 : 1;
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var y = sy(i * 0.25); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(i * 25, 0) + ' %', L - 5, y + 3); } cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i * 25, 0) + ' %', sx(i / 4), h - B + 13); cx.fillText("light intensity", L + pw / 2, h - 4);
        [[0.2, '#adb5bd'], [0.5, '#74c0fc'], [1, '#51cf66']].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = 1.8; cx.beginPath(); for (i = 0; i <= 60; i++) { var I2 = i / 60, v = Math.min(1, rate(I2, a[0])); if (i) cx.lineTo(sx(I2), sy(v)); else cx.moveTo(sx(I2), sy(v)); } cx.stroke(); cx.fillStyle = a[1]; cx.textAlign = 'left'; cx.fillText('CO₂ ' + fmt(a[0] * 100, 0) + ' %', sx(0.72), sy(Math.min(1, rate(0.9, a[0]))) - 5); });
        cx.lineWidth = 1; cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.I), sy(Math.min(1, rate(S.I, S.co2)) * k), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, rr = Math.min(1, rate(S.I, S.co2));
      return "<div class=\"card-kicker\">Photosynthesis: balance</div><div class=\"calc-step\">1 · Per CO₂ fixed</div><table class=\"calc-table\">" + row('ATP', "3 (2 in reduction + 1 in regeneration)") + row('NADPH', "2 (in the reduction of 3-PGA to G3P)") + "</table><div class=\"calc-step\">2 · Per glucose (6 CO₂)</div><table class=\"calc-table\">" + row('ATP', '6 × 3 = <b>18</b>') + row('NADPH', '6 × 2 = <b>12</b>') + row("Electrons", "12 NADPH × 2 e⁻ = 24 e⁻ → 24 × (1 photon by PSII + 1 by PSI)/2 = <b>48 photons</b> (theoretical minimum)") + row("Energy of glucose", "≈ 2,870 kJ/mol") + row("Energy of 48 photons (680 nm)", "48 × 176 kJ/mol = 8,450 kJ") + row("Theoretical max. efficiency", '≈ 34 %') + "</table><p class=\"muted small\">Current relative rate: " + fmt(rr * (S.inh === 'dcmu' ? 0 : 1) * 100, 0) + " % (light " + fmt(S.I * 100, 0) + ' %, CO₂ ' + fmt(S.co2 * 100, 0) + ' %).</p>';
    },
    quiz: [
      { q: "Where does the O₂ released in photosynthesis come from?", options: ["From water", "From CO₂", "From glucose", "From the air of the stroma"], answer: 0, why: "Water photolysis in PSII releases O₂." },
      { q: "The light reactions occur in…", options: ["the thylakoid membrane", "the stroma", "the outer membrane", "the cytosol"], answer: 0, why: "The Calvin cycle occurs in the stroma." },
      { q: "ATP synthase uses…", options: ["the H⁺ gradient between lumen and stroma", "light directly", 'NADPH', 'CO₂'], answer: 0, why: "Proton-motive force: the H⁺ leave the lumen into the stroma." },
      { q: "Which enzyme fixes CO₂ in the Calvin cycle?", options: ['RuBisCO', "ATP synthase", 'Catalasa', 'FNR'], answer: 0, why: "Ribulose-1,5-bisphosphate carboxylase/oxygenase." },
      { q: "For each CO₂ fixed, the following are consumed…", options: ["3 ATP and 2 NADPH", "2 ATP and 3 NADPH", "1 ATP and 1 NADPH", "6 ATP and 6 NADPH"], answer: 0, why: "2 ATP + 2 NADPH in the reduction and 1 ATP in the regeneration." },
      { q: "DCMU inhibits…", options: ["the flow from PSII", "RuBisCO", "ATP synthase", "water photolysis only"], answer: 0, why: "It blocks the plastoquinone site in PSII." },
      { q: "Of 6 G3P produced by 3 turns of the cycle…", options: ["1 is net product and 5 regenerate RuBP", "6 leave", "3 leave", "none leaves"], answer: 0, why: "Carbon balance: 5 × 3 C = 15 C = 3 RuBP." },
      { q: "Chlorophylls mainly reflect…", options: ["green", "red", "blue", "ultraviolet"], answer: 0, why: "They absorb blue and red." }
    ],
    help: { intro: "Choose the scene (chloroplast, light phase or Calvin), adjust light and CO₂ and try the DCMU and DNP inhibitors to see their effects.", items: [["Layers", "photons, electrons, protons and ATP/NADPH."], ['DCMU', "blocks PSII: no e⁻, no gradient."], ['DNP', "dissipates the gradient: no ATP."]] }
  };
  MSim.create(def);
})();
