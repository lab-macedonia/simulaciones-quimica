/* Circuitos eléctricos en serie y en paralelo — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var S = { mode: 'series', n: 2, V: 6, R: 10, on: true, broken: false, ph: 0 };
  var G = {}, lab = {}, bulbs = [], dots = [], wires = [], XL = -3.2, XR = 3.6, YB = 0, YT = 3.2;
  function Req() { if (S.mode === 'series') return S.n * S.R; return S.R / Math.max(1, S.n - (S.broken ? 1 : 0)); }
  function Itot() { if (!S.on) return 0; if (S.mode === 'series' && S.broken) return 0; if (S.mode === 'parallel' && S.broken && S.n === 1) return 0; return S.V / Req(); }
  function Ib(k) { if (!S.on) return 0; if (S.mode === 'series') return S.broken ? 0 : Itot(); return (S.broken && k === 0) ? 0 : S.V / S.R; }
  function Vb(k) { if (S.mode === 'series') return S.broken ? (k === 0 ? (S.on ? S.V : 0) : 0) : Ib(k) * S.R; return S.on ? S.V : 0; }
  function Pb(k) { return Ib(k) * Ib(k) * S.R; }
  function bulbPos(k) { if (S.mode === 'series') { var xs = S.n === 1 ? [0.6] : S.n === 2 ? [-0.4, 1.8] : [-1.2, 0.6, 2.4]; return new T.Vector3(xs[k], YT, 0); } var xb = [-1.2, 0.6, 2.4]; return new T.Vector3(xb[k], (YB + YT) / 2, 0); }
  function paths() {
    var P = [], c = function (x, y) { return new T.Vector3(x, y, 0); };
    if (S.mode === 'series') P.push({ pts: [c(XL, YB), c(XL, YT), c(XR, YT), c(XR, YB), c(XL, YB)], I: Itot() });
    else for (var k = 0; k < S.n; k++) { var x = bulbPos(k).x; P.push({ pts: [c(XL, YB), c(XL, YT), c(x, YT), c(x, YB), c(XL, YB)], I: Ib(k) }); }
    return P;
  }
  function along(pts, u) { var L = 0, seg = [], i; for (i = 1; i < pts.length; i++) { var d = pts[i].distanceTo(pts[i - 1]); seg.push(d); L += d; } var s = ((u % 1) + 1) % 1 * L; for (i = 0; i < seg.length; i++) { if (s <= seg[i]) return pts[i].clone().lerp(pts[i + 1], s / seg[i]); s -= seg[i]; } return pts[0].clone(); }
  function stages() {
    return [
      ['Simple circuit', 'Circuit', 'Current flows only if the circuit is closed',
        '<p>An <b>electric circuit</b> has a <b>source</b> (cell or battery), <b>conductors</b> (wires), a <b>load</b> (bulb) and a <b>switch</b>. Only when the circuit is <b>closed</b> does <b>electric current</b> flow: a stream of electrons (blue dots) driven by the cell. Opening the switch stops the current in the whole circuit.</p>'],
      ['Ohm’s law', 'Ohm', 'I = V/R: more voltage, more current; more resistance, less current',
        '<p><b>Voltage</b> V (volt) is the cell’s «push»; <b>resistance</b> R (ohm, Ω) is the opposition of the load; <b>current</b> I (ampere, A) is the charge passing per second. They are related by <b>Ohm’s law</b>: <b>I = V/R</b>. Raising the voltage increases the current and the bulb glows brighter.</p>'],
      ['Series circuit', 'Series', 'A single path: the same current flows through every bulb',
        '<p>In <b>series</b> the loads are one after another: there is a <b>single path</b> and the <b>same current</b> flows through all of them. Resistances add up, <b>R<sub>eq</sub> = R₁ + R₂ + …</b>, and the cell’s voltage is <b>shared</b> among them. With more bulbs the current decreases and they all glow less.</p>'],
      ['Parallel circuit', 'Parallel', 'Several paths: each bulb gets the full voltage',
        '<p>In <b>parallel</b> each load is on its own <b>branch</b>, connected directly to the cell: they all get the <b>same voltage</b> and glow as if they were alone. The total current is the <b>sum</b> of the branch currents and the equivalent resistance is <b>smaller</b> than that of each load: 1/R<sub>eq</sub> = 1/R₁ + 1/R₂ + …</p>'],
      ['If a bulb burns out', 'Burnt out', 'In series they all go out; in parallel the others stay on',
        '<p>If a bulb <b>burns out</b>, its filament breaks. In <b>series</b> the only path is opened and <b>they all go out</b>. In <b>parallel</b> only that branch is broken and <b>the others keep working</b>. That is why home wiring is connected in parallel: each appliance works independently.</p>'],
      ['Electric power', 'Power', 'P = V·I: the energy a load uses every second',
        '<p><b>Electric power</b> is <b>P = V·I</b> (watt). A bulb glows brighter the greater its power. The energy used is <b>E = P·t</b>; electricity bills measure it in <b>kilowatt-hours</b> (kWh). Compare: three bulbs in parallel use 9 times more than three in series with the same cell.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.R = 10; S.broken = false;
    if (i === 0) { S.mode = 'series'; S.n = 1; S.V = 6; S.on = l > 0.25 && !(l > 0.6 && l < 0.8); }
    else if (i === 1) { S.mode = 'series'; S.n = 1; S.on = true; S.V = 1.5 + 10.5 * l; }
    else if (i === 2) { S.mode = 'series'; S.on = true; S.V = 6; S.n = l < 0.33 ? 1 : l < 0.66 ? 2 : 3; }
    else if (i === 3) { S.mode = 'parallel'; S.on = true; S.V = 6; S.n = l < 0.33 ? 1 : l < 0.66 ? 2 : 3; }
    else if (i === 4) { S.on = true; S.V = 6; S.n = 3; S.mode = l < 0.5 ? 'series' : 'parallel'; S.broken = (l % 0.5) > 0.2; }
    else { S.on = true; S.V = 6; S.n = 3; S.mode = l < 0.5 ? 'series' : 'parallel'; }
  }
  function cyl(a, b, r, c) { var d = b.clone().sub(a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), new T.MeshStandardMaterial({ color: c, roughness: 0.5 })); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; }
  function rebuild() {
    wires.forEach(function (w) { G.root.remove(w); }); wires = [];
    var V = function (x, y) { return new T.Vector3(x, y, 0); }, add = function (a, b) { var w = cyl(a, b, 0.06, 0xd9480f); G.root.add(w); wires.push(w); };
    add(V(XL, YB), V(XL, YT));
    if (S.mode === 'series') { add(V(XL, YT), V(XR, YT)); add(V(XR, YT), V(XR, YB)); add(V(XR, YB), V(XL, YB)); }
    else { var xm = bulbPos(S.n - 1).x; add(V(XL, YT), V(xm, YT)); add(V(XL, YB), V(xm, YB)); for (var k = 0; k < S.n; k++) { var x = bulbPos(k).x; add(V(x, YT), V(x, YB)); } }
    G.key = S.mode + S.n;
  }
  var def = {
    key: 'circuitos', title: 'Series and parallel electric circuits', subtitle: '3D simulator · physics', accent: { dark: '#ffa94d', light: '#d9480f' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.2, 4, 11], target: [-1.2, 2.2, 0] }, { id: 'frontal', label: 'Front', pos: [-1.2, 2.2, 11.5], target: [-1.2, 2, 0] }],
    layers: [{ id: 'e', label: 'Moving electrons', icon: '•' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      var board = new T.Mesh(new T.BoxGeometry(8.6, 5.4, 0.2), new T.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.9 })); board.position.set(0.2, 1.6, -0.3); s.add(board);
      G.bat = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.6, 20), new T.MeshStandardMaterial({ color: 0x1c7ed6, roughness: 0.4 })); G.bat.position.set(XL, (YB + YT) / 2, 0); s.add(G.bat);
      var tip = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.2, 12), new T.MeshStandardMaterial({ color: 0xced4da })); tip.position.set(XL, (YB + YT) / 2 + 0.9, 0); s.add(tip);
      G.sw = new T.Mesh(new T.BoxGeometry(0.9, 0.08, 0.12), new T.MeshStandardMaterial({ color: 0xf8f9fa })); s.add(G.sw);
      for (var k = 0; k < 3; k++) {
        var g = new T.Group(), glass = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), new T.MeshStandardMaterial({ color: 0xe9ecef, emissive: 0xffc61a, emissiveIntensity: 0, transparent: true, opacity: 0.9 })), base = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.3, 12), new T.MeshStandardMaterial({ color: 0xadb5bd }));
        base.position.y = -0.45; g.add(glass); g.add(base); s.add(g); bulbs.push({ g: g, m: glass });
      }
      var dg = new T.SphereGeometry(0.07, 8, 6), dm = new T.MeshStandardMaterial({ color: 0x74c0fc, emissive: 0x1c4a7a });
      for (k = 0; k < 66; k++) { var d = new T.Mesh(dg, dm); d.visible = false; s.add(d); dots.push(d); }
      ['bat', 'b0', 'b1', 'b2', 'tot'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
      rebuild();
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      if (G.key !== S.mode + S.n) rebuild();
      S.ph += dt;
      var swx = S.mode === 'series' ? 0.6 : -2.2; G.sw.position.set(swx, YB + (S.on ? 0 : 0.25), 0.05); G.sw.rotation.z = S.on ? 0 : 0.5;
      for (var k = 0; k < 3; k++) {
        var b = bulbs[k], vis = k < S.n; b.g.visible = vis; if (!vis) { lab['b' + k].vis(false); continue; }
        var p = bulbPos(k); b.g.position.copy(p); var P = Pb(k), br = clamp(P / 3.6, 0, 1.6);
        b.m.material.emissiveIntensity = br; b.m.material.color.setHex(S.broken && k === 0 ? 0x868e96 : 0xe9ecef);
        lab['b' + k].pos(p.x, p.y + (S.mode === 'series' ? 0.95 : 0.8) + (k % 2) * 0.65, 0.3).set((S.broken && k === 0 ? 'Burnt out · ' : '') + f1(Vb(k)) + ' V · ' + f2(Ib(k)) + ' A · ' + f2(P) + ' W', S.broken && k === 0 ? 'bl-warn' : 'bl-pos').vis(true);
      }
      lab.bat.pos(XL, YT + 0.8, 0).set('Cell ' + f1(S.V) + ' V', 'bl-lead').vis(true);
      lab.tot.pos(0.4, -0.9, 0).set(S.on ? 'Total I = ' + f2(Itot()) + ' A · R eq = ' + f1(S.mode === 'series' && S.broken ? Infinity : Req()) + ' Ω' : 'Open circuit: I = 0', S.on ? 'bl-d' : 'bl-warn').vis(true);
      // electrones
      var on = ctx.layer('e'), P = paths(), used = 0;
      P.forEach(function (pa, j) { var nd = Math.floor(66 / P.length); for (var q = 0; q < nd; q++) { var d = dots[used++]; if (!on || pa.I <= 0) { d.visible = false; continue; } d.visible = true; d.position.copy(along(pa.pts, q / nd - S.ph * pa.I * 0.25 + j * 0.013)); d.position.z = 0.12; } });
      for (; used < dots.length; used++) dots[used].visible = false;
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.n && u.n.set(S.n); u.V && u.V.set(S.V); u.R && u.R.set(S.R); } },
    hud: function () { return { eq: { chip: 'Ω', name: S.mode === 'series' ? 'Series circuit' : 'Parallel circuit', body: '<div class="eqline"><small>Ohm</small>I = V / R</div><div class="eqline"><small>Series</small>R = R₁ + R₂ + …</div><div class="eqline"><small>Parallel</small>1/R = 1/R₁ + 1/R₂ + …</div><div class="eqline"><small>Power</small>P = V·I</div>' }, legend: [{ label: 'Blue dots', color: '#74c0fc', text: 'electrons (their speed shows the current)' }, { label: 'Brightness', color: '#ffd43b', text: 'power of each bulb' }] }; },
    measures: function () { var r = [['Connection', S.mode === 'series' ? 'series' : 'parallel'], ['Cell voltage', f1(S.V) + ' V'], ['Bulbs', S.n + ' × ' + f1(S.R) + ' Ω'], ['Equivalent R', S.mode === 'series' && S.broken ? '∞ (open)' : f2(Req()) + ' Ω'], ['Total current', f2(Itot()) + ' A'], ['Total power', f2(Itot() * (S.on ? S.V : 0)) + ' W']]; return r; },
    ideas: ['No closed circuit, no current.', '<b>I = V/R</b> (Ohm’s law).', 'Series: same current; resistances add; voltage is shared.', 'Parallel: same voltage; currents add.', 'Homes are wired in parallel.', '<b>P = V·I</b>; energy E = P·t (kWh).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Circuit'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Connection', cols: 2, value: S.mode, options: [{ v: 'series', label: 'Series' }, { v: 'parallel', label: 'Parallel' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.n = kit.ui.options({ label: 'Number of bulbs', cols: 3, value: S.n, options: [{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }], onChange: function (v) { ctx.goManual(); S.n = +v; } }); c.appendChild(ui.n);
      ui.V = kit.ui.slider({ label: 'Cell voltage (V)', min: 1.5, max: 12, step: 0.5, value: S.V, onInput: function (v) { ctx.goManual(); S.V = v; } });
      ui.R = kit.ui.slider({ label: 'Resistance of each bulb (Ω)', min: 2, max: 30, step: 1, value: S.R, digits: 0, onInput: function (v) { ctx.goManual(); S.R = v; } });
      c.appendChild(kit.ui.sliders([ui.V, ui.R]));
      el.appendChild(ctx.btnRow([{ t: 'Open / close switch', primary: true, fn: function () { ctx.goManual(); S.on = !S.on; } }, { t: 'Burn out / repair bulb 1', fn: function () { ctx.goManual(); S.broken = !S.broken; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Ohm’s law: current against voltage', h: 220, note: 'Straight line of slope 1/R<sub>eq</sub>. Series (more resistance): a flatter line; parallel: a steeper one.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Im = 12 / (S.R / 3), sx = function (v) { return L + pw * v / 12; }, sy = function (i) { return Tp + ph - ph * Math.min(i, Im) / Im; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(Im * i / 4)); cx.lineTo(L + pw, sy(Im * i / 4)); cx.stroke(); cx.fillText(fmt(Im * i / 4, 1), L - 5, sy(Im * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 12; i += 3) cx.fillText(i, sx(i), h - B + 13); cx.fillText('V (V)  ·  I (A)', L + pw / 2, h - 3);
        [['series', '#4dabf7'], ['parallel', '#ff922b']].forEach(function (q) { var Re = q[0] === 'series' ? S.n * S.R : S.R / S.n; cx.strokeStyle = q[1]; cx.lineWidth = q[0] === S.mode ? 3 : 1.5; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(12), sy(12 / Re)); cx.stroke(); }); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.V), sy(Itot()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Power of each bulb', h: 190, note: 'Brightness depends on the power P = V·I = I²·R.', draw: function (cx, w, h, col) {
        var Pm = Math.max(1, S.V * S.V / S.R), bw = (w - 60) / 3; cx.font = '11px system-ui'; cx.textAlign = 'center';
        for (var k = 0; k < 3; k++) { var P = k < S.n ? Pb(k) : 0, bh = (h - 50) * P / Pm, x = 30 + k * bw + bw * 0.15; cx.fillStyle = k < S.n ? '#fab005' : 'rgba(127,127,127,.2)'; cx.fillRect(x, h - 26 - bh, bw * 0.7, bh); cx.fillStyle = col.ink; cx.fillText((k + 1) + ' · ' + fmt(P, 2) + ' W', x + bw * 0.35, h - 10); }
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, R = S.R, n = S.n;
      var h = '<div class="card-kicker">' + (S.mode === 'series' ? 'Series' : 'Parallel') + ' · ' + n + ' × ' + f1(R) + ' Ω · ' + f1(S.V) + ' V</div><div class="calc-step">1 · Equivalent resistance</div><table class="calc-table">' +
        row('R eq', S.mode === 'series' ? n + ' · ' + f1(R) + ' = <b>' + f1(n * R) + ' Ω</b>' : f1(R) + ' / ' + n + ' = <b>' + f2(R / n) + ' Ω</b>') + '</table>' +
        '<div class="calc-step">2 · Currents and voltages</div><table class="calc-table">' + row('I total = V/R eq', '<b>' + f2(S.V / (S.mode === 'series' ? n * R : R / n)) + ' A</b>') +
        row('Each bulb', S.mode === 'series' ? 'I = ' + f2(S.V / (n * R)) + ' A · V = ' + f2(S.V / n) + ' V' : 'V = ' + f1(S.V) + ' V · I = ' + f2(S.V / R) + ' A') + '</table>' +
        '<div class="calc-step">3 · Power</div><table class="calc-table">' + row('Each bulb', 'P = ' + f2(S.mode === 'series' ? Math.pow(S.V / (n * R), 2) * R : S.V * S.V / R) + ' W') + row('Total', '<b>' + f2(S.mode === 'series' ? S.V * S.V / (n * R) : n * S.V * S.V / R) + ' W</b>') + '</table>';
      return h;
    },
    quiz: [
      { q: 'For current to flow, the circuit must be…', options: ['closed', 'open', 'cut', 'without a cell'], answer: 0, why: 'Electrons need a complete path.' },
      { q: 'A 12 Ω bulb connected to 6 V carries a current of…', options: ['0.5 A', '2 A', '72 A', '18 A'], answer: 0, why: 'I = V/R = 6/12.' },
      { q: 'In a series circuit, the current…', options: ['is the same in every load', 'is shared among the branches', 'is greater in the first one', 'is zero in the last one'], answer: 0, why: 'There is only one path.' },
      { q: 'In a parallel circuit, each load receives…', options: ['the full cell voltage', 'part of the voltage', 'the same current as the total', 'no voltage'], answer: 0, why: 'Each branch is connected directly to the cell.' },
      { q: 'Three 10 Ω resistors in series are equivalent to…', options: ['30 Ω', '10 Ω', '3.3 Ω', '1000 Ω'], answer: 0, why: 'In series they add up.' },
      { q: 'Two 10 Ω resistors in parallel are equivalent to…', options: ['5 Ω', '20 Ω', '10 Ω', '100 Ω'], answer: 0, why: '1/R = 1/10 + 1/10 → R = 5 Ω.' },
      { q: 'At home a bulb burns out and the others stay on. The wiring is in…', options: ['parallel', 'series', 'short circuit', 'no connection'], answer: 0, why: 'In parallel each branch is independent.' },
      { q: 'A 2000 W kettle connected to 220 V draws a current of…', options: ['≈ 9.1 A', '≈ 0,11 A', '440 A', '2220 A'], answer: 0, why: 'I = P/V = 2000/220.' }
    ],
    help: { intro: 'In «Lab» choose the connection (series or parallel), the number of bulbs, the voltage and the resistance. Open the switch or burn out a bulb to see what happens.', items: [['Electrons', 'blue dots; they move faster where there is more current.'], ['Brightness', 'proportional to the power of each bulb.'], ['Labels', 'voltage, current and power of each bulb.']], try: ['Add bulbs in series: what happens to the brightness?', 'Do the same in parallel and compare the total current.', 'Burn out bulb 1 in each type of circuit.'] }
  };
  MSim.create(def);
})();
