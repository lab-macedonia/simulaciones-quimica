/* Clima y cambio climático — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, SIG = 5.67e-8;
  // datos aproximados: CO₂ anual en Mauna Loa (NOAA) y anomalía de temperatura global respecto de 1951–1980 (NASA GISTEMP)
  var DAT = [[1960, 317, -0.03], [1965, 320, -0.10], [1970, 326, 0.03], [1975, 331, -0.01], [1980, 339, 0.26], [1985, 346, 0.12], [1990, 354, 0.45], [1995, 361, 0.45], [2000, 370, 0.39], [2005, 380, 0.68], [2010, 390, 0.72], [2015, 401, 0.90], [2020, 414, 1.01], [2023, 421, 1.17], [2024, 424, 1.28]];
  var S = { S0: 1361, alb: 0.30, gh: true, co2: 280, fb: true, yr: 2024 };
  var G = {}, lab = {}, rays = [], irs = [];
  function ice(Ts) { return clamp(0.11 - 0.012 * (Ts - 288), 0, 0.4); }
  function model() {
    var Ts = 288, a = S.alb, Te, k;
    for (k = 0; k < 30; k++) { a = S.fb ? clamp(S.alb + 0.6 * (ice(Ts) - 0.11), 0.1, 0.6) : S.alb; Te = Math.pow(S.S0 / 4 * (1 - a) / SIG, 0.25); var dF = 5.35 * Math.log(S.co2 / 280), Gh = S.gh ? 33 + 0.8 * dF * (S.fb ? 1 : 0.75) : 0; Ts = Te + Gh; }
    return { Te: Te, Ts: Ts, a: a, dF: 5.35 * Math.log(S.co2 / 280), ice: ice(Ts) };
  }
  function stages() {
    return [
      ['Climate as a system', 'System', 'Atmosphere, oceans, ice, land and living things interact',
        '<p><b>Weather</b> is the state of the atmosphere at a given moment (it is raining today); <b>climate</b> is the average over decades in a place. Climate is a <b>dynamic system</b>: the <b>atmosphere</b>, <b>hydrosphere</b> (oceans), <b>cryosphere</b> (ice), <b>geosphere</b> and <b>biosphere</b> exchange energy, water and carbon, and a change in one part affects the others.</p>'],
      ['Energy balance', 'Balance', 'What comes in from the Sun must equal what leaves as infrared',
        '<p>The Earth receives <b>sunlight</b> (≈ 1361 W/m² outside the atmosphere) and reflects ≈ 30 % (the <b>albedo</b>). The rest warms it and it emits <b>infrared radiation</b>. At equilibrium, the energy coming in equals the energy going out. Without an atmosphere, that balance would give a mean temperature of ≈ <b>−18 °C</b>.</p>'],
      ['Natural greenhouse effect', 'Greenhouse', 'Greenhouse gases send part of the infrared back: +33 °C',
        '<p>Water vapour, CO₂, methane and other <b>greenhouse gases</b> absorb part of the infrared emitted by the surface and re-emit it in all directions, including downwards. This raises the mean temperature from −18 °C to ≈ <b>15 °C</b>. This <b>natural greenhouse effect</b> makes life as we know it possible.</p>'],
      ['Albedo and the ice feedback', 'Albedo', 'Less ice, less reflection, more warming',
        '<p>Ice and snow reflect a lot of light (high albedo); oceans and forests reflect little. If the Earth warms, ice melts, the surface darkens and absorbs more energy: it warms even more. This is a <b>positive feedback</b>, which amplifies changes. Water vapour gives another: warmer air holds more vapour, which is a greenhouse gas.</p>'],
      ['Rising CO₂', 'CO₂', 'From 280 to over 420 ppm since 1850: the Earth has warmed ≈ 1.2 °C',
        '<p>Since the Industrial Revolution, burning <b>fossil fuels</b> and deforestation have raised CO₂ from <b>280 ppm</b> to over <b>420 ppm</b>, as the Mauna Loa measurements show (the Keeling curve). More CO₂ means a <b>radiative forcing</b> ΔF = 5.35·ln(C/280) W/m², and global temperature has already risen ≈ <b>1.2 °C</b>. The data in the graph are real measurements.</p>'],
      ['Scenarios and action', 'Future', 'Future warming depends on how much CO₂ we emit',
        '<p>If CO₂ reached 560 ppm (double the pre-industrial level), the model predicts ≈ <b>3 °C</b> more. Consequences: heatwaves, <b>droughts</b> (central Chile has been in a megadrought since 2010), retreating <b>glaciers</b>, sea-level rise and loss of biodiversity. <b>Mitigation</b> (renewable energy, efficiency, clean transport, protecting forests) and <b>adaptation</b> reduce the risks.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.S0 = 1361; S.alb = 0.3; S.fb = true;
    if (i === 0) { S.gh = true; S.co2 = 280; }
    else if (i === 1) { S.gh = false; S.co2 = 280; S.fb = false; }
    else if (i === 2) { S.gh = l > 0.4; S.co2 = 280; S.fb = false; }
    else if (i === 3) { S.gh = true; S.co2 = 280; S.alb = 0.3 + 0.08 * Math.sin(l * Math.PI * 2); }
    else if (i === 4) { S.gh = true; var k = Math.min(DAT.length - 1, Math.floor(l * DAT.length)); S.yr = DAT[k][0]; S.co2 = DAT[k][1]; }
    else { S.gh = true; S.co2 = [420, 450, 560, 800][Math.min(3, Math.floor(l * 4))]; }
  }
  var def = {
    key: 'clima', title: 'Climate and climate change', subtitle: '3D simulator · Earth sciences', accent: { dark: '#4dabf7', light: '#1864ab' }, bg: [0x05070d, 0x0f1b2d],
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.5, 2.5, 16], target: [-1.5, 0, 0] }, { id: 'polo', label: 'Pole', pos: [-1.5, 15, 4], target: [-1.5, 0, 0] }],
    layers: [{ id: 'sun', label: 'Sunlight', icon: '☀' }, { id: 'ir', label: 'Infrared', icon: '〰' }],
    build: function (ctx) {
      var s = ctx.scene; G.earth = new T.Mesh(new T.SphereGeometry(3, 48, 32), new T.MeshStandardMaterial({ color: 0x1c7ed6, roughness: 0.6 })); s.add(G.earth);
      G.land = []; for (var k = 0; k < 7; k++) { var c = new T.Mesh(new T.SphereGeometry(3.02, 24, 16, k * 0.9, 0.55, 0.9 + (k % 3) * 0.25, 0.5), new T.MeshStandardMaterial({ color: 0x5c940d, roughness: 0.9 })); G.earth.add(c); G.land.push(c); }
      G.capN = new T.Mesh(new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, 0, 0.5), new T.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3 })); G.earth.add(G.capN);
      G.capS = new T.Mesh(new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, Math.PI - 0.5, 0.5), new T.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3 })); G.earth.add(G.capS);
      G.atm = new T.Mesh(new T.SphereGeometry(3.7, 40, 28), new T.MeshBasicMaterial({ color: 0xff8787, transparent: true, opacity: 0.12, side: T.BackSide, depthWrite: false })); s.add(G.atm);
      G.sunL = new T.DirectionalLight(0xffffff, 1.2); G.sunL.position.set(-20, 3, 6); s.add(G.sunL);
      for (k = 0; k < 6; k++) { var a = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(-11, -2.5 + k, 1), 7, 0xffd43b, 0.5, 0.35); s.add(a); rays.push(a); }
      for (k = 0; k < 8; k++) { var b = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 2, 0xff6b6b, 0.4, 0.28); s.add(b); irs.push(b); }
      ['a', 'b', 'c', 'd'].forEach(function (k2) { lab[k2] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var m = model(), sun = ctx.layer('sun'), ir = ctx.layer('ir'), tC = m.Ts - 273.15;
      G.earth.rotation.y += dt * 0.15;
      var capA = clamp(0.25 + m.ice * 2.2, 0.05, 1.3); if (Math.abs(capA - (G.lastCap || 0)) > 0.01) { G.lastCap = capA; G.capN.geometry.dispose(); G.capN.geometry = new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, 0, capA); G.capS.geometry.dispose(); G.capS.geometry = new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, Math.PI - capA, capA); }
      G.atm.visible = S.gh; G.atm.material.opacity = 0.08 + 0.2 * clamp(m.dF / 8 + 0.3, 0, 1);
      rays.forEach(function (r, k) { r.visible = sun; var refl = k < Math.round(6 * m.a); r.setColor(new T.Color(refl ? 0xfff3bf : 0xffd43b)); r.setLength(refl ? 6.2 : 7.6, 0.5, 0.35); });
      var back = S.gh ? clamp(0.45 + m.dF / 12, 0, 0.9) : 0;
      irs.forEach(function (b, k) { b.visible = ir; var ang = (k / irs.length) * Math.PI * 2 + 0.3, dir = new T.Vector3(Math.cos(ang), Math.sin(ang), 0.2).normalize(), trapped = k < Math.round(back * irs.length); b.position.copy(dir.clone().multiplyScalar(3.1)); b.setDirection(dir); b.setLength(trapped ? 0.8 : 2.4, 0.35, 0.25); if (trapped) { b.position.copy(dir.clone().multiplyScalar(3.95)); b.setDirection(dir.clone().negate()); } });
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(-1.5, 4.8, 0).set('Mean temperature ≈ ' + f1(tC) + ' °C', tC > 16 ? 'bl-warn' : tC < 0 ? 'bl-lead' : 'bl-neg').vis(true);
      lab.b.pos(-8, 3.6, 1).set('Albedo ' + fmt(m.a * 100, 0) + ' % reflected', 'bl-d').vis(sun);
      lab.c.pos(4.8, -3.6, 0).set(S.gh ? 'CO₂ = ' + fmt(S.co2, 0) + ' ppm · ΔF = ' + f2(m.dF) + ' W/m²' : 'No greenhouse effect', 'bl-pos').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.d.pos(4.8, 3.8, 0).set('Year ' + S.yr, 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.co2 && u.co2.set(S.co2); u.alb && u.alb.set(S.alb); u.S0 && u.S0.set(S.S0); } },
    hud: function () { var m = model(); return { eq: { chip: '🌡', name: 'Energy balance', body: '<div class="eqline"><small>Equilibrium without atmosphere</small>S₀/4·(1 − α) = σT⁴ → ' + f1(m.Te - 273.15) + ' °C</div><div class="eqline"><small>CO₂ forcing</small>ΔF = 5.35·ln(C/280)</div><div class="eqline"><small>Response</small>ΔT ≈ 0.8 K per W/m²</div>' }, legend: [{ label: 'Yellow', color: '#ffd43b', text: 'absorbed sunlight' }, { label: 'Cream', color: '#fff3bf', text: 'reflected light (albedo)' }, { label: 'Red', color: '#ff6b6b', text: 'infrared (arrows coming back: greenhouse effect)' }] }; },
    measures: function () { var m = model(); return [['Solar constant', fmt(S.S0, 0) + ' W/m²'], ['Effective albedo', fmt(m.a * 100, 1) + ' %'], ['T without atmosphere', f1(m.Te - 273.15) + ' °C'], ['CO₂', fmt(S.co2, 0) + ' ppm'], ['Forcing ΔF', f2(m.dF) + ' W/m²'], ['Mean surface T', f1(m.Ts - 273.15) + ' °C'], ['Relative to pre-industrial', (m.Ts - 288 >= 0 ? '+' : '') + f1(m.Ts - 288) + ' °C'], ['Ice (fraction)', fmt(m.ice * 100, 1) + ' %']]; },
    ideas: ['Weather ≠ climate (average over decades).', 'No atmosphere: −18 °C; with greenhouse effect: +15 °C.', 'Albedo: fraction of light reflected (ice high, ocean low).', 'Feedbacks: ice–albedo and water vapour.', 'CO₂: 280 → 420+ ppm; ΔF = 5.35·ln(C/280).', 'Mitigation and adaptation reduce the risks.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Simple climate model'); el.appendChild(c);
      ui.co2 = kit.ui.slider({ label: 'CO₂ (ppm)', min: 180, max: 1000, step: 5, value: S.co2, digits: 0, onInput: function (v) { ctx.goManual(); S.co2 = v; S.gh = true; } });
      ui.alb = kit.ui.slider({ label: 'Base albedo', min: 0.1, max: 0.6, step: 0.01, value: S.alb, digits: 2, onInput: function (v) { ctx.goManual(); S.alb = v; } });
      ui.S0 = kit.ui.slider({ label: 'Solar constant (W/m²)', min: 1200, max: 1500, step: 5, value: S.S0, digits: 0, onInput: function (v) { ctx.goManual(); S.S0 = v; } });
      c.appendChild(kit.ui.sliders([ui.co2, ui.alb, ui.S0]));
      c.appendChild(ctx.btnRow([{ t: 'Atmosphere on / off', fn: function () { ctx.goManual(); S.gh = !S.gh; } }, { t: 'Feedbacks on / off', fn: function () { ctx.goManual(); S.fb = !S.fb; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Data: CO₂ and global temperature (1960–2024)', h: 230, note: 'Bars: temperature anomaly relative to 1951–1980 (NASA GISTEMP, approx.). Line: CO₂ at Mauna Loa (NOAA, approx.).', draw: function (cx, w, h, col) {
        var L = 40, R = 40, Tp = 12, B = 28, pw = w - L - R, ph = h - Tp - B, sx = function (y) { return L + pw * (y - 1958) / 68; }, st = function (a) { return Tp + ph - ph * (a + 0.3) / 1.7; }, sc = function (c) { return Tp + ph - ph * (c - 300) / 130; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [-0.25, 0, 0.5, 1, 1.25].forEach(function (a) { cx.beginPath(); cx.moveTo(L, st(a)); cx.lineTo(L + pw, st(a)); cx.stroke(); cx.fillText(fmt(a, 2), L - 4, st(a) + 3); });
        cx.textAlign = 'left'; [320, 360, 400, 420].forEach(function (c) { cx.fillText(c, L + pw + 4, sc(c) + 3); });
        cx.textAlign = 'center'; for (i = 1960; i <= 2020; i += 20) cx.fillText(i, sx(i), h - B + 13); cx.fillText('year  ·  °C (left)  ·  ppm CO₂ (right)', L + pw / 2, h - 3);
        DAT.forEach(function (d) { cx.fillStyle = d[2] >= 0 ? 'rgba(250,82,82,.7)' : 'rgba(77,171,247,.7)'; var y0 = st(0), y1 = st(d[2]); cx.fillRect(sx(d[0]) - 6, Math.min(y0, y1), 12, Math.abs(y1 - y0)); });
        cx.strokeStyle = '#fab005'; cx.lineWidth = 2.4; cx.beginPath(); DAT.forEach(function (d, k) { if (k) cx.lineTo(sx(d[0]), sc(d[1])); else cx.moveTo(sx(d[0]), sc(d[1])); }); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Model: temperature against CO₂', h: 210, note: 'Model equilibrium temperature with and without feedbacks. The dot is the current state.', draw: function (cx, w, h, col) {
        var L = 40, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, sx = function (c) { return L + pw * (c - 180) / 820; }, sy = function (t) { return Tp + ph - ph * (t - 8) / 16; }, sv = { co2: S.co2, fb: S.fb, gh: S.gh }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 8; i <= 24; i += 4) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 4, sy(i) + 3); }
        cx.textAlign = 'center'; [280, 420, 560, 800, 1000].forEach(function (c) { cx.fillText(c, sx(c), h - B + 13); }); cx.fillText('CO₂ (ppm)  ·  mean T (°C)', L + pw / 2, h - 3);
        [[true, '#e03131'], [false, '#4dabf7']].forEach(function (q) { cx.strokeStyle = q[1]; cx.lineWidth = 2.2; cx.beginPath(); for (var k = 0; k <= 80; k++) { S.co2 = 180 + 820 * k / 80; S.fb = q[0]; S.gh = true; var t = model().Ts - 273.15; if (k) cx.lineTo(sx(S.co2), sy(t)); else cx.moveTo(sx(S.co2), sy(t)); } cx.stroke(); }); cx.lineWidth = 1;
        S.co2 = sv.co2; S.fb = sv.fb; S.gh = sv.gh; var t0 = model().Ts - 273.15; cx.fillStyle = '#fff'; cx.strokeStyle = '#1864ab'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.co2), sy(clamp(t0, 8, 24)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = model();
      return '<div class="card-kicker">Energy balance</div><table class="calc-table">' + row('Energy absorbed', 'S₀/4·(1 − α) = ' + fmt(S.S0, 0) + '/4·(1 − ' + f2(m.a) + ') = <b>' + f1(S.S0 / 4 * (1 - m.a)) + ' W/m²</b>') + row('T without atmosphere', '(absorbed/σ)^¼ = <b>' + f1(m.Te) + ' K = ' + f1(m.Te - 273.15) + ' °C</b>') + row('CO₂ forcing', '5.35·ln(' + fmt(S.co2, 0) + '/280) = <b>' + f2(m.dF) + ' W/m²</b>') + row('Surface T', '<b>' + f1(m.Ts - 273.15) + ' °C</b>') + row('Doubling CO₂ (560 ppm)', 'ΔF = 3.7 W/m² → ≈ +3 °C') + '</table><p class="muted small">One-layer illustrative model: real climate models resolve the atmosphere and ocean in 3D.</p>';
    },
    quiz: [
      { q: 'The difference between weather and climate is that climate…', options: ['is the average over many years', 'changes every day', 'only includes rainfall', 'does not depend on the ocean'], answer: 0, why: 'Climate: statistics over decades.' },
      { q: 'Without the greenhouse effect, Earth’s mean temperature would be…', options: ['≈ −18 °C', '≈ 15 °C', '≈ 30 °C', 'exactly ≈ 0 °C'], answer: 0, why: 'Radiative equilibrium without an atmosphere.' },
      { q: 'Albedo is…', options: ['the fraction of sunlight reflected', 'the amount of CO₂', 'the ocean temperature', 'the air humidity'], answer: 0, why: 'Ice has a high albedo.' },
      { q: 'If polar ice melts, the Earth…', options: ['absorbs more light and warms further', 'reflects more light', 'does not change', 'cools down'], answer: 0, why: 'Ice–albedo feedback.' },
      { q: 'The pre-industrial CO₂ concentration was about…', options: ['280 ppm', '420 ppm', '1000 ppm', '28 ppm'], answer: 0, why: 'Today it exceeds 420 ppm.' },
      { q: 'The main cause of the recent rise in CO₂ is…', options: ['burning fossil fuels', 'volcanoes', 'human breathing', 'the Sun'], answer: 0, why: 'Together with deforestation.' },
      { q: 'Greenhouse gases warm the surface because they…', options: ['absorb and re-emit part of the infrared downwards', 'produce chemical heat', 'block all sunlight', 'reflect visible light'], answer: 0, why: 'They are almost transparent to visible light but absorb IR.' },
      { q: 'A climate change mitigation measure is…', options: ['generating electricity from renewables', 'burning more coal', 'cutting down forests', 'driving more'], answer: 0, why: 'It reduces CO₂ emissions.' }
    ],
    help: { intro: 'In «Lab» change the CO₂, albedo and solar constant; turn the atmosphere and the feedbacks on or off to see how the equilibrium temperature changes.', items: [['Yellow arrows', 'sunlight (cream: reflected by the albedo).'], ['Red arrows', 'infrared; those returning to Earth represent the greenhouse effect.'], ['Graphs', 'approximate real CO₂ and temperature data, and the model’s response.']], try: ['Remove the atmosphere: what temperature results?', 'Double the CO₂ (560 ppm) with and without feedbacks.', 'Raise the albedo to 0.5 (a very icy Earth): what happens?'] }
  };
  MSim.create(def);
})();
