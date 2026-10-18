/* Alquinos: estructura y reacciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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


/* Constructor de geometrías 3D a partir de una notación tipo SMILES (sin anillos, salvo el fenilo «Ph»).
   MSim.build('CC{ol}O{ol}') -> { a:[[el,x,y,z]], b:[[i,j,orden]], tag:[etiqueta|null por átomo] }
   Reglas: sp3 tetraédrico (zigzag anti), sp2 plano (trans), sp lineal; los H se completan por valencia.
   Etiquetas: átomo{nombre} (los H unidos a N, O, S heredan la etiqueta; con «nombre+» también los de C). */
(function () {
  var T = THREE, V = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1 };
  var BL = { 'C-C1': 1.54, 'C-C2': 1.34, 'C-C3': 1.20, 'C-O1': 1.43, 'C-O2': 1.22, 'C-N1': 1.47, 'C-N2': 1.28, 'C-N3': 1.16, 'C-F1': 1.35, 'C-Cl1': 1.77, 'C-Br1': 1.94, 'C-I1': 2.14, 'C-S1': 1.82, 'C-S2': 1.60, 'C-H1': 1.09, 'H-O1': 0.96, 'H-N1': 1.01, 'H-S1': 1.34, 'N-O1': 1.40, 'N-O2': 1.22, 'O-S2': 1.45, 'O-P2': 1.48, 'O-P1': 1.60, 'C-P1': 1.84, 'O-O1': 1.45, 'N-N1': 1.45, 'H-P1': 1.42 };
  function bl(a, b, o) { var k = [a, b].sort().join('-') + o; return BL[k] || BL[[b, a].join('-') + o] || 1.5; }
  function parse(s) {
    var i = 0, root = null, nodes = [];
    function seq(parent, ord) {
      var prev = parent;
      while (i < s.length) {
        var ch = s[i];
        if (ch === '(') { i++; seq(prev, 1); continue; }
        if (ch === ')') { i++; return; }
        if (ch === '=') { ord = 2; i++; continue; } if (ch === '#') { ord = 3; i++; continue; } if (ch === '-') { i++; continue; }
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length;
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - sum); }
  function perp(u, ref) { var p = ref ? ref.clone().sub(u.clone().multiplyScalar(ref.dot(u))) : null; if (!p || p.lengthSq() < 1e-6) { p = Math.abs(u.x) < 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1); p.sub(u.clone().multiplyScalar(p.dot(u))); } return p.normalize(); }
  function build(s) {
    var tr = parse(s), A = [], B = [], TAG = [];
    function add(el, p, tag) { A.push([el, p.x, p.y, p.z]); TAG.push(tag || null); return A.length - 1; }
    function bond(i, j, o) { B.push([i, j, o || 1]); }
    function dirsFor(h, u, ref, isRoot) {
      var e1 = perp(u, ref), e2 = new T.Vector3().crossVectors(u, e1), out = [];
      if (h === 'sp') { out = [u.clone().negate()]; if (isRoot) out.unshift(u.clone()); return out; }
      if (h === 'sp2') { out = [u.clone().multiplyScalar(-0.5).addScaledVector(e1, -0.866), u.clone().multiplyScalar(-0.5).addScaledVector(e1, 0.866)]; if (isRoot) out.unshift(u.clone()); return out; }
      for (var i = 0; i < 3; i++) { var f = Math.PI + i * 2 * Math.PI / 3; out.push(u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, 0.9428 * Math.cos(f)).addScaledVector(e2, 0.9428 * Math.sin(f))); }
      if (isRoot) out.unshift(u.clone()); return out;
    }
    function place(n, pos, u, gp, idx) {
      n.pos = pos; var ref = gp ? gp.clone().sub(pos) : null; var h = hyb(n), tagH = n.tag && (n.inh || n.el === 'N' || n.el === 'O' || n.el === 'S') ? n.tag : null;
      if (h === 'ring') {
        var R = 1.40, uu = u ? u : new T.Vector3(0, 1, 0), w = perp(uu, ref), ctr = pos.clone().addScaledVector(uu, -R), ids = [idx];
        for (var k = 1; k < 6; k++) { var th = k * Math.PI / 3, p = ctr.clone().addScaledVector(uu, Math.cos(th) * R).addScaledVector(w, Math.sin(th) * R); var id = add('C', p, n.tag); ids.push(id); }
        for (k = 0; k < 6; k++) bond(ids[k], ids[(k + 1) % 6], k % 2 ? 1 : 2);
        for (k = 0; k < 6; k++) { if (k === 0 && u) continue; var q = new T.Vector3(A[ids[k]][1], A[ids[k]][2], A[ids[k]][3]), d = q.clone().sub(ctr).normalize(), hp = q.clone().addScaledVector(d, 1.08), hid = add('H', hp, n.inh ? n.tag : null); bond(ids[k], hid, 1); }
        return;
      }
      var subs = n.kids.slice(), nh = nH(n), dirs = dirsFor(h, u || new T.Vector3(0, 1, 0), ref, !n.par), si = 0;
      subs.forEach(function (c) { var d = dirs[si++] || dirs[0], len = bl(n.el, c.el === 'Ph' ? 'C' : c.el, c.ord), p = pos.clone().addScaledVector(d, len), id = add(c.el === 'Ph' ? 'C' : c.el, p, c.tag); bond(idx, id, c.ord); place(c, p, d.clone().negate(), n.par ? n.par.pos : null, id); });
      for (var k = 0; k < nh; k++) { var d2 = dirs[si++] || dirs[0], hl = bl(n.el, 'H', 1), hp2 = pos.clone().addScaledVector(d2, hl), hid2 = add('H', hp2, tagH); bond(idx, hid2, 1); }
    }
    var r = tr.root, rp = new T.Vector3(0, 0, 0), ri = add(r.el === 'Ph' ? 'C' : r.el, rp, r.tag); place(r, rp, null, null, ri);
    var c = new T.Vector3(); A.forEach(function (a) { c.x += a[1]; c.y += a[2]; c.z += a[3]; }); c.multiplyScalar(1 / A.length); A.forEach(function (a) { a[1] -= c.x; a[2] -= c.y; a[3] -= c.z; });
    return { a: A, b: B, tag: TAG };
  }
  MSim.build = build;
})();


