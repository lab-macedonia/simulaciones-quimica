/* Cinética química: órdenes de reacción — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f2 = function (x) { return fmt(x, 2); }, f3 = function (x) { return fmt(x, 3); };
  var KR = { 0: { min: 0.005, max: 0.05, def: 0.02, st: 0.001, u: 'M/s' }, 1: { min: 0.01, max: 0.1, def: 0.03, st: 0.001, u: 's⁻¹' }, 2: { min: 0.01, max: 0.2, def: 0.04, st: 0.005, u: 'M⁻¹ s⁻¹' } };
  var S = { n: 1, A0: 1.0, k: 0.03, t: 0, run: false, myst: null, guess: null };
  var NP = 64, pa = [], pb = [], A, B, lab = {}, barA, barB, dummy;
  function lawTxt(n) { return n === 0 ? 'v = k' : (n === 1 ? 'v = k[A]' : 'v = k[A]²'); }
  function conc(t, n, A0, k) { n = n == null ? S.n : n; A0 = A0 == null ? S.A0 : A0; k = k == null ? S.k : k; if (n === 0) return Math.max(0, A0 - k * t); if (n === 1) return A0 * Math.exp(-k * t); return 1 / (1 / A0 + k * t); }
  function rate(c, n, k) { n = n == null ? S.n : n; k = k == null ? S.k : k; return k * Math.pow(c, n); }
  function thalf(n, A0, k) { n = n == null ? S.n : n; A0 = A0 == null ? S.A0 : A0; k = k == null ? S.k : k; return n === 0 ? A0 / (2 * k) : (n === 1 ? Math.LN2 / k : 1 / (k * A0)); }
  function tEnd() { var th = thalf(); return S.n === 0 ? S.A0 / S.k * 1.05 : th * 5; }
  function cA() { return conc(S.t); }
  function setOrder(n) { S.n = n; S.k = KR[n].def; S.A0 = 1.0; S.t = 0; }
  function newMyst() { var n = [0, 1, 2][Math.floor(Math.random() * 3)]; S.myst = { n: n, k: KR[n].def * (0.6 + Math.random() * 0.9) }; S.guess = null; }
  newMyst();
  function ratesTable() { return [0.2, 0.4, 0.8].map(function (c) { return [c, S.myst.k * Math.pow(c, S.myst.n)]; }); }

  function stages() {
    var th1 = thalf(1, 1.0, 0.03), th0 = thalf(0, 1, 0.02), th2 = thalf(2, 1, 0.04);
    return [
      ['Velocidad de reacción', 'Velocidad', 'La velocidad es el cambio de concentración en el tiempo',
        '<p>Para A → B, la <b>velocidad de reacción</b> es <b>v = −Δ[A]/Δt = +Δ[B]/Δt</b>. La velocidad <b>media</b> es la pendiente entre dos instantes; la <b>instantánea</b>, la pendiente de la tangente. A medida que A se consume, suele disminuir. Observa cómo las partículas rojas (A) pasan a azules (B).</p>'],
      ['Ley de velocidad', 'Ley', 'v = k[A]ⁿ: el orden n se mide, no se deduce de la ecuación',
        '<p>La <b>ley de velocidad</b> relaciona v con las concentraciones: <b>v = k [A]<sup>n</sup></b>. El <b>orden n</b> (0, 1, 2…) se determina experimentalmente, p. ej. con el <b>método de velocidades iniciales</b>: si al duplicar [A] la velocidad se duplica, n = 1; si se cuadruplica, n = 2; si no cambia, n = 0. Las unidades de k dependen del orden.</p>'],
      ['Orden cero', 'Orden 0', 'Orden 0: [A] disminuye linealmente; t<sub>½</sub> = [A]₀/2k',
        '<p>Si v = k, la velocidad no depende de [A] (p. ej. una reacción limitada por un catalizador saturado). <b>[A] = [A]₀ − kt</b>. <b>t<sub>½</sub> = [A]₀/(2k)</b>: con [A]₀ = 1,0 M y k = 0,020 M/s, t<sub>½</sub> = <b>' + fmt(th0, 1) + ' s</b>. Termina de golpe cuando se agota A. k se expresa en M/s.</p>'],
      ['Primer orden', 'Orden 1', 'Orden 1: ln[A] lineal; t<sub>½</sub> = ln 2 / k constante',
        '<p>Si v = k[A]: <b>[A] = [A]₀·e<sup>−kt</sup></b>, es decir <b>ln[A] = ln[A]₀ − kt</b> (recta de pendiente −k). El <b>tiempo de vida media</b> <b>t<sub>½</sub> = ln 2 / k</b> no depende de [A]₀ (con k = 0,030 s⁻¹: <b>' + fmt(th1, 1) + ' s</b>); en cada t<sub>½</sub> queda la mitad. Modela decaimientos radiactivos y muchas descomposiciones.</p>'],
      ['Segundo orden', 'Orden 2', 'Orden 2: 1/[A] lineal; t<sub>½</sub> = 1 / (k[A]₀)',
        '<p>Si v = k[A]²: <b>1/[A] = 1/[A]₀ + kt</b> (recta de pendiente +k). <b>t<sub>½</sub> = 1/(k[A]₀)</b> <b>depende</b> de [A]₀: con [A]₀ = 1,0 M y k = 0,040 M⁻¹s⁻¹ es <b>' + fmt(th2, 1) + ' s</b>, pero cada vida media siguiente dura el doble (la concentración es menor). k en M⁻¹s⁻¹.</p>'],
      ['Identificar el orden', 'Linealizar', '¿Qué gráfico sale recto? [A], ln[A] o 1/[A] frente a t',
        '<p>Para identificar el orden se grafica: <b>[A] vs t</b> (recta ⇒ orden 0), <b>ln[A] vs t</b> (recta ⇒ orden 1) y <b>1/[A] vs t</b> (recta ⇒ orden 2). En «Lab» hay un <b>experimento misterioso</b>: con las velocidades iniciales a tres concentraciones, deduce el orden.</p>']
    ];
  }

  var def = {
    key: 'cinetica-orden-reaccion', title: 'Cinética química: órdenes de reacción', subtitle: 'Simulador 3D · química general', accent: { dark: '#f0abfc', light: '#a21caf' },
    stages: stages, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 6, 22], target: [0, 3.3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 4, 24], target: [0, 3.3, 0] }, { id: 'sup', label: 'Superior', pos: [0, 28, 3], target: [0, 2, 0] }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene, gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.14, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      var box = new T.Mesh(new T.BoxGeometry(8, 6, 8), gm); box.position.set(-2, 3, 0); s.add(box);
      var plate = new T.Mesh(new T.BoxGeometry(18, 0.3, 9), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; s.add(plate);
      var sg = new T.SphereGeometry(1, 14, 10);
      A = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xff5c5c, roughness: 0.4 }), NP); B = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0x4f8bff, roughness: 0.4 }), NP);
      A.frustumCulled = B.frustumCulled = false; s.add(A); s.add(B); dummy = new T.Object3D();
      function rp() { return { x: (Math.random() * 2 - 1) * 3.4, y: 0.4 + Math.random() * 5.1, z: (Math.random() * 2 - 1) * 3.4, vx: Math.random() - .5, vy: Math.random() - .5, vz: Math.random() - .5, ord: Math.random() }; }
      for (var i = 0; i < NP; i++) { pa.push(rp()); }
      pa.forEach(function (p, i) { p.ord = i; });
      var m1 = new T.MeshStandardMaterial({ color: 0xff5c5c }), m2 = new T.MeshStandardMaterial({ color: 0x4f8bff });
      barA = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 1, 20), m1); barB = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 1, 20), m2); barA.position.x = 4.2; barB.position.x = 5.8; s.add(barA); s.add(barB);
      lab.t = ctx.label('', 'bl-lead'); lab.a = ctx.label('', 'bl-warn'); lab.b = ctx.label('', 'bl-d'); lab.r = ctx.label('', 'bl-d'); lab.s = ctx.label('', 'bl-d');
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i; var cfg = [[1, 1], [1, 1], [0, 1], [1, 1], [2, 1], [1, 1]][i];
        if (S.n !== cfg[0] || (S._st !== i)) { S._st = i; if (S.n !== cfg[0]) setOrder(cfg[0]); }
        S.t = tEnd() * ctx.ease(f.local) * (i === 5 ? 0.0 : 1) + (i === 5 ? tEnd() * f.local : 0);
      } else if (S.run) { S.t += dt * tEnd() / 10; if (S.t >= tEnd()) { S.t = tEnd(); S.run = false; } }
      var c = cA(), nA = Math.round(NP * c / S.A0), nB = NP - nA, sp = 1.4;
      var px = function (arr, from, n, inst, off) { inst.count = n; for (var q = 0; q < n; q++) { var p = arr[from + q]; p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.z += p.vz * sp * dt; if (Math.abs(p.x) > 3.4) { p.vx *= -1; p.x = Math.sign(p.x) * 3.4; } if (Math.abs(p.z) > 3.4) { p.vz *= -1; p.z = Math.sign(p.z) * 3.4; } if (p.y < 0.4) { p.y = 0.4; p.vy = Math.abs(p.vy); } if (p.y > 5.5) { p.y = 5.5; p.vy = -Math.abs(p.vy); } dummy.position.set(p.x - 2, p.y, p.z); dummy.scale.setScalar(0.33); dummy.updateMatrix(); inst.setMatrixAt(q, dummy.matrix); } inst.instanceMatrix.needsUpdate = true; };
      // A: las primeras nA partículas; B: las restantes (ya convertidas)
      px(pa, 0, nA, A); px(pa, nA, nB, B);
      var hA = 0.05 + 6 * c / Math.max(S.A0, 1e-6) * 0.9, hB = 0.05 + 6 * (S.A0 - c) / S.A0 * 0.9; barA.scale.y = hA; barA.position.y = hA / 2; barB.scale.y = hB; barB.position.y = hB / 2;
      lab.t.pos(-2, 7.0, 0).set('t = ' + fmt(S.t, 1) + ' s · v = ' + fmt(rate(c), 4) + ' M/s', 'bl-lead').vis(true);
      lab.a.pos(4.2, hA + 0.9, 0).set('[A] ' + f3(c) + ' M', 'bl-warn').vis(true); lab.b.pos(5.8, hB + 0.9, 0).set('[B] ' + f3(S.A0 - c) + ' M', 'bl-d').vis(true);
      lab.s.pos(-2, -0.9, 0).set('Orden ' + S.n + ' · ' + lawTxt(S.n) + ' · t½ = ' + fmt(thalf(), 1) + ' s', 'bl-d').vis(true); lab.r.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.ord && u.ord.set(String(S.n)); u.sA && u.sA.set(S.A0); u.sK && u.sK.set(S.k); } u.sT && u.sT.set(S.t); },
    hud: function () { return { eq: { chip: 'Cinética', name: 'A → B · ' + lawTxt(S.n), body: '<div class="eqline"><small>Constante k</small>' + fmt(S.k, 3) + ' ' + KR[S.n].u + '</div><div class="eqline"><small>Vida media</small>' + fmt(thalf(), 1) + ' s' + (S.n === 1 ? ' (constante)' : '') + '</div><div class="eqline"><small>Gráfico lineal</small>' + ['[A] vs t (pend. −k)', 'ln[A] vs t (pend. −k)', '1/[A] vs t (pend. +k)'][S.n] + '</div>' }, legend: [{ label: 'A', color: '#ff5c5c', text: 'reactivo' }, { label: 'B', color: '#4f8bff', text: 'producto' }, { label: 'Columnas', color: '#e3b341', text: 'concentraciones [A] y [B]' }] }; },
    measures: function () { var c = cA(); return [['Orden', String(S.n)], ['Ley', lawTxt(S.n)], ['k', fmt(S.k, 3) + ' ' + KR[S.n].u], ['[A]₀', f2(S.A0) + ' M'], ['t', fmt(S.t, 1) + ' s'], ['[A]', f3(c) + ' M'], ['[B]', f3(S.A0 - c) + ' M'], ['v instantánea', fmt(rate(c), 4) + ' M/s'], ['t½', fmt(thalf(), 1) + ' s'], ['Reacción completada', fmt((1 - c / S.A0) * 100, 1) + ' %']]; },
    ideas: ['<b>v = −Δ[A]/Δt = k[A]ⁿ</b>; n se determina experimentalmente.', '<b>Orden 0</b>: [A] lineal en t · <b>Orden 1</b>: ln[A] lineal; t½ = ln 2/k · <b>Orden 2</b>: 1/[A] lineal; t½ = 1/(k[A]₀).', 'En primer orden t½ es constante; en segundo orden crece al bajar [A].', 'Método de <b>velocidades iniciales</b>: n = log(v₂/v₁) / log([A]₂/[A]₁).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Panel de control'); el.appendChild(c);
      ui.ord = kit.ui.options({ label: 'Orden de reacción', cols: 3, value: String(S.n), options: [{ v: '0', label: 'Orden 0', sub: 'v = k' }, { v: '1', label: 'Orden 1', sub: 'v = k[A]' }, { v: '2', label: 'Orden 2', sub: 'v = k[A]²' }], onChange: function (v) { ctx.goManual(); setOrder(+v); ui.sK.querySelector('input').min = KR[S.n].min; ui.sK.querySelector('input').max = KR[S.n].max; ui.sK.set(S.k); ui.sA.set(S.A0); } });
      c.appendChild(ui.ord);
      ui.sA = kit.ui.slider({ label: '[A]₀', min: 0.2, max: 2, step: 0.05, value: S.A0, format: function (v) { return f2(v) + ' M'; }, onInput: function (v) { ctx.goManual(); S.A0 = v; S.t = Math.min(S.t, tEnd()); } });
      ui.sK = kit.ui.slider({ label: 'k', min: KR[S.n].min, max: KR[S.n].max, step: KR[S.n].st, value: S.k, format: function (v) { return fmt(v, 3); }, onInput: function (v) { ctx.goManual(); S.k = v; } });
      ui.sT = kit.ui.slider({ label: 't', min: 0, max: 300, step: 0.5, value: S.t, format: function (v) { return fmt(v, 1) + ' s'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.t = Math.min(v, tEnd() * 1.0); } });
      c.appendChild(kit.ui.sliders([ui.sA, ui.sK, ui.sT]));
      c.appendChild(ctx.btnRow([{ t: '▶ Reproducir', primary: true, fn: function () { ctx.goManual(); S.t = 0; S.run = true; } }, { t: 'Reiniciar', fn: function () { ctx.goManual(); S.t = 0; S.run = false; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var m = kit.ui.card('Experimento misterioso (velocidades iniciales)'); el.appendChild(m);
      var box = document.createElement('div'); m.appendChild(box); ui.myst = box;
      function drawM() {
        var t = ratesTable(), h = '<table class="calc-table"><tr><th>[A]₀ (M)</th><td><b>v₀ (M/s)</b></td></tr>' + t.map(function (r) { return '<tr><th>' + f2(r[0]) + '</th><td>' + fmt(r[1], 5) + '</td></tr>'; }).join('') + '</table><p class="muted small">Al duplicar [A], ¿cuántas veces aumenta v? Deduce el orden.</p>';
        box.innerHTML = h; var row = ctx.btnRow([0, 1, 2].map(function (n) { return { t: 'Orden ' + n, fn: function () { var ok = n === S.myst.n; S.guess = n; kit.toast(ok ? '¡Correcto! Orden ' + n + ' (k = ' + fmt(S.myst.k, 4) + ' ' + KR[n].u + '; v₂/v₁ = ' + fmt(Math.pow(2, n), 0) + ')' : 'No: compara v₀ al duplicar [A]'); } }; }).concat([{ t: 'Nuevo misterio', fn: function () { newMyst(); drawM(); } }])); box.appendChild(row);
      }
      drawM();
    },
    graphs: [0, 1, 2].map(function (kind) {
      var titles = ['Concentración [A] frente al tiempo', 'ln[A] frente al tiempo', '1/[A] frente al tiempo'], notes = ['Recta solo en orden 0 (pendiente −k).', 'Recta solo en orden 1 (pendiente −k).', 'Recta solo en orden 2 (pendiente +k).'];
      return { title: titles[kind], h: 180, note: notes[kind] + (kind === S.n ? '' : ''), draw: function (cx, w, h, c) {
        var L = 44, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, tm = tEnd(), vals = [], N = 80, f = function (t) { var a = conc(t); return kind === 0 ? a : (kind === 1 ? Math.log(Math.max(a, 1e-3)) : 1 / Math.max(a, 1e-3)); };
        for (var i = 0; i <= N; i++) vals.push(f(tm * i / N)); var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi - lo < 1e-6) hi = lo + 1; var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
        var sx = function (t) { return L + pw * t / tm; }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var y = Tp + ph - ph * j / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(lo + (hi - lo) * j / 4, kind === 2 ? 1 : 2), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q = 0; q <= 4; q++) cx.fillText(fmt(tm * q / 4, 0), L + pw * q / 4, h - B + 12); cx.fillText('t (s)', L + pw / 2, h - 3);
        cx.strokeStyle = kind === S.n ? '#38a169' : '#9aa7b4'; cx.lineWidth = kind === S.n ? 3 : 2; cx.beginPath(); vals.forEach(function (v, i) { var x = sx(tm * i / N), y = sy(v); if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
        if (kind === S.n) { cx.fillStyle = '#38a169'; cx.textAlign = 'left'; cx.fillText('lineal', L + 8, Tp + 12); }
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(Math.min(S.t, tm)), sy(f(Math.min(S.t, tm))), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } };
    }).concat([{ title: 'Velocidad frente a concentración', h: 180, note: 'v = k[A]ⁿ: horizontal (n = 0), recta (n = 1) o parábola (n = 2).', draw: function (cx, w, h, c) {
      var L = 44, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, vm = rate(S.A0) * 1.05 + 1e-9, sx = function (a) { return L + pw * a / S.A0; }, sy = function (v) { return Tp + ph - ph * v / vm; };
      cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var y = Tp + ph - ph * j / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(vm * j / 4, 4), L - 5, y + 3); }
      cx.textAlign = 'center'; cx.fillText('[A] (M)', L + pw / 2, h - 3); cx.strokeStyle = '#4fa3ff'; cx.lineWidth = 2.6; cx.beginPath(); for (var q = 0; q <= 60; q++) { var a = S.A0 * q / 60, yy = sy(rate(a)); if (q === 0) cx.moveTo(sx(a), yy); else cx.lineTo(sx(a), yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(cA()), sy(rate(cA())), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }]),
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, c = cA(), n = S.n, th = thalf();
      var law = n === 0 ? '[A] = [A]₀ − kt = ' + f2(S.A0) + ' − ' + fmt(S.k, 3) + ' × ' + fmt(S.t, 1) : n === 1 ? '[A] = [A]₀ e^(−kt) = ' + f2(S.A0) + ' × e^(−' + fmt(S.k, 3) + ' × ' + fmt(S.t, 1) + ')' : '1/[A] = 1/[A]₀ + kt = ' + f2(1 / S.A0) + ' + ' + fmt(S.k, 3) + ' × ' + fmt(S.t, 1);
      var t90 = n === 0 ? 0.9 * S.A0 / S.k : (n === 1 ? Math.log(10) / S.k : 9 / (S.k * S.A0));
      return '<div class="card-kicker">Orden ' + n + ' · ' + lawTxt(n) + '</div><div class="calc-step">1 · Ley integrada</div><table class="calc-table">' + row('Ecuación', law) + row('[A] en t = ' + fmt(S.t, 1) + ' s', '<b>' + f3(c) + ' M</b>') + row('v = k[A]ⁿ', fmt(S.k, 3) + ' × ' + f3(c) + (n ? '<sup>' + n + '</sup>' : '⁰') + ' = <b>' + fmt(rate(c), 4) + ' M/s</b>') + '</table>' +
        '<div class="calc-step">2 · Vida media y tiempos</div><table class="calc-table">' + row('t½', (n === 0 ? '[A]₀ / 2k' : n === 1 ? 'ln 2 / k' : '1 / (k[A]₀)') + ' = <b>' + fmt(th, 1) + ' s</b>') + row('Tiempo para consumir 90 %', fmt(t90, 1) + ' s') + row('Fracción restante', fmt(c / S.A0 * 100, 1) + ' %  (' + fmt(Math.log(S.A0 / Math.max(c, 1e-9)) / Math.LN2, 2) + ' vidas medias aprox.)') + '</table>' +
        '<div class="calc-step">3 · Unidades de k</div><table class="calc-table">' + row('Orden ' + n, 'k en ' + KR[n].u + ' (M<sup>1−n</sup>·s⁻¹)') + '</table>';
    },
    quiz: [
      { q: 'Una reacción de primer orden tiene k = 0,0231 s⁻¹. ¿Cuál es su vida media?', options: ['30,0 s', '43,3 s', '15,0 s', '0,0231 s'], answer: 0, why: 't½ = ln 2 / k = 0,693 / 0,0231 = 30,0 s (independiente de la concentración inicial).' },
      { q: 'Al duplicar [A] la velocidad inicial se cuadruplica. ¿Cuál es el orden respecto de A?', options: ['2', '1', '0', '4'], answer: 0, why: '2ⁿ = 4 → n = 2.' },
      { q: 'Reacción de orden cero con [A]₀ = 0,80 M y k = 0,020 M/s. ¿En cuánto tiempo se consume todo A?', options: ['40 s', '20 s', '16 s', '0,016 s'], answer: 0, why: '[A] = [A]₀ − kt = 0 → t = 0,80 / 0,020 = 40 s (la vida media sería 20 s).' },
      { q: 'Reacción de segundo orden con k = 0,50 M⁻¹s⁻¹ y [A]₀ = 0,20 M. ¿Cuál es la vida media?', options: ['10 s', '1,4 s', '2,0 s', '0,10 s'], answer: 0, why: 't½ = 1/(k[A]₀) = 1/(0,50 × 0,20) = 10 s.' },
      { q: '¿Qué gráfico es una recta en una reacción de primer orden?', options: ['ln[A] frente a t', '[A] frente a t', '1/[A] frente a t', 'v frente a t'], answer: 0, why: 'ln[A] = ln[A]₀ − kt: recta de pendiente −k.' },
      { q: '¿Qué unidades tiene k en una reacción de segundo orden global?', options: ['M⁻¹·s⁻¹', 's⁻¹', 'M·s⁻¹', 'M²·s⁻¹'], answer: 0, why: 'v (M/s) = k [A]² (M²) → k = M⁻¹·s⁻¹.' },
      { q: 'Una reacción de primer orden tiene k = 0,0693 s⁻¹. ¿Qué fracción de A queda tras 20 s?', options: ['25 %', '50 %', '12,5 %', '75 %'], answer: 0, why: 't½ = 10 s: 20 s son 2 vidas medias → (1/2)² = 25 %. (También e^(−0,0693·20) = 0,25.)' },
      { q: 'Al triplicar [A] la velocidad inicial se multiplica por 9. ¿Cuál es el orden?', options: ['2', '1', '3', '0'], answer: 0, why: '3ⁿ = 9 → n = 2.' }
    ],
    help: { intro: 'Elige el orden, [A]₀ y k en «Lab», o sigue la lección. Prueba el experimento misterioso.', items: [['Partículas', 'rojas = A, azules = B; las columnas muestran [A] y [B].'], ['Gráficos', 'la gráfica lineal indica el orden (en verde).'], ['Misterio', 'las velocidades iniciales a 3 concentraciones permiten deducir el orden.'], ['Cálculo', 'ley integrada, v y vida media con los valores actuales.']] }
  };
  MSim.create(def);
})();
