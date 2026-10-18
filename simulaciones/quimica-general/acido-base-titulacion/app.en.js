/* Ácido–base, pH y titulación — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js. El pH se obtiene resolviendo el balance de carga (Kw = 1,0 × 10⁻¹⁴, 25 °C). */
(function () {
  'use strict';
  var T = THREE, kit;
  var fmt = SimKit.fmt, clamp = SimKit.clamp;
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function kvr(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function log10(x) { return Math.log(x) / Math.LN10; }

  /* ------------------------- Sistemas ------------------------- */
  // kind 'acid': analito ácido valorado con NaOH · 'base': analito básico valorado con HCl
  var SYS = {
    hcl: { kind: 'acid', an: 'HCl', pKas: [], titr: 'NaOH', name: "Strong acid + strong base", sub: "HCl with NaOH", eq: 'HCl + NaOH → NaCl + H₂O', sp: [] },
    ace: { kind: 'acid', an: 'CH₃COOH', pKas: [4.76], titr: 'NaOH', name: "Weak acid + strong base", sub: "CH₃COOH with NaOH (pKa 4.76)", eq: 'CH₃COOH + NaOH → CH₃COONa + H₂O', sp: ['CH₃COOH', 'CH₃COO⁻'] },
    hf: { kind: 'acid', an: 'HF', pKas: [3.17], titr: 'NaOH', name: "Weak acid (pKa 3.17)", sub: "HF with NaOH", eq: 'HF + NaOH → NaF + H₂O', sp: ['HF', 'F⁻'] },
    h3po4: { kind: 'acid', an: 'H₃PO₄', pKas: [2.15, 7.20, 12.35], titr: 'NaOH', name: "Polyprotic acid", sub: "H₃PO₄ with NaOH (pKa 2.15 · 7.20 · 12.35)", eq: 'H₃PO₄ + NaOH → NaH₂PO₄ + H₂O', sp: ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻'] },
    naoh: { kind: 'base', an: 'NaOH', pKas: [], titr: 'HCl', name: "Strong base + strong acid", sub: "NaOH with HCl", eq: 'NaOH + HCl → NaCl + H₂O', sp: [] },
    nh3: { kind: 'base', an: 'NH₃', pKas: [9.25], titr: 'HCl', name: "Weak base + strong acid", sub: "NH₃ with HCl (pKa NH₄⁺ 9.25)", eq: 'NH₃ + HCl → NH₄Cl', sp: ['NH₄⁺', 'NH₃'] }
  };
  var IND = {
    none: { name: "No indicator", lo: 0, hi: 0, pK: 0, c0: [0.82, 0.92, 1], c1: [0.82, 0.92, 1] },
    fenol: { name: "Phenolphthalein", range: '8,2–10,0', pK: 9.1, c0: [0.82, 0.92, 1], c1: [0.88, 0.22, 0.6], a: "colorless → fuchsia" },
    bromo: { name: "Bromothymol blue", range: '6,0–7,6', pK: 6.8, c0: [0.95, 0.82, 0.16], c1: [0.17, 0.44, 0.84], a: "yellow → blue" },
    rojomet: { name: "Methyl red", range: '4,4–6,2', pK: 5.3, c0: [0.88, 0.24, 0.24], c1: [0.95, 0.82, 0.19], a: "red → yellow" },
    naranja: { name: "Methyl orange", range: '3,1–4,4', pK: 3.75, c0: [0.88, 0.25, 0.25], c1: [0.95, 0.74, 0.16], a: "red → yellow" }
  };
  var P = { sys: 'ace', ind: 'fenol', manual: false, auto: false, camGoal: null };
  var C = { ca: 0.100, cb: 0.100, va: 25 };
  var vt = 0, lastVt = 0, dropT = 0, ui = {};
  function S() { return SYS[P.sys]; }
  function nProt() { return Math.max(1, S().pKas.length); }
  function veq1() { return C.ca * C.va / C.cb; }
  function nEq() { return S().pKas.length === 3 ? 2 : 1; }
  function vMax() { return Math.min(100, Math.max(10, Math.round((nEq() + 0.7) * veq1() / 5) * 5)); }

  /* ------------------------- Modelo (balance de carga) ------------------------- */
  function alphas(pH, pKas) {
    var h = Math.pow(10, -pH), t = [1], s = 1, prod = 1;
    for (var i = 0; i < pKas.length; i++) { prod *= Math.pow(10, -pKas[i]); t.push(prod / Math.pow(h, i + 1)); s += t[i + 1]; }
    return t.map(function (x) { return x / s; });
  }
  function solve(v) {
    var s = S(), vtot = C.va + v, c = C.ca * C.va / vtot, ti = C.cb * v / vtot;
    var f = function (pH) {
      var h = Math.pow(10, -pH), oh = Math.pow(10, pH - 14);
      if (s.kind === 'acid') {
        var an = 0;
        if (!s.pKas.length) an = c; else { var al = alphas(pH, s.pKas); for (var i = 1; i < al.length; i++) an += i * al[i] * c; }
        return ti + h - oh - an;
      }
      var bh = s.pKas.length ? c / (1 + Math.pow(10, pH - s.pKas[0])) : c;   // fuerte: Na⁺ equivale a carga +c
      return bh + h - oh - ti;
    };
    var lo = -1, hi = 15;
    for (var k = 0; k < 70; k++) { var mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function species(v) {
    var s = S(), pH = solve(v), vtot = C.va + v, c = C.ca * C.va / vtot, ti = C.cb * v / vtot, out = [];
    var h = Math.pow(10, -pH), oh = Math.pow(10, pH - 14);
    if (s.kind === 'acid') {
      if (!s.pKas.length) out.push({ n: 'Cl⁻', c: c });
      else { var al = alphas(pH, s.pKas); al.forEach(function (a, i) { out.push({ n: s.sp[i], c: a * c }); }); }
      out.push({ n: 'Na⁺', c: ti });
    } else {
      if (!s.pKas.length) out.push({ n: 'Na⁺', c: c });
      else { var b = 1 / (1 + Math.pow(10, pH - s.pKas[0])); out.push({ n: s.sp[0], c: c * b }); out.push({ n: s.sp[1], c: c * (1 - b) }); }
      out.push({ n: 'Cl⁻', c: ti });
    }
    return { pH: pH, h: h, oh: oh, vtot: vtot, sp: out, ti: ti, c: c };
  }
  var cache = {};
  function pHat(v) { var k = P.sys + '|' + C.ca + '|' + C.cb + '|' + C.va + '|' + v.toFixed(3); if (cache[k] === undefined) { if (Object.keys(cache).length > 4000) cache = {}; cache[k] = solve(v); } return cache[k]; }
  var cur = species(0);
  function indSuit() {
    var d = IND[P.ind]; if (P.ind === 'none') return null;
    var a = pHat(veq1() * 0.99), b = pHat(veq1() * 1.01), lo = Math.min(a, b), hi = Math.max(a, b);
    return { ok: d.pK >= lo && d.pK <= hi, lo: lo, hi: hi, vind: findV(d.pK) };
  }
  function findV(pH) {
    var s = S(), a = 0, b = vMax(), up = pHat(b) > pHat(a);
    if ((pH - pHat(a)) * (pH - pHat(b)) > 0) return null;
    for (var k = 0; k < 40; k++) { var m = (a + b) / 2, hi = pHat(m) > pH; if (hi === up) b = m; else a = m; }
    return (a + b) / 2;
  }
  function region() {
    var s = S(), v = vt, E = veq1(), tol = 0.004 * E;
    if (v < 1e-9) return "Start (no titrant)";
    var w = s.pKas.length > 0;
    for (var k = 1; k <= nEq(); k++) if (Math.abs(v - k * E) <= tol) return k === 1 ? "Equivalence point" : "Second equivalence point";
    if (v < E) return w ? "Buffer zone (before equivalence)" : "Excess analyte";
    if (nEq() === 2 && v < 2 * E) return "Second buffer zone";
    return "Excess titrant";
  }
  function pOfIon(p) { return p; }
  function indColor(pH) {
    var d = IND[P.ind], f = 1 / (1 + Math.pow(10, d.pK - pH));
    return [d.c0[0] + (d.c1[0] - d.c0[0]) * f, d.c0[1] + (d.c1[1] - d.c0[1]) * f, d.c0[2] + (d.c1[2] - d.c0[2]) * f];
  }
  function pctStr(x) { return fmt(x, 2); }

  /* ------------------------- Lección ------------------------- */
  var STAGES = [0, 1, 2, 3, 4, 5].map(function () { return { name: '', short: '', title: '', text: '', dur: 9 }; });
  function lessonEnds() { var E = veq1(); return [0, 0.25 * E, 0.5 * E, E, (nEq() + 0.4) * E, E]; }
  function stagesList() {
    var s = S(), E = veq1(), w = s.pKas.length > 0, ends = lessonEnds(), p0 = pHat(0), pH2 = pHat(E / 2), pE = pHat(E), pLast = pHat(ends[4]);
    var d = IND[P.ind], suit = indSuit(), poly = nEq() === 2;
    var T0 = s.titr, ac = s.kind === 'acid';
    var intro = "<p>An <b>acid</b> donates H⁺ (forms H₃O⁺) and a <b>base</b> accepts it; <b>pH = −log[H₃O⁺]</b> measures acidity. In the beaker there is <b>" + fmt(C.va, 1) + " mL of " + s.an + ' ' + fmt(C.ca, 3) + " M</b>; in the burette, <b>" + T0 + ' ' + fmt(C.cb, 3) + ' M</b>.</p>';
    return [
      ["Acid and base", "Start", "Initial pH = " + fmt(p0, 2),
        intro + '<p>' + (w ? (ac ? "It is a <b>weak</b> acid: it dissociates only partially (pKa " + fmt(s.pKas[0], 2) + "), so the pH is not −log C." : "It is a <b>weak</b> base: it reacts only partially with water, so the pOH is not −log C.") : "It is " + (ac ? "an acid" : "a base") + " that is <b>strong</b>: it dissociates completely, so " + (ac ? 'pH = −log C' : 'pOH = −log C') + '.') + '</p>'],
      ["First drops", "First drops", "Titrant is added: the pH rises little at first",
        "<p>Each drop of " + T0 + " neutralizes part of the analyte. With " + fmt(ends[1], 1) + " mL added (25 % of the equivalence volume) the pH is <b>" + fmt(pHat(ends[1]), 2) + '</b>.</p>' + (w ? "<p>As the conjugate species forms, a mixture appears " + (ac ? 'HA / A⁻' : 'B / BH⁺') + ": a <b>buffer</b>.</p>" : "<p>What is consumed is only the excess of " + (ac ? 'H₃O⁺' : 'OH⁻') + "; the pH changes slowly.</p>")],
      [w ? "Buffer zone" : "Near equivalence", w ? "Buffer" : "Approach", w ? "Half equivalence: pH = pKa = " + fmt(pH2, 2) : "The pH rises faster and faster",
        w ? "<p>With <b>" + fmt(E / 2, 1) + " mL</b> half has been neutralized: [" + (ac ? 'HA' : 'BH⁺') + '] = [' + (ac ? 'A⁻' : 'B') + "] and the <b>Henderson–Hasselbalch</b> equation gives <b>pH = pKa</b> = " + fmt(pH2, 2) + ". The pH varies little on adding titrant: this is the zone of maximum <b>buffer capacity</b>.</p>" : "<p>At " + fmt(E / 2, 1) + " mL half of the analyte remains (pH " + fmt(pH2, 2) + "). As equivalence is approached the pH shoots up."],
      ["Equivalence", "Equivalence point", "Equivalence point: V = " + fmt(E, 1) + ' mL, pH = ' + fmt(pE, 2),
        "<p>Here n(titrant) = n(analyte): <b>" + fmt(C.cb, 3) + ' × ' + fmt(E, 1) + ' = ' + fmt(C.ca, 3) + ' × ' + fmt(C.va, 1) + '</b> (mmol).</p><p>' + (!w ? "A neutral salt forms: pH = 7.00." : ac ? "The conjugate base A⁻ remains and reacts with water: the pH is <b>basic</b> (" + fmt(pE, 2) + ').' : "The conjugate acid BH⁺ remains and donates H⁺ to water: the pH is <b>acidic</b> (" + fmt(pE, 2) + ').') + '</p>' + (poly ? "<p>It is the <b>first</b> equivalence point (H₃PO₄ → H₂PO₄⁻). The second is at " + fmt(2 * E, 1) + ' mL.</p>' : '')],
      ["After equivalence", "Excess", "Excess titrant: pH = " + fmt(pLast, 2) + ' con ' + fmt(ends[4], 1) + ' mL',
        "<p>Past equivalence, the pH is set by the <b>excess of " + T0 + '</b> (' + (ac ? 'OH⁻' : 'H₃O⁺') + " free); the effect of the conjugate species is now negligible and the curve flattens.</p>" + (poly ? "<p>Observe the jump of the second equivalence point (HPO₄²⁻). The third proton (pKa 12.35) is so weak that no jump is seen.</p>" : '')],
      ["Indicator", "Indicator", P.ind === 'none' ? "Choose an indicator" : d.name + ': ' + (suit && suit.ok ? "suitable" : "NOT suitable"),
        P.ind === 'none' ? "<p>Choose an indicator in the “Lab” tab.</p>" : '<p>' + d.name + " changes color at pH " + d.range + ' (' + d.a + "). The pH “jump” around equivalence (±1 % of volume) goes from <b>" + fmt(suit.lo, 2) + '</b> a <b>' + fmt(suit.hi, 2) + '</b>.</p><p>' + (suit.ok ? "<b>It works</b>: its color change falls within the jump, so the color change marks the equivalence point." : "<b>It does not work well</b>: its color change lies outside the jump, so the color would change far from equivalence (titration error).") + '</p>']
    ];
  }
  function refreshStageUI() {
    var arr = stagesList();
    arr.forEach(function (a, i) { var t = STAGES[i]; t.name = a[0]; t.short = a[1]; t.title = a[2]; t.text = a[3]; });
    if (!kit) return;
    var s = STAGES[kit.state.stage];
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
  }

  /* ------------------------- Escena ------------------------- */
  var scene, camera, renderer, labelRenderer, controls, liquid, liqMat, burLiq, drops = [], labels = {}, beaker, partMesh = [], PART = [], matSp = [];
  var BR = 3.1, BH = 6.4, RB = 0.38, BY0 = 7.2, BY1 = 18, TIP = 7.0;
  var SPCOL = [0xff8a5c, 0x4fa3ff, 0xc08bff, 0x5ad1a6, 0xe3b341, 0x9aa7b4, 0xff5c8a, 0x72e0e0];
  var PMAX = 42;
  function mkLabel(txt, cls) {
    var d = document.createElement('div'); d.className = 'bond-label ' + cls; d.textContent = txt;
    var o = new T.CSS2DObject(d); return { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; } };
  }
  function buildScene() {
    var cont = kit.viewport;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 200); camera.position.set(0, 10, 29);
    renderer = new T.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); cont.appendChild(renderer.domElement);
    labelRenderer = new T.CSS2DRenderer(); labelRenderer.domElement.className = 'labels-layer'; cont.appendChild(labelRenderer.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06; controls.minDistance = 8; controls.maxDistance = 70; controls.target.set(0, 6.3, 0);
    controls.addEventListener('start', function () { P.camGoal = null; });
    scene.add(new T.AmbientLight(0xffffff, 0.85));
    var dl = new T.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 16, 12); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x88aaff, 0.4); dl2.position.set(-8, 4, -8); scene.add(dl2);
    // vaso
    var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.16, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
    beaker = new T.Mesh(new T.CylinderGeometry(BR, BR * 0.97, BH, 40, 1, true), gm); beaker.position.y = BH / 2; scene.add(beaker);
    var base = new T.Mesh(new T.CylinderGeometry(BR * 0.97, BR * 0.97, 0.18, 40), new T.MeshStandardMaterial({ color: 0xaecdee, transparent: true, opacity: 0.55 })); base.position.y = 0.09; scene.add(base);
    liqMat = new T.MeshStandardMaterial({ color: 0xd2ebff, transparent: true, opacity: 0.62, roughness: 0.2 });
    liquid = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40), liqMat); scene.add(liquid);
    // bureta
    var bm = new T.Mesh(new T.CylinderGeometry(RB, RB, BY1 - BY0, 20, 1, true), gm); bm.position.y = (BY0 + BY1) / 2; scene.add(bm);
    burLiq = new T.Mesh(new T.CylinderGeometry(RB * 0.86, RB * 0.86, 1, 20), new T.MeshStandardMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.7 })); scene.add(burLiq);
    var tick = new T.MeshBasicMaterial({ color: 0x6b7a8c });
    for (var i = 0; i <= 10; i++) { var tk = new T.Mesh(new T.BoxGeometry(i % 5 === 0 ? 0.42 : 0.25, 0.03, 0.03), tick); tk.position.set(RB + 0.05, BY0 + 0.3 + (BY1 - BY0 - 0.6) * i / 10, 0.02); scene.add(tk); }
    var cone = new T.Mesh(new T.CylinderGeometry(RB, 0.07, 0.5, 16), gm); cone.position.y = BY0 - 0.25; scene.add(cone);
    var cock = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.9, 10), new T.MeshStandardMaterial({ color: 0x3a4656 })); cock.rotation.z = Math.PI / 2; cock.position.y = BY0 - 0.15; scene.add(cock);
    var stand = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, BY1 + 0.5, 10), new T.MeshStandardMaterial({ color: 0x59667a })); stand.position.set(-BR - 1.6, (BY1 + 0.5) / 2, -0.6); scene.add(stand);
    var arm = new T.Mesh(new T.BoxGeometry(BR + 1.5, 0.14, 0.14), new T.MeshStandardMaterial({ color: 0x59667a })); arm.position.set(-(BR + 1.6) / 2 - 0.3, BY1 - 1.2, -0.3); scene.add(arm);
    var plate = new T.Mesh(new T.CylinderGeometry(BR + 2.8, BR + 2.8, 0.3, 40), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.y = -0.15; scene.add(plate);
    for (var d = 0; d < 3; d++) { var dm = new T.Mesh(new T.SphereGeometry(0.17, 12, 10), new T.MeshStandardMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.85 })); dm.visible = false; scene.add(dm); drops.push(dm); }
    // partículas
    var sg = new T.SphereGeometry(1, 12, 9);
    for (var k = 0; k < 8; k++) {
      var mt = new T.MeshStandardMaterial({ color: SPCOL[k], roughness: 0.4 }); matSp.push(mt);
      var im = new T.InstancedMesh(sg, mt, PMAX); im.count = 0; im.frustumCulled = false; scene.add(im); partMesh.push(im);
      var arr = []; for (var q = 0; q < PMAX; q++) arr.push({ x: (Math.random() * 2 - 1) * (BR - 0.4), y: Math.random(), z: (Math.random() * 2 - 1) * (BR - 0.4), vx: Math.random() - 0.5, vy: Math.random() - 0.5, vz: Math.random() - 0.5 });
      PART.push(arr);
    }
    labels.ph = mkLabel('', 'bl-lead'); scene.add(labels.ph.o);
    labels.bur = mkLabel('', 'bl-d'); labels.bur.o.position.set(RB + 1.3, BY1 - 0.5, 0); scene.add(labels.bur.o);
    labels.vas = mkLabel('', 'bl-d'); labels.vas.o.position.set(0, -0.9, 0); scene.add(labels.vas.o);
    labels.hh = mkLabel('', 'bl-warn'); labels.hh.o.position.set(BR + 1.8, 2.5, 0); scene.add(labels.hh.o);
  }
  var dummy = new T.Object3D();
  function updateScene(t, dt) {
    var s = S(), sp = cur, vtot = sp.vtot, vm = vMax();
    var h = clamp(0.9 + 4.4 * vtot / 100, 1, BH - 0.4);
    liquid.scale.set(BR * 0.95, h, BR * 0.95); liquid.position.y = 0.18 + h / 2;
    var col = indColor(sp.pH); liqMat.color.setRGB(col[0], col[1], col[2]); liqMat.opacity = P.ind === 'none' ? 0.5 : 0.78;
    var fill = clamp(1 - vt / vm, 0.001, 1) * (BY1 - BY0 - 0.6);
    burLiq.scale.set(1, fill, 1); burLiq.position.y = BY0 + 0.1 + fill / 2;
    // gotas
    var moving = performance.now() - dropT < 350, top = 0.18 + h;
    drops.forEach(function (d, i) {
      if (!moving) { d.visible = false; return; }
      var ph = ((t * 2.6 + i / 3) % 1); d.visible = true; d.position.set(0, TIP - 0.3 - ph * (TIP - 0.3 - top), 0); d.scale.set(1, 1 + ph * 0.6, 1);
    });
    // partículas
    var K = 250, mag = kit.layer('amp') ? 100 : 1, list = sp.sp.map(function (x) { return { n: x.n, c: x.c * K, m: 1 }; });
    list.push({ n: 'H₃O⁺', c: sp.h * K * mag, m: 2, hot: 1 }); list.push({ n: 'OH⁻', c: sp.oh * K * mag, m: 2, hot: 1 });
    var show = kit.layer('ions'), legend = [];
    for (var k = 0; k < 8; k++) {
      var im = partMesh[k], it = list[k];
      if (!it || !show) { im.count = 0; continue; }
      var cnt = Math.min(PMAX, Math.round(it.c)); im.count = cnt;
      matSp[k].color.setHex(it.n === 'H₃O⁺' ? 0xff6b3d : it.n === 'OH⁻' ? 0x3d8bff : it.n === 'Na⁺' ? 0xc08bff : it.n === 'Cl⁻' ? 0x5ad1a6 : SPCOL[k]);
      var r = it.n === 'H₃O⁺' || it.n === 'OH⁻' ? 0.2 : (it.n === 'Na⁺' || it.n === 'Cl⁻' ? 0.2 : 0.26), R = BR - 0.45, top2 = h - 0.2;
      for (var q = 0; q < cnt; q++) {
        var p = PART[k][q];
        p.x += p.vx * dt * 0.9; p.z += p.vz * dt * 0.9; p.y += p.vy * dt * 0.5;
        if (p.x * p.x + p.z * p.z > R * R) { var a = Math.atan2(p.z, p.x); p.x = Math.cos(a) * R * 0.98; p.z = Math.sin(a) * R * 0.98; p.vx = -p.vx; p.vz = -p.vz; }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } if (p.y > 1) { p.y = 1; p.vy = -Math.abs(p.vy); }
        dummy.position.set(p.x, 0.5 + p.y * Math.max(0.2, top2 - 0.5), p.z); dummy.scale.setScalar(r); dummy.updateMatrix(); im.setMatrixAt(q, dummy.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
    // etiquetas
    var showL = kit.layer('labels'), disp = showL ? '' : 'none';
    labels.ph.o.position.set(0, 0.18 + h + 1.1, 0);
    labels.ph.set('pH ' + fmt(sp.pH, 2), 'bl-lead');
    labels.bur.set(s.titr + ' ' + fmt(C.cb, 3) + ' M · ' + fmt(vt, 2) + ' mL', 'bl-d');
    labels.vas.set(s.an + ' ' + fmt(C.ca, 3) + ' M · ' + fmt(C.va, 1) + ' mL', 'bl-d');
    var hint = '';
    if (s.pKas.length && vt > 0.02 * veq1() && Math.abs(vt - veq1() / 2) < 0.03 * veq1()) hint = 'pH ≈ pKa';
    labels.hh.set(hint, 'bl-warn'); labels.hh.o.visible = !!(hint && showL);
    ['ph', 'bur', 'vas'].forEach(function (k) { labels[k].o.visible = showL; });
    return list;
  }
  function resize() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight; if (w < 2 || h < 2) return;
    camera.aspect = w / h; camera.zoom = clamp(camera.aspect / 1.6, 0.5, 1.15) * (w > 900 ? 1.0 : 0.9);
    var off = w > 900 ? Math.min(280, w * 0.27) : 0;
    if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
  }
  function viewGoal(id) {
    if (id === 'vaso') return { pos: new T.Vector3(0, 5, 14), target: new T.Vector3(0, 3, 0) };
    if (id === 'bureta') return { pos: new T.Vector3(0, 14, 18), target: new T.Vector3(0, 12, 0) };
    if (id === 'lado') return { pos: new T.Vector3(24, 9, 6), target: new T.Vector3(0, 7.5, 0) };
    if (id === 'superior') return { pos: new T.Vector3(0, 30, 3), target: new T.Vector3(0, 3, 0) };
    return { pos: new T.Vector3(0, 10, 29), target: new T.Vector3(0, 6.3, 0) };
  }

  /* ------------------------- Control ------------------------- */
  function goManual() { if (!P.manual) { P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); }
  function setVt(v, ani) { v = clamp(v, 0, vMax()); if (v !== vt) { vt = v; dropT = performance.now(); } cur = species(vt); if (ui.sV && !ani) ui.sV.set(vt); }
  function afterParams() {
    cache = {}; ui.sV && (ui.sV.querySelector('input').max = vMax()); vt = clamp(vt, 0, vMax()); cur = species(vt);
    refreshStageUI(); syncHud(); syncCtrl(); redrawAll();
  }
  function setSys(id) { P.sys = id; vt = 0; P.auto = false; afterParams(); calcRender(); }
  function syncCtrl() {
    if (ui.sV) { ui.sV.set(vt); ui.sCa.set(C.ca); ui.sCb.set(C.cb); ui.sVa.set(C.va); }
    if (ui.sCa) { ui.sCa.querySelector('span').textContent = 'C ' + S().an; ui.sCb.querySelector('span').textContent = 'C ' + S().titr; }
    if (ui.sysOpts) ui.sysOpts.set(P.sys); if (ui.indOpts) ui.indOpts.set(P.ind);
    updateInfo();
  }
  function syncHud() {
    var s = S(), E = veq1();
    kit.setEq({ chip: "Titration", name: s.eq, body:
      "<div class=\"eqline\"><small>Equivalence volume</small>" + fmt(E, 2) + ' mL' + (nEq() === 2 ? ' · 2.º: ' + fmt(2 * E, 2) + ' mL' : '') + '</div>' +
      "<div class=\"eqline\"><small>pH at equivalence</small>" + fmt(pHat(E), 2) + '</div>' +
      (s.pKas.length ? '<div class="eqline"><small>' + (s.kind === 'acid' ? 'pKa' : "pKa (conjugate)") + '</small>' + s.pKas.map(function (p) { return fmt(p, 2); }).join(' · ') + '</div>' : '<div class="eqline"><small>' + (s.kind === 'acid' ? "Strong acid" : "Strong base") + "</small>complete dissociation</div>") +
      "<small>n(titrant) = n(analyte) at equivalence. Kw = 1.0 × 10⁻¹⁴ (25 °C).</small>" });
    kit.setLegend([{ label: 'H₃O⁺', color: '#ff6b3d', text: "hydronium ion" }, { label: 'OH⁻', color: '#3d8bff', text: "hydroxide ion" },
      { label: 'Na⁺ / Cl⁻', color: '#c08bff', text: "spectator ions (violet / green)" }, { label: "Analyte species", color: '#4fa3ff', text: "acid/base and its conjugate" }]);
  }
  function updateInfo() {
    if (!ui.info) return; var su = indSuit(), s = S(), d = IND[P.ind];
    ui.info.innerHTML = "<div class=\"card-kicker\">Results</div>" + kvr("Current pH", '<b>' + fmt(cur.pH, 2) + '</b>') + kvr("Equivalence volume", fmt(veq1(), 2) + ' mL') + kvr("pH at equivalence", fmt(pHat(veq1()), 2)) +
      (s.pKas.length === 1 ? kvr("pH at V<sub>eq</sub>/2", fmt(pHat(veq1() / 2), 2) + ' (pKa ' + fmt(s.pKas[0], 2) + ')') : '') +
      (P.ind !== 'none' ? kvr(d.name, '<span class="' + (su.ok ? 'calc-ok' : 'bl-warn') + '">' + (su.ok ? "✓ suitable" : "✗ not suitable") + '</span>') + (su.vind != null ? kvr("Color change (pH " + fmt(d.pK, 1) + ') a', fmt(su.vind, 2) + ' mL') : '') : '');
  }
  function startTitration() { P.manual = true; if (kit.state.playing) kit.pause(); vt = 0; cur = species(0); P.auto = true; P.camGoal = viewGoal('libre'); }

  /* ------------------------- Gráficos ------------------------- */
  function drawCurve(ctx, w, h, c) {
    var L = 36, Rr = 12, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B, vm = vMax(), s = S(), d = IND[P.ind];
    var sx = function (v) { return L + pw * v / vm; }, sy = function (p) { return Tp + ph - ph * p / 14; };
    if (P.ind !== 'none') { ctx.fillStyle = 'rgba(224,57,154,.13)'; var y0 = sy(d.pK + 1.0), y1 = sy(d.pK - 1.0); ctx.fillStyle = 'rgba(227,179,65,.16)'; ctx.fillRect(L, y0, pw, y1 - y0); }
    ctx.font = '10.5px system-ui, sans-serif'; ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.textAlign = 'right';
    for (var i = 0; i <= 7; i++) { var y = sy(i * 2); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke(); ctx.fillText(i * 2, L - 5, y + 3); }
    ctx.textAlign = 'center'; for (var j = 0; j <= 5; j++) ctx.fillText(fmt(vm * j / 5, 0), sx(vm * j / 5), h - B + 14);
    ctx.fillText("V titrant (mL)", L + pw / 2, h - 6); ctx.save(); ctx.translate(10, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('pH', 0, 0); ctx.restore();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = c.muted;
    for (var k = 1; k <= nEq(); k++) { var xe = sx(k * veq1()); ctx.beginPath(); ctx.moveTo(xe, Tp); ctx.lineTo(xe, Tp + ph); ctx.stroke(); ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.fillText('V eq' + (nEq() > 1 ? k : ''), xe + 3, Tp + 10); }
    if (s.pKas.length) s.pKas.forEach(function (pk, i) { if (pk < 14 && (nEq() === 1 || i < 2)) { var yy = sy(pk); ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(L + pw, yy); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText('pKa' + (s.pKas.length > 1 ? i + 1 : ''), L + pw - 3, yy - 3); } });
    ctx.setLineDash([]);
    ctx.strokeStyle = '#4fa3ff'; ctx.lineWidth = 2.6; ctx.beginPath();
    for (var n = 0; n <= 160; n++) { var v = vm * n / 160, p = pHat(v); if (n === 0) ctx.moveTo(sx(v), sy(p)); else ctx.lineTo(sx(v), sy(p)); } ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(sx(vt), sy(cur.pH), 5.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  }
  function drawLog(ctx, w, h, c) {
    var L = 36, Rr = 12, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B, vm = vMax(), s = S();
    var sx = function (v) { return L + pw * v / vm; }, sy = function (l) { return Tp + ph - ph * (l + 14) / 14; };
    ctx.font = '10.5px system-ui, sans-serif'; ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.textAlign = 'right';
    for (var i = 0; i <= 7; i++) { var l = -i * 2, y = sy(l); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke(); ctx.fillText(l, L - 5, y + 3); }
    ctx.textAlign = 'center'; for (var j = 0; j <= 5; j++) ctx.fillText(fmt(vm * j / 5, 0), sx(vm * j / 5), h - B + 14);
    ctx.fillText("V titrant (mL)", L + pw / 2, h - 6); ctx.save(); ctx.translate(10, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('log C (mol/L)', 0, 0); ctx.restore();
    var lines = [{ n: 'H₃O⁺', col: '#ff6b3d', f: function (r) { return r.h; } }, { n: 'OH⁻', col: '#3d8bff', f: function (r) { return r.oh; } }];
    var first = species(0).sp; first.slice(0, s.pKas.length ? Math.min(first.length - 1, 4) : 0).forEach(function (_, idx) { lines.push({ n: first[idx].n, col: ['#9aa7b4', '#5ad1a6', '#e3b341', '#b392f0'][idx % 4], f: function (r) { return r.sp[idx].c; } }); });
    var samples = []; for (var n = 0; n <= 120; n++) samples.push(species(vm * n / 120));
    lines.forEach(function (ln, li) {
      ctx.strokeStyle = ln.col; ctx.lineWidth = 2; ctx.beginPath(); var st = false;
      samples.forEach(function (r, k) { var cv = ln.f(r); if (cv <= 1e-14) { st = false; return; } var x = sx(vm * k / 120), y = sy(clamp(log10(cv), -14, 0)); if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y); }); ctx.stroke();
      ctx.fillStyle = ln.col; ctx.textAlign = 'left'; ctx.font = '700 10.5px system-ui, sans-serif'; ctx.fillText(ln.n, L + 6 + li * 52, Tp + 11);
    });
    ctx.lineWidth = 1; ctx.strokeStyle = c.ink; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(vt), Tp); ctx.lineTo(sx(vt), Tp + ph); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawAlpha(ctx, w, h, c) {
    var s = S(), L = 36, Rr = 12, Tp = 14, B = 34, pw = w - L - Rr, ph = h - Tp - B;
    var sx = function (p) { return L + pw * p / 14; }, sy = function (a) { return Tp + ph - ph * a; };
    ctx.font = '10.5px system-ui, sans-serif'; ctx.strokeStyle = c.line; ctx.fillStyle = c.muted; ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) { var y = sy(i / 4); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke(); ctx.fillText(fmt(i / 4, 2), L - 5, y + 3); }
    ctx.textAlign = 'center'; for (var j = 0; j <= 7; j++) ctx.fillText(j * 2, sx(j * 2), h - B + 14); ctx.fillText('pH', L + pw / 2, h - 6);
    if (!s.pKas.length) { ctx.fillStyle = c.muted; ctx.fillText("No acid–base equilibrium: " + (s.kind === 'acid' ? "acid" : 'base') + " strong (complete dissociation).", L + pw / 2, Tp + ph / 2); return; }
    var n = s.pKas.length, cols = ['#9aa7b4', '#4fa3ff', '#5ad1a6', '#e3b341'], names = s.sp;
    var al = function (pH) { var a = alphas(pH, s.pKas); return s.kind === 'acid' ? a : [a[0], 1 - a[0]].map(function (_, k) { return k === 0 ? 1 / (1 + Math.pow(10, pH - s.pKas[0])) : 1 - 1 / (1 + Math.pow(10, pH - s.pKas[0])); }); };
    var m = s.kind === 'acid' ? n + 1 : 2;
    for (var k = 0; k < m; k++) {
      ctx.strokeStyle = cols[k % 4]; ctx.lineWidth = 2.2; ctx.beginPath();
      for (var q = 0; q <= 140; q++) { var pH = 14 * q / 140, a = al(pH)[k], x = sx(pH), y = sy(a); if (q === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      ctx.fillStyle = cols[k % 4]; ctx.font = '700 10.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(names[k], L + 6 + k * 70, Tp + 11);
    }
    ctx.lineWidth = 1; ctx.strokeStyle = c.muted; ctx.setLineDash([4, 4]);
    s.pKas.forEach(function (pk) { if (pk < 14) { ctx.beginPath(); ctx.moveTo(sx(pk), Tp); ctx.lineTo(sx(pk), Tp + ph); ctx.stroke(); } }); ctx.setLineDash([]);
    ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(cur.pH), Tp); ctx.lineTo(sx(cur.pH), Tp + ph); ctx.stroke(); ctx.lineWidth = 1;
  }
  function redrawAll() { ['g1', 'g2', 'g3'].forEach(function (k) { ui[k] && ui[k].redraw(); }); }
  function buildGraphs(el) {
    var c1 = kit.ui.card("Titration curve"); ui.g1 = kit.ui.canvas(c1, { height: 250, label: "pH versus titrant volume", draw: drawCurve });
    c1.insertAdjacentHTML('beforeend', "<p class=\"muted small\">Vertical dotted line: equivalence point(s); horizontal: pKa. Amber band: indicator color-change zone (pK ± 1). Orange dot: current state.</p>");
    var c2 = kit.ui.card("Species distribution α(pH)"); ui.g2 = kit.ui.canvas(c2, { height: 210, label: "Fraction of each species as a function of pH", draw: drawAlpha });
    c2.insertAdjacentHTML('beforeend', "<p class=\"muted small\">They cross at pH = pKa. The orange line marks the current pH of the mixture.</p>");
    var c3 = kit.ui.card("Concentrations (log scale)"); ui.g3 = kit.ui.canvas(c3, { height: 220, label: "log of the concentration of each species versus volume", draw: drawLog });
    el.appendChild(c1); el.appendChild(c2); el.appendChild(c3);
  }

  /* ------------------------- Cálculo ------------------------- */
  function calcHtml() {
    var s = S(), E = veq1(), v = vt, vtot = C.va + v, nA = C.ca * C.va, nB = C.cb * v, w = s.pKas.length > 0, ac = s.kind === 'acid', pH = cur.pH;
    var an = s.an, ti = s.titr, h = '', row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
    h += "<div class=\"card-kicker\">Solution at the current point</div><div class=\"muted small\">" + s.eq + '</div>';
    h += "<div class=\"calc-step\">1 · Amounts of substance (mmol)</div><table class=\"calc-table\">" + row('n(' + an + ") initial", fmt(C.ca, 3) + ' M × ' + fmt(C.va, 1) + ' mL = <b>' + fmt(nA, 3) + ' mmol</b>') + row('n(' + ti + ") added", fmt(C.cb, 3) + ' M × ' + fmt(v, 2) + ' mL = <b>' + fmt(nB, 3) + ' mmol</b>') + row("Total volume", fmt(vtot, 2) + ' mL') + row("Equivalence volume", fmt(nA, 3) + ' ÷ ' + fmt(C.cb, 3) + ' = <b>' + fmt(E, 2) + ' mL</b>') + '</table>';
    h += "<div class=\"calc-step\">2 · Region: " + region() + '</div><table class="calc-table">';
    if (nEq() === 2) h += row("Exact pH (charge balance)", '<b>' + fmt(pH, 2) + '</b>') + row("Note", "Triprotic system: solved numerically with the three Ka. Compare with the curve and α(pH).");
    else {
      var pKa = w ? s.pKas[0] : null, tol = 0.004 * E, r = region();
      var ion = ac ? 'H₃O⁺' : 'OH⁻', ionC = ac ? 'OH⁻' : 'H₃O⁺';
      if (v < 1e-9) {
        if (!w) h += row("Formula", ac ? 'pH = −log C' : 'pOH = −log C; pH = 14 − pOH') + row("Result", 'pH = <b>' + fmt(pH, 2) + '</b>');
        else {
          var Ka = Math.pow(10, -pKa), K = ac ? Ka : Math.pow(10, -14) / Ka, x = (-K + Math.sqrt(K * K + 4 * K * C.ca)) / 2;
          h += row("Equilibrium", ac ? 'HA + H₂O ⇌ A⁻ + H₃O⁺, Ka = ' + Ka.toExponential(2).replace('e', ' × 10^').replace('.', '.') : 'B + H₂O ⇌ BH⁺ + OH⁻, Kb = ' + K.toExponential(2).replace('e', ' × 10^').replace('.', '.')) + row('x² ÷ (C − x) = K', 'x = <b>' + x.toExponential(2).replace('e', ' × 10^').replace('.', '.') + " M</b> of " + ion) + row('pH', '<b>' + fmt(pH, 2) + '</b>');
        }
      } else if (r.indexOf('equivalencia') >= 0) {
        if (!w) h += row("A neutral salt forms", "pH = <b>7.00</b>");
        else { var Kh = ac ? Math.pow(10, -14) / Math.pow(10, -pKa) : Math.pow(10, -pKa), cs = nA / vtot, xx = Math.sqrt(Kh * cs); h += row("Salt concentration", fmt(nA, 3) + ' ÷ ' + fmt(vtot, 2) + ' = ' + fmt(cs, 4) + ' M') + row("Hydrolysis of " + (ac ? 'A⁻' : 'BH⁺'), (ac ? 'Kb = Kw/Ka = ' : 'Ka = ') + Kh.toExponential(2).replace('e', ' × 10^').replace('.', '.')) + row('[' + (ac ? 'OH⁻' : 'H₃O⁺') + '] = √(K·C)', fmt(xx * 1e6, 2) + ' × 10⁻⁶ M') + row('pH', '<b>' + fmt(pH, 2) + '</b> (' + (ac ? "basic" : "acid") + ')'); }
      } else if (v < E) {
        if (w) { var nHA = nA - nB; h += row("Remain", fmt(nHA, 3) + " mmol of " + (ac ? 'HA' : 'B') + "; formed " + fmt(nB, 3) + " mmol of " + (ac ? 'A⁻' : 'BH⁺')) + row('Henderson–Hasselbalch', ac ? 'pH = pKa + log(n<sub>A⁻</sub>/n<sub>HA</sub>) = ' + fmt(pKa, 2) + ' + log(' + fmt(nB, 3) + '/' + fmt(nHA, 3) + ') = <b>' + fmt(pKa + log10(nB / nHA), 2) + '</b>' : 'pH = pKa + log(n<sub>B</sub>/n<sub>BH⁺</sub>) = ' + fmt(pKa, 2) + ' + log(' + fmt(nHA, 3) + '/' + fmt(nB, 3) + ') = <b>' + fmt(pKa + log10(nHA / nB), 2) + '</b>') + row("Exact pH of the model", '<b>' + fmt(pH, 2) + "</b> (HH is approximate)"); }
        else { var ex = (nA - nB) / vtot; h += row("Excess of " + (ac ? 'H₃O⁺' : 'OH⁻'), '(' + fmt(nA, 3) + ' − ' + fmt(nB, 3) + ') ÷ ' + fmt(vtot, 2) + ' = ' + fmt(ex, 4) + ' M') + row('pH', '<b>' + fmt(pH, 2) + '</b>'); }
      } else { var ex2 = (nB - nA) / vtot; h += row("Excess of " + ionC, '(' + fmt(nB, 3) + ' − ' + fmt(nA, 3) + ') ÷ ' + fmt(vtot, 2) + ' = ' + fmt(ex2, 4) + ' M') + row('pH', '<b>' + fmt(pH, 2) + '</b>'); }
    }
    h += '</table>'; return h;
  }
  function calcRender() { if (ui.calcOut) ui.calcOut.innerHTML = calcHtml(); }
  function buildCalc(el) { ui.calcOut = kit.ui.card(''); el.appendChild(ui.calcOut); calcRender(); }

  /* ------------------------- Desafío ------------------------- */
  var QUIZ = [
    { q: "What is the pH of a 0.10 M HCl solution?", options: ['1,00', '0,10', '13,00', '7,00'], answer: 0, why: "Strong acid: [H₃O⁺] = 0.10 M, pH = −log 0.10 = 1.00." },
    { q: "25.0 mL of 0.100 M HCl is titrated with 0.100 M NaOH. What are the equivalence volume and the pH at it?", options: ["25.0 mL and pH 7.00", "50.0 mL and pH 7.00", "25.0 mL and pH 8.73", "12.5 mL and pH 1.00"], answer: 0, why: "n(HCl) = 2.50 mmol = 0.100 × V → V = 25.0 mL. Strong acid and base give a neutral salt: pH 7.00." },
    { q: "In the titration of acetic acid (pKa 4.76) with NaOH, what is the pH when half of the equivalence volume has been added?", options: ['4,76', '7,00', '2,88', '9,24'], answer: 0, why: "At V<sub>eq</sub>/2, [HA] = [A⁻] and by Henderson–Hasselbalch pH = pKa + log 1 = 4.76." },
    { q: "The pH at the equivalence point of a weak acid with a strong base is…", options: ["Greater than 7", "Equal to 7", "Less than 7", "Equal to the pKa"], answer: 0, why: "The conjugate base A⁻ remains, which reacts with water and produces OH⁻: pH > 7 (for 0.05 M acetate ≈ 8.73)." },
    { q: "Which indicator is suitable for titrating 0.1 M acetic acid with 0.1 M NaOH?", options: ["Phenolphthalein (8.2–10.0)", "Methyl orange (3.1–4.4)", "Methyl red (4.4–6.2)", "Any, it makes no difference"], answer: 0, why: "The jump around equivalence goes from pH ≈ 7.7 to 9.7. Only phenolphthalein changes color within it." },
    { q: "When titrating ammonia (NH₃) with HCl, the pH at the equivalence point is…", options: ["Less than 7", "Equal to 7", "Greater than 7", "Equal to 9.25"], answer: 0, why: "NH₄⁺ remains, the conjugate acid of a weak base, which donates H⁺ to water: pH ≈ 5.3." },
    { q: "A buffer contains 0.20 mol of A⁻ and 0.020 mol of HA (pKa 4.76). What is its pH?", options: ['5,76', '3,76', '4,76', '6,76'], answer: 0, why: "pH = pKa + log(0.20/0.020) = 4.76 + log 10 = 5.76." },
    { q: "A buffer resists changes in pH best when…", options: ['pH = pKa ([HA] = [A⁻])', 'pH = 7', '[HA] ≫ [A⁻]', "there is only HA"], answer: 0, why: "Buffer capacity is maximal with equal proportions of conjugate acid and base, that is, pH = pKa; useful in the range pKa ± 1." }
  ];
  function buildQuiz(el) { var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: QUIZ, intro: "Eight questions on pH, titrations, buffers and indicators." }); el.appendChild(c); }

  /* ------------------------- Lab ------------------------- */
  function buildLab(el) {
    var c = kit.ui.card("Control panel"); el.appendChild(c);
    ui.sysOpts = kit.ui.options({ label: "System", cols: 2, value: P.sys, options: Object.keys(SYS).map(function (k) { return { v: k, label: SYS[k].name, sub: SYS[k].sub }; }), onChange: function (v) { goManual(); setSys(v); } });
    c.appendChild(ui.sysOpts);
    ui.sCa = kit.ui.slider({ label: "C analyte", min: 0.01, max: 0.5, step: 0.005, value: C.ca, format: function (v) { return fmt(v, 3) + ' M'; }, onInput: function (v) { goManual(); C.ca = v; afterParams(); calcRender(); } });
    ui.sCb = kit.ui.slider({ label: "C titrant", min: 0.01, max: 0.5, step: 0.005, value: C.cb, format: function (v) { return fmt(v, 3) + ' M'; }, onInput: function (v) { goManual(); C.cb = v; afterParams(); calcRender(); } });
    ui.sVa = kit.ui.slider({ label: "V analyte", min: 10, max: 50, step: 1, value: C.va, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { goManual(); C.va = v; afterParams(); calcRender(); } });
    ui.sV = kit.ui.slider({ label: "V titrant", min: 0, max: vMax(), step: 0.05, value: vt, format: function (v) { return fmt(v, 2) + ' mL'; }, onInput: function (v) { goManual(); P.auto = false; setVt(v, true); calcRender(); } });
    c.appendChild(kit.ui.sliders([ui.sCa, ui.sCb, ui.sVa, ui.sV]));
    ui.indOpts = kit.ui.options({ label: "Indicator", cols: 2, value: P.ind, options: Object.keys(IND).map(function (k) { return { v: k, label: IND[k].name, sub: IND[k].range ? 'pH ' + IND[k].range : '' }; }), onChange: function (v) { P.ind = v; refreshStageUI(); updateInfo(); redrawAll(); } });
    c.appendChild(ui.indOpts);
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = "<button class=\"btn primary\" id=\"bTit\">▶ Titrate</button><button class=\"btn\" id=\"bDrop\">+0.1 mL</button><button class=\"btn\" id=\"bMl\">+1 mL</button><button class=\"btn\" id=\"bEq\">Go to equivalence</button>";
    row.querySelector('#bTit').addEventListener('click', startTitration);
    row.querySelector('#bDrop').addEventListener('click', function () { goManual(); P.auto = false; setVt(vt + 0.1); calcRender(); });
    row.querySelector('#bMl').addEventListener('click', function () { goManual(); P.auto = false; setVt(vt + 1); calcRender(); });
    row.querySelector('#bEq').addEventListener('click', function () { goManual(); P.auto = false; setVt(veq1()); calcRender(); });
    c.appendChild(row);
    var row2 = document.createElement('div'); row2.className = 'row';
    row2.innerHTML = "<button class=\"btn\" id=\"bRs\">Restart</button><button class=\"btn\" id=\"bLs\">Back to the lesson</button>";
    row2.querySelector('#bRs').addEventListener('click', function () { goManual(); P.auto = false; setVt(0); calcRender(); });
    row2.querySelector('#bLs').addEventListener('click', function () { P.manual = false; P.auto = false; kit.toast("The lesson controls the simulation"); });
    c.appendChild(row2);
    ui.info = kit.ui.card("Results"); el.appendChild(ui.info); updateInfo();
    el.appendChild(kit.ui.card("Teaching note", "<p class=\"muted small\">The pH is calculated by solving the full <b>charge balance</b> (without “weak acid” or “buffer” approximations), at 25 °C. The particles in the beaker are a representation: 1 particle ≈ 0.004 M; the H₃O⁺ and OH⁻ ions are enlarged ×100 (“Enlarge H₃O⁺/OH⁻” layer) because at real concentrations of pH 3–11 there would be almost none.</p>"));
  }

  /* ------------------------- Arranque ------------------------- */
  function init() {
    refreshStageUI();
    kit = SimKit.create({
      key: 'acido-base-titulacion', title: "Acid–Base, pH and Titration", subtitle: "3D Simulator · general chemistry",
      accent: { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: "3D viewer: burette, beaker with indicator and ions",
      stages: STAGES, mainTabLabel: "Guide",
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'graf', label: "Graphs", build: function (el, k) { kit = k; buildGraphs(el); } },
        { id: 'calc', label: "Calculation", build: function (el, k) { kit = k; buildCalc(el); } },
        { id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; buildQuiz(el); } }
      ],
      measuresTitle: "Live measurements",
      measures: function () {
        var s = S(), E = veq1(), tp = Math.min(100, vt / E * 100);
        return [["System", s.sub], ['pH', fmt(cur.pH, 2)], ['pOH', fmt(14 - cur.pH, 2)], ['[H₃O⁺]', cur.h.toExponential(2).replace('e', ' × 10^').replace('.', '.') + ' M'], ["V titrant", fmt(vt, 2) + ' mL'],
          ["V equivalence", fmt(E, 2) + ' mL'], ["% of equivalence", fmt(vt / E * 100, 1) + ' %'], ["Region", region()], ["Total volume", fmt(cur.vtot, 2) + ' mL']];
      },
      ideas: ["<b>pH = −log[H₃O⁺]</b>; pH + pOH = 14 at 25 °C.", "In a titration, n(titrant) = n(analyte) at the <b>equivalence point</b>.", "A <b>buffer</b> (HA/A⁻) resists pH changes; maximum at pH = pKa (Henderson–Hasselbalch).",
        "The pH at equivalence is 7 only if both are strong: weak acid → basic; weak base → acidic.", "The indicator must change color <b>within the jump</b> in pH at equivalence."],
      layers: [{ id: 'ions', label: "Ions and molecules", icon: '●' }, { id: 'amp', label: "Enlarge H₃O⁺/OH⁻", icon: '×' }, { id: 'labels', label: "Labels", icon: 'Aa' }],
      onLayer: function () { },
      views: [{ id: 'libre', label: "Free" }, { id: 'vaso', label: "Beaker" }, { id: 'bureta', label: "Burette" }, { id: 'lado', label: "Side" }, { id: 'superior', label: "Top" }],
      onView: function (id) { P.camGoal = viewGoal(id); },
      onTheme: function (th) { if (!scene) return; scene.background = new T.Color(th === 'dark' ? 0x0e131a : 0xdbe6f1); },
      onStage: function (i) { refreshStageUI(); if (P.manual) return; P.camGoal = viewGoal(i === 0 ? 'libre' : i === 3 ? 'vaso' : 'libre'); },
      onGuide: function () { if (P.manual) { P.manual = false; P.auto = false; } },
      onResize: resize,
      render: function () { renderer.render(scene, camera); labelRenderer.render(scene, camera); },
      onFrame: function (f) {
        if (!P.manual) {
          var e = lessonEnds(), i = f.i, a = i === 0 ? 0 : e[i - 1], b = e[i], g = i === 0 ? 0 : ease(f.local), nv = a + (b - a) * g;
          if (Math.abs(nv - vt) > 1e-6) { vt = nv; dropT = (i >= 1 && i <= 4 && f.local < 0.97 && f.local > 0.01) ? performance.now() : dropT; cur = species(vt); }
        } else if (P.auto) {
          var step = vMax() / 14 * f.dt; vt = Math.min(vMax(), vt + step * (Math.abs(vt - veq1()) < 0.06 * veq1() ? 0.3 : 1)); dropT = performance.now(); cur = species(vt); if (vt >= vMax()) P.auto = false;
          ui.sV && ui.sV.set(vt);
        }
        if (P.camGoal) { camera.position.lerp(P.camGoal.pos, 0.08); controls.target.lerp(P.camGoal.target, 0.08); if (camera.position.distanceTo(P.camGoal.pos) < 0.05) P.camGoal = null; }
        updateScene(f.now, Math.min(f.dt, 0.05)); calcRender(); redrawAll(); updateInfo();
        controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera);
      },
      init: function (k) { kit = k; buildScene(); resize(); k.cfg.onTheme(k.state.theme); refreshStageUI(); syncHud(); syncCtrl(); },
      help: { intro: "Choose the system and the concentrations in “Lab”, follow the lesson with the player or press “Titrate”. With “Back to the lesson” the script regains control.",
        items: [["Beaker", "the color of the liquid is that of the indicator at the current pH; the spheres are ions and molecules of the analyte."], ["Burette", "its level drops with the volume added; drops fall while titrant is being added."], ["Graphs", "titration curve, species distribution α(pH) and concentrations on a log scale."], ["Calculation", "step-by-step solution according to the region (start, buffer, equivalence or excess)."], ["Challenge", "eight questions on pH, buffers, equivalence and indicators."]] }
    });
    window.__acb = { pHat: pHat, setSys: setSys, veq: veq1, C: C, P: P };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
