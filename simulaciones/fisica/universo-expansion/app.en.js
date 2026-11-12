/* El universo en expansión — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, C = 299792;
  var N = 140, gal = [], inst, dm, tmpC, G = {}, lab = {};
  var S = { H0: 70, a: 1, obs: 0, sel: 7, t: 0, era: 6 };
  var ERA = [['Big Bang', '0', 'Space-time starts expanding from a very hot, dense state.'], ['Inflation', '10⁻³² s', 'An extremely fast expansion that smooths the universe.'], ['Light nuclei', '3 min', 'Nuclei of H, He and some Li form.'], ['Cosmic microwave background', '380,000 years', 'Atoms form and light travels freely: the oldest radiation we can see.'], ['First stars', '≈ 200 million years', 'Gravity gathers the gas and the first stars ignite.'], ['Galaxies', '≈ 1 billion years', 'Stars gather into galaxies and clusters.'], ['Solar System', '≈ 9.2 billion years', 'The Sun forms, ≈ 4.6 billion years ago.'], ['Today', '13.8 billion years', 'The expansion accelerates because of dark energy.']];
  var OBS = [['ALMA', 'Chajnantor, 5000 m', 'millimetre radio: cold clouds where stars are born'], ['VLT (Paranal)', 'Cerro Paranal, 2635 m', 'optical and infrared: exoplanets and galaxies'], ['Vera C. Rubin Observatory', 'Cerro Pachón, 2700 m', 'maps the whole sky every few nights'], ['ELT (under construction)', 'Cerro Armazones, 3046 m', 'the world’s largest optical telescope (39 m)']];
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  function dMpc(i, j) { return gal[i] && gal[j] ? gal[i].p.distanceTo(gal[j].p) * 30 : 0; }   // 1 unidad = 30 Mpc (hoy)
  function vRec(d) { return S.H0 * d; }
  function zOf(v) { return Math.sqrt((1 + v / C) / (1 - Math.min(0.99, v / C))) - 1; }
  function age() { return 977.8 / S.H0; }   // 1/H0 en miles de millones de años
  function stages() {
    return [
      ['Redshift', 'Redshift', 'Light from distant galaxies arrives shifted towards the red',
        '<p>Splitting a galaxy’s light reveals <b>spectral lines</b> from elements such as hydrogen. In almost every galaxy those lines are <b>shifted towards the red</b> (longer wavelength): z = Δλ/λ. It is the sign that they are <b>moving away</b> from us. The most distant ones have the largest shift (graph «Spectrum»).</p>'],
      ['Hubble’s law', 'Hubble', 'v = H₀·d: the further away, the faster it recedes',
        '<p>In 1929 Edwin Hubble, using data from Vesto Slipher and Henrietta Leavitt’s distance method, found that the <b>recession velocity</b> is proportional to <b>distance</b>: <b>v = H₀·d</b>. The Hubble constant is H₀ ≈ 70 km/s per megaparsec (1 Mpc ≈ 3.26 million light-years). Each point on the graph is a galaxy in the scene.</p>'],
      ['Expansion without a centre', 'Expansion', 'Space stretches: from any galaxy, the others move away',
        '<p>Hubble’s law does not mean we are at the centre: it is <b>space itself</b> that expands, like raisin bread rising in the oven. From <b>any</b> galaxy (change the observer) the view is the same: all the others move away, the more distant ones faster. The universe <b>has no centre</b>.</p>'],
      ['Age of the universe', 'Age', 'If everything moves apart, in the past it was together: t ≈ 1/H₀',
        '<p>If we run the film backwards, the galaxies come together. A simple estimate of the age is the time each would take to reach its present distance: <b>t ≈ d/v = 1/H₀</b>. With H₀ = 70 km/s/Mpc it is ≈ <b>14 billion years</b>; detailed calculations give <b>13.8 billion years</b>.</p>'],
      ['History of the universe', 'History', 'From the Big Bang to galaxies: the universe expands and cools',
        '<p>The <b>Big Bang</b> model describes a universe that began very hot and dense and <b>cooled</b> as it expanded: light nuclei formed, then atoms (releasing the <b>cosmic microwave background</b> radiation), then the first stars, galaxies and, much later, the Solar System. Today the expansion is <b>accelerating</b> because of <b>dark energy</b>.</p>'],
      ['Astronomy in Chile', 'Chile', 'Dry, high, dark skies: Chile hosts a large share of the world’s telescopes',
        '<p>Looking far away is <b>looking into the past</b>: the light from a galaxy 1 billion light-years away left it 1 billion years ago. The <b>Atacama Desert</b>, with its dry air, high altitude and skies free of light pollution, hosts observatories such as <b>ALMA</b>, the <b>VLT</b>, the <b>Vera C. Rubin</b> and the future <b>ELT</b>, which study everything from star formation to the expansion of the universe.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.obs = 0; S.H0 = 70;
    if (i === 0) { S.a = 1; S.sel = [3, 7, 20, 40][Math.min(3, Math.floor(l * 4))]; }
    else if (i === 1) { S.a = 1; S.sel = [3, 7, 20, 40, 60][Math.min(4, Math.floor(l * 5))]; }
    else if (i === 2) { S.a = 0.75 + 0.25 * l; S.obs = l < 0.5 ? 0 : 5; }
    else if (i === 3) { S.a = 1 - 0.95 * l; }
    else if (i === 4) { S.era = Math.min(7, Math.floor(l * 8)); S.a = [0.04, 0.06, 0.08, 0.12, 0.2, 0.35, 0.7, 1][S.era]; }
    else { S.a = 1; S.era = 7; }
  }
  var def = {
    key: 'universo-expansion', title: 'The expanding universe', subtitle: '3D simulator · physics', accent: { dark: '#9775fa', light: '#5f3dc4' }, bg: [0x05070d, 0x10142a],
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2, 9, 24], target: [-2, 0, 0] }, { id: 'sup', label: 'Top', pos: [-2, 28, 1], target: [-2, 0, 0] }],
    layers: [{ id: 'z', label: 'Colour by redshift', icon: '◐' }, { id: 'lines', label: 'Lines to the observer', icon: '╱' }],
    build: function (ctx) {
      var s = ctx.scene, i; tmpC = new T.Color(); dm = new T.Object3D();
      for (i = 0; i < N; i++) { var r = i === 0 ? 0 : 1.6 + 11 * Math.pow(rnd(i), 0.8), th = 2 * Math.PI * rnd(i + 300), ph = Math.acos(2 * rnd(i + 600) - 1); gal.push({ p: new T.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th)), s: 0.18 + 0.22 * rnd(i + 900), rot: rnd(i + 1200) * 3 }); }
      gal.sort(function (a, b) { return a.p.length() - b.p.length(); });
      inst = new T.InstancedMesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({}), N); inst.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3); inst.frustumCulled = false; s.add(inst);
      var stars = []; for (i = 0; i < 600; i++) stars.push((rnd(i + 2000) - 0.5) * 160, (rnd(i + 3000) - 0.5) * 160, (rnd(i + 4000) - 0.5) * 160);
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(stars, 3)); s.add(new T.Points(sg, new T.PointsMaterial({ color: 0x8899bb, size: 0.15 })));
      G.ring = new T.Mesh(new T.TorusGeometry(0.6, 0.05, 8, 32), new T.MeshBasicMaterial({ color: 0xffd43b })); s.add(G.ring);
      G.sel = new T.Mesh(new T.TorusGeometry(0.5, 0.04, 8, 32), new T.MeshBasicMaterial({ color: 0x63e6be })); s.add(G.sel);
      G.lines = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.25 })); s.add(G.lines);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var colz = ctx.layer('z'), o = gal[S.obs].p, pos = [], i;
      for (i = 0; i < N; i++) {
        var g = gal[i], p = g.p.clone().multiplyScalar(S.a); dm.position.copy(p); dm.rotation.set(g.rot, g.rot * 2, 0); dm.scale.set(g.s, g.s * 0.35, g.s); dm.updateMatrix(); inst.setMatrixAt(i, dm.matrix);
        var d = g.p.distanceTo(o) * 30, z = zOf(vRec(d));
        if (i === S.obs) tmpC.setHex(0xffd43b); else if (colz) tmpC.setRGB(clamp(0.55 + z * 4, 0, 1), clamp(0.75 - z * 2.5, 0.15, 1), clamp(1 - z * 5, 0.15, 1)); else tmpC.setHex(0xdee2ff);
        inst.setColorAt(i, tmpC); if (i !== S.obs && i % 3 === 0) pos.push(o.x * S.a, o.y * S.a, o.z * S.a, p.x, p.y, p.z);
      }
      inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
      G.lines.visible = ctx.layer('lines'); G.lines.geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      G.ring.position.copy(o).multiplyScalar(S.a); G.ring.lookAt(ctx.camera.position);
      var sp = gal[S.sel].p.clone().multiplyScalar(S.a); G.sel.position.copy(sp); G.sel.lookAt(ctx.camera.position); G.sel.visible = S.sel !== S.obs;
      var d = dMpc(S.sel, S.obs), v = vRec(d);
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(G.ring.position.x, G.ring.position.y + 1, G.ring.position.z).set(S.obs ? 'Observer in another galaxy' : 'Milky Way (us)', 'bl-lead').vis(true);
      if (G.sel.visible && S.a > 0.5) lab.b.pos(sp.x, sp.y + 0.9, sp.z).set('d = ' + fmt(d * S.a, 0) + ' Mpc · v = ' + fmt(v, 0) + ' km/s · z = ' + fmt(zOf(v), 3), 'bl-pos').vis(true);
      lab.c.pos(-2, 7.5, 0).set('Scale factor a = ' + f2(S.a) + (S.a < 1 ? ' (past: everything closer)' : ' (today)'), 'bl-d').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.d.pos(-2, -6, 0).set(ERA[S.era][0] + ' · ' + ERA[S.era][1], 'bl-warn').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.H0 && u.H0.set(S.H0); u.a && u.a.set(S.a); } },
    hud: function () { return { eq: { chip: 'H₀', name: 'Expanding universe', body: '<div class="eqline"><small>Hubble</small>v = H₀·d</div><div class="eqline"><small>Redshift</small>z = Δλ/λ ≈ v/c</div><div class="eqline"><small>Approx. age</small>t ≈ 1/H₀</div>' }, legend: [{ label: 'Yellow', color: '#ffd43b', text: 'observer’s galaxy' }, { label: 'Blue to red', color: '#ff8787', text: 'larger redshift' }, { label: 'Green ring', color: '#63e6be', text: 'selected galaxy' }] }; },
    measures: function () { var d = dMpc(S.sel, S.obs), v = vRec(d); return [['H₀', fmt(S.H0, 0) + ' km/s/Mpc'], ['Distance', fmt(d, 0) + ' Mpc (' + fmt(d * 3.26, 0) + ' million light-years)'], ['Recession velocity', fmt(v, 0) + ' km/s'], ['Redshift z', fmt(zOf(v), 4)], ['Age ≈ 1/H₀', f1(age()) + ' billion years'], ['Scale factor', f2(S.a)]]; },
    ideas: ['Distant galaxies: spectral lines shifted to the red.', '<b>v = H₀·d</b> (H₀ ≈ 70 km/s/Mpc).', 'Space itself expands: there is no centre.', 'Age ≈ 1/H₀ ≈ 14 billion years (13.8 measured).', 'Big Bang: hot and dense → expands and cools.', 'Looking far away is looking into the past.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Universe'); el.appendChild(c);
      ui.H0 = kit.ui.slider({ label: 'Hubble constant H₀ (km/s/Mpc)', min: 50, max: 100, step: 1, value: S.H0, digits: 0, onInput: function (v) { ctx.goManual(); S.H0 = v; } });
      ui.a = kit.ui.slider({ label: 'Scale factor a (1 = today)', min: 0.05, max: 1.5, step: 0.01, value: S.a, digits: 2, onInput: function (v) { ctx.goManual(); S.a = v; } });
      ui.sel = kit.ui.slider({ label: 'Selected galaxy (no.)', min: 1, max: N - 1, step: 1, value: S.sel, digits: 0, onInput: function (v) { ctx.goManual(); S.sel = v; } });
      c.appendChild(kit.ui.sliders([ui.H0, ui.a, ui.sel]));
      el.appendChild(ctx.btnRow([{ t: 'Observe from another galaxy', primary: true, fn: function () { ctx.goManual(); S.obs = S.obs ? 0 : 5 + Math.floor(Math.random() * 40); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
      var c2 = kit.ui.card('Observatories in Chile'); c2.insertAdjacentHTML('beforeend', kit.ui.table(['Observatory', 'Site', 'What it studies'], OBS)); el.appendChild(c2);
      var c3 = kit.ui.card('Timeline'); c3.insertAdjacentHTML('beforeend', kit.ui.table(['Stage', 'Time', 'What happens'], ERA)); el.appendChild(c3);
    },
    graphs: [
      { title: 'Hubble diagram', h: 230, note: 'Each point is a galaxy in the scene seen from the observer. The slope of the line is H₀.', draw: function (cx, w, h, col) {
        var L = 52, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, dmax = 450, vmax = 100 * dmax, sx = function (d) { return L + pw * d / dmax; }, sy = function (v) { return Tp + ph - ph * v / vmax; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(vmax * i / 4)); cx.lineTo(L + pw, sy(vmax * i / 4)); cx.stroke(); cx.fillText(fmt(vmax * i / 4000, 0) + 'k', L - 5, sy(vmax * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= dmax; i += 150) cx.fillText(i, sx(i), h - B + 13); cx.fillText('d (Mpc)  ·  v (km/s)', L + pw / 2, h - 3);
        cx.strokeStyle = '#9775fa'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(dmax), sy(S.H0 * dmax)); cx.stroke(); cx.lineWidth = 1;
        for (i = 1; i < N; i++) { if (i === S.obs) continue; var d = dMpc(i, S.obs); if (d > dmax) continue; var sc = 1 + 0.06 * Math.sin(i * 7.3); cx.fillStyle = i === S.sel ? '#20c997' : 'rgba(255,146,43,.7)'; cx.beginPath(); cx.arc(sx(d), sy(S.H0 * d * sc), i === S.sel ? 5 : 2.6, 0, 7); cx.fill(); }
      } },
      { title: 'Spectrum of the selected galaxy', h: 160, note: 'Top: hydrogen lines in the laboratory. Bottom: the same lines in the galaxy, redshifted by a factor (1 + z).', draw: function (cx, w, h, col) {
        var L = 20, R = 20, pw = w - L - R, lo = 380, hi = 760, sx = function (l) { return L + pw * (l - lo) / (hi - lo); }, z = zOf(vRec(dMpc(S.sel, S.obs))), lines = [410.2, 434.0, 486.1, 656.3], k;
        function band(y, hh) { for (k = 0; k < pw; k += 2) { var l = lo + (hi - lo) * k / pw; cx.fillStyle = 'hsl(' + clamp(270 - (l - 380) * 0.75, 0, 270) + ',85%,55%)'; cx.fillRect(L + k, y, 2, hh); } }
        band(14, 40); band(84, 40); cx.fillStyle = '#000';
        lines.forEach(function (l) { cx.fillRect(sx(l) - 1, 14, 3, 40); var l2 = l * (1 + z); if (l2 < hi) cx.fillRect(sx(l2) - 1, 84, 3, 40); });
        cx.fillStyle = col.ink; cx.font = '11px system-ui'; cx.textAlign = 'left'; cx.fillText('Laboratory', L, 10); cx.fillText('Galaxy · z = ' + fmt(z, 3), L, 80); cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.fillText('380 nm', sx(400), h - 6); cx.fillText('760 nm', sx(740), h - 6);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, d = dMpc(S.sel, S.obs), v = vRec(d), z = zOf(v);
      return '<div class="card-kicker">Galaxy no. ' + S.sel + '</div><table class="calc-table">' + row('Hubble’s law', 'v = H₀·d = ' + fmt(S.H0, 0) + ' · ' + fmt(d, 0) + ' = <b>' + fmt(v, 0) + ' km/s</b>') + row('Redshift', 'z ≈ v/c = ' + fmt(v / C, 4) + ' (relativistic: ' + fmt(z, 4) + ')') + row('Hα line (656.3 nm)', 'observed at <b>' + fmt(656.3 * (1 + z), 1) + ' nm</b>') + row('Light travel time', '≈ <b>' + fmt(d * 3.26, 0) + ' million years</b>') + row('Age of the universe ≈ 1/H₀', '<b>' + f1(age()) + ' billion years</b>') + '</table>';
    },
    quiz: [
      { q: 'The redshift of galaxies shows that they…', options: ['are moving away from us', 'are approaching', 'are hotter', 'are younger'], answer: 0, why: 'The observed wavelength increases.' },
      { q: 'According to Hubble’s law, a galaxy twice as far away recedes…', options: ['twice as fast', 'at the same speed', 'at half the speed', 'four times as fast'], answer: 0, why: 'v = H₀·d is proportional.' },
      { q: 'With H₀ = 70 km/s/Mpc, a galaxy at 100 Mpc recedes at…', options: ['7000 km/s', '70 km/s', '170 km/s', '700,000 km/s'], answer: 0, why: '70 · 100 = 7000.' },
      { q: 'Are we at the centre of the expansion?', options: ['No: every galaxy sees the same thing', 'Yes, the Milky Way is the centre', 'Yes, the Sun is the centre', 'It is unknown'], answer: 0, why: 'Space itself expands.' },
      { q: 'The age of the universe is about…', options: ['13.8 billion years', '4.6 billion years', '6000 years', 'infinite'], answer: 0, why: '4.6 billion years is the age of the Solar System.' },
      { q: 'The microwave background radiation was released when…', options: ['the first atoms formed', 'the Sun was born', 'the Earth formed', 'the first galaxies lit up'], answer: 0, why: '≈ 380,000 years after the Big Bang.' },
      { q: 'Chile hosts many observatories because…', options: ['the north has dry, high, dark skies', 'it is near the equator', 'gravity is weaker', 'nights are longer'], answer: 0, why: 'The Atacama Desert is ideal for observing.' },
      { q: 'When we observe a galaxy 1 billion light-years away we see it…', options: ['as it was 1 billion years ago', 'as it is today', 'in the future', 'with no delay'], answer: 0, why: 'The light took that long to arrive.' }
    ],
    help: { intro: 'The flattened spheres are galaxies; the yellow one is the observer. In «Lab» change H₀, the scale factor (past or future) and the selected galaxy, or observe from another galaxy.', items: [['Colours', 'from blue to red, larger redshift.'], ['Graphs', 'Hubble diagram and spectrum with hydrogen lines.'], ['Tables', 'observatories in Chile and timeline of the universe.']], try: ['Observe from another galaxy: does the shape of the Hubble diagram change?', 'Raise H₀: what happens to the estimated age?', 'Choose a distant galaxy and see where the Hα line appears.'] }
  };
  MSim.create(def);
})();
