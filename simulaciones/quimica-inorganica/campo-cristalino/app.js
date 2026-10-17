/* Teoría del campo cristalino — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast('La lección controla la simulación'); if (def.onStage) def.onStage(kit.state.stage, ctx); };
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
      var cam = ctx.camera; cam.aspect = w / h; cam.zoom = clamp(cam.aspect / 1.6, 0.5, 1.15) * (w > 900 ? (def.zoom || 1) : 0.9);
      var off = w > 900 ? Math.min(280, w * (def.offset == null ? 0.25 : def.offset)) : 0; if (off) cam.setViewOffset(w, h, -off, 0, w, h); else cam.clearViewOffset();
      cam.updateProjectionMatrix(); ctx.renderer.setSize(w, h); ctx.labelRenderer.setSize(w, h);
    }
    function syncHud() {
      if (!def.hud) return; var h = def.hud(ctx), key = JSON.stringify(h); if (key === lastHud) return; lastHud = key; if (h.eq) kit.setEq(h.eq); if (h.legend) kit.setLegend(h.legend);
    }
    var tabs = [];
    if (def.lab) tabs.push({ id: 'lab', label: 'Lab', build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
    if (def.graphs) tabs.push({ id: 'graf', label: 'Gráficos', build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || 'Cálculo', build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: 'Desafío', build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card('Desafío'); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ('Preguntas de repaso (' + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || 'Simulador 3D', accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ('Visor 3D · ' + def.title),
      stages: STAGES, mainTabLabel: 'Guía', tabs: tabs, measuresTitle: 'Medidas en vivo', measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: 'Etiquetas', icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: 'Libre', pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
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
      help: def.help || { intro: 'Sigue la lección con el reproductor o explora libremente en la pestaña «Lab». Con «Volver a la lección» el guion retoma el control.', items: [] }
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
  var fmt = SimKit.fmt;
  var MET = [
    { id: 'ti3', s: 'Ti', q: 3, d: 1, g: 20300, P: 28000 }, { id: 'v3', s: 'V', q: 3, d: 2, g: 18900, P: 25000 }, { id: 'cr3', s: 'Cr', q: 3, d: 3, g: 17400, P: 28000 },
    { id: 'cr2', s: 'Cr', q: 2, d: 4, g: 13900, P: 23500 }, { id: 'mn3', s: 'Mn', q: 3, d: 4, g: 21000, P: 28000 }, { id: 'fe3', s: 'Fe', q: 3, d: 5, g: 14000, P: 30000 },
    { id: 'fe2', s: 'Fe', q: 2, d: 6, g: 10400, P: 17600 }, { id: 'co2', s: 'Co', q: 2, d: 7, g: 9300, P: 22500 }, { id: 'ni2', s: 'Ni', q: 2, d: 8, g: 8500, P: 25000 },
    { id: 'cu2', s: 'Cu', q: 2, d: 9, g: 12600, P: 25000 }, { id: 'zn2', s: 'Zn', q: 2, d: 10, g: 10000, P: 25000 }];
  var LIG = [
    { id: 'I', t: 'I⁻', f: 0.70, q: -1, bi: 1, col: 0x9a4fd0 }, { id: 'Br', t: 'Br⁻', f: 0.72, q: -1, bi: 1, col: 0xa0522d }, { id: 'Cl', t: 'Cl⁻', f: 0.78, q: -1, bi: 1, col: 0x3ddc5a },
    { id: 'F', t: 'F⁻', f: 0.90, q: -1, bi: 1, col: 0x7ee08a }, { id: 'OH', t: 'OH⁻', f: 0.94, q: -1, bi: 1, col: 0xff4d4d }, { id: 'H2O', t: 'H₂O', f: 1.00, q: 0, bi: 1, col: 0xff6b6b },
    { id: 'NH3', t: 'NH₃', f: 1.25, q: 0, bi: 1, col: 0x4f7cff }, { id: 'en', t: 'en', f: 1.28, q: 0, bi: 2, col: 0x3b5bdb }, { id: 'CN', t: 'CN⁻', f: 2.30, q: -1, bi: 1, col: 0x707a85 }, { id: 'CO', t: 'CO', f: 2.40, q: 0, bi: 1, col: 0x4a525c }];
  var ORB = { z2: 'd_z²', x2: 'd_x²−y²', xy: 'd_xy', xz: 'd_xz', yz: 'd_yz' };
  var ORBL = ['z2', 'x2', 'xy', 'xz', 'yz'];
  var GEO = { oct: 'octaédrica', tet: 'tetraédrica', sq: 'plano-cuadrada' };
  var S = { geo: 'oct', m: 6, lig: 'H2O', orb: 'z2', _st: -1 }, G = {}, labs = {}, key_ = '';
  var SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆'], SUP = { 1: '⁺', 2: '²⁺', 3: '³⁺', '-1': '⁻', '-2': '²⁻', '-3': '³⁻', '-4': '⁴⁻', 0: '' };
  function ligO(id) { return LIG.filter(function (l) { return l.id === id; })[0]; }
  function wl2rgb(w) { var r = 0, g = 0, b = 0; if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else if (w <= 780) { r = 1; } var a = w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : (w > 700 ? 0.3 + 0.7 * (780 - w) / 80 : 1); return [r * a, g * a, b * a]; }
  function levels(geo) {
    if (geo === 'oct') return [['xy', -0.4], ['xz', -0.4], ['yz', -0.4], ['z2', 0.6], ['x2', 0.6]];
    if (geo === 'tet') return [['z2', -0.2667], ['x2', -0.2667], ['xy', 0.1778], ['xz', 0.1778], ['yz', 0.1778]];
    return [['xz', -0.514], ['yz', -0.514], ['z2', -0.428], ['xy', 0.228], ['x2', 1.228]];
  }
  function fill(lv, n, Pu) { var occ = lv.map(function () { return [0, 0]; }); for (var e = 0; e < n; e++) { var best = -1, bc = 1e9; lv.forEach(function (l, i) { var o = occ[i][0] + occ[i][1]; if (o >= 2) return; var c = l[1] + (o ? Pu : 0); if (c < bc - 1e-9) { bc = c; best = i; } }); if (best < 0) break; if (occ[best][0] === 0) occ[best][0] = 1; else occ[best][1] = 1; } return occ; }
  function compute(st) {
    st = st || S; var m = MET[st.m], L = ligO(st.lig), geo = st.geo, Do = m.g * L.f, lv = levels(geo), Pu = m.P / Do, occ = fill(lv, m.d, Pu), un = 0, cf = 0, pr = 0;
    occ.forEach(function (o, i) { if (o[0] + o[1] === 1) un++; if (o[0] && o[1]) pr++; cf += (o[0] + o[1]) * lv[i][1]; });
    var spin = null; if (geo === 'oct' && m.d >= 4 && m.d <= 7) { var hs = { 4: 4, 5: 5, 6: 4, 7: 3 }[m.d]; spin = un === hs ? 'alto espín' : 'bajo espín'; } else if (geo === 'oct') spin = 'sin alternativa (d' + m.d + ')';
    var nl = geo === 'oct' ? 6 : 4, nL = L.bi === 2 ? nl / 2 : nl, Dg = geo === 'tet' ? Do * 4 / 9 : Do, lam = 1e7 / Dg;
    var form = '[' + m.s + (nL > 1 ? '(' + L.t + ')' + SUB[nL] : L.t) + ']' ; var ch = m.q + nl / L.bi * 0 + nL * L.q; if (L.bi === 2) ch = m.q; form = '[' + m.s + (nL > 1 ? '(' + L.t + ')' + SUB[nL] : '(' + L.t + ')') + ']' + (SUP[ch] !== undefined ? SUP[ch] : ch);
    return { m: m, L: L, geo: geo, Do: Do, Dg: Dg, lv: lv, occ: occ, un: un, cf: cf, pr: pr, spin: spin, lam: lam, form: form, ch: ch, Pu: Pu, mu: Math.sqrt(un * (un + 2)), kJ: Dg * 0.011963 };
  }
  function obsColor(c) { if (c.m.d === 10 || c.m.d === 0) return null; var lam = c.lam; if (lam < 380 || lam > 780) return null; var a = wl2rgb(lam), o = a.map(function (x) { return 1 - 0.85 * x; }); return o; }
  function orbGeo(T, id) {
    var nt = 44, np = 64, pos = [], col = [], idx = [], f = { z2: function (x, y, z) { return (3 * z * z - 1) / 2; }, x2: function (x, y, z) { return x * x - y * y; }, xy: function (x, y, z) { return 2 * x * y; }, xz: function (x, y, z) { return 2 * x * z; }, yz: function (x, y, z) { return 2 * y * z; } }[id];
    for (var i = 0; i <= nt; i++) for (var j = 0; j <= np; j++) { var th = Math.PI * i / nt, ph = 2 * Math.PI * j / np, x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph), v = f(x, y, z), r = 2.3 * Math.abs(v); pos.push(x * r, y * r, z * r); if (v >= 0) col.push(0.3, 0.55, 1); else col.push(1, 0.35, 0.35); }
    for (i = 0; i < nt; i++) for (j = 0; j < np; j++) { var a = i * (np + 1) + j, b = a + np + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function ligPos(geo) { var d = 3, r = []; if (geo === 'oct') [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (v) { r.push(v.map(function (k) { return k * d; })); }); else if (geo === 'tet') [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].forEach(function (v) { r.push(v.map(function (k) { return k * d / 1.732; })); }); else [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].forEach(function (v) { r.push(v.map(function (k) { return k * d; })); }); return r; }
  function rebuild(ctx) {
    var T = ctx.T, c = compute(); if (G.g) { ctx.scene.remove(G.g); }
    var g = new T.Group(); G.g = g; var cx = new T.Group(); cx.position.set(-3.6, 0, 0); g.add(cx); G.cx = cx;
    var metal = new T.Mesh(new T.SphereGeometry(0.55, 24, 18), new T.MeshStandardMaterial({ color: (ctx.EL[c.m.s] || [0xd4af37])[0], roughness: 0.3, metalness: 0.4 })); cx.add(metal);
    G.lg = []; ligPos(c.geo).forEach(function (p) { var s = new T.Mesh(new T.SphereGeometry(0.5, 20, 14), new T.MeshStandardMaterial({ color: c.L.col, roughness: 0.45 })); s.position.set(p[0], p[1], p[2]); cx.add(s); G.lg.push(s); var L = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]), b = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, L, 8), new T.MeshStandardMaterial({ color: 0xbfc7d1 })); b.position.set(p[0] / 2, p[1] / 2, p[2] / 2); b.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(p[0], p[1], p[2]).normalize()); cx.add(b); });
    G.orb = new T.Mesh(orbGeo(T, S.orb), new T.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.78, side: T.DoubleSide, roughness: 0.5 })); cx.add(G.orb);
    // ejes
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (v, i) { var a = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 7, 6), new T.MeshBasicMaterial({ color: 0x889099, transparent: true, opacity: 0.5 })); a.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(v[0], v[1], v[2])); cx.add(a); G.ax = G.ax || []; G.ax.push(a); });
    // diagrama
    var dg = new T.Group(); dg.position.set(5.8, 0, 0); g.add(dg); var Gs = c.geo === 'sq' ? 2.6 : 3.4;
    var line = function (x0, y0, x1, y1, col, op) { var L = Math.hypot(x1 - x0, y1 - y0), m = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, L, 6), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op || 1 })); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); m.rotation.z = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2; dg.add(m); return m; };
    line(-3.1, -3.8, -3.1, 3.8, 0x9aa7b4); var tip = new T.Mesh(new T.ConeGeometry(0.12, 0.35, 10), new T.MeshBasicMaterial({ color: 0x9aa7b4 })); tip.position.set(-3.1, 3.9, 0); dg.add(tip);
    line(-2.7, 0, 3.4, 0, 0x6b7785, 0.6);
    var xs = c.geo === 'sq' ? { xz: -1.6, yz: -0.8, z2: 0.4, xy: -0.1, x2: -0.1 } : (c.geo === 'oct' ? { xy: -1.7, xz: -0.4, yz: 0.9, z2: -1.05, x2: 0.25 } : { z2: -1.05, x2: 0.25, xy: -1.7, xz: -0.4, yz: 0.9 });
    G.lvl = {}; c.lv.forEach(function (l, i) { var y = l[1] * Gs, x = xs[l[0]], on = l[0] === S.orb; var bar = new T.Mesh(new T.BoxGeometry(1.0, 0.07, 0.4), new T.MeshStandardMaterial({ color: on ? 0xffd43b : 0xaeb8c4, emissive: on ? 0xb38600 : 0x000000 })); bar.position.set(x, y, 0); dg.add(bar); G.lvl[l[0]] = { x: x, y: y };
      var o = c.occ[i]; [0, 1].forEach(function (k) { if (!o[k]) return; var ar = new T.Group(), cone = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 10), new T.MeshStandardMaterial({ color: k ? 0x74c0fc : 0xffe066 })), sh = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.3, 6), new T.MeshStandardMaterial({ color: k ? 0x74c0fc : 0xffe066 })); cone.position.y = 0.3; sh.position.y = 0.05; ar.add(cone); ar.add(sh); if (k) ar.rotation.z = Math.PI; ar.position.set(x + (k ? 0.22 : -0.22), y + (k ? 0.37 : 0.33), 0); dg.add(ar); }); });
    G.dg = dg; G.Gs = Gs; G.c = c;
    // vial
    var vial = new T.Group(); vial.position.set(-8.8, -3.2, 0); g.add(vial); var o = obsColor(c), colr = o ? new T.Color(o[0], o[1], o[2]) : new T.Color(0.9, 0.93, 0.96);
    var glass = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 2.8, 24, 1, true), new T.MeshStandardMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.22, side: T.DoubleSide })); vial.add(glass);
    var liq = new T.Mesh(new T.CylinderGeometry(0.86, 0.86, 2.0, 24), new T.MeshStandardMaterial({ color: colr, transparent: true, opacity: o ? 0.92 : 0.35, roughness: 0.25 })); liq.position.y = -0.35; vial.add(liq); G.vial = vial;
    ctx.scene.add(g);
  }
  function stages() {
    return [
      ['Los cinco orbitales d', 'Orbitales d', 'Cinco orbitales d con formas distintas', '<p>En un ion libre los cinco orbitales <b>3d</b> tienen la misma energía. Cuatro tienen cuatro lóbulos (<b>d_xy, d_xz, d_yz, d_x²−y²</b>) y uno tiene dos lóbulos más un anillo (<b>d_z²</b>). Los colores indican el signo de la función de onda (azul +, rojo −).</p>'],
      ['Desdoblamiento octaédrico', 'Octaedro', 'Los ligandos repelen más a los orbitales que apuntan hacia ellos', '<p>Con seis ligandos sobre los ejes, los orbitales <b>e_g</b> (d_z², d_x²−y²) apuntan hacia los ligandos y suben de energía; los <b>t₂g</b> (d_xy, d_xz, d_yz) apuntan entre ellos y bajan. La diferencia es <b>Δo</b>. Por el baricentro: t₂g a −0,4 Δo y e_g a +0,6 Δo.</p>'],
      ['Serie espectroquímica', 'Serie', 'Cada ligando produce un Δo distinto', '<p>I⁻ &lt; Br⁻ &lt; Cl⁻ &lt; F⁻ &lt; OH⁻ &lt; H₂O &lt; NH₃ &lt; en &lt; CN⁻ &lt; CO: ligandos de <b>campo débil</b> a <b>campo fuerte</b>. Aquí Cr³⁺ con distintos ligandos: Δo crece y la longitud de onda absorbida disminuye. (Valores aproximados, con el modelo de Jørgensen Δo = f·g.)</p>'],
      ['Alto y bajo espín', 'Espín', 'Compiten Δo y la energía de apareamiento P', '<p>Para d⁴–d⁷ en octaedro: si <b>Δo &lt; P</b> los electrones se reparten en todos los orbitales (<b>alto espín</b>); si <b>Δo &gt; P</b> llenan primero los t₂g (<b>bajo espín</b>). Fe²⁺ (d⁶): con H₂O alto espín (4 electrones desapareados); con CN⁻ bajo espín (diamagnético).</p>'],
      ['Estabilización (CFSE)', 'CFSE', 'La ocupación de los niveles estabiliza el complejo', '<p><b>CFSE = −0,4·n(t₂g) + 0,6·n(e_g)</b> (en Δo). Recorre d¹ → d¹⁰ con H₂O: d³ (−1,2) y d⁸ (−1,2) son muy estables; d⁰, d⁵ (alto espín) y d¹⁰ tienen CFSE = 0. Explica tendencias en radios iónicos y entalpías de hidratación.</p>'],
      ['Color', 'Color', 'El color observado es el complementario del absorbido', '<p>Una transición d–d absorbe luz de energía <b>Δ</b> (λ = 1/Δ). El complejo se ve del <b>color complementario</b>. Cr³⁺ con H₂O absorbe ≈ 575 nm (amarillo-verde) y se ve violeta; con NH₃ o en absorbe a menor λ y el color cambia. Con d⁰ o d¹⁰ no hay transiciones d–d: incoloro (salvo transferencia de carga).</p>'],
      ['Tetraedro y plano cuadrado', 'Geometrías', 'La geometría cambia el patrón de desdoblamiento', '<p>Tetraédrico: el patrón se invierte (e abajo, t₂ arriba) y <b>Δt = 4/9 Δo</b>, siempre alto espín. Plano-cuadrado: d_x²−y² muy alto; con d⁸ y ligandos fuertes (Ni²⁺ + CN⁻) los 8 electrones llenan los cuatro niveles inferiores → <b>diamagnético</b>.</p>']
    ];
  }
  var CYC = ['z2', 'x2', 'xy', 'xz', 'yz'];
  function setLesson(i, loc) {
    if (i === 0) { S.geo = 'oct'; S.m = 0; S.lig = 'H2O'; S.orb = CYC[Math.min(4, Math.floor(loc * 5))]; }
    if (i === 1) { S.geo = 'oct'; S.m = 0; S.lig = 'H2O'; S.orb = loc < 0.5 ? 'x2' : 'xy'; }
    if (i === 2) { S.geo = 'oct'; S.m = 2; S.lig = LIG[Math.min(9, Math.floor(loc * 10))].id; S.orb = 'xy'; }
    if (i === 3) { S.geo = 'oct'; S.m = 6; S.lig = loc < 0.5 ? 'H2O' : 'CN'; S.orb = 'xy'; }
    if (i === 4) { S.geo = 'oct'; S.m = Math.min(10, Math.floor(loc * 11)); S.lig = 'H2O'; S.orb = 'xy'; }
    if (i === 5) { S.geo = 'oct'; S.m = 2; S.lig = ['H2O', 'NH3', 'en', 'CN'][Math.min(3, Math.floor(loc * 4))]; S.orb = 'xy'; }
    if (i === 6) { var k = Math.min(2, Math.floor(loc * 3)); S.geo = ['oct', 'tet', 'sq'][k]; S.m = [8, 7, 8][k]; S.lig = ['H2O', 'Cl', 'CN'][k]; S.orb = 'x2'; }
  }
  var def = {
    key: 'campo-cristalino', title: 'Teoría del campo cristalino', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#a78bfa', light: '#6d28d9' }, stages: stages, nStages: 7, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Completa', pos: [0, 2, 27], target: [-0.5, 0, 0] }, { id: 'complejo', label: 'Complejo', pos: [-3.6, 3, 11], target: [-3.6, 0, 0] }, { id: 'diagrama', label: 'Diagrama', pos: [5.8, 0, 12], target: [5.8, 0, 0] }, { id: 'sup', label: 'Superior', pos: [-3.6, 12, 1], target: [-3.6, 0, 0] }],
    layers: [{ id: 'orb', label: 'Orbital d', icon: '◉' }, { id: 'lig', label: 'Ligandos', icon: '●' }, { id: 'ax', label: 'Ejes', icon: '✛' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { labs.t = ctx.label('', 'bl-lead'); labs.d = ctx.label('', 'bl-d'); labs.g1 = ctx.label('', 'bl-d'); labs.g2 = ctx.label('', 'bl-d'); labs.v = ctx.label('', 'bl-d'); labs.o = ORBL.map(function () { return ctx.label('', 'bl-d'); }); labs.e = ctx.label('E', 'bl-d'); labs.p = ctx.label('', 'bl-warn'); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) setLesson(f.i, f.local);
      var k = S.geo + S.m + S.lig + S.orb; if (k !== key_ || !G.g) { rebuild(ctx); key_ = k; }
      var c = G.c; G.orb.visible = !!ctx.layer('orb'); G.lg.forEach(function (s) { s.visible = !!ctx.layer('lig'); }); (G.ax || []).forEach(function (a) { a.visible = !!ctx.layer('ax'); });
      if (ctx.layer('spin')) G.cx.rotation.y += dt * 0.35; else G.cx.rotation.y *= 0.9;
      var pul = 1 + 0.12 * Math.sin(f.now * 5), eg = (S.orb === 'z2' || S.orb === 'x2') && c.geo === 'oct'; G.lg.forEach(function (s) { s.scale.setScalar(eg ? pul : 1); });
      var m = c.m; labs.t.pos(-3.6, 4.4, 0).set(c.form + ' · ' + GEO[c.geo], 'bl-lead').vis(true);
      labs.d.pos(9.6, 0.1, 0).set('', 'bl-d').vis(false);
      var G_ = G.Gs, lv = G.lvl, groups = c.geo === 'oct' ? [['t₂g', 'xz'], ['e_g', 'x2']] : (c.geo === 'tet' ? [['e', 'x2'], ['t₂', 'xz']] : null);
      if (groups) { var y1 = lv[groups[0][1]].y, y2 = lv[groups[1][1]].y; labs.g1.pos(5.8 + 1.8, y1, 0).set(groups[0][0], 'bl-d').vis(true); labs.g2.pos(5.8 + 1.8, y2, 0).set(groups[1][0], 'bl-d').vis(true); labs.d.pos(5.8 + 0.1, (y1 + y2) / 2, 0).set((c.geo === 'oct' ? 'Δo' : 'Δt') + ' = ' + fmt(c.Dg, 0) + ' cm⁻¹', 'bl-d').vis(true); } else { labs.g1.vis(false); labs.g2.vis(false); labs.d.pos(5.8, 4.4, 0).set('Δo(ref.) = ' + fmt(c.Do, 0) + ' cm⁻¹', 'bl-d').vis(true); }
      ORBL.forEach(function (id, i) { var l = lv[id]; labs.o[i].pos(5.8 + l.x, l.y - 0.45, 0).set(ORB[id].replace('_', ''), 'bl-d').vis(true); });
      labs.e.pos(2.7, 3.9, 0).vis(true);
      var ob = obsColor(c); labs.v.pos(-8.8, -5.4, 0).set(ob ? 'color observado' : (m.d === 10 ? 'd¹⁰: incoloro' : 'absorbe fuera del visible'), 'bl-d').vis(true);
      labs.p.vis(false);
      if (G.vial) { var oo = obsColor(c); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var c = compute(); return { eq: { chip: c.geo === 'oct' ? 'Δo' : (c.geo === 'tet' ? 'Δt' : 'Δo ref.'), name: c.form, body: '<div class="eqline"><small>Configuración</small>d' + c.m.d + (c.spin ? ' · ' + c.spin : '') + '</div><div class="eqline"><small>Desdoblamiento</small>' + fmt(c.Dg, 0) + ' cm⁻¹ (' + fmt(c.kJ, 0) + ' kJ/mol)</div><div class="eqline"><small>Electrones desapareados</small>' + c.un + ' (μ ≈ ' + fmt(c.mu, 2) + ' MB)</div>' }, legend: [{ label: '+', color: '#4d8dff', text: 'lóbulo positivo' }, { label: '−', color: '#ff5959', text: 'lóbulo negativo' }, { label: '↑↓', color: '#ffe066', text: 'electrones (espín)' }] }; },
    measures: function () { var c = compute(); return [['Complejo', c.form], ['Geometría', GEO[c.geo]], ['Configuración', 'd' + c.m.d + (c.spin ? ' (' + c.spin + ')' : '')], ['Δ (cm⁻¹)', fmt(c.Dg, 0)], ['P (cm⁻¹)', fmt(c.m.P, 0)], ['λ de absorción', fmt(c.lam, 0) + ' nm'], ['CFSE', fmt(c.cf, 2) + ' Δo'], ['Desapareados', String(c.un)]]; },
    ideas: ['Los orbitales que <b>apuntan a los ligandos</b> suben de energía.', 'Δo depende del <b>ligando</b> (serie espectroquímica), del <b>metal</b> y de su estado de oxidación.', '<b>Δo &lt; P</b> → alto espín; <b>Δo &gt; P</b> → bajo espín (d⁴–d⁷).', 'Δt = 4/9 Δo: los tetraédricos son siempre de alto espín.', 'El color observado es el complementario del absorbido (λ = 10⁷/Δ nm con Δ en cm⁻¹).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Complejo'); el.appendChild(c);
      ui.geo = kit.ui.options({ label: 'Geometría', cols: 3, value: S.geo, options: [{ v: 'oct', label: 'Octaédrica', sub: 'CN 6' }, { v: 'tet', label: 'Tetraédrica', sub: 'CN 4' }, { v: 'sq', label: 'Plano-cuad.', sub: 'CN 4' }], onChange: function (v) { ctx.goManual(); S.geo = v; } }); c.appendChild(ui.geo);
      ui.m = kit.ui.options({ label: 'Ion metálico', cols: 4, value: S.m, options: MET.map(function (m, i) { return { v: i, label: m.s + (SUP[m.q] || ''), sub: 'd' + m.d }; }), onChange: function (v) { ctx.goManual(); S.m = +v; } }); c.appendChild(ui.m);
      ui.lig = kit.ui.options({ label: 'Ligando (campo débil → fuerte)', cols: 5, value: S.lig, options: LIG.map(function (l) { return { v: l.id, label: l.t }; }), onChange: function (v) { ctx.goManual(); S.lig = v; } }); c.appendChild(ui.lig);
      ui.orb = kit.ui.options({ label: 'Orbital mostrado', cols: 5, value: S.orb, options: ORBL.map(function (o) { return { v: o, label: ORB[o].replace('_', '') }; }), onChange: function (v) { ctx.goManual(); S.orb = v; } }); c.appendChild(ui.orb);
      var lk = ''; ui.refresh = function () { var k = S.geo + S.m + S.lig + S.orb; if (k !== lk) { lk = k; ui.geo.set(S.geo); ui.m.set(S.m); ui.lig.set(S.lig); ui.orb.set(S.orb); } };
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
      var q = kit.ui.card('Desafío: ¿alto o bajo espín?'); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, sc = [0, 0];
      function nextQ() { var cand = []; MET.forEach(function (m, i) { if (m.d >= 4 && m.d <= 7) LIG.forEach(function (l) { cand.push([i, l.id]); }); }); var r = cand[Math.floor(Math.random() * cand.length)]; cur = r; ctx.goManual(); S.geo = 'oct'; S.m = r[0]; S.lig = r[1]; draw(''); }
      function draw(msg) { var h = '<p class="small">Aciertos: <b>' + sc[0] + '</b> / ' + sc[1] + '</p>'; if (cur) { var m = MET[cur[0]], L = ligO(cur[1]); h += '<p class="small">' + m.s + SUP[m.q] + ' (d' + m.d + ') con ' + L.t + '<br>Δo = ' + fmt(m.g * L.f, 0) + ' cm⁻¹ · P = ' + fmt(m.P, 0) + ' cm⁻¹</p>'; } if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; var w = document.createElement('div'); w.style.cssText = 'display:flex;gap:6px'; ['alto espín', 'bajo espín'].forEach(function (a) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = a; b.onclick = function () { if (!cur) { kit.toast('Pulsa «Nuevo»'); return; } var cc = compute(), ok = cc.spin === a; sc[1]++; if (ok) sc[0]++; var r = cc; cur = null; draw(ok ? '¡Correcto! ' + a + ' (' + r.un + ' desapareados)' : 'No: es ' + r.spin + ' (' + r.un + ' desapareados; Δo ' + (r.spin === 'alto espín' ? '<' : '>') + ' P)'); }; w.appendChild(b); }); qb.appendChild(w); qb.appendChild(ctx.btnRow([{ t: 'Nuevo complejo', primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: 'Serie espectroquímica para el ion elegido', h: 270, note: 'Δo = f(ligando)·g(ion) (valores aproximados). La línea punteada es P: a su derecha, bajo espín (solo d⁴–d⁷).', draw: function (cx, w, h, c) {
        var m = MET[S.m], L0 = 70, Tp = 8, B = 24, ph = (h - Tp - B) / LIG.length, mx = Math.max(m.P * 1.15, m.g * 2.5), sx = function (v) { return L0 + (w - L0 - 12) * v / mx; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var v = 0; v <= mx; v += 10000) { cx.beginPath(); cx.moveTo(sx(v), Tp); cx.lineTo(sx(v), h - B); cx.stroke(); cx.fillText(v / 1000, sx(v), h - B + 12); } cx.fillText('Δo (10³ cm⁻¹)', L0 + (w - L0) / 2, h - 2);
        LIG.forEach(function (l, i) { var d = m.g * l.f, y = Tp + i * ph, low = m.d >= 4 && m.d <= 7 && d > m.P; cx.fillStyle = low ? '#e8590c' : '#4c8dff'; cx.globalAlpha = l.id === S.lig ? 1 : 0.6; cx.fillRect(L0, y + 3, sx(d) - L0, ph - 7); cx.globalAlpha = 1; if (l.id === S.lig) { cx.strokeStyle = c.ink; cx.lineWidth = 2; cx.strokeRect(L0, y + 3, sx(d) - L0, ph - 7); cx.lineWidth = 1; } cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(l.t, L0 - 6, y + ph / 2 + 3); });
        if (m.d >= 4 && m.d <= 7) { cx.setLineDash([5, 4]); cx.strokeStyle = '#e03131'; cx.beginPath(); cx.moveTo(sx(m.P), Tp); cx.lineTo(sx(m.P), h - B); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#e03131'; cx.textAlign = 'left'; cx.fillText('P', sx(m.P) + 3, Tp + 10); } } },
      { title: 'CFSE frente a la configuración dⁿ (octaédrico)', h: 230, note: 'Estabilización −CFSE en unidades de Δo, alto y bajo espín; punto negro = ion elegido.', draw: function (cx, w, h, c) {
        var L0 = 36, Tp = 12, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (n) { return L0 + pw * n / 10; }, sy = function (v) { return Tp + ph * (1 - v / 2.6); }, lv = levels('oct');
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var n = 0; n <= 10; n++) { cx.fillText(n, sx(n), h - B + 12); } cx.fillText('nº de electrones d', L0 + pw / 2, h - 2); cx.textAlign = 'right'; for (var v = 0; v <= 2.4; v += 0.4) { cx.beginPath(); cx.moveTo(L0, sy(v)); cx.lineTo(L0 + pw, sy(v)); cx.stroke(); cx.fillText(fmt(v, 1), L0 - 4, sy(v) + 3); }
        [[100, '#4c8dff', 'alto espín'], [0, '#e8590c', 'bajo espín']].forEach(function (cfg, k) { cx.strokeStyle = cfg[1]; cx.fillStyle = cfg[1]; cx.lineWidth = 2; cx.beginPath(); for (var n = 0; n <= 10; n++) { var oc = fill(lv, n, cfg[0]), e = 0; oc.forEach(function (o, i) { e += (o[0] + o[1]) * lv[i][1]; }); var x = sx(n), y = sy(-e); if (n === 0) cx.moveTo(x, y); else cx.lineTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.textAlign = 'left'; cx.fillText(cfg[2], L0 + 6 + k * 90, Tp + 4); });
        var cc = compute({ geo: 'oct', m: S.m, lig: S.lig }); cx.fillStyle = c.ink; cx.beginPath(); cx.arc(sx(cc.m.d), sy(-cc.cf), 5, 0, 7); cx.fill(); } },
      { title: 'Espectro visible y color', h: 190, note: 'Banda de absorción d–d en λ = 10⁷/Δ (nm). Fondo: colores del espectro visible.', draw: function (cx, w, h, c) {
        var cc = compute(), L0 = 10, Tp = 8, B = 28, pw = w - 2 * L0, ph = h - Tp - B, sx = function (l) { return L0 + pw * (l - 380) / 400; };
        for (var l = 380; l <= 780; l += 4) { var r = wl2rgb(l); cx.fillStyle = 'rgb(' + Math.round(r[0] * 255) + ',' + Math.round(r[1] * 255) + ',' + Math.round(r[2] * 255) + ')'; cx.fillRect(sx(l), Tp, pw / 100 + 1, ph); }
        cx.fillStyle = c.muted; cx.font = '10.5px system-ui'; cx.textAlign = 'center'; for (l = 400; l <= 780; l += 100) cx.fillText(l, sx(l), h - B + 13); cx.fillText('λ (nm)', w / 2, h - 3);
        if (cc.lam >= 380 && cc.lam <= 780 && cc.m.d !== 10) { cx.fillStyle = 'rgba(10,10,15,.72)'; cx.beginPath(); for (var x = 380; x <= 780; x += 4) { var y = Tp + ph - ph * 0.92 * Math.exp(-Math.pow((x - cc.lam) / 38, 2)); cx.lineTo(sx(x), y); } cx.lineTo(sx(780), Tp + ph); cx.lineTo(sx(380), Tp + ph); cx.fill(); cx.fillStyle = '#fff'; cx.fillText(fmt(cc.lam, 0) + ' nm', sx(cc.lam), Tp + 14); } else { cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.fillText(cc.m.d === 10 ? 'd¹⁰: sin transiciones d–d' : 'λ = ' + fmt(cc.lam, 0) + ' nm (fuera del visible)', w / 2, Tp + ph / 2); } } },
      { title: 'Patrones de desdoblamiento por geometría', h: 230, note: 'Energías de los orbitales d en unidades de Δo (campo esférico = 0). Tetraédrico: Δt = 4/9 Δo.', draw: function (cx, w, h, c) {
        var gs = ['oct', 'tet', 'sq'], T = 22, B = 18, ph = h - T - B, sy = function (e) { return T + ph / 2 - e * ph / 3.1; };
        gs.forEach(function (g, gi) { var x0 = 14 + gi * (w - 28) / 3, wd = (w - 28) / 3 - 10, on = g === S.geo; cx.fillStyle = on ? c.ink : c.muted; cx.font = (on ? 'bold ' : '') + '11px system-ui'; cx.textAlign = 'center'; cx.fillText(GEO[g], x0 + wd / 2, 13); cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(x0, sy(0)); cx.lineTo(x0 + wd, sy(0)); cx.stroke(); var lv = levels(g), cnt = {}; lv.forEach(function (l) { var k = l[1].toFixed(3); cnt[k] = (cnt[k] || 0) + 1; }); var seen = {}; lv.forEach(function (l) { var k = l[1].toFixed(3), i = seen[k] || 0; seen[k] = i + 1; var tot = cnt[k], bw = wd / 3.4, x = x0 + wd / 2 + (i - (tot - 1) / 2) * (bw + 4) - bw / 2; cx.strokeStyle = on ? '#7048e8' : '#9aa7b4'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, sy(l[1])); cx.lineTo(x + bw, sy(l[1])); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = c.muted; cx.font = '9.5px system-ui'; cx.fillText(ORB[l[0]].replace('_', '').replace('d', ''), x + bw / 2, sy(l[1]) - 4); }); }); } }
    ],
    calc: function () {
      var c = compute(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, nt = c.occ.reduce(function (a, o, i) { return a + (c.lv[i][1] < (c.geo === 'sq' ? 0 : (c.geo === 'oct' ? 0 : 0)) ? o[0] + o[1] : 0); }, 0);
      var lo = 0, hi = 0; c.occ.forEach(function (o, i) { var cnt = o[0] + o[1]; if (c.geo === 'oct') { if (c.lv[i][1] < 0) lo += cnt; else hi += cnt; } else if (c.geo === 'tet') { if (c.lv[i][1] < 0) lo += cnt; else hi += cnt; } });
      var conf = c.geo === 'oct' ? 't₂g' + (lo ? '<sup>' + lo + '</sup>' : '⁰') + ' e_g<sup>' + hi + '</sup>' : (c.geo === 'tet' ? 'e<sup>' + lo + '</sup> t₂<sup>' + hi + '</sup>' : 'd<sup>' + c.m.d + '</sup>');
      return '<div class="card-kicker">' + c.form + ' · ' + GEO[c.geo] + '</div><div class="calc-step">1 · Desdoblamiento</div><table class="calc-table">' + row('Δo = f·g', fmt(c.L.f, 2) + ' × ' + fmt(c.m.g, 0) + ' = ' + fmt(c.Do, 0) + ' cm⁻¹') + (c.geo === 'tet' ? row('Δt = 4/9 Δo', fmt(c.Dg, 0) + ' cm⁻¹') : '') + row('En kJ/mol', fmt(c.kJ, 1)) + row('Longitud de onda', fmt(c.lam, 0) + ' nm') + '</table><div class="calc-step">2 · Ocupación</div><table class="calc-table">' + row('Configuración', 'd<sup>' + c.m.d + '</sup> → ' + conf) + row('P (apareamiento)', fmt(c.m.P, 0) + ' cm⁻¹ (' + (c.Do < c.m.P ? 'Δo < P' : 'Δo > P') + ')') + row('Espín', c.spin || '—') + row('Desapareados', c.un + ' · μ_s = √(n(n+2)) = ' + fmt(c.mu, 2) + ' MB') + '</table><div class="calc-step">3 · Estabilización</div><table class="calc-table">' + row('CFSE', fmt(c.cf, 2) + ' Δo = ' + fmt(c.cf * c.Do, 0) + ' cm⁻¹') + row('Pares', String(c.pr)) + '</table>';
    },
    calcLabel: 'Cálculo',
    quiz: [
      { q: 'En un complejo octaédrico, los orbitales que suben de energía son…', options: ['d_z² y d_x²−y² (e_g)', 'd_xy, d_xz, d_yz (t₂g)', 'todos por igual', 'solo d_z²'], answer: 0, why: 'Los e_g apuntan directamente hacia los ligandos y sufren más repulsión.' },
      { q: 'Según la serie espectroquímica, ¿qué ligando produce mayor Δo?', options: ['CN⁻', 'H₂O', 'Cl⁻', 'I⁻'], answer: 0, why: 'CN⁻ es de campo fuerte (π aceptor); I⁻ es de campo muy débil.' },
      { q: 'Fe²⁺ (d⁶) con CN⁻ en campo octaédrico tiene…', options: ['0 electrones desapareados', '4 electrones desapareados', '2 electrones desapareados', '6 electrones desapareados'], answer: 0, why: 'Δo > P: t₂g⁶, bajo espín y diamagnético.' },
      { q: 'La CFSE de un octaédrico d³ es…', options: ['−1,2 Δo', '−0,6 Δo', '0', '−0,4 Δo'], answer: 0, why: 'Tres electrones en t₂g: 3 × (−0,4) = −1,2 Δo.' },
      { q: 'La relación entre Δt y Δo es…', options: ['Δt = 4/9 Δo', 'Δt = Δo', 'Δt = 9/4 Δo', 'Δt = 2Δo'], answer: 0, why: 'Con solo 4 ligandos y sin orbitales apuntando a ellos, el desdoblamiento es menor.' },
      { q: 'Un complejo absorbe luz amarilla (≈ 580 nm); se ve…', options: ['violeta / azul', 'rojo', 'verde', 'incoloro'], answer: 0, why: 'El color observado es el complementario del absorbido: amarillo → violeta.' },
      { q: '[Ni(CN)₄]²⁻ es diamagnético porque…', options: ['es plano-cuadrado d⁸ de bajo espín', 'es tetraédrico d⁸', 'Ni²⁺ es d¹⁰', 'CN⁻ es de campo débil'], answer: 0, why: 'En plano-cuadrado el d_x²−y² queda vacío y los 8 electrones están apareados.' },
      { q: 'Si Δo < P en un octaédrico d⁵, la configuración es…', options: ['t₂g³ e_g² (alto espín, 5 desapareados)', 't₂g⁵ (1 desapareado)', 't₂g⁴ e_g¹', 'e_g⁵'], answer: 0, why: 'Con Δo < P es más barato ocupar los e_g que aparear.' }
    ],
    help: { intro: 'Elige geometría, ion y ligando en «Lab»; a la izquierda ves el complejo con el orbital d, a la derecha el diagrama de energía con electrones.', items: [['Orbital d', 'ver su forma y si apunta a los ligandos.'], ['Diagrama', 'niveles, Δ y ocupación con flechas de espín.'], ['Frasco', 'color observado de la disolución.'], ['Desafío', 'decide alto o bajo espín.']] }
  };
  MSim.create(def);
})();
