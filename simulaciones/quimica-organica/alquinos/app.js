/* Alquinos: estructura y reacciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE;
  var SUB = { prop: { n: 'Propino', s: 'CC#C', t: true }, but1: { n: '1-Butino', s: 'CCC#C', t: true }, but2: { n: '2-Butino', s: 'CC#CC', t: false } };
  var RX = {
    none: { n: 'Sin reacción', r: '' },
    nanh2: { n: 'Desprotonación (NaNH₂)', r: 'NaNH₂, NH₃(l)', note: 'El H terminal (pKa ≈ 25) se desprotona: se forma el acetiluro, un buen nucleófilo.' },
    h2pd: { n: 'H₂ / Pd-C', r: 'H₂ (exceso), Pd/C', note: 'Hidrogenación completa a alcano; no se detiene en el alqueno.' },
    lindlar: { n: 'H₂ / Lindlar', r: 'H₂, Pd/CaCO₃ envenenado', note: 'Adición sin al mismo lado: alqueno cis (Z).' },
    nanh3: { n: 'Na / NH₃(l)', r: 'Na, NH₃(l)', note: 'Reducción por disolución del metal: alqueno trans (E).' },
    h2o: { n: 'H₂O, H₂SO₄, HgSO₄', r: 'H₂O, H₂SO₄, HgSO₄', note: 'Hidratación Markovnikov: el enol se tautomeriza a cetona.' },
    hbo: { n: 'Hidroboración–oxidación', r: '1) R₂BH   2) H₂O₂, NaOH', note: 'Anti-Markovnikov: el enol da un aldehído (alquino terminal).' },
    hx: { n: 'HBr (1 equiv.)', r: 'HBr', note: 'Adición Markovnikov: haloalqueno; con exceso, dihaluro geminal.' }
  };
  var PR = {
    prop: { nanh2: ['CC#C', 'Acetiluro de propino'], h2pd: ['CCC', 'Propano'], lindlar: ['CC=C', 'Propeno'], nanh3: ['CC=C', 'Propeno'], h2o: ['CC(=O)C', 'Propanona (acetona)'], hbo: ['CCC=O', 'Propanal'], hx: ['CC(Br)=C', '2-Bromopropeno'] },
    but1: { nanh2: ['CCC#C', 'Acetiluro de 1-butino'], h2pd: ['CCCC', 'Butano'], lindlar: ['CCC=C', '1-Buteno'], nanh3: ['CCC=C', '1-Buteno'], h2o: ['CCC(=O)C', 'Butanona'], hbo: ['CCCC=O', 'Butanal'], hx: ['CCC(Br)=C', '2-Bromo-1-buteno'] },
    but2: { nanh2: null, h2pd: ['CCCC', 'Butano'], lindlar: ['CC=CC', '(Z)-2-Buteno'], nanh3: ['CC=CC', '(E)-2-Buteno'], h2o: ['CCC(=O)C', 'Butanona'], hbo: ['CCC(=O)C', 'Butanona'], hx: ['CC=C(Br)C', '2-Bromo-2-buteno'] }
  };
  var S = { sub: 'but1', rx: 'none' }, g = null, gS = null, gP = null, arrow = null, lab = [], keyP = '', keyS = '';
  function prod() { var p = PR[S.sub][S.rx]; if (S.rx === 'hbo' && !SUB[S.sub].t) p = PR[S.sub].hbo; return p || null; }
  function cisify(geo) { // gira 180° el fragmento unido al C3 del alqueno CC=CC (convierte trans en cis)
    var a = geo.a, b = geo.b, n = a.length, i, db = null; b.forEach(function (x) { if (x[2] === 2) db = x; }); if (!db) return geo;
    var adj = a.map(function () { return []; }); b.forEach(function (x) { adj[x[0]].push(x[1]); adj[x[1]].push(x[0]); });
    var seen = {}; seen[db[0]] = 1; var st = [db[1]], fr = []; seen[db[1]] = 1; while (st.length) { var u = st.pop(); fr.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; st.push(v); } }); }
    var p0 = new T.Vector3(a[db[0]][1], a[db[0]][2], a[db[0]][3]), p1 = new T.Vector3(a[db[1]][1], a[db[1]][2], a[db[1]][3]), ax = p1.clone().sub(p0).normalize();
    fr.forEach(function (k) { if (k === db[1]) return; var v = new T.Vector3(a[k][1], a[k][2], a[k][3]).sub(p1); v.applyAxisAngle(ax, Math.PI); a[k][1] = p1.x + v.x; a[k][2] = p1.y + v.y; a[k][3] = p1.z + v.z; });
    return geo;
  }
  function stages() {
    return [
      ['Estructura sp', 'Estructura', 'Los carbonos del triple enlace son sp: geometría lineal de 180°',
        '<p>En un <b>alquino</b> los dos carbonos del triple enlace tienen hibridación <b>sp</b>. El enlace C≡C (1,20 Å) es más corto que el C=C (1,34 Å) y los cuatro átomos H–C≡C–C están en <b>línea recta (180°)</b>. Un σ y dos π (perpendiculares entre sí) forman el triple enlace. Cambia entre propino, 1-butino y 2-butino.</p>'],
      ['Acidez y acetiluros', 'Acidez', 'El H terminal es ácido (pKa ≈ 25) porque el carbanión sp tiene 50 % de carácter s',
        '<p>El H de un <b>alquino terminal</b> es ácido (pKa ≈ 25), mucho más que el de un alqueno (44) o un alcano (50), porque el par del carbanión está en un orbital <b>sp (50 % s)</b>, más cercano al núcleo. Una base fuerte como <b>NaNH₂</b> lo desprotona y forma un <b>acetiluro</b>, nucleófilo útil para alargar cadenas. El 2-butino no tiene H terminal y no reacciona.</p>'],
      ['Hidrogenación selectiva', 'Hidrogenación', 'Lindlar → cis · Na/NH₃ → trans · H₂/Pd → alcano',
        '<p>Con <b>H₂/Pd-C</b> el alquino llega hasta el alcano. El catalizador de <b>Lindlar</b> (Pd envenenado) se detiene en el <b>alqueno cis</b>, por adición sin de los dos H. La reducción con <b>Na en NH₃ líquido</b> da el <b>alqueno trans</b> mediante un anión radical. Observa la geometría del producto.</p>'],
      ['Hidratación y tautomería', 'Hidratación', 'Enol → cetona (o aldehído con hidroboración)',
        '<p>La <b>hidratación</b> catalizada por Hg²⁺ sigue la regla de <b>Markovnikov</b> y da un <b>enol</b> inestable que se <b>tautomeriza</b> a <b>cetona</b>. La <b>hidroboración–oxidación</b> es anti-Markovnikov: un alquino terminal produce un <b>aldehído</b>. Un alquino interno simétrico da una única cetona.</p>'],
      ['Adición de HBr', 'Adición de HX', 'Regioquímica de Markovnikov',
        '<p>El <b>HBr</b> se adiciona al triple enlace: el H va al carbono con más H y el Br al más sustituido, vía <b>catión vinílico</b>. Con un equivalente se obtiene el <b>bromoalqueno</b>; con exceso, el <b>dibromuro geminal</b>. Compara el producto de un alquino terminal e interno.</p>']
    ];
  }
  function place(grp, x) { grp.position.set(x, 0, 0); grp.rotation.z = Math.PI / 2; }
  var def = {
    key: 'alquinos', title: 'Alquinos: estructura y reacciones', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [10, 4, 17], target: [10, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [10, 0, 20], target: [10, 0, 0] }],
    layers: [{ id: 'prod', label: 'Producto', icon: '→' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gS = new T.Group(); gP = new T.Group(); g.add(gS); g.add(gP);
      arrow = new T.Group(); var sh = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 4, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); sh.rotation.z = Math.PI / 2; arrow.add(sh); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.x = 2.2; arrow.add(hd); g.add(arrow);
      for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['prop', 'but1', 'but2'][Math.min(2, Math.floor(f.local * 3))]; S.rx = 'none'; } if (i === 1) { S.sub = f.local < 0.7 ? 'but1' : 'but2'; S.rx = 'nanh2'; } if (i === 2) { S.sub = 'but2'; S.rx = ['lindlar', 'nanh3', 'h2pd'][Math.min(2, Math.floor(f.local * 3))]; } if (i === 3) { S.sub = 'but1'; S.rx = f.local < 0.5 ? 'h2o' : 'hbo'; } if (i === 4) { S.sub = f.local < 0.5 ? 'but1' : 'but2'; S.rx = 'hx'; } }
      var sd = SUB[S.sub], pr = S.rx === 'none' ? null : prod(), kS = S.sub, kP = pr ? S.sub + S.rx : '';
      if (keyS !== kS) { keyS = kS; while (gS.children.length) gS.remove(gS.children[0]); gS.add(ctx.mol(MSim.build(sd.s), { gs: 1.7, ar: 0.8 })); }
      if (keyP !== kP) { keyP = kP; while (gP.children.length) gP.remove(gP.children[0]); if (pr) { var geo = MSim.build(pr[0]); if (S.rx === 'lindlar' && S.sub === 'but2') geo = cisify(geo); gP.add(ctx.mol(geo, { gs: 1.7, ar: 0.8 })); } }
      var showP = !!pr && ctx.layer('prod'); gP.visible = showP; arrow.visible = !!pr; place(gS, 11); place(gP, 23); arrow.position.set(17, 0, 0);
      lab[0].pos(11, 4.2, 0).set(sd.n, 'bl-lead').vis(true);
      lab[1].pos(11, -4, 0).set(i === 0 && !P.manual || S.rx === 'none' ? 'C≡C 1,20 Å · ángulo 180° (sp)' : 'pKa del H≡C–H ≈ 25', 'bl-d').vis(true);
      lab[2].pos(23, 4.2, 0).set(pr ? pr[1] : '', 'bl-pos').vis(showP);
      lab[3].pos(17, 1.4, 0).set(pr ? RX[S.rx].r : '', 'bl-d').vis(!!pr);
      lab[4].pos(23, -4, 0).set(pr && S.rx === 'lindlar' && S.sub === 'but2' ? 'cis (Z)' : (pr && S.rx === 'nanh3' && S.sub === 'but2' ? 'trans (E)' : ''), 'bl-d').vis(showP);
      if (S.rx !== 'none' && !pr) { lab[2].set('No reacciona: no tiene H terminal', 'bl-neg').vis(true).pos(23, 0, 0); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.rx) u.rx.set(S.rx); },
    hud: function () { var pr = S.rx === 'none' ? null : prod(); return { eq: { chip: 'C≡C', name: 'Reacción', body: '<div class="eqline"><small>Sustrato</small>' + SUB[S.sub].n + '</div><div class="eqline"><small>Reactivo</small>' + RX[S.rx].n + '</div><div class="eqline"><small>Producto</small>' + (pr ? pr[1] : (S.rx === 'none' ? '—' : 'no reacciona')) + '</div>' }, legend: [{ label: 'Gris', color: '#56606b', text: 'C' }, { label: 'Blanco', color: '#f2f2f2', text: 'H' }, { label: 'Marrón', color: '#a0522d', text: 'Br' }] }; },
    measures: function () { var pr = S.rx === 'none' ? null : prod(); return [['Sustrato', SUB[S.sub].n], ['Terminal', SUB[S.sub].t ? 'sí' : 'no'], ['Reacción', RX[S.rx].n], ['Producto', pr ? pr[1] : '—']]; },
    ideas: ['Alquino: C sp, 180°.', 'Terminal: pKa ≈ 25.', 'Lindlar cis · Na/NH₃ trans.', 'Hidratación: enol → cetona.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sustrato y reactivo'); el.appendChild(c);
      ui.sub = kit.ui.options({ label: 'Alquino', cols: 3, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); S.sub = v; } });
      ui.rx = kit.ui.options({ label: 'Reacción', cols: 2, value: S.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].n }; }), onChange: function (v) { ctx.goManual(); S.rx = v; } });
      c.appendChild(ui.sub); c.appendChild(ui.rx); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Acidez relativa (pKa)', h: 200, note: 'Menor pKa = más ácido. El H del alquino terminal es mucho más ácido que el de alcanos y alquenos.', draw: function (cx, w, h, col) {
      var d = [['H₂O', 15.7], ['R–C≡C–H', 25], ['NH₃', 38], ['alqueno', 44], ['alcano', 50]], L = 10, B = 26, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * x[1] / 50; cx.fillStyle = x[0] === 'R–C≡C–H' ? '#ff922b' : '#74c0fc'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(String(x[1]).replace('.', ','), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var pr = S.rx === 'none' ? null : prod(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + SUB[S.sub].n + ' + ' + RX[S.rx].n + '</div><table class="calc-table">' + row('Producto', pr ? '<b>' + pr[1] + '</b>' : (S.rx === 'none' ? 'elige una reacción' : 'no reacciona')) + row('Nota', RX[S.rx].note || 'Observa la geometría lineal del triple enlace.') + row('Grado de insaturación', '2 (triple enlace) → ' + (pr ? (/=O|=C/.test(pr[0]) ? '1' : (pr[0].indexOf('#') >= 0 ? '2' : '0')) : '2')) + '</table>'; },
    quiz: [
      { q: 'La geometría alrededor de un carbono de triple enlace es…', options: ['lineal, 180°', 'trigonal plana, 120°', 'tetraédrica, 109,5°', 'angular'], answer: 0, why: 'Hibridación sp.' },
      { q: 'El alquino terminal es ácido porque el carbanión…', options: ['tiene 50 % de carácter s', 'es sp³', 'es aromático', 'tiene carga positiva'], answer: 0, why: 'El par está más cerca del núcleo.' },
      { q: 'La hidrogenación de 2-butino con Lindlar produce…', options: ['(Z)-2-buteno', '(E)-2-buteno', 'butano', 'butanona'], answer: 0, why: 'Adición sin en catalizador envenenado.' },
      { q: 'La hidratación de 1-butino con HgSO₄/H₂SO₄ da…', options: ['butanona', 'butanal', 'butano', '1-butanol'], answer: 0, why: 'Markovnikov: enol → cetona.' },
      { q: 'Na/NH₃(l) con un alquino interno da…', options: ['alqueno trans', 'alqueno cis', 'alcano', 'cetona'], answer: 0, why: 'Anión radical más estable trans.' },
      { q: '¿Cuál NO reacciona con NaNH₂ como ácido?', options: ['2-butino', '1-butino', 'propino', 'acetileno'], answer: 0, why: 'No tiene H terminal.' }
    ],
    help: { intro: 'Elige un alquino y una reacción: a la izquierda ves el sustrato y a la derecha el producto con su geometría. En «Gráficos» compara las acideces.', items: [['Izquierda', 'sustrato.'], ['Derecha', 'producto.']] }
  };
  MSim.create(def);
})();
