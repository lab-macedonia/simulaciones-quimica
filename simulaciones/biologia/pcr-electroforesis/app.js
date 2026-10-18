/* PCR y electroforesis en gel — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, LAD = [100, 200, 300, 500, 750, 1000, 1500];
  var S = { cyc: 25, ta: 57, len: 24, gc: 60, bp: 500, ph: 0 }, g = null, str = [], gel = null, bands = [], lab = [], tube = null;
  function tm() { return 64.9 + 41 * (S.gc / 100 * S.len - 16.4) / S.len; }
  function eff() { var d = S.ta - (tm() - 5); return 0.95 * Math.exp(-Math.pow(Math.max(0, d) / 6, 2)); }
  function ns() { var d = S.ta - (tm() - 5); return Math.max(0, Math.min(1, (-d - 3) / 10)); }
  function copies(c) { var n = 1e3 * Math.pow(1 + eff(), c); var cap = 1e12; return n > cap ? cap : n; }
  function inten(n) { return Math.max(0, Math.min(1, (Math.log10(n) - 3) / 9)); }
  function ypos(bp) { return 4.5 - (Math.log10(bp) - 1.7) * 6; }
  function stages() {
    return [
      ['Los componentes', 'Componentes', 'Molde, dos cebadores, polimerasa Taq, dNTP y tampón',
        '<p>La <b>PCR</b> amplifica un fragmento de ADN entre dos <b>cebadores</b>. Necesita ADN molde, cebadores directo e inverso, <b>dNTP</b>, tampón con Mg²⁺ y una <b>ADN polimerasa termoestable</b> (Taq). Todo ocurre en un <b>termociclador</b> que repite ciclos de temperatura.</p>'],
      ['Un ciclo', 'Ciclo', 'Desnaturalización 94 °C → hibridación ~55–60 °C → extensión 72 °C',
        '<p>Cada ciclo tiene tres etapas: <b>desnaturalización</b> (~94 °C, las hebras se separan), <b>hibridación</b> (~Tm − 5 °C, los cebadores se unen) y <b>extensión</b> (72 °C, la polimerasa sintetiza la hebra nueva). Al final del ciclo hay el doble de copias.</p>'],
      ['Amplificación exponencial', 'Exponencial', 'Copias = N₀ · (1 + E)ⁿ',
        '<p>Con eficiencia ideal el número de copias se <b>duplica</b> en cada ciclo: N = N₀·2ⁿ. Tras 30 ciclos hay ~10⁹ veces más ADN. En la práctica la eficiencia E es menor que 1 y al final llega a una <b>meseta</b> por falta de reactivos.</p>'],
      ['Temperatura de hibridación', 'Hibridación', 'Ta ≈ Tm − 5 °C: muy alta no hibrida, muy baja amplifica inespecíficamente',
        '<p>La <b>Tm</b> depende del largo y del %GC del cebador. Si la temperatura de hibridación es <b>muy alta</b>, los cebadores no se unen y casi no hay producto; si es <b>muy baja</b>, se unen donde no deben y aparecen <b>bandas inespecíficas</b>.</p>'],
      ['Electroforesis en gel', 'Gel', 'El ADN (carga −) migra al polo + y los fragmentos pequeños recorren más',
        '<p>El ADN tiene carga negativa y en un campo eléctrico migra hacia el <b>ánodo (+)</b> a través del gel de agarosa; los <b>fragmentos pequeños</b> avanzan más. Se compara con una <b>escalera de pesos moleculares</b> para estimar el tamaño. El control sin molde no debe mostrar banda.</p>']
    ];
  }
  var def = {
    key: 'pcr-electroforesis', title: 'PCR y electroforesis en gel', subtitle: 'Simulador 3D · biología molecular', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 4, 27], target: [6, 1, 0] }, { id: 'gel', label: 'Gel', pos: [13, 1, 15], target: [13, 0, 0] }],
    layers: [{ id: 'gel', label: 'Gel', icon: '▦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      tube = new T.Mesh(new T.CylinderGeometry(3, 1.2, 9, 24, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(3, 2, 0); g.add(tube);
      for (i = 0; i < 24; i++) { var G = new T.Group(); var a = new T.Mesh(new T.BoxGeometry(2.2, 0.12, 0.12), new T.MeshStandardMaterial({ color: 0x4dabf7 })), b = new T.Mesh(new T.BoxGeometry(2.2, 0.12, 0.12), new T.MeshStandardMaterial({ color: 0xff8787 })); G.add(a); G.add(b); G.userData = { a: a, b: b, s: i }; var ang = i * 2.399, rr = 0.4 + (i % 5) * 0.3; G.position.set(3 + Math.cos(ang) * rr, 0.2 + (i * 0.31) % 4.2, Math.sin(ang) * rr); G.rotation.z = (i % 7) * 0.4; g.add(G); str.push(G); }
      gel = new T.Group(); gel.position.set(15, 0, 0); g.add(gel); var slab = new T.Mesh(new T.BoxGeometry(10, 12, 0.8), new T.MeshStandardMaterial({ color: 0x748ffc, transparent: true, opacity: 0.35 })); gel.add(slab);
      for (i = 0; i < 3; i++) { var w = new T.Mesh(new T.BoxGeometry(2, 0.35, 0.9), new T.MeshStandardMaterial({ color: 0x364fc7 })); w.position.set(-3 + i * 3, 5.2, 0.05); gel.add(w); }
      for (i = 0; i < LAD.length + 4; i++) { var bd = new T.Mesh(new T.BoxGeometry(2, 0.22, 0.95), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaffcc, emissiveIntensity: 0.8, transparent: true })); gel.add(bd); bands.push(bd); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i, k;
      if (!P.manual) { if (i === 0) { S.ph = 0; S.cyc = 0; } if (i === 1) { S.ph = f.local; S.cyc = 1; } if (i === 2) { S.cyc = Math.round(f.local * 30); S.ph = (f.local * 30) % 1; S.ta = 57; S.len = 24; S.gc = 60; } if (i === 3) { S.ta = 45 + 25 * f.local; S.cyc = 30; } if (i === 4) { S.ta = 57; S.cyc = 30; S.bp = 500; } }
      var phs = S.ph, nS = Math.min(24, Math.max(1, Math.round(Math.pow(2, Math.min(S.cyc, 4.6)))));
      str.forEach(function (G, j) { G.visible = j < nS; var sep = phs < 0.33 ? Math.min(1, phs / 0.2) * 0.55 : (phs < 0.66 ? 0.55 : 0.55 * (1 - (phs - 0.66) / 0.34)); G.userData.a.position.y = sep * 0.5; G.userData.b.position.y = -sep * 0.5; });
      var gOn = ctx.layer('gel') && (i === 4 || P.manual); gel.visible = ctx.layer('gel');
      var all = [];
      bands.forEach(function (b) { b.visible = false; });
      LAD.forEach(function (bp, j) { var b = bands[j]; b.visible = true; b.position.set(-3, ypos(bp), 0.05); b.material.opacity = 0.75; b.material.emissiveIntensity = 0.7; });
      var main = copies(S.cyc), idx = LAD.length, mb = bands[idx];
      mb.visible = inten(main) > 0.12; mb.position.set(0, ypos(S.bp), 0.05); mb.material.opacity = 0.2 + 0.8 * inten(main); mb.material.emissiveIntensity = 0.3 + 1.2 * inten(main);
      var n1 = bands[idx + 1], n2 = bands[idx + 2], q = ns(); [n1, n2].forEach(function (b, j) { b.visible = q > 0.05 && inten(main) > 0.12; b.position.set(0, ypos(S.bp * (j ? 1.6 : 0.55)), 0.05); b.material.opacity = 0.15 + 0.7 * q * inten(main); b.material.emissiveIntensity = 0.2 + q; });
      var nt = bands[idx + 3]; nt.visible = q > 0.4; nt.position.set(3, ypos(60), 0.05); nt.material.opacity = 0.15 + 0.4 * q; nt.material.emissiveIntensity = 0.2;
      lab[0].pos(3, 7.4, 0).set('Tubo · ' + (phs < 0.33 ? 'desnaturalización 94 °C' : phs < 0.66 ? 'hibridación ' + fmt(S.ta, 0) + ' °C' : 'extensión 72 °C'), 'bl-lead').vis(true);
      lab[1].pos(3, -3.2, 0).set('ciclo ' + Math.round(S.cyc) + ' · ' + ctxSci(copies(S.cyc) / 1e3) + ' × N₀', 'bl-d').vis(true);
      lab[2].pos(12, -6.8, 0).set('Escalera', 'bl-d').vis(gel.visible); lab[3].pos(15, -6.8, 0).set('Muestra', 'bl-pos').vis(gel.visible); lab[4].pos(18, -6.8, 0).set('Control', 'bl-d').vis(gel.visible);
    },
    sync: function (ctx) { var u = ctx.ui; ['cyc', 'ta', 'len', 'gc', 'bp'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'PCR', name: 'Amplificación', body: '<div class="eqline"><small>Tm cebador</small>' + fmt(tm(), 1) + ' °C</div><div class="eqline"><small>Ta</small>' + fmt(S.ta, 0) + ' °C</div><div class="eqline"><small>Eficiencia</small>' + fmt(eff() * 100, 0) + ' %</div><div class="eqline"><small>Inespecífico</small>' + fmt(ns() * 100, 0) + ' %</div>' }, legend: [{ label: 'Azul/rojo', color: '#4dabf7', text: 'hebras del ADN' }, { label: 'Bandas', color: '#c0ffd0', text: 'fragmentos en el gel' }] }; },
    measures: function () { return [['Ciclos', String(Math.round(S.cyc))], ['Tm cebador', fmt(tm(), 1) + ' °C'], ['Ta', fmt(S.ta, 0) + ' °C'], ['Eficiencia', fmt(eff() * 100, 0) + ' %'], ['Amplificación', ctxSci(copies(S.cyc) / 1e3) + '×'], ['Tamaño esperado', S.bp + ' pb']]; },
    ideas: ['Duplicación por ciclo: 2ⁿ.', 'Ta ≈ Tm − 5 °C.', 'Ta baja → bandas inespecíficas.', 'Fragmentos pequeños migran más.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Programa del termociclador'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('cyc', 'Ciclos', 0, 40, 1, function (v) { return String(v); }), sl('ta', 'Temperatura de hibridación', 40, 72, 1, function (v) { return v + ' °C'; }), sl('len', 'Largo del cebador', 15, 30, 1, function (v) { return v + ' nt'; }), sl('gc', '% GC del cebador', 30, 70, 5, function (v) { return v + ' %'; }), sl('bp', 'Tamaño del producto', 100, 1500, 50, function (v) { return v + ' pb'; })])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Perfil del termociclador (un ciclo)', h: 190, note: '94 °C → Ta → 72 °C', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, y = function (t) { return Tp + ph * (1 - (t - 40) / 60); };
      cx.strokeStyle = '#ff8787'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L, y(94)); cx.lineTo(L + pw * 0.33, y(94)); cx.lineTo(L + pw * 0.38, y(S.ta)); cx.lineTo(L + pw * 0.62, y(S.ta)); cx.lineTo(L + pw * 0.67, y(72)); cx.lineTo(L + pw, y(72)); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; [40, 72, 94].forEach(function (t) { cx.fillText(t + ' °C', L - 4, y(t) + 3); }); cx.textAlign = 'center'; cx.fillText('tiempo', L + pw / 2, h - 6);
    } }, { title: 'Copias frente a ciclos', h: 190, note: 'Escala logarítmica con meseta.', draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#69db7c'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 40; i++) { var v = Math.log10(copies(i)) - 3, x = L + pw * i / 40, y = Tp + ph * (1 - v / 9); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * S.cyc / 40, Tp + ph * (1 - (Math.log10(copies(S.cyc)) - 3) / 9), 4, 0, 6.28); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('40 ciclos', L + pw, h - 8);
    } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">Cebador de ' + S.len + ' nt con ' + S.gc + ' % GC</div><table class="calc-table">' + row('Tm', '64,9 + 41 (%GC·L − 16,4)/L = <b>' + fmt(tm(), 1) + ' °C</b>') + row('Ta recomendada', 'Tm − 5 = <b>' + fmt(tm() - 5, 1) + ' °C</b>') + row('Eficiencia estimada', '<b>' + fmt(eff() * 100, 0) + ' %</b>') + row('Copias tras ' + Math.round(S.cyc) + ' ciclos', 'N₀ · (1 + E)ⁿ = <b>' + ctxSci(copies(S.cyc) / 1e3) + ' × N₀</b>') + row('Ideal (E = 1)', '2ⁿ = ' + ctxSci(Math.pow(2, S.cyc))) + '</table>';
    },
    quiz: [
      { q: 'El orden de las etapas de un ciclo de PCR es…', options: ['desnaturalización, hibridación, extensión', 'extensión, hibridación, desnaturalización', 'hibridación, desnaturalización, extensión', 'desnaturalización, extensión, hibridación'], answer: 0, why: '94 °C, ~55 °C, 72 °C.' },
      { q: 'Con eficiencia 100 %, tras 10 ciclos hay…', options: ['1024 veces más ADN', '100 veces', '20 veces', '10 veces'], answer: 0, why: '2¹⁰.' },
      { q: 'Si la temperatura de hibridación es demasiado baja aparecen…', options: ['bandas inespecíficas', 'ninguna banda', 'bandas más grandes', 'mejor rendimiento sin cambios'], answer: 0, why: 'Los cebadores se unen a sitios parciales.' },
      { q: 'En el gel de agarosa el ADN migra hacia…', options: ['el polo positivo', 'el polo negativo', 'ambos', 'no migra'], answer: 0, why: 'Carga negativa por los fosfatos.' },
      { q: 'Los fragmentos más pequeños…', options: ['recorren más distancia', 'recorren menos', 'quedan en el pocillo', 'migran al otro lado'], answer: 0, why: 'Atraviesan mejor la malla.' },
      { q: 'El control sin molde sirve para…', options: ['detectar contaminación', 'medir la Tm', 'dar la escalera', 'aumentar el producto'], answer: 0, why: 'No debe mostrar la banda.' }
    ],
    help: { intro: 'Ajusta ciclos, temperatura de hibridación y cebadores. A la izquierda está el tubo; a la derecha, el gel con la escalera, la muestra y el control sin molde.', items: [['Hebras azul/rojo', 'ADN molde y copias.'], ['Bandas verdes', 'productos de PCR.']] }
  };
  function ctxSci(x) { var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (!isFinite(e) || e < 3) return fmt(x, 0); return fmt(x / Math.pow(10, e), 2) + ' × 10' + String(e).replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  MSim.create(def);
})();
