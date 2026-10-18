/* Sólidos cristalinos y celdas unitarias — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, f3 = function (x) { return fmt(x, 3); }, T = THREE, NA = 6.022e23, S3 = Math.sqrt(3);
  var C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  var FC = [[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]];
  var ED = [[.5, 0, 0], [.5, 1, 0], [.5, 0, 1], [.5, 1, 1], [0, .5, 0], [1, .5, 0], [0, .5, 1], [1, .5, 1], [0, 0, .5], [1, 0, .5], [0, 1, .5], [1, 1, .5]];
  var TD = [[.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]], TD2 = [[.75, .75, .75], [.25, .25, .75], [.25, .75, .25], [.75, .25, .25]];
  function mk(a, k) { return a.map(function (p) { return { p: p, k: k }; }); }
  var ST = [
    { id: 'sc', n: 'Cúbica simple (sc)', ex: 'Polonio', at: mk(C, 0), r: 0.5, a: 335, M: 209, Z: 1, cn: '6', pk: Math.PI / 6, rel: 'a = 2r', col: [0x4dabf7] },
    { id: 'bcc', n: 'Cúbica centrada en el cuerpo (bcc)', ex: 'Hierro α', at: mk(C, 0).concat([{ p: [.5, .5, .5], k: 0 }]), r: S3 / 4, a: 286.65, M: 55.845, Z: 2, cn: '8', pk: Math.PI * S3 / 8, rel: 'a = 4r/√3', col: [0xff922b] },
    { id: 'fcc', n: 'Cúbica centrada en las caras (fcc)', ex: 'Cobre', at: mk(C.concat(FC), 0), r: Math.SQRT2 / 4, a: 361.5, M: 63.55, Z: 4, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: 'a = 2√2·r', col: [0x51cf66] },
    { id: 'hcp', n: 'Hexagonal compacta (hcp, ABAB)', ex: 'Magnesio', stack: 'ABA', Z: 6, a: 320.9, c: 521, M: 24.305, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: 'c/a = 1,633 (ideal)' },
    { id: 'ccp', n: 'Cúbica compacta (ccp, ABC)', ex: 'Cobre / aluminio', stack: 'ABC', Z: 4, a: 361.5, M: 63.55, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: 'es la misma fcc, vista por capas' },
    { id: 'nacl', n: 'Cloruro de sodio (NaCl)', ex: 'sal de mesa', at: mk(C.concat(FC), 0).concat(mk(ED, 1), [{ p: [.5, .5, .5], k: 1 }]), rr: [181, 102], a: 564, M: 58.44, Z: 4, cn: '6 : 6', ion: true, form: 'NaCl', io: ['Cl⁻', 'Na⁺'] },
    { id: 'cscl', n: 'Cloruro de cesio (CsCl)', ex: 'CsCl', at: mk(C, 0).concat([{ p: [.5, .5, .5], k: 1 }]), rr: [181, 174], a: 412, M: 168.36, Z: 1, cn: '8 : 8', ion: true, form: 'CsCl', io: ['Cl⁻', 'Cs⁺'] },
    { id: 'zns', n: 'Blenda de cinc (ZnS)', ex: 'ZnS', at: mk(C.concat(FC), 0).concat(mk(TD, 1)), rr: [184, 74], a: 541, M: 97.45, Z: 4, cn: '4 : 4', ion: true, form: 'ZnS', io: ['S²⁻', 'Zn²⁺'] },
    { id: 'caf2', n: 'Fluorita (CaF₂)', ex: 'CaF₂', at: mk(C.concat(FC), 1).concat(mk(TD, 0), mk(TD2, 0)), rr: [133, 100], a: 546, M: 78.08, Z: 4, cn: '8 : 4', ion: true, form: 'CaF₂', io: ['F⁻', 'Ca²⁺'] }
  ], ID = {}; ST.forEach(function (s) { ID[s.id] = s; });
  var S = { st: 'sc', sz: 0.4, share: false, lay: 3, _k: '', _st: -1 }, grp = null, lab = {}, ats = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function share(p) { var n = 0; p.forEach(function (v) { if (v === 0 || v === 1) n++; }); return 1 / Math.pow(2, n); }
  function dens(s) { var V = s.id === 'hcp' ? 1.5 * S3 * s.a * s.a * s.c : s.a * s.a * s.a; return s.Z * s.M / (NA * V * 1e-30 * 1e6); }
  function stages() {
    return [
      ['Celdas unitarias', 'Celdas', 'Un cristal es la repetición de una celda unitaria en tres dimensiones',
        '<p>Un <b>sólido cristalino</b> es un conjunto ordenado de átomos, iones o moléculas. Su estructura se describe con una <b>celda unitaria</b>: el menor paralelepípedo que, repetido por traslación, genera todo el cristal. En el sistema <b>cúbico</b> hay tres redes: <b>simple (sc)</b>, <b>centrada en el cuerpo (bcc)</b> y <b>centrada en las caras (fcc)</b>. La arista es <b>a</b>.</p>'],
      ['Átomos por celda', 'Átomos/celda', 'Vértice 1/8 · arista 1/4 · cara 1/2 · interior 1',
        '<p>Los átomos de vértices, aristas y caras se <b>comparten con celdas vecinas</b>. Fracción dentro de la celda: <b>vértice 1/8, arista 1/4, cara 1/2, interior 1</b>. Resultado: <b>sc = 8·⅛ = 1</b>; <b>bcc = 8·⅛ + 1 = 2</b>; <b>fcc = 8·⅛ + 6·½ = 4</b>. Los colores indican cuánto de cada átomo pertenece a la celda.</p>'],
      ['Empaquetamiento y coordinación', 'Empaquetamiento', 'Fracción ocupada: sc 52,4 % · bcc 68,0 % · fcc 74,0 %',
        '<p>Con los átomos como esferas rígidas en contacto, la relación entre la arista y el radio depende de la red: <b>sc a = 2r</b>; <b>bcc a = 4r/√3</b> (contacto en la diagonal del cubo); <b>fcc a = 2√2·r</b> (contacto en la diagonal de la cara). La <b>fracción de empaquetamiento</b> = Z·(4/3)πr³ / a³ vale <b>0,524 · 0,680 · 0,740</b>, y el <b>número de coordinación</b> <b>6 · 8 · 12</b>. 0,740 es el máximo posible.</p>'],
      ['Empaquetamiento compacto', 'hcp y ccp', 'ABAB… (hcp) frente a ABCABC… (ccp = fcc): ambos 74 %',
        '<p>Las esferas se apilan en capas compactas hexagonales. La segunda capa (<b>B</b>) ocupa la mitad de los huecos de la primera; la tercera puede repetir <b>A</b> (<b>hcp</b>, ABAB…) o ocupar los huecos libres (<b>C</b>, <b>ccp</b>, ABCABC…, que equivale a la <b>fcc</b> vista según la diagonal del cubo). Ambas tienen <b>NC = 12</b> y <b>74 %</b> de ocupación; difieren en simetría y propiedades (p. ej. ductilidad).</p>'],
      ['Cristales iónicos', 'Iónicos', 'Los aniones forman la red y los cationes ocupan los huecos',
        '<p>En los sólidos iónicos el <b>ion mayor</b> (casi siempre el anión) forma el empaquetamiento y el menor ocupa <b>huecos octaédricos o tetraédricos</b>. La estructura depende de la <b>razón de radios r⁺/r⁻</b>: <b>NaCl</b> (0,56; 6:6, Cl⁻ fcc con Na⁺ en huecos octaédricos), <b>CsCl</b> (0,96; 8:8), <b>ZnS blenda</b> (0,40; 4:4, Zn²⁺ en huecos tetraédricos) y <b>CaF₂</b> (0,75; Ca²⁺ fcc con F⁻ en todos los huecos tetraédricos; 8:4).</p>'],
      ['Densidad desde la celda', 'Densidad', 'ρ = Z·M / (N_A·V_celda)',
        '<p>Conociendo la celda se calcula la densidad: <b>ρ = Z·M/(N<sub>A</sub>·a³)</b>. Para el cobre (fcc, a = 361,5 pm, M = 63,55 g/mol): <b>ρ = 4 × 63,55 / (6,022×10²³ × (3,615×10⁻⁸ cm)³) = 8,93 g/cm³</b>, igual al valor experimental. Invirtiendo la fórmula, la difracción de rayos X (que da a) permite obtener el número de Avogadro o la masa molar.</p>']
    ];
  }
  function sph(c, x, y, z, r, col, op) { var m = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: col, roughness: 0.35, transparent: op < 1, opacity: op })); m.scale.setScalar(r); m.position.set(x, y, z); c.add(m); return m; }
  function rebuild(ctx) {
    var s = ctx.scene; if (grp) s.remove(grp); grp = new T.Group(); ats = []; var st = ID[S.st], E = 6;
    if (st.stack) {
      var d = 2.1, h = d * Math.sqrt(2 / 3), pts = [[0, 0]]; [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]].forEach(function (ij) { pts.push(ij); });
      var sh = { A: [0, 0], B: [(d) / 2, d * S3 / 6], C: [d, d * S3 / 3] }, cols = { A: 0x4dabf7, B: 0xff922b, C: 0x51cf66 };
      for (var L = 0; L < 4; L++) { var lt = st.stack[L] || (st.stack === 'ABA' ? 'AB'[L % 2] : 'ABC'[L % 3]); pts.forEach(function (ij) { var x = ij[0] * d + ij[1] * d / 2 + sh[lt][0] - d * 0.5, z = ij[1] * d * S3 / 2 + sh[lt][1] - d * 0.3; var m = sph(grp, x, 0.4 + L * h * 1.0, z, d * 0.48, cols[lt], 1); ats.push({ m: m, L: L, lt: lt }); }); }
      grp.position.set(0, -2, 0);
    } else {
      var rr = st.ion ? [st.rr[0] / st.a, st.rr[1] / st.a] : [st.r, st.r], cols2 = st.ion ? [0x51cf66, 0xff6b6b] : st.col;
      var edges = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(E, E, E)), new T.LineBasicMaterial({ color: 0xadb5bd })); grp.add(edges);
      st.at.forEach(function (a) { var r = rr[a.k] * E, col = st.ion ? cols2[a.k] : cols2[0]; var m = sph(grp, (a.p[0] - .5) * E, (a.p[1] - .5) * E, (a.p[2] - .5) * E, r, col, 1); ats.push({ m: m, r: r, sh: share(a.p), col: col, k: a.k }); });
      grp.position.set(0, 3, 0);
    }
    s.add(grp); S._k = S.st;
  }
  var def = {
    key: 'solidos-cristalinos', title: 'Sólidos cristalinos', subtitle: 'Simulador 3D · química general', accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [8, 8, 12], target: [0, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 3, 17], target: [0, 3, 0] }, { id: 'sup', label: 'Superior', pos: [0, 17, 2], target: [0, 3, 0] }],
    layers: [{ id: 'cell', label: 'Celda unitaria', icon: '▢' }, { id: 'share', label: 'Fracción en la celda', icon: '⅛' }],
    build: function (ctx) { ['t', 'a', 'b'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.lay = 4;
        if (i === 0) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.35; S.share = false; }
        else if (i === 1) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.4; S.share = true; }
        else if (i === 2) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.4 + 0.6 * sm(((l * 3) % 1) / 0.5); S.share = false; }
        else if (i === 3) { S.st = l < 0.5 ? 'hcp' : 'ccp'; S.sz = 1; S.share = false; S.lay = Math.min(4, 1 + Math.floor(((l * 2) % 1) * 4.5)); }
        else if (i === 4) { S.st = ['nacl', 'cscl', 'zns', 'caf2'][Math.min(3, Math.floor(l * 4))]; S.sz = 0.7; S.share = false; }
        else { S.st = 'fcc'; S.sz = 1; S.share = false; }
      }
      if (S._k !== S.st) rebuild(ctx); var st = ID[S.st], cell = ctx.layer('cell'), shr = ctx.layer('share') || S.share;
      grp.children[0] && st.stack === undefined && (grp.children[0].visible = cell);
      var scol = { 1: 0x4dabf7, 0.5: 0x51cf66, 0.25: 0xffd43b, 0.125: 0xff6b6b };
      ats.forEach(function (a) {
        if (st.stack) { a.m.visible = a.L < S.lay; a.m.scale.setScalar(2.1 * 0.48 * (S.sz)); return; }
        a.m.scale.setScalar(a.r * S.sz); var c = shr ? ({ 1: 0xff922b, 0.5: 0x51cf66, 0.25: 0xffd43b, 0.125: 0x4dabf7 }[a.sh]) : a.col; a.m.material.color.setHex(c);
      });
      grp.rotation.y = Math.sin(now * 0.3) * 0.25;
      lab.t.pos(0, 8.2, 0).set(st.n, 'bl-lead').vis(true);
      var zz = st.stack ? st.Z : st.Z;
      lab.a.pos(0, -3.1, 0).set(st.stack ? 'capas: ' + (st.stack === 'ABA' ? 'A B A B' : 'A B C A') + ' · NC = 12 · empaquetamiento 74,0 %' : 'Z = ' + zz + (st.ion ? ' unidades ' + st.form : ' átomos') + ' · NC = ' + st.cn + (st.pk ? ' · ' + fmt(st.pk * 100, 1) + ' %' : ''), 'bl-pos').vis(true);
      lab.b.pos(0, -4.1, 0).set(st.ion ? st.io[0] + ' (verde/rojo según estructura) · a = ' + st.a + ' pm' : (st.stack ? (st.ex) : st.ex + ' · a = ' + st.a + ' pm'), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.st) u.st.set(S.st); if (!ctx.P.manual) { u.sz && u.sz.set(S.sz); u.lay && u.lay.set(S.lay); } },
    hud: function () { var st = ID[S.st]; return { eq: { chip: 'Z', name: st.n, body: '<div class="eqline"><small>Z por celda</small>' + st.Z + '</div><div class="eqline"><small>Coordinación</small>' + st.cn + '</div><div class="eqline"><small>Ocupación</small>' + (st.pk ? fmt(st.pk * 100, 1) + ' %' : '—') + '</div><div class="eqline"><small>ρ</small>' + f2(dens(st)) + ' g/cm³</div>' }, legend: S.share || false ? [{ label: '1/8', color: '#4dabf7', text: 'vértice' }, { label: '1/4', color: '#ffd43b', text: 'arista' }, { label: '1/2', color: '#51cf66', text: 'cara' }, { label: '1', color: '#ff922b', text: 'interior' }] : [{ label: 'Esfera', color: '#4dabf7', text: 'átomo o ion' }] }; },
    measures: function () { var st = ID[S.st], rpm = st.stack || st.ion ? null : st.r * st.a; return [['Estructura', st.n], ['Átomos por celda', String(st.Z)], ['Número de coordinación', st.cn], ['Arista a', st.a + ' pm'], ['Radio (contacto)', rpm ? f1(rpm) + ' pm' : '—'], ['Fracción ocupada', st.pk ? f1(st.pk * 100) + ' %' : '—'], ['Densidad', f2(dens(st)) + ' g/cm³']]; },
    ideas: ['<b>Z</b>: sc 1 · bcc 2 · fcc 4.', 'Empaquetamiento: sc 52,4 % · bcc 68 % · fcc/hcp 74 %.', 'NC: 6 · 8 · 12.', '<b>ρ = Z·M / (N_A·a³)</b>.', 'En un cristal iónico el ion mayor forma la red y el menor ocupa huecos.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Estructura'); el.appendChild(c);
      ui.st = kit.ui.options({ label: 'Red', cols: 3, value: S.st, options: ST.map(function (x) { return { v: x.id, label: x.id.toUpperCase().replace('NACL', 'NaCl').replace('CSCL', 'CsCl').replace('ZNS', 'ZnS').replace('CAF2', 'CaF₂'), sub: x.ex }; }), onChange: function (v) { ctx.goManual(); S.st = v; } }); c.appendChild(ui.st);
      ui.sz = kit.ui.slider({ label: 'Tamaño de las esferas', min: 0.2, max: 1, step: 0.02, value: S.sz, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.sz = v; } });
      ui.lay = kit.ui.slider({ label: 'Capas (hcp/ccp)', min: 1, max: 4, step: 1, value: S.lay, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.lay = v; } }); c.appendChild(kit.ui.sliders([ui.sz, ui.lay]));
      c.appendChild(ctx.btnRow([{ t: 'Esferas en contacto', primary: true, fn: function () { ctx.goManual(); S.sz = 1; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Fracción de empaquetamiento', h: 210, note: 'Fracción del volumen de la celda ocupada por esferas rígidas en contacto.', draw: function (cx, w, h, col) {
        var arr = [ID.sc, ID.bcc, ID.fcc, ID.hcp], L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / arr.length, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4 / 0.8 * 0.2 * 1; y = Tp + ph - ph * (i * 0.2) / 0.8; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(i * 20, 0) + ' %', L - 5, y + 3); }
        cx.textAlign = 'center'; arr.forEach(function (s, k) { var hh = ph * s.pk / 0.8; cx.fillStyle = s.id === S.st ? '#ff6b3d' : '#22d3ee'; cx.fillRect(L + k * bw + 8, Tp + ph - hh, bw - 16, hh); cx.fillStyle = col.ink; cx.fillText(f1(s.pk * 100), L + k * bw + bw / 2, Tp + ph - hh - 4); cx.fillStyle = col.muted; cx.fillText(s.id, L + k * bw + bw / 2, h - B + 13); });
      } },
      { title: 'Densidad calculada (g/cm³)', h: 220, note: 'ρ = Z·M/(N_A·V) para los ejemplos de cada estructura.', draw: function (cx, w, h, col) {
        var arr = ST, L = 40, Rr = 10, Tp = 12, B = 34, pw = w - L - Rr, ph = h - Tp - B, bw = pw / arr.length, mx = 10, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 5; i++) { var y = Tp + ph - ph * i / 5; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i * 2, L - 5, y + 3); }
        cx.textAlign = 'center'; arr.forEach(function (s, k) { var v = dens(s), hh = ph * Math.min(v, mx) / mx; cx.fillStyle = s.id === S.st ? '#ff6b3d' : '#22d3ee'; cx.fillRect(L + k * bw + 3, Tp + ph - hh, bw - 6, hh); cx.fillStyle = col.muted; cx.fillText(s.id, L + k * bw + bw / 2, h - B + 13); cx.fillStyle = col.ink; cx.fillText(f1(v), L + k * bw + bw / 2, Tp + ph - hh - 4); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, st = ID[S.st], d = dens(st), a = st.a;
      var geo = st.stack ? row('Celda hexagonal', 'V = (3√3/2)·a²·c = ' + (st.id === 'hcp' ? f2(1.5 * S3 * st.a * st.a * st.c * 1e-6) + '×10⁶ pm³' : 'a³ (equivale a fcc)')) : row('Relación a–r', st.ion ? 'contacto catión–anión' : st.rel + ' → r = ' + f1(st.r * st.a) + ' pm');
      return '<div class="card-kicker">' + st.n + '</div><div class="calc-step">1 · Contenido de la celda</div><table class="calc-table">' + row('Z', st.Z + (st.ion ? ' unidades de ' + st.form : ' átomos')) + row('Coordinación', st.cn) + (st.pk ? row('Empaquetamiento', f1(st.pk * 100) + ' %') : '') + geo + '</table>' +
        '<div class="calc-step">2 · Densidad</div><table class="calc-table">' + row('M', st.M + ' g/mol') + row('a', st.a + ' pm = ' + st.a + '×10⁻¹⁰ cm') + row('ρ', 'Z·M/(N<sub>A</sub>·V) = ' + st.Z + ' × ' + st.M + ' / (6,022×10²³ × V) = <b>' + f2(d) + ' g/cm³</b>') + '</table>';
    },
    quiz: [
      { q: '¿Cuántos átomos hay en una celda fcc?', options: ['4', '2', '1', '14'], answer: 0, why: '8·⅛ + 6·½ = 4.' },
      { q: '¿Cuál es el número de coordinación de la bcc?', options: ['8', '6', '12', '4'], answer: 0, why: 'Cada átomo toca a 8 vecinos, los de los vértices del cubo.' },
      { q: 'La relación entre arista y radio en la fcc es…', options: ['a = 2√2·r', 'a = 2r', 'a = 4r/√3', 'a = r√2'], answer: 0, why: 'El contacto es a lo largo de la diagonal de la cara: 4r = a√2.' },
      { q: 'El empaquetamiento máximo con esferas iguales es…', options: ['74 %', '52 %', '68 %', '100 %'], answer: 0, why: 'fcc y hcp: π/(3√2) ≈ 0,740.' },
      { q: 'La secuencia ABCABC… corresponde a…', options: ['ccp (fcc)', 'hcp', 'bcc', 'sc'], answer: 0, why: 'La tercera capa ocupa los huecos que la primera no cubre.' },
      { q: 'En NaCl la coordinación es…', options: ['6 : 6', '8 : 8', '4 : 4', '12 : 6'], answer: 0, why: 'Cada ion está rodeado por 6 contrarios en huecos octaédricos.' },
      { q: 'La fórmula de la densidad de un cristal es…', options: ['Z·M / (N_A·V)', 'M·V / (Z·N_A)', 'N_A·V / (Z·M)', 'Z·V / M'], answer: 0, why: 'Masa de la celda / volumen de la celda.' },
      { q: 'En la celda de CsCl hay…', options: ['1 unidad CsCl', '2 unidades', '4 unidades', '8 unidades'], answer: 0, why: '8·⅛ Cl⁻ + 1 Cs⁺ en el centro.' }
    ],
    help: { intro: 'Elige una red y cambia el tamaño de las esferas: con 100 % están en contacto. La capa «Fracción en la celda» colorea cada átomo según la parte que pertenece a la celda.', items: [['Capas', 'número de capas en hcp/ccp.'], ['Colores', 'azul 1/8 · amarillo 1/4 · verde 1/2 · naranja 1.']] }
  };
  MSim.create(def);
})();
