/* Tectónica de placas y sismos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, VP = 6, VS = 3.5;
  var B = { conv: { n: 'Convergent (subduction)', ej: 'Nazca plate beneath the South American plate (Chile)' }, div: { n: 'Divergent (ridge)', ej: 'Mid-Atlantic Ridge, Iceland' }, trans: { n: 'Transform (fault)', ej: 'San Andreas Fault (USA)' } };
  var S = { b: 'conv', mv: 0, quake: false, tq: 0, depth: 30, dist: 120, M: 7, cut: true };
  var G = {}, lab = {}, K = 0.035;   // unidades por km en la vista del sismo
  function dSP(dt) { return dt * VP * VS / (VP - VS); }
  function stages() {
    return [
      ['Tectonic plates', 'Plates', 'The lithosphere is broken into plates that move over the mantle',
        '<p>The Earth’s rigid outer layer, the <b>lithosphere</b> (crust and uppermost mantle), is broken into <b>tectonic plates</b> that move a few <b>centimetres a year</b>, driven by <b>convection currents</b> in the mantle and by the weight of sinking plates. Earthquakes and volcanoes cluster at their <b>boundaries</b>.</p>'],
      ['Convergent boundary: subduction', 'Convergent', 'An oceanic plate sinks beneath a continental one: trench, mountains and volcanoes',
        '<p>Off Chile, the <b>Nazca plate</b> (oceanic, denser) slides beneath the <b>South American plate</b> at about <b>6–7 cm a year</b>: it is a <b>subduction</b> zone. An <b>oceanic trench</b>, the <b>Andes mountains</b> and volcanoes form, because the sinking plate releases water that partly melts the mantle. Friction between the plates produces Chile’s great earthquakes.</p>'],
      ['Divergent boundary', 'Divergent', 'Two plates move apart and magma forms new oceanic crust',
        '<p>At a <b>divergent boundary</b> the plates move apart. The mantle rises, partly melts and the <b>magma</b> builds new crust at <b>mid-ocean ridges</b>, such as the Mid-Atlantic Ridge. Rocks are younger near the ridge and older further away. There are shallow earthquakes and basaltic volcanism (Iceland).</p>'],
      ['Transform boundary', 'Transform', 'The plates slide sideways past each other',
        '<p>At a <b>transform boundary</b> the plates slide <b>sideways</b>, neither creating nor destroying crust, as along the <b>San Andreas Fault</b>. Friction locks them, they build up stress for years and release it suddenly in an <b>earthquake</b>. There are usually no volcanoes.</p>'],
      ['Earthquakes and seismic waves', 'Earthquake', 'P waves (faster) and S waves (slower) leave the focus',
        '<p>An <b>earthquake</b> is the sudden release of energy stored in a fault. The rupture point is the <b>focus</b> (hypocentre) and the point above it on the surface, the <b>epicentre</b>. <b>P waves</b> (primary, longitudinal, ≈ 6 km/s, through solids and liquids) and <b>S waves</b> (secondary, transverse, ≈ 3.5 km/s, only through solids) radiate out. At the surface, surface waves cause most of the damage.</p>'],
      ['Locating and measuring an earthquake', 'Measure', 'The S − P delay gives the distance; magnitude measures the energy released',
        '<p>A <b>seismograph</b> records the P waves first and then the S waves. The further away the epicentre, the longer the delay: <b>d ≈ 8.4 km per second of S − P difference</b>. Three stations locate the epicentre (triangulation). <b>Magnitude</b> measures energy: each extra unit releases ≈ <b>32 times</b> more energy. Chile recorded the largest earthquake ever measured: Valdivia 1960, magnitude 9.5. Prevention: earthquake-resistant building, evacuation plans and <b>tsunami</b> warnings.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.quake = false;
    if (i === 0) { S.b = 'conv'; S.mv = l; }
    else if (i === 1) { S.b = 'conv'; S.mv = l; }
    else if (i === 2) { S.b = 'div'; S.mv = l; }
    else if (i === 3) { S.b = 'trans'; S.mv = l; }
    else { S.b = 'conv'; S.quake = true; S.tq = l * (i === 4 ? 45 : 60); S.dist = i === 5 ? 60 + 180 * Math.floor(l * 3) / 2 : 120; }
  }
  function box(w, h, d, c, o) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}))); }
  var def = {
    key: 'tectonica-sismos', title: 'Plate tectonics and earthquakes', subtitle: '3D simulator · Earth sciences', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2, 6, 15], target: [-1.5, -0.5, 0] }, { id: 'corte', label: 'Section', pos: [-1.5, 0.5, 16], target: [-1.5, -1, 0] }, { id: 'sup', label: 'Top', pos: [-1.5, 17, 2], target: [-1.5, 0, 0] }],
    layers: [{ id: 'arr', label: 'Plate motion', icon: '➜' }, { id: 'conv', label: 'Mantle convection', icon: '↻' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      G.mantle = box(14, 3, 5, 0xe8590c, { emissive: 0x3d1200 }); G.mantle.position.set(0, -3.4, 0); G.root.add(G.mantle);
      G.oc = box(7, 0.7, 5, 0x364fc7); G.co = box(7, 1.3, 5, 0x8d6e4f); G.root.add(G.oc); G.root.add(G.co);
      G.slab = box(5, 0.7, 5, 0x364fc7); G.root.add(G.slab);
      G.sea = box(7, 0.5, 5, 0x4dabf7, { transparent: true, opacity: 0.35 }); G.root.add(G.sea);
      G.andes = new T.Mesh(new T.ConeGeometry(1.2, 1.8, 4), new T.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 })); G.root.add(G.andes);
      G.volc = new T.Mesh(new T.ConeGeometry(0.6, 1.2, 16), new T.MeshStandardMaterial({ color: 0x5c3b2e })); G.root.add(G.volc);
      G.mag = box(0.5, 3, 5, 0xff6b2b, { emissive: 0x7a1c00 }); G.root.add(G.mag);
      G.cells = []; for (var k = 0; k < 2; k++) { var c = new T.Mesh(new T.TorusGeometry(1.3, 0.06, 8, 40), new T.MeshBasicMaterial({ color: 0xffd8a8 })); c.position.set(k ? 3.2 : -3.2, -3.4, 2.6); G.root.add(c); G.cells.push(c); }
      G.aL = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1.6, 0xffffff, 0.4, 0.3); G.aR = new T.ArrowHelper(new T.Vector3(-1, 0, 0), new T.Vector3(), 1.6, 0xffffff, 0.4, 0.3); G.root.add(G.aL); G.root.add(G.aR);
      // sismo
      G.hypo = new T.Mesh(new T.SphereGeometry(0.18, 14, 10), new T.MeshBasicMaterial({ color: 0xffd43b })); G.root.add(G.hypo);
      G.wP = new T.Mesh(new T.SphereGeometry(1, 32, 16), new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })); G.root.add(G.wP);
      G.wS = new T.Mesh(new T.SphereGeometry(1, 32, 16), new T.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false })); G.root.add(G.wS);
      G.st = new T.Mesh(new T.CylinderGeometry(0.15, 0.25, 0.5, 8), new T.MeshStandardMaterial({ color: 0x51cf66 })); G.root.add(G.st);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      else { S.mv = (S.mv + dt * 0.08) % 1; if (S.quake) { S.tq += dt * 6; if (S.tq > 70) S.tq = 0; } }
      var arr = ctx.layer('arr'), cv = ctx.layer('conv'), ph = S.mv * 0.8;
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      G.cells.forEach(function (c, k) { c.visible = cv; c.rotation.z = (k ? -1 : 1) * ctx.now * 0.6; });
      G.slab.visible = G.andes.visible = G.volc.visible = false; G.mag.visible = false; G.sea.visible = true;
      if (S.b === 'conv') {
        G.oc.position.set(-3.5 + ph, 0, 0); G.co.position.set(3.5, 0.3, 0); G.oc.scale.x = 1; G.co.scale.z = 1;
        G.slab.visible = true; G.slab.position.set(0.9 + ph * 0.5, -1.6 - ph * 0.3, 0); G.slab.rotation.z = -0.55;
        G.sea.position.set(-3.5, 0.55, 0); G.andes.visible = true; G.andes.position.set(3.2, 1.85, 0); G.volc.visible = true; G.volc.position.set(4.6, 1.5, 0);
        G.aL.position.set(-4, 1.3, 2.2); G.aL.setDirection(new T.Vector3(1, 0, 0)); G.aR.position.set(5, 1.6, 2.2); G.aR.setDirection(new T.Vector3(-1, 0, 0));
        lab.a.pos(-3.5, 1.6, 0).set('Oceanic plate (Nazca)', 'bl-lead').vis(true); lab.b.pos(3.5, 3.2, 0).set('Continental plate (South American)', 'bl-pos').vis(true); lab.c.pos(0.2, 0.9, 0).set('Trench', 'bl-d').vis(!S.quake);
      } else if (S.b === 'div') {
        G.oc.position.set(-3.6 - ph, 0, 0); G.co.position.set(3.6 + ph, 0, 0); G.co.material.color.setHex(0x364fc7); G.co.scale.set(1, 0.55, 1);
        G.mag.visible = true; G.mag.position.set(0, -1.4, 0); G.mag.scale.x = 0.5 + ph * 2.5; G.sea.position.set(0, 0.55, 0); G.sea.scale.x = 2;
        G.aL.position.set(-1.5, 1.2, 2.2); G.aL.setDirection(new T.Vector3(-1, 0, 0)); G.aR.position.set(1.5, 1.2, 2.2); G.aR.setDirection(new T.Vector3(1, 0, 0));
        lab.a.pos(0, 1.8, 0).set('Ridge: magma rises and new crust forms', 'bl-warn').vis(true);
      } else {
        G.oc.position.set(-3.5, 0, -ph * 2); G.co.position.set(3.5, 0, ph * 2); G.co.material.color.setHex(0x8d6e4f); G.co.scale.set(1, 0.55, 1); G.sea.visible = false;
        G.aL.position.set(-3.5, 1.2, 0); G.aL.setDirection(new T.Vector3(0, 0, -1)); G.aR.position.set(3.5, 1.2, 0); G.aR.setDirection(new T.Vector3(0, 0, 1));
        lab.a.pos(0, 1.6, 0).set('Fault: the plates slide sideways', 'bl-warn').vis(true);
      }
      if (S.b === 'conv') { G.co.material.color.setHex(0x8d6e4f); G.co.scale.set(1, 1, 1); G.sea.scale.x = 1; }
      G.aL.visible = G.aR.visible = arr;
      // sismo
      var q = S.quake; G.hypo.visible = G.wP.visible = G.wS.visible = G.st.visible = q;
      [G.oc, G.co, G.slab, G.mantle, G.andes, G.volc].forEach(function (m) { m.material.transparent = true; m.material.opacity = q ? 0.4 : 1; m.material.depthWrite = !q; });
      if (q) {
        var hx = 0.9, hy = 0.5 - S.depth * K, rP = VP * S.tq * K, rS = VS * S.tq * K, sx = hx + S.dist * K;
        G.hypo.position.set(hx, hy, 0); G.wP.position.copy(G.hypo.position); G.wS.position.copy(G.hypo.position); G.wP.scale.setScalar(Math.max(0.01, rP)); G.wS.scale.setScalar(Math.max(0.01, rS));
        G.st.position.set(sx, 1.25, 0);
        var D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS;
        lab.b.pos(hx, hy - 0.6, 1.5).set('Focus · ' + fmt(S.depth, 0) + ' km', 'bl-warn').vis(true);
        lab.c.pos(hx, 2.4, 0).set('Epicentre', 'bl-lead').vis(true);
        lab.d.pos(sx, 2.3, 0).set('Station at ' + fmt(S.dist, 0) + ' km · t = ' + f1(S.tq) + ' s · ' + (S.tq < tP ? 'nothing yet' : S.tq < tS ? 'P wave arrived' : 'P and S arrived (S − P = ' + f1(tS - tP) + ' s)'), 'bl-pos').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.b && u.b.set(S.b); u.dist && u.dist.set(S.dist); } },
    hud: function () { return { eq: { chip: '⟷', name: B[S.b].n, body: '<div class="eqline"><small>Example</small>' + B[S.b].ej + '</div><div class="eqline"><small>Distance to the epicentre</small>d ≈ 8.4 km · (t<sub>S</sub> − t<sub>P</sub>)</div><div class="eqline"><small>Magnitude</small>+1 unit ≈ ×32 in energy</div>' }, legend: [{ label: 'Blue', color: '#364fc7', text: 'oceanic crust' }, { label: 'Brown', color: '#8d6e4f', text: 'continental crust' }, { label: 'Orange', color: '#e8590c', text: 'mantle' }, { label: 'Spheres', color: '#4dabf7', text: 'P wave (blue) and S wave (red)' }] }; },
    measures: function () { var D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS; return [['Boundary type', B[S.b].n], ['Focus depth', fmt(S.depth, 0) + ' km'], ['Epicentral distance', fmt(S.dist, 0) + ' km'], ['P wave arrival', f1(tP) + ' s'], ['S wave arrival', f1(tS) + ' s'], ['S − P difference', f1(tS - tP) + ' s'], ['Magnitude', f1(S.M) + ' (energy ×' + fmt(Math.pow(31.6, S.M - 5), 0) + ' relative to M 5)']]; },
    ideas: ['Lithosphere split into plates moving cm/year.', 'Convergent: subduction, trench, mountains and volcanoes (Chile).', 'Divergent: ridge and new crust; transform: sideways fault.', 'P waves (≈ 6 km/s) arrive before S waves (≈ 3.5 km/s).', 'Distance ≈ 8.4 km × (t<sub>S</sub> − t<sub>P</sub>).', '+1 magnitude ≈ 32 times more energy.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Plates'); el.appendChild(c);
      ui.b = kit.ui.options({ label: 'Boundary type', cols: 3, value: S.b, options: Object.keys(B).map(function (k) { return { v: k, label: B[k].n.split(' (')[0] }; }), onChange: function (v) { ctx.goManual(); S.b = v; S.quake = false; } }); c.appendChild(ui.b);
      var c2 = kit.ui.card('Earthquake'); el.appendChild(c2);
      ui.depth = kit.ui.slider({ label: 'Focus depth (km)', min: 5, max: 70, step: 5, value: S.depth, digits: 0, onInput: function (v) { ctx.goManual(); S.depth = v; } });
      ui.dist = kit.ui.slider({ label: 'Distance to the station (km)', min: 20, max: 300, step: 10, value: S.dist, digits: 0, onInput: function (v) { ctx.goManual(); S.dist = v; } });
      ui.M = kit.ui.slider({ label: 'Magnitude', min: 3, max: 9.5, step: 0.1, value: S.M, digits: 1, onInput: function (v) { ctx.goManual(); S.M = v; } });
      c2.appendChild(kit.ui.sliders([ui.depth, ui.dist, ui.M]));
      c2.appendChild(ctx.btnRow([{ t: 'Trigger earthquake', primary: true, fn: function () { ctx.goManual(); S.b = 'conv'; S.quake = true; S.tq = 0; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Station seismogram', h: 210, note: 'First the P wave arrives (small) and then the S wave (larger). The S − P delay grows with distance.', draw: function (cx, w, h, col) {
        var L = 30, R = 10, Tp = 10, Bm = 26, pw = w - L - R, ph = h - Tp - Bm, D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS, tm = Math.max(70, tS + 15), sx = function (t) { return L + pw * t / tm; }, i;
        cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(L, Tp + ph / 2); cx.lineTo(L + pw, Tp + ph / 2); cx.stroke();
        cx.strokeStyle = col.ink; cx.lineWidth = 1.2; cx.beginPath(); var A = 0.25 + 0.07 * (S.M - 3);
        for (i = 0; i <= 600; i++) { var t = tm * i / 600, y = 0.03 * Math.sin(i * 1.7); if (t > tP) y += A * 0.35 * Math.exp(-(t - tP) / 6) * Math.sin((t - tP) * 9); if (t > tS) y += A * Math.exp(-(t - tS) / 9) * Math.sin((t - tS) * 5.5); if (S.quake && t > S.tq) y = 0; var Y = Tp + ph / 2 - y * ph / 1.1; if (i) cx.lineTo(sx(t), Y); else cx.moveTo(sx(t), Y); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#4dabf7'; cx.fillRect(sx(tP) - 1, Tp, 2, ph); cx.fillStyle = '#ff6b6b'; cx.fillRect(sx(tS) - 1, Tp, 2, ph);
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= tm; i += 10) cx.fillText(i, sx(i), h - Bm + 13); cx.fillText('t (s) · P: ' + fmt(tP, 1) + ' s · S: ' + fmt(tS, 1) + ' s', L + pw / 2, h - 3);
      } },
      { title: 'Energy by magnitude', h: 190, note: 'Logarithmic scale: each unit of magnitude releases ≈ 32 times more energy.', draw: function (cx, w, h, col) {
        var L = 40, R = 10, Tp = 10, Bm = 26, pw = w - L - R, ph = h - Tp - Bm, sx = function (m) { return L + pw * (m - 3) / 7; }, sy = function (m) { return Tp + ph - ph * (m - 3) / 7; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 3; i <= 10; i++) cx.fillText(i, sx(i), h - Bm + 13); cx.fillText('magnitude  ·  log₁₀ of relative energy', L + pw / 2, h - 3);
        [['Valdivia 1960', 9.5], ['Maule 2010', 8.8], ['Illapel 2015', 8.3]].forEach(function (q) { cx.fillStyle = 'rgba(255,146,43,.3)'; cx.fillRect(sx(q[1]) - 2, Tp, 4, ph); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(q[0], sx(q[1]) - 4, sy(q[1] - 0.7)); });
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(sx(3), sy(3)); cx.lineTo(sx(10), sy(10)); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.M), sy(S.M), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS;
      return '<div class="card-kicker">Earthquake · M ' + f1(S.M) + '</div><table class="calc-table">' + row('Distance to the focus', '√(' + fmt(S.dist, 0) + '² + ' + fmt(S.depth, 0) + '²) = <b>' + f1(D) + ' km</b>') + row('t<sub>P</sub> = d/v<sub>P</sub>', f1(D) + '/6 = <b>' + f1(tP) + ' s</b>') + row('t<sub>S</sub> = d/v<sub>S</sub>', f1(D) + '/3.5 = <b>' + f1(tS) + ' s</b>') + row('Distance from S − P', fmt(8.4, 1) + ' · ' + f1(tS - tP) + ' = <b>' + f1(dSP(tS - tP)) + ' km</b>') + row('Energy relative to M 5', '31.6^(' + f1(S.M) + ' − 5) ≈ <b>' + fmt(Math.pow(31.6, S.M - 5), 0) + ' times</b>') + '</table>';
    },
    quiz: [
      { q: 'Tectonic plates move roughly…', options: ['a few centimetres a year', 'a few metres a day', 'kilometres a year', 'they do not move'], answer: 0, why: 'About as fast as fingernails grow.' },
      { q: 'Off Chile, the Nazca plate…', options: ['sinks beneath the South American plate', 'moves away from the South American plate', 'slides sideways', 'is still'], answer: 0, why: 'It is a subduction zone.' },
      { q: 'At a mid-ocean ridge…', options: ['new oceanic crust forms', 'crust is destroyed', 'two continents collide', 'there is no activity'], answer: 0, why: 'Divergent boundary: magma rises.' },
      { q: 'The San Andreas Fault is a … boundary', options: ['transform', 'convergent', 'divergent', 'subduction'], answer: 0, why: 'The plates slide sideways.' },
      { q: 'The epicentre of an earthquake is…', options: ['the point on the surface above the focus', 'the place deep down where the rock breaks', 'the seismic station', 'always the place of greatest damage'], answer: 0, why: 'The focus is deep underground.' },
      { q: 'A seismograph first records the … wave', options: ['P', 'S', 'surface', 'all at once'], answer: 0, why: 'The P wave is the fastest.' },
      { q: 'The S − P difference is 10 s. The distance to the earthquake is about…', options: ['84 km', '10 km', '35 km', '600 km'], answer: 0, why: 'd ≈ 8.4 km per second of difference.' },
      { q: 'Compared with a magnitude 7 earthquake, a magnitude 8 one releases…', options: ['≈ 32 times more energy', 'twice the energy', '10 % more energy', 'the same energy'], answer: 0, why: 'The scale is logarithmic.' }
    ],
    help: { intro: 'Choose a type of plate boundary in «Lab» or trigger an earthquake to see how P and S waves travel to a station.', items: [['Boundaries', 'convergent (subduction), divergent (ridge) and transform (fault).'], ['Earthquake', 'blue sphere: P wave; red: S wave; green cylinder: seismic station.'], ['Graphs', 'seismogram and energy by magnitude, with Chile’s great earthquakes.']], try: ['Move the station further away: how does the S − P delay change?', 'Compare the three boundary types: where are there volcanoes?', 'Raise the magnitude from 7 to 9: how many times more energy?'] }
  };
  MSim.create(def);
})();
