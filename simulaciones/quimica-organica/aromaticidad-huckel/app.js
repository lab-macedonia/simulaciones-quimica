/* Aromaticidad y regla de Hückel — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  // tipo: planar + cíclico + conjugado; ne = electrones π; el = elementos del anillo; kek = órdenes de enlace (Kekulé)
  var C = [
    { id: 'benceno', n: 'Benceno', f: 'C₆H₆', ring: 6, ne: 6, el: 'CCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Los seis enlaces C–C miden 1,39 Å (ni simples ni dobles). Energía de resonancia ≈ 150 kJ/mol: no se hidrogena ni se adiciona como un alqueno.' },
    { id: 'cb', n: 'Ciclobutadieno', f: 'C₄H₄', ring: 4, ne: 4, el: 'CCCC', kek: [2, 1, 2, 1], q: '', cls: 'anti', rect: true, note: '4n electrones π: antiaromático. Se distorsiona a rectángulo (1,34 y 1,57 Å) y es tan inestable que solo se aísla a muy baja temperatura.' },
    { id: 'cot', n: 'Ciclooctatetraeno (COT)', f: 'C₈H₈', ring: 8, ne: 8, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '', cls: 'non', tub: true, note: 'Tendría 8 e⁻ π: si fuera plano sería antiaromático. Se pliega en forma de bote y se comporta como cuatro dobles enlaces aislados.' },
    { id: 'cpm', n: 'Anión ciclopentadienilo', f: 'C₅H₅⁻', ring: 5, ne: 6, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁻', cls: 'aro', note: '6 e⁻ π en un anillo plano de 5 C: aromático. Explica la acidez del ciclopentadieno (pKa ≈ 16) y el ferroceno.' },
    { id: 'cpp', n: 'Catión ciclopentadienilo', f: 'C₅H₅⁺', ring: 5, ne: 4, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁺', cls: 'anti', note: '4 e⁻ π: antiaromático, muy inestable (no se conoce como especie estable).' },
    { id: 'trop', n: 'Catión tropilio', f: 'C₇H₇⁺', ring: 7, ne: 6, el: 'CCCCCCC', kek: [2, 1, 2, 1, 2, 1, 1], q: '⁺', cls: 'aro', note: '6 e⁻ π en 7 C: aromático. Es tan estable que existe como sal (bromuro de tropilio).' },
    { id: 'cpr', n: 'Catión ciclopropenilo', f: 'C₃H₃⁺', ring: 3, ne: 2, el: 'CCC', kek: [2, 1, 1], q: '⁺', cls: 'aro', note: '2 e⁻ π (n = 0): el anillo aromático más pequeño; se prepara como sal estable.' },
    { id: 'cot2', n: 'Dianión de COT', f: 'C₈H₈²⁻', ring: 8, ne: 10, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '²⁻', cls: 'aro', note: '10 e⁻ π: el anillo se aplana y es aromático (4n + 2 con n = 2). Se obtiene con K metálico.' },
    { id: 'pirrol', n: 'Pirrol', f: 'C₄H₅N', ring: 5, ne: 6, el: 'NCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', hs: { 0: 'NH' }, note: 'El par libre del N (en un orbital p) aporta 2 e⁻ al sistema π: 4 de los dos C=C + 2 = 6. Por eso el N del pirrol no es básico.' },
    { id: 'piridina', n: 'Piridina', f: 'C₅H₅N', ring: 6, ne: 6, el: 'NCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Como el benceno: 6 e⁻ π. El par libre del N está en el plano (orbital sp²), fuera del sistema π: la piridina es básica (pKa del ion piridinio ≈ 5,2).' },
    { id: 'furano', n: 'Furano', f: 'C₄H₄O', ring: 5, ne: 6, el: 'OCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Un par del O aporta 2 e⁻ al sistema π (el otro par queda en el plano): 6 e⁻ π, aromático moderado.' },
    { id: 'cpd', n: 'Ciclopenta-1,3-dieno', f: 'C₅H₆', ring: 5, ne: 4, el: 'CCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'non', sp3: true, note: 'El carbono sp³ (CH₂) interrumpe la conjugación: no es un sistema cíclico completamente conjugado, por lo tanto no es aromático.' }
  ];
  var CID = {}; C.forEach(function (c) { CID[c.id] = c; });
  var CLS = { aro: 'aromático', anti: 'antiaromático', non: 'no aromático' };
  var S = { cs: 'benceno', mo: 0, delo: true, si: 0, run: false, prog: 0 }, grp = null, key_ = '', lobes = [], tor = [], lab = {}, matB, matR;
  function ordr(n) { var ks = []; for (var k = 0; k < n; k++) ks.push(k); ks.sort(function (a, b) { var xa = 2 * Math.cos(2 * Math.PI * a / n), xb = 2 * Math.cos(2 * Math.PI * b / n); return Math.abs(xa - xb) < 1e-9 ? a - b : xb - xa; }); return ks; }
  function xk(n, k) { return 2 * Math.cos(2 * Math.PI * k / n); }
  function occ(n, ne) { var o = ordr(n), res = {}, left = ne, i = 0; while (i < n) { var j = i; while (j < n && Math.abs(xk(n, o[j]) - xk(n, o[i])) < 1e-9) j++; var g = j - i, take = Math.min(left, 2 * g), base = Math.floor(take / g), extra = take - base * g; for (var q = i; q < j; q++) res[o[q]] = base + ((q - i) < extra ? 1 : 0); left -= take; i = j; } return res; }
  function coef(n, k) { var c = []; for (var j = 0; j < n; j++) { if (2 * k === n) c.push(j % 2 ? -1 : 1); else if (k === 0) c.push(1); else if (2 * k < n) c.push(Math.cos(2 * Math.PI * k * j / n)); else c.push(Math.sin(2 * Math.PI * (n - k) * j / n) * 1.0); } return c; }
  function energy(c) { var n = c.ring, o = occ(n, c.ne), s = 0; for (var k = 0; k < n; k++) s += (o[k] || 0) * xk(n, k); return s; }
  function lin(c) { var e = 0, left = c.ne; for (var m = 1; m <= c.ring; m++) { var t = Math.min(2, left); e += t * 2 * Math.cos(m * Math.PI / (c.ring + 1)); left -= t; } return e; }
  function de(c) { return energy(c) - lin(c); }
  function huckel(c) { var m = c.ne - 2; return m % 4 === 0 ? '4n + 2 (n = ' + (m / 4) + ')' : (c.ne % 4 === 0 ? '4n (n = ' + (c.ne / 4) + ')' : '—'); }
  function geo(c) {
    var n = c.ring, A = [], B = [], R = 1.4 / (2 * Math.sin(Math.PI / n)), i;
    for (i = 0; i < n; i++) {
      var th = 2 * Math.PI * i / n - Math.PI / 2, x = R * Math.cos(th), z = R * Math.sin(th), y = 0;
      if (c.rect) { var sx = (i === 0 || i === 3) ? -1 : 1, sz = (i < 2) ? -1 : 1; x = sx * 0.78; z = sz * 0.67; if (i === 1) { x = 0.78; z = -0.67; } if (i === 2) { x = 0.78; z = 0.67; } if (i === 3) { x = -0.78; z = 0.67; } if (i === 0) { x = -0.78; z = -0.67; } }
      if (c.tub) { R = 1.46 / (2 * Math.sin(Math.PI / n)) * 0.9; x = R * Math.cos(th); z = R * Math.sin(th); y = [0.55, 0.55, -0.55, -0.55, 0.55, 0.55, -0.55, -0.55][i]; }
      A.push([c.el[i], x, y, z]);
    }
    for (i = 0; i < n; i++) { var j = (i + 1) % n, ord = (c.cls === 'aro' && S.delo) ? 1 : c.kek[i]; B.push([i, j, ord]); }
    for (i = 0; i < n; i++) {
      var a = A[i]; if (c.el[i] === 'O' || (c.el[i] === 'N' && !(c.hs && c.hs[i]))) continue; var r = Math.sqrt(a[1] * a[1] + a[3] * a[3]) || 1, dx = a[1] / r, dz = a[3] / r;
      if (c.sp3 && i === 0) { A.push(['H', a[1] + dx * 0.6, a[2] + 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); A.push(['H', a[1] + dx * 0.6, a[2] - 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); continue; }
      var L = c.el[i] === 'N' ? 1.01 : 1.09; A.push(['H', a[1] + dx * L, a[2] * 1.1, a[3] + dz * L]); B.push([i, A.length - 1, 1]);
    }
    return { a: A, b: B, R: R };
  }
  function rebuild(ctx) {
    var c = CID[S.cs]; if (grp) ctx.scene.remove(grp); grp = new T.Group(); var g = geo(c); grp.add(ctx.mol(g, { gs: 1, ar: 0.5, bw: 1.2 })); lobes = []; tor = [];
    var sg = new T.SphereGeometry(1, 16, 12);
    for (var i = 0; i < c.ring; i++) { var a = g.a[i]; for (var s = 0; s < 2; s++) { var m = new T.Mesh(sg, matB); m.position.set(a[1], a[2] + (s ? -0.85 : 0.85), a[3]); m.userData = { i: i, s: s, y0: a[2] }; grp.add(m); lobes.push(m); } }
    var rr = Math.max(0.9, g.R); for (var u = 0; u < 2; u++) { var t = new T.Mesh(new T.TorusGeometry(rr, 0.16, 10, 48), new T.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.y = u ? -0.85 : 0.85; grp.add(t); tor.push(t); }
    ctx.scene.add(grp); key_ = S.cs + '|' + S.delo; S.mo = Math.min(S.mo, c.ring - 1);
  }
  function stages() {
    return [
      ['Los cuatro criterios', 'Criterios', 'Cíclica, plana, totalmente conjugada y con 4n + 2 electrones π',
        '<p>Un compuesto es <b>aromático</b> si es <b>cíclico, plano, con un orbital p en cada átomo del anillo (conjugación completa)</b> y tiene <b>4n + 2 electrones π</b> (2, 6, 10, 14…). Si cumple lo demás pero tiene <b>4n e⁻ π</b> (4, 8, 12…) es <b>antiaromático</b> (desestabilizado); si falla alguno de los criterios estructurales es <b>no aromático</b>.</p>'],
      ['El benceno', 'Benceno', 'Seis electrones π deslocalizados sobre todo el anillo',
        '<p>En el <b>benceno</b> los seis orbitales p solapan en dos nubes (toroides) por encima y por debajo del plano: los electrones π no pertenecen a tres dobles enlaces, sino a todo el anillo. Los seis enlaces C–C son iguales (1,39 Å). Cambia entre <b>Kekulé</b> (localizado) y <b>deslocalizado</b> en «Lab» y ve cómo el modelo clásico es solo una de las formas resonantes.</p>'],
      ['Orbitales moleculares π', 'Orbitales π', 'Los n orbitales p dan n OM: energías α + 2β·cos(2πk/n)',
        '<p>Los n orbitales p de un anillo forman n orbitales moleculares con energías <b>E<sub>k</sub> = α + 2β cos(2πk/n)</b>. El <b>círculo de Frost</b> los reúne: un polígono con un vértice abajo inscrito en un círculo de radio 2|β|. Para el benceno: un OM de menor energía, dos degenerados, dos degenerados y uno de mayor energía. Los 6 e⁻ llenan justo los tres OM enlazantes: <b>capa cerrada</b>. Los lóbulos azules y rojos son las fases del OM que se elige.</p>'],
      ['Antiaromaticidad', 'Antiaromáticos', 'Con 4n electrones π quedan electrones desapareados',
        '<p>Con <b>4 e⁻ π</b> (ciclobutadieno) o <b>8 e⁻ π</b> (COT plano) los dos últimos electrones ocupan dos OM <b>degenerados no enlazantes</b>: <b>capa abierta</b>, desapareados y muy reactivos. La molécula escapa de la antiaromaticidad <b>distorsionándose</b>: el ciclobutadieno se hace rectangular y el COT se pliega en forma de bote (no aromático).</p>'],
      ['Iones aromáticos', 'Iones', 'Un anillo con carga también puede ser aromático',
        '<p>El <b>anión ciclopentadienilo</b> (6 e⁻), el <b>catión tropilio</b> (6 e⁻), el <b>catión ciclopropenilo</b> (2 e⁻) y el <b>dianión del COT</b> (10 e⁻) cumplen 4n + 2. Explican por qué el <b>ciclopentadieno</b> tiene un pKa de ≈ 16 (muy ácido para un hidrocarburo) y por qué el bromuro de tropilio es una sal estable.</p>'],
      ['Heterociclos', 'Heterociclos', 'El heteroátomo aporta 0 o 2 electrones al sistema π',
        '<p>En el <b>pirrol</b> y el <b>furano</b> un par libre del heteroátomo está en un orbital p y <b>aporta 2 e⁻</b> al sexteto: 4 + 2 = 6. En la <b>piridina</b>, el par del N está en el plano (sp²) y <b>no cuenta</b>: los 6 e⁻ son de los tres C=C y el N conserva su basicidad. Por eso el pirrol no es básico y la piridina sí.</p>']
    ];
  }
  var LESSON = [['benceno', 'cb', 'cpd', 'benceno'], ['benceno'], ['benceno', 'trop'], ['cb', 'cot', 'cpp'], ['cpm', 'trop', 'cpr', 'cot2'], ['pirrol', 'piridina', 'furano']];
  var def = {
    key: 'aromaticidad-huckel', title: 'Aromaticidad y regla de Hückel', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 6, 11], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 14, 0.5], target: [0, 0, 0] }, { id: 'lado', label: 'Lateral', pos: [0, 0.5, 13], target: [0, 0, 0] }],
    layers: [{ id: 'orb', label: 'Orbital π elegido', icon: '☁' }, { id: 'tor', label: 'Nube π (toroides)', icon: '◯' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { matB = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false }); matR = new T.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: 0.55, depthWrite: false }); ['t', 'a', 'b'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var l = LESSON[f.i], ix = Math.min(l.length - 1, Math.floor(f.local * l.length)); if (S._st !== f.i || S._ix !== ix) { S._st = f.i; S._ix = ix; S.cs = l[ix]; S.delo = f.i !== 1 || f.local > 0.4; S.mo = 0; } if (f.i === 2) { S.mo = Math.min(CID[S.cs].ring - 1, Math.floor(f.local * 2 % 1 * CID[S.cs].ring)); } }
      if (S.cs + '|' + S.delo !== key_) rebuild(ctx);
      var c = CID[S.cs], n = c.ring, o = ordr(n), k = o[Math.min(S.mo, n - 1)], cf = coef(n, k), orb = ctx.layer('orb'), tr = ctx.layer('tor');
      if (ctx.layer('spin')) grp.rotation.y += dt * 0.3;
      lobes.forEach(function (m) { var u = m.userData, cc = c.cls === 'non' ? (u.i % 2 ? 0 : 0) : cf[u.i], s = Math.abs(cc), sign = (cc >= 0 ? 1 : -1) * (u.s ? -1 : 1); if (c.tub || c.sp3) { m.visible = false; return; } m.visible = orb && s > 0.02; m.material = sign > 0 ? matB : matR; m.scale.set(0.55 * Math.max(0.15, s), 0.8 * Math.max(0.15, s), 0.55 * Math.max(0.15, s)); m.position.y = u.y0 + (u.s ? -1 : 1) * (0.2 + 0.7 * Math.max(0.15, s)); });
      tor.forEach(function (t) { t.visible = tr && c.cls === 'aro' && S.delo; });
      lab.t.pos(0, 3.3, 0).set(c.n + ' · ' + c.f + (c.q ? '' : ''), 'bl-lead').vis(true); lab.a.pos(0, -3.0, 0).set(c.ne + ' e⁻ π · ' + huckel(c) + ' · ' + CLS[c.cls], c.cls === 'aro' ? 'bl-neg' : (c.cls === 'anti' ? 'bl-warn' : 'bl-d')).vis(true);
      lab.b.pos(0, -3.9, 0).set('OM ' + (Math.min(S.mo, n - 1) + 1) + ' de ' + n + ' · E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β', 'bl-d').vis(orb && !c.tub && !c.sp3);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo) u.mo.set(S.mo); },
    hud: function () { var c = CID[S.cs]; return { eq: { chip: 'Hückel', name: c.n + ' · ' + c.f, body: '<div class="eqline"><small>Electrones π</small>' + c.ne + ' (' + huckel(c) + ')</div><div class="eqline"><small>Clasificación</small>' + CLS[c.cls] + '</div><div class="eqline"><small>Ciclación frente a cadena abierta</small>' + f2(de(c)) + ' β (+ estabiliza, − desestabiliza)</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'fase + del orbital p' }, { label: 'Rojo', color: '#ff6b5e', text: 'fase −' }, { label: 'Morado', color: '#c084fc', text: 'nube π deslocalizada' }] }; },
    measures: function () { var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n); var homo = -9, lumo = 9; od.forEach(function (k) { var x = xk(n, k); if ((o[k] || 0) > 0) homo = Math.max(-9, homo === -9 ? x : Math.min(homo, x)); else lumo = Math.min(lumo, x); }); var open = od.some(function (k) { var v = o[k] || 0; return v === 1; }); return [['Compuesto', c.n], ['Anillo', n + ' átomos'], ['Electrones π', String(c.ne)], ['Regla', huckel(c)], ['Clasificación', CLS[c.cls]], ['Capa', open ? 'abierta (desapareados)' : 'cerrada'], ['Energía π', f2(energy(c)) + ' |β|'], ['E. frente a cadena abierta', f2(de(c)) + ' |β|']]; },
    ideas: ['Aromático: <b>cíclico, plano, conjugado y 4n + 2 e⁻ π</b>.', 'Con <b>4n e⁻ π</b> y planar: antiaromático (capa abierta); la molécula se distorsiona para escapar.', 'El heteroátomo aporta 2 e⁻ si su par está en un orbital p (pirrol, furano) y 0 si está en el plano (piridina).', 'Círculo de Frost: E<sub>k</sub> = α + 2β cos(2πk/n).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sistema π'); el.appendChild(c);
      ui.cs = kit.ui.options({ label: 'Compuesto', cols: 3, value: S.cs, options: C.map(function (x) { return { v: x.id, label: x.n.replace('Ciclooctatetraeno (COT)', 'COT').replace('Catión ', 'Catión ').replace('Anión ciclopentadienilo', 'Cp⁻').replace('Catión ciclopentadienilo', 'Cp⁺').replace('Ciclopenta-1,3-dieno', 'Ciclopentadieno').replace('Dianión de COT', 'COT²⁻'), sub: x.ne + ' e⁻ · ' + CLS[x.cls] }; }), onChange: function (v) { ctx.goManual(); S.cs = v; S.mo = 0; } }); c.appendChild(ui.cs);
      ui.mo = kit.ui.slider({ label: 'Orbital π (de menor a mayor energía)', min: 0, max: 7, step: 1, value: S.mo, format: function (v) { return String(v + 1); }, onInput: function (v) { ctx.goManual(); S.mo = Math.min(v, CID[S.cs].ring - 1); } }); c.appendChild(kit.ui.sliders([ui.mo]));
      ui.dl = kit.ui.seg([{ v: 'd', label: 'Deslocalizado' }, { v: 'k', label: 'Kekulé' }], S.delo ? 'd' : 'k', function (v) { ctx.goManual(); S.delo = v === 'd'; }); var r = document.createElement('div'); r.className = 'row'; r.appendChild(ui.dl); c.appendChild(r);
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card('Qué observar'); el.appendChild(t); var p = document.createElement('p'); p.className = 'muted small'; t.appendChild(p); ui.tip = p; ui.refresh = function () { if (ui._k !== S.cs) { ui._k = S.cs; p.innerHTML = CID[S.cs].note; } };
    },
    graphs: [
      { title: 'Círculo de Frost y llenado de orbitales', h: 270, note: 'Cada vértice es un OM π; la altura indica su energía (abajo = enlazante). Flechas: electrones. El OM elegido se resalta.', draw: function (cx, w, h, col) {
        var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), mk = od[Math.min(S.mo, n - 1)], r = Math.min(w / 2 - 34, h / 2 - 28), cx0 = w / 2, cy0 = h / 2;
        cx.strokeStyle = col.line; cx.lineWidth = 1; cx.beginPath(); cx.arc(cx0, cy0, r, 0, 7); cx.stroke(); cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(cx0 - r - 10, cy0); cx.lineTo(cx0 + r + 10, cy0); cx.stroke(); cx.setLineDash([]); cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText('α (no enlazante)', cx0 + r + 8 > w - 80 ? 4 : cx0 + r + 6, cy0 - 3);
        cx.strokeStyle = col.muted; cx.beginPath(); for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n, X = cx0 + r * Math.sin(ang), Y = cy0 + r * Math.cos(ang); if (k === 0) cx.moveTo(X, Y); else cx.lineTo(X, Y); } cx.closePath(); cx.stroke();
        for (k = 0; k < n; k++) { var an = 2 * Math.PI * k / n, X2 = cx0 + r * Math.sin(an), Y2 = cy0 + r * Math.cos(an), e = o[k] || 0, sel = k === mk; cx.strokeStyle = sel ? '#f472b6' : col.ink; cx.lineWidth = sel ? 3.2 : 2; cx.beginPath(); cx.moveTo(X2 - 15, Y2); cx.lineTo(X2 + 15, Y2); cx.stroke(); cx.lineWidth = 1; cx.font = 'bold 14px system-ui'; cx.textAlign = 'center'; if (e >= 1) { cx.fillStyle = '#4dabf7'; cx.fillText('↑', X2 - 5, Y2 - 3); } if (e === 2) { cx.fillStyle = '#ff9f43'; cx.fillText('↓', X2 + 5, Y2 - 3); } }
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('antienlazante', cx0, 12); cx.fillText('enlazante', cx0, h - 4);
      } },
      { title: 'Estabilización por ciclación (|β|)', h: 250, note: 'E(anillo) − E(polieno abierto con los mismos átomos y electrones). Positivo: aromático; negativo: antiaromático. (El COT plano tiene capa abierta y se pliega.)', draw: function (cx, w, h, col) {
        var arr = C.filter(function (c) { return c.cls !== 'non'; }), L = 98, R = 40, Tp = 8, B = 10, rh = (h - Tp - B) / arr.length, pw = w - L - R, lo = -1, hi = 1.6, zx = L + pw * (0 - lo) / (hi - lo); cx.font = '10px system-ui';
        cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(zx, Tp); cx.lineTo(zx, h - B); cx.stroke();
        arr.forEach(function (c, i) { var y = Tp + i * rh, v = de(c), sel = c.id === S.cs, x1 = L + pw * (Math.min(0, v) - lo) / (hi - lo), x2 = L + pw * (Math.max(0, v) - lo) / (hi - lo); cx.fillStyle = sel ? '#f472b6' : (c.cls === 'aro' ? '#51cf66' : '#ff8787'); cx.fillRect(x1, y + 3, Math.max(2, x2 - x1), rh - 6); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.n.replace('Anión ciclopentadienilo', 'Cp⁻').replace('Catión ciclopentadienilo', 'Cp⁺').replace('Catión ', '').replace('Dianión de COT', 'COT²⁻'), L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f2(v), (v >= 0 ? x2 : x1) + (v >= 0 ? 4 : -34), y + rh / 2 + 3); });
      } }
    ],
    calc: function () {
      var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, rows = od.map(function (k) { return row('OM ' + (od.indexOf(k) + 1), 'E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β · ' + (o[k] || 0) + ' e⁻'); }).join('');
      return '<div class="card-kicker">' + c.n + ' · ' + c.f + '</div><div class="calc-step">1 · Conteo de electrones π</div><table class="calc-table">' + row('Electrones π', '<b>' + c.ne + '</b>') + row('Regla', huckel(c)) + row('Estructura', c.sp3 ? 'interrumpida por un C sp³' : (c.tub ? 'no plana (bote)' : 'plana, conjugada')) + row('Clasificación', '<b>' + CLS[c.cls] + '</b>') + '</table><div class="calc-step">2 · Orbitales moleculares (Hückel)</div><table class="calc-table">' + rows + '</table>' +
        '<div class="calc-step">3 · Comparación con el polieno abierto</div><table class="calc-table">' + row('E<sub>π</sub> (anillo)', c.ne + 'α + ' + f2(energy(c)) + 'β') + row('E<sub>π</sub> (cadena abierta de ' + n + ' C)', c.ne + 'α + ' + f2(lin(c)) + 'β') + row('Diferencia', '<b>' + f2(de(c)) + ' |β|</b>' + (de(c) > 0.05 ? ' (el anillo estabiliza)' : ' (el anillo desestabiliza)')) + '</table>';
    },
    quiz: [
      { q: '¿Cuál de estos cumple la regla de Hückel (4n + 2)?', options: ['Benceno (6 e⁻ π)', 'Ciclobutadieno (4 e⁻ π)', 'Ciclooctatetraeno plano (8 e⁻ π)', 'Catión ciclopentadienilo (4 e⁻ π)'], answer: 0, why: '6 = 4(1) + 2.' },
      { q: '¿Por qué el ciclobutadieno es antiaromático?', options: ['Es plano y cíclico con 4 e⁻ π (4n)', 'No es plano', 'No tiene dobles enlaces', 'Tiene demasiados electrones'], answer: 0, why: 'Con 4n e⁻ π hay dos electrones desapareados en OM degenerados no enlazantes.' },
      { q: '¿Por qué el ciclooctatetraeno no es aromático?', options: ['Se pliega en forma de bote para evitar la antiaromaticidad', 'Tiene 6 e⁻ π', 'No tiene carbonos sp²', 'Es demasiado pequeño'], answer: 0, why: 'Con 8 e⁻ π un COT plano sería antiaromático; se distorsiona y no hay conjugación cíclica completa.' },
      { q: '¿Cuántos e⁻ π tiene el anión ciclopentadienilo?', options: ['6', '4', '5', '8'], answer: 0, why: '4 de los dos C=C + 2 del par libre del carbanión = 6: aromático.' },
      { q: '¿Por qué el pirrol no es básico mientras que la piridina sí?', options: ['En el pirrol el par del N forma parte del sexteto π; en la piridina está en el plano', 'La piridina tiene más átomos de carbono', 'El pirrol tiene un N con carga positiva', 'La piridina no es aromática'], answer: 0, why: 'Protonar el N del pirrol destruiría el sexteto aromático; el par de la piridina (sp²) no participa.' },
      { q: '¿Qué molécula es aromática?', options: ['Catión tropilio (C₇H₇⁺)', 'Catión ciclopentadienilo (C₅H₅⁺)', 'Ciclopenta-1,3-dieno', 'Ciclobutadieno'], answer: 0, why: 'El tropilio tiene 6 e⁻ π en un anillo plano y totalmente conjugado.' },
      { q: 'En el círculo de Frost del benceno, ¿cuántos OM π enlazantes hay?', options: ['3', '2', '6', '1'], answer: 0, why: 'Hay un OM de menor energía y dos degenerados, enlazantes; los 6 e⁻ los llenan.' },
      { q: 'Explica la acidez del ciclopentadieno (pKa ≈ 16):', options: ['Su base conjugada es aromática (6 e⁻ π)', 'Tiene un grupo OH', 'Es un ácido carboxílico', 'Pierde un protón vinílico'], answer: 0, why: 'La desprotonación del CH₂ genera el anión ciclopentadienilo, aromático y muy estabilizado.' }
    ],
    help: { intro: 'Elige un compuesto en «Lab» o sigue la lección. Los lóbulos azules/rojos son las fases del orbital π elegido; los toroides morados, la nube π deslocalizada.', items: [['Orbital π', 'el control elige un OM entre los n posibles.'], ['Kekulé / Deslocalizado', 'compara el modelo clásico con la nube π.'], ['Círculo de Frost', 'energías y llenado en «Gráficos».'], ['Cálculo', 'regla de Hückel y energía de deslocalización.']] }
  };
  def.sync = function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo && !ctx.P.manual) u.mo.set(S.mo); if (u.refresh) u.refresh(); };
  MSim.create(def);
})();
