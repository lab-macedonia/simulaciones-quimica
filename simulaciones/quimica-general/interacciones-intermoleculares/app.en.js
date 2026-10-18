/* Interacciones intermoleculares — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

(function () {
// <ENGINE>
const KB=0.0083144626, KE=1389.35458, PN=16.6054, D2EA=0.20819;
// a = polarizabilidad (volumen, Å³); hbd = donor heavy-atom; hba = aceptor
const AT={
 H :{sym:'H',  col:0xf1f5f9, rb:0.30, rc:1.10, s:0,    e:0,     m:1.008, a:0},
 Ha:{sym:'H',  col:0xcbd5e1, rb:0.28, rc:1.20, s:2.42, e:0.126, m:1.008, a:0},
 O :{sym:'O',  col:0xef4444, rb:0.55, rc:1.52, s:3.1507,e:0.6364,m:15.999,a:1.45,hbd:1,hba:1},
 Oc:{sym:'O',  col:0xf87171, rb:0.50, rc:1.50, s:2.96, e:0.879, m:15.999,a:0.9, hba:1},
 Oh:{sym:'O',  col:0xdc2626, rb:0.55, rc:1.52, s:3.07, e:0.711, m:15.999,a:0.9, hbd:1,hba:1},
 Ox:{sym:'O',  col:0xef4444, rb:0.50, rc:1.50, s:3.05, e:0.657, m:15.999,a:0.95},
 F :{sym:'F',  col:0x86efac, rb:0.50, rc:1.47, s:2.95, e:0.45,  m:18.998,a:0.51,hbd:1,hba:1},
 Fc:{sym:'F',  col:0x86efac, rb:0.45, rc:1.45, s:2.95, e:0.30,  m:18.998,a:0.3},
 Cl:{sym:'Cl', col:0x22c55e, rb:0.75, rc:1.75, s:3.50, e:1.10,  m:35.45, a:2.6, hbd:1},
 Clm:{sym:'Cl⁻',col:0x4ade80,rb:1.15, rc:2.20, s:4.40, e:0.42,  m:35.45, a:3.0, hba:1},
 C :{sym:'C',  col:0x64748b, rb:0.55, rc:1.70, s:3.40, e:0.36,  m:12.011,a:0.9},
 Cx:{sym:'C',  col:0x64748b, rb:0.50, rc:1.65, s:2.80, e:0.2245,m:12.011,a:1.1},
 Cb:{sym:'C',  col:0x64748b, rb:0.50, rc:1.75, s:3.55, e:0.293, m:12.011,a:1.72},
 Cf:{sym:'C',  col:0x64748b, rb:0.50, rc:1.75, s:3.75, e:0.439, m:12.011,a:0.8},
 Me:{sym:'CH₃',col:0x94a3b8, rb:0.60, rc:1.90, s:3.75, e:0.866, m:15.035,a:1.5},
 N :{sym:'N',  col:0x3b82f6, rb:0.55, rc:1.60, s:3.25, e:0.711, m:14.007,a:2.26,hbd:1,hba:1},
 Nn:{sym:'N',  col:0x3b82f6, rb:0.50, rc:1.65, s:3.31, e:0.299, m:14.007,a:0.87},
 Z :{sym:'',   col:0x60a5fa, rb:0.16, rc:0.45, s:0,    e:0,     m:0,     a:0},
 I :{sym:'I',  col:0xa855f7, rb:0.80, rc:2.00, s:3.75, e:1.20,  m:126.9, a:4.5},
 Ep:{sym:'σ',  col:0x38bdf8, rb:0.22, rc:0.60, s:0,    e:0,     m:0,     a:0},
 Ne:{sym:'Ne', col:0xfb7185, rb:0.32, rc:1.375,s:2.75, e:0.296, m:20.18, a:0.395},
 Ar:{sym:'Ar', col:0x60a5fa, rb:0.32, rc:1.70, s:3.405,e:0.996, m:39.95, a:1.64},
 Kr:{sym:'Kr', col:0x2dd4bf, rb:0.32, rc:1.80, s:3.60, e:1.422, m:83.80, a:2.48},
 Xe:{sym:'Xe', col:0xa78bfa, rb:0.32, rc:2.05, s:4.10, e:1.837, m:131.29,a:4.04},
 CH4:{sym:'CH₄',col:0x94a3b8,rb:0.55, rc:1.865,s:3.73, e:1.231, m:16.04, a:2.59},
 Na:{sym:'Na⁺',col:0xc084fc, rb:0.62, rc:1.18, s:2.35, e:0.544, m:22.99, a:0.15},
 Mg:{sym:'Mg²⁺',col:0xfb923c,rb:0.50, rc:0.95, s:1.90, e:0.35,  m:24.31, a:0.07}
};
function mol(name,atoms,bonds,opts){
 opts=opts||{};
 let M=0,cx=0,cy=0,cz=0,qn=0;
 atoms.forEach(a=>{const m=AT[a[0]].m;M+=m;cx+=m*a[2];cy+=m*a[3];cz+=m*a[4];qn+=a[1];});
 cx/=M;cy/=M;cz/=M;
 const at=atoms.map((a,i)=>({t:a[0],q:a[1],x:a[2]-cx,y:a[3]-cy,z:a[4]-cz,s:AT[a[0]].s,e:AT[a[0]].e,al:(a[5]!==undefined?a[5]:AT[a[0]].a)||0,i}));
 let dx=0,dy=0,dz=0;at.forEach(a=>{dx+=a.q*a.x;dy+=a.q*a.y;dz+=a.q*a.z;});
 const ion=Math.abs(qn)>1e-6;
 const mu=ion?0:Math.sqrt(dx*dx+dy*dy+dz*dz)/D2EA;
 const bonded={};(bonds||[]).forEach(([i,j])=>{bonded[i]=j;bonded[j]=i;});
 let alpha=0;at.forEach(a=>{alpha+=a.al;});
 return {name,atoms:at,bonds:bonds||[],mu,dip:[dx,dy,dz],ion,q:qn,bonded,alpha,pi:!!opts.pi,
  dispersive:(at.length===1&&Math.abs(at[0].q)<1e-9)};
}
function benzene(){
 const at=[],bd=[];
 for(let k=0;k<6;k++){const t=k*Math.PI/3;at.push(['Cb',-0.115,0,1.40*Math.cos(t),1.40*Math.sin(t)]);}
 for(let k=0;k<6;k++){const t=k*Math.PI/3;at.push(['Ha',0.115,0,2.48*Math.cos(t),2.48*Math.sin(t)]);}
 for(let k=0;k<6;k++){bd.push([k,(k+1)%6]);bd.push([k,6+k]);}
 return mol('C₆H₆',at,bd,{pi:true});
}
function nh3(){
 const ct=0.3764,st=0.9264,d=1.012,at=[['N',-1.02,0,0,0]],bd=[];
 for(let k=0;k<3;k++){const g=2*Math.PI*k/3;at.push(['H',0.34,-d*ct,d*st*Math.cos(g),d*st*Math.sin(g)]);bd.push([0,k+1]);}
 return mol('NH₃',at,bd);
}
function cf3i(qC,qF,qI,qE,dE){
 const th=111*Math.PI/180,dCF=1.33,x=dCF*Math.cos(th),rho=dCF*Math.sin(th),xI=2.14;
 const at=[['Cf',qC,0,0,0,0.8],['I',qI,xI,0,0],['Ep',qE,xI+dE,0,0]],bd=[[0,1]];
 for(let k=0;k<3;k++){const g=2*Math.PI*k/3;at.push(['Fc',qF,x,rho*Math.cos(g),rho*Math.sin(g)]);bd.push([0,k+3]);}
 return mol('CF₃I',at,bd);
}
const MOLS={
 Ne:mol('Ne',[['Ne',0,0,0,0]]),
 Ar:mol('Ar',[['Ar',0,0,0,0]]),
 Kr:mol('Kr',[['Kr',0,0,0,0]]),
 Xe:mol('Xe',[['Xe',0,0,0,0]]),
 CH4:mol('CH₄',[['CH4',0,0,0,0]]),
 H2O:mol('H₂O',[['O',-0.834,0,0,0],['H',0.417,-0.5866,0.7565,0],['H',0.417,-0.5866,-0.7565,0]],[[0,1],[0,2]]),
 HCl:mol('HCl',[['Cl',-0.177,0,0,0],['H',0.177,-1.27,0,0]],[[0,1]]),
 HF:mol('HF',[['F',-0.413,0,0,0],['H',0.413,-0.917,0,0]],[[0,1]]),
 CO:mol('CO',[['C',-0.0203,0,0,0,0.9],['O',0.0203,-1.128,0,0,1.05]],[[0,1]]),
 H2CO:mol('H₂CO',[['Cf',0.15,0,0,0],['Oc',-0.35,1.21,0,0],['Ha',0.10,-0.576,0.925,0],['Ha',0.10,-0.576,-0.925,0]],[[0,1],[0,2],[0,3]]),
 NH3:nh3(),
 MeOH:mol('CH₃OH',[['Oh',-0.700,0,0,0],['Me',0.265,1.43,0,0],['H',0.435,-0.2998,0.8963,0]],[[0,1],[0,2]]),
 HCOOH:mol('HCOOH',[['Cf',0.52,0,0,0],['Oc',-0.44,0.5617,1.0720,0],['Oh',-0.53,0.622,-1.187,0],['H',0.45,1.575,-1.008,0],['Ha',0.0,-1.09,0,0]],[[0,1],[0,2],[2,3],[0,4]]),
 CO2:mol('CO₂',[['Ox',-0.35,-1.16,0,0],['Cx',0.70,0,0,0],['Ox',-0.35,1.16,0,0]],[[0,1],[1,2]]),
 N2:mol('N₂',[['Nn',-0.482,-0.55,0,0],['Z',0.964,0,0,0],['Nn',-0.482,0.55,0,0]],[[0,2]]),
 C6H6:benzene(),
 CF3I:cf3i(0.34,-0.10,-0.14,0.10,1.6),
 Na:mol('Na⁺',[['Na',1,0,0,0]]),
 Mg:mol('Mg²⁺',[['Mg',2,0,0,0]]),
 Cl:mol('Cl⁻',[['Clm',-1,0,0,0]])
};
function rotMat(phi,chi,th){
 th=th||0;const cp=Math.cos(phi),sp=Math.sin(phi),cc=Math.cos(chi),sc=Math.sin(chi),ct=Math.cos(th),st=Math.sin(th);
 return [cp*ct,-sp*cc+cp*st*sc,sp*sc+cp*st*cc, sp*ct,cp*cc+sp*st*sc,-cp*sc+sp*st*cc, -st,ct*sc,ct*cc]; // Rz(φ)·Ry(θ)·Rx(χ)
}
function placedR(M,cx,cy,R){
 return M.atoms.map(a=>({x:cx+R[0]*a.x+R[1]*a.y+R[2]*a.z,y:cy+R[3]*a.x+R[4]*a.y+R[5]*a.z,z:R[6]*a.x+R[7]*a.y+R[8]*a.z,q:a.q,s:a.s,e:a.e,al:a.al,t:a.t}));
}
function placed(M,cx,phi,chi,th,cy){return placedR(M,cx,cy||0,rotMat(phi,chi,th));}
function sites(A,B,S){return [placed(A,-S.r/2,S.pa,S.ca,0,0),placed(B,S.r/2,S.pb,S.cb,S.tb||0,S.dy||0)];}
// campo eléctrico (e/Å²) en p debido a las cargas Q (con suavizado de 0,6 Å)
function fieldAt(p,Q){
 let ex=0,ey=0,ez=0;
 for(let j=0;j<Q.length;j++){const q=Q[j];if(q.q===0)continue;
  const dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z,d2=dx*dx+dy*dy+dz*dz+1.0,k=q.q/(d2*Math.sqrt(d2));ex+=k*dx;ey+=k*dy;ez+=k*dz;}
 return [ex,ey,ez];
}
function indHalf(P,Q){
 let u=0;
 for(let i=0;i<P.length;i++){const p=P[i];if(!(p.al>0))continue;const E=fieldAt(p,Q);u-=0.5*KE*p.al*(E[0]*E[0]+E[1]*E[1]+E[2]*E[2]);}
 return u;
}
const indU=(a,b)=>indHalf(a,b)+indHalf(b,a);
// dipolos inducidos (e·Å) en los sitios polarizables, para dibujarlos
function inducedDipoles(a,b){
 const out=[];
 [[a,b],[b,a]].forEach(([P,Q])=>{P.forEach(p=>{if(!(p.al>0))return;const E=fieldAt(p,Q);out.push({x:p.x,y:p.y,z:p.z,mx:p.al*E[0],my:p.al*E[1],mz:p.al*E[2]});});});
 return out;
}
function energyOnly(a,b,ind){
 let u=0;
 for(let i=0;i<a.length;i++){const A=a[i];for(let j=0;j<b.length;j++){const B=b[j];
  const dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,r=Math.max(Math.sqrt(dx*dx+dy*dy+dz*dz),0.25);
  if(A.q!==0&&B.q!==0)u+=KE*A.q*B.q/r;
  const e=A.e*B.e;if(e>0){const s=0.5*(A.s+B.s),s6=Math.pow(s/r,6);u+=4*Math.sqrt(e)*(s6*s6-s6);}
 }}
 return ind?u+indU(a,b):u;
}
// S: {r,pa,ca,pb,cb,tb,dy,ind} (Å y radianes). Fuerza sobre B en kJ/mol/Å
function interact(A,B,S,wantF){
 const [a,b]=sites(A,B,S);
 let ec=0,elj=0,fx=0,fy=0,fz=0;
 for(let i=0;i<a.length;i++){for(let j=0;j<b.length;j++){
  const dx=b[j].x-a[i].x,dy=b[j].y-a[i].y,dz=b[j].z-a[i].z;
  const r=Math.max(Math.sqrt(dx*dx+dy*dy+dz*dz),0.25);
  const qq=KE*a[i].q*b[j].q;
  if(qq!==0){ec+=qq/r;const f=qq/(r*r*r);fx+=f*dx;fy+=f*dy;fz+=f*dz;}
  const e=Math.sqrt(a[i].e*b[j].e),s=0.5*(a[i].s+b[j].s);
  if(e>0&&s>0){const s6=Math.pow(s/r,6);elj+=4*e*(s6*s6-s6);const f=24*e*(2*s6*s6-s6)/(r*r);fx+=f*dx;fy+=f*dy;fz+=f*dz;}
 }}
 const ei=indU(a,b);
 if(S.ind&&wantF){
  const h=1e-3,sh=(dx,dy,dz)=>b.map(p=>({x:p.x+dx,y:p.y+dy,z:p.z+dz,q:p.q,al:p.al}));
  fx-=(indU(a,sh(h,0,0))-indU(a,sh(-h,0,0)))/(2*h);
  fy-=(indU(a,sh(0,h,0))-indU(a,sh(0,-h,0)))/(2*h);
  fz-=(indU(a,sh(0,0,h))-indU(a,sh(0,0,-h)))/(2*h);
 }
 return {ec,elj,ei,u:ec+elj+(S.ind?ei:0),fx,fy,fz,a,b};
}
function curve(A,B,S,lo,hi,n){
 const rs=[],ut=[],uc=[],ul=[],ui=[];
 for(let i=0;i<=n;i++){const r=lo+(hi-lo)*i/n;const R=interact(A,B,{r,pa:S.pa,ca:S.ca,pb:S.pb,cb:S.cb,tb:S.tb,dy:S.dy,ind:S.ind});rs.push(r);ut.push(R.u);uc.push(R.ec);ul.push(R.elj);ui.push(R.ei);}
 return {rs,ut,uc,ul,ui};
}
function minOf(c){let k=0;for(let i=1;i<c.ut.length;i++)if(c.ut[i]<c.ut[k])k=i;return {r:c.rs[k],u:c.ut[k],k};}
// ---- optimizador: p=[r,pa,ca,pb,cb,tb,dy], mask = parámetros libres
const Uof=(A,B,p,ind)=>interact(A,B,{r:p[0],pa:p[1],ca:p[2],pb:p[3],cb:p[4],tb:p[5],dy:p[6],ind}).u;
function optStep(A,B,o,lim){
 const p=o.p,h=1e-3,g=new Array(7).fill(0);let n2=0;
 for(let i=0;i<7;i++){if(!o.mask[i])continue;const a=p.slice(),b=p.slice();a[i]+=h;b[i]-=h;g[i]=(Uof(A,B,a,o.ind)-Uof(A,B,b,o.ind))/(2*h);n2+=g[i]*g[i];}
 const nrm=Math.sqrt(n2);
 if(nrm<1e-4){o.done=true;return;}
 const u0=Uof(A,B,p,o.ind);
 for(let k=0;k<10;k++){
  const q=p.map((v,i)=>v-o.s*g[i]/nrm);q[0]=Math.min(lim.rHi,Math.max(lim.rLo,q[0]));q[6]=Math.min(lim.dy,Math.max(-lim.dy,q[6]));
  if(Uof(A,B,q,o.ind)<u0-1e-9){for(let i=0;i<7;i++)p[i]=q[i];o.s*=1.3;return;}
  o.s*=0.5;
 }
 o.done=true;
}
function maskOf(pair){
 const m=[true,false,false,false,false,false,false];
 if(pair.orient){m[1]=m[2]=m[3]=m[4]=m[5]=true;}
 if(pair.offset)m[6]=true;
 return m;
}
function lcg(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
// búsqueda global con reinicios aleatorios
function bestOf(A,B,pair,nStart,seed,ind){
 const rng=lcg(seed||7),mask=maskOf(pair),lim={rLo:pair.rng[0],rHi:pair.rng[1],dy:3};
 let best=null;
 for(let k=0;k<nStart;k++){
  const p=[pair.rng[0]+(pair.rng[1]-pair.rng[0])*(0.15+0.5*rng()),(rng()*2-1)*Math.PI,(rng()*2-1)*Math.PI,(rng()*2-1)*Math.PI,(rng()*2-1)*Math.PI,(rng()-0.5)*Math.PI,pair.offset?(rng()*2-1)*2:0];
  if(!pair.orient){p[1]=p[2]=p[3]=p[4]=p[5]=0;}
  const o={p,s:0.25,done:false,mask,ind};
  for(let n=0;n<400&&!o.done;n++)optStep(A,B,o,lim);
  const u=Uof(A,B,o.p,ind);
  if(!best||u<best.u)best={u,p:o.p.slice()};
 }
 return best;
}
// ---- promedio térmico sobre todas las orientaciones (potencial de fuerza media)
function quatMat(x,y,z,w){return [1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w), 2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w), 2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)];}
function randRot(rng){
 const u1=rng(),u2=rng(),u3=rng(),s1=Math.sqrt(1-u1),s2=Math.sqrt(u1);
 return quatMat(s1*Math.sin(2*Math.PI*u2),s1*Math.cos(2*Math.PI*u2),s2*Math.sin(2*Math.PI*u3),s2*Math.cos(2*Math.PI*u3));
}
let _rotCache=null;
function rotSet(N){
 if(_rotCache&&_rotCache.N===N)return _rotCache;
 const rng=lcg(20240611),RA=[],RB=[];for(let k=0;k<N;k++){RA.push(randRot(rng));RB.push(randRot(rng));}
 return (_rotCache={N,RA,RB});
}
function pmf(A,B,T,rs,N,ind){
 const {RA,RB}=rotSet(N),kt=KB*T,out=[];
 for(let i=0;i<rs.length;i++){
  const r=rs[i];let sum=0;
  for(let k=0;k<N;k++){const u=energyOnly(placedR(A,-r/2,0,RA[k]),placedR(B,r/2,0,RB[k]),ind);sum+=Math.exp(Math.min(700,-u/kt));}
  out.push(sum>1e-300?-kt*Math.log(sum/N):kt*690);
 }
 return out;
}
// Keesom (punto-dipolo, promedio libre): −(2/3)(K μA μB)²/(kT r⁶), μ en D
function keesom(muA,muB,T,r){const k=KE*muA*muB*D2EA*D2EA;return -(2/3)*k*k/(KB*T*Math.pow(r,6));}
// puentes de H y enlaces de halógeno
function bonds(A,B,S){
 const pa=placed(A,-S.r/2,S.pa,S.ca,0,0),pb=placed(B,S.r/2,S.pb,S.cb,S.tb||0,S.dy||0);const out=[];
 function scan(MX,PX,MY,PY){
  MX.atoms.forEach((h,i)=>{
   const di=MX.bonded[i];if(di===undefined)return;const d=MX.atoms[di];
   if(h.t==='H'&&AT[d.t].hbd){
    PY.forEach((y,j)=>{if(!AT[y.t].hba)return;
     const H=PX[i],D=PX[di];const dist=Math.hypot(y.x-H.x,y.y-H.y,y.z-H.z);
     if(dist>2.7)return;
     const v1=[D.x-H.x,D.y-H.y,D.z-H.z],v2=[y.x-H.x,y.y-H.y,y.z-H.z];
     const cs=(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/(Math.hypot(...v1)*dist);
     const ang=Math.acos(Math.max(-1,Math.min(1,cs)))*180/Math.PI;
     if(ang>110)out.push({kind:'H',H,A:y,dist,ang,acc:y.t});
    });
   }else if(h.t==='I'){ // átomo de I unido a C
    PY.forEach(y=>{if(!AT[y.t].hba)return;
     const X=PX[i],C=PX[di];const dist=Math.hypot(y.x-X.x,y.y-X.y,y.z-X.z);
     if(dist>3.7)return;
     const v1=[C.x-X.x,C.y-X.y,C.z-X.z],v2=[y.x-X.x,y.y-X.y,y.z-X.z];
     const cs=(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/(Math.hypot(...v1)*dist);
     const ang=Math.acos(Math.max(-1,Math.min(1,cs)))*180/Math.PI;
     if(ang>150)out.push({kind:'X',H:X,A:y,dist,ang,acc:y.t});
    });
   }
  });
 }
 scan(A,pa,B,pb);scan(B,pb,A,pa);
 out.sort((p,q)=>p.dist-q.dist);return out;
}
// </ENGINE>

/* ===================== Pares de especies ===================== */
const PRE_POLAR=[
 {l:"Head-to-tail",pa:0,ca:0,pb:0,cb:0},
 {l:"Antiparallel, side by side",pa:90,ca:0,pb:-90,cb:0},
 {l:"Parallel, side by side",pa:90,ca:0,pb:90,cb:0},
 {l:"Head-to-head (δ−/δ−)",pa:0,ca:0,pb:180,cb:0},
 {l:"Tail-to-tail (δ+/δ+)",pa:180,ca:0,pb:0,cb:0}
];
const PRE_LIN=[ // moléculas lineales apolares con cuadrupolo
 {l:"End to end (linear)",pa:0,ca:0,pb:0,cb:0,r:5.2},
 {l:"T-shaped",pa:0,ca:0,pb:90,cb:0,r:4.1},
 {l:"Parallel, side by side",pa:90,ca:0,pb:90,cb:0,r:3.8},
 {l:"Parallel displaced",pa:90,ca:0,pb:90,cb:0,r:3.5,dy:1.2}
];
const FAM={
 london:{name:"London dispersion",col:'#34d399'},
 ionion:{name:'Ion–ion',col:'#fb923c'},
 iondip:{name:"Ion–dipole",col:'#fbbf24'},
 indip:{name:"Ion–induced dipole",col:'#f472b6'},
 dipdip:{name:"Dipole–dipole (Keesom)",col:'#60a5fa'},
 debye:{name:"Dipole–induced dipole (Debye)",col:'#a78bfa'},
 quad:{name:"Quadrupole and π",col:'#2dd4bf'},
 hb:{name:"Hydrogen bond",col:'#facc15'},
 xb:{name:"Halogen bond",col:'#e879f9'},
 hphob:{name:"Hydrophobic",col:'#94a3b8'}
};
function P(id,label,A,B,rng,r0,type,dep,o,text,ref){return Object.assign({id,label,A,B,rng,r0,type,dep,text,ref:ref||''},o);}
const GROUPS=[
 {fam:'london',name:"London dispersion (nonpolar)",items:[
  P('ne','Ne ··· Ne','Ne','Ne',[2.2,8],3.4,"London dispersion",'∝ 1/r⁶',{},
   "Spherical, neutral atoms: no charge or permanent dipole. There is only the attraction due to correlated instantaneous dipoles, balanced by Pauli repulsion at short range. Very shallow well.",
   "σ = 2.75 Å · ε/k<sub>B</sub> = 35.6 K · T<sub>b</sub> = 27.1 K"),
  P('ar','Ar ··· Ar','Ar','Ar',[2.8,9],4.2,"London dispersion",'∝ 1/r⁶',{},
   "Minimum at r<sub>m</sub> = 2<sup>1/6</sup>σ and depth ε. For r < σ repulsion dominates; for r > r<sub>m</sub> it decays as r⁻⁶, which is why the range is short.",
   "σ = 3.405 Å · ε/k<sub>B</sub> = 119.8 K · T<sub>b</sub> = 87.3 K · experimental Ar₂: r<sub>eq</sub> ≈ 3.76 Å, D<sub>e</sub> ≈ 1.2 kJ/mol"),
  P('kr','Kr ··· Kr','Kr','Kr',[3.0,9.5],4.4,"London dispersion",'∝ 1/r⁶',{},
   "Larger electron cloud ⇒ greater polarizability ⇒ stronger instantaneous dipoles and a deeper well than in Ar.",
   "σ = 3.60 Å · ε/k<sub>B</sub> = 171 K · T<sub>b</sub> = 119.9 K"),
  P('xe','Xe ··· Xe','Xe','Xe',[3.4,10],4.9,"London dispersion",'∝ 1/r⁶',{},
   "The most polarizable stable noble gas of the series: deeper well and higher boiling temperature. Compare with Ne using the selector.",
   "σ = 4.10 Å · ε/k<sub>B</sub> = 221 K · T<sub>b</sub> = 165.1 K"),
  P('ch4','CH₄ ··· CH₄','CH4','CH4',[3.0,10],4.6,"London dispersion",'∝ 1/r⁶',{},
   "Nonpolar tetrahedral molecule (united-atom model): μ = 0 by symmetry. Only dispersion; that is why methane is a gas at room temperature.",
   "σ = 3.73 Å · ε/k<sub>B</sub> = 148 K · T<sub>b</sub> = 111.7 K")
 ]},
 {fam:'ionion',name:'Ion–ion',items:[
  P('nacl','Na⁺ ··· Cl⁻','Na','Cl',[1.5,8],3.0,'Ion–ion','∝ 1/r',{},
   "Coulomb attraction between full charges (∝ 1/r): the one with the longest range and energy. Pauli repulsion (r⁻¹²) sets the equilibrium distance. In the crystal each ion is surrounded by six counterions.",
   "Illustrative parameters. Experimental, gaseous NaCl: r<sub>eq</sub> = 2.36 Å."),
  P('nana','Na⁺ ··· Na⁺','Na','Na',[1.5,8],3.5,"Ion–ion (like charges)",'∝ 1/r',{},
   "Two cations repel at any distance: the curve is always positive and decays slowly (1/r). To form an ionic solid, counterions are needed to offset this repulsion.",
   ''),
  P('mgcl','Mg²⁺ ··· Cl⁻','Mg','Cl',[1.2,8],3.0,"Ion–ion (double charge)",'∝ 1/r',{},
   "The energy is proportional to the product q₁q₂: with a divalent cation the attraction doubles relative to Na⁺···Cl⁻ and the well is much deeper (higher lattice energy of MgCl₂ than of NaCl).",
   "Illustrative parameters.")
 ]},
 {fam:'iondip',name:"Ion–dipole",items:[
  P('nah2o','Na⁺ ··· H₂O','Na','H2O',[1.5,8],3.0,"Ion–dipole",'∝ 1/r²',{orient:true,
   pre:[{l:"O toward the cation (attractive)",pa:0,ca:0,pb:180,cb:0},{l:'Perpendicular',pa:0,ca:0,pb:90,cb:0},{l:"H toward the cation (repulsive)",pa:0,ca:0,pb:0,cb:0}],def:{pa:0,ca:0,pb:180,cb:0}},
   "The negative end of the water dipole (the O) orients toward the cation. It is the basis of ion hydration and of the solubility of salts. Rotate molecule B and watch the energy change sign. Turn on “Induction” to see the contribution of the polarization of water (already included effectively in the TIP3P charges).",
   "Experimental (gas phase): Na⁺–OH₂ ≈ 100 kJ/mol."),
  P('mgh2o','Mg²⁺ ··· H₂O','Mg','H2O',[1.2,8],3.0,"Ion–dipole (double charge)",'∝ 1/r²',{orient:true,
   pre:[{l:"O toward the cation (attractive)",pa:0,ca:0,pb:180,cb:0},{l:"H toward the cation (repulsive)",pa:0,ca:0,pb:0,cb:0}],def:{pa:0,ca:0,pb:180,cb:0}},
   "With +2 charge and smaller radius, Mg²⁺ polarizes and orients water much more than Na⁺: that is why its hydration shell is so stable and its water exchange is slow.",
   "Experimental order of magnitude (gas): ≈ 300 kJ/mol. Illustrative ionic parameters."),
  P('clh2o','Cl⁻ ··· H₂O','Cl','H2O',[2.2,8],3.6,"Ion–dipole / H bond",'∝ 1/r²',{orient:true,
   pre:[{l:"One O–H toward the anion",pa:0,ca:0,pb:52.2,cb:0},{l:"Both H toward the anion",pa:0,ca:0,pb:0,cb:0},{l:"O toward the anion (repulsive)",pa:0,ca:0,pb:180,cb:0}],def:{pa:0,ca:0,pb:52.2,cb:0}},
   "The anion approaches the positive end of water (the H atoms): water orients with an O–H pointing at the anion, forming an ion–dipole hydrogen bond. Illustrative ionic parameters.",'')
 ]},
 {fam:'indip',name:"Ion–induced dipole",items:[
  P('naar','Na⁺ ··· Ar','Na','Ar',[1.8,8],3.5,"Ion–induced dipole",'∝ 1/r⁴',{ind:true},
   "The cation's field distorts the Ar cloud and induces a dipole (magenta arrow) oriented toward the ion: U<sub>ind</sub> = −½ α′ q²/(4πε₀) / r⁴. It falls off faster than ion–permanent dipole but slower than London. Turn off “Induction” to see what is left with repulsion + dispersion only.",
   "α′(Ar) = 1.64 Å³ · the induction term dominates over dispersion"),
  P('clar','Cl⁻ ··· Ar','Cl','Ar',[2.2,8],4.0,"Ion–induced dipole",'∝ 1/r⁴',{ind:true},
   "Same as with the cation, but the induced dipole points the opposite way: the induction energy does not depend on the sign of the charge (∝ q²). The well is shallower because Cl⁻ is much larger and the repulsion keeps it farther away.",''),
  P('nach4','Na⁺ ··· CH₄','Na','CH4',[1.8,8],3.5,"Ion–induced dipole",'∝ 1/r⁴',{ind:true},
   "A nonpolar but polarizable molecule is also attracted by an ion. It is the basic mechanism of ion solvation in nonpolar solvents and of the interaction of cations with alkanes.",
   "α′(CH₄) = 2.59 Å³")
 ]},
 {fam:'dipdip',name:"Dipole–dipole (Keesom)",items:[
  P('hcl','HCl ··· HCl','HCl','HCl',[2.5,9],4.4,"Dipole–dipole","∝ 1/r³ (fixed)",{orient:true,pre:PRE_POLAR,def:PRE_POLAR[0]},
   "μ(HCl) = 1.08 D. The energy depends on the orientation: head-to-tail and antiparallel attract; parallel and head-to-head repel. Dispersion is always added. Press “Thermal average” to see the effect of free rotation.",
   "Model partial charges: H +0.177 · Cl −0.177 e"),
  P('hclk',"HCl ··· HCl · free rotation (Keesom)",'HCl','HCl',[2.5,10],4.4,"Averaged dipole–dipole",'∝ 1/(T r⁶)',{orient:true,avg:true,keesom:true,pre:PRE_POLAR,def:PRE_POLAR[0]},
   "In a gas the molecules rotate: the dipoles orient according to the Boltzmann weight and the average decays as r⁻⁶ and as 1/T (Keesom): U = −(2/3) μ⁴ / [(4πε₀)² k<sub>B</sub>T r⁶]. The dotted line is that point-dipole formula; raise the temperature and you will see the average well become shallower.",
   "The white curve is the potential of mean force W(r) = −k<sub>B</sub>T ln⟨e<sup>−U/k<sub>B</sub>T</sup>⟩ over all orientations."),
  P('co','CO ··· CO','CO','CO',[2.6,9],4.0,"Very weak dipole–dipole","dominated by London",{orient:true,pre:PRE_POLAR,def:PRE_POLAR[0]},
   "CO has almost no dipole moment (μ ≈ 0.11 D) despite having a polar bond. Compare with HCl: the electrostatic contribution is minimal compared with dispersion. Generic illustrative parameters.",
   "Model partial charges: C −0.020 · O +0.020 e"),
  P('h2co','H₂C=O ··· H₂C=O','H2CO','H2CO',[2.5,9],4.0,"Strong dipole–dipole","∝ 1/r³ (fixed)",{orient:true,offset:true,pre:PRE_POLAR,def:PRE_POLAR[1]},
   "The carbonyl group is very polar (μ(model) ≈ 2.6 D; experimental 2.33 D). Antiparallel dimers of carbonyls, with lateral displacement Δy, are the reason ketones and aldehydes have higher T<sub>b</sub> than alkanes of similar mass.",
   "Illustrative charges: C +0.15 · O −0.35 · H +0.10 e")
 ]},
 {fam:'debye',name:"Dipole–induced dipole (Debye)",items:[
  P('hclar','HCl ··· Ar','HCl','Ar',[2.5,9],4.2,"Permanent dipole–induced dipole",'∝ 1/r⁶',{orient:true,ind:true,
   pre:[{l:"H toward Ar",pa:180,ca:0,pb:0,cb:0},{l:"Cl toward Ar",pa:0,ca:0,pb:0,cb:0},{l:'Perpendicular',pa:90,ca:0,pb:0,cb:0}],def:{pa:180,ca:0,pb:0,cb:0}},
   "The field of the HCl dipole polarizes Ar. The induction (Debye) contribution is independent of T and of sign, always attractive, but small compared with dispersion. You will see the magenta arrow on Ar.",
   "α′(Ar) = 1.64 Å³ · μ(HCl) = 1.08 D"),
  P('hclxe','HCl ··· Xe','HCl','Xe',[2.5,9],4.5,"Permanent dipole–induced dipole",'∝ 1/r⁶',{orient:true,ind:true,
   pre:[{l:"H toward Xe",pa:180,ca:0,pb:0,cb:0},{l:"Cl toward Xe",pa:0,ca:0,pb:0,cb:0},{l:'Perpendicular',pa:90,ca:0,pb:0,cb:0}],def:{pa:180,ca:0,pb:0,cb:0}},
   "Xe is more polarizable than Ar (α′ = 4.04 Å³): the induced dipole is larger and so is the dispersion. Compare with HCl···Ar the “induction” column and the total depth of the well.",
   "α′(Xe) = 4.04 Å³"),
  P('h2oxe','H₂O ··· Xe','H2O','Xe',[2.5,9],4.0,"Permanent dipole–induced dipole",'∝ 1/r⁶',{orient:true,ind:true,
   pre:[{l:"H toward Xe",pa:180,ca:0,pb:0,cb:0},{l:"O toward Xe",pa:0,ca:0,pb:0,cb:0}],def:{pa:180,ca:0,pb:0,cb:0}},
   "It is the basis of the solubility of noble gases and of O₂/N₂ in water: the large dipole of water polarizes the neighboring nonpolar molecule and attracts it.",'')
 ]},
 {fam:'quad',name:"Quadrupoles and π systems",items:[
  P('n2','N₂ ··· N₂','N2','N2',[2.5,9],4.2,"Quadrupole–quadrupole",'∝ 1/r⁵',{orient:true,offset:true,pre:PRE_LIN,def:PRE_LIN[1]},
   "N₂ has no dipole but does have a permanent quadrupole (Θ ≈ −1.4 D·Å): positive charge distribution at the center and negative at the ends (the model uses a +0.964 e site at the center). The quadrupolar interaction favors the T geometry.",
   "Θ(N₂) ≈ −1.4 D·Å · α′ = 1.74 Å³ · T<sub>b</sub> = 77.4 K"),
  P('co2','CO₂ ··· CO₂','CO2','CO2',[2.5,9],4.0,"Quadrupole–quadrupole",'∝ 1/r⁵',{orient:true,offset:true,pre:PRE_LIN,def:PRE_LIN[3]},
   "CO₂ is linear and nonpolar (μ = 0) but with a large quadrupole (Θ ≈ −4.3 D·Å). The preferred geometries are T-shaped and parallel displaced; the linear end-to-end one is repulsive: observe the rule of the δ+ charges of C versus δ− of O.",
   "Θ(CO₂) ≈ −4.3 D·Å · α′ = 2.91 Å³ · TraPPE-type model"),
  P('c6h6','C₆H₆ ··· C₆H₆ (π–π)','C6H6','C6H6',[2.8,9],5.0,"Quadrupole–quadrupole and π stacking","dispersion + quadrupole",{orient:true,offset:true,
   pre:[{l:"T-shaped (C–H···π)",pa:0,ca:0,pb:90,cb:0,r:5.0},{l:"Sandwich (eclipsed)",pa:0,ca:0,pb:0,cb:0,r:3.8},{l:"Parallel displaced",pa:0,ca:0,pb:0,cb:0,r:3.5,dy:1.6}],def:{pa:0,ca:0,pb:90,cb:0}},
   "The π cloud (red disk) gives negative charges above and below the ring and positive at the edge (H). The maximum attraction appears in the T geometry (edge H pointing at the face) and parallel displaced; the eclipsed sandwich repels because it faces charges of the same sign.",
   "CCSD(T): D<sub>e</sub> ≈ 10–11 kJ/mol (T and displaced) · Θ ≈ −8.7 D·Å · α′ = 10.3 Å³"),
  P('nac6h6',"Na⁺ ··· C₆H₆ (cation–π)",'Na','C6H6',[1.5,8],4.0,"Ion–quadrupole / cation–π",'∝ 1/r³ + 1/r⁴',{orient:true,offset:true,ind:true,
   pre:[{l:"Over the ring face",pa:0,ca:0,pb:0,cb:0,r:2.2},{l:"Over the edge (H, repulsive)",pa:0,ca:0,pb:90,cb:0,r:4.2}],def:{pa:0,ca:0,pb:0,cb:0}},
   "The cation sits over the negative face of the ring: interaction with the quadrupole plus induction of the highly polarizable π cloud. It is the basis of cation recognition (K⁺, NH₄⁺) by proteins with aromatic rings.",
   "Experimental (gas phase): ≈ 100–120 kJ/mol; this model overestimates. Illustrative parameters."),
  P('naco2',"Na⁺ ··· CO₂ (ion–quadrupole)",'Na','CO2',[1.8,8],3.2,"Ion–quadrupole",'∝ 1/r³',{orient:true,ind:true,
   pre:[{l:"O toward the cation (linear)",pa:0,ca:0,pb:0,cb:0,r:3.2},{l:"T-shaped (C toward the cation)",pa:0,ca:0,pb:90,cb:0,r:3.0}],def:{pa:0,ca:0,pb:0,cb:0}},
   "The cation interacts with the O atoms (δ−) through the quadrupolar part of CO₂; in the linear geometry the attraction is strong, in the T it is repulsive. It is the basis of CO₂ capture in zeolites with cations.",''),
  P('h2oco2',"H₂O ··· CO₂ (dipole–quadrupole)",'H2O','CO2',[2.5,8],3.2,"Dipole–quadrupole",'∝ 1/r⁴',{orient:true,offset:true,
   pre:[{l:"Water O toward C (T-shaped)",pa:0,ca:0,pb:90,cb:0,r:2.9},{l:"Water H toward the O of CO₂",pa:180,ca:0,pb:0,cb:0,r:4.0}],def:{pa:0,ca:0,pb:90,cb:0}},
   "The water dipole interacts with the CO₂ quadrupole: the water O approaches the C (δ+) and one H approaches an O of CO₂. It contributes to the solubility of CO₂ in water.",
   "Order of magnitude: ≈ 10 kJ/mol"),
  P('h2oc6h6','H₂O ··· C₆H₆ (O–H···π)','H2O','C6H6',[2.5,8],3.4,"X–H···π bridge","directional",{orient:true,offset:true,
   pre:[{l:"O–H toward the π face",pa:-127.8,ca:0,pb:0,cb:0,r:3.3},{l:"O toward the face (repulsive)",pa:0,ca:0,pb:0,cb:0,r:3.2}],def:{pa:-127.8,ca:0,pb:0,cb:0}},
   "The aromatic ring acts as a weak H-bond acceptor: an O–H of water points toward the π cloud (negative face). It is weaker than an O–H···O bond but directional.",
   'Experimental/CCSD(T): ≈ 9–14 kJ/mol')
 ]},
 {fam:'hb',name:"Hydrogen bond",items:[
  P('hf','HF ··· HF','HF','HF',[2.2,8],3.1,"Hydrogen bond","directional electrostatics",{orient:true,
   pre:[{l:"Linear F···H–F (H bond)",pa:0,ca:0,pb:0,cb:0},{l:"Parallel, side by side",pa:90,ca:0,pb:90,cb:0},{l:"Antiparallel, side by side",pa:90,ca:0,pb:-90,cb:0},{l:"F facing F (repulsive)",pa:0,ca:0,pb:180,cb:0}],def:{pa:0,ca:0,pb:0,cb:0}},
   "The H bonded to F (very electronegative) carries a high partial positive charge and is attracted to a lone pair of the neighboring F. It is the most directional: the maximum energy is achieved with the F–H···F angle close to 180°. In this model the force is due to Coulomb; reality includes some charge transfer.",
   "Model partial charges: H +0.413 · F −0.413 e"),
  P('h2o','H₂O ··· H₂O','H2O','H2O',[2.0,8],3.0,"Hydrogen bond","directional electrostatics",{orient:true,
   pre:[{l:"H bond (approx.)",pa:-127.8,ca:0,pb:180,cb:90},{l:"Head-to-tail",pa:0,ca:0,pb:0,cb:0},{l:"Antiparallel, side by side",pa:90,ca:0,pb:-90,cb:0},{l:"Head-to-head (δ−/δ−)",pa:0,ca:0,pb:180,cb:0}],def:{pa:-127.8,ca:0,pb:180,cb:90}},
   "Each water can donate two H bonds and accept two others: this explains its high boiling point. Press “Relax geometry” and watch how the H of one molecule aligns toward the lone pair of the O of the other (O–H···O ≈ 180°).",
   "Experimental dimer: O···O ≈ 2.98 Å, D<sub>e</sub> ≈ 21 kJ/mol. The TIP3P model (designed for liquid) gives O···O ≈ 2.75 Å and ≈ 27 kJ/mol."),
  P('nh3','NH₃ ··· NH₃','NH3','NH3',[2.5,8],3.4,"Hydrogen bond (N–H···N)","directional electrostatics",{orient:true,pre:[],def:'best'},
   "N is less electronegative than O: weaker bonds and only one lone pair per molecule; that is why NH₃ boils much lower than H₂O (−33 °C) despite being isoelectronic.",
   "Dimer: D<sub>e</sub> ≈ 13 kJ/mol (CCSD(T)) · α′ = 2.26 Å³"),
  P('h2onh3','H₂O ··· NH₃','H2O','NH3',[2.2,8],3.0,"Hydrogen bond (O–H···N)","directional electrostatics",{orient:true,
   pre:[{l:"O–H···N (water donates)",pa:-127.8,ca:0,pb:180,cb:0},{l:"N–H···O (ammonia donates)",pa:0,ca:0,pb:0,cb:0}],def:{pa:-127.8,ca:0,pb:180,cb:0}},
   "Water acts as the donor and the N of ammonia as the acceptor, which is the preferred direction: the O–H is more acidic than the N–H. Try the opposite orientation to compare them.",
   "Order of magnitude: ≈ 25 kJ/mol"),
  P('meoh','CH₃OH ··· CH₃OH','MeOH','MeOH',[2.2,8],3.2,"Hydrogen bond (O–H···O)","directional electrostatics",{orient:true,offset:true,pre:[],def:'best'},
   "Like water, methanol donates and accepts, but it has only one polar H and the bulky CH₃: it forms linear chains and rings instead of a 3D network. Hence it boils at 65 °C and not at 100 °C.",
   "Dimer: ≈ 20 kJ/mol · OPLS-type model (united atom)"),
  P('h2oh2co','H₂O ··· H₂C=O','H2O','H2CO',[2.2,8],3.3,"Hydrogen bond (O–H···O=C)","directional electrostatics",{orient:true,offset:true,
   pre:[{l:"O–H···O=C (water donates)",pa:-127.8,ca:0,pb:180,cb:0}, {l:"C–H···O (weak)",pa:0,ca:0,pb:180,cb:0}],def:{pa:-127.8,ca:0,pb:180,cb:0}},
   "The carbonyl O is an excellent acceptor: water positions itself with an O–H pointing at the lone pair of the C=O. This is how ketones, aldehydes and amides, and the C=O groups of the protein backbone, are hydrated.",''),
  P('hcooh',"HCOOH ··· HCOOH (cyclic dimer)",'HCOOH','HCOOH',[2.2,8],3.1,"Double hydrogen bond","directional electrostatics",{orient:true,offset:true,
   pre:[{l:"Cyclic dimer (global min.)",pa:-17,ca:0,pb:163,cb:0}],def:{pa:-17,ca:0,pb:163,cb:0}},
   "Two carboxylic acids form an eight-membered ring with two O–H···O=C bonds. It is the most stable dimer of those listed and persists even in the gas phase and in nonpolar solvents. Press “Relax geometry” to find the cyclic form.",
   "Experimental: ΔH(dimerization) ≈ −59 kJ/mol (gas)")
 ]},
 {fam:'xb',name:"Halogen bond (σ-hole)",items:[
  P('cf3inh3','CF₃I ··· NH₃','CF3I','NH3',[2.5,8],4.4,"Halogen bond","directional (σ-hole)",{orient:true,offset:true,
   pre:[{l:"Linear C–I···N (σ-hole)",pa:0,ca:0,pb:180,cb:0,r:4.3},{l:"Lateral (negative belt)",pa:90,ca:0,pb:180,cb:0,r:3.9,dy:0.9},{l:"CF₃ side (repulsive)",pa:180,ca:0,pb:180,cb:0,r:4.3}],def:{pa:0,ca:0,pb:180,cb:0}},
   "I has a positive region along the extension of the C–I bond (σ-hole, light-blue sphere) and a negative belt on the sides. A Lewis base (N lone pair) sits on the axis with C–I···N ≈ 180°: just like a hydrogen bond, but with a halogen as the density acceptor.",
   "Model with a virtual site (σ-hole) of +0.10 e charge at 1.6 Å from I. Order of magnitude: ≈ 10 kJ/mol"),
  P('cf3ih2o','CF₃I ··· H₂O','CF3I','H2O',[2.5,8],4.4,"Halogen bond","directional (σ-hole)",{orient:true,offset:true,
   pre:[{l:"Linear C–I···O (σ-hole)",pa:0,ca:0,pb:180,cb:0,r:4.3},{l:"CF₃ side (repulsive)",pa:180,ca:0,pb:180,cb:0,r:4.3}],def:{pa:0,ca:0,pb:180,cb:0}},
   "Water can also be a halogen-bond acceptor through the lone pair of the O. The strong directional character (±15°) is what distinguishes this bond from a simple dispersion interaction.",'')
 ]},
 {fam:'hphob',name:"Hydrophobicity",items:[
  P('ch4h2o',"CH₄ ··· H₂O (hydrophobic)",'CH4','H2O',[2.5,8],3.8,"Weak interaction · hydrophobic effect","dispersion + weak induction",{orient:true,ind:true,
   pre:[{l:"H toward CH₄",pa:180,ca:0,pb:0,cb:0},{l:"O toward CH₄",pa:0,ca:0,pb:0,cb:0}],def:{pa:180,ca:0,pb:0,cb:0}},
   "The attraction between water and methane is very weak (~1 kJ/mol) compared with water–water (~25 kJ/mol): methane cannot form H bonds. The “hydrophobic effect” is not a pairwise repulsion but a collective effect: water loses entropy on structuring itself around the solute, and that is why nonpolar molecules cluster together.",
   "This simulator treats isolated pairs; the hydrophobic effect is a property of the liquid (solvent + entropy).")
 ]}
];
const PAIRS={};GROUPS.forEach(g=>g.items.forEach(p=>{p.fam=g.fam;PAIRS[p.id]=p;}));

