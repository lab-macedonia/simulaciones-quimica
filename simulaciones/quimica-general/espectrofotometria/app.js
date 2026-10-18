/* Espectrofotometría y ley de Beer–Lambert — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var CM = { mn: { n: 'KMnO₄', lm: 525, e: 2455, w: 38, cmax: 8e-4 }, mb: { n: 'Azul de metileno', lm: 664, e: 74000, w: 32, cmax: 2.6e-5 }, fe: { n: '[Fe(phen)₃]²⁺', lm: 510, e: 11100, w: 45, cmax: 1.8e-4 }, cu: { n: '[Cu(NH₃)₄]²⁺', lm: 608, e: 55, w: 90, cmax: 3.5e-2 } };
  var S = { cm: 'mn', lam: 525, f: 0.5, b: 1, stray: false, p: 0, std: 0 }, lab = [], g = null, sol = null, b1 = null, b2 = null, det = null, lamp = null, cuv = null;
  function eps(k, l) { var c = CM[k]; return c.e * Math.exp(-0.5 * Math.pow((l - c.lm) / c.w, 2)) + c.e * 0.01; }
  function Aof(k, l, c, b) { var A = eps(k, l) * b * c; if (S.stray) { var s = 0.02, Tn = Math.pow(10, -A); return -Math.log10((Tn + s) / (1 + s)); } return A; }
  function conc() { return S.f * CM[S.cm].cmax; }
  function cfmt(c) { return c < 1e-3 ? fmt(c * 1e6, 1) + ' µM' : fmt(c * 1e3, 2) + ' mM'; }
  function nz(i) { var x = Math.sin(i * 12.9898 + 4.14) * 43758.5453; return x - Math.floor(x) - 0.5; }
  function wl2rgb(l) { var r = 0, gg = 0, b = 0; if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { gg = (l - 440) / 50; b = 1; } else if (l < 510) { gg = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; gg = 1; } else if (l < 645) { r = 1; gg = -(l - 645) / 65; } else { r = 1; } var f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : (l > 700 ? 0.3 + 0.7 * (780 - l) / 80 : 1); return new T.Color(Math.pow(Math.max(0, r * f), 0.8), Math.pow(Math.max(0, gg * f), 0.8), Math.pow(Math.max(0, b * f), 0.8)); }
  function solColor() { var c = conc(), r = 0, gg = 0, b = 0, n = 0, l; for (l = 400; l <= 700; l += 10) { var col = wl2rgb(l), t = Math.pow(10, -Aof(S.cm, l, c, 1)); r += col.r * t; gg += col.g * t; b += col.b * t; n++; } var m = Math.max(r, gg, b) || 1; return new T.Color(Math.min(1, r / m), Math.min(1, gg / m), Math.min(1, b / m)); }
  function stdPts() { var k = S.cm, pts = [], i; for (i = 0; i <= 5; i++) { var c = CM[k].cmax * 0.8 * i / 5; pts.push({ c: c, A: Math.max(0, Aof(k, CM[k].lm, c, S.b) + 0.012 * nz(i + k.charCodeAt(0))) }); } return pts; }
  function reg(pts) { var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0; pts.forEach(function (p) { sx += p.c; sy += p.A; sxx += p.c * p.c; sxy += p.c * p.A; syy += p.A * p.A; }); var m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b0 = (sy - m * sx) / n, ssr = 0, sst = 0; pts.forEach(function (p) { ssr += Math.pow(p.A - (m * p.c + b0), 2); sst += Math.pow(p.A - sy / n, 2); }); return { m: m, b: b0, r2: 1 - ssr / sst }; }
  function unk() { var k = S.cm, cu = CM[k].cmax * 0.37, A = Math.max(0, Aof(k, CM[k].lm, cu, S.b) + 0.012 * nz(99)); return { c: cu, A: A }; }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.4, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Luz, transmitancia y absorbancia', 'Luz y A', 'T = I/I₀ ; A = −log₁₀ T',
        '<p>Un <b>espectrofotómetro</b> envía luz monocromática de intensidad <b>I₀</b> a través de una cubeta; el detector mide la luz transmitida <b>I</b>. La <b>transmitancia</b> es <b>T = I/I₀</b> y la <b>absorbancia</b> <b>A = −log₁₀T</b>. T = 100 % ↔ A = 0; T = 10 % ↔ A = 1; T = 1 % ↔ A = 2. Primero se mide el <b>blanco</b> (disolvente) para fijar A = 0.</p>'],
      ['Ley de Beer–Lambert', 'Beer–Lambert', 'A = ε·b·c : lineal con la concentración y el camino óptico',
        '<p>La <b>ley de Beer–Lambert</b> establece <b>A = ε·b·c</b>: ε es la <b>absortividad molar</b> (L mol⁻¹ cm⁻¹), b el <b>camino óptico</b> (cm) y c la concentración (mol/L). Duplicar c o b duplica A. Es válida para disoluciones <b>diluidas</b>; a A &gt; 1,5–2 aparecen desviaciones por luz parásita y el detector pierde precisión (activa «Luz parásita»).</p>'],
      ['Espectro de absorción y λmáx', 'Espectro', 'Se mide a la λ de máxima absorción: mayor sensibilidad',
        '<p>El <b>espectro de absorción</b> es A frente a λ. Se trabaja en la <b>λ<sub>máx</sub></b> porque ahí ε es máximo (más sensibilidad) y el error por un pequeño corrimiento de λ es mínimo. El <b>color</b> de la disolución es el <b>complementario</b> de la luz que absorbe: KMnO₄ absorbe ~525 nm (verde) y se ve violeta.</p>'],
      ['Curva de calibración', 'Calibración', 'Se miden patrones de concentración conocida y se ajusta A = m·c + n',
        '<p>Se preparan <b>patrones</b> de concentración conocida y se mide su A a λ<sub>máx</sub>. Se hace una <b>regresión lineal</b>: la pendiente <b>m = ε·b</b>. El coeficiente de determinación <b>R²</b> (≥ 0,999 es excelente) indica qué tan lineal es la respuesta. Los patrones deben <b>abarcar</b> el rango de la muestra.</p>'],
      ['Muestra desconocida', 'Desconocida', 'c = (A − n)/m, siempre dentro del rango de calibración',
        '<p>Se mide la A de la <b>muestra desconocida</b> y se interpola en la recta: <b>c = (A − n)/m</b>. Nunca se extrapola fuera del rango de los patrones. Compara tu resultado con la concentración real (oculta hasta este paso) y calcula el <b>error relativo</b>.</p>']
    ];
  }
  var def = {
    key: 'espectrofotometria', title: 'Espectrofotometría', subtitle: 'Simulador 3D · química general', accent: { dark: '#74c0fc', light: '#1971c2' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 8, 24], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 26], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 26, 2], target: [0, 0, 0] }],
    layers: [{ id: 'beam', label: 'Haz de luz', icon: '│' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      lamp = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), new T.MeshBasicMaterial({ color: 0xfff3bf })); lamp.position.set(-15, 0, 0); g.add(lamp);
      var hs = new T.Mesh(new T.BoxGeometry(3, 3, 3), mat(0x495057, 1)); hs.position.set(-17, 0, 0); g.add(hs);
      var pr = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, 2.4, 3), mat(0xd0ebff, 0.5)); pr.rotation.z = Math.PI / 2; pr.position.set(-10, 0, 0); g.add(pr);
      var sl = new T.Mesh(new T.BoxGeometry(0.3, 3, 3), mat(0x212529, 1)); sl.position.set(-6.5, 0, 0); g.add(sl);
      cuv = new T.Mesh(new T.BoxGeometry(2.4, 4.4, 2.4), mat(0xa5d8ff, 0.2)); cuv.position.set(0, 0, 0); g.add(cuv);
      sol = new T.Mesh(new T.BoxGeometry(2.2, 3.4, 2.2), mat(0xffffff, 0.75)); sol.position.set(0, -0.4, 0); g.add(sol);
      b1 = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 1, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })); b1.rotation.z = Math.PI / 2; g.add(b1);
      b2 = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 1, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })); b2.rotation.z = Math.PI / 2; g.add(b2);
      det = new T.Mesh(new T.BoxGeometry(3, 4, 3), mat(0x343a40, 1)); det.position.set(12, 0, 0); g.add(det);
      var scr = new T.Mesh(new T.BoxGeometry(0.1, 2.2, 2.2), new T.MeshBasicMaterial({ color: 0x69db7c })); scr.position.set(10.5, 0, 0); g.add(scr); g.userData.scr = scr;
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, k = S.cm, cm = CM[k];
      if (!P.manual) { var i = f.i; if (i === 0) { S.lam = cm.lm; S.f = 0.15 + 0.85 * f.local; S.b = 1; } else if (i === 1) { S.lam = cm.lm; S.f = 0.5; S.b = 0.5 + 1.5 * f.local; } else if (i === 2) { S.lam = 380 + 400 * f.local; S.f = 0.5; S.b = 1; } else if (i === 3) { S.lam = cm.lm; S.b = 1; S.f = 0.8 * (Math.floor(f.local * 6) / 5); } else { S.lam = cm.lm; S.f = 0.37; S.b = 1; } }
      var c = conc(), A = Aof(k, S.lam, c, S.b), Tr = Math.pow(10, -A), col = wl2rgb(S.lam), bOn = ctx.layer('beam');
      sol.material.color.copy(solColor()); sol.scale.x = S.b; cuv.scale.x = S.b; sol.scale.y = S.f * 0.02 + 0.98;
      var xi = -S.b * 1.2, xo = S.b * 1.2;
      b1.scale.y = xi + 6.5; b1.position.x = (xi - 6.5) / 2; b1.material.color.copy(col); b1.visible = bOn;
      b2.scale.y = Math.max(0.01, 10.5 - xo); b2.position.x = (xo + 10.5) / 2; b2.material.color.copy(col); b2.material.opacity = 0.15 + 0.85 * Tr; b2.visible = bOn; b2.scale.x = b2.scale.z = Math.max(0.15, 0.3 + 0.7 * Tr);
      g.userData.scr.material.color.setRGB(0.2 + 0.5 * Tr, 0.3 + 0.7 * Tr, 0.3 + 0.2 * Tr);
      lab[0].pos(-10, 3.5, 0).set('λ = ' + fmt(S.lam, 0) + ' nm', 'bl-lead').vis(true);
      lab[1].pos(0, 4.6, 0).set(cm.n + ' · ' + cfmt(c) + ' · b = ' + fmt(S.b, 1) + ' cm', 'bl-d').vis(true);
      lab[2].pos(12, 3.8, 0).set('T = ' + fmt(Tr * 100, 1) + ' %', 'bl-d').vis(true);
      lab[3].pos(12, -3.6, 0).set('A = ' + fmt(A, 3), A > 1.5 ? 'bl-neg' : 'bl-pos').vis(true); lab[4].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cm) u.cm.set(S.cm); if (u.lam) u.lam.set(S.lam); if (u.f) u.f.set(S.f); if (u.b) u.b.set(S.b); },
    hud: function () { var c = conc(), A = Aof(S.cm, S.lam, c, S.b); return { eq: { chip: 'A', name: CM[S.cm].n, body: '<div class="eqline"><small>λ</small>' + fmt(S.lam, 0) + ' nm</div><div class="eqline"><small>c</small>' + cfmt(c) + '</div><div class="eqline"><small>T</small>' + fmt(Math.pow(10, -A) * 100, 1) + ' %</div><div class="eqline"><small>A</small>' + fmt(A, 3) + '</div>' }, legend: [{ label: 'Haz', color: '#ffd43b', text: 'color de la λ seleccionada' }, { label: 'Disolución', color: '#cc5de8', text: 'color complementario' }] }; },
    measures: function () { var c = conc(), A = Aof(S.cm, S.lam, c, S.b), cm = CM[S.cm]; return [['Compuesto', cm.n], ['λ máx', cm.lm + ' nm'], ['ε en λ', fmt(eps(S.cm, S.lam), 0) + ' L/(mol·cm)'], ['Concentración', cfmt(c)], ['Camino óptico', fmt(S.b, 1) + ' cm'], ['A', fmt(A, 3)], ['T', fmt(Math.pow(10, -A) * 100, 1) + ' %']]; },
    ideas: ['A = ε·b·c, lineal con c y con b.', 'Trabaja en λmáx.', 'A > 1,5 pierde linealidad y precisión.', 'La disolución se ve del color complementario al que absorbe.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra y condiciones'); el.appendChild(c);
      ui.cm = kit.ui.options({ label: 'Compuesto', cols: 2, value: S.cm, options: Object.keys(CM).map(function (k) { return { v: k, label: CM[k].n, sub: 'λmáx ' + CM[k].lm + ' nm' }; }), onChange: function (v) { ctx.goManual(); S.cm = v; S.lam = CM[v].lm; } }); c.appendChild(ui.cm);
      ui.lam = kit.ui.slider({ label: 'Longitud de onda', min: 380, max: 780, step: 1, value: S.lam, format: function (v) { return v + ' nm'; }, onInput: function (v) { ctx.goManual(); S.lam = v; } });
      ui.f = kit.ui.slider({ label: 'Concentración (% del máximo)', min: 0, max: 1, step: 0.01, value: S.f, format: function (v) { return cfmt(v * CM[S.cm].cmax); }, onInput: function (v) { ctx.goManual(); S.f = v; } });
      ui.b = kit.ui.slider({ label: 'Camino óptico', min: 0.5, max: 2, step: 0.1, value: S.b, format: function (v) { return fmt(v, 1) + ' cm'; }, onInput: function (v) { ctx.goManual(); S.b = v; } });
      c.appendChild(kit.ui.sliders([ui.lam, ui.f, ui.b]));
      c.appendChild(ctx.btnRow([{ t: 'λ = λmáx', fn: function () { ctx.goManual(); S.lam = CM[S.cm].lm; } }, { t: 'Luz parásita: ' + (S.stray ? 'sí' : 'no'), fn: function (e) { ctx.goManual(); S.stray = !S.stray; if (e && e.target) e.target.textContent = 'Luz parásita: ' + (S.stray ? 'sí' : 'no'); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Espectro de absorción', h: 230, note: 'A frente a λ para la concentración y camino actuales. Línea: λ seleccionada.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, c = conc(), mx = 2.2, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 400; i <= 800; i += 100) cx.fillText(i, L + pw * (i - 380) / 400, h - B + 14); cx.fillText('λ (nm)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 2; i++) cx.fillText(i, L - 4, Tp + ph * (1 - i / mx) + 3);
        cx.strokeStyle = '#4dabf7'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 200; i++) { var l = 380 + 2 * i, A = Math.min(mx, Aof(S.cm, l, c, S.b)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * (l - 380) / 400, Tp + ph * (1 - A / mx)); } cx.stroke(); cx.lineWidth = 1;
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * (S.lam - 380) / 400, Tp); cx.lineTo(L + pw * (S.lam - 380) / 400, Tp + ph); cx.stroke(); cx.setLineDash([]);
      } },
      { title: 'Curva de calibración', h: 250, note: 'Puntos: patrones con ruido. Rombo: muestra desconocida interpolada.', draw: function (cx, w, h, col) {
        var pts = stdPts(), r = reg(pts), u = unk(), L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, cmax = CM[S.cm].cmax, Amax = Math.max.apply(0, pts.map(function (p) { return p.A; })) * 1.15 + 0.05, sx = function (c) { return L + pw * c / cmax; }, sy = function (A) { return Tp + ph * (1 - A / Amax); }, i;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('concentración', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(fmt(Amax * i / 4, 2), L - 4, sy(Amax * i / 4) + 3);
        cx.strokeStyle = '#ff922b'; cx.beginPath(); cx.moveTo(sx(0), sy(r.b)); cx.lineTo(sx(cmax), sy(r.m * cmax + r.b)); cx.stroke();
        cx.fillStyle = '#4dabf7'; pts.forEach(function (p) { cx.beginPath(); cx.arc(sx(p.c), sy(p.A), 4, 0, 6.28); cx.fill(); });
        cx.fillStyle = '#40c057'; cx.beginPath(); cx.moveTo(sx(u.c), sy(u.A) - 6); cx.lineTo(sx(u.c) + 6, sy(u.A)); cx.lineTo(sx(u.c), sy(u.A) + 6); cx.lineTo(sx(u.c) - 6, sy(u.A)); cx.fill();
        cx.textAlign = 'left'; cx.fillStyle = col.ink; cx.fillText('R² = ' + fmt(r.r2, 4), L + 8, Tp + 12);
      } }
    ],
    calc: function () {
      var c = conc(), A = Aof(S.cm, S.lam, c, S.b), pts = stdPts(), r = reg(pts), u = unk(), cu = (u.A - r.b) / r.m, row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">Beer–Lambert</div><table class="calc-table">' + row('ε (λ)', fmt(eps(S.cm, S.lam), 0) + ' L/(mol·cm)') + row('A = ε·b·c', fmt(eps(S.cm, S.lam), 0) + ' × ' + fmt(S.b, 1) + ' × ' + cfmt(c) + ' = <b>' + fmt(A, 3) + '</b>') + row('T = 10<sup>−A</sup>', fmt(Math.pow(10, -A) * 100, 1) + ' %') + '</table><div class="card-kicker">Calibración (λmáx)</div><table class="calc-table">' + row('Recta', 'A = ' + fmt(r.m, 1) + '·c + ' + fmt(r.b, 3)) + row('R²', fmt(r.r2, 4)) + row('A muestra', fmt(u.A, 3)) + row('c = (A − n)/m', '<b>' + cfmt(cu) + '</b>') + row('c real', cfmt(u.c) + ' · error ' + fmt(Math.abs(cu - u.c) / u.c * 100, 1) + ' %') + '</table>';
    },
    quiz: [
      { q: 'A = 1 equivale a una transmitancia de…', options: ['10 %', '1 %', '50 %', '90 %'], answer: 0, why: 'T = 10⁻¹ = 0,1.' },
      { q: 'Si se duplica la concentración, la absorbancia…', options: ['se duplica', 'se reduce a la mitad', 'no cambia', 'se cuadruplica'], answer: 0, why: 'A es proporcional a c.' },
      { q: 'Conviene medir en λmáx porque…', options: ['hay mayor sensibilidad', 'ε es mínima', 'no hay absorción', 'cambia la ley'], answer: 0, why: 'ε máximo.' },
      { q: 'Una disolución que absorbe luz verde se ve…', options: ['violeta/magenta', 'verde', 'incolora', 'negra'], answer: 0, why: 'Color complementario.' },
      { q: 'Se debe medir un blanco para…', options: ['fijar A = 0 con el disolvente', 'aumentar ε', 'calentar', 'filtrar'], answer: 0, why: 'Elimina la contribución de cubeta y disolvente.' },
      { q: 'La muestra desconocida debe quedar…', options: ['dentro del rango de los patrones', 'por encima del último patrón', 'con A > 3', 'fuera de la recta'], answer: 0, why: 'No se extrapola.' }
    ],
    help: { intro: 'Elige el compuesto, ajusta λ, concentración y camino óptico. El haz se atenúa tras la cubeta y el detector muestra T y A.', items: [['Haz', 'color de la λ.'], ['Pantalla', 'brillo ∝ transmitancia.']] }
  };
  MSim.create(def);
})();
