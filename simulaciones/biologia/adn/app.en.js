/* ADN: estructura, replicación y transcripción — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var BCOL = { A: 0x40c057, T: 0xfa5252, G: 0xfcc419, C: 0x4dabf7, U: 0xff922b }, COMP = { A: 'T', T: 'A', G: 'C', C: 'G' }, RNAC = { A: 'U', T: 'A', G: 'C', C: 'G' };
  var CODE = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG', BORD = 'TCAG';
  var AA3 = { F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', '*': 'Stop', C: 'Cys', W: 'Trp', P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg', I: 'Ile', M: 'Met', T: 'Thr', N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp', E: 'Glu', G: 'Gly' };
  var AACLS = { F: 0, L: 0, I: 0, M: 0, V: 0, W: 0, P: 0, A: 0, G: 0, S: 1, T: 1, C: 1, Y: 1, N: 1, Q: 1, D: 2, E: 2, K: 3, R: 3, H: 3, '*': 4 }, CCOL = ['#f59f00', '#20c997', '#fa5252', '#4c6ef5', '#868e96'];
  function codon(c) { var i = BORD.indexOf(c[0]), j = BORD.indexOf(c[1]), k = BORD.indexOf(c[2]); return CODE[16 * i + 4 * j + k]; }
  var S = { mode: 'helix', seq: 'ATGGCCATTGTAATGGGCCGC', pair: 'AT', prog: 0.5, _st: -1 }, G = {}, labs = {}, key_ = '';
  var R0 = 1.0, RISE = 0.34, TW = 36 * Math.PI / 180, PSI = 150 * Math.PI / 180, C0 = 2 * R0 * Math.sin(PSI / 2);
  function pos(i, n, side) { var th = i * TW + (side ? PSI : 0), y = (i - (n - 1) / 2) * RISE; return [R0 * Math.cos(th), y, -R0 * Math.sin(th)]; }
  function add(a, b, k) { k = k == null ? 1 : k; return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stats(seq) { var c = { A: 0, T: 0, G: 0, C: 0 }; seq.split('').forEach(function (b) { c[b]++; }); var n = seq.length, gc = c.G + c.C, Tm = n < 14 ? 2 * (c.A + c.T) + 4 * gc : 64.9 + 41 * (gc - 16.4) / n, mw = { A: 313.21, C: 289.18, G: 329.21, T: 304.20 }, m1 = seq.split('').reduce(function (s, b) { return s + mw[b]; }, 0) - 61.96, comp = seq.split('').map(function (b) { return COMP[b]; }).join(''), m2 = comp.split('').reduce(function (s, b) { return s + mw[b]; }, 0) - 61.96; return { c: c, n: n, gc: gc / n * 100, Tm: Tm, m1: m1, m2: m2, comp: comp, rc: comp.split('').reverse().join(''), mrna: seq.replace(/T/g, 'U') }; }
  function translate(seq) { var out = []; for (var i = 0; i + 3 <= seq.length; i += 3) { out.push(codon(seq.substr(i, 3))); } return out; }
  /* --- dibujo de un par de bases (placas planas) --- */
  function plate(r, P, Q, base, partner, o) {
    // placa de la base 'base' que parte de P (fosfato) hacia Q; devuelve extremo interno
    var dx = Q[0] - P[0], dz = Q[2] - P[2], L0 = Math.sqrt(dx * dx + dz * dz) || 1, u = [dx / L0, 0, dz / L0], w = [-u[2], 0, u[0]], pur = (base === 'A' || base === 'G'), len = (pur ? 0.55 : 0.40) * C0 * 0.92, st = 0.14, ctr = add(P, u, st + len / 2);
    ctr[1] = P[1] + (o && o.dy || 0); r.box(ctr, u, [0, 1, 0], w, [len, 0.07, pur ? 0.5 : 0.42], BCOL[base], o && o.op); return { u: u, w: w, end: add(P, u, st + len), len: len };
  }
  function drawBP(r, i, n, b1, b2, o) {
    o = o || {}; var P1 = add(pos(i, n, 0), o.o1 || [0, 0, 0]), P2 = add(pos(i, n, 1), o.o2 || [0, 0, 0]), op1 = o.op1, op2 = o.op2;
    var pl1 = o.skip1 ? null : plate(r, P1, P2, b1, b2, { op: op1 }), pl2 = o.skip2 ? null : plate(r, P2, P1, b2, b1, { op: op2 });
    if (pl1 && pl2 && !o.nohb) { var nb = (b1 === 'G' || b1 === 'C') ? 3 : 2, w = pl1.w, e1 = pl1.end, e2 = pl2.end; for (var k = 0; k < nb; k++) { var off = (k - (nb - 1) / 2) * 0.16; r.line(add(e1, w, off), add(e2, w, off), 0.012, 0xffe066, 0.95); } }
    return { P1: P1, P2: P2 };
  }
  function sugar(r, P, col) { var c = [P[0] * 0.8, P[1], P[2] * 0.8]; r.sphere(P, 0.15, 0xffa94d); }
  var CLS_ = ["strand"];
  function buildAll(ctx) { var T = ctx.T; if (G.g) ctx.scene.remove(G.g); G.g = new T.Group(); G.dyn = new T.Group(); G.g.add(G.dyn); G.r = BP.mk(ctx, G.dyn); G.stat = new T.Group(); G.g.add(G.stat); ctx.scene.add(G.g); }
  function poly(ctx, pts, col, depth) { var T = ctx.T, sh = new T.Shape(); pts.forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); }); sh.closePath(); var g = new T.ExtrudeGeometry(sh, { depth: depth || 0.1, bevelEnabled: false }); g.translate(0, 0, -(depth || 0.1) / 2); return new T.Mesh(g, new T.MeshStandardMaterial({ color: col, roughness: 0.5 })); }
  function hexPts(cx, cy, r) { var a = []; for (var k = 0; k < 6; k++) { var t = (30 + 60 * k) * Math.PI / 180; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return a; }
  function pentPts(cx, cy, r) { var a = []; for (var k = 0; k < 5; k++) { var t = (36 + 72 * k) * Math.PI / 180; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return a; }
  function baseMeshes(ctx, base, cx, cy, flip) { var T = ctx.T, g = new T.Group(), pur = base === 'A' || base === 'G', col = BCOL[base], hr = 0.55, xe = hr * Math.cos(Math.PI / 6), s = flip ? -1 : 1;
    var hex = poly(ctx, hexPts(0, 0, hr), col, 0.12); hex.position.set(cx, cy, 0); g.add(hex);
    if (pur) { var pr = hr / (2 * Math.sin(Math.PI / 5)), pc = -(xe + pr * Math.cos(Math.PI / 5)), pt = poly(ctx, pentPts(0, 0, pr), col, 0.12); pt.position.set(cx + pc * s * 1, cy, 0); g.add(pt); if (flip) {} }
    return g; }
  function stageNuc(ctx) {
    var T = ctx.T, g = new T.Group(), sug = poly(ctx, (function () { var a = []; for (var k = 0; k < 5; k++) { var t = (90 - 72 * k) * Math.PI / 180; a.push([0.5 * Math.cos(t), 0.5 * Math.sin(t)]); } return a; })(), 0xffc078, 0.12); g.add(sug);
    var base = baseMeshes(ctx, 'A', 2.1, 0.15, false); g.add(base);
    function ball(x, y, r, col) { var m = new T.Mesh(new T.SphereGeometry(r, 18, 14), new T.MeshStandardMaterial({ color: col, roughness: 0.4 })); m.position.set(x, y, 0); g.add(m); return m; }
    function stick(a, b) { var d = new T.Vector3(b[0] - a[0], b[1] - a[1], 0), L = d.length(), c = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, L, 8), new T.MeshStandardMaterial({ color: 0xbfc7d1 })); c.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(c); }
    var c4 = [0.5 * Math.cos(162 * Math.PI / 180), 0.5 * Math.sin(162 * Math.PI / 180)], c3 = [0.5 * Math.cos(-126 * Math.PI / 180), 0.5 * Math.sin(-126 * Math.PI / 180)], c1 = [0.5 * Math.cos(18 * Math.PI / 180), 0.5 * Math.sin(18 * Math.PI / 180)];
    var c5 = [c4[0] - 0.55, c4[1] + 0.5], ph = [c5[0] - 0.9, c5[1] + 0.35], oh = [c3[0] - 0.4, c3[1] - 0.6];
    ball(c5[0], c5[1], 0.13, 0x56606b); ball(ph[0], ph[1], 0.28, 0xff922b); ball(oh[0], oh[1], 0.16, 0xff4d4d); stick(c4, c5); stick(c5, ph); stick(c3, oh); stick(c1, [1.45, 0.1]);
    [[0.5 * Math.cos(Math.PI / 2), 0.5 * Math.sin(Math.PI / 2), 0xff4d4d, 0.14]].forEach(function (a) { ball(a[0], a[1], a[3], a[2]); });
    g.position.set(-0.8, 0, 0); g.userData = { c5: c5, ph: ph, oh: oh, sugar: [0, 0], base: [2.1, 0.15] }; return g;
  }
  function stagePair(ctx, pair) {
    var T = ctx.T, g = new T.Group(), b1 = pair[0], b2 = pair[1], gap = 0.55, xe = 0.55 * Math.cos(Math.PI / 6), cx = gap / 2 + xe;
    g.add(baseMeshes(ctx, b1, -cx, 0, false)); var right = baseMeshes(ctx, b2, cx, 0, false); g.add(right);
    var nb = pair === 'GC' ? 3 : 2, ys = nb === 3 ? [0.2, 0, -0.2] : [0.14, -0.14];
    var cfg = pair === 'GC' ? [[0xff4d4d, 0x4f7cff], [0x4f7cff, 0x4f7cff], [0x4f7cff, 0xff4d4d]] : [[0x4f7cff, 0xff4d4d], [0x4f7cff, 0x4f7cff]];
    ys.forEach(function (y, i) { var x1 = -gap / 2, x2 = gap / 2, d = x2 - x1; for (var k = 0; k < 5; k++) { var s = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, d / 9, 6), new T.MeshBasicMaterial({ color: 0xffe066 })); s.rotation.z = Math.PI / 2; s.position.set(x1 + d * (k + 0.5) / 5, y, 0); g.add(s); }
      [[x1, cfg[i][0]], [x2, cfg[i][1]]].forEach(function (p) { var sp = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), new T.MeshStandardMaterial({ color: p[1], roughness: 0.4 })); sp.position.set(p[0], y, 0.06); g.add(sp); }); });
    g.userData = { nb: nb, cx: cx }; return g;
  }
  var STG = function () { return [
    ["Nucleotide", "Nucleotide", "Phosphate + deoxyribose + nitrogenous base", "<p>The <b>nucleotide</b> is the unit of DNA: a <b>phosphate group</b> on C5′, <b>deoxyribose</b> (a pentose) and a <b>nitrogenous base</b> bound to C1′ (N-glycosidic bond). Nucleotides are chained by <b>phosphodiester bonds</b> between the 3′-OH of one and the 5′ phosphate of the next: the chain has 5′→3′ polarity.</p>"],
    ["Base pairs", "Pairs", "A=T with 2 H bonds and G≡C with 3", "<p>Each <b>purine</b> (A, G; two rings) pairs with a <b>pyrimidine</b> (T, C; one ring): <b>A–T with 2 H bonds</b> and <b>G–C with 3</b>. All pairs measure the same (≈ 1.08 nm) and that is why the helix is regular. Chargaff's rule: A = T and G = C.</p>"],
    ["B double helix", "Helix", "Two antiparallel strands coiled to the right", "<p><b>B</b> form: <b>right-handed</b> helix with 10 pairs per turn (pitch 3.4 nm; 0.34 nm between pairs), diameter ≈ 2 nm. The strands are <b>antiparallel</b> and the phosphates face outward. Because they are not opposite at 180°, a <b>major groove</b> (≈ 2.2 nm) and a <b>minor groove</b> (≈ 1.2 nm) form, where proteins read the sequence.</p>"],
    ["Replication", "Replication", "Semiconservative: each daughter keeps one original strand", "<p><b>Helicase</b> opens the fork and each strand serves as a <b>template</b>: <b>DNA polymerase</b> adds complementary nucleotides (A–T, G–C) in the 5′→3′ direction. Result: two duplexes, each with one <b style=\"color:#5c7cfa\">old</b> and one <b style=\"color:#ffa94d\">new</b> strand (Meselson and Stahl).</p>"],
    ["Transcription", "Transcription", "RNA polymerase copies the template strand into mRNA", "<p><b>RNA polymerase</b> opens a bubble of ≈ 17 bp and synthesizes <b>mRNA</b> (5′→3′) complementary to the <b>template strand</b>. RNA has <b>uracil</b> instead of thymine and ribose; its sequence matches the <b>coding</b> strand (changing T to U).</p>"],
    ["Genetic code", "Code", "Each codon (3 bases) specifies one amino acid", "<p>The mRNA is read <b>three at a time</b> (codons). There are 64 codons: 61 code for 20 amino acids (<b>degenerate</b> code), AUG is the start (Met) and UAA, UAG, UGA are <b>stop</b> codons. Here the sequence is translated in frame 0.</p>"]
  ]; };
  function lessonSet(i, loc) {
    S.mode = ['nuc', 'pair', 'helix', 'repl', 'trans', 'code'][i];
    if (i === 1) S.pair = loc < 0.5 ? 'AT' : 'GC'; if (i === 3) S.prog = Math.min(1, loc * 1.1); if (i === 4) S.prog = Math.min(1, loc * 1.05); if (i === 5) S.prog = loc;
  }
  function L2W(v) { return G.g.localToWorld(new G.T.Vector3(v[0], v[1], v[2])); }
  var def = {
    key: 'adn', title: "DNA: Structure, Replication and Transcription", subtitle: "3D Simulator · biomolecules", accent: { dark: '#38bdf8', light: '#0369a1' }, stages: STG, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 1.5, 12], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 12], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 13, 0.1], target: [0, 0, 0] }],
    layers: [{ id: 'hb', label: "H bonds", icon: '┅' }, { id: 'bb', label: "Sugar-phosphate backbone", icon: '〰' }, { id: 'spin', label: "Rotate", icon: '⟳' }],
    build: function (ctx) { G.T = ctx.T; buildAll(ctx); labs.t = ctx.label('', 'bl-lead'); labs.l = []; for (var i = 0; i < 14; i++) labs.l.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var T = ctx.T, k = S.mode + (S.mode === 'pair' ? S.pair : ''); G.k = k;
      if (k !== key_) { key_ = k; G.stat.children.slice().forEach(function (c) { G.stat.remove(c); }); G.dyn.visible = (S.mode === 'helix' || S.mode === 'repl' || S.mode === 'trans' || S.mode === 'code'); if (S.mode === 'nuc') { G.stat.add(stageNuc(ctx)); } if (S.mode === 'pair') { G.pg = stagePair(ctx, S.pair); G.stat.add(G.pg); } G.g.rotation.set(0, 0, 0); }
      labs.l.forEach(function (l) { l.vis(false); }); labs.t.vis(false);
      var sp = ctx.layer('spin'); if ((S.mode === 'helix' || S.mode === 'code' || S.mode === 'repl' || S.mode === 'trans') && sp) G.g.rotation.y += dt * 0.35; else if (S.mode === 'nuc' || S.mode === 'pair') G.g.rotation.y = 0.35 * Math.sin(f.now * 0.5);
      G.g.scale.setScalar(S.mode === 'nuc' ? 1.6 : (S.mode === 'pair' ? 2.1 : 1.05)); G.g.position.x = S.mode === 'nuc' ? 1.5 : 0; G.g.updateMatrixWorld(true);
      var L = labs.l, seq = S.seq, n = seq.length, st = stats(seq);
      if (S.mode === 'nuc') { var u = G.stat.children[0].userData, o = G.stat.children[0].position, W = function (p) { var v = L2W([p[0] + o.x, p[1] + o.y, 0]); return v; }; var pp = [["phosphate group (C5′)", u.ph, 0.5], ['3′-OH', u.oh, -0.45], ["deoxyribose", u.sugar, 0.85], ["nitrogenous base (A)", [2.9, 0.15], 0.75]]; pp.forEach(function (a, i) { var v = L2W([a[1][0] - 0.8, a[1][1] + a[2], 0]); L[i].pos(v.x, v.y, v.z).set(a[0], 'bl-d').vis(true); }); var v0 = L2W([0.4, -1.3, 0]); L[4].pos(v0.x, v0.y, v0.z).set('N-glucosídico', 'bl-d').vis(true); var vt = L2W([0.3, 2.0, 0]); labs.t.pos(vt.x, vt.y, vt.z).set("Deoxyadenosine 5′-monophosphate (dAMP)", 'bl-lead').vis(true); return; }
      if (S.mode === 'pair') { var gr = G.pg, cx = gr.userData.cx; var pp2 = [[-cx - 0.2, 1.0, S.pair[0] + ' · ' + (S.pair[0] === 'A' ? "adenine" : "guanine") + " (purine)"], [cx + 0.2, 1.0, S.pair[1] + ' · ' + (S.pair[1] === 'T' ? "thymine" : "cytosine") + " (pyrimidine)"], [0, -1.15, gr.userData.nb + " H bonds"]]; pp2.forEach(function (a, i) { var v = L2W([a[0], a[1], 0]); L[i].pos(v.x, v.y, v.z).set(a[2], 'bl-d').vis(true); }); var vt2 = L2W([0, 1.6, 0]); labs.t.pos(vt2.x, vt2.y, vt2.z).set("Pair " + S.pair[0] + '–' + S.pair[1], 'bl-lead').vis(true); return; }
      /* dúplex */
      var r = G.r; r.begin(); var bb = ctx.layer('bb'), hbOn = ctx.layer('hb'), s1 = 0x5c7cfa, s2 = 0xf06595, kk = S.prog * (n + 1);
      var phos1 = [], phos2 = [];
      if (S.mode === 'helix' || S.mode === 'code') {
        for (var i = 0; i < n; i++) { var o = drawBP(r, i, n, seq[i], COMP[seq[i]], { nohb: !hbOn }); phos1.push(o.P1); phos2.push(o.P2); r.sphere(o.P1, 0.15, 0xffa94d); r.sphere(o.P2, 0.15, 0xffa94d); if (bb) { r.sphere(add(o.P1, [-o.P1[0], 0, -o.P1[2]], 0.18), 0.1, 0xffc078); r.sphere(add(o.P2, [-o.P2[0], 0, -o.P2[2]], 0.18), 0.1, 0xffc078); } if (i) { r.line(phos1[i - 1], phos1[i], 0.045, s1); r.line(phos2[i - 1], phos2[i], 0.045, s2); } }
        var top = 0, v5 = L2W(add(phos1[0], [0, -0.4, 0])), v3 = L2W(add(phos1[n - 1], [0, 0.4, 0])), w3 = L2W(add(phos2[0], [0, -0.4, 0])), w5 = L2W(add(phos2[n - 1], [0, 0.4, 0]));
        if (S.mode === 'helix') { L[0].pos(v5.x, v5.y, v5.z).set('5′', 'bl-d').vis(true); L[1].pos(v3.x, v3.y, v3.z).set('3′', 'bl-d').vis(true); L[2].pos(w3.x, w3.y, w3.z).set('3′', 'bl-d').vis(true); L[3].pos(w5.x, w5.y, w5.z).set('5′', 'bl-d').vis(true); var i1 = Math.min(n - 1, 3), i2 = Math.min(n - 1, 7), a1 = pos(i1, n, 0), a2 = pos(i2, n, 0); var thM = i2 * TW + PSI / 2 + Math.PI, thm = i1 * TW + PSI / 2; var gm = L2W([1.55 * Math.cos(thm), pos(i1, n, 0)[1], -1.55 * Math.sin(thm)]), gM = L2W([1.55 * Math.cos(thM), pos(i2, n, 0)[1], -1.55 * Math.sin(thM)]); L[4].pos(gm.x, gm.y, gm.z).set("minor groove", 'bl-d').vis(true); L[5].pos(gM.x, gM.y, gM.z).set("major groove", 'bl-d').vis(true); var vv = L2W([0, -(n * RISE) / 2 - 0.6, 0]); L[6].pos(vv.x, vv.y, vv.z).set("10 bp = 3.4 nm (one turn)", 'bl-d').vis(true); }
        if (S.mode === 'code') { var cod = Math.floor(S.prog * Math.floor(n / 3) * 0.999); for (var j = 0; j + 3 <= n && j / 3 < 12; j += 3) { var yc = (j + 1 - (n - 1) / 2) * RISE, on = (j / 3) === cod; r.box([0, yc, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [2.9, 3 * RISE * 0.96, 2.9], on ? 0xffd43b : 0x748ffc, on ? 0.28 : 0.1); var aa = codon(seq.substr(j, 3)), v = L2W([1.9, yc, 0]); if (j / 3 < 12) L[7 + (j / 3)].pos(v.x, v.y, v.z).set(seq.substr(j, 3).replace(/T/g, 'U') + ' → ' + AA3[aa], 'bl-d').vis(true); } }
      }
      else if (S.mode === 'repl') {
        var kf = S.prog * (n + 5) - 2, newA = 0xffa94d, newB = 0xffd43b, oldA = s1, oldB = s2, pA1 = [], pB1 = [], pA2 = [], pB2 = [], pP1 = [], pP2 = [];
        var offs = function (i) { var s = sm((kf - i) / 4); return 1.25 * s; };
        for (var i2 = 0; i2 < n; i2++) { var s = offs(i2), nw = sm((kf - i2) / 2);
          if (s < 0.001) { var o = drawBP(r, i2, n, seq[i2], COMP[seq[i2]], { nohb: !hbOn }); r.sphere(o.P1, 0.15, 0xffa94d); r.sphere(o.P2, 0.15, 0xffa94d); pP1[i2] = o.P1; pP2[i2] = o.P2; pA1[i2] = pB1[i2] = o.P1; pA2[i2] = pB2[i2] = o.P2; }
          else { var oA = drawBP(r, i2, n, seq[i2], COMP[seq[i2]], { o1: [-s, 0, 0], o2: [-s, 0, 0], op2: 0.25 + 0.75 * nw, nohb: !hbOn }), oB = drawBP(r, i2, n, seq[i2], COMP[seq[i2]], { o1: [s, 0, 0], o2: [s, 0, 0], op1: 0.25 + 0.75 * nw, nohb: !hbOn }); pA1[i2] = oA.P1; pA2[i2] = oA.P2; pB1[i2] = oB.P1; pB2[i2] = oB.P2; r.sphere(oA.P1, 0.15, 0xffa94d); r.sphere(oA.P2, 0.15, 0xffa94d, 0.3 + 0.7 * nw); r.sphere(oB.P1, 0.15, 0xffa94d, 0.3 + 0.7 * nw); r.sphere(oB.P2, 0.15, 0xffa94d); }
          if (i2) { var s0 = offs(i2 - 1); if (s < 0.001 && s0 < 0.001) { r.line(pP1[i2 - 1], pP1[i2], 0.045, oldA); r.line(pP2[i2 - 1], pP2[i2], 0.045, oldB); } else { r.line(pA1[i2 - 1], pA1[i2], 0.045, oldA); r.line(pB2[i2 - 1], pB2[i2], 0.045, oldB); r.line(pA2[i2 - 1], pA2[i2], 0.04, newA, 0.55); r.line(pB1[i2 - 1], pB1[i2], 0.04, newB, 0.55); } } }
        var vt = L2W([0, -(n * RISE) / 2 - 0.5, 0]); var vf = L2W([0, (kf - (n - 1) / 2) * RISE + 0.3, 0.9]);
        if (kf > 0 && kf < n) { L[0].pos(vf.x, vf.y, vf.z).set("replication fork (helicase)", 'bl-d').vis(true); }
        var l1 = L2W([-1.9, -(n * RISE) / 2 + 0.3, 0]), l2 = L2W([1.9, -(n * RISE) / 2 + 0.3, 0]); if (kf > 3) { L[1].pos(l1.x, l1.y, l1.z).set("daughter 1: old + new", 'bl-d').vis(true); L[2].pos(l2.x, l2.y, l2.z).set("daughter 2: old + new", 'bl-d').vis(true); }
        var lp = L2W([0, (n * RISE) / 2 + 0.5, 0]); L[3].pos(lp.x, lp.y, lp.z).set("parental DNA", 'bl-d').vis(true);
      }
      else if (S.mode === 'trans') {
        var kb = S.prog * (n + 6) - 3, rp = [], d1 = [], d2 = [], pol = null;
        for (var i3 = 0; i3 < n; i3++) { var a = Math.exp(-Math.pow((i3 - kb) / 1.7, 2)), o1 = [0.8 * a, 0, 0], o2 = [-0.8 * a, 0, 0]; var skip1 = false; var o = drawBP(r, i3, n, seq[i3], COMP[seq[i3]], { o1: o1, o2: o2, nohb: a > 0.2 || !hbOn }); d1[i3] = o.P1; d2[i3] = o.P2; r.sphere(o.P1, 0.15, 0xffa94d); r.sphere(o.P2, 0.15, 0xffa94d);
          if (i3) { r.line(d1[i3 - 1], d1[i3], 0.045, s1); r.line(d2[i3 - 1], d2[i3], 0.045, s2); }
          if (i3 <= kb + 0.4) { var e = sm((kb - 2.5 - i3) / 3), ex = [-1.7 * e, -0.0, 2.2 * e], rpos = add(add(pos(i3, n, 0), o2), ex), ropa = sm((kb + 0.4 - i3) / 1.2); var tmpP2 = add(pos(i3, n, 1), o2); var rpl = plate(r, rpos, add(tmpP2, ex), RNAC[seq[i3]], 'x', { op: 0.35 + 0.65 * ropa }); r.sphere(rpos, 0.15, 0xff922b, 0.35 + 0.65 * ropa); rp[i3] = rpos; if (i3 > 0 && rp[i3 - 1]) r.line(rp[i3 - 1], rpos, 0.05, 0xff922b, 0.9); }
        }
        // plate del RNA pinta con color de U
        var yb = (kb - (n - 1) / 2) * RISE; r.sphere([0, yb, 0], 1.0, 0x9775fa, 0.13).scale.set(1.9, 1.15, 1.5);
        var vr = L2W([0, yb + 0.9, 1.0]); L[0].pos(vr.x, vr.y, vr.z).set("RNA polymerase", 'bl-d').vis(kb > -1 && kb < n + 1);
        var vm = L2W([-1.9, yb + 2.0, 2.2]); if (kb > 3) L[1].pos(vm.x, vm.y, vm.z).set("mRNA 5′→3′", 'bl-d').vis(true);
        var vt = L2W([1.7, -(n * RISE) / 2 + 0.2, 0]); L[2].pos(vt.x, vt.y, vt.z).set("template strand 3′→5′", 'bl-d').vis(true); var vc = L2W([-1.7, (n * RISE) / 2 - 0.2, 0]); L[3].pos(vc.x, vc.y, vc.z).set("coding strand", 'bl-d').vis(true);
      }
      r.end();
      var vtt = L2W([0, (n * RISE) / 2 + 0.55, 0]); labs.t.pos(vtt.x, vtt.y, vtt.z).set({ helix: "B-DNA · " + n + ' pb', code: "Translation in frame 0", repl: "Semiconservative replication", trans: "Transcription: DNA → mRNA" }[S.mode], 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var st = stats(S.seq), row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; }; var nm = { nuc: "Nucleotide", pair: "Pair " + S.pair[0] + '–' + S.pair[1], helix: "B double helix", repl: "Replication", trans: "Transcription", code: "Genetic code" }[S.mode];
      var b = S.mode === 'pair' ? row("H bonds", S.pair === 'GC' ? '3' : '2') + row("Rings", "purine (2) + pyrimidine (1)") : (S.mode === 'nuc' ? row("Components", "phosphate · deoxyribose · base") + row("Polarity", '5′ → 3′') : row("Sequence", S.seq.length + " bp · GC " + fmt(st.gc, 0) + ' %') + row('Tm', fmt(st.Tm, 1) + ' °C') + row("Coding strand", '5′-' + (S.seq.length > 14 ? S.seq.slice(0, 14) + '…' : S.seq) + '-3′'));
      return { eq: { chip: "DNA", name: nm, body: b }, legend: [{ label: 'A', color: '#40c057', text: "adenine" }, { label: 'T', color: '#fa5252', text: "thymine" }, { label: 'G', color: '#fcc419', text: "guanine" }, { label: 'C', color: '#4dabf7', text: "cytosine" }, { label: 'U', color: '#ff922b', text: "uracil (RNA)" }] }; },
    measures: function () { var st = stats(S.seq), pr = translate(S.seq); return [["Length", st.n + ' pb'], ['% GC', fmt(st.gc, 1) + ' %'], ['Tm', fmt(st.Tm, 1) + ' °C'], ['A / T / G / C', st.c.A + ' / ' + st.c.T + ' / ' + st.c.G + ' / ' + st.c.C], ["Strand mass (ss)", fmt(st.m1, 0) + ' g/mol'], ["Duplex mass", fmt(st.m1 + st.m2, 0) + ' g/mol'], ["Codons (frame 0)", String(pr.length)], ["Peptide", pr.map(function (x) { return x === '*' ? '■' : x; }).join('')]]; },
    ideas: ["<b>A–T: 2 H bonds; G–C: 3</b> → more GC = higher Tm.", "The strands are <b>antiparallel</b>: 5′→3′ and 3′→5′.", "B-DNA: 10 bp/turn, 0.34 nm/bp, pitch 3.4 nm, diameter 2 nm.", "Replication is <b>semiconservative</b>: each daughter = 1 old strand + 1 new.", "mRNA = copy of the coding strand with U instead of T."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Sequence and mode"); el.appendChild(c);
      ui.mode = kit.ui.options({ label: "What to show", cols: 3, value: S.mode, options: [{ v: 'nuc', label: "Nucleotide" }, { v: 'pair', label: "Pairs" }, { v: 'helix', label: "Helix" }, { v: 'repl', label: "Replication" }, { v: 'trans', label: "Transcription" }, { v: 'code', label: "Code" }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.pair = kit.ui.options({ label: "Base pair", cols: 4, value: S.pair, options: [{ v: 'AT', label: 'A–T' }, { v: 'TA', label: 'T–A' }, { v: 'GC', label: 'G–C' }, { v: 'CG', label: 'C–G' }], onChange: function (v) { ctx.goManual(); S.mode = 'pair'; S.pair = v === 'TA' ? 'AT' : (v === 'CG' ? 'GC' : v); } }); c.appendChild(ui.pair);
      ui.prog = kit.ui.slider({ label: "Progress (replic./transcr./codon)", min: 0, max: 100, step: 1, value: 50, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.prog = v / 100; if (S.mode === 'helix') S.mode = 'trans'; } }); c.appendChild(kit.ui.sliders([ui.prog]));
      var fld = document.createElement('div'); fld.className = 'fld'; fld.innerHTML = "<span class=\"lbl\">Sequence (coding strand 5′→3′, 6–24 nt)</span>"; var inp = document.createElement('input'); inp.type = 'text'; inp.setAttribute('aria-label', 'DNA sequence'); inp.value = S.seq; inp.maxLength = 24; inp.style.cssText = 'width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 0.95rem ui-monospace,monospace;letter-spacing:.08em'; fld.appendChild(inp); c.appendChild(fld);
      function setSeq(s) { s = s.toUpperCase().replace(/[^ACGT]/g, ''); if (s.length < 6) { kit.toast("Minimum 6 bases (A, C, G, T)"); return; } ctx.goManual(); S.seq = s.slice(0, 24); inp.value = S.seq; if (S.mode === 'nuc' || S.mode === 'pair') S.mode = 'helix'; }
      inp.addEventListener('change', function () { setSeq(inp.value); }); ui.inp = inp;
      c.appendChild(ctx.btnRow([{ t: "Random", fn: function () { var s = ''; for (var i = 0; i < 18; i++) s += 'ACGT'[Math.floor(Math.random() * 4)]; setSeq('ATG' + s); } }, { t: "GC-rich", fn: function () { setSeq('ATGGCGCCGGGCGCCCGGCGC'); } }, { t: "AT-rich", fn: function () { setSeq('ATGAATTTAATATTAAATTTA'); } }, { t: "EcoRI palindrome", fn: function () { setSeq('GAATTCGGAATTCGGAATTC'); } }]));
      var lk = ''; ui.refresh = function () { var k = S.mode + S.pair + S.seq; if (k === lk) return; lk = k; ui.mode.set(S.mode); ui.pair.set(S.pair); if (document.activeElement !== inp) inp.value = S.seq; };
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var q = kit.ui.card("Challenge: complement and mRNA"); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, sc = [0, 0];
      function nextQ() { var s = ''; for (var i = 0; i < 6; i++) s += 'ACGT'[Math.floor(Math.random() * 4)]; var kind = Math.random() < 0.5 ? 'comp' : 'mrna'; cur = { s: s, kind: kind }; draw(''); }
      function ans(s) { var st = stats(cur.s); return cur.kind === 'comp' ? st.rc : st.mrna; }
      function draw(msg) { var h = "<p class=\"small\">Correct: <b>" + sc[0] + '</b> / ' + sc[1] + '</p>'; if (cur) h += '<p class="small">Hebra codificante 5′-<b style="font-family:monospace">' + cur.s + '</b>-3′<br>' + (cur.kind === 'comp' ? "Write the <b>complementary</b> strand (5′→3′):" : "Write the <b>mRNA</b> (5′→3′):") + '</p><input id="adnq" type="text" maxlength="6" style="width:100%;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 .95rem ui-monospace,monospace;letter-spacing:.1em"/>'; if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; qb.appendChild(ctx.btnRow([{ t: "Check", fn: function () { if (!cur) { kit.toast("Press “New question”"); return; } var v = (qb.querySelector('#adnq').value || '').toUpperCase().trim(), a = ans(); sc[1]++; var ok = v === a; if (ok) sc[0]++; var r = cur; cur = null; draw(ok ? "Correct! " + a : "No: the answer was " + a); } }, { t: "New question", primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: "Melting temperature according to %GC", h: 220, note: "Tm = 64.9 + 41·(nGC − 16.4)/N for N ≥ 14. Dot = your sequence.", draw: function (cx, w, h, c) {
        var st = stats(S.seq), L0 = 36, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, N = Math.max(14, st.n), sx = function (g) { return L0 + pw * g / 100; }, sy = function (t) { return Tp + ph * (1 - (t - 20) / 80); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var g = 0; g <= 100; g += 20) { cx.beginPath(); cx.moveTo(sx(g), Tp); cx.lineTo(sx(g), Tp + ph); cx.stroke(); cx.fillText(g, sx(g), h - B + 12); } cx.fillText('% GC', L0 + pw / 2, h - 2); cx.textAlign = 'right'; for (var t = 20; t <= 100; t += 20) { cx.beginPath(); cx.moveTo(L0, sy(t)); cx.lineTo(L0 + pw, sy(t)); cx.stroke(); cx.fillText(t, L0 - 4, sy(t) + 3); }
        cx.strokeStyle = '#1c7ed6'; cx.lineWidth = 2.2; cx.beginPath(); for (g = 0; g <= 100; g += 2) { var tm = 64.9 + 41 * (g / 100 * N - 16.4) / N, px = sx(g), py = sy(Math.max(20, Math.min(100, tm))); if (g === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(st.gc), sy(Math.max(20, Math.min(100, st.Tm))), 5, 0, 7); cx.fill(); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText(fmt(st.Tm, 1) + ' °C', sx(st.gc) + 8, sy(st.Tm) - 6); } },
      { title: "Melting curve (A₂₆₀ versus temperature)", h: 200, note: "When the duplex melts, absorbance at 260 nm rises ≈ 40 % (hyperchromic effect). Tm = midpoint.", draw: function (cx, w, h, c) {
        var st = stats(S.seq), L0 = 36, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (t) { return L0 + pw * (t - 30) / 70; }, sy = function (a) { return Tp + ph * (1 - (a - 1) / 0.5); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var t = 30; t <= 100; t += 10) { cx.beginPath(); cx.moveTo(sx(t), Tp); cx.lineTo(sx(t), Tp + ph); cx.stroke(); cx.fillText(t, sx(t), h - B + 12); } cx.fillText('T (°C)', L0 + pw / 2, h - 2); cx.textAlign = 'right'; [1, 1.2, 1.4].forEach(function (a) { cx.fillText(fmt(a, 1), L0 - 4, sy(a) + 3); });
        cx.strokeStyle = '#e8590c'; cx.lineWidth = 2.2; cx.beginPath(); for (t = 30; t <= 100; t += 1) { var a = 1 + 0.4 / (1 + Math.exp(-(t - st.Tm) / 2.2)), px = sx(t), py = sy(a); if (t === 30) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; cx.setLineDash([4, 3]); cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(sx(st.Tm), Tp); cx.lineTo(sx(st.Tm), Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText('Tm ' + fmt(st.Tm, 1) + ' °C', sx(st.Tm) + 4, Tp + 12); } },
      { title: "Genetic code (mRNA codons)", h: 330, note: "Rows: 1st base; columns: 2nd base; inside: 3rd base. The codons of your sequence are marked.", draw: function (cx, w, h, c) {
        var used = {}; for (var i = 0; i + 3 <= S.seq.length; i += 3) used[S.seq.substr(i, 3)] = 1; var cw = (w - 20) / 4, ch = (h - 16) / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
        for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) { var x0 = 10 + b * cw, y0 = 8 + a * ch; cx.strokeStyle = c.line; cx.strokeRect(x0, y0, cw, ch); for (var d = 0; d < 4; d++) { var cd = BORD[a] + BORD[b] + BORD[d], aa = codon(cd), yy = y0 + 11 + d * (ch - 8) / 4; cx.fillStyle = CCOL[AACLS[aa]]; cx.globalAlpha = used[cd] ? 1 : 0.55; if (used[cd]) { cx.fillRect(x0 + 2, yy - 9, cw - 4, 12); cx.fillStyle = '#fff'; } cx.globalAlpha = 1; cx.textAlign = 'left'; cx.fillText(cd.replace(/T/g, 'U') + ' ' + (aa === '*' ? 'Stop' : AA3[aa]), x0 + 5, yy); } }
        cx.textAlign = 'left'; } },
      { title: "Base composition (Chargaff)", h: 190, note: "In the duplex A = T and G = C: each strand contributes its complement.", draw: function (cx, w, h, c) {
        var st = stats(S.seq), L0 = 26, B = 24, Tp = 12, pw = w - L0 - 10, ph = h - Tp - B, mx = Math.max(st.c.A + st.c.T, st.c.G + st.c.C, 1), bw = pw / 4 - 10;
        ['A', 'T', 'G', 'C'].forEach(function (b, i) { var v = st.c[b] + st.c[COMP[b]] , x = L0 + i * pw / 4 + 5, v1 = st.c[b], hh = ph * v1 / mx * 1.0; cx.fillStyle = '#' + BCOL[b].toString(16).padStart(6, '0'); cx.fillRect(x, Tp + ph - ph * v1 / (mx / 1), bw, ph * v1 / (mx / 1)); cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText(b + ' (' + v1 + ')', x + bw / 2, h - 8); }); } }
    ],
    calc: function () { var st = stats(S.seq), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, pr = translate(S.seq), cds = ''; for (var i = 0; i + 3 <= st.mrna.length; i += 3) cds += st.mrna.substr(i, 3) + ' ';
      return "<div class=\"card-kicker\">Sequence of " + st.n + " nt</div><div class=\"calc-step\">1 · Strands</div><table class=\"calc-table\">" + row("Coding 5′→3′", '<span style="font-family:monospace">' + S.seq + '</span>') + row("Template 3′→5′", '<span style="font-family:monospace">' + st.comp + '</span>') + row("Reverse complement 5′→3′", '<span style="font-family:monospace">' + st.rc + '</span>') + row("mRNA 5′→3′", '<span style="font-family:monospace">' + st.mrna + '</span>') + "</table><div class=\"calc-step\">2 · Properties</div><table class=\"calc-table\">" + row('% GC', fmt(st.gc, 1) + ' %') + row('Tm', fmt(st.Tm, 1) + ' °C (' + (st.n < 14 ? "Wallace rule: 2·(A+T) + 4·(G+C)" : "64.9 + 41·(nGC − 16.4)/N") + ')') + row("H bonds", (st.c.A + st.c.T) * 2 + (st.c.G + st.c.C) * 3) + row("Mass (strand / duplex)", fmt(st.m1, 0) + ' / ' + fmt(st.m1 + st.m2, 0) + ' g/mol') + "</table><div class=\"calc-step\">3 · Translation (frame 0)</div><table class=\"calc-table\">" + row("Codons", '<span style="font-family:monospace">' + cds + '</span>') + row("Peptide", pr.map(function (x) { return x === '*' ? 'Stop' : AA3[x]; }).join('–')) + '</table>'; },
    calcLabel: "Sequence",
    quiz: [
      { q: "How many hydrogen bonds does a G–C pair form?", options: ['3', '2', '1', '4'], answer: 0, why: "G≡C has three; A=T only two, which is why more GC increases Tm." },
      { q: "If one strand is 5′-ATGC-3′, the complementary strand (5′→3′) is…", options: ['5′-GCAT-3′', '5′-TACG-3′', '5′-CGTA-3′', '5′-UACG-3′'], answer: 0, why: "Complement 3′-TACG-5′; read 5′→3′ it is GCAT (reverse complement)." },
      { q: "In B-DNA, how many base pairs are there per helix turn?", options: ['10', '3,6', '11', '12'], answer: 0, why: "10 bp per turn, pitch 3.4 nm (0.34 nm per pair)." },
      { q: "DNA replication is semiconservative because…", options: ["each daughter molecule has one original strand and one new strand", "the two original strands stay together", "RNA is synthesized first", "only one strand is copied"], answer: 0, why: "Demonstrated by Meselson and Stahl with heavy nitrogen (¹⁵N)." },
      { q: "In the mRNA the base complementary to the adenine of the template is…", options: ["uracil", "thymine", "cytosine", "guanine"], answer: 0, why: "RNA uses uracil instead of thymine: A (template) → U (RNA)." },
      { q: "Which codon is the translation start codon?", options: ['AUG (Met)', 'UAA', 'GCC', 'UGA'], answer: 0, why: "AUG codes for methionine and marks the start; UAA, UAG and UGA are stop codons." },
      { q: "According to Chargaff, in a double-stranded DNA…", options: ['A = T y G = C', 'A = G y C = T', 'A + T = G + C', 'A = C'], answer: 0, why: "Each purine pairs with a specific pyrimidine." },
      { q: "A 20 bp fragment with 70 % GC, compared with another with 30 %, has…", options: ["a higher Tm", "a lower Tm", "the same Tm", "does not melt"], answer: 0, why: "More G–C pairs (3 H bonds) stabilize the duplex." }
    ],
    help: { intro: "Write your sequence in “Lab” and go through nucleotide, pairs, helix, replication, transcription and genetic code.", items: [["H bonds", "two in A–T and three in G–C."], ["Replication", "the progress moves the fork."], ["Transcription", "bubble with RNA polymerase and mRNA."], ["Challenge", "write the complementary strand or the mRNA."]] }
  };
  MSim.create(def);
})();
