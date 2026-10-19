/* Metabolismo energético — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

/* utilidades 3D de reserva de mallas (se concatena antes de cada simulador biológico) */
var BP = (function () {
  function mk(ctx, group) {
    var T = ctx.T, sphG = new T.SphereGeometry(1, 16, 12), cylG = new T.CylinderGeometry(1, 1, 1, 8, 1, true), boxG = new T.BoxGeometry(1, 1, 1);
    function pool(geo, mat) { var items = [], used = 0; return { begin: function () { used = 0; }, get: function (col, op) { if (used >= items.length) { var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })); group.add(m); items.push(m); } var m = items[used++]; m.visible = true; m.material.color.setHex(col); var o = op == null ? 1 : op; m.material.transparent = o < 1; m.material.opacity = o; return m; }, end: function () { for (var i = used; i < items.length; i++) items[i].visible = false; }, all: function () { return items; } }; }
    var P = { sph: pool(sphG), cyl: pool(cylG), box: pool(boxG) }, up = new T.Vector3(0, 1, 0), tmpQ = new T.Quaternion(), tmpV = new T.Vector3(), tmpM = new T.Matrix4();
    return {
      begin: function () { P.sph.begin(); P.cyl.begin(); P.box.begin(); },
      end: function () { P.sph.end(); P.cyl.end(); P.box.end(); },
      sphere: function (p, r, col, op) { var m = P.sph.get(col, op); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(r); return m; },
      line: function (a, b, r, col, op) { var m = P.cyl.get(col, op), d = tmpV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); if (L < 1e-6) { m.visible = false; return m; } m.scale.set(r, L, r); m.quaternion.setFromUnitVectors(up, d.normalize()); return m; },
      /* caja con ejes: u (largo), v (alto), w (ancho) ortonormales; dims [L, H, W] */
      box: function (c, u, v, w, dims, col, op) { var m = P.box.get(col, op); m.position.set(c[0], c[1], c[2]); tmpM.makeBasis(new T.Vector3(u[0], u[1], u[2]), new T.Vector3(v[0], v[1], v[2]), new T.Vector3(w[0], w[1], w[2])); m.quaternion.setFromRotationMatrix(tmpM); m.scale.set(dims[0], dims[1], dims[2]); return m; }
    };
  }
  return { mk: mk };
})();
(function () {
  var fmt = SimKit.fmt;
  var S = { v: 0, inh: 'none', o2: true, auto: true, ph: 0, _k: '' }, G = {}, labs = {}, P = [];
  var INH = { none: { n: "Neither", dp: 1.0, o2: 1.0, tgt: '—' }, rot: { n: "Rotenone (CI)", dp: 0.3, o2: 0.25, tgt: "Complex I" }, cn: { n: "Cyanide (CIV)", dp: 0, o2: 0, tgt: "Complex IV" }, oli: { n: "Oligomycin (ATP synthase)", dp: 1.3, o2: 0.05, tgt: "ATP synthase" }, dnp: { n: "DNP (uncoupler)", dp: 0.05, o2: 2.0, tgt: "Membrane (protonophore)" } };
  function yld(inh, o2) {
    var g = 2, k = 0, ox = 0, lact = false;
    if (!o2 || inh === 'cn' || inh === 'oli') { return { g: 2, k: 0, ox: 0, tot: 2, lact: true }; }
    if (inh === 'none') { k = 2; ox = 10 * 2.5 + 2 * 1.5; }
    if (inh === 'rot') { k = 2; ox = 2 * 1.5; }
    if (inh === 'dnp') { k = 2; ox = 0; g = 2; }
    return { g: g, k: k, ox: ox, tot: g + k + ox + (inh === 'dnp' ? 0 : 0), lact: false };
  }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function dpOf() { return S.o2 ? INH[S.inh].dp : (S.inh === 'none' ? 0 : 0); }
  function o2rate() { return S.o2 ? INH[S.inh].o2 : 0; }
  var GL = [["Glucose", 6], ["Glucose-6-P", 6], ["Fructose-6-P", 6], ["Fructose-1,6-bisP", 6], ['G3P + DHAP', 3], ['1,3-BPG', 3], ['3-PG', 3], ['2-PG', 3], ['PEP', 3], ["Pyruvate", 3]];
  var GLN = ['', "hexokinase (−1 ATP)", "isomerase", 'PFK-1 (−1 ATP)', "aldolase", 'G3P-DH (+NADH)', 'PGK (+ATP)', "mutase", "enolase", "pyruvate kinase (+ATP)"];
  var KR = [["Citrate", 6], ["Isocitrate", 6], ["α-Ketoglutarate", 5], ["Succinyl-CoA", 4], ["Succinate", 4], ["Fumarate", 4], ["Malate", 4], ["Oxaloacetate", 4]];
  var KRN = ["aconitase", "isocitrate DH (−CO₂, +NADH)", "α-KG DH (−CO₂, +NADH)", "succinyl-CoA synthetase (+GTP)", "succinate DH (+FADH₂)", "fumarase", "malate DH (+NADH)", "citrate synthase (+acetyl-CoA)"];
  function sceneBuild(ctx) { var T = ctx.T; if (G.g) ctx.scene.remove(G.g); G.g = new T.Group(); G.pool = new T.Group(); G.g.add(G.pool); G.r = BP.mk(ctx, G.pool); ctx.scene.add(G.g); }
  function chain(r, c, n, col, sc, y) { var out = []; for (var i = 0; i < n; i++) { var p = [c[0] + (i - (n - 1) / 2) * 0.42 * sc, c[1] + (i % 2) * 0.12 * sc, c[2]]; out.push(p); r.sphere(p, 0.2 * sc, col); if (i) r.line(out[i - 1], p, 0.04 * sc, 0xced4da); } return out; }
  function initParts() { P = []; for (var i = 0; i < 46; i++) P.push({ x: -5 + Math.random() * 10, y: -2.2 + Math.random() * 1.9, z: (Math.random() - 0.5) * 3, u: 0, w: Math.random(), up: false, t: Math.random() }); G.H = P; }
  var STG = function () { return [
    ["Overview", "General", "Glucose → pyruvate → acetyl-CoA → CO₂ + H₂O", "<p><b>Glucose</b> is oxidized in three stages: <b>glycolysis</b> (cytosol), <b>pyruvate decarboxylation and the Krebs cycle</b> (mitochondrial matrix) and <b>oxidative phosphorylation</b> (inner membrane). The energy of the oxidations is stored in <b>NADH and FADH₂</b>, which feed the respiratory chain.</p>"],
    ["Glycolysis", "Glycolysis", "C₆H₁₂O₆ + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 pyruvate + 2 NADH + 2 ATP", "<p>Ten reactions: the <b>investment</b> phase spends 2 ATP (hexokinase, PFK-1); the <b>payoff</b> phase produces 4 ATP and 2 NADH. <b>Net yield: 2 ATP + 2 NADH</b> per glucose. Without O₂, pyruvate is reduced to <b>lactate</b> to regenerate NAD⁺.</p>"],
    ["Krebs cycle", "Krebs", "Acetyl-CoA + 3 NAD⁺ + FAD + GDP → 2 CO₂ + 3 NADH + FADH₂ + GTP", "<p>Acetyl-CoA (2 C) joins <b>oxaloacetate</b> (4 C) and forms <b>citrate</b> (6 C). Two <b>decarboxylations</b> release 2 CO₂ and regenerate oxaloacetate. Per turn: <b>3 NADH, 1 FADH₂, 1 GTP</b>; per glucose, two turns.</p>"],
    ["Respiratory chain", "Chain", "NADH → CI → Q → CIII → cyt c → CIV → O₂", "<p>The electrons of NADH (−0.32 V) fall down to O₂ (+0.82 V). <b>CI, CIII and CIV pump H⁺</b> into the intermembrane space, creating the <b>proton gradient</b> (Δp). The H⁺ return through <b>ATP synthase</b>, whose rotor drives ATP synthesis (<b>chemiosmosis</b>, Mitchell).</p>"],
    ["Balance and inhibitors", "Balance", "Aerobic ≈ 32 ATP; fermentation = 2 ATP", "<p>Aerobic: <b>≈ 32 ATP per glucose</b> (2.5 ATP/NADH and 1.5 ATP/FADH₂). Anaerobic: only <b>2 ATP</b>. <b>Rotenone</b> blocks CI; <b>cyanide</b> blocks CIV; <b>oligomycin</b> blocks ATP synthase; <b>DNP</b> dissipates the gradient (<b>uncoupler</b>): it consumes O₂ and releases heat, without ATP.</p>"]
  ]; };
  function lessonSet(i, loc) { S.v = i; if (i === 4) { var q = Math.floor(loc * 5); S.inh = ['none', 'rot', 'cn', 'oli', 'dnp'][Math.min(4, q)]; S.o2 = true; } else { S.inh = 'none'; S.o2 = true; } S.ph = loc; }
  var def = {
    key: "metabolism", title: "Energy Metabolism", subtitle: "3D Simulator · biomolecules", accent: { dark: '#ff922b', light: '#c2410c' }, stages: STG, nStages: 5, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 1.5, 13], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 14], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 13, 0.5], target: [0, 0, 0] }],
    layers: [{ id: 'lab', label: "Molecules", icon: '◉' }],
    build: function (ctx) { sceneBuild(ctx); G.now = 0; initParts(); labs.t = ctx.label('', 'bl-lead'); labs.l = []; for (var i = 0; i < 14; i++) labs.l.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      dt = Math.min(dt, 0.05); if (!ctx.P.manual) lessonSet(f.i, f.local); else if (S.auto) S.ph = (S.ph + dt / 14) % 1; G.now += dt;
      var r = G.r, L = labs.l, v = S.v, ph = S.ph; L.forEach(function (l) { l.vis(false); }); labs.t.vis(false); r.begin();
      var Y = yld(S.inh, S.o2); G.Y = Y;
      if (v === 0) {
        var pos = [-4.4, -1.6, 0.9, 3.0, 4.9], seg = ph * 4.0;
        var g = chain(r, [pos[0], 0, 0], 6, 0x4dabf7, 1.0);
        L[0].pos(pos[0], 1.2, 0).set("Glucose (C₆)", 'bl-d').vis(true);
        [-0.5, 0.5].forEach(function (o) { chain(r, [pos[1], o * 1.2, 0], 3, 0x38d9a9, 1.0); }); L[1].pos(pos[1], 1.7, 0).set("2 pyruvate (C₃)", 'bl-d').vis(true);
        [-0.5, 0.5].forEach(function (o) { chain(r, [pos[2], o * 1.2, 0], 2, 0xffd43b, 1.0); r.sphere([pos[2] + 0.7, o * 1.2, 0], 0.16, 0xe8590c); }); L[2].pos(pos[2], 1.7, 0).set("2 acetyl-CoA (C₂)", 'bl-d').vis(true);
        for (var k = 0; k < 8; k++) { var a = G.now * 0.8 + k * Math.PI / 4; r.sphere([pos[3] + Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], 0.16 + (k % 3 === 0 ? 0.06 : 0), 0xff922b); } L[3].pos(pos[3], 1.7, 0).set("Krebs cycle", 'bl-d').vis(true);
        for (var q = 0; q < 6; q++) { var tt = (G.now * 0.3 + q / 6) % 1; r.sphere([pos[3] + 1.4 + tt * 1.5, 0.6 + Math.sin(q) * 0.8, 0], 0.13, 0x868e96, 1 - tt); r.sphere([pos[3] + 1.4 + tt * 1.5 + 0.28, 0.6 + Math.sin(q) * 0.8, 0], 0.13, 0xff6b6b, 1 - tt); }
        L[4].pos(pos[4] - 0.5, 1.7, 0).set('6 CO₂', 'bl-d').vis(true);
        [[-3.0, "glycolysis", 'citosol'], [1.3, 'PDH + Krebs', 'matriz'], [4.0, "chain", "inner m."]].forEach(function (z, ii) { L[5 + ii].pos(z[0], -2.6, 0).set(z[1] + ' · ' + z[2], 'bl-d').vis(true); });
        var tg = ['E', 'E'].length; for (var t = 0; t < 4; t++) { var a2 = (G.now * 0.5 + t / 4) % 1; r.sphere([-4.4 + a2 * 9.0, -1.2, 0.3], 0.1, 0xff6b6b); }
        labs.t.pos(0, 3.2, 0).set("Glucose + 6 O₂ → 6 CO₂ + 6 H₂O   (ΔG°′ = −2,870 kJ/mol)", 'bl-lead').vis(true);
      } else if (v === 1) {
        var n = GL.length, sx = function (i) { return -4.4 + i * 8.8 / (n - 1); }, cur = ph * (n - 1) * 0.999, ci = Math.floor(cur) + 0, fr = cur - ci;
        GL.forEach(function (s, i) { var x = sx(i), done = i <= cur; var col = i < 4 ? 0x4dabf7 : 0x38d9a9; if (i === 4) { chain(r, [x, 0.7, 0], 3, 0x38d9a9, 0.62); chain(r, [x, -0.7, 0], 3, 0x38d9a9, 0.62); } else { chain(r, [x, 0, 0], s[1], col, s[1] === 6 ? 0.42 : 0.62); } if (i > 0) r.line([sx(i - 1) + 0.4, 0, 0], [x - 0.4, 0, 0], 0.03, 0x868e96); L[i].pos(x, i % 2 ? -1.8 : 1.9, 0).set(s[0], 'bl-d').vis(true); if (i > 0 && i < n) { /* enzima */ } });
        var mx = sx(0) + (sx(n - 1) - sx(0)) * cur / (n - 1); r.sphere([mx, 0, 0.5], 0.28, 0xff6b6b, 0.85);
        var atp = 0, nad = 0; if (cur > 1) atp -= 1; if (cur > 3) atp -= 1; if (cur > 5) nad = 2; if (cur > 6) atp += 2; if (cur > 9) atp += 2;
        for (var a = 0; a < Math.max(0, atp) + (cur > 3 ? 2 : 0); a++) r.box([-4.4 + a * 0.5, -3.1, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.22, 0.22, 0.22], a < Math.max(0, atp) ? 0xffd43b : 0xadb5bd);
        labs.t.pos(0, 3.4, 0).set("Step " + Math.min(9, Math.floor(cur) + 1) + '/9 · ' + GLN[Math.min(9, Math.floor(cur) + 1)] + " · net ATP " + atp + ' · NADH ' + nad, 'bl-lead').vis(true);
        L[10].pos(-4.4, -2.6, 0).set('ATP', 'bl-d').vis(true);
      } else if (v === 2) {
        var m = KR.length, R = 3.1, cur2 = ph * m;
        KR.forEach(function (s, i) { var a = Math.PI / 2 - i * 2 * Math.PI / m, cx = Math.cos(a) * R * 1.0, cy = Math.sin(a) * R * 0.95; var on = Math.floor(cur2) === i; chain(r, [cx, cy, 0], s[1], on ? 0xff922b : 0x74c0fc, 0.55); var a2 = a - Math.PI / m; var bx = Math.cos(a2) * R * 1.0, by = Math.sin(a2) * R * 0.95; r.sphere([bx, by, 0], 0.07, 0x868e96); L[i].pos(cx * 1.3, cy * 1.2, 0).set(s[0] + ' (C' + s[1] + ')', 'bl-d').vis(true); });
        var ai = cur2 % 1, k0 = Math.floor(cur2), a0 = Math.PI / 2 - (k0 + 0.5 - 0.5) * 2 * Math.PI / m - ai * 2 * Math.PI / m; r.sphere([Math.cos(a0) * R * 1.0 * 0.72, Math.sin(a0) * R * 0.95 * 0.72, 0.4], 0.26, 0xff6b6b);
        if (k0 === 1 || k0 === 2) { var tt = ai; r.sphere([Math.cos(Math.PI / 2 - (k0 + 1) * 2 * Math.PI / m) * 6.2, Math.sin(Math.PI / 2 - (k0 + 1) * 2 * Math.PI / m) * 3.7 + tt, 0.3], 0.14, 0x868e96, 1 - tt); }
        labs.t.pos(0, 0.1, 0).set("Reaction " + (k0 + 1) + ': ' + KRN[k0], 'bl-lead').vis(true);
        r.sphere([-4.6, 3.0, 0], 0.2, 0xffd43b); r.sphere([-4.2, 3.0, 0], 0.2, 0xffd43b); L[9].pos(-4.4, 3.6, 0).set("acetyl-CoA (C₂)", 'bl-d').vis(true);
        L[10].pos(0, -4.0, 0).set("per turn: 3 NADH · 1 FADH₂ · 1 GTP · 2 CO₂", 'bl-d').vis(true);
      } else if (v === 3) {
        var dp = dpOf(), rate = o2rate();
        r.box([-0.3, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [11, 0.34, 3.2], 0xe8c07a, 0.55);
        var cx = [-4.6, -2.9, -1.0, 1.3, 4.0], cn = ['CI', 'CII', 'CIII', 'CIV', "ATP synthase"], cc = [0x4c6ef5, 0x7950f2, 0x15aabf, 0xf06595, 0x40c057], blk = [S.inh === 'rot', false, false, S.inh === 'cn', S.inh === 'oli'];
        cx.forEach(function (x, i) { var w = i === 4 ? 0.75 : 0.9, h = i === 4 ? 0.8 : 1.0; r.box([x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [w, h, 0.9], blk[i] ? 0x495057 : cc[i], 0.95); if (i === 4) { r.sphere([x, 1.15, 0], 0.5, blk[i] ? 0x495057 : 0x69db7c); r.box([x, 0.65, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.12, 0.7, 0.12], 0xfab005); var ang = G.now * 4 * rate * (S.inh === 'oli' ? 0 : 1) * (S.inh === 'dnp' ? 0.1 : 1) * (S.inh === 'dnp' ? 0 : 1) + 0; r.sphere([x + Math.cos(ang) * 0.3, -0.15, Math.sin(ang) * 0.3], 0.14, 0xffd43b); } L[i].pos(x, i === 4 ? 2.1 : 1.2, 0).set(cn[i] + (blk[i] ? ' ✕' : ''), blk[i] ? 'bl-warn' : 'bl-d').vis(true); });
        var hv = 0; P.forEach(function (p, i) { p.t += dt * (0.25 + 0.5 * rate * (S.inh === 'oli' ? 0 : 1)); var pumped = i < 30 * Math.min(1, Math.max(0, dp * 0.9 + 0.1) + (S.inh === 'oli' ? 0.3 : 0)); if (p.t > 1) { p.t = 0; p.x = cx[i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 3] + (Math.random() - 0.5) * 0.4; } var pump = (i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 3); var out = pumped; if (S.inh === 'oli') { var ix = p.x; r.sphere([p.x, 0.9 + (p.w * 1.8) + Math.sin(G.now + i) * 0.1, p.z * 0.4], 0.11, 0xff6b6b, 0.9); return; } if (out && rate > 0.01 && S.inh !== 'dnp') { var x = cx[pump] + (cx[4] - cx[pump]) * Math.max(0, p.t - 0.55) * 2.2 * (p.t > 0.55 ? 1 : 0); r.sphere([i % 5 === 0 && p.t > 0.55 ? cx[4] : cx[pump] + (p.w - 0.5) * 0.3, p.t < 0.5 ? -0.3 - (0.5 - p.t) * 2 : 0.35 + (p.t - 0.5) * 2.4 * (p.t < 0.8 ? 1 : 0) + (p.t >= 0.8 ? 0.72 : 0), p.z * 0.4], 0.11, 0xff6b6b, 0.95); } else if (S.inh === 'dnp') { r.sphere([cx[pump] + (p.w - 0.5) * 2, p.t < 0.5 ? 1.0 - p.t * 3 : -0.3 - (p.t - 0.5), p.z * 0.4], 0.11, 0xff6b6b, 0.9); } else { r.sphere([p.x, -0.5 - p.w * 1.7, p.z * 0.4], 0.09, 0xadb5bd, 0.7); } });
        if (rate > 0.01) { var e = (G.now * 0.5 * Math.min(1.5, rate)) % 1, seq = [[-4.6, 0.6], [-2.9, -0.6], [-1.0, 0.6], [0.0, 1.0], [1.3, 0.6]], si = Math.floor(e * 4), su = e * 4 - si, p1 = seq[si], p2 = seq[si + 1]; if (S.inh !== 'rot' || si >= 1) r.sphere([p1[0] + (p2[0] - p1[0]) * su, p1[1] + (p2[1] - p1[1]) * su, 0.55], 0.15, 0xffe066); }
        L[5].pos(-4.6, -2.7, 0).set('NADH → NAD⁺ + H⁺', 'bl-d').vis(true); L[6].pos(1.3, -2.2, 0).set('½O₂ + 2H⁺ → H₂O', 'bl-d').vis(true); L[7].pos(-3.2, 2.6, 0).set("intermembrane space (H⁺ ↑)", 'bl-d').vis(true); L[8].pos(-4.8, -2.0, 0).set('matriz', 'bl-d').vis(true);
        labs.t.pos(0, 3.4, 0).set("Relative Δp " + fmt(dp, 2) + " · O₂ consumption " + fmt(rate, 2) + ' · ATP ' + fmt(Y.tot, 0) + '/glucosa', 'bl-lead').vis(true);
      } else {
        var cond = [['none', true], ['rot', true], ['cn', true], ['oli', true], ['dnp', true], ['none', false]], nm = ["Aerobic", "Rotenone", "Cyanide", "Oligomycin", "DNP", "No O₂"];
        cond.forEach(function (c, i) { var y = yld(c[0], c[1]), x = -4.6 + i * 1.85, hh = y.tot * 0.07, sel = (c[0] === S.inh && c[1] === S.o2); [[y.g, 0x4dabf7], [y.k, 0xffd43b], [y.ox, 0xff922b]].reduce(function (b, s) { var h = s[0] * 0.07; if (h > 0) r.box([x, b + h / 2 - 1.9, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.95, h, 0.95], s[1], sel ? 1 : 0.55); return b + h; }, 0); L[i].pos(x, -2.5, 0).set(nm[i] + ' · ' + fmt(y.tot, 0), sel ? 'bl-lead' : 'bl-d').vis(true); });
        L[6].pos(0, 3.2, 0).set("blue: glycolysis · yellow: Krebs (GTP) · orange: oxidative phosphorylation", 'bl-d').vis(true);
        labs.t.pos(0, 3.9, 0).set(INH[S.inh].n + (S.o2 ? '' : " · no O₂") + ' → ' + fmt(Y.tot, 0) + " ATP per glucose" + (Y.lact ? " (lactic fermentation)" : ''), 'bl-lead').vis(true);
      }
      r.end();
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; }, Y = G.Y || yld('none', true);
      return { eq: { chip: 'ATP', name: INH[S.inh].n + (S.o2 ? '' : " · no O₂"), body: row("Per glucose", fmt(Y.tot, 1)) + row("Relative Δp", fmt(dpOf(), 2)) + row("O₂ consumption", fmt(o2rate(), 2)) }, legend: [{ label: 'C', color: '#4dabf7', text: "carbons" }, { label: 'ATP', color: '#ffd43b', text: "energy" }, { label: 'H⁺', color: '#ff6b6b', text: "protons" }, { label: 'e⁻', color: '#ffe066', text: "electrons" }] }; },
    measures: function () { var Y = G.Y || yld('none', true); return [["Inhibitor", INH[S.inh].n], ["Target", INH[S.inh].tgt], ['O₂', S.o2 ? "present" : "absent"], ["Glycolysis ATP", fmt(Y.g, 0)], ["Krebs ATP (GTP)", fmt(Y.k, 0)], ["Oxidative phosph. ATP", fmt(Y.ox, 1)], ["Total ATP", fmt(Y.tot, 1)], ["End product", Y.lact ? "lactate" : 'CO₂ + H₂O']]; },
    ideas: ["Each <b>NADH</b> yields ≈ 2.5 ATP and each <b>FADH₂</b> ≈ 1.5 ATP.", "Without O₂ the chain stops: glycolysis regenerates NAD⁺ with <b>lactate</b>.", "An <b>uncoupler</b> (DNP) dissipates Δp: O₂ consumption ↑, ATP ↓, heat ↑.", "Oligomycin <b>also stops the chain</b>: the high gradient brakes the pumps.", "ΔG = −nFΔE; from NADH to O₂ ≈ −220 kJ per pair of e⁻."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Scene and conditions"); el.appendChild(c);
      ui.v = kit.ui.options({ label: "Stage", cols: 3, value: String(S.v), options: [['0', "General"], ['1', "Glycolysis"], ['2', "Krebs"], ['3', "Chain"], ['4', "Balance"]].map(function (o) { return { v: o[0], label: o[1] }; }), onChange: function (v) { ctx.goManual(); S.v = +v; S.ph = 0; } }); c.appendChild(ui.v);
      ui.inh = kit.ui.options({ label: "Inhibitor", cols: 2, value: S.inh, options: Object.keys(INH).map(function (k) { return { v: k, label: INH[k].n, sub: INH[k].tgt }; }), onChange: function (v) { ctx.goManual(); S.inh = v; } }); c.appendChild(ui.inh);
      ui.o2 = kit.ui.options({ label: "Oxygen", cols: 2, value: S.o2 ? '1' : '0', options: [{ v: '1', label: "With O₂" }, { v: '0', label: "No O₂" }], onChange: function (v) { ctx.goManual(); S.o2 = v === '1'; } }); c.appendChild(ui.o2);
      ui.ph = kit.ui.slider({ label: "Progress", min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.auto = false; S.ph = v / 100; } }); c.appendChild(kit.ui.sliders([ui.ph]));
      c.appendChild(ctx.btnRow([{ t: S.auto ? "Pause progress" : "Automatic progress", fn: function () { ctx.goManual(); S.auto = !S.auto; } }, { t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var lk = ''; ui.refresh = function () { var k = S.v + S.inh + S.o2; if (k === lk) return; lk = k; ui.v.set(String(S.v)); ui.inh.set(S.inh); ui.o2.set(S.o2 ? '1' : '0'); };
    },
    graphs: [
      { title: "ATP per glucose by condition", h: 240, note: "Glycolysis (blue), Krebs GTP (yellow) and oxidative phosphorylation (orange).", draw: function (cx, w, h, c) {
        var L0 = 34, Tp = 10, B = 40, pw = w - L0 - 8, ph = h - Tp - B, cond = [['none', true, "Aerobic"], ['rot', true, "Rotenone"], ['cn', true, 'CN⁻'], ['oli', true, 'Oligom.'], ['dnp', true, "DNP"], ['none', false, "No O₂"]], bw = pw / 6;
        cx.font = '10px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var a = 0; a <= 32; a += 8) { var y = Tp + ph * (1 - a / 34); cx.beginPath(); cx.moveTo(L0, y); cx.lineTo(L0 + pw, y); cx.stroke(); cx.fillText(a, L0 - 4, y + 3); }
        cond.forEach(function (q, i) { var Y = yld(q[0], q[1]), x = L0 + i * bw + bw * 0.15, bb = 0, sel = q[0] === S.inh && q[1] === S.o2; [[Y.g, '#4dabf7'], [Y.k, '#fab005'], [Y.ox, '#ff922b']].forEach(function (s) { var hh = ph * s[0] / 34; cx.fillStyle = s[1]; cx.globalAlpha = sel ? 1 : 0.6; cx.fillRect(x, Tp + ph - bb - hh, bw * 0.7, hh); bb += hh; }); cx.globalAlpha = 1; cx.fillStyle = sel ? c.ink : c.muted; cx.textAlign = 'center'; cx.fillText(q[2], x + bw * 0.35, h - B + 14); cx.fillText(fmt(Y.tot, 0), x + bw * 0.35, Tp + ph - bb - 3); }); } },
      { title: "Redox tower of the respiratory chain", h: 250, note: "E°′ (V): NADH −0.32 → Q +0.04 → cyt c +0.25 → O₂ +0.82. CI, CIII and CIV pump H⁺.", draw: function (cx, w, h, c) {
        var L0 = 46, Tp = 12, B = 20, pw = w - L0 - 10, ph = h - Tp - B, sy = function (e) { return Tp + ph * (1 - (e + 0.4) / 1.3); };
        cx.font = '10px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var e = -0.4; e <= 0.9; e += 0.2) { cx.beginPath(); cx.moveTo(L0, sy(e)); cx.lineTo(L0 + pw, sy(e)); cx.stroke(); cx.fillText(fmt(e, 1), L0 - 4, sy(e) + 3); }
        var pts = [['NADH/NAD⁺', -0.32], ['Q/QH₂', 0.04], ["cyt c", 0.25], ['O₂/H₂O', 0.82]], xs = [0.1, 0.38, 0.64, 0.9]; cx.textAlign = 'center'; cx.fillStyle = '#e8590c'; cx.strokeStyle = '#e8590c';
        cx.beginPath(); pts.forEach(function (p, i) { var x = L0 + pw * xs[i], y = sy(p[1]); if (i) cx.lineTo(x, y); else cx.moveTo(x, y); }); cx.lineWidth = 2; cx.stroke(); cx.lineWidth = 1;
        pts.forEach(function (p, i) { var x = L0 + pw * xs[i], y = sy(p[1]); cx.beginPath(); cx.arc(x, y, 4, 0, 7); cx.fill(); cx.fillStyle = c.muted; cx.fillText(p[0], x, y + (i === 3 ? 14 : -8)); cx.fillStyle = '#e8590c'; });
        [['CI', 0.24, '−0,28→0,04'], ['CIII', 0.51, ''], ['CIV', 0.77, '']].forEach(function (z) { var x = L0 + pw * z[1]; cx.fillStyle = '#4c6ef5'; cx.fillText(z[0] + ' · 4H⁺', x, sy(0.95) + 6); });
        cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText("ΔE = 1.14 V → ΔG°′ = −nFΔE = −220 kJ/mol", L0 + 4, h - 4); } },
      { title: "Energy balance of glucose oxidation", h: 200, note: "ΔG°′ = −2,870 kJ/mol; with ≈ 50 kJ/mol per ATP in vivo, 32 ATP ≈ 56 % efficiency.", draw: function (cx, w, h, c) {
        var Y = G.Y || yld('none', true), tot = 2870, got = Y.tot * 50, eff = got / tot, L0 = 20, pw = w - 40; cx.fillStyle = c.line; cx.fillRect(L0, 50, pw, 36); cx.fillStyle = '#51cf66'; cx.fillRect(L0, 50, pw * Math.min(1, eff), 36); cx.fillStyle = '#e8590c'; cx.fillRect(L0 + pw * eff, 50, pw * (1 - eff), 36);
        cx.font = '11px system-ui'; cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText("Energy stored as ATP: " + fmt(got, 0) + ' kJ (' + fmt(eff * 100, 0) + ' %)', L0, 40); cx.fillText("Heat: " + fmt(tot - got, 0) + ' kJ', L0, 112); cx.fillStyle = c.muted; cx.fillText("Total available: 2,870 kJ/mol of glucose", L0, 134); cx.fillText("Assumption: ΔG(ATP) ≈ 50 kJ/mol in the cell.", L0, 152); } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, Y = G.Y || yld('none', true);
      return "<div class=\"card-kicker\">Balance per glucose molecule · " + INH[S.inh].n + (S.o2 ? '' : " · no O₂") + "</div><div class=\"calc-step\">1 · Reduced coenzymes (aerobic conditions)</div><table class=\"calc-table\">" + row("Glycolysis", '2 NADH') + row("Pyruvate → acetyl-CoA", '2 NADH') + row("Krebs (2 turns)", '6 NADH + 2 FADH₂ + 2 GTP') + row('Total', '10 NADH + 2 FADH₂') + '</table><div class="calc-step">2 · ATP</div><table class="calc-table">' + row("Substrate-level phosphorylation", '2 + 2 = 4') + row('10 × 2,5 + 2 × 1,5', '28') + row("Aerobic total", '32 ATP') + row("Chosen condition", fmt(Y.tot, 1) + ' ATP') + "</table><div class=\"calc-step\">3 · Thermodynamics</div><table class=\"calc-table\">" + row("ΔG°′ = −nFΔE (n = 2, ΔE = 1.14 V)", fmt(-2 * 96.485 * 1.14, 0) + ' kJ/mol') + row("Efficiency 32 × 50 / 2,870", fmt(32 * 50 / 2870 * 100, 0) + ' %') + '</table>'; },
    calcLabel: 'ATP',
    quiz: [
      { q: "Net yield of glycolysis per glucose:", options: ["2 ATP + 2 NADH", "4 ATP + 4 NADH", "36 ATP", "2 ATP + 2 FADH₂"], answer: 0, why: "2 ATP are spent and 4 are produced; in addition 2 NADH (G3P-DH)." },
      { q: "The Krebs cycle takes place in…", options: ["the mitochondrial matrix", "the cytosol", "the intermembrane space", "the endoplasmic reticulum"], answer: 0, why: "The enzymes of the cycle are in the matrix (except succinate DH, in the inner membrane)." },
      { q: "The final electron acceptor of the respiratory chain is…", options: ['O₂', 'NAD⁺', 'CO₂', 'FAD'], answer: 0, why: "Complex IV reduces ½O₂ to H₂O with 2 H⁺." },
      { q: "Cyanide blocks…", options: ["complex IV", "complex I", "ATP synthase", "glycolysis"], answer: 0, why: "It binds to the Fe of cytochrome c oxidase: the chain stops." },
      { q: "An uncoupler such as DNP…", options: ["dissipates the H⁺ gradient: more O₂ consumed, less ATP", "blocks ATP synthase", "increases the gradient", "stops the Krebs cycle immediately"], answer: 0, why: "It carries H⁺ across the membrane; the chain works at full speed and the energy is released as heat." },
      { q: "Oligomycin…", options: ["blocks the H⁺ channel of ATP synthase", "inhibits complex III", "uncouples", "activates complex I"], answer: 0, why: "The gradient becomes maximal and brakes the pumping, so O₂ consumption ceases." },
      { q: "For each turn of the Krebs cycle, the following is released…", options: ['2 CO₂', '6 CO₂', '1 CO₂', '3 CO₂'], answer: 0, why: "Isocitrate DH and α-ketoglutarate DH decarboxylate; the 2 C of the acetyl leave (in the following turn)." },
      { q: "Without O₂, pyruvate is reduced to lactate in order to…", options: ["regenerate NAD⁺", "produce more ATP in the chain", "form acetyl-CoA", "obtain CO₂"], answer: 0, why: "Without NAD⁺ glycolysis would stop." }
    ],
    help: { intro: "Use “Lab” to choose the stage, the inhibitor and the presence of O₂.", items: [["Glycolysis", "ten steps with net ATP and NADH."], ["Krebs", "ring with carbons and decarboxylations."], ["Chain", "H⁺ pump and ATP synthase; try inhibitors."], ["Balance", "compare the ATP of each condition."]] }
  };
  MSim.create(def);
})();
