/* Alcoholes, éteres y aminas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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

/* Utilidades para simuladores de mecanismos: puesta en escena de moléculas, flechas curvas con electrón viajero y acoplamiento de grupos. */
(function () {
  var T = THREE;
  MSim.idx = function (g, tag, nth) { var c = 0, n = nth || 0; for (var i = 0; i < g.tag.length; i++) { if (g.tag[i] === tag) { if (c === n) return i; c++; } } return -1; };
  MSim.vec = function (g, i) { return new T.Vector3(g.a[i][1], g.a[i][2], g.a[i][3]); };
  /* quita el primer H con la etiqueta dada (p. ej. el H que se pierde al formar el anión) */
  MSim.strip = function (g, tag) {
    var k = -1, i; for (i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === tag) { k = i; break; } }
    var map = {}, A = [], TG = [], B = []; g.a.forEach(function (a, j) { if (j !== k) { map[j] = A.length; A.push(a.slice()); TG.push(g.tag[j]); } });
    g.b.forEach(function (b) { if (b[0] !== k && b[1] !== k) B.push([map[b[0]], map[b[1]], b[2]]); });
    return { a: A, b: B, tag: TG, h: k >= 0 ? g.a[k].slice(1) : null };
  };
  /* posición mundial del átomo i de un grupo creado con ctx.mol(geo, {gs}) */
  MSim.wp = function (grp, g, i, gs) { grp.updateMatrixWorld(true); return grp.localToWorld(MSim.vec(g, i).multiplyScalar(gs || 1)); };
  /* coloca el grupo de modo que el átomo i quede en «target» y el resto de la molécula se extienda hacia «away» */
  MSim.dock = function (grp, g, i, target, away, gs) {
    var p = MSim.vec(g, i).multiplyScalar(gs || 1), v = p.clone().negate(); if (v.lengthSq() < 1e-6) v.set(1, 0, 0); v.normalize();
    grp.quaternion.setFromUnitVectors(v, away.clone().normalize()); grp.position.copy(target).sub(p.applyQuaternion(grp.quaternion));
  };
  MSim.stage = function (ctx) {
    var cache = {};
    return {
      begin: function () { Object.keys(cache).forEach(function (k) { cache[k].visible = false; cache[k].quaternion.set(0, 0, 0, 1); }); },
      put: function (key, geo, x, y, z, o) {
        o = o || {}; var g = cache[key];
        if (!g) {
          g = new T.Group(); g.userData.geo = geo; g.userData.gs = o.gs || 1; g.add(ctx.mol(geo, { gs: o.gs || 1, ar: o.ar || 0.46 }));
          (o.halos || []).forEach(function (h) { var i = MSim.idx(geo, h.tag, h.nth); if (i < 0) return; var a = geo.a[i], m = new T.Mesh(new T.SphereGeometry(h.r || 0.7, 18, 12), new T.MeshBasicMaterial({ color: h.color == null ? 0xffffff : h.color, transparent: true, opacity: h.op == null ? 0.38 : h.op, depthWrite: false })); m.position.set(a[1] * (o.gs || 1), a[2] * (o.gs || 1), a[3] * (o.gs || 1)); m.userData.halo = h.kind || 'halo'; g.add(m); });
          ctx.scene.add(g); cache[key] = g;
        }
        g.visible = true; g.position.set(x || 0, y || 0, z || 0); return g;
      },
      get: function (k) { return cache[k]; },
      halos: function (on, kind) { Object.keys(cache).forEach(function (k) { cache[k].children.forEach(function (c) { if (c.userData.halo && (!kind || c.userData.halo === kind)) c.visible = on; }); }); }
    };
  };
  MSim.arrow = function (ctx, color) {
    var grp = new T.Group(), mat = new T.MeshBasicMaterial({ color: color || 0xff7a3d }), mesh = null, head = new T.Mesh(new T.ConeGeometry(0.17, 0.4, 12), mat), dot = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), new T.MeshBasicMaterial({ color: 0xffeb3b })), curve = null, key = '';
    grp.add(head); grp.add(dot); ctx.scene.add(grp); grp.visible = false;
    return {
      group: grp,
      set: function (p0, p1, bend, on) {
        grp.visible = !!on; if (!on) return;
        var k = [p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, bend.x, bend.y, bend.z].map(function (v) { return v.toFixed(2); }).join();
        if (k !== key) {
          key = k; if (mesh) { mesh.geometry.dispose(); grp.remove(mesh); }
          var mid = p0.clone().add(p1).multiplyScalar(0.5).add(bend); curve = new T.QuadraticBezierCurve3(p0, mid, p1);
          mesh = new T.Mesh(new T.TubeGeometry(curve, 16, 0.05, 6, false), mat); grp.add(mesh);
          var tan = p1.clone().sub(curve.getPoint(0.9)).normalize(); head.position.copy(p1).addScaledVector(tan, -0.15); head.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan);
        }
      },
      tick: function (now) { if (grp.visible && curve) dot.position.copy(curve.getPoint((now * 0.7) % 1)); }
    };
  };
})();


