/* Corrosión y protección del hierro — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var E = { fe: -0.44, zn: -0.76, sn: -0.14, cu: 0.34, mg: -2.37 };
  var CO = { none: { n: 'Hierro desnudo', m: null }, zn: { n: 'Galvanizado (Zn)', m: 'zn', c: 0x9fb0c8 }, sn: { n: 'Hojalata (Sn)', m: 'sn', c: 0xdee2e6 }, cu: { n: 'Cobreado (Cu)', m: 'cu', c: 0xd9822b }, mg: { n: 'Ánodo de sacrificio (Mg)', m: 'mg', c: 0xe9ecef } };
  var PILA = [['Zn–C (seca)', 1.5, 'Zn | MnO₂'], ['Alcalina', 1.5, 'Zn | MnO₂ (KOH)'], ['Ni–MH', 1.2, 'MH | NiOOH'], ['Plomo-ácido (celda)', 2.0, 'Pb | PbO₂'], ['Ion-litio', 3.7, 'LiC₆ | LiCoO₂']];
  var S = { coat: 'none', salt: 1, o2: 70, ph: 7, t: 0 }, g = null, fe2 = [], oh = [], el = [], rust = [], plate = null, coatM = null, lab = [], anodeMesh = null, drop = null;
  function anode() { var c = CO[S.coat].m; if (!c) return 'fe'; return E[c] < E.fe ? c : 'fe'; }
  function ecat() { return 1.23 - 0.0592 * S.ph; }
  function rate() { var a = anode(), drive = ecat() - E[a]; return drive * (0.15 + 0.85 * Math.min(1, S.salt / 2)) * (0.1 + 0.9 * S.o2 / 100); }
  function feRate() { if (S.coat === 'none') return rate(); var c = CO[S.coat].m; if (anode() === 'fe') return rate() * (c === 'cu' ? 1.4 : 1.2); return 0; }
  var NM = { fe: 'Fe', zn: 'Zn', sn: 'Sn', cu: 'Cu', mg: 'Mg' };
  function stages() {
    return [
      ['La corrosión es una pila', 'Pila', 'En la gota hay un ánodo (Fe → Fe²⁺ + 2e⁻) y un cátodo (O₂ + 2H₂O + 4e⁻ → 4OH⁻)',
        '<p>El hierro se corroe como una <b>pila galvánica</b> en miniatura. El centro de la gota, pobre en O₂, es el <b>ánodo</b>: <b>Fe → Fe²⁺ + 2e⁻</b>. Los electrones viajan por el metal hasta el borde, rico en O₂, el <b>cátodo</b>: <b>O₂ + 2H₂O + 4e⁻ → 4OH⁻</b>. Fe²⁺ y OH⁻ se encuentran y forman <b>herrumbre</b>, Fe(OH)₃ / Fe₂O₃·nH₂O.</p>'],
      ['Sal, oxígeno y pH', 'Factores', 'La sal aumenta la conductividad; el O₂ es el oxidante; un pH bajo favorece la reducción',
        '<p>La <b>sal</b> aumenta la conductividad del electrolito y acelera la corrosión; el <b>oxígeno</b> disuelto es el oxidante; un <b>pH ácido</b> eleva el potencial de reducción del O₂ (E = 1,23 − 0,059·pH). Sin humedad o sin O₂ casi no hay corrosión. Cambia los controles y observa el índice de velocidad.</p>'],
      ['Recubrimientos', 'Recubrimientos', 'Zn protege aunque se raye; Sn protege solo mientras esté intacto',
        '<p>Un <b>recubrimiento</b> aísla el hierro del ambiente. Si se raya, se forma una pila entre ambos metales: el <b>más activo (menor E°) se oxida</b>. El <b>Zn</b> (−0,76 V) protege al Fe (−0,44 V) y se corroe él; el <b>Sn</b> (−0,14 V) o el <b>Cu</b> (+0,34 V) son <b>menos activos</b> y, al rayarse, aceleran la corrosión del hierro.</p>'],
      ['Ánodo de sacrificio', 'Sacrificio', 'Un metal más activo conectado al hierro se corroe en su lugar',
        '<p>Un bloque de <b>Mg</b> (−2,37 V) conectado a una estructura de hierro actúa como <b>ánodo de sacrificio</b>: se oxida él y el hierro pasa a ser cátodo (<b>protección catódica</b>). Se usa en cascos de barcos y tuberías enterradas; el bloque debe reemplazarse cuando se consume.</p>']
    ];
  }
  var def = {
    key: 'corrosion-pilas', title: 'Corrosión y protección del hierro', subtitle: 'Simulador 3D · química general', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [13, 10, 15], target: [13, 0, 0] }, { id: 'lateral', label: 'Lateral', pos: [13, 2, 22], target: [13, 1, 0] }],
    layers: [{ id: 'e', label: 'Electrones', icon: 'e⁻' }, { id: 'ion', label: 'Iones', icon: '±' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(17, 0, 0); ctx.scene.add(g); var i;
      plate = new T.Mesh(new T.BoxGeometry(14, 0.8, 8), new T.MeshStandardMaterial({ color: 0x868e96, metalness: 0.6, roughness: 0.4 })); g.add(plate);
      coatM = new T.Mesh(new T.BoxGeometry(14.05, 0.2, 8.05), new T.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 0.5, roughness: 0.4 })); coatM.position.y = 0.5; g.add(coatM);
      anodeMesh = new T.Mesh(new T.BoxGeometry(2, 1.5, 2), new T.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.4, roughness: 0.5 })); anodeMesh.position.set(-7.8, 0.6, 0); g.add(anodeMesh);
      drop = new T.Mesh(new T.SphereGeometry(4.5, 28, 14, 0, 6.283, 0, 1.2), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.35 })); drop.scale.y = 0.45; drop.position.y = 0.4; g.add(drop);
      for (i = 0; i < 30; i++) { var a = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshStandardMaterial({ color: 0xe8590c })); g.add(a); fe2.push(a); var b = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), new T.MeshStandardMaterial({ color: 0x22b8cf })); g.add(b); oh.push(b); var c = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 })); g.add(c); el.push(c); }
      for (i = 0; i < 60; i++) { var r = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x8a3b12 })); g.add(r); rust.push(r); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k;
      if (!P.manual) { if (i === 0) { S.coat = 'none'; S.salt = 1; S.o2 = 70; S.ph = 7; } if (i === 1) { S.coat = 'none'; S.salt = 3 * f.local; S.o2 = 100 - 60 * f.local; S.ph = 7 - 3 * Math.sin(f.local * 3.14); } if (i === 2) { S.coat = f.local < 0.5 ? 'zn' : 'sn'; S.salt = 2; S.o2 = 80; S.ph = 7; } if (i === 3) { S.coat = 'mg'; S.salt = 2; S.o2 = 80; S.ph = 7; } }
      var a = anode(), r = rate(), fr = feRate(), cm = CO[S.coat], on = ctx.layer('e'), ion = ctx.layer('ion'); S.t += dt * Math.max(0, r);
      coatM.visible = !!cm.m && S.coat !== 'mg'; if (cm.c) coatM.material.color.setHex(cm.c); anodeMesh.visible = S.coat === 'mg';
      var nI = Math.round(Math.max(0, Math.min(30, r * 14))), th = ctx.now;
      fe2.forEach(function (m, j) { m.visible = ion && j < nI && a === 'fe'; var u = (th * 0.4 + j / 30) % 1; m.position.set(-1 + Math.cos(j * 2.3) * u * 3, 0.6 + u * 1.6, Math.sin(j * 2.3) * u * 3); m.material.color.setHex(0xe8590c); });
      oh.forEach(function (m, j) { m.visible = ion && j < nI; var u = (th * 0.4 + j / 30) % 1, ang = j * 2.1; m.position.set(Math.cos(ang) * (3.3 + u * 0.8), 0.6 + u * 0.8, Math.sin(ang) * (3.3 + u * 0.8)); });
      el.forEach(function (m, j) { m.visible = on && j < nI; var u = (th * 0.5 + j / 30) % 1, ang = j * 2.3; m.position.set(Math.cos(ang) * (0.5 + u * 3.5), 0.45, Math.sin(ang) * (0.5 + u * 3.5)); });
      var nR = Math.min(60, Math.round(S.t * (fr > 0 ? 1 : 0) * 6)); rust.forEach(function (m, j) { m.visible = fr > 0 && j < nR; var ang = j * 2.4, rr = 1 + (j % 7) * 0.5; m.position.set(Math.cos(ang) * rr, 0.45 + 0.01 * j, Math.sin(ang) * rr); });
      lab[0].pos(17, 5.2, 0).set('Ánodo: ' + NM[a] + ' → ' + NM[a] + (a === 'fe' ? '²⁺' : '²⁺') + ' + 2e⁻', 'bl-neg').vis(true);
      lab[1].pos(22, 3.2, 0).set('Cátodo: O₂ + 2H₂O + 4e⁻ → 4OH⁻', 'bl-pos').vis(true);
      lab[2].pos(17, -3.6, 0).set(cm.n + ' · ' + (a === 'fe' ? 'el hierro se corroe' : 'el Fe está protegido'), a === 'fe' ? 'bl-neg' : 'bl-pos').vis(true);
      lab[3].pos(17, -5.2, 0).set('Índice de corrosión del Fe: ' + fmt(fr * 10, 1), 'bl-d').vis(true);
      lab[4].pos(9.2, 2.6, 0).set('Mg', 'bl-d').vis(S.coat === 'mg');
    },
    sync: function (ctx) { var u = ctx.ui; if (u.coat) u.coat.set(S.coat); ['salt', 'o2', 'ph'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var a = anode(); return { eq: { chip: 'E°', name: 'Pila de corrosión', body: '<div class="eqline"><small>Ánodo</small>' + NM[a] + ' (' + fmt(E[a], 2) + ' V)</div><div class="eqline"><small>E(O₂/OH⁻)</small>' + fmt(ecat(), 2) + ' V</div><div class="eqline"><small>ΔE</small>' + fmt(ecat() - E[a], 2) + ' V</div><div class="eqline"><small>Corrosión del Fe</small>' + fmt(feRate() * 10, 1) + '</div>' }, legend: [{ label: 'Naranja', color: '#e8590c', text: 'Fe²⁺ disolviéndose' }, { label: 'Cian', color: '#22b8cf', text: 'OH⁻ en el cátodo' }, { label: 'Amarillo', color: '#ffd43b', text: 'electrones' }] }; },
    measures: function () { var a = anode(); return [['Recubrimiento', CO[S.coat].n], ['Se oxida', NM[a]], ['E° ánodo', fmt(E[a], 2) + ' V'], ['E (O₂/OH⁻)', fmt(ecat(), 2) + ' V'], ['Fuerza motriz', fmt(ecat() - E[a], 2) + ' V'], ['Corrosión del Fe', feRate() > 0 ? fmt(feRate() * 10, 1) : 'protegido']]; },
    ideas: ['El metal más activo (menor E°) se oxida.', 'Sal y O₂ aceleran la corrosión.', 'Zn protege; Sn y Cu no, si hay rayas.', 'Ánodo de sacrificio = protección catódica.'],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Condiciones'); el2.appendChild(c);
      ui.coat = kit.ui.options({ label: 'Recubrimiento', cols: 1, value: S.coat, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n, sub: CO[k].m ? 'E° = ' + fmt(E[CO[k].m], 2) + ' V' : 'E° Fe = −0,44 V' }; }), onChange: function (v) { ctx.goManual(); S.coat = v; S.t = 0; } });
      ui.salt = kit.ui.slider({ label: 'Sal (NaCl)', min: 0, max: 3, step: 0.1, value: S.salt, format: function (v) { return fmt(v, 1) + ' %'; }, onInput: function (v) { ctx.goManual(); S.salt = v; } });
      ui.o2 = kit.ui.slider({ label: 'Oxígeno disuelto', min: 0, max: 100, step: 5, value: S.o2, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.o2 = v; } });
      ui.ph = kit.ui.slider({ label: 'pH', min: 2, max: 12, step: 0.5, value: S.ph, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.ph = v; } });
      c.appendChild(ui.coat); c.appendChild(kit.ui.sliders([ui.salt, ui.o2, ui.ph])); c.appendChild(ctx.btnRow([{ t: 'Reiniciar herrumbre', fn: function () { S.t = 0; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Potenciales estándar de reducción', h: 210, note: 'Metal más activo = más negativo = se oxida primero.', draw: function (cx, w, h, col) {
      var ks = ['mg', 'zn', 'fe', 'sn', 'cu'], L = 40, R = 10, Tp = 10, B = 24, pw = w - L - R, ph = h - Tp - B, y0 = Tp + ph * (2.4 / 2.9), bw = pw / ks.length - 8;
      ks.forEach(function (k, j) { var v = E[k], x = L + j * (bw + 8) + 4, y = Tp + ph * ((0.5 - v) / 2.9); cx.fillStyle = v < E.fe ? '#51cf66' : (v === E.fe ? '#ff922b' : '#ff6b6b'); cx.fillRect(x, Math.min(y, Tp + ph * (0.5 / 2.9)), bw, Math.abs(y - (Tp + ph * (0.5 / 2.9)))); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(NM[k] + ' ' + fmt(v, 2), x + bw / 2, h - 8); });
    } }],
    calc: function () {
      var a = anode(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }, pl = PILA.map(function (p) { return p[0] + ': ' + fmt(p[1], 1) + ' V (' + p[2] + ')'; }).join('<br>');
      return '<div class="card-kicker">' + CO[S.coat].n + ' · pH ' + fmt(S.ph, 1) + '</div><table class="calc-table">' + row('Ánodo', NM[a] + ' → ' + NM[a] + '²⁺ + 2e⁻ (E° = ' + fmt(E[a], 2) + ' V)') + row('E(O₂/OH⁻)', '1,23 − 0,0592·' + fmt(S.ph, 1) + ' = <b>' + fmt(ecat(), 2) + ' V</b>') + row('ΔE', fmt(ecat(), 2) + ' − (' + fmt(E[a], 2) + ') = <b>' + fmt(ecat() - E[a], 2) + ' V</b>') + row('Estado del Fe', a === 'fe' ? 'se corroe' : 'protegido catódicamente') + row('Pilas comerciales', pl) + '</table>';
    },
    quiz: [
      { q: 'En la corrosión del hierro, el cátodo es la zona donde…', options: ['se reduce el O₂', 'se oxida el Fe', 'se forma H₂ siempre', 'no hay electrones'], answer: 0, why: 'O₂ + 2H₂O + 4e⁻ → 4OH⁻.' },
      { q: 'El hierro galvanizado con Zn, aunque se raye…', options: ['sigue protegido: el Zn se oxida', 'se corroe más rápido', 'no cambia', 'forma Zn metálico'], answer: 0, why: 'E°(Zn) < E°(Fe).' },
      { q: 'La hojalata (Sn) rayada…', options: ['acelera la corrosión del Fe', 'protege al Fe', 'no se ve afectada', 'elimina el oxígeno'], answer: 0, why: 'El Sn es menos activo que el Fe.' },
      { q: 'La sal aumenta la corrosión porque…', options: ['mejora la conductividad del electrolito', 'es un oxidante fuerte', 'baja la temperatura', 'forma un recubrimiento'], answer: 0, why: 'Facilita el paso de iones.' },
      { q: 'Un ánodo de sacrificio debe ser…', options: ['más activo que el hierro', 'menos activo que el hierro', 'un aislante', 'inerte'], answer: 0, why: 'Ejemplo: Mg o Zn.' },
      { q: 'Si disminuye el pH, el potencial del O₂/OH⁻…', options: ['aumenta', 'disminuye', 'no cambia', 'se anula'], answer: 0, why: 'E = 1,23 − 0,0592·pH.' }
    ],
    help: { intro: 'Elige el recubrimiento y ajusta sal, oxígeno y pH. Se muestran las semirreacciones y el índice de corrosión. «Reiniciar herrumbre» borra la acumulación.', items: [['Esferas naranjas', 'iones Fe²⁺.'], ['Manchas marrones', 'herrumbre acumulada.']] }
  };
  MSim.create(def);
})();
