/* Nucleótidos y coenzimas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var CO = {
    atp: { n: 'ATP', vit: '— (se sintetiza de novo)', vn: '', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'α-fosfato', 0xff922b, 'p'], ['P', 'β-fosfato', 0xff922b, 'p'], ['P', 'γ-fosfato', 0xff6b6b, 'p']], fn: 'moneda energética: ΔG°′ de hidrólisis ≈ −30,5 kJ/mol', e: -30.5 },
    nad: { n: 'NAD⁺ / NADH', vit: 'Niacina (vitamina B3)', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['N', 'Nicotinamida', 0x69db7c, 'ring']], fn: 'transportador de hidruro (H⁻) en rutas catabólicas; E°′ = −0,32 V', e: -0.32 },
    fad: { n: 'FAD / FADH₂', vit: 'Riboflavina (vitamina B2)', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['R', 'Ribitol', 0xffd43b, 'sugar'], ['F', 'Isoaloxazina', 0xfab005, 'ring']], fn: 'acepta 2 e⁻ y 2 H⁺; E°′ ≈ −0,22 V (unido a la enzima varía)', e: -0.22 },
    coa: { n: 'Coenzima A', vit: 'Ácido pantoténico (vitamina B5)', mod: [['A', 'Adenina 3′-fosfato-ribosa', 0x4dabf7, 'base'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['B', 'Pantotenato', 0xb197fc, 'sugar'], ['C', 'β-mercaptoetilamina', 0xf06595, 'sugar'], ['S', 'SH (tiol)', 0xe6c229, 'ring']], fn: 'transporta grupos acilo mediante un tioéster de alta energía (acetil-CoA: ΔG°′ ≈ −31,4 kJ/mol)', e: -31.4 }
  };
  var VIT = [['B1', 'Tiamina', 'TPP', 'descarboxilaciones'], ['B2', 'Riboflavina', 'FAD, FMN', 'redox (2 e⁻)'], ['B3', 'Niacina', 'NAD⁺, NADP⁺', 'hidruros'], ['B5', 'Ác. pantoténico', 'CoA', 'grupos acilo'], ['B6', 'Piridoxina', 'PLP', 'aminoácidos'], ['B7', 'Biotina', 'biocitina', 'carboxilaciones'], ['B9', 'Ácido fólico', 'THF', 'unidades C₁'], ['B12', 'Cobalamina', 'metil/adenosilcobalamina', 'isomerizaciones']];
  var S = { co: 'atp', p: 0, red: false }, g = null, lab = [], blocks = [], ez = null, hyd = null, wat = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function shape(kind, c) {
    var m = new T.MeshStandardMaterial({ color: c, roughness: 0.45, transparent: true, opacity: 0.95 }), gr = new T.Group(), k;
    if (kind === 'base') { for (k = 0; k < 2; k++) { var hx = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.35, k ? 5 : 6), m); hx.position.x = k * 1.5 - 0.7; gr.add(hx); } }
    else if (kind === 'sugar') { gr.add(new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.35, 5), m)); }
    else if (kind === 'p') { var tt = new T.Mesh(new T.TetrahedronGeometry(0.85), m); gr.add(tt); }
    else if (kind === 'ring') { for (k = 0; k < 3; k++) { var h2 = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.35, 6), m); h2.position.x = k * 1.3 - 1.3; if (k === 0) h2.position.x = -0.6; gr.add(h2); } gr.children[2].visible = true; }
    return gr;
  }
  function stages() {
    return [
      ['Nucleótidos: tres partes', 'Nucleótido', 'Base nitrogenada + pentosa + uno o más fosfatos',
        '<p>Un <b>nucleótido</b> está formado por una <b>base nitrogenada</b> (purina o pirimidina), una <b>pentosa</b> (ribosa o desoxirribosa) y de uno a tres <b>fosfatos</b>. Además de ser los monómeros del ADN y ARN, participan en la energía y señalización celular. La base unida a la ribosa por enlace <b>N-glucosídico</b> es un <b>nucleósido</b>; con fosfato, un nucleótido.</p>'],
      ['ATP: la moneda de energía', 'ATP', 'La hidrólisis del enlace fosfoanhídrido libera ≈ 30,5 kJ/mol',
        '<p>El <b>ATP</b> (adenosina trifosfato) tiene dos enlaces <b>fosfoanhídrido</b> de alta energía. Su hidrólisis a ADP + Pᵢ tiene <b>ΔG°′ ≈ −30,5 kJ/mol</b> y en la célula (concentraciones reales) ≈ −50 kJ/mol. Se explica por la <b>repulsión de cargas</b> entre fosfatos, la mejor solvatación de los productos y la <b>estabilización por resonancia</b> del Pᵢ. La energía se transfiere acoplando reacciones.</p>'],
      ['NAD⁺ y NADH', 'NAD⁺', 'El anillo de nicotinamida recibe un ion hidruro (H⁻) en C4',
        '<p>Las <b>deshidrogenasas</b> toman 2 e⁻ y 2 H⁺ del sustrato: el <b>NAD⁺</b> acepta un <b>ion hidruro (H⁻)</b> en el C4 del anillo de nicotinamida, que pasa de piridinio aromático a <b>1,4-dihidropiridina</b> (NADH), y se libera un H⁺. El NADH absorbe a <b>340 nm</b> (el NAD⁺ no), propiedad usada para seguir enzimas. Mueve «Avance» para ver el traspaso.</p>'],
      ['FAD y coenzima A', 'FAD y CoA', 'FAD: redox de 2 e⁻ ; CoA: transporte de grupos acilo por un tioéster',
        '<p>El <b>FAD</b> (de la riboflavina) acepta dos H en N5 y N1 de la isoaloxazina y es el coenzima de la <b>succinato deshidrogenasa</b> y la <b>acil-CoA deshidrogenasa</b>. La <b>coenzima A</b> termina en un <b>tiol (–SH)</b> que forma <b>tioésteres</b> (acetil-CoA), con ΔG°′ de hidrólisis similar al del ATP: grupos acilo «activados».</p>'],
      ['Vitaminas hidrosolubles → coenzimas', 'Vitaminas', 'Las vitaminas del grupo B son los precursores de los coenzimas',
        '<p>Muchos coenzimas derivan de <b>vitaminas del complejo B</b>, que el ser humano no sintetiza y debe obtener de la dieta: <b>niacina→NAD⁺</b>, <b>riboflavina→FAD</b>, <b>pantoténico→CoA</b>, <b>tiamina→TPP</b>, <b>piridoxina→PLP</b>, <b>folato→THF</b>, <b>biotina</b> y <b>B₁₂</b>. Su déficit afecta rutas completas (beriberi, pelagra, anemia megaloblástica…).</p>']
    ];
  }
  var def = {
    key: 'nucleotidos-coenzimas', title: 'Nucleótidos y coenzimas', subtitle: 'Simulador 3D · biología molecular', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 5, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 20, 2], target: [0, 0, 0] }],
    layers: [{ id: 'mod', label: 'Módulos', icon: '▤' }, { id: 'lab', label: 'Etiquetas', icon: 'A' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 5; i++) { var b = new T.Group(); g.add(b); blocks.push(b); }
      ez = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), new T.MeshBasicMaterial({ color: 0xfff3bf })); g.add(ez); hyd = ez;
      wat = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(wat);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, co; if (!P.manual) { S.co = ['atp', 'atp', 'nad', i === 3 ? (f.local < 0.5 ? 'fad' : 'coa') : 'nad', 'atp'][i]; S.p = i === 4 ? 0 : (i === 0 ? 0 : (f.local * (i === 3 ? 2 : 1)) % 1 * 1.0); }
      co = CO[S.co]; var q = sm(S.p), now = ctx.now, mOn = ctx.layer('mod'), lOn = ctx.layer('lab'), k;
      if (g.userData.k !== S.co) { g.userData.k = S.co; blocks.forEach(function (b, j) { while (b.children.length) b.remove(b.children[0]); if (co.mod[j]) b.add(shape(co.mod[j][3], co.mod[j][2])); }); }
      var n = co.mod.length, step = 3.0, x0 = -(n - 1) * step / 2;
      blocks.forEach(function (b, j) { b.visible = j < n && mOn; b.position.set(x0 + j * step, (j % 2 ? -0.4 : 0.4) * 0 + Math.sin(now + j) * 0.05, 0); b.rotation.y = 0; b.rotation.x = Math.PI / 2 - 0.3; });
      lab.forEach(function (l) { l.vis(false); });
      var extra = '';
      if (S.co === 'atp' && (S.p > 0 || P.manual)) { var last = blocks[4]; last.position.x += 2.8 * q; last.position.y += -1.2 * q; wat.visible = true; wat.position.set(blocks[3].position.x + 1.5 + 0 * q, 2.2 - 1.6 * q, 0); wat.scale.setScalar(1 - 0.4 * q); extra = q < 0.5 ? 'H₂O ataca al fósforo γ' : 'ATP + H₂O → ADP + Pᵢ'; } else wat.visible = false;
      ez.visible = false;
      if (S.co === 'nad') { var ring = blocks[4]; ring.children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(S.red || q > 0.5 ? 0x38d9a9 : 0x69db7c); }); }); ez.visible = true; ez.position.set(ring.position.x + 3.0 - 3.0 * sm(q), 2.4 - 1.0 * sm(q), 0); extra = q < 0.5 ? 'NAD⁺ (anillo aromático, N⁺)' : 'NADH (1,4-dihidropiridina): H⁻ en C4'; }
      if (S.co === 'fad') { extra = q < 0.5 ? 'FAD (oxidado)' : 'FADH₂ (reducido, 2 H en N1 y N5)'; blocks[4].children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(q > 0.5 ? 0xfff3bf : 0xfab005); }); }); }
      if (S.co === 'coa') { extra = q < 0.5 ? 'CoA–SH (tiol libre)' : 'acetil-CoA: tioéster CH₃CO–S–CoA'; if (q > 0.5) { ez.visible = true; ez.material.color.setHex(0xff922b); ez.scale.setScalar(2); ez.position.set(blocks[4].position.x + 1.4, 0.2, 0); } }
      lab[0].pos(0, 5, 0).set(co.n, 'bl-lead').vis(true); lab[1].pos(0, -4.2, 0).set(extra || co.fn, 'bl-d').vis(true);
      co.mod.forEach(function (m, j) { lab[2 + j].pos(blocks[j].position.x, -2.2, 0).set(m[1], 'bl-d').vis(lOn && j < 5 && 2 + j < 8); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.co) u.co.set(S.co); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var c = CO[S.co]; return { eq: { chip: c.n.split(' ')[0], name: c.n, body: '<div class="eqline"><small>Función</small>' + c.fn + '</div><div class="eqline"><small>Vitamina</small>' + c.vit + '</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'base nitrogenada' }, { label: 'Amarillo', color: '#ffd43b', text: 'pentosa' }, { label: 'Naranja', color: '#ff922b', text: 'fosfato' }] }; },
    measures: function () { var c = CO[S.co]; return [['Coenzima', c.n], ['Vitamina precursora', c.vit], ['Módulos', c.mod.map(function (m) { return m[1]; }).join(' – ')], ['Función', c.fn]]; },
    ideas: ['Nucleótido = base + pentosa + fosfato(s).', 'ATP → ADP + Pᵢ libera ≈ 30,5 kJ/mol.', 'NAD⁺ acepta H⁻ en C4.', 'Vitaminas B → coenzimas.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Coenzima'); el.appendChild(c);
      ui.co = kit.ui.options({ label: 'Elige', cols: 2, value: S.co, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n }; }), onChange: function (v) { ctx.goManual(); S.co = v; S.p = 0; } }); c.appendChild(ui.co);
      ui.p = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Energía libre de hidrólisis (ΔG°′, kJ/mol)', h: 230, note: 'Compuestos de alta energía frente a un éster sencillo.', draw: function (cx, w, h, col) {
        var D = [['PEP', -61.9], ['1,3-BPG', -49.4], ['Fosfocreatina', -43.1], ['ATP → ADP', -30.5], ['Acetil-CoA', -31.4], ['Glucosa-6-P', -13.8], ['Glicerol-3-P', -9.2]], L = 88, Rr = 28, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
        D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.co === 'atp' && d[0].indexOf('ATP') === 0) || (S.co === 'coa' && d[0] === 'Acetil-CoA'); cx.fillStyle = cur ? '#ffa94d' : '#4dabf7'; cx.fillRect(L, y + 4, pw * -d[1] / 65, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(d[1], 1), L + pw * -d[1] / 65 + 4, y + bh / 2 + 3); });
      } },
      { title: 'Vitaminas del complejo B y sus coenzimas', h: 250, note: 'Tabla de correspondencia.', draw: function (cx, w, h, col) {
        var rh = (h - 10) / (VIT.length + 1); cx.font = '10px system-ui'; cx.textAlign = 'left'; cx.fillStyle = col.muted; cx.fillText('Vit.', 4, rh - 4); cx.fillText('Nombre', 36, rh - 4); cx.fillText('Coenzima', w * 0.42, rh - 4); cx.fillText('Función', w * 0.7, rh - 4);
        VIT.forEach(function (v, j) { var y = (j + 1) * rh + 4; cx.fillStyle = col.ink; cx.fillText(v[0], 4, y + rh - 5); cx.fillText(v[1], 36, y + rh - 5); cx.fillText(v[2], w * 0.42, y + rh - 5); cx.fillText(v[3], w * 0.7, y + rh - 5); cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(0, y + rh); cx.lineTo(w, y + rh); cx.stroke(); });
      } }
    ],
    calc: function () { var c = CO[S.co], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.co === 'atp') { var Q = 0.05, ratio = 1.0; return '<div class="card-kicker">ΔG de la hidrólisis del ATP</div><table class="calc-table">' + row('ΔG°′', '−30,5 kJ/mol') + row('Condiciones celulares', '[ATP]/[ADP][Pᵢ] ≈ 10³ M⁻¹ → ΔG ≈ −50 kJ/mol') + row('Fórmula', 'ΔG = ΔG°′ + RT ln([ADP][Pᵢ]/[ATP])') + row('Con 3 mM ATP, 0,3 mM ADP, 5 mM Pᵢ', 'ΔG = −30,5 + 2,58 ln(0,0003·0,005/0,003) = <b>' + fmt(-30.5 + 2.58 * Math.log(0.0003 * 0.005 / 0.003), 1) + ' kJ/mol</b>') + '</table>'; } if (S.co === 'nad') return '<div class="card-kicker">NAD⁺ + 2H ⇌ NADH + H⁺</div><table class="calc-table">' + row('E°′', '−0,32 V') + row('ΔG°′ de la reducción (n = 2)', '−nFE°′ = <b>+' + fmt(2 * 96485 * 0.32 / 1000, 1) + ' kJ/mol</b>: el NADH es un donador de e⁻ fuerte') + row('λ de absorción', 'NADH 340 nm; NAD⁺ no absorbe') + row('Ley de Beer–Lambert', 'ε₃₄₀ = 6220 M⁻¹cm⁻¹') + '</table>'; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('Vitamina', c.vit) + row('Función', c.fn) + '</table>'; },
    quiz: [
      { q: 'Un nucleótido se compone de…', options: ['base + pentosa + fosfato', 'sólo base y fosfato', 'aminoácido + azúcar', 'ácido graso + glicerol'], answer: 0, why: 'Nucleósido + fosfato(s).' },
      { q: 'La vitamina precursora del NAD⁺ es…', options: ['niacina (B3)', 'riboflavina (B2)', 'tiamina (B1)', 'biotina'], answer: 0, why: 'Pelagra por déficit.' },
      { q: 'El NAD⁺ recibe…', options: ['un ion hidruro en C4', 'un protón en N', 'un átomo de O', 'un fosfato'], answer: 0, why: 'Reducción a 1,4-dihidropiridina.' },
      { q: 'La coenzima A forma…', options: ['tioésteres', 'ésteres de fosfato', 'amidas', 'éteres'], answer: 0, why: 'Con su grupo –SH.' },
      { q: 'La hidrólisis del ATP a ADP + Pᵢ tiene ΔG°′ ≈…', options: ['−30,5 kJ/mol', '+30,5 kJ/mol', '0', '−300 kJ/mol'], answer: 0, why: 'Reacción exergónica.' }
    ],
    help: { intro: 'Elige un coenzima: se muestra su estructura modular. Mueve «Avance» para ver la hidrólisis del ATP, el traspaso de hidruro al NAD⁺, la reducción del FAD o la formación del tioéster.', items: [['Módulos', 'base, azúcar, fosfato, anillo.'], ['Esfera blanca', 'H⁻ o grupo acilo transferido.']] }
  };
  MSim.create(def);
})();
