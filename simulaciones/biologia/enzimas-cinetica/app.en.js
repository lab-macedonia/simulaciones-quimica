/* Enzimas y cinética enzimática — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var ENZ = { amil: { n: "salivary α-amylase", pH: 6.8, Tm: 55, w: 1.6, Topt: 37 }, pep: { n: "pepsin", pH: 2.0, Tm: 58, w: 1.2, Topt: 37 }, trip: { n: "trypsin", pH: 8.0, Tm: 55, w: 1.5, Topt: 37 }, taq: { n: "Taq polymerase", pH: 8.3, Tm: 94, w: 1.8, Topt: 72 }, cat: { n: "catalase", pH: 7.0, Tm: 60, w: 1.6, Topt: 37 } };
  var KM = 7, KCAT = 1.0, KON = 0.2, KOFF = 0.4, NE = 8, KI = 10, VMAX = NE * KCAT;
  var S = { mode: 'cyc', model: 'ajuste', wrong: false, inh: 'none', p: 0, auto: true, S: 15, I: 0, enz: 'amil', T: 37, pH: 7.4, _st: -1 }, G = {}, labs = {}, key_ = '';
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function rnd(i, k) { var x = Math.sin(i * 91.7 + k * 17.3) * 43758.5453; return x - Math.floor(x); }
  function actPH(pH, e) { var d = pH - ENZ[e].pH; return Math.exp(-d * d / (2 * ENZ[e].w * ENZ[e].w)); }
  function actT(T, e) { var E = ENZ[e], up = Math.pow(2, (T - E.Topt) / 10), den = 1 / (1 + Math.exp((T - E.Tm) / 2.5)); return Math.min(1.9, up) * den / (Math.pow(2, 0) * 1); }
  function denat(T, pH, e) { var E = ENZ[e], fT = 1 / (1 + Math.exp(-(T - E.Tm) / 2.5)), fp = 1 / (1 + Math.exp(-(Math.abs(pH - E.pH) - 2.4 * E.w / 1.5) / 0.5)); return 1 - (1 - fT) * (1 - fp); }
  function vmm(s, i, kind) { var km = KM, vm = VMAX; if (kind === 'comp') km = KM * (1 + i / KI); if (kind === 'nocomp') vm = VMAX / (1 + i / KI); return vm * s / (km + s); }
  /* ----- geometría de la enzima ----- */
  var LOBE = null;
  function lobeInit() { if (LOBE) return; var pts = [], R = 1.55; for (var i = 0; i < 46; i++) { var y = (i + 0.5) / 46, r = Math.sqrt(1 - y * y), th = i * 2.399963; pts.push([R * r * Math.cos(th) * 1.0, R * y * 0.85, R * r * Math.sin(th) * 0.95, 0.3 + 0.1 * rnd(i, 1)]); } for (var a = -3; a <= 3; a++) for (var b = -3; b <= 3; b++) { var x = a * 0.42, z = b * 0.42, rr = Math.hypot(x, z); if (rr < 0.78 || rr > 1.5) continue; pts.push([x, 0.0, z, 0.26]); } LOBE = pts; }
  function drawEnzyme(r, o) {
    lobeInit(); var th = o.theta, piv = [-1.45, 0], D = o.D || 0, resid = [[-0.55, 0.02, 0.45], [0.5, 0.02, -0.4], [0.05, -0.05, 0.62]];
    function coil(i, up) { var x = (rnd(i + (up ? 100 : 0), 3) - 0.5) * 7, y = (rnd(i + (up ? 100 : 0), 4) - 0.5) * 4 + (up ? 0.8 : -0.8), z = (rnd(i + (up ? 100 : 0), 5) - 0.5) * 4; return [x, y, z]; }
    LOBE.forEach(function (p, i) {
      [1, -1].forEach(function (s) {
        var x = p[0], y = s * (p[1] + 0.12), z = p[2], X = x, Y = y;
        if (s > 0) { var dx = x - piv[0]; X = piv[0] + dx * Math.cos(th) - y * Math.sin(th); Y = dx * Math.sin(th) + y * Math.cos(th); }
        if (D > 0) { var c = coil(i, s > 0); X = X + (c[0] - X) * D; Y = Y + (c[1] - Y) * D; z = z + (c[2] - z) * D; }
        var col = s > 0 ? (p[2] > 0 ? 0x845ef7 : 0x7048e8) : (p[2] > 0 ? 0x4c6ef5 : 0x3b5bdb); if (o.allo && s > 0 && Y > 1.0 && Math.abs(X - 0.8) < 0.8) col = 0xa9a0ff;
        r.sphere([X + o.cx, Y + o.cy, z + o.cz], p[3] * (o.sc || 1), col, o.op);
      });
    });
    if (D < 0.2) resid.forEach(function (q) { r.sphere([q[0] + o.cx, q[1] - 0.05 + o.cy, q[2] + o.cz], 0.16, o.pulse ? 0xffe066 : 0xffd43b); });
  }
  /* ----- ciclo catalítico ----- */
  function cycleState(p, model, wrong, inh) {
    var open = 0.42, closed = model === 'llave' ? 0.14 : 0.09, theta = open, bind = 0, bondL = 0.7, state = 'E + S', sub = [3.8, 2.6, 0.8], prod = 0, tsGlow = 0, pulse = false;
    if (model === 'llave') open = 0.18;
    var blocked = inh === 'comp', allo = inh === 'nocomp';
    if (wrong) { // sustrato incorrecto: no encaja
      var a = sm(p / 0.45); sub = [3.8 - a * 2.1, 2.6 - a * 1.8, 0.8 - a * 0.5]; if (p > 0.45) { var b = sm((p - 0.45) / 0.35); sub = [1.7 + b * 2.4, 0.8 + b * 1.9, 0.3 + b * 0.5]; } theta = model === 'llave' ? 0.18 : 0.3; return { theta: theta, sub: sub, bondL: 1.0, split: 0, state: p > 0.2 && p < 0.65 ? "does not bind (does not fit)" : 'E + S', wrongSub: true, pulse: false, ts: 0 };
    }
    if (blocked) { var a2 = sm(p / 0.45); sub = [3.8 - a2 * 2.3, 2.6 - a2 * 1.8, 0.8 - a2 * 0.5]; if (p > 0.45) { var b2 = sm((p - 0.45) / 0.4); sub = [1.5 + b2 * 2.5, 0.8 + b2 * 1.9, 0.3 + b2 * 0.5]; } return { theta: open, sub: sub, bondL: 0.7, split: 0, state: "EI (occupied site)", pulse: false, ts: 0, inhib: 'comp' }; }
    var split = 0, ts = 0, st = 'E + S', th, subp;
    if (p < 0.25) { var a3 = sm(p / 0.25); subp = [3.8 * (1 - a3), 2.6 * (1 - a3), 0.8 * (1 - a3)]; th = open; st = 'E + S'; }
    else if (p < 0.4) { var a4 = sm((p - 0.25) / 0.15); subp = [0, 0, 0]; th = open + (allo ? 0.5 * 0 : 0) + (closed - open) * a4; if (allo) th = open + (0.3 - open) * 0 + (0.26 - open) * a4; st = 'ES'; }
    else if (p < 0.65) { var a5 = sm((p - 0.4) / 0.25); subp = [0, 0, 0]; th = allo ? 0.26 : closed; bondL = 0.7 + (allo ? 0.05 : 0.55) * a5; ts = allo ? 0 : sin1(a5); st = allo ? "ES (inhibited)" : "transition state ES‡"; pulse = !allo; }
    else if (p < 0.75) { var a6 = sm((p - 0.65) / 0.1); subp = [0, 0, 0]; th = allo ? 0.26 + (open - 0.26) * a6 : closed + (open - closed) * 0.4 * a6; if (allo) { split = 0; bondL = 0.75 - 0.05 * a6; st = "ES (inhibited)"; } else { split = a6; bondL = 1.25 + a6; st = 'EP'; } }
    else { var a7 = sm((p - 0.75) / 0.25); th = allo ? open + (0.26 - open) * 0 : (closed + (open - closed) * 0.4) + (open - (closed + (open - closed) * 0.4)) * a7; if (allo) { subp = [3.8 * a7, 2.6 * a7, 0.8 * a7]; st = 'E + S'; split = 0; bondL = 0.7; } else { split = 1; bondL = 2.4 + a7 * 5; subp = [0, 0, 0]; st = 'E + P'; } }
    return { theta: th, sub: subp, bondL: bondL, split: split, state: st, ts: ts, pulse: pulse, inhib: allo ? 'nocomp' : null };
    function sin1(x) { return Math.sin(Math.PI * x); }
  }
  function drawSubstrate(r, c, o, wrong) {
    var s = o.sub, split = o.split, L = o.bondL;
    if (wrong) { var A = [s[0] - 0.55, s[1], s[2]], B = [s[0] + 0.55, s[1], s[2]], C = [s[0], s[1] + 0.9, s[2]]; [A, B, C].forEach(function (q) { r.sphere([q[0] + c[0], q[1] + c[1], q[2] + c[2]], 0.5, 0xf08c00); }); r.line(A, B, 0.06, 0xbfc7d1); return; }
    var tsMix = o.ts || 0, colA = 0x4dabf7, colB = 0x38d9a9; if (tsMix > 0.1) { colA = 0xff922b; colB = 0xff6b6b; }
    if (split > 0.5 && !(o.inhib === 'nocomp')) { var gap = Math.min(L, 8); var pa = [-gap / 2 * 0.5 + 0, 0.4 + (split >= 1 ? (L - 2.4) * 0.6 : 0), 0], pb = [gap / 2 * 0.5, 0.4 + (split >= 1 ? (L - 2.4) * 0.6 : 0), 0]; pa = [-L * 0.5, (L > 2.4 ? (L - 2.4) * 0.5 : 0), 0.2 * 0]; pb = [L * 0.5, (L > 2.4 ? (L - 2.4) * 0.5 : 0), 0]; r.sphere([pa[0] + c[0], pa[1] + c[1], pa[2] + c[2]], 0.3, 0x4dabf7); r.sphere([pb[0] + c[0], pb[1] + c[1], pb[2] + c[2]], 0.3, 0x38d9a9); return; }
    var pa2 = [s[0] - L / 2, s[1], s[2]], pb2 = [s[0] + L / 2, s[1], s[2]]; r.sphere([pa2[0] + c[0], pa2[1] + c[1], pa2[2] + c[2]], 0.3, colA); r.sphere([pb2[0] + c[0], pb2[1] + c[1], pb2[2] + c[2]], 0.3, colB); r.line([pa2[0] + c[0], pa2[1] + c[1], pa2[2] + c[2]], [pb2[0] + c[0], pb2[1] + c[1], pb2[2] + c[2]], L > 1.0 ? 0.03 : 0.06, L > 1.0 ? 0xff6b6b : 0xbfc7d1, L > 1.1 ? 0.6 : 1);
  }
  /* ----- población (Michaelis–Menten) ----- */
  function mmInit() { G.E = []; for (var i = 0; i < NE; i++) G.E.push({ x: -3.0 + (i % 4) * 2.0, y: (i < 4 ? 1.2 : -1.2), z: (rnd(i, 7) - 0.5) * 1.6, st: 0, t: 0, sub: null }); G.Sp = []; G.Pp = []; G.ev = []; G.mt = 0; G.lastS = S.S; G.lastChange = 0; G.pts = G.pts || {}; for (var k = 0; k < 90; k++) G.Sp.push(newS()); }
  function newS() { return { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 4.6, z: (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), vz: (Math.random() - 0.5), bound: null, fly: 0 }; }
  function mmStep(dt) {
    G.mt += dt; var nS = Math.round(S.S), free = G.Sp.filter(function (s) { return !s.bound; }); while (G.Sp.length < 90) G.Sp.push(newS());
    G.Sp.forEach(function (s, i) { s.act = i < nS; });
    G.Sp.forEach(function (s) { if (s.bound) { return; } s.vx += (Math.random() - 0.5) * 8 * dt; s.vy += (Math.random() - 0.5) * 8 * dt; s.vz += (Math.random() - 0.5) * 8 * dt; var sp = Math.hypot(s.vx, s.vy, s.vz); if (sp > 1.5) { s.vx *= 1.5 / sp; s.vy *= 1.5 / sp; s.vz *= 1.5 / sp; } s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; if (Math.abs(s.x) > 4) s.vx *= -1; if (Math.abs(s.y) > 2.3) s.vy *= -1; if (Math.abs(s.z) > 2) s.vz *= -1; s.x = Math.max(-4.05, Math.min(4.05, s.x)); s.y = Math.max(-2.35, Math.min(2.35, s.y)); s.z = Math.max(-2.05, Math.min(2.05, s.z)); });
    var avail = G.Sp.filter(function (s) { return s.act && !s.bound; });
    G.E.forEach(function (e) {
      if (e.st === 0) { if (S.inh !== 'none' && S.I > 0 && Math.random() < 0.5 * S.I * dt * 0.12 * 1.0) { e.st = 2; return; } if (avail.length && Math.random() < KON * nS * dt) { var best = null, bd = 1e9; avail.forEach(function (s) { var d = (s.x - e.x) * (s.x - e.x) + (s.y - e.y) * (s.y - e.y) + (s.z - e.z) * (s.z - e.z); if (d < bd && !s.bound) { bd = d; best = s; } }); if (best) { best.bound = e; best.fly = 0; e.sub = best; e.st = 1; avail.splice(avail.indexOf(best), 1); } } }
      else if (e.st === 1) { if (S.inh === 'nocomp' && S.I > 0 && Math.random() < 0.5 * S.I * dt * 0.12) { e.sub.bound = null; e.sub.vx = (Math.random() - 0.5) * 2; e.sub = null; e.st = 2; return; } var r = Math.random(); if (r < KCAT * dt) { var s = e.sub; G.Pp.push({ x: e.x, y: e.y + 0.4, z: e.z, vy: 0.8, life: 1.2 }); s.bound = null; s.x = (Math.random() - 0.5) * 8; s.y = (Math.random() - 0.5) * 4.6; s.z = (Math.random() - 0.5) * 4; e.sub = null; e.st = 0; G.ev.push(G.mt); } else if (r < (KCAT + KOFF) * dt) { e.sub.bound = null; e.sub.vx = (Math.random() - 0.5) * 2; e.sub = null; e.st = 0; } }
      else if (e.st === 2) { if (Math.random() < KI * 0.5 * 0.12 * dt) { e.st = 0; } }
    });
    G.Pp.forEach(function (p) { p.life -= dt; p.y += p.vy * dt; }); G.Pp = G.Pp.filter(function (p) { return p.life > 0; });
    while (G.ev.length && G.ev[0] < G.mt - 8) G.ev.shift();
    if (nS !== G.lastS) { G.lastS = nS; G.lastChange = G.mt; }
    G.rate = G.ev.length / Math.min(8, Math.max(1, G.mt - G.lastChange)) * (G.mt - G.lastChange < 8 ? 1 : 1);
    if (G.mt - G.lastChange > 9) { G.pts[nS + (S.inh === 'none' ? '' : S.inh + Math.round(S.I))] = { s: nS, v: G.ev.length / 8, k: S.inh, i: S.I }; }
  }
  /* ----- escena ----- */
  function sceneBuild(ctx) { var T = ctx.T; if (G.g) ctx.scene.remove(G.g); G.g = new T.Group(); G.pool = new T.Group(); G.g.add(G.pool); G.r = BP.mk(ctx, G.pool); ctx.scene.add(G.g); }
  function STG() { return [
    ["Active site", "Active site", "The enzyme recognizes its substrate by shape and chemistry", "<p>An enzyme binds the <b>substrate</b> at its <b>active site</b>. <b>Lock-and-key</b> model: the active site is already complementary; <b>induced fit</b> model: the enzyme <b>reshapes</b> itself on binding the substrate. A wrongly shaped substrate <b>does not fit</b>: that is enzyme <b>specificity</b>.</p>"],
    ["Catalytic cycle", "Cycle", 'E + S ⇌ ES → ES‡ → EP → E + P', "<p>The <b>enzyme–substrate complex (ES)</b> forms; the catalytic residues <b>strain</b> the bond up to the <b>transition state ES‡</b>; the bond breaks and the <b>products</b> leave. The enzyme remains <b>intact</b> and ready for another cycle.</p>"],
    ["Activation energy", "Energy", "The enzyme lowers the barrier, it does not change ΔG", "<p>Catalysis <b>lowers the activation energy</b> (from ≈ 75 to ≈ 45 kJ/mol) by stabilizing the transition state; the <b>rate increases ≈ 10⁵-fold</b> (e^{ΔΔG‡/RT}). The enzyme <b>does not change</b> the ΔG of the reaction or the equilibrium.</p>"],
    ['Michaelis–Menten', 'Michaelis', 'v = Vmax·[S]/(Km + [S])', "<p>With a fixed enzyme concentration, the <b>rate</b> rises with [S] and <b>saturates</b> when all enzymes are occupied (<b>Vmax = kcat·[E]ₜ</b>). <b>Km</b> is the [S] at which v = Vmax/2. Here each enzyme binds, converts and releases substrates at random; the actual rate is measured.</p>"],
    ["Inhibition", "Inhibition", "Competitive: raises Km; noncompetitive: lowers Vmax", "<p>A <b>competitive</b> inhibitor occupies the active site (<b>apparent Km ↑, Vmax unchanged</b>; overcome with more substrate). A <b>noncompetitive</b> inhibitor binds to another site (<b>allosteric</b>) and deforms the enzyme (<b>Vmax ↓, Km unchanged</b>). In Lineweaver–Burk: the lines intersect on the y axis (competitive) or on the x axis (noncompetitive).</p>"],
    ["pH and temperature", "pH and T", "Each enzyme has an optimum; outside it, it denatures", "<p>Activity depends on the <b>pH</b> (ionization state of the residues) and on the <b>temperature</b> (it increases ≈ ×2 for every 10 °C until the protein <b>denatures</b>). On unfolding the active site is lost: the loss is largely <b>irreversible</b>.</p>"]
  ]; }
  function lessonSet(i, loc) {
    S.inh = 'none'; S.wrong = false; S.model = 'ajuste'; S.mode = 'cyc'; S.I = 0;
    if (i === 0) { var q = Math.min(3, Math.floor(loc * 4)); S.model = q < 2 ? 'llave' : 'ajuste'; S.wrong = (q % 2) === 1; S.p = (loc * 4) % 1; }
    if (i === 1 || i === 2) { S.p = (loc * 2) % 1; }
    if (i === 3) { S.mode = 'mm'; S.S = [3, 7, 15, 30, 60][Math.min(4, Math.floor(loc * 5))]; }
    if (i === 4) { S.inh = loc < 0.5 ? 'comp' : 'nocomp'; S.p = (loc * 4) % 1; }
    if (i === 5) { S.mode = 'den'; S.T = 25 + 70 * loc; S.pH = 7.4 + 0 * loc; S.enz = 'amil'; }
  }
  var def = {
    key: 'enzimas-cinetica', title: "Enzymes and Enzyme Kinetics", subtitle: "3D Simulator · biomolecules", accent: { dark: '#a3e635', light: '#4d7c0f' }, stages: STG, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 2, 12], target: [0, 0.2, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 13], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 13, 0.5], target: [0, 0, 0] }],
    layers: [{ id: 'lab', label: "Molecules", icon: '◉' }, { id: 'spin', label: "Rotate", icon: '⟳' }],
    build: function (ctx) { sceneBuild(ctx); G.now = 0; mmInit(); labs.t = ctx.label('', 'bl-lead'); labs.l = []; for (var i = 0; i < 8; i++) labs.l.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      dt = Math.min(dt, 0.05); if (!ctx.P.manual) lessonSet(f.i, f.local); G.now += dt; var T = ctx.T, r = G.r, L = labs.l; L.forEach(function (l) { l.vis(false); }); labs.t.vis(false); r.begin();
      if (S.mode === 'cyc') {
        if (ctx.P.manual && S.auto) { S.p = (S.p + dt / 8) % 1; }
        var st = cycleState(S.p, S.model, S.wrong, S.inh); G.st = st; var sp = ctx.layer('spin'); G.g.rotation.y = sp ? 0.35 * Math.sin(G.now * 0.4) : 0;
        drawEnzyme(r, { theta: st.theta, cx: 0, cy: 0, cz: 0, pulse: st.pulse, allo: S.inh === 'nocomp' });
        if (S.inh === 'comp') { var ib = [0, 0, 0]; r.box(ib, [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.8, 0.5, 0.6], 0x40c057); }
        if (S.inh === 'nocomp') { r.box([0.8, 2.15, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.7, 0.45, 0.5], 0x40c057); }
        if (S.inh !== 'comp' || true) drawSubstrate(r, [0, 0, 0], { sub: st.sub, bondL: st.bondL, split: st.split, ts: st.ts, inhib: st.inhib }, st.wrongSub);
        labs.t.pos(0, 3.7, 0).set(S.model === 'llave' ? "Lock-and-key model" : "Induced fit", 'bl-lead').vis(true);
        L[0].pos(0.0, -2.9, 0).set('estado: ' + st.state, 'bl-d').vis(true); L[1].pos(-0.0, -0.6, 1.9).set("active site", 'bl-d').vis(true);
        if (S.inh === 'comp') L[2].pos(1.4, 0.7, 0).set("competitive inhibitor", 'bl-d').vis(true); if (S.inh === 'nocomp') L[2].pos(1.5, 2.9, 0).set("noncompetitive inhibitor (allosteric site)", 'bl-d').vis(true);
        if (st.split >= 1) { L[3].pos(-1.2, 1.8, 0).set('P₁', 'bl-d').vis(true); L[4].pos(3.4, 3.4, 0).set('P₂', 'bl-d').vis(true); }
        if (st.sub && (S.p < 0.2)) L[5].pos(st.sub[0] + 0.3, st.sub[1] + 0.8, st.sub[2]).set(st.wrongSub ? "wrong substrate" : 'S', 'bl-d').vis(true);
      } else if (S.mode === 'mm') {
        if (!G.E) mmInit(); mmStep(dt); G.g.rotation.y = 0;
        G.E.forEach(function (e, i) { var col = e.st === 2 ? 0x40c057 : (e.st === 1 ? 0xff922b : 0x7048e8); r.sphere([e.x - 0.25, e.y, e.z], 0.46, col); r.sphere([e.x + 0.25, e.y, e.z], 0.46, e.st === 2 ? 0x2f9e44 : 0x5f3dc4); r.sphere([e.x, e.y + 0.38, e.z + 0.2], 0.17, 0xffd43b); if (e.st === 2 && S.inh === 'comp') r.box([e.x, e.y + 0.4, e.z + 0.35], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.3, 0.2, 0.25], 0x40c057); if (e.st === 2 && S.inh === 'nocomp') r.box([e.x, e.y - 0.6, e.z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.35, 0.22, 0.3], 0x40c057); });
        G.Sp.forEach(function (s) { if (s.bound) { s.fly = Math.min(1, s.fly + dt * 4); var e = s.bound; s.x += (e.x - s.x) * s.fly * 0.3; s.y += (e.y + 0.45 - s.y) * s.fly * 0.3; s.z += (e.z + 0.2 - s.z) * s.fly * 0.3; r.sphere([s.x, s.y, s.z], 0.17, 0xff922b); } else if (s.act) r.sphere([s.x, s.y, s.z], 0.15, 0x4dabf7); });
        G.Pp.forEach(function (p) { r.sphere([p.x, p.y, p.z], 0.16, 0x51cf66, Math.min(1, p.life)); });
        if (S.inh !== 'none') { var ni = Math.round(S.I / 3); for (var k = 0; k < ni; k++) r.box([Math.sin(G.now * 0.5 + k * 2.1) * 3.6, Math.cos(G.now * 0.4 + k * 1.3) * 2.0, Math.sin(G.now * 0.3 + k) * 1.8], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.2, 0.2, 0.2], 0x40c057); }
        labs.t.pos(0, 3.4, 0).set('[S] = ' + Math.round(S.S) + " · measured v = " + fmt(G.rate || 0, 1) + ' (Vmax ' + fmt(S.inh === 'nocomp' ? VMAX / (1 + S.I / KI) : VMAX, 1) + ')', 'bl-lead').vis(true);
        L[0].pos(-3.0, 2.0, 0).set("enzymes (8)", 'bl-d').vis(true);
      } else {
        var D = denat(S.T, S.pH, S.enz), ac = actPH(S.pH, S.enz) * actT(S.T, S.enz) * (1 - D) ; G.D = D; G.g.rotation.y = 0.4 * Math.sin(G.now * 0.3);
        drawEnzyme(r, { theta: 0.14 + 0.4 * D, cx: 0, cy: 0, cz: 0, D: D, pulse: D < 0.2 }); if (D < 0.3) drawSubstrate(r, [0, 0, 0], { sub: [0, 0, 0], bondL: 0.7, split: 0, ts: 0 });
        labs.t.pos(0, 3.7, 0).set(ENZ[S.enz].n + ' · ' + fmt(S.T, 0) + ' °C · pH ' + fmt(S.pH, 1) + ' · ' + fmt(D * 100, 0) + " % denatured", 'bl-lead').vis(true);
        if (D > 0.5) L[0].pos(0, -3.0, 0).set("unfolded protein: active site lost", 'bl-warn').vis(true);
      }
      r.end();
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; };
      if (S.mode === 'mm') { var vt = vmm(S.S, S.I, S.inh); return { eq: { chip: 'v', name: 'Michaelis–Menten', body: row('[S]', Math.round(S.S) + ' mM') + row("measured v", fmt(G.rate || 0, 1)) + row("theoretical v", fmt(vt, 1)) }, legend: [{ label: 'E', color: '#7048e8', text: "free enzyme" }, { label: 'ES', color: '#ff922b', text: "complex" }, { label: 'S', color: '#4dabf7', text: 'sustrato' }, { label: 'P', color: '#51cf66', text: "product" }, { label: 'I', color: '#40c057', text: "inhibitor" }] }; }
      if (S.mode === 'den') { var D = denat(S.T, S.pH, S.enz); return { eq: { chip: "Activity", name: ENZ[S.enz].n, body: row("Denatured", fmt(D * 100, 0) + ' %') + row("pH factor", fmt(actPH(S.pH, S.enz) * 100, 0) + ' %') + row("T factor", fmt(actT(S.T, S.enz) * (1 - D) * 100 / 1.0, 0) + ' %') }, legend: [{ label: 'E', color: '#4c6ef5', text: "folded enzyme" }, { label: 'S', color: '#4dabf7', text: 'sustrato' }] }; }
      var st = G.st || { state: '' }; return { eq: { chip: 'ES', name: S.model === 'llave' ? "lock-and-key" : "induced fit", body: row("State", st.state) + row("Substrate", S.wrong ? "wrong" : "specific") + row("Inhibitor", { none: "none", comp: "competitive", nocomp: "noncompetitive" }[S.inh]) }, legend: [{ label: 'E', color: '#4c6ef5', text: "enzyme (2 lobes)" }, { label: 'S', color: '#4dabf7', text: "substrate A–B" }, { label: 'Cat', color: '#ffd43b', text: "catalytic residues" }, { label: 'I', color: '#40c057', text: "inhibitor" }] }; },
    measures: function () { var kp = vmm(S.S, S.I, S.inh); return [['Km', fmt(S.inh === 'comp' ? KM * (1 + S.I / KI) : KM, 1) + ' mM'], ['Vmax', fmt(S.inh === 'nocomp' ? VMAX / (1 + S.I / KI) : VMAX, 1) + ' mM/s'], ['kcat', fmt(KCAT, 1) + ' s⁻¹'], ['kcat/Km', fmt(KCAT / KM, 3) + ' mM⁻¹s⁻¹'], ['[S]', Math.round(S.S) + ' mM'], ["v (theoretical)", fmt(kp, 2) + ' mM/s'], ["Enzyme (pH, T)", ENZ[S.enz].n + ' (' + fmt(S.pH, 1) + ', ' + fmt(S.T, 0) + ' °C)']]; },
    ideas: ["The enzyme <b>lowers Ea</b>; it does not change ΔG or the equilibrium.", "Lower <b>Km</b> ⇒ higher affinity for the substrate.", "Competitive: <b>Km ↑, Vmax =</b>; noncompetitive: <b>Km =, Vmax ↓</b>.", "Each enzyme has an <b>optimal pH and T</b>; outside them it denatures.", "In Lineweaver–Burk 1/v = (Km/Vmax)(1/[S]) + 1/Vmax."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Scene"); el.appendChild(c);
      ui.mode = kit.ui.options({ label: "What to show", cols: 3, value: S.mode, options: [{ v: 'cyc', label: "Cycle" }, { v: 'mm', label: "Population" }, { v: 'den', label: "pH and T" }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.model = kit.ui.options({ label: "Binding model", cols: 2, value: S.model, options: [{ v: 'llave', label: "Lock-and-key" }, { v: 'ajuste', label: "Induced fit" }], onChange: function (v) { ctx.goManual(); S.mode = 'cyc'; S.model = v; } }); c.appendChild(ui.model);
      ui.wrong = kit.ui.options({ label: "Substrate", cols: 2, value: S.wrong ? 'x' : 'ok', options: [{ v: 'ok', label: "Specific" }, { v: 'x', label: "Wrong" }], onChange: function (v) { ctx.goManual(); S.mode = 'cyc'; S.wrong = v === 'x'; } }); c.appendChild(ui.wrong);
      ui.inh = kit.ui.options({ label: "Inhibitor", cols: 3, value: S.inh, options: [{ v: 'none', label: "Neither" }, { v: 'comp', label: "Competitive" }, { v: 'nocomp', label: "Noncompetitive" }], onChange: function (v) { ctx.goManual(); S.inh = v; if (v !== 'none' && S.I === 0) { S.I = 20; ui.I.set(20); } } }); c.appendChild(ui.inh);
      ui.p = kit.ui.slider({ label: "Cycle progress", min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'cyc'; S.auto = false; S.p = v / 100; } }); ui.S = kit.ui.slider({ label: '[S]', min: 1, max: 60, step: 1, value: S.S, format: function (v) { return v + ' mM'; }, onInput: function (v) { ctx.goManual(); S.mode = 'mm'; S.S = v; } }); ui.I = kit.ui.slider({ label: '[I]', min: 0, max: 40, step: 1, value: 0, format: function (v) { return v + ' mM'; }, onInput: function (v) { ctx.goManual(); S.I = v; } }); c.appendChild(kit.ui.sliders([ui.p, ui.S, ui.I]));
      ui.enz = kit.ui.options({ label: "Enzyme", cols: 3, value: S.enz, options: Object.keys(ENZ).map(function (k) { return { v: k, label: ENZ[k].n.split(' ')[0], sub: 'pH ' + ENZ[k].pH }; }), onChange: function (v) { ctx.goManual(); S.mode = 'den'; S.enz = v; S.pH = ENZ[v].pH; S.T = ENZ[v].Topt; ui.pH.set(S.pH); ui.T.set(S.T); } }); c.appendChild(ui.enz);
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.1, value: S.pH, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'den'; S.pH = v; } }); ui.T = kit.ui.slider({ label: "Temperature", min: 0, max: 100, step: 1, value: S.T, format: function (v) { return v + ' °C'; }, onInput: function (v) { ctx.goManual(); S.mode = 'den'; S.T = v; } }); c.appendChild(kit.ui.sliders([ui.pH, ui.T]));
      c.appendChild(ctx.btnRow([{ t: "Reset population", fn: function () { mmInit(); } }, { t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var lk = ''; ui.refresh = function () { var k = [S.mode, S.model, S.wrong, S.inh, Math.round(S.S), Math.round(S.I), S.enz, Math.round(S.T), Math.round(S.pH * 10)].join('|'); if (k === lk) return; lk = k; ui.mode.set(S.mode); ui.model.set(S.model); ui.wrong.set(S.wrong ? 'x' : 'ok'); ui.inh.set(S.inh); ui.S.set(Math.round(S.S)); ui.I.set(Math.round(S.I)); ui.enz.set(S.enz); ui.pH.set(S.pH); ui.T.set(Math.round(S.T)); };
      var q = kit.ui.card("Challenge: identify the inhibitor"); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, sc = [0, 0];
      function nextQ() { var kind = Math.random() < 0.5 ? 'comp' : 'nocomp', I = 20 + Math.floor(Math.random() * 20); cur = { kind: kind, I: I, k1: KM * (kind === 'comp' ? 1 + I / KI : 1), v1: kind === 'nocomp' ? VMAX / (1 + I / KI) : VMAX }; draw(''); }
      function draw(msg) { var h = "<p class=\"small\">Correct: <b>" + sc[0] + '</b> / ' + sc[1] + '</p>'; if (cur) h += "<p class=\"small\">Without inhibitor: Km = " + KM + ' mM, Vmax = ' + VMAX + ".<br>With inhibitor: Km = <b>" + fmt(cur.k1, 1) + '</b> mM, Vmax = <b>' + fmt(cur.v1, 1) + "</b>.<br>What type of inhibition is it?</p>"; if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; var w = document.createElement('div'); w.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap'; [['comp', "Competitive"], ['nocomp', "Noncompetitive"]].forEach(function (o) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = o[1]; b.onclick = function () { if (!cur) { kit.toast("Press “New question”"); return; } sc[1]++; var ok = cur.kind === o[0]; if (ok) sc[0]++; var r = cur; cur = null; draw(ok ? "Correct!" : 'No: Km ' + (r.kind === 'comp' ? "↑ and Vmax unchanged → competitive" : "unchanged and Vmax ↓ → noncompetitive")); }; w.appendChild(b); }); qb.appendChild(w); qb.appendChild(ctx.btnRow([{ t: "New question", primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: "Michaelis–Menten kinetics", h: 240, note: "v versus [S]: theoretical curve (with the chosen inhibitor) and points measured in the simulation (leave a [S] value stable for ≈ 9 s).", draw: function (cx, w, h, c) {
        var L0 = 34, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (s) { return L0 + pw * s / 60; }, sy = function (v) { return Tp + ph * (1 - v / 9); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var s = 0; s <= 60; s += 10) { cx.beginPath(); cx.moveTo(sx(s), Tp); cx.lineTo(sx(s), Tp + ph); cx.stroke(); cx.fillText(s, sx(s), h - B + 12); } cx.fillText('[S] (mM)', L0 + pw / 2, h - 2); cx.textAlign = 'right'; for (var v = 0; v <= 8; v += 2) { cx.beginPath(); cx.moveTo(L0, sy(v)); cx.lineTo(L0 + pw, sy(v)); cx.stroke(); cx.fillText(v, L0 - 4, sy(v) + 3); }
        [[ 'none', 0, '#4c8dff', "without inhibitor"], [S.inh, S.I, '#e8590c', "with inhibitor"]].forEach(function (cfg, k) { if (k === 1 && (S.inh === 'none' || S.I === 0)) return; cx.strokeStyle = cfg[2]; cx.lineWidth = 2.2; cx.beginPath(); for (var s2 = 0; s2 <= 60; s2 += 1) { var px = sx(s2), py = sy(vmm(s2, cfg[1], cfg[0])); if (s2 === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; });
        cx.setLineDash([4, 3]); cx.strokeStyle = c.muted; cx.beginPath(); cx.moveTo(L0, sy(VMAX / 2)); cx.lineTo(sx(KM), sy(VMAX / 2)); cx.lineTo(sx(KM), Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText('Vmax/2', L0 + 4, sy(VMAX / 2) - 4); cx.fillText('Km', sx(KM) + 3, Tp + ph - 4);
        Object.keys(G.pts || {}).forEach(function (k) { var p = G.pts[k]; if (p.k !== S.inh || (S.inh !== 'none' && p.i !== S.I)) return; cx.fillStyle = '#2f9e44'; cx.beginPath(); cx.arc(sx(p.s), sy(p.v), 4, 0, 7); cx.fill(); }); cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(S.S), sy(vmm(S.S, S.I, S.inh)), 5, 0, 7); cx.fill(); } },
      { title: "Lineweaver–Burk (double reciprocals)", h: 240, note: "Competitive: lines intersecting on the y axis (same Vmax); noncompetitive: they intersect on the x axis (same Km).", draw: function (cx, w, h, c) {
        var L0 = 40, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, xmin = -0.2, xmax = 1.0, ymin = -0.1, ymax = 0.9, sx = function (x) { return L0 + pw * (x - xmin) / (xmax - xmin); }, sy = function (y) { return Tp + ph * (1 - (y - ymin) / (ymax - ymin)); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var x = 0; x <= 1; x += 0.25) { cx.beginPath(); cx.moveTo(sx(x), Tp); cx.lineTo(sx(x), Tp + ph); cx.stroke(); cx.fillText(fmt(x, 2), sx(x), h - B + 12); } cx.fillText('1/[S]  (mM⁻¹)', L0 + pw / 2, h - 2); cx.textAlign = 'right'; for (var y = 0; y <= 0.8; y += 0.2) { cx.beginPath(); cx.moveTo(L0, sy(y)); cx.lineTo(L0 + pw, sy(y)); cx.stroke(); cx.fillText(fmt(y, 1), L0 - 4, sy(y) + 3); } cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(sx(0), Tp); cx.lineTo(sx(0), Tp + ph); cx.moveTo(L0, sy(0)); cx.lineTo(L0 + pw, sy(0)); cx.stroke();
        [['none', 0, '#4c8dff', "no I"], ['comp', S.I || 20, '#e8590c', "competitive"], ['nocomp', S.I || 20, '#7048e8', "noncompetitive"]].forEach(function (cfg) { var km = KM * (cfg[0] === 'comp' ? 1 + cfg[1] / KI : 1), vm = VMAX / (cfg[0] === 'nocomp' ? 1 + cfg[1] / KI : 1), sl = km / vm, ic = 1 / vm; cx.strokeStyle = cfg[2]; cx.lineWidth = (cfg[0] === S.inh || cfg[0] === 'none') ? 2.4 : 1.4; cx.setLineDash(cfg[0] === S.inh || cfg[0] === 'none' ? [] : [4, 3]); cx.beginPath(); cx.moveTo(sx(xmin), sy(sl * xmin + ic)); cx.lineTo(sx(xmax), sy(sl * xmax + ic)); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; cx.fillStyle = cfg[2]; cx.textAlign = 'left'; cx.fillText(cfg[3], sx(xmax) - 78, sy(sl * xmax + ic) - 4 - (cfg[0] === 'nocomp' ? 0 : 0)); }); } },
      { title: "Reaction energy profile", h: 230, note: "ΔG‡ without catalyst ≈ 75 kJ/mol; with enzyme ≈ 45 kJ/mol (ES, ES‡, EP). Dot = position in the cycle.", draw: function (cx, w, h, c) {
        var L0 = 40, Tp = 12, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (x) { return L0 + pw * x; }, sy = function (g) { return Tp + ph * (1 - (g + 30) / 120); };
        function curve(pts, col, lw) { cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); for (var t = 0; t <= 1.0001; t += 0.01) { var seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), u = t * (pts.length - 1) - seg, a = pts[seg], b = pts[seg + 1], e = u * u * (3 - 2 * u), px = sx((seg + e) / (pts.length - 1)), py = sy(a + (b - a) * e); if (t === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; }
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var g = -20; g <= 80; g += 20) { cx.beginPath(); cx.moveTo(L0, sy(g)); cx.lineTo(L0 + pw, sy(g)); cx.stroke(); cx.fillText(g, L0 - 4, sy(g) + 3); } cx.textAlign = 'center'; cx.fillText("reaction coordinate", L0 + pw / 2, h - 3);
        curve([0, 0, 75, -20, -20], '#868e96', 2); curve([0, -10, 45, -25, -20, -20], '#2f9e44', 2.4);
        cx.fillStyle = '#868e96'; cx.textAlign = 'left'; cx.fillText("without enzyme (75)", sx(0.42), sy(78)); cx.fillStyle = '#2f9e44'; cx.fillText("with enzyme (45)", sx(0.4), sy(48) - 4); cx.fillText('ES', sx(0.15), sy(-12) + 12); cx.fillText('ES‡', sx(0.37), sy(44) + 12); cx.fillText('EP', sx(0.62), sy(-26) + 12);
        var p = S.mode === 'cyc' ? S.p : 0, t = Math.min(0.999, p), seg2 = 0; var pts = [0, -10, 45, -25, -20, -20], ts = [0, 0.15, 0.4, 0.62, 0.78, 1]; var gg = 0, xx = 0; for (var i = 0; i < ts.length - 1; i++) if (p >= ts[i] && p <= ts[i + 1]) { var u = (p - ts[i]) / (ts[i + 1] - ts[i]); u = u * u * (3 - 2 * u); gg = pts[i] + (pts[i + 1] - pts[i]) * u; xx = (i + u) / (ts.length - 1); break; } cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(xx), sy(gg), 5, 0, 7); cx.fill(); } },
      { title: "Activity versus pH and temperature", h: 250, note: "Top: pH profile; bottom: temperature (increases ≈ ×2 per 10 °C and falls on denaturation).", draw: function (cx, w, h, c) {
        var L0 = 34, B = 20, half = (h - 14) / 2;
        function panel(y0, xmin, xmax, fn, cur, lab, col, step) { var pw = w - L0 - 12, ph = half - 24, sx = function (x) { return L0 + pw * (x - xmin) / (xmax - xmin); }, sy = function (a) { return y0 + 8 + ph * (1 - a / 1.9); }; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.font = '10px system-ui'; for (var x = xmin; x <= xmax; x += step) { cx.beginPath(); cx.moveTo(sx(x), y0 + 8); cx.lineTo(sx(x), y0 + 8 + ph); cx.stroke(); cx.fillText(x, sx(x), y0 + ph + 20); } cx.textAlign = 'left'; cx.fillText(lab, L0 + 4, y0 + 18); cx.strokeStyle = col; cx.lineWidth = 2.2; cx.beginPath(); for (var xx = xmin; xx <= xmax; xx += (xmax - xmin) / 120) { var px = sx(xx), py = sy(fn(xx)); if (xx === xmin) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(cur), sy(fn(cur)), 5, 0, 7); cx.fill(); }
        panel(0, 0, 14, function (x) { return actPH(x, S.enz); }, S.pH, 'pH · ' + ENZ[S.enz].n, '#4c8dff', 2); panel(half + 6, 0, 100, function (x) { var d = denat(x, ENZ[S.enz].pH, S.enz); return actT(x, S.enz) * (1 - d); }, S.T, 'T (°C)', '#e8590c', 20); } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, km = S.inh === 'comp' ? KM * (1 + S.I / KI) : KM, vm = S.inh === 'nocomp' ? VMAX / (1 + S.I / KI) : VMAX, v = vm * S.S / (km + S.S), D = denat(S.T, S.pH, S.enz), RT = 0.008314 * 310;
      return '<div class="card-kicker">Michaelis–Menten · [E]ₜ = ' + NE + " (a.u.)</div><div class=\"calc-step\">1 · Parameters</div><table class=\"calc-table\">" + row("Apparent Km", fmt(km, 1) + ' mM' + (S.inh === 'comp' ? ' = Km(1 + [I]/Ki)' : '')) + row("Apparent Vmax", fmt(vm, 1) + ' mM/s' + (S.inh === 'nocomp' ? ' = Vmax/(1 + [I]/Ki)' : '')) + row('kcat = Vmax/[E]ₜ', fmt(KCAT, 2) + ' s⁻¹') + row('kcat/Km', fmt(KCAT / KM, 3) + ' mM⁻¹ s⁻¹') + "</table><div class=\"calc-step\">2 · Rate at [S] = " + Math.round(S.S) + ' mM</div><table class="calc-table">' + row('v = Vmax[S]/(Km + [S])', fmt(v, 2) + ' mM/s') + row('v / Vmax', fmt(v / vm * 100, 0) + ' %') + row("Saturation (ES/[E]ₜ)", fmt(S.S / (km + S.S) * 100, 0) + ' %') + "</table><div class=\"calc-step\">3 · Catalysis</div><table class=\"calc-table\">" + row('ΔΔG‡', '75 − 45 = 30 kJ/mol') + row("Acceleration e^(ΔΔG‡/RT), 37 °C", '≈ ' + fmt(Math.exp(30 / RT), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '×') + row("Denatured fraction", fmt(D * 100, 0) + ' %') + '</table>'; },
    calcLabel: "Kinetics",
    quiz: [
      { q: "An enzyme increases the reaction rate because it…", options: ["lowers the activation energy", "raises the temperature", "changes the ΔG of the reaction", "is consumed in the reaction"], answer: 0, why: "It stabilizes the transition state; it does not alter ΔG or the equilibrium and it is regenerated." },
      { q: "Km is…", options: ["the [S] at which v = Vmax/2", "the maximum rate", "the enzyme concentration", "the equilibrium constant"], answer: 0, why: "A lower Km indicates higher affinity for the substrate." },
      { q: "A competitive inhibitor…", options: ["increases Km and does not change Vmax", "decreases Vmax and does not change Km", "decreases Km and Vmax", "increases Vmax"], answer: 0, why: "It competes for the active site; with a lot of substrate Vmax is reached anyway." },
      { q: "In a Lineweaver–Burk plot, the y-intercept is…", options: ['1/Vmax', 'Km', '−1/Km', 'Vmax'], answer: 0, why: "1/v = (Km/Vmax)(1/[S]) + 1/Vmax; the slope is Km/Vmax." },
      { q: "Denaturation of an enzyme by heat…", options: ["destroys its structure and the active site", "only breaks peptide bonds", "increases the activity", "changes the amino acid sequence"], answer: 0, why: "The weak interactions that maintain the folding are broken; the sequence (primary structure) does not change." },
      { q: "When [S] ≫ Km, the rate…", options: ["approaches Vmax (zero order with respect to S)", "is proportional to [S]", "tends to zero", "depends only on pH"], answer: 0, why: "All enzymes are saturated: v ≈ Vmax = kcat[E]ₜ." },
      { q: "In the induced-fit model…", options: ["the enzyme changes shape on binding the substrate", "the active site is rigid", "the substrate changes shape but the enzyme does not", "there is no specificity"], answer: 0, why: "Substrate binding reshapes the active site to optimize catalysis." },
      { q: "A noncompetitive inhibitor binds…", options: ["to a site other than the active one", "to the active site", "only to the product", "only to the free enzyme without substrate"], answer: 0, why: "It deforms the enzyme and lowers Vmax; Km (affinity) does not change." }
    ],
    help: { intro: "Choose a scene in “Lab”: catalytic cycle, population (Michaelis–Menten) or pH and temperature.", items: [["Cycle", "lock-and-key, induced fit, wrong substrate and inhibitors."], ["Population", "eight enzymes; move [S] and [I] and measure v."], ["pH and T", "denaturation in 3D."], ["Challenge", "classify the inhibitor from Km and Vmax."]] }
  };
  MSim.create(def);
})();
