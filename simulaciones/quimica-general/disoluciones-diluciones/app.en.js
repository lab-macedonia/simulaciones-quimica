/* Disoluciones y diluciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SOL = { nacl: { f: 'NaCl', M: 58.44, d: 2.16, c: 0xf1f3f5 }, cuso4: { f: 'CuSO₄', M: 159.61, d: 3.6, c: 0x339af0 }, kmno4: { f: 'KMnO₄', M: 158.03, d: 2.7, c: 0xae3ec9 }, naoh: { f: "NaOH", M: 40.0, d: 2.13, c: 0xe9ecef } };
  var S = { s: 'cuso4', m: 15.96, V: 250, C1: 1.0, V1: 50, V2: 250, cB: 0.2, vB: 150 }, g = null, flask = null, liq = null, dots = [], lab = [], mix = null;
  function M() { return SOL[S.s].M; }
  function C() { return S.m / M() / (S.V / 1000); }
  function Cd() { return S.C1 * S.V1 / S.V2; }
  function mixC() { var a = S.C1 * S.V1 + S.cB * S.vB; return a / (S.V1 + S.vB); }
  function stages() {
    return [
      ["Molarity", "Molarity", "M = moles of solute / liters of solution",
        "<p><b>Molarity</b> is the amount of solute per liter of <b>solution</b>: <b>M = n / V</b>. The solute is weighed, dissolved in some water and <b>made up to the mark</b> in a volumetric flask. Increase the mass of solute and watch the concentration rise and the color intensify.</p>"],
      ["Prepare a solution", "Prepare", "Mass needed = M · V · molar mass",
        "<p>To prepare a volume V at concentration M, weigh <b>m = M · V · M<sub>molar</sub></b> grams. Example: 250 mL of 0.40 M CuSO₄ requires 0.40 × 0.250 × 159.61 = 15.96 g. The final volume is that of the flask, not of the water added.</p>"],
      ["Dilution", "Dilution", "C₁V₁ = C₂V₂: on dilution the volume changes, not the moles",
        "<p>When diluting, solvent is added and the <b>moles of solute do not change</b>: <b>C₁V₁ = C₂V₂</b>. Take an aliquot V₁ of a concentrated solution C₁ and bring it to V₂: the new concentration is C₂ = C₁V₁/V₂. The number of particles is the same, but they are farther apart.</p>"],
      ["Mixing solutions", "Mixture", "Total moles / total volume",
        "<p>When two solutions of the same solute are mixed, the <b>moles add</b> and so do the volumes (approx.): <b>C = (C₁V₁ + C₂V₂) / (V₁ + V₂)</b>. The final concentration lies between the two initial ones.</p>"]
    ];
  }
  function rgb(c, a) { var col = new T.Color(c), w = new T.Color(0xdbeafe); return w.lerp(col, Math.min(1, a)); }
  var def = {
    key: 'disoluciones-diluciones', title: "Solutions and dilutions", subtitle: "3D Simulator · general chemistry", accent: { dark: '#3bc9db', light: '#0b7285' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 5, 22], target: [6, 3, 0] }, { id: 'frontal', label: "Front", pos: [6, 3, 24], target: [6, 3, 0] }],
    layers: [{ id: 'dots', label: "Particles", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      function fl(x) { var G = new T.Group(); G.position.set(x, 0, 0); g.add(G);
        var neck = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 3, 20, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); neck.position.y = 8.5; G.add(neck);
        var bulb = new T.Mesh(new T.SphereGeometry(3, 28, 20), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); bulb.position.y = 3; G.add(bulb);
        var lq = new T.Mesh(new T.SphereGeometry(2.9, 24, 18), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.75 })); lq.position.y = 3; G.add(lq); G.userData.lq = lq; return G; }
      flask = fl(0); mix = fl(8); g.userData.f2 = fl(16);
      for (i = 0; i < 120; i++) { var d = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); flask.add(d); dots.push(d); }
      for (i = 0; i < 120; i++) { var d2 = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); mix.add(d2); dots.push(d2); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.s = 'cuso4'; S.V = 250; S.m = 1 + 39 * f.local; } if (i === 1) { S.s = 'cuso4'; S.V = 250; S.m = 15.96; } if (i === 2) { S.C1 = 1; S.V1 = 50; S.V2 = 50 + 250 * f.local; } if (i === 3) { S.vB = 20 + 280 * f.local; } }
      var s = SOL[S.s], c = C(), on = ctx.layer('dots'), cd = Cd(), cm = mixC(), k;
      var tgt = i === 2 || (P.manual && false);
      flask.userData.lq = flask.children[2]; var sets = [{ g: flask, c: c, n: Math.round(Math.min(120, c * 60)) }, { g: mix, c: i === 2 ? cd : mixC(), n: Math.round(Math.min(120, (i === 2 ? cd : mixC()) * 60)) }];
      flask.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, c / 0.5)));
      mix.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, (i === 2 ? cd : cm) / 0.5)));
      var n1 = sets[0].n, n2 = sets[1].n;
      dots.forEach(function (d, j) { var base = j < 120 ? 0 : 120, idx = j - base, n = base ? n2 : n1; d.visible = on && idx < n; var a = idx * 2.399963, r = 2.2 * Math.cbrt((idx % 37 + 1) / 37); var y = 3 + 2.2 * Math.cos(idx * 0.7) * Math.cbrt(((idx * 7) % 41 + 1) / 41); d.position.set(Math.cos(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5), y - 0.2, Math.sin(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5)); d.material.color.setHex(s.c === 0xf1f3f5 ? 0x1971c2 : 0x212529); });
      var sec = i >= 2;
      mix.visible = sec; g.userData.f2.visible = false; flask.position.x = sec ? 0 : 5; mix.position.x = 9; if (!sec) mix.visible = false;
      lab[0].pos(flask.position.x, 10.5, 0).set(s.f + ' ' + fmt(c, 3) + ' M', 'bl-lead').vis(i !== 2 && i !== 3 || P.manual);
      lab[1].pos(flask.position.x, -1, 0).set(fmt(S.m, 2) + " g in " + fmt(S.V, 0) + ' mL', 'bl-d').vis(!sec);
      lab[2].pos(0, 10.5, 0).set('C₁ = ' + fmt(S.C1, 2) + ' M · V₁ = ' + fmt(S.V1, 0) + ' mL', 'bl-lead').vis(sec);
      lab[3].pos(9, 10.5, 0).set(i === 3 ? 'mezcla: ' + fmt(cm, 3) + ' M' : 'C₂ = ' + fmt(cd, 3) + ' M · V₂ = ' + fmt(S.V2, 0) + ' mL', 'bl-pos').vis(sec);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.s) u.s.set(S.s); if (u.m) u.m.set(S.m); if (u.V) u.V.set(S.V); if (u.C1) u.C1.set(S.C1); if (u.V1) u.V1.set(S.V1); if (u.V2) u.V2.set(S.V2); if (u.cB) u.cB.set(S.cB); if (u.vB) u.vB.set(S.vB); },
    hud: function () { return { eq: { chip: 'M', name: "Concentration", body: "<div class=\"eqline\"><small>n solute</small>" + fmt(S.m / M(), 4) + " mol</div><div class=\"eqline\"><small>Molarity</small>" + fmt(C(), 3) + " M</div><div class=\"eqline\"><small>C₂ (dilution)</small>" + fmt(Cd(), 3) + " M</div><div class=\"eqline\"><small>Mixture</small>" + fmt(mixC(), 3) + ' M</div>' }, legend: [{ label: "Dots", color: '#212529', text: "solute particles" }, { label: "Color", color: '#339af0', text: "more intense = more concentrated" }] }; },
    measures: function () { var s = SOL[S.s]; var pc = S.m / (S.V * 1.0 + S.m) * 100; return [["Solute", s.f], ["Molar mass", fmt(M(), 2) + " g/mol"], ["n solute", fmt(S.m / M(), 4) + ' mol'], ["Molarity", fmt(C(), 3) + ' M'], ['% m/V', fmt(S.m / S.V * 100, 2) + ' %'], ["Dilution C₂", fmt(Cd(), 3) + ' M'], ["Mixture", fmt(mixC(), 3) + ' M']]; },
    ideas: ["M = n / V (of solution).", "Diluting does not change the moles.", 'C₁V₁ = C₂V₂.', "Mixing: sum of moles / total volume."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Prepare a solution"); el.appendChild(c);
      ui.s = kit.ui.options({ label: "Solute", cols: 2, value: S.s, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].f, sub: fmt(SOL[k].M, 1) + " g/mol" }; }), onChange: function (v) { ctx.goManual(); S.s = v; } });
      ui.m = kit.ui.slider({ label: "Mass of solute", min: 0.5, max: 80, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.V = kit.ui.slider({ label: "Flask volume", min: 50, max: 1000, step: 50, value: S.V, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V = v; } });
      c.appendChild(ui.s); c.appendChild(kit.ui.sliders([ui.m, ui.V]));
      var d = kit.ui.card("Dilution (C₁V₁ = C₂V₂)"); el.appendChild(d);
      ui.C1 = kit.ui.slider({ label: 'C₁', min: 0.1, max: 5, step: 0.1, value: S.C1, format: function (v) { return fmt(v, 1) + ' M'; }, onInput: function (v) { ctx.goManual(); S.C1 = v; } });
      ui.V1 = kit.ui.slider({ label: "V₁ (aliquot)", min: 5, max: 200, step: 5, value: S.V1, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V1 = v; } });
      ui.V2 = kit.ui.slider({ label: "V₂ (final volume)", min: 50, max: 1000, step: 10, value: S.V2, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V2 = Math.max(v, S.V1); } });
      ui.cB = kit.ui.slider({ label: "C of the 2nd solution (mixture)", min: 0.05, max: 3, step: 0.05, value: S.cB, format: function (v) { return fmt(v, 2) + ' M'; }, onInput: function (v) { ctx.goManual(); S.cB = v; } });
      ui.vB = kit.ui.slider({ label: "Volume of the 2nd", min: 10, max: 500, step: 10, value: S.vB, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.vB = v; } });
      d.appendChild(kit.ui.sliders([ui.C1, ui.V1, ui.V2, ui.cB, ui.vB])); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Concentration on dilution", h: 220, note: "C₂ = C₁V₁/V₂ for V₂ from V₁ to 1000 mL.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = S.C1; cx.strokeStyle = '#339af0'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var v2 = S.V1 + (1000 - S.V1) * i / 100, c2 = S.C1 * S.V1 / v2, x = L + pw * i / 100, y = Tp + ph * (1 - c2 / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      var px = L + pw * Math.max(0, Math.min(1, (S.V2 - S.V1) / (1000 - S.V1))), py = Tp + ph * (1 - Cd() / mx); cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(px, py, 5, 0, 6.2832); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(fmt(S.V1, 0) + ' mL', L, h - 8); cx.fillText("1000 mL", L + pw, h - 8); cx.textAlign = 'right'; cx.fillText(fmt(mx, 1) + ' M', L - 4, Tp + 8);
    } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, n = S.m / M();
      return '<div class="card-kicker">' + SOL[S.s].f + ' · M = ' + fmt(M(), 2) + " g/mol</div><table class=\"calc-table\">" + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(M(), 2) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row("Molarity", fmt(n, 4) + ' / ' + fmt(S.V / 1000, 3) + ' L = <b>' + fmt(C(), 3) + ' M</b>') + row('C₂ = C₁V₁/V₂', fmt(S.C1, 2) + ' × ' + fmt(S.V1, 0) + ' / ' + fmt(S.V2, 0) + ' = <b>' + fmt(Cd(), 3) + ' M</b>') + row("Dilution factor", '<b>' + fmt(S.V2 / S.V1, 2) + '</b>') + row("Mixture", '(' + fmt(S.C1, 2) + '×' + fmt(S.V1, 0) + ' + ' + fmt(S.cB, 2) + '×' + fmt(S.vB, 0) + ') / ' + fmt(S.V1 + S.vB, 0) + ' = <b>' + fmt(mixC(), 3) + ' M</b>') + '</table>';
    },
    quiz: [
      { q: "How many grams of NaCl (58.44 g/mol) are there in 500 mL of 0.20 M solution?", options: ['5,84 g', '11,7 g', '2,92 g', '58,4 g'], answer: 0, why: '0,20 × 0,500 × 58,44.' },
      { q: "25 mL of 2.0 M HCl are diluted to 100 mL. The final concentration is…", options: ['0,50 M', '8,0 M', '1,0 M', '0,25 M'], answer: 0, why: '2,0 × 25 / 100.' },
      { q: "When a solution is diluted, the moles of solute…", options: ["do not change", "increase", "decrease", "double"], answer: 0, why: "Only solvent is added." },
      { q: "100 mL of 1.0 M are mixed with 100 mL of 0.20 M of the same solute. The final concentration is…", options: ['0,60 M', '1,20 M', '0,20 M', '0,50 M'], answer: 0, why: '(0,10 + 0,020)/0,200.' },
      { q: "Molarity uses the volume of…", options: ["the solution", "the solvent", "the solute", "the water added"], answer: 0, why: "Liters of solution." },
      { q: "To go from 1.0 M to 0.10 M you must…", options: ["dilute 10 times", "dilute 2 times", "concentrate 10 times", "add solute"], answer: 0, why: "Dilution factor = C₁/C₂ = 10." }
    ],
    help: { intro: "In “Lab” choose solute, mass and flask. The dots are solute particles; the color indicates the concentration. Further down are the dilution and the mixing.", items: [['Flasks', 'left = prepared or concentrated solution; right = diluted solution or mixture. The dots are solute particles and a more intense colour means a higher concentration.'], ['Prepare', '“Solute”, “Mass of solute” and “Flask volume” give the molarity M = n / V.'], ['Dilute and mix', '“C₁”, “V₁ (aliquot)” and “V₂ (final volume)” apply C₁V₁ = C₂V₂; “C of the 2nd solution” and “Volume of the 2nd” compute a mixture.'], ['Chart', '“Concentration on dilution”.']], try: ['Prepare 1 L of 0.10 M NaCl: you need 5.84 g.', 'Dilute tenfold and look at the dots: the same moles spread over a larger volume.', 'Mix two solutions of different concentration: the result lies between the two.'] }
  };
  MSim.create(def);
})();
