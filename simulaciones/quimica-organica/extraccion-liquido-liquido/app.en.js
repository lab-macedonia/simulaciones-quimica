/* Extracción líquido–líquido — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SOL = { eter: { n: "Diethyl ether", d: 0.71, c: 0xfff3bf }, ac: { n: "Ethyl acetate", d: 0.90, c: 0xffe8cc }, dcm: { n: "Dichloromethane", d: 1.33, c: 0xd0ebff } };
  var CMP = { neu: { n: "Neutral compound", K: 6, kind: 'n', pKa: 0, c: 0xff6b6b }, acid: { n: "Benzoic acid", K: 8, kind: 'a', pKa: 4.2, c: 0xff922b }, base: { n: "Aniline", K: 7, kind: 'b', pKa: 4.6, c: 0x845ef7 } };
  var S = { sol: 'eter', cmp: 'neu', r: 1, n: 1, pH: 7, p: 0 }, lab = [], parts = [], fun = null, top = null, bot = null, g = null;
  function fn(c, pH) { if (c.kind === 'a') return 1 / (1 + Math.pow(10, pH - c.pKa)); if (c.kind === 'b') return 1 / (1 + Math.pow(10, c.pKa - pH)); return 1; }
  function D() { var c = CMP[S.cmp]; return c.K * fn(c, S.pH); }
  function Eorg(n, r, d) { return 1 - Math.pow(1 / (1 + d * r / n), n); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ["Principle of extraction", "Fundamentals", "A solute is distributed between two immiscible solvents according to its affinity",
        "<p><b>Liquid–liquid extraction</b> transfers a solute from one phase (usually aqueous) to an <b>immiscible</b> organic solvent. The phase of <b>lower density stays on top</b>: ether (0.71) and ethyl acetate (0.90) above water; dichloromethane (1.33) stays <b>below</b>. A <b>separatory funnel</b> is used: shake, vent the pressure and separate the phases.</p>"],
      ["Partition coefficient", "Partition K", "K = [solute]organic / [solute]aqueous at equilibrium",
        "<p>At equilibrium, the solute is distributed according to the <b>partition coefficient</b> K = C<sub>org</sub>/C<sub>aq</sub>. With volumes V<sub>org</sub> and V<sub>aq</sub>, the fraction extracted in one stage is <b>E = K·r/(1 + K·r)</b> with r = V<sub>org</sub>/V<sub>aq</sub>. Change K and r and watch how the dots redistribute between the two phases.</p>"],
      ["Several small extractions", "Multiple", "With the same total volume, n portions extract more than one large one",
        "<p>With the same total volume of organic solvent, <b>several extractions with small portions</b> recover more solute than a single large one. The fraction remaining in the water after n stages is <b>(1/(1 + K·r/n))<sup>n</sup></b>. Usually 3 extractions are a good compromise between yield and work.</p>"],
      ["Acid–base extraction", "Acid–base", "An acid or base becomes water-soluble when it ionizes: the pH controls which phase it is in",
        "<p>A <b>carboxylic acid</b> is neutral (organic-soluble) at pH &lt; pKa and an <b>ionic carboxylate</b> (water-soluble) at pH &gt; pKa. With NaHCO₃ it is extracted into the aqueous phase; on acidifying with HCl it is recovered. With an <b>amine</b> the opposite happens: HCl turns it into an aqueous salt. The effective coefficient is <b>D = K·f<sub>neutral</sub></b>. This is how acids, bases and neutral compounds are separated from a mixture.</p>"],
      ["Laboratory technique", "Technique", "Shake, vent, let it separate and drain the lower phase",
        "<p>Good practice: close the <b>stopcock</b> before adding; invert and <b>vent</b> (especially with ether and with NaHCO₃, which releases CO₂); shake gently; let it <b>settle</b>; remove the stopper before draining; <b>keep both phases</b> until finished. Dry the organic phase with anhydrous Na₂SO₄ or MgSO₄ and evaporate the solvent.</p>"]
    ];
  }
  var def = {
    key: 'extraccion-liquido-liquido', title: "Liquid–liquid extraction", subtitle: "3D simulator · organic chemistry", accent: { dark: '#69db7c', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 4, 20], target: [0, 1, 0] }, { id: 'frontal', label: "Front", pos: [0, 1, 22], target: [0, 1, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 4], target: [0, 1, 0] }],
    layers: [{ id: 'sol', label: "Solute molecules", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.22), i;
      fun = new T.Mesh(new T.CylinderGeometry(4.5, 1.1, 11, 28, 1, true), glass); fun.position.y = 2; g.add(fun);
      var cap = new T.Mesh(new T.SphereGeometry(4.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass); cap.position.y = 7.5; g.add(cap);
      var st = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 3, 12), mat(0x495057, 1)); st.position.y = -4.8; g.add(st);
      var key = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1.8, 8), mat(0xe03131, 1)); key.rotation.z = Math.PI / 2; key.position.y = -4.4; g.add(key);
      top = new T.Mesh(new T.CylinderGeometry(4, 3.0, 4, 28), mat(0xfff3bf, 0.5)); g.add(top); bot = new T.Mesh(new T.CylinderGeometry(3.0, 1.2, 4, 28), mat(0x74c0fc, 0.5)); g.add(bot);
      for (i = 0; i < 110; i++) { var m = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), mat(0xff6b6b, 1)); m.userData = { u: Math.random(), a: Math.random() * 6.28, ph: Math.random() * 6.28 }; g.add(m); parts.push(m); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, so = SOL[S.sol], c = CMP[S.cmp];
      if (!P.manual) { var i = f.i; S.p = Math.min(1, f.local * 1.2); if (i === 0) { S.r = 1; S.n = 1; S.cmp = 'neu'; S.pH = 7; } else if (i === 1) { S.cmp = 'neu'; S.n = 1; S.r = 0.5 + 1.5 * Math.abs(Math.sin(f.local * 3.14)); } else if (i === 2) { S.cmp = 'neu'; S.r = 1; S.n = 1 + Math.round(f.local * 4); } else if (i === 3) { S.cmp = 'acid'; S.n = 1; S.r = 1; S.pH = 1 + 9 * f.local; } else { S.cmp = 'neu'; S.n = 3; } }
      var d = D(), E = Eorg(S.n, S.r, d), orgTop = so.d < 1, ph = 0.5 + 0.5 * S.r / (1 + S.r), Hs = 9, hO = Hs * S.r / (1 + S.r), hA = Hs - hO, y0 = -2.2;
      var yA = y0, yO;
      if (orgTop) { bot.scale.y = hA / 4; bot.position.y = y0 + hA / 2; top.scale.y = hO / 4; top.position.y = y0 + hA + hO / 2; bot.material.color.setHex(0x74c0fc); top.material.color.setHex(so.c); }
      else { bot.scale.y = hO / 4; bot.position.y = y0 + hO / 2; top.scale.y = hA / 4; top.position.y = y0 + hO + hA / 2; bot.material.color.setHex(so.c); top.material.color.setHex(0x74c0fc); }
      var orgLo = orgTop ? y0 + hA : y0, aqLo = orgTop ? y0 : y0 + hO, sOn = ctx.layer('sol'), nOrg = Math.round(110 * E * Math.min(1, S.p + 0.15));
      parts.forEach(function (m, j) { var inOrg = j < nOrg, lo = inOrg ? orgLo : aqLo, h = inOrg ? hO : hA; m.material.color.setHex(inOrg ? c.c : 0x228be6); m.position.set(Math.cos(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u), lo + 0.3 + (h - 0.6) * ((m.userData.u * 7 + Math.sin(now * 0.8 + m.userData.ph) * 0.1) % 1), Math.sin(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u)); m.visible = sOn && h > 0.5; });
      g.rotation.y = now * 0.15;
      lab[0].pos(0, 9.5, 0).set(so.n + ' (' + (orgTop ? "up" : "down") + ', d = ' + fmt(so.d, 2) + ')', 'bl-lead').vis(true);
      lab[1].pos(6.5, orgTop ? y0 + hA + hO / 2 : y0 + hO + hA / 2, 0).set(orgTop ? "Organic phase" : "Aqueous phase", 'bl-d').vis(true);
      lab[2].pos(6.5, orgTop ? y0 + hA / 2 : y0 + hO / 2, 0).set(orgTop ? "Aqueous phase" : "Organic phase", 'bl-d').vis(true);
      lab[3].pos(0, -7.8, 0).set("Extracted: " + fmt(E * 100, 1) + ' % · D = ' + fmt(d, 2), E > 0.9 ? 'bl-pos' : 'bl-neg').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sol) u.sol.set(S.sol); if (u.cmp) u.cmp.set(S.cmp); if (u.r) u.r.set(S.r); if (u.n) u.n.set(S.n); if (u.pH) u.pH.set(S.pH); },
    hud: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return { eq: { chip: fmt(E * 100, 0) + '%', name: c.n, body: '<div class="eqline"><small>K</small>' + fmt(c.K, 1) + "</div><div class=\"eqline\"><small>Effective D</small>" + fmt(d, 2) + "</div><div class=\"eqline\"><small>Stages</small>" + S.n + ' × ' + fmt(S.r / S.n, 2) + " V</div><div class=\"eqline\"><small>Recovered</small>" + fmt(E * 100, 1) + " % in organic</div>" }, legend: [{ label: "Orange dot", color: '#ff922b', text: "solute in the organic phase" }, { label: "Blue dot", color: '#228be6', text: "solute in the aqueous phase" }] }; },
    measures: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return [["Solute", c.n], ["Solvent", SOL[S.sol].n], ['K', fmt(c.K, 1)], ["Aqueous pH", fmt(S.pH, 1)], ['D = K·f', fmt(d, 2)], ["Extractions", String(S.n)], ["% extracted", fmt(E * 100, 1) + ' %']]; },
    ideas: ["Several small portions > one large one.", "Carboxylic acid: organic at pH < pKa; aqueous at pH > pKa.", "Amine: organic at high pH; aqueous at low pH.", "Vent the funnel to release the pressure."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("System"); el.appendChild(c);
      ui.sol = kit.ui.options({ label: "Organic solvent", cols: 1, value: S.sol, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].n, sub: 'd = ' + SOL[k].d }; }), onChange: function (v) { ctx.goManual(); S.sol = v; } }); c.appendChild(ui.sol);
      ui.cmp = kit.ui.options({ label: "Solute", cols: 1, value: S.cmp, options: Object.keys(CMP).map(function (k) { return { v: k, label: CMP[k].n, sub: 'K = ' + CMP[k].K + (CMP[k].pKa ? ' · pKa ' + CMP[k].pKa : '') }; }), onChange: function (v) { ctx.goManual(); S.cmp = v; } }); c.appendChild(ui.cmp);
      ui.r = kit.ui.slider({ label: "Total organic / aqueous volume", min: 0.2, max: 3, step: 0.1, value: S.r, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.r = v; } });
      ui.n = kit.ui.slider({ label: "No. of extractions", min: 1, max: 6, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.pH = kit.ui.slider({ label: "pH of the aqueous phase", min: 0, max: 14, step: 0.1, value: S.pH, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.pH = v; } });
      c.appendChild(kit.ui.sliders([ui.r, ui.n, ui.pH])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "% extracted by no. of extractions", h: 230, note: "Constant total organic volume, split into n portions.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, d = D(), n, bw = pw / 8; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center';
        for (n = 1; n <= 8; n++) { var e = Eorg(n, S.r, d); cx.fillStyle = n === S.n ? '#40c057' : '#4dabf7'; cx.fillRect(L + (n - 1) * bw + 4, Tp + ph * (1 - e), bw - 8, ph * e); cx.fillStyle = col.ink; cx.fillText(fmt(e * 100, 0), L + (n - 1) * bw + bw / 2, Tp + ph * (1 - e) - 3); cx.fillStyle = col.muted; cx.fillText(n, L + (n - 1) * bw + bw / 2, h - B + 14); }
        cx.fillText("no. of extractions", L + pw / 2, h - 6);
      } },
      { title: "Effective D and % extracted versus pH", h: 230, note: "Acid: extraction drops at pH > pKa. Base: the opposite.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, k; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 14; i += 2) cx.fillText(i, L + pw * i / 14, h - B + 14); cx.fillText('pH', L + pw / 2, h - 6);
        ['acid', 'base'].forEach(function (key, j) { var c = CMP[key]; cx.strokeStyle = j ? '#845ef7' : '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 70; i++) { var pH = i / 5, e = Eorg(S.n, S.r, c.K * fn(c, pH)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * pH / 14, Tp + ph * (1 - e)); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * S.pH / 14, Tp); cx.lineTo(L + pw * S.pH / 14, Tp + ph); cx.stroke(); cx.setLineDash([]); cx.textAlign = 'left'; cx.fillStyle = '#ff922b'; cx.fillText("benzoic acid", L + 6, Tp + 12); cx.fillStyle = '#845ef7'; cx.fillText("aniline", L + 6, Tp + 24);
      } }
    ],
    calc: function () {
      var c = CMP[S.cmp], f = fn(c, S.pH), d = D(), E1 = Eorg(1, S.r, d), E = Eorg(S.n, S.r, d), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('K', fmt(c.K, 1)) + (c.kind !== 'n' ? row("Neutral fraction f", fmt(f, 4) + ' (pH ' + fmt(S.pH, 1) + ', pKa ' + c.pKa + ')') : '') + row('D = K·f', fmt(d, 3)) + row('r = V<sub>org</sub>/V<sub>ac</sub>', fmt(S.r, 2)) + row("1 stage: E = D·r/(1 + D·r)", fmt(E1 * 100, 1) + ' %') + row(S.n + " stages of r/" + S.n, '<b>' + fmt(E * 100, 1) + ' %</b>') + row("Stays in water", fmt((1 - E) * 100, 2) + ' %') + '</table>';
    },
    quiz: [
      { q: "Dichloromethane (d = 1.33) with water ends up…", options: ["down", "up", "emulsified", "in the middle"], answer: 0, why: "Denser than water." },
      { q: "With the same total volume, it is better to use…", options: ["several small extractions", "one large one", "none", "evaporate"], answer: 0, why: "(1/(1+Kr/n))ⁿ decreases as n increases." },
      { q: "A carboxylic acid passes into the aqueous phase when the pH is…", options: ["greater than its pKa", "lower than its pKa", "always equal to 7", "below 0"], answer: 0, why: "It ionizes to the carboxylate." },
      { q: "An amine is extracted into water with…", options: ["dilute HCl", "NaOH", 'Na₂SO₄', "ethanol"], answer: 0, why: "It forms the water-soluble ammonium salt." },
      { q: "When shaking with ether you must…", options: ["vent the funnel", "close it hermetically", "heat", "add salt"], answer: 0, why: "Ether is volatile and the pressure rises." },
      { q: "K = 6 and r = 1: the fraction extracted in one stage is…", options: ['6/7 ≈ 86 %', '50 %', '14 %', '100 %'], answer: 0, why: 'E = Kr/(1 + Kr).' }
    ],
    help: { intro: "Choose the solvent, solute, volume and number of extractions; with an acid or base change the pH. The orange dots are in the organic phase.", items: [['Funnel', 'the top layer is the less dense phase; orange dots = solute in the organic phase, blue = in the aqueous phase.'], ['Controls', '“Organic solvent”, “Solute”, “Total organic / aqueous volume”, “No. of extractions” and “pH of the aqueous phase”.'], ['Charts', '% extracted by number of extractions and “Effective D and % extracted versus pH”.']], try: ['With the same total volume, compare 1 extraction with 3: several small ones extract more.', 'With a carboxylic acid raise the pH above its pKa: it moves into the aqueous phase.', 'Pick a solvent denser than water: the organic phase ends up at the bottom.'] }
  };
  MSim.create(def);
})();