(function () {
  var T = THREE;
  var SUB = { prop: { n: 'Propino', s: 'CC#C', t: true }, but1: { n: '1-Butino', s: 'CCC#C', t: true }, but2: { n: '2-Butino', s: 'CC#CC', t: false } };
  var RX = {
    none: { n: "No reaction", r: '' },
    nanh2: { n: "Deprotonation (NaNH₂)", r: "NaNH₂, NH₃(l)", note: "The terminal H (pKa ≈ 25) is removed: the acetylide forms, a good nucleophile." },
    h2pd: { n: "H₂ / Pd-C", r: "H₂ (excess), Pd/C", note: "Complete hydrogenation to alkane; it does not stop at the alkene." },
    lindlar: { n: "H₂ / Lindlar", r: "H₂, poisoned Pd/CaCO₃", note: "Syn addition on the same side: cis (Z) alkene." },
    nanh3: { n: "Na / NH₃(l)", r: "Na, NH₃(l)", note: "Dissolving-metal reduction: trans (E) alkene." },
    h2o: { n: "H₂O, H₂SO₄, HgSO₄", r: "H₂O, H₂SO₄, HgSO₄", note: "Markovnikov hydration: the enol tautomerizes to a ketone." },
    hbo: { n: "Hydroboration–oxidation", r: "1) R₂BH   2) H₂O₂, NaOH", note: "Anti-Markovnikov: the enol gives an aldehyde (terminal alkyne)." },
    hx: { n: "HBr (1 equiv.)", r: 'HBr', note: "Markovnikov addition: haloalkene; with excess, geminal dihalide." }
  };
  var PR = {
    prop: { nanh2: ['CC#C', "Propyne acetylide"], h2pd: ['CCC', "Propane"], lindlar: ['CC=C', 'Propeno'], nanh3: ['CC=C', 'Propeno'], h2o: ['CC(=O)C', "Propanone (acetone)"], hbo: ['CCC=O', 'Propanal'], hx: ['CC(Br)=C', '2-Bromopropeno'] },
    but1: { nanh2: ['CCC#C', "1-Butyne acetylide"], h2pd: ['CCCC', "Butane"], lindlar: ['CCC=C', '1-Buteno'], nanh3: ['CCC=C', '1-Buteno'], h2o: ['CCC(=O)C', "Butanone"], hbo: ['CCCC=O', 'Butanal'], hx: ['CCC(Br)=C', '2-Bromo-1-buteno'] },
    but2: { nanh2: null, h2pd: ['CCCC', "Butane"], lindlar: ['CC=CC', '(Z)-2-Buteno'], nanh3: ['CC=CC', '(E)-2-Buteno'], h2o: ['CCC(=O)C', "Butanone"], hbo: ['CCC(=O)C', "Butanone"], hx: ['CC=C(Br)C', '2-Bromo-2-buteno'] }
  };
  var S = { sub: 'but1', rx: 'none' }, g = null, gS = null, gP = null, arrow = null, lab = [], keyP = '', keyS = '';
  function prod() { var p = PR[S.sub][S.rx]; if (S.rx === 'hbo' && !SUB[S.sub].t) p = PR[S.sub].hbo; return p || null; }
  function cisify(geo) { // gira 180° el fragmento unido al C3 del alqueno CC=CC (convierte trans en cis)
    var a = geo.a, b = geo.b, n = a.length, i, db = null; b.forEach(function (x) { if (x[2] === 2) db = x; }); if (!db) return geo;
    var adj = a.map(function () { return []; }); b.forEach(function (x) { adj[x[0]].push(x[1]); adj[x[1]].push(x[0]); });
    var seen = {}; seen[db[0]] = 1; var st = [db[1]], fr = []; seen[db[1]] = 1; while (st.length) { var u = st.pop(); fr.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; st.push(v); } }); }
    var p0 = new T.Vector3(a[db[0]][1], a[db[0]][2], a[db[0]][3]), p1 = new T.Vector3(a[db[1]][1], a[db[1]][2], a[db[1]][3]), ax = p1.clone().sub(p0).normalize();
    fr.forEach(function (k) { if (k === db[1]) return; var v = new T.Vector3(a[k][1], a[k][2], a[k][3]).sub(p1); v.applyAxisAngle(ax, Math.PI); a[k][1] = p1.x + v.x; a[k][2] = p1.y + v.y; a[k][3] = p1.z + v.z; });
    return geo;
  }
  function stages() {
    return [
      ["sp structure", "Structure", "The triple-bond carbons are sp: linear geometry of 180°",
        "<p>In an <b>alkyne</b> the two triple-bond carbons are <b>sp</b> hybridized. The C≡C bond (1.20 Å) is shorter than C=C (1.34 Å) and the four atoms H–C≡C–C lie on a <b>straight line (180°)</b>. One σ and two π bonds (perpendicular to each other) form the triple bond. Switch between propyne, 1-butyne and 2-butyne.</p>"],
      ["Acidity and acetylides", "Acidity", "The terminal H is acidic (pKa ≈ 25) because the sp carbanion has 50 % s character",
        "<p>The H of a <b>terminal alkyne</b> is acidic (pKa ≈ 25), much more than that of an alkene (44) or an alkane (50), because the carbanion's lone pair sits in an <b>sp (50% s)</b> orbital, closer to the nucleus. A strong base such as <b>NaNH₂</b> removes it to form an <b>acetylide</b>, a nucleophile useful for lengthening chains. 2-Butyne has no terminal H and does not react.</p>"],
      ["Selective hydrogenation", "Hydrogenation", "Lindlar → cis · Na/NH₃ → trans · H₂/Pd → alkane",
        "<p>With <b>H₂/Pd-C</b> the alkyne goes all the way to the alkane. The <b>Lindlar</b> catalyst (poisoned Pd) stops at the <b>cis alkene</b>, by syn addition of both H atoms. Reduction with <b>Na in liquid NH₃</b> gives the <b>trans alkene</b> through a radical anion. Observe the product's geometry.</p>"],
      ["Hydration and tautomerism", "Hydration", "Enol → ketone (or aldehyde with hydroboration)",
        "<p>Hg²⁺-catalyzed <b>hydration</b> follows <b>Markovnikov's</b> rule and gives an unstable <b>enol</b> that <b>tautomerizes</b> to a <b>ketone</b>. <b>Hydroboration–oxidation</b> is anti-Markovnikov: a terminal alkyne yields an <b>aldehyde</b>. A symmetrical internal alkyne gives a single ketone.</p>"],
      ["HBr addition", "HX addition", "Markovnikov regiochemistry",
        "<p><b>HBr</b> adds across the triple bond: H goes to the carbon with more H and Br to the more substituted one, via a <b>vinyl cation</b>. With one equivalent the <b>bromoalkene</b> is obtained; with excess, the <b>geminal dibromide</b>. Compare the product of a terminal and an internal alkyne.</p>"]
    ];
  }
  function place(grp, x) { grp.position.set(x, 0, 0); grp.rotation.z = Math.PI / 2; }
  var def = {
    key: 'alquinos', title: "Alkynes: structure and reactions", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [10, 4, 17], target: [10, 0, 0] }, { id: 'frontal', label: "Front", pos: [10, 0, 20], target: [10, 0, 0] }],
    layers: [{ id: 'prod', label: "Product", icon: '→' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gS = new T.Group(); gP = new T.Group(); g.add(gS); g.add(gP);
      arrow = new T.Group(); var sh = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 4, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); sh.rotation.z = Math.PI / 2; arrow.add(sh); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.x = 2.2; arrow.add(hd); g.add(arrow);
      for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['prop', 'but1', 'but2'][Math.min(2, Math.floor(f.local * 3))]; S.rx = 'none'; } if (i === 1) { S.sub = f.local < 0.7 ? 'but1' : 'but2'; S.rx = 'nanh2'; } if (i === 2) { S.sub = 'but2'; S.rx = ['lindlar', 'nanh3', 'h2pd'][Math.min(2, Math.floor(f.local * 3))]; } if (i === 3) { S.sub = 'but1'; S.rx = f.local < 0.5 ? 'h2o' : 'hbo'; } if (i === 4) { S.sub = f.local < 0.5 ? 'but1' : 'but2'; S.rx = 'hx'; } }
      var sd = SUB[S.sub], pr = S.rx === 'none' ? null : prod(), kS = S.sub, kP = pr ? S.sub + S.rx : '';
      if (keyS !== kS) { keyS = kS; while (gS.children.length) gS.remove(gS.children[0]); gS.add(ctx.mol(MSim.build(sd.s), { gs: 1.7, ar: 0.8 })); }
      if (keyP !== kP) { keyP = kP; while (gP.children.length) gP.remove(gP.children[0]); if (pr) { var geo = MSim.build(pr[0]); if (S.rx === 'lindlar' && S.sub === 'but2') geo = cisify(geo); gP.add(ctx.mol(geo, { gs: 1.7, ar: 0.8 })); } }
      var showP = !!pr && ctx.layer('prod'); gP.visible = showP; arrow.visible = !!pr; place(gS, 11); place(gP, 23); arrow.position.set(17, 0, 0);
      lab[0].pos(11, 4.2, 0).set(sd.n, 'bl-lead').vis(true);
      lab[1].pos(11, -4, 0).set(i === 0 && !P.manual || S.rx === 'none' ? "C≡C 1.20 Å · 180° angle (sp)" : "pKa of H≡C–H ≈ 25", 'bl-d').vis(true);
      lab[2].pos(23, 4.2, 0).set(pr ? pr[1] : '', 'bl-pos').vis(showP);
      lab[3].pos(17, 1.4, 0).set(pr ? RX[S.rx].r : '', 'bl-d').vis(!!pr);
      lab[4].pos(23, -4, 0).set(pr && S.rx === 'lindlar' && S.sub === 'but2' ? "cis (Z)" : (pr && S.rx === 'nanh3' && S.sub === 'but2' ? "trans (E)" : ''), 'bl-d').vis(showP);
      if (S.rx !== 'none' && !pr) { lab[2].set("Does not react: no terminal H", 'bl-neg').vis(true).pos(23, 0, 0); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.rx) u.rx.set(S.rx); },
    hud: function () { var pr = S.rx === 'none' ? null : prod(); return { eq: { chip: 'C≡C', name: "Reaction", body: "<div class=\"eqline\"><small>Substrate</small>" + SUB[S.sub].n + "</div><div class=\"eqline\"><small>Reagent</small>" + RX[S.rx].n + "</div><div class=\"eqline\"><small>Product</small>" + (pr ? pr[1] : (S.rx === 'none' ? '—' : "does not react")) + '</div>' }, legend: [{ label: "Gray", color: '#56606b', text: 'C' }, { label: 'Blanco', color: '#f2f2f2', text: 'H' }, { label: "Brown", color: '#a0522d', text: 'Br' }] }; },
    measures: function () { var pr = S.rx === 'none' ? null : prod(); return [["Substrate", SUB[S.sub].n], ['Terminal', SUB[S.sub].t ? "yes" : 'no'], ["Reaction", RX[S.rx].n], ["Product", pr ? pr[1] : '—']]; },
    ideas: ["Alkyne: sp C, 180°.", "Terminal: pKa ≈ 25.", "Lindlar cis · Na/NH₃ trans.", "Hydration: enol → ketone."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Substrate and reagent"); el.appendChild(c);
      ui.sub = kit.ui.options({ label: "Alkyne", cols: 3, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); S.sub = v; } });
      ui.rx = kit.ui.options({ label: "Reaction", cols: 2, value: S.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].n }; }), onChange: function (v) { ctx.goManual(); S.rx = v; } });
      c.appendChild(ui.sub); c.appendChild(ui.rx); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Relative acidity (pKa)", h: 200, note: "Lower pKa = more acidic. The terminal alkyne H is much more acidic than that of alkanes and alkenes.", draw: function (cx, w, h, col) {
      var d = [['H₂O', 15.7], ['R–C≡C–H', 25], ['NH₃', 38], ["alkene", 44], ["alkane", 50]], L = 10, B = 26, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * x[1] / 50; cx.fillStyle = x[0] === 'R–C≡C–H' ? '#ff922b' : '#74c0fc'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(String(x[1]).replace('.', '.'), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var pr = S.rx === 'none' ? null : prod(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + SUB[S.sub].n + ' + ' + RX[S.rx].n + '</div><table class="calc-table">' + row("Product", pr ? '<b>' + pr[1] + '</b>' : (S.rx === 'none' ? "choose a reaction" : "does not react")) + row("Note", RX[S.rx].note || "Observe the linear geometry of the triple bond.") + row("Degree of unsaturation", "2 (triple bond) → " + (pr ? (/=O|=C/.test(pr[0]) ? '1' : (pr[0].indexOf('#') >= 0 ? '2' : '0')) : '2')) + '</table>'; },
    quiz: [
      { q: "The geometry around a triple-bond carbon is…", options: ["linear, 180°", "trigonal planar, 120°", "tetrahedral, 109.5°", "bent"], answer: 0, why: "sp hybridization." },
      { q: "The terminal alkyne is acidic because the carbanion…", options: ["has 50 % s character", "is sp³", "is aromatic", "has positive charge"], answer: 0, why: "The pair is closer to the nucleus." },
      { q: "Hydrogenation of 2-butyne with Lindlar produces…", options: ["(Z)-2-butene", "(E)-2-butene", "butane", "butanone"], answer: 0, why: "Syn addition on a poisoned catalyst." },
      { q: "Hydration of 1-butyne with HgSO₄/H₂SO₄ gives…", options: ["butanone", 'butanal', "butane", '1-butanol'], answer: 0, why: "Markovnikov: enol → ketone." },
      { q: "Na/NH₃(l) with an internal alkyne gives…", options: ["trans alkene", "cis alkene", "alkane", "ketone"], answer: 0, why: "The radical anion is more stable trans." },
      { q: "Which one does NOT react with NaNH₂ as an acid?", options: ['2-butino', '1-butino', "propyne", "acetylene"], answer: 0, why: "It has no terminal H." }
    ],
    help: { intro: "Choose an alkyne and a reaction: on the left you see the substrate and on the right the product with its geometry. In “Graphs” compare the acidities.", items: [["Left", 'sustrato.'], ["Right", 'producto.']] }
  };
  MSim.create(def);
})();
