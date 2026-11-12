/* Nomenclatura y fórmulas de complejos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { '+': '⁺', '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴' };
  function sub(n) { return String(n).split('').map(function (c) { return SUB[+c]; }).join(''); }
  var MT = {
    Co: { n: "cobalt", a: "cobaltate", c: 0xe64980, ox: [2, 3] }, Fe: { n: "iron", a: "ferrate", c: 0xe8590c, ox: [2, 3] }, Cr: { n: "chromium", a: "chromate", c: 0x7048e8, ox: [2, 3] },
    Ni: { n: "nickel", a: "nickelate", c: 0x2f9e44, ox: [0, 2] }, Cu: { n: "copper", a: "cuprate", c: 0x1098ad, ox: [1, 2] }, Pt: { n: "platinum", a: "platinate", c: 0x868e96, ox: [2, 4] },
    Zn: { n: "zinc", a: "zincate", c: 0x7d80b0, ox: [2] }, Ag: { n: "silver", a: "argentate", c: 0xced4da, ox: [1] }, Mn: { n: "manganese", a: "manganate", c: 0xcc5de8, ox: [2, 3] }
  };
  var LG = {
    h2o: { n: "aqua", f: 'H₂O', q: 0, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: "water" }, nh3: { n: "ammine", f: 'NH₃', q: 0, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: "ammonia" },
    cl: { n: "chloro", f: 'Cl', q: -1, d: 1, a: 'Cl', c: 0x3ddc5a, cx: 0, nm: "chloride" }, br: { n: "bromo", f: 'Br', q: -1, d: 1, a: 'Br', c: 0xa0522d, cx: 0, nm: "bromide" },
    f: { n: 'fluoro', f: 'F', q: -1, d: 1, a: 'F', c: 0x7ee08a, cx: 0, nm: "fluoride" }, cn: { n: "cyano", f: 'CN', q: -1, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: "cyanide" },
    oh: { n: "hydroxo", f: 'OH', q: -1, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: "hydroxide" }, co: { n: "carbonyl", f: 'CO', q: 0, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: "carbon monoxide" },
    no2: { n: 'nitro', f: 'NO₂', q: -1, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: 'nitrito (N)' }, scn: { n: "thiocyanate", f: 'SCN', q: -1, d: 1, a: 'S', c: 0xe6c229, cx: 0, nm: "thiocyanate (S)" },
    en: { n: "ethylenediamine", f: 'en', q: 0, d: 2, a: 'N,N', c: 0x4f7cff, cx: 1, nm: "ethane-1,2-diamine" }, ox: { n: "oxalate", f: 'ox', q: -2, d: 2, a: 'O,O', c: 0xff4d4d, cx: 1, nm: "oxalate" }
  };
  var PRE = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'], PRX = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis'], ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var PRESETS = [
    { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Fe', ox: 2, A: 'cn', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Cu', ox: 2, A: 'nh3', nA: 4, B: 'cl', nB: 0, g: 'sp' },
    { m: 'Pt', ox: 2, A: 'cl', nA: 2, B: 'nh3', nB: 2, g: 'sp' }, { m: 'Cr', ox: 3, A: 'en', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Ni', ox: 0, A: 'co', nA: 4, B: 'cl', nB: 0, g: 'tet' },
    { m: 'Ag', ox: 1, A: 'nh3', nA: 2, B: 'cl', nB: 0, g: 'lin' }, { m: 'Co', ox: 3, A: 'nh3', nA: 5, B: 'cl', nB: 1, g: 'oct' }, { m: 'Fe', ox: 3, A: 'ox', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Co', ox: 2, A: 'cl', nA: 4, B: 'cl', nB: 0, g: 'tet' }
  ];
  var S = { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct', _st: -1 }, lab = [], gr = null, ligLab = [];
  function cn() { return S.nA * LG[S.A].d + S.nB * LG[S.B].d; }
  function charge() { return S.ox + S.nA * LG[S.A].q + S.nB * LG[S.B].q; }
  function sup(q) { var a = Math.abs(q); return q === 0 ? '' : (a === 1 ? '' : SUP[a]) + (q > 0 ? '⁺' : '⁻'); }
  function parts() {
    var L = []; if (S.nA > 0) L.push({ id: S.A, n: S.nA }); if (S.nB > 0 && S.B !== S.A) L.push({ id: S.B, n: S.nB }); else if (S.nB > 0 && S.B === S.A) L[0].n += S.nB;
    return L;
  }
  function name() {
    var L = parts(), q = charge(), m = MT[S.m], base;
    L.sort(function (a, b) { return LG[a.id].n.localeCompare(LG[b.id].n, 'es'); });
    var ln = L.map(function (l) { var g = LG[l.id], pre = l.n > 1 ? (g.cx ? PRX[l.n] : PRE[l.n]) : ''; return pre + (g.cx ? '(' + g.n + ')' : g.n); }).join('');
    var met = (q < 0 ? m.a : m.n) + '(' + ROM[S.ox] + ')';
    var nm = (ln + met).replace('aa', 'aa');
    if (q > 0) { var an = q === 1 ? "chloride" : "chloride"; return nm + ' ' + an; }
    if (q < 0) return "potassium " + nm;
    return nm;
  }
  function formula() {
    var L = parts(), q = charge();
    L.sort(function (a, b) { var A = LG[a.id], B = LG[b.id]; if (A.q !== B.q) return A.q < B.q ? -1 : 1; return A.f.localeCompare(B.f); });
    var f = S.m + L.map(function (l) { var g = LG[l.id], poly = g.f.replace(/[^A-Z]/g, '').length > 1 || g.f.length > 2 || g.cx; return l.n > 1 ? (poly ? '(' + g.f + ')' : g.f) + sub(l.n) : (poly ? '(' + g.f + ')' : g.f); }).join('');
    var s = '[' + f + ']' + (q === 0 ? '' : '');
    if (q > 0) s += 'Cl' + (q > 1 ? sub(q) : ''); else if (q < 0) s = 'K' + (q < -1 ? sub(-q) : '') + s;
    return s;
  }
  function valid() { var c = cn(); return c === 2 || c === 4 || c === 6; }
  function verts(g, R) {
    if (g === 'lin') return [[R, 0, 0], [-R, 0, 0]];
    if (g === 'tet') { var k = R / Math.sqrt(3); return [[k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]]; }
    if (g === 'sp') return [[R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R]];
    return [[R, 0, 0], [-R, 0, 0], [0, R, 0], [0, -R, 0], [0, 0, R], [0, 0, -R]];
  }
  var PAIRS = { oct: [[0, 2], [1, 4], [3, 5]], tet: [[0, 1], [2, 3]], sp: [[0, 1], [2, 3]] };
  function geomFor() { var c = cn(); return c === 2 ? 'lin' : (c === 6 ? 'oct' : (S.g === 'sp' ? 'sp' : 'tet')); }
  function gname(g) { return { lin: "linear", tet: "tetrahedral", sp: "square planar", oct: "octahedral" }[g]; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Central atom and ligands", "Structure", "A complex = central metal + ligands bound by coordinate bonds",
        "<p>A <b>complex</b> (coordination compound) has a <b>central metal atom or ion</b> surrounded by <b>ligands</b>, which donate an electron pair to the metal (coordinate covalent bond). The <b>coordination number</b> is the number of donor atoms bound to the metal: <b>2 (linear), 4 (tetrahedral or square planar), 6 (octahedral)</b>. The square brackets enclose the coordination sphere: <b>[Co(NH₃)₆]³⁺</b>.</p>"],
      ["Types of ligands", "Ligands", "Monodentate (1 donor atom) and polydentate or chelates (2 or more)",
        "<p>A <b>monodentate</b> ligand binds through a single atom (H₂O, NH₃, Cl⁻, CN⁻). A <b>bidentate</b> binds through two (ethylenediamine <b>en</b>: NH₂CH₂CH₂NH₂; oxalate <b>ox</b>: C₂O₄²⁻) and forms a <b>chelate</b> (ring), which is more stable. They count toward the coordination number according to their <b>denticity</b>: [Cr(en)₃]³⁺ has 3 × 2 = 6 donors. Ligands can be neutral or anionic, and this affects the total charge.</p>"],
      ["Charge and oxidation number", "Charge", "Charge of the complex = oxidation no. of the metal + sum of the ligand charges",
        "<p>The <b>charge of the complex</b> is the sum of the <b>oxidation number of the metal</b> and the charges of the ligands. Examples: [Co(NH₃)₆]: Co³⁺ + 6·0 = <b>3+</b>; [Fe(CN)₆]: Fe²⁺ + 6·(−1) = <b>4−</b>; [PtCl₂(NH₃)₂]: Pt²⁺ + 2·(−1) + 2·0 = <b>0</b>. If the complex is a cation it is paired with anions (Cl⁻); if it is an anion, with cations (K⁺) to neutralize the charge of the salt.</p>"],
      ["How to name a complex", "Naming", "Ligands in alphabetical order + metal with oxidation no. in Roman numerals",
        "<p>Rules: (1) first the <b>ligands</b>, in <b>alphabetical order</b> (the numerical prefix is ignored); (2) <b>prefixes di-, tri-, tetra-, penta-, hexa-</b> for simple ligands and <b>bis-, tris-, tetrakis-</b> (with parentheses) for complex ligands or chelates; (3) then the <b>metal</b> with its <b>oxidation number</b> in Roman numerals in parentheses. Ligands: H₂O = <i>aqua</i>, NH₃ = <i>ammine</i>, Cl⁻ = <i>chloro</i>, CN⁻ = <i>cyano</i>, OH⁻ = <i>hydroxo</i>, CO = <i>carbonyl</i>.</p>"],
      ["Anionic complexes and salts", "Anions and salts", "If the complex is an anion, the metal ends in -ate",
        "<p>An <b>anionic</b> complex is named with the ending <b>-ate</b> on the metal (<b>ferrate, cobaltate, cuprate, nickelate, platinate, argentate…</b>), and the cation is cited first: <b>potassium hexacyanoferrate(II)</b>, K₄[Fe(CN)₆]. A <b>cationic</b> complex keeps the name of the metal and the anion is cited last: <b>hexaamminecobalt(III) chloride</b>. Neutral complexes are named as they are: tetracarbonylnickel(0).</p>"],
      ["Formula and practice", "Formula", "Formula: metal first, then anionic and neutral ligands in alphabetical order",
        "<p>In the formula, the <b>metal</b> symbol goes first; then the ligands (anionic and then neutral, each group in alphabetical order), with parentheses if the ligand is polyatomic. All inside square brackets with the charge at the top right. In “Lab” create your own complexes: if the sum of donors is not 2, 4 or 6 the simulator warns you; you can also load the classic examples.</p>"]
    ];
  }
  var SEGP = [[0, 7, 3], [0, 4, 8], [0, 1, 3], [0, 3, 4, 8], [1, 3, 9, 4], [2, 3, 5, 6]];
  var def = {
    key: 'nomenclatura-complejos', title: "Nomenclature of Complexes", subtitle: "3D Simulator · inorganic chemistry", accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [6, 5, 12], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 13], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 13, 1], target: [0, 0, 0] }],
    layers: [{ id: 'lab', label: "Ligand labels", icon: 'L' }, { id: 'bond', label: "Bonds", icon: '─' }],
    build: function (ctx) { for (var i = 0; i < 6; i++) ligLab.push(ctx.label('', 'bl-d')); ['t', 'a', 'b'].forEach(function (k) { lab.push(ctx.label('', 'bl-d')); }); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var sq = SEGP[f.i], n = sq.length, ix = sq[Math.min(n - 1, Math.floor(f.local * n))], p = PRESETS[ix]; if (S._pi !== ix) { S._pi = ix; Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }
      var key = [S.m, S.A, S.nA, S.B, S.nB, S.g, valid()].join('|'); if (key !== S._k) { S._k = key; rebuild(ctx); }
      if (gr) gr.rotation.y = now * 0.3;
      var q = charge(), nmv = valid() ? name() : "(invalid coordination number: " + cn() + ')', fv = valid() ? formula() : '—';
      lab[0].pos(0, 5.6, 0).set(nmv, valid() ? 'bl-lead' : 'bl-warn').vis(true); lab[1].pos(0, -5.2, 0).set(fv, 'bl-pos').vis(true);
      lab[2].pos(0, -6.2, 0).set("CN = " + cn() + ' · ' + (valid() ? gname(geomFor()) : '—') + " · charge " + (q > 0 ? '+' : '') + q + " · oxidation no. " + ROM[S.ox], 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['m', 'A', 'B', 'g'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); ['nA', 'nB', 'ox'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: "CN", name: valid() ? formula().replace(/^K\S*?\[/, '[').replace(/\].*$/, ']') + sup(charge()) : "Invalid complex", body: '<div class="eqline"><small>Metal</small>' + MT[S.m].n + "</div><div class=\"eqline\"><small>Coordination number</small>" + cn() + "</div><div class=\"eqline\"><small>Geometry</small>" + (valid() ? gname(geomFor()) : '—') + "</div><div class=\"eqline\"><small>Charge</small>" + charge() + '</div>' }, legend: [{ label: "Central sphere", color: '#' + ('000000' + MT[S.m].c.toString(16)).slice(-6), text: "metal ion" }, { label: "Spheres", color: '#4f7cff', text: "donor atoms" }] }; },
    measures: function () { return [["Name", valid() ? name() : '—'], ["Formula", valid() ? formula() : '—'], ['Metal', MT[S.m].n + ' (' + ROM[S.ox] + ')'], ["Ligand A", LG[S.A].nm + ' × ' + S.nA], ["Ligand B", S.nB ? LG[S.B].nm + ' × ' + S.nB : '—'], ["Coordination number", String(cn())], ["Charge of the complex", String(charge())]]; },
    ideas: ["Charge = oxidation no. + Σ ligand charges.", "Ligands in alphabetical order; di-/tri- (simple), bis-/tris- (complex).", "Anionic complex: metal in -ate (ferrate, cuprate…).", "Coordination number = donor atoms (denticity × no. of ligands)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Build complex"); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Metal', cols: 5, value: S.m, options: Object.keys(MT).map(function (k) { return { v: k, label: k }; }), onChange: function (v) { ctx.goManual(); S.m = v; if (MT[v].ox.indexOf(S.ox) < 0) S.ox = MT[v].ox[0]; } }); c.appendChild(ui.m);
      ui.ox = kit.ui.slider({ label: "Oxidation number", min: 0, max: 4, step: 1, value: S.ox, format: function (v) { return ROM[v]; }, onInput: function (v) { ctx.goManual(); S.ox = v; } });
      ui.A = kit.ui.options({ label: "Ligand A", cols: 4, value: S.A, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : "neutral" }; }), onChange: function (v) { ctx.goManual(); S.A = v; } }); c.appendChild(ui.A);
      ui.nA = kit.ui.slider({ label: "Amount of A", min: 0, max: 6, step: 1, value: S.nA, format: function (v) { return v + ' × ' + LG[S.A].f; }, onInput: function (v) { ctx.goManual(); S.nA = v; } });
      ui.B = kit.ui.options({ label: "Ligand B", cols: 4, value: S.B, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : "neutral" }; }), onChange: function (v) { ctx.goManual(); S.B = v; } }); c.appendChild(ui.B);
      ui.nB = kit.ui.slider({ label: "Amount of B", min: 0, max: 6, step: 1, value: S.nB, format: function (v) { return v + ' × ' + LG[S.B].f; }, onInput: function (v) { ctx.goManual(); S.nB = v; } });
      c.appendChild(kit.ui.sliders([ui.ox, ui.nA, ui.nB]));
      ui.g = kit.ui.options({ label: "Geometry (CN = 4)", cols: 2, value: S.g, options: [{ v: 'tet', label: "Tetrahedral" }, { v: 'sp', label: "Square planar" }], onChange: function (v) { ctx.goManual(); S.g = v; } }); c.appendChild(ui.g);
      var ex = kit.ui.card("Classic examples"); el.appendChild(ex);
      ex.appendChild(ctx.btnRow(PRESETS.map(function (p, i) { return { t: (function () { var o = {}; Object.keys(S).forEach(function (k) { o[k] = S[k]; }); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); var f = formula(); Object.keys(o).forEach(function (k) { S[k] = o[k]; }); return f.replace(/K\S*\[/, '['); })(), fn: function () { ctx.goManual(); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }; })));
      el.appendChild(document.createElement('div')); ex.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Common ligands", h: 270, note: "Name in the complex, charge and denticity. The ones in use are highlighted.", draw: function (cx, w, h, col) {
        var ks = Object.keys(LG), rh = (h - 22) / ks.length; cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText("ligand", 10, 13); cx.fillText("in complex", 76, 13); cx.textAlign = 'right'; cx.fillText("charge", w - 62, 13); cx.fillText("donors", w - 8, 13);
        ks.forEach(function (k, i) { var g = LG[k], y = 20 + i * rh, on = (k === S.A && S.nA > 0) || (k === S.B && S.nB > 0); if (on) { cx.fillStyle = 'rgba(34,211,238,.22)'; cx.fillRect(4, y, w - 8, rh); } cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(g.f, 10, y + rh / 2 + 3); cx.fillText(g.n, 76, y + rh / 2 + 3); cx.textAlign = 'right'; cx.fillText(g.q, w - 62, y + rh / 2 + 3); cx.fillText(g.d === 1 ? 'mono (' + g.a + ')' : 'bi (' + g.a + ')', w - 8, y + rh / 2 + 3); });
      } },
      { title: "Geometry according to the coordination number", h: 150, note: "CN 2 linear · CN 4 tetrahedral or square planar · CN 6 octahedral.", draw: function (cx, w, h, col) {
        var arr = [[2, "linear", "example: [Ag(NH₃)₂]⁺"], [4, "tetrahedral / planar", "e.g.: [CoCl₄]²⁻, [PtCl₄]²⁻"], [6, "octahedral", "e.g.: [Co(NH₃)₆]³⁺"]], rh = h / 3; cx.font = '11px system-ui'; arr.forEach(function (a, i) { var on = a[0] === cn(); cx.fillStyle = on ? 'rgba(34,211,238,.28)' : 'rgba(134,142,150,.15)'; cx.fillRect(6, i * rh + 3, w - 12, rh - 6); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText("CN " + a[0] + ' · ' + a[1], 14, i * rh + rh / 2 - 2); cx.fillStyle = col.muted; cx.fillText(a[2], 14, i * rh + rh / 2 + 13); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, L = parts(), q = charge();
      var lq = L.map(function (l) { return l.n + ' × (' + LG[l.id].q + ')'; }).join(' + ') || '0';
      return '<div class="card-kicker">' + (valid() ? formula() : "Complex") + "</div><div class=\"calc-step\">1 · Coordination number</div><table class=\"calc-table\">" + L.map(function (l) { return row(LG[l.id].f, l.n + ' × ' + LG[l.id].d + " donor(s) = " + l.n * LG[l.id].d); }).join('') + row("CN", '<b>' + cn() + '</b> → ' + (valid() ? gname(geomFor()) : "not valid")) + "</table><div class=\"calc-step\">2 · Charge</div><table class=\"calc-table\">" + row('Metal', '+' + S.ox) + row("Ligands", lq) + row("Total charge", '<b>' + (q > 0 ? '+' : '') + q + '</b>') + row("Counterion", q > 0 ? q + ' Cl⁻' : (q < 0 ? (-q) + ' K⁺' : "none")) + "</table><div class=\"calc-step\">3 · Name</div><p><b>" + (valid() ? name() : '—') + '</b></p>';
    },
    quiz: [
      { q: "The name of [Co(NH₃)₆]Cl₃ is…", options: ["hexaamminecobalt(III) chloride", "hexaammine chloride of cobalt", "trichloride of hexaamminecobalt(III)", "cobaltate(III) of hexaammine"], answer: 0, why: "The anion (chloride) is named last, after the cationic complex." },
      { q: "K₄[Fe(CN)₆] is…", options: ["potassium hexacyanoferrate(II)", "potassium hexacyanoiron(II)", "potassium hexacyanoferrate(III)", "potassium ferrous cyanide"], answer: 0, why: "Anionic complex: -ate; Fe²⁺ because 4− = x + 6(−1)." },
      { q: "In [Cr(en)₃]³⁺ the coordination number is…", options: ['6', '3', '4', '9'], answer: 0, why: "3 bidentate ligands = 6 donors." },
      { q: "The prefix for three ethylenediamine ligands is…", options: ["tris(ethylenediamine)", "tri-ethylenediamine", "triethylenediamine", "trisethylenediamine"], answer: 0, why: "Complex ligands use bis-, tris- with parentheses." },
      { q: "Ligands are cited in order…", options: ["alphabetical", "of charge", "of size", "random"], answer: 0, why: "Ignoring the numerical prefixes." },
      { q: "The CN⁻ ligand is named…", options: ["cyano", "cyanide", "carbon", "nitrile"], answer: 0, why: "As a ligand: cyano." },
      { q: "The charge of [PtCl₂(NH₃)₂] is…", options: ['0', '2+', '2−', '1+'], answer: 0, why: 'Pt²⁺ + 2(−1) = 0.' },
      { q: "The [Ni(CO)₄] complex is named…", options: ["tetracarbonylnickel(0)", "carbonyl nickelate(0)", "tetracarbonylnickel(IV)", "nickel tetracarbonate"], answer: 0, why: "Neutral complex: no -ate ending." }
    ],
    help: { intro: "Choose metal, oxidation state and ligands A and B; the simulator checks the coordination number, calculates the charge, writes the formula and builds the name.", items: [['3D complex', 'the central sphere is the metal ion and the coloured ones are the donor atoms; the label layer names each ligand.'], ['Controls', '“Metal”, “Oxidation number”, “Ligand A”, “Ligand B” and their amounts; with CN = 4 you choose “Tetrahedral” or “Square planar”.'], ['Panel', 'checks the coordination number, works out the charge, writes the formula and builds the name; the example buttons load classic complexes.'], ['Charts', '“Common ligands” and “Geometry according to the coordination number”.']], try: ['Build [Co(NH₃)₆]³⁺ and compare with the example: hexaamminecobalt(III) chloride.', 'Build an anionic complex and note the -ate ending of the metal (ferrate, cuprate…).', 'Use ethylenediamine: each ligand provides two donor atoms (bidentate) and takes tris- instead of tri-.'] }
  };
  function rebuild(ctx) {
    if (gr) ctx.scene.remove(gr); gr = new T.Group(); ctx.scene.add(gr); ligLab.forEach(function (l) { l.vis(false); });
    if (!valid()) return;
    var g = geomFor(), V = verts(g, 3.2), m = MT[S.m];
    var mc = new T.Mesh(new T.SphereGeometry(0.9, 28, 20), new T.MeshStandardMaterial({ color: m.c, roughness: 0.3, metalness: 0.3 })); gr.add(mc);
    var slots = V.map(function () { return null; }), pairs = (PAIRS[g] || []).slice(), pi = 0;
    var seq = []; if (S.nA > 0) { for (var i = 0; i < S.nA; i++) seq.push(S.A); } if (S.nB > 0) { for (i = 0; i < S.nB; i++) seq.push(S.B); }
    var bi = seq.filter(function (id) { return LG[id].d === 2; }), mo = seq.filter(function (id) { return LG[id].d === 1; });
    var used = {}; bi.forEach(function (id) { var p = pairs[pi++]; if (!p) return; slots[p[0]] = { id: id, mate: p[1] }; slots[p[1]] = { id: id, mate: p[0] }; used[p[0]] = used[p[1]] = true; });
    var free = []; slots.forEach(function (s, i) { if (!s) free.push(i); }); mo.forEach(function (id, k) { if (free[k] != null) slots[free[k]] = { id: id, mate: -1 }; });
    var lblI = 0;
    slots.forEach(function (s, i) {
      if (!s) return; var lg = LG[s.id], v = new T.Vector3(V[i][0], V[i][1], V[i][2]);
      var at = new T.Mesh(new T.SphereGeometry(lg.d === 2 ? 0.52 : 0.6, 20, 14), new T.MeshStandardMaterial({ color: lg.c, roughness: 0.4 })); at.position.copy(v); gr.add(at);
      var bd = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); bd.position.copy(v).multiplyScalar(0.5); bd.scale.y = v.length(); bd.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); gr.add(bd);
      if (lg.d === 1 && (s.id === 'h2o' || s.id === 'nh3')) { var nH = s.id === 'h2o' ? 2 : 3, out = v.clone().normalize(); for (var h = 0; h < nH; h++) { var a = h * 6.283 / nH, perp = new T.Vector3(-out.y, out.x, 0); if (perp.lengthSq() < 0.01) perp.set(0, -out.z, out.y); perp.normalize(); var perp2 = out.clone().cross(perp); var hp = v.clone().addScaledVector(out, 0.55).addScaledVector(perp, Math.cos(a) * 0.65).addScaledVector(perp2, Math.sin(a) * 0.65); var hh = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshStandardMaterial({ color: 0xf2f2f2 })); hh.position.copy(hp); gr.add(hh); } }
      if (lg.d === 2 && s.mate > i) { var w = new T.Vector3(V[s.mate][0], V[s.mate][1], V[s.mate][2]), mid = v.clone().add(w).multiplyScalar(0.5), out2 = mid.clone().normalize(), bb = mid.clone().addScaledVector(out2, 1.1); var bk = new T.Mesh(new T.SphereGeometry(0.34, 12, 9), new T.MeshStandardMaterial({ color: 0x56606b })); bk.position.copy(bb); gr.add(bk);[v, w].forEach(function (e) { var d = bb.clone().sub(e), c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshStandardMaterial({ color: 0xadb5bd })); c.position.copy(e).add(bb).multiplyScalar(0.5); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); gr.add(c); }); }
    });
  }
  MSim.create(def);
})();
