/* Enlace químico (iónico · covalente · metálico) — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js */
(function () {
  'use strict';
  var T = THREE, kit;
  var fmt = SimKit.fmt, clamp = SimKit.clamp;
  var K_COUL = 138935;            // kJ·pm/mol (e²/4πε₀ · N_A)
  var US = 1 / 120;               // pm → unidades de escena (iónico y metálico)
  var UC = 0.01;                  // pm → unidades de escena (covalente)

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function ramp(l, a, b) { return ease((l - a) / (b - a)); }
  function sup(q, sign) { return (q > 1 ? ['', '', '²', '³'][q] : '') + sign; }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }

  /* ------------------------- Datos ------------------------- */
  var IONIC = {
    nacl: { id: 'nacl', f: 'NaCl', sub: 'Na⁺ Cl⁻', n: 9,
      c: { s: 'Na', ra: 186, ri: 102, q: 1, col: 0xffa23a, en: 0.93, ie: '496', val: 1 },
      a: { s: 'Cl', ra: 99, ri: 181, q: 1, col: 0x4ade80, en: 3.16, val: 7 },
      U: -787, mp: 801, cyc: [107, 496, 122, -349, -787], hf: -411, nameC: 'sodio', nameA: 'cloro' },
    lif: { id: 'lif', f: 'LiF', sub: 'Li⁺ F⁻', n: 6,
      c: { s: 'Li', ra: 152, ri: 76, q: 1, col: 0xc084fc, en: 0.98, ie: '520', val: 1 },
      a: { s: 'F', ra: 64, ri: 133, q: 1, col: 0x9ae66e, en: 3.98, val: 7 },
      U: -1046, mp: 845, cyc: [159, 520, 79, -328, -1046], hf: -616, nameC: 'litio', nameA: 'flúor' },
    kbr: { id: 'kbr', f: 'KBr', sub: 'K⁺ Br⁻', n: 10,
      c: { s: 'K', ra: 227, ri: 138, q: 1, col: 0x8b7bff, en: 0.82, ie: '419', val: 1 },
      a: { s: 'Br', ra: 114, ri: 196, q: 1, col: 0xd9603b, en: 2.96, val: 7 },
      U: -689, mp: 734, cyc: [89, 419, 112, -325, -689], hf: -394, nameC: 'potasio', nameA: 'bromo' },
    mgo: { id: 'mgo', f: 'MgO', sub: 'Mg²⁺ O²⁻', n: 7,
      c: { s: 'Mg', ra: 160, ri: 72, q: 2, col: 0x6fdc8c, en: 1.31, ie: '738 + 1451', val: 2 },
      a: { s: 'O', ra: 66, ri: 140, q: 2, col: 0xf85149, en: 3.44, val: 6 },
      U: -3791, mp: 2852, cyc: [148, 2189, 249, 603, -3791], hf: -602, nameC: 'magnesio', nameA: 'oxígeno' }
  };
  var COV = {
    h2: { id: 'h2', f: 'H₂', sub: 'simple', A: { s: 'H', en: 2.20, vdw: 120, col: 0xf2f2f2, lp: 0 }, B: { s: 'H', en: 2.20, vdw: 120, col: 0xf2f2f2, lp: 0 }, order: 1, re: 74, D: 436, mu: 0, name: 'hidrógeno' },
    cl2: { id: 'cl2', f: 'Cl₂', sub: 'simple', A: { s: 'Cl', en: 3.16, vdw: 175, col: 0x3fd24a, lp: 3 }, B: { s: 'Cl', en: 3.16, vdw: 175, col: 0x3fd24a, lp: 3 }, order: 1, re: 199, D: 243, mu: 0, name: 'cloro' },
    o2: { id: 'o2', f: 'O₂', sub: 'doble', A: { s: 'O', en: 3.44, vdw: 152, col: 0xf85149, lp: 2 }, B: { s: 'O', en: 3.44, vdw: 152, col: 0xf85149, lp: 2 }, order: 2, re: 121, D: 498, mu: 0, name: 'oxígeno' },
    n2: { id: 'n2', f: 'N₂', sub: 'triple', A: { s: 'N', en: 3.04, vdw: 155, col: 0x4c7bff, lp: 1 }, B: { s: 'N', en: 3.04, vdw: 155, col: 0x4c7bff, lp: 1 }, order: 3, re: 110, D: 945, mu: 0, name: 'nitrógeno' },
    hcl: { id: 'hcl', f: 'HCl', sub: 'polar', A: { s: 'H', en: 2.20, vdw: 120, col: 0xf2f2f2, lp: 0 }, B: { s: 'Cl', en: 3.16, vdw: 175, col: 0x3fd24a, lp: 3 }, order: 1, re: 127, D: 431, mu: 1.08, name: 'cloruro de hidrógeno' },
    hf: { id: 'hf', f: 'HF', sub: 'muy polar', A: { s: 'H', en: 2.20, vdw: 120, col: 0xf2f2f2, lp: 0 }, B: { s: 'F', en: 3.98, vdw: 147, col: 0x9ae66e, lp: 3 }, order: 1, re: 92, D: 567, mu: 1.82, name: 'fluoruro de hidrógeno' }
  };
  var MET = {
    na: { id: 'na', f: 'Na', sub: '1 e⁻', s: 'Na', e: 1, ev: 1, ra: 186, ri: 102, mp: 98, hs: 107, sig: 21, col: 0x8a98b3, name: 'sodio', ev_t: '1 (3s¹)' },
    mg: { id: 'mg', f: 'Mg', sub: '2 e⁻', s: 'Mg', e: 2, ev: 2, ra: 160, ri: 72, mp: 650, hs: 147, sig: 23, col: 0x5fae7a, name: 'magnesio', ev_t: '2 (3s²)' },
    al: { id: 'al', f: 'Al', sub: '3 e⁻', s: 'Al', e: 3, ev: 3, ra: 143, ri: 54, mp: 660, hs: 326, sig: 38, col: 0x7f9bc9, name: 'aluminio', ev_t: '3 (3s²3p¹)' },
    cu: { id: 'cu', f: 'Cu', sub: '4s¹ + d', s: 'Cu', e: 1, ev: 2, ra: 128, ri: 77, mp: 1085, hs: 337, sig: 60, col: 0xe08a4c, name: 'cobre', ev_t: '1 (4s¹) + aporte de los d' }
  };
  var ELEMENTS = [
    { s: 'H', en: 2.20, t: 'n' }, { s: 'Li', en: 0.98, t: 'm' }, { s: 'Na', en: 0.93, t: 'm' }, { s: 'K', en: 0.82, t: 'm' },
    { s: 'Mg', en: 1.31, t: 'm' }, { s: 'Ca', en: 1.00, t: 'm' }, { s: 'Al', en: 1.61, t: 'm' }, { s: 'Fe', en: 1.83, t: 'm' },
    { s: 'Cu', en: 1.90, t: 'm' }, { s: 'Zn', en: 1.65, t: 'm' }, { s: 'C', en: 2.55, t: 'n' }, { s: 'N', en: 3.04, t: 'n' },
    { s: 'O', en: 3.44, t: 'n' }, { s: 'F', en: 3.98, t: 'n' }, { s: 'Si', en: 1.90, t: 'n' }, { s: 'P', en: 2.19, t: 'n' },
    { s: 'S', en: 2.58, t: 'n' }, { s: 'Cl', en: 3.16, t: 'n' }, { s: 'Br', en: 2.96, t: 'n' }, { s: 'I', en: 2.66, t: 'n' }
  ];
  function el(sym) { return ELEMENTS.filter(function (e) { return e.s === sym; })[0]; }

  var P = { mode: 'ion', ion: 'nacl', cov: 'hcl', met: 'na', manual: false, camGoal: null };
  var S = { d: 900, tr: 0, asm: 0, shear: 0, pol: 0, sea: 0, field: 0, halo: 0, pulse: 0 };
  function covFar(p) { return Math.max(p.re * 2.6, 400); }
  function ip() { return IONIC[P.ion]; }
  function cp() { return COV[P.cov]; }
  function mp_() { return MET[P.met]; }
  function ionD0(p) { return p.c.ri + p.a.ri; }
  function dEN(a, b) { return Math.abs(a - b); }

  /* ------------------------- Lección ------------------------- */
  var STAGES = [0, 1, 2, 3, 4].map(function () { return { name: '', short: '', title: '', text: '', dur: 9 }; });
  function setStages(arr) {
    arr.forEach(function (s, i) { var t = STAGES[i]; t.name = s[0]; t.short = s[1]; t.title = s[2]; t.text = s[3]; });
  }
  function stagesIon(p) {
    var c = p.c, a = p.a, q = c.q, d0 = ionD0(p), den = dEN(c.en, a.en);
    return [
      ['Átomos neutros', 'Átomos', 'Un metal y un no metal',
        '<p>El ' + p.nameC + ' (' + c.s + ') cede electrones con facilidad (energía de ionización baja) y el ' + p.nameA + ' (' + a.s + ') los capta (afinidad electrónica favorable).</p>' +
        '<p>Su diferencia de electronegatividad es ΔEN = <b>' + fmt(den, 2) + '</b>, muy por encima de 1,7: señal de enlace <b>iónico</b>. Aquí están como átomos neutros y lejanos; todavía no interactúan.</p>'],
      ['Transferencia de electrones', 'Transferencia', c.s + ' cede ' + q + (q > 1 ? ' e⁻' : ' e⁻') + ' al ' + a.s,
        '<p>Al acercarse, ' + (q > 1 ? 'dos electrones' : 'un electrón') + ' de valencia del ' + c.s + ' pasa' + (q > 1 ? 'n' : '') + ' al ' + a.s + '. Se forman el catión <b>' + c.s + sup(q, '⁺') + '</b> (más pequeño: pierde su capa externa) y el anión <b>' + a.s + sup(q, '⁻') + '</b> (más grande: más repulsión entre electrones).</p>' +
        '<p>Ionizar cuesta energía (E.I. = ' + c.ie + ' kJ/mol) y la afinidad devuelve solo una parte. Lo que hace espontáneo el proceso es la atracción posterior.</p>'],
      ['Atracción electrostática', 'Coulomb', 'Atracción de Coulomb frente a repulsión',
        '<p>Los iones de signo contrario se atraen según la ley de Coulomb, E = −k·q₁·q₂ / r. Cuando las nubes electrónicas se tocan aparece una repulsión que crece muy rápido (repulsión de Born).</p>' +
        '<p>La suma tiene un mínimo en r₀ = <b>' + d0 + ' pm</b>: la distancia de enlace. Observa el gráfico <i>Energía</i>: el punto rojo oscila hasta quedar en el fondo del pozo.</p>'],
      ['Red cristalina', 'Red', 'Un ion se rodea de iones opuestos',
        '<p>Un par aislado no es el compuesto. En el sólido cada ion se rodea de <b>6 iones de carga opuesta</b> (red cúbica tipo NaCl, coordinación 6 : 6). La energía liberada al formar la red a partir de iones gaseosos es la <b>energía reticular</b>: U = ' + fmt(p.U, 0) + ' kJ/mol.</p>' +
        '<p>No existen “moléculas de ' + p.f + '”: la fórmula solo indica la proporción 1 : 1 de iones.</p>'],
      ['Fragilidad', 'Fragilidad', 'Por qué el cristal se rompe',
        '<p>Si una capa se desliza un espacio iónico, quedan frente a frente iones del mismo signo: la repulsión parte el cristal. Los sólidos iónicos son <b>duros pero frágiles</b>.</p>' +
        '<p>Funden a temperatura alta (' + p.f + ': ' + fmt(p.mp, 0) + ' °C) y no conducen en estado sólido porque los iones están fijos; fundidos o disueltos sí conducen.</p>']
    ];
  }
  function stagesCov(p) {
    var A = p.A, B = p.B, den = dEN(A.en, B.en), bn = ['', 'simple', 'doble', 'triple'][p.order], pares = ['', 'Un par', 'Dos pares', 'Tres pares'][p.order];
    var polar = den >= 0.4;
    return [
      ['Átomos separados', 'Átomos', 'Dos átomos no metálicos',
        '<p>' + A.s + ' y ' + B.s + ' son no metales con electronegatividades ' + (den < 0.4 ? 'iguales o casi iguales' : 'distintas pero no extremas') + ' (ΔEN = <b>' + fmt(den, 2) + '</b>). Ninguno puede arrancarle el electrón al otro, así que la solución es <b>compartir</b>.</p><p>Aquí están lejos: las nubes no se tocan y la energía es ≈ 0.</p>'],
      ['Solapamiento de orbitales', 'Solapamiento', 'Las nubes electrónicas se solapan',
        '<p>Al acercarse, las nubes se solapan y los dos núcleos atraen la zona compartida. La energía baja hasta un mínimo de <b>−' + p.D + ' kJ/mol</b> a la <b>longitud de enlace</b> (' + p.re + ' pm). Más cerca aún, la repulsión entre núcleos la hace subir (curva de Morse en <i>Energía</i>).</p>'],
      ['Par compartido', 'Par compartido', 'Enlace covalente ' + bn + ' y regla del octeto',
        '<p>' + pares + ' de electrones compartido' + (p.order > 1 ? 's' : '') + ' entre ' + A.s + ' y ' + B.s + ': enlace <b>' + bn + '</b>. Cada átomo completa su octeto (el H, su dueto) contando los pares compartidos y sus pares libres.</p><p>Revisa la estructura de Lewis en el panel de la derecha.</p>'],
      ['Polaridad', 'Polaridad', polar ? 'La nube se desplaza hacia ' + B.s : 'Reparto igual: enlace apolar',
        polar
          ? '<p>' + B.s + ' (EN ' + fmt(B.en, 2) + ') atrae más los electrones que ' + A.s + ' (EN ' + fmt(A.en, 2) + '): la nube se desplaza hacia él, aparece una carga parcial <b>δ−</b> sobre ' + B.s + ' y <b>δ+</b> sobre ' + A.s + '. El enlace es <b>polar</b> y su momento dipolar vale μ ≈ ' + fmt(p.mu, 2) + ' D.</p>'
          : '<p>Los dos átomos tienen la misma electronegatividad, así que la nube se reparte por igual: enlace <b>covalente apolar</b>, sin polos ni momento dipolar (μ = 0).</p><p>Elige HCl o HF en el panel Lab para ver el desplazamiento de la nube.</p>'],
      ['Orden de enlace', 'Orden', 'Más pares compartidos: enlace más corto y fuerte',
        '<p>Cl–Cl (simple): 199 pm y 243 kJ/mol. O=O (doble): 121 pm y 498 kJ/mol. N≡N (triple): 110 pm y 945 kJ/mol.</p><p>En ' + p.f + ' el orden de enlace es <b>' + p.order + '</b>: re = ' + p.re + ' pm y D = ' + p.D + ' kJ/mol. Compáralos en el segundo gráfico de <i>Energía</i>.</p>']
    ];
  }
  function stagesMet(p) {
    return [
      ['Átomos metálicos', 'Átomos', 'Átomos con electrones de valencia poco retenidos',
        '<p>Los metales tienen pocos electrones de valencia y energías de ionización bajas. Cada átomo de ' + p.name + ' (' + p.s + ') aporta <b>' + p.ev_t + '</b> electrón(es) al enlace. Por ahora cada electrón orbita su propio átomo.</p>'],
      ['Deslocalización', 'Deslocalización', 'Los electrones dejan de pertenecer a un átomo',
        '<p>Al empaquetarse los átomos, los electrones de valencia se <b>deslocalizan</b> por todo el cristal. Quedan cationes ' + p.s + ' (más pequeños: r ' + p.ra + ' → ' + p.ri + ' pm) inmersos en un “mar” de electrones móviles.</p>'],
      ['Enlace metálico', 'Enlace', 'Cationes unidos por el mar de electrones',
        '<p>El enlace metálico es la atracción electrostática entre los cationes y el mar de electrones; no es direccional. Más electrones por átomo y cationes más pequeños significan un enlace más fuerte: Na (1 e⁻) funde a 98 °C; Mg (2 e⁻), a 650 °C; Al (3 e⁻), a 660 °C.</p><p>' + p.s + ': entalpía de atomización ' + p.hs + ' kJ/mol; punto de fusión ' + fmt(p.mp, 0) + ' °C.</p>'],
      ['Conductividad', 'Conducción', 'Los electrones libres transportan la corriente',
        '<p>Al aplicar un campo eléctrico, el mar de electrones <b>deriva hacia el polo (+)</b> mientras los cationes siguen en su sitio. Por eso los metales conducen incluso en estado sólido; su conductividad cae al calentarlos, porque aumentan las vibraciones y los choques.</p>'],
      ['Maleabilidad', 'Maleabilidad', 'Las capas deslizan sin romperse',
        '<p>Al desplazar una capa, el entorno de cada catión sigue siendo el mismo: el mar de electrones se reacomoda y el enlace se mantiene. Por eso los metales son <b>maleables y dúctiles</b>, al contrario que el cristal iónico (compáralo con la última etapa del modo iónico).</p>']
    ];
  }
  function stagesFor(mode) { return mode === 'ion' ? stagesIon(ip()) : mode === 'cov' ? stagesCov(cp()) : stagesMet(mp_()); }
  function refreshStageUI() {
    setStages(stagesFor(P.mode));
    var i = kit.state.stage, s = STAGES[i];
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
  }

  /* pilotos de la escena según la etapa (modo lección) */
  function drive(f) {
    var i = f.i, l = f.local, p;
    if (P.mode === 'ion') {
      p = ip(); var d0 = ionD0(p), far = 720;
      S.shear = 0; S.asm = 0; S.tr = 0; S.d = far;
      if (i === 1) { S.d = lerp(far, d0 * 1.5, ease(l)); S.tr = ramp(l, 0.2, 0.6); }
      else if (i >= 2) { S.tr = 1; S.d = d0; }
      if (i === 2) S.d = d0 + d0 * 0.5 * Math.exp(-3.5 * l) * Math.cos(10 * l);
      if (i === 3) S.asm = ramp(l, 0.08, 0.88);
      if (i === 4) { S.asm = 1; S.shear = ramp(l, 0.1, 0.75); }
    } else if (P.mode === 'cov') {
      p = cp(); var far2 = covFar(p);
      S.d = far2; S.pol = 0; S.pulse = 0;
      if (i === 1) S.d = lerp(far2, p.re, ease(l));
      else if (i >= 2) S.d = p.re * (1 + 0.025 * Math.sin(f.now * 9));
      if (i === 3) S.pol = ramp(l, 0.1, 0.75);
      if (i === 4) { S.pol = 1; S.pulse = 0.5 + 0.5 * Math.sin(f.now * 3); }
    } else {
      S.sea = 0; S.field = 0; S.shear = 0; S.halo = 0;
      if (i === 1) S.sea = ramp(l, 0.1, 0.8);
      else if (i >= 2) S.sea = 1;
      if (i === 2) S.halo = ramp(l, 0.1, 0.5);
      if (i === 3) { S.halo = 0.3; S.field = ramp(l, 0.1, 0.6); }
      if (i === 4) S.shear = ramp(l, 0.1, 0.75);
    }
  }

  /* ------------------------- Escena 3D ------------------------- */
  var scene, camera, renderer, labelRenderer, controls;
  var gIon, gCov, gMet, sphereGeo, tableMat;
  var ions = [], ionStart = [], ionLat = [], ionEl = [], ionLine, lbCat, lbAn, lbTitle;
  var cov = {}, covLbA, covLbB, covLbT;
  var met = { cat: [], el: [], fp: [], vv: [], ph: [] }, metHalo, plateL, plateR, metLbSea, metLbNeg, metLbPos;
  var CIDX = 4, AIDX = 13;

  function mkLabel(txt, cls) {
    var d = document.createElement('div'); d.className = 'bond-label ' + cls; d.textContent = txt;
    var o = new T.CSS2DObject(d); return { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; } };
  }
  function mat(col, op, extra) {
    var m = new T.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.1 });
    if (op != null && op < 1) { m.transparent = true; m.opacity = op; m.depthWrite = false; }
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  }

  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 120);
    camera.position.set(0, 3, 15);
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer();
    labelRenderer.domElement.className = 'labels-layer';
    cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.minDistance = 3; controls.maxDistance = 40;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener('start', function () { P.camGoal = null; });
    scene.add(new T.AmbientLight(0xffffff, 0.8));
    var dl = new T.DirectionalLight(0xffffff, 1.1); dl.position.set(6, 10, 8); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x88aaff, 0.35); dl2.position.set(-8, -4, -6); scene.add(dl2);
    sphereGeo = new T.SphereGeometry(1, 28, 20);

    /* --- iónico --- */
    gIon = new T.Group(); scene.add(gIon);
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) {
      var idx = i * 9 + j * 3 + k;
      var m = new T.Mesh(sphereGeo, mat(0xffffff)); gIon.add(m); ions[idx] = m;
      ionLat[idx] = new T.Vector3((i - 1), (j - 1), (k - 1));
      var a1 = (idx * 2.399) % 6.283, a2 = Math.acos(((idx * 0.37) % 1) * 2 - 1);
      ionStart[idx] = new T.Vector3(Math.sin(a2) * Math.cos(a1), Math.cos(a2), Math.sin(a2) * Math.sin(a1)).multiplyScalar(9 + (idx % 5));
      m.userData = { i: i, j: j, k: k, cat: (i + j + k) % 2 === 0 };
    }
    for (var e = 0; e < 2; e++) { var em = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffe066 })); em.scale.setScalar(0.17); gIon.add(em); ionEl.push(em); }
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3));
    ionLine = new T.Line(lg, new T.LineBasicMaterial({ color: 0x5ee3a2 })); gIon.add(ionLine);
    lbCat = mkLabel('', 'bl-d'); lbAn = mkLabel('', 'bl-d'); lbTitle = mkLabel('', 'bl-d');
    scene.add(lbCat.o, lbAn.o, lbTitle.o);

    /* --- covalente --- */
    gCov = new T.Group(); scene.add(gCov);
    cov.nucA = new T.Mesh(sphereGeo, mat(0xffffff)); cov.nucB = new T.Mesh(sphereGeo, mat(0xffffff));
    cov.cloudA = new T.Mesh(sphereGeo, mat(0xffffff, 0.3)); cov.cloudB = new T.Mesh(sphereGeo, mat(0xffffff, 0.3));
    cov.lens = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.3, depthWrite: false }));
    cov.els = [];
    for (var q = 0; q < 6; q++) { var ce = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ color: 0xffe066 })); ce.scale.setScalar(0.065); gCov.add(ce); cov.els.push(ce); }
    cov.arrow = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(0, -1.8, 0), 1.5, 0xffe066, 0.32, 0.2);
    gCov.add(cov.nucA, cov.nucB, cov.cloudA, cov.cloudB, cov.lens, cov.arrow);
    covLbA = mkLabel('', 'bl-d'); covLbB = mkLabel('', 'bl-d'); covLbT = mkLabel('', 'bl-d');
    scene.add(covLbA.o, covLbB.o, covLbT.o);

    /* --- metálico --- */
    gMet = new T.Group(); scene.add(gMet);
    for (var c = 0; c < 27; c++) { var cm = new T.Mesh(sphereGeo, mat(0xffffff)); gMet.add(cm); met.cat.push(cm); cm.userData = { i: Math.floor(c / 9), j: Math.floor(c / 3) % 3, k: c % 3 }; }
    var eg = new T.SphereGeometry(1, 10, 8);
    for (var n = 0; n < 81; n++) {
      var m2 = new T.Mesh(eg, new T.MeshBasicMaterial({ color: 0xffe066 })); m2.scale.setScalar(0.1); gMet.add(m2); met.el.push(m2);
      met.fp.push(new T.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
      var v = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.9 + Math.random() * 0.8);
      met.vv.push(v); met.ph.push(Math.random() * 6.283);
    }
    metHalo = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0, depthWrite: false }));
    gMet.add(metHalo);
    plateL = new T.Mesh(new T.BoxGeometry(0.15, 1, 1), new T.MeshStandardMaterial({ color: 0x58a6ff, metalness: 0.7, roughness: 0.3 }));
    plateR = new T.Mesh(new T.BoxGeometry(0.15, 1, 1), new T.MeshStandardMaterial({ color: 0xf85149, metalness: 0.7, roughness: 0.3 }));
    gMet.add(plateL, plateR);
    metLbNeg = mkLabel('− cátodo', 'bl-neg'); metLbPos = mkLabel('+ ánodo', 'bl-pos'); metLbSea = mkLabel('', 'bl-d');
    scene.add(metLbNeg.o, metLbPos.o, metLbSea.o);

    var table = new T.Mesh(new T.CylinderGeometry(9, 9, 0.2, 60), tableMat = new T.MeshStandardMaterial({ color: 0x161b22, roughness: 0.85 }));
    table.position.y = -5.4; scene.add(table);
    showGroup();
  }
  function showGroup() {
    gIon.visible = P.mode === 'ion'; gCov.visible = P.mode === 'cov'; gMet.visible = P.mode === 'met';
    [lbCat, lbAn, lbTitle].forEach(function (l) { l.o.visible = P.mode === 'ion'; });
    [covLbA, covLbB, covLbT].forEach(function (l) { l.o.visible = P.mode === 'cov'; });
    [metLbNeg, metLbPos, metLbSea].forEach(function (l) { l.o.visible = P.mode === 'met'; });
  }
  function resize() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h;
    camera.zoom = clamp(camera.aspect / 1.15, 0.42, 1);
    var off = w > 900 ? Math.min(170, w * 0.14) : 0;
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }
  var MODECAM = { ion: { d: 14.5, y: 5.5, x: 6.5 }, cov: { d: 9.2, y: 1.8, x: 0 }, met: { d: 19, y: 6.5, x: 7.5 } };
  function viewGoal(id) {
    var m = MODECAM[P.mode], d = m.d;
    if (id === 'frontal') return { pos: new T.Vector3(0, m.y * 0.2, d), target: new T.Vector3(0, 0, 0) };
    if (id === 'superior') return { pos: new T.Vector3(0, d * 0.95, 1.5), target: new T.Vector3(0, 0, 0) };
    if (id === 'lado') return { pos: new T.Vector3(d, m.y * 0.4, 0), target: new T.Vector3(0, 0, 0) };
    if (id === 'cerca') return { pos: new T.Vector3(0, m.y * 0.3, d * 0.6), target: new T.Vector3(0, 0, 0) };
    return null;
  }

  /* ---- actualización por modo ---- */
  function updIon(dt, now) {
    var p = ip(), s = (p.c.ri + p.a.ri) * US, dS = S.d * US, ae = ease(S.asm);
    var vs = lerp(1, 0.62, ae), rc = lerp(p.c.ra, p.c.ri, S.tr) * US * vs, ra = lerp(p.a.ra, p.a.ri, S.tr) * US * vs;
    var showE = kit.layer('e'), rep = clamp(1 - Math.abs(S.shear - 1) / 0.5, 0, 1) * (ae > 0.9 ? 1 : 0);
    var catC = new T.Color(p.c.col), anC = new T.Color(p.a.col);
    var tmp = new T.Vector3();
    for (var idx = 0; idx < 27; idx++) {
      var m = ions[idx], u = m.userData, isD = idx === CIDX || idx === AIDX;
      var L = tmp.copy(ionLat[idx]).multiplyScalar(s);
      var pos;
      if (isD) {
        var base = new T.Vector3(idx === CIDX ? -dS / 2 : dS / 2, 0, 0);
        pos = base.lerp(L, ae);
        m.scale.setScalar(idx === CIDX ? rc : ra);
        m.visible = true;
      } else {
        pos = ionStart[idx].clone().lerp(L, ae);
        var rr = (u.cat ? p.c.ri : p.a.ri) * US * ae * vs;
        m.scale.setScalar(Math.max(rr, 0.001)); m.visible = ae > 0.02;
      }
      if (u.j === 2 && ae > 0.9) {
        pos.x += clamp(S.shear, 0, 1.2) * s;
        pos.y += ease((S.shear - 0.3) / 0.7) * 0.9 * s;
      }
      m.position.copy(pos);
      m.material.color.copy(u.cat ? catC : anC);
      var em = (u.j === 2 && rep > 0.05) ? rep * (0.45 + 0.3 * Math.sin(now * 14)) : 0;
      m.material.emissive.setRGB(1 * em, 0.1 * em, 0.1 * em);
    }
    var cm = ions[CIDX], am = ions[AIDX];
    // electrones transferidos
    for (var k = 0; k < 2; k++) {
      var e = ionEl[k]; e.visible = showE && k < p.c.q && S.tr > 0.02 && S.tr < 0.98 && ae < 0.01;
      if (e.visible) e.position.copy(cm.position).lerp(am.position, S.tr).add(new T.Vector3(0, Math.sin(Math.PI * S.tr) * 0.9, (k - 0.5 * (p.c.q - 1)) * 0.4));
    }
    // fuerza
    var pa = ionLine.geometry.attributes.position;
    pa.setXYZ(0, cm.position.x + rc, cm.position.y, cm.position.z); pa.setXYZ(1, am.position.x - ra, am.position.y, am.position.z); pa.needsUpdate = true;
    ionLine.visible = kit.layer('force') && S.tr > 0.95 && ae < 0.2;
    // etiquetas
    var tr = S.tr, ch = tr > 0.5;
    lbCat.set(p.c.s + (ch ? sup(p.c.q, '⁺') : ''), ch ? 'bl-pos' : 'bl-d'); lbAn.set(p.a.s + (ch ? sup(p.a.q, '⁻') : ''), ch ? 'bl-neg' : 'bl-d');
    lbCat.o.position.copy(cm.position).add(new T.Vector3(0, rc + 0.45, 0)); lbAn.o.position.copy(am.position).add(new T.Vector3(0, ra + 0.45, 0));
    lbCat.o.visible = lbAn.o.visible = ae <= 0.5;
    var tt = rep > 0.35 ? '¡Repulsión entre iones iguales!' : (ae > 0.6 && S.shear < 0.3) ? 'Red cristalina de ' + p.f + ' · 6 : 6' : '';
    lbTitle.set(tt, rep > 0.35 ? 'bl-warn' : 'bl-d'); lbTitle.o.visible = !!tt;
    lbTitle.o.position.set(0, 2.6 * s + 0.6, 0);
  }

  function updCov(dt, now) {
    var p = cp(), d = S.d * UC, A = p.A, B = p.B;
    var rA = A.vdw * 0.0075, rB = B.vdw * 0.0075;
    var xA = -d / 2, xB = d / 2;
    cov.nucA.position.set(xA, 0, 0); cov.nucB.position.set(xB, 0, 0);
    cov.nucA.scale.setScalar(0.17); cov.nucB.scale.setScalar(0.17);
    cov.nucA.material.color.setHex(A.col); cov.nucB.material.color.setHex(B.col);
    cov.cloudA.position.copy(cov.nucA.position); cov.cloudB.position.copy(cov.nucB.position);
    cov.cloudA.scale.setScalar(rA); cov.cloudB.scale.setScalar(rB);
    cov.cloudA.material.color.setHex(A.col); cov.cloudB.material.color.setHex(B.col);
    var den = B.en - A.en, polar = Math.abs(den) >= 0.4, sgn = den > 0 ? 1 : -1;
    var mix = polar ? S.pol : 0;
    cov.cloudA.material.opacity = 0.3 - 0.12 * mix * sgn; cov.cloudB.material.opacity = 0.3 + 0.12 * mix * sgn;
    // lente de solapamiento
    var a = (d * d + rA * rA - rB * rB) / (2 * d), hh = Math.sqrt(Math.max(rA * rA - a * a, 0)), w = rA + rB - d;
    var show = kit.layer('e') && w > 0.05 && d > 0.01;
    var shift = polar ? mix * sgn * Math.min(Math.abs(den) / 3, 0.4) * d * 0.9 : 0;
    cov.lens.visible = show;
    cov.lens.position.set(xA + a + shift * 0.6, 0, 0);
    cov.lens.scale.set(Math.max(w / 2, 0.02), Math.max(hh, 0.05), Math.max(hh, 0.05));
    cov.lens.material.opacity = clamp(w / 0.6, 0, 1) * 0.28 + 0.12 * S.pulse;
    var n = p.order * 2;
    for (var i = 0; i < 6; i++) {
      var e = cov.els[i]; e.visible = show && i < n;
      if (!e.visible) continue;
      var pair = Math.floor(i / 2), ph = i * 2.1 + now * (2.4 + i * 0.35);
      var oy = p.order > 1 ? 0.26 * Math.cos(6.283 * pair / p.order + 0.6) : 0, oz = p.order > 1 ? 0.26 * Math.sin(6.283 * pair / p.order + 0.6) : 0;
      var rr = Math.min(Math.max(hh * 0.5, 0.1), 0.55);
      e.position.set(xA + a + shift * 0.6 + Math.sin(ph) * w * 0.28, oy + Math.cos(ph * 0.8 + i) * rr * 0.6, oz + Math.sin(ph * 1.2 + i) * rr * 0.6);
      e.scale.setScalar(0.065 * (1 + 0.5 * S.pulse));
    }
    // dipolo
    var showArrow = kit.layer('force') && polar && S.pol > 0.3 && !!(den);
    cov.arrow.visible = showArrow;
    if (showArrow) { cov.arrow.position.set(den > 0 ? xA : xB, -Math.max(rA, rB) - 0.55, 0); cov.arrow.setDirection(new T.Vector3(sgn, 0, 0)); cov.arrow.setLength(Math.max(d, 0.9), 0.32, 0.2); }
    // etiquetas
    covLbA.set(A.s + (polar && S.pol > 0.35 ? (sgn > 0 ? ' δ+' : ' δ−') : ''), polar && S.pol > 0.35 ? (sgn > 0 ? 'bl-pos' : 'bl-neg') : 'bl-d');
    covLbB.set(B.s + (polar && S.pol > 0.35 ? (sgn > 0 ? ' δ−' : ' δ+') : ''), polar && S.pol > 0.35 ? (sgn > 0 ? 'bl-neg' : 'bl-pos') : 'bl-d');
    covLbA.o.position.set(xA, Math.max(rA, 0.3) + 0.35, 0); covLbB.o.position.set(xB, Math.max(rB, 0.3) + 0.35, 0);
    var txt = w > 0.05 ? (polar ? 'Enlace covalente polar · ' : 'Enlace covalente apolar · ') + ['', 'simple', 'doble', 'triple'][p.order] : '';
    covLbT.set(txt, 'bl-d'); covLbT.o.visible = !!txt;
    covLbT.o.position.set(0, Math.max(rA, rB) + 1.05, 0);
  }

  function metGeom() { var p = mp_(); return { s: 2 * p.ra * US, H: 2 * p.ra * US * 1.5 + 0.35 }; }
  function updMet(dt, now) {
    var p = mp_(), g = metGeom(), s = g.s, H = g.H, sea = ease(S.sea);
    var rc = lerp(p.ra, p.ri, sea) * US, col = new T.Color(p.col);
    for (var c = 0; c < 27; c++) {
      var m = met.cat[c], u = m.userData;
      m.position.set((u.i - 1) * s + (u.j === 2 ? clamp(S.shear, 0, 1.2) * s : 0), (u.j - 1) * s, (u.k - 1) * s);
      m.scale.setScalar(rc * 0.82); m.material.color.copy(col); m.material.transparent = true; m.material.opacity = lerp(0.3, 1, sea); m.material.depthWrite = sea > 0.95;
    }
    var N = Math.min(81, Math.round(27 * p.ev));
    var showE = kit.layer('e');
    var dr = S.field * 3.2;
    for (var k = 0; k < 81; k++) {
      var e = met.el[k]; e.visible = showE && k < N; if (!e.visible) continue;
      var fp = met.fp[k], v = met.vv[k];
      if (Math.random() < dt * 1.2) v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.9 + Math.random() * 0.8);
      fp.x += (v.x + dr) * dt; fp.y += v.y * dt; fp.z += v.z * dt;
      if (fp.x > H) fp.x -= 2 * H; if (fp.x < -H) fp.x += 2 * H;
      if (Math.abs(fp.y) > H) { fp.y = clamp(fp.y, -H, H); v.y = -v.y; }
      if (Math.abs(fp.z) > H) { fp.z = clamp(fp.z, -H, H); v.z = -v.z; }
      var host = met.cat[k % 27].position, ph = met.ph[k] + now * 2.2, orb = (p.ra * US) * 0.62;
      var ox = host.x + Math.cos(ph) * orb, oy = host.y + Math.sin(ph) * orb * 0.8, oz = host.z + Math.sin(ph * 1.3) * orb * 0.6;
      e.position.set(lerp(ox, fp.x, sea), lerp(oy, fp.y, sea), lerp(oz, fp.z, sea));
    }
    metHalo.scale.set(g.s * 2 + 1.1, g.s * 2 + 1.1, g.s * 2 + 1.1);
    metHalo.material.opacity = 0.1 * S.halo * sea * (0.7 + 0.3 * Math.sin(now * 3));
    var pv = S.field > 0.02;
    plateL.visible = plateR.visible = pv;
    plateL.scale.set(1, H * 2.2, H * 2.2); plateR.scale.set(1, H * 2.2, H * 2.2);
    plateL.position.set(-H - 0.9, 0, 0); plateR.position.set(H + 0.9, 0, 0);
    metLbNeg.o.visible = metLbPos.o.visible = pv;
    metLbNeg.o.position.set(-H - 0.9, H * 1.1 + 0.4, 0); metLbPos.o.position.set(H + 0.9, H * 1.1 + 0.4, 0);
    var t = sea > 0.7 ? 'Cationes ' + p.s + ' en un mar de electrones' : sea < 0.1 ? 'Átomos de ' + p.s + ' (cada e⁻ en su átomo)' : '';
    metLbSea.set(t, 'bl-d'); metLbSea.o.visible = !!t;
    metLbSea.o.position.set(0, -H - 0.7, 0);
  }

  function sceneFrame(dt, f) {
    if (camGoalStep()) { /* movimiento de cámara */ }
    if (P.mode === 'ion') updIon(dt, f.now); else if (P.mode === 'cov') updCov(dt, f.now); else updMet(dt, f.now);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  function camGoalStep() {
    var g = P.camGoal; if (!g) return false;
    camera.position.lerp(g.pos, 0.08); controls.target.lerp(g.target, 0.08);
    if (camera.position.distanceTo(g.pos) < 0.04) P.camGoal = null;
    return true;
  }

  /* ------------------------- Gráficos ------------------------- */
  function axes(ctx, w, h, c, o) {
    var L = 46, R = 10, Tp = 14, B = 34, pw = w - L - R, ph = h - Tp - B;
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
  function dot(ctx, x, y, c) { ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill(); ctx.stroke(); }
  function curve(ctx, g, fn, x0, x1, col, lw, dash, ymin, ymax) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
    var first = true;
    for (var i = 0; i <= 160; i++) {
      var x = x0 + (x1 - x0) * i / 160, y = fn(x);
      if (y > ymax || y < ymin) { first = true; continue; }
      var px = g.X(x), py = g.Y(y); if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  function coulombE(p, r, parts) {
    var q = p.c.q, A = K_COUL * q * q, r0 = ionD0(p), n = p.n;
    var attr = -A / r, B = A * Math.pow(r0, n - 1) / n, rep = B / Math.pow(r, n);
    return parts === 'a' ? attr : parts === 'r' ? rep : attr + rep;
  }
  function drawCoulomb(ctx, w, h, c) {
    var p = ip(), r0 = ionD0(p), emin = coulombE(p, r0), step = Math.pow(10, Math.floor(Math.log10(Math.abs(emin)))), ymin = Math.floor(emin * 1.55 / step / 2) * step * 2, ymax = Math.ceil(Math.abs(emin) * 0.7 / step / 2) * step * 2;
    var g = axes(ctx, w, h, c, { xmin: 100, xmax: 800, ymin: ymin, ymax: ymax, nx: 7, ny: 4, xl: 'Distancia entre iones r (pm)', yl: 'Energía (kJ/mol)' });
    ctx.strokeStyle = c.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.L, g.Y(0)); ctx.lineTo(g.L + g.pw, g.Y(0)); ctx.stroke();
    curve(ctx, g, function (r) { return coulombE(p, r, 'a'); }, 100, 800, c.ok, 1.5, [5, 4], ymin, ymax);
    curve(ctx, g, function (r) { return coulombE(p, r, 'r'); }, 100, 800, c.warn, 1.5, [5, 4], ymin, ymax);
    curve(ctx, g, function (r) { return coulombE(p, r); }, 100, 800, c.accent, 2.6, null, ymin, ymax);
    ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillStyle = c.ok; ctx.fillText('Coulomb (atracción)', g.L + 8, g.Y(ymin * 0.28) - 4);
    ctx.fillStyle = c.warn; ctx.fillText('Born (repulsión)', g.L + 8, g.T + 12);
    ctx.fillStyle = c.accent; ctx.fillText('suma', g.X(r0) + 8, g.Y(emin) + 4);
    ctx.strokeStyle = c.accent; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(g.X(r0), g.T); ctx.lineTo(g.X(r0), g.T + g.ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.accent; ctx.textAlign = 'center'; ctx.textAlign = 'left'; ctx.fillText('r₀ = ' + r0 + ' pm', g.X(r0) + 6, g.T + 24);
    var r = clamp(S.d, 100, 800), e = coulombE(p, r);
    dot(ctx, g.X(r), g.Y(clamp(e, ymin, ymax)), c.bad || '#f85149');
  }
  function drawBH(ctx, w, h, c) {
    var p = ip(), st = kit.state.stage;
    var steps = [{ l: 'Sublim.', v: p.cyc[0], hi: false }, { l: 'E.I.', v: p.cyc[1], hi: st === 1 }, { l: '½ E.dis.', v: p.cyc[2], hi: false }, { l: 'A.E.', v: p.cyc[3], hi: st === 1 }, { l: 'U red', v: p.cyc[4], hi: st === 3 }];
    var cum = 0, bars = [];
    steps.forEach(function (s) { bars.push({ l: s.l, a: cum, b: cum + s.v, hi: s.hi, v: s.v }); cum += s.v; });
    bars.push({ l: 'ΔHf', a: 0, b: cum, tot: true, v: cum });
    var lo = 0, hi = 0; bars.forEach(function (b) { lo = Math.min(lo, b.a, b.b); hi = Math.max(hi, b.a, b.b); });
    var pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    var L = 46, R = 8, Tp = 16, B = 30, pw = w - L - R, ph = h - Tp - B;
    function Y(v) { return Tp + ph - (v - lo) / (hi - lo) * ph; }
    ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) { var v = lo + (hi - lo) * i / 4, y = Y(v); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke(); ctx.fillText(fmt(v, 0), L - 5, y + 3); }
    ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(L + pw, Y(0)); ctx.stroke();
    var bw = pw / bars.length;
    bars.forEach(function (b, i) {
      var x = L + i * bw + bw * 0.14, ww = bw * 0.72, y1 = Y(Math.max(b.a, b.b)), y2 = Y(Math.min(b.a, b.b));
      ctx.fillStyle = b.tot ? c.accent : b.v > 0 ? c.warn : c.ok; ctx.globalAlpha = b.hi || b.tot ? 1 : 0.62;
      ctx.fillRect(x, y1, ww, Math.max(2, y2 - y1)); ctx.globalAlpha = 1;
      if (b.hi) { ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.strokeRect(x, y1, ww, Math.max(2, y2 - y1)); }
      ctx.fillStyle = c.ink; ctx.textAlign = 'center'; ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillText((b.v > 0 ? '+' : '') + fmt(b.v, 0), x + ww / 2, (b.v > 0 ? y1 : y2) + (b.v > 0 ? -4 : 12));
      ctx.fillStyle = c.muted; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(b.l, x + ww / 2, h - 12);
    });
    ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.fillText('kJ/mol', 4, 11);
  }
  function morse(p, r) { var a = 1.35 / p.re, x = 1 - Math.exp(-a * (r - p.re)); return p.D * (x * x - 1); }
  function drawMorse(ctx, w, h, c) {
    var p = cp(), x0 = p.re * 0.5, x1 = p.re * 3.4, ymin = -p.D * 1.25, ymax = p.D * 0.6;
    var g = axes(ctx, w, h, c, { xmin: x0, xmax: x1, ymin: ymin, ymax: ymax, nx: 5, ny: 4, xl: 'Distancia internuclear (pm)', yl: 'Energía (kJ/mol)' });
    ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(g.L, g.Y(0)); ctx.lineTo(g.L + g.pw, g.Y(0)); ctx.stroke();
    curve(ctx, g, function (r) { return morse(p, r); }, x0, x1, c.accent, 2.6, null, ymin, ymax);
    ctx.setLineDash([3, 4]); ctx.strokeStyle = c.warn; ctx.beginPath(); ctx.moveTo(g.L, g.Y(-p.D)); ctx.lineTo(g.L + g.pw, g.Y(-p.D)); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.beginPath(); ctx.moveTo(g.X(p.re), g.T); ctx.lineTo(g.X(p.re), g.T + g.ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = c.warn; ctx.textAlign = 'right'; ctx.fillText('−D = −' + p.D + ' kJ/mol', g.L + g.pw - 4, g.Y(-p.D) + 12);
    ctx.fillStyle = c.accent; ctx.textAlign = 'left'; ctx.fillText('re = ' + p.re + ' pm', g.X(p.re) + 5, g.T + 12);
    var r = clamp(S.d, x0, x1); dot(ctx, g.X(r), g.Y(clamp(morse(p, r), ymin, ymax)), '#f85149');
  }
  function drawOrders(ctx, w, h, c) {
    var list = [{ id: 'cl2', l: 'Cl–Cl simple' }, { id: 'o2', l: 'O=O doble' }, { id: 'n2', l: 'N≡N triple' }];
    var L = 12, Tp = 18, B = 34, pw = w - L * 2, ph = h - Tp - B, gw = pw / 3, maxD = 945, maxL = 199;
    list.forEach(function (it, i) {
      var p = COV[it.id], x = L + i * gw, cur = P.cov === it.id;
      var bw = gw * 0.3, e = p.D / maxD, ln = p.re / maxL;
      ctx.globalAlpha = cur ? 1 : 0.65;
      ctx.fillStyle = c.accent; ctx.fillRect(x + gw * 0.14, Tp + ph * (1 - e), bw, ph * e);
      ctx.fillStyle = c.warn; ctx.fillRect(x + gw * 0.14 + bw + 4, Tp + ph * (1 - ln), bw, ph * ln); ctx.globalAlpha = 1;
      ctx.fillStyle = c.ink; ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.D, x + gw * 0.14 + bw / 2, Tp + ph * (1 - e) - 4); ctx.fillText(p.re, x + gw * 0.14 + bw * 1.5 + 4, Tp + ph * (1 - ln) - 4);
      ctx.fillStyle = cur ? c.ink : c.muted; ctx.font = (cur ? '700 ' : '') + '10.5px system-ui, sans-serif'; ctx.fillText(it.l, x + gw * 0.5, h - 16);
    });
    ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(L, Tp + ph); ctx.lineTo(L + pw, Tp + ph); ctx.stroke();
    ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = c.accent; ctx.fillText('■ Energía de enlace (kJ/mol)', L, h - 2); ctx.fillStyle = c.warn; ctx.fillText('■ Longitud (pm)', L + 150, h - 2);
  }
  function drawMetalBars(ctx, w, h, c) {
    var ids = ['na', 'mg', 'al', 'cu'], L = 12, Tp = 18, B = 34, pw = w - L * 2, ph = h - Tp - B, gw = pw / 4, mxT = 1100, mxH = 340;
    ids.forEach(function (id, i) {
      var p = MET[id], x = L + i * gw, cur = P.met === id, bw = gw * 0.3, a = p.mp / mxT, b = p.hs / mxH;
      ctx.globalAlpha = cur ? 1 : 0.65;
      ctx.fillStyle = c.accent; ctx.fillRect(x + gw * 0.12, Tp + ph * (1 - a), bw, ph * a);
      ctx.fillStyle = c.warn; ctx.fillRect(x + gw * 0.12 + bw + 4, Tp + ph * (1 - b), bw, ph * b); ctx.globalAlpha = 1;
      ctx.fillStyle = c.ink; ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.mp, x + gw * 0.12 + bw / 2, Tp + ph * (1 - a) - 4); ctx.fillText(p.hs, x + gw * 0.12 + bw * 1.5 + 4, Tp + ph * (1 - b) - 4);
      ctx.fillStyle = cur ? c.ink : c.muted; ctx.font = (cur ? '700 ' : '') + '11px system-ui, sans-serif'; ctx.fillText(p.s + ' (' + p.e + (p.id === 'cu' ? '+d' : '') + ' e⁻)', x + gw * 0.5, h - 16);
    });
    ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(L, Tp + ph); ctx.lineTo(L + pw, Tp + ph); ctx.stroke();
    ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = c.accent; ctx.fillText('■ Punto de fusión (°C)', L, h - 2); ctx.fillStyle = c.warn; ctx.fillText('■ ΔH atomización (kJ/mol)', L + 130, h - 2);
  }
  function drawDrift(ctx, w, h, c) {
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: 1, ymin: 0, ymax: 60, nx: 5, ny: 3, xd: 1, xl: 'Campo eléctrico aplicado (relativo)', yl: 'Densidad de corriente (rel.)' });
    Object.keys(MET).forEach(function (id) {
      var p = MET[id], cur = id === P.met;
      ctx.strokeStyle = cur ? c.accent : c.muted; ctx.lineWidth = cur ? 2.8 : 1.2; ctx.globalAlpha = cur ? 1 : 0.6;
      ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(0)); ctx.lineTo(g.X(1), g.Y(p.sig)); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = cur ? c.accent : c.muted; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(p.s, g.X(1) - 3, g.Y(p.sig) - 4);
    });
    var p = mp_(), x = clamp(S.field, 0, 1); dot(ctx, g.X(x), g.Y(p.sig * x), '#f85149');
  }

  /* --- estructura de Lewis / esquema --- */
  var SLOT = [[0, -1, -1], [1, 0, -1], [0, 1, -1], [-1, 0, -1], [0, -1, 1], [1, 0, 1], [0, 1, 1], [-1, 0, 1]];
  function dotsAround(ctx, x, y, r, n, col) {
    ctx.fillStyle = col;
    for (var i = 0; i < n && i < 8; i++) {
      var s = SLOT[i], px = x + s[0] * r + (s[0] === 0 ? s[2] * 4 : 0), py = y + s[1] * r + (s[1] === 0 ? s[2] * 4 : 0);
      ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.283); ctx.fill();
    }
  }
  function sym(ctx, s, x, y, col, size) { ctx.fillStyle = col; ctx.font = '700 ' + (size || 24) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.textBaseline = 'alphabetic'; }
  function drawLewis(ctx, w, h, c) {
    ctx.textAlign = 'center';
    var cy = h / 2 - 4;
    if (P.mode === 'ion') {
      var p = ip(), done = S.tr > 0.5, q = p.c.q;
      var xs = done ? [w * 0.26, w * 0.74] : [w * 0.22, w * 0.78];
      if (!done) {
        sym(ctx, p.c.s, xs[0], cy, hex(p.c.col)); dotsAround(ctx, xs[0], cy, 19, p.c.val, c.ink);
        sym(ctx, p.a.s, xs[1], cy, hex(p.a.col)); dotsAround(ctx, xs[1], cy, 19, p.a.val, c.ink);
        ctx.fillStyle = c.muted; ctx.font = '700 20px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+', w / 2, cy + 6);
        ctx.font = '11px system-ui, sans-serif'; ctx.fillText('átomos neutros', w / 2, h - 8);
      } else {
        ctx.strokeStyle = c.ink; ctx.lineWidth = 1.6;
        [[xs[0], p.c, 0, '⁺'], [xs[1], p.a, 8, '⁻']].forEach(function (it) {
          var x = it[0], bx = 30;
          ctx.beginPath(); ctx.moveTo(x - bx + 7, cy - 32); ctx.lineTo(x - bx, cy - 32); ctx.lineTo(x - bx, cy + 32); ctx.lineTo(x - bx + 7, cy + 32);
          ctx.moveTo(x + bx - 7, cy - 32); ctx.lineTo(x + bx, cy - 32); ctx.lineTo(x + bx, cy + 32); ctx.lineTo(x + bx - 7, cy + 32); ctx.stroke();
          sym(ctx, it[1].s, x, cy, hex(it[1].col)); dotsAround(ctx, x, cy, 19, it[2], c.ink);
          ctx.fillStyle = it[3] === '⁺' ? '#ffb070' : '#5ee3a2'; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText((q > 1 ? q : '') + (it[3] === '⁺' ? '+' : '−'), x + bx + 3, cy - 22);
        });
        ctx.fillStyle = c.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('iones con octeto completo (' + p.c.s + ' como gas noble anterior)', w / 2, h - 8);
      }
      var an = S.tr > 0.02 && S.tr < 0.98;
      if (an) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xs[0] + 24, cy - 30); ctx.quadraticCurveTo(w / 2, cy - 62, xs[1] - 24, cy - 30); ctx.stroke(); ctx.fillStyle = '#ffe066'; ctx.font = '11px system-ui, sans-serif'; ctx.fillText(q + ' e⁻', w / 2, cy - 48); }
    } else if (P.mode === 'cov') {
      var cv = cp(), A = cv.A, B = cv.B, xa = w * 0.3, xb = w * 0.7, ov = S.d / 100 < (A.vdw + B.vdw) * 0.0075 * 1.0;
      sym(ctx, A.s, xa, cy, hex(A.col === 0xf2f2f2 ? 0xd8d8d8 : A.col)); sym(ctx, B.s, xb, cy, hex(B.col));
      var lpd = function (x, n, outer) {
        ctx.fillStyle = c.ink;
        var pos = [[0, -1], [0, 1], [outer, 0]];
        for (var i = 0; i < n; i++) { var s = pos[i]; var bx = x + s[0] * 22, by = cy + s[1] * 22; var hz = s[1] !== 0; [-3.5, 3.5].forEach(function (o) { ctx.beginPath(); ctx.arc(bx + (hz ? o : 0), by + (hz ? 0 : o), 2.3, 0, 6.283); ctx.fill(); }); }
      };
      lpd(xa, A.lp, -1); lpd(xb, B.lp, 1);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 2;
      for (var i = 0; i < cv.order; i++) { var yy = cy + (i - (cv.order - 1) / 2) * 7; ctx.beginPath(); ctx.moveTo(xa + 20, yy); ctx.lineTo(xb - 20, yy); ctx.stroke(); }
      ctx.fillStyle = c.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      var den = dEN(A.en, B.en);
      ctx.fillText(den >= 0.4 ? 'δ+ / δ− · ΔEN = ' + fmt(den, 2) : 'apolar · ΔEN = ' + fmt(den, 2), w / 2, h - 8);
      ctx.fillText(['', 'un par compartido', 'dos pares compartidos', 'tres pares compartidos'][cv.order], w / 2, 14);
    } else {
      var mm = mp_(), rows = 2, cols = 4, t = performance.now() / 1000;
      var gx = w / (cols + 1), gy = (h - 30) / (rows + 1);
      var sea = S.sea;
      for (var r = 0; r < rows; r++) for (var cc = 0; cc < cols; cc++) {
        var x = gx * (cc + 1), y = gy * (r + 1) + 6;
        ctx.fillStyle = hex(mm.col); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 14 - 4 * sea, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#10151c'; ctx.font = '700 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(sea > 0.5 ? mm.s + sup(mm.e, '⁺') : mm.s, x, y + 3.5);
      }
      ctx.fillStyle = '#ffe066';
      for (var k = 0; k < 26; k++) {
        var px = ((k * 37 % 100) / 100 + Math.sin(t * (0.6 + (k % 5) * 0.2) + k) * 0.05 + S.field * ((t * 0.4 + k * 0.13) % 1)) % 1, py = ((k * 53 % 100) / 100 + Math.cos(t * 0.8 + k) * 0.05);
        var hx = gx * (1 + (k % cols)) + 4, hy = gy * (1 + (k % rows)) + 6;
        var fx = gx * 0.5 + px * (w - gx), fy = gy * 0.6 + py * (h - 40) * 0.95;
        ctx.beginPath(); ctx.arc(lerp(hx + 10, fx, sea), lerp(hy - 10, fy, sea), 2.3, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = c.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(sea > 0.5 ? 'cationes + mar de electrones deslocalizados' : 'átomos con sus electrones de valencia', w / 2, h - 8);
    }
  }

  /* ------------------------- Predictor y desafío ------------------------- */
  var pred = { a: 'Na', b: 'Cl' };
  function classify(a, b) {
    var den = dEN(a.en, b.en), pi = (1 - Math.exp(-0.25 * den * den)) * 100, cls, why;
    if (a.t === 'm' && b.t === 'm') { cls = 'met'; why = 'Dos metales: electronegatividades bajas, ninguno retiene con fuerza sus electrones de valencia → enlace metálico (metal puro o aleación).'; }
    else if (a.t !== b.t) {
      if (den >= 1.7) { cls = 'ion'; why = 'Metal + no metal con ΔEN ≥ 1,7: un átomo cede electrones y el otro los capta → enlace iónico.'; }
      else { cls = 'covp'; why = 'Metal + no metal pero con ΔEN < 1,7: el enlace tiene carácter intermedio (covalente polar con importante carácter iónico).'; }
    } else if (den < 0.4) { cls = 'cova'; why = 'Dos no metales con ΔEN < 0,4: la nube se reparte por igual → covalente apolar.'; }
    else if (den < 1.7) { cls = 'covp'; why = 'Dos no metales con 0,4 ≤ ΔEN < 1,7: el átomo más electronegativo atrae más la nube → covalente polar.'; }
    else { cls = 'ion'; why = 'Dos no metales con ΔEN ≥ 1,7: la regla de la diferencia sugiere carácter iónico (ej.: en la práctica casi todos son covalentes muy polares).'; }
    return { cls: cls, den: den, pi: pi, why: why };
  }
  var CLS = {
    ion: { name: 'Iónico', col: '#ffa23a', props: [['Estado a 25 °C', 'sólido cristalino'], ['Punto de fusión', 'alto (≈ 700–3000 °C)'], ['Conduce la corriente', 'fundido o disuelto; no como sólido'], ['Dureza', 'duro pero frágil'], ['Solubilidad en agua', 'frecuente (se disocia en iones)']] },
    covp: { name: 'Covalente polar', col: '#5ee3a2', props: [['Estado a 25 °C', 'gas, líquido o sólido molecular'], ['Punto de fusión', 'bajo a moderado'], ['Conduce la corriente', 'no (salvo que se ionice en agua)'], ['Interacciones entre moléculas', 'dipolo–dipolo, enlace de hidrógeno'], ['Solubilidad en agua', 'a menudo alta']] },
    cova: { name: 'Covalente apolar', col: '#58a6ff', props: [['Estado a 25 °C', 'gas, líquido o sólido molecular'], ['Punto de fusión', 'muy bajo (fuerzas de dispersión)'], ['Conduce la corriente', 'no'], ['Interacciones entre moléculas', 'fuerzas de London'], ['Solubilidad en agua', 'baja (soluble en disolventes apolares)']] },
    met: { name: 'Metálico', col: '#e3b341', props: [['Estado a 25 °C', 'sólido (excepto Hg)'], ['Punto de fusión', 'de bajo (Na) a muy alto (W)'], ['Conduce la corriente', 'sí, también como sólido'], ['Dureza', 'maleable y dúctil'], ['Brillo', 'brillo metálico']] }
  };
  var SIMMAP = {
    'Cl+Na': ['ion', 'nacl'], 'F+Li': ['ion', 'lif'], 'Br+K': ['ion', 'kbr'], 'Mg+O': ['ion', 'mgo'],
    'H+H': ['cov', 'h2'], 'Cl+Cl': ['cov', 'cl2'], 'O+O': ['cov', 'o2'], 'N+N': ['cov', 'n2'], 'Cl+H': ['cov', 'hcl'], 'F+H': ['cov', 'hf'],
    'Na+Na': ['met', 'na'], 'Mg+Mg': ['met', 'mg'], 'Al+Al': ['met', 'al'], 'Cu+Cu': ['met', 'cu']
  };
  function buildPredictor(el) {
    var c = kit.ui.card('¿Qué enlace forman dos elementos?');
    var opts = ELEMENTS.map(function (e) { return '<option value="' + e.s + '">' + e.s + ' (EN ' + fmt(e.en, 2) + ')</option>'; }).join('');
    c.insertAdjacentHTML('beforeend', '<div class="pair-row"><div><label for="selA">Elemento A</label><select id="selA">' + opts + '</select></div><div><label for="selB">Elemento B</label><select id="selB">' + opts + '</select></div></div><div id="predOut"></div>');
    el.appendChild(c);
    var a = c.querySelector('#selA'), b = c.querySelector('#selB');
    a.value = pred.a; b.value = pred.b;
    function go() { pred.a = a.value; pred.b = b.value; renderPred(c.querySelector('#predOut')); }
    a.addEventListener('change', go); b.addEventListener('change', go);
    go();
    var q = kit.ui.card('Modo desafío'); el.appendChild(q);
    kit.ui.quiz(q, { items: QUIZ, intro: 'Ocho preguntas sobre tipos de enlace, polaridad y propiedades.' });
  }
  function renderPred(out) {
    var A = el(pred.a), B = el(pred.b), r = classify(A, B), k = CLS[r.cls], key = [A.s, B.s].sort().join('+'), sim = SIMMAP[key];
    var zone = '<div class="zone-bar" role="img" aria-label="Escala de diferencia de electronegatividad"><i style="flex:' + 0.4 + ';background:#58a6ff">apolar</i><i style="flex:' + 1.3 + ';background:#5ee3a2">polar</i><i style="flex:' + 1.6 + ';background:#ffa23a">iónico</i><span class="zone-mark" style="left:' + clamp(r.den / 3.3 * 100, 0, 99) + '%"></span></div><div class="muted small" style="display:flex;justify-content:space-between"><span>0</span><span>0,4</span><span>1,7</span><span>3,3</span></div>';
    out.innerHTML = '<div class="verdict ok" style="border-color:' + k.col + '"><b>' + A.s + ' + ' + B.s + ': enlace ' + k.name.toLowerCase() + '</b></div>' +
      '<div class="grid2" style="margin:8px 0"><div class="stat"><small>ΔEN (Pauling)</small><b>' + fmt(r.den, 2) + '</b></div><div class="stat"><small>Carácter iónico (Pauling)</small><b>' + fmt(r.pi, 0) + ' %</b></div></div>' +
      (r.cls === 'met' ? '' : zone) +
      '<p class="muted small">' + r.why + '</p>' +
      '<div class="table-wrap"><table class="cmp"><tbody>' + k.props.map(function (p) { return '<tr><th>' + p[0] + '</th><td>' + p[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (sim ? '<div class="row" style="margin-top:8px"><button class="btn primary" id="btnSim">Simular ' + (sim[0] === 'ion' ? IONIC[sim[1]].f : sim[0] === 'cov' ? COV[sim[1]].f : MET[sim[1]].f) + ' en 3D</button></div>' : '<p class="muted small">Este par no está entre los casos 3D del simulador (NaCl, LiF, KBr, MgO · H₂, Cl₂, O₂, N₂, HCl, HF · Na, Mg, Al, Cu).</p>') +
      '<p class="muted small">Regla orientativa (ΔEN &lt; 0,4 apolar; 0,4–1,7 polar; ≥ 1,7 iónico): el enlace real es un continuo entre el covalente puro y el iónico puro.</p>';
    var bt = out.querySelector('#btnSim');
    if (bt) bt.addEventListener('click', function () {
      if (sim[0] === 'ion') P.ion = sim[1]; if (sim[0] === 'cov') P.cov = sim[1]; if (sim[0] === 'met') P.met = sim[1];
      kit.setMode(sim[0], true); applyMode(sim[0]); kit.selectTab && kit.selectTab('lab');
    });
  }
  var QUIZ = [
    { q: 'La diferencia de electronegatividad entre Na (0,93) y Cl (3,16) es 2,23. ¿Qué enlace forman?', options: ['Iónico', 'Covalente apolar', 'Covalente polar', 'Metálico'], answer: 0, why: 'ΔEN ≥ 1,7 y metal + no metal: el sodio cede un electrón al cloro y se forman iones Na⁺ y Cl⁻.' },
    { q: '¿Qué tipo de enlace une los dos átomos de una molécula de Cl₂?', options: ['Covalente apolar', 'Covalente polar', 'Iónico', 'Metálico'], answer: 0, why: 'Átomos iguales → ΔEN = 0: comparten el par de electrones por igual.' },
    { q: 'El NaCl sólido no conduce la electricidad, pero fundido sí. ¿Por qué?', options: ['En el sólido los iones están fijos; fundidos pueden moverse', 'Al fundirse aparecen electrones libres', 'El NaCl sólido tiene enlaces covalentes', 'La temperatura crea iones nuevos'], answer: 0, why: 'La carga la transportan los iones; en la red cristalina ocupan posiciones fijas, y al fundirse (o disolverse) quedan libres.' },
    { q: '¿Cuál tiene mayor punto de fusión, NaCl (801 °C) o MgO (2852 °C), y por qué?', options: ['MgO: cargas 2+/2− y menor distancia → mayor energía reticular', 'NaCl: tiene más iones', 'Son iguales: ambos son iónicos', 'NaCl: el Cl⁻ es más grande'], answer: 0, why: 'La energía reticular crece con el producto de cargas (q₁·q₂ = 4 frente a 1) y al disminuir la distancia entre los iones.' },
    { q: 'En N₂, ¿cuántos pares de electrones se comparten y cómo es su enlace frente al de O₂?', options: ['3 pares; más corto y más fuerte', '2 pares; más corto y más débil', '3 pares; más largo y más fuerte', '1 par; igual'], answer: 0, why: 'N≡N (triple): 110 pm y 945 kJ/mol; O=O (doble): 121 pm y 498 kJ/mol. A mayor orden de enlace, menor longitud y mayor energía.' },
    { q: '¿Qué modelo explica que los metales sean maleables y buenos conductores?', options: ['Cationes en un mar de electrones deslocalizados', 'Pares de electrones compartidos entre dos átomos', 'Transferencia completa de electrones', 'Fuerzas de London entre átomos'], answer: 0, why: 'Los electrones móviles conducen la corriente y, al deslizar una capa, el enlace no se rompe porque no es direccional.' },
    { q: 'En la molécula de HCl, ¿hacia dónde se desplaza la nube electrónica y qué cargas parciales aparecen?', options: ['Hacia el Cl: δ− en Cl y δ+ en H', 'Hacia el H: δ− en H y δ+ en Cl', 'No se desplaza: es apolar', 'Hacia el Cl, que queda con carga +1'], answer: 0, why: 'El Cl (3,16) es más electronegativo que el H (2,20): atrae más la nube y adquiere una carga parcial negativa.' },
    { q: 'Se desplaza una capa de un cristal de NaCl por una distancia interiónica. ¿Qué ocurre?', options: ['Quedan iones del mismo signo enfrentados y el cristal se fractura', 'Nada: la red se reacomoda como en un metal', 'El cristal se vuelve más conductor', 'Se forman moléculas de NaCl'], answer: 0, why: 'La repulsión entre iones iguales supera a la atracción: por eso los cristales iónicos son duros pero frágiles.' }
  ];

  /* ------------------------- Interfaz con el kit ------------------------- */
  var ui = {};
  function goManual() { if (!P.manual) { P.manual = true; kit.toast('Modo libre: tú controlas la escena'); } if (kit.state.playing) kit.pause(); }
  function pairList() {
    if (P.mode === 'ion') return Object.keys(IONIC).map(function (k) { return { v: k, label: IONIC[k].f, sub: IONIC[k].sub }; });
    if (P.mode === 'cov') return Object.keys(COV).map(function (k) { return { v: k, label: COV[k].f, sub: COV[k].sub }; });
    return Object.keys(MET).map(function (k) { return { v: k, label: MET[k].f, sub: MET[k].sub }; });
  }
  function curPair() { return P.mode === 'ion' ? P.ion : P.mode === 'cov' ? P.cov : P.met; }
  function setPair(v) {
    if (P.mode === 'ion') P.ion = v; else if (P.mode === 'cov') P.cov = v; else P.met = v;
    S.d = P.mode === 'ion' ? ionD0(ip()) * 1.5 : S.d;
    applyPair();
  }
  function applyPair() {
    refreshStageUI(); kit.setEq({ chip: eqChip(), name: eqName(), body: eqBody() }); kit.setLegend(legendRows()); rebuildCtrl(); kit.refresh();
    ui.g1 && ui.g1.redraw(); ui.g2 && ui.g2.redraw(); ui.lewis && ui.lewis.redraw();
  }
  function eqChip() { return P.mode === 'ion' ? 'Iónico' : P.mode === 'cov' ? 'Covalente' : 'Metálico'; }
  function eqName() { return P.mode === 'ion' ? ip().f + ' · red iónica' : P.mode === 'cov' ? cp().f + ' · molécula ' + (dEN(cp().A.en, cp().B.en) < 0.4 ? 'apolar' : 'polar') : mp_().s + ' · enlace metálico'; }
  function eqBody() {
    if (P.mode === 'ion') {
      var p = ip(), q = p.c.q;
      return '<div class="eqline"><small>Catión · se oxida</small>' + p.c.s + ' → ' + p.c.s + sup(q, '⁺') + ' + ' + q + ' e⁻</div>' +
        '<div class="eqline"><small>Anión · se reduce</small>' + (p.a.s === 'O' ? '½ O₂' : '½ ' + p.a.s + '₂') + ' + ' + q + ' e⁻ → ' + p.a.s + sup(q, '⁻') + '</div>' +
        '<div class="eqline"><small>Formación · ΔH°f = ' + fmt(p.hf, 0) + ' kJ/mol</small>' + p.c.s + '(s) + ' + (p.a.s === 'O' ? '½ O₂' : '½ ' + p.a.s + '₂') + ' → ' + p.f + '(s)</div>' +
        '<small>ΔEN = ' + fmt(dEN(p.c.en, p.a.en), 2) + ' · U = ' + fmt(p.U, 0) + ' kJ/mol · d(' + p.c.s + '–' + p.a.s + ') = ' + ionD0(p) + ' pm</small>';
    }
    if (P.mode === 'cov') {
      var v = cp(), bs = ['', '–', '=', '≡'][v.order];
      return '<div class="eqline"><small>Lewis</small>' + v.A.s + ' ' + bs + ' ' + v.B.s + ' (' + v.order + (v.order > 1 ? ' pares' : ' par') + ' compartido' + (v.order > 1 ? 's' : '') + ')</div>' +
        '<div class="eqline"><small>Formación</small>' + v.A.s + '· + ·' + v.B.s + ' → ' + v.A.s + bs + v.B.s + ' · ΔH = −' + v.D + ' kJ/mol</div>' +
        '<small>re = ' + v.re + ' pm · ΔEN = ' + fmt(dEN(v.A.en, v.B.en), 2) + ' · μ = ' + fmt(v.mu, 2) + ' D</small>';
    }
    var m = mp_();
    return '<div class="eqline"><small>Deslocalización</small>' + m.s + '(s) → ' + m.s + sup(m.e, '⁺') + ' + ' + m.e + ' e⁻ (mar)</div>' +
      '<div class="eqline"><small>Atomización · ΔH = +' + m.hs + ' kJ/mol</small>' + m.s + '(s) → ' + m.s + '(g)</div>' +
      '<small>r átomo ' + m.ra + ' pm → catión ' + m.ri + ' pm · p.f. ' + fmt(m.mp, 0) + ' °C</small>';
  }
  function legendRows() {
    var rows = [];
    if (P.mode === 'ion') {
      var p = ip();
      rows.push({ color: hex(p.c.col), label: p.c.s + sup(p.c.q, '⁺'), text: 'catión (cede e⁻)' }, { color: hex(p.a.col), label: p.a.s + sup(p.a.q, '⁻'), text: 'anión (capta e⁻)' });
      if (kit.layer('e')) rows.push({ color: '#ffe066', label: 'e⁻', text: 'electrón transferido' });
      if (kit.layer('force')) rows.push({ color: '#5ee3a2', label: 'Atracción', text: 'Coulomb entre iones' });
    } else if (P.mode === 'cov') {
      var v = cp();
      rows.push({ color: hex(v.A.col), label: v.A.s, text: 'núcleo y nube' }, { color: hex(v.B.col), label: v.B.s, text: 'núcleo y nube' });
      if (kit.layer('e')) rows.push({ color: '#ffe066', label: 'e⁻', text: 'pares compartidos (zona de solapamiento)' });
      if (kit.layer('force')) rows.push({ color: '#ffe066', label: 'Dipolo', text: 'apunta hacia δ−', arrow: true });
    } else {
      var m = mp_();
      rows.push({ color: hex(m.col), label: m.s + sup(m.e, '⁺'), text: 'cationes fijos en la red' });
      if (kit.layer('e')) rows.push({ color: '#ffe066', label: 'e⁻', text: 'electrones deslocalizados' });
    }
    return rows;
  }
  function rebuildCtrl() {
    var host = ui.ctrl; if (!host) return;
    host.innerHTML = '';
    ui.pairOpts = kit.ui.options({ label: P.mode === 'ion' ? 'Compuesto iónico' : P.mode === 'cov' ? 'Sustancia covalente' : 'Metal', cols: 2, value: curPair(), options: pairList(), onChange: function (v) { P.manual = false; setPair(v); } });
    host.appendChild(ui.pairOpts);
    var sl = [];
    if (P.mode === 'ion') {
      var p = ip(), d0 = ionD0(p);
      ui.s1 = kit.ui.slider({ label: 'Distancia', min: 120, max: 900, step: 2, value: S.d, format: function (v) { return fmt(v, 0) + ' pm'; }, onInput: function (v) { goManual(); S.d = v; S.asm = 0; S.tr = clamp((780 - v) / 200, 0, 1); S.shear = 0; } });
      ui.s2 = kit.ui.slider({ label: 'Red cristalina', min: 0, max: 1, step: 0.01, value: S.asm, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { goManual(); S.asm = v; S.tr = 1; S.d = d0; if (v < 1) S.shear = 0; } });
      ui.s3 = kit.ui.slider({ label: 'Deslizar capa', min: 0, max: 1, step: 0.01, value: S.shear, format: function (v) { return fmt(v, 2) + ' esp.'; }, onInput: function (v) { goManual(); S.asm = 1; S.tr = 1; S.d = d0; S.shear = v; } });
      sl = [ui.s1, ui.s2, ui.s3];
    } else if (P.mode === 'cov') {
      var cv = cp();
      ui.s1 = kit.ui.slider({ label: 'Distancia', min: Math.round(cv.re * 0.5), max: Math.round(cv.re * 3.4), step: 1, value: S.d, format: function (v) { return fmt(v, 0) + ' pm'; }, onInput: function (v) { goManual(); S.d = v; S.pol = 1; } });
      sl = [ui.s1];
    } else {
      ui.s1 = kit.ui.slider({ label: 'Deslocaliz.', min: 0, max: 1, step: 0.01, value: S.sea, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { goManual(); S.sea = v; } });
      ui.s2 = kit.ui.slider({ label: 'Campo', min: 0, max: 1, step: 0.01, value: S.field, format: function (v) { return fmt(v, 2); }, onInput: function (v) { goManual(); S.sea = 1; S.field = v; } });
      ui.s3 = kit.ui.slider({ label: 'Deslizar capa', min: 0, max: 1, step: 0.01, value: S.shear, format: function (v) { return fmt(v, 2) + ' esp.'; }, onInput: function (v) { goManual(); S.sea = 1; S.shear = v; } });
      sl = [ui.s1, ui.s2, ui.s3];
    }
    host.appendChild(kit.ui.sliders(sl));
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<button class="btn primary" id="btnLesson">Volver a la lección</button>';
    host.appendChild(row);
    row.querySelector('#btnLesson').addEventListener('click', function () { P.manual = false; kit.toast('La lección controla la escena'); });
    if (ui.g1k) ui.g1k.textContent = P.mode === 'ion' ? 'Energía de un par de iones' : P.mode === 'cov' ? 'Energía potencial del enlace' : 'Enlace metálico y propiedades';
    if (ui.g2k) ui.g2k.textContent = P.mode === 'ion' ? 'Ciclo de Born–Haber' : P.mode === 'cov' ? 'Orden de enlace, longitud y energía' : 'Conductividad eléctrica';
    if (ui.n1) ui.n1.innerHTML = P.mode === 'ion' ? 'La curva roja es la energía del par: Coulomb (atracción) + repulsión de Born. Mueve la distancia en <i>Lab</i> y observa el pozo.' : P.mode === 'cov' ? 'Curva de Morse: el mínimo es la <b>longitud de enlace</b> y su profundidad, la <b>energía de enlace</b>. Más cerca de re los núcleos se repelen.' : 'Barras: punto de fusión y entalpía de atomización. Más electrones por átomo y cationes más pequeños → enlace más fuerte (Na &lt; Mg &lt; Al).';
    if (ui.n2) ui.n2.innerHTML = P.mode === 'ion' ? 'ΔH°f = suma de pasos. El gran aporte estabilizante es la <b>energía reticular</b> (barra verde grande): sin la red, la transferencia de electrones no compensaría.' : P.mode === 'cov' ? 'A mayor orden (simple, doble, triple) el enlace es más corto y más fuerte. Barras normalizadas al máximo.' : 'La corriente crece linealmente con el campo (ley de Ohm); la pendiente es la conductividad σ relativa del metal.';
  }
  function buildLab(el) {
    var c = kit.ui.card('Panel de control');
    ui.ctrl = document.createElement('div'); c.appendChild(ui.ctrl); el.appendChild(c);
    rebuildCtrl();
    ui.info = kit.ui.card('Datos'); el.appendChild(ui.info);
    updateInfo();
  }
  function updateInfo() {
    if (!ui.info) return;
    var h = '<div class="card-kicker">Datos del sistema</div>';
    if (P.mode === 'ion') { var p = ip(); h += kv('Electronegatividad ' + p.c.s + ' · ' + p.a.s, fmt(p.c.en, 2) + ' · ' + fmt(p.a.en, 2)) + kv('Radio atómico → iónico (' + p.c.s + ')', p.c.ra + ' → ' + p.c.ri + ' pm') + kv('Radio atómico → iónico (' + p.a.s + ')', p.a.ra + ' → ' + p.a.ri + ' pm') + kv('Energía de ionización', p.c.ie + ' kJ/mol'); }
    else if (P.mode === 'cov') { var v = cp(); h += kv('EN ' + v.A.s + ' · ' + v.B.s, fmt(v.A.en, 2) + ' · ' + fmt(v.B.en, 2)) + kv('Orden de enlace', String(v.order)) + kv('Longitud re', v.re + ' pm') + kv('Energía de enlace D', v.D + ' kJ/mol') + kv('Momento dipolar μ', fmt(v.mu, 2) + ' D'); }
    else { var m = mp_(); h += kv('e⁻ de valencia por átomo', m.ev_t) + kv('Radio átomo → catión', m.ra + ' → ' + m.ri + ' pm') + kv('Punto de fusión', fmt(m.mp, 0) + ' °C') + kv('ΔH de atomización', m.hs + ' kJ/mol') + kv('Conductividad σ (10⁶ S/m)', String(m.sig)); }
    ui.info.innerHTML = h;
  }
  function buildEnergy(el) {
    var c1 = kit.ui.card(''); ui.g1k = c1.querySelector('.card-kicker');
    ui.g1 = kit.ui.canvas(c1, { height: 240, label: 'Gráfico de energía del enlace', draw: function (ctx, w, h, c, api) { (P.mode === 'ion' ? drawCoulomb : P.mode === 'cov' ? drawMorse : drawMetalBars)(ctx, w, h, c); },
      pointer: function (x, y, kind) { if (kind === 'move') return; var s = ui.g1.size(), L = 46, pw = s.w - L - 10, f = clamp((x - L) / pw, 0, 1);
        if (P.mode === 'ion') { goManual(); S.d = 100 + f * 700; S.asm = 0; S.shear = 0; S.tr = clamp((780 - S.d) / 200, 0, 1); ui.s1 && ui.s1.set(S.d); }
        else if (P.mode === 'cov') { var p = cp(); goManual(); S.d = p.re * 0.5 + f * p.re * 2.9; S.pol = 1; ui.s1 && ui.s1.set(S.d); } } });
    c1.insertAdjacentHTML('beforeend', '<p class="muted small" id="n1"></p>'); ui.n1 = c1.querySelector('#n1');
    var c2 = kit.ui.card(''); ui.g2k = c2.querySelector('.card-kicker');
    ui.g2 = kit.ui.canvas(c2, { height: 240, label: 'Segundo gráfico', draw: function (ctx, w, h, c) { (P.mode === 'ion' ? drawBH : P.mode === 'cov' ? drawOrders : drawDrift)(ctx, w, h, c); } });
    c2.insertAdjacentHTML('beforeend', '<p class="muted small" id="n2"></p>'); ui.n2 = c2.querySelector('#n2');
    el.appendChild(c1); el.appendChild(c2);
    rebuildCtrl();
  }

  function applyMode(id) {
    P.mode = id; P.manual = false;
    var d0 = ionD0(ip());
    S.d = id === 'ion' ? 720 : id === 'cov' ? covFar(cp()) : S.d;
    S.tr = 0; S.asm = 0; S.shear = 0; S.pol = 0; S.sea = 0; S.field = 0; S.halo = 0;
    showGroup();
    var m = MODECAM[id]; camera.position.set(m.x, m.y, m.d); controls.target.set(0, 0, 0); P.camGoal = null;
    tableMat && (tableMat.visible = id !== 'cov');
    applyPair();
    updateInfo();
  }

  function init() {
    setStages(stagesIon(IONIC.nacl));
    kit = SimKit.create({
      key: 'enlace-quimico',
      title: 'Enlace químico',
      subtitle: 'Simulador 3D · química general',
      accent: { dark: '#ffcf5c', light: '#b87900' },
      viewLabel: 'Visor 3D del enlace químico',
      modes: [
        { id: 'ion', label: 'Iónico', sub: 'transferencia de e⁻', color: '#ffa23a' },
        { id: 'cov', label: 'Covalente', sub: 'pares compartidos', color: '#5ee3a2' },
        { id: 'met', label: 'Metálico', sub: 'mar de electrones', color: '#e3b341' }
      ], modesLabel: 'Tipo de enlace',
      onMode: function (id) { applyMode(id); },
      stages: STAGES,
      mainTabLabel: 'Guía',
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'energia', label: 'Energía', build: function (el, k) { kit = k; buildEnergy(el); } },
        { id: 'pred', label: 'Predictor', build: function (el, k) { kit = k; buildPredictor(el); } }
      ],
      mainExtra: function (el, k) {
        kit = k;
        var c = kit.ui.card('Esquema de Lewis');
        ui.lewis = kit.ui.canvas(c, { height: 150, label: 'Estructura de Lewis o esquema del enlace', draw: drawLewis });
        el.appendChild(c);
      },
      measuresTitle: 'Medidas en vivo',
      measures: function () {
        if (P.mode === 'ion') {
          var p = ip(), e = coulombE(p, clamp(S.d, 100, 900));
          return [['Distancia entre iones', fmt(S.d, 0) + ' pm'], ['Distancia de equilibrio r₀', ionD0(p) + ' pm'], ['ΔEN', fmt(dEN(p.c.en, p.a.en), 2)], ['Electrones transferidos', fmt(S.tr * p.c.q, 1) + ' de ' + p.c.q],
            ['Energía del par (Coulomb + Born)', S.d > 780 ? '≈ 0' : fmt(e, 0) + ' kJ/mol'], ['Energía reticular U', fmt(p.U, 0) + ' kJ/mol'], ['ΔH°f', fmt(p.hf, 0) + ' kJ/mol'], ['Punto de fusión', fmt(p.mp, 0) + ' °C']];
        }
        if (P.mode === 'cov') {
          var v = cp();
          return [['Distancia internuclear', fmt(S.d, 0) + ' pm'], ['Longitud de enlace re', v.re + ' pm'], ['Energía a esa distancia', fmt(morse(v, clamp(S.d, v.re * 0.5, v.re * 3.4)), 0) + ' kJ/mol'], ['Energía de enlace D', v.D + ' kJ/mol'],
            ['Orden de enlace', String(v.order)], ['ΔEN', fmt(dEN(v.A.en, v.B.en), 2)], ['Carácter iónico (Pauling)', fmt((1 - Math.exp(-0.25 * Math.pow(dEN(v.A.en, v.B.en), 2))) * 100, 0) + ' %'], ['Momento dipolar μ', fmt(v.mu, 2) + ' D']];
        }
        var m = mp_(), n = Math.min(81, Math.round(27 * m.ev));
        return [['e⁻ de valencia por átomo', m.ev_t], ['e⁻ del mar mostrados', fmt(n * S.sea, 0) + ' de ' + n], ['Radio átomo → catión', fmt(lerp(m.ra, m.ri, S.sea), 0) + ' pm'], ['Campo aplicado', fmt(S.field, 2)],
          ['Densidad de corriente (rel.)', fmt(m.sig * S.field, 1)], ['ΔH de atomización', m.hs + ' kJ/mol'], ['Punto de fusión', fmt(m.mp, 0) + ' °C'], ['Capa deslizada', fmt(S.shear, 2) + ' espacios']];
      },
      ideas: [
        'Un enlace es un <b>continuo</b>: ΔEN pequeña → covalente apolar; intermedia → polar; grande → iónico. Los metales forman un caso aparte.',
        'En el enlace iónico la estabilidad la aporta la <b>red cristalina</b> (energía reticular), no el par aislado.',
        'En el covalente, la longitud de enlace es el mínimo de energía: más cerca los núcleos se repelen.',
        'Más pares compartidos → enlace <b>más corto y más fuerte</b> (simple &lt; doble &lt; triple).',
        'El enlace metálico no es direccional: por eso los metales son maleables, y los electrones libres explican la conductividad.'
      ],
      layers: [
        { id: 'e', label: 'Electrones', icon: 'e⁻' },
        { id: 'force', label: 'Fuerzas / dipolo', icon: '⇄' },
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
      },
      onStage: function () { P.manual = false; ui.g2 && ui.g2.redraw(); },
      onGuide: function () { P.manual = false; },
      onResize: resize,
      render: function () { renderer.render(scene, camera); },
      onFrame: function (f) {
        if (!P.manual) drive(f);
        if (ui.s1 && ui.s1.set) {
          if (P.mode === 'ion') { ui.s1.set(S.d); ui.s2.set(S.asm); ui.s3.set(S.shear); }
          else if (P.mode === 'cov') ui.s1.set(S.d);
          else { ui.s1.set(S.sea); ui.s2.set(S.field); ui.s3.set(S.shear); }
        }
        sceneFrame(f.dt, f);
        if (ui.g1) ui.g1.redraw();
        if (ui.g2 && (f.stage && (P.mode !== 'cov'))) ui.g2.redraw();
        if (ui.lewis) ui.lewis.redraw();
      },
      init: function (k) {
        kit = k;
        buildScene(); resize();
        k.cfg.onTheme(k.state.theme);
        labelRenderer.domElement.style.display = k.layer('labels') ? 'block' : 'none';
        controls.autoRotate = k.layer('rot');
        applyMode('ion');
      },
      help: {
        intro: 'Elige el tipo de enlace arriba, sigue la lección con el reproductor inferior y gira el modelo arrastrando. Si mueves un control del panel “Lab” pasas a <b>modo libre</b>; con “Volver a la lección” el guion recupera el control.',
        items: [
          ['Tipo de enlace', 'iónico (NaCl, LiF, KBr, MgO), covalente (H₂, Cl₂, O₂, N₂, HCl, HF) y metálico (Na, Mg, Al, Cu).'],
          ['Capas', 'electrones, fuerzas o dipolo, etiquetas y giro automático.'],
          ['Lab', 'cambia de sustancia y mueve la distancia, la formación de la red, el campo eléctrico o el deslizamiento de una capa.'],
          ['Energía', 'curva Coulomb–Born y ciclo de Born–Haber (iónico), curva de Morse y orden de enlace (covalente), propiedades y conductividad (metálico). Haz clic sobre la curva para mover la distancia.'],
          ['Predictor', 'elige dos elementos y descubre qué enlace forman según ΔEN; puedes simular el caso en 3D.']
        ]
      }
    });
    kit.setMode('ion', true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
