/* Ácidos carboxílicos y derivados — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var D = {
    cl: { n: 'Cloruro de etanoílo', fam: 'cloruro de acilo', sub: 'Cl{l}', lg: 'Cl⁻', lgS: null, pka: -7, ir: '≈ 1800', rank: 4, don: 'Cl (3p) solapa mal con el C (2p): casi no dona', col: 0x3ddc5a, rs: 0.95 },
    an: { n: 'Anhídrido etanoico', fam: 'anhídrido', sub: 'O{l}C(=O)C', lg: 'CH₃COO⁻', lgS: 'CC(=O)O{l}', pka: 4.76, ir: '1820 y 1760', rank: 3, don: 'el O comparte su par con dos C=O: dona poco a cada uno', col: 0xff8787, rs: 0.8 },
    es: { n: 'Etanoato de etilo', fam: 'éster', sub: 'O{l}CC', lg: 'EtO⁻', lgS: 'CCO{l}', pka: 15.9, ir: '≈ 1740', rank: 2, don: 'el O dona su par (resonancia moderada)', col: 0xff6b6b, rs: 0.7 },
    am: { n: 'Etanamida', fam: 'amida', sub: 'N{l}', lg: 'NH₂⁻', lgS: 'N{l}', pka: 38, ir: '≈ 1650', rank: 1, don: 'el N dona su par con fuerza: enlace C–N parcial doble', col: 0x4f7cff, rs: 0.7 }
  }, KEY = ['cl', 'an', 'es', 'am'];
  var G = {};
  KEY.forEach(function (k) {
    var d = D[k]; G[k] = MSim.build('CC{c}(=O{o})' + d.sub); G[k + 'T'] = MSim.strip(MSim.build('CC{c}(O{o})(O{n})' + d.sub), 'o'); G[k + 'L'] = d.lgS ? MSim.strip(MSim.build(d.lgS), 'l') : null;
  });
  G.acid = MSim.build('CC{c}(=O{o})O{n}'); G.carb = MSim.strip(MSim.build('CC{c}(=O{o})O{n}'), 'n'); G.water = MSim.build('O{w}'); G.etoh = MSim.build('CCO{l}'); G.oh = MSim.strip(MSim.build('O{w}'), 'w');
  var S = { d: 'cl', nu: 'H2O', si: 0, prog: 0, run: false, cyc: 0 }, SG, arr = [], lab = {}, nuS, lgS_;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var NUC = { H2O: { n: 'H₂O', t: 'agua', outs: { cl: 'ácido carboxílico + HCl', an: '2 ácido carboxílico', es: 'ácido + alcohol (hidrólisis lenta)', am: 'ácido + NH₄⁺ (calor, H⁺ o HO⁻ fuertes)' }, ok: [1, 1, 1, 1] }, ROH: { n: 'R′OH', t: 'alcohol', outs: { cl: 'éster + HCl', an: 'éster + ácido carboxílico', es: 'transesterificación (equilibrio; H⁺ o RO⁻)', am: 'sin reacción útil' }, ok: [1, 1, 1, 0] }, NH3: { n: 'NH₃', t: 'amoníaco', outs: { cl: 'amida + NH₄Cl', an: 'amida + carboxilato de amonio', es: 'amida + alcohol (lenta)', am: 'sin reacción (misma especie)' }, ok: [1, 1, 1, 0] } };
  function stages() {
    return [
      ['La familia R–CO–L', 'Familia', 'Un acilo unido a un grupo L: cloruro, anhídrido, éster, amida',
        '<p>Los <b>derivados de ácido</b> comparten el grupo <b>acilo R–C(=O)–</b> unido a un grupo L (<b>Cl</b>, <b>OCOR</b>, <b>OR′</b>, <b>NR′₂</b>). Se pueden convertir en el ácido carboxílico por hidrólisis. Lo que diferencia su reactividad es L: cuánto <b>dona</b> su par de electrones al C=O (resonancia) y cuán buen <b>grupo saliente</b> es.</p>'],
      ['Resonancia y reactividad', 'Resonancia', 'Mientras mejor dona L, menos electrófilo es el carbonilo',
        '<p>El par libre de L se deslocaliza hacia el C=O (forma resonante L⁺=C–O⁻): <b>N &gt; O &gt; Cl</b> en capacidad de donar. Cuanto más dona L, <b>menor δ+ en el C</b> y menos reactivo es el derivado, y también <b>menor frecuencia IR de C=O</b> (el C=O gana carácter de enlace simple): cloruro ≈ 1800, anhídrido 1820/1760, éster ≈ 1740, amida ≈ 1650 cm⁻¹. Las esferas azules son los pares de L; las naranjas, el δ+ del carbonilo.</p>'],
      ['Adición–eliminación', 'Mecanismo', 'El nucleófilo se adiciona, se forma un intermedio tetraédrico y sale L⁻',
        '<p>La sustitución acílica es una <b>adición–eliminación</b> en dos pasos: (1) el nucleófilo ataca el C=O y forma el <b>intermedio tetraédrico</b> (O⁻); (2) el par del O⁻ regenera el C=O y <b>expulsa L⁻</b>. A diferencia del ataque a aldehídos y cetonas, aquí el intermedio tiene un buen grupo saliente. La barrera del primer paso es menor cuanto más electrófilo es el carbonilo.</p>'],
      ['Grupo saliente', 'Grupo saliente', 'Cl⁻ ≫ RCOO⁻ ≫ RO⁻ ≫ NH₂⁻: sale el más débil como base',
        '<p>El mejor grupo saliente es la <b>base más débil</b> (pKa del ácido conjugado HL más bajo): <b>Cl⁻ (HCl, −7) &gt; CH₃COO⁻ (4,76) &gt; RO⁻ (≈ 16) &gt; NH₂⁻ (38)</b>. Por eso la reactividad decrece: <b>cloruro &gt; anhídrido &gt; éster ≳ ácido &gt; amida</b>. Un derivado más reactivo se convierte en uno menos reactivo, nunca al revés (sin activación).</p>'],
      ['Hidrólisis del éster', 'Hidrólisis', 'En medio básico (saponificación) es irreversible',
        '<p>Con <b>HO⁻</b> el éster se convierte en <b>carboxilato + alcohol</b>. El último paso, la desprotonación del ácido por el alcóxido o el HO⁻ (pKa 4,76 frente a 15,9), es tan favorable que desplaza todo el equilibrio: <b>saponificación irreversible</b>. En medio ácido, en cambio, la hidrólisis es un <b>equilibrio</b> (inverso de la esterificación de Fischer).</p>'],
      ['La amida: la más estable', 'Amida', 'El enlace C–N es parcialmente doble: plano y con barrera de giro',
        '<p>En la <b>amida</b> el N dona su par al C=O: el grupo O=C–N queda <b>plano</b> y el giro alrededor del enlace C–N tiene una <b>barrera de ≈ 70–90 kJ/mol</b> (carácter de doble enlace parcial). Por eso las amidas son poco electrófilas, se hidrolizan solo con ácido o base fuertes y calor, y forman la cadena de los <b>péptidos</b> (enlace peptídico).</p>']
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
      show('ca', G.carb, 11.2, 0.4, 0).rotation.y = now * 0.25; nm(t.e, 11.2, 3.6, 'carboxilato', 'bl-d'); nm(t.f, 0, -3.8, 'R–C(=O)–L · L = Cl, OCOR, OR′, NR′₂ (y O⁻ en el carboxilato)', 'bl-d');
    } else if (si === 1) {
      var n = 4, ix = Math.min(n - 1, Math.floor(p * n)); var k = S.cyc != null && ctx.P.manual ? KEY.indexOf(S.d) : ix, kk = KEY[k], d = D[kk];
      var g = show(kk, G[kk], 0, 0, 0, [{ tag: 'l', nth: 0, color: blue, r: 0.5 + 0.16 * (4 - d.rank) * 0 + 0.5 * (d.rank === 1 ? 1 : d.rank === 2 ? 0.7 : d.rank === 3 ? 0.45 : 0.25), op: 0.4 }, { tag: 'c', nth: 0, color: ora, r: 0.35 + 0.2 * d.rank, op: 0.4 }]); g.rotation.y = now * 0.2;
      nm(t.a, 0, 3.7, d.n + ' · reactividad ' + ['', 'mínima', 'baja', 'media', 'máxima'][d.rank], 'bl-lead'); nm(t.b, 0, -3.4, d.don, 'bl-d'); nm(t.c, 3.8, 1.5, 'ν(C=O) ' + d.ir + ' cm⁻¹', 'bl-warn');
    } else if (si === 2) {
      var dd = D[S.d], kk2 = S.d, base = show(kk2, G[kk2], 0, 0, 0), a = attack(0, G[kk2], base);
      if (p < 0.35) {
        var q = sm(p / 0.35), dist = 4.4 - 2.4 * q, pos = a.c.clone().addScaledVector(a.n, dist); var w = show('w', G.water, 0, 0, 0); MSim.dock(w, G.water, MSim.idx(G.water, 'w', 0), pos, a.n, 1);
        ar(0, pos.clone(), a.c.clone(), new T.Vector3(0.2, 0.7, 0.5), true); ar(1, a.c.clone().lerp(a.o, 0.5), a.o.clone(), new T.Vector3(0, 0.7, 0.4), q > 0.5);
        nm(t.a, pos.x, pos.y + 1.4, 'H₂O (nucleófilo)', 'bl-warn'); nm(t.b, 0, -3.7, 'ataque perpendicular al plano del acilo · ' + f1(dist) + ' Å', 'bl-d'); nm(t.c, 0, 3.8, dd.n, 'bl-lead');
      } else if (p < 0.65) { base.visible = false; var ti = show(kk2 + 'T', G[kk2 + 'T'], 0, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); nm(t.a, 0, 3.8, 'intermedio tetraédrico (C sp³, O⁻)', 'bl-lead'); nm(t.b, 0, -3.7, 'el par del O⁻ va a regenerar el C=O y expulsar L⁻', 'bl-d'); var tp = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'o', 0), 1), tc = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'c', 0), 1), tl = MSim.wp(ti, G[kk2 + 'T'], MSim.idx(G[kk2 + 'T'], 'l', 0), 1); ar(0, tp.clone().lerp(tc, 0.35), tc.clone().lerp(tp, 0.35), new T.Vector3(0.3, 0.5, 0.4), true); ar(1, tc.clone().lerp(tl, 0.35), tl.clone().add(tl.clone().sub(tc).normalize().multiplyScalar(0.8)), new T.Vector3(0, 0.6, 0.5), true); }
      else {
        var e = sm((p - 0.65) / 0.35); base.visible = false; show('acid', G.acid, -1.5, 0, 0, [{ tag: 'c', nth: 0, color: 0x38a169, r: 0.55, op: 0.28 }]);
        if (G[kk2 + 'L']) { var lgm = show(kk2 + 'L', G[kk2 + 'L'], 4.2 + 2.2 * e, 1.2 + 0.4 * e, 0, [{ tag: 'l', nth: 0, color: red, r: 0.7, op: 0.4 }]); nm(t.b, 6.4 + 2.2 * e, 3.1, dd.lg + ' (sale)', 'bl-warn'); } else { lgS_.visible = true; lgS_.position.set(4.2 + 2.6 * e, 1.2, 0); lgS_.scale.setScalar(dd.rs); lgS_.material.color.setHex(dd.col); nm(t.b, 4.2 + 2.6 * e, 2.5, dd.lg + ' (sale)', 'bl-warn'); }
        nm(t.a, -1.5, 3.4, 'ácido etanoico', 'bl-lead'); nm(t.c, 0, -3.7, 'se regenera el C=O y se expulsa ' + dd.lg + ' (pKa de HL = ' + dd.pka + ')', 'bl-d');
      }
    } else if (si === 3) {
      var ix2 = Math.min(3, Math.floor(p * 4)), gk = KEY[ix2], gd = D[gk]; var gg = show(gk, G[gk], -3.2, 0, 0, [{ tag: 'l', nth: 0, color: red, r: 0.7, op: 0.3 }]); gg.rotation.y = now * 0.2;
      nm(t.a, -3.2, 3.7, gd.n, 'bl-lead'); lgS_.visible = true; lgS_.position.set(4.2, 0, 0); lgS_.scale.setScalar(gd.rs + 0.3); lgS_.material.color.setHex(gd.col); nm(t.b, 4.2, 1.6, gd.lg + ' · pKa(HL) = ' + gd.pka, 'bl-warn'); nm(t.c, 0, -3.7, 'cuanto menor el pKa de HL, mejor grupo saliente', 'bl-d'); nm(t.d, 4.2, -1.6, ix2 === 0 ? 'excelente' : ix2 === 1 ? 'bueno' : ix2 === 2 ? 'regular' : 'muy malo', ix2 < 2 ? 'bl-neg' : 'bl-warn');
    } else if (si === 4) {
      var es = G.es; if (p < 0.4) { var b = show('es', es, -1, 0, 0), aa = attack(0, es, b), q4 = sm(p / 0.4), hp = aa.c.clone().addScaledVector(aa.n, 4.2 - 2.2 * q4); nuS.visible = true; nuS.position.copy(hp); nuS.scale.setScalar(0.62); nuS.material.color.setHex(0xff4d4d); ar(0, hp.clone(), aa.c.clone(), new T.Vector3(0.2, 0.7, 0.5), true); nm(t.a, hp.x, hp.y + 1.2, 'HO⁻', 'bl-warn'); nm(t.b, 0, 3.8, 'etanoato de etilo + HO⁻', 'bl-lead'); nm(t.c, 0, -3.7, 'ataque nucleófilo → intermedio tetraédrico', 'bl-d'); }
      else if (p < 0.7) { show('esT', G.esT, -1, 0, 0, [{ tag: 'o', nth: 0, color: red, r: 0.8, op: 0.4 }]); nm(t.a, 0, 3.8, 'intermedio tetraédrico', 'bl-lead'); nm(t.b, 0, -3.7, 'se expulsa EtO⁻', 'bl-d'); }
      else { var e2 = sm((p - 0.7) / 0.3); show('carb', G.carb, -3.4, 0, 0, [{ tag: 'n', nth: 0, color: red, r: 0.8, op: 0.35 }]); show('etoh', G.etoh, 3.2 + 1.2 * e2, 0, 0); nm(t.a, -3.4, 3.5, 'etanoato (carboxilato)', 'bl-lead'); nm(t.b, 4.4, 3.1, 'etanol', 'bl-d'); nm(t.c, 0, -3.7, 'EtO⁻ toma el H⁺ del ácido: K ≈ 10¹¹ → irreversible (saponificación)', 'bl-warn'); }
    } else {
      var gm = show('am', G.am, 0, 0, 0, [{ tag: 'l', nth: 0, color: blue, r: 0.65, op: 0.4 }]); var ic = MSim.idx(G.am, 'c', 0), il2 = MSim.idx(G.am, 'l', 0), pc = MSim.wp(gm, G.am, ic, 1), pn = MSim.wp(gm, G.am, il2, 1); gm.rotation.y = 0;
      ar(0, pn.clone().add(new T.Vector3(0, 0.7, 0)), pc.clone().add(new T.Vector3(0, 0.5, 0)), new T.Vector3(0, 0.9, 0.3), p > 0.15); nm(t.a, 0, 3.8, 'etanamida · O=C–N plano', 'bl-lead'); nm(t.b, 3.5, 1.4, 'C–N ≈ 1,33 Å (parcialmente doble)', 'bl-warn'); nm(t.c, 0, -3.7, 'barrera de giro C–N ≈ 70–90 kJ/mol → enlace peptídico plano', 'bl-d');
    }
    arr.forEach(function (a) { a.tick(now); });
  }
  var def = {
    key: 'derivados-acido-carboxilico', title: 'Ácidos carboxílicos y derivados', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#34d399', light: '#047857' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [2, 3, 15], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0.5, 16], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 17, 3], target: [0, 0, 0] }],
    layers: [{ id: 'arrows', label: 'Flechas de electrones', icon: '↷' }, { id: 'halo', label: 'Halos', icon: '◉' }],
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
    hud: function () { var d = D[S.d], nu = NUC[S.nu]; return { eq: { chip: 'Acilo', name: d.fam + ' + ' + nu.n, body: '<div class="eqline"><small>Derivado</small>' + d.n + '</div><div class="eqline"><small>Grupo saliente</small>' + d.lg + ' (pKa HL ' + d.pka + ')</div><div class="eqline"><small>Producto</small>' + nu.outs[S.d] + '</div>' }, legend: [{ label: 'Flecha', color: '#ff7a3d', arrow: true, text: 'par de e⁻' }, { label: 'Azul', color: '#4dabf7', text: 'par donante de L' }, { label: 'Naranja', color: '#ffa94d', text: 'δ+ del C=O' }] }; },
    measures: function () { var d = D[S.d], nu = NUC[S.nu]; return [['Derivado', d.n], ['Grupo saliente', d.lg], ['pKa de HL', String(d.pka)], ['ν(C=O)', d.ir + ' cm⁻¹'], ['Reactividad', ['', 'mínima', 'baja', 'media', 'máxima'][d.rank]], ['Nucleófilo', nu.t], ['Producto', nu.outs[S.d]]]; },
    ideas: ['Reactividad: <b>cloruro &gt; anhídrido &gt; éster ≳ ácido &gt; amida</b> (en orden de grupo saliente y de donación de L).', '<b>Adición–eliminación</b>: intermedio tetraédrico y expulsión de L⁻.', 'Un derivado reactivo da uno menos reactivo; para la dirección inversa hay que activar (p. ej. SOCl₂).', '<b>Saponificación</b> irreversible por la formación de carboxilato; la hidrólisis ácida es un equilibrio.', 'La amida es plana por resonancia: base del enlace peptídico.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Mecanismo'); el.appendChild(c);
      ui.st = kit.ui.options({ label: 'Etapa', cols: 3, value: String(S.si), options: [['Familia', 0], ['Resonancia', 1], ['Mecanismo', 2], ['Grupo saliente', 3], ['Hidrólisis éster', 4], ['Amida', 5]].map(function (x) { return { v: String(x[1]), label: x[0] }; }), onChange: function (v) { ctx.goManual(); S.si = +v; S.prog = 0; S.run = true; } }); c.appendChild(ui.st);
      ui.pg = kit.ui.slider({ label: 'Avance', min: 0, max: 1, step: 0.01, value: S.prog, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.prog = v; } }); c.appendChild(kit.ui.sliders([ui.pg]));
      c.appendChild(ctx.btnRow([{ t: '▶ Reproducir', primary: true, fn: function () { ctx.goManual(); S.prog = 0; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var b = kit.ui.card('Derivado y nucleófilo'); el.appendChild(b);
      ui.d = kit.ui.options({ label: 'Derivado', cols: 2, value: S.d, options: KEY.map(function (k) { return { v: k, label: D[k].fam.charAt(0).toUpperCase() + D[k].fam.slice(1), sub: 'pKa HL ' + D[k].pka }; }), onChange: function (v) { ctx.goManual(); S.d = v; } }); b.appendChild(ui.d);
      ui.nu = kit.ui.options({ label: 'Nucleófilo', cols: 3, value: S.nu, options: [{ v: 'H2O', label: 'H₂O' }, { v: 'ROH', label: 'R′OH' }, { v: 'NH3', label: 'NH₃' }], onChange: function (v) { S.nu = v; } }); b.appendChild(ui.nu);
    },
    graphs: [
      { title: 'Reactividad y frecuencia IR del C=O', h: 190, note: 'A mayor donación de L, menor ν(C=O) y menor reactividad.', draw: function (cx, w, h, col) {
        var arr2 = [['Cloruro', 1800, 'cl'], ['Anhídrido', 1790, 'an'], ['Éster', 1740, 'es'], ['Ácido', 1710, 'ac'], ['Amida', 1650, 'am']], L = 70, R = 14, Tp = 10, B = 26, pw = w - L - R, rh = (h - Tp - B) / arr2.length, lo = 1600, hi = 1850;
        cx.font = '10.5px system-ui'; arr2.forEach(function (q, i) { var y = Tp + i * rh, sel = q[2] === S.d; cx.fillStyle = sel ? '#34d399' : '#6b7c8e'; cx.fillRect(L, y + 3, pw * (q[1] - lo) / (hi - lo), rh - 6); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(q[0], L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(q[1], L + pw * (q[1] - lo) / (hi - lo) + 4, y + rh / 2 + 3); });
        cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('ν(C=O) / cm⁻¹ (anhídrido: promedio de 1820 y 1760)', L + pw / 2, h - 5);
      } },
      { title: 'Perfil de energía de la adición–eliminación', h: 200, note: 'Esquema cualitativo: con mejor grupo saliente y carbonilo más electrófilo, las barreras bajan.', draw: function (cx, w, h, col) {
        var d = D[S.d], f = (d.rank - 1) / 3, a1 = 0.78 - 0.4 * f, i1 = 0.55 - 0.15 * f, a2 = 0.6 - 0.25 * f, pr = 0.3, pts = [[0, 0.42], [0.25, a1], [0.45, i1], [0.7, a2], [1, pr]], L = 10, R = 10, Tp = 16, B = 26, pw = w - L - R, ph = h - Tp - B, sx = function (u) { return L + pw * u; }, sy = function (v) { return Tp + ph - ph * v; };
        cx.strokeStyle = '#34d399'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (q, i) { var x = sx(q[0]), y = sy(q[1]); if (i === 0) cx.moveTo(x, y); else { var p0 = pts[i - 1], xm = (sx(p0[0]) + x) / 2; cx.bezierCurveTo(xm, sy(p0[1]), xm, y, x, y); } }); cx.stroke(); cx.lineWidth = 1;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; ['R–CO–L + Nu', 'TS 1', 'Intermedio tetraédrico', 'TS 2', 'R–CO–Nu + L'].forEach(function (s, i) { cx.fillText(s, Math.min(w - 52, Math.max(52, sx(pts[i][0]))), i === 2 ? sy(pts[i][1]) + 14 : sy(pts[i][1]) - 7); }); cx.fillText(d.n, w / 2, h - 4);
      } }
    ],
    calc: function () {
      var d = D[S.d], nu = NUC[S.nu], row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, i = KEY.indexOf(S.d), ok = nu.ok[i];
      return '<div class="card-kicker">' + d.fam + ' + ' + nu.t + '</div><div class="calc-step">1 · Reactividad del derivado</div><table class="calc-table">' + row('Grupo saliente', d.lg + ' · pKa(HL) = <b>' + d.pka + '</b>') + row('Donación de L', d.don) + row('ν(C=O)', d.ir + ' cm⁻¹') + '</table>' +
        '<div class="calc-step">2 · Resultado esperado</div><table class="calc-table">' + row('Producto', '<b>' + nu.outs[S.d] + '</b>') + row('¿Favorable?', ok ? '<span class="calc-ok">sí: el producto es menos o igual de reactivo</span>' : '<span class="calc-hi">no en condiciones suaves</span>') + '</table><p class="muted small">Regla: la sustitución avanza hacia el derivado con el <b>grupo saliente más básico</b> (más estable). Cloruro → anhídrido → éster → amida.</p>';
    },
    quiz: [
      { q: '¿Cuál es el orden de reactividad frente a nucleófilos?', options: ['Cloruro de acilo > anhídrido > éster > amida', 'Amida > éster > anhídrido > cloruro de acilo', 'Éster > amida > cloruro > anhídrido', 'Todos reaccionan igual'], answer: 0, why: 'La reactividad sigue la calidad del grupo saliente y la menor donación de L: Cl⁻ es el mejor, NH₂⁻ el peor.' },
      { q: '¿Por qué el C=O de una amida absorbe a menor frecuencia IR (≈ 1650 cm⁻¹) que el de un cloruro de acilo (≈ 1800 cm⁻¹)?', options: ['El N dona su par al C=O y debilita el doble enlace', 'La amida es más pequeña', 'El cloro dona más que el N', 'La amida tiene más hidrógenos'], answer: 0, why: 'La resonancia N⁺=C–O⁻ da carácter de enlace simple al C=O.' },
      { q: 'El mecanismo de la sustitución nucleófila acílica es…', options: ['Adición–eliminación con intermedio tetraédrico', 'SN2 concertado', 'SN1 con carbocatión', 'E2'], answer: 0, why: 'El nucleófilo se adiciona al C=O y luego sale L⁻ desde el intermedio tetraédrico.' },
      { q: '¿Por qué la saponificación de un éster es irreversible?', options: ['El ácido formado es desprotonado a carboxilato (pKa 4,76 frente a 15,9 del alcohol)', 'El alcohol se evapora', 'El éster es más estable que el ácido', 'No hay agua'], answer: 0, why: 'El paso ácido–base final desplaza el equilibrio por completo hacia el carboxilato.' },
      { q: '¿Cuál de las siguientes conversiones es posible en condiciones suaves?', options: ['Cloruro de acilo + amina → amida', 'Amida + alcohol → cloruro de acilo', 'Éster + agua → cloruro de acilo', 'Amida + agua → anhídrido'], answer: 0, why: 'Solo se pasa de un derivado más reactivo a uno menos reactivo.' },
      { q: '¿Qué grupo saliente es el mejor?', options: ['Cl⁻ (pKa de HCl = −7)', 'CH₃COO⁻ (pKa 4,76)', 'EtO⁻ (pKa 15,9)', 'NH₂⁻ (pKa 38)'], answer: 0, why: 'El mejor grupo saliente es la base más débil, es decir, la que tiene el ácido conjugado más fuerte.' },
      { q: 'La barrera de giro del enlace C–N de una amida (≈ 70–90 kJ/mol) se debe a…', options: ['su carácter parcial de doble enlace', 'el tamaño del átomo de nitrógeno', 'los puentes de hidrógeno con el disolvente', 'la hibridación sp³ del N'], answer: 0, why: 'La resonancia hace plano el grupo O=C–N y restringe el giro.' },
      { q: 'En el intermedio tetraédrico de la hidrólisis de un cloruro de acilo, ¿qué ocurre a continuación?', options: ['El O⁻ regenera el C=O y expulsa Cl⁻', 'El Cl⁻ ataca al oxígeno', 'Se rompe el enlace C–C', 'Se protona el cloro'], answer: 0, why: 'El par del O⁻ reconstruye el doble enlace y expulsa el mejor grupo saliente.' }
    ],
    help: { intro: 'Elige derivado y nucleófilo en «Lab» o sigue la lección. En «Mecanismo» verás aproximarse al agua, el intermedio tetraédrico y la salida de L⁻.', items: [['Halos azules', 'par donante de L (resonancia).'], ['Halos naranjas', 'δ+ del carbono carbonílico.'], ['Flechas', 'movimiento de los pares de e⁻.'], ['Cálculo', 'producto esperado y regla de reactividad.']] }
  };
  MSim.create(def);
})();
