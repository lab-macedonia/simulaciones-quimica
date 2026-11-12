/* Cinemática: MRU y MRUA — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var S = { x0: 0, v0: 10, a: 0, t: 0, run: true, two: false, xB0: 110, vB: -10, tmax: 10 };
  var car, carB, marks = [], arrV, arrA, ticks = [], lab = {}, wheels = [], wheelsB = [];
  function X(m) { return (m - 60) * 0.13; }
  function tStop() { return (S.a < 0 && S.v0 > 0) ? S.v0 / -S.a : (S.a > 0 && S.v0 < 0) ? -S.v0 / S.a : Infinity; }
  function posA(t) { var ts = tStop(); if (t > ts) t = ts; return S.x0 + S.v0 * t + 0.5 * S.a * t * t; }
  function velA(t) { return t > tStop() ? 0 : S.v0 + S.a * t; }
  function posB(t) { return S.xB0 + S.vB * t; }
  function meet() {
    // x0 + v0 t + a t²/2 = xB0 + vB t
    var A = 0.5 * S.a, B = S.v0 - S.vB, C = S.x0 - S.xB0, r = [];
    if (Math.abs(A) < 1e-9) { if (Math.abs(B) > 1e-9) r.push(-C / B); }
    else { var D = B * B - 4 * A * C; if (D >= 0) { r.push((-B + Math.sqrt(D)) / (2 * A)); r.push((-B - Math.sqrt(D)) / (2 * A)); } }
    r = r.filter(function (t) { return t >= 0 && t <= tStop(); }).sort(function (a, b) { return a - b; });
    return r.length ? r[0] + 0 : null;
  }
  function stages() {
    return [
      ['Posición y desplazamiento', 'Posición', 'La posición x se mide desde un origen; Δx = x final − x inicial',
        '<p>Para describir un movimiento elegimos un <b>sistema de referencia</b>: un origen (x = 0) y un sentido positivo. La <b>posición</b> x indica dónde está el móvil y el <b>desplazamiento</b> Δx = x<sub>f</sub> − x<sub>i</sub> cuánto cambió. La <b>distancia recorrida</b> es el largo del camino: coinciden si el móvil no se devuelve.</p>'],
      ['Movimiento rectilíneo uniforme', 'MRU', 'Velocidad constante: recorre distancias iguales en tiempos iguales',
        '<p>En el <b>MRU</b> la velocidad no cambia: <b>x = x₀ + v·t</b>. Las marcas que deja el auto cada segundo quedan <b>igualmente espaciadas</b>. En el gráfico <b>x–t</b> el movimiento es una recta cuya <b>pendiente es la velocidad</b>; en el gráfico v–t es una recta horizontal.</p>'],
      ['Sentido y signo de la velocidad', 'Signo', 'Una velocidad negativa indica movimiento en sentido contrario al positivo',
        '<p>La velocidad es un <b>vector</b>: tiene módulo (rapidez) y sentido. Si el móvil avanza hacia valores menores de x, su velocidad es <b>negativa</b> y la recta x–t baja. La <b>rapidez</b> es siempre positiva: aquí el auto va a 9 m/s, pero su velocidad es −9 m/s.</p>'],
      ['Movimiento uniformemente acelerado', 'MRUA', 'Aceleración constante: la velocidad cambia lo mismo cada segundo',
        '<p>En el <b>MRUA</b> la aceleración es constante: <b>v = v₀ + a·t</b> y <b>x = x₀ + v₀·t + ½·a·t²</b>. Partiendo del reposo con a = 2 m/s², cada segundo la velocidad sube 2 m/s y las marcas se separan cada vez más. El gráfico x–t es una <b>parábola</b> y el v–t, una recta cuya pendiente es la aceleración. El área bajo v–t es el desplazamiento.</p>'],
      ['Frenado', 'Frenado', 'Con aceleración opuesta a la velocidad el móvil se detiene: d = v₀² / (2|a|)',
        '<p>Si la aceleración tiene <b>sentido opuesto</b> a la velocidad, el móvil frena. A 20 m/s (72 km/h) con a = −4 m/s² se detiene en t = v₀/|a| = 5 s, tras recorrer <b>d = v₀²/(2|a|) = 50 m</b>. Al <b>duplicar la rapidez</b> la distancia de frenado se <b>cuadruplica</b>: por eso los límites de velocidad importan.</p>'],
      ['Encuentro de dos móviles', 'Encuentro', 'Se encuentran cuando están en la misma posición en el mismo instante',
        '<p>Dos autos salen a la vez desde extremos opuestos: A desde x = 0 a 12 m/s y B desde x = 110 m a −10 m/s. Se encuentran cuando <b>x<sub>A</sub>(t) = x<sub>B</sub>(t)</b>: 12·t = 110 − 10·t → <b>t = 5 s</b>, en x = 60 m. En el gráfico x–t es el punto donde se cruzan las dos rectas.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.two = false; S.xB0 = 110; S.vB = -10;
    if (i === 0) { S.x0 = 10; S.v0 = 8; S.a = 0; S.tmax = 10; }
    else if (i === 1) { S.x0 = 0; S.v0 = 10; S.a = 0; S.tmax = 10; }
    else if (i === 2) { S.x0 = 110; S.v0 = -9; S.a = 0; S.tmax = 10; }
    else if (i === 3) { S.x0 = 0; S.v0 = 0; S.a = 2; S.tmax = 10; }
    else if (i === 4) { S.x0 = 0; S.v0 = 20; S.a = -4; S.tmax = 7; }
    else { S.x0 = 0; S.v0 = 12; S.a = 0; S.two = true; S.tmax = 8; }
    S.t = S.tmax * l;
  }
  function makeCar(color) {
    var g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(2.2, 0.55, 1.1), new T.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.2 }));
    body.position.y = 0.6; g.add(body);
    var cab = new T.Mesh(new T.BoxGeometry(1.1, 0.45, 0.95), new T.MeshStandardMaterial({ color: 0xdbe4ee, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 })); cab.position.set(-0.15, 1.08, 0); g.add(cab);
    var ws = [], wg = new T.CylinderGeometry(0.32, 0.32, 0.22, 16), wm = new T.MeshStandardMaterial({ color: 0x222831, roughness: 0.8 });
    [[-0.7, 0.58], [0.7, 0.58], [-0.7, -0.58], [0.7, -0.58]].forEach(function (p) { var w = new T.Mesh(wg, wm); w.rotation.x = Math.PI / 2; w.position.set(p[0], 0.32, p[1]); g.add(w); ws.push(w); });
    g.scale.setScalar(0.62); return { g: g, w: ws };
  }
  var def = {
    key: 'cinematica', title: 'Cinemática: MRU y MRUA', subtitle: 'Simulador 3D · física', accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 6, dur: 12, offset: 0.22,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.4, 8.5, 14], target: [-1.4, 2.6, 0] }, { id: 'lateral', label: 'Lateral', pos: [-1.4, 3.4, 14], target: [-1.4, 2.4, 0] }, { id: 'sup', label: 'Superior', pos: [-1.4, 18, 1.5], target: [-1.4, 0, 0] }],
    layers: [{ id: 'marks', label: 'Marcas cada segundo', icon: '⋯' }, { id: 'vec', label: 'Vectores v y a', icon: '➜' }],
    build: function (ctx) {
      var s = ctx.scene, i;
      var road = new T.Mesh(new T.BoxGeometry(17, 0.2, 3.6), new T.MeshStandardMaterial({ color: 0x3b4350, roughness: 0.9 })); road.position.y = -0.1; s.add(road);
      var line = new T.Mesh(new T.BoxGeometry(17, 0.03, 0.1), new T.MeshStandardMaterial({ color: 0xf8f9fa })); line.position.y = 0.02; s.add(line);
      for (i = 0; i <= 12; i++) {
        var tk = new T.Mesh(new T.BoxGeometry(0.06, 0.05, i % 5 === 0 ? 3.6 : 1), new T.MeshStandardMaterial({ color: i % 5 === 0 ? 0xffd43b : 0xadb5bd })); tk.position.set(X(i * 10), 0.03, 0); s.add(tk);
        ticks.push(ctx.label(String(i * 10), 'bl-d').pos(X(i * 10), 0.1, 2.3));
      }
      var o = makeCar(0x1c7ed6); car = o.g; wheels = o.w; s.add(car);
      o = makeCar(0xe8590c); carB = o.g; wheelsB = o.w; carB.rotation.y = Math.PI; s.add(carB);
      var mg = new T.SphereGeometry(0.13, 12, 8), mm = new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x6b5200 });
      for (i = 0; i <= 12; i++) { var m = new T.Mesh(mg, mm); m.visible = false; s.add(m); marks.push(m); }
      arrV = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(0, 2, 0), 2, 0x51cf66, 0.5, 0.35); s.add(arrV);
      arrA = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(0, 2.8, 0), 2, 0xff6b6b, 0.5, 0.35); s.add(arrA);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      else if (S.run) { S.t += dt; if (S.t > S.tmax) S.t = 0; }
      var t = S.t, xa = posA(t), va = velA(t), aa = t > tStop() ? 0 : S.a;
      car.position.set(X(xa), 0, -0.8); car.rotation.y = va < 0 || (va === 0 && S.v0 < 0) ? Math.PI : 0;
      wheels.forEach(function (w) { w.rotation.y = -xa * 0.13 / 0.2 * (car.rotation.y ? -1 : 1); });
      carB.visible = S.two; var xb = posB(t); carB.position.set(X(xb), 0, 0.8); wheelsB.forEach(function (w) { w.rotation.y = xb * 0.13 / 0.2; });
      var on = ctx.layer('marks');
      marks.forEach(function (m, k) { var ok = on && k <= t + 1e-6 && k <= S.tmax; m.visible = ok; if (ok) m.position.set(X(posA(k)), 0.15, -1.75); });
      var vec = ctx.layer('vec'), p = car.position.clone();
      arrV.visible = vec && Math.abs(va) > 0.05; if (arrV.visible) { arrV.position.set(p.x, 1.35, p.z); arrV.setDirection(new T.Vector3(Math.sign(va), 0, 0)); arrV.setLength(0.4 + Math.abs(va) * 0.1, 0.32, 0.22); }
      arrA.visible = vec && Math.abs(aa) > 0.01; if (arrA.visible) { arrA.position.set(p.x, 1.9, p.z); arrA.setDirection(new T.Vector3(Math.sign(aa), 0, 0)); arrA.setLength(0.4 + Math.abs(aa) * 0.35, 0.32, 0.22); }
      lab.a.pos(p.x, 2.9, p.z).set('A · x = ' + f1(xa) + ' m · v = ' + f1(va) + ' m/s', 'bl-lead').vis(true);
      lab.b.pos(X(xb), 2.3, 0.8).set('B · x = ' + f1(xb) + ' m · v = ' + f1(S.vB) + ' m/s', 'bl-pos').vis(S.two);
      lab.c.pos(0, 4.6, 0).set('t = ' + f2(t) + ' s', 'bl-d').vis(true);
      var tm = S.two ? meet() : null; lab.d.pos(tm != null ? X(posA(tm)) : 0, 3.8, 0).set(tm != null ? 'Encuentro: t = ' + f2(tm) + ' s, x = ' + f1(posA(tm)) + ' m' : '', 'bl-warn').vis(tm != null);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.x0 && u.x0.set(S.x0); u.v0 && u.v0.set(S.v0); u.a && u.a.set(S.a); } },
    hud: function () { return { eq: { chip: 'x(t)', name: S.a ? 'MRUA' : 'MRU', body: '<div class="eqline"><small>Posición</small>x = x₀ + v₀·t + ½·a·t²</div><div class="eqline"><small>Velocidad</small>v = v₀ + a·t</div><div class="eqline"><small>Sin tiempo</small>v² = v₀² + 2·a·Δx</div>' }, legend: [{ label: 'Flecha verde', color: '#51cf66', text: 'velocidad' }, { label: 'Flecha roja', color: '#ff6b6b', text: 'aceleración' }, { label: 'Puntos amarillos', color: '#ffd43b', text: 'posición cada 1 s' }] }; },
    measures: function () { var t = S.t, xa = posA(t); return [['Tiempo', f2(t) + ' s'], ['Posición x', f1(xa) + ' m'], ['Desplazamiento Δx', f1(xa - S.x0) + ' m'], ['Velocidad v', f2(velA(t)) + ' m/s (' + f1(velA(t) * 3.6) + ' km/h)'], ['Aceleración a', f2(t > tStop() ? 0 : S.a) + ' m/s²'], ['Tipo', S.a ? 'MRUA' : 'MRU']]; },
    ideas: ['MRU: <b>x = x₀ + v·t</b>; marcas igualmente espaciadas.', 'MRUA: <b>v = v₀ + a·t</b> y <b>x = x₀ + v₀t + ½at²</b>.', 'Pendiente de x–t = velocidad; pendiente de v–t = aceleración.', 'Área bajo v–t = desplazamiento.', 'Distancia de frenado: <b>d = v₀²/(2|a|)</b>.', '1 m/s = 3,6 km/h.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Auto A'); el.appendChild(c);
      ui.x0 = kit.ui.slider({ label: 'Posición inicial x₀ (m)', min: 0, max: 120, step: 1, value: S.x0, digits: 0, onInput: function (v) { ctx.goManual(); S.x0 = v; S.t = 0; } });
      ui.v0 = kit.ui.slider({ label: 'Velocidad inicial v₀ (m/s)', min: -20, max: 25, step: 0.5, value: S.v0, onInput: function (v) { ctx.goManual(); S.v0 = v; S.t = 0; } });
      ui.a = kit.ui.slider({ label: 'Aceleración a (m/s²)', min: -6, max: 6, step: 0.1, value: S.a, onInput: function (v) { ctx.goManual(); S.a = v; S.t = 0; } });
      ui.tm = kit.ui.slider({ label: 'Duración de la simulación (s)', min: 2, max: 12, step: 1, value: S.tmax, digits: 0, onInput: function (v) { ctx.goManual(); S.tmax = v; } });
      c.appendChild(kit.ui.sliders([ui.x0, ui.v0, ui.a, ui.tm]));
      var c2 = kit.ui.card('Auto B (MRU)'); el.appendChild(c2);
      ui.two = kit.ui.seg([{ v: false, label: 'Sin auto B' }, { v: true, label: 'Con auto B' }], S.two, function (v) { ctx.goManual(); S.two = v; S.t = 0; }); c2.appendChild(ui.two);
      ui.xb = kit.ui.slider({ label: 'Posición inicial de B (m)', min: 0, max: 120, step: 1, value: S.xB0, digits: 0, onInput: function (v) { ctx.goManual(); S.xB0 = v; S.t = 0; } });
      ui.vb = kit.ui.slider({ label: 'Velocidad de B (m/s)', min: -20, max: 20, step: 0.5, value: S.vB, onInput: function (v) { ctx.goManual(); S.vB = v; S.t = 0; } });
      c2.appendChild(kit.ui.sliders([ui.xb, ui.vb]));
      el.appendChild(ctx.btnRow([{ t: 'Reiniciar t = 0', primary: true, fn: function () { ctx.goManual(); S.t = 0; S.run = true; } }, { t: 'Pausa / seguir', fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Posición frente a tiempo (x–t)', h: 230, note: 'Pendiente = velocidad. En MRUA la curva es una parábola. Si hay auto B, el cruce es el encuentro.', draw: function (cx, w, h, col) { plot(cx, w, h, col, 'x', function (t) { return posA(t); }, S.two ? function (t) { return posB(t); } : null, -10, 130, 'x (m)'); } },
      { title: 'Velocidad frente a tiempo (v–t)', h: 210, note: 'Pendiente = aceleración; el área bajo la curva es el desplazamiento (sombreada).', draw: function (cx, w, h, col) { plot(cx, w, h, col, 'v', function (t) { return velA(t); }, S.two ? function () { return S.vB; } : null, -25, 30, 'v (m/s)'); } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, t = S.t, ts = tStop(), xa = posA(t), va = velA(t);
      var h = '<div class="card-kicker">' + (S.a ? 'MRUA' : 'MRU') + ' · t = ' + f2(t) + ' s</div><div class="calc-step">1 · Datos</div><table class="calc-table">' + row('x₀', f1(S.x0) + ' m') + row('v₀', f2(S.v0) + ' m/s = ' + f1(S.v0 * 3.6) + ' km/h') + row('a', f2(S.a) + ' m/s²') + '</table>' +
        '<div class="calc-step">2 · Ecuaciones</div><table class="calc-table">' + row('v = v₀ + a·t', f2(S.v0) + ' + (' + f2(S.a) + ')·' + f2(Math.min(t, ts)) + ' = <b>' + f2(va) + ' m/s</b>') +
        row('x = x₀ + v₀t + ½at²', f1(S.x0) + ' + ' + f2(S.v0) + '·' + f2(Math.min(t, ts)) + ' + ½·(' + f2(S.a) + ')·' + f2(Math.min(t, ts)) + '² = <b>' + f1(xa) + ' m</b>') + '</table>';
      if (isFinite(ts)) h += '<div class="calc-step">3 · Frenado</div><table class="calc-table">' + row('Se detiene en', 't = |v₀/a| = <b>' + f2(ts) + ' s</b>') + row('Distancia de frenado', 'v₀²/(2|a|) = <b>' + f1(S.v0 * S.v0 / (2 * Math.abs(S.a))) + ' m</b>') + '</table>';
      var tm = S.two ? meet() : null; if (S.two) h += '<div class="calc-step">' + (isFinite(ts) ? '4' : '3') + ' · Encuentro con B</div><table class="calc-table">' + row('x_A(t) = x_B(t)', tm != null ? 't = <b>' + f2(tm) + ' s</b> en x = <b>' + f1(posA(tm)) + ' m</b>' : 'no se encuentran') + '</table>';
      return h;
    },
    quiz: [
      { q: 'En un MRU, el gráfico posición–tiempo es…', options: ['una recta inclinada', 'una parábola', 'una recta horizontal', 'una curva que decrece'], answer: 0, why: 'x = x₀ + v·t es lineal en t; su pendiente es la velocidad.' },
      { q: 'Un auto viaja a 72 km/h. Su rapidez en m/s es…', options: ['20 m/s', '72 m/s', '7,2 m/s', '259 m/s'], answer: 0, why: '72 / 3,6 = 20 m/s.' },
      { q: 'Partiendo del reposo con a = 2 m/s², ¿qué velocidad tiene a los 5 s?', options: ['10 m/s', '25 m/s', '2,5 m/s', '5 m/s'], answer: 0, why: 'v = 0 + 2·5 = 10 m/s.' },
      { q: 'En el mismo caso (reposo, a = 2 m/s²), ¿cuánto avanza en 5 s?', options: ['25 m', '10 m', '50 m', '5 m'], answer: 0, why: 'x = ½·2·5² = 25 m.' },
      { q: 'La pendiente del gráfico velocidad–tiempo representa…', options: ['la aceleración', 'la posición', 'el desplazamiento', 'la rapidez media'], answer: 0, why: 'a = Δv/Δt.' },
      { q: 'Si la rapidez inicial se duplica (misma desaceleración), la distancia de frenado…', options: ['se cuadruplica', 'se duplica', 'no cambia', 'se reduce a la mitad'], answer: 0, why: 'd = v₀²/(2|a|) depende del cuadrado de v₀.' },
      { q: 'Las marcas dejadas cada segundo se separan cada vez más. El movimiento es…', options: ['acelerado', 'uniforme', 'frenado', 'en reposo'], answer: 0, why: 'Cada segundo recorre más distancia: la velocidad aumenta.' },
      { q: 'Dos autos parten a 110 m de distancia, uno hacia el otro, a 12 y 10 m/s. Se encuentran a los…', options: ['5 s', '11 s', '9,2 s', '2 s'], answer: 0, why: 'Se acercan a 22 m/s: 110/22 = 5 s.' }
    ],
    help: { intro: 'Sigue la lección o usa «Lab» para fijar x₀, v₀ y a del auto A y, si quieres, un auto B en MRU para resolver un encuentro.', items: [['Auto azul (A)', 'su etiqueta muestra posición y velocidad en cada instante.'], ['Marcas amarillas', 'posición de A en cada segundo: igual espaciado = MRU.'], ['Gráficos', 'x–t y v–t con el instante actual marcado.'], ['Cálculo', 'ecuaciones con los valores actuales, frenado y encuentro.']], try: ['Pon a = 0 y cambia v₀: ¿qué le pasa a la pendiente de x–t?', 'Con v₀ = 20 m/s y a = −4 m/s², ¿dónde se detiene? Duplica v₀ y compara.', 'Activa el auto B y busca el encuentro en el gráfico x–t.'] }
  };
  function plot(cx, w, h, col, kind, fA, fB, lo, hi, ylab) {
    var L = 42, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, tm = S.tmax, sx = function (t) { return L + pw * t / tm; }, sy = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); }, i, st = kind === 'x' ? 20 : 10;
    cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right';
    for (i = Math.ceil(lo / st) * st; i <= hi; i += st) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 5, sy(i) + 3); }
    cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(L, sy(0)); cx.lineTo(L + pw, sy(0)); cx.stroke();
    cx.textAlign = 'center'; for (i = 0; i <= tm; i += tm > 8 ? 2 : 1) cx.fillText(i, sx(i), h - B + 13); cx.fillText('t (s)  ·  ' + ylab, L + pw / 2, h - 3);
    if (kind === 'v') { cx.fillStyle = 'rgba(116,192,252,.22)'; cx.beginPath(); cx.moveTo(sx(0), sy(0)); for (i = 0; i <= 60; i++) { var tt = Math.min(S.t, tm) * i / 60; cx.lineTo(sx(tt), sy(fA(tt))); } cx.lineTo(sx(Math.min(S.t, tm)), sy(0)); cx.closePath(); cx.fill(); }
    function curve(fn, c) { cx.strokeStyle = c; cx.lineWidth = 2.4; cx.beginPath(); for (var k = 0; k <= 120; k++) { var t = tm * k / 120, v = clamp(fn(t), lo, hi); if (k) cx.lineTo(sx(t), sy(v)); else cx.moveTo(sx(t), sy(v)); } cx.stroke(); cx.lineWidth = 1; }
    curve(fA, '#1c7ed6'); if (fB) curve(fB, '#e8590c');
    var t0 = Math.min(S.t, tm); cx.fillStyle = '#fff'; cx.strokeStyle = '#1c7ed6'; cx.lineWidth = 2.2; cx.beginPath(); cx.arc(sx(t0), sy(clamp(fA(t0), lo, hi)), 4.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
  }
  MSim.create(def);
})();
