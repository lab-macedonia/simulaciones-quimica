/* El mol y la masa molar — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, NA = 6.02214076e23, VM = 22.414;
  var AM = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Cl: 35.45, Fe: 55.845, Ca: 40.078 };
  var SUB = {
    h2o: { n: 'Agua', f: 'H₂O', at: [['O', 1], ['H', 2]], g: { a: [['O', 0, 0, 0], ['H', 1.5, -1.1, 0], ['H', -1.5, -1.1, 0]], b: [[0, 1], [0, 2]] }, gas: false },
    co2: { n: 'Dióxido de carbono', f: 'CO₂', at: [['C', 1], ['O', 2]], g: { a: [['C', 0, 0, 0], ['O', 2.3, 0, 0], ['O', -2.3, 0, 0]], b: [[0, 1, 2], [0, 2, 2]] }, gas: true },
    nh3: { n: 'Amoníaco', f: 'NH₃', at: [['N', 1], ['H', 3]], g: { a: [['N', 0, 0.4, 0], ['H', 1.7, -0.4, 0], ['H', -0.85, -0.4, 1.47], ['H', -0.85, -0.4, -1.47]], b: [[0, 1], [0, 2], [0, 3]] }, gas: true },
    ch4: { n: 'Metano', f: 'CH₄', at: [['C', 1], ['H', 4]], g: { a: [['C', 0, 0, 0], ['H', 1.2, 1.2, 1.2], ['H', -1.2, -1.2, 1.2], ['H', -1.2, 1.2, -1.2], ['H', 1.2, -1.2, -1.2]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] }, gas: true },
    o2: { n: 'Oxígeno', f: 'O₂', at: [['O', 2]], g: { a: [['O', 1.2, 0, 0], ['O', -1.2, 0, 0]], b: [[0, 1, 2]] }, gas: true },
    nacl: { n: 'Cloruro de sodio', f: 'NaCl', at: [['Na', 1], ['Cl', 1]], g: { a: [['Na', -1.7, 0, 0], ['Cl', 1.7, 0, 0]], b: [] }, gas: false },
    fe: { n: 'Hierro', f: 'Fe', at: [['Fe', 1]], g: { a: [['Fe', 0, 0, 0]], b: [] }, gas: false },
    caco3: { n: 'Carbonato de calcio', f: 'CaCO₃', at: [['Ca', 1], ['C', 1], ['O', 3]], g: { a: [['Ca', -3, 0, 0], ['C', 0.8, 0, 0], ['O', 0.8, 1.9, 0], ['O', 2.4, -1, 0], ['O', -0.8, -1, 0]], b: [[1, 2], [1, 3], [1, 4]] }, gas: false }
  };
  var S = { sub: 'h2o', m: 18.015 }, g = null, molG = null, built = '', pile = [], pg = null, lab = [];
  function sci(x, d) { var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (!isFinite(e)) return '0'; return fmt(x / Math.pow(10, e), d) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  function M(k) { var s = SUB[k || S.sub], t = 0; s.at.forEach(function (a) { t += a[1] * AM[a[0]]; }); return t; }
  function nmol() { return S.m / M(); }
  function mainEl() { var s = SUB[S.sub], b = s.at[0]; s.at.forEach(function (a) { if (a[1] * AM[a[0]] > b[1] * AM[b[0]]) b = a; }); return b[0]; }
  function stages() {
    return [
      ['Masa molar', 'Masa molar', 'La masa molar es la suma de las masas atómicas de la fórmula, en g/mol',
        '<p>La <b>masa molar</b> M de una sustancia es la masa de <b>1 mol</b> de ella. Se obtiene <b>sumando las masas atómicas</b> de todos los átomos de la fórmula: M(H₂O) = 2·1,008 + 15,999 = 18,015 g/mol. Cambia de sustancia y observa cómo cambia la suma.</p>'],
      ['El mol y Avogadro', 'Avogadro', '1 mol = 6,022×10²³ entidades, sean átomos, moléculas o iones',
        '<p>Un <b>mol</b> contiene <b>N<sub>A</sub> = 6,022 × 10²³</b> entidades elementales. Es un «paquete» enorme que permite contar partículas pesando. Cada esfera del montón representa <b>10²² partículas</b>: con 60 esferas tienes cerca de un mol.</p>'],
      ['Gramos ↔ moles ↔ partículas', 'Conversiones', 'n = m / M · N = n · N_A',
        '<p>Para pasar de masa a moles se divide por M: <b>n = m / M</b>. Para pasar de moles a partículas se multiplica por Avogadro: <b>N = n · N<sub>A</sub></b>. Mueve la masa y verifica que moles y partículas crecen proporcionalmente.</p>'],
      ['Volumen molar de un gas', 'Gases', 'En CNTP (0 °C, 1 atm) 1 mol de gas ideal ocupa 22,4 L',
        '<p>En <b>condiciones normales</b> (0 °C y 1 atm) un mol de cualquier <b>gas ideal</b> ocupa <b>22,414 L</b>. Así, V = n · 22,414 L. Esto no aplica a sólidos ni líquidos: su volumen depende de la densidad.</p>'],
      ['Composición porcentual', 'Composición', '% de cada elemento = (n átomos · masa atómica) / M × 100',
        '<p>La <b>composición porcentual en masa</b> indica qué fracción de la masa molar aporta cada elemento: <b>% = (n · A<sub>r</sub>) / M × 100</b>. La suma siempre da 100 %.</p>']
    ];
  }
  function rebuild() {
    if (built === S.sub) return; built = S.sub; while (molG.children.length) molG.remove(molG.children[0]);
    molG.add(ctxRef.mol(SUB[S.sub].g, { gs: 1.1, ar: 0.8 }));
    pile.forEach(function (p) { p.material = ctxRef.mat(mainEl()); });
  }
  var ctxRef = null;
  function pcount() { return Math.min(240, Math.round(nmol() * NA / 1e22)); }
  var def_ = {
    key: 'mol-masa-molar', title: 'El mol y la masa molar', subtitle: 'Simulador 3D · química general', accent: { dark: '#74c0fc', light: '#1c6ea4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [5, 6, 24], target: [5, 2, 0] }, { id: 'molecula', label: 'Molécula', pos: [1, 4, 11], target: [1, 2.5, 0] }],
    layers: [{ id: 'pile', label: 'Montón', icon: '•' }],
    onStage: function () {},
    build: function (ctx) {
      ctxRef = ctx; g = new T.Group(); ctx.scene.add(g); molG = new T.Group(); molG.position.set(1, 2.5, 0); g.add(molG);
      pg = new T.Group(); pg.position.set(0, 0, 0); g.add(pg); var i, geo = new T.SphereGeometry(0.42, 12, 10);
      for (i = 0; i < 240; i++) { var s = new T.Mesh(geo, ctx.mat('O')); var c = i % 12, r = Math.floor(i / 12) % 5, l = Math.floor(i / 60); s.position.set(2 + c * 0.95 - 0, 0.5 + r * 0.95, (l - 1.5) * 0.95); s.position.x = 6 + c * 0.95; pg.add(s); pile.push(s); }
      var base = new T.Mesh(new T.BoxGeometry(14, 0.2, 5), new T.MeshStandardMaterial({ color: 0x343a40, roughness: 0.8 })); base.position.set(11.5, -0.2, 0); g.add(base);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['h2o', 'co2', 'nh3', 'caco3', 'nacl'][Math.min(4, Math.floor(f.local * 5))]; S.m = M(S.sub); } if (i === 1) { S.sub = 'fe'; S.m = M() * (0.05 + 0.95 * f.local); } if (i === 2) { S.sub = 'h2o'; S.m = 2 + 100 * f.local; } if (i === 3) { S.sub = 'co2'; S.m = M() * (0.1 + 1.9 * f.local); } if (i === 4) { S.sub = ['caco3', 'h2o', 'nh3'][Math.min(2, Math.floor(f.local * 3))]; S.m = M(S.sub); } }
      rebuild(); molG.rotation.y += 0.01; var np = pcount(), on = ctx.layer('pile');
      pile.forEach(function (p, j) { p.visible = on && j < np; });
      var s = SUB[S.sub], tot = M(), parts = s.at.map(function (a) { return a[1] + '×' + fmt(AM[a[0]], 3); }).join(' + ');
      lab[0].pos(1, 6, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true);
      lab[1].pos(1, -0.8, 0).set('M = ' + fmt(tot, 2) + ' g/mol', 'bl-pos').vis(true);
      lab[2].pos(11.5, 6.2, 0).set(fmt(nmol(), 3) + " mol · " + sci(nmol() * NA, 2) + ' partículas', 'bl-d').vis(on);
      lab[3].pos(11.5, -1.3, 0).set('cada esfera = 10²² partículas', 'bl-d').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.m) u.m.set(S.m); },
    hud: function () { var s = SUB[S.sub]; return { eq: { chip: 'n', name: 'Conversión', body: '<div class="eqline"><small>Masa</small>' + fmt(S.m, 2) + ' g</div><div class="eqline"><small>Masa molar</small>' + fmt(M(), 3) + ' g/mol</div><div class="eqline"><small>n = m/M</small>' + fmt(nmol(), 4) + ' mol</div><div class="eqline"><small>N = n·N<sub>A</sub></small>' + SimKit.fmt(nmol() * NA / 1e23, 3) + ' × 10²³</div>' }, legend: [{ label: 'Molécula', color: '#74c0fc', text: 'una entidad de ' + s.f }, { label: 'Esferas', color: '#ff6b6b', text: '10²² partículas cada una' }] }; },
    measures: function () { var s = SUB[S.sub]; return [['Sustancia', s.f], ['Masa molar', fmt(M(), 3) + ' g/mol'], ['Masa', fmt(S.m, 2) + ' g'], ['Cantidad', fmt(nmol(), 4) + ' mol'], ['Partículas', sci(nmol() * NA, 3)], ['Volumen en CNTP', s.gas ? fmt(nmol() * VM, 2) + ' L' : 'no aplica (no es gas)']]; },
    ideas: ['M se obtiene sumando masas atómicas.', 'n = m / M.', 'N = n · N_A.', 'Gas ideal en CNTP: 22,4 L/mol.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sustancia y cantidad'); el.appendChild(c);
      ui.sub = kit.ui.options({ label: 'Sustancia', cols: 2, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].f, sub: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); var n = nmol(); S.sub = v; S.m = Math.min(300, n * M()); } });
      ui.m = kit.ui.slider({ label: 'Masa', min: 0.1, max: 300, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      c.appendChild(ui.sub); c.appendChild(kit.ui.sliders([ui.m])); c.appendChild(ctx.btnRow([{ t: '1 mol', fn: function () { ctx.goManual(); S.m = M(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Composición porcentual en masa', h: 200, note: 'Aporte de cada elemento a la masa molar.', draw: function (cx, w, h, col) {
      var s = SUB[S.sub], tot = M(), L = 10, y = 14, i, pal = ['#74c0fc', '#ff8787', '#ffd43b', '#69db7c'];
      cx.font = '12px system-ui'; cx.textAlign = 'left'; s.at.forEach(function (a, k) { var p = a[1] * AM[a[0]] / tot, bw = (w - 2 * L - 40) * p; cx.fillStyle = pal[k % 4]; cx.fillRect(L, y + k * 40, Math.max(2, bw), 24); cx.fillStyle = col.ink || '#ddd'; cx.fillText(a[0] + ' ' + fmt(p * 100, 1) + ' %', L + 4, y + k * 40 + 40 - 4 - 10); });
    } }],
    calc: function () {
      var s = SUB[S.sub], tot = M(), n = nmol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      var steps = s.at.map(function (a) { return a[1] + ' × ' + fmt(AM[a[0]], 3) + ' (' + a[0] + ')'; }).join(' + ');
      return '<div class="card-kicker">' + s.n + ' · ' + s.f + '</div><table class="calc-table">' + row('M', steps + ' = <b>' + fmt(tot, 3) + ' g/mol</b>') + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(tot, 3) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row('N = n · N<sub>A</sub>', fmt(n, 4) + ' × 6,022×10²³ = <b>' + sci(n * NA, 3) + '</b>') + row('V (CNTP)', s.gas ? fmt(n, 4) + ' × 22,414 = <b>' + fmt(n * VM, 2) + ' L</b>' : 'solo para gases') + '</table>';
    },
    quiz: [
      { q: 'La masa molar del agua (H = 1,008; O = 15,999) es…', options: ['18,015 g/mol', '17,007 g/mol', '34,0 g/mol', '16,0 g/mol'], answer: 0, why: '2·1,008 + 15,999.' },
      { q: '¿Cuántos moles hay en 44 g de CO₂ (M = 44 g/mol)?', options: ['1 mol', '44 mol', '0,5 mol', '2 mol'], answer: 0, why: 'n = 44/44.' },
      { q: '2 mol de moléculas contienen…', options: ['1,2×10²⁴ moléculas', '6,0×10²³ moléculas', '3,0×10²³ moléculas', '2 moléculas'], answer: 0, why: '2 × 6,02×10²³.' },
      { q: 'El volumen de 0,5 mol de gas ideal en CNTP es…', options: ['11,2 L', '22,4 L', '44,8 L', '5,6 L'], answer: 0, why: '0,5 × 22,4.' },
      { q: 'El número de Avogadro es…', options: ['6,022×10²³ entidades por mol', '6,022×10²³ g', '22,4 L', '1 mol de átomos de carbono-12 pesan 1 g'], answer: 0, why: 'Entidades en un mol.' },
      { q: '¿Qué contiene más átomos, 1 mol de Fe o 1 mol de H₂?', options: ['Iguales en moléculas/átomos: 1 mol de entidades de cada uno', 'Fe, por pesar más', 'H₂, por ser gas', 'No se puede comparar'], answer: 0, why: 'Un mol es un número de entidades, no una masa.' }
    ],
    help: { intro: 'Elige una sustancia y mueve la masa: el montón de esferas muestra cuántas partículas hay (cada una = 10²²). En «Cálculo» ves el paso a paso.', items: [['Molécula giratoria', 'una entidad de la sustancia.'], ['Montón', 'N de partículas.']] }
  };
  MSim.create(def_);

})();
