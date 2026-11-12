/* Síntesis de la aspirina — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, MS = 138.12, MA = 180.16, MAC = 102.09, DAC = 1.08;
  var S = { ms: 2.0, vac: 5.0, tc: 75, t: 15, cat: 1, mech: 0 }, g = null, gl = null, gr = null, lab = [], cr = [], tube = null, tubeLiq = null, keyM = -1;
  function ring(extra) { // geometría manual: anillo + sustituyentes (extra: 0 salicílico, 1 acetilsalicílico)
    var a = [], b = [], i;
    for (i = 0; i < 6; i++) { var ang = i * Math.PI / 3; a.push(['C', Math.cos(ang) * 1.4, Math.sin(ang) * 1.4, 0]); }
    for (i = 0; i < 6; i++) b.push([i, (i + 1) % 6, i % 2 ? 1 : 2]);
    function add(el, x, y) { a.push([el, x, y, 0]); return a.length - 1; }
    var c = add('C', 2.9, 0), o1 = add('O', 3.6, 1.1), o2 = add('O', 3.5, -1.1); b.push([0, c, 1], [c, o1, 2], [c, o2, 1]);
    var ox = add('O', 0.7 * 2.0 + 0.0, 1.0 * 2.5 + 0.1); a[ox] = ['O', 1.4 * Math.cos(Math.PI / 3) * 1.9, 1.4 * Math.sin(Math.PI / 3) * 1.9, 0]; b.push([1, ox, 1]);
    if (extra) { var ca = add('C', a[ox][1] + 0.9, a[ox][2] + 1.3), oa = add('O', a[ox][1] + 2.1, a[ox][2] + 1.1), me = add('C', a[ox][1] + 0.2, a[ox][2] + 2.7); b.push([ox, ca, 1], [ca, oa, 2], [ca, me, 1]); }
    else { var h = add('H', a[ox][1] + 0.5, a[ox][2] + 0.8); b.push([ox, h, 1]); }
    var hh = add('H', 3.8, -1.7); b.push([o2, hh, 1]);
    [2, 3, 4, 5].forEach(function (k) { var ang = k * Math.PI / 3, h2 = add('H', Math.cos(ang) * 2.5, Math.sin(ang) * 2.5); b.push([k, h2, 1]); });
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[1]; cy += x[2]; }); cx /= a.length; cy /= a.length; a.forEach(function (x) { x[1] -= cx; x[2] -= cy; });
    return { a: a, b: b };
  }
  function nS() { return S.ms / MS * 1000; }
  function nA() { return S.vac * DAC / MAC * 1000; }
  function lim() { return nS() <= nA() ? "salicylic acid" : "acetic anhydride"; }
  function nTeor() { return Math.min(nS(), nA()); }
  function mTeor() { return nTeor() * MA / 1000; }
  function k() { var k75 = 0.25 * (S.cat ? 1 : 0.04), Ea = 60000, R = 8.314; return k75 * Math.exp(-Ea / R * (1 / (S.tc + 273.15) - 1 / 348.15)); }
  function conv() { return 1 - Math.exp(-k() * S.t); }
  function mReal() { return mTeor() * conv() * 0.85 * (S.tc > 90 ? 0.8 : 1); }
  function pct() { return mReal() / mTeor() * 100; }
  function purity() { var fr = 1 - conv(), imp = fr * 0.6; return 1 - imp / (1 + imp); }
  var MECH = ["Protonation of the anhydride", "Nucleophilic attack by the phenol", "Tetrahedral intermediate", "Loss of acetic acid", "Deprotonation → aspirin"];
  function stages() {
    return [
      ["Reagents and reaction", "Reaction", "Salicylic acid + acetic anhydride → acetylsalicylic acid + acetic acid",
        "<p><b>Aspirin</b> (acetylsalicylic acid) is obtained by <b>acetylation</b> of the phenolic group of <b>salicylic acid</b> with <b>acetic anhydride</b>, using an acid (H₂SO₄ or H₃PO₄) as catalyst. It is a <b>nucleophilic acyl substitution</b>: the –OH attacks a C=O of the anhydride. Acetic acid forms as a byproduct.</p>"],
      ["Mechanism", "Mechanism", "Protonation → attack → tetrahedral intermediate → loss of AcOH → deprotonation",
        "<p>1) The acid protonates a C=O of the anhydride and activates it. 2) The <b>phenolic oxygen</b> attacks that carbon. 3) A <b>tetrahedral intermediate</b> forms. 4) <b>Acetic acid</b> (a good leaving group) is expelled and 5) the H⁺ is lost from the oxygen: the <b>ester</b> remains. Use the step control to walk through it.</p>"],
      ["Limiting reagent and yield", "Yield", "Theoretical yield according to the limiting reagent; actual < theoretical",
        "<p>The anhydride is used in <b>excess</b>; the <b>limiting reagent</b> is salicylic acid. The <b>theoretical yield</b> is n(limiting) × M(aspirin). The actual yield is lower because of incomplete reaction and losses during <b>recrystallization</b>: <b>% yield = actual/theoretical × 100</b>.</p>"],
      ["Temperature, time and catalyst", "Conditions", "More temperature and catalyst speed up the acetylation",
        "<p>The rate increases with <b>temperature</b> (Arrhenius) and with the <b>acid catalyst</b>. A short time leaves unreacted salicylic acid. But above ~90 °C side reactions and decomposition increase. Adjust T, time and catalyst and watch the yield.</p>"],
      ["Purity test with FeCl₃", "Purity", "Free phenol gives a violet color with Fe³⁺",
        "<p><b>Salicylic acid</b> has a phenolic –OH and forms a <b>violet complex with FeCl₃</b>; pure aspirin, with no free phenol, <b>gives no color</b>. An intense violet color indicates incomplete acetylation or hydrolysis. Compare conditions.</p>"]
    ];
  }
  var def = {
    key: 'sintesis-aspirina', title: "Synthesis of aspirin", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [14, 4, 22], target: [14, 1, 0] }, { id: 'frontal', label: "Front", pos: [14, 1, 26], target: [14, 1, 0] }],
    layers: [{ id: 'cryst', label: "Crystals", icon: '◇' }],
    build: function (ctx) {
      g = new T.Group(); g.scale.setScalar(0.82); g.position.set(3, 0, 0); ctx.scene.add(g); gl = new T.Group(); gr = new T.Group(); g.add(gl); g.add(gr); gl.position.set(11, 4, 0); gr.position.set(26, 4, 0);
      gl.add(ctx.mol(ring(0), { gs: 0.9, ar: 0.55 })); gr.add(ctx.mol(ring(1), { gs: 0.9, ar: 0.55 }));
      var arr = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 5, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); arr.rotation.z = Math.PI / 2; arr.position.set(18.5, 4, 0); g.add(arr); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.set(21.4, 4, 0); g.add(hd);
      for (var i = 0; i < 60; i++) { var c = new T.Mesh(new T.OctahedronGeometry(0.28), new T.MeshStandardMaterial({ color: 0xf8f9fa })); g.add(c); cr.push(c); }
      tube = new T.Mesh(new T.CylinderGeometry(1, 1, 4, 18, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(31, -3, 0); g.add(tube);
      tubeLiq = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 2.6, 18), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); tubeLiq.position.set(31, -3.6, 0); g.add(tubeLiq);
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.ms = 2; S.vac = 5; S.tc = 75; S.t = 15; S.cat = 1; } if (i === 1) { S.mech = Math.min(4, Math.floor(f.local * 5)); } if (i === 2) { S.ms = 1 + 3 * f.local; } if (i === 3) { S.ms = 2; S.tc = 40 + 55 * f.local; S.t = 5 + 25 * f.local; S.cat = 1; } if (i === 4) { S.tc = 75; S.t = 3 + 27 * f.local; S.cat = 1; } }
      gl.rotation.y += 0.004; gr.rotation.y += 0.004; var cv = conv(), n = Math.round(60 * Math.min(1, mReal() / 5)), on = ctx.layer('cryst');
      cr.forEach(function (c, j) { c.visible = on && j < n; var a = j * 2.4; c.position.set(25 + Math.cos(a) * (0.4 + (j % 6) * 0.35), -4 + (j % 5) * 0.18, Math.sin(a) * (0.4 + (j % 6) * 0.35)); c.rotation.set(j, j * 2, 0); });
      var viol = 1 - purity(); tubeLiq.material.color.set('#f1f3f5').lerp(new T.Color('#6741d9'), Math.min(1, viol * 3)); tubeLiq.material.opacity = 0.35 + 0.5 * Math.min(1, viol * 3);
      lab[0].pos(12.02, 7.05, 0).set("Salicylic acid · " + fmt(S.ms, 2) + ' g', 'bl-lead').vis(true);
      lab[1].pos(24.32, 7.05, 0).set("Acetylsalicylic acid · " + fmt(mReal(), 2) + ' g', 'bl-pos').vis(true);
      lab[2].pos(18.17, 4.43, 0).set("Ac₂O (" + fmt(S.vac, 1) + " mL), H⁺, " + fmt(S.tc, 0) + ' °C', 'bl-d').vis(true);
      lab[3].pos(18.17, 2.13, 0).set("conversion " + fmt(cv * 100, 0) + ' %', 'bl-d').vis(true);
      lab[4].pos(21.5, -5.1, 0).set("% yield: " + fmt(pct(), 0) + ' %', 'bl-d').vis(true);
      lab[5].pos(27.5, -7.2, 0).set("FeCl₃: " + (viol * 3 > 0.35 ? "violet (impure)" : "no color (pure)"), viol * 3 > 0.35 ? 'bl-neg' : 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['ms', 'vac', 'tc', 't', 'cat'].forEach(function (k2) { if (u[k2]) u[k2].set(S[k2]); }); },
    hud: function () { return { eq: { chip: '%', name: "Yield", body: "<div class=\"eqline\"><small>Limiting</small>" + lim() + "</div><div class=\"eqline\"><small>Theoretical</small>" + fmt(mTeor(), 2) + " g</div><div class=\"eqline\"><small>Actual</small>" + fmt(mReal(), 2) + " g</div><div class=\"eqline\"><small>Yield</small>" + fmt(pct(), 0) + ' %</div>' }, legend: [{ label: "White crystals", color: '#f8f9fa', text: "aspirin obtained" }, { label: "Violet tube", color: '#6741d9', text: "free phenol (FeCl₃)" }] }; },
    measures: function () { return [["n salicylic acid", fmt(nS(), 2) + " mmol"], ["n anhydride", fmt(nA(), 1) + " mmol"], ["Limiting", lim()], ["Theoretical", fmt(mTeor(), 2) + ' g'], ['Real', fmt(mReal(), 2) + ' g'], ["Yield", fmt(pct(), 0) + ' %'], ["Conversion", fmt(conv() * 100, 0) + ' %']]; },
    ideas: ["Acetylation of the phenolic –OH.", "Limiting: salicylic acid.", "% = actual/theoretical × 100.", "Violet FeCl₃ = free phenol."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction conditions"); el.appendChild(c);
      function sl(k2, l, a, b, st, fm) { ui[k2] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k2], format: fm, onInput: function (v) { ctx.goManual(); S[k2] = v; } }); return ui[k2]; }
      c.appendChild(kit.ui.sliders([sl('ms', "Salicylic acid", 0.5, 5, 0.1, function (v) { return fmt(v, 1) + ' g'; }), sl('vac', "Acetic anhydride", 1, 10, 0.5, function (v) { return fmt(v, 1) + ' mL'; }), sl('tc', "Temperature", 25, 110, 1, function (v) { return v + ' °C'; }), sl('t', "Time", 1, 60, 1, function (v) { return v + ' min'; })]));
      ui.cat = kit.ui.options({ label: "Acid catalyst", cols: 2, value: S.cat, options: [{ v: 1, label: "With H₃PO₄" }, { v: 0, label: "Without catalyst" }], onChange: function (v) { ctx.goManual(); S.cat = +v; } }); c.appendChild(ui.cat);
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Conversion versus time", h: 200, note: "Conversion = 1 − e^(−kt) at the chosen temperature.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff8787'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 60; i++) { var v = 1 - Math.exp(-k() * i), x = L + pw * i / 60, y = Tp + ph * (1 - v); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(L + pw * S.t / 60, Tp + ph * (1 - conv()), 5, 0, 6.28); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText("60 min", L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH</div><table class=\"calc-table\">" + row("n salicylic acid", fmt(S.ms, 2) + ' g / 138,12 = <b>' + fmt(nS(), 2) + " mmol</b>") + row("n anhydride", fmt(S.vac, 1) + " mL × 1.08 g/mL / 102.09 = <b>" + fmt(nA(), 1) + " mmol</b>") + row("Limiting", '<b>' + lim() + '</b>') + row("theoretical m", fmt(nTeor(), 2) + " mmol × 180.16 = <b>" + fmt(mTeor(), 2) + ' g</b>') + row("Conversion", '1 − e^(−' + fmt(k(), 3) + ' × ' + S.t + ') = <b>' + fmt(conv() * 100, 0) + ' %</b>') + row("estimated actual m", '<b>' + fmt(mReal(), 2) + " g</b> (with 15 % loss on recrystallization)") + row("% yield", '<b>' + fmt(pct(), 0) + ' %</b>') + '</table>'; },
    quiz: [
      { q: "The nucleophile that attacks acetic anhydride is…", options: ["the O of the phenolic –OH", "the C=O of the acid", "H₂O", "H⁺"], answer: 0, why: "It forms the ester." },
      { q: "The limiting reagent in the typical synthesis is…", options: ["salicylic acid", "acetic anhydride", "the catalyst", "water"], answer: 0, why: "The anhydride is in excess." },
      { q: "If 1.8 g are obtained and the theoretical is 2.6 g, the yield is…", options: ['69 %', '144 %', '31 %', '100 %'], answer: 0, why: '1,8/2,6 × 100.' },
      { q: "A violet color with FeCl₃ indicates…", options: ["unreacted salicylic acid", "pure aspirin", "water", "catalyst"], answer: 0, why: "Presence of free phenol." },
      { q: "The by-product of the reaction is…", options: ["acetic acid", "water", 'CO₂', "methanol"], answer: 0, why: "It leaves as a leaving group." },
      { q: "Raising the temperature from 50 to 75 °C…", options: ["increases the rate", "reduces the rate", "does not change it", "stops the reaction"], answer: 0, why: "Arrhenius dependence." }
    ],
    help: { intro: "Adjust amounts, temperature, time and catalyst. You will see the mass of aspirin, the yield and the FeCl₃ test.", items: [['Scene', 'white crystals = aspirin obtained; violet tube = positive FeCl₃ test (free phenol left).'], ['Controls', 'amounts of reagents, temperature, time and “Acid catalyst” (with H₃PO₄ or without catalyst).'], ['Panel', 'mass of aspirin, limiting reagent and yield (% = actual / theoretical × 100).'], ['Chart', '“Conversion versus time”.']], try: ['Remove the catalyst: conversion goes more slowly.', 'Shorten the reaction time: the FeCl₃ test turns violet because of unreacted salicylic acid.', 'Identify the limiting reagent: salicylic acid.'] }
  };
  MSim.create(def);
})();
