/* Nomenclatura inorgánica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CA = {
    na: { s: 'Na', q: 1, n: "sodium", c: 0xab5cf2 }, k: { s: 'K', q: 1, n: "potassium", c: 0x8f40d4 }, ag: { s: 'Ag', q: 1, n: "silver", c: 0xc0c0c0 }, nh4: { s: 'NH₄', q: 1, n: "ammonium", c: 0x4f7cff, poly: true },
    mg: { s: 'Mg', q: 2, n: "magnesium", c: 0x8aff00 }, ca: { s: 'Ca', q: 2, n: "calcium", c: 0x3dff00 }, zn: { s: 'Zn', q: 2, n: "zinc", c: 0x7d80b0 }, al: { s: 'Al', q: 3, n: "aluminium", c: 0xbfa6a6 },
    fe2: { s: 'Fe', q: 2, n: "iron", c: 0xe06633, ox: true, trad: "ferrous" }, fe3: { s: 'Fe', q: 3, n: "iron", c: 0xc2410c, ox: true, trad: "ferric" }, cu1: { s: 'Cu', q: 1, n: "copper", c: 0xc88033, ox: true, trad: "cuprous" }, cu2: { s: 'Cu', q: 2, n: "copper", c: 0x2f9e44, ox: true, trad: "cupric" }, pb2: { s: 'Pb', q: 2, n: "lead", c: 0x575961, ox: true, trad: "plumbous" }
  };
  var AN = {
    f: { s: 'F', q: 1, n: "fluoride", c: 0x7ee08a, pre: "fluoride" }, cl: { s: 'Cl', q: 1, n: "chloride", c: 0x3ddc5a }, br: { s: 'Br', q: 1, n: "bromide", c: 0xa0522d }, i: { s: 'I', q: 1, n: "iodide", c: 0x9a4fd0 },
    o: { s: 'O', q: 2, n: "oxide", c: 0xff4d4d }, s: { s: 'S', q: 2, n: "sulfide", c: 0xe6c229 }, oh: { s: 'OH', q: 1, n: "hydroxide", c: 0xff8787, poly: true },
    no3: { s: 'NO₃', q: 1, n: "nitrate", c: 0x4f7cff, poly: true, ca: 'N', no: 3 }, no2: { s: 'NO₂', q: 1, n: "nitrite", c: 0x5c7cfa, poly: true, ca: 'N', no: 2 }, so4: { s: 'SO₄', q: 2, n: "sulfate", c: 0xe6c229, poly: true, ca: 'S', no: 4 }, so3: { s: 'SO₃', q: 2, n: "sulfite", c: 0xf2d14f, poly: true, ca: 'S', no: 3 },
    co3: { s: 'CO₃', q: 2, n: "carbonate", c: 0x56606b, poly: true, ca: 'C', no: 3 }, po4: { s: 'PO₄', q: 3, n: "phosphate", c: 0xff9a3d, poly: true, ca: 'P', no: 4 }, clo4: { s: 'ClO₄', q: 1, n: "perchlorate", c: 0x3ddc5a, poly: true, ca: 'Cl', no: 4 }, mno4: { s: 'MnO₄', q: 1, n: "permanganate", c: 0xcc5de8, poly: true, ca: 'Mn', no: 4 }
  };
  var HAL = [['ClO⁻', "hypochlorite", '+1', 'HClO', "hypochlorous acid"], ['ClO₂⁻', "chlorite", '+3', 'HClO₂', "chlorous acid"], ['ClO₃⁻', "chlorate", '+5', 'HClO₃', "chloric acid"], ['ClO₄⁻', "perchlorate", '+7', 'HClO₄', "perchloric acid"]];
  var PRE = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa'];
  var ROM = ['', 'I', 'II', 'III', 'IV'];
  var S = { c: 'na', a: 'cl', p: 0, h: 0 }, g = null, lab = [], cats = [], ans = [], links = [];
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratio() { var c = CA[S.c], a = AN[S.a], l = c.q * a.q / gcd(c.q, a.q); return { nc: l / c.q, na: l / a.q }; }
  function fml(c, a, r) { function part(x, n) { var s = x.s; if (n > 1 && x.poly) s = '(' + s + ')'; return s + (n > 1 ? sub(n) : ''); } return part(c, r.nc) + part(a, r.na); }
  function sub(n) { return String(n).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }); }
  function stock(c, a) { return c.n + (c.ox ? '(' + ROM[c.q] + ')' : '') + ' ' + a.n; }
  function trad(c, a) { return (c.trad || c.n) + ' ' + a.n; }
  function sist(c, a, r) { if (a.poly && a.s !== 'OH') return null; var cn = (r.nc > 1 ? PRE[r.nc] : '') + c.n; if (a.s === 'OH') return cn + ' ' + (r.na > 1 ? PRE[r.na] : '') + 'hydroxide'; if (a.s === 'O') return cn + ' ' + (r.na > 1 ? PRE[r.na] + 'oxide' : (r.nc > 1 ? 'monoxide' : 'oxide')); return cn + ' ' + (r.na > 1 ? PRE[r.na] : '') + a.n; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Ions and charge balance", "Formulas", "An ionic compound is neutral: Σ(+ charges) = Σ(− charges)",
        "<p>An ionic compound is formed with <b>cations</b> (+) and <b>anions</b> (−) in the proportion that cancels the charge. It is found with the <b>crisscross method</b>: the charge of one ion becomes the subscript of the other (Al³⁺ and O²⁻ → Al₂O₃). Polyatomic ions take parentheses if their subscript is greater than 1: Ca(OH)₂, Al₂(SO₄)₃. Choose a cation and an anion and watch the assembly.</p>"],
      ["Stock nomenclature", "Stock", "cation + anion; the oxidation state goes in Roman numerals if there are several",
        "<p>In <b>Stock</b> nomenclature the cation is named first, then the anion. If the metal has <b>more than one oxidation state</b> (Fe, Cu, Pb, Sn…), it is written in <b>Roman numerals in parentheses</b>: FeCl₃ = iron(III) chloride; FeCl₂ = iron(II) chloride. For metals with a single state (Na, Ca, Al) it is not written.</p>"],
      ["Systematic and traditional", "Other nomenclatures", "Prefixes mono-, di-, tri-… and suffixes -ous / -ic",
        "<p>The <b>systematic</b> one uses multiplicative prefixes: Fe₂O₃ = diiron trioxide; CaCl₂ = calcium dichloride. The <b>traditional</b> one uses suffixes for metals with two states: the lower ends in <b>-ous</b> and the higher in <b>-ic</b> (ferrous/ferric, cuprous/cupric). Today IUPAC recommends <b>Stock</b> and systematic; the traditional one is kept because of its use.</p>"],
      ["Halogen oxoanions", "Oxoanions", "hypo- … -ite < -ite < -ate < per- … -ate according to the number of oxygens",
        "<p>Halogens form <b>oxoanions</b> with different numbers of O: <b>hypochlorite (ClO⁻, +1), chlorite (ClO₂⁻, +3), chlorate (ClO₃⁻, +5) and perchlorate (ClO₄⁻, +7)</b>. The suffix <b>-ite</b> indicates fewer O and <b>-ate</b> more; <b>hypo-</b> and <b>per-</b> mark the extremes. The same pattern holds for nitrite/nitrate (+3/+5) and sulfite/sulfate (+4/+6). Move the control to go through the series.</p>"],
      ["Acids, oxoacids and hydroxides", "Acids", "-ide → hydro-…-ic acid ; -ate → -ic acid ; -ite → -ous acid",
        "<p>An <b>acid</b> is H⁺ + anion. If the anion ends in <b>-ide</b>, the acid is “<b>hydro...ic acid</b>” (HCl(aq): hydrochloric acid). If it ends in <b>-ate</b>, “<b>...ic acid</b>” (H₂SO₄: sulfuric acid); if it ends in <b>-ite</b>, “<b>...ous acid</b>” (H₂SO₃: sulfurous acid). A <b>hydroxide</b> is cation + OH⁻: Ca(OH)₂ calcium hydroxide.</p>"]
    ];
  }
  var def = {
    key: 'nomenclatura-inorganica', title: "Inorganic Nomenclature", subtitle: "3D Simulator · general chemistry", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 6, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'q', label: "Charges", icon: '±' }],
    build: function (ctx) { g = new T.Group(); ctx.scene.add(g); for (var i = 0; i < 6; i++) { var c = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ roughness: 0.35 })); g.add(c); cats.push(c); } for (i = 0; i < 6; i++) { var a = new T.Group(); g.add(a); ans.push(a); } for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { var ck = Object.keys(CA), ak = Object.keys(AN); if (i === 0) { var j = Math.min(5, Math.floor(f.local * 6)); S.c = ['na', 'mg', 'al', 'ca', 'k', 'al'][j]; S.a = ['cl', 'o', 'o', 'oh', 'so4', 'so4'][j]; } if (i === 1) { var j1 = Math.min(3, Math.floor(f.local * 4)); S.c = ['fe2', 'fe3', 'cu1', 'cu2'][j1]; S.a = 'cl'; } if (i === 2) { var j2 = Math.min(2, Math.floor(f.local * 3)); S.c = ['fe3', 'al', 'ca'][j2]; S.a = ['o', 'o', 'cl'][j2]; } if (i === 3) { S.h = Math.min(3, Math.floor(f.local * 4)); } if (i === 4) { var j4 = Math.min(2, Math.floor(f.local * 3)); S.c = ['ca', 'na', 'al'][j4]; S.a = ['oh', 'no3', 'so4'][j4]; } S.p = (f.local * 4) % 1; if (i === 3) S.p = 1; }
      lab.forEach(function (l) { l.vis(false); }); cats.forEach(function (c) { c.visible = false; }); ans.forEach(function (a) { a.visible = false; });
      S.h = Math.max(0, Math.min(3, S.h | 0)); var c = CA[S.c], a = AN[S.a], r = ratio(), q = sm(S.p), qOn = ctx.layer('q');
      if (i === 3 && !P.manual) { var h = HAL[S.h]; var cl = new T.Color(0x3ddc5a); ans[0].visible = true; if (ans[0].userData.k !== 'h' + S.h) { ans[0].userData.k = 'h' + S.h; while (ans[0].children.length) ans[0].remove(ans[0].children[0]); var ce = new T.Mesh(new T.SphereGeometry(1.1, 18, 12), new T.MeshStandardMaterial({ color: 0x3ddc5a })); ans[0].add(ce); for (var k = 0; k < S.h + 1; k++) { var o = new T.Mesh(new T.SphereGeometry(0.62, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); var ang = k * 2 * Math.PI / (S.h + 1) + 0.4, hh = S.h === 3 ? [1, 1, 1, 1][k] : 0; o.position.set(Math.cos(ang) * 1.9, Math.sin(ang) * 1.9, S.h === 3 ? ((k % 2) ? 1 : -1) * 0.8 : 0); ans[0].add(o); } } ans[0].position.set(0, 0, 0); ans[0].rotation.y = now * 0.5; ans[0].scale.setScalar(1.5); lab[0].pos(0, 5.5, 0).set(h[0] + ' · ' + h[1] + " (O.S. of Cl = " + h[2] + ')', 'bl-lead').vis(true); lab[1].pos(0, -5, 0).set(h[3] + ' → ' + h[4], 'bl-d').vis(true); lab[2].pos(0, -6.4, 0).set("more O → higher oxidation state → suffix -ite → -ate", 'bl-d').vis(true); return; }
      var rows = Math.max(r.nc, r.na), colX = function (j, n) { return (j - (n - 1) / 2) * 3.2; };
      for (var j3 = 0; j3 < r.nc; j3++) { var m = cats[j3]; m.visible = true; m.material.color.setHex(c.c); var rad = c.poly ? 1.2 : (c.q === 1 ? 1.2 : 1.0); m.scale.setScalar(rad); var tx = colX(j3, r.nc), ty = 3.2, sx = tx - 14 * (1 - q); m.position.set(sx, ty, 0); if (qOn) lab[j3].pos(tx + 0, ty + 1.6, 0).set(c.q + '+', 'bl-pos').vis(q > 0.9); }
      for (var j4 = 0; j4 < r.na; j4++) { var gp = ans[j4]; gp.visible = true; if (gp.userData.k !== S.a) { gp.userData.k = S.a; while (gp.children.length) gp.remove(gp.children[0]); var ctr = new T.Mesh(new T.SphereGeometry(a.poly ? 0.8 : 1.3, 18, 12), new T.MeshStandardMaterial({ color: a.c })); gp.add(ctr); if (a.poly) { var nO = a.no || 1; if (a.s === 'OH') { var ox = new T.Mesh(new T.SphereGeometry(0.55, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); ox.position.set(0, 0.9, 0); gp.children[0].material.color.setHex(0xff4d4d); gp.children[0].scale.setScalar(1.2); gp.remove(ox); var hh2 = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); hh2.position.set(0, 1.2, 0); gp.add(hh2); } else { var cnt = nO; if (a.s === 'NO₂') cnt = 2; for (var k2 = 0; k2 < cnt; k2++) { var o2 = new T.Mesh(new T.SphereGeometry(0.55, 14, 10), new T.MeshStandardMaterial({ color: 0xff4d4d })); var an2 = k2 * 2 * Math.PI / cnt; o2.position.set(Math.cos(an2) * 1.35, Math.sin(an2) * 1.35, cnt === 4 ? (k2 % 2 ? 0.7 : -0.7) : 0); gp.add(o2); } } } }
        var tx2 = colX(j4, r.na), ty2 = -3.2, sx2 = tx2 + 14 * (1 - q); gp.position.set(sx2, ty2, 0); if (qOn) lab[3 + j4 % 3].pos(tx2, ty2 - 2.4, 0).set(a.q + '−', 'bl-neg').vis(q > 0.9); }
      var rr = ratio(), fm = fml(c, a, rr); var sis = sist(c, a, rr);
      lab[6].pos(0, 7, 0).set(fm, 'bl-lead').vis(true); lab[7].pos(0, -7.4, 0).set(stock(c, a), 'bl-pos').vis(q > 0.8);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.c) u.c.set(S.c); if (u.a) u.a.set(S.a); if (u.h !== undefined && u.h) u.h.set(S.h); },
    hud: function () { var c = CA[S.c], a = AN[S.a], r = ratio(); return { eq: { chip: fml(c, a, r), name: stock(c, a), body: '<div class="eqline"><small>Stock</small>' + stock(c, a) + "</div><div class=\"eqline\"><small>Systematic</small>" + (sist(c, a, r) || '—') + "</div><div class=\"eqline\"><small>Traditional</small>" + (c.trad ? trad(c, a) : stock(c, a)) + "</div><div class=\"eqline\"><small>Charge crisscross</small>" + c.q + '+ / ' + a.q + '− → ' + r.nc + ' : ' + r.na + '</div>' }, legend: [{ label: "Spheres above", color: '#ab5cf2', text: "cations (+)" }, { label: "Below", color: '#3ddc5a', text: "anions (−)" }] }; },
    measures: function () { var c = CA[S.c], a = AN[S.a], r = ratio(); return [["Formula", fml(c, a, r)], ["Cation", c.s + (c.q > 1 ? '^' + c.q + '+' : '⁺')], ["Anion", a.s + '^' + a.q + '−'], ["Cation : anion ratio", r.nc + ' : ' + r.na], ["Stock", stock(c, a)]]; },
    ideas: ["Crisscross: charge of one = subscript of the other (simplify).", "Fe, Cu, Pb: Roman numeral in Stock.", "-ite: fewer O · -ate: more O.", "-ide → hydro-…-ic acid · -ate → -ic · -ite → -ous."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Cation"); el.appendChild(c);
      ui.c = kit.ui.options({ label: "Cation", cols: 4, value: S.c, options: Object.keys(CA).map(function (k) { return { v: k, label: CA[k].s + (CA[k].q > 1 ? sup(CA[k].q) + '⁺' : '⁺') }; }), onChange: function (v) { ctx.goManual(); S.c = v; S.p = 0; } }); c.appendChild(ui.c);
      var d = kit.ui.card("Anion"); el.appendChild(d); ui.a = kit.ui.options({ label: "Anion", cols: 4, value: S.a, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].s }; }), onChange: function (v) { ctx.goManual(); S.a = v; S.p = 0; } }); d.appendChild(ui.a);
      ui.p = kit.ui.slider({ label: "Assembly", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); d.appendChild(kit.ui.sliders([ui.p]));
      ui.h = kit.ui.slider({ label: "Chlorine oxoanion (no. of O − 1)", min: 0, max: 3, step: 1, value: S.h, format: function (v) { return HAL[Math.max(0, Math.min(3, v | 0))][1]; }, onInput: function (v) { ctx.goManual(); S.h = Math.max(0, Math.min(3, v | 0)); } }); d.appendChild(kit.ui.sliders([ui.h]));
      d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      function sup(q) { return ['', '', '²', '³'][q] || ''; }
    },
    graphs: [{ title: "Oxidation state of Cl in its oxoanions", h: 200, note: "More oxygens → higher oxidation state and greater oxidizing power per oxygen… stability of the anion.", draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 14, B = 40, pw = w - L - Rr, ph = h - Tp - B, bw = pw / 4; cx.font = '10px system-ui'; cx.textAlign = 'center'; [1, 3, 5, 7].forEach(function (v, j) { cx.fillStyle = j === S.h ? '#ffa94d' : '#69db7c'; cx.fillRect(L + j * bw + 8, Tp + ph * (1 - v / 8), bw - 16, ph * v / 8); cx.fillStyle = col.ink; cx.fillText('+' + v, L + j * bw + bw / 2, Tp + ph * (1 - v / 8) - 3); cx.fillStyle = col.muted; cx.fillText(HAL[j][1], L + j * bw + bw / 2, h - B + 14); cx.fillText(HAL[j][0], L + j * bw + bw / 2, h - B + 28); });
    } }],
    calc: function () { var c = CA[S.c], a = AN[S.a], r = ratio(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }; return '<div class="card-kicker">' + stock(c, a) + '</div><table class="calc-table">' + row("Cation", c.s + ' ' + c.q + '+') + row("Anion", a.s + ' ' + a.q + '−') + row("LCM of the charges", String(c.q * a.q / gcd(c.q, a.q))) + row("Ratio", r.nc + " cation(s) × " + c.q + ' = ' + r.na + " anion(s) × " + a.q) + row("Formula", '<b>' + fml(c, a, r) + '</b>') + row("Systematic", sist(c, a, r) || "use Stock (polyatomic anion)") + row("Traditional", c.trad ? trad(c, a) : stock(c, a)) + '</table>'; },
    quiz: [
      { q: "The formula of aluminium oxide is…", options: ['Al₂O₃', "AlO", 'Al₃O₂', 'Al₂O'], answer: 0, why: "Crisscross: Al³⁺ and O²⁻." },
      { q: "FeCl₃ is called…", options: ["iron(III) chloride", "iron(II) chloride", "iron chlorate", "ferrous chloride"], answer: 0, why: 'Fe³⁺.' },
      { q: "The ClO₃⁻ ion is…", options: ["chlorate", "chlorite", "hypochlorite", "perchlorate"], answer: 0, why: "3 O: -ate." },
      { q: "H₂SO₃ is the acid…", options: ["sulfurous", "sulfuric", "hydrosulfuric", "persulfuric"], answer: 0, why: "-ite → -ous." },
      { q: "Ca(OH)₂ is called…", options: ["calcium hydroxide", "calcium oxide", "calcium peroxide", "calcium hydride"], answer: 0, why: "Cation + OH⁻." },
      { q: "Fe₂O₃ in systematic nomenclature is…", options: ["diiron trioxide", "iron oxide", "trihiron dioxide", "iron monoxide"], answer: 0, why: "Multiplicative prefixes." }
    ],
    help: { intro: "Choose a cation and an anion; the ions assemble in the proportion that balances the charges and the three names are shown. The oxoanion control goes through hypochlorite → perchlorate.", items: [['Ions', 'cations (+) above and anions (−) below; in polyatomic ions O is shown in red.'], ['Assembly', 'the ions combine in the ratio that cancels the charges, and the Stock, systematic and traditional names are shown.'], ['Controls', '“Cation”, “Anion” and “Chlorine oxoanion”, which runs from hypochlorite → chlorite → chlorate → perchlorate.'], ['Chart', '“Oxidation state of Cl in its oxoanions”.']], try: ['Combine Al³⁺ with O²⁻ and check the criss-cross rule: Al₂O₃.', 'Pick Fe³⁺ with Cl⁻ and compare the names: iron(III) chloride, iron trichloride and ferric chloride.', 'Go through the chlorine oxoanions and relate -ite / -ate to the number of O atoms.'] }
  };
  MSim.create(def);
})();
