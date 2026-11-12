/* Alquinos: estructura y reacciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



/* Constructor de geometrías 3D a partir de una notación tipo SMILES (sin anillos, salvo el fenilo «Ph»).
   MSim.build('CC{ol}O{ol}') -> { a:[[el,x,y,z]], b:[[i,j,orden]], tag:[etiqueta|null por átomo] }
   Reglas: sp3 tetraédrico (zigzag anti), sp2 plano (trans), sp lineal; los H se completan por valencia.
   Etiquetas: átomo{nombre} (los H unidos a N, O, S heredan la etiqueta; con «nombre+» también los de C). */
(function () {
  var T = THREE, V = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1 };
  var BL = { 'C-C1': 1.54, 'C-C2': 1.34, 'C-C3': 1.20, 'C-O1': 1.43, 'C-O2': 1.22, 'C-N1': 1.47, 'C-N2': 1.28, 'C-N3': 1.16, 'C-F1': 1.35, 'C-Cl1': 1.77, 'C-Br1': 1.94, 'C-I1': 2.14, 'C-S1': 1.82, 'C-S2': 1.60, 'C-H1': 1.09, 'H-O1': 0.96, 'H-N1': 1.01, 'H-S1': 1.34, 'N-O1': 1.40, 'N-O2': 1.22, 'O-S2': 1.45, 'O-P2': 1.48, 'O-P1': 1.60, 'C-P1': 1.84, 'O-O1': 1.45, 'N-N1': 1.45, 'H-P1': 1.42 };
  function bl(a, b, o) { var k = [a, b].sort().join('-') + o; return BL[k] || BL[[b, a].join('-') + o] || 1.5; }
  function parse(s) {
    var i = 0, root = null, nodes = [];
    function seq(parent, ord) {
      var prev = parent;
      while (i < s.length) {
        var ch = s[i];
        if (ch === '(') { i++; seq(prev, 1); continue; }
        if (ch === ')') { i++; return; }
        if (ch === '=') { ord = 2; i++; continue; } if (ch === '#') { ord = 3; i++; continue; } if (ch === '-') { i++; continue; }
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length;
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - sum); }
  function perp(u, ref) { var p = ref ? ref.clone().sub(u.clone().multiplyScalar(ref.dot(u))) : null; if (!p || p.lengthSq() < 1e-6) { p = Math.abs(u.x) < 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1); p.sub(u.clone().multiplyScalar(p.dot(u))); } return p.normalize(); }
  function build(s) {
    var tr = parse(s), A = [], B = [], TAG = [];
    function add(el, p, tag) { A.push([el, p.x, p.y, p.z]); TAG.push(tag || null); return A.length - 1; }
    function bond(i, j, o) { B.push([i, j, o || 1]); }
    function dirsFor(h, u, ref, isRoot) {
      var e1 = perp(u, ref), e2 = new T.Vector3().crossVectors(u, e1), out = [];
      if (h === 'sp') { out = [u.clone().negate()]; if (isRoot) out.unshift(u.clone()); return out; }
      if (h === 'sp2') { out = [u.clone().multiplyScalar(-0.5).addScaledVector(e1, -0.866), u.clone().multiplyScalar(-0.5).addScaledVector(e1, 0.866)]; if (isRoot) out.unshift(u.clone()); return out; }
      for (var i = 0; i < 3; i++) { var f = Math.PI + i * 2 * Math.PI / 3; out.push(u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, 0.9428 * Math.cos(f)).addScaledVector(e2, 0.9428 * Math.sin(f))); }
      if (isRoot) out.unshift(u.clone()); return out;
    }
    function place(n, pos, u, gp, idx) {
      n.pos = pos; var ref = gp ? gp.clone().sub(pos) : null; var h = hyb(n), tagH = n.tag && (n.inh || n.el === 'N' || n.el === 'O' || n.el === 'S') ? n.tag : null;
      if (h === 'ring') {
        var R = 1.40, uu = u ? u : new T.Vector3(0, 1, 0), w = perp(uu, ref), ctr = pos.clone().addScaledVector(uu, -R), ids = [idx];
        for (var k = 1; k < 6; k++) { var th = k * Math.PI / 3, p = ctr.clone().addScaledVector(uu, Math.cos(th) * R).addScaledVector(w, Math.sin(th) * R); var id = add('C', p, n.tag); ids.push(id); }
        for (k = 0; k < 6; k++) bond(ids[k], ids[(k + 1) % 6], k % 2 ? 1 : 2);
        for (k = 0; k < 6; k++) { if (k === 0 && u) continue; var q = new T.Vector3(A[ids[k]][1], A[ids[k]][2], A[ids[k]][3]), d = q.clone().sub(ctr).normalize(), hp = q.clone().addScaledVector(d, 1.08), hid = add('H', hp, n.inh ? n.tag : null); bond(ids[k], hid, 1); }
        return;
      }
      var subs = n.kids.slice(), nh = nH(n), dirs = dirsFor(h, u || new T.Vector3(0, 1, 0), ref, !n.par), si = 0;
      subs.forEach(function (c) { var d = dirs[si++] || dirs[0], len = bl(n.el, c.el === 'Ph' ? 'C' : c.el, c.ord), p = pos.clone().addScaledVector(d, len), id = add(c.el === 'Ph' ? 'C' : c.el, p, c.tag); bond(idx, id, c.ord); place(c, p, d.clone().negate(), n.par ? n.par.pos : null, id); });
      for (var k = 0; k < nh; k++) { var d2 = dirs[si++] || dirs[0], hl = bl(n.el, 'H', 1), hp2 = pos.clone().addScaledVector(d2, hl), hid2 = add('H', hp2, tagH); bond(idx, hid2, 1); }
    }
    var r = tr.root, rp = new T.Vector3(0, 0, 0), ri = add(r.el === 'Ph' ? 'C' : r.el, rp, r.tag); place(r, rp, null, null, ri);
    var c = new T.Vector3(); A.forEach(function (a) { c.x += a[1]; c.y += a[2]; c.z += a[3]; }); c.multiplyScalar(1 / A.length); A.forEach(function (a) { a[1] -= c.x; a[2] -= c.y; a[3] -= c.z; });
    return { a: A, b: B, tag: TAG };
  }
  MSim.build = build;
})();


