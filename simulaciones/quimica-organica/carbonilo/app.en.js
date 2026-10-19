/* Adición nucleófila al carbonilo — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length; var cat = false, an = false; if (el === 'C' && s[i] === '+') { cat = true; i++; } else if (s[i] === '^') { an = true; i++; }
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, cat: cat, an: an, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (nd.cat) nd.tag = 'cat'; if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.cat) return 'sp2'; if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - (n.cat ? 1 : 0) - (n.an ? 1 : 0) - sum); }
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
  var fmt = SimKit.fmt, R = 8.314, GS = 1.3;
  var CB = {
    form: { n: "formaldehyde", r: ['', ''], K: 2300, E: [0, 0], nm: "methanal" },
    etanal: { n: "ethanal", r: ['C', ''], K: 1.0, nm: "ethanal" },
    prop: { n: "propanone", r: ['C', 'C'], K: 0.0014, nm: "propanone" },
    acf: { n: "acetophenone", r: ['C', 'Ph'], K: 1e-5, nm: "acetophenone" }
  };
  var NU = {
    H2O: { n: 'H₂O', frag: 'O{nu}', t: 'H₂O', col: 0xff4d4d, r: 0.7, tn: "hydrate (gem-diol)", pn: { form: "methanediol", etanal: "ethane-1,1-diol", prop: "propane-2,2-diol", acf: "1-phenylethane-1,1-diol" }, how: "hydration (acid or base catalysis)" },
    MeOH: { n: 'CH₃OH', frag: 'O{nu}C', t: 'CH₃OH', col: 0xff8787, r: 0.75, tn: 'hemiacetal', pn: { form: "methoxymethanol", etanal: '1-metoxietanol', prop: '2-metoxipropan-2-ol', acf: '1-metoxi-1-feniletanol' }, how: "hemiacetal formation" },
    CN: { n: 'CN⁻ (HCN)', frag: 'C{nu}#N', t: 'CN⁻', col: 0x4f7cff, r: 0.7, tn: "cyanohydrin", pn: { form: "hydroxyacetonitrile", etanal: '2-hidroxipropanonitrilo', prop: '2-hidroxi-2-metilpropanonitrilo', acf: '2-hidroxi-2-fenilpropanonitrilo' }, how: "cyanide addition (KCN/HCN)" },
    H: { n: 'H⁻ (NaBH₄)', frag: '', t: 'H⁻', col: 0xeeeeee, r: 0.42, tn: 'alcohol', pn: { form: "methanol", etanal: "ethanol", prop: 'propan-2-ol', acf: '1-feniletanol' }, how: "hydride reduction (NaBH₄, LiAlH₄)" },
    Me: { n: 'CH₃⁻ (CH₃MgBr)', frag: 'C{nu}', t: 'CH₃⁻', col: 0x56606b, r: 0.8, tn: 'alcohol', pn: { form: "ethanol", etanal: 'propan-2-ol', prop: '2-metilpropan-2-ol', acf: '2-fenilpropan-2-ol' }, how: "Grignard reagent (1st RMgX; 2nd H₃O⁺)" }
  };
  var LG = {
    Cl: { n: "acyl chloride", s: 'Cl{lg}', t: 'Cl⁻', col: 0x3ddc5a, r: 0.95, pka: -7, ex: "ethanoyl chloride" },
    An: { n: "anhydride", s: 'O{lg}C(=O)C', t: 'CH₃COO⁻', col: 0xff8787, r: 0.8, pka: 4.8, ex: "ethanoic anhydride" },
    Es: { n: "ester", s: 'O{lg}C', t: 'CH₃O⁻', col: 0xff6b6b, r: 0.7, pka: 15.5, ex: "methyl ethanoate" },
    Am: { n: 'amida', s: 'N{lg}', t: 'NH₂⁻', col: 0x4f7cff, r: 0.7, pka: 38, ex: "ethanamide" }
  };
  var S = { cb: 'etanal', nu: 'H2O', lg: 'Cl', mode: 'add', prog: 0, anim: false };
  var cache = {}, G = {}, labs = {}, arrows = [];
  function wrap(x) { return x ? '(' + x + ')' : ''; }
  function smi(kind, cb, nu, lg) {
    var r = CB[cb].r, R = wrap(r[0]) + wrap(r[1]);
    if (kind === 'r') return 'C{c}(=O{o})' + R;
    if (kind === 't') return 'C{c}(O^{o})' + wrap(NU[nu].frag) + R;
    if (kind === 'p') return 'C{c}(O{o})' + wrap(NU[nu].frag) + R;
    if (kind === 'hem') return 'C{c}(O{o})(O{nu}C)' + R;
    if (kind === 'ace') return 'C{c}(O{o}C)(O{nu}C)' + R;
    if (kind === 'ar') return 'C{c}(=O{o})(C)' + LG[lg].s;
    if (kind === 'at') return 'C{c}(O^{o})(C)(O{nu})' + LG[lg].s;
    if (kind === 'ap') return 'C{c}(=O{o})(C)O{nu}';
    return 'C';
  }
  function nb(g, i) { var o = []; g.b.forEach(function (b) { if (b[0] === i) o.push(b[1]); else if (b[1] === i) o.push(b[0]); }); return o; }
  function align(g, o, a, b, up) {
    var P = g.a.map(function (q) { return new THREE.Vector3(q[1], q[2], q[3]); }), po = P[o], e1 = po.clone().sub(P[a]).normalize(), y;
    if (up != null) { var u = P[up].clone().sub(po); y = u.sub(e1.clone().multiplyScalar(u.dot(e1))).normalize(); } else { y = new THREE.Vector3().crossVectors(P[a].clone().sub(po), P[b].clone().sub(po)).normalize(); if (y.y < 0) y.negate(); }
    var z = new THREE.Vector3().crossVectors(e1, y); g.a.forEach(function (q, i) { var d = P[i].clone().sub(po); q[1] = d.dot(e1); q[2] = d.dot(y); q[3] = d.dot(z); }); return g;
  }
  function geo(kind) {
    var key = kind + S.cb + S.nu + S.lg; if (cache[key]) return cache[key];
    var g = MSim.build(smi(kind, S.cb, S.nu, S.lg)), c = g.tag.indexOf('c'), o = g.tag.indexOf('o'), nu = g.tag.indexOf('nu');
    if (kind === 'r' || kind === 'ar') { var oth = nb(g, c).filter(function (m) { return m !== o; })[0]; align(g, c, o, oth, null); }
    else { var up = nu; if (up < 0) up = nb(g, c).filter(function (m) { return g.a[m][0] === 'H'; })[0]; if (up == null) up = nb(g, c).filter(function (m) { return m !== o; })[0]; align(g, c, o, null, up); }
    g.O = o; g.C = c; g.nu = nu; cache[key] = g; return g;
  }
  function grp(ctx, kind) { var key = kind + S.cb + S.nu + S.lg; if (!G.g[key]) { var g = ctx.mol(geo(kind), { gs: GS, ar: 0.46 }); g.visible = false; ctx.scene.add(g); G.g[key] = g; } return G.g[key]; }
  function hideAll() { Object.keys(G.g).forEach(function (k) { G.g[k].visible = false; G.g[k].position.set(0, 0, 0); }); }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function setArrow(T, ar, p0, p1, bl, on) { if (ar.mesh) { ar.mesh.geometry.dispose(); ar.group.remove(ar.mesh); ar.mesh = null; } ar.group.visible = on; if (!on) return; var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bl), cur = new T.QuadraticBezierCurve3(p0, mid, p1); ar.mesh = new T.Mesh(new T.TubeGeometry(cur, 14, 0.05, 6, false), ar.mat); ar.group.add(ar.mesh); var tan = p1.clone().sub(cur.getPoint(0.92)).normalize(); ar.head.position.copy(p1); ar.head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan); }
  function bondTo(T, m, p, q) { var d = q.clone().sub(p), L = d.length(); m.scale.set(1, Math.max(1e-3, L), 1); m.position.copy(p).add(q).multiplyScalar(0.5); if (L > 1e-6) m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
  function V(x, y, z) { return new THREE.Vector3(x * GS, y * GS, z * GS); }
  var BD = new THREE.Vector3(0.292, 0.956, 0);
  function stages() {
    return [
      ["The carbonyl group", "Carbonyl", "C=O is planar, polar and the carbon is electrophilic", "<p>The <b>C=O carbonyl</b> is planar (sp², 120°) and highly polar: the more electronegative oxygen pulls the π pair (resonance form C⁺–O⁻). The carbon carries a partial <b>δ+</b> charge and is the site of attack by <b>nucleophiles</b>; the oxygen (δ−) is basic. The π* orbital (LUMO, blue lobes) has its largest coefficient on the <b>carbon</b>.</p>"],
      ["Bürgi–Dunitz trajectory", "Trajectory", "The nucleophile attacks C from above, at ≈ 107° to the C=O bond", "<p>The nucleophile approaches the plane of the carbonyl at an angle of about <b>107°</b> to the C=O bond (<b>Bürgi–Dunitz angle</b>): a compromise between maximum overlap with the π* and minimum repulsion with the O electrons. Bulky R groups block this trajectory (steric hindrance).</p>"],
      ["Nucleophilic addition", "Addition", "The nucleophile's pair forms the bond; the π pair goes to the oxygen", "<p>Two curved arrows: the Nu⁻ pair forms the Nu–C bond and the π pair of the C=O moves onto the oxygen, which becomes an <b>alkoxide</b> (O⁻). The carbon changes from <b>planar sp² to tetrahedral sp³</b>: this is the <b>tetrahedral intermediate</b>. The step is reversible except with strong nucleophiles (H⁻, R⁻).</p>"],
      ["Protonation: the product", "Protonation", "The alkoxide picks up H⁺ and gives the alcohol (or derivative)", "<p>The alkoxide is protonated (H₃O⁺ in the acid work-up): the <b>alcohol</b> forms. Depending on the nucleophile the product is a <b>gem-diol</b> (H₂O), a <b>hemiacetal</b> (ROH), a <b>cyanohydrin</b> (CN⁻), or an <b>alcohol</b> by reduction (H⁻) or with a Grignard reagent (R⁻, new C–C bond).</p>"],
      ["Aldehyde vs ketone", "Reactivity", "Aldehydes are more reactive than ketones", "<p>Two reasons: <b>electronic</b> (a ketone has two donor alkyl groups that reduce the δ+ on C) and <b>steric</b> (two R groups hinder access; in the sp³ product there is more crowding). Hydration constant: formaldehyde ≈ 2300, ethanal ≈ 1, propanone ≈ 0.0014.</p>"],
      ["Hemiacetals and acetals", "Acetals", "With excess alcohol and H⁺ the hemiacetal becomes an acetal", "<p>The (unstable) <b>hemiacetal</b> becomes an <b>acetal</b> with another ROH and acid catalysis (H₂O is lost). Acetals are <b>stable in basic medium</b>: they are used as <b>protecting groups</b> for aldehydes and ketones. In sugars, the cyclic hemiacetal is the pyranose/furanose form.</p>"],
      ["Acid derivatives: acyl substitution", "Acyl", "Addition–elimination: the intermediate expels a leaving group", "<p>In <b>acids and derivatives</b> (R–CO–L) the tetrahedral intermediate can <b>expel L⁻</b> and regenerate the C=O: <b>nucleophilic acyl substitution</b> (addition–elimination). Reactivity follows the ability of L as a leaving group (pKa of HL): <b>acyl chloride ≫ anhydride &gt; ester ≈ acid &gt; amide</b>.</p>"]
    ];
  }
  function state(si, p, now) {
    var r = { main: null, nu: null, lg: null, arr: [null, null], lobes: false, dip: false, hp: null, txt: '', path: false, angle: false, cmp: false, tri: false };
    var cbd = CB[S.cb], nuI = NU[S.nu];
    if (si === 0) { r.main = 'r'; r.lobes = true; r.dip = true; r.txt = cbd.n; }
    else if (si === 1) { r.main = 'r'; r.lobes = true; var d = 4.4 - 1.9 * sm(p); r.nu = BD.clone().multiplyScalar(d * GS); r.path = true; r.angle = true; r.txt = "Nu⁻ approaches at 107°"; }
    else if (si === 2) { var e = sm(p / 0.85); if (p < 0.85) { r.main = 'r'; var dd = 2.5 - 0.9 * e; r.nu = BD.clone().multiplyScalar(dd * GS); r.lobes = true; r.arr[0] = { a: r.nu.clone(), b: V(0, 0.5, 0), bl: new THREE.Vector3(0.5, 0.8, 0) }; r.arr[1] = { a: V(-0.3, 0.3, 0), b: V(-1.5, 0.7, 0), bl: new THREE.Vector3(0, 0.9, 0) }; r.txt = "nucleophilic attack"; } else { r.main = 't'; r.txt = "tetrahedral intermediate (alkoxide)"; } }
    else if (si === 3) { if (p < 0.55) { r.main = 't'; r.hp = V(-4, 3, 0).lerp(V(-1.9, 0.9, 0), sm(p / 0.5)); r.arr[0] = { a: V(-1.5, 0.3, 0), b: r.hp.clone(), bl: new THREE.Vector3(-0.3, 0.8, 0) }; r.txt = "protonation of O⁻"; } else { r.main = 'p'; r.txt = nuI.tn + ': ' + nuI.pn[S.cb]; } }
    else if (si === 4) { r.cmp = true; r.txt = "aldehyde versus ketone"; r.lobes = true; }
    else if (si === 5) { r.tri = true; r.txt = "carbonyl → hemiacetal → acetal"; }
    else { var lg = LG[S.lg]; if (p < 0.3) { r.main = 'ar'; r.nu = V(0.3, 1, 0).normalize().multiplyScalar((4.4 - 1.9 * sm(p / 0.3)) * GS); r.txt = "H₂O attacks the " + lg.n; } else if (p < 0.62) { r.main = 'at'; r.txt = "tetrahedral intermediate"; } else { r.main = 'ap'; var e2 = sm((p - 0.62) / 0.38); r.lg = V(1.6, -0.6, 0).add(V(3.4, -1.0, 0).multiplyScalar(e2)); r.txt = "expels " + lg.t + " → carboxylic acid"; r.arr[0] = e2 < 0.5 ? { a: V(-1.3, 0.3, 0), b: V(-0.5, 0.0, 0), bl: new THREE.Vector3(0, 0.6, 0) } : null; } }
    return r;
  }
  var def = {
    key: 'carbonilo', title: "Nucleophilic addition to the carbonyl", subtitle: "3D simulator · organic chemistry", accent: { dark: '#fb7185', light: '#be123c' }, stages: stages, nStages: 7, dur: 10, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [3, 5, 12], target: [0, 0.5, 0] }, { id: 'frontal', label: "Front", pos: [0, 1.5, 14], target: [0, 0.5, 0] }, { id: 'sup', label: "Top", pos: [0, 15, 3], target: [0, 0, 0] }, { id: 'lado', label: "Side", pos: [14, 2, 0], target: [0, 0.5, 0] }],
    layers: [{ id: 'orb', label: "π* orbitals", icon: '☁' }, { id: 'arrows', label: "Curved arrows", icon: '↷' }, { id: 'chg', label: "Partial charges", icon: 'δ' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; G.g = {}; G.nu = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: 0xff4d4d, roughness: 0.35 })); G.hp = new T.Mesh(new T.SphereGeometry(0.36, 16, 12), new T.MeshStandardMaterial({ color: 0xffffff })); G.lgm = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: 0x3ddc5a, roughness: 0.35 }));
      G.pathM = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 6), new T.MeshBasicMaterial({ color: 0x555d6b, transparent: true, opacity: 0.6 })); G.dp = new T.Mesh(new T.ConeGeometry(0.2, 0.55, 12), new T.MeshBasicMaterial({ color: 0xffd43b })); G.dpl = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshBasicMaterial({ color: 0xffd43b }));
      [G.nu, G.hp, G.lgm, G.pathM, G.dp, G.dpl].forEach(function (m) { m.visible = false; s.add(m); });
      var lm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.34, depthWrite: false }); G.lobes = []; for (var i = 0; i < 8; i++) { var l = new T.Mesh(new T.SphereGeometry(1, 18, 12), lm); l.visible = false; s.add(l); G.lobes.push(l); }
      var dm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.34, depthWrite: false }), dr = new T.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.34, depthWrite: false }); G.dC = new T.Mesh(new T.SphereGeometry(0.9, 20, 14), dm); G.dO = new T.Mesh(new T.SphereGeometry(0.9, 20, 14), dr); G.dC.visible = G.dO.visible = false; s.add(G.dC); s.add(G.dO);
      G.arcs = new T.Mesh(new T.TorusGeometry(1, 0.025, 6, 30, 1.87), new T.MeshBasicMaterial({ color: 0xffd43b })); G.arcs.visible = false; s.add(G.arcs);
      for (i = 0; i < 2; i++) { var ar = { group: new T.Group(), mat: new T.MeshBasicMaterial({ color: 0xff7a3d }), mesh: null, head: new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), new T.MeshBasicMaterial({ color: 0xff7a3d })) }; ar.group.add(ar.head); s.add(ar.group); ar.group.visible = false; arrows.push(ar); }
      labs.t = ctx.label('', 'bl-lead'); labs.a = ctx.label('', 'bl-d'); labs.b = ctx.label('', 'bl-warn'); labs.c = ctx.label('', 'bl-d'); labs.d = ctx.label('', 'bl-d'); labs.e = ctx.label('', 'bl-d'); labs.f = ctx.label('', 'bl-lead');
    },
    frame: function (ctx, f, dt) {
      var T = ctx.T, now = (G.now = (G.now || 0) + dt), si, pp;
      if (!ctx.P.manual) { si = f.i; pp = f.local; if (S._st !== si) { S._st = si; S.mode = si === 6 ? 'acyl' : 'add'; if (si < 6) { S.cb = si === 4 ? S.cb : 'etanal'; S.nu = si === 3 ? 'H2O' : 'H2O'; } if (si === 3) { S.nu = 'CN'; } if (si < 3) S.nu = 'H2O'; } }
      else { if (S.mode === 'add') { var q = Math.min(0.9999, S.prog) * 3; si = 1 + Math.floor(q); pp = q - Math.floor(q); if (S.prog >= 1) { si = 3; pp = 1; } if (S.prog <= 0) { si = 0; pp = 0; } } else { si = 6; pp = S.prog; } if (S.cmpOn) si = 4; }
      G.si = si; hideAll(); var orb = ctx.layer('orb'), aro = ctx.layer('arrows'), chg = ctx.layer('chg');
      [G.nu, G.hp, G.lgm, G.pathM, G.dp, G.dpl, G.dC, G.dO, G.arcs].forEach(function (m) { m.visible = false; }); G.lobes.forEach(function (l) { l.visible = false; }); Object.keys(labs).forEach(function (k) { labs[k].vis(false); }); arrows.forEach(function (a) { a.group.visible = false; });
      var st = state(si, pp, now), nuI = NU[S.nu];
      function lobe(i, x, y, z, sx, sy, sz) { var l = G.lobes[i]; l.visible = orb; l.position.set(x, y, z); l.scale.set(sx, sy, sz); }
      if (st.cmp) {
        var save = S.cb; S.cb = 'etanal'; var ga = grp(ctx, 'r'); ga.visible = true; ga.position.x = -4; S.cb = 'prop'; var gb = grp(ctx, 'r'); gb.visible = true; gb.position.x = 4; S.cb = save;
        lobe(0, -4 + 0, 0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(1, -4, -0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(2, 4, 0.8 * GS, 0, 0.55 * GS, 0.5 * GS, 0.5 * GS); lobe(3, 4, -0.8 * GS, 0, 0.55 * GS, 0.5 * GS, 0.5 * GS);
        labs.t.pos(-4, 4.1, 0).set("ethanal · greater δ+ · K(hydr.) ≈ 1", 'bl-lead').vis(true); labs.a.pos(4, 4.1, 0).set("propanone · smaller δ+ · K ≈ 0.0014", 'bl-warn').vis(true); labs.b.pos(-4, -3.4, 0).set("1 R group · less hindrance", 'bl-d').vis(true); labs.c.pos(4, -3.4, 0).set("2 R groups · more hindrance", 'bl-d').vis(true);
      } else if (st.tri) {
        var s1 = S.cb; var g1 = grp(ctx, 'r'); g1.visible = true; g1.position.x = -6; var g2 = grp(ctx, 'hem'); g2.visible = true; g2.position.x = 0; var g3 = grp(ctx, 'ace'); g3.visible = true; g3.position.x = 6;
        labs.t.pos(-6, 3.8, 0).set('carbonilo', 'bl-lead').vis(true); labs.a.pos(0, 3.8, 0).set('hemiacetal', 'bl-warn').vis(true); labs.b.pos(6, 3.8, 0).set("acetal (stable in base)", 'bl-lead').vis(true); labs.c.pos(-3, 0.3, 0).set('+ CH₃OH  →', 'bl-d').vis(true); labs.d.pos(3, 0.3, 0).set('+ CH₃OH, H⁺  (−H₂O) →', 'bl-d').vis(true);
      } else {
        var g = grp(ctx, st.main); g.visible = true; var kinds = { r: 'carbonilo', t: "tetrahedral intermediate", p: nuI.tn, ar: LG[S.lg].ex, at: "tetrahedral intermediate", ap: "ethanoic acid" };
        labs.t.pos(0, 3.9, 0).set(S.mode === 'acyl' || si === 6 ? kinds[st.main] : kinds[st.main] + ' · ' + CB[S.cb].n, 'bl-lead').vis(true); labs.f.pos(0, -3.4, 0).set(st.txt, 'bl-d').vis(true);
        if (st.lobes && (st.main === 'r')) { lobe(0, 0, 0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(1, 0, -0.95 * GS, 0, 0.8 * GS, 0.7 * GS, 0.7 * GS); lobe(2, -1.25 * GS, 0.6 * GS, 0, 0.4 * GS, 0.4 * GS, 0.4 * GS); lobe(3, -1.25 * GS, -0.6 * GS, 0, 0.4 * GS, 0.4 * GS, 0.4 * GS); }
        if (st.dip && chg) { G.dC.visible = G.dO.visible = true; G.dC.position.set(0, 0, 0); G.dO.position.set(-1.22 * GS, 0, 0); labs.a.pos(0.2, 1.7, 0).set('C δ+', 'bl-lead').vis(true); labs.b.pos(-1.7, 1.5, 0).set('O δ−', 'bl-warn').vis(true); G.dpl.visible = G.dp.visible = true; bondTo(T, G.dpl, V(0.9, 1.9, 0), V(-1.2, 1.9, 0)); G.dp.position.set(-1.3 * GS, 1.9 * GS, 0); G.dp.rotation.set(0, 0, Math.PI / 2); G.dpl.position.y = 1.9 * GS; labs.c.pos(-0.1, -1.7, 0).set("120° · planar sp²", 'bl-d').vis(true); }
        if (st.nu) { G.nu.visible = true; G.nu.position.copy(st.nu); var nr = S.mode === 'acyl' || si === 6 ? 0.7 : nuI.r; G.nu.scale.setScalar(nr); G.nu.material.color.setHex(si === 6 ? 0xff4d4d : nuI.col); labs.d.pos(st.nu.x, st.nu.y + 1.1, st.nu.z).set(si === 6 ? 'H₂O' : nuI.t, 'bl-warn').vis(true); }
        if (st.path) { G.pathM.visible = true; var A = new T.Vector3(0, 0, 0), B = BD.clone().multiplyScalar(4.6 * GS); bondTo(T, G.pathM, A, B); }
        if (st.angle) { G.arcs.visible = true; G.arcs.scale.setScalar(1.7 * GS); G.arcs.position.set(0, 0, 0); G.arcs.rotation.set(0, 0, 0); G.arcs.rotation.z = Math.atan2(BD.y, BD.x); G.arcs.rotation.z = Math.PI + 0; var ang0 = Math.PI; G.arcs.rotation.z = ang0 - 1.87; labs.e.pos(-0.7 * GS, 1.9 * GS, 0).set('107°', 'bl-lead').vis(true); }
        if (st.hp) { G.hp.visible = true; G.hp.position.copy(st.hp); labs.e.pos(st.hp.x, st.hp.y + 0.9, st.hp.z).set('H⁺', 'bl-warn').vis(true); }
        if (st.lg) { G.lgm.visible = true; G.lgm.position.copy(st.lg); G.lgm.scale.setScalar(LG[S.lg].r); G.lgm.material.color.setHex(LG[S.lg].col); labs.e.pos(st.lg.x, st.lg.y + 1.1, st.lg.z).set(LG[S.lg].t, 'bl-warn').vis(true); }
        st.arr.forEach(function (a, j) { if (a) setArrow(T, arrows[j], a.a, a.b, a.bl, aro); });
      }
    },
    sync: function () { }, 
    hud: function () { if (S.mode === 'acyl') { var l = LG[S.lg]; return { eq: { chip: "Acyl", name: l.n + ' + H₂O', body: "<div class=\"eqline\"><small>Leaving group</small>" + l.t + "</div><div class=\"eqline\"><small>pKa of HL</small>" + l.pka + "</div><div class=\"eqline\"><small>Product</small>carboxylic acid</div>" }, legend: [{ label: 'Nu', color: '#ff4d4d', text: "nucleophile" }, { label: 'L⁻', color: '#3ddc5a', text: "leaving group" }] }; }
      var c = CB[S.cb], n = NU[S.nu]; return { eq: { chip: 'C=O', name: c.n + ' + ' + n.n, body: "<div class=\"eqline\"><small>Mechanism</small>" + n.how + "</div><div class=\"eqline\"><small>Product</small>" + n.pn[S.cb] + ' (' + n.tn + ")</div><div class=\"eqline\"><small>Hydration K</small>" + MSim.sci(c.K, 2) + '</div>' }, legend: [{ label: 'π*', color: '#4dabf7', text: "LUMO of the carbonyl" }, { label: 'δ+', color: '#4dabf7', text: "electrophilic C" }, { label: 'δ−', color: '#ff4d4d', text: "nucleophilic/basic O" }, { label: "Arrow", color: '#ff7a3d', text: "electron pair" }] }; },
    measures: function () { if (S.mode === 'acyl') { var l = LG[S.lg]; return [["Derivative", l.n + ' (' + l.ex + ')'], ["Leaving group", l.t], ["pKa of the conjugate acid HL", String(l.pka)], ["Reactivity", ["very high", 'alta', "moderate", "low"][['Cl', 'An', 'Es', 'Am'].indexOf(S.lg)]], ["Mechanism", "addition–elimination"]]; }
      var c = CB[S.cb], n = NU[S.nu]; return [["Carbonyl", c.n], ["Nucleophile", n.n], ["Reaction", n.how], ["Product", n.pn[S.cb]], ["Hydration K", MSim.sci(c.K, 2)], ["% hydrated (in water)", fmt(100 * c.K / (1 + c.K), 2) + ' %'], ["Angle of attack", '≈ 107° (Bürgi–Dunitz)']]; },
    ideas: ["C=O: electrophilic <b>C δ+</b>; basic O δ−; planar sp².", "<b>Bürgi–Dunitz</b>: attack at ≈ 107° to the C=O.", "Addition: <b>sp² → sp³</b>; tetrahedral intermediate (alkoxide).", "<b>Aldehyde &gt; ketone</b> (electronic + steric).", "Acid derivatives: addition–elimination; reactivity ↔ leaving group."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Nucleophilic addition to C=O"); el.appendChild(c);
      ui.cb = kit.ui.options({ label: "Carbonyl", cols: 4, value: S.cb, options: Object.keys(CB).map(function (k) { return { v: k, label: CB[k].n }; }), onChange: function (v) { ctx.goManual(); S.cb = v; S.mode = 'add'; S.prog = 0; ui.prog.set(0); S.cmpOn = false; } }); c.appendChild(ui.cb);
      ui.nu = kit.ui.options({ label: "Nucleophile", cols: 5, value: S.nu, options: Object.keys(NU).map(function (k) { return { v: k, label: NU[k].t, sub: NU[k].tn.split(' ')[0] }; }), onChange: function (v) { ctx.goManual(); S.nu = v; S.mode = 'add'; S.prog = 0; ui.prog.set(0); S.cmpOn = false; } }); c.appendChild(ui.nu);
      ui.prog = kit.ui.slider({ label: "Reaction progress", min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.prog = v / 100; S.cmpOn = false; } }); c.appendChild(kit.ui.sliders([ui.prog]));
      c.appendChild(ctx.btnRow([{ t: "Animate", primary: true, fn: function () { ctx.goManual(); S.anim = true; S.prog = 0; S.cmpOn = false; } }, { t: "Aldehyde vs ketone", fn: function () { ctx.goManual(); S.cmpOn = !S.cmpOn; } }, { t: "Back to the lesson", fn: function () { S.cmpOn = false; ctx.toLesson(); } }]));
      var c2 = kit.ui.card("Acid derivatives (acyl substitution)"); el.appendChild(c2);
      ui.lg = kit.ui.options({ label: "Derivative + H₂O", cols: 4, value: S.lg, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n.split(' ')[0], sub: 'pKa(HL) ' + LG[k].pka }; }), onChange: function (v) { ctx.goManual(); S.lg = v; S.mode = 'acyl'; S.prog = 0; S.anim = true; S.cmpOn = false; } }); c2.appendChild(ui.lg);
      var _f = def.frame; def.frame = function (cx2, f, dt) { if (S.anim && cx2.P.manual) { S.prog = Math.min(1, S.prog + dt / 9); ui.prog.set(S.prog * 100); if (S.prog >= 1) S.anim = false; } _f(cx2, f, dt); };
    },
    graphs: [
      { title: "Energy profile of the addition", h: 230, note: "Aldehyde (blue) versus ketone (pink): lower barriers and a more stable product for the aldehyde. Qualitative sketch.", draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 14, B = 26, pw = w - L - Rr, ph = h - Tp - B, cv = [{ p: [0, 55, 20, 42, 5], col: '#4dabf7', lab: "aldehyde" }, { p: [0, 72, 42, 62, 28], col: '#f06595', lab: "ketone" }], mx = 85, mn = -5, sx = function (x) { return L + pw * x; }, sy = function (v) { return Tp + ph - ph * (v - mn) / (mx - mn); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var v = mn + (mx - mn) * i / 4, y = sy(v); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(v, 0), L - 4, y + 3); } cx.textAlign = 'center'; cx.fillText("reaction coordinate  ·  y axis: E (kJ/mol)", L + pw / 2, h - 3);
        cv.forEach(function (k, n) { cx.strokeStyle = k.col; cx.lineWidth = 2.6; cx.beginPath(); for (var j = 0; j <= 120; j++) { var x = j / 120, t = x * 4, ii = Math.min(3, Math.floor(t)), u = t - ii, s = u * u * (3 - 2 * u), y = sy(k.p[ii] + (k.p[ii + 1] - k.p[ii]) * s); if (j === 0) cx.moveTo(sx(x), y); else cx.lineTo(sx(x), y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = k.col; cx.textAlign = 'left'; cx.fillText(k.lab, L + 8, Tp + 12 + n * 14); }); } },
      { title: "Hydration constant K = [hydrate]/[C=O]", h: 190, note: "log₁₀ K (water, 25 °C): formaldehyde 3.4 · ethanal 0.0 · propanone −2.9 · acetophenone ≈ −5 (estimated).", draw: function (cx, w, h, c) {
        var ks = ['form', 'etanal', 'prop', 'acf'], ph = (h - 24) / 4, L = 108, sc = (w - L - 30) / 10, x0 = L + 6 * sc; cx.font = '11px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, 4); cx.lineTo(x0, h - 20); cx.stroke();
        ks.forEach(function (k, i) { var v = Math.log10(CB[k].K), y = 6 + i * ph; cx.fillStyle = k === S.cb ? '#fb7185' : '#9aa7b4'; cx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc) + 1, ph - 7); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(CB[k].n, L - 6, y + ph / 2 + 1); cx.textAlign = v < 0 ? 'left' : 'right'; cx.fillText(fmt(v, 1), v < 0 ? x0 + 4 : x0 - 4, y + ph / 2 + 1); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText('log₁₀ K', w / 2, h - 5); } },
      { title: "Acid derivatives: leaving-group ability", h: 190, note: "pKa of the conjugate acid HL (lower = better leaving group = more reactive derivative).", draw: function (cx, w, h, c) {
        var ks = ['Cl', 'An', 'Es', 'Am'], ph = (h - 24) / 4, L = 120, sc = (w - L - 40) / 50, x0 = L + 8 * sc; cx.font = '11px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, 4); cx.lineTo(x0, h - 20); cx.stroke();
        ks.forEach(function (k, i) { var v = LG[k].pka, y = 6 + i * ph; cx.fillStyle = k === S.lg ? '#fb7185' : '#9aa7b4'; cx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc) + 1, ph - 7); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(LG[k].n, L - 6, y + ph / 2 + 1); cx.textAlign = v < 0 ? 'right' : 'left'; cx.fillText(v, v < 0 ? x0 + v * sc - 4 : x0 + v * sc + 4, y + ph / 2 + 1); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText('pKa (HL)', w / 2, h - 5); } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (S.mode === 'acyl') { var l = LG[S.lg]; return "<div class=\"calc-step\">Hydrolysis of " + l.ex + '</div><table class="calc-table">' + row("Step 1", "H₂O attacks C=O → tetrahedral intermediate") + row("Step 2", "expels " + l.t + " and C=O is regenerated") + row("pKa of HL", '<b>' + l.pka + '</b>') + row("Product", "ethanoic acid + HL") + "</table><p class=\"muted small\">The lower the pKa of HL, the better the leaving group and the faster the acyl substitution.</p>"; }
      var c = CB[S.cb], n = NU[S.nu], pct = 100 * c.K / (1 + c.K); return "<div class=\"calc-step\">1 · Reaction</div><table class=\"calc-table\">" + row("Carbonyl", c.n) + row("Nucleophile", n.n) + row("Type", n.how) + row("Product", '<b>' + n.pn[S.cb] + '</b> (' + n.tn + ')') + "</table><div class=\"calc-step\">2 · Hydration equilibrium</div><table class=\"calc-table\">" + row("K = [hydrate]/[C=O]", MSim.sci(c.K, 2)) + row("% hydrated", '<b>' + fmt(pct, 3) + ' %</b>') + row('ΔG° = −RT ln K (298 K)', fmt(-R * 298 * Math.log(c.K) / 1000, 1) + ' kJ/mol') + '</table>';
    },
    quiz: [
      { q: "Which atom of the carbonyl group is electrophilic?", options: ["The carbon", "The oxygen", "Both equally", "Neither"], answer: 0, why: "The O pulls electrons; the C becomes δ+ and is attacked by nucleophiles." },
      { q: "After the addition of a nucleophile, the carbonyl carbon goes from…", options: ["planar sp² to tetrahedral sp³", "sp³ to sp²", "sp to sp²", "does not change"], answer: 0, why: "The π bond breaks: the tetrahedral intermediate forms." },
      { q: "The Bürgi–Dunitz angle is approximately…", options: ['107°', '90°', '120°', '180°'], answer: 0, why: "The nucleophile approaches at ≈ 107° to the C=O bond." },
      { q: "Why are aldehydes more reactive than ketones?", options: ["Less hindrance and greater δ+ on C", "They have OH", "They are more acidic", "They have more O"], answer: 0, why: "A single R group: less electron donation and less hindrance." },
      { q: "The reduction of propanone with NaBH₄ gives…", options: ['propan-2-ol', 'propan-1-ol', 'propanal', "propane"], answer: 0, why: "H⁻ adds to the C=O; after protonation: secondary alcohol." },
      { q: "CH₃MgBr + propanone (then H₃O⁺) gives…", options: ['2-metilpropan-2-ol', 'propan-2-ol', 'butan-2-ol', '2-metilpropanal'], answer: 0, why: "CH₃⁻ forms a C–C bond: tertiary alcohol (tert-butanol)." },
      { q: "The cyanohydrin of ethanal is…", options: ['2-hidroxipropanonitrilo', "propanenitrile", "ethanol", '2-cianoetanol'], answer: 0, why: "CN⁻ adds to the C=O and the O⁻ is protonated: CH₃CH(OH)CN." },
      { q: "The acid derivative most reactive toward nucleophiles is…", options: ["acyl chloride", 'amida', "ester", "carboxylic acid"], answer: 0, why: "Cl⁻ is the best leaving group (pKa of HCl ≈ −7)." }
    ],
    help: { intro: "Follow the lesson or choose the carbonyl and nucleophile in “Lab” and move the reaction progress; the lower card lets you try acyl substitution.", items: [["Blue lobes", "π* orbital (LUMO) of the carbonyl."], ["Arrows", "movement of electron pairs."], ["Charges", "δ+ on C and δ− on O."], ["Graphs", "energy profile, hydration K and leaving groups."]] }
  };
  MSim.create(def);
})();
