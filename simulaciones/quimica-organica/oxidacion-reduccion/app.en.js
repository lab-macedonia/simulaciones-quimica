/* Oxidación y reducción en química orgánica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var M = {
    etoh: { n: "Ethanol", f: 'CH₃CH₂OH', s: 'CC{c}O{o}', cl: "1° alcohol", ox: -1 },
    ipoh: { n: 'Propan-2-ol', f: '(CH₃)₂CHOH', s: 'CC{c}(O{o})C', cl: "2° alcohol", ox: 0 },
    tbuoh: { n: "2-Methylpropan-2-ol", f: '(CH₃)₃COH', s: 'CC{c}(C)(C)O{o}', cl: "3° alcohol", ox: 1 },
    etanal: { n: "Ethanal", f: 'CH₃CHO', s: 'CC{c}=O{o}', cl: "aldehyde", ox: 1 },
    acetona: { n: "Propanone", f: '(CH₃)₂CO', s: 'CC{c}(=O{o})C', cl: "ketone", ox: 2 },
    acid: { n: "Ethanoic acid", f: 'CH₃COOH', s: 'CC{c}(=O{o})O', cl: "carboxylic acid", ox: 3 },
    ester: { n: "Ethyl ethanoate", f: 'CH₃COOEt', s: 'CC{c}(=O{o})OCC', cl: "ester", ox: 3 }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var RG = {
    pcc: { n: 'PCC', f: 'C₅H₅NH[CrO₃Cl]', k: 'ox', note: "Mild oxidant in anhydrous CH₂Cl₂; it stops at the aldehyde.", col: 0xf59f00 },
    jones: { n: 'Jones', f: 'CrO₃ / H₂SO₄ / H₂O', k: 'ox', note: "Strong oxidant in water: it takes the 1° alcohol all the way to the carboxylic acid.", col: 0xe8590c },
    nabh4: { n: 'NaBH₄', f: 'NaBH₄ / EtOH', k: 'red', note: "Mild hydride: reduces aldehydes and ketones; it does not reduce acids or esters.", col: 0x4dabf7 },
    lialh4: { n: 'LiAlH₄', f: "LiAlH₄ / Et₂O; then H₃O⁺", k: 'red', note: "Strong hydride: reduces aldehydes, ketones, acids and esters to alcohols.", col: 0x7048e8 }
  };
  var RX = { 'etoh|pcc': 'etanal', 'etoh|jones': 'acid', 'ipoh|pcc': 'acetona', 'ipoh|jones': 'acetona', 'etanal|jones': 'acid', 'etanal|pcc': 'acid', 'etanal|nabh4': 'etoh', 'etanal|lialh4': 'etoh', 'acetona|nabh4': 'ipoh', 'acetona|lialh4': 'ipoh', 'acid|lialh4': 'etoh', 'ester|lialh4': 'etoh' };
  var S = { sub: 'etoh', rg: 'pcc', q: 0, run: false, _st: -1 }, gr = {}, lab = {}, arr = [], rgM, SG;
  function prod(s, r) { return RX[s + '|' + r] || null; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var SEG = [
    [['etoh', 'pcc'], ['etanal', 'jones']],
    [['etoh', 'pcc'], ['etoh', 'jones']],
    [['ipoh', 'pcc'], ['tbuoh', 'pcc']],
    [['etanal', 'nabh4'], ['acetona', 'nabh4'], ['acid', 'nabh4'], ['acid', 'lialh4']],
    [['etanal', 'nabh4']],
    [['ester', 'nabh4'], ['ester', 'lialh4']]
  ];
  function stages() {
    return [
      ["Carbon oxidation states", "Oxidation states", "More C–O bonds (or fewer C–H) = more oxidized carbon",
        "<p>In organic chemistry an <b>oxidation</b> increases the number of C–O (or C–N, C–X) bonds or decreases the C–H bonds; a <b>reduction</b> does the opposite. The oxidation state of carbon is obtained by adding −1 for each H, +1 for each bond to O, N or X, and 0 for each C: <b>alkane −3 · 1° alcohol −1 · aldehyde +1 · acid +3 · CO₂ +4</b>. Oxidizing ethanol to ethanal means going from −1 to +1.</p>"],
      ["Primary alcohols", "1° alcohols", "PCC → aldehyde · Jones (aqueous Cr⁶⁺) → carboxylic acid",
        "<p>A primary alcohol is oxidized in two stages: <b>alcohol → aldehyde → acid</b>. With <b>PCC</b> (anhydrous) the reaction stops at the aldehyde. With <b>Jones</b> (aqueous CrO₃/H₂SO₄) the aldehyde is hydrated to the gem-diol and immediately oxidized to the <b>carboxylic acid</b>. In both cases Cr(VI) (orange) is reduced to Cr(III) (green).</p>"],
      ["Secondary and tertiary alcohols", "2° and 3° alcohols", "The 2° reaches a ketone; the 3° is not oxidized (it has no H on the carbinol carbon)",
        "<p>Oxidation removes the <b>H of the carbinol carbon</b>. A <b>secondary</b> alcohol becomes a <b>ketone</b> (with PCC or Jones; the ketone is not oxidized further). A <b>tertiary</b> alcohol <b>has no H</b> on that carbon and is not oxidized under these conditions. This difference makes it possible to distinguish the three classes of alcohols with the Jones reagent.</p>"],
      ["Reduction of carbonyls", "Reduction", "NaBH₄ reduces aldehydes and ketones · LiAlH₄ also acids and esters",
        "<p>Reducing a carbonyl group to an alcohol delivers <b>H⁻ (hydride)</b> to the carbon and H⁺ to the oxygen. <b>Aldehyde → 1° alcohol</b>; <b>ketone → 2° alcohol</b>. <b>NaBH₄</b> is a mild, selective hydride; <b>LiAlH₄</b> is much more reactive and also reduces acids and esters (to 1° alcohol), but reacts violently with water.</p>"],
      ["Hydride mechanism", "Mechanism", "H⁻ attacks the C=O (nucleophilic addition) and the alkoxide is protonated",
        "<p>1) The hydride, a nucleophile, attacks the <b>electrophilic carbon of the C=O</b>; the π electrons move onto the oxygen and an <b>alkoxide</b> forms. 2) The alkoxide is <b>protonated</b> by the solvent (EtOH) or by H₃O⁺ in the final work-up to give the alcohol. The carbon goes from having 1 bond to O (aldehyde: +1) to 1 single C–O bond and 2 C–H (alcohol: −1): it is <b>reduced</b>.</p>"],
      ["Reagent selectivity", "Selectivity", "A mild hydride leaves acids and esters intact",
        "<p><b>Chemoselectivity</b> makes it possible to reduce one group without touching another: with <b>NaBH₄</b> a ketone is reduced in the presence of an ester, but with <b>LiAlH₄</b> both are reduced. In the ester the alkoxy group is lost and two alcohols form (here ethanol + ethanol). Look at the substrate–reagent matrix in “Graphs”.</p>"]
    ];
  }
  var def = {
    key: 'oxidacion-reduccion-organica', title: "Organic Oxidation and Reduction", subtitle: "3D simulator · organic chemistry", accent: { dark: '#f87171', light: '#b91c1c' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 22], target: [0, 0.5, 0] }, { id: 'frontal', label: "Front", pos: [0, 1, 22], target: [0, 0.5, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Key carbon", icon: '◎' }, { id: 'arrows', label: "Arrows", icon: '↷' }],
    build: function (ctx) {
      SG = MSim.stage(ctx);
      Object.keys(M).forEach(function (k) { SG.put(k + 'S', G[k], -7, 0, 0, { halos: [{ tag: 'c', r: 0.75 }] }); SG.put(k + 'P', G[k], 7, 0, 0, { halos: [{ tag: 'c', r: 0.75 }] }); });
      rgM = new T.Mesh(new T.SphereGeometry(0.9, 24, 16), new T.MeshStandardMaterial({ color: 0xf59f00, roughness: 0.3, emissive: 0x442200 })); ctx.scene.add(rgM);
      arr = [MSim.arrow(ctx, 0xff7a3d)];
      ['t', 'a', 'b', 'c', 'd', 'e'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var seg = SEG[f.i], n = seg.length, ix = Math.min(n - 1, Math.floor(f.local * n)), lq = f.local * n - ix; S.sub = seg[ix][0]; S.rg = seg[ix][1]; S.q = f.i === 4 ? sm(f.local) : sm(Math.min(1, lq / 0.8)); }
      else if (S.run) { S.q += dt / 5; if (S.q >= 1) { S.q = 1; S.run = false; } }
      var pid = prod(S.sub, S.rg), r = RG[S.rg], q = S.q, e = sm(q);
      SG.begin();
      var sg = SG.put(S.sub + 'S', G[S.sub], -7, 0, 0), halo = ctx.layer('halo');
      sg.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; });
      var sOp = pid ? 1 - 0.7 * e : 1;
      if (pid) { var pg = SG.put(pid + 'P', G[pid], 7, 0, 0); pg.scale.setScalar(0.2 + 0.8 * e); pg.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; }); }
      sg.scale.setScalar(pid ? 1 - 0.25 * e : 1);
      var cs = MSim.wp(sg, G[S.sub], MSim.idx(G[S.sub], 'c'), 1);
      rgM.material.color.setHex(r.col); rgM.material.emissive.setHex(r.k === 'red' ? 0x1c3a6a : 0x442200);
      var from = new T.Vector3(0, 4.5, 0), to = cs.clone().add(new T.Vector3(0.1, 1.4, 0.3));
      rgM.position.copy(from).lerp(to, sm(Math.min(1, q * 2))); rgM.scale.setScalar(r.k === 'red' ? 0.55 : 0.9);
      arr[0].group.visible = false;
      if (ctx.layer('arrows') && q < 0.6 && pid) { arr[0].set(rgM.position.clone(), cs.clone().add(new T.Vector3(0, 0.1, 0)), new T.Vector3(0.6, 0.5, 0.5), true); }
      arr[0].tick(now);
      lab.t.pos(0, 7.8, 0).set(M[S.sub].n + '  +  ' + r.n + (pid ? '  →  ' + M[pid].n : "  →  no reaction"), 'bl-lead').vis(true);
      lab.a.pos(-7, -4.2, 0).set(M[S.sub].f + ' · ' + M[S.sub].cl + ' · C: ' + M[S.sub].ox, 'bl-d').vis(true);
      lab.b.pos(7, -4.2, 0).set(pid ? M[pid].f + ' · ' + M[pid].cl + ' · C: ' + M[pid].ox : '—', pid ? 'bl-pos' : 'bl-warn').vis(true);
      lab.c.pos(0, 5.9, 0).set(r.f, 'bl-d').vis(true);
      var dox = pid ? M[pid].ox - M[S.sub].ox : 0;
      lab.d.pos(0, -1.6, 0).set(pid ? (dox > 0 ? "OXIDATION (Δ = +" + dox + ')' : "REDUCTION (Δ = " + dox + ')') : (S.sub === 'tbuoh' ? "the carbinol carbon has no H" : "the reagent cannot reduce it"), pid ? (dox > 0 ? 'bl-warn' : 'bl-neg') : 'bl-d').vis(true);
      lab.e.pos(0, -2.7, 0).set(r.note, 'bl-d').vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.rg) u.rg.set(S.rg); if (!ctx.P.manual && u.q) u.q.set(S.q); },
    hud: function () { var pid = prod(S.sub, S.rg), r = RG[S.rg]; return { eq: { chip: r.k === 'ox' ? '[O]' : '[H]', name: M[S.sub].n + ' + ' + r.n, body: "<div class=\"eqline\"><small>Substrate</small>" + M[S.sub].cl + "</div><div class=\"eqline\"><small>Reagent</small>" + r.f + "</div><div class=\"eqline\"><small>Product</small>" + (pid ? M[pid].n : "no reaction") + '</div>' }, legend: [{ label: 'Halo', color: '#ffd43b', text: "carbon that changes" }, { label: "Arrow", color: '#ff7a3d', arrow: true, text: "e⁻ pair / hydride" }] }; },
    measures: function () { var pid = prod(S.sub, S.rg); return [["Substrate", M[S.sub].n], ["Class", M[S.sub].cl], ["Reagent", RG[S.rg].n], ["Type", RG[S.rg].k === 'ox' ? "oxidant" : "reductant (hydride)"], ["Product", pid ? M[pid].n : "no reaction"], ["C ox. state", M[S.sub].ox + (pid ? ' → ' + M[pid].ox : '')]]; },
    ideas: ["Oxidation: ↑ C–O bonds / ↓ C–H. Reduction: the opposite.", "1° alcohol → aldehyde (PCC) → acid (Jones); 2° → ketone; 3° does not react.", "NaBH₄: aldehyde and ketone. LiAlH₄: also acid and ester.", "The hydride attacks the C of the C=O (nucleophilic addition)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction"); el.appendChild(c);
      ui.sub = kit.ui.options({ label: "Substrate", cols: 2, value: S.sub, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].n, sub: M[k].cl }; }), onChange: function (v) { ctx.goManual(); S.sub = v; S.q = 0; } }); c.appendChild(ui.sub);
      ui.rg = kit.ui.options({ label: "Reagent", cols: 2, value: S.rg, options: Object.keys(RG).map(function (k) { return { v: k, label: RG[k].n, sub: RG[k].k === 'ox' ? "oxidant" : "reductant" }; }), onChange: function (v) { ctx.goManual(); S.rg = v; S.q = 0; } }); c.appendChild(ui.rg);
      ui.q = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.q = v; } }); c.appendChild(kit.ui.sliders([ui.q]));
      c.appendChild(ctx.btnRow([{ t: "▶ React", primary: true, fn: function () { ctx.goManual(); S.q = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Carbon oxidation ladder", h: 200, note: "Oxidation state of the functional carbon. Up = oxidize, down = reduce.", draw: function (cx, w, h, col) {
        var steps = [["alkane", -3], ["1° alcohol", -1], ["aldehyde", 1], ["acid", 3], ['CO₂', 4]], L = 16, Rr = 10, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B, bw = pw / steps.length, sy = function (v) { return Tp + ph - ph * (v + 3.5) / 8; }, cur = M[S.sub].ox, pid = prod(S.sub, S.rg), i;
        cx.font = '10.5px system-ui'; cx.textAlign = 'center'; steps.forEach(function (s, k) { var x = L + k * bw + bw / 2; cx.fillStyle = '#f87171'; cx.fillRect(x - bw * 0.35, sy(s[1]) - 3, bw * 0.7, 6); cx.fillStyle = col.muted; cx.fillText(s[0], x, h - B + 14); cx.fillStyle = col.ink; cx.fillText(s[1] > 0 ? '+' + s[1] : s[1], x, sy(s[1]) - 8); });
        var drawM = function (v, c) { cx.strokeStyle = c; cx.lineWidth = 2; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(L, sy(v)); cx.lineTo(L + pw, sy(v)); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; };
        drawM(cur, '#4dabf7'); if (pid) drawM(M[pid].ox, '#51cf66');
      } },
      { title: "Substrate–reagent matrix", h: 230, note: "Green: the reaction occurs · gray: no reaction under these conditions. Current row highlighted.", draw: function (cx, w, h, col) {
        var subs = Object.keys(M), rgs = Object.keys(RG), L = 100, Tp = 24, cw = (w - L - 8) / rgs.length, rh = (h - Tp - 8) / subs.length; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted;
        rgs.forEach(function (r, j) { cx.fillText(RG[r].n, L + j * cw + cw / 2, 15); });
        subs.forEach(function (s, i) { cx.textAlign = 'right'; cx.fillStyle = s === S.sub ? col.ink : col.muted; cx.fillText(M[s].n.slice(0, 18), L - 6, Tp + i * rh + rh / 2 + 3); rgs.forEach(function (r, j) { var p = prod(s, r); cx.fillStyle = p ? (RG[r].k === 'ox' ? 'rgba(248,113,113,.75)' : 'rgba(77,171,247,.75)') : 'rgba(134,142,150,.25)'; cx.fillRect(L + j * cw + 2, Tp + i * rh + 2, cw - 4, rh - 4); if (s === S.sub && r === S.rg) { cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.5; cx.strokeRect(L + j * cw + 2, Tp + i * rh + 2, cw - 4, rh - 4); cx.lineWidth = 1; } }); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, pid = prod(S.sub, S.rg), r = RG[S.rg], s = M[S.sub];
      return '<div class="card-kicker">' + s.n + ' + ' + r.n + "</div><div class=\"calc-step\">1 · Oxidation state of the key carbon</div><table class=\"calc-table\">" + row("Substrate", s.f + ' → C: <b>' + s.ox + '</b>') + row("Product", pid ? M[pid].f + ' → C: <b>' + M[pid].ox + '</b>' : "no reaction") + (pid ? row('Δ', (M[pid].ox - s.ox > 0 ? '+' : '') + (M[pid].ox - s.ox) + ' → ' + (M[pid].ox > s.ox ? "oxidation" : "reduction") + ' (' + Math.abs(M[pid].ox - s.ox) + " e⁻ per molecule)") : '') + '</table><p class="muted small">' + r.note + '</p>';
    },
    quiz: [
      { q: "PCC oxidizes a primary alcohol to…", options: ["aldehyde", "carboxylic acid", "ketone", "alkane"], answer: 0, why: "In an anhydrous medium the oxidation stops at the aldehyde." },
      { q: "The tertiary alcohol is not oxidized by Jones because…", options: ["it has no H on the carbinol carbon", "it is very bulky", "it is very acidic", "it forms an ether"], answer: 0, why: "Oxidation needs to remove an H from the carbon that bears the OH." },
      { q: "What reduces a ketone but not an ester?", options: ['NaBH₄', 'LiAlH₄', "both", "none"], answer: 0, why: "NaBH₄ is a mild hydride." },
      { q: "The reduction of an aldehyde with NaBH₄ produces…", options: ["primary alcohol", "secondary alcohol", "acid", "alkane"], answer: 0, why: 'R–CHO + H⁻ → R–CH₂–OH.' },
      { q: "Oxidation state of the carbon of the COOH group:", options: ['+3', '+1', '+2', '−1'], answer: 0, why: "Three bonds to O and one to C." },
      { q: "In the hydride mechanism, H⁻ attacks…", options: ["the carbon of the C=O", "the oxygen of the C=O", "the hydrogen of the OH", "the metal"], answer: 0, why: "The carbonyl carbon is electrophilic." },
      { q: "Jones (CrO₃/H₂SO₄) changes color because…", options: ["orange Cr(VI) is reduced to green Cr(III)", "H₂SO₄ is oxidized", "CO₂ forms", "the pH changes"], answer: 0, why: "Chromium is reduced while it oxidizes the alcohol." },
      { q: "LiAlH₄ reduces an ester to…", options: ["alcohol(s)", "aldehyde", "ketone", "acid"], answer: 0, why: "The primary alcohol from the acyl portion and the alcohol from the alkoxy group are obtained." }
    ],
    help: { intro: "Choose substrate and reagent in “Lab” and press “React”. The orange sphere is the oxidant (Cr⁶⁺) and the blue/violet one the hydride; the halo marks the carbon that changes.", items: [["Matrix", "in Graphs: which reagent transforms which substrate."]] }
  };
  MSim.create(def);
})();
