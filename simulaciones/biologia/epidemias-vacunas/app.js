/* Epidemias, sistema inmune y vacunas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f0 = function (x) { return fmt(x, 0); }, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var NA = 300, A = [], inst, dm, tmpC, G = {}, lab = {}, W = 9;
  var S = { R0: 3, D: 7, vac: 0, eff: 0.9, dist: 0, day: 0, s: 0, i: 0, r: 0, v: 0, hist: [], run: true };
  var COL = [0x4dabf7, 0xff6b6b, 0x51cf66, 0xfcc419];
  function Reff() { return S.R0 * (1 - S.dist * 0.6); }
  function reset() {
    S.day = 0; S.hist = []; S.v = Math.round(NA * S.vac * S.eff); S.i = 3; S.r = 0; S.s = NA - S.v - S.i;
    A.forEach(function (a, k) { a.st = 0; a.t = 0; }); var idx = A.map(function (a, k) { return k; }).sort(function () { return Math.random() - 0.5; });
    for (var k = 0; k < S.v; k++) A[idx[k]].st = 3; for (k = S.v; k < S.v + 3; k++) A[idx[k]].st = 1;
  }
  function stepODE(dt) {
    var g = 1 / S.D, b = Reff() * g, n = 40, h = dt / n, s = S.s, i = S.i, r = S.r;
    for (var k = 0; k < n; k++) { var inf = b * s * i / NA * h, rec = g * i * h; s -= inf; i += inf - rec; r += rec; }
    S.s = Math.max(0, s); S.i = Math.max(0, i); S.r = r; S.day += dt;
    S.hist.push([S.day, S.s, S.i, S.r, S.v]); if (S.hist.length > 800) S.hist.shift();
    // ajustar los agentes a los números del modelo: contagia a vecinos de infectados y recupera a los más antiguos
    var I = A.filter(function (a) { return a.st === 1; }), R = A.filter(function (a) { return a.st === 2; }), need = Math.round(S.r) - R.length;
    I.sort(function (a, b2) { return b2.t - a.t; }); for (k = 0; k < need && k < I.length; k++) I[k].st = 2;
    I = A.filter(function (a) { return a.st === 1; }); var add = Math.round(S.i) - I.length;
    for (k = 0; k < add; k++) { var best = null, bd = 1e9, src = I.length ? I[Math.floor(Math.random() * I.length)] : null; A.forEach(function (a) { if (a.st !== 0) return; var d = src ? Math.hypot(a.x - src.x, a.z - src.z) + Math.random() * 1.5 : Math.random(); if (d < bd) { bd = d; best = a; } }); if (!best) break; best.st = 1; best.t = 0; }
    A.forEach(function (a) { if (a.st === 1) a.t += dt; });
  }
  function finalSize(cov) { var g = 1 / S.D, b = Reff() * g, s = NA * (1 - cov * S.eff) - 1, i = 1, r = 0; for (var k = 0; k < 4000; k++) { var h = 0.25, inf = b * s * i / NA * h, rec = g * i * h; s -= inf; i += inf - rec; r += rec; if (i < 0.01) break; } return (r + i) / NA; }
  function stages() {
    return [
      ['Agentes infecciosos y contagio', 'Contagio', 'Virus y bacterias pasan de persona a persona por contacto, gotitas o aerosoles',
        '<p>Las enfermedades infecciosas las causan <b>agentes patógenos</b>: virus, bacterias, hongos o parásitos. Se <b>transmiten</b> por contacto directo, gotitas y aerosoles al toser o hablar, superficies, agua o alimentos contaminados, o vectores como mosquitos. Aquí, cada esfera es una persona: azul = susceptible, roja = infectada.</p>'],
      ['La curva de una epidemia', 'Epidemia', 'Los casos crecen, llegan a un máximo y bajan: modelo SIR',
        '<p>Al inicio casi todos son <b>susceptibles</b> (S) y los casos crecen rápido. Los <b>infectados</b> (I) contagian durante algunos días y luego se <b>recuperan</b> (R) con inmunidad. A medida que quedan menos susceptibles, cada enfermo contagia a menos personas: la curva llega a un <b>máximo</b> y desciende. Es el modelo <b>SIR</b>, usado en salud pública.</p>'],
      ['Número reproductivo R₀', 'R₀', 'Cuántas personas contagia, en promedio, cada infectado',
        '<p><b>R₀</b> es el número de personas que, en promedio, contagia cada infectado en una población sin inmunidad: ≈ 1–2 para la gripe, ≈ 3–6 para el SARS-CoV-2 original y ≈ 12–18 para el sarampión. Si el número efectivo <b>R &gt; 1</b>, los casos aumentan; si <b>R &lt; 1</b>, disminuyen. Ventilar, usar mascarilla y reducir contactos baja R.</p>'],
      ['El sistema inmune', 'Inmunidad', 'Barreras, respuesta innata y respuesta adaptativa con memoria',
        '<p>El cuerpo se defiende en capas: <b>barreras</b> (piel, mucosas, lágrimas, ácido del estómago); la <b>respuesta innata</b>, rápida e inespecífica (inflamación, fiebre, fagocitos); y la <b>respuesta adaptativa</b>, específica, con <b>linfocitos B</b> que producen <b>anticuerpos</b> y <b>linfocitos T</b>. Esta última genera <b>memoria</b>: ante una segunda infección responde más rápido y fuerte. Por eso los recuperados (verde) no se vuelven a infectar en esta simulación.</p>'],
      ['Las vacunas', 'Vacunas', 'Generan memoria inmunológica sin pasar por la enfermedad',
        '<p>Una <b>vacuna</b> presenta al sistema inmune un antígeno del patógeno (inactivado, atenuado, una proteína o su ARNm) para que produzca <b>anticuerpos y memoria</b> sin enfermarse. Las personas vacunadas (amarillo) quedan protegidas en ≈ 90 % de los casos. Las vacunas han erradicado la viruela y casi eliminado la polio y el sarampión en muchos países.</p>'],
      ['Inmunidad de rebaño', 'Rebaño', 'Con suficientes inmunes, el patógeno no encuentra a quién contagiar',
        '<p>Si una fracción suficiente de la población es inmune, cada infectado encuentra pocos susceptibles y R baja de 1: la epidemia no despega y se protege también a quienes <b>no pueden vacunarse</b> (recién nacidos, inmunodeprimidos). El umbral es <b>1 − 1/R₀</b>: ≈ 67 % para R₀ = 3 y ≈ 93 % para el sarampión. Compara en el gráfico el tamaño de la epidemia según la cobertura.</p>']
    ];
  }
  function lessonSet(i, l, ctx, dt, f) {
    if (ctx._st !== i) { ctx._st = i; S.dist = 0; S.vac = i === 4 ? 0.4 : i === 5 ? 0.75 : 0; S.R0 = 3; reset(); }
    if (i === 2) S.dist = l > 0.4 ? 0.6 : 0;
    if (f.playing && S.day < 120) stepODE(dt * (i === 0 ? 1.2 : 4));
  }
  var def = {
    key: 'epidemias-vacunas', title: 'Epidemias, sistema inmune y vacunas', subtitle: 'Simulador 3D · biología y salud', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2, 13, 15], target: [-1.5, 0, 0] }, { id: 'sup', label: 'Superior', pos: [-1.5, 22, 1], target: [-1.5, 0, 0] }],
    layers: [{ id: 'halo', label: 'Zona de contagio', icon: '◌' }],
    build: function (ctx) {
      var s = ctx.scene; tmpC = new T.Color(); dm = new T.Object3D();
      var floor = new T.Mesh(new T.BoxGeometry(2 * W + 1, 0.2, 2 * W + 1), new T.MeshStandardMaterial({ color: 0xced4da, roughness: 0.9 })); floor.position.y = -0.1; s.add(floor);
      inst = new T.InstancedMesh((T.CapsuleGeometry ? new T.CapsuleGeometry(0.16, 0.3, 4, 8) : new T.SphereGeometry(0.22, 10, 8)), new T.MeshStandardMaterial({ roughness: 0.5 }), NA); inst.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NA * 3), 3); inst.frustumCulled = false; s.add(inst);
      G.halo = new T.InstancedMesh(new T.RingGeometry(0.45, 0.55, 20), new T.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.5, side: T.DoubleSide }), NA); G.halo.frustumCulled = false; s.add(G.halo);
      for (var k = 0; k < NA; k++) A.push({ x: (Math.random() * 2 - 1) * W, z: (Math.random() * 2 - 1) * W, h: Math.random() * 6.28, st: 0, t: 0 });
      reset(); ['a', 'b', 'c'].forEach(function (k2) { lab[k2] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx, dt, f); else if (S.run && S.day < 150) stepODE(dt * 4);
      var sp = 1.6 * (1 - S.dist * 0.8), hal = ctx.layer('halo'), nh = 0;
      A.forEach(function (a, k) {
        a.h += (Math.random() - 0.5) * 0.5; a.x += Math.cos(a.h) * sp * dt; a.z += Math.sin(a.h) * sp * dt;
        if (Math.abs(a.x) > W) { a.x = Math.sign(a.x) * W; a.h = Math.PI - a.h; } if (Math.abs(a.z) > W) { a.z = Math.sign(a.z) * W; a.h = -a.h; }
        dm.position.set(a.x, 0.32, a.z); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); dm.updateMatrix(); inst.setMatrixAt(k, dm.matrix); tmpC.setHex(COL[a.st]); inst.setColorAt(k, tmpC);
        if (hal && a.st === 1) { dm.position.set(a.x, 0.02, a.z); dm.rotation.set(-Math.PI / 2, 0, 0); dm.scale.setScalar(1 + 0.25 * Math.sin(ctx.now * 4 + k)); dm.updateMatrix(); G.halo.setMatrixAt(nh++, dm.matrix); }
      });
      G.halo.count = nh; G.halo.instanceMatrix.needsUpdate = true; inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
      var Rt = Reff() * S.s / NA;
      lab.a.pos(-1.5, 3, -W).set('Día ' + f0(S.day) + ' · S ' + f0(S.s) + ' · I ' + f0(S.i) + ' · R ' + f0(S.r) + (S.v ? ' · V ' + f0(S.v) : ''), 'bl-lead').vis(true);
      lab.b.pos(-1.5, 2, -W).set('R₀ = ' + f1(S.R0) + ' · R efectivo = ' + f2(Rt) + (Rt < 1 ? ' (< 1: los casos bajan)' : ' (> 1: los casos suben)'), Rt < 1 ? 'bl-neg' : 'bl-warn').vis(true);
      lab.c.pos(-1.5, 1, -W).set('Vacunados ' + f0(S.vac * 100) + ' % · umbral de rebaño 1 − 1/R₀ = ' + f0(Math.max(0, 1 - 1 / Reff()) * 100) + ' %', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.R0 && u.R0.set(S.R0); u.vac && u.vac.set(S.vac * 100); u.dist && u.dist.set(S.dist * 100); } },
    hud: function () { return { eq: { chip: 'R₀', name: 'Modelo SIR', body: '<div class="eqline"><small>Contagios</small>β·S·I/N</div><div class="eqline"><small>Recuperación</small>γ·I (γ = 1/duración)</div><div class="eqline"><small>Umbral de rebaño</small>1 − 1/R₀</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'susceptible' }, { label: 'Rojo', color: '#ff6b6b', text: 'infectado' }, { label: 'Verde', color: '#51cf66', text: 'recuperado (inmune)' }, { label: 'Amarillo', color: '#fcc419', text: 'vacunado (inmune)' }] }; },
    measures: function () { var peak = 0, pd = 0; S.hist.forEach(function (q) { if (q[2] > peak) { peak = q[2]; pd = q[0]; } }); return [['Día', f0(S.day)], ['Susceptibles', f0(S.s)], ['Infectados', f0(S.i)], ['Recuperados', f0(S.r)], ['Vacunados inmunes', f0(S.v)], ['R₀ · R efectivo', f1(S.R0) + ' · ' + f2(Reff() * S.s / NA)], ['Máximo de infectados', f0(peak) + ' (día ' + f0(pd) + ')'], ['Umbral de inmunidad de rebaño', f0(Math.max(0, 1 - 1 / Reff()) * 100) + ' %']]; },
    ideas: ['Patógenos: virus, bacterias, hongos y parásitos.', 'SIR: susceptibles → infectados → recuperados.', 'R > 1: crecen los casos; R < 1: disminuyen.', 'Inmunidad adaptativa: anticuerpos y memoria.', 'Vacuna: memoria sin enfermedad.', 'Umbral de rebaño: 1 − 1/R₀.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Enfermedad y población'); el.appendChild(c);
      ui.R0 = kit.ui.slider({ label: 'R₀ (contagios por infectado)', min: 0.8, max: 15, step: 0.1, value: S.R0, digits: 1, onInput: function (v) { ctx.goManual(); S.R0 = v; } });
      ui.D = kit.ui.slider({ label: 'Días contagiosos', min: 3, max: 14, step: 1, value: S.D, digits: 0, onInput: function (v) { ctx.goManual(); S.D = v; } });
      ui.vac = kit.ui.slider({ label: 'Cobertura de vacunación (%)', min: 0, max: 98, step: 1, value: S.vac * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.vac = v / 100; } });
      ui.dist = kit.ui.slider({ label: 'Medidas de prevención (% de reducción de contactos)', min: 0, max: 80, step: 5, value: S.dist * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.dist = v / 100; } });
      c.appendChild(kit.ui.sliders([ui.R0, ui.D, ui.vac, ui.dist]));
      el.appendChild(ctx.btnRow([{ t: 'Nueva epidemia', primary: true, fn: function () { ctx.goManual(); reset(); } }, { t: 'Pausa / seguir', fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Curvas S, I y R', h: 230, note: 'Azul: susceptibles; rojo: infectados; verde: recuperados; amarillo: vacunados.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, tm = Math.max(60, S.day), sx = function (t) { return L + pw * t / tm; }, sy = function (v) { return Tp + ph - ph * v / NA; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(NA * i / 4)); cx.lineTo(L + pw, sy(NA * i / 4)); cx.stroke(); cx.fillText(f0(NA * i / 4), L - 5, sy(NA * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= tm; i += 20) cx.fillText(i, sx(i), h - B + 13); cx.fillText('días  ·  personas', L + pw / 2, h - 3);
        [[1, '#4dabf7'], [2, '#ff6b6b'], [3, '#51cf66'], [4, '#fcc419']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); S.hist.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Tamaño de la epidemia según la cobertura', h: 200, note: 'Fracción de la población que se termina infectando. Al superar el umbral 1 − 1/R₀ (línea punteada), la epidemia casi no ocurre.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, sx = function (c) { return L + pw * c; }, sy = function (v) { return Tp + ph - ph * v; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(i * 10 + ' %', sx(i / 10), h - B + 13); cx.fillText('cobertura de vacunación  ·  % de la población infectada', L + pw / 2, h - 3);
        cx.textAlign = 'right'; [0, 0.5, 1].forEach(function (v) { cx.fillText(f0(v * 100), L - 4, sy(v) + 3); });
        var th = Math.max(0, 1 - 1 / Reff()) / S.eff; cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(sx(Math.min(1, th)), Tp); cx.lineTo(sx(Math.min(1, th)), Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#c92a2a'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 40; i++) { var c = i / 40, v = finalSize(c); if (i) cx.lineTo(sx(c), sy(v)); else cx.moveTo(sx(c), sy(v)); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#1864ab'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.vac), sy(finalSize(S.vac)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, Re = Reff();
      return '<div class="card-kicker">Modelo SIR · ' + NA + ' personas</div><table class="calc-table">' + row('γ = 1/duración', '1/' + f0(S.D) + ' = <b>' + fmt(1 / S.D, 3) + ' por día</b>') + row('β = R·γ', f2(Re) + '·' + fmt(1 / S.D, 3) + ' = <b>' + fmt(Re / S.D, 3) + ' por día</b>') + row('R efectivo hoy', 'R·S/N = ' + f2(Re) + '·' + f0(S.s) + '/' + NA + ' = <b>' + f2(Re * S.s / NA) + '</b>') + row('Umbral de rebaño', '1 − 1/' + f2(Re) + ' = <b>' + f0(Math.max(0, 1 - 1 / Re) * 100) + ' %</b> de inmunes') + row('Cobertura necesaria (eficacia ' + f0(S.eff * 100) + ' %)', '<b>' + (Re > 1 ? f0(Math.min(1, (1 - 1 / Re) / S.eff) * 100) + ' %' : '0 %') + '</b>') + '</table>';
    },
    quiz: [
      { q: 'Un ejemplo de barrera defensiva del cuerpo es…', options: ['la piel', 'los anticuerpos', 'las vacunas', 'los linfocitos B'], answer: 0, why: 'Las barreras impiden la entrada de patógenos.' },
      { q: 'La memoria inmunológica la aportan…', options: ['los linfocitos de la respuesta adaptativa', 'la piel', 'la fiebre', 'el ácido del estómago'], answer: 0, why: 'Linfocitos B y T de memoria.' },
      { q: 'Una vacuna funciona porque…', options: ['genera anticuerpos y memoria sin causar la enfermedad', 'mata directamente a todos los virus', 'es un antibiótico', 'reemplaza a los glóbulos blancos'], answer: 0, why: 'Presenta antígenos al sistema inmune.' },
      { q: 'Si R efectivo es menor que 1…', options: ['los casos disminuyen', 'los casos aumentan', 'la epidemia se duplica', 'no cambia nada'], answer: 0, why: 'Cada infectado contagia, en promedio, a menos de una persona.' },
      { q: 'Con R₀ = 4, el umbral de inmunidad de rebaño es…', options: ['75 %', '25 %', '40 %', '100 %'], answer: 0, why: '1 − 1/4 = 0,75.' },
      { q: 'La inmunidad de rebaño protege especialmente a…', options: ['quienes no pueden vacunarse', 'solo a los vacunados', 'a los virus', 'a nadie'], answer: 0, why: 'El patógeno no encuentra cadenas de contagio.' },
      { q: 'Ventilar y usar mascarilla ayuda porque…', options: ['reduce los contagios y baja R', 'aumenta R₀', 'cura la enfermedad', 'reemplaza la vacuna'], answer: 0, why: 'Menos transmisión por contacto.' },
      { q: 'Los antibióticos sirven contra…', options: ['bacterias', 'virus', 'todos los patógenos', 'alergias'], answer: 0, why: 'No actúan sobre los virus.' }
    ],
    help: { intro: 'Cada figura es una persona. En «Lab» cambia R₀, la duración del contagio, la cobertura de vacunación y las medidas de prevención; «Nueva epidemia» parte con 3 casos.', items: [['Colores', 'azul susceptible, rojo infectado, verde recuperado, amarillo vacunado.'], ['Gráficos', 'curvas SIR y tamaño final de la epidemia según la cobertura.'], ['Cálculo', 'R efectivo y cobertura necesaria para la inmunidad de rebaño.']], try: ['Con R₀ = 3, ¿qué cobertura evita la epidemia?', 'Prueba R₀ = 15 (sarampión): ¿qué cobertura hace falta?', 'Sin vacunas, sube las medidas de prevención: ¿qué pasa con el máximo de casos?'] }
  };
  MSim.create(def);
})();
