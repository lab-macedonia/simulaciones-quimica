/* Espectroscopía IR y RMN ¹H — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, GS = 1.5;
  var M = [
    { id: 'etanol', n: 'etanol', s: 'C{a+}C{b+}O{c}', f: 'C₂H₆O',
      ir: [{ v: 3350, I: 0.85, w: 300, l: 'O–H (tensión, ancha por puentes de H)', t: ['c'], m: 's' }, { v: 2975, I: 0.55, w: 70, l: 'C–H sp³ (tensión)', t: ['a', 'b'], m: 's' }, { v: 1380, I: 0.3, w: 40, l: 'CH₃ (flexión)', t: ['a'], m: 'b' }, { v: 1050, I: 0.85, w: 45, l: 'C–O (tensión)', t: ['b', 'c'], m: 's' }],
      nmr: [{ d: 1.2, n: 3, mu: 't', J: 7, l: 'CH₃–', t: 'a', v: 'vecinos: CH₂ (2 H) → 2+1 = triplete' }, { d: 2.6, n: 1, mu: 's', J: 0, l: 'O–H', t: 'c', v: 'H intercambiable: singlete ancho, δ variable' }, { d: 3.7, n: 2, mu: 'q', J: 7, l: '–CH₂–O', t: 'b', v: 'vecinos: CH₃ (3 H) → 3+1 = cuarteto; desapantallado por O' }] },
    { id: 'etanal', n: 'etanal', s: 'C{a+}C{b+}=O{b}', f: 'C₂H₄O',
      ir: [{ v: 2980, I: 0.3, w: 60, l: 'C–H sp³', t: ['a'], m: 's' }, { v: 2820, I: 0.3, w: 40, l: 'C–H del aldehído (Fermi)', t: ['b'], m: 's' }, { v: 2720, I: 0.35, w: 40, l: 'C–H del aldehído (Fermi)', t: ['b'], m: 's' }, { v: 1730, I: 1.0, w: 40, l: 'C=O de aldehído', t: ['b'], m: 's' }],
      nmr: [{ d: 2.2, n: 3, mu: 'd', J: 3, l: 'CH₃–C=O', t: 'a', v: 'vecino: CHO (1 H) → doblete (J ≈ 3 Hz)' }, { d: 9.8, n: 1, mu: 'q', J: 3, l: 'H–C=O', t: 'b', v: 'vecinos: CH₃ (3 H) → cuarteto; muy desapantallado' }] },
    { id: 'propanona', n: 'propanona (acetona)', s: 'C{a+}C{x}(=O{x})C{a+}', f: 'C₃H₆O',
      ir: [{ v: 2970, I: 0.3, w: 60, l: 'C–H sp³', t: ['a'], m: 's' }, { v: 1715, I: 1.0, w: 40, l: 'C=O de cetona', t: ['x'], m: 's' }, { v: 1360, I: 0.5, w: 40, l: 'CH₃ (flexión)', t: ['a'], m: 'b' }, { v: 1220, I: 0.55, w: 45, l: 'C–C(=O)–C', t: ['x'], m: 's' }],
      nmr: [{ d: 2.1, n: 6, mu: 's', J: 0, l: 'CH₃–C=O (×2)', t: 'a', v: 'los 6 H son equivalentes y sin vecinos con H → singlete' }] },
    { id: 'butanona', n: 'butanona', s: 'C{c+}C{b+}C{x}(=O{x})C{a+}', f: 'C₄H₈O',
      ir: [{ v: 2975, I: 0.45, w: 70, l: 'C–H sp³', t: ['a', 'b', 'c'], m: 's' }, { v: 1715, I: 1.0, w: 40, l: 'C=O de cetona', t: ['x'], m: 's' }, { v: 1360, I: 0.4, w: 40, l: 'CH₃ (flexión)', t: ['a', 'c'], m: 'b' }],
      nmr: [{ d: 1.05, n: 3, mu: 't', J: 7, l: 'CH₃–CH₂', t: 'c', v: 'vecinos: CH₂ → triplete' }, { d: 2.1, n: 3, mu: 's', J: 0, l: 'CH₃–C=O', t: 'a', v: 'sin vecinos con H → singlete' }, { d: 2.45, n: 2, mu: 'q', J: 7, l: '–CH₂–C=O', t: 'b', v: 'vecinos: CH₃ → cuarteto' }] },
    { id: 'acetico', n: 'ácido etanoico', s: 'C{a+}C{x}(=O{x})O{h}', f: 'C₂H₄O₂',
      ir: [{ v: 3000, I: 0.7, w: 550, l: 'O–H de ácido (muy ancha)', t: ['h'], m: 's' }, { v: 1710, I: 1.0, w: 45, l: 'C=O de ácido', t: ['x'], m: 's' }, { v: 1290, I: 0.6, w: 50, l: 'C–O (tensión)', t: ['x', 'h'], m: 's' }, { v: 930, I: 0.5, w: 110, l: 'O–H (deformación fuera del plano)', t: ['h'], m: 'b' }],
      nmr: [{ d: 2.1, n: 3, mu: 's', J: 0, l: 'CH₃–C=O', t: 'a', v: 'sin vecinos → singlete' }, { d: 11.5, n: 1, mu: 's', J: 0, l: 'COOH', t: 'h', v: 'H ácido, muy desapantallado, singlete ancho' }] },
    { id: 'acetato', n: 'etanoato de etilo', s: 'C{a+}C{x}(=O{x})O{y}C{b+}C{c+}', f: 'C₄H₈O₂',
      ir: [{ v: 2985, I: 0.4, w: 70, l: 'C–H sp³', t: ['a', 'b', 'c'], m: 's' }, { v: 1740, I: 1.0, w: 40, l: 'C=O de éster', t: ['x'], m: 's' }, { v: 1240, I: 0.9, w: 50, l: 'C–O–C (asimétrica)', t: ['x', 'y'], m: 's' }, { v: 1045, I: 0.7, w: 45, l: 'O–CH₂ (tensión)', t: ['y', 'b'], m: 's' }],
      nmr: [{ d: 1.25, n: 3, mu: 't', J: 7, l: 'CH₃–CH₂', t: 'c', v: 'vecinos: OCH₂ → triplete' }, { d: 2.05, n: 3, mu: 's', J: 0, l: 'CH₃–C=O', t: 'a', v: 'sin vecinos → singlete' }, { d: 4.1, n: 2, mu: 'q', J: 7, l: 'O–CH₂', t: 'b', v: 'vecinos: CH₃ → cuarteto; desapantallado por O' }] },
    { id: 'tolueno', n: 'metilbenceno (tolueno)', s: 'C{a+}Ph{ar+}', f: 'C₇H₈',
      ir: [{ v: 3030, I: 0.3, w: 60, l: 'C–H aromático', t: ['ar'], m: 's' }, { v: 2920, I: 0.35, w: 50, l: 'C–H del CH₃', t: ['a'], m: 's' }, { v: 1605, I: 0.5, w: 30, l: 'C=C aromático', t: ['ar'], m: 's' }, { v: 1495, I: 0.6, w: 30, l: 'C=C aromático', t: ['ar'], m: 's' }, { v: 730, I: 0.9, w: 30, l: 'C–H fuera del plano (monosust.)', t: ['ar'], m: 'b' }, { v: 695, I: 0.9, w: 25, l: 'deformación del anillo (monosust.)', t: ['ar'], m: 'b' }],
      nmr: [{ d: 2.3, n: 3, mu: 's', J: 0, l: 'CH₃–Ar', t: 'a', v: 'sin vecinos H → singlete' }, { d: 7.2, n: 5, mu: 'm', J: 7, l: 'H aromáticos', t: 'ar', v: 'anillo desapantallado (corriente de anillo); multiplete' }] },
    { id: 'cloroetano', n: 'cloroetano', s: 'C{a+}C{b+}Cl{x}', f: 'C₂H₅Cl',
      ir: [{ v: 2980, I: 0.45, w: 70, l: 'C–H sp³', t: ['a', 'b'], m: 's' }, { v: 1450, I: 0.4, w: 40, l: 'C–H (flexión)', t: ['a', 'b'], m: 'b' }, { v: 1260, I: 0.55, w: 40, l: 'CH₂–Cl (wagging)', t: ['b', 'x'], m: 'b' }, { v: 660, I: 0.9, w: 40, l: 'C–Cl (tensión)', t: ['b', 'x'], m: 's' }],
      nmr: [{ d: 1.5, n: 3, mu: 't', J: 7, l: 'CH₃–', t: 'a', v: 'vecinos: CH₂ → triplete' }, { d: 3.6, n: 2, mu: 'q', J: 7, l: '–CH₂–Cl', t: 'b', v: 'vecinos: CH₃ → cuarteto; desapantallado por Cl' }] },
    { id: 'nitrilo', n: 'etanonitrilo', s: 'C{a+}C{x}#N{x}', f: 'C₂H₃N',
      ir: [{ v: 2950, I: 0.3, w: 60, l: 'C–H sp³', t: ['a'], m: 's' }, { v: 2255, I: 0.6, w: 30, l: 'C≡N (tensión)', t: ['x'], m: 's' }, { v: 1375, I: 0.3, w: 40, l: 'CH₃ (flexión)', t: ['a'], m: 'b' }, { v: 920, I: 0.3, w: 40, l: 'C–C (tensión)', t: ['a', 'x'], m: 's' }],
      nmr: [{ d: 2.0, n: 3, mu: 's', J: 0, l: 'CH₃–C≡N', t: 'a', v: 'sin vecinos → singlete' }] }
  ];
  var MID = {}; M.forEach(function (m) { MID[m.id] = m; m.geo = MSim.build(m.s); });
  var DT = [['CH₃, CH₂ alquílicos', 0.8, 1.7], ['C–H alílico / bencílico', 1.6, 2.6], ['H–C–C=O (α al carbonilo)', 2.0, 2.7], ['H–C–N', 2.2, 3.1], ['H–C–O / H–C–X', 3.3, 4.2], ['O–H, N–H (variable)', 1.0, 5.5], ['=C–H (alqueno)', 4.5, 6.5], ['Ar–H', 6.5, 8.0], ['CHO (aldehído)', 9.0, 10.0], ['COOH', 10.0, 13.0]];
  var GROUPCOL = { a: 0xff8787, b: 0x4dabf7, c: 0x69db7c, h: 0xffd43b, ar: 0xb197fc, x: 0xffa94d, y: 0x38d9a9 };
  var S = { mol: 'etanol', kind: 'ir', sel: 0, vib: true };
  var G = {}, labs = {}, dyn = null, key_ = '';
  function mol() { return MID[S.mol]; }
  function selItem() { var m = mol(), arr = S.kind === 'ir' ? m.ir : m.nmr; if (S.sel >= arr.length) S.sel = 0; return arr[S.sel]; }
  function nbr(g) { var map = g.a.map(function () { return []; }); g.b.forEach(function (b) { map[b[0]].push(b[1]); map[b[1]].push(b[0]); }); return map; }
  function buildDyn(ctx, m) {
    var T = ctx.T, g = new T.Group(), geo = m.geo, atoms = [], bonds = [], base = geo.a.map(function (a) { return new T.Vector3(a[1] * GS, a[2] * GS, a[3] * GS); });
    geo.a.forEach(function (a, i) { var d = ctx.EL[a[0]] || [0xcccccc, 1], mesh = new T.Mesh(new T.SphereGeometry(1, 18, 14), new T.MeshStandardMaterial({ color: d[0], roughness: 0.4 })); mesh.scale.setScalar(d[1] * 0.46 * (a[0] === 'H' ? 1 : 1)); mesh.position.copy(base[i]); g.add(mesh); atoms.push(mesh); });
    geo.b.forEach(function (b) { var o = b[2] || 1, cyl = []; for (var k = 0; k < o; k++) { var c = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 1, 8), new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 })); g.add(c); cyl.push(c); } bonds.push({ i: b[0], j: b[1], o: o, cyl: cyl }); });
    var halos = geo.a.map(function (a, i) { var h = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.4, depthWrite: false })); h.visible = false; g.add(h); return h; });
    return { g: g, atoms: atoms, bonds: bonds, base: base, halos: halos, nb: nbr(geo), geo: geo };
  }
  function updDyn(ctx, d, disp, hl, col) {
    var T = ctx.T, P = d.base.map(function (b, i) { return b.clone().add(disp[i] || new T.Vector3()); });
    d.atoms.forEach(function (a, i) { a.position.copy(P[i]); });
    d.bonds.forEach(function (b) { var p = P[b.i], q = P[b.j], dv = q.clone().sub(p), L = dv.length(), mid = p.clone().add(q).multiplyScalar(0.5), q0 = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dv.clone().normalize()), side = new T.Vector3(0, 0, 1).applyQuaternion(new T.Quaternion()); b.cyl.forEach(function (c, k) { c.scale.set(1, L, 1); c.position.copy(mid).add(new T.Vector3(0, 0, (k - (b.o - 1) / 2) * 0.17)); c.quaternion.copy(q0); }); });
    d.halos.forEach(function (h, i) { h.visible = !!hl[i]; if (hl[i]) { h.position.copy(P[i]); h.scale.setScalar((d.geo.a[i][0] === 'H' ? 0.62 : 0.95) * (1 + 0.1 * Math.sin(G.now * 6))); h.material.color.setHex(col); } });
  }
  function hlSet(item) { var set = {}, geo = mol().geo; var tags = S.kind === 'ir' ? item.t : [item.t]; geo.tag.forEach(function (t, i) { if (t && tags.indexOf(t) >= 0) set[i] = true; }); return set; }
  function dispFor(ctx, d, item, set, ph) {
    var T = ctx.T, disp = [], A = 0.17 * Math.sin(ph), geo = mol().geo, P = d.base;
    d.geo.a.forEach(function (a, i) { disp[i] = new T.Vector3(); });
    if (item.m === 's') d.bonds.forEach(function (b) { if (set[b.i] && set[b.j]) { var u = P[b.j].clone().sub(P[b.i]).normalize(); disp[b.i].addScaledVector(u, -A); disp[b.j].addScaledVector(u, A); } });
    else d.bonds.forEach(function (b) { if (set[b.i] && set[b.j]) { var u = P[b.j].clone().sub(P[b.i]).normalize(), w = new T.Vector3().crossVectors(u, new T.Vector3(0, 1, 0)); if (w.lengthSq() < 0.01) w.set(1, 0, 0); w.normalize(); var hAt = geo.a[b.j][0] === 'H' ? b.j : (geo.a[b.i][0] === 'H' ? b.i : -1); if (hAt >= 0) disp[hAt].addScaledVector(w, A * 1.6); else { disp[b.i].addScaledVector(w, A * 0.6); disp[b.j].addScaledVector(w, -A * 0.6); } } });
    return disp;
  }
  function stages() {
    return [
      ['Espectroscopía IR', 'IR', 'Las moléculas absorben radiación infrarroja al vibrar', '<p>Los enlaces vibran (tensión y flexión) con frecuencias características. Si la vibración cambia el <b>momento dipolar</b>, la molécula absorbe radiación IR de esa frecuencia (<b>número de onda</b> en cm⁻¹). En el espectro se ve como una <b>banda hacia abajo</b> (menor transmitancia). Aquí: tensión O–H del etanol (banda ancha por puentes de hidrógeno).</p>'],
      ['Región de grupos funcionales', 'Regiones', 'Cada grupo absorbe en una zona típica', '<p>3600–3200 cm⁻¹: O–H y N–H · ~3000: C–H · 2260–2100: C≡N y C≡C · <b>1750–1650: C=O</b> · 1680–1600: C=C · &lt; 1500: <b>huella dactilar</b>. La intensidad del C=O (muy fuerte) lo hace el pico más fácil de identificar. Aquí: C=O de la propanona (1715 cm⁻¹).</p>'],
      ['Carbonilos comparados', 'Carbonilos', 'La posición del C=O y las bandas acompañantes distinguen grupos', '<p>Aldehído (≈ 1730 + C–H a 2720/2820), cetona (≈ 1715), éster (≈ 1740 + C–O fuerte a 1240) y ácido (≈ 1710 + O–H muy ancha 2500–3300). El grupo se determina por <b>el conjunto de bandas</b>, no sólo por el C=O.</p>'],
      ['RMN ¹H: desplazamiento', 'δ (ppm)', 'Cada tipo de H da una señal; δ depende del entorno electrónico', '<p>En <b>RMN ¹H</b> los protones en campo magnético absorben radiofrecuencia. El <b>desplazamiento químico δ</b> (ppm, respecto del TMS = 0) refleja el entorno: átomos electronegativos <b>desapantallan</b> y aumentan δ. Etanol: CH₃ 1,2 · CH₂–O 3,7 · OH variable. Hay <b>una señal por cada tipo de H equivalente</b>.</p>'],
      ['Integración y multiplicidad', 'Multiplicidad', 'Área ∝ nº de H; regla n+1 para los desdoblamientos', '<p>El <b>área</b> de cada señal (integración) es proporcional al número de H (etanol: 3 : 2 : 1). La <b>multiplicidad</b> sigue la <b>regla n+1</b>: un H con n vecinos H (en carbonos adyacentes) se desdobla en n+1 líneas con intensidades de Pascal. CH₃ junto a CH₂ → <b>triplete</b>; CH₂ junto a CH₃ → <b>cuarteto</b> (J ≈ 7 Hz).</p>'],
      ['Resolver un espectro', 'Resolver', 'Combinar IR y RMN para deducir la estructura', '<p>Etanoato de etilo: IR con C=O a 1740 y C–O a 1240 → <b>éster</b>. RMN: singlete 2,05 (3H, CH₃C=O), cuarteto 4,1 (2H, OCH₂) y triplete 1,25 (3H, CH₃): <b>CH₃CO–O–CH₂CH₃</b>. Se suman las integrales (8 H = C₄H₈O₂) y se verifican con las insaturaciones: DBE = 1 (el C=O).</p>'],
      ['Espectro misterioso', 'Misterio', 'Deduce la molécula a partir de sus datos', '<p>En la pestaña <b>Lab</b> hay un espectro misterioso: se muestran las bandas IR y las señales de RMN de una molécula de la biblioteca; elige cuál es. Pista: empieza por la banda de C=O (≈ 1700), luego el número de señales y la integración.</p>']
    ];
  }
  var LESSON = [{ mol: 'etanol', kind: 'ir', sel: 0 }, { mol: 'propanona', kind: 'ir', sel: 1 }, { mol: 'etanal', kind: 'ir', sel: 3 }, { mol: 'etanol', kind: 'nmr', sel: 2 }, { mol: 'etanol', kind: 'nmr', sel: 0 }, { mol: 'acetato', kind: 'nmr', sel: 2 }, { mol: 'tolueno', kind: 'nmr', sel: 1 }];
  var def = {
    key: 'espectroscopia', title: 'Espectroscopía IR y RMN ¹H', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#22d3ee', light: '#0e7490' }, stages: stages, nStages: 7, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 3, 12], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0.5, 13], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 13, 2], target: [0, 0, 0] }],
    layers: [{ id: 'hl', label: 'Resaltar grupo', icon: '◉' }, { id: 'vib', label: 'Vibración (IR)', icon: '〰' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { G.now = 0; labs.a = ctx.label('', 'bl-lead'); labs.b = ctx.label('', 'bl-d'); labs.c = ctx.label('', 'bl-warn'); },
    frame: function (ctx, f, dt) {
      G.now += dt;
      if (!ctx.P.manual) { var l = LESSON[f.i]; if (S._st !== f.i) { S._st = f.i; S.mol = l.mol; S.kind = l.kind; S.sel = l.sel; if (f.i === 2) { S.sel = 3; } } if (f.i === 2) { S.mol = ['etanal', 'propanona', 'acetato', 'acetico'][Math.min(3, Math.floor(f.local * 4))]; S.kind = 'ir'; var ir = mol().ir; S.sel = ir.reduce(function (b, p, i) { return p.v > 1650 && p.v < 1800 ? i : b; }, 0); } }
      var m = mol(), k = m.id + S.kind; if (k !== key_ || !G.d) { if (G.d) { ctx.scene.remove(G.d.g); } G.d = buildDyn(ctx, m); ctx.scene.add(G.d.g); key_ = k; }
      var item = selItem(), set = ctx.layer('hl') ? hlSet(item) : {}, col = S.kind === 'ir' ? 0xffa94d : (GROUPCOL[item.t] || 0x4dabf7);
      var disp = S.kind === 'ir' && ctx.layer('vib') ? dispFor(ctx, G.d, item, set, G.now * 9) : []; updDyn(ctx, G.d, disp, set, col);
      if (ctx.layer('spin')) G.d.g.rotation.y += dt * 0.25;
      labs.a.pos(0, 4.0, 0).set(m.n + ' · ' + m.f, 'bl-lead').vis(true);
      var txt = S.kind === 'ir' ? item.v + ' cm⁻¹ · ' + item.l : 'δ ' + item.d + ' ppm · ' + item.n + ' H · ' + ({ s: 'singlete', d: 'doblete', t: 'triplete', q: 'cuarteto', m: 'multiplete' })[item.mu] + ' · ' + item.l;
      labs.b.pos(0, -3.7, 0).set(txt, 'bl-d').vis(true); labs.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var m = mol(), it = selItem(); return { eq: { chip: S.kind === 'ir' ? 'IR' : 'RMN', name: m.n, body: S.kind === 'ir' ? '<div class="eqline"><small>Banda</small>' + it.v + ' cm⁻¹</div><div class="eqline"><small>Asignación</small>' + it.l + '</div>' : '<div class="eqline"><small>Señal</small>δ ' + it.d + ' ppm</div><div class="eqline"><small>Integral · multiplicidad</small>' + it.n + ' H · ' + ({ s: 'singlete', d: 'doblete', t: 'triplete', q: 'cuarteto', m: 'multiplete' })[it.mu] + '</div>' }, legend: [{ label: 'Halo', color: '#ffa94d', text: 'átomos del grupo seleccionado' }, { label: 'Vibración', color: '#bfc7d1', text: 'tensión / flexión animada (IR)' }] }; },
    measures: function () { var m = mol(), it = selItem(); return [['Molécula', m.n], ['Fórmula', m.f], ['Bandas IR', String(m.ir.length)], ['Señales RMN ¹H', String(m.nmr.length)], ['Total de H', String(m.nmr.reduce(function (a, s) { return a + s.n; }, 0))], ['Selección', S.kind === 'ir' ? it.v + ' cm⁻¹ (' + it.l + ')' : 'δ ' + it.d + ' (' + it.l + ')']]; },
    ideas: ['IR: <b>C=O ≈ 1700</b> (muy intenso); O–H ancha ≈ 3300; C≡N ≈ 2250.', 'RMN ¹H: una señal por tipo de H equivalente; <b>integral ∝ nº de H</b>.', '<b>δ</b> aumenta con la electronegatividad cercana y con anisotropía (aromáticos, C=O).', '<b>Regla n+1</b>: n H vecinos → n+1 líneas (Pascal).', 'Juntos, IR y RMN identifican el esqueleto y los grupos funcionales.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Molécula y selección'); el.appendChild(c);
      ui.mol = kit.ui.options({ label: 'Molécula', cols: 3, value: S.mol, options: M.map(function (m) { return { v: m.id, label: m.n.split(' (')[0] }; }), onChange: function (v) { ctx.goManual(); S.mol = v; S.sel = 0; ui.draw(); } }); c.appendChild(ui.mol);
      var box = document.createElement('div'); c.appendChild(box);
      ui.draw = function () { box.innerHTML = ''; var m = mol(); var mk = function (title, arr, kind) { var h = document.createElement('div'); h.className = 'small muted'; h.style.margin = '8px 0 4px'; h.textContent = title; box.appendChild(h); var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'; arr.forEach(function (p, i) { var b = document.createElement('button'); b.className = 'btn' + (S.kind === kind && S.sel === i ? ' primary' : ''); b.textContent = kind === 'ir' ? p.v + ' cm⁻¹' : 'δ ' + p.d; b.onclick = function () { ctx.goManual(); S.kind = kind; S.sel = i; ui.draw(); }; w.appendChild(b); }); box.appendChild(w); }; mk('Bandas IR (clic para ver la vibración)', m.ir, 'ir'); mk('Señales de RMN ¹H (clic para ver los H)', m.nmr, 'nmr'); };
      var lk = ''; ui.refresh = function () { var k = S.mol + S.kind + S.sel; if (k !== lk) { lk = k; ui.mol.set(S.mol); ui.draw(); } }; ui.draw();
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
      var q = kit.ui.card('Desafío: espectro misterioso'); el.appendChild(q); var qb = document.createElement('div'); q.appendChild(qb); var cur = null, score = [0, 0];
      function nextQ() { cur = M[Math.floor(Math.random() * M.length)]; draw(''); }
      function draw(msg) { var h = '<p class="small">Aciertos: <b>' + score[0] + '</b> / ' + score[1] + '</p>'; if (cur) { h += '<p class="small"><b>IR:</b> ' + cur.ir.map(function (p) { return p.v; }).join(', ') + ' cm⁻¹ (banda más intensa: ' + cur.ir.reduce(function (a, p) { return p.I > a.I ? p : a; }, cur.ir[0]).v + ')<br><b>RMN ¹H:</b> ' + cur.nmr.map(function (s) { return 'δ ' + s.d + ' (' + s.n + 'H, ' + s.mu + ')'; }).join(' · ') + '<br><b>Fórmula:</b> ' + cur.f + '</p>'; } if (msg) h += '<p><b>' + msg + '</b></p>'; qb.innerHTML = h; var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'; M.forEach(function (m) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = m.n.split(' (')[0]; b.onclick = function () { if (!cur) { kit.toast('Pulsa «Nuevo espectro»'); return; } score[1]++; var ok = m === cur; if (ok) score[0]++; var r = cur; cur = null; ctx.goManual(); S.mol = r.id; S.sel = 0; ui.mol.set(r.id); ui.draw(); draw(ok ? '¡Correcto! Era ' + r.n : 'No: era ' + r.n); }; w.appendChild(b); }); qb.appendChild(w); qb.appendChild(ctx.btnRow([{ t: 'Nuevo espectro', primary: true, fn: nextQ }])); }
      draw('');
    },
    graphs: [
      { title: 'Espectro IR', h: 230, note: 'Transmitancia frente a número de onda (cm⁻¹, eje invertido). La banda seleccionada se marca en naranja; la zona < 1500 es la huella dactilar.', draw: function (cx, w, h, c) {
        var m = mol(), L = 14, Rr = 10, Tp = 10, B = 28, pw = w - L - Rr, ph = h - Tp - B, sx = function (v) { return L + pw * (4000 - v) / 3600; }, sy = function (t) { return Tp + ph * (1 - t); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var v = 4000; v >= 400; v -= 400) { cx.beginPath(); cx.moveTo(sx(v), Tp); cx.lineTo(sx(v), Tp + ph); cx.stroke(); cx.fillText(v, sx(v), h - B + 12); } cx.fillText('número de onda (cm⁻¹)', L + pw / 2, h - 3);
        cx.fillStyle = 'rgba(160,170,190,.18)'; cx.fillRect(sx(1500), Tp, sx(400) - sx(1500), ph); cx.fillStyle = c.muted; cx.fillText('huella dactilar', (sx(1500) + sx(400)) / 2, Tp + 11);
        function T(v) { var t = 0.97; m.ir.forEach(function (p) { var z = (v - p.v) / (p.w / 2); t -= p.I * 0.9 / (1 + z * z); }); return Math.max(0.02, t); }
        cx.strokeStyle = c.ink; cx.lineWidth = 1.6; cx.beginPath(); for (var x = 400; x <= 4000; x += 4) { var px = sx(x), py = sy(T(x)); if (x === 400) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke();
        var it = selItem(); if (S.kind === 'ir') { cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.6; cx.beginPath(); for (x = it.v - it.w; x <= it.v + it.w; x += 2) { var px2 = sx(x), py2 = sy(T(x)); if (x === it.v - it.w) cx.moveTo(px2, py2); else cx.lineTo(px2, py2); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ff922b'; cx.textAlign = 'center'; cx.fillText(it.v, sx(it.v), sy(T(it.v)) + 14); } cx.lineWidth = 1; } },
      { title: 'Espectro de RMN ¹H (400 MHz)', h: 230, note: 'δ (ppm) decreciente hacia la derecha; cada señal con área proporcional al nº de H (indicado sobre ella). TMS = 0.', draw: function (cx, w, h, c) {
        var m = mol(), L = 14, Rr = 10, Tp = 20, B = 28, pw = w - L - Rr, ph = h - Tp - B, sx = function (d) { return L + pw * (13 - d) / 13.5; }, tot = m.nmr.reduce(function (a, s) { return a + s.n; }, 0);
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var d = 0; d <= 12; d += 2) { cx.beginPath(); cx.moveTo(sx(d), Tp); cx.lineTo(sx(d), Tp + ph); cx.stroke(); cx.fillText(d, sx(d), h - B + 12); } cx.fillText('δ (ppm)', L + pw / 2, h - 3);
        var sel = S.kind === 'nmr' ? selItem() : null;
        m.nmr.forEach(function (s, i) { var wd = s.mu === 's' && s.d > 10 ? 0.22 : (s.mu === 'm' ? 0.4 : 0.1 + 0.03 * s.n * 0), hgt = ph * Math.min(0.95, 0.25 + 0.7 * s.n / Math.max(3, tot * 0.45)), on = sel === s; cx.fillStyle = on ? '#ff922b' : c.ink; cx.strokeStyle = on ? '#ff922b' : c.ink; cx.lineWidth = on ? 2.4 : 1.6; cx.beginPath(); for (var x = s.d - 1; x <= s.d + 1; x += 0.01) { var z = (x - s.d) / (wd / 2), y = Tp + ph - hgt / (1 + z * z); if (x === s.d - 1) cx.moveTo(sx(x), y); else cx.lineTo(sx(x), y); } cx.stroke(); cx.lineWidth = 1; cx.textAlign = 'center'; cx.fillText(s.n + ' H', sx(s.d), Tp + ph - hgt - 6); });
        cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(L, Tp + ph); cx.lineTo(L + pw, Tp + ph); cx.stroke(); } },
      { title: 'Señal ampliada: multiplicidad (regla n+1)', h: 170, note: 'Líneas con intensidades de Pascal separadas por J (Hz); n vecinos → n+1 líneas.', draw: function (cx, w, h, c) {
        var m = mol(), s = S.kind === 'nmr' ? selItem() : m.nmr[0], pascal = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], m: [1, 3, 2, 4, 2, 3, 1] }[s.mu], mx = Math.max.apply(null, pascal), J = s.J || 7, mid = w / 2, step = Math.min(34, (w - 60) / (pascal.length)), Tp = 24, ph = h - Tp - 34;
        cx.font = '11px system-ui'; cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText('δ ' + s.d + ' ppm · ' + ({ s: 'singlete', d: 'doblete', t: 'triplete', q: 'cuarteto', m: 'multiplete' })[s.mu] + ' · ' + s.l, w / 2, 14);
        cx.strokeStyle = c.ink; cx.lineWidth = 2.6; pascal.forEach(function (p, i) { var x = mid + (i - (pascal.length - 1) / 2) * step, y1 = Tp + ph, y0 = y1 - ph * p / mx; cx.beginPath(); cx.moveTo(x, y1); cx.lineTo(x, y0); cx.stroke(); cx.fillStyle = c.muted; cx.fillText(p, x, y0 - 4); }); cx.lineWidth = 1;
        cx.fillStyle = c.muted; cx.fillText(s.mu === 's' ? 'sin desdoblamiento' : (s.mu === 'm' ? 'multiplete complejo' : 'J ≈ ' + J + ' Hz entre líneas'), w / 2, h - 18); cx.fillText(s.v || '', w / 2, h - 4); } },
      { title: 'Desplazamientos químicos típicos de ¹H', h: 280, note: 'Rangos δ (ppm) habituales; se marcan las señales de la molécula actual.', draw: function (cx, w, h, c) {
        var L = 150, Tp = 6, B = 24, ph = (h - Tp - B) / DT.length, pw = w - L - 12, sx = function (d) { return L + pw * d / 13; }; cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center'; for (var d = 0; d <= 12; d += 2) { cx.beginPath(); cx.moveTo(sx(d), Tp); cx.lineTo(sx(d), h - B); cx.stroke(); cx.fillText(d, sx(d), h - B + 12); } cx.fillText('δ (ppm)', L + pw / 2, h - 2);
        var m = mol(); DT.forEach(function (r, i) { var y = Tp + i * ph; var hit = m.nmr.some(function (s) { return s.d >= r[1] - 0.15 && s.d <= r[2] + 0.15; }); cx.fillStyle = hit ? '#22b8cf' : '#9aa7b4'; cx.globalAlpha = hit ? 1 : 0.55; cx.fillRect(sx(r[1]), y + 2, sx(r[2]) - sx(r[1]), ph - 5); cx.globalAlpha = 1; cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(r[0], L - 6, y + ph / 2 + 3); });
        m.nmr.forEach(function (s) { cx.fillStyle = '#ff922b'; cx.beginPath(); cx.arc(sx(s.d), h - B - 4, 4, 0, 7); cx.fill(); }); } }
    ],
    calc: function () {
      var m = mol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, mu = { s: 'singlete', d: 'doblete', t: 'triplete', q: 'cuarteto', m: 'multiplete' }, tot = m.nmr.reduce(function (a, s) { return a + s.n; }, 0);
      return '<div class="card-kicker">' + m.n + ' · ' + m.f + '</div><div class="calc-step">1 · Bandas IR</div><table class="calc-table">' + m.ir.map(function (p) { return row(p.v + ' cm⁻¹', p.l); }).join('') + '</table><div class="calc-step">2 · Señales de RMN ¹H (' + m.nmr.length + ' señales, ' + tot + ' H)</div><table class="calc-table">' + m.nmr.map(function (s) { return row('δ ' + s.d, s.n + ' H · ' + mu[s.mu] + ' · ' + s.l + '<br><small>' + s.v + '</small>'); }).join('') + '</table><div class="calc-step">3 · Integración</div><table class="calc-table">' + row('Proporción', m.nmr.slice().sort(function (a, b) { return a.d - b.d; }).map(function (s) { return s.n; }).join(' : ')) + row('Suma = H totales', '<b>' + tot + '</b>') + '</table>';
    },
    calcLabel: 'Asignación',
    quiz: [
      { q: 'Una banda intensa en ≈ 1715 cm⁻¹ indica…', options: ['un grupo carbonilo (C=O)', 'un grupo O–H', 'un triple enlace C≡N', 'un enlace C–Cl'], answer: 0, why: 'El estiramiento C=O es muy intenso y aparece en 1650–1750 cm⁻¹.' },
      { q: 'Una banda ancha en 3200–3550 cm⁻¹ es típica de…', options: ['O–H de alcohol (puentes de H)', 'C=O', 'C≡C', 'C–H aromático'], answer: 0, why: 'Los puentes de hidrógeno ensanchan la banda de tensión O–H.' },
      { q: 'En el etanol, la señal del CH₂ en RMN ¹H es un…', options: ['cuarteto', 'triplete', 'singlete', 'doblete'], answer: 0, why: 'Tiene 3 H vecinos (CH₃): 3+1 = 4 líneas.' },
      { q: '¿Cuántas señales de RMN ¹H da la propanona?', options: ['1', '2', '3', '6'], answer: 0, why: 'Los seis H son equivalentes por simetría: una sola señal (singlete).' },
      { q: 'Una señal en δ ≈ 9,8 ppm sugiere…', options: ['un H de aldehído', 'un H alquílico', 'un H aromático', 'un H de CH₃–C'], answer: 0, why: 'El H del CHO está muy desapantallado (9–10 ppm).' },
      { q: 'La integración 3 : 2 : 1 corresponde al etanol porque…', options: ['CH₃, CH₂ y OH tienen 3, 2 y 1 H', 'hay tres tipos de C', 'la masa molar es 46', 'la señal OH es triple'], answer: 0, why: 'El área de cada señal es proporcional al número de H que la originan.' },
      { q: '¿Para qué se usa el TMS en RMN?', options: ['Como referencia: δ = 0', 'Como disolvente', 'Para aumentar la señal', 'Como catalizador'], answer: 0, why: 'Tetrametilsilano: 12 H equivalentes, muy apantallados; define δ = 0 ppm.' },
      { q: 'Un triple enlace C≡N absorbe en el IR hacia…', options: ['2250 cm⁻¹', '1700 cm⁻¹', '3300 cm⁻¹ ancha', '1050 cm⁻¹'], answer: 0, why: 'La región 2100–2260 cm⁻¹ corresponde a triples enlaces (C≡N y C≡C).' }
    ],
    help: { intro: 'Elige molécula y banda o señal en «Lab»: el 3D resalta los átomos responsables y anima la vibración (IR).', items: [['Bandas IR', 'tensión o flexión animada sobre los átomos del grupo.'], ['Señales RMN', 'se resaltan los H que la originan.'], ['Gráficos', 'espectros IR y RMN, multiplete ampliado y tabla de δ.'], ['Desafío', 'espectro misterioso: identifica la molécula.']] }
  };
  MSim.create(def);
})();
