/* Química bioinorgánica: metales en la vida — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, M = 210;
  var S = { site: 'hb', lig: 'o2', po2: 40, pco: 0, ph: 7.4, hill: 1, tox: 'none' }, g = null, keyG = '', lab = [];
  function hemoGeo(lig, dz) {
    var a = [['Fe', 0, 0, dz]], b = [], i, n = [];
    for (i = 0; i < 4; i++) { var t = i * Math.PI / 2; a.push(['N', 2.0 * Math.cos(t), 2.0 * Math.sin(t), 0]); b.push([0, 1 + i, 1]); }
    for (i = 0; i < 4; i++) {
      var t0 = i * Math.PI / 2, ia = 1 + i, ca1 = a.length; a.push(['C', 3.0 * Math.cos(t0 - 0.38), 3.0 * Math.sin(t0 - 0.38), 0]); var ca2 = a.length; a.push(['C', 3.0 * Math.cos(t0 + 0.38), 3.0 * Math.sin(t0 + 0.38), 0]);
      var cb1 = a.length; a.push(['C', 4.1 * Math.cos(t0 - 0.2), 4.1 * Math.sin(t0 - 0.2), 0]); var cb2 = a.length; a.push(['C', 4.1 * Math.cos(t0 + 0.2), 4.1 * Math.sin(t0 + 0.2), 0]);
      b.push([ia, ca1, 1], [ia, ca2, 1], [ca1, cb1, 1], [ca2, cb2, 1], [cb1, cb2, 2]); n.push([ca1, ca2]);
    }
    for (i = 0; i < 4; i++) { var tm = i * Math.PI / 2 + Math.PI / 4, me = a.length; a.push(['C', 3.9 * Math.cos(tm), 3.9 * Math.sin(tm), 0]); b.push([n[i][1], me, 1], [n[(i + 1) % 4][0], me, 1]); }
    // histidina proximal (imidazol en el plano xz sobre el hierro)
    var hz = dz + 2.1, N1 = a.length; a.push(['N', 0, 0, hz]); b.push([0, N1, 1]);
    a.push(['C', 1.1, 0, hz + 0.75]); a.push(['N', 0.7, 0, hz + 2.0]); a.push(['C', -0.7, 0, hz + 2.0]); a.push(['C', -1.1, 0, hz + 0.75]);
    b.push([N1, N1 + 1, 1], [N1 + 1, N1 + 2, 2], [N1 + 2, N1 + 3, 1], [N1 + 3, N1 + 4, 2], [N1 + 4, N1, 1]);
    if (lig === 'o2') { var o1 = a.length; a.push(['O', 0.5, 0, dz - 1.75]); a.push(['O', 1.2, 0, dz - 2.7]); b.push([0, o1, 1], [o1, o1 + 1, 2]); }
    if (lig === 'co') { var c1 = a.length; a.push(['C', 0, 0, dz - 1.75]); a.push(['O', 0, 0, dz - 2.9]); b.push([0, c1, 1], [c1, c1 + 1, 3]); }
    return { a: a, b: b };
  }
  var MET = {
    zn: { n: "Zn²⁺ · carbonic anhydrase", a: [['Zn', 0, 0, 0], ['N', 1.7, 0, 1.0], ['N', -0.9, 1.5, 1.0], ['N', -0.9, -1.5, 1.0], ['O', 0, 0, -1.9], ['H', 0.8, 0, -2.4], ['H', -0.8, 0, -2.4]], b: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6]], note: "Tetrahedral: 3 His + H₂O. Zn²⁺ polarizes the water and generates OH⁻, which attacks CO₂: CO₂ + H₂O ⇌ HCO₃⁻ + H⁺." },
    mg: { n: "Mg²⁺ · chlorophyll a", a: [['Mg', 0, 0, 0]], b: [], note: "Mg²⁺ at the center of a chlorin; it does not change redox state, and it maintains planarity and the absorption of red and blue light." },
    cu: { n: "Cu · azurin (electron transfer)", a: [['Cu', 0, 0, 0], ['N', 1.9, 0, 0.3], ['N', -0.95, 1.6, 0.3], ['S', -0.95, -1.9, 0.2], ['S', 0, 0, 2.5]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], note: "Blue copper site: His, His, Cys (S⁻) and axial Met. Cu²⁺/Cu⁺ with little reorganization: fast electron transfer." },
    cyt: { n: "Fe · cytochrome c (Fe³⁺/Fe²⁺)", a: [['Fe', 0, 0, 0]], b: [], note: "Hexacoordinate Fe (porphyrin + His + Met): no free site for O₂, it only carries electrons, E° ≈ +0.25 V." }
  };
  var TOX = { none: { n: "No toxic metal", m: '' }, pb: { n: 'Pb²⁺', m: "Replaces Ca²⁺ and Zn²⁺ (inhibits ALA dehydratase)." }, hg: { n: "Hg²⁺ / CH₃Hg⁺", m: "Soft acid: binds –SH groups (cysteine)." }, cd: { n: 'Cd²⁺', m: "Displaces Zn²⁺ from enzymes and accumulates in the kidney." } };
  function p50() { return 26 * Math.pow(10, 0.45 * (7.4 - S.ph)); }
  function n() { return S.hill; }
  function pco50() { return 26 / M; }
  function yO2(p, nn, pc) { var x = Math.pow(p / p50(), nn); return x / (1 + x + (pc || 0) / pco50()); }
  function yCO() { var x = Math.pow(S.po2 / p50(), n()); return (S.pco / pco50()) / (1 + x + S.pco / pco50()); }
  function ymb(p) { return p / (p + 2.8); }
  function stages() {
    return [
      ["The heme group", "Heme", "Fe²⁺ in a porphyrin, with a proximal histidine and a free site for O₂",
        "<p>In <b>hemoglobin</b> and <b>myoglobin</b>, <b>Fe²⁺</b> is bound to the 4 N of a <b>porphyrin</b> and to the <b>proximal histidine</b>; the sixth position is left free for <b>O₂</b>. In the deoxygenated form, the Fe (high spin) sticks out ~0.4 Å from the plane; on binding O₂ (low spin) it moves into the plane and pulls the histidine along, which triggers the change in protein structure.</p>"],
      ["Cooperativity", "Cooperativity", "Sigmoid curve: Hill n ≈ 2.8",
        "<p>Hemoglobin has <b>4 subunits</b> and binds O₂ <b>cooperatively</b>: each bound O₂ makes the next easier, and the curve is <b>sigmoidal</b> (Hill n ≈ 2.8, P₅₀ ≈ 26 mmHg). Myoglobin, with a single subunit, is hyperbolic (P₅₀ ≈ 2.8 mmHg). This way Hb loads O₂ in the lungs and unloads it in the tissues.</p>"],
      ["Bohr effect", "Bohr effect", "Lower pH → lower O₂ affinity",
        "<p>A <b>lower pH</b> (more CO₂ and H⁺ in active tissues) <b>stabilizes the deoxygenated form</b> and shifts the curve to the right: P₅₀ rises and Hb delivers more O₂ right where it is needed (<b>Bohr</b> effect). Here P₅₀ = 26·10<sup>0.45(7.4 − pH)</sup>, a simplified model.</p>"],
      ["CO poisoning", 'CO', "CO binds to Fe²⁺ ~200 times better than O₂",
        "<p><b>CO</b> is a π-acceptor ligand that binds Fe²⁺ with an affinity <b>≈ 210 times greater</b> than O₂ and leaves Hb in the R form, which retains the remaining O₂: the blood carries less oxygen and delivers it poorly. Increase pCO and watch the O₂ saturation fall.</p>"],
      ["Other metals and toxicity", "Metals", "Zn, Mg, Cu, Fe (cytochrome) and toxic metals",
        "<p>Each metal plays a role according to its chemistry: <b>Zn²⁺</b> as a Lewis acid (carbonic anhydrase), <b>Mg²⁺</b> in chlorophyll, <b>Cu</b> in electron-transfer proteins (azurin) and hexacoordinate <b>Fe</b> in cytochromes. Toxic metals act by <b>substitution</b> (Pb²⁺, Cd²⁺) or by soft affinity for –SH (Hg²⁺); <b>chelators</b> (EDTA, BAL) remove them from the blood.</p>"]
    ];
  }
  var def = {
    key: 'bioinorganica', title: "Bioinorganic chemistry: metals in life", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [21, 8, 18], target: [21, 0, 0] }, { id: 'lateral', label: "Side", pos: [21, 0, 20], target: [21, 0, 0] }],
    layers: [{ id: 'spin', label: "Rotation", icon: '⟳' }],
    build: function (ctx) { g = new T.Group(); g.position.set(25, 0, 0); ctx.scene.add(g); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i;
      if (!P.manual) {
        if (i === 0) { S.site = 'hb'; S.lig = ['none', 'o2', 'co'][Math.min(2, Math.floor(f.local * 3))]; }
        if (i === 1) { S.site = 'hb'; S.lig = 'o2'; S.po2 = 1 + 99 * f.local; S.ph = 7.4; S.pco = 0; S.hill = 2.8; }
        if (i === 2) { S.site = 'hb'; S.lig = 'o2'; S.ph = 7.6 - 1.0 * f.local; S.po2 = 40; S.pco = 0; S.hill = 2.8; }
        if (i === 3) { S.site = 'hb'; S.pco = 0.6 * f.local; S.po2 = 100; S.ph = 7.4; S.lig = f.local > 0.45 ? 'co' : 'o2'; S.hill = 2.8; }
        if (i === 4) { S.site = ['zn', 'mg', 'cu', 'cyt'][Math.min(3, Math.floor(f.local * 4))]; S.tox = ['none', 'pb', 'hg', 'cd'][Math.min(3, Math.floor(f.local * 4))]; }
      }
      var k = S.site + '|' + S.lig + '|' + S.tox;
      if (keyG !== k) {
        keyG = k; while (g.children.length) g.remove(g.children[0]);
        if (S.site === 'hb') { var dz = S.lig === 'none' ? 0.55 : 0; g.add(ctx.mol(hemoGeo(S.lig, dz), { gs: 1.0, ar: 0.55 })); }
        else if (S.site === 'mg') { var ge = hemoGeo('none', 0); ge.a = ge.a.slice(0, ge.a.length - 5); ge.b = ge.b.filter(function (x) { return x[0] < ge.a.length && x[1] < ge.a.length; }); ge.a[0] = ['Mg', 0, 0, 0]; g.add(ctx.mol(ge, { gs: 1.0, ar: 0.55 })); }
        else if (S.site === 'cyt') { var gc = hemoGeo('none', 0); var gb = gc.a.length; gc.a.push(['S', 0, 0, -2.3]); gc.b.push([0, gb, 1]); g.add(ctx.mol(gc, { gs: 1.0, ar: 0.55 })); }
        else { var m2 = MET[S.site], geo = { a: m2.a.map(function (x) { return x.slice(); }), b: m2.b.slice() }; if (S.tox !== 'none' && S.site === 'zn') geo.a[0] = [S.tox === 'pb' ? 'Pb' : (S.tox === 'cd' ? 'Cd' : 'Hg'), 0, 0, 0]; g.add(ctx.mol(geo, { gs: 1.4, ar: 0.7 })); }
      }
      if (ctx.layer('spin')) g.rotation.y += dt * 0.35; g.rotation.x = -0.9;
      var st = S.site === 'hb';
      lab[0].pos(25, 8.4, 0).set(st ? "Heme group · " + (S.lig === 'o2' ? "oxyhemoglobin (Fe in the plane)" : (S.lig === 'co' ? "carboxyhemoglobin (CO)" : "deoxyhemoglobin (Fe out of the plane)")) : MET[S.site].n, 'bl-lead').vis(true);
      lab[1].pos(25, -6.2, 0).set(st ? "O₂ saturation: " + fmt(yO2(S.po2, n(), S.pco) * 100, 0) + " % · CO: " + fmt(yCO() * 100, 0) + ' %' : (S.tox !== 'none' && S.site === 'zn' ? TOX[S.tox].n + " occupies the Zn²⁺ site" : ''), 'bl-pos').vis(true);
      lab[2].pos(25, -7.6, 0).set(st ? "pO₂ " + fmt(S.po2, 0) + " mmHg · pH " + fmt(S.ph, 2) + ' · P₅₀ ' + fmt(p50(), 1) + ' mmHg' : '', 'bl-d').vis(st);
      lab[3].pos(25, -7.6, 0).set(!st ? (S.tox !== 'none' ? TOX[S.tox].m : '') : '', 'bl-neg').vis(!st && S.tox !== 'none');
    },
    sync: function (ctx) { var u = ctx.ui; ['lig', 'po2', 'pco', 'ph', 'site', 'tox'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'Fe', name: "O₂ transport", body: "<div class=\"eqline\"><small>O₂ sat.</small>" + fmt(yO2(S.po2, n(), S.pco) * 100, 0) + " %</div><div class=\"eqline\"><small>CO sat.</small>" + fmt(yCO() * 100, 0) + ' %</div><div class="eqline"><small>P₅₀</small>' + fmt(p50(), 1) + " mmHg</div><div class=\"eqline\"><small>Hill n</small>" + fmt(n(), 1) + '</div>' }, legend: [{ label: "Orange sphere", color: '#e06633', text: 'Fe' }, { label: "Blue", color: '#4f7cff', text: "N (porphyrin and histidine)" }, { label: "Red", color: '#ff4d4d', text: 'O₂' }] }; },
    measures: function () { return [["O₂ saturation", fmt(yO2(S.po2, n(), S.pco) * 100, 0) + ' %'], ["CO saturation", fmt(yCO() * 100, 0) + ' %'], ['P₅₀ (O₂)', fmt(p50(), 1) + ' mmHg'], ["Hill n", fmt(n(), 1)], ["CO/O₂ affinity", '≈ 210 ×'], ["Site shown", S.site === 'hb' ? 'hemo' : MET[S.site].n]]; },
    ideas: ["Cooperative Hb: sigmoid (n ≈ 2.8).", "Lower pH → higher P₅₀ (Bohr).", "CO ≈ 210× higher affinity than O₂.", "Toxic metals displace or bind to –SH."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Hemoglobin"); el.appendChild(c);
      ui.site = kit.ui.options({ label: "Site", cols: 3, value: S.site, options: [{ v: 'hb', label: "Heme (Hb)" }, { v: 'zn', label: "Zn · CA" }, { v: 'mg', label: "Mg · chlorophyll" }, { v: 'cu', label: "Cu · azurin" }, { v: 'cyt', label: "Fe · cyt. c" }], onChange: function (v) { ctx.goManual(); S.site = v; } });
      ui.lig = kit.ui.options({ label: "Heme ligand", cols: 3, value: S.lig, options: [{ v: 'none', label: "None" }, { v: 'o2', label: 'O₂' }, { v: 'co', label: 'CO' }], onChange: function (v) { ctx.goManual(); S.lig = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.site); c.appendChild(ui.lig); c.appendChild(kit.ui.sliders([sl('po2', 'pO₂', 1, 100, 1, function (v) { return v + ' mmHg'; }), sl('pco', 'pCO', 0, 0.6, 0.01, function (v) { return fmt(v, 2) + ' mmHg'; }), sl('ph', 'pH', 6.8, 7.8, 0.05, function (v) { return fmt(v, 2); }), sl('hill', "Hill n (1 = myoglobin)", 1, 3, 0.1, function (v) { return fmt(v, 1); })]));
      ui.tox = kit.ui.options({ label: "Toxic metal at the Zn site", cols: 2, value: S.tox, options: Object.keys(TOX).map(function (k) { return { v: k, label: TOX[k].n }; }), onChange: function (v) { ctx.goManual(); S.tox = v; S.site = 'zn'; } }); c.appendChild(ui.tox);
      c.appendChild(ctx.btnRow([{ t: "Hb (n = 2.8)", fn: function () { ctx.goManual(); S.hill = 2.8; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "O₂ saturation curve", h: 220, note: "Hb: cooperative sigmoid. Mb: hyperbolic to the left. The dot marks the current pO₂.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; function X(p) { return L + pw * p / 100; } function Yy(v) { return Tp + ph * (1 - v); }
      [[function (p) { return ymb(p); }, '#69db7c'], [function (p) { return yO2(p, n(), S.pco); }, '#ff8787']].forEach(function (s) { cx.strokeStyle = s[1]; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 100; i++) { var xx = X(i), yy = Yy(s[0](i)); i ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy); } cx.stroke(); });
      cx.lineWidth = 1; cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(X(S.po2), Yy(yO2(S.po2, n(), S.pco)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText("100 mmHg", L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8); cx.fillText('Mb', X(60), Yy(ymb(60)) - 6); cx.fillText('Hb', X(60) + 10, Yy(yO2(60, n(), S.pco)) + 14);
    } }, { title: "P₅₀ by pH (Bohr effect)", h: 190, note: "At lower pH Hb needs a higher pO₂ to reach 50 % saturation.", draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 50; i++) { var pH = 6.8 + i * 0.02, v = 26 * Math.pow(10, 0.45 * (7.4 - pH)), xx = L + pw * i / 50, yy = Tp + ph * (1 - v / 60); i ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(L + pw * (S.ph - 6.8) / 1.0, Tp + ph * (1 - p50() / 60), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText("pH 6.8", L, h - 8); cx.fillText("pH 7.8", L + pw, h - 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, x = Math.pow(S.po2 / p50(), n()); return "<div class=\"card-kicker\">Hill equation with CO competition</div><table class=\"calc-table\">" + row('P₅₀', '26 · 10^(0,45·(7,4 − ' + fmt(S.ph, 2) + ')) = <b>' + fmt(p50(), 1) + ' mmHg</b>') + row('(pO₂/P₅₀)ⁿ', fmt(S.po2, 0) + '/' + fmt(p50(), 1) + ' ^ ' + fmt(n(), 1) + ' = ' + fmt(x, 2)) + row('Y(O₂)', "x / (1 + x + pCO/P₅₀,CO) = <b>" + fmt(yO2(S.po2, n(), S.pco) * 100, 1) + ' %</b>') + row('Y(CO)', '<b>' + fmt(yCO() * 100, 1) + " %</b> (P₅₀,CO = P₅₀(O₂)/210 = " + fmt(pco50(), 3) + " mmHg)") + row('Y(Mb)', fmt(ymb(S.po2) * 100, 1) + ' %') + '</table>'; },
    quiz: [
      { q: "In deoxyhemoglobin the Fe²⁺ is…", options: ["protruding from the plane of the porphyrin", "at the exact center of the plane", "in the Fe³⁺ state", "free from the protein"], answer: 0, why: "High spin, larger radius." },
      { q: "The hemoglobin curve is sigmoidal because of…", options: ["cooperativity between subunits", "low O₂ affinity", "being a monomer", "constant pH"], answer: 0, why: "Each O₂ makes the next one easier." },
      { q: "When the pH drops, the P₅₀ of Hb…", options: ["increases", "decreases", "does not change", "drops to zero"], answer: 0, why: "Bohr effect: lower affinity." },
      { q: "CO binds to Hb with an affinity roughly…", options: ["210 times greater than O₂", "equal to O₂", "10 times lower", "zero"], answer: 0, why: "Strong π-acceptor ligand." },
      { q: "Zn²⁺ in carbonic anhydrase acts as a…", options: ["Lewis acid", "e⁻ carrier", "O₂ donor", "chelator"], answer: 0, why: "It polarizes the coordinated H₂O." },
      { q: "Hg²⁺ is toxic mainly because it binds to…", options: ["–SH groups", "hard –OH groups", "CO₂", "free porphyrins"], answer: 0, why: "Soft acid ↔ soft S base." }
    ],
    help: { intro: "In \"Lab\" choose the ligand (none, O₂, CO), pO₂, pH and pCO; in \"Graphs\" the saturation curve is shown. The last stage shows other metal sites.", items: [['Heme', 'orange sphere = Fe; blue = N of the porphyrin and histidine; red = bound O₂.'], ['Controls', '“Heme ligand” (none, O₂ or CO), pO₂, pH and pCO. The site selector shows other metal centres (Zn in carbonic anhydrase, Mg in chlorophyll, Cu in azurin, Fe in cytochrome c) and “Toxic metal at the Zn site”.'], ['Charts', '“O₂ saturation curve” (sigmoidal, n ≈ 2.8) and “P₅₀ by pH (Bohr effect)”.']], try: ['Lower the pH: the curve shifts to the right and P₅₀ rises.', 'Add a little CO: it takes up sites with ≈ 210 times the affinity of O₂.', 'Put a toxic metal in the Zn site and see what changes at the active centre.'] }
  };
  MSim.create(def);
})();
