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
      ['Work', 'Work', 'W = F·d: a force that moves its point of application transfers energy',
        '<p>A force does <b>work</b> when it moves the body along its direction: <b>W = F·d·cos θ</b>, in <b>joules (J)</b>. The crane lifts a 20 kg crate at constant speed: the force equals the weight (196 N) and lifting it 5 m does <b>W = 196 · 5 = 980 J</b>. That work is stored as potential energy.</p>'],
      ['Gravitational potential energy', 'Potential', 'Ep = m·g·h: it depends on mass and height',
        '<p><b>Gravitational potential energy</b> is the energy linked to height: <b>Ep = m·g·h</b>. A 2 kg ball 5 m above the bottom of the track has 98 J. Twice the height, twice the energy. Height is measured from a reference level we choose (here, the bottom of the track).</p>'],
      ['Kinetic energy', 'Kinetic', 'Ek = ½·m·v²: it depends on the square of the speed',
        '<p>When the ball is released, potential energy turns into <b>kinetic energy</b>: <b>Ek = ½·m·v²</b>. At the bottom, all the initial Ep has become Ek: m·g·h = ½·m·v² → <b>v = √(2·g·h)</b>, which <b>does not depend on mass</b>. From 5 m it reaches 9.9 m/s.</p>'],
      ['Conservation of mechanical energy', 'Conservation', 'Without friction, Em = Ep + Ek stays constant',
        '<p>Without friction, <b>mechanical energy</b> Em = Ep + Ek is <b>conserved</b>: the Ep and Ek bars rise and fall, but their sum does not change. That is why the ball returns to the <b>same height</b> on the other side and oscillates forever. It is a very useful principle: it gives speeds without knowing the details of the path.</p>'],
      ['Friction and dissipation', 'Friction', 'With friction, part of the mechanical energy turns into heat',
        '<p>With <b>friction</b>, mechanical energy decreases: part of it is <b>dissipated</b> as thermal energy (red bar). The ball no longer reaches the initial height and ends at rest at the bottom. Total energy (mechanical + thermal) is still conserved: <b>initial Em = final Em + Q</b>.</p>'],
      ['Power', 'Power', 'P = W/t: how fast work is done, in watts',
        '<p><b>Power</b> measures how fast energy is transferred: <b>P = W/t</b>, in <b>watts (W = J/s)</b>. Lifting the same crate 5 m (980 J) in 10 s takes 98 W; doing it in 5 s, 196 W. The work is the same, but a more powerful motor does it in less time.</p>']
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
    key: 'energia-mecanica', title: 'Mechanical energy, work and power', subtitle: '3D simulator · physics', accent: { dark: '#69db7c', light: '#2b8a3e' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.6, 5, 12.5], target: [-1.6, 2, -1] }, { id: 'frontal', label: 'Front', pos: [-1.6, 2.6, 13.5], target: [-1.6, 2.2, -1] }],
    layers: [{ id: 'bars', label: 'Energy bars', icon: '▮' }],
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
        lab.b.pos(3.2, 0.6 + yy, 0).set('P = W/t = ' + fmt(S.cm * g * S.ch / S.ct, 0) + ' W (' + fmt(S.ct, 0) + ' s for ' + fmt(S.ch, 1) + ' m)', 'bl-pos').vis(true);
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
      lab.b.pos(-0.95, -0.6, -2.6).set('Ep ' + fmt(ep, 0) + ' J', 'bl-d').vis(on); lab.c.pos(0, -0.6, -2.6).set('Ek ' + fmt(ec, 0) + ' J', 'bl-neg').vis(on); lab.d.pos(0.95, -0.6, -2.6).set('Q ' + fmt(q, 0) + ' J', 'bl-warn').vis(on);
      lab.e.pos(0, 5.6, -2.6).set('Em = ' + fmt(ep + ec, 0) + ' J of ' + fmt(E0, 0) + ' J', 'bl-pos').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.m && u.m.set(S.m); u.h && u.h.set(S.h0); u.mu && u.mu.set(S.mu); u.mode && u.mode.set(S.mode); } },
    hud: function () { return { eq: { chip: 'E', name: S.mode === 'grua' ? 'Work and power' : 'Unpowered track', body: '<div class="eqline"><small>Work</small>W = F·d·cos θ</div><div class="eqline"><small>Potential</small>Ep = m·g·h</div><div class="eqline"><small>Kinetic</small>Ek = ½·m·v²</div><div class="eqline"><small>Power</small>P = W/t</div>' }, legend: [{ label: 'Blue', color: '#339af0', text: 'potential energy' }, { label: 'Green', color: '#51cf66', text: 'kinetic energy' }, { label: 'Red', color: '#ff6b6b', text: 'heat dissipated by friction' }] }; },
    measures: function () {
      if (S.mode === 'grua') { var W = S.cm * g * S.ch; return [['Mass', f1(S.cm) + ' kg'], ['Height', f1(S.ch) + ' m'], ['Work', fmt(W, 0) + ' J'], ['Time', f1(S.ct) + ' s'], ['Power', fmt(W / S.ct, 1) + ' W']]; }
      var E0 = S.m * g * S.h0; return [['Mass', f1(S.m) + ' kg'], ['Current height', f2(y(S.x)) + ' m'], ['Speed', f2(Math.abs(S.v)) + ' m/s'], ['Ep', f1(Ep()) + ' J'], ['Ek', f1(Ec()) + ' J'], ['Em = Ep + Ek', f1(Ep() + Ec()) + ' J'], ['Heat dissipated', f1(Math.max(0, E0 - Ep() - Ec())) + ' J'], ['Theoretical max. speed', f2(Math.sqrt(2 * g * S.h0)) + ' m/s']];
    },
    ideas: ['<b>W = F·d·cos θ</b> (J).', '<b>Ep = m·g·h</b>; <b>Ek = ½·m·v²</b>.', 'Without friction: Ep + Ek = constant.', 'Speed at the bottom: <b>v = √(2gh)</b>, whatever the mass.', 'With friction: initial Em = final Em + heat.', '<b>P = W/t</b> (W = J/s).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experiment'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Set-up', cols: 2, value: S.mode, options: [{ v: 'pista', label: 'Track (Ep ⇄ Ek)' }, { v: 'grua', label: 'Crane (work and power)' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.cy = 0; reset(); } }); c.appendChild(ui.mode);
      ui.m = kit.ui.slider({ label: 'Mass of the ball (kg)', min: 0.5, max: 10, step: 0.5, value: S.m, onInput: function (v) { ctx.goManual(); S.m = v; reset(); } });
      ui.h = kit.ui.slider({ label: 'Initial height (m)', min: 1, max: 7, step: 0.5, value: S.h0, onInput: function (v) { ctx.goManual(); S.h0 = v; reset(); } });
      ui.mu = kit.ui.slider({ label: 'Friction coefficient', min: 0, max: 0.3, step: 0.01, value: S.mu, digits: 2, onInput: function (v) { ctx.goManual(); S.mu = v; reset(); } });
      c.appendChild(kit.ui.sliders([ui.m, ui.h, ui.mu]));
      var c2 = kit.ui.card('Crane'); el.appendChild(c2);
      ui.cm = kit.ui.slider({ label: 'Mass of the crate (kg)', min: 5, max: 100, step: 5, value: S.cm, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.cm = v; S.cy = 0; } });
      ui.ch = kit.ui.slider({ label: 'Height to lift (m)', min: 1, max: 5, step: 0.5, value: S.ch, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.ch = v; S.cy = 0; } });
      ui.ct = kit.ui.slider({ label: 'Lifting time (s)', min: 2, max: 20, step: 1, value: S.ct, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'grua'; S.ct = v; S.cy = 0; } });
      c2.appendChild(kit.ui.sliders([ui.cm, ui.ch, ui.ct]));
      el.appendChild(ctx.btnRow([{ t: 'Release from the top', primary: true, fn: function () { ctx.goManual(); S.held = false; S.mode = 'pista'; reset(); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Energy against position', h: 220, note: 'Blue curve: Ep at each point of the track. Green line: current mechanical energy. Where they cross, the ball stops and turns back.', draw: function (cx, w, h, col) {
        var L = 46, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, E0 = Math.max(1, S.m * g * S.h0), sx = function (x) { return L + pw * (x + XW) / (2 * XW); }, sy = function (e) { return Tp + ph - ph * e / (E0 * 1.1); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var e = E0 * 1.1 * i / 4; cx.beginPath(); cx.moveTo(L, sy(e)); cx.lineTo(L + pw, sy(e)); cx.stroke(); cx.fillText(fmt(e, 0), L - 5, sy(e) + 3); }
        cx.textAlign = 'center'; for (i = -8; i <= 8; i += 4) cx.fillText(i, sx(i), h - B + 13); cx.fillText('x (m)  ·  energy (J)', L + pw / 2, h - 3);
        cx.strokeStyle = '#339af0'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = -XW + 2 * XW * i / 80; if (i) cx.lineTo(sx(x), sy(S.m * g * y(x))); else cx.moveTo(sx(x), sy(S.m * g * y(x))); } cx.stroke();
        var em = Ep() + Ec(); cx.strokeStyle = '#51cf66'; cx.beginPath(); cx.moveTo(L, sy(em)); cx.lineTo(L + pw, sy(em)); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.x), sy(Ep()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Energy breakdown', h: 190, note: 'Ep + Ek + heat = initial energy (m·g·h₀). Without friction the heat is zero.', draw: function (cx, w, h, col) {
        var E0 = Math.max(1, S.m * g * S.h0), v = [Ep(), Ec(), Math.max(0, E0 - Ep() - Ec())], nm = ['Ep', 'Ek', 'Heat'], cl = ['#339af0', '#51cf66', '#ff6b6b'], bw = (w - 60) / 3;
        cx.font = '11px system-ui'; cx.textAlign = 'center';
        v.forEach(function (e, i) { var bh = (h - 50) * e / E0, x = 30 + i * bw + bw * 0.15; cx.fillStyle = cl[i]; cx.fillRect(x, h - 26 - bh, bw * 0.7, bh); cx.fillStyle = col.ink; cx.fillText(nm[i] + ' · ' + fmt(e, 0) + ' J', x + bw * 0.35, h - 10); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'grua') { var W = S.cm * g * S.ch; return '<div class="card-kicker">Crane</div><table class="calc-table">' + row('Force (= weight)', 'F = m·g = ' + f1(S.cm) + ' · 9.8 = <b>' + f1(S.cm * g) + ' N</b>') + row('Work', 'W = F·h = ' + f1(S.cm * g) + ' · ' + f1(S.ch) + ' = <b>' + fmt(W, 0) + ' J</b>') + row('Power', 'P = W/t = ' + fmt(W, 0) + ' / ' + f1(S.ct) + ' = <b>' + fmt(W / S.ct, 1) + ' W</b>') + '</table>'; }
      var E0 = S.m * g * S.h0;
      return '<div class="card-kicker">Track · m = ' + f1(S.m) + ' kg</div><div class="calc-step">1 · Initial energy</div><table class="calc-table">' + row('Ep₀ = m·g·h₀', f1(S.m) + ' · 9.8 · ' + f1(S.h0) + ' = <b>' + f1(E0) + ' J</b>') + '</table>' +
        '<div class="calc-step">2 · Speed at the bottom (no friction)</div><table class="calc-table">' + row('m·g·h₀ = ½·m·v²', 'v = √(2·g·h₀) = √(2 · 9.8 · ' + f1(S.h0) + ') = <b>' + f2(Math.sqrt(2 * g * S.h0)) + ' m/s</b>') + '</table>' +
        '<div class="calc-step">3 · Now</div><table class="calc-table">' + row('Ep + Ek', f1(Ep()) + ' + ' + f1(Ec()) + ' = <b>' + f1(Ep() + Ec()) + ' J</b>') + row('Dissipated (friction)', '<b>' + f1(Math.max(0, E0 - Ep() - Ec())) + ' J</b>') + '</table>';
    },
    quiz: [
      { q: 'You lift a 5 kg backpack 2 m high. The work against gravity is…', options: ['98 J', '10 J', '49 J', '196 J'], answer: 0, why: 'W = m·g·h = 5·9.8·2 = 98 J.' },
      { q: 'If a car’s speed doubles, its kinetic energy…', options: ['quadruples', 'doubles', 'does not change', 'halves'], answer: 0, why: 'Ek = ½mv² depends on v².' },
      { q: 'Without friction, a ball released from 5 m reaches the bottom with a speed that…', options: ['does not depend on its mass', 'is greater if it is heavier', 'is smaller if it is heavier', 'is zero'], answer: 0, why: 'v = √(2gh): the mass cancels out.' },
      { q: 'At the lowest point of the track (no friction)…', options: ['Ek is maximum and Ep minimum', 'Ep is maximum', 'both are zero', 'Ek is minimum'], answer: 0, why: 'All the Ep has become Ek.' },
      { q: 'With friction, the ball does not return to the initial height because…', options: ['part of the energy turns into heat', 'energy is destroyed', 'the mass decreases', 'gravity changes'], answer: 0, why: 'Total energy is conserved, but part of it is no longer mechanical.' },
      { q: 'A motor delivers 600 J in 3 s. Its power is…', options: ['200 W', '1800 W', '600 W', '0.005 W'], answer: 0, why: 'P = W/t = 600/3.' },
      { q: 'Two cranes lift the same load to the same height, one in half the time. That crane…', options: ['has twice the power and does the same work', 'does twice the work', 'does half the work', 'has the same power'], answer: 0, why: 'Work depends on F and d; power depends on time.' },
      { q: 'The SI unit of energy is…', options: ['joule', 'watt', 'newton', 'pascal'], answer: 0, why: '1 J = 1 N·m; the watt is J/s.' }
    ],
    help: { intro: 'In «Lab» choose the track (potential ⇄ kinetic energy, with or without friction) or the crane (work and power).', items: [['Bars', 'blue: Ep; green: Ek; red: heat dissipated.'], ['Friction', 'with friction 0, mechanical energy is conserved.'], ['Crane', 'change mass, height and time to compare work and power.']], try: ['Double the mass: does the speed at the bottom change?', 'Set friction to 0.1: how high does it get on the second climb?', 'Lift 50 kg to 4 m in 5 s and in 10 s: compare the power.'] }
  };
  MSim.create(def);
})();
