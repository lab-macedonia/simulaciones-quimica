/* Grupos funcionales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

(function () {
  var fmt = SimKit.fmt;
  var FG = {
    ol: { n: 'Alcohol', g: 'R–OH', suf: '-ol', c: '#ff6b6b', ir: [3200, 3550, 'O–H, ancha'], pr: 7, ex: 'etanol' },
    eter: { n: 'Éter', g: 'R–O–R′', suf: 'alcoxi- (prefijo)', c: '#ffa94d', ir: [1050, 1150, 'C–O'], pr: 11, ex: 'metoximetano' },
    ald: { n: 'Aldehído', g: 'R–CHO', suf: '-al', c: '#ffd43b', ir: [1720, 1740, 'C=O (+ C–H 2720)'], pr: 5, ex: 'etanal' },
    cet: { n: 'Cetona', g: 'R–CO–R′', suf: '-ona', c: '#94d82d', ir: [1705, 1725, 'C=O'], pr: 6, ex: 'propanona' },
    ac: { n: 'Ácido carboxílico', g: 'R–COOH', suf: 'ácido -oico', c: '#20c997', ir: [1700, 1725, 'C=O + O–H muy ancha'], pr: 1, ex: 'ácido etanoico' },
    es: { n: 'Éster', g: 'R–COO–R′', suf: '-ato de …ilo', c: '#22b8cf', ir: [1735, 1750, 'C=O'], pr: 2, ex: 'etanoato de etilo' },
    am: { n: 'Amida', g: 'R–CONH₂', suf: '-amida', c: '#4dabf7', ir: [1630, 1690, 'C=O (amida I)'], pr: 3, ex: 'etanamida' },
    amin: { n: 'Amina', g: 'R–NH₂', suf: '-amina', c: '#748ffc', ir: [3300, 3500, 'N–H'], pr: 8, ex: 'etanamina' },
    nit: { n: 'Nitrilo', g: 'R–C≡N', suf: '-nitrilo', c: '#9775fa', ir: [2210, 2260, 'C≡N'], pr: 4, ex: 'etanonitrilo' },
    nitro: { n: 'Nitro', g: 'R–NO₂', suf: 'nitro- (prefijo)', c: '#da77f2', ir: [1340, 1550, 'N=O (2 bandas)'], pr: 13, ex: 'nitrometano' },
    tiol: { n: 'Tiol', g: 'R–SH', suf: '-tiol', c: '#f783ac', ir: [2550, 2600, 'S–H, débil'], pr: 9, ex: 'etanotiol' },
    alq: { n: 'Alqueno', g: 'C=C', suf: '-eno', c: '#a9e34b', ir: [1620, 1680, 'C=C'], pr: 10, ex: 'propeno' },
    alqi: { n: 'Alquino', g: 'C≡C', suf: '-ino', c: '#66d9e8', ir: [2100, 2260, 'C≡C'], pr: 10.5, ex: 'propino' },
    ar: { n: 'Aromático', g: 'Ar (benceno)', suf: 'fenil- / -benceno', c: '#adb5bd', ir: [1450, 1600, 'C=C del anillo'], pr: 12, ex: 'benceno' },
    hal: { n: 'Haluro de alquilo', g: 'R–X', suf: 'halo- (prefijo)', c: '#51cf66', ir: [500, 800, 'C–X'], pr: 12.5, ex: 'cloroetano' }
  };
  var FKEY = Object.keys(FG);
  var M = [
    { id: 'propano', n: 'propano', s: 'CCC', fam: 'alc' },
    { id: 'etanol', n: 'etanol', s: 'CCO{ol}' }, { id: 'eter', n: 'metoximetano (dimetil éter)', s: 'CO{eter}C' },
    { id: 'etanal', n: 'etanal', s: 'CC{ald+}=O{ald}' }, { id: 'propanona', n: 'propanona', s: 'CC{cet}(=O{cet})C' },
    { id: 'acetico', n: 'ácido etanoico', s: 'CC{ac}(=O{ac})O{ac}' }, { id: 'acetato', n: 'etanoato de etilo', s: 'CC{es}(=O{es})O{es}CC' }, { id: 'amida', n: 'etanamida', s: 'CC{am}(=O{am})N{am}' },
    { id: 'amina', n: 'etanamina', s: 'CCN{amin}' }, { id: 'nitrilo', n: 'etanonitrilo', s: 'CC{nit}#N{nit}' }, { id: 'nitro', n: 'nitrometano', s: 'CN{nitro}(=O{nitro})=O{nitro}' },
    { id: 'tiol', n: 'etanotiol', s: 'CCS{tiol}' }, { id: 'propeno', n: 'propeno', s: 'CC{alq}=C{alq}' }, { id: 'propino', n: 'propino', s: 'CC{alqi}#C{alqi}' },
    { id: 'tolueno', n: 'metilbenceno (tolueno)', s: 'CPh{ar+}' }, { id: 'fenol', n: 'fenol', s: 'O{ol}Ph{ar+}' }, { id: 'cloroetano', n: 'cloroetano', s: 'CCCl{hal}' },
    { id: 'glicina', n: 'glicina (ácido 2-aminoetanoico)', s: 'N{amin}CC{ac}(=O{ac})O{ac}' }, { id: 'lactico', n: 'ácido 2-hidroxipropanoico (láctico)', s: 'CC(O{ol})C{ac}(=O{ac})O{ac}' }, { id: 'acrilato', n: 'propenoato de metilo', s: 'C{alq}=C{alq}C{es}(=O{es})O{es}C' }
  ];
  var MID = {}; M.forEach(function (m) { MID[m.id] = m; m.geo = MSim.build(m.s); m.fgs = []; m.geo.tag.forEach(function (t) { if (t && m.fgs.indexOf(t) < 0) m.fgs.push(t); }); });
  var MASS = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.90 };
  function formula(m) { var c = {}; m.geo.a.forEach(function (a) { c[a[0]] = (c[a[0]] || 0) + 1; }); var order = ['C', 'H', 'N', 'O', 'S', 'F', 'Cl', 'Br', 'I'], sub = '₀₁₂₃₄₅₆₇₈₉', t = '', mass = 0; order.forEach(function (e) { if (c[e]) { t += e + (c[e] > 1 ? String(c[e]).split('').map(function (d) { return sub[+d]; }).join('') : ''); mass += c[e] * MASS[e]; } }); var X = (c.F || 0) + (c.Cl || 0) + (c.Br || 0) + (c.I || 0), dbe = ((c.C || 0) * 2 + 2 + (c.N || 0) - (c.H || 0) - X) / 2; return { f: t, M: mass, dbe: dbe, c: c }; }
  var S = { set: ['etanol', 'eter', 'etanal', 'propanona'], hide: false, ch: null, score: [0, 0] };
  var grps = [], labs = [], flabs = [], names = [], key_ = '';
  var STG = [['etanal'], 0];
  function stages() {
    return [
      ['¿Qué es un grupo funcional?', 'Concepto', 'Un grupo funcional es el átomo o conjunto de átomos que determina la reactividad', '<p>El <b>grupo funcional</b> es la parte reactiva de una molécula orgánica: moléculas con el mismo grupo reaccionan de modo parecido. Compara el <b>propano</b> (sólo C–C y C–H, poco reactivo) con el <b>etanol</b> (–OH), el <b>etanal</b> (–CHO) y el <b>ácido etanoico</b> (–COOH). Los halos de color marcan cada grupo.</p>'],
      ['Grupos oxigenados', 'Oxigenados', 'Alcohol, éter, aldehído y cetona', '<p><b>Alcohol</b> R–OH (puentes de H, p. eb. alto); <b>éter</b> R–O–R′ (C–O–C, poco reactivo); <b>aldehído</b> R–CHO (carbonilo en el extremo de la cadena, se oxida a ácido); <b>cetona</b> R–CO–R′ (carbonilo interior). Aldehído y cetona comparten el grupo <b>carbonilo C=O</b>.</p>'],
      ['Derivados del ácido carboxílico', 'Carboxílicos', 'Ácido, éster y amida: carbonilo unido a O u N', '<p>Los <b>ácidos carboxílicos</b> (–COOH), <b>ésteres</b> (–COOR) y <b>amidas</b> (–CONH₂) tienen un carbonilo unido a un heteroátomo (acilo). El ácido es el de mayor prioridad en la nomenclatura. La <b>amida</b> es plana por resonancia N–C=O (enlace C–N con carácter parcial doble).</p>'],
      ['Nitrógeno y azufre', 'N y S', 'Amina, nitrilo, nitro y tiol', '<p><b>Amina</b> R–NH₂ (básica, par libre en N); <b>nitrilo</b> R–C≡N (lineal, sp); <b>nitro</b> R–NO₂ (plano, fuertemente atractor de electrones); <b>tiol</b> R–SH (análogo azufrado del alcohol, olor característico, S–H poco polar).</p>'],
      ['Insaturaciones y aromáticos', 'Insaturados', 'Alqueno, alquino y anillo aromático', '<p><b>Alqueno</b> C=C (plano, sp²), <b>alquino</b> C≡C (lineal, sp), <b>aromático</b> (anillo plano de 6 C con 6 e⁻ π deslocalizados). El <b>fenol</b> combina anillo y –OH; observa que el OH sobre un anillo es un fenol, no un alcohol alifático.</p>'],
      ['Prioridad al nombrar', 'Prioridad', 'En moléculas polifuncionales manda el grupo de mayor prioridad', '<p>Orden de prioridad (sufijo): <b>ácido &gt; éster &gt; amida &gt; nitrilo &gt; aldehído &gt; cetona &gt; alcohol &gt; amina &gt; alqueno &gt; alquino</b>. Los demás se nombran como prefijos. Glicina: ácido (principal) + amina → «ácido 2-aminoetanoico». Láctico: ácido + alcohol → «ácido 2-hidroxipropanoico».</p>']
    ];
  }
  var LESSON = [['propano', 'etanol', 'etanal', 'acetico'], ['etanol', 'eter', 'etanal', 'propanona'], ['acetico', 'acetato', 'amida'], ['amina', 'nitrilo', 'nitro', 'tiol'], ['propeno', 'propino', 'tolueno', 'fenol'], ['glicina', 'lactico', 'acrilato']];
  function rebuild(ctx) {
    var T = ctx.T, sc = ctx.scene; grps.forEach(function (g) { sc.remove(g); }); grps = []; var n = S.set.length, sp = n === 1 ? 0 : 6.2;
    S.set.forEach(function (id, k) {
      var m = MID[id], g = new T.Group(); g.add(ctx.mol(m.geo, { gs: 1.0, ar: 0.46 }));
      m.geo.tag.forEach(function (t, i) { if (!t) return; var a = m.geo.a[i], h = new T.Mesh(new T.SphereGeometry(0.62, 20, 14), new T.MeshBasicMaterial({ color: FG[t].c, transparent: true, opacity: 0.38, depthWrite: false })); h.position.set(a[1], a[2], a[3]); h.userData.halo = true; g.add(h); });
      g.position.x = (k - (n - 1) / 2) * sp; sc.add(g); grps.push(g);
    });
    var dz = n === 1 ? 11 : 8 + 3.4 * n; ctx.def.views[0].pos = [0, 3, dz]; ctx.def.views[1].pos = [0, 1, dz]; ctx.view('libre'); key_ = S.set.join('|');
  }
  var def = {
    key: 'grupos-funcionales', title: 'Grupos funcionales', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#38bdf8', light: '#0369a1' },
    stages: stages, dur: 10, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 4, 24], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 24], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 22, 4], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: 'Halos de grupo', icon: '◉' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) {
      for (var i = 0; i < 4; i++) { names.push(ctx.label('', 'bl-d')); var row = []; for (var j = 0; j < 3; j++) row.push(ctx.label('', 'bl-lead')); flabs.push(row); }
      rebuild(ctx);
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var st = LESSON[f.i]; if (S._st !== f.i) { S._st = f.i; S.set = st.slice(); S.hide = false; } }
      if (S.set.join('|') !== key_) rebuild(ctx);
      var halo = ctx.layer('halo') && !S.hide, n = S.set.length, sp = n === 1 ? 0 : 6.2;
      grps.forEach(function (g, k) { if (ctx.layer('spin')) g.rotation.y += dt * 0.35; g.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; });
        var m = MID[S.set[k]], x = g.position.x; names[k].pos(x, -3.6, 0).set(S.hide ? '¿?' : m.n, 'bl-d').vis(true);
        for (var j = 0; j < 3; j++) { var fl = flabs[k][j], id = m.fgs[j]; if (id && halo) { fl.pos(x, 3.4 + j * 1.0, 0).set(FG[id].n, 'bl-lead').vis(true); fl.o.element.style.background = FG[id].c; fl.o.element.style.color = '#111'; } else fl.vis(false); } });
      for (var k2 = grps.length; k2 < 4; k2++) { names[k2].vis(false); for (var j2 = 0; j2 < 3; j2++) flabs[k2][j2].vis(false); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var m = MID[S.set[0]], fo = formula(m), fl = S.set.reduce(function (a, id) { MID[id].fgs.forEach(function (t) { if (a.indexOf(t) < 0) a.push(t); }); return a; }, []);
      return { eq: { chip: S.set.length > 1 ? S.set.length + ' mol.' : formula(m).f, name: S.set.length > 1 ? 'Comparación' : m.n, body: S.set.length === 1 ? '<div class="eqline"><small>Masa molar</small>' + fmt(fo.M, 2) + ' g/mol</div><div class="eqline"><small>Insaturaciones</small>' + fo.dbe + '</div><div class="eqline"><small>Grupos</small>' + (m.fgs.length ? m.fgs.map(function (t) { return FG[t].n; }).join(', ') : 'ninguno (alcano)') + '</div>' : '<div class="eqline"><small>Grupos presentes</small>' + (fl.length ? fl.map(function (t) { return FG[t].n; }).join(', ') : '—') + '</div>' },
        legend: fl.map(function (t) { return { label: FG[t].n, color: FG[t].c, text: FG[t].g }; }) }; },
    measures: function () { var m = MID[S.set[0]], fo = formula(m); return [['Molécula', m.n], ['Fórmula', fo.f], ['Masa molar', fmt(fo.M, 2) + ' g/mol'], ['Insaturaciones (DBE)', String(fo.dbe)], ['Grupos', m.fgs.length ? m.fgs.map(function (t) { return FG[t].n; }).join(', ') : 'ninguno'], ['Moléculas en escena', String(S.set.length)]]; },
    ideas: ['El <b>grupo funcional</b> determina la reactividad y las propiedades.', '<b>Carbonilo C=O</b>: aldehído, cetona, ácido, éster, amida.', 'Prioridad: <b>ácido &gt; éster &gt; amida &gt; nitrilo &gt; aldehído &gt; cetona &gt; alcohol &gt; amina</b>.', 'Cada grupo tiene una banda IR característica (ver gráficos).', 'Los grupos de menor prioridad se nombran como <b>prefijos</b>.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Moléculas (hasta 4)'); el.appendChild(c); var wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0'; c.appendChild(wrap); var btns = {};
      M.forEach(function (m) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = m.n.split(' (')[0]; b.title = m.n; b.onclick = function () { ctx.goManual(); var i = S.set.indexOf(m.id); if (i >= 0) { if (S.set.length > 1) S.set.splice(i, 1); } else { if (S.set.length >= 4) S.set.shift(); S.set.push(m.id); } S.hide = false; ui.refresh(); }; wrap.appendChild(b); btns[m.id] = b; });
      ui.refresh = function () { M.forEach(function (m) { btns[m.id].className = 'btn' + (S.set.indexOf(m.id) >= 0 ? ' primary' : ''); }); };
      ui.refresh();
      c.appendChild(ctx.btnRow([{ t: 'Oxigenados', fn: function () { ctx.goManual(); S.set = LESSON[1].slice(); S.hide = false; ui.refresh(); } }, { t: 'Carboxílicos', fn: function () { ctx.goManual(); S.set = LESSON[2].slice(); S.hide = false; ui.refresh(); } }, { t: 'N y S', fn: function () { ctx.goManual(); S.set = LESSON[3].slice(); S.hide = false; ui.refresh(); } }, { t: 'Insaturados', fn: function () { ctx.goManual(); S.set = LESSON[4].slice(); S.hide = false; ui.refresh(); } }, { t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
      var ch = kit.ui.card('Desafío: ¿qué grupo es?'); el.appendChild(ch); var box = document.createElement('div'); ch.appendChild(box);
      function newQ() { var cand = M.filter(function (m) { return m.fgs.length === 1; }); var m = cand[Math.floor(Math.random() * cand.length)]; ctx.goManual(); S.set = [m.id]; S.hide = true; S.ch = m.fgs[0]; ui.refresh(); draw(''); }
      function draw(msg) { box.innerHTML = '<p class="small">Aciertos: <b>' + S.score[0] + '</b> / ' + S.score[1] + '. ' + (S.ch ? 'La molécula tiene los halos ocultos: identifica su grupo.' : 'Pulsa «Nueva molécula».') + '</p>' + (msg ? '<p><b>' + msg + '</b></p>' : ''); var grid = document.createElement('div'); grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'; FKEY.forEach(function (k) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = FG[k].n; b.onclick = function () { if (!S.ch) { kit.toast('Pulsa «Nueva molécula»'); return; } S.score[1]++; var ok = k === S.ch; if (ok) S.score[0]++; var right = S.ch; S.ch = null; S.hide = false; draw(ok ? '¡Correcto! ' + FG[right].n + ' (' + FG[right].g + ')' : 'No: era ' + FG[right].n + ' (' + FG[right].g + ').'); }; grid.appendChild(b); }); box.appendChild(grid); box.appendChild(ctx.btnRow([{ t: 'Nueva molécula', primary: true, fn: newQ }])); }
      draw('');
    },
    graphs: [
      { title: 'Prioridad de grupos para nombrar', h: 300, note: 'Mayor prioridad arriba. Resaltados: grupos presentes en la escena.', draw: function (cx, w, h, c) {
        var ks = FKEY.slice().sort(function (a, b) { return FG[a].pr - FG[b].pr; }), ph = (h - 14) / ks.length, pres = {}; S.set.forEach(function (id) { MID[id].fgs.forEach(function (t) { pres[t] = 1; }); }); cx.font = '11px system-ui';
        ks.forEach(function (k, i) { var y = 6 + i * ph; cx.globalAlpha = pres[k] ? 1 : 0.4; cx.fillStyle = FG[k].c; cx.fillRect(10, y + 2, 14, ph - 5); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText((i + 1) + '. ' + FG[k].n + '  ' + FG[k].g, 32, y + ph / 2 + 3); cx.textAlign = 'right'; cx.fillText(FG[k].suf, w - 8, y + ph / 2 + 3); cx.globalAlpha = 1; }); } },
      { title: 'Bandas IR características (cm⁻¹)', h: 270, note: 'Barras: región de absorción. Resaltados los grupos presentes. Se profundiza en el simulador de espectroscopía.', draw: function (cx, w, h, c) {
        var L = 14, Rr = 10, Tp = 6, B = 26, pw = w - L - Rr, ks = FKEY.slice().sort(function (a, b) { return FG[b].ir[1] - FG[a].ir[1]; }), ph = (h - Tp - B) / ks.length, pres = {}; S.set.forEach(function (id) { MID[id].fgs.forEach(function (t) { pres[t] = 1; }); });
        var sx = function (v) { return L + pw * (4000 - v) / 3600; }; cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center';
        for (var v = 4000; v >= 400; v -= 600) { cx.beginPath(); cx.moveTo(sx(v), Tp); cx.lineTo(sx(v), h - B); cx.stroke(); cx.fillText(v, sx(v), h - B + 12); } cx.fillText('número de onda (cm⁻¹)', L + pw / 2, h - 3);
        ks.forEach(function (k, i) { var y = Tp + i * ph, r = FG[k].ir; cx.globalAlpha = pres[k] ? 1 : 0.35; cx.fillStyle = FG[k].c; cx.fillRect(sx(r[1]), y + 2, Math.max(4, sx(r[0]) - sx(r[1])), ph - 5); cx.fillStyle = c.ink; cx.textAlign = r[1] > 2200 ? 'left' : 'right'; cx.fillText(FG[k].n, r[1] > 2200 ? sx(r[0]) + 5 : sx(r[1]) - 5, y + ph / 2 + 3); cx.globalAlpha = 1; }); } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return S.set.map(function (id) { var m = MID[id], fo = formula(m), main = m.fgs.slice().sort(function (a, b) { return FG[a].pr - FG[b].pr; })[0];
        return '<div class="card-kicker">' + m.n + '</div><table class="calc-table">' + row('Fórmula molecular', '<b>' + fo.f + '</b>') + row('Masa molar', fmt(fo.M, 2) + ' g/mol') + row('Insaturaciones (2C+2+N−H−X)/2', '<b>' + fo.dbe + '</b>') + row('Grupos', m.fgs.length ? m.fgs.map(function (t) { return FG[t].n + ' (' + FG[t].g + ')'; }).join('; ') : 'ninguno') + row('Grupo principal', main ? FG[main].n + ' → ' + FG[main].suf : '— (alcano: -ano)') + '</table>'; }).join('');
    },
    calcLabel: 'Fórmula',
    quiz: [
      { q: '¿Qué grupo funcional tiene el etanal?', options: ['Aldehído', 'Cetona', 'Ácido carboxílico', 'Éter'], answer: 0, why: 'R–CHO: carbonilo en el extremo de la cadena, con un H sobre el carbono carbonílico.' },
      { q: 'La diferencia entre aldehído y cetona es que…', options: ['en la cetona el carbonilo está unido a dos carbonos', 'la cetona no tiene C=O', 'el aldehído tiene OH', 'ninguna: son iguales'], answer: 0, why: 'Ambos tienen C=O; en la cetona el carbonilo es interior (R–CO–R′).' },
      { q: '¿Qué grupo es R–COO–R′?', options: ['Éster', 'Éter', 'Ácido', 'Amida'], answer: 0, why: 'Carbonilo unido a un oxígeno que lleva otro grupo R′: éster.' },
      { q: 'Ordena por prioridad en nomenclatura (mayor primero).', options: ['ácido > éster > amida > nitrilo > aldehído > cetona > alcohol > amina', 'alcohol > cetona > aldehído > ácido', 'amina > alcohol > cetona > ácido', 'cetona > aldehído > éster > ácido'], answer: 0, why: 'Es el orden IUPAC de grupos principales (sufijo).' },
      { q: 'La glicina, NH₂–CH₂–COOH, se nombra como…', options: ['ácido 2-aminoetanoico', '2-carboxietanamina', 'aminoetanal', 'etanoato de amino'], answer: 0, why: 'El ácido es el grupo principal (sufijo -oico); la amina pasa a prefijo amino-.' },
      { q: '¿Qué banda IR es característica de un nitrilo?', options: ['≈ 2200–2260 cm⁻¹', '≈ 1700 cm⁻¹', '≈ 3300 cm⁻¹ ancha', '≈ 1100 cm⁻¹'], answer: 0, why: 'El triple enlace C≡N absorbe en 2210–2260 cm⁻¹.' },
      { q: '¿Cuántas insaturaciones (DBE) tiene el etanoato de etilo, C₄H₈O₂?', options: ['1', '0', '2', '4'], answer: 0, why: 'DBE = (2·4 + 2 − 8)/2 = 1 (el C=O).' },
      { q: 'Un OH unido directamente a un anillo aromático corresponde a…', options: ['un fenol', 'un alcohol alifático', 'un éter', 'un ácido carboxílico'], answer: 0, why: 'Ar–OH es un fenol: más ácido que un alcohol por la estabilización del fenóxido.' }
    ],
    help: { intro: 'Los halos de color marcan cada grupo funcional. En «Lab» compón la escena con hasta cuatro moléculas.', items: [['Halos', 'una capa permite ocultarlos para poner a prueba la identificación.'], ['Desafío', 'identifica el grupo de una molécula con halos ocultos.'], ['Fórmula', 'masa molar e insaturaciones de cada molécula.'], ['Gráficos', 'prioridad de nomenclatura y bandas IR.']] }
  };
  MSim.create(def);
})();
