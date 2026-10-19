/* Punto de fusión y pureza — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, R = 8.314;
  var CM = { ba: { n: 'Ácido benzoico', Tm: 122.4, H: 18000, c: 0xf8f9fa }, ur: { n: 'Urea', Tm: 133, H: 14000, c: 0xe9ecef }, na: { n: 'Naftaleno', Tm: 80.3, H: 19100, c: 0xdee2e6 }, ac: { n: 'Acetanilida', Tm: 114.3, H: 21600, c: 0xf1f3f5 }, sa: { n: 'Ácido salicílico', Tm: 159, H: 25000, c: 0xe9ecef } };
  var S = { cm: 'ba', xi: 0, rate: 2, T: 25, run: false, mix: 'none', obs: null }, lab = [], g = null, cap = null, sol = null, liqm = null, tube = null;
  function ints(k, xi) { var c = CM[k], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * xi, Te = c.Tm - 35, liq = Math.max(Te + 1, c.Tm - dT); return { onset: xi > 0.001 ? Math.max(Te, c.Tm - Math.min(35, 4 + 90 * xi)) : c.Tm - 0.3, clear: xi > 0.001 ? liq : c.Tm + 0.3 }; }
  function range() { var i = ints(S.cm, S.xi), lag = 0.9 * S.rate; return { on: i.onset, cl: i.clear, onM: i.onset + lag * 0.5, clM: i.clear + lag }; }
  function frac(Tt) { var r = range(); return Math.max(0, Math.min(1, (Tt - r.onM) / Math.max(0.2, r.clM - r.onM))); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.4, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Qué mide el punto de fusión', 'Fundamentos', 'Temperatura a la que un sólido cristalino pasa a líquido; es un criterio de identidad y pureza',
        '<p>El <b>punto de fusión</b> es la temperatura en que coexisten sólido y líquido. Un compuesto <b>puro</b> funde en un <b>rango estrecho</b> (0,5–1 °C). Se mide en un tubo <b>capilar</b> con unos pocos milímetros de muestra, dentro de un bloque calefactor con termómetro. Se anotan dos valores: <b>inicio</b> (primera gota) y <b>final</b> (todo líquido).</p>'],
      ['Impurezas: depresión y ensanchamiento', 'Pureza', 'Una impureza baja y ensancha el rango de fusión',
        '<p>Una impureza soluble en el líquido <b>disminuye el punto de fusión</b> (depresión del punto de congelación): ΔT ≈ R·T<sub>m</sub>²·x<sub>imp</sub>/ΔH<sub>fus</sub>. El sólido empieza a fundir a una temperatura cercana al <b>eutéctico</b> y termina más abajo que el puro: el rango se <b>ensancha</b>. Por eso un rango amplio indica una muestra impura.</p>'],
      ['Velocidad de calentamiento', 'Velocidad', 'Calentar rápido desplaza y ensancha el rango observado',
        '<p>La muestra y el termómetro no están en equilibrio si se calienta rápido: el valor observado queda <b>por encima</b> del real y el rango aparece más ancho. Lo recomendable es acercarse rápidamente a ~15 °C del valor esperado y luego calentar a <b>1–2 °C/min</b>. Usa el control de velocidad y compara.</p>'],
      ['Punto de fusión mixto', 'Mixto', 'Si la mezcla con un patrón no baja el punto, ambos son el mismo compuesto',
        '<p>Para identificar un desconocido se mezcla con un <b>patrón</b> y se mide el <b>punto de fusión mixto</b>. Si son el mismo compuesto, el punto de fusión <b>no cambia</b>; si son distintos, la mezcla <b>funde más bajo y en un rango amplio</b>. Activa «Mezcla con otro compuesto» para simularlo.</p>'],
      ['Diagrama sólido–líquido', 'Diagrama', 'Eutéctico: la mezcla de menor punto de fusión',
        '<p>El diagrama T–x muestra la curva <b>liquidus</b> (por encima todo es líquido) y la <b>solidus</b> o línea eutéctica (por debajo todo es sólido). Entre ambas coexisten sólido y líquido. El rango observado corresponde a la distancia vertical entre ambas curvas para la composición de la muestra.</p>']
    ];
  }
  var def = {
    key: 'punto-fusion', title: 'Punto de fusión y pureza', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [4, 3, 16], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 18], target: [0, 0, 0] }],
    layers: [{ id: 'cap', label: 'Zoom al capilar', icon: '🔍' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g);
      var blk = new T.Mesh(new T.BoxGeometry(8, 9, 5), mat(0x868e96, 1)); blk.position.set(-3, 0, -1); g.add(blk);
      var win = new T.Mesh(new T.BoxGeometry(5, 5, 0.2), mat(0xa5d8ff, 0.3)); win.position.set(-3, 0, 1.55); g.add(win);
      tube = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 10, 12, 1, true), mat(0xdee2e6, 0.4)); tube.position.set(-3, 0, 1.2); g.add(tube);
      sol = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xf8f9fa, 1)); sol.position.set(-3, -2, 1.2); g.add(sol);
      liqm = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xffd8a8, 0.6)); liqm.position.set(-3, -2, 1.2); g.add(liqm);
      var th = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 14, 10), mat(0xe03131, 0.8)); th.position.set(-1.5, 2, 1.2); g.add(th);
      cap = new T.Group(); cap.position.set(7, 0, 0); g.add(cap);
      for (var i = 0; i < 36; i++) { var cr = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), mat(0xf8f9fa, 1)); cr.userData = { a: Math.random() * 6.28, r: Math.random(), y: Math.random() }; cap.add(cr); }
      var gl = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 7, 20, 1, true), mat(0xdee2e6, 0.25)); cap.add(gl);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, c = CM[S.cm], r;
      if (!P.manual) { var i = f.i; S.xi = i === 0 ? 0 : (i === 1 ? 0.12 * f.local : (i === 3 ? 0.2 : (i === 4 ? 0.1 : 0))); S.rate = i === 2 ? 1 + 9 * f.local : 2; S.mix = i === 3 ? 'diff' : 'none'; S.T = 20 + (c.Tm + 15 - 20) * Math.min(1, f.local * 1.05); }
      else if (S.run) { S.T += S.rate / 60 * dt * 20; if (S.T > c.Tm + 20) { S.T = c.Tm + 20; S.run = false; } }
      var xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi; var save = S.xi; S.xi = xe; r = range(); var fr = frac(S.T); S.xi = save;
      sol.scale.y = 1.5 + 1.5 * (1 - fr); sol.position.y = -4.5 + sol.scale.y / 2; liqm.scale.y = 1.5 * fr + 0.01; liqm.position.y = -4.5 + sol.scale.y + liqm.scale.y / 2 - 0.5; liqm.visible = fr > 0.01; sol.visible = fr < 0.999;
      cap.children.forEach(function (m, j) { if (j >= 36) return; var u = m.userData; m.visible = ctx.layer('cap') && (j / 36) > fr; m.position.set(Math.cos(u.a) * u.r * 1.5, -3 + u.y * 5.5 * (1 - 0.3 * fr), Math.sin(u.a) * u.r * 1.5); m.material.color.setHex(0xf8f9fa); });
      cap.visible = ctx.layer('cap'); cap.rotation.y = now * 0.3;
      var a = ints(S.cm, xe);
      lab[0].pos(-3, 7, 0).set(c.n + (S.mix === 'diff' ? ' + otro compuesto' : ''), 'bl-lead').vis(true);
      lab[1].pos(-3, -6.5, 0).set('T = ' + fmt(S.T, 1) + ' °C · ' + (fr <= 0 ? 'sólido' : (fr >= 1 ? 'líquido' : 'fundiendo ' + fmt(fr * 100, 0) + ' %')), fr > 0 && fr < 1 ? 'bl-pos' : 'bl-d').vis(true);
      lab[2].pos(-3, -7.5, 0).set('Rango: ' + fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C (Δ ' + fmt(a.clear - a.onset, 1) + ')', 'bl-d').vis(true); lab[3].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cm) u.cm.set(S.cm); if (u.xi) u.xi.set(S.xi); if (u.rate) u.rate.set(S.rate); if (u.T) u.T.set(S.T); },
    hud: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), pure = a.clear - a.onset < 2; return { eq: { chip: fmt(a.clear - a.onset, 1), name: c.n, body: '<div class="eqline"><small>Inicio</small>' + fmt(a.onset, 1) + ' °C</div><div class="eqline"><small>Final</small>' + fmt(a.clear, 1) + ' °C</div><div class="eqline"><small>Valor tabulado</small>' + fmt(c.Tm, 1) + ' °C</div><div class="eqline"><small>Pureza</small>' + (pure ? 'rango estrecho: puro' : 'rango amplio: impuro') + '</div>' }, legend: [{ label: 'Cristales blancos', color: '#f8f9fa', text: 'sólido' }, { label: 'Líquido naranja', color: '#ffd8a8', text: 'fundido' }] }; },
    measures: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), r = range(); return [['Compuesto', c.n], ['Tabulado', fmt(c.Tm, 1) + ' °C'], ['Impureza', fmt(xe * 100, 0) + ' %'], ['Rango real', fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C'], ['Velocidad', fmt(S.rate, 1) + ' °C/min'], ['Observado (con retraso)', fmt(r.onM, 1) + ' – ' + fmt(r.clM, 1) + ' °C']]; },
    ideas: ['Puro: rango ≤ 1 °C y cercano al tabulado.', 'Impureza: baja y ensancha el rango.', 'Calentar lento: 1–2 °C/min.', 'Mixto sin cambio → mismo compuesto.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra'); el.appendChild(c);
      ui.cm = kit.ui.options({ label: 'Compuesto', cols: 2, value: S.cm, options: Object.keys(CM).map(function (k) { return { v: k, label: CM[k].n, sub: CM[k].Tm + ' °C' }; }), onChange: function (v) { ctx.goManual(); S.cm = v; S.T = 25; } }); c.appendChild(ui.cm);
      ui.xi = kit.ui.slider({ label: 'Impureza (fracción molar)', min: 0, max: 0.3, step: 0.01, value: S.xi, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.xi = v; } });
      ui.rate = kit.ui.slider({ label: 'Velocidad de calentamiento', min: 0.5, max: 10, step: 0.5, value: S.rate, format: function (v) { return fmt(v, 1) + ' °C/min'; }, onInput: function (v) { ctx.goManual(); S.rate = v; } });
      ui.T = kit.ui.slider({ label: 'Temperatura del bloque', min: 20, max: 190, step: 0.5, value: S.T, format: function (v) { return fmt(v, 1) + ' °C'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.T = v; } });
      c.appendChild(kit.ui.sliders([ui.xi, ui.rate, ui.T]));
      c.appendChild(kit.ui.options({ label: 'Punto de fusión mixto', cols: 2, value: S.mix, options: [{ v: 'none', label: 'Sin mezcla' }, { v: 'diff', label: 'Mezcla con otro compuesto' }], onChange: function (v) { ctx.goManual(); S.mix = v; } }));
      c.appendChild(ctx.btnRow([{ t: '▶ Calentar', primary: true, fn: function () { ctx.goManual(); S.T = 25; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Diagrama sólido–líquido (T–x)', h: 250, note: 'Naranja: liquidus. Gris: solidus (eutéctico). El punto marca tu muestra.', draw: function (cx, w, h, col) {
      var c = CM[S.cm], L = 42, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, Tlo = c.Tm - 45, Thi = c.Tm + 6, i, sx = function (x) { return L + pw * x / 0.4; }, sy = function (t) { return Tp + ph * (1 - (t - Tlo) / (Thi - Tlo)); };
      cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 10, 1), sx(i / 10), h - B + 14); cx.fillText('fracción molar de impureza', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var t = Tlo + (Thi - Tlo) * i / 4; cx.fillText(fmt(t, 0), L - 4, sy(t) + 3); }
      cx.lineWidth = 2; cx.strokeStyle = '#ff922b'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = 0.4 * i / 80, tt = ints(S.cm, x).clear; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x), sy(tt)); } cx.stroke();
      cx.strokeStyle = '#868e96'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x2 = 0.4 * i / 80, to = ints(S.cm, x2).onset; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x2), sy(to)); } cx.stroke(); cx.lineWidth = 1;
      var a = ints(S.cm, S.xi); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(sx(S.xi), sy(a.clear), 4, 0, 6.28); cx.fill(); cx.beginPath(); cx.arc(sx(S.xi), sy(a.onset), 4, 0, 6.28); cx.fill();
    } }],
    calc: function () { var c = CM[S.cm], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * S.xi, a = ints(S.cm, S.xi), row = function (a1, b) { return '<tr><th>' + a1 + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('T<sub>m</sub> tabulado', fmt(c.Tm, 1) + ' °C') + row('ΔH<sub>fus</sub>', fmt(c.H / 1000, 1) + ' kJ/mol') + row('ΔT = R·T<sub>m</sub>²·x/ΔH', '8,314 × ' + fmt(Tm, 1) + '² × ' + fmt(S.xi, 2) + ' / ' + fmt(c.H, 0) + ' = <b>' + fmt(dT, 1) + ' K</b>') + row('Rango', fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C') + '</table><p class="muted small">Modelo didáctico: depresión ideal y solidus simplificada.</p>'; },
    quiz: [
      { q: 'Una muestra pura funde…', options: ['en un rango estrecho', 'en un rango amplio', 'a cualquier T', 'sin cambio'], answer: 0, why: 'Rango típico 0,5–1 °C.' },
      { q: 'Una impureza provoca…', options: ['baja y ensancha el rango', 'sube el punto de fusión', 'no cambia nada', 'sólo oscurece'], answer: 0, why: 'Depresión del punto de fusión.' },
      { q: 'Velocidad recomendada cerca del punto de fusión:', options: ['1–2 °C/min', '20 °C/min', '10 °C/s', 'sin calentar'], answer: 0, why: 'Para mantener el equilibrio térmico.' },
      { q: 'En un punto de fusión mixto, si el valor no cambia, entonces…', options: ['son el mismo compuesto', 'son distintos', 'está impuro', 'hay error'], answer: 0, why: 'La mezcla de distintos funde más bajo.' },
      { q: 'La temperatura eutéctica es…', options: ['la mínima de fusión de la mezcla', 'la máxima', 'el punto de ebullición', 'la T ambiente'], answer: 0, why: 'La línea solidus.' }
    ],
    help: { intro: 'Elige el compuesto, añade impureza y pulsa «Calentar» o arrastra la temperatura del bloque. El zoom muestra los cristales del capilar.', items: [['Tubo', 'capilar con muestra.'], ['Rango', 'inicio – final de fusión.']] }
  };
  MSim.create(def);
})();
