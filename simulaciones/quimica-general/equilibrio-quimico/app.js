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
    haber: { name: 'Síntesis de amoníaco', eq: 'N₂ + 3 H₂ ⇌ 2 NH₃', sp: [['N2', -1], ['H2', -3], ['NH3', 2]], n0: [0.5, 1.5, 0], V0: 2, T0: 700, Tr: [500, 900], K0: 0.06, Tref: 773, dH: -92, sc: 20, add: 0.4, dT: 100, tint: null, note: 'Exotérmica; 4 mol de gas → 2 mol de gas.' },
    no2: { name: 'Dímero del dióxido de nitrógeno', eq: 'N₂O₄ ⇌ 2 NO₂', sp: [['N2O4', -1], ['NO2', 2]], n0: [0.2, 0], V0: 2, T0: 340, Tr: [290, 420], K0: 0.0059, Tref: 298, dH: 57, sc: 150, add: 0.06, dT: 40, tint: { id: 'NO2', col: 0xb5651d, k: 3.2 }, note: 'Endotérmica; el NO₂ es pardo y el N₂O₄ incoloro.' },
    hi: { name: 'Formación de yoduro de hidrógeno', eq: 'H₂ + I₂ ⇌ 2 HI', sp: [['H2', -1], ['I2', -1], ['HI', 2]], n0: [0.5, 0.5, 0], V0: 2, T0: 700, Tr: [500, 900], K0: 54, Tref: 700, dH: -10, sc: 36, add: 0.3, dT: 150, tint: { id: 'I2', col: 0x7b2fbf, k: 3.0 }, note: 'Δn(gas) = 0: la presión no desplaza el equilibrio. El I₂ es violeta.' },
    so3: { name: 'Síntesis de trióxido de azufre (contacto)', eq: '2 SO₂ + O₂ ⇌ 2 SO₃', sp: [['SO2', -2], ['O2', -1], ['SO3', 2]], n0: [1.0, 0.5, 0], V0: 2, T0: 1000, Tr: [700, 1300], K0: 280, Tref: 1000, dH: -198, sc: 24, add: 0.3, dT: 200, tint: null, note: 'Exotérmica; 3 mol de gas → 2 mol de gas (proceso de contacto).' }
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
  function dirTxt(d) { return d === 0 ? 'equilibrio (Q = K)' : d > 0 ? 'hacia los productos (→)' : 'hacia los reactivos (←)'; }
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
    var vtxt = dn === 0 ? 'Como Δn(gas) = 0, comprimir no cambia Q: <b>no hay desplazamiento</b>; solo suben todas las concentraciones.' : (dn < 0 ? 'Al reducir el volumen (más presión) el sistema se opone disminuyendo los moles de gas: <b>se desplaza hacia el lado con menos moles gaseosos</b> (los productos).' : 'Al reducir el volumen (más presión) el sistema se opone disminuyendo los moles de gas: <b>se desplaza hacia el lado con menos moles gaseosos</b> (los reactivos).');
    var ttxt = s.dH < 0 ? 'La reacción directa es <b>exotérmica</b>: calentar favorece la reacción inversa (endotérmica). <b>K disminuye</b>: ' + fmt(e[4].k / 1, 3) + ' (nueva T).' : 'La reacción directa es <b>endotérmica</b>: calentar la favorece. <b>K aumenta</b>: ' + fmt(e[4].k, 3) + ' (nueva T).';
    return [
      ['Equilibrio dinámico', 'Equilibrio', 'Sólo hay reactivos: la reacción avanza hasta el equilibrio',
        '<p>' + s.eq + ' (' + s.name + '). ' + s.note + '</p><p>Al principio solo reaccionan los reactivos; al aparecer productos, la reacción inversa se acelera hasta igualar a la directa. En el equilibrio las <b>velocidades son iguales</b> y las concentraciones <b>dejan de cambiar</b>, aunque las moléculas siguen reaccionando.</p>'],
      ['Q frente a K', 'Q y K', 'Q = K: el sistema está en equilibrio (K = ' + fmt(e[1].k, 3) + ')',
        '<p>El <b>cociente de reacción Q</b> tiene la forma de Kc con las concentraciones del momento. Si <b>Q &lt; K</b> la reacción avanza hacia productos; si <b>Q &gt; K</b>, hacia reactivos; si <b>Q = K</b>, está en equilibrio.</p><p>Aquí Q = K = <b>' + sci(e[1].k) + '</b> a ' + fmt(s.T0, 0) + ' K.</p>'],
      ['Añadir reactivo', 'Concentración', 'Se agrega ' + r0 + ': Q < K, el sistema avanza ' + dirTxt(e[2].dir),
        '<p>Al añadir <b>' + fmt(s.add, 2) + ' mol de ' + r0 + '</b>, Q baja a <b>' + sci(e[2].q) + '</b> (K = ' + sci(e[2].k) + '). Como Q &lt; K, la reacción se desplaza <b>' + dirTxt(e[2].dir) + '</b> para consumir parte del exceso.</p><p>K no cambia: solo cambia la composición.</p>'],
      ['Volumen y presión', 'Presión', 'Se comprime a la mitad del volumen: ' + (dn === 0 ? 'Q = K, sin desplazamiento' : 'Q ≠ K, desplazamiento ' + dirTxt(e[3].dir)),
        '<p>V pasa de ' + fmt(s.V0, 1) + ' L a <b>' + fmt(s.V0 / 2, 1) + ' L</b> (presión total ×2). Q = <b>' + sci(e[3].q) + '</b> frente a K = ' + sci(e[3].k) + '.</p><p>' + vtxt + '</p>'],
      ['Temperatura', 'Temperatura', 'Se calienta ' + fmt(dT, 0) + ' K: cambia K y el equilibrio se desplaza ' + dirTxt(e[4].dir),
        '<p>Es el <b>único</b> factor que modifica el valor de K. T pasa de ' + fmt(e[4].pre.T - dT, 0) + ' K a <b>' + fmt(e[4].pre.T, 0) + ' K</b>.</p><p>' + ttxt + '</p>'],
      ['Catalizador', 'Catalizador', 'El catalizador acelera, pero no cambia K ni la composición final',
        '<p>Se activa el catalizador y se añaden ' + fmt(s.add, 2) + ' mol de ' + lastId + '. El sistema vuelve a Q = K <b>unas 6 veces más rápido</b>, pero la posición final del equilibrio es la que corresponde a K: <b>el catalizador acelera la reacción directa e inversa por igual</b>.</p><p>Agregar un <b>gas inerte a volumen constante</b> tampoco desplaza el equilibrio: no cambia las concentraciones.</p>']
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
    labels.state.o.position.set(0, h + 1.9, 0); labels.state.set(d === 0 ? 'Q = K · equilibrio' : (d > 0 ? 'Q < K → productos' : 'Q > K → reactivos'), d === 0 ? 'bl-neg' : 'bl-lead');
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
  function goManual() { if (!P.manual) { P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); }
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
    if (ui.sysOpts) ui.sysOpts.set(P.sys); if (ui.catBtn) ui.catBtn.textContent = st.cat ? 'Catalizador: ON' : 'Catalizador: OFF'; updateInfo();
  }
  function kcExpr() { var s = S(), num = [], den = []; s.sp.forEach(function (sp) { var t = '[' + fm(sp[0]) + ']' + (Math.abs(sp[1]) > 1 ? ['', '', '²', '³'][Math.abs(sp[1])] : ''); (sp[1] > 0 ? num : den).push(t); }); return num.join(' ') + ' / ' + den.join(' '); }
  function syncHud() {
    var s = S(), k = Kof(st.T), q = Q(st.n, st.V);
    kit.setEq({ chip: 'Equilibrio', name: s.eq, body:
      '<div class="eqline"><small>Kc = ' + kcExpr() + '</small>' + sci(k) + ' (a ' + fmt(st.T, 0) + ' K)</div>' +
      '<div class="eqline"><small>Q ahora</small>' + sci(q) + '</div>' +
      '<div class="eqline"><small>Sentido espontáneo</small>' + dirTxt(dirOf(q, k)) + '</div>' +
      '<small>ΔH = ' + fmt(s.dH, 0) + ' kJ/mol (' + (s.dH < 0 ? 'exotérmica' : 'endotérmica') + ') · Δn(gas) = ' + (dnGas() > 0 ? '+' : '') + dnGas() + '</small>' });
    kit.setLegend(s.sp.map(function (sp) { var g = GEO[sp[0]], el = g.a[0][0], c = '#' + ('000000' + EL[el].c.toString(16)).slice(-6); return { label: fm(sp[0]), color: c, text: sp[1] < 0 ? 'reactivo' : 'producto' }; }));
  }
  function updateInfo() {
    if (!ui.info) return; var s = S(), k = Kof(st.T), q = Q(st.n, st.V), P0 = nGas(st.n) * 0.08206 * st.T / st.V;
    ui.info.innerHTML = '<div class="card-kicker">Estado</div>' + kvr('Kc (a ' + fmt(st.T, 0) + ' K)', sci(k)) + kvr('Q', sci(q)) + kvr('Q / K', fmt(q / k, 3)) + kvr('Presión total (gas ideal)', fmt(P0, 1) + ' atm') +
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
    ctx.textAlign = 'center'; ctx.fillStyle = c.muted; ctx.fillText('tiempo (s)', L + pw / 2, h - 4); ctx.fillText(fmt(t0, 0), L, h - B + 13); ctx.fillText(fmt(t0 + span, 0), L + pw, h - B + 13);
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
    ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.fillText('tiempo (s) · eje y: log₁₀', L + pw / 2, h - 4);
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
    ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.fillText('T (K) · eje y: log₁₀ K', L + pw / 2, h - 4); ctx.fillText(fmt(a, 0), L, h - B + 13); ctx.fillText(fmt(b, 0), L + pw, h - B + 13);
    ctx.strokeStyle = '#b392f0'; ctx.lineWidth = 2.4; ctx.beginPath(); for (var T1 = a, f = true; T1 <= b; T1 += (b - a) / 80) { var x = sx(T1), y = sy(log10(Kof(T1))); if (f) { ctx.moveTo(x, y); f = false; } else ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(sx(st.T), sy(log10(Kof(st.T))), 5.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  }
  function redrawAll() { ['g1', 'g2', 'g3'].forEach(function (k) { ui[k] && ui[k].redraw(); }); }
  function buildGraphs(el) {
    var c1 = kit.ui.card('Concentraciones en el tiempo'); ui.g1 = kit.ui.canvas(c1, { height: 220, label: 'Concentración de cada especie frente al tiempo', draw: drawTime });
    c1.insertAdjacentHTML('beforeend', '<p class="muted small">Las líneas punteadas marcan cada perturbación. Tras ella el sistema se reajusta hasta un nuevo equilibrio.</p>');
    var c2 = kit.ui.card('Q frente a K'); ui.g2 = kit.ui.canvas(c2, { height: 200, label: 'Cociente de reacción y constante de equilibrio en el tiempo', draw: drawQK });
    c2.insertAdjacentHTML('beforeend', '<p class="muted small">Q se aleja de K al perturbar y vuelve a alcanzarla. K solo cambia con la temperatura (salto de la línea naranja).</p>');
    var c3 = kit.ui.card('K en función de la temperatura'); ui.g3 = kit.ui.canvas(c3, { height: 190, label: 'Logaritmo de K frente a la temperatura', draw: drawKT });
    c3.insertAdjacentHTML('beforeend', '<p class="muted small">Ecuación de van \'t Hoff: ln(K₂/K₁) = −ΔH/R · (1/T₂ − 1/T₁). Exotérmica: K baja al calentar; endotérmica: K sube.</p>');
    [c1, c2, c3].forEach(function (c) { el.appendChild(c); });
  }

  /* ------------------------- Cálculo ------------------------- */
  function calcRender() {
    if (!ui.calcOut) return; var s = S(), k = Kof(st.T), q = Q(st.n, st.V), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
    var h = '<div class="card-kicker">Cociente de reacción y desplazamiento</div><div class="muted small">' + s.eq + '</div>';
    h += '<div class="calc-step">1 · Expresión de Q y K</div><table class="calc-table">' + row('Kc', kcExpr()) + row('Kc (' + fmt(st.T, 0) + ' K)', '<b>' + sci(k) + '</b>') + '</table>';
    h += '<div class="calc-step">2 · Q con las concentraciones actuales</div><table class="calc-table">' + s.sp.map(function (sp, i) { return row('[' + fm(sp[0]) + ']', fmt(st.n[i], 3) + ' mol ÷ ' + fmt(st.V, 2) + ' L = ' + fmt(st.n[i] / st.V, 4) + ' M'); }).join('') + row('Q', '<b>' + sci(q) + '</b>') + row('Q ÷ K', fmt(q / k, 3)) + row('Conclusión', '<b>' + dirTxt(dirOf(q, k)) + '</b>') + '</table>';
    if (ice0) {
      var d = dxEq(ice0.n, ice0.V, ice0.T), V = ice0.V;
      h += '<div class="calc-step">3 · Tabla ICE desde la última perturbación (' + fmt(ice0.T, 0) + ' K, ' + fmt(V, 2) + ' L)</div><table class="calc-table"><tr><th>&mdash;</th><td><b>I (M)</b></td><td><b>C (M)</b></td><td><b>E (M)</b></td></tr>' +
        s.sp.map(function (sp, i) { var ci = ice0.n[i] / V, cc = sp[1] * d / V; return '<tr><th>' + fm(sp[0]) + '</th><td>' + fmt(ci, 4) + '</td><td>' + (cc >= 0 ? '+' : '−') + fmt(Math.abs(cc), 4) + '</td><td><b>' + fmt(Math.max(ci + cc, 0), 4) + '</b></td></tr>'; }).join('') + '</table>' +
        '<p class="muted small">x = ' + fmt(d / V, 4) + ' M: se resuelve Q(equilibrio) = K. Con x &gt; 0 avanza hacia productos.</p>';
    }
    ui.calcOut.innerHTML = h;
  }
  function buildCalc(el) { ui.calcOut = kit.ui.card(''); el.appendChild(ui.calcOut); calcRender(); }

  /* ------------------------- Desafío ------------------------- */
  var QUIZ = [
    { q: 'En un equilibrio químico dinámico…', options: ['Las velocidades directa e inversa son iguales', 'Las reacciones se detienen', 'Las concentraciones de reactivos y productos son iguales', 'Solo ocurre la reacción directa'], answer: 0, why: 'El equilibrio es dinámico: ambas reacciones siguen ocurriendo con igual velocidad, por eso las concentraciones permanecen constantes (no necesariamente iguales).' },
    { q: 'Si Q < K, el sistema…', options: ['Avanza hacia los productos', 'Avanza hacia los reactivos', 'Ya está en equilibrio', 'Cambia el valor de K'], answer: 0, why: 'Q < K indica pocos productos respecto del equilibrio: la reacción directa predomina hasta que Q = K.' },
    { q: 'N₂ + 3 H₂ ⇌ 2 NH₃. Al aumentar la presión (disminuir el volumen) el equilibrio…', options: ['Se desplaza hacia NH₃', 'Se desplaza hacia N₂ y H₂', 'No se desplaza', 'Cambia K'], answer: 0, why: 'Hay 4 mol de gas a la izquierda y 2 a la derecha; mayor presión favorece el lado con menos moles gaseosos, es decir, NH₃.' },
    { q: 'En una reacción exotérmica, al aumentar la temperatura…', options: ['K disminuye y el equilibrio se desplaza hacia los reactivos', 'K aumenta y se desplaza hacia los productos', 'K no cambia', 'Solo cambia la velocidad'], answer: 0, why: 'Calentar favorece la reacción endotérmica (aquí la inversa). Es el único cambio que modifica el valor de K (van\'t Hoff).' },
    { q: 'Un catalizador en un sistema en equilibrio…', options: ['Acelera ambas reacciones sin cambiar K ni la composición de equilibrio', 'Aumenta el rendimiento de productos', 'Aumenta K', 'Desplaza el equilibrio hacia los productos'], answer: 0, why: 'El catalizador baja la barrera de ambas direcciones por igual: se llega antes al equilibrio, pero no cambia su posición.' },
    { q: 'Se agrega un gas inerte (He) a volumen constante a una mezcla en equilibrio gaseoso. El equilibrio…', options: ['No se desplaza', 'Se desplaza hacia el lado con más moles', 'Se desplaza hacia el lado con menos moles', 'Cambia K'], answer: 0, why: 'A V constante las concentraciones de las especies reactivas no cambian: Q sigue igual a K.' },
    { q: 'H₂ + I₂ ⇌ 2 HI. Al comprimir la mezcla a la mitad de su volumen, el equilibrio…', options: ['No se desplaza (Δn gas = 0)', 'Se desplaza hacia HI', 'Se desplaza hacia H₂ e I₂', 'K se duplica'], answer: 0, why: 'Hay 2 mol de gas a cada lado: al duplicar todas las concentraciones, Q = [HI]²/([H₂][I₂]) no cambia y sigue siendo K.' },
    { q: 'Para H₂ + I₂ ⇌ 2 HI, Kc = 54. Si [H₂] = [I₂] = 0,10 M en equilibrio, ¿cuánto vale [HI]?', options: ['0,73 M', '0,54 M', '5,4 M', '0,073 M'], answer: 0, why: '[HI]² = Kc [H₂][I₂] = 54 × 0,10 × 0,10 = 0,54 → [HI] = √0,54 ≈ 0,73 M.' }
  ];
  function buildQuiz(el) { var c = kit.ui.card('Desafío'); kit.ui.quiz(c, { items: QUIZ, intro: 'Ocho preguntas sobre Q, K y el principio de Le Châtelier.' }); el.appendChild(c); }

  /* ------------------------- Lab ------------------------- */
  function buildLab(el) {
    var c = kit.ui.card('Panel de control'); el.appendChild(c);
    ui.sysOpts = kit.ui.options({ label: 'Reacción', cols: 2, value: P.sys, options: Object.keys(SYS).map(function (k) { return { v: k, label: SYS[k].eq, sub: SYS[k].name }; }), onChange: function (v) { goManual(); setSys(v); } });
    c.appendChild(ui.sysOpts);
    ui.sT = kit.ui.slider({ label: 'Temp.', min: S().Tr[0], max: S().Tr[1], step: 5, value: st.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { goManual(); if (Math.abs(v - st.T) > 0) { st.T = v; mark('T=' + fmt(v, 0)); } } });
    ui.sV = kit.ui.slider({ label: 'Vol.', min: 0.5, max: 4, step: 0.05, value: st.V, format: function (v) { return fmt(v, 2) + ' L'; }, onInput: function (v) { goManual(); st.V = v; mark('V=' + fmt(v, 2)); } });
    c.appendChild(kit.ui.sliders([ui.sT, ui.sV]));
    var f = document.createElement('div'); f.className = 'fld'; f.innerHTML = '<span class="lbl">Agregar o retirar especies</span>'; ui.spBtns = document.createElement('div'); f.appendChild(ui.spBtns); c.appendChild(f); buildSpBtns();
    var r = document.createElement('div'); r.className = 'row';
    r.innerHTML = '<button class="btn" id="bCat">Catalizador: OFF</button><button class="btn" id="bInert">Gas inerte (V cte)</button><button class="btn" id="bRs">Reiniciar</button><button class="btn" id="bLs">Volver a la lección</button>';
    ui.catBtn = r.querySelector('#bCat');
    ui.catBtn.addEventListener('click', function () { goManual(); st.cat = !st.cat; syncCtrl(); kit.toast(st.cat ? 'Catalizador: el equilibrio se alcanza ~6× más rápido; K no cambia' : 'Sin catalizador'); });
    r.querySelector('#bInert').addEventListener('click', function () { goManual(); mark('gas inerte'); kit.toast('Gas inerte a V constante: las concentraciones no cambian, no hay desplazamiento'); });
    r.querySelector('#bRs').addEventListener('click', function () { goManual(); resetSys(); syncCtrl(); });
    r.querySelector('#bLs').addEventListener('click', function () { P.manual = false; enterStage(kit.state.stage); kit.toast('La lección controla la simulación'); });
    c.appendChild(r);
    ui.info = kit.ui.card('Estado'); el.appendChild(ui.info); updateInfo();
    el.appendChild(kit.ui.card('Nota didáctica', '<p class="muted small">Las constantes Kc y las entalpías son valores de referencia aproximados con fines didácticos; Kc(T) se calcula con la ecuación de van \'t Hoff suponiendo ΔH constante. El tiempo es un modelo de relajación exponencial hacia Q = K (no una cinética real). Cada partícula corresponde a una cantidad fija de sustancia.</p>'));
  }

  /* ------------------------- Arranque ------------------------- */
  var lastSync = 0;
  function init() {
    st = newState(); ice0 = clone(st); refreshStageUI();
    kit = SimKit.create({
      key: 'equilibrio-quimico', title: 'Equilibrio químico y Le Châtelier', subtitle: 'Simulador 3D · química general',
      accent: { dark: '#5ad1a6', light: '#0f766e' }, viewLabel: 'Visor 3D: recipiente con émbolo, moléculas y temperatura',
      stages: STAGES, mainTabLabel: 'Guía',
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: 'Gráficos', build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'calc', label: 'Cálculo', build: function (el, k) { kit = k; buildCalc(el); } },
        { id: 'quiz', label: 'Desafío', build: function (el, k) { kit = k; buildQuiz(el); } }
      ],
      measuresTitle: 'Medidas en vivo',
      measures: function () {
        var s = S(), k = Kof(st.T), q = Q(st.n, st.V), P0 = nGas(st.n) * 0.08206 * st.T / st.V;
        return [['Reacción', s.eq], ['T', fmt(st.T, 0) + ' K'], ['V', fmt(st.V, 2) + ' L'], ['Presión total', fmt(P0, 1) + ' atm'], ['Kc', sci(k)], ['Q', sci(q)], ['Sentido', dirTxt(dirOf(q, k))]].concat(s.sp.map(function (sp, i) { return ['[' + fm(sp[0]) + ']', fmt(st.n[i] / st.V, 4) + ' M']; })).concat([['Catalizador', st.cat ? 'sí' : 'no'], ['Tiempo', fmt(simT, 1) + ' s']]);
      },
      ideas: ['En el equilibrio las velocidades directa e inversa son <b>iguales</b>; las concentraciones son constantes.', '<b>Q &lt; K</b>: avanza hacia productos · <b>Q &gt; K</b>: hacia reactivos · <b>Q = K</b>: equilibrio.',
        '<b>Le Châtelier</b>: el sistema se opone a la perturbación (concentración, presión/volumen, temperatura).', 'Solo la <b>temperatura</b> cambia K. Concentración y volumen cambian Q, no K.', 'El <b>catalizador</b> acelera el equilibrio sin cambiar K ni la composición final.'],
      layers: [{ id: 'labels', label: 'Etiquetas', icon: 'Aa' }],
      onLayer: function () { },
      views: [{ id: 'libre', label: 'Libre' }, { id: 'frontal', label: 'Frontal' }, { id: 'lado', label: 'Lateral' }, { id: 'superior', label: 'Superior' }],
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
      help: { intro: 'Sigue la lección con el reproductor (cada etapa aplica una perturbación) o ve a «Lab» para perturbar tú el sistema. Con «Volver a la lección» el guion retoma el control.',
        items: [['Recipiente', 'las moléculas son partículas gaseosas; el émbolo cambia el volumen; el color indica NO₂ (pardo) o I₂ (violeta).'], ['Q y K', 'Q compara el estado actual con K; el sistema se mueve hasta Q = K.'], ['Gráficos', 'concentraciones en el tiempo, Q frente a K y K(T) por van\'t Hoff.'], ['Cálculo', 'expresión de Q, concentraciones actuales y tabla ICE desde la última perturbación.'], ['Desafío', 'ocho preguntas de equilibrio y Le Châtelier.']] }
    });
    window.__eq = { st: function () { return st; }, Kof: Kof, Q: Q, setSys: setSys, relax: relax, dxEq: dxEq, INFO: function () { return INFO; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
