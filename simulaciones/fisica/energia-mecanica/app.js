/* Energía mecánica, trabajo y potencia — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, g = 9.8, XW = 8;
  var S = { mode: 'pista', m: 2, h0: 5, mu: 0, x: -XW, v: 0, E0: 0, held: false, cm: 20, ch: 5, ct: 10, cy: 0, run: true, maxx: -XW };
  var G = {}, lab = {}, bars = [], K = 0.6;
  function y(x) { return S.h0 * (x / XW) * (x / XW); }
  function slope(x) { return 2 * S.h0 * x / (XW * XW); }
  function Ep() { return S.m * g * y(S.x); }
  function Ec() { return 0.5 * S.m * S.v * S.v; }
  function reset() { S.x = -XW; S.v = 0; S.E0 = S.m * g * S.h0; S.maxx = -XW; }
  function step(dt) {
    var n = 8, h = dt / n;
    for (var k = 0; k < n; k++) {
      var th = Math.atan(slope(S.x)), a = -g * Math.sin(th);
      if (S.mu > 0 && Math.abs(S.v) > 1e-3) a -= Math.sign(S.v) * S.mu * g * Math.cos(th);
      S.v += a * h; S.x += S.v * Math.cos(th) * h;
      if (S.x > XW) { S.x = XW; S.v = -Math.abs(S.v) * 0.2; } if (S.x < -XW) { S.x = -XW; S.v = Math.abs(S.v) * 0.2; }
      if (S.mu > 0 && Math.abs(S.v) < 0.02 && Math.abs(S.x) < 0.3 && Math.abs(Math.sin(th)) < S.mu) S.v = 0;
    }
  }
  function stages() {
    return [
      ['Trabajo', 'Trabajo', 'W = F·d: una fuerza que desplaza su punto de aplicación transfiere energía',
        '<p>Una fuerza realiza <b>trabajo</b> cuando desplaza el cuerpo en su dirección: <b>W = F·d·cos θ</b>, en <b>joule (J)</b>. La grúa sube una caja de 20 kg a velocidad constante: la fuerza iguala al peso (196 N) y al subir 5 m realiza <b>W = 196 · 5 = 980 J</b>. Ese trabajo queda guardado como energía potencial.</p>'],
      ['Energía potencial gravitatoria', 'Potencial', 'Ep = m·g·h: depende de la masa y de la altura',
        '<p>La <b>energía potencial gravitatoria</b> es la energía asociada a la altura: <b>Ep = m·g·h</b>. Una esfera de 2 kg a 5 m sobre el fondo de la pista tiene 98 J. Al doble de altura, doble energía. La altura se mide desde un nivel de referencia que elegimos (aquí, el fondo de la pista).</p>'],
      ['Energía cinética', 'Cinética', 'Ec = ½·m·v²: depende del cuadrado de la rapidez',
        '<p>Al soltar la esfera, la energía potencial se transforma en <b>energía cinética</b>: <b>Ec = ½·m·v²</b>. En el fondo, toda la Ep inicial es Ec: m·g·h = ½·m·v² → <b>v = √(2·g·h)</b>, que <b>no depende de la masa</b>. Desde 5 m llega a 9,9 m/s.</p>'],
      ['Conservación de la energía mecánica', 'Conservación', 'Sin roce, Em = Ep + Ec permanece constante',
        '<p>Sin roce, la <b>energía mecánica</b> Em = Ep + Ec se <b>conserva</b>: las barras de Ep y Ec suben y bajan, pero su suma no cambia. Por eso la esfera vuelve a la <b>misma altura</b> en el otro lado y oscila indefinidamente. Es un principio muy útil: permite calcular rapideces sin conocer los detalles de la trayectoria.</p>'],
      ['Roce y disipación', 'Roce', 'Con roce, parte de la energía mecánica se convierte en calor',
        '<p>Con <b>roce</b>, la energía mecánica disminuye: una parte se <b>disipa</b> como energía térmica (barra roja). La esfera ya no alcanza la altura inicial y termina en reposo en el fondo. La energía total (mecánica + térmica) sigue conservándose: <b>Em inicial = Em final + Q</b>.</p>'],
      ['Potencia', 'Potencia', 'P = W/t: rapidez con que se realiza el trabajo, en watt',
        '<p>La <b>potencia</b> mide qué tan rápido se transfiere la energía: <b>P = W/t</b>, en <b>watt (W = J/s)</b>. Subir la misma caja 5 m (980 J) en 10 s requiere 98 W; hacerlo en 5 s, 196 W. El trabajo es el mismo, pero un motor más potente lo hace en menos tiempo.</p>']
    ];
  }
  function lessonSet(i, l, ctx) {
    if (i === 0 || i === 5) { S.mode = 'grua'; S.cm = 20; S.ch = 5; S.ct = i === 0 ? 10 : (l < 0.5 ? 10 : 5); var tt = i === 0 ? l * 12 : ((l < 0.5 ? l : l - 0.5) * 2) * 12; S.cy = S.ch * clamp(tt / S.ct, 0, 1); return; }
    S.mode = 'pista'; S.m = 2; S.mu = i === 4 ? 0.08 : 0;
    if (i === 1) { S.h0 = 2 + 4 * l; S.held = true; reset(); }
    else { S.h0 = 5; S.held = false; if (l < 0.01 || ctx._st !== i) { reset(); ctx._st = i; } }
  }
  function box(w, h, d, c) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: c, roughness: 0.6 })); }
  function buildTrack() {
    if (G.track) G.pista.remove(G.track);
    var shape = [], i; for (i = 0; i <= 80; i++) { var x = -XW + 2 * XW * i / 80; shape.push(new T.Vector3(x * K, y(x) * K, 0)); }
    var curve = new T.CatmullRomCurve3(shape); G.track = new T.Mesh(new T.TubeGeometry(curve, 160, 0.12, 8, false), new T.MeshStandardMaterial({ color: 0x74c0fc, roughness: 0.3, metalness: 0.3 })); G.pista.add(G.track); G.trackH = S.h0;
  }
  var def = {
    key: 'energia-mecanica', title: 'Energía mecánica, trabajo y potencia', subtitle: 'Simulador 3D · física', accent: { dark: '#69db7c', light: '#2b8a3e' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.6, 5, 12.5], target: [-1.6, 2, -1] }, { id: 'frontal', label: 'Frontal', pos: [-1.6, 2.6, 13.5], target: [-1.6, 2.2, -1] }],
    layers: [{ id: 'bars', label: 'Barras de energía', icon: '▮' }],
    build: function (ctx) {
      var s = ctx.scene; G.pista = new T.Group(); s.add(G.pista); G.grua = new T.Group(); s.add(G.grua);
      var floor = box(11.5, 0.1, 7, 0x343a40); floor.position.z = -1.6; floor.position.y = -0.1; G.pista.add(floor);
      buildTrack();
      G.ball = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), new T.MeshStandardMaterial({ color: 0xff922b, roughness: 0.35 })); G.pista.add(G.ball);
      var cols = [0x339af0, 0x51cf66, 0xff6b6b];
      for (var i = 0; i < 3; i++) { var b = box(0.7, 1, 0.7, cols[i]); b.position.set(-0.95 + i * 0.95, 0, -2.6); G.pista.add(b); bars.push(b); }
      // grúa
      var base = box(1.6, 0.3, 1.6, 0x495057); G.grua.add(base);
      var tower = box(0.35, 7.4, 0.35, 0xfab005); tower.position.set(-2.4, 3.7, 0); G.grua.add(tower);
      var arm = box(3.6, 0.3, 0.3, 0xfab005); arm.position.set(-0.8, 7.3, 0); G.grua.add(arm);
      G.cable = box(0.05, 1, 0.05, 0xdee2e6); G.grua.add(G.cable);
      G.crate = box(1.2, 1.2, 1.2, 0xb08155); G.grua.add(G.crate);
      var ruler = box(0.1, 5, 0.1, 0xffd43b); ruler.position.set(1.6, 2.5 + 0.6, 0); G.grua.add(ruler);
      ['a', 'b', 'c', 'd', 'e', 'f'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx);
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      G.pista.visible = S.mode === 'pista'; G.grua.visible = S.mode === 'grua';
      if (S.mode === 'grua') {
        if (ctx.P.manual && S.run) { S.cy += S.ch / S.ct * dt; if (S.cy > S.ch + 1) S.cy = 0; }
        var yy = clamp(S.cy, 0, S.ch); G.crate.position.set(0.6, 0.75 + yy, 0); G.cable.position.set(0.6, (7.15 + 1.35 + yy) / 2, 0); G.cable.scale.y = Math.max(0.05, 7.15 - 1.35 - yy);
        var W = S.cm * g * yy;
        lab.a.pos(3.2, 1.6 + yy, 0).set('h = ' + f2(yy) + ' m · W = m·g·h = ' + fmt(W, 0) + ' J', 'bl-lead').vis(true);
        lab.b.pos(3.2, 0.6 + yy, 0).set('P = W/t = ' + fmt(S.cm * g * S.ch / S.ct, 0) + ' W (' + fmt(S.ct, 0) + ' s para ' + fmt(S.ch, 1) + ' m)', 'bl-pos').vis(true);
        return;
      }
      if (G.trackH !== S.h0) buildTrack();
      if (S.held) { S.x = -XW; S.v = 0; } else if (f.playing || ctx.P.manual) step(dt);
      if (S.x > S.maxx) S.maxx = S.x;
      var th = Math.atan(slope(S.x)), nx = -Math.sin(th), ny = Math.cos(th);
      G.ball.position.set(S.x * K + nx * 0.54, y(S.x) * K + ny * 0.54, 0);
      var E0 = S.m * g * S.h0, ep = Ep(), ec = Ec(), q = Math.max(0, E0 - ep - ec), on = ctx.layer('bars'), sc = 4.5 / Math.max(1, E0);
      [ep, ec, q].forEach(function (e, i) { bars[i].visible = on; bars[i].scale.y = Math.max(0.01, e * sc); bars[i].position.y = e * sc / 2; });
      lab.a.pos(G.ball.position.x, G.ball.position.y + 1.1, 0).set('h = ' + f2(y(S.x)) + ' m · v = ' + f2(Math.abs(S.v)) + ' m/s', 'bl-lead').vis(true);
      lab.b.pos(-0.95, -0.6, -2.6).set('Ep ' + fmt(ep, 0) + ' J', 'bl-d').vis(on); lab.c.pos(0, -0.6, -2.6).set('Ec ' + fmt(ec, 0) + ' J', 'bl-neg').vis(on); lab.d.pos(0.95, -0.6, -2.6).set('Q ' + fmt(q, 0) + ' J', 'bl-warn').vis(on);
      lab.e.pos(0, 5.6, -2.6).set('Em = ' + fmt(ep + ec, 0) + ' J de ' + fmt(E0, 0) + ' J', 'bl-pos').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.m && u.m.set(S.m); u.h && u.h.set(S.h0); u.mu && u.mu.set(S.mu); u.mode && u.mode.set(S.mode); } },
    hud: function () { return { eq: { chip: 'E', name: S.mode === 'grua' ? 'Trabajo y potencia' : 'Pista sin motor', body: '<div class="eqline"><small>Trabajo</small>W = F·d·cos θ</div><div class="eqline"><small>Potencial</small>Ep = m·g·h</div><div class="eqline"><small>Cinética</small>Ec = ½·m·v²</div><div class="eqline"><small>Potencia</small>P = W/t</div>' }, legend: [{ label: 'Azul', color: '#339af0', text: 'energía potencial' }, { label: 'Verde', color: '#51cf66', text: 'energía cinética' }, { label: 'Rojo', color: '#ff6b6b', text: 'calor disipado por roce' }] }; },
    measures: function () {
      if (S.mode === 'grua') { var W = S.cm * g * S.ch; return [['Masa', f1(S.cm) + ' kg'], ['Altura', f1(S.ch) + ' m'], ['Trabajo', fmt(W, 0) + ' J'], ['Tiempo', f1(S.ct) + ' s'], ['Potencia', fmt(W / S.ct, 1) + ' W']]; }
      var E0 = S.m * g * S.h0; return [['Masa', f1(S.m) + ' kg'], ['Altura actual', f2(y(S.x)) + ' m'], ['Rapidez', f2(Math.abs(S.v)) + ' m/s'], ['Ep', f1(Ep()) + ' J'], ['Ec', f1(Ec()) + ' J'], ['Em = Ep + Ec', f1(Ep() + Ec()) + ' J'], ['Calor disipado', f1(Math.max(0, E0 - Ep() - Ec())) + ' J'], ['Rapidez máx. teórica', f2(Math.sqrt(2 * g * S.h0)) + ' m/s']];
    },
    ideas: ['<b>W = F·d·cos θ</b> (J).', '<b>Ep = m·g·h</b>; <b>Ec = ½·m·v²</b>.', 'Sin roce: Ep + Ec = constante.', 'Rapidez abajo: <b>v = √(2gh)</b>, sin importar la masa.', 'Con roce: Em inicial = Em final + calor.', '<b>P = W/t</b> (W = J/s).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experimento'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Montaje', cols: 2, value: S.mode, options: [{ v: 'pista', label: 'Pista (Ep ⇄ Ec)' }, { v: 'grua', label: 'Grúa (trabajo y potencia)' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.cy = 0; reset(); } }); c.appendChild(ui.mode);
      ui.m = kit.ui.slider({ label: 'Masa de la esfera (kg)', min: 0.5, max: 10, step: 0.5, value: S.m, onInput: function (v) { ctx.goManual(); S.m = v; reset(); } });
      ui.h = kit.ui.slider({ label: 'Altura inicial (m)', min: 1, max: 7, step: 0.5, value: S.h0, onInput: function (v) { ctx.goManual(); S.h0 = v; reset(); } });
      ui.mu = kit.ui.slider({ label: 'Coeficiente de roce', min: 0, max: 0.3, step: 0.01, value: S.mu, digits: 2, onInput: function (v) { ctx.goManual(); S.mu = v; reset(); } });
      c.appendChild(kit.ui.sliders([ui.m, ui.h, ui.mu]));
      var c2 = kit.ui.card('Grúa'); el.appendChild(c2);
      ui.cm = kit.ui.slider({ label: 'Masa de la caja (kg)', min: 5, max: 100, step: 5, value: S.cm, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.cm = v; S.cy = 0; } });
      ui.ch = kit.ui.slider({ label: 'Altura a subir (m)', min: 1, max: 5, step: 0.5, value: S.ch, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.ch = v; S.cy = 0; } });
      ui.ct = kit.ui.slider({ label: 'Tiempo de subida (s)', min: 2, max: 20, step: 1, value: S.ct, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.ct = v; S.cy = 0; } });
      c2.appendChild(kit.ui.sliders([ui.cm, ui.ch, ui.ct]));
      el.appendChild(ctx.btnRow([{ t: 'Soltar desde arriba', primary: true, fn: function () { ctx.goManual(); S.held = false; S.mode = 'pista'; reset(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Energía frente a posición', h: 220, note: 'Curva azul: Ep en cada punto de la pista. Línea verde: energía mecánica actual. Donde se cruzan, la esfera se detiene y regresa.', draw: function (cx, w, h, col) {
        var L = 46, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, E0 = Math.max(1, S.m * g * S.h0), sx = function (x) { return L + pw * (x + XW) / (2 * XW); }, sy = function (e) { return Tp + ph - ph * e / (E0 * 1.1); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var e = E0 * 1.1 * i / 4; cx.beginPath(); cx.moveTo(L, sy(e)); cx.lineTo(L + pw, sy(e)); cx.stroke(); cx.fillText(fmt(e, 0), L - 5, sy(e) + 3); }
        cx.textAlign = 'center'; for (i = -8; i <= 8; i += 4) cx.fillText(i, sx(i), h - B + 13); cx.fillText('x (m)  ·  energía (J)', L + pw / 2, h - 3);
        cx.strokeStyle = '#339af0'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = -XW + 2 * XW * i / 80; if (i) cx.lineTo(sx(x), sy(S.m * g * y(x))); else cx.moveTo(sx(x), sy(S.m * g * y(x))); } cx.stroke();
        var em = Ep() + Ec(); cx.strokeStyle = '#51cf66'; cx.beginPath(); cx.moveTo(L, sy(em)); cx.lineTo(L + pw, sy(em)); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.x), sy(Ep()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Reparto de la energía', h: 190, note: 'Ep + Ec + calor = energía inicial (m·g·h₀). Sin roce el calor es cero.', draw: function (cx, w, h, col) {
        var E0 = Math.max(1, S.m * g * S.h0), v = [Ep(), Ec(), Math.max(0, E0 - Ep() - Ec())], nm = ['Ep', 'Ec', 'Calor'], cl = ['#339af0', '#51cf66', '#ff6b6b'], bw = (w - 60) / 3;
        cx.font = '11px system-ui'; cx.textAlign = 'center';
        v.forEach(function (e, i) { var bh = (h - 50) * e / E0, x = 30 + i * bw + bw * 0.15; cx.fillStyle = cl[i]; cx.fillRect(x, h - 26 - bh, bw * 0.7, bh); cx.fillStyle = col.ink; cx.fillText(nm[i] + ' · ' + fmt(e, 0) + ' J', x + bw * 0.35, h - 10); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'grua') { var W = S.cm * g * S.ch; return '<div class="card-kicker">Grúa</div><table class="calc-table">' + row('Fuerza (= peso)', 'F = m·g = ' + f1(S.cm) + ' · 9,8 = <b>' + f1(S.cm * g) + ' N</b>') + row('Trabajo', 'W = F·h = ' + f1(S.cm * g) + ' · ' + f1(S.ch) + ' = <b>' + fmt(W, 0) + ' J</b>') + row('Potencia', 'P = W/t = ' + fmt(W, 0) + ' / ' + f1(S.ct) + ' = <b>' + fmt(W / S.ct, 1) + ' W</b>') + '</table>'; }
      var E0 = S.m * g * S.h0;
      return '<div class="card-kicker">Pista · m = ' + f1(S.m) + ' kg</div><div class="calc-step">1 · Energía inicial</div><table class="calc-table">' + row('Ep₀ = m·g·h₀', f1(S.m) + ' · 9,8 · ' + f1(S.h0) + ' = <b>' + f1(E0) + ' J</b>') + '</table>' +
        '<div class="calc-step">2 · Rapidez en el fondo (sin roce)</div><table class="calc-table">' + row('m·g·h₀ = ½·m·v²', 'v = √(2·g·h₀) = √(2 · 9,8 · ' + f1(S.h0) + ') = <b>' + f2(Math.sqrt(2 * g * S.h0)) + ' m/s</b>') + '</table>' +
        '<div class="calc-step">3 · Ahora</div><table class="calc-table">' + row('Ep + Ec', f1(Ep()) + ' + ' + f1(Ec()) + ' = <b>' + f1(Ep() + Ec()) + ' J</b>') + row('Disipado (roce)', '<b>' + f1(Math.max(0, E0 - Ep() - Ec())) + ' J</b>') + '</table>';
    },
    quiz: [
      { q: 'Subes una mochila de 5 kg a 2 m de altura. El trabajo contra la gravedad es…', options: ['98 J', '10 J', '49 J', '196 J'], answer: 0, why: 'W = m·g·h = 5·9,8·2 = 98 J.' },
      { q: 'Si la rapidez de un auto se duplica, su energía cinética…', options: ['se cuadruplica', 'se duplica', 'no cambia', 'se reduce a la mitad'], answer: 0, why: 'Ec = ½mv² depende de v².' },
      { q: 'Sin roce, una esfera soltada desde 5 m llega al fondo con una rapidez que…', options: ['no depende de su masa', 'es mayor si es más pesada', 'es menor si es más pesada', 'es cero'], answer: 0, why: 'v = √(2gh): la masa se cancela.' },
      { q: 'En el punto más bajo de la pista (sin roce)…', options: ['Ec es máxima y Ep mínima', 'Ep es máxima', 'ambas son cero', 'Ec es mínima'], answer: 0, why: 'Toda la Ep se convirtió en Ec.' },
      { q: 'Con roce, la esfera no vuelve a la altura inicial porque…', options: ['parte de la energía se transforma en calor', 'la energía se destruye', 'la masa disminuye', 'la gravedad cambia'], answer: 0, why: 'La energía total se conserva, pero parte deja de ser mecánica.' },
      { q: 'Un motor sube 600 J en 3 s. Su potencia es…', options: ['200 W', '1800 W', '600 W', '0,005 W'], answer: 0, why: 'P = W/t = 600/3.' },
      { q: 'Dos grúas suben la misma carga a la misma altura, una en la mitad de tiempo. Esa grúa…', options: ['tiene el doble de potencia y hace el mismo trabajo', 'hace el doble de trabajo', 'hace la mitad de trabajo', 'tiene la misma potencia'], answer: 0, why: 'El trabajo depende de F y d; la potencia, del tiempo.' },
      { q: 'La unidad de energía en el SI es…', options: ['joule', 'watt', 'newton', 'pascal'], answer: 0, why: '1 J = 1 N·m; el watt es J/s.' }
    ],
    help: { intro: 'En «Lab» elige la pista (energía potencial ⇄ cinética, con o sin roce) o la grúa (trabajo y potencia).', items: [['Barras', 'azul: Ep; verde: Ec; roja: calor disipado.'], ['Roce', 'con roce 0 la energía mecánica se conserva.'], ['Grúa', 'cambia masa, altura y tiempo para comparar trabajo y potencia.']], try: ['Duplica la masa: ¿cambia la rapidez en el fondo?', 'Pon roce 0,1: ¿hasta qué altura llega en la segunda subida?', 'Sube 50 kg a 4 m en 5 s y en 10 s: compara la potencia.'] }
  };
  MSim.create(def);
})();
