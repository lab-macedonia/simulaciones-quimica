/* Estequiometría y reactivo limitante — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js */
(function () {
  'use strict';
  var T = THREE, kit;
  var fmt = SimKit.fmt, clamp = SimKit.clamp;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }

  /* ------------------------- Datos ------------------------- */
  var EL = { H: { c: 0xf2f2f2, r: 0.31, m: 1.008 }, C: { c: 0x56606b, r: 0.76, m: 12.011 }, N: { c: 0x4f7cff, r: 0.71, m: 14.007 }, O: { c: 0xff4d4d, r: 0.66, m: 15.999 } };
  var GEO = {
    H2: { f: 'H₂', a: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]], b: [[0, 1]] },
    N2: { f: 'N₂', a: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]], b: [[0, 1]] },
    O2: { f: 'O₂', a: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], b: [[0, 1]] },
    NH3: { f: 'NH₃', a: [['N', 0, 0.12, 0], ['H', 0.94, -0.28, 0], ['H', -0.47, -0.28, 0.81], ['H', -0.47, -0.28, -0.81]], b: [[0, 1], [0, 2], [0, 3]] },
    H2O: { f: 'H₂O', a: [['O', 0, 0.12, 0], ['H', 0.76, -0.47, 0], ['H', -0.76, -0.47, 0]], b: [[0, 1], [0, 2]] },
    CH4: { f: 'CH₄', a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', -0.63, -0.63, 0.63], ['H', -0.63, 0.63, -0.63], ['H', 0.63, -0.63, -0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    CO2: { f: 'CO₂', a: [['O', -1.16, 0, 0], ['C', 0, 0, 0], ['O', 1.16, 0, 0]], b: [[0, 1], [1, 2]] },
    CO: { f: 'CO', a: [['C', -0.56, 0, 0], ['O', 0.56, 0, 0]], b: [[0, 1]] },
    C3H8: { f: 'C₃H₈', a: [['C', -1.27, -0.26, 0], ['C', 0, 0.5, 0], ['C', 1.27, -0.26, 0], ['H', 0, 1.1, 0.88], ['H', 0, 1.1, -0.88], ['H', -1.3, -0.9, 0.88], ['H', -1.3, -0.9, -0.88], ['H', -2.17, 0.28, 0], ['H', 1.3, -0.9, 0.88], ['H', 1.3, -0.9, -0.88], ['H', 2.17, 0.28, 0]],
      b: [[0, 1], [1, 2], [1, 3], [1, 4], [0, 5], [0, 6], [0, 7], [2, 8], [2, 9], [2, 10]] }
  };
  Object.keys(GEO).forEach(function (k) { GEO[k].M = GEO[k].a.reduce(function (s, a) { return s + EL[a[0]].m; }, 0); });
  function mm(id) { return GEO[id].M; }
  function fm(id) { return GEO[id].f; }

  var RX = {
    haber: { name: 'Síntesis de amoníaco', R: [['N2', 1], ['H2', 3]], P: [['NH3', 2]], maxA: 8, maxB: 24, def: [4, 9] },
    agua: { name: 'Formación de agua', R: [['H2', 2], ['O2', 1]], P: [['H2O', 2]], maxA: 16, maxB: 8, def: [8, 6] },
    metano: { name: 'Combustión del metano', R: [['CH4', 1], ['O2', 2]], P: [['CO2', 1], ['H2O', 2]], maxA: 8, maxB: 16, def: [5, 6] },
    propano: { name: 'Combustión del propano', R: [['C3H8', 1], ['O2', 5]], P: [['CO2', 3], ['H2O', 4]], maxA: 4, maxB: 20, def: [3, 10] },
    co: { name: 'Oxidación del CO', R: [['CO', 2], ['O2', 1]], P: [['CO2', 2]], maxA: 16, maxB: 8, def: [8, 6] }
  };
  function eqText(r) {
    function side(L) { return L.map(function (x) { return (x[1] > 1 ? x[1] + ' ' : '') + fm(x[0]); }).join(' + '); }
    return side(r.R) + ' → ' + side(r.P);
  }
  Object.keys(RX).forEach(function (k) { RX[k].id = k; RX[k].eq = eqText(RX[k]); });

  /* ------------------------- Estado y modelo ------------------------- */
  var P = { rx: 'haber', manual: false, auto: false, camGoal: null };
  var N = { a: 4, b: 9 };
  var prog = 0;
  var CAL = { mA: 20, mB: 10, y: 80, prod: 0 };
  var ui = {};
  function rx() { return RX[P.rx]; }

  function model() {
    var r = rx(), a = r.R[0][1], b = r.R[1][1];
    var ra = N.a / a, rb = N.b / b;
    var E = Math.floor(Math.min(ra, rb) + 1e-9);
    var lim = Math.abs(ra - rb) < 1e-9 ? -1 : (ra < rb ? 0 : 1);
    return { r: r, a: a, b: b, ra: ra, rb: rb, E: E, lim: lim, la: N.a - E * a, lb: N.b - E * b,
      pc: r.P.map(function (p) { return p[1]; }), pid: r.P.map(function (p) { return p[0]; }) };
  }
  var M = model();
  var done = 0;           // tandas completadas en el instante actual
  function mass0() { return N.a * mm(M.r.R[0][0]) + N.b * mm(M.r.R[1][0]); }
  function massNow() {
    var A = (N.a - done * M.a) * mm(M.r.R[0][0]) + (N.b - done * M.b) * mm(M.r.R[1][0]);
    M.r.P.forEach(function (p) { A += done * p[1] * mm(p[0]); });
    return A;
  }
  function limName() { return M.lim < 0 ? 'ninguno (proporción exacta)' : fm(M.r.R[M.lim][0]); }

  /* ------------------------- Lección ------------------------- */
  var STAGES = [0, 1, 2, 3, 4, 5].map(function () { return { name: '', short: '', title: '', text: '', dur: 8 }; });
  function setStages(arr) { arr.forEach(function (s, i) { var t = STAGES[i]; t.name = s[0]; t.short = s[1]; t.title = s[2]; t.text = s[3]; }); }
  function tandaWord(n) { return n === 1 ? '1 tanda' : n + ' tandas'; }
  function stagesList() {
    var m = M, r = m.r, A = fm(r.R[0][0]), B = fm(r.R[1][0]), pTxt = r.P.map(function (p) { return fm(p[0]); }).join(' y ');
    var lim = m.lim < 0 ? null : fm(r.R[m.lim][0]), exc = m.lim < 0 ? null : fm(r.R[1 - m.lim][0]);
    var leftTxt = (m.la ? m.la + ' ' + A : '') + (m.la && m.lb ? ' y ' : '') + (m.lb ? m.lb + ' ' + B : '');
    var prodTxt = r.P.map(function (p) { return m.E * p[1] + ' ' + fm(p[0]); }).join(' y ');
    var m0 = mass0();
    return [
      ['Reactivos', 'Reactivos', 'Hay ' + N.a + ' ' + A + ' y ' + N.b + ' ' + B + ' en el reactor',
        '<p>Cada <b>partícula</b> del dibujo es una molécula (a escala de laboratorio, 1 mol = 6,022 × 10²³ moléculas). A la izquierda están los reactivos <b>' + A + '</b> y <b>' + B + '</b>; a la derecha se acumularán los productos.</p><p>Ecuación: <b>' + r.eq + '</b>.</p>'],
      ['La receta', 'Receta', 'La ecuación balanceada es una receta',
        '<p>Por cada <b>tanda</b> reaccionan <b>' + m.a + ' ' + A + '</b> con <b>' + m.b + ' ' + B + '</b> y se forman ' + r.P.map(function (p) { return '<b>' + p[1] + ' ' + fm(p[0]) + '</b>'; }).join(' y ') + '. Los coeficientes son proporciones fijas: no se puede usar “un poco más” de un reactivo sin que el otro lo acompañe.</p><p>Los átomos se conservan: ninguno aparece ni desaparece, solo se reordenan.</p>'],
      ['¿Quién se agota?', 'Limitante', m.lim < 0 ? 'Proporción exacta: se consumen ambos' : 'El limitante es ' + lim,
        '<p>Se divide cada cantidad por su coeficiente: <b>' + A + '</b> alcanza para ' + fmt(m.ra, 2) + ' tandas y <b>' + B + '</b> para ' + fmt(m.rb, 2) + '.</p>' +
        (m.lim < 0 ? '<p>Las dos dan lo mismo: no sobra nada.</p>' : '<p>El menor valor manda: <b>' + lim + '</b> es el <b>reactivo limitante</b> (halo rojo) y fija el máximo de producto. <b>' + exc + '</b> está en <b>exceso</b>.</p>') +
        '<p>Tandas completas posibles: <b>' + m.E + '</b>.</p>'],
      ['La reacción', 'Reacción', 'Las tandas ocurren hasta agotar el limitante',
        '<p>Las moléculas se acercan en grupos de la receta (' + m.a + ' ' + A + ' + ' + m.b + ' ' + B + '), reaccionan y salen los productos. Se repite ' + tandaWord(m.E) + '.</p>' + (m.E === 0 ? '<p><b>No hay suficiente de algún reactivo para completar siquiera una tanda.</b></p>' : '')],
      ['Productos y sobrante', 'Sobrante', 'Se forman ' + (m.E ? prodTxt : 'ningún producto'),
        '<p>Se obtienen <b>' + (m.E ? prodTxt : '0') + '</b> (rendimiento <b>teórico</b>: el máximo posible).</p>' +
        (leftTxt ? '<p>Quedan sin reaccionar <b>' + leftTxt + '</b> (halo ámbar).' + ((m.lim >= 0 && m['l' + 'ab'[m.lim]] > 0) ? ' Con moléculas enteras, lo que sobra del limitante no alcanza para otra tanda; a escala de mol la fracción sí reacciona.' : '') + '</p>' : '<p>No sobra ningún reactivo.</p>')],
      ['Masa y rendimiento', 'Masa', 'La masa se conserva; el rendimiento real puede ser menor',
        '<p>Si cada partícula fuese 1 mol, la masa inicial sería <b>' + fmt(m0, 1) + ' g</b> y la final también: <b>ley de Lavoisier</b>.</p><p>En el laboratorio el <b>rendimiento real</b> suele ser menor que el teórico (reacciones incompletas, pérdidas). <b>% rendimiento = real ÷ teórico × 100</b>. Pruébalo en la pestaña «Cálculo (g)».</p>']
    ];
  }
  function refreshStageUI() {
    setStages(stagesList());
    if (!kit) return;
    var i = kit.state.stage, s = STAGES[i];
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
  }

  /* ------------------------- Escena ------------------------- */
  var scene, camera, renderer, labelRenderer, controls, gRoot, flash, labels = {}, trays = {}, halos, matEl = {}, bondMat, sphereGeo, cylGeo, floor;
  var parts = { A: [], B: [], P0: [], P1: [] };
  var CX = { A: -11, B: -4.2, P0: 4.2, P1: 11 }, MEET = new T.Vector3(0, 2.6, 0), SP = 2.1, GS = 0.62, AR = 0.42;

  function mkLabel(txt, cls) {
    var d = document.createElement('div'); d.className = 'bond-label ' + cls; d.textContent = txt;
    var o = new T.CSS2DObject(d); return { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; } };
  }
  function slotPos(cx, i) { var ix = i % 3, iz = Math.floor(i / 3) % 3, iy = Math.floor(i / 9); return new T.Vector3(cx + (ix - 1) * SP, 0.85 + iy * SP * 0.95, (iz - 1) * SP); }

  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 8, 27);
    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer(); labelRenderer.domElement.className = 'labels-layer'; cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06; controls.minDistance = 6; controls.maxDistance = 70; controls.autoRotateSpeed = 1.1;
    controls.target.set(0, 3.2, 0);
    controls.addEventListener('start', function () { P.camGoal = null; });
    scene.add(new T.AmbientLight(0xffffff, 0.8));
    var dl = new T.DirectionalLight(0xffffff, 1.1); dl.position.set(8, 16, 10); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x88aaff, 0.35); dl2.position.set(-8, -4, -6); scene.add(dl2);
    sphereGeo = new T.SphereGeometry(1, 20, 14); cylGeo = new T.CylinderGeometry(1, 1, 1, 10, 1, true);
    Object.keys(EL).forEach(function (k) { matEl[k] = new T.MeshStandardMaterial({ color: EL[k].c, roughness: 0.4, metalness: 0.1 }); });
    bondMat = new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 });
    halos = { lim: new T.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: 0.26, depthWrite: false }), left: new T.MeshBasicMaterial({ color: 0xe3b341, transparent: true, opacity: 0.26, depthWrite: false }) };
    gRoot = new T.Group(); scene.add(gRoot);
    ['A', 'B', 'P0', 'P1'].forEach(function (k) {
      var tr = new T.Mesh(new T.BoxGeometry(3 * SP + 0.8, 0.14, 3 * SP + 0.8), new T.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.8, transparent: true, opacity: 0.9 }));
      tr.position.set(CX[k], 0.0, 0); scene.add(tr); trays[k] = tr;
      labels[k] = mkLabel('', 'bl-d'); scene.add(labels[k].o);
      labels[k + 'tag'] = mkLabel('', 'bl-d'); scene.add(labels[k + 'tag'].o);
    });
    labels.meet = mkLabel('Reacción', 'bl-lead'); labels.meet.o.position.set(0, 5.4, 0); scene.add(labels.meet.o);
    floor = new T.Mesh(new T.CylinderGeometry(24, 24, 0.2, 60), new T.MeshStandardMaterial({ color: 0x131a22, roughness: 0.9 }));
    floor.position.y = -0.2; floor.visible = false; scene.add(floor);
    flash = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); flash.position.copy(MEET); scene.add(flash);
    buildParticles();
  }

  function mkParticle(fid, key, idx) {
    var g = new T.Group(), geo = GEO[fid];
    geo.a.forEach(function (a) {
      var m = new T.Mesh(sphereGeo, matEl[a[0]]); m.scale.setScalar(EL[a[0]].r * AR); m.position.set(a[1] * GS, a[2] * GS, a[3] * GS); g.add(m);
    });
    geo.b.forEach(function (b) {
      var p = new T.Vector3(geo.a[b[0]][1], geo.a[b[0]][2], geo.a[b[0]][3]).multiplyScalar(GS), q = new T.Vector3(geo.a[b[1]][1], geo.a[b[1]][2], geo.a[b[1]][3]).multiplyScalar(GS);
      var c = new T.Mesh(cylGeo, bondMat), d = q.clone().sub(p), len = d.length();
      c.scale.set(0.06, len, 0.06); c.position.copy(p).add(q).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(c);
    });
    var h = new T.Mesh(sphereGeo, halos.lim); h.scale.setScalar(geo.a.length > 6 ? 1.15 : 0.62); h.visible = false; g.add(h);
    g.visible = true; gRoot.add(g);
    return { g: g, halo: h, key: key, idx: idx, ph: Math.random() * 6.283 };
  }
  function buildParticles() {
    ['A', 'B', 'P0', 'P1'].forEach(function (k) { parts[k].forEach(function (p) { gRoot.remove(p.g); }); parts[k] = []; });
    var m = M, r = m.r;
    for (var i = 0; i < N.a; i++) parts.A.push(mkParticle(r.R[0][0], 'A', i));
    for (var j = 0; j < N.b; j++) parts.B.push(mkParticle(r.R[1][0], 'B', j));
    r.P.forEach(function (p, k) { for (var q = 0; q < m.E * p[1]; q++) parts['P' + k].push(mkParticle(p[0], 'P' + k, q)); });
    ['A', 'B', 'P0', 'P1'].forEach(function (k) {
      var n = parts[k].length, lay = Math.max(1, Math.ceil(n / 9)), y = 0.85 + (lay - 1) * SP * 0.95 + 1.7;
      var on = k !== 'P1' || r.P.length > 1;
      labels[k].o.position.set(CX[k], y, 0); labels[k + 'tag'].o.position.set(CX[k], y + 0.95, 0);
      labels[k].o.visible = on; labels[k + 'tag'].o.visible = on; trays[k].visible = on;
    });
  }

  function evt(e, E) { var D = 2 / (E + 1), s = e / (E + 1); return clamp((prog - s) / D, 0, 1); }
  function ring(q, n, e, rad) { var ang = 6.283 * q / Math.max(n, 1) + e * 0.9; return new T.Vector3(0, Math.sin(ang) * rad, Math.cos(ang) * rad); }
  var tv = new T.Vector3(), tv2 = new T.Vector3();
  function wobble(p, base, t, amp, moving) {
    p.g.position.copy(base);
    if (!moving) { p.g.position.x += amp * Math.sin(t * 1.3 + p.ph); p.g.position.y += amp * Math.sin(t * 1.7 + p.ph * 1.3); p.g.position.z += amp * Math.sin(t * 1.1 + p.ph * 0.7); }
    var k = moving ? 1.5 : 0.35;
    p.g.rotation.set(p.ph + t * k * 0.8, p.ph * 0.7 + t * k, p.ph * 0.3 + t * k * 0.5);
  }
  function layout(t) {
    var m = M, E = m.E, a = m.a, b = m.b, n = a + b, flashAmt = 0, dn = 0;
    var haloOn = kit.layer('halo');
    function reactant(p, key) {
      var coef = key === 'A' ? a : b, e = Math.floor(p.idx / coef), cx = CX[key], slot = slotPos(cx, p.idx);
      var leftover = e >= E, lim = (m.lim === (key === 'A' ? 0 : 1));
      p.halo.visible = haloOn && (leftover || lim);
      if (p.halo.visible) { p.halo.material = leftover ? halos.left : halos.lim; p.halo.scale.setScalar((p.g.children.length > 12 ? 1.15 : 0.62) * (1 + 0.07 * Math.sin(t * 3 + p.ph))); }
      if (leftover) { p.g.visible = true; wobble(p, slot, t, 0.05, false); return; }
      var u = evt(e, E);
      if (u >= 0.5) { p.g.visible = false; return; }
      p.g.visible = true;
      if (u <= 0) { wobble(p, slot, t, 0.05, false); return; }
      var k = p.idx - e * coef, q = key === 'A' ? k : a + k;
      tv.copy(MEET).add(ring(q, n, e, 0.85)); tv.x += key === 'A' ? -0.45 : 0.45;
      wobble(p, tv2.copy(slot).lerp(tv, ease(u / 0.5)), t, 0, true);
    }
    parts.A.forEach(function (p) { reactant(p, 'A'); });
    parts.B.forEach(function (p) { reactant(p, 'B'); });
    var np = m.pc.reduce(function (s, x) { return s + x; }, 0);
    m.pc.forEach(function (c, j) {
      var key = 'P' + j, off = 0; for (var z = 0; z < j; z++) off += m.pc[z];
      parts[key].forEach(function (p) {
        var e = Math.floor(p.idx / c), u = evt(e, E); p.halo.visible = false;
        if (u < 0.5) { p.g.visible = false; return; }
        p.g.visible = true;
        var k = p.idx - e * c, from = MEET.clone().add(ring(off + k, np, e, 1.0)), slot = slotPos(CX[key], p.idx);
        wobble(p, tv2.copy(from).lerp(slot, ease((u - 0.5) / 0.5)), t, u >= 1 ? 0.05 : 0, u < 1);
      });
    });
    for (var e = 0; e < E; e++) { var u = evt(e, E); if (u >= 0.5) dn++; flashAmt += Math.max(0, 1 - Math.abs(u - 0.5) / 0.1) * (u > 0 && u < 1 ? 1 : 0); }
    done = dn;
    flash.material.opacity = 0.75 * Math.min(1, flashAmt); flash.scale.setScalar(0.5 + 2.3 * Math.min(1, flashAmt)); flash.visible = flashAmt > 0.01;
    // etiquetas
    var showL = kit.layer('labels'); document.querySelectorAll('.bond-label').forEach(function () { });
    ['A', 'B', 'P0', 'P1'].forEach(function (k) {
      var isP = k[0] === 'P', id = isP ? (m.pid[+k[1]] || null) : m.r.R[k === 'A' ? 0 : 1][0];
      if (!id) return;
      var cur = isP ? done * m.pc[+k[1]] : (k === 'A' ? N.a - done * a : N.b - done * b);
      labels[k].set(fm(id) + ' · ' + cur, 'bl-d');
      var tag, cls = 'bl-d';
      if (isP) { tag = 'Producto'; cls = 'bl-lead'; }
      else if (m.lim === (k === 'A' ? 0 : 1)) { tag = 'LIMITANTE'; cls = 'bl-warn'; }
      else if (m.lim >= 0) { tag = 'EXCESO'; cls = 'bl-pos'; }
      else { tag = 'Proporción exacta'; cls = 'bl-neg'; }
      labels[k + 'tag'].set(tag, cls);
      labels[k].o.visible = labels[k + 'tag'].o.visible = showL && (k !== 'P1' || m.pid.length > 1);
    });
    labels.meet.o.visible = showL;
  }

  function resize() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h; camera.zoom = clamp(camera.aspect / 1.6, 0.5, 1.15) * (w > 900 ? 0.95 : 1);
    var off = w > 900 ? Math.min(280, w * 0.27) : 0;
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }
  function viewGoal(id) {
    if (id === 'frontal') return { pos: new T.Vector3(0, 8, 27), target: new T.Vector3(0, 3.2, 0) };
    if (id === 'superior') return { pos: new T.Vector3(0, 40, 2), target: new T.Vector3(0, 0, 0) };
    if (id === 'reactivos') return { pos: new T.Vector3(-7.5, 9, 22), target: new T.Vector3(-7.5, 2, 0) };
    if (id === 'productos') return { pos: new T.Vector3(7.5, 9, 22), target: new T.Vector3(7.5, 2, 0) };
    if (id === 'reaccion') return { pos: new T.Vector3(0, 6, 15), target: new T.Vector3(0, 2.6, 0) };
    return { pos: new T.Vector3(0, 13, 33), target: new T.Vector3(0, 2, 0) };
  }

  /* ------------------------- Control ------------------------- */
  function goManual() { if (!P.manual) { P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); }
  function applyChange(resetProg) {
    M = model(); if (resetProg !== false) { prog = 0; P.auto = false; }
    buildParticles(); refreshStageUI(); syncHud(); syncCtrl(); redrawAll(); kit.refresh && kit.refresh();
  }
  function setRx(id) {
    P.rx = id; var r = rx(); N.a = r.def[0]; N.b = r.def[1];
    applyChange(); if (ui.sA) { ui.sA.querySelector('input').max = r.maxA; ui.sB.querySelector('input').max = r.maxB; }
    syncCtrl(); calcRender();
  }
  function setN(a, b) { N.a = clamp(Math.round(a), 1, rx().maxA); N.b = clamp(Math.round(b), 1, rx().maxB); applyChange(); }
  function preset(kind) {
    var r = rx(), a = r.R[0][1], b = r.R[1][1];
    if (kind === 'exact') { var k = Math.min(Math.floor(r.maxA / a), Math.floor(r.maxB / b), 4); setN(k * a, k * b); }
    else if (kind === 'A') setN(3 * a, Math.min(r.maxB, 5 * b));
    else if (kind === 'B') setN(Math.min(r.maxA, 5 * a), 3 * b);
    else setN(1 + Math.floor(Math.random() * r.maxA), 1 + Math.floor(Math.random() * r.maxB));
  }
  function syncCtrl() { if (ui.sA) { ui.sA.set(N.a); ui.sB.set(N.b); ui.sA.querySelector('span').textContent = 'Cant. de ' + fm(M.r.R[0][0]); ui.sB.querySelector('span').textContent = 'Cant. de ' + fm(M.r.R[1][0]); } if (ui.rxOpts) ui.rxOpts.set(P.rx); updateInfo(); }
  function react() { P.manual = true; if (kit.state.playing) kit.pause(); prog = 0; P.auto = true; P.camGoal = viewGoal('frontal'); }

  function syncHud() {
    var m = M;
    kit.setEq({ chip: 'Estequiometría', name: m.r.eq, body:
      '<div class="eqline"><small>Relación molar</small>' + m.r.R.map(function (x) { return x[1]; }).join(' : ') + ' → ' + m.r.P.map(function (x) { return x[1]; }).join(' : ') + '</div>' +
      '<div class="eqline"><small>Tandas (n ÷ coef.)</small>' + fm(m.r.R[0][0]) + ': ' + fmt(m.ra, 2) + ' · ' + fm(m.r.R[1][0]) + ': ' + fmt(m.rb, 2) + '</div>' +
      '<div class="eqline"><small>Reactivo limitante</small>' + limName() + '</div>' +
      '<small>El menor cociente n ÷ coeficiente manda: fija el máximo de producto.</small>' });
    kit.setLegend([{ label: 'Limitante', color: '#ff6b5e', text: 'se agota primero' }, { label: 'Sobrante', color: '#e3b341', text: 'queda sin reaccionar' },
      { label: 'Átomos', color: '#4f7cff', text: 'H blanco · C gris · N azul · O rojo' }]);
  }
  function updateInfo() {
    if (!ui.info) return;
    var m = M, A = m.r.R[0][0], B = m.r.R[1][0];
    ui.info.innerHTML = '<div class="card-kicker">Datos de la mezcla</div>' +
      kv('Masa molar ' + fm(A), fmt(mm(A), 2) + ' g/mol') + kv('Masa molar ' + fm(B), fmt(mm(B), 2) + ' g/mol') +
      m.r.P.map(function (p) { return kv('Masa molar ' + fm(p[0]), fmt(mm(p[0]), 2) + ' g/mol'); }).join('') +
      kv('Tandas posibles', fm(A) + ' ' + fmt(m.ra, 2) + ' · ' + fm(B) + ' ' + fmt(m.rb, 2)) + kv('Tandas completas', String(m.E));
  }

  /* ------------------------- Gráficos ------------------------- */
  function drawBars(ctx, w, h, c) {
    var m = M, ids = [m.r.R[0][0], m.r.R[1][0]].concat(m.pid), n0 = [N.a, N.b].concat(m.pid.map(function () { return 0; }));
    var nn = [N.a - done * m.a, N.b - done * m.b].concat(m.pc.map(function (x) { return done * x; }));
    var fin = [m.la, m.lb].concat(m.pc.map(function (x) { return m.E * x; }));
    var mx = Math.max.apply(null, n0.concat(fin, nn)) || 1, L = 34, Rr = 8, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B, gw = pw / ids.length;
    ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = c.muted; ctx.strokeStyle = c.line;
    for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke(); ctx.fillText(fmt(mx * i / 4, 0), L - 5, y + 3); }
    ids.forEach(function (id, k) {
      var x0 = L + gw * k + gw * 0.14, bw = gw * 0.34;
      var isLim = k < 2 && m.lim === k;
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.4; ctx.strokeRect(x0, Tp + ph - ph * n0[k] / mx, bw, ph * n0[k] / mx);
      ctx.fillStyle = k < 2 ? (isLim ? '#ff6b5e' : '#e3b341') : '#b392f0';
      ctx.fillRect(x0 + bw + 3, Tp + ph - ph * nn[k] / mx, bw, ph * nn[k] / mx);
      ctx.fillStyle = c.ink; ctx.textAlign = 'center'; ctx.font = '700 11px system-ui, sans-serif'; ctx.fillText(fm(id), x0 + bw, h - B + 14);
      ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = c.muted; ctx.fillText(n0[k] + ' → ' + nn[k], x0 + bw, h - B + 27);
    });
    ctx.lineWidth = 1;
  }
  function drawYield(ctx, w, h, c) {
    var m = M, r = m.r, a = m.a, b = m.b, c0 = m.pc[0], maxB = r.maxB, L = 38, Rr = 10, Tp = 16, B = 34, pw = w - L - Rr, ph = h - Tp - B;
    var ymax = Math.max(1, Math.min(r.maxA / a, maxB / b) * c0, N.a / a * c0) * 1.08;
    var sx = function (x) { return L + pw * x / maxB; }, sy = function (y) { return Tp + ph - ph * y / ymax; };
    var star = N.a * b / a;
    ctx.fillStyle = 'rgba(255,107,94,.10)'; ctx.fillRect(sx(0), Tp, sx(Math.min(star, maxB)) - sx(0), ph);
    ctx.fillStyle = 'rgba(227,179,65,.10)'; if (star < maxB) ctx.fillRect(sx(star), Tp, sx(maxB) - sx(star), ph);
    ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) { var yy = Tp + ph - ph * i / 4; ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(L + pw, yy); ctx.stroke(); ctx.fillText(fmt(ymax * i / 4, 1), L - 5, yy + 3); }
    ctx.textAlign = 'center'; for (var j = 0; j <= 4; j++) ctx.fillText(fmt(maxB * j / 4, 0), L + pw * j / 4, h - B + 14);
    ctx.fillText('cantidad de ' + fm(r.R[1][0]) + ' (con ' + N.a + ' ' + fm(r.R[0][0]) + ' fijos)', L + pw / 2, h - 6);
    ctx.save(); ctx.translate(11, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('producto ' + fm(m.pid[0]), 0, 0); ctx.restore();
    ctx.strokeStyle = '#b392f0'; ctx.lineWidth = 2.4; ctx.beginPath();
    for (var x = 0; x <= maxB; x += maxB / 120) { var y = Math.min(N.a / a, x / b) * c0; if (x === 0) ctx.moveTo(sx(x), sy(y)); else ctx.lineTo(sx(x), sy(y)); }
    ctx.stroke(); ctx.lineWidth = 1;
    if (star <= maxB) { ctx.setLineDash([4, 4]); ctx.strokeStyle = c.ink; ctx.beginPath(); ctx.moveTo(sx(star), Tp); ctx.lineTo(sx(star), Tp + ph); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = c.ink; ctx.textAlign = 'left'; ctx.fillText('proporción exacta', sx(star) + 4, Tp + 11); }
    ctx.fillStyle = '#ff6b5e'; ctx.textAlign = 'left'; ctx.fillText(fm(r.R[1][0]) + ' limitante', L + 6, Tp + ph - 6);
    if (star < maxB) { ctx.fillStyle = '#e3b341'; ctx.textAlign = 'right'; ctx.fillText(fm(r.R[0][0]) + ' limitante', L + pw - 6, Tp + ph - 6); }
    var cy = Math.min(N.a / a, N.b / b) * c0; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff6b5e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(sx(N.b), sy(cy), 5.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  }
  function redrawAll() { ['g1', 'g2'].forEach(function (k) { ui[k] && ui[k].redraw(); }); }
  function buildGraphs(el) {
    var c1 = kit.ui.card('Antes y ahora (partículas)');
    ui.g1 = kit.ui.canvas(c1, { height: 220, label: 'Cantidades iniciales y actuales por especie', draw: drawBars });
    c1.insertAdjacentHTML('beforeend', '<p class="muted small">Contorno: cantidad inicial. Relleno: cantidad en este instante (reactivos en rojo si limitante, ámbar si en exceso; productos en violeta).</p>');
    var c2 = kit.ui.card('¿Qué pasa si agrego más del otro reactivo?');
    ui.g2 = kit.ui.canvas(c2, { height: 240, label: 'Producto formado frente a la cantidad del segundo reactivo', draw: drawYield });
    c2.insertAdjacentHTML('beforeend', '<p class="muted small">Con el primer reactivo fijo, el producto crece al agregar el segundo… hasta la <b>proporción exacta</b>; después queda en una meseta porque el limitante pasa a ser el primero. Agregar más del reactivo en exceso no aumenta el producto. (Escala de mol, sin redondear a tandas enteras.)</p>');
    el.appendChild(c1); el.appendChild(c2);
  }

  /* ------------------------- Cálculo en gramos ------------------------- */
  function calcModel() {
    var r = rx(), a = r.R[0], b = r.R[1], MA = mm(a[0]), MB = mm(b[0]);
    var nA = CAL.mA / MA, nB = CAL.mB / MB, rA = nA / a[1], rB = nB / b[1];
    var lim = Math.abs(rA - rB) < 1e-12 ? -1 : (rA < rB ? 0 : 1), xi = Math.min(rA, rB);
    var prods = r.P.map(function (p) { return { id: p[0], n: xi * p[1], m: xi * p[1] * mm(p[0]) }; });
    var lA = nA - xi * a[1], lB = nB - xi * b[1];
    return { r: r, a: a, b: b, MA: MA, MB: MB, nA: nA, nB: nB, rA: rA, rB: rB, lim: lim, xi: xi, prods: prods, lA: lA, lB: lB, mLA: lA * MA, mLB: lB * MB };
  }
  function calcRender() {
    if (!ui.calcOut) return;
    var c = calcModel(), p = clamp(CAL.prod, 0, c.prods.length - 1), t = c.prods[p], real = t.m * CAL.y / 100;
    var A = fm(c.a[0]), B = fm(c.b[0]), li = c.lim < 0 ? null : (c.lim === 0 ? A : B), ex = c.lim < 0 ? null : (c.lim === 0 ? B : A);
    var sumAfter = c.prods.reduce(function (s, x) { return s + x.m; }, 0) + c.mLA + c.mLB, sumBefore = CAL.mA + CAL.mB;
    function row(k, v) { return '<tr><th>' + k + '</th><td>' + v + '</td></tr>'; }
    ui.calcOut.innerHTML = '<div class="card-kicker">Resolución paso a paso</div><div class="muted small" style="margin-bottom:4px">' + c.r.eq + '</div>' +
      '<div class="calc-step">1 · Pasar masas a moles (n = m ÷ M)</div><table class="calc-table">' +
      row(A, fmt(CAL.mA, 1) + ' g ÷ ' + fmt(c.MA, 2) + ' g/mol = <b>' + fmt(c.nA, 3) + ' mol</b>') + row(B, fmt(CAL.mB, 1) + ' g ÷ ' + fmt(c.MB, 2) + ' g/mol = <b>' + fmt(c.nB, 3) + ' mol</b>') + '</table>' +
      '<div class="calc-step">2 · Dividir por el coeficiente (¿cuántas “tandas”?)</div><table class="calc-table">' +
      row(A, fmt(c.nA, 3) + ' ÷ ' + c.a[1] + ' = <b>' + fmt(c.rA, 3) + '</b>') + row(B, fmt(c.nB, 3) + ' ÷ ' + c.b[1] + ' = <b>' + fmt(c.rB, 3) + '</b>') +
      row('Reactivo limitante', c.lim < 0 ? 'ninguno: proporción exacta' : '<span class="calc-hi">' + li + '</span> (menor valor); exceso: ' + ex) + '</table>' +
      '<div class="calc-step">3 · Producto teórico (con el limitante)</div><table class="calc-table">' +
      c.prods.map(function (x) { return row(fm(x.id), fmt(x.n, 3) + ' mol × ' + fmt(mm(x.id), 2) + ' g/mol = <b>' + fmt(x.m, 2) + ' g</b>'); }).join('') + '</table>' +
      '<div class="calc-step">4 · Sobrante del reactivo en exceso</div><table class="calc-table">' +
      (c.lim < 0 ? row('Sobrante', 'ninguno') : row(ex, fmt(c.lim === 0 ? c.lB : c.lA, 3) + ' mol = <b>' + fmt(c.lim === 0 ? c.mLB : c.mLA, 2) + ' g</b>')) + '</table>' +
      '<div class="calc-step">5 · Rendimiento</div><table class="calc-table">' +
      row('Teórico de ' + fm(t.id), fmt(t.m, 2) + ' g') + row('Real (' + fmt(CAL.y, 0) + ' %)', '<b>' + fmt(real, 2) + ' g</b>') + '</table>' +
      '<div class="calc-step">Verificación: ley de conservación de la masa</div><table class="calc-table">' +
      row('Antes', fmt(sumBefore, 2) + ' g') + row('Después (productos + sobrante)', fmt(sumAfter, 2) + ' g <span class="calc-ok">' + (Math.abs(sumAfter - sumBefore) < 0.01 ? '✓ iguales' : '✗') + '</span>') + '</table>';
  }
  function buildCalc(el) {
    var c = kit.ui.card('Cálculo con masas (g)');
    ui.mA = kit.ui.slider({ label: 'Masa A', min: 1, max: 100, step: 0.5, value: CAL.mA, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { CAL.mA = v; calcRender(); } });
    ui.mB = kit.ui.slider({ label: 'Masa B', min: 1, max: 100, step: 0.5, value: CAL.mB, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { CAL.mB = v; calcRender(); } });
    ui.yY = kit.ui.slider({ label: '% real', min: 0, max: 100, step: 1, value: CAL.y, format: function (v) { return fmt(v, 0) + ' %'; }, onInput: function (v) { CAL.y = v; calcRender(); } });
    c.appendChild(kit.ui.sliders([ui.mA, ui.mB, ui.yY]));
    c.insertAdjacentHTML('beforeend', '<p class="muted small">A y B son los dos reactivos de la reacción elegida en la pestaña «Lab» (el orden de la ecuación). El % real es el rendimiento experimental.</p>');
    el.appendChild(c);
    ui.calcOut = kit.ui.card(''); el.appendChild(ui.calcOut); calcRender();
  }

  /* ------------------------- Desafío ------------------------- */
  var QUIZ = [
    { q: 'En N₂ + 3 H₂ → 2 NH₃ se mezclan 2 mol de N₂ y 9 mol de H₂. ¿Cuál es el reactivo limitante?', options: ['N₂', 'H₂', 'Ambos por igual', 'Ninguno'], answer: 0, why: 'n ÷ coeficiente: N₂ = 2 ÷ 1 = 2; H₂ = 9 ÷ 3 = 3. Gana el menor: N₂. Se forman 4 mol de NH₃ y sobran 3 mol de H₂ (9 − 6).' },
    { q: 'Para 2 H₂ + O₂ → 2 H₂O se mezclan 4 g de H₂ y 16 g de O₂. ¿Qué masa máxima de agua se obtiene?', options: ['≈ 18 g', '≈ 36 g', '≈ 20 g', '≈ 9 g'], answer: 0, why: 'n(H₂) = 4 ÷ 2,016 ≈ 1,98 mol (÷ 2 = 0,99); n(O₂) = 16 ÷ 32,00 = 0,50 mol (÷ 1 = 0,50). Limita el O₂: 0,50 × 2 = 1,00 mol de H₂O ≈ 18 g.' },
    { q: 'El reactivo limitante es el que…', options: ['Determina la cantidad máxima de producto', 'Tiene la menor masa en gramos', 'Tiene el menor coeficiente', 'Tiene la menor masa molar'], answer: 0, why: 'Es el que se agota primero. No depende de la masa en gramos ni del coeficiente por sí solos, sino de n ÷ coeficiente.' },
    { q: 'Si el rendimiento teórico es 20,0 g y se obtienen 15,0 g, el porcentaje de rendimiento es…', options: ['75 %', '133 %', '25 %', '15 %'], answer: 0, why: '% rendimiento = real ÷ teórico × 100 = 15,0 ÷ 20,0 × 100 = 75 %.' },
    { q: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O. Con 3 mol de CH₄ y 5 mol de O₂, ¿cuántos mol de CO₂ se forman?', options: ['2,5 mol', '3,0 mol', '5,0 mol', '1,5 mol'], answer: 0, why: 'CH₄: 3 ÷ 1 = 3; O₂: 5 ÷ 2 = 2,5. Limita el O₂, que permite 2,5 tandas: 2,5 mol de CO₂ (y 5 mol de H₂O).' },
    { q: 'Al terminar una reacción en la que sobra un reactivo, la masa total del sistema…', options: ['Es igual a la inicial', 'Es menor, porque desaparece el limitante', 'Es mayor, por los productos', 'Depende del rendimiento'], answer: 0, why: 'Ley de Lavoisier: en un sistema cerrado la masa se conserva. Lo que cambia es su distribución entre reactivos sobrantes y productos.' },
    { q: '2 CO + O₂ → 2 CO₂. En el reactor hay 6 moléculas de CO y 2 de O₂. ¿Qué ocurre?', options: ['Se forman 4 CO₂ y sobran 2 CO', 'Se forman 6 CO₂ y no sobra nada', 'Se forman 2 CO₂ y sobran 4 CO', 'Se forman 4 CO₂ y sobra 1 O₂'], answer: 0, why: 'CO: 6 ÷ 2 = 3; O₂: 2 ÷ 1 = 2. Limita el O₂: 2 tandas, cada una produce 2 CO₂ → 4 CO₂. Se consumen 4 CO; sobran 2.' },
    { q: 'Un estudiante dice: “el reactivo con menos moles es siempre el limitante”. ¿Es correcto?', options: ['No: hay que dividir los moles por el coeficiente estequiométrico', 'Sí, siempre', 'Solo si las masas molares son iguales', 'Solo en reacciones exotérmicas'], answer: 0, why: 'Ejemplo: 3 mol de N₂ y 6 mol de H₂ en N₂ + 3 H₂ → 2 NH₃. H₂ tiene más moles que N₂, pero 6 ÷ 3 = 2 < 3 ÷ 1 = 3: el limitante es el H₂.' }
  ];
  function buildQuiz(el) {
    var c = kit.ui.card('Desafío'); kit.ui.quiz(c, { items: QUIZ, intro: 'Ocho preguntas sobre reactivo limitante, cálculo de producto, rendimiento y conservación de la masa.' }); el.appendChild(c);
  }

  /* ------------------------- Pestaña Lab ------------------------- */
  function buildLab(el) {
    var c = kit.ui.card('Panel de control'); el.appendChild(c);
    ui.rxOpts = kit.ui.options({ label: 'Reacción', cols: 2, value: P.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].eq, sub: RX[k].name }; }), onChange: function (v) { goManual(); setRx(v); } });
    c.appendChild(ui.rxOpts);
    ui.sA = kit.ui.slider({ label: 'Cant. A', min: 1, max: rx().maxA, step: 1, value: N.a, format: function (v) { return v + ' partíc.'; }, onInput: function (v) { goManual(); setN(v, N.b); } });
    ui.sB = kit.ui.slider({ label: 'Cant. B', min: 1, max: rx().maxB, step: 1, value: N.b, format: function (v) { return v + ' partíc.'; }, onInput: function (v) { goManual(); setN(N.a, v); } });
    c.appendChild(kit.ui.sliders([ui.sA, ui.sB]));
    var f = document.createElement('div'); f.className = 'fld'; f.innerHTML = '<span class="lbl">Mezclas de ejemplo</span>';
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<button class="btn" data-p="exact">Proporción exacta</button><button class="btn" data-p="A">A limitante</button><button class="btn" data-p="B">B limitante</button><button class="btn" data-p="rnd">Al azar</button>';
    row.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { goManual(); preset(b.dataset.p); }); });
    f.appendChild(row); c.appendChild(f);
    var row2 = document.createElement('div'); row2.className = 'row';
    row2.innerHTML = '<button class="btn primary" id="btnReact">▶ Reaccionar</button><button class="btn" id="btnReset">Reiniciar</button><button class="btn" id="btnLesson">Volver a la lección</button>';
    row2.querySelector('#btnReact').addEventListener('click', react);
    row2.querySelector('#btnReset').addEventListener('click', function () { goManual(); prog = 0; P.auto = false; });
    row2.querySelector('#btnLesson').addEventListener('click', function () { P.manual = false; prog = 0; P.auto = false; kit.toast('La lección controla la simulación'); });
    c.appendChild(row2);
    ui.info = kit.ui.card('Datos'); el.appendChild(ui.info); updateInfo();
    el.appendChild(kit.ui.card('Nota didáctica', '<p class="muted small">Cada partícula es una molécula y la reacción ocurre en <b>tandas enteras</b> de la receta. En el laboratorio las cantidades son moles y pueden ser fraccionarias; la pestaña «Cálculo (g)» resuelve ese caso con masas reales (masas molares IUPAC).</p>'));
  }

  /* ------------------------- Arranque ------------------------- */
  function init() {
    setStages(stagesList());
    kit = SimKit.create({
      key: 'estequiometria',
      title: 'Estequiometría y reactivo limitante',
      subtitle: 'Simulador 3D · química general',
      accent: { dark: '#ffb36b', light: '#c2570c' },
      viewLabel: 'Visor 3D del reactor: reactivos, reacción por tandas y productos',
      stages: STAGES,
      mainTabLabel: 'Guía',
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: 'Gráficos', build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'calc', label: 'Cálculo (g)', build: function (el, k) { kit = k; buildCalc(el); } },
        { id: 'quiz', label: 'Desafío', build: function (el, k) { kit = k; buildQuiz(el); } }
      ],
      measuresTitle: 'Medidas en vivo',
      measures: function () {
        var m = M, A = fm(m.r.R[0][0]), B = fm(m.r.R[1][0]);
        return [['Reacción', m.r.eq], ['Cantidades iniciales', A + ' ' + N.a + ' · ' + B + ' ' + N.b], ['Tandas posibles (n ÷ coef.)', A + ' ' + fmt(m.ra, 2) + ' · ' + B + ' ' + fmt(m.rb, 2)],
          ['Reactivo limitante', limName()], ['Tandas completas', done + ' de ' + m.E], ['Productos formados', m.r.P.map(function (p) { return done * p[1] + ' ' + fm(p[0]); }).join(' · ')],
          ['Sobrante final', (m.la || m.lb) ? ((m.la ? m.la + ' ' + A : '') + (m.la && m.lb ? ' · ' : '') + (m.lb ? m.lb + ' ' + B : '')) : 'ninguno'],
          ['Masa inicial → ahora (si 1 partíc. = 1 mol)', fmt(mass0(), 1) + ' → ' + fmt(massNow(), 1) + ' g']];
      },
      ideas: [
        'La ecuación balanceada es una <b>receta</b>: los coeficientes dan la proporción fija entre reactivos y productos.',
        'El <b>reactivo limitante</b> es el de menor n ÷ coeficiente; fija el máximo de producto (rendimiento teórico).',
        'Agregar más del reactivo en <b>exceso</b> no produce más producto.',
        'La <b>masa se conserva</b> (Lavoisier): masa inicial = masa de productos + sobrante.',
        '% rendimiento = rendimiento real ÷ teórico × 100.'
      ],
      layers: [
        { id: 'halo', label: 'Limitante / sobrante', icon: '◎' },
        { id: 'labels', label: 'Etiquetas', icon: 'Aa' },
        { id: 'trays', label: 'Bandejas', icon: '▭' },
        { id: 'rot', label: 'Giro', icon: '⟳', on: false }
      ],
      onLayer: function (id, on) {
        if (id === 'trays') { Object.keys(trays).forEach(function (k) { trays[k].material.opacity = on ? 0.9 : 0; }); }
        if (id === 'rot' && controls) controls.autoRotate = on;
      },
      views: [{ id: 'libre', label: 'Libre' }, { id: 'frontal', label: 'Frontal' }, { id: 'reactivos', label: 'Reactivos' }, { id: 'reaccion', label: 'Reacción' }, { id: 'productos', label: 'Productos' }, { id: 'superior', label: 'Superior' }],
      onView: function (id) { P.camGoal = viewGoal(id); },
      onTheme: function (th) {
        if (!scene) return;
        scene.background = new T.Color(th === 'dark' ? 0x0e131a : 0xdbe6f1);
        floor.material.color.set(th === 'dark' ? 0x131a22 : 0x8fa3b8);
        Object.keys(trays).forEach(function (k) { trays[k].material.color.set(th === 'dark' ? 0x1d2733 : 0x7d93aa); });
      },
      onStage: function (i) {
        refreshStageUI();
        if (P.manual) return;
        P.camGoal = viewGoal(i === 3 ? 'reaccion' : i === 4 ? 'productos' : 'frontal');
      },
      onGuide: function () { if (P.manual) { P.manual = false; prog = 0; P.auto = false; } },
      onResize: resize,
      render: function () { renderer.render(scene, camera); labelRenderer.render(scene, camera); },
      onFrame: function (f) {
        if (!P.manual) { var i = f.i, l = f.local; prog = i < 3 ? 0 : (i === 3 ? ease(l) : 1); }
        else if (P.auto) { prog = Math.min(1, prog + f.dt / (2.5 + 0.9 * M.E)); if (prog >= 1) P.auto = false; }
        if (P.camGoal) { camera.position.lerp(P.camGoal.pos, 0.08); controls.target.lerp(P.camGoal.target, 0.08); if (camera.position.distanceTo(P.camGoal.pos) < 0.05) P.camGoal = null; }
        layout(f.now);
        redrawAll();
        controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera);
      },
      init: function (k) {
        kit = k; buildScene(); resize(); k.cfg.onTheme(k.state.theme);
        controls.autoRotate = k.layer('rot');
        refreshStageUI(); syncHud(); syncCtrl();
      },
      help: {
        intro: 'Elige la reacción y las cantidades en la pestaña «Lab», sigue la lección con el reproductor inferior o pulsa «Reaccionar». Gira la escena arrastrando; con «Volver a la lección» el guion retoma el control.',
        items: [
          ['Partículas', 'cada molécula es una partícula; reaccionan en tandas enteras de la receta estequiométrica.'],
          ['Halos', 'rojo = reactivo limitante; ámbar = sobrante que queda sin reaccionar.'],
          ['Gráficos', 'antes y ahora por especie, y producto frente a la cantidad del segundo reactivo (meseta del limitante).'],
          ['Cálculo (g)', 'resolución paso a paso con masas molares, sobrante, rendimiento real y verificación de la masa.'],
          ['Desafío', 'ocho preguntas de reactivo limitante, rendimiento y conservación de la masa.']
        ]
      }
    });
    kit.setMode && 0;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
