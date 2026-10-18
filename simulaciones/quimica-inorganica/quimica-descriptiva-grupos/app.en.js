/* Química descriptiva de los grupos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast("The lesson controls the simulation"); if (def.onStage) def.onStage(kit.state.stage, ctx); };
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
    if (def.graphs) tabs.push({ id: 'graf', label: "Graphs", build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || "Calculation", build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ("Review questions (" + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || "3D Simulator", accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ("3D viewer · " + def.title),
      stages: STAGES, mainTabLabel: "Guide", tabs: tabs, measuresTitle: "Live measurements", measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: "Labels", icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: "Free", pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
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
      help: def.help || { intro: "Follow the lesson with the player or explore freely in the “Lab” tab. With “Back to the lesson” the script takes control again.", items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();


(function () {
  var T = THREE;
  var G = {
    g1: { n: "Alkali metals (group 1)", el: [['Li', 152, 520, -3.04, 0x9775fa, "slow, gentle bubbling"], ['Na', 186, 496, -2.71, 0xff922b, "fast, the pellet melts"], ['K', 227, 419, -2.93, 0xcc5de8, "violent, lilac flame"], ['Rb', 248, 403, -2.98, 0xf06595, "very violent, explosive"], ['Cs', 265, 376, -3.03, 0xfcc419, "explosive"]], rx: 'M + H₂O → MOH + ½H₂', col: 0 },
    g2: { n: "Alkaline earth metals (group 2)", el: [['Be', 112, 900, -1.85, 0x69db7c, "does not react"], ['Mg', 160, 738, -2.37, 0xced4da, "very slow (reacts with steam)"], ['Ca', 197, 590, -2.87, 0xff6b6b, "moderate, bubbling"], ['Sr', 215, 549, -2.89, 0xfa5252, "fast"], ['Ba', 222, 503, -2.91, 0x8ce99a, "fast"]], rx: 'M + 2H₂O → M(OH)₂ + H₂', col: 0 },
    g17: { n: "Halogens (group 17)", el: [['F', 64, 1681, 2.87, 0xd0ebff, "pale yellow gas, extremely strong oxidant"], ['Cl', 99, 1251, 1.36, 0x8ce99a, "yellow-green gas"], ['Br', 114, 1140, 1.07, 0xc2255c, "reddish-brown liquid"], ['I', 133, 1008, 0.54, 0x7048e8, "dark violet solid, sublimes"]], rx: 'X₂ + 2e⁻ → 2X⁻', col: 1 },
    g18: { n: "Noble gases (group 18)", el: [['He', 31, 2372, 0, 0xffe066, "monatomic, b.p. 4 K"], ['Ne', 38, 2081, 0, 0xff6b6b, "red light in tubes"], ['Ar', 71, 1521, 0, 0x74c0fc, "≈ 1 % of the air"], ['Kr', 88, 1351, 0, 0xa5d8ff, "forms KrF₂"], ['Xe', 108, 1170, 0, 0x9775fa, "forms XeF₂, XeF₄, XeO₃"]], rx: "inert (full shell)", col: 0 }
  };
  var OX = [['Na₂O', "basic", 14, 'Na₂O + H₂O → 2NaOH'], ['MgO', "basic", 10.5, "MgO + H₂O → Mg(OH)₂ (sparingly soluble)"], ['Al₂O₃', "amphoteric", 7, "reacts with acids and with bases"], ['SiO₂', "weak acid", 6, "insoluble in water; with bases it forms silicates"], ['P₄O₁₀', "acid", 2, 'P₄O₁₀ + 6H₂O → 4H₃PO₄'], ['SO₃', "acid", 0.5, 'SO₃ + H₂O → H₂SO₄'], ['Cl₂O₇', "strong acid", 0, 'Cl₂O₇ + H₂O → 2HClO₄']];
  var S = { g: 'g1', i: 0, p: 0, mode: 'grp', ox: 0 }, grpO = null, lab = [], atoms = [], bubbles = [], water = null, flame = null, hs = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Trends in the table", "Trends", "Radius, ionization energy and electronegativity change in a regular way",
        "<p>Going <b>down a group</b> the atomic radius increases (more shells) and the <b>ionization energy</b> decreases; going <b>across a period</b> the radius decreases and the ionization energy increases (greater effective nuclear charge). These two trends explain almost all of descriptive chemistry: reactive metals are at the left and bottom, reactive nonmetals at the right and top.</p>"],
      ["Alkali metals", "Alkali metals", "One valence electron: strong reducing agents that react with water ever more violently",
        "<p>The metals of <b>group 1</b> have a single s¹ e⁻ that they lose easily (low I₁): they are <b>very strong reducing agents</b>, soft, of low density. They react with water: <b>M + H₂O → MOH + ½H₂</b>, ever more violently toward Cs. They are stored under oil. The ions give flame colors (Li red, Na yellow, K lilac).</p>"],
      ["Alkaline earth metals", "Alkaline earth metals", "Two valence e⁻: M²⁺; reactivity increasing downward",
        "<p><b>Group 2</b> forms M²⁺ cations. They are less reactive than the alkali metals: Be does not react with water, Mg does with steam, and Ca, Sr and Ba react with cold water. The hydroxides are increasingly <b>basic and soluble</b> (Mg(OH)₂ sparingly soluble; Ba(OH)₂ soluble). Ca and Mg are essential in biology (bones, chlorophyll, enzymes).</p>"],
      ["Halogens", "Halogens", "Seven valence e⁻: strong oxidants; oxidizing power decreases downward",
        "<p>The <b>halogens</b> (X₂) are diatomic; the state changes because of increasing <b>London forces</b>: F₂ and Cl₂ gases, Br₂ liquid, I₂ solid. The oxidizing power follows <b>F₂ &gt; Cl₂ &gt; Br₂ &gt; I₂</b> (E° = 2.87; 1.36; 1.07; 0.54 V): a halogen displaces the ion of another one lower down (Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂).</p>"],
      ["Noble gases", "Noble gases", "Complete valence shell: very unreactive",
        "<p>With a complete valence shell (ns²np⁶) the <b>noble gases</b> are monatomic and inert. Only the heaviest ones (Kr, Xe, Rn), with lower ionization energy, form compounds with very electronegative elements (<b>XeF₂, XeF₄, XeO₃, KrF₂</b>). Their boiling points increase downward (He 4 K; Xe 165 K) because of polarizability.</p>"],
      ["Period 3 oxides", "Oxides", "From basic (Na₂O) to acidic (SO₃, Cl₂O₇) across the period",
        "<p>The acid–base character of the oxides changes across a period: the oxides of <b>metals</b> (Na₂O, MgO) are <b>basic</b> and form hydroxides; <b>Al₂O₃ is amphoteric</b>; those of <b>nonmetals</b> (SiO₂, P₄O₁₀, SO₃, Cl₂O₇) are <b>acidic</b> and form oxoacids. The pH of the aqueous solution of each oxide drops from ≈ 14 to ≈ 0.</p>"]
    ];
  }
  var def = {
    key: 'quimica-descriptiva-grupos', title: "Descriptive Chemistry of the Groups", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#faa2c1', light: '#a61e4d' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [2, 6, 22], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 24], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 3], target: [0, 0, 0] }],
    layers: [{ id: 'r', label: "Atomic radii", icon: '○' }, { id: 'rx', label: "Reaction with water", icon: '💧' }],
    build: function (ctx) {
      grpO = new T.Group(); ctx.scene.add(grpO); var i;
      for (i = 0; i < 7; i++) { var a = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2 })); grpO.add(a); atoms.push(a); var h = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff })); h.visible = false; grpO.add(h); hs.push(h); }
      water = new T.Mesh(new T.BoxGeometry(24, 2.4, 6), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.45 })); water.position.set(0, -6.2, 0); grpO.add(water);
      for (i = 0; i < 30; i++) { var b = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); grpO.add(b); bubbles.push(b); }
      flame = new T.Mesh(new T.ConeGeometry(0.8, 2, 10), new T.MeshBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.7 })); flame.visible = false; grpO.add(flame);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 5 ? 'ox' : 'grp'; S.g = ['g1', 'g1', 'g2', 'g17', 'g18', 'g1'][i]; S.p = (f.local * 1.3) % 1; if (i === 5) S.ox = Math.min(6, Math.floor(f.local * 7)); else S.i = Math.min(G[S.g].el.length - 1, Math.floor(f.local * G[S.g].el.length)); if (i === 0) S.g = ['g1', 'g17'][f.local < 0.5 ? 0 : 1]; }
      S.i = Math.max(0, Math.min(S.i | 0, G[S.g].el.length - 1)); S.ox = Math.max(0, Math.min(S.ox | 0, OX.length - 1));
      lab.forEach(function (l) { l.vis(false); }); atoms.forEach(function (a) { a.visible = false; }); hs.forEach(function (h) { h.visible = false; }); bubbles.forEach(function (b) { b.visible = false; }); flame.visible = false; water.visible = false;
      var rOn = ctx.layer('r'), xOn = ctx.layer('rx');
      if (S.mode === 'ox') {
        var o = OX[S.ox]; OX.forEach(function (d, j) { var h = hs[j]; h.visible = true; var hh = 1 + (14 - d[2]) * 0.35 * 0 + 0.4 + 0.4 * (14 - d[2]) / 2; h.scale.set(1.6, 0.4 + (14 - d[2]) * 0.5, 1.6); h.position.set(-9 + j * 3, -4 + h.scale.y / 2, 0); var t = d[2] / 14; h.material.color.setRGB(1 - 0.8 * t + 0.2, 0.3 + 0.3 * (1 - Math.abs(t - 0.5) * 2), 0.2 + 0.8 * t); lab[j % 8].pos(-9 + j * 3, -5.6, 0).set(d[0], j === S.ox ? 'bl-lead' : 'bl-d').vis(true); }); lab[7].pos(0, 7, 0).set(o[0] + " · oxide " + o[1] + ' · pH ≈ ' + fmt(o[2], 1), 'bl-lead').vis(true);
        return;
      }
      var G0 = G[S.g], n = G0.el.length, x0 = -(n - 1) * 3.2 / 2; water.visible = xOn && S.g !== 'g18' && S.g !== 'g17';
      G0.el.forEach(function (e, j) { var a = atoms[j]; a.visible = true; var r = rOn ? e[1] / 90 : 1; a.scale.setScalar(Math.max(0.5, r)); a.position.set(x0 + j * 3.2 * (1.0), 1.5 + Math.sin(now * 0.6 + j) * 0.1, 0); a.material.color.setHex(e[4]); lab[j].pos(a.position.x, a.position.y + a.scale.x + 0.8, 0).set(e[0], j === S.i ? 'bl-lead' : 'bl-d').vis(true); });
      var cur = G0.el[S.i], a2 = atoms[S.i]; var rate = S.g === 'g1' ? [0.25, 0.5, 0.75, 0.95, 1][S.i] : (S.g === 'g2' ? [0, 0.05, 0.4, 0.7, 0.8][S.i] : 0);
      if (water.visible && xOn) { a2.position.y = -4.4 + 1 * Math.sin(now * (3 + 6 * rate)) * 0.1 + 6 * (1 - sm(S.p)) * 0; a2.position.x = 0; bubbles.forEach(function (b, k) { var u = (now * (0.3 + rate * 1.5) + k / bubbles.length) % 1; b.visible = rate > 0.05 && k < 4 + rate * 26; b.position.set(a2.position.x + Math.sin(k * 3 + now) * 1.2, -4.8 + u * 6, Math.cos(k * 2) * 1.0); }); if (S.g === 'g1' && S.i >= 2) { flame.visible = true; flame.position.set(a2.position.x, a2.position.y + 1.4, 0); flame.scale.set(1 + rate, 1 + rate * 1.3, 1); flame.material.color.setHex(S.i === 2 ? 0xcc5de8 : (S.i === 3 ? 0xf06595 : 0xfcc419)); } lab[5].pos(0, -9, 0).set('M + H₂O: ' + cur[5], rate > 0.7 ? 'bl-neg' : 'bl-d').vis(true); lab[6].pos(0, 6, 0).set(G0.n + ' · ' + cur[0], 'bl-lead').vis(true); }
      else { lab[6].pos(0, 6, 0).set(G0.n + ' · ' + cur[0] + ': ' + cur[5], 'bl-lead').vis(true); lab[5].pos(0, -3.8, 0).set(G0.rx, 'bl-d').vis(true); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.g) u.g.set(S.g); if (u.i) u.i.set(S.i); if (u.ox) u.ox.set(S.ox); },
    hud: function () { if (S.mode === 'ox') { var o = OX[S.ox]; return { eq: { chip: String(fmt(o[2], 0)), name: o[0], body: "<div class=\"eqline\"><small>Character</small>" + o[1] + "</div><div class=\"eqline\"><small>Approx. pH</small>" + fmt(o[2], 1) + "</div><div class=\"eqline\"><small>Reaction</small>" + o[3] + '</div>' }, legend: [{ label: "Blue", color: '#4263eb', text: "acidic oxide" }, { label: "Red", color: '#e03131', text: "basic oxide" }] }; } var G0 = G[S.g], e = G0.el[S.i]; return { eq: { chip: e[0], name: e[0] + ' · ' + G0.n, body: "<div class=\"eqline\"><small>Atomic radius</small>" + e[1] + " pm</div><div class=\"eqline\"><small>Ionization energy</small>" + e[2] + " kJ/mol</div><div class=\"eqline\"><small>E° (M⁺/M or X₂/X⁻)</small>" + fmt(e[3], 2) + " V</div><div class=\"eqline\"><small>Behavior</small>" + e[5] + '</div>' }, legend: [{ label: "Size", color: '#adb5bd', text: "relative atomic radius" }] }; },
    measures: function () { if (S.mode === 'ox') { var o = OX[S.ox]; return [["Oxide", o[0]], ["Character", o[1]], ["Approximate pH", fmt(o[2], 1)], ["Reaction", o[3]]]; } var G0 = G[S.g], e = G0.el[S.i]; return [["Group", G0.n], ["Element", e[0]], ["Atomic radius", e[1] + ' pm'], ["First ionization energy", e[2] + ' kJ/mol'], ['E°', fmt(e[3], 2) + ' V']]; },
    ideas: ["Going down a group: radius ↑, I₁ ↓.", "Alkali metals: reactivity with water grows downward.", "Halogens: oxidizing power F₂ > Cl₂ > Br₂ > I₂.", "Oxides: basic → amphoteric → acidic."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Group"); el.appendChild(c);
      ui.g = kit.ui.options({ label: "Group", cols: 2, value: S.g, options: Object.keys(G).map(function (k) { return { v: k, label: G[k].n }; }), onChange: function (v) { ctx.goManual(); S.mode = 'grp'; S.g = v; S.i = 0; } }); c.appendChild(ui.g);
      ui.i = kit.ui.slider({ label: "Element (from top to bottom)", min: 0, max: 4, step: 1, value: S.i, format: function (v) { var e = G[S.g].el[v]; return e ? e[0] : '—'; }, onInput: function (v) { ctx.goManual(); S.mode = 'grp'; S.i = Math.min(v, G[S.g].el.length - 1); } });
      c.appendChild(kit.ui.sliders([ui.i]));
      var d = kit.ui.card("Period 3 oxides"); el.appendChild(d); ui.ox = kit.ui.options({ label: "Oxide", cols: 4, value: S.ox, options: OX.map(function (o, j) { return { v: j, label: o[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'ox'; S.ox = +v; } }); d.appendChild(ui.ox);
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "First ionization energy (kJ/mol)", h: 230, note: "It falls going down the group. Circle: current element.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = 2500, keys = Object.keys(G); cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var k = 0; k <= 2500; k += 500) cx.fillText(k, L - 4, Tp + ph * (1 - k / mx) + 3);
        var cols = { g1: '#9775fa', g2: '#69db7c', g17: '#f06595', g18: '#74c0fc' };
        keys.forEach(function (key) { cx.strokeStyle = cols[key]; cx.lineWidth = key === S.g ? 3 : 1.5; cx.beginPath(); G[key].el.forEach(function (e, j) { var x = L + pw * j / 4, y = Tp + ph * (1 - e[2] / mx); (j ? cx.lineTo : cx.moveTo).call(cx, x, y); }); cx.stroke(); cx.fillStyle = cols[key]; cx.textAlign = 'left'; cx.fillText(G[key].n.split(' ')[0], L + pw + 2 - 60, Tp + ph * (1 - G[key].el[0][2] / mx) - 4); }); cx.lineWidth = 1;
        if (S.mode !== 'ox') { var e = G[S.g].el[S.i]; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * S.i / 4, Tp + ph * (1 - e[2] / mx), 5, 0, 6.28); cx.fill(); }
        cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText("period (2 → 6) →", L + pw / 2, h - 6);
      } },
      { title: "pH of oxide solutions (period 3)", h: 210, note: "From basic (Na₂O) to acidic (Cl₂O₇) character.", draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 10, B = 26, pw = w - L - Rr, ph = h - Tp - B, bw = pw / OX.length; cx.font = '10px system-ui'; OX.forEach(function (o, j) { var t = o[2] / 14; cx.fillStyle = 'rgb(' + Math.round(230 - 190 * t) + ',' + Math.round(90 + 60 * (1 - Math.abs(t - 0.5) * 2)) + ',' + Math.round(60 + 190 * t) + ')'; cx.globalAlpha = (S.mode === 'ox' && j === S.ox) ? 1 : 0.7; cx.fillRect(L + j * bw + 4, Tp + ph * (1 - t), bw - 8, ph * t + 0.5); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(fmt(o[2], 1), L + j * bw + bw / 2, Tp + ph * (1 - t) - 3); cx.fillStyle = col.muted; cx.fillText(o[0], L + j * bw + bw / 2, h - 10); });
      } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'ox') { var o = OX[S.ox]; return '<div class="card-kicker">' + o[0] + '</div><table class="calc-table">' + row("Character", o[1]) + row("Reaction", o[3]) + row("Approx. pH", fmt(o[2], 1)) + '</table>'; } var G0 = G[S.g], e = G0.el[S.i], ex = G0.el.map(function (x) { return x[0] + ' ' + x[1] + ' pm'; }).join(' · '); var dE = S.i > 0 ? e[2] - G0.el[S.i - 1][2] : 0; return '<div class="card-kicker">' + G0.n + '</div><table class="calc-table">' + row("Element", e[0]) + row("Radium", e[1] + ' pm') + row('I₁', e[2] + ' kJ/mol') + (S.i > 0 ? row("ΔI₁ relative to the previous one", (dE > 0 ? '+' : '') + dE + ' kJ/mol') : '') + row('E°', fmt(e[3], 2) + ' V') + row("Reaction", G0.rx) + '</table>'; },
    quiz: [
      { q: "Going down group 1, the reactivity toward water…", options: ["increases", "decreases", "does not change", "drops to zero"], answer: 0, why: "Lower ionization energy." },
      { q: "The most oxidizing halogen is…", options: ['F₂', 'Cl₂', 'Br₂', 'I₂'], answer: 0, why: 'E° = 2,87 V.' },
      { q: "Al₂O₃ is…", options: ["amphoteric", "acid", "basic", "neutral"], answer: 0, why: "It reacts with acids and bases." },
      { q: "I₂ at room temperature is…", options: ["solid", 'gas', "liquid", 'plasma'], answer: 0, why: "Greater London forces." },
      { q: "A noble gas that forms compounds is…", options: ["xenon", "helium", "neon", "argon"], answer: 0, why: 'XeF₂, XeF₄, XeO₃.' },
      { q: "SO₃ + H₂O produces…", options: ['H₂SO₄', 'H₂S', 'SO₂', 'S'], answer: 0, why: "Acidic oxide." }
    ],
    help: { intro: "Choose a group and go through the elements with the control; the sizes are the atomic radii. Alkali and alkaline earth metals are shown reacting with water; in “Oxides” you compare period 3.", items: [["Spheres", "relative atomic radius."], ["Bubbles", "H₂ evolved."]] }
  };
  MSim.create(def);
})();
