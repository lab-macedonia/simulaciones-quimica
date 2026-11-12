/* Ondas y sonido — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var MED = { vacio: { n: 'Vacío', v: 0 }, aire: { n: 'Aire (20 °C)', v: 343 }, agua: { n: 'Agua', v: 1480 }, acero: { n: 'Acero', v: 5960 } };
  var SP = [['Ser humano', 20, 20000], ['Perro', 67, 45000], ['Murciélago', 2000, 110000], ['Elefante', 14, 12000], ['Delfín', 75, 150000]];
  var S = { mode: 'onda', f: 440, A: 0.6, med: 'aire', t: 0, D: 170, echo: 0 };
  var NX = 48, NY = 7, NZ = 3, inst, dm, tmpC, G = {}, lab = {}, X0 = -6, X1 = 7;
  function v() { return MED[S.med].v; }
  function lam() { return v() ? v() / S.f : 0; }
  function lv() { return clamp(2.2 * Math.pow(440 / S.f, 0.5) * (v() / 343 > 0 ? Math.pow(v() / 343, 0.35) : 1), 0.7, 9); }   // longitud de onda visual (ilustrativa)
  function dB() { return 40 + 50 * S.A; }
  function stages() {
    return [
      ['El sonido es una onda mecánica', 'Onda', 'Las partículas del medio oscilan y transmiten compresiones y enrarecimientos',
        '<p>El parlante vibra y empuja las partículas del aire, que a su vez empujan a sus vecinas: se propagan <b>compresiones</b> (partículas juntas) y <b>enrarecimientos</b> (separadas). Es una <b>onda longitudinal</b>: las partículas oscilan en la <b>misma dirección</b> en que viaja la onda, pero no avanzan con ella; lo que viaja es la <b>energía</b>. En el <b>vacío</b> no hay partículas y el sonido no se propaga.</p>'],
      ['Amplitud e intensidad', 'Amplitud', 'Mayor amplitud, sonido más intenso (más decibeles)',
        '<p>La <b>amplitud</b> es cuánto se alejan las partículas de su posición de equilibrio. A mayor amplitud, más energía transporta la onda y el sonido es más <b>intenso</b> (más fuerte). La intensidad se mide en <b>decibeles (dB)</b>: una conversación tiene ≈ 60 dB y sobre 85 dB, sostenidos, dañan el oído.</p>'],
      ['Frecuencia y tono', 'Frecuencia', 'Mayor frecuencia, sonido más agudo',
        '<p>La <b>frecuencia</b> f es el número de oscilaciones por segundo, en <b>hertz (Hz)</b>. Las frecuencias bajas suenan <b>graves</b> y las altas <b>agudas</b>. El oído humano percibe aproximadamente de <b>20 Hz a 20 000 Hz</b>; por debajo están los <b>infrasonidos</b> y por encima los <b>ultrasonidos</b>, que usan murciélagos, delfines y las ecografías.</p>'],
      ['Rapidez y longitud de onda', 'v = λ·f', 'v = λ·f: la rapidez depende del medio, no de la frecuencia',
        '<p>La <b>longitud de onda</b> λ es la distancia entre dos compresiones. Se cumple <b>v = λ·f</b>. La <b>rapidez</b> depende del <b>medio</b>: ≈ 343 m/s en el aire, ≈ 1480 m/s en el agua y ≈ 5960 m/s en el acero, porque en sólidos y líquidos las partículas están más unidas. Con mayor rapidez, la misma frecuencia tiene una λ más larga.</p>'],
      ['Reflexión: el eco', 'Eco', 'El sonido rebota en superficies; d = v·t/2',
        '<p>Al chocar con una superficie el sonido se <b>refleja</b>. Si el obstáculo está lejos oímos un <b>eco</b>: el pulso viaja ida y vuelta, así que la distancia es <b>d = v·t/2</b>. Con un muro a 170 m, el eco vuelve en 1 s. Los murciélagos, los delfines y el <b>sonar</b> de los barcos usan el eco para ubicar objetos.</p>'],
      ['El oído y la audición', 'Oído', 'El tímpano vibra con la onda; la cóclea distingue frecuencias',
        '<p>El <b>oído externo</b> conduce la onda hasta el <b>tímpano</b>, que vibra. Los <b>huesecillos</b> (martillo, yunque y estribo) amplifican la vibración y la llevan a la <b>cóclea</b>, donde células ciliadas la transforman en impulsos nerviosos: la base responde a los agudos y el vértice a los graves. Cada especie oye un rango distinto (gráfico «Rangos de audición»).</p>']
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
    key: 'ondas-sonido', title: 'Ondas y sonido', subtitle: 'Simulador 3D · física', accent: { dark: '#63e6be', light: '#087f5b' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.2, 5, 13], target: [-1.2, 1.6, 0] }, { id: 'frontal', label: 'Frontal', pos: [-1.2, 1.8, 13], target: [-1.2, 1.6, 0] }],
    layers: [{ id: 'col', label: 'Color según la presión', icon: '◐' }],
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
      lab.b.pos(0.5, 3.5, 0).set(v() ? MED[S.med].n + ' · v = ' + fmt(v(), 0) + ' m/s · λ = ' + (lam() >= 1 ? f2(lam()) + ' m' : fmt(lam() * 100, 1) + ' cm') : 'Vacío: no hay partículas que vibren, no hay sonido', v() ? 'bl-d' : 'bl-warn').vis(true);
      if (S.mode === 'eco') lab.c.pos(X1 + 0.6, 3.8, 0).set('Muro a ' + fmt(S.D, 0) + ' m · eco en t = 2d/v = ' + f2(2 * S.D / Math.max(1, v())) + ' s', 'bl-warn').vis(true);
      if (S.mode === 'oido') lab.c.pos(X1 + 1.3, 3.2, 0).set('Tímpano → cóclea · ' + (S.f >= 20 && S.f <= 20000 ? 'audible' : 'no audible'), 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.f && u.f.set(Math.log(S.f) / Math.LN10); u.A && u.A.set(S.A); u.med && u.med.set(S.med); u.mode && u.mode.set(S.mode); } },
    hud: function () { return { eq: { chip: '♪', name: { onda: 'Onda sonora', eco: 'Eco', oido: 'Audición' }[S.mode], body: '<div class="eqline"><small>Rapidez</small>v = λ·f</div><div class="eqline"><small>Período</small>T = 1/f</div><div class="eqline"><small>Eco</small>d = v·t / 2</div>' }, legend: [{ label: 'Rojo', color: '#ff8787', text: 'compresión (mayor presión)' }, { label: 'Azul', color: '#74c0fc', text: 'enrarecimiento (menor presión)' }] }; },
    measures: function () { return [['Medio', MED[S.med].n], ['Rapidez', v() ? fmt(v(), 0) + ' m/s' : '— (no se propaga)'], ['Frecuencia', fmt(S.f, 0) + ' Hz'], ['Período', f2(1000 / S.f) + ' ms'], ['Longitud de onda', v() ? (lam() >= 1 ? f2(lam()) + ' m' : fmt(lam() * 100, 1) + ' cm') : '—'], ['Intensidad (aprox.)', fmt(dB(), 0) + ' dB'], ['Audible por humanos', S.f >= 20 && S.f <= 20000 ? 'sí' : 'no']]; },
    ideas: ['Onda mecánica longitudinal: necesita un medio.', 'Amplitud ↔ intensidad (dB); frecuencia ↔ tono.', '<b>v = λ·f</b>; T = 1/f.', 'v aire ≈ 343 m/s; agua ≈ 1480 m/s; acero ≈ 5960 m/s.', 'Eco: <b>d = v·t/2</b>.', 'Audición humana: 20 Hz – 20 kHz.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Fuente de sonido'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Escena', cols: 3, value: S.mode, options: [{ v: 'onda', label: 'Onda' }, { v: 'eco', label: 'Eco' }, { v: 'oido', label: 'Oído' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.echo = 0; } }); c.appendChild(ui.mode);
      ui.f = kit.ui.slider({ label: 'Frecuencia (Hz)', min: 1.2, max: 4.6, step: 0.01, value: Math.log(S.f) / Math.LN10, format: function (x) { return fmt(Math.pow(10, x), 0); }, onInput: function (x) { ctx.goManual(); S.f = Math.round(Math.pow(10, x)); } });
      ui.A = kit.ui.slider({ label: 'Amplitud', min: 0.05, max: 1, step: 0.05, value: S.A, digits: 2, onInput: function (x) { ctx.goManual(); S.A = x; } });
      ui.D = kit.ui.slider({ label: 'Distancia al muro (m)', min: 17, max: 680, step: 1, value: S.D, digits: 0, onInput: function (x) { ctx.goManual(); S.D = x; } });
      c.appendChild(kit.ui.sliders([ui.f, ui.A, ui.D]));
      ui.med = kit.ui.options({ label: 'Medio', cols: 2, value: S.med, options: Object.keys(MED).map(function (k) { return { v: k, label: MED[k].n, sub: MED[k].v ? MED[k].v + ' m/s' : 'sin partículas' }; }), onChange: function (v) { ctx.goManual(); S.med = v; } }); c.appendChild(ui.med);
      el.appendChild(ctx.btnRow([{ t: 'Escuchar 1 s', primary: true, fn: function () { try { var AC = window.AudioContext || window.webkitAudioContext, a = new AC(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = clamp(S.f, 20, 20000); g.gain.value = 0.02 + 0.12 * S.A; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 1); } catch (e) { } } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Presión del aire a lo largo de la onda', h: 200, note: 'Las crestas son compresiones y los valles enrarecimientos. La distancia entre dos crestas es λ.', draw: function (cx, w, h, col) {
        var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, Lv = lv(), span = X1 - X0, k = 2 * Math.PI / Lv, wv = 2 * Math.PI * 0.55 * Math.pow(S.f / 440, 0.3), i;
        cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(L, Tp + ph / 2); cx.lineTo(L + pw, Tp + ph / 2); cx.stroke();
        cx.strokeStyle = '#20c997'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 200; i++) { var x = span * i / 200, p = v() ? -S.A * Math.cos(k * x - wv * S.t) : 0; if (i) cx.lineTo(L + pw * i / 200, Tp + ph / 2 - p * ph / 2.2); else cx.moveTo(L, Tp + ph / 2 - p * ph / 2.2); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = col.muted; cx.font = '10.5px system-ui'; cx.textAlign = 'center'; cx.fillText('posición  ·  presión (sobre / bajo la presión atmosférica)', L + pw / 2, h - 4);
        if (v()) { var x1 = L + pw * (Lv * 0.25) / span, x2 = x1 + pw * Lv / span; if (x2 < L + pw) { cx.strokeStyle = col.ink; cx.beginPath(); cx.moveTo(x1, Tp + 4); cx.lineTo(x2, Tp + 4); cx.stroke(); cx.fillStyle = col.ink; cx.fillText('λ = ' + (lam() >= 1 ? fmt(lam(), 2) + ' m' : fmt(lam() * 100, 1) + ' cm'), (x1 + x2) / 2, Tp + 16); } }
      } },
      { title: 'Rangos de audición', h: 220, note: 'Escala logarítmica de frecuencia. La línea vertical es la frecuencia actual.', draw: function (cx, w, h, col) {
        var L = 92, R = 10, Tp = 8, B = 24, pw = w - L - R, rh = (h - Tp - B) / SP.length, sx = function (f) { return L + pw * (Math.log(f) / Math.LN10 - 1) / 4.3; };
        cx.font = '11px system-ui'; SP.forEach(function (s, i) { var y = Tp + i * rh; cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(s[0], L - 6, y + rh / 2 + 4); cx.fillStyle = i === 0 ? '#20c997' : 'rgba(99,230,190,.45)'; cx.fillRect(sx(s[1]), y + 4, sx(s[2]) - sx(s[1]), rh - 8); });
        cx.fillStyle = col.muted; cx.textAlign = 'center'; [10, 100, 1000, 10000, 100000].forEach(function (f) { cx.fillText(f >= 1000 ? fmt(f / 1000, 0) + ' k' : f, sx(f), h - 8); });
        cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(S.f), Tp); cx.lineTo(sx(S.f), h - B); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (!v()) return '<div class="card-kicker">Vacío</div><p>Sin un medio material el sonido no se propaga: no hay rapidez ni longitud de onda.</p>';
      return '<div class="card-kicker">' + MED[S.med].n + ' · f = ' + fmt(S.f, 0) + ' Hz</div><table class="calc-table">' + row('Período', 'T = 1/f = <b>' + fmt(1000 / S.f, 3) + ' ms</b>') + row('Longitud de onda', 'λ = v/f = ' + fmt(v(), 0) + '/' + fmt(S.f, 0) + ' = <b>' + fmt(lam(), 3) + ' m</b>') + row('Eco con muro a ' + fmt(S.D, 0) + ' m', 't = 2d/v = <b>' + fmt(2 * S.D / v(), 3) + ' s</b>') + row('Tipo', S.f < 20 ? 'infrasonido' : S.f > 20000 ? 'ultrasonido' : 'sonido audible') + '</table>';
    },
    quiz: [
      { q: 'El sonido no se propaga en el vacío porque…', options: ['necesita partículas que vibren', 'el vacío es muy frío', 'la luz lo absorbe', 'viaja demasiado rápido'], answer: 0, why: 'Es una onda mecánica.' },
      { q: 'En una onda sonora, las partículas del aire…', options: ['oscilan en la dirección de propagación', 'viajan junto con la onda', 'oscilan perpendicularmente', 'quedan quietas'], answer: 0, why: 'Es una onda longitudinal.' },
      { q: 'Un sonido más agudo tiene…', options: ['mayor frecuencia', 'mayor amplitud', 'menor frecuencia', 'mayor longitud de onda'], answer: 0, why: 'El tono depende de la frecuencia.' },
      { q: 'Un sonido de 343 Hz en el aire (343 m/s) tiene una longitud de onda de…', options: ['1 m', '343 m', '0,1 m', '117 649 m'], answer: 0, why: 'λ = v/f.' },
      { q: 'El sonido viaja más rápido en…', options: ['el acero', 'el aire', 'el vacío', 'el agua fría que en el acero'], answer: 0, why: 'En los sólidos las partículas están más fuertemente unidas.' },
      { q: 'Un eco vuelve 2 s después de un grito (v = 340 m/s). El cerro está a…', options: ['340 m', '680 m', '170 m', '1360 m'], answer: 0, why: 'd = v·t/2 = 340·2/2.' },
      { q: 'La intensidad del sonido se relaciona principalmente con…', options: ['la amplitud', 'la frecuencia', 'el período', 'el medio'], answer: 0, why: 'Más amplitud, más energía.' },
      { q: 'Los murciélagos se orientan con…', options: ['ultrasonidos y eco', 'infrasonidos', 'luz', 'calor'], answer: 0, why: 'Ecolocalización con frecuencias de hasta ≈ 110 kHz.' }
    ],
    help: { intro: 'En «Lab» cambia la frecuencia, la amplitud y el medio, o elige la escena del eco o del oído. «Escuchar 1 s» reproduce el tono con el parlante del equipo.', items: [['Puntos', 'partículas del medio; rojo: compresión; azul: enrarecimiento.'], ['Eco', 'un pulso va al muro y vuelve; ajusta la distancia.'], ['Oído', 'el punto amarillo marca la zona de la cóclea que responde a esa frecuencia.']], try: ['Cambia el medio a vacío: ¿qué pasa con las partículas?', 'Sube la frecuencia: ¿qué le pasa a λ?', 'Busca a qué distancia el eco tarda 1 s en el aire.'] }
  };
  MSim.create(def);
})();
