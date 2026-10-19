/* Cromatografía en capa fina y en columna — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var CP = { fe: { n: 'Ferroceno', p: 1, c: 0xff922b }, az: { n: 'Azobenceno', p: 2.5, c: 0xf76707 }, fl: { n: 'Fluorenona', p: 4, c: 0xfcc419 }, bh: { n: 'Benzhidrol', p: 6, c: 0x74c0fc }, ba: { n: 'Ácido benzoico', p: 8, c: 0xb197fc } };
  var EL = { hex: { n: 'Hexano', e: 0 }, tol: { n: 'Tolueno', e: 2.5 }, dcm: { n: 'Diclorometano', e: 4 }, ea: { n: 'Acetato de etilo', e: 6 }, ace: { n: 'Acetona', e: 7 }, met: { n: 'Metanol', e: 9 } };
  var S = { sel: { fe: 1, fl: 1, bh: 1, az: 0, ba: 0 }, el: 'dcm', es: 4, mode: 'tlc', p: 0, run: false }, lab = [], g = null, spots = {}, front = null, bands = {}, colm = null;
  function rf(k, e) { return 1 / (1 + Math.exp(0.7 * (CP[k].p - e))); }
  function sel() { return Object.keys(CP).filter(function (k) { return S.sel[k]; }); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Fase estacionaria y fase móvil', 'Fundamentos', 'La sílice (polar) retiene más a los compuestos polares; el eluyente los arrastra',
        '<p>En <b>cromatografía de adsorción</b> la <b>fase estacionaria</b> (sílice, polar) retiene los compuestos en proporción a su <b>polaridad</b>; la <b>fase móvil</b> (eluyente) los arrastra. Un compuesto apolar avanza más; uno polar se queda cerca del origen. Un eluyente más polar «compite» con la sílice y mueve todo más rápido.</p>'],
      ['Placa de capa fina (TLC)', 'TLC', 'Rf = distancia del compuesto / distancia del frente del disolvente',
        '<p>En la <b>placa TLC</b> se siembra la muestra sobre la <b>línea base</b> y se coloca en una cámara con eluyente. El disolvente sube por capilaridad. Al sacar la placa se marca el <b>frente</b>. El <b>factor de retención</b> es <b>R<sub>f</sub> = d<sub>compuesto</sub>/d<sub>frente</sub></b>, siempre entre 0 y 1. Un R<sub>f</sub> de 0,3–0,5 suele ser ideal para separar.</p>'],
      ['Elegir el eluyente', 'Eluyente', 'Más polar → Rf mayor. Ajusta hasta separar las manchas',
        '<p>Con <b>hexano</b> (apolar) casi nada se mueve; con <b>metanol</b> todo sube con el frente. Se prueban mezclas hasta lograr que las manchas queden entre R<sub>f</sub> 0,2 y 0,8 y <b>bien separadas</b> (ΔR<sub>f</sub> ≥ 0,1–0,15). Cambia el eluyente y observa el orden de elución: <b>apolares primero</b>.</p>'],
      ['Columna cromatográfica', 'Columna', 'Se separan por bandas que salen en orden de polaridad creciente',
        '<p>La <b>columna</b> es la TLC a escala preparativa: la muestra se carga arriba sobre sílice y se eluye. Las <b>bandas</b> descienden a distinta velocidad, y se recogen <b>fracciones</b> en tubos. El volumen de elución es <b>V<sub>e</sub> = V<sub>0</sub>(1 + k′)</b>, con k′ = (1 − R<sub>f</sub>)/R<sub>f</sub>. Las fracciones se siguen por TLC.</p>'],
      ['Resolución y pureza', 'Resolución', 'Dos manchas se separan bien si ΔRf es grande y las manchas son pequeñas',
        '<p>Para que dos compuestos se separen, la <b>diferencia de R<sub>f</sub></b> debe ser suficiente y las manchas estrechas (no sobrecargar la placa). En columna, la <b>resolución</b> R<sub>s</sub> compara la distancia entre picos con su ancho; R<sub>s</sub> ≥ 1,5 indica separación completa.</p>']
    ];
  }
  var def = {
    key: 'cromatografia', title: 'Cromatografía TLC y columna', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 3, 22], target: [0, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 24], target: [0, 1, 0] }],
    layers: [{ id: 'sp', label: 'Manchas y bandas', icon: '●' }, { id: 'ch', label: 'Cámara', icon: '▢' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var gl = mat(0xa5d8ff, 0.15), i;
      var ch = new T.Mesh(new T.BoxGeometry(9, 12, 4), gl); ch.position.set(-6, 0, 0); ch.name = 'ch'; g.add(ch);
      var pl = new T.Mesh(new T.BoxGeometry(5, 10, 0.2), mat(0xf1f3f5, 1)); pl.position.set(-6, 0.3, 0); g.add(pl);
      var bl = new T.Mesh(new T.BoxGeometry(5.1, 0.08, 0.3), mat(0x495057, 1)); bl.position.set(-6, -3.8, 0.1); g.add(bl);
      front = new T.Mesh(new T.BoxGeometry(5.1, 0.07, 0.25), mat(0x228be6, 1)); front.position.set(-6, -3.8, 0.12); g.add(front);
      var liq = new T.Mesh(new T.BoxGeometry(8.8, 1.6, 3.8), mat(0xbac8ff, 0.4)); liq.position.set(-6, -5.1, 0); g.add(liq);
      Object.keys(CP).forEach(function (k, j) { var s = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.06, 20), mat(CP[k].c, 1)); s.rotation.x = Math.PI / 2; s.position.set(-7.6 + j * 0.8, -3.8, 0.2); g.add(s); spots[k] = s;
        var b = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.5, 20), mat(CP[k].c, 0.85)); b.position.set(6, 6, 0); g.add(b); bands[k] = b; });
      colm = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 11, 24, 1, true), gl); colm.position.set(6, 0.5, 0); g.add(colm);
      var sil = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 9.5, 24), mat(0xe9ecef, 0.8)); sil.position.set(6, 0, 0); g.add(sil); g.userData.sil = sil;
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, e = EL[S.el].e, ks = sel(), sOn = ctx.layer('sp'), chOn = ctx.layer('ch');
      if (!P.manual) { S.mode = i === 3 ? 'col' : 'tlc'; S.p = Math.min(1, f.local * 1.1); if (i === 0) { S.sel = { fe: 1, fl: 1, bh: 1, az: 0, ba: 0 }; S.el = 'dcm'; } if (i === 2) { S.el = ['hex', 'tol', 'dcm', 'ea', 'ace', 'met'][Math.min(5, Math.floor(f.local * 6))]; S.p = 1; } if (i === 4) { S.p = 1; S.sel = { fe: 1, az: 1, fl: 1, bh: 1, ba: 1 }; S.el = 'dcm'; } e = EL[S.el].e; ks = sel(); }
      else if (S.run) { S.p += dt / 10; if (S.p >= 1) { S.p = 1; S.run = false; } }
      var p = S.p;
      g.children.forEach(function (o) { if (o.name === 'ch') o.visible = chOn; });
      var H = 7.2, fy = -3.8 + H * p;
      front.position.y = fy; front.visible = S.mode === 'tlc';
      Object.keys(CP).forEach(function (k) { var on = S.sel[k] && sOn; spots[k].visible = on && S.mode === 'tlc'; spots[k].position.y = -3.8 + H * p * rf(k, e); spots[k].scale.set(1 + 0.4 * p, 1, 1 + 0.4 * p);
        var b = bands[k]; b.visible = on && S.mode === 'col'; var Vt = p * 30 * 1.0, ke = (1 - rf(k, e)) / rf(k, e), pos = Math.min(1, Vt / (3 * (1 + ke))); b.position.y = 4.5 - pos * 9.5; b.scale.y = 1 + 2 * pos; });
      g.userData.sil.visible = S.mode === 'col'; colm.visible = S.mode === 'col';
      var ls = 0; Object.keys(CP).forEach(function (k, j) { if (S.mode === 'tlc' && S.sel[k]) { lab[ls].pos(-3.2, -3.8 + H * p * rf(k, e), 0.3).set(CP[k].n + ' · Rf ' + fmt(rf(k, e), 2), 'bl-d').vis(p > 0.2 && sOn); ls++; } });
      for (var q = ls; q < 6; q++) lab[q].vis(false);
      if (S.mode === 'col') lab[0].pos(6, 7, 0).set('Columna de sílice · eluyente ' + EL[S.el].n, 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.el) u.el.set(S.el); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var e = EL[S.el].e, ks = sel(); return { eq: { chip: 'Rf', name: 'Eluyente: ' + EL[S.el].n, body: ks.map(function (k) { return '<div class="eqline"><small>' + CP[k].n + '</small>' + fmt(rf(k, e), 2) + '</div>'; }).join('') }, legend: Object.keys(CP).map(function (k) { return { label: CP[k].n, color: '#' + CP[k].c.toString(16).padStart(6, '0'), text: 'polaridad ' + CP[k].p }; }) }; },
    measures: function () { var e = EL[S.el].e, ks = sel().sort(function (a, b) { return rf(b, e) - rf(a, e); }), r = [['Eluyente', EL[S.el].n + ' (fuerza ' + EL[S.el].e + ')']]; ks.forEach(function (k, j) { r.push([CP[k].n, 'Rf ' + fmt(rf(k, e), 2) + (j ? ' · ΔRf ' + fmt(rf(ks[j - 1], e) - rf(k, e), 2) : '')]); }); return r; },
    ideas: ['Apolares salen primero.', 'Eluyente más polar → Rf mayor.', 'Rf óptimo 0,3–0,5.', 'La columna aplica el mismo principio a escala preparativa.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra'); el.appendChild(c);
      var tg = document.createElement('div'); tg.className = 'opts two'; c.appendChild(tg);
      Object.keys(CP).forEach(function (k) { var b = document.createElement('button'); b.className = 'opt'; b.innerHTML = CP[k].n + '<small>polaridad ' + CP[k].p + '</small>'; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); b.addEventListener('click', function () { ctx.goManual(); S.sel[k] = S.sel[k] ? 0 : 1; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); }); tg.appendChild(b); });
      ui.el = kit.ui.options({ label: 'Eluyente', cols: 2, value: S.el, options: Object.keys(EL).map(function (k) { return { v: k, label: EL[k].n }; }), onChange: function (v) { ctx.goManual(); S.el = v; } }); c.appendChild(ui.el);
      ui.p = kit.ui.slider({ label: 'Avance de elución', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: '▶ Eluir TLC', primary: true, fn: function () { ctx.goManual(); S.mode = 'tlc'; S.p = 0; S.run = true; } }, { t: 'Columna', fn: function () { ctx.goManual(); S.mode = 'col'; S.p = 0; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Rf frente a la fuerza del eluyente', h: 240, note: 'Cada curva es un compuesto; línea vertical = eluyente actual.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(i, L + pw * i / 10, h - B + 14); cx.fillText('fuerza del eluyente', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 4, 2), L - 4, Tp + ph * (1 - i / 4) + 3);
        Object.keys(CP).forEach(function (k) { cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = S.sel[k] ? 3 : 1; cx.beginPath(); for (i = 0; i <= 100; i++) { var e = i / 10; (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * e / 10, Tp + ph * (1 - rf(k, e))); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * EL[S.el].e / 10, Tp); cx.lineTo(L + pw * EL[S.el].e / 10, Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#69db7c'; cx.setLineDash([2, 3]); [0.3, 0.5].forEach(function (v) { cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - v)); cx.lineTo(L + pw, Tp + ph * (1 - v)); cx.stroke(); }); cx.setLineDash([]);
      } },
      { title: 'Cromatograma de elución en columna', h: 230, note: 'Picos gaussianos en V = V₀(1 + k′) con ancho proporcional a √V.', draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, e = EL[S.el].e, Vmax = 40, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('volumen de elución (V₀ = 3 mL)', L + pw / 2, h - 6);
        sel().forEach(function (k) { var ke = (1 - rf(k, e)) / rf(k, e), V = 3 * (1 + ke), s = 0.25 * Math.sqrt(V); cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 200; i++) { var v = Vmax * i / 200, y = Math.exp(-0.5 * Math.pow((v - V) / s, 2)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * v / Vmax, Tp + ph * (1 - y * 0.9)); } cx.stroke(); cx.fillStyle = col.muted; if (V < Vmax) cx.fillText(fmt(V, 0), L + pw * V / Vmax, Tp + ph + 12); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () { var e = EL[S.el].e, ks = sel(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">Eluyente: ' + EL[S.el].n + ' (fuerza ' + e + ')</div><table class="calc-table">' + ks.map(function (k) { var r = rf(k, e), kk = (1 - r) / r; return row(CP[k].n, 'Rf = <b>' + fmt(r, 2) + '</b> · k′ = ' + fmt(kk, 2) + ' · Vₑ = ' + fmt(3 * (1 + kk), 1) + ' mL'); }).join('') + '</table><p class="muted small">Modelo didáctico: Rf = 1/(1 + e<sup>0,7(p − e)</sup>), con p la polaridad del compuesto y e la fuerza del eluyente.</p>'; },
    quiz: [
      { q: 'En sílice, el compuesto que sale primero es el más…', options: ['apolar', 'polar', 'iónico', 'denso'], answer: 0, why: 'Interactúa menos con la sílice.' },
      { q: 'Rf se define como…', options: ['d compuesto / d frente', 'd frente / d compuesto', 'd compuesto − d frente', 'tiempo / masa'], answer: 0, why: 'Siempre entre 0 y 1.' },
      { q: 'Si todas las manchas quedan en la línea base, el eluyente es…', options: ['poco polar; hay que aumentarlo', 'demasiado polar', 'perfecto', 'insoluble'], answer: 0, why: 'No logra desplazar los compuestos de la sílice.' },
      { q: 'Un buen Rf para separar está entre…', options: ['0,3 y 0,5', '0,9 y 1,0', '0,0 y 0,05', '1,2 y 1,5'], answer: 0, why: 'Hay margen a ambos lados.' },
      { q: 'En una columna, el compuesto más polar…', options: ['eluye al final', 'eluye primero', 'no eluye', 'se evapora'], answer: 0, why: 'Está más retenido.' }
    ],
    help: { intro: 'Marca los compuestos de la muestra, elige el eluyente y pulsa «Eluir TLC» o «Columna».', items: [['Línea celeste', 'frente del disolvente.'], ['Manchas', 'posición = Rf × distancia del frente.']] }
  };
  MSim.create(def);
})();
