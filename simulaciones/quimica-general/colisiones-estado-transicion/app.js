/* Teoría de las colisiones y estado de transición — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js */
(function () {
  'use strict';
  var T = THREE, kit;
  var fmt = SimKit.fmt, clamp = SimKit.clamp;
  var R = 0.008314;               // kJ/(mol·K)
  var CSC = 1.732;                // kJ/mol por unidad de energía de la simulación (ver nota didáctica)
  var HALF = 4;                   // semiarista del recipiente
  var CAT_F = 0.55;               // el catalizador deja la barrera en el 55 %

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function ramp(l, a, b) { return ease((l - a) / (b - a)); }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function sci(x, d) { var e = x.toExponential(d == null ? 1 : d).split('e'), ex = parseInt(e[1], 10), m = e[0].replace('.', ','); var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return m + ' × 10' + String(ex).split('').map(function (c) { return map[c]; }).join(''); }
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185 * v); }

  /* ------------------------- Estado ------------------------- */
  var P = { mode: 'col', rx: 'hh', manual: false, camGoal: null };
  var C = { T: 350, Ea: 10, p: 1, N: 60, react: false, cat: false };      // modo colisiones
  var X = { xi: 0, T: 298, cat: false };                                   // modo estado de transición

  /* ------------------------- Datos de reacciones (modo TS) ------------------------- */
  var RX = {
    hh: { id: 'hh', f: 'H + H₂', sub: 'ΔH = 0', A: { s: 'H', col: 0xf2f2f2, r: 0.5 }, B: { s: 'H', col: 0xf2f2f2, r: 0.5 }, C: { s: 'H', col: 0xf2f2f2, r: 0.5 },
      r1AB: 0.74, r1BC: 0.74, dH: 0, Ea: 38, c: 0.5, eq: 'H· + H–H → H–H + ·H', tipo: 'neutra (reacción de intercambio)', pos: 'medio (simétrico)' },
    fh2: { id: 'fh2', f: 'F + H₂', sub: 'exotérmica', A: { s: 'F', col: 0x9ae66e, r: 0.68 }, B: { s: 'H', col: 0xf2f2f2, r: 0.5 }, C: { s: 'H', col: 0xf2f2f2, r: 0.5 },
      r1AB: 0.92, r1BC: 0.74, dH: -134, Ea: 6, c: 0.28, eq: 'F· + H–H → F–H + ·H', tipo: 'exotérmica', pos: 'temprano (parecido a los reactivos)' },
    hhf: { id: 'hhf', f: 'H + HF', sub: 'endotérmica', A: { s: 'H', col: 0xf2f2f2, r: 0.5 }, B: { s: 'H', col: 0xf2f2f2, r: 0.5 }, C: { s: 'F', col: 0x9ae66e, r: 0.68 },
      r1AB: 0.74, r1BC: 0.92, dH: 134, Ea: 140, c: 0.72, eq: 'H· + H–F → H–H + ·F', tipo: 'endotérmica', pos: 'tardío (parecido a los productos)' }
  };
  function rx() { return RX[P.rx]; }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  var profCache = {};
  function profile(r, cat) {
    var key = r.id + (cat ? 'c' : ''); if (profCache[key]) return profCache[key];
    var hi = Math.max(0, r.dH), peak = cat ? hi + CAT_F * (r.Ea - hi) : r.Ea;
    var a = Math.log(0.5) / Math.log(r.c);
    function g(xi) { return xi <= 0 || xi >= 1 ? 0 : Math.pow(Math.sin(Math.PI * Math.pow(xi, a)), 2); }
    function raw(xi, A) { return r.dH * smooth(xi) + A * g(xi); }
    function mx(A) { var m = -1e9, at = 0; for (var i = 0; i <= 200; i++) { var v = raw(i / 200, A); if (v > m) { m = v; at = i / 200; } } return [m, at]; }
    var lo = 0, hiA = 2000;
    for (var it = 0; it < 50; it++) { var mid = (lo + hiA) / 2; if (mx(mid)[0] < peak) lo = mid; else hiA = mid; }
    var A = (lo + hiA) / 2, m = mx(A);
    var o = { E: function (xi) { return raw(clamp(xi, 0, 1), A); }, xiTS: m[1], peak: m[0], Ea: m[0], EaRev: m[0] - r.dH };
    profCache[key] = o; return o;
  }
  function nAB(xi, c) { var f = function (x) { return 1 / (1 + Math.exp(-9 * (x - c))); }; return (f(xi) - f(0)) / (f(1) - f(0)); }
  function bondLen(r1, n) { return Math.min(r1 - 0.26 * Math.log(Math.max(n, 0.0004)), 3.4); }

  function eaEff() { return C.cat ? C.Ea * CAT_F : C.Ea; }
  function mbFrac(Ea, Tk) { // fracción de moléculas con E ≥ Ea (Maxwell–Boltzmann 3D)
    var x = Ea / (R * Tk); return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x);
  }
  function erfc(x) { var t = 1 / (1 + 0.3275911 * x), y = ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592; return y * t * Math.exp(-x * x); }
  function kRel(Ea, Tk) { return Math.exp(-Ea / (R * Tk)); }

  /* ------------------------- Lección ------------------------- */
  var STAGES = [0, 1, 2, 3, 4, 5].map(function () { return { name: '', short: '', title: '', text: '', dur: 8 }; });
  function setStages(arr) { arr.forEach(function (s, i) { var t = STAGES[i]; t.name = s[0]; t.short = s[1]; t.title = s[2]; t.text = s[3]; t.ts = !!s[4]; }); }
  function stagesCol() {
    return [
      ['Movimiento térmico', 'Movimiento', 'Un gas es un enjambre de moléculas en movimiento',
        '<p>Las moléculas se mueven en todas direcciones y chocan sin parar. No todas van igual de rápido: sus energías siguen la <b>distribución de Maxwell–Boltzmann</b> (pestaña <i>Energía</i>).</p><p>Todavía no hay reacción: observa las partículas <b>A</b> (rojas) y <b>B</b> (azules).</p>'],
      ['Choques A + B', 'Choques', 'No todo choque produce reacción',
        '<p>Según la <b>teoría de las colisiones</b>, para reaccionar A y B deben chocar; pero solo una pequeña fracción de los choques es <b>eficaz</b>.</p><p>El destello indica el resultado: <b>gris</b> = energía insuficiente, <b>naranja</b> = mala orientación, <b>verde</b> = choque eficaz (se forma AB, morado).</p>'],
      ['Energía de activación', 'Energía Ea', 'Se necesita una energía mínima: Ea',
        '<p>La energía cinética relativa debe superar la <b>energía de activación Ea</b>. Al subir Ea (la línea del gráfico se desplaza a la derecha) disminuye el área de moléculas con E ≥ Ea y la reacción se hace más lenta.</p><p>Aproximadamente, esa fracción vale e<sup>−Ea/RT</sup>.</p>'],
      ['Orientación', 'Orientación', 'Los choques deben tener la orientación adecuada',
        '<p>Cada partícula tiene una zona reactiva (el parche claro). Solo si los parches se enfrentan el choque puede ser eficaz. Esto se resume en el <b>factor estérico p</b>.</p><p>Al bajar p aparecen más choques <b>naranjas</b>: hay energía de sobra, pero la geometría no es la correcta.</p>'],
      ['Temperatura', 'Temperatura', 'Más temperatura, más choques eficaces',
        '<p>Al subir T aumenta la frecuencia de choques y, sobre todo, la fracción de moléculas con E ≥ Ea: la curva se ensancha y se desplaza. La ecuación de <b>Arrhenius</b> lo resume: k = A·e<sup>−Ea/RT</sup>.</p><p>En reacciones reales con Ea ≈ 50–60 kJ/mol, +10 K cerca de 298 K duplica aproximadamente la velocidad.</p>'],
      ['Catalizador', 'Catalizador', 'Un catalizador ofrece un camino con menor Ea',
        '<p>El catalizador no cambia ΔH ni la composición en el equilibrio: <b>baja la barrera</b> (aquí al 55 %). Más choques logran superarla y el catalizador se recupera sin consumirse.</p>']
    ];
  }
  function stagesTS() {
    var r = rx(), pf = profile(r, false), pc = profile(r, true);
    var sgn = r.dH > 0 ? 'endotérmica' : r.dH < 0 ? 'exotérmica' : 'termoneutra';
    return [
      ['Reactivos', 'Reactivos', r.eq.split('→')[0].trim(),
        '<p>' + r.A.s + ' se acerca a la molécula ' + r.B.s + '–' + r.C.s + '. El enlace B–C está intacto (orden 1) y no hay enlace A–B (orden 0). La energía potencial del sistema es la de los reactivos: nuestra referencia, 0 kJ/mol.</p>'],
      ['Aproximación', 'Aproximación', 'La energía potencial sube',
        '<p>Al acercarse, las nubes electrónicas se repelen y la energía aumenta. El enlace B–C se <b>debilita</b> (orden < 1) mientras empieza a formarse A–B. Observa en el gráfico que el punto sube por la barrera.</p>'],
      ['Estado de transición', 'Estado de transición', 'El punto más alto: el complejo activado ‡',
        '<p>En el máximo del camino de menor energía los enlaces A···B y B···C son <b>parciales</b> (órdenes cercanos a 0,5). Este <b>complejo activado</b> no es una sustancia aislable: dura ≈ 10⁻¹³ s, lo que tarda una vibración. Su energía respecto de los reactivos es la <b>Ea</b> (' + fmt(pf.Ea, 0) + ' kJ/mol).</p>', true],
      ['Formación de productos', 'Productos', 'Se completa el nuevo enlace',
        '<p>El enlace A–B termina de formarse y B–C se rompe: el sistema “cae” por el otro lado de la barrera y la energía baja hasta la de los productos (' + r.eq.split('→')[1].trim() + ').</p>'],
      ['Ea y ΔH', 'Ea y ΔH', 'Barrera y balance energético',
        '<p>Reacción <b>' + sgn + '</b>: ΔH = ' + (r.dH > 0 ? '+' : '') + fmt(r.dH, 0) + ' kJ/mol. Ea directa = ' + fmt(pf.Ea, 0) + ' kJ/mol; Ea inversa = ' + fmt(pf.EaRev, 0) + ' kJ/mol.</p><p><b>Postulado de Hammond:</b> el estado de transición se parece a la especie más cercana en energía; aquí es <b>' + r.pos + '</b>. Ea depende del camino; ΔH, solo de reactivos y productos.</p>'],
      ['Catalizador', 'Catalizador', 'Otro camino, otra barrera',
        '<p>Un catalizador abre un camino con un estado de transición de menor energía: la barrera directa baja de ' + fmt(pf.Ea, 0) + ' a ' + fmt(pc.Ea, 0) + ' kJ/mol y la inversa de ' + fmt(pf.EaRev, 0) + ' a ' + fmt(pc.EaRev, 0) + ' kJ/mol, pero <b>reactivos, productos y ΔH no cambian</b>. Acelera ambos sentidos y no modifica el equilibrio.</p>']
    ];
  }
  function refreshStageUI() {
    setStages(P.mode === 'col' ? stagesCol() : stagesTS());
    var i = kit.state.stage, s = STAGES[i];
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText'), t = document.getElementById('phTs');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text; if (t) t.hidden = !s.ts;
  }

  function drive(f) {
    var i = f.i, l = f.local;
    if (P.mode === 'col') {
      C.react = i >= 1; C.cat = false; C.p = 1; C.Ea = 8; C.T = 350;
      if (i === 2) C.Ea = lerp(6, 20, ramp(l, 0.1, 0.8));
      if (i === 3) { C.Ea = 8; C.p = lerp(1, 0.08, ramp(l, 0.1, 0.8)); }
      if (i === 4) { C.Ea = 10; C.p = 0.5; C.T = lerp(300, 700, ramp(l, 0.1, 0.9)); }
      if (i === 5) { C.Ea = 14; C.p = 0.5; C.T = 400; C.cat = l > 0.3; }
    } else {
      var pf = profile(rx(), false), xt = pf.xiTS;
      X.cat = i === 5 && l > 0.25; var pr = profile(rx(), X.cat); xt = pr.xiTS;
      if (i === 0) X.xi = 0;
      else if (i === 1) X.xi = xt * ease(l);
      else if (i === 2) X.xi = xt + 0.012 * Math.sin(f.now * 11);
      else if (i === 3) X.xi = lerp(xt, 1, ease(l));
      else X.xi = (0.5 - 0.5 * Math.cos(6.283 * Math.min(l * 1.6, 1))) * 1;
    }
  }

  /* ------------------------- Escena 3D ------------------------- */
  var scene, camera, renderer, labelRenderer, controls, sphereGeo, tableMat;
  var gCol, gTs, boxLines, catPlane, parts = [], patches = [], flashes = [], lbCat;
  var ts = {};
  var pop = [], stats = { coll: 0, fe: 0, fo: 0, ok: 0 }, evts = [], hist = [], histAcc = 0, simT = 0, lastT = 350;
  var COLA = 0xff6b5e, COLB = 0x58a6ff, COLP = 0xb392f0, COLPATCH = 0xffe066;

  function mkLabel(txt, cls) {
    var d = document.createElement('div'); d.className = 'bond-label ' + cls; d.textContent = txt;
    var o = new T.CSS2DObject(d); return { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; } };
  }
  function mat(col, op) {
    var m = new T.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.1 });
    if (op != null && op < 1) { m.transparent = true; m.opacity = op; m.depthWrite = false; }
    return m;
  }

  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 140);
    camera.position.set(7, 5, 15);
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer(); labelRenderer.domElement.className = 'labels-layer'; cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06; controls.minDistance = 3; controls.maxDistance = 45; controls.autoRotateSpeed = 1.2;
    controls.addEventListener('start', function () { P.camGoal = null; });
    scene.add(new T.AmbientLight(0xffffff, 0.8));
    var dl = new T.DirectionalLight(0xffffff, 1.1); dl.position.set(6, 10, 8); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x88aaff, 0.35); dl2.position.set(-8, -4, -6); scene.add(dl2);
    sphereGeo = new T.SphereGeometry(1, 22, 16);

    /* --- colisiones --- */
    gCol = new T.Group(); scene.add(gCol);
    boxLines = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(HALF * 2, HALF * 2, HALF * 2)), new T.LineBasicMaterial({ color: 0x8a9bb3, transparent: true, opacity: 0.7 }));
    gCol.add(boxLines);
    catPlane = new T.Mesh(new T.BoxGeometry(HALF * 2, 0.12, HALF * 2), new T.MeshStandardMaterial({ color: 0xe3b341, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.55 }));
    catPlane.position.y = -HALF + 0.06; gCol.add(catPlane);
    for (var i = 0; i < 130; i++) {
      var m = new T.Mesh(sphereGeo, mat(0xffffff)); m.visible = false; gCol.add(m); parts.push(m);
      var pt = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: COLPATCH })); pt.visible = false; gCol.add(pt); patches.push(pt);
    }
    for (var k = 0; k < 14; k++) { var fm = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); fm.visible = false; gCol.add(fm); flashes.push({ m: fm, t: 1, dur: 0.5, r: 0.5 }); }
    lbCat = mkLabel('Catalizador (superficie)', 'bl-pos'); scene.add(lbCat.o);

    /* --- estado de transición --- */
    gTs = new T.Group(); scene.add(gTs);
    ts.at = [0, 1, 2].map(function () { var m = new T.Mesh(sphereGeo, mat(0xffffff)); gTs.add(m); return m; });
    ts.bond = [0, 1].map(function () { var m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 14, 1, true), new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.8, depthWrite: false })); m.rotation.z = Math.PI / 2; var gg = new T.Group(); gg.add(m); gTs.add(gg); return { g: gg, m: m }; });
    ts.curve = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0x58a6ff })); gTs.add(ts.curve);
    ts.curveCat = new T.Line(new T.BufferGeometry(), new T.LineDashedMaterial({ color: 0x5ee3a2, dashSize: 0.25, gapSize: 0.18 })); gTs.add(ts.curveCat);
    ts.mark = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffe066 })); ts.mark.scale.setScalar(0.26); gTs.add(ts.mark);
    ts.drop = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.5 })); gTs.add(ts.drop);
    ts.catPlane = new T.Mesh(new T.BoxGeometry(8, 0.1, 3), new T.MeshStandardMaterial({ color: 0xe3b341, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.4 })); ts.catPlane.position.y = -1.3; gTs.add(ts.catPlane);
    ts.lbA = mkLabel('', 'bl-d'); ts.lbB = mkLabel('', 'bl-d'); ts.lbC = mkLabel('', 'bl-d'); ts.lbN1 = mkLabel('', 'bl-d'); ts.lbN2 = mkLabel('', 'bl-d');
    ts.lbTS = mkLabel('‡ Estado de transición', 'bl-warn'); ts.lbR = mkLabel('Reactivos', 'bl-d'); ts.lbP = mkLabel('Productos', 'bl-d'); ts.lbE = mkLabel('Energía potencial', 'bl-d');
    [ts.lbA, ts.lbB, ts.lbC, ts.lbN1, ts.lbN2, ts.lbTS, ts.lbR, ts.lbP, ts.lbE].forEach(function (l) { scene.add(l.o); });

    var table = new T.Mesh(new T.CylinderGeometry(10, 10, 0.2, 60), tableMat = new T.MeshStandardMaterial({ color: 0x161b22, roughness: 0.85 }));
    table.position.y = -6; scene.add(table);
    showGroup();
  }
  function showGroup() {
    gCol.visible = P.mode === 'col'; gTs.visible = P.mode === 'ts';
    lbCat.o.visible = false;
    [ts.lbA, ts.lbB, ts.lbC, ts.lbN1, ts.lbN2, ts.lbTS, ts.lbR, ts.lbP, ts.lbE].forEach(function (l) { l.o.visible = P.mode === 'ts'; });
  }
  function resize() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h; camera.zoom = clamp(camera.aspect / 1.15, 0.42, 1);
    var off = w > 900 ? Math.min(170, w * 0.14) : 0;
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }
  var MODECAM = { col: { d: 17, y: 6, x: 7 }, ts: { d: 13.5, y: 3.2, x: 0 } };
  function viewGoal(id) {
    var m = MODECAM[P.mode], d = m.d, ty = P.mode === 'ts' ? 1.6 : 0;
    if (id === 'frontal') return { pos: new T.Vector3(0, m.y * 0.2 + ty, d), target: new T.Vector3(0, ty, 0) };
    if (id === 'superior') return { pos: new T.Vector3(0, d * 0.95, 1.5), target: new T.Vector3(0, 0, 0) };
    if (id === 'lado') return { pos: new T.Vector3(d, m.y * 0.3, 0), target: new T.Vector3(0, ty, 0) };
    if (id === 'cerca') return { pos: new T.Vector3(0, m.y * 0.3 + ty, d * 0.6), target: new T.Vector3(0, ty, 0) };
    return null;
  }

  /* ------------------------- Física de colisiones ------------------------- */
  function sigma() { return 1.2 * Math.sqrt(C.T / 300); }
  function randDir() { var a = Math.random() * 6.283, z = Math.random() * 2 - 1, s = Math.sqrt(1 - z * z); return [s * Math.cos(a), z, s * Math.sin(a)]; }
  function newPart(type, x, y, z, v) {
    var o = randDir();
    return { type: type, x: x, y: y, z: z, vx: v[0], vy: v[1], vz: v[2], m: type === 2 ? 2 : 1, r: type === 2 ? 0.46 : 0.36, o: o, dead: false };
  }
  function resetPop() {
    pop = []; stats = { coll: 0, fe: 0, fo: 0, ok: 0 }; evts = []; hist = []; histAcc = 0; simT = 0; lastT = C.T;
    var n = Math.round(C.N / 2) * 2, sg = sigma();
    for (var i = 0; i < n; i++) {
      var ok = false, x, y, z, tries = 0;
      do { x = (Math.random() * 2 - 1) * (HALF - 0.5); y = (Math.random() * 2 - 1) * (HALF - 0.5); z = (Math.random() * 2 - 1) * (HALF - 0.5); ok = true;
        for (var j = 0; j < pop.length; j++) { var dx = pop[j].x - x, dy = pop[j].y - y, dz = pop[j].z - z; if (dx * dx + dy * dy + dz * dz < 0.9) { ok = false; break; } } tries++; } while (!ok && tries < 200);
      pop.push(newPart(i % 2, x, y, z, [gauss() * sg, gauss() * sg, gauss() * sg]));
    }
  }
  function counts() { var a = 0, b = 0, p = 0; pop.forEach(function (q) { if (!q.dead) { if (q.type === 0) a++; else if (q.type === 1) b++; else p++; } }); return { a: a, b: b, p: p }; }
  function spawnFlash(x, y, z, col, r) {
    for (var i = 0; i < flashes.length; i++) if (flashes[i].t >= 1) { var f = flashes[i]; f.t = 0; f.r = r; f.m.position.set(x, y, z); f.m.material.color.setHex(col); f.m.visible = true; return; }
  }
  function stepPhysics(dt, now) {
    if (C.T !== lastT) { var sc = Math.sqrt(C.T / lastT); pop.forEach(function (q) { q.vx *= sc; q.vy *= sc; q.vz *= sc; }); lastT = C.T; }
    var sub = 3, h = dt * 1.5 / sub, ea = eaEff(), ct = 1 - 2 * Math.sqrt(clamp(C.p, 0.02, 1));
    for (var s = 0; s < sub; s++) {
      for (var i = 0; i < pop.length; i++) {
        var q = pop[i]; if (q.dead) continue;
        q.x += q.vx * h; q.y += q.vy * h; q.z += q.vz * h;
        var L = HALF - q.r;
        if (q.x > L) { q.x = L; q.vx = -Math.abs(q.vx); } else if (q.x < -L) { q.x = -L; q.vx = Math.abs(q.vx); }
        if (q.y > L) { q.y = L; q.vy = -Math.abs(q.vy); } else if (q.y < -L) { q.y = -L; q.vy = Math.abs(q.vy); }
        if (q.z > L) { q.z = L; q.vz = -Math.abs(q.vz); } else if (q.z < -L) { q.z = -L; q.vz = Math.abs(q.vz); }
        // tumbling
        q.o[0] += (Math.random() - 0.5) * h * 14; q.o[1] += (Math.random() - 0.5) * h * 14; q.o[2] += (Math.random() - 0.5) * h * 14;
        var ol = Math.hypot(q.o[0], q.o[1], q.o[2]) || 1; q.o[0] /= ol; q.o[1] /= ol; q.o[2] /= ol;
      }
      var born = [];
      for (var a = 0; a < pop.length; a++) {
        var p1 = pop[a]; if (p1.dead) continue;
        for (var b = a + 1; b < pop.length; b++) {
          var p2 = pop[b]; if (p2.dead) continue;
          var dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z, rr = p1.r + p2.r;
          if (Math.abs(dx) > rr || Math.abs(dy) > rr || Math.abs(dz) > rr) continue;
          var d2 = dx * dx + dy * dy + dz * dz; if (d2 >= rr * rr || d2 < 1e-9) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d;
          var vn = (p1.vx - p2.vx) * nx + (p1.vy - p2.vy) * ny + (p1.vz - p2.vz) * nz;
          if (vn <= 0) continue;                       // se alejan
          var mu = p1.m * p2.m / (p1.m + p2.m), E = 0.5 * mu * vn * vn * CSC;
          var AB = (p1.type === 0 && p2.type === 1) || (p1.type === 1 && p2.type === 0);
          var cx = p1.x + nx * p1.r, cy = p1.y + ny * p1.r, cz = p1.z + nz * p1.r;
          if (AB && C.react) {
            stats.coll++;
            var oriOk = (p1.o[0] * nx + p1.o[1] * ny + p1.o[2] * nz >= ct) && (-(p2.o[0] * nx + p2.o[1] * ny + p2.o[2] * nz) >= ct);
            if (E < ea) { stats.fe++; spawnFlash(cx, cy, cz, 0x9aa4b2, 0.45); }
            else if (!oriOk) { stats.fo++; spawnFlash(cx, cy, cz, 0xffa23a, 0.5); }
            else {
              stats.ok++; evts.push(simT); spawnFlash(cx, cy, cz, 0x5ee3a2, 0.9);
              var M = p1.m + p2.m;
              born.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2, v: [(p1.m * p1.vx + p2.m * p2.vx) / M, (p1.m * p1.vy + p2.m * p2.vy) / M, (p1.m * p1.vz + p2.m * p2.vz) / M] });
              p1.dead = p2.dead = true; break;
            }
          }
          var j = (2 * mu * vn);
          p1.vx -= j / p1.m * nx; p1.vy -= j / p1.m * ny; p1.vz -= j / p1.m * nz;
          p2.vx += j / p2.m * nx; p2.vy += j / p2.m * ny; p2.vz += j / p2.m * nz;
          var ov = (rr - d) / 2 + 1e-4; p1.x -= nx * ov; p1.y -= ny * ov; p1.z -= nz * ov; p2.x += nx * ov; p2.y += ny * ov; p2.z += nz * ov;
        }
      }
      if (born.length) { pop = pop.filter(function (q) { return !q.dead; }); born.forEach(function (bb) { pop.push(newPart(2, bb.x, bb.y, bb.z, bb.v)); }); }
    }
    simT += dt; histAcc += dt;
    if (histAcc > 0.35) { histAcc = 0; var c = counts(); hist.push({ t: simT, a: c.a, b: c.b, p: c.p }); if (hist.length > 600) hist.shift(); }
    var cc = counts(); if (cc.a < 3 || cc.b < 3) { if (C.react) refillSoon(); }
    for (var f = 0; f < flashes.length; f++) { var fl = flashes[f]; if (fl.t < 1) { fl.t += dt / fl.dur; var k = Math.min(fl.t, 1); fl.m.scale.setScalar(fl.r * (0.4 + 1.6 * k)); fl.m.material.opacity = 0.75 * (1 - k); if (k >= 1) fl.m.visible = false; } }
  }
  var refillT = 0;
  function refillSoon() { refillT++; if (refillT > 60) { refillT = 0; resetPop(); kit.toast('Se agotaron los reactivos: se reinició la mezcla'); } }
  function rateNow() { var c = 0; for (var i = evts.length - 1; i >= 0; i--) { if (simT - evts[i] <= 5) c++; else break; } return c / Math.min(5, Math.max(simT, 1)); }

  function updCol(dt, now) {
    stepPhysics(dt, now);
    for (var i = 0; i < parts.length; i++) {
      var m = parts[i], pt = patches[i], q = pop[i];
      if (!q) { m.visible = pt.visible = false; continue; }
      m.visible = true; m.position.set(q.x, q.y, q.z); m.scale.setScalar(q.r);
      m.material.color.setHex(q.type === 0 ? COLA : q.type === 1 ? COLB : COLP);
      pt.visible = kit.layer('orient') && q.type !== 2;
      pt.position.set(q.x + q.o[0] * q.r * 0.9, q.y + q.o[1] * q.r * 0.9, q.z + q.o[2] * q.r * 0.9); pt.scale.setScalar(q.r * 0.42);
    }
    catPlane.visible = C.cat; lbCat.o.visible = C.cat && kit.layer('labels');
    lbCat.o.position.set(0, -HALF - 0.2, HALF);
  }

  /* ------------------------- Estado de transición (3D) ------------------------- */
  var tsKey = '';
  function rebuildCurve() {
    var r = rx(), p0 = profile(r, false), p1 = profile(r, true), pts = [], ptsC = [], emin = 1e9, emax = -1e9;
    for (var i = 0; i <= 120; i++) { var e = p0.E(i / 120); emin = Math.min(emin, e); emax = Math.max(emax, e); }
    ts.emin = emin; ts.emax = emax;
    for (var j = 0; j <= 120; j++) {
      var xi = j / 120;
      pts.push(new T.Vector3((xi - 0.5) * 7.2, 2.4 + (p0.E(xi) - emin) / (emax - emin) * 2.0, 0));
      ptsC.push(new T.Vector3((xi - 0.5) * 7.2, 2.4 + (p1.E(xi) - emin) / (emax - emin) * 2.0, 0));
    }
    ts.curve.geometry.setFromPoints(pts); ts.curveCat.geometry.setFromPoints(ptsC); ts.curveCat.computeLineDistances();
  }
  function updTs(dt, now) {
    var r = rx(), key = P.rx; if (tsKey !== key) { tsKey = key; rebuildCurve(); }
    var pr = profile(r, X.cat), p0 = profile(r, false);
    var c = p0.xiTS, nab = nAB(X.xi, c), nbc = 1 - nab;
    var rab = bondLen(r.r1AB, nab), rbc = bondLen(r.r1BC, nbc), U = 1.8;
    var xa = -rab * U, xb = 0, xc = rbc * U, sh = -(xa + xc) / 2;
    var jit = (nab > 0.2 && nbc > 0.2) ? 0.04 : 0.015;
    [[r.A, xa], [r.B, xb], [r.C, xc]].forEach(function (it, i) {
      var m = ts.at[i]; m.position.set(it[1] + sh + Math.sin(now * 9 + i * 2) * jit, Math.cos(now * 8 + i) * jit, 0); m.scale.setScalar(it[0].r); m.material.color.setHex(it[0].col);
    });
    [[0, xa, xb, nab], [1, xb, xc, nbc]].forEach(function (b) {
      var o = ts.bond[b[0]], len = Math.max(b[2] - b[1], 0.01), n = b[3];
      o.g.position.set((b[1] + b[2]) / 2 + sh, 0, 0); o.m.scale.set(0.05 + 0.17 * n, len, 0.05 + 0.17 * n); o.g.visible = n > 0.02;
      o.m.material.opacity = 0.15 + 0.7 * n;
    });
    var lab = kit.layer('labels');
    ts.lbA.set(r.A.s, 'bl-d'); ts.lbB.set(r.B.s, 'bl-d'); ts.lbC.set(r.C.s, 'bl-d');
    ts.lbA.o.position.set(xa + sh, r.A.r + 0.5, 0); ts.lbB.o.position.set(sh, r.B.r + 0.5, 0); ts.lbC.o.position.set(xc + sh, r.C.r + 0.5, 0);
    ts.lbN1.set('n = ' + fmt(nab, 2), 'bl-pos'); ts.lbN2.set('n = ' + fmt(nbc, 2), 'bl-neg');
    ts.lbN1.o.position.set((xa + xb) / 2 + sh, -0.9, 0); ts.lbN2.o.position.set((xb + xc) / 2 + sh, -0.9, 0);
    ts.lbN1.o.visible = ts.lbN2.o.visible = lab && kit.layer('bonds');
    var near = Math.abs(X.xi - pr.xiTS) < 0.05;
    ts.lbTS.o.visible = near; ts.lbTS.o.position.set((pr.xiTS - 0.5) * 7.2, 5.3, 0);
    ts.lbR.o.position.set(-3.6, 2.0, 0); ts.lbP.o.position.set(3.6, 2.4 + (p0.E(1) - ts.emin) / (ts.emax - ts.emin) * 2.0 - 0.4, 0); ts.lbE.o.position.set(-3.7, 5.0, 0);
    ts.lbR.o.visible = ts.lbP.o.visible = ts.lbE.o.visible = lab;
    ts.lbA.o.visible = ts.lbB.o.visible = ts.lbC.o.visible = lab;
    var e = pr.E(X.xi), my = 2.4 + (e - ts.emin) / (ts.emax - ts.emin) * 2.0, mx = (X.xi - 0.5) * 7.2;
    ts.mark.position.set(mx, my, 0);
    ts.drop.geometry.setFromPoints([new T.Vector3(mx, my, 0), new T.Vector3(mx, 1.9, 0)]);
    ts.curve.visible = ts.drop.visible = ts.mark.visible = kit.layer('profile'); ts.curveCat.visible = kit.layer('profile') && X.cat;
    ts.catPlane.visible = X.cat;
  }

  function sceneFrame(dt, f) {
    if (P.camGoal) { camera.position.lerp(P.camGoal.pos, 0.08); controls.target.lerp(P.camGoal.target, 0.08); if (camera.position.distanceTo(P.camGoal.pos) < 0.04) P.camGoal = null; }
    if (P.mode === 'col') updCol(dt, f.now); else updTs(dt, f.now);
    controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera);
  }

  /* ------------------------- Gráficos ------------------------- */
  function axes(ctx, w, h, c, o) {
    var L = 46, Rr = 10, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B;
    ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.lineWidth = 1; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'right';
    for (var i = 0; i <= o.ny; i++) {
      var y = Tp + ph - (i / o.ny) * ph; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke();
      ctx.fillText(fmt(o.ymin + (o.ymax - o.ymin) * i / o.ny, o.yd || 0), L - 5, y + 3);
    }
    ctx.textAlign = 'center';
    for (var j = 0; j <= o.nx; j++) {
      var x = L + (j / o.nx) * pw; ctx.beginPath(); ctx.moveTo(x, Tp + ph); ctx.lineTo(x, Tp + ph + 4); ctx.stroke();
      ctx.fillText(fmt(o.xmin + (o.xmax - o.xmin) * j / o.nx, o.xd || 0), x, Tp + ph + 15);
    }
    ctx.fillStyle = c.ink; ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(o.xl, L + pw / 2, h - 5);
    ctx.save(); ctx.translate(11, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.yl, 0, 0); ctx.restore();
    return { L: L, T: Tp, pw: pw, ph: ph, X: function (v) { return L + (v - o.xmin) / (o.xmax - o.xmin) * pw; }, Y: function (v) { return Tp + ph - (v - o.ymin) / (o.ymax - o.ymin) * ph; } };
  }
  function dot(ctx, x, y, col) { ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill(); ctx.stroke(); }
  function line(ctx, g, fn, x0, x1, col, lw, dash, n) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); n = n || 140;
    for (var i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n, px = g.X(x), py = g.Y(fn(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  function arrowV(ctx, x, y1, y2, col, label, side) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    var d = y2 < y1 ? 1 : -1;
    [[y2, d], [y1, -d]].forEach(function (a) { ctx.beginPath(); ctx.moveTo(x, a[0]); ctx.lineTo(x - 4, a[0] + 7 * a[1]); ctx.lineTo(x + 4, a[0] + 7 * a[1]); ctx.closePath(); ctx.fill(); });
    ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = side === 'l' ? 'right' : 'left'; ctx.fillText(label, x + (side === 'l' ? -6 : 6), (y1 + y2) / 2 + 3);
  }

  function mbf(E, Tk) { var rt = R * Tk; return 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / rt, 1.5) * Math.exp(-E / rt); }
  function drawMB(ctx, w, h, c) {
    var Tk = C.T, ea = eaEff(), xmax = 40, pk = 0;
    [Tk, 300].forEach(function (t) { for (var E = 0.2; E < xmax; E += 0.2) pk = Math.max(pk, mbf(E, t)); });
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: xmax, ymin: 0, ymax: pk * 1.15, nx: 8, ny: 4, yd: 2, xl: 'Energía cinética E (kJ/mol)', yl: 'Fracción de moléculas por kJ/mol' });
    ctx.fillStyle = 'rgba(248,81,73,0.28)'; ctx.beginPath(); ctx.moveTo(g.X(ea), g.Y(0));
    for (var E = ea; E <= xmax; E += 0.2) ctx.lineTo(g.X(E), g.Y(mbf(E, Tk)));
    ctx.lineTo(g.X(xmax), g.Y(0)); ctx.closePath(); ctx.fill();
    if (Math.abs(Tk - 300) > 4) line(ctx, g, function (E) { return mbf(Math.max(E, 0.001), 300); }, 0, xmax, c.muted, 1.4, [4, 4], 200);
    line(ctx, g, function (E) { return mbf(Math.max(E, 0.001), Tk); }, 0, xmax, c.accent, 2.6, null, 200);
    ctx.strokeStyle = c.warn; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(g.X(ea), g.T); ctx.lineTo(g.X(ea), g.T + g.ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '600 10.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = c.warn; ctx.fillText('Ea = ' + fmt(ea, 1), g.X(ea) + 5, g.T + 12);
    ctx.fillStyle = c.ink; ctx.fillText('E ≥ Ea: ' + fmt(mbFrac(ea, Tk) * 100, mbFrac(ea, Tk) < 0.1 ? 1 : 0) + ' %', g.X(ea) + 5, g.T + 26);
    ctx.fillStyle = c.accent; ctx.textAlign = 'right'; ctx.fillText(fmt(Tk, 0) + ' K', g.L + g.pw - 4, g.T + 12);
    if (Math.abs(Tk - 300) > 4) { ctx.fillStyle = c.muted; ctx.fillText('300 K (referencia)', g.L + g.pw - 4, g.T + 26); }
  }
  function drawConc(ctx, w, h, c) {
    var t1 = Math.max(60, simT), t0 = t1 - 60, n0 = Math.max(C.N / 2, 10);
    var g = axes(ctx, w, h, c, { xmin: t0, xmax: t1, ymin: 0, ymax: Math.ceil(n0 / 10) * 10 + 4, nx: 6, ny: 4, xl: 'Tiempo (s)', yl: 'Número de partículas' });
    [['a', COLA, 'A'], ['b', COLB, 'B'], ['p', COLP, 'AB']].forEach(function (s) {
      ctx.strokeStyle = hex(s[1]); ctx.lineWidth = 2.2; ctx.beginPath(); var first = true;
      hist.forEach(function (hh) { if (hh.t < t0) return; var x = g.X(hh.t), y = g.Y(hh[s[0]]); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke();
    });
    ctx.font = '600 10.5px system-ui, sans-serif'; ctx.textAlign = 'left';
    [['A', COLA], ['B', COLB], ['AB', COLP]].forEach(function (s, i) { ctx.fillStyle = hex(s[1]); ctx.fillText('● ' + s[0], g.L + 8 + i * 48, g.T + 12); });
  }
  function drawArr(ctx, w, h, c) {
    var ea = P.mode === 'col' ? eaEff() : profile(rx(), X.cat).Ea, ea0 = P.mode === 'col' ? C.Ea : profile(rx(), false).Ea, Tk = P.mode === 'col' ? C.T : X.T;
    var big = Math.max(ea, ea0), ymin = -big / (R * 200) * 1.05;
    var g = axes(ctx, w, h, c, { xmin: 1.25, xmax: 5, ymin: ymin, ymax: 0, nx: 5, ny: 4, xd: 1, yd: 0, xl: '1000 / T  (K⁻¹)', yl: 'ln k  (con A = 1)' });
    var ln = function (e) { return function (x) { return -e / (R * (1000 / x)); }; };
    if (Math.abs(ea0 - ea) > 0.01) line(ctx, g, ln(ea0), 1.25, 5, c.muted, 1.5, [4, 4], 40);
    line(ctx, g, ln(ea), 1.25, 5, c.accent, 2.6, null, 40);
    var x = clamp(1000 / Tk, 1.25, 5); dot(ctx, g.X(x), g.Y(ln(ea)(x)), '#f85149');
    ctx.font = '10.5px system-ui, sans-serif'; ctx.fillStyle = c.accent; ctx.textAlign = 'left'; ctx.fillText('pendiente = −Ea/R', g.L + 8, g.T + 14);
    if (Math.abs(ea0 - ea) > 0.01) { ctx.fillStyle = c.muted; ctx.fillText('trazo punteado: sin catalizador', g.L + 8, g.T + 28); }
  }
  function drawProfile(ctx, w, h, c) {
    var r = rx(), p0 = profile(r, false), p1 = profile(r, true), emin = Math.min(0, r.dH), emax = p0.peak, pad = (emax - emin) * 0.16;
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: 1, ymin: emin - pad, ymax: emax + pad, nx: 5, ny: 4, xd: 1, xl: 'Coordenada de reacción', yl: 'Energía potencial (kJ/mol)' });
    ctx.strokeStyle = c.muted; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
    [0, r.dH].forEach(function (v) { ctx.beginPath(); ctx.moveTo(g.L, g.Y(v)); ctx.lineTo(g.L + g.pw, g.Y(v)); ctx.stroke(); }); ctx.setLineDash([]);
    if (X.cat) line(ctx, g, p0.E, 0, 1, c.muted, 1.4, [4, 4], 120);
    var cur = X.cat ? p1 : p0;
    line(ctx, g, cur.E, 0, 1, X.cat ? c.ok : c.accent, 2.8, null, 120);
    ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = c.muted;
    ctx.fillText('Reactivos', g.X(0.02), g.Y(0) + (r.dH < -30 ? -6 : 14)); ctx.textAlign = 'right'; ctx.fillText('Productos', g.X(0.99), g.Y(r.dH) + (r.dH > 30 ? -6 : 14));
    ctx.textAlign = 'center'; ctx.fillStyle = c.warn; ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('‡', g.X(cur.xiTS), g.Y(cur.peak) - 6);
    var st = kit.state.stage, hi = st === 4;
    arrowV(ctx, g.X(0.07), g.Y(0), g.Y(cur.peak), hi ? c.ink : c.warn, 'Ea ' + fmt(cur.Ea, 0), 'r');
    if (Math.abs(r.dH) > 1) arrowV(ctx, g.X(0.95), g.Y(0), g.Y(r.dH), hi ? c.ink : c.ok, 'ΔH ' + (r.dH > 0 ? '+' : '') + fmt(r.dH, 0), 'l');
    arrowV(ctx, g.X(0.84), g.Y(r.dH), g.Y(cur.peak), c.muted, "Ea' " + fmt(cur.EaRev, 0), 'l');
    var e = cur.E(X.xi); dot(ctx, g.X(X.xi), g.Y(e), '#f85149');
  }
  function drawOrder(ctx, w, h, c) {
    var r = rx(), cc = profile(r, false).xiTS;
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: 1, ymin: 0, ymax: 1, nx: 5, ny: 4, xd: 1, yd: 1, xl: 'Coordenada de reacción', yl: 'Orden de enlace n' });
    line(ctx, g, function (x) { return nAB(x, cc); }, 0, 1, c.ok, 2.6, null, 80);
    line(ctx, g, function (x) { return 1 - nAB(x, cc); }, 0, 1, c.warn, 2.6, null, 80);
    ctx.font = '600 10.5px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = c.ok; ctx.fillText('A–B (se forma)', g.L + g.pw / 2, g.T + 12); ctx.fillStyle = c.warn; ctx.fillText('B–C (se rompe)', g.L + g.pw / 2, g.T + 26);
    var x = clamp(X.xi, 0, 1); dot(ctx, g.X(x), g.Y(nAB(x, cc)), c.ok); dot(ctx, g.X(x), g.Y(1 - nAB(x, cc)), c.warn);
    ctx.strokeStyle = c.accent; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(g.X(cc), g.T); ctx.lineTo(g.X(cc), g.T + g.ph); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawMain(ctx, w, h, c) {
    if (P.mode === 'ts') { drawProfile(ctx, w, h, c); return; }
    var tot = Math.max(stats.coll, 1), rows = [['Energía insuficiente', stats.fe, '#9aa4b2'], ['Mala orientación', stats.fo, '#ffa23a'], ['Choque eficaz', stats.ok, '#5ee3a2']];
    ctx.font = '600 11px system-ui, sans-serif'; ctx.textBaseline = 'middle';
    rows.forEach(function (r, i) {
      var y = 26 + i * 38, wb = w - 190, frac = r[1] / tot;
      ctx.fillStyle = c.ink; ctx.textAlign = 'left'; ctx.fillText(r[0], 8, y);
      ctx.fillStyle = c.line; ctx.fillRect(130, y - 8, wb, 16); ctx.fillStyle = r[2]; ctx.fillRect(130, y - 8, Math.max(2, wb * frac), 16);
      ctx.fillStyle = c.ink; ctx.textAlign = 'right'; ctx.fillText(r[1] + ' · ' + fmt(frac * 100, 0) + ' %', w - 6, y);
    });
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = c.muted; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Choques A + B contados: ' + stats.coll, 8, h - 8);
  }

  /* ------------------------- Predictor y desafío ------------------------- */
  var calc = { ea: 50, t1: 298, t2: 308 };
  function buildPredictor(el) {
    var c = kit.ui.card('Calculadora de Arrhenius');
    c.insertAdjacentHTML('beforeend', '<p class="muted small">Compara las constantes de velocidad a dos temperaturas: ln(k₂/k₁) = (Ea/R)·(1/T₁ − 1/T₂).</p><div id="calcCtrl"></div><div id="calcOut"></div>');
    el.appendChild(c);
    var host = c.querySelector('#calcCtrl');
    var s1 = kit.ui.slider({ label: 'Ea', min: 10, max: 200, step: 1, value: calc.ea, format: function (v) { return fmt(v, 0) + ' kJ/mol'; }, onInput: function (v) { calc.ea = v; go(); } });
    var s2 = kit.ui.slider({ label: 'T₁', min: 250, max: 600, step: 1, value: calc.t1, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { calc.t1 = v; go(); } });
    var s3 = kit.ui.slider({ label: 'T₂', min: 250, max: 700, step: 1, value: calc.t2, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { calc.t2 = v; go(); } });
    host.appendChild(kit.ui.sliders([s1, s2, s3]));
    function go() {
      var ratio = Math.exp(calc.ea / R * (1 / calc.t1 - 1 / calc.t2));
      var r10 = Math.exp(calc.ea / R * (1 / calc.t1 - 1 / (calc.t1 + 10)));
      c.querySelector('#calcOut').innerHTML = '<div class="grid2" style="margin:8px 0"><div class="stat"><small>k₂ / k₁</small><b>' + (ratio >= 1000 ? sci(ratio, 2) : fmt(ratio, 2)) + '</b></div><div class="stat"><small>Efecto de +10 K desde T₁</small><b>× ' + fmt(r10, 2) + '</b></div></div>' +
        '<p class="muted small">Con Ea = 53 kJ/mol la velocidad se duplica al pasar de 298 K a 308 K. Para Ea menores el efecto de la temperatura es más débil; para Ea mayores, más fuerte.</p>';
    }
    go();
    var q = kit.ui.card('Modo desafío'); el.appendChild(q);
    kit.ui.quiz(q, { items: QUIZ, intro: 'Ocho preguntas sobre colisiones, energía de activación, estado de transición y catálisis.' });
  }
  var QUIZ = [
    { q: 'Según la teoría de las colisiones, ¿qué se necesita para que un choque entre A y B sea eficaz?', options: ['Energía ≥ Ea y orientación adecuada', 'Solo que las moléculas choquen', 'Solo energía mayor que ΔH', 'Que haya un catalizador'], answer: 0, why: 'Hacen falta las dos condiciones: energía cinética relativa mayor o igual que Ea y una orientación que permita reorganizar los enlaces.' },
    { q: 'Al aumentar la temperatura aumenta la velocidad de reacción principalmente porque…', options: ['Una fracción mayor de choques supera Ea', 'Disminuye la energía de activación', 'Cambia ΔH de la reacción', 'Se forman más moléculas'], answer: 0, why: 'La distribución de Maxwell–Boltzmann se ensancha: aumenta el área con E ≥ Ea (≈ e^(−Ea/RT)). La Ea no cambia con T.' },
    { q: 'Un catalizador…', options: ['Baja Ea sin cambiar ΔH', 'Baja ΔH y Ea', 'Sube la temperatura de reacción', 'Desplaza el equilibrio hacia los productos'], answer: 0, why: 'Ofrece otro camino de menor barrera: acelera ambos sentidos por igual y no modifica ΔH ni la composición en el equilibrio.' },
    { q: 'En un diagrama de coordenada de reacción, el punto máximo corresponde…', options: ['Al estado de transición (complejo activado)', 'A un intermediario estable', 'A los productos', 'A los reactivos'], answer: 0, why: 'El máximo es el estado de transición: especie inestable con enlaces parciales, que no puede aislarse (a diferencia de un intermediario, que ocupa un mínimo).' },
    { q: 'Una reacción tiene Ea directa = 80 kJ/mol y ΔH = −50 kJ/mol. ¿Cuánto vale la Ea de la reacción inversa?', options: ['130 kJ/mol', '30 kJ/mol', '80 kJ/mol', '−50 kJ/mol'], answer: 0, why: "Ea(inversa) = Ea(directa) − ΔH = 80 − (−50) = 130 kJ/mol." },
    { q: 'Según el postulado de Hammond, en una reacción muy exotérmica el estado de transición…', options: ['Se parece a los reactivos (temprano)', 'Se parece a los productos (tardío)', 'Está a mitad de camino exacto', 'No existe'], answer: 0, why: 'El estado de transición se asemeja a la especie más cercana en energía: en reacciones exotérmicas es temprano y la barrera suele ser baja.' },
    { q: 'En la gráfica de Arrhenius (ln k frente a 1/T) la pendiente vale…', options: ['−Ea / R', '+Ea / R', '−ΔH / R', 'A'], answer: 0, why: 'ln k = ln A − (Ea/R)(1/T): recta con pendiente −Ea/R y ordenada en el origen ln A.' },
    { q: 'Dos moléculas chocan con energía de sobra pero sin la orientación adecuada. ¿Qué ocurre?', options: ['Rebotan sin reaccionar', 'Reaccionan igual', 'Se forma un catalizador', 'Baja la temperatura'], answer: 0, why: 'La energía es necesaria pero no suficiente: el factor estérico p refleja la fracción de choques con geometría favorable.' }
  ];

  /* ------------------------- Interfaz con el kit ------------------------- */
  var ui = {};
  function goManual() { if (!P.manual) { P.manual = true; kit.toast('Modo libre: tú controlas la simulación'); } if (kit.state.playing) kit.pause(); }
  function eqChip() { return P.mode === 'col' ? 'Colisiones' : 'Estado de transición'; }
  function eqName() { return P.mode === 'col' ? 'A + B → AB · gas ideal en un recipiente' : rx().f + ' · ' + rx().tipo; }
  function eqBody() {
    if (P.mode === 'col') {
      return '<div class="eqline"><small>Reacción</small>A + B → AB</div>' +
        '<div class="eqline"><small>Ley de velocidad</small>v = k·[A]·[B]</div>' +
        '<div class="eqline"><small>Arrhenius</small>k = A·e<sup>−Ea/RT</sup></div>' +
        '<small>Choque eficaz ⇔ E ≥ Ea y orientación adecuada (factor estérico p)</small>';
    }
    var r = rx(), pf = profile(r, false);
    return '<div class="eqline"><small>Reacción · ΔH = ' + (r.dH > 0 ? '+' : '') + fmt(r.dH, 0) + ' kJ/mol</small>' + r.eq + '</div>' +
      '<div class="eqline"><small>Complejo activado</small>[' + r.A.s + '···' + r.B.s + '···' + r.C.s + ']‡</div>' +
      '<div class="eqline"><small>Eyring</small>k = (k<sub>B</sub>T/h)·e<sup>−ΔG‡/RT</sup></div>' +
      '<small>Ea = ' + fmt(pf.Ea, 0) + ' · Ea inversa = ' + fmt(pf.EaRev, 0) + ' kJ/mol · TS ' + r.pos + '</small>';
  }
  function legendRows() {
    var rows = [];
    if (P.mode === 'col') {
      rows.push({ color: hex(COLA), label: 'A', text: 'reactivo' }, { color: hex(COLB), label: 'B', text: 'reactivo' }, { color: hex(COLP), label: 'AB', text: 'producto' });
      if (kit.layer('orient')) rows.push({ color: hex(COLPATCH), label: 'Parche', text: 'zona reactiva (orientación)' });
      rows.push({ color: '#9aa4b2', label: 'Destello', text: 'gris: sin E · naranja: mal orientado · verde: eficaz' });
    } else {
      var r = rx();
      rows.push({ color: hex(r.A.col), label: r.A.s, text: 'átomo que se acerca' }, { color: hex(r.B.col), label: r.B.s, text: 'átomo central' }, { color: hex(r.C.col), label: r.C.s, text: 'átomo que se va' });
      rows.push({ color: '#ffe066', label: 'Enlace', text: 'grosor y opacidad ∝ orden de enlace n' });
      if (kit.layer('profile')) rows.push({ color: '#58a6ff', label: 'Perfil', text: 'energía potencial; punto = sistema' });
    }
    return rows;
  }
  function rebuildCtrl() {
    var host = ui.ctrl; if (!host) return; host.innerHTML = '';
    if (P.mode === 'col') {
      ui.sT = kit.ui.slider({ label: 'Temp.', min: 200, max: 800, step: 5, value: C.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { goManual(); C.T = v; C.react = true; } });
      ui.sE = kit.ui.slider({ label: 'Ea', min: 2, max: 30, step: 0.5, value: C.Ea, format: function (v) { return fmt(v, 1) + ' kJ/mol'; }, onInput: function (v) { goManual(); C.Ea = v; C.react = true; } });
      ui.sP = kit.ui.slider({ label: 'Factor p', min: 0.05, max: 1, step: 0.05, value: C.p, format: function (v) { return fmt(v, 2); }, onInput: function (v) { goManual(); C.p = v; C.react = true; } });
      ui.sN = kit.ui.slider({ label: 'Concent.', min: 20, max: 120, step: 10, value: C.N, format: function (v) { return fmt(v, 0) + ' partíc.'; }, onInput: function (v) { goManual(); C.N = v; C.react = true; resetPop(); } });
      host.appendChild(kit.ui.sliders([ui.sT, ui.sE, ui.sP, ui.sN]));
      var fld = document.createElement('div'); fld.className = 'fld'; fld.innerHTML = '<span class="lbl">Catalizador</span>';
      ui.catSeg = kit.ui.seg([{ v: false, label: 'Sin catalizador' }, { v: true, label: 'Con catalizador' }], C.cat, function (v) { goManual(); C.cat = v; C.react = true; });
      fld.appendChild(ui.catSeg); host.appendChild(fld);
      var row = document.createElement('div'); row.className = 'row';
      row.innerHTML = '<button class="btn" id="btnReset">Reiniciar mezcla</button><button class="btn primary" id="btnLesson">Volver a la lección</button>';
      host.appendChild(row);
      row.querySelector('#btnReset').addEventListener('click', function () { resetPop(); });
      row.querySelector('#btnLesson').addEventListener('click', function () { P.manual = false; resetPop(); kit.toast('La lección controla la simulación'); });
    } else {
      ui.rxOpts = kit.ui.options({ label: 'Reacción', cols: 2, value: P.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].f, sub: RX[k].sub }; }), onChange: function (v) { P.manual = false; P.rx = v; applyPair(); } });
      host.appendChild(ui.rxOpts);
      ui.sX = kit.ui.slider({ label: 'ξ', min: 0, max: 1, step: 0.005, value: X.xi, format: function (v) { return fmt(v, 2); }, onInput: function (v) { goManual(); X.xi = v; } });
      ui.sT2 = kit.ui.slider({ label: 'Temp.', min: 200, max: 800, step: 5, value: X.T, format: function (v) { return fmt(v, 0) + ' K'; }, onInput: function (v) { X.T = v; } });
      host.appendChild(kit.ui.sliders([ui.sX, ui.sT2]));
      var fld2 = document.createElement('div'); fld2.className = 'fld'; fld2.innerHTML = '<span class="lbl">Catalizador</span>';
      ui.catSeg = kit.ui.seg([{ v: false, label: 'Sin catalizador' }, { v: true, label: 'Con catalizador' }], X.cat, function (v) { goManual(); X.cat = v; });
      fld2.appendChild(ui.catSeg); host.appendChild(fld2);
      var row2 = document.createElement('div'); row2.className = 'row'; row2.innerHTML = '<button class="btn primary" id="btnLesson">Volver a la lección</button>'; host.appendChild(row2);
      row2.querySelector('#btnLesson').addEventListener('click', function () { P.manual = false; kit.toast('La lección controla la simulación'); });
    }
    if (ui.g1k) ui.g1k.textContent = P.mode === 'col' ? 'Distribución de energías (Maxwell–Boltzmann)' : 'Diagrama de coordenada de reacción';
    if (ui.g2k) ui.g2k.textContent = P.mode === 'col' ? 'Cantidad de partículas en el tiempo' : 'Órdenes de enlace A–B y B–C';
    if (ui.n1) ui.n1.innerHTML = P.mode === 'col' ? 'El área roja es la fracción de moléculas con E ≥ Ea (≈ e<sup>−Ea/RT</sup>). Sube T para ensanchar la curva o baja Ea (catalizador) para correr la línea.' : 'Ea = barrera directa, Ea\' = barrera inversa = Ea − ΔH. El punto rojo es el sistema; ‡ marca el estado de transición.';
    if (ui.n2) ui.n2.innerHTML = P.mode === 'col' ? 'A y B disminuyen y AB aumenta a medida que los choques eficaces transforman reactivos en producto; la pendiente es la velocidad.' : 'En el estado de transición ambos enlaces son parciales (n ≈ 0,5 en la reacción simétrica); en los extremos uno vale 1 y el otro 0.';
  }
  function applyPair() { refreshStageUI(); kit.setEq({ chip: eqChip(), name: eqName(), body: eqBody() }); kit.setLegend(legendRows()); rebuildCtrl(); updateInfo(); kit.refresh(); redrawAll(); }
  function redrawAll() { ['g1', 'g2', 'g3', 'gm'].forEach(function (k) { ui[k] && ui[k].redraw(); }); }
  function buildLab(el) {
    var c = kit.ui.card('Panel de control'); ui.ctrl = document.createElement('div'); c.appendChild(ui.ctrl); el.appendChild(c);
    rebuildCtrl();
    ui.info = kit.ui.card('Datos'); el.appendChild(ui.info); updateInfo();
    el.appendChild(kit.ui.card('Nota didáctica', '<p class="muted small">Las energías de activación y las velocidades están escaladas para que las reacciones se vean en segundos (las Ea moleculares reales son mayores y la fracción eficaz, mucho más pequeña). Las relaciones cualitativas y las ecuaciones sí son las reales.</p>'));
  }
  function updateInfo() {
    if (!ui.info) return;
    var h = '<div class="card-kicker">Datos del sistema</div>';
    if (P.mode === 'col') h += kv('Rapidez media relativa', '∝ √T = ' + fmt(Math.sqrt(C.T / 300), 2) + ' (rel. a 300 K)') + kv('Barrera efectiva', fmt(eaEff(), 1) + ' kJ/mol') + kv('RT', fmt(R * C.T, 2) + ' kJ/mol') + kv('Ea / RT', fmt(eaEff() / (R * C.T), 2));
    else { var r = rx(), p0 = profile(r, false), pc = profile(r, true); h += kv('Enlace A–B (r₁)', fmt(r.r1AB, 2) + ' Å') + kv('Enlace B–C (r₁)', fmt(r.r1BC, 2) + ' Å') + kv('Ea sin / con catalizador', fmt(p0.Ea, 0) + ' / ' + fmt(pc.Ea, 0) + ' kJ/mol') + kv('Posición del TS', r.pos); }
    ui.info.innerHTML = h;
  }
  function buildGraphs(el) {
    var c1 = kit.ui.card(''); ui.g1k = c1.querySelector('.card-kicker');
    ui.g1 = kit.ui.canvas(c1, { height: 240, label: 'Gráfico principal', draw: function (ctx, w, h, c) { (P.mode === 'col' ? drawMB : drawProfile)(ctx, w, h, c); },
      pointer: function (x, y, kind) { if (kind === 'move' || P.mode !== 'ts') return; var s = ui.g1.size(), L = 46, pw = s.w - L - 10; goManual(); X.xi = clamp((x - L) / pw, 0, 1); ui.sX && ui.sX.set(X.xi); } });
    c1.insertAdjacentHTML('beforeend', '<p class="muted small" id="n1"></p>'); ui.n1 = c1.querySelector('#n1');
    var c2 = kit.ui.card(''); ui.g2k = c2.querySelector('.card-kicker');
    ui.g2 = kit.ui.canvas(c2, { height: 230, label: 'Gráfico secundario', draw: function (ctx, w, h, c) { (P.mode === 'col' ? drawConc : drawOrder)(ctx, w, h, c); } });
    c2.insertAdjacentHTML('beforeend', '<p class="muted small" id="n2"></p>'); ui.n2 = c2.querySelector('#n2');
    var c3 = kit.ui.card('Gráfico de Arrhenius');
    ui.g3 = kit.ui.canvas(c3, { height: 230, label: 'ln k frente a 1/T', draw: drawArr });
    c3.insertAdjacentHTML('beforeend', '<p class="muted small">Una recta de pendiente −Ea/R: cuanto mayor es la Ea, más “empinada” es la dependencia de k con la temperatura. El punto marca la T actual.</p>');
    el.appendChild(c1); el.appendChild(c2); el.appendChild(c3);
    rebuildCtrl();
  }
  function applyMode(id) {
    P.mode = id; P.manual = false; showGroup();
    var m = MODECAM[id]; camera.position.set(m.x, m.y, m.d); controls.target.set(0, id === 'ts' ? 1.6 : 0, 0); P.camGoal = null;
    tableMat && (tableMat.visible = id === 'ts');
    if (id === 'col') { C.react = false; resetPop(); } else { X.xi = 0; X.cat = false; tsKey = ''; }
    applyPair();
  }

  function init() {
    setStages(stagesCol());
    kit = SimKit.create({
      key: 'colisiones-estado-transicion',
      title: 'Colisiones y estado de transición',
      subtitle: 'Simulador 3D · química general',
      accent: { dark: '#7ee0c3', light: '#0b8a6a' },
      viewLabel: 'Visor 3D de colisiones moleculares y estado de transición',
      modes: [
        { id: 'col', label: 'Colisiones', sub: 'teoría de colisiones', color: '#ff6b5e' },
        { id: 'ts', label: 'Estado de transición', sub: 'coordenada de reacción', color: '#b392f0' }
      ], modesLabel: 'Modelo',
      onMode: function (id) { applyMode(id); },
      stages: STAGES,
      mainTabLabel: 'Guía',
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: 'Gráficos', build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'pred', label: 'Predictor', build: function (el, k) { kit = k; buildPredictor(el); } }
      ],
      mainExtra: function (el, k) {
        kit = k;
        var c = kit.ui.card('Resultado de los choques / perfil de energía');
        ui.gm = kit.ui.canvas(c, { height: 175, label: 'Resumen de choques o perfil de energía', draw: drawMain });
        el.appendChild(c);
      },
      measuresTitle: 'Medidas en vivo',
      measures: function () {
        if (P.mode === 'col') {
          var cc = counts(), ea = eaEff();
          return [['Temperatura', fmt(C.T, 0) + ' K'], ['Barrera efectiva Ea', fmt(ea, 1) + ' kJ/mol'], ['Fracción con E ≥ Ea (M–B)', fmt(mbFrac(ea, C.T) * 100, 1) + ' %'], ['Factor estérico p', fmt(C.p, 2)],
            ['Choques A + B', String(stats.coll)], ['Choques eficaces', stats.ok + ' (' + fmt(stats.coll ? stats.ok / stats.coll * 100 : 0, 0) + ' %)'], ['[A] · [B] · [AB]', cc.a + ' · ' + cc.b + ' · ' + cc.p], ['Velocidad (últimos 5 s)', fmt(rateNow(), 2) + ' reac./s']];
        }
        var r = rx(), pr = profile(r, X.cat), c = profile(r, false).xiTS, n = nAB(X.xi, c);
        var kE = 2.0837e10 * X.T * Math.exp(-pr.Ea / (R * X.T));
        return [['Coordenada ξ', fmt(X.xi, 2)], ['Energía potencial', fmt(pr.E(X.xi), 1) + ' kJ/mol'], ['Ea directa', fmt(pr.Ea, 0) + ' kJ/mol'], ['Ea inversa', fmt(pr.EaRev, 0) + ' kJ/mol'], ['ΔH', (r.dH > 0 ? '+' : '') + fmt(r.dH, 0) + ' kJ/mol'],
          ['Orden A–B · B–C', fmt(n, 2) + ' · ' + fmt(1 - n, 2)], ['Longitud A–B · B–C', fmt(bondLen(r.r1AB, n), 2) + ' · ' + fmt(bondLen(r.r1BC, 1 - n), 2) + ' Å'], ['k (Eyring, ΔG‡ ≈ Ea) a ' + fmt(X.T, 0) + ' K', kE < 1e-3 || kE > 1e6 ? sci(kE) + ' s⁻¹' : fmt(kE, 2) + ' s⁻¹']];
      },
      ideas: [
        'Un choque es <b>eficaz</b> solo si tiene energía ≥ Ea <b>y</b> la orientación adecuada.',
        'Subir la temperatura aumenta la fracción de moléculas con E ≥ Ea: es la causa principal del aumento de k (Arrhenius).',
        'El catalizador baja la barrera (y la inversa); <b>no cambia ΔH ni el equilibrio</b>.',
        'El <b>estado de transición</b> es el máximo de energía: enlaces parciales, no aislable. Un intermediario, en cambio, es un mínimo.',
        'Ea(inversa) = Ea(directa) − ΔH. Hammond: el TS se parece a la especie más cercana en energía.'
      ],
      layers: [
        { id: 'orient', label: 'Zona reactiva', icon: '◔' },
        { id: 'profile', label: 'Perfil de energía', icon: '⛰' },
        { id: 'bonds', label: 'Orden de enlace', icon: 'n' },
        { id: 'labels', label: 'Etiquetas', icon: 'Aa' },
        { id: 'rot', label: 'Giro', icon: '⟳', on: false }
      ],
      onLayer: function (id, on) {
        if (id === 'labels' && labelRenderer) labelRenderer.domElement.style.display = on ? 'block' : 'none';
        if (id === 'rot' && controls) controls.autoRotate = on;
        kit.setLegend && kit.setLegend(legendRows());
      },
      views: [{ id: 'libre', label: 'Libre' }, { id: 'frontal', label: 'Frontal' }, { id: 'lado', label: 'Lateral' }, { id: 'superior', label: 'Superior' }, { id: 'cerca', label: 'Acercar' }],
      onView: function (id) { P.camGoal = viewGoal(id); },
      onTheme: function (th) {
        if (!scene) return;
        scene.background = new T.Color(th === 'dark' ? 0x0e131a : 0xdbe6f1);
        tableMat.color.set(th === 'dark' ? 0x161b22 : 0xb9c7d6);
        boxLines.material.color.set(th === 'dark' ? 0x8a9bb3 : 0x4a5a73);
      },
      onStage: function (i) { P.manual = false; if (P.mode === 'col' && i === 0) { C.react = false; resetPop(); } if (P.mode === 'ts') tsKey = tsKey; redrawAll(); },
      onGuide: function () { P.manual = false; },
      onResize: resize,
      render: function () { renderer.render(scene, camera); },
      onFrame: function (f) {
        if (!P.manual) drive(f);
        if (P.mode === 'col') { ui.sT && ui.sT.set(C.T); ui.sE && ui.sE.set(C.Ea); ui.sP && ui.sP.set(C.p); ui.catSeg && ui.catSeg.set(C.cat); }
        else { ui.sX && ui.sX.set(X.xi); ui.catSeg && ui.catSeg.set(X.cat); }
        sceneFrame(f.dt, f);
        redrawAll();
      },
      init: function (k) {
        kit = k; buildScene(); resize(); k.cfg.onTheme(k.state.theme);
        labelRenderer.domElement.style.display = k.layer('labels') ? 'block' : 'none';
        controls.autoRotate = k.layer('rot');
        applyMode('col');
      },
      help: {
        intro: 'Elige el modelo arriba (colisiones o estado de transición), sigue la lección con el reproductor inferior y gira la escena arrastrando. Si mueves un control del panel “Lab” pasas a <b>modo libre</b>; con “Volver a la lección” el guion recupera el control.',
        items: [
          ['Colisiones', 'gas de partículas A y B: sube la temperatura, cambia Ea, la orientación (factor estérico) o agrega un catalizador y observa los destellos de cada choque.'],
          ['Estado de transición', 'tres átomos en línea: arrastra la coordenada ξ o deja correr la lección para ver los enlaces parciales y la energía en el máximo.'],
          ['Capas', 'zona reactiva, perfil de energía 3D, orden de enlace, etiquetas y giro.'],
          ['Gráficos', 'distribución de Maxwell–Boltzmann, cantidades en el tiempo, diagrama de coordenada de reacción, órdenes de enlace y gráfico de Arrhenius.'],
          ['Predictor', 'calculadora de Arrhenius (k₂/k₁ entre dos temperaturas) y modo desafío.']
        ]
      }
    });
    kit.setMode('col', true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
