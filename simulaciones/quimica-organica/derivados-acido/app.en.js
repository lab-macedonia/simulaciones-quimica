/* Ácidos carboxílicos y derivados — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var D = {
    cl: { n: "Ethanoyl chloride", fam: "acyl chloride", sub: 'Cl{l}', lg: 'Cl⁻', lgS: null, pka: -7, ir: '≈ 1800', rank: 4, don: "Cl (3p) overlaps poorly with C (2p): it hardly donates", col: 0x3ddc5a, rs: 0.95 },
    an: { n: "Ethanoic anhydride", fam: "anhydride", sub: 'O{l}C(=O)C', lg: 'CH₃COO⁻', lgS: 'CC(=O)O{l}', pka: 4.76, ir: '1820 y 1760', rank: 3, don: "the O shares its pair with two C=O groups: it donates little to each", col: 0xff8787, rs: 0.8 },
    es: { n: "Ethyl ethanoate", fam: "ester", sub: 'O{l}CC', lg: 'EtO⁻', lgS: 'CCO{l}', pka: 15.9, ir: '≈ 1740', rank: 2, don: "the O donates its pair (moderate resonance)", col: 0xff6b6b, rs: 0.7 },
    am: { n: "Ethanamide", fam: 'amida', sub: 'N{l}', lg: 'NH₂⁻', lgS: 'N{l}', pka: 38, ir: '≈ 1650', rank: 1, don: "the N donates its pair strongly: partial double C–N bond", col: 0x4f7cff, rs: 0.7 }
  }, KEY = ['cl', 'an', 'es', 'am'];
  var G = {};
  KEY.forEach(function (k) {
    var d = D[k]; G[k] = MSim.build('CC{c}(=O{o})' + d.sub); G[k + 'T'] = MSim.strip(MSim.build('CC{c}(O{o})(O{n})' + d.sub), 'o'); G[k + 'L'] = d.lgS ? MSim.strip(MSim.build(d.lgS), 'l') : null;
  });
  G.acid = MSim.build('CC{c}(=O{o})O{n}'); G.carb = MSim.strip(MSim.build('CC{c}(=O{o})O{n}'), 'n'); G.water = MSim.build('O{w}'); G.etoh = MSim.build('CCO{l}'); G.oh = MSim.strip(MSim.build('O{w}'), 'w');
  var S = { d: 'cl', nu: 'H2O', si: 0, prog: 0, run: false, cyc: 0 }, SG, arr = [], lab = {}, nuS, lgS_;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var NUC = { H2O: { n: 'H₂O', t: "water", outs: { cl: "carboxylic acid + HCl", an: "2 carboxylic acid", es: "acid + alcohol (slow hydrolysis)", am: "acid + NH₄⁺ (heat, strong H⁺ or HO⁻)" }, ok: [1, 1, 1, 1] }, ROH: { n: 'R′OH', t: 'alcohol', outs: { cl: "ester + HCl", an: "ester + carboxylic acid", es: "transesterification (equilibrium; H⁺ or RO⁻)", am: "no useful reaction" }, ok: [1, 1, 1, 0] }, NH3: { n: 'NH₃', t: "ammonia", outs: { cl: "amide + NH₄Cl", an: "amide + ammonium carboxylate", es: "amide + alcohol (slow)", am: "no reaction (same species)" }, ok: [1, 1, 1, 0] } };
  function stages() {
    return [
      ["The R–CO–L family", "Family", "An acyl bonded to an L group: chloride, anhydride, ester, amide",
        "<p><b>Acid derivatives</b> share the <b>acyl group R–C(=O)–</b> bonded to an L group (<b>Cl</b>, <b>OCOR</b>, <b>OR′</b>, <b>NR′₂</b>). They can be converted into the carboxylic acid by hydrolysis. What differentiates their reactivity is L: how much it <b>donates</b> its electron pair to the C=O (resonance) and how good a <b>leaving group</b> it is.</p>"],
      ["Resonance and reactivity", "Resonance", "The better L donates, the less electrophilic the carbonyl is",
        "<p>The lone pair of L is delocalized toward the C=O (resonance form L⁺=C–O⁻): <b>N &gt; O &gt; Cl</b> in donating ability. The more L donates, the <b>lower the δ+ on C</b> and the less reactive the derivative, and also the <b>lower the C=O IR frequency</b> (the C=O gains single-bond character): chloride ≈ 1800, anhydride 1820/1760, ester ≈ 1740, amide ≈ 1650 cm⁻¹. The blue spheres are the pairs of L; the orange ones, the δ+ of the carbonyl.</p>"],
      ["Addition–elimination", "Mechanism", "The nucleophile adds, a tetrahedral intermediate forms and L⁻ leaves",
        "<p>Acyl substitution is a two-step <b>addition–elimination</b>: (1) the nucleophile attacks the C=O and forms the <b>tetrahedral intermediate</b> (O⁻); (2) the O⁻ pair regenerates the C=O and <b>expels L⁻</b>. Unlike attack on aldehydes and ketones, here the intermediate has a good leaving group. The barrier of the first step is lower the more electrophilic the carbonyl is.</p>"],
      ["Leaving group", "Leaving group", "Cl⁻ ≫ RCOO⁻ ≫ RO⁻ ≫ NH₂⁻: the weakest base leaves",
        "<p>The best leaving group is the <b>weakest base</b> (lowest pKa of the conjugate acid HL): <b>Cl⁻ (HCl, −7) &gt; CH₃COO⁻ (4.76) &gt; RO⁻ (≈ 16) &gt; NH₂⁻ (38)</b>. That is why reactivity decreases: <b>chloride &gt; anhydride &gt; ester ≳ acid &gt; amide</b>. A more reactive derivative is converted into a less reactive one, never the other way around (without activation).</p>"],
      ["Ester hydrolysis", "Hydrolysis", "In basic medium (saponification) it is irreversible",
        "<p>With <b>HO⁻</b> the ester becomes <b>carboxylate + alcohol</b>. The last step, deprotonation of the acid by the alkoxide or HO⁻ (pKa 4.76 versus 15.9), is so favorable that it drives the whole equilibrium: <b>irreversible saponification</b>. In acidic medium, by contrast, hydrolysis is an <b>equilibrium</b> (the reverse of Fischer esterification).</p>"],
      ["The amide: the most stable", "Amide", "The C–N bond is partly double: planar and with a rotation barrier",
        "<p>In the <b>amide</b> the N donates its pair to the C=O: the O=C–N group is <b>planar</b> and rotation about the C–N bond has a <b>barrier of ≈ 70–90 kJ/mol</b> (partial double-bond character). That is why amides are poorly electrophilic, hydrolyze only with strong acid or base and heat, and form the backbone of <b>peptides</b> (peptide bond).</p>"]
    ];
  }
  function attack(g, geo, grp, d) {
    var c = MSim.wp(grp, geo, MSim.idx(geo, 'c', 0), 1), o = MSim.wp(grp, geo, MSim.idx(geo, 'o', 0), 1), l = MSim.wp(grp, geo, MSim.idx(geo, 'l', 0), 1), n = new T.Vector3().crossVectors(o.clone().sub(c), l.clone().sub(c)).normalize(); if (n.y < 0) n.negate(); return { c: c, o: o, l: l, n: n };
  }
  function scene(ctx, si, p, now) {
    SG.begin(); arr.forEach(function (a) { a.group.visible = false; }); nuS.visible = false; lgS_.visible = false;
    var il = ctx.layer('arrows'), dk = D[S.d], t = lab, red = 0xff5c5c, blue = 0x4dabf7, ora = 0xffa94d;
    var nm = function (L, x, y, txt, cls) { L.pos(x, y, 0).set(txt, cls || 'bl-d').vis(true); };
    var show = function (key, geo, x, y, z, halos) { return SG.put(key + '@' + si, geo, x, y, z, { halos: halos }); };
    var ar = function (k, a, b, bend, on) { arr[k].set(a, b, bend, on && il); };
    if (si === 0) {
      KEY.forEach(function (k, i) { var g = show(k, G[k], (i - 2) * 5.6 + 2.8, 0.4, 0); g.rotation.y = now * 0.25; nm(t[['a', 'b', 'c', 'd'][i]], (i - 2) * 5.6 + 2.8, 3.6, D[k].fam, 'bl-lead'); });
      show('ca', G.carb, 11.2, 0.4, 0).rotation.y = now * 0.25; nm(t.e, 11.2, 3.6, "carboxylate", 'bl-d'); nm(t.f, 0, -3.8, "R–C(=O)–L · L = Cl, OCOR, OR′, NR′₂ (and O⁻ in the carboxylate)", 'bl-d');
    } else if (si === 1) {
      var n = 4, ix = Math.min(n - 1, Math.floor(p * n)); var k = S.cyc != null && ctx.P.manual ? KEY.indexOf(S.d) : ix, kk = KEY[k], d = D[kk];
      var g = show(kk, G[kk], 0, 0, 0, [{ tag: 'l', nth: 0, color: blue, r: 0.5 + 0.16 * (4 - d.rank) * 0 + 0.5 * (d.rank === 1 ? 1 : d.rank === 2 ? 0.7 : d.rank === 3 ? 0.45 : 0.25), op: 0.4 }, { tag: 'c', nth: 0, color: ora, r: 0.35 + 0.2 * d.rank, op: 0.4 }]); g.rotation.y = now * 0.2;
      nm(t.a, 0, 3.7, d.n + " · reactivity " + ['', "minimum", "low", "medium", "maximum"][d.rank], 'bl-lead'); nm(t.b, 0, -3.4, d.don, 'bl-d'); nm(t.c, 3.8, 1.5, 'ν(C=O) ' + d.ir + ' cm⁻¹', 'bl-warn');
    } else if (si === 2) {
      var dd = D[S.d], kk2 = S.d, base = show(kk2, G[kk2], 0, 0, 0), a = attack(0, G[kk2], base);
      if (p < 0.35) {
        var q = sm(p / 0.35), dist = 4.4 - 2.4 * q, pos = a.c.clone().addScaledVector(a.n, dist); var w = show('w', G.water, 0, 0, 0); MSim.dock(w, G.water, MSim.idx(G.water, 'w', 0), pos, a.n, 1);
        ar(0, pos.clone(), a.c.clone(), new T.Vector3(0.2, 0.7, 0.5), true); ar(1, a.c.clone().lerp(a.o, 0.5), a.o.clone(), new T.Vector3(0, 0.7, 0.4), q > 0.5);
        nm(t.a, pos.x, pos.y + 1.4, "H₂O (nucleophile)", 'bl-warn'); nm(t.b, 0, -3.7, "attack perpendicular to the plane of the acyl · " + f1(dist) + ' Å', 'bl-d'); nm(t.c, 0, 3.8, dd.n, 'bl-lead');
      } else if (p < 0.65) { base.visible = false; var ti = show(kk2 + 'T', G[kk2 + 'T'], 0, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); nm(t.a, 0, 3.8, "tetrahedral intermediate (sp³ C, O⁻)", 'bl-lead'); nm(t.b, 0, -3.7, "the O⁻ pair will regenerate the C=O and expel L⁻", 'bl-d'); var tp = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'o', 0), 1), tc = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'c', 0), 1), tl = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'l', 0), 1); ar(0, tp.clone().lerp(tc, 0.35), tc.clone().lerp(tp, 0.35), new T.Vector3(0.3, 0.5, 0.4), true); ar(1, tc.clone().lerp(tl, 0.35), tl.clone().add(tl.clone().sub(tc).normalize().multiplyScalar(0.8)), new T.Vector3(0, 0.6, 0.5), true); }
      else {
        var e = sm((p - 0.65) / 0.35); base.visible = false; show('acid', G.acid, -1.5, 0, 0, [{ tag: 'c', nth: 0, color: 0x38a169, r: 0.55, op: 0.28 }]);
        if (G[kk2 + 'L']) { var lgm = show(kk2 + 'L', G[kk2 + 'L'], 4.2 + 2.2 * e, 1.2 + 0.4 * e, 0, [{ tag: 'l', nth: 0, color: red, r: 0.7, op: 0.4 }]); nm(t.b, 6.4 + 2.2 * e, 3.1, dd.lg + " (leaves)", 'bl-warn'); } else { lgS_.visible = true; lgS_.position.set(4.2 + 2.6 * e, 1.2, 0); lgS_.scale.setScalar(dd.rs); lgS_.material.color.setHex(dd.col); nm(t.b, 4.2 + 2.6 * e, 2.5, dd.lg + " (leaves)", 'bl-warn'); }
        nm(t.a, -1.5, 3.4, "ethanoic acid", 'bl-lead'); nm(t.c, 0, -3.7, "the C=O is regenerated and " + dd.lg + " (pKa of HL = " + dd.pka + ')', 'bl-d');
      }
    } else if (si === 3) {
      var ix2 = Math.min(3, Math.floor(p * 4)), gk = KEY[ix2], gd = D[gk]; var gg = show(gk, G[gk], -3.2, 0, 0, [{ tag: 'l', nth: 0, color: red, r: 0.7, op: 0.3 }]); gg.rotation.y = now * 0.2;
      nm(t.a, -3.2, 3.7, gd.n, 'bl-lead'); lgS_.visible = true; lgS_.position.set(4.2, 0, 0); lgS_.scale.setScalar(gd.rs + 0.3); lgS_.material.color.setHex(gd.col); nm(t.b, 4.2, 1.6, gd.lg + ' · pKa(HL) = ' + gd.pka, 'bl-warn'); nm(t.c, 0, -3.7, "the lower the pKa of HL, the better the leaving group", 'bl-d'); nm(t.d, 4.2, -1.6, ix2 === 0 ? "excellent" : ix2 === 1 ? "good" : ix2 === 2 ? "fair" : "very poor", ix2 < 2 ? 'bl-neg' : 'bl-warn');
    } else if (si === 4) {
      var es = G.es; if (p < 0.4) { var b = show('es', es, -1, 0, 0), aa = attack(0, es, b), q4 = sm(p / 0.4), hp = aa.c.clone().addScaledVector(aa.n, 4.2 - 2.2 * q4); nuS.visible = true; nuS.position.copy(hp); nuS.scale.setScalar(0.62); nuS.material.color.setHex(0xff4d4d); ar(0, hp.clone(), aa.c.clone(), new T.Vector3(0.2, 0.7, 0.5), true); nm(t.a, hp.x, hp.y + 1.2, 'HO⁻', 'bl-warn'); nm(t.b, 0, 3.8, "ethyl ethanoate + HO⁻", 'bl-lead'); nm(t.c, 0, -3.7, "nucleophilic attack → tetrahedral intermediate", 'bl-d'); }
      else if (p < 0.7) { show('esT', G.esT, -1, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); nm(t.a, 0, 3.8, "tetrahedral intermediate", 'bl-lead'); nm(t.b, 0, -3.7, "EtO⁻ is expelled", 'bl-d'); }
      else { var e2 = sm((p - 0.7) / 0.3); show('carb', G.carb, -3.4, 0, 0, [{ tag: 'n', nth: 0, color: red, r: 0.8, op: 0.35 }]); show('etoh', G.etoh, 3.2 + 1.2 * e2, 0, 0); nm(t.a, -3.4, 3.5, "ethanoate (carboxylate)", 'bl-lead'); nm(t.b, 4.4, 3.1, "ethanol", 'bl-d'); nm(t.c, 0, -3.7, "EtO⁻ takes the H⁺ from the acid: K ≈ 10¹¹ → irreversible (saponification)", 'bl-warn'); }
    } else {
      var gm = show('am', G.am, 0, 0, 0, [{ tag: 'l', nth: 0, color: blue, r: 0.65, op: 0.4 }]); var ic = MSim.idx(G.am, 'c', 0), il2 = MSim.idx(G.am, 'l', 0), pc = MSim.wp(gm, G.am, ic, 1), pn = MSim.wp(gm, G.am, il2, 1); gm.rotation.y = 0;
      ar(0, pn.clone().add(new T.Vector3(0, 0.7, 0)), pc.clone().add(new T.Vector3(0, 0.5, 0)), new T.Vector3(0, 0.9, 0.3), p > 0.15); nm(t.a, 0, 3.8, "ethanamide · planar O=C–N", 'bl-lead'); nm(t.b, 3.5, 1.4, "C–N ≈ 1.33 Å (partly double)", 'bl-warn'); nm(t.c, 0, -3.7, "C–N rotation barrier ≈ 70–90 kJ/mol → planar peptide bond", 'bl-d');
    }
    arr.forEach(function (a) { a.tick(now); });
  }
  var def = {
    key: 'derivados-acido-carboxilico', title: "Carboxylic Acids and Derivatives", subtitle: "3D simulator · organic chemistry", accent: { dark: '#34d399', light: '#047857' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [2, 3, 15], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 16], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 3], target: [0, 0, 0] }],
    layers: [{ id: 'arrows', label: "Electron arrows", icon: '↷' }, { id: 'halo', label: "Halos", icon: '◉' }],
    build: function (ctx) {
      SG = MSim.stage(ctx); for (var i = 0; i < 3; i++) arr.push(MSim.arrow(ctx, 0xff7a3d));
      nuS = new T.Mesh(new T.SphereGeometry(1, 18, 14), new T.MeshStandardMaterial({ color: 0xff4d4d })); nuS.visible = false; ctx.scene.add(nuS);
      lgS_ = new T.Mesh(new T.SphereGeometry(1, 18, 14), new T.MeshStandardMaterial({ color: 0x3ddc5a })); lgS_.visible = false; ctx.scene.add(lgS_);
      ['a', 'b', 'c', 'd', 'e', 'f'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var si, p; if (!ctx.P.manual) { si = f.i; p = f.local; } else { si = S.si; if (S.run) { S.prog += dt / 8; if (S.prog >= 1) { S.prog = 1; S.run = false; } } p = S.prog; }
      S.cur = si; Object.keys(lab).forEach(function (k) { lab[k].vis(false); }); scene(ctx, si, p, ctx.now); SG.halos(ctx.layer('halo'));
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual && u.st) u.st.set(String(S.cur)); },
    hud: function () { var d = D[S.d], nu = NUC[S.nu]; return { eq: { chip: "Acyl", name: d.fam + ' + ' + nu.n, body: "<div class=\"eqline\"><small>Derivative</small>" + d.n + "</div><div class=\"eqline\"><small>Leaving group</small>" + d.lg + ' (pKa HL ' + d.pka + ")</div><div class=\"eqline\"><small>Product</small>" + nu.outs[S.d] + '</div>' }, legend: [{ label: "Arrow", color: '#ff7a3d', arrow: true, text: "e⁻ pair" }, { label: "Blue", color: '#4dabf7', text: "donor pair of L" }, { label: "Orange", color: '#ffa94d', text: "δ+ of the C=O" }] }; },
    measures: function () { var d = D[S.d], nu = NUC[S.nu]; return [["Derivative", d.n], ["Leaving group", d.lg], ["pKa of HL", String(d.pka)], ['ν(C=O)', d.ir + ' cm⁻¹'], ["Reactivity", ['', "minimum", "low", "medium", "maximum"][d.rank]], ["Nucleophile", nu.t], ["Product", nu.outs[S.d]]]; },
    ideas: ["Reactivity: <b>chloride &gt; anhydride &gt; ester ≳ acid &gt; amide</b> (in order of leaving group and L donation).", "<b>Addition–elimination</b>: tetrahedral intermediate and expulsion of L⁻.", "A reactive derivative gives a less reactive one; the reverse direction needs activation (e.g. SOCl₂).", "<b>Saponification</b> is irreversible because of carboxylate formation; acid hydrolysis is an equilibrium.", "The amide is planar by resonance: basis of the peptide bond."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Mechanism"); el.appendChild(c);
      ui.st = kit.ui.options({ label: "Stage", cols: 3, value: String(S.si), options: [["Family", 0], ["Resonance", 1], ["Mechanism", 2], ["Leaving group", 3], ["Ester hydrolysis", 4], ["Amide", 5]].map(function (x) { return { v: String(x[1]), label: x[0] }; }), onChange: function (v) { ctx.goManual(); S.si = +v; S.prog = 0; S.run = true; } }); c.appendChild(ui.st);
      ui.pg = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.01, value: S.prog, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.prog = v; } }); c.appendChild(kit.ui.sliders([ui.pg]));
      c.appendChild(ctx.btnRow([{ t: "▶ Play", primary: true, fn: function () { ctx.goManual(); S.prog = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var b = kit.ui.card("Derivative and nucleophile"); el.appendChild(b);
      ui.d = kit.ui.options({ label: "Derivative", cols: 2, value: S.d, options: KEY.map(function (k) { return { v: k, label: D[k].fam.charAt(0).toUpperCase() + D[k].fam.slice(1), sub: 'pKa HL ' + D[k].pka }; }), onChange: function (v) { ctx.goManual(); S.d = v; } }); b.appendChild(ui.d);
      ui.nu = kit.ui.options({ label: "Nucleophile", cols: 3, value: S.nu, options: [{ v: 'H2O', label: 'H₂O' }, { v: 'ROH', label: 'R′OH' }, { v: 'NH3', label: 'NH₃' }], onChange: function (v) { S.nu = v; } }); b.appendChild(ui.nu);
    },
    graphs: [
      { title: "Reactivity and IR frequency of the C=O", h: 190, note: "The greater the donation from L, the lower the ν(C=O) and the lower the reactivity.", draw: function (cx, w, h, col) {
        var arr2 = [["Chloride", 1800, 'cl'], ["Anhydride", 1790, 'an'], ["Ester", 1740, 'es'], ["Acid", 1710, 'ac'], ["Amide", 1650, 'am']], L = 70, R = 14, Tp = 10, B = 26, pw = w - L - R, rh = (h - Tp - B) / arr2.length, lo = 1600, hi = 1850;
        cx.font = '10.5px system-ui'; arr2.forEach(function (q, i) { var y = Tp + i * rh, sel = q[2] === S.d; cx.fillStyle = sel ? '#34d399' : '#6b7c8e'; cx.fillRect(L, y + 3, pw * (q[1] - lo) / (hi - lo), rh - 6); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(q[0], L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(q[1], L + pw * (q[1] - lo) / (hi - lo) + 4, y + rh / 2 + 3); });
        cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText("ν(C=O) / cm⁻¹ (anhydride: average of 1820 and 1760)", L + pw / 2, h - 5);
      } },
      { title: "Energy profile of the addition–elimination", h: 200, note: "Qualitative sketch: with a better leaving group and a more electrophilic carbonyl, the barriers drop.", draw: function (cx, w, h, col) {
        var d = D[S.d], f = (d.rank - 1) / 3, a1 = 0.78 - 0.4 * f, i1 = 0.55 - 0.15 * f, a2 = 0.6 - 0.25 * f, pr = 0.3, pts = [[0, 0.42], [0.25, a1], [0.45, i1], [0.7, a2], [1, pr]], L = 10, R = 10, Tp = 16, B = 26, pw = w - L - R, ph = h - Tp - B, sx = function (u) { return L + pw * u; }, sy = function (v) { return Tp + ph - ph * v; };
        cx.strokeStyle = '#34d399'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (q, i) { var x = sx(q[0]), y = sy(q[1]); if (i === 0) cx.moveTo(x, y); else { var p0 = pts[i - 1], xm = (sx(p0[0]) + x) / 2; cx.bezierCurveTo(xm, sy(p0[1]), xm, y, x, y); } }); cx.stroke(); cx.lineWidth = 1;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; ['R–CO–L + Nu', 'TS 1', "Tetrahedral intermediate", 'TS 2', 'R–CO–Nu + L'].forEach(function (s, i) { cx.fillText(s, Math.min(w - 52, Math.max(52, sx(pts[i][0]))), i === 2 ? sy(pts[i][1]) + 14 : sy(pts[i][1]) - 7); }); cx.fillText(d.n, w / 2, h - 4);
      } }
    ],
    calc: function () {
      var d = D[S.d], nu = NUC[S.nu], row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, i = KEY.indexOf(S.d), ok = nu.ok[i];
      return '<div class="card-kicker">' + d.fam + ' + ' + nu.t + "</div><div class=\"calc-step\">1 · Reactivity of the derivative</div><table class=\"calc-table\">" + row("Leaving group", d.lg + ' · pKa(HL) = <b>' + d.pka + '</b>') + row("L donation", d.don) + row('ν(C=O)', d.ir + ' cm⁻¹') + '</table>' +
        "<div class=\"calc-step\">2 · Expected outcome</div><table class=\"calc-table\">" + row("Product", '<b>' + nu.outs[S.d] + '</b>') + row("Favorable?", ok ? "<span class=\"calc-ok\">yes: the product is equally or less reactive</span>" : "<span class=\"calc-hi\">not under mild conditions</span>") + "</table><p class=\"muted small\">Rule: substitution proceeds toward the derivative with the <b>more basic leaving group</b> (more stable). Chloride → anhydride → ester → amide.</p>";
    },
    quiz: [
      { q: "What is the order of reactivity toward nucleophiles?", options: ["Acyl chloride > anhydride > ester > amide", "Amide > ester > anhydride > acyl chloride", "Ester > amide > chloride > anhydride", "All react the same"], answer: 0, why: "Reactivity follows the quality of the leaving group and the lower donation from L: Cl⁻ is the best, NH₂⁻ the worst." },
      { q: "Why does the C=O of an amide absorb at a lower IR frequency (≈ 1650 cm⁻¹) than that of an acyl chloride (≈ 1800 cm⁻¹)?", options: ["N donates its pair to the C=O and weakens the double bond", "The amide is smaller", "Chlorine donates more than N", "The amide has more hydrogens"], answer: 0, why: "N⁺=C–O⁻ resonance gives the C=O single-bond character." },
      { q: "The mechanism of nucleophilic acyl substitution is…", options: ["Addition–elimination with a tetrahedral intermediate", "Concerted SN2", "SN1 with a carbocation", 'E2'], answer: 0, why: "The nucleophile adds to the C=O and then L⁻ leaves from the tetrahedral intermediate." },
      { q: "Why is the saponification of an ester irreversible?", options: ["The acid formed is deprotonated to the carboxylate (pKa 4.76 versus 15.9 for the alcohol)", "The alcohol evaporates", "The ester is more stable than the acid", "There is no water"], answer: 0, why: "The final acid–base step drives the equilibrium completely toward the carboxylate." },
      { q: "Which of the following conversions is possible under mild conditions?", options: ["Acyl chloride + amine → amide", "Amide + alcohol → acyl chloride", "Ester + water → acyl chloride", "Amide + water → anhydride"], answer: 0, why: "One can only go from a more reactive derivative to a less reactive one." },
      { q: "Which leaving group is the best?", options: ["Cl⁻ (pKa of HCl = −7)", "CH₃COO⁻ (pKa 4.76)", "EtO⁻ (pKa 15.9)", "NH₂⁻ (pKa 38)"], answer: 0, why: "The best leaving group is the weakest base, that is, the one with the strongest conjugate acid." },
      { q: "The rotation barrier of the C–N bond of an amide (≈ 70–90 kJ/mol) is due to…", options: ["its partial double-bond character", "the size of the nitrogen atom", "hydrogen bonds with the solvent", "the sp³ hybridization of N"], answer: 0, why: "Resonance makes the O=C–N group planar and restricts rotation." },
      { q: "In the tetrahedral intermediate of the hydrolysis of an acyl chloride, what happens next?", options: ["The O⁻ regenerates the C=O and expels Cl⁻", "Cl⁻ attacks the oxygen", "The C–C bond breaks", "The chlorine is protonated"], answer: 0, why: "The O⁻ pair rebuilds the double bond and expels the best leaving group." }
    ],
    help: { intro: "Choose a derivative and a nucleophile in “Lab” or follow the lesson. In “Mechanism” you will see the water approach, the tetrahedral intermediate and the departure of L⁻.", items: [["Blue halos", "donor pair of L (resonance)."], ["Orange halos", "δ+ of the carbonyl carbon."], ["Arrows", "movement of the e⁻ pairs."], ["Calculation", "expected product and reactivity rule."]] }
  };
  MSim.create(def);
})();
