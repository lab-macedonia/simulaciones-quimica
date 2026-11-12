/* Fármacos y receptores — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var LG = { ag: { n: "Full agonist", e: 1, c: 0x40c057 }, pa: { n: "Partial agonist", e: 0.4, c: 0xfab005 }, an: { n: "Antagonist", e: 0, c: 0xfa5252 } };
  var DR = { asp: { n: "Aspirin", mw: 180, lp: 1.2, hd: 1, ha: 4 }, ibu: { n: "Ibuprofen", mw: 206, lp: 3.5, hd: 1, ha: 2 }, par: { n: "Paracetamol (acetaminophen)", mw: 151, lp: 0.5, hd: 2, ha: 2 }, ato: { n: "Atorvastatin", mw: 559, lp: 5.7, hd: 4, ha: 7 }, cic: { n: "Cyclosporine", mw: 1203, lp: 3, hd: 5, ha: 12 } };
  var S = { lg: 'ag', logL: -7, logKd: -7, antag: false, logB: -7, logKb: -8, dr: 'asp', mode: 'rec' }, g = null, lab = [], recs = [], lig = [], rnd = [], drs = [];
  function occ(L, Kd, B, Kb) { return L / (L + Kd * (1 + B / Kb)); }
  function resp(logL, e, withB) { var L = Math.pow(10, logL), Kd = Math.pow(10, S.logKd), B = withB ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return e * occ(L, Kd, B, Kb); }
  function lip(d) { var v = (d.mw > 500 ? 1 : 0) + (d.lp > 5 ? 1 : 0) + (d.hd > 5 ? 1 : 0) + (d.ha > 10 ? 1 : 0); return v; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Receptors and ligands", "Receptor", "A drug binds reversibly to its receptor: occupancy = [L]/([L] + Kd)",
        "<p>A <b>receptor</b> is a protein (in the membrane or inside the cell) that recognizes a <b>ligand</b> with high affinity and specificity. Binding is reversible, L + R ⇌ LR, with dissociation constant <b>K<sub>d</sub> = [L][R]/[LR]</b>: the lower the K<sub>d</sub>, the higher the affinity. The fraction of occupied receptors is <b>[L]/([L] + K<sub>d</sub>)</b>: 50 % when [L] = K<sub>d</sub>.</p>"],
      ["Agonists, partial agonists and antagonists", "Efficacy", "Efficacy (e) distinguishes what the drug does once bound",
        "<p><b>Affinity</b> is the ability to bind; <b>efficacy</b> is the ability to <b>activate</b> the receptor. The <b>full agonist</b> (e = 1) produces the maximum response; the <b>partial</b> one (0 &lt; e &lt; 1) produces a smaller response even when occupying all the receptors; the <b>antagonist</b> (e = 0) binds without activating and <b>blocks</b> the agonist. Change the type of ligand and watch the illuminated receptors.</p>"],
      ["Dose–response curve", "Dose–response", "Response versus log[L]: sigmoid with EC₅₀ at the midpoint",
        "<p>The <b>dose–response curve</b> (response versus log [L]) is a sigmoid. The <b>EC<sub>50</sub></b> is the concentration that produces 50 % of the maximum effect, and measures <b>potency</b>; the <b>E<sub>max</sub></b> measures efficacy. A partial agonist has a lower E<sub>max</sub>. With a simple model (no amplification), EC<sub>50</sub> = K<sub>d</sub>.</p>"],
      ["Competitive antagonism", "Antagonist", "The antagonist shifts the curve to the right without reducing the Emax",
        "<p>A <b>competitive antagonist</b> competes for the same site. It decreases the occupancy by the agonist: <b>[A]/([A] + K<sub>d</sub>(1 + [B]/K<sub>b</sub>))</b>. The curve <b>shifts to the right</b> (EC<sub>50</sub> increases) but <b>keeps the E<sub>max</sub></b>: it is overcome with more agonist. The shift (dose ratio) is <b>1 + [B]/K<sub>b</sub></b> (Schild analysis).</p>"],
      ["From molecule to medicine", 'Lipinski', "Lipinski's rules: MW ≤ 500 · logP ≤ 5 · H donors ≤ 5 · H acceptors ≤ 10",
        "<p>For a drug to be absorbed <b>orally</b>, it should meet <b>Lipinski's rule of five</b>: molar mass ≤ 500 g/mol, logP ≤ 5, ≤ 5 H-bond donors and ≤ 10 acceptors. More than one violation predicts poor absorption or permeability. There are exceptions (cyclosporine, natural products). Choose a drug and compare its properties.</p>"]
    ];
  }
  var def = {
    key: 'farmacos-receptores', title: "Drugs and Receptors", subtitle: "3D Simulator · biochemistry and pharmacology", accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [0, 10, 18], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 24, 2], target: [0, 0, 0] }],
    layers: [{ id: 'lig', label: "Ligands", icon: '●' }, { id: 'act', label: "Active receptors", icon: '✦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var mb = new T.Mesh(new T.BoxGeometry(22, 0.6, 14), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.45 })); mb.position.y = -1; g.add(mb);
      var seed = 7; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (i = 0; i < 40; i++) { var rc = new T.Mesh(new T.CylinderGeometry(0.55, 0.45, 2.2, 10), new T.MeshStandardMaterial({ color: 0x74c0fc, roughness: 0.5, emissive: 0x000000 })); rc.position.set(-9.5 + (i % 10) * 2.1, 0.2, -5 + Math.floor(i / 10) * 3.3 + (i % 2) * 0.4); g.add(rc); recs.push(rc); var lg = new T.Mesh(new T.SphereGeometry(0.45, 12, 8), new T.MeshStandardMaterial({ color: 0x40c057 })); lg.position.copy(rc.position).add(new T.Vector3(0, 1.5, 0)); g.add(lg); lig.push(lg); rnd.push([r(), r()]); }
      for (i = 0; i < 5; i++) { var bar = new T.Mesh(new T.BoxGeometry(1.6, 1, 1.6), new T.MeshStandardMaterial({ color: 0x4dabf7 })); bar.visible = false; g.add(bar); drs.push(bar); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 4 ? 'lip' : 'rec'; if (i === 0) { S.lg = 'ag'; S.antag = false; S.logL = -9 + 4 * Math.min(1, f.local * 1.1); } if (i === 1) { S.lg = ['ag', 'pa', 'an'][Math.min(2, Math.floor(f.local * 3))]; S.logL = -5.5; S.antag = false; } if (i === 2) { S.lg = 'ag'; S.logL = -9 + 5 * f.local; S.antag = false; } if (i === 3) { S.lg = 'ag'; S.antag = true; S.logL = -9 + 5 * f.local; } if (i === 4) S.dr = Object.keys(DR)[Math.min(4, Math.floor(f.local * 5))]; }
      lab.forEach(function (l) { l.vis(false); }); drs.forEach(function (b) { b.visible = false; });
      var lOn = ctx.layer('lig'), aOn = ctx.layer('act');
      if (S.mode === 'lip') {
        recs.forEach(function (r) { r.visible = false; }); lig.forEach(function (l) { l.visible = false; }); var d = DR[S.dr], vals = [d.mw / 500, d.lp / 5, d.hd / 5, d.ha / 10], names = ["MW ≤ 500", 'logP ≤ 5', 'HBD ≤ 5', 'HBA ≤ 10'];
        vals.forEach(function (v, j) { var b = drs[j]; b.visible = true; var hh = Math.max(0.2, v * 6); b.scale.y = hh; b.position.set(-7.5 + j * 5, hh / 2 - 1, 0); b.material.color.setHex(v > 1 ? 0xfa5252 : 0x40c057); lab[j].pos(-7.5 + j * 5, -2.6, 0).set(names[j], 'bl-d').vis(true); });
        lab[4].pos(0, 8.6, 0).set(d.n + ' · infracciones: ' + lip(d), lip(d) > 1 ? 'bl-neg' : 'bl-pos').vis(true); lab[5].pos(0, -4.4, 0).set("height = value / limit (1 = Lipinski limit)", 'bl-d').vis(true); return;
      }
      var e = LG[S.lg].e, L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), oL = L / (L + Kd * (1 + B / Kb)), oB = (S.antag ? (B / Kb) / (1 + B / Kb + L / Kd) : 0) * 1, tot = 1 + L / Kd + B / Kb; oB = (B / Kb) / tot; oL = (L / Kd) / tot;
      var nL = 0, nB = 0, nA = 0;
      recs.forEach(function (r, j) { var u = rnd[j][0], v = rnd[j][1], state = u < oL ? 'L' : (u < oL + oB ? 'B' : 'F'), act = state === 'L' && v < e; lig[j].visible = lOn && state !== 'F'; lig[j].material.color.setHex(state === 'L' ? LG[S.lg].c : 0xfa5252); lig[j].position.y = 1.5 + 0.1 * Math.sin(now * 2 + j); r.material.emissive.setHex(act && aOn ? 0xfab005 : 0x000000); r.material.emissiveIntensity = 0.8; r.visible = true; if (state === 'L') nL++; if (state === 'B') nB++; if (act) nA++; });
      lab[0].pos(0, 6.6, 0).set(LG[S.lg].n + ' · [L] = ' + (L < 1e-6 ? fmt(L * 1e9, 1) + ' nM' : fmt(L * 1e6, 2) + ' µM'), 'bl-lead').vis(true);
      lab[1].pos(0, -4.6, 0).set("occupancy " + fmt(oL * 100, 0) + " % · response " + fmt(e * oL * 100, 0) + " % of maximum" + (S.antag ? " · antagonist occupies " + fmt(oB * 100, 0) + ' %' : ''), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lg) u.lg.set(S.lg); if (u.L) u.L.set(S.logL); if (u.dr) u.dr.set(S.dr); },
    hud: function () { var L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), o = L / (L + Kd * (1 + B / Kb)), e = LG[S.lg].e; return { eq: { chip: fmt(o * 100, 0) + '%', name: LG[S.lg].n, body: "<div class=\"eqline\"><small>Occupancy</small>" + fmt(o * 100, 1) + " %</div><div class=\"eqline\"><small>Efficacy e</small>" + fmt(e, 1) + "</div><div class=\"eqline\"><small>Response</small>" + fmt(e * o * 100, 1) + " %</div><div class=\"eqline\"><small>Apparent EC₅₀</small>" + fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM</div>' }, legend: [{ label: "Green", color: '#40c057', text: "bound agonist" }, { label: "Red", color: '#fa5252', text: "bound antagonist" }, { label: "Yellow receptor", color: '#fab005', text: "activated receptor" }] }; },
    measures: function () { var Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return [["Ligand", LG[S.lg].n], ['Kd', fmt(Kd * 1e9, 1) + ' nM'], ['log[L]', fmt(S.logL, 1)], ["Antagonist", S.antag ? fmt(B * 1e9, 1) + ' nM (Kb ' + fmt(Kb * 1e9, 1) + ' nM)' : "absent"], ["Dose ratio", fmt(1 + B / Kb, 2)]]; },
    ideas: ["Occupancy = [L]/([L] + Kd).", "Affinity ≠ efficacy.", "Competitive antagonist: curve to the right, same Emax.", "Lipinski: ≤ 1 violation for oral route."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Ligand"); el.appendChild(c);
      ui.lg = kit.ui.options({ label: "Type", cols: 1, value: S.lg, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n, sub: 'e = ' + LG[k].e }; }), onChange: function (v) { ctx.goManual(); S.mode = 'rec'; S.lg = v; } }); c.appendChild(ui.lg);
      ui.L = kit.ui.slider({ label: 'log [L] (M)', min: -10, max: -3, step: 0.1, value: S.logL, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'rec'; S.logL = v; } });
      var sk = kit.ui.slider({ label: 'log Kd (M)', min: -9, max: -5, step: 0.1, value: S.logKd, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.logKd = v; } });
      var sb = kit.ui.slider({ label: "log [antagonist] (M)", min: -10, max: -4, step: 0.1, value: S.logB, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.antag = true; S.logB = v; } });
      c.appendChild(kit.ui.sliders([ui.L, sk, sb]));
      c.appendChild(ctx.btnRow([{ t: "Antagonist: yes/no", fn: function () { ctx.goManual(); S.antag = !S.antag; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var d = kit.ui.card('Lipinski'); el.appendChild(d); ui.dr = kit.ui.options({ label: "Drug", cols: 2, value: S.dr, options: Object.keys(DR).map(function (k) { return { v: k, label: DR[k].n }; }), onChange: function (v) { ctx.goManual(); S.mode = 'lip'; S.dr = v; } }); d.appendChild(ui.dr);
    },
    graphs: [
      { title: "Dose–response curve", h: 250, note: "Green line: agonist alone. Red line: with antagonist (shifted). Dot: your dose.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, e = LG[S.lg].e; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = -10; i <= -3; i++) cx.fillText(i, L + pw * (i + 10) / 7, h - B + 14); cx.fillText("log [L]", L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(i * 25 + '%', L - 4, Tp + ph * (1 - i / 4) + 3);
        function crv(withB, color) { cx.strokeStyle = color; cx.lineWidth = 2; cx.beginPath(); for (var k = 0; k <= 100; k++) { var lg = -10 + 7 * k / 100; (k ? cx.lineTo : cx.moveTo).call(cx, L + pw * (lg + 10) / 7, Tp + ph * (1 - resp(lg, Math.max(e, 0.001), withB))); } cx.stroke(); }
        crv(false, '#40c057'); if (S.antag) crv(true, '#fa5252'); cx.lineWidth = 1;
        var rr = resp(S.logL, e, S.antag); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.logL + 10) / 7, Tp + ph * (1 - rr), 5, 0, 6.28); cx.fill();
        cx.strokeStyle = col.muted; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - e / 2)); cx.lineTo(L + pw, Tp + ph * (1 - e / 2)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: "Lipinski's rule", h: 220, note: "Bars: drug value / limit. Red = exceeds the limit.", draw: function (cx, w, h, col) {
        var d = DR[S.dr], D = [["MW", d.mw / 500, d.mw + " g/mol"], ['logP', d.lp / 5, fmt(d.lp, 1)], ["H donors", d.hd / 5, String(d.hd)], ["H acceptors", d.ha / 10, String(d.ha)]], L = 88, Rr = 50, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / 4; cx.font = '10px system-ui';
        D.forEach(function (a, j) { var y = Tp + j * bh, v = Math.min(2.4, a[1]); cx.fillStyle = a[1] > 1 ? '#fa5252' : '#40c057'; cx.fillRect(L, y + 5, pw * v / 2.4, bh - 10); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(a[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(a[2], L + pw * v / 2.4 + 4, y + bh / 2 + 3); });
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw / 2.4, Tp); cx.lineTo(L + pw / 2.4, h - B); cx.stroke(); cx.setLineDash([]);
      } }
    ],
    calc: function () { var Kd = Math.pow(10, S.logKd), L = Math.pow(10, S.logL), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'lip') { var d = DR[S.dr]; return '<div class="card-kicker">' + d.n + '</div><table class="calc-table">' + row("Molar mass", d.mw + ' g/mol ' + (d.mw > 500 ? '✗' : '✓')) + row('logP', fmt(d.lp, 1) + (d.lp > 5 ? ' ✗' : ' ✓')) + row("H donors", d.hd + (d.hd > 5 ? ' ✗' : ' ✓')) + row("H acceptors", d.ha + (d.ha > 10 ? ' ✗' : ' ✓')) + row("Violations", '<b>' + lip(d) + '</b> → ' + (lip(d) > 1 ? "probable poor oral absorption" : "good oral candidate")) + '</table>'; } var o = L / (L + Kd * (1 + B / Kb)); return "<div class=\"card-kicker\">Occupancy</div><table class=\"calc-table\">" + row('[L]', fmt(L * 1e9, 2) + ' nM') + row('Kd', fmt(Kd * 1e9, 2) + ' nM') + row('Factor 1 + [B]/Kb', fmt(1 + B / Kb, 2)) + row("Occupancy", '[L]/([L] + Kd·f) = <b>' + fmt(o * 100, 1) + ' %</b>') + row("Response = e × occupancy", fmt(LG[S.lg].e, 1) + ' × ' + fmt(o, 3) + ' = <b>' + fmt(LG[S.lg].e * o * 100, 1) + ' %</b>') + row("Apparent EC₅₀", fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM') + '</table>'; },
    quiz: [
      { q: "If [L] = Kd, the occupancy is…", options: ['50 %', '100 %', '10 %', '0 %'], answer: 0, why: '[L]/([L] + Kd) = ½.' },
      { q: "An antagonist has efficacy…", options: ["zero", "one", "greater than one", "always negative"], answer: 0, why: "It binds without activating." },
      { q: "A competitive antagonist shifts the curve…", options: ["to the right, with the same Emax", "to the left", "reduces the Emax", "does not change"], answer: 0, why: "It increases the EC₅₀." },
      { q: "A partial agonist…", options: ["does not reach the Emax of the full one", "always blocks", "has Kd = 0", "does not bind"], answer: 0, why: 'e < 1.' },
      { q: "Lipinski's rule sets as the maximum molar mass…", options: ["500 g/mol", "1000 g/mol", "150 g/mol", "5000 g/mol"], answer: 0, why: "For oral absorption." }
    ],
    help: { intro: "Each cylinder is a receptor; the green spheres are bound agonists and the red ones, antagonists. A yellow receptor is activated. In “Lipinski” you see the four properties of a drug.", items: [['Receptors', 'each cylinder is a receptor and turns yellow when activated; the share of yellow receptors reflects the response.'], ['Ligands', 'green spheres = bound agonist; red spheres = bound antagonist (it occupies the receptor without activating it).'], ['“Lab” controls', '“Type” picks the ligand (full agonist, partial agonist or antagonist); “log [L]” and “log Kd” set the occupancy = [L]/([L] + Kd); “log [antagonist]” adds a competitor; “Drug” picks the compound for Lipinski.'], ['Charts', '“Dose–response curve” (response versus log [L]) and “Lipinski”, which compares the drug’s properties with the limits for oral use.']], try: ['Set log [L] equal to log Kd: occupancy should be 50 %.', 'Add antagonist: the dose–response curve shifts to the right but reaches the same Emax.', 'Switch to a partial agonist: even with every receptor occupied it does not reach the full agonist’s Emax.'] }
  };
  MSim.create(def);
})();
