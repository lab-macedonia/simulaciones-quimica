/* Radiactividad y química nuclear — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, sci = function (x) { return MSim.sci(x, 2); }, NAv = 6.022e23, YR = 3.156e7;
  var EL = 'n H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U'.split(' ');
  var MODE = { a: 'desintegración α', bm: 'desintegración β⁻', bp: 'desintegración β⁺', ec: 'captura electrónica' };
  var ISO = [
    { id: 'C14', Z: 6, A: 14, m: 'bm', t: 5730 * YR, th: '5730 años', n: 'Carbono-14' },
    { id: 'U238', Z: 92, A: 238, m: 'a', t: 4.468e9 * YR, th: '4,47×10⁹ años', n: 'Uranio-238' },
    { id: 'Ra226', Z: 88, A: 226, m: 'a', t: 1600 * YR, th: '1600 años', n: 'Radio-226' },
    { id: 'Po210', Z: 84, A: 210, m: 'a', t: 138.4 * 86400, th: '138 días', n: 'Polonio-210' },
    { id: 'Co60', Z: 27, A: 60, m: 'bm', t: 5.271 * YR, th: '5,27 años', n: 'Cobalto-60' },
    { id: 'I131', Z: 53, A: 131, m: 'bm', t: 8.02 * 86400, th: '8,02 días', n: 'Yodo-131' },
    { id: 'F18', Z: 9, A: 18, m: 'bp', t: 109.8 * 60, th: '109,8 min', n: 'Flúor-18' },
    { id: 'K40', Z: 19, A: 40, m: 'ec', t: 1.248e9 * YR, th: '1,25×10⁹ años', n: 'Potasio-40' }
  ], ID = {}; ISO.forEach(function (x) { ID[x.id] = x; });
  var S = { iso: 'C14', t: 0, dec: false, age: 0, mode: 'nuc', _st: -1 }, NG = 100, rank = [], lab = {}, nuc, em, gp, dm, pos = [], NNUC = 56, tmpC = new T.Color();
  function daughter(x) { var d = { a: [-2, -4], bm: [1, 0], bp: [-1, 0], ec: [-1, 0] }[x.m]; return { Z: x.Z + d[0], A: x.A + d[1] }; }
  function sym(Z, A) { return '<sup>' + A + '</sup>' + (EL[Z] || '?'); }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function lam(x) { return Math.LN2 / x.t; }
  function stages() {
    return [
      ['El núcleo', 'Núcleo', 'Z protones + N neutrones = A nucleones: notación ᴬ_Z X',
        '<p>El núcleo contiene <b>protones (Z)</b> y <b>neutrones (N)</b>; <b>A = Z + N</b> es el número másico. Los <b>isótopos</b> de un elemento tienen el mismo Z y distinto N. El <b>carbono-14</b> tiene Z = 6, N = 8, A = 14. Los nucleones se mantienen unidos por la <b>fuerza nuclear fuerte</b>, que supera la repulsión electrostática entre protones sólo a distancias de ~1 fm.</p>'],
      ['Banda de estabilidad', 'Estabilidad', 'N/Z ≈ 1 para núcleos ligeros y hasta ≈ 1,5 para los pesados',
        '<p>Los núcleos estables forman la <b>banda de estabilidad</b> en el plano N–Z: N ≈ Z hasta Z ≈ 20 y luego N/Z crece (≈ 1,5 en el plomo) porque se necesitan más neutrones para compensar la repulsión entre protones. Con <b>demasiados neutrones</b> el núcleo emite β⁻; con <b>demasiados protones</b>, β⁺ o captura electrónica; los núcleos pesados (Z &gt; 83) emiten <b>α</b>. Todos con Z &gt; 83 son radiactivos.</p>'],
      ['Desintegración alfa', 'Alfa', 'Emite ⁴He²⁺: Z baja 2 y A baja 4',
        '<p>En la <b>emisión α</b> el núcleo expulsa una partícula de <b>2 protones y 2 neutrones</b>: <b>ᴬ_Z X → ᴬ⁻⁴_(Z−2) Y + ⁴₂He</b>. Ejemplo: <b>²³⁸U → ²³⁴Th + α</b>. Es típica de núcleos pesados. La partícula α es muy ionizante pero poco penetrante: la detiene una hoja de papel.</p>'],
      ['Desintegración beta y captura', 'Beta', 'β⁻: n → p + e⁻ + ν̄ · β⁺: p → n + e⁺ + ν · captura: p + e⁻ → n + ν',
        '<p>En <b>β⁻</b> un neutrón se convierte en protón: Z sube 1 y A se mantiene (<b>¹⁴C → ¹⁴N + e⁻ + ν̄</b>). En <b>β⁺</b> un protón se convierte en neutrón (<b>¹⁸F → ¹⁸O + e⁺ + ν</b>, usado en tomografías PET). En la <b>captura electrónica</b> el núcleo absorbe un electrón de su corteza (<b>⁴⁰K → ⁴⁰Ar</b>). Siempre se conservan A y la carga total.</p>'],
      ['Vida media', 'Vida media', 'N(t) = N₀·2^(−t/t½) · A = λN',
        '<p>La desintegración es un proceso <b>aleatorio de primer orden</b>: cada núcleo tiene la misma probabilidad λ por unidad de tiempo. Tras cada <b>vida media (t½)</b> queda la mitad: <b>N = N₀·(½)^(t/t½)</b>, con <b>λ = ln 2 / t½</b>. La <b>actividad</b> A = λN se mide en becquerel (1 Bq = 1 desintegración/s). Cada punto del panel es un átomo; los azules ya se desintegraron.</p>'],
      ['Datación con carbono-14', 'Datación', 'Fracción de ¹⁴C restante → edad de la muestra',
        '<p>Los seres vivos incorporan ¹⁴C (formado por rayos cósmicos en la atmósfera) y mantienen una fracción constante. Al morir, el ¹⁴C decae con t½ = 5730 años: <b>edad = (t½/ln 2)·ln(N₀/N)</b>. Sirve hasta ≈ 50 000 años (≈ 9 vidas medias); para muestras más viejas se usan isótopos de vida media más larga (U-Pb, K-Ar).</p>']
    ];
  }
  var def = {
    key: 'radiactividad', title: 'Radiactividad y química nuclear', subtitle: 'Simulador 3D · química general', accent: { dark: '#fb923c', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 4, 20], target: [0, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 21], target: [0, 1, 0] }, { id: 'sup', label: 'Superior', pos: [0, 21, 3], target: [0, 0, 0] }],
    layers: [{ id: 'pop', label: 'Población de átomos', icon: '▦' }, { id: 'em', label: 'Partícula emitida', icon: '➜' }],
    build: function (ctx) {
      var s = ctx.scene, g = new T.SphereGeometry(1, 14, 10);
      nuc = new T.InstancedMesh(g, new T.MeshStandardMaterial({ roughness: 0.4 }), NNUC); nuc.frustumCulled = false; nuc.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NNUC * 3), 3); nuc.position.set(-6.5, 1, 0); s.add(nuc);
      gp = new T.InstancedMesh(g, new T.MeshStandardMaterial({ roughness: 0.4 }), NG); gp.frustumCulled = false; gp.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NG * 3), 3); gp.position.set(5, 1, 0); s.add(gp);
      em = new T.Mesh(g, new T.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.3, emissive: 0x1c4a7a })); s.add(em);
      dm = new T.Object3D();
      for (var i = 0; i < NNUC; i++) { var k = i + 0.5, ph = Math.acos(1 - 2 * k / NNUC), th = Math.PI * (1 + Math.sqrt(5)) * k, r = 0.85 * Math.cbrt(NNUC) * Math.pow((i + 1) / NNUC, 1 / 3) * 0.5; pos.push(new T.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th))); }
      var ord = []; for (i = 0; i < NG; i++) ord.push(i); for (i = NG - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ord[i]; ord[i] = ord[j]; ord[j] = t; } rank = ord;
      ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.mode = i === 4 || i === 5 ? 'pop' : 'nuc'; S.dec = i >= 2 && i <= 3; S.t = 0;
        if (i === 0) { S.iso = 'C14'; S.dec = false; }
        else if (i === 1) { S.iso = ISO[Math.min(ISO.length - 1, Math.floor(l * ISO.length))].id; }
        else if (i === 2) { S.iso = ['U238', 'Ra226', 'Po210'][Math.min(2, Math.floor(l * 3))]; }
        else if (i === 3) { S.iso = ['C14', 'F18', 'K40', 'Co60'][Math.min(3, Math.floor(l * 4))]; }
        else if (i === 4) { S.iso = 'C14'; S.t = 6 * sm(l); }
        else { S.iso = 'C14'; S.t = 6 * sm(l); S.age = S.t * 5730; }
      }
      var x = ID[S.iso], dd = daughter(x), cyc = S.dec ? (now * 0.28) % 1 : 0, after = S.dec && cyc > 0.45, Z = after ? dd.Z : x.Z, A = after ? dd.A : x.A, n = Math.min(NNUC, A), pn = Math.round(n * Z / A);
      for (var i = 0; i < NNUC; i++) {
        if (i >= n) { dm.scale.setScalar(0.0001); dm.position.set(0, -20, 0); } else { dm.position.copy(pos[i]); dm.position.x += 0.06 * Math.sin(now * 5 + i); dm.position.y += 0.06 * Math.cos(now * 4.3 + i * 2); dm.scale.setScalar(0.56); }
        dm.updateMatrix(); nuc.setMatrixAt(i, dm.matrix); tmpC.setHex(i < pn ? 0xff5c5c : 0x9aa7b4); if (S.dec && !after && x.m === 'bm' && i === n - 1) tmpC.setHex(0xffa94d); nuc.setColorAt(i, tmpC);
      }
      nuc.instanceMatrix.needsUpdate = true; nuc.instanceColor.needsUpdate = true; nuc.visible = true;
      // partícula emitida
      var eon = S.dec && ctx.layer('em') && cyc > 0.45;
      if (eon) { var u = (cyc - 0.45) / 0.55, dir = x.m === 'a' ? new T.Vector3(0.8, 0.5, 0.3) : new T.Vector3(0.7, -0.5, 0.4); dir.normalize(); em.position.set(-6.5, 1, 0).addScaledVector(dir, 3 + 12 * u); em.scale.setScalar(x.m === 'a' ? 0.75 : 0.28); em.material.color.setHex(x.m === 'a' ? 0xffd43b : (x.m === 'bp' ? 0xff8787 : 0x4dabf7)); em.visible = true; } else em.visible = false;
      // población
      var remain = Math.round(NG * Math.pow(2, -S.t)), pOn = ctx.layer('pop') && S.mode === 'pop';
      for (var k = 0; k < NG; k++) {
        if (!pOn) { dm.scale.setScalar(0.0001); dm.position.set(0, -20, 0); } else { var col = k % 10, row = Math.floor(k / 10), r = rank[k]; dm.position.set((col - 4.5) * 1.1, (4.5 - row) * 1.1, 0); dm.scale.setScalar(0.38); }
        dm.updateMatrix(); gp.setMatrixAt(k, dm.matrix); tmpC.setHex(rank[k] < remain ? 0xff922b : 0x4dabf7); gp.setColorAt(k, tmpC);
      }
      gp.instanceMatrix.needsUpdate = true; gp.instanceColor.needsUpdate = true;
      var N = A - Z;
      lab.t.pos(-6.5, 5.6, 0).set(sym(Z, A) + ' · ' + (x.n || '') + (after ? ' → núcleo hijo' : ''), 'bl-lead').vis(true);
      lab.a.pos(-6.5, -4.3, 0).set('Z = ' + Z + ' · N = ' + N + ' · A = ' + A, 'bl-d').vis(true);
      lab.b.pos(-6.5, -5.3, 0).set(S.dec ? MODE[x.m] + ': ' + sym(x.Z, x.A) + ' → ' + sym(dd.Z, dd.A) : 't½ = ' + x.th, 'bl-warn').vis(true);
      lab.c.pos(5, 6.4, 0).set('t = ' + f2(S.t) + ' t½ · queda ' + fmt(100 * Math.pow(2, -S.t), 1) + ' %', 'bl-pos').vis(pOn);
      lab.d.pos(5, -5.2, 0).set(x.n + ' · t½ = ' + x.th, 'bl-d').vis(pOn);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.iso) u.iso.set(S.iso); if (!ctx.P.manual) { u.t && u.t.set(S.t); } },
    hud: function () { var x = ID[S.iso], d = daughter(x); return { eq: { chip: '☢', name: x.n, body: '<div class="eqline"><small>Núcleo</small>' + sym(x.Z, x.A) + '</div><div class="eqline"><small>Modo</small>' + MODE[x.m] + '</div><div class="eqline"><small>Hijo</small>' + sym(d.Z, d.A) + '</div><div class="eqline"><small>t½</small>' + x.th + '</div>' }, legend: [{ label: 'Protón', color: '#ff5c5c', text: 'p⁺' }, { label: 'Neutrón', color: '#9aa7b4', text: 'n' }, { label: 'Azul', color: '#4dabf7', text: 'átomo ya desintegrado' }] }; },
    measures: function () { var x = ID[S.iso], d = daughter(x), l = lam(x); return [['Isótopo', x.n], ['Z / N / A', x.Z + ' / ' + (x.A - x.Z) + ' / ' + x.A], ['N/Z', f2((x.A - x.Z) / x.Z)], ['Modo', MODE[x.m]], ['t½', x.th], ['λ', sci(l) + ' s⁻¹'], ['Fracción restante', fmt(100 * Math.pow(2, -S.t), 2) + ' %'], ['Edad (C-14)', fmt(S.t * 5730, 0) + ' años']]; },
    ideas: ['<b>A = Z + N</b>; se conservan A y la carga.', 'N/Z estable ≈ 1 (ligeros) a 1,5 (pesados).', 'α: Z−2, A−4 · β⁻: Z+1 · β⁺ y captura: Z−1.', '<b>N = N₀·2^(−t/t½)</b>; λ = ln2/t½; Actividad = λN.', '¹⁴C: datación hasta ≈ 50 000 años.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Isótopo'); el.appendChild(c);
      ui.iso = kit.ui.options({ label: 'Núclido', cols: 2, value: S.iso, options: ISO.map(function (x) { return { v: x.id, label: x.n, sub: MODE[x.m] + ' · ' + x.th }; }), onChange: function (v) { ctx.goManual(); S.iso = v; } }); c.appendChild(ui.iso);
      ui.t = kit.ui.slider({ label: 'Tiempo transcurrido (t½)', min: 0, max: 8, step: 0.05, value: S.t, format: function (v) { return f2(v) + ' t½'; }, onInput: function (v) { ctx.goManual(); S.mode = 'pop'; S.t = v; S.age = v * 5730; } }); c.appendChild(kit.ui.sliders([ui.t]));
      c.appendChild(ctx.btnRow([{ t: 'Ver desintegración', primary: true, fn: function () { ctx.goManual(); S.mode = 'nuc'; S.dec = true; } }, { t: 'Núcleo estable', fn: function () { ctx.goManual(); S.dec = false; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Banda de estabilidad (N frente a Z)', h: 250, note: 'Línea: N ≈ Z + 0,0066·Z² (aprox. de los núcleos estables). Los puntos naranjas son los núclidos de esta lección.', draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (z) { return L + pw * z / 95; }, sy = function (n) { return Tp + ph - ph * n / 150; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 150; i += 50) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 5, sy(i) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 90; i += 30) cx.fillText(i, sx(i), h - B + 13); cx.fillText('Z (protones)  ·  N (neutrones)', L + pw / 2, h - 4);
        cx.strokeStyle = col.muted; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(95), sy(95)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText('N = Z', sx(70), sy(68));
        cx.strokeStyle = '#51cf66'; cx.lineWidth = 3; cx.beginPath(); for (i = 0; i <= 83; i++) { var n = i + 0.0066 * i * i; if (i) cx.lineTo(sx(i), sy(n)); else cx.moveTo(sx(i), sy(n)); } cx.stroke(); cx.lineWidth = 1;
        ISO.forEach(function (x) { var cur = x.id === S.iso; cx.fillStyle = cur ? '#ff6b3d' : '#ffa94d'; cx.beginPath(); cx.arc(sx(x.Z), sy(x.A - x.Z), cur ? 6 : 3.5, 0, 7); cx.fill(); if (cur) { var d = daughter(x); cx.strokeStyle = '#ff6b3d'; cx.beginPath(); cx.moveTo(sx(x.Z), sy(x.A - x.Z)); cx.lineTo(sx(d.Z), sy(d.A - d.Z)); cx.stroke(); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(EL[x.Z] + '-' + x.A, sx(x.Z) + 8, sy(x.A - x.Z) - 6); } });
      } },
      { title: 'Decaimiento exponencial', h: 220, note: 'N/N₀ frente a t/t½. Cada vida media la cantidad se divide por 2.', draw: function (cx, w, h, col) {
        var L = 44, Rr = 12, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (t) { return L + pw * t / 8; }, sy = function (v) { return Tp + ph - ph * v; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(i / 4)); cx.lineTo(L + pw, sy(i / 4)); cx.stroke(); cx.fillText(fmt(i / 4, 2), L - 5, sy(i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 8; i += 2) cx.fillText(i, sx(i), h - B + 13); cx.fillText('t / t½   ·   N/N₀', L + pw / 2, h - 4);
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.6; cx.beginPath(); for (i = 0; i <= 80; i++) { var t = 8 * i / 80; if (i) cx.lineTo(sx(t), sy(Math.pow(2, -t))); else cx.moveTo(sx(t), sy(1)); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.t), sy(Math.pow(2, -S.t)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, x = ID[S.iso], d = daughter(x), l = lam(x), Nm = NAv / x.A, Nt = Math.pow(2, -S.t), act = l * Nm;
      return '<div class="card-kicker">' + x.n + ' · ' + MODE[x.m] + '</div><div class="calc-step">1 · Ecuación nuclear</div><table class="calc-table">' + row('Reacción', sym(x.Z, x.A) + ' → ' + sym(d.Z, d.A) + ' + ' + { a: '<sup>4</sup>He', bm: 'e⁻ + ν̄', bp: 'e⁺ + ν', ec: 'ν (+ e⁻ capturado)' }[x.m]) + row('Conservación', 'A y carga iguales a ambos lados') + '</table>' +
        '<div class="calc-step">2 · Cinética</div><table class="calc-table">' + row('λ', 'ln2 / t½ = <b>' + sci(l) + ' s⁻¹</b>') + row('N/N₀ (t = ' + f2(S.t) + ' t½)', '2^(−' + f2(S.t) + ') = <b>' + fmt(Nt * 100, 2) + ' %</b>') + row('Átomos en 1 g', sci(Nm)) + row('Actividad de 1 g', '<b>' + sci(act) + ' Bq</b> (' + sci(act / 3.7e10) + ' Ci)') + '</table>' + (S.iso === 'C14' ? '<p class="muted small">Edad = (5730/ln2)·ln(N₀/N) = <b>' + fmt(S.t * 5730, 0) + ' años</b>.</p>' : '');
    },
    quiz: [
      { q: 'En la desintegración α, el núcleo hijo tiene…', options: ['Z−2 y A−4', 'Z−2 y A−2', 'Z+1 y A igual', 'Z−4 y A−2'], answer: 0, why: 'Se emite ⁴₂He.' },
      { q: '¿Qué ocurre en la desintegración β⁻?', options: ['un neutrón pasa a protón', 'un protón pasa a neutrón', 'se emite un núcleo de He', 'se absorbe un electrón'], answer: 0, why: 'n → p + e⁻ + ν̄; Z aumenta en 1.' },
      { q: 'El ¹⁸F se desintegra por…', options: ['β⁺ (¹⁸O)', 'β⁻ (¹⁸Ne)', 'α (¹⁴N)', 'γ pura'], answer: 0, why: 'Tiene exceso de protones: p → n + e⁺ + ν.' },
      { q: 'Tras 3 vidas medias, ¿qué fracción queda?', options: ['1/8', '1/3', '1/6', '1/4'], answer: 0, why: '(1/2)³ = 1/8.' },
      { q: 'λ está relacionada con t½ por…', options: ['λ = ln2 / t½', 'λ = t½ / ln2', 'λ = 1/t½²', 'λ = ln2·t½'], answer: 0, why: 'De N = N₀e^(−λt) con N = N₀/2.' },
      { q: 'Una muestra de madera tiene 25 % del ¹⁴C inicial. Su edad es…', options: ['≈ 11 460 años', '≈ 5730 años', '≈ 17 190 años', '≈ 22 920 años'], answer: 0, why: 'Dos vidas medias.' },
      { q: 'Los núcleos pesados estables tienen N/Z…', options: ['≈ 1,5', '≈ 1', '≈ 0,5', '≈ 3'], answer: 0, why: 'Más neutrones compensan la repulsión eléctrica.' },
      { q: '¿Cuál se conserva en toda reacción nuclear?', options: ['A y la carga', 'sólo Z', 'sólo N', 'la masa exacta'], answer: 0, why: 'El número másico total y la carga total se conservan.' }
    ],
    help: { intro: 'Elige un núclido en «Lab»; «Ver desintegración» muestra la emisión, y el control de tiempo muestra la población de átomos (azul = desintegrado).', items: [['Rojo/gris', 'protones / neutrones.'], ['Azul/naranja', 'átomos desintegrados / sin desintegrar.']] }
  };
  MSim.create(def);
})();
