/* Acidez orgánica y pKa — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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


(function () {
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var CP = [
    { id: "ethane", n: "Ethane", fam: "Alkane C–H", s: 'CC{a+}', pka: 50, dl: { a: 1 }, tip: "The lone pair of the sp³ carbanion sits in an orbital with only 25 % s character, concentrated on a single carbon: a very unstable conjugate base." },
    { id: "ethene", n: "Ethene", fam: "Alkene C–H", s: 'C{a+}=C', pka: 44, dl: { a: 1 }, tip: "sp² carbanion (33 % s character): the pair is closer to the nucleus than in sp³, and the conjugate base is somewhat more stable." },
    { id: 'etino', n: "Ethyne (acetylene)", fam: "Alkyne C–H", s: 'C{a+}#C', pka: 25, dl: { a: 1 }, tip: "sp carbanion (50 % s character): the electron pair is held tightly by the nucleus. That is why the terminal C–H is the most acidic of the hydrocarbons." },
    { id: 'nh3', n: "Ammonia", fam: 'N–H', s: 'N{a}', pka: 38, dl: { a: 1 }, tip: "N is more electronegative than C, so NH₂⁻ is more stable than CH₃⁻; but it is much less electronegative than O." },
    { id: 'acetona', n: "Propanone (α-H)", fam: "C–H α to carbonyl", s: 'CC(=O{d})C{a+}', pka: 19.3, dl: { a: 0.4, d: 0.6 }, tip: "The enolate delocalizes the charge between the α carbon and the carbonyl oxygen (resonance): that is why a C–H can be as acidic as an alcohol." },
    { id: "methanol", n: "Methanol", fam: "Alcohol O–H", s: 'CO{a}', pka: 15.5, dl: { a: 1 }, tip: "The alkoxide concentrates the charge on the (electronegative) O and is well solvated by water." },
    { id: 'etanol', n: "Ethanol", fam: "Alcohol O–H", s: 'CCO{a}', pka: 15.9, dl: { a: 1 }, tip: "The electron-donating ethyl group barely destabilizes the alkoxide: ethanol is slightly less acidic than methanol." },
    { id: 'tbuoh', n: "tert-Butanol", fam: "Alcohol O–H", s: 'CC(C)(C)O{a}', pka: 17, dl: { a: 1 }, tip: "Three donor methyl groups and a bulky environment that solvates the anion poorly: it is the least acidic alcohol on the list (≈17–18)." },
    { id: "ethanethiol", n: "Ethanethiol", fam: "Thiol S–H", s: 'CCS{a}', pka: 10.6, dl: { a: 1 }, tip: "S is less electronegative than O, but it is much larger and more polarizable: the charge is spread over a larger volume and the thiolate is more stable than the alkoxide." },
    { id: 'fenol', n: "Phenol", fam: "Phenol O–H", s: 'O{a}Ph{d}', pka: 10.0, dl: { a: 0.4, d: 0.6 }, tip: "In the phenoxide the negative charge is delocalized into the ring (ortho and para positions) by resonance: 5–6 pKa units more acidic than ethanol." },
    { id: 'formico', n: "Methanoic (formic) acid", fam: "Carboxylic acid", s: 'C(=O{d})O{a}', pka: 3.75, dl: { a: 0.5, d: 0.5 }, tip: "In the carboxylate the charge is shared equally between the two oxygens (the two C–O bonds are equivalent, 1.5)." },
    { id: 'acetico', n: "Ethanoic (acetic) acid", fam: "Carboxylic acid", s: 'CC(=O{d})O{a}', pka: 4.76, dl: { a: 0.5, d: 0.5 }, tip: "Acetate spreads the charge over two electronegative O atoms: a conjugate base strongly stabilized by resonance." },
    { id: 'benzoico', n: "Benzoic acid", fam: "Carboxylic acid", s: 'O{a}C(=O{d})Ph', pka: 4.20, dl: { a: 0.5, d: 0.5 }, tip: "The (sp²) ring withdraws electrons inductively and stabilizes the carboxylate somewhat more than a methyl group does." },
    { id: 'fluoro', n: "Fluoroethanoic acid", fam: "Inductive effect", s: 'F{i}CC(=O{d})O{a}', pka: 2.59, dl: { a: 0.5, d: 0.5 }, tip: "Fluorine, very electronegative, withdraws electron density through the σ bonds and stabilizes the carboxylate." },
    { id: 'cloro', n: "Chloroethanoic acid", fam: "Inductive effect", s: 'Cl{i}CC(=O{d})O{a}', pka: 2.86, dl: { a: 0.5, d: 0.5 }, tip: "A chlorine at α lowers the pKa by almost two units relative to acetic acid." },
    { id: 'dicloro', n: "Dichloroethanoic acid", fam: "Inductive effect", s: 'Cl{i}C(Cl{i})C(=O{d})O{a}', pka: 1.29, dl: { a: 0.5, d: 0.5 }, tip: "Two chlorines: the inductive effect adds up (additive)." },
    { id: 'tricloro', n: "Trichloroethanoic acid", fam: "Inductive effect", s: 'Cl{i}C(Cl{i})(Cl{i})C(=O{d})O{a}', pka: 0.65, dl: { a: 0.5, d: 0.5 }, tip: "Three chlorines: about 10 000 times more acidic than acetic acid (ΔpKa ≈ 4.1)." }
  ];
  var CID = {}; CP.forEach(function (c) { CID[c.id] = c; });
  var BS = [
    { id: 'OH', n: "HO⁻ (hydroxide)", ph: 15.7, ex: 'NaOH' }, { id: 'HCO3', n: "HCO₃⁻ (bicarbonate)", ph: 6.35, ex: 'NaHCO₃' },
    { id: 'NH3', n: "NH₃ (ammonia)", ph: 9.25, ex: 'NH₃' }, { id: 'AcO', n: "CH₃COO⁻ (acetate)", ph: 4.76, ex: 'CH₃COONa' },
    { id: 'EtO', n: "EtO⁻ (ethoxide)", ph: 15.9, ex: 'EtONa' }, { id: 'NH2', n: "NH₂⁻ (amide ion)", ph: 38, ex: 'NaNH₂' },
    { id: 'H', n: "H⁻ (hydride)", ph: 35, ex: 'NaH' }
  ];
  var BID = {}; BS.forEach(function (b) { BID[b.id] = b; });
  var T = THREE;
  // geometría del ácido y de su base conjugada (se quita el primer H con etiqueta «a»)
  CP.forEach(function (c) {
    var g = MSim.build(c.s), k = -1, i; for (i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === 'a') { k = i; break; } }
    var map = {}, A = [], TG = [], B = []; g.a.forEach(function (a, j) { if (j !== k) { map[j] = A.length; A.push(a.slice()); TG.push(g.tag[j]); } });
    g.b.forEach(function (b) { if (b[0] !== k && b[1] !== k) B.push([map[b[0]], map[b[1]], b[2]]); });
    c.acid = g; c.hpos = g.a[k]; c.hk = k; c.base = { a: A, b: B, tag: TG };
    var cnt = {}; TG.forEach(function (t) { if (t && c.dl[t]) cnt[t] = (cnt[t] || 0) + 1; }); c.share = TG.map(function (t) { return t && c.dl[t] ? c.dl[t] / cnt[t] : 0; });
    c.nsite = c.share.filter(function (x) { return x > 0; }).length;
  });
  var S = { cp: 'acetico', b: 'OH', pH: 4.76, ph0: true, pr: 0, tt: -1 };
  var NP = 60, perm = [], hA, aA, dummy, gAcid = null, gBase = null, clouds = [], proton, bSph, lab = {}, arrows = [], key_ = '';
  for (var q = 0; q < NP; q++) perm.push(q); var sd = 7; perm.sort(function (a, b) { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 - 0.5; });
  function K(c, b) { return Math.pow(10, b.ph - c.pka); }
  function alpha(pka, pH) { return 1 / (1 + Math.pow(10, pka - pH)); }
  function sciK(x) { return MSim.sci(x, 1); }
  function dG(c, b) { return -5.708 * Math.log(K(c, b)) / Math.LN10; }

  var LESSON = [
    { list: ['acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ["ethane", 'nh3', 'etino', 'acetona', 'etanol', 'fenol', 'acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ["ethane", "ethene", 'etino'], bs: ['NH2'], pH: function (c) { return 12; } },
    { list: ["ethane", 'nh3', 'etanol', "ethanethiol"], bs: ['OH'], pH: function (c) { return 12; } },
    { list: ['etanol', 'fenol', 'acetico'], bs: ['OH'], pH: function (c) { return c.pka; } },
    { list: ['acetico', 'fluoro', 'cloro', 'dicloro', 'tricloro'], bs: ['OH'], pH: function (c) { return 2; } },
    { list: ['fenol', 'fenol', 'etanol', 'acetona'], bs: ['HCO3', 'OH', 'OH', 'NH2'], pH: function (c, f) { return c.pka; } }
  ];
  function stages() {
    var a = CID.acetico, e = CID.etanol, ph = CID.fenol, t = CID.tricloro;
    return [
      ["Brønsted acid and base", 'Brønsted', "HA + B⁻ ⇌ A⁻ + HB: acidity is the stability of A⁻",
        "<p>A <b>Brønsted acid</b> gives up H⁺; its <b>conjugate base</b> A⁻ is what remains. Strength is measured by <b>pKa = −log Ka</b>: the lower the pKa, the greater the acidity. For " + a.n + ', pKa = <b>' + f2(a.pka) + "</b>.</p><p>The acid–base equilibrium has <b>K = 10<sup>pKa(HB) − pKa(HA)</sup></b>: it shifts toward the weaker acid. And <b>the more stable A⁻ is, the more acidic HA is</b>; all the effects that follow are ways of stabilizing the negative charge.</p>"],
      ["The pKa scale", "Scale", "From 50 (alkane) to 0.65 (trichloroacetic acid): 50 orders of magnitude",
        "<p>The pKa values of organic compounds span about <b>50 units</b>: <b>alkanes ≈ 50 · ammonia 38 · alkynes 25 · ketones (α-H) ≈ 19 · alcohols 16–17 · phenols 10 · carboxylic acids 3–5</b>. The difference between ethane and acetic acid is ~10<sup>45</sup> in Ka.</p><p>The bar on the right in “Graphs” ranks all the compounds; the dotted line marks the pKa of the conjugate acid of the chosen base: an acid <b>below</b> the line is almost completely deprotonated.</p>"],
      ["Carbon hybridization", "Hybridization", "sp ≫ sp² ≫ sp³: more s character, more stable anion",
        "<p>An orbital with more <b>s character</b> is closer to the nucleus and holds the electron pair better: <b>sp (50 % s) &gt; sp² (33 %) &gt; sp³ (25 %)</b>. Thus: <b>ethane 50 → ethene 44 → ethyne 25</b>. That is why the H of a terminal alkyne is removed with NaNH₂, but not with NaOH.</p>"],
      ["Electronegativity and size", 'Electroneg.', "Across a row: C–H < N–H < O–H; down a column: S–H more acidic than O–H",
        "<p>Moving across the period, electronegativity increases and the conjugate base is stabilized: <b>CH₃⁻ (50) &lt; NH₂⁻ (38) &lt; HO⁻ (15.7)</b>. Moving down the group, <b>size and polarizability</b> dominate: S⁻ spreads the charge over a larger volume, so <b>ethanethiol (10.6) is more acidic than ethanol (15.9)</b>.</p>"],
      ["Resonance", "Resonance", "If the charge is delocalized, A⁻ is greatly stabilized",
        "<p>In the <b>alkoxide</b> the charge stays on one O. In the <b>phenoxide</b> it is spread over the ring, and in the <b>carboxylate</b> between two equivalent O atoms: pKa <b>15.9 → 10.0 → 4.76</b>. Each red cloud shows how many atoms share the charge: the more sites, the lower the charge density on each and the greater the stability.</p>"],
      ["Inductive effect", "Inductive", "Nearby electronegative atoms withdraw electron density through σ bonds",
        "<p>Electronegative substituents close to the carboxylate stabilize the charge through the σ bonds (<b>−I inductive effect</b>), and it is <b>additive</b> and <b>decreases with distance</b>. For CH₃COOH → ClCH₂COOH → Cl₂CHCOOH → Cl₃CCOOH: pKa <b>" + f2(a.pka) + ' → ' + f2(CID.cloro.pka) + ' → ' + f2(CID.dicloro.pka) + ' → ' + f2(t.pka) + "</b>. The arrows point toward chlorine.</p>"],
      ["Predicting the equilibrium", "Predict", "K = 10^(pKa of HB − pKa of HA): does it shift toward products?",
        "<p>To know whether a base deprotonates an acid, compare the pKa values: if <b>pKa(HB) &gt; pKa(HA)</b>, the equilibrium favors the products (K &gt; 1). Examples: <b>phenol + HCO₃⁻</b> (6.35 &lt; 10.0): hardly deprotonated; <b>phenol + HO⁻</b>: complete; <b>ethanol + HO⁻</b>: ≈ equilibrium (K ≈ 0.6); <b>propanone + NH₂⁻</b>: complete. With NaOH you get phenoxide, but not acetylide.</p>"]
    ];
  }
  function rebuild(ctx) {
    var c = CID[S.cp], sc = ctx.scene; [gAcid, gBase].forEach(function (g) { if (g) sc.remove(g); });
    gAcid = new T.Group(); gAcid.add(ctx.mol(c.acid, { gs: 1.0, ar: 0.46 })); gAcid.position.x = -6;
    var hp = c.hpos, hh = new T.Mesh(new T.SphereGeometry(0.62, 18, 12), new T.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.45, depthWrite: false })); hh.position.set(hp[1], hp[2], hp[3]); gAcid.add(hh);
    gBase = new T.Group(); gBase.add(ctx.mol(c.base, { gs: 1.0, ar: 0.46 })); gBase.position.x = 6;
    clouds = []; c.share.forEach(function (sh, i) {
      if (!sh) return; var a = c.base.a[i], r = 0.5 + 1.15 * Math.sqrt(sh), m = new T.Mesh(new T.SphereGeometry(r, 22, 16), new T.MeshBasicMaterial({ color: 0xff5c5c, transparent: true, opacity: 0.25 + 0.3 * sh, depthWrite: false }));
      m.position.set(a[1], a[2], a[3]); m.userData = { r: r, sh: sh, i: i }; gBase.add(m); clouds.push(m);
    });
    arrows = [];
    c.acid.a.forEach(function (a, i) { if (c.acid.tag[i] === 'i') { var cc = c.acid.a[c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][0] === i ? c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][1] : c.acid.b.filter(function (b) { return b[0] === i || b[1] === i; })[0][0]]; var from = new T.Vector3(cc[1], cc[2], cc[3]), to = new T.Vector3(a[1], a[2], a[3]), d = to.clone().sub(from), L = d.length(); var ar = new T.ArrowHelper(d.clone().normalize(), from.clone().addScaledVector(d.clone().normalize(), L * 0.25), L * 0.55, 0xffa94d, 0.4, 0.28); gAcid.add(ar); arrows.push(ar); } });
    sc.add(gAcid); sc.add(gBase); key_ = S.cp;
  }
  function setCp(id) { S.cp = id; }
  var def = {
    key: 'acidez-organica-pka', title: "Organic Acidity and pKa", subtitle: "3D simulator · organic chemistry", accent: { dark: '#fb923c', light: '#c2410c' },
    stages: stages, nStages: 7, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 2, 27], target: [0, 0.5, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 27], target: [0, 0.5, 0] }, { id: 'sup', label: "Top", pos: [0, 26, 5], target: [0, 0, 0] }],
    layers: [{ id: 'cloud', label: "Charge cloud", icon: '◉' }, { id: 'ion', label: "Ionization", icon: '⚛' }],
    build: function (ctx) {
      var s = ctx.scene, sg = new T.SphereGeometry(1, 12, 9); dummy = new T.Object3D();
      hA = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0x9aa7b4, roughness: 0.5 }), NP); aA = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xff5c5c, roughness: 0.4 }), NP); hA.frustumCulled = aA.frustumCulled = false; s.add(hA); s.add(aA);
      proton = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xaa8800, roughness: 0.3 })); s.add(proton);
      bSph = new T.Mesh(new T.SphereGeometry(0.9, 22, 16), new T.MeshStandardMaterial({ color: 0x4f8bff, roughness: 0.4, transparent: true, opacity: 0.85 })); bSph.position.set(0, 5.2, 0); s.add(bSph);
      lab.a = ctx.label('', 'bl-warn'); lab.b = ctx.label('', 'bl-lead'); lab.t = ctx.label('', 'bl-d'); lab.n1 = ctx.label('', 'bl-d'); lab.n2 = ctx.label('', 'bl-d'); lab.io = ctx.label('', 'bl-d'); lab.k = ctx.label('', 'bl-pos');
      lab.c = []; for (var i = 0; i < 8; i++) lab.c.push(ctx.label('', 'bl-warn'));
      rebuild(ctx);
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var st = LESSON[f.i], n = st.list.length, ix = Math.min(n - 1, Math.floor(f.local * n)); if (S._st !== f.i || S._ix !== ix) { S._st = f.i; S._ix = ix; S.cp = st.list[ix]; S.b = st.bs[Math.min(ix, st.bs.length - 1)]; S.pH = f.i === 6 ? 7 : st.pH(CID[S.cp]); }
      }
      if (S.cp !== key_) rebuild(ctx);
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b), now = ctx.now;
      // protón: sale del ácido hacia la base; si K<1 vuelve
      var p = (now * 0.3) % 1, hw = new T.Vector3(c.hpos[1] - 6, c.hpos[2], c.hpos[3]), bw = new T.Vector3(0, 4.3, 0), q = Kk >= 1 ? ctx.ease(Math.min(1, p / 0.6)) : Math.sin(Math.min(1, p / 0.8) * Math.PI) * 0.45;
      proton.position.lerpVectors(hw, bw, q); proton.visible = true;
      var land = Kk >= 1 && p > 0.6; bSph.material.color.setHex(land ? 0xff9f43 : 0x4f8bff);
      var cl = ctx.layer('cloud'); clouds.forEach(function (m) { m.visible = cl; var pu = 1 + 0.06 * Math.sin(now * 3 + m.userData.i); m.scale.setScalar(pu); });
      arrows.forEach(function (ar) { ar.visible = ctx.layer('cloud'); });
      // ionización según pH
      var al = alpha(c.pka, S.pH), nA = Math.round(NP * al), io = ctx.layer('ion');
      for (var i = 0; i < NP; i++) { var pp = perm[i], col = pp % 20, row = Math.floor(pp / 20); dummy.position.set((col - 9.5) * 0.9, -5.4 - row * 0.9, 0); dummy.scale.setScalar(0.3); dummy.updateMatrix(); if (i < nA) aA.setMatrixAt(i, dummy.matrix); else hA.setMatrixAt(i - nA, dummy.matrix); }
      aA.count = io ? nA : 0; hA.count = io ? NP - nA : 0; aA.instanceMatrix.needsUpdate = true; hA.instanceMatrix.needsUpdate = true;
      lab.a.pos(-6, 4.3, 0).set('HA · pKa ' + f2(c.pka), 'bl-warn').vis(true); lab.b.pos(6, 4.3, 0).set("A⁻ · charge over " + c.nsite + (c.nsite === 1 ? " atom" : " atoms"), 'bl-lead').vis(true);
      lab.t.pos(0, 7.1, 0).set(b.n + ' · pKa(HB) ' + f2(b.ph), 'bl-d').vis(true);
      lab.n1.pos(-6, -3.1, 0).set(c.n, 'bl-d').vis(true); lab.n2.pos(6, -3.1, 0).set(c.fam, 'bl-d').vis(true);
      lab.k.pos(0, 2.3, 0).set((Kk >= 1 ? '→ ' : '← ') + 'K = ' + sciK(Kk), Kk >= 1 ? 'bl-neg' : 'bl-warn').vis(true);
      lab.io.pos(0, -4.5, 0).set('pH ' + f2(S.pH) + ' · [A⁻] = ' + f1(al * 100) + ' %', 'bl-d').vis(io);
      lab.c.forEach(function (L, k) { var m = clouds[k]; if (m && cl && clouds.length <= 8) { L.pos(6 + m.position.x, m.position.y + m.userData.r + 0.45, m.position.z).set('δ⁻ ' + fmt(m.userData.sh * 100, 0) + ' %', 'bl-warn').vis(true); } else L.vis(false); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cp) u.cp.set(S.cp); if (u.b) u.b.set(S.b); if (!ctx.P.manual && u.pH) u.pH.set(S.pH); },
    hud: function () {
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b);
      return { eq: { chip: 'pKa', name: 'HA + B ⇌ A⁻ + HB', body: "<div class=\"eqline\"><small>Acid</small>" + c.n + '</div><div class="eqline"><small>pKa (HA)</small>' + f2(c.pka) + '</div><div class="eqline"><small>Base</small>' + b.n + " (pKa of HB = " + f2(b.ph) + ')</div><div class="eqline"><small>K</small>' + sciK(Kk) + (Kk >= 1 ? " · favors products" : " · favors reactants") + '</div>' },
        legend: [{ label: "acidic H", color: '#ffd43b', text: "proton that is lost" }, { label: "Cloud", color: '#ff5c5c', text: "negative charge of A⁻" }, { label: "Arrow", color: '#ffa94d', arrow: true, text: "inductive effect (−I)" }] };
    },
    measures: function () { var c = CID[S.cp], b = BID[S.b], Kk = K(c, b); return [["Acid", c.n], ["Type", c.fam], ['pKa', f2(c.pka)], ['Ka', sciK(Math.pow(10, -c.pka))], ['Base', b.n], ["pKa of HB", f2(b.ph)], ["K of the equilibrium", sciK(Kk)], ['ΔG° (25 °C)', f1(dG(c, b)) + ' kJ/mol'], ['pH', f2(S.pH)], ["[A⁻] at that pH", f1(alpha(c.pka, S.pH) * 100) + ' %']]; },
    ideas: ["<b>pKa = −log Ka</b>: lower pKa ⇒ stronger acid. Each unit is a factor of 10 in Ka.", "The more stable the <b>conjugate base</b>, the more acidic the compound: hybridization, electronegativity/size, resonance and induction.", "<b>K = 10<sup>pKa(HB) − pKa(HA)</sup></b>: the equilibrium shifts toward the weaker acid.", "<b>Henderson–Hasselbalch</b>: pH = pKa + log([A⁻]/[HA]); at pH = pKa the acid is 50 % ionized."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Acid"); el.appendChild(c);
      ui.cp = kit.ui.options({ label: "Compound", cols: 3, value: S.cp, options: CP.map(function (x) { return { v: x.id, label: x.n.replace(/ \(.*\)/, ''), sub: 'pKa ' + f2(x.pka) }; }), onChange: function (v) { ctx.goManual(); setCp(v); } }); c.appendChild(ui.cp);
      var b = kit.ui.card("Base and pH"); el.appendChild(b);
      ui.b = kit.ui.options({ label: 'Base', cols: 3, value: S.b, options: BS.map(function (x) { return { v: x.id, label: x.ex, sub: "pKa of HB " + f2(x.ph) }; }), onChange: function (v) { ctx.goManual(); S.b = v; } }); b.appendChild(ui.b);
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.05, value: S.pH, format: function (v) { return f2(v); }, onInput: function (v) { ctx.goManual(); S.pH = v; } }); b.appendChild(kit.ui.sliders([ui.pH]));
      b.appendChild(ctx.btnRow([{ t: "pH = pKa of the acid", fn: function () { ctx.goManual(); S.pH = CID[S.cp].pka; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card("Why it is so"); el.appendChild(t); var tx = document.createElement('p'); tx.className = 'muted small'; t.appendChild(tx); ui.tip = tx;
      ui.refresh = function () { var k2 = S.cp; if (ui._k !== k2) { ui._k = k2; tx.innerHTML = CID[k2].tip; } };
    },
    graphs: [
      { title: "pKa scale", h: 330, note: "Bars: pKa of each compound (shorter = more acidic). The dotted line is the pKa of the conjugate acid of the chosen base.", draw: function (cx, w, h, col) {
        var arr = CP.slice().sort(function (a, b) { return a.pka - b.pka; }), L = 128, R = 34, T0 = 8, rh = (h - T0 - 22) / arr.length, pw = w - L - R, mx = 52, b = BID[S.b];
        cx.font = '10px system-ui'; arr.forEach(function (c, i) { var y = T0 + i * rh, sel = c.id === S.cp; cx.fillStyle = sel ? '#ff9f43' : (c.pka < b.ph ? '#8aa0b4' : '#5b6d7e'); cx.fillRect(L, y + 2, Math.max(2, pw * c.pka / mx), rh - 4); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.n.replace(/ \(.*\)/, ''), L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f2(c.pka), L + pw * c.pka / mx + 4, y + rh / 2 + 3); });
        var xb = L + pw * b.ph / mx; cx.strokeStyle = '#4f8bff'; cx.setLineDash([4, 3]); cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(xb, T0); cx.lineTo(xb, h - 20); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1; cx.fillStyle = '#4f8bff'; cx.textAlign = 'center'; cx.fillText('pKa(HB) = ' + f2(b.ph), Math.min(w - 50, Math.max(L + 40, xb)), h - 6);
      } },
      { title: "Ionization as a function of pH", h: 200, note: "Fraction of A⁻ = 1 / (1 + 10^(pKa − pH)). At pH = pKa it equals 50 %.", draw: function (cx, w, h, col) {
        var c = CID[S.cp], L = 38, R = 12, Tp = 12, B = 30, pw = w - L - R, ph = h - Tp - B, sx = function (p) { return L + pw * p / 14; }, sy = function (a) { return Tp + ph - ph * a; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var y = sy(j / 4); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(Math.round(j * 25) + ' %', L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q2 = 0; q2 <= 14; q2 += 2) cx.fillText(String(q2), sx(q2), h - B + 13); cx.fillText('pH', L + pw / 2, h - 4);
        cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.6; cx.beginPath(); for (var i = 0; i <= 100; i++) { var p = 14 * i / 100, yy = sy(alpha(c.pka, p)); if (i === 0) cx.moveTo(sx(p), yy); else cx.lineTo(sx(p), yy); } cx.stroke(); cx.lineWidth = 1;
        cx.setLineDash([4, 3]); cx.strokeStyle = '#4f8bff'; var xp = sx(Math.min(14, Math.max(0, c.pka))); cx.beginPath(); cx.moveTo(xp, Tp); cx.lineTo(xp, Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#4f8bff'; cx.textAlign = 'left'; cx.fillText('pKa ' + f2(c.pka) + (c.pka > 14 ? " (off scale)" : ''), Math.min(xp + 4, w - 90), Tp + 10);
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.pH), sy(alpha(c.pka, S.pH)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var c = CID[S.cp], b = BID[S.b], Kk = K(c, b), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, al = alpha(c.pka, S.pH), d = b.ph - c.pka;
      return '<div class="card-kicker">' + c.n + ' + ' + b.ex + "</div><div class=\"calc-step\">1 · Equilibrium constant</div><table class=\"calc-table\">" + row('ΔpKa', 'pKa(HB) − pKa(HA) = ' + f2(b.ph) + ' − ' + f2(c.pka) + ' = <b>' + f2(d) + '</b>') + row('K', '10<sup>' + f2(d) + '</sup> = <b>' + sciK(Kk) + '</b>') + row("Conclusion", Kk >= 1 ? "<span class=\"calc-ok\">favors products (A⁻ + HB)</span>" : "<span class=\"calc-hi\">favors reactants (HA + B⁻)</span>") + '</table>' +
        "<div class=\"calc-step\">2 · Free energy</div><table class=\"calc-table\">" + row('ΔG°', "−RT ln K = −5.708 kJ/mol × ΔpKa = <b>" + f1(dG(c, b)) + ' kJ/mol</b>') + '</table>' +
        "<div class=\"calc-step\">3 · Ionization in water at the chosen pH</div><table class=\"calc-table\">" + row('pH', f2(S.pH)) + row('[A⁻]/[HA]', '10<sup>pH − pKa</sup> = 10<sup>' + f2(S.pH - c.pka) + '</sup> = ' + sciK(Math.pow(10, S.pH - c.pka))) + row("Ionized fraction", '<b>' + f1(al * 100) + ' %</b>') + '</table>' + (c.pka > 15.7 ? "<p class=\"muted small\">With pKa &gt; 15.7 water is not suitable as a solvent for A⁻: hydroxide is too weak a base. A stronger base in an aprotic solvent is used.</p>" : '');
    },
    quiz: [
      { q: "Which of these compounds is the strongest acid?", options: ["Trichloroethanoic acid (pKa 0.65)", "Ethanoic acid (pKa 4.76)", "Phenol (pKa 10.0)", "Ethanol (pKa 15.9)"], answer: 0, why: "The lower the pKa, the greater the acidity; the three chlorines stabilize the carboxylate by the inductive effect." },
      { q: "Why is ethyne (pKa 25) much more acidic than ethane (pKa 50)?", options: ["The sp carbanion has 50 % s character: the pair is closer to the nucleus", "The C–H bond of ethyne is longer", "Ethyne has more hydrogens", "Ethane is more polar"], answer: 0, why: "The greater the s character, the more stable the orbital and the less energetic the conjugate base (sp > sp² > sp³)." },
      { q: "Why is phenol (10.0) more acidic than ethanol (15.9)?", options: ["The phenoxide delocalizes the charge into the ring by resonance", "Phenol has more carbon atoms", "Ethanol is a Lewis acid", "Phenol does not form hydrogen bonds"], answer: 0, why: "The O⁻ charge is spread to the ortho and para positions of the ring, stabilizing the conjugate base." },
      { q: "Phenol (pKa 10.0) + HO⁻ (pKa of H₂O = 15.7). What is K?", options: ["≈ 5 × 10⁵ (favors products)", "≈ 2 × 10⁻⁶ (favors reactants)", '≈ 1,6', '≈ 5,7'], answer: 0, why: 'K = 10^(15,7 − 10,0) = 10^5,7 ≈ 5 × 10⁵.' },
      { q: "At pH = pKa, what fraction of the acid is ionized?", options: ['50 %', '10 %', '90 %', '99 %'], answer: 0, why: "At pH = pKa, [A⁻] = [HA] (Henderson–Hasselbalch)." },
      { q: "Acetic acid (pKa 4.76) is in a solution of pH 6.76. What is [A⁻]/[HA]?", options: ['100', '10', '0,01', '2'], answer: 0, why: "log([A⁻]/[HA]) = pH − pKa = 2, so the ratio is 10² = 100 (≈ 99 % ionized)." },
      { q: "Which base can deprotonate ethyne (pKa 25) almost completely?", options: ["NaNH₂ (pKa of NH₃ = 38)", "NaOH (pKa of H₂O = 15.7)", "NaHCO₃ (pKa of H₂CO₃ = 6.35)", "CH₃COONa (pKa 4.76)"], answer: 0, why: "The base must have a conjugate acid with a pKa well above 25; only the amide ion qualifies." },
      { q: "Ethanethiol (10.6) is more acidic than ethanol (15.9), even though S is less electronegative than O. Why?", options: ["S⁻ is larger and more polarizable: it spreads the charge better", "The S–H bond is stronger", "S forms more hydrogen bonds", "Ethanol is more ionized"], answer: 0, why: "Going down the group, size (polarizability) prevails over electronegativity." }
    ],
    help: { intro: "Choose a compound and a base in “Lab”, or follow the lesson. Watch the red cloud of the conjugate base: the more atoms share it, the more stable it is and the more acidic the compound.", items: [["Yellow proton", "leaves the acid toward the base; if K &lt; 1 it goes back to its place."], ["Red cloud", "spreads the negative charge of A⁻ (δ⁻ per atom)."], ["Arrows", "inductive effect toward the halogens."], ["Spheres below", "ionized fraction at the chosen pH (gray HA, red A⁻)."], ["Graphs", "pKa scale and ionization curve."]] }
  };
  MSim.create(def);
})();
