/* Semiconductores y teoría de bandas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, kB = 8.617e-5;
  var MT = { si: { n: "Silicon", eg: 1.12, cls: 'semiconductor' }, ge: { n: "Germanium", eg: 0.67, cls: 'semiconductor' }, gaas: { n: 'GaAs', eg: 1.42, cls: 'semiconductor' }, gan: { n: 'GaN', eg: 3.4, cls: "semiconductor (blue LED)" }, c: { n: "Diamond", eg: 5.5, cls: "insulator" }, cu: { n: "Copper", eg: 0, cls: 'conductor (metal)' } };
  var S = { m: 'si', T: 300, dop: 'none', nd: 0, p: 0 }, g = null, lab = [], el = [], holes = [], bandV = null, bandC = null, ef = null, jun = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function ni(m, Tk) { var eg = MT[m].eg; return eg === 0 ? 1e22 : 2.5e19 * Math.pow(Tk / 300, 1.5) * Math.exp(-eg / (2 * kB * Tk)); }
  function wl(eg) { return eg > 0 ? 1239.84 / eg : 0; }
  function wcol(l) { if (l < 380 || l > 780) return null; var r = 0, gg = 0, b = 0; if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { gg = (l - 440) / 50; b = 1; } else if (l < 510) { gg = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; gg = 1; } else if (l < 645) { r = 1; gg = -(l - 645) / 65; } else r = 1; return new T.Color(r, gg, b); }
  function stages() {
    return [
      ["Energy bands", "Bands", "The N atomic orbitals merge into nearly continuous bands",
        "<p>In a solid, the atomic orbitals of N atoms combine into <b>N molecular orbitals</b> so close together that they form <b>bands</b>. The <b>valence band</b> (VB) is full of electrons; the <b>conduction band</b> (CB) is empty. Between them there is a <b>band gap</b> of energy E<sub>g</sub>. Conduction requires electrons in the CB (or holes in the VB).</p>"],
      ["Metals, insulators and semiconductors", "Classification", "Eg = 0 (metal) · small Eg (semiconductor) · large Eg (insulator)",
        "<p>In a <b>metal</b> the bands overlap (E<sub>g</sub> = 0): electrons always conduct. An <b>insulator</b> has a large E<sub>g</sub> (diamond: 5.5 eV): at room temperature there are no electrons in the CB. A <b>semiconductor</b> has E<sub>g</sub> ≈ 0.5–3 eV: some electrons move to the CB by thermal agitation, leaving <b>holes</b> in the VB. Choose the material.</p>"],
      ["Effect of temperature", "Temperature", "The CB population grows exponentially with T",
        "<p>The concentration of intrinsic carriers is <b>n<sub>i</sub> ∝ T<sup>3/2</sup> · exp(−E<sub>g</sub>/2k<sub>B</sub>T)</b>. On heating a semiconductor, <b>its conductivity increases</b> (unlike a metal, whose conductivity falls because of greater scattering). Raise the temperature and watch more electrons promoted.</p>"],
      ["n and p doping", "Doping", "P (5 e⁻) contributes electrons; B (3 e⁻) creates holes",
        "<p>Silicon is <b>doped</b> with impurities: <b>phosphorus</b> (group 15, 5 e⁻) leaves a donor level just below the CB → <b>n-type</b> semiconductor (carriers: electrons). <b>Boron</b> (group 13, 3 e⁻) creates an acceptor level above the VB → <b>p-type</b> (carriers: holes). With barely 1 dopant atom per 10⁷ of Si the conductivity increases enormously.</p>"],
      ["p–n junction and LED", "p–n junction", "The junction rectifies the current; if it emits light, λ = 1240/Eg",
        "<p>A <b>p–n junction</b> forms a depletion zone with an electric field: it conducts in forward bias and blocks in reverse (<b>diode</b>). In an <b>LED</b>, CB electrons recombine with holes and emit a photon of energy ≈ E<sub>g</sub>: <b>λ(nm) = 1240/E<sub>g</sub>(eV)</b>. That is why GaN (3.4 eV, ~365 nm) makes blue/white LEDs possible; GaAs (1.42 eV) emits infrared.</p>"]
    ];
  }
  var def = {
    key: 'semiconductores-bandas', title: "Semiconductors and Band Theory", subtitle: "3D Simulator · general chemistry", accent: { dark: '#91a7ff', light: '#364fc7' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [4, 4, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 2], target: [0, 0, 0] }],
    layers: [{ id: 'e', label: "Electrons", icon: '−' }, { id: 'h', label: "Holes", icon: '+' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      bandV = new T.Mesh(new T.BoxGeometry(14, 3, 3), new T.MeshStandardMaterial({ color: 0x4263eb, transparent: true, opacity: 0.6 })); g.add(bandV); bandC = new T.Mesh(new T.BoxGeometry(14, 3, 3), new T.MeshStandardMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.6 })); g.add(bandC);
      ef = new T.Mesh(new T.BoxGeometry(14.5, 0.06, 3.2), new T.MeshBasicMaterial({ color: 0xffd43b })); g.add(ef);
      for (i = 0; i < 40; i++) { var e = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(e); el.push(e); var h = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.8 })); g.add(h); holes.push(h); }
      for (i = 0; i < 6; i++) { var j = new T.Mesh(new T.BoxGeometry(2.4, 5, 3), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); j.visible = false; g.add(j); jun.push(j); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { if (i === 0) { S.m = 'si'; S.T = 300; S.dop = 'none'; } if (i === 1) { S.m = ['cu', 'si', 'c'][Math.min(2, Math.floor(f.local * 3))]; S.T = 300; S.dop = 'none'; } if (i === 2) { S.m = 'si'; S.T = 200 + 800 * f.local; S.dop = 'none'; } if (i === 3) { S.m = 'si'; S.T = 300; S.dop = f.local < 0.5 ? 'n' : 'p'; S.nd = 0.5; } if (i === 4) { S.m = ['gaas', 'si', 'gan'][Math.min(2, Math.floor(f.local * 3))]; S.dop = 'pn'; } }
      var m = MT[S.m], eg = m.eg, gapH = Math.max(0.0, Math.min(8, eg * 1.7)), cs = 4, y0 = -gapH / 2, yc = gapH / 2;
      lab.forEach(function (l) { l.vis(false); }); jun.forEach(function (j) { j.visible = false; });
      bandV.position.set(0, y0 - 1.5, 0); bandC.position.set(0, yc + 1.5 - (eg === 0 ? 1.5 : 0), 0); if (eg === 0) { bandV.position.y = -0.8; bandC.position.y = 0.2; bandV.scale.y = 1; }
      var Tk = S.T, ni0 = ni(S.m, Tk), frac = eg === 0 ? 0.5 : Math.min(1, Math.log10(Math.max(1, ni0)) / 22); var nC = eg === 0 ? 24 : Math.round(40 * Math.pow(frac, 2.2)) ; if (S.dop === 'n') nC = Math.min(40, nC + Math.round(S.nd * 18)); if (S.dop === 'p') nC = Math.round(nC * 0.6);
      var nH = eg === 0 ? 0 : (S.dop === 'p' ? Math.min(40, Math.round(40 * Math.pow(frac, 2.2)) + Math.round(S.nd * 18)) : (S.dop === 'n' ? Math.round(40 * Math.pow(frac, 2.2) * 0.6) : Math.round(40 * Math.pow(frac, 2.2)))); var eOn = ctx.layer('e'), hOn = ctx.layer('h');
      el.forEach(function (e, j) { e.visible = eOn && j < nC; var u = (now * (0.3 + Tk / 600) * 0.5 + j * 0.173) % 1; e.position.set(-6.5 + 13 * ((j * 0.37 + u) % 1), yc + 1.0 + 0.4 * Math.sin(now * 2 + j) + (eg === 0 ? -0.5 : 0), Math.sin(j) * 1.0); e.position.y = (eg === 0 ? 0.3 : yc + 0.4 + (j % 3) * 0.4); });
      holes.forEach(function (h, j) { h.visible = hOn && j < nH; var u = (now * (0.3 + Tk / 600) * 0.4 + j * 0.211) % 1; h.position.set(-6.5 + 13 * ((j * 0.41 + u) % 1), y0 - 0.1 - (j % 3) * 0.4, Math.cos(j) * 1.0); });
      var efy = S.dop === 'n' ? yc - 0.4 : (S.dop === 'p' ? y0 + 0.4 : (y0 + yc) / 2); ef.position.set(0, eg === 0 ? -0.3 : efy, 0); ef.visible = S.dop !== 'pn';
      if (S.dop === 'pn') { var pnx = [-6, -3.4, -0.8, 0.8, 3.4, 6]; jun.forEach(function (j, k) { j.visible = true; j.position.set((k - 2.5) * 2.5, 0, 0); j.material.color.setHex(k < 3 ? 0xff6b6b : 0x4dabf7); j.material.opacity = (k === 2 || k === 3) ? 0.15 : 0.45; }); var c = wcol(wl(eg)); lab[3].pos(0, 4.2, 0).set("Depletion zone · e⁻/hole recombination → photon " + (wl(eg) > 780 ? "(infrared)" : (wl(eg) < 380 ? '(UV)' : '')), 'bl-d').vis(true); bandV.visible = false; bandC.visible = false; el.forEach(function (e) { e.visible = false; }); holes.forEach(function (h) { h.visible = false; }); ef.visible = false; var lt = jun[2]; lt.material.color.copy(c || new T.Color(0xffffff)); lt.material.opacity = 0.55 + 0.35 * Math.sin(now * 6); jun[3].material.color.copy(c || new T.Color(0xffffff)); jun[3].material.opacity = 0.55 + 0.35 * Math.sin(now * 6); lt.visible = true; lab[2].pos(0, -4, 0).set('λ = ' + fmt(wl(eg), 0) + ' nm (E = ' + fmt(eg, 2) + ' eV)', 'bl-lead').vis(true); lab[0].pos(-6, 4, 0).set("p-type (holes)", 'bl-d').vis(true); lab[1].pos(6, 4, 0).set("n-type (electrons)", 'bl-d').vis(true); return; }
      bandV.visible = true; bandC.visible = true;
      lab[0].pos(8.6, yc + 1.5, 0).set("Conduction band", 'bl-d').vis(true); lab[1].pos(8.6, y0 - 1.5, 0).set("Valence band", 'bl-d').vis(true);
      lab[2].pos(0, (y0 + yc) / 2, 0).set(eg === 0 ? "overlapping bands" : 'Eg = ' + fmt(eg, 2) + ' eV', 'bl-lead').vis(true); lab[3].pos(0, 7, 0).set(m.n + ' · ' + m.cls + ' · T = ' + fmt(Tk, 0) + ' K', 'bl-lead').vis(true);
      lab[4].pos(0, -7, 0).set(S.dop === 'n' ? "n-type (P): donor level below the CB" : (S.dop === 'p' ? "p-type (B): acceptor level above the VB" : "intrinsic · nᵢ ≈ " + (eg === 0 ? '10²² cm⁻³' : ni0.toExponential(1).replace('e+', '×10^').replace('e-', '×10^−') + ' cm⁻³')), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); if (u.T) u.T.set(S.T); if (u.dop) u.dop.set(S.dop); },
    hud: function () { var m = MT[S.m], n0 = ni(S.m, S.T); return { eq: { chip: fmt(m.eg, 2), name: m.n, body: '<div class="eqline"><small>Eg</small>' + fmt(m.eg, 2) + " eV</div><div class=\"eqline\"><small>Class</small>" + m.cls + '</div><div class="eqline"><small>nᵢ (300 K)</small>' + (m.eg === 0 ? '—' : ni(S.m, 300).toExponential(1) + ' cm⁻³') + "</div><div class=\"eqline\"><small>Emission λ</small>" + (m.eg > 0 ? fmt(wl(m.eg), 0) + ' nm' : '—') + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "electrons in the CB" }, { label: "Red", color: '#ff6b6b', text: "holes in the VB" }] }; },
    measures: function () { var m = MT[S.m]; return [['Material', m.n], ["Class", m.cls], ['Eg', fmt(m.eg, 2) + ' eV'], ['T', fmt(S.T, 0) + ' K'], ['nᵢ', m.eg === 0 ? '—' : ni(S.m, S.T).toExponential(2) + ' cm⁻³'], ["Doping", { none: "none", n: "n-type", p: "p-type", pn: "p–n junction" }[S.dop]]]; },
    ideas: ["Eg: metal 0 · semiconductor 0.5–3 eV · insulator > 4 eV.", "nᵢ ∝ exp(−Eg/2kT): rises with T.", "n-type: P (5 e⁻). p-type: B (3 e⁻).", "LED: λ = 1240/Eg."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Material'); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Material', cols: 3, value: S.m, options: Object.keys(MT).map(function (k) { return { v: k, label: MT[k].n, sub: fmt(MT[k].eg, 2) + ' eV' }; }), onChange: function (v) { ctx.goManual(); S.m = v; } }); c.appendChild(ui.m);
      ui.T = kit.ui.slider({ label: "Temperature", min: 100, max: 1000, step: 10, value: S.T, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = v; } }); c.appendChild(kit.ui.sliders([ui.T]));
      ui.dop = kit.ui.options({ label: "Doping", cols: 2, value: S.dop, options: [{ v: 'none', label: "Intrinsic" }, { v: 'n', label: "n-type (P)" }, { v: 'p', label: "p-type (B)" }, { v: 'pn', label: "p–n junction (LED)" }], onChange: function (v) { ctx.goManual(); S.dop = v; } }); c.appendChild(ui.dop);
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Intrinsic concentration nᵢ versus T", h: 240, note: "log₁₀ nᵢ (cm⁻³): grows with T and falls as Eg increases.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 200; i <= 1000; i += 200) cx.fillText(i, L + pw * (i - 200) / 800, h - B + 14); cx.fillText('T (K)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 20; i += 5) cx.fillText(i, L - 4, Tp + ph * (1 - i / 22) + 3);
        var cols = { si: '#4dabf7', ge: '#69db7c', gaas: '#fab005', gan: '#cc5de8' }; Object.keys(cols).forEach(function (k) { cx.strokeStyle = cols[k]; cx.lineWidth = k === S.m ? 3 : 1.5; cx.beginPath(); for (var t = 200; t <= 1000; t += 20) { var y = Math.log10(Math.max(1, ni(k, t))); (t > 200 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (t - 200) / 800, Tp + ph * (1 - y / 22)); } cx.stroke(); cx.fillStyle = cols[k]; cx.textAlign = 'left'; cx.fillText(MT[k].n, L + 6, Tp + 12 + 12 * Object.keys(cols).indexOf(k)); }); cx.lineWidth = 1;
        if (MT[S.m].eg > 0) { cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.T - 200) / 800, Tp + ph * (1 - Math.log10(Math.max(1, ni(S.m, S.T))) / 22), 5, 0, 6.28); cx.fill(); }
      } },
      { title: "Band gap width and wavelength", h: 220, note: "Bars: Eg (eV). Below: λ = 1240/Eg in nm.", draw: function (cx, w, h, col) {
        var ks = Object.keys(MT), L = 14, Rr = 10, Tp = 14, B = 44, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ks.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
        ks.forEach(function (k, j) { var eg = MT[k].eg, c = wcol(wl(eg)); cx.fillStyle = k === S.m ? '#ffa94d' : '#748ffc'; cx.fillRect(L + j * bw + 6, Tp + ph * (1 - eg / 6), bw - 12, ph * eg / 6 + 0.5); cx.fillStyle = col.ink; cx.fillText(fmt(eg, 2), L + j * bw + bw / 2, Tp + ph * (1 - eg / 6) - 3); cx.fillStyle = col.muted; cx.fillText(MT[k].n, L + j * bw + bw / 2, h - B + 14); cx.fillText(eg > 0 ? fmt(wl(eg), 0) + ' nm' : '—', L + j * bw + bw / 2, h - B + 28); });
      } }
    ],
    calc: function () { var m = MT[S.m], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (m.eg === 0) return '<div class="card-kicker">' + m.n + '</div><table class="calc-table">' + row('Eg', "0 (overlapping bands)") + row("Conductivity", "high; decreases as T rises") + '</table>'; var ni0 = ni(S.m, S.T), Ef = m.eg * 1.60218e-19, lam = wl(m.eg); return '<div class="card-kicker">' + m.n + ' a ' + S.T + ' K</div><table class="calc-table">' + row('Eg', fmt(m.eg, 2) + ' eV = ' + fmt(Ef * 1e19, 2) + ' × 10⁻¹⁹ J') + row('kT', fmt(kB * S.T, 4) + ' eV') + row('Eg / 2kT', fmt(m.eg / (2 * kB * S.T), 1)) + row('nᵢ', ni0.toExponential(2) + ' cm⁻³') + row("λ of a photon of energy Eg", '1240/' + fmt(m.eg, 2) + ' = <b>' + fmt(lam, 0) + ' nm</b>') + '</table>'; },
    quiz: [
      { q: "In an intrinsic semiconductor, on heating, the conductivity…", options: ["increases", "decreases", "does not change", "drops to zero"], answer: 0, why: "More electrons in the CB." },
      { q: "Silicon doped with phosphorus is…", options: ["n-type", "p-type", "insulator", 'metal'], answer: 0, why: "P contributes e⁻." },
      { q: "Diamond is an insulator because…", options: ["Eg ≈ 5.5 eV", 'Eg = 0', "it has no electrons", "it is metallic"], answer: 0, why: "Very wide band gap." },
      { q: "λ of the photon emitted by an LED with Eg = 2.48 eV:", options: ['500 nm', '1000 nm', '250 nm', '2480 nm'], answer: 0, why: "1240/2.48 = 500 nm." },
      { q: "In a metal the bands…", options: ["overlap", "have a wide gap", "do not exist", "are empty"], answer: 0, why: 'Eg = 0.' }
    ],
    help: { intro: "Choose material, temperature and doping. The blue and red boxes are the valence and conduction bands; the blue spheres are electrons and the red ones, holes.", items: [['Bands', 'blue box = valence band (VB), red box = conduction band (CB); the gap between them is Eg. The yellow line is the Fermi level.'], ['Carriers', 'blue spheres = electrons in the CB; red = holes in the VB.'], ['Controls', '“Material”, “Temperature” and “Doping”: intrinsic, n-type (P), p-type (B) or p–n junction (LED), whose central zone glows when it emits light.'], ['Charts', '“Intrinsic concentration nᵢ versus T” and “Band gap width and wavelength” (λ = 1240/Eg).']], try: ['Heat an intrinsic semiconductor: more electron–hole pairs appear.', 'Dope with P and then with B: compare which carrier dominates and where the Fermi level moves.', 'In the p–n junction change the material and relate Eg to the colour of the LED.'] }
  };
  MSim.create(def);
})();
