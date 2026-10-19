/* Potencial de membrana y potencial de acción — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, NS = 16, DLY = 3;
  var S = { ko: 5, ki: 140, nao: 145, nai: 15, pr: 0.04, I: 15, blk: 'none', auto: 1, t: 0, dl: 6, pulse: 0 };
  var X = { V: -65, m: 0.053, h: 0.596, n: 0.318 }, H = [], g = null, seg = [], na = [], kk = [], lab = [], acc = 0, simT = 0, fired = [0, 0], I0 = 0;
  function nern(o, i) { return 61.5 * Math.log(o / i) / Math.LN10; }
  function EK() { return nern(S.ko, S.ki); } function ENa() { return nern(S.nao, S.nai); }
  function gold() { return 61.5 * Math.log((S.ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; }
  function vt(x, y) { return Math.abs(x / y) < 1e-6 ? y : x / (1 - Math.exp(-x / y)); }
  function gNa() { return 120 * (S.blk === 'ttx' ? 0 : 1); } function gK() { return 36 * (S.blk === 'tea' ? 0 : 1); }
  function step(dt) {
    var V = X.V, am = 0.1 * vt(V + 40, 10), bm = 4 * Math.exp(-(V + 65) / 18), ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10)), an = 0.01 * vt(V + 55, 10), bn = 0.125 * Math.exp(-(V + 65) / 80);
    var I = S.pulse > 0 ? S.I : 0; if (S.pulse > 0) S.pulse -= dt;
    X.m += dt * (am * (1 - X.m) - bm * X.m); X.h += dt * (ah * (1 - X.h) - bh * X.h); X.n += dt * (an * (1 - X.n) - bn * X.n);
    X.V += dt * (I - gNa() * Math.pow(X.m, 3) * X.h * (V - ENa()) - gK() * Math.pow(X.n, 4) * (V - EK()) - 0.3 * (V + 54.4));
  }
  function advance(ms) { var k = Math.round(ms / 0.01), j; for (j = 0; j < k; j++) { step(0.01); simT += 0.01; if (j % 10 === 0) { H.push([X.V, X.m, X.h, X.n]); if (H.length > 600) H.shift(); } } }
  function stages() {
    return [
      ['Potencial de equilibrio (Nernst)', 'Nernst', 'E = 61,5 mV · log([ion]ext/[ion]int)',
        '<p>Una membrana con canales selectivos a un ion alcanza un <b>potencial de equilibrio</b> cuando el gradiente químico se compensa con el eléctrico: <b>E = (RT/zF)·ln([ion]ext/[ion]int)</b>, ≈ 61,5·log₁₀(ext/int) mV a 37 °C para un catión monovalente. Con K⁺ 5 mM fuera y 140 mM dentro, E<sub>K</sub> ≈ −77 mV; para Na⁺ (145/15 mM), E<sub>Na</sub> ≈ +60 mV.</p>'],
      ['Potencial de reposo (Goldman)', 'Reposo', 'Vm depende de la permeabilidad relativa de cada ion',
        '<p>La neurona en reposo es permeable sobre todo a K⁺ y muy poco a Na⁺. La ecuación de <b>Goldman</b> pondera cada ion por su permeabilidad: <b>V<sub>m</sub> = 61,5·log[(P<sub>K</sub>[K]<sub>e</sub> + P<sub>Na</sub>[Na]<sub>e</sub>)/(P<sub>K</sub>[K]<sub>i</sub> + P<sub>Na</sub>[Na]<sub>i</sub>)]</b>. Con P<sub>Na</sub>/P<sub>K</sub> = 0,04 el reposo queda cerca de −65 mV. Cambia [K⁺] externo y la permeabilidad.</p>'],
      ['Potencial de acción', 'Disparo', 'Despolarización (Na⁺ entra) → repolarización (K⁺ sale)',
        '<p>Un estímulo despolariza la membrana; al pasar el <b>umbral</b> (~−55 mV) se abren los <b>canales de Na⁺ dependientes de voltaje</b>: entra Na⁺ y el voltaje sube hacia E<sub>Na</sub> (<b>despolarización</b>). Luego los canales de Na⁺ se <b>inactivan</b> y se abren los de K⁺: sale K⁺ (<b>repolarización</b>), con una breve <b>hiperpolarización</b>. Es una respuesta <b>todo o nada</b> que se propaga por el axón.</p>'],
      ['Umbral y periodo refractario', 'Refractario', 'Tras un disparo, los canales de Na⁺ están inactivos: no se puede disparar de nuevo',
        '<p>Durante el <b>periodo refractario absoluto</b> los canales de Na⁺ están inactivados y ningún estímulo dispara otro potencial; en el <b>relativo</b> hace falta un estímulo mayor. Esto limita la frecuencia de disparo y hace que el impulso viaje en un solo sentido. Observa un segundo estímulo cada vez más tardío.</p>'],
      ['Bloqueadores: TTX y TEA', 'Bloqueadores', 'TTX bloquea los canales de Na⁺; TEA bloquea los de K⁺',
        '<p>La <b>tetrodotoxina (TTX)</b> bloquea los canales de Na⁺ dependientes de voltaje: no hay fase de subida y desaparece el potencial de acción. El <b>tetraetilamonio (TEA)</b> bloquea los de K⁺: la repolarización se enlentece y el potencial se prolonga. Compara ambas condiciones.</p>']
    ];
  }
  var def = {
    key: 'potencial-accion', title: 'Potencial de membrana y potencial de acción', subtitle: 'Simulador 3D · biología', accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [16, 6, 20], target: [16, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [16, 2, 24], target: [16, 0, 0] }],
    layers: [{ id: 'ch', label: 'Canales', icon: '▮' }],
    build: function (ctx) {
      g = new T.Group(); g.position.x = 1.5; ctx.scene.add(g); var i;
      for (i = 0; i < NS; i++) {
        var r = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 1.1, 22, 1, true), new T.MeshStandardMaterial({ color: 0x4dabf7, side: T.DoubleSide, transparent: true, opacity: 0.85 })); r.rotation.z = Math.PI / 2; r.position.set(8 + i * 1.2, 0, 0); g.add(r); seg.push(r);
        var a = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0xff6b6b })); a.position.set(8 + i * 1.2, 1.7, 0.5); g.add(a); na.push(a);
        var k = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0x4263eb })); k.position.set(8 + i * 1.2, 1.7, -0.5); g.add(k); kk.push(k);
      }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k, st = P.manual ? -1 : i, d = Math.min(dt || 0.016, 0.05);
      if (!P.manual) {
        if (i === 0) { S.ko = 2 + 18 * f.local; S.blk = 'none'; S.pr = 0.04; } else if (i === 1) { S.ko = 5; S.pr = 0.01 + 0.19 * f.local; S.blk = 'none'; } else { S.ko = 5; S.pr = 0.04; }
        if (i === 2) { S.blk = 'none'; S.I = 15; } if (i === 3) { S.blk = 'none'; S.dl = 3 + 12 * f.local; } if (i === 4) { S.blk = f.local < 0.5 ? 'ttx' : 'tea'; }
        if (i >= 2) { var per = 50; S.t += d * 8; var c = S.t % per; if (i === 3) { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c >= 0.4 && c < 20) { if (c > S.dl && !fired[1]) { S.pulse = 1; fired[1] = 1; } } if (c > 30) { fired = [0, 0]; } if (c < 0.4) fired[1] = 0; } else { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c > 5) fired[0] = 0; } }
      } else if (S.auto) { S.t += d * 8; if (S.t % 50 < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (S.t % 50 > 5) fired[0] = 0; }
      advance(d * 8);
      var n = H.length, cur = H[n - 1] || [-65, 0.05, 0.6, 0.3], on = ctx.layer('ch');
      for (k = 0; k < NS; k++) {
        var idx = Math.max(0, n - 1 - k * DLY), s = H[idx] || cur, tv = Math.max(0, Math.min(1, (s[0] + 80) / 130));
        seg[k].material.color.set(0x4dabf7).lerp(new T.Color(0xff6b6b), tv); na[k].visible = kk[k].visible = on;
        var oN = Math.pow(s[1], 3) * s[2] * 3.5, oK = Math.pow(s[3], 4) * 1.5; na[k].scale.y = 0.2 + 2.2 * Math.min(1, oN); kk[k].scale.y = 0.2 + 2.2 * Math.min(1, oK); na[k].position.y = 1.4 + 0.5 * na[k].scale.y; kk[k].position.y = 1.4 + 0.5 * kk[k].scale.y;
      }
      var state = cur[0] > -55 && cur[1] > 0.3 ? 'despolarización' : (cur[0] < -68 ? 'hiperpolarización' : (cur[3] > 0.5 && cur[0] > -60 ? 'repolarización' : 'reposo'));
      lab[0].pos(17.5, 4.6, 0).set('V = ' + fmt(cur[0], 1) + ' mV · ' + state, cur[0] > -55 ? 'bl-neg' : 'bl-lead').vis(true);
      lab[1].pos(17.5, -3.2, 0).set('E(K⁺) = ' + fmt(EK(), 0) + ' mV · E(Na⁺) = ' + fmt(ENa(), 0) + ' mV', 'bl-d').vis(true);
      lab[2].pos(10.5, 3.6, 0).set('Na⁺', 'bl-neg').vis(on); lab[3].pos(24.5, 3.6, 0).set('K⁺', 'bl-pos').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; ['ko', 'ki', 'nao', 'nai', 'pr', 'I'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); if (u.blk) u.blk.set(S.blk); },
    hud: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return { eq: { chip: 'Vm', name: 'Membrana', body: '<div class="eqline"><small>Vm</small>' + fmt(c[0], 1) + ' mV</div><div class="eqline"><small>Goldman (reposo)</small>' + fmt(gold(), 1) + ' mV</div><div class="eqline"><small>E K⁺ / Na⁺</small>' + fmt(EK(), 0) + ' / ' + fmt(ENa(), 0) + ' mV</div><div class="eqline"><small>Bloqueador</small>' + (S.blk === 'none' ? 'ninguno' : S.blk.toUpperCase()) + '</div>' }, legend: [{ label: 'Rojo', color: '#ff6b6b', text: 'canal de Na⁺ (altura = apertura)' }, { label: 'Azul', color: '#4263eb', text: 'canal de K⁺' }, { label: 'Anillo', color: '#4dabf7', text: 'voltaje local (azul → rojo)' }] }; },
    measures: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return [['Vm', fmt(c[0], 1) + ' mV'], ['E K⁺ (Nernst)', fmt(EK(), 1) + ' mV'], ['E Na⁺ (Nernst)', fmt(ENa(), 1) + ' mV'], ['Reposo (Goldman)', fmt(gold(), 1) + ' mV'], ['gNa·m³h', fmt(gNa() * Math.pow(c[1], 3) * c[2], 1) + ' mS/cm²'], ['gK·n⁴', fmt(gK() * Math.pow(c[3], 4), 1) + ' mS/cm²']]; },
    ideas: ['Nernst: un solo ion.', 'Goldman: varios iones y permeabilidades.', 'Todo o nada sobre el umbral.', 'TTX bloquea Na⁺; TEA bloquea K⁺.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Iones y estímulo'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      var mM = function (v) { return fmt(v, 1) + ' mM'; };
      c.appendChild(kit.ui.sliders([sl('ko', '[K⁺] externo', 1, 25, 0.5, mM), sl('ki', '[K⁺] interno', 50, 200, 5, mM), sl('nao', '[Na⁺] externo', 100, 200, 5, mM), sl('nai', '[Na⁺] interno', 5, 50, 1, mM), sl('pr', 'P(Na)/P(K) en reposo', 0.01, 0.2, 0.01, function (v) { return fmt(v, 2); }), sl('I', 'Intensidad del estímulo', 0, 40, 1, function (v) { return v + ' µA/cm²'; })]));
      ui.blk = kit.ui.options({ label: 'Bloqueador', cols: 3, value: S.blk, options: [{ v: 'none', label: 'Ninguno' }, { v: 'ttx', label: 'TTX' }, { v: 'tea', label: 'TEA' }], onChange: function (v) { ctx.goManual(); S.blk = v; } }); c.appendChild(ui.blk);
      c.appendChild(ctx.btnRow([{ t: 'Estimular', fn: function () { ctx.goManual(); S.pulse = 1; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Potencial de membrana V(t)', h: 210, note: 'Últimos 60 ms. Líneas: umbral (−55 mV) y E(Na⁺).', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, y = function (v) { return Tp + ph * (1 - (v + 90) / 160); }, i, n = Math.min(H.length, 600), s0 = H.length - 600;
      cx.strokeStyle = col.muted; cx.setLineDash && cx.setLineDash([3, 3]); [-55, ENa()].forEach(function (v) { cx.beginPath(); cx.moveTo(L, y(v)); cx.lineTo(L + pw, y(v)); cx.stroke(); }); cx.setLineDash && cx.setLineDash([]);
      cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i < H.length; i++) { var x = L + pw * (i + (600 - H.length)) / 600, yy = y(H[i][0]); i ? cx.lineTo(x, yy) : cx.moveTo(x, yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; [-80, -55, 0, 50].forEach(function (v) { cx.fillText(v, L - 4, y(v) + 3); }); cx.textAlign = 'center'; cx.fillText('−60 ms', L, h - 6); cx.fillText('ahora', L + pw, h - 6);
    } }, { title: 'Conductancias gNa y gK', h: 190, note: 'gNa(t) = ḡ·m³h (rojo) · gK(t) = ḡ·n⁴ (azul).', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i; [[1, '#ff6b6b'], [3, '#748ffc']].forEach(function (q) { cx.strokeStyle = q[1]; cx.lineWidth = 2; cx.beginPath(); H.forEach(function (s, i2) { var v = q[0] === 1 ? gNa() * Math.pow(s[1], 3) * s[2] : gK() * Math.pow(s[3], 4), x = L + pw * (i2 + (600 - H.length)) / 600, y = Tp + ph * (1 - Math.min(1, v / 40)); i2 ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); }); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillText('40', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph); cx.textAlign = 'center'; cx.fillText('mS/cm²', L + 10, h - 6);
    } }, { title: 'Reposo según [K⁺] externo (Goldman)', h: 190, note: 'Con la permeabilidad elegida; el punto marca tu [K⁺]e.', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i, y = function (v) { return Tp + ph * (1 - (v + 100) / 100); }; cx.strokeStyle = '#69db7c'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 48; i++) { var ko = 1 + i * 0.5, v = 61.5 * Math.log((ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; var x = L + pw * i / 48; i ? cx.lineTo(x, y(v)) : cx.moveTo(x, y(v)); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ko - 1) / 24, y(gold()), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('1 mM', L, h - 6); cx.fillText('25 mM', L + pw, h - 6); cx.textAlign = 'right'; cx.fillText('−100', L - 4, y(-100)); cx.fillText('0', L - 4, y(0) + 3);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">37 °C · iones monovalentes</div><table class="calc-table">' + row('E(K⁺)', '61,5·log(' + fmt(S.ko, 1) + ' / ' + fmt(S.ki, 0) + ') = <b>' + fmt(EK(), 1) + ' mV</b>') + row('E(Na⁺)', '61,5·log(' + fmt(S.nao, 0) + ' / ' + fmt(S.nai, 0) + ') = <b>' + fmt(ENa(), 1) + ' mV</b>') + row('Vm (Goldman)', '61,5·log[(' + fmt(S.ko, 1) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nao, 0) + ') / (' + fmt(S.ki, 0) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nai, 0) + ')] = <b>' + fmt(gold(), 1) + ' mV</b>') + row('Modelo', 'Hodgkin–Huxley simplificado (integración de Euler, dt = 0,01 ms)') + '</table>'; },
    quiz: [
      { q: 'Si aumenta la [K⁺] externa, E(K⁺) se vuelve…', options: ['menos negativo', 'más negativo', 'no cambia', 'positivo siempre'], answer: 0, why: 'E = 61,5·log(ext/int): sube.' },
      { q: 'La fase de subida del potencial de acción se debe a…', options: ['la entrada de Na⁺', 'la salida de K⁺', 'la entrada de Cl⁻', 'la bomba Na⁺/K⁺'], answer: 0, why: 'Canales de Na⁺ dependientes de voltaje.' },
      { q: 'La tetrodotoxina (TTX) bloquea…', options: ['canales de Na⁺', 'canales de K⁺', 'la bomba Na⁺/K⁺', 'canales de Ca²⁺ solamente'], answer: 0, why: 'Elimina la fase de despolarización.' },
      { q: 'En el periodo refractario absoluto…', options: ['los canales de Na⁺ están inactivados', 'los canales de K⁺ están cerrados', 'la membrana está en E(Na⁺)', 'la bomba se detiene'], answer: 0, why: 'No se puede generar otro potencial.' },
      { q: 'El potencial de reposo se acerca a E(K⁺) porque…', options: ['la membrana es mucho más permeable a K⁺', 'no hay Na⁺ fuera', 'el K⁺ es más pequeño que el Na⁺ siempre', 'la bomba lo fija en −70 mV'], answer: 0, why: 'Goldman pondera por permeabilidad.' },
      { q: 'Un estímulo subumbral produce…', options: ['una despolarización local sin potencial de acción', 'un potencial de acción pequeño', 'hiperpolarización', 'ningún cambio'], answer: 0, why: 'Es todo o nada.' }
    ],
    help: { intro: 'Cambia las concentraciones iónicas y observa Nernst y Goldman. Con «Estimular» disparas un potencial que viaja por el axón; elige TTX o TEA para ver su efecto.', items: [['Barras rojas', 'canales de Na⁺.'], ['Barras azules', 'canales de K⁺.']] }
  };
  MSim.create(def);
})();
