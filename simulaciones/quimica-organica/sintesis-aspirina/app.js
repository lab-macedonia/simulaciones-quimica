/* Síntesis de la aspirina — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, MS = 138.12, MA = 180.16, MAC = 102.09, DAC = 1.08;
  var S = { ms: 2.0, vac: 5.0, tc: 75, t: 15, cat: 1, mech: 0 }, g = null, gl = null, gr = null, lab = [], cr = [], tube = null, tubeLiq = null, keyM = -1;
  function ring(extra) { // geometría manual: anillo + sustituyentes (extra: 0 salicílico, 1 acetilsalicílico)
    var a = [], b = [], i;
    for (i = 0; i < 6; i++) { var ang = i * Math.PI / 3; a.push(['C', Math.cos(ang) * 1.4, Math.sin(ang) * 1.4, 0]); }
    for (i = 0; i < 6; i++) b.push([i, (i + 1) % 6, i % 2 ? 1 : 2]);
    function add(el, x, y) { a.push([el, x, y, 0]); return a.length - 1; }
    var c = add('C', 2.9, 0), o1 = add('O', 3.6, 1.1), o2 = add('O', 3.5, -1.1); b.push([0, c, 1], [c, o1, 2], [c, o2, 1]);
    var ox = add('O', 0.7 * 2.0 + 0.0, 1.0 * 2.5 + 0.1); a[ox] = ['O', 1.4 * Math.cos(Math.PI / 3) * 1.9, 1.4 * Math.sin(Math.PI / 3) * 1.9, 0]; b.push([1, ox, 1]);
    if (extra) { var ca = add('C', a[ox][1] + 0.9, a[ox][2] + 1.3), oa = add('O', a[ox][1] + 2.1, a[ox][2] + 1.1), me = add('C', a[ox][1] + 0.2, a[ox][2] + 2.7); b.push([ox, ca, 1], [ca, oa, 2], [ca, me, 1]); }
    else { var h = add('H', a[ox][1] + 0.5, a[ox][2] + 0.8); b.push([ox, h, 1]); }
    var hh = add('H', 3.8, -1.7); b.push([o2, hh, 1]);
    [2, 3, 4, 5].forEach(function (k) { var ang = k * Math.PI / 3, h2 = add('H', Math.cos(ang) * 2.5, Math.sin(ang) * 2.5); b.push([k, h2, 1]); });
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[1]; cy += x[2]; }); cx /= a.length; cy /= a.length; a.forEach(function (x) { x[1] -= cx; x[2] -= cy; });
    return { a: a, b: b };
  }
  function nS() { return S.ms / MS * 1000; }
  function nA() { return S.vac * DAC / MAC * 1000; }
  function lim() { return nS() <= nA() ? 'ácido salicílico' : 'anhídrido acético'; }
  function nTeor() { return Math.min(nS(), nA()); }
  function mTeor() { return nTeor() * MA / 1000; }
  function k() { var k75 = 0.25 * (S.cat ? 1 : 0.04), Ea = 60000, R = 8.314; return k75 * Math.exp(-Ea / R * (1 / (S.tc + 273.15) - 1 / 348.15)); }
  function conv() { return 1 - Math.exp(-k() * S.t); }
  function mReal() { return mTeor() * conv() * 0.85 * (S.tc > 90 ? 0.8 : 1); }
  function pct() { return mReal() / mTeor() * 100; }
  function purity() { var fr = 1 - conv(), imp = fr * 0.6; return 1 - imp / (1 + imp); }
  var MECH = ['Protonación del anhídrido', 'Ataque nucleofílico del fenol', 'Intermedio tetraédrico', 'Pérdida de ácido acético', 'Desprotonación → aspirina'];
  function stages() {
    return [
      ['Reactivos y reacción', 'Reacción', 'Ácido salicílico + anhídrido acético → ácido acetilsalicílico + ácido acético',
        '<p>La <b>aspirina</b> (ácido acetilsalicílico) se obtiene por <b>acetilación</b> del grupo fenólico del <b>ácido salicílico</b> con <b>anhídrido acético</b>, con un ácido (H₂SO₄ o H₃PO₄) como catalizador. Es una <b>sustitución nucleofílica acílica</b>: el –OH ataca un C=O del anhídrido. Se forma ácido acético como subproducto.</p>'],
      ['Mecanismo', 'Mecanismo', 'Protonación → ataque → intermedio tetraédrico → pérdida de AcOH → desprotonación',
        '<p>1) El ácido protona un C=O del anhídrido y lo activa. 2) El <b>oxígeno fenólico</b> ataca ese carbono. 3) Se forma un <b>intermedio tetraédrico</b>. 4) Se expulsa <b>ácido acético</b> (buen grupo saliente) y 5) se pierde el H⁺ del oxígeno: queda el <b>éster</b>. Usa el control de pasos para recorrerlo.</p>'],
      ['Reactivo limitante y rendimiento', 'Rendimiento', 'Rendimiento teórico según el reactivo limitante; real < teórico',
        '<p>El anhídrido se usa en <b>exceso</b>; el <b>reactivo limitante</b> es el ácido salicílico. El <b>rendimiento teórico</b> es n(limitante) × M(aspirina). El real es menor por reacción incompleta y por pérdidas en la <b>recristalización</b>: <b>% rendimiento = real/teórico × 100</b>.</p>'],
      ['Temperatura, tiempo y catalizador', 'Condiciones', 'Más temperatura y catalizador aceleran la acetilación',
        '<p>La velocidad sube con la <b>temperatura</b> (Arrhenius) y con el <b>catalizador ácido</b>. Un tiempo corto deja ácido salicílico sin reaccionar. Pero sobre ~90 °C aumentan las reacciones secundarias y la descomposición. Ajusta T, tiempo y catalizador y observa el rendimiento.</p>'],
      ['Prueba de pureza con FeCl₃', 'Pureza', 'El fenol libre da color violeta con Fe³⁺',
        '<p>El <b>ácido salicílico</b> tiene un –OH fenólico y forma un complejo <b>violeta con FeCl₃</b>; la aspirina pura, sin fenol libre, <b>no da color</b>. Un color violeta intenso indica acetilación incompleta o hidrólisis. Compara condiciones.</p>']
    ];
  }
  var def = {
    key: 'sintesis-aspirina', title: 'Síntesis de la aspirina', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [14, 4, 22], target: [14, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [14, 1, 26], target: [14, 1, 0] }],
    layers: [{ id: 'cryst', label: 'Cristales', icon: '◇' }],
    build: function (ctx) {
      g = new T.Group(); g.scale.setScalar(0.82); g.position.set(3, 0, 0); ctx.scene.add(g); gl = new T.Group(); gr = new T.Group(); g.add(gl); g.add(gr); gl.position.set(11, 4, 0); gr.position.set(26, 4, 0);
      gl.add(ctx.mol(ring(0), { gs: 0.9, ar: 0.55 })); gr.add(ctx.mol(ring(1), { gs: 0.9, ar: 0.55 }));
      var arr = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 5, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); arr.rotation.z = Math.PI / 2; arr.position.set(18.5, 4, 0); g.add(arr); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.set(21.4, 4, 0); g.add(hd);
      for (var i = 0; i < 60; i++) { var c = new T.Mesh(new T.OctahedronGeometry(0.28), new T.MeshStandardMaterial({ color: 0xf8f9fa })); g.add(c); cr.push(c); }
      tube = new T.Mesh(new T.CylinderGeometry(1, 1, 4, 18, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(31, -3, 0); g.add(tube);
      tubeLiq = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 2.6, 18), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); tubeLiq.position.set(31, -3.6, 0); g.add(tubeLiq);
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.ms = 2; S.vac = 5; S.tc = 75; S.t = 15; S.cat = 1; } if (i === 1) { S.mech = Math.min(4, Math.floor(f.local * 5)); } if (i === 2) { S.ms = 1 + 3 * f.local; } if (i === 3) { S.ms = 2; S.tc = 40 + 55 * f.local; S.t = 5 + 25 * f.local; S.cat = 1; } if (i === 4) { S.tc = 75; S.t = 3 + 27 * f.local; S.cat = 1; } }
      gl.rotation.y += 0.004; gr.rotation.y += 0.004; var cv = conv(), n = Math.round(60 * Math.min(1, mReal() / 5)), on = ctx.layer('cryst');
      cr.forEach(function (c, j) { c.visible = on && j < n; var a = j * 2.4; c.position.set(25 + Math.cos(a) * (0.4 + (j % 6) * 0.35), -4 + (j % 5) * 0.18, Math.sin(a) * (0.4 + (j % 6) * 0.35)); c.rotation.set(j, j * 2, 0); });
      var viol = 1 - purity(); tubeLiq.material.color.set('#f1f3f5').lerp(new T.Color('#6741d9'), Math.min(1, viol * 3)); tubeLiq.material.opacity = 0.35 + 0.5 * Math.min(1, viol * 3);
      lab[0].pos(12.02, 7.05, 0).set('Ácido salicílico · ' + fmt(S.ms, 2) + ' g', 'bl-lead').vis(true);
      lab[1].pos(24.32, 7.05, 0).set('Ácido acetilsalicílico · ' + fmt(mReal(), 2) + ' g', 'bl-pos').vis(true);
      lab[2].pos(18.17, 4.43, 0).set('Ac₂O (' + fmt(S.vac, 1) + ' mL), H⁺, ' + fmt(S.tc, 0) + ' °C', 'bl-d').vis(true);
      lab[3].pos(18.17, 2.13, 0).set('conversión ' + fmt(cv * 100, 0) + ' %', 'bl-d').vis(true);
      lab[4].pos(21.5, -5.1, 0).set('% rendimiento: ' + fmt(pct(), 0) + ' %', 'bl-d').vis(true);
      lab[5].pos(27.5, -7.2, 0).set('FeCl₃: ' + (viol * 3 > 0.35 ? 'violeta (impuro)' : 'sin color (puro)'), viol * 3 > 0.35 ? 'bl-neg' : 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['ms', 'vac', 'tc', 't', 'cat'].forEach(function (k2) { if (u[k2]) u[k2].set(S[k2]); }); },
    hud: function () { return { eq: { chip: '%', name: 'Rendimiento', body: '<div class="eqline"><small>Limitante</small>' + lim() + '</div><div class="eqline"><small>Teórico</small>' + fmt(mTeor(), 2) + ' g</div><div class="eqline"><small>Real</small>' + fmt(mReal(), 2) + ' g</div><div class="eqline"><small>Rendimiento</small>' + fmt(pct(), 0) + ' %</div>' }, legend: [{ label: 'Cristales blancos', color: '#f8f9fa', text: 'aspirina obtenida' }, { label: 'Tubo violeta', color: '#6741d9', text: 'fenol libre (FeCl₃)' }] }; },
    measures: function () { return [['n ác. salicílico', fmt(nS(), 2) + ' mmol'], ['n anhídrido', fmt(nA(), 1) + ' mmol'], ['Limitante', lim()], ['Teórico', fmt(mTeor(), 2) + ' g'], ['Real', fmt(mReal(), 2) + ' g'], ['Rendimiento', fmt(pct(), 0) + ' %'], ['Conversión', fmt(conv() * 100, 0) + ' %']]; },
    ideas: ['Acetilación del –OH fenólico.', 'Limitante: ácido salicílico.', '% = real/teórico × 100.', 'FeCl₃ violeta = fenol libre.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Condiciones de reacción'); el.appendChild(c);
      function sl(k2, l, a, b, st, fm) { ui[k2] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k2], format: fm, onInput: function (v) { ctx.goManual(); S[k2] = v; } }); return ui[k2]; }
      c.appendChild(kit.ui.sliders([sl('ms', 'Ácido salicílico', 0.5, 5, 0.1, function (v) { return fmt(v, 1) + ' g'; }), sl('vac', 'Anhídrido acético', 1, 10, 0.5, function (v) { return fmt(v, 1) + ' mL'; }), sl('tc', 'Temperatura', 25, 110, 1, function (v) { return v + ' °C'; }), sl('t', 'Tiempo', 1, 60, 1, function (v) { return v + ' min'; })]));
      ui.cat = kit.ui.options({ label: 'Catalizador ácido', cols: 2, value: S.cat, options: [{ v: 1, label: 'Con H₃PO₄' }, { v: 0, label: 'Sin catalizador' }], onChange: function (v) { ctx.goManual(); S.cat = +v; } }); c.appendChild(ui.cat);
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Conversión frente al tiempo', h: 200, note: 'Conversión = 1 − e^(−kt) a la temperatura elegida.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff8787'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 60; i++) { var v = 1 - Math.exp(-k() * i), x = L + pw * i / 60, y = Tp + ph * (1 - v); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(L + pw * S.t / 60, Tp + ph * (1 - conv()), 5, 0, 6.28); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('60 min', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH</div><table class="calc-table">' + row('n ácido salicílico', fmt(S.ms, 2) + ' g / 138,12 = <b>' + fmt(nS(), 2) + ' mmol</b>') + row('n anhídrido', fmt(S.vac, 1) + ' mL × 1,08 g/mL / 102,09 = <b>' + fmt(nA(), 1) + ' mmol</b>') + row('Limitante', '<b>' + lim() + '</b>') + row('m teórica', fmt(nTeor(), 2) + ' mmol × 180,16 = <b>' + fmt(mTeor(), 2) + ' g</b>') + row('Conversión', '1 − e^(−' + fmt(k(), 3) + ' × ' + S.t + ') = <b>' + fmt(conv() * 100, 0) + ' %</b>') + row('m real estimada', '<b>' + fmt(mReal(), 2) + ' g</b> (con pérdidas del 15 % al recristalizar)') + row('% rendimiento', '<b>' + fmt(pct(), 0) + ' %</b>') + '</table>'; },
    quiz: [
      { q: 'El nucleófilo que ataca al anhídrido acético es…', options: ['el O del –OH fenólico', 'el C=O del ácido', 'el H₂O', 'el H⁺'], answer: 0, why: 'Forma el éster.' },
      { q: 'El reactivo limitante en la síntesis típica es…', options: ['el ácido salicílico', 'el anhídrido acético', 'el catalizador', 'el agua'], answer: 0, why: 'El anhídrido está en exceso.' },
      { q: 'Si se obtienen 1,8 g y el teórico es 2,6 g, el rendimiento es…', options: ['69 %', '144 %', '31 %', '100 %'], answer: 0, why: '1,8/2,6 × 100.' },
      { q: 'Un color violeta con FeCl₃ indica…', options: ['ácido salicílico sin reaccionar', 'aspirina pura', 'agua', 'catalizador'], answer: 0, why: 'Presencia de fenol libre.' },
      { q: 'El subproducto de la reacción es…', options: ['ácido acético', 'agua', 'CO₂', 'metanol'], answer: 0, why: 'Sale como grupo saliente.' },
      { q: 'Aumentar la temperatura de 50 a 75 °C…', options: ['aumenta la velocidad', 'reduce la velocidad', 'no la cambia', 'detiene la reacción'], answer: 0, why: 'Dependencia de Arrhenius.' }
    ],
    help: { intro: 'Ajusta cantidades, temperatura, tiempo y catalizador. Verás la masa de aspirina, el rendimiento y la prueba con FeCl₃.', items: [['Tubo', 'prueba de FeCl₃ del producto.'], ['Cristales', 'aspirina obtenida.']] }
  };
  MSim.create(def);
})();
