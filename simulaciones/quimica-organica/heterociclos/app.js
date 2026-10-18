/* Heterociclos aromáticos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var H = {
    pir: { n: 'Pirrol', el: 'NCCCC', nh: [0], lp: { 0: 'pi' }, pka: -3.8, lg: 7.7, site: 2, rf: [3, 2], note: 'El par del N está en el sistema π (6 e⁻ π): el N no es básico y el anillo es muy rico en electrones.', bio: 'Porfirinas, hemo, clorofila' },
    fur: { n: 'Furano', el: 'OCCCC', nh: [], lp: { 0: 'pi' }, pka: -6.2, lg: 2.1, site: 2, rf: [3, 2], note: 'Un par del O aporta 2 e⁻ al sistema π; el otro par queda en el plano.', bio: 'Ribofuranosas (anillo de 5 miembros), furfural' },
    tio: { n: 'Tiofeno', el: 'SCCCC', nh: [], lp: { 0: 'pi' }, pka: -4.5, lg: 0, site: 2, rf: [3, 2], note: 'El S aporta un par al sistema π; es el más aromático de los tres anillos de 5 miembros.', bio: 'Biotina (vitamina B7), tiamina (tiazol)' },
    pdi: { n: 'Piridina', el: 'NCCCCC', nh: [], lp: { 0: 'sp2' }, pka: 5.2, lg: -9, site: 3, rf: [2, 3], note: 'El par del N está en el plano (sp²) y no entra en el sexteto π: es básico y el anillo es pobre en electrones.', bio: 'NAD⁺/NADH, piridoxal (vit. B6), nicotinamida' },
    imi: { n: 'Imidazol', el: 'NCNCC', nh: [0], lp: { 0: 'pi', 2: 'sp2' }, pka: 7.0, lg: 4, site: 4, rf: [3, 2], note: 'Tiene un N tipo pirrol (NH, par en π) y un N tipo piridina (par en el plano, básico). pKaH ≈ 7: tampón fisiológico.', bio: 'Histidina, histamina, purinas' },
    pym: { n: 'Pirimidina', el: 'NCNCCC', nh: [], lp: { 0: 'sp2', 2: 'sp2' }, pka: 1.3, lg: -12, site: 5, rf: [2, 3], note: 'Dos N tipo piridina: muy pobre en electrones y poco básica.', bio: 'Citosina, timina, uracilo; tiamina' }
  };
  var S = { h: 'pir', site: 2, p: 0, lobe: true }, g = null, lab = [], atoms = [], bonds = [], hs = [], hbo = [], lpm = [], ez = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  var COL = { C: 0x56606b, N: 0x4f7cff, O: 0xff4d4d, S: 0xe6c229 };
  function stages() {
    return [
      ['Heterociclos aromáticos', 'Heterociclos', 'Anillos con N, O o S: numeración desde el heteroátomo',
        '<p>Un <b>heterociclo aromático</b> contiene al menos un átomo distinto de carbono (N, O, S) en un anillo plano con <b>6 electrones π</b>. Se numeran <b>desde el heteroátomo (posición 1)</b>. Los más comunes: <b>pirrol, furano, tiofeno</b> (5 miembros), <b>piridina, pirimidina</b> (6) e <b>imidazol</b> (5, dos N). Elige uno en el panel.</p>'],
      ['¿Dónde está el par libre?', 'Par libre', 'Tipo pirrol (en el sistema π) frente a tipo piridina (en el plano)',
        '<p>En el <b>pirrol</b>, <b>furano</b> y <b>tiofeno</b> el heteroátomo aporta un <b>par al sexteto π</b> (orbital p, perpendicular al anillo). En la <b>piridina</b> el N ya aporta un e⁻ al π y su par queda <b>en el plano (sp²)</b>, apuntando hacia afuera. Esa diferencia decide la <b>basicidad</b> y la reactividad.</p>'],
      ['Basicidad', 'Basicidad', 'Si el par está disponible (sp² en el plano) el N es básico',
        '<p>La piridina (pKaH <b>5,2</b>) y el imidazol (<b>7,0</b>) se protonan en su par del plano. El <b>pirrol</b> (pKaH ≈ −3,8) no: protonar el N destruiría la aromaticidad. Por eso el imidazol de la <b>histidina</b> actúa como <b>tampón fisiológico</b> y es sitio activo de enzimas. Mira el gráfico de pKaH.</p>'],
      ['Sustitución electrofílica: C2 frente a C3', 'SEAr', 'El ataque en C2 de pirrol/furano/tiofeno da un complejo σ más estabilizado (3 formas de resonancia)',
        '<p>Los heterociclos de 5 miembros son <b>más reactivos que el benceno</b> (pirrol ≫ furano &gt; tiofeno) y se sustituyen en <b>C2</b>: el catión intermedio tiene <b>3 estructuras de resonancia</b> (la carga positiva se reparte hasta el heteroátomo) frente a 2 en C3. En la <b>piridina</b> ocurre lo contrario: es muy desactivada y reacciona (mal) en <b>C3</b>, porque el ataque en C2/C4 pondría la carga + sobre el N.</p>'],
      ['Piridina: reactividad inversa', 'Piridina', 'Pobre en electrones: ataque nucleófilo en C2 y C4',
        '<p>Por ser deficiente en electrones, la piridina sufre <b>sustitución nucleofílica</b> en <b>C2/C4</b> (p. ej. aminación de Chichibabin con NaNH₂), donde la carga negativa del intermedio puede quedar en el N. Para facilitar la SEAr se usa el <b>N-óxido</b>, que dona densidad al anillo.</p>'],
      ['Heterociclos en biomoléculas', 'Biomoléculas', 'Histidina, triptófano, purinas, pirimidinas, NAD⁺…',
        '<p>Los heterociclos están en el centro de la bioquímica: <b>imidazol</b> en la histidina; <b>indol</b> en el triptófano; <b>pirimidinas</b> (C, T, U) y <b>purinas</b> (A, G) en los ácidos nucleicos; <b>piridina</b> en el NAD⁺; <b>porfirina</b> (4 pirroles) en el hemo y la clorofila. Cambia de heterociclo y revisa el campo «Aparece en».</p>']
    ];
  }
  function ringPts(n) { var R = n === 5 ? 1.3 : 1.4, out = [], k; for (k = 0; k < n; k++) { var a = Math.PI / 2 - 2 * Math.PI * k / n; out.push(V(R * Math.cos(a) * 1.5, R * Math.sin(a) * 1.5, 0)); } return out; }
  var def = {
    key: 'heterociclos', title: 'Heterociclos aromáticos', subtitle: 'Simulador 3D · química orgánica avanzada', accent: { dark: '#66d9e8', light: '#0b7285' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [5, 7, 13], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 15], target: [0, 0, 0] }, { id: 'sup', label: 'Lateral', pos: [14, 1, 0], target: [0, 0, 0] }],
    layers: [{ id: 'lob', label: 'Nube π y pares', icon: '∞' }, { id: 'num', label: 'Numeración', icon: '1' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 6; i++) { var a = new T.Mesh(new T.SphereGeometry(0.45, 16, 12), new T.MeshStandardMaterial({ color: 0x56606b })); g.add(a); atoms.push(a); var hm = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); g.add(hm); hs.push(hm); var hb = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); g.add(hb); hbo.push(hb); var bn = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); g.add(bn); bonds.push(bn); var lp = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), new T.MeshBasicMaterial({ color: 0xcc5de8, transparent: true, opacity: 0.45, depthWrite: false })); g.add(lp); lpm.push(lp); var lp2 = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), new T.MeshBasicMaterial({ color: 0xcc5de8, transparent: true, opacity: 0.45, depthWrite: false })); g.add(lp2); lpm.push(lp2); }
      ez = new T.Mesh(new T.SphereGeometry(0.4, 14, 10), new T.MeshBasicMaterial({ color: 0xffd43b })); g.add(ez);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, h; if (!P.manual) { S.h = ['pir', 'pir', 'imi', 'pir', 'pdi', 'imi'][i]; if (i === 0) S.h = ['pir', 'fur', 'tio', 'pdi', 'imi', 'pym'][Math.min(5, Math.floor(f.local * 6))]; if (i === 1) S.h = f.local < 0.5 ? 'pir' : 'pdi'; if (i === 3) { S.site = f.local < 0.5 ? 2 : 3; S.p = (f.local * 2) % 1; } else if (i === 5) S.h = ['imi', 'pym', 'pdi', 'pir'][Math.min(3, Math.floor(f.local * 4))]; S.lobe = true; if (i !== 3) S.p = 0.5; }
      h = H[S.h]; var n = h.el.length, pts = ringPts(n), lOn = ctx.layer('lob'), nOn = ctx.layer('num'), k, now = ctx.now;
      var site = Math.max(2, Math.min(n, Math.round(S.site) || 2));
      atoms.forEach(function (a, j) { a.visible = j < n; hs[j].visible = false; hbo[j].visible = false; bonds[j].visible = j < n; });
      lpm.forEach(function (l) { l.visible = false; }); lab.forEach(function (l) { l.vis(false); });
      for (k = 0; k < n; k++) {
        var el = h.el[k], p0 = pts[k], p1 = pts[(k + 1) % n]; atoms[k].material.color.setHex(COL[el]); atoms[k].position.copy(p0); atoms[k].scale.setScalar(el === 'C' ? 1 : (el === 'S' ? 1.3 : 1.1));
        var d = p1.clone().sub(p0); bonds[k].position.copy(p0).add(p1).multiplyScalar(0.5); bonds[k].scale.set(0.07, d.length(), 0.07); bonds[k].quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
        var needH = (el === 'C') || h.nh.indexOf(k) >= 0;
        if (needH) { var out = p0.clone().normalize(), hp = p0.clone().addScaledVector(out, 1.0); hs[k].visible = true; hs[k].position.copy(hp); hbo[k].visible = true; hbo[k].position.copy(p0).add(hp).multiplyScalar(0.5); hbo[k].scale.set(0.05, 1.0, 0.05); hbo[k].quaternion.setFromUnitVectors(V(0, 1, 0), out); }
        if (h.lp[k]) {
          if (h.lp[k] === 'pi') { [1, -1].forEach(function (sd, j) { var lm = lpm[k * 2 + j]; lm.visible = lOn; lm.position.set(p0.x, p0.y, sd * (0.8 + 0.1 * Math.sin(now * 2))); lm.scale.set(1.1, 1.1, 1.6); lm.material.color.setHex(0xcc5de8); }); }
          else { var o2 = p0.clone().normalize(), lm1 = lpm[k * 2]; lm1.visible = lOn; lm1.position.copy(p0).addScaledVector(o2, 1.0); lm1.scale.set(1.3, 0.8, 0.8); lm1.lookAt(p0.clone().multiplyScalar(2)); lm1.material.color.setHex(0x69db7c); }
        }
        if (el === 'C' || true) { lab[k % 8].pos(p0.x * 1.25 + (p0.x > 0 ? 0.6 : -0.6), p0.y * 1.25 + 0.2, 0).set(String(k + 1) + (el !== 'C' ? ' ' + el : ''), el !== 'C' ? 'bl-lead' : 'bl-d').vis(nOn); }
      }
      // π cloud for C atoms (aromatic sextet)
      for (k = 0; k < n; k++) { if (h.el[k] === 'C') { [1, -1].forEach(function (sd, j) { var lm = lpm[k * 2 + j]; lm.visible = lOn; lm.position.set(pts[k].x, pts[k].y, sd * 0.8); lm.scale.set(0.9, 0.9, 1.4); lm.material.color.setHex(0x4dabf7); lm.material.opacity = 0.3; }); } else { lpm[k * 2].material.opacity = 0.45; } }
      // electrófilo
      var sp = pts[Math.min(site - 1, n - 1)]; ez.visible = (i === 3) || P.manual; if (ez.visible) { var q = sm(S.p); ez.position.set(sp.x, sp.y, 4.0 - 3.0 * q); }
      var rf = site === (h.site) ? h.rf[0] : h.rf[1];
      lab[6].pos(0, 5.5, 0).set(h.n, 'bl-lead').vis(true);
      lab[7].pos(0, -5.5, 0).set(ez.visible ? 'E⁺ en C' + site + ': ' + (site === h.site ? rf + ' formas de resonancia (preferido)' : rf + ' formas de resonancia') : (h.lp[0] === 'sp2' ? 'par libre en el plano (sp²): básico' : 'par libre en el sistema π: no básico'), (site === h.site && ez.visible) ? 'bl-pos' : 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.h) u.h.set(S.h); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var h = H[S.h]; return { eq: { chip: String(h.pka > 0 ? fmt(h.pka, 1) : fmt(h.pka, 1)), name: h.n, body: '<div class="eqline"><small>pKa (ácido conjugado)</small>' + fmt(h.pka, 1) + '</div><div class="eqline"><small>Par del heteroátomo</small>' + (h.lp[0] === 'pi' ? 'en el sistema π' : 'en el plano (sp²)') + '</div><div class="eqline"><small>SEAr preferente</small>C' + h.site + '</div><div class="eqline"><small>Aparece en</small>' + h.bio + '</div>' }, legend: [{ label: 'Lóbulo violeta', color: '#cc5de8', text: 'par en el sistema π' }, { label: 'Lóbulo verde', color: '#69db7c', text: 'par en el plano (sp²)' }, { label: 'Nube azul', color: '#4dabf7', text: 'electrones π del anillo' }] }; },
    measures: function () { var h = H[S.h]; return [['Heterociclo', h.n], ['Átomos del anillo', h.el.length + ' (' + h.el.replace(/C/g, '').split('').join(', ') + ')'], ['pKa (ácido conjugado)', fmt(h.pka, 1)], ['Reactividad SEAr (log, tiofeno = 0)', fmt(h.lg, 1)], ['Posición preferente SEAr', 'C' + h.site], ['Aparece en', h.bio]]; },
    ideas: ['Par en π (pirrol): no es básico.', 'Par en el plano (piridina): básico.', 'Anillos de 5 miembros: SEAr en C2.', 'Piridina: SEAr en C3, SNAr en C2/C4.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Heterociclo'); el.appendChild(c);
      ui.h = kit.ui.options({ label: 'Compuesto', cols: 3, value: S.h, options: Object.keys(H).map(function (k) { return { v: k, label: H[k].n }; }), onChange: function (v) { ctx.goManual(); S.h = v; S.site = H[v].site; } }); c.appendChild(ui.h);
      ui.s = kit.ui.slider({ label: 'Posición atacada (E⁺)', min: 2, max: 5, step: 1, value: S.site, format: function (v) { return 'C' + v; }, onInput: function (v) { ctx.goManual(); S.site = v; } });
      ui.p = kit.ui.slider({ label: 'Acercamiento del electrófilo', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.s, ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Basicidad: pKa del ácido conjugado', h: 220, note: 'Más alto = base más fuerte (par disponible en el plano).', draw: function (cx, w, h, col) {
        var ks = Object.keys(H), L = 70, Rr = 30, Tp = 8, B = 14, pw = w - L - Rr, bh = (h - Tp - B) / ks.length, x0 = L + pw * 7 / 14; cx.font = '10px system-ui';
        ks.forEach(function (k, j) { var v = H[k].pka, y = Tp + j * bh; cx.fillStyle = k === S.h ? '#ffa94d' : (v > 0 ? '#69db7c' : '#fa5252'); var xv = L + pw * (v + 7) / 14; cx.fillRect(Math.min(xv, x0 + 0) < x0 ? xv : x0, y + 4, Math.abs(xv - x0), bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(H[k].n, L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(v, 1), Math.max(xv, x0) + 4, y + bh / 2 + 3); });
        cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(x0, Tp); cx.lineTo(x0, h - B); cx.stroke();
      } },
      { title: 'Reactividad frente a electrófilos (log, tiofeno = 0)', h: 220, note: 'Orden de magnitud aproximado (benceno ≈ −3).', draw: function (cx, w, h, col) {
        var ks = Object.keys(H), L = 70, Rr = 30, Tp = 8, B = 14, pw = w - L - Rr, bh = (h - Tp - B) / ks.length, x0 = L + pw * 12 / 24; cx.font = '10px system-ui';
        ks.forEach(function (k, j) { var v = H[k].lg, y = Tp + j * bh, xv = L + pw * (v + 12) / 24; cx.fillStyle = k === S.h ? '#ffa94d' : (v > 0 ? '#69db7c' : '#fa5252'); cx.fillRect(Math.min(xv, x0), y + 4, Math.abs(xv - x0), bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(H[k].n, L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(v, 1), Math.max(xv, x0) + 4, y + bh / 2 + 3); });
        cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(x0, Tp); cx.lineTo(x0, h - B); cx.stroke();
      } }
    ],
    calc: function () { var h = H[S.h], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; var lpT = h.lp[0] === 'pi' ? 'pirrol' : 'piridina'; return '<div class="card-kicker">' + h.n + '</div><table class="calc-table">' + row('Electrones π', '6 (sexteto aromático)') + row('Heteroátomo en posición 1', h.el[0] + ' tipo ' + lpT) + row('pKa (ácido conjugado)', fmt(h.pka, 1)) + row('Cociente [BH⁺]/[B] a pH 7,4', h.pka > 7.4 ? '10<sup>' + fmt(h.pka - 7.4, 1) + '</sup> (protonado)' : '10<sup>' + fmt(h.pka - 7.4, 1) + '</sup> (neutro)') + row('E⁺ preferente', 'C' + h.site + ' (' + h.rf[0] + ' formas de resonancia)') + '</table><p class="muted small">' + h.note + '</p>'; },
    quiz: [
      { q: 'El par libre del N del pirrol…', options: ['forma parte del sexteto π', 'está en el plano', 'protona fácilmente', 'no existe'], answer: 0, why: 'Está en el orbital p.' },
      { q: 'La piridina es básica porque su par…', options: ['está en el plano (sp²)', 'está en el sistema π', 'es radical', 'es del C'], answer: 0, why: 'No participa del sexteto.' },
      { q: 'El pirrol reacciona con electrófilos en…', options: ['C2', 'C3', 'N únicamente', 'ninguno'], answer: 0, why: 'El catión tiene 3 formas de resonancia.' },
      { q: 'La piridina frente a SEAr es…', options: ['mucho menos reactiva que el benceno', 'más reactiva', 'igual', 'no reacciona con nada'], answer: 0, why: 'El N atrae densidad electrónica.' },
      { q: 'El aminoácido con anillo imidazol es…', options: ['histidina', 'triptófano', 'prolina', 'fenilalanina'], answer: 0, why: 'pKa del anillo ≈ 6.' },
      { q: 'Los sitios de ataque nucleofílico en piridina son…', options: ['C2 y C4', 'C3', 'C5 y C3', 'ninguno'], answer: 0, why: 'La carga queda en el N.' }
    ],
    help: { intro: 'Elige el heterociclo. Los lóbulos violeta son pares en el sistema π; los verdes, pares en el plano. Con «Posición atacada» acercas un electrófilo.', items: [['Nube azul', 'sexteto π.'], ['Esfera amarilla', 'electrófilo E⁺.']] }
  };
  MSim.create(def);
})();
