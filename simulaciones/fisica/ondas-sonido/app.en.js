/* Ondas y sonido — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var MED = { vacio: { n: 'Vacuum', v: 0 }, aire: { n: 'Air (20 °C)', v: 343 }, agua: { n: 'Water', v: 1480 }, acero: { n: 'Steel', v: 5960 } };
  var SP = [['Human', 20, 20000], ['Dog', 67, 45000], ['Bat', 2000, 110000], ['Elephant', 14, 12000], ['Dolphin', 75, 150000]];
  var S = { mode: 'onda', f: 440, A: 0.6, med: 'aire', t: 0, D: 170, echo: 0 };
  var NX = 48, NY = 7, NZ = 3, inst, dm, tmpC, G = {}, lab = {}, X0 = -6, X1 = 7;
  function v() { return MED[S.med].v; }
  function lam() { return v() ? v() / S.f : 0; }
  function lv() { return clamp(2.2 * Math.pow(440 / S.f, 0.5) * (v() / 343 > 0 ? Math.pow(v() / 343, 0.35) : 1), 0.7, 9); }   // longitud de onda visual (ilustrativa)
  function dB() { return 40 + 50 * S.A; }
  function stages() {
    return [
      ['Sound is a mechanical wave', 'Wave', 'The particles of the medium oscillate and pass on compressions and rarefactions',
        '<p>The speaker vibrates and pushes the air particles, which in turn push their neighbours: <b>compressions</b> (particles close together) and <b>rarefactions</b> (spread apart) travel outwards. It is a <b>longitudinal wave</b>: the particles oscillate in the <b>same direction</b> the wave travels, but they do not move along with it; what travels is <b>energy</b>. In a <b>vacuum</b> there are no particles and sound does not travel.</p>'],
      ['Amplitude and intensity', 'Amplitude', 'Greater amplitude, louder sound (more decibels)',
        '<p><b>Amplitude</b> is how far the particles move from their rest position. The greater the amplitude, the more energy the wave carries and the more <b>intense</b> (louder) the sound. Intensity is measured in <b>decibels (dB)</b>: a conversation is ≈ 60 dB and sustained levels above 85 dB damage hearing.</p>'],
      ['Frequency and pitch', 'Frequency', 'Higher frequency, higher pitch',
        '<p><b>Frequency</b> f is the number of oscillations per second, in <b>hertz (Hz)</b>. Low frequencies sound <b>deep</b> and high ones <b>shrill</b>. The human ear hears roughly <b>20 Hz to 20,000 Hz</b>; below are <b>infrasounds</b> and above are <b>ultrasounds</b>, used by bats, dolphins and ultrasound scans.</p>'],
      ['Speed and wavelength', 'v = λ·f', 'v = λ·f: speed depends on the medium, not on the frequency',
        '<p>The <b>wavelength</b> λ is the distance between two compressions. It satisfies <b>v = λ·f</b>. <b>Speed</b> depends on the <b>medium</b>: ≈ 343 m/s in air, ≈ 1480 m/s in water and ≈ 5960 m/s in steel, because in solids and liquids the particles are more tightly bound. With a higher speed, the same frequency has a longer λ.</p>'],
      ['Reflection: the echo', 'Echo', 'Sound bounces off surfaces; d = v·t/2',
        '<p>When sound hits a surface it is <b>reflected</b>. If the obstacle is far away we hear an <b>echo</b>: the pulse travels there and back, so the distance is <b>d = v·t/2</b>. With a wall 170 m away, the echo returns in 1 s. Bats, dolphins and ship <b>sonar</b> use echoes to locate objects.</p>'],
      ['The ear and hearing', 'Ear', 'The eardrum vibrates with the wave; the cochlea tells frequencies apart',
        '<p>The <b>outer ear</b> channels the wave to the <b>eardrum</b>, which vibrates. The <b>ossicles</b> (hammer, anvil and stirrup) amplify the vibration and pass it to the <b>cochlea</b>, where hair cells turn it into nerve impulses: the base responds to high pitches and the apex to low ones. Each species hears a different range (graph «Hearing ranges»).</p>']
    ];
  }
  function lessonSet(i, l, ctx) {
    S.mode = 'onda'; S.med = 'aire';
    if (i === 0) { S.f = 440; S.A = 0.6; if (l > 0.6) S.med = 'vacio'; }
    else if (i === 1) { S.f = 440; S.A = 0.15 + 0.85 * l; }
    else if (i === 2) { S.A = 0.6; S.f = Math.round(110 * Math.pow(2, 4 * l)); }
    else if (i === 3) { S.A = 0.6; S.f = 440; S.med = l < 0.33 ? 'aire' : l < 0.66 ? 'agua' : 'acero'; }
    else if (i === 4) { S.mode = 'eco'; S.A = 0.8; S.f = 440; S.D = 170; S.echo = l * 2.6; }
    else { S.mode = 'oido'; S.A = 0.6; S.f = Math.round(200 * Math.pow(2, 4 * l)); }
  }
  var def = {
    key: 'ondas-sonido', title: 'Waves and sound', subtitle: '3D simulator · physics', accent: { dark: '#63e6be', light: '#087f5b' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.2, 5, 13], target: [-1.2, 1.6, 0] }, { id: 'frontal', label: 'Front', pos: [-1.2, 1.8, 13], target: [-1.2, 1.6, 0] }],
    layers: [{ id: 'col', label: 'Colour by pressure', icon: '◐' }],
    build: function (ctx) {
      var s = ctx.scene; tmpC = new T.Color(); dm = new T.Object3D();
      inst = new T.InstancedMesh(new T.SphereGeometry(0.09, 8, 6), new T.MeshStandardMaterial({ roughness: 0.5 }), NX * NY * NZ); inst.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NX * NY * NZ * 3), 3); inst.frustumCulled = false; s.add(inst);
      G.spk = new T.Group(); s.add(G.spk); var box = new T.Mesh(new T.BoxGeometry(1, 2.4, 1.6), new T.MeshStandardMaterial({ color: 0x343a40 })); G.spk.add(box);
      G.cone = new T.Mesh(new T.ConeGeometry(0.75, 0.5, 24, 1, true), new T.MeshStandardMaterial({ color: 0x868e96, side: T.DoubleSide })); G.cone.rotation.z = -Math.PI / 2; G.cone.position.x = 0.55; G.spk.add(G.cone); G.spk.position.set(X0 - 0.9, 1.5, 0);
      G.wall = new T.Mesh(new T.BoxGeometry(0.5, 3.6, 2.4), new T.MeshStandardMaterial({ color: 0xadb5bd })); G.wall.position.set(X1 + 0.6, 1.5, 0); s.add(G.wall);
      G.drum = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.05, 32), new T.MeshStandardMaterial({ color: 0xffc9a3, side: T.DoubleSide })); G.drum.rotation.z = Math.PI / 2; G.drum.position.set(X1 + 0.4, 1.5, 0); s.add(G.drum);
      G.coch = new T.Mesh(new T.TorusGeometry(0.55, 0.16, 12, 40, Math.PI * 3.2), new T.MeshStandardMaterial({ color: 0xff8787 })); G.coch.position.set(X1 + 2.2, 1.5, 0); G.coch.rotation.y = Math.PI / 2; s.add(G.coch);
      G.hot = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x7a5a00 })); s.add(G.hot);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx);
      else if (S.mode === 'eco') { S.echo += dt; if (S.echo > 3) S.echo = 0; }
      S.t += dt;
      var L = lv(), k = 2 * Math.PI / L, w = 2 * Math.PI * 0.55 * Math.pow(S.f / 440, 0.3), amp = 0.32 * S.A * (v() ? 1 : 0), col = ctx.layer('col'), i = 0, a, b, c;
      var span = X1 - X0, pulseX = S.mode === 'eco' ? (S.echo <= 1.3 ? X0 + span * S.echo / 1.3 : X1 - span * (S.echo - 1.3) / 1.3) : 0;
      for (a = 0; a < NX; a++) for (b = 0; b < NY; b++) for (c = 0; c < NZ; c++) {
        var x0 = X0 + span * a / (NX - 1), ph = k * (x0 - X0) - w * S.t, env = 1;
        if (S.mode === 'eco') { var dd = Math.abs(x0 - pulseX); env = dd < L ? Math.cos(dd / L * Math.PI / 2) : 0; if (S.echo > 2.6) env = 0; }
        var dx = amp * env * Math.sin(ph), comp = -env * Math.cos(ph) * (amp > 0 ? 1 : 0);
        dm.position.set(x0 + dx, 0.4 + b * 0.36, -0.55 + c * 0.55); dm.updateMatrix(); inst.setMatrixAt(i, dm.matrix);
        if (col) tmpC.setRGB(0.45 + 0.5 * Math.max(0, comp) * S.A + 0.1, 0.55 - 0.15 * Math.abs(comp) * S.A, 0.6 + 0.4 * Math.max(0, -comp) * S.A); else tmpC.setHex(0x74c0fc);
        inst.setColorAt(i, tmpC); i++;
      }
      inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true; inst.visible = v() > 0 || true;
      G.cone.position.x = 0.55 + 0.12 * S.A * Math.sin(w * S.t);
      G.wall.visible = S.mode === 'eco'; G.drum.visible = G.coch.visible = G.hot.visible = S.mode === 'oido';
      if (S.mode === 'oido') { G.drum.position.x = X1 + 0.4 + 0.12 * S.A * Math.sin(w * S.t - k * span); var u = clamp(Math.log(S.f / 20) / Math.log(1000), 0, 1), ang = Math.PI * 3.2 * (u * 0.9 + 0.05); G.hot.position.set(X1 + 2.2, 1.5 + 0.55 * Math.sin(ang), 0.55 * Math.cos(ang) * -1); }
      Object.keys(lab).forEach(function (q) { lab[q].vis(false); });
      lab.a.pos(X0 - 0.9, 3.4, 0).set('f = ' + fmt(S.f, 0) + ' Hz · ' + fmt(dB(), 0) + ' dB', 'bl-lead').vis(true);
      lab.b.pos(0.5, 3.5, 0).set(v() ? MED[S.med].n + ' · v = ' + fmt(v(), 0) + ' m/s · λ = ' + (lam() >= 1 ? f2(lam()) + ' m' : fmt(lam() * 100, 1) + ' cm') : 'Vacuum: no particles to vibrate, no sound', v() ? 'bl-d' : 'bl-warn').vis(true);
      if (S.mode === 'eco') lab.c.pos(X1 + 0.6, 3.8, 0).set('Wall at ' + fmt(S.D, 0) + ' m · echo at t = 2d/v = ' + f2(2 * S.D / Math.max(1, v())) + ' s', 'bl-warn').vis(true);
      if (S.mode === 'oido') lab.c.pos(X1 + 1.3, 3.2, 0).set('Eardrum → cochlea · ' + (S.f >= 20 && S.f <= 20000 ? 'audible' : 'not audible'), 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.f && u.f.set(Math.log(S.f) / Math.LN10); u.A && u.A.set(S.A); u.med && u.med.set(S.med); u.mode && u.mode.set(S.mode); } },
    hud: function () { return { eq: { chip: '♪', name: { onda: 'Sound wave', eco: 'Echo', oido: 'Hearing' }[S.mode], body: '<div class="eqline"><small>Speed</small>v = λ·f</div><div class="eqline"><small>Period</small>T = 1/f</div><div class="eqline"><small>Echo</small>d = v·t / 2</div>' }, legend: [{ label: 'Red', color: '#ff8787', text: 'compression (higher pressure)' }, { label: 'Blue', color: '#74c0fc', text: 'rarefaction (lower pressure)' }] }; },
    measures: function () { return [['Medium', MED[S.med].n], ['Speed', v() ? fmt(v(), 0) + ' m/s' : '— (does not travel)'], ['Frequency', fmt(S.f, 0) + ' Hz'], ['Period', f2(1000 / S.f) + ' ms'], ['Wavelength', v() ? (lam() >= 1 ? f2(lam()) + ' m' : fmt(lam() * 100, 1) + ' cm') : '—'], ['Intensity (approx.)', fmt(dB(), 0) + ' dB'], ['Audible to humans', S.f >= 20 && S.f <= 20000 ? 'yes' : 'no']]; },
    ideas: ['Longitudinal mechanical wave: it needs a medium.', 'Amplitude ↔ intensity (dB); frequency ↔ pitch.', '<b>v = λ·f</b>; T = 1/f.', 'v in air ≈ 343 m/s; water ≈ 1480 m/s; steel ≈ 5960 m/s.', 'Echo: <b>d = v·t/2</b>.', 'Human hearing: 20 Hz – 20 kHz.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sound source'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Scene', cols: 3, value: S.mode, options: [{ v: 'onda', label: 'Wave' }, { v: 'eco', label: 'Echo' }, { v: 'oido', label: 'Ear' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.echo = 0; } }); c.appendChild(ui.mode);
      ui.f = kit.ui.slider({ label: 'Frequency (Hz)', min: 1.2, max: 4.6, step: 0.01, value: Math.log(S.f) / Math.LN10, format: function (x) { return fmt(Math.pow(10, x), 0); }, onInput: function (x) { ctx.goManual(); S.f = Math.round(Math.pow(10, x)); } });
      ui.A = kit.ui.slider({ label: 'Amplitude', min: 0.05, max: 1, step: 0.05, value: S.A, digits: 2, onInput: function (x) { ctx.goManual(); S.A = x; } });
      ui.D = kit.ui.slider({ label: 'Distance to the wall (m)', min: 17, max: 680, step: 1, value: S.D, digits: 0, onInput: function (x) { ctx.goManual(); S.D = x; } });
      c.appendChild(kit.ui.sliders([ui.f, ui.A, ui.D]));
      ui.med = kit.ui.options({ label: 'Medium', cols: 2, value: S.med, options: Object.keys(MED).map(function (k) { return { v: k, label: MED[k].n, sub: MED[k].v ? MED[k].v + ' m/s' : 'no particles' }; }), onChange: function (v) { ctx.goManual(); S.med = v; } }); c.appendChild(ui.med);
      el.appendChild(ctx.btnRow([{ t: 'Listen for 1 s', primary: true, fn: function () { try { var AC = window.AudioContext || window.webkitAudioContext, a = new AC(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = clamp(S.f, 20, 20000); g.gain.value = 0.02 + 0.12 * S.A; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 1); } catch (e) { } } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Air pressure along the wave', h: 200, note: 'Crests are compressions and troughs are rarefactions. The distance between two crests is λ.', draw: function (cx, w, h, col) {
        var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, Lv = lv(), span = X1 - X0, k = 2 * Math.PI / Lv, wv = 2 * Math.PI * 0.55 * Math.pow(S.f / 440, 0.3), i;
        cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(L, Tp + ph / 2); cx.lineTo(L + pw, Tp + ph / 2); cx.stroke();
        cx.strokeStyle = '#20c997'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 200; i++) { var x = span * i / 200, p = v() ? -S.A * Math.cos(k * x - wv * S.t) : 0; if (i) cx.lineTo(L + pw * i / 200, Tp + ph / 2 - p * ph / 2.2); else cx.moveTo(L, Tp + ph / 2 - p * ph / 2.2); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = col.muted; cx.font = '10.5px system-ui'; cx.textAlign = 'center'; cx.fillText('position  ·  pressure (above / below atmospheric pressure)', L + pw / 2, h - 4);
        if (v()) { var x1 = L + pw * (Lv * 0.25) / span, x2 = x1 + pw * Lv / span; if (x2 < L + pw) { cx.strokeStyle = col.ink; cx.beginPath(); cx.moveTo(x1, Tp + 4); cx.lineTo(x2, Tp + 4); cx.stroke(); cx.fillStyle = col.ink; cx.fillText('λ = ' + (lam() >= 1 ? fmt(lam(), 2) + ' m' : fmt(lam() * 100, 1) + ' cm'), (x1 + x2) / 2, Tp + 16); } }
      } },
      { title: 'Hearing ranges', h: 220, note: 'Logarithmic frequency scale. The vertical line is the current frequency.', draw: function (cx, w, h, col) {
        var L = 92, R = 10, Tp = 8, B = 24, pw = w - L - R, rh = (h - Tp - B) / SP.length, sx = function (f) { return L + pw * (Math.log(f) / Math.LN10 - 1) / 4.3; };
        cx.font = '11px system-ui'; SP.forEach(function (s, i) { var y = Tp + i * rh; cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(s[0], L - 6, y + rh / 2 + 4); cx.fillStyle = i === 0 ? '#20c997' : 'rgba(99,230,190,.45)'; cx.fillRect(sx(s[1]), y + 4, sx(s[2]) - sx(s[1]), rh - 8); });
        cx.fillStyle = col.muted; cx.textAlign = 'center'; [10, 100, 1000, 10000, 100000].forEach(function (f) { cx.fillText(f >= 1000 ? fmt(f / 1000, 0) + ' k' : f, sx(f), h - 8); });
        cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(S.f), Tp); cx.lineTo(sx(S.f), h - B); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (!v()) return '<div class="card-kicker">Vacuum</div><p>Without a material medium sound does not travel: there is no speed or wavelength.</p>';
      return '<div class="card-kicker">' + MED[S.med].n + ' · f = ' + fmt(S.f, 0) + ' Hz</div><table class="calc-table">' + row('Period', 'T = 1/f = <b>' + fmt(1000 / S.f, 3) + ' ms</b>') + row('Wavelength', 'λ = v/f = ' + fmt(v(), 0) + '/' + fmt(S.f, 0) + ' = <b>' + fmt(lam(), 3) + ' m</b>') + row('Echo with a wall at ' + fmt(S.D, 0) + ' m', 't = 2d/v = <b>' + fmt(2 * S.D / v(), 3) + ' s</b>') + row('Type', S.f < 20 ? 'infrasound' : S.f > 20000 ? 'ultrasound' : 'audible sound') + '</table>';
    },
    quiz: [
      { q: 'Sound does not travel in a vacuum because…', options: ['it needs particles to vibrate', 'a vacuum is very cold', 'light absorbs it', 'it travels too fast'], answer: 0, why: 'It is a mechanical wave.' },
      { q: 'In a sound wave, the air particles…', options: ['oscillate along the direction of travel', 'travel along with the wave', 'oscillate perpendicularly', 'stay still'], answer: 0, why: 'It is a longitudinal wave.' },
      { q: 'A higher-pitched sound has…', options: ['a higher frequency', 'a greater amplitude', 'a lower frequency', 'a longer wavelength'], answer: 0, why: 'Pitch depends on frequency.' },
      { q: 'A 343 Hz sound in air (343 m/s) has a wavelength of…', options: ['1 m', '343 m', '0.1 m', '117,649 m'], answer: 0, why: 'λ = v/f.' },
      { q: 'Sound travels fastest in…', options: ['steel', 'air', 'a vacuum', 'cold water rather than steel'], answer: 0, why: 'In solids the particles are more strongly bound.' },
      { q: 'An echo returns 2 s after a shout (v = 340 m/s). The hill is…', options: ['340 m away', '680 m away', '170 m away', '1360 m away'], answer: 0, why: 'd = v·t/2 = 340·2/2.' },
      { q: 'Sound intensity is mainly related to…', options: ['the amplitude', 'the frequency', 'the period', 'the medium'], answer: 0, why: 'More amplitude, more energy.' },
      { q: 'Bats find their way using…', options: ['ultrasound and echoes', 'infrasound', 'light', 'heat'], answer: 0, why: 'Echolocation with frequencies up to ≈ 110 kHz.' }
    ],
    help: { intro: 'In «Lab» change the frequency, amplitude and medium, or choose the echo or ear scene. «Listen for 1 s» plays the tone through your device’s speaker.', items: [['Dots', 'particles of the medium; red: compression; blue: rarefaction.'], ['Echo', 'a pulse goes to the wall and back; adjust the distance.'], ['Ear', 'the yellow dot marks the part of the cochlea that responds to that frequency.']], try: ['Switch the medium to vacuum: what happens to the particles?', 'Raise the frequency: what happens to λ?', 'Find the distance at which the echo takes 1 s in air.'] }
  };
  MSim.create(def);
})();
