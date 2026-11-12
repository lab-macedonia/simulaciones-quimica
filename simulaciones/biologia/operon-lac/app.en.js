/* Operón lac y regulación génica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var MU = { wt: "Wild-type strain", laci: "lacI⁻ mutant (no repressor)", laco: "lacOᶜ mutant (constitutive operator)" };
  var S = { lac: 0, glu: 0, mu: 'wt' }, g = null, rep = null, pol = null, cap = null, mr = [], en = [], lab = [], gene = {};
  function bound() { if (S.mu !== 'wt') return 0; return S.lac ? 0.02 : 0.98; }
  function capAct() { return S.glu ? 0.1 : 1; }
  function expr(lac, glu, mu) { var o = { lac: S.lac, glu: S.glu, mu: S.mu }; if (lac != null) { S.lac = lac; S.glu = glu; S.mu = mu; } var b = bound(), v = Math.max(0.01, (1 - b)) * (0.1 + 0.9 * capAct()) * 100; if (S.mu === 'laco' && S.glu === 0) v = 100 * 0.9 + 10; S.lac = o.lac; S.glu = o.glu; S.mu = o.mu; return Math.min(100, v); }
  function lvl() { return expr(); }
  function stages() {
    return [
      ["Operon components", "Components", "lacI encodes the repressor; P is the promoter; O the operator; lacZ, lacY and lacA the structural genes",
        "<p>The <b>lac operon</b> of <i>E. coli</i> groups three genes that are transcribed together: <b>lacZ</b> (β-galactosidase, which breaks down lactose), <b>lacY</b> (permease) and <b>lacA</b> (transacetylase). Upstream are the <b>promoter</b> (P) and the <b>operator</b> (O). The regulatory gene <b>lacI</b> produces the <b>repressor</b>, which binds to the operator.</p>"],
      ["Without lactose: repression", "Without lactose", "The repressor blocks the operator and RNA polymerase does not advance",
        "<p>Without lactose, the <b>LacI repressor</b> binds to the <b>operator</b> and <b>blocks</b> RNA polymerase: there is almost no transcription (basal expression ≈ 1–2 %). The cell does not spend energy on enzymes it does not need: this is <b>negative control</b>.</p>"],
      ["With lactose: induction", "With lactose", "Allolactose binds to the repressor and releases it from the operator",
        "<p>Lactose is converted into <b>allolactose</b>, the <b>inducer</b>, which binds to the repressor and changes its shape: the repressor <b>lets go</b> of the operator. RNA polymerase transcribes lacZYA, a polycistronic mRNA forms and all three enzymes appear.</p>"],
      ["Glucose and cAMP–CAP", "Glucose and CAP", "With glucose, cAMP is low, CAP–cAMP does not form and the promoter is weak",
        "<p><b>Glucose</b> is the preferred source. When it is abundant, <b>cAMP</b> is low and the activator <b>CAP</b> does not bind to the promoter: even with lactose, transcription is <b>low</b> (<b>catabolite repression</b>, positive control). Without glucose, <b>CAP–cAMP</b> helps recruit the polymerase and expression is maximal.</p>"],
      ["Mutants (challenge)", "Mutants", "lacI⁻ and lacOᶜ express without lactose",
        "<p>A <b>lacI⁻</b> mutant produces no functional repressor; a <b>lacOᶜ</b> mutant has an operator to which the repressor cannot bind. In both cases the operon is expressed <b>constitutively</b>, even without lactose. Predict the expression under each condition and check.</p>"]
    ];
  }
  var X = { I: 14, P: 17, O: 19.2, Z: 22, Y: 25, A: 28 };
  var def = {
    key: 'operon-lac', title: "The lac operon and gene regulation", subtitle: "3D Simulator · molecular biology", accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [15, 6, 22], target: [15, 1, 0] }, { id: 'frontal', label: "Front", pos: [15, 1, 26], target: [15, 1, 0] }],
    layers: [{ id: 'prod', label: "mRNA and enzymes", icon: '◉' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var dna = new T.Mesh(new T.BoxGeometry(16.5, 0.18, 0.5), new T.MeshStandardMaterial({ color: 0x748ffc })); dna.position.set(21.25, 0, 0); g.add(dna);
      function seg(k, w, c) { var m = new T.Mesh(new T.BoxGeometry(w, 0.9, 0.9), new T.MeshStandardMaterial({ color: c })); m.position.set(X[k], 0, 0); g.add(m); gene[k] = m; }
      seg('I', 1.8, 0x9775fa); seg('P', 1.4, 0x51cf66); seg('O', 0.9, 0xff6b6b); seg('Z', 2.4, 0xffa94d); seg('Y', 2.4, 0xffd43b); seg('A', 2.4, 0x63e6be);
      rep = new T.Mesh(new T.SphereGeometry(0.8, 18, 14), new T.MeshStandardMaterial({ color: 0x9775fa })); g.add(rep);
      pol = new T.Mesh(new T.SphereGeometry(0.9, 18, 14), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(pol);
      cap = new T.Mesh(new T.OctahedronGeometry(0.5), new T.MeshStandardMaterial({ color: 0xffd43b })); g.add(cap);
      for (i = 0; i < 6; i++) { var m = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xffe8cc })); g.add(m); mr.push(m); }
      for (i = 0; i < 9; i++) { var e = new T.Mesh(new T.SphereGeometry(0.35, 10, 8), new T.MeshStandardMaterial({ color: [0xffa94d, 0xffd43b, 0x63e6be][i % 3] })); g.add(e); en.push(e); }
      for (i = 0; i < 9; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 1) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 2) { S.lac = 1; S.glu = 0; S.mu = 'wt'; } if (i === 3) { S.lac = 1; S.glu = f.local < 0.5 ? 0 : 1; S.mu = 'wt'; } if (i === 4) { S.lac = 0; S.glu = 0; S.mu = f.local < 0.5 ? 'laci' : 'laco'; } }
      var b = bound(), v = lvl() / 100, th = ctx.now, on = ctx.layer('prod');
      var blocked = b > 0.5;
      rep.position.set(blocked ? X.O : X.I + 1.5 + Math.sin(th) * 0.5, blocked ? 1.1 : 3.2 + Math.cos(th * 0.8) * 0.4, 0); rep.visible = S.mu !== 'laci';
      rep.material.color.setHex(S.lac ? 0xd0bfff : 0x9775fa);
      gene.O.material.color.setHex(S.mu === 'laco' ? 0x7a0000 : 0xff6b6b);
      var u = (th * 0.25) % 1; var run = v > 0.3;
      pol.position.set(run ? X.P + 1 + u * (X.A + 1 - X.P - 1) : X.P - 0.3, run ? 1.3 : 2.3 + Math.sin(th) * 0.2, 0); pol.scale.setScalar(run ? 1 : 0.8);
      cap.visible = !S.glu; cap.position.set(X.P - 1.5, 1.2, 0);
      mr.forEach(function (m, j) { m.visible = on && j < Math.round(v * 6); m.position.set(X.P + 1 + j * 1.8, -1.4 - (j % 2) * 0.4, 0); });
      en.forEach(function (e, j) { e.visible = on && j < Math.round(v * 9); e.position.set(X.Z + (j % 5) * 1.3 - 1, -3 - Math.floor(j / 5) * 0.9, 0); });
      lab[0].pos(X.I, 1.7, 0).set('lacI', 'bl-d').vis(true); lab[1].pos(X.P, 1.7, 0).set('P', 'bl-d').vis(true); lab[2].pos(X.O, 3.2, 0).set('O', 'bl-d').vis(true);
      lab[3].pos(X.Z, 1.7, 0).set('lacZ', 'bl-d').vis(true); lab[4].pos(X.Y, 1.7, 0).set('lacY', 'bl-d').vis(true); lab[5].pos(X.A, 1.7, 0).set('lacA', 'bl-d').vis(true);
      lab[6].pos(21, 6.4, 0).set((S.mu === 'wt' ? (S.lac ? "With lactose" : "Without lactose") : MU[S.mu]) + ' · ' + (S.glu ? "with glucose" : "without glucose"), 'bl-lead').vis(true);
      lab[7].pos(21, -5.2, 0).set("Expression: " + fmt(v * 100, 0) + " % of maximum", v > 0.5 ? 'bl-pos' : 'bl-neg').vis(true);
      lab[8].pos(X.I + 1.5, 4.8, 0).set(S.mu === 'laci' ? "no functional repressor" : "repressor", 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lac) u.lac.set(S.lac); if (u.glu) u.glu.set(S.glu); if (u.mu) u.mu.set(S.mu); },
    hud: function () { return { eq: { chip: 'lac', name: "Regulation", body: "<div class=\"eqline\"><small>Repressor at O</small>" + fmt(bound() * 100, 0) + " %</div><div class=\"eqline\"><small>CAP–cAMP</small>" + (S.glu ? "inactive" : "active") + "</div><div class=\"eqline\"><small>Expression</small>" + fmt(lvl(), 0) + ' %</div>' }, legend: [{ label: "Purple sphere", color: '#9775fa', text: "LacI repressor" }, { label: "Blue sphere", color: '#4dabf7', text: "RNA polymerase" }, { label: "Octahedron", color: '#ffd43b', text: "CAP–cAMP" }] }; },
    measures: function () { return [["Strain", MU[S.mu]], ["Lactose", S.lac ? "present" : "absent"], ["Glucose", S.glu ? "present" : "absent"], ["Repressor bound to O", fmt(bound() * 100, 0) + ' %'], ["CAP–cAMP", S.glu ? "inactive" : "active"], ["β-galactosidase", fmt(lvl(), 0) + ' %']]; },
    ideas: ["Without lactose: repressor on O.", "Allolactose releases the repressor.", "Glucose → low cAMP → CAP inactive.", "lacI⁻ and lacOᶜ: constitutive expression."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Culture conditions"); el.appendChild(c);
      ui.lac = kit.ui.options({ label: "Lactose", cols: 2, value: S.lac, options: [{ v: 0, label: "Absent" }, { v: 1, label: "Present" }], onChange: function (v) { ctx.goManual(); S.lac = +v; } });
      ui.glu = kit.ui.options({ label: "Glucose", cols: 2, value: S.glu, options: [{ v: 0, label: "Absent" }, { v: 1, label: "Present" }], onChange: function (v) { ctx.goManual(); S.glu = +v; } });
      ui.mu = kit.ui.options({ label: "Strain", cols: 1, value: S.mu, options: Object.keys(MU).map(function (k) { return { v: k, label: MU[k] }; }), onChange: function (v) { ctx.goManual(); S.mu = v; } });
      c.appendChild(ui.lac); c.appendChild(ui.glu); c.appendChild(ui.mu); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Expression in the four conditions", h: 210, note: "Wild-type strain: relative β-galactosidase level.", draw: function (cx, w, h, col) {
      var d = [["−lac −glu", 0, 0], ["+lac −glu", 1, 0], ['+lac +glu', 1, 1], ["−lac +glu", 0, 1]], L = 10, B = 28, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var v = expr(x[1], x[2], 'wt'), hh = ph * v / 100, cur = (S.mu === 'wt' && S.lac === x[1] && S.glu === x[2]); cx.fillStyle = cur ? '#ff922b' : '#69db7c'; cx.fillRect(L + j * bw + 6, Tp + ph - hh, bw - 12, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(fmt(v, 0) + ' %', L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, c4 = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (x) { return (x[0] ? '+' : '−') + 'lac ' + (x[1] ? '+' : '−') + 'glu: <b>' + fmt(expr(x[0], x[1], 'wt'), 0) + ' %</b>'; }).join('<br>'); return '<div class="card-kicker">' + MU[S.mu] + '</div><table class="calc-table">' + row("Fraction of operator occupied", '<b>' + fmt(bound() * 100, 0) + ' %</b>') + row("CAP activation", '<b>' + fmt(capAct() * 100, 0) + " %</b> (factor 0.1 + 0.9·CAP)") + row("Expression", "(1 − occupancy) × activation = <b>" + fmt(lvl(), 0) + ' %</b>') + row("Wild type, 4 conditions", c4) + '</table>'; },
    quiz: [
      { q: "Without lactose, the LacI repressor…", options: ["binds to the operator and blocks transcription", "binds to the promoter and activates it", "is degraded", "binds to CAP"], answer: 0, why: "Negative control." },
      { q: "The true inducer of the lac operon is…", options: ["allolactose", "glucose", "cAMP", "β-galactosidase"], answer: 0, why: "It binds to the repressor and releases it." },
      { q: "With lactose and glucose, expression is…", options: ["low", "maximum", "always zero", "equal to that without lactose and without glucose"], answer: 0, why: "Catabolite repression: CAP inactive." },
      { q: "A lacOᶜ mutant…", options: ["is expressed without lactose", "is never expressed", "has no lacZ", "produces more repressor"], answer: 0, why: "The repressor does not recognize the operator." },
      { q: "The lacZ gene encodes…", options: ["β-galactosidase", "permease", "the repressor", "CAP"], answer: 0, why: "It hydrolyzes lactose into glucose and galactose." },
      { q: "CAP–cAMP acts as…", options: ["an activator (positive control)", "repressor", "inducer", "operator"], answer: 0, why: "It helps recruit RNA polymerase." }
    ],
    help: { intro: "Choose lactose, glucose and strain. You will see whether the repressor blocks the operator, whether the polymerase advances and how much mRNA and enzyme are formed.", items: [['Components', 'purple sphere = LacI repressor; blue sphere = RNA polymerase; octahedron = CAP–cAMP.'], ['Output', 'mRNA and enzymes (β-galactosidase) pile up at the bottom when the operon is transcribed.'], ['Controls', 'lactose and glucose (absent or present) and the strain: wild type or the lacI⁻ and lacOᶜ mutants.'], ['Chart', '“Expression in the four conditions” of lactose and glucose.']], try: ['Without lactose the repressor stays on the operator and no mRNA is made.', 'With lactose and no glucose expression is maximal; add glucose and it drops (low cAMP, inactive CAP).', 'Pick a lacI⁻ or lacOᶜ mutant: there is expression even without lactose (constitutive).'] }
  };
  MSim.create(def);
})();
