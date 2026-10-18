/* Polímeros: adición y condensación — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var P = {
    pe: { n: 'Polietileno (PE)', k: 'a', m: 'CH₂=CH₂', M: 28.05, side: null, c: 0x868e96, u: '–CH₂–CH₂–', use: 'bolsas, envases', tg: '−120' },
    pp: { n: 'Polipropileno (PP)', k: 'a', m: 'CH₂=CH–CH₃', M: 42.08, side: 'me', c: 0x4dabf7, u: '–CH₂–CH(CH₃)–', use: 'tapas, fibras, jeringas', tg: '−10' },
    ps: { n: 'Poliestireno (PS)', k: 'a', m: 'CH₂=CH–C₆H₅', M: 104.15, side: 'ph', c: 0xffa94d, u: '–CH₂–CH(C₆H₅)–', use: 'envases, aislante (plumavit)', tg: '100' },
    pvc: { n: 'PVC', k: 'a', m: 'CH₂=CHCl', M: 62.5, side: 'cl', c: 0x51cf66, u: '–CH₂–CHCl–', use: 'tuberías, cables', tg: '80' },
    n66: { n: 'Nailon 6,6', k: 'c', m: 'ácido adípico + hexametilendiamina', M: 226.32, side: null, c: 0xcc5de8, u: '–[NH(CH₂)₆NHCO(CH₂)₄CO]–', use: 'fibras, engranajes', tg: '50' },
    pet: { n: 'PET', k: 'c', m: 'ácido tereftálico + etilenglicol', M: 192.17, side: null, c: 0x22b8cf, u: '–[OCH₂CH₂OCOC₆H₄CO]–', use: 'botellas, fibras de poliéster', tg: '70' }
  };
  var W = 18.015, S = { p: 'pe', n: 20, ext: 0.98, ph: 0 }, g = null, bb = [], sg = [], ws = [], lab = [], curN = 0;
  function pol() { return P[S.p]; }
  function Xn() { return 1 / (1 - S.ext); }
  function Mn() { var q = pol(); return q.k === 'a' ? S.n * q.M : (Xn() / 2) * q.M; }
  function disp() { return pol().k === 'a' ? 1.5 : 1 + S.ext; }
  function stages() {
    return [
      ['Monómeros y polímeros', 'Monómero', 'Un polímero es una cadena de muchos monómeros unidos covalentemente',
        '<p>Un <b>polímero</b> es una macromolécula formada por la repetición de una <b>unidad</b> derivada de un <b>monómero</b>. Hay dos grandes mecanismos: <b>adición</b> (monómeros con doble enlace, sin pérdida de átomos) y <b>condensación</b> (se libera una molécula pequeña, como H₂O). Cambia de polímero en «Lab».</p>'],
      ['Polimerización por adición', 'Adición', 'Inicio → propagación → terminación (radicales)',
        '<p>En la <b>adición radicalaria</b>, un iniciador genera un radical que ataca el C=C del monómero (<b>inicio</b>); el nuevo radical sigue añadiendo monómeros (<b>propagación</b>) hasta que dos radicales se combinan o se desproporcionan (<b>terminación</b>). La cadena crece unidad por unidad; el producto tiene la misma fórmula empírica que el monómero.</p>'],
      ['Polimerización por condensación', 'Condensación', 'Se libera H₂O en cada enlace; la masa molar sube al final',
        '<p>En la <b>condensación</b> reaccionan grupos funcionales distintos (ácido + amina → amida; ácido + alcohol → éster) y se libera <b>H₂O</b> en cada unión. Cualquier especie puede reaccionar con otra, por eso el tamaño solo es grande cuando la <b>conversión p</b> se acerca a 1: <b>X<sub>n</sub> = 1/(1 − p)</b> (ecuación de Carothers).</p>'],
      ['Masa molar y dispersidad', 'Masa molar', 'Mn = n · M₀ · Đ = Mw/Mn ≥ 1',
        '<p>Un polímero no tiene una masa molar única: es una <b>distribución</b>. El <b>promedio en número Mn</b> cuenta cada cadena igual; el <b>promedio en masa Mw</b> da más peso a las cadenas largas. La <b>dispersidad</b> Đ = Mw/Mn vale 1 sólo si todas las cadenas son iguales; en condensación, Đ = 1 + p ≈ 2.</p>'],
      ['Estructura y propiedades', 'Propiedades', 'Sustituyentes grandes aumentan la rigidez (Tg)',
        '<p>La <b>estructura</b> define las propiedades: los sustituyentes voluminosos (fenilo en PS) o polares (Cl en PVC, amidas en nailon) <b>restringen el movimiento</b> y elevan la temperatura de transición vítrea (Tg). El nailon forma <b>puentes de hidrógeno</b> entre cadenas, lo que da fibras resistentes. Compara los seis polímeros.</p>']
    ];
  }
  var def = {
    key: 'polimeros', title: 'Polímeros: adición y condensación', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 6, 22], target: [6, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [6, 0, 26], target: [6, 0, 0] }],
    layers: [{ id: 'side', label: 'Sustituyentes', icon: '◉' }, { id: 'w', label: 'H₂O liberada', icon: '💧' }],
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
      lab[1].pos(13, -6.2, 0).set(q.k === 'a' ? 'Adición: ' + q.m : 'Condensación: ' + q.m, 'bl-d').vis(true);
      lab[2].pos(13, -7.6, 0).set('unidad: ' + q.u, 'bl-d').vis(true);
      lab[3].pos(13, 4.2, 0).set('Mn ≈ ' + fmt(Mn(), 0) + ' g/mol', 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.p) u.p.set(S.p); if (u.n) u.n.set(S.n); if (u.ext) u.ext.set(S.ext); },
    hud: function () { var q = pol(); return { eq: { chip: 'n', name: 'Cadena', body: '<div class="eqline"><small>Tipo</small>' + (q.k === 'a' ? 'adición' : 'condensación') + '</div><div class="eqline"><small>Unidad M₀</small>' + fmt(q.M, 2) + ' g/mol</div><div class="eqline"><small>Mn</small>' + fmt(Mn(), 0) + ' g/mol</div><div class="eqline"><small>Đ</small>' + fmt(disp(), 2) + '</div>' }, legend: [{ label: 'Esferas', color: '#56606b', text: 'átomos del esqueleto' }, { label: 'Color lateral', color: '#4dabf7', text: 'sustituyente o grupo funcional' }] }; },
    measures: function () { var q = pol(); return [['Polímero', q.n], ['Mecanismo', q.k === 'a' ? 'adición' : 'condensación'], ['M₀ (unidad)', fmt(q.M, 2) + ' g/mol'], ['Xn', q.k === 'a' ? String(S.n) : fmt(Xn(), 1)], ['Mn', fmt(Mn(), 0) + ' g/mol'], ['Đ (Mw/Mn)', fmt(disp(), 2)], ['Tg aprox.', q.tg + ' °C'], ['Usos', q.use]]; },
    ideas: ['Adición: sin pérdida de átomos.', 'Condensación: libera H₂O.', 'Xn = 1/(1 − p).', 'Đ ≥ 1.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Polímero'); el.appendChild(c);
      ui.p = kit.ui.options({ label: 'Polímero', cols: 2, value: S.p, options: Object.keys(P).map(function (k) { return { v: k, label: P[k].n, sub: P[k].k === 'a' ? 'adición' : 'condensación' }; }), onChange: function (v) { ctx.goManual(); S.p = v; } });
      ui.n = kit.ui.slider({ label: 'Grado de polimerización (adición)', min: 1, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.ext = kit.ui.slider({ label: 'Conversión p (condensación)', min: 0.5, max: 0.995, step: 0.005, value: S.ext, format: function (v) { return fmt(v, 3); }, onInput: function (v) { ctx.goManual(); S.ext = v; } });
      c.appendChild(ui.p); c.appendChild(kit.ui.sliders([ui.n, ui.ext])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Ecuación de Carothers', h: 200, note: 'Xn = 1/(1 − p). Un grado alto exige conversión muy cercana a 1.', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var p = 0.5 + 0.495 * i / 100, x = L + pw * i / 100, y = Tp + ph * (1 - Math.min(1, (1 / (1 - p)) / 200)); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ext - 0.5) / 0.495, Tp + ph * (1 - Math.min(1, Xn() / 200)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('p = 0,5', L, h - 8); cx.fillText('p = 0,995', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('Xn 200', L - 4, Tp + 8);
    } }, { title: 'Distribución de tamaños (condensación)', h: 190, note: 'Distribución más probable de Flory: fracción en número de cadenas con x unidades.', draw: function (cx, w, h, col) {
      var L = 20, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, p = S.ext, i, mx = 1 - p; cx.fillStyle = '#4dabf7';
      for (i = 1; i <= 40; i++) { var v = (1 - p) * Math.pow(p, i - 1); cx.fillRect(L + pw * (i - 1) / 40 + 1, Tp + ph * (1 - v / mx), pw / 40 - 2, ph * v / mx); }
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('x = 1', L, h - 8); cx.fillText('x = 40', L + pw, h - 8);
    } }],
    calc: function () {
      var q = pol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (q.k === 'a') return '<div class="card-kicker">' + q.n + ' · adición</div><table class="calc-table">' + row('Mn', 'n · M₀ = ' + S.n + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + ' g/mol</b>') + row('Monómero', q.m + ' (M = ' + fmt(q.M, 2) + ')') + row('Subproducto', 'ninguno: la unidad conserva la fórmula del monómero') + row('Đ típica', '≈ ' + fmt(disp(), 2)) + '</table>';
      return '<div class="card-kicker">' + q.n + ' · condensación</div><table class="calc-table">' + row('Xn (Carothers)', '1/(1 − ' + fmt(S.ext, 3) + ') = <b>' + fmt(Xn(), 1) + '</b>') + row('Mn', '(Xn/2) · M₀ = ' + fmt(Xn() / 2, 1) + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + ' g/mol</b>') + row('H₂O liberada', '1 mol H₂O por enlace (18,015 g/mol)') + row('Đ', '1 + p = <b>' + fmt(disp(), 2) + '</b>') + '</table>';
    },
    quiz: [
      { q: 'La polimerización por adición del eteno produce…', options: ['polietileno sin liberar subproductos', 'nailon', 'PET y agua', 'poliestireno'], answer: 0, why: 'Se abre el C=C.' },
      { q: 'En una policondensación se libera…', options: ['una molécula pequeña (H₂O)', 'un radical', 'ningún producto', 'H₂ siempre'], answer: 0, why: 'Cada enlace amida/éster libera H₂O.' },
      { q: 'Según Carothers, con p = 0,99 el grado de polimerización es…', options: ['100', '99', '10', '1000'], answer: 0, why: '1/(1 − 0,99).' },
      { q: 'Un polímero con Đ = 1,0 tiene…', options: ['todas las cadenas del mismo tamaño', 'cadenas muy diversas', 'solo monómeros', 'mayor Mw que Mn'], answer: 0, why: 'Mw = Mn.' },
      { q: '¿Qué polímero tiene un sustituyente fenilo?', options: ['poliestireno', 'PVC', 'polipropileno', 'polietileno'], answer: 0, why: 'Estireno = vinilbenceno.' },
      { q: 'El nailon 6,6 se forma por reacción de…', options: ['un diácido y una diamina', 'etileno y propileno', 'un diol y un diéster de vinilo', 'cloruro de vinilo'], answer: 0, why: 'Se forman enlaces amida.' }
    ],
    help: { intro: 'Elige un polímero y su tamaño. Las esferas oscuras son el esqueleto; las de color, sustituyentes o grupos funcionales. En condensación caen las moléculas de agua liberadas.', items: [['Esferas rojas', 'H₂O liberada.'], ['Esferas laterales', 'sustituyente o grupo funcional.']] }
  };
  MSim.create(def);
})();
