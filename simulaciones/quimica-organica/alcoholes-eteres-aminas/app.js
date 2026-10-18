/* Alcoholes, éteres y aminas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var M = {
    propano: { n: 'Propano', f: 'CH₃CH₂CH₃', s: 'CCC', M: 44.1, bp: -42, mu: 0.08, cl: 'alcano', don: 0, acc: 0 },
    dme: { n: 'Éter dimetílico', f: 'CH₃OCH₃', s: 'CO{o}C', M: 46.07, bp: -24.8, mu: 1.3, cl: 'éter', don: 0, acc: 1, k: 'O' },
    etoh: { n: 'Etanol', f: 'CH₃CH₂OH', s: 'CCO{o+}', M: 46.07, bp: 78.4, mu: 1.69, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    proh: { n: 'Propan-1-ol', f: 'CH₃CH₂CH₂OH', s: 'CCCO{o+}', M: 60.1, bp: 97.2, mu: 1.68, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    pram: { n: 'Propilamina', f: 'CH₃CH₂CH₂NH₂', s: 'CCCN{o+}', M: 59.11, bp: 47.8, mu: 1.17, cl: 'amina 1ª', don: 2, acc: 1, k: 'N' },
    dma: { n: 'Dimetilamina', f: '(CH₃)₂NH', s: 'CN{o+}C', M: 45.08, bp: 7, mu: 1.03, cl: 'amina 2ª', don: 1, acc: 1, k: 'N' },
    tma: { n: 'Trimetilamina', f: '(CH₃)₃N', s: 'CN{o}(C)C', M: 59.11, bp: 2.9, mu: 0.61, cl: 'amina 3ª', don: 0, acc: 1, k: 'N' },
    nh3: { n: 'Amoníaco', f: 'NH₃', s: 'N{o+}', M: 17.03, bp: -33.3, mu: 1.47, cl: 'amoníaco', don: 3, acc: 1, k: 'N' },
    mea: { n: 'Metilamina', f: 'CH₃NH₂', s: 'CN{o+}', M: 31.06, bp: -6.3, mu: 1.31, cl: 'amina 1ª', don: 2, acc: 1, k: 'N' },
    anil: { n: 'Anilina', f: 'C₆H₅NH₂', s: 'N{o+}Ph', M: 93.13, bp: 184, mu: 1.53, cl: 'amina aromática', don: 2, acc: 1, k: 'N' },
    c1: { n: 'Metanol', f: 'CH₃OH', s: 'CO{o+}', M: 32.04, bp: 64.7, mu: 1.7, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c4: { n: 'Butan-1-ol', f: 'C₄H₉OH', s: 'CCCCO{o+}', M: 74.12, bp: 117.7, mu: 1.66, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c5: { n: 'Pentan-1-ol', f: 'C₅H₁₁OH', s: 'CCCCCO{o+}', M: 88.15, bp: 138, mu: 1.7, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c6: { n: 'Hexan-1-ol', f: 'C₆H₁₃OH', s: 'CCCCCCO{o+}', M: 102.2, bp: 157, mu: 1.65, cl: 'alcohol', don: 1, acc: 1, k: 'O' }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var AL = ['c1', 'etoh', 'proh', 'c4', 'c5', 'c6'], SOL = { c1: 100, etoh: 100, proh: 100, c4: 7.4, c5: 2.2, c6: 0.59 };
  var PK = { nh3: 9.25, mea: 10.62, dma: 10.73, tma: 9.8, anil: 4.6 };
  var S = { a: 'etoh', b: 'etoh', dimer: false, q: 0, hp: false, _st: -1 }, lab = {}, SG, prot, hbs = [], NH = 9;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ['Polaridad', 'Polaridad', 'C–O y C–N son enlaces polares: alcoholes, éteres y aminas tienen momento dipolar',
        '<p>El O (χ = 3,5) y el N (3,0) son más electronegativos que el C (2,5): los enlaces C–O, C–N, O–H y N–H son <b>polares</b> y las moléculas tienen <b>momento dipolar</b> (μ): propano 0,08 D · éter dimetílico 1,30 D · etanol 1,69 D · propilamina 1,17 D. Las fuerzas intermoleculares dipolo–dipolo explican gran parte de sus propiedades; pero lo más importante es la capacidad de formar <b>puentes de hidrógeno</b>.</p>'],
      ['Puentes de hidrógeno', 'Puentes de H', 'Donor: O–H o N–H · aceptor: par libre de O o N',
        '<p>Un <b>puente de hidrógeno</b> une un H unido a O o N (<b>donor</b>) con el par libre de otro O o N (<b>aceptor</b>); la energía es ≈ 15–30 kJ/mol, entre un enlace covalente y las fuerzas de dispersión. Los <b>alcoholes</b> son donores y aceptores; las <b>aminas 1ª y 2ª</b> también (más débiles porque el N es menos electronegativo); los <b>éteres</b> y las <b>aminas 3ª</b> sólo son <b>aceptores</b> y no se asocian entre sí.</p>'],
      ['Puntos de ebullición', 'P. de ebullición', 'Alcohol ≫ amina ≫ éter ≈ alcano de masa similar',
        '<p>Para masas molares parecidas (≈ 46 g/mol): <b>propano −42 °C</b> (sólo dispersión) · <b>éter dimetílico −25 °C</b> (dipolo) · <b>etanol +78 °C</b> (puentes de H intensos). Las aminas 1ª y 2ª hierven entre los éteres y los alcoholes: la <b>propilamina (48 °C)</b> frente al propan-1-ol (97 °C). La <b>trimetilamina (3 °C)</b>, sin N–H, hierve mucho menos que sus isómeros.</p>'],
      ['Solubilidad en agua', 'Solubilidad', 'El grupo –OH es hidrofílico; la cadena alquílica, hidrofóbica',
        '<p>El grupo polar forma puentes de H con el agua (hidrofílico), mientras que la cadena hidrocarbonada (hidrofóbica) los rompe sin compensación. Resultado: <b>metanol, etanol y propan-1-ol</b> son miscibles en agua; la solubilidad cae a <b>7,4 g/100 mL</b> (butanol), <b>2,2</b> (pentanol), <b>0,6</b> (hexanol). Las aminas de bajo peso son solubles; las de más de 6 C, poco.</p>'],
      ['Basicidad de las aminas', 'Basicidad', 'El par libre del N acepta H⁺: R₃N + H⁺ ⇌ R₃NH⁺',
        '<p>Las aminas son <b>bases débiles</b> y <b>nucleófilos</b> por el par libre del N. La fuerza se compara con el <b>pKa del ácido conjugado</b> (pKaH): NH₃ 9,25 · CH₃NH₂ 10,62 · (CH₃)₂NH 10,73 · (CH₃)₃N 9,80. Los alquilos <b>donan electrones</b> y estabilizan el catión; en la fase acuosa la 3ª pierde por solvatación y por impedimento. La <b>anilina</b> (pKaH 4,6) es mucho menos básica porque el par libre se deslocaliza en el anillo.</p>'],
      ['Reactividad comparada', 'Reactividad', 'Alcohol: ácido débil, nucleófilo, deshidratable · éter: inerte · amina: base y nucleófilo',
        '<p>El <b>alcohol</b> es un ácido muy débil (pKa ≈ 16), se oxida, se deshidrata con H₂SO₄ y su OH se sustituye con HX (protonado como buen grupo saliente). El <b>éter</b> es muy poco reactivo (por eso se usa de disolvente) y sólo se rompe con HI/HBr concentrados. La <b>amina</b> es base y nucleófilo: se alquila, se acila y forma sales. Compáralo en la matriz de «Gráficos».</p>']
    ];
  }
  function hIdx(g) { for (var i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === 'o') return i; } return -1; }
  var SEG = [['propano', 'dme', 'etoh', 'pram'], ['etoh', 'pram', 'dme', 'tma'], ['propano', 'dme', 'pram', 'etoh'], AL, ['nh3', 'mea', 'dma', 'tma', 'anil'], ['etoh', 'dme', 'dma']];
  var def = {
    key: 'alcoholes-eteres-aminas', title: 'Alcoholes, éteres y aminas', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#4ade80', light: '#15803d' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 3, 17], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0.5, 17], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 17, 2], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: 'Zona polar (O/N)', icon: '◎' }, { id: 'hb', label: 'Puente de H', icon: '┄' }],
    build: function (ctx) {
      SG = MSim.stage(ctx);
      Object.keys(M).forEach(function (k) { SG.put(k, G[k], 0, 0, 0, { gs: 1.2, halos: M[k].k ? [{ tag: 'o', r: 0.8 }] : [] }); SG.put(k + 'B', G[k], 0, 0, 0, { gs: 1.2, halos: [] }); });
      var sg = new T.SphereGeometry(0.11, 8, 6), mt = new T.MeshBasicMaterial({ color: 0xffd43b }); for (var i = 0; i < NH; i++) { var m = new T.Mesh(sg, mt); m.visible = false; ctx.scene.add(m); hbs.push(m); }
      prot = new T.Mesh(new T.SphereGeometry(0.28, 14, 10), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xaa8800 })); ctx.scene.add(prot);
      ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local, sq = SEG[i], n = sq.length, ix = Math.min(n - 1, Math.floor(l * n)); S._st = i; S.a = sq[ix]; S.dimer = i === 1; S.hp = false; S.q = sm(((l * n) % 1));
        if (i === 1) { var pairs = [['etoh', 'etoh'], ['pram', 'pram'], ['dme', 'etoh'], ['tma', 'tma']]; S.a = pairs[ix][0]; S.b = pairs[ix][1]; }
      }
      var m = M[S.a]; SG.begin(); var gs = 1.2, halo = ctx.layer('halo'), hbOn = ctx.layer('hb') && S.dimer, nShow = 0;
      hbs.forEach(function (h) { h.visible = false; }); prot.visible = false;
      if (S.dimer) {
        var gA = SG.put(S.a, G[S.a], -4.5, 0, 0, { gs: gs }), hi = hIdx(G[S.a]);
        gA.rotation.set(0, 0, 0); gA.updateMatrixWorld(true);
        var oA = MSim.idx(G[S.a], 'o', 0), hA = hi >= 0 ? hi : oA, pO = MSim.wp(gA, G[S.a], oA, gs), pH = MSim.wp(gA, G[S.a], hA, gs), d = pH.clone().sub(pO).normalize();
        var bk = S.b + 'B', gB = SG.put(bk, G[S.b], 4.5, 0, 0, { gs: gs }), oB = MSim.idx(G[S.b], 'o', 0), tgt = pH.clone().addScaledVector(d, 1.9 * 0.85);
        if (hi >= 0) { MSim.dock(gB, G[S.b], oB, tgt, d, gs); }
        gA.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; }); gB.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; });
        if (hbOn && hi >= 0) { for (var k = 0; k < NH; k++) { var u = (k + 0.5) / NH, p = pH.clone().lerp(tgt, u); p.y += 0.05 * Math.sin(now * 6 + k); hbs[k].position.copy(p); hbs[k].visible = true; hbs[k].scale.setScalar(0.9 + 0.5 * Math.sin(now * 5 - k)); } }
        lab.t.pos(0, 5.5, 0).set(hi >= 0 ? M[S.a].n + ' · · · ' + M[S.b].n : M[S.a].n + ' (sin N–H/O–H donor)', 'bl-lead').vis(true);
        lab.a.pos(0, -4.3, 0).set(hi >= 0 ? 'puente de H  O–H···' + (M[S.b].k || 'O') + '  ≈ ' + (M[S.a].k === 'N' ? '10–20' : '20–30') + ' kJ/mol' : 'solo dipolo–dipolo: no forma puentes consigo misma', hi >= 0 ? 'bl-pos' : 'bl-warn').vis(true);
        lab.b.pos(0, -5.3, 0).set('p. eb. ' + M[S.a].bp + ' °C · donores: ' + M[S.a].don + ' · aceptores: ' + M[S.a].acc, 'bl-d').vis(true);
      } else {
        var g = SG.put(S.a, G[S.a], 0, 0, 0, { gs: gs * 1.15 }); g.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; }); g.scale.setScalar(1);
        if (f && f.i === 4 || (P.manual && S.hp)) { var nI = MSim.idx(G[S.a], 'o', 0), pn = MSim.wp(g, G[S.a], nI, gs * 1.15); var far = pn.clone().add(new T.Vector3(0, 4.2, 0)); prot.position.lerpVectors(far, pn.clone().add(new T.Vector3(0, 0.95, 0)), S.q); prot.visible = true; }
        lab.t.pos(0, 5.4, 0).set(m.n + ' · ' + m.f, 'bl-lead').vis(true);
        lab.a.pos(0, -4.0, 0).set(m.cl + ' · μ = ' + f2(m.mu) + ' D · M = ' + f1(m.M) + ' g/mol', 'bl-d').vis(true);
        var extra = (f && f.i === 4) || S.hp ? 'pKaH = ' + (PK[S.a] != null ? PK[S.a] : '—') : (f && f.i === 3) || AL.indexOf(S.a) >= 0 && f && f.i === 3 ? 'solubilidad: ' + (SOL[S.a] >= 100 ? 'miscible' : SOL[S.a] + ' g/100 mL') : 'p. eb. ' + m.bp + ' °C · donores ' + m.don + ' · aceptores ' + m.acc;
        lab.b.pos(0, -5.0, 0).set(extra, 'bl-pos').vis(true);
      }
      lab.c.vis(false); lab.d.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.a) u.a.set(S.a); if (u.b) u.b.set(S.b); },
    hud: function () { var m = M[S.a]; return { eq: { chip: 'R–X', name: m.n, body: '<div class="eqline"><small>Clase</small>' + m.cl + '</div><div class="eqline"><small>μ</small>' + f2(m.mu) + ' D</div><div class="eqline"><small>p. eb.</small>' + m.bp + ' °C</div><div class="eqline"><small>Donores / aceptores</small>' + m.don + ' / ' + m.acc + '</div>' }, legend: [{ label: 'Halo', color: '#ffd43b', text: 'zona polar (O o N)' }, { label: '···', color: '#ffd43b', text: 'puente de hidrógeno' }] }; },
    measures: function () { var m = M[S.a]; return [['Compuesto', m.n], ['Clase', m.cl], ['Masa molar', f1(m.M) + ' g/mol'], ['Momento dipolar', f2(m.mu) + ' D'], ['Punto de ebullición', m.bp + ' °C'], ['Donores / aceptores de H', m.don + ' / ' + m.acc], ['pKaH', PK[S.a] != null ? String(PK[S.a]) : '—']]; },
    ideas: ['<b>Puente de H</b>: H–O/N···:O/N. Alcohol y amina 1ª/2ª: donor y aceptor.', 'Éter y amina 3ª: sólo aceptores.', 'p. eb.: alcohol ≫ amina ≫ éter ≈ alcano.', 'La cadena alquílica reduce la solubilidad en agua.', 'Amina: base y nucleófilo (par libre del N).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Compuesto'); el.appendChild(c);
      ui.a = kit.ui.options({ label: 'Molécula (donor)', cols: 3, value: S.a, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].n, sub: M[k].cl }; }), onChange: function (v) { ctx.goManual(); S.a = v; S.q = 0; } }); c.appendChild(ui.a);
      ui.b = kit.ui.options({ label: 'Molécula (aceptor, en dímero)', cols: 3, value: S.b, options: ['etoh', 'pram', 'dme', 'tma', 'nh3'].map(function (k) { return { v: k, label: M[k].n, sub: M[k].cl }; }), onChange: function (v) { ctx.goManual(); S.b = v; S.dimer = true; } }); c.appendChild(ui.b);
      c.appendChild(ctx.btnRow([{ t: 'Formar puente de H', primary: true, fn: function () { ctx.goManual(); S.dimer = true; } }, { t: 'Molécula sola', fn: function () { ctx.goManual(); S.dimer = false; S.hp = false; } }, { t: 'Acercar H⁺', fn: function () { ctx.goManual(); S.dimer = false; S.hp = true; S.q = 0; var t0 = performance.now(); (function s() { var k = Math.min(1, (performance.now() - t0) / 2200); S.q = sm(k); if (k < 1) requestAnimationFrame(s); })(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Punto de ebullición frente a masa molar', h: 240, note: 'Para masas similares, la capacidad de formar puentes de H eleva el p. eb. (alcohol ≫ amina ≫ éter/alcano).', draw: function (cx, w, h, col) {
        var keys = Object.keys(M).filter(function (k) { return AL.indexOf(k) < 0 || true; }), L = 44, Rr = 12, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (v) { return L + pw * v / 110; }, sy = function (v) { return Tp + ph - ph * (v + 60) / 260; }, i;
        cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; for (i = -50; i <= 200; i += 50) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 5, sy(i) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 100; i += 25) cx.fillText(i, sx(i), h - B + 13); cx.fillText('M (g/mol)  ·  p. eb. (°C)', L + pw / 2, h - 4);
        var cc = { alcohol: '#4ade80', éter: '#4dabf7', alcano: '#adb5bd' }; keys.forEach(function (k) { var m = M[k], c = m.cl === 'alcohol' ? cc.alcohol : (m.cl === 'éter' ? cc['éter'] : (m.cl === 'alcano' ? cc.alcano : '#ff922b')); cx.fillStyle = c; cx.beginPath(); cx.arc(sx(m.M), sy(m.bp), k === S.a ? 6.5 : 4, 0, 7); cx.fill(); if (k === S.a) { cx.strokeStyle = col.ink; cx.stroke(); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(m.n, sx(m.M) + 8, sy(m.bp) - 5); } });
        cx.textAlign = 'left'; [['alcohol', '#4ade80'], ['éter', '#4dabf7'], ['alcano', '#adb5bd'], ['amina', '#ff922b']].forEach(function (a, k) { cx.fillStyle = a[1]; cx.fillText('● ' + a[0], L + 6 + k * 62, Tp + 8); });
      } },
      { title: 'Solubilidad en agua de los alcoholes', h: 210, note: 'log₁₀ de g/100 mL (miscibles = 2). La cadena hidrofóbica reduce la solubilidad.', draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / AL.length, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = -1; i <= 2; i++) { var y = Tp + ph - ph * (i + 1) / 3; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; AL.forEach(function (k, j) { var v = Math.log10(Math.min(100, SOL[k])), hh = ph * (v + 1) / 3; cx.fillStyle = k === S.a ? '#ff6b3d' : '#4ade80'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText('C' + (j + 1), L + j * bw + bw / 2, h - B + 13); });
      } },
      { title: 'Basicidad (pKaH) de aminas', h: 190, note: 'pKa del ácido conjugado R₃NH⁺: mayor valor = base más fuerte.', draw: function (cx, w, h, col) {
        var ks = ['nh3', 'mea', 'dma', 'tma', 'anil'], L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ks.length, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 12; i += 4) { var y = Tp + ph - ph * i / 12; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; ks.forEach(function (k, j) { var hh = ph * PK[k] / 12; cx.fillStyle = k === S.a ? '#ff6b3d' : '#4ade80'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.ink; cx.fillText(PK[k], L + j * bw + bw / 2, Tp + ph - hh - 4); cx.fillStyle = col.muted; cx.fillText(M[k].f.replace(/C₆H₅NH₂/, 'PhNH₂'), L + j * bw + bw / 2, h - B + 13); });
      } },
      { title: 'Reactividad: matriz', h: 190, note: '✓ reacciona · — no reacciona en condiciones normales.', draw: function (cx, w, h, col) {
        var rows = ['Ácido (Na, base)', 'HX → R–X', 'Deshidratación H₂SO₄', 'Oxidación [O]', 'Alquilación / acilación', 'Protonación (H⁺)'], cols = ['alcohol', 'éter', 'amina'], T2 = [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1]], L = 130, Tp = 22, cw = (w - L - 6) / 3, rh = (h - Tp - 6) / rows.length;
        cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted; cols.forEach(function (c, j) { cx.fillText(c, L + j * cw + cw / 2, 14); }); rows.forEach(function (r, i) { cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.fillText(r, L - 6, Tp + i * rh + rh / 2 + 3); cols.forEach(function (c, j) { cx.fillStyle = T2[i][j] ? 'rgba(74,222,128,.7)' : 'rgba(134,142,150,.25)'; cx.fillRect(L + j * cw + 2, Tp + i * rh + 2, cw - 4, rh - 4); cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(T2[i][j] ? '✓' : '—', L + j * cw + cw / 2, Tp + i * rh + rh / 2 + 3); }); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = M[S.a], extra = '';
      if (PK[S.a] != null) { var pk = PK[S.a], Kb = Math.pow(10, -(14 - pk)); extra = '<div class="calc-step">Basicidad</div><table class="calc-table">' + row('pKaH', pk) + row('Ka (R₃NH⁺)', MSim.sci(Math.pow(10, -pk), 2)) + row('pKb', f2(14 - pk)) + row('Kb', MSim.sci(Kb, 2)) + '</table>'; }
      return '<div class="card-kicker">' + m.n + ' · ' + m.cl + '</div><table class="calc-table">' + row('Masa molar', f1(m.M) + ' g/mol') + row('μ', f2(m.mu) + ' D') + row('p. eb.', m.bp + ' °C') + row('Puentes de H', 'donores ' + m.don + ' · aceptores ' + m.acc + (m.don ? '' : ' → no se autoasocia')) + row('Máx. puentes por molécula', m.don + m.acc * 2 + ' (con agua)') + '</table>' + extra;
    },
    quiz: [
      { q: '¿Cuál hierve a mayor temperatura?', options: ['Etanol', 'Éter dimetílico', 'Propano', 'Trimetilamina'], answer: 0, why: 'Etanol: puentes de H intermoleculares.' },
      { q: 'Los éteres no forman puentes de H consigo mismos porque…', options: ['no tienen O–H', 'no tienen O', 'son apolares', 'tienen N'], answer: 0, why: 'Son sólo aceptores.' },
      { q: 'Entre las aminas, la menos básica es…', options: ['anilina', 'dimetilamina', 'metilamina', 'amoníaco'], answer: 0, why: 'El par libre se deslocaliza en el anillo (pKaH 4,6).' },
      { q: 'La solubilidad de los alcoholes en agua…', options: ['disminuye al aumentar la cadena', 'aumenta con la cadena', 'es independiente', 'es nula'], answer: 0, why: 'La cadena hidrofóbica pesa más.' },
      { q: 'Un puente de hidrógeno N–H···N es…', options: ['más débil que O–H···O', 'más fuerte que O–H···O', 'covalente', 'inexistente'], answer: 0, why: 'El N es menos electronegativo.' },
      { q: 'El enlace C–O del éter es…', options: ['polar', 'apolar', 'iónico', 'metálico'], answer: 0, why: 'Diferencia de electronegatividad 1,0.' },
      { q: '¿Cuál NO puede ser donor de H?', options: ['Trimetilamina', 'Etanol', 'Propilamina', 'Agua'], answer: 0, why: 'No tiene N–H.' },
      { q: 'El pKaH mide…', options: ['la acidez del ácido conjugado de la amina', 'la acidez de la amina', 'el pH del agua', 'la solubilidad'], answer: 0, why: 'A mayor pKaH, base más fuerte.' }
    ],
    help: { intro: 'Elige la molécula (donor) y la pareja (aceptor); «Formar puente de H» las acopla. En la lección, «Acercar H⁺» muestra la protonación del N.', items: [['Halo amarillo', 'O o N con par libre.'], ['Puntos', 'puente de hidrógeno.']] }
  };
  MSim.create(def);
})();
