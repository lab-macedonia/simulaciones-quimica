/* Terpenos y esteroides — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var UC = [0xff922b, 0x4dabf7, 0x69db7c, 0xf06595, 0xffd43b, 0xb197fc];
  var TP = { geo: { n: 'Geraniol', u: 2, cls: "monoterpene", f: 'C₁₀H₁₈O', oh: true, src: "roses, citronella" }, far: { n: 'Farnesol', u: 3, cls: "sesquiterpene", f: 'C₁₅H₂₆O', oh: true, src: "linden, citronella" }, ggo: { n: "Geranylgeraniol", u: 4, cls: "diterpene", f: 'C₂₀H₃₄O', oh: true, src: "precursor of retinol and phytol" } };
  var ST = {
    col: { n: "Cholesterol", f: 'C₂₇H₄₆O', c3: 'OH', db: 'C5=C6', c17: 'cadena', me10: true, me13: true, arom: false, role: "membranes; precursor of the other hormones" },
    tes: { n: "Testosterone", f: 'C₁₉H₂₈O₂', c3: 'O', db: 'C4=C5', c17: 'OH', me10: true, me13: true, arom: false, role: "male sex hormone (androgen)" },
    est: { n: 'Estradiol', f: 'C₁₈H₂₄O₂', c3: 'OH', db: 'aro', c17: 'OH', me10: false, me13: true, arom: true, role: "female sex hormone (estrogen); aromatic A ring" },
    pro: { n: "Progesterone", f: 'C₂₁H₃₀O₂', c3: 'O', db: 'C4=C5', c17: 'acetilo', me10: true, me13: true, arom: false, role: "progestogen; maintenance of pregnancy" }
  };
  var S = { tp: 'geo', st: 'col', p: 0, cyc: 0 }, g = null, lab = [], gTer = null, gSt = null, gSq = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function sph(r, c) { return new T.Mesh(new T.SphereGeometry(r, 14, 10), new T.MeshStandardMaterial({ color: c, roughness: 0.4 })); }
  function cy(a, b, r, c, par) { var m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: c || 0xced4da })), d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, d.length(), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); par.add(m); return m; }
  function addBond(par, A, i, j, ord, color) { var d = A[j].clone().sub(A[i]), nrm = V(-d.y, d.x, 0).normalize().multiplyScalar(0.12); if (ord === 2) { cy(A[i].clone().add(nrm), A[j].clone().add(nrm), 0.05, color, par); cy(A[i].clone().sub(nrm), A[j].clone().sub(nrm), 0.05, color, par); } else cy(A[i], A[j], 0.06, color, par); }
  function terpene(t) {
    var gr = new T.Group(), A = [], U = [], B = [], k, u, idx = 0, dx = 1.25, c = [];
    for (u = 0; u < t.u; u++) { for (k = 0; k < 4; k++) { var x = dx * idx - 0.6 * t.u * 2.3 / 2 * 2 / 2, y = (idx % 2 ? 0.7 : -0.7); A.push(V(x, y, 0)); U.push(u); idx++; } }
    var xs = A.map(function (a) { return a.x; }), mid = (Math.max.apply(0, xs) + Math.min.apply(0, xs)) / 2; A.forEach(function (a) { a.x -= mid; });
    var n = A.length, ord = []; for (k = 0; k < n - 1; k++) ord.push((k % 4 === 1) ? 2 : 1);
    // metilo de cada unidad en c3
    var M = [], MU = []; for (u = 0; u < t.u; u++) { var i3 = u * 4 + 2, dir = A[i3].y > 0 ? 1 : -1; M.push({ i: i3, p: A[i3].clone().add(V(0.0, dir * 1.4, 0)) }); MU.push(u); }
    A.forEach(function (a, j) { var s = sph(0.34, UC[U[j]]); s.position.copy(a); gr.add(s); });
    M.forEach(function (m, j) { var s = sph(0.34, UC[MU[j]]); s.position.copy(m.p); gr.add(s); cy(A[m.i], m.p, 0.06, 0xced4da, gr); });
    for (k = 0; k < n - 1; k++) addBond(gr, A, k, k + 1, ord[k], 0xced4da);
    var oh = sph(0.4, 0xff4d4d); oh.position.copy(A[0].clone().add(V(-1.0, A[0].y > 0 ? 0.6 : -0.6, 0))); gr.add(oh); cy(A[0], oh.position, 0.06, 0xced4da, gr);
    gr.userData.units = t.u; return gr;
  }
  var HEX = [[0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5], [0, -1], [0.866, -0.5]];
  function steroid(s) {
    var gr = new T.Group(), P = {}, S2 = 1.5;
    function pt(x, y) { return V(x * S2, y * S2, 0); }
    // anillo A: centro (0,0)
    var nm = { C10: HEX[0], C1: HEX[1], C2: HEX[2], C3: HEX[3], C4: HEX[4], C5: HEX[5] };
    var cB = [1.732, 0]; P.C6 = [cB[0] + HEX[4][0], cB[1] + HEX[4][1]]; P.C7 = [cB[0] + HEX[5][0], cB[1] + HEX[5][1]]; P.C8 = [cB[0] + HEX[0][0], cB[1] + HEX[0][1]]; P.C9 = [cB[0] + HEX[1][0], cB[1] + HEX[1][1]];
    var cC = [2.598, 1.5]; P.C11 = [cC[0] + HEX[1][0], cC[1] + HEX[1][1]]; P.C12 = [cC[0] + HEX[0][0] - 0 * 0, cC[1] + HEX[0][1]]; P.C13 = [cC[0] + 0.866, cC[1] + 0.5]; P.C14 = [cC[0] + 0.866, cC[1] - 0.5]; P.C12 = [cC[0], cC[1] + 1]; P.C11 = [cC[0] - 0.866, cC[1] + 0.5];
    P.C17 = [4.415, 2.309]; P.C16 = [5.003, 1.5]; P.C15 = [4.415, 0.691];
    var all = { C1: HEX[1], C2: HEX[2], C3: HEX[3], C4: HEX[4], C5: HEX[5], C10: HEX[0], C6: P.C6, C7: P.C7, C8: P.C8, C9: P.C9, C11: P.C11, C12: P.C12, C13: P.C13, C14: P.C14, C15: P.C15, C16: P.C16, C17: P.C17 };
    all.C8 = [cB[0] + HEX[0][0], cB[1] + HEX[0][1]]; all.C9 = [cB[0] + HEX[1][0], cB[1] + HEX[1][1]]; // C8, C9 en B; ajustes de posición abajo
    // reasignación estándar: C9 = vértice B superior izquierdo compartido con C; C8 = vértice B superior derecho
    all.C9 = [1.732, 1.0]; all.C8 = [2.598, 0.5]; all.C14 = [3.464, 1.0]; all.C13 = [3.464, 2.0]; all.C12 = [2.598, 2.5]; all.C11 = [1.732, 2.0]; all.C10 = [0.866, 0.5]; all.C5 = [0.866, -0.5]; all.C6 = [1.732, -1.0]; all.C7 = [2.598, -0.5];
    var bonds = [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'C10'], ['C10', 'C1'], ['C5', 'C6'], ['C6', 'C7'], ['C7', 'C8'], ['C8', 'C9'], ['C9', 'C10'], ['C9', 'C11'], ['C11', 'C12'], ['C12', 'C13'], ['C13', 'C14'], ['C14', 'C8'], ['C13', 'C17'], ['C17', 'C16'], ['C16', 'C15'], ['C15', 'C14']];
    var cx0 = 2.4, cy0 = 1.0, A = {}; Object.keys(all).forEach(function (k) { var v = all[k]; A[k] = V((v[0] - cx0) * S2, (v[1] - cy0) * S2, 0); var s = sph(0.3, 0x56606b); s.position.copy(A[k]); s.userData.k = k; gr.add(s); });
    var dbl = {}; if (s.db === 'C5=C6') dbl['C5-C6'] = 1; if (s.db === 'C4=C5') dbl['C4-C5'] = 1; var ringA = ['C1-C2', 'C2-C3', 'C3-C4', 'C4-C5', 'C5-C10', 'C10-C1'];
    if (s.arom) { dbl['C1-C2'] = 1; dbl['C3-C4'] = 1; dbl['C5-C10'] = 1; }
    bonds.forEach(function (b) { var key = b[0] + '-' + b[1], key2 = b[1] + '-' + b[0]; var o = (dbl[key] || dbl[key2]) ? 2 : 1; var d = A[b[1]].clone().sub(A[b[0]]), nrm = V(-d.y, d.x, 0).normalize().multiplyScalar(0.12); if (o === 2) { cy(A[b[0]].clone().add(nrm), A[b[1]].clone().add(nrm), 0.05, 0xced4da, gr); cy(A[b[0]].clone().sub(nrm), A[b[1]].clone().sub(nrm), 0.05, 0xced4da, gr); } else cy(A[b[0]], A[b[1]], 0.06, 0xced4da, gr); });
    function sub(from, off, col, r, ord) { var p = A[from].clone().add(off), s2 = sph(r || 0.34, col); s2.position.copy(p); gr.add(s2); cy(A[from], p, 0.06, 0xced4da, gr); return p; }
    var cen = A.C3.clone().sub(A.C10).normalize();
    if (s.c3 === 'OH') sub('C3', V(-0.9, -0.8, 0), 0xff4d4d, 0.4); else sub('C3', V(-0.9, -0.8, 0), 0xff4d4d, 0.4, 2);
    if (s.me10) sub('C10', V(0, 0.2, 1.3), 0x56606b, 0.34);
    if (s.me13) sub('C13', V(0, 0.2, 1.3), 0x56606b, 0.34);
    if (s.c17 === 'OH') sub('C17', V(0.6, 1.0, 0), 0xff4d4d, 0.4);
    else if (s.c17 === 'acetilo') { var p1 = sub('C17', V(0.4, 1.2, 0), 0x56606b, 0.34); var p2 = p1.clone().add(V(1.0, 0.5, 0)), o = sph(0.4, 0xff4d4d); o.position.copy(p1.clone().add(V(-0.3, 1.1, 0))); gr.add(o); cy(p1, o.position, 0.06, 0xced4da, gr); var m2 = sph(0.34, 0x56606b); m2.position.copy(p2); gr.add(m2); cy(p1, p2, 0.06, 0xced4da, gr); }
    else if (s.c17 === 'cadena') { var prev = A.C17.clone(), dirs = [V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0), V(1.3, 0.3, 0), V(0.6, 1.2, 0)]; dirs.forEach(function (d2, j) { var np = prev.clone().add(d2.clone().multiplyScalar(0.95)), s3 = sph(0.3, 0x56606b); s3.position.copy(np); gr.add(s3); cy(prev, np, 0.06, 0xced4da, gr); prev = np; if (j === 3) { var br = np.clone().add(V(0.0, 1.2, 0.0)); } }); }
    gr.userData.A = A; return gr;
  }
  function squalene() {
    var gr = new T.Group(), pts = [], k, ring = new T.Group();
    for (k = 0; k < 24; k++) { var th = k * 0.55, r = 3.6 - k * 0.03; pts.push(V(r * Math.cos(th) * 1.0, -4 + k * 0.33, r * Math.sin(th))); }
    pts.forEach(function (p, j) { var s = sph(0.28, UC[Math.floor(j / 4) % 6]); s.position.copy(p); gr.add(s); if (j) cy(pts[j - 1], p, 0.06, 0xced4da, gr); });
    gr.userData.pts = pts; return gr;
  }
  function stages() {
    return [
      ["The isoprene rule", "Isoprene", "All terpenes are built from 5-carbon units (C₅)",
        "<p><b>Terpenes</b> are natural products formed from <b>isoprene (2-methylbuta-1,3-diene, C₅H₈)</b> units joined “head to tail”. They are classified by the number of units: <b>monoterpenes</b> (2 units, C₁₀), <b>sesquiterpenes</b> (3, C₁₅), <b>diterpenes</b> (4, C₂₀), <b>triterpenes</b> (6, C₃₀) and <b>tetraterpenes</b> (8, C₄₀, carotenoids). Each color in the figure marks one unit.</p>"],
      ["Linear terpenes", "Linear", "Geraniol (C₁₀) → farnesol (C₁₅) → geranylgeraniol (C₂₀)",
        "<p>Biosynthesis uses <b>isopentenyl pyrophosphate (IPP)</b> and <b>dimethylallyl pyrophosphate (DMAPP)</b>: one DMAPP + one IPP give <b>geranyl-PP</b> (C₁₀); another IPP, <b>farnesyl-PP</b> (C₁₅); another, <b>geranylgeranyl-PP</b> (C₂₀). The corresponding alcohols (<b>geraniol, farnesol, geranylgeraniol</b>) keep the pattern: each unit contributes a 4-C chain with a methyl on the third carbon.</p>"],
      ["From squalene to cholesterol", "Squalene", "Two farnesyl-PP → squalene (C₃₀) → cyclization → lanosterol → cholesterol",
        "<p>Two molecules of farnesyl-PP join “tail to tail” to give <b>squalene</b> (C₃₀). <b>Squalene monooxygenase</b> forms the epoxide and a cyclization cascade (like those seen in electrophilic addition) closes <b>four rings</b> and generates <b>lanosterol</b>. In about 19 more steps 3 methyls are lost and <b>cholesterol</b> (C₂₇) is obtained. Move the control to see the folding.</p>"],
      ["The steroid skeleton", "Skeleton", "Four fused rings: three 6-membered (A, B, C) and one 5-membered (D)",
        "<p><b>Steroids</b> share the <b>cyclopentanoperhydrophenanthrene</b> nucleus: rings <b>A, B, C</b> (cyclohexane) and <b>D</b> (cyclopentane), numbered C1–C17. The methyls <b>C18</b> (on C13) and <b>C19</b> (on C10) usually point up (β). The ring fusions are <i>trans</i>, giving an almost flat, rigid skeleton that inserts between membrane lipids.</p>"],
      ["Steroid hormones", "Hormones", "Small changes in the substituents change the biological function",
        "<p>With the same skeleton, the <b>substituents</b> determine the function: <b>cholesterol</b> has OH at C3, a C5=C6 double bond and an 8-carbon side chain at C17; <b>testosterone</b> has C3=O, C4=C5 and OH at C17; <b>estradiol</b> has an aromatic A ring (no C19) with a phenolic OH; <b>progesterone</b> has C3=O, C4=C5 and an acetyl group at C17. Compare the four.</p>"]
    ];
  }
  var def = {
    key: 'terpenos-esteroides', title: "Terpenes and Steroids", subtitle: "3D simulator · advanced organic chemistry", accent: { dark: '#e599f7', light: '#862e9c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [3, 5, 20], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0, 22], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 3], target: [0, 0, 0] }],
    layers: [{ id: 'col', label: "Colors by unit", icon: '●' }],
    build: function (ctx) { g = new T.Group(); ctx.scene.add(g); for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d')); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, mode; if (!P.manual) { if (i === 0) { S.tp = 'geo'; mode = 'ter'; } else if (i === 1) { S.tp = ['geo', 'far', 'ggo'][Math.min(2, Math.floor(f.local * 3))]; mode = 'ter'; } else if (i === 2) { mode = 'sq'; S.cyc = f.local; } else if (i === 3) { S.st = 'col'; mode = 'st'; } else { S.st = ['col', 'tes', 'est', 'pro'][Math.min(3, Math.floor(f.local * 4))]; mode = 'st'; } S.mode = mode; }
      mode = S.mode || 'ter'; var key = mode + (mode === 'ter' ? S.tp : (mode === 'st' ? S.st : 'sq'));
      if (g.userData.key !== key) { g.userData.key = key; while (g.children.length) g.remove(g.children[0]); g.add(mode === 'ter' ? terpene(TP[S.tp]) : (mode === 'st' ? steroid(ST[S.st]) : squalene())); }
      var obj = g.children[0]; if (mode === 'sq' && obj) { var pts = obj.userData.pts; obj.children.forEach(function (c, j) { }); }
      lab.forEach(function (l) { l.vis(false); });
      if (mode === 'ter') { var t = TP[S.tp]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.25; lab[0].pos(0, 5, 0).set(t.n + ' · ' + t.cls + ' (' + t.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -4.8, 0).set(t.u + " isoprene units · " + t.u * 5 + ' C · ' + t.src, 'bl-d').vis(true); }
      else if (mode === 'st') { var s = ST[S.st]; g.rotation.y = Math.sin(ctx.now * 0.3) * 0.3; lab[0].pos(0, 7, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true); lab[1].pos(0, -6.2, 0).set(s.role, 'bl-d').vis(true); lab[2].pos(-6.2, -3.4, 0).set('C3: ' + (s.c3 === 'OH' ? 'OH' : 'C=O'), 'bl-d').vis(true); lab[3].pos(6.8, 3.2, 0).set('C17: ' + (s.c17 === 'cadena' ? "C₈ chain" : (s.c17 === 'OH' ? 'OH' : "acetyl")), 'bl-d').vis(true); }
      else { var q = sm(S.cyc); obj.children.forEach(function (c, j) { }); g.rotation.y = ctx.now * 0.2; lab[0].pos(0, 6.5, 0).set("Squalene (C₃₀): 6 isoprene units", 'bl-lead').vis(true); lab[1].pos(0, -6, 0).set(q < 0.5 ? "folded chain (chair–boat–chair–boat)" : "cyclization: 4 rings → lanosterol", 'bl-d').vis(true); var pp = obj.userData.pts; obj.children.forEach(function (c, j) { if (j < pp.length) { var p0 = pp[j], th = j * 0.55 + q * j * 0.12, r = (3.6 - j * 0.03) * (1 - 0.45 * q); c.position.set(r * Math.cos(th), -4 + j * (0.33 - 0.12 * q), r * Math.sin(th)); } }); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.tp) u.tp.set(S.tp); if (u.st) u.st.set(S.st); },
    hud: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return { eq: { chip: 'C₁₇', name: s.n, body: "<div class=\"eqline\"><small>Formula</small>" + s.f + '</div><div class="eqline"><small>C3</small>' + (s.c3 === 'OH' ? "hydroxyl" : "carbonyl") + "</div><div class=\"eqline\"><small>Double bond</small>" + (s.db === 'aro' ? "aromatic A ring" : s.db) + "</div><div class=\"eqline\"><small>Function</small>" + s.role + '</div>' }, legend: [{ label: "Gray", color: '#56606b', text: "carbon" }, { label: "Red", color: '#ff4d4d', text: "oxygen" }] }; } var t = TP[S.tp]; return { eq: { chip: 'C' + t.u * 5, name: t.n, body: "<div class=\"eqline\"><small>Class</small>" + t.cls + "</div><div class=\"eqline\"><small>C₅ units</small>" + t.u + "</div><div class=\"eqline\"><small>Formula</small>" + t.f + '</div>' }, legend: UC.slice(0, t.u).map(function (c, j) { return { label: "Unit " + (j + 1), color: '#' + c.toString(16).padStart(6, '0'), text: "isoprene C₅" }; }) }; },
    measures: function () { if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return [["Steroid", s.n], ["Formula", s.f], ['C3', s.c3 === 'OH' ? 'OH' : '=O'], ['C17', s.c17], ["C19 methyl", s.me10 ? "yes" : "no (aromatic A ring)"], ["Function", s.role]]; } var t = TP[S.tp]; return [["Terpene", t.n], ["Class", t.cls], ["Isoprene units", String(t.u)], ["Carbons", String(t.u * 5)], ["Source", t.src]]; },
    ideas: ["Terpene = n × C₅ (isoprene rule).", "Squalene → lanosterol → cholesterol.", "Steroid: 3 six-membered rings + 1 five-membered.", "Cholesterol → hormones: the substituents change."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Choose what to view"); el.appendChild(c);
      ui.tp = kit.ui.options({ label: "Linear terpene", cols: 3, value: S.tp, options: Object.keys(TP).map(function (k) { return { v: k, label: TP[k].n, sub: TP[k].cls }; }), onChange: function (v) { ctx.goManual(); S.tp = v; S.mode = 'ter'; } }); c.appendChild(ui.tp);
      ui.st = kit.ui.options({ label: "Steroid", cols: 2, value: S.st, options: Object.keys(ST).map(function (k) { return { v: k, label: ST[k].n }; }), onChange: function (v) { ctx.goManual(); S.st = v; S.mode = 'st'; } }); c.appendChild(ui.st);
      ui.cy = kit.ui.slider({ label: "Squalene folding", min: 0, max: 1, step: 0.01, value: S.cyc, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'sq'; S.cyc = v; } }); c.appendChild(kit.ui.sliders([ui.cy]));
      c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Carbons by number of isoprene units", h: 200, note: "C = 5 × n. Highlighted: your terpene.", draw: function (cx, w, h, col) {
      var D = [[1, "Hemiterpene"], [2, "Monoterpene"], [3, "Sesquiterpene"], [4, "Diterpene"], [6, "Triterpene"], [8, "Tetraterpene"]], L = 90, Rr = 30, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
      D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.mode || 'ter') === 'ter' && TP[S.tp].u === d[0]; cx.fillStyle = cur ? '#e599f7' : '#845ef7'; cx.globalAlpha = cur ? 1 : 0.65; cx.fillRect(L, y + 4, pw * d[0] * 5 / 40, bh - 8); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[1], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText('C' + d[0] * 5, L + pw * d[0] * 5 / 40 + 4, y + bh / 2 + 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if ((S.mode || 'ter') === 'st') { var s = ST[S.st]; return '<div class="card-kicker">' + s.n + '</div><table class="calc-table">' + row("Formula", s.f) + row("Rings", 'A, B, C (6 C) + D (5 C)') + row('C3', s.c3 === 'OH' ? 'OH' : 'C=O') + row('C17', s.c17) + row("Function", s.role) + '</table>'; } var t = TP[S.tp]; return '<div class="card-kicker">' + t.n + '</div><table class="calc-table">' + row("C₅ units", t.u) + row("Carbons", t.u + ' × 5 = <b>' + t.u * 5 + '</b>') + row("Formula", t.f) + row("C=C double bonds", String(t.u) + " (one per unit)") + '</table>'; },
    quiz: [
      { q: "Terpenes are formed from units of…", options: ["isoprene (C₅)", "acetate (C₂)", "glucose (C₆)", "ethylene"], answer: 0, why: "Isoprene rule." },
      { q: "A sesquiterpene has…", options: ["15 carbons", "10 carbons", "20 carbons", "30 carbons"], answer: 0, why: "3 units × 5." },
      { q: "The precursor of cholesterol is…", options: ["squalene", "glucose", "palmitic acid", 'ATP'], answer: 0, why: "Squalene → lanosterol → cholesterol." },
      { q: "The steroid nucleus has…", options: ["3 six-membered rings and 1 five-membered", "4 six-membered rings", "2 six-membered and 2 five-membered", "1 aromatic six-membered ring"], answer: 0, why: "A, B, C six-membered; D five-membered." },
      { q: "Estradiol differs from testosterone because it has…", options: ["aromatic A ring", "an 8-carbon side chain", "an acetyl group", "two ketones"], answer: 0, why: "It loses the C19 methyl and aromatizes." }
    ],
    help: { intro: "Each color marks one isoprene unit. In “Steroid” you see the A–D nucleus with its substituents; the folding control shows squalene closing.", items: [['Colours', 'each colour marks one isoprene unit (C₅); grey = carbon, red = oxygen.'], ['Controls', '“Linear terpene” or “Steroid”, and “Squalene folding”, which shows the rings closing.'], ['Steroid', 'four-ring nucleus A–D (three six-membered and one five-membered) with its substituents.'], ['Chart', '“Carbons by number of isoprene units”.']], try: ['Count the colours in a terpene: n units × 5 C.', 'Fold squalene and follow how the rings of the steroid skeleton close.', 'Compare cholesterol with a hormone: the nucleus is the same, the substituents change.'] }
  };
  MSim.create(def);
})();