const BEST={"ne":{"u":-0.296,"r":3.087,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"ar":{"u":-0.996,"r":3.822,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"kr":{"u":-1.422,"r":4.041,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"xe":{"u":-1.837,"r":4.602,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"ch4":{"u":-1.231,"r":4.187,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"nacl":{"u":-500.113,"r":2.572,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"nana":{"u":173.668,"r":8,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"mgcl":{"u":-1162.423,"r":2.204,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"nah2o":{"u":-102.295,"r":2.352,"pa":107.2,"ca":-112.5,"pb":0,"cb":199.3,"tb":-180,"dy":0},"mgh2o":{"u":-281.177,"r":1.974,"pa":-85,"ca":-77,"pb":180,"cb":-122.5,"tb":0,"dy":0},"clh2o":{"u":-56.137,"r":3.152,"pa":-69,"ca":58.4,"pb":-28.9,"cb":11.9,"tb":6.6,"dy":0},"naar":{"u":-12.575,"r":2.71,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"clar":{"u":-4.06,"r":3.916,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"nach4":{"u":-17.016,"r":2.818,"pa":0,"ca":0,"pb":0,"cb":0,"tb":0,"dy":0},"hcl":{"u":-4.047,"r":3.661,"pa":180,"ca":-92.5,"pb":180,"cb":77.9,"tb":0,"dy":0},"hclk":{"u":-4.047,"r":3.661,"pa":0,"ca":58.4,"pb":0,"cb":24.4,"tb":0,"dy":0},"co":{"u":-1.955,"r":3.572,"pa":-96.1,"ca":80.8,"pb":60.2,"cb":25.3,"tb":77.7,"dy":0},"h2co":{"u":-12.184,"r":3.553,"pa":-91,"ca":-180,"pb":89,"cb":180,"tb":0,"dy":-0.258},"hclar":{"u":-1.177,"r":3.803,"pa":180,"ca":-112.5,"pb":-32.8,"cb":172.1,"tb":-47,"dy":0},"hclxe":{"u":-1.6,"r":4.187,"pa":-180,"ca":118.8,"pb":-39.2,"cb":-55,"tb":-26.7,"dy":0},"h2oxe":{"u":-1.495,"r":3.918,"pa":-141.8,"ca":-180,"pb":132.9,"cb":-156.5,"tb":-60.9,"dy":0},"n2":{"u":-1.147,"r":3.794,"pa":-107.5,"ca":2.8,"pb":72.5,"cb":-23.7,"tb":0,"dy":0.94},"co2":{"u":-5.041,"r":3.694,"pa":50.5,"ca":-109.7,"pb":-129.5,"cb":-69,"tb":0,"dy":-0.309},"c6h6":{"u":-9.653,"r":4.512,"pa":-138.2,"ca":-85.1,"pb":89,"cb":-113.4,"tb":21.5,"dy":1.803},"nac6h6":{"u":-162.087,"r":1.928,"pa":-97.5,"ca":-108.9,"pb":-24.3,"cb":-62.1,"tb":0,"dy":-0.871},"naco2":{"u":-45.465,"r":3.497,"pa":-145.7,"ca":118.8,"pb":0,"cb":-55,"tb":0,"dy":0},"h2oco2":{"u":-10.066,"r":2.931,"pa":-10.4,"ca":108.5,"pb":-100.4,"cb":-106.6,"tb":108.5,"dy":-0.539},"h2oc6h6":{"u":-15.82,"r":2.88,"pa":-162.4,"ca":0,"pb":157.4,"cb":-30,"tb":0,"dy":-1.004},"hf":{"u":-21.604,"r":2.569,"pa":0,"ca":105.9,"pb":0,"cb":-80.4,"tb":0,"dy":0},"h2o":{"u":-27.406,"r":2.765,"pa":20,"ca":-90,"pb":-49.8,"cb":0,"tb":0,"dy":0},"nh3":{"u":-16.126,"r":2.973,"pa":106.8,"ca":-60,"pb":209.8,"cb":60,"tb":0,"dy":0},"h2onh3":{"u":-28.404,"r":2.801,"pa":-231.6,"ca":180,"pb":-164.3,"cb":118.8,"tb":0,"dy":0},"meoh":{"u":-28.761,"r":3.362,"pa":128.4,"ca":10.7,"pb":7.4,"cb":-94.6,"tb":58.2,"dy":0.109},"h2oh2co":{"u":-18.145,"r":3.157,"pa":112.3,"ca":0,"pb":41.8,"cb":-0.4,"tb":180,"dy":-0.273},"hcooh":{"u":-51.944,"r":2.943,"pa":32.1,"ca":-180.7,"pb":-147.9,"cb":-179.5,"tb":-0.2,"dy":0.895},"cf3inh3":{"u":-13.582,"r":4.21,"pa":-0.4,"ca":-109.6,"pb":-180.4,"cb":-70.3,"tb":0,"dy":-0.029},"cf3ih2o":{"u":-13.114,"r":3.986,"pa":17.2,"ca":-143.3,"pb":-162.7,"cb":-152.1,"tb":0,"dy":1.237},"ch4h2o":{"u":-1.239,"r":3.715,"pa":-76.3,"ca":-144,"pb":16.5,"cb":-115.9,"tb":-37.7,"dy":0}};
  /* ===== interfaz y escena (SimKit) ===== */
  var fmtk = SimKit.fmt, D2R = Math.PI / 180;
  function fix(x, d) { return fmtk(x, d).replace('-', '−'); }
  function en(v) { var a = Math.abs(v); return fix(v, a < 0.1 ? 3 : a < 10 ? 2 : a < 1000 ? 1 : 0) + ' kJ/mol'; }
  function wrap(a) { return ((a + 180) % 360 + 360) % 360 - 180; }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var S = { r: 3, pa: 0, ca: 0, pb: 0, cb: 0, tb: 0, dy: 0, ind: false }, Tk = 298, spin = false, opt = null, curveC = null, dirty = true, Smin = null, mode = 'fix', avgC = null, avgDirty = true, avgDue = 0, pair = null, MA = null, MB = null, gA = null, gB = null, G = {}, ui = {}, labs = {}, show = { cloud: true, q: true, mu: true, f: true, hb: true, id: true }, lastR = null, lastHb = [], curPre = -2;
  var HBN = 4, IDN = 16;
  function bestAngles() { var b = BEST[pair.id]; return b ? { pa: b.pa, ca: b.ca, pb: b.pb, cb: b.cb, tb: b.tb, dy: b.dy, r: b.r } : { pa: 0, ca: 0, pb: 0, cb: 0, tb: 0, dy: 0, r: pair.r0 }; }
  function radS() { return { r: S.r, pa: S.pa * D2R, ca: S.ca * D2R, pb: S.pb * D2R, cb: S.cb * D2R, tb: S.tb * D2R, dy: S.dy, ind: S.ind }; }
  function labelTex(T, txt, col) { var c = document.createElement('canvas'); c.width = 128; c.height = 64; var g = c.getContext('2d'); g.font = '700 34px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 5; g.strokeStyle = 'rgba(15,23,42,.92)'; g.strokeText(txt, 64, 34); g.fillStyle = col; g.fillText(txt, 64, 34); return new T.CanvasTexture(c); }
  function sprite(T, txt, col, sx) { var sp = new T.Sprite(new T.SpriteMaterial({ map: labelTex(T, txt, col), transparent: true, depthTest: false })); sp.scale.set(sx || 1.1, (sx || 1.1) / 2, 1); return sp; }
  function chargeColor(T, q, base) { if (Math.abs(q) < 1e-6) return new T.Color(base); var t = Math.min(1, Math.abs(q) / 0.7); return new T.Color(0xe5e7eb).lerp(new T.Color(q < 0 ? 0xef4444 : 0x3b82f6), 0.25 + 0.75 * t); }
  function buildMol(T, M) {
    var g = new T.Group(), clouds = [], labels = [], balls = [];
    M.bonds.forEach(function (b) { var a = M.atoms[b[0]], c = M.atoms[b[1]], va = new T.Vector3(a.x, a.y, a.z), vb = new T.Vector3(c.x, c.y, c.z), len = va.distanceTo(vb), cyl = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, len, 12), new T.MeshStandardMaterial({ color: 0xaab4c3, roughness: 0.5 })); cyl.position.copy(va).add(vb).multiplyScalar(0.5); cyl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vb.clone().sub(va).normalize()); g.add(cyl); });
    var big = M.atoms.length > 6;
    M.atoms.forEach(function (a) {
      var A = AT[a.t], ball = new T.Mesh(new T.SphereGeometry(A.rb, 28, 20), new T.MeshStandardMaterial({ color: A.col, roughness: 0.35 })); ball.position.set(a.x, a.y, a.z); g.add(ball); balls.push(ball);
      if (M.pi) return;
      var cm = new T.Mesh(new T.SphereGeometry(A.rc, 36, 24), new T.MeshStandardMaterial({ color: chargeColor(T, a.q, A.col), transparent: true, opacity: M.dispersive ? 0.32 : (big ? 0.12 : 0.22), depthWrite: false, roughness: 0.6 })); cm.position.set(a.x, a.y, a.z); cm.userData.base = new T.Vector3(a.x, a.y, a.z); g.add(cm); clouds.push(cm);
      if (Math.abs(a.q) > 1e-3 && !(M.atoms.length > 3 && Math.abs(a.q) < 0.105)) {
        var aq = Math.abs(a.q), txt = aq >= 1.5 ? (a.q > 0 ? '2+' : '2−') : aq >= 0.99 ? (a.q > 0 ? '+' : '−') : (a.q > 0 ? 'δ+' : 'δ−'), sp = sprite(T, txt, a.q > 0 ? '#93c5fd' : '#fca5a5', 1.1), off = new T.Vector3(a.x, a.y, a.z), dir = off.length() > 0.3 ? off.clone().normalize() : new T.Vector3(0, 1, 0);
        sp.position.copy(off.add(dir.multiplyScalar(Math.max(A.rb, 0.5) + 0.55))); if (M.atoms.length === 1) sp.position.set(a.x, a.y + Math.max(A.rb, A.rc * 0.55) + 0.45, a.z); if (a.t === 'Z') sp.position.set(a.x, a.y + 0.75, a.z); g.add(sp); labels.push(sp);
      }
    });
    if (M.pi) { [-1, 1].forEach(function (s) { var geo = new T.TorusGeometry(1.25, 0.55, 18, 40); geo.rotateY(Math.PI / 2); var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, depthWrite: false })); m.position.set(s * 1.0, 0, 0); g.add(m); clouds.push(m); m.userData.base = m.position.clone(); var sp = sprite(T, 'δ−', '#fca5a5', 1.1); sp.position.set(s * 1.9, 0.1, 0); g.add(sp); labels.push(sp); }); var sp2 = sprite(T, 'δ+', '#93c5fd', 1.1); sp2.position.set(0, 3.3, 0); g.add(sp2); labels.push(sp2); }
    var arrow = null; if (M.mu > 0.05) { var d = new T.Vector3(-M.dip[0], -M.dip[1], -M.dip[2]).normalize(), len = 0.9 + 0.75 * Math.min(M.mu, 4); arrow = new T.ArrowHelper(d, d.clone().multiplyScalar(-len / 2).add(new T.Vector3(0, 0, 1.9)), len, 0xf59f00, 0.5, 0.32); g.add(arrow); }
    g.userData = { clouds: clouds, labels: labels, balls: balls, arrow: arrow, M: M }; return g;
  }
  function disposeGroup(ctx, g) { if (!g) return; ctx.scene.remove(g); g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  function camFor(ctx, v) { var T = ctx.T, k = Math.max(1, (pair ? pair.rng[1] * 0.9 + 4 : 13) / 13), p = v || [0, 2.2, 11.5]; ctx.P.camGoal = { pos: new T.Vector3(p[0] * k, p[1] * k, p[2] * k), target: new T.Vector3(0, 0, 0) }; }
  function resetState() {
    opt = null; spin = false; var d = pair.def; if (d === 'best') d = bestAngles(); d = d || { pa: 0, ca: 0, pb: 0, cb: 0 };
    S.r = pair.r0; S.pa = d.pa; S.ca = d.ca; S.pb = d.pb; S.cb = d.cb; S.tb = d.tb || 0; S.dy = pair.offset ? (d.dy || 0) : 0; if (d.r !== undefined && pair.def === 'best') S.r = d.r; S.ind = !!pair.ind; dirty = true; avgDirty = true; curPre = -2;
  }
  function setPair(ctx, id, keepMode) {
    pair = PAIRS[id]; MA = MOLS[pair.A]; MB = MOLS[pair.B]; disposeGroup(ctx, gA); disposeGroup(ctx, gB); gA = buildMol(ctx.T, MA); gB = buildMol(ctx.T, MB); ctx.scene.add(gA, gB);
    mode = (pair.avg && pair.orient) ? 'avg' : 'fix'; resetState(); camFor(ctx); G.pairInfoKey = '';
  }
  function applyPreset(p) { opt = null; S.pa = p.pa; S.ca = p.ca; S.pb = p.pb; S.cb = p.cb; S.tb = p.tb || 0; S.dy = pair.offset ? (p.dy || 0) : 0; if (p.r !== undefined) S.r = p.r; dirty = true; avgDirty = true; }
  function applyBest() { var d = bestAngles(); opt = null; S.pa = d.pa; S.ca = d.ca; S.pb = d.pb; S.cb = d.cb; S.tb = d.tb; S.dy = pair.offset ? d.dy : 0; dirty = true; avgDirty = true; }
  function recomputeCurve() { curveC = curve(MA, MB, radS(), pair.rng[0], pair.rng[1], 240); Smin = minOf(curveC); dirty = false; }
  function recomputeAvg() { var n = 48, rs = [], i; for (i = 0; i < n; i++) rs.push(pair.rng[0] + (pair.rng[1] - pair.rng[0]) * i / (n - 1)); var N = Math.round(Math.max(300, Math.min(2500, 4e6 / (MA.atoms.length * MB.atoms.length * n)))); avgC = { rs: rs, w: pmf(MA, MB, Tk, rs, N, S.ind) }; avgDirty = false; }
  var LES = function (i, loc) {
    var sw = function (id, pre, rs, sub) { var p = PAIRS[id], b = BEST[id] ? BEST[id].r : p.r0, rst = Math.min(p.rng[1], b + 3.2); return { id: id, pre: pre, r: rs === 'hold' ? b : b + (rst - b) * (1 - ease(sub / 0.75)) }; };
    if (i === 0) return sw('ar', 'best', 'sw', loc);
    if (i === 1) return loc < 0.5 ? sw('nacl', 'best', 'sw', loc / 0.5) : sw('nah2o', 'best', 'sw', (loc - 0.5) / 0.5);
    if (i === 2) { var s2 = (loc % 0.5) / 0.5, p0 = PAIRS.hcl, rb = 3.66; return { id: 'hcl', pre: loc < 0.5 ? 0 : 3, r: rb + 3.4 * (1 - ease(s2 / 0.75)) }; }
    if (i === 3) return loc < 0.5 ? sw('h2o', 'best', 'sw', loc / 0.5) : sw('hcooh', 'best', 'sw', (loc - 0.5) / 0.5);
    if (i === 4) return loc < 0.5 ? sw('cf3ih2o', 'best', 'sw', loc / 0.5) : sw('c6h6', 'best', 'sw', (loc - 0.5) / 0.5);
    var ids = ['ar', 'hcl', 'h2o', 'hcooh', 'nacl']; return sw(ids[Math.min(4, Math.floor(loc * 5))], 'best', 'hold', 1);
  };
  var STG = function () { return [
    ["London dispersion", 'London', "Instantaneous dipoles: U ∝ −1/r⁶", "<p>Between <b>argon</b> atoms there are no permanent charges or dipoles, but the electron cloud <b>fluctuates</b> and generates an instantaneous dipole that induces another in the neighbor. The attraction (<b>London</b>, ∝ r⁻⁶) exists between <b>all</b> molecules and grows with polarizability. At short distance Pauli repulsion (∝ r⁻¹²) dominates: the result is the Lennard-Jones well.</p>"],
    ["Ion–ion and ion–dipole", "Ions", "U ∝ 1/r (ion–ion) · 1/r² (ion–dipole)", "<p>Between <b>Na⁺ and Cl⁻</b> the Coulomb energy decays as <b>1/r</b> and reaches ≈ −500 kJ/mol. An ion facing a polar molecule (<b>Na⁺···H₂O</b>) orients the dipole toward the charge: U ∝ <b>1/r²</b> and ≈ −100 kJ/mol. It is the basis of ion <b>hydration</b>.</p>"],
    ["Dipole–dipole", "Dipoles", "Depends on orientation · ∝ 1/r³", "<p>Two <b>HCl</b> molecules: in the <b>head-to-tail</b> arrangement (δ+ facing δ−) they attract; <b>head-to-head</b> (δ−/δ−) they repel. The energy depends on the <b>orientation</b> and falls as 1/r³ if the molecules are fixed (r⁻⁶ when they rotate freely: Keesom).</p>"],
    ["Hydrogen bond", "H bond", "X–H···A: directional, 4–60 kJ/mol", "<p>An H bonded to a very electronegative atom (O, N, F) interacts with a lone pair of another: <b>H₂O···H₂O</b> (≈ −27 kJ/mol) and the <b>cyclic dimer of formic acid</b> with two bonds (≈ −52 kJ/mol). The interaction is <b>directional</b> (≈ 180° at X–H···A) and the H···A distance ≈ 1.8–2.0 Å.</p>"],
    ["Halogen and π", "Halogen and π", "σ-hole · quadrupole · π stacking", "<p>In <b>CF₃I</b> iodine presents a positive zone (<b>σ-hole</b>) opposite the C–I bond that attracts a lone pair: <b>halogen bond</b> (≈ −13 kJ/mol), very directional (C–I···O ≈ 180°). In <b>benzene</b>, the quadrupole and dispersion favor <b>displaced π–π</b> stacking.</p>"],
    ["Comparison of energies", "Compare", "Ion–ion ≫ H bond > dipole–dipole > London", "<p>Well depth in this model: <b>Ar···Ar</b> ≈ −1 kJ/mol, <b>HCl···HCl</b> ≈ −4, <b>H₂O···H₂O</b> ≈ −27, <b>HCOOH···HCOOH</b> ≈ −52 and <b>Na⁺···Cl⁻</b> ≈ −500 kJ/mol. Compared with <b>k<sub>B</sub>T ≈ 2.5 kJ/mol</b> (298 K), they explain why some substances are gases and others ionic solids.</p>"]
  ]; };
  var def = {
    key: 'interacciones-intermoleculares', title: "Intermolecular Interactions", subtitle: "3D Simulator · forces", accent: { dark: '#fbbf24', light: '#b45309' }, stages: STG, nStages: 6, dur: 13, offset: 0.12, zoom: 1,
    views: [{ id: 'libre', label: "Front", pos: [0, 2.2, 11.5], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 0.01], target: [0, 0, 0] }, { id: 'iso', label: '3/4', pos: [7, 5.5, 9.5], target: [0, 0, 0] }],
    layers: [],
    build: function (ctx) {
      var T = ctx.T, sc = ctx.scene; G.ctx = ctx; sc.add(new T.AmbientLight(0xffffff, 0.9)); var dl = new T.DirectionalLight(0xffffff, 0.7); dl.position.set(6, 10, 9); sc.add(dl);
      G.fA = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0x22c55e, 0.5, 0.32); G.fB = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0x22c55e, 0.5, 0.32); sc.add(G.fA, G.fB);
      var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(new Float32Array(24), 3)); G.ruler = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0x5c6b85 })); G.ruler.frustumCulled = false; sc.add(G.ruler);
      G.hb = []; for (var i = 0; i < HBN; i++) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); var l = new T.Line(g, new T.LineDashedMaterial({ color: 0xe67700, dashSize: 0.16, gapSize: 0.11 })); l.frustumCulled = false; l.visible = false; sc.add(l); G.hb.push(l); }
      G.ida = []; for (i = 0; i < IDN; i++) { var a = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xc2255c, 0.38, 0.24); a.visible = false; sc.add(a); G.ida.push(a); }
      G.qz = new T.Quaternion(); G.qy = new T.Quaternion(); G.qx = new T.Quaternion(); G.qi = new T.Quaternion(); G.tv = new T.Vector3(); G.tt = 0; G.pi = -1;
      labs.r = ctx.label('', 'bl-lead'); labs.hb = ctx.label('', 'bl-d'); labs.t = ctx.label('', 'bl-lead');
      setPair(ctx, 'ar');
    },
    frame: function (ctx, f, dt) {
      dt = Math.min(dt, 0.05); var T = ctx.T, i; G.tt += dt;
      if (!ctx.P.manual) {
        var d = LES(f.i, f.local); if (!pair || d.id !== pair.id) { setPair(ctx, d.id); camFor(ctx); }
        var np = d.pre === 'best' ? -1 : d.pre; if (np !== curPre) { curPre = np; if (np === -1) applyBest(); else applyPreset(PAIRS[d.id].pre[np]); }
        S.r = d.r; S.ind = !!pair.ind; dirty = true; opt = null; spin = false;
      }
      if (spin && pair.orient) { S.pa = wrap(S.pa + dt * 42); S.pb = wrap(S.pb - dt * 57); dirty = true; }
      if (opt && !opt.done) {
        var lim = { rLo: pair.rng[0], rHi: pair.rng[1], dy: 3 }; for (var k = 0; k < 5 && !opt.done; k++) { optStep(MA, MB, opt, lim); opt.n++; }
        S.r = opt.p[0]; S.pa = wrap(opt.p[1] / D2R); S.ca = wrap(opt.p[2] / D2R); S.pb = wrap(opt.p[3] / D2R); S.cb = wrap(opt.p[4] / D2R); S.tb = Math.max(-90, Math.min(90, wrap(opt.p[5] / D2R))); S.dy = opt.p[6]; dirty = true;
        if (opt.done) { var R0 = interact(MA, MB, radS()), hb0 = bonds(MA, MB, radS()); ctx.kit.toast("Relaxed geometry: U = " + en(R0.u) + ' a r = ' + fix(S.r, 2) + ' Å' + (hb0.length ? ' · ' + (hb0[0].kind === 'X' ? 'X···' : 'H···') + fix(hb0[0].dist, 2) + ' Å' : '')); opt = null; }
      }
      if (dirty || !curveC) recomputeCurve();
      if (mode === 'avg' && (avgDirty || !avgC) && performance.now() >= avgDue) recomputeAvg();
      var R = interact(MA, MB, radS(), true), sA = radS(); lastR = R; var tt = G.tt;
      gA.position.set(-S.r / 2, 0, 0); gB.position.set(S.r / 2, S.dy, 0);
      function orient(g, phi, chi, th) { G.qz.setFromAxisAngle(new T.Vector3(0, 0, 1), phi); G.qy.setFromAxisAngle(new T.Vector3(0, 1, 0), th || 0); G.qx.setFromAxisAngle(new T.Vector3(1, 0, 0), chi); g.quaternion.copy(G.qz).multiply(G.qy).multiply(G.qx); }
      orient(gA, sA.pa, sA.ca, 0); orient(gB, sA.pb, sA.cb, sA.tb);
      var ids = S.ind && show.id ? inducedDipoles(R.a, R.b) : [], big = ids.map(function (d) { return { d: d, m: Math.hypot(d.mx, d.my, d.mz) }; }).filter(function (o) { return o.m > 0.015; }).sort(function (p, q) { return q.m - p.m; }).slice(0, IDN);
      G.ida.forEach(function (a, i) { var o = big[i]; if (!o) { a.visible = false; return; } var len = Math.min(2.6, 0.5 + 9 * o.m); G.tv.set(o.d.mx, o.d.my, o.d.mz).normalize(); a.position.set(o.d.x - G.tv.x * len / 2, o.d.y - G.tv.y * len / 2, o.d.z - G.tv.z * len / 2); a.setDirection(G.tv); a.setLength(len, Math.min(0.4, len * 0.45), Math.min(0.25, len * 0.3)); a.visible = true; });
      var disp = MA.dispersive && MB.dispersive;
      [gA, gB].forEach(function (g, gi) {
        var M = gi ? MB : MA; G.qi.copy(g.quaternion).invert();
        g.userData.clouds.forEach(function (c) {
          c.visible = show.cloud;
          if (disp) { var sg = AT[M.atoms[0].t].s, amp = 0.2 * AT[M.atoms[0].t].rc, dd = new T.Vector3(Math.cos(tt * 2.1), 0.75 * Math.sin(tt * 2.9), 0.55 * Math.sin(tt * 1.7)).normalize().multiplyScalar(amp), corr = gi ? Math.min(1, Math.exp(-(S.r - sg) / (0.9 * sg))) : 1; c.position.copy(c.userData.base).addScaledVector(dd, corr); }
          else if (M.atoms.length === 1 && S.ind && M.alpha > 0.5 && big.length) { var o = big.filter(function (q) { return Math.hypot(q.d.x - g.position.x, q.d.y - g.position.y, q.d.z - g.position.z) < 0.3; })[0]; if (o) { G.tv.set(o.d.mx, o.d.my, o.d.mz).applyQuaternion(G.qi).multiplyScalar(Math.min(0.9, 2.2)); c.position.copy(c.userData.base).add(G.tv); } else c.position.copy(c.userData.base); }
          else c.position.copy(c.userData.base);
        });
        g.userData.labels.forEach(function (l) { l.visible = show.q; }); if (g.userData.arrow) g.userData.arrow.visible = show.mu;
      });
      var fN = Math.hypot(R.fx, R.fy, R.fz) * PN, fl = fN > 0.02 ? Math.min(3.4, 0.7 + 0.95 * Math.log(1 + fN / 6) / Math.LN10 * 1.6) : 0.001, fd = fN > 1e-9 ? new T.Vector3(R.fx, R.fy, R.fz).normalize() : new T.Vector3(1, 0, 0), col = R.fx > 0 ? 0xe03131 : 0x2f9e44, yF = -3.0;
      G.fB.position.set(S.r / 2, yF, 0); G.fB.setDirection(fd); G.fB.setLength(fl, Math.min(0.55, fl * 0.5), Math.min(0.32, fl * 0.3)); G.fB.setColor(col); G.fA.position.set(-S.r / 2, yF, 0); G.fA.setDirection(fd.clone().negate()); G.fA.setLength(fl, Math.min(0.55, fl * 0.5), Math.min(0.32, fl * 0.3)); G.fA.setColor(col); G.fA.visible = G.fB.visible = show.f;
      var rp = G.ruler.geometry.attributes.position.array, yr = 3.4 + Math.max(0, S.dy), xa = -S.r / 2, xb = S.r / 2, rv = [xa, yr, 0, xb, yr, 0, xa, yr - 0.25, 0, xa, yr + 0.25, 0, xb, yr - 0.25, 0, xb, yr + 0.25, 0, xb + 0.6, 0, 0, xb + 0.6, S.dy, 0]; for (i = 0; i < 24; i++) rp[i] = rv[i]; G.ruler.geometry.attributes.position.needsUpdate = true;
      var hb = bonds(MA, MB, sA); lastHb = hb;
      G.hb.forEach(function (l, i) { var h = hb[i]; if (h && show.hb) { var p = l.geometry.attributes.position.array; p[0] = h.H.x; p[1] = h.H.y; p[2] = h.H.z; p[3] = h.A.x; p[4] = h.A.y; p[5] = h.A.z; l.geometry.attributes.position.needsUpdate = true; l.computeLineDistances(); l.material.color.setHex(h.kind === 'X' ? 0xae3ec9 : 0xe67700); l.visible = true; } else l.visible = false; });
      labs.r.pos(0, yr + 0.7, 0).set('r = ' + fix(S.r, 2) + ' Å', 'bl-lead').vis(true);
      if (hb.length && show.hb) labs.hb.pos((hb[0].H.x + hb[0].A.x) / 2, (hb[0].H.y + hb[0].A.y) / 2 + 0.55, (hb[0].H.z + hb[0].A.z) / 2).set(fix(hb[0].dist, 2) + ' Å', 'bl-d').vis(true); else labs.hb.vis(false);
      labs.t.pos(0, -4.6, 0).set(pair.type + ' · U = ' + en(R.u), 'bl-lead').vis(true);
    },
    sync: function (ctx) { if (ui.refresh) ui.refresh(); },
    hud: function () { var R = lastR || { u: 0, ec: 0, elj: 0, ei: 0 }, row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; };
      return { eq: { chip: 'U', name: pair ? pair.label : '', body: row('r', fix(S.r, 2) + ' Å') + row("Total U", en(R.u)) + row('k_BT', fix(KB * Tk, 2) + ' kJ/mol') }, legend: [{ label: 'δ−', color: '#ef4444', text: "negative partial charge" }, { label: 'δ+', color: '#3b82f6', text: "positive partial charge" }, { label: 'μ', color: '#f59f00', text: "dipole" }, { label: 'F', color: '#2f9e44', text: "force (green: attracts)" }, { label: 'H···A', color: '#e67700', text: "H bond / halogen" }] }; },
    measures: function () { if (!pair) return []; var R = lastR || interact(MA, MB, radS()), hb = lastHb, kt = KB * Tk, fx = R.fx * PN;
      return [["Pair", pair.label], ["Type", pair.type], ['r', fix(S.r, 2) + ' Å'], ["Total U", en(R.u)], ['· Coulomb', en(R.ec)], ['· Lennard-Jones', en(R.elj)], ["· induction", S.ind ? en(R.ei) : en(R.ei) + " (not included)"], ["Force on B (x)", fix(fx, Math.abs(fx) < 10 ? 2 : 1) + ' pN'], ['k_BT (' + Math.round(Tk) + ' K)', fix(kt, 2) + ' kJ/mol'], ["Minimum (this orientation)", Smin && Smin.u < 0 ? en(Smin.u) + ' · r = ' + fix(Smin.r, 2) + ' Å' : "no well"], ["H / X bond", hb.length ? ((hb[0].kind === 'X' ? 'X···' : 'H···') + (hb[0].acc === 'Clm' ? 'Cl⁻' : hb[0].acc.replace(/[a-z]+$/, '')) + ' ' + fix(hb[0].dist, 2) + ' Å · ' + Math.round(hb[0].ang) + '°') : 'no']]; },
    ideas: ["<b>London</b> acts between all molecules (∝ r⁻⁶) and grows with polarizability.", "<b>Ion–ion</b> 1/r, <b>ion–dipole</b> 1/r², <b>dipole–dipole</b> 1/r³: the smaller the exponent, the longer the range.", "The <b>H bond</b> and the <b>halogen</b> bond are <b>directional</b>.", "Compare the well with <b>k_BT</b>: if it is smaller, thermal agitation separates the pair.", "Freely rotating dipoles are averaged: Keesom ∝ 1/(T·r⁶)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, c = kit.ui.card("Species pair"); el.appendChild(c);
      var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Species group'); sel.style.cssText = 'width:100%;margin:4px 0 8px;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--card);font:inherit'; GROUPS.forEach(function (g) { var og = document.createElement('optgroup'); og.label = g.name; g.items.forEach(function (p) { var o = document.createElement('option'); o.value = p.id; o.textContent = p.label; og.appendChild(o); }); sel.appendChild(og); }); sel.addEventListener('change', function () { ctx.goManual(); setPair(ctx, sel.value); }); c.appendChild(sel); ui.sel = sel;
      var info = document.createElement('div'); info.className = 'small'; c.appendChild(info); ui.info = info;
      var pc = kit.ui.card("Relative position"); el.appendChild(pc);
      ui.r = kit.ui.slider({ label: "Distance r", min: 1.2, max: 10, step: 0.01, value: 3, format: function (v) { return fix(v, 2) + ' Å'; }, onInput: function (v) { ctx.goManual(); opt = null; S.r = v; dirty = true; } });
      var sl = [ui.r]; [['pa', "A · twist φ"], ['ca', "A · axis χ"], ['pb', "B · twist φ"], ['cb', "B · axis χ"]].forEach(function (a) { ui[a[0]] = kit.ui.slider({ label: a[1], min: -180, max: 180, step: 1, value: 0, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); opt = null; S[a[0]] = v; dirty = true; avgDirty = true; } }); sl.push(ui[a[0]]); });
      ui.tb = kit.ui.slider({ label: "B · tilt θ", min: -90, max: 90, step: 1, value: 0, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); opt = null; S.tb = v; dirty = true; avgDirty = true; } }); sl.push(ui.tb);
      ui.dy = kit.ui.slider({ label: "Displacement Δy", min: -4, max: 4, step: 0.01, value: 0, format: function (v) { return fix(v, 2) + ' Å'; }, onInput: function (v) { ctx.goManual(); opt = null; S.dy = v; dirty = true; avgDirty = true; } }); sl.push(ui.dy);
      ui.T = kit.ui.slider({ label: "Temperature", min: 20, max: 1000, step: 1, value: Tk, format: function (v) { return Math.round(v) + ' K'; }, onInput: function (v) { Tk = v; dirty = true; avgDirty = true; avgDue = performance.now() + 120; } }); sl.push(ui.T);
      pc.appendChild(kit.ui.sliders(sl)); ui.sliders = sl;
      ui.pre = document.createElement('div'); ui.pre.className = 'row'; ui.pre.style.flexWrap = 'wrap'; pc.appendChild(ui.pre);
      pc.appendChild(ctx.btnRow([{ t: "Relax geometry", fn: function () { ctx.goManual(); spin = false; opt = { p: [S.r, S.pa * D2R + 0.03, S.ca * D2R - 0.03, S.pb * D2R + 0.015, S.cb * D2R + 0.03, S.tb * D2R + 0.02, S.dy + (pair.offset ? 0.04 : 0)], s: 0.2, done: false, n: 0, mask: maskOf(pair), ind: S.ind }; } }, { t: "Global minimum", fn: function () { ctx.goManual(); if (!BEST[pair.id]) return; var d = bestAngles(); opt = null; spin = false; S.r = d.r; S.pa = d.pa; S.ca = d.ca; S.pb = d.pb; S.cb = d.cb; S.tb = d.tb; S.dy = pair.offset ? d.dy : 0; S.ind = !!pair.ind; dirty = true; avgDirty = true; ctx.kit.toast("Global minimum of the model: U = " + en(BEST[pair.id].u)); } }]));
      pc.appendChild(ctx.btnRow([{ t: "Go to equilibrium r", fn: function () { ctx.goManual(); opt = null; if (Smin) { S.r = Math.round(Smin.r * 100) / 100; } } }, { t: "Rotate freely", fn: function () { ctx.goManual(); if (pair.orient) { spin = !spin; opt = null; } } }, { t: "Reset", fn: function () { ctx.goManual(); resetState(); } }]));
      var mc = kit.ui.card("Model and visualization"); el.appendChild(mc);
      ui.ind = kit.ui.options({ label: "Induction (polarizability) in U", cols: 2, value: '0', options: [{ v: '0', label: "Not included" }, { v: '1', label: "Included" }], onChange: function (v) { ctx.goManual(); S.ind = v === '1'; dirty = true; avgDirty = true; opt = null; } }); mc.appendChild(ui.ind);
      ui.mode = kit.ui.options({ label: "U(r) curve", cols: 2, value: 'fix', options: [{ v: 'fix', label: "Fixed orientation" }, { v: 'avg', label: "Thermal average" }], onChange: function (v) { if (v === 'avg' && !pair.orient) return; mode = v; avgDirty = true; } }); mc.appendChild(ui.mode);
      var tg = [['cloud', "Clouds"], ['q', "δ± charges"], ['mu', "Dipole μ"], ['f', "Forces"], ['hb', "H/X bond"], ['id', "Induced dip."]], row = document.createElement('div'); row.className = 'row'; row.style.flexWrap = 'wrap'; ui.tg = {}; tg.forEach(function (t) { var b = document.createElement('button'); b.className = 'btn primary'; b.textContent = t[1]; b.onclick = function () { show[t[0]] = !show[t[0]]; }; ui.tg[t[0]] = b; row.appendChild(b); }); mc.appendChild(row);
      mc.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var lk = ''; ui.refresh = function () {
        if (!pair) return; var k = [pair.id, Math.round(S.r * 100), Math.round(S.pa), Math.round(S.ca), Math.round(S.pb), Math.round(S.cb), Math.round(S.tb), Math.round(S.dy * 100), S.ind, mode, Math.round(Tk), show.cloud, show.q, show.mu, show.f, show.hb, show.id].join('|'); if (k === lk) return; var newPair = !lk || lk.split('|')[0] !== pair.id; lk = k;
        ui.sel.value = pair.id; ui.info.innerHTML = '<p class="small"><b>' + pair.type + '</b> · ' + pair.dep + '</p><p class="small">' + pair.text + '</p>' + (pair.ref ? '<p class="small">' + pair.ref + '</p>' : '') + '<p class="small">' + [MA, MB].map(function (M) { return M.name + ': ' + (M.ion ? 'q = ' + (M.q > 0 ? '+' : '−') + Math.abs(Math.round(M.q)) : 'μ = ' + fix(M.mu, 2) + ' D') + ' · α′ = ' + fix(M.alpha, 2) + ' Å³'; }).join('<br>') + '</p>';
        if (newPair) { ui.r.el && 0; var rs = ui.r; if (rs.setRange) rs.setRange(pair.rng[0], pair.rng[1]); ui.pre.innerHTML = ''; (pair.pre || []).forEach(function (p, i) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = p.l; b.onclick = function () { ctx.goManual(); applyPreset(p); }; ui.pre.appendChild(b); }); }
        ui.r.set(S.r); ui.pa.set(S.pa); ui.ca.set(S.ca); ui.pb.set(S.pb); ui.cb.set(S.cb); ui.tb.set(S.tb); ui.dy.set(S.dy); ui.T.set(Tk); ui.ind.set(S.ind ? '1' : '0'); ui.mode.set(mode);
        Object.keys(ui.tg).forEach(function (n) { ui.tg[n].className = 'btn' + (show[n] ? ' primary' : ''); });
        [ui.pa, ui.ca, ui.pb, ui.cb, ui.tb].forEach(function (s) { var e = s.el || s.root || s; if (e && e.style) e.style.display = pair.orient ? '' : 'none'; }); var de = ui.dy.el || ui.dy.root || ui.dy; if (de && de.style) de.style.display = pair.offset ? '' : 'none';
      };
    },
    graphs: [
      { title: "Energy curve U(r)", h: 250, note: "Total (blue), Coulomb (orange), Lennard-Jones (green), induction (violet) and −k_BT (pink). Dot: current r; diamond: minimum.", draw: function (cx, w, h, c) {
        if (!pair || !curveC) return; var L = 48, R = 12, Tp = 14, B = 28, arr = curveC.ut, mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), lo, hi;
        if (mode === 'avg' && avgC) { mn = Math.min.apply(null, avgC.w); mx = Math.max.apply(null, avgC.w); }
        if (mn < -0.05) { lo = mn * 1.3; hi = -mn * 0.8; } else { hi = Math.min(Math.max(mx, 0.5), 40); lo = -hi * 0.25; }
        var r0 = pair.rng[0], r1 = pair.rng[1], sx = function (r) { return L + (r - r0) / (r1 - r0) * (w - L - R); }, sy = function (u) { return Tp + (hi - u) / (hi - lo) * (h - Tp - B); };
        function step(range) { var raw = range / 5, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
        cx.font = '10px system-ui'; cx.textBaseline = 'middle'; var st = step(hi - lo); for (var v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) { var y = sy(v); cx.strokeStyle = Math.abs(v) < 1e-9 ? c.muted : c.line; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(w - R, y); cx.stroke(); cx.fillStyle = c.muted; cx.textAlign = 'right'; cx.fillText(fix(v, st < 1 ? (st < 0.1 ? 2 : 1) : 0), L - 5, y); }
        cx.textAlign = 'center'; cx.textBaseline = 'top'; var sxs = (r1 - r0) > 5 ? 1 : 0.5; for (v = Math.ceil(r0 / sxs) * sxs; v <= r1 + 1e-9; v += sxs) { cx.fillStyle = c.muted; cx.fillText(fix(v, sxs < 1 ? 1 : 0), sx(v), h - B + 4); } cx.fillText('r (Å)', (L + w - R) / 2, h - 14);
        cx.save(); cx.translate(10, (Tp + h - B) / 2); cx.rotate(-Math.PI / 2); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(mode === 'avg' ? 'W (kJ/mol)' : 'U (kJ/mol)', 0, 0); cx.restore();
        cx.save(); cx.beginPath(); cx.rect(L, Tp, w - L - R, h - Tp - B); cx.clip();
        function line(xs, ar, col, lw, dash) { cx.strokeStyle = col; cx.lineWidth = lw; cx.setLineDash(dash || []); cx.beginPath(); ar.forEach(function (u, i) { var x = sx(xs[i]), y2 = sy(u); if (i) cx.lineTo(x, y2); else cx.moveTo(x, y2); }); cx.stroke(); cx.setLineDash([]); }
        var kt = KB * Tk; if (-kt > lo) { cx.strokeStyle = '#d6336c'; cx.setLineDash([5, 4]); cx.beginPath(); cx.moveTo(L, sy(-kt)); cx.lineTo(w - R, sy(-kt)); cx.stroke(); cx.setLineDash([]); }
        var C = curveC;
        if (mode === 'avg' && avgC) { line(C.rs, C.ut, '#4dabf7', 1.4, [4, 3]); if (pair.keesom) { var kr = [], ku = []; C.rs.forEach(function (r) { if (r >= 3.6) { kr.push(r); ku.push(keesom(MA.mu, MB.mu, Tk, r)); } }); if (kr.length) line(kr, ku, '#e67700', 1.8, [2, 3]); } line(avgC.rs, avgC.w, c.ink, 2.6); }
        else { line(C.rs, C.uc, '#e8590c', 1.4); line(C.rs, C.ul, '#0ca678', 1.4); if (C.ui.some(function (q) { return Math.abs(q) > 1e-3; })) line(C.rs, C.ui, '#ae3ec9', 1.4, S.ind ? [] : [3, 3]); line(C.rs, C.ut, '#1c7ed6', 2.6); }
        cx.restore(); var cu;
        if (mode === 'avg' && avgC) { var ff = (Math.min(r1, Math.max(r0, S.r)) - r0) / (r1 - r0) * (avgC.rs.length - 1), ii = Math.min(avgC.rs.length - 2, Math.floor(ff)), tt2 = ff - ii; cu = avgC.w[ii] * (1 - tt2) + avgC.w[ii + 1] * tt2; }
        else { if (Smin && Smin.u < -0.02) { var xm = sx(Smin.r), ym = sy(Smin.u); cx.fillStyle = '#f59f00'; cx.beginPath(); cx.moveTo(xm, ym - 5); cx.lineTo(xm + 5, ym); cx.lineTo(xm, ym + 5); cx.lineTo(xm - 5, ym); cx.fill(); } cu = interact(MA, MB, radS()).u; }
        var xc = sx(Math.min(r1, Math.max(r0, S.r))), yc = Math.max(Tp, Math.min(h - B, sy(cu))); cx.strokeStyle = c.muted; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(xc, Tp); cx.lineTo(xc, h - B); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(xc, yc, 5, 0, 7); cx.fill(); } },
      { title: "How does each interaction fall off with distance?", h: 230, note: "Log–log scale: the slope is the exponent of r. Pink line: k_BT at 298 K.", draw: function (cx, w, h, c) {
        var L = 40, R = 118, Tp = 10, B = 26, r0 = 2.5, r1 = 20, ylo = -4, yhi = 3.2, lg = function (x) { return Math.log(x) / Math.LN10; }, sx = function (r) { return L + (lg(r) - lg(r0)) / (lg(r1) - lg(r0)) * (w - L - R); }, sy = function (u) { return Tp + (yhi - lg(u)) / (yhi - ylo) * (h - Tp - B); };
        cx.font = '9.5px system-ui'; cx.textBaseline = 'middle'; for (var e = ylo; e <= 3; e++) { var y = sy(Math.pow(10, e)); cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(w - R, y); cx.stroke(); cx.fillStyle = c.muted; cx.textAlign = 'right'; cx.fillText('10' + (e < 0 ? '⁻' : '') + ['⁰', '¹', '²', '³', '⁴'][Math.abs(e)], L - 4, y); }
        cx.textAlign = 'center'; cx.textBaseline = 'top'; [3, 5, 10, 20].forEach(function (r) { cx.fillStyle = c.muted; cx.fillText(r, sx(r), h - B + 4); cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(sx(r), Tp); cx.lineTo(sx(r), h - B); cx.stroke(); }); cx.fillText('r (Å)', (L + w - R) / 2, h - 13);
        var muW = 1.85 * D2EA, muH = 1.08 * D2EA, kT = KB * 298, L6 = [['ion–ion  r⁻¹', function (r) { return KE / r; }, FAM.ionion.col], ['ion–dipolo  r⁻²', function (r) { return KE * muW / (r * r); }, FAM.iondip.col], ["fixed dip.–dip.  r⁻³", function (r) { return 2 * KE * muH * muH / (r * r * r); }, FAM.dipdip.col], ["ion–ind. dip.  r⁻⁴", function (r) { return 0.5 * KE * 1.64 / Math.pow(r, 4); }, FAM.indip.col], ['Keesom  r⁻⁶', function (r) { return (2 / 3) * Math.pow(KE * muH * muH, 2) / (kT * Math.pow(r, 6)); }, '#74c0fc'], ['Debye  r⁻⁶', function (r) { return KE * 1.64 * muH * muH / Math.pow(r, 6); }, FAM.debye.col], ['London (Ar)  r⁻⁶', function (r) { return 4 * 0.996 * Math.pow(3.405, 6) / Math.pow(r, 6); }, FAM.london.col]];
        cx.save(); cx.beginPath(); cx.rect(L, Tp, w - L - R, h - Tp - B); cx.clip(); cx.strokeStyle = '#d6336c'; cx.setLineDash([5, 4]); cx.beginPath(); cx.moveTo(L, sy(kT)); cx.lineTo(w - R, sy(kT)); cx.stroke(); cx.setLineDash([]);
        L6.forEach(function (q) { cx.strokeStyle = q[2]; cx.lineWidth = 2; cx.beginPath(); for (var k = 0; k <= 60; k++) { var r = r0 * Math.pow(r1 / r0, k / 60), yy = sy(q[1](r)), xx = sx(r); if (k) cx.lineTo(xx, yy); else cx.moveTo(xx, yy); } cx.stroke(); }); cx.restore(); cx.lineWidth = 1;
        var ends = L6.map(function (q) { return { n: q[0], col: q[2], y: Math.max(Tp + 6, Math.min(h - B - 6, sy(Math.max(q[1](r1), Math.pow(10, ylo + 0.1))))) }; }).sort(function (a, b) { return a.y - b.y; }); for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 11) ends[i].y = ends[i - 1].y + 11; cx.font = '600 9px system-ui'; cx.textAlign = 'left'; cx.textBaseline = 'middle'; ends.forEach(function (e2) { cx.fillStyle = e2.col; cx.fillText(e2.n, w - R + 4, e2.y); }); } },
      { title: "Comparer: well depth", h: 640, note: "Global minimum of each pair in this model (|U|, logarithmic scale). Highlighted: the current pair. Colors by family.", draw: function (cx, w, h, c) {
        var rows = Object.keys(BEST).map(function (id) { return { id: id, u: BEST[id].u, p: PAIRS[id] }; }).filter(function (x) { return x.p; }).sort(function (a, b) { return a.u - b.u; }), lg = function (v) { return Math.log(v) / Math.LN10; }, lo = lg(0.15), hi = lg(2000), L0 = 118, rh = Math.min(16, (h - 8) / rows.length);
        cx.font = '10px system-ui'; cx.textBaseline = 'middle'; rows.forEach(function (x, i) { var y = 6 + i * rh + rh / 2, cur = pair && x.id === pair.id; cx.fillStyle = cur ? c.ink : c.muted; cx.textAlign = 'right'; cx.font = (cur ? '700 ' : '') + '10px system-ui'; cx.fillText(x.p.label.replace(/ \(.*/, '').slice(0, 24), L0 - 6, y); if (x.u > -0.02) { cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText("no well", L0, y); return; } var wd = Math.max(2, (w - L0 - 50) * (lg(Math.max(0.15, -x.u)) - lo) / (hi - lo)); cx.fillStyle = FAM[x.p.fam].col; cx.globalAlpha = cur ? 1 : 0.75; cx.fillRect(L0, y - rh * 0.35, wd, rh * 0.7); cx.globalAlpha = 1; cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText(fix(x.u, Math.abs(x.u) < 10 ? 2 : Math.abs(x.u) < 1000 ? 1 : 0), L0 + wd + 4, y); }); } }
    ],
    calc: function () { if (!pair) return ''; var R = lastR || interact(MA, MB, radS()), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, kt = KB * Tk, ratio = Smin && Smin.u < 0 ? -Smin.u / kt : 0;
      return '<div class="card-kicker">' + pair.label + ' · r = ' + fix(S.r, 2) + " Å</div><div class=\"calc-step\">1 · Interaction energy (sum over atom pairs)</div><table class=\"calc-table\">" + row('Coulomb Σ qᵢqⱼ·K/rᵢⱼ', en(R.ec)) + row('Lennard-Jones Σ 4ε[(σ/r)¹² − (σ/r)⁶]', en(R.elj)) + row("Induction −½Σ α′|E|²", S.ind ? en(R.ei) : en(R.ei) + " (not included)") + row("Total U", en(R.u)) + "</table><div class=\"calc-step\">2 · Comparison with thermal agitation</div><table class=\"calc-table\">" + row('k_BT (' + Math.round(Tk) + ' K)', fix(kt, 2) + ' kJ/mol') + row("Minimum well (this orientation)", Smin && Smin.u < 0 ? en(Smin.u) + " at r = " + fix(Smin.r, 2) + ' Å' : "no well") + row("|U_min| / k_BT", Smin && Smin.u < 0 ? fix(ratio, 1) : '—') + row("Reading", ratio >= 20 ? "very stable association" : ratio >= 3 ? "bound pair with fluctuations" : ratio > 0 ? "agitation separates the pair" : "repulsive") + "</table><div class=\"calc-step\">3 · Force</div><table class=\"calc-table\">" + row("F on B (x axis)", fix(R.fx * PN, 2) + ' pN') + row("Direction", R.fx > 0 ? "repulsive" : "attractive") + '</table>'; },
    calcLabel: "Energy",
    quiz: [
      { q: "The ion–ion interaction energy decays with distance as…", options: ['1/r', '1/r²', '1/r⁶', 'e^(−r)'], answer: 0, why: "U = q₁q₂/(4πε₀r): it is the longest-range interaction." },
      { q: "London dispersion depends on…", options: ["the polarizability (size of the cloud)", "only the dipole moment", "the net charge", "the number of H"], answer: 0, why: "It exists between all molecules and grows with α′ (which is why Xe boils at a higher T than Ne)." },
      { q: "Two dipoles in a head-to-head arrangement (δ−/δ−)…", options: ["repel each other", "attract strongly", "do not interact", "form an H bond"], answer: 0, why: "The energy depends on the orientation: head-to-tail attracts, head-to-head repels." },
      { q: "A hydrogen bond is…", options: ["a directional X–H···A interaction", "a weak covalent bond", "a purely London force", "independent of orientation"], answer: 0, why: "Directional electrostatics (≈ 180° at X–H···A, H···A ≈ 1.8–2.0 Å)." },
      { q: "The “σ-hole” of I in CF₃I allows…", options: ["a halogen bond with a lone pair", "an H bond", "an ion–ion interaction", "zero dispersion"], answer: 0, why: "The positive zone opposite C–I attracts lone pairs in a very directional way." },
      { q: "If the energy well is much smaller than k_BT…", options: ["thermal agitation separates the pair", "the pair is very stable", "there is no attractive interaction", "there is only repulsion"], answer: 0, why: "k_BT ≈ 2.5 kJ/mol at 298 K: always compare the well with that energy." },
      { q: "Freely rotating permanent dipoles interact according to…", options: ['Keesom: ∝ 1/(T·r⁶)', "fixed 1/r³", '1/r', "no dependence on T"], answer: 0, why: "The Boltzmann average over orientations gives an r⁻⁶ term that decreases with T." },
      { q: "Order from highest to lowest typical energy:", options: ["ion–ion > H bond > dipole–dipole > London (small atoms)", "London > ion–ion > H bond", "dipole–dipole > ion–ion > H bond", "H bond > ion–ion > London"], answer: 0, why: 'Na⁺···Cl⁻ ≈ −500; H₂O···H₂O ≈ −27; HCl···HCl ≈ −4; Ar···Ar ≈ −1 kJ/mol.' }
    ],
    help: { intro: "Choose a pair in “Lab”, adjust the distance and orientations, and compare U with k_BT.", items: [["Relax", "finds the local energy minimum."], ["Global minimum", "loads the best geometry of the model."], ["Thermal average", "potential of mean force for rotating dipoles."], ["Graphs", "U(r), slopes and well comparer."]] }
  };
  MSim.create(def);
})();
