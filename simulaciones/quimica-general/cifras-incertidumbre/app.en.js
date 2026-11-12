/* Cifras significativas e incertidumbre — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var IN = { bur: { n: "Burette 50 mL", u: 0.02, d: 2, un: 'mL', max: 50 }, pip: { n: "Graduated pipette 10 mL", u: 0.05, d: 2, un: 'mL', max: 10 }, prob: { n: "Graduated cylinder 100 mL", u: 0.5, d: 0, un: 'mL', max: 100 }, ban: { n: "Analytical balance", u: 0.0001, d: 4, un: 'g', max: 100 }, bag: { n: "Triple-beam balance", u: 0.01, d: 2, un: 'g', max: 100 } };
  var S = { bias: 0, sig: 0.6, n: 12, seed: 1, ins: 'bur', val: 23.45, a: 12.3456, sa: 4, b: 3.14159, sb: 3, p: 0 }, lab = [], g = null, shots = [], tgt = null, meas = null;
  function rnd(i) { var x = Math.sin((i + S.seed * 31) * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function gauss(i) { var u = Math.max(1e-6, rnd(2 * i)), v = rnd(2 * i + 1); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function pts() { var a = []; for (var i = 0; i < S.n; i++) a.push({ x: S.bias * 0.7071 + S.sig * gauss(i), y: S.bias * 0.7071 + S.sig * gauss(i + 100) }); return a; }
  function stats() { var p = pts(), n = p.length, mx = 0, my = 0; p.forEach(function (q) { mx += q.x; my += q.y; }); mx /= n; my /= n; var s = 0; p.forEach(function (q) { s += Math.pow(q.x - mx, 2) + Math.pow(q.y - my, 2); }); return { mx: mx, my: my, sd: Math.sqrt(s / (n - 1) / 2), off: Math.hypot(mx, my) }; }
  function sf(x, n) { if (x === 0) return 0; var d = n - Math.floor(Math.log10(Math.abs(x))) - 1, f = Math.pow(10, d); return Math.round(x * f) / f; }
  function sfStr(x, n) { var r = sf(x, n), d = Math.max(0, n - Math.floor(Math.log10(Math.abs(r))) - 1); return fmt(r, d); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ["Accuracy and precision", "Accuracy", "Accuracy: close to the true value. Precision: results close to each other",
        "<p><b>Accuracy</b> indicates how close the average is to the <b>true value</b>; <b>precision</b>, how close repeated measurements are to each other. <b>Systematic error</b> (bias) affects accuracy; <b>random error</b> (scatter) affects precision. On the target, the center is the true value. Move “Bias” and “Scatter” to see the four combinations.</p>"],
      ["Instruments and uncertainty", "Instruments", "Each instrument has an uncertainty: the reading is written to that decimal place",
        "<p>Every instrument has a <b>reading uncertainty</b>: burette ±0.02 mL, graduated cylinder ±0.5 mL, analytical balance ±0.0001 g. A measurement is written as <b>value ± uncertainty</b>, with the <b>last decimal</b> of the value matching that of the uncertainty. The <b>relative uncertainty</b> u/value indicates the quality: the same error weighs less in large volumes.</p>"],
      ["Significant figures", "Sig. figs.", "All the certain digits plus the first uncertain one",
        "<p><b>Significant figures</b> are the certain digits plus the first doubtful one. Rules: nonzero digits count; <b>zeros between digits</b> count; <b>leading zeros</b> do not; trailing zeros count if there is a <b>decimal point</b>. In <b>sums and differences</b> the smallest number of <b>decimals</b> rules; in <b>products and quotients</b>, the smallest number of <b>significant figures</b>.</p>"],
      ["Operating with significant figures", "Operations", "Sum: decimals. Product: figures",
        "<p>Define two measurements a and b with different numbers of figures. The <b>sum</b> is rounded to the smallest number of <b>decimals</b> of the addends; the <b>product</b> to the smallest number of <b>significant figures</b>. Round only at the end, not in intermediate steps, so as not to accumulate error.</p>"],
      ["Propagation of uncertainty", "Propagation", "Sum: absolute uncertainties in quadrature. Product: relative ones in quadrature",
        "<p>If a ± u<sub>a</sub> and b ± u<sub>b</sub> (the uncertainty is 1 in the last digit): for <b>s = a + b</b>, <b>u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)</b>; for <b>p = a·b</b>, <b>u<sub>p</sub>/p = √((u<sub>a</sub>/a)² + (u<sub>b</sub>/b)²)</b>. The resulting uncertainty decides how many digits are reported.</p>"]
    ];
  }
  var def = {
    key: 'cifras-incertidumbre', title: "Significant Figures and Uncertainty", subtitle: "3D Simulator · general chemistry", accent: { dark: '#ffa94d', light: '#e67700' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 3, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 20], target: [0, 0, 0] }],
    layers: [{ id: 'shots', label: "Shots", icon: '•' }, { id: 'mean', label: "Average", icon: '✚' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, cols = [0xf1f3f5, 0x212529, 0x4dabf7, 0x212529, 0xff6b6b, 0xf1f3f5];
      tgt = new T.Group(); tgt.position.set(5, 0, 0); g.add(tgt);
      for (i = 5; i >= 1; i--) { var d = new T.Mesh(new T.CylinderGeometry(i * 1.2, i * 1.2, 0.2, 40), mat(cols[5 - i + 0] || 0xffffff, 1)); d.rotation.x = Math.PI / 2; d.position.z = -0.1 * i; tgt.add(d); }
      for (i = 0; i < 40; i++) { var s = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), mat(0xffd43b, 1)); s.position.z = 0.3; tgt.add(s); shots.push(s); }
      meas = new T.Mesh(new T.SphereGeometry(0.35, 14, 10), mat(0x40c057, 1)); tgt.add(meas);
      var bur = new T.Group(); bur.position.set(-8, 0, 0); g.add(bur); g.userData.bur = bur;
      var tube = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 12, 20, 1, true), mat(0xa5d8ff, 0.25)); bur.add(tube);
      var lq = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1, 20), mat(0x74c0fc, 0.7)); bur.add(lq); g.userData.lq = lq;
      for (i = 0; i <= 50; i++) { var tk = new T.Mesh(new T.BoxGeometry(i % 10 === 0 ? 0.8 : (i % 5 === 0 ? 0.55 : 0.35), 0.03, 0.03), mat(0x212529, 1)); tk.position.set(0.9 + 0.1, 6 - i * 12 / 50, 0.55); bur.add(tk); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, st = stats(), p = pts(), ins = IN[S.ins], i = f.i;
      if (!P.manual) { if (i === 0) { S.bias = 3 * Math.abs(Math.sin(f.local * 6.28 * 0.5)); S.sig = 0.3 + 1.6 * Math.abs(Math.cos(f.local * 6.28 * 0.5)); } if (i === 1) { S.ins = ['bur', 'pip', 'prob', 'ban', 'bag'][Math.min(4, Math.floor(f.local * 5))]; } }
      ins = IN[S.ins]; if (!P.manual && i === 1) S.val = ins.max * 0.47;
      var sOn = ctx.layer('shots'), mOn = ctx.layer('mean'), showT = i !== 1 || P.manual;
      tgt.visible = !(!P.manual && i === 1) && !(!P.manual && i >= 2); g.userData.bur.visible = !tgt.visible;
      if (P.manual) { tgt.visible = true; g.userData.bur.visible = true; tgt.position.x = 5; g.userData.bur.position.x = -8; }
      shots.forEach(function (s, j) { s.visible = sOn && j < p.length; if (j < p.length) s.position.set(p[j].x * 1.2, p[j].y * 1.2, 0.3); });
      meas.visible = mOn; meas.position.set(st.mx * 1.2, st.my * 1.2, 0.5);
      var frac = S.val / ins.max; g.userData.lq.scale.y = 12 * (1 - frac) + 0.01; g.userData.lq.position.y = 6 - g.userData.lq.scale.y / 2;
      lab[0].pos(5, 8, 0).set("Accuracy: " + (st.off < 0.6 ? 'alta' : "low") + " · Precision: " + (st.sd < 0.7 ? 'alta' : "low"), (st.off < 0.6 && st.sd < 0.7) ? 'bl-pos' : 'bl-neg').vis(tgt.visible);
      lab[1].pos(5, -8, 0).set("deviation = " + fmt(st.off, 2) + ' · s = ' + fmt(st.sd, 2), 'bl-d').vis(tgt.visible);
      lab[2].pos(-8, 7.8, 0).set(ins.n, 'bl-lead').vis(g.userData.bur.visible);
      lab[3].pos(-8, -7.5, 0).set(fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un, 'bl-d').vis(g.userData.bur.visible);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.bias) u.bias.set(S.bias); if (u.sig) u.sig.set(S.sig); if (u.ins) u.ins.set(S.ins); },
    hud: function () { var st = stats(), ins = IN[S.ins], rel = ins.u / S.val * 100; return { eq: { chip: '±', name: "Measurement and error", body: "<div class=\"eqline\"><small>Measured bias</small>" + fmt(st.off, 2) + "</div><div class=\"eqline\"><small>Scatter s</small>" + fmt(st.sd, 2) + "</div><div class=\"eqline\"><small>Instrument</small>" + ins.n + "</div><div class=\"eqline\"><small>Rel. uncert.</small>" + fmt(rel, 2) + ' %</div>' }, legend: [{ label: "Yellow dots", color: '#ffd43b', text: "repeated measurements" }, { label: "Green dot", color: '#40c057', text: "average" }] }; },
    measures: function () { var st = stats(), ins = IN[S.ins], r = sf(S.a * S.b, Math.min(S.sa, S.sb)); return [["n measurements", String(S.n)], ["Deviation of the average", fmt(st.off, 2)], ["Standard deviation", fmt(st.sd, 2)], ["Reading", fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un], ["a × b reported", sfStr(S.a * S.b, Math.min(S.sa, S.sb))]]; },
    ideas: ["Bias → accuracy; scatter → precision.", "Sum: decimals; product: significant figures.", "Round only at the end.", "relative u = u / value."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Target"); el.appendChild(c);
      ui.bias = kit.ui.slider({ label: "Bias (systematic error)", min: 0, max: 3, step: 0.1, value: S.bias, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.bias = v; } });
      ui.sig = kit.ui.slider({ label: "Scatter (random error)", min: 0.1, max: 2, step: 0.1, value: S.sig, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.sig = v; } });
      var sn = kit.ui.slider({ label: "No. of measurements", min: 3, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      c.appendChild(kit.ui.sliders([ui.bias, ui.sig, sn])); c.appendChild(ctx.btnRow([{ t: "New series", fn: function () { ctx.goManual(); S.seed++; } }]));
      var d = kit.ui.card("Instrument"); el.appendChild(d);
      ui.ins = kit.ui.options({ label: "Instrument", cols: 1, value: S.ins, options: Object.keys(IN).map(function (k) { return { v: k, label: IN[k].n, sub: '± ' + IN[k].u + ' ' + IN[k].un }; }), onChange: function (v) { ctx.goManual(); S.ins = v; S.val = Math.min(S.val, IN[v].max); } }); d.appendChild(ui.ins);
      var sv = kit.ui.slider({ label: "Reading", min: 0, max: 50, step: 0.01, value: S.val, format: function (v) { return fmt(v, IN[S.ins].d) + ' ' + IN[S.ins].un; }, onInput: function (v) { ctx.goManual(); S.val = v; } });
      var sa = kit.ui.slider({ label: "Sig. figs of a (12.3456…)", min: 1, max: 6, step: 1, value: S.sa, format: function (v) { return v + ' → ' + sfStr(S.a, v); }, onInput: function (v) { ctx.goManual(); S.sa = v; } });
      var sb = kit.ui.slider({ label: "Sig. figs of b (3.14159…)", min: 1, max: 6, step: 1, value: S.sb, format: function (v) { return v + ' → ' + sfStr(S.b, v); }, onInput: function (v) { ctx.goManual(); S.sb = v; } });
      d.appendChild(kit.ui.sliders([sv, sa, sb])); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Distribution of the measurements", h: 220, note: "Histogram of the x coordinate. Line: true value (0).", draw: function (cx, w, h, col) {
      var p = pts(), L = 20, Rr = 10, Tp = 12, B = 26, pw = w - L - Rr, ph = h - Tp - B, bins = 16, cnt = [], i; for (i = 0; i < bins; i++) cnt.push(0); p.forEach(function (q) { var k = Math.floor((q.x + 4) / 8 * bins); if (k >= 0 && k < bins) cnt[k]++; });
      var mx = Math.max.apply(0, cnt) || 1; cx.fillStyle = '#4dabf7'; cnt.forEach(function (c, k) { cx.fillRect(L + pw * k / bins + 1, Tp + ph * (1 - c / mx), pw / bins - 2, ph * c / mx); });
      cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L + pw / 2, Tp); cx.lineTo(L + pw / 2, Tp + ph); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('−4', L, h - 8); cx.fillText('0', L + pw / 2, h - 8); cx.fillText('4', L + pw, h - 8);
    } }],
    calc: function () {
      var a = sf(S.a, S.sa), b = sf(S.b, S.sb), da = Math.pow(10, Math.floor(Math.log10(Math.abs(a))) - S.sa + 1), db = Math.pow(10, Math.floor(Math.log10(Math.abs(b))) - S.sb + 1), s = a + b, us = Math.hypot(da, db), pr = a * b, up = pr * Math.hypot(da / a, db / b), dpA = Math.max(0, -Math.floor(Math.log10(da))), dpB = Math.max(0, -Math.floor(Math.log10(db))), dec = Math.min(dpA, dpB), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">a = ' + sfStr(S.a, S.sa) + ' (' + S.sa + ' c.s.) · b = ' + sfStr(S.b, S.sb) + ' (' + S.sb + ' c.s.)</div><table class="calc-table">' + row("a + b (calculator)", fmt(s, 6)) + row("a + b reported", '<b>' + fmt(s, dec) + '</b> (' + dec + " decimals)") + row('u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)', fmt(us, 5)) + row("a · b (calculator)", fmt(pr, 6)) + row("a · b reported", '<b>' + sfStr(pr, Math.min(S.sa, S.sb)) + '</b> (' + Math.min(S.sa, S.sb) + ' c.s.)') + row('u<sub>p</sub>', fmt(up, 5)) + '</table>';
    },
    quiz: [
      { q: "0.00450 has… significant figures.", options: ['3', '5', '6', '2'], answer: 0, why: "4, 5 and the final zero with a decimal point." },
      { q: "In 12.35 + 3.4 the result is reported with…", options: ["1 decimal", "2 decimals", "exactly 3 sig. figs", "4 decimals"], answer: 0, why: "15.75 → 15.8 (3.4 rules)." },
      { q: "In 2.50 × 3.2 the result has…", options: ["2 significant figures", "3 figures", "4 figures", "1 figure"], answer: 0, why: "Smallest number of figures: 2 → 8.0." },
      { q: "A systematic error mainly affects the…", options: ["accuracy", "precision", "statistics", "mass"], answer: 0, why: "It shifts all the measurements." },
      { q: "The 100 mL graduated cylinder (±0.5) versus the burette (±0.02): for 20 mL…", options: ["the burette has the lower relative uncertainty", "equal", "the cylinder is more accurate", "they cannot be compared"], answer: 0, why: '0,02/20 ≪ 0,5/20.' },
      { q: "Zeros to the left of a number…", options: ["are not significant", "are significant", "only if they are even", "depend on the sign"], answer: 0, why: "They only fix the position of the decimal point." }
    ],
    help: { intro: "On the target, move bias and scatter. On the left there is an instrument to read with its uncertainty; in “Calculation” you see sums and products with significant figures.", items: [['Target', 'yellow dots = repeated measurements; green dot = their average; centre = true value.'], ['Controls', '“Bias (systematic error)” shifts every measurement; “Scatter (random error)” spreads them; “No. of measurements” and “New series” generate another batch.'], ['Instrument', '“Instrument” and “Reading” show how many digits can be reported and with what uncertainty.'], ['Calculation', '“Sig. figs of a” and “Sig. figs of b” show how sums and products are rounded.'], ['Chart', '“Distribution of the measurements”.']], try: ['Set high bias and low scatter: precise but inaccurate measurements.', 'Compare the burette with another instrument: the burette has the smaller relative uncertainty.', 'Change the figures of a and b: a sum is limited by decimal places and a product by significant figures.'] }
  };
  MSim.create(def);
})();
