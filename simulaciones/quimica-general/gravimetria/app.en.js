/* Análisis gravimétrico — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var AN = { cl: { n: "Chloride (Cl⁻)", a: 'Cl⁻', p: "AgCl", pm: 143.32, am: 35.45, k: 1, r: 'AgNO₃', c: 0xf1f3f5 }, so4: { n: "Sulfate (SO₄²⁻)", a: 'SO₄²⁻', p: "BaSO₄", pm: 233.39, am: 96.06, k: 1, r: 'BaCl₂', c: 0xe9ecef }, fe: { n: "Iron (Fe)", a: 'Fe', p: 'Fe₂O₃', pm: 159.69, am: 55.845, k: 2, r: "NH₃ → Fe(OH)₃ → calcine", c: 0xc2410c }, ni: { n: "Nickel (Ni²⁺)", a: 'Ni', p: 'Ni(DMG)₂', pm: 288.91, am: 58.69, k: 1, r: 'dimetilglioxima', c: 0xf03e3e } };
  var S = { an: 'cl', ms: 1.0, pct: 25, ex: 120, co: 0, hum: 0, f: 0, dig: 0, dry: 0 }, g = null, ions = [], ppt = [], lab = [], liq = null, cr = null;
  function A() { return AN[S.an]; }
  function GF() { var a = A(); return a.k * a.am / a.pm; }
  function complete() { return Math.min(1, S.ex / 100) * (S.ex >= 100 ? 0.999 : 1); }
  function mpTrue() { return S.ms * S.pct / 100 / GF(); }
  function mpMeas() { return mpTrue() * complete() * (1 + S.co / 100) * (1 + S.hum / 100); }
  function pctCalc() { return mpMeas() * GF() / S.ms * 100; }
  function stages() {
    return [
      ["Precipitation", "Precipitate", "An excess of reagent is added to precipitate all of the analyte",
        "<p>In <b>gravimetric analysis</b> the analyte is converted into an <b>insoluble, pure precipitate of definite composition</b>, which is weighed. Add the precipitating reagent: with an <b>excess</b> (≈ 100–150 %) precipitation is nearly complete; with too little, analyte remains in solution and the result comes out low.</p>"],
      ["Digestion and filtration", "Digestion", "Digestion grows the crystals and reduces coprecipitation",
        "<p>The precipitate is heated in its mother liquor (<b>digestion</b>): small crystals dissolve and recrystallize into larger ones that are purer and easier to filter. It is <b>filtered and washed</b> to remove impurities. <b>Coprecipitation</b> of other ions increases the mass and gives a high result.</p>"],
      ["Drying and ignition", "Drying", "Weigh to constant mass",
        "<p>The precipitate is <b>dried or calcined</b> in a crucible to <b>constant mass</b> (two successive weighings differing by less than 0.3 mg). If <b>moisture</b> remains, the mass overestimates the analyte. Some precipitates must be calcined to reach a stable form (Fe(OH)₃ → Fe₂O₃).</p>"],
      ["Calculation with the gravimetric factor", "Calculation", "% analyte = m(precipitate) · GF / m(sample) × 100",
        "<p>The <b>gravimetric factor</b> converts the mass of the precipitate into mass of analyte: <b>GF = (a · M<sub>analyte</sub>) / M<sub>precipitate</sub></b>, where <i>a</i> is the number of analyte atoms per formula of the precipitate. Then <b>% = m<sub>pp</sub> · GF / m<sub>sample</sub> × 100</b>. Compare the value obtained with the true one and discuss the errors.</p>"]
    ];
  }
  var def = {
    key: 'gravimetria', title: "Gravimetric analysis", subtitle: "3D Simulator · general chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [14, 8, 20], target: [14, 2, 0] }, { id: 'frontal', label: "Front", pos: [14, 3, 24], target: [14, 2, 0] }],
    layers: [{ id: 'ions', label: "Ions", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(14, 0, 0); ctx.scene.add(g); var i;
      var bk = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 7, 28, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.2, side: T.DoubleSide })); bk.position.set(-5, 3.5, 0); g.add(bk);
      liq = new T.Mesh(new T.CylinderGeometry(3.1, 3.1, 5, 28), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.45 })); liq.position.set(-5, 2.6, 0); g.add(liq);
      for (i = 0; i < 70; i++) { var a = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), new T.MeshStandardMaterial({ color: 0x1971c2 })); g.add(a); ions.push(a); var p = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); g.add(p); ppt.push(p); }
      cr = new T.Mesh(new T.CylinderGeometry(1.5, 1, 1.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xdee2e6, side: T.DoubleSide })); cr.position.set(5, 1.7, 0); g.add(cr);
      var bal = new T.Mesh(new T.BoxGeometry(5, 0.8, 4), new T.MeshStandardMaterial({ color: 0x495057 })); bal.position.set(5, 0.4, 0); g.add(bal);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.f = f.local * 1.5; S.dig = 0; S.dry = 0; S.co = 1; S.hum = 3; S.ex = 120; } if (i === 1) { S.f = 1.5; S.dig = f.local; S.dry = 0; } if (i === 2) { S.f = 1.5; S.dig = 1; S.dry = f.local; S.hum = 3 * (1 - f.local); } if (i === 3) { S.f = 1.5; S.dig = 1; S.dry = 1; S.hum = 0; } } else { S.f = 1.5; S.dig = 1; S.dry = 1; }
      var cp = Math.min(1, S.f / (S.ex / 100 >= 1 ? 1 : 1)) * complete(), on = ctx.layer('ions'), n = 70, nP = Math.round(n * Math.min(1, cp)), nI = n - Math.round(n * Math.min(1, cp * 0.95)), th = ctx.now;
      ions.forEach(function (m, j) { m.visible = on && j < nI; var a = j * 2.4 + th * 0.3, r = 0.4 + (j % 9) * 0.3; m.position.set(-5 + Math.cos(a) * r, 0.8 + (j * 0.07) % 3.6, Math.sin(a) * r); });
      var sz = 0.5 + S.dig * 0.9, moved = S.dry;
      ppt.forEach(function (m, j) { m.visible = j < nP; var a = j * 2.4, r = 0.3 + (j % 7) * 0.35, sx = -5 + Math.cos(a) * r, sy = 0.35 + (j % 5) * 0.25 * (1 - moved) + (j % 3) * 0.05, sz2 = Math.sin(a) * r; var tx = 5 + Math.cos(a) * r * 0.4, ty = 1.2 + (j % 5) * 0.1 * moved; m.position.set(sx + (tx - sx) * moved, sy + (ty - sy) * moved, sz2 * (1 - moved) + Math.sin(a) * r * 0.4 * moved); m.scale.setScalar(sz * (1 - 0.2 * moved)); m.material.color.setHex(S.dig > 0.5 ? 0xfff9db : 0xf1f3f5); if (A().c) m.material.color.setHex(A().c); });
      liq.visible = moved < 0.5; lab[0].pos(9, 7.6, 0).set(i < 2 || P.manual ? A().r + " · excess " + S.ex + ' %' : '', 'bl-lead').vis(true);
      lab[1].pos(9, 6, 0).set(A().p + ': ' + fmt(mpMeas() * (0.4 + 0.6 * Math.min(1, cp)), 3) + ' g', 'bl-pos').vis(moved > 0.3 || P.manual);
      lab[2].pos(19, 3.2, 0).set("Balance: " + fmt(mpMeas() * moved, 4) + ' g', 'bl-d').vis(true);
      lab[3].pos(9, -1, 0).set("GF = " + fmt(GF(), 4), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['an', 'ms', 'pct', 'ex', 'co', 'hum'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'FG', name: "Result", body: "<div class=\"eqline\"><small>m precipitate</small>" + fmt(mpMeas(), 4) + " g</div><div class=\"eqline\"><small>% obtained</small>" + fmt(pctCalc(), 2) + " %</div><div class=\"eqline\"><small>% true</small>" + fmt(S.pct, 2) + " %</div><div class=\"eqline\"><small>Relative error</small>" + fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %</div>' }, legend: [{ label: "Blue dots", color: '#1971c2', text: "analyte in solution" }, { label: "Light spheres", color: '#f1f3f5', text: "precipitate" }] }; },
    measures: function () { return [["Analyte", A().a], ["Precipitate", A().p], ["Gravimetric factor", fmt(GF(), 4)], ["m precipitate", fmt(mpMeas(), 4) + ' g'], ["% obtained", fmt(pctCalc(), 2) + ' %'], ['Error', fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %']]; },
    ideas: ["GF = a·M(analyte)/M(precipitate).", "Excess reagent: complete precipitation.", "Coprecipitation → high result.", "Weigh to constant mass."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Sample and reagent"); el.appendChild(c);
      ui.an = kit.ui.options({ label: "Analyte", cols: 2, value: S.an, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].a, sub: '→ ' + AN[k].p }; }), onChange: function (v) { ctx.goManual(); S.an = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.an); c.appendChild(kit.ui.sliders([sl('ms', "Sample mass", 0.2, 2, 0.05, function (v) { return fmt(v, 2) + ' g'; }), sl('pct', "True % of analyte", 5, 60, 1, function (v) { return v + ' %'; }), sl('ex', "Reagent (% of stoichiometric)", 50, 150, 5, function (v) { return v + ' %'; }), sl('co', "Coprecipitation", 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; }), sl('hum', "Residual moisture", 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; })])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Mass of precipitate versus reagent added", h: 200, note: "Below 100 % the precipitation is incomplete.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = mpTrue() * 1.1; cx.strokeStyle = '#b197fc'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var ex = 50 + i, m = mpTrue() * Math.min(1, ex / 100) * (1 + S.co / 100) * (1 + S.hum / 100), x = L + pw * i / 100, y = Tp + ph * (1 - m / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ex - 50) / 100, Tp + ph * (1 - mpMeas() / mx), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('50 %', L, h - 8); cx.fillText('150 %', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('g', L - 4, Tp + 8);
    } }],
    calc: function () {
      var a = A(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">' + a.n + ' → ' + a.p + '</div><table class="calc-table">' + row('FG', a.k + ' × ' + fmt(a.am, 2) + ' / ' + fmt(a.pm, 2) + ' = <b>' + fmt(GF(), 4) + '</b>') + row("m analyte", fmt(S.ms, 2) + ' g × ' + fmt(S.pct, 0) + ' % = ' + fmt(S.ms * S.pct / 100, 4) + ' g') + row("m precipitate (ideal)", fmt(mpTrue(), 4) + ' g') + row("m precipitate (measured)", '<b>' + fmt(mpMeas(), 4) + ' g</b>') + row("% obtained", fmt(mpMeas(), 4) + ' × ' + fmt(GF(), 4) + ' / ' + fmt(S.ms, 2) + ' × 100 = <b>' + fmt(pctCalc(), 2) + ' %</b>') + '</table>';
    },
    quiz: [
      { q: "The gravimetric factor for Cl⁻ weighed as AgCl is…", options: ['0,2474', '4,043', '0,5', '1'], answer: 0, why: '35,45/143,32.' },
      { q: "A coprecipitation of impurities produces a result that is…", options: ["high", "low", "exact", "indeterminate"], answer: 0, why: "It increases the mass weighed." },
      { q: "The precipitate is ignited until…", options: ["constant mass", "it changes color", "it melts", "constant volume"], answer: 0, why: "It removes water and volatiles." },
      { q: "If the precipitating reagent is scarce, the result is…", options: ["low", "high", "correct", "depends on the filter"], answer: 0, why: "Part of the analyte stays in solution." },
      { q: "The GF of Fe weighed as Fe₂O₃ (159.69 g/mol; Fe 55.845) is…", options: ['0,6994', '0,3497', '1,4297', '0,5'], answer: 0, why: '2 × 55,845 / 159,69.' },
      { q: "The digestion of the precipitate serves to…", options: ["obtain larger and purer crystals", "dissolve it", "increase the moisture", "reduce the GF"], answer: 0, why: "Ostwald ripening." }
    ],
    help: { intro: "Choose the analyte, the sample mass and the possible errors. The precipitate forms in the beaker and is transferred to the crucible on the balance.", items: [['Beaker', 'blue dots = analyte still in solution; light spheres = precipitate forming.'], ['Balance', 'the precipitate is filtered, dried or ignited and weighed in the crucible until constant mass.'], ['Controls', 'the analyte, the sample mass and possible errors in the procedure.'], ['Chart', '“Mass of precipitate versus reagent added”: it stops growing when precipitation is complete.']], try: ['Add reagent until the precipitate mass no longer changes: precipitation is complete.', 'Turn on a coprecipitation error: the result comes out high.', 'Work out the % of analyte with the gravimetric factor and compare it with the panel.'] }
  };
  MSim.create(def);
})();
