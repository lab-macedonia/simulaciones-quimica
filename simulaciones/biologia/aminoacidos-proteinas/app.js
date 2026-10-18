/* Aminoácidos y estructura de proteínas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

var AAM = (function () {
  var D = Math.PI / 180;
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function nrm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function place(a, b, c, R, th, ph) {
    var bc = nrm(sub(c, b)), n = nrm(cross(sub(b, a), bc)), m = cross(n, bc), t = th * D, p = ph * D;
    var d2 = [-R * Math.cos(t), R * Math.sin(t) * Math.cos(p), R * Math.sin(t) * Math.sin(p)];
    return add(c, add(mul(bc, d2[0]), add(mul(m, d2[1]), mul(n, d2[2]))));
  }
  /* Ac-Xaa-NMe con ángulos φ, ψ; devuelve átomos [{n,el,p}] y enlaces */
  function dipep(phi, psi, cbSign) {
    var A = [], P = {}; function put(n, el, p) { P[n] = p; A.push({ n: n, el: el, p: p }); }
    put('CH3a', 'C', [0, 0, 0]); put('C0', 'C', [1.52, 0, 0]); put('N1', 'N', add(P.C0, mul([Math.cos(63.8 * D), Math.sin(63.8 * D), 0], 1.329)));
    put('CA', 'C', place(P.CH3a, P.C0, P.N1, 1.458, 121.7, 180));
    put('C1', 'C', place(P.C0, P.N1, P.CA, 1.525, 111, phi));
    put('N2', 'N', place(P.N1, P.CA, P.C1, 1.329, 116.2, psi));
    put('CH3b', 'C', place(P.CA, P.C1, P.N2, 1.458, 121.7, 180));
    put('O0', 'O', place(P.CA, P.N1, P.C0, 1.231, 122.9, 0));
    put('H1', 'H', place(P.CH3a, P.C0, P.N1, 1.01, 119, 0));
    put('O1', 'O', place(P.N1, P.CA, P.C1, 1.231, 120.8, psi + 180));
    put('H2', 'H', place(P.CA, P.C1, P.N2, 1.01, 119, 0));
    put('CB', 'C', place(P.C0, P.N1, P.CA, 1.53, 110.5, phi + 120 * cbSign));
    put('HA', 'H', place(P.C0, P.N1, P.CA, 1.09, 108, phi - 120 * cbSign));
    var B = [['CH3a', 'C0'], ['C0', 'N1'], ['N1', 'CA'], ['CA', 'C1'], ['C1', 'N2'], ['N2', 'CH3b'], ['C0', 'O0'], ['N1', 'H1'], ['C1', 'O1'], ['N2', 'H2'], ['CA', 'CB'], ['CA', 'HA']];
    return { A: A, P: P, B: B };
  }
  function chirality(d) { var P = d.P; return dot(cross(sub(P.C1, P.CA), sub(P.CB, P.CA)), sub(P.N1, P.CA)); }
  var RAD = { H: 1.1, C: 1.7, N: 1.55, O: 1.52 }, URAD = { CH3a: 2.0, CH3b: 2.0, CA: 1.8, CB: 2.0 };
  var topo = null;
  function topoD(d) {
    if (topo) return topo; var n = d.A.length, idx = {}; d.A.forEach(function (a, i) { idx[a.n] = i; }); var adj = d.A.map(function () { return []; }); d.B.forEach(function (b) { adj[idx[b[0]]].push(idx[b[1]]); adj[idx[b[1]]].push(idx[b[0]]); });
    topo = d.A.map(function (_, s) { var dist = d.A.map(function () { return 99; }); dist[s] = 0; var q = [s]; while (q.length) { var u = q.shift(); adj[u].forEach(function (v) { if (dist[v] > dist[u] + 1) { dist[v] = dist[u] + 1; q.push(v); } }); } return dist; }); return topo;
  }
  function clash(d, f) {
    f = f || 0.78; var T = topoD(d), worst = 1e9, w = null;
    for (var i = 0; i < d.A.length; i++) for (var j = i + 1; j < d.A.length; j++) { if (T[i][j] <= 3) continue; var a = d.A[i], b = d.A[j], r = (URAD[a.n] || RAD[a.el]) + (URAD[b.n] || RAD[b.el]), dd = Math.sqrt(dot(sub(a.p, b.p), sub(a.p, b.p))) / r; if (dd < worst) { worst = dd; w = [a.n, b.n]; } if (dd < f) return { bad: true, ratio: dd, pair: [a.n, b.n] }; }
    return { bad: false, ratio: worst, pair: w };
  }
  return { dipep: dipep, chirality: chirality, clash: clash, place: place, sub: sub, add: add, mul: mul, cross: cross, dot: dot, nrm: nrm };
})();
AAM.chain = function (n, phi, psi, L) {
  var A = AAM, atoms = [], cs = L === false ? 1 : -1, last = {};
  function put(nm, el, p, r) { atoms.push({ n: nm, el: el, p: p, r: r }); return p; }
  var N = [0, 0, 0], CA = [1.458, 0, 0], C = A.add(CA, A.mul([Math.cos(69 * Math.PI / 180), Math.sin(69 * Math.PI / 180), 0], 1.525));
  put('N', 'N', N, 0); put('CA', 'C', CA, 0); put('C', 'C', C, 0); var prevC = C, prevCA = CA, prevN = N;
  put('O', 'O', A.place(N, CA, C, 1.231, 120.8, psi + 180), 0);
  put('CB', 'C', A.place(prevC, N, CA, 1.53, 110.5, 0 + phi + 120 * cs), 0); // phi irrelevante en el primero: se usa 'phi' de referencia
  put('H', 'H', A.place(CA, C, N, 1.01, 119, 0), 0);
  atoms[atoms.length - 1].p = A.add(N, [-0.9, 0.45, 0]); // H del N-terminal (arbitrario)
  for (var i = 1; i < n; i++) {
    var N2 = A.place(prevN, prevCA, prevC, 1.329, 116.2, psi), CA2 = A.place(prevCA, prevC, N2, 1.458, 121.7, 180), C2 = A.place(prevC, N2, CA2, 1.525, 111, phi);
    put('N', 'N', N2, i); put('CA', 'C', CA2, i); put('C', 'C', C2, i);
    put('O', 'O', A.place(N2, CA2, C2, 1.231, 120.8, psi + 180), i);
    put('CB', 'C', A.place(prevC, N2, CA2, 1.53, 110.5, phi + 120 * cs), i);
    put('H', 'H', A.place(prevCA, prevC, N2, 1.01, 119, 0), i);
    prevN = N2; prevCA = CA2; prevC = C2;
  }
  atoms.forEach(function (a) { a.r = a.r; });
  var k = 0, res = atoms.map(function (a, i) { return a; });
  return atoms;
};
if (typeof module !== 'undefined') module.exports = AAM;
(function () {
  var fmt = SimKit.fmt, A = AAM, GS = 0.5;
  var CLS = { apolar: ['#f59f00', 0xf59f00, 'apolar (hidrofóbica)'], polar: ['#20c997', 0x20c997, 'polar sin carga'], acido: ['#fa5252', 0xfa5252, 'ácida (carga −)'], basico: ['#4c6ef5', 0x4c6ef5, 'básica (carga +)'] };
  var AA = [
    { k: 'Gly', c: 'G', n: 'glicina', cls: 'apolar', pk: [2.34, 9.60], kd: -0.4, sm: 'N{n}CC(=O)O{h}' },
    { k: 'Ala', c: 'A', n: 'alanina', cls: 'apolar', pk: [2.34, 9.69], kd: 1.8, sm: 'N{n}C(C)C(=O)O{h}' },
    { k: 'Val', c: 'V', n: 'valina', cls: 'apolar', pk: [2.32, 9.62], kd: 4.2, sm: 'N{n}C(C(C)C)C(=O)O{h}' },
    { k: 'Leu', c: 'L', n: 'leucina', cls: 'apolar', pk: [2.36, 9.60], kd: 3.8, sm: 'N{n}C(CC(C)C)C(=O)O{h}' },
    { k: 'Ile', c: 'I', n: 'isoleucina', cls: 'apolar', pk: [2.36, 9.68], kd: 4.5, sm: 'N{n}C(C(C)CC)C(=O)O{h}' },
    { k: 'Met', c: 'M', n: 'metionina', cls: 'apolar', pk: [2.28, 9.21], kd: 1.9, sm: 'N{n}C(CCSC)C(=O)O{h}' },
    { k: 'Phe', c: 'F', n: 'fenilalanina', cls: 'apolar', pk: [1.83, 9.13], kd: 2.8, sm: 'N{n}C(CPh)C(=O)O{h}' },
    { k: 'Pro', c: 'P', n: 'prolina', cls: 'apolar', pk: [1.99, 10.96], kd: -1.6, sm: 'N{n}C(C)C(=O)O{h}', ring: 'pro' },
    { k: 'Trp', c: 'W', n: 'triptófano', cls: 'apolar', pk: [2.38, 9.39], kd: -0.9, sm: 'N{n}C(C)C(=O)O{h}', ring: 'trp' },
    { k: 'Ser', c: 'S', n: 'serina', cls: 'polar', pk: [2.21, 9.15], kd: -0.8, sm: 'N{n}C(CO)C(=O)O{h}' },
    { k: 'Thr', c: 'T', n: 'treonina', cls: 'polar', pk: [2.09, 9.10], kd: -0.7, sm: 'N{n}C(C(C)O)C(=O)O{h}' },
    { k: 'Cys', c: 'C', n: 'cisteína', cls: 'polar', pk: [1.96, 10.28], R: { t: 'acid', pk: 8.18, lbl: 'tiol –SH' }, kd: 2.5, sm: 'N{n}C(CS{r})C(=O)O{h}' },
    { k: 'Tyr', c: 'Y', n: 'tirosina', cls: 'polar', pk: [2.20, 9.11], R: { t: 'acid', pk: 10.07, lbl: 'fenol –OH' }, kd: -1.3, sm: 'N{n}C(CPh)C(=O)O{h}', tyr: true },
    { k: 'Asn', c: 'N', n: 'asparagina', cls: 'polar', pk: [2.02, 8.80], kd: -3.5, sm: 'N{n}C(CC(=O)N)C(=O)O{h}' },
    { k: 'Gln', c: 'Q', n: 'glutamina', cls: 'polar', pk: [2.17, 9.13], kd: -3.5, sm: 'N{n}C(CCC(=O)N)C(=O)O{h}' },
    { k: 'Asp', c: 'D', n: 'aspartato (ác. aspártico)', cls: 'acido', pk: [1.88, 9.60], R: { t: 'acid', pk: 3.65, lbl: 'COOH lateral' }, kd: -3.5, sm: 'N{n}C(CC(=O)O{r})C(=O)O{h}' },
    { k: 'Glu', c: 'E', n: 'glutamato (ác. glutámico)', cls: 'acido', pk: [2.19, 9.67], R: { t: 'acid', pk: 4.25, lbl: 'COOH lateral' }, kd: -3.5, sm: 'N{n}C(CCC(=O)O{r})C(=O)O{h}' },
    { k: 'Lys', c: 'K', n: 'lisina', cls: 'basico', pk: [2.18, 8.95], R: { t: 'base', pk: 10.53, lbl: '–NH₃⁺ lateral' }, kd: -3.9, sm: 'N{n}C(CCCCN{r})C(=O)O{h}' },
    { k: 'Arg', c: 'R', n: 'arginina', cls: 'basico', pk: [2.17, 9.04], R: { t: 'base', pk: 12.48, lbl: 'guanidinio' }, kd: -4.5, sm: 'N{n}C(CCCN{r}C(=N{r})N{r})C(=O)O{h}' },
    { k: 'His', c: 'H', n: 'histidina', cls: 'basico', pk: [1.82, 9.17], R: { t: 'base', pk: 6.00, lbl: 'imidazol' }, kd: -3.2, sm: 'N{n}C(C)C(=O)O{h}', ring: 'his' }
  ];
  var AAI = {}; AA.forEach(function (a) { AAI[a.k] = a; });
  function groups(a) { var g = [{ t: 'acid', pk: a.pk[0], id: 'cooh', lbl: 'α-COOH' }, { t: 'base', pk: a.pk[1], id: 'amino', lbl: 'α-NH₃⁺' }]; if (a.R) g.push({ t: a.R.t, pk: a.R.pk, id: 'R', lbl: a.R.lbl }); return g; }
  function fp(g, pH) { return g.t === 'base' ? 1 / (1 + Math.pow(10, pH - g.pk)) : 1 / (1 + Math.pow(10, pH - g.pk)); }
  function charge(a, pH) { return groups(a).reduce(function (s, g) { var f = 1 / (1 + Math.pow(10, pH - g.pk)); return s + (g.t === 'base' ? f : -(1 - f)); }, 0); }
  function pI(a) { var lo = 0, hi = 14; for (var i = 0; i < 50; i++) { var m = (lo + hi) / 2; if (charge(a, m) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  function dist(a, pH) { var d = { 0: 1 }; groups(a).forEach(function (g) { var f = 1 / (1 + Math.pow(10, pH - g.pk)), nd = {}; Object.keys(d).forEach(function (k) { k = +k; var p0 = g.t === 'base' ? 0 : -1, p1 = g.t === 'base' ? 1 : 0; /* protonado/desprotonado */ var cp = g.t === 'base' ? 1 : 0, cd = g.t === 'base' ? 0 : -1; nd[k + cp] = (nd[k + cp] || 0) + d[k] * f; nd[k + cd] = (nd[k + cd] || 0) + d[k] * (1 - f); }); d = nd; }); return d; }
  var S = { aa: 'Ala', pH: 7, mode: 'aa', prog: 0, ss: 'helix', phi: -57, psi: -47, _st: -1, hl: 'all' }, G = {}, labs = {}, cache = {}, key_ = '';
  var EL = null;
  /* --- constructor de moléculas dinámicas --- */
  function mkMol(ctx, atoms, bonds, rs) {
    var T = ctx.T, g = new T.Group(), m = { g: g, am: [], bd: [], halo: [], atoms: atoms, bonds: bonds, P: [] }; rs = rs || 1;
    atoms.forEach(function (a, i) { var d = ctx.EL[a.el] || [0xcccccc, 1], mesh = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshStandardMaterial({ color: a.col || d[0], roughness: 0.4 })); mesh.scale.setScalar(d[1] * 0.42 * rs * (a.sc || 1)); mesh.position.set(a.p[0] * GS, a.p[1] * GS, a.p[2] * GS); g.add(mesh); m.am.push(mesh); m.P.push(mesh.position);
      var h = new T.Mesh(new T.SphereGeometry(1, 14, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })); h.visible = false; h.position.copy(mesh.position); g.add(h); m.halo.push(h); });
    bonds.forEach(function (b) { var o = b[2] || 1, cyl = []; for (var k = 0; k < o; k++) { var c = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8, 1, true), new T.MeshStandardMaterial({ color: b[3] || 0xbfc7d1, roughness: 0.5 })); g.add(c); cyl.push(c); } m.bd.push({ i: b[0], j: b[1], o: o, w: b[3] ? 0.1 : 0.055, cyl: cyl }); });
    m.layout = function () { m.bd.forEach(function (b) { var p = m.P[b.i], q = m.P[b.j], d = q.clone().sub(p), L = d.length(), qq = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); b.cyl.forEach(function (c, k) { c.scale.set(b.w, Math.max(L, 1e-4), b.w); c.position.copy(p).add(q).multiplyScalar(0.5).add(new T.Vector3(0, 0, (k - (b.o - 1) / 2) * 0.16)); c.quaternion.copy(qq); }); }); m.halo.forEach(function (h, i) { h.position.copy(m.P[i]); }); }; m.layout();
    return m;
  }
  function refreshBonds(m) { m.bd.forEach(function (b) { var v = m.am[b.i].visible && m.am[b.j].visible; b.cyl.forEach(function (c) { c.visible = v; }); }); }
  /* --- aminoácido a partir de mb --- */
  function aaModel(ctx, a) {
    if (cache[a.k]) return cache[a.k]; var geo = MSim.build(a.sm), at = geo.a.map(function (x, i) { return { el: x[0], p: [x[1], x[2], x[3]], tag: geo.tag[i] }; }), bd = geo.b.map(function (b) { return [b[0], b[1], b[2]]; });
    var nb = at.map(function () { return []; }); bd.forEach(function (b) { nb[b[0]].push(b[1]); nb[b[1]].push(b[0]); });
    var iN = 0, iCA = nb[0].filter(function (j) { return at[j].el === 'C'; })[0], iC = nb[iCA].filter(function (j) { return at[j].el === 'C' && nb[j].some(function (k) { return at[k].el === 'O' && at[k].tag === 'h'; }); })[0];
    var iR = nb[iCA].filter(function (j) { return j !== iN && j !== iC && at[j].el === 'C'; })[0], iHA = nb[iCA].filter(function (j) { return at[j].el === 'H'; })[0];
    if (iR !== undefined) { var P = function (i) { return at[i].p; }, t = A.dot(A.cross(A.sub(P(iC), P(iCA)), A.sub(P(iR), P(iCA))), A.sub(P(iN), P(iCA))); if (t < 0) at.forEach(function (x) { x.p = [-x.p[0], x.p[1], x.p[2]]; }); }

    // anillos construidos a mano (Pro, His, Trp): el generador SMILES solo cubre el fenilo
    var preExtra = [];
    if (a.ring) {
      var Pp = function (i) { return at[i].p; }, DG = Math.PI / 180;
      var addAt = function (el, p) { at.push({ el: el, p: p, tag: 'r' }); nb.push([]); return at.length - 1; };
      var bondAt = function (i, j, o) { bd.push([i, j, o || 1]); nb[i].push(j); nb[j].push(i); };
      var hsOf = function (i) { return nb[i].filter(function (j) { return at[j].el === 'H'; }); };
      var toC = function (h, p) { at[h].el = 'C'; at[h].p = p; at[h].tag = 'r'; };
      var tetH = function (x, u, v, hs, len) { var xu = A.nrm(A.sub(Pp(u), Pp(x))), xv = A.nrm(A.sub(Pp(v), Pp(x))), b = A.nrm(A.mul(A.add(xu, xv), -1)), n = A.nrm(A.cross(xu, xv)), c = Math.cos(54.75 * DG), sn = Math.sin(54.75 * DG); [1, -1].forEach(function (sg, k) { if (hs[k] !== undefined) at[hs[k]].p = A.add(Pp(x), A.mul(A.add(A.mul(b, c), A.mul(n, sn * sg)), len)); }); };
      if (a.ring === 'pro') {
        var hCB = hsOf(iR), hN = hsOf(iN), iG = hCB[0], iD = hN[0], hKeep = hN[1];
        var N0 = Pp(iN), CA0 = Pp(iCA), CB0 = Pp(iR), mid = A.mul(A.add(N0, CB0), 0.5), out = A.nrm(A.sub(mid, CA0)), al = A.nrm(A.sub(CB0, N0)), nrmP = A.nrm(A.cross(al, out));
        var g = A.add(A.add(CA0, A.mul(out, 2.2)), A.add(A.mul(al, 0.75), A.mul(nrmP, 0.35))), d = A.add(A.add(CA0, A.mul(out, 2.2)), A.add(A.mul(al, -0.75), A.mul(nrmP, -0.15)));
        var cons = [['d', 'n', 1.47], ['d', 'g', 1.52], ['g', 'b', 1.53], ['d', 'c', 2.40], ['g', 'c', 2.39], ['g', 'n', 2.40], ['d', 'b', 2.40]], fx = { n: N0, c: CA0, b: CB0 };
        for (var it = 0; it < 800; it++) { var gg = [0, 0, 0], gd = [0, 0, 0]; cons.forEach(function (cn) { var P1 = cn[0] === 'd' ? d : g, P2 = cn[1] === 'd' ? d : cn[1] === 'g' ? g : fx[cn[1]], v = A.sub(P1, P2), L = Math.sqrt(A.dot(v, v)) || 1e-6, f = A.mul(v, 2 * (L - cn[2]) / L); if (cn[0] === 'd') gd = A.add(gd, f); else gg = A.add(gg, f); if (cn[1] === 'd') gd = A.sub(gd, f); else if (cn[1] === 'g') gg = A.sub(gg, f); }); g = A.sub(g, A.mul(gg, 0.05)); d = A.sub(d, A.mul(gd, 0.05)); }
        toC(iG, g); toC(iD, d); bondAt(iG, iD, 1);
        var gH = [addAt('H', [0, 0, 0]), addAt('H', [0, 0, 0])], dH = [addAt('H', [0, 0, 0]), addAt('H', [0, 0, 0])];
        gH.forEach(function (h) { bondAt(iG, h, 1); }); dH.forEach(function (h) { bondAt(iD, h, 1); });
        tetH(iG, iR, iD, gH, 1.09); tetH(iD, iG, iN, dH, 1.09); tetH(iR, iCA, iG, hCB.slice(1), 1.09); tetH(iN, iCA, iD, [hKeep], 1.01);
      } else {
        var hs = hsOf(iR), hx = hs[0], ex = A.nrm(A.sub(Pp(hx), Pp(iR))); toC(hx, A.add(Pp(iR), A.mul(ex, 1.51)));
        var v0 = A.sub(Pp(iCA), Pp(iR)), vv = A.nrm(A.sub(v0, A.mul(ex, A.dot(v0, ex)))), ww = A.cross(ex, vv), org = Pp(hx);
        var q2 = function (x, y) { return A.add(A.add(org, A.mul(ex, x)), A.mul(ww, y)); };
        var s5 = a.ring === 'his' ? 1.37 : 1.39, R5 = s5 / (2 * Math.sin(36 * DG)), pv = [], ids = [hx];
        for (var k = 0; k < 5; k++) { var ph = Math.PI + k * 72 * DG; pv.push([R5 + R5 * Math.cos(ph), R5 * Math.sin(ph)]); }
        var C5 = [R5, 0], names = a.ring === 'his' ? ['N', 'C', 'N', 'C'] : ['C', 'N', 'C', 'C'];
        for (k = 1; k < 5; k++) ids.push(addAt(names[k - 1], q2(pv[k][0], pv[k][1])));
        var orders = a.ring === 'his' ? [1, 1, 2, 1, 2] : [2, 1, 1, 2, 1];
        for (k = 0; k < 5; k++) bondAt(ids[k], ids[(k + 1) % 5], orders[k]);
        var radH = function (idx, c2, len, el) { var pos = Pp(idx), cc = q2(c2[0], c2[1]), dd = A.nrm(A.sub(pos, cc)); return A.add(pos, A.mul(dd, len)); };
        var hOn = function (idx, c2) { var len = at[idx].el === 'N' ? 1.01 : 1.08, h = addAt('H', radH(idx, c2, len)); bondAt(idx, h, 1); return h; };
        if (a.ring === 'his') { // CG(0) ND1(1) CE1(2) NE2(3) CD2(4)
          hOn(ids[1], C5); hOn(ids[2], C5); hOn(ids[4], C5);
          preExtra.push({ n: ids[3], p: radH(ids[3], C5, 1.01), grp: 'R' });
        } else { // CG(0) CD1(1) NE1(2) CE2(3) CD2(4) + benceno
          hOn(ids[1], C5); hOn(ids[2], C5);
          var mp = [(pv[3][0] + pv[4][0]) / 2, (pv[3][1] + pv[4][1]) / 2], od = [mp[0] - C5[0], mp[1] - C5[1]], ol = Math.hypot(od[0], od[1]), C6 = [mp[0] + od[0] / ol * s5 * 0.8660254, mp[1] + od[1] / ol * s5 * 0.8660254];
          var a4 = Math.atan2(pv[4][1] - C6[1], pv[4][0] - C6[0]), a3 = Math.atan2(pv[3][1] - C6[1], pv[3][0] - C6[0]), dstep = 60 * DG, wr = function (x) { return Math.abs(Math.atan2(Math.sin(x), Math.cos(x))); };
          if (wr(a4 + 5 * dstep - a3) > 0.01) dstep = -dstep;
          var hex = [ids[4]]; for (k = 1; k <= 4; k++) hex.push(addAt('C', q2(C6[0] + s5 * Math.cos(a4 + k * dstep), C6[1] + s5 * Math.sin(a4 + k * dstep))));
          hex.push(ids[3]);
          var hord = [1, 2, 1, 2, 1, 2]; for (k = 0; k < 5; k++) bondAt(hex[k], hex[k + 1], hord[k]);
          for (k = 1; k <= 4; k++) hOn(hex[k], C6);
        }
      }
    }
    // tirosina: sustituye el H para del anillo por OH
    if (a.tyr) { var ring = []; var gb = at.map(function (_, i) { return i; }), Cs = gb.filter(function (i) { return at[i].el === 'C'; }); var best = -1, bd2 = -1; Cs.forEach(function (i) { var hN = nb[i].filter(function (j) { return at[j].el === 'H'; }); if (hN.length === 1 && nb[i].length === 3) { var d = Math.hypot(at[i].p[0] - at[iR].p[0], at[i].p[1] - at[iR].p[1], at[i].p[2] - at[iR].p[2]); if (d > bd2) { bd2 = d; best = i; } } });
      var h = nb[best].filter(function (j) { return at[j].el === 'H'; })[0], dir = A.nrm(A.sub(at[h].p, at[best].p)), pO = A.add(at[best].p, A.mul(dir, 1.36)); at[h].el = 'O'; at[h].p = pO; at[h].tag = 'r'; var perp = A.nrm(A.cross(dir, [0, 0, 1])); if (Math.abs(A.dot(perp, perp)) < 0.1) perp = [1, 0, 0]; var pH = A.add(pO, A.add(A.mul(dir, 0.35), A.mul(perp, 0.89))); at.push({ el: 'H', p: pH, tag: 'r' }); bd.push([at.length - 1, h, 1]); nb[h].push(at.length - 1); nb.push([h]); }
    // centrar
    var c = [0, 0, 0]; at.forEach(function (x) { c = A.add(c, x.p); }); c = A.mul(c, 1 / at.length); at.forEach(function (x) { x.p = A.sub(x.p, c); });
    // grupos: carboxilo, cadena lateral
    var side = {}; if (iR !== undefined) { var q = [iR]; side[iR] = 1; while (q.length) { var u = q.shift(); nb[u].forEach(function (v) { if (v !== iCA && v !== iN && !side[v]) { side[v] = 1; q.push(v); } }); } }
    var carb = {}; carb[iC] = 1; nb[iC].forEach(function (j) { if (j !== iCA) { carb[j] = 1; nb[j].forEach(function (k) { if (at[k].el === 'H') carb[k] = 1; }); } });
    var amino = {}; amino[iN] = 1; nb[iN].forEach(function (j) { if (at[j].el === 'H') amino[j] = 1; });
    // H de aminos: extra H (NH3+) en N alfa y en N de Lys
    var extra = []; function extraH(iNn, grp) { var sum = [0, 0, 0]; nb[iNn].forEach(function (j) { sum = A.add(sum, A.nrm(A.sub(at[j].p, at[iNn].p))); }); var dir = A.nrm(A.mul(sum, -1)); extra.push({ n: iNn, p: A.add(at[iNn].p, A.mul(dir, 1.01)), grp: grp }); }
    extraH(iN, 'amino'); preExtra.forEach(function (e) { extra.push(e); }); if (a.k === 'Lys') { var kN = at.map(function (_, i) { return i; }).filter(function (i) { return at[i].el === 'N' && at[i].tag === 'r'; })[0]; extraH(kN, 'R'); }
    extra.forEach(function (e) { at.push({ el: 'H', p: e.p, tag: e.grp === 'amino' ? 'n' : 'r' }); bd.push([at.length - 1, e.n, 1]); e.i = at.length - 1; });
    var m = mkMol(ctx, at, bd); m.iN = iN; m.iCA = iCA; m.iC = iC; m.iR = iR; m.side = side; m.carb = carb; m.amino = amino; m.extra = extra; m.nb = nb; m.at = at; cache[a.k] = m; return m;
  }
  function updAA(ctx, m, a, pH, hl) {
    var gr = groups(a), st = {}; gr.forEach(function (g) { st[g.id] = fp(g, pH) > 0.5; });
    m.at.forEach(function (x, i) { var v = true; if (x.el === 'H') { if (x.tag === 'h') v = st.cooh; else if (x.tag === 'r' && a.R && a.R.t === 'acid' && !(a.k === 'Tyr' && false)) v = st.R; } m.am[i].visible = v; });
    // H extra de amino/Lys: visibles si protonados; H de amino neutro (2): siempre visibles salvo
    m.extra.forEach(function (e) { m.am[e.i].visible = e.grp === 'amino' ? st.amino : (a.k === 'Lys' || a.k === 'His' ? st.R : true); });
    refreshBonds(m);
    var colr = CLS[a.cls][1];
    m.halo.forEach(function (h, i) { var on = false, c = 0xffffff; if (hl === 'all' || hl === 'amino') { if (m.amino[i] || (m.at[i].tag === 'n')) { on = hl !== 'all' || true; c = 0x4c6ef5; } } if (hl === 'all' || hl === 'carb') { if (m.carb[i] || m.at[i].tag === 'h') { on = true; c = 0xfa5252; } } if (hl === 'all' || hl === 'R') { if (m.side[i]) { on = true; c = colr; } } if (i === m.iCA && (hl === 'all' || hl === 'ca')) { on = true; c = 0xced4da; } h.visible = on && m.am[i].visible && hl !== 'none'; if (h.visible) { h.material.color.setHex(c); var base = (ctx.EL[m.at[i].el] || [0, 1])[1] * 0.42; h.scale.setScalar(base * 1.5 * (1 + 0.06 * Math.sin(G.now * 5))); } });
    return st;
  }
  /* --- cadenas polipeptídicas --- */
  function chainModel(ctx, n, phi, psi) {
    var at = A.chain(n, phi, psi), atoms = [], idx = {}, bonds = [];
    at.forEach(function (x, i) { idx[x.n + x.r] = atoms.length; atoms.push({ el: x.el, p: x.p, nm: x.n, r: x.r, col: x.n === 'CB' ? 0xadb5bd : undefined, sc: x.n === 'CB' ? 0.9 : (x.n === 'CA' ? 1 : 1) }); });
    for (var i = 0; i < n; i++) { bonds.push([idx['N' + i], idx['CA' + i], 1], [idx['CA' + i], idx['C' + i], 1], [idx['C' + i], idx['O' + i], 2], [idx['CA' + i], idx['CB' + i], 1], [idx['N' + i], idx['H' + i], 1]); if (i < n - 1) bonds.push([idx['C' + i], idx['N' + (i + 1)], 1]); }
    return { atoms: atoms, bonds: bonds, idx: idx };
  }
  function hbondLines(ctx, parent, atomsA, atomsB, thr) {
    var T = ctx.T, out = [], n = 0;
    atomsA.forEach(function (a) { if (a.nm !== 'O') return; atomsB.forEach(function (b) { if (b.nm !== 'H') return; var d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]); if (d < thr && d > 1.75) { out.push([a, b, d]); } }); });
    var grp = new T.Group(); out.forEach(function (o) { var p = new T.Vector3(o[0].p[0], o[0].p[1], o[0].p[2]).multiplyScalar(GS), q = new T.Vector3(o[1].p[0], o[1].p[1], o[1].p[2]).multiplyScalar(GS); for (var k = 0; k < 5; k++) { var s = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.5 * p.distanceTo(q) / 5, 6), new T.MeshBasicMaterial({ color: 0xffd43b })); var a1 = p.clone().lerp(q, (k + 0.5) / 5); s.position.copy(a1); s.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), q.clone().sub(p).normalize()); grp.add(s); } }); parent.add(grp); return { grp: grp, n: out.length, dmin: out.length ? Math.min.apply(null, out.map(function (o) { return o[2]; })) : 0, dmax: out.length ? Math.max.apply(null, out.map(function (o) { return o[2]; })) : 0 };
  }
  function tube(ctx, atoms, col) { var T = ctx.T, pts = atoms.filter(function (a) { return a.nm === 'CA'; }).map(function (a) { return new T.Vector3(a.p[0] * GS, a.p[1] * GS, a.p[2] * GS); }); var cur = new T.CatmullRomCurve3(pts), m = new T.Mesh(new T.TubeGeometry(cur, pts.length * 12, 0.34, 10, false), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.38, roughness: 0.6 })); return m; }
  function rot180(p, axis, c0) { var q = A.sub(p, c0), k = A.dot(q, axis); return A.add(c0, A.sub(A.mul(axis, 2 * k), q)); }
  function sheetModel(ctx) {
    var n = 8, s1 = chainModel(ctx, n, -120, 130), u = A.nrm(A.sub(s1.atoms[s1.idx['CA7']].p, s1.atoms[s1.idx['CA0']].p)), e1 = A.nrm(A.cross(u, [1, 0, 0])), e2 = A.cross(u, e1), th = 70 * Math.PI / 180, ax = A.add(A.mul(e1, Math.cos(th)), A.mul(e2, Math.sin(th))), cen = s1.atoms[s1.idx['CA3']].p, t = [5.5, -2, -0.5];
    var atoms = s1.atoms.slice(), bonds = s1.bonds.slice(), off = atoms.length; s1.atoms.forEach(function (a) { atoms.push({ el: a.el, nm: a.nm, r: a.r + 100, col: a.col, sc: a.sc, p: A.add(rot180(a.p, ax, cen), t) }); }); s1.bonds.forEach(function (b) { bonds.push([b[0] + off, b[1] + off, b[2]]); });
    return { atoms: atoms, bonds: bonds, a1: s1.atoms, a2: atoms.slice(off) };
  }
  function mkAtoms(geo) { var at = geo.a.map(function (x, i) { return { el: x[0], p: [x[1], x[2], x[3]], tag: geo.tag[i] }; }), bd = geo.b.map(function (b) { return [b[0], b[1], b[2]]; }); var nb = at.map(function () { return []; }); bd.forEach(function (b) { nb[b[0]].push(b[1]); nb[b[1]].push(b[0]); }); var iCA = nb[0].filter(function (j) { return at[j].el === 'C'; })[0], iR = nb[iCA].filter(function (j) { return j !== 0 && at[j].el === 'C' && nb[j].length === 4; })[0], iC = nb[iCA].filter(function (j) { return j !== 0 && j !== iR && at[j].el === 'C'; })[0], P = function (i) { return at[i].p; }; if (A.dot(A.cross(A.sub(P(iC), P(iCA)), A.sub(P(iR), P(iCA))), A.sub(P(0), P(iCA))) < 0) at.forEach(function (x) { x.p = [-x.p[0], x.p[1], x.p[2]]; }); var c = [0, 0, 0]; at.forEach(function (x) { c = A.add(c, x.p); }); c = A.mul(c, 1 / at.length); at.forEach(function (x) { x.p = A.sub(x.p, c); }); return { at: at, bd: bd, nb: nb }; }
  function pepModel(ctx) {
    var d = mkAtoms(MSim.build('N{n}C(C)C(=O)N{a}CC(=O)O{h}')), at = d.at, nb = d.nb, iNa = -1; at.forEach(function (x, i) { if (x.el === 'N' && x.tag === 'a') iNa = i; });
    var iCc = nb[iNa].filter(function (j) { return at[j].el === 'C' && nb[j].some(function (k) { return at[k].el === 'O'; }); })[0], iO = nb[iCc].filter(function (k) { return at[k].el === 'O'; })[0], iHN = nb[iNa].filter(function (k) { return at[k].el === 'H'; })[0], iCA1 = nb[iCc].filter(function (k) { return at[k].el === 'C'; })[0], iCA2 = nb[iNa].filter(function (k) { return at[k].el === 'C'; })[0];
    var gl = {}; var q = [iNa]; gl[iNa] = 1; while (q.length) { var u = q.shift(); nb[u].forEach(function (v) { if (v === iCc && u === iNa) return; if (!gl[v]) { gl[v] = 1; q.push(v); } }); }
    var m = mkMol(ctx, at, d.bd); m.gl = gl; m.iNa = iNa; m.iCc = iCc; m.iO = iO; m.iHN = iHN; m.iCA1 = iCA1; m.iCA2 = iCA2; m.at = at; m.base = m.P.map(function (p) { return p.clone(); });
    var T = ctx.T, wat = [], el = ['O', 'H', 'H']; el.forEach(function (e, i) { var dd = ctx.EL[e], s = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshStandardMaterial({ color: dd[0], roughness: 0.4, transparent: true })); s.scale.setScalar(dd[1] * 0.42 * 1.1); m.g.add(s); wat.push(s); }); m.wat = wat;
    var pC = m.base[iCc], pN = m.base[iNa], n = new T.Vector3().crossVectors(m.base[iO].clone().sub(pC), pN.clone().sub(pC)).normalize(); m.nrm = n; m.J = pC.clone().add(pN).multiplyScalar(0.5); m.ax = pN.clone().sub(pC).normalize();
    var pl = new T.Mesh(new T.PlaneGeometry(2.6, 1.8), new T.MeshBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false })); pl.position.copy(m.J); var bz = new T.Vector3().copy(m.ax), by = new T.Vector3().crossVectors(n, bz).normalize(); pl.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(bz, by, n)); m.g.add(pl); m.plane = pl; return m;
  }
  function updPep(ctx, m, p) {
    var T = ctx.T, e = p < 0.5 ? p / 0.5 : 1, sm = e * e * (3 - 2 * e), disp = m.ax.clone().multiplyScalar(1.6 * (1 - sm)), formed = p >= 0.5;
    m.P.forEach(function (P, i) { P.copy(m.base[i]); if (m.gl[i]) P.add(disp); m.am[i].position.copy(P); }); m.layout();
    m.bd.forEach(function (b) { if ((b.i === m.iCc && b.j === m.iNa) || (b.i === m.iNa && b.j === m.iCc)) b.cyl.forEach(function (c) { c.visible = formed; }); });
    var tt = p < 0.5 ? 0 : (p - 0.5) / 0.5, sm2 = tt * tt * (3 - 2 * tt), off = 1.4 + 6 * sm2, J = m.J.clone().add(m.ax.clone().multiplyScalar(0.8 * (1 - sm) - 0.1)).add(m.nrm.clone().multiplyScalar(off * GS * 1.0)); var ang = 104.5 * Math.PI / 180, u = m.ax.clone(), v = m.nrm.clone();
    m.wat[0].position.copy(J); m.wat[1].position.copy(J).add(u.clone().multiplyScalar(0.5 * Math.cos(ang / 2)).add(v.clone().multiplyScalar(0.5 * Math.sin(ang / 2)))); m.wat[2].position.copy(J).add(u.clone().multiplyScalar(-0.5 * Math.cos(ang / 2)).add(v.clone().multiplyScalar(0.5 * Math.sin(ang / 2))));
    var al = p < 0.3 ? 0.0 : Math.min(1, (p - 0.3) / 0.15) * (1 - Math.max(0, (p - 0.92) / 0.08)); m.wat.forEach(function (w) { w.material.opacity = al; w.visible = al > 0.02; });
    m.plane.visible = formed; m.plane.material.opacity = 0.22; m.halo.forEach(function (h, i) { var on = formed && (i === m.iCc || i === m.iNa || i === m.iO || i === m.iHN || i === m.iCA1 || i === m.iCA2); h.visible = on; if (on) { h.material.color.setHex(0xffa94d); h.scale.setScalar((ctx.EL[m.at[i].el][1]) * 0.42 * 1.5 * (1 + 0.05 * Math.sin(G.now * 5))); } });
    return { formed: formed, d: m.P[m.iCc].distanceTo(m.P[m.iNa]) / GS };
  }
  function regionOf(f, s) {
    if (f >= -100 && f <= -35 && s >= -80 && s <= -5) return 'hélice α derecha (αR)';
    if (f >= -90 && f <= -50 && s >= 115 && s <= 180) return 'hélice de poliprolina II (PPII)';
    if (f <= -45 && f >= -180 && (s >= 90 || s <= -170)) return 'lámina β';
    if (f >= 30 && f <= 90 && s >= 0 && s <= 90) return 'hélice izquierda (αL)';
    return 'región intermedia';
  }
  function build(ctx) {
    var T = ctx.T; if (G.g) { ctx.scene.remove(G.g); } var g = new T.Group(); G.g = g; G.m = null; G.tube = null; G.hbGrp = null; G.none = false; G.pep = null; G.cl = null; G.hbinfo = null;
    if (S.mode === 'aa') { var a = AAI[S.aa]; if (a.no3d) G.none = true; else { G.m = aaModel(ctx, a); g.add(G.m.g); } }
    else if (S.mode === 'pep') { G.pep = pepModel(ctx); g.add(G.pep.g); }
    else if (S.mode === 'ss') {
      var wrap = new T.Group(), cm, hb;
      if (S.ss === 'helix') {
        cm = chainModel(ctx, 14, -57, -47); G.m = mkMol(ctx, cm.atoms, cm.bonds); var CA = cm.atoms.filter(function (x) { return x.nm === 'CA'; }), c0 = [0, 0, 0], c1 = [0, 0, 0]; for (var i = 0; i < 4; i++) { c0 = A.add(c0, CA[i].p); c1 = A.add(c1, CA[CA.length - 1 - i].p); } var ax = A.nrm(A.sub(c1, c0)); wrap.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0).set(ax[0], ax[1], ax[2]), new T.Vector3(0, 1, 0));
        hb = hbondLines(ctx, G.m.g, cm.atoms, cm.atoms, 2.4); G.tube = tube(ctx, cm.atoms, 0x748ffc); G.m.g.add(G.tube); G.cmAtoms = cm.atoms;
      } else {
        var sm = sheetModel(ctx); cm = sm; G.m = mkMol(ctx, sm.atoms, sm.bonds); var ca1 = sm.a1.filter(function (x) { return x.nm === 'CA'; }), ca2 = sm.a2.filter(function (x) { return x.nm === 'CA'; }), cc1 = [0, 0, 0], cc2 = [0, 0, 0]; ca1.forEach(function (x) { cc1 = A.add(cc1, x.p); }); ca2.forEach(function (x) { cc2 = A.add(cc2, x.p); }); cc1 = A.mul(cc1, 1 / ca1.length); cc2 = A.mul(cc2, 1 / ca2.length);
        var u = A.nrm(A.sub(ca1[ca1.length - 1].p, ca1[0].p)), w = A.sub(cc2, cc1); w = A.nrm(A.sub(w, A.mul(u, A.dot(w, u)))); var nn = A.cross(u, w), uu = new T.Vector3(u[0], u[1], u[2]), ww = new T.Vector3(w[0], w[1], w[2]), n3 = new T.Vector3(nn[0], nn[1], nn[2]); var Mx = new T.Matrix4().makeBasis(uu, ww, n3); wrap.quaternion.setFromRotationMatrix(Mx.clone().transpose());
        hb = hbondLines(ctx, G.m.g, sm.a1.concat(sm.a2), sm.a1.concat(sm.a2), 2.6); G.tube = new T.Group(); G.tube.add(tube(ctx, sm.a1, 0x748ffc)); G.tube.add(tube(ctx, sm.a2, 0xf783ac)); G.m.g.add(G.tube); G.cmAtoms = sm.atoms;
      }
      var cen = [0, 0, 0]; cm.atoms.forEach(function (x) { cen = A.add(cen, x.p); }); cen = A.mul(cen, 1 / cm.atoms.length); G.m.g.position.set(-cen[0] * GS, -cen[1] * GS, -cen[2] * GS); wrap.add(G.m.g); g.add(wrap); G.wrap = wrap; G.hbinfo = hb; G.hbGrp = hb.grp;
    } else {
      var d = A.dipep(S.phi, S.psi, -1), names = d.A.map(function (x) { return x.n; }), id = {}; names.forEach(function (n, i) { id[n] = i; });
      var at = d.A.map(function (x) { return { el: x.el, p: x.p, nm: x.n, col: x.n === 'CB' ? 0xadb5bd : undefined }; }), bd = d.B.map(function (b) { var o = ((b[0] === 'C0' && b[1] === 'O0') || (b[0] === 'C1' && b[1] === 'O1')) ? 2 : 1, r = [id[b[0]], id[b[1]], o]; if (b[0] === 'N1' && b[1] === 'CA') r[3] = 0x4dabf7; if (b[0] === 'CA' && b[1] === 'C1') r[3] = 0xff922b; return r; });
      var c = [0, 0, 0]; at.forEach(function (x) { c = A.add(c, x.p); }); c = A.mul(c, 1 / at.length); at.forEach(function (x) { x.p = A.sub(x.p, c); }); G.dp = d; G.dpId = id; G.m = mkMol(ctx, at, bd, 0.62); g.add(G.m.g);
      var cl = A.clash(d, 0.78); G.cl = cl; G.clAt = null;
      if (cl.bad) { cl.pair.forEach(function (n) { var h = G.m.halo[id[n]]; h.visible = true; h.material.color.setHex(0xff3b30); h.scale.setScalar(0.7); }); var p1 = G.m.P[id[cl.pair[0]]], p2 = G.m.P[id[cl.pair[1]]], dv = p2.clone().sub(p1), L = dv.length(); for (var k = 0; k < 5; k++) { var sgm = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, L / 8, 6), new T.MeshBasicMaterial({ color: 0xff3b30 })); sgm.position.copy(p1).lerp(p2, (k + 0.5) / 5); sgm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dv.clone().normalize()); G.m.g.add(sgm); } G.clAt = [G.m.am[id[cl.pair[0]]], G.m.am[id[cl.pair[1]]]]; }
    }
    g.scale.setScalar(S.mode === 'aa' ? 2.3 : (S.mode === 'pep' ? 1.8 : (S.mode === 'rama' ? 2.0 : (S.ss === 'helix' ? 0.8 : 1.0))));
    g.rotation.x = (S.mode === 'ss' && S.ss === 'sheet') ? -0.55 : 0;
    ctx.scene.add(g);
  }
  var AAL = ['Gly', 'Ala', 'Val', 'Leu', 'Phe', 'Ser', 'Asp', 'Lys'];
  function setLesson(i, loc) {
    if (i === 0) { S.mode = 'aa'; S.aa = 'Ala'; S.pH = 6; S.hl = 'all'; }
    if (i === 1) { S.mode = 'aa'; S.aa = AAL[Math.min(7, Math.floor(loc * 8))]; S.pH = 6; S.hl = 'R'; }
    if (i === 2) { S.mode = 'aa'; S.aa = 'Asp'; S.pH = 0.5 + 13 * loc; S.hl = 'all'; }
    if (i === 3) { S.mode = 'pep'; S.prog = loc < 0.15 ? 0 : (loc > 0.9 ? 1 : (loc - 0.15) / 0.75); }
    if (i === 4) { S.mode = 'ss'; S.ss = 'helix'; }
    if (i === 5) { S.mode = 'ss'; S.ss = 'sheet'; }
    if (i === 6) { S.mode = 'rama'; var k = Math.min(3, Math.floor(loc * 4)); S.phi = [-57, -120, 57, 0][k]; S.psi = [-47, 130, 47, 0][k]; }
  }
  function stages() {
    return [
      ['Estructura general', 'Estructura', 'Todos los α-aminoácidos comparten un esqueleto', '<p>Un <b>α-aminoácido</b> tiene un carbono α unido a un grupo <b>amino</b>, un grupo <b>carboxilo</b>, un <b>H</b> y una <b>cadena lateral (R)</b>. A pH fisiológico existe como <b>zwitterión</b>: –NH₃⁺ y –COO⁻. Todos los proteicos (salvo la glicina, que es aquiral) son <b>L</b> (configuración S, salvo la cisteína que es R por prioridades CIP).</p>'],
      ['Cadenas laterales', 'Cadenas R', 'La cadena lateral define las propiedades del aminoácido', '<p>Se clasifican en <b style="color:#f59f00">apolares</b> (Gly, Ala, Val, Leu, Ile, Met, Phe, Pro, Trp), <b style="color:#20c997">polares sin carga</b> (Ser, Thr, Cys, Tyr, Asn, Gln), <b style="color:#fa5252">ácidas</b> (Asp, Glu) y <b style="color:#4c6ef5">básicas</b> (Lys, Arg, His). Recorre algunos representativos.</p>'],
      ['Ionización y pI', 'pH y pI', 'La carga neta depende del pH', '<p>Con pH creciente cada grupo pierde su protón cuando pH &gt; pKa (Henderson–Hasselbalch). Aquí, <b>aspartato</b>: α-COOH (1,88), COOH lateral (3,65) y α-NH₃⁺ (9,60). El <b>punto isoeléctrico</b> es el pH de carga neta 0: promedio de los dos pKa que rodean a la forma neutra, <b>pI = (1,88 + 3,65)/2 = 2,77</b>.</p>'],
      ['Enlace peptídico', 'Péptido', 'Condensación: carboxilo + amino → amida + H₂O', '<p>El grupo α-COOH de un aminoácido reacciona con el α-NH₂ de otro y libera <b>agua</b>. El enlace <b>C–N</b> (1,33 Å) tiene carácter parcial de doble enlace por resonancia: los seis átomos (Cα, C, O, N, H, Cα) quedan en un <b>plano rígido</b> con <b>ω ≈ 180° (trans)</b>.</p>'],
      ['Hélice α', 'α-hélice', 'Puentes de H entre C=O(i) y N–H(i+4)', '<p>Con φ ≈ −57° y ψ ≈ −47° el esqueleto se enrolla en una <b>hélice derecha</b> de 3,6 residuos por vuelta y 5,4 Å de paso. Cada C=O forma un <b>puente de hidrógeno</b> (≈ 2 Å) con el N–H del residuo i+4 (líneas amarillas). Las cadenas laterales apuntan hacia afuera.</p>'],
      ['Lámina β', 'Lámina β', 'Hebras extendidas unidas lateralmente por puentes de H', '<p>Con φ ≈ −120° y ψ ≈ +130° el esqueleto se extiende en zigzag (≈ 3,3 Å por residuo). Dos hebras <b>antiparalelas</b> se unen por puentes de H entre los grupos C=O y N–H de hebras vecinas; las cadenas laterales alternan arriba y abajo del plano plegado.</p>'],
      ['Mapa de Ramachandran', 'Ramachandran', 'Solo algunas combinaciones (φ, ψ) son posibles', '<p>Los ángulos <b>φ</b> (N–Cα) y <b>ψ</b> (Cα–C) son los únicos grados de libertad del esqueleto. Muchas combinaciones producen <b>choques estéricos</b> (rojo): las regiones permitidas corresponden a hélice α, lámina β/PPII y, menos frecuente, hélice izquierda. Se calcula aquí con un modelo de esferas duras simple.</p>']
    ];
  }
  var def = {
    key: 'aminoacidos-proteinas', title: 'Aminoácidos y estructura de proteínas', subtitle: 'Simulador 3D · biomoléculas', accent: { dark: '#fb7185', light: '#be123c' }, stages: stages, nStages: 7, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 2.5, 13], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 14], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 14, 2], target: [0, 0, 0] }, { id: 'lado', label: 'Lateral', pos: [14, 0, 0], target: [0, 0, 0] }],
    layers: [{ id: 'hl', label: 'Grupos resaltados', icon: '◉' }, { id: 'hb', label: 'Puentes de H', icon: '┅' }, { id: 'rib', label: 'Cinta', icon: '〰' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { G.now = 0; labs.t = ctx.label('', 'bl-lead'); labs.l = [0, 1, 2, 3, 4, 5].map(function () { return ctx.label('', 'bl-d'); }); labs.w = ctx.label('', 'bl-warn'); },
    frame: function (ctx, f, dt) {
      G.now += dt; if (!ctx.P.manual) setLesson(f.i, f.local);
      var k = S.mode + (S.mode === 'aa' ? S.aa : '') + (S.mode === 'ss' ? S.ss : '') + (S.mode === 'rama' ? Math.round(S.phi) + ',' + Math.round(S.psi) : ''); if (k !== key_ || !G.g) { build(ctx); key_ = k; }
      var T = ctx.T, v = new T.Vector3(), L = labs.l; L.forEach(function (l) { l.vis(false); }); labs.w.vis(false); G.info = {};
      if (ctx.layer('spin') && S.mode !== 'rama') G.g.rotation.y += dt * 0.3; else if (S.mode === 'rama') G.g.rotation.y += dt * (ctx.layer('spin') ? 0.25 : 0);
      if (G.hbGrp) G.hbGrp.visible = !!ctx.layer('hb'); if (G.tube) G.tube.visible = !!ctx.layer('rib');
      if (S.mode === 'aa') {
        var a = AAI[S.aa], tl = a.k + ' · ' + a.n + ' (' + a.c + ')'; labs.t.pos(0, 4.4, 0).set(tl, 'bl-lead').vis(true);
        if (G.none) { labs.w.pos(0, 0, 0).set('Anillo heterocíclico/aromático: modelo 3D no incluido (consulta datos y gráficos)', 'bl-warn').vis(true); return; }
        var m = G.m, st = updAA(ctx, m, a, S.pH, ctx.layer('hl') ? S.hl : 'none'); G.info.st = st;
        var q = function (i, dy) { m.am[i].getWorldPosition(v); return [v.x, v.y + dy, v.z]; };
        if (ctx.layer('hl') && S.hl !== 'none') {
          if (S.hl === 'all' || S.hl === 'amino') { var p = q(m.iN, 0.7); L[0].pos(p[0], p[1], p[2]).set(st.amino ? 'NH₃⁺' : 'NH₂', 'bl-d').vis(true); }
          if (S.hl === 'all' || S.hl === 'carb') { var ih = 0; m.at.forEach(function (x, i) { if (x.el === 'O' && x.tag === 'h') ih = i; }); var p2 = q(m.iC, 0.8); L[1].pos(p2[0], p2[1], p2[2]).set(st.cooh ? 'COOH' : 'COO⁻', 'bl-d').vis(true); }
          if (S.hl === 'all' || S.hl === 'R') { if (m.iR !== undefined) { var p3 = q(m.iR, 0.8); L[2].pos(p3[0], p3[1], p3[2]).set('R', 'bl-d').vis(true); } }
          if (S.hl === 'all' || S.hl === 'ca') { var p4 = q(m.iCA, 0.7); L[3].pos(p4[0], p4[1], p4[2]).set('Cα', 'bl-d').vis(true); }
        }
      } else if (S.mode === 'pep') {
        var info = updPep(ctx, G.pep, S.prog); G.info = info; labs.t.pos(0, 4.2, 0).set('Ala + Gly → Ala–Gly + H₂O', 'bl-lead').vis(true);
        if (info.formed) { G.pep.am[G.pep.iCc].getWorldPosition(v); L[0].pos(v.x, v.y - 0.9, v.z).set('enlace peptídico (plano rígido, trans)', 'bl-d').vis(true); }
        G.pep.wat[0].getWorldPosition(v); if (G.pep.wat[0].visible) L[1].pos(v.x, v.y + 0.5, v.z).set('H₂O', 'bl-d').vis(true);
      } else if (S.mode === 'ss') {
        labs.t.pos(0, S.ss === 'helix' ? -5.1 : -3.6, 0).set(S.ss === 'helix' ? 'α-hélice derecha (φ −57°, ψ −47°)' : 'Lámina β antiparalela (φ −120°, ψ +130°)', 'bl-lead').vis(true);
      } else {
        var cl = G.cl; labs.t.pos(0, 4.3, 0).set('Ac–Ala–NMe · φ = ' + Math.round(S.phi) + '°, ψ = ' + Math.round(S.psi) + '°', 'bl-lead').vis(true);
        var d = G.dpId, m2 = G.m; m2.am[d.N1].getWorldPosition(v); var pa = v.clone(); m2.am[d.CA].getWorldPosition(v); var pb = v.clone(); m2.am[d.C1].getWorldPosition(v); var pc = v.clone();
        L[0].pos((pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 0.7, (pa.z + pb.z) / 2).set('φ', 'bl-d').vis(true); L[1].pos((pb.x + pc.x) / 2, (pb.y + pc.y) / 2 - 0.7, (pb.z + pc.z) / 2).set('ψ', 'bl-d').vis(true);
        if (cl && cl.bad) { labs.w.pos(0, -4.3, 0).set('choque estérico: ' + cl.pair.join(' ↔ ').replace(/CH3a|CH3b/g, 'CH₃').replace('N1', 'N').replace('C1', 'C') , 'bl-warn').vis(true); }
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () {
      var a = AAI[S.aa], row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; };
      if (S.mode === 'aa') { var z = charge(a, S.pH), d = dist(a, S.pH), best = Object.keys(d).reduce(function (b, k) { return d[k] > d[b] ? k : b; }, Object.keys(d)[0]); return { eq: { chip: 'pH ' + fmt(S.pH, 1), name: a.k + ' · ' + a.n.split(' (')[0], body: row('Clase', CLS[a.cls][2]) + row('Forma predominante', 'carga neta ' + (best > 0 ? '+' + best : best)) + row('pI', fmt(pI(a), 2)) }, legend: [{ label: 'Amino', color: '#4c6ef5', text: '–NH₂ / –NH₃⁺' }, { label: 'Carboxilo', color: '#fa5252', text: '–COOH / –COO⁻' }, { label: 'R', color: CLS[a.cls][0], text: 'cadena lateral (' + a.cls + ')' }] }; }
      if (S.mode === 'pep') return { eq: { chip: 'Péptido', name: 'Ala–Gly', body: row('Avance', Math.round(S.prog * 100) + ' %') + row('Enlace C–N', '1,33 Å (parcialmente doble)') + row('ω', '≈ 180° (trans), plano rígido') }, legend: [{ label: 'Halo', color: '#ffa94d', text: 'átomos del plano peptídico' }] };
      if (S.mode === 'ss') { var hi = G.hbinfo || {}; return { eq: { chip: S.ss === 'helix' ? 'α' : 'β', name: S.ss === 'helix' ? 'α-hélice' : 'lámina β', body: row('Puentes de H', String(hi.n || 0)) + row('d(O···H)', (hi.n ? fmt(hi.dmin, 2) + '–' + fmt(hi.dmax, 2) : '—') + ' Å') + row('Geometría', S.ss === 'helix' ? '3,6 res/vuelta · 1,5 Å/res' : '3,3 Å/residuo · antiparalela') }, legend: [{ label: '┅', color: '#ffd43b', text: 'puente de hidrógeno' }, { label: 'Cinta', color: '#748ffc', text: 'trayectoria del Cα' }] }; }
      var cl = G.cl || {}; return { eq: { chip: 'φ/ψ', name: 'Ramachandran', body: row('φ · ψ', Math.round(S.phi) + '° · ' + Math.round(S.psi) + '°') + row('Región', regionOf(S.phi, S.psi)) + row('Estérico', cl.bad ? 'choque (prohibida)' : 'permitida') }, legend: [{ label: 'φ', color: '#4dabf7', text: 'enlace N–Cα' }, { label: 'ψ', color: '#ff922b', text: 'enlace Cα–C' }, { label: 'Choque', color: '#ff3b30', text: 'solapamiento de átomos' }] };
    },
    measures: function () { var a = AAI[S.aa], gr = groups(a); return [['Aminoácido', a.k + ' (' + a.c + ')'], ['Clase', CLS[a.cls][2]], ['pK(α-COOH)', fmt(a.pk[0], 2)], ['pK(α-NH₃⁺)', fmt(a.pk[1], 2)], ['pK(R)', a.R ? fmt(a.R.pk, 2) : '—'], ['pI', fmt(pI(a), 2)], ['Índice de hidropatía', fmt(a.kd, 1)], ['Carga a pH ' + fmt(S.pH, 1), fmt(charge(a, S.pH), 2)]]; },
    ideas: ['Todos los aminoácidos proteicos son <b>L</b>; Gly es aquiral.', '<b>pI</b>: pH de carga neta 0; por debajo la molécula es catión, por encima anión.', 'El <b>enlace peptídico</b> es plano y trans: solo φ y ψ son libres.', '<b>α-hélice</b>: C=O(i)···H–N(i+4); <b>lámina β</b>: puentes entre hebras vecinas.', 'Ramachandran: los choques estéricos limitan los (φ, ψ) posibles.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Modo'); el.appendChild(c);
      var modes = [['aa', 'Aminoácido'], ['pep', 'Péptido'], ['ss', 'Hélice α'], ['ss2', 'Lámina β'], ['rama', 'Ramachandran']];
      ui.mode = kit.ui.options({ label: 'Qué mostrar', cols: 5, value: 'aa', options: modes.map(function (m) { return { v: m[0], label: m[1] }; }), onChange: function (v) { ctx.goManual(); if (v === 'ss') { S.mode = 'ss'; S.ss = 'helix'; } else if (v === 'ss2') { S.mode = 'ss'; S.ss = 'sheet'; } else S.mode = v === 'rama' ? 'rama' : v; } }); c.appendChild(ui.mode);
      var ca = kit.ui.card('Aminoácido y pH'); el.appendChild(ca);
      ui.aa = kit.ui.options({ label: 'Aminoácido', cols: 5, value: S.aa, options: AA.map(function (a) { return { v: a.k, label: a.k, sub: a.c }; }), onChange: function (v) { ctx.goManual(); S.aa = v; S.mode = 'aa'; } }); ca.appendChild(ui.aa);
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.1, value: S.pH, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.pH = v; S.mode = 'aa'; } }); ca.appendChild(kit.ui.sliders([ui.pH]));
      ui.hl = kit.ui.options({ label: 'Resaltar', cols: 5, value: S.hl, options: [{ v: 'all', label: 'Todo' }, { v: 'amino', label: 'Amino' }, { v: 'carb', label: 'Carboxilo' }, { v: 'R', label: 'R' }, { v: 'none', label: 'Nada' }], onChange: function (v) { ctx.goManual(); S.hl = v; } }); ca.appendChild(ui.hl);
      var cp = kit.ui.card('Enlace peptídico'); el.appendChild(cp); ui.prog = kit.ui.slider({ label: 'Avance de la condensación', min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'pep'; S.prog = v / 100; } }); cp.appendChild(kit.ui.sliders([ui.prog]));
      var cr = kit.ui.card('Ángulos φ, ψ'); el.appendChild(cr);
      ui.phi = kit.ui.slider({ label: 'φ', min: -180, max: 180, step: 1, value: S.phi, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); S.mode = 'rama'; S.phi = v; } }); ui.psi = kit.ui.slider({ label: 'ψ', min: -180, max: 180, step: 1, value: S.psi, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); S.mode = 'rama'; S.psi = v; } }); cr.appendChild(kit.ui.sliders([ui.phi, ui.psi]));
      cr.appendChild(ctx.btnRow([{ t: 'α (−57, −47)', fn: function () { ctx.goManual(); S.mode = 'rama'; S.phi = -57; S.psi = -47; } }, { t: 'β (−120, 130)', fn: function () { ctx.goManual(); S.mode = 'rama'; S.phi = -120; S.psi = 130; } }, { t: 'PPII (−75, 145)', fn: function () { ctx.goManual(); S.mode = 'rama'; S.phi = -75; S.psi = 145; } }, { t: 'αL (57, 47)', fn: function () { ctx.goManual(); S.mode = 'rama'; S.phi = 57; S.psi = 47; } }, { t: 'Prohibida (0, 0)', fn: function () { ctx.goManual(); S.mode = 'rama'; S.phi = 0; S.psi = 0; } }]));
      var lk = ''; ui.refresh = function () { var k = [S.mode, S.ss, S.aa, Math.round(S.pH * 10), Math.round(S.prog * 100), Math.round(S.phi), Math.round(S.psi), S.hl].join('|'); if (k === lk) return; lk = k; ui.mode.set(S.mode === 'ss' ? (S.ss === 'helix' ? 'ss' : 'ss2') : S.mode); ui.aa.set(S.aa); ui.pH.set(S.pH); ui.hl.set(S.hl); ui.prog.set(Math.round(S.prog * 100)); ui.phi.set(Math.round(S.phi)); ui.psi.set(Math.round(S.psi)); };
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
      var q = kit.ui.card('Desafío: carga neta predominante'); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, sc = [0, 0];
      function nextQ() { var cand = AA.filter(function (a) { return !a.no3d || true; }), a = cand[Math.floor(Math.random() * cand.length)], pH = Math.round((1 + Math.random() * 12) * 2) / 2; cur = { a: a, pH: pH }; ctx.goManual(); S.aa = a.k; S.pH = pH; S.mode = 'aa'; draw(''); }
      function draw(msg) { var h = '<p class="small">Aciertos: <b>' + sc[0] + '</b> / ' + sc[1] + '</p>'; if (cur) h += '<p class="small"><b>' + cur.a.k + '</b> a pH <b>' + fmt(cur.pH, 1) + '</b>: ¿carga neta predominante?<br>pKa: ' + groups(cur.a).map(function (g) { return g.lbl + ' ' + fmt(g.pk, 2); }).join(' · ') + '</p>'; if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'; [-2, -1, 0, 1, 2].forEach(function (z) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = z > 0 ? '+' + z : String(z); b.onclick = function () { if (!cur) { kit.toast('Pulsa «Nueva pregunta»'); return; } var d = dist(cur.a, cur.pH), best = +Object.keys(d).reduce(function (b2, k) { return d[k] > d[b2] ? k : b2; }, Object.keys(d)[0]); sc[1]++; var ok = best === z; if (ok) sc[0]++; var r = cur; cur = null; draw(ok ? '¡Correcto! carga ' + (best > 0 ? '+' + best : best) : 'No: la forma predominante tiene carga ' + (best > 0 ? '+' + best : best) + ' (pI = ' + fmt(pI(r.a), 2) + ')'); }; w.appendChild(b); }); qb.appendChild(w); qb.appendChild(ctx.btnRow([{ t: 'Nueva pregunta', primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: 'Curva de titulación del aminoácido', h: 250, note: 'pH frente a equivalentes de OH⁻ añadidos a la forma totalmente protonada. Mesetas en los pKa; ◆ = pI; línea = pH actual.', draw: function (cx, w, h, c) {
        var a = AAI[S.aa], gr = groups(a), L0 = 34, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, nx = gr.length, sx = function (x) { return L0 + pw * x / nx; }, sy = function (p) { return Tp + ph * (1 - p / 14); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var p = 0; p <= 14; p += 2) { cx.beginPath(); cx.moveTo(L0, sy(p)); cx.lineTo(L0 + pw, sy(p)); cx.stroke(); cx.fillText(p, L0 - 4, sy(p) + 3); } cx.textAlign = 'center'; for (var x = 0; x <= nx; x++) cx.fillText(x, sx(x), h - B + 12); cx.fillText('equivalentes de OH⁻', L0 + pw / 2, h - 2);
        function X(pH) { return gr.reduce(function (s, g) { var f = 1 / (1 + Math.pow(10, pH - g.pk)); return s + (g.t === 'base' ? 1 - f : 1 - f); }, 0); }
        cx.strokeStyle = '#e03131'; cx.lineWidth = 2.2; cx.beginPath(); for (p = 0; p <= 14; p += 0.05) { var px = sx(X(p)), py = sy(p); if (p === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.lineWidth = 1;
        gr.forEach(function (g) { cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText('pK ' + fmt(g.pk, 2), sx(X(g.pk)) + 6, sy(g.pk) + 3); cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(X(g.pk)), sy(g.pk), 3, 0, 7); cx.fill(); });
        var pi = pI(a); cx.fillStyle = c.ink; cx.save(); cx.translate(sx(X(pi)), sy(pi)); cx.rotate(Math.PI / 4); cx.fillRect(-4, -4, 8, 8); cx.restore(); cx.textAlign = 'left'; cx.fillText('pI ' + fmt(pi, 2), sx(X(pi)) + 8, sy(pi) - 6);
        cx.strokeStyle = '#4c8dff'; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(L0, sy(S.pH)); cx.lineTo(L0 + pw, sy(S.pH)); cx.stroke(); cx.setLineDash([]); } },
      { title: 'Distribución de especies según su carga neta', h: 230, note: 'Fracción de molécula con cada carga neta en función del pH.', draw: function (cx, w, h, c) {
        var a = AAI[S.aa], L0 = 34, Tp = 10, B = 26, pw = w - L0 - 12, ph = h - Tp - B, sx = function (p) { return L0 + pw * p / 14; }, sy = function (f) { return Tp + ph * (1 - f); }, cols = { '-3': '#845ef7', '-2': '#1c7ed6', '-1': '#2f9e44', 0: '#f59f00', 1: '#e03131', 2: '#c2255c' }, seen = {};
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var p = 0; p <= 14; p += 2) { cx.beginPath(); cx.moveTo(sx(p), Tp); cx.lineTo(sx(p), Tp + ph); cx.stroke(); cx.fillText(p, sx(p), h - B + 12); } cx.fillText('pH', L0 + pw / 2, h - 2); cx.textAlign = 'right'; [0, 0.5, 1].forEach(function (f) { cx.fillText(f, L0 - 4, sy(f) + 3); });
        for (var z = -3; z <= 2; z++) { var any = false; cx.strokeStyle = cols[z]; cx.lineWidth = 2; cx.beginPath(); var first = true; for (p = 0; p <= 14; p += 0.1) { var d = dist(a, p), f = d[z] || 0; if (f > 0.001) any = true; var px = sx(p), py = sy(f); if (first) { cx.moveTo(px, py); first = false; } else cx.lineTo(px, py); } if (any) cx.stroke(); cx.lineWidth = 1; if (any) { cx.fillStyle = cols[z]; cx.textAlign = 'left'; cx.fillText((z > 0 ? '+' : '') + z, L0 + 4 + (z + 3) * 26, Tp + 10); } }
        cx.strokeStyle = '#4c8dff'; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(sx(S.pH), Tp); cx.lineTo(sx(S.pH), Tp + ph); cx.stroke(); cx.setLineDash([]); } },
      { title: 'Hidropatía de los 20 aminoácidos (Kyte–Doolittle)', h: 300, note: 'Valores positivos = hidrofóbicos; negativos = hidrofílicos. El elegido está resaltado.', draw: function (cx, w, h, c) {
        var arr = AA.slice().sort(function (p, q) { return q.kd - p.kd; }), L0 = 38, Tp = 6, B = 6, ph = (h - Tp - B) / arr.length, mid = L0 + (w - L0 - 20) * 4.6 / 9.2, sc = (w - L0 - 20) / 9.2;
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.beginPath(); cx.moveTo(mid, Tp); cx.lineTo(mid, h - B); cx.stroke();
        arr.forEach(function (a, i) { var y = Tp + i * ph, x = mid + a.kd * sc; cx.fillStyle = CLS[a.cls][0]; cx.globalAlpha = a.k === S.aa ? 1 : 0.6; cx.fillRect(Math.min(mid, x), y + 1.5, Math.abs(x - mid), ph - 3); cx.globalAlpha = 1; if (a.k === S.aa) { cx.strokeStyle = c.ink; cx.lineWidth = 2; cx.strokeRect(Math.min(mid, x), y + 1.5, Math.abs(x - mid), ph - 3); cx.lineWidth = 1; } cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(a.k, L0 - 6, y + ph / 2 + 3.5); cx.textAlign = a.kd >= 0 ? 'left' : 'right'; cx.fillStyle = c.muted; cx.fillText(fmt(a.kd, 1), a.kd >= 0 ? x + 4 : x - 4, y + ph / 2 + 3.5); }); } },
      { title: 'Mapa de Ramachandran (Ac–Ala–NMe, choques estéricos)', h: 300, note: 'Verde oscuro: bien permitida; verde claro: permitida con tensión; rojo: choque (esferas duras, 78 % del contacto de van der Waals). Punto = (φ, ψ) actual.', draw: function (cx, w, h, c) {
        var Sz = Math.min(w - 36, h - 32), L0 = 30, Tp = 6, st = 6, n = 360 / st;
        if (!G.map) { G.map = []; for (var j = 0; j < n; j++) { var row = []; for (var i = 0; i < n; i++) { var phi = -180 + i * st + st / 2, psi = 180 - j * st - st / 2; row.push(A.clash(A.dipep(phi, psi, -1), 0).ratio); } G.map.push(row); } }
        var px = function (f) { return L0 + Sz * (f + 180) / 360; }, py = function (s) { return Tp + Sz * (180 - s) / 360; }, cs = Sz / n;
        for (var j2 = 0; j2 < n; j2++) for (var i2 = 0; i2 < n; i2++) { var r = G.map[j2][i2]; cx.fillStyle = r < 0.78 ? 'rgba(224,49,49,.45)' : (r < 0.9 ? 'rgba(140,210,120,.75)' : 'rgba(47,158,68,.9)'); cx.fillRect(L0 + i2 * cs, Tp + j2 * cs, cs + 0.6, cs + 0.6); }
        cx.strokeStyle = c.ink; cx.strokeRect(L0, Tp, Sz, Sz); cx.strokeStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.moveTo(px(0), Tp); cx.lineTo(px(0), Tp + Sz); cx.moveTo(L0, py(0)); cx.lineTo(L0 + Sz, py(0)); cx.stroke();
        cx.fillStyle = c.muted; cx.font = '10.5px system-ui'; cx.textAlign = 'center'; [-180, -90, 0, 90, 180].forEach(function (v) { cx.fillText(v, px(v), Tp + Sz + 12); cx.textAlign = 'right'; cx.fillText(v, L0 - 3, py(v) + 3); cx.textAlign = 'center'; }); cx.fillText('φ (°)', L0 + Sz / 2, Tp + Sz + 25); cx.save(); cx.translate(8, Tp + Sz / 2); cx.rotate(-Math.PI / 2); cx.fillText('ψ (°)', 0, 0); cx.restore();
        cx.fillStyle = '#fff'; cx.font = 'bold 10.5px system-ui'; [['α', -57, -47], ['β', -120, 130], ['αL', 57, 47]].forEach(function (r) { cx.fillText(r[0], px(r[1]), py(r[2]) + 4); });
        cx.fillStyle = '#1c7ed6'; cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(px(S.phi), py(S.psi), 6, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }
    ],
    calc: function () {
      var a = AAI[S.aa], gr = groups(a), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }, d = dist(a, S.pH);
      var ks = Object.keys(d).map(Number).sort(function (p, q) { return q - p; });
      return '<div class="card-kicker">' + a.k + ' · ' + a.n + ' · pH ' + fmt(S.pH, 1) + '</div><div class="calc-step">1 · Grupos ionizables</div><table class="calc-table">' + gr.map(function (g) { var f = fp(g, S.pH); return row(g.lbl + ' (pKa ' + fmt(g.pk, 2) + ')', fmt(f * 100, 0) + ' % protonado · ' + (f > 0.5 ? (g.t === 'base' ? '–NH₃⁺ / catiónico' : 'neutro') : (g.t === 'base' ? 'neutro' : 'aniónico'))); }).join('') + '</table><div class="calc-step">2 · Carga neta</div><table class="calc-table">' + row('Carga media', fmt(charge(a, S.pH), 2)) + ks.filter(function (k) { return d[k] > 0.005; }).map(function (k) { return row('Especie ' + (k > 0 ? '+' + k : k), fmt(d[k] * 100, 1) + ' %'); }).join('') + '</table><div class="calc-step">3 · Punto isoeléctrico</div><table class="calc-table">' + row('pI (carga = 0)', fmt(pI(a), 2)) + row('Índice de hidropatía', fmt(a.kd, 1)) + '</table>';
    },
    calcLabel: 'Ionización',
    quiz: [
      { q: 'A pH fisiológico (≈ 7,4) un aminoácido neutro como la alanina se encuentra como…', options: ['zwitterión (–NH₃⁺ y –COO⁻)', 'catión (–NH₃⁺ y –COOH)', 'anión (–NH₂ y –COO⁻)', 'forma no iónica (–NH₂ y –COOH)'], answer: 0, why: 'Con pK(COOH) ≈ 2,3 y pK(NH₃⁺) ≈ 9,7 el carboxilo está desprotonado y el amino protonado.' },
      { q: 'El pI de la glicina (pK₁ = 2,34; pK₂ = 9,60) es…', options: ['5,97', '2,34', '9,60', '7,00'], answer: 0, why: 'pI = (2,34 + 9,60)/2 = 5,97.' },
      { q: 'El enlace peptídico tiene carácter parcial de doble enlace porque…', options: ['el par libre del N se deslocaliza hacia el C=O (resonancia)', 'el N es sp³', 'el C=O es un enlace sencillo', 'se forma con pérdida de CO₂'], answer: 0, why: 'La resonancia amida hace el enlace C–N corto (1,33 Å) y fuerza la planaridad trans.' },
      { q: 'En una α-hélice cada C=O forma puente de H con el N–H del residuo…', options: ['i + 4', 'i + 1', 'i + 2', 'i − 1'], answer: 0, why: 'Un puente cada cuatro residuos cierra anillos de 13 átomos (hélice 3,6₁₃).' },
      { q: '¿Qué aminoácido tiene una cadena lateral ácida?', options: ['aspartato', 'lisina', 'serina', 'valina'], answer: 0, why: 'Asp y Glu tienen un grupo –COOH en la cadena lateral (pKa 3,65 y 4,25).' },
      { q: 'En un mapa de Ramachandran, las zonas prohibidas se deben principalmente a…', options: ['choques estéricos entre átomos del esqueleto y de la cadena lateral', 'la carga neta del péptido', 'el pH de la disolución', 'el pI del aminoácido'], answer: 0, why: 'Solo φ y ψ son libres y muchas combinaciones acercan átomos más que sus radios de van der Waals.' },
      { q: 'En una lámina β antiparalela los puentes de H se forman entre…', options: ['C=O y N–H de hebras vecinas', 'cadenas laterales apolares', 'residuos i e i+4 de la misma hebra', 'grupos tiol'], answer: 0, why: 'Las hebras adyacentes aparean sus grupos C=O y N–H del esqueleto.' },
      { q: 'La carga neta predominante de la lisina a pH 12 es…', options: ['−1', '+2', '+1', '0'], answer: 0, why: 'A pH 12 ya perdieron su protón el α-NH₃⁺ (pK 8,95) y el NH₃⁺ lateral (pK 10,53); solo queda el α-COO⁻: carga −1.' }
    ],
    help: { intro: 'Elige modo y aminoácido en «Lab». En el modo Aminoácido, el pH cambia los grupos ionizados y la carga; en Hélice α / Lámina β ves los puentes de H; en Ramachandran, mueve φ y ψ.', items: [['Resaltar', 'colorea amino, carboxilo y cadena R.'], ['Puentes de H', 'líneas amarillas entre C=O y N–H.'], ['Cinta', 'trayectoria del carbono α.'], ['Desafío', 'predice la carga neta a un pH dado.']] }
  };
  MSim.create(def);
})();
