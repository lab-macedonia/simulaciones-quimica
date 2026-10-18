/* Nomenclatura IUPAC orgánica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var N = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
  var M = {
    hex: { nm: "hexane", s: 'C{n1}C{n2}C{n3}C{n4}C{n5}C{n6}', len: 6, fg: "alkane", par: 'hex', suf: "ane", pre: '', w: ["heptane", "pentane", "2-methylpentane"] },
    mp: { nm: "2-methylpentane", s: 'C{n1}C{n2}(C{s1})C{n3}C{n4}C{n5}', len: 5, fg: "alkane", par: 'pent', suf: "ane", pre: "2-methyl", w: ["4-methylpentane", "2-ethylbutane", "isohexane (not allowed by IUPAC)"] },
    em: { nm: "3-ethyl-2-methylpentane", s: 'C{n1}C{n2}(C{s1})C{n3}(C{s2}C{s3})C{n4}C{n5}', len: 5, fg: "alkane", par: 'pent', suf: "ane", pre: "3-ethyl-2-methyl", w: ["2-ethyl-3-methylpentane", "3-ethyl-4-methylpentane", "3-methyl-2-ethylpentane"] },
    dm: { nm: "2,2-dimethylbutane", s: 'C{n1}C{n2}(C{s1})(C{s2})C{n3}C{n4}', len: 4, fg: "alkane", par: 'but', suf: "ane", pre: "2,2-dimethyl", w: ["3,3-dimethylbutane", "2-dimethylbutane", "2,2-methylbutane"] },
    but2: { nm: 'but-2-eno', s: 'C{n1}C{n2}=C{n3}C{n4}', len: 4, fg: "alkene", par: 'but', suf: '-2-eno', pre: '', w: ['but-3-eno', "2,3-butene", "butane-2-eno"] },
    pen1: { nm: 'pent-1-eno', s: 'C{n1}=C{n2}C{n3}C{n4}C{n5}', len: 5, fg: "alkene", par: 'pent', suf: '-1-eno', pre: '', w: ['pent-4-eno', "pentane-1-eno", 'pent-2-eno'] },
    pen2i: { nm: 'pent-2-ino', s: 'C{n1}C{n2}#C{n3}C{n4}C{n5}', len: 5, fg: "alkyne", par: 'pent', suf: '-2-ino', pre: '', w: ['pent-3-ino', 'pent-2-eno', "pent-2-yne"] },
    mpe: { nm: "4-methylpent-2-eno", s: 'C{n1}C{n2}=C{n3}C{n4}(C{s1})C{n5}', len: 5, fg: "alkene", par: 'pent', suf: '-2-eno', pre: "4-methyl", w: ["2-methylpent-3-eno", "4-methylpent-3-eno", "2-methyl-4-pentene"] },
    but2ol: { nm: 'butan-2-ol', s: 'C{n1}C{n2}(O{f})C{n3}C{n4}', len: 4, fg: 'alcohol', par: 'but', suf: '-2-ol', pre: '', w: ['butan-3-ol', "2-hydroxybutane", 'butanol-2'] },
    prop1: { nm: 'propan-1-ol', s: 'C{n1}(O{f})C{n2}C{n3}', len: 3, fg: 'alcohol', par: 'prop', suf: '-1-ol', pre: '', w: ['propan-3-ol', 'propanol-2', "1-hydroxypropane"] },
    tbu: { nm: "2-methylpropan-2-ol", s: 'C{n1}C{n2}(C{s1})(O{f})C{n3}', len: 3, fg: 'alcohol', par: 'prop', suf: '-2-ol', pre: "2-methyl", w: ["2-methylpropan-1-ol", 'butan-2-ol', "1,1-dimethylethanol"] },
    mbol: { nm: "3-methylbutan-1-ol", s: 'C{n1}(O{f})C{n2}C{n3}(C{s1})C{n4}', len: 4, fg: 'alcohol', par: 'but', suf: '-1-ol', pre: "3-methyl", w: ["2-methylbutan-4-ol", "3-methylbutan-2-ol", 'isopentanol'] },
    butal: { nm: 'butanal', s: 'C{n1}(=O{f})C{n2}C{n3}C{n4}', len: 4, fg: "aldehyde", par: 'but', suf: 'al', pre: '', w: ['butan-1-ona', 'butanol', 'butan-4-al'] },
    pen2o: { nm: 'pentan-2-ona', s: 'C{n1}C{n2}(=O{f})C{n3}C{n4}C{n5}', len: 5, fg: "ketone", par: 'pent', suf: '-2-ona', pre: '', w: ['pentan-4-ona', 'pentanal', "2-oxopentane"] },
    ac: { nm: "butanoic acid", s: 'C{n1}(=O{f})(O{f})C{n2}C{n3}C{n4}', len: 4, fg: "carboxylic acid", par: 'but', suf: "oic", pre: '', w: ["butanal acid", "propanoic acid", "butan-1-oic acid"] },
    hb: { nm: "3-hydroxybutanal", s: 'C{n1}(=O{f})C{n2}C{n3}(O{s1})C{n4}', len: 4, fg: "aldehyde", par: 'but', suf: 'al', pre: "3-hydroxy", w: ['butan-3-ol-1-al', "2-hydroxybutanal", '3-oxobutanol'] },
    lac: { nm: "2-hydroxypropanoic acid", s: 'C{n1}(=O{f})(O{f})C{n2}(O{s1})C{n3}', len: 3, fg: "carboxylic acid", par: 'prop', suf: "oic", pre: "2-hydroxy", w: ["1-hydroxypropanoic acid", "propane-1,2-diol", "2-oxopropanoic acid"] },
    clm: { nm: "2-chloro-3-methylbutane", s: 'C{n1}C{n2}(Cl{s1})C{n3}(C{s2})C{n4}', len: 4, fg: "haloalkane", par: 'but', suf: "ane", pre: "2-chloro-3-methyl", w: ["3-chloro-2-methylbutane", "2-methyl-3-chlorobutane", "3-methyl-2-chlorobutane"] },
    bmp: { nm: "2-bromo-2-methylpropane", s: 'C{n1}C{n2}(Br{s1})(C{s2})C{n3}', len: 3, fg: "haloalkane", par: 'prop', suf: "ane", pre: "2-bromo-2-methyl", w: ["1-bromo-1,1-dimethylethane", "2-methyl-2-bromopropane", "2-bromo-methylpropane"] }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var PRI = ["carboxylic acid", "aldehyde", "ketone", 'alcohol', "amine", "alkene", "alkyne", "alkane", "haloalkane"];
  var SUF = { "carboxylic acid": "-oic acid", "aldehyde": '-al', "ketone": "-one", 'alcohol': '-ol', "amine": "-amine", "alkene": "-ene", "alkyne": "-yne", "alkane": "-ane", "haloalkane": "prefix (chloro-, bromo-)" };
  var S = { m: 'em', ans: null, score: 0, tot: 0, _st: -1, ch: true, nu: true }, lab = {}, SG, hs = [];
  var SEG = [['em', 'mp', 'mpe'], ['hex', 'mp', 'dm'], ['dm', 'em', 'tbu', 'mbol'], ['em', 'clm', 'bmp'], ['butal', 'pen2o', 'ac', 'but2ol', 'hb', 'lac', 'prop1'], Object.keys(M)];
  function stages() {
    return [
      ["Main chain", "Main chain", "The longest C chain containing the functional group and multiple bonds",
        "<p>The name is built from the <b>main chain</b> (blue): the one with the <b>most C atoms</b> that contains the <b>principal functional group</b> and the double/triple bonds. The remaining carbons are <b>substituents</b> (orange). In 3-ethyl-2-methylpentane the longest chain has 5 C (pentane); the ethyl and the methyl hang from it. If there are two chains of equal length, the one with more branches is chosen.</p>"],
      ["Length prefixes", "Prefixes", "meth · eth · prop · but · pent · hex · hept · oct · non · dec",
        "<p>The chain prefixes give the number of carbons: <b>1 meth-, 2 eth-, 3 prop-, 4 but-, 5 pent-, 6 hex-, 7 hept-, 8 oct-, 9 non-, 10 dec-</b>. The ending according to the functional group is added: <b>-ane</b> (single bonds), <b>-ene</b> (double), <b>-yne</b> (triple). As substituents: <b>methyl-, ethyl-, propyl-…</b> (they change “-ane” to “-yl”).</p>"],
      ["Numbering and locants", "Locants", "Number so as to give the lowest locants at the first point of difference",
        "<p>The chain is numbered from the end that gives the <b>lowest locant</b> first to the principal functional group, then to the double/triple bonds and finally to the substituents. In <b>2,2-dimethylbutane</b> the locants are {2,2} and not {3,3}. Locants are separated by commas and joined to the words with hyphens; the prefixes <b>di-, tri-, tetra-</b> indicate repetition.</p>"],
      ["Substituents and alphabetical order", "Substituents", "They are ordered alphabetically (ignoring di-, tri-)",
        "<p>Substituents are cited in <b>alphabetical order</b>, ignoring the multiplying prefixes (di-, tri-) but not those that are part of the name: <b>3-ethyl-2-methylpentane</b> (e before m); <b>2-chloro-3-methylbutane</b> (c before m). If there is a tie in locants when numbering from both ends, the lowest number goes to the substituent that comes first in alphabetical order.</p>"],
      ["Principal functional group", "Functional group", "Acid > aldehyde > ketone > alcohol > amine > alkene > alkyne",
        "<p>When there are several groups, the one with the highest <b>priority</b> is the principal one and determines the <b>ending</b>: <b>carboxylic acid (-oic) &gt; aldehyde (-al) &gt; ketone (-one) &gt; alcohol (-ol) &gt; amine (-amine) &gt; alkene (-ene) &gt; alkyne (-yne)</b>. The others are cited as prefixes: <b>hydroxy-, oxo-, amino-, chloro-</b>. Example: 3-hydroxybutanal is named that way, not “butan-3-ol-1-al”."],
      ["Practice", "Practice", "Test your nomenclature with 3D molecules",
        "<p>Go through the molecules and check your understanding. In “Lab” choose a molecule, press <b>“Exam mode”</b> (the name is hidden) and select one of the four options; the simulator tells you whether it is correct and why. Use the layers to see the main chain, the substituents, the functional group and the numbering.</p>"]
    ];
  }
  function opts(k) { var m = M[k], a = [m.nm].concat(m.w); var r = (k.length * 7 + a.length) % 4; var out = a.slice(); for (var i = 0; i < r; i++) out.push(out.shift()); return out; }
  var def = {
    key: 'nomenclatura-iupac', title: "IUPAC Organic Nomenclature", subtitle: "3D simulator · organic chemistry", accent: { dark: '#c084fc', light: '#7e22ce' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 3, 15], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 15], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 15, 2], target: [0, 0, 0] }],
    layers: [{ id: 'ch', label: "Main chain", icon: '━' }, { id: 'sub', label: "Substituents", icon: '▸' }, { id: 'fg', label: "Functional group", icon: '◎' }, { id: 'num', label: "Numbering", icon: '#' }],
    build: function (ctx) {
      SG = MSim.stage(ctx); Object.keys(M).forEach(function (k) { var g = SG.put(k, G[k], 0, 0, 0, { gs: 1.5 }); g.userData.hs = []; G[k].a.forEach(function (a, i) { var t = G[k].tag[i]; if (!t || a[0] === 'H') return; var h = new T.Mesh(new T.SphereGeometry(0.9, 16, 12), new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.38, depthWrite: false })); h.position.set(a[1] * 1.5, a[2] * 1.5, a[3] * 1.5); h.userData = { tag: t }; g.add(h); g.userData.hs.push(h); }); });
      for (var i = 0; i < 6; i++) lab['n' + i] = ctx.label('', 'bl-lead'); ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var sq = SEG[f.i], n = sq.length; S.m = sq[Math.min(n - 1, Math.floor(f.local * n))]; if (S._st !== f.i) { S._st = f.i; S.ans = null; } }
      var m = M[S.m]; SG.begin(); var g = SG.put(S.m, G[S.m], 0, 0.3, 0, { gs: 1.5 }); g.rotation.y = Math.sin(now * 0.3) * 0.35;
      var lc = ctx.layer('ch'), ls = ctx.layer('sub'), lf = ctx.layer('fg'), ln = ctx.layer('num');
      g.userData.hs.forEach(function (h) { var t = h.userData.tag, c = t[0] === 'n' ? (lc ? 0x4dabf7 : null) : (t[0] === 's' ? (ls ? 0xff922b : null) : (lf ? 0x51cf66 : null)); h.visible = c != null; if (c != null) h.material.color.setHex(c); });
      for (var i = 0; i < 6; i++) lab['n' + i].vis(false);
      g.updateMatrixWorld(true);
      G[S.m].tag.forEach(function (t, i) { if (t && t[0] === 'n' && ln && G[S.m].a[i][0] === 'C') { var k = parseInt(t.slice(1), 10) - 1; if (k < 6) { var p = MSim.wp(g, G[S.m], i, 1.5); lab['n' + k].pos(p.x, p.y + 1.1, p.z).set(String(k + 1), 'bl-lead').vis(true); } } });
      var hide = S.exam && S.ans == null;
      lab.t.pos(0, 5.6, 0).set(hide ? "What is it called?" : m.nm, 'bl-lead').vis(true);
      lab.a.pos(0, -4.6, 0).set(hide ? "main chain of " + m.len + ' C' : 'cadena: ' + m.len + ' C (' + m.par + ") · function: " + m.fg + (m.pre ? " · prefixes: " + m.pre : ''), 'bl-d').vis(true);
      lab.b.vis(false); lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); },
    hud: function () { var m = M[S.m]; return { eq: { chip: 'IUPAC', name: S.exam && S.ans == null ? '¿?' : m.nm, body: "<div class=\"eqline\"><small>Chain</small>" + m.par + "ane (" + m.len + " C)</div><div class=\"eqline\"><small>Function</small>" + m.fg + "</div><div class=\"eqline\"><small>Ending</small>" + SUF[m.fg] + "</div><div class=\"eqline\"><small>Prefixes</small>" + (m.pre || '—') + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "main chain" }, { label: "Orange", color: '#ff922b', text: "substituents" }, { label: "Green", color: '#51cf66', text: "functional group" }] }; },
    measures: function () { var m = M[S.m]; return [["Name", S.exam && S.ans == null ? '?' : m.nm], ["Main chain", m.par + "ane — " + m.len + ' C'], ["Functional group", m.fg], ["Ending", SUF[m.fg]], ["Prefixes", m.pre || '—'], ["Correct", S.score + ' / ' + S.tot]]; },
    ideas: ["1) Principal functional group · 2) longest chain containing it · 3) numbering · 4) prefixes in alphabetical order.", "Endings: -ane, -ene, -yne; -ol, -al, -one, -oic.", "Lowest locants to the principal group.", "Other functional groups go as prefixes (hydroxy-, oxo-…)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Molecule"); el.appendChild(c);
      ui.m = kit.ui.options({ label: "Molecule", cols: 3, value: S.m, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].nm.length > 16 ? M[k].nm.slice(0, 15) + '…' : M[k].nm, sub: M[k].fg }; }), onChange: function (v) { ctx.goManual(); S.m = v; S.ans = null; if (ui.ex) rebuildEx(); } }); c.appendChild(ui.m);
      var ex = kit.ui.card("Exam mode"); el.appendChild(ex); var out = document.createElement('p'); out.className = 'muted small'; ex.appendChild(out); ui.out = out;
      function rebuildEx() { if (ui.exo && ui.exo.parentNode) ui.exo.parentNode.removeChild(ui.exo); ui.exo = kit.ui.options({ label: "What is the correct name?", cols: 1, value: '', options: opts(S.m).map(function (n) { return { v: n, label: n }; }), onChange: function (v) { ctx.goManual(); S.ans = v; S.tot++; var ok = v === M[S.m].nm; if (ok) S.score++; out.innerHTML = (ok ? "<b>Correct.</b> " : "<b>No.</b> The answer is <b>" + M[S.m].nm + '</b>. ') + "Chain: " + M[S.m].par + "ane (" + M[S.m].len + " C), principal function: " + M[S.m].fg + '. Aciertos: ' + S.score + '/' + S.tot + '.'; } }); ex.insertBefore(ui.exo, out); }
      ex.appendChild(ctx.btnRow([{ t: "Turn on exam mode", primary: true, fn: function () { ctx.goManual(); S.exam = true; S.ans = null; out.textContent = "Choose an option."; rebuildEx(); } }, { t: "Next molecule", fn: function () { var ks = Object.keys(M), i = (ks.indexOf(S.m) + 1) % ks.length; ctx.goManual(); S.m = ks[i]; S.ans = null; if (ui.exo) rebuildEx(); } }, { t: "Back to the lesson", fn: function () { S.exam = false; ctx.toLesson(); } }])); rebuildEx();
    },
    graphs: [
      { title: "Chain-length prefixes", h: 150, note: "The current chain is highlighted.", draw: function (cx, w, h, col) {
        var m = M[S.m], L = 10, pw = w - 20, bw = pw / 10; cx.font = '11px system-ui'; cx.textAlign = 'center'; for (var i = 1; i <= 10; i++) { var cur = i === m.len; cx.fillStyle = cur ? '#c084fc' : 'rgba(134,142,150,.3)'; cx.fillRect(L + (i - 1) * bw + 2, 24, bw - 4, 40); cx.fillStyle = cur ? '#fff' : col.ink; cx.fillText(i, L + (i - 1) * bw + bw / 2, 42); cx.fillStyle = col.muted; cx.fillText(N[i], L + (i - 1) * bw + bw / 2, 82); } cx.fillText("number of carbons and prefix", w / 2, h - 12);
      } },
      { title: "Functional group priority", h: 240, note: "From highest to lowest priority; the principal one determines the ending.", draw: function (cx, w, h, col) {
        var m = M[S.m], rh = (h - 14) / PRI.length; cx.font = '11px system-ui'; PRI.forEach(function (p, i) { var cur = p === m.fg, y = 8 + i * rh; cx.fillStyle = cur ? '#c084fc' : 'rgba(134,142,150,.25)'; cx.fillRect(10 + i * 4, y, w - 20 - i * 4, rh - 4); cx.fillStyle = cur ? '#fff' : col.ink; cx.textAlign = 'left'; cx.fillText((i + 1) + '. ' + p, 18 + i * 4, y + rh / 2 + 3); cx.textAlign = 'right'; cx.fillText(SUF[p], w - 16, y + rh / 2 + 3); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = M[S.m];
      return '<div class="card-kicker">' + (S.exam && S.ans == null ? "Unknown molecule" : m.nm) + "</div><div class=\"calc-step\">Building the name</div><table class=\"calc-table\">" + row("1 · Principal function", m.fg + ' → ' + SUF[m.fg]) + row("2 · Main chain", m.len + ' C → ' + m.par + '-') + row("3 · Ending", m.suf) + row("4 · Prefixes", (m.pre || '—') + " (alphabetical order)") + row("Name", '<b>' + (S.exam && S.ans == null ? '?' : m.nm) + '</b>') + '</table>';
    },
    quiz: [
      { q: "The name of CH₃CH₂CH(CH₃)CH₃ is…", options: ["2-methylbutane", "3-methylbutane", "pentane", "isobutane"], answer: 0, why: "4-carbon chain; the methyl gets the lowest locant (2)." },
      { q: "In 3-ethyl-2-methylpentane the substituents are cited…", options: ["alphabetically: ethyl before methyl", "by size", "by locant", "however you like"], answer: 0, why: "e comes before m." },
      { q: "The ending of the aldehyde is…", options: ['-al', '-ol', "-one", "-oic acid"], answer: 0, why: 'butanal, propanal…' },
      { q: "Between alcohol and ketone, which is the principal group?", options: ["ketone", 'alcohol', "none", "depends on size"], answer: 0, why: "The ketone has higher priority: the OH is cited as hydroxy-." },
      { q: "How is CH₃–CH=CH–CH₂–CH₃ numbered?", options: ["from the end closest to the double bond", "always from the left", "from the most branched end", "from the C with the most H"], answer: 0, why: "Lowest locant to the double bond: pent-2-ene." },
      { q: "The prefix for 5 carbons is…", options: ['pent-', 'hex-', 'but-', 'prop-'], answer: 0, why: "meth, eth, prop, but, pent…" },
      { q: "The correct name of (CH₃)₃C–OH is…", options: ["2-methylpropan-2-ol", 'butan-2-ol', "2-methylpropan-1-ol", "tert-butane"], answer: 0, why: "3-carbon chain with OH and CH₃ on C2." },
      { q: "If there are two identical substituents, one uses…", options: ['di-, tri-…', "bis- always", "nothing", "a hyphen"], answer: 0, why: "2,2-dimethylbutane." }
    ],
    help: { intro: "Turn on the layers to see the main chain, the substituents, the functional group and the numbering. In “Lab” you can take a nomenclature exam.", items: [["Blue", "main chain."], ["Orange", 'sustituyentes.'], ["Green", "functional group."]] }
  };
  MSim.create(def);
})();
