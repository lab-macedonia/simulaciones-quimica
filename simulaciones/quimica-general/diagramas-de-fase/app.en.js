/* Diagramas de fase — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var R = 8.314, fmt = SimKit.fmt, ATM = 101325;
  var SUB = {
    H2O: { name: "Water", f: 'H₂O', Tt: 273.16, Pt: 611.657, Tc: 647.1, Pc: 22.064e6, p3: [373.15, ATM], sub: [200, 0.162], dmelt: -13.7e6, Tlo: 200, Thi: 700, lp0: -1, lp1: 8.3, cs: 38, cl: 75.3, cg: 33.6, Hf: 6010, Hv: 40700, nb: "normal b.p. 373.15 K (100 °C)" },
    CO2: { name: "Carbon dioxide", f: 'CO₂', Tt: 216.55, Pt: 517000, Tc: 304.13, Pc: 7.377e6, p3: [250, 1.785e6], sub: [194.7, ATM], dmelt: 4.6e6, Tlo: 150, Thi: 400, lp0: 2, lp1: 8.3, cs: 50, cl: 85, cg: 37, Hf: 9000, Hv: 15300, nb: "sublimes at 194.7 K (−78.5 °C) at 1 atm" }
  };
  var S = { id: 'H2O', T: 298, lp: 5.0057 }; // lp = log10 P (Pa)
  function D() { return SUB[S.id]; }
  function fit3(d) { // lnP = a + b u + c u^2, u = 1/T
    var pts = [[1 / d.Tt, Math.log(d.Pt)], [1 / d.p3[0], Math.log(d.p3[1])], [1 / d.Tc, Math.log(d.Pc)]];
    var u0 = pts[0][0], u1 = pts[1][0], u2 = pts[2][0], y0 = pts[0][1], y1 = pts[1][1], y2 = pts[2][1];
    var c = ((y2 - y0) / (u2 - u0) - (y1 - y0) / (u1 - u0)) / (u2 - u1), b = (y1 - y0) / (u1 - u0) - c * (u1 + u0), a = y0 - b * u0 - c * u0 * u0;
    return [a, b, c];
  }
  function fitS(d) { var u0 = 1 / d.Tt, u1 = 1 / d.sub[0], b = (Math.log(d.Pt) - Math.log(d.sub[1])) / (u0 - u1); return [Math.log(d.Pt) - b * u0, b]; }
  SUB.H2O.cv = fit3(SUB.H2O); SUB.CO2.cv = fit3(SUB.CO2); SUB.H2O.cs2 = fitS(SUB.H2O); SUB.CO2.cs2 = fitS(SUB.CO2);
  function Pvap(T, d) { d = d || D(); var u = 1 / T, c = d.cv; return Math.exp(c[0] + c[1] * u + c[2] * u * u); }
  function Psub(T, d) { d = d || D(); return Math.exp(d.cs2[0] + d.cs2[1] / T); }
  function Tm(P, d) { d = d || D(); return d.Tt + (P - d.Pt) / d.dmelt; }
  function info(T, P, d) {
    d = d || D(); var r = { s: 0, l: 0, g: 0, sc: 0, name: '', coex: '' };
    var lnP = Math.log(P), eps = 0.03;
    if (Math.abs(T - d.Tt) < 0.35 && Math.abs(lnP - Math.log(d.Pt)) < 0.06) { r.s = r.l = r.g = 1 / 3; r.name = "Triple point: solid + liquid + gas"; r.coex = 'triple'; return r; }
    if (T >= d.Tc && P >= d.Pc) { r.sc = 1; r.name = "Supercritical fluid"; return r; }
    if (P < d.Pt) {
      if (T < d.Tt) { var ls = Math.log(Psub(T, d)); if (Math.abs(lnP - ls) < eps) { r.s = .5; r.g = .5; r.name = "Solid–gas equilibrium (sublimation)"; r.coex = 'sub'; } else if (lnP > ls) { r.s = 1; r.name = "Solid"; } else { r.g = 1; r.name = 'Gas'; } }
      else { r.g = 1; r.name = 'Gas'; }
      return r;
    }
    if (Math.abs(T - Tm(P, d)) < 0.12 && T <= d.Tc) { r.s = .5; r.l = .5; r.name = "Solid–liquid equilibrium (melting)"; r.coex = 'fus'; return r; }
    if (T < Tm(P, d) && d.dmelt > 0 || T > Tm(P, d) && d.dmelt < 0 ? false : false) { }
    var solid = d.dmelt > 0 ? T < Tm(P, d) : T < Tm(P, d);
    if (solid) { r.s = 1; r.name = "Solid"; return r; }
    if (T < d.Tc) { var lv = Math.log(Pvap(T, d)); if (T < d.Tt) { r.l = 1; r.name = "Liquid"; } else if (Math.abs(lnP - lv) < eps) { r.l = .5; r.g = .5; r.name = "Liquid–gas equilibrium (vaporization)"; r.coex = 'vap'; } else if (lnP > lv) { r.l = 1; r.name = "Liquid"; } else { r.g = 1; r.name = 'Gas'; } return r; }
    r.g = 1; r.name = 'Gas'; return r;
  }
  function Pnow() { return Math.pow(10, S.lp); }
  function cl(x) { return Math.max(0, Math.min(1, x)); }
  function Ttxt(T) { return fmt(T, 1) + ' K (' + fmt(T - 273.15, 1) + ' °C)'; }
  function Ptxt(P) { return P >= 1e6 ? fmt(P / 1e6, 2) + ' MPa' : (P >= 1e3 ? fmt(P / 1e3, 1) + ' kPa' : fmt(P, 1) + ' Pa'); }
  function Tbp(P, d) { d = d || D(); if (P < d.Pt || P > d.Pc) return NaN; var lo = d.Tt, hi = d.Tc; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (Pvap(m, d) < P) lo = m; else hi = m; } return (lo + hi) / 2; }
  function Tsb(P, d) { d = d || D(); if (P >= d.Pt) return NaN; var lo = 100, hi = d.Tt; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (Psub(m, d) < P) lo = m; else hi = m; } return (lo + hi) / 2; }
  function dHv(T, d) { d = d || D(); var u = 1 / T; return -R * (d.cv[1] + 2 * d.cv[2] * u) / 1000; }

  var N = 100, pts = [], inst, dum, boxT, lid, heat, lab = {}, cur = { s: 0, l: 0, g: 1, sc: 0, H: 6, vh: 6 };
  function stages() {
    var w = SUB.H2O, c = SUB.CO2;
    return [
      ["States and phases", "Phases", "A pure substance changes phase according to T and P", "<p>A <b>phase</b> is a homogeneous portion of matter. For a pure substance, the most stable state depends on the <b>temperature</b> and the <b>pressure</b>. We heat water at 1 atm: the <b>solid</b> (ordered particles that vibrate) turns into <b>liquid</b> (disordered but compact) and then into <b>gas</b> (widely separated particles). The <b>phase diagram</b> is the map of P versus T showing which phase is stable at each point.</p>"],
      ["Equilibrium curves", "Curves", "On each curve two phases coexist in equilibrium", "<p>The curves separate regions: <b>melting</b> (solid–liquid), <b>vaporization</b> (liquid–gas) and <b>sublimation</b> (solid–gas). On them, two phases coexist in dynamic equilibrium. The vaporization curve is the <b>vapor pressure</b> as a function of T; the point where it equals 1 atm is the <b>normal boiling point</b> (water: 373.15 K). Here we follow that curve: the liquid and the gas coexist at each T with its vapor P.</p>"],
      ["Triple point", 'Triple', "Triple point: the three phases coexist (F = 0)", "<p>At the <b>triple point</b> solid, liquid and gas coexist. For water: <b>273.16 K and 611.657 Pa</b> (0.006 atm); for CO₂: <b>216.55 K and 517 kPa</b> (5.1 atm). According to the phase rule F = C − P + 2 = 1 − 3 + 2 = <b>0</b>: no degrees of freedom, the point is unique. That is why the triple point of water defined the kelvin until 2019.</p>"],
      ["Critical point", "Critical", "Above T<sub>c</sub> and P<sub>c</sub> there is no liquid–gas distinction", "<p>The vaporization curve ends at the <b>critical point</b> (water: 647.1 K and 22.06 MPa; CO₂: 304.1 K and 7.38 MPa). On approaching it, the liquid expands and the gas densifies until the meniscus disappears. Above T<sub>c</sub> and P<sub>c</sub> there is a <b>supercritical fluid</b>: liquid density, gas diffusivity (supercritical CO₂ decaffeinates coffee).</p>"],
      ["Water: negative slope", "Water", "In water, pressure lowers the melting point", "<p>The solid–liquid curve of water has a <b>negative slope</b>: ice is less dense than liquid water (ΔV<sub>fus</sub> &lt; 0) and, by Clapeyron <b>dP/dT = ΔH/(TΔV)</b>, increasing P favors the liquid. At −1.5 °C ice melts if about 20 MPa is applied. In almost all other substances the slope is positive.</p>"],
      ["CO₂: dry ice", 'CO₂', "At 1 atm solid CO₂ sublimes, it does not melt", "<p>The triple point of CO₂ is at <b>5.1 atm</b>, above atmospheric pressure: at 1 atm there is no liquid CO₂; the solid (<b>dry ice</b>) <b>sublimes</b> at 194.7 K (−78.5 °C). To obtain liquid CO₂ it must be compressed above 5.1 atm, as in a fire extinguisher.</p>"]
    ];
  }
  var PATH = [
    function (u) { return ['H2O', 240 + 180 * u, Math.log10(ATM)]; },
    function (u) { var T = 280 + 170 * u; return ['H2O', T, Math.log10(Pvap(T, SUB.H2O))]; },
    function (u) { var k = 1 - Math.min(1, u * 3); return ['H2O', 273.16 + 3 * k, Math.log10(611.657) + 0.6 * k]; },
    function (u) { var T = 570 + 120 * u; return ['H2O', T, T < 647.1 ? Math.log10(Pvap(T, SUB.H2O)) : Math.log10(22.064e6)]; },
    function (u) { return ['H2O', 271.5, 5 + 2.6 * u]; },
    function (u) { return ['CO2', 170 + 70 * u, Math.log10(ATM)]; }
  ];
  function def_() {
    return {
      key: 'diagramas-de-fase', title: "Phase diagrams", subtitle: "3D Simulator · general chemistry", accent: { dark: '#5eead4', light: '#0f766e' },
      stages: stages, dur: 12, offset: 0.12,
      views: [{ id: 'libre', label: "Free", pos: [9, 7, 16], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 5, 18], target: [0, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 20, 3], target: [0, 2, 0] }, { id: 'lado', label: "Side", pos: [18, 5, 0], target: [0, 3, 0] }],
      layers: [{ id: 'part', label: "Particles", icon: '●' }, { id: 'heat', label: "Heater", icon: '♨' }],
      build: function (ctx) {
        var T = ctx.T, s = ctx.scene; dum = new T.Object3D();
        var glass = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.12, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
        boxT = new T.Mesh(new T.BoxGeometry(5.6, 7.4, 5.6), glass); boxT.position.y = 3.7; s.add(boxT);
        var base = new T.Mesh(new T.BoxGeometry(7, 0.5, 7), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.7 })); base.position.y = -0.25; s.add(base);
        heat = new T.Mesh(new T.BoxGeometry(5.4, 0.12, 5.4), new T.MeshStandardMaterial({ color: 0x555555, emissive: 0xff3300, emissiveIntensity: 0, roughness: 0.5 })); heat.position.y = 0.06; s.add(heat);
        lid = new T.Mesh(new T.BoxGeometry(5.5, 0.35, 5.5), new T.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0.6, roughness: 0.35 })); s.add(lid);
        var rod = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 3, 12), new T.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0.6 })); rod.position.y = 2; lid.add(rod); lid.userData.rod = rod;
        inst = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), N); inst.frustumCulled = false; s.add(inst);
        for (var i = 0; i < N; i++) {
          var li = i % 25, layer = Math.floor(i / 25), gx = li % 5, gz = Math.floor(li / 5);
          pts.push({ lx: (gx - 2) * 0.62, ly: 0.35 + layer * 0.62, lz: (gz - 2) * 0.62, u: Math.random(), v: Math.random(), w: Math.random(), vu: Math.random() - .5, vv: Math.random() - .5, vw: Math.random() - .5, ws: 0, wl: 0, wg: 1, ph: Math.random() * 6.28 });
          inst.setColorAt(i, new T.Color(0xffd43b));
        }
        lab.P = ctx.label('', 'bl-lead'); lab.b = ctx.label('', 'bl-d');
        ctx.cols = { s: new T.Color(0xa5d8ff), l: new T.Color(0x339af0), g: new T.Color(0xffd43b), sc: new T.Color(0xf783ac) }; ctx.tmpc = new T.Color();
      },
      frame: function (ctx, f, dt) {
        var d = D();
        if (!ctx.P.manual) { var p = PATH[f.i](ctx.ease(f.local)); S.id = p[0]; S.T = p[1]; S.lp = p[2]; }
        var P = Pnow(), r = info(S.T, P), vis = ctx.layer('part');
        // fracciones objetivo -> por partícula
        var fs = r.s, fl = r.l, fg = r.g + r.sc, hs = 1.9 * (fs > 0 ? 1 : 0);
        var tgtH = r.sc ? 4.8 : (r.g ? 6.6 : (r.l ? 3.4 : 2.5)); if (r.g && r.l) tgtH = 6.6; if (r.sc) tgtH = 4.8;
        cur.vh += (tgtH - cur.vh) * Math.min(1, dt * 3); var vh = cur.vh;
        var speed = Math.sqrt(S.T / 300) * 0.9, yb = 0.35 + fs * 25 * 0.62 / 5 * 1.0 * 0.0 + Math.ceil(fs * 4) * 0.62;
        inst.count = vis ? N : 0;
        for (var i = 0; i < N; i++) {
          var q = pts[i], x = i / N, ts = x < fs ? 1 : 0, tl = (x >= fs && x < fs + fl) ? 1 : 0, tg = (ts + tl) ? 0 : 1, k = Math.min(1, dt * 2.5);
          q.ws += (ts - q.ws) * k; q.wl += (tl - q.wl) * k; q.wg += (tg - q.wg) * k;
          var sp = speed * (q.wg * 1.3 + q.wl * 0.45 + 0.1) * dt * 0.5;
          q.u += q.vu * sp; q.v += q.vv * sp; q.w += q.vw * sp;
          if (q.u < 0 || q.u > 1) { q.vu *= -1; q.u = cl(q.u); } if (q.v < 0 || q.v > 1) { q.vv *= -1; q.v = cl(q.v); } if (q.w < 0 || q.w > 1) { q.vw *= -1; q.w = cl(q.w); }
          var vib = (0.03 + 0.05 * Math.min(1, S.T / d.Tt * 0.5)), tm = f.now || 0;
          var sx = q.lx + Math.sin(tm * 9 + q.ph) * vib, sy = q.ly + Math.sin(tm * 8 + q.ph * 2) * vib, sz = q.lz + Math.cos(tm * 10 + q.ph) * vib;
          var lx = (q.u - .5) * 4.8, ly = yb + q.v * Math.max(1.2, fl * 2.3 + 0.2), lz = (q.w - .5) * 4.8;
          var gx = (q.u - .5) * 4.8, gy = 0.35 + q.v * (vh - 0.8), gz = (q.w - .5) * 4.8;
          var ww = q.ws + q.wl + q.wg;
          dum.position.set((sx * q.ws + lx * q.wl + gx * q.wg) / ww, (sy * q.ws + ly * q.wl + gy * q.wg) / ww, (sz * q.ws + lz * q.wl + gz * q.wg) / ww);
          dum.scale.setScalar(0.27); dum.updateMatrix(); inst.setMatrixAt(i, dum.matrix);
          var cc = ctx.tmpc; cc.setRGB(0, 0, 0); cc.r = (ctx.cols.s.r * q.ws + ctx.cols.l.r * q.wl + (r.sc ? ctx.cols.sc.r : ctx.cols.g.r) * q.wg) / ww; cc.g = (ctx.cols.s.g * q.ws + ctx.cols.l.g * q.wl + (r.sc ? ctx.cols.sc.g : ctx.cols.g.g) * q.wg) / ww; cc.b = (ctx.cols.s.b * q.ws + ctx.cols.l.b * q.wl + (r.sc ? ctx.cols.sc.b : ctx.cols.g.b) * q.wg) / ww; inst.setColorAt(i, cc);
        }
        inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        lid.position.y = vh + 0.45; lid.userData.rod.position.y = 1.7;
        var hot = cl((S.T - d.Tlo) / (d.Thi - d.Tlo)); heat.material.emissiveIntensity = ctx.layer('heat') ? hot * 2.2 : 0; heat.material.color.setRGB(0.2 + hot * .6, 0.2, 0.2);
        lab.P.pos(0, vh + 1.5, 0).set(r.name, 'bl-lead').vis(true); lab.b.pos(0, -0.9, 0).set(d.f + ' · T = ' + Ttxt(S.T) + ' · P = ' + Ptxt(P), 'bl-d').vis(true);
        ctx._info = r;
      },
      sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual || !u.sT) return; u.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); u.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); u.sub && u.sub.set(S.id); },
      hud: function () { var d = D(), P = Pnow(), r = info(S.T, P); var bp = Tbp(P), sb = Tsb(P);
        return { eq: { chip: d.f, name: r.name, body: '<div class="eqline"><small>T</small>' + fmt(S.T, 1) + ' K · ' + fmt(S.T - 273.15, 1) + ' °C</div><div class="eqline"><small>P</small>' + Ptxt(P) + ' (' + MSim.sci(P / ATM, 2) + " atm)</div><div class=\"eqline\"><small>Boiling T at this P</small>" + (isNaN(bp) ? '—' : fmt(bp, 1) + ' K') + '</div>' }, legend: [{ label: "Solid", color: '#a5d8ff', text: "ordered, vibrates" }, { label: "Liquid", color: '#339af0', text: "compact, flows" }, { label: 'Gas', color: '#ffd43b', text: "dispersed" }, { label: "Supercritical", color: '#f783ac', text: "T>Tc and P>Pc" }] }; },
      measures: function () { var d = D(), P = Pnow(), r = info(S.T, P), bp = Tbp(P), sb = Tsb(P); return [["Substance", d.name + ' (' + d.f + ')'], ["Phase", r.name], ['T', fmt(S.T, 1) + ' K'], ['P', Ptxt(P)], ["Triple point", fmt(d.Tt, 2) + ' K · ' + Ptxt(d.Pt)], ["Critical point", fmt(d.Tc, 1) + ' K · ' + Ptxt(d.Pc)], ["B.p. at this P", isNaN(bp) ? '—' : fmt(bp, 1) + ' K'], ["Subl. T at this P", isNaN(sb) ? '—' : fmt(sb, 1) + ' K'], ["Melting T at this P", P >= d.Pt ? fmt(Tm(P), 2) + ' K' : '—']]; },
      ideas: ["Each point (T, P) has a <b>stable phase</b>; on the curves two phases coexist.", "<b>Triple point</b>: three phases, F = 0. <b>Critical point</b>: the liquid–gas curve ends.", "Melting slope: <b>negative</b> in water (ice less dense), positive in CO₂.", "<b>Clausius–Clapeyron</b>: d ln P/dT = ΔH<sub>vap</sub>/(RT²).", "If P &lt; P<sub>triple</sub> the solid <b>sublimes</b> instead of melting."],
      lab: function (el, ctx) {
        var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Control panel"); el.appendChild(c);
        ui.sub = kit.ui.options({ label: "Substance", cols: 2, value: S.id, options: [{ v: 'H2O', label: 'H₂O', sub: "water" }, { v: 'CO2', label: 'CO₂', sub: "carbon dioxide" }], onChange: function (v) { ctx.goManual(); S.id = v; S.T = v === 'H2O' ? 298 : 298; S.lp = Math.log10(ATM); ui.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); ui.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); } });
        c.appendChild(ui.sub);
        ui.sT = kit.ui.slider({ label: "Temperature", min: 0, max: 1000, step: 1, value: 300, format: function (v) { var d = D(); return fmt(d.Tlo + (d.Thi - d.Tlo) * v / 1000, 1) + ' K'; }, onInput: function (v) { ctx.goManual(); var d = D(); S.T = d.Tlo + (d.Thi - d.Tlo) * v / 1000; } });
        ui.sP = kit.ui.slider({ label: "Pressure (log scale)", min: 0, max: 1000, step: 1, value: 500, format: function (v) { var d = D(); return Ptxt(Math.pow(10, d.lp0 + (d.lp1 - d.lp0) * v / 1000)); }, onInput: function (v) { ctx.goManual(); var d = D(); S.lp = d.lp0 + (d.lp1 - d.lp0) * v / 1000; } });
        c.appendChild(kit.ui.sliders([ui.sT, ui.sP]));
        function go(T, P) { ctx.goManual(); S.T = T; S.lp = Math.log10(P); ui.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); ui.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); }
        c.appendChild(ctx.btnRow([
          { t: "Triple point", fn: function () { go(D().Tt, D().Pt); } }, { t: "Critical point", fn: function () { go(D().Tc, D().Pc * 1.02); } },
          { t: '1 atm · 25 °C', fn: function () { go(298.15, ATM); } }, { t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
        c.insertAdjacentHTML('beforeend', "<p class=\"muted small\">The curves are fits to experimental data (extended Antoine and Clapeyron); the values are approximate. Use the logarithmic P scale to cover many orders of magnitude.</p>");
      },
      graphs: [
        { title: "P–T phase diagram", h: 290, note: "Logarithmic scale in P. The three equilibrium curves: melting (S–L), vaporization (L–G) and sublimation (S–G). Orange dot: current state. ● triple point · ◆ critical point.", draw: function (cx, w, h, c) {
          var d = D(), L = 46, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B;
          var sx = function (T) { return L + pw * (T - d.Tlo) / (d.Thi - d.Tlo); }, sy = function (lp) { return Tp + ph - ph * (lp - d.lp0) / (d.lp1 - d.lp0); };
          var img = cx.createImageData ? null : null, step = 4, i, j;
          var colr = { s: 'rgba(160,170,190,.55)', l: 'rgba(51,154,240,.45)', g: 'rgba(255,212,59,.40)', sc: 'rgba(247,131,172,.45)' };
          for (i = 0; i < pw; i += step) for (j = 0; j < ph; j += step) {
            var T = d.Tlo + (d.Thi - d.Tlo) * (i + step / 2) / pw, lp = d.lp0 + (d.lp1 - d.lp0) * (1 - (j + step / 2) / ph), r = info(T, Math.pow(10, lp), d); r.coex = '';
            var Pp = Math.pow(10, lp); var rr = (T >= d.Tc && Pp >= d.Pc) ? 'sc' : (function () { var x = info(T + 0, Pp, d); return x.s >= .5 ? 's' : (x.l >= .5 ? 'l' : 'g'); })();
            cx.fillStyle = colr[rr]; cx.fillRect(L + i, Tp + j, step, step);
          }
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right';
          for (i = Math.ceil(d.lp0); i <= d.lp1; i++) { var y = sy(i); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText('10' + (function (n) { return String(n).split('').map(function (ch) { return ch === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]; }).join(''); })(i), L - 5, y + 3); }
          cx.textAlign = 'center'; var dT = d.Thi - d.Tlo > 300 ? 100 : 50; for (var t = Math.ceil(d.Tlo / dT) * dT; t <= d.Thi; t += dT) cx.fillText(t, sx(t), h - B + 12);
          cx.fillText("T (K)  ·  vertical axis: P (Pa)", L + pw / 2, h - 3);
          cx.strokeStyle = c.ink; cx.lineWidth = 2; cx.beginPath(); var first = true; for (T = d.Tt; T <= d.Tc; T += (d.Tc - d.Tt) / 80) { var lv = Math.log10(Pvap(T, d)); if (first) { cx.moveTo(sx(T), sy(lv)); first = false; } else cx.lineTo(sx(T), sy(lv)); } cx.lineTo(sx(d.Tc), sy(Math.log10(d.Pc))); cx.stroke();
          cx.beginPath(); first = true; for (T = d.Tlo; T <= d.Tt; T += (d.Tt - d.Tlo) / 60) { var ls = Math.log10(Psub(T, d)); if (ls < d.lp0) continue; if (first) { cx.moveTo(sx(T), sy(ls)); first = false; } else cx.lineTo(sx(T), sy(ls)); } cx.stroke();
          cx.beginPath(); var Pm0 = d.Pt, Pm1 = Math.pow(10, d.lp1); cx.moveTo(sx(d.Tt), sy(Math.log10(Pm0))); var Te = Tm(Pm1, d); cx.lineTo(sx(Math.max(d.Tlo, Math.min(d.Thi, Te))), sy(d.lp1)); cx.stroke(); cx.lineWidth = 1;
          cx.fillStyle = c.ink; cx.beginPath(); cx.arc(sx(d.Tt), sy(Math.log10(d.Pt)), 4.5, 0, 7); cx.fill(); cx.save(); cx.translate(sx(d.Tc), sy(Math.log10(d.Pc))); cx.rotate(Math.PI / 4); cx.fillRect(-4, -4, 8, 8); cx.restore();
          cx.font = '600 11px system-ui'; cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText("SOLID", sx(d.Tlo + (d.Tt - d.Tlo) * .45), sy(d.lp0 + (d.lp1 - d.lp0) * .75)); cx.fillText("LIQUID", sx(d.Tt + (d.Tc - d.Tt) * .6), sy(d.lp0 + (d.lp1 - d.lp0) * .7)); cx.fillText('GAS', sx(d.Tt + (d.Thi - d.Tt) * .6), sy(d.lp0 + (d.lp1 - d.lp0) * .12)); cx.fillText("SUPERCRITICAL", sx(Math.min(d.Thi - 62, d.Tc + (d.Thi - d.Tc) * .5)), sy(Math.log10(d.Pc) + (d.lp1 - Math.log10(d.Pc)) * .55));
          cx.font = 'italic 10px system-ui'; cx.fillStyle = c.muted; cx.textAlign = 'left';
          var Tsb_ = d.Tlo + (d.Tt - d.Tlo) * .3, Tv_ = d.Tt + (d.Tc - d.Tt) * .3, lpf_ = d.lp0 + (d.lp1 - d.lp0) * .55, Pmv_ = Math.pow(10, lpf_);
          cx.fillText("sublimation", sx(Tsb_) + 6, sy(Math.log10(Psub(Tsb_, d))) + 12); cx.fillText("vaporization", sx(Tv_) + 6, sy(Math.log10(Pvap(Tv_, d))) + 14); cx.textAlign = d.dmelt < 0 ? 'right' : 'left'; cx.fillText("melting", sx(Tm(Pmv_, d)) + (d.dmelt < 0 ? -5 : 5), sy(lpf_));
          var px = sx(Math.max(d.Tlo, Math.min(d.Thi, S.T))), py = sy(Math.max(d.lp0, Math.min(d.lp1, S.lp)));
          cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.6; cx.beginPath(); cx.arc(px, py, 6, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
        { title: "Heating curve at the current pressure", h: 210, note: "Plateaus where a phase change occurs (constant T while heat is absorbed). The dot marks the current T.", draw: function (cx, w, h, c) {
          var d = D(), P = Pnow(), L = 46, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, segs = [], T = d.Tlo, prev = info(T, P, d), E = 0, pts_ = [[0, T]], cp = function (r) { return r.s >= .5 ? d.cs : (r.l >= .5 ? d.cl : d.cg); };
          var ph0 = function (r) { return r.s >= .5 ? 's' : (r.l >= .5 ? 'l' : 'g'); }, last = ph0(prev), x;
          for (T = d.Tlo + 1; T <= d.Thi; T += 1) { var r = info(T, P, d), p1 = ph0({ s: r.s, l: r.l, g: r.g + r.sc }); if (r.coex) { continue; } if (p1 !== last) { var dh = (last === 's' && p1 === 'l') ? d.Hf : ((last === 'l' && p1 === 'g') ? d.Hv : (last === 's' && p1 === 'g' ? d.Hf + d.Hv : 0)); if (T >= d.Tc && P >= d.Pc) dh = 0; if (P >= d.Pc && last === 'l') dh = 0; E += dh; pts_.push([E, T - .5]); } E += cp(r); pts_.push([E, T]); last = p1; }
          var Emax = pts_[pts_.length - 1][0], sxx = function (e) { return L + pw * e / Emax; }, syy = function (t) { return Tp + ph - ph * (t - d.Tlo) / (d.Thi - d.Tlo); };
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(d.Tlo + (d.Thi - d.Tlo) * i / 4, 0), L - 5, y + 3); }
          cx.textAlign = 'center'; cx.fillText("heat absorbed (J/mol) · y axis: T (K)", L + pw / 2, h - 3);
          cx.strokeStyle = '#2f9e8f'; cx.lineWidth = 2.6; cx.beginPath(); pts_.forEach(function (p, k) { if (k === 0) cx.moveTo(sxx(p[0]), syy(p[1])); else cx.lineTo(sxx(p[0]), syy(p[1])); }); cx.stroke(); cx.lineWidth = 1;
          var cur_ = pts_.reduce(function (a, p) { return Math.abs(p[1] - S.T) < Math.abs(a[1] - S.T) ? p : a; }, pts_[0]);
          cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sxx(cur_[0]), syy(cur_[1]), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
        { title: "Vapor pressure (Clausius–Clapeyron)", h: 190, note: "ln P versus 1/T is almost a straight line of slope −ΔH<sub>vap</sub>/R. The dot marks the current T on the curve.", draw: function (cx, w, h, c) {
          var d = D(), L = 46, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, u0 = 1 / d.Tc, u1 = 1 / d.Tt, l0 = Math.log10(d.Pt), l1 = Math.log10(d.Pc);
          var sx = function (u) { return L + pw * (u1 - u) / (u1 - u0); }, sy = function (l) { return Tp + ph - ph * (l - l0) / (l1 - l0); };
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText('10^' + fmt(l0 + (l1 - l0) * i / 4, 1), L - 5, y + 3); }
          cx.textAlign = 'center'; cx.fillText("1000/T (K⁻¹): right = low T", L + pw / 2, h - 3);
          cx.strokeStyle = '#2f9e8f'; cx.lineWidth = 2.6; cx.beginPath(); for (var k = 0; k <= 60; k++) { var u = u0 + (u1 - u0) * k / 60, lp = Math.log10(Math.exp(d.cv[0] + d.cv[1] * u + d.cv[2] * u * u)); if (k === 0) cx.moveTo(sx(u), sy(lp)); else cx.lineTo(sx(u), sy(lp)); } cx.stroke(); cx.lineWidth = 1;
          var Tq = Math.max(d.Tt, Math.min(d.Tc, S.T)); cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(1 / Tq), sy(Math.log10(Pvap(Tq, d))), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }
      ],
      calc: function () {
        var d = D(), P = Pnow(), r = info(S.T, P), bp = Tbp(P), sb = Tsb(P), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, Tq = Math.max(d.Tt, Math.min(d.Tc, S.T));
        return '<div class="card-kicker">' + d.name + ' (' + d.f + ")</div><div class=\"calc-step\">1 · Phase at (T, P)</div><table class=\"calc-table\">" + row('T', fmt(S.T, 2) + ' K = ' + fmt(S.T - 273.15, 2) + ' °C') + row('P', Ptxt(P) + ' = ' + MSim.sci(P / ATM, 3) + ' atm') + row("Stable phase", '<b>' + r.name + '</b>') + '</table>' +
          "<div class=\"calc-step\">2 · Points and curves at that pressure</div><table class=\"calc-table\">" + row("Triple point", fmt(d.Tt, 2) + ' K · ' + Ptxt(d.Pt)) + row("Critical point", fmt(d.Tc, 1) + ' K · ' + Ptxt(d.Pc)) + row("Boiling T", isNaN(bp) ? "none (P outside [P<sub>t</sub>, P<sub>c</sub>])" : '<b>' + fmt(bp, 2) + ' K</b> = ' + fmt(bp - 273.15, 2) + ' °C') + row("Sublimation T", isNaN(sb) ? "not applicable (P ≥ P<sub>t</sub>)" : '<b>' + fmt(sb, 2) + ' K</b>') + row("Melting T", P >= d.Pt ? '<b>' + fmt(Tm(P), 3) + ' K</b>' : "not applicable") + '</table>' +
          "<div class=\"calc-step\">3 · Clausius–Clapeyron at T = " + fmt(Tq, 1) + ' K</div><table class="calc-table">' + row("Vapor P", Ptxt(Pvap(Tq, d))) + row('ΔH<sub>vap</sub> = −R·d(ln P)/d(1/T)', '<b>' + fmt(dHv(Tq, d), 1) + ' kJ/mol</b>') + row("Melting slope dP/dT", fmt(d.dmelt / 1e6, 2) + ' MPa/K (' + (d.dmelt < 0 ? "negative: ΔV<sub>fus</sub> &lt; 0" : "positive") + ')') + row("Phase rule", 'F = C − P + 2 = ' + (r.coex === 'triple' ? '0' : (r.coex ? '1' : '2')) + (r.coex === 'triple' ? ' (triple)' : (r.coex ? " (on a curve)" : " (one phase)"))) + '</table>';
      },
      quiz: [
        { q: "What happens at the triple point?", options: ["Solid, liquid and gas coexist in equilibrium", "The liquid–gas distinction disappears", "The solid sublimes", "There is only gas"], answer: 0, why: "The triple point is the only (T, P) at which the three phases are in equilibrium (F = 0)." },
        { q: "What are T and P of the triple point of water?", options: ["273.16 K and 611.66 Pa", "273.15 K and 101,325 Pa", "373.15 K and 101,325 Pa", "647.1 K and 22.06 MPa"], answer: 0, why: "The triple point of water is 273.16 K and ≈0.006 atm. 647.1 K and 22.06 MPa is the critical point." },
        { q: "Above T<sub>c</sub> and P<sub>c</sub> the substance is…", options: ["a supercritical fluid", "a solid", "a liquid", "an ideal gas"], answer: 0, why: "There is no liquid–gas interface: the supercritical fluid has intermediate properties." },
        { q: "The melting curve of water has a negative slope because…", options: ["ice is less dense than liquid water", "water is polar", "ΔH<sub>fus</sub> is negative", "water boils at 100 °C"], answer: 0, why: "ΔV<sub>fus</sub> &lt; 0; by Clapeyron, dP/dT = ΔH/(TΔV) &lt; 0: more pressure favors the liquid." },
        { q: "At 1 atm, solid CO₂…", options: ["sublimes (there is no liquid)", "melts at −56.6 °C", "boils at 100 °C", "always remains solid"], answer: 0, why: "The triple point of CO₂ is at 5.1 atm; below that pressure it goes directly from solid to gas (−78.5 °C)." },
        { q: "Lowering the external pressure on boiling water makes the boiling point…", options: ["decrease", "increase", "not change", "reach the critical point"], answer: 0, why: "It boils when vapor P = external P; with lower external P it is reached at lower T (pressure cookers: the opposite)." },
        { q: "According to the phase rule (C = 1), on a two-phase equilibrium curve F equals…", options: ['1', '0', '2', '3'], answer: 0, why: "F = C − P + 2 = 1 − 2 + 2 = 1: T can be varied and P is fixed (or vice versa)." },
        { q: "In a P–T diagram, the slope of the liquid–gas curve is related to…", options: ["ΔH<sub>vap</sub> (Clausius–Clapeyron)", "the molar mass", "polarity only", "the volume of the container"], answer: 0, why: "d ln P/dT = ΔH<sub>vap</sub>/(RT²): the greater the ΔH<sub>vap</sub>, the steeper the curve." }
      ],
      help: { intro: "Follow the lesson or choose substance, T and P in “Lab”; the container shows the phase and the diagram the current point.", items: [["Container", "the particles show the order of each phase; the piston rises with the volume."], ["Diagram", "melting, vaporization and sublimation curves, with triple and critical points."], ["Heating", "plateaus at the chosen pressure."], ["Calculation", "phase-change T and ΔH<sub>vap</sub> from Clausius–Clapeyron."]] }
    };
  }
  MSim.create(def_());
})();
