/* Espectrometría de masas y RMN de 13C — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var ENVC = { a: 0x4dabf7, b: 0x51cf66, c: 0xffd43b, d: 0xff922b, e: 0xcc5de8 };
  var A = 'all';
  var M = {
    etoh: { n: "Ethanol", f: 'C₂H₆O', s: 'C{a1}C{b1}O{o}', M: 46, cn: { a: [18, 'CH₃'], b: [58, 'CH₂–O'] }, pk: [[27, 23, 'C₂H₃⁺', ['a1', 'b1']], [29, 30, 'C₂H₅⁺ / HCO⁺', ['a1', 'b1']], [31, 100, "CH₂=OH⁺ (α-cleavage)", ['b1', 'o']], [45, 50, '[M−H]⁺', A], [46, 22, 'M⁺•', A]] },
    prop: { n: "Propanone", f: 'C₃H₆O', s: 'C{a1}C{b1}(=O{o})C{a2}', M: 58, cn: { a: [30, 'CH₃–C=O'], b: [206, 'C=O'] }, pk: [[15, 18, 'CH₃⁺', ['a1']], [43, 100, "CH₃C≡O⁺ (α-cleavage)", ['a1', 'b1', 'o']], [58, 45, 'M⁺•', A]] },
    buta: { n: "Butanone", f: 'C₄H₈O', s: 'C{a1}C{b1}C{c1}(=O{o})C{d1}', M: 72, cn: { a: [7, 'CH₃–CH₂'], b: [37, 'CH₂–C=O'], c: [209, 'C=O'], d: [29, 'CH₃–C=O'] }, pk: [[29, 25, 'C₂H₅⁺', ['a1', 'b1']], [43, 100, "CH₃C≡O⁺ (α-cleavage)", ['d1', 'c1', 'o']], [57, 25, "C₂H₅C≡O⁺ (α-cleavage)", ['a1', 'b1', 'c1', 'o']], [72, 30, 'M⁺•', A]] },
    pen3: { n: "Pentan-3-one", f: 'C₅H₁₀O', s: 'C{a1}C{b1}C{c1}(=O{o})C{b2}C{a2}', M: 86, cn: { a: [8, 'CH₃'], b: [35, 'CH₂–C=O'], c: [211, 'C=O'] }, pk: [[29, 45, 'C₂H₅⁺', ['a1', 'b1']], [57, 100, "C₂H₅C≡O⁺ (α-cleavage)", ['a1', 'b1', 'c1', 'o']], [86, 30, 'M⁺•', A]] },
    pen2: { n: "Pentan-2-one", f: 'C₅H₁₀O', s: 'C{a1}C{b1}C{c1}C{d1}(=O{o})C{e1}', M: 86, cn: { a: [13.7, 'CH₃'], b: [17.3, 'CH₂'], c: [45.7, 'CH₂–C=O'], d: [209, 'C=O'], e: [29.9, 'CH₃–C=O'] }, pk: [[43, 100, "CH₃C≡O⁺ (α-cleavage)", ['e1', 'd1', 'o']], [58, 40, "McLafferty ion (CH₂=C(OH)CH₃)⁺•", ['c1', 'd1', 'e1', 'o']], [71, 10, 'C₃H₇C≡O⁺', ['a1', 'b1', 'c1', 'd1', 'o']], [86, 20, 'M⁺•', A]] },
    brom: { n: "Bromoethane", f: 'C₂H₅Br', s: 'C{a1}C{b1}Br{o}', M: 108, iso: 'Br', cn: { a: [20, 'CH₃'], b: [28, 'CH₂–Br'] }, pk: [[27, 65, 'C₂H₃⁺', ['a1', 'b1']], [29, 100, 'C₂H₅⁺', ['a1', 'b1']], [108, 58, 'M⁺• (⁷⁹Br)', A], [110, 57, 'M+2 (⁸¹Br)', A]] },
    clor: { n: "Chloroethane", f: 'C₂H₅Cl', s: 'C{a1}C{b1}Cl{o}', M: 64, iso: 'Cl', cn: { a: [19, 'CH₃'], b: [40, 'CH₂–Cl'] }, pk: [[27, 60, 'C₂H₃⁺', ['a1', 'b1']], [28, 100, 'C₂H₄⁺•', ['a1', 'b1']], [29, 45, 'C₂H₅⁺', ['a1', 'b1']], [64, 55, 'M⁺• (³⁵Cl)', A], [66, 18, 'M+2 (³⁷Cl)', A]] },
    dea: { n: "Diethylamine", f: 'C₄H₁₁N', s: 'C{a1}C{b1}N{o}C{b2}C{a2}', M: 73, cn: { a: [15, 'CH₃'], b: [44, 'CH₂–N'] }, pk: [[30, 40, 'CH₂=NH₂⁺', ['b1', 'o']], [44, 15, 'C₂H₆N⁺', ['b1', 'o', 'a1']], [58, 100, "CH₃CH₂NH=CH₂⁺ (α-cleavage)", ['b1', 'o', 'b2', 'a2']], [73, 25, 'M⁺•', A]] }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var SCALE = [["alkyl C–C", 5, 45], ['C–N', 30, 60], ['C–Cl / C–Br', 20, 65], ['C–O', 50, 90], ["C=C, aromatic", 100, 150], ["C=O (acid, ester)", 160, 185], ["C=O (aldehyde, ketone)", 190, 220]];
  var S = { m: 'prop', hi: 0, env: -1, view: 'ms', hide: false, _st: -1, _mk: '' }, lab = {}, SG, halos = [];
  function envs(k) { return Object.keys(M[k].cn); }
  function nC(k, e) { var c = 0; G[k].tag.forEach(function (t, i) { if (t && t[0] === e && G[k].a[i][0] === 'C') c++; }); return c; }
  function stages() {
    return [
      ["Molecular ion", "Molecular ion", "M + e⁻ → M⁺• + 2 e⁻: the peak of highest m/z gives the molar mass",
        "<p>In <b>mass spectrometry</b> (electron impact) the molecule loses an electron and forms the <b>molecular ion M⁺•</b>, whose <b>m/z</b> ratio is the molar mass (with z = 1). Ions are separated by m/z and their relative abundance is recorded; the most intense peak is the <b>base peak</b> (100 %). <b>Nitrogen rule</b>: odd M ⇔ odd number of N atoms (diethylamine, M = 73). Unstable ions give lighter fragments.</p>"],
      ["Cl and Br isotopes", "Isotopes", 'Cl: M / M+2 = 3 : 1 · Br: M / M+2 = 1 : 1',
        "<p>Halogens have very characteristic natural isotopes: <b>³⁵Cl : ³⁷Cl = 75.8 : 24.2 ≈ 3 : 1</b>; <b>⁷⁹Br : ⁸¹Br = 50.7 : 49.3 ≈ 1 : 1</b>. A compound with one Cl shows <b>M and M+2 peaks in a 3:1 ratio</b>; with one Br, <b>1:1</b>. In addition, ¹³C (1.1 %) produces a small <b>M+1</b> peak ≈ 1.1 % per C, useful for counting carbons.</p>"],
      ["Fragmentation", "Fragmentation", "α-cleavage, McLafferty: the ion breaks at the weakest bonds and gives the most stable cation",
        "<p>M⁺• fragments. In ketones, amines and alcohols <b>α-cleavage</b> dominates (the C–C bond next to the heteroatom): propanone → <b>CH₃C≡O⁺ (m/z 43)</b>; diethylamine → <b>m/z 58</b>; ethanol → <b>CH₂=OH⁺ (m/z 31)</b>. If there is an H at γ to the C=O, the <b>McLafferty rearrangement</b> occurs (pentan-2-one → <b>m/z 58</b>, with loss of ethene). The highlighted fragments are shown on the molecule.</p>"],
      ["¹³C NMR: signals", "Signals", "One signal for each chemically distinct carbon",
        "<p>In <b>¹³C NMR</b> (proton-decoupled) each <b>non-equivalent</b> carbon gives one signal. <b>Symmetry</b> reduces the number: <b>propanone</b> (two equivalent CH₃) gives 2 signals; <b>pentan-3-one</b>, 3; <b>butanone</b>, 4 and <b>pentan-2-one</b>, 5. The colors on the molecule show equivalent carbons (same color). Intensity is not proportional to the number of C.</p>"],
      ["Chemical shift", 'δ (ppm)', "The most deshielded carbons (C=O, C–O) appear at higher δ",
        "<p>The <b>chemical shift δ</b> (ppm, relative to TMS) depends on the electronic environment: electronegative atoms and carbonyls <b>deshield</b> the carbon. Approximately: <b>alkyl 5–45 · C–N 30–60 · C–O 50–90 · C=C/aromatic 100–150 · acid/ester C=O 160–185 · aldehyde/ketone C=O 190–220</b> ppm. The signal at ≈ 209 ppm in butanone identifies a ketone carbonyl.</p>"],
      ["Solving a structure", "Solve", "Combine M⁺•, fragments and the no. of ¹³C signals",
        "<p>Strategy: 1) <b>M</b> and the N rule → formula; 2) isotopes (Cl/Br); 3) characteristic <b>fragments</b> (43 = CH₃CO, 57 = C₂H₅CO, 58 = McLafferty/amine α); 4) <b>no. of ¹³C signals</b> and their δ → functional groups and symmetry. In “Lab” turn on “Problem mode” to hide the name and deduce the structure from the spectra alone.</p>"]
    ];
  }
  var SEG = [['prop', 'etoh', 'dea'], ['clor', 'brom'], ['prop', 'pen2', 'dea', 'etoh'], ['prop', 'pen3', 'buta', 'pen2'], ['buta'], ['pen3', 'brom', 'dea', 'pen2']];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var def = {
    key: 'espectrometria-ms-rmn13c', title: "Mass Spectrometry and ¹³C NMR", subtitle: "3D simulator · organic chemistry", accent: { dark: '#818cf8', light: '#3730a3' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 3, 15], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 15], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 15, 2], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Fragment / C environments", icon: '◎' }],
    build: function (ctx) {
      SG = MSim.stage(ctx); Object.keys(M).forEach(function (k) { SG.put(k, G[k], 0, 0, 0, { gs: 1.5 }); });
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
      Object.keys(M).forEach(function (k) { var g = SG.get(k); g.userData.hs = []; G[k].a.forEach(function (a, i) { var t = G[k].tag[i]; if (!t || a[0] === 'H') return; var h = new T.Mesh(new T.SphereGeometry(0.95, 18, 12), new T.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.42, depthWrite: false })); h.position.set(a[1] * 1.5, a[2] * 1.5, a[3] * 1.5); h.userData = { tag: t }; g.add(h); g.userData.hs.push(h); }); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, sq = SEG[i], n = sq.length, ix = Math.min(n - 1, Math.floor(f.local * n)), lq = (f.local * n) % 1; S.m = sq[ix]; S.hide = false;
        S.view = (i <= 2) ? 'ms' : 'cn'; var m = M[S.m];
        if (i === 0) { S.hi = m.pk.length - 1; } else if (i === 1) { S.hi = m.pk.length - Math.floor(lq * 2.2) - 1; if (S.hi < 0) S.hi = m.pk.length - 1; } else if (i === 2) { S.hi = Math.min(m.pk.length - 2, Math.floor(lq * (m.pk.length - 1))); }
        else if (i === 3) { S.env = -1; } else if (i === 4) { S.env = Math.floor(lq * 4.99) % envs(S.m).length; } else { S.view = lq < 0.5 ? 'ms' : 'cn'; S.hi = Math.min(m.pk.length - 1, Math.floor(lq * 2 * m.pk.length)); S.env = -1; }
        if (i !== 4 && i !== 5 && i !== 3) S.env = -1;
      }
      var m = M[S.m]; SG.begin(); var g = SG.put(S.m, G[S.m], 0, 0.5, 0, { gs: 1.5 }); g.rotation.y = now * 0.25; var on = ctx.layer('halo');
      var pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))], fr = pk[3];
      g.userData.hs.forEach(function (h) {
        var t = h.userData.tag, c = null;
        if (S.view === 'cn') { var e = t[0]; if (ENVC[e] && m.cn[e]) { c = ENVC[e]; if (S.env >= 0 && envs(S.m)[S.env] !== e) { c = null; } } }
        else if (fr) { if (fr === A || fr.indexOf(t) >= 0) c = fr === A ? 0x4dabf7 : 0xff922b; }
        h.visible = on && !!c; if (c) h.material.color.setHex(c);
      });
      var hide = S.hide;
      lab.t.pos(0, 5.6, 0).set(hide ? "Unknown compound" : m.n + ' · ' + m.f, 'bl-lead').vis(true);
      lab.a.pos(0, -4.6, 0).set(S.view === 'ms' ? 'm/z ' + pk[0] + ' · ' + pk[1] + ' % · ' + (hide ? '?' : pk[2]) : (S.env >= 0 ? envs(S.m)[S.env] && 'δ ' + m.cn[envs(S.m)[S.env]][0] + ' ppm · ' + m.cn[envs(S.m)[S.env]][1] : envs(S.m).length + " ¹³C signals (" + G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length + ' C)'), 'bl-pos').vis(true);
      lab.b.pos(0, -5.6, 0).set('M = ' + m.M + (m.M % 2 ? " (odd → odd N)" : " (even)") + (m.iso ? " · pattern " + (m.iso === 'Cl' ? '3:1 (Cl)' : '1:1 (Br)') : ''), 'bl-d').vis(!hide || true);
      lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); },
    hud: function () { var m = M[S.m], pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))]; return { eq: { chip: 'MS', name: S.hide ? "Unknown compound" : m.n, body: '<div class="eqline"><small>M⁺•</small>' + m.M + "</div><div class=\"eqline\"><small>Selected peak</small>m/z " + pk[0] + "</div><div class=\"eqline\"><small>¹³C signals</small>" + envs(S.m).length + '</div>' }, legend: [{ label: "Orange", color: '#ff922b', text: "peak fragment" }, { label: "Colors", color: '#4dabf7', text: "equivalent carbons (¹³C)" }] }; },
    measures: function () { var m = M[S.m], pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))]; return [["Compound", S.hide ? '?' : m.n], ["Formula", S.hide ? '?' : m.f], ['M⁺• (m/z)', String(m.M)], ["Base peak", String(m.pk.filter(function (p) { return p[1] === 100; })[0][0])], ["Selected peak", 'm/z ' + pk[0] + ' (' + pk[1] + ' %)'], ["¹³C signals", String(envs(S.m).length)], ["C atoms", String(G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length)]]; },
    ideas: ["<b>M⁺•</b> = molar mass; odd M ⇒ odd N.", 'Cl: M:M+2 = 3:1 · Br: 1:1.', "α-cleavage and McLafferty explain base peaks.", "¹³C: one signal per non-equivalent C.", "δ: alkyl < C–O < C=C < C=O."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Compound"); el.appendChild(c);
      ui.m = kit.ui.options({ label: "Molecule", cols: 2, value: S.m, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].n, sub: M[k].f }; }), onChange: function (v) { ctx.goManual(); S.m = v; S.hi = M[v].pk.length - 1; S.env = -1; } }); c.appendChild(ui.m);
      ui.hi = kit.ui.slider({ label: "Mass peak (index)", min: 0, max: 4, step: 1, value: 0, format: function (v) { var m = M[S.m]; var p = m.pk[Math.min(v, m.pk.length - 1)]; return 'm/z ' + p[0]; }, onInput: function (v) { ctx.goManual(); S.view = 'ms'; S.hi = Math.min(v, M[S.m].pk.length - 1); } });
      ui.env = kit.ui.slider({ label: "Carbon environment (¹³C)", min: 0, max: 4, step: 1, value: 0, format: function (v) { var e = envs(S.m); var k = e[Math.min(v, e.length - 1)]; return 'δ ' + M[S.m].cn[k][0]; }, onInput: function (v) { ctx.goManual(); S.view = 'cn'; S.env = Math.min(v, envs(S.m).length - 1); } }); c.appendChild(kit.ui.sliders([ui.hi, ui.env]));
      c.appendChild(ctx.btnRow([{ t: "Problem mode", fn: function () { ctx.goManual(); S.hide = !S.hide; } }, { t: "See ¹³C", fn: function () { ctx.goManual(); S.view = 'cn'; S.env = -1; } }, { t: "See masses", fn: function () { ctx.goManual(); S.view = 'ms'; } }, { t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Mass spectrum (EI)", h: 230, note: "Relative abundance versus m/z; the selected peak in orange.", draw: function (cx, w, h, col) {
        var m = M[S.m], L = 36, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = Math.ceil((m.M + 8) / 10) * 10, sx = function (v) { return L + pw * v / mx; }, i;
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 100; i += 25) { var y = Tp + ph - ph * i / 100; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= mx; i += 10) cx.fillText(i, sx(i), h - B + 13); cx.fillText("m/z   ·   % abundance", L + pw / 2, h - 4);
        m.pk.forEach(function (p, k) { var cur = k === S.hi; cx.strokeStyle = cur ? '#ff922b' : '#818cf8'; cx.lineWidth = cur ? 5 : 3.5; cx.beginPath(); cx.moveTo(sx(p[0]), Tp + ph); cx.lineTo(sx(p[0]), Tp + ph - ph * p[1] / 100); cx.stroke(); cx.fillStyle = col.ink; cx.fillText(p[0], sx(p[0]), Tp + ph - ph * p[1] / 100 - 5); }); cx.lineWidth = 1;
      } },
      { title: "¹³C spectrum (decoupled)", h: 210, note: "One line per type of carbon; δ in ppm decreases to the right.", draw: function (cx, w, h, col) {
        var m = M[S.m], ks = envs(S.m), L = 14, Rr = 14, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (d) { return L + pw * (1 - d / 220); }, i;
        cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; for (i = 0; i <= 200; i += 50) { cx.beginPath(); cx.moveTo(sx(i), Tp + ph); cx.lineTo(sx(i), Tp + ph + 4); cx.stroke(); cx.fillText(i, sx(i), h - B + 14); } cx.beginPath(); cx.moveTo(L, Tp + ph); cx.lineTo(L + pw, Tp + ph); cx.stroke(); cx.fillText('δ (ppm)', L + pw / 2, h - 4);
        ks.forEach(function (k, j) { var d = m.cn[k][0], cur = S.env === j, c = '#' + ('000000' + ENVC[k].toString(16)).slice(-6), hh = ph * (0.55 + 0.1 * Math.min(2, nC(S.m, k))); cx.strokeStyle = c; cx.lineWidth = cur ? 5 : 3; cx.beginPath(); cx.moveTo(sx(d), Tp + ph); cx.lineTo(sx(d), Tp + ph - hh); cx.stroke(); cx.fillStyle = col.ink; cx.fillText(d, sx(d), Tp + ph - hh - 5); }); cx.lineWidth = 1;
      } },
      { title: "Chemical shift scale", h: 210, note: "Typical ¹³C δ ranges; the dots are the signals of the current compound.", draw: function (cx, w, h, col) {
        var m = M[S.m], L = 118, Rr = 10, Tp = 10, B = 26, pw = w - L - Rr, rh = (h - Tp - B) / SCALE.length, sx = function (d) { return L + pw * d / 220; }, i;
        cx.font = '10px system-ui'; SCALE.forEach(function (s, k) { cx.fillStyle = 'rgba(129,140,248,.45)'; cx.fillRect(sx(s[1]), Tp + k * rh + 3, sx(s[2]) - sx(s[1]), rh - 6); cx.fillStyle = col.muted; cx.textAlign = 'right'; cx.fillText(s[0], L - 6, Tp + k * rh + rh / 2 + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 200; i += 50) cx.fillText(i, sx(i), h - B + 14);
        envs(S.m).forEach(function (k) { var d = m.cn[k][0]; cx.strokeStyle = '#' + ('000000' + ENVC[k].toString(16)).slice(-6); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx(d), Tp); cx.lineTo(sx(d), h - B); cx.stroke(); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = M[S.m], nc = G[S.m].a.filter(function (a) { return a[0] === 'C'; }).length, pk = m.pk[Math.max(0, Math.min(m.pk.length - 1, S.hi))];
      return '<div class="card-kicker">' + (S.hide ? "Unknown compound" : m.n + ' · ' + m.f) + "</div><div class=\"calc-step\">1 · Masses</div><table class=\"calc-table\">" + row('M⁺•', 'm/z ' + m.M + (m.M % 2 ? " → odd N" : " → even N (0, 2…)")) + row('M+1 (¹³C)', '≈ 1,1 % × ' + nc + ' C = <b>' + f1(1.1 * nc) + " %</b> of M") + (m.iso ? row('M+2', m.iso === 'Cl' ? "≈ 32 % of M (³⁷Cl)" : "≈ 97 % of M (⁸¹Br)") : '') + row("Selected peak", 'm/z ' + pk[0] + ' (' + pk[1] + ' %) · ' + (S.hide ? '?' : pk[2]) + (pk[0] < m.M ? " · loss of " + (m.M - pk[0]) + ' u' : '')) + '</table>' +
        '<div class="calc-step">2 · ¹³C</div><table class="calc-table">' + envs(S.m).map(function (k) { return row('δ ' + m.cn[k][0], m.cn[k][1] + ' (' + nC(S.m, k) + ' C)'); }).join('') + row("Signals", envs(S.m).length + ' de ' + nc + ' C') + '</table>';
    },
    quiz: [
      { q: "A compound with M = 73 contains…", options: ["an odd number of N", "no N", "an even number of N", "one Cl"], answer: 0, why: "Nitrogen rule." },
      { q: "An M and M+2 peak in a 3:1 ratio indicates…", options: ['Cl', 'Br', 'S', 'N'], answer: 0, why: '³⁵Cl:³⁷Cl ≈ 3:1.' },
      { q: "The base peak of propanone (m/z 43) corresponds to…", options: ['CH₃C≡O⁺', 'CH₃⁺', 'C₃H₇⁺', 'M⁺•'], answer: 0, why: "α-cleavage of the C–C bond next to the C=O." },
      { q: "Pentan-3-one gives in ¹³C…", options: ["3 signals", "5 signals", "2 signals", "1 signal"], answer: 0, why: "Two equivalent CH₃ and two equivalent CH₂, plus the C=O." },
      { q: "A ¹³C signal at 209 ppm indicates…", options: ["C=O of ketone or aldehyde", "an alkane", "a C–O", "an aromatic"], answer: 0, why: "Aldehyde/ketone carbonyls: 190–220 ppm." },
      { q: "The McLafferty rearrangement requires…", options: ["an H at γ to the C=O", "a halogen", "a ring", "a C=C double bond"], answer: 0, why: "Transfer of an H at γ through a 6-membered state." },
      { q: "In decoupled ¹³C the intensity of a signal…", options: ["is not proportional to the no. of C", "is proportional", "is always 1", "depends only on the solvent"], answer: 0, why: "It depends on relaxation and the NOE effect." },
      { q: "Bromoethane shows M and M+2 in a ratio of…", options: ['1:1', '3:1', '9:1', '1:3'], answer: 0, why: "⁷⁹Br and ⁸¹Br are almost equally probable." }
    ],
    help: { intro: "Choose the molecule and step through mass peaks or ¹³C environments in “Lab”. The halos on the molecule show the fragment of each peak (orange) or the equivalent carbons (color).", items: [["Problem mode", "hides the name and the formula."]] }
  };
  MSim.create(def);
})();