(function () {
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var M = {
    propano: { n: "Propane", f: 'CH₃CH₂CH₃', s: 'CCC', M: 44.1, bp: -42, mu: 0.08, cl: 'alcano', don: 0, acc: 0 },
    dme: { n: "Dimethyl ether", f: 'CH₃OCH₃', s: 'CO{o}C', M: 46.07, bp: -24.8, mu: 1.3, cl: 'éter', don: 0, acc: 1, k: 'O' },
    etoh: { n: "Ethanol", f: 'CH₃CH₂OH', s: 'CCO{o+}', M: 46.07, bp: 78.4, mu: 1.69, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    proh: { n: 'Propan-1-ol', f: 'CH₃CH₂CH₂OH', s: 'CCCO{o+}', M: 60.1, bp: 97.2, mu: 1.68, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    pram: { n: "Propylamine", f: 'CH₃CH₂CH₂NH₂', s: 'CCCN{o+}', M: 59.11, bp: 47.8, mu: 1.17, cl: "1° amine", don: 2, acc: 1, k: 'N' },
    dma: { n: "Dimethylamine", f: '(CH₃)₂NH', s: 'CN{o+}C', M: 45.08, bp: 7, mu: 1.03, cl: "2° amine", don: 1, acc: 1, k: 'N' },
    tma: { n: "Trimethylamine", f: '(CH₃)₃N', s: 'CN{o}(C)C', M: 59.11, bp: 2.9, mu: 0.61, cl: "3° amine", don: 0, acc: 1, k: 'N' },
    nh3: { n: "Ammonia", f: 'NH₃', s: 'N{o+}', M: 17.03, bp: -33.3, mu: 1.47, cl: "ammonia", don: 3, acc: 1, k: 'N' },
    mea: { n: "Methylamine", f: 'CH₃NH₂', s: 'CN{o+}', M: 31.06, bp: -6.3, mu: 1.31, cl: "1° amine", don: 2, acc: 1, k: 'N' },
    anil: { n: "Aniline", f: 'C₆H₅NH₂', s: 'N{o+}Ph', M: 93.13, bp: 184, mu: 1.53, cl: "aromatic amine", don: 2, acc: 1, k: 'N' },
    c1: { n: "Methanol", f: 'CH₃OH', s: 'CO{o+}', M: 32.04, bp: 64.7, mu: 1.7, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c4: { n: 'Butan-1-ol', f: 'C₄H₉OH', s: 'CCCCO{o+}', M: 74.12, bp: 117.7, mu: 1.66, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c5: { n: 'Pentan-1-ol', f: 'C₅H₁₁OH', s: 'CCCCCO{o+}', M: 88.15, bp: 138, mu: 1.7, cl: 'alcohol', don: 1, acc: 1, k: 'O' },
    c6: { n: 'Hexan-1-ol', f: 'C₆H₁₃OH', s: 'CCCCCCO{o+}', M: 102.2, bp: 157, mu: 1.65, cl: 'alcohol', don: 1, acc: 1, k: 'O' }
  }, G = {};
  Object.keys(M).forEach(function (k) { G[k] = MSim.build(M[k].s); });
  var AL = ['c1', 'etoh', 'proh', 'c4', 'c5', 'c6'], SOL = { c1: 100, etoh: 100, proh: 100, c4: 7.4, c5: 2.2, c6: 0.59 };
  var PK = { nh3: 9.25, mea: 10.62, dma: 10.73, tma: 9.8, anil: 4.6 };
  var S = { a: 'etoh', b: 'etoh', dimer: false, q: 0, hp: false, _st: -1 }, lab = {}, SG, prot, hbs = [], NH = 9;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Polarity", "Polarity", "C–O and C–N are polar bonds: alcohols, ethers and amines have a dipole moment",
        "<p>O (χ = 3.5) and N (3.0) are more electronegative than C (2.5): the C–O, C–N, O–H and N–H bonds are <b>polar</b> and the molecules have a <b>dipole moment</b> (μ): propane 0.08 D · dimethyl ether 1.30 D · ethanol 1.69 D · propylamine 1.17 D. Dipole–dipole intermolecular forces explain much of their properties; but the most important factor is the ability to form <b>hydrogen bonds</b>.</p>"],
      ["Hydrogen bonds", "H bonds", "Donor: O–H or N–H · acceptor: lone pair on O or N",
        "<p>A <b>hydrogen bond</b> links an H attached to O or N (<b>donor</b>) with the lone pair of another O or N (<b>acceptor</b>); the energy is ≈ 15–30 kJ/mol, between a covalent bond and dispersion forces. <b>Alcohols</b> are donors and acceptors; <b>1° and 2° amines</b> too (weaker because N is less electronegative); <b>ethers</b> and <b>3° amines</b> are only <b>acceptors</b> and do not associate with each other.</p>"],
      ["Boiling points", "Boiling point", "Alcohol ≫ amine ≫ ether ≈ alkane of similar mass",
        "<p>For similar molar masses (≈ 46 g/mol): <b>propane −42 °C</b> (dispersion only) · <b>dimethyl ether −25 °C</b> (dipole) · <b>ethanol +78 °C</b> (strong H bonds). 1° and 2° amines boil between ethers and alcohols: <b>propylamine (48 °C)</b> versus propan-1-ol (97 °C). <b>Trimethylamine (3 °C)</b>, with no N–H, boils much lower than its isomers.</p>"],
      ["Water solubility", "Solubility", "The –OH group is hydrophilic; the alkyl chain, hydrophobic",
        "<p>The polar group forms H bonds with water (hydrophilic), whereas the hydrocarbon chain (hydrophobic) breaks them without compensation. Result: <b>methanol, ethanol and propan-1-ol</b> are miscible with water; solubility drops to <b>7.4 g/100 mL</b> (butanol), <b>2.2</b> (pentanol), <b>0.6</b> (hexanol). Low-weight amines are soluble; those with more than 6 C, little.</p>"],
      ["Amine basicity", "Basicity", "The N lone pair accepts H⁺: R₃N + H⁺ ⇌ R₃NH⁺",
        "<p>Amines are <b>weak bases</b> and <b>nucleophiles</b> thanks to the lone pair on N. Strength is compared with the <b>pKa of the conjugate acid</b> (pKaH): NH₃ 9.25 · CH₃NH₂ 10.62 · (CH₃)₂NH 10.73 · (CH₃)₃N 9.80. Alkyl groups <b>donate electrons</b> and stabilize the cation; in aqueous phase the 3° amine loses out through solvation and hindrance. <b>Aniline</b> (pKaH 4.6) is much less basic because the lone pair is delocalized into the ring.</p>"],
      ["Comparative reactivity", "Reactivity", "Alcohol: weak acid, nucleophile, dehydratable · ether: inert · amine: base and nucleophile",
        "<p>The <b>alcohol</b> is a very weak acid (pKa ≈ 16), is oxidized, dehydrates with H₂SO₄ and its OH is substituted with HX (protonated as a good leaving group). The <b>ether</b> is hardly reactive (that is why it is used as a solvent) and is only cleaved by concentrated HI/HBr. The <b>amine</b> is a base and nucleophile: it is alkylated, acylated and forms salts. Compare them in the “Graphs” matrix.</p>"]
    ];
  }
  function hIdx(g) { for (var i = 0; i < g.a.length; i++) { if (g.a[i][0] === 'H' && g.tag[i] === 'o') return i; } return -1; }
  var SEG = [['propano', 'dme', 'etoh', 'pram'], ['etoh', 'pram', 'dme', 'tma'], ['propano', 'dme', 'pram', 'etoh'], AL, ['nh3', 'mea', 'dma', 'tma', 'anil'], ['etoh', 'dme', 'dma']];
  var def = {
    key: 'alcoholes-eteres-aminas', title: "Alcohols, Ethers and Amines", subtitle: "3D simulator · organic chemistry", accent: { dark: '#4ade80', light: '#15803d' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 3, 17], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 0.5, 17], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 17, 2], target: [0, 0, 0] }],
    layers: [{ id: 'halo', label: "Polar zone (O/N)", icon: '◎' }, { id: 'hb', label: "H bond", icon: '┄' }],
    build: function (ctx) {
      SG = MSim.stage(ctx);
      Object.keys(M).forEach(function (k) { SG.put(k, G[k], 0, 0, 0, { gs: 1.2, halos: M[k].k ? [{ tag: 'o', r: 0.8 }] : [] }); SG.put(k + 'B', G[k], 0, 0, 0, { gs: 1.2, halos: [] }); });
      var sg = new T.SphereGeometry(0.11, 8, 6), mt = new T.MeshBasicMaterial({ color: 0xffd43b }); for (var i = 0; i < NH; i++) { var m = new T.Mesh(sg, mt); m.visible = false; ctx.scene.add(m); hbs.push(m); }
      prot = new T.Mesh(new T.SphereGeometry(0.28, 14, 10), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xaa8800 })); ctx.scene.add(prot);
      ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local, sq = SEG[i], n = sq.length, ix = Math.min(n - 1, Math.floor(l * n)); S._st = i; S.a = sq[ix]; S.dimer = i === 1; S.hp = false; S.q = sm(((l * n) % 1));
        if (i === 1) { var pairs = [['etoh', 'etoh'], ['pram', 'pram'], ['dme', 'etoh'], ['tma', 'tma']]; S.a = pairs[ix][0]; S.b = pairs[ix][1]; }
      }
      var m = M[S.a]; SG.begin(); var gs = 1.2, halo = ctx.layer('halo'), hbOn = ctx.layer('hb') && S.dimer, nShow = 0;
      hbs.forEach(function (h) { h.visible = false; }); prot.visible = false;
      if (S.dimer) {
        var gA = SG.put(S.a, G[S.a], -4.5, 0, 0, { gs: gs }), hi = hIdx(G[S.a]);
        gA.rotation.set(0, 0, 0); gA.updateMatrixWorld(true);
        var oA = MSim.idx(G[S.a], 'o', 0), hA = hi >= 0 ? hi : oA, pO = MSim.wp(gA, G[S.a], oA, gs), pH = MSim.wp(gA, G[S.a], hA, gs), d = pH.clone().sub(pO).normalize();
        var bk = S.b + 'B', gB = SG.put(bk, G[S.b], 4.5, 0, 0, { gs: gs }), oB = MSim.idx(G[S.b], 'o', 0), tgt = pH.clone().addScaledVector(d, 1.9 * 0.85);
        if (hi >= 0) { MSim.dock(gB, G[S.b], oB, tgt, d, gs); }
        gA.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; }); gB.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; });
        if (hbOn && hi >= 0) { for (var k = 0; k < NH; k++) { var u = (k + 0.5) / NH, p = pH.clone().lerp(tgt, u); p.y += 0.05 * Math.sin(now * 6 + k); hbs[k].position.copy(p); hbs[k].visible = true; hbs[k].scale.setScalar(0.9 + 0.5 * Math.sin(now * 5 - k)); } }
        lab.t.pos(0, 5.5, 0).set(hi >= 0 ? M[S.a].n + ' · · · ' + M[S.b].n : M[S.a].n + " (no N–H/O–H donor)", 'bl-lead').vis(true);
        lab.a.pos(0, -4.3, 0).set(hi >= 0 ? "H bond  O–H···" + (M[S.b].k || 'O') + '  ≈ ' + (M[S.a].k === 'N' ? '10–20' : '20–30') + ' kJ/mol' : "dipole–dipole only: it forms no hydrogen bonds with itself", hi >= 0 ? 'bl-pos' : 'bl-warn').vis(true);
        lab.b.pos(0, -5.3, 0).set("b.p. " + M[S.a].bp + " °C · donors: " + M[S.a].don + " · acceptors: " + M[S.a].acc, 'bl-d').vis(true);
      } else {
        var g = SG.put(S.a, G[S.a], 0, 0, 0, { gs: gs * 1.15 }); g.children.forEach(function (c) { if (c.userData.halo) c.visible = halo; }); g.scale.setScalar(1);
        if (f && f.i === 4 || (P.manual && S.hp)) { var nI = MSim.idx(G[S.a], 'o', 0), pn = MSim.wp(g, G[S.a], nI, gs * 1.15); var far = pn.clone().add(new T.Vector3(0, 4.2, 0)); prot.position.lerpVectors(far, pn.clone().add(new T.Vector3(0, 0.95, 0)), S.q); prot.visible = true; }
        lab.t.pos(0, 5.4, 0).set(m.n + ' · ' + m.f, 'bl-lead').vis(true);
        lab.a.pos(0, -4.0, 0).set(m.cl + ' · μ = ' + f2(m.mu) + ' D · M = ' + f1(m.M) + " g/mol", 'bl-d').vis(true);
        var extra = (f && f.i === 4) || S.hp ? 'pKaH = ' + (PK[S.a] != null ? PK[S.a] : '—') : (f && f.i === 3) || AL.indexOf(S.a) >= 0 && f && f.i === 3 ? 'solubilidad: ' + (SOL[S.a] >= 100 ? 'miscible' : SOL[S.a] + ' g/100 mL') : "b.p. " + m.bp + " °C · donors " + m.don + " · acceptors " + m.acc;
        lab.b.pos(0, -5.0, 0).set(extra, 'bl-pos').vis(true);
      }
      lab.c.vis(false); lab.d.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.a) u.a.set(S.a); if (u.b) u.b.set(S.b); },
    hud: function () { var m = M[S.a]; return { eq: { chip: 'R–X', name: m.n, body: "<div class=\"eqline\"><small>Class</small>" + m.cl + '</div><div class="eqline"><small>μ</small>' + f2(m.mu) + " D</div><div class=\"eqline\"><small>b.p.</small>" + m.bp + " °C</div><div class=\"eqline\"><small>Donors / acceptors</small>" + m.don + ' / ' + m.acc + '</div>' }, legend: [{ label: 'Halo', color: '#ffd43b', text: "polar zone (O or N)" }, { label: '···', color: '#ffd43b', text: "hydrogen bond" }] }; },
    measures: function () { var m = M[S.a]; return [["Compound", m.n], ["Class", m.cl], ["Molar mass", f1(m.M) + " g/mol"], ["Dipole moment", f2(m.mu) + ' D'], ["Boiling point", m.bp + ' °C'], ["H donors / acceptors", m.don + ' / ' + m.acc], ['pKaH', PK[S.a] != null ? String(PK[S.a]) : '—']]; },
    ideas: ["<b>H bond</b>: H–O/N···:O/N. Alcohol and 1°/2° amine: donor and acceptor.", "Ether and 3° amine: acceptors only.", "b.p.: alcohol ≫ amine ≫ ether ≈ alkane.", "The alkyl chain reduces water solubility.", "Amine: base and nucleophile (N lone pair)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Compound"); el.appendChild(c);
      ui.a = kit.ui.options({ label: "Molecule (donor)", cols: 3, value: S.a, options: Object.keys(M).map(function (k) { return { v: k, label: M[k].n, sub: M[k].cl }; }), onChange: function (v) { ctx.goManual(); S.a = v; S.q = 0; } }); c.appendChild(ui.a);
      ui.b = kit.ui.options({ label: "Molecule (acceptor, in dimer)", cols: 3, value: S.b, options: ['etoh', 'pram', 'dme', 'tma', 'nh3'].map(function (k) { return { v: k, label: M[k].n, sub: M[k].cl }; }), onChange: function (v) { ctx.goManual(); S.b = v; S.dimer = true; } }); c.appendChild(ui.b);
      c.appendChild(ctx.btnRow([{ t: "Form H bond", primary: true, fn: function () { ctx.goManual(); S.dimer = true; } }, { t: "Single molecule", fn: function () { ctx.goManual(); S.dimer = false; S.hp = false; } }, { t: "Bring in H⁺", fn: function () { ctx.goManual(); S.dimer = false; S.hp = true; S.q = 0; var t0 = performance.now(); (function s() { var k = Math.min(1, (performance.now() - t0) / 2200); S.q = sm(k); if (k < 1) requestAnimationFrame(s); })(); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Boiling point versus molar mass", h: 240, note: "For similar masses, the ability to form H bonds raises the b.p. (alcohol ≫ amine ≫ ether/alkane).", draw: function (cx, w, h, col) {
        var keys = Object.keys(M).filter(function (k) { return AL.indexOf(k) < 0 || true; }), L = 44, Rr = 12, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (v) { return L + pw * v / 110; }, sy = function (v) { return Tp + ph - ph * (v + 60) / 260; }, i;
        cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; for (i = -50; i <= 200; i += 50) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 5, sy(i) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 100; i += 25) cx.fillText(i, sx(i), h - B + 13); cx.fillText("M (g/mol)  ·  b.p. (°C)", L + pw / 2, h - 4);
        var cc = { alcohol: '#4ade80', éter: '#4dabf7', alcano: '#adb5bd' }; keys.forEach(function (k) { var m = M[k], c = m.cl === 'alcohol' ? cc.alcohol : (m.cl === 'éter' ? cc['éter'] : (m.cl === 'alcano' ? cc.alcano : '#ff922b')); cx.fillStyle = c; cx.beginPath(); cx.arc(sx(m.M), sy(m.bp), k === S.a ? 6.5 : 4, 0, 7); cx.fill(); if (k === S.a) { cx.strokeStyle = col.ink; cx.stroke(); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(m.n, sx(m.M) + 8, sy(m.bp) - 5); } });
        cx.textAlign = 'left'; [['alcohol', '#4ade80'], ['ether', '#4dabf7'], ['alkane', '#adb5bd'], ['amine', '#ff922b']].forEach(function (a, k) { cx.fillStyle = a[1]; cx.fillText('● ' + a[0], L + 6 + k * 62, Tp + 8); });
      } },
      { title: "Water solubility of alcohols", h: 210, note: "log₁₀ of g/100 mL (miscible = 2). The hydrophobic chain reduces solubility.", draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / AL.length, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = -1; i <= 2; i++) { var y = Tp + ph - ph * (i + 1) / 3; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; AL.forEach(function (k, j) { var v = Math.log10(Math.min(100, SOL[k])), hh = ph * (v + 1) / 3; cx.fillStyle = k === S.a ? '#ff6b3d' : '#4ade80'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText('C' + (j + 1), L + j * bw + bw / 2, h - B + 13); });
      } },
      { title: "Basicity (pKaH) of amines", h: 190, note: "pKa of the conjugate acid R₃NH⁺: higher value = stronger base.", draw: function (cx, w, h, col) {
        var ks = ['nh3', 'mea', 'dma', 'tma', 'anil'], L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ks.length, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 12; i += 4) { var y = Tp + ph - ph * i / 12; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; ks.forEach(function (k, j) { var hh = ph * PK[k] / 12; cx.fillStyle = k === S.a ? '#ff6b3d' : '#4ade80'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.ink; cx.fillText(PK[k], L + j * bw + bw / 2, Tp + ph - hh - 4); cx.fillStyle = col.muted; cx.fillText(M[k].f.replace(/C₆H₅NH₂/, 'PhNH₂'), L + j * bw + bw / 2, h - B + 13); });
      } },
      { title: "Reactivity: matrix", h: 190, note: "✓ reacts · — does not react under normal conditions.", draw: function (cx, w, h, col) {
        var rows = ["Acid (Na, base)", 'HX → R–X', "Dehydration H₂SO₄", "Oxidation [O]", "Alkylation / acylation", "Protonation (H⁺)"], cols = ['alcohol', 'ether', 'amine'], T2 = [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1]], L = 130, Tp = 22, cw = (w - L - 6) / 3, rh = (h - Tp - 6) / rows.length;
        cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted; cols.forEach(function (c, j) { cx.fillText(c, L + j * cw + cw / 2, 14); }); rows.forEach(function (r, i) { cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.fillText(r, L - 6, Tp + i * rh + rh / 2 + 3); cols.forEach(function (c, j) { cx.fillStyle = T2[i][j] ? 'rgba(74,222,128,.7)' : 'rgba(134,142,150,.25)'; cx.fillRect(L + j * cw + 2, Tp + i * rh + 2, cw - 4, rh - 4); cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(T2[i][j] ? '✓' : '—', L + j * cw + cw / 2, Tp + i * rh + rh / 2 + 3); }); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = M[S.a], extra = '';
      if (PK[S.a] != null) { var pk = PK[S.a], Kb = Math.pow(10, -(14 - pk)); extra = "<div class=\"calc-step\">Basicity</div><table class=\"calc-table\">" + row('pKaH', pk) + row('Ka (R₃NH⁺)', MSim.sci(Math.pow(10, -pk), 2)) + row('pKb', f2(14 - pk)) + row('Kb', MSim.sci(Kb, 2)) + '</table>'; }
      return '<div class="card-kicker">' + m.n + ' · ' + m.cl + '</div><table class="calc-table">' + row("Molar mass", f1(m.M) + " g/mol") + row('μ', f2(m.mu) + ' D') + row("b.p.", m.bp + ' °C') + row("H bonds", "donors " + m.don + " · acceptors " + m.acc + (m.don ? '' : " → does not self-associate")) + row("Max. bonds per molecule", m.don + m.acc * 2 + " (with water)") + '</table>' + extra;
    },
    quiz: [
      { q: "Which boils at the higher temperature?", options: ["Ethanol", "Dimethyl ether", "Propane", "Trimethylamine"], answer: 0, why: "Ethanol: intermolecular H bonds." },
      { q: "Ethers do not form H bonds with themselves because…", options: ["they have no O–H", "they have no O", "they are nonpolar", "they have N"], answer: 0, why: "They are acceptors only." },
      { q: "Among the amines, the least basic is…", options: ["aniline", "dimethylamine", "methylamine", "ammonia"], answer: 0, why: "The lone pair is delocalized into the ring (pKaH 4.6)." },
      { q: "The solubility of alcohols in water…", options: ["decreases as the chain gets longer", "increases with the chain", "is independent", "is nil"], answer: 0, why: "The hydrophobic chain weighs more." },
      { q: "An N–H···N hydrogen bond is…", options: ["weaker than O–H···O", "stronger than O–H···O", "covalent", "nonexistent"], answer: 0, why: "N is less electronegative." },
      { q: "The C–O bond of the ether is…", options: ['polar', "nonpolar", "ionic", "metallic"], answer: 0, why: "Electronegativity difference of 1.0." },
      { q: "Which one can NOT be an H donor?", options: ["Trimethylamine", "Ethanol", "Propylamine", "Water"], answer: 0, why: "It has no N–H." },
      { q: "pKaH measures…", options: ["the acidity of the conjugate acid of the amine", "the acidity of the amine", "the pH of water", "the solubility"], answer: 0, why: "The higher the pKaH, the stronger the base." }
    ],
    help: { intro: "Choose the molecule (donor) and the partner (acceptor); “Form H bond” couples them. In the lesson, “Bring in H⁺” shows the protonation of N.", items: [['Polar zones', 'the yellow halo marks the O or N with lone pairs.'], ['Hydrogen bond', 'the dotted line ··· is the H–O/N···:O/N bond between the two molecules.'], ['Controls', '“Molecule (donor)” and “Molecule (acceptor, in dimer)”; “Form H bond” brings them together and “Single molecule” separates them. In the lesson, “Bring in H⁺” protonates the N.'], ['Charts', 'boiling point versus molar mass, water solubility of alcohols, basicity (pKaH) of amines and the reactivity matrix.']], try: ['Pick an ether as donor: it cannot form an H bond because it has no O–H.', 'Compare an alcohol, an amine and an alkane of similar mass on the chart: b.p. alcohol ≫ amine ≫ alkane.', 'Check the solubility of alcohols: it drops as the chain gets longer.'] }
  };
  MSim.create(def);
})();
