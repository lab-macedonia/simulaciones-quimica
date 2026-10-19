/* Reacción de Diels–Alder — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, DEG = Math.PI / 180;
  var DP = {
    eteno: { n: 'Eteno', f: 'CH₂=CH₂', sub: null, lumo: 0.82, tip: 'Dienófilo sin sustituyentes: poco reactivo; requiere calor y presión (≈ 200 °C).' },
    acroleina: { n: 'Propenal (acroleína)', f: 'CH₂=CH–CHO', sub: 'cho', lumo: 0.55, tip: 'El grupo C=O atrae electrones y baja el LUMO del dienófilo: reacciona a temperaturas mucho menores.' },
    acrilonitrilo: { n: 'Propenonitrilo (acrilonitrilo)', f: 'CH₂=CH–C≡N', sub: 'cn', lumo: 0.6, tip: 'El grupo ciano (−M, −I) también baja el LUMO y activa al dienófilo.' }
  };
  var S = { q: 0, phi: 0, dp: 'eteno', mode: 'endo', Tk: 298, fmo: false, si: 0, run: false }, atoms = [], bonds = [], grp = null, lobes = [], key_ = '', lab = {}, arr = [];
  var DH = -168, DS = -148;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function rotY(v, a) { return v.clone().applyAxisAngle(V(0, 1, 0), a); }
  function build() {
    atoms = []; bonds = [];
    var C1 = V(-1.484, 0, 1.111), C2 = V(-0.735, 0, 0), C3 = V(0.735, 0, 0), C4 = V(1.484, 0, 1.111), H = 1.09;
    function add(el, p, kind, grp_) { atoms.push({ el: el, p: p.clone(), kind: kind, g: grp_ || 0 }); return atoms.length - 1; }
    var i1 = add('C', C1, 'd', 1), i2 = add('C', C2, 'd', 0), i3 = add('C', C3, 'd', 0), i4 = add('C', C4, 'd', 4);
    function terminal(Ci, Cn, idx, gp) { var d = Cn.clone().sub(Ci).normalize(); [2, -2].forEach(function (s) { var h = add('H', Ci.clone().addScaledVector(rotY(d, s * Math.PI / 3), H), 'd', gp); bonds.push([idx, h, 1, 1]); }); }
    terminal(C1, C2, i1, 1); terminal(C4, C3, i4, 4);
    [[C2, C1, C3, i2], [C3, C2, C4, i3]].forEach(function (a) { var d = a[1].clone().sub(a[0]).normalize().add(a[2].clone().sub(a[0]).normalize()).negate().normalize(); var h = add('H', a[0].clone().addScaledVector(d, H), 'd', 0); bonds.push([a[3], h, 1, 1]); });
    bonds.push([i1, i2, 2, 1], [i2, i3, 1, 2], [i3, i4, 2, 1]);
    // dienófilo (coordenadas locales respecto de su centro)
    var dp = DP[S.dp], endo = S.mode === 'endo', sg = endo ? -1 : 1;
    var ia = add('C', V(-0.67, 0, 0), 'p', 0), ib = add('C', V(0.67, 0, 0), 'p', 0); bonds.push([ia, ib, 2, 1]);
    [[ia, V(-0.67, 0, 0), V(1, 0, 0)]].forEach(function (a) { [2, -2].forEach(function (s) { var d = rotY(a[2], s * Math.PI / 3), h = add('H', a[1].clone().addScaledVector(d, H), 'p', 0); bonds.push([a[0], h, 1, 1]); }); });
    var bp = V(0.67, 0, 0), dEw = V(0.5, 0, 0.866 * sg), dH = V(0.5, 0, -0.866 * sg);
    if (!dp.sub) { var hb1 = add('H', bp.clone().addScaledVector(dEw, H), 'p', 0), hb2 = add('H', bp.clone().addScaledVector(dH, H), 'p', 0); bonds.push([ib, hb1, 1, 1], [ib, hb2, 1, 1]); }
    else {
      var hb = add('H', bp.clone().addScaledVector(dH, H), 'p', 0); bonds.push([ib, hb, 1, 1]);
      if (dp.sub === 'cho') { var cp = bp.clone().addScaledVector(dEw, 1.48), ic = add('C', cp, 'p', 0); bonds.push([ib, ic, 1, 1]); var back = dEw.clone().negate(), od = rotY(back, 2 * Math.PI / 3 * (sg)), hd = rotY(back, -2 * Math.PI / 3 * (sg)), io = add('O', cp.clone().addScaledVector(od, 1.22), 'p', 0), ih = add('H', cp.clone().addScaledVector(hd, H), 'p', 0); bonds.push([ic, io, 2, 2], [ic, ih, 1, 1]); }
      else { var c1 = bp.clone().addScaledVector(dEw, 1.43), ic2 = add('C', c1, 'p', 0), n1 = add('N', c1.clone().addScaledVector(dEw, 1.16), 'p', 0); bonds.push([ib, ic2, 1, 1], [ic2, n1, 3, 3]); }
    }
    bonds.push([i1, ia, 0, 1], [i4, ib, 0, 1]); S.ia = ia; S.ib = ib; S.i1 = i1; S.i4 = i4;
  }
  function pos(i, q, phi, dy) {
    var a = atoms[i], p = a.p.clone(), e = sm(q);
    if (a.kind === 'd') {
      if (a.g === 4) { var y = p.y * Math.cos(phi) + p.z * Math.sin(phi), z = -p.y * Math.sin(phi) + p.z * Math.cos(phi); p.y = y; p.z = z; }
      if (a.g === 1 || (a.g === 4)) p.y += 0.25 * e * Math.cos(phi / 2 > 1.4 ? 0 : 0.0 + 0) * (phi < 0.9 ? 1 : 0);
      return p;
    }
    var dx = (a.p.x < 0 ? -0.1 : 0.1) * e; return V(p.x + dx, dy, p.z + 1.111);
  }
  function rebuild(ctx) {
    if (grp) ctx.scene.remove(grp); grp = new T.Group(); build(); var E = MSim.EL;
    atoms.forEach(function (a) { var d = E[a.el] || [0xcccccc, 1], m = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshStandardMaterial({ color: d[0], roughness: 0.4 })); m.scale.setScalar(d[1] * 0.42); grp.add(m); a.m = m; });
    var cg = new T.CylinderGeometry(1, 1, 1, 8, 1, true);
    bonds.forEach(function (b) { b.cs = []; for (var k = 0; k < 2; k++) { var m = new T.Mesh(cg, new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5, transparent: true })); grp.add(m); b.cs.push(m); } });
    lobes = []; var sg = new T.SphereGeometry(1, 16, 12); [S.i1, S.i4, 1, 2, S.ia, S.ib].forEach(function (i) { for (var s = 0; s < 2; s++) { var m = new T.Mesh(sg, new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false })); m.userData = { i: i, s: s }; grp.add(m); lobes.push(m); } });
    ctx.scene.add(grp); key_ = S.dp + '|' + S.mode;
  }
  var HOMO = { 0: 0.6, 1: 0.37, 2: -0.37, 3: -0.6 }, LUMO = {};
  function stages() {
    return [
      ['Dieno y dienófilo', 'Reactivos', 'El dieno debe estar en conformación s-cis para reaccionar',
        '<p>La <b>reacción de Diels–Alder</b> forma un anillo de seis miembros a partir de un <b>dieno conjugado</b> (4 e⁻ π) y un <b>dienófilo</b> (2 e⁻ π): una cicloadición <b>[4+2]</b>. El dieno solo reacciona en la conformación <b>s-cis</b> (los dos extremos del dieno enfrentados, a ≈ 3 Å); en la <b>s-trans</b>, más estable, los extremos quedan lejos. El giro alrededor del enlace C2–C3 (≈ 16 kJ/mol de barrera) se hace rápido a temperatura ambiente.</p>'],
      ['Mecanismo concertado', 'Mecanismo', 'Tres pares de electrones se mueven a la vez: 2 enlaces σ nuevos y un π nuevo',
        '<p>La reacción es <b>concertada</b> y <b>sincrónica</b>: en un único estado de transición cíclico se forman los dos enlaces σ C–C, el doble enlace C1=C2 y el del dienófilo se vuelven simples, y aparece un <b>nuevo C=C entre C2 y C3</b>. La aproximación es <b>suprafacial</b>: el dienófilo se acerca por una cara del dieno. Se rompen 2 π y se forman 2 σ: <b>ΔH ≈ −168 kJ/mol</b> (butadieno + eteno → ciclohexeno).</p>'],
      ['Orbitales frontera', 'Orbitales', 'HOMO del dieno + LUMO del dienófilo: la fase coincide en los dos extremos',
        '<p>La reacción está permitida por simetría orbital: el <b>HOMO del dieno (ψ₂)</b> y el <b>LUMO del dienófilo (π*)</b> tienen la misma fase en los dos pares de átomos que se enlazan (C1···Ca y C4···Cb): <b>solapamiento constructivo en ambos extremos</b>. Los lóbulos azules y rojos indican las fases. Sería también posible el solapamiento HOMO(dienófilo)–LUMO(dieno), pero con una brecha de energía mayor.</p>'],
      ['Sustituyentes y reactividad', 'Sustituyentes', 'Un dienófilo con grupos atractores reacciona mucho más rápido',
        '<p>En la Diels–Alder de <b>demanda normal</b> la interacción dominante es HOMO(dieno)–LUMO(dienófilo). Un grupo <b>atractor de electrones</b> en el dienófilo (C=O, C≡N, NO₂) <b>baja el LUMO</b> y reduce la brecha, y un grupo <b>donador</b> en el dieno (OR, alquilo) <b>sube el HOMO</b>. Compara en «Gráficos»: el eteno apenas reacciona; con propenal o propenonitrilo la reacción es mucho más fácil.</p>'],
      ['Regla endo', 'Endo / exo', 'El sustituyente del dienófilo suele quedar bajo el dieno (endo)',
        '<p>Si el sustituyente del dienófilo se coloca <b>debajo del dieno</b> (<b>endo</b>) o <b>alejado</b> (<b>exo</b>), se obtienen estereoisómeros distintos. En la mayoría de los casos el producto cinético es el <b>endo</b>, por <b>interacciones orbitales secundarias</b> entre el π del sustituyente (C=O) y los carbonos C2 y C3 del dieno. El exo suele ser más estable termodinámicamente por menor impedimento estérico.</p>'],
      ['Termodinámica y retro-Diels–Alder', 'ΔG(T)', 'Favorable a baja T; a muy alta T se invierte (retro-Diels–Alder)',
        '<p>Con <b>ΔH ≈ −168 kJ/mol</b> y <b>ΔS ≈ −148 J/(mol·K)</b> (se pierde libertad al unir dos moléculas en una), <b>ΔG = ΔH − TΔS</b> es muy negativo a temperatura ambiente. Pero a temperaturas altas el término −TΔS pierde peso hasta hacer ΔG = 0 (≈ 1135 K en estado estándar): la <b>retro-Diels–Alder</b> se vuelve favorable y es una forma de generar dienos (p. ej. craqueo de ciclopentadieno desde su dímero).</p>']
    ];
  }
  var def = {
    key: 'diels-alder', title: 'Reacción de Diels–Alder', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#60a5fa', light: '#1d4ed8' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 5, 9], target: [0, 1.2, 1]}, { id: 'frontal', label: 'Frontal', pos: [0, 2, 12], target: [0, 1.2, 1] }, { id: 'sup', label: 'Superior', pos: [0, 13, 3], target: [0, 1, 1] }, { id: 'lado', label: 'Lateral', pos: [12, 2, 1], target: [0, 1.2, 1] }],
    layers: [{ id: 'orb', label: 'Orbitales p / frontera', icon: '☁' }, { id: 'arrows', label: 'Flechas', icon: '↷' }],
    build: function (ctx) { ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); for (var i = 0; i < 3; i++) arr.push(MSim.arrow(ctx, 0xff7a3d)); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, l = f.local; S.si = i;
        if (S._st !== i) { S._st = i; S.dp = i === 4 ? 'acroleina' : 'eteno'; S.mode = 'endo'; S.fmo = i === 2; }
        if (i === 0) { S.phi = 180 * DEG * (1 - sm(l / 0.6)); S.q = 0; }
        else if (i === 1) { S.phi = 0; S.q = l; }
        else if (i === 2) { S.phi = 0; S.q = 0.2; }
        else if (i === 3) { S.phi = 0; S.q = 0.2 + 0.8 * l; var ks = ['eteno', 'acroleina', 'acrilonitrilo'], k = ks[Math.min(2, Math.floor(l * 3))]; if (S.dp !== k) S.dp = k; }
        else if (i === 4) { S.phi = 0; S.q = 0.25 + 0.75 * (l * 2 % 1); var m = l < 0.5 ? 'endo' : 'exo'; if (S.mode !== m) S.mode = m; }
        else { S.phi = 0; S.q = 1; S.Tk = 300 + 900 * l; }
      } else if (S.run) { S.q += dt / 6; if (S.q >= 1) { S.q = 1; S.run = false; } }
      if (S.dp + '|' + S.mode !== key_) rebuild(ctx);
      var q = S.q, e = sm(q), dy = 3.6 - 1.85 * e, phi = S.phi;
      atoms.forEach(function (a, i) { a.m.position.copy(pos(i, q, phi, dy)); });
      var P = function (i) { return atoms[i].m.position; };
      bonds.forEach(function (b) {
        var p = P(b[0]), r = P(b[1]), d = r.clone().sub(p), L = d.length(), o = b[2] + (b[3] - b[2]) * e, forming = b[2] === 0; if (L < 1e-6) return;
        var perp = new T.Vector3().crossVectors(d, V(0, 0, 1)); if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0); perp.normalize().multiplyScalar(0.09);
        b.cs.forEach(function (c, k) {
          var w = o >= 3 ? 1 : (k === 0 ? Math.min(1, o) : (k === 1 ? Math.max(0, Math.min(1, o - 1)) : 0)); var off = o > 1.01 ? (k ? 1 : -1) * perp.length() * 0.9 : 0; c.visible = w > 0.02; c.material.opacity = forming ? 0.25 + 0.7 * e : w; c.scale.set(forming ? 0.03 + 0.03 * e : 0.05, L, forming ? 0.03 + 0.03 * e : 0.05);
          c.position.copy(p).add(r).multiplyScalar(0.5).addScaledVector(perp.clone().normalize(), off); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
        });
      });
      var orb = ctx.layer('orb');
      lobes.forEach(function (m) {
        var u = m.userData, i = u.i, co = S.fmo || S.si === 2 ? null : null, show = orb && (S.si === 2 || S.fmo || ctx.P.manual && S.fmo), sgn, mag;
        if (!show) { m.visible = false; return; }
        var dn = (i === S.i1) ? 0.6 : (i === 1 ? 0.37 : (i === 2 ? -0.37 : (i === S.i4 ? -0.6 : 0)));
        if (i === S.i1) { sgn = 1; mag = 0.6; } else if (i === S.i4) { sgn = -1; mag = 0.6; } else if (i === 1) { sgn = 1; mag = 0.37; } else if (i === 2) { sgn = -1; mag = 0.37; } else if (i === S.ia) { sgn = 1; mag = 0.71; } else { sgn = -1; mag = 0.71; }
        var up = (u.s === 0) === (i === S.ia || i === S.ib ? false : true); var s2 = sgn * (u.s ? -1 : 1); var base = P(i); var h = 0.35 + 0.6 * mag;
        m.visible = true; m.material.color.setHex(s2 > 0 ? 0x4dabf7 : 0xff6b5e); m.scale.set(0.42 * (0.4 + mag), 0.55 * (0.4 + mag), 0.42 * (0.4 + mag)); m.position.set(base.x, base.y + (u.s ? -1 : 1) * h, base.z);
      });
      var il = ctx.layer('arrows'), c1 = P(S.i1), c4 = P(S.i4), ca = P(S.ia), cb = P(S.ib), c2 = P(1), c3 = P(2);
      arr.forEach(function (a) { a.group.visible = false; });
      if (S.si === 1 && il && q < 0.6) { arr[0].set(c2.clone().lerp(c1, 0.5).add(V(0, 0.05, 0)), ca.clone().add(V(0, -0.2, 0)), V(-0.3, 0.8, 0.3), true); arr[1].set(c3.clone().lerp(c2, 0.5), c2.clone().lerp(c1, 0.55).add(V(0, 0.1, 0)), V(0, 0.5, -0.4), q > 0.05); arr[2].set(ca.clone().lerp(cb, 0.5), cb.clone().add(V(0, -0.2, 0)).lerp(c4, 0.8), V(0.3, 0.8, 0.3), true); }
      arr.forEach(function (a) { a.tick(ctx.now); });
      var cis = phi < 40 * DEG, dd = DP[S.dp];
      lab.t.pos(0, 6.2, 1.1).set(S.si === 3 ? dd.n + ' (' + dd.f + ')' : 'dieno + ' + dd.n.toLowerCase(), 'bl-lead').vis(true);
      lab.a.pos(0, -1.8, 1.1).set(phi > 1 * DEG && S.si === 0 || ctx.P.manual ? 'dieno: ' + (cis ? 's-cis (puede reaccionar)' : 's-trans (no reacciona)') + ' · φ = ' + fmt(phi / DEG, 0) + '°' : 'butadieno s-cis', cis ? 'bl-neg' : 'bl-warn').vis(true);
      lab.b.pos(0, -2.9, 1.1).set(q < 0.15 ? 'reactivos' : (q < 0.85 ? 'estado de transición cíclico ≈ ' + fmt(q * 100, 0) + ' %' : 'ciclohexeno (producto)'), 'bl-d').vis(true);
      lab.c.pos(0, dy + 1.5, 1.1).set(dd.n.split(' ')[0] + (S.mode === 'endo' && dd.sub ? ' · endo' : (dd.sub ? ' · exo' : '')), 'bl-d').vis(true); lab.d.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.pg && u.pg.set(S.q); u.ph && u.ph.set(Math.round(S.phi / DEG)); } },
    hud: function () { var d = DP[S.dp]; return { eq: { chip: '[4+2]', name: 'butadieno + ' + d.n.toLowerCase(), body: '<div class="eqline"><small>Dienófilo</small>' + d.f + '</div><div class="eqline"><small>Orientación</small>' + (d.sub ? S.mode : '—') + '</div><div class="eqline"><small>Avance</small>' + fmt(S.q * 100, 0) + ' %</div><div class="eqline"><small>ΔH (eteno + butadieno)</small>≈ −168 kJ/mol</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'fase + del orbital p' }, { label: 'Rojo', color: '#ff6b5e', text: 'fase −' }, { label: 'Flecha', color: '#ff7a3d', arrow: true, text: 'par de e⁻' }] }; },
    measures: function () { var d = DP[S.dp], dG = DH - S.Tk * DS / 1000; return [['Dienófilo', d.n], ['Conformación', S.phi < 40 * DEG ? 's-cis' : 's-trans'], ['Dihedro C1–C2–C3–C4', fmt(S.phi / DEG, 0) + '°'], ['Avance', fmt(S.q * 100, 0) + ' %'], ['Orientación', d.sub ? S.mode : '—'], ['T', fmt(S.Tk, 0) + ' K'], ['ΔG(T)', f1(dG) + ' kJ/mol']]; },
    ideas: ['<b>[4+2]</b>: dieno (4 e⁻) + dienófilo (2 e⁻) → ciclohexeno; concertada y suprafacial.', 'El dieno debe estar en <b>s-cis</b>.', 'Demanda normal: <b>EWG en el dienófilo</b> y EDG en el dieno aceleran la reacción (menor brecha HOMO–LUMO).', '<b>Regla endo</b>: producto cinético por interacciones orbitales secundarias.', 'ΔH ≈ −168 kJ/mol, ΔS &lt; 0: favorable a baja T; la retro-Diels–Alder aparece a T alta.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Reacción'); el.appendChild(c);
      ui.dp = kit.ui.options({ label: 'Dienófilo', cols: 3, value: S.dp, options: [{ v: 'eteno', label: 'Eteno', sub: 'sin EWG' }, { v: 'acroleina', label: 'Propenal', sub: 'CHO' }, { v: 'acrilonitrilo', label: 'Acrilonitrilo', sub: 'C≡N' }], onChange: function (v) { ctx.goManual(); S.dp = v; } }); c.appendChild(ui.dp);
      ui.md = kit.ui.options({ label: 'Orientación', cols: 2, value: S.mode, options: [{ v: 'endo', label: 'Endo', sub: 'sustituyente bajo el dieno' }, { v: 'exo', label: 'Exo', sub: 'sustituyente alejado' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.md);
      ui.pg = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.q = v; } });
      ui.ph = kit.ui.slider({ label: 'Dihedro del dieno φ', min: 0, max: 180, step: 1, value: S.phi / DEG, format: function (v) { return v + '° ' + (v < 40 ? '(s-cis)' : (v > 140 ? '(s-trans)' : '')); }, onInput: function (v) { ctx.goManual(); S.phi = v * DEG; } });
      ui.tk = kit.ui.slider({ label: 'Temperatura', min: 250, max: 1400, step: 10, value: S.Tk, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.Tk = v; } }); c.appendChild(kit.ui.sliders([ui.pg, ui.ph, ui.tk]));
      c.appendChild(ctx.btnRow([{ t: '▶ Reaccionar', primary: true, fn: function () { ctx.goManual(); S.phi = 0; S.q = 0; S.run = true; } }, { t: 'Orbitales frontera', fn: function () { ctx.goManual(); S.fmo = !S.fmo; S.si = S.fmo ? 2 : 1; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card('Dienófilo'); el.appendChild(t); var p = document.createElement('p'); p.className = 'muted small'; t.appendChild(p); ui.tip = p; ui.refresh = function () { if (ui._k !== S.dp) { ui._k = S.dp; p.innerHTML = DP[S.dp].tip; } };
    },
    graphs: [
      { title: 'Orbitales frontera (cualitativo)', h: 240, note: 'Un grupo atractor baja el LUMO del dienófilo y acorta la brecha HOMO(dieno)–LUMO(dienófilo): reacción más rápida.', draw: function (cx, w, h, col) {
        var d = DP[S.dp], ly = function (v) { return 14 + (h - 38) * (1 - v); }, x1 = w * 0.1, x2 = w * 0.58, ww = w * 0.3; cx.font = '10.5px system-ui'; cx.lineWidth = 2.6;
        var lv = [[x1, 0.3, 'HOMO', '#4dabf7'], [x1, 0.62, 'LUMO', '#4dabf7'], [x2, 0.18, 'HOMO', '#ff9f43'], [x2, d.lumo, 'LUMO', '#ff9f43']];
        lv.forEach(function (l) { cx.strokeStyle = l[3]; cx.beginPath(); cx.moveTo(l[0], ly(l[1])); cx.lineTo(l[0] + ww, ly(l[1])); cx.stroke(); cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText(l[2], l[0] + ww + 3, ly(l[1]) + 3); }); cx.lineWidth = 1;
        cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText('Dieno', x1 + ww / 2, h - 20); cx.fillText('Dienófilo: ' + d.n.split(' ')[0], x2 + ww / 2, h - 20);
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(x1 + ww, ly(0.3)); cx.lineTo(x2, ly(d.lumo)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#ff6b3d'; cx.fillText('brecha ' + (d.lumo > 0.7 ? 'grande' : 'menor'), (x1 + ww + x2) / 2, (ly(0.3) + ly(d.lumo)) / 2 - 6);
        cx.fillStyle = col.muted; cx.save(); cx.translate(10, h / 2); cx.rotate(-Math.PI / 2); cx.fillText('energía →', 0, 0); cx.restore();
      } },
      { title: 'ΔG(T) = ΔH − TΔS', h: 210, note: 'ΔH ≈ −168 kJ/mol, ΔS ≈ −148 J/(mol·K) (butadieno + eteno → ciclohexeno, estado estándar). ΔG = 0 en ≈ 1135 K.', draw: function (cx, w, h, col) {
        var L = 44, R = 12, Tp = 12, B = 30, pw = w - L - R, ph = h - Tp - B, tmax = 1400, lo = -180, hi = 40, sx = function (t) { return L + pw * t / tmax; }, sy = function (g) { return Tp + ph - ph * (g - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var g = lo + (hi - lo) * j / 4, y = sy(g); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(g, 0), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q = 0; q <= 1400; q += 400) cx.fillText(String(q), sx(q), h - B + 13); cx.fillText('T (K)  ·  ΔG (kJ/mol)', L + pw / 2, h - 4);
        cx.strokeStyle = '#60a5fa'; cx.lineWidth = 2.6; cx.beginPath(); for (var i = 0; i <= 80; i++) { var t = tmax * i / 80, gg = DH - t * DS / 1000, X = sx(t), Y = sy(gg); if (i === 0) cx.moveTo(X, Y); else cx.lineTo(X, Y); } cx.stroke(); cx.lineWidth = 1;
        var gT = DH - S.Tk * DS / 1000; cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.Tk), sy(gT), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, T0 = S.Tk, dG = DH - T0 * DS / 1000, Kq = Math.exp(-dG * 1000 / (8.314 * T0)), Tc = DH * 1000 / DS;
      return '<div class="card-kicker">Butadieno + eteno → ciclohexeno</div><div class="calc-step">1 · Entalpía (de las entalpías de formación)</div><table class="calc-table">' + row('ΔH°', 'ΔH°f(ciclohexeno) − [ΔH°f(butadieno) + ΔH°f(eteno)] = −5,0 − (110,0 + 52,5) = <b>−167,5 kJ/mol</b>') + row('Enlaces', 'se rompen 2 π; se forman 2 σ y 1 π nuevo') + '</table>' +
        '<div class="calc-step">2 · Energía libre a T = ' + fmt(T0, 0) + ' K</div><table class="calc-table">' + row('ΔG', 'ΔH − TΔS = −168 − ' + fmt(T0, 0) + ' × (−0,148) = <b>' + f1(dG) + ' kJ/mol</b>') + row('K', 'exp(−ΔG/RT) = ' + MSim.sci(Kq, 1)) + row('T límite (ΔG = 0)', '≈ ' + fmt(Tc, 0) + ' K (' + fmt(Tc - 273.15, 0) + ' °C)') + row('Sentido', dG < 0 ? '<span class="calc-ok">favorece el ciclohexeno</span>' : '<span class="calc-hi">favorece la retro-Diels–Alder</span>') + '</table><p class="muted small">Barrera experimental de la cicloadición ≈ 115 kJ/mol (butadieno + eteno): por eso se necesita calentar si el dienófilo no está activado.</p>';
    },
    quiz: [
      { q: '¿Qué conformación debe adoptar el dieno para reaccionar?', options: ['s-cis', 's-trans', 'Cualquiera', 'Solo anti'], answer: 0, why: 'Solo en s-cis los dos extremos del dieno se enfrentan al dienófilo.' },
      { q: 'La reacción de Diels–Alder es una cicloadición…', options: ['[4+2], concertada', '[2+2], por pasos', '[4+4], radicalaria', 'SN2'], answer: 0, why: 'Participan 4 e⁻ π del dieno y 2 del dienófilo en un único estado de transición cíclico.' },
      { q: '¿Qué efecto tiene un grupo atractor de electrones (C=O, C≡N) en el dienófilo?', options: ['Baja el LUMO y acelera la reacción', 'Sube el HOMO y la frena', 'No afecta', 'Cambia el mecanismo a radicalario'], answer: 0, why: 'Se reduce la brecha HOMO(dieno)–LUMO(dienófilo).' },
      { q: '¿Qué orbitales controlan la reacción de demanda normal?', options: ['HOMO del dieno y LUMO del dienófilo', 'LUMO del dieno y LUMO del dienófilo', 'HOMO del dieno y HOMO del dienófilo', 'Los orbitales σ'], answer: 0, why: 'Los dos extremos tienen solapamiento de fase constructivo entre ambos orbitales frontera.' },
      { q: '¿Cuál es el producto de butadieno + eteno?', options: ['Ciclohexeno', 'Ciclohexano', 'Benceno', 'Hexa-1,5-dieno'], answer: 0, why: 'Se forma un anillo de seis miembros con un único doble enlace (entre C2 y C3 del dieno).' },
      { q: 'La regla endo indica que el producto cinético tiene el sustituyente…', options: ['bajo el dieno, por interacciones orbitales secundarias', 'lejos del dieno por impedimento estérico', 'siempre en posición axial', 'en el carbono central'], answer: 0, why: 'En el endo el π del sustituyente interacciona con C2 y C3 del dieno.' },
      { q: '¿Por qué ΔS < 0 en la Diels–Alder?', options: ['Dos moléculas se unen en una: se pierde libertad de movimiento', 'Se forma un gas', 'Se rompen enlaces σ', 'Aumenta el desorden'], answer: 0, why: 'La reducción del número de partículas disminuye la entropía.' },
      { q: 'Aumentar mucho la temperatura puede favorecer la reacción inversa porque…', options: ['−TΔS se hace más positivo y ΔG tiende a 0', 'ΔH cambia de signo', 'se rompe el catalizador', 'sube la concentración'], answer: 0, why: 'ΔG = ΔH − TΔS con ΔS negativa: a T alta, ΔG sube hasta hacerse positivo.' }
    ],
    help: { intro: 'Mueve el avance, el dihedro del dieno y la orientación en «Lab», o sigue la lección. Activa «Orbitales frontera» para ver las fases del HOMO del dieno y el LUMO del dienófilo.', items: [['φ del dieno', '0° s-cis (reacciona) · 180° s-trans.'], ['Endo / exo', 'posición del sustituyente del dienófilo respecto del dieno.'], ['Lóbulos', 'azul fase +, rojo fase −.'], ['ΔG(T)', 'temperatura y retro-Diels–Alder.']] }
  };
  def.sync = function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.pg && u.pg.set(S.q); u.ph && u.ph.set(Math.round(S.phi / DEG)); u.tk && u.tk.set(Math.round(S.Tk)); } if (u.refresh) u.refresh(); };
  MSim.create(def);
})();
