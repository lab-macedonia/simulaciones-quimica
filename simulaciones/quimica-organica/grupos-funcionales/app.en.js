/* Grupos funcionales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var fmt = SimKit.fmt;
  var FG = {
    ol: { n: 'Alcohol', g: 'R–OH', suf: '-ol', c: '#ff6b6b', ir: [3200, 3550, "O–H, broad"], pr: 7, ex: "ethanol" },
    eter: { n: "Ether", g: 'R–O–R′', suf: "alkoxy- (prefix)", c: '#ffa94d', ir: [1050, 1150, 'C–O'], pr: 11, ex: "methoxymethane" },
    ald: { n: "Aldehyde", g: 'R–CHO', suf: '-al', c: '#ffd43b', ir: [1720, 1740, 'C=O (+ C–H 2720)'], pr: 5, ex: "ethanal" },
    cet: { n: "Ketone", g: 'R–CO–R′', suf: '-one', c: '#94d82d', ir: [1705, 1725, 'C=O'], pr: 6, ex: "propanone" },
    ac: { n: "Carboxylic acid", g: 'R–COOH', suf: "-oic acid", c: '#20c997', ir: [1700, 1725, "C=O + very broad O–H"], pr: 1, ex: "ethanoic acid" },
    es: { n: "Ester", g: 'R–COO–R′', suf: "alkyl …oate", c: '#22b8cf', ir: [1735, 1750, 'C=O'], pr: 2, ex: "ethyl ethanoate" },
    am: { n: "Amide", g: 'R–CONH₂', suf: '-amide', c: '#4dabf7', ir: [1630, 1690, "C=O (amide I)"], pr: 3, ex: "ethanamide" },
    amin: { n: "Amine", g: 'R–NH₂', suf: '-amine', c: '#748ffc', ir: [3300, 3500, 'N–H'], pr: 8, ex: "ethanamine" },
    nit: { n: "Nitrile", g: 'R–C≡N', suf: '-nitrile', c: '#9775fa', ir: [2210, 2260, 'C≡N'], pr: 4, ex: "ethanenitrile" },
    nitro: { n: 'Nitro', g: 'R–NO₂', suf: "nitro- (prefix)", c: '#da77f2', ir: [1340, 1550, "N=O (2 bands)"], pr: 13, ex: "nitromethane" },
    tiol: { n: "Thiol", g: 'R–SH', suf: '-thiol', c: '#f783ac', ir: [2550, 2600, "S–H, weak"], pr: 9, ex: "ethanethiol" },
    alq: { n: "Alkene", g: 'C=C', suf: '-ene', c: '#a9e34b', ir: [1620, 1680, 'C=C'], pr: 10, ex: "propene" },
    alqi: { n: "Alkyne", g: 'C≡C', suf: '-yne', c: '#66d9e8', ir: [2100, 2260, 'C≡C'], pr: 10.5, ex: "propyne" },
    ar: { n: "Aromatic", g: "Ar (benzene)", suf: "phenyl- / -benzene", c: '#adb5bd', ir: [1450, 1600, "ring C=C"], pr: 12, ex: "benzene" },
    hal: { n: "Alkyl halide", g: 'R–X', suf: "halo- (prefix)", c: '#51cf66', ir: [500, 800, 'C–X'], pr: 12.5, ex: "chloroethane" }
  };
  var FKEY = Object.keys(FG);
  var M = [
    { id: "propane", n: "propane", s: 'CCC', fam: 'alc' },
    { id: "ethanol", n: "ethanol", s: 'CCO{ol}' }, { id: 'eter', n: "methoxymethane (dimethyl ether)", s: 'CO{eter}C' },
    { id: "ethanal", n: "ethanal", s: 'CC{ald+}=O{ald}' }, { id: "propanone", n: "propanone", s: 'CC{cet}(=O{cet})C' },
    { id: 'acetico', n: "ethanoic acid", s: 'CC{ac}(=O{ac})O{ac}' }, { id: 'acetato', n: "ethyl ethanoate", s: 'CC{es}(=O{es})O{es}CC' }, { id: 'amida', n: "ethanamide", s: 'CC{am}(=O{am})N{am}' },
    { id: 'amina', n: "ethanamine", s: 'CCN{amin}' }, { id: "nitrile", n: "ethanenitrile", s: 'CC{nit}#N{nit}' }, { id: 'nitro', n: "nitromethane", s: 'CN{nitro}(=O{nitro})=O{nitro}' },
    { id: 'tiol', n: "ethanethiol", s: 'CCS{tiol}' }, { id: "propene", n: "propene", s: 'CC{alq}=C{alq}' }, { id: "propyne", n: "propyne", s: 'CC{alqi}#C{alqi}' },
    { id: "toluene", n: "methylbenzene (toluene)", s: 'CPh{ar+}' }, { id: "phenol", n: "phenol", s: 'O{ol}Ph{ar+}' }, { id: "chloroethane", n: "chloroethane", s: 'CCCl{hal}' },
    { id: "glycine", n: "glycine (2-aminoethanoic acid)", s: 'N{amin}CC{ac}(=O{ac})O{ac}' }, { id: 'lactico', n: "2-hydroxypropanoic acid (lactic)", s: 'CC(O{ol})C{ac}(=O{ac})O{ac}' }, { id: 'acrilato', n: "methyl propenoate", s: 'C{alq}=C{alq}C{es}(=O{es})O{es}C' }
  ];
  var MID = {}; M.forEach(function (m) { MID[m.id] = m; m.geo = MSim.build(m.s); m.fgs = []; m.geo.tag.forEach(function (t) { if (t && m.fgs.indexOf(t) < 0) m.fgs.push(t); }); });
  var MASS = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.90 };
  function formula(m) { var c = {}; m.geo.a.forEach(function (a) { c[a[0]] = (c[a[0]] || 0) + 1; }); var order = ['C', 'H', 'N', 'O', 'S', 'F', 'Cl', 'Br', 'I'], sub = '₀₁₂₃₄₅₆₇₈₉', t = '', mass = 0; order.forEach(function (e) { if (c[e]) { t += e + (c[e] > 1 ? String(c[e]).split('').map(function (d) { return sub[+d]; }).join('') : ''); mass += c[e] * MASS[e]; } }); var X = (c.F || 0) + (c.Cl || 0) + (c.Br || 0) + (c.I || 0), dbe = ((c.C || 0) * 2 + 2 + (c.N || 0) - (c.H || 0) - X) / 2; return { f: t, M: mass, dbe: dbe, c: c }; }
  var S = { set: ["ethanol", 'eter', "ethanal", "propanone"], hide: false, ch: null, score: [0, 0] };
  var grps = [], labs = [], flabs = [], names = [], key_ = '';
  var STG = [["ethanal"], 0];
  function stages() {
    return [
      ["What is a functional group?", "Concept", "A functional group is the atom or set of atoms that determines reactivity", "<p>The <b>functional group</b> is the reactive part of an organic molecule: molecules with the same group react in a similar way. Compare <b>propane</b> (only C–C and C–H, hardly reactive) with <b>ethanol</b> (–OH), <b>ethanal</b> (–CHO) and <b>ethanoic acid</b> (–COOH). The colored halos mark each group.</p>"],
      ["Oxygen-containing groups", "Oxygenated", "Alcohol, ether, aldehyde and ketone", "<p><b>Alcohol</b> R–OH (H bonds, high b.p.); <b>ether</b> R–O–R′ (C–O–C, hardly reactive); <b>aldehyde</b> R–CHO (carbonyl at the end of the chain, oxidizes to acid); <b>ketone</b> R–CO–R′ (interior carbonyl). Aldehyde and ketone share the <b>carbonyl group C=O</b>.</p>"],
      ["Carboxylic acid derivatives", "Carboxylic", "Acid, ester and amide: carbonyl bonded to O or N", "<p><b>Carboxylic acids</b> (–COOH), <b>esters</b> (–COOR) and <b>amides</b> (–CONH₂) have a carbonyl bonded to a heteroatom (acyl). The acid has the highest priority in nomenclature. The <b>amide</b> is planar due to N–C=O resonance (C–N bond with partial double-bond character).</p>"],
      ["Nitrogen and sulfur", 'N y S', "Amine, nitrile, nitro and thiol", "<p><b>Amine</b> R–NH₂ (basic, lone pair on N); <b>nitrile</b> R–C≡N (linear, sp); <b>nitro</b> R–NO₂ (planar, strongly electron-withdrawing); <b>thiol</b> R–SH (sulfur analog of the alcohol, characteristic smell, weakly polar S–H).</p>"],
      ["Unsaturations and aromatics", "Unsaturated", "Alkene, alkyne and aromatic ring", "<p><b>Alkene</b> C=C (planar, sp²), <b>alkyne</b> C≡C (linear, sp), <b>aromatic</b> (planar 6-carbon ring with 6 delocalized π electrons). <b>Phenol</b> combines a ring and –OH; note that an OH on a ring is a phenol, not an aliphatic alcohol.</p>"],
      ["Priority when naming", "Priority", "In polyfunctional molecules the highest-priority group rules", "<p>Priority order (suffix): <b>acid &gt; ester &gt; amide &gt; nitrile &gt; aldehyde &gt; ketone &gt; alcohol &gt; amine &gt; alkene &gt; alkyne</b>. The others are named as prefixes. Glycine: acid (principal) + amine → “2-aminoethanoic acid”. Lactic: acid + alcohol → “2-hydroxypropanoic acid”.</p>"]
    ];
  }
  var LESSON = [["propane", "ethanol", "ethanal", 'acetico'], ["ethanol", 'eter', "ethanal", "propanone"], ['acetico', 'acetato', 'amida'], ['amina', "nitrile", 'nitro', 'tiol'], ["propene", "propyne", "toluene", "phenol"], ["glycine", 'lactico', 'acrilato']];
  function rebuild(ctx) {
    var T = ctx.T, sc = ctx.scene; grps.forEach(function (g) { sc.remove(g); }); grps = []; var n = S.set.length, sp = n === 1 ? 0 : 6.2;
    S.set.forEach(function (id, k) {
      var m = MID[id], g = new T.Group(); g.add(ctx.mol(m.geo, { gs: 1.0, ar: 0.46 }));
      m.geo.tag.forEach(function (t, i) { if (!t) return; var a = m.geo.a[i], h = new T.Mesh(new T.SphereGeometry(0.62, 20, 14), new T.MeshBasicMaterial({ color: FG[t].c, transparent: true, opacity: 0.38, depthWrite: false })); h.position.set(a[1], a[2], a[3]); h.userData.halo = true; g.add(h); });
      g.position.x = (k - (n - 1) / 2) * sp; sc.add(g); grps.push(g);
    });
    var dz = n === 1 ? 11 : 8 + 3.4 * n; ctx.def.views[0].pos = [0, 3, dz]; ctx.def.views[1].pos = [0, 1, dz]; ctx.view('libre'); key_ = S.set.join('|');
  }
  var def = {
    key: 'grupos-funcionales', title: "Functional groups", subtitle: "3D simulator · organic chemistry", accent: { dark: '#38bdf8', light: '#0369a1' },
    stages: stages, dur: 10, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 24], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 1, 24], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 4], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Group halos", icon: '◉' }, { id: 'spin', label: "Rotate", icon: '⟳' }],
    build: function (ctx) {
      for (var i = 0; i < 4; i++) { names.push(ctx.label('', 'bl-d')); var row = []; for (var j = 0; j < 3; j++) row.push(ctx.label('', 'bl-lead')); flabs.push(row); }
      rebuild(ctx);
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var st = LESSON[f.i]; if (S._st !== f.i) { S._st = f.i; S.set = st.slice(); S.hide = false; } }
      if (S.set.join('|') !== key_) rebuild(ctx);
      var halo = ctx.layer('halo') && !S.hide, n = S.set.length, sp = n === 1 ? 0 : 6.2;
      grps.forEach(function (g, k) { if (ctx.layer('spin')) g.rotation.y += dt * 0.35; g.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; });
        var m = MID[S.set[k]], x = g.position.x; names[k].pos(x, -3.6, 0).set(S.hide ? '¿?' : m.n, 'bl-d').vis(true);
        for (var j = 0; j < 3; j++) { var fl = flabs[k][j], id = m.fgs[j]; if (id && halo) { fl.pos(x, 3.4 + j * 1.0, 0).set(FG[id].n, 'bl-lead').vis(true); fl.o.element.style.background = FG[id].c; fl.o.element.style.color = '#111'; } else fl.vis(false); } });
      for (var k2 = grps.length; k2 < 4; k2++) { names[k2].vis(false); for (var j2 = 0; j2 < 3; j2++) flabs[k2][j2].vis(false); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.refresh) u.refresh(); },
    hud: function () { var m = MID[S.set[0]], fo = formula(m), fl = S.set.reduce(function (a, id) { MID[id].fgs.forEach(function (t) { if (a.indexOf(t) < 0) a.push(t); }); return a; }, []);
      return { eq: { chip: S.set.length > 1 ? S.set.length + ' mol.' : formula(m).f, name: S.set.length > 1 ? "Comparison" : m.n, body: S.set.length === 1 ? "<div class=\"eqline\"><small>Molar mass</small>" + fmt(fo.M, 2) + " g/mol</div><div class=\"eqline\"><small>Unsaturations</small>" + fo.dbe + "</div><div class=\"eqline\"><small>Groups</small>" + (m.fgs.length ? m.fgs.map(function (t) { return FG[t].n; }).join(', ') : "none (alkane)") + '</div>' : "<div class=\"eqline\"><small>Groups present</small>" + (fl.length ? fl.map(function (t) { return FG[t].n; }).join(', ') : '—') + '</div>' },
        legend: fl.map(function (t) { return { label: FG[t].n, color: FG[t].c, text: FG[t].g }; }) }; },
    measures: function () { var m = MID[S.set[0]], fo = formula(m); return [["Molecule", m.n], ["Formula", fo.f], ["Molar mass", fmt(fo.M, 2) + " g/mol"], ["Unsaturations (DBE)", String(fo.dbe)], ["Groups", m.fgs.length ? m.fgs.map(function (t) { return FG[t].n; }).join(', ') : "none"], ["Molecules in the scene", String(S.set.length)]]; },
    ideas: ["The <b>functional group</b> determines reactivity and properties.", "<b>Carbonyl C=O</b>: aldehyde, ketone, acid, ester, amide.", "Priority: <b>acid &gt; ester &gt; amide &gt; nitrile &gt; aldehyde &gt; ketone &gt; alcohol &gt; amine</b>.", "Each group has a characteristic IR band (see graphs).", "Lower-priority groups are named as <b>prefixes</b>."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Molecules (up to 4)"); el.appendChild(c); var wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0'; c.appendChild(wrap); var btns = {};
      M.forEach(function (m) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = m.n.split(' (')[0]; b.title = m.n; b.onclick = function () { ctx.goManual(); var i = S.set.indexOf(m.id); if (i >= 0) { if (S.set.length > 1) S.set.splice(i, 1); } else { if (S.set.length >= 4) S.set.shift(); S.set.push(m.id); } S.hide = false; ui.refresh(); }; wrap.appendChild(b); btns[m.id] = b; });
      ui.refresh = function () { M.forEach(function (m) { btns[m.id].className = 'btn' + (S.set.indexOf(m.id) >= 0 ? " primary" : ''); }); };
      ui.refresh();
      c.appendChild(ctx.btnRow([{ t: "Oxygenated", fn: function () { ctx.goManual(); S.set = LESSON[1].slice(); S.hide = false; ui.refresh(); } }, { t: "Carboxylic", fn: function () { ctx.goManual(); S.set = LESSON[2].slice(); S.hide = false; ui.refresh(); } }, { t: 'N y S', fn: function () { ctx.goManual(); S.set = LESSON[3].slice(); S.hide = false; ui.refresh(); } }, { t: "Unsaturated", fn: function () { ctx.goManual(); S.set = LESSON[4].slice(); S.hide = false; ui.refresh(); } }, { t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var ch = kit.ui.card("Challenge: which group is it?"); el.appendChild(ch); var box = document.createElement('div'); ch.appendChild(box);
      function newQ() { var cand = M.filter(function (m) { return m.fgs.length === 1; }); var m = cand[Math.floor(Math.random() * cand.length)]; ctx.goManual(); S.set = [m.id]; S.hide = true; S.ch = m.fgs[0]; ui.refresh(); draw(''); }
      function draw(msg) { box.innerHTML = "<p class=\"small\">Correct: <b>" + S.score[0] + '</b> / ' + S.score[1] + '. ' + (S.ch ? "The molecule has its halos hidden: identify its group." : "Press “New molecule”.") + '</p>' + (msg ? '<p><b>' + msg + '</b></p>' : ''); var grid = document.createElement('div'); grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'; FKEY.forEach(function (k) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = FG[k].n; b.onclick = function () { if (!S.ch) { kit.toast("Press “New molecule”"); return; } S.score[1]++; var ok = k === S.ch; if (ok) S.score[0]++; var right = S.ch; S.ch = null; S.hide = false; draw(ok ? "Correct! " + FG[right].n + ' (' + FG[right].g + ')' : "No: it was " + FG[right].n + ' (' + FG[right].g + ').'); }; grid.appendChild(b); }); box.appendChild(grid); box.appendChild(ctx.btnRow([{ t: "New molecule", primary: true, fn: newQ }])); }
      draw('');
    },
    graphs: [
      { title: "Group priority for naming", h: 300, note: "Highest priority on top. Highlighted: groups present in the scene.", draw: function (cx, w, h, c) {
        var ks = FKEY.slice().sort(function (a, b) { return FG[a].pr - FG[b].pr; }), ph = (h - 14) / ks.length, pres = {}; S.set.forEach(function (id) { MID[id].fgs.forEach(function (t) { pres[t] = 1; }); }); cx.font = '11px system-ui';
        ks.forEach(function (k, i) { var y = 6 + i * ph; cx.globalAlpha = pres[k] ? 1 : 0.4; cx.fillStyle = FG[k].c; cx.fillRect(10, y + 2, 14, ph - 5); cx.fillStyle = c.ink; cx.textAlign = 'left'; cx.fillText((i + 1) + '. ' + FG[k].n + '  ' + FG[k].g, 32, y + ph / 2 + 3); cx.textAlign = 'right'; cx.fillText(FG[k].suf, w - 8, y + ph / 2 + 3); cx.globalAlpha = 1; }); } },
      { title: "Characteristic IR bands (cm⁻¹)", h: 270, note: "Bars: absorption region. Groups present are highlighted. This is explored in more depth in the spectroscopy simulator.", draw: function (cx, w, h, c) {
        var L = 14, Rr = 10, Tp = 6, B = 26, pw = w - L - Rr, ks = FKEY.slice().sort(function (a, b) { return FG[b].ir[1] - FG[a].ir[1]; }), ph = (h - Tp - B) / ks.length, pres = {}; S.set.forEach(function (id) { MID[id].fgs.forEach(function (t) { pres[t] = 1; }); });
        var sx = function (v) { return L + pw * (4000 - v) / 3600; }; cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'center';
        for (var v = 4000; v >= 400; v -= 600) { cx.beginPath(); cx.moveTo(sx(v), Tp); cx.lineTo(sx(v), h - B); cx.stroke(); cx.fillText(v, sx(v), h - B + 12); } cx.fillText("wavenumber (cm⁻¹)", L + pw / 2, h - 3);
        ks.forEach(function (k, i) { var y = Tp + i * ph, r = FG[k].ir; cx.globalAlpha = pres[k] ? 1 : 0.35; cx.fillStyle = FG[k].c; cx.fillRect(sx(r[1]), y + 2, Math.max(4, sx(r[0]) - sx(r[1])), ph - 5); cx.fillStyle = c.ink; cx.textAlign = r[1] > 2200 ? 'left' : 'right'; cx.fillText(FG[k].n, r[1] > 2200 ? sx(r[0]) + 5 : sx(r[1]) - 5, y + ph / 2 + 3); cx.globalAlpha = 1; }); } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return S.set.map(function (id) { var m = MID[id], fo = formula(m), main = m.fgs.slice().sort(function (a, b) { return FG[a].pr - FG[b].pr; })[0];
        return '<div class="card-kicker">' + m.n + '</div><table class="calc-table">' + row("Molecular formula", '<b>' + fo.f + '</b>') + row("Molar mass", fmt(fo.M, 2) + " g/mol") + row("Unsaturations (2C+2+N−H−X)/2", '<b>' + fo.dbe + '</b>') + row("Groups", m.fgs.length ? m.fgs.map(function (t) { return FG[t].n + ' (' + FG[t].g + ')'; }).join('; ') : "none") + row("Principal group", main ? FG[main].n + ' → ' + FG[main].suf : "— (alkane: -ane)") + '</table>'; }).join('');
    },
    calcLabel: "Formula",
    quiz: [
      { q: "Which functional group does ethanal have?", options: ["Aldehyde", "Ketone", "Carboxylic acid", "Ether"], answer: 0, why: "R–CHO: carbonyl at the end of the chain, with an H on the carbonyl carbon." },
      { q: "The difference between an aldehyde and a ketone is that…", options: ["in the ketone the carbonyl is bonded to two carbons", "the ketone has no C=O", "the aldehyde has an OH", "none: they are the same"], answer: 0, why: "Both have C=O; in the ketone the carbonyl is interior (R–CO–R′)." },
      { q: "Which group is R–COO–R′?", options: ["Ester", "Ether", "Acid", "Amide"], answer: 0, why: "A carbonyl bonded to an oxygen that carries another R′ group: ester." },
      { q: "Order by nomenclature priority (highest first).", options: ["acid > ester > amide > nitrile > aldehyde > ketone > alcohol > amine", "alcohol > ketone > aldehyde > acid", "amine > alcohol > ketone > acid", "ketone > aldehyde > ester > acid"], answer: 0, why: "This is the IUPAC order of principal groups (suffix)." },
      { q: "Glycine, NH₂–CH₂–COOH, is named…", options: ["2-aminoethanoic acid", "2-carboxyethanamine", "aminoethanal", "amino ethanoate"], answer: 0, why: "The acid is the principal group (suffix -oic); the amine becomes the prefix amino-." },
      { q: "Which IR band is characteristic of a nitrile?", options: ['≈ 2200–2260 cm⁻¹', '≈ 1700 cm⁻¹', "≈ 3300 cm⁻¹ broad", '≈ 1100 cm⁻¹'], answer: 0, why: "The C≡N triple bond absorbs at 2210–2260 cm⁻¹." },
      { q: "How many unsaturations (DBE) does ethyl ethanoate, C₄H₈O₂, have?", options: ['1', '0', '2', '4'], answer: 0, why: "DBE = (2·4 + 2 − 8)/2 = 1 (the C=O)." },
      { q: "An OH bonded directly to an aromatic ring corresponds to…", options: ["a phenol", "an aliphatic alcohol", "an ether", "a carboxylic acid"], answer: 0, why: "Ar–OH is a phenol: more acidic than an alcohol because of phenoxide stabilization." }
    ],
    help: { intro: "The colored halos mark each functional group. In “Lab” build the scene with up to four molecules.", items: [["Halos", "a layer lets you hide them to test identification."], ["Challenge", "identify the group of a molecule with hidden halos."], ["Formula", "molar mass and unsaturations of each molecule."], ["Graphs", "nomenclature priority and IR bands."], ['Families', 'in Lab the molecules are grouped into oxygen compounds, carboxylic compounds, N and S compounds, and unsaturated compounds.']], try: ['Hide the halos and try to identify the functional group of each molecule.', 'Compare the IR bands of an alcohol and a ketone on the chart.', 'Rank four molecules by naming priority and check against the chart.'] }
  };
  MSim.create(def);
})();
