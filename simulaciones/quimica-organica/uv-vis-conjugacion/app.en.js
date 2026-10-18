/* Espectroscopía UV-Vis y conjugación — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, HC = 1239.84;
  var LAM = [165, 217, 258, 290, 334, 364, 390, 410, 425, 440, 452], NAME = ["Ethene", '1,3-Butadieno', '1,3,5-Hexatrieno', '1,3,5,7-Octatetraeno', 'Decapentaeno', 'Dodecahexaeno', 'Tetradecaheptaeno', 'Hexadecaoctaeno', 'Octadecanonaeno', 'Eicosadecaeno', "β-Carotene (11 C=C)"];
  var S = { n: 2, alk: 0, c: 0.00002, l: 1 }, g = null, gm = null, lev = [], ph = null, lab = [], beaker = null, liq = null, key = 0;
  function lam() { return LAM[S.n - 1] + 5 * S.alk; }
  function eps() { return 8000 + 14000 * (S.n - 1) / 1.0 * 0.8 + 4000; }
  function gap() { return HC / lam(); }
  function absorb(x) { var w = 14 + 3 * S.n, L = lam(); return Math.exp(-Math.pow((x - L) / w, 2) / 2); }
  function A() { return eps() * S.c * S.l; }
  function compl() { var L = lam(); if (L < 400) return null; var tab = [[400, 435, '#ffe066'], [435, 480, '#ffa94d'], [480, 500, '#ff6b6b'], [500, 560, '#f06595'], [560, 580, '#7950f2'], [580, 595, '#4dabf7'], [595, 650, '#38d9a9'], [650, 800, '#74c0fc']], i; for (i = 0; i < tab.length; i++) if (L >= tab[i][0] && L < tab[i][1]) return tab[i][2]; return '#ffe066'; }
  function smiles() { var k = Math.min(S.n, 4), s = 'C'; for (var i = 0; i < k; i++) s += (i ? '=C' : '=C') + (i < k - 1 ? 'C' : ''); return k === 1 ? 'C=C' : 'C=CC=C' + (k > 2 ? 'C=C' : '') + (k > 3 ? 'C=C' : ''); }
  function stages() {
    return [
      ["π → π* transition", "Transition", "A photon promotes an electron from the HOMO (π) to the LUMO (π*)",
        "<p><b>UV-Vis</b> spectroscopy measures the absorption of light that promotes electrons from an occupied orbital to an empty one. In an alkene, the transition is <b>π → π*</b>: the electron goes from the <b>HOMO</b> to the <b>LUMO</b>. The photon energy must match the gap: <b>E = hc/λ</b>. Ethene absorbs at ~165 nm (far UV).</p>"],
      ["Conjugation and gap", "Conjugation", "The more conjugated double bonds, the smaller the gap and the larger the λmax",
        "<p>When double bonds are <b>conjugated</b>, the π orbitals delocalize and move closer together: the <b>HOMO–LUMO gap decreases</b> and absorption shifts to a <b>longer wavelength</b> (<b>bathochromic</b> effect). Increase the number of double bonds and watch λmax rise from 165 nm into the visible region.</p>"],
      ["Spectrum and color", "Spectrum and color", "The solution appears in the complementary color of the one absorbed",
        "<p>When λmax enters the <b>visible</b> range (400–700 nm) the substance looks <b>colored</b>, with the <b>complementary color</b> of the light it absorbs: <b>β-carotene</b> absorbs blue (~450 nm) and looks orange. Below 400 nm the substance is colorless even though it absorbs UV.</p>"],
      ["Substituents", "Substituents", "Each alkyl group on the chromophore contributes ~+5 nm (Woodward rules)",
        "<p>Each <b>alkyl substituent</b> attached to the sp² carbons shifts λmax by about <b>+5 nm</b>, according to the <b>Woodward–Fieser rules</b>. Add substituents and compare. Groups with lone pairs (auxochromes such as –OR, –NR₂) produce even larger shifts.</p>"],
      ["Beer–Lambert law", "Beer–Lambert", 'A = ε · c · l',
        "<p><b>Absorbance</b> follows the <b>Beer–Lambert law</b>: <b>A = ε·c·l</b>, where ε is the molar absorption coefficient (it increases with conjugation), c the concentration and l the path length. An A between 0.1 and 1 is the useful range for measurement.</p>"]
    ];
  }
  var def = {
    key: 'uv-vis-conjugacion', title: "UV-Vis spectroscopy and conjugation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [14, 4, 22], target: [14, 1, 0] }, { id: 'frontal', label: "Front", pos: [14, 1, 26], target: [14, 1, 0] }],
    layers: [{ id: 'sol', label: "Solution", icon: '▭' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gm = new T.Group(); gm.position.set(15, 9.5, 0); g.add(gm);
      var i; for (i = 0; i < 2; i++) { var b = new T.Mesh(new T.BoxGeometry(5, 0.25, 1.6), new T.MeshStandardMaterial({ color: i ? 0x4dabf7 : 0xff6b6b })); g.add(b); lev.push(b); }
      ph = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1, 8), new T.MeshStandardMaterial({ color: 0xb197fc, emissive: 0x6741d9 })); g.add(ph);
      beaker = new T.Mesh(new T.CylinderGeometry(2, 2, 5, 24, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); beaker.position.set(29, 2.5, 0); g.add(beaker);
      liq = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 3.6, 24), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); liq.position.set(29, 1.9, 0); g.add(liq);
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.n = 1; S.alk = 0; } if (i === 1) { S.n = 1 + Math.round(10 * f.local); S.alk = 0; } if (i === 2) { S.n = 11; S.alk = 0; S.c = 0.00002; } if (i === 3) { S.n = 2; S.alk = Math.round(4 * f.local); } if (i === 4) { S.n = 5; S.alk = 0; S.c = 0.000005 + 0.00004 * f.local; } }
      var k = Math.min(S.n, 3) * 10 + S.alk * 0; if (key !== Math.min(S.n, 4)) { key = Math.min(S.n, 4); while (gm.children.length) gm.remove(gm.children[0]); gm.add(ctx.mol(MSim.build(smiles()), { gs: 1.1, ar: 0.55 })); gm.rotation.z = 0; }
      gm.rotation.y += 0.004; var L = lam(), gp = gap(), y0 = 0, hy = 1.5 - gp * 0.55 * 0 + 0, gH = Math.max(0.6, Math.min(5, gp * 0.9));
      lev[0].position.set(15, 1.5, 0); lev[1].position.set(15, 1.5 + gH, 0); lev[1].scale.x = lev[0].scale.x = 1;
      ph.position.set(17.5, 1.5 + gH / 2, 0); ph.scale.y = gH; var vis = L >= 400 && L <= 700; ph.material.color.set(vis ? new T.Color().setHSL(Math.max(0, Math.min(0.75, (700 - L) / 300 * 0.75)), 1, 0.55) : new T.Color(0x9775fa)); ph.material.emissive.copy(ph.material.color).multiplyScalar(0.4);
      var cc = compl(); liq.visible = ctx.layer('sol'); beaker.visible = ctx.layer('sol'); liq.material.color.set(cc || '#f8f9fa'); liq.material.opacity = cc ? Math.min(0.9, 0.15 + A() * 0.8) : 0.25;
      lab[0].pos(15, 12.6, 0).set(NAME[S.n - 1] + (S.alk ? ' + ' + S.alk + " alkyl group(s)" : ''), 'bl-lead').vis(true);
      lab[1].pos(11.2, 1.5, 0).set("HOMO (π)", 'bl-d').vis(true); lab[2].pos(11.2, 1.5 + gH, 0).set("LUMO (π*)", 'bl-d').vis(true);
      lab[3].pos(21, 1.5 + gH / 2, 0).set('ΔE = ' + fmt(gp, 2) + " eV · λmax = " + fmt(L, 0) + ' nm', 'bl-pos').vis(true);
      lab[4].pos(29, 6, 0).set(cc ? "looks " + (cc ? 'coloreada' : '') : "colorless (UV)", 'bl-d').vis(ctx.layer('sol'));
    },
    sync: function (ctx) { var u = ctx.ui; ['n', 'alk', 'c', 'l'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'λ', name: "Absorption", body: "<div class=\"eqline\"><small>λmax</small>" + fmt(lam(), 0) + " nm</div><div class=\"eqline\"><small>ΔE (HOMO–LUMO)</small>" + fmt(gap(), 2) + " eV</div><div class=\"eqline\"><small>ε approx.</small>" + fmt(eps(), 0) + " L/mol·cm</div><div class=\"eqline\"><small>Absorbance</small>" + fmt(A(), 3) + '</div>' }, legend: [{ label: "Red bar", color: '#ff6b6b', text: 'HOMO' }, { label: "Blue bar", color: '#4dabf7', text: 'LUMO' }, { label: "Arrow", color: '#b197fc', text: "absorbed photon" }] }; },
    measures: function () { return [["Compound", NAME[S.n - 1]], ["Conjugated double bonds", String(S.n)], ['λmax', fmt(lam(), 0) + ' nm'], ['ΔE', fmt(gap(), 2) + ' eV'], ["Region", lam() < 400 ? "ultraviolet" : 'visible'], ["A (Beer–Lambert)", fmt(A(), 3)]]; },
    ideas: ["More conjugation → smaller gap → larger λmax.", "E = hc/λ.", "Each alkyl ≈ +5 nm.", 'A = ε·c·l.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Chromophore and sample"); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('n', "Conjugated double bonds", 1, 11, 1, function (v) { return String(v); }), sl('alk', "Alkyl substituents", 0, 4, 1, function (v) { return String(v); }), sl('c', "Concentration", 0.000001, 0.0001, 0.000001, function (v) { return fmt(v * 1e6, 0) + ' µM'; }), sl('l', "Path length", 0.1, 2, 0.1, function (v) { return fmt(v, 1) + ' cm'; })])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Absorption spectrum", h: 210, note: "Relative absorbance versus λ (nm). The band shifts with conjugation.", draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph2 = h - Tp - B, i, x0 = 150, x1 = 600; cx.beginPath(); cx.strokeStyle = '#b197fc'; cx.lineWidth = 2;
      for (i = 0; i <= 150; i++) { var xx = x0 + (x1 - x0) * i / 150, a = absorb(xx), px = L + pw * i / 150, py = Tp + ph2 * (1 - a); i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.stroke(); cx.lineWidth = 1;
      var vx0 = L + pw * (400 - x0) / (x1 - x0); cx.fillStyle = 'rgba(255,200,100,.18)'; cx.fillRect(vx0, Tp, L + pw - vx0, ph2); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('150', L, h - 8); cx.fillText("400 (visible →)", vx0 + 20, h - 8); cx.fillText("600 nm", L + pw, h - 8);
    } }, { title: "λmax according to conjugation", h: 190, note: "Approximate experimental values (7–10 interpolated).", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 24, pw = w - L - R, ph2 = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); LAM.forEach(function (v, k) { var x = L + pw * k / 10, y = Tp + ph2 * (1 - (v - 150) / 330); k ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.n - 1) / 10, Tp + ph2 * (1 - (lam() - 150) / 330), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('n = 1', L, h - 8); cx.fillText('n = 11', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('nm', L - 4, Tp + 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + NAME[S.n - 1] + '</div><table class="calc-table">' + row('λmax', fmt(LAM[S.n - 1], 0) + ' + 5 × ' + S.alk + ' = <b>' + fmt(lam(), 0) + ' nm</b>') + row("ΔE = hc/λ", '1239,84 / ' + fmt(lam(), 0) + ' = <b>' + fmt(gap(), 2) + ' eV</b>') + row('A = ε·c·l', fmt(eps(), 0) + ' × ' + fmt(S.c * 1e6, 0) + '×10⁻⁶ × ' + fmt(S.l, 1) + ' = <b>' + fmt(A(), 3) + '</b>') + row('Transmitancia', fmt(Math.pow(10, -A()) * 100, 1) + ' %') + row("Color of the solution", compl() ? 'coloreada' : "colorless (absorbs in the UV)") + '</table>'; },
    quiz: [
      { q: "As conjugation increases, λmax…", options: ["increases", "decreases", "does not change", "drops to zero"], answer: 0, why: "The HOMO–LUMO gap decreases." },
      { q: "The characteristic UV transition of alkenes is…", options: ['π → π*', 'n → σ*', 'σ → σ*', 'd → d'], answer: 0, why: "From the π HOMO to the π* LUMO." },
      { q: "A substance that absorbs blue light (~450 nm) looks…", options: ["orange", "blue", "colorless", "green"], answer: 0, why: "Complementary color." },
      { q: "Each alkyl substituent shifts λmax by about…", options: ['+5 nm', '+50 nm', "−5 nm", '+0,5 nm'], answer: 0, why: "Woodward–Fieser rule." },
      { q: "If the concentration is doubled, the absorbance…", options: ["doubles", "is halved", "does not change", "quadruples"], answer: 0, why: "A is proportional to c." },
      { q: "The photon energy is related to λ by…", options: ["E = hc/λ", 'E = hλ', 'E = c/λ²', "E = λ/hc"], answer: 0, why: "The smaller λ, the greater E." }
    ],
    help: { intro: "Increase the conjugated double bonds and observe how the gap between HOMO and LUMO decreases and how the color of the solution changes. “Graphs” shows the spectrum.", items: [["Bars", "HOMO (red) and LUMO (blue)."], ["Beaker", "complementary color of the absorbed light."]] }
  };
  MSim.create(def);
})();
