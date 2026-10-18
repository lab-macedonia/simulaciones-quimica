/* Reactivos de Grignard y organometálicos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

/* Utilidades para simuladores de mecanismos: puesta en escena de moléculas, flechas curvas con electrón viajero y acoplamiento de grupos. */
(function () {
  var T = THREE;
  MSim.idx = function (g, tag, nth) { var c = 0, n = nth || 0; for (var i = 0; i < g.tag.length; i++) { if (g.tag[i] === tag) { if (c === n) return i; c++; } } return -1; };
  MSim.vec = function (g, i) { return new T.Vector3(g.a[i][1], g.a[i][2], g.a[i][3]); };
  /* quita el primer H con la etiqueta dada (p. ej. el H que se pierde al formar el anión) */
  MSim.strip = function (g, tag) {
    var k = -1, i; for (i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === tag) { k = i; break; } }
    var map = {}, A = [], TG = [], B = []; g.a.forEach(function (a, j) { if (j !== k) { map[j] = A.length; A.push(a.slice()); TG.push(g.tag[j]); } });
    g.b.forEach(function (b) { if (b[0] !== k && b[1] !== k) B.push([map[b[0]], map[b[1]], b[2]]); });
    return { a: A, b: B, tag: TG, h: k >= 0 ? g.a[k].slice(1) : null };
  };
  /* posición mundial del átomo i de un grupo creado con ctx.mol(geo, {gs}) */
  MSim.wp = function (grp, g, i, gs) { grp.updateMatrixWorld(true); return grp.localToWorld(MSim.vec(g, i).multiplyScalar(gs || 1)); };
  /* coloca el grupo de modo que el átomo i quede en «target» y el resto de la molécula se extienda hacia «away» */
  MSim.dock = function (grp, g, i, target, away, gs) {
    var p = MSim.vec(g, i).multiplyScalar(gs || 1), v = p.clone().negate(); if (v.lengthSq() < 1e-6) v.set(1, 0, 0); v.normalize();
    grp.quaternion.setFromUnitVectors(v, away.clone().normalize()); grp.position.copy(target).sub(p.applyQuaternion(grp.quaternion));
  };
  MSim.stage = function (ctx) {
    var cache = {};
    return {
      begin: function () { Object.keys(cache).forEach(function (k) { cache[k].visible = false; cache[k].quaternion.set(0, 0, 0, 1); }); },
      put: function (key, geo, x, y, z, o) {
        o = o || {}; var g = cache[key];
        if (!g) {
          g = new T.Group(); g.userData.geo = geo; g.userData.gs = o.gs || 1; g.add(ctx.mol(geo, { gs: o.gs || 1, ar: o.ar || 0.46 }));
          (o.halos || []).forEach(function (h) { var i = MSim.idx(geo, h.tag, h.nth); if (i < 0) return; var a = geo.a[i], m = new T.Mesh(new T.SphereGeometry(h.r || 0.7, 18, 12), new T.MeshBasicMaterial({ color: h.color, transparent: true, opacity: h.op == null ? 0.38 : h.op, depthWrite: false })); m.position.set(a[1] * (o.gs || 1), a[2] * (o.gs || 1), a[3] * (o.gs || 1)); m.userData.halo = h.kind || 'halo'; g.add(m); });
          ctx.scene.add(g); cache[key] = g;
        }
        g.visible = true; g.position.set(x || 0, y || 0, z || 0); return g;
      },
      get: function (k) { return cache[k]; },
      halos: function (on, kind) { Object.keys(cache).forEach(function (k) { cache[k].children.forEach(function (c) { if (c.userData.halo && (!kind || c.userData.halo === kind)) c.visible = on; }); }); }
    };
  };
  MSim.arrow = function (ctx, color) {
    var grp = new T.Group(), mat = new T.MeshBasicMaterial({ color: color || 0xff7a3d }), mesh = null, head = new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), mat), dot = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), new T.MeshBasicMaterial({ color: 0xffeb3b })), curve = null, key = '';
    grp.add(head); grp.add(dot); ctx.scene.add(grp); grp.visible = false;
    return {
      group: grp,
      set: function (p0, p1, bend, on) {
        grp.visible = !!on; if (!on) return;
        var k = [p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, bend.x, bend.y, bend.z].map(function (v) { return v.toFixed(2); }).join();
        if (k !== key) {
          key = k; if (mesh) { mesh.geometry.dispose(); grp.remove(mesh); }
          var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bend); curve = new T.QuadraticBezierCurve3(p0, mid, p1);
          mesh = new T.Mesh(new T.TubeGeometry(curve, 16, 0.05, 6, false), mat); grp.add(mesh);
          var tan = p1.clone().sub(curve.getPoint(0.9)).normalize(); head.position.copy(p1).addScaledVector(tan, -0.15); head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan);
        }
      },
      tick: function (now) { if (grp.visible && curve) dot.position.copy(curve.getPoint((now * 0.7) % 1)); }
    };
  };
})();


