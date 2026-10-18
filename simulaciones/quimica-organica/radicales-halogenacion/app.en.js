/* Radicales y halogenación en cadena — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var HAL = { Cl: { n: "Chlorine", r: 3.6, hx: 431, col: 0x3ddc5a, T: '25 °C', X2: 242 }, Br: { n: "Bromine", r: 97, hx: 366, col: 0xa0522d, T: '125 °C', X2: 193 } };
  var BDE = { me: ["Methyl", 439], et: ["Ethyl (1°)", 423], ip: ["Isopropyl (2°)", 413], tb: ["tert-Butyl (3°)", 404] };
  var G = {};
  G.pro = MSim.build('C{a+}C{b}C{c}');
  G.pP = MSim.strip(MSim.build('C{p+}CC'), 'p'); G.pS = MSim.strip(MSim.build('CC{s+}C'), 's'); G.prop = MSim.build('CCC');
  G.me = MSim.strip(MSim.build('C{r+}'), 'r'); G.et = MSim.strip(MSim.build('CC{r+}'), 'r'); G.ip = MSim.strip(MSim.build('CC{r+}C'), 'r'); G.tb = MSim.strip(MSim.build('CC{r+}(C)C'), 'r');
  G.clP = MSim.build('CCCCl'); G.clS = MSim.build('CC(Cl)C');
  var S = { step: 0, site: 's', hal: 'Cl', q: 0, rad: 'ip', run: false, _st: -1 }, lab = {}, SG, grp = {}, arr = [], X = [], Hs, bond, lobes = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function dist(h) { var r = HAL[h].r, p = 6, s = 2; return { s: s * r / (p + s * r), p: p / (p + s * r) }; }
  function stages() {
    return [
      ["Radicals and their stability", "Radicals", "Radical: C atom with an unpaired electron (nearly planar sp²)",
        "<p>A <b>radical</b> is a species with an <b>unpaired electron</b>. The radical carbon is nearly <b>planar (sp²)</b> and the electron occupies a p orbital (SOMO). Radicals are stabilized by <b>hyperconjugation</b> with neighboring C–H and C–C bonds, so <b>methyl &lt; 1° &lt; 2° &lt; 3°</b>. The stability is reflected in the C–H bond dissociation energy (BDE): <b>439 · 423 · 413 · 404 kJ/mol</b>.</p>"],
      ["Initiation", "Initiation", "X₂ + hν → 2 X• (homolytic cleavage)",
        "<p>Light (hν) or heat homolytically breaks the X–X bond: each atom keeps <b>one electron</b> (single-electron arrow, “fishhook”). Two <b>halogen radicals</b> X• form: Cl–Cl (242 kJ/mol) or Br–Br (193 kJ/mol). This step is infrequent and starts the <b>chain</b>.</p>"],
      ["Propagation 1: H abstraction", "Propagation 1", 'X• + R–H → H–X + R•',
        "<p>The X• radical <b>abstracts an H</b> from the alkane forming H–X and an <b>alkyl radical R•</b>. It can attack a <b>primary</b> H (6 in propane) or a <b>secondary</b> H (2). The secondary gives the more stable radical (BDE 413 vs 423 kJ/mol). The step is <b>exothermic</b> for Cl• (BDE H–Cl = 431) and <b>endothermic</b> for Br• (BDE H–Br = 366).</p>"],
      ["Propagation 2: R• + X₂", "Propagation 2", "R• + X₂ → R–X + X• (regenerates the radical)",
        "<p>The alkyl radical attacks an X₂ molecule and forms the <b>alkyl halide</b> and a <b>new X•</b>, which restarts the cycle. The two propagation steps repeat thousands of times per photon (<b>chain reaction</b>). The sum is: <b>R–H + X₂ → R–X + H–X</b>.</p>"],
      ["Selectivity: Cl versus Br", "Selectivity", "Cl• poorly selective (early TS) · Br• highly selective (late TS)",
        "<p>By the <b>Hammond postulate</b>: in chlorination (exothermic) the transition state is <b>early</b>, similar to the reactants, and hardly distinguishes 1° from 2°; in bromination (endothermic) it is <b>late</b>, similar to the radical, and reflects the greater stability of the 2°. Relative reactivity 2°:1° per H: <b>3.6 (Cl, 25 °C)</b> and <b>97 (Br, 125 °C)</b>. Propane: Cl → 57 % 2-chloro; Br → 97 % 2-bromo.</p>"],
      ["Ending", "Ending", "Two radicals combine and the chain stops",
        "<p>The chain is interrupted when two radicals meet and form a bond: <b>X• + X• → X₂</b>, <b>R• + X• → R–X</b> or <b>R• + R• → R–R</b>. Since the radical concentration is very low, termination is infrequent and each chain produces many product molecules. The yield per photon can be ≫ 1 (quantum yield).</p>"]
    ];
  }
  var SEG = [['me', 'et', 'ip', 'tb'], null, [['s', 'Cl'], ['p', 'Cl']], [['s', 'Cl'], ['p', 'Cl']], [['s', 'Br'], ['p', 'Br'], ['s', 'Cl']], null];
  function normal(g, i) { var nb = []; g.b.forEach(function (b) { if (b[0] === i) nb.push(b[1]); else if (b[1] === i) nb.push(b[0]); }); if (nb.length < 2) return V(0, 1, 0); var c = MSim.vec(g, i), a = MSim.vec(g, nb[0]).sub(c), b = MSim.vec(g, nb[1]).sub(c), n = a.cross(b); return n.lengthSq() < 1e-6 ? V(0, 1, 0) : n.normalize(); }
  var def = {
    key: 'radicales-halogenacion', title: "Radicals and halogenation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#fbbf24', light: '#b45309' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 19], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 19], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 19, 2], target: [0, 0, 0] }],
    layers: [{ id: 'somo', label: "Unpaired electron", icon: '•' }, { id: 'arrows', label: "Arrows", icon: '↷' }],
    build: function (ctx) {
      SG = MSim.stage(ctx);
      ['pro', 'pP', 'pS', 'me', 'et', 'ip', 'tb', 'clP', 'clS', 'prop'].forEach(function (k) { SG.put(k, G[k], 0, 0, 0, { gs: 1.4 }); });
      var cg = new T.SphereGeometry(1, 20, 14);
      for (var i = 0; i < 3; i++) { var m = new T.Mesh(cg, new T.MeshStandardMaterial({ color: 0x3ddc5a, roughness: 0.3 })); ctx.scene.add(m); X.push(m); }
      Hs = new T.Mesh(new T.SphereGeometry(0.4, 14, 10), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3 })); ctx.scene.add(Hs);
      bond = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8, 1, true), new T.MeshStandardMaterial({ color: 0xbfc7d1 })); ctx.scene.add(bond);
      for (i = 0; i < 2; i++) { var lb = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: i ? 0xff6b5e : 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false })); lb.visible = false; ctx.scene.add(lb); lobes.push(lb); }
      arr = [MSim.arrow(ctx, 0xff7a3d), MSim.arrow(ctx, 0xff7a3d)];
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.step = i; var sq = SEG[i];
        if (i === 0) { var n = sq.length, ix = Math.min(n - 1, Math.floor(l * n)); S.rad = sq[ix]; S.q = sm((l * n) % 1); }
        else if (i === 1) { S.hal = l < 0.5 ? 'Cl' : 'Br'; S.q = sm((l * 2) % 1); }
        else if (i >= 2 && i <= 4) { var n2 = sq.length, ix2 = Math.min(n2 - 1, Math.floor(l * n2)); S.site = sq[ix2][0]; S.hal = sq[ix2][1]; S.q = sm((l * n2) % 1); }
        else if (i === 5) { S.hal = 'Cl'; S.site = 's'; S.q = sm(l); }
      } else if (S.run) { S.q += dt / 5; if (S.q >= 1) { S.q = 1; S.run = false; } }
      var q = S.q, st = S.step, hl = HAL[S.hal], hs = SG; SG.begin(); X.forEach(function (x) { x.visible = false; }); Hs.visible = false; bond.visible = false; lobes.forEach(function (l) { l.visible = false; }); arr.forEach(function (a) { a.group.visible = false; });
      var ar = ctx.layer('arrows'), somo = ctx.layer('somo');
      function xs(i, p) { X[i].position.copy(p); X[i].visible = true; X[i].material.color.setHex(hl.col); X[i].scale.setScalar(S.hal === 'Cl' ? 0.8 : 0.95); }
      function link(a, b, w) { var d = b.clone().sub(a), L = d.length(); bond.visible = true; bond.position.copy(a).add(b).multiplyScalar(0.5); bond.scale.set(w || 0.08, L, w || 0.08); bond.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
      function lobe(g, key, gp) { var ci = MSim.idx(G[key], gp || 'r', 0), pc = MSim.wp(g, G[key], ci, 1.4), nrm = normal(G[key], ci).applyQuaternion(g.quaternion); lobes[0].position.copy(pc).addScaledVector(nrm, 0.85); lobes[1].position.copy(pc).addScaledVector(nrm, -0.85); lobes.forEach(function (l) { l.scale.set(0.5, 0.85, 0.5); l.quaternion.setFromUnitVectors(V(0, 1, 0), nrm); l.visible = somo; }); return pc; }
      var title = '', l1 = '', l2 = '';
      if (st === 0) {
        var g = SG.put(S.rad, G[S.rad], 0, 0, 0, { gs: 1.4 }); g.rotation.y = now * 0.3; g.updateMatrixWorld(true); lobe(g, S.rad);
        title = BDE[S.rad][0] + ' · radical'; l1 = "C–H BDE = " + BDE[S.rad][1] + ' kJ/mol'; l2 = "the more substituents, the more hyperconjugation";
      } else if (st === 1) {
        var d = 0.8 + 3.8 * sm(q), a = V(-d, 0, 0), b = V(d, 0, 0); xs(0, a); xs(1, b); if (q < 0.1) link(a, b, 0.12); else { link(a.clone(), b.clone(), 0.02); bond.material.opacity = 0.3; bond.visible = false; }
        if (ar) { arr[0].set(V(-0.3, 0.4, 0), V(-d + 0.6, 0.9, 0), V(0, 1.4, 0), q < 0.5); arr[1].set(V(0.3, 0.4, 0), V(d - 0.6, 0.9, 0), V(0, 1.4, 0), q < 0.5); }
        title = hl.n + ": initiation"; l1 = (S.hal === 'Cl' ? 'Cl–Cl' : 'Br–Br') + ' + hν → 2 ' + S.hal + '•'; l2 = "X–X BDE = " + hl.X2 + ' kJ/mol';
      } else if (st === 2 || st === 4) {
        var key = S.site === 's' ? 'pS' : 'pP', key0 = 'prop', gP = SG.put(q < 0.5 ? 'pro' : key, q < 0.5 ? G.pro : G[key], -3, 0, 0, { gs: 1.4 }), rem = G[key].h; gP.updateMatrixWorld(true);
        var hp0 = gP.localToWorld(V(rem[0], rem[1], rem[2]).multiplyScalar(1.4)); var dir = hp0.clone().sub(gP.localToWorld(V(0, 0, 0))).normalize(); if (dir.lengthSq() < .1) dir = V(1, 0, 0);
        var xf = hp0.clone().addScaledVector(dir, 7), early = S.hal === 'Cl', tsq = early ? 0.35 : 0.65;
        var hx = hp0.clone().addScaledVector(dir, 0), xp = xf.clone().lerp(hp0.clone().addScaledVector(dir, early ? 1.9 : 1.55), sm(Math.min(1, q / 0.5))), hpos;
        if (q < 0.5) { hpos = hp0.clone().addScaledVector(dir, 0.35 * sm(q / 0.5)); xs(0, xp); link(hpos, xp.clone(), 0.04); } else { var u = sm((q - 0.5) / 0.5); hpos = hp0.clone().addScaledVector(dir, 0.35 + 3.2 * u); var xx = hp0.clone().addScaledVector(dir, (early ? 1.9 : 1.55) + 3.2 * u); xs(0, xx); link(hpos, xx, 0.06); }
        Hs.position.copy(hpos); Hs.visible = true;
        if (ar && q < 0.5) { arr[0].set(xp.clone(), hpos.clone(), V(0, 1.2, 0.4), q > 0.1); }
        if (q >= 0.5 && gP.userData) { var rc = MSim.idx(G[key], key === 'pS' ? 's' : 'p', 0); }
        title = "Propagation 1 · " + S.hal + '• + ' + (S.site === 's' ? "secondary H (2°)" : "primary H (1°)"); l1 = (q < 0.5 ? S.hal + "• approaches the H" : 'H–' + S.hal + ' + radical ' + (S.site === 's' ? "isopropyl" : "propyl")); l2 = 'TS ' + (early ? "early (close to reactants)" : "late (close to the radical)") + ' · ΔH ≈ ' + (HAL[S.hal].hx > 400 ? '−' : '+') + Math.abs((S.site === 's' ? 413 : 423) - hl.hx) + ' kJ/mol';
        if (st === 4 && S.hal) { l2 += ' · 2°:1° = ' + hl.r; }
      } else if (st === 3) {
        var keyR = S.site === 's' ? 'pS' : 'pP', keyP = S.site === 's' ? 'clS' : 'clP', gR = SG.put(q < 0.55 ? keyR : keyP, q < 0.55 ? G[keyR] : G[keyP], -3, 0, 0, { gs: 1.4 });
        var cx = q < 0.55 ? 0 : 1, tgt = V(1.6, 0.6, 0), a2 = V(4.5 - 3 * sm(Math.min(1, q / 0.55)), 0.6, 0), b2 = a2.clone().add(V(1.9, 0, 0));
        if (q < 0.55) { xs(0, a2); xs(1, b2); link(a2, b2, 0.1); if (ar) arr[0].set(V(-1.2, 0.2, 0), a2.clone(), V(0, 1.2, 0), true); } else { var u2 = sm((q - 0.55) / 0.45); xs(0, V(1.4, 0.6, 0).add(V(0, 0, 0)).add(V(0, 0, 0))); xs(1, V(1.4 + 1.9 + 3.5 * u2, 0.6, 0)); X[0].visible = false; link(V(2.0, 0, 0), V(3.3, 0, 0), 0.0); bond.visible = false; }
        title = "Propagation 2 · R• + " + S.hal + '₂'; l1 = q < 0.55 ? "R• attacks the " + S.hal + '–' + S.hal : 'R–' + S.hal + ' + ' + S.hal + "• (regenerates the chain)"; l2 = "the chain continues";
      } else {
        var gR2 = SG.put('pS', G.pS, -3, 0, 0, { gs: 1.4 }), u3 = sm(q), pos = V(5 - 4 * u3, 0.6, 0); xs(0, pos);
        if (q > 0.85) { var gc = SG.put('clS', G.clS, -3, 0, 0, { gs: 1.4 }); gR2.visible = false; X[0].visible = false; }
        if (ar && q < 0.85) arr[0].set(pos.clone(), V(-1.6, 0.4, 0), V(0, 1.4, 0), true);
        title = "Termination · R• + Cl•"; l1 = q > 0.85 ? "2-chloropropane: chain terminated" : "two radicals combine"; l2 = "others: Cl• + Cl• → Cl₂ · R• + R• → R–R";
      }
      arr.forEach(function (a) { a.tick(now); });
      lab.t.pos(0, 6.3, 0).set(title, 'bl-lead').vis(true); lab.a.pos(0, -5, 0).set(l1, 'bl-pos').vis(true); lab.b.pos(0, -6, 0).set(l2, 'bl-d').vis(true); lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.rad) u.rad.set(S.rad); if (u.site) u.site.set(S.site); if (u.hal) u.hal.set(S.hal); if (!ctx.P.manual && u.q) u.q.set(S.q); },
    hud: function () { var d = dist(S.hal); return { eq: { chip: '•', name: "Radical halogenation", body: "<div class=\"eqline\"><small>Halogen</small>" + S.hal + '₂ (' + HAL[S.hal].T + ")</div><div class=\"eqline\"><small>2°:1° per H</small>" + HAL[S.hal].r + '</div><div class="eqline"><small>2-halopropano</small>' + fmt(d.s * 100, 0) + " %</div><div class=\"eqline\"><small>1-halopropane</small>" + fmt(d.p * 100, 0) + ' %</div>' }, legend: [{ label: "Lobes", color: '#4dabf7', text: "p orbital with the unpaired e⁻" }, { label: "Arrow", color: '#ff7a3d', arrow: true, text: "movement of 1 e⁻" }] }; },
    measures: function () { var d = dist(S.hal), h = HAL[S.hal]; return [["Halogen", h.n], ["Site attacked", S.site === 's' ? "Secondary H" : "Primary H"], ["2°:1° reactivity", String(h.r)], ["% 2-halopropane", fmt(d.s * 100, 1)], ["% 1-halopropane", fmt(d.p * 100, 1)], ["H–X BDE", h.hx + ' kJ/mol'], ["ΔH of 2° abstraction", ((413 - h.hx) > 0 ? '+' : '') + (413 - h.hx) + ' kJ/mol']]; },
    ideas: ["Radical: unpaired e⁻; stability 3° &gt; 2° &gt; 1° &gt; methyl.", "Initiation → propagation (2 steps) → termination.", "Cl•: fast and poorly selective; Br•: slow and highly selective.", "Hammond: exothermic ⇒ early TS; endothermic ⇒ late TS."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Radical and halogen"); el.appendChild(c);
      ui.hal = kit.ui.options({ label: "Halogen", cols: 2, value: S.hal, options: [{ v: 'Cl', label: 'Cl•', sub: "poorly selective" }, { v: 'Br', label: 'Br•', sub: "highly selective" }], onChange: function (v) { ctx.goManual(); S.hal = v; if (S.step < 2) S.step = 2; } }); c.appendChild(ui.hal);
      ui.site = kit.ui.options({ label: "H attacked in propane", cols: 2, value: S.site, options: [{ v: 'p', label: "Primary", sub: '6 H' }, { v: 's', label: "Secondary", sub: '2 H' }], onChange: function (v) { ctx.goManual(); S.site = v; if (S.step !== 2 && S.step !== 4) S.step = 2; } }); c.appendChild(ui.site);
      ui.rad = kit.ui.options({ label: "Radical (stability)", cols: 4, value: S.rad, options: Object.keys(BDE).map(function (k) { return { v: k, label: BDE[k][0].split(' ')[0], sub: BDE[k][1] + ' kJ/mol' }; }), onChange: function (v) { ctx.goManual(); S.rad = v; S.step = 0; } }); c.appendChild(ui.rad);
      ui.q = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.q = v; } }); c.appendChild(kit.ui.sliders([ui.q]));
      c.appendChild(ctx.btnRow([{ t: "▶ Step", primary: true, fn: function () { ctx.goManual(); S.q = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Profile of H abstraction (propane, 2° H)", h: 230, note: "Cl•: exothermic, early TS. Br•: endothermic, late TS (Hammond).", draw: function (cx, w, h, col) {
        var L = 40, Rr = 12, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (x) { return L + pw * x; }, sy = function (e) { return Tp + ph - ph * (e + 30) / 110; }, i;
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = -20; i <= 70; i += 30) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 5, sy(i) + 3); } cx.textAlign = 'center'; cx.fillText("reaction coordinate  ·  E (kJ/mol)", L + pw / 2, h - 4);
        [['Cl', 413 - 431, 4, 0.3, '#3ddc5a'], ['Br', 413 - 366, 56, 0.72, '#c0782c']].forEach(function (c) { var dH = c[1], Ea = c[2], xt = c[3], hh = Ea - dH * sm(xt); cx.strokeStyle = S.hal === c[0] ? c[4] : c[4]; cx.lineWidth = S.hal === c[0] ? 3.2 : 1.6; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = i / 80, y = dH * sm(x) + Math.max(0, hh) * Math.exp(-Math.pow((x - xt) / 0.2, 2)); if (i) cx.lineTo(sx(x), sy(y)); else cx.moveTo(sx(x), sy(y)); } cx.stroke(); cx.fillStyle = c[4]; cx.textAlign = 'left'; cx.fillText(c[0] + '•: ΔH = ' + (dH > 0 ? '+' : '') + dH + ' kJ/mol · Ea ≈ ' + Ea, L + 6, Tp + 10 + (c[0] === 'Br' ? 13 : 0)); }); cx.lineWidth = 1;
      } },
      { title: "Product distribution for propane", h: 190, note: "With the relative reactivity per H and the 6 primary and 2 secondary H atoms.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / 4, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 100; i += 25) { var y = Tp + ph - ph * i / 100; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i + ' %', L - 5, y + 3); }
        cx.textAlign = 'center'; [['Cl', 'p'], ['Cl', 's'], ['Br', 'p'], ['Br', 's']].forEach(function (a, k) { var v = dist(a[0])[a[1]], hh = ph * v; cx.fillStyle = a[1] === 's' ? '#ff922b' : '#4dabf7'; cx.fillRect(L + k * bw + 8, Tp + ph - hh, bw - 16, hh); cx.fillStyle = col.ink; cx.fillText(fmt(v * 100, 0) + ' %', L + k * bw + bw / 2, Tp + ph - hh - 4); cx.fillStyle = col.muted; cx.fillText((a[1] === 'p' ? '1-' : '2-') + a[0], L + k * bw + bw / 2, h - B + 13); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, h = HAL[S.hal], d = dist(S.hal);
      return "<div class=\"card-kicker\">Propane + " + S.hal + "₂ (hν)</div><div class=\"calc-step\">1 · Products</div><table class=\"calc-table\">" + row("Statistical weight", "6 primary H · 2 secondary H") + row("Reactivity", '1° = 1 · 2° = ' + h.r) + row('2-halopropano', '2 × ' + h.r + ' / (6 + 2 × ' + h.r + ') = <b>' + fmt(d.s * 100, 1) + ' %</b>') + row('1-halopropano', '6 / (6 + 2 × ' + h.r + ') = <b>' + fmt(d.p * 100, 1) + ' %</b>') + "</table><div class=\"calc-step\">2 · Thermochemistry of the abstraction</div><table class=\"calc-table\">" + row('ΔH (H 1°)', '423 − ' + h.hx + ' = ' + (423 - h.hx) + ' kJ/mol') + row('ΔH (H 2°)', '413 − ' + h.hx + ' = ' + (413 - h.hx) + ' kJ/mol') + row("Overall R–H + X₂", S.hal === 'Cl' ? "strongly exothermic (≈ −100 kJ/mol)" : "exothermic (≈ −35 kJ/mol)") + '</table>';
    },
    quiz: [
      { q: "The order of radical stability is…", options: ["3° > 2° > 1° > methyl", "methyl > 1° > 2° > 3°", "all equal", '1° > 3° > 2°'], answer: 0, why: "More hyperconjugation = greater stability." },
      { q: "Homolytic cleavage produces…", options: ["two radicals", "a cation and an anion", "a carbanion", "a carbocation"], answer: 0, why: "Each fragment keeps one electron." },
      { q: "Propagation step 1 is…", options: ['X• + R–H → HX + R•', 'R• + X₂ → RX + X•', 'X₂ → 2 X•', 'R• + R• → R–R'], answer: 0, why: "H abstraction." },
      { q: "Br• is more selective than Cl• because…", options: ["its TS is late", "it is smaller", "it has more electrons", "the reaction is exothermic"], answer: 0, why: "Endothermic bromination: TS similar to the radical." },
      { q: "The bromination of propane gives mainly…", options: ['2-bromopropano', '1-bromopropano', "dibromopropane", "propene"], answer: 0, why: "97 % through the secondary H." },
      { q: "Termination consists of…", options: ["combination of two radicals", "formation of radicals", "breaking of X₂", "abstraction"], answer: 0, why: "Radicals are consumed without being regenerated." },
      { q: "The sum of the propagation steps is…", options: ['R–H + X₂ → R–X + H–X', 'R–H → R• + H•', 'X₂ → 2 X•', '2 R• → R–R'], answer: 0, why: "The intermediate radicals cancel out." },
      { q: "The radical carbon is approximately…", options: ["planar (sp²)", "tetrahedral (sp³)", "linear (sp)", "octahedral"], answer: 0, why: "The unpaired e⁻ occupies a p orbital." }
    ],
    help: { intro: "Choose the halogen and the H attacked in “Lab” and press “Step”. The blue/red lobes are the p orbital with the unpaired electron.", items: [["Profile", "in Graphs: Cl• versus Br•."]] }
  };
  MSim.create(def);
})();