(function () {
  var T = THREE;
  var SUB = { prop: { n: "Propyne", s: 'CC#C', t: true }, but1: { n: "1-Butyne", s: 'CCC#C', t: true }, but2: { n: "2-Butyne", s: 'CC#CC', t: false } };
  var RX = {
    none: { n: "No reaction", r: '' },
    nanh2: { n: "Deprotonation (NaNH₂)", r: "NaNH₂, NH₃(l)", note: "The terminal H (pKa ≈ 25) is removed: the acetylide forms, a good nucleophile." },
    h2pd: { n: "H₂ / Pd-C", r: "H₂ (excess), Pd/C", note: "Complete hydrogenation to alkane; it does not stop at the alkene." },
    lindlar: { n: "H₂ / Lindlar", r: "H₂, poisoned Pd/CaCO₃", note: "Syn addition on the same side: cis (Z) alkene." },
    nanh3: { n: "Na / NH₃(l)", r: "Na, NH₃(l)", note: "Dissolving-metal reduction: trans (E) alkene." },
    h2o: { n: "H₂O, H₂SO₄, HgSO₄", r: "H₂O, H₂SO₄, HgSO₄", note: "Markovnikov hydration: the enol tautomerizes to a ketone." },
    hbo: { n: "Hydroboration–oxidation", r: "1) R₂BH   2) H₂O₂, NaOH", note: "Anti-Markovnikov: the enol gives an aldehyde (terminal alkyne)." },
    hx: { n: "HBr (1 equiv.)", r: 'HBr', note: "Markovnikov addition: haloalkene; with excess, geminal dihalide." }
  };
  var PR = {
    prop: { nanh2: ['CC#C', "Propyne acetylide"], h2pd: ['CCC', "Propane"], lindlar: ['CC=C', 'Propeno'], nanh3: ['CC=C', 'Propeno'], h2o: ['CC(=O)C', "Propanone (acetone)"], hbo: ['CCC=O', 'Propanal'], hx: ['CC(Br)=C', '2-Bromopropeno'] },
    but1: { nanh2: ['CCC#C', "1-Butyne acetylide"], h2pd: ['CCCC', "Butane"], lindlar: ['CCC=C', '1-Buteno'], nanh3: ['CCC=C', '1-Buteno'], h2o: ['CCC(=O)C', "Butanone"], hbo: ['CCCC=O', 'Butanal'], hx: ['CCC(Br)=C', '2-Bromo-1-buteno'] },
    but2: { nanh2: null, h2pd: ['CCCC', "Butane"], lindlar: ['CC=CC', '(Z)-2-Buteno'], nanh3: ['CC=CC', '(E)-2-Buteno'], h2o: ['CCC(=O)C', "Butanone"], hbo: ['CCC(=O)C', "Butanone"], hx: ['CC=C(Br)C', '2-Bromo-2-buteno'] }
  };
  var S = { sub: 'but1', rx: 'none' }, g = null, gS = null, gP = null, arrow = null, lab = [], keyP = '', keyS = '';
  function prod() { var p = PR[S.sub][S.rx]; if (S.rx === 'hbo' && !SUB[S.sub].t) p = PR[S.sub].hbo; return p || null; }
  function cisify(geo) { // gira 180° el fragmento unido al C3 del alqueno CC=CC (convierte trans en cis)
    var a = geo.a, b = geo.b, n = a.length, i, db = null; b.forEach(function (x) { if (x[2] === 2) db = x; }); if (!db) return geo;
    var adj = a.map(function () { return []; }); b.forEach(function (x) { adj[x[0]].push(x[1]); adj[x[1]].push(x[0]); });
    var seen = {}; seen[db[0]] = 1; var st = [db[1]], fr = []; seen[db[1]] = 1; while (st.length) { var u = st.pop(); fr.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; st.push(v); } }); }
    var p0 = new T.Vector3(a[db[0]][1], a[db[0]][2], a[db[0]][3]), p1 = new T.Vector3(a[db[1]][1], a[db[1]][2], a[db[1]][3]), ax = p1.clone().sub(p0).normalize();
    fr.forEach(function (k) { if (k === db[1]) return; var v = new T.Vector3(a[k][1], a[k][2], a[k][3]).sub(p1); v.applyAxisAngle(ax, Math.PI); a[k][1] = p1.x + v.x; a[k][2] = p1.y + v.y; a[k][3] = p1.z + v.z; });
    return geo;
  }
  function stages() {
    return [
      ["sp structure", "Structure", "The triple-bond carbons are sp: linear geometry of 180°",
        "<p>In an <b>alkyne</b> the two triple-bond carbons are <b>sp</b> hybridized. The C≡C bond (1.20 Å) is shorter than C=C (1.34 Å) and the four atoms H–C≡C–C lie on a <b>straight line (180°)</b>. One σ and two π bonds (perpendicular to each other) form the triple bond. Switch between propyne, 1-butyne and 2-butyne.</p>"],
      ["Acidity and acetylides", "Acidity", "The terminal H is acidic (pKa ≈ 25) because the sp carbanion has 50 % s character",
        "<p>The H of a <b>terminal alkyne</b> is acidic (pKa ≈ 25), much more than that of an alkene (44) or an alkane (50), because the carbanion's lone pair sits in an <b>sp (50% s)</b> orbital, closer to the nucleus. A strong base such as <b>NaNH₂</b> removes it to form an <b>acetylide</b>, a nucleophile useful for lengthening chains. 2-Butyne has no terminal H and does not react.</p>"],
      ["Selective hydrogenation", "Hydrogenation", "Lindlar → cis · Na/NH₃ → trans · H₂/Pd → alkane",
        "<p>With <b>H₂/Pd-C</b> the alkyne goes all the way to the alkane. The <b>Lindlar</b> catalyst (poisoned Pd) stops at the <b>cis alkene</b>, by syn addition of both H atoms. Reduction with <b>Na in liquid NH₃</b> gives the <b>trans alkene</b> through a radical anion. Observe the product's geometry.</p>"],
      ["Hydration and tautomerism", "Hydration", "Enol → ketone (or aldehyde with hydroboration)",
        "<p>Hg²⁺-catalyzed <b>hydration</b> follows <b>Markovnikov's</b> rule and gives an unstable <b>enol</b> that <b>tautomerizes</b> to a <b>ketone</b>. <b>Hydroboration–oxidation</b> is anti-Markovnikov: a terminal alkyne yields an <b>aldehyde</b>. A symmetrical internal alkyne gives a single ketone.</p>"],
      ["HBr addition", "HX addition", "Markovnikov regiochemistry",
        "<p><b>HBr</b> adds across the triple bond: H goes to the carbon with more H and Br to the more substituted one, via a <b>vinyl cation</b>. With one equivalent the <b>bromoalkene</b> is obtained; with excess, the <b>geminal dibromide</b>. Compare the product of a terminal and an internal alkyne.</p>"]
    ];
  }
  function place(grp, x) { grp.position.set(x, 0, 0); grp.rotation.z = Math.PI / 2; }
  var def = {
    key: 'alquinos', title: "Alkynes: structure and reactions", subtitle: "3D simulator · organic chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [10, 4, 17], target: [10, 0, 0] }, { id: 'frontal', label: "Front", pos: [10, 0, 20], target: [10, 0, 0] }],
    layers: [{ id: 'prod', label: "Product", icon: '→' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gS = new T.Group(); gP = new T.Group(); g.add(gS); g.add(gP);
      arrow = new T.Group(); var sh = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 4, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); sh.rotation.z = Math.PI / 2; arrow.add(sh); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.x = 2.2; arrow.add(hd); g.add(arrow);
      for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['prop', 'but1', 'but2'][Math.min(2, Math.floor(f.local * 3))]; S.rx = 'none'; } if (i === 1) { S.sub = f.local < 0.7 ? 'but1' : 'but2'; S.rx = 'nanh2'; } if (i === 2) { S.sub = 'but2'; S.rx = ['lindlar', 'nanh3', 'h2pd'][Math.min(2, Math.floor(f.local * 3))]; } if (i === 3) { S.sub = 'but1'; S.rx = f.local < 0.5 ? 'h2o' : 'hbo'; } if (i === 4) { S.sub = f.local < 0.5 ? 'but1' : 'but2'; S.rx = 'hx'; } }
      var sd = SUB[S.sub], pr = S.rx === 'none' ? null : prod(), kS = S.sub, kP = pr ? S.sub + S.rx : '';
      if (keyS !== kS) { keyS = kS; while (gS.children.length) gS.remove(gS.children[0]); gS.add(ctx.mol(MSim.build(sd.s), { gs: 1.7, ar: 0.8 })); }
      if (keyP !== kP) { keyP = kP; while (gP.children.length) gP.remove(gP.children[0]); if (pr) { var geo = MSim.build(pr[0]); if (S.rx === 'lindlar' && S.sub === 'but2') geo = cisify(geo); gP.add(ctx.mol(geo, { gs: 1.7, ar: 0.8 })); } }
      var showP = !!pr && ctx.layer('prod'); gP.visible = showP; arrow.visible = !!pr; place(gS, 11); place(gP, 23); arrow.position.set(17, 0, 0);
      lab[0].pos(11, 4.2, 0).set(sd.n, 'bl-lead').vis(true);
      lab[1].pos(11, -4, 0).set(i === 0 && !P.manual || S.rx === 'none' ? "C≡C 1.20 Å · 180° angle (sp)" : "pKa of H≡C–H ≈ 25", 'bl-d').vis(true);
      lab[2].pos(23, 4.2, 0).set(pr ? pr[1] : '', 'bl-pos').vis(showP);
      lab[3].pos(17, 1.4, 0).set(pr ? RX[S.rx].r : '', 'bl-d').vis(!!pr);
      lab[4].pos(23, -4, 0).set(pr && S.rx === 'lindlar' && S.sub === 'but2' ? "cis (Z)" : (pr && S.rx === 'nanh3' && S.sub === 'but2' ? "trans (E)" : ''), 'bl-d').vis(showP);
      if (S.rx !== 'none' && !pr) { lab[2].set("Does not react: no terminal H", 'bl-neg').vis(true).pos(23, 0, 0); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.rx) u.rx.set(S.rx); },
    hud: function () { var pr = S.rx === 'none' ? null : prod(); return { eq: { chip: 'C≡C', name: "Reaction", body: "<div class=\"eqline\"><small>Substrate</small>" + SUB[S.sub].n + "</div><div class=\"eqline\"><small>Reagent</small>" + RX[S.rx].n + "</div><div class=\"eqline\"><small>Product</small>" + (pr ? pr[1] : (S.rx === 'none' ? '—' : "does not react")) + '</div>' }, legend: [{ label: "Gray", color: '#56606b', text: 'C' }, { label: "White", color: '#f2f2f2', text: 'H' }, { label: "Brown", color: '#a0522d', text: 'Br' }] }; },
    measures: function () { var pr = S.rx === 'none' ? null : prod(); return [["Substrate", SUB[S.sub].n], ['Terminal', SUB[S.sub].t ? "yes" : 'no'], ["Reaction", RX[S.rx].n], ["Product", pr ? pr[1] : '—']]; },
    ideas: ["Alkyne: sp C, 180°.", "Terminal: pKa ≈ 25.", "Lindlar cis · Na/NH₃ trans.", "Hydration: enol → ketone."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Substrate and reagent"); el.appendChild(c);
      ui.sub = kit.ui.options({ label: "Alkyne", cols: 3, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); S.sub = v; } });
      ui.rx = kit.ui.options({ label: "Reaction", cols: 2, value: S.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].n }; }), onChange: function (v) { ctx.goManual(); S.rx = v; } });
      c.appendChild(ui.sub); c.appendChild(ui.rx); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Relative acidity (pKa)", h: 200, note: "Lower pKa = more acidic. The terminal alkyne H is much more acidic than that of alkanes and alkenes.", draw: function (cx, w, h, col) {
      var d = [['H₂O', 15.7], ['R–C≡C–H', 25], ['NH₃', 38], ["alkene", 44], ["alkane", 50]], L = 10, B = 26, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * x[1] / 50; cx.fillStyle = x[0] === 'R–C≡C–H' ? '#ff922b' : '#74c0fc'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(String(x[1]).replace('.', '.'), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var pr = S.rx === 'none' ? null : prod(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + SUB[S.sub].n + ' + ' + RX[S.rx].n + '</div><table class="calc-table">' + row("Product", pr ? '<b>' + pr[1] + '</b>' : (S.rx === 'none' ? "choose a reaction" : "does not react")) + row("Note", RX[S.rx].note || "Observe the linear geometry of the triple bond.") + row("Degree of unsaturation", "2 (triple bond) → " + (pr ? (/=O|=C/.test(pr[0]) ? '1' : (pr[0].indexOf('#') >= 0 ? '2' : '0')) : '2')) + '</table>'; },
    quiz: [
      { q: "The geometry around a triple-bond carbon is…", options: ["linear, 180°", "trigonal planar, 120°", "tetrahedral, 109.5°", "bent"], answer: 0, why: "sp hybridization." },
      { q: "The terminal alkyne is acidic because the carbanion…", options: ["has 50 % s character", "is sp³", "is aromatic", "has positive charge"], answer: 0, why: "The pair is closer to the nucleus." },
      { q: "Hydrogenation of 2-butyne with Lindlar produces…", options: ["(Z)-2-butene", "(E)-2-butene", "butane", "butanone"], answer: 0, why: "Syn addition on a poisoned catalyst." },
      { q: "Hydration of 1-butyne with HgSO₄/H₂SO₄ gives…", options: ["butanone", 'butanal', "butane", '1-butanol'], answer: 0, why: "Markovnikov: enol → ketone." },
      { q: "Na/NH₃(l) with an internal alkyne gives…", options: ["trans alkene", "cis alkene", "alkane", "ketone"], answer: 0, why: "The radical anion is more stable trans." },
      { q: "Which one does NOT react with NaNH₂ as an acid?", options: ['2-butino', '1-butino', "propyne", "acetylene"], answer: 0, why: "It has no terminal H." }
    ],
    help: { intro: "Choose an alkyne and a reaction: on the left you see the substrate and on the right the product with its geometry. In “Graphs” compare the acidities.", items: [['Scene', 'left = substrate; right = product with its geometry. Grey = C, white = H, brown = Br.'], ['Controls', '“Alkyne” and “Reaction”: hydrogenation (Lindlar or Na/NH₃), hydration or HBr addition.'], ['Chart', '“Relative acidity (pKa)”: a terminal alkyne (pKa ≈ 25) is far more acidic than an alkene or an alkane.']], try: ['Look at the sp carbon of the alkyne: linear geometry, 180°.', 'Hydrogenate 2-butyne with Lindlar and then with Na/NH₃: you get the cis and the trans alkene.', 'Hydrate an alkyne: the enol formed turns into a ketone (tautomerism).'] }
  };
  MSim.create(def);
})();
