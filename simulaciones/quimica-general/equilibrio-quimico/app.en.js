/* Equilibrio químico y principio de Le Châtelier — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js. Kc(T) por van 't Hoff; constantes de referencia aproximadas (didácticas). */
(function () {
  'use strict';
  var T = THREE, kit;
  var fmt = SimKit.fmt, clamp = SimKit.clamp;
  function log10(x) { return Math.log(x) / Math.LN10; }
  function kvr(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function sci(x) { if (x === 0) return '0'; var e = Math.floor(log10(Math.abs(x))); if (e > -3 && e < 4) return fmt(x, Math.abs(x) < 1 ? 4 : 2); var m = x / Math.pow(10, e); return fmt(m, 2) + ' × 10^' + e; }
  var Rg = 8.314;

  /* ------------------------- Datos ------------------------- */
  var EL = { H: { c: 0xf2f2f2, r: 0.31 }, N: { c: 0x4f7cff, r: 0.71 }, O: { c: 0xff4d4d, r: 0.66 }, I: { c: 0x9a4fd0, r: 1.05 }, S: { c: 0xe6c229, r: 1.0 } };
  var GEO = {
    N2: { f: 'N₂', a: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]], b: [[0, 1]] },
    H2: { f: 'H₂', a: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]], b: [[0, 1]] },
    NH3: { f: 'NH₃', a: [['N', 0, 0.12, 0], ['H', 0.94, -0.28, 0], ['H', -0.47, -0.28, 0.81], ['H', -0.47, -0.28, -0.81]], b: [[0, 1], [0, 2], [0, 3]] },
    N2O4: { f: 'N₂O₄', a: [['N', -0.89, 0, 0], ['N', 0.89, 0, 0], ['O', -1.5, 0.95, 0], ['O', -1.5, -0.95, 0], ['O', 1.5, 0.95, 0], ['O', 1.5, -0.95, 0]], b: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]] },
    NO2: { f: 'NO₂', a: [['N', 0, 0.3, 0], ['O', 1.1, -0.17, 0], ['O', -1.1, -0.17, 0]], b: [[0, 1], [0, 2]] },
    I2: { f: 'I₂', a: [['I', -1.33, 0, 0], ['I', 1.33, 0, 0]], b: [[0, 1]] },
    HI: { f: 'HI', a: [['H', -0.8, 0, 0], ['I', 0.8, 0, 0]], b: [[0, 1]] },
    SO2: { f: 'SO₂', a: [['S', 0, 0.35, 0], ['O', 1.24, -0.36, 0], ['O', -1.24, -0.36, 0]], b: [[0, 1], [0, 2]] },
    O2: { f: 'O₂', a: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], b: [[0, 1]] },
    SO3: { f: 'SO₃', a: [['S', 0, 0, 0], ['O', 1.42, 0, 0], ['O', -0.71, 0, 1.23], ['O', -0.71, 0, -1.23]], b: [[0, 1], [0, 2], [0, 3]] }
  };
  function fm(id) { return GEO[id].f; }
  // sp: [id, coef] coef<0 reactivo, >0 producto
  var SYS = {
    haber: { name: "Ammonia synthesis", eq: 'N₂ + 3 H₂ ⇌ 2 NH₃', sp: [['N2', -1], ['H2', -3], ['NH3', 2]], n0: [0.5, 1.5, 0], V0: 2, T0: 700, Tr: [500, 900], K0: 0.06, Tref: 773, dH: -92, sc: 20, add: 0.4, dT: 100, tint: null, note: "Exothermic; 4 mol of gas → 2 mol of gas." },
    no2: { name: "Nitrogen dioxide dimer", eq: 'N₂O₄ ⇌ 2 NO₂', sp: [['N2O4', -1], ['NO2', 2]], n0: [0.2, 0], V0: 2, T0: 340, Tr: [290, 420], K0: 0.0059, Tref: 298, dH: 57, sc: 150, add: 0.06, dT: 40, tint: { id: 'NO2', col: 0xb5651d, k: 3.2 }, note: "Endothermic; NO₂ is brown and N₂O₄ colorless." },
    hi: { name: "Formation of hydrogen iodide", eq: 'H₂ + I₂ ⇌ 2 HI', sp: [['H2', -1], ['I2', -1], ['HI', 2]], n0: [0.5, 0.5, 0], V0: 2, T0: 700, Tr: [500, 900], K0: 54, Tref: 700, dH: -10, sc: 36, add: 0.3, dT: 150, tint: { id: 'I2', col: 0x7b2fbf, k: 3.0 }, note: "Δn(gas) = 0: pressure does not shift the equilibrium. I₂ is violet." },
    so3: { name: "Synthesis of sulfur trioxide (contact)", eq: '2 SO₂ + O₂ ⇌ 2 SO₃', sp: [['SO2', -2], ['O2', -1], ['SO3', 2]], n0: [1.0, 0.5, 0], V0: 2, T0: 1000, Tr: [700, 1300], K0: 280, Tref: 1000, dH: -198, sc: 24, add: 0.3, dT: 200, tint: null, note: "Exothermic; 3 mol of gas → 2 mol of gas (contact process)." }
  };
  var P = { sys: 'haber', manual: false, camGoal: null };
  var st, ui = {}, hist = [], events = [], simT = 0, histAcc = 0, ice0 = null;

  function S() { return SYS[P.sys]; }
  function Kof(T0) { var s = S(); return s.K0 * Math.exp(-s.dH * 1000 / Rg * (1 / T0 - 1 / s.Tref)); }
  function newState() { var s = S(); return { n: s.n0.slice(), V: s.V0, T: s.T0, cat: false }; }
  function lnQ(n, V) { var s = S(), q = 0; for (var i = 0; i < s.sp.length; i++) q += s.sp[i][1] * Math.log(Math.max(n[i], 1e-12) / V); return q; }
  function Q(n, V) { return Math.exp(lnQ(n, V)); }
  function dxEq(n, V, T0) {
    var s = S(), lnK = Math.log(Kof(T0)), lo = -1e9, hi = 1e9;
    s.sp.forEach(function (sp, i) { var c = sp[1]; if (c > 0) lo = Math.max(lo, -n[i] / c); else hi = Math.min(hi, n[i] / -c); });
    if (lo < -1e8) lo = -1e3; if (hi > 1e8) hi = 1e3;
    var a = lo + 1e-12, b = hi - 1e-12;
    for (var k = 0; k < 80; k++) { var m = (a + b) / 2, nn = n.map(function (x, i) { return Math.max(x + s.sp[i][1] * m, 1e-12); }); if (lnQ(nn, V) > lnK) b = m; else a = m; }
    return (a + b) / 2;
  }
  function relax(state) { var d = dxEq(state.n, state.V, state.T), s = S(); state.n = state.n.map(function (x, i) { return Math.max(x + s.sp[i][1] * d, 0); }); return state; }
  function clone(x) { return { n: x.n.slice(), V: x.V, T: x.T, cat: x.cat }; }
  function dirOf(q, k) { var r = Math.log(q / k); return Math.abs(r) < 1e-3 ? 0 : (r < 0 ? 1 : -1); }
  function dirTxt(d) { return d === 0 ? "equilibrium (Q = K)" : d > 0 ? "toward the products (→)" : "toward the reactants (←)"; }
  function nGas(n) { return n.reduce(function (a, b) { return a + b; }, 0); }
  function dnGas() { return S().sp.reduce(function (a, x) { return a + x[1]; }, 0); }

  /* acciones de la lección */
  function action(i, x) {
    var s = S(), last = s.sp.length - 1;
    if (i === 2) x.n[0] += s.add;
    if (i === 3) x.V = s.V0 / 2;
    if (i === 4) x.T = x.T + s.dT;
    if (i === 5) { x.cat = true; x.n[last] += s.add; }
  }
  function replayPre(i) { var x = newState(); for (var j = 1; j <= i; j++) { relax(x); action(j, x); } return x; }
  var INFO = [];
  function computeInfo() {
    INFO = []; for (var i = 0; i < 6; i++) {
      var x = replayPre(i), pre = clone(x), q = Q(x.n, x.V), k = Kof(x.T), post = relax(clone(x));
      INFO.push({ pre: pre, post: post, q: q, k: k, dir: dirOf(q, k) });
    }
  }

  /* ------------------------- Lección ------------------------- */
  var STAGES = [0, 1, 2, 3, 4, 5].map(function () { return { name: '', short: '', title: '', text: '', dur: 12 }; });
  function cfix(n, V) { return n.map(function (x) { return x / V; }); }
  function stagesList() {
    var s = S(), e = INFO, kk = s.name, dn = dnGas(), r0 = fm(s.sp[0][0]), lastId = fm(s.sp[s.sp.length - 1][0]);
    var Kst = Kof(s.T0), dT = s.dT;
    var vtxt = dn === 0 ? "Since Δn(gas) = 0, compressing does not change Q: <b>there is no shift</b>; only all the concentrations rise." : (dn < 0 ? "On reducing the volume (more pressure) the system opposes it by decreasing the moles of gas: <b>it shifts toward the side with fewer gaseous moles</b> (the products)." : "On reducing the volume (more pressure) the system opposes it by decreasing the moles of gas: <b>it shifts toward the side with fewer gaseous moles</b> (the reactants).");
    var ttxt = s.dH < 0 ? "The forward reaction is <b>exothermic</b>: heating favors the reverse (endothermic) reaction. <b>K decreases</b>: " + fmt(e[4].k / 1, 3) + " (new T)." : "The forward reaction is <b>endothermic</b>: heating favors it. <b>K increases</b>: " + fmt(e[4].k, 3) + " (new T).";
    return [
      ["Dynamic equilibrium", "Equilibrium", "Only reactants are present: the reaction advances to equilibrium",
        '<p>' + s.eq + ' (' + s.name + '). ' + s.note + "</p><p>At first only the reactants react; as products appear, the reverse reaction speeds up until it equals the forward one. At equilibrium the <b>rates are equal</b> and the concentrations <b>stop changing</b>, although the molecules keep reacting.</p>"],
      ["Q versus K", 'Q y K', "Q = K: the system is at equilibrium (K = " + fmt(e[1].k, 3) + ')',
        "<p>The <b>reaction quotient Q</b> has the form of Kc with the concentrations of the moment. If <b>Q &lt; K</b> the reaction advances toward products; if <b>Q &gt; K</b>, toward reactants; if <b>Q = K</b>, it is at equilibrium.</p><p>Here Q = K = <b>" + sci(e[1].k) + '</b> a ' + fmt(s.T0, 0) + ' K.</p>'],
      ["Add reactant", "Concentration", "Added " + r0 + ': Q < K, el sistema avanza ' + dirTxt(e[2].dir),
        "<p>On adding <b>" + fmt(s.add, 2) + " mol of " + r0 + "</b>, Q drops to <b>" + sci(e[2].q) + '</b> (K = ' + sci(e[2].k) + "). Since Q &lt; K, the reaction shifts <b>" + dirTxt(e[2].dir) + "</b> to consume part of the excess.</p><p>K does not change: only the composition changes.</p>"],
      ["Volume and pressure", "Pressure", "Compressed to half the volume: " + (dn === 0 ? "Q = K, no shift" : "Q ≠ K, shift " + dirTxt(e[3].dir)),
        "<p>V goes from " + fmt(s.V0, 1) + ' L a <b>' + fmt(s.V0 / 2, 1) + " L</b> (total pressure ×2). Q = <b>" + sci(e[3].q) + "</b> versus K = " + sci(e[3].k) + '.</p><p>' + vtxt + '</p>'],
      ["Temperature", "Temperature", "Heated " + fmt(dT, 0) + " K: K changes and the equilibrium shifts " + dirTxt(e[4].dir),
        "<p>It is the <b>only</b> factor that modifies the value of K. T goes from " + fmt(e[4].pre.T - dT, 0) + ' K a <b>' + fmt(e[4].pre.T, 0) + ' K</b>.</p><p>' + ttxt + '</p>'],
      ["Catalyst", "Catalyst", "The catalyst speeds things up, but does not change K or the final composition",
        "<p>The catalyst is activated and these are added: " + fmt(s.add, 2) + " mol of " + lastId + ". The system returns to Q = K <b>about 6 times faster</b>, but the final position of the equilibrium is the one corresponding to K: <b>the catalyst speeds up the forward and reverse reactions equally</b>.</p><p>Adding an <b>inert gas at constant volume</b> does not shift the equilibrium either: it does not change the concentrations.</p>"]
    ];
  }
  function refreshStageUI() {
    computeInfo(); var arr = stagesList();
    arr.forEach(function (a, i) { var t = STAGES[i]; t.name = a[0]; t.short = a[1]; t.title = a[2]; t.text = a[3]; });
    if (!kit) return;
    var s = STAGES[kit.state.stage];
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
  }

  /* ------------------------- Escena ------------------------- */
  var scene, camera, renderer, labelRenderer, controls, gRoot, box, tint, tintMat, piston, pistonRod, heat, heatMat, labels = {}, pools = [], matEl = {}, bondMat, sphereGeo, cylGeo, hAnim = 4.4, Wh = 3.7;
  var GS = 0.5, AR = 0.42;
  function mkLabel(txt, cls) {
    var d = document.createElement('div'); d.className = 'bond-label ' + cls; d.textContent = txt;
    var o = new T.CSS2DObject(d); return { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; } };
  }
  function hOf(V) { return 2.2 * V; }
  function mkMol(fid) {
    var g = new T.Group(), geo = GEO[fid];
    geo.a.forEach(function (a) { var m = new T.Mesh(sphereGeo, matEl[a[0]]); m.scale.setScalar(EL[a[0]].r * AR); m.position.set(a[1] * GS, a[2] * GS, a[3] * GS); g.add(m); });
    geo.b.forEach(function (b) {
      var p = new T.Vector3(geo.a[b[0]][1], geo.a[b[0]][2], geo.a[b[0]][3]).multiplyScalar(GS), q = new T.Vector3(geo.a[b[1]][1], geo.a[b[1]][2], geo.a[b[1]][3]).multiplyScalar(GS);
      var c = new T.Mesh(cylGeo, bondMat), d = q.clone().sub(p), len = d.length(); c.scale.set(0.06, len, 0.06); c.position.copy(p).add(q).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(c);
    });
    return g;
  }
  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene(); camera = new T.PerspectiveCamera(45, 1, 0.1, 200); camera.position.set(0, 7, 24);
    renderer = new T.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer(); labelRenderer.domElement.className = 'labels-layer'; cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06; controls.minDistance = 8; controls.maxDistance = 60; controls.target.set(0, 4, 0);
    controls.addEventListener('start', function () { P.camGoal = null; });
    scene.add(new T.AmbientLight(0xffffff, 0.85));
    var dl = new T.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 16, 12); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x88aaff, 0.4); dl2.position.set(-8, 4, -8); scene.add(dl2);
    sphereGeo = new T.SphereGeometry(1, 16, 12); cylGeo = new T.CylinderGeometry(1, 1, 1, 8, 1, true);
    Object.keys(EL).forEach(function (k) { matEl[k] = new T.MeshStandardMaterial({ color: EL[k].c, roughness: 0.4, metalness: 0.1 }); });
    bondMat = new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 });
    gRoot = new T.Group(); scene.add(gRoot);
    var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.13, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
    box = new T.Mesh(new T.BoxGeometry(2 * Wh + 0.3, 1, 2 * Wh + 0.3), gm); scene.add(box);
    tintMat = new T.MeshBasicMaterial({ color: 0xb5651d, transparent: true, opacity: 0, depthWrite: false }); tint = new T.Mesh(new T.BoxGeometry(2 * Wh + 0.2, 1, 2 * Wh + 0.2), tintMat); scene.add(tint);
    piston = new T.Mesh(new T.BoxGeometry(2 * Wh + 0.5, 0.3, 2 * Wh + 0.5), new T.MeshStandardMaterial({ color: 0x59667a, roughness: 0.6 })); scene.add(piston);
    pistonRod = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 8, 12), new T.MeshStandardMaterial({ color: 0x8a97a8 })); scene.add(pistonRod);
    var plate = new T.Mesh(new T.BoxGeometry(2 * Wh + 1.4, 0.3, 2 * Wh + 1.4), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; scene.add(plate);
    heatMat = new T.MeshBasicMaterial({ color: 0xff6030, transparent: true, opacity: 0 }); heat = new T.Mesh(new T.BoxGeometry(2 * Wh + 1.2, 0.12, 2 * Wh + 1.2), heatMat); heat.position.y = -0.34; scene.add(heat);
    labels.T = mkLabel('', 'bl-warn'); scene.add(labels.T.o); labels.V = mkLabel('', 'bl-d'); scene.add(labels.V.o); labels.state = mkLabel('', 'bl-lead'); scene.add(labels.state.o);
    buildPools();
  }
  var SPC = { 0: 'bl-d' };
  function buildPools() {
    pools.forEach(function (p) { p.list.forEach(function (m) { gRoot.remove(m.g); }); }); pools = [];
    S().sp.forEach(function () { pools.push({ list: [] }); });
  }
  function randPos() { var h = hAnim; return new T.Vector3((Math.random() * 2 - 1) * (Wh - 0.8), 0.6 + Math.random() * Math.max(0.3, h - 1.2), (Math.random() * 2 - 1) * (Wh - 0.8)); }
  function syncCounts(snap) {
    var s = S();
    s.sp.forEach(function (sp, i) {
      var want = Math.min(120, Math.round(st.n[i] * s.sc)), pl = pools[i];
      while (pl.list.length < want) { var g = mkMol(sp[0]); g.position.copy(randPos()); var sp2 = 1; var v = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); gRoot.add(g); pl.list.push({ g: g, v: v, ph: Math.random() * 6.28 }); }
      while (pl.list.length > want) { var k = Math.floor(Math.random() * pl.list.length), m = pl.list.splice(k, 1)[0]; gRoot.remove(m.g); }
    });
  }
  function updateScene(t, dt) {
    var s = S(), hT = hOf(st.V); hAnim += (hT - hAnim) * Math.min(1, dt * 4);
    var h = hAnim; box.scale.y = h; box.position.y = h / 2; tint.scale.y = h; tint.position.y = h / 2; piston.position.y = h + 0.15; pistonRod.position.y = h + 4;
    var speed = 3.0 * Math.sqrt(st.T / s.Tr[0]) * (st.cat ? 1 : 1), cs = st.n.map(function (x) { return x / st.V; });
    if (s.tint) { var idx = s.sp.findIndex(function (z) { return z[0] === s.tint.id; }); tintMat.color.setHex(s.tint.col); tintMat.opacity = clamp(cs[idx] * s.tint.k, 0, 0.5); } else tintMat.opacity = 0;
    heatMat.opacity = clamp((st.T - s.Tr[0]) / (s.Tr[1] - s.Tr[0]), 0, 1) * 0.9; heatMat.color.setHSL(0.04 + 0.04 * (1 - (st.T - s.Tr[0]) / (s.Tr[1] - s.Tr[0])), 1, 0.5);
    syncCounts();
    var R = Wh - 0.3, top = h - 0.35;
    pools.forEach(function (pl, i) {
      pl.list.forEach(function (m) {
        var p = m.g.position, v = m.v;
        p.x += v.x * speed * dt; p.y += v.y * speed * dt; p.z += v.z * speed * dt;
        if (p.x < -R) { p.x = -R; v.x = Math.abs(v.x); } if (p.x > R) { p.x = R; v.x = -Math.abs(v.x); }
        if (p.z < -R) { p.z = -R; v.z = Math.abs(v.z); } if (p.z > R) { p.z = R; v.z = -Math.abs(v.z); }
        if (p.y < 0.4) { p.y = 0.4; v.y = Math.abs(v.y); } if (p.y > top) { p.y = top; v.y = -Math.abs(v.y); }
        m.g.rotation.x += dt * (0.8 + m.ph * 0.1); m.g.rotation.y += dt * 1.1;
      });
    });
    var showL = kit.layer('labels');
    labels.T.o.position.set(Wh + 2.6, 1.2, 0); labels.T.set(fmt(st.T, 0) + ' K', 'bl-warn');
    labels.V.o.position.set(-Wh - 2.8, h / 2, 0); labels.V.set('V = ' + fmt(st.V, 2) + ' L', 'bl-d');
    var q = Q(st.n, st.V), k = Kof(st.T), d = dirOf(q, k);
    labels.state.o.position.set(0, h + 1.9, 0); labels.state.set(d === 0 ? "Q = K · equilibrium" : (d > 0 ? 'Q < K → productos' : "Q > K → reactants"), d === 0 ? 'bl-neg' : 'bl-lead');
    ['T', 'V', 'state'].forEach(function (z) { labels[z].o.visible = showL; });
    return { q: q, k: k, d: d, cs: cs };
  }
  function resize() {
    if (!renderer) return; var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight; if (w < 2 || h < 2) return;
    camera.aspect = w / h; camera.zoom = clamp(camera.aspect / 1.6, 0.5, 1.15) * (w > 900 ? 1.0 : 0.9);
    var off = w > 900 ? Math.min(250, w * 0.24) : 0; if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }
  function viewGoal(id) {
    if (id === 'frontal') return { pos: new T.Vector3(0, 5, 24), target: new T.Vector3(0, 4, 0) };
    if (id === 'lado') return { pos: new T.Vector3(24, 7, 4), target: new T.Vector3(0, 4, 0) };
    if (id === 'superior') return { pos: new T.Vector3(0, 28, 3), target: new T.Vector3(0, 2, 0) };
    return { pos: new T.Vector3(0, 7, 24), target: new T.Vector3(0, 4, 0) };
  }

  /* ------------------------- Control ------------------------- */
  var lastQ = 1, lastK = 1, cs0 = [];
  function mark(label) { events.push({ t: simT, label: label }); ice0 = clone(st); }
  function goManual() { if (!P.manual) { P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); }
  function resetHist() { hist = []; events = []; simT = 0; histAcc = 0; }
  function resetSys(keepStage) { st = newState(); ice0 = clone(st); resetHist(); }
  function setSys(id) { P.sys = id; buildPools(); hAnim = hOf(SYS[id].V0); resetSys(); refreshStageUI(); syncHud(); buildSpBtns(); syncCtrl(); redrawAll(); }
  var lastStg = -1;
  function enterStage(i) { var seq = (i === lastStg + 1 && i > 0); lastStg = i; st = replayPre(i); ice0 = clone(st); if (!seq) resetHist(); events.push({ t: simT, label: STAGES[i].short }); }
  function addSp(i, dn) { goManual(); if (dn > 0) st.n[i] += dn; else st.n[i] = Math.max(0, st.n[i] * 0.5); mark((dn > 0 ? '+' : '−') + fm(S().sp[i][0])); }
  function buildSpBtns() {
    if (!ui.spBtns) return; ui.spBtns.innerHTML = '';
    S().sp.forEach(function (sp, i) {
      var r = document.createElement('div'); r.className = 'row'; r.innerHTML = '<button class="btn">+ ' + fm(sp[0]) + '</button><button class="btn">− ' + fm(sp[0]) + ' (50 %)</button>';
      var b = r.querySelectorAll('button'); b[0].addEventListener('click', function () { addSp(i, S().add); }); b[1].addEventListener('click', function () { addSp(i, -1); });
      ui.spBtns.appendChild(r);
    });
  }
  function syncCtrl() {
    if (ui.sT) { ui.sT.querySelector('input').min = S().Tr[0]; ui.sT.querySelector('input').max = S().Tr[1]; ui.sT.set(st.T); ui.sV.set(st.V); }
    if (ui.sysOpts) ui.sysOpts.set(P.sys); if (ui.catBtn) ui.catBtn.textContent = st.cat ? "Catalyst: ON" : "Catalyst: OFF"; updateInfo();
  }
  function kcExpr() { var s = S(), num = [], den = []; s.sp.forEach(function (sp) { var t = '[' + fm(sp[0]) + ']' + (Math.abs(sp[1]) > 1 ? ['', '', '²', '³'][Math.abs(sp[1])] : ''); (sp[1] > 0 ? num : den).push(t); }); return num.join(' ') + ' / ' + den.join(' '); }
  function syncHud() {
    var s = S(), k = Kof(st.T), q = Q(st.n, st.V);
    kit.setEq({ chip: "Equilibrium", name: s.eq, body:
      '<div class="eqline"><small>Kc = ' + kcExpr() + '</small>' + sci(k) + ' (a ' + fmt(st.T, 0) + ' K)</div>' +
      "<div class=\"eqline\"><small>Q now</small>" + sci(q) + '</div>' +
      "<div class=\"eqline\"><small>Spontaneous direction</small>" + dirTxt(dirOf(q, k)) + '</div>' +
      '<small>ΔH = ' + fmt(s.dH, 0) + ' kJ/mol (' + (s.dH < 0 ? "exothermic" : "endothermic") + ') · Δn(gas) = ' + (dnGas() > 0 ? '+' : '') + dnGas() + '</small>' });
    kit.setLegend(s.sp.map(function (sp) { var g = GEO[sp[0]], el = g.a[0][0], c = '#' + ('000000' + EL[el].c.toString(16)).slice(-6); return { label: fm(sp[0]), color: c, text: sp[1] < 0 ? 'reactivo' : "product" }; }));
  }
  function updateInfo() {
    if (!ui.info) return; var s = S(), k = Kof(st.T), q = Q(st.n, st.V), P0 = nGas(st.n) * 0.08206 * st.T / st.V;
    ui.info.innerHTML = "<div class=\"card-kicker\">State</div>" + kvr("Kc (at " + fmt(st.T, 0) + ' K)', sci(k)) + kvr('Q', sci(q)) + kvr('Q / K', fmt(q / k, 3)) + kvr("Total pressure (ideal gas)", fmt(P0, 1) + ' atm') +
      s.sp.map(function (sp, i) { return kvr('[' + fm(sp[0]) + ']', fmt(st.n[i] / st.V, 4) + ' M'); }).join('');
  }

  /* ------------------------- Gráficos ------------------------- */
  var COLS = ['#ff8a5c', '#4fa3ff', '#5ad1a6', '#e3b341'];
  function axes(ctx, w, h, c, o) {
    ctx.font = '10.5px system-ui, sans-serif'; ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) { var y = o.Tp + o.ph - o.ph * i / 4; ctx.beginPath(); ctx.moveTo(o.L, y); ctx.lineTo(o.L + o.pw, y); ctx.stroke(); ctx.fillText(o.fy(i / 4), o.L - 5, y + 3); }
  }
  function drawTime(ctx, w, h, c) {
    var L = 40, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, s = S(), tmax = Math.max(20, simT), t0 = Math.max(0, simT - 40), span = Math.max(20, simT - t0);
    var mx = 0.001; hist.forEach(function (p) { p.c.forEach(function (v) { mx = Math.max(mx, v); }); }); mx *= 1.1;
    axes(ctx, w, h, c, { L: L, Tp: Tp, ph: ph, pw: pw, fy: function (f) { return fmt(mx * f, mx < 0.1 ? 3 : 2); } });
    ctx.textAlign = 'center'; ctx.fillStyle = c.muted; ctx.fillText("time (s)", L + pw / 2, h - 4); ctx.fillText(fmt(t0, 0), L, h - B + 13); ctx.fillText(fmt(t0 + span, 0), L + pw, h - B + 13);
    var sx = function (t) { return L + pw * (t - t0) / span; }, sy = function (v) { return Tp + ph - ph * v / mx; };
    events.forEach(function (e) { if (e.t >= t0) { ctx.setLineDash([3, 3]); ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(sx(e.t), Tp); ctx.lineTo(sx(e.t), Tp + ph); ctx.stroke(); ctx.setLineDash([]); ctx.save(); ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.translate(sx(e.t) + 3, Tp + 8); ctx.fillText(e.label, 0, 0); ctx.restore(); } });
    s.sp.forEach(function (sp, i) {
      ctx.strokeStyle = COLS[i % 4]; ctx.lineWidth = 2.2; ctx.beginPath(); var f = true;
      hist.forEach(function (p) { if (p.t < t0) return; var x = sx(p.t), y = sy(p.c[i]); if (f) { ctx.moveTo(x, y); f = false; } else ctx.lineTo(x, y); }); ctx.stroke();
      ctx.fillStyle = COLS[i % 4]; ctx.textAlign = 'left'; ctx.font = '700 10.5px system-ui, sans-serif'; ctx.fillText(fm(sp[0]), L + 6 + i * 52, h - B - 4 - 0);
    }); ctx.lineWidth = 1;
  }
  function drawQK(ctx, w, h, c) {
    var L = 40, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, t0 = Math.max(0, simT - 40), span = Math.max(20, simT - t0);
    var vals = []; hist.forEach(function (p) { vals.push(log10(Math.max(p.q, 1e-12))); vals.push(log10(p.k)); }); if (!vals.length) vals = [0];
    var lo = Math.floor(Math.min.apply(null, vals) - 0.3), hi = Math.ceil(Math.max.apply(null, vals) + 0.3); if (hi - lo < 2) { hi += 1; lo -= 1; }
    var sx = function (t) { return L + pw * (t - t0) / span; }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
    axes(ctx, w, h, c, { L: L, Tp: Tp, ph: ph, pw: pw, fy: function (f) { return fmt(lo + (hi - lo) * f, 1); } });
    ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.fillText("time (s) · y axis: log₁₀", L + pw / 2, h - 4);
    var ln = function (key, col, wd) { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); var f = true; hist.forEach(function (p) { if (p.t < t0) return; var x = sx(p.t), y = sy(log10(Math.max(p[key], 1e-12))); if (f) { ctx.moveTo(x, y); f = false; } else ctx.lineTo(x, y); }); ctx.stroke(); };
    ln('k', '#ff6b3d', 2.2); ln('q', '#4fa3ff', 2.6); ctx.lineWidth = 1;
    ctx.font = '700 10.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#4fa3ff'; ctx.fillText('Q', L + 6, Tp + 11); ctx.fillStyle = '#ff6b3d'; ctx.fillText('K', L + 30, Tp + 11);
  }
  function drawKT(ctx, w, h, c) {
    var L = 40, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, s = S(), a = s.Tr[0], b = s.Tr[1], vs = [];
    for (var T0 = a; T0 <= b; T0 += (b - a) / 40) vs.push(log10(Kof(T0)));
    var lo = Math.floor(Math.min.apply(null, vs) - 0.2), hi = Math.ceil(Math.max.apply(null, vs) + 0.2);
    var sx = function (t) { return L + pw * (t - a) / (b - a); }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
    axes(ctx, w, h, c, { L: L, Tp: Tp, ph: ph, pw: pw, fy: function (f) { return fmt(lo + (hi - lo) * f, 1); } });
    ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.fillText("T (K) · y axis: log₁₀ K", L + pw / 2, h - 4); ctx.fillText(fmt(a, 0), L, h - B + 13); ctx.fillText(fmt(b, 0), L + pw, h - B + 13);
    ctx.strokeStyle = '#b392f0'; ctx.lineWidth = 2.4; ctx.beginPath(); for (var T1 = a, f = true; T1 <= b; T1 += (b - a) / 80) { var x = sx(T1), y = sy(log10(Kof(T1))); if (f) { ctx.moveTo(x, y); f = false; } else ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(sx(st.T), sy(log10(Kof(st.T))), 5.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  }
  function redrawAll() { ['g1', 'g2', 'g3'].forEach(function (k) { ui[k] && ui[k].redraw(); }); }
  function buildGraphs(el) {
    var c1 = kit.ui.card("Concentrations over time"); ui.g1 = kit.ui.canvas(c1, { height: 220, label: "Concentration of each species versus time", draw: drawTime });
    c1.insertAdjacentHTML('beforeend', "<p class=\"muted small\">The dotted lines mark each perturbation. After it the system readjusts until a new equilibrium.</p>");
    var c2 = kit.ui.card("Q versus K"); ui.g2 = kit.ui.canvas(c2, { height: 200, label: "Reaction quotient and equilibrium constant over time", draw: drawQK });
    c2.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Q moves away from K on perturbation and returns to it. K changes only with temperature (jump of the orange line).</p>");
    var c3 = kit.ui.card("K as a function of temperature"); ui.g3 = kit.ui.canvas(c3, { height: 190, label: "Logarithm of K versus temperature", draw: drawKT });
    c3.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Van 't Hoff equation: ln(K₂/K₁) = −ΔH/R · (1/T₂ − 1/T₁). Exothermic: K decreases on heating; endothermic: K increases.</p>");
    [c1, c2, c3].forEach(function (c) { el.appendChild(c); });
  }

  /* ------------------------- Cálculo ------------------------- */
  function calcRender() {
    if (!ui.calcOut) return; var s = S(), k = Kof(st.T), q = Q(st.n, st.V), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
    var h = "<div class=\"card-kicker\">Reaction quotient and shift</div><div class=\"muted small\">" + s.eq + '</div>';
    h += "<div class=\"calc-step\">1 · Expression of Q and K</div><table class=\"calc-table\">" + row('Kc', kcExpr()) + row('Kc (' + fmt(st.T, 0) + ' K)', '<b>' + sci(k) + '</b>') + '</table>';
    h += "<div class=\"calc-step\">2 · Q with the current concentrations</div><table class=\"calc-table\">" + s.sp.map(function (sp, i) { return row('[' + fm(sp[0]) + ']', fmt(st.n[i], 3) + ' mol ÷ ' + fmt(st.V, 2) + ' L = ' + fmt(st.n[i] / st.V, 4) + ' M'); }).join('') + row('Q', '<b>' + sci(q) + '</b>') + row('Q ÷ K', fmt(q / k, 3)) + row("Conclusion", '<b>' + dirTxt(dirOf(q, k)) + '</b>') + '</table>';
    if (ice0) {
      var d = dxEq(ice0.n, ice0.V, ice0.T), V = ice0.V;
      h += "<div class=\"calc-step\">3 · ICE table since the last perturbation (" + fmt(ice0.T, 0) + ' K, ' + fmt(V, 2) + ' L)</div><table class="calc-table"><tr><th></th><td><b>I (M)</b></td><td><b>C (M)</b></td><td><b>E (M)</b></td></tr>' +
        s.sp.map(function (sp, i) { var ci = ice0.n[i] / V, cc = sp[1] * d / V; return '<tr><th>' + fm(sp[0]) + '</th><td>' + fmt(ci, 4) + '</td><td>' + (cc >= 0 ? '+' : '−') + fmt(Math.abs(cc), 4) + '</td><td><b>' + fmt(Math.max(ci + cc, 0), 4) + '</b></td></tr>'; }).join('') + '</table>' +
        '<p class="muted small">x = ' + fmt(d / V, 4) + " M: Q(equilibrium) = K is solved. With x &gt; 0 it advances toward products.</p>";
    }
    ui.calcOut.innerHTML = h;
  }
  function buildCalc(el) { ui.calcOut = kit.ui.card(''); el.appendChild(ui.calcOut); calcRender(); }

  /* ------------------------- Desafío ------------------------- */
  var QUIZ = [
    { q: "In a dynamic chemical equilibrium…", options: ["The forward and reverse rates are equal", "The reactions stop", "The concentrations of reactants and products are equal", "Only the forward reaction occurs"], answer: 0, why: "Equilibrium is dynamic: both reactions keep occurring at the same rate, which is why the concentrations remain constant (not necessarily equal)." },
    { q: "If Q < K, the system…", options: ["Advances toward the products", "Advances toward the reactants", "Is already at equilibrium", "Changes the value of K"], answer: 0, why: 'Q < K indica pocos productos respecto del equilibrio: la reacción directa predomina hasta que Q = K.' },
    { q: "N₂ + 3 H₂ ⇌ 2 NH₃. When the pressure is increased (volume decreased) the equilibrium…", options: ["Shifts toward NH₃", "Shifts toward N₂ and H₂", "Does not shift", "Changes K"], answer: 0, why: "There are 4 mol of gas on the left and 2 on the right; higher pressure favors the side with fewer gaseous moles, that is, NH₃." },
    { q: "In an exothermic reaction, when the temperature is increased…", options: ["K decreases and the equilibrium shifts toward the reactants", "K increases and it shifts toward the products", "K does not change", "Only the rate changes"], answer: 0, why: "Heating favors the endothermic reaction (here the reverse). It is the only change that modifies the value of K (van 't Hoff)." },
    { q: "A catalyst in a system at equilibrium…", options: ["Speeds up both reactions without changing K or the equilibrium composition", "Increases the yield of products", "Increases K", "Shifts the equilibrium toward the products"], answer: 0, why: "The catalyst lowers the barrier of both directions equally: equilibrium is reached sooner, but its position does not change." },
    { q: "An inert gas (He) is added at constant volume to a mixture at gaseous equilibrium. The equilibrium…", options: ["Does not shift", "Shifts toward the side with more moles", "Shifts toward the side with fewer moles", "Changes K"], answer: 0, why: "At constant V the concentrations of the reacting species do not change: Q remains equal to K." },
    { q: "H₂ + I₂ ⇌ 2 HI. When the mixture is compressed to half its volume, the equilibrium…", options: ["Does not shift (Δn gas = 0)", "Shifts toward HI", "Shifts toward H₂ and I₂", "K doubles"], answer: 0, why: "There are 2 mol of gas on each side: when all concentrations are doubled, Q = [HI]²/([H₂][I₂]) does not change and remains K." },
    { q: "For H₂ + I₂ ⇌ 2 HI, Kc = 54. If [H₂] = [I₂] = 0.10 M at equilibrium, what is [HI]?", options: ['0,73 M', '0,54 M', '5,4 M', '0,073 M'], answer: 0, why: "[HI]² = Kc [H₂][I₂] = 54 × 0.10 × 0.10 = 0.54 → [HI] = √0.54 ≈ 0.73 M." }
  ];
  function buildQuiz(el) { var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: QUIZ, intro: "Eight questions on Q, K and Le Châtelier's principle." }); el.appendChild(c); }

  /* ------------------------- Lab ------------------------- */
  function buildLab(el) {
    var c = kit.ui.card("Control panel"); el.appendChild(c);
    ui.sysOpts = kit.ui.options({ label: "Reaction", cols: 2, value: P.sys, options: Object.keys(SYS).map(function (k) { return { v: k, label: SYS[k].eq, sub: SYS[k].name }; }), onChange: function (v) { goManual(); setSys(v); } });
    c.appendChild(ui.sysOpts);
    ui.sT = kit.ui.slider({ label: 'Temp.', min: S().Tr[0], max: S().Tr[1], step: 5, value: st.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { goManual(); if (Math.abs(v - st.T) > 0) { st.T = v; mark('T=' + fmt(v, 0)); } } });
    ui.sV = kit.ui.slider({ label: 'Vol.', min: 0.5, max: 4, step: 0.05, value: st.V, format: function (v) { return fmt(v, 2) + ' L'; }, onInput: function (v) { goManual(); st.V = v; mark('V=' + fmt(v, 2)); } });
    c.appendChild(kit.ui.sliders([ui.sT, ui.sV]));
    var f = document.createElement('div'); f.className = 'fld'; f.innerHTML = "<span class=\"lbl\">Add or remove species</span>"; ui.spBtns = document.createElement('div'); f.appendChild(ui.spBtns); c.appendChild(f); buildSpBtns();
    var r = document.createElement('div'); r.className = 'row';
    r.innerHTML = "<button class=\"btn\" id=\"bCat\">Catalyst: OFF</button><button class=\"btn\" id=\"bInert\">Inert gas (const V)</button><button class=\"btn\" id=\"bRs\">Restart</button><button class=\"btn\" id=\"bLs\">Back to the lesson</button>";
    ui.catBtn = r.querySelector('#bCat');
    ui.catBtn.addEventListener('click', function () { goManual(); st.cat = !st.cat; syncCtrl(); kit.toast(st.cat ? "Catalyst: equilibrium is reached ~6× faster; K does not change" : "Without catalyst"); });
    r.querySelector('#bInert').addEventListener('click', function () { goManual(); mark("inert gas"); kit.toast("Inert gas at constant V: the concentrations do not change, there is no shift"); });
    r.querySelector('#bRs').addEventListener('click', function () { goManual(); resetSys(); syncCtrl(); });
    r.querySelector('#bLs').addEventListener('click', function () { P.manual = false; enterStage(kit.state.stage); kit.toast("The lesson controls the simulation"); });
    c.appendChild(r);
    ui.info = kit.ui.card("State"); el.appendChild(ui.info); updateInfo();
    el.appendChild(kit.ui.card("Teaching note", "<p class=\"muted small\">The Kc constants and enthalpies are approximate reference values for didactic purposes; Kc(T) is calculated with the van 't Hoff equation assuming constant ΔH. Time is a model of exponential relaxation toward Q = K (not real kinetics). Each particle corresponds to a fixed amount of substance.</p>"));
  }

  /* ------------------------- Arranque ------------------------- */
  var lastSync = 0;
  function init() {
    st = newState(); ice0 = clone(st); refreshStageUI();
    kit = SimKit.create({
      key: 'equilibrio-quimico', title: "Chemical Equilibrium and Le Châtelier", subtitle: "3D Simulator · general chemistry",
      accent: { dark: '#5ad1a6', light: '#0f766e' }, viewLabel: "3D viewer: container with piston, molecules and temperature",
      stages: STAGES, mainTabLabel: "Guide",
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: "Graphs", build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'calc', label: "Calculation", build: function (el, k) { kit = k; buildCalc(el); } },
        { id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; buildQuiz(el); } }
      ],
      measuresTitle: "Live measurements",
      measures: function () {
        var s = S(), k = Kof(st.T), q = Q(st.n, st.V), P0 = nGas(st.n) * 0.08206 * st.T / st.V;
        return [["Reaction", s.eq], ['T', fmt(st.T, 0) + ' K'], ['V', fmt(st.V, 2) + ' L'], ["Total pressure", fmt(P0, 1) + ' atm'], ['Kc', sci(k)], ['Q', sci(q)], ["Direction", dirTxt(dirOf(q, k))]].concat(s.sp.map(function (sp, i) { return ['[' + fm(sp[0]) + ']', fmt(st.n[i] / st.V, 4) + ' M']; })).concat([["Catalyst", st.cat ? "yes" : 'no'], ["Time", fmt(simT, 1) + ' s']]);
      },
      ideas: ["At equilibrium the forward and reverse rates are <b>equal</b>; the concentrations are constant.", "<b>Q &lt; K</b>: advances toward products · <b>Q &gt; K</b>: toward reactants · <b>Q = K</b>: equilibrium.",
        "<b>Le Châtelier</b>: the system opposes the perturbation (concentration, pressure/volume, temperature).", "Only <b>temperature</b> changes K. Concentration and volume change Q, not K.", "The <b>catalyst</b> speeds up the equilibrium without changing K or the final composition."],
      layers: [{ id: 'labels', label: "Labels", icon: 'Aa' }],
      onLayer: function () { },
      views: [{ id: 'libre', label: "Free" }, { id: 'frontal', label: "Front" }, { id: 'lado', label: "Side" }, { id: 'superior', label: "Top" }],
      onView: function (id) { P.camGoal = viewGoal(id); },
      onTheme: function (th) { if (!scene) return; scene.background = new T.Color(th === 'dark' ? 0x0e131a : 0xdbe6f1); },
      onStage: function (i) { refreshStageUI(); if (!P.manual) { enterStage(i); syncCtrl(); } },
      onGuide: function () { if (P.manual) { P.manual = false; enterStage(kit.state.stage); } },
      onResize: resize,
      render: function () { renderer.render(scene, camera); labelRenderer.render(scene, camera); },
      onFrame: function (f) {
        var dt = Math.min(f.dt, 0.05);
        if (!P.manual && kit.state.playing === false && false) { }
        var d = dxEq(st.n, st.V, st.T), kap = 0.45 * (st.cat ? 6 : 1), fr = 1 - Math.exp(-kap * dt), sp = S().sp;
        if (Math.abs(d) > 1e-9) st.n = st.n.map(function (x, i) { return Math.max(x + sp[i][1] * d * fr, 0); });
        simT += dt; histAcc += dt;
        if (histAcc >= 0.25) { histAcc = 0; hist.push({ t: simT, c: st.n.map(function (x) { return x / st.V; }), q: Q(st.n, st.V), k: Kof(st.T) }); if (hist.length > 400) hist.shift(); }
        var info = updateScene(f.now, dt);
        if (f.now - lastSync > 0.25) { lastSync = f.now; syncHud(); updateInfo(); calcRender(); redrawAll(); if (ui.sT && P.manual === false) { ui.sT.set(st.T); ui.sV.set(st.V); } }
        if (P.camGoal) { camera.position.lerp(P.camGoal.pos, 0.08); controls.target.lerp(P.camGoal.target, 0.08); if (camera.position.distanceTo(P.camGoal.pos) < 0.05) P.camGoal = null; }
        controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera);
      },
      init: function (k) { kit = k; buildScene(); resize(); k.cfg.onTheme(k.state.theme); enterStage(0); refreshStageUI(); syncHud(); syncCtrl(); },
      help: { intro: "Follow the lesson with the player (each stage applies a perturbation) or go to “Lab” to perturb the system yourself. With “Back to the lesson” the script regains control.",
        items: [["Container", "the molecules are gas particles; the piston changes the volume; the color indicates NO₂ (brown) or I₂ (violet)."], ['Q y K', "Q compares the current state with K; the system moves until Q = K."], ["Graphs", "concentrations over time, Q versus K and K(T) by van 't Hoff."], ["Calculation", "expression of Q, current concentrations and ICE table since the last perturbation."], ["Challenge", "eight questions on equilibrium and Le Châtelier."]] }
    });
    window.__eq = { st: function () { return st; }, Kof: Kof, Q: Q, setSys: setSys, relax: relax, dxEq: dxEq, INFO: function () { return INFO; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
