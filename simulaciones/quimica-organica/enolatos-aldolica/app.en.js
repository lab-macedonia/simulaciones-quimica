/* Enolatos y condensación aldólica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var PR = [
    { id: 'ald', n: "Aldehyde (ethanal)", pka: 17, t: "aldehyde" }, { id: 'cet', n: "Ketone (propanone)", pka: 19.3, t: "ketone" }, { id: 'est', n: "Ester (ethyl ethanoate)", pka: 25, t: "ester" }, { id: 'ami', n: "Amide (N,N-dimethylacetamide)", pka: 30, t: 'amida' },
    { id: 'mal', n: "Diethyl malonate", pka: 13, t: "β-dicarbonyl ester" }, { id: 'aca', n: "Ethyl acetoacetate", pka: 10.7, t: "β-ketoester" }, { id: 'acac', n: "Pentane-2,4-dione", pka: 8.9, t: "β-diketone" }
  ];
  var BA = [{ id: 'OH', n: 'NaOH', ph: 15.7 }, { id: 'EtO', n: 'EtONa', ph: 15.9 }, { id: 'NaH', n: 'NaH', ph: 35 }, { id: 'LDA', n: 'LDA', ph: 36 }];
  var PID = {}; PR.forEach(function (p) { PID[p.id] = p; }); var BID = {}; BA.forEach(function (b) { BID[b.id] = b; });
  var G = {
    ald: MSim.build('C{al+}C{c}=O{o}'), eno: MSim.strip(MSim.build('C{al}=C{c}O{e}'), 'e'), elec: MSim.build('CC{c}=O{o}'), alk: MSim.strip(MSim.build('CC{c}(O{o})C{al}C{cc}=O'), 'o'), aldol: MSim.build('CC{c}(O{o})C{al}C{cc}=O'),
    eno2: MSim.strip(MSim.build('CC{c}(O{o})C{al}=C{cc}O{e}'), 'e'), crot: MSim.build('CC{c}=C{al}C{cc}=O'), oh: MSim.strip(MSim.build('O{o}'), 'o'), benz: MSim.build('O{o}=C{c}Ph'), enoa: MSim.strip(MSim.build('C{al}=C{c}(O{e})C'), 'e'), bza: MSim.build('CC{c}(=O{o})C{al}=C{cc}Ph')
  };
  ['ald', 'eno', 'elec', 'alk', 'aldol', 'eno2', 'crot', 'oh', 'benz', 'enoa', 'bza'].forEach(function (k) { if (!G[k].tag) G[k].tag = []; });
  var S = { si: 0, prog: 0, run: false, pr: 'ald', b: 'OH' }, SG, arr = [], lab = {}, base, hp;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function K(p, b) { return Math.pow(10, b.ph - p.pka); }
  function stages() {
    return [
      ["Acidity of the α hydrogen", 'H α', "The H on the carbon next to the C=O is much more acidic than a normal C–H",
        "<p>The hydrogens on the <b>α carbon</b> (the neighbor of the carbonyl) are <b>acidic</b>: pKa ≈ 17 (aldehyde), 19–20 (ketone), 25 (ester), compared with 50 for an alkane. The reason: when H⁺ is lost the negative charge is <b>delocalized onto the oxygen</b>. If the C–H lies between <b>two carbonyls</b> (malonate 13, acetoacetate 10.7, acetylacetone 8.9) the acidity grows even more.</p>"],
      ["Enolate formation", "Enolate", "A base removes the α H; the charge is shared between C and O",
        "<p>The base takes the α H (arrow 1), the pair of the C–H bond forms the C=C double bond (arrow 2) and the π bond of the C=O moves onto the oxygen (arrow 3). The <b>enolate</b> is a hybrid of two resonance forms: <b>C⁻</b> (carbanion) and <b>O⁻</b> (vinyl alkoxide). It is a <b>nucleophile at C</b> and therefore forms C–C bonds. With NaOH only a small fraction of the ketone is converted to enolate; with <b>LDA</b> the conversion is complete.</p>"],
      ["Aldol addition", "Addition", "The enolate attacks the carbonyl of another molecule: new C–C bond",
        "<p>The nucleophilic carbon of the enolate (C=C π pair, arrow 1) attacks the electrophilic carbon of a second ethanal molecule; the π bond of the C=O moves onto the oxygen (arrow 2). An <b>alkoxide</b> with a new C–C bond forms: two 2-carbon molecules give one 4-carbon molecule. It is the same attack along the Bürgi–Dunitz trajectory as in addition to the carbonyl.</p>"],
      ["Protonation: the aldol", 'Aldol', "The alkoxide is protonated and gives a β-hydroxyaldehyde",
        "<p>The alkoxide picks up an H⁺ from the solvent (water or alcohol) and <b>3-hydroxybutanal</b> is obtained, an <b>aldol</b> (<b>ald</b>ehyde + alco<b>hol</b>): an OH group at the β position relative to the C=O. At low temperature and with dilute base the reaction stops here and is <b>reversible</b> (retro-aldol).</p>"],
      ["Dehydration (E1cB)", 'E1cB', "With heat, the aldol loses water and forms a conjugated enal",
        "<p>On heating, the base removes the α H of the aldol (enolate) and the pair expels the <b>OH⁻</b> from the β carbon (<b>E1cB</b> mechanism): <b>but-2-enal</b> (crotonaldehyde) forms, a conjugated <b>α,β-unsaturated</b> carbonyl compound. The C=C–C=O conjugation stabilizes it and the loss of water makes the process <b>irreversible</b>: this is the <b>aldol condensation</b>.</p>"],
      ["Crossed aldol (Claisen–Schmidt)", "Crossed", "An aldehyde without α H acts only as an electrophile",
        "<p><b>Benzaldehyde</b> has no α H: it cannot form an enolate, it only acts as an electrophile. <b>Propanone</b> forms the enolate and attacks benzaldehyde; after dehydration <b>4-phenylbut-3-en-2-one</b> (benzalacetone) is obtained, conjugated with the ring and the ketone. This avoids the mixture of four products that would appear on combining two enolizable carbonyls.</p>"],
      ["Choosing conditions", "Conditions", "Weak base: little enolate and reversible · strong base: complete enolate",
        "<p>With <b>NaOH/EtONa</b> there is an equilibrium between carbonyl and enolate (K = 10<sup>pKa(HB) − pKa(HA)</sup>): the enolate can react with its own carbonyl (aldol). With a strong, non-nucleophilic base (<b>LDA</b>, NaH) the carbonyl is converted <b>completely</b> into the enolate before the electrophile is added: this allows directed crossed aldols and alkylations. Change the precursor and the base in “Lab” and look at the value of K in “Calculation”.</p>"]
    ];
  }
  function scene(ctx, si, p, now) {
    SG.begin(); var gs = 1, A = arr, il = ctx.layer('arrows'), t = lab; arr.forEach(function (a) { a.group.visible = false; }); base.visible = false; hp.visible = false;
    var show = function (key, geo, x, y, z, halos) { return SG.put(key + '@' + si, geo, x, y, z, { halos: halos }); };
    var red = 0xff5c5c, blue = 0x4dabf7, yel = 0xffd43b;
    var nm = function (L, x, y, txt, cls) { L.pos(x, y, 0).set(txt, cls || 'bl-d').vis(true); };
    var arrow = function (k, p0, p1, bend, on) { A[k].set(p0, p1, bend, on && il); };
    if (si === 0) {
      var g = show('ald', G.ald, 0, 0, 0, [{ tag: 'al', nth: 0, color: yel, r: 0.75 }, { tag: 'al', nth: 1, color: yel, r: 0.5 }, { tag: 'al', nth: 2, color: yel, r: 0.5 }, { tag: 'al', nth: 3, color: yel, r: 0.5 }, { tag: 'o', nth: 0, color: red, r: 0.7, op: 0.3 }]);
      g.rotation.y = now * 0.25; var pk = PID[S.pr]; nm(t.a, 0, 3.4, pk.n.replace(/ \(.*\)/, '') + " · pKa of the α H ≈ " + f1(pk.pka), 'bl-lead'); nm(t.b, 0, -3.1, "versus pKa ≈ 50 for an alkane C–H", 'bl-d'); nm(t.c, 3.4, 1.3, "C=O withdraws e⁻: the α H is acidic", 'bl-warn');
    } else if (si === 1) {
      var q = sm(p / 0.5);
      if (p < 0.5) {
        var g1 = show('ald', G.ald, 0, 0, 0, [{ tag: 'al', nth: 1, color: yel, r: 0.5 }]); var ih = MSim.idx(G.ald, 'al', 1), ic = MSim.idx(G.ald, 'al', 0), icc = MSim.idx(G.ald, 'c', 0), io = MSim.idx(G.ald, 'o', 0);
        var ph = MSim.wp(g1, G.ald, ih, gs), pc = MSim.wp(g1, G.ald, ic, gs), pcc = MSim.wp(g1, G.ald, icc, gs), po = MSim.wp(g1, G.ald, io, gs);
        var bp = ph.clone().add(new T.Vector3(-2.6 + 1.6 * q, 1.4 - 0.8 * q, 0.4)); base.visible = true; base.position.copy(bp); nm(t.a, bp.x, bp.y + 1.1, 'B:⁻ (base)', 'bl-warn');
        arrow(0, bp.clone(), ph, new T.Vector3(0, 0.9, 0), true); arrow(1, ph.clone().lerp(pc, 0.5), pc.clone().lerp(pcc, 0.5), new T.Vector3(0, 0.9, 0.3), q > 0.3); arrow(2, pcc.clone().lerp(po, 0.5), po, new T.Vector3(0.2, 0.7, 0), q > 0.6);
        nm(t.b, 0, -3.1, "arrows: ① the base takes H⁺ · ② C–H → C=C · ③ C=O → O⁻", 'bl-d'); nm(t.c, 0, 3.4, "ethanal + base", 'bl-lead');
      } else {
        var e1 = show('eno', G.eno, -4.5, 0, 0, [{ tag: 'al', nth: 0, color: red, r: 1.0, op: 0.4 }]), e2 = show('eno2b', G.eno, 4.5, 0, 0, [{ tag: 'e', nth: 0, color: red, r: 1.0, op: 0.4 }]);
        var iO = MSim.idx(G.eno, 'c', 0); e1.rotation.y = e2.rotation.y = 0; nm(t.a, -4.5, 3.1, "C⁻ form (carbanion)", 'bl-warn'); nm(t.b, 4.5, 3.1, "O⁻ form (O-enolate)", 'bl-warn'); nm(t.c, 0, 0.2, "↔ resonance", 'bl-lead'); nm(t.d, 0, -3.3, "enolate: nucleophile at C · charge shared between C and O", 'bl-d');
      }
    } else if (si === 2) {
      var d = 5.2 - 3.4 * sm(p / 0.55), x = d / 2;
      if (p < 0.6) {
        var ge = show('eno', G.eno, 0, 0, 0, [{ tag: 'al', nth: 0, color: red, r: 0.9, op: 0.4 }]), gl = show('elec', G.elec, 0, 0, 0);
        MSim.dock(ge, G.eno, MSim.idx(G.eno, 'al', 0), new T.Vector3(-x, 0, 0), new T.Vector3(-1, 0.2, 0), gs); MSim.dock(gl, G.elec, MSim.idx(G.elec, 'c', 0), new T.Vector3(x, 0, 0), new T.Vector3(1, 0.3, 0), gs);
        var pa = MSim.wp(ge, G.eno, MSim.idx(G.eno, 'al', 0), gs), pb = MSim.wp(gl, G.elec, MSim.idx(G.elec, 'c', 0), gs), po2 = MSim.wp(gl, G.elec, MSim.idx(G.elec, 'o', 0), gs);
        arrow(0, pa.clone().add(new T.Vector3(0.1, 0.1, 0)), pb, new T.Vector3(0, 1.0, 0), true); arrow(1, pb.clone().lerp(po2, 0.5), po2, new T.Vector3(0, 0.8, 0.2), true);
        nm(t.a, -x - 1.6, 2.7, "enolate (nucleophile)", 'bl-warn'); nm(t.b, x + 1.6, 2.7, "ethanal (electrophile)", 'bl-lead'); nm(t.c, 0, -3.3, "C···C distance ≈ " + f1(d) + ' Å', 'bl-d');
      } else { show('alk', G.alk, 0, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); nm(t.a, 0, 3.4, "alkoxide: new C–C bond", 'bl-lead'); nm(t.b, 0, -3.3, "2 C + 2 C → 4-carbon chain", 'bl-d'); }
    } else if (si === 3) {
      if (p < 0.5) {
        var ga = show('alk', G.alk, 0, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); var io3 = MSim.idx(G.alk, 'o', 0), po3 = MSim.wp(ga, G.alk, io3, gs), q3 = sm(p / 0.45);
        hp.visible = true; hp.position.copy(po3).add(new T.Vector3(-2.8 + 1.8 * q3, 1.8 - 0.8 * q3, 0)); arrow(0, po3.clone(), hp.position.clone(), new T.Vector3(0, 0.7, 0.3), true); nm(t.a, hp.position.x, hp.position.y + 0.8, "H⁺ (from H₂O)", 'bl-warn'); nm(t.b, 0, 3.4, "alkoxide", 'bl-lead'); nm(t.c, 0, -3.3, "the O⁻ picks up H⁺", 'bl-d');
      } else { show('aldol', G.aldol, 0, 0, 0, [{ tag: 'o', nth: 0, color: 0xffa94d, r: 0.7 }, { tag: 'cc', nth: 0, color: blue, r: 0.7, op: 0.3 }]); nm(t.a, 0, 3.4, "3-hydroxybutanal (aldol)", 'bl-lead'); nm(t.b, 0, -3.3, "OH at β to the C=O · reversible (retro-aldol)", 'bl-d'); }
    } else if (si === 4) {
      if (p < 0.33) { show('aldol', G.aldol, 0, 0, 0, [{ tag: 'al', nth: 0, color: yel, r: 0.65 }]); nm(t.a, 0, 3.4, "3-hydroxybutanal + base, heat", 'bl-lead'); nm(t.b, 0, -3.3, "① the base takes the α H (the most acidic)", 'bl-d'); }
      else if (p < 0.66) { var gb = show('eno2', G.eno2, 0, 0, 0, [{ tag: 'e', nth: 0, color: red, r: 0.8, op: 0.4 }]); var ia = MSim.idx(G.eno2, 'al', 0), ib = MSim.idx(G.eno2, 'c', 0), io4 = MSim.idx(G.eno2, 'o', 0), pA = MSim.wp(gb, G.eno2, ia, gs), pB = MSim.wp(gb, G.eno2, ib, gs), pO = MSim.wp(gb, G.eno2, io4, gs);
        arrow(0, pA.clone().lerp(MSim.wp(gb, G.eno2, MSim.idx(G.eno2, 'cc', 0), gs), 0.5), pA.clone().lerp(pB, 0.5), new T.Vector3(0, 0.9, 0), true); arrow(1, pB.clone().lerp(pO, 0.5), pO.clone().add(pO.clone().sub(pB).normalize().multiplyScalar(0.9)), new T.Vector3(0, 0.7, 0.3), true);
        nm(t.a, 0, 3.4, "aldol enolate", 'bl-lead'); nm(t.b, 0, -3.3, "② the carbanion pair expels HO⁻ from the β C", 'bl-d'); }
      else { var q4 = sm((p - 0.66) / 0.34); var gc = show('crot', G.crot, -1.2, 0, 0, [{ tag: 'c', nth: 0, color: blue, r: 0.65, op: 0.3 }, { tag: 'al', nth: 0, color: blue, r: 0.65, op: 0.3 }, { tag: 'cc', nth: 0, color: blue, r: 0.65, op: 0.3 }]); gc.position.x = -1.5; base.visible = false; var oh = show('oh', G.oh, 3.4 + 2.2 * q4, 1 + 0.4 * q4, 0); nm(t.a, -1.5, 3.4, "but-2-enal (conjugated enal)", 'bl-lead'); nm(t.b, 5.6 + 1.2 * q4, 2.3, 'HO⁻', 'bl-warn'); nm(t.c, 0, -3.3, "conjugated C=C–C=O · irreversible condensation (−H₂O)", 'bl-d'); }
    } else if (si === 5) {
      var dd = 6.2 - 4 * sm(p / 0.55), xx = dd / 2;
      if (p < 0.6) {
        var gm = show('enoa', G.enoa, 0, 0, 0, [{ tag: 'al', nth: 0, color: red, r: 0.9, op: 0.4 }]), gz = show('benz', G.benz, 0, 0, 0);
        MSim.dock(gm, G.enoa, MSim.idx(G.enoa, 'al', 0), new T.Vector3(-xx, 0, 0), new T.Vector3(-1, 0.2, 0), gs); MSim.dock(gz, G.benz, MSim.idx(G.benz, 'c', 0), new T.Vector3(xx, 0, 0), new T.Vector3(1, 0.2, 0), gs);
        var q1 = MSim.wp(gm, G.enoa, MSim.idx(G.enoa, 'al', 0), gs), q2 = MSim.wp(gz, G.benz, MSim.idx(G.benz, 'c', 0), gs), q3b = MSim.wp(gz, G.benz, MSim.idx(G.benz, 'o', 0), gs);
        arrow(0, q1.clone().add(new T.Vector3(0.1, 0.1, 0)), q2, new T.Vector3(0, 1.0, 0), true); arrow(1, q2.clone().lerp(q3b, 0.5), q3b, new T.Vector3(0, 0.8, 0.2), true);
        nm(t.a, -xx - 1.8, 2.9, "propanone enolate", 'bl-warn'); nm(t.b, xx + 1.8, 2.9, "benzaldehyde (no α H)", 'bl-lead'); nm(t.c, 0, -3.5, "only the ketone forms an enolate; only the aldehyde is an electrophile", 'bl-d');
      } else { show('bza', G.bza, 0, 0, 0, [{ tag: 'c', nth: 0, color: blue, r: 0.6, op: 0.28 }, { tag: 'al', nth: 0, color: blue, r: 0.6, op: 0.28 }]); nm(t.a, 0, 3.8, "4-phenylbut-3-en-2-one (benzalacetone)", 'bl-lead'); nm(t.b, 0, -3.6, "after −H₂O: C=C conjugated with the ring and the C=O", 'bl-d'); }
    } else {
      var pr = PID[S.pr], b = BID[S.b], k = K(pr, b), frac = k / (1 + k);
      var gg = show('eno', G.eno, -4.2, 0, 0, [{ tag: 'al', nth: 0, color: red, r: 1.0 * Math.sqrt(Math.max(0.15, Math.min(1, frac)) + 0.1), op: 0.15 + 0.35 * frac }]), ga2 = show('ald', G.ald, 4.2, 0, 0);
      nm(t.a, -4.2, 3.3, "enolate · fraction " + (frac > 0.999 ? '≈ 100 %' : frac < 0.001 ? '< 0,1 %' : f1(frac * 100) + ' %'), 'bl-warn'); nm(t.b, 4.2, 3.3, "non-enolized carbonyl", 'bl-lead'); nm(t.c, 0, -3.5, pr.t + ' (pKa ' + f1(pr.pka) + ') + ' + b.n + " (pKa of HB " + f1(b.ph) + ')  →  K = ' + MSim.sci(k, 1), 'bl-d');
    }
    arr.forEach(function (a) { a.tick(now); });
  }
  var def = {
    key: 'enolatos-aldolica', title: "Enolates and Aldol Condensation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#a78bfa', light: '#6d28d9' },
    stages: stages, nStages: 7, dur: 11, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [2, 3, 14], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 15], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 16, 3], target: [0, 0, 0] }],
    layers: [{ id: 'arrows', label: "Electron arrows", icon: '↷' }, { id: 'halo', label: 'Halos', icon: '◉' }],
    build: function (ctx) {
      SG = MSim.stage(ctx); for (var i = 0; i < 3; i++) arr.push(MSim.arrow(ctx, 0xff7a3d));
      base = new T.Mesh(new T.SphereGeometry(0.55, 18, 14), new T.MeshStandardMaterial({ color: 0x4f8bff })); base.visible = false; ctx.scene.add(base);
      hp = new T.Mesh(new T.SphereGeometry(0.3, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff })); hp.visible = false; ctx.scene.add(hp);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var si, p; if (!ctx.P.manual) { si = f.i; p = f.local; } else { si = S.si; if (S.run) { S.prog += dt / 7; if (S.prog >= 1) { S.prog = 1; S.run = false; } } p = S.prog; }
      S.cur = si; Object.keys(lab).forEach(function (k) { lab[k].vis(false); }); scene(ctx, si, p, ctx.now); SG.halos(ctx.layer('halo'));
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.st && u.st.set(String(S.cur)); } },
    hud: function () {
      var pr = PID[S.pr], b = BID[S.b], k = K(pr, b);
      return { eq: { chip: 'Aldol', name: "enolate + carbonyl → β-hydroxycarbonyl", body: '<div class="eqline"><small>Precursor</small>' + pr.n + ' (pKa ' + f1(pr.pka) + ')</div><div class="eqline"><small>Base</small>' + b.n + ' (pKa HB ' + f1(b.ph) + ")</div><div class=\"eqline\"><small>Enolization K</small>" + MSim.sci(k, 1) + '</div>' }, legend: [{ label: "Arrow", color: '#ff7a3d', arrow: true, text: "movement of the e⁻ pair" }, { label: "Red", color: '#ff5c5c', text: "negative charge" }, { label: "Blue", color: '#4dabf7', text: "conjugated system" }] };
    },
    measures: function () { var pr = PID[S.pr], b = BID[S.b], k = K(pr, b); return [['Precursor', pr.n], ["α H pKa", f1(pr.pka)], ['Base', b.n], ["pKa of HB", f1(b.ph)], ['K', MSim.sci(k, 1)], ["Enolate fraction", k > 1e3 ? '≈ 100 %' : (k < 1e-3 ? '< 0,1 %' : f1(k / (1 + k) * 100) + ' %')]]; },
    ideas: ["The <b>α H</b> is acidic because the enolate delocalizes the charge onto O (pKa 17–25 versus 50).", "Enolate = <b>nucleophile at C</b>: it attacks carbonyls and forms C–C bonds.", "<b>Aldol</b> (cold, reversible) → conjugated <b>enal</b> by E1cB (heat, irreversible).", "In a crossed aldol, an aldehyde <b>without α H</b> (benzaldehyde) avoids mixtures of products.", "Strong base (LDA) = complete enolization; NaOH/EtO⁻ = equilibrium."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction"); el.appendChild(c);
      ui.st = kit.ui.options({ label: "Mechanism stage", cols: 3, value: String(S.si), options: [["α H acidity", 0], ["Enolate", 1], ["Addition", 2], ['Aldol', 3], ['E1cB', 4], ["Crossed", 5], ["Conditions", 6]].map(function (x) { return { v: String(x[1]), label: x[0] }; }), onChange: function (v) { ctx.goManual(); S.si = +v; S.prog = 0; S.run = true; } }); c.appendChild(ui.st);
      ui.pg = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.01, value: S.prog, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.prog = v; } }); c.appendChild(kit.ui.sliders([ui.pg]));
      c.appendChild(ctx.btnRow([{ t: "▶ Play stage", primary: true, fn: function () { ctx.goManual(); S.prog = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var b = kit.ui.card("Precursor and base"); el.appendChild(b);
      ui.pr = kit.ui.options({ label: "Compound with α H", cols: 2, value: S.pr, options: PR.map(function (x) { return { v: x.id, label: x.t.charAt(0).toUpperCase() + x.t.slice(1), sub: 'pKa ' + f1(x.pka) }; }), onChange: function (v) { S.pr = v; } }); b.appendChild(ui.pr);
      ui.b = kit.ui.options({ label: 'Base', cols: 4, value: S.b, options: BA.map(function (x) { return { v: x.id, label: x.n, sub: 'pKa HB ' + f1(x.ph) }; }), onChange: function (v) { S.b = v; } }); b.appendChild(ui.b);
    },
    graphs: [
      { title: "pKa of the α H by group", h: 230, note: "Double carbonyls are the most acidic. Dotted line: pKa of the conjugate acid of the chosen base.", draw: function (cx, w, h, col) {
        var arr2 = PR.slice().sort(function (a, b) { return a.pka - b.pka; }), L = 130, R = 30, T0 = 8, rh = (h - T0 - 22) / arr2.length, pw = w - L - R, mx = 40, b = BID[S.b];
        cx.font = '10px system-ui'; arr2.forEach(function (c, i) { var y = T0 + i * rh, sel = c.id === S.pr; cx.fillStyle = sel ? '#a78bfa' : '#6b7c8e'; cx.fillRect(L, y + 2, pw * c.pka / mx, rh - 4); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.t.length > 22 ? c.t.slice(0, 21) + '…' : c.t, L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f1(c.pka), L + pw * c.pka / mx + 4, y + rh / 2 + 3); });
        var xb = L + pw * b.ph / mx; cx.strokeStyle = '#ff7a3d'; cx.setLineDash([4, 3]); cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(xb, T0); cx.lineTo(xb, h - 20); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; cx.fillStyle = '#ff7a3d'; cx.textAlign = 'center'; cx.fillText(b.n + ' · pKa(HB) ' + f1(b.ph), Math.min(w - 70, Math.max(L + 50, xb)), h - 6);
      } },
      { title: "Energy profile of the aldol condensation (sketch)", h: 200, note: "Qualitative sketch: the slow step is usually enolate formation or the C–C attack; dehydration makes the process irreversible.", draw: function (cx, w, h, col) {
        var pts = [[0, 0.45, "Ethanal ×2"], [0.17, 0.75, "Enolate"], [0.4, 0.95, 'C–C (TS)'], [0.55, 0.35, "Alkoxide"], [0.7, 0.25, 'Aldol'], [0.85, 0.6, 'E1cB (TS)'], [1, 0.1, 'Enal + H₂O']], L = 10, R = 10, Tp = 14, B = 26, pw = w - L - R, ph = h - Tp - B, sx = function (u) { return L + pw * u; }, sy = function (v) { return Tp + ph - ph * v; };
        cx.strokeStyle = '#a78bfa'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (q, i) { var x = sx(q[0]), y = sy(q[1]); if (i === 0) cx.moveTo(x, y); else { var p0 = pts[i - 1], xm = (sx(p0[0]) + x) / 2; cx.bezierCurveTo(xm, sy(p0[1]), xm, y, x, y); } }); cx.stroke(); cx.lineWidth = 1;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; pts.forEach(function (q, i) { cx.fillText(q[2], Math.min(w - 32, Math.max(32, sx(q[0]))), i % 2 ? sy(q[1]) - 7 : sy(q[1]) + 14); }); cx.fillText("reaction coordinate →", w / 2, h - 4);
      } }
    ],
    calc: function () {
      var pr = PID[S.pr], b = BID[S.b], k = K(pr, b), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, d = b.ph - pr.pka;
      return '<div class="card-kicker">' + pr.n + ' + ' + b.n + "</div><div class=\"calc-step\">1 · Enolate formation</div><table class=\"calc-table\">" + row('ΔpKa', f1(b.ph) + ' − ' + f1(pr.pka) + ' = <b>' + f1(d) + '</b>') + row('K', '10<sup>' + f1(d) + '</sup> = <b>' + MSim.sci(k, 1) + '</b>') + row("Enolate at equilibrium", k > 1e3 ? "<span class=\"calc-ok\">practically complete</span>" : (k < 1e-3 ? "<span class=\"calc-hi\">traces (&lt; 0.1 %)</span>" : f1(k / (1 + k) * 100) + " % (with B and HB equimolar)")) + '</table>' +
        "<div class=\"calc-step\">2 · What reaction to expect</div><table class=\"calc-table\">" + row("Enolate + carbonyl", k > 1e-3 && k < 1e3 ? "both coexist: <b>aldol</b> (self-condensation)" : (k >= 1e3 ? "complete enolate: the electrophile can be added afterward (directed aldol, alkylation)" : "there is almost no enolate: the reaction is very slow")) + '</table>' + (pr.pka > 15.7 && S.b === 'OH' ? "<p class=\"muted small\">With NaOH (pKa of H₂O = 15.7) simple carbonyls enolize only to a small extent; it is enough for the aldol to occur with aldehydes, but not with esters.</p>" : '');
    },
    quiz: [
      { q: "Why are the H atoms α to a carbonyl (pKa 17–25) much more acidic than those of an alkane (pKa 50)?", options: ["The enolate delocalizes the negative charge onto the oxygen", "The α carbon is more electronegative", "The C=O donates electrons to the C–H", "The α C–H bond is longer and weaker"], answer: 0, why: "The conjugate base (enolate) is a C⁻/O⁻ hybrid: the charge is shared with the electronegative O." },
      { q: "The enolate reacts as a nucleophile through…", options: ["the α carbon", "the carbonyl carbon", "the hydrogen", "no particular atom"], answer: 0, why: "Although the charge is shared between C and O, the reaction with carbonyls forms the C–C bond through the α carbon." },
      { q: "What product is obtained from the aldol addition of two ethanal molecules (0–5 °C)?", options: ['3-hidroxibutanal', 'But-2-enal', "Ethanol", "Ethanoic acid"], answer: 0, why: "The addition product is the β-hydroxyaldehyde; dehydration to but-2-enal requires heat." },
      { q: "Which mechanism explains the loss of water from the aldol with base and heat?", options: ["E1cB (via enolate)", 'SN2', "Concerted E2 without an intermediate", 'SN1'], answer: 0, why: "The α H is deprotonated first (carbanion/enolate) and then OH⁻ leaves from the β carbon." },
      { q: "Why is benzaldehyde useful in a crossed aldol with propanone?", options: ["It has no α H: it can only act as an electrophile", "It is more electrophilic than any ketone because of its ring", "It forms the enolate faster than propanone", "It does not react with bases"], answer: 0, why: "Since it cannot form an enolate, it does not compete as a nucleophile and the mixture of products is avoided." },
      { q: "To convert an ester (pKa ≈ 25) completely into its enolate it is advisable to use…", options: ["LDA (pKa of HB ≈ 36)", "NaOH (pKa of HB 15.7)", "NaHCO₃ (pKa of HB 6.35)", "Water"], answer: 0, why: "The base must have a conjugate acid much less acidic than the ester; only LDA or NaH qualify." },
      { q: "Which of these C–H bonds is the most acidic?", options: ["The CH₂ between two C=O groups (acetylacetone, pKa 8.9)", "The CH₃ of propanone (pKa 19.3)", "The CH₃ of an ester (pKa 25)", "The CH₃ of ethane (pKa 50)"], answer: 0, why: "The carbanion charge is delocalized over two carbonyls." },
      { q: "In 3-hydroxybutanal, at which position is the OH relative to the carbonyl?", options: ['β', 'α', 'γ', "On the same carbon"], answer: 0, why: "It is a β-hydroxyaldehyde: the OH is on the β carbon (C 3)." }
    ],
    help: { intro: "Follow the lesson or choose the stage in “Lab”. The orange arrows show the movement of electron pairs; the yellow dot travels along the arrow.", items: [["Arrows", "each curved arrow is the movement of an e⁻ pair."], ['Halos', "red = negative charge, blue = conjugated system, yellow = α H."], ['Lab', "stage, progress, precursor and base (computes the enolization K)."], ["Graphs", "pKa of the α H and energy profile."]] }
  };
  MSim.create(def);
})();
