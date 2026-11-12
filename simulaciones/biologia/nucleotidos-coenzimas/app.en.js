/* Nucleótidos y coenzimas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CO = {
    atp: { n: 'ATP', vit: "— (synthesized de novo)", vn: '', mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "α-phosphate", 0xff922b, 'p'], ['P', "β-phosphate", 0xff922b, 'p'], ['P', "γ-phosphate", 0xff6b6b, 'p']], fn: "energy currency: ΔG°′ of hydrolysis ≈ −30.5 kJ/mol", e: -30.5 },
    nad: { n: 'NAD⁺ / NADH', vit: "Niacin (vitamin B3)", mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['R', "Ribose", 0xffd43b, 'sugar'], ['N', "Nicotinamide", 0x69db7c, 'ring']], fn: "hydride (H⁻) carrier in catabolic pathways; E°′ = −0.32 V", e: -0.32 },
    fad: { n: 'FAD / FADH₂', vit: "Riboflavin (vitamin B2)", mod: [['A', "Adenine", 0x4dabf7, 'base'], ['R', "Ribose", 0xffd43b, 'sugar'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['R', 'Ribitol', 0xffd43b, 'sugar'], ['F', "Isoalloxazine", 0xfab005, 'ring']], fn: "accepts 2 e⁻ and 2 H⁺; E°′ ≈ −0.22 V (varies when bound to the enzyme)", e: -0.22 },
    coa: { n: "Coenzyme A", vit: "Pantothenic acid (vitamin B5)", mod: [['A', "Adenine 3′-phosphate-ribose", 0x4dabf7, 'base'], ['P', "Pyrophosphate", 0xff922b, 'p'], ['B', "Pantothenate", 0xb197fc, 'sugar'], ['C', "β-mercaptoethylamine", 0xf06595, 'sugar'], ['S', "SH (thiol)", 0xe6c229, 'ring']], fn: "carries acyl groups through a high-energy thioester (acetyl-CoA: ΔG°′ ≈ −31.4 kJ/mol)", e: -31.4 }
  };
  var VIT = [['B1', "Thiamine", "TPP", "decarboxylations"], ['B2', "Riboflavin", 'FAD, FMN', 'redox (2 e⁻)'], ['B3', "Niacin", 'NAD⁺, NADP⁺', "hydrides"], ['B5', "Pantothenic acid", 'CoA', "acyl groups"], ['B6', "Pyridoxine", 'PLP', "amino acids"], ['B7', "Biotin", "biocytin", "carboxylations"], ['B9', "Folic acid", 'THF', "C₁ units"], ['B12', "Cobalamin", "methyl/adenosylcobalamin", "isomerizations"]];
  var S = { co: 'atp', p: 0, red: false }, g = null, lab = [], blocks = [], ez = null, hyd = null, wat = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function shape(kind, c) {
    var m = new T.MeshStandardMaterial({ color: c, roughness: 0.45, transparent: true, opacity: 0.95 }), gr = new T.Group(), k;
    if (kind === 'base') { for (k = 0; k < 2; k++) { var hx = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.35, k ? 5 : 6), m); hx.position.x = k * 1.5 - 0.7; gr.add(hx); } }
    else if (kind === 'sugar') { gr.add(new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.35, 5), m)); }
    else if (kind === 'p') { var tt = new T.Mesh(new T.TetrahedronGeometry(0.85), m); gr.add(tt); }
    else if (kind === 'ring') { for (k = 0; k < 3; k++) { var h2 = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.35, 6), m); h2.position.x = k * 1.3 - 1.3; if (k === 0) h2.position.x = -0.6; gr.add(h2); } gr.children[2].visible = true; }
    return gr;
  }
  function stages() {
    return [
      ["Nucleotides: three parts", "Nucleotide", "Nitrogenous base + pentose + one or more phosphates",
        "<p>A <b>nucleotide</b> consists of a <b>nitrogenous base</b> (purine or pyrimidine), a <b>pentose</b> (ribose or deoxyribose) and one to three <b>phosphates</b>. Besides being the monomers of DNA and RNA, they take part in cellular energy and signaling. The base joined to ribose by an <b>N-glycosidic</b> bond is a <b>nucleoside</b>; with phosphate, a nucleotide.</p>"],
      ["ATP: the energy currency", 'ATP', "Hydrolysis of the phosphoanhydride bond releases ≈ 30.5 kJ/mol",
        "<p><b>ATP</b> (adenosine triphosphate) has two high-energy <b>phosphoanhydride</b> bonds. Its hydrolysis to ADP + Pᵢ has <b>ΔG°′ ≈ −30.5 kJ/mol</b> and in the cell (real concentrations) ≈ −50 kJ/mol. This is explained by the <b>charge repulsion</b> between phosphates, the better solvation of the products and the <b>resonance stabilization</b> of Pᵢ. The energy is transferred by coupling reactions.</p>"],
      ["NAD⁺ and NADH", 'NAD⁺', "The nicotinamide ring receives a hydride ion (H⁻) at C4",
        "<p><b>Dehydrogenases</b> take 2 e⁻ and 2 H⁺ from the substrate: <b>NAD⁺</b> accepts a <b>hydride ion (H⁻)</b> at C4 of the nicotinamide ring, which goes from aromatic pyridinium to <b>1,4-dihydropyridine</b> (NADH), and an H⁺ is released. NADH absorbs at <b>340 nm</b> (NAD⁺ does not), a property used to follow enzymes. Move “Progress” to see the transfer.</p>"],
      ["FAD and coenzyme A", "FAD and CoA", "FAD: 2 e⁻ redox; CoA: transport of acyl groups through a thioester",
        "<p><b>FAD</b> (from riboflavin) accepts two H at N5 and N1 of the isoalloxazine and is the coenzyme of <b>succinate dehydrogenase</b> and <b>acyl-CoA dehydrogenase</b>. <b>Coenzyme A</b> ends in a <b>thiol (–SH)</b> that forms <b>thioesters</b> (acetyl-CoA), with a hydrolysis ΔG°′ similar to that of ATP: “activated” acyl groups.</p>"],
      ["Water-soluble vitamins → coenzymes", "Vitamins", "B vitamins are the precursors of the coenzymes",
        "<p>Many coenzymes derive from <b>B-complex vitamins</b>, which humans cannot synthesize and must obtain from the diet: <b>niacin→NAD⁺</b>, <b>riboflavin→FAD</b>, <b>pantothenic→CoA</b>, <b>thiamine→TPP</b>, <b>pyridoxine→PLP</b>, <b>folate→THF</b>, <b>biotin</b> and <b>B₁₂</b>. Their deficiency affects entire pathways (beriberi, pellagra, megaloblastic anemia…).</p>"]
    ];
  }
  var def = {
    key: 'nucleotidos-coenzimas', title: "Nucleotides and Coenzymes", subtitle: "3D Simulator · molecular biology", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 5, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 20, 2], target: [0, 0, 0] }],
    layers: [{ id: 'mod', label: "Modules", icon: '▤' }, { id: 'lab', label: "Labels", icon: 'A' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 5; i++) { var b = new T.Group(); g.add(b); blocks.push(b); }
      ez = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), new T.MeshBasicMaterial({ color: 0xfff3bf })); g.add(ez); hyd = ez;
      wat = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(wat);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, co; if (!P.manual) { S.co = ['atp', 'atp', 'nad', i === 3 ? (f.local < 0.5 ? 'fad' : 'coa') : 'nad', 'atp'][i]; S.p = i === 4 ? 0 : (i === 0 ? 0 : (f.local * (i === 3 ? 2 : 1)) % 1 * 1.0); }
      co = CO[S.co]; var q = sm(S.p), now = ctx.now, mOn = ctx.layer('mod'), lOn = ctx.layer('lab'), k;
      if (g.userData.k !== S.co) { g.userData.k = S.co; blocks.forEach(function (b, j) { while (b.children.length) b.remove(b.children[0]); if (co.mod[j]) b.add(shape(co.mod[j][3], co.mod[j][2])); }); }
      var n = co.mod.length, step = 3.0, x0 = -(n - 1) * step / 2;
      blocks.forEach(function (b, j) { b.visible = j < n && mOn; b.position.set(x0 + j * step, (j % 2 ? -0.4 : 0.4) * 0 + Math.sin(now + j) * 0.05, 0); b.rotation.y = 0; b.rotation.x = Math.PI / 2 - 0.3; });
      lab.forEach(function (l) { l.vis(false); });
      var extra = '';
      if (S.co === 'atp' && (S.p > 0 || P.manual)) { var last = blocks[4]; last.position.x += 2.8 * q; last.position.y += -1.2 * q; wat.visible = true; wat.position.set(blocks[3].position.x + 1.5 + 0 * q, 2.2 - 1.6 * q, 0); wat.scale.setScalar(1 - 0.4 * q); extra = q < 0.5 ? "H₂O attacks the γ phosphorus" : 'ATP + H₂O → ADP + Pᵢ'; } else wat.visible = false;
      ez.visible = false;
      if (S.co === 'nad') { var ring = blocks[4]; ring.children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(S.red || q > 0.5 ? 0x38d9a9 : 0x69db7c); }); }); ez.visible = true; ez.position.set(ring.position.x + 3.0 - 3.0 * sm(q), 2.4 - 1.0 * sm(q), 0); extra = q < 0.5 ? "NAD⁺ (aromatic ring, N⁺)" : "NADH (1,4-dihydropyridine): H⁻ at C4"; }
      if (S.co === 'fad') { extra = q < 0.5 ? "FAD (oxidized)" : "FADH₂ (reduced, 2 H at N1 and N5)"; blocks[4].children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(q > 0.5 ? 0xfff3bf : 0xfab005); }); }); }
      if (S.co === 'coa') { extra = q < 0.5 ? "CoA–SH (free thiol)" : "acetyl-CoA: CH₃CO–S–CoA thioester"; if (q > 0.5) { ez.visible = true; ez.material.color.setHex(0xff922b); ez.scale.setScalar(2); ez.position.set(blocks[4].position.x + 1.4, 0.2, 0); } }
      lab[0].pos(0, 5, 0).set(co.n, 'bl-lead').vis(true); lab[1].pos(0, -4.2, 0).set(extra || co.fn, 'bl-d').vis(true);
      co.mod.forEach(function (m, j) { lab[2 + j].pos(blocks[j].position.x, -2.2, 0).set(m[1], 'bl-d').vis(lOn && j < 5 && 2 + j < 8); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.co) u.co.set(S.co); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var c = CO[S.co]; return { eq: { chip: c.n.split(' ')[0], name: c.n, body: "<div class=\"eqline\"><small>Function</small>" + c.fn + "</div><div class=\"eqline\"><small>Vitamin</small>" + c.vit + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "nitrogenous base" }, { label: "Yellow", color: '#ffd43b', text: "pentose" }, { label: "Orange", color: '#ff922b', text: "phosphate" }] }; },
    measures: function () { var c = CO[S.co]; return [["Coenzyme", c.n], ["Precursor vitamin", c.vit], ["Modules", c.mod.map(function (m) { return m[1]; }).join(' – ')], ["Function", c.fn]]; },
    ideas: ["Nucleotide = base + pentose + phosphate(s).", "ATP → ADP + Pᵢ releases ≈ 30.5 kJ/mol.", "NAD⁺ accepts H⁻ at C4.", "B vitamins → coenzymes."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Coenzyme"); el.appendChild(c);
      ui.co = kit.ui.options({ label: "Choose", cols: 2, value: S.co, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n }; }), onChange: function (v) { ctx.goManual(); S.co = v; S.p = 0; } }); c.appendChild(ui.co);
      ui.p = kit.ui.slider({ label: "Reaction progress", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Free energy of hydrolysis (ΔG°′, kJ/mol)", h: 230, note: "High-energy compounds versus a simple ester.", draw: function (cx, w, h, col) {
        var D = [['PEP', -61.9], ['1,3-BPG', -49.4], ["Phosphocreatine", -43.1], ['ATP → ADP', -30.5], ["Acetyl-CoA", -31.4], ["Glucose-6-P", -13.8], ["Glycerol-3-P", -9.2]], L = 88, Rr = 28, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
        D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.co === 'atp' && d[0].indexOf('ATP') === 0) || (S.co === 'coa' && d[0] === 'Acetil-CoA'); cx.fillStyle = cur ? '#ffa94d' : '#4dabf7'; cx.fillRect(L, y + 4, pw * -d[1] / 65, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(d[1], 1), L + pw * -d[1] / 65 + 4, y + bh / 2 + 3); });
      } },
      { title: "B-complex vitamins and their coenzymes", h: 250, note: "Correspondence table.", draw: function (cx, w, h, col) {
        var rh = (h - 10) / (VIT.length + 1); cx.font = '10px system-ui'; cx.textAlign = 'left'; cx.fillStyle = col.muted; cx.fillText('Vit.', 4, rh - 4); cx.fillText("Name", 36, rh - 4); cx.fillText("Coenzyme", w * 0.42, rh - 4); cx.fillText("Function", w * 0.7, rh - 4);
        VIT.forEach(function (v, j) { var y = (j + 1) * rh + 4; cx.fillStyle = col.ink; cx.fillText(v[0], 4, y + rh - 5); cx.fillText(v[1], 36, y + rh - 5); cx.fillText(v[2], w * 0.42, y + rh - 5); cx.fillText(v[3], w * 0.7, y + rh - 5); cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(0, y + rh); cx.lineTo(w, y + rh); cx.stroke(); });
      } }
    ],
    calc: function () { var c = CO[S.co], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.co === 'atp') { var Q = 0.05, ratio = 1.0; return "<div class=\"card-kicker\">ΔG of ATP hydrolysis</div><table class=\"calc-table\">" + row('ΔG°′', "−30.5 kJ/mol") + row("Cellular conditions", '[ATP]/[ADP][Pᵢ] ≈ 10³ M⁻¹ → ΔG ≈ −50 kJ/mol') + row("Formula", 'ΔG = ΔG°′ + RT ln([ADP][Pᵢ]/[ATP])') + row("With 3 mM ATP, 0.3 mM ADP, 5 mM Pᵢ", "ΔG = −30.5 + 2.58 ln(0.0003·0.005/0.003) = <b>" + fmt(-30.5 + 2.58 * Math.log(0.0003 * 0.005 / 0.003), 1) + ' kJ/mol</b>') + '</table>'; } if (S.co === 'nad') return '<div class="card-kicker">NAD⁺ + 2H ⇌ NADH + H⁺</div><table class="calc-table">' + row('E°′', '−0,32 V') + row("ΔG°′ of the reduction (n = 2)", '−nFE°′ = <b>+' + fmt(2 * 96485 * 0.32 / 1000, 1) + " kJ/mol</b>: NADH is a strong e⁻ donor") + row("Absorption λ", "NADH 340 nm; NAD⁺ does not absorb") + row("Beer–Lambert law", "ε₃₄₀ = 6,220 M⁻¹cm⁻¹") + '</table>'; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row("Vitamin", c.vit) + row("Function", c.fn) + '</table>'; },
    quiz: [
      { q: "A nucleotide is composed of…", options: ["base + pentose + phosphate", "only base and phosphate", "amino acid + sugar", "fatty acid + glycerol"], answer: 0, why: "Nucleoside + phosphate(s)." },
      { q: "The precursor vitamin of NAD⁺ is…", options: ["niacin (B3)", "riboflavin (B2)", "thiamine (B1)", "biotin"], answer: 0, why: "Pellagra by deficiency." },
      { q: "NAD⁺ receives…", options: ["a hydride ion at C4", "a proton on N", "an O atom", "a phosphate"], answer: 0, why: "Reduction to 1,4-dihydropyridine." },
      { q: "Coenzyme A forms…", options: ["thioesters", "phosphate esters", "amides", "ethers"], answer: 0, why: "With its –SH group." },
      { q: "The hydrolysis of ATP to ADP + Pᵢ has ΔG°′ ≈…", options: ["−30.5 kJ/mol", "+30.5 kJ/mol", '0', "−300 kJ/mol"], answer: 0, why: "Exergonic reaction." }
    ],
    help: { intro: "Choose a coenzyme: its modular structure is shown. Move “Progress” to see ATP hydrolysis, hydride transfer to NAD⁺, FAD reduction or thioester formation.", items: [['Modules', 'each part has a colour: blue = nitrogenous base, yellow = pentose, orange = phosphate.'], ['“Choose”', 'switches molecule (ATP, NAD⁺, FAD, coenzyme A…); the structure is built module by module.'], ['“Reaction progress”', 'shows ATP hydrolysis, hydride transfer (white sphere) to NAD⁺, reduction of FAD or thioester formation with CoA.'], ['Charts', '“Free energy of hydrolysis (ΔG°′)” of phosphorylated compounds and the table “B-complex vitamins and their coenzymes”.']], try: ['With ATP, take the progress to the end: ATP → ADP + Pᵢ releases ≈ 30.5 kJ/mol.', 'With NAD⁺, watch which atom receives the hydride: C4 of the nicotinamide ring.', 'Use the table to find which vitamin each coenzyme comes from (NAD⁺ ← niacin, FAD ← riboflavin, CoA ← pantothenic acid).'] }
  };
  MSim.create(def);
})();
