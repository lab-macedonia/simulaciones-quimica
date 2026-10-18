/* Disoluciones y propiedades coligativas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
/* Núcleo común de los simuladores 3D · Laboratorio MACEDONIA (UMCE) — construido sobre ../../kit/simkit.js */
(function () {
  "use strict";
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
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast("The lesson controls the simulation"); if (def.onStage) def.onStage(kit.state.stage, ctx); };
    ctx.layer = function (id) { return kit.layer(id); };
    ctx.view = function (id) { var v = (def.views || []).filter(function (x) { return x.id === id; })[0]; if (v) ctx.P.camGoal = { pos: new T.Vector3(v.pos[0], v.pos[1], v.pos[2]), target: new T.Vector3(v.target[0], v.target[1], v.target[2]) }; };
    ctx.btnRow = function (list) {
      var r = document.createElement('div'); r.className = 'row';
      list.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn' + (b.primary ? " primary" : ''); e.textContent = b.t; e.addEventListener('click', b.fn); if (b.id) ui(b.id, e); r.appendChild(e); });
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
    if (def.lab) tabs.push({ id: 'lab', label: "Lab", build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
    if (def.graphs) tabs.push({ id: 'graf', label: "Graphs", build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || "Calculation", build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ("Review questions (" + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || "3D Simulator", accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ("3D viewer · " + def.title),
      stages: STAGES, mainTabLabel: "Guide", tabs: tabs, measuresTitle: "Live measurements", measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: "Labels", icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: "Free", pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
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
      help: def.help || { intro: "Follow the lesson with the player or explore freely in the “Lab” tab. With “Back to the lesson” the script takes control again.", items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();

(function () {
  var Rg = 0.08206;
  var SOLV = { agua: { name: "water", f: 'H₂O', M: 18.015, Kb: 0.512, Kf: 1.86, Tb: 100, Tf: 0, ant: [8.07131, 1730.63, 233.426], col: 0x6bb8ff, rho: 1.0 },
               benceno: { name: "benzene", f: 'C₆H₆', M: 78.11, Kb: 2.53, Kf: 5.12, Tb: 80.1, Tf: 5.5, ant: [6.90565, 1211.033, 220.79], col: 0xf2d17a, rho: 0.876 } };
  var SOL = {
    glu: { sv: 'agua', f: 'C₆H₁₂O₆', name: 'glucosa', M: 180.16, i: 1, maxm: 3, parts: [['glucosa', 0xffa94d, 0.26]], per: 1 },
    nacl: { sv: 'agua', f: 'NaCl', name: 'NaCl', M: 58.44, i: 2, maxm: 3, parts: [['Na⁺', 0xab5cf2, 0.19], ['Cl⁻', 0x3ddc5a, 0.24]], per: 1 },
    cacl2: { sv: 'agua', f: "CaCl₂", name: "CaCl₂", M: 110.98, i: 3, maxm: 2, parts: [['Ca²⁺', 0x80d8ff, 0.2], ['Cl⁻', 0x3ddc5a, 0.24]], per: 1, mult: [1, 2] },
    naf: { sv: 'benceno', f: 'C₁₀H₈', name: "naphthalene", M: 128.17, i: 1, maxm: 3, parts: [['C₁₀H₈', 0xb084ff, 0.3]], per: 1 }
  };
  var S = { sol: 'nacl', m: 1, T: 25, mode: 'vasos', fz: false };
  var BX = [-6.2, 6.2], HL = 3.0, RAD = 2.2, hasBuilt = false;
  var beak = [], U = {}, lab = {}, bubbles = [], hL = 4, hR = 4;
  function so() { return SOL[S.sol]; }
  function sv() { return SOLV[so().sv]; }
  function P0(T) { var a = sv().ant; return Math.pow(10, a[0] - a[1] / (a[2] + T)); }          // mmHg
  function nSolv() { return 1000 / sv().M; }
  function xSolv() { return nSolv() / (nSolv() + so().i * S.m); }
  function dTb() { return so().i * sv().Kb * S.m; }
  function dTf() { return so().i * sv().Kf * S.m; }
  function Tb(sol) { return sv().Tb + (sol ? dTb() : 0); }
  function Tf(sol) { return sv().Tf - (sol ? dTf() : 0); }
  function pi() { return so().i * S.m * Rg * (S.T + 273.15); }
  function state(sol) { return S.T <= Tf(sol) ? 'sólido' : (S.T >= Tb(sol) ? 'ebullición' : "liquid"); }
  var fmt = SimKit.fmt, f2 = function (x) { return fmt(x, 2); };
  function pctMass() { var w = S.m * so().M; return w / (1000 + w) * 100; }

  var STATES = [{ sol: 'nacl', m: 1, T: 25 }, { sol: 'nacl', m: 3, T: 80 }, { sol: 'nacl', m: 1, T: 25 }, { sol: 'nacl', m: 1, T: 25 }, { sol: 'glu', m: 0.5, T: 25 }, { sol: 'glu', m: 1, T: -2.8 }];
  function stages(ctx) {
    var save = {}; for (var k in S) save[k] = S[k]; var out = [];
    for (var q = 0; q < 6; q++) { for (var kk in STATES[q]) S[kk] = STATES[q][kk]; out.push(stagesAll()[q]); }
    for (var z in save) S[z] = save[z]; return out;
  }
  function stagesAll() {
    var o = so(), v = sv(), i = o.i;
    return [
      ["Concentration", "Concentration", "Molality, mole fraction and % m/m describe the solution",
        "<p>A solute dissolved in 1 kg of solvent: the <b>molality</b> m = mol of solute / kg of solvent (it does not depend on temperature). With <b>" + f2(S.m) + " mol/kg of " + o.f + '</b>: <b>% m/m = ' + f2(pctMass()) + " %</b>, mole fraction of solute <b>x = " + fmt(1 - xSolv(), 4) + "</b> (if it dissociates, i·m particles).</p><p><b>Colligative properties</b> depend on the <b>number of particles</b> of solute, not on its nature.</p>"],
      ["Vapor pressure", "Raoult", "Raoult's law: P = x<sub>solvent</sub> · P°",
        "<p>The solute particles occupy part of the surface and make it harder for the solvent to escape: the vapor pressure <b>drops</b>. For " + o.f + ' ' + f2(S.m) + " m in " + v.name + ": x<sub>solvent</sub> = <b>" + fmt(xSolv(), 4) + "</b>, P = x·P° (bars next to the flasks).</p>"],
      ["Boiling", "Boiling", "Boiling-point elevation: ΔT<sub>b</sub> = i · K<sub>b</sub> · m",
        "<p>The solution needs a higher temperature to match the external pressure: <b>ΔT<sub>b</sub> = " + i + ' × ' + v.Kb + ' × ' + f2(S.m) + ' = ' + f2(dTb()) + " °C</b>. Pure solvent boils at " + fmt(v.Tb, 1) + " °C; the solution at <b>" + fmt(Tb(true), 2) + " °C</b>. Watch at what T bubbles appear in each flask.</p>"],
      ["Freezing", "Freezing", "Freezing-point depression: ΔT<sub>f</sub> = i · K<sub>f</sub> · m",
        "<p>The solute hinders the formation of the solid: <b>ΔT<sub>f</sub> = " + i + ' × ' + v.Kf + ' × ' + f2(S.m) + ' = ' + f2(dTf()) + " °C</b>. The pure solvent solidifies at " + fmt(v.Tf, 1) + " °C and the solution at <b>" + fmt(Tf(true), 2) + " °C</b>: that is why salt melts ice on streets.</p>"],
      ["Osmosis", "Osmosis", "Osmotic pressure: π = i · M · R · T",
        "<p>A semipermeable membrane lets the solvent through but not the solute: water flows toward the concentrated side until the liquid column balances the pressure. π = " + i + ' × ' + f2(S.m) + ' × 0,08206 × ' + fmt(S.T + 273.15, 0) + ' = <b>' + f2(pi()) + " atm</b> (M ≈ m in dilute solution).</p>"],
      ["van 't Hoff factor", "van 't Hoff i", "An electrolyte contributes more particles: i = 1, 2, 3…",
        "<p>For the same molality, glucose (i = 1), NaCl (i = 2) and CaCl₂ (i = 3) produce effects in the ratio 1 : 2 : 3: ΔT<sub>f</sub> = 1.86 · i · m. In real solutions i is somewhat lower than the ideal because of attraction between ions.</p><p>At −2.8 °C: glucose (ΔT<sub>f</sub> = 1.86 °C) is <b>frozen</b>; NaCl and CaCl₂ remain liquid.</p>"]
    ];
  }

  function mkBeaker(ctx, k) {
    var T = ctx.T, s = ctx.scene, g = new T.Group(); g.position.x = BX[k]; s.add(g);
    var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.14, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
    var glass = new T.Mesh(new T.CylinderGeometry(RAD, RAD, 5.6, 36, 1, true), gm); glass.position.y = 2.8; g.add(glass);
    var lid = new T.Mesh(new T.CylinderGeometry(RAD + 0.1, RAD + 0.1, 0.18, 36), new T.MeshStandardMaterial({ color: 0x59667a })); lid.position.y = 5.7; g.add(lid);
    var base = new T.Mesh(new T.CylinderGeometry(RAD, RAD, 0.2, 36), new T.MeshStandardMaterial({ color: 0xaecdee, transparent: true, opacity: 0.6 })); base.position.y = 0.1; g.add(base);
    var lm = new T.MeshStandardMaterial({ color: 0x6bb8ff, transparent: true, opacity: 0.45, roughness: 0.2 }), liq = new T.Mesh(new T.CylinderGeometry(RAD * 0.97, RAD * 0.97, HL, 36), lm); liq.position.y = 0.2 + HL / 2; g.add(liq);
    var sg = new T.SphereGeometry(1, 10, 8), B = { g: g, lm: lm, liq: liq, v: [], k: k, sol: [], ph: 0 };
    var smat = new T.MeshStandardMaterial({ color: 0xbfe2ff, roughness: 0.5 }); B.smat = smat;
    B.solv = new T.InstancedMesh(sg, smat, 130); B.solv.count = 0; B.solv.frustumCulled = false; g.add(B.solv);
    B.vap = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xdff1ff, roughness: 0.4 }), 45); B.vap.count = 0; B.vap.frustumCulled = false; g.add(B.vap);
    B.sd = []; for (var q = 0; q < 2; q++) { var im = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), 70); im.count = 0; im.frustumCulled = false; g.add(im); B.sd.push(im); }
    B.bar = new T.Mesh(new T.BoxGeometry(0.7, 1, 0.7), new T.MeshStandardMaterial({ color: k ? 0xff7a5c : 0x5cb3ff })); B.bar.position.set(k ? -3.6 : 3.6, 0, 0); g.add(B.bar);
    B.barBase = new T.Mesh(new T.BoxGeometry(1.1, 0.12, 1.1), new T.MeshStandardMaterial({ color: 0x3a4656 })); B.barBase.position.set(k ? -3.6 : 3.6, 0, 0); g.add(B.barBase);
    // posiciones aleatorias persistentes
    function rp() { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (RAD - 0.35); return { x: Math.cos(a) * r, y: 0.35 + Math.random() * (HL - 0.4), z: Math.sin(a) * r, vx: Math.random() - .5, vy: Math.random() - .5, vz: Math.random() - .5 }; }
    B.sp = []; for (q = 0; q < 130; q++) B.sp.push(rp()); B.sdp = [[], []]; for (var w = 0; w < 2; w++) for (q = 0; q < 70; q++) B.sdp[w].push(rp());
    B.vp = []; for (q = 0; q < 45; q++) { var p = rp(); p.y = 0; B.vp.push(p); }
    B.rp = rp; return B;
  }
  var dummy;
  function stepPart(arr, n, sp, dt, ymin, ymax, R) {
    for (var q = 0; q < n; q++) { var p = arr[q]; p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.z += p.vz * sp * dt;
      var rr = Math.sqrt(p.x * p.x + p.z * p.z); if (rr > R) { p.x *= R / rr * 0.98; p.z *= R / rr * 0.98; p.vx *= -1; p.vz *= -1; }
      if (p.y < ymin) { p.y = ymin; p.vy = Math.abs(p.vy); } if (p.y > ymax) { p.y = ymax; p.vy = -Math.abs(p.vy); } }
  }
  function setInst(im, arr, n, r, off) { dummy = dummy || new THREE.Object3D(); im.count = n; for (var q = 0; q < n; q++) { var p = arr[q]; dummy.position.set(p.x, p.y + (off || 0), p.z); dummy.scale.setScalar(r); dummy.updateMatrix(); im.setMatrixAt(q, dummy.matrix); } im.instanceMatrix.needsUpdate = true; }

  function updBeaker(ctx, B, sol, dt, t) {
    var o = so(), v = sv(), st = state(sol), frozen = st === 'sólido', boil = st === 'ebullición';
    var np = Math.round(Math.min(40, S.m * 8)); // fórmulas
    var sp = frozen ? 0.12 : 0.9 + 0.5 * clamp((S.T - v.Tf) / 100, 0, 1) + (boil ? 0.5 : 0);
    B.smat.color.setHex(frozen ? 0xeaf6ff : v.col); B.lm.color.setHex(frozen ? 0xdff2ff : v.col); B.lm.opacity = frozen ? 0.8 : 0.45;
    stepPart(B.sp, 130, sp, dt, 0.35, HL - 0.05, RAD - 0.3); setInst(B.solv, B.sp, 120 - (sol ? Math.min(30, np * (o.parts.length > 1 ? 1.0 : 0.5)) * 0 : 0), 0.17, 0.2);
    for (var w = 0; w < 2; w++) {
      var part = o.parts[w], mult = (o.mult ? o.mult[w] : 1), cnt = (sol && part) ? np * mult : 0;
      if (part) { B.sd[w].material.color.setHex(part[1]); stepPart(B.sdp[w], 70, sp * 0.8, dt, 0.35, HL - 0.05, RAD - 0.3); setInst(B.sd[w], B.sdp[w], Math.min(70, cnt), part[2], 0.2); } else B.sd[w].count = 0;
    }
    var p0 = P0(S.T), px = p0 * (sol ? xSolv() : 1), frac = clamp(px / 760, 0, 1.4), nv = Math.round(Math.min(45, frac * 26 + (px > 8 ? 1 : 0)));
    if (frozen) nv = Math.min(nv, 1);
    B.vp.forEach(function (p) { p.x += p.vx * 1.6 * dt; p.y += p.vy * 1.6 * dt; p.z += p.vz * 1.6 * dt; var rr = Math.sqrt(p.x * p.x + p.z * p.z); if (rr > RAD - 0.3) { p.x *= 0.95; p.z *= 0.95; p.vx *= -1; p.vz *= -1; } if (p.y < HL + 0.4) { p.y = HL + 0.4; p.vy = Math.abs(p.vy); } if (p.y > 5.4) { p.y = 5.4; p.vy = -Math.abs(p.vy); } });
    B.vp.forEach(function (p) { if (p.y < 0.4) p.y = HL + 0.4 + Math.random() * 1.5; });
    setInst(B.vap, B.vp, nv, 0.14, 0);
    var bh = 0.1 + 5.2 * clamp(px / Math.max(P0(S.T), 1), 0, 1) * clamp(P0(S.T) / 760 * 0.0 + 1, 0, 1) * (frozen ? 0.4 : 1);
    var hh = 0.15 + 5 * clamp(px / 760, 0, 1.15); B.bar.scale.y = hh; B.bar.position.y = hh / 2 + 0.12;
    B.ph = px;
  }

  var def = {
    key: 'coligativas', title: "Solutions and Colligative Properties", subtitle: "3D Simulator · general chemistry", accent: { dark: '#fbbf77', light: '#b45309' },
    stages: stages, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: "Free", pos: [0, 7, 24], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 4, 26], target: [0, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 30, 3], target: [0, 2, 0] }, { id: 'osm', label: "Osmosis", pos: [0, 6, 20], target: [0, 4, 0] }],
    layers: [{ id: 'vapor', label: "Vapor pressure bars", icon: '▮' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; beak = [mkBeaker(ctx, 0), mkBeaker(ctx, 1)];
      var plate = new T.Mesh(new T.BoxGeometry(18, 0.3, 8), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; s.add(plate); U.plate = plate;
      lab.a = ctx.label('', 'bl-d'); lab.b = ctx.label('', 'bl-warn'); lab.ta = ctx.label('', 'bl-d'); lab.tb = ctx.label('', 'bl-lead'); lab.pa = ctx.label('', 'bl-d'); lab.pb = ctx.label('', 'bl-warn'); lab.T = ctx.label('', 'bl-lead');
      // U-tube
      var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.16, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      var ug = new T.Group(); U.g = ug; s.add(ug);
      [-2.8, 2.8].forEach(function (x) { var t = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 11, 24, 1, true), gm); t.position.set(x, 5.7, 0); ug.add(t); });
      var bt = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 5.6, 24, 1, true), gm); bt.rotation.z = Math.PI / 2; bt.position.set(0, 0.4, 0); ug.add(bt);
      var mem = new T.Mesh(new T.CylinderGeometry(0.92, 0.92, 0.12, 24), new T.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55 })); mem.rotation.z = Math.PI / 2; mem.position.set(0, 0.4, 0); ug.add(mem);
      U.lm = new T.MeshStandardMaterial({ color: 0x6bb8ff, transparent: true, opacity: 0.5 }); U.rm = new T.MeshStandardMaterial({ color: 0xff9d7a, transparent: true, opacity: 0.55 });
      U.lq = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 1, 24), U.lm); U.rq = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 1, 24), U.rm); ug.add(U.lq); ug.add(U.rq);
      U.bl = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 2.7, 24), U.lm); U.bl.rotation.z = Math.PI / 2; U.bl.position.set(-1.4, 0.4, 0); ug.add(U.bl);
      U.br = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 2.7, 24), U.rm); U.br.rotation.z = Math.PI / 2; U.br.position.set(1.4, 0.4, 0); ug.add(U.br);
      var sg = new T.SphereGeometry(1, 10, 8); U.sol = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xffa94d }), 40); U.sol.frustumCulled = false; ug.add(U.sol); U.sp = [];
      for (var q = 0; q < 40; q++) U.sp.push({ x: 2.8 + (Math.random() - 0.5) * 1.1, y: 0.5 + Math.random() * 3, z: (Math.random() - 0.5) * 1.1, vx: Math.random() - .5, vy: Math.random() - .5, vz: Math.random() - .5 });
      lab.u1 = ctx.label('', 'bl-d'); lab.u2 = ctx.label('', 'bl-warn'); lab.u3 = ctx.label('', 'bl-lead'); lab.u4 = ctx.label("Semipermeable membrane", 'bl-d');
      ug.visible = false;
      for (q = 0; q < 8; q++) { var bb = new T.Mesh(sg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); bb.scale.setScalar(0.16); bb.visible = false; s.add(bb); bubbles.push({ m: bb, ph: Math.random(), k: q % 2 }); }
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, u = ctx.ease(f.local), th = f.local;
        if (i === 0) { S.sol = 'nacl'; S.m = 1; S.T = 25; S.mode = 'vasos'; }
        if (i === 1) { S.sol = 'nacl'; S.m = 3; S.T = 80; S.mode = 'vasos'; }
        if (i === 2) { S.sol = 'nacl'; S.m = 1; S.mode = 'vasos'; S.T = 98.8 + (Tb(true) - 98.8 + 1.0) * u; }
        if (i === 3) { S.sol = 'nacl'; S.m = 1; S.mode = 'vasos'; S.T = 1.0 - (1 + dTf() + 0.8) * u; }
        if (i === 4) { S.sol = 'glu'; S.m = 0.5; S.T = 25; S.mode = 'osmosis'; }
        if (i === 5) { var k = Math.min(2, Math.floor(th * 3)); S.sol = ['glu', 'nacl', 'cacl2'][k]; S.m = 1; S.T = -2.8; S.mode = 'vasos'; }
      }
      var osm = S.mode === 'osmosis';
      beak.forEach(function (B) { B.g.visible = !osm; }); U.plate.visible = !osm; U.g.visible = osm;
      if (!osm) {
        beak.forEach(function (B, k) { updBeaker(ctx, B, k === 1, dt, ctx.now); B.bar.visible = B.barBase.visible = ctx.layer('vapor'); });
        var sa = state(false), sb = state(true), o = so(), v = sv();
        lab.a.pos(BX[0], 6.6, 0).set(v.f + " pure · " + sa, 'bl-d').vis(true);
        lab.b.pos(BX[1], 6.6, 0).set(v.f + ' + ' + o.f + ' ' + f2(S.m) + ' m · ' + sb, 'bl-warn').vis(true);
        lab.ta.pos(BX[0], -0.9, 0).set('Tb = ' + fmt(Tb(false), 2) + ' °C · Tf = ' + fmt(Tf(false), 2) + ' °C', 'bl-d').vis(true);
        lab.tb.pos(BX[1], -0.9, 0).set('Tb = ' + fmt(Tb(true), 2) + ' °C · Tf = ' + fmt(Tf(true), 2) + ' °C', 'bl-lead').vis(true);
        lab.pa.pos(BX[0] + 3.6, 6.0, 0).set(fmt(beak[0].ph, 1) + ' mmHg', 'bl-d').vis(ctx.layer('vapor'));
        lab.pb.pos(BX[1] - 3.6, 6.0, 0).set(fmt(beak[1].ph, 1) + ' mmHg', 'bl-warn').vis(ctx.layer('vapor'));
        lab.T.pos(0, 6.9, 0).set('T = ' + fmt(S.T, 2) + ' °C', 'bl-lead').vis(true);
        bubbles.forEach(function (b) { var B = beak[b.k], boil = state(b.k === 1) === 'ebullición'; b.m.visible = boil; if (boil) { b.ph = (b.ph + dt * 0.8) % 1; b.m.position.set(BX[b.k] + Math.sin(b.ph * 9 + b.k) * 1.2, 0.3 + b.ph * (HL - 0.2), Math.cos(b.ph * 7) * 1.0); } });
        ['u1', 'u2', 'u3', 'u4'].forEach(function (k) { lab[k].vis(false); });
      } else {
        bubbles.forEach(function (b) { b.m.visible = false; });
        ['a', 'b', 'ta', 'tb', 'pa', 'pb', 'T'].forEach(function (k) { lab[k].vis(false); });
        var dh = clamp(pi() * 0.22, 0, 5.4), tgt = [4 - dh / 2, 4 + dh / 2]; hL += (tgt[0] - hL) * Math.min(1, dt * 0.9); hR += (tgt[1] - hR) * Math.min(1, dt * 0.9);
        U.lq.scale.y = hL; U.lq.position.set(-2.8, 0.4 + hL / 2, 0); U.rq.scale.y = hR; U.rq.position.set(2.8, 0.4 + hR / 2, 0);
        var n = Math.round(Math.min(40, S.m * 14));
        U.sp.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.x < 2.8 - 0.55) { p.x = 2.25; p.vx = Math.abs(p.vx); } if (p.x > 3.35) { p.x = 3.35; p.vx = -Math.abs(p.vx); } if (Math.abs(p.z) > 0.55) p.vz *= -1; if (p.y < 0.6) { p.y = 0.6; p.vy = Math.abs(p.vy); } if (p.y > hR - 0.2) { p.y = hR - 0.2; p.vy = -Math.abs(p.vy); } });
        dummy = dummy || new THREE.Object3D(); U.sol.count = Math.min(n, 40); for (var q = 0; q < U.sol.count; q++) { var p = U.sp[q]; dummy.position.set(p.x, p.y, p.z); dummy.scale.setScalar(0.22); dummy.updateMatrix(); U.sol.setMatrixAt(q, dummy.matrix); } U.sol.instanceMatrix.needsUpdate = true;
        var o2 = so();
        lab.u1.pos(-2.8, 11.9, 0).set(sv().f + " pure", 'bl-d').vis(true); lab.u2.pos(2.8, 11.9, 0).set(o2.f + ' ' + f2(S.m) + ' m', 'bl-warn').vis(true);
        lab.u3.pos(0, 8.3, 0).set('π = ' + f2(pi()) + ' atm → Δh = ' + fmt(pi() * 10.33 / sv().rho * 1, 1) + " m of water", 'bl-lead').vis(true); lab.u4.pos(0, 1.9, 0).vis(true);
      }
    },
    sync: function (ctx) { if (ctx.P.manual) return; var u = ctx.ui; u.sM && u.sM.set(S.m); u.sT && u.sT.set(S.T); u.solOpts && u.solOpts.set(S.sol); u.modeOpts && u.modeOpts.set(S.mode); },
    hud: function () {
      var o = so(), v = sv();
      return { eq: { chip: "Colligative", name: o.f + ' en ' + v.name, body: "<div class=\"eqline\"><small>Molality · i</small>" + f2(S.m) + ' mol/kg · i = ' + o.i + '</div><div class="eqline"><small>ΔT<sub>b</sub> · ΔT<sub>f</sub></small>' + f2(dTb()) + ' °C · ' + f2(dTf()) + ' °C</div><div class="eqline"><small>π a ' + fmt(S.T, 0) + ' °C</small>' + f2(pi()) + " atm</div><small>Colligative properties depend on the number of particles (i·m).</small>" },
        legend: [{ label: "Solvent", color: '#6bb8ff', text: v.f }].concat(o.parts.map(function (p, k) { return { label: p[0], color: '#' + ('000000' + p[1].toString(16)).slice(-6), text: "solute" }; })) };
    },
    measures: function () { var o = so(), v = sv(); return [["Solute", o.f + ' (' + o.name + ')'], ["Solvent", v.f], ["Molality m", f2(S.m) + ' mol/kg'], ['i (ideal)', String(o.i)], ['% m/m', f2(pctMass()) + ' %'], ["x solvent", fmt(xSolv(), 4)], ['T', fmt(S.T, 2) + ' °C'], ['P° / P (' + fmt(S.T, 0) + ' °C)', fmt(P0(S.T), 1) + ' / ' + fmt(P0(S.T) * xSolv(), 1) + ' mmHg'], ['ΔT<sub>b</sub>', f2(dTb()) + ' °C'], ['ΔT<sub>f</sub>', f2(dTf()) + ' °C'], ['π', f2(pi()) + ' atm']]; },
    ideas: ["<b>Colligative properties</b> depend on the amount of solute particles, not on their identity.", "<b>Raoult</b>: P = x<sub>solvent</sub>·P° (the vapor pressure drops).", "<b>ΔT<sub>b</sub> = i K<sub>b</sub> m</b> (boiling point rises) and <b>ΔT<sub>f</sub> = i K<sub>f</sub> m</b> (freezing point drops).", "<b>π = i M R T</b>: osmotic pressure; the solvent flows toward the concentrated side.", "Electrolytes have i &gt; 1: NaCl ≈ 2, CaCl₂ ≈ 3 (ideal)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Control panel"); el.appendChild(c);
      ui.solOpts = kit.ui.options({ label: "Solute", cols: 2, value: S.sol, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].f, sub: SOL[k].name + ' en ' + SOLV[SOL[k].sv].name + ' (i = ' + SOL[k].i + ')' }; }), onChange: function (v) { ctx.goManual(); S.sol = v; S.m = Math.min(S.m, so().maxm); S.T = (S.mode === 'osmosis') ? 25 : (so().sv === 'benceno' ? 25 : S.T); ui.sM.set(S.m); ui.sM.querySelector('input').max = so().maxm; } });
      c.appendChild(ui.solOpts);
      ui.modeOpts = kit.ui.options({ label: "Setup", cols: 2, value: S.mode, options: [{ v: 'vasos', label: "Flasks", sub: "vapor, Tb, Tf" }, { v: 'osmosis', label: "U-tube", sub: "osmosis" }], onChange: function (v) { ctx.goManual(); S.mode = v; ctx.view(v === 'osmosis' ? 'osm' : 'libre'); } });
      c.appendChild(ui.modeOpts);
      ui.sM = kit.ui.slider({ label: 'm', min: 0, max: so().maxm, step: 0.05, value: S.m, format: function (v) { return f2(v) + ' mol/kg'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.sT = kit.ui.slider({ label: 'T', min: -15, max: 110, step: 0.1, value: S.T, format: function (v) { return fmt(v, 1) + ' °C'; }, onInput: function (v) { ctx.goManual(); S.T = v; } });
      c.appendChild(kit.ui.sliders([ui.sM, ui.sT]));
      c.appendChild(ctx.btnRow([{ t: "Go to boiling", fn: function () { ctx.goManual(); S.mode = 'vasos'; S.T = (Tb(false) + Tb(true)) / 2; ui.sT.set(S.T); } }, { t: "Go to freezing", fn: function () { ctx.goManual(); S.mode = 'vasos'; S.T = (Tf(false) + Tf(true)) / 2; ui.sT.set(S.T); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', "<p class=\"muted small\">1 kg of solvent; 1 particle in the drawing ≈ 0.125 mol of formula units. Tabulated Kb and Kf and ideal i factors are used; the vapor pressure follows the Antoine equation and Raoult's law. In Osmosis M ≈ m is assumed.</p>");
    },
    graphs: [
      { title: "Vapor pressure versus temperature", h: 230, note: "Blue: pure solvent; orange: solution (Raoult). The horizontal line is 760 mmHg: the intersection gives the boiling temperature (approx.).", draw: function (cx, w, h, c) {
        var L = 44, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, v = sv(), a = v.Tf - 5 < 0 ? -5 : v.Tf - 5, b = v.Tb + 8;
        var sx = function (t) { return L + pw * (t - a) / (b - a); }, sy = function (p) { return Tp + ph - ph * Math.min(p, 1100) / 1100; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(1100 * i / 4, 0), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var j = 0; j <= 4; j++) cx.fillText(fmt(a + (b - a) * j / 4, 0), L + pw * j / 4, h - B + 13); cx.fillText("T (°C) · y axis: P (mmHg)", L + pw / 2, h - 4);
        cx.setLineDash([4, 4]); cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(L, sy(760)); cx.lineTo(L + pw, sy(760)); cx.stroke(); cx.setLineDash([]);
        [[1, '#5cb3ff'], [xSolv(), '#ff7a5c']].forEach(function (z) { cx.strokeStyle = z[1]; cx.lineWidth = 2.4; cx.beginPath(); for (var t = a; t <= b; t += 0.5) { var yy = sy(P0(t) * z[0]); if (t === a) cx.moveTo(sx(t), yy); else cx.lineTo(sx(t), yy); } cx.stroke(); }); cx.lineWidth = 1;
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.T), Tp); cx.lineTo(sx(S.T), Tp + ph); cx.stroke(); cx.setLineDash([]); } },
      { title: "ΔT as a function of molality", h: 210, note: "Freezing-point depression ΔT<sub>f</sub> for i = 1, 2, 3 (same molality). The dot marks the chosen solute.", draw: function (cx, w, h, c) {
        var L = 40, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, v = sv(), mx = 3, ym = v.Kf * 3 * 3 * 1.05;
        var sx = function (m) { return L + pw * m / mx; }, sy = function (d) { return Tp + ph - ph * d / ym; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(ym * i / 4, 1), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var j = 0; j <= 3; j++) cx.fillText(j, sx(j), h - B + 13); cx.fillText("molality (mol/kg) · y axis: ΔT_f (°C)", L + pw / 2, h - 4);
        [[1, '#9aa7b4'], [2, '#4fa3ff'], [3, '#e3b341']].forEach(function (z) { cx.strokeStyle = z[1]; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(mx), sy(z[0] * v.Kf * mx)); cx.stroke(); cx.fillStyle = z[1]; cx.textAlign = 'left'; cx.fillText('i = ' + z[0], sx(mx) - 36, sy(z[0] * v.Kf * mx) + (z[0] === 3 ? 12 : -4)); }); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.m), sy(dTf()), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
      { title: "Osmotic pressure", h: 200, note: "π = i·m·R·T at the current temperature (M ≈ m).", draw: function (cx, w, h, c) {
        var L = 42, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = 3, ym = 3 * 3 * Rg * (S.T + 273.15) * 1.05;
        var sx = function (m) { return L + pw * m / mx; }, sy = function (p) { return Tp + ph - ph * p / ym; };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(ym * i / 4, 0), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var j = 0; j <= 3; j++) cx.fillText(j, sx(j), h - B + 13); cx.fillText("molality (mol/kg) · y axis: π (atm)", L + pw / 2, h - 4);
        [[1, '#9aa7b4'], [2, '#4fa3ff'], [3, '#e3b341']].forEach(function (z) { cx.strokeStyle = z[1]; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(mx), sy(z[0] * mx * Rg * (S.T + 273.15))); cx.stroke(); }); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.m), sy(pi()), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }
    ],
    calc: function () {
      var o = so(), v = sv(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, w = S.m * o.M;
      return '<div class="card-kicker">' + o.f + ' ' + f2(S.m) + " m in " + v.name + '</div>' +
        "<div class=\"calc-step\">1 · Concentration</div><table class=\"calc-table\">" + row("Mass of solute in 1 kg of solvent", f2(S.m) + ' mol × ' + fmt(o.M, 2) + ' g/mol = ' + fmt(w, 1) + ' g') + row('% m/m', fmt(w, 1) + ' ÷ (1000 + ' + fmt(w, 1) + ') × 100 = <b>' + f2(pctMass()) + ' %</b>') + row("n solvent", fmt(nSolv(), 2) + ' mol') + row("x solvent", fmt(nSolv(), 2) + ' ÷ (' + fmt(nSolv(), 2) + ' + ' + o.i + ' × ' + f2(S.m) + ') = <b>' + fmt(xSolv(), 4) + '</b>') + '</table>' +
        "<div class=\"calc-step\">2 · Raoult's law at " + fmt(S.T, 1) + ' °C</div><table class="calc-table">' + row('P° (Antoine)', fmt(P0(S.T), 1) + ' mmHg') + row('P = x · P°', fmt(xSolv(), 4) + ' × ' + fmt(P0(S.T), 1) + ' = <b>' + fmt(P0(S.T) * xSolv(), 1) + ' mmHg</b>') + row('ΔP', fmt(P0(S.T) * (1 - xSolv()), 1) + ' mmHg') + '</table>' +
        "<div class=\"calc-step\">3 · Boiling and freezing</div><table class=\"calc-table\">" + row('ΔT<sub>b</sub> = i·K<sub>b</sub>·m', o.i + ' × ' + v.Kb + ' × ' + f2(S.m) + ' = <b>' + f2(dTb()) + ' °C</b>') + row("T<sub>b</sub> solution", fmt(Tb(true), 2) + ' °C') + row('ΔT<sub>f</sub> = i·K<sub>f</sub>·m', o.i + ' × ' + v.Kf + ' × ' + f2(S.m) + ' = <b>' + f2(dTf()) + ' °C</b>') + row("T<sub>f</sub> solution", fmt(Tf(true), 2) + ' °C') + '</table>' +
        "<div class=\"calc-step\">4 · Osmotic pressure at " + fmt(S.T, 1) + ' °C</div><table class="calc-table">' + row('π = i·M·R·T', o.i + ' × ' + f2(S.m) + ' × 0,08206 × ' + fmt(S.T + 273.15, 1) + ' = <b>' + f2(pi()) + ' atm</b>') + row("Equivalent to", fmt(pi() * 101.325, 0) + ' kPa ≈ ' + fmt(pi() * 10.33, 0) + " m of water column") + '</table>';
    },
    quiz: [
      { q: "0.50 mol of glucose is dissolved in 250 g of water. What is the molality?", options: ["2.0 mol/kg", "0.50 mol/kg", "0.125 mol/kg", "1.0 mol/kg"], answer: 0, why: "m = mol of solute / kg of solvent = 0.50 / 0.250 = 2.0 mol/kg." },
      { q: "58.4 g of NaCl is dissolved in 1.00 kg of water. Assuming complete dissociation, what is ΔT<sub>f</sub>? (K<sub>f</sub> = 1.86 °C·kg/mol; M = 58.44 g/mol)", options: ['3,72 °C', '1,86 °C', '0,93 °C', '7,44 °C'], answer: 0, why: "m = 1.00 mol/kg, i = 2: ΔT_f = i·K_f·m = 2 × 1.86 × 1.00 = 3.72 °C; it freezes at −3.72 °C." },
      { q: "For the same molality, which aqueous solution has the greater freezing-point depression?", options: ["CaCl₂", 'NaCl', "Glucose", "All equal"], answer: 0, why: "It depends on i·m: CaCl₂ (i = 3) > NaCl (i = 2) > glucose (i = 1)." },
      { q: "The vapor pressure of a solution with a nonvolatile solute is…", options: ["Lower than that of the pure solvent", "Higher than that of the pure solvent", "Equal to that of the pure solvent", "Zero"], answer: 0, why: "Raoult's law: P = x_solvent·P° and x < 1, hence P < P°." },
      { q: "At what temperature does a 1.00 m solution of glucose in water boil at 1 atm? (K<sub>b</sub> = 0.512 °C·kg/mol)", options: ['100,51 °C', '99,49 °C', '101,02 °C', '100,00 °C'], answer: 0, why: 'ΔT_b = 1 × 0,512 × 1,00 = 0,512 °C → 100,51 °C.' },
      { q: "What is the osmotic pressure of 0.100 M glucose at 25 °C (R = 0.08206 atm·L/mol·K)?", options: ["2.45 atm", "24.5 atm", "0.245 atm", "1.00 atm"], answer: 0, why: "π = M·R·T = 0.100 × 0.08206 × 298.15 = 2.45 atm (i = 1)." },
      { q: "In osmosis, the solvent flows…", options: ["From the dilute side to the concentrated side", "From the concentrated side to the dilute side", "There is no flow", "Only if the temperature rises"], answer: 0, why: "Water passes through the membrane toward the more concentrated solution, tending to equalize the concentrations." },
      { q: "The van 't Hoff factor i of Al₂(SO₄)₃ (ideal complete dissociation) is…", options: ['5', '2', '3', '1'], answer: 0, why: "Al₂(SO₄)₃ → 2 Al³⁺ + 3 SO₄²⁻: 5 particles per formula unit." }
    ],
    help: { intro: "Choose solute and concentration in “Lab”, or follow the lesson. In “U-tube” osmosis is shown.", items: [["Flasks", "left: pure solvent; right: solution. At the same temperature the bubbles (boiling), the ice (freezing) and the vapor-pressure bars differ."], ["Bars", "height proportional to the vapor pressure (“Bars” layer)."], ["U-tube", "the membrane lets only the solvent through; the column rises on the concentrated side."], ["Calculation", "molality, Raoult, ΔT_b, ΔT_f and π with the current values."]] }
  };
  MSim.create(def);
})();
