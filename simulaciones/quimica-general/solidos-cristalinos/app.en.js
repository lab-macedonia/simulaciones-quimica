/* Sólidos cristalinos y celdas unitarias — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, f3 = function (x) { return fmt(x, 3); }, T = THREE, NA = 6.022e23, S3 = Math.sqrt(3);
  var C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  var FC = [[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]];
  var ED = [[.5, 0, 0], [.5, 1, 0], [.5, 0, 1], [.5, 1, 1], [0, .5, 0], [1, .5, 0], [0, .5, 1], [1, .5, 1], [0, 0, .5], [1, 0, .5], [0, 1, .5], [1, 1, .5]];
  var TD = [[.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]], TD2 = [[.75, .75, .75], [.25, .25, .75], [.25, .75, .25], [.75, .25, .25]];
  function mk(a, k) { return a.map(function (p) { return { p: p, k: k }; }); }
  var ST = [
    { id: 'sc', n: "Simple cubic (sc)", ex: "Polonium", at: mk(C, 0), r: 0.5, a: 335, M: 209, Z: 1, cn: '6', pk: Math.PI / 6, rel: 'a = 2r', col: [0x4dabf7] },
    { id: 'bcc', n: "Body-centered cubic (bcc)", ex: "α-Iron", at: mk(C, 0).concat([{ p: [.5, .5, .5], k: 0 }]), r: S3 / 4, a: 286.65, M: 55.845, Z: 2, cn: '8', pk: Math.PI * S3 / 8, rel: 'a = 4r/√3', col: [0xff922b] },
    { id: 'fcc', n: "Face-centered cubic (fcc)", ex: "Copper", at: mk(C.concat(FC), 0), r: Math.SQRT2 / 4, a: 361.5, M: 63.55, Z: 4, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: 'a = 2√2·r', col: [0x51cf66] },
    { id: 'hcp', n: "Hexagonal close-packed (hcp, ABAB)", ex: "Magnesium", stack: 'ABA', Z: 6, a: 320.9, c: 521, M: 24.305, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: "c/a = 1.633 (ideal)" },
    { id: 'ccp', n: "Cubic close-packed (ccp, ABC)", ex: "Copper / aluminium", stack: 'ABC', Z: 4, a: 361.5, M: 63.55, cn: '12', pk: Math.PI / (3 * Math.SQRT2), rel: "it is the same fcc, viewed by layers" },
    { id: 'nacl', n: "Sodium chloride (NaCl)", ex: "table salt", at: mk(C.concat(FC), 0).concat(mk(ED, 1), [{ p: [.5, .5, .5], k: 1 }]), rr: [181, 102], a: 564, M: 58.44, Z: 4, cn: '6 : 6', ion: true, form: 'NaCl', io: ['Cl⁻', 'Na⁺'] },
    { id: 'cscl', n: "Cesium chloride (CsCl)", ex: 'CsCl', at: mk(C, 0).concat([{ p: [.5, .5, .5], k: 1 }]), rr: [181, 174], a: 412, M: 168.36, Z: 1, cn: '8 : 8', ion: true, form: 'CsCl', io: ['Cl⁻', 'Cs⁺'] },
    { id: 'zns', n: "Zinc blende (ZnS)", ex: 'ZnS', at: mk(C.concat(FC), 0).concat(mk(TD, 1)), rr: [184, 74], a: 541, M: 97.45, Z: 4, cn: '4 : 4', ion: true, form: 'ZnS', io: ['S²⁻', 'Zn²⁺'] },
    { id: 'caf2', n: "Fluorite (CaF₂)", ex: "CaF₂", at: mk(C.concat(FC), 1).concat(mk(TD, 0), mk(TD2, 0)), rr: [133, 100], a: 546, M: 78.08, Z: 4, cn: '8 : 4', ion: true, form: "CaF₂", io: ['F⁻', 'Ca²⁺'] }
  ], ID = {}; ST.forEach(function (s) { ID[s.id] = s; });
  var S = { st: 'sc', sz: 0.4, share: false, lay: 3, _k: '', _st: -1 }, grp = null, lab = {}, ats = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function share(p) { var n = 0; p.forEach(function (v) { if (v === 0 || v === 1) n++; }); return 1 / Math.pow(2, n); }
  function dens(s) { var V = s.id === 'hcp' ? 1.5 * S3 * s.a * s.a * s.c : s.a * s.a * s.a; return s.Z * s.M / (NA * V * 1e-30 * 1e6); }
  function stages() {
    return [
      ["Unit cells", "Cells", "A crystal is the repetition of a unit cell in three dimensions",
        "<p>A <b>crystalline solid</b> is an ordered arrangement of atoms, ions or molecules. Its structure is described by a <b>unit cell</b>: the smallest parallelepiped that, repeated by translation, generates the whole crystal. In the <b>cubic</b> system there are three lattices: <b>simple (sc)</b>, <b>body-centered (bcc)</b> and <b>face-centered (fcc)</b>. The edge is <b>a</b>.</p>"],
      ["Atoms per cell", "Atoms/cell", "Corner 1/8 · edge 1/4 · face 1/2 · interior 1",
        "<p>Atoms at corners, edges and faces are <b>shared with neighboring cells</b>. Fraction inside the cell: <b>corner 1/8, edge 1/4, face 1/2, interior 1</b>. Result: <b>sc = 8·⅛ = 1</b>; <b>bcc = 8·⅛ + 1 = 2</b>; <b>fcc = 8·⅛ + 6·½ = 4</b>. The colors indicate how much of each atom belongs to the cell.</p>"],
      ["Packing and coordination", "Packing", "Fraction occupied: sc 52.4 % · bcc 68.0 % · fcc 74.0 %",
        "<p>With the atoms as rigid spheres in contact, the relation between the edge and the radius depends on the lattice: <b>sc a = 2r</b>; <b>bcc a = 4r/√3</b> (contact along the cube diagonal); <b>fcc a = 2√2·r</b> (contact along the face diagonal). The <b>packing fraction</b> = Z·(4/3)πr³ / a³ is <b>0.524 · 0.680 · 0.740</b>, and the <b>coordination number</b> <b>6 · 8 · 12</b>. 0.740 is the maximum possible.</p>"],
      ["Close packing", "hcp and ccp", "ABAB… (hcp) versus ABCABC… (ccp = fcc): both 74 %",
        "<p>The spheres stack in hexagonal close-packed layers. The second layer (<b>B</b>) occupies half of the holes of the first; the third can repeat <b>A</b> (<b>hcp</b>, ABAB…) or occupy the free holes (<b>C</b>, <b>ccp</b>, ABCABC…, which equals the <b>fcc</b> seen along the cube diagonal). Both have <b>CN = 12</b> and <b>74 %</b> occupancy; they differ in symmetry and properties (e.g. ductility).</p>"],
      ["Ionic crystals", "Ionic", "The anions form the lattice and the cations occupy the holes",
        "<p>In ionic solids the <b>larger ion</b> (almost always the anion) forms the packing and the smaller one occupies <b>octahedral or tetrahedral holes</b>. The structure depends on the <b>radius ratio r⁺/r⁻</b>: <b>NaCl</b> (0.56; 6:6, Cl⁻ fcc with Na⁺ in octahedral holes), <b>CsCl</b> (0.96; 8:8), <b>zinc blende ZnS</b> (0.40; 4:4, Zn²⁺ in tetrahedral holes) and <b>CaF₂</b> (0.75; Ca²⁺ fcc with F⁻ in all the tetrahedral holes; 8:4).</p>"],
      ["Density from the cell", "Density", "ρ = Z·M / (N_A·V_cell)",
        "<p>Knowing the cell, the density is calculated: <b>ρ = Z·M/(N<sub>A</sub>·a³)</b>. For copper (fcc, a = 361.5 pm, M = 63.55 g/mol): <b>ρ = 4 × 63.55 / (6.022×10²³ × (3.615×10⁻⁸ cm)³) = 8.93 g/cm³</b>, equal to the experimental value. Inverting the formula, X-ray diffraction (which gives a) makes it possible to obtain Avogadro's number or the molar mass.</p>"]
    ];
  }
  function sph(c, x, y, z, r, col, op) { var m = new T.Mesh(new T.SphereGeometry(1, 22, 16), new T.MeshStandardMaterial({ color: col, roughness: 0.35, transparent: op < 1, opacity: op })); m.scale.setScalar(r); m.position.set(x, y, z); c.add(m); return m; }
  function rebuild(ctx) {
    var s = ctx.scene; if (grp) s.remove(grp); grp = new T.Group(); ats = []; var st = ID[S.st], E = 6;
    if (st.stack) {
      var d = 2.1, h = d * Math.sqrt(2 / 3), pts = [[0, 0]]; [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]].forEach(function (ij) { pts.push(ij); });
      var sh = { A: [0, 0], B: [(d) / 2, d * S3 / 6], C: [d, d * S3 / 3] }, cols = { A: 0x4dabf7, B: 0xff922b, C: 0x51cf66 };
      for (var L = 0; L < 4; L++) { var lt = st.stack[L] || (st.stack === 'ABA' ? 'AB'[L % 2] : 'ABC'[L % 3]); pts.forEach(function (ij) { var x = ij[0] * d + ij[1] * d / 2 + sh[lt][0] - d * 0.5, z = ij[1] * d * S3 / 2 + sh[lt][1] - d * 0.3; var m = sph(grp, x, 0.4 + L * h * 1.0, z, d * 0.48, cols[lt], 1); ats.push({ m: m, L: L, lt: lt }); }); }
      grp.position.set(0, -2, 0);
    } else {
      var rr = st.ion ? [st.rr[0] / st.a, st.rr[1] / st.a] : [st.r, st.r], cols2 = st.ion ? [0x51cf66, 0xff6b6b] : st.col;
      var edges = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(E, E, E)), new T.LineBasicMaterial({ color: 0xadb5bd })); grp.add(edges);
      st.at.forEach(function (a) { var r = rr[a.k] * E, col = st.ion ? cols2[a.k] : cols2[0]; var m = sph(grp, (a.p[0] - .5) * E, (a.p[1] - .5) * E, (a.p[2] - .5) * E, r, col, 1); ats.push({ m: m, r: r, sh: share(a.p), col: col, k: a.k }); });
      grp.position.set(0, 3, 0);
    }
    s.add(grp); S._k = S.st;
  }
  var def = {
    key: 'solidos-cristalinos', title: "Crystalline Solids", subtitle: "3D Simulator · general chemistry", accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [8, 8, 12], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 3, 17], target: [0, 3, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 2], target: [0, 3, 0] }],
    layers: [{ id: 'cell', label: "Unit cell", icon: '▢' }, { id: 'share', label: "Fraction in the cell", icon: '⅛' }],
    build: function (ctx) { ['t', 'a', 'b'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.lay = 4;
        if (i === 0) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.35; S.share = false; }
        else if (i === 1) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.4; S.share = true; }
        else if (i === 2) { S.st = ['sc', 'bcc', 'fcc'][Math.min(2, Math.floor(l * 3))]; S.sz = 0.4 + 0.6 * sm(((l * 3) % 1) / 0.5); S.share = false; }
        else if (i === 3) { S.st = l < 0.5 ? 'hcp' : 'ccp'; S.sz = 1; S.share = false; S.lay = Math.min(4, 1 + Math.floor(((l * 2) % 1) * 4.5)); }
        else if (i === 4) { S.st = ['nacl', 'cscl', 'zns', 'caf2'][Math.min(3, Math.floor(l * 4))]; S.sz = 0.7; S.share = false; }
        else { S.st = 'fcc'; S.sz = 1; S.share = false; }
      }
      if (S._k !== S.st) rebuild(ctx); var st = ID[S.st], cell = ctx.layer('cell'), shr = ctx.layer('share') || S.share;
      grp.children[0] && st.stack === undefined && (grp.children[0].visible = cell);
      var scol = { 1: 0x4dabf7, 0.5: 0x51cf66, 0.25: 0xffd43b, 0.125: 0xff6b6b };
      ats.forEach(function (a) {
        if (st.stack) { a.m.visible = a.L < S.lay; a.m.scale.setScalar(2.1 * 0.48 * (S.sz)); return; }
        a.m.scale.setScalar(a.r * S.sz); var c = shr ? ({ 1: 0xff922b, 0.5: 0x51cf66, 0.25: 0xffd43b, 0.125: 0x4dabf7 }[a.sh]) : a.col; a.m.material.color.setHex(c);
      });
      grp.rotation.y = Math.sin(now * 0.3) * 0.25;
      lab.t.pos(0, 8.2, 0).set(st.n, 'bl-lead').vis(true);
      var zz = st.stack ? st.Z : st.Z;
      lab.a.pos(0, -3.1, 0).set(st.stack ? 'capas: ' + (st.stack === 'ABA' ? 'A B A B' : 'A B C A') + " · CN = 12 · packing 74.0 %" : 'Z = ' + zz + (st.ion ? " units " + st.form : " atoms") + " · CN = " + st.cn + (st.pk ? ' · ' + fmt(st.pk * 100, 1) + ' %' : ''), 'bl-pos').vis(true);
      lab.b.pos(0, -4.1, 0).set(st.ion ? st.io[0] + " (green/red according to structure) · a = " + st.a + ' pm' : (st.stack ? (st.ex) : st.ex + ' · a = ' + st.a + ' pm'), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.st) u.st.set(S.st); if (!ctx.P.manual) { u.sz && u.sz.set(S.sz); u.lay && u.lay.set(S.lay); } },
    hud: function () { var st = ID[S.st]; return { eq: { chip: 'Z', name: st.n, body: "<div class=\"eqline\"><small>Z per cell</small>" + st.Z + "</div><div class=\"eqline\"><small>Coordination</small>" + st.cn + "</div><div class=\"eqline\"><small>Occupancy</small>" + (st.pk ? fmt(st.pk * 100, 1) + ' %' : '—') + '</div><div class="eqline"><small>ρ</small>' + f2(dens(st)) + ' g/cm³</div>' }, legend: S.share || false ? [{ label: '1/8', color: '#4dabf7', text: "corner" }, { label: '1/4', color: '#ffd43b', text: "edge" }, { label: '1/2', color: '#51cf66', text: "face" }, { label: '1', color: '#ff922b', text: 'interior' }] : [{ label: "Sphere", color: '#4dabf7', text: "atom or ion" }] }; },
    measures: function () { var st = ID[S.st], rpm = st.stack || st.ion ? null : st.r * st.a; return [["Structure", st.n], ["Atoms per cell", String(st.Z)], ["Coordination number", st.cn], ["Edge a", st.a + ' pm'], ["Radius (contact)", rpm ? f1(rpm) + ' pm' : '—'], ["Fraction occupied", st.pk ? f1(st.pk * 100) + ' %' : '—'], ["Density", f2(dens(st)) + ' g/cm³']]; },
    ideas: ["<b>Z</b>: sc 1 · bcc 2 · fcc 4.", "Packing: sc 52.4 % · bcc 68 % · fcc/hcp 74 %.", "CN: 6 · 8 · 12.", '<b>ρ = Z·M / (N_A·a³)</b>.', "In an ionic crystal the larger ion forms the lattice and the smaller one occupies holes."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Structure"); el.appendChild(c);
      ui.st = kit.ui.options({ label: "Lattice", cols: 3, value: S.st, options: ST.map(function (x) { return { v: x.id, label: x.id.toUpperCase().replace('NACL', 'NaCl').replace('CSCL', 'CsCl').replace('ZNS', 'ZnS').replace('CAF2', "CaF₂"), sub: x.ex }; }), onChange: function (v) { ctx.goManual(); S.st = v; } }); c.appendChild(ui.st);
      ui.sz = kit.ui.slider({ label: "Size of the spheres", min: 0.2, max: 1, step: 0.02, value: S.sz, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.sz = v; } });
      ui.lay = kit.ui.slider({ label: "Layers (hcp/ccp)", min: 1, max: 4, step: 1, value: S.lay, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.lay = v; } }); c.appendChild(kit.ui.sliders([ui.sz, ui.lay]));
      c.appendChild(ctx.btnRow([{ t: "Spheres in contact", primary: true, fn: function () { ctx.goManual(); S.sz = 1; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Packing fraction", h: 210, note: "Fraction of the cell volume occupied by rigid spheres in contact.", draw: function (cx, w, h, col) {
        var arr = [ID.sc, ID.bcc, ID.fcc, ID.hcp], L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / arr.length, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4 / 0.8 * 0.2 * 1; y = Tp + ph - ph * (i * 0.2) / 0.8; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(i * 20, 0) + ' %', L - 5, y + 3); }
        cx.textAlign = 'center'; arr.forEach(function (s, k) { var hh = ph * s.pk / 0.8; cx.fillStyle = s.id === S.st ? '#ff6b3d' : '#22d3ee'; cx.fillRect(L + k * bw + 8, Tp + ph - hh, bw - 16, hh); cx.fillStyle = col.ink; cx.fillText(f1(s.pk * 100), L + k * bw + bw / 2, Tp + ph - hh - 4); cx.fillStyle = col.muted; cx.fillText(s.id, L + k * bw + bw / 2, h - B + 13); });
      } },
      { title: "Calculated density (g/cm³)", h: 220, note: "ρ = Z·M/(N_A·V) for the examples of each structure.", draw: function (cx, w, h, col) {
        var arr = ST, L = 40, Rr = 10, Tp = 12, B = 34, pw = w - L - Rr, ph = h - Tp - B, bw = pw / arr.length, mx = 10, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 5; i++) { var y = Tp + ph - ph * i / 5; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i * 2, L - 5, y + 3); }
        cx.textAlign = 'center'; arr.forEach(function (s, k) { var v = dens(s), hh = ph * Math.min(v, mx) / mx; cx.fillStyle = s.id === S.st ? '#ff6b3d' : '#22d3ee'; cx.fillRect(L + k * bw + 3, Tp + ph - hh, bw - 6, hh); cx.fillStyle = col.muted; cx.fillText(s.id, L + k * bw + bw / 2, h - B + 13); cx.fillStyle = col.ink; cx.fillText(f1(v), L + k * bw + bw / 2, Tp + ph - hh - 4); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, st = ID[S.st], d = dens(st), a = st.a;
      var geo = st.stack ? row("Hexagonal cell", 'V = (3√3/2)·a²·c = ' + (st.id === 'hcp' ? f2(1.5 * S3 * st.a * st.a * st.c * 1e-6) + '×10⁶ pm³' : "a³ (equivalent to fcc)")) : row("a–r relation", st.ion ? "cation–anion contact" : st.rel + ' → r = ' + f1(st.r * st.a) + ' pm');
      return '<div class="card-kicker">' + st.n + "</div><div class=\"calc-step\">1 · Cell content</div><table class=\"calc-table\">" + row('Z', st.Z + (st.ion ? " units of " + st.form : " atoms")) + row("Coordination", st.cn) + (st.pk ? row("Packing", f1(st.pk * 100) + ' %') : '') + geo + '</table>' +
        "<div class=\"calc-step\">2 · Density</div><table class=\"calc-table\">" + row('M', st.M + " g/mol") + row('a', st.a + ' pm = ' + st.a + '×10⁻¹⁰ cm') + row('ρ', 'Z·M/(N<sub>A</sub>·V) = ' + st.Z + ' × ' + st.M + ' / (6,022×10²³ × V) = <b>' + f2(d) + ' g/cm³</b>') + '</table>';
    },
    quiz: [
      { q: "How many atoms are there in an fcc cell?", options: ['4', '2', '1', '14'], answer: 0, why: '8·⅛ + 6·½ = 4.' },
      { q: "What is the coordination number of bcc?", options: ['8', '6', '12', '4'], answer: 0, why: "Each atom touches 8 neighbors, those at the corners of the cube." },
      { q: "The relation between edge and radius in fcc is…", options: ['a = 2√2·r', 'a = 2r', 'a = 4r/√3', 'a = r√2'], answer: 0, why: "The contact is along the face diagonal: 4r = a√2." },
      { q: "The maximum packing with equal spheres is…", options: ['74 %', '52 %', '68 %', '100 %'], answer: 0, why: "fcc and hcp: π/(3√2) ≈ 0.740." },
      { q: "The ABCABC… sequence corresponds to…", options: ["ccp (fcc)", 'hcp', 'bcc', 'sc'], answer: 0, why: "The third layer occupies the holes that the first does not cover." },
      { q: "In NaCl the coordination is…", options: ['6 : 6', '8 : 8', '4 : 4', '12 : 6'], answer: 0, why: "Each ion is surrounded by 6 counterions in octahedral holes." },
      { q: "The formula for the density of a crystal is…", options: ['Z·M / (N_A·V)', 'M·V / (Z·N_A)', 'N_A·V / (Z·M)', 'Z·V / M'], answer: 0, why: "Mass of the cell / volume of the cell." },
      { q: "In the CsCl cell there are…", options: ["1 CsCl unit", "2 units", "4 units", "8 units"], answer: 0, why: "8·⅛ Cl⁻ + 1 Cs⁺ at the center." }
    ],
    help: { intro: "Choose a lattice and change the size of the spheres: at 100 % they are in contact. The “Fraction in the cell” layer colors each atom according to the part that belongs to the cell.", items: [['Cell', 'the “Unit cell” layer draws its edges; “Fraction in the cell” colours each atom: blue 1/8 (corner), yellow 1/4 (edge), green 1/2 (face), orange 1 (interior).'], ['Controls', '“Lattice”, “Size of the spheres” (100 % = touching) and “Layers (hcp/ccp)”.'], ['Charts', '“Packing fraction” and “Calculated density (g/cm³)”.']], try: ['With the fraction layer on, add up the contributions in fcc: 8 × 1/8 + 6 × 1/2 = 4 atoms.', 'Set the spheres to 100 % in sc, bcc and fcc and compare packing: 52, 68 and 74 %.', 'Pick NaCl and count each ion’s neighbours: 6 : 6 coordination.'] }
  };
  MSim.create(def);
})();
