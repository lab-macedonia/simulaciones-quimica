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
  var CO = {
    atp: { n: 'ATP', vit: "— (synthesized de novo)", vn: '', mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "α-phosphate", 0xff922b, 'p'], ['P', "β-phosphate", 0xff922b, 'p'], ['P', "γ-phosphate", 0xff6b6b, 'p']], fn: "energy currency: ΔG°′ of hydrolysis ≈ −30.5 kJ/mol", e: -30.5 },
    nad: { n: 'NAD⁺ / NADH', vit: "Niacin (vitamin B3)", mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['R', "Ribose", 0xffd43b, 'sugar'], ['N', "Nicotinamide", 0x69db7c, 'ring']], fn: "hydride (H⁻) carrier in catabolic pathways; E°′ = −0.32 V", e: -0.32 },
    fad: { n: 'FAD / FADH₂', vit: "Riboflavin (vitamin B2)", mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['R', 'Ribitol', 0xffd43b, 'sugar'], ['F', "Isoalloxazine", 0xfab005, 'ring']], fn: "accepts 2 e⁻ and 2 H⁺; E°′ ≈ −0.22 V (varies when bound to the enzyme)", e: -0.22 },
    coa: { n: "Coenzyme A", vit: "Pantothenic acid (vitamin B5)", mod: [['A', "Adenine 3′-phosphate-ribose", 0x4dabf7, 'base'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['B', "Pantothenate", 0xb197fc, 'sugar'], ['C', "β-mercaptoethylamine", 0xf06595, 'sugar'], ['S', "SH (thiol)", 0xe6c229, 'ring']], fn: "carries acyl groups through a high-energy thioester (acetyl-CoA: ΔG°′ ≈ −31.4 kJ/mol)", e: -31.4 }
  };
  var VIT = [['B1', "Thiamine", 'TPP', "decarboxylations"], ['B2', "Riboflavin", 'FAD, FMN', 'redox (2 e⁻)'], ['B3', "Niacin", 'NAD⁺, NADP⁺', "hydrides"], ['B5', "Pantothenic acid", 'CoA', "acyl groups"], ['B6', "Pyridoxine", 'PLP', "amino acids"], ['B7', "Biotin", "biocytin", "carboxylations"], ['B9', "Folic acid", 'THF', "C₁ units"], ['B12', "Cobalamin", "methyl/adenosylcobalamin", "isomerizations"]];
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
      ["Nucleotides: three parts", "Nucleotide", "Nitrogenous base + pentose + one or more phosphates",
        "<p>A <b>nucleotide</b> consists of a <b>nitrogenous base</b> (purine or pyrimidine), a <b>pentose</b> (ribose or deoxyribose) and one to three <b>phosphates</b>. Besides being the monomers of DNA and RNA, they take part in cellular energy and signaling. The base joined to ribose by an <b>N-glycosidic</b> bond is a <b>nucleoside</b>; with phosphate, a nucleotide.</p>"],
      ["ATP: the energy currency", 'ATP', "Hydrolysis of the phosphoanhydride bond releases ≈ 30.5 kJ/mol",
        "<p><b>ATP</b> (adenosine triphosphate) has two high-energy <b>phosphoanhydride</b> bonds. Its hydrolysis to ADP + Pᵢ has <b>ΔG°′ ≈ −30.5 kJ/mol</b> and in the cell (real concentrations) ≈ −50 kJ/mol. This is explained by the <b>charge repulsion</b> between phosphates, the better solvation of the products and the <b>resonance stabilization</b> of Pᵢ. The energy is transferred by coupling reactions.</p>"],
      ["NAD⁺ and NADH", 'NAD⁺', "The nicotinamide ring receives a hydride ion (H⁻) at C4",
        "<p><b>Dehydrogenases</b> take 2 e⁻ and 2 H⁺ from the substrate: <b>NAD⁺</b> accepts a <b>hydride ion (H⁻)</b> at C4 of the nicotinamide ring, which goes from aromatic pyridinium to <b>1,4-dihydropyridine</b> (NADH), and an H⁺ is released. NADH absorbs at <b>340 nm</b> (NAD⁺ does not), a property used to follow enzymes. Move “Progress” to see the transfer.</p>"],
      ["FAD and coenzyme A", "FAD and CoA", "FAD: 2 e⁻ redox; CoA: transport of acyl groups through a thioester",
        "<p><b>FAD</b> (from riboflavin) accepts two H at N5 and N1 of the isoalloxazine and is the coenzyme of <b>succinate dehydrogenase</b> and <b>acyl-CoA dehydrogenase</b>. <b>Coenzyme A</b> ends in a <b>thiol (–SH)</b> that forms <b>thioesters</b> (acetyl-CoA), with a hydrolysis ΔG°′ similar to that of ATP: “activated” acyl groups.</p>"],
      ["Water-soluble vitamins → coenzymes", "Vitamins", "B vitamins are the precursors of the coenzymes",
        "<p>Many coenzymes derive from <b>B-complex vitamins</b>, which humans cannot synthesize and must obtain from the diet: <b>niacin→NAD⁺</b>, <b>riboflavin→FAD</b>, <b>pantothenic→CoA</b>, <b>thiamine→TPP</b>, <b>pyridoxine→PLP</b>, <b>folate→THF</b>, <b>biotin</b> and <b>B₁₂</b>. Their deficiency affects entire pathways (beriberi, pellagra, megaloblastic anemia…).</p>"]
    ];
  }
  var def = {
    key: 'nucleotidos-coenzimas', title: "Nucleotides and Coenzymes", subtitle: "3D Simulator · molecular biology", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 5, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 20, 2], target: [0, 0, 0] }],
    layers: [{ id: 'mod', label: "Modules", icon: '▤' }, { id: 'lab', label: "Labels", icon: 'A' }],
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
      if (S.co === 'atp' && (S.p > 0 || P.manual)) { var last = blocks[4]; last.position.x += 2.8 * q; last.position.y += -1.2 * q; wat.visible = true; wat.position.set(blocks[3].position.x + 1.5 + 0 * q, 2.2 - 1.6 * q, 0); wat.scale.setScalar(1 - 0.4 * q); extra = q < 0.5 ? "H₂O attacks the γ phosphorus" : 'ATP + H₂O → ADP + Pᵢ'; } else wat.visible = false;
      ez.visible = false;
      if (S.co === 'nad') { var ring = blocks[4]; ring.children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(S.red || q > 0.5 ? 0x38d9a9 : 0x69db7c); }); }); ez.visible = true; ez.position.set(ring.position.x + 3.0 - 3.0 * sm(q), 2.4 - 1.0 * sm(q), 0); extra = q < 0.5 ? "NAD⁺ (aromatic ring, N⁺)" : "NADH (1,4-dihydropyridine): H⁻ at C4"; }
      if (S.co === 'fad') { extra = q < 0.5 ? "FAD (oxidized)" : "FADH₂ (reduced, 2 H at N1 and N5)"; blocks[4].children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(q > 0.5 ? 0xfff3bf : 0xfab005); }); }); }
      if (S.co === 'coa') { extra = q < 0.5 ? "CoA–SH (free thiol)" : "acetyl-CoA: CH₃CO–S–CoA thioester"; if (q > 0.5) { ez.visible = true; ez.material.color.setHex(0xff922b); ez.scale.setScalar(2); ez.position.set(blocks[4].position.x + 1.4, 0.2, 0); } }
      lab[0].pos(0, 5, 0).set(co.n, 'bl-lead').vis(true); lab[1].pos(0, -4.2, 0).set(extra || co.fn, 'bl-d').vis(true);
      co.mod.forEach(function (m, j) { lab[2 + j].pos(blocks[j].position.x, -2.2, 0).set(m[1], 'bl-d').vis(lOn && j < 5 && 2 + j < 8); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.co) u.co.set(S.co); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var c = CO[S.co]; return { eq: { chip: c.n.split(' ')[0], name: c.n, body: "<div class=\"eqline\"><small>Function</small>" + c.fn + "</div><div class=\"eqline\"><small>Vitamin</small>" + c.vit + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "nitrogenous base" }, { label: "Yellow", color: '#ffd43b', text: "pentose" }, { label: "Orange", color: '#ff922b', text: "phosphate" }] }; },
    measures: function () { var c = CO[S.co]; return [["Coenzyme", c.n], ["Precursor vitamin", c.vit], ["Modules", c.mod.map(function (m) { return m[1]; }).join(' – ')], ["Function", c.fn]]; },
    ideas: ["Nucleotide = base + pentose + phosphate(s).", "ATP → ADP + Pᵢ releases ≈ 30.5 kJ/mol.", "NAD⁺ accepts H⁻ at C4.", "B vitamins → coenzymes."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Coenzyme"); el.appendChild(c);
      ui.co = kit.ui.options({ label: "Choose", cols: 2, value: S.co, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n }; }), onChange: function (v) { ctx.goManual(); S.co = v; S.p = 0; } }); c.appendChild(ui.co);
      ui.p = kit.ui.slider({ label: "Reaction progress", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Free energy of hydrolysis (ΔG°′, kJ/mol)", h: 230, note: "High-energy compounds versus a simple ester.", draw: function (cx, w, h, col) {
        var D = [['PEP', -61.9], ['1,3-BPG', -49.4], ["Phosphocreatine", -43.1], ['ATP → ADP', -30.5], ["Acetyl-CoA", -31.4], ["Glucose-6-P", -13.8], ["Glycerol-3-P", -9.2]], L = 88, Rr = 28, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
        D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.co === 'atp' && d[0].indexOf('ATP') === 0) || (S.co === 'coa' && d[0] === 'Acetil-CoA'); cx.fillStyle = cur ? '#ffa94d' : '#4dabf7'; cx.fillRect(L, y + 4, pw * -d[1] / 65, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(d[1], 1), L + pw * -d[1] / 65 + 4, y + bh / 2 + 3); });
      } },
      { title: "B-complex vitamins and their coenzymes", h: 250, note: "Correspondence table.", draw: function (cx, w, h, col) {
        var rh = (h - 10) / (VIT.length + 1); cx.font = '10px system-ui'; cx.textAlign = 'left'; cx.fillStyle = col.muted; cx.fillText('Vit.', 4, rh - 4); cx.fillText("Name", 36, rh - 4); cx.fillText("Coenzyme", w * 0.42, rh - 4); cx.fillText("Function", w * 0.7, rh - 4);
        VIT.forEach(function (v, j) { var y = (j + 1) * rh + 4; cx.fillStyle = col.ink; cx.fillText(v[0], 4, y + rh - 5); cx.fillText(v[1], 36, y + rh - 5); cx.fillText(v[2], w * 0.42, y + rh - 5); cx.fillText(v[3], w * 0.7, y + rh - 5); cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(0, y + rh); cx.lineTo(w, y + rh); cx.stroke(); });
      } }
    ],
    calc: function () { var c = CO[S.co], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.co === 'atp') { var Q = 0.05, ratio = 1.0; return "<div class=\"card-kicker\">ΔG of ATP hydrolysis</div><table class=\"calc-table\">" + row('ΔG°′', "−30.5 kJ/mol") + row("Cellular conditions", '[ATP]/[ADP][Pᵢ] ≈ 10³ M⁻¹ → ΔG ≈ −50 kJ/mol') + row("Formula", 'ΔG = ΔG°′ + RT ln([ADP][Pᵢ]/[ATP])') + row("With 3 mM ATP, 0.3 mM ADP, 5 mM Pᵢ", "ΔG = −30.5 + 2.58 ln(0.0003·0.005/0.003) = <b>" + fmt(-30.5 + 2.58 * Math.log(0.0003 * 0.005 / 0.003), 1) + ' kJ/mol</b>') + '</table>'; } if (S.co === 'nad') return '<div class="card-kicker">NAD⁺ + 2H ⇌ NADH + H⁺</div><table class="calc-table">' + row('E°′', '−0,32 V') + row("ΔG°′ of the reduction (n = 2)", '−nFE°′ = <b>+' + fmt(2 * 96485 * 0.32 / 1000, 1) + " kJ/mol</b>: NADH is a strong e⁻ donor") + row("Absorption λ", "NADH 340 nm; NAD⁺ does not absorb") + row("Beer–Lambert law", "ε₃₄₀ = 6,220 M⁻¹cm⁻¹") + '</table>'; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row("Vitamin", c.vit) + row("Function", c.fn) + '</table>'; },
    quiz: [
      { q: "A nucleotide is composed of…", options: ["base + pentose + phosphate", "only base and phosphate", "amino acid + sugar", "fatty acid + glycerol"], answer: 0, why: "Nucleoside + phosphate(s)." },
      { q: "The precursor vitamin of NAD⁺ is…", options: ["niacin (B3)", "riboflavin (B2)", "thiamine (B1)", "biotin"], answer: 0, why: "Pellagra by deficiency." },
      { q: "NAD⁺ receives…", options: ["a hydride ion at C4", "a proton on N", "an O atom", "a phosphate"], answer: 0, why: "Reduction to 1,4-dihydropyridine." },
      { q: "Coenzyme A forms…", options: ["thioesters", "phosphate esters", "amides", "ethers"], answer: 0, why: "With its –SH group." },
      { q: "The hydrolysis of ATP to ADP + Pᵢ has ΔG°′ ≈…", options: ["−30.5 kJ/mol", "+30.5 kJ/mol", '0', '−300 kJ/mol'], answer: 0, why: "Exergonic reaction." }
    ],
    help: { intro: "Choose a coenzyme: its modular structure is shown. Move “Progress” to see ATP hydrolysis, hydride transfer to NAD⁺, FAD reduction or thioester formation.", items: [["Modules", "base, sugar, phosphate, ring."], ["White sphere", "H⁻ or acyl group transferred."]] }
  };
  MSim.create(def);
})();
