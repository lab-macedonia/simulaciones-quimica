/* Reacción de Diels–Alder — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;


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
          (o.halos || []).forEach(function (h) { var i = MSim.idx(geo, h.tag, h.nth); if (i < 0) return; var a = geo.a[i], m = new T.Mesh(new T.SphereGeometry(h.r || 0.7, 18, 12), new T.MeshBasicMaterial({ color: h.color, transparent: true, opacity: h.op == null ? 0.38 : h.op, depthWrite: false })); m.position.set(a[1] * (o.gs || 1), a[2] * (o.gs || 1), a[3] * (o.gs || 1)); m.userData.halo = h.kind || 'halo'; g.add(m); });
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
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, DEG = Math.PI / 180;
  var DP = {
    eteno: { n: "Ethene", f: 'CH₂=CH₂', sub: null, lumo: 0.82, tip: "Unsubstituted dienophile: poorly reactive; it requires heat and pressure (≈ 200 °C)." },
    acroleina: { n: "Propenal (acrolein)", f: 'CH₂=CH–CHO', sub: 'cho', lumo: 0.55, tip: "The C=O group withdraws electrons and lowers the LUMO of the dienophile: it reacts at much lower temperatures." },
    acrilonitrilo: { n: "Propenenitrile (acrylonitrile)", f: 'CH₂=CH–C≡N', sub: 'cn', lumo: 0.6, tip: "The cyano group (−M, −I) also lowers the LUMO and activates the dienophile." }
  };
  var S = { q: 0, phi: 0, dp: 'eteno', mode: 'endo', Tk: 298, fmo: false, si: 0, run: false }, atoms = [], bonds = [], grp = null, lobes = [], key_ = '', lab = {}, arr = [];
  var DH = -168, DS = -148;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function rotY(v, a) { return v.clone().applyAxisAngle(V(0, 1, 0), a); }
  function build() {
    atoms = []; bonds = [];
    var C1 = V(-1.484, 0, 1.111), C2 = V(-0.735, 0, 0), C3 = V(0.735, 0, 0), C4 = V(1.484, 0, 1.111), H = 1.09;
    function add(el, p, kind, grp_) { atoms.push({ el: el, p: p.clone(), kind: kind, g: grp_ || 0 }); return atoms.length - 1; }
    var i1 = add('C', C1, 'd', 1), i2 = add('C', C2, 'd', 0), i3 = add('C', C3, 'd', 0), i4 = add('C', C4, 'd', 4);
    function terminal(Ci, Cn, idx, gp) { var d = Cn.clone().sub(Ci).normalize(); [2, -2].forEach(function (s) { var h = add('H', Ci.clone().addScaledVector(rotY(d, s * Math.PI / 3), H), 'd', gp); bonds.push([idx, h, 1, 1]); }); }
    terminal(C1, C2, i1, 1); terminal(C4, C3, i4, 4);
    [[C2, C1, C3, i2], [C3, C2, C4, i3]].forEach(function (a) { var d = a[1].clone().sub(a[0]).normalize().add(a[2].clone().sub(a[0]).normalize()).negate().normalize(); var h = add('H', a[0].clone().addScaledVector(d, H), 'd', 0); bonds.push([a[3], h, 1, 1]); });
    bonds.push([i1, i2, 2, 1], [i2, i3, 1, 2], [i3, i4, 2, 1]);
    // dienófilo (coordenadas locales respecto de su centro)
    var dp = DP[S.dp], endo = S.mode === 'endo', sg = endo ? -1 : 1;
    var ia = add('C', V(-0.67, 0, 0), 'p', 0), ib = add('C', V(0.67, 0, 0), 'p', 0); bonds.push([ia, ib, 2, 1]);
    [[ia, V(-0.67, 0, 0), V(1, 0, 0)]].forEach(function (a) { [2, -2].forEach(function (s) { var d = rotY(a[2], s * Math.PI / 3), h = add('H', a[1].clone().addScaledVector(d, H), 'p', 0); bonds.push([a[0], h, 1, 1]); }); });
    var bp = V(0.67, 0, 0), dEw = V(0.5, 0, 0.866 * sg), dH = V(0.5, 0, -0.866 * sg);
    if (!dp.sub) { var hb1 = add('H', bp.clone().addScaledVector(dEw, H), 'p', 0), hb2 = add('H', bp.clone().addScaledVector(dH, H), 'p', 0); bonds.push([ib, hb1, 1, 1], [ib, hb2, 1, 1]); }
    else {
      var hb = add('H', bp.clone().addScaledVector(dH, H), 'p', 0); bonds.push([ib, hb, 1, 1]);
      if (dp.sub === 'cho') { var cp = bp.clone().addScaledVector(dEw, 1.48), ic = add('C', cp, 'p', 0); bonds.push([ib, ic, 1, 1]); var back = dEw.clone().negate(), od = rotY(back, 2 * Math.PI / 3 * (sg)), hd = rotY(back, -2 * Math.PI / 3 * (sg)), io = add('O', cp.clone().addScaledVector(od, 1.22), 'p', 0), ih = add('H', cp.clone().addScaledVector(hd, H), 'p', 0); bonds.push([ic, io, 2, 2], [ic, ih, 1, 1]); }
      else { var c1 = bp.clone().addScaledVector(dEw, 1.43), ic2 = add('C', c1, 'p', 0), n1 = add('N', c1.clone().addScaledVector(dEw, 1.16), 'p', 0); bonds.push([ib, ic2, 1, 1], [ic2, n1, 3, 3]); }
    }
    bonds.push([i1, ia, 0, 1], [i4, ib, 0, 1]); S.ia = ia; S.ib = ib; S.i1 = i1; S.i4 = i4;
  }
  function pos(i, q, phi, dy) {
    var a = atoms[i], p = a.p.clone(), e = sm(q);
    if (a.kind === 'd') {
      if (a.g === 4) { var y = p.y * Math.cos(phi) + p.z * Math.sin(phi), z = -p.y * Math.sin(phi) + p.z * Math.cos(phi); p.y = y; p.z = z; }
      if (a.g === 1 || (a.g === 4)) p.y += 0.25 * e * Math.cos(phi / 2 > 1.4 ? 0 : 0.0 + 0) * (phi < 0.9 ? 1 : 0);
      return p;
    }
    var dx = (a.p.x < 0 ? -0.1 : 0.1) * e; return V(p.x + dx, dy, p.z + 1.111);
  }
  function rebuild(ctx) {
    if (grp) ctx.scene.remove(grp); grp = new T.Group(); build(); var E = MSim.EL;
    atoms.forEach(function (a) { var d = E[a.el] || [0xcccccc, 1], m = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshStandardMaterial({ color: d[0], roughness: 0.4 })); m.scale.setScalar(d[1] * 0.42); grp.add(m); a.m = m; });
    var cg = new T.CylinderGeometry(1, 1, 1, 8, 1, true);
    bonds.forEach(function (b) { b.cs = []; for (var k = 0; k < 2; k++) { var m = new T.Mesh(cg, new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5, transparent: true })); grp.add(m); b.cs.push(m); } });
    lobes = []; var sg = new T.SphereGeometry(1, 16, 12); [S.i1, S.i4, 1, 2, S.ia, S.ib].forEach(function (i) { for (var s = 0; s < 2; s++) { var m = new T.Mesh(sg, new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false })); m.userData = { i: i, s: s }; grp.add(m); lobes.push(m); } });
    ctx.scene.add(grp); key_ = S.dp + '|' + S.mode;
  }
  var HOMO = { 0: 0.6, 1: 0.37, 2: -0.37, 3: -0.6 }, LUMO = {};
  function stages() {
    return [
      ["Diene and dienophile", "Reactants", "The diene must be in the s-cis conformation to react",
        "<p>The <b>Diels–Alder reaction</b> forms a six-membered ring from a <b>conjugated diene</b> (4 π electrons) and a <b>dienophile</b> (2 π electrons): a <b>[4+2]</b> cycloaddition. The diene only reacts in the <b>s-cis</b> conformation (the two ends of the diene facing each other, at ≈ 3 Å); in the more stable <b>s-trans</b>, the ends are far apart. Rotation about the C2–C3 bond (≈ 16 kJ/mol barrier) is fast at room temperature.</p>"],
      ["Concerted mechanism", "Mechanism", "Three electron pairs move at once: 2 new σ bonds and a new π bond",
        "<p>The reaction is <b>concerted</b> and <b>synchronous</b>: in a single cyclic transition state the two C–C σ bonds form, the C1=C2 double bond and that of the dienophile become single, and a <b>new C=C between C2 and C3</b> appears. The approach is <b>suprafacial</b>: the dienophile approaches one face of the diene. 2 π bonds break and 2 σ bonds form: <b>ΔH ≈ −168 kJ/mol</b> (butadiene + ethene → cyclohexene).</p>"],
      ["Frontier orbitals", "Orbitals", "HOMO of the diene + LUMO of the dienophile: the phase matches at both ends",
        "<p>The reaction is allowed by orbital symmetry: the <b>HOMO of the diene (ψ₂)</b> and the <b>LUMO of the dienophile (π*)</b> have the same phase at the two pairs of atoms that bond (C1···Ca and C4···Cb): <b>constructive overlap at both ends</b>. The blue and red lobes indicate the phases. HOMO(dienophile)–LUMO(diene) overlap would also be possible, but with a larger energy gap.</p>"],
      ["Substituents and reactivity", "Substituents", "A dienophile with electron-withdrawing groups reacts much faster",
        "<p>In the <b>normal-demand</b> Diels–Alder the dominant interaction is HOMO(diene)–LUMO(dienophile). An <b>electron-withdrawing</b> group on the dienophile (C=O, C≡N, NO₂) <b>lowers the LUMO</b> and reduces the gap, and a <b>donor</b> group on the diene (OR, alkyl) <b>raises the HOMO</b>. Compare in “Graphs”: ethene barely reacts; with propenal or propenenitrile the reaction is much easier.</p>"],
      ["Endo rule", "Endo / exo", "The dienophile substituent usually ends up under the diene (endo)",
        "<p>If the dienophile substituent is placed <b>under the diene</b> (<b>endo</b>) or <b>away</b> (<b>exo</b>), different stereoisomers are obtained. In most cases the kinetic product is the <b>endo</b>, due to <b>secondary orbital interactions</b> between the π system of the substituent (C=O) and carbons C2 and C3 of the diene. The exo is usually more stable thermodynamically because of less steric hindrance.</p>"],
      ["Thermodynamics and retro-Diels–Alder", 'ΔG(T)', "Favorable at low T; at very high T it reverses (retro-Diels–Alder)",
        "<p>With <b>ΔH ≈ −168 kJ/mol</b> and <b>ΔS ≈ −148 J/(mol·K)</b> (freedom is lost when two molecules join into one), <b>ΔG = ΔH − TΔS</b> is very negative at room temperature. But at high temperatures the −TΔS term gains weight until ΔG = 0 (≈ 1135 K under standard conditions): the <b>retro-Diels–Alder</b> becomes favorable and is a way to generate dienes (e.g. cracking of cyclopentadiene from its dimer).</p>"]
    ];
  }
  var def = {
    key: 'diels-alder', title: "Diels–Alder reaction", subtitle: "3D simulator · organic chemistry", accent: { dark: '#60a5fa', light: '#1d4ed8' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [6, 5, 9], target: [0, 1.2, 1]}, { id: 'frontal', label: "Front", pos: [0, 2, 12], target: [0, 1.2, 1] }, { id: 'sup', label: "Top", pos: [0, 13, 3], target: [0, 1, 1] }, { id: 'lado', label: "Side", pos: [12, 2, 1], target: [0, 1.2, 1] }],
    layers: [{ id: 'orb', label: "p / frontier orbitals", icon: '☁' }, { id: 'arrows', label: "Arrows", icon: '↷' }],
    build: function (ctx) { ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); for (var i = 0; i < 3; i++) arr.push(MSim.arrow(ctx, 0xff7a3d)); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) {
        var i = f.i, l = f.local; S.si = i;
        if (S._st !== i) { S._st = i; S.dp = i === 4 ? 'acroleina' : 'eteno'; S.mode = 'endo'; S.fmo = i === 2; }
        if (i === 0) { S.phi = 180 * DEG * (1 - sm(l / 0.6)); S.q = 0; }
        else if (i === 1) { S.phi = 0; S.q = l; }
        else if (i === 2) { S.phi = 0; S.q = 0.2; }
        else if (i === 3) { S.phi = 0; S.q = 0.2 + 0.8 * l; var ks = ['eteno', 'acroleina', 'acrilonitrilo'], k = ks[Math.min(2, Math.floor(l * 3))]; if (S.dp !== k) S.dp = k; }
        else if (i === 4) { S.phi = 0; S.q = 0.25 + 0.75 * (l * 2 % 1); var m = l < 0.5 ? 'endo' : 'exo'; if (S.mode !== m) S.mode = m; }
        else { S.phi = 0; S.q = 1; S.Tk = 300 + 900 * l; }
      } else if (S.run) { S.q += dt / 6; if (S.q >= 1) { S.q = 1; S.run = false; } }
      if (S.dp + '|' + S.mode !== key_) rebuild(ctx);
      var q = S.q, e = sm(q), dy = 3.6 - 1.85 * e, phi = S.phi;
      atoms.forEach(function (a, i) { a.m.position.copy(pos(i, q, phi, dy)); });
      var P = function (i) { return atoms[i].m.position; };
      bonds.forEach(function (b) {
        var p = P(b[0]), r = P(b[1]), d = r.clone().sub(p), L = d.length(), o = b[2] + (b[3] - b[2]) * e, forming = b[2] === 0; if (L < 1e-6) return;
        var perp = new T.Vector3().crossVectors(d, V(0, 0, 1)); if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0); perp.normalize().multiplyScalar(0.09);
        b.cs.forEach(function (c, k) {
          var w = o >= 3 ? 1 : (k === 0 ? Math.min(1, o) : (k === 1 ? Math.max(0, Math.min(1, o - 1)) : 0)); var off = o > 1.01 ? (k ? 1 : -1) * perp.length() * 0.9 : 0; c.visible = w > 0.02; c.material.opacity = forming ? 0.25 + 0.7 * e : w; c.scale.set(forming ? 0.03 + 0.03 * e : 0.05, L, forming ? 0.03 + 0.03 * e : 0.05);
          c.position.copy(p).add(r).multiplyScalar(0.5).addScaledVector(perp.clone().normalize(), off); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
        });
      });
      var orb = ctx.layer('orb');
      lobes.forEach(function (m) {
        var u = m.userData, i = u.i, co = S.fmo || S.si === 2 ? null : null, show = orb && (S.si === 2 || S.fmo || ctx.P.manual && S.fmo), sgn, mag;
        if (!show) { m.visible = false; return; }
        var dn = (i === S.i1) ? 0.6 : (i === 1 ? 0.37 : (i === 2 ? -0.37 : (i === S.i4 ? -0.6 : 0)));
        if (i === S.i1) { sgn = 1; mag = 0.6; } else if (i === S.i4) { sgn = -1; mag = 0.6; } else if (i === 1) { sgn = 1; mag = 0.37; } else if (i === 2) { sgn = -1; mag = 0.37; } else if (i === S.ia) { sgn = 1; mag = 0.71; } else { sgn = -1; mag = 0.71; }
        var up = (u.s === 0) === (i === S.ia || i === S.ib ? false : true); var s2 = sgn * (u.s ? -1 : 1); var base = P(i); var h = 0.35 + 0.6 * mag;
        m.visible = true; m.material.color.setHex(s2 > 0 ? 0x4dabf7 : 0xff6b5e); m.scale.set(0.42 * (0.4 + mag), 0.55 * (0.4 + mag), 0.42 * (0.4 + mag)); m.position.set(base.x, base.y + (u.s ? -1 : 1) * h, base.z);
      });
      var il = ctx.layer('arrows'), c1 = P(S.i1), c4 = P(S.i4), ca = P(S.ia), cb = P(S.ib), c2 = P(1), c3 = P(2);
      arr.forEach(function (a) { a.group.visible = false; });
      if (S.si === 1 && il && q < 0.6) { arr[0].set(c2.clone().lerp(c1, 0.5).add(V(0, 0.05, 0)), ca.clone().add(V(0, -0.2, 0)), V(-0.3, 0.8, 0.3), true); arr[1].set(c3.clone().lerp(c2, 0.5), c2.clone().lerp(c1, 0.55).add(V(0, 0.1, 0)), V(0, 0.5, -0.4), q > 0.05); arr[2].set(ca.clone().lerp(cb, 0.5), cb.clone().add(V(0, -0.2, 0)).lerp(c4, 0.8), V(0.3, 0.8, 0.3), true); }
      arr.forEach(function (a) { a.tick(ctx.now); });
      var cis = phi < 40 * DEG, dd = DP[S.dp];
      lab.t.pos(0, 6.2, 1.1).set(S.si === 3 ? dd.n + ' (' + dd.f + ')' : "diene + " + dd.n.toLowerCase(), 'bl-lead').vis(true);
      lab.a.pos(0, -1.8, 1.1).set(phi > 1 * DEG && S.si === 0 || ctx.P.manual ? 'dieno: ' + (cis ? "s-cis (can react)" : "s-trans (does not react)") + ' · φ = ' + fmt(phi / DEG, 0) + '°' : "s-cis butadiene", cis ? 'bl-neg' : 'bl-warn').vis(true);
      lab.b.pos(0, -2.9, 1.1).set(q < 0.15 ? "reactants" : (q < 0.85 ? "cyclic transition state ≈ " + fmt(q * 100, 0) + ' %' : "cyclohexene (product)"), 'bl-d').vis(true);
      lab.c.pos(0, dy + 1.5, 1.1).set(dd.n.split(' ')[0] + (S.mode === 'endo' && dd.sub ? ' · endo' : (dd.sub ? ' · exo' : '')), 'bl-d').vis(true); lab.d.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.pg && u.pg.set(S.q); u.ph && u.ph.set(Math.round(S.phi / DEG)); } },
    hud: function () { var d = DP[S.dp]; return { eq: { chip: '[4+2]', name: "butadiene + " + d.n.toLowerCase(), body: "<div class=\"eqline\"><small>Dienophile</small>" + d.f + "</div><div class=\"eqline\"><small>Orientation</small>" + (d.sub ? S.mode : '—') + "</div><div class=\"eqline\"><small>Progress</small>" + fmt(S.q * 100, 0) + ' %</div><div class="eqline"><small>ΔH (eteno + butadieno)</small>≈ −168 kJ/mol</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "+ phase of the p orbital" }, { label: "Red", color: '#ff6b5e', text: "− phase" }, { label: "Arrow", color: '#ff7a3d', arrow: true, text: "e⁻ pair" }] }; },
    measures: function () { var d = DP[S.dp], dG = DH - S.Tk * DS / 1000; return [["Dienophile", d.n], ["Conformation", S.phi < 40 * DEG ? 's-cis' : 's-trans'], ["C1–C2–C3–C4 dihedral", fmt(S.phi / DEG, 0) + '°'], ["Progress", fmt(S.q * 100, 0) + ' %'], ["Orientation", d.sub ? S.mode : '—'], ['T', fmt(S.Tk, 0) + ' K'], ['ΔG(T)', f1(dG) + ' kJ/mol']]; },
    ideas: ["<b>[4+2]</b>: diene (4 e⁻) + dienophile (2 e⁻) → cyclohexene; concerted and suprafacial.", "The diene must be <b>s-cis</b>.", "Normal demand: <b>EWG on the dienophile</b> and EDG on the diene speed up the reaction (smaller HOMO–LUMO gap).", "<b>Endo rule</b>: kinetic product due to secondary orbital interactions.", "ΔH ≈ −168 kJ/mol, ΔS &lt; 0: favorable at low T; the retro-Diels–Alder appears at high T."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Reaction"); el.appendChild(c);
      ui.dp = kit.ui.options({ label: "Dienophile", cols: 3, value: S.dp, options: [{ v: 'eteno', label: "Ethene", sub: "no EWG" }, { v: 'acroleina', label: 'Propenal', sub: 'CHO' }, { v: 'acrilonitrilo', label: "Acrylonitrile", sub: 'C≡N' }], onChange: function (v) { ctx.goManual(); S.dp = v; } }); c.appendChild(ui.dp);
      ui.md = kit.ui.options({ label: "Orientation", cols: 2, value: S.mode, options: [{ v: 'endo', label: 'Endo', sub: "substituent under the diene" }, { v: 'exo', label: 'Exo', sub: "substituent away" }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.md);
      ui.pg = kit.ui.slider({ label: "Reaction progress", min: 0, max: 1, step: 0.01, value: S.q, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.q = v; } });
      ui.ph = kit.ui.slider({ label: "Diene dihedral φ", min: 0, max: 180, step: 1, value: S.phi / DEG, format: function (v) { return v + '° ' + (v < 40 ? '(s-cis)' : (v > 140 ? '(s-trans)' : '')); }, onInput: function (v) { ctx.goManual(); S.phi = v * DEG; } });
      ui.tk = kit.ui.slider({ label: "Temperature", min: 250, max: 1400, step: 10, value: S.Tk, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.Tk = v; } }); c.appendChild(kit.ui.sliders([ui.pg, ui.ph, ui.tk]));
      c.appendChild(ctx.btnRow([{ t: "▶ React", primary: true, fn: function () { ctx.goManual(); S.phi = 0; S.q = 0; S.run = true; } }, { t: "Frontier orbitals", fn: function () { ctx.goManual(); S.fmo = !S.fmo; S.si = S.fmo ? 2 : 1; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card("Dienophile"); el.appendChild(t); var p = document.createElement('p'); p.className = 'muted small'; t.appendChild(p); ui.tip = p; ui.refresh = function () { if (ui._k !== S.dp) { ui._k = S.dp; p.innerHTML = DP[S.dp].tip; } };
    },
    graphs: [
      { title: "Frontier orbitals (qualitative)", h: 240, note: "An electron-withdrawing group lowers the LUMO of the dienophile and narrows the HOMO(diene)–LUMO(dienophile) gap: faster reaction.", draw: function (cx, w, h, col) {
        var d = DP[S.dp], ly = function (v) { return 14 + (h - 38) * (1 - v); }, x1 = w * 0.1, x2 = w * 0.58, ww = w * 0.3; cx.font = '10.5px system-ui'; cx.lineWidth = 2.6;
        var lv = [[x1, 0.3, 'HOMO', '#4dabf7'], [x1, 0.62, 'LUMO', '#4dabf7'], [x2, 0.18, 'HOMO', '#ff9f43'], [x2, d.lumo, 'LUMO', '#ff9f43']];
        lv.forEach(function (l) { cx.strokeStyle = l[3]; cx.beginPath(); cx.moveTo(l[0], ly(l[1])); cx.lineTo(l[0] + ww, ly(l[1])); cx.stroke(); cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText(l[2], l[0] + ww + 3, ly(l[1]) + 3); }); cx.lineWidth = 1;
        cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText("Diene", x1 + ww / 2, h - 20); cx.fillText("Dienophile: " + d.n.split(' ')[0], x2 + ww / 2, h - 20);
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(x1 + ww, ly(0.3)); cx.lineTo(x2, ly(d.lumo)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#ff6b3d'; cx.fillText("gap " + (d.lumo > 0.7 ? "large" : "smaller"), (x1 + ww + x2) / 2, (ly(0.3) + ly(d.lumo)) / 2 - 6);
        cx.fillStyle = col.muted; cx.save(); cx.translate(10, h / 2); cx.rotate(-Math.PI / 2); cx.fillText("energy →", 0, 0); cx.restore();
      } },
      { title: 'ΔG(T) = ΔH − TΔS', h: 210, note: "ΔH ≈ −168 kJ/mol, ΔS ≈ −148 J/(mol·K) (butadiene + ethene → cyclohexene, standard state). ΔG = 0 at ≈ 1135 K.", draw: function (cx, w, h, col) {
        var L = 44, R = 12, Tp = 12, B = 30, pw = w - L - R, ph = h - Tp - B, tmax = 1400, lo = -180, hi = 40, sx = function (t) { return L + pw * t / tmax; }, sy = function (g) { return Tp + ph - ph * (g - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var j = 0; j <= 4; j++) { var g = lo + (hi - lo) * j / 4, y = sy(g); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(g, 0), L - 5, y + 3); }
        cx.textAlign = 'center'; for (var q = 0; q <= 1400; q += 400) cx.fillText(String(q), sx(q), h - B + 13); cx.fillText('T (K)  ·  ΔG (kJ/mol)', L + pw / 2, h - 4);
        cx.strokeStyle = '#60a5fa'; cx.lineWidth = 2.6; cx.beginPath(); for (var i = 0; i <= 80; i++) { var t = tmax * i / 80, gg = DH - t * DS / 1000, X = sx(t), Y = sy(gg); if (i === 0) cx.moveTo(X, Y); else cx.lineTo(X, Y); } cx.stroke(); cx.lineWidth = 1;
        var gT = DH - S.Tk * DS / 1000; cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.Tk), sy(gT), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, T0 = S.Tk, dG = DH - T0 * DS / 1000, Kq = Math.exp(-dG * 1000 / (8.314 * T0)), Tc = DH * 1000 / DS;
      return "<div class=\"card-kicker\">Butadiene + ethene → cyclohexene</div><div class=\"calc-step\">1 · Enthalpy (from enthalpies of formation)</div><table class=\"calc-table\">" + row('ΔH°', "ΔH°f(cyclohexene) − [ΔH°f(butadiene) + ΔH°f(ethene)] = −5.0 − (110.0 + 52.5) = <b>−167.5 kJ/mol</b>") + row("Bonds", "2 π bonds break; 2 σ and 1 new π bond form") + '</table>' +
        "<div class=\"calc-step\">2 · Free energy at T = " + fmt(T0, 0) + ' K</div><table class="calc-table">' + row('ΔG', 'ΔH − TΔS = −168 − ' + fmt(T0, 0) + ' × (−0,148) = <b>' + f1(dG) + ' kJ/mol</b>') + row('K', 'exp(−ΔG/RT) = ' + MSim.sci(Kq, 1)) + row("Limit T (ΔG = 0)", '≈ ' + fmt(Tc, 0) + ' K (' + fmt(Tc - 273.15, 0) + ' °C)') + row("Direction", dG < 0 ? "<span class=\"calc-ok\">favors cyclohexene</span>" : "<span class=\"calc-hi\">favors the retro-Diels–Alder</span>") + "</table><p class=\"muted small\">Experimental barrier of the cycloaddition ≈ 115 kJ/mol (butadiene + ethene): that is why heating is needed if the dienophile is not activated.</p>";
    },
    quiz: [
      { q: "Which conformation must the diene adopt to react?", options: ['s-cis', 's-trans', "Any", "Only anti"], answer: 0, why: "Only in s-cis do the two ends of the diene face the dienophile." },
      { q: "The Diels–Alder reaction is a cycloaddition…", options: ["[4+2], concerted", "[2+2], stepwise", "[4+4], radical", 'SN2'], answer: 0, why: "4 π electrons of the diene and 2 of the dienophile participate in a single cyclic transition state." },
      { q: "What effect does an electron-withdrawing group (C=O, C≡N) on the dienophile have?", options: ["It lowers the LUMO and speeds up the reaction", "It raises the HOMO and slows it down", "No effect", "It changes the mechanism to a radical one"], answer: 0, why: "The HOMO(diene)–LUMO(dienophile) gap is reduced." },
      { q: "Which orbitals control the normal-demand reaction?", options: ["HOMO of the diene and LUMO of the dienophile", "LUMO of the diene and LUMO of the dienophile", "HOMO of the diene and HOMO of the dienophile", "The σ orbitals"], answer: 0, why: "Both ends have constructive phase overlap between the two frontier orbitals." },
      { q: "What is the product of butadiene + ethene?", options: ["Cyclohexene", "Cyclohexane", "Benzene", "Hexa-1,5-diene"], answer: 0, why: "A six-membered ring with a single double bond (between C2 and C3 of the diene) is formed." },
      { q: "The endo rule states that the kinetic product has the substituent…", options: ["under the diene, due to secondary orbital interactions", "away from the diene because of steric hindrance", "always in axial position", "on the central carbon"], answer: 0, why: "In the endo the π system of the substituent interacts with C2 and C3 of the diene." },
      { q: "Why is ΔS < 0 in the Diels–Alder reaction?", options: ["Two molecules join into one: freedom of movement is lost", "A gas forms", "σ bonds break", "Disorder increases"], answer: 0, why: "The reduction in the number of particles decreases entropy." },
      { q: "A large increase in temperature can favor the reverse reaction because…", options: ["−TΔS becomes more positive and ΔG approaches 0", "ΔH changes sign", "the catalyst breaks down", "the concentration rises"], answer: 0, why: "ΔG = ΔH − TΔS with negative ΔS: at high T, ΔG rises until it becomes positive." }
    ],
    help: { intro: "Move the progress, the diene dihedral and the orientation in “Lab”, or follow the lesson. Turn on “Frontier orbitals” to see the phases of the diene HOMO and the dienophile LUMO.", items: [["diene φ", "0° s-cis (reacts) · 180° s-trans."], ["Endo / exo", "position of the dienophile substituent relative to the diene."], ["Lobes", "blue + phase, red − phase."], ['ΔG(T)', "temperature and retro-Diels–Alder."], ['Controls', 'dienophile (ethene, propenal or acrylonitrile), orientation (endo or exo), reaction progress, diene dihedral φ and temperature.']], try: ['Put the diene in s-trans (180°): no reaction; go back to s-cis (0°).', 'Switch from ethene to acrylonitrile: the electron-withdrawing group speeds up the reaction.', 'Raise the temperature a lot: ΔG becomes positive and the retro-Diels–Alder appears.'] }
  };
  def.sync = function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.pg && u.pg.set(S.q); u.ph && u.ph.set(Math.round(S.phi / DEG)); u.tk && u.tk.set(Math.round(S.Tk)); } if (u.refresh) u.refresh(); };
  MSim.create(def);
})();
