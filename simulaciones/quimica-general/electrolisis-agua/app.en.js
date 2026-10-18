/* Electrólisis del agua — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js */
(function () {
  "use strict";
  var T = THREE;
  var F = 96485;            // C/mol e⁻
  var VM = 24.465;          // L/mol de gas ideal a 25 °C y 1 atm
  var E_TEO = 1.23;         // V, ΔG°/(zF)
  var E_TN = 1.48;          // V, ΔH°/(zF) (voltaje termoneutro)
  var CAP = 40;             // mL, capacidad de cada probeta
  var fmt = SimKit.fmt, clamp = SimKit.clamp;

  /* ------------------------- Datos químicos ------------------------- */
  var MEDIA = {
    acid: { id: 'acid', label: "Acid", sub: "Dilute H₂SO₄", color: '#ff7a6b', f: 1.0, ph: 'pH ≈ 1',
      name: "H₂SO₄(aq) · inert electrodes",
      cat: '4 H⁺(aq) + 4 e⁻ → 2 H₂(g)', an: '2 H₂O(l) → O₂(g) + 4 H⁺(aq) + 4 e⁻',
      Ec: 0.00, Ea: 1.23, cation: 'H⁺', anion: 'SO₄²⁻', bulk: '#e5493a', catHalo: '#f3a05a', anHalo: '#b3231f',
      note: "The H⁺ of the acid is the one that is reduced; at the anode water is oxidized and regenerates H⁺." },
    neutral: { id: 'neutral', label: "Neutral", sub: 'Na₂SO₄', color: '#5ee3a2', f: 1.6, ph: 'pH ≈ 7',
      name: "Na₂SO₄(aq) · inert electrodes",
      cat: '4 H₂O(l) + 4 e⁻ → 2 H₂(g) + 4 OH⁻(aq)', an: '2 H₂O(l) → O₂(g) + 4 H⁺(aq) + 4 e⁻',
      Ec: -0.41, Ea: 0.82, cation: 'Na⁺', anion: 'SO₄²⁻', bulk: '#2fbf71', catHalo: '#5b4fd6', anHalo: '#e8553b',
      note: "Na⁺ and SO₄²⁻ do not react (they only conduct). Near the cathode the pH rises; near the anode it falls." },
    base: { id: 'base', label: "Basic", sub: "NaOH", color: '#7e9bff', f: 0.9, ph: 'pH ≈ 13',
      name: "NaOH(aq) · inert electrodes",
      cat: '4 H₂O(l) + 4 e⁻ → 2 H₂(g) + 4 OH⁻(aq)', an: '4 OH⁻(aq) → O₂(g) + 2 H₂O(l) + 4 e⁻',
      Ec: -0.83, Ea: 0.40, cation: 'Na⁺', anion: 'OH⁻', bulk: '#5a45c9', catHalo: '#3a2a9a', anHalo: '#8ea3ee',
      note: "In basic medium water is reduced (cathode) and OH⁻ is oxidized (anode)." }
  };
  var ELECTRODES = {
    pt: { label: "Platinum", sub: 'η ≈ 0,45 V', eta: 0.45 },
    ni: { label: "Nickel", sub: 'η ≈ 0,55 V', eta: 0.55 },
    ss: { label: "Stainless steel", sub: 'η ≈ 0,75 V', eta: 0.75 }
  };

  var P = {                 // parámetros y estado de la celda
    medium: 'acid', electrode: 'pt', V: 0, conc: 1.0, accel: 10,
    I: 0, Q: 0, nH2: 0, nO2: 0, tsim: 0, manual: false, hist: [], lastHist: 0, fullMsg: 0
  };
  function medium() { return MEDIA[P.medium]; }
  function eDec() { return E_TEO + ELECTRODES[P.electrode].eta; }
  function resistance() { return 3.5 * medium().f / Math.pow(Math.max(P.conc, 0.05), 0.6); }
  function currentAt(V) { var e = eDec(); return V > e ? (V - e) / resistance() : 0; }

  /* ------------------------- Lección (etapas) ------------------------- */
  var STAGES = [
    { name: "Cell setup", short: "Setup", dur: 7,
      title: "An electrolytic cell",
      text: "<p>Two inert electrodes are immersed in water with an electrolyte. Pure water barely conducts electricity (≈10⁻⁷ mol/L of ions), which is why an acid, a base or a salt is added.</p><p>The power supply <b>forces</b> a reaction that does not occur on its own: the (−) pole is connected to the <b>cathode</b> (reduction) and the (+) pole to the <b>anode</b> (oxidation).</p>" },
    { name: "Insufficient voltage", short: "No reaction", dur: 8,
      title: "Below the minimum voltage nothing happens",
      text: "<p>The overall reaction 2 H₂O → 2 H₂ + O₂ is nonspontaneous (ΔG° = +237 kJ per mole of H₂O). Its standard potential is ΔE° = −1.23 V, so <b>more than 1.23 V</b> must be applied.</p><p>In practice, the <b>overpotential</b> (η) of the electrodes must also be overcome, so between 1.23 V and the real decomposition voltage no appreciable current flows yet.</p>" },
    { name: "Decomposition voltage", short: "Threshold", dur: 9, ts: true,
      title: "Current and bubbles appear",
      text: "<p>When E° + η is exceeded (≈ 1.7 V for platinum) electrolysis begins: electrons travel through the external circuit, the <b>cathode</b> reduces and the <b>anode</b> oxidizes.</p><p>Look at the <b>half-reactions</b> in the upper box: they depend on the medium (acidic, neutral or basic), but the overall reaction is always the same.</p>" },
    { name: "2 : 1 ratio", short: 'H₂ : O₂ = 2:1', dur: 8,
      title: "Twice the volume of H₂ as of O₂",
      text: "<p>Every 4 e⁻ produce <b>2 H₂</b> at the cathode and <b>1 O₂</b> at the anode. At equal temperature and pressure, gas volumes are proportional to moles (Avogadro): <b>V(H₂) : V(O₂) = 2 : 1</b>.</p><p>Check it in the panel's tubes: the H₂ one fills twice as fast.</p>" },
    { name: "Faraday's law", short: 'Faraday', dur: 9,
      title: "The amount of gas depends on the charge",
      text: "<p><b>n = Q / (z·F)</b>, with Q = I·t, F = 96,485 C/mol and z = 2 for H₂ (z = 4 for O₂ per mole).</p><p>As the voltage increases the current increases and, therefore, so does the gas production rate. Watch how n(H₂) and V(H₂) rise in the table.</p>" },
    { name: "Energy and efficiency", short: "Yield", dur: 8,
      title: "Any extra voltage is lost as heat",
      text: "<p>The minimum energy to obtain one mole of H₂ is ΔH° = 285.8 kJ (thermoneutral voltage 1.48 V). With a cell at V volts, 2·F·V joules are spent per mole of H₂.</p><p>The energy efficiency ≈ 1.48 / V: the higher the applied voltage, the more energy is dissipated in overpotentials and solution resistance.</p>" }
  ];
  function lessonVoltage(i, local) {
    var e = eDec();
    switch (i) {
      case 0: return 0;
      case 1: return (e - 0.35) * local;
      case 2: return (e - 0.35) + (e + 0.9 - (e - 0.35)) * local;
      case 3: return 3.0;
      case 4: return 3.0 + 4.5 * local;
      default: return 4.0;
    }
  }

  /* ------------------------- Escena 3D ------------------------- */
  var scene, camera, renderer, labelRenderer, controls, kit;
  var water, waterMat, glassMat, tableMat, cathodeMat, anodeMat, posTermMat, negTermMat, haloC, haloA;
  var bubbleMesh, bubbles = [], dummy = new T.Object3D(), spawnCounter = 0, colorH2 = new T.Color(0xcfe8ff), colorO2 = new T.Color(0xffb3aa);
  var ionC, ionA, ionsC = [], ionsA = [];
  var posParticles = [], negParticles = [], labelsLayer, batteryLabelDiv, camGoal = null;
  var MAXB = 320;

  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(1.5, 5.2, 14.6);
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer();
    labelRenderer.domElement.className = 'labels-layer';
    cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; controls.minDistance = 4; controls.maxDistance = 26;
    controls.target.set(0, -0.7, 1.4);
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener('start', function () { camGoal = null; });

    scene.add(new T.AmbientLight(0xffffff, 0.75));
    var dl = new T.DirectionalLight(0xffffff, 1.2); dl.position.set(5, 10, 7); scene.add(dl);

    glassMat = new T.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5, side: T.DoubleSide, depthWrite: false });
    var beaker = new T.Mesh(new T.CylinderGeometry(2.6, 2.5, 5, 40, 1, true), glassMat); beaker.renderOrder = 2; scene.add(beaker);
    var base = new T.Mesh(new T.CylinderGeometry(2.5, 2.5, 0.1, 40), glassMat); base.position.y = -2.5; base.renderOrder = 2; scene.add(base);
    waterMat = new T.MeshStandardMaterial({ color: 0x3882b6, transparent: true, opacity: 0.38, roughness: 0.2, depthWrite: false });
    water = new T.Mesh(new T.CylinderGeometry(2.45, 2.45, 4.2, 40), waterMat); water.position.y = -0.3; water.renderOrder = 1; scene.add(water);

    var rodGeo = new T.CylinderGeometry(0.12, 0.12, 3.8, 20);
    cathodeMat = new T.MeshStandardMaterial({ color: 0x58a6ff, metalness: 0.8, roughness: 0.3, emissive: 0x1a4d8f, emissiveIntensity: 0 });
    anodeMat = new T.MeshStandardMaterial({ color: 0xf85149, metalness: 0.8, roughness: 0.3, emissive: 0x8f1a1a, emissiveIntensity: 0 });
    var cathode = new T.Mesh(rodGeo, cathodeMat); cathode.position.set(-1, -0.4, 0); scene.add(cathode);
    var anode = new T.Mesh(rodGeo, anodeMat); anode.position.set(1, -0.4, 0); scene.add(anode);

    tableMat = new T.MeshStandardMaterial({ color: 0x161b22, roughness: 0.8 });
    var table = new T.Mesh(new T.BoxGeometry(11, 0.4, 9), tableMat); table.position.y = -2.7; scene.add(table);

    // halos de pH alrededor de los electrodos
    var haloGeo = new T.CylinderGeometry(0.78, 0.78, 3.7, 28, 1, true);
    haloC = new T.Mesh(haloGeo, new T.MeshBasicMaterial({ color: 0x5b4fd6, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
    haloA = new T.Mesh(haloGeo, new T.MeshBasicMaterial({ color: 0xe8553b, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
    haloC.position.set(-1, -0.5, 0); haloA.position.set(1, -0.5, 0); haloC.renderOrder = 1; haloA.renderOrder = 1; scene.add(haloC, haloA);

    // fuente
    var bat = new T.Group();
    bat.add(new T.Mesh(new T.BoxGeometry(1.5, 0.75, 0.8), new T.MeshStandardMaterial({ color: 0x21262d, metalness: 0.5, roughness: 0.45 })));
    var tg = new T.CylinderGeometry(0.12, 0.12, 0.22, 14);
    posTermMat = new T.MeshStandardMaterial({ color: 0xf85149, metalness: 0.6, roughness: 0.3, emissive: 0x8f1a1a, emissiveIntensity: 0 });
    negTermMat = new T.MeshStandardMaterial({ color: 0x58a6ff, metalness: 0.6, roughness: 0.3, emissive: 0x1a4d8f, emissiveIntensity: 0 });
    var pt = new T.Mesh(tg, posTermMat); pt.rotation.z = Math.PI / 2; pt.position.set(0.86, 0, 0); bat.add(pt);
    var nt = new T.Mesh(tg, negTermMat); nt.rotation.z = Math.PI / 2; nt.position.set(-0.86, 0, 0); bat.add(nt);
    bat.position.set(0, -2.28, 5.6); scene.add(bat);

    function wire(start, m1, m2, end, color) {
      var curve = new T.CatmullRomCurve3([start, m1, m2, end]);
      scene.add(new T.Mesh(new T.TubeGeometry(curve, 56, 0.035, 8, false), new T.MeshStandardMaterial({ color: color, metalness: 0.3, roughness: 0.5 })));
      return curve;
    }
    var posCurve = wire(new T.Vector3(0.86, -2.28, 5.6), new T.Vector3(0.9, 3.3, 3.2), new T.Vector3(1.05, 3.3, 0.4), new T.Vector3(1, 1.55, 0), 0xf85149);
    var negCurve = wire(new T.Vector3(-0.86, -2.28, 5.6), new T.Vector3(-0.9, 3.3, 3.2), new T.Vector3(-1.05, 3.3, 0.4), new T.Vector3(-1, 1.55, 0), 0x58a6ff);
    function electrons(curve, color, n, dir) {
      var arr = [], g = new T.SphereGeometry(0.06, 10, 10);
      for (var i = 0; i < n; i++) {
        var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.1 }));
        m.visible = false; scene.add(m); arr.push({ mesh: m, t: i / n, curve: curve, dir: dir });
      }
      return arr;
    }
    posParticles = electrons(posCurve, 0xffe066, 7, -1);   // ánodo → polo (+)
    negParticles = electrons(negCurve, 0xffe066, 7, 1);    // polo (−) → cátodo

    function label(text, cls, parent, y) {
      var d = document.createElement('div'); d.className = 'elec-label ' + cls; d.textContent = text;
      var o = new T.CSS2DObject(d); o.position.set(0, y, 0); parent.add(o); return d;
    }
    label("CATHODE (−) · reduction", 'label-cathode', cathode, 2.2);
    label("ANODE (+) · oxidation", 'label-anode', anode, 2.2);
    batteryLabelDiv = label("SOURCE · 0.0 V", 'label-battery', bat, 0.65);
    var h2l = document.createElement('div'); h2l.className = 'elec-label label-gas'; h2l.textContent = 'H₂ ↑';
    var o2l = document.createElement('div'); o2l.className = 'elec-label label-gas'; o2l.textContent = 'O₂ ↑';
    var h2o = new T.CSS2DObject(h2l); h2o.position.set(-1.9, 1.9, 0); scene.add(h2o);
    var o2o = new T.CSS2DObject(o2l); o2o.position.set(1.9, 1.9, 0); scene.add(o2o);

    // burbujas
    bubbleMesh = new T.InstancedMesh(new T.SphereGeometry(0.06, 10, 10), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85, depthWrite: false }), MAXB);
    bubbleMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); bubbleMesh.renderOrder = 3; scene.add(bubbleMesh);
    for (var i = 0; i < MAXB; i++) {
      bubbles.push({ active: false, type: 'H2', speed: 0.02, wobble: Math.random() * 6.28, pos: new T.Vector3(), scale: 1 });
      bubbleMesh.setColorAt(i, colorH2);
      dummy.position.set(0, -10, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); bubbleMesh.setMatrixAt(i, dummy.matrix);
    }
    bubbleMesh.instanceColor.setUsage(T.DynamicDrawUsage);

    // iones
    function ions(color, n) {
      var m = new T.InstancedMesh(new T.SphereGeometry(0.055, 8, 8), new T.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }), n);
      m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.renderOrder = 3; scene.add(m);
      var arr = [];
      for (var i = 0; i < n; i++) arr.push({ x: (Math.random() - 0.5) * 4.4, y: -2.1 + Math.random() * 3.6, z: (Math.random() - 0.5) * 3.2, ph: Math.random() * 6.28 });
      return { mesh: m, arr: arr };
    }
    var c = ions(0xe3b341, 46), a = ions(0x39c5bb, 46);
    ionC = c.mesh; ionsC = c.arr; ionA = a.mesh; ionsA = a.arr;
  }

  function spawnBubble(type) {
    var b = null, idx = -1;
    for (var i = 0; i < bubbles.length; i++) if (!bubbles[i].active) { b = bubbles[i]; idx = i; break; }
    if (!b) return;
    b.active = true; b.type = type;
    var ox = type === 'H2' ? -1 : 1;
    var ang = Math.random() * 6.283, rad = 0.16 + Math.random() * 0.1;
    b.pos.set(ox + Math.cos(ang) * rad, -2.0 + Math.random() * 0.8, Math.sin(ang) * rad);
    b.scale = type === 'O2' ? 1.35 : 1; b.speed = 0.018 + Math.random() * 0.02;
    bubbleMesh.setColorAt(idx, type === 'O2' ? colorO2 : colorH2); bubbleMesh.instanceColor.needsUpdate = true;
  }
  function clearBubbles() {
    for (var i = 0; i < bubbles.length; i++) { bubbles[i].active = false; dummy.position.set(0, -10, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); bubbleMesh.setMatrixAt(i, dummy.matrix); }
    bubbleMesh.instanceMatrix.needsUpdate = true;
  }

  function sceneFrame(dt, f) {
    var I = P.I, glow = clamp(I / 3.2, 0, 1), now = performance.now() / 1000;
    cathodeMat.emissiveIntensity = glow; anodeMat.emissiveIntensity = glow; posTermMat.emissiveIntensity = glow; negTermMat.emissiveIntensity = glow;
    // tinte del agua e indicador de pH
    var m = medium(), usePh = kit.layer('ph');
    waterMat.color.set(usePh ? m.bulk : '#3882b6'); waterMat.opacity = usePh ? 0.5 : 0.38;
    haloC.material.color.set(m.catHalo); haloA.material.color.set(m.anHalo);
    haloC.material.opacity = usePh ? clamp(glow * 0.75, 0, 0.7) : 0; haloA.material.opacity = usePh ? clamp(glow * 0.75, 0, 0.7) : 0;
    haloC.visible = haloA.visible = usePh && glow > 0.01;

    // burbujas
    if (I > 0 && kit.layer('bubbles')) {
      spawnCounter += I * dt * 22;
      while (spawnCounter >= 1) { spawnBubble('H2'); spawnBubble('H2'); spawnBubble('O2'); spawnCounter -= 1; }
    } else spawnCounter = 0;
    var dirty = false;
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i]; if (!b.active) continue;
      b.pos.y += b.speed * (dt * 60); b.wobble += 0.08; b.pos.x += Math.sin(b.wobble) * 0.002;
      if (b.pos.y >= 1.75) { b.active = false; dummy.position.set(0, -10, 0); dummy.scale.setScalar(0); }
      else { dummy.position.copy(b.pos); dummy.scale.setScalar(b.scale); }
      dummy.updateMatrix(); bubbleMesh.setMatrixAt(i, dummy.matrix); dirty = true;
    }
    if (dirty) bubbleMesh.instanceMatrix.needsUpdate = true;
    bubbleMesh.visible = kit.layer('bubbles');

    // iones
    var showIons = kit.layer('ions'); ionC.visible = ionA.visible = showIons;
    if (showIons) {
      var v = 0.12 + I * 0.55;
      for (var k = 0; k < ionsC.length; k++) {
        var p = ionsC[k], q = ionsA[k];
        // cationes → cátodo (x=-1), aniones → ánodo (x=+1)
        var dx = -1 - p.x; p.x += Math.sign(dx) * v * dt * (I > 0 ? 1 : 0) + Math.sin(now * 2 + p.ph) * 0.004;
        p.y += Math.sin(now * 1.3 + p.ph * 2) * 0.004; p.z += Math.cos(now * 1.1 + p.ph) * 0.004;
        if (Math.abs(p.x + 1) < 0.2 && I > 0) { p.x = 0.5 + Math.random() * 1.6; p.y = -2.1 + Math.random() * 3.6; p.z = (Math.random() - 0.5) * 3; }
        var dx2 = 1 - q.x; q.x += Math.sign(dx2) * v * dt * (I > 0 ? 1 : 0) + Math.sin(now * 2 + q.ph) * 0.004;
        q.y += Math.sin(now * 1.4 + q.ph * 2) * 0.004; q.z += Math.cos(now * 1.2 + q.ph) * 0.004;
        if (Math.abs(q.x - 1) < 0.2 && I > 0) { q.x = -2.1 + Math.random() * 1.6; q.y = -2.1 + Math.random() * 3.6; q.z = (Math.random() - 0.5) * 3; }
        p.y = clamp(p.y, -2.2, 1.6); q.y = clamp(q.y, -2.2, 1.6); p.x = clamp(p.x, -2.25, 2.25); q.x = clamp(q.x, -2.25, 2.25);
        dummy.position.set(p.x, p.y, p.z); dummy.scale.setScalar(1); dummy.updateMatrix(); ionC.setMatrixAt(k, dummy.matrix);
        dummy.position.set(q.x, q.y, q.z); dummy.updateMatrix(); ionA.setMatrixAt(k, dummy.matrix);
      }
      ionC.instanceMatrix.needsUpdate = true; ionA.instanceMatrix.needsUpdate = true;
    }

    // electrones en los cables
    var showE = kit.layer('electrons') && I > 0.005, sp = 0.12 + I * 0.14;
    posParticles.concat(negParticles).forEach(function (p) {
      p.mesh.visible = showE;
      if (showE) { p.t = (p.t + p.dir * dt * sp + 1) % 1; p.mesh.position.copy(p.curve.getPointAt(p.t)); }
    });

    batteryLabelDiv.textContent = "SOURCE · " + fmt(P.V, 1) + ' V';
    if (camGoal) {
      camera.position.lerp(camGoal.pos, 0.08); controls.target.lerp(camGoal.target, 0.08);
      if (camera.position.distanceTo(camGoal.pos) < 0.03) camGoal = null;
    }
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  function resize() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h;
    var off = w > 900 ? Math.min(170, w * 0.14) : 0;   // desplaza la escena a la derecha de los recuadros flotantes
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }

  var VIEWS = {
    libre: null,
    frontal: { pos: new T.Vector3(0, 1.4, 13.5), target: new T.Vector3(0, -0.7, 1.4) },
    electrodos: { pos: new T.Vector3(0, 0.2, 6.2), target: new T.Vector3(0, -0.3, 0) },
    superior: { pos: new T.Vector3(0, 14, 2.2), target: new T.Vector3(0, -0.5, 0.6) },
    fuente: { pos: new T.Vector3(0, 0.5, 11), target: new T.Vector3(0, -1.2, 3.2) }
  };

  /* ------------------------- Física por fotograma ------------------------- */
  function physics(dt) {
    P.I = currentAt(P.V);
    if (P.I > 0) {
      var dq = P.I * dt * P.accel;
      P.Q += dq; P.nH2 += dq / (2 * F); P.nO2 += dq / (4 * F); P.tsim += dt * P.accel;
    }
    var vh = P.nH2 * VM * 1000;
    if (vh >= CAP) { resetGas(true); }
    var now = performance.now();
    if (P.I > 0 && now - P.lastHist > 250) {
      P.lastHist = now; P.hist.push([P.tsim, P.nH2 * VM * 1000, P.nO2 * VM * 1000]);
      if (P.hist.length > 400) P.hist.shift();
    }
  }
  function resetGas(full) {
    P.Q = 0; P.nH2 = 0; P.nO2 = 0; P.tsim = 0; P.hist = [];
    if (full && kit) kit.toast("Tubes full: they were emptied to keep measuring");
  }
  function fmtTime(s) { s = Math.round(s); var m = Math.floor(s / 60); return m + ' min ' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' s'; }

  /* ------------------------- Probetas (HUD del panel) ------------------------- */
  function drawTubes(ctx, w, h, c) {
    var tubes = [{ x: w * 0.27, label: 'H₂', v: P.nH2 * VM * 1000, col: '#9fd3ff', fill: 'rgba(120,190,255,0.55)', cl: "Cathode (−)" },
                 { x: w * 0.73, label: 'O₂', v: P.nO2 * VM * 1000, col: '#ff9a8e', fill: 'rgba(255,140,125,0.55)', cl: "Anode (+)" }];
    var top = 22, bot = h - 34, tw = Math.min(54, w * 0.2);
    ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
    tubes.forEach(function (t) {
      var x0 = t.x - tw / 2, hh = bot - top;
      // agua dentro del tubo
      ctx.fillStyle = 'rgba(56,130,182,0.28)'; ctx.fillRect(x0, top, tw, hh);
      // gas acumulado (desde arriba)
      var gh = clamp(t.v / CAP, 0, 1) * hh;
      ctx.fillStyle = t.fill; ctx.fillRect(x0, top, tw, gh);
      ctx.strokeStyle = t.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, top + gh); ctx.lineTo(x0 + tw, top + gh); ctx.stroke();
      // vidrio
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x0, top); ctx.lineTo(x0, bot); ctx.lineTo(x0 + tw, bot); ctx.lineTo(x0 + tw, top); ctx.stroke();
      // graduación
      ctx.fillStyle = c.muted; ctx.strokeStyle = c.line; ctx.lineWidth = 1; ctx.textAlign = 'left'; ctx.font = '10px system-ui, sans-serif';
      for (var m = 0; m <= CAP; m += 10) {
        var y = top + (m / CAP) * hh;
        ctx.beginPath(); ctx.moveTo(x0 + tw, y); ctx.lineTo(x0 + tw - (m % 20 === 0 ? 9 : 5), y); ctx.stroke();
        if (m % 20 === 0) ctx.fillText(String(m), x0 + tw + 4, y + 3);
      }
      ctx.textAlign = 'center'; ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = c.ink;
      ctx.fillText(t.label + ' · ' + fmt(t.v, 1) + ' mL', t.x, bot + 16);
      ctx.font = '10.5px system-ui, sans-serif'; ctx.fillStyle = c.muted; ctx.fillText(t.cl, t.x, bot + 29);
    });
    ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.font = '11px system-ui, sans-serif';
    ctx.fillText("mL at 25 °C and 1 atm · volume is measured from the top", w / 2, 12);
  }

  /* ------------------------- Gráficos ------------------------- */
  function axes(ctx, w, h, c, o) {
    var L = 42, R = 10, Tp = 14, B = 34, pw = w - L - R, ph = h - Tp - B;
    ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.lineWidth = 1; ctx.font = '10.5px system-ui, sans-serif';
    ctx.textAlign = 'right';
    for (var i = 0; i <= o.ny; i++) {
      var y = Tp + ph - (i / o.ny) * ph; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke();
      ctx.fillText(fmt(o.ymin + (o.ymax - o.ymin) * i / o.ny, o.yd == null ? 1 : o.yd), L - 5, y + 3);
    }
    ctx.textAlign = 'center';
    for (var j = 0; j <= o.nx; j++) {
      var x = L + (j / o.nx) * pw; ctx.beginPath(); ctx.moveTo(x, Tp + ph); ctx.lineTo(x, Tp + ph + 4); ctx.stroke();
      ctx.fillText(fmt(o.xmin + (o.xmax - o.xmin) * j / o.nx, o.xd == null ? 0 : o.xd), x, Tp + ph + 15);
    }
    ctx.fillStyle = c.ink; ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(o.xl, L + pw / 2, h - 5);
    ctx.save(); ctx.translate(11, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.yl, 0, 0); ctx.restore();
    return { L: L, T: Tp, pw: pw, ph: ph, X: function (v) { return L + (v - o.xmin) / (o.xmax - o.xmin) * pw; }, Y: function (v) { return Tp + ph - (v - o.ymin) / (o.ymax - o.ymin) * ph; } };
  }
  var VMAX = 12;
  function drawIV(ctx, w, h, c) {
    var imax = Math.max(1, Math.ceil(currentAt(VMAX) * 1.05));
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: VMAX, ymin: 0, ymax: imax, nx: 6, ny: 4, xl: "Applied voltage (V)", yl: "Current (A)", yd: 1 });
    // zona sin reacción
    ctx.fillStyle = 'rgba(255,176,32,0.10)'; ctx.fillRect(g.X(0), g.T, g.X(eDec()) - g.X(0), g.ph);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = c.warn; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(g.X(E_TEO), g.T); ctx.lineTo(g.X(E_TEO), g.T + g.ph); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.beginPath(); ctx.moveTo(g.X(eDec()), g.T); ctx.lineTo(g.X(eDec()), g.T + g.ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.warn; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('E° = 1,23 V', g.X(E_TEO) - 3, g.T + 10);
    ctx.fillStyle = c.accent; ctx.textAlign = 'left'; ctx.fillText('E° + η = ' + fmt(eDec(), 2) + ' V', g.X(eDec()) + 3, g.T + 22);
    ctx.strokeStyle = c.a; ctx.lineWidth = 2.4; ctx.beginPath();
    for (var v = 0; v <= VMAX + 0.01; v += 0.1) { var x = g.X(v), y = g.Y(currentAt(v)); v === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    var px = g.X(P.V), py = g.Y(P.I);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c.ink; ctx.textAlign = px > w * 0.7 ? 'right' : 'left'; ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(fmt(P.V, 1) + ' V · ' + fmt(P.I, 2) + ' A', px + (px > w * 0.7 ? -10 : 10), Math.max(py - 8, g.T + 34));
  }
  function drawVT(ctx, w, h, c) {
    var hist = P.hist, tmax = Math.max(60, hist.length ? hist[hist.length - 1][0] : 0), vmax = Math.max(10, hist.length ? hist[hist.length - 1][1] * 1.1 : 0);
    var g = axes(ctx, w, h, c, { xmin: 0, xmax: tmax, ymin: 0, ymax: vmax, nx: 4, ny: 4, xl: "Simulated time (s)", yl: "Volume (mL)", yd: 0 });
    function line(idx, col) {
      if (hist.length < 2) return;
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
      hist.forEach(function (p, i) { var x = g.X(p[0]), y = g.Y(p[idx]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    }
    line(1, '#6cc3ff'); line(2, '#ff8f84');
    if (hist.length < 2) { ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.font = '12px system-ui, sans-serif'; ctx.fillText("Apply a voltage greater than " + fmt(eDec(), 2) + " V to see gas production", w / 2, h / 2); }
    ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillStyle = '#6cc3ff'; ctx.fillText('● H₂', g.L + 8, g.T + 14); ctx.fillStyle = '#ff8f84'; ctx.fillText('● O₂', g.L + 56, g.T + 14);
  }

  /* ------------------------- Escala molecular ------------------------- */
  var mol = { waters: [], ions: [], bubbles: [], electrons: [], aCount: 0, cCount: 0, cReady: 0, w: 300, h: 260, acc: 0, accC: 0 };
  function molReset() { mol.waters = []; mol.ions = []; mol.bubbles = []; mol.electrons = []; mol.aCount = 0; mol.cCount = 0; mol.cReady = 0; mol.acc = 0; mol.accC = 0; }
  function molInit(w, h) {
    mol.w = w; mol.h = h;
    while (mol.waters.length < 10) mol.waters.push({ x: w * (0.2 + Math.random() * 0.6), y: h * (0.15 + Math.random() * 0.7), vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, a: Math.random() * 6.28 });
    var m = P.medium, spect = 5;
    if (mol.ions.filter(function (i) { return i.kind === 'spec+'; }).length === 0) {
      for (var i = 0; i < spect; i++) {
        mol.ions.push({ kind: 'spec+', x: w * (0.2 + Math.random() * 0.6), y: h * (0.12 + Math.random() * 0.76), vx: 0, vy: 0 });
        mol.ions.push({ kind: 'spec-', x: w * (0.2 + Math.random() * 0.6), y: h * (0.12 + Math.random() * 0.76), vx: 0, vy: 0 });
      }
    }
    if (m === 'base' && mol.ions.filter(function (i) { return i.kind === 'OH'; }).length < 3) for (var k = 0; k < 3; k++) mol.ions.push({ kind: 'OH', x: w * (0.4 + Math.random() * 0.4), y: h * (0.2 + Math.random() * 0.6), vx: 0, vy: 0 });
    if (m === 'acid' && mol.ions.filter(function (i) { return i.kind === 'H'; }).length < 3) for (var k2 = 0; k2 < 3; k2++) mol.ions.push({ kind: 'H', x: w * (0.3 + Math.random() * 0.4), y: h * (0.2 + Math.random() * 0.6), vx: 0, vy: 0 });
  }
  function nearestWater(x) {
    var best = -1, d = 1e9;
    mol.waters.forEach(function (wm, i) { var dd = Math.abs(wm.x - x); if (dd < d) { d = dd; best = i; } });
    return best;
  }
  function molStep(dt) {
    var w = mol.w, h = mol.h, act = clamp(P.I / 2.5, 0, 1), m = P.medium;
    mol.waters.forEach(function (q) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.a += dt * 0.6;
      if (q.x < w * 0.17 || q.x > w * 0.83) q.vx *= -1; if (q.y < h * 0.08 || q.y > h * 0.92) q.vy *= -1;
      q.x = clamp(q.x, w * 0.17, w * 0.83); q.y = clamp(q.y, h * 0.08, h * 0.92);
    });
    while (mol.waters.length < 10) mol.waters.push({ x: w * (0.3 + Math.random() * 0.4), y: h * (0.15 + Math.random() * 0.7), vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, a: 0 });
    // espectadores
    mol.ions.forEach(function (i) {
      var drift = act * 26;
      if (i.kind === 'spec+') { i.vx = -drift + (Math.random() - 0.5) * 8; }
      else if (i.kind === 'spec-') { i.vx = drift + (Math.random() - 0.5) * 8; }
    });
    if (act > 0.02) {
      mol.acc += dt * (0.5 + act * 3.2);
      mol.accC += dt * (0.5 + act * 3.2);
      // ---- ánodo ----
      if (m === 'acid' || m === 'neutral') {
        if (mol.acc >= 1 && mol.waters.length > 3) {
          mol.acc = 0;
          var wi = nearestWater(w * 0.86), wm = mol.waters.splice(wi, 1)[0];
          mol.ions.push({ kind: 'H', x: wm.x, y: wm.y, vx: -22 - Math.random() * 10, vy: (Math.random() - 0.5) * 6 });
          mol.electrons.push({ t: 0, dir: 1 });
          mol.aCount++;
          if (mol.aCount % 4 === 0) mol.bubbles.push({ x: w * 0.9, y: h * 0.5, type: 'O2', life: 1 });
        }
      } else { // básico: OH⁻ que llega al ánodo cede e⁻
        mol.ions.forEach(function (i) {
          if (i.kind === 'OH' && i.x > w * 0.82) {
            i.dead = true; mol.electrons.push({ t: 0, dir: 1 }); mol.aCount++;
            if (mol.aCount % 4 === 0) { mol.bubbles.push({ x: w * 0.9, y: h * 0.5, type: 'O2', life: 1 }); }
            if (mol.aCount % 2 === 0) mol.waters.push({ x: w * 0.78, y: h * (0.2 + Math.random() * 0.6), vx: -10, vy: 0, a: 0 });
          }
        });
      }
    }
    // electrones en el cable: t de 0 (ánodo) a 1 (cátodo)
    mol.electrons.forEach(function (e) { e.t += dt * (0.6 + act * 1.6); });
    mol.electrons = mol.electrons.filter(function (e) {
      if (e.t >= 1) {
        if (m === 'acid') mol.cReady++;
        else { // agua + e⁻ → OH⁻ (+ ½ H₂)
          if (mol.waters.length > 3) { var wi2 = nearestWater(w * 0.14); var wm2 = mol.waters.splice(wi2, 1)[0]; mol.ions.push({ kind: 'OH', x: wm2.x, y: wm2.y, vx: 22 + Math.random() * 10, vy: (Math.random() - 0.5) * 6 }); }
          mol.cCount++; if (mol.cCount % 2 === 0) mol.bubbles.push({ x: w * 0.1, y: h * 0.5, type: 'H2', life: 1 });
        }
        return false;
      }
      return true;
    });
    // iones móviles
    mol.ions.forEach(function (i) {
      i.x += i.vx * dt; i.y += (i.vy || 0) * dt;
      if (i.kind === 'H') {
        if (i.vx === 0 || i.vx > -5) i.vx = -16;
        if (i.x < w * 0.17) {
          if (m === 'acid' && mol.cReady > 0) { mol.cReady--; i.dead = true; mol.cCount++; if (mol.cCount % 2 === 0) mol.bubbles.push({ x: w * 0.1, y: h * 0.5, type: 'H2', life: 1 }); }
          else if (m === 'acid') i.x = w * 0.17;
          else i.x = w * 0.17;
        }
      } else if (i.kind === 'OH') {
        if (m === 'base' && i.vx < 6) i.vx = 16;
        if (i.vx === 0 || i.vx < 5) i.vx = 16;
      } else {
        if (i.x < w * 0.17) i.x = w * 0.17; if (i.x > w * 0.83) i.x = w * 0.83;
        i.y = clamp(i.y, h * 0.08, h * 0.92);
      }
    });
    // neutralización H⁺ + OH⁻ → H₂O
    var Hs = mol.ions.filter(function (i) { return i.kind === 'H' && !i.dead; }), Os = mol.ions.filter(function (i) { return i.kind === 'OH' && !i.dead; });
    Hs.forEach(function (a) { Os.forEach(function (b) { if (!a.dead && !b.dead && Math.abs(a.x - b.x) < 12 && Math.abs(a.y - b.y) < 12) { a.dead = b.dead = true; mol.waters.push({ x: a.x, y: a.y, vx: 0, vy: 0, a: 0 }); } }); });
    mol.ions = mol.ions.filter(function (i) { return !i.dead && i.x > w * 0.1 && i.x < w * 0.92; });
    mol.bubbles.forEach(function (b) { b.y -= 24 * dt; b.life -= dt * 0.5; });
    mol.bubbles = mol.bubbles.filter(function (b) { return b.life > 0 && b.y > -10; });
    while (mol.ions.filter(function (i) { return i.kind === 'spec+'; }).length < 5) mol.ions.push({ kind: 'spec+', x: w * (0.4 + Math.random() * 0.4), y: h * (0.12 + Math.random() * 0.76), vx: 0, vy: 0 });
    while (mol.ions.filter(function (i) { return i.kind === 'spec-'; }).length < 5) mol.ions.push({ kind: 'spec-', x: w * (0.2 + Math.random() * 0.4), y: h * (0.12 + Math.random() * 0.76), vx: 0, vy: 0 });
    if (m === 'base') { var nOH = mol.ions.filter(function (i) { return i.kind === 'OH'; }).length; if (nOH < 3) mol.ions.push({ kind: 'OH', x: w * 0.25, y: h * (0.2 + Math.random() * 0.6), vx: 16, vy: 0 }); }
  }
  function molDraw(ctx, w, h, c) {
    if (Math.abs(mol.w - w) > 1) { mol.w = w; mol.h = h; }
    molInit(w, h);
    var md = medium();
    // fondo y electrodos
    ctx.fillStyle = c.dark ? 'rgba(10,22,34,0.8)' : 'rgba(210,225,240,0.6)'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(88,166,255,0.18)'; ctx.fillRect(0, 0, w * 0.14, h); ctx.fillStyle = '#58a6ff'; ctx.fillRect(w * 0.09, 0, w * 0.05, h);
    ctx.fillStyle = 'rgba(248,81,73,0.18)'; ctx.fillRect(w * 0.86, 0, w * 0.14, h); ctx.fillStyle = '#f85149'; ctx.fillRect(w * 0.86, 0, w * 0.05, h);
    // cable
    ctx.strokeStyle = c.muted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * 0.885, 8); ctx.quadraticCurveTo(w * 0.5, -10, w * 0.115, 8); ctx.stroke(); ctx.setLineDash([]);
    mol.waters.forEach(function (q) {
      ctx.save(); ctx.translate(q.x, q.y);
      var x1 = Math.cos(q.a) * 9, y1 = Math.sin(q.a) * 9, x2 = Math.cos(q.a + 1.9) * 9, y2 = Math.sin(q.a + 1.9) * 9;
      ctx.strokeStyle = 'rgba(180,190,200,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x1, y1); ctx.moveTo(0, 0); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = '#f85149'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = c.dark ? '#e6edf3' : '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(x1, y1, 3.2, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x2, y2, 3.2, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    mol.ions.forEach(function (i) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (i.kind === 'H') { ctx.fillStyle = '#e3b341'; ctx.beginPath(); ctx.arc(i.x, i.y, 5, 0, 6.283); ctx.fill(); ctx.fillStyle = '#10151c'; ctx.font = '8px sans-serif'; ctx.fillText('H⁺', i.x, i.y + 0.5); }
      else if (i.kind === 'OH') { ctx.fillStyle = '#7e9bff'; ctx.beginPath(); ctx.arc(i.x, i.y, 6.2, 0, 6.283); ctx.fill(); ctx.fillStyle = '#0b1020'; ctx.font = '7.5px sans-serif'; ctx.fillText('OH⁻', i.x, i.y + 0.5); }
      else if (i.kind === 'spec+') { ctx.fillStyle = 'rgba(190,150,255,0.85)'; ctx.beginPath(); ctx.arc(i.x, i.y, 5.2, 0, 6.283); ctx.fill(); ctx.fillStyle = '#12091f'; ctx.font = '7px sans-serif'; ctx.fillText(P.medium === 'acid' ? '' : 'Na⁺', i.x, i.y + 0.5); if (P.medium === 'acid') { ctx.fillStyle = '#e3b341'; ctx.beginPath(); ctx.arc(i.x, i.y, 5.2, 0, 6.283); ctx.fill(); ctx.fillStyle = '#10151c'; ctx.font = '8px sans-serif'; ctx.fillText('H⁺', i.x, i.y + 0.5); } }
      else if (i.kind === 'spec-') {
        var lbl = P.medium === 'base' ? 'OH⁻' : 'SO₄²⁻'; ctx.fillStyle = P.medium === 'base' ? '#7e9bff' : 'rgba(57,197,187,0.9)';
        ctx.beginPath(); ctx.arc(i.x, i.y, P.medium === 'base' ? 6.2 : 7.4, 0, 6.283); ctx.fill(); ctx.fillStyle = '#05181a'; ctx.font = '7px sans-serif'; ctx.fillText(lbl, i.x, i.y + 0.5);
      }
    });
    mol.electrons.forEach(function (e) {
      var x = w * 0.885 + (w * 0.115 - w * 0.885) * e.t, y = 8 - 18 * Math.sin(Math.PI * e.t);
      ctx.fillStyle = '#ffe066'; ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
    });
    mol.bubbles.forEach(function (b) {
      ctx.globalAlpha = clamp(b.life, 0, 1);
      if (b.type === 'O2') { ctx.fillStyle = '#f85149'; ctx.beginPath(); ctx.arc(b.x - 4.5, b.y, 5.2, 0, 6.283); ctx.arc(b.x + 4.5, b.y, 5.2, 0, 6.283); ctx.fill(); }
      else { ctx.fillStyle = c.dark ? '#e6edf3' : '#6a7685'; ctx.beginPath(); ctx.arc(b.x - 3.6, b.y, 3.6, 0, 6.283); ctx.arc(b.x + 3.6, b.y, 3.6, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
    });
    ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Cathode (−)", 4, h - 8); ctx.textAlign = 'right'; ctx.fillText("Anode (+)", w - 4, h - 8);
    ctx.textAlign = 'center'; ctx.fillText("e⁻ through the external circuit: anode → cathode", w / 2, 26);
    if (P.I <= 0) { ctx.fillStyle = c.warn; ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText("No current: raise the voltage above " + fmt(eDec(), 2) + ' V', w / 2, h / 2 + 70); }
  }

  /* ------------------------- Predictor de productos ------------------------- */
  // E° de reducción (V) a 25 °C; para el agua se usa el valor según el pH de la disolución.
  var ELECTROLYTES = [
    { id: 'nacl', f: "Concentrated NaCl(aq)", cation: 'Na⁺', anion: 'Cl⁻', ph: 'neutral', active: null,
      cands: [{ r: 'Na⁺ + e⁻ → Na', E: -2.71, key: 'Na' }], cprod: "H₂(g) and OH⁻(aq)", crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻',
      anodes: [{ r: '2 Cl⁻ → Cl₂ + 2 e⁻', E: 1.36, key: 'Cl2', prod: 'Cl₂(g)' }], kinetic: 'Cl₂',
      note: "Thermodynamically water would be oxidized first (0.82 V < 1.36 V), but O₂ has a high overpotential and in concentrated NaCl Cl₂ is obtained: it is the chlor-alkali process (NaOH is also formed)." },
    { id: 'na2so4', f: "Na₂SO₄(aq)", cation: 'Na⁺', anion: 'SO₄²⁻', ph: 'neutral', active: null,
      cands: [{ r: 'Na⁺ + e⁻ → Na', E: -2.71, key: 'Na' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: "H₂(g) and OH⁻(aq)",
      anodes: [{ r: 'SO₄²⁻ → S₂O₈²⁻ + 2 e⁻', E: 2.01, key: 'SO4', prod: 'S₂O₈²⁻' }],
      note: "Neither Na⁺ nor SO₄²⁻ reacts: in practice water is electrolyzed. Near the cathode the pH rises and near the anode it falls." },
    { id: 'h2so4', f: "Dilute H₂SO₄(aq)", cation: 'H⁺', anion: 'SO₄²⁻', ph: 'acid', active: null,
      cands: [], crx: '2 H⁺ + 2 e⁻ → H₂', cprod: 'H₂(g)', cE: 0.00,
      anodes: [{ r: 'SO₄²⁻ → S₂O₈²⁻ + 2 e⁻', E: 2.01, key: 'SO4', prod: 'S₂O₈²⁻' }],
      note: "It is the electrolysis of water in acidic medium (Hofmann voltameter)." },
    { id: 'naoh', f: "NaOH(aq)", cation: 'Na⁺', anion: 'OH⁻', ph: 'base', active: null,
      cands: [{ r: 'Na⁺ + e⁻ → Na', E: -2.71, key: 'Na' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: 'H₂(g)', cE: -0.83,
      anodes: [], aOH: true,
      note: "Electrolysis of water in basic medium: OH⁻ is oxidized to O₂ at the anode." },
    { id: 'cuso4', f: "CuSO₄(aq)", cation: 'Cu²⁺', anion: 'SO₄²⁻', ph: 'neutral', active: { metal: 'Cu', E: 0.34, rx: "Cu → Cu²⁺ + 2 e⁻" },
      cands: [{ r: 'Cu²⁺ + 2 e⁻ → Cu', E: 0.34, key: 'Cu', prod: 'Cu(s)' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: 'H₂(g)',
      anodes: [{ r: 'SO₄²⁻ → S₂O₈²⁻ + 2 e⁻', E: 2.01, key: 'SO4', prod: 'S₂O₈²⁻' }],
      note: "Cu²⁺ is reduced more easily than water. With a copper anode (electrolytic refining) the anode dissolves and pure copper is deposited on the cathode." },
    { id: 'cucl2', f: "CuCl₂(aq)", cation: 'Cu²⁺', anion: 'Cl⁻', ph: 'neutral', active: { metal: 'Cu', E: 0.34, rx: "Cu → Cu²⁺ + 2 e⁻" },
      cands: [{ r: 'Cu²⁺ + 2 e⁻ → Cu', E: 0.34, key: 'Cu', prod: 'Cu(s)' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: 'H₂(g)',
      anodes: [{ r: '2 Cl⁻ → Cl₂ + 2 e⁻', E: 1.36, key: 'Cl2', prod: 'Cl₂(g)' }], kinetic: 'Cl₂',
      note: "Cathode: copper is deposited. Inert anode: Cl₂ is released (the overpotential of O₂ favors chlorine)." },
    { id: 'agno3', f: "AgNO₃(aq)", cation: 'Ag⁺', anion: 'NO₃⁻', ph: 'neutral', active: { metal: 'Ag', E: 0.80, rx: 'Ag → Ag⁺ + e⁻' },
      cands: [{ r: 'Ag⁺ + e⁻ → Ag', E: 0.80, key: 'Ag', prod: 'Ag(s)' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: 'H₂(g)',
      anodes: [{ r: "NO₃⁻ (not oxidized in water)", E: 99, key: 'NO3', prod: '—' }],
      note: "Basis of electrolytic silver and silver plating: silver is deposited on the cathode." },
    { id: 'ki', f: "KI(aq)", cation: 'K⁺', anion: 'I⁻', ph: 'neutral', active: null,
      cands: [{ r: 'K⁺ + e⁻ → K', E: -2.93, key: 'K' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: "H₂(g) and OH⁻(aq)",
      anodes: [{ r: '2 I⁻ → I₂ + 2 e⁻', E: 0.54, key: 'I2', prod: "I₂(aq)" }],
      note: "Iodide is oxidized more easily than water (0.54 V < 0.82 V). With phenolphthalein the cathode turns pink (OH⁻) and with starch the anode turns blue-black (I₂)." },
    { id: 'kbr', f: "KBr(aq)", cation: 'K⁺', anion: 'Br⁻', ph: 'neutral', active: null,
      cands: [{ r: 'K⁺ + e⁻ → K', E: -2.93, key: 'K' }], crx: '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', cprod: "H₂(g) and OH⁻(aq)",
      anodes: [{ r: '2 Br⁻ → Br₂ + 2 e⁻', E: 1.07, key: 'Br2', prod: "Br₂(aq)" }], kinetic: 'Br₂',
      note: "As in the case of chloride, the overpotential of O₂ makes bromide oxidize and Br₂ form (brown color)." },
    { id: 'nacl-f', f: "Molten NaCl (no water)", cation: 'Na⁺', anion: 'Cl⁻', ph: null, active: null, molten: true,
      cands: [{ r: 'Na⁺ + e⁻ → Na', E: -2.71, key: 'Na', prod: 'Na(l)' }], anodes: [{ r: '2 Cl⁻ → Cl₂ + 2 e⁻', E: 1.36, key: 'Cl2', prod: 'Cl₂(g)' }],
      note: "Without water there is no competition: metallic sodium and chlorine are obtained (Downs cell, ≈ 600 °C). In aqueous solution sodium is never produced." }
  ];
  var pred = { id: 'nacl', active: false };
  function waterE(ph) { return ph === 'acid' ? { c: 0.00, a: 1.23 } : ph === 'base' ? { c: -0.83, a: 0.40 } : { c: -0.41, a: 0.82 }; }
  function predict(e, activeAnode) {
    var out = { cathode: [], anode: [], cWin: null, aWin: null, notes: [] };
    if (e.molten) {
      out.cathode = e.cands.map(function (c) { return { r: c.r, E: c.E, win: true }; });
      out.anode = e.anodes.map(function (a) { return { r: a.r, E: a.E, win: true }; });
      out.cProd = 'Na(l)'; out.aProd = 'Cl₂(g)';
      return out;
    }
    var we = waterE(e.ph), list = [];
    e.cands.forEach(function (c) { list.push({ r: c.r, E: c.E, prod: c.prod }); });
    list.push({ r: e.crx, E: e.cE != null ? e.cE : we.c, prod: e.cprod, water: true });
    list.sort(function (a, b) { return b.E - a.E; });
    list.forEach(function (x, i) { x.win = i === 0; });
    out.cathode = list; out.cProd = list[0].prod;
    // ánodo
    var al = [];
    if (activeAnode && e.active) al.push({ r: e.active.rx, E: e.active.E, prod: e.active.metal === 'Ag' ? "Ag⁺(aq)" : "Cu²⁺(aq)", active: true });
    e.anodes.forEach(function (a) { if (a.E < 90) al.push({ r: a.r, E: a.E, prod: a.prod }); });
    var oxy = e.aOH ? { r: '4 OH⁻ → O₂ + 2 H₂O + 4 e⁻', E: we.a, prod: 'O₂(g)', water: true } : { r: '2 H₂O → O₂ + 4 H⁺ + 4 e⁻', E: we.a, prod: "O₂(g) and H⁺(aq)", water: true };
    al.push(oxy);
    al.sort(function (a, b) { return a.E - b.E; });
    al.forEach(function (x, i) { x.win = i === 0; });
    // corrección cinética (sobrepotencial del O₂)
    if (e.kinetic && !(activeAnode && e.active)) {
      var tw = al.filter(function (x) { return x.water; })[0], kn = al.filter(function (x) { return !x.water; })[0];
      if (tw && kn && tw.win) { tw.win = false; kn.win = true; kn.kinetic = true; out.notes.push("overpotential"); }
    }
    out.anode = al; out.aProd = al.filter(function (x) { return x.win; })[0].prod;
    return out;
  }

  var QUIZ = [
    { q: "In an electrolytic cell, to which pole of the source is the cathode connected?", options: ["To the negative (−) pole", "To the positive (+) pole", "To either: it makes no difference", "To ground"], answer: 0, why: "In an electrolytic cell the cathode (where reduction occurs) is connected to the (−) pole of the source, which supplies it with electrons." },
    { q: "In the electrolysis of water, what volume ratio is obtained at equal temperature and pressure?", options: ['V(H₂) : V(O₂) = 2 : 1', 'V(H₂) : V(O₂) = 1 : 2', 'V(H₂) : V(O₂) = 1 : 1', 'V(H₂) : V(O₂) = 4 : 1'], answer: 0, why: "2 H₂O → 2 H₂ + O₂: for every mole of O₂, 2 mol of H₂ form, and gas volumes are proportional to moles." },
    { q: "With 6 V applied and a real decomposition voltage of 1.68 V, why is 1.23 V not enough?", options: ["The overpotential of the electrodes must be overcome", "Pure water does not have enough mass", "H₂ is denser than O₂", "Direct current does not work with 1.23 V"], answer: 0, why: "E° gives the thermodynamic minimum; the kinetics of the half-reactions at the electrode surface demands an extra voltage (overpotential)." },
    { q: "A current of 0.50 A flows for 10 min through the cell. How many mL of H₂ are collected at 25 °C and 1 atm? (F = 96,485 C/mol; molar volume = 24.465 L/mol)", options: ['≈ 38 mL', '≈ 76 mL', '≈ 19 mL', '≈ 380 mL'], answer: 0, why: "Q = 0.50 A · 600 s = 300 C; n(H₂) = Q/(2F) = 1.55·10⁻³ mol; V = 1.55·10⁻³ mol · 24.465 L/mol ≈ 0.038 L = 38 mL." },
    { q: "At the anode of a cell with dilute H₂SO₄, which half-reaction occurs?", options: ['2 H₂O → O₂ + 4 H⁺ + 4 e⁻', '4 H⁺ + 4 e⁻ → 2 H₂', 'SO₄²⁻ → SO₂ + O₂ + 2 e⁻', '2 H⁺ + 2 e⁻ → H₂'], answer: 0, why: "The anode is the site of oxidation; sulfate is not oxidized in water, so water is oxidized and O₂ is released." },
    { q: "Concentrated NaCl(aq) is electrolyzed with inert electrodes. What is obtained at the cathode?", options: ["H₂(g) and OH⁻", 'Na(s)', 'Cl₂(g)', 'O₂(g)'], answer: 0, why: "Water is reduced more easily than Na⁺ (−0.41 V versus −2.71 V). Sodium is obtained only from molten NaCl." },
    { q: "If the current is doubled and the time stays the same, the amount of gas produced…", options: ["doubles (Faraday: n ∝ Q)", "quadruples", "stays constant", "is halved"], answer: 0, why: "n = Q/(z·F) and Q = I·t: with constant t, n is directly proportional to I." },
    { q: "When electrolyzing Na₂SO₄(aq) with a universal indicator, what color does the solution take near the cathode?", options: ["Blue-violet (basic)", "Red (acidic)", "Green (neutral)", "Colorless"], answer: 0, why: "OH⁻ forms at the cathode (4 H₂O + 4 e⁻ → 2 H₂ + 4 OH⁻), so the local pH increases." }
  ];

  /* ------------------------- Interfaz con el kit ------------------------- */
  var ui = {};
  function setMedium(id) {
    P.medium = id; var m = medium();
    kit.setEq({ chip: m.label, name: m.name, body: eqBody() });
    molReset();
    if (ui.mediumOpts) ui.mediumOpts.set(id);
    kit.setMode(id, true);
    ui.molCap && (ui.molCap.textContent = molCaption());
    kit.setLegend(legendRows());
    kit.refresh();
  }
  function eqBody() {
    var m = medium();
    return "<div class=\"eqline\"><small>Cathode (−) · reduction · E° = " + fmt(m.Ec, 2) + ' V</small>' + m.cat + '</div>' +
      "<div class=\"eqline\"><small>Anode (+) · oxidation · E° = " + fmt(m.Ea, 2) + ' V</small>' + m.an + '</div>' +
      "<div class=\"eqline\"><small>Overall · ΔE° = " + fmt(m.Ec - m.Ea, 2) + " V (nonspontaneous)</small>2 H₂O(l) → 2 H₂(g) + O₂(g)</div>" +
      '<small>' + m.note + '</small>';
  }
  function legendRows() {
    var rows = [];
    if (kit.layer('bubbles')) rows.push({ color: '#cfe8ff', label: 'H₂', text: "cathode (−)" }, { color: '#ffb3aa', label: 'O₂', text: "anode (+)" });
    if (kit.layer('ions')) rows.push({ color: '#e3b341', label: medium().cation, text: "migrate to the cathode" }, { color: '#39c5bb', label: medium().anion, text: "migrate to the anode" });
    if (kit.layer('electrons')) rows.push({ color: '#ffe066', label: 'e⁻', text: "anode → source → cathode", arrow: true });
    if (kit.layer('ph')) rows.push({ color: medium().catHalo, label: "Indicator", text: "near the cathode" }, { color: medium().anHalo, label: '', text: "near the anode" });
    return rows;
  }

  function buildLab(el) {
    ui.mediumOpts = kit.ui.options({ label: "Medium (electrolyte)", cols: 2, value: P.medium, options: Object.keys(MEDIA).map(function (k) { return { v: k, label: MEDIA[k].label, sub: MEDIA[k].sub }; }), onChange: function (v) { setMedium(v); } });
    ui.elecOpts = kit.ui.options({ label: "Electrode material", value: P.electrode, options: Object.keys(ELECTRODES).map(function (k) { return { v: k, label: ELECTRODES[k].label, sub: ELECTRODES[k].sub }; }), onChange: function (v) { goManual(); P.electrode = v; kit.refresh(); ui.iv && ui.iv.redraw(); } });
    ui.sV = kit.ui.slider({ label: "Voltage", min: 0, max: 12, step: 0.1, value: P.V, digits: 1, format: function (v) { return fmt(v, 1) + ' V'; }, onInput: function (v) { goManual(); P.V = v; } });
    ui.sC = kit.ui.slider({ label: "Concentration", min: 0.1, max: 2, step: 0.1, value: P.conc, format: function (v) { return fmt(v, 1) + ' M'; }, onInput: function (v) { goManual(); P.conc = v; ui.iv && ui.iv.redraw(); } });
    ui.accel = kit.ui.seg([{ v: 1, label: '×1' }, { v: 10, label: '×10' }, { v: 60, label: '×60' }], P.accel, function (v) { P.accel = v; });
    var card1 = kit.ui.card("Control panel");
    card1.appendChild(ui.mediumOpts); card1.appendChild(ui.elecOpts);
    card1.appendChild(kit.ui.sliders([ui.sV, ui.sC]));
    var acc = document.createElement('div'); acc.className = 'fld'; acc.innerHTML = "<span class=\"lbl\">Time acceleration (1 real s = ×N simulated s)</span>"; acc.appendChild(ui.accel); card1.appendChild(acc);
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = "<button class=\"btn\" id=\"btnEmpty\">Empty tubes</button><button class=\"btn primary\" id=\"btnLesson\">Back to the lesson</button>";
    card1.appendChild(row);
    el.appendChild(card1);
    el.querySelector('#btnEmpty').addEventListener('click', function () { resetGas(false); clearBubbles(); kit.refresh(); });
    el.querySelector('#btnLesson').addEventListener('click', function () { P.manual = false; kit.toast("The lesson controls the voltage"); });
    ui.labInfo = kit.ui.card("Cell data"); ui.labInfo.id = 'labInfo'; el.appendChild(ui.labInfo);
    var note = kit.ui.card("Note", "<p class=\"muted small\">Overpotentials and resistances are approximate didactic values so that the cell behaves like real ones: exact data depend on the electrode, the current density and the temperature.</p>");
    el.appendChild(note);
  }
  function updateLabInfo() {
    if (!ui.labInfo) return;
    var m = medium();
    ui.labInfo.innerHTML = "<div class=\"card-kicker\">Cell data</div>" +
      kv("Minimum E° (thermodynamic)", fmt(E_TEO, 2) + ' V') + kv("Overpotential η (" + ELECTRODES[P.electrode].label + ')', fmt(ELECTRODES[P.electrode].eta, 2) + ' V') +
      kv("Decomposition voltage", '<b>' + fmt(eDec(), 2) + ' V</b>') + kv("Solution resistance", fmt(resistance(), 1) + ' Ω') + kv("Medium", m.label + ' · ' + m.ph);
  }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function goManual() { if (!P.manual) { P.manual = true; kit.toast("Free mode: you control the cell"); } if (kit.state.playing) kit.pause(); }

  function buildGraphs(el) {
    var c1 = kit.ui.card("Current–voltage curve");
    ui.iv = kit.ui.canvas(c1, { height: 230, label: "Graph of current versus voltage", draw: drawIV, pointer: function (x, y, kind) {
      if (kind === 'move') return; var s = ui.iv.size(); var L = 42, pw = s.w - L - 10; goManual(); P.V = clamp((x - L) / pw * VMAX, 0, VMAX); ui.sV.set(P.V);
    } });
    c1.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Click or drag on the graph to change the voltage. Below E° + η (light blue line) the current is zero; above it grows linearly (Ohm's law in the solution).</p>");
    var c2 = kit.ui.card("Volume of gas collected");
    ui.vt = kit.ui.canvas(c2, { height: 230, label: "Volume of hydrogen and oxygen versus time", draw: drawVT });
    c2.insertAdjacentHTML('beforeend', "<p class=\"muted small\">The slope of H₂ is twice that of O₂ (2 : 1 ratio). The greater the current, the greater the slope (Faraday).</p>");
    el.appendChild(c1); el.appendChild(c2);
  }
  function buildMol(el) {
    var c = kit.ui.card("Molecular view of " + "the reaction");
    ui.mol = kit.ui.canvas(c, { height: 270, label: "Molecular-scale animation of the electrolysis", draw: molDraw });
    c.insertAdjacentHTML('beforeend', '<div class="legend-inline"><span><i style="background:#f85149"></i>O</span><span><i style="background:#e6edf3;border:1px solid #888"></i>H</span><span><i style="background:#e3b341"></i>H⁺</span><span><i style="background:#7e9bff"></i>OH⁻</span><span><i style="background:#ffe066"></i>e⁻</span></div><p class="muted small" id="molCap"></p>');
    el.appendChild(c);
    ui.molCap = c.querySelector('#molCap');
  }
  function molCaption() {
    var m = P.medium;
    return m === 'acid' ? "At the anode H₂O is oxidized: it gives up H⁺ and e⁻ and every 4 e⁻ one O₂ forms. The H⁺ migrate to the cathode, where they pick up the electrons arriving through the wire and form H₂."
      : m === 'neutral' ? "At the anode water releases H⁺ and e⁻ (it becomes acidic); at the cathode water takes up e⁻ and releases OH⁻ (it becomes basic). H⁺ and OH⁻ meet in the medium and neutralize to H₂O. Na⁺ and SO₄²⁻ only carry charge."
      : "At the cathode water takes up e⁻ and H₂ and OH⁻ form. The OH⁻ migrate to the anode, where they are oxidized: 4 OH⁻ → O₂ + 2 H₂O + 4 e⁻. The e⁻ return to the cathode through the external circuit.";
  }

  function buildPredictor(el) {
    var c = kit.ui.card("What is obtained at each electrode?");
    var sel = kit.ui.options({ label: "Electrolyte", cols: 2, value: pred.id, options: ELECTROLYTES.map(function (e) { return { v: e.id, label: e.f }; }), onChange: function (v) { pred.id = v; pred.active = false; renderPred(); } });
    c.appendChild(sel);
    var act = document.createElement('div'); act.id = 'predAct'; c.appendChild(act);
    var out = document.createElement('div'); out.id = 'predOut'; c.appendChild(out);
    el.appendChild(c);
    var q = kit.ui.card("Challenge mode"); el.appendChild(q);
    kit.ui.quiz(q, { items: QUIZ, intro: "Eight questions on electrolysis, stoichiometry and product prediction." });
    ui.predOut = out; ui.predAct = act;
    renderPred();
  }
  function candTable(list, side) {
    return '<table class="cand">' + list.map(function (x) {
      return '<tr class="' + (x.win ? 'win' : '') + '"><td>' + x.r + (x.kinetic ? ' *' : '') + '</td><td>' + (x.E < 90 ? 'E° = ' + fmt(x.E, 2) + ' V' : '—') + (x.win ? ' ✓' : '') + '</td></tr>';
    }).join('') + '</table>';
  }
  function renderPred() {
    var e = ELECTROLYTES.filter(function (x) { return x.id === pred.id; })[0];
    ui.predAct.innerHTML = '';
    if (e.active) {
      var tg = kit.ui.seg([{ v: false, label: "Inert electrodes" }, { v: true, label: "Anode of " + e.active.metal }], pred.active, function (v) { pred.active = v; renderPred(); });
      ui.predAct.appendChild(tg);
    }
    var r = predict(e, pred.active);
    var html = "<div class=\"decision\"><b>Cathode (−)</b>, reduction: you obtain <b>" + r.cProd + '</b></div>' +
      "<div class=\"card-kicker\">Candidates for reduction (the one with higher E° wins)</div>" + candTable(r.cathode, 'c') +
      "<div class=\"decision\"><b>Anode (+)</b>, oxidation: you obtain <b>" + r.aProd + '</b></div>' +
      (e.molten ? '' : "<div class=\"card-kicker\">Candidates for oxidation (the one with lower E° wins)</div>" + candTable(r.anode, 'a')) +
      (r.notes.length ? "<p class=\"note\">* By the E° criterion water would win, but the <b>overpotential</b> of O₂ changes the real result.</p>" : '') +
      '<p class="muted small">' + e.note + '</p>' +
      "<p class=\"muted small\">E° at 25 °C, 1 mol/L; water is evaluated at the pH of the solution. Textbook guide: real products depend on the concentration, the electrode and the voltage.</p>";
    ui.predOut.innerHTML = html;
  }

  /* ------------------------- Arranque ------------------------- */
  function init() {
    kit = SimKit.create({
      key: 'electrolisis-agua',
      title: "Electrolysis of Water",
      subtitle: "3D Simulator · general chemistry",
      accent: { dark: '#5cc8ff', light: '#0a86cc' },
      viewLabel: "3D viewer of the electrolytic cell",
      modes: [
        { id: 'acid', label: "Acid", sub: 'H₂SO₄', color: '#ff7a6b' },
        { id: 'neutral', label: "Neutral", sub: 'Na₂SO₄', color: '#5ee3a2' },
        { id: 'base', label: "Basic", sub: "NaOH", color: '#7e9bff' }
      ], modesLabel: "Electrolyte medium",
      onMode: function (id) { setMedium(id); },
      stages: STAGES,
      mainTabLabel: "Guide",
      tabs: [
        { id: 'lab', label: "Lab", build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: "Graphs", build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'mol', label: 'Molecular', build: function (el, k) { kit = k; buildMol(el); } },
        { id: 'pred', label: 'Predictor', build: function (el, k) { kit = k; buildPredictor(el); } }
      ],
      mainExtra: function (el, k) {
        kit = k;
        var c = kit.ui.card("Collection tubes");
        ui.tubes = kit.ui.canvas(c, { height: 210, label: "Tubes with the collected hydrogen and oxygen", draw: drawTubes });
        c.insertAdjacentHTML('beforeend', "<div class=\"grid2\" style=\"margin-top:8px\"><div class=\"stat\"><small>V(H₂) : V(O₂)</small><b id=\"ratio\">–</b></div><div class=\"stat\"><small>Efficiency (ΔH)</small><b id=\"eff\">–</b></div></div>");
        el.appendChild(c);
      },
      measuresTitle: "Live measurements",
      measures: function () {
        var vh = P.nH2 * VM * 1000, vo = P.nO2 * VM * 1000, e = eDec();
        var eff = P.V > 0 && P.I > 0 ? clamp(E_TN / P.V, 0, 1) * 100 : null;
        var rt = document.getElementById('ratio'); if (rt) rt.textContent = vo > 0.05 ? fmt(vh / vo, 2) + ' : 1' : '–';
        var ef = document.getElementById('eff'); if (ef) ef.textContent = eff == null ? '–' : fmt(eff, 0) + ' %';
        return [
          ["Applied voltage", fmt(P.V, 1) + ' V'],
          ["Decomposition voltage", fmt(e, 2) + ' V'],
          ["Current I", fmt(P.I, 2) + ' A'],
          ["Power V·I", fmt(P.V * P.I, 2) + ' W'],
          ["Charge Q = ∫I·dt", fmt(P.Q, 0) + ' C'],
          ['n(H₂) · n(O₂)', fmt(P.nH2 * 1000, 2) + ' · ' + fmt(P.nO2 * 1000, 2) + " mmol"],
          ['V(H₂) · V(O₂)', fmt(vh, 1) + ' · ' + fmt(vo, 1) + ' mL'],
          ["Simulated time", fmtTime(P.tsim)],
          ["Energy per mole of H₂ (2·F·V)", P.V > 0 ? fmt(2 * F * P.V / 1000, 0) + ' kJ' : '–']
        ];
      },
      ideas: [
        "Electrolysis <b>forces</b> a nonspontaneous reaction with electrical energy (ΔG° > 0).",
        "Cathode = reduction = (−) pole; anode = oxidation = (+) pole <b>in an electrolytic cell</b> (the opposite of a galvanic cell).",
        "Electrons flow through the wire from the anode to the cathode; the <b>conventional current</b> goes the other way.",
        "In the solution the charge is carried by <b>ions</b>, not by electrons.",
        "V(H₂) : V(O₂) = 2 : 1, and n = Q / (z·F) for any voltage above the threshold."
      ],
      layers: [
        { id: 'bubbles', label: "Bubbles", icon: '○' },
        { id: 'ions', label: "Ions", icon: '±' },
        { id: 'electrons', label: "Electrons", icon: 'e⁻' },
        { id: 'ph', label: "pH indicator", icon: 'pH', on: false },
        { id: 'labels', label: "Labels", icon: 'Aa' },
        { id: 'rot', label: "Rotate", icon: '⟳', on: false }
      ],
      onLayer: function (id, on) {
        if (id === 'labels' && labelRenderer) labelRenderer.domElement.style.display = on ? 'block' : 'none';
        if (id === 'rot' && controls) controls.autoRotate = on;
        if (kit && kit.setLegend) kit.setLegend(legendRows());
      },
      views: [{ id: 'libre', label: "Free" }, { id: 'frontal', label: "Front" }, { id: 'electrodos', label: "Electrodes" }, { id: 'superior', label: "Top" }, { id: 'fuente', label: "Source" }],
      onView: function (id) { var v = VIEWS[id]; camGoal = v ? { pos: v.pos.clone(), target: v.target.clone() } : null; },
      onTheme: function (th) {
        if (!scene) return;
        scene.background = new T.Color(th === 'dark' ? 0x0e131a : 0xdbe6f1);
        tableMat.color.set(th === 'dark' ? 0x161b22 : 0xb9c7d6);
      },
      onStage: function (i) {
        if (i === 0) { resetGas(false); if (bubbleMesh) clearBubbles(); }
        P.manual = false;
        ui.molCap && (ui.molCap.textContent = molCaption());
      },
      onGuide: function () { P.manual = false; },
      onResize: resize,
      render: function () { renderer.render(scene, camera); },
      onFrame: function (f) {
        var dt = f.dt;
        if (!P.manual) P.V = lessonVoltage(f.i, f.local);
        if (ui.sV) ui.sV.set(P.V);
        physics(dt);
        sceneFrame(dt, f);
        {
          var mp = document.getElementById('tab-mol');
          if (mp && !mp.hidden) { molStep(dt); ui.mol && ui.mol.redraw(); }
        }
        if (ui.tubes) ui.tubes.redraw();
        var gp = document.getElementById('tab-graf');
        if (gp && !gp.hidden) { ui.iv && ui.iv.redraw(); ui.vt && ui.vt.redraw(); }
        updateLabInfo();
      },
      init: function (k) {
        kit = k;
        buildScene();
        resize();
        k.setEq({ chip: medium().label, name: medium().name, body: eqBody() });
        k.setLegend(legendRows());
        if (labelsLayer == null) labelsLayer = true;
        k.cfg.onTheme(k.state.theme);
        labelRenderer.domElement.style.display = k.layer('labels') ? 'block' : 'none';
        controls.autoRotate = k.layer('rot');
        ui.molCap && (ui.molCap.textContent = molCaption());
        updateLabInfo();
      },
      help: {
        intro: "Drag to rotate the cell, use the wheel to zoom in and follow the lesson with the player below. If you move the controls in the “Lab” panel you switch to <b>free mode</b>; with “Back to the lesson” the script regains control of the voltage.",
        items: [
          ["Medium", "switches between acidic, neutral or basic electrolyte (the half-reactions change, the overall one does not)."],
          ["Layers", "bubbles, ions in solution, electrons in the wire and pH indicator."],
          ["Tubes", "show the volume of H₂ and O₂ collected (2 : 1 ratio)."],
          ["Graphs", "current–voltage curve (click to set V) and volume versus time."],
          ['Predictor', "choose an electrolyte and discover what is produced at each electrode."]
        ]
      }
    });
    // modo inicial
    kit.setMode('acid', true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
