/* Lípidos y membrana celular — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

/* utilidades 3D de reserva de mallas (se concatena antes de cada simulador biológico) */
var BP = (function () {
  function mk(ctx, group) {
    var T = ctx.T, sphG = new T.SphereGeometry(1, 16, 12), cylG = new T.CylinderGeometry(1, 1, 1, 8, 1, true), boxG = new T.BoxGeometry(1, 1, 1);
    function pool(geo, mat) { var items = [], used = 0; return { begin: function () { used = 0; }, get: function (col, op) { if (used >= items.length) { var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })); group.add(m); items.push(m); } var m = items[used++]; m.visible = true; m.material.color.setHex(col); var o = op == null ? 1 : op; m.material.transparent = o < 1; m.material.opacity = o; return m; }, end: function () { for (var i = used; i < items.length; i++) items[i].visible = false; }, all: function () { return items; } }; }
    var P = { sph: pool(sphG), cyl: pool(cylG), box: pool(boxG) }, up = new T.Vector3(0, 1, 0), tmpQ = new T.Quaternion(), tmpV = new T.Vector3(), tmpM = new T.Matrix4();
    return {
      begin: function () { P.sph.begin(); P.cyl.begin(); P.box.begin(); },
      end: function () { P.sph.end(); P.cyl.end(); P.box.end(); },
      sphere: function (p, r, col, op) { var m = P.sph.get(col, op); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(r); return m; },
      line: function (a, b, r, col, op) { var m = P.cyl.get(col, op), d = tmpV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); if (L < 1e-6) { m.visible = false; return m; } m.scale.set(r, L, r); m.quaternion.setFromUnitVectors(up, d.normalize()); return m; },
      /* caja con ejes: u (largo), v (alto), w (ancho) ortonormales; dims [L, H, W] */
      box: function (c, u, v, w, dims, col, op) { var m = P.box.get(col, op); m.position.set(c[0], c[1], c[2]); tmpM.makeBasis(new T.Vector3(u[0], u[1], u[2]), new T.Vector3(v[0], v[1], v[2]), new T.Vector3(w[0], w[1], w[2])); m.quaternion.setFromRotationMatrix(tmpM); m.scale.set(dims[0], dims[1], dims[2]); return m; }
    };
  }
  return { mk: mk };
})();
(function () {
  var fmt = SimKit.fmt;
  var LIP = { dmpc: { n: 'DMPC (14:0/14:0)', Tm: 24, tails: [0, 0], col: 0x4dabf7 }, dppc: { n: 'DPPC (16:0/16:0)', Tm: 41, tails: [0, 0], col: 0x4c6ef5 }, dspc: { n: 'DSPC (18:0/18:0)', Tm: 55, tails: [0, 0], col: 0x7048e8 }, popc: { n: 'POPC (16:0/18:1)', Tm: -2, tails: [0, 1], col: 0x20c997 }, dopc: { n: 'DOPC (18:1/18:1)', Tm: -17, tails: [1, 1], col: 0x12b886 } };
  var S = { mode: 'mol', lip: 'dppc', T: 37, chol: 0, form: 'bicapa', pump: false, _st: -1 }, G = {}, labs = {}, key_ = '';
  var NG = 8, SP0 = 0.82, L = 7;
  function Sorder(T, lip, c) { var Tm = LIP[lip].Tm, sfl = 0.25 + 0.45 * c, sgel = 0.82 - 0.3 * c, w = 2 + 12 * c; return sfl + (sgel - sfl) / (1 + Math.exp((T - Tm) / w)); }
  function phase(T, lip, c) { var Tm = LIP[lip].Tm; if (c > 0.25) return 'líquido ordenado (lo)'; if (T < Tm - 3) return 'gel (Lβ)'; if (T > Tm + 3) return 'líquido-cristalino (Lα)'; return 'transición de fase'; }
  function Dlat(T, lip, c) { var s = Sorder(T, lip, c); return Math.pow(10, -2 + 3.4 * (0.82 - s) / 0.6 + 0.012 * (T - 20) * 0.3); }
  /* ----- instanciación ----- */
  function mkInst(ctx, count, col0) { var T = ctx.T, m = new T.InstancedMesh(new T.SphereGeometry(1, 12, 9), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 }), count); m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.setColorAt(0, new T.Color(col0 || 0xffffff)); for (var i = 0; i < count; i++) m.setColorAt(i, new T.Color(col0 || 0xffffff)); m.frustumCulled = false; var d = new T.Object3D(), c = new T.Color(); return { mesh: m, n: count, used: 0, begin: function () { this.used = 0; }, add: function (x, y, z, r, col) { var i = this.used++; if (i >= this.n) return; d.position.set(x, y, z); d.scale.setScalar(r); d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.setHex(col); m.setColorAt(i, c); }, end: function () { var u = this.used; for (var i = u; i < this.n; i++) { d.position.set(0, -999, 0); d.scale.setScalar(0.0001); d.updateMatrix(); m.setMatrixAt(i, d.matrix); } m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; } }; }
  function hash(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
  /* ----- bicapa ----- */
  function bilayerSites() { var sites = []; for (var s = 0; s < 2; s++) for (var i = 0; i < NG; i++) for (var j = 0; j < NG; j++) sites.push({ s: s ? -1 : 1, i: i, j: j, id: sites.length }); return sites; }
  var SITES = bilayerSites();
  function cholSet(c) { var n = Math.round(c * NG * NG * 0.9), set = {}, k = 0; for (var q = 0; q < n; q++) { var idx = Math.floor((q + 0.5) * NG * NG / Math.max(1, n)); set[idx] = 1; } return set; }
  var TRP = null;
  function drawBilayer(ctx, inst, t, o) {
    var Ss = Sorder(S.T, S.lip, S.chol), d = Math.max(0, Math.min(1, (0.85 - Ss) / 0.65)), A = 0.02 + 0.2 * d, sp = SP0 + 0.12 * d, yst = 0.18 * (1 - 0.1 * d), lp = LIP[S.lip], cs = cholSet(S.chol), Dl = 0.03 + 0.3 * d * d, hole = o && o.holes || [], hc = lp.col;
    inst.begin(); G.nchol = 0;
    SITES.forEach(function (st) {
      var x = (st.i - (NG - 1) / 2) * sp + ((st.j & 1) ? sp * 0.5 : 0) - sp * 0.25, z = (st.j - (NG - 1) / 2) * sp * 0.88, ph = hash(st.id, 1) * 6.28, key = st.i * NG + st.j;
      x += Dl * (Math.sin(t * 0.35 + ph) + 0.6 * Math.sin(t * 0.83 + ph * 2.1)); z += Dl * (Math.cos(t * 0.31 + ph * 1.7) + 0.6 * Math.cos(t * 0.77 + ph));
      if (o && o.cut != null && z > o.cut) return;
      for (var h = 0; h < hole.length; h++) { var dx = x - hole[h][0], dz = z - hole[h][1]; if (dx * dx + dz * dz < hole[h][2] * hole[h][2]) return; }
      var s = st.s;
      if (cs[key]) { G.nchol++; var cph = ph; inst.add(x, s * 1.0, z, 0.14, 0xff6b6b); for (var k = 0; k < 4; k++) inst.add(x + 0.03 * Math.sin(cph + k), s * (0.82 - k * 0.2), z + 0.03 * Math.cos(cph + k), 0.2, 0xffd43b); inst.add(x, s * -0.1, z, 0.13, 0xffe066); return; }
      inst.add(x, s * 1.28, z, 0.34, hc);
      for (var tl = 0; tl < 2; tl++) {
        var ox = (tl ? 1 : -1) * 0.17, kink = lp.tails[tl];
        for (var j = 0; j < L; j++) { var f = Math.pow(j / (L - 1), 1.4), bx = ox + A * f * Math.sin(t * 2.2 + ph + j * 0.9 + tl * 2), bz = A * f * Math.cos(t * 1.9 + ph * 1.3 + j * 0.8 + tl); if (kink && j >= 3) { bx += (tl ? 1 : -1) * 0.12 * Math.min(1, (j - 2) / 2); } var y = s * (0.98 - j * yst); inst.add(x + bx, y, z + bz, 0.15, j < 1 ? 0xffd8a8 : (kink && j === 3 ? 0xff922b : 0xffe3a3)); }
      }
    });
    inst.end(); return { S: Ss, d: d };
  }
  /* ----- ensamblaje: micela, bicapa, liposoma ----- */
  function fib(n, i) { var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963; return [r * Math.cos(th), y, r * Math.sin(th)]; }
  function drawAssembly(ctx, inst, t, form, k) {
    inst.begin(); var hc = 0x4dabf7;
    function lipid(p, nrm, tails, tailC, jig, phs) { // p: posición de la cabeza; nrm: vector unitario hacia afuera
      var tx = [nrm[1] * 0 + 0, 0, 0]; var up = Math.abs(nrm[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], a = [nrm[1] * up[2] - nrm[2] * up[1], nrm[2] * up[0] - nrm[0] * up[2], nrm[0] * up[1] - nrm[1] * up[0]], al = Math.hypot(a[0], a[1], a[2]) || 1; a = [a[0] / al, a[1] / al, a[2] / al];
      inst.add(p[0], p[1], p[2], 0.3, hc); for (var tl = 0; tl < tails; tl++) { var off = tails === 2 ? (tl ? 1 : -1) * 0.14 : 0; for (var j = 0; j < 6; j++) { var s = 0.28 + j * 0.2, w = 0.04 * j * Math.sin(t * 2 + phs + j + tl * 2); inst.add(p[0] - nrm[0] * s + a[0] * (off + w), p[1] - nrm[1] * s + a[1] * (off + w), p[2] - nrm[2] * s + a[2] * (off + w), 0.13, 0xffe3a3); } }
    }
    function water(cx, cy, cz, n, rmin, rmax, seed, skip) { for (var i = 0; i < n; i++) { var u = [hash(i, seed) * 2 - 1, hash(i, seed + 1) * 2 - 1, hash(i, seed + 2) * 2 - 1], l = Math.hypot(u[0], u[1], u[2]) || 1, r = rmin + (rmax - rmin) * Math.cbrt(hash(i, seed + 3)); var x = cx + u[0] / l * r + 0.12 * Math.sin(t * 1.3 + i), y = cy + u[1] / l * r + 0.12 * Math.cos(t * 1.1 + i * 1.3), z = cz + u[2] / l * r; if (skip && skip(x, y, z)) continue; inst.add(x, y, z, 0.075, 0x74c0fc); } }
    if (form === 'micela') { var N = 28; for (var i = 0; i < N; i++) { var n = fib(N, i), R = 1.55; lipid([n[0] * R, n[1] * R, n[2] * R], n, 1, 0, 0, i); } water(0, 0, 0, 120, 3.3, 4.4, 5, function (x, y, z) { return Math.hypot(x, y, z) < 3.2; }); }
    else if (form === 'bicapa') { for (var s = 0; s < 2; s++) for (var i2 = 0; i2 < 7; i2++) for (var j2 = 0; j2 < 7; j2++) { var sg = s ? -1 : 1, p = [(i2 - 3) * 0.78 + (j2 & 1 ? 0.39 : 0), sg * 1.05, (j2 - 3) * 0.7]; lipid(p, [0, sg, 0], 2, 0, 0, i2 * 7 + j2 + s * 50); } water(0, 3.0, 0, 70, 0, 2.6, 7, function (x, y, z) { return y < 2.45 || Math.abs(x) > 3.6 || Math.abs(z) > 3.4; }); water(0, -3.0, 0, 70, 0, 2.6, 9, function (x, y, z) { return y > -2.45 || Math.abs(x) > 3.6 || Math.abs(z) > 3.4; }); }
    else { var NO = 150, NI = 80, RO = 3.1, RI = 1.9; for (var q = 0; q < NO; q++) { var nn = fib(NO, q); lipid([nn[0] * RO, nn[1] * RO, nn[2] * RO], nn, 2, 0, 0, q); } for (var q2 = 0; q2 < NI; q2++) { var n2 = fib(NI, q2); lipid([n2[0] * RI, n2[1] * RI, n2[2] * RI], [-n2[0], -n2[1], -n2[2]], 2, 0, 0, q2 + 200); } water(0, 0, 0, 36, 0, 1.2, 11); water(0, 0, 0, 90, 4.6, 5.8, 13); }
    inst.end();
  }
  /* ----- molécula detallada ----- */
  function chainPts(len, kink, x0, y0, dir) { var pts = [[x0, y0]], ang = -Math.PI / 2 + (dir || 0), step = 0.42, zig = 0.22; for (var k = 1; k <= len; k++) { var a = ang + ((k & 1) ? 0.55 : -0.55) * 0.9; if (kink && k > 9) a += -0.0; var px = pts[k - 1][0] + step * Math.cos(a), py = pts[k - 1][1] + step * Math.sin(a); pts.push([px, py]); if (kink && k === 9) ang += 0.9; } return pts; }
  function drawMolecule(ctx, r) {
    r.begin(); var hx = 0, hy = 3.1;
    r.sphere([hx - 0.1, hy + 1.1, 0], 0.5, 0x4dabf7); [[0.55, 0.45, 0.4], [-0.6, 0.5, 0.4], [0, 0.45, -0.7]].forEach(function (m) { r.sphere([hx + m[0] - 0.1, hy + 1.1 + m[1], m[2] * 0.6], 0.2, 0x56606b); }); r.line([hx - 0.1, hy + 0.6, 0], [hx, hy - 0.05, 0], 0.07, 0xbfc7d1);
    r.sphere([hx, hy - 0.2, 0], 0.4, 0xff922b); r.sphere([hx + 0.45, hy - 0.2, 0.2], 0.17, 0xff4d4d); r.sphere([hx - 0.45, hy - 0.2, -0.2], 0.17, 0xff4d4d);
    r.line([hx, hy - 0.55, 0], [hx, hy - 1.15, 0], 0.07, 0xbfc7d1); r.sphere([hx, hy - 1.15, 0], 0.22, 0xadb5bd);
    var g1 = [hx - 0.55, hy - 1.7, 0], g2 = [hx + 0.55, hy - 1.7, 0]; r.sphere(g1, 0.22, 0xadb5bd); r.sphere(g2, 0.22, 0xadb5bd); r.line([hx, hy - 1.15, 0], g1, 0.07, 0xbfc7d1); r.line([hx, hy - 1.15, 0], g2, 0.07, 0xbfc7d1);
    [g1, g2].forEach(function (g, k) { r.sphere([g[0] + (k ? 0.35 : -0.35), g[1] - 0.35, 0], 0.15, 0xff4d4d); r.line(g, [g[0] + (k ? 0.35 : -0.35), g[1] - 0.35, 0], 0.07, 0xbfc7d1); });
    var t1 = chainPts(11, false, g1[0] - 0.2, g1[1] - 0.45, 0), t2 = chainPts(S.lip === 'dppc' ? 11 : 13, S.lip !== 'dppc' && S.lip !== 'dmpc' && S.lip !== 'dspc', g2[0] + 0.2, g2[1] - 0.45, 0);
    [t1, t2].forEach(function (pts, kk) { pts.forEach(function (p, k) { r.sphere([p[0], p[1], 0], 0.17, kk === 1 && k === 9 ? 0xff922b : 0xffe3a3); if (k) r.line([pts[k - 1][0], pts[k - 1][1], 0], [p[0], p[1], 0], 0.065, 0xbfc7d1); }); });
    r.end(); return { t1: t1, t2: t2, hx: hx, hy: hy };
  }
  /* ----- transporte ----- */
  var PT = null, PSITES = [{ x: -2.1, z: 0.2, r: 0.5, kind: 'chan' }, { x: 0.0, z: -0.5, r: 0.55, kind: 'glut' }, { x: 2.1, z: 0.3, r: 0.65, kind: 'pump' }];
  var PK = { O2: { col: 0xff6b6b, r: 0.1 }, GLU: { col: 0xffd43b, r: 0.16 }, NA: { col: 0xcc5de8, r: 0.13 }, K: { col: 0x69db7c, r: 0.13 } };
  function initParticles() { PT = []; var id = 0; function add(t, n, up) { for (var i = 0; i < n; i++) PT.push({ t: t, x: (Math.random() - 0.5) * 6.6, y: (up ? 1 : -1) * (1.7 + Math.random() * 1.5), z: (Math.random() - 0.5) * 5.4, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), vz: (Math.random() - 0.5), mv: 0 }); } add('O2', 12, true); add('GLU', 10, true); add('NA', 14, true); add('K', 14, false); G.pump = { ph: 0, on: 0, atp: 0, queue: null }; }
  function stepParticles(dt) {
    var pump = G.pump; var allowed = function (p) { for (var i = 0; i < PSITES.length; i++) { var s = PSITES[i], dx = p.x - s.x, dz = p.z - s.z; if (dx * dx + dz * dz < s.r * s.r * 0.5) { if (s.kind === 'chan' && p.t === 'K') return true; if (s.kind === 'glut' && p.t === 'GLU') return true; } } return p.t === 'O2'; };
    PT.forEach(function (p) {
      if (p.mv > 0) { return; }
      p.vx += (Math.random() - 0.5) * 9 * dt; p.vy += (Math.random() - 0.5) * 9 * dt; p.vz += (Math.random() - 0.5) * 9 * dt; var sp = Math.hypot(p.vx, p.vy, p.vz), mx = p.t === 'O2' ? 2.2 : 1.4; if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; p.vz *= mx / sp; }
      var nx = p.x + p.vx * dt, ny = p.y + p.vy * dt, nz = p.z + p.vz * dt; if (Math.abs(nx) > 3.4) { p.vx *= -1; nx = p.x; } if (Math.abs(nz) > 2.8) { p.vz *= -1; nz = p.z; } if (Math.abs(ny) > 3.3) { p.vy *= -1; ny = p.y; }
      var inband = Math.abs(ny) < 1.4, was = Math.abs(p.y) < 1.4; if (inband) { var tmp = { t: p.t, x: nx, z: nz }; if (!allowed(tmp)) { p.vy *= -1; ny = p.y; if (was) ny = p.y + Math.sign(p.y || 1) * 0.02; } }
      p.x = nx; p.y = ny; p.z = nz;
    });
    if (S.pump) { pump.atp += dt; if (!pump.queue && pump.atp > 1.1) { pump.atp = 0; var ps = PSITES[2], na = null, k = null, bd = 1e9; PT.forEach(function (p) { var d = Math.hypot(p.x - ps.x, p.z - ps.z); if (p.t === 'NA' && p.y < -1.5 && p.mv <= 0 && d < bd) { bd = d; na = p; } }); bd = 1e9; PT.forEach(function (p) { var d = Math.hypot(p.x - ps.x, p.z - ps.z); if (p.t === 'K' && p.y > 1.5 && p.mv <= 0 && d < bd) { bd = d; k = p; } }); if (na && k) { pump.queue = { na: na, k: k, t: 0 }; na.mv = 1; k.mv = 1; } }
      if (pump.queue) { var q = pump.queue; q.t += dt / 1.4; var ps2 = PSITES[2]; if (q.t < 1) { var s = q.t; q.na.x = q.na.x + (ps2.x - q.na.x) * Math.min(1, dt * 6); q.na.z += (ps2.z - q.na.z) * Math.min(1, dt * 6); q.na.y = -1.6 + 3.5 * s * s * (3 - 2 * s); q.k.x += (ps2.x - q.k.x) * Math.min(1, dt * 6); q.k.z += (ps2.z - q.k.z) * Math.min(1, dt * 6); q.k.y = 1.6 - 3.5 * s * s * (3 - 2 * s); } else { q.na.mv = 0; q.k.mv = 0; q.na.vy = 0.5; q.k.vy = -0.5; pump.queue = null; } } }
  }
  function counts() { var c = { O2: [0, 0], GLU: [0, 0], NA: [0, 0], K: [0, 0] }; if (!PT) return c; PT.forEach(function (p) { c[p.t][p.y > 0 ? 0 : 1]++; }); return c; }
  /* ----- escena ----- */
  function sceneBuild(ctx) { var T = ctx.T; if (G.g) ctx.scene.remove(G.g); G.g = new T.Group(); G.pool = new T.Group(); G.g.add(G.pool); G.r = BP.mk(ctx, G.pool); G.inst = mkInst(ctx, 2800, 0xffffff); G.g.add(G.inst.mesh); G.prot = new T.Group(); G.g.add(G.prot);
    var mats = function (c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: true, opacity: o || 0.85 }); };
    var chan = new T.Group(); var cy = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 2.7, 20, 1, true), mats(0x9775fa, 0.55)); cy.material.side = T.DoubleSide; chan.add(cy); var ring = new T.Mesh(new T.TorusGeometry(0.55, 0.09, 8, 20), mats(0x7048e8, 0.95)); ring.rotation.x = Math.PI / 2; ring.position.y = 1.35; chan.add(ring); var ring2 = ring.clone(); ring2.position.y = -1.35; chan.add(ring2); chan.position.set(PSITES[0].x, 0, PSITES[0].z); G.prot.add(chan);
    var glut = new T.Group(); var gl1 = new T.Mesh(new T.CylinderGeometry(0.62, 0.55, 2.7, 20, 1, true), mats(0x20c997, 0.55)); gl1.material.side = T.DoubleSide; glut.add(gl1); [-1.3, 1.3].forEach(function (y) { var c = new T.Mesh(new T.SphereGeometry(0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats(0x0ca678, 0.9)); c.position.y = y; if (y < 0) c.rotation.x = Math.PI; glut.add(c); }); glut.position.set(PSITES[1].x, 0, PSITES[1].z); G.prot.add(glut);
    var pump = new T.Group(); var pp = new T.Mesh(new T.CylinderGeometry(0.8, 0.7, 2.7, 20, 1, true), mats(0xf783ac, 0.55)); pp.material.side = T.DoubleSide; pump.add(pp); var pb = new T.Mesh(new T.SphereGeometry(0.85, 18, 14), mats(0xe64980, 0.85)); pb.position.y = -1.7; pump.add(pb); var pc = new T.Mesh(new T.SphereGeometry(0.55, 16, 12), mats(0xe64980, 0.85)); pc.position.y = 1.4; pump.add(pc); pump.position.set(PSITES[2].x, 0, PSITES[2].z); G.prot.add(pump); G.pumpObj = pump; G.pumpBody = pb;
    G.parts = new T.Group(); G.g.add(G.parts); var sg = new T.SphereGeometry(1, 12, 9); G.pm = PK; G.pmesh = []; for (var i = 0; i < 60; i++) { var m = new T.Mesh(sg, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })); G.parts.add(m); G.pmesh.push(m); }
    ctx.scene.add(G.g); }
  function STG() { return [
    ['Fosfolípido', 'Fosfolípido', 'Cabeza polar hidrofílica y dos colas apolares', '<p>Un <b>glicerofosfolípido</b> (aquí fosfatidilcolina) tiene una <b>cabeza polar</b> (colina–fosfato–glicerol) y <b>dos colas hidrocarbonadas</b> unidas por enlaces éster. Es <b>anfipático</b>. Una <b>insaturación cis</b> (doble enlace) produce un <b>codo</b> en la cola que impide el empaquetamiento compacto.</p>'],
    ['Autoensamblaje', 'Ensamblaje', 'En agua, las colas se esconden: micela, bicapa o liposoma', '<p>Por el <b>efecto hidrofóbico</b> las colas evitan el agua. Anfífilos de <b>una cola</b> (cono) forman <b>micelas</b>; los fosfolípidos de <b>dos colas</b> (cilindro) forman <b>bicapas</b>, que se cierran en <b>liposomas</b> para no exponer bordes al agua.</p>'],
    ['Fluidez y temperatura', 'Fluidez', 'Gel por debajo de Tm, líquido-cristalino por encima', '<p>Por debajo de la <b>temperatura de transición Tm</b> las colas están ordenadas y extendidas (<b>gel</b>); por encima se mueven y la bicapa es <b>fluida</b> (difusión lateral ≈ 1 µm²/s). <b>Tm</b> sube con la longitud de la cola y baja con las <b>insaturaciones</b>.</p>'],
    ['Colesterol', 'Colesterol', 'Amortigua la fluidez: ordena lo fluido y desordena lo gel', '<p>El <b>colesterol</b> se intercala entre los fosfolípidos: su anillo rígido <b>ordena</b> las colas en estado fluido (menos permeabilidad) y <b>evita la cristalización</b> en el gel. A ≈ 30 % forma una fase <b>líquida ordenada</b>.</p>'],
    ['Transporte pasivo', 'Pasivo', 'A favor del gradiente: difusión simple, canales y transportadores', '<p>Pequeñas moléculas apolares (<b>O₂</b>, CO₂) cruzan por <b>difusión simple</b>. Los iones (<b>K⁺</b>) necesitan un <b>canal</b> selectivo y la <b>glucosa</b> un <b>transportador facilitado (GLUT)</b>; ambos van a favor del gradiente, sin gasto de ATP.</p>'],
    ['Transporte activo', 'Activo', 'En contra del gradiente, con ATP: bomba Na⁺/K⁺', '<p>La <b>Na⁺/K⁺-ATPasa</b> saca <b>3 Na⁺</b> y mete <b>2 K⁺</b> por cada ATP hidrolizado, manteniendo los gradientes de la célula. En la simulación se repone el gradiente que los canales disipan.</p>']
  ]; }
  function lessonSet(i, loc) {
    S.mode = ['mol', 'asm', 'fluid', 'fluid', 'tr', 'tr'][i]; S.pump = i === 5;
    if (i === 0) S.lip = loc < 0.5 ? 'dppc' : 'popc';
    if (i === 1) S.form = ['micela', 'bicapa', 'liposoma'][Math.min(2, Math.floor(loc * 3))];
    if (i === 2) { S.lip = 'dppc'; S.chol = 0; S.T = 20 + 45 * loc; }
    if (i === 3) { S.lip = 'dppc'; S.T = 30; S.chol = 0.45 * Math.min(1, loc * 1.2); }
  }
  var def = {
    key: 'lipidos-membrana', title: 'Lípidos y membrana celular', subtitle: 'Simulador 3D · biomoléculas', accent: { dark: '#fbbf24', light: '#b45309' }, stages: STG, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 3.5, 12.5], target: [0, 0, 0] }, { id: 'corte', label: 'Lateral', pos: [0, 0.3, 13], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 13, 0.5], target: [0, 0, 0] }],
    layers: [{ id: 'prot', label: 'Proteínas', icon: '⬣' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { G.now = 0; sceneBuild(ctx); initParticles(); labs.t = ctx.label('', 'bl-lead'); labs.l = []; for (var i = 0; i < 8; i++) labs.l.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local); G.now += dt; var t = G.now, T = ctx.T; dt = Math.min(dt, 0.05);
      labs.l.forEach(function (l) { l.vis(false); }); labs.t.vis(false); G.inst.mesh.visible = (S.mode !== 'mol'); G.pool.visible = (S.mode === 'mol'); G.prot.visible = S.mode === 'tr' && ctx.layer('prot'); G.parts.visible = S.mode === 'tr';
      var sp = ctx.layer('spin'); if (S.mode === 'tr' || S.mode === 'fluid') { G.g.rotation.y = 0.25 * Math.sin(t * 0.25) * (sp ? 1 : 0); } else if (sp) G.g.rotation.y += dt * 0.3; else G.g.rotation.y *= 0.95;
      if (S.mode === 'mol') { G.g.rotation.y = sp ? G.g.rotation.y : 0; G.g.scale.setScalar(0.75); var m = drawMolecule(ctx, G.r), l = labs.l; G.g.updateMatrixWorld(true); var W = function (x, y) { return G.g.localToWorld(new T.Vector3(x, y, 0)); }; var v = W(m.hx - 1.9, m.hy + 1.1); l[0].pos(v.x, v.y, v.z).set('cabeza polar (colina)', 'bl-d').vis(true); v = W(m.hx + 1.2, m.hy - 0.2); l[1].pos(v.x, v.y, v.z).set('fosfato', 'bl-d').vis(true); v = W(m.hx + 1.5, m.hy - 1.4); l[2].pos(v.x, v.y, v.z).set('glicerol + ésteres', 'bl-d').vis(true); v = W(m.t1[7][0] - 1.0, m.t1[7][1]); l[3].pos(v.x, v.y, v.z).set('cola saturada (16:0)', 'bl-d').vis(true); var uns = S.lip !== 'dppc'; v = W(m.t2[Math.min(9, m.t2.length - 1)][0] + 1.3, m.t2[Math.min(9, m.t2.length - 1)][1]); l[4].pos(v.x, v.y, v.z).set(uns ? 'cola 18:1: codo cis (Δ9)' : 'cola saturada (16:0)', 'bl-d').vis(true); v = W(0, m.hy + 2.7); labs.t.pos(v.x, v.y, v.z).set(S.lip === 'dppc' ? 'Fosfatidilcolina saturada (DPPC-like)' : 'Fosfatidilcolina con una cola insaturada (POPC-like)', 'bl-lead').vis(true); return; }
      G.g.scale.setScalar(1);
      if (S.mode === 'asm') { drawAssembly(ctx, G.inst, t, S.form, 0); var names = { micela: 'Micela (anfífilo de una cola)', bicapa: 'Bicapa lipídica', liposoma: 'Liposoma (vesícula de bicapa)' }; labs.t.pos(0, 5.3, 0).set(names[S.form], 'bl-lead').vis(true); G.info = {}; return; }
      var holes = S.mode === 'tr' ? PSITES.map(function (p) { return [p.x, p.z, p.r + 0.35]; }) : [];
      var res = drawBilayer(ctx, G.inst, t, { holes: holes, cut: S.mode === 'tr' ? -0.9 : null }); G.info = res;
      if (S.mode === 'fluid') { labs.t.pos(0, 3.6, 0).set(LIP[S.lip].n + ' · ' + fmt(S.T, 0) + ' °C · ' + phase(S.T, S.lip, S.chol), 'bl-lead').vis(true); G.g.rotation.x = 0.0; }
      if (S.mode === 'tr') {
        stepParticles(dt); G.pmesh.forEach(function (m, i) { var p = PT[i]; if (!p) { m.visible = false; return; } m.visible = true; var k = PK[p.t]; m.material.color.setHex(k.col); m.scale.setScalar(k.r * 1.6); m.position.set(p.x, p.y, p.z); });
        G.pumpBody.material.color.setHex(S.pump ? 0xe64980 : 0xadb5bd); var l = labs.l; l[0].pos(PSITES[0].x, 1.9, PSITES[0].z).set('canal de K⁺', 'bl-d').vis(true); l[1].pos(PSITES[1].x, 1.9, PSITES[1].z).set('GLUT', 'bl-d').vis(true); l[2].pos(PSITES[2].x, 1.9, PSITES[2].z).set(S.pump ? 'Na⁺/K⁺-ATPasa' : 'bomba (inactiva)', 'bl-d').vis(true); l[3].pos(-3.6, 3.2, 0).set('exterior', 'bl-d').vis(true); l[4].pos(-3.6, -3.2, 0).set('citosol', 'bl-d').vis(true); if (S.pump && G.pump.queue) l[5].pos(PSITES[2].x, -2.7, PSITES[2].z).set('ATP → ADP + Pᵢ', 'bl-d').vis(true);
        labs.t.pos(0, 4.4, 0).set(S.pump ? 'Transporte activo + pasivo' : 'Transporte pasivo', 'bl-lead').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; }, lp = LIP[S.lip];
      if (S.mode === 'tr') { var c = counts(); return { eq: { chip: 'Transporte', name: S.pump ? 'pasivo + activo' : 'pasivo', body: row('Na⁺ (ext / cit)', c.NA[0] + ' / ' + c.NA[1]) + row('K⁺ (ext / cit)', c.K[0] + ' / ' + c.K[1]) + row('Glucosa (ext / cit)', c.GLU[0] + ' / ' + c.GLU[1]) }, legend: [{ label: 'O₂', color: '#ff6b6b', text: 'difusión simple' }, { label: 'Glu', color: '#ffd43b', text: 'GLUT (facilitado)' }, { label: 'Na⁺', color: '#cc5de8', text: 'bomba' }, { label: 'K⁺', color: '#69db7c', text: 'canal / bomba' }] }; }
      if (S.mode === 'asm') return { eq: { chip: 'Anfífilo', name: S.form, body: row('Cola(s)', S.form === 'micela' ? '1' : '2') + row('Forma', S.form === 'micela' ? 'cono → esfera' : 'cilindro → bicapa') }, legend: [{ label: 'Cabeza', color: '#4dabf7', text: 'hidrofílica' }, { label: 'Cola', color: '#ffe3a3', text: 'hidrofóbica' }, { label: 'Agua', color: '#74c0fc', text: 'disolvente' }] };
      var so = Sorder(S.T, S.lip, S.chol); return { eq: { chip: 'Tm ' + lp.Tm + ' °C', name: lp.n, body: row('Fase', phase(S.T, S.lip, S.chol)) + row('Orden (S_CD)', fmt(so, 2)) + row('Colesterol', fmt(S.chol * 100, 0) + ' %') }, legend: [{ label: 'Cabeza', color: '#' + lp.col.toString(16), text: 'fosfolípido' }, { label: 'Chol', color: '#ffd43b', text: 'colesterol' }, { label: 'Codo', color: '#ff922b', text: 'insaturación cis' }] }; },
    measures: function () { var lp = LIP[S.lip]; return [['Lípido', lp.n], ['Tm', lp.Tm + ' °C'], ['T actual', fmt(S.T, 0) + ' °C'], ['Fase', phase(S.T, S.lip, S.chol)], ['Orden S', fmt(Sorder(S.T, S.lip, S.chol), 2)], ['D lateral', fmt(Dlat(S.T, S.lip, S.chol), 3) + ' µm²/s'], ['Colesterol', fmt(S.chol * 100, 0) + ' %']]; },
    ideas: ['Los fosfolípidos son <b>anfipáticos</b>: cabeza polar + colas apolares.', 'Las <b>insaturaciones cis</b> y las colas cortas <b>bajan la Tm</b> (más fluidez).', 'El <b>colesterol</b> amortigua la fluidez de la membrana.', 'Difusión simple: gases y moléculas apolares; canales y GLUT: <b>a favor</b> del gradiente.', 'La bomba Na⁺/K⁺ usa ATP para ir <b>en contra</b> del gradiente (3 Na⁺ fuera, 2 K⁺ dentro).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Qué mostrar'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Escena', cols: 4, value: S.mode, options: [{ v: 'mol', label: 'Lípido' }, { v: 'asm', label: 'Ensamblaje' }, { v: 'fluid', label: 'Bicapa' }, { v: 'tr', label: 'Transporte' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.form = kit.ui.options({ label: 'Estructura en agua', cols: 3, value: S.form, options: [{ v: 'micela', label: 'Micela' }, { v: 'bicapa', label: 'Bicapa' }, { v: 'liposoma', label: 'Liposoma' }], onChange: function (v) { ctx.goManual(); S.mode = 'asm'; S.form = v; } }); c.appendChild(ui.form);
      ui.lip = kit.ui.options({ label: 'Fosfolípido', cols: 3, value: S.lip, options: Object.keys(LIP).map(function (k) { return { v: k, label: LIP[k].n.split(' ')[0], sub: 'Tm ' + LIP[k].Tm + ' °C' }; }), onChange: function (v) { ctx.goManual(); S.lip = v; if (S.mode === 'asm' || S.mode === 'tr') S.mode = 'fluid'; } }); c.appendChild(ui.lip);
      ui.T = kit.ui.slider({ label: 'Temperatura', min: -20, max: 70, step: 1, value: S.T, format: function (v) { return v + ' °C'; }, onInput: function (v) { ctx.goManual(); S.T = v; S.mode = 'fluid'; } }); ui.ch = kit.ui.slider({ label: 'Colesterol', min: 0, max: 50, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.chol = v / 100; S.mode = 'fluid'; } }); c.appendChild(kit.ui.sliders([ui.T, ui.ch]));
      ui.pump = kit.ui.options({ label: 'Bomba Na⁺/K⁺ (ATP)', cols: 2, value: S.pump ? 'on' : 'off', options: [{ v: 'off', label: 'Sin ATP' }, { v: 'on', label: 'Con ATP' }], onChange: function (v) { ctx.goManual(); S.mode = 'tr'; S.pump = v === 'on'; if (!PT) initParticles(); } }); c.appendChild(ui.pump);
      c.appendChild(ctx.btnRow([{ t: 'Reiniciar partículas', fn: function () { initParticles(); } }, { t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
      var lk = ''; ui.refresh = function () { var k = [S.mode, S.form, S.lip, Math.round(S.T), Math.round(S.chol * 100), S.pump].join('|'); if (k === lk) return; lk = k; ui.mode.set(S.mode); ui.form.set(S.form); ui.lip.set(S.lip); ui.T.set(Math.round(S.T)); ui.ch.set(Math.round(S.chol * 100)); ui.pump.set(S.pump ? 'on' : 'off'); };
      var q = kit.ui.card('Desafío: ¿cómo cruza la membrana?'); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, sc = [0, 0];
      var SUB = [['O₂', 'simple'], ['CO₂', 'simple'], ['etanol', 'simple'], ['H₂O (por acuaporina)', 'canal'], ['K⁺ (a favor del gradiente)', 'canal'], ['glucosa (a favor del gradiente)', 'carrier'], ['Na⁺ (en contra del gradiente)', 'activo'], ['Ca²⁺ al exterior (en contra del gradiente)', 'activo']];
      var OPT = [['simple', 'Difusión simple'], ['canal', 'Canal iónico/acuaporina'], ['carrier', 'Transportador facilitado'], ['activo', 'Transporte activo']];
      function nextQ() { cur = SUB[Math.floor(Math.random() * SUB.length)]; draw(''); }
      function draw(msg) { var h = '<p class="small">Aciertos: <b>' + sc[0] + '</b> / ' + sc[1] + '</p>'; if (cur) h += '<p class="small">¿Cómo cruza la bicapa <b>' + cur[0] + '</b>?</p>'; if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-direction:column;gap:6px'; OPT.forEach(function (o) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = o[1]; b.onclick = function () { if (!cur) { kit.toast('Pulsa «Nueva pregunta»'); return; } sc[1]++; var ok = cur[1] === o[0]; if (ok) sc[0]++; var r = cur; cur = null; draw(ok ? '¡Correcto!' : 'No: ' + r[0] + ' → ' + OPT.filter(function (x) { return x[0] === r[1]; })[0][1]); }; w.appendChild(b); }); qb.appendChild(w); qb.appendChild(ctx.btnRow([{ t: 'Nueva pregunta', primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: 'Orden de las colas frente a la temperatura', h: 230, note: 'S_CD (parámetro de orden): alto = gel, bajo = fluido. Línea punteada: Tm. Con colesterol la transición se ensancha.', draw: function (cx, w, h, c) {
        var L0 = 34, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (t) { return L0 + pw * (t + 30) / 110; }, sy = function (s) { return Tp + ph * (1 - (s - 0.1) / 0.8); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var t = -30; t <= 80; t += 20) { cx.beginPath(); cx.moveTo(sx(t), Tp); cx.lineTo(sx(t), Tp + ph); cx.stroke(); cx.fillText(t, sx(t), h - B + 12); } cx.fillText('T (°C)', L0 + pw / 2, h - 2); cx.textAlign = 'right'; [0.2, 0.5, 0.8].forEach(function (s) { cx.fillText(fmt(s, 1), L0 - 4, sy(s) + 3); });
        [[0, '#4c8dff', 'sin colesterol'], [S.chol, '#e8590c', 'colesterol actual']].forEach(function (cfg, k) { if (k === 1 && S.chol === 0) return; cx.strokeStyle = cfg[1]; cx.lineWidth = 2.2; cx.beginPath(); for (var t2 = -30; t2 <= 80; t2 += 1) { var px = sx(t2), py = sy(Sorder(t2, S.lip, cfg[0])); if (t2 === -30) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; });
        cx.setLineDash([4, 3]); cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(sx(LIP[S.lip].Tm), Tp); cx.lineTo(sx(LIP[S.lip].Tm), Tp + ph); cx.stroke(); cx.setLineDash([]); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText('Tm ' + LIP[S.lip].Tm, sx(LIP[S.lip].Tm) + 4, Tp + 12);
        cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(S.T), sy(Sorder(S.T, S.lip, S.chol)), 5, 0, 7); cx.fill(); } },
      { title: 'Difusión lateral de los lípidos', h: 220, note: 'Escala logarítmica (µm²/s): la transición gel → fluido aumenta D en ≈ 2–3 órdenes de magnitud.', draw: function (cx, w, h, c) {
        var L0 = 40, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (t) { return L0 + pw * (t + 30) / 110; }, sy = function (d) { return Tp + ph * (1 - (Math.log10(d) + 3) / 5); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var t = -30; t <= 80; t += 20) { cx.beginPath(); cx.moveTo(sx(t), Tp); cx.lineTo(sx(t), Tp + ph); cx.stroke(); cx.fillText(t, sx(t), h - B + 12); } cx.fillText('T (°C)', L0 + pw / 2, h - 2); cx.textAlign = 'right'; for (var e = -3; e <= 2; e++) { cx.beginPath(); cx.moveTo(L0, sy(Math.pow(10, e))); cx.lineTo(L0 + pw, sy(Math.pow(10, e))); cx.stroke(); cx.fillText('10^' + e, L0 - 4, sy(Math.pow(10, e)) + 3); }
        cx.strokeStyle = '#2f9e44'; cx.lineWidth = 2.2; cx.beginPath(); for (t = -30; t <= 80; t += 1) { var px = sx(t), py = sy(Math.max(1e-3, Math.min(1e2, Dlat(t, S.lip, S.chol)))); if (t === -30) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(S.T), sy(Math.max(1e-3, Math.min(1e2, Dlat(S.T, S.lip, S.chol)))), 5, 0, 7); cx.fill(); } },
      { title: 'Temperatura de transición de fase (Tm)', h: 200, note: 'Colas más largas → Tm mayor; cada doble enlace cis → Tm mucho menor.', draw: function (cx, w, h, c) {
        var ks = Object.keys(LIP), L0 = 70, Tp = 6, B = 22, ph = (h - Tp - B) / ks.length, sx = function (t) { return L0 + (w - L0 - 30) * (t + 30) / 100; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(sx(0), Tp); cx.lineTo(sx(0), h - B); cx.stroke(); cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var t = -20; t <= 60; t += 20) cx.fillText(t, sx(t), h - B + 12);
        ks.forEach(function (k, i) { var y = Tp + i * ph, tm = LIP[k].Tm; cx.fillStyle = '#' + LIP[k].col.toString(16).padStart(6, '0'); cx.globalAlpha = k === S.lip ? 1 : 0.65; cx.fillRect(Math.min(sx(0), sx(tm)), y + 3, Math.abs(sx(tm) - sx(0)), ph - 6); cx.globalAlpha = 1; cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(LIP[k].n.split(' ')[0], L0 - 6, y + ph / 2 + 3); cx.textAlign = tm >= 0 ? 'left' : 'right'; cx.fillStyle = c.muted; cx.fillText(tm + ' °C', tm >= 0 ? sx(tm) + 4 : sx(tm) - 4, y + ph / 2 + 3); }); } },
      { title: 'Permeabilidad relativa de la bicapa (órdenes de magnitud)', h: 240, note: 'Valores ilustrativos de log₁₀ P (cm/s): gases y moléculas apolares cruzan fácilmente; iones casi nada sin proteínas.', draw: function (cx, w, h, c) {
        var arr = [['O₂', -1], ['CO₂', -1], ['etanol', -1.5], ['H₂O', -3], ['urea', -5], ['glicerol', -6], ['glucosa', -9], ['Cl⁻', -11], ['Na⁺ / K⁺', -12]], L0 = 66, Tp = 6, B = 24, ph = (h - Tp - B) / arr.length, sx = function (v) { return L0 + (w - L0 - 14) * (v + 13) / 13; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var v = -12; v <= 0; v += 3) { cx.beginPath(); cx.moveTo(sx(v), Tp); cx.lineTo(sx(v), h - B); cx.stroke(); cx.fillText(v, sx(v), h - B + 12); } cx.fillText('log P (cm/s)', L0 + (w - L0) / 2, h - 2);
        arr.forEach(function (a, i) { var y = Tp + i * ph; cx.fillStyle = a[1] > -4 ? '#f59f00' : (a[1] > -8 ? '#74c0fc' : '#4c6ef5'); cx.fillRect(L0, y + 3, sx(a[1]) - L0, ph - 6); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(a[0], L0 - 6, y + ph / 2 + 3); }); } }
    ],
    calc: function () { var lp = LIP[S.lip], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, so = Sorder(S.T, S.lip, S.chol), d = Math.max(0, Math.min(1, (0.85 - so) / 0.65));
      return '<div class="card-kicker">' + lp.n + ' a ' + fmt(S.T, 0) + ' °C</div><div class="calc-step">1 · Fase</div><table class="calc-table">' + row('Tm', lp.Tm + ' °C') + row('T − Tm', fmt(S.T - lp.Tm, 0) + ' °C') + row('Fase', phase(S.T, S.lip, S.chol)) + row('Colesterol', fmt(S.chol * 100, 0) + ' %') + '</table><div class="calc-step">2 · Orden y fluidez</div><table class="calc-table">' + row('S_CD', fmt(so, 2)) + row('Desorden relativo', fmt(d * 100, 0) + ' %') + row('Difusión lateral', fmt(Dlat(S.T, S.lip, S.chol), 3) + ' µm²/s') + '</table><div class="calc-step">3 · Transición</div><table class="calc-table">' + row('Anchura de la transición', '≈ ' + fmt(2 + 12 * S.chol, 1) + ' °C') + row('Insaturaciones cis', (lp.tails[0] + lp.tails[1]) + ' por lípido') + '</table>'; },
    calcLabel: 'Fase',
    quiz: [
      { q: 'Una molécula anfipática es aquella que…', options: ['tiene una parte hidrofílica y otra hidrofóbica', 'es totalmente apolar', 'solo es soluble en lípidos', 'no tiene carga'], answer: 0, why: 'Los fosfolípidos tienen cabeza polar y colas apolares.' },
      { q: '¿Qué efecto tiene una insaturación cis en la cola de un fosfolípido?', options: ['introduce un codo, baja la Tm y aumenta la fluidez', 'aumenta la Tm', 'hace la cola más larga', 'elimina la carga de la cabeza'], answer: 0, why: 'El codo impide el empaquetamiento compacto de las colas.' },
      { q: 'Los fosfolípidos de dos colas forman espontáneamente…', options: ['bicapas y liposomas', 'solo micelas', 'cristales', 'cadenas lineales'], answer: 0, why: 'Su forma cilíndrica favorece láminas; se cierran en vesículas para ocultar los bordes.' },
      { q: 'El colesterol en una membrana a 37 °C (fase fluida)…', options: ['ordena las colas y reduce la fluidez', 'aumenta mucho la fluidez', 'disuelve la membrana', 'no interacciona con los lípidos'], answer: 0, why: 'Su anillo rígido restringe el movimiento de las colas vecinas.' },
      { q: '¿Cómo cruza el O₂ la bicapa?', options: ['difusión simple', 'bomba Na⁺/K⁺', 'canal de K⁺', 'endocitosis'], answer: 0, why: 'Es pequeño y apolar: se disuelve en el interior hidrofóbico.' },
      { q: 'La bomba Na⁺/K⁺-ATPasa transporta por ciclo…', options: ['3 Na⁺ hacia fuera y 2 K⁺ hacia dentro', '2 Na⁺ hacia fuera y 3 K⁺ hacia dentro', '1 Na⁺ y 1 K⁺', 'solo Na⁺ hacia dentro'], answer: 0, why: 'Es electrogénica: saca una carga positiva neta por ciclo.' },
      { q: 'Por debajo de su Tm, una bicapa lipídica está en estado…', options: ['gel (colas ordenadas)', 'líquido-cristalino', 'gaseoso', 'micelar'], answer: 0, why: 'Las colas extendidas y empaquetadas reducen la difusión lateral.' },
      { q: 'La glucosa entra a favor de su gradiente a una célula mediante…', options: ['un transportador facilitado (GLUT)', 'difusión simple a través de los lípidos', 'una bomba que consume ATP', 'un canal de K⁺'], answer: 0, why: 'Es polar y grande: necesita una proteína, pero no energía.' }
    ],
    help: { intro: 'Cambia de escena en «Lab»: lípido, ensamblaje, bicapa (temperatura, colesterol) y transporte (con o sin ATP).', items: [['Temperatura', 'ordena o desordena las colas según Tm.'], ['Colesterol', 'amortigua la fluidez.'], ['Transporte', 'partículas O₂, glucosa, Na⁺ y K⁺ con proteínas de membrana.'], ['Desafío', 'elige el mecanismo de transporte.']] }
  };
  MSim.create(def);
})();
