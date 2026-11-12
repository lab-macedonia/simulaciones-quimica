/* Cantidad de movimiento, impulso y choques — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var S = { mode: 'choque', m1: 2, m2: 2, v1: 3, v2: 0, e: 1, x1: -6, x2: 0, u1: 3, u2: 0, done: false, t: 0, dtc: 0.05, imp: { x: -6, v: 4, F: 0, c: 0, hist: [] }, hist: [], stuck: false };
  var G = {}, lab = {}, W = 1.2;
  function resetChoque() { S.x1 = -6; S.x2 = 0; S.u1 = S.v1; S.u2 = S.v2; S.done = false; S.stuck = false; S.t = 0; S.hist = []; }
  function resetImp() { S.imp = { x: -6, v: 4, F: 0, c: 0, hist: [] }; S.t = 0; }
  function resetExp() { S.x1 = -W / 2 - 0.05; S.x2 = W / 2 + 0.05; S.u1 = 0; S.u2 = 0; S.done = false; S.t = 0; S.hist = []; }
  function p1() { return S.m1 * S.u1; } function p2() { return S.m2 * S.u2; }
  function ec() { return 0.5 * S.m1 * S.u1 * S.u1 + 0.5 * S.m2 * S.u2 * S.u2; }
  function after() { var M = S.m1 + S.m2, e = S.e; return [((S.m1 - e * S.m2) * S.v1 + (1 + e) * S.m2 * S.v2) / M, ((S.m2 - e * S.m1) * S.v2 + (1 + e) * S.m1 * S.v1) / M]; }
  function step(dt) {
    S.t += dt;
    if (S.mode === 'choque') {
      if (S.stuck) { S.x1 += S.u1 * dt; S.x2 = S.x1 + W; S.u2 = S.u1; }
      else { S.x1 += S.u1 * dt; S.x2 += S.u2 * dt; if (!S.done && S.x2 - S.x1 <= W) { var a = after(); S.u1 = a[0]; S.u2 = a[1]; S.done = true; S.x1 = S.x2 - W; if (S.e === 0) S.stuck = true; } }
      if (S.t > 8 || Math.abs(S.x1) > 11 || Math.abs(S.x2) > 11) resetChoque();
      S.hist.push([S.t, p1(), p2()]); if (S.hist.length > 400) S.hist.shift();
    } else if (S.mode === 'explosion') {
      if (S.t > 0.6 && !S.done) { var J = 6; S.u1 = -J / S.m1; S.u2 = J / S.m2; S.done = true; }
      S.x1 += S.u1 * dt; S.x2 += S.u2 * dt; if (S.t > 5 || Math.abs(S.x1) > 11 || Math.abs(S.x2) > 11) resetExp();
      S.hist.push([S.t, p1(), p2()]); if (S.hist.length > 400) S.hist.shift();
    } else {
      var I = S.imp, m = S.m1, soft = S.dtc > 0.2, padW = soft ? 0.6 : 0.09, wall = 6 - padW - W / 2, comp = soft ? 0.45 : 0.02;
      if (I.x < wall || I.v > 0 && I.c === 0) { I.x += I.v * dt; I.F = 0; if (I.x >= wall) { I.x = wall; I.c = 1e-6; I.v0 = I.v; } }
      if (I.c > 0) { I.F = m * I.v0 / S.dtc; I.v -= I.F / m * dt; I.c += dt; if (I.v <= 0) { I.v = 0; I.F = 0; I.c = -1; } I.x = wall + comp * (1 - Math.max(0, I.v) / I.v0); }
      I.hist.push([S.t, I.F]); if (I.hist.length > 500) I.hist.shift();
      if (S.t > 5) resetImp();
    }
  }
  function stages() {
    return [
      ['Cantidad de movimiento', 'p = m·v', 'p = m·v: depende de la masa y de la velocidad',
        '<p>La <b>cantidad de movimiento</b> (o momentum) es <b>p = m·v</b>, en kg·m/s. Es un <b>vector</b> con el sentido de la velocidad. Un carro de 2 kg a 3 m/s tiene 6 kg·m/s. Un camión lento puede tener más momentum que un auto rápido: por eso cuesta más detenerlo.</p>'],
      ['Impulso', 'Impulso', 'J = F·Δt = Δp: el mismo cambio de momentum con menos fuerza si dura más',
        '<p>Para cambiar el momentum hay que aplicar un <b>impulso</b>: <b>J = F·Δt = Δp</b>. El carro de 2 kg a 4 m/s se detiene (Δp = 8 kg·m/s) contra una pared rígida en 0,05 s (F = 160 N) o contra un cojín en 0,5 s (F = 16 N). El área bajo el gráfico F–t es la misma: así funcionan el <b>airbag</b>, el casco y las zonas de deformación de los autos.</p>'],
      ['Choque elástico', 'Elástico', 'Se conservan el momentum y la energía cinética',
        '<p>En un <b>choque elástico</b> se conservan la <b>cantidad de movimiento total</b> y la <b>energía cinética</b>. Con masas iguales y uno en reposo, los carros <b>intercambian velocidades</b>: el que venía se detiene y el otro sale con su rapidez (como en el péndulo de Newton o en el billar).</p>'],
      ['Choque perfectamente inelástico', 'Inelástico', 'Los cuerpos quedan unidos; el momentum se conserva, la energía cinética no',
        '<p>Si los carros quedan <b>unidos</b>, el choque es <b>perfectamente inelástico</b>. El momentum total se conserva: m₁v₁ = (m₁ + m₂)·v → con masas iguales salen juntos a la <b>mitad de la velocidad</b>. La energía cinética <b>no</b> se conserva: la mitad se transforma en deformación, calor y sonido.</p>'],
      ['Masas distintas', 'Masas', 'Un cuerpo liviano rebota contra uno pesado',
        '<p>Si un carro <b>liviano</b> (1 kg) choca elásticamente con uno <b>pesado</b> (4 kg) en reposo, el liviano <b>rebota</b> y el pesado avanza lentamente. Aunque las velocidades cambian mucho, la suma <b>m₁v₁ + m₂v₂</b> es la misma antes y después: compruébalo en el gráfico de momentum.</p>'],
      ['Retroceso y explosiones', 'Retroceso', 'Si el sistema parte en reposo, el momentum total sigue siendo cero',
        '<p>Dos carros en reposo se separan por un resorte (como un cañón y su bala, o un patinador que lanza una pelota). El momentum total era <b>cero</b> y sigue siéndolo: <b>m₁v₁ = −m₂v₂</b>. El carro más liviano sale más rápido. Así se impulsan los cohetes: expulsan gas hacia atrás y avanzan hacia adelante.</p>']
    ];
  }
  function lessonSet(i, l, ctx) {
    var key = i + (i === 1 ? (l < 0.5 ? 'a' : 'b') : '');
    if (ctx._k !== key) {
      ctx._k = key;
      if (i === 0) { S.mode = 'choque'; S.m1 = 2; S.m2 = 6; S.v1 = 3; S.v2 = 0; S.e = 1; resetChoque(); }
      else if (i === 1) { S.mode = 'impulso'; S.m1 = 2; S.dtc = l < 0.5 ? 0.05 : 0.5; resetImp(); }
      else if (i === 2) { S.mode = 'choque'; S.m1 = 2; S.m2 = 2; S.v1 = 3; S.v2 = 0; S.e = 1; resetChoque(); }
      else if (i === 3) { S.mode = 'choque'; S.m1 = 2; S.m2 = 2; S.v1 = 3; S.v2 = 0; S.e = 0; resetChoque(); }
      else if (i === 4) { S.mode = 'choque'; S.m1 = 1; S.m2 = 4; S.v1 = 3; S.v2 = 0; S.e = 1; resetChoque(); }
      else { S.mode = 'explosion'; S.m1 = 1; S.m2 = 3; resetExp(); }
    }
  }
  function box(w, h, d, c) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: c, roughness: 0.5 })); }
  var def = {
    key: 'momentum-choques', title: 'Cantidad de movimiento y choques', subtitle: 'Simulador 3D · física', accent: { dark: '#b197fc', light: '#6741d9' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.2, 7, 14], target: [-1.2, 2.2, 0] }, { id: 'frontal', label: 'Frontal', pos: [-1.2, 3, 15], target: [-1.2, 2.2, 0] }],
    layers: [{ id: 'vec', label: 'Vectores de momentum', icon: '➜' }],
    build: function (ctx) {
      var s = ctx.scene; var track = box(22, 0.3, 1.6, 0x868e96); track.position.y = -0.15; s.add(track);
      G.c1 = box(W, 0.8, 1.2, 0x1c7ed6); G.c2 = box(W, 0.8, 1.2, 0xe8590c); s.add(G.c1); s.add(G.c2);
      G.wall = box(0.4, 2.6, 2.2, 0x495057); G.wall.position.set(6.2, 1.3, 0); s.add(G.wall);
      G.pad = box(0.6, 1.4, 1.6, 0xffd43b); s.add(G.pad);
      G.a1 = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0x339af0, 0.35, 0.25); s.add(G.a1);
      G.a2 = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xff922b, 0.35, 0.25); s.add(G.a2);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx);
      if (f.playing || ctx.P.manual) step(dt);
      var on = ctx.layer('vec'); Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      var imp = S.mode === 'impulso'; G.wall.visible = imp; G.pad.visible = imp; G.c2.visible = !imp;
      if (imp) {
        var I = S.imp; G.c1.position.set(I.x, 0.4, 0); G.c1.scale.set(1, 1, 1); var soft = S.dtc > 0.2, pw0 = soft ? 0.6 - 0.45 * clamp((I.x - (6 - 0.6 - W / 2)) / 0.45, 0, 1) : 0.09; G.pad.scale.x = pw0 / 0.6; G.pad.position.set(6 - pw0 / 2, 0.7, 0); G.pad.material.color.setHex(S.dtc > 0.2 ? 0xffd43b : 0x868e96);
        G.a1.visible = on && I.v > 0.01; if (G.a1.visible) { G.a1.position.set(I.x, 1.3, 0); G.a1.setDirection(new T.Vector3(1, 0, 0)); G.a1.setLength(0.3 + S.m1 * I.v * 0.15, 0.3, 0.22); } G.a2.visible = false;
        lab.a.pos(I.x, 2.3, 0).set('p = ' + f1(S.m1) + ' kg · ' + f2(I.v) + ' m/s = ' + f2(S.m1 * I.v) + ' kg·m/s', 'bl-lead').vis(true);
        lab.b.pos(5, 3.2, 0).set((S.dtc > 0.2 ? 'Cojín · Δt = ' : 'Pared rígida · Δt = ') + f2(S.dtc) + ' s · F = ' + fmt(S.m1 * 4 / S.dtc, 0) + ' N', 'bl-warn').vis(true);
        return;
      }
      G.c1.position.set(S.x1, 0.4, 0); G.c2.position.set(S.x2, 0.4, 0); var s1 = Math.cbrt(S.m1 / 2), s2 = Math.cbrt(S.m2 / 2); G.c1.scale.set(1, s1, s1); G.c2.scale.set(1, s2, s2); G.c1.position.y = 0.4 * s1; G.c2.position.y = 0.4 * s2;
      [[G.a1, S.x1, S.u1, S.m1, 0.8 * s1], [G.a2, S.x2, S.u2, S.m2, 0.8 * s2]].forEach(function (q) { var a = q[0], p = q[2] * q[3]; a.visible = on && Math.abs(p) > 0.02; if (a.visible) { a.position.set(q[1], q[4] + 0.5, 0); a.setDirection(new T.Vector3(Math.sign(p), 0, 0)); a.setLength(0.3 + Math.abs(p) * 0.18, 0.3, 0.22); } });
      lab.a.pos(S.x1, 2.2 + 0.4 * s1, 0).set(f1(S.m1) + ' kg · ' + f2(S.u1) + ' m/s', 'bl-lead').vis(true);
      lab.b.pos(S.x2, 2.2 + 0.4 * s2, 0).set(f1(S.m2) + ' kg · ' + f2(S.u2) + ' m/s', 'bl-pos').vis(true);
      lab.c.pos(-1, 4.6, 0).set('p total = ' + f2(p1() + p2()) + ' kg·m/s · Ec total = ' + f2(ec()) + ' J', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.m1 && u.m1.set(S.m1); u.m2 && u.m2.set(S.m2); u.v1 && u.v1.set(S.v1); u.v2 && u.v2.set(S.v2); u.e && u.e.set(S.e); } },
    hud: function () { return { eq: { chip: 'p', name: { choque: S.e === 1 ? 'Choque elástico' : S.e === 0 ? 'Choque perfectamente inelástico' : 'Choque parcialmente elástico', impulso: 'Impulso', explosion: 'Retroceso' }[S.mode], body: '<div class="eqline"><small>Momentum</small>p = m·v</div><div class="eqline"><small>Impulso</small>J = F·Δt = Δp</div><div class="eqline"><small>Conservación</small>m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</div>' }, legend: [{ label: 'Carro A', color: '#1c7ed6', text: 'azul' }, { label: 'Carro B', color: '#e8590c', text: 'naranja' }, { label: 'Flechas', color: '#339af0', text: 'momentum de cada carro' }] }; },
    measures: function () {
      if (S.mode === 'impulso') return [['Masa', f1(S.m1) + ' kg'], ['Δp', f2(S.m1 * 4) + ' kg·m/s'], ['Tiempo de frenado Δt', f2(S.dtc) + ' s'], ['Fuerza media', fmt(S.m1 * 4 / S.dtc, 0) + ' N']];
      return [['Masas', f1(S.m1) + ' / ' + f1(S.m2) + ' kg'], ['Velocidades', f2(S.u1) + ' / ' + f2(S.u2) + ' m/s'], ['p₁ + p₂', f2(p1()) + ' + ' + f2(p2()) + ' = ' + f2(p1() + p2()) + ' kg·m/s'], ['Ec total', f2(ec()) + ' J'], ['Coef. de restitución', f2(S.e)]];
    },
    ideas: ['<b>p = m·v</b> (kg·m/s), vector.', '<b>J = F·Δt = Δp</b>: más tiempo, menos fuerza.', 'En todo choque se conserva el momentum total.', 'Elástico: también se conserva la Ec.', 'Perfectamente inelástico: quedan unidos y se pierde Ec.', 'Retroceso: m₁v₁ = −m₂v₂.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experimento'); el.appendChild(c);
      function re() { if (S.mode === 'choque') resetChoque(); else if (S.mode === 'explosion') resetExp(); else resetImp(); }
      ui.mode = kit.ui.options({ label: 'Montaje', cols: 3, value: S.mode, options: [{ v: 'choque', label: 'Choque' }, { v: 'impulso', label: 'Impulso' }, { v: 'explosion', label: 'Retroceso' }], onChange: function (v) { ctx.goManual(); S.mode = v; re(); } }); c.appendChild(ui.mode);
      ui.m1 = kit.ui.slider({ label: 'Masa del carro A (kg)', min: 0.5, max: 8, step: 0.5, value: S.m1, onInput: function (v) { ctx.goManual(); S.m1 = v; re(); } });
      ui.m2 = kit.ui.slider({ label: 'Masa del carro B (kg)', min: 0.5, max: 8, step: 0.5, value: S.m2, onInput: function (v) { ctx.goManual(); S.m2 = v; re(); } });
      ui.v1 = kit.ui.slider({ label: 'Velocidad inicial de A (m/s)', min: 0, max: 5, step: 0.25, value: S.v1, digits: 2, onInput: function (v) { ctx.goManual(); S.v1 = v; re(); } });
      ui.v2 = kit.ui.slider({ label: 'Velocidad inicial de B (m/s)', min: -4, max: 2, step: 0.25, value: S.v2, digits: 2, onInput: function (v) { ctx.goManual(); S.v2 = v; re(); } });
      ui.e = kit.ui.slider({ label: 'Coeficiente de restitución e', min: 0, max: 1, step: 0.05, value: S.e, digits: 2, onInput: function (v) { ctx.goManual(); S.e = v; re(); } });
      ui.dt = kit.ui.slider({ label: 'Duración del impacto Δt (s)', min: 0.02, max: 0.8, step: 0.02, value: S.dtc, digits: 2, onInput: function (v) { ctx.goManual(); S.dtc = v; S.mode = 'impulso'; resetImp(); } });
      c.appendChild(kit.ui.sliders([ui.m1, ui.m2, ui.v1, ui.v2, ui.e, ui.dt]));
      el.appendChild(ctx.btnRow([{ t: 'Repetir', primary: true, fn: function () { ctx.goManual(); re(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Momentum de cada carro y total', h: 220, note: 'Azul: carro A; naranja: carro B; verde: total. En el choque las curvas azul y naranja cambian, pero la verde no.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, H = S.hist, lim = 1; H.forEach(function (q) { lim = Math.max(lim, Math.abs(q[1]), Math.abs(q[2]), Math.abs(q[1] + q[2])); }); lim *= 1.15;
        var tm = 8, sx = function (t) { return L + pw * t / tm; }, sy = function (p) { return Tp + ph / 2 - ph / 2 * p / lim; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [-lim, 0, lim].forEach(function (p) { cx.beginPath(); cx.moveTo(L, sy(p)); cx.lineTo(L + pw, sy(p)); cx.stroke(); cx.fillText(fmt(p, 1), L - 5, sy(p) + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 8; i += 2) cx.fillText(i, sx(i), h - B + 13); cx.fillText('t (s)  ·  p (kg·m/s)', L + pw / 2, h - 3);
        [[1, '#1c7ed6'], [2, '#e8590c'], [3, '#2f9e44']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.2; cx.beginPath(); H.forEach(function (q, k) { var v = c[0] === 3 ? q[1] + q[2] : q[c[0]]; if (k) cx.lineTo(sx(q[0]), sy(v)); else cx.moveTo(sx(q[0]), sy(v)); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Fuerza durante el impacto (montaje Impulso)', h: 200, note: 'El área bajo la curva es el impulso: F·Δt = Δp = m·v. Un impacto más largo reparte el mismo impulso con menos fuerza.', draw: function (cx, w, h, col) {
        var L = 50, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Fm = S.m1 * 4 / 0.02, sx = function (t) { return L + pw * t / 1; }, sy = function (F) { return Tp + ph - ph * Math.sqrt(F / Fm); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [0, 25, 100, 400].forEach(function (F) { if (F > Fm) return; cx.beginPath(); cx.moveTo(L, sy(F)); cx.lineTo(L + pw, sy(F)); cx.stroke(); cx.fillText(F, L - 5, sy(F) + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(fmt(i / 10, 1), sx(i / 10), h - B + 13); cx.fillText('t desde el contacto (s)  ·  F (N, escala raíz)', L + pw / 2, h - 3);
        [[0.05, '#868e96'], [0.5, '#fab005'], [S.dtc, '#e03131']].forEach(function (q) { var F = S.m1 * 4 / q[0]; cx.strokeStyle = q[1]; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(0), sy(F)); cx.lineTo(sx(q[0]), sy(F)); cx.lineTo(sx(q[0]), sy(0)); cx.stroke(); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'impulso') return '<div class="card-kicker">Impulso</div><table class="calc-table">' + row('Δp', 'm·Δv = ' + f1(S.m1) + ' · 4 = <b>' + f2(S.m1 * 4) + ' kg·m/s</b>') + row('Fuerza media', 'F = Δp/Δt = ' + f2(S.m1 * 4) + ' / ' + f2(S.dtc) + ' = <b>' + fmt(S.m1 * 4 / S.dtc, 0) + ' N</b>') + '</table>';
      if (S.mode === 'explosion') return '<div class="card-kicker">Retroceso</div><table class="calc-table">' + row('Antes', 'p = 0') + row('Después', f1(S.m1) + '·(' + f2(-6 / S.m1) + ') + ' + f1(S.m2) + '·' + f2(6 / S.m2) + ' = <b>0</b>') + '</table>';
      var a = after(), pi = S.m1 * S.v1 + S.m2 * S.v2, ei = 0.5 * S.m1 * S.v1 * S.v1 + 0.5 * S.m2 * S.v2 * S.v2, ef = 0.5 * S.m1 * a[0] * a[0] + 0.5 * S.m2 * a[1] * a[1];
      return '<div class="card-kicker">Choque · e = ' + f2(S.e) + '</div><div class="calc-step">1 · Antes</div><table class="calc-table">' + row('p total', f1(S.m1) + '·' + f2(S.v1) + ' + ' + f1(S.m2) + '·' + f2(S.v2) + ' = <b>' + f2(pi) + ' kg·m/s</b>') + row('Ec total', '<b>' + f2(ei) + ' J</b>') + '</table>' +
        '<div class="calc-step">2 · Después</div><table class="calc-table">' + row('v₁′ · v₂′', '<b>' + f2(a[0]) + '</b> · <b>' + f2(a[1]) + ' m/s</b>') + row('p total', '<b>' + f2(S.m1 * a[0] + S.m2 * a[1]) + ' kg·m/s</b> (se conserva)') + row('Ec total', '<b>' + f2(ef) + ' J</b> (' + (ei > 0 ? fmt(100 * ef / ei, 0) : '—') + ' % de la inicial)') + '</table>';
    },
    quiz: [
      { q: 'Un carro de 3 kg se mueve a 4 m/s. Su cantidad de movimiento es…', options: ['12 kg·m/s', '7 kg·m/s', '24 J', '0,75 kg·m/s'], answer: 0, why: 'p = m·v = 3·4.' },
      { q: 'El airbag reduce las lesiones porque…', options: ['alarga el tiempo de frenado y reduce la fuerza', 'reduce el cambio de momentum', 'aumenta la masa', 'elimina el impulso'], answer: 0, why: 'El Δp es el mismo; con más Δt la fuerza es menor.' },
      { q: 'En un choque elástico entre carros iguales, con uno en reposo…', options: ['intercambian velocidades', 'quedan unidos', 'ambos se detienen', 'ambos rebotan con igual rapidez'], answer: 0, why: 'Se conservan p y Ec: el primero se detiene.' },
      { q: 'Dos carros de 2 kg quedan unidos tras chocar; uno venía a 3 m/s y el otro en reposo. Salen a…', options: ['1,5 m/s', '3 m/s', '6 m/s', '0 m/s'], answer: 0, why: '2·3 = 4·v → v = 1,5 m/s.' },
      { q: 'En todo choque entre dos cuerpos aislados se conserva…', options: ['la cantidad de movimiento total', 'la energía cinética total', 'la velocidad de cada cuerpo', 'la forma de los cuerpos'], answer: 0, why: 'Las fuerzas internas son iguales y opuestas (3.ª ley).' },
      { q: 'Un cañón dispara una bala hacia adelante. El cañón…', options: ['retrocede, con menor rapidez que la bala', 'no se mueve', 'avanza', 'retrocede con la misma rapidez'], answer: 0, why: 'M·V = −m·v; como M ≫ m, V es pequeña.' },
      { q: 'Una fuerza de 50 N actúa durante 0,2 s. El impulso es…', options: ['10 N·s', '250 N·s', '50,2 N·s', '0,004 N·s'], answer: 0, why: 'J = F·Δt.' },
      { q: 'En un choque perfectamente inelástico la energía cinética…', options: ['disminuye', 'se conserva', 'aumenta', 'se duplica'], answer: 0, why: 'Parte se transforma en deformación y calor.' }
    ],
    help: { intro: 'Elige en «Lab» un choque (con coeficiente de restitución e), el montaje de impulso (cambia la duración del impacto) o el retroceso de dos carros.', items: [['e = 1', 'choque elástico; e = 0: quedan unidos.'], ['Gráfico de momentum', 'la curva verde (total) no cambia en el choque.'], ['Impulso', 'el área de cada rectángulo F–t es la misma.']], try: ['Haz chocar 1 kg contra 4 kg en reposo: ¿quién rebota?', 'Con e = 0 y masas iguales, ¿qué fracción de la Ec se pierde?', 'Compara la fuerza al detener el carro en 0,05 s y en 0,5 s.'] }
  };
  MSim.create(def);
})();
