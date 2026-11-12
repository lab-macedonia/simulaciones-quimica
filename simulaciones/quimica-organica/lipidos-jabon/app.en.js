/* Lípidos, saponificación y jabones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var S = { n: 16, d: 0, naoh: 100, soap: 0.02, ca: 0, sap: 0 }, g = null, chains = [], heads = [], tails = [], grease = null, lab = [], gly = null, na = [];
  function Mac() { return 12.011 * S.n + 1.008 * (2 * S.n - 2 * S.d) + 31.998; }
  function Mtg() { return 92.094 + 3 * Mac() - 3 * 18.015; }
  function Tm() { var t = 44 + 4.7 * (S.n - 12); [55, 20, 10].forEach(function (x, k) { if (k < S.d) t -= x; }); return t; }
  function SAP() { return 3 * 56108 / Mtg(); }
  function stages() {
    return [
      ["Triglyceride", "Triglyceride", "Glycerol + 3 fatty acids joined by ester bonds",
        "<p>Fats and oils are <b>triglycerides</b>: a glycerol esterified with three <b>fatty acids</b>. <b>Saturated</b> acids have straight chains that pack well (solids, high melting point); each <b>cis</b> double bond introduces a <b>kink</b> that hinders packing and lowers the melting point (oils). Change the chain length and the unsaturations.</p>"],
      ["Saponification", "Saponification", "Triglyceride + 3 NaOH → glycerol + 3 soaps (fatty acid salts)",
        "<p><b>Saponification</b> is the basic hydrolysis of esters: <b>triglyceride + 3 NaOH → glycerol + 3 RCOO⁻Na⁺</b>. Soap is the sodium salt of the fatty acid. The <b>saponification index</b> (mg of KOH per g of fat) = 3·56,108 / M<sub>triglyceride</sub> indicates how much base is needed.</p>"],
      ["Micelles", "Micelles", "Hydrophobic tail inside, ionic head outside",
        "<p>Soap is <b>amphiphilic</b>: a water-soluble <b>ionic head</b> (–COO⁻) and an insoluble <b>hydrocarbon tail</b>. Above the <b>critical micelle concentration</b> they group into <b>micelles</b>: the tails surround and trap the grease, the heads face the water. This way the grease is emulsified and carried away with the water.</p>"],
      ["Hard water", "Hard water", "Ca²⁺ and Mg²⁺ precipitate the soap",
        "<p><b>Hard water</b> contains Ca²⁺ and Mg²⁺, which form insoluble salts with soap: <b>2 RCOO⁻ + Ca²⁺ → (RCOO)₂Ca↓</b> (the “scum”). Soap is lost and cleaning gets worse. <b>Synthetic detergents</b> (sulfonates) do not precipitate with Ca²⁺.</p>"]
    ];
  }
  var def = {
    key: 'lipidos-jabon', title: "Lipids, saponification and soaps", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffd43b', light: '#b45309' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [11, 5, 19], target: [11, 1, 0] }, { id: 'frontal', label: "Front", pos: [11, 1, 22], target: [11, 1, 0] }],
    layers: [{ id: 'mic', label: "Micelle", icon: '◍' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, j;
      gly = new T.Group(); for (i = 0; i < 3; i++) { var gc = new T.Mesh(new T.SphereGeometry(0.4, 12, 9), new T.MeshStandardMaterial({ color: 0xff922b })); gc.position.set(0, 1.6 * (1 - i), 0); gly.add(gc); } g.add(gly);
      for (i = 0; i < 3; i++) { var ch = []; for (j = 0; j < 20; j++) { var s = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshStandardMaterial({ color: 0x56606b })); g.add(s); ch.push(s); } chains.push(ch); }
      for (i = 0; i < 48; i++) { var h = new T.Mesh(new T.SphereGeometry(0.34, 10, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(h); heads.push(h); var t = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 1, 6), new T.MeshStandardMaterial({ color: 0x868e96 })); g.add(t); tails.push(t); }
      grease = new T.Mesh(new T.SphereGeometry(1.2, 18, 14), new T.MeshStandardMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9 })); g.add(grease);
      for (i = 0; i < 12; i++) { var c = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshStandardMaterial({ color: 0xff6b6b })); g.add(c); na.push(c); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.n = 12 + Math.round(6 * f.local); S.d = Math.floor(f.local * 3.99); S.sap = 0; S.ca = 0; } if (i === 1) { S.n = 16; S.d = 0; S.sap = f.local; S.ca = 0; } if (i === 2) { S.sap = 1; S.soap = 0.001 + 0.03 * f.local; S.ca = 0; } if (i === 3) { S.sap = 1; S.soap = 0.02; S.ca = f.local; } } else { S.sap = Math.max(S.sap, 0); }
      var th = ctx.now, stg = P.manual ? 4 : i, sapv = S.sap, mic = ctx.layer('mic') && (stg >= 2), tri = (stg < 2 || (stg === 1 && sapv < 1));
      var ch0 = Math.max(0, 1 - sapv * 1.0), cx0 = 8;
      gly.position.set(cx0 + sapv * 0.6, 0, 0); gly.visible = stg <= 1 || (P.manual);
      chains.forEach(function (ch, k) {
        ch.forEach(function (s, j) { s.visible = j < S.n + 2 && (stg <= 1 || P.manual) && stg < 2; var kink = (S.d > k || (S.d > 0 && k === 0)) && j > 5 && j < 9 ? 0.55 : 0; var zz = (j % 2 ? 0.2 : -0.2); var jj = j + (sapv * 1.2 * 0); s.position.set(cx0 + 0.7 + j * 0.45 + sapv * (3 + k * 0.5), 1.6 * (1 - k) + zz + (j > 5 && kink ? 0.55 : 0) + (j > 8 && S.d > k ? 0.3 : 0) - sapv * 0 + (j > 5 && j < 9 ? 0 : 0), 0); s.material.color.setHex(S.d > k && j > 5 && j < 9 ? 0xff8787 : 0x56606b); });
      });
      na.forEach(function (c, k) { c.visible = stg === 1 && k < 3 + Math.round(9 * sapv); c.position.set(cx0 + 3 + (k % 4) * 1.4, -2.2 - Math.floor(k / 4) * 0.8, 0); });
      var nH = mic ? 40 : 0, R = 3.2, ox = 15, oy = 1.5;
      heads.forEach(function (h, k) { var vis = (stg >= 2) && ctx.layer('mic') && k < nH && S.soap > 0.004; h.visible = vis; var y = 1 - 2 * (k + 0.5) / nH, r = Math.sqrt(Math.max(0, 1 - y * y)), phi = k * 2.399963 + th * 0.15, dx = Math.cos(phi) * r, dz = Math.sin(phi) * r; h.position.set(ox + dx * R, oy + y * R, dz * R); var tl = tails[k]; tl.visible = vis; var len = 1.8; tl.position.set(ox + dx * (R - len / 2 - 0.2), oy + y * (R - len / 2 - 0.2), dz * (R - len / 2 - 0.2)); tl.scale.set(1, len, 1); tl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, y, dz)); h.material.color.setHex(S.ca > 0.5 ? 0xff8787 : 0x4dabf7); });
      grease.visible = stg >= 2 && ctx.layer('mic') && S.soap > 0.004; grease.position.set(ox, oy, 0); grease.scale.setScalar(1 - 0.4 * S.ca);
      lab[0].pos(cx0 + 4, 4.6, 0).set(stg < 2 ? "Triglyceride: C" + S.n + ':' + S.d + ' × 3' : (stg === 2 ? "Soap micelle" : "Soap + Ca²⁺ (hard water)"), 'bl-lead').vis(true).pos(stg < 2 ? cx0 + 4 : ox, stg < 2 ? 4.6 : 6.4, 0);
      lab[1].pos(cx0 + 4, -4.2, 0).set(stg < 2 ? "Mp ≈ " + fmt(Tm(), 0) + ' °C · M = ' + fmt(Mtg(), 0) + " g/mol" : '', 'bl-d').vis(stg < 2);
      lab[2].pos(ox, -3.8, 0).set(stg === 2 ? (S.soap > 0.004 ? "above the CMC: micelles" : "below the CMC: monomers") : (stg >= 3 ? fmt(S.ca * 100, 0) + " % of the soap precipitates" : ''), 'bl-d').vis(stg >= 2);
      lab[3].pos(cx0 + 4, 3, 0).set(stg === 1 ? "NaOH: " + fmt(S.sap * 3, 1) + ' / 3 mol' : '', 'bl-pos').vis(stg === 1);
    },
    sync: function (ctx) { var u = ctx.ui; ['n', 'd', 'soap', 'ca'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'TG', name: "Fat", body: "<div class=\"eqline\"><small>Fatty acid</small>C" + S.n + ':' + S.d + "</div><div class=\"eqline\"><small>M triglyceride</small>" + fmt(Mtg(), 0) + " g/mol</div><div class=\"eqline\"><small>Melting point</small>" + fmt(Tm(), 0) + " °C</div><div class=\"eqline\"><small>Saponif. index</small>" + fmt(SAP(), 0) + " mg KOH/g</div>" }, legend: [{ label: "Blue", color: '#4dabf7', text: "ionic head (hydrophilic)" }, { label: "Gray", color: '#868e96', text: "hydrocarbon tail" }, { label: "Yellow", color: '#ffd43b', text: "trapped grease" }] }; },
    measures: function () { return [["Fatty acid", 'C' + S.n + ':' + S.d], ["M triglyceride", fmt(Mtg(), 1) + " g/mol"], ["Melting point", '≈ ' + fmt(Tm(), 0) + ' °C'], ["State at 25 °C", Tm() > 25 ? "solid (fat)" : "liquid (oil)"], ["Saponification index", fmt(SAP(), 0) + " mg KOH/g"], ["NaOH per 100 g", fmt(SAP() / 56.108 * 40.0 / 1000 * 100, 1) + ' g']]; },
    ideas: ["Each cis C=C lowers the melting point.", "Triglyceride + 3 NaOH → glycerol + 3 soap.", "Micelle: tail inside, head outside.", "Ca²⁺ precipitates the soap."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Fatty acid and soap"); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; if (k === 'd' || k === 'n') S.sap = 0; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('n', "Number of C atoms in the fatty acid", 12, 18, 2, function (v) { return 'C' + v; }), sl('d', "cis double bonds", 0, 3, 1, function (v) { return String(v); }), sl('soap', "Soap in water", 0.001, 0.04, 0.001, function (v) { return fmt(v, 3) + ' M'; }), sl('ca', "Hardness (Ca²⁺ precipitating)", 0, 1, 0.05, function (v) { return fmt(v * 100, 0) + ' %'; })]));
      c.appendChild(ctx.btnRow([{ t: "Saponify", fn: function () { ctx.goManual(); S.sap = 1; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Melting point according to unsaturations", h: 200, note: "Each cis double bond lowers the melting point markedly.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, d, n = S.n, bw = pw / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
      for (d = 0; d < 4; d++) { var t = 44 + 4.7 * (n - 12); [55, 20, 10].forEach(function (x, k) { if (k < d) t -= x; }); var y0 = Tp + ph * (80 / 110), y = Tp + ph * ((80 - t) / 110); cx.fillStyle = d === S.d ? '#ff922b' : '#74c0fc'; cx.fillRect(L + d * bw + 8, Math.min(y, y0), bw - 16, Math.abs(y0 - y)); cx.fillStyle = col.muted; cx.fillText('C' + n + ':' + d, L + d * bw + bw / 2, h - 10); cx.fillText(fmt(t, 0), L + d * bw + bw / 2, (t >= 0 ? y : y0) + (t >= 0 ? -3 : 12)); }
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">Triglyceride of C acid" + S.n + ':' + S.d + '</div><table class="calc-table">' + row("M fatty acid", '<b>' + fmt(Mac(), 2) + " g/mol</b>") + row("M triglyceride", '92,09 + 3·' + fmt(Mac(), 2) + ' − 3·18,015 = <b>' + fmt(Mtg(), 1) + " g/mol</b>") + row("Saponification index", '3·56 108 / ' + fmt(Mtg(), 1) + ' = <b>' + fmt(SAP(), 0) + " mg KOH/g</b>") + row("NaOH per kg of fat", fmt(3 * 40.0 / Mtg() * 1000, 0) + ' g') + row("Soap (Na salt)", 'M = ' + fmt(Mac() + 21.98, 1) + " g/mol") + '</table>'; },
    quiz: [
      { q: "Saponification of a triglyceride produces…", options: ["glycerol and soap", "glycerol and free fatty acids", "ethanol and water", "an alkane"], answer: 0, why: "Basic hydrolysis of the ester." },
      { q: "Unsaturated cis fatty acids…", options: ["lower the melting point", "raise it", "do not change it", "form soap without NaOH"], answer: 0, why: "The kink hinders packing." },
      { q: "In a micelle, the hydrocarbon tails are…", options: ["toward the interior", "toward the water", "dispersed in the water", "bound to Ca²⁺"], answer: 0, why: "They are hydrophobic." },
      { q: "Soap loses effectiveness in hard water because…", options: ["it forms insoluble salts with Ca²⁺ and Mg²⁺", "is oxidized", "it is hydrolyzed", "it forms larger micelles"], answer: 0, why: "(RCOO)₂Ca precipitates." },
      { q: "… moles of NaOH are needed per mole of triglyceride.", options: ['3', '1', '2', '6'], answer: 0, why: "One for each ester." },
      { q: "A high saponification value indicates fatty acids that are…", options: ["short-chain", "long-chain", "always saturated", "always unsaturated"], answer: 0, why: "Lower M ⇒ more esters per gram." }
    ],
    help: { intro: "Change the fatty acid and observe the kink of the unsaturations. With “Saponify” the triglyceride breaks apart; further to the right you see the micelle and the effect of hard water.", items: [['Chain', 'grey = hydrocarbon tail; each pink kink is a cis double bond.'], ['Saponification', 'the saponify button splits the triglyceride into glycerol and three soap molecules.'], ['Micelle', 'blue = ionic (hydrophilic) head, grey = tail; yellow = grease trapped inside.'], ['Chart', '“Melting point according to unsaturations”.']], try: ['Add double bonds to the fatty acid: the melting point drops.', 'Saponify and count the products: 1 glycerol + 3 soaps.', 'In the hard-water stage, watch Ca²⁺ and Mg²⁺ precipitate the soap.'] }
  };
  MSim.create(def);
})();
