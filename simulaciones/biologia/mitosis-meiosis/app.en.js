/* Mitosis y meiosis — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

/* Núcleo común de los simuladores 3D · Laboratorio MACEDONIA (UMCE) — construido sobre ../../kit/simkit.js */
(function () {
  "use strict";
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
      list.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn' + (b.primary ? " primary" : ''); e.textContent = b.t; e.addEventListener('click', b.fn); if (b.id) ui(b.id, e); r.appendChild(e); });
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
    if (def.lab) tabs.push({ id: 'lab', label: "Lab", build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
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
  var f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var RED = 0xff6b6b, BLUE = 0x4dabf7, LEN = [1.9, 1.2];
  var RND = [[-1.0, 0.9, 0.5, 0.4], [0.8, -1.1, -0.4, -0.8], [1.1, 1.0, 0.6, 1.2], [-0.7, -0.9, -0.7, 2.1]];
  var S = { mode: 'mit', u: 0, co: true, o0: 0, o1: 1, run: false, _st: -1, auto: false }, ch = [], cells = [], nucs = [], sp = [], cen = [], lab = {};
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function stages() {
    return [
      ["Interphase and duplication", "Interphase", "G1 → S (DNA replication) → G2: each chromosome comes to have two sister chromatids",
        "<p>Before dividing, the cell goes through <b>interphase</b>: <b>G1</b> (growth), <b>S</b> (DNA is replicated) and <b>G2</b> (preparation). After S phase each chromosome consists of <b>two identical sister chromatids</b> joined by the <b>centromere</b>. In the model: <b>2n = 4</b> (two pairs of homologs: large and small; <b>red</b> = maternal origin, <b>blue</b> = paternal). The DNA content goes from <b>2C to 4C</b>.</p>"],
      ["Mitosis: prophase and metaphase", "Prophase–Metaphase", "Condensation, breakdown of the nuclear envelope and alignment on the equatorial plate",
        "<p>In <b>prophase</b> the chromosomes <b>condense</b>, the nuclear envelope breaks down and the <b>centrosomes</b> migrate to opposite poles forming the <b>mitotic spindle</b>. In <b>metaphase</b> the chromosomes line up on the <b>equatorial plate</b>, each chromatid attached by its <b>kinetochore</b> to microtubules from opposite poles. This is the spindle checkpoint: the cell does not proceed until all are properly attached.</p>"],
      ["Mitosis: anaphase and cytokinesis", "Anaphase–Cytokinesis", "The sister chromatids separate and two identical cells (2n) form",
        "<p>In <b>anaphase</b> the centromeres separate and the microtubules pull <b>each sister chromatid</b> to a pole; from then on each is a complete chromosome. In <b>telophase</b> the nuclear envelopes are rebuilt and the chromosomes decondense; <b>cytokinesis</b> divides the cytoplasm (in animals, by a contractile ring). Result: <b>two 2n daughter cells, genetically identical</b>, each with 2C of DNA.</p>"],
      ["Meiosis I", "Meiosis I", "Synapsis, crossing over and separation of homologous chromosomes (2n → n)",
        "<p>In <b>prophase I</b> the homologs pair up (<b>synapsis</b>) forming <b>bivalents</b>, and non-sister chromatids exchange segments at the <b>chiasmata</b> (<b>crossing over</b>: variability). In <b>metaphase I</b> the bivalents line up and the orientation of each pair toward a pole is <b>random</b> (independent assortment). In <b>anaphase I</b> the <b>homologs</b> separate (not the chromatids). The result is <b>2 haploid cells (n)</b>, with chromosomes still duplicated (2C).</p>"],
      ["Meiosis II", "Meiosis II", "The sister chromatids separate: 4 haploid cells (n, 1C)",
        "<p><b>Meiosis II</b> resembles a mitosis, <b>without prior DNA replication</b>. In <b>metaphase II</b> the chromosomes (still with two chromatids, some recombinant) line up in each cell; in <b>anaphase II</b> the <b>sister chromatids</b> separate. <b>Four haploid cells (n = 2), genetically different</b>, are obtained, each with 1C of DNA: the future gametes (egg, sperm) or spores.</p>"],
      ["Genetic variability", "Variability", "Independent assortment (2ⁿ) + crossing over = enormous diversity",
        "<p>Two sources of variability: (1) <b>independent assortment</b> of homologous chromosomes: with n pairs there are <b>2ⁿ</b> possible combinations (here 2² = 4; in humans <b>2²³ ≈ 8.4 million</b>); (2) <b>crossing over</b>, which creates recombinant chromatids. Watch how the chromatid colors change and which combination (red/blue) each gamete receives. Mitosis: clone; meiosis: diversity.</p>"]
    ];
  }
  function phaseName() {
    var u = S.u;
    if (S.mode === 'mit') return u < 0.05 ? 'G1' : (u < 0.1 ? "S phase (replication)" : (u < 0.2 ? 'G2' : (u < 0.3 ? "Prophase" : (u < 0.45 ? "Metaphase" : (u < 0.62 ? "Anaphase" : (u < 0.8 ? "Telophase" : "Cytokinesis"))))));
    return u < 0.1 ? "Interphase (S)" : (u < 0.2 ? "Prophase I (synapsis and crossing over)" : (u < 0.3 ? "Metaphase I" : (u < 0.42 ? "Anaphase I" : (u < 0.5 ? "Telophase I and cytokinesis" : (u < 0.62 ? "Prophase II / Metaphase II" : (u < 0.78 ? "Anaphase II" : "Telophase II and cytokinesis"))))));
  }
  function side(p, h) { var o = p === 0 ? S.o0 : S.o1; return h === o ? -1 : 1; }
  function layout(c, p, h, s) {
    var u = S.u, r = RND[p * 2 + h], e = { vis: true, rz: 0, cond: 0, x: 0, y: 0, z: 0, sp: 0 };
    if (S.mode === 'mit') {
      var cd = sm((u - 0.1) / 0.2) * (1 - sm((u - 0.66) / 0.12)), dup = sm((u - 0.05) / 0.05), m1 = sm((u - 0.2) / 0.12), ap = sm((u - 0.47) / 0.15), tel = sm((u - 0.64) / 0.12), cc = p * 2 + h;
      e.vis = s === 0 || dup > 0.02; e.cond = cd;
      var sx = r[0] * 1.2 + (s - 0.5) * 0.3 * dup, sy = r[1] * 1.2, sz = r[2] * 1.0 + (s - 0.5) * 0.15 * dup, sg = s ? 1 : -1;
      var px = sg * (0.17 + 4.0 * ap), py = (cc - 1.5) * 1.7, pz = 0;
      var x = lerp(sx, px, m1), y = lerp(sy, py, m1), z = lerp(sz, pz, m1);
      var tx = sg * 4.2 + r[0] * 0.4, ty = r[1] * 0.6, tz = r[2] * 0.5;
      e.x = lerp(x, tx, tel); e.y = lerp(y, ty, tel); e.z = lerp(z, tz, tel); e.rz = lerp(lerp(r[3], 0, m1), r[3], tel); e.sp = sg;
    } else {
      var cd2 = sm((u - 0.08) / 0.1) * (1 - sm((u - 0.8) / 0.15)), dup2 = sm((u - 0.02) / 0.05), m_s = sm((u - 0.1) / 0.08), m_m = sm((u - 0.2) / 0.07), a1 = sm((u - 0.3) / 0.12), mII = sm((u - 0.5) / 0.1), a2 = sm((u - 0.62) / 0.15), t2 = sm((u - 0.8) / 0.1), sd = side(p, h);
      e.vis = s === 0 || dup2 > 0.02; e.cond = cd2;
      var sx2 = r[0] * 1.2, sy2 = r[1] * 1.2, sz2 = r[2] * 1.0 + (s - 0.5) * 0.15 * dup2;
      var bx1 = 0, by1 = (p - 0.5) * 3.4 + (h - 0.5) * 0.9, bz1 = (s - 0.5) * 0.34;
      var bx2 = sd * (0.9 + 3.1 * a1), by2 = (p - 0.5) * 3.4, bz2 = (s - 0.5) * 0.34;
      var x1 = lerp(sx2, bx1, m_s), y1 = lerp(sy2, by1, m_s), z1 = lerp(sz2, bz1, m_s);
      var x2 = lerp(x1, bx2, m_m), y2 = lerp(y1, by2, m_m), z2 = lerp(z1, bz2, m_m);
      var cx = sd * 3.8 + (p - 0.5) * 2.0 * (1 - 0.0 * t2), cy = (s ? 1 : -1) * (0.17 + 2.8 * a2), cz = 0;
      e.x = lerp(x2, cx, mII); e.y = lerp(y2, cy, mII); e.z = lerp(z2, cz, mII); e.rz = lerp(0, Math.PI / 2, mII); e.sp = sd; e.sis = s ? 1 : -1;
      if (m_s < 0.05 && u < 0.1) e.rz = r[3] * (1 - m_s);
    }
    return e;
  }
  function arm(g, col, sgn) { var m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.5 })); m.userData.s = sgn; g.add(m); return m; }
  var def = {
    key: 'mitosis-meiosis', title: "Mitosis and Meiosis", subtitle: "3D Simulator · biology", accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 6, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 3, 19], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 19, 2], target: [0, 0, 0] }],
    layers: [{ id: 'cell', label: "Membrane and nucleus", icon: '◯' }, { id: 'spindle', label: "Spindle", icon: '⌇' }],
    build: function (ctx) {
      var s = ctx.scene;
      for (var p = 0; p < 2; p++) for (var h = 0; h < 2; h++) for (var sis = 0; sis < 2; sis++) {
        var g = new T.Group(), col = h ? BLUE : RED, a = arm(g, col, 1), b = arm(g, col, -1), cm = new T.Mesh(new T.SphereGeometry(1, 12, 9), new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.4 })); g.add(cm); s.add(g);
        ch.push({ g: g, a: a, b: b, cm: cm, p: p, h: h, s: sis, col: col });
      }
      for (var i = 0; i < 4; i++) { var cl = new T.Mesh(new T.SphereGeometry(1, 28, 20), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.1, depthWrite: false })); s.add(cl); cells.push(cl); var nu = new T.Mesh(new T.SphereGeometry(2.4, 24, 16), new T.MeshBasicMaterial({ color: 0xb197fc, transparent: true, opacity: 0.2, depthWrite: false })); s.add(nu); nucs.push(nu); }
      var nu5 = new T.Mesh(new T.SphereGeometry(2.4, 24, 16), new T.MeshBasicMaterial({ color: 0xb197fc, transparent: true, opacity: 0.2, depthWrite: false })); s.add(nu5); nucs.push(nu5);
      for (i = 0; i < 8; i++) { var lg = new T.BufferGeometry().setFromPoints([V(0, 0, 0), V(1, 0, 0)]), ln = new T.Line(lg, new T.LineBasicMaterial({ color: 0xffd8a8, transparent: true, opacity: 0.55 })); ln.frustumCulled = false; s.add(ln); sp.push(ln); }
      for (i = 0; i < 4; i++) { var c2 = new T.Mesh(new T.SphereGeometry(0.28, 12, 9), new T.MeshStandardMaterial({ color: 0x20c997, roughness: 0.4 })); s.add(c2); cen.push(c2); }
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.auto = true;
        if (i === 0) { S.mode = 'mit'; S.u = 0.2 * sm(l) * 0.98; } else if (i === 1) { S.mode = 'mit'; S.u = 0.2 + 0.26 * l; } else if (i === 2) { S.mode = 'mit'; S.u = 0.46 + 0.54 * l; }
        else if (i === 3) { S.mode = 'mei'; S.u = 0.5 * l; } else if (i === 4) { S.mode = 'mei'; S.u = 0.5 + 0.5 * l; }
        else { S.mode = 'mei'; var h2 = l < 0.5; S.o0 = h2 ? 0 : 1; S.o1 = h2 ? 1 : 0; S.u = ((l * 2) % 1) * 0.98 + 0.01; }
      } else if (S.run) { S.u += dt / 16; if (S.u >= 1) { S.u = 1; S.run = false; } }
      var u = S.u, mit = S.mode === 'mit', cOn = ctx.layer('cell'), spOn = ctx.layer('spindle');
      // cromátidas
      var pos = {};
      ch.forEach(function (c, k) {
        var e = layout(c, c.p, c.h, c.s); c.e = e; c.g.visible = e.vis; c.g.position.set(e.x, e.y, e.z); c.g.rotation.z = e.rz;
        var L = LEN[c.p] * (1.5 - 0.5 * e.cond) * 0.5, th = 0.08 + 0.1 * e.cond; c.a.scale.set(th, L, th); c.a.position.y = L / 2; c.b.scale.set(th, L, th); c.b.position.y = -L / 2; c.cm.scale.setScalar(0.12 + 0.1 * e.cond);
        var swap = S.mode === 'mei' && S.co && u > 0.16 && c.s !== (c.h ? 0 : 1) ? false : false; // placeholder
        var recomb = S.mode === 'mei' && S.co && u > 0.16 && ((c.h === 0 && c.s === 1) || (c.h === 1 && c.s === 0));
        c.b.material.color.setHex(recomb ? (c.h ? RED : BLUE) : c.col); c.a.material.color.setHex(c.col);
      });
      // células
      var d = 0, r = 5, sx = 1;
      cells.forEach(function (cl) { cl.visible = false; }); nucs.forEach(function (n) { n.visible = false; });
      if (mit) {
        d = 3.7 * sm((u - 0.8) / 0.18); r = lerp(5, 3.6, sm((u - 0.8) / 0.18)); sx = 1 + 0.3 * sm((u - 0.47) / 0.15) * (u < 0.8 ? 1 : 0);
        for (var i2 = 0; i2 < 2; i2++) { var cl = cells[i2]; cl.visible = cOn; cl.position.set((i2 ? 1 : -1) * d, 0, 0); cl.scale.set(r * sx, r, r); }
        nucs[0].visible = cOn; nucs[0].position.set(0, 0, 0); nucs[0].material.opacity = 0.2 * (1 - sm((u - 0.2) / 0.07)) * (u < 0.5 ? 1 : 0);
        var nt = sm((u - 0.66) / 0.1); [1, 2].forEach(function (k) { nucs[k].visible = cOn && nt > 0.02; nucs[k].position.set((k === 1 ? -1 : 1) * 4.2, 0, 0); nucs[k].scale.setScalar(0.95); nucs[k].material.opacity = 0.22 * nt; });
      } else {
        var d1 = 3.8 * sm((u - 0.42) / 0.08), r1 = lerp(5, 3.7, sm((u - 0.42) / 0.08)), sx1 = 1 + 0.25 * sm((u - 0.3) / 0.12) * (u < 0.42 ? 1 : 0), yy = 2.9 * sm((u - 0.78) / 0.18), r2 = lerp(r1, 2.8, sm((u - 0.78) / 0.18));
        cells.forEach(function (cl, k) { cl.visible = cOn && (k < 2 || u > 0.42); var sgx = k % 2 ? 1 : -1, sgy = k < 2 ? 1 : -1; if (k >= 2) { cl.position.set(d1, yy * sgy * (k === 2 ? 1 : -1), 0); } cl.position.set((k < 2 ? -1 : 1) * d1, (k % 2 ? 1 : -1) * yy, 0); cl.scale.set(r2 * (u < 0.42 ? sx1 : 1), r2, r2); if (u < 0.42 && k >= 1) cl.visible = false; if (u >= 0.42 && u < 0.78 && (k === 1 || k === 3)) cl.visible = false; if (u >= 0.78) cl.visible = cOn; });
        nucs[0].visible = cOn; nucs[0].position.set(0, 0, 0); nucs[0].material.opacity = 0.2 * (1 - sm((u - 0.1) / 0.07)) * (u < 0.5 ? 1 : 0);
        var nq = sm((u - 0.84) / 0.12); [[1, -1, 1], [2, -1, -1], [3, 1, 1], [4, 1, -1]].forEach(function (a) { var n = nucs[a[0]]; n.visible = cOn && nq > 0.02; n.position.set(a[1] * 3.8, a[2] * 2.9, 0); n.scale.setScalar(0.5); n.material.opacity = 0.25 * nq; });
        var extra = new T.Vector3(3.8, -2.9, 0);
      }
      // huso
      var lines = sp, nL = 0;
      sp.forEach(function (ln) { ln.visible = false; });
      var showSp = spOn && (mit ? (u > 0.2 && u < 0.62) : ((u > 0.2 && u < 0.42) || (u > 0.5 && u < 0.8)));
      cen.forEach(function (c2) { c2.visible = false; });
      if (showSp) {
        var cenPos = mit ? [V(-5.3, 0, 0), V(5.3, 0, 0)] : (u < 0.5 ? [V(-5.3, 0, 0), V(5.3, 0, 0)] : [V(-3.8, 4.3, 0), V(-3.8, -4.3, 0), V(3.8, 4.3, 0), V(3.8, -4.3, 0)]);
        cenPos.forEach(function (p, k) { cen[k].visible = true; cen[k].position.copy(p); });
        ch.forEach(function (c, k) { if (!c.g.visible) return; var e = c.e, pole; if (mit) pole = V(e.sp * 5.3, 0, 0); else if (u < 0.5) pole = V(e.sp * 5.3, 0, 0); else pole = V(e.sp * 3.8, e.sis * 4.3, 0); var ln = sp[k]; var pts = ln.geometry.attributes.position; pts.setXYZ(0, pole.x, pole.y, pole.z); pts.setXYZ(1, c.g.position.x, c.g.position.y, c.g.position.z); pts.needsUpdate = true; ln.visible = true; });
      }
      var name = phaseName(), ploidy, dna;
      if (mit) { dna = u < 0.05 ? '2C' : (u < 0.8 ? '4C' : "2C per daughter cell"); ploidy = u < 0.47 ? "2n = 4 chromosomes" : (u < 0.62 ? "2n → 8 chromatids-chromosomes" : "2n = 4 per pole"); }
      else { dna = u < 0.05 ? '2C' : (u < 0.45 ? '4C' : (u < 0.8 ? "2C per cell" : "1C per cell")); ploidy = u < 0.3 ? "2n = 4 (bivalents)" : (u < 0.5 ? "n = 2 (duplicated chromosomes)" : 'n = 2'); }
      lab.t.pos(0, 6.9, 0).set((mit ? 'Mitosis · ' : 'Meiosis · ') + name, 'bl-lead').vis(true); lab.a.pos(0, -6.2, 0).set(ploidy + " · DNA: " + dna, 'bl-pos').vis(true);
      lab.b.pos(0, -7.2, 0).set(!mit && u > 0.14 && u < 0.3 && S.co ? "chiasmata: exchange between non-sister chromatids" : (mit ? '' : (u > 0.8 ? "4 different haploid cells" : '')), 'bl-warn').vis(true); lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.mode) u.mode.set(S.mode); if (!ctx.P.manual && u.u) u.u.set(S.u); },
    hud: function () { var mit = S.mode === 'mit'; return { eq: { chip: mit ? '2n→2n' : '2n→n', name: mit ? 'Mitosis' : 'Meiosis', body: "<div class=\"eqline\"><small>Phase</small>" + phaseName() + "</div><div class=\"eqline\"><small>Resulting cells</small>" + (mit ? '2 (2n)' : '4 (n)') + "</div><div class=\"eqline\"><small>Variability</small>" + (mit ? "none (clones)" : 'alta') + '</div>' }, legend: [{ label: "Red", color: '#ff6b6b', text: "maternal chromosome" }, { label: "Blue", color: '#4dabf7', text: "paternal chromosome" }, { label: "Point", color: '#ffd43b', text: "centromere" }] }; },
    measures: function () { var u = S.u, mit = S.mode === 'mit'; return [["Process", mit ? 'Mitosis' : 'Meiosis'], ["Phase", phaseName()], ["Progress", fmt(u * 100, 0) + ' %'], ["Daughter cells", mit ? '2 (2n)' : '4 (n)'], ["Crossing over", mit ? 'no' : (S.co ? "yes" : "off")], ["2ⁿ combinations (n = 2)", '4']]; },
    ideas: ["Mitosis: 1 2n cell → 2 identical 2n cells.", "Meiosis: 1 2n cell → 4 different n cells.", "Meiosis I separates homologs; meiosis II, chromatids.", "Synapsis and crossing over: only in prophase I.", "Independent assortment: 2ⁿ gametes."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Cell division"); el.appendChild(c);
      ui.mode = kit.ui.options({ label: "Process", cols: 2, value: S.mode, options: [{ v: 'mit', label: 'Mitosis', sub: '2n → 2n' }, { v: 'mei', label: 'Meiosis', sub: '2n → n' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.u = 0; } }); c.appendChild(ui.mode);
      ui.u = kit.ui.slider({ label: "Progress (phase)", min: 0, max: 1, step: 0.005, value: S.u, format: function (v) { var a = S.u; S.u = v; var n = phaseName(); S.u = a; return n; }, onInput: function (v) { ctx.goManual(); S.run = false; S.u = v; } }); c.appendChild(kit.ui.sliders([ui.u]));
      ui.o = kit.ui.options({ label: "Orientation in metaphase I (independent assortment)", cols: 2, value: String(S.o0), options: [{ v: '0', label: "Large red ← · small blue →" }, { v: '1', label: "Large blue ← · small red →" }], onChange: function (v) { ctx.goManual(); S.o0 = +v; S.o1 = 1 - (+v); S.mode = 'mei'; } }); c.appendChild(ui.o);
      ui.co = kit.ui.options({ label: "Crossing over", cols: 2, value: S.co ? '1' : '0', options: [{ v: '1', label: "With" }, { v: '0', label: "Without" }], onChange: function (v) { ctx.goManual(); S.co = v === '1'; } }); c.appendChild(ui.co);
      c.appendChild(ctx.btnRow([{ t: "▶ Animate", primary: true, fn: function () { ctx.goManual(); S.u = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "DNA content per cell", h: 220, note: "C = amount of DNA in a haploid genome. Mitosis: 2C→4C→2C. Meiosis: 2C→4C→2C→1C.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (u) { return L + pw * u; }, sy = function (v) { return Tp + ph - ph * v / 4.6; }, i;
        function dnaM(u) { return u < 0.05 ? 2 : (u < 0.1 ? 2 + 2 * (u - 0.05) / 0.05 : (u < 0.8 ? 4 : (u < 0.98 ? 4 - 2 * (u - 0.8) / 0.18 : 2))); }
        function dnaI(u) { return u < 0.05 ? 2 : (u < 0.1 ? 2 + 2 * (u - 0.05) / 0.05 : (u < 0.42 ? 4 : (u < 0.5 ? 4 - 2 * (u - 0.42) / 0.08 : (u < 0.78 ? 2 : (u < 0.98 ? 2 - (u - 0.78) / 0.2 : 1))))); }
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i + 'C', L - 5, sy(i) + 3); } cx.textAlign = 'center'; cx.fillText("process progress", L + pw / 2, h - 4);
        [[dnaM, '#f472b6', 'mitosis'], [dnaI, '#4ade80', 'meiosis']].forEach(function (a, k) { var cur = (S.mode === 'mit') === (k === 0); cx.strokeStyle = a[1]; cx.lineWidth = cur ? 3.2 : 1.6; cx.beginPath(); for (i = 0; i <= 100; i++) { var u = i / 100, y = a[0](u); if (i) cx.lineTo(sx(u), sy(y)); else cx.moveTo(sx(u), sy(y)); } cx.stroke(); cx.fillStyle = a[1]; cx.textAlign = 'left'; cx.fillText('● ' + a[2], L + 6 + k * 70, Tp + 10); }); cx.lineWidth = 1;
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.u), Tp); cx.lineTo(sx(S.u), Tp + ph); cx.stroke(); cx.setLineDash([]);
      } },
      { title: "Combinations by independent assortment", h: 210, note: "Number of possible gametes = 2ⁿ (not counting crossing over). In humans n = 23.", draw: function (cx, w, h, col) {
        var L = 44, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / 23, sy = function (e) { return Tp + ph - ph * e / 8; }, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 8; i += 2) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText('10^' + i, L - 5, sy(i) + 3); }
        cx.textAlign = 'center'; for (i = 1; i <= 23; i++) { var v = i * Math.log10(2); cx.fillStyle = i === 2 ? '#ff6b3d' : (i === 23 ? '#4ade80' : '#f472b6'); cx.fillRect(L + (i - 1) * bw + 1, sy(v), Math.max(1, bw - 2), Tp + ph - sy(v)); if (i === 2 || i === 23 || i % 5 === 0) { cx.fillStyle = col.muted; cx.fillText(i, L + (i - 1) * bw + bw / 2, h - B + 13); } }
        cx.fillStyle = col.muted; cx.fillText("n pairs of chromosomes (n = 2 in the model, 23 in humans)", L + pw / 2, h - 4);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      return "<div class=\"card-kicker\">Mitosis versus meiosis</div><div class=\"calc-step\">1 · Comparison</div><table class=\"calc-table\">" + row("Divisions", 'mitosis 1 · meiosis 2') + row("Daughter cells", 'mitosis 2 (2n) · meiosis 4 (n)') + row("Synapsis and crossing over", "meiosis I only") + row("Separation in anaphase", "mitosis: chromatids · meiosis I: homologs · meiosis II: chromatids") + row("Variability", "mitosis: none · meiosis: high") + '</table>' +
        "<div class=\"calc-step\">2 · Independent assortment</div><table class=\"calc-table\">" + row("Gametes (n = 2)", '2² = <b>4</b>') + row("Human gametes (n = 23)", '2²³ = <b>8 388 608</b>') + row("Possible zygotes", '(2²³)² ≈ <b>7,0×10¹³</b>') + row("With crossing over", "practically unlimited") + '</table>';
    },
    quiz: [
      { q: "What separates in anaphase I of meiosis?", options: ["the homologous chromosomes", "the sister chromatids", "the centrosomes", "the nucleoli"], answer: 0, why: "Each homolog (with its two chromatids) goes to a pole." },
      { q: "Mitosis produces…", options: ["2 identical 2n cells", "4 n cells", "2 n cells", "1 4n cell"], answer: 0, why: "Clonal reproduction." },
      { q: "Crossing over occurs in…", options: ["prophase I", "anaphase II", "metaphase of mitosis", 'G1'], answer: 0, why: "During synapsis of the homologs." },
      { q: "S phase is characterized by…", options: ["DNA replication", "chromosome condensation", "cytokinesis", "nuclear breakdown"], answer: 0, why: "The DNA content goes from 2C to 4C." },
      { q: "After meiosis II, the DNA content per cell is…", options: ['1C', '2C', '4C', '0,5C'], answer: 0, why: "Haploid cells with single-chromatid chromosomes." },
      { q: "Independent assortment with n = 3 generates…", options: ["8 combinations", '6', '9', '3'], answer: 0, why: '2³ = 8.' },
      { q: "Metaphase is defined by…", options: ["chromosomes aligned on the equatorial plate", "separated chromatids", "formed nuclear envelope", "divided cells"], answer: 0, why: "All the kinetochores attached to the spindle at the equator." },
      { q: "Meiosis II resembles…", options: ["a mitosis, without prior replication", "S phase", "meiosis I", "cytokinesis only"], answer: 0, why: "Sister chromatids separate." }
    ],
    help: { intro: "Switch between mitosis and meiosis, move the progress or press Animate. In meiosis you can change the orientation of the pairs in metaphase I and turn crossing over on or off.", items: [["Red/blue", "chromosomes of maternal/paternal origin."], ["Spindle", "microtubules from the centrosomes."]] }
  };
  MSim.create(def);
})();
