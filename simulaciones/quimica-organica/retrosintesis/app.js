/* Retrosíntesis y síntesis multipaso — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
      var cam = ctx.camera; cam.aspect = w / h; cam.zoom = clamp(cam.aspect / 1.6, 0.4, 1.15) * (w > 900 ? (def.zoom || 1) : 0.9);
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
  var TG = {
    t2m: { n: '2-metil-2-butanol', s: 'O{o}C{a}(C)(C)CC', cls: 'alcohol terciario', R: [
      { d: 'Cortar C–etilo', nuc: 'CCBr{x}', nn: 'EtMgBr', el: 'CC{c}(=O{o})C', en: 'acetona', sy: 'Et⁻ + (CH₃)₂C⁺–O⁻', note: 'Un solo fragmento grande; ambos reactivos son baratos.', ok: 3 },
      { d: 'Cortar C–metilo', nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'CCC{c}(=O{o})C', en: 'butanona', sy: 'CH₃⁻ + CH₃CH₂(CH₃)C⁺–O⁻', note: 'Equivalente al anterior: dos rutas posibles.', ok: 3 }] },
    fe: { n: '1-feniletanol', s: 'O{o}C{a}(C)Ph', cls: 'alcohol secundario', R: [
      { d: 'Cortar C–metilo', nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'O{o}=C{c}Ph', en: 'benzaldehído', sy: 'CH₃⁻ + PhCH⁺–O⁻', note: 'Aldehído aromático: no tiene H en α, no enoliza.', ok: 3 },
      { d: 'Cortar C–fenilo', nuc: 'Br{x}Ph', nn: 'PhMgBr', el: 'CC{c}=O{o}', en: 'acetaldehído', sy: 'Ph⁻ + CH₃CH⁺–O⁻', note: 'El acetaldehído es volátil y enoliza: menos cómodo.', ok: 2 }] },
    pe: { n: '3-pentanol', s: 'O{o}C{a}(CC)CC', cls: 'alcohol secundario simétrico', R: [
      { d: 'Cortar C–etilo', nuc: 'CCBr{x}', nn: 'EtMgBr', el: 'CCC{c}=O{o}', en: 'propanal', sy: 'Et⁻ + CH₃CH₂CH⁺–O⁻', note: 'Las dos desconexiones posibles son idénticas por simetría.', ok: 3 }] },
    fa: { n: 'Ácido fenilacético', s: 'O{o}C{a}(=O)CPh', cls: 'ácido carboxílico', R: [
      { d: 'Cortar CH₂–COOH', nuc: 'Cl{x}CPh', nn: 'PhCH₂MgCl', el: 'O=C{c}=O{o}', en: 'CO₂', sy: 'PhCH₂⁻ + ⁺CO₂⁻', note: 'Sintón de «COOH»: se agrega un carbono con CO₂.', ok: 3 }] },
    fp: { n: '2-fenil-2-propanol', s: 'O{o}C{a}(C)(C)Ph', cls: 'alcohol terciario', R: [
      { d: 'Cortar C–metilo', nuc: 'CBr{x}', nn: 'CH₃MgBr', el: 'CC{c}(=O{o})Ph', en: 'acetofenona', sy: 'CH₃⁻ + PhC⁺(CH₃)–O⁻', note: 'Es la ruta más corta.', ok: 3 },
      { d: 'Cortar C–fenilo', nuc: 'Br{x}Ph', nn: 'PhMgBr', el: 'CC{c}(=O{o})C', en: 'acetona', sy: 'Ph⁻ + (CH₃)₂C⁺–O⁻', note: 'Alternativa equivalente.', ok: 3 },
      { d: 'Desde un éster', nuc: 'CBr{x}', nn: '2 CH₃MgBr', el: 'O{o}=C{c}(OC)Ph', en: 'benzoato de metilo', sy: '2 CH₃⁻ + PhC⁺(OMe)–O⁻', note: 'Dos equivalentes de Grignard añaden dos metilos iguales.', ok: 2 }] }
  };
  var bars = [], S = { t: 't2m', d: 0, p: 0, N: 5, y: 85 }, SG = null, lab = [], arr = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ['Pensar al revés', 'Retrosíntesis', 'Se parte de la molécula objetivo y se desconecta hasta materiales simples',
        '<p>La <b>retrosíntesis</b> (E. J. Corey) parte de la <b>molécula objetivo</b> y la «desarma» mentalmente con una flecha retrosintética <b>⇒</b>, hasta llegar a materiales de partida disponibles. Cada <b>desconexión</b> corta un enlace donde existe una reacción conocida que lo forme. Los fragmentos ideales son <b>sintones</b> (cationes/aniones imaginarios) cuyo <b>equivalente sintético</b> es un reactivo real.</p>'],
      ['Desconectar un alcohol', 'Desconexión C–C', 'El enlace C–C junto al carbono del OH se forma con un Grignard',
        '<p>Un <b>alcohol</b> se desconecta en el enlace C–C vecino al carbono carbinólico: un fragmento es un <b>carbanión</b> (sintón nucleófilo, equivalente <b>R–MgX</b>) y el otro un <b>C=O</b> (sintón electrófilo). Elige objetivo y desconexión y mueve «Avance» para ver cómo se separan los fragmentos.</p>'],
      ['Sintones y equivalentes sintéticos', 'Sintones', 'R⁻ ↔ R–MgBr ; R₂C⁺–O⁻ ↔ R₂C=O',
        '<p>Un sintón no existe: su <b>equivalente sintético</b> sí. <b>R⁻</b> se logra con <b>R–MgBr</b> o R–Li; el sintón <b>⁺C–O⁻</b> (carbonilo polarizado) es el <b>aldehído, la cetona, el éster o el CO₂</b>. A menudo hay <b>varias desconexiones posibles</b>: se elige la que da fragmentos más simples, baratos y sin grupos incompatibles.</p>'],
      ['Interconversión de grupos funcionales', 'IGF', 'Alcohol ⇄ carbonilo ⇄ ácido: se cambia el grupo funcional para poder desconectar',
        '<p>A veces el objetivo no se puede desconectar directamente y se aplica una <b>interconversión de grupos funcionales (IGF)</b>: por ejemplo, un alcohol 2° ⇐ cetona (reducción con NaBH₄), una cetona ⇐ alcohol 2° (oxidación), un ácido ⇐ Grignard + CO₂ o ⇐ oxidación de un alcohol 1°. La IGF encadena pasos de la síntesis.</p>'],
      ['Rendimiento global', 'Rendimiento', 'En una ruta lineal el rendimiento se multiplica: y₁·y₂·…·yₙ',
        '<p>El <b>rendimiento global</b> de una síntesis lineal es el producto de los rendimientos de cada paso: 5 pasos al 85 % dan 0,85⁵ = <b>44 %</b>. Una <b>síntesis convergente</b> prepara fragmentos por separado y los une al final: con el mismo número de pasos pierde menos. Por eso conviene acortar la ruta y ser convergente.</p>']
    ];
  }
  var def = {
    key: 'retrosintesis', title: 'Retrosíntesis y síntesis multipaso', subtitle: 'Simulador 3D · química orgánica avanzada', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 3, 20], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 22], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: 'Centros reactivos', icon: '◎' }],
    build: function (ctx) { SG = MSim.stage(ctx); for (var q = 0; q < 10; q++) { var bx = new T.Mesh(new T.BoxGeometry(1.2, 1, 1.2), new T.MeshStandardMaterial({ color: 0x9775fa, roughness: 0.4 })); bx.visible = false; ctx.scene.add(bx); bars.push(bx); } for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.t = 'fe'; S.d = 0; S.p = 0.1 + 0.2 * f.local; } else if (i === 1) { S.t = ['t2m', 'fe', 'pe', 'fa', 'fp'][Math.min(4, Math.floor(f.local * 5))]; S.d = 0; S.p = (f.local * 5) % 1; } else if (i === 2) { S.t = 'fp'; S.d = Math.min(2, Math.floor(f.local * 3)); S.p = 1; } else if (i === 3) { S.t = 'fp'; S.d = 0; S.p = 0.5; } else { S.N = 2 + Math.round(f.local * 6); } }
      SG.begin(); lab.forEach(function (l) { l.vis(false); });
      var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)], p = S.p, tg = MSim.build(t.s);
      if (i === 3 && !P.manual) { var chain = [['O{o}C{a}(C)(C)Ph', '2-fenil-2-propanol'], ['CC{a}(=O{o})Ph', 'acetofenona'], ['O{o}C{a}(C)Ph', '1-feniletanol']], k = Math.min(2, Math.floor(f.local * 3)); SG.put('ch' + k, MSim.build(chain[k][0]), 0, 0, 0, []); lab[0].pos(0, 4.8, 0).set(chain[k][1], 'bl-lead').vis(true); lab[1].pos(0, -4.8, 0).set(['⇐ Grignard (CH₃MgBr + acetofenona)', '⇐ oxidación del 1-feniletanol (IGF)', '⇐ reducción de la acetofenona (NaBH₄)'][k], 'bl-d').vis(true); return; }
      bars.forEach(function (b) { b.visible = false; }); if (i === 4 && !P.manual) { var y = S.y / 100; for (var k = 0; k < S.N; k++) { var h = 8 * Math.pow(y, k + 1); bars[k].visible = true; bars[k].scale.y = h; bars[k].position.set(-9 + k * 2, -4 + h / 2, 0); } lab[0].pos(0, 5.5, 0).set('Ruta lineal de ' + S.N + ' pasos · rendimiento global ' + fmt(Math.pow(y, S.N) * 100, 1) + ' %', 'bl-lead').vis(true); lab[1].pos(0, -5.4, 0).set('altura = rendimiento acumulado tras cada paso', 'bl-d').vis(true); return; }
      if (p < 0.5) { var g1 = SG.put('t' + S.t, tg, 0, 0, 0, [{ tag: 'a', nth: 0, color: 0xff6b6b, r: 0.8, op: 0.3 }]); g1.position.x = -2 * sm(p / 0.5); lab[0].pos(g1.position.x, 4.8, 0).set(t.n + ' (' + t.cls + ')', 'bl-lead').vis(true); lab[1].pos(g1.position.x, -4.6, 0).set('⇒ ' + d.d, 'bl-d').vis(true); }
      else {
        var q = sm((p - 0.5) / 0.5), nu = MSim.build(d.nuc), el = MSim.build(d.el);
        SG.put('nu' + S.t + S.d, nu, -5 - 2 * q, 0, 0, [{ tag: 'x', nth: 0, color: 0x4dabf7, r: 0.8, op: 0.35 }]); SG.put('el' + S.t + S.d, el, 5 + 2 * q, 0, 0, [{ tag: 'c', nth: 0, color: 0xff6b6b, r: 0.8, op: 0.35 }]);
        lab[0].pos(-7, 4.2, 0).set(d.nn, 'bl-pos').vis(true); lab[1].pos(7, 4.2, 0).set(d.en, 'bl-neg').vis(true); lab[2].pos(0, -4.6, 0).set('sintones: ' + d.sy, 'bl-d').vis(q > 0.3); lab[3].pos(0, 5.6, 0).set('⇒ ' + t.n, 'bl-lead').vis(true);
      }
      SG.halos(ctx.layer('halo'));
    },
    sync: function (ctx) { var u = ctx.ui; if (u.t) u.t.set(S.t); if (u.d) u.d.set(S.d); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)]; return { eq: { chip: '⇒', name: t.n, body: '<div class="eqline"><small>Desconexión</small>' + d.d + '</div><div class="eqline"><small>Nucleófilo</small>' + d.nn + '</div><div class="eqline"><small>Electrófilo</small>' + d.en + '</div><div class="eqline"><small>Sintones</small>' + d.sy + '</div>' }, legend: [{ label: 'Halo azul', color: '#4dabf7', text: 'sintón nucleófilo' }, { label: 'Halo rojo', color: '#ff6b6b', text: 'sintón electrófilo' }] }; },
    measures: function () { var t = TG[S.t], d = t.R[Math.min(S.d, t.R.length - 1)]; return [['Objetivo', t.n], ['Clase', t.cls], ['Desconexión', d.d], ['Reactivos', d.nn + ' + ' + d.en], ['Nota', d.note], ['Pasos / rend. global', S.N + ' pasos · ' + fmt(Math.pow(S.y / 100, S.N) * 100, 1) + ' %']]; },
    ideas: ['Desconecta junto al carbono del OH.', 'Sintón ≠ reactivo: busca el equivalente sintético.', 'Prefiere rutas cortas y convergentes.', 'IGF: alcohol ⇄ carbonilo ⇄ ácido.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Objetivo'); el.appendChild(c);
      ui.t = kit.ui.options({ label: 'Molécula objetivo', cols: 1, value: S.t, options: Object.keys(TG).map(function (k) { return { v: k, label: TG[k].n, sub: TG[k].cls }; }), onChange: function (v) { ctx.goManual(); S.t = v; S.d = 0; } }); c.appendChild(ui.t);
      ui.d = kit.ui.options({ label: 'Desconexión', cols: 1, value: S.d, options: [0, 1, 2].map(function (k) { return { v: k, label: 'Ruta ' + (k + 1) }; }), onChange: function (v) { ctx.goManual(); S.d = Math.min(v, TG[S.t].R.length - 1); } }); c.appendChild(ui.d);
      ui.p = kit.ui.slider({ label: 'Avance de la desconexión', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } });
      var sn = kit.ui.slider({ label: 'N.º de pasos', min: 2, max: 10, step: 1, value: S.N, format: function (v) { return String(v); }, onInput: function (v) { S.N = v; } });
      var sy = kit.ui.slider({ label: 'Rendimiento por paso', min: 50, max: 99, step: 1, value: S.y, format: function (v) { return v + ' %'; }, onInput: function (v) { S.y = v; } });
      c.appendChild(kit.ui.sliders([ui.p, sn, sy])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Rendimiento global frente a n.º de pasos', h: 240, note: 'Líneas: distintos rendimientos por paso. Punto: tu elección.', draw: function (cx, w, h, col) {
      var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 1; i <= 10; i += 1) cx.fillText(i, L + pw * (i - 1) / 9, h - B + 14); cx.fillText('n.º de pasos', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(i * 25 + ' %', L - 4, Tp + ph * (1 - i / 4) + 3);
      [[70, '#fa5252'], [80, '#fab005'], [90, '#69db7c'], [95, '#4dabf7']].forEach(function (a) { cx.strokeStyle = a[1]; cx.lineWidth = 2; cx.beginPath(); for (var n = 1; n <= 10; n++) { var y = Math.pow(a[0] / 100, n); (n > 1 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (n - 1) / 9, Tp + ph * (1 - y)); } cx.stroke(); cx.fillStyle = a[1]; cx.textAlign = 'left'; cx.fillText(a[0] + ' %', L + pw + 2 - 30, Tp + ph * (1 - Math.pow(a[0] / 100, 10)) - 3); });
      cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.N - 1) / 9, Tp + ph * (1 - Math.pow(S.y / 100, S.N)), 5, 0, 6.28); cx.fill();
    } }],
    calc: function () { var y = S.y / 100, lin = Math.pow(y, S.N), half = Math.ceil(S.N / 2), conv = Math.pow(y, half + 1), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">Rendimiento global</div><table class="calc-table">' + row('Ruta lineal (' + S.N + ' pasos)', fmt(y, 2) + '<sup>' + S.N + '</sup> = <b>' + fmt(lin * 100, 1) + ' %</b>') + row('Convergente (2 ramas de ' + half + ' + unión)', fmt(y, 2) + '<sup>' + (half + 1) + '</sup> = <b>' + fmt(conv * 100, 1) + ' %</b>') + row('Mejora', fmt(conv / lin, 2) + ' veces') + row('Masa a partir de 10 g (lineal)', fmt(10 * lin, 2) + ' g (relativos)') + '</table>'; },
    quiz: [
      { q: 'La flecha ⇒ en un análisis retrosintético significa…', options: ['«se puede preparar a partir de»', 'reacciona con', 'equilibrio', 'resonancia'], answer: 0, why: 'Indica la desconexión hacia atrás.' },
      { q: 'El equivalente sintético del sintón R⁻ es…', options: ['R–MgBr', 'R–Br', 'R–OH', 'R⁺'], answer: 0, why: 'Reactivo de Grignard.' },
      { q: 'Un alcohol 3° se desconecta con…', options: ['Grignard + cetona', 'Grignard + CO₂', 'oxidación', 'hidrólisis'], answer: 0, why: 'Cetona + R–MgX.' },
      { q: '5 pasos al 80 % dan un rendimiento global de…', options: ['33 %', '80 %', '40 %', '20 %'], answer: 0, why: '0,8⁵ ≈ 0,33.' },
      { q: 'Una síntesis convergente permite…', options: ['mayor rendimiento global', 'más pasos lineales', 'menos reactivos', 'evitar el análisis'], answer: 0, why: 'Menos pasos en la ruta más larga.' }
    ],
    help: { intro: 'Elige objetivo y ruta; mueve «Avance» para ver cómo la molécula se separa en nucleófilo y electrófilo. Ajusta pasos y rendimientos para el cálculo global.', items: [['Halo azul', 'sintón nucleófilo.'], ['Halo rojo', 'sintón electrófilo.']] }
  };
  MSim.create(def);
})();
