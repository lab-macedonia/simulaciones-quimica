/* Destilación simple y fraccionada — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var AN = { hex: { n: 'Hexano', A: 6.87024, B: 1168.72, C: 224.21, c: 0x74c0fc }, tol: { n: 'Tolueno', A: 6.95464, B: 1344.8, C: 219.482, c: 0xffd43b }, ben: { n: 'Benceno', A: 6.90565, B: 1211.033, C: 220.79, c: 0xff8787 }, chx: { n: 'Ciclohexano', A: 6.8413, B: 1201.53, C: 222.647, c: 0x69db7c } };
  var PAIRS = { ht: ['hex', 'tol'], bt: ['ben', 'tol'], ct: ['chx', 'tol'] };
  var S = { pair: 'ht', x0: 0.4, N: 1, p: 0, run: false, P: 760 }, lab = [], g = null, liq = null, dist = null, bub = [], rings = [], plates = [];
  function psat(k, t) { var a = AN[k]; return Math.pow(10, a.A - a.B / (t + a.C)); }
  function tb(k) { var a = AN[k]; return a.B / (a.A - Math.log10(S.P)) - a.C; }
  function bubble(x) { var p = PAIRS[S.pair], lo = tb(p[0]) - 5, hi = tb(p[1]) + 5, i, m; for (i = 0; i < 60; i++) { m = (lo + hi) / 2; if (x * psat(p[0], m) + (1 - x) * psat(p[1], m) > S.P) hi = m; else lo = m; } return m; }
  function yOf(x) { var p = PAIRS[S.pair], t = bubble(x); return Math.min(1, x * psat(p[0], t) / S.P); }
  function stairs(x, N) { var pts = [[x, x]], y, i; for (i = 0; i < N; i++) { y = yOf(x); pts.push([x, y]); pts.push([y, y]); x = y; } return { pts: pts, y: x }; }
  function rayleigh(x0, N) { var L = 1, x = x0, n = 120, dV = 0.98 / n, out = [{ f: 0, x: x, t: bubble(x), yd: stairs(x, N).y }], i, yd, f = 0, Ln; for (i = 0; i < n; i++) { yd = stairs(x, N).y; Ln = L - dV; x = Math.max(0.0005, (L * x - yd * dV) / Ln); L = Ln; f += dV; out.push({ f: f, x: x, t: bubble(x), yd: stairs(x, N).y }); } return out; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function cyl(a, b, r, m, parent) { var d = b.clone().sub(a), c = new T.Mesh(new T.CylinderGeometry(r, r, 1, 14, 1, true), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); parent.add(c); return c; }
  function stages() {
    return [
      ['Qué es la destilación', 'Fundamentos', 'Separa líquidos miscibles por diferencia de volatilidad',
        '<p>La <b>destilación</b> separa los componentes de una mezcla líquida aprovechando que el <b>más volátil</b> (menor punto de ebullición) pasa a vapor en mayor proporción. El vapor se condensa y se recoge como <b>destilado</b>. Para una mezcla ideal, la <b>ley de Raoult</b> da la presión parcial: P<sub>i</sub> = x<sub>i</sub>·P<sub>i</sub>°. La mezcla hierve cuando P<sub>A</sub> + P<sub>B</sub> = presión externa; la composición del vapor es y<sub>A</sub> = x<sub>A</sub>·P<sub>A</sub>°/P.</p>'],
      ['Destilación simple', 'Simple', 'Una sola etapa de equilibrio: sirve si los puntos de ebullición difieren > 70 °C o para purificar',
        '<p>En la <b>destilación simple</b> el vapor sube directamente al refrigerante: equivale a <b>un plato teórico</b>. El destilado se enriquece en el componente volátil, pero no se separa del todo. Montaje: matraz con <b>piedras de ebullición</b>, cabezal con termómetro (bulbo a la altura de la salida lateral), refrigerante con agua <b>en contracorriente</b> (entra por abajo) y matraz colector.</p>'],
      ['Destilación fraccionada', 'Fraccionada', 'La columna añade platos teóricos: cada uno repite el equilibrio líquido–vapor',
        '<p>La <b>columna de fraccionamiento</b> (Vigreux, rellena) provoca condensaciones y evaporaciones sucesivas; cada una equivale a un <b>plato teórico</b> y enriquece el vapor en el más volátil. Con más platos, el destilado es más puro, pero el proceso es más lento. Usa el control «Platos teóricos» para verlo.</p>'],
      ['Diagrama T–x–y', 'Diagrama', 'Curva de burbuja (líquido) y de rocío (vapor): la escalera cuenta los platos',
        '<p>El <b>diagrama temperatura–composición</b> tiene dos curvas: la de <b>burbuja</b> (T de ebullición de un líquido de composición x) y la de <b>rocío</b> (composición y del vapor). Se construye una <b>escalera</b>: desde x se sube hasta la curva de vapor, se baja horizontalmente al líquido de esa composición (condensado) y se repite. Cada escalón es un plato teórico.</p>'],
      ['Curva de destilación', 'Seguimiento', 'A medida que destila, el residuo se empobrece y la temperatura sube',
        '<p>Al destilar, el residuo del matraz se <b>empobrece en el componente volátil</b> (ecuación de Rayleigh) y la <b>temperatura de ebullición sube</b>. Por eso se recogen <b>fracciones</b>: la primera es la más rica en el volátil. La curva de destilación muestra T y la composición instantánea del destilado frente a la fracción destilada.</p>']
    ];
  }
  var def = {
    key: 'destilacion', title: 'Destilación simple y fraccionada', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [2, 4, 24], target: [0, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 3, 26], target: [0, 3, 0] }, { id: 'sup', label: 'Superior', pos: [0, 24, 6], target: [0, 3, 0] }],
    layers: [{ id: 'vap', label: 'Vapor', icon: '~' }, { id: 'col', label: 'Platos', icon: '≡' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.25), i;
      var fl = new T.Mesh(new T.SphereGeometry(2.6, 24, 18), glass); fl.position.set(-9, -3, 0); g.add(fl);
      cyl(new T.Vector3(-9, -1, 0), new T.Vector3(-9, 1.5, 0), 0.7, glass, g);
      liq = new T.Mesh(new T.SphereGeometry(2.35, 24, 18), mat(0xffd43b, 0.7)); liq.position.set(-9, -3.2, 0); g.add(liq);
      cyl(new T.Vector3(-9, 1.5, 0), new T.Vector3(-9, 9, 0), 0.9, glass, g);
      for (i = 0; i < 8; i++) { var r = new T.Mesh(new T.TorusGeometry(0.9, 0.08, 6, 20), mat(0xadb5bd, 1)); r.rotation.x = Math.PI / 2; r.position.set(-9, 2.2 + i * 0.85, 0); g.add(r); rings.push(r); var pl = new T.Mesh(new T.CircleGeometry(0.85, 16), mat(0x4dabf7, 0.4)); pl.rotation.x = -Math.PI / 2; pl.position.copy(r.position); g.add(pl); plates.push(pl); }
      cyl(new T.Vector3(-9, 9, 0), new T.Vector3(-3, 11, 0), 0.5, glass, g);
      cyl(new T.Vector3(-3, 11, 0), new T.Vector3(8, 4, 0), 0.7, glass, g); cyl(new T.Vector3(-1.5, 10, 0), new T.Vector3(6.5, 5, 0), 1.3, mat(0x74c0fc, 0.2), g);
      var rf = new T.Mesh(new T.SphereGeometry(2, 20, 14), glass); rf.position.set(8, 0.6, 0); g.add(rf); cyl(new T.Vector3(8, 4, 0), new T.Vector3(8, 2.2, 0), 0.4, glass, g);
      dist = new T.Mesh(new T.SphereGeometry(1.8, 20, 14), mat(0x74c0fc, 0.8)); dist.position.set(8, 0.4, 0); g.add(dist);
      var bm = new T.Mesh(new T.CylinderGeometry(3.2, 3.6, 1.2, 20), mat(0x495057, 1)); bm.position.set(-9, -6.6, 0); g.add(bm);
      for (i = 0; i < 24; i++) { var b = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), mat(0xffffff, 0.8)); b.userData.ph = Math.random(); g.add(b); bub.push(b); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, p = PAIRS[S.pair];
      if (!P.manual) { var i = f.i; S.N = i === 1 ? 1 : (i === 2 ? 1 + Math.round(f.local * 6) : (i >= 3 ? 4 : 1)); if (i === 0) S.p = 0.1; else S.p = Math.min(1, f.local * 1.05); }
      else if (S.run) { S.p += dt / 12; if (S.p >= 1) { S.p = 1; S.run = false; } }
      var R = rayleigh(S.x0, S.N), k = Math.min(R.length - 1, Math.floor(S.p * 0.9 * (R.length - 1))), cur = R[k], mix = function (x) { var a = new T.Color(AN[p[0]].c), b = new T.Color(AN[p[1]].c); return b.lerp(a, x); };
      liq.material.color.copy(mix(cur.x)); liq.scale.setScalar(1 - 0.4 * S.p); liq.position.y = -3.2 - 0.4 * S.p * 1;
      dist.material.color.copy(mix(cur.yd)); dist.scale.setScalar(0.15 + 0.85 * S.p * 0.9);
      var vOn = ctx.layer('vap'), cOn = ctx.layer('col');
      rings.forEach(function (r, j) { r.visible = cOn && j < S.N + 1; plates[j].visible = cOn && j < S.N + 1; });
      bub.forEach(function (b, j) { var u = (now * 0.35 + b.userData.ph) % 1, up = u; b.position.set(-9 + Math.sin(now * 2 + j) * 0.35, -2 + up * 11, Math.cos(now * 2 + j) * 0.35); b.visible = vOn && S.p > 0.02 && up < 0.5 + 0.1 * S.N; });
      lab[0].pos(-9, 12, 0).set('T = ' + fmt(cur.t, 1) + ' °C', 'bl-lead').vis(true);
      lab[1].pos(8, 4.6 + 2.2, 0).set('Destilado: ' + fmt(cur.yd * 100, 0) + ' % ' + AN[p[0]].n, 'bl-pos').vis(true);
      lab[2].pos(-9, -8.5, 0).set('Residuo: x = ' + fmt(cur.x, 2), 'bl-d').vis(true);
      lab[3].pos(-5.5, 5, 0).set(S.N === 1 ? 'Sin columna' : S.N + ' platos teóricos', 'bl-d').vis(true); lab[4].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.pair) u.pair.set(S.pair); if (u.x0) u.x0.set(S.x0); if (u.N) u.N.set(S.N); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var p = PAIRS[S.pair], R = rayleigh(S.x0, S.N), cur = R[Math.min(R.length - 1, Math.floor(S.p * 0.9 * (R.length - 1)))]; return { eq: { chip: String(S.N), name: AN[p[0]].n + ' / ' + AN[p[1]].n, body: '<div class="eqline"><small>T ebullición</small>' + fmt(cur.t, 1) + ' °C</div><div class="eqline"><small>Destilado</small>' + fmt(cur.yd * 100, 0) + ' % ' + AN[p[0]].n + '</div><div class="eqline"><small>Residuo</small>x = ' + fmt(cur.x, 2) + '</div>' }, legend: [{ label: AN[p[0]].n, color: '#' + AN[p[0]].c.toString(16).padStart(6, '0'), text: 'más volátil (p. e. ' + fmt(tb(p[0]), 0) + ' °C)' }, { label: AN[p[1]].n, color: '#' + AN[p[1]].c.toString(16).padStart(6, '0'), text: 'menos volátil (p. e. ' + fmt(tb(p[1]), 0) + ' °C)' }] }; },
    measures: function () { var p = PAIRS[S.pair], st = stairs(S.x0, S.N); return [['Mezcla', AN[p[0]].n + ' / ' + AN[p[1]].n], ['x inicial (volátil)', fmt(S.x0, 2)], ['Platos teóricos', String(S.N)], ['T de burbuja inicial', fmt(bubble(S.x0), 1) + ' °C'], ['Pureza del destilado inicial', fmt(st.y * 100, 1) + ' %']]; },
    ideas: ['Más platos → destilado más puro (pero más lento).', 'La T de ebullición sube a medida que el residuo pierde volátil.', 'Piedras de ebullición y agua en contracorriente.', 'Destilación simple = 1 plato teórico.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Mezcla'); el.appendChild(c);
      ui.pair = kit.ui.options({ label: 'Par', cols: 1, value: S.pair, options: [{ v: 'ht', label: 'Hexano / tolueno' }, { v: 'bt', label: 'Benceno / tolueno' }, { v: 'ct', label: 'Ciclohexano / tolueno' }], onChange: function (v) { ctx.goManual(); S.pair = v; S.p = 0; } }); c.appendChild(ui.pair);
      ui.x0 = kit.ui.slider({ label: 'Fracción molar inicial del volátil', min: 0.1, max: 0.9, step: 0.05, value: S.x0, format: function (v) { return fmt(v, 2); }, onInput: function (v) { ctx.goManual(); S.x0 = v; } });
      ui.N = kit.ui.slider({ label: 'Platos teóricos', min: 1, max: 7, step: 1, value: S.N, format: function (v) { return v === 1 ? '1 (simple)' : String(v); }, onInput: function (v) { ctx.goManual(); S.N = v; } });
      ui.p = kit.ui.slider({ label: 'Fracción destilada', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.p = v; } });
      c.appendChild(kit.ui.sliders([ui.x0, ui.N, ui.p]));
      c.appendChild(ctx.btnRow([{ t: '▶ Destilar', primary: true, fn: function () { ctx.goManual(); S.p = 0; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Diagrama T–x–y con escalera de platos', h: 280, note: 'Azul: curva de burbuja (líquido). Naranja: curva de rocío (vapor). Verde: escalera de platos.', draw: function (cx, w, h, col) {
        var p = PAIRS[S.pair], L = 40, Rr = 10, Tp = 12, B = 34, pw = w - L - Rr, ph = h - Tp - B, t0 = tb(p[0]) - 4, t1 = tb(p[1]) + 4, sx = function (x) { return L + pw * (1 - x); }, sy = function (t) { return Tp + ph - ph * (t - t0) / (t1 - t0); }, i, x, t;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; cx.textAlign = 'center';
        for (i = 0; i <= 4; i++) { cx.fillText(fmt(i / 4, 2), sx(i / 4), h - B + 14); } cx.fillText('x, y (' + AN[p[0]].n + ')', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var tt = t0 + (t1 - t0) * i / 4; cx.fillText(fmt(tt, 0), L - 4, sy(tt) + 3); cx.beginPath(); cx.moveTo(L, sy(tt)); cx.lineTo(L + pw, sy(tt)); cx.stroke(); }
        cx.lineWidth = 2; cx.strokeStyle = '#4dabf7'; cx.beginPath(); for (i = 0; i <= 50; i++) { x = i / 50; t = bubble(x); if (i) cx.lineTo(sx(x), sy(t)); else cx.moveTo(sx(x), sy(t)); } cx.stroke();
        cx.strokeStyle = '#ff922b'; cx.beginPath(); for (i = 0; i <= 50; i++) { x = i / 50; t = bubble(x); var y = yOf(x); if (i) cx.lineTo(sx(y), sy(t)); else cx.moveTo(sx(y), sy(t)); } cx.stroke();
        cx.lineWidth = 1.5; cx.strokeStyle = '#40c057'; var st = stairs(S.x0, S.N); cx.beginPath(); var xx = S.x0; cx.moveTo(sx(xx), sy(bubble(xx))); for (i = 0; i < S.N; i++) { var yy = yOf(xx); cx.lineTo(sx(yy), sy(bubble(xx))); cx.lineTo(sx(yy), sy(bubble(yy))); xx = yy; } cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Curva de destilación', h: 230, note: 'Rojo: T del residuo (°C). Verde: % del volátil en el destilado instantáneo.', draw: function (cx, w, h, col) {
        var R = rayleigh(S.x0, S.N), L = 40, Rr = 40, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, tmin = Math.min.apply(0, R.map(function (r) { return r.t; })), tmax = Math.max.apply(0, R.map(function (r) { return r.t; })) + 1, sx = function (f) { return L + pw * f; }, i;
        cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i * 25, 0) + ' %', sx(i / 4), h - B + 14); cx.fillText('fracción destilada', L + pw / 2, h - 6);
        cx.strokeStyle = '#fa5252'; cx.lineWidth = 2; cx.beginPath(); R.forEach(function (r, j) { var y = Tp + ph - ph * (r.t - tmin) / (tmax - tmin); if (j) cx.lineTo(sx(r.f), y); else cx.moveTo(sx(r.f), y); }); cx.stroke();
        cx.strokeStyle = '#40c057'; cx.beginPath(); R.forEach(function (r, j) { var y = Tp + ph - ph * r.yd; if (j) cx.lineTo(sx(r.f), y); else cx.moveTo(sx(r.f), y); }); cx.stroke(); cx.lineWidth = 1;
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.p * 0.9), Tp); cx.lineTo(sx(S.p * 0.9), Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.textAlign = 'right'; cx.fillStyle = '#fa5252'; cx.fillText(fmt(tmax, 0) + ' °C', L - 4, Tp + 8); cx.fillText(fmt(tmin, 0) + ' °C', L - 4, Tp + ph);
      } }
    ],
    calc: function () {
      var p = PAIRS[S.pair], t = bubble(S.x0), PA = psat(p[0], t), PB = psat(p[1], t), y = S.x0 * PA / S.P, row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">Primer equilibrio (ley de Raoult)</div><table class="calc-table">' + row('T de burbuja', fmt(t, 1) + ' °C (' + fmt(S.P, 0) + ' mmHg)') + row('P° ' + AN[p[0]].n, fmt(PA, 0) + ' mmHg') + row('P° ' + AN[p[1]].n, fmt(PB, 0) + ' mmHg') + row('y = x·P°/P', fmt(S.x0, 2) + ' × ' + fmt(PA, 0) + ' / ' + fmt(S.P, 0) + ' = <b>' + fmt(y, 3) + '</b>') + row('Volatilidad relativa α', fmt(PA / PB, 2)) + row('Tras ' + S.N + ' plato(s)', '<b>' + fmt(stairs(S.x0, S.N).y * 100, 1) + ' %</b> de ' + AN[p[0]].n) + '</table><p class="muted small">Antoine: log₁₀P° = A − B/(T + C). Mezcla ideal: aproximación sin azeótropos.</p>';
    },
    quiz: [
      { q: 'En una destilación simple se recoge primero el componente…', options: ['más volátil', 'menos volátil', 'más denso', 'más polar'], answer: 0, why: 'Tiene mayor presión de vapor.' },
      { q: 'Cada plato teórico equivale a…', options: ['un equilibrio líquido–vapor', 'una filtración', 'un cambio de fase sólida', 'un reflujo total'], answer: 0, why: 'Una evaporación y condensación.' },
      { q: 'El agua del refrigerante debe entrar por…', options: ['abajo', 'arriba', 'indistinto', 'el centro'], answer: 0, why: 'Contracorriente: el refrigerante se llena y enfría mejor.' },
      { q: 'A medida que destila, la T de ebullición del residuo…', options: ['sube', 'baja', 'se mantiene', 'oscila'], answer: 0, why: 'El residuo se enriquece en el menos volátil.' },
      { q: 'Las piedras de ebullición sirven para…', options: ['evitar sobrecalentamiento y proyecciones', 'aumentar la polaridad', 'enfriar', 'filtrar'], answer: 0, why: 'Proveen núcleos de burbujas.' },
      { q: 'Para separar líquidos con puntos de ebullición muy parecidos conviene…', options: ['fraccionada con muchos platos', 'simple', 'filtración', 'decantación'], answer: 0, why: 'Se necesitan muchos equilibrios.' }
    ],
    help: { intro: 'Elige un par, la composición inicial y los platos teóricos; pulsa «Destilar». El diagrama T–x–y muestra la escalera de platos.', items: [['Montaje', 'anillos azules = platos teóricos de la columna; burbujas = vapor que asciende.'], ['Controles', '«Par» (hexano/tolueno, benceno/tolueno o ciclohexano/tolueno), «Fracción molar inicial del volátil», «Platos teóricos» y «Fracción destilada»; «▶ Destilar» lo anima.'], ['Gráficos', '«Diagrama T–x–y con escalera de platos» y «Curva de destilación».']], try: ['Destila con 1 plato (destilación simple) y luego con muchos: compara la pureza del destilado.', 'Observa la curva: la temperatura sube a medida que el residuo pierde el componente volátil.', 'Cuenta los escalones del diagrama T–x–y: cada uno es un plato teórico.'] }
  };
  MSim.create(def);
})();
