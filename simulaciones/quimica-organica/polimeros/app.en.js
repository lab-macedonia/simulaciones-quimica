/* Polímeros: adición y condensación — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var P = {
    pe: { n: "Polyethylene (PE)", k: 'a', m: 'CH₂=CH₂', M: 28.05, side: null, c: 0x868e96, u: '–CH₂–CH₂–', use: "bags, packaging", tg: '−120' },
    pp: { n: "Polypropylene (PP)", k: 'a', m: 'CH₂=CH–CH₃', M: 42.08, side: 'me', c: 0x4dabf7, u: '–CH₂–CH(CH₃)–', use: "caps, fibers, syringes", tg: '−10' },
    ps: { n: "Polystyrene (PS)", k: 'a', m: 'CH₂=CH–C₆H₅', M: 104.15, side: 'ph', c: 0xffa94d, u: '–CH₂–CH(C₆H₅)–', use: "packaging, insulation (foam)", tg: '100' },
    pvc: { n: "PVC", k: 'a', m: 'CH₂=CHCl', M: 62.5, side: 'cl', c: 0x51cf66, u: '–CH₂–CHCl–', use: "pipes, cables", tg: '80' },
    n66: { n: "Nylon 6,6", k: 'c', m: "adipic acid + hexamethylenediamine", M: 226.32, side: null, c: 0xcc5de8, u: '–[NH(CH₂)₆NHCO(CH₂)₄CO]–', use: "fibers, gears", tg: '50' },
    pet: { n: 'PET', k: 'c', m: "terephthalic acid + ethylene glycol", M: 192.17, side: null, c: 0x22b8cf, u: '–[OCH₂CH₂OCOC₆H₄CO]–', use: "bottles, polyester fibers", tg: '70' }
  };
  var W = 18.015, S = { p: 'pe', n: 20, ext: 0.98, ph: 0 }, g = null, bb = [], sg = [], ws = [], lab = [], curN = 0;
  function pol() { return P[S.p]; }
  function Xn() { return 1 / (1 - S.ext); }
  function Mn() { var q = pol(); return q.k === 'a' ? S.n * q.M : (Xn() / 2) * q.M; }
  function disp() { return pol().k === 'a' ? 1.5 : 1 + S.ext; }
  function stages() {
    return [
      ["Monomers and polymers", "Monomer", "A polymer is a chain of many monomers joined covalently",
        "<p>A <b>polymer</b> is a macromolecule formed by repetition of a <b>unit</b> derived from a <b>monomer</b>. There are two main mechanisms: <b>addition</b> (monomers with a double bond, no loss of atoms) and <b>condensation</b> (a small molecule such as H₂O is released). Change the polymer in “Lab”.</p>"],
      ["Addition polymerization", "Addition", "Initiation → propagation → termination (radicals)",
        "<p>In <b>radical addition</b>, an initiator generates a radical that attacks the monomer's C=C (<b>initiation</b>); the new radical keeps adding monomers (<b>propagation</b>) until two radicals combine or disproportionate (<b>termination</b>). The chain grows one unit at a time; the product has the same empirical formula as the monomer.</p>"],
      ["Condensation polymerization", "Condensation", "H₂O is released at each bond; the molar mass rises at the end",
        "<p>In <b>condensation</b>, different functional groups react (acid + amine → amide; acid + alcohol → ester) and <b>H₂O</b> is released at each link. Any species can react with any other, so the size is large only when the <b>conversion p</b> approaches 1: <b>X<sub>n</sub> = 1/(1 − p)</b> (Carothers equation).</p>"],
      ["Molar mass and dispersity", "Molar mass", "Mn = n · M₀ · Đ = Mw/Mn ≥ 1",
        "<p>A polymer does not have a single molar mass: it is a <b>distribution</b>. The <b>number average Mn</b> counts every chain equally; the <b>mass average Mw</b> gives more weight to long chains. The <b>dispersity</b> Đ = Mw/Mn equals 1 only if all chains are identical; in condensation, Đ = 1 + p ≈ 2.</p>"],
      ["Structure and properties", "Properties", "Large substituents increase rigidity (Tg)",
        "<p><b>Structure</b> determines properties: bulky substituents (phenyl in PS) or polar ones (Cl in PVC, amides in nylon) <b>restrict motion</b> and raise the glass transition temperature (Tg). Nylon forms <b>hydrogen bonds</b> between chains, giving strong fibers. Compare the six polymers.</p>"]
    ];
  }
  var def = {
    key: 'polimeros', title: "Polymers: addition and condensation", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 6, 22], target: [6, 0, 0] }, { id: 'frontal', label: "Front", pos: [6, 0, 26], target: [6, 0, 0] }],
    layers: [{ id: 'side', label: "Substituents", icon: '◉' }, { id: 'w', label: "Released H₂O", icon: '💧' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, sp = new T.SphereGeometry(0.34, 12, 9);
      for (i = 0; i < 82; i++) { var b = new T.Mesh(sp, new T.MeshStandardMaterial({ color: 0x56606b, roughness: 0.4 })); g.add(b); bb.push(b); }
      for (i = 0; i < 41; i++) { var s = new T.Mesh(new T.SphereGeometry(0.5, 12, 9), new T.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.4 })); g.add(s); sg.push(s); }
      for (i = 0; i < 20; i++) { var w = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xff4d4d })); g.add(w); ws.push(w); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var Pm = ctx.P, i = f.i, q = pol();
      if (!Pm.manual) { if (i === 0) { S.p = ['pe', 'pp', 'ps', 'pvc'][Math.min(3, Math.floor(f.local * 4))]; S.n = 12; } if (i === 1) { S.p = 'ps'; S.n = Math.max(1, Math.round(1 + 39 * f.local)); } if (i === 2) { S.p = f.local < 0.5 ? 'n66' : 'pet'; S.ext = 0.5 + 0.495 * ((f.local * 2) % 1); } if (i === 3) { S.p = 'pe'; S.n = 20 + Math.round(20 * f.local); } if (i === 4) { S.p = ['pe', 'pp', 'ps', 'pvc', 'n66', 'pet'][Math.min(5, Math.floor(f.local * 6))]; S.n = 24; } }
      q = pol(); var n = q.k === 'a' ? Math.min(40, S.n) : Math.max(2, Math.min(40, Math.round(Xn() / 2 * 1)));
      if (q.k === 'c') n = Math.min(40, Math.max(2, Math.round(2 + (S.ext - 0.5) / 0.5 * 38)));
      curN = n; var nb = n * 2, sOn = ctx.layer('side'), wOn = ctx.layer('w'), L = n * 0.55;
      bb.forEach(function (b, j) { b.visible = j < nb; var t = j / 2, x = 0 + j * 0.62 - 1; b.position.set(x, (j % 2 ? 0.42 : -0.42), Math.sin(j * 0.18) * 0.7); b.material.color.setHex(q.k === 'c' ? ((j % 4 < 2) ? q.c : 0xffe066) : 0x56606b); });
      sg.forEach(function (s, j) { var show = j < n && sOn && (q.side || q.k === 'c'); s.visible = !!show; var x = 0 + (2 * j + 1) * 0.62 - 1; s.position.set(x, 1.5, Math.sin((2 * j + 1) * 0.18) * 0.7 + (q.side === 'ph' ? 0.3 : 0)); var sc = q.side === 'ph' ? 1.8 : (q.side === 'cl' ? 1.3 : (q.side === 'me' ? 0.9 : 1.1)); if (q.k === 'c') { sc = 0.9; s.position.y = -1.4; s.position.x = (2 * j) * 0.62 - 1; } s.scale.setScalar(sc); s.material.color.setHex(q.side === 'cl' ? 0x3ddc5a : (q.side === 'ph' ? 0xffa94d : (q.k === 'c' ? 0x4f7cff : 0x9aa5b1))); });
      var nw = q.k === 'c' ? Math.min(20, n) : 0; ws.forEach(function (w, j) { w.visible = wOn && j < nw; var u = ((ctx.now * 0.25 + j * 0.37) % 1); w.position.set(1 + j * 1.1, -2.2 - u * 3, 0.6); w.scale.setScalar(1 - u * 0.6); });
      var sc0 = Math.min(1.8, 20 / (nb * 0.62 + 2)); g.scale.setScalar(sc0); g.position.set(13 - (nb * 0.62 / 2) * sc0, 0, 0);
      lab[0].pos(13, 6, 0).set(q.n + ' · n = ' + n, 'bl-lead').vis(true);
      lab[1].pos(13, -6.2, 0).set(q.k === 'a' ? "Addition: " + q.m : "Condensation: " + q.m, 'bl-d').vis(true);
      lab[2].pos(13, -7.6, 0).set('unidad: ' + q.u, 'bl-d').vis(true);
      lab[3].pos(13, 4.2, 0).set("Mn ≈ " + fmt(Mn(), 0) + " g/mol", 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.p) u.p.set(S.p); if (u.n) u.n.set(S.n); if (u.ext) u.ext.set(S.ext); },
    hud: function () { var q = pol(); return { eq: { chip: 'n', name: "Chain", body: "<div class=\"eqline\"><small>Type</small>" + (q.k === 'a' ? "addition" : "condensation") + "</div><div class=\"eqline\"><small>Unit M₀</small>" + fmt(q.M, 2) + " g/mol</div><div class=\"eqline\"><small>Mn</small>" + fmt(Mn(), 0) + " g/mol</div><div class=\"eqline\"><small>Đ</small>" + fmt(disp(), 2) + '</div>' }, legend: [{ label: "Spheres", color: '#56606b', text: "backbone atoms" }, { label: "Side color", color: '#4dabf7', text: "substituent or functional group" }] }; },
    measures: function () { var q = pol(); return [["Polymer", q.n], ["Mechanism", q.k === 'a' ? "addition" : "condensation"], ["M₀ (unit)", fmt(q.M, 2) + " g/mol"], ['Xn', q.k === 'a' ? String(S.n) : fmt(Xn(), 1)], ['Mn', fmt(Mn(), 0) + " g/mol"], ["Đ (Mw/Mn)", fmt(disp(), 2)], ["Approx. Tg", q.tg + ' °C'], ['Usos', q.use]]; },
    ideas: ["Addition: no loss of atoms.", "Condensation: releases H₂O.", "Xn = 1/(1 − p).", 'Đ ≥ 1.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Polymer"); el.appendChild(c);
      ui.p = kit.ui.options({ label: "Polymer", cols: 2, value: S.p, options: Object.keys(P).map(function (k) { return { v: k, label: P[k].n, sub: P[k].k === 'a' ? "addition" : "condensation" }; }), onChange: function (v) { ctx.goManual(); S.p = v; } });
      ui.n = kit.ui.slider({ label: "Degree of polymerization (addition)", min: 1, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.ext = kit.ui.slider({ label: "Conversion p (condensation)", min: 0.5, max: 0.995, step: 0.005, value: S.ext, format: function (v) { return fmt(v, 3); }, onInput: function (v) { ctx.goManual(); S.ext = v; } });
      c.appendChild(ui.p); c.appendChild(kit.ui.sliders([ui.n, ui.ext])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Carothers equation", h: 200, note: "Xn = 1/(1 − p). A high degree requires conversion very close to 1.", draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var p = 0.5 + 0.495 * i / 100, x = L + pw * i / 100, y = Tp + ph * (1 - Math.min(1, (1 / (1 - p)) / 200)); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ext - 0.5) / 0.495, Tp + ph * (1 - Math.min(1, Xn() / 200)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('p = 0,5', L, h - 8); cx.fillText('p = 0,995', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText("Xn 200", L - 4, Tp + 8);
    } }, { title: "Size distribution (condensation)", h: 190, note: "Flory most probable distribution: number fraction of chains with x units.", draw: function (cx, w, h, col) {
      var L = 20, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, p = S.ext, i, mx = 1 - p; cx.fillStyle = '#4dabf7';
      for (i = 1; i <= 40; i++) { var v = (1 - p) * Math.pow(p, i - 1); cx.fillRect(L + pw * (i - 1) / 40 + 1, Tp + ph * (1 - v / mx), pw / 40 - 2, ph * v / mx); }
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('x = 1', L, h - 8); cx.fillText('x = 40', L + pw, h - 8);
    } }],
    calc: function () {
      var q = pol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (q.k === 'a') return '<div class="card-kicker">' + q.n + " · addition</div><table class=\"calc-table\">" + row('Mn', 'n · M₀ = ' + S.n + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + " g/mol</b>") + row("Monomer", q.m + ' (M = ' + fmt(q.M, 2) + ')') + row('Subproducto', "none: the unit keeps the monomer's formula") + row("Typical Đ", '≈ ' + fmt(disp(), 2)) + '</table>';
      return '<div class="card-kicker">' + q.n + " · condensation</div><table class=\"calc-table\">" + row("Xn (Carothers)", '1/(1 − ' + fmt(S.ext, 3) + ') = <b>' + fmt(Xn(), 1) + '</b>') + row('Mn', "(Xn/2) · M₀ = " + fmt(Xn() / 2, 1) + ' × ' + fmt(q.M, 2) + ' = <b>' + fmt(Mn(), 0) + " g/mol</b>") + row("Released H₂O", "1 mol H₂O per bond (18.015 g/mol)") + row('Đ', '1 + p = <b>' + fmt(disp(), 2) + '</b>') + '</table>';
    },
    quiz: [
      { q: "The addition polymerization of ethene produces…", options: ["polyethylene without releasing by-products", "nylon", "PET and water", "polystyrene"], answer: 0, why: "The C=C opens." },
      { q: "In a polycondensation, what is released is…", options: ["a small molecule (H₂O)", "a radical", "no product", "always H₂"], answer: 0, why: "Each amide/ester bond releases H₂O." },
      { q: "According to Carothers, with p = 0.99 the degree of polymerization is…", options: ['100', '99', '10', '1000'], answer: 0, why: '1/(1 − 0,99).' },
      { q: "A polymer with Đ = 1.0 has…", options: ["all chains of the same size", "very diverse chains", "only monomers", "higher Mw than Mn"], answer: 0, why: "Mw = Mn." },
      { q: "Which polymer has a phenyl substituent?", options: ["polystyrene", "PVC", "polypropylene", "polyethylene"], answer: 0, why: "Styrene = vinylbenzene." },
      { q: "Nylon 6,6 is formed by the reaction of…", options: ["a diacid and a diamine", "ethylene and propylene", "a diol and a vinyl diester", "vinyl chloride"], answer: 0, why: "Amide bonds are formed." }
    ],
    help: { intro: "Choose a polymer and its size. The dark spheres are the backbone; the colored ones, substituents or functional groups. In condensation, the released water molecules fall.", items: [['Chain', 'dark spheres = backbone atoms; coloured side spheres = substituent or functional group.'], ['Condensation', 'the falling red spheres are the H₂O released as each bond forms.'], ['Controls', '“Polymer”, “Degree of polymerization (addition)” and “Conversion p (condensation)”.'], ['Charts', '“Carothers equation” (Xn = 1/(1 − p)) and “Size distribution (condensation)”.']], try: ['Compare an addition polymer with a condensation polymer: only the second releases water.', 'Raise the conversion from 0.90 to 0.99: Xn goes from 10 to 100.', 'Look at the distribution: the chains are not all the same size (Đ > 1).'] }
  };
  MSim.create(def);
})();
