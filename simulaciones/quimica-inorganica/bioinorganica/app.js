/* Química bioinorgánica: metales en la vida — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, M = 210;
  var S = { site: 'hb', lig: 'o2', po2: 40, pco: 0, ph: 7.4, hill: 1, tox: 'none' }, g = null, keyG = '', lab = [];
  function hemoGeo(lig, dz) {
    var a = [['Fe', 0, 0, dz]], b = [], i, n = [];
    for (i = 0; i < 4; i++) { var t = i * Math.PI / 2; a.push(['N', 2.0 * Math.cos(t), 2.0 * Math.sin(t), 0]); b.push([0, 1 + i, 1]); }
    for (i = 0; i < 4; i++) {
      var t0 = i * Math.PI / 2, ia = 1 + i, ca1 = a.length; a.push(['C', 3.0 * Math.cos(t0 - 0.38), 3.0 * Math.sin(t0 - 0.38), 0]); var ca2 = a.length; a.push(['C', 3.0 * Math.cos(t0 + 0.38), 3.0 * Math.sin(t0 + 0.38), 0]);
      var cb1 = a.length; a.push(['C', 4.1 * Math.cos(t0 - 0.2), 4.1 * Math.sin(t0 - 0.2), 0]); var cb2 = a.length; a.push(['C', 4.1 * Math.cos(t0 + 0.2), 4.1 * Math.sin(t0 + 0.2), 0]);
      b.push([ia, ca1, 1], [ia, ca2, 1], [ca1, cb1, 1], [ca2, cb2, 1], [cb1, cb2, 2]); n.push([ca1, ca2]);
    }
    for (i = 0; i < 4; i++) { var tm = i * Math.PI / 2 + Math.PI / 4, me = a.length; a.push(['C', 3.9 * Math.cos(tm), 3.9 * Math.sin(tm), 0]); b.push([n[i][1], me, 1], [n[(i + 1) % 4][0], me, 1]); }
    // histidina proximal (imidazol en el plano xz sobre el hierro)
    var hz = dz + 2.1, N1 = a.length; a.push(['N', 0, 0, hz]); b.push([0, N1, 1]);
    a.push(['C', 1.1, 0, hz + 0.75]); a.push(['N', 0.7, 0, hz + 2.0]); a.push(['C', -0.7, 0, hz + 2.0]); a.push(['C', -1.1, 0, hz + 0.75]);
    b.push([N1, N1 + 1, 1], [N1 + 1, N1 + 2, 2], [N1 + 2, N1 + 3, 1], [N1 + 3, N1 + 4, 2], [N1 + 4, N1, 1]);
    if (lig === 'o2') { var o1 = a.length; a.push(['O', 0.5, 0, dz - 1.75]); a.push(['O', 1.2, 0, dz - 2.7]); b.push([0, o1, 1], [o1, o1 + 1, 2]); }
    if (lig === 'co') { var c1 = a.length; a.push(['C', 0, 0, dz - 1.75]); a.push(['O', 0, 0, dz - 2.9]); b.push([0, c1, 1], [c1, c1 + 1, 3]); }
    return { a: a, b: b };
  }
  var MET = {
    zn: { n: 'Zn²⁺ · anhidrasa carbónica', a: [['Zn', 0, 0, 0], ['N', 1.7, 0, 1.0], ['N', -0.9, 1.5, 1.0], ['N', -0.9, -1.5, 1.0], ['O', 0, 0, -1.9], ['H', 0.8, 0, -2.4], ['H', -0.8, 0, -2.4]], b: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6]], note: 'Tetraédrico: 3 His + H₂O. El Zn²⁺ polariza el agua y genera OH⁻ que ataca al CO₂: CO₂ + H₂O ⇌ HCO₃⁻ + H⁺.' },
    mg: { n: 'Mg²⁺ · clorofila a', a: [['Mg', 0, 0, 0]], b: [], note: 'Mg²⁺ en el centro de una clorina; no cambia de estado redox, mantiene la planaridad y la absorción de luz roja y azul.' },
    cu: { n: 'Cu · azurina (transferencia de e⁻)', a: [['Cu', 0, 0, 0], ['N', 1.9, 0, 0.3], ['N', -0.95, 1.6, 0.3], ['S', -0.95, -1.9, 0.2], ['S', 0, 0, 2.5]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], note: 'Sitio azul de cobre: His, His, Cys (S⁻) y Met axial. Cu²⁺/Cu⁺ con poca reorganización: transferencia rápida de e⁻.' },
    cyt: { n: 'Fe · citocromo c (Fe³⁺/Fe²⁺)', a: [['Fe', 0, 0, 0]], b: [], note: 'Fe hexacoordinado (porfirina + His + Met): sin sitio libre para O₂, sólo transporta electrones, E° ≈ +0,25 V.' }
  };
  var TOX = { none: { n: 'Sin tóxico', m: '' }, pb: { n: 'Pb²⁺', m: 'Reemplaza a Ca²⁺ y Zn²⁺ (inhibe la ALA deshidratasa).' }, hg: { n: 'Hg²⁺ / CH₃Hg⁺', m: 'Ácido blando: se une a grupos –SH (cisteína).' }, cd: { n: 'Cd²⁺', m: 'Desplaza al Zn²⁺ de enzimas y se acumula en el riñón.' } };
  function p50() { return 26 * Math.pow(10, 0.45 * (7.4 - S.ph)); }
  function n() { return S.hill; }
  function pco50() { return 26 / M; }
  function yO2(p, nn, pc) { var x = Math.pow(p / p50(), nn); return x / (1 + x + (pc || 0) / pco50()); }
  function yCO() { var x = Math.pow(S.po2 / p50(), n()); return (S.pco / pco50()) / (1 + x + S.pco / pco50()); }
  function ymb(p) { return p / (p + 2.8); }
  function stages() {
    return [
      ['El grupo hemo', 'Hemo', 'Fe²⁺ en una porfirina, con una histidina proximal y un sitio libre para O₂',
        '<p>En la <b>hemoglobina</b> y la <b>mioglobina</b>, el <b>Fe²⁺</b> está unido a los 4 N de una <b>porfirina</b> y a la <b>histidina proximal</b>; la sexta posición queda libre para el <b>O₂</b>. Al desoxigenado, el Fe (alto espín) sobresale ~0,4 Å del plano; al unir O₂ (bajo espín) entra en el plano y arrastra a la histidina, lo que dispara el cambio de estructura de la proteína.</p>'],
      ['Cooperatividad', 'Cooperatividad', 'Curva sigmoidea: n de Hill ≈ 2,8',
        '<p>La hemoglobina tiene <b>4 subunidades</b> y une O₂ de forma <b>cooperativa</b>: cada O₂ unido facilita el siguiente, y la curva es <b>sigmoidea</b> (n de Hill ≈ 2,8, P₅₀ ≈ 26 mmHg). La mioglobina, de una sola subunidad, es hiperbólica (P₅₀ ≈ 2,8 mmHg). Así Hb carga O₂ en el pulmón y lo descarga en los tejidos.</p>'],
      ['Efecto Bohr', 'Efecto Bohr', 'Menor pH → menor afinidad por O₂',
        '<p>Un <b>pH más bajo</b> (más CO₂ y H⁺ en los tejidos activos) <b>estabiliza la forma desoxigenada</b> y desplaza la curva hacia la derecha: sube la P₅₀ y la Hb entrega más O₂ justo donde se necesita (efecto <b>Bohr</b>). Aquí P₅₀ = 26·10<sup>0,45(7,4 − pH)</sup>, un modelo simplificado.</p>'],
      ['Envenenamiento por CO', 'CO', 'El CO se une al Fe²⁺ ~200 veces mejor que el O₂',
        '<p>El <b>CO</b> es un ligando π-aceptor que se une al Fe²⁺ con afinidad <b>≈ 210 veces mayor</b> que el O₂ y deja la Hb en la forma R, que retiene el O₂ restante: la sangre transporta menos oxígeno y lo entrega peor. Aumenta pCO y observa cómo cae la saturación de O₂.</p>'],
      ['Otros metales y toxicidad', 'Metales', 'Zn, Mg, Cu, Fe (citocromo) y metales tóxicos',
        '<p>Cada metal cumple un papel según su química: <b>Zn²⁺</b> como ácido de Lewis (anhidrasa carbónica), <b>Mg²⁺</b> en la clorofila, <b>Cu</b> en proteínas de transferencia de electrones (azurina) y <b>Fe</b> hexacoordinado en los citocromos. Los metales tóxicos actúan por <b>sustitución</b> (Pb²⁺, Cd²⁺) o por afinidad blanda con –SH (Hg²⁺); los <b>quelantes</b> (EDTA, BAL) los retiran de la sangre.</p>']
    ];
  }
  var def = {
    key: 'bioinorganica', title: 'Química bioinorgánica: metales en la vida', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [21, 8, 18], target: [21, 0, 0] }, { id: 'lateral', label: 'Lateral', pos: [21, 0, 20], target: [21, 0, 0] }],
    layers: [{ id: 'spin', label: 'Rotación', icon: '⟳' }],
    build: function (ctx) { g = new T.Group(); g.position.set(25, 0, 0); ctx.scene.add(g); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i;
      if (!P.manual) {
        if (i === 0) { S.site = 'hb'; S.lig = ['none', 'o2', 'co'][Math.min(2, Math.floor(f.local * 3))]; }
        if (i === 1) { S.site = 'hb'; S.lig = 'o2'; S.po2 = 1 + 99 * f.local; S.ph = 7.4; S.pco = 0; S.hill = 2.8; }
        if (i === 2) { S.site = 'hb'; S.lig = 'o2'; S.ph = 7.6 - 1.0 * f.local; S.po2 = 40; S.pco = 0; S.hill = 2.8; }
        if (i === 3) { S.site = 'hb'; S.pco = 0.6 * f.local; S.po2 = 100; S.ph = 7.4; S.lig = f.local > 0.45 ? 'co' : 'o2'; S.hill = 2.8; }
        if (i === 4) { S.site = ['zn', 'mg', 'cu', 'cyt'][Math.min(3, Math.floor(f.local * 4))]; S.tox = ['none', 'pb', 'hg', 'cd'][Math.min(3, Math.floor(f.local * 4))]; }
      }
      var k = S.site + '|' + S.lig + '|' + S.tox;
      if (keyG !== k) {
        keyG = k; while (g.children.length) g.remove(g.children[0]);
        if (S.site === 'hb') { var dz = S.lig === 'none' ? 0.55 : 0; g.add(ctx.mol(hemoGeo(S.lig, dz), { gs: 1.0, ar: 0.55 })); }
        else if (S.site === 'mg') { var ge = hemoGeo('none', 0); ge.a = ge.a.slice(0, ge.a.length - 5); ge.b = ge.b.filter(function (x) { return x[0] < ge.a.length && x[1] < ge.a.length; }); ge.a[0] = ['Mg', 0, 0, 0]; g.add(ctx.mol(ge, { gs: 1.0, ar: 0.55 })); }
        else if (S.site === 'cyt') { var gc = hemoGeo('none', 0); var gb = gc.a.length; gc.a.push(['S', 0, 0, -2.3]); gc.b.push([0, gb, 1]); g.add(ctx.mol(gc, { gs: 1.0, ar: 0.55 })); }
        else { var m2 = MET[S.site], geo = { a: m2.a.map(function (x) { return x.slice(); }), b: m2.b.slice() }; if (S.tox !== 'none' && S.site === 'zn') geo.a[0] = [S.tox === 'pb' ? 'Pb' : (S.tox === 'cd' ? 'Cd' : 'Hg'), 0, 0, 0]; g.add(ctx.mol(geo, { gs: 1.4, ar: 0.7 })); }
      }
      if (ctx.layer('spin')) g.rotation.y += dt * 0.35; g.rotation.x = -0.9;
      var st = S.site === 'hb';
      lab[0].pos(25, 8.4, 0).set(st ? 'Grupo hemo · ' + (S.lig === 'o2' ? 'oxihemoglobina (Fe en el plano)' : (S.lig === 'co' ? 'carboxihemoglobina (CO)' : 'desoxihemoglobina (Fe fuera del plano)')) : MET[S.site].n, 'bl-lead').vis(true);
      lab[1].pos(25, -6.2, 0).set(st ? 'saturación O₂: ' + fmt(yO2(S.po2, n(), S.pco) * 100, 0) + ' % · CO: ' + fmt(yCO() * 100, 0) + ' %' : (S.tox !== 'none' && S.site === 'zn' ? TOX[S.tox].n + ' ocupa el sitio del Zn²⁺' : ''), 'bl-pos').vis(true);
      lab[2].pos(25, -7.6, 0).set(st ? 'pO₂ ' + fmt(S.po2, 0) + ' mmHg · pH ' + fmt(S.ph, 2) + ' · P₅₀ ' + fmt(p50(), 1) + ' mmHg' : '', 'bl-d').vis(st);
      lab[3].pos(25, -7.6, 0).set(!st ? (S.tox !== 'none' ? TOX[S.tox].m : '') : '', 'bl-neg').vis(!st && S.tox !== 'none');
    },
    sync: function (ctx) { var u = ctx.ui; ['lig', 'po2', 'pco', 'ph', 'site', 'tox'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'Fe', name: 'Transporte de O₂', body: '<div class="eqline"><small>Sat. O₂</small>' + fmt(yO2(S.po2, n(), S.pco) * 100, 0) + ' %</div><div class="eqline"><small>Sat. CO</small>' + fmt(yCO() * 100, 0) + ' %</div><div class="eqline"><small>P₅₀</small>' + fmt(p50(), 1) + ' mmHg</div><div class="eqline"><small>n Hill</small>' + fmt(n(), 1) + '</div>' }, legend: [{ label: 'Esfera naranja', color: '#e06633', text: 'Fe' }, { label: 'Azul', color: '#4f7cff', text: 'N (porfirina e histidina)' }, { label: 'Rojo', color: '#ff4d4d', text: 'O₂' }] }; },
    measures: function () { return [['Saturación O₂', fmt(yO2(S.po2, n(), S.pco) * 100, 0) + ' %'], ['Saturación CO', fmt(yCO() * 100, 0) + ' %'], ['P₅₀ (O₂)', fmt(p50(), 1) + ' mmHg'], ['n de Hill', fmt(n(), 1)], ['Afinidad CO/O₂', '≈ 210 ×'], ['Sitio mostrado', S.site === 'hb' ? 'hemo' : MET[S.site].n]]; },
    ideas: ['Hb cooperativa: sigmoide (n ≈ 2,8).', 'Menor pH → mayor P₅₀ (Bohr).', 'CO ≈ 210× más afín que O₂.', 'Metales tóxicos sustituyen o se unen a –SH.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Hemoglobina'); el.appendChild(c);
      ui.site = kit.ui.options({ label: 'Sitio', cols: 3, value: S.site, options: [{ v: 'hb', label: 'Hemo (Hb)' }, { v: 'zn', label: 'Zn · CA' }, { v: 'mg', label: 'Mg · clorofila' }, { v: 'cu', label: 'Cu · azurina' }, { v: 'cyt', label: 'Fe · cit. c' }], onChange: function (v) { ctx.goManual(); S.site = v; } });
      ui.lig = kit.ui.options({ label: 'Ligando del hemo', cols: 3, value: S.lig, options: [{ v: 'none', label: 'Ninguno' }, { v: 'o2', label: 'O₂' }, { v: 'co', label: 'CO' }], onChange: function (v) { ctx.goManual(); S.lig = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.site); c.appendChild(ui.lig); c.appendChild(kit.ui.sliders([sl('po2', 'pO₂', 1, 100, 1, function (v) { return v + ' mmHg'; }), sl('pco', 'pCO', 0, 0.6, 0.01, function (v) { return fmt(v, 2) + ' mmHg'; }), sl('ph', 'pH', 6.8, 7.8, 0.05, function (v) { return fmt(v, 2); }), sl('hill', 'n de Hill (1 = mioglobina)', 1, 3, 0.1, function (v) { return fmt(v, 1); })]));
      ui.tox = kit.ui.options({ label: 'Metal tóxico en el sitio de Zn', cols: 2, value: S.tox, options: Object.keys(TOX).map(function (k) { return { v: k, label: TOX[k].n }; }), onChange: function (v) { ctx.goManual(); S.tox = v; S.site = 'zn'; } }); c.appendChild(ui.tox);
      c.appendChild(ctx.btnRow([{ t: 'Hb (n = 2,8)', fn: function () { ctx.goManual(); S.hill = 2.8; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Curva de saturación de O₂', h: 220, note: 'Hb: sigmoide cooperativa. Mb: hiperbólica a la izquierda. El punto marca la pO₂ actual.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; function X(p) { return L + pw * p / 100; } function Yy(v) { return Tp + ph * (1 - v); }
      [[function (p) { return ymb(p); }, '#69db7c'], [function (p) { return yO2(p, n(), S.pco); }, '#ff8787']].forEach(function (s) { cx.strokeStyle = s[1]; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 100; i++) { var xx = X(i), yy = Yy(s[0](i)); i ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy); } cx.stroke(); });
      cx.lineWidth = 1; cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(X(S.po2), Yy(yO2(S.po2, n(), S.pco)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('100 mmHg', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8); cx.fillText('Mb', X(60), Yy(ymb(60)) - 6); cx.fillText('Hb', X(60) + 10, Yy(yO2(60, n(), S.pco)) + 14);
    } }, { title: 'P₅₀ según el pH (efecto Bohr)', h: 190, note: 'A pH menor la Hb necesita mayor pO₂ para saturarse al 50 %.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 50; i++) { var pH = 6.8 + i * 0.02, v = 26 * Math.pow(10, 0.45 * (7.4 - pH)), xx = L + pw * i / 50, yy = Tp + ph * (1 - v / 60); i ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(L + pw * (S.ph - 6.8) / 1.0, Tp + ph * (1 - p50() / 60), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('pH 6,8', L, h - 8); cx.fillText('pH 7,8', L + pw, h - 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, x = Math.pow(S.po2 / p50(), n()); return '<div class="card-kicker">Ecuación de Hill con competencia por CO</div><table class="calc-table">' + row('P₅₀', '26 · 10^(0,45·(7,4 − ' + fmt(S.ph, 2) + ')) = <b>' + fmt(p50(), 1) + ' mmHg</b>') + row('(pO₂/P₅₀)ⁿ', fmt(S.po2, 0) + '/' + fmt(p50(), 1) + ' ^ ' + fmt(n(), 1) + ' = ' + fmt(x, 2)) + row('Y(O₂)', 'x / (1 + x + pCO/P₅₀,CO) = <b>' + fmt(yO2(S.po2, n(), S.pco) * 100, 1) + ' %</b>') + row('Y(CO)', '<b>' + fmt(yCO() * 100, 1) + ' %</b> (P₅₀,CO = P₅₀(O₂)/210 = ' + fmt(pco50(), 3) + ' mmHg)') + row('Y(Mb)', fmt(ymb(S.po2) * 100, 1) + ' %') + '</table>'; },
    quiz: [
      { q: 'En la desoxihemoglobina el Fe²⁺ está…', options: ['sobresaliendo del plano de la porfirina', 'en el centro exacto del plano', 'en estado Fe³⁺', 'libre de la proteína'], answer: 0, why: 'Alto espín, radio mayor.' },
      { q: 'La curva de la hemoglobina es sigmoidea por…', options: ['cooperatividad entre subunidades', 'baja afinidad por O₂', 'ser monómero', 'el pH constante'], answer: 0, why: 'Cada O₂ facilita el siguiente.' },
      { q: 'Al bajar el pH, la P₅₀ de la Hb…', options: ['aumenta', 'disminuye', 'no cambia', 'se anula'], answer: 0, why: 'Efecto Bohr: menor afinidad.' },
      { q: 'El CO se une a la Hb con una afinidad aproximada…', options: ['210 veces mayor que el O₂', 'igual que el O₂', '10 veces menor', 'nula'], answer: 0, why: 'Ligando π-aceptor fuerte.' },
      { q: 'El Zn²⁺ en la anhidrasa carbónica actúa como…', options: ['ácido de Lewis', 'transportador de e⁻', 'donador de O₂', 'quelante'], answer: 0, why: 'Polariza el H₂O coordinado.' },
      { q: 'El Hg²⁺ es tóxico principalmente por unirse a…', options: ['grupos –SH', 'grupos –OH duros', 'el CO₂', 'las porfirinas libres'], answer: 0, why: 'Ácido blando ↔ base blanda S.' }
    ],
    help: { intro: 'En «Lab» elige el ligando (nada, O₂, CO), la pO₂, el pH y la pCO; en «Gráficos» se ve la curva de saturación. En la última etapa se muestran otros sitios metálicos.', items: [['Esfera naranja', 'Fe del hemo.'], ['Esferas rojas', 'O₂ unido.']] }
  };
  MSim.create(def);
})();
