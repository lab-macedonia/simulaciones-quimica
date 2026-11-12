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
      ['Momentum', 'p = m·v', 'p = m·v: it depends on mass and velocity',
        '<p><b>Momentum</b> is <b>p = m·v</b>, in kg·m/s. It is a <b>vector</b> pointing along the velocity. A 2 kg cart at 3 m/s has 6 kg·m/s. A slow truck can have more momentum than a fast car: that is why it is harder to stop.</p>'],
      ['Impulse', 'Impulse', 'J = F·Δt = Δp: the same change of momentum with less force if it lasts longer',
        '<p>To change momentum an <b>impulse</b> is needed: <b>J = F·Δt = Δp</b>. The 2 kg cart at 4 m/s stops (Δp = 8 kg·m/s) against a rigid wall in 0.05 s (F = 160 N) or against a cushion in 0.5 s (F = 16 N). The area under the F–t graph is the same: that is how <b>airbags</b>, helmets and car crumple zones work.</p>'],
      ['Elastic collision', 'Elastic', 'Both momentum and kinetic energy are conserved',
        '<p>In an <b>elastic collision</b> both the <b>total momentum</b> and the <b>kinetic energy</b> are conserved. With equal masses and one at rest, the carts <b>swap velocities</b>: the moving one stops and the other leaves with its speed (as in Newton’s cradle or billiards).</p>'],
      ['Perfectly inelastic collision', 'Inelastic', 'The bodies stick together; momentum is conserved, kinetic energy is not',
        '<p>If the carts <b>stick together</b>, the collision is <b>perfectly inelastic</b>. Total momentum is conserved: m₁v₁ = (m₁ + m₂)·v → with equal masses they move off together at <b>half the velocity</b>. Kinetic energy is <b>not</b> conserved: half of it becomes deformation, heat and sound.</p>'],
      ['Different masses', 'Masses', 'A light body bounces off a heavy one',
        '<p>If a <b>light</b> cart (1 kg) collides elastically with a <b>heavy</b> one (4 kg) at rest, the light one <b>bounces back</b> and the heavy one moves forward slowly. Although the velocities change a lot, the sum <b>m₁v₁ + m₂v₂</b> is the same before and after: check it in the momentum graph.</p>'],
      ['Recoil and explosions', 'Recoil', 'If the system starts at rest, the total momentum stays zero',
        '<p>Two carts at rest are pushed apart by a spring (like a cannon and its ball, or a skater throwing a ball). The total momentum was <b>zero</b> and stays zero: <b>m₁v₁ = −m₂v₂</b>. The lighter cart moves off faster. That is how rockets fly: they push gas backwards and move forwards.</p>']
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
    key: 'momentum-choques', title: 'Momentum and collisions', subtitle: '3D simulator · physics', accent: { dark: '#b197fc', light: '#6741d9' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.2, 7, 14], target: [-1.2, 2.2, 0] }, { id: 'frontal', label: 'Front', pos: [-1.2, 3, 15], target: [-1.2, 2.2, 0] }],
    layers: [{ id: 'vec', label: 'Momentum vectors', icon: '➜' }],
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
        lab.b.pos(5, 3.2, 0).set((S.dtc > 0.2 ? 'Cushion · Δt = ' : 'Rigid wall · Δt = ') + f2(S.dtc) + ' s · F = ' + fmt(S.m1 * 4 / S.dtc, 0) + ' N', 'bl-warn').vis(true);
        return;
      }
      G.c1.position.set(S.x1, 0.4, 0); G.c2.position.set(S.x2, 0.4, 0); var s1 = Math.cbrt(S.m1 / 2), s2 = Math.cbrt(S.m2 / 2); G.c1.scale.set(1, s1, s1); G.c2.scale.set(1, s2, s2); G.c1.position.y = 0.4 * s1; G.c2.position.y = 0.4 * s2;
      [[G.a1, S.x1, S.u1, S.m1, 0.8 * s1], [G.a2, S.x2, S.u2, S.m2, 0.8 * s2]].forEach(function (q) { var a = q[0], p = q[2] * q[3]; a.visible = on && Math.abs(p) > 0.02; if (a.visible) { a.position.set(q[1], q[4] + 0.5, 0); a.setDirection(new T.Vector3(Math.sign(p), 0, 0)); a.setLength(0.3 + Math.abs(p) * 0.18, 0.3, 0.22); } });
      lab.a.pos(S.x1, 2.2 + 0.4 * s1, 0).set(f1(S.m1) + ' kg · ' + f2(S.u1) + ' m/s', 'bl-lead').vis(true);
      lab.b.pos(S.x2, 2.2 + 0.4 * s2, 0).set(f1(S.m2) + ' kg · ' + f2(S.u2) + ' m/s', 'bl-pos').vis(true);
      lab.c.pos(-1, 4.6, 0).set('total p = ' + f2(p1() + p2()) + ' kg·m/s · total Ek = ' + f2(ec()) + ' J', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.m1 && u.m1.set(S.m1); u.m2 && u.m2.set(S.m2); u.v1 && u.v1.set(S.v1); u.v2 && u.v2.set(S.v2); u.e && u.e.set(S.e); } },
    hud: function () { return { eq: { chip: 'p', name: { choque: S.e === 1 ? 'Elastic collision' : S.e === 0 ? 'Perfectly inelastic collision' : 'Partially elastic collision', impulso: 'Impulse', explosion: 'Recoil' }[S.mode], body: '<div class="eqline"><small>Momentum</small>p = m·v</div><div class="eqline"><small>Impulse</small>J = F·Δt = Δp</div><div class="eqline"><small>Conservation</small>m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</div>' }, legend: [{ label: 'Cart A', color: '#1c7ed6', text: 'blue' }, { label: 'Cart B', color: '#e8590c', text: 'orange' }, { label: 'Arrows', color: '#339af0', text: 'momentum of each cart' }] }; },
    measures: function () {
      if (S.mode === 'impulso') return [['Mass', f1(S.m1) + ' kg'], ['Δp', f2(S.m1 * 4) + ' kg·m/s'], ['Stopping time Δt', f2(S.dtc) + ' s'], ['Average force', fmt(S.m1 * 4 / S.dtc, 0) + ' N']];
      return [['Masses', f1(S.m1) + ' / ' + f1(S.m2) + ' kg'], ['Velocities', f2(S.u1) + ' / ' + f2(S.u2) + ' m/s'], ['p₁ + p₂', f2(p1()) + ' + ' + f2(p2()) + ' = ' + f2(p1() + p2()) + ' kg·m/s'], ['Total Ek', f2(ec()) + ' J'], ['Coeff. of restitution', f2(S.e)]];
    },
    ideas: ['<b>p = m·v</b> (kg·m/s), a vector.', '<b>J = F·Δt = Δp</b>: more time, less force.', 'Total momentum is conserved in every collision.', 'Elastic: kinetic energy is conserved too.', 'Perfectly inelastic: they stick together and Ek is lost.', 'Recoil: m₁v₁ = −m₂v₂.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experiment'); el.appendChild(c);
      function re() { if (S.mode === 'choque') resetChoque(); else if (S.mode === 'explosion') resetExp(); else resetImp(); }
      ui.mode = kit.ui.options({ label: 'Set-up', cols: 3, value: S.mode, options: [{ v: 'choque', label: 'Collision' }, { v: 'impulso', label: 'Impulse' }, { v: 'explosion', label: 'Recoil' }], onChange: function (v) { ctx.goManual(); S.mode = v; re(); } }); c.appendChild(ui.mode);
      ui.m1 = kit.ui.slider({ label: 'Mass of cart A (kg)', min: 0.5, max: 8, step: 0.5, value: S.m1, onInput: function (v) { ctx.goManual(); S.m1 = v; re(); } });
      ui.m2 = kit.ui.slider({ label: 'Mass of cart B (kg)', min: 0.5, max: 8, step: 0.5, value: S.m2, onInput: function (v) { ctx.goManual(); S.m2 = v; re(); } });
      ui.v1 = kit.ui.slider({ label: 'Initial velocity of A (m/s)', min: 0, max: 5, step: 0.25, value: S.v1, digits: 2, onInput: function (v) { ctx.goManual(); S.v1 = v; re(); } });
      ui.v2 = kit.ui.slider({ label: 'Initial velocity of B (m/s)', min: -4, max: 2, step: 0.25, value: S.v2, digits: 2, onInput: function (v) { ctx.goManual(); S.v2 = v; re(); } });
      ui.e = kit.ui.slider({ label: 'Coefficient of restitution e', min: 0, max: 1, step: 0.05, value: S.e, digits: 2, onInput: function (v) { ctx.goManual(); S.e = v; re(); } });
      ui.dt = kit.ui.slider({ label: 'Impact duration Δt (s)', min: 0.02, max: 0.8, step: 0.02, value: S.dtc, digits: 2, onInput: function (v) { ctx.goManual(); S.dtc = v; S.mode = 'impulso'; resetImp(); } });
      c.appendChild(kit.ui.sliders([ui.m1, ui.m2, ui.v1, ui.v2, ui.e, ui.dt]));
      el.appendChild(ctx.btnRow([{ t: 'Repeat', primary: true, fn: function () { ctx.goManual(); re(); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Momentum of each cart and total', h: 220, note: 'Blue: cart A; orange: cart B; green: total. In the collision the blue and orange curves change, but the green one does not.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, H = S.hist, lim = 1; H.forEach(function (q) { lim = Math.max(lim, Math.abs(q[1]), Math.abs(q[2]), Math.abs(q[1] + q[2])); }); lim *= 1.15;
        var tm = 8, sx = function (t) { return L + pw * t / tm; }, sy = function (p) { return Tp + ph / 2 - ph / 2 * p / lim; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [-lim, 0, lim].forEach(function (p) { cx.beginPath(); cx.moveTo(L, sy(p)); cx.lineTo(L + pw, sy(p)); cx.stroke(); cx.fillText(fmt(p, 1), L - 5, sy(p) + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 8; i += 2) cx.fillText(i, sx(i), h - B + 13); cx.fillText('t (s)  ·  p (kg·m/s)', L + pw / 2, h - 3);
        [[1, '#1c7ed6'], [2, '#e8590c'], [3, '#2f9e44']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.2; cx.beginPath(); H.forEach(function (q, k) { var v = c[0] === 3 ? q[1] + q[2] : q[c[0]]; if (k) cx.lineTo(sx(q[0]), sy(v)); else cx.moveTo(sx(q[0]), sy(v)); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Force during the impact (Impulse set-up)', h: 200, note: 'The area under the curve is the impulse: F·Δt = Δp = m·v. A longer impact spreads the same impulse with less force.', draw: function (cx, w, h, col) {
        var L = 50, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Fm = S.m1 * 4 / 0.02, sx = function (t) { return L + pw * t / 1; }, sy = function (F) { return Tp + ph - ph * Math.sqrt(F / Fm); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [0, 25, 100, 400].forEach(function (F) { if (F > Fm) return; cx.beginPath(); cx.moveTo(L, sy(F)); cx.lineTo(L + pw, sy(F)); cx.stroke(); cx.fillText(F, L - 5, sy(F) + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(fmt(i / 10, 1), sx(i / 10), h - B + 13); cx.fillText('t since contact (s)  ·  F (N, square-root scale)', L + pw / 2, h - 3);
        [[0.05, '#868e96'], [0.5, '#fab005'], [S.dtc, '#e03131']].forEach(function (q) { var F = S.m1 * 4 / q[0]; cx.strokeStyle = q[1]; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(0), sy(F)); cx.lineTo(sx(q[0]), sy(F)); cx.lineTo(sx(q[0]), sy(0)); cx.stroke(); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'impulso') return '<div class="card-kicker">Impulse</div><table class="calc-table">' + row('Δp', 'm·Δv = ' + f1(S.m1) + ' · 4 = <b>' + f2(S.m1 * 4) + ' kg·m/s</b>') + row('Average force', 'F = Δp/Δt = ' + f2(S.m1 * 4) + ' / ' + f2(S.dtc) + ' = <b>' + fmt(S.m1 * 4 / S.dtc, 0) + ' N</b>') + '</table>';
      if (S.mode === 'explosion') return '<div class="card-kicker">Recoil</div><table class="calc-table">' + row('Before', 'p = 0') + row('After', f1(S.m1) + '·(' + f2(-6 / S.m1) + ') + ' + f1(S.m2) + '·' + f2(6 / S.m2) + ' = <b>0</b>') + '</table>';
      var a = after(), pi = S.m1 * S.v1 + S.m2 * S.v2, ei = 0.5 * S.m1 * S.v1 * S.v1 + 0.5 * S.m2 * S.v2 * S.v2, ef = 0.5 * S.m1 * a[0] * a[0] + 0.5 * S.m2 * a[1] * a[1];
      return '<div class="card-kicker">Collision · e = ' + f2(S.e) + '</div><div class="calc-step">1 · Before</div><table class="calc-table">' + row('p total', f1(S.m1) + '·' + f2(S.v1) + ' + ' + f1(S.m2) + '·' + f2(S.v2) + ' = <b>' + f2(pi) + ' kg·m/s</b>') + row('Total Ek', '<b>' + f2(ei) + ' J</b>') + '</table>' +
        '<div class="calc-step">2 · After</div><table class="calc-table">' + row('v₁′ · v₂′', '<b>' + f2(a[0]) + '</b> · <b>' + f2(a[1]) + ' m/s</b>') + row('p total', '<b>' + f2(S.m1 * a[0] + S.m2 * a[1]) + ' kg·m/s</b> (conserved)') + row('Total Ek', '<b>' + f2(ef) + ' J</b> (' + (ei > 0 ? fmt(100 * ef / ei, 0) : '—') + ' % of the initial value)') + '</table>';
    },
    quiz: [
      { q: 'A 3 kg cart moves at 4 m/s. Its momentum is…', options: ['12 kg·m/s', '7 kg·m/s', '24 J', '0.75 kg·m/s'], answer: 0, why: 'p = m·v = 3·4.' },
      { q: 'The airbag reduces injuries because…', options: ['it lengthens the stopping time and reduces the force', 'it reduces the change in momentum', 'it increases the mass', 'it removes the impulse'], answer: 0, why: 'Δp is the same; with a longer Δt the force is smaller.' },
      { q: 'In an elastic collision between equal carts, with one at rest…', options: ['they swap velocities', 'they stick together', 'both stop', 'both bounce back at the same speed'], answer: 0, why: 'p and Ek are conserved: the first one stops.' },
      { q: 'Two 2 kg carts stick together after colliding; one was moving at 3 m/s and the other was at rest. They move off at…', options: ['1.5 m/s', '3 m/s', '6 m/s', '0 m/s'], answer: 0, why: '2·3 = 4·v → v = 1.5 m/s.' },
      { q: 'In every collision between two isolated bodies, what is conserved is…', options: ['the total momentum', 'the total kinetic energy', 'the velocity of each body', 'the shape of the bodies'], answer: 0, why: 'The internal forces are equal and opposite (3rd law).' },
      { q: 'A cannon fires a ball forwards. The cannon…', options: ['recoils, more slowly than the ball', 'does not move', 'moves forwards', 'recoils at the same speed'], answer: 0, why: 'M·V = −m·v; since M ≫ m, V is small.' },
      { q: 'A 50 N force acts for 0.2 s. The impulse is…', options: ['10 N·s', '250 N·s', '50.2 N·s', '0.004 N·s'], answer: 0, why: 'J = F·Δt.' },
      { q: 'In a perfectly inelastic collision, kinetic energy…', options: ['decreases', 'is conserved', 'increases', 'doubles'], answer: 0, why: 'Part of it becomes deformation and heat.' }
    ],
    help: { intro: 'In «Lab» choose a collision (with coefficient of restitution e), the impulse set-up (change the impact duration) or the recoil of two carts.', items: [['e = 1', 'elastic collision; e = 0: they stick together.'], ['Momentum graph', 'the green (total) curve does not change in the collision.'], ['Impulse', 'the area of each F–t rectangle is the same.']], try: ['Crash 1 kg into 4 kg at rest: which one bounces back?', 'With e = 0 and equal masses, what fraction of the Ek is lost?', 'Compare the force when the cart stops in 0.05 s and in 0.5 s.'] }
  };
  MSim.create(def);
})();
