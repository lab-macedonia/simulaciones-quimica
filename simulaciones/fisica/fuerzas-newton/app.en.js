/* Fuerzas y leyes de Newton — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var SURF = { hielo: { n: 'Ice', ms: 0.10, mk: 0.03, c: 0xd0ebff }, madera: { n: 'Wood', ms: 0.50, mk: 0.30, c: 0xb08155 }, goma: { n: 'Rubber on asphalt', ms: 0.90, mk: 0.70, c: 0x495057 } };
  var PLAN = { tierra: { n: 'Earth', g: 9.8 }, luna: { n: 'Moon', g: 1.62 }, marte: { n: 'Mars', g: 3.71 }, jupiter: { n: 'Jupiter', g: 24.8 } };
  var S = { mode: 'mesa', m: 5, F: 20, surf: 'madera', pl: 'tierra', k: 100, x: 0, v: 0, ext: 0, ve: 0, m1: 2, m2: 4, cx1: 0, cx2: 0, cv1: 0, cv2: 0, ct: 0, hist: [] };
  var G = {}, arr = {}, lab = {};
  function g() { return PLAN[S.pl].g; }
  function N() { return S.m * g(); }
  function fric() { var s = SURF[S.surf], n = N(); if (Math.abs(S.v) < 1e-4) return Math.min(S.F, s.ms * n); return s.mk * n; }
  function moving() { return Math.abs(S.v) > 1e-4 || S.F > SURF[S.surf].ms * N(); }
  function acc() { if (!moving()) return 0; return (S.F - SURF[S.surf].mk * N()) / S.m; }
  function stages() {
    return [
      ['Forces in balance', 'Balance', 'With no net force, a body at rest stays at rest (1st law)',
        '<p>A <b>force</b> is an interaction between two bodies and is measured in <b>newtons (N)</b>. Two forces act on the box: its <b>weight</b> (the Earth pulls it down) and the <b>normal force</b> (the table pushes it up). They are equal and opposite: the <b>net force is zero</b> and the box stays at rest. That is <b>Newton’s first law</b> (inertia).</p>'],
      ['Weight and gravity', 'Weight', 'W = m·g: mass does not change, weight depends on the body you stand on',
        '<p><b>Mass</b> (kg) measures the amount of matter and the inertia; <b>weight</b> is the gravitational force: <b>W = m·g</b>. A 5 kg body weighs 49 N on Earth (g = 9.8 m/s²), 8.1 N on the Moon and 124 N on Jupiter. The spring balance measures weight: it stretches more where gravity is stronger.</p>'],
      ['Elastic force: Hooke’s law', 'Hooke', 'F = k·x: the stretch is proportional to the force',
        '<p>A spring exerts an <b>elastic force</b> proportional to its deformation: <b>F = k·x</b>, where k is the <b>spring constant</b> (N/m). Hanging more mass stretches the spring in proportion: the F–x graph is a straight line of slope k. A stiffer spring (larger k) stretches less with the same load.</p>'],
      ['Friction', 'Friction', 'Static friction up to μₛ·N; when sliding, kinetic friction μ_k·N',
        '<p>As you pull the box, <b>static friction</b> grows just like the applied force and the box does not move, up to a maximum of <b>μₛ·N</b>. Beyond that value the box slides and <b>kinetic friction</b> <b>μ_k·N</b>, a little smaller, takes over: that is why it is harder to start motion than to keep it going. Friction depends on the surfaces (μ) and on the normal force.</p>'],
      ['Second law: F = m·a', '2nd law', 'Acceleration is proportional to the net force and inversely proportional to the mass',
        '<p>When the net force is not zero the body accelerates: <b>F<sub>net</sub> = m·a</b>. Here the net force is the applied force minus kinetic friction. With the same net force, a box with <b>twice the mass</b> has <b>half the acceleration</b>. 1 N is the force that gives 1 kg an acceleration of 1 m/s².</p>'],
      ['Third law: action and reaction', '3rd law', 'Forces come in equal and opposite pairs, acting on different bodies',
        '<p>Two carts push apart with a compressed spring. Cart A pushes B and <b>B pushes A with an equal and opposite force</b> (<b>third law</b>). The forces are equal, but the <b>lighter cart gets more acceleration</b> and leaves faster: m₁·v₁ = m₂·v₂. Action and reaction never cancel because they act on different bodies.</p>']
    ];
  }
  function lessonSet(i, l, dt) {
    if (i === 0) { S.mode = 'mesa'; S.F = 0; S.m = 5; S.pl = 'tierra'; S.surf = 'madera'; S.x = 0; S.v = 0; }
    else if (i === 1) { S.mode = 'resorte'; S.k = 100; S.m = 5; S.pl = ['tierra', 'luna', 'marte', 'jupiter'][Math.min(3, Math.floor(l * 4))]; }
    else if (i === 2) { S.mode = 'resorte'; S.pl = 'tierra'; S.k = 100; S.m = 1 + Math.min(4, Math.floor(l * 5)) * 2; }
    else if (i === 3) { S.mode = 'mesa'; S.m = 5; S.pl = 'tierra'; S.surf = 'madera'; S.F = 40 * Math.min(1, l * 1.25); if (l < 0.02) { S.x = 0; S.v = 0; } }
    else if (i === 4) { S.mode = 'mesa'; S.surf = 'madera'; S.pl = 'tierra'; S.F = 35; var m = l < 0.5 ? 5 : 10; if (m !== S.m || l < 0.02 || Math.abs(l - 0.5) < 0.01) { S.x = 0; S.v = 0; } S.m = m; }
    else { S.mode = 'carros'; S.m1 = 2; S.m2 = 4; var ct = l * 6; if (ct < S.ct) { S.ct = 0; } S.ct = ct; }
  }
  function stepMesa(dt) {
    var a = acc(); S.v += a * dt; if (S.v < 0) S.v = 0; S.x += S.v * dt;
    if (S.x > 9.5) { S.x = 0; S.v = 0; }
  }
  function stepCarros() { var t = S.ct, F = 12, tp = 0.5, p = Math.min(t, tp); S.cv1 = -F * p / S.m1; S.cv2 = F * p / S.m2; S.cx1 = -0.5 * F / S.m1 * p * p + (t > tp ? S.cv1 * (t - tp) : 0); S.cx2 = 0.5 * F / S.m2 * p * p + (t > tp ? S.cv2 * (t - tp) : 0); }
  function box(w, h, d, c) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: c, roughness: 0.6 })); }
  function arrow(c) { var a = new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 1, c, 0.4, 0.28); G.root.add(a); return a; }
  function setArr(a, o, dir, F, sc, on) { a.visible = on && F > 0.01; if (!a.visible) return; a.position.copy(o); a.setDirection(dir); a.setLength(Math.max(0.35, F * sc), 0.32, 0.24); }
  var def = {
    key: 'fuerzas-newton', title: 'Forces and Newton’s laws', subtitle: '3D simulator · physics', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-0.5, 6, 15], target: [-0.5, 1.8, 0] }, { id: 'frontal', label: 'Front', pos: [-0.5, 2.4, 16], target: [-0.5, 2, 0] }],
    layers: [{ id: 'dcl', label: 'Force diagram', icon: '➜' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      // mesa
      G.mesa = new T.Group(); G.root.add(G.mesa);
      G.top = box(13, 0.3, 4, 0xb08155); G.top.position.set(2.5, -0.15, 0); G.mesa.add(G.top);
      G.box = box(1.6, 1.6, 1.6, 0x1c7ed6); G.mesa.add(G.box);
      G.rope = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1, 6), new T.MeshStandardMaterial({ color: 0xf8f9fa })); G.rope.rotation.z = Math.PI / 2; G.mesa.add(G.rope);
      G.hand = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), new T.MeshStandardMaterial({ color: 0xffc9a3 })); G.mesa.add(G.hand);
      // resorte
      G.res = new T.Group(); G.root.add(G.res);
      var sup = box(5, 0.3, 1.2, 0x868e96); sup.position.set(0, 7, 0); G.res.add(sup);
      var pts = []; for (var i = 0; i <= 400; i++) { var u = i / 400; pts.push(new T.Vector3(0.45 * Math.cos(u * 2 * Math.PI * 14), -u, 0.45 * Math.sin(u * 2 * Math.PI * 14))); }
      G.spring = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xced4da })); G.spring.position.set(0, 6.85, 0); G.res.add(G.spring);
      G.mass = box(1.3, 1.1, 1.3, 0xe8590c); G.res.add(G.mass);
      G.ruler = box(0.12, 6.5, 0.12, 0xffd43b); G.ruler.position.set(-1.6, 3.6, 0); G.res.add(G.ruler);
      // carros
      G.car = new T.Group(); G.root.add(G.car);
      var track = box(18, 0.2, 2.2, 0x495057); track.position.set(0, -0.1, 0); G.car.add(track);
      G.c1 = box(1.4, 0.9, 1.3, 0x1c7ed6); G.c2 = box(2.0, 1.1, 1.5, 0xe8590c); G.car.add(G.c1); G.car.add(G.c2);
      G.cs = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); G.cs.rotation.z = Math.PI / 2; G.car.add(G.cs);
      arr.P = arrow(0x845ef7); arr.N = arrow(0x51cf66); arr.F = arrow(0x1c7ed6); arr.f = arrow(0xff6b6b); arr.A = arrow(0xff922b); arr.B = arrow(0x339af0);
      ['a', 'b', 'c', 'd', 'e'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, dt);
      else if (S.mode === 'carros') { S.ct += dt; if (S.ct > 6) S.ct = 0; }
      G.mesa.visible = S.mode === 'mesa'; G.res.visible = S.mode === 'resorte'; G.car.visible = S.mode === 'carros';
      var on = ctx.layer('dcl'), sc = 0.06;
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); }); Object.keys(arr).forEach(function (k) { arr[k].visible = false; });
      if (S.mode === 'mesa') {
        if (f.playing || ctx.P.manual) stepMesa(dt);
        var bx = -2.8 + S.x; G.box.position.set(bx, 0.8, 0); G.top.material.color.setHex(SURF[S.surf].c);
        var hx = bx + 0.8 + 0.6 + S.F * 0.04; G.hand.position.set(hx, 0.8, 0); G.rope.position.set((bx + 0.8 + hx) / 2, 0.8, 0); G.rope.scale.y = Math.max(0.05, hx - bx - 0.8); G.hand.visible = G.rope.visible = S.F > 0;
        var fr = fric(), sc2 = 2.4 / Math.max(40, N());
        setArr(arr.P, new T.Vector3(bx, 0.8, 0.9), new T.Vector3(0, -1, 0), N(), sc2, on);
        setArr(arr.N, new T.Vector3(bx, 0.8, 0.9), new T.Vector3(0, 1, 0), N(), sc2, on);
        setArr(arr.F, new T.Vector3(bx + 0.8, 0.8, 0.9), new T.Vector3(1, 0, 0), S.F, sc2, on);
        setArr(arr.f, new T.Vector3(bx - 0.8, 0.1, 0.9), new T.Vector3(-1, 0, 0), fr, sc2, on);
        lab.a.pos(bx, 3.6, 0).set('W = N = ' + f1(N()) + ' N · F = ' + f1(S.F) + ' N · friction = ' + f1(fr) + ' N', 'bl-lead').vis(true);
        lab.b.pos(bx, 2.6, 0).set(moving() ? 'Sliding · a = ' + f2(acc()) + ' m/s² · v = ' + f2(S.v) + ' m/s' : 'At rest · static friction', moving() ? 'bl-warn' : 'bl-neg').vis(true);
        lab.c.pos(5.5, 3.2, 0).set(SURF[S.surf].n + ' · μₛ = ' + f2(SURF[S.surf].ms) + ' · μ_k = ' + f2(SURF[S.surf].mk), 'bl-d').vis(true);
      } else if (S.mode === 'resorte') {
        var x = S.m * g() / S.k, target = x; S.ve += ((target - S.ext) * 30 - S.ve * 5) * dt; S.ext += S.ve * dt; S.ext = clamp(S.ext, 0, 4.5);
        var L = 1.6 + S.ext; G.spring.scale.y = L; G.mass.position.set(0, 6.85 - L - 0.55, 0);
        setArr(arr.P, new T.Vector3(0.9, G.mass.position.y, 0), new T.Vector3(0, -1, 0), S.m * g(), 0.03, on);
        setArr(arr.N, new T.Vector3(-0.9, G.mass.position.y, 0), new T.Vector3(0, 1, 0), S.k * S.ext, 0.03, on);
        lab.a.pos(2.6, G.mass.position.y, 0).set(PLAN[S.pl].n + ' · W = m·g = ' + f1(S.m) + '·' + f2(g()) + ' = ' + f1(S.m * g()) + ' N', 'bl-lead').vis(true);
        lab.b.pos(2.6, G.mass.position.y - 1, 0).set('Stretch x = W/k = ' + f2(x * 100) + ' cm', 'bl-pos').vis(true);
        lab.c.pos(0, 7.7, 0).set('k = ' + fmt(S.k, 0) + ' N/m', 'bl-d').vis(true);
      } else {
        stepCarros(); var p1 = -1.3 + S.cx1 * 0.6, p2 = 1.3 + S.cx2 * 0.6; G.c1.position.set(Math.max(-8.5, p1), 0.45, 0); G.c2.position.set(Math.min(8.5, p2), 0.55, 0);
        var comp = S.ct < 0.5; G.cs.visible = comp; G.cs.position.set((G.c1.position.x + G.c2.position.x) / 2, 0.5, 0); G.cs.scale.y = Math.max(0.1, G.c2.position.x - G.c1.position.x - 1.7);
        setArr(arr.A, new T.Vector3(G.c1.position.x - 0.7, 1.4, 0), new T.Vector3(-1, 0, 0), comp ? 12 : 0, 0.15, on);
        setArr(arr.B, new T.Vector3(G.c2.position.x + 1.0, 1.4, 0), new T.Vector3(1, 0, 0), comp ? 12 : 0, 0.15, on);
        lab.a.pos(G.c1.position.x, 2.4, 0).set('A · ' + f1(S.m1) + ' kg · v = ' + f2(Math.abs(S.cv1)) + ' m/s', 'bl-lead').vis(true);
        lab.b.pos(G.c2.position.x, 2.6, 0).set('B · ' + f1(S.m2) + ' kg · v = ' + f2(Math.abs(S.cv2)) + ' m/s', 'bl-pos').vis(true);
        lab.c.pos(0, 4, 0).set(comp ? 'F(A on B) = −F(B on A) = 12 N' : 'm·v: ' + f2(S.m1 * Math.abs(S.cv1)) + ' = ' + f2(S.m2 * Math.abs(S.cv2)) + ' kg·m/s', 'bl-warn').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.m && u.m.set(S.m); u.F && u.F.set(S.F); u.surf && u.surf.set(S.surf); u.pl && u.pl.set(S.pl); u.k && u.k.set(S.k); } },
    hud: function () { return { eq: { chip: 'ΣF', name: { mesa: 'Box on the table', resorte: 'Spring balance', carros: 'Action and reaction' }[S.mode], body: '<div class="eqline"><small>2nd law</small>ΣF = m·a</div><div class="eqline"><small>Weight</small>W = m·g</div><div class="eqline"><small>Hooke</small>F = k·x</div><div class="eqline"><small>Friction</small>f ≤ μ·N</div>' }, legend: [{ label: 'Purple', color: '#845ef7', text: 'weight' }, { label: 'Green', color: '#51cf66', text: 'normal / elastic' }, { label: 'Blue', color: '#1c7ed6', text: 'applied force' }, { label: 'Red', color: '#ff6b6b', text: 'friction' }] }; },
    measures: function () {
      if (S.mode === 'resorte') return [['Body', PLAN[S.pl].n + ' (g = ' + f2(g()) + ' m/s²)'], ['Mass', f1(S.m) + ' kg'], ['Weight', f1(S.m * g()) + ' N'], ['Constant k', fmt(S.k, 0) + ' N/m'], ['Stretch', f2(S.m * g() / S.k * 100) + ' cm']];
      if (S.mode === 'carros') return [['Masses', f1(S.m1) + ' kg / ' + f1(S.m2) + ' kg'], ['Mutual force', '12 N'], ['Accelerations', f2(12 / S.m1) + ' / ' + f2(12 / S.m2) + ' m/s²'], ['Final speeds', f2(Math.abs(S.cv1)) + ' / ' + f2(Math.abs(S.cv2)) + ' m/s']];
      return [['Mass', f1(S.m) + ' kg'], ['Weight = Normal', f1(N()) + ' N'], ['Applied force', f1(S.F) + ' N'], ['Max. static friction', f1(SURF[S.surf].ms * N()) + ' N'], ['Current friction', f1(fric()) + ' N'], ['Net force', f1(moving() ? S.F - SURF[S.surf].mk * N() : 0) + ' N'], ['Acceleration', f2(acc()) + ' m/s²'], ['Velocity', f2(S.v) + ' m/s']];
    },
    ideas: ['1st law: with no net force, velocity does not change.', '2nd law: <b>ΣF = m·a</b>.', '3rd law: equal and opposite forces on different bodies.', 'Weight <b>W = m·g</b>; mass does not change from one body to another.', 'Hooke: <b>F = k·x</b>.', 'Friction: static ≤ μₛN; kinetic = μ_kN.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experiment'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Set-up', cols: 3, value: S.mode, options: [{ v: 'mesa', label: 'Box and friction' }, { v: 'resorte', label: 'Spring' }, { v: 'carros', label: 'Two carts' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.x = 0; S.v = 0; S.ct = 0; } }); c.appendChild(ui.mode);
      ui.m = kit.ui.slider({ label: 'Mass (kg)', min: 0.5, max: 12, step: 0.5, value: S.m, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.F = kit.ui.slider({ label: 'Applied force (N)', min: 0, max: 100, step: 1, value: S.F, digits: 0, onInput: function (v) { ctx.goManual(); S.F = v; } });
      ui.k = kit.ui.slider({ label: 'Spring constant k (N/m)', min: 20, max: 300, step: 10, value: S.k, digits: 0, onInput: function (v) { ctx.goManual(); S.k = v; } });
      c.appendChild(kit.ui.sliders([ui.m, ui.F, ui.k]));
      ui.surf = kit.ui.options({ label: 'Surface', cols: 3, value: S.surf, options: Object.keys(SURF).map(function (k) { return { v: k, label: SURF[k].n, sub: 'μₛ ' + f2(SURF[k].ms) }; }), onChange: function (v) { ctx.goManual(); S.surf = v; } }); c.appendChild(ui.surf);
      ui.pl = kit.ui.options({ label: 'Gravity', cols: 2, value: S.pl, options: Object.keys(PLAN).map(function (k) { return { v: k, label: PLAN[k].n, sub: 'g = ' + f2(PLAN[k].g) + ' m/s²' }; }), onChange: function (v) { ctx.goManual(); S.pl = v; } }); c.appendChild(ui.pl);
      var c2 = kit.ui.card('Carts (3rd law)'); el.appendChild(c2);
      ui.m1 = kit.ui.slider({ label: 'Mass of cart A (kg)', min: 1, max: 8, step: 0.5, value: S.m1, onInput: function (v) { ctx.goManual(); S.m1 = v; S.mode = 'carros'; S.ct = 0; } });
      ui.m2 = kit.ui.slider({ label: 'Mass of cart B (kg)', min: 1, max: 8, step: 0.5, value: S.m2, onInput: function (v) { ctx.goManual(); S.m2 = v; S.mode = 'carros'; S.ct = 0; } });
      c2.appendChild(kit.ui.sliders([ui.m1, ui.m2]));
      el.appendChild(ctx.btnRow([{ t: 'Reset', primary: true, fn: function () { ctx.goManual(); S.x = 0; S.v = 0; S.ct = 0; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Friction against applied force', h: 220, note: 'Sloping part: static friction (equal to F). Past μₛN the box slides and friction drops to μ_kN.', draw: function (cx, w, h, col) {
        var Lm = 44, R = 10, Tp = 10, B = 28, pw = w - Lm - R, ph = h - Tp - B, n = N(), s = SURF[S.surf], Fm = Math.max(10, 1.6 * s.ms * n), sx = function (F) { return Lm + pw * F / Fm; }, sy = function (y) { return Tp + ph - ph * y / Fm; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var y = Fm * i / 4; cx.beginPath(); cx.moveTo(Lm, sy(y)); cx.lineTo(Lm + pw, sy(y)); cx.stroke(); cx.fillText(fmt(y, 0), Lm - 5, sy(y) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(Fm * i / 4, 0), sx(Fm * i / 4), h - B + 13); cx.fillText('applied F (N)  ·  friction (N)', Lm + pw / 2, h - 3);
        cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(s.ms * n), sy(s.ms * n)); cx.lineTo(sx(s.ms * n), sy(s.mk * n)); cx.lineTo(sx(Fm), sy(s.mk * n)); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#1c7ed6'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(Math.min(S.F, Fm)), sy(fric()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Hooke’s law: force against stretch', h: 210, note: 'Straight line of slope k. The dot is the spring’s current state.', draw: function (cx, w, h, col) {
        var Lm = 44, R = 10, Tp = 10, B = 28, pw = w - Lm - R, ph = h - Tp - B, xm = 0.6, Fm = 300 * xm, sx = function (x) { return Lm + pw * x / xm; }, sy = function (F) { return Tp + ph - ph * Math.min(F, Fm) / Fm; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 3; i++) { cx.beginPath(); cx.moveTo(Lm, sy(Fm * i / 3)); cx.lineTo(Lm + pw, sy(Fm * i / 3)); cx.stroke(); cx.fillText(fmt(Fm * i / 3, 0), Lm - 5, sy(Fm * i / 3) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 6; i++) cx.fillText(fmt(xm * i / 6 * 100, 0), sx(xm * i / 6), h - B + 13); cx.fillText('x (cm)  ·  F (N)', Lm + pw / 2, h - 3);
        cx.strokeStyle = '#51cf66'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(Math.min(xm, Fm / S.k)), sy(S.k * Math.min(xm, Fm / S.k))); cx.stroke(); cx.lineWidth = 1;
        var x = S.m * g() / S.k; if (x <= xm) { cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(x), sy(S.m * g()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; }
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, s = SURF[S.surf], n = N();
      if (S.mode === 'resorte') return '<div class="card-kicker">Spring balance · ' + PLAN[S.pl].n + '</div><table class="calc-table">' + row('Weight', 'P = m·g = ' + f1(S.m) + ' · ' + f2(g()) + ' = <b>' + f1(S.m * g()) + ' N</b>') + row('Balance', 'k·x = W → x = ' + f1(S.m * g()) + ' / ' + fmt(S.k, 0) + ' = <b>' + f2(S.m * g() / S.k * 100) + ' cm</b>') + '</table>';
      if (S.mode === 'carros') return '<div class="card-kicker">Third law</div><table class="calc-table">' + row('Forces', 'F(A→B) = −F(B→A) = 12 N') + row('Accelerations', 'a_A = 12/' + f1(S.m1) + ' = <b>' + f2(12 / S.m1) + '</b> · a_B = 12/' + f1(S.m2) + ' = <b>' + f2(12 / S.m2) + ' m/s²</b>') + row('After 0.5 s of pushing', 'm_A·v_A = m_B·v_B = <b>' + f2(6) + ' kg·m/s</b>') + '</table>';
      return '<div class="card-kicker">Box · ' + s.n + '</div><div class="calc-step">1 · Vertical forces</div><table class="calc-table">' + row('Weight', 'W = m·g = <b>' + f1(n) + ' N</b>') + row('Normal', 'N = W = <b>' + f1(n) + ' N</b> (no vertical acceleration)') + '</table>' +
        '<div class="calc-step">2 · Friction</div><table class="calc-table">' + row('Maximum static', 'μₛ·N = ' + f2(s.ms) + ' · ' + f1(n) + ' = <b>' + f1(s.ms * n) + ' N</b>') + row('Kinetic', 'μ_k·N = ' + f2(s.mk) + ' · ' + f1(n) + ' = <b>' + f1(s.mk * n) + ' N</b>') + row('Does it move?', S.F > s.ms * n || S.v > 0 ? 'Yes: F = ' + f1(S.F) + ' N overcomes friction' : 'No: F = ' + f1(S.F) + ' N ≤ ' + f1(s.ms * n) + ' N') + '</table>' +
        '<div class="calc-step">3 · Second law</div><table class="calc-table">' + row('ΣF', moving() ? f1(S.F) + ' − ' + f1(s.mk * n) + ' = <b>' + f1(S.F - s.mk * n) + ' N</b>' : '0 N') + row('a = ΣF/m', '<b>' + f2(acc()) + ' m/s²</b>') + '</table>';
    },
    quiz: [
      { q: 'A book rests on the table. The net force on it is…', options: ['zero', 'equal to its weight', 'equal to the normal force', 'downwards'], answer: 0, why: 'Weight and normal force balance: it does not accelerate.' },
      { q: 'A 70 kg astronaut travels to the Moon. There, the astronaut’s mass…', options: ['is still 70 kg', 'is 6 times smaller', 'is zero', 'increases'], answer: 0, why: 'Mass does not depend on location; weight does (W = m·g).' },
      { q: 'A spring with k = 200 N/m holds 20 N. How much does it stretch?', options: ['10 cm', '4000 cm', '1 cm', '20 cm'], answer: 0, why: 'x = F/k = 20/200 = 0.1 m.' },
      { q: 'You push a piece of furniture that does not move. Static friction is…', options: ['equal to your force', 'greater than your force', 'zero', 'equal to the weight'], answer: 0, why: 'While it does not slide, static friction equals the applied force.' },
      { q: 'A net force of 20 N acts on 4 kg. The acceleration is…', options: ['5 m/s²', '80 m/s²', '0.2 m/s²', '24 m/s²'], answer: 0, why: 'a = F/m = 20/4.' },
      { q: 'With the same net force, if the mass doubles the acceleration…', options: ['halves', 'doubles', 'does not change', 'quadruples'], answer: 0, why: 'a = F/m.' },
      { q: 'A truck crashes into a car. The force of the truck on the car is…', options: ['equal to that of the car on the truck', 'greater', 'smaller', 'zero'], answer: 0, why: 'Third law: the pair of forces has equal magnitude.' },
      { q: 'Why is it harder to start sliding than to keep sliding?', options: ['μₛ is greater than μ_k', 'the mass decreases when moving', 'the weight changes', 'the normal force disappears'], answer: 0, why: 'Maximum static friction exceeds kinetic friction.' }
    ],
    help: { intro: 'Choose a set-up in «Lab»: box with friction, spring (spring balance) or two carts pushing apart. Turn on the forces layer to see the free-body diagram.', items: [['Arrows', 'purple: weight; green: normal or elastic force; blue: applied force; red: friction.'], ['Surface', 'changes the friction coefficients μₛ and μ_k.'], ['Gravity', 'compares the weight of the same mass on different bodies.']], try: ['Raise the force little by little: at what value does the box start to slide?', 'Take the spring to the Moon: how much does it stretch now?', 'Make one cart twice as heavy as the other and compare their speeds.'] }
  };
  MSim.create(def);
})();
