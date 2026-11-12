/* El mol y la masa molar — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, NA = 6.02214076e23, VM = 22.414;
  var AM = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Cl: 35.45, Fe: 55.845, Ca: 40.078 };
  var SUB = {
    h2o: { n: "Water", f: 'H₂O', at: [['O', 1], ['H', 2]], g: { a: [['O', 0, 0, 0], ['H', 1.5, -1.1, 0], ['H', -1.5, -1.1, 0]], b: [[0, 1], [0, 2]] }, gas: false },
    co2: { n: "Carbon dioxide", f: 'CO₂', at: [['C', 1], ['O', 2]], g: { a: [['C', 0, 0, 0], ['O', 2.3, 0, 0], ['O', -2.3, 0, 0]], b: [[0, 1, 2], [0, 2, 2]] }, gas: true },
    nh3: { n: "Ammonia", f: 'NH₃', at: [['N', 1], ['H', 3]], g: { a: [['N', 0, 0.4, 0], ['H', 1.7, -0.4, 0], ['H', -0.85, -0.4, 1.47], ['H', -0.85, -0.4, -1.47]], b: [[0, 1], [0, 2], [0, 3]] }, gas: true },
    ch4: { n: "Methane", f: 'CH₄', at: [['C', 1], ['H', 4]], g: { a: [['C', 0, 0, 0], ['H', 1.2, 1.2, 1.2], ['H', -1.2, -1.2, 1.2], ['H', -1.2, 1.2, -1.2], ['H', 1.2, -1.2, -1.2]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] }, gas: true },
    o2: { n: "Oxygen", f: 'O₂', at: [['O', 2]], g: { a: [['O', 1.2, 0, 0], ['O', -1.2, 0, 0]], b: [[0, 1, 2]] }, gas: true },
    nacl: { n: "Sodium chloride", f: 'NaCl', at: [['Na', 1], ['Cl', 1]], g: { a: [['Na', -1.7, 0, 0], ['Cl', 1.7, 0, 0]], b: [] }, gas: false },
    fe: { n: "Iron", f: 'Fe', at: [['Fe', 1]], g: { a: [['Fe', 0, 0, 0]], b: [] }, gas: false },
    caco3: { n: "Calcium carbonate", f: 'CaCO₃', at: [['Ca', 1], ['C', 1], ['O', 3]], g: { a: [['Ca', -3, 0, 0], ['C', 0.8, 0, 0], ['O', 0.8, 1.9, 0], ['O', 2.4, -1, 0], ['O', -0.8, -1, 0]], b: [[1, 2], [1, 3], [1, 4]] }, gas: false }
  };
  var S = { sub: 'h2o', m: 18.015 }, g = null, molG = null, built = '', pile = [], pg = null, lab = [];
  function sci(x, d) { var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (!isFinite(e)) return '0'; return fmt(x / Math.pow(10, e), d) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  function M(k) { var s = SUB[k || S.sub], t = 0; s.at.forEach(function (a) { t += a[1] * AM[a[0]]; }); return t; }
  function nmol() { return S.m / M(); }
  function mainEl() { var s = SUB[S.sub], b = s.at[0]; s.at.forEach(function (a) { if (a[1] * AM[a[0]] > b[1] * AM[b[0]]) b = a; }); return b[0]; }
  function stages() {
    return [
      ["Molar mass", "Molar mass", "Molar mass is the sum of the atomic masses of the formula, in g/mol",
        "<p>The <b>molar mass</b> M of a substance is the mass of <b>1 mole</b> of it. It is obtained by <b>adding the atomic masses</b> of all the atoms in the formula: M(H₂O) = 2·1.008 + 15.999 = 18.015 g/mol. Change the substance and see how the sum changes.</p>"],
      ["The mole and Avogadro", "Avogadro", "1 mole = 6.022×10²³ entities, whether atoms, molecules or ions",
        "<p>A <b>mole</b> contains <b>N<sub>A</sub> = 6.022 × 10²³</b> elementary entities. It is an enormous “package” that lets you count particles by weighing. Each sphere in the pile represents <b>10²² particles</b>: with 60 spheres you have about one mole.</p>"],
      ["Grams ↔ moles ↔ particles", "Conversions", 'n = m / M · N = n · N_A',
        "<p>To go from mass to moles, divide by M: <b>n = m / M</b>. To go from moles to particles, multiply by Avogadro’s number: <b>N = n · N<sub>A</sub></b>. Move the mass and verify that moles and particles grow proportionally.</p>"],
      ["Molar volume of a gas", 'Gases', "At STP (0 °C, 1 atm) 1 mole of ideal gas occupies 22.4 L",
        "<p>Under <b>standard conditions</b> (0 °C and 1 atm) one mole of any <b>ideal gas</b> occupies <b>22.414 L</b>. Thus V = n · 22.414 L. This does not apply to solids or liquids: their volume depends on density.</p>"],
      ["Percent composition", "Composition", "% of each element = (n atoms · atomic mass) / M × 100",
        "<p>The <b>percent composition by mass</b> indicates what fraction of the molar mass each element contributes: <b>% = (n · A<sub>r</sub>) / M × 100</b>. The sum is always 100%.</p>"]
    ];
  }
  function rebuild() {
    if (built === S.sub) return; built = S.sub; while (molG.children.length) molG.remove(molG.children[0]);
    molG.add(ctxRef.mol(SUB[S.sub].g, { gs: 1.1, ar: 0.8 }));
    pile.forEach(function (p) { p.material = ctxRef.mat(mainEl()); });
  }
  var ctxRef = null;
  function pcount() { return Math.min(240, Math.round(nmol() * NA / 1e22)); }
  var def_ = {
    key: 'mol-masa-molar', title: "The mole and molar mass", subtitle: "3D Simulator · general chemistry", accent: { dark: '#74c0fc', light: '#1c6ea4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [5, 6, 24], target: [5, 2, 0] }, { id: 'molecula', label: "Molecule", pos: [1, 4, 11], target: [1, 2.5, 0] }],
    layers: [{ id: 'pile', label: "Pile", icon: '•' }],
    onStage: function () {},
    build: function (ctx) {
      ctxRef = ctx; g = new T.Group(); ctx.scene.add(g); molG = new T.Group(); molG.position.set(1, 2.5, 0); g.add(molG);
      pg = new T.Group(); pg.position.set(0, 0, 0); g.add(pg); var i, geo = new T.SphereGeometry(0.42, 12, 10);
      for (i = 0; i < 240; i++) { var s = new T.Mesh(geo, ctx.mat('O')); var c = i % 12, r = Math.floor(i / 12) % 5, l = Math.floor(i / 60); s.position.set(2 + c * 0.95 - 0, 0.5 + r * 0.95, (l - 1.5) * 0.95); s.position.x = 6 + c * 0.95; pg.add(s); pile.push(s); }
      var base = new T.Mesh(new T.BoxGeometry(14, 0.2, 5), new T.MeshStandardMaterial({ color: 0x343a40, roughness: 0.8 })); base.position.set(11.5, -0.2, 0); g.add(base);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['h2o', 'co2', 'nh3', 'caco3', 'nacl'][Math.min(4, Math.floor(f.local * 5))]; S.m = M(S.sub); } if (i === 1) { S.sub = 'fe'; S.m = M() * (0.05 + 0.95 * f.local); } if (i === 2) { S.sub = 'h2o'; S.m = 2 + 100 * f.local; } if (i === 3) { S.sub = 'co2'; S.m = M() * (0.1 + 1.9 * f.local); } if (i === 4) { S.sub = ['caco3', 'h2o', 'nh3'][Math.min(2, Math.floor(f.local * 3))]; S.m = M(S.sub); } }
      rebuild(); molG.rotation.y += 0.01; var np = pcount(), on = ctx.layer('pile');
      pile.forEach(function (p, j) { p.visible = on && j < np; });
      var s = SUB[S.sub], tot = M(), parts = s.at.map(function (a) { return a[1] + '×' + fmt(AM[a[0]], 3); }).join(' + ');
      lab[0].pos(1, 6, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true);
      lab[1].pos(1, -0.8, 0).set('M = ' + fmt(tot, 2) + " g/mol", 'bl-pos').vis(true);
      lab[2].pos(11.5, 6.2, 0).set(fmt(nmol(), 3) + " mol · " + sci(nmol() * NA, 2) + " particles", 'bl-d').vis(on);
      lab[3].pos(11.5, -1.3, 0).set("each sphere = 10²² particles", 'bl-d').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.m) u.m.set(S.m); },
    hud: function () { var s = SUB[S.sub]; return { eq: { chip: 'n', name: "Conversion", body: "<div class=\"eqline\"><small>Mass</small>" + fmt(S.m, 2) + " g</div><div class=\"eqline\"><small>Molar mass</small>" + fmt(M(), 3) + " g/mol</div><div class=\"eqline\"><small>n = m/M</small>" + fmt(nmol(), 4) + " mol</div><div class=\"eqline\"><small>N = n·N<sub>A</sub></small>" + SimKit.fmt(nmol() * NA / 1e23, 3) + ' × 10²³</div>' }, legend: [{ label: "Molecule", color: '#74c0fc', text: "one entity of " + s.f }, { label: "Spheres", color: '#ff6b6b', text: "10²² particles each" }] }; },
    measures: function () { var s = SUB[S.sub]; return [["Substance", s.f], ["Molar mass", fmt(M(), 3) + " g/mol"], ["Mass", fmt(S.m, 2) + ' g'], ['Cantidad', fmt(nmol(), 4) + ' mol'], ["Particles", sci(nmol() * NA, 3)], ["Volume at STP", s.gas ? fmt(nmol() * VM, 2) + ' L' : "not applicable (not a gas)"]]; },
    ideas: ["M is obtained by adding atomic masses.", 'n = m / M.', 'N = n · N_A.', "Ideal gas at STP: 22.4 L/mol."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Substance and amount"); el.appendChild(c);
      ui.sub = kit.ui.options({ label: "Substance", cols: 2, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].f, sub: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); var n = nmol(); S.sub = v; S.m = Math.min(300, n * M()); } });
      ui.m = kit.ui.slider({ label: "Mass", min: 0.1, max: 300, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      c.appendChild(ui.sub); c.appendChild(kit.ui.sliders([ui.m])); c.appendChild(ctx.btnRow([{ t: "1 mol", fn: function () { ctx.goManual(); S.m = M(); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Percent composition by mass", h: 200, note: "Contribution of each element to the molar mass.", draw: function (cx, w, h, col) {
      var s = SUB[S.sub], tot = M(), L = 10, y = 14, i, pal = ['#74c0fc', '#ff8787', '#ffd43b', '#69db7c'];
      cx.font = '12px system-ui'; cx.textAlign = 'left'; s.at.forEach(function (a, k) { var p = a[1] * AM[a[0]] / tot, bw = (w - 2 * L - 40) * p; cx.fillStyle = pal[k % 4]; cx.fillRect(L, y + k * 40, Math.max(2, bw), 24); cx.fillStyle = col.ink || '#ddd'; cx.fillText(a[0] + ' ' + fmt(p * 100, 1) + ' %', L + 4, y + k * 40 + 40 - 4 - 10); });
    } }],
    calc: function () {
      var s = SUB[S.sub], tot = M(), n = nmol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      var steps = s.at.map(function (a) { return a[1] + ' × ' + fmt(AM[a[0]], 3) + ' (' + a[0] + ')'; }).join(' + ');
      return '<div class="card-kicker">' + s.n + ' · ' + s.f + '</div><table class="calc-table">' + row('M', steps + ' = <b>' + fmt(tot, 3) + " g/mol</b>") + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(tot, 3) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row('N = n · N<sub>A</sub>', fmt(n, 4) + ' × 6,022×10²³ = <b>' + sci(n * NA, 3) + '</b>') + row("V (CNTP)", s.gas ? fmt(n, 4) + ' × 22,414 = <b>' + fmt(n * VM, 2) + ' L</b>' : "gases only") + '</table>';
    },
    quiz: [
      { q: "The molar mass of water (H = 1.008; O = 15.999) is…", options: ["18.015 g/mol", "17.007 g/mol", "34.0 g/mol", "16.0 g/mol"], answer: 0, why: '2·1,008 + 15,999.' },
      { q: "How many moles are there in 44 g of CO₂ (M = 44 g/mol)?", options: ["1 mol", "44 mol", "0.5 mol", "2 mol"], answer: 0, why: 'n = 44/44.' },
      { q: "2 mol of molecules contain…", options: ["1.2×10²⁴ molecules", "6.0×10²³ molecules", "3.0×10²³ molecules", "2 molecules"], answer: 0, why: '2 × 6,02×10²³.' },
      { q: "The volume of 0.5 mol of ideal gas at STP is…", options: ['11,2 L', '22,4 L', '44,8 L', '5,6 L'], answer: 0, why: '0,5 × 22,4.' },
      { q: "Avogadro's number is…", options: ["6.022×10²³ entities per mole", '6,022×10²³ g', '22,4 L', "1 mole of carbon-12 atoms weighs 1 g"], answer: 0, why: "Entities in one mole." },
      { q: "Which contains more atoms, 1 mol of Fe or 1 mol of H₂?", options: ["Equal in molecules/atoms: 1 mole of entities of each", "Fe, because it weighs more", "H₂, because it is a gas", "They cannot be compared"], answer: 0, why: "A mole is a number of entities, not a mass." }
    ],
    help: { intro: "Choose a substance and move the mass: the pile of spheres shows how many particles there are (each = 10²²). In “Calculation” you see the step-by-step work.", items: [['Molecule', 'the rotating molecule is one entity of the chosen substance.'], ['Pile', 'each sphere stands for 10²² particles; the pile grows with the mass.'], ['Controls', '“Substance” and “Mass”; the calculation tab converts grams → moles → particles step by step.'], ['Chart', '“Percent composition by mass”.']], try: ['Set 18.0 g of water: ≈ 1 mol, about 60 spheres (6.0 × 10²³ molecules).', 'Compare 1 mol of two substances: the number of spheres is the same, the mass is not.', 'Check the composition of water: ≈ 11 % H and 89 % O by mass.'] }
  };
  MSim.create(def_);

})();
