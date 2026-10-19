/* Análisis gravimétrico — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var AN = { cl: { n: "Chloride (Cl⁻)", a: 'Cl⁻', p: "AgCl", pm: 143.32, am: 35.45, k: 1, r: 'AgNO₃', c: 0xf1f3f5 }, so4: { n: "Sulfate (SO₄²⁻)", a: 'SO₄²⁻', p: "BaSO₄", pm: 233.39, am: 96.06, k: 1, r: 'BaCl₂', c: 0xe9ecef }, fe: { n: "Iron (Fe)", a: 'Fe', p: 'Fe₂O₃', pm: 159.69, am: 55.845, k: 2, r: "NH₃ → Fe(OH)₃ → calcine", c: 0xc2410c }, ni: { n: "Nickel (Ni²⁺)", a: 'Ni', p: 'Ni(DMG)₂', pm: 288.91, am: 58.69, k: 1, r: 'dimetilglioxima', c: 0xf03e3e } };
  var S = { an: 'cl', ms: 1.0, pct: 25, ex: 120, co: 0, hum: 0, f: 0, dig: 0, dry: 0 }, g = null, ions = [], ppt = [], lab = [], liq = null, cr = null;
  function A() { return AN[S.an]; }
  function GF() { var a = A(); return a.k * a.am / a.pm; }
  function complete() { return Math.min(1, S.ex / 100) * (S.ex >= 100 ? 0.999 : 1); }
  function mpTrue() { return S.ms * S.pct / 100 / GF(); }
  function mpMeas() { return mpTrue() * complete() * (1 + S.co / 100) * (1 + S.hum / 100); }
  function pctCalc() { return mpMeas() * GF() / S.ms * 100; }
  function stages() {
    return [
      ["Precipitation", "Precipitate", "An excess of reagent is added to precipitate all of the analyte",
        "<p>In <b>gravimetric analysis</b> the analyte is converted into an <b>insoluble, pure precipitate of definite composition</b>, which is weighed. Add the precipitating reagent: with an <b>excess</b> (≈ 100–150 %) precipitation is nearly complete; with too little, analyte remains in solution and the result comes out low.</p>"],
      ["Digestion and filtration", "Digestion", "Digestion grows the crystals and reduces coprecipitation",
        "<p>The precipitate is heated in its mother liquor (<b>digestion</b>): small crystals dissolve and recrystallize into larger ones that are purer and easier to filter. It is <b>filtered and washed</b> to remove impurities. <b>Coprecipitation</b> of other ions increases the mass and gives a high result.</p>"],
      ["Drying and ignition", "Drying", "Weigh to constant mass",
        "<p>The precipitate is <b>dried or calcined</b> in a crucible to <b>constant mass</b> (two successive weighings differing by less than 0.3 mg). If <b>moisture</b> remains, the mass overestimates the analyte. Some precipitates must be calcined to reach a stable form (Fe(OH)₃ → Fe₂O₃).</p>"],
      ["Calculation with the gravimetric factor", "Calculation", "% analyte = m(precipitate) · GF / m(sample) × 100",
        "<p>The <b>gravimetric factor</b> converts the mass of the precipitate into mass of analyte: <b>GF = (a · M<sub>analyte</sub>) / M<sub>precipitate</sub></b>, where <i>a</i> is the number of analyte atoms per formula of the precipitate. Then <b>% = m<sub>pp</sub> · GF / m<sub>sample</sub> × 100</b>. Compare the value obtained with the true one and discuss the errors.</p>"]
    ];
  }
  var def = {
    key: 'gravimetria', title: "Gravimetric analysis", subtitle: "3D Simulator · general chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [14, 8, 20], target: [14, 2, 0] }, { id: 'frontal', label: "Front", pos: [14, 3, 24], target: [14, 2, 0] }],
    layers: [{ id: 'ions', label: "Ions", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(14, 0, 0); ctx.scene.add(g); var i;
      var bk = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 7, 28, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.2, side: T.DoubleSide })); bk.position.set(-5, 3.5, 0); g.add(bk);
      liq = new T.Mesh(new T.CylinderGeometry(3.1, 3.1, 5, 28), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.45 })); liq.position.set(-5, 2.6, 0); g.add(liq);
      for (i = 0; i < 70; i++) { var a = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), new T.MeshStandardMaterial({ color: 0x1971c2 })); g.add(a); ions.push(a); var p = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); g.add(p); ppt.push(p); }
      cr = new T.Mesh(new T.CylinderGeometry(1.5, 1, 1.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xdee2e6, side: T.DoubleSide })); cr.position.set(5, 1.7, 0); g.add(cr);
      var bal = new T.Mesh(new T.BoxGeometry(5, 0.8, 4), new T.MeshStandardMaterial({ color: 0x495057 })); bal.position.set(5, 0.4, 0); g.add(bal);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.f = f.local * 1.5; S.dig = 0; S.dry = 0; S.co = 1; S.hum = 3; S.ex = 120; } if (i === 1) { S.f = 1.5; S.dig = f.local; S.dry = 0; } if (i === 2) { S.f = 1.5; S.dig = 1; S.dry = f.local; S.hum = 3 * (1 - f.local); } if (i === 3) { S.f = 1.5; S.dig = 1; S.dry = 1; S.hum = 0; } } else { S.f = 1.5; S.dig = 1; S.dry = 1; }
      var cp = Math.min(1, S.f / (S.ex / 100 >= 1 ? 1 : 1)) * complete(), on = ctx.layer('ions'), n = 70, nP = Math.round(n * Math.min(1, cp)), nI = n - Math.round(n * Math.min(1, cp * 0.95)), th = ctx.now;
      ions.forEach(function (m, j) { m.visible = on && j < nI; var a = j * 2.4 + th * 0.3, r = 0.4 + (j % 9) * 0.3; m.position.set(-5 + Math.cos(a) * r, 0.8 + (j * 0.07) % 3.6, Math.sin(a) * r); });
      var sz = 0.5 + S.dig * 0.9, moved = S.dry;
      ppt.forEach(function (m, j) { m.visible = j < nP; var a = j * 2.4, r = 0.3 + (j % 7) * 0.35, sx = -5 + Math.cos(a) * r, sy = 0.35 + (j % 5) * 0.25 * (1 - moved) + (j % 3) * 0.05, sz2 = Math.sin(a) * r; var tx = 5 + Math.cos(a) * r * 0.4, ty = 1.2 + (j % 5) * 0.1 * moved; m.position.set(sx + (tx - sx) * moved, sy + (ty - sy) * moved, sz2 * (1 - moved) + Math.sin(a) * r * 0.4 * moved); m.scale.setScalar(sz * (1 - 0.2 * moved)); m.material.color.setHex(S.dig > 0.5 ? 0xfff9db : 0xf1f3f5); if (A().c) m.material.color.setHex(A().c); });
      liq.visible = moved < 0.5; lab[0].pos(9, 7.6, 0).set(i < 2 || P.manual ? A().r + " · excess " + S.ex + ' %' : '', 'bl-lead').vis(true);
      lab[1].pos(9, 6, 0).set(A().p + ': ' + fmt(mpMeas() * (0.4 + 0.6 * Math.min(1, cp)), 3) + ' g', 'bl-pos').vis(moved > 0.3 || P.manual);
      lab[2].pos(19, 3.2, 0).set("Balance: " + fmt(mpMeas() * moved, 4) + ' g', 'bl-d').vis(true);
      lab[3].pos(9, -1, 0).set("GF = " + fmt(GF(), 4), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['an', 'ms', 'pct', 'ex', 'co', 'hum'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'FG', name: "Result", body: "<div class=\"eqline\"><small>m precipitate</small>" + fmt(mpMeas(), 4) + " g</div><div class=\"eqline\"><small>% obtained</small>" + fmt(pctCalc(), 2) + " %</div><div class=\"eqline\"><small>% true</small>" + fmt(S.pct, 2) + " %</div><div class=\"eqline\"><small>Relative error</small>" + fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %</div>' }, legend: [{ label: "Blue dots", color: '#1971c2', text: "analyte in solution" }, { label: "Light spheres", color: '#f1f3f5', text: "precipitate" }] }; },
    measures: function () { return [['Analito', A().a], ['Precipitado', A().p], ["Gravimetric factor", fmt(GF(), 4)], ["m precipitate", fmt(mpMeas(), 4) + ' g'], ["% obtained", fmt(pctCalc(), 2) + ' %'], ['Error', fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %']]; },
    ideas: ["GF = a·M(analyte)/M(precipitate).", "Excess reagent: complete precipitation.", "Coprecipitation → high result.", "Weigh to constant mass."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Sample and reagent"); el.appendChild(c);
      ui.an = kit.ui.options({ label: 'Analito', cols: 2, value: S.an, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].a, sub: '→ ' + AN[k].p }; }), onChange: function (v) { ctx.goManual(); S.an = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.an); c.appendChild(kit.ui.sliders([sl('ms', "Sample mass", 0.2, 2, 0.05, function (v) { return fmt(v, 2) + ' g'; }), sl('pct', "True % of analyte", 5, 60, 1, function (v) { return v + ' %'; }), sl('ex', "Reagent (% of stoichiometric)", 50, 150, 5, function (v) { return v + ' %'; }), sl('co', "Coprecipitation", 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; }), sl('hum', "Residual moisture", 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; })])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Mass of precipitate versus reagent added", h: 200, note: "Below 100 % the precipitation is incomplete.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = mpTrue() * 1.1; cx.strokeStyle = '#b197fc'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var ex = 50 + i, m = mpTrue() * Math.min(1, ex / 100) * (1 + S.co / 100) * (1 + S.hum / 100), x = L + pw * i / 100, y = Tp + ph * (1 - m / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ex - 50) / 100, Tp + ph * (1 - mpMeas() / mx), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('50 %', L, h - 8); cx.fillText('150 %', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('g', L - 4, Tp + 8);
    } }],
    calc: function () {
      var a = A(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">' + a.n + ' → ' + a.p + '</div><table class="calc-table">' + row('FG', a.k + ' × ' + fmt(a.am, 2) + ' / ' + fmt(a.pm, 2) + ' = <b>' + fmt(GF(), 4) + '</b>') + row("m analyte", fmt(S.ms, 2) + ' g × ' + fmt(S.pct, 0) + ' % = ' + fmt(S.ms * S.pct / 100, 4) + ' g') + row("m precipitate (ideal)", fmt(mpTrue(), 4) + ' g') + row("m precipitate (measured)", '<b>' + fmt(mpMeas(), 4) + ' g</b>') + row("% obtained", fmt(mpMeas(), 4) + ' × ' + fmt(GF(), 4) + ' / ' + fmt(S.ms, 2) + ' × 100 = <b>' + fmt(pctCalc(), 2) + ' %</b>') + '</table>';
    },
    quiz: [
      { q: "The gravimetric factor for Cl⁻ weighed as AgCl is…", options: ['0,2474', '4,043', '0,5', '1'], answer: 0, why: '35,45/143,32.' },
      { q: "A coprecipitation of impurities produces a result that is…", options: ["high", "low", "exact", "indeterminate"], answer: 0, why: "It increases the mass weighed." },
      { q: "The precipitate is ignited until…", options: ["constant mass", "it changes color", "it melts", "constant volume"], answer: 0, why: "It removes water and volatiles." },
      { q: "If the precipitating reagent is scarce, the result is…", options: ["low", "high", "correct", "depends on the filter"], answer: 0, why: "Part of the analyte stays in solution." },
      { q: "The GF of Fe weighed as Fe₂O₃ (159.69 g/mol; Fe 55.845) is…", options: ['0,6994', '0,3497', '1,4297', '0,5'], answer: 0, why: '2 × 55,845 / 159,69.' },
      { q: "The digestion of the precipitate serves to…", options: ["obtain larger and purer crystals", "dissolve it", "increase the moisture", "reduce the GF"], answer: 0, why: "Ostwald ripening." }
    ],
    help: { intro: "Choose the analyte, the sample mass and the possible errors. The precipitate forms in the beaker and is transferred to the crucible on the balance.", items: [["Blue dots", "analyte still dissolved."], ["Light spheres", 'precipitado.']] }
  };
  MSim.create(def);
})();