(function () {
  var T = THREE;
  var RS = { me: { n: "methyl", s: 'C', f: 'CH₃' }, et: { n: "ethyl", s: 'CC', f: 'CH₃CH₂' }, ph: { n: "phenyl", s: 'Ph', f: 'C₆H₅' } };
  var ES = {
    fo: { n: "Formaldehyde", e: 'C{c}=O{o}', cls: "primary alcohol", mk: function (r) { return 'O{o}C{c}' + r; }, eq: 1, nm: function (r) { return { me: "ethanol", et: '1-propanol', ph: "benzyl alcohol" }[r]; } },
    al: { n: "Acetaldehyde", e: 'CC{c}=O{o}', cls: "secondary alcohol", mk: function (r) { return 'O{o}C{c}(C)' + r; }, eq: 1, nm: function (r) { return { me: '2-propanol', et: '2-butanol', ph: '1-feniletanol' }[r]; } },
    ce: { n: "Acetone", e: 'CC{c}(=O{o})C', cls: "tertiary alcohol", mk: function (r) { return 'O{o}C{c}(C)(C)' + r; }, eq: 1, nm: function (r) { return { me: '2-metil-2-propanol', et: '2-metil-2-butanol', ph: '2-fenil-2-propanol' }[r]; } },
    co: { n: "Carbon dioxide", e: 'O=C{c}=O{o}', cls: "carboxylic acid", mk: function (r) { return 'O{o}C{c}(=O)' + r; }, eq: 1, nm: function (r) { return { me: "ethanoic (acetic) acid", et: "propanoic acid", ph: "benzoic acid" }[r]; } },
    es: { n: "Methyl acetate", e: 'CC{c}(=O{o})OC', cls: "tertiary alcohol (2 equivalents)", mk: function (r) { return 'O{o}C{c}(C)(' + r + ')' + r; }, eq: 2, nm: function (r) { return { me: '2-metil-2-propanol', et: '3-metil-3-pentanol', ph: "1,1-diphenylethanol" }[r]; } }
  };
  var S = { r: 'me', e: 'ce', p: 0, wet: false }, SG = null, lab = [], arr = null;
  function grig(r) { var g = MSim.build(r === 'ph' ? 'Cl{x}Ph' : RS[r].s + 'Cl{x}'), i = MSim.idx(g, 'x', 0), par = g.b.filter(function (b) { return b[0] === i || b[1] === i; })[0], pi = par[0] === i ? par[1] : par[0], d = MSim.vec(g, i).sub(MSim.vec(g, pi)).normalize(), p = MSim.vec(g, pi); g.a[i] = ['Mg', p.x + d.x * 2.1, p.y + d.y * 2.1, p.z + d.z * 2.1]; g.tag[i] = 'mg'; g.a.push(['Br', p.x + d.x * 4.4, p.y + d.y * 4.4, p.z + d.z * 4.4]); g.tag.push('br'); g.b.push([i, g.a.length - 1, 1]); g.nuc = pi; return g; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Formation of the reagent", "Formation", "R–Br + Mg → R–MgBr in anhydrous ether: the carbon goes from δ+ to δ−",
        "<p>The <b>Grignard reagent</b> is prepared by adding an alkyl or aryl halide to metallic <b>magnesium</b> in <b>dry ether</b> (diethyl ether or THF), which solvates the Mg. The carbon, formerly electrophilic (δ+ in C–Br), becomes <b>nucleophilic and basic</b> (δ− in C–Mg): there is a <b>polarity inversion</b> (<i>umpolung</i>). Everything must be <b>anhydrous</b>: water destroys it.</p>"],
      ["Addition to aldehydes and ketones", "Carbonyls", "R⁻ attacks the C=O: formaldehyde → 1°, aldehyde → 2°, ketone → 3°",
        "<p>The nucleophilic carbon attacks the <b>carbonyl carbon</b> and a <b>magnesium alkoxide</b> forms; then the acid work-up (H₃O⁺) protonates it. A C–C bond is thus formed: <b>formaldehyde → primary alcohol</b>, <b>aldehydes → secondary</b>, <b>ketones → tertiary</b>. Choose R and the electrophile and move the progress control.</p>"],
      ["CO₂ and esters", "CO₂ and esters", "CO₂ gives carboxylic acids (+1 C); esters react with 2 equivalents",
        "<p>With <b>CO₂</b> (dry ice) a <b>carboxylate</b> forms and, on acidifying, a <b>carboxylic acid</b> with one more carbon than the starting halide. With an <b>ester</b> the first equivalent gives a ketone (after expelling the alkoxide), but this is <b>more reactive</b> than the ester and reacts with a second equivalent: a <b>tertiary alcohol with two identical R groups</b> is obtained.</p>"],
      ["Incompatibilities", "Acidic protons", "RMgX is a strong base: it is protonated by water, alcohols, acids, amines and terminal alkynes",
        "<p>The Grignard carbon is the conjugate base of an alkane (pKa ≈ 50): it <b>deprotonates any acidic H</b> (H₂O, ROH, RCOOH, RNH₂, R–C≡C–H) and becomes the alkane R–H, losing its usefulness. That is why you must work with <b>dry material</b> and <b>protect</b> the OH or NH groups of the substrates. Turn on “Presence of water” to see it.</p>"],
      ["Organolithiums and cuprates", "Other R–M", "The polarity of the C–M bond determines the reactivity",
        "<p>The more electropositive the metal, the more <b>ionic</b> the C–M bond and the more <b>reactive and basic</b> the carbanion: <b>R–Li &gt; R–MgX &gt; R–ZnX &gt; R₂CuLi</b>. <b>Organolithiums</b> react similarly to Grignards (sometimes faster); <b>Gilman cuprates</b> (R₂CuLi) are milder: they substitute halides and add 1,4 to enones without attacking the carbonyl.</p>"]
    ];
  }
  var def = {
    key: 'grignard-organometalicos', title: "Grignard Reagents", subtitle: "3D simulator · advanced organic chemistry", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 3, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 20, 4], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Reactive centers", icon: '◎' }, { id: 'arr', label: "Arrows", icon: '↷' }],
    build: function (ctx) { SG = MSim.stage(ctx); arr = MSim.arrow(ctx, 0xff7a3d); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 1) { S.e = ['fo', 'al', 'ce'][Math.min(2, Math.floor(f.local * 3))]; S.p = (f.local * 3) % 1; } else if (i === 2) { S.e = f.local < 0.5 ? 'co' : 'es'; S.p = (f.local * 2) % 1; } else if (i === 3) { S.wet = true; S.p = f.local; } else { S.wet = false; S.p = f.local; if (i === 0) S.e = 'ce'; } if (i !== 3) S.wet = false; }
      SG.begin(); arr.group.visible = false; lab.forEach(function (l) { l.vis(false); });
      var p = S.p, g = grig(S.r), E = ES[S.e], r = RS[S.r], hal = [{ tag: 'mg', nth: 0, color: 0x8aff00, r: 0.7, op: 0.3 }];
      var gk = 'g' + S.r;
      if (i === 0 && !P.manual) { var mg = SG.put('mg', { a: [['Mg', 0, 0, 0]], b: [], tag: [null] }, -6 + 4 * sm(p), 0, 0); var rb = SG.put('rb' + S.r, MSim.build(S.r === 'ph' ? 'Br{x}Ph' : r.s + 'Br{x}'), 4 - 2 * sm(p), 0, 0, []); lab[0].pos(-1, 4, 0).set('R–Br + Mg → R–MgBr', 'bl-lead').vis(true); if (p > 0.6) { SG.get('mg').visible = false; SG.get('rb' + S.r).visible = false; SG.put(gk, g, 0, 0, 0, hal); lab[1].pos(0, -3.8, 0).set("Cδ− –Mgδ+ (nucleophilic carbon)", 'bl-pos').vis(true); } return; }
      if (S.wet) {
        var alk = MSim.build(r.s); var gg = SG.put(gk, g, -4 - 2 * sm(p), 0, 0, hal), w = SG.put('w', MSim.build('O{o}'), 3 - 2.5 * sm(p), 0, 0, [{ tag: 'o', nth: 0, color: 0x4dabf7, r: 0.7, op: 0.3 }]);
        lab[0].pos(0, 4.2, 0).set("H₂O protonates the Grignard → R–H + Mg(OH)Br", 'bl-neg').vis(true); lab[1].pos(0, -3.8, 0).set("pKa(R–H) ≈ 50 ≫ pKa(H₂O) = 15.7", 'bl-d').vis(true);
        if (p > 0.8) { gg.visible = false; SG.get('w').visible = false; SG.put('alk' + S.r, alk, 0, 0, 0, []); lab[2].pos(0, -5, 0).set("The alkane is obtained: the reagent is lost", 'bl-neg').vis(true); } return;
      }
      var prod = MSim.build(E.mk(r.s)), el = MSim.build(E.e);
      if (p < 0.5) { var q = sm(p / 0.5), gm = SG.put(gk, g, -8 + 3 * q, 0, 0, hal), em = SG.put('el' + S.e, el, 3.5 - 0.5 * q, 0, 0, [{ tag: 'c', nth: 0, color: 0xff6b6b, r: 0.7, op: 0.3 }]); var a0 = MSim.wp(gm, g, g.nuc, 1), a1 = MSim.wp(em, el, MSim.idx(el, 'c', 0), 1); arr.set(a0, a1, new T.Vector3(0, 1.8, 0), ctx.layer('arr')); arr.tick(ctx.now); lab[0].pos(-2.5, 4.4, 0).set('R–MgBr + ' + E.n, 'bl-lead').vis(true); lab[1].pos(-2.5, -4, 0).set("the nucleophilic carbon attacks the C=O", 'bl-d').vis(true); }
      else { var q2 = sm((p - 0.5) / 0.5); var pm = SG.put('pr' + S.r + S.e, prod, 0, 0, 0, [{ tag: 'o', nth: 0, color: q2 > 0.5 ? 0x4dabf7 : 0xff6b6b, r: 0.7, op: 0.32 }]); lab[0].pos(0, 4.6, 0).set(q2 < 0.5 ? "magnesium alkoxide (R–C–O⁻ MgBr⁺)" : E.nm(S.r) + ' (' + E.cls + ')', 'bl-lead').vis(true); lab[1].pos(0, -4.4, 0).set(q2 < 0.5 ? "step 1: nucleophilic addition" : "step 2: H₃O⁺ protonates the O⁻", 'bl-d').vis(true); if (E.eq === 2) lab[2].pos(0, -5.4, 0).set("2 equivalents of RMgX: the ester passes through the ketone", 'bl-warn').vis(true); }
      SG.halos(ctx.layer('halo'));
    },
    sync: function (ctx) { var u = ctx.ui; if (u.r) u.r.set(S.r); if (u.e) u.e.set(S.e); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var E = ES[S.e], r = RS[S.r]; return { eq: { chip: 'R–Mg', name: r.f + 'MgBr + ' + E.n, body: "<div class=\"eqline\"><small>Product</small>" + E.nm(S.r) + "</div><div class=\"eqline\"><small>Type</small>" + E.cls + "</div><div class=\"eqline\"><small>RMgX equivalents</small>" + E.eq + '</div>' }, legend: [{ label: "Green halo", color: '#8aff00', text: "Mg (nucleophilic carbon)" }, { label: "Red halo", color: '#ff6b6b', text: "electrophilic C" }] }; },
    measures: function () { var E = ES[S.e]; return [['R', RS[S.r].n], ["Electrophile", E.n], ["Product", E.nm(S.r)], ["Class", E.cls], ["RMgX equivalents", String(E.eq)]]; },
    ideas: ["C–Mg: δ− carbon, nucleophile and strong base.", "Anhydrous ether: water destroys the reagent.", "Aldehyde → 2°, ketone → 3°, CO₂ → acid.", "Ester: 2 equivalents → tertiary alcohol."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction"); el.appendChild(c);
      ui.r = kit.ui.options({ label: "R group of the Grignard", cols: 3, value: S.r, options: Object.keys(RS).map(function (k) { return { v: k, label: RS[k].n }; }), onChange: function (v) { ctx.goManual(); S.r = v; S.wet = false; } }); c.appendChild(ui.r);
      ui.e = kit.ui.options({ label: "Electrophile", cols: 1, value: S.e, options: Object.keys(ES).map(function (k) { return { v: k, label: ES[k].n, sub: ES[k].cls }; }), onChange: function (v) { ctx.goManual(); S.e = v; S.wet = false; } }); c.appendChild(ui.e);
      ui.p = kit.ui.slider({ label: "Reaction progress", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: "Presence of water", fn: function () { ctx.goManual(); S.wet = !S.wet; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Acidity of the H⁺ sources (pKa)", h: 230, note: "The Grignard (pKa of R–H ≈ 50) deprotonates everything with a lower pKa.", draw: function (cx, w, h, col) {
        var D = [["R–H (alkane)", 50], ['NH₃/RNH₂', 38], ['R–C≡C–H', 25], ['ROH', 16], ['H₂O', 15.7], ['RCOOH', 4.8]], L = 80, Rr = 14, Tp = 12, B = 22, pw = w - L - Rr, bh = (h - Tp - B) / D.length;
        cx.font = '10px system-ui'; D.forEach(function (d, j) { var y = Tp + j * bh; cx.fillStyle = j ? '#fa5252' : '#69db7c'; cx.fillRect(L, y + 3, pw * d[1] / 55, bh - 6); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(d[1], L + pw * d[1] / 55 + 4, y + bh / 2 + 3); });
        cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('pKa', L + pw / 2, h - 6);
      } },
      { title: "Relative reactivity of R–M", h: 200, note: "Qualitative values according to the polarity of the C–M bond.", draw: function (cx, w, h, col) {
        var D = [['R–Li', 10, '#fa5252'], ['R–MgX', 7, '#fab005'], ['R–ZnX', 4, '#69db7c'], ['R₂CuLi', 2.5, '#4dabf7']], L = 56, Rr = 10, Tp = 10, B = 10, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
        D.forEach(function (d, j) { var y = Tp + j * bh; cx.fillStyle = d[2]; cx.fillRect(L, y + 4, pw * d[1] / 10, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); });
      } }
    ],
    calc: function () { var E = ES[S.e], r = RS[S.r], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + r.f + 'MgBr + ' + E.n + '</div><table class="calc-table">' + row("Step 1", "nucleophilic addition → alkoxide (R–C–OMgBr)") + row("Step 2", 'H₃O⁺ → ' + (S.e === 'co' ? 'RCOOH' : 'alcohol')) + row("Product", '<b>' + E.nm(S.r) + '</b>') + row("Class", E.cls) + row("Equivalents", String(E.eq)) + row("Carbons", (S.e === 'co' ? '+1 C (carboxilo)' : "new C–C bond")) + '</table>'; },
    quiz: [
      { q: "The carbon bonded to Mg in a Grignard is…", options: ["nucleophilic and basic", "electrophilic", "a radical", "neutral and unreactive"], answer: 0, why: "Cδ−: polarity inversion." },
      { q: "RMgX + ketone, then H₃O⁺, gives…", options: ["tertiary alcohol", "primary alcohol", "acid", "aldehyde"], answer: 0, why: "It adds to the C=O." },
      { q: "RMgX + CO₂, then H₃O⁺, gives…", options: ["carboxylic acid", 'alcohol', "ketone", "alkane"], answer: 0, why: "Carboxylate and then acid." },
      { q: "A Grignard + ester (excess) gives…", options: ["tertiary alcohol with two identical R groups", "acid", "aldehyde", 'amida'], answer: 0, why: "It passes through the ketone." },
      { q: "Suitable solvent for forming RMgX:", options: ["dry ether", "water", "ethanol", "acetic acid"], answer: 0, why: "It must be aprotic and anhydrous." },
      { q: "If there is water in the medium, the Grignard produces…", options: ["the alkane R–H", "the alcohol", "the acid", "nothing"], answer: 0, why: "It is protonated." }
    ],
    help: { intro: "Choose R and the electrophile; the control advances from the nucleophilic attack to the alcohol (or acid). “Presence of water” shows the protonation of the reagent.", items: [["Green halo", "Mg / nucleophilic carbon."], ["Red halo", "electrophilic C=O."]] }
  };
  MSim.create(def);
})();
