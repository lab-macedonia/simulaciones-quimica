/* Radiación electromagnética — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var C = 299792458, HC = 1.239841984e-6, NAEV = 96.48533, LOG_HI = 5, LOG_LO = -13, SPAN = 18, HALF = 11, N = 700, NV = 60, NS = 22, Q_X = -2;
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sci(x, d) { d = d == null ? 2 : d; if (x === 0) return '0'; var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10), m = x / Math.pow(10, e), s = m.toFixed(d); if (parseFloat(s) >= 10) { s = (m / 10).toFixed(d); e++; } return s.replace('.', '.') + ' × 10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  function sig3(v) { var s = Number(v.toPrecision(3)).toString(); if (s.indexOf('e') >= 0) s = v.toFixed(2); return s.replace('.', '.'); }
  function withUnit(v, tb, fb) { for (var i = 0; i < tb.length; i++) { if (v >= tb[i][0] * 0.9995) return sig3(v / tb[i][0]) + ' ' + tb[i][1]; } return sci(v) + ' ' + fb; }
  var LEN = [[1e3, 'km'], [1, 'm'], [1e-3, 'mm'], [1e-6, 'μm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']], FRQ = [[1e21, 'ZHz'], [1e18, 'EHz'], [1e15, 'PHz'], [1e12, 'THz'], [1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz'], [1, 'Hz']], PER = [[1, 's'], [1e-3, 'ms'], [1e-6, 'μs'], [1e-9, 'ns'], [1e-12, 'ps'], [1e-15, 'fs'], [1e-18, 'as'], [1e-21, 'zs']], ENG = [[1e6, 'MeV'], [1e3, 'keV'], [1, 'eV'], [1e-3, 'meV'], [1e-6, 'μeV']];
  function wl2rgb(w) { var r = 0, g = 0, b = 0; if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else if (w <= 750) { r = 1; } var f = 1; if (w < 420) f = 0.3 + 0.7 * (w - 380) / 40; else if (w > 700) f = 0.3 + 0.7 * (750 - w) / 50; var q = function (c) { return Math.round(255 * Math.pow(Math.max(0, c * f), 0.8)); }; return [q(r), q(g), q(b)]; }
  var L10 = function (x) { return Math.log(x) / Math.LN10; };
  var REG = [
    { id: 'radio', name: "Radium", full: "Radio waves", hi: 5, lo: 0, rep: 0.5, col: '#ef4444', rng: 'λ > 1 m', scale: "buildings and mountains", mat: "It moves the free electrons in conductors (currents in antennas). Its energy is much lower than k_BT: it neither excites nor breaks bonds. In NMR, from 60 to 900 MHz it flips nuclear spins inside an intense magnetic field.", use: "broadcasting, radar, Wi-Fi, NMR." },
    { id: 'micro', name: "Microwaves", full: "Microwaves", hi: 0, lo: -3, rep: -0.9136, col: '#f97316', rng: '1 mm – 1 m', scale: "everyday objects", mat: "It excites molecular rotations. In polar molecules such as H₂O the dipole tries to align with the oscillating field; friction between molecules heats (microwave oven, 2.45 GHz).", use: "ovens, telecommunications, rotational spectroscopy." },
    { id: 'ir', name: "Infrared", full: "Infrared", hi: -3, lo: L10(7.5e-7), rep: -5, col: '#f43f5e', rng: '750 nm – 1 mm', scale: "pinhead to cells", mat: "It excites bond vibrations (stretching and bending). Basis of IR spectroscopy (≈ 4000–400 cm⁻¹): O–H ≈ 3300 cm⁻¹, C=O ≈ 1700 cm⁻¹. It is perceived as heat.", use: "identifying functional groups, thermography, remote controls." },
    { id: 'vis', name: 'Visible', full: "Visible light", hi: L10(7.5e-7), lo: L10(3.8e-7), rep: L10(5.5e-7), col: '#22c55e', rng: '380 – 750 nm', scale: "bacteria and protozoa", mat: "It promotes valence electrons between orbitals (π→π*, d–d transitions). It gives rise to the color of compounds and the photochemistry of vision and photosynthesis.", use: "vision, UV-Vis, photosynthesis, optical fiber." },
    { id: 'uv', name: "Ultraviolet", full: "Ultraviolet", hi: L10(3.8e-7), lo: -8, rep: L10(2.54e-7), col: '#8b5cf6', rng: '10 – 380 nm', scale: "viruses and large molecules", mat: "Higher-energy electronic transitions. UV-C (< 280 nm) breaks bonds (DNA damage, photolysis of O₃) and, toward the extreme UV (< ≈ 124 nm, > 10 eV), it ionizes.", use: "sterilization, fluorescence, tanning, lithography." },
    { id: 'xr', name: "X-rays", full: "X-rays", hi: -8, lo: -11, rep: -10, col: '#0891b2', rng: '10 pm – 10 nm', scale: "atoms and molecules", mat: "It ionizes and removes inner electrons. Its λ (≈ 0.1 nm) is comparable to interatomic distances, which is why it is diffracted by crystals (crystallography). It passes through soft tissue.", use: "radiography, CT, crystallography, X-ray fluorescence." },
    { id: 'gm', name: "γ rays", full: "Gamma rays", hi: -11, lo: -13, rep: -12, col: '#64748b', rng: 'λ < 10 pm', scale: "smaller than an atom (nuclei ≈ fm)", mat: "They originate in nuclear transitions and annihilation. They penetrate deeply, ionize and, above 1.022 MeV, can produce e⁻/e⁺ pairs.", use: "radiotherapy, sterilization, nuclear medicine." }
  ];
  function regionOf(lg) { for (var i = 0; i < REG.length; i++) if (lg <= REG[i].hi && lg >= REG[i].lo) return REG[i]; return lg > 5 ? REG[0] : REG[6]; }
  var S = { lg: -6.2596, amp: 2.2, spd: 1, pol: 'lin', ang: 0, showE: true, showB: true, showS: false, showQ: false, packet: false, meas: true }, G = {}, labs = {}, ui = {};
  var K = 1, W = 1, VL = 5, VC = 3, tmp = [0, 0];
  function derive() { var lam = Math.pow(10, S.lg); VL = 0.4 + (S.lg - LOG_LO) / SPAN * 9; K = 2 * Math.PI / VL; VC = 3.2 * S.spd; W = K * VC; var f = C / lam, E = HC / lam; return { lam: lam, f: f, E: E, wn: 1 / (lam * 100), reg: regionOf(S.lg), emol: E * NAEV, kt: E / 0.025679, ion: E >= 10 }; }
  function field(x, out) {
    var ph = K * x - W * G.T, env = 1;
    if (S.packet) { var xc = ((VC * G.T) % (2 * HALF)) - HALF, wd = Math.min(5, Math.max(2.2, 1.7 * VL)), u = (x - xc) / wd; env = Math.exp(-u * u); }
    var A = S.amp * env;
    if (S.pol === 'lin') { var c = Math.cos(ph) * A, a = S.ang * Math.PI / 180; out[0] = c * Math.cos(a); out[1] = c * Math.sin(a); }
    else if (S.pol === 'cr') { out[0] = A * Math.cos(ph); out[1] = A * Math.sin(ph); }
    else { out[0] = A * Math.cos(ph); out[1] = -A * Math.sin(ph); }
  }
  function curve(T, scene, col) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array((N + 1) * 3), 3)); var l = new T.Line(g, new T.LineBasicMaterial({ color: col })); l.frustumCulled = false; scene.add(l); return l; }
  function ribbon(T, scene, col) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array((N + 1) * 6), 3)); var idx = []; for (var i = 0; i < N; i++) { var a = 2 * i, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); } g.setIndex(idx); var m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false })); m.frustumCulled = false; scene.add(m); return m; }
  function vecs(T, scene, col) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(NV * 6), 3)); var l = new T.LineSegments(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8 })); l.frustumCulled = false; scene.add(l); var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(new Float32Array(NV * 3), 3)); var p = new T.Points(pg, new T.PointsMaterial({ color: col, size: 0.34 })); p.frustumCulled = false; scene.add(p); return { l: l, p: p }; }
  function lessonSet(i, loc) {
    S.showE = S.showB = true; S.showS = false; S.showQ = false; S.packet = false; S.pol = 'lin'; S.ang = 0; S.meas = true; S.lg = -6.2596;
    if (i === 1) { S.packet = true; S.lg = -5.2 - 2.6 * loc; S.meas = false; }
    if (i === 2) { S.showQ = true; S.pol = loc < 0.33 ? 'lin' : (loc < 0.66 ? 'cr' : 'cl'); S.ang = loc < 0.33 ? 90 * loc / 0.33 : 0; S.meas = false; }
    if (i === 3) { S.lg = 2 - 14 * loc; S.showS = true; }
    if (i === 4) { var ids = ['micro', 'ir', 'vis', 'uv', 'xr'], r = REG.filter(function (x) { return x.id === ids[Math.min(4, Math.floor(loc * 5))]; })[0]; S.lg = r.rep; S.meas = false; }
  }
  var STG = function () { return [
    ["Electromagnetic wave", "Wave", "E ⟂ B ⟂ direction of propagation; c = λ·f", "<p>An electric field <b style=\"color:#e03168\">E</b> and a magnetic field <b style=\"color:#1c7ed6\">B</b> regenerate each other. They are <b>transverse</b>, <b>in phase</b> and travel at <b>c = 299,792,458 m/s</b> in a vacuum. The animation uses a compressed visual λ (logarithmic scale).</p>"],
    ["The photon", "Photon", 'E = h·f = h·c/λ', "<p>Energy comes in <b>quanta</b>. The smaller the λ, the greater the energy per photon: <b>E(eV) = 1239.84/λ(nm)</b>. The localized wave packet represents one photon; the total intensity depends on the <b>number</b> of photons, not on the energy of each.</p>"],
    ["Polarization", "Polarization", "Linear, right-handed circular and left-handed circular", "<p>In <b>linear</b> light E oscillates in a plane. In <b>circular</b> light the tip of E describes a helix; the sense is defined looking toward the source. <b>Chiral</b> molecules absorb left and right circular light differently (circular dichroism). The test charge shows that E accelerates it.</p>"],
    ["The spectrum", "Spectrum", "18 orders of magnitude in λ", "<p>The spectrum runs from <b>radio waves</b> (λ &gt; 1 m) to <b>γ rays</b> (λ &lt; 10 pm). Here it is traversed on a logarithmic scale: as λ decreases, f and E increase. The yellow arrows are the <b>Poynting vector S = E × B/μ₀</b>, which indicates the energy flow.</p>"],
    ["Radiation and matter", "Matter", "Each region excites a type of motion", "<p>Radio: nuclear spins (NMR). Microwaves: <b>rotations</b>. IR: <b>vibrations</b>. Visible and UV: <b>electronic transitions</b>. X-rays and γ: <b>ionization</b> and nuclear transitions. With ≳ 10 eV a photon can remove valence electrons (IE of H = 13.6 eV).</p>"]
  ]; };
  var def = {
    key: 'radiacion-em', title: "Electromagnetic Radiation", subtitle: "3D Simulator · spectrum", accent: { dark: '#38bdf8', light: '#0369a1' }, stages: STG, nStages: 5, dur: 12, offset: 0.12, zoom: 0.95,
    views: [{ id: 'libre', label: "Perspective", pos: [16, 10, 30], target: [0, 0, 0] }, { id: 'e', label: "E plane", pos: [0, 0.01, 30], target: [0, 0, 0] }, { id: 'b', label: "B plane", pos: [0.01, 30, 0.02], target: [0, 0, 0] }, { id: 'fr', label: "Front", pos: [30, 0.01, 0.01], target: [0, 0, 0] }],
    layers: [],
    build: function (ctx) {
      var T = ctx.T, sc = ctx.scene; G.T = 0;
      sc.add(new T.AmbientLight(0xffffff, 0.9)); var dl = new T.DirectionalLight(0xffffff, 0.5); dl.position.set(5, 10, 7); sc.add(dl);
      var grid = new T.GridHelper(2 * HALF + 4, 20, 0x8aa0c8, 0xc3cfe6); grid.position.y = -5.6; sc.add(grid);
      function arrow(d, len, col) { sc.add(new T.ArrowHelper(d, new T.Vector3(0, 0, 0), len, col, 0.9, 0.45)); }
      arrow(new T.Vector3(1, 0, 0), HALF + 1.5, 0xd9a400); arrow(new T.Vector3(0, 1, 0), 5.2, 0xe03168); arrow(new T.Vector3(0, 0, 1), 5.2, 0x1c7ed6);
      G.eC = curve(T, sc, 0xe03168); G.bC = curve(T, sc, 0x1c7ed6); G.eR = ribbon(T, sc, 0xe03168); G.bR = ribbon(T, sc, 0x1c7ed6); G.eV = vecs(T, sc, 0xe8588a); G.bV = vecs(T, sc, 0x4dabf7);
      G.sA = []; for (var j = 0; j < NS; j++) { var a = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(0, 0, 0), 1, 0xf59f00, 0.5, 0.3); a.visible = false; sc.add(a); G.sA.push(a); }
      G.q = new T.Mesh(new T.SphereGeometry(0.34, 20, 20), new T.MeshStandardMaterial({ color: 0xfab005, emissive: 0xb45309, emissiveIntensity: 0.5 })); sc.add(G.q);
      var qg = new T.BufferGeometry(); qg.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); G.qL = new T.Line(qg, new T.LineBasicMaterial({ color: 0xd9a400 })); sc.add(G.qL);
      var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(18), 3)); G.lam = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x343a40 })); G.lam.frustumCulled = false; sc.add(G.lam);
      labs.x = ctx.label("x · propagation (c)", 'bl-d').pos(HALF + 3.4, 0, 0); labs.y = ctx.label("y · E field", 'bl-d').pos(0, 6.2, 0); labs.z = ctx.label("z · B field", 'bl-d').pos(0, 0, 6.4); labs.lam = ctx.label('λ', 'bl-lead'); labs.q = ctx.label('q⁺', 'bl-d'); labs.t = ctx.label('', 'bl-lead').pos(0, 7.6, 0);
    },
    frame: function (ctx, f, dt) {
      dt = Math.min(dt, 0.05); if (!ctx.P.manual) lessonSet(f.i, f.local); G.T += dt; G.D = derive(); var T = ctx.T, i, k;
      var ep = G.eC.geometry.attributes.position.array, bp = G.bC.geometry.attributes.position.array, er = G.eR.geometry.attributes.position.array, br = G.bR.geometry.attributes.position.array;
      for (i = 0; i <= N; i++) { var x = -HALF + 2 * HALF * i / N; field(x, tmp); var ey = tmp[0], ez = tmp[1], by = -ez, bz = ey; k = i * 3; ep[k] = x; ep[k + 1] = ey; ep[k + 2] = ez; bp[k] = x; bp[k + 1] = by; bp[k + 2] = bz; k = i * 6; er[k] = x; er[k + 1] = 0; er[k + 2] = 0; er[k + 3] = x; er[k + 4] = ey; er[k + 5] = ez; br[k] = x; br[k + 1] = 0; br[k + 2] = 0; br[k + 3] = x; br[k + 4] = by; br[k + 5] = bz; }
      [G.eC, G.bC, G.eR, G.bR].forEach(function (o) { o.geometry.attributes.position.needsUpdate = true; });
      var ev = G.eV.l.geometry.attributes.position.array, evp = G.eV.p.geometry.attributes.position.array, bv = G.bV.l.geometry.attributes.position.array, bvp = G.bV.p.geometry.attributes.position.array;
      for (i = 0; i < NV; i++) { var x2 = -HALF + 2 * HALF * (i + 0.5) / NV; field(x2, tmp); var y1 = tmp[0], z1 = tmp[1]; k = i * 6; ev[k] = x2; ev[k + 1] = 0; ev[k + 2] = 0; ev[k + 3] = x2; ev[k + 4] = y1; ev[k + 5] = z1; bv[k] = x2; bv[k + 1] = 0; bv[k + 2] = 0; bv[k + 3] = x2; bv[k + 4] = -z1; bv[k + 5] = y1; k = i * 3; evp[k] = x2; evp[k + 1] = y1; evp[k + 2] = z1; bvp[k] = x2; bvp[k + 1] = -z1; bvp[k + 2] = y1; }
      [G.eV.l, G.eV.p, G.bV.l, G.bV.p].forEach(function (o) { o.geometry.attributes.position.needsUpdate = true; });
      G.eC.visible = G.eR.visible = G.eV.l.visible = G.eV.p.visible = S.showE; G.bC.visible = G.bR.visible = G.bV.l.visible = G.bV.p.visible = S.showB;
      var col = new T.Color(G.D.reg.col); if (G.D.reg.id === 'vis') { var c3 = wl2rgb(G.D.lam * 1e9); col.setRGB(c3[0] / 255, c3[1] / 255, c3[2] / 255); }
      for (i = 0; i < NS; i++) { var a = G.sA[i]; a.visible = S.showS; if (!S.showS) continue; var xs = -HALF + 2 * HALF * (i + 0.5) / NS; field(xs, tmp); var s = (tmp[0] * tmp[0] + tmp[1] * tmp[1]) / (S.amp * S.amp), len = Math.max(0.001, 2.6 * s); a.position.set(xs, 0, 0); a.setLength(len, Math.min(0.55, len * 0.45), Math.min(0.3, len * 0.25)); a.setColor(col.clone().multiplyScalar(0.8)); }
      G.q.visible = G.qL.visible = S.showQ; labs.q.vis(S.showQ);
      if (S.showQ) { field(Q_X, tmp); var kq = 0.32; G.q.position.set(Q_X, tmp[0] * kq, tmp[1] * kq); var qp = G.qL.geometry.attributes.position.array; qp[0] = Q_X; qp[1] = 0; qp[2] = 0; qp[3] = Q_X; qp[4] = G.q.position.y; qp[5] = G.q.position.z; G.qL.geometry.attributes.position.needsUpdate = true; labs.q.pos(Q_X, G.q.position.y + 0.9, G.q.position.z); }
      var lv = S.meas && S.pol === 'lin' && !S.packet && VL < 9;
      if (lv) { var m2 = Math.ceil((K * (-HALF + 3) + W * G.T) / (2 * Math.PI)), x1 = (2 * Math.PI * m2 + W * G.T) / K, xb = x1 + VL, y = -(S.amp + 1.7), p = G.lam.geometry.attributes.position.array; var pts = [x1, y, 0, xb, y, 0, x1, y - 0.35, 0, x1, y + 0.35, 0, xb, y - 0.35, 0, xb, y + 0.35, 0]; for (i = 0; i < 18; i++) p[i] = pts[i]; G.lam.geometry.attributes.position.needsUpdate = true; lv = xb < HALF; if (lv) labs.lam.pos((x1 + xb) / 2, y - 0.9, 0).set('λ = ' + withUnit(G.D.lam, LEN, 'm'), 'bl-lead'); }
      G.lam.visible = lv; labs.lam.vis(lv);
      labs.t.set(G.D.reg.full + ' · λ = ' + withUnit(G.D.lam, LEN, 'm') + ' · E = ' + (G.D.E < 1e-6 ? sci(G.D.E) + ' eV' : withUnit(G.D.E, ENG, 'eV')), 'bl-lead').vis(true);
    },
    sync: function (ctx) { if (ui.refresh) ui.refresh(); },
    hud: function () { var D = G.D || derive(), row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; };
      return { eq: { chip: 'E = hf', name: D.reg.full, body: row('λ', withUnit(D.lam, LEN, 'm')) + row('f', withUnit(D.f, FRQ, 'Hz')) + row("photon E", D.E < 1e-6 ? sci(D.E) + ' eV' : withUnit(D.E, ENG, 'eV')) }, legend: [{ label: 'E', color: '#e03168', text: "electric field (y)" }, { label: 'B', color: '#1c7ed6', text: "magnetic field (z)" }, { label: 'S', color: '#f59f00', text: "Poynting (propagation)" }, { label: 'q⁺', color: '#fab005', text: "test charge" }] }; },
    measures: function () { var D = G.D || derive(); return [["Region", D.reg.full], ['λ', withUnit(D.lam, LEN, 'm')], ['f = c/λ', withUnit(D.f, FRQ, 'Hz')], ['T = 1/f', withUnit(1 / D.f, PER, 's')], ['ν̃ = 1/λ', D.wn >= 1e4 ? sci(D.wn, 2) + ' cm⁻¹' : sig3(D.wn) + ' cm⁻¹'], ["photon E", D.E < 1e-6 ? sci(D.E) + ' eV' : withUnit(D.E, ENG, 'eV')], ['N_A·E', D.emol >= 0.01 ? sig3(D.emol) + ' kJ/mol' : sci(D.emol) + ' kJ/mol'], ['E / k_BT (298 K)', D.kt >= 100 ? sci(D.kt, 1) : (D.kt >= 0.1 ? sig3(D.kt) : sci(D.kt, 1))], ["Radiation", D.ion ? "ionizing (E ≥ 10 eV)" : "non-ionizing"]]; },
    ideas: ["<b>c = λ·f</b>: as f increases, λ decreases.", "<b>E = hf</b>: higher frequency, more energy per photon.", "With ≳ 10 eV the radiation is <b>ionizing</b>.", "IR → vibrations; visible/UV → electronic transitions.", "E ⟂ B ⟂ propagation; S = E × B/μ₀."],
    lab: function (el, ctx) {
      var kit = ctx.kit, c = kit.ui.card("Wavelength"); el.appendChild(c);
      ui.reg = kit.ui.options({ label: "Spectrum region", cols: 4, value: regionOf(S.lg).id, options: REG.map(function (r) { return { v: r.id, label: r.name }; }), onChange: function (v) { ctx.goManual(); S.lg = REG.filter(function (r) { return r.id === v; })[0].rep; ui.lg.set(S.lg); } }); c.appendChild(ui.reg);
      ui.lg = kit.ui.slider({ label: 'log₁₀ λ (m)', min: -13, max: 5, step: 0.01, value: S.lg, format: function (v) { return fmtn(v, 2); }, onInput: function (v) { ctx.goManual(); S.lg = v; } }); ui.amp = kit.ui.slider({ label: "Amplitude", min: 0.5, max: 3.2, step: 0.05, value: S.amp, format: function (v) { return fmtn(v, 1); }, onInput: function (v) { ctx.goManual(); S.amp = v; } }); ui.spd = kit.ui.slider({ label: "Rate", min: 0.1, max: 3, step: 0.05, value: S.spd, format: function (v) { return fmtn(v, 1) + '×'; }, onInput: function (v) { ctx.goManual(); S.spd = v; } }); c.appendChild(kit.ui.sliders([ui.lg, ui.amp, ui.spd]));
      var c2 = kit.ui.card("Wave and polarization"); el.appendChild(c2);
      ui.pol = kit.ui.options({ label: "Polarization", cols: 3, value: S.pol, options: [{ v: 'lin', label: "Linear" }, { v: 'cr', label: 'Circular ↻' }, { v: 'cl', label: 'Circular ↺' }], onChange: function (v) { ctx.goManual(); S.pol = v; } }); c2.appendChild(ui.pol);
      ui.ang = kit.ui.slider({ label: "Angle of E", min: 0, max: 180, step: 1, value: S.ang, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); S.ang = v; } }); c2.appendChild(kit.ui.sliders([ui.ang]));
      var tg = [['showE', "E field"], ['showB', "B field"], ['showS', 'Poynting S'], ['showQ', "Test charge"], ['meas', "Measure λ"], ['packet', "Photon (packet)"]], row = document.createElement('div'); row.className = 'row'; row.style.flexWrap = 'wrap'; ui.tg = {};
      tg.forEach(function (t) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = t[1]; b.onclick = function () { ctx.goManual(); S[t[0]] = !S[t[0]]; }; ui.tg[t[0]] = b; row.appendChild(b); }); c2.appendChild(row);
      c2.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var mc = kit.ui.card("Matter"); el.appendChild(mc); var mb = document.createElement('div'); mc.appendChild(mb);
      var lk = ''; ui.refresh = function () { var k = [S.lg.toFixed(2), S.amp, S.spd, S.pol, S.ang, S.showE, S.showB, S.showS, S.showQ, S.meas, S.packet].join('|'); if (k === lk) return; lk = k; var r = regionOf(S.lg); ui.reg.set(r.id); ui.lg.set(S.lg); ui.amp.set(S.amp); ui.spd.set(S.spd); ui.pol.set(S.pol); ui.ang.set(S.ang); Object.keys(ui.tg).forEach(function (n) { ui.tg[n].className = 'btn' + (S[n] ? " primary" : ''); }); mb.innerHTML = '<p class="small"><b>' + r.full + '</b> · ' + r.rng + " · comparable to " + r.scale + '.</p><p class="small">' + r.mat + "</p><p class=\"small\"><b>Uses:</b> " + r.use + '</p>'; };
    },
    graphs: [
      { title: "Photon energy versus λ", h: 250, note: "E = 1239.84/λ(nm) (log–log). Red line: ionization threshold ≈ 10 eV; dotted: k_BT at 298 K.", draw: function (cx, w, h, c) {
        var L0 = 40, Tp = 10, B = 28, pw = w - L0 - 10, ph = h - Tp - B, sx = function (lg) { return L0 + pw * (LOG_HI - lg) / SPAN; }, ey = function (le) { return Tp + ph * (1 - (le + 7) / 14); };
        cx.font = '10px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center';
        REG.forEach(function (r) { cx.fillStyle = r.col; cx.globalAlpha = 0.18; cx.fillRect(sx(r.hi), Tp, sx(r.lo) - sx(r.hi), ph); cx.globalAlpha = 1; });
        cx.fillStyle = c.muted; for (var lg = 4; lg >= -12; lg -= 4) { cx.fillText('10' + String(lg).replace('-', '⁻').replace(/\d/g, function (d) { return SUP[d]; }), sx(lg), h - B + 12); } cx.fillText('λ (m)', L0 + pw / 2, h - 2);
        cx.textAlign = 'right'; for (var le = -6; le <= 6; le += 3) { cx.beginPath(); cx.moveTo(L0, ey(le)); cx.lineTo(L0 + pw, ey(le)); cx.stroke(); cx.fillText('10' + String(le).replace('-', '⁻').replace(/\d/g, function (d) { return SUP[d]; }), L0 - 4, ey(le) + 3); } cx.save(); cx.translate(10, Tp + ph / 2); cx.rotate(-Math.PI / 2); cx.textAlign = 'center'; cx.fillText('E (eV)', 0, 0); cx.restore();
        cx.strokeStyle = c.ink; cx.lineWidth = 2; cx.beginPath(); for (var l2 = LOG_LO; l2 <= LOG_HI; l2 += 0.1) { var le2 = L10(HC) - l2; var px = sx(l2), py = ey(le2); if (l2 === LOG_LO) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1;
        cx.strokeStyle = '#e03131'; cx.beginPath(); cx.moveTo(L0, ey(1)); cx.lineTo(L0 + pw, ey(1)); cx.stroke(); cx.setLineDash([4, 3]); cx.strokeStyle = c.muted; cx.beginPath(); cx.moveTo(L0, ey(L10(0.025679))); cx.lineTo(L0 + pw, ey(L10(0.025679))); cx.stroke(); cx.setLineDash([]);
        cx.fillStyle = '#e03131'; cx.textAlign = 'left'; cx.fillText('≈ 10 eV', L0 + 4, ey(1) - 3); cx.fillStyle = c.muted; cx.fillText('k_BT', L0 + 4, ey(L10(0.025679)) - 3);
        var D = G.D || derive(); cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(S.lg), ey(L10(D.E)), 5, 0, 7); cx.fill(); } },
      { title: "Electromagnetic spectrum", h: 150, note: "Logarithmic bar of λ with the current position.", draw: function (cx, w, h, c) {
        var L0 = 10, pw = w - 20, sx = function (lg) { return L0 + pw * (LOG_HI - lg) / SPAN; };
        REG.forEach(function (r) { cx.fillStyle = r.col; cx.fillRect(sx(r.hi), 40, sx(r.lo) - sx(r.hi) + 0.5, 34); if (r.hi - r.lo > 1.4) { cx.fillStyle = '#fff'; cx.font = '600 10px system-ui'; cx.textAlign = 'center'; cx.fillText(r.name, (sx(r.hi) + sx(r.lo)) / 2, 61); } });
        cx.fillStyle = c.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; [[4, '10 km'], [0, '1 m'], [-3, '1 mm'], [-6, '1 μm'], [-9, '1 nm'], [-12, '1 pm']].forEach(function (t) { cx.fillText(t[1], sx(t[0]), 92); cx.fillRect(sx(t[0]), 76, 1, 5); });
        var x = sx(S.lg); cx.fillStyle = c.ink; cx.fillRect(x - 1.5, 30, 3, 52); cx.beginPath(); cx.moveTo(x - 6, 24); cx.lineTo(x + 6, 24); cx.lineTo(x, 32); cx.fill();
        var g = cx.createLinearGradient(L0, 0, L0 + pw, 0); for (var i = 0; i <= 20; i++) { var rgb = wl2rgb(380 + 370 * i / 20); g.addColorStop(i / 20, 'rgb(' + rgb.join(',') + ')'); } cx.fillStyle = g; cx.fillRect(L0, 112, pw, 12); cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText('380 nm', L0, 140); cx.textAlign = 'right'; cx.fillText('750 nm', L0 + pw, 140); var D = G.D || derive(), nm = D.lam * 1e9; if (nm >= 380 && nm <= 750) { var xv = L0 + pw * (nm - 380) / 370; cx.fillStyle = c.ink; cx.fillRect(xv - 1.5, 108, 3, 20); } } },
      { title: "Polarization: tip of the E vector", h: 220, note: "Front view (yz plane): line, circle ↻ or circle ↺ depending on the polarization.", draw: function (cx, w, h, c) {
        var cxx = w / 2, cyy = h / 2, R = Math.min(w, h) / 2 - 20; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(cxx - R, cyy); cx.lineTo(cxx + R, cyy); cx.moveTo(cxx, cyy - R); cx.lineTo(cxx, cyy + R); cx.stroke(); cx.fillStyle = c.muted; cx.font = '10px system-ui'; cx.fillText('y (E)', cxx + 4, cyy - R + 8); cx.fillText('z', cxx + R - 10, cyy - 4);
        var sv = [0, 0], A = S.amp; cx.strokeStyle = '#e03168'; cx.lineWidth = 2; cx.beginPath(); for (var i = 0; i <= 120; i++) { var ph = i / 120 * 2 * Math.PI, ey, ez; if (S.pol === 'lin') { ey = Math.cos(ph) * Math.cos(S.ang * Math.PI / 180); ez = Math.cos(ph) * Math.sin(S.ang * Math.PI / 180); } else { ey = Math.cos(ph); ez = (S.pol === 'cr' ? 1 : -1) * Math.sin(ph); } var px = cxx + ez * R * A / 3.2 * 1.35, py = cyy - ey * R * A / 3.2 * 1.35; if (i) cx.lineTo(px, py); else cx.moveTo(px, py); } cx.stroke(); cx.lineWidth = 1;
        var ph2 = -W * G.T, ey2, ez2; if (S.pol === 'lin') { ey2 = Math.cos(ph2) * Math.cos(S.ang * Math.PI / 180); ez2 = Math.cos(ph2) * Math.sin(S.ang * Math.PI / 180); } else { ey2 = Math.cos(ph2); ez2 = (S.pol === 'cr' ? 1 : -1) * Math.sin(ph2); } cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(cxx + ez2 * R * A / 3.2 * 1.35, cyy - ey2 * R * A / 3.2 * 1.35, 5, 0, 7); cx.fill(); } }
    ],
    calc: function () { var D = G.D || derive(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + D.reg.full + ' · λ = ' + withUnit(D.lam, LEN, 'm') + "</div><div class=\"calc-step\">1 · Frequency and period</div><table class=\"calc-table\">" + row('f = c/λ', withUnit(D.f, FRQ, 'Hz')) + row('T = 1/f', withUnit(1 / D.f, PER, 's')) + row('ν̃ = 1/λ', D.wn >= 1e4 ? sci(D.wn, 2) + ' cm⁻¹' : sig3(D.wn) + ' cm⁻¹') + "</table><div class=\"calc-step\">2 · Energy</div><table class=\"calc-table\">" + row('E = h·f', D.E < 1e-6 ? sci(D.E) + ' eV' : withUnit(D.E, ENG, 'eV')) + row("E (J) = 1.602 × 10⁻¹⁹ · E(eV)", sci(D.E * 1.602176634e-19) + ' J') + row('N_A·E', D.emol >= 0.01 ? sig3(D.emol) + ' kJ/mol' : sci(D.emol) + ' kJ/mol') + row('E / k_BT (298 K)', D.kt >= 100 ? sci(D.kt, 1) : sig3(D.kt)) + "</table><div class=\"calc-step\">3 · Effect</div><table class=\"calc-table\">" + row("Ionizing", D.ion ? "yes (E ≥ 10 eV)" : 'no') + row("Excites", { radio: "nuclear spins", micro: "rotations", ir: "vibrations", vis: "valence electrons", uv: "valence electrons / bonds", xr: "inner electrons", gm: "nuclei" }[D.reg.id]) + '</table>'; },
    calcLabel: "Photon",
    quiz: [
      { q: "The relation between frequency and wavelength in a vacuum is…", options: ['c = λ·f', 'c = λ/f', 'E = λ·f', 'f = c·λ'], answer: 0, why: "The speed of light is the product of λ and f." },
      { q: "As the wavelength decreases, the photon energy…", options: ["increases", "decreases", "does not change", "depends on the intensity"], answer: 0, why: "E = hc/λ: inversely proportional to λ." },
      { q: "A 550 nm photon has an approximate energy of…", options: ["2.25 eV", "22.5 eV", "0.225 eV", '225 eV'], answer: 0, why: "E = 1239.84/550 ≈ 2.25 eV." },
      { q: "Infrared radiation mainly excites…", options: ["bond vibrations", "rotations", "inner electrons", "nuclei"], answer: 0, why: "IR spectroscopy detects vibrations (≈ 4000–400 cm⁻¹)." },
      { q: "In an electromagnetic wave in a vacuum, E and B…", options: ["are in phase and perpendicular to each other and to the propagation", "are 90° out of phase and parallel", "are longitudinal", "only E exists"], answer: 0, why: "They are transverse, in phase, and |E| = c·|B|." },
      { q: "Circularly polarized light is characterized by…", options: ["the tip of E describing a helix", "E oscillating in a single plane", "has no magnetic field", "its frequency is double"], answer: 0, why: "Two orthogonal components with a 90° phase shift and the same amplitude." },
      { q: "A photon is ionizing when its energy is of the order of…", options: ['≳ 10 eV', "≈ 1 meV", '≈ k_BT', "≈ 0.1 eV"], answer: 0, why: "It must exceed the ionization energy (H: 13.6 eV)." },
      { q: "The wavenumber ν̃ is expressed as…", options: ['1/λ (cm⁻¹)', 'λ·f', 'h·f', 'c/f'], answer: 0, why: "It is the inverse of the wavelength, usual in IR." }
    ],
    help: { intro: "Choose a region or drag log₁₀ λ in “Lab”. Rotate the scene with the mouse.", items: [["Views", "Perspective, E plane, B plane and front."], ["Photon", "turn on “Photon (packet)” to see a wave train."], ["Test charge", "shows that E accelerates a charge."], ["Poynting", "yellow arrows of energy flow."]] }
  };
  function fmtn(v, d) { return SimKit.fmt(v, d); }
  MSim.create(def);
})();
