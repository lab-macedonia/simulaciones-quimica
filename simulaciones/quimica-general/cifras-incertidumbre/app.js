/* Cifras significativas e incertidumbre — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var IN = { bur: { n: 'Bureta 50 mL', u: 0.02, d: 2, un: 'mL', max: 50 }, pip: { n: 'Pipeta graduada 10 mL', u: 0.05, d: 2, un: 'mL', max: 10 }, prob: { n: 'Probeta 100 mL', u: 0.5, d: 0, un: 'mL', max: 100 }, ban: { n: 'Balanza analítica', u: 0.0001, d: 4, un: 'g', max: 100 }, bag: { n: 'Balanza granataria', u: 0.01, d: 2, un: 'g', max: 100 } };
  var S = { bias: 0, sig: 0.6, n: 12, seed: 1, ins: 'bur', val: 23.45, a: 12.3456, sa: 4, b: 3.14159, sb: 3, p: 0 }, lab = [], g = null, shots = [], tgt = null, meas = null;
  function rnd(i) { var x = Math.sin((i + S.seed * 31) * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function gauss(i) { var u = Math.max(1e-6, rnd(2 * i)), v = rnd(2 * i + 1); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function pts() { var a = []; for (var i = 0; i < S.n; i++) a.push({ x: S.bias * 0.7071 + S.sig * gauss(i), y: S.bias * 0.7071 + S.sig * gauss(i + 100) }); return a; }
  function stats() { var p = pts(), n = p.length, mx = 0, my = 0; p.forEach(function (q) { mx += q.x; my += q.y; }); mx /= n; my /= n; var s = 0; p.forEach(function (q) { s += Math.pow(q.x - mx, 2) + Math.pow(q.y - my, 2); }); return { mx: mx, my: my, sd: Math.sqrt(s / (n - 1) / 2), off: Math.hypot(mx, my) }; }
  function sf(x, n) { if (x === 0) return 0; var d = n - Math.floor(Math.log10(Math.abs(x))) - 1, f = Math.pow(10, d); return Math.round(x * f) / f; }
  function sfStr(x, n) { var r = sf(x, n), d = Math.max(0, n - Math.floor(Math.log10(Math.abs(r))) - 1); return fmt(r, d); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Exactitud y precisión', 'Exactitud', 'Exactitud: cerca del valor verdadero. Precisión: resultados cercanos entre sí',
        '<p>La <b>exactitud</b> indica cuán cerca está el promedio del <b>valor verdadero</b>; la <b>precisión</b>, cuán cerca están entre sí las medidas repetidas. El <b>error sistemático</b> (sesgo) afecta la exactitud; el <b>error aleatorio</b> (dispersión) afecta la precisión. En el blanco, el centro es el valor verdadero. Mueve «Sesgo» y «Dispersión» para ver las cuatro combinaciones.</p>'],
      ['Instrumentos e incertidumbre', 'Instrumentos', 'Cada instrumento tiene una incertidumbre: la lectura se escribe hasta ese decimal',
        '<p>Todo instrumento tiene una <b>incertidumbre de lectura</b>: bureta ±0,02 mL, probeta ±0,5 mL, balanza analítica ±0,0001 g. Una medida se escribe <b>valor ± incertidumbre</b>, con el <b>último decimal</b> del valor coincidente con el de la incertidumbre. La <b>incertidumbre relativa</b> u/valor indica la calidad: el mismo error pesa menos en volúmenes grandes.</p>'],
      ['Cifras significativas', 'Cifras sig.', 'Todos los dígitos ciertos más el primero incierto',
        '<p>Las <b>cifras significativas</b> son los dígitos ciertos más el primero dudoso. Reglas: dígitos distintos de cero cuentan; los <b>ceros entre dígitos</b> cuentan; los <b>ceros a la izquierda</b> no; los ceros a la derecha cuentan si hay <b>coma decimal</b>. En <b>sumas y restas</b> manda el menor n.º de <b>decimales</b>; en <b>productos y cocientes</b>, el menor n.º de <b>cifras significativas</b>.</p>'],
      ['Operar con cifras significativas', 'Operaciones', 'Suma: decimales. Producto: cifras',
        '<p>Define dos medidas a y b con distinta cantidad de cifras. La <b>suma</b> se redondea al menor número de <b>decimales</b> de los sumandos; el <b>producto</b> al menor número de <b>cifras significativas</b>. Redondea sólo al final, no en pasos intermedios, para no acumular error.</p>'],
      ['Propagación de la incertidumbre', 'Propagación', 'Suma: incertidumbres absolutas en cuadratura. Producto: relativas en cuadratura',
        '<p>Si a ± u<sub>a</sub> y b ± u<sub>b</sub> (la incertidumbre es 1 en el último dígito): para <b>s = a + b</b>, <b>u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)</b>; para <b>p = a·b</b>, <b>u<sub>p</sub>/p = √((u<sub>a</sub>/a)² + (u<sub>b</sub>/b)²)</b>. La incertidumbre resultante manda cuántos dígitos se informan.</p>']
    ];
  }
  var def = {
    key: 'cifras-incertidumbre', title: 'Cifras significativas e incertidumbre', subtitle: 'Simulador 3D · química general', accent: { dark: '#ffa94d', light: '#e67700' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 3, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 20], target: [0, 0, 0] }],
    layers: [{ id: 'shots', label: 'Disparos', icon: '•' }, { id: 'mean', label: 'Promedio', icon: '✚' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, cols = [0xf1f3f5, 0x212529, 0x4dabf7, 0x212529, 0xff6b6b, 0xf1f3f5];
      tgt = new T.Group(); tgt.position.set(5, 0, 0); g.add(tgt);
      for (i = 5; i >= 1; i--) { var d = new T.Mesh(new T.CylinderGeometry(i * 1.2, i * 1.2, 0.2, 40), mat(cols[5 - i + 0] || 0xffffff, 1)); d.rotation.x = Math.PI / 2; d.position.z = -0.1 * i; tgt.add(d); }
      for (i = 0; i < 40; i++) { var s = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), mat(0xffd43b, 1)); s.position.z = 0.3; tgt.add(s); shots.push(s); }
      meas = new T.Mesh(new T.SphereGeometry(0.35, 14, 10), mat(0x40c057, 1)); tgt.add(meas);
      var bur = new T.Group(); bur.position.set(-8, 0, 0); g.add(bur); g.userData.bur = bur;
      var tube = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 12, 20, 1, true), mat(0xa5d8ff, 0.25)); bur.add(tube);
      var lq = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1, 20), mat(0x74c0fc, 0.7)); bur.add(lq); g.userData.lq = lq;
      for (i = 0; i <= 50; i++) { var tk = new T.Mesh(new T.BoxGeometry(i % 10 === 0 ? 0.8 : (i % 5 === 0 ? 0.55 : 0.35), 0.03, 0.03), mat(0x212529, 1)); tk.position.set(0.9 + 0.1, 6 - i * 12 / 50, 0.55); bur.add(tk); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, st = stats(), p = pts(), ins = IN[S.ins], i = f.i;
      if (!P.manual) { if (i === 0) { S.bias = 3 * Math.abs(Math.sin(f.local * 6.28 * 0.5)); S.sig = 0.3 + 1.6 * Math.abs(Math.cos(f.local * 6.28 * 0.5)); } if (i === 1) { S.ins = ['bur', 'pip', 'prob', 'ban', 'bag'][Math.min(4, Math.floor(f.local * 5))]; } }
      ins = IN[S.ins]; if (!P.manual && i === 1) S.val = ins.max * 0.47;
      var sOn = ctx.layer('shots'), mOn = ctx.layer('mean'), showT = i !== 1 || P.manual;
      tgt.visible = !(!P.manual && i === 1) && !(!P.manual && i >= 2); g.userData.bur.visible = !tgt.visible;
      if (P.manual) { tgt.visible = true; g.userData.bur.visible = true; tgt.position.x = 5; g.userData.bur.position.x = -8; }
      shots.forEach(function (s, j) { s.visible = sOn && j < p.length; if (j < p.length) s.position.set(p[j].x * 1.2, p[j].y * 1.2, 0.3); });
      meas.visible = mOn; meas.position.set(st.mx * 1.2, st.my * 1.2, 0.5);
      var frac = S.val / ins.max; g.userData.lq.scale.y = 12 * (1 - frac) + 0.01; g.userData.lq.position.y = 6 - g.userData.lq.scale.y / 2;
      lab[0].pos(5, 8, 0).set('Exactitud: ' + (st.off < 0.6 ? 'alta' : 'baja') + ' · Precisión: ' + (st.sd < 0.7 ? 'alta' : 'baja'), (st.off < 0.6 && st.sd < 0.7) ? 'bl-pos' : 'bl-neg').vis(tgt.visible);
      lab[1].pos(5, -8, 0).set('desvío = ' + fmt(st.off, 2) + ' · s = ' + fmt(st.sd, 2), 'bl-d').vis(tgt.visible);
      lab[2].pos(-8, 7.8, 0).set(ins.n, 'bl-lead').vis(g.userData.bur.visible);
      lab[3].pos(-8, -7.5, 0).set(fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un, 'bl-d').vis(g.userData.bur.visible);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.bias) u.bias.set(S.bias); if (u.sig) u.sig.set(S.sig); if (u.ins) u.ins.set(S.ins); },
    hud: function () { var st = stats(), ins = IN[S.ins], rel = ins.u / S.val * 100; return { eq: { chip: '±', name: 'Medida y error', body: '<div class="eqline"><small>Sesgo medido</small>' + fmt(st.off, 2) + '</div><div class="eqline"><small>Dispersión s</small>' + fmt(st.sd, 2) + '</div><div class="eqline"><small>Instrumento</small>' + ins.n + '</div><div class="eqline"><small>Incert. relativa</small>' + fmt(rel, 2) + ' %</div>' }, legend: [{ label: 'Puntos amarillos', color: '#ffd43b', text: 'medidas repetidas' }, { label: 'Punto verde', color: '#40c057', text: 'promedio' }] }; },
    measures: function () { var st = stats(), ins = IN[S.ins], r = sf(S.a * S.b, Math.min(S.sa, S.sb)); return [['n medidas', String(S.n)], ['Desvío del promedio', fmt(st.off, 2)], ['Desviación estándar', fmt(st.sd, 2)], ['Lectura', fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un], ['a × b informado', sfStr(S.a * S.b, Math.min(S.sa, S.sb))]]; },
    ideas: ['Sesgo → exactitud; dispersión → precisión.', 'Suma: decimales; producto: cifras significativas.', 'Redondea sólo al final.', 'u relativa = u / valor.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Blanco de tiro'); el.appendChild(c);
      ui.bias = kit.ui.slider({ label: 'Sesgo (error sistemático)', min: 0, max: 3, step: 0.1, value: S.bias, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.bias = v; } });
      ui.sig = kit.ui.slider({ label: 'Dispersión (error aleatorio)', min: 0.1, max: 2, step: 0.1, value: S.sig, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.sig = v; } });
      var sn = kit.ui.slider({ label: 'N.º de medidas', min: 3, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      c.appendChild(kit.ui.sliders([ui.bias, ui.sig, sn])); c.appendChild(ctx.btnRow([{ t: 'Nueva serie', fn: function () { ctx.goManual(); S.seed++; } }]));
      var d = kit.ui.card('Instrumento'); el.appendChild(d);
      ui.ins = kit.ui.options({ label: 'Instrumento', cols: 1, value: S.ins, options: Object.keys(IN).map(function (k) { return { v: k, label: IN[k].n, sub: '± ' + IN[k].u + ' ' + IN[k].un }; }), onChange: function (v) { ctx.goManual(); S.ins = v; S.val = Math.min(S.val, IN[v].max); } }); d.appendChild(ui.ins);
      var sv = kit.ui.slider({ label: 'Lectura', min: 0, max: 50, step: 0.01, value: S.val, format: function (v) { return fmt(v, IN[S.ins].d) + ' ' + IN[S.ins].un; }, onInput: function (v) { ctx.goManual(); S.val = v; } });
      var sa = kit.ui.slider({ label: 'Cifras sig. de a (12,3456…)', min: 1, max: 6, step: 1, value: S.sa, format: function (v) { return v + ' → ' + sfStr(S.a, v); }, onInput: function (v) { ctx.goManual(); S.sa = v; } });
      var sb = kit.ui.slider({ label: 'Cifras sig. de b (3,14159…)', min: 1, max: 6, step: 1, value: S.sb, format: function (v) { return v + ' → ' + sfStr(S.b, v); }, onInput: function (v) { ctx.goManual(); S.sb = v; } });
      d.appendChild(kit.ui.sliders([sv, sa, sb])); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Distribución de las medidas', h: 220, note: 'Histograma de la coordenada x. Línea: valor verdadero (0).', draw: function (cx, w, h, col) {
      var p = pts(), L = 20, Rr = 10, Tp = 12, B = 26, pw = w - L - Rr, ph = h - Tp - B, bins = 16, cnt = [], i; for (i = 0; i < bins; i++) cnt.push(0); p.forEach(function (q) { var k = Math.floor((q.x + 4) / 8 * bins); if (k >= 0 && k < bins) cnt[k]++; });
      var mx = Math.max.apply(0, cnt) || 1; cx.fillStyle = '#4dabf7'; cnt.forEach(function (c, k) { cx.fillRect(L + pw * k / bins + 1, Tp + ph * (1 - c / mx), pw / bins - 2, ph * c / mx); });
      cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L + pw / 2, Tp); cx.lineTo(L + pw / 2, Tp + ph); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('−4', L, h - 8); cx.fillText('0', L + pw / 2, h - 8); cx.fillText('4', L + pw, h - 8);
    } }],
    calc: function () {
      var a = sf(S.a, S.sa), b = sf(S.b, S.sb), da = Math.pow(10, Math.floor(Math.log10(Math.abs(a))) - S.sa + 1), db = Math.pow(10, Math.floor(Math.log10(Math.abs(b))) - S.sb + 1), s = a + b, us = Math.hypot(da, db), pr = a * b, up = pr * Math.hypot(da / a, db / b), dpA = Math.max(0, -Math.floor(Math.log10(da))), dpB = Math.max(0, -Math.floor(Math.log10(db))), dec = Math.min(dpA, dpB), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">a = ' + sfStr(S.a, S.sa) + ' (' + S.sa + ' c.s.) · b = ' + sfStr(S.b, S.sb) + ' (' + S.sb + ' c.s.)</div><table class="calc-table">' + row('a + b (calculadora)', fmt(s, 6)) + row('a + b informado', '<b>' + fmt(s, dec) + '</b> (' + dec + ' decimales)') + row('u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)', fmt(us, 5)) + row('a · b (calculadora)', fmt(pr, 6)) + row('a · b informado', '<b>' + sfStr(pr, Math.min(S.sa, S.sb)) + '</b> (' + Math.min(S.sa, S.sb) + ' c.s.)') + row('u<sub>p</sub>', fmt(up, 5)) + '</table>';
    },
    quiz: [
      { q: '0,00450 tiene… cifras significativas.', options: ['3', '5', '6', '2'], answer: 0, why: '4, 5 y el cero final con coma decimal.' },
      { q: 'En 12,35 + 3,4 el resultado se informa con…', options: ['1 decimal', '2 decimales', '3 cifras sig. exactas', '4 decimales'], answer: 0, why: '15,75 → 15,8 (manda 3,4).' },
      { q: 'En 2,50 × 3,2 el resultado tiene…', options: ['2 cifras significativas', '3 cifras', '4 cifras', '1 cifra'], answer: 0, why: 'Menor n.º de cifras: 2 → 8,0.' },
      { q: 'Un error sistemático afecta principalmente a la…', options: ['exactitud', 'precisión', 'estadística', 'masa'], answer: 0, why: 'Desplaza todas las medidas.' },
      { q: 'La probeta 100 mL (±0,5) frente a la bureta (±0,02): para 20 mL…', options: ['la bureta tiene menor incertidumbre relativa', 'iguales', 'la probeta es más exacta', 'no se pueden comparar'], answer: 0, why: '0,02/20 ≪ 0,5/20.' },
      { q: 'Los ceros a la izquierda de un número…', options: ['no son significativos', 'son significativos', 'sólo si son pares', 'dependen del signo'], answer: 0, why: 'Sólo fijan la posición de la coma.' }
    ],
    help: { intro: 'En el blanco, mueve sesgo y dispersión. A la izquierda hay un instrumento para leer con su incertidumbre; en «Cálculo» ves sumas y productos con cifras significativas.', items: [['Punto verde', 'promedio de las medidas.'], ['Centro', 'valor verdadero.']] }
  };
  MSim.create(def);
})();
