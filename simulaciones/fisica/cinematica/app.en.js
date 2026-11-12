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
      ['Position and displacement', 'Position', 'Position x is measured from an origin; Δx = final x − initial x',
        '<p>To describe a motion we choose a <b>reference frame</b>: an origin (x = 0) and a positive direction. The <b>position</b> x tells where the object is and the <b>displacement</b> Δx = x<sub>f</sub> − x<sub>i</sub> how much it changed. The <b>distance travelled</b> is the length of the path: they are equal if the object does not turn back.</p>'],
      ['Uniform linear motion', 'Uniform', 'Constant velocity: equal distances in equal times',
        '<p>In <b>uniform motion</b> the velocity does not change: <b>x = x₀ + v·t</b>. The marks the car leaves every second are <b>evenly spaced</b>. In the <b>x–t</b> graph the motion is a straight line whose <b>slope is the velocity</b>; in the v–t graph it is a horizontal line.</p>'],
      ['Direction and sign of velocity', 'Sign', 'A negative velocity means motion opposite to the positive direction',
        '<p>Velocity is a <b>vector</b>: it has magnitude (speed) and direction. If the object moves towards smaller x, its velocity is <b>negative</b> and the x–t line goes down. <b>Speed</b> is always positive: here the car moves at 9 m/s, but its velocity is −9 m/s.</p>'],
      ['Uniformly accelerated motion', 'Accelerated', 'Constant acceleration: the velocity changes by the same amount every second',
        '<p>With <b>constant acceleration</b>: <b>v = v₀ + a·t</b> and <b>x = x₀ + v₀·t + ½·a·t²</b>. Starting from rest with a = 2 m/s², the velocity rises 2 m/s every second and the marks spread further and further apart. The x–t graph is a <b>parabola</b> and the v–t graph a line whose slope is the acceleration. The area under v–t is the displacement.</p>'],
      ['Braking', 'Braking', 'With acceleration opposite to the velocity the object stops: d = v₀² / (2|a|)',
        '<p>If the acceleration points <b>opposite</b> to the velocity, the object slows down. At 20 m/s (72 km/h) with a = −4 m/s² it stops at t = v₀/|a| = 5 s, after travelling <b>d = v₀²/(2|a|) = 50 m</b>. <b>Doubling the speed</b> makes the braking distance <b>four times</b> longer: that is why speed limits matter.</p>'],
      ['Two objects meeting', 'Meeting', 'They meet when they are at the same position at the same instant',
        '<p>Two cars leave at the same time from opposite ends: A from x = 0 at 12 m/s and B from x = 110 m at −10 m/s. They meet when <b>x<sub>A</sub>(t) = x<sub>B</sub>(t)</b>: 12·t = 110 − 10·t → <b>t = 5 s</b>, at x = 60 m. In the x–t graph it is the point where the two lines cross.</p>']
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
    key: 'cinematica', title: 'Kinematics: uniform and accelerated motion', subtitle: '3D simulator · physics', accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 6, dur: 12, offset: 0.22,
    views: [{ id: 'libre', label: 'Free', pos: [-1.4, 8.5, 14], target: [-1.4, 2.6, 0] }, { id: 'lateral', label: 'Side', pos: [-1.4, 3.4, 14], target: [-1.4, 2.4, 0] }, { id: 'sup', label: 'Top', pos: [-1.4, 18, 1.5], target: [-1.4, 0, 0] }],
    layers: [{ id: 'marks', label: 'Marks every second', icon: '⋯' }, { id: 'vec', label: 'v and a vectors', icon: '➜' }],
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
      var tm = S.two ? meet() : null; lab.d.pos(tm != null ? X(posA(tm)) : 0, 3.8, 0).set(tm != null ? 'Meeting: t = ' + f2(tm) + ' s, x = ' + f1(posA(tm)) + ' m' : '', 'bl-warn').vis(tm != null);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.x0 && u.x0.set(S.x0); u.v0 && u.v0.set(S.v0); u.a && u.a.set(S.a); } },
    hud: function () { return { eq: { chip: 'x(t)', name: S.a ? 'Accelerated' : 'Uniform', body: '<div class="eqline"><small>Position</small>x = x₀ + v₀·t + ½·a·t²</div><div class="eqline"><small>Velocity</small>v = v₀ + a·t</div><div class="eqline"><small>Timeless</small>v² = v₀² + 2·a·Δx</div>' }, legend: [{ label: 'Green arrow', color: '#51cf66', text: 'velocity' }, { label: 'Red arrow', color: '#ff6b6b', text: 'acceleration' }, { label: 'Yellow dots', color: '#ffd43b', text: 'position every 1 s' }] }; },
    measures: function () { var t = S.t, xa = posA(t); return [['Time', f2(t) + ' s'], ['Position x', f1(xa) + ' m'], ['Displacement Δx', f1(xa - S.x0) + ' m'], ['Velocity v', f2(velA(t)) + ' m/s (' + f1(velA(t) * 3.6) + ' km/h)'], ['Acceleration a', f2(t > tStop() ? 0 : S.a) + ' m/s²'], ['Type', S.a ? 'Accelerated' : 'Uniform']]; },
    ideas: ['Uniform: <b>x = x₀ + v·t</b>; evenly spaced marks.', 'Accelerated: <b>v = v₀ + a·t</b> and <b>x = x₀ + v₀t + ½at²</b>.', 'Slope of x–t = velocity; slope of v–t = acceleration.', 'Area under v–t = displacement.', 'Braking distance: <b>d = v₀²/(2|a|)</b>.', '1 m/s = 3.6 km/h.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Car A'); el.appendChild(c);
      ui.x0 = kit.ui.slider({ label: 'Initial position x₀ (m)', min: 0, max: 120, step: 1, value: S.x0, digits: 0, onInput: function (v) { ctx.goManual(); S.x0 = v; S.t = 0; } });
      ui.v0 = kit.ui.slider({ label: 'Initial velocity v₀ (m/s)', min: -20, max: 25, step: 0.5, value: S.v0, onInput: function (v) { ctx.goManual(); S.v0 = v; S.t = 0; } });
      ui.a = kit.ui.slider({ label: 'Acceleration a (m/s²)', min: -6, max: 6, step: 0.1, value: S.a, onInput: function (v) { ctx.goManual(); S.a = v; S.t = 0; } });
      ui.tm = kit.ui.slider({ label: 'Simulation length (s)', min: 2, max: 12, step: 1, value: S.tmax, digits: 0, onInput: function (v) { ctx.goManual(); S.tmax = v; } });
      c.appendChild(kit.ui.sliders([ui.x0, ui.v0, ui.a, ui.tm]));
      var c2 = kit.ui.card('Car B (uniform)'); el.appendChild(c2);
      ui.two = kit.ui.seg([{ v: false, label: 'No car B' }, { v: true, label: 'With car B' }], S.two, function (v) { ctx.goManual(); S.two = v; S.t = 0; }); c2.appendChild(ui.two);
      ui.xb = kit.ui.slider({ label: 'Initial position of B (m)', min: 0, max: 120, step: 1, value: S.xB0, digits: 0, onInput: function (v) { ctx.goManual(); S.xB0 = v; S.t = 0; } });
      ui.vb = kit.ui.slider({ label: 'Velocity of B (m/s)', min: -20, max: 20, step: 0.5, value: S.vB, onInput: function (v) { ctx.goManual(); S.vB = v; S.t = 0; } });
      c2.appendChild(kit.ui.sliders([ui.xb, ui.vb]));
      el.appendChild(ctx.btnRow([{ t: 'Reset t = 0', primary: true, fn: function () { ctx.goManual(); S.t = 0; S.run = true; } }, { t: 'Pause / resume', fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Position against time (x–t)', h: 230, note: 'Slope = velocity. With constant acceleration the curve is a parabola. With car B, the crossing is the meeting point.', draw: function (cx, w, h, col) { plot(cx, w, h, col, 'x', function (t) { return posA(t); }, S.two ? function (t) { return posB(t); } : null, -10, 130, 'x (m)'); } },
      { title: 'Velocity against time (v–t)', h: 210, note: 'Slope = acceleration; the area under the curve is the displacement (shaded).', draw: function (cx, w, h, col) { plot(cx, w, h, col, 'v', function (t) { return velA(t); }, S.two ? function () { return S.vB; } : null, -25, 30, 'v (m/s)'); } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, t = S.t, ts = tStop(), xa = posA(t), va = velA(t);
      var h = '<div class="card-kicker">' + (S.a ? 'Accelerated' : 'Uniform') + ' · t = ' + f2(t) + ' s</div><div class="calc-step">1 · Data</div><table class="calc-table">' + row('x₀', f1(S.x0) + ' m') + row('v₀', f2(S.v0) + ' m/s = ' + f1(S.v0 * 3.6) + ' km/h') + row('a', f2(S.a) + ' m/s²') + '</table>' +
        '<div class="calc-step">2 · Equations</div><table class="calc-table">' + row('v = v₀ + a·t', f2(S.v0) + ' + (' + f2(S.a) + ')·' + f2(Math.min(t, ts)) + ' = <b>' + f2(va) + ' m/s</b>') +
        row('x = x₀ + v₀t + ½at²', f1(S.x0) + ' + ' + f2(S.v0) + '·' + f2(Math.min(t, ts)) + ' + ½·(' + f2(S.a) + ')·' + f2(Math.min(t, ts)) + '² = <b>' + f1(xa) + ' m</b>') + '</table>';
      if (isFinite(ts)) h += '<div class="calc-step">3 · Braking</div><table class="calc-table">' + row('Stops at', 't = |v₀/a| = <b>' + f2(ts) + ' s</b>') + row('Braking distance', 'v₀²/(2|a|) = <b>' + f1(S.v0 * S.v0 / (2 * Math.abs(S.a))) + ' m</b>') + '</table>';
      var tm = S.two ? meet() : null; if (S.two) h += '<div class="calc-step">' + (isFinite(ts) ? '4' : '3') + ' · Meeting with B</div><table class="calc-table">' + row('x_A(t) = x_B(t)', tm != null ? 't = <b>' + f2(tm) + ' s</b> at x = <b>' + f1(posA(tm)) + ' m</b>' : 'they do not meet') + '</table>';
      return h;
    },
    quiz: [
      { q: 'In uniform motion, the position–time graph is…', options: ['a sloping straight line', 'a parabola', 'a horizontal line', 'a decreasing curve'], answer: 0, why: 'x = x₀ + v·t is linear in t; its slope is the velocity.' },
      { q: 'A car travels at 72 km/h. Its speed in m/s is…', options: ['20 m/s', '72 m/s', '7.2 m/s', '259 m/s'], answer: 0, why: '72 / 3.6 = 20 m/s.' },
      { q: 'Starting from rest with a = 2 m/s², what is the velocity after 5 s?', options: ['10 m/s', '25 m/s', '2.5 m/s', '5 m/s'], answer: 0, why: 'v = 0 + 2·5 = 10 m/s.' },
      { q: 'In the same case (rest, a = 2 m/s²), how far does it go in 5 s?', options: ['25 m', '10 m', '50 m', '5 m'], answer: 0, why: 'x = ½·2·5² = 25 m.' },
      { q: 'The slope of the velocity–time graph represents…', options: ['the acceleration', 'the position', 'the displacement', 'the average speed'], answer: 0, why: 'a = Δv/Δt.' },
      { q: 'If the initial speed doubles (same deceleration), the braking distance…', options: ['becomes four times longer', 'doubles', 'does not change', 'halves'], answer: 0, why: 'd = v₀²/(2|a|) depends on the square of v₀.' },
      { q: 'The marks left every second get further and further apart. The motion is…', options: ['accelerated', 'uniform', 'slowing down', 'at rest'], answer: 0, why: 'Each second it covers more distance: the velocity increases.' },
      { q: 'Two cars start 110 m apart, heading towards each other at 12 and 10 m/s. They meet after…', options: ['5 s', '11 s', '9.2 s', '2 s'], answer: 0, why: 'They close in at 22 m/s: 110/22 = 5 s.' }
    ],
    help: { intro: 'Follow the lesson or use «Lab» to set x₀, v₀ and a for car A and, if you like, a uniform car B to solve a meeting problem.', items: [['Blue car (A)', 'its label shows position and velocity at every instant.'], ['Yellow marks', 'position of A every second: even spacing = uniform motion.'], ['Graphs', 'x–t and v–t with the current instant marked.'], ['Calculation', 'equations with the current values, braking and meeting.']], try: ['Set a = 0 and change v₀: what happens to the slope of x–t?', 'With v₀ = 20 m/s and a = −4 m/s², where does it stop? Double v₀ and compare.', 'Turn on car B and find the meeting point in the x–t graph.'] }
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
