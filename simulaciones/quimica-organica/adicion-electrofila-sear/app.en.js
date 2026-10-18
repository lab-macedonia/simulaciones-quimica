/* Adición electrófila y SEAr — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length; var cat = false; if (el === 'C' && s[i] === '+') { cat = true; i++; }
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, cat: cat, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
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
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - (n.cat ? 1 : 0) - sum); }
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

(function () {
  var fmt = SimKit.fmt, R = 8.314;
  var AK = {
    eteno: { n: "ethene", r: 'C=C', cM: 'CC+', cm: null, pM: 'CCX', pm: null, d: 'BrCCBr', tM: "primary (ethyl)", tm: '' },
    propeno: { n: "propene", r: 'CC=C', cM: 'CC+C', cm: 'C+CC', pM: 'CC(X)C', pm: 'CCCX', d: 'BrCC(Br)C', tM: 'secundario', tm: 'primario' },
    ib: { n: '2-metilpropeno', r: 'CC(C)=C', cM: 'CC+(C)C', cm: 'CC(C)C+', pM: 'CC(C)(C)X', pm: 'CC(C)CX', d: 'BrCC(Br)(C)C', tM: 'terciario', tm: 'primario' },
    but1: { n: '1-buteno', r: 'CCC=C', cM: 'CCC+C', cm: 'CCCC+', pM: 'CCC(X)C', pm: 'CCCCX', d: 'BrCC(Br)CC', tM: 'secundario', tm: 'primario' },
    but2: { n: '2-buteno', r: 'CC=CC', cM: 'CC+CC', cm: null, pM: 'CCC(X)C', pm: null, d: 'CC(Br)C(Br)C', tM: 'secundario', tm: '' }
  };
  var RG = { HBr: { n: 'HBr', x: 'Br', col: 0xa0522d, ion: 'Br⁻', len: 1.41, pn: "bromine" }, HCl: { n: 'HCl', x: 'Cl', col: 0x3ddc5a, ion: 'Cl⁻', len: 1.27, pn: "chlorine" }, H2O: { n: 'H₂O / H⁺', x: 'O{ol}', col: 0xff4d4d, ion: 'H₂O', len: 1.0, pn: "hydroxy" }, Br2: { n: 'Br₂', x: 'Br', col: 0xa0522d, ion: 'Br⁻', len: 2.28, pn: "bromine" } };
  var CAT = { "primary (ethyl)": 80, primario: 120, secundario: 80, terciario: 55 }; // energía relativa del carbocatión en disolución (esquema), kJ/mol
  var HIA = { metilo: 1312, primario: 1115, secundario: 1042, terciario: 967 }; // afinidad al hidruro, gas, kJ/mol (aprox.)
  var SU = {
    H: { t: 'H', c: 0xf2f2f2, r: 0.35, ty: "no substituent (benzene)", rate: 1, pct: null, n: "benzene", col: 0x91a7ff, off: [0, 0, 0] },
    CH3: { t: 'CH₃', c: 0x56606b, r: 0.8, ty: "activating · ortho/para", rate: 25, pct: [58, 5, 37], n: "toluene", col: 0xff8787, off: [-8, -1, -9] },
    OH: { t: 'OH', c: 0xff4d4d, r: 0.62, ty: "strongly activating · ortho/para", rate: 1000, pct: [40, 0, 60], n: "phenol", col: 0xff6b6b, off: [-15, -2, -17] },
    Cl: { t: 'Cl', c: 0x3ddc5a, r: 0.95, ty: "weakly deactivating · ortho/para", rate: 0.033, pct: [30, 1, 69], n: "chlorobenzene", col: 0xffd43b, off: [8, 14, 6] },
    NO2: { t: 'NO₂', c: 0x4f7cff, r: 0.8, ty: "strongly deactivating · meta", rate: 6e-8, pct: [6, 93, 1], n: "nitrobenzene", col: 0x4dabf7, off: [25, 14, 27] }
  };
  var EL = {
    NO2: { t: 'NO₂⁺', n: "nitration", pn: 'nitro', c: 0x4f7cff, gen: 'HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻', cond: 'HNO₃ / H₂SO₄' },
    Br: { t: 'Br⁺', n: "bromination", pn: "bromine", c: 0xa0522d, gen: 'Br₂ + FeBr₃ → Br⁺ [FeBr₄]⁻', cond: 'Br₂ / FeBr₃' },
    SO3: { t: 'SO₃', n: "sulfonation", pn: "sulfonic", c: 0xe6c229, gen: '2 H₂SO₄ ⇌ SO₃ + H₃O⁺ + HSO₄⁻', cond: 'SO₃ / H₂SO₄' },
    Ac: { t: 'CH₃CO⁺', n: "Friedel–Crafts acylation", pn: "acetyl", c: 0xff9a3d, gen: 'CH₃COCl + AlCl₃ → CH₃CO⁺ + AlCl₄⁻', cond: 'CH₃COCl / AlCl₃' }
  };
  var S = { mode: 'alq', ak: 'propeno', rg: 'HBr', su: 'H', el: 'NO2', pos: 3, prog: 0, man: false, cmp: false, T: 298 };
  var STAGE = { mode: 'alq', i: 0, p: 0 }, G = {}, labs = {}, arrows = [], cacheKey = '', geos = {};
  function vec(x, y, z) { return new THREE.Vector3(x, y, z); }
  function nbrs(g, i) { var o = []; g.b.forEach(function (b) { if (b[0] === i) o.push(b[1]); else if (b[1] === i) o.push(b[0]); }); return o; }
  function align(g, o, a, b, up, tx) {
    var P = g.a.map(function (q) { return vec(q[1], q[2], q[3]); }), po = P[o], e1 = po.clone().sub(P[a]).normalize(), y;
    if (up != null) { var u = P[up].clone().sub(po); y = u.sub(e1.clone().multiplyScalar(u.dot(e1))).normalize(); } else { y = new THREE.Vector3().crossVectors(P[a].clone().sub(po), P[b].clone().sub(po)).normalize(); if (y.y < 0) y.negate(); }
    var z = new THREE.Vector3().crossVectors(e1, y); g.a.forEach(function (q, i) { var d = P[i].clone().sub(po); q[1] = d.dot(e1) + tx; q[2] = d.dot(y); q[3] = d.dot(z); }); return g;
  }
  function species(kind, ak, rg) {
    var A = AK[ak], k = kind + ak + rg; if (geos[k]) return geos[k]; var g;
    if (kind === 'r') { g = MSim.build(A.r); var db = g.b.filter(function (b) { return b[2] === 2 && g.a[b[0]][0] === 'C' && g.a[b[1]][0] === 'C'; })[0], i = db[0], j = db[1], cn = function (x) { return nbrs(g, x).filter(function (m) { return g.a[m][0] === 'C'; }).length; }, h = cn(i) <= cn(j) ? i : j, c = h === i ? j : i, aa = nbrs(g, h).filter(function (m) { return m !== c; })[0]; align(g, c, h, aa, null, 0.67); g.hC = h; g.cC = c; }
    else if (kind === 'cM' || kind === 'cm') { var s = kind === 'cM' ? A.cM : A.cm; g = MSim.build(s); var ci = g.tag.indexOf('cat'), nb = nbrs(g, ci); align(g, ci, nb[0], nb[1], null, 0.67); g.cC = ci; }
    else if (kind === 'pM' || kind === 'pm') { var s2 = (kind === 'pM' ? A.pM : A.pm).replace('X', RG[rg].x); g = MSim.build(s2); var xi = -1; g.a.forEach(function (q, i) { if (xi < 0 && (q[0] === 'Br' || q[0] === 'Cl' || (q[0] === 'O' && rg === 'H2O'))) xi = i; }); var cx = nbrs(g, xi)[0], an = nbrs(g, cx).filter(function (m) { return m !== xi && g.a[m][0] === 'C'; })[0]; if (an == null) an = nbrs(g, cx).filter(function (m) { return m !== xi; })[0]; align(g, cx, an, null, xi, 0.67); g.xi = xi; g.cC = cx; }
    else if (kind === 'd') { g = MSim.build(A.d); var br = []; g.a.forEach(function (q, i) { if (q[0] === 'Br') br.push(i); }); var c1 = nbrs(g, br[0])[0], an2 = nbrs(g, c1).filter(function (m) { return m !== br[0] && g.a[m][0] === 'C'; })[0]; align(g, c1, an2, null, br[0], 0.67); }
    geos[k] = g; return g;
  }
  function atomM(T, col, r) { var m = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: col, roughness: 0.35 })); m.scale.setScalar(r); return m; }
  function cylM(T, col, rad) { return new T.Mesh(new T.CylinderGeometry(rad || 0.09, rad || 0.09, 1, 10), new T.MeshStandardMaterial({ color: col || 0xbfc7d1, roughness: 0.5 })); }
  function bondTo(T, m, p, q) { var d = q.clone().sub(p), L = d.length(); m.scale.set(1, Math.max(1e-3, L), 1); m.position.copy(p).add(q).multiplyScalar(0.5); if (L > 1e-6) m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
  function setArrow(T, ar, p0, p1, bulge, on) {
    if (ar.mesh) { ar.mesh.geometry.dispose(); ar.group.remove(ar.mesh); ar.mesh = null; } ar.group.visible = on; if (!on) return;
    var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bulge), cur = new T.QuadraticBezierCurve3(p0, mid, p1); ar.mesh = new T.Mesh(new T.TubeGeometry(cur, 14, 0.05, 6, false), ar.mat); ar.group.add(ar.mesh);
    var tan = p1.clone().sub(cur.getPoint(0.92)).normalize(); ar.head.position.copy(p1); ar.head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan);
  }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["The π bond is nucleophilic", "nucleophilic π", "Alkenes react with electrophiles through their π bond", "<p>The C=C double bond has π electron density exposed above and below the plane (blue cloud). It is an electron-rich region: a <b>nucleophile</b>. Typical reactions are <b>electrophilic additions</b>: the π bond breaks and two new σ bonds form. Here: propene + HBr.</p>"],
      ["Step 1: attack on H⁺", "Attack on H⁺", "The π bond attacks the H of HBr (slow step)", "<p>The π electrons attack the δ⁺ hydrogen of HBr (curved arrow); the H–Br bond breaks and Br takes the electron pair as <b>Br⁻</b>. The H bonds to the <b>less substituted</b> carbon, leaving the positive charge on the more substituted one. This is the <b>rate-determining step</b>.</p>"],
      ["Intermediate carbocation", "Carbocation", "Planar sp² C⁺ with an empty p orbital", "<p>The intermediate is a <b>carbocation</b>: a planar sp² carbon with an <b>empty p orbital</b> (orange lobes) perpendicular to the plane. Here it is <b>secondary</b>: stabilized by <b>hyperconjugation</b> (neighboring σ C–H bonds donating into the empty p) and by the inductive effect of the alkyl groups. Tertiary &gt; secondary &gt; primary.</p>"],
      ["Step 2: nucleophilic attack", "Attack by Br⁻", "Br⁻ bonds to the carbocation (fast)", "<p>The <b>Br⁻</b> nucleophile donates an electron pair to the empty p orbital and forms the C–Br bond. It can attack from <b>either face</b> of the planar carbocation; if the product were chiral a racemic mixture would be obtained. Product: <b>2-bromopropane</b>.</p>"],
      ["Markovnikov's rule", 'Markovnikov', "The H goes to the carbon with more H atoms: the more stable carbocation forms", "<p><b>Markovnikov</b>: in the addition of HX to an unsymmetrical alkene, the H bonds to the carbon that already has more hydrogens. Modern explanation: the path through the <b>more stable</b> carbocation (lower transition-state energy) is much faster. Comparison: secondary (left) versus primary (right).</p>"],
      ["Bromination: bromonium ion", "Bromonium", "Br₂ adds anti through a bromonium ion", "<p>With <b>Br₂</b> no free carbocation forms but a cyclic <b>bromonium ion</b> (Br⁺ bridge over C–C). Br⁻ attacks from the <b>opposite</b> face (SN2 on the bromonium): the addition is <b>anti</b>, stereospecific. Product: 1,2-dibromopropane.</p>"],
      ["Benzene: aromaticity", "Aromaticity", "Benzene substitutes (does not add) to preserve aromaticity", "<p>Benzene has 6 delocalized π electrons (blue ring): great stability (≈ 150 kJ/mol of resonance energy). An addition would destroy the aromaticity; that is why it reacts by <b>electrophilic aromatic substitution (SEAr)</b>: the H is replaced by an electrophile and the ring is recovered. Example: nitration with NO₂⁺.</p>"],
      ["Step 1: electrophilic attack", "Electrophile", "A strong electrophile is generated and the ring attacks it (slow)", "<p>The ring is only weakly nucleophilic: it requires a powerful electrophile, generated with Lewis or Brønsted acids (HNO₃/H₂SO₄ → NO₂⁺). The π electrons attack the electrophile and momentarily destroy the aromaticity: this is the <b>slow step</b>.</p>"],
      ["σ complex (Wheland)", "σ complex", "Cyclohexadienyl carbocation: charge delocalized at ortho and para", "<p>The intermediate is the <b>σ complex</b> (arenium ion): the attacked carbon is sp³ (with H and E) and the + charge is delocalized over the carbons <b>ortho and para</b> to it (red spheres). It is the analog of the carbocation in the addition, but with resonance stabilization (3 structures).</p>"],
      ["Step 2: rearomatization", "Rearomatization", "Loss of H⁺ restores the aromatic ring", "<p>A base (HSO₄⁻) removes the H⁺ from the sp³ carbon; the electrons of the C–H bond return to the ring and <b>aromaticity</b> is recovered. The net result is substitution: Ar–H + E⁺ → Ar–E + H⁺. The step is fast because recovering the aromatic ring is very favorable.</p>"],
      ["Orientation: ortho, meta, para", "Orientation", "The substituent decides where the second group enters", "<p>A substituent already present directs the new electrophile. The bars show the typical distribution for <b>nitration</b>: <b>–CH₃</b> directs <b>ortho/para</b> (58 % o, 5 % m, 37 % p); <b>–NO₂</b> directs <b>meta</b> (93 %). Reason: the stability of the σ complex (can the substituent stabilize the + charge?).</p>"],
      ["Activating and deactivating groups", "Reactivity", "Donors speed up; withdrawers slow down the reaction", "<p><b>Donor</b> groups (–CH₃, –OH) enrich the ring (red cloud), stabilize the σ complex and <b>speed up</b> SEAr (toluene ≈ 25× benzene). <b>Withdrawing</b> groups (–NO₂) deplete the ring (blue cloud) and <b>slow</b> it (nitrobenzene ≈ 6×10⁻⁸ × benzene). –Cl deactivates (inductive) but directs o/p (resonance).</p>"]
    ];
  }
  var GS = 1.25;
  var PN = {
    eteno: { Br: "bromoethane", Cl: "chloroethane", O: "ethanol", d: "1,2-dibromoethane", m: {} },
    propeno: { Br: '2-bromopropano', Cl: '2-cloropropano', O: 'propan-2-ol', d: "1,2-dibromopropane", m: { Br: '1-bromopropano', Cl: '1-cloropropano', O: 'propan-1-ol' } },
    ib: { Br: '2-bromo-2-metilpropano', Cl: '2-cloro-2-metilpropano', O: '2-metilpropan-2-ol', d: "1,2-dibromo-2-methylpropane", m: { Br: '1-bromo-2-metilpropano', Cl: '1-cloro-2-metilpropano', O: '2-metilpropan-1-ol' } },
    but1: { Br: '2-bromobutano', Cl: '2-clorobutano', O: 'butan-2-ol', d: "1,2-dibromobutane", m: { Br: '1-bromobutano', Cl: '1-clorobutano', O: 'butan-1-ol' } },
    but2: { Br: '2-bromobutano', Cl: '2-clorobutano', O: 'butan-2-ol', d: "2,3-dibromobutane", m: {} }
  };
  var CATN = { "primary (ethyl)": 'primario', primario: 'primario', secundario: 'secundario', terciario: 'terciario' };
  function xk() { return S.rg === 'HBr' ? 'Br' : (S.rg === 'HCl' ? 'Cl' : 'O'); }
  function lessonState(i) {
    if (i < 6) { S.mode = 'alq'; S.ak = 'propeno'; S.rg = i === 5 ? 'Br2' : 'HBr'; S.cmp = i === 4; }
    else { S.mode = 'ar'; S.el = 'NO2'; S.pos = 3; if (i < 10) S.su = 'H'; }
  }
  function molGroup(ctx, kind) {
    var key = kind + '|' + S.ak + '|' + S.rg; if (!G.cache[key]) { var g = ctx.mol(species(kind, S.ak, S.rg), { gs: GS, ar: 0.46 }); g.visible = false; ctx.scene.add(g); G.cache[key] = g; } return G.cache[key];
  }
  function hideMols() { Object.keys(G.cache).forEach(function (k) { G.cache[k].visible = false; G.cache[k].position.set(0, 0, 0); }); }
  function V(x, y, z) { return new THREE.Vector3(x * GS, y * GS, z * GS); }
  function alqState(si, p, now) {
    var A = AK[S.ak], rg = RG[S.rg], r = { main: 'r', hx: null, nu: null, arr: [null, null], lobe: null, bromonium: false, cmp: false, txt: '' };
    var HD = (S.rg === 'Br2' ? new THREE.Vector3(0.8, 0.6, 0) : new THREE.Vector3(1, 0.45, 0)).normalize(), start = V(2.8, 3.4, 0), hC = V(-0.67, 1.15, 0), nuHome = V(3.3, 2.9, 0);
    function hx(Hp, len) { var X = Hp.clone().add(HD.clone().multiplyScalar(len)); r.hx = { H: Hp, X: X }; return X; }
    if (S.rg !== 'Br2') {
      if (si === 0) { hx(start, rg.len * GS); r.lobe = 'pi'; r.txt = "alkene + " + S.rg; }
      else if (si === 1) { var e = sm(p / 0.92), Hp = start.clone().lerp(hC, e), xo = sm((p - 0.5) / 0.45), len = (rg.len + 1.9 * xo) * GS, X = hx(Hp, len); r.lobe = 'pi'; r.txt = "the π bond attacks H";
        r.arr[0] = { a: V(0, 0.55, 0), b: Hp.clone(), bl: new THREE.Vector3(-0.4, 0.8, 0) }; r.arr[1] = { a: Hp.clone().add(HD.clone().multiplyScalar(rg.len * GS * 0.5)), b: X.clone(), bl: new THREE.Vector3(0.5, 0.9, 0) };
        if (p > 0.9) { r.main = 'cM'; r.hx = null; r.arr = [null, null]; r.nu = V(0, 0, 0).copy(X); r.lobe = 'p'; } }
      else if (si === 2) { r.main = 'cM'; r.lobe = 'p'; r.nu = nuHome.clone().add(new THREE.Vector3(0.25 * Math.sin(now * 1.5), 0.15 * Math.cos(now), 0)); r.txt = "carbocation " + CATN[A.tM]; }
      else { var e2 = sm(p / 0.88); if (p > 0.88) { r.main = 'pM'; } else { r.main = 'cM'; r.lobe = 'p'; var np = nuHome.clone().lerp(V(0.67, (rg.len > 1.3 ? 1.94 : 1.6), 0), e2); r.nu = np; r.arr[0] = { a: np.clone(), b: V(0.67, 0.5, 0), bl: new THREE.Vector3(0.4, 0.9, 0) }; } r.txt = "nucleophilic attack"; }
      if (si === 4) { r.cmp = true; r.main = 'cM'; r.lobe = 'p'; r.txt = "secondary vs primary"; }
    } else {
      var B0 = start, bro = V(0, 1.95, 0);
      if (p < 0.33) { var e3 = sm(p / 0.3), B1 = B0.clone().lerp(bro, e3), X2 = hx(B1, (2.28 + 1.4 * e3) * GS); r.lobe = 'pi'; r.arr[0] = { a: V(0, 0.55, 0), b: B1.clone(), bl: new THREE.Vector3(-0.4, 0.8, 0) }; r.arr[1] = { a: B1.clone().add(HD.clone().multiplyScalar(1.1 * GS)), b: X2.clone(), bl: new THREE.Vector3(0.5, 0.9, 0) }; r.txt = "Br₂ becomes polarized"; }
      else if (p < 0.66) { r.bromonium = true; r.nu = V(3.4, 1.4 - 2.6 * sm((p - 0.33) / 0.33), 0); r.txt = "bromonium ion"; }
      else if (p > 0.93) { r.main = 'd'; r.txt = "anti addition"; }
      else { r.bromonium = true; var e4 = sm((p - 0.66) / 0.27), n4 = V(3.4, -1.2, 0).lerp(V(1.0, -2.1, 0), e4); r.nu = n4; r.arr[0] = { a: n4.clone(), b: V(0.67, -0.55, 0), bl: new THREE.Vector3(0.4, -0.8, 0) }; r.txt = "anti attack"; }
    }
    return r;
  }
  var RC = 2.0, RS = 3.5, RH = 3.15;
  function rpos(i, rad, y) { var a = i * Math.PI / 3; return new THREE.Vector3(Math.cos(a) * rad, y || 0, Math.sin(a) * rad); }
  function arState(si, p, now) {
    var k = S.pos, r = { E: null, bond: false, Hl: null, base: null, torus: 1, charges: false, bars: false, arr: [null, null], txt: '', sub: S.su };
    var Ek = rpos(k, RC, 0), up = new THREE.Vector3(0, 1.55, 0);
    if (si === 6) { r.txt = "benzene (delocalized π)"; }
    else if (si === 7) { var e = sm(p), far = new THREE.Vector3(7, 5.5, 3.5), tgt = Ek.clone().add(up); r.E = far.clone().lerp(tgt, e); r.arr[0] = { a: rpos(k, RC * 0.7, 0.9), b: r.E.clone(), bl: new THREE.Vector3(0, 0.8, 0) }; r.txt = "the π bond attacks the electrophile"; r.torus = 1 - 0.3 * e; }
    else if (si === 8) { r.E = Ek.clone().add(up); r.bond = true; r.Hl = rpos(k, RC + 1.0, -0.95); r.torus = 0; r.charges = true; r.txt = "σ complex (+ charge at o/p)"; }
    else if (si === 9) { var e5 = sm(p); r.E = Ek.clone().add(up).lerp(rpos(k, RS, 0), e5); r.bond = true; var hp0 = rpos(k, RC + 1.0, -0.95), hp1 = rpos(k, RC + 3.3, -0.6); r.Hl = hp0.clone().lerp(hp1, e5); r.base = rpos(k, RC + 4.4, -0.5); r.torus = e5; r.charges = p < 0.5; r.arr[0] = { a: rpos(k, RC + 1.0, -0.95).multiplyScalar(0.8).add(new THREE.Vector3(0, 0.4, 0)), b: rpos(k, RC * 0.8, 0.3), bl: new THREE.Vector3(0, 0.6, 0) }; r.arr[1] = { a: r.base.clone(), b: r.Hl.clone(), bl: new THREE.Vector3(0, 0.7, 0) }; r.txt = "the base removes H⁺: the ring is recovered"; }
    else if (si === 10) { var cyc = ['CH3', 'NO2']; r.sub = p < 0.5 ? cyc[0] : cyc[1]; r.bars = true; r.txt = SU[r.sub].n; }
    else { var c2 = ['CH3', 'H', 'NO2']; r.sub = c2[Math.min(2, Math.floor(p * 3))]; r.txt = SU[r.sub].n; }
    return r;
  }
  var CURR = { alq: null };
  var def = {
    key: 'adicion-electrofila-sear', title: "Electrophilic Addition and SEAr", subtitle: "3D simulator · organic chemistry", accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 12, dur: 10, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [4, 7, 14], target: [0, 0.3, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 16], target: [0, 0.3, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 3], target: [0, 0, 0] }, { id: 'ar', label: "Ring", pos: [3, 8, 9], target: [0, 0, 0] }, { id: 'lado', label: "Side", pos: [15, 2, 0], target: [0, 0.3, 0] }],
    layers: [{ id: 'orb', label: "Orbitals / π cloud", icon: '☁' }, { id: 'arrows', label: "Curved arrows", icon: '↷' }, { id: 'chg', label: "Charges", icon: '+' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; G.cache = {};
      G.H = atomM(T, 0xf2f2f2, 0.38); G.X = atomM(T, 0xa0522d, 0.95); G.hxB = cylM(T, 0xbfc7d1, 0.1); G.nu = atomM(T, 0xa0522d, 0.95); G.bb1 = cylM(T, 0xe6c229, 0.08); G.bb2 = cylM(T, 0xe6c229, 0.08); G.bro = atomM(T, 0xa0522d, 0.9);
      [G.H, G.X, G.hxB, G.nu, G.bb1, G.bb2, G.bro].forEach(function (m) { m.visible = false; s.add(m); });
      var lm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.33, depthWrite: false }), pm = new T.MeshBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.42, depthWrite: false });
      G.lobeMats = { pi: lm, p: pm }; G.lobes = []; for (var i = 0; i < 4; i++) { var l = new T.Mesh(new T.SphereGeometry(1, 20, 14), lm); l.visible = false; s.add(l); G.lobes.push(l); }
      arrows.length = 0; for (i = 0; i < 2; i++) { var ar = { group: new T.Group(), mat: new T.MeshBasicMaterial({ color: 0xff7a3d }), mesh: null, head: new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), new T.MeshBasicMaterial({ color: 0xff7a3d })) }; ar.group.add(ar.head); s.add(ar.group); ar.group.visible = false; arrows.push(ar); }
      var rg = G.rg = { g: new T.Group(), C: [], Cb: [], S: [], Sb: [], bars: [], ch: [] }; s.add(rg.g);
      for (i = 0; i < 6; i++) { var c = atomM(T, 0x56606b, 0.5); rg.g.add(c); rg.C.push(c); var b = cylM(T, 0xbfc7d1, 0.1); rg.g.add(b); rg.Cb.push(b); var sb = cylM(T, 0xbfc7d1, 0.09); rg.g.add(sb); rg.Sb.push(sb); var sp = atomM(T, 0xf2f2f2, 0.35); rg.g.add(sp); rg.S.push(sp); }
      rg.E = atomM(T, 0x4f7cff, 0.8); rg.Eb = cylM(T, 0xe6c229, 0.1); rg.Hl = atomM(T, 0xf2f2f2, 0.36); rg.Hb = cylM(T, 0xbfc7d1, 0.08); rg.Bs = atomM(T, 0x20c997, 0.7); [rg.E, rg.Eb, rg.Hl, rg.Hb, rg.Bs].forEach(function (m) { rg.g.add(m); });
      rg.tm = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.4, depthWrite: false }); rg.t1 = new T.Mesh(new T.TorusGeometry(1, 0.22, 14, 44), rg.tm); rg.t1.rotation.x = Math.PI / 2; rg.t2 = new T.Mesh(rg.t1.geometry, rg.tm); rg.t2.rotation.x = Math.PI / 2; rg.g.add(rg.t1); rg.g.add(rg.t2);
      for (i = 0; i < 3; i++) { var cs = new T.Mesh(new T.SphereGeometry(1, 18, 12), new T.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.45, depthWrite: false })); rg.g.add(cs); rg.ch.push(cs); }
      for (i = 0; i < 6; i++) { var bar = new T.Mesh(new T.BoxGeometry(0.55, 1, 0.55), new T.MeshStandardMaterial({ color: [0xffa94d, 0x4dabf7, 0x69db7c][[0, 1, 2, 1, 0][i - 1] != null ? 0 : 0], roughness: 0.4 })); rg.g.add(bar); rg.bars.push(bar); }
      rg.g.visible = false;
      labs.t = ctx.label('', 'bl-lead'); labs.a = ctx.label('', 'bl-d'); labs.nu = ctx.label('', 'bl-warn'); labs.e = ctx.label('', 'bl-lead'); labs.s = ctx.label('', 'bl-d'); labs.p = []; for (i = 0; i < 6; i++) labs.p.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var T = ctx.T, now = (G.now = (G.now || 0) + dt), si, pp;
      if (!ctx.P.manual) { si = f.i; pp = f.local; if (S._st !== si) { S._st = si; lessonState(si); } }
      else { if (S.mode === 'alq') { if (S.rg === 'Br2') { si = 5; pp = S.prog; } else { var q = Math.min(0.9999, S.prog) * 4; si = Math.floor(q); pp = q - si; if (S.prog >= 1) { si = 3; pp = 1; } } } else { var q2 = Math.min(0.9999, S.prog) * 4; si = 6 + Math.floor(q2); pp = q2 - Math.floor(q2); if (S.prog >= 1) { si = 9; pp = 1; } if (S.st4) { si = S.st4; pp = 0.5; } } if (S.cmpOn && S.mode === 'alq') si = 4; }
      G.si = si; var alq = S.mode === 'alq', orb = ctx.layer('orb'), aro = ctx.layer('arrows'), chg = ctx.layer('chg');
      [G.H, G.X, G.hxB, G.nu, G.bb1, G.bb2, G.bro].forEach(function (m) { m.visible = false; }); G.lobes.forEach(function (l) { l.visible = false; });
      labs.t.vis(false); labs.a.vis(false); labs.nu.vis(false); labs.e.vis(false); labs.s.vis(false); labs.p.forEach(function (l) { l.vis(false); }); arrows.forEach(function (a) { a.group.visible = false; });
      G.rg.g.visible = !alq; hideMols(); var A = AK[S.ak], rgd = RG[S.rg];
      if (alq) {
        var st = alqState(si, pp, now); G.st = st; var mg = molGroup(ctx, st.main), cx = 0.67 * GS;
        if (st.cmp && A.cm) { mg.visible = true; mg.position.x = -3.7; var m2 = molGroup(ctx, 'cm'); m2.visible = true; m2.position.x = 3.9; if (orb) { [0, 1].forEach(function (j) { var l = G.lobes[j]; l.visible = true; l.material = G.lobeMats.p; l.position.set(-3.7 + cx, (j ? -1 : 1) * 1.2, 0); l.scale.set(0.7 * GS, 0.95 * GS, 0.7 * GS); }); [2, 3].forEach(function (j) { var l = G.lobes[j]; l.visible = true; l.material = G.lobeMats.p; l.position.set(3.9 + cx, (j === 3 ? -1 : 1) * 1.2, 0); l.scale.set(0.7 * GS, 0.95 * GS, 0.7 * GS); }); }
          labs.t.pos(-3.7, 4.2, 0).set("carbocation " + CATN[A.tM] + " (more stable)", 'bl-lead').vis(true); labs.a.pos(3.9, 4.2, 0).set("carbocation " + CATN[A.tm] + " (less stable)", 'bl-warn').vis(true);
          labs.nu.pos(-3.7, -3.4, 0).set('Ea ≈ ' + CAT[A.tM] + ' kJ/mol', 'bl-d').vis(true); labs.e.pos(3.9, -3.4, 0).set('Ea ≈ ' + CAT[A.tm] + ' kJ/mol', 'bl-d').vis(true);
        } else {
          mg.visible = true; mg.position.x = 0;
          if (orb && st.lobe === 'pi') { [0, 1].forEach(function (j) { var l = G.lobes[j]; l.visible = true; l.material = G.lobeMats.pi; l.position.set(0, (j ? -1 : 1) * 0.62 * GS, 0); l.scale.set(1.15 * GS, 0.5 * GS, 0.75 * GS); }); }
          if (orb && st.lobe === 'p') { [0, 1].forEach(function (j) { var l = G.lobes[j]; l.visible = true; l.material = G.lobeMats.p; l.position.set(cx, (j ? -1 : 1) * 1.15 * GS * 0.95, 0); l.scale.set(0.62 * GS, 0.9 * GS, 0.62 * GS); }); }
          var nm = st.main === 'r' ? A.n : (st.main === 'cM' ? "carbocation " + CATN[A.tM] : (st.main === 'pM' ? PN[S.ak][xk()] : PN[S.ak].d)); if (S.rg === 'Br2' && st.bromonium) nm = "bromonium ion"; labs.t.pos(0, 4.1, 0).set(nm, 'bl-lead').vis(true);
          if (st.hx) { G.H.visible = true; G.X.visible = true; G.hxB.visible = true; G.H.position.copy(st.hx.H); G.X.position.copy(st.hx.X); G.X.material.color.setHex(rgd.col); G.X.scale.setScalar(S.rg === 'H2O' ? 0.7 : 0.95); bondTo(T, G.hxB, st.hx.H, st.hx.X); labs.a.pos(st.hx.X.x, st.hx.X.y + 1.2, st.hx.X.z).set(S.rg === 'Br2' ? 'Br–Br' : S.rg, 'bl-d').vis(true); }
          if (st.bromonium) { G.bro.visible = true; G.bb1.visible = true; G.bb2.visible = true; G.bro.position.copy(V(0, 1.95, 0)); G.bro.material.color.setHex(0xa0522d); bondTo(T, G.bb1, G.bro.position, V(-0.67, 0, 0)); bondTo(T, G.bb2, G.bro.position, V(0.67, 0, 0)); }
          if (st.nu) { G.nu.visible = true; G.nu.position.copy(st.nu); G.nu.material.color.setHex(rgd.col); G.nu.scale.setScalar(S.rg === 'H2O' ? 0.7 : 0.95); labs.nu.pos(st.nu.x, st.nu.y + 1.2, st.nu.z).set(rgd.ion, 'bl-warn').vis(true); }
        }
        st.arr.forEach(function (a, j) { if (a) setArrow(T, arrows[j], a.a, a.b, a.bl, aro); else arrows[j].group.visible = false; });
      } else {
        var rs = arState(si, pp, now), rg = G.rg, su = SU[rs.sub], el = EL[S.el], E = rs.E;
        G.rs = rs; if (!ctx.P.manual && si >= 10) S.su = rs.sub;
        for (var i = 0; i < 6; i++) { rg.C[i].position.copy(rpos(i, RC, 0)); bondTo(T, rg.Cb[i], rpos(i, RC, 0), rpos((i + 1) % 6, RC, 0)); var isS = i === 0, sp = isS ? su : SU.H, rad = isS ? RS : RH, spc = rpos(i, rad, 0); rg.S[i].position.copy(spc); rg.S[i].material.color.setHex(sp.c); rg.S[i].scale.setScalar(sp.r); rg.S[i].visible = true; rg.Sb[i].visible = true; bondTo(T, rg.Sb[i], rpos(i, RC, 0), spc);
          if (rs.E && i === S.pos && (si === 8 || si === 9)) { if (si === 8) { rg.S[i].position.copy(rs.Hl); bondTo(T, rg.Sb[i], rpos(i, RC, 0), rs.Hl); } else { rg.S[i].visible = false; rg.Sb[i].visible = false; } } if (rs.E && i === S.pos && si === 9) { } }
        rg.E.visible = !!E; rg.Eb.visible = !!E && rs.bond; if (E) { rg.E.position.copy(E); rg.E.material.color.setHex(el.c); rg.E.scale.setScalar(S.el === 'SO3' ? 0.9 : 0.8); if (rs.bond) bondTo(T, rg.Eb, rpos(S.pos, RC, 0), E); labs.e.pos(E.x, E.y + 1.2, E.z).set(el.t, 'bl-lead').vis(true); }
        rg.Hl.visible = false; rg.Hb.visible = false; rg.Bs.visible = false; if (si === 9) { rg.Hl.visible = true; rg.Hl.position.copy(rs.Hl); bondTo(T, rg.Hb, rpos(S.pos, RC, 0), rs.Hl); rg.Hb.visible = pp < 0.55; rg.Bs.visible = true; rg.Bs.position.copy(rs.base); labs.nu.pos(rs.base.x, rs.base.y + 1.1, rs.base.z).set('B: (HSO₄⁻)', 'bl-warn').vis(true); }
        rg.tm.color.setHex(su.col); var kk = rs.torus * (su.rate > 1 ? 1.15 : (su.rate < 1 ? 0.78 : 1)); rg.t1.visible = rg.t2.visible = orb && kk > 0.02 && si !== 10 || (orb && si === 10); var sc = RC * 0.9 * Math.max(0.02, kk); rg.t1.scale.set(sc, sc, sc * 1); rg.t2.scale.set(sc, sc, sc); rg.t1.position.y = 0.95; rg.t2.position.y = -0.95; rg.t1.scale.z = rg.t2.scale.z = 1.6 * Math.max(0.02, kk); if (si === 8) { rg.t1.visible = rg.t2.visible = false; }
        var cs = [(S.pos + 1) % 6, (S.pos + 5) % 6, (S.pos + 3) % 6]; rg.ch.forEach(function (c, j) { c.visible = rs.charges && chg; var pulse = 1 + 0.12 * Math.sin(now * 4 + j); c.position.copy(rpos(cs[j], RC, 0)); c.scale.setScalar(0.85 * pulse); if (c.visible) labs.p[j].pos(rpos(cs[j], RC + 0.1, 0).x, 1.3, rpos(cs[j], RC, 0).z).set('+', 'bl-warn').vis(true); });
        // barras
        rg.bars.forEach(function (b) { b.visible = false; }); if (rs.bars && su.pct) { var vals = [su.pct[0] / 2, su.pct[1] / 2, su.pct[2], su.pct[1] / 2, su.pct[0] / 2], idx = [1, 2, 3, 4, 5], cols = [0xffa94d, 0x4dabf7, 0x69db7c, 0x4dabf7, 0xffa94d]; for (var j = 0; j < 5; j++) { var b = rg.bars[j], h = Math.max(0.02, vals[j] / 100 * 8); b.visible = vals[j] > 0; b.scale.set(1, h, 1); b.position.copy(rpos(idx[j], RC + 0.0, h / 2 + 0.7)).setY(h / 2 + 0.7); b.position.copy(rpos(idx[j], RC + 0.9, 0)); b.position.y = h / 2 + 0.6; b.material.color.setHex(cols[j]); } [[1, "ortho", su.pct[0]], [3, 'para', su.pct[2]], [2, 'meta', su.pct[1]]].forEach(function (t, j) { var pp3 = rpos(t[0], RC + 0.9, 0); var hh = Math.max(0.02, (t[0] === 3 ? su.pct[2] : (t[0] === 1 ? su.pct[0] / 2 : su.pct[1] / 2)) / 100 * 8); labs.p[3 + j].pos(pp3.x, hh + 1.5, pp3.z).set(t[1] + ' ' + t[2] + ' %', 'bl-lead').vis(true); }); }
        labs.t.pos(0, 4.2, 0).set(rs.txt, 'bl-lead').vis(true); labs.s.pos(rpos(0, RS, 0).x, 1.4, 0).set(su.t === 'H' ? '' : su.t, 'bl-d').vis(su.t !== 'H');
        rs.arr.forEach(function (a, j) { if (a) setArrow(T, arrows[j], a.a, a.b, a.bl, aro); else arrows[j].group.visible = false; });
      }
    },
    onStage: function (i, ctx) { ctx.view(i >= 6 ? 'ar' : 'libre'); },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () {
      if (S.mode === 'alq') { var A = AK[S.ak], x = xk(); return { eq: { chip: 'AEl', name: A.n + ' + ' + RG[S.rg].n, body: "<div class=\"eqline\"><small>Major product</small>" + (S.rg === 'Br2' ? PN[S.ak].d : PN[S.ak][x]) + "</div><div class=\"eqline\"><small>Intermediate</small>" + (S.rg === 'Br2' ? "bromonium ion" : "carbocation " + CATN[A.tM]) + "</div><div class=\"eqline\"><small>Slow step</small>" + (S.rg === 'Br2' ? "bromonium formation" : "attack of the π bond on H⁺") + '</div>' }, legend: [{ label: 'π', color: '#4dabf7', text: "nucleophilic π cloud" }, { label: "empty p", color: '#ff9a3d', text: "orbital of C⁺" }, { label: "Arrow", color: '#ff7a3d', text: "electron movement" }] }; }
      var su = SU[S.su], el = EL[S.el]; return { eq: { chip: 'SEAr', name: su.n + ' + ' + el.n, body: "<div class=\"eqline\"><small>Substituent</small>" + su.t + ' · ' + su.ty + "</div><div class=\"eqline\"><small>Electrophile</small>" + el.t + ' (' + el.cond + ")</div><div class=\"eqline\"><small>Relative reactivity</small>" + MSim.sci(su.rate, 2) + " × benzene</div>" }, legend: [{ label: "π cloud", color: '#' + ('000000' + su.col.toString(16)).slice(-6), text: "red: enriched · blue: depleted" }, { label: '+', color: '#ff4d4d', text: "charge in the σ complex" }, { label: "Bars", color: '#ffa94d', text: "o / m / p distribution" }] };
    },
    measures: function () { if (S.mode === 'alq') { var A = AK[S.ak]; return [["Alkene", A.n], ["Reagent", RG[S.rg].n], ["Mechanism", S.rg === 'Br2' ? "bromonium, anti addition" : "carbocation, Markovnikov"], ["Major product", S.rg === 'Br2' ? PN[S.ak].d : PN[S.ak][xk()]], ["Minor product", S.rg === 'Br2' || !PN[S.ak].m[xk()] ? '—' : PN[S.ak].m[xk()]], ["Carbocation", S.rg === 'Br2' ? '—' : CATN[A.tM] + (A.cm ? ' (vs ' + CATN[A.tm] + ')' : '')]]; }
      var su = SU[S.su], el = EL[S.el]; return [["Substrate", su.n], ["Reaction", el.n], ["Electrophile", el.t], ["Substituent effect", su.ty], ["Relative rate", MSim.sci(su.rate, 2) + " × benzene"], ["o / m / p (nitration)", su.pct ? su.pct.join(' / ') + ' %' : '—'], ["Position attacked", ['', "ortho", 'meta', 'para'][S.pos]]]; },
    ideas: ["Alkene: nucleophile; <b>electrophilic addition</b> with a carbocation intermediate.", "<b>Markovnikov</b>: the H goes to the C with more H atoms; most stable carbocation (3° &gt; 2° &gt; 1°).", "Br₂: <b>bromonium ion</b> and <b>anti</b> addition.", "Benzene: <b>SEAr</b> (substitution) to preserve aromaticity; σ complex.", "Donors: activate and direct <b>o/p</b>; withdrawers: deactivate and direct <b>meta</b> (except halogens)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction"); el.appendChild(c);
      ui.mode = kit.ui.options({ label: "Type", cols: 2, value: S.mode, options: [{ v: 'alq', label: "Addition to alkenes", sub: "electrophilic" }, { v: 'ar', label: 'SEAr', sub: "benzene" }], onChange: function (v) { ctx.goManual(); S.mode = v; S.prog = 0; S.cmpOn = false; S.st4 = 0; ctx.view('libre'); } }); c.appendChild(ui.mode);
      ui.ak = kit.ui.options({ label: "Alkene", cols: 3, value: S.ak, options: Object.keys(AK).map(function (k) { return { v: k, label: AK[k].n }; }), onChange: function (v) { ctx.goManual(); S.ak = v; S.mode = 'alq'; S.prog = 0; ui.mode.set('alq'); } }); c.appendChild(ui.ak);
      ui.rg = kit.ui.options({ label: "Reagent", cols: 4, value: S.rg, options: Object.keys(RG).map(function (k) { return { v: k, label: RG[k].n }; }), onChange: function (v) { ctx.goManual(); S.rg = v; S.mode = 'alq'; S.prog = 0; ui.mode.set('alq'); } }); c.appendChild(ui.rg);
      ui.su = kit.ui.options({ label: "Ring substituent", cols: 5, value: S.su, options: Object.keys(SU).map(function (k) { return { v: k, label: SU[k].t, sub: SU[k].n }; }), onChange: function (v) { ctx.goManual(); S.su = v; S.mode = 'ar'; S.prog = 0; ui.mode.set('ar'); } }); c.appendChild(ui.su);
      ui.el = kit.ui.options({ label: "Electrophile", cols: 4, value: S.el, options: Object.keys(EL).map(function (k) { return { v: k, label: EL[k].t, sub: EL[k].n.split(' ')[0] }; }), onChange: function (v) { ctx.goManual(); S.el = v; S.mode = 'ar'; ui.mode.set('ar'); } }); c.appendChild(ui.el);
      ui.pos = kit.ui.options({ label: "Position attacked", cols: 3, value: String(S.pos), options: [{ v: '1', label: "ortho" }, { v: '2', label: 'meta' }, { v: '3', label: 'para' }], onChange: function (v) { ctx.goManual(); S.pos = +v; S.mode = 'ar'; ui.mode.set('ar'); } }); c.appendChild(ui.pos);
      ui.prog = kit.ui.slider({ label: "Reaction progress", min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.prog = v / 100; S.cmpOn = false; } });
      ui.T = kit.ui.slider({ label: 'T', min: 250, max: 400, step: 1, value: S.T, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = +v; } });
      c.appendChild(kit.ui.sliders([ui.prog, ui.T]));
      c.appendChild(ctx.btnRow([{ t: "Animate", primary: true, fn: function () { ctx.goManual(); S.anim = true; S.prog = 0; ui.prog.set(0); } }, { t: "Compare carbocations", fn: function () { ctx.goManual(); S.mode = 'alq'; S.cmpOn = !S.cmpOn; ui.mode.set('alq'); } }, { t: "Back to the lesson", fn: function () { S.cmpOn = false; ctx.toLesson(); } }]));
      ui.refresh = function () { };
      var _f = def.frame; def.frame = function (cx2, f, dt) { if (S.anim && cx2.P.manual) { S.prog = Math.min(1, S.prog + dt / 8); ui.prog.set(S.prog * 100); if (S.prog >= 1) S.anim = false; } _f(cx2, f, dt); };
    },
    graphs: [
      { title: "Reaction energy profile", h: 260, note: "Qualitative sketch. Addition: two steps, the first (carbocation formation) is the slowest; the path through the more stable carbocation (blue) has the lower barrier. SEAr: benzene (gray) is compared with the chosen substrate and position.", draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 14, B = 26, pw = w - L - Rr, ph = h - Tp - B, curves = [];
        function interp(pts) { return function (x) { var n = pts.length - 1, t = x * n, i = Math.min(n - 1, Math.floor(t)), u = t - i, s = u * u * (3 - 2 * u); return pts[i] + (pts[i + 1] - pts[i]) * s + (i % 2 === 0 ? 0 : 0); }; }
        if (S.mode === 'alq') { var A = AK[S.ak], p0 = -45; if (S.rg === 'Br2') curves.push({ pts: [0, 70, 55, 62, -90], col: '#4dabf7', lab: "via bromonium" }); else { var EM = CAT[A.tM]; curves.push({ pts: [0, EM + 12, EM, EM + 8, p0], col: '#4dabf7', lab: "via " + CATN[A.tM] + " (major)" }); if (A.cm) curves.push({ pts: [0, CAT[A.tm] + 12, CAT[A.tm], CAT[A.tm] + 8, p0], col: '#ff8787', lab: "via " + CATN[A.tm], dash: true }); } }
        else { var su = SU[S.su], o = su.off[S.pos - 1] || 0; curves.push({ pts: [0, 90, 60, 66, -20], col: '#adb5bd', lab: "benzene", dash: true }); curves.push({ pts: [0, 90 + o, 60 + o * 0.8, 66 + o * 0.8, -20], col: '#f06595', lab: su.n + " · attack " + ['', "ortho", 'meta', 'para'][S.pos] }); }
        var mx = 0, mn = 0; curves.forEach(function (cv) { cv.pts.forEach(function (v) { mx = Math.max(mx, v); mn = Math.min(mn, v); }); }); mx += 12; mn -= 12; var sx = function (x) { return L + pw * x; }, sy = function (v) { return Tp + ph - ph * (v - mn) / (mx - mn); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var v = mn + (mx - mn) * i / 4, y = sy(v); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(v, 0), L - 4, y + 3); } cx.textAlign = 'center'; cx.fillText("reaction coordinate  ·  y axis: E (kJ/mol)", L + pw / 2, h - 3);
        curves.forEach(function (cv, k) { var f = interp(cv.pts); cx.strokeStyle = cv.col; cx.lineWidth = 2.6; cx.setLineDash(cv.dash ? [6, 4] : []); cx.beginPath(); for (var j = 0; j <= 120; j++) { var x = j / 120, y = sy(f(x)); if (j === 0) cx.moveTo(sx(x), y); else cx.lineTo(sx(x), y); } cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; cx.fillStyle = cv.col; cx.textAlign = 'left'; cx.fillText(cv.lab, L + 8, Tp + 12 + k * 14); }); } },
      { title: "Carbocation stability", h: 190, note: "Gas-phase hydride affinity (kJ/mol): the lower, the more stable the cation (hyperconjugation and inductive effects).", draw: function (cx, w, h, c) {
        var ks = ['metilo', 'primario', 'secundario', 'terciario'], cur = S.mode === 'alq' ? CATN[AK[S.ak].tM] : '', ph = (h - 24) / 4, sc = (w - 150) / 450; cx.font = '11px system-ui';
        ks.forEach(function (k, i) { var y = 8 + i * ph, v = HIA[k]; cx.fillStyle = k === cur ? '#f06595' : '#9aa7b4'; cx.fillRect(86, y, (v - 800) * sc, ph - 8); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(k, 80, y + ph / 2); cx.textAlign = 'left'; cx.fillText(v + '', 90 + (v - 800) * sc, y + ph / 2); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText("axis starts at 800 kJ/mol", w / 2, h - 4); } },
      { title: "SEAr: isomer distribution (nitration)", h: 190, note: "Typical experimental values (% ortho / meta / para).", draw: function (cx, w, h, c) {
        var su = SU[S.su], L = 30, ph = h - 40; cx.font = '11px system-ui'; if (!su.pct) { cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText("Benzene has no isomers: all positions are equivalent.", w / 2, h / 2); return; }
        var names = ["ortho", 'meta', 'para'], cols = ['#ffa94d', '#4dabf7', '#69db7c']; names.forEach(function (n, i) { var bw = (w - 2 * L) / 3 - 14, x = L + i * ((w - 2 * L) / 3) + 7, bh = ph * su.pct[i] / 100; cx.fillStyle = cols[i]; cx.fillRect(x, 12 + ph - bh, bw, bh); cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText(su.pct[i] + ' %', x + bw / 2, 8 + ph - bh); cx.fillText(n, x + bw / 2, h - 10); }); } },
      { title: "Relative reactivity versus benzene", h: 190, note: "log₁₀ of the relative rate of nitration (benzene = 0). Phenol: estimated order of magnitude.", draw: function (cx, w, h, c) {
        var ks = ['OH', 'CH3', 'H', 'Cl', 'NO2'], ph = (h - 24) / ks.length, L = 120, sc = (w - L - 30) / 12, x0 = L + 8 * sc; cx.font = '11px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, 4); cx.lineTo(x0, h - 20); cx.stroke();
        ks.forEach(function (k, i) { var v = Math.log10(SU[k].rate), y = 6 + i * ph; cx.fillStyle = k === S.su ? '#f06595' : '#9aa7b4'; cx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc) + 1, ph - 7); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(SU[k].n, L - 6, y + ph / 2 + 1); cx.textAlign = v < 0 ? 'left' : 'right'; cx.fillText(fmt(v, 1), v < 0 ? x0 + 4 : x0 - 4, y + ph / 2 + 1); }); cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText("log₁₀ k/k(benzene)", w / 2, h - 5); } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (S.mode === 'alq') { var A = AK[S.ak], x = xk(); if (S.rg === 'Br2') return "<div class=\"calc-step\">Addition of Br₂ to " + A.n + '</div><table class="calc-table">' + row("Intermediate", "bromonium ion (cyclic)") + row("Stereochemistry", "anti addition (opposite face)") + row("Product", '<b>' + PN[S.ak].d + '</b>') + '</table>';
        var dd = A.cm ? CAT[A.tm] - CAT[A.tM] : 0, ratio = A.cm ? Math.exp(dd * 1000 / (R * S.T)) : Infinity;
        return "<div class=\"calc-step\">1 · Reaction</div><table class=\"calc-table\">" + row("Alkene + HX", A.n + ' + ' + S.rg) + row("Most stable carbocation", CATN[A.tM] + ' (Ea ≈ ' + CAT[A.tM] + ' kJ/mol)') + (A.cm ? row("Alternative carbocation", CATN[A.tm] + ' (Ea ≈ ' + CAT[A.tm] + ' kJ/mol)') : '') + "</table><div class=\"calc-step\">2 · Regioselectivity at " + S.T + ' K</div><table class="calc-table">' + (A.cm ? row('ΔΔE‡', dd + ' kJ/mol') + row("Ratio k₁/k₂ = e^(ΔΔE‡/RT)", '<b>' + MSim.sci(ratio, 2) + '</b>') + row("Major", '<b>' + PN[S.ak][x] + '</b> (' + fmt(100 * ratio / (1 + ratio), 4) + ' %)') + row("Minor", PN[S.ak].m[x]) : row("Regioselectivity", "symmetric alkene (or ethene): a single addition product") + row("Product", '<b>' + PN[S.ak][x] + '</b>')) + "</table><p class=\"muted small\">The energies are schematic (carbocations in solution); they serve to reason about the trend, not for quantitative predictions.</p>"; }
      var su = SU[S.su], el = EL[S.el]; return "<div class=\"calc-step\">1 · Electrophile</div><table class=\"calc-table\">" + row("Reaction", el.n + ' (' + el.cond + ')') + row("Generation", el.gen) + row("Product on benzene", el.pn + "benzene") + "</table><div class=\"calc-step\">2 · Substituent " + su.t + '</div><table class="calc-table">' + row("Effect", su.ty) + row("Relative rate", MSim.sci(su.rate, 2) + " × benzene") + row("o / m / p (nitration)", su.pct ? su.pct.join(' / ') + ' %' : '—') + row("Stabilizes the + charge", su.off[0] < 0 ? "yes (o, p): the σ complex has a form with + on the substituent's C" : (su.t === 'H' ? '—' : "no: it destabilizes o/p; that is why it enters meta")) + '</table>';
    },
    quiz: [
      { q: "Why does an alkene react with electrophiles?", options: ["It has an electron-rich π cloud", "It has a lone pair", "It is a Lewis acid", "It has a positive charge"], answer: 0, why: "The π bond, weaker and more exposed than the σ bond, acts as a nucleophile." },
      { q: "In the addition of HBr to propene, the H bonds to the…", options: ["carbon with more hydrogens (CH₂)", "central carbon", "bromine", 'metilo'], answer: 0, why: "Markovnikov's rule: the H goes to the carbon with more H atoms; the + charge stays on the 2° carbon." },
      { q: "The major product of HBr + propene is…", options: ['2-bromopropano', '1-bromopropano', "1,2-dibromopropane", "propane"], answer: 0, why: "It goes through the secondary carbocation, which is more stable." },
      { q: "Order the stability of carbocations.", options: ["tertiary > secondary > primary > methyl", "methyl > primary > secondary > tertiary", "primary > secondary > tertiary", "all equal"], answer: 0, why: "More alkyl groups: more hyperconjugation and donor inductive effect." },
      { q: "The addition of Br₂ to an alkene occurs…", options: ["anti, via a bromonium ion", "syn, via a free carbocation", "by radicals only", "without an intermediate"], answer: 0, why: "Br⁻ attacks the bromonium from the opposite face (SN2)." },
      { q: "Benzene reacts by substitution and not by addition because…", options: ["that way it preserves aromaticity", "it has a leaving group", "it is an alkene", "it has no H"], answer: 0, why: "Addition would destroy the 6 delocalized π electrons (≈ 150 kJ/mol of resonance)." },
      { q: "The –CH₃ in toluene is a group that is…", options: ["activating and ortho/para directing", "deactivating and meta", "activating and meta", "deactivating and ortho/para"], answer: 0, why: "It donates electron density (inductive and hyperconjugation) and stabilizes the σ complexes of o/p attack." },
      { q: "What does –NO₂ direct to in an SEAr?", options: ["Meta (and deactivates the ring)", "Ortho/para (and activates)", "Only ortho", "Only para"], answer: 0, why: "Strong withdrawer: it destabilizes the + charge on the C attached to it, which is present in the o/p complexes." }
    ],
    help: { intro: "Follow the lesson or choose the alkene/reagent (or substituent and electrophile) in “Lab” and move the reaction progress.", items: [["Arrows", "the curved arrows show the movement of electron pairs."], ["Clouds", "blue: π; orange: empty p orbital; in SEAr the color indicates the substituent effect."], ["Graphs", "energy profiles, cation stability and o/m/p distribution."]] }
  };
  MSim.create(def);
})();
