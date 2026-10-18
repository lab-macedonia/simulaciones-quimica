/* Análisis gravimétrico — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast('La lección controla la simulación'); if (def.onStage) def.onStage(kit.state.stage, ctx); };
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
    if (def.graphs) tabs.push({ id: 'graf', label: 'Gráficos', build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || 'Cálculo', build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: 'Desafío', build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card('Desafío'); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ('Preguntas de repaso (' + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || 'Simulador 3D', accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ('Visor 3D · ' + def.title),
      stages: STAGES, mainTabLabel: 'Guía', tabs: tabs, measuresTitle: 'Medidas en vivo', measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: 'Etiquetas', icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: 'Libre', pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
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
      help: def.help || { intro: 'Sigue la lección con el reproductor o explora libremente en la pestaña «Lab». Con «Volver a la lección» el guion retoma el control.', items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();


(function () {
  var T = THREE;
  var AN = { cl: { n: 'Cloruro (Cl⁻)', a: 'Cl⁻', p: 'AgCl', pm: 143.32, am: 35.45, k: 1, r: 'AgNO₃', c: 0xf1f3f5 }, so4: { n: 'Sulfato (SO₄²⁻)', a: 'SO₄²⁻', p: 'BaSO₄', pm: 233.39, am: 96.06, k: 1, r: 'BaCl₂', c: 0xe9ecef }, fe: { n: 'Hierro (Fe)', a: 'Fe', p: 'Fe₂O₃', pm: 159.69, am: 55.845, k: 2, r: 'NH₃ → Fe(OH)₃ → calcinar', c: 0xc2410c }, ni: { n: 'Níquel (Ni²⁺)', a: 'Ni', p: 'Ni(DMG)₂', pm: 288.91, am: 58.69, k: 1, r: 'dimetilglioxima', c: 0xf03e3e } };
  var S = { an: 'cl', ms: 1.0, pct: 25, ex: 120, co: 0, hum: 0, f: 0, dig: 0, dry: 0 }, g = null, ions = [], ppt = [], lab = [], liq = null, cr = null;
  function A() { return AN[S.an]; }
  function GF() { var a = A(); return a.k * a.am / a.pm; }
  function complete() { return Math.min(1, S.ex / 100) * (S.ex >= 100 ? 0.999 : 1); }
  function mpTrue() { return S.ms * S.pct / 100 / GF(); }
  function mpMeas() { return mpTrue() * complete() * (1 + S.co / 100) * (1 + S.hum / 100); }
  function pctCalc() { return mpMeas() * GF() / S.ms * 100; }
  function stages() {
    return [
      ['Precipitación', 'Precipitar', 'Se añade un exceso de reactivo para precipitar todo el analito',
        '<p>En el <b>análisis gravimétrico</b> el analito se transforma en un precipitado <b>insoluble, puro y de composición definida</b>, que se pesa. Añade el reactivo precipitante: con <b>exceso</b> (≈ 100–150 %) la precipitación es casi completa; con defecto queda analito en disolución y el resultado sale bajo.</p>'],
      ['Digestión y filtración', 'Digestión', 'La digestión crece los cristales y reduce la coprecipitación',
        '<p>Se calienta el precipitado en su disolución madre (<b>digestión</b>): los cristales pequeños se disuelven y recristalizan en otros mayores, más puros y fáciles de filtrar. Se <b>filtra y se lava</b> para eliminar impurezas. La <b>coprecipitación</b> de otros iones aumenta la masa y da un resultado alto.</p>'],
      ['Secado y calcinación', 'Secado', 'Se pesa hasta masa constante',
        '<p>El precipitado se <b>seca o calcina</b> en un crisol hasta <b>masa constante</b> (dos pesadas sucesivas que difieren menos de 0,3 mg). Si queda <b>humedad</b>, la masa sobreestima el analito. Algunos precipitados deben calcinarse para formar una forma estable (Fe(OH)₃ → Fe₂O₃).</p>'],
      ['Cálculo con el factor gravimétrico', 'Cálculo', '% analito = m(precipitado) · FG / m(muestra) × 100',
        '<p>El <b>factor gravimétrico</b> convierte la masa del precipitado en masa de analito: <b>FG = (a · M<sub>analito</sub>) / M<sub>precipitado</sub></b>, con <i>a</i> los átomos de analito por fórmula del precipitado. Luego <b>% = m<sub>pp</sub> · FG / m<sub>muestra</sub> × 100</b>. Compara el valor obtenido con el real y discute los errores.</p>']
    ];
  }
  var def = {
    key: 'gravimetria', title: 'Análisis gravimétrico', subtitle: 'Simulador 3D · química general', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [14, 8, 20], target: [14, 2, 0] }, { id: 'frontal', label: 'Frontal', pos: [14, 3, 24], target: [14, 2, 0] }],
    layers: [{ id: 'ions', label: 'Iones', icon: '•' }],
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
      liq.visible = moved < 0.5; lab[0].pos(9, 7.6, 0).set(i < 2 || P.manual ? A().r + ' · exceso ' + S.ex + ' %' : '', 'bl-lead').vis(true);
      lab[1].pos(9, 6, 0).set(A().p + ': ' + fmt(mpMeas() * (0.4 + 0.6 * Math.min(1, cp)), 3) + ' g', 'bl-pos').vis(moved > 0.3 || P.manual);
      lab[2].pos(19, 3.2, 0).set('Balanza: ' + fmt(mpMeas() * moved, 4) + ' g', 'bl-d').vis(true);
      lab[3].pos(9, -1, 0).set('FG = ' + fmt(GF(), 4), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['an', 'ms', 'pct', 'ex', 'co', 'hum'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'FG', name: 'Resultado', body: '<div class="eqline"><small>m precipitado</small>' + fmt(mpMeas(), 4) + ' g</div><div class="eqline"><small>% obtenido</small>' + fmt(pctCalc(), 2) + ' %</div><div class="eqline"><small>% real</small>' + fmt(S.pct, 2) + ' %</div><div class="eqline"><small>Error relativo</small>' + fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %</div>' }, legend: [{ label: 'Puntos azules', color: '#1971c2', text: 'analito en disolución' }, { label: 'Esferas claras', color: '#f1f3f5', text: 'precipitado' }] }; },
    measures: function () { return [['Analito', A().a], ['Precipitado', A().p], ['Factor gravimétrico', fmt(GF(), 4)], ['m precipitado', fmt(mpMeas(), 4) + ' g'], ['% obtenido', fmt(pctCalc(), 2) + ' %'], ['Error', fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %']]; },
    ideas: ['FG = a·M(analito)/M(precipitado).', 'Exceso de reactivo: precipitación completa.', 'Coprecipitación → resultado alto.', 'Pesar hasta masa constante.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra y reactivo'); el.appendChild(c);
      ui.an = kit.ui.options({ label: 'Analito', cols: 2, value: S.an, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].a, sub: '→ ' + AN[k].p }; }), onChange: function (v) { ctx.goManual(); S.an = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.an); c.appendChild(kit.ui.sliders([sl('ms', 'Masa de muestra', 0.2, 2, 0.05, function (v) { return fmt(v, 2) + ' g'; }), sl('pct', '% real de analito', 5, 60, 1, function (v) { return v + ' %'; }), sl('ex', 'Reactivo (% del estequiométrico)', 50, 150, 5, function (v) { return v + ' %'; }), sl('co', 'Coprecipitación', 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; }), sl('hum', 'Humedad residual', 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; })])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Masa de precipitado frente al reactivo añadido', h: 200, note: 'Con menos del 100 % la precipitación es incompleta.', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = mpTrue() * 1.1; cx.strokeStyle = '#b197fc'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var ex = 50 + i, m = mpTrue() * Math.min(1, ex / 100) * (1 + S.co / 100) * (1 + S.hum / 100), x = L + pw * i / 100, y = Tp + ph * (1 - m / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ex - 50) / 100, Tp + ph * (1 - mpMeas() / mx), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('50 %', L, h - 8); cx.fillText('150 %', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('g', L - 4, Tp + 8);
    } }],
    calc: function () {
      var a = A(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">' + a.n + ' → ' + a.p + '</div><table class="calc-table">' + row('FG', a.k + ' × ' + fmt(a.am, 2) + ' / ' + fmt(a.pm, 2) + ' = <b>' + fmt(GF(), 4) + '</b>') + row('m analito', fmt(S.ms, 2) + ' g × ' + fmt(S.pct, 0) + ' % = ' + fmt(S.ms * S.pct / 100, 4) + ' g') + row('m precipitado (ideal)', fmt(mpTrue(), 4) + ' g') + row('m precipitado (medida)', '<b>' + fmt(mpMeas(), 4) + ' g</b>') + row('% obtenido', fmt(mpMeas(), 4) + ' × ' + fmt(GF(), 4) + ' / ' + fmt(S.ms, 2) + ' × 100 = <b>' + fmt(pctCalc(), 2) + ' %</b>') + '</table>';
    },
    quiz: [
      { q: 'El factor gravimétrico para Cl⁻ pesado como AgCl es…', options: ['0,2474', '4,043', '0,5', '1'], answer: 0, why: '35,45/143,32.' },
      { q: 'Una coprecipitación de impurezas produce un resultado…', options: ['alto', 'bajo', 'exacto', 'indeterminado'], answer: 0, why: 'Aumenta la masa pesada.' },
      { q: 'Se calcina el precipitado hasta…', options: ['masa constante', 'que cambie de color', 'que se funda', 'volumen constante'], answer: 0, why: 'Elimina agua y volátiles.' },
      { q: 'Si el reactivo precipitante es escaso, el resultado es…', options: ['bajo', 'alto', 'correcto', 'depende del filtro'], answer: 0, why: 'Parte del analito queda en disolución.' },
      { q: 'El FG de Fe pesado como Fe₂O₃ (159,69 g/mol; Fe 55,845) es…', options: ['0,6994', '0,3497', '1,4297', '0,5'], answer: 0, why: '2 × 55,845 / 159,69.' },
      { q: 'La digestión del precipitado sirve para…', options: ['obtener cristales mayores y más puros', 'disolverlo', 'aumentar la humedad', 'reducir el FG'], answer: 0, why: 'Recristalización de Ostwald.' }
    ],
    help: { intro: 'Elige el analito, la masa de muestra y los errores posibles. El precipitado se forma en el vaso y se traslada al crisol sobre la balanza.', items: [['Puntos azules', 'analito aún disuelto.'], ['Esferas claras', 'precipitado.']] }
  };
  MSim.create(def);
})();
