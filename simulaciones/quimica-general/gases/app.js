/* Gases ideales y reales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var R = 0.08206, Rj = 8.314;
  MSim.EL.He = [0xd9ffff, 0.55];
  var G = {
    He: { f: 'He', M: 4.003, a: 0.0346, b: 0.0238, geo: { a: [['He', 0, 0, 0]], b: [] } },
    H2: { f: 'H₂', M: 2.016, a: 0.244, b: 0.0266, geo: { a: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]], b: [[0, 1]] } },
    N2: { f: 'N₂', M: 28.01, a: 1.370, b: 0.0387, geo: { a: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]], b: [[0, 1]] } },
    O2: { f: 'O₂', M: 32.00, a: 1.382, b: 0.0319, geo: { a: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], b: [[0, 1]] } },
    CH4: { f: 'CH₄', M: 16.04, a: 2.303, b: 0.0431, geo: { a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', -0.63, -0.63, 0.63], ['H', -0.63, 0.63, -0.63], ['H', 0.63, -0.63, -0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] } },
    CO2: { f: 'CO₂', M: 44.01, a: 3.658, b: 0.0429, geo: { a: [['O', -1.16, 0, 0], ['C', 0, 0, 0], ['O', 1.16, 0, 0]], b: [[0, 1, 2], [1, 2, 2]] } }
  };
  var S = { gas: 'N2', n: 1, T: 300, V: 10, isoP: 0 };       // isoP>0: presión fija (atm), V se calcula
  var W = 3.5, hA = 5, pools = [], box, tint, piston, rod, lab = {}, SC = 20;
  function g() { return G[S.gas]; }
  function Pid(n, T, V) { return n * R * T / V; }
  function Pre(n, T, V) { var b = g().b, a = g().a, Ve = V - n * b; if (Ve <= 0.001) return Infinity; return n * R * T / Ve - a * n * n / (V * V); }
  function vrms() { return Math.sqrt(3 * Rj * S.T / (g().M / 1000)); }
  function vmp() { return Math.sqrt(2 * Rj * S.T / (g().M / 1000)); }
  var fmt = SimKit.fmt;
  function fp(x) { return isFinite(x) ? fmt(x, x < 10 ? 2 : (x < 100 ? 1 : 0)) : '∞'; }

  function hOf(V) { return 0.5 * V; }
  function syncCounts(ctx) {
    var want = Math.min(80, Math.round(S.n * SC));
    while (pools.length < want) { var m = ctx.mol(g().geo, { gs: 0.5, ar: 0.42 }); m.position.set((Math.random() * 2 - 1) * (W - 0.8), 0.5 + Math.random() * Math.max(0.3, hA - 1), (Math.random() * 2 - 1) * (W - 0.8)); ctx.scene.add(m); pools.push({ g: m, v: new ctx.T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), ph: Math.random() * 6 }); }
    while (pools.length > want) { var p = pools.splice(Math.floor(Math.random() * pools.length), 1)[0]; ctx.scene.remove(p.g); }
  }
  function rebuildGas(ctx) { pools.forEach(function (p) { ctx.scene.remove(p.g); }); pools = []; }

  var stagesTxt = function (ctx) {
    var gg = g(), n = 1, P0 = Pid(1, 300, 10);
    return [
      ['Variables de estado', 'Variables', 'P, V, T y n describen un gas: PV = nRT',
        '<p>Un gas ideal queda descrito por su <b>presión</b> (choques con las paredes), <b>volumen</b>, <b>temperatura</b> (energía cinética media) y <b>cantidad de sustancia</b>. Su relación es <b>PV = nRT</b> con R = 0,08206 atm·L/(mol·K).</p><p>Ejemplo: 1,00 mol de N₂ a 300 K en 10,0 L → P = <b>' + fmt(P0, 2) + ' atm</b>.</p>'],
      ['Ley de Boyle', 'Boyle', 'T y n constantes: al comprimir, P × V = constante',
        '<p>Se reduce el volumen de 10,0 L a 2,5 L a <b>300 K</b>. Las moléculas chocan más veces con las paredes y la presión aumenta en la misma proporción: P × V = nRT = <b>' + fmt(R * 300, 2) + ' atm·L</b>.</p><p>Cuarta parte del volumen → <b>cuatro veces</b> la presión (' + fmt(P0, 2) + ' → ' + fmt(P0 * 4, 2) + ' atm).</p>'],
      ['Ley de Gay-Lussac', 'Gay-Lussac', 'V y n constantes: P es proporcional a T',
        '<p>Con el émbolo fijo (V = 5,0 L) se calienta de 200 K a 500 K. Las moléculas se mueven más rápido, chocan con más frecuencia y con más fuerza: <b>P / T = nR / V</b> es constante.</p>'],
      ['Ley de Charles', 'Charles', 'P y n constantes: V es proporcional a T',
        '<p>Con el émbolo libre bajo <b>1,00 atm</b> constantes (0,30 mol), al calentar de 200 K a 500 K el gas se <b>expande</b>: V = nRT / P pasa de ' + fmt(0.3 * R * 200, 1) + ' L a ' + fmt(0.3 * R * 500, 1) + ' L. <b>V / T = nR / P</b> es constante.</p>'],
      ['Velocidades moleculares', 'Maxwell', 'Las moléculas no tienen la misma rapidez: distribución de Maxwell–Boltzmann',
        '<p>A una temperatura dada hay moléculas lentas y rápidas. La rapidez <b>cuadrática media</b> es <b>v<sub>rms</sub> = √(3RT/M)</b>: para N₂ a 300 K es <b>' + fmt(Math.sqrt(3 * Rj * 300 / 0.02801), 0) + ' m/s</b>. Al subir T la curva se ensancha y se desplaza; a igual T los gases livianos (H₂, He) son más rápidos.</p><p>La energía cinética media por mol, <b>3/2 RT</b>, solo depende de T.</p>'],
      ['Gases reales', 'Reales', 'A alta presión y baja T el gas real se aparta del ideal',
        '<p>El modelo ideal ignora el volumen de las moléculas y sus atracciones. La <b>ecuación de van der Waals</b>, <b>(P + a n²/V²)(V − nb) = nRT</b>, los incluye. Con CO₂ a 250 K y volumen decreciente la presión real queda <b>por debajo</b> de la ideal (dominan las atracciones, <b>Z &lt; 1</b>) y, a volúmenes muy pequeños, por encima (dominan los volúmenes propios, Z &gt; 1).</p>']
    ];
  };

  var def = {
    key: 'gases', title: 'Gases ideales y reales', subtitle: 'Simulador 3D · química general', accent: { dark: '#9ae6b4', light: '#2f855a' },
    stages: stagesTxt, dur: 12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 6, 22], target: [0, 3.2, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 4, 24], target: [0, 3, 0] }, { id: 'lado', label: 'Lateral', pos: [24, 6, 3], target: [0, 3, 0] }, { id: 'superior', label: 'Superior', pos: [0, 28, 3], target: [0, 2, 0] }],
    layers: [{ id: 'real', label: 'Mostrar gas real (van der Waals)', icon: '≈', on: false }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene;
      var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.13, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      box = new T.Mesh(new T.BoxGeometry(2 * W + 0.3, 1, 2 * W + 0.3), gm); s.add(box);
      piston = new T.Mesh(new T.BoxGeometry(2 * W + 0.5, 0.3, 2 * W + 0.5), new T.MeshStandardMaterial({ color: 0x59667a, roughness: 0.6 })); s.add(piston);
      rod = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 8, 12), new T.MeshStandardMaterial({ color: 0x8a97a8 })); s.add(rod);
      var plate = new T.Mesh(new T.BoxGeometry(2 * W + 1.4, 0.3, 2 * W + 1.4), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; s.add(plate);
      var hm = new T.MeshBasicMaterial({ color: 0xff6030, transparent: true, opacity: 0 }); tint = new T.Mesh(new T.BoxGeometry(2 * W + 1.2, 0.12, 2 * W + 1.2), hm); tint.position.y = -0.34; s.add(tint);
      lab.P = ctx.label('', 'bl-lead'); lab.Pr = ctx.label('', 'bl-warn'); lab.T = ctx.label('', 'bl-warn'); lab.V = ctx.label('', 'bl-d');
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, u = ctx.ease(f.local), x;
        S.gas = i === 5 ? 'CO2' : 'N2'; S.isoP = 0;
        if (i === 0) { S.n = 1; S.T = 300; S.V = 10; }
        if (i === 1) { S.n = 1; S.T = 300; S.V = 10 - 7.5 * u; }
        if (i === 2) { S.n = 1; S.V = 5; S.T = 200 + 300 * u; }
        if (i === 3) { S.n = 0.3; S.isoP = 1; S.T = 200 + 300 * u; }
        if (i === 4) { S.n = 1; S.V = 8; S.T = 200 + 400 * u; }
        if (i === 5) { S.n = 1; S.T = 250; S.V = 12 - 10.2 * u; }
        ctx.layerReal = i === 5;
      }
      if (S.isoP > 0) S.V = clamp(S.n * R * S.T / S.isoP, 1.5, 13);
      if (pools.length === 0 || pools[0].gas !== S.gas) { rebuildGas(ctx); pools.gas = S.gas; }
      syncCounts(ctx);
      var h0 = hOf(S.V); hA += (h0 - hA) * Math.min(1, dt * 5); var h = hA;
      box.scale.y = h; box.position.y = h / 2; piston.position.y = h + 0.15; rod.position.y = h + 4;
      tint.material.opacity = clamp((S.T - 100) / 600, 0, 1) * 0.9; tint.material.color.setHSL(0.04 + 0.03 * (1 - (S.T - 100) / 600), 1, 0.5);
      var sp = Math.min(4.5, 0.5 * Math.sqrt(S.T / g().M) * (S.gas === 'He' || S.gas === 'H2' ? 0.6 : 1.0)), Rr = W - 0.3, top = h - 0.3;
      pools.forEach(function (m) {
        var p = m.g.position, v = m.v; p.x += v.x * sp * dt; p.y += v.y * sp * dt; p.z += v.z * sp * dt;
        if (p.x < -Rr) { p.x = -Rr; v.x = Math.abs(v.x); } if (p.x > Rr) { p.x = Rr; v.x = -Math.abs(v.x); }
        if (p.z < -Rr) { p.z = -Rr; v.z = Math.abs(v.z); } if (p.z > Rr) { p.z = Rr; v.z = -Math.abs(v.z); }
        if (p.y < 0.35) { p.y = 0.35; v.y = Math.abs(v.y); } if (p.y > top) { p.y = top; v.y = -Math.abs(v.y); }
        m.g.rotation.x += dt * 2; m.g.rotation.y += dt * 1.6;
      });
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), showR = ctx.layer('real') || ctx.layerReal;
      lab.P.pos(0, h + 1.9, 0).set(showR ? 'P ideal = ' + fp(pi) + ' atm' : 'P = ' + fp(pi) + ' atm').vis(true);
      lab.Pr.pos(0, h + 3.3, 0).set('P real (vdW) = ' + fp(pr) + ' atm').vis(showR);
      lab.T.pos(W + 2.6, 1.0, 0).set(fmt(S.T, 0) + ' K').vis(true);
      lab.V.pos(-W - 2.8, h / 2, 0).set('V = ' + fmt(S.V, 1) + ' L · n = ' + fmt(S.n, 2) + ' mol').vis(true);
    },
    sync: function (ctx) { if (ctx.ui.sT && !ctx.P.manual) { ctx.ui.sT.set(S.T); ctx.ui.sV.set(S.V); ctx.ui.sN.set(S.n); } },
    hud: function (ctx) {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), gg = g();
      return { eq: { chip: 'Gas', name: 'PV = nRT', body: '<div class="eqline"><small>Gas</small>' + gg.f + ' (M = ' + fmt(gg.M, 2) + ' g/mol)</div><div class="eqline"><small>P ideal</small>' + fp(pi) + ' atm = ' + fmt(pi * 101.325, 0) + ' kPa</div><div class="eqline"><small>P real (van der Waals)</small>' + fp(pr) + ' atm</div><small>R = 0,08206 atm·L/(mol·K) = 8,314 J/(mol·K)</small>' },
        legend: [{ label: gg.f, color: '#9ae6b4', text: 'molécula del gas (esfera = átomo)' }, { label: 'Placa inferior', color: '#ff6030', text: 'más intensa a mayor T' }] };
    },
    measures: function () {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V);
      return [['Gas', g().f], ['n', fmt(S.n, 2) + ' mol'], ['T', fmt(S.T, 0) + ' K (' + fmt(S.T - 273.15, 0) + ' °C)'], ['V', fmt(S.V, 2) + ' L'], ['P (ideal)', fp(pi) + ' atm'], ['P (van der Waals)', fp(pr) + ' atm'], ['Z = PV/nRT (real)', fmt(pr * S.V / (S.n * R * S.T), 3)], ['v<sub>rms</sub>', fmt(vrms(), 0) + ' m/s'], ['v más probable', fmt(vmp(), 0) + ' m/s'], ['E<sub>c</sub> media (por mol)', fmt(1.5 * Rj * S.T / 1000, 2) + ' kJ/mol']];
    },
    ideas: ['<b>PV = nRT</b>: presión, volumen, temperatura y cantidad de gas están ligados.', '<b>Boyle</b> (T, n cte): P·V = cte · <b>Charles</b> (P, n cte): V/T = cte · <b>Gay-Lussac</b> (V, n cte): P/T = cte.', 'La <b>temperatura</b> mide la energía cinética media: E<sub>c</sub> = 3/2 kT por molécula.', 'A igual T, las moléculas livianas son más rápidas: v<sub>rms</sub> = √(3RT/M).', 'Los gases reales se desvían del ideal a <b>alta P y baja T</b> (van der Waals).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Panel de control'); el.appendChild(c);
      ui.gasOpts = kit.ui.options({ label: 'Gas', cols: 3, value: S.gas, options: Object.keys(G).map(function (k) { return { v: k, label: G[k].f, sub: fmt(G[k].M, 1) + ' g/mol' }; }), onChange: function (v) { ctx.goManual(); S.gas = v; rebuildGas(ctx); } });
      c.appendChild(ui.gasOpts);
      ui.sN = kit.ui.slider({ label: 'n', min: 0.2, max: 3, step: 0.05, value: S.n, format: function (v) { return fmt(v, 2) + ' mol'; }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.sT = kit.ui.slider({ label: 'T', min: 100, max: 700, step: 5, value: S.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = v; } });
      ui.sV = kit.ui.slider({ label: 'V', min: 1.5, max: 13, step: 0.1, value: S.V, format: function (v) { return fmt(v, 1) + ' L'; }, onInput: function (v) { ctx.goManual(); S.isoP = 0; S.V = v; } });
      c.appendChild(kit.ui.sliders([ui.sN, ui.sT, ui.sV]));
      c.appendChild(ctx.btnRow([{ t: 'P constante (1 atm)', fn: function () { ctx.goManual(); S.isoP = S.isoP ? 0 : 1; kit.toast(S.isoP ? 'Émbolo libre a 1 atm: V = nRT/P' : 'Volumen fijado por el control'); } }, { t: 'Reiniciar', fn: function () { ctx.goManual(); S.n = 1; S.T = 300; S.V = 10; S.isoP = 0; S.gas = 'N2'; rebuildGas(ctx); ui.gasOpts.set('N2'); ui.sN.set(1); ui.sT.set(300); ui.sV.set(10); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', '<p class="muted small">Activa la capa «Mostrar gas real» para comparar con van der Waals. Con P constante el volumen se calcula (máx. 13 L).</p>');
    },
    graphs: [
      { title: 'Isoterma P–V', h: 230, note: 'Línea discontinua: gas ideal; línea continua: van der Waals a la T actual. El punto es el estado actual.', draw: function (cx, w, h, c) {
        var L = 42, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, V0 = 1.5, V1 = 13, pm = 0; for (var v = V0; v <= V1; v += 0.25) pm = Math.max(pm, Pid(S.n, S.T, v)); pm = Math.max(1, Math.min(pm, 60)) * 1.05;
        var sx = function (v) { return L + pw * (v - V0) / (V1 - V0); }, sy = function (p) { return Tp + ph - ph * Math.min(p, pm) / pm; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(pm * i / 4, 1), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var j = 0; j <= 4; j++) cx.fillText(fmt(V0 + (V1 - V0) * j / 4, 1), L + pw * j / 4, h - B + 13); cx.fillText('V (L) · eje y: P (atm)', L + pw / 2, h - 4);
        cx.setLineDash([5, 4]); cx.strokeStyle = c.muted; cx.beginPath(); for (v = V0; v <= V1; v += 0.1) { var yy = sy(Pid(S.n, S.T, v)); if (v === V0) cx.moveTo(sx(v), yy); else cx.lineTo(sx(v), yy); } cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#38a169'; cx.lineWidth = 2.4; cx.beginPath(); var st = false; for (v = V0; v <= V1; v += 0.1) { var pr = Pre(S.n, S.T, v); if (!isFinite(pr)) continue; if (!st) { cx.moveTo(sx(v), sy(pr)); st = true; } else cx.lineTo(sx(v), sy(pr)); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.V), sy(Pid(S.n, S.T, S.V)), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
      { title: 'Distribución de rapideces de Maxwell–Boltzmann', h: 220, note: 'Curva gruesa: T actual. Finas: T/2 y 2T. Línea vertical: v<sub>rms</sub> a la T actual.', draw: function (cx, w, h, c) {
        var L = 14, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, Mm = g().M / 1000, vmx = 2800;
        var f = function (v, T0) { return 4 * Math.PI * Math.pow(Mm / (2 * Math.PI * Rj * T0), 1.5) * v * v * Math.exp(-Mm * v * v / (2 * Rj * T0)); };
        var peak = 0; [S.T / 2, S.T, S.T * 2].forEach(function (T0) { for (var v = 0; v <= vmx; v += 20) peak = Math.max(peak, f(v, T0)); }); peak *= 1.08;
        var sx = function (v) { return L + pw * v / vmx; }, sy = function (y) { return Tp + ph - ph * y / peak; };
        cx.font = '10.5px system-ui'; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var j = 0; j <= 4; j++) cx.fillText(fmt(vmx * j / 4, 0), L + pw * j / 4, h - B + 13); cx.fillText('rapidez (m/s)', L + pw / 2, h - 4);
        [[S.T / 2, '#9aa7b4', 1.4], [S.T * 2, '#e3b341', 1.4], [S.T, '#38a169', 2.8]].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = a[2]; cx.beginPath(); for (var v = 0; v <= vmx; v += 10) { var y = sy(f(v, a[0])); if (v === 0) cx.moveTo(sx(v), y); else cx.lineTo(sx(v), y); } cx.stroke(); }); cx.lineWidth = 1;
        cx.strokeStyle = c.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(vrms()), Tp); cx.lineTo(sx(vrms()), Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText('v_rms ' + fmt(vrms(), 0), Math.min(sx(vrms()) + 4, L + pw - 70), Tp + 10); } },
      { title: 'Factor de compresibilidad Z', h: 210, note: 'Z = PV/nRT. Z = 1 es el gas ideal. Calculado con van der Waals para 1 mol a la T actual (P ≤ 300 atm).', draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, pts = [], Pm = 300, gg = g(), nn = 1;
        for (var v = gg.b * 1.15; v < 60; v *= 1.025) { var p = nn * R * S.T / (v - nn * gg.b) - gg.a / (v * v); if (p > 0.05 && p <= Pm) pts.push([p, p * v / (R * S.T)]); }
        var zmin = Math.min(0.2, Math.min.apply(null, pts.map(function (a) { return a[1]; }).concat([1]))), zmax = Math.max(1.6, Math.max.apply(null, pts.map(function (a) { return a[1]; }).concat([1])));
        var sx = function (p) { return L + pw * Math.log(p / 0.05) / Math.log(Pm / 0.05); }, sy = function (z) { return Tp + ph - ph * (z - zmin) / (zmax - zmin); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var z = zmin + (zmax - zmin) * i / 4, y = sy(z); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(z, 2), L - 5, y + 3); }
        cx.textAlign = 'center'; [0.1, 1, 10, 100].forEach(function (p) { cx.fillText(p, sx(p), h - B + 13); }); cx.fillText('P (atm, escala log)', L + pw / 2, h - 4);
        cx.strokeStyle = c.ink; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(L, sy(1)); cx.lineTo(L + pw, sy(1)); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#38a169'; cx.lineWidth = 2.4; cx.beginPath(); pts.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (a, k) { if (k === 0) cx.moveTo(sx(a[0]), sy(a[1])); else cx.lineTo(sx(a[0]), sy(a[1])); }); cx.stroke(); cx.lineWidth = 1;
        var pr = Pre(S.n, S.T, S.V); if (isFinite(pr) && pr > 0.05 && pr <= Pm) { cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(pr), sy(pr * S.V / (S.n * R * S.T)), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } } }
    ],
    calc: function () {
      var pi = Pid(S.n, S.T, S.V), pr = Pre(S.n, S.T, S.V), gg = g(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">Cálculo con el estado actual</div><div class="calc-step">1 · Gas ideal: P = nRT / V</div><table class="calc-table">' + row('n · R · T', fmt(S.n, 2) + ' × 0,08206 × ' + fmt(S.T, 0) + ' = ' + fmt(S.n * R * S.T, 2) + ' atm·L') + row('P = (nRT) ÷ V', fmt(S.n * R * S.T, 2) + ' ÷ ' + fmt(S.V, 2) + ' = <b>' + fp(pi) + ' atm</b> (' + fmt(pi * 101.325, 0) + ' kPa)') + '</table>' +
        '<div class="calc-step">2 · Van der Waals (' + gg.f + ': a = ' + gg.a + ' atm·L²/mol², b = ' + gg.b + ' L/mol)</div><table class="calc-table">' + row('nRT ÷ (V − nb)', isFinite(pr) ? fmt(S.n * R * S.T / (S.V - S.n * gg.b), 2) + ' atm' : '—') + row('a n² ÷ V²', fmt(gg.a * S.n * S.n / (S.V * S.V), 2) + ' atm') + row('P real', '<b>' + fp(pr) + ' atm</b>') + row('Z = PV/nRT', fmt(pr * S.V / (S.n * R * S.T), 3)) + '</table>' +
        '<div class="calc-step">3 · Rapideces moleculares</div><table class="calc-table">' + row('v<sub>rms</sub> = √(3RT/M)', '√(3 × 8,314 × ' + fmt(S.T, 0) + ' ÷ ' + fmt(gg.M / 1000, 5) + ') = <b>' + fmt(vrms(), 0) + ' m/s</b>') + row('v más probable √(2RT/M)', fmt(vmp(), 0) + ' m/s') + row('E<sub>c</sub> media = 3/2 RT', fmt(1.5 * Rj * S.T / 1000, 2) + ' kJ/mol') + '</table>';
    },
    quiz: [
      { q: '¿Qué volumen ocupa 1,00 mol de gas ideal a 0 °C (273,15 K) y 1,00 atm?', options: ['22,4 L', '24,5 L', '1,00 L', '8,21 L'], answer: 0, why: 'V = nRT/P = 1,00 × 0,08206 × 273,15 / 1,00 = 22,41 L (volumen molar en CNPT).' },
      { q: 'Un gas ocupa 2,0 L a 1,0 atm. Se comprime a 0,50 L a temperatura constante. ¿Cuál es la nueva presión?', options: ['4,0 atm', '0,25 atm', '2,0 atm', '0,50 atm'], answer: 0, why: 'Ley de Boyle: P₁V₁ = P₂V₂ → P₂ = 1,0 × 2,0 / 0,50 = 4,0 atm.' },
      { q: 'Un gas ocupa 3,0 L a 300 K y presión constante. ¿Qué volumen ocupa a 450 K?', options: ['4,5 L', '2,0 L', '3,0 L', '6,8 L'], answer: 0, why: 'Ley de Charles (T en kelvin): V₂ = V₁ · T₂/T₁ = 3,0 × 450/300 = 4,5 L.' },
      { q: 'A la misma temperatura, ¿qué gas tiene mayor rapidez cuadrática media, H₂ o O₂?', options: ['H₂, unas 4 veces más rápido', 'O₂, unas 4 veces más rápido', 'Ambos igual', 'H₂, el doble'], answer: 0, why: 'v_rms = √(3RT/M): v(H₂)/v(O₂) = √(32/2,016) ≈ 4.' },
      { q: 'A la misma temperatura, la energía cinética media por molécula de He y de Xe es…', options: ['Igual', 'Mayor en He', 'Mayor en Xe', 'Cero en Xe'], answer: 0, why: 'La energía cinética media traslacional es 3/2 kT y solo depende de T, no de la masa.' },
      { q: 'Los gases reales se apartan más del comportamiento ideal a…', options: ['Alta presión y baja temperatura', 'Baja presión y alta temperatura', 'Baja presión y baja temperatura', 'Alta temperatura y alta presión por igual'], answer: 0, why: 'Con alta P las moléculas están cerca (importa su volumen) y a baja T las atracciones intermoleculares son relevantes frente a la energía cinética.' },
      { q: '¿Cuántos moles de gas ideal hay en 5,00 L a 2,00 atm y 300 K?', options: ['0,406 mol', '2,46 mol', '0,0406 mol', '4,06 mol'], answer: 0, why: 'n = PV/RT = (2,00 × 5,00) / (0,08206 × 300) = 10,0 / 24,6 = 0,406 mol.' },
      { q: 'Una mezcla de 2,0 mol de N₂ y 1,0 mol de O₂ está a 3,0 atm totales. ¿Cuál es la presión parcial del N₂?', options: ['2,0 atm', '1,0 atm', '3,0 atm', '1,5 atm'], answer: 0, why: 'Ley de Dalton: p(N₂) = x(N₂) · P = (2/3) × 3,0 = 2,0 atm.' }
    ],
    help: { intro: 'Cambia gas, n, T y V en «Lab», o sigue la lección. Con «Volver a la lección» el guion retoma el control.', items: [['Recipiente', 'las moléculas rebotan en las paredes; el émbolo fija el volumen; la placa inferior se pone más roja al subir T.'], ['Gas real', 'activa la capa «Mostrar gas real» para comparar con van der Waals.'], ['Gráficos', 'isoterma P–V, distribución de Maxwell–Boltzmann y factor de compresibilidad Z.'], ['Cálculo', 'PV = nRT, van der Waals y rapideces moleculares con los valores actuales.']] }
  };
  MSim.create(def);
})();
