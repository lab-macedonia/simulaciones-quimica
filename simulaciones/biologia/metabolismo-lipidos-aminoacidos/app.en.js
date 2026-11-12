/* Metabolismo de lípidos y aminoácidos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var STEP = [["Dehydrogenation (FAD)", "acyl-CoA dehydrogenase: forms the Cα=Cβ double bond and produces FADH₂"], ["Hydration", "enoyl-CoA hydratase: adds H₂O and forms 3-hydroxyacyl-CoA"], ["Dehydrogenation (NAD⁺)", "3-hydroxyacyl-CoA dehydrogenase: oxidizes to ketone and produces NADH"], ["Thiolysis", "thiolase: CoA-SH cleaves and releases acetyl-CoA; the chain becomes 2 C shorter"]];
  var AA = [['Ala', "pyruvate", "glucogenic"], ['Asp', "oxaloacetate", "glucogenic"], ['Glu', "α-ketoglutarate", "glucogenic"], ['Leu', "acetyl-CoA", "ketogenic"], ['Lys', "acetyl-CoA", "ketogenic"], ['Phe', "fumarate + acetoacetate", "mixed"], ['Ile', "succinyl-CoA + acetyl-CoA", "mixed"]];
  var S = { n: 16, p: 0, mode: 'chain', aa: 0 }, g = null, lab = [], atoms = [], bonds = [], acet = [], coa = null, tokens = [], shuttle = null, mem = [], amino = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function cyc() { return S.n / 2 - 1; }
  function atp() { return 7 * S.n - 6; }
  function setCyl(m, a, b, r) { var d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, Math.max(0.001, d.length()), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); }
  function stages() {
    return [
      ["Lipids as fuel", "Overview", "One gram of fat yields ≈ 9 kcal, more than double a carbohydrate",
        "<p><b>Triacylglycerols</b> are the most concentrated energy reserve (≈ 37 kJ/g versus ≈ 17 kJ/g for carbohydrates): they are highly reduced and stored without water. Lipases release <b>fatty acids</b> and glycerol; the fatty acids are oxidized in the <b>mitochondrial matrix</b> by <b>β-oxidation</b>, and amino acids are degraded after removal of the amino group.</p>"],
      ["Activation and transport with carnitine", "Transport", "Acyl-CoA does not cross the inner membrane: it does so as acyl-carnitine",
        "<p>In the cytosol <b>acyl-CoA synthetase</b> activates the fatty acid (RCOO⁻ + CoA + ATP → acyl-CoA + AMP + PPᵢ; <b>2 high-energy bonds</b> are spent). The inner mitochondrial membrane is impermeable to acyl-CoA: <b>CPT-I</b> converts it into <b>acyl-carnitine</b>, which enters through a translocase and <b>CPT-II</b> regenerates it in the matrix. CPT-I is the control point (inhibited by <b>malonyl-CoA</b>).</p>"],
      ["β-oxidation: four reactions per cycle", "β-oxidation", "Dehydrogenation, hydration, dehydrogenation and thiolysis",
        "<p>Each cycle repeats: <b>(1)</b> oxidation with <b>FAD</b> (FADH₂); <b>(2)</b> hydration; <b>(3)</b> oxidation with <b>NAD⁺</b> (NADH); <b>(4)</b> <b>thiolysis</b>, which releases a unit of <b>acetyl-CoA</b> (2 C) and leaves an acyl-CoA two carbons shorter. It repeats until only acetyl-CoA remains. Choose the chain length and advance.</p>"],
      ["ATP balance", "Balance", "A fatty acid of n carbons yields 7n − 6 ATP",
        "<p>A saturated fatty acid of <b>n</b> carbons (n even) requires <b>n/2 − 1</b> cycles and produces <b>n/2 acetyl-CoA</b> (10 ATP each in the Krebs cycle), <b>n/2 − 1 FADH₂</b> (1.5 ATP) and <b>n/2 − 1 NADH</b> (2.5 ATP); 2 ATP are subtracted for activation: <b>ATP = 7n − 6</b>. For palmitate (C16): <b>106 ATP</b>. With excess acetyl-CoA the liver forms <b>ketone bodies</b>.</p>"],
      ["Transamination", "Transamination", "The amino group passes to α-ketoglutarate forming glutamate (coenzyme: PLP)",
        "<p>To degrade an amino acid the amino group is removed first: an <b>aminotransferase</b> with <b>pyridoxal phosphate (PLP, vitamin B₆)</b> transfers the –NH₂ group to <b>α-ketoglutarate</b>, which forms <b>glutamate</b>, and the amino acid becomes its <b>α-keto acid</b>. It is a reversible reaction. Amino acids end up collecting their amino group in glutamate.</p>"],
      ["Urea cycle and carbon skeleton", "Urea", "NH₄⁺ → urea (liver); the skeleton enters the Krebs cycle or ketone bodies",
        "<p>Glutamate releases <b>NH₄⁺</b> (glutamate dehydrogenase), which is toxic and which the liver converts into <b>urea</b> in the <b>urea cycle</b> (consumes 4 high-energy bonds) and is excreted in the urine. Carbon skeletons are classified as <b>glucogenic</b> (give pyruvate or other Krebs intermediates → glucose) and <b>ketogenic</b> (give acetyl-CoA or acetoacetate → ketone bodies). Select the amino acid to see its fate.</p>"]
    ];
  }
  var def = {
    key: 'metabolismo-lipidos-aminoacidos', title: "Lipid and Amino Acid Metabolism", subtitle: "3D Simulator · biochemistry", accent: { dark: '#ff922b', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [2, 4, 24], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 26], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 4], target: [0, 0, 0] }],
    layers: [{ id: 'cof', label: "Coenzymes (FADH₂, NADH)", icon: '⚡' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 24; i++) { var a = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: i === 0 ? 0xff4d4d : 0x56606b })); g.add(a); atoms.push(a); var b = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); g.add(b); bonds.push(b); }
      coa = new T.Mesh(new T.SphereGeometry(0.7, 14, 10), new T.MeshStandardMaterial({ color: 0xe6c229 })); g.add(coa);
      for (i = 0; i < 12; i++) { var t = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), new T.MeshStandardMaterial({ color: i % 2 ? 0x4dabf7 : 0xfab005, emissive: i % 2 ? 0x1c7ed6 : 0xe67700, emissiveIntensity: 0.3 })); g.add(t); tokens.push(t); }
      for (i = 0; i < 3; i++) { var m = new T.Mesh(new T.BoxGeometry(i ? 26 : 26, 0.4, 7), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.4 })); m.position.set(0, -2 + i * 4, 0); m.visible = false; g.add(m); mem.push(m); }
      shuttle = new T.Mesh(new T.OctahedronGeometry(0.7), new T.MeshStandardMaterial({ color: 0xff922b })); g.add(shuttle);
      for (i = 0; i < 5; i++) { var bl = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 1.4), new T.MeshStandardMaterial({ color: [0x4dabf7, 0xffd43b, 0xfab005, 0x69db7c, 0xf06595][i], roughness: 0.5 })); bl.visible = false; g.add(bl); amino.push(bl); }
      for (i = 0; i < 10; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 1 ? 'trans' : (i >= 4 ? 'aa' : 'chain'); S.p = i === 0 ? 0.0 : Math.min(1, f.local * 1.05); if (i === 3) S.n = 4 + 2 * Math.round(f.local * 10); else if (i === 2 || i === 0) S.n = 16; if (i === 5) S.aa = Math.min(6, Math.floor(f.local * 7)); }
      lab.forEach(function (l) { l.vis(false); }); atoms.forEach(function (a) { a.visible = false; }); bonds.forEach(function (b) { b.visible = false; }); tokens.forEach(function (t) { t.visible = false; }); coa.visible = false; shuttle.visible = false; mem.forEach(function (m) { m.visible = false; }); amino.forEach(function (b) { b.visible = false; });
      var q = S.p, cOn = ctx.layer('cof');
      if (S.mode === 'chain') {
        var n = S.n, cy = cyc(), tot = q * cy, c = Math.min(cy - 1e-6, Math.floor(tot)), fr = tot - c, st = Math.min(3, Math.floor(fr * 4)); if (cy < 1) { c = 0; }
        if (q >= 1) { c = cy - 1; fr = 1; st = 3; }
        var pos = [], k; for (k = 0; k < n; k++) pos.push(V(-12 + k * 1.05, (k % 2 ? 0.55 : -0.55) + (k - 2 * (c + (fr > 0.99 ? 1 : 0))) * 0, 0));
        var done = Math.min(c + (st === 3 && fr > 0.9 ? 1 : 0) + (q >= 1 ? 0 : 0), cy);
        for (k = 0; k < n; k++) { var cut = k < 2 * done, a = atoms[k]; a.visible = true; a.position.copy(pos[k]); if (cut) { a.position.y += 3.5 + 0.8 * Math.floor(k / 2); a.position.x = -9 + (Math.floor(k / 2)) * 1.6 + (k % 2) * 0.8; a.material.color.setHex(0xffa94d); } else a.material.color.setHex(k === 2 * done ? 0xff4d4d : 0x56606b); if (k > 0) { var b = bonds[k]; var p0 = atoms[k - 1].position, p1 = a.position; var sameGroup = (k < 2 * done) === (k - 1 < 2 * done); b.visible = sameGroup || (k - 1 < 2 * done && k >= 2 * done && false); if (b.visible) setCyl(b, p0, p1, 0.07); } }
        coa.visible = true; coa.position.set(-13.2 + 2 * done * 0 + 0, 0, 0); coa.position.copy(pos[2 * done] ? pos[2 * done].clone().add(V(-1.4, 0, 0)) : V(0, 0, 0)); coa.scale.setScalar(0.8);
        var nT = Math.min(12, Math.floor(tot * 2 + (st >= 2 ? 0 : 0))); for (k = 0; k < Math.min(12, Math.floor(tot) * 2 + (st >= 0 && fr > 0.25 ? 1 : 0) + (st >= 2 ? 1 : 0)); k++) { var tk = tokens[k]; tk.visible = cOn; tk.position.set(-12 + (k % 6) * 1.0 + 6, -4 - Math.floor(k / 6) * 0.9, 0); }
        lab[0].pos(0, 6.2, 0).set("Fatty acid C" + n + " · cycle " + Math.min(cy, c + 1) + ' de ' + cy, 'bl-lead').vis(true);
        lab[1].pos(0, -7, 0).set(q >= 1 ? "Products: " + (n / 2) + " acetyl-CoA · " + cy + ' FADH₂ · ' + cy + ' NADH' : "Reaction " + (st + 1) + ': ' + STEP[st][0], 'bl-d').vis(true);
        lab[2].pos(2, -5.8, 0).set(q >= 1 ? '' : STEP[st][1], 'bl-d').vis(q < 1);
        lab[3].pos(-9, 5.4, 0).set("acetyl-CoA released: " + done, 'bl-pos').vis(true); lab[4].pos(7, -4, 0).set("⚡ FADH₂ (orange) · NADH (blue)", 'bl-d').vis(cOn);
      } else if (S.mode === 'trans') {
        mem.forEach(function (m, j) { m.visible = j !== 1; m.position.y = -4 + j * 6; }); mem[0].position.y = -5; mem[2].position.y = 4;
        var u = sm(q), x = -8 + 16 * u, yy = 7 - 14 * u; shuttle.visible = true; shuttle.position.set(x * 0.2, yy * 0.9, 0); shuttle.rotation.y = now;
        var stg = u < 0.33 ? "cytosol: acyl-CoA → CPT-I → acyl-carnitine" : (u < 0.66 ? "translocase: crosses the inner membrane" : "matrix: CPT-II regenerates acyl-CoA");
        lab[0].pos(0, 9.5, 0).set("Intermembrane space → mitochondrial matrix", 'bl-lead').vis(true); lab[1].pos(0, -9.5, 0).set(stg, 'bl-d').vis(true); lab[2].pos(11, 7, 0).set('citosol', 'bl-d').vis(true); lab[3].pos(11, 0, 0).set("intermembrane space", 'bl-d').vis(true); lab[4].pos(11, -7, 0).set('matriz', 'bl-d').vis(true);
        mem[0].visible = true; mem[2].visible = true; mem[0].position.y = 4; mem[2].position.y = -4;
      } else {
        var aa = AA[S.aa], t = sm(Math.min(1, q * 1.2)); amino.forEach(function (b, j) { b.visible = true; b.rotation.y = now * 0.2; });
        amino[0].position.set(-8, 2, 0); amino[1].position.set(-8, -2.5, 0); amino[2].position.set(8, 2, 0); amino[3].position.set(8, -2.5, 0); amino[4].position.set(0, 0, 0); amino[0].material.color.setHex(0x4dabf7); amino[1].material.color.setHex(0xffd43b); amino[2].material.color.setHex(0xfab005); amino[3].material.color.setHex(0x69db7c);
        var nh = new T.Vector3(-8 + 16 * t, 2 - 0 * t, 0); amino[4].position.set(nh.x, nh.y + 1.2 * Math.sin(Math.PI * t), 0); amino[4].scale.setScalar(0.5);
        lab[0].pos(-8, 5, 0).set(aa[0] + " (amino acid)", 'bl-lead').vis(true); lab[1].pos(8, 5, 0).set("α-ketoglutarate → glutamate", 'bl-lead').vis(true); lab[2].pos(-8, -5.5, 0).set("α-keto acid: " + aa[1], 'bl-d').vis(true); lab[3].pos(0, 3.4, 0).set("–NH₂ (via PLP)", 'bl-warn').vis(true); lab[4].pos(0, -7.5, 0).set(aa[0] + ' es ' + aa[2] + ": skeleton → " + aa[1], 'bl-pos').vis(true);
        amino[1].visible = true; amino[2].visible = true; amino[3].visible = true;
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.n) u.n.set(S.n); if (u.p && !ctx.P.manual) u.p.set(S.p); if (u.aa) u.aa.set(S.aa); },
    hud: function () { return { eq: { chip: 'C' + S.n, name: "Fatty acid C" + S.n, body: "<div class=\"eqline\"><small>Cycles</small>" + cyc() + "</div><div class=\"eqline\"><small>Acetyl-CoA</small>" + S.n / 2 + '</div><div class="eqline"><small>FADH₂ / NADH</small>' + cyc() + ' / ' + cyc() + "</div><div class=\"eqline\"><small>Net ATP</small>" + atp() + '</div>' }, legend: [{ label: "Orange", color: '#fab005', text: "FADH₂ (1.5 ATP)" }, { label: "Blue", color: '#4dabf7', text: "NADH (2.5 ATP)" }] }; },
    measures: function () { return [["Fatty acid", 'C' + S.n + " saturated"], ["β-oxidation cycles", String(cyc())], ["Acetyl-CoA", String(S.n / 2)], ['FADH₂ / NADH', cyc() + ' / ' + cyc()], ["Net ATP", String(atp())], ["ATP per carbon", fmt(atp() / S.n, 2)]]; },
    ideas: ["n/2 − 1 cycles for a fatty acid of n C.", "Net ATP = 7n − 6 (palmitate: 106).", "CPT-I regulates entry into the mitochondrion.", "Amino acids: transamination → urea and C skeleton."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Fatty acid"); el.appendChild(c);
      ui.n = kit.ui.slider({ label: "No. of carbons", min: 4, max: 24, step: 2, value: S.n, format: function (v) { return 'C' + v; }, onInput: function (v) { ctx.goManual(); S.mode = 'chain'; S.n = v; } });
      ui.p = kit.ui.slider({ label: "Progress", min: 0, max: 1, step: 0.005, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.n, ui.p]));
      c.appendChild(ctx.btnRow([{ t: "β-oxidation", fn: function () { ctx.goManual(); S.mode = 'chain'; } }, { t: "Transport", fn: function () { ctx.goManual(); S.mode = 'trans'; } }, { t: "Amino acids", fn: function () { ctx.goManual(); S.mode = 'aa'; } }]));
      var d = kit.ui.card("Amino acid"); el.appendChild(d); ui.aa = kit.ui.options({ label: "Amino acid", cols: 4, value: S.aa, options: AA.map(function (a, i) { return { v: i, label: a[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'aa'; S.aa = +v; } }); d.appendChild(ui.aa); d.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Net ATP versus chain length", h: 240, note: "ATP = 7n − 6. Dot: your fatty acid. Reference: glucose ≈ 30–32 ATP.", draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, mx = 170; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 4; i <= 24; i += 4) cx.fillText('C' + i, L + pw * (i - 4) / 20, h - B + 14); cx.textAlign = 'right'; for (i = 0; i <= 150; i += 50) cx.fillText(i, L - 4, Tp + ph * (1 - i / mx) + 3);
      cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 4; i <= 24; i += 2) { (i > 4 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (i - 4) / 20, Tp + ph * (1 - (7 * i - 6) / mx)); } cx.stroke(); cx.lineWidth = 1;
      cx.strokeStyle = '#69db7c'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - 31 / mx)); cx.lineTo(L + pw, Tp + ph * (1 - 31 / mx)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#69db7c'; cx.textAlign = 'left'; cx.fillText("glucose", L + 4, Tp + ph * (1 - 31 / mx) - 3);
      cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.n - 4) / 20, Tp + ph * (1 - atp() / mx), 5, 0, 6.28); cx.fill();
    } }],
    calc: function () { var n = S.n, cy = cyc(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">C balance" + n + '</div><table class="calc-table">' + row("Cycles", 'n/2 − 1 = ' + cy) + row("Acetyl-CoA", n / 2 + ' × 10 = ' + 5 * n + ' ATP') + row('FADH₂', cy + ' × 1,5 = ' + fmt(1.5 * cy, 1) + ' ATP') + row("NADH", cy + ' × 2,5 = ' + fmt(2.5 * cy, 1) + ' ATP') + row("Activation", '−2 ATP') + row('Total', '<b>' + atp() + ' ATP</b> (7n − 6)') + '</table>'; },
    quiz: [
      { q: "Palmitate (C16) undergoes… cycles of β-oxidation.", options: ['7', '8', '16', '6'], answer: 0, why: 'n/2 − 1 = 7.' },
      { q: "The net ATP of palmitate is…", options: ['106', '129', '32', '12'], answer: 0, why: '7·16 − 6.' },
      { q: "Carnitine transports…", options: ["acyl groups into the matrix", "glucose", 'O₂', "NADH"], answer: 0, why: "Acyl-carnitine shuttle." },
      { q: "Transamination requires as coenzyme…", options: ["PLP (vitamin B6)", 'FAD', "biotin", "TPP"], answer: 0, why: "Pyridoxal phosphate." },
      { q: "NH₄⁺ is eliminated mainly as…", options: ['urea', "gaseous ammonia", "glucose", "uric acid"], answer: 0, why: "Urea cycle in the liver." },
      { q: "A ketogenic amino acid gives rise to…", options: ["acetyl-CoA", "oxaloacetate", "net glucose", 'urea'], answer: 0, why: "Leucine and lysine." }
    ],
    help: { intro: "Choose the chain length and advance to see each β-oxidation cycle; with the buttons you switch to transport or to amino acids.", items: [['Chain', 'the fatty acid loses 2 C in each β-oxidation cycle; each orange sphere is a released acetyl-CoA.'], ['Coenzymes', 'orange cubes = FADH₂ (1.5 ATP) and blue cubes = NADH (2.5 ATP); show or hide them with their layer.'], ['Controls', '“No. of carbons” sets the chain length and “Progress” steps through the cycles; the buttons switch to “Transport” (carnitine) or “Amino acids”, where you pick the amino acid.'], ['Chart', '“Net ATP versus chain length” (7n − 6 for a saturated acid with n C).']], try: ['With 16 C count the cycles: there should be n/2 − 1 = 7, giving 8 acetyl-CoA.', 'Change the length and check in the chart that net ATP follows 7n − 6 (palmitate: 106).', 'In “Amino acids” follow the amino group: it goes through transamination (PLP) and ends up as urea.'] }
  };
  MSim.create(def);
})();
