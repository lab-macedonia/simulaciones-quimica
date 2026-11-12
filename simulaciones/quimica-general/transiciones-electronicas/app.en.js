/* Transiciones electrónicas y átomo de Bohr — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length; var cat = false, an = false; if (el === 'C' && s[i] === '+') { cat = true; i++; } else if (s[i] === '^') { an = true; i++; }
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, cat: cat, an: an, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (nd.cat) nd.tag = 'cat'; if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.cat) return 'sp2'; if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - (n.cat ? 1 : 0) - (n.an ? 1 : 0) - sum); }
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
  var HC = 1239.841984, RINF = 13.605693123, MEU = 5.485799e-4, KJ = 96.48533, A0 = 52.917721, V1 = 2.18769126e6, T1 = 1.5198298e-16, NMAX = 6;
  var NUC = { 1: { name: 'H', M: 1.007276, p: 1, n: 0 }, 2: { name: 'He⁺', M: 4.001506, p: 2, n: 2 }, 3: { name: 'Li²⁺', M: 7.014357, p: 3, n: 4 } };
  var SER = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund', 6: 'Humphreys' };
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  var fmt = SimKit.fmt;
  function sci(x, d) { d = d == null ? 2 : d; if (x === 0) return '0'; var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10), m = x / Math.pow(10, e), s = m.toFixed(d); if (parseFloat(s) >= 10) { s = (m / 10).toFixed(d); e++; } return s.replace('.', '.') + ' × 10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  function wl2rgb(w) { var r = 0, g = 0, b = 0; if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else if (w <= 750) { r = 1; } var f = 1; if (w < 420) f = 0.3 + 0.7 * (w - 380) / 40; else if (w > 700) f = 0.3 + 0.7 * (750 - w) / 50; var q = function (c) { return Math.round(255 * Math.pow(Math.max(0, c * f), 0.8)); }; return [q(r), q(g), q(b)]; }
  function lamCss(l) { if (l >= 380 && l <= 750) { var c = wl2rgb(l); return 'rgb(' + Math.round(c[0] * 0.82) + ',' + Math.round(c[1] * 0.82) + ',' + Math.round(c[2] * 0.82) + ')'; } if (l < 10) return '#0c8599'; if (l < 380) return '#7048e8'; return '#e03131'; }
  function lamStr(l) { return l >= 1000 ? fmt(l / 1000, 3) + ' μm' : fmt(l, l >= 100 ? 1 : 2) + ' nm'; }
  function regionOf(l) { return l < 10 ? "X-rays" : l < 380 ? "Ultraviolet" : l <= 750 ? 'Visible' : "Infrared"; }
  function nT(n) { return n === Infinity ? '∞' : String(n); }
  var S = { Z: 1, spd: 1, trail: true, db: false, mode: 'emi' }, A = { n: 2, th: 0, r: 0, om: 0, jump: null, busy: false, queue: [], last: null, obs: {}, hist: [] }, G = { photons: [], flashes: [] }, labs = {}, ui = {};
  function inv2(n) { return n === Infinity ? 0 : 1 / (n * n); }
  function Ry() { return RINF / (1 + MEU / NUC[S.Z].M); }
  function En(n) { return -Ry() * S.Z * S.Z * inv2(n); }
  function pE(a, b) { return Ry() * S.Z * S.Z * Math.abs(inv2(Math.min(a, b)) - inv2(Math.max(a, b))); }
  function rPm(n) { return A0 * n * n / S.Z; } function vMs(n) { return V1 * S.Z / n; } function Tper(n) { return T1 * n * n * n / (S.Z * S.Z); }
  function rad(n) { return n === Infinity ? 14 : 0.8 * Math.pow(n, 1.4) + 0.4; } function omOf(n) { return n === Infinity ? 0.1 : 4.2 / Math.pow(n, 1.5); }
  function ease(u) { return u * u * (3 - 2 * u); }
  function ep(r, th, T) { return new T.Vector3(r * Math.cos(th), 0, r * Math.sin(th)); }
  function glowTex(T) { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); }
  function glow(T, color, scale, op) { var s = new T.Sprite(new T.SpriteMaterial({ map: G.tex, color: color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false })); s.scale.set(scale, scale, 1); return s; }
  function buildNuc(ctx) {
    var T = ctx.T; while (G.nuc.children.length) { var c = G.nuc.children.pop(); if (c.geometry) c.geometry.dispose(); }
    var info = NUC[S.Z], tot = info.p + info.n, rs = tot === 1 ? 0.34 : 0.22, spread = tot === 1 ? 0 : 0.3 * Math.cbrt(tot), kinds = [], i;
    for (i = 0; i < info.p; i++) kinds.push(0); for (i = 0; i < info.n; i++) kinds.push(1);
    for (i = 0; i < tot; i++) { var m = new T.Mesh(new T.SphereGeometry(rs, 18, 18), new T.MeshStandardMaterial({ color: kinds[i] === 0 ? 0xe03131 : 0x868e96, roughness: 0.5 })); if (tot > 1) { var u = Math.acos(1 - 2 * (i + 0.5) / tot), t = Math.PI * (1 + Math.sqrt(5)) * i; m.position.set(spread * Math.sin(u) * Math.cos(t), spread * Math.cos(u), spread * Math.sin(u) * Math.sin(t)); } G.nuc.add(m); }
    G.nuc.add(glow(T, 0xff8a65, tot === 1 ? 2.4 : 3.4, 0.45));
  }
  function setRing(n, on) { (G.rings || []).forEach(function (r, i) { if (!r) return; var a = (i === n && on); r.material.opacity = a ? 1 : 0.55; r.material.color.set(a ? 0x1c7ed6 : 0x7c8db5); }); }
  function makePhoton(ctx, lam) {
    var T = ctx.T, col = new T.Color(lamCss(lam)), cycles = Math.min(14, Math.max(2, 4 * Math.pow(550 / lam, 0.7))), PM = 90, g = new T.Group(), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(PM * 3), 3));
    var mat = new T.LineBasicMaterial({ color: col, transparent: true, opacity: 1 }), line = new T.Line(geo, mat); line.frustumCulled = false; var spr = glow(T, col, 1.4, 0.7); g.add(line, spr); ctx.scene.add(g);
    return { g: g, geo: geo, mat: mat, spr: spr, cycles: cycles, PM: PM, age: 0, col: col };
  }
  function shapePh(p, t) { var a = p.geo.attributes.position.array; for (var i = 0; i < p.PM; i++) { var u = i / (p.PM - 1), env = Math.pow(Math.sin(Math.PI * u), 2); a[i * 3] = -3.2 * (1 - u); a[i * 3 + 1] = 0.42 * env * Math.sin(2 * Math.PI * p.cycles * u - 16 * t); a[i * 3 + 2] = 0; } p.geo.attributes.position.needsUpdate = true; }
  function killPh(ctx, p) { ctx.scene.remove(p.g); p.geo.dispose(); p.mat.dispose(); p.spr.material.dispose(); }
  function flashAt(ctx, pos, color, size) { var s = glow(ctx.T, color, 0.5, 1); s.position.copy(pos); ctx.scene.add(s); G.flashes.push({ s: s, age: 0, size: size || 5 }); }
  function startJump(to) { var from = A.n; A.jump = { t: 0, dur: 1.45, rF: A.r, rT: rad(to), wF: A.om, wT: omOf(to), to: to }; setRing(from, false); }
  function finishJump() { var j = A.jump; A.n = j.to; A.r = j.rT; A.om = j.wT; A.jump = null; A.busy = false; setRing(A.n, true); nextQ(); }
  function run(ctx, to) {
    var T = ctx.T, from = A.n; if (to === from) { nextQ(); return; } A.busy = true;
    var lo = Math.min(from, to), hi = Math.max(from, to), E = pE(from, to), lam = HC / E, em = to < from; A.last = { from: from, to: to, em: em, E: E, lam: lam };
    var cssc = lamCss(lam), col = new T.Color(cssc);
    if (em) { var p0 = ep(A.r, A.th, T), d = new T.Vector3(p0.x, 0, p0.z).normalize(); d.x += (Math.random() - 0.5) * 0.9; d.y = (Math.random() - 0.25) * 1.1; d.z += (Math.random() - 0.5) * 0.9; d.normalize(); var p = makePhoton(ctx, lam); p.g.position.copy(p0); p.g.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), d); p.kind = 'out'; p.dir = d; G.photons.push(p); flashAt(ctx, p0, col, 4); if (hi !== Infinity) A.obs[lo + '-' + hi] = lam; A.hist.push({ lo: lo, hi: hi, lam: lam }); if (A.hist.length > 14) A.hist.shift(); startJump(to); }
    else { var Tt = 1.9, th = A.th + A.om * Tt, tg = ep(A.r, th, T), dd = new T.Vector3(Math.random() - 0.5, 0.35 + Math.random() * 0.5, Math.random() - 0.5).normalize(), st = tg.clone().add(dd.clone().multiplyScalar(22)), pp = makePhoton(ctx, lam); pp.g.position.copy(st); pp.g.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), dd.clone().negate()); pp.kind = 'in'; pp.start = st; pp.tgt = tg; pp.T = Tt; pp.arrive = function () { flashAt(ctx, tg, col, 6); startJump(to); }; G.photons.push(pp); }
    ctx.kit && ctx.kit.toast((em ? "Emission: " : (to === Infinity ? "Ionization: " : "Absorption: ")) + 'n = ' + nT(from) + ' → ' + nT(to) + ' · ' + lamStr(lam) + ' (' + regionOf(lam).toLowerCase() + ')');
  }
  function nextQ() { if (A.busy) return; while (A.queue.length) { var n = A.queue.shift(); if (n !== A.n) { run(G.ctx, n); return; } } }
  function goto(n) { if (A.busy || A.queue.length) { if (A.queue.length < 60) A.queue.push(n); } else run(G.ctx, n); }
  function plannedN() { return A.queue.length ? A.queue[A.queue.length - 1] : (A.jump ? A.jump.to : A.n); }
  function cascade() { var cur = plannedN(), seq = [], m; if (cur === Infinity) cur = NMAX; if (cur === 1) { cur = 3 + Math.floor(Math.random() * (NMAX - 2)); seq.push(cur); } while (cur > 1) { m = 1 + Math.floor(Math.random() * (cur - 1)); seq.push(m); cur = m; } seq.forEach(goto); }
  function series(nf) { goto(nf); for (var ni = nf + 1; ni <= NMAX; ni++) { goto(ni); goto(nf); } }
  function hardSet(n) { G.photons.forEach(function (p) { killPh(G.ctx, p); }); G.photons = []; A.queue = []; A.jump = null; A.busy = false; A.n = n; A.r = rad(n); A.om = omOf(n); setRing(n, true); }
  function desired(i, loc) {
    var b = function (arr) { for (var k = 0; k < arr.length; k++) if (loc < arr[k][0]) return arr[k][1]; return arr[arr.length - 1][1]; };
    if (i === 0) return { Z: 1, n: b([[0.2, 1], [0.45, 2], [0.7, 3], [2, 4]]), db: false };
    if (i === 1) return { Z: 1, n: b([[0.1, 1], [0.35, 3], [0.6, 2], [0.8, 4], [2, 1]]), db: false };
    if (i === 2) return { Z: 1, n: b([[0.1, 2], [0.25, 4], [0.4, 2], [0.55, 5], [0.7, 2], [0.85, 6], [2, 2]]), db: false };
    if (i === 3) return { Z: 1, n: b([[0.2, 1], [0.4, 2], [0.6, 3], [0.8, 4], [2, 5]]), db: true };
    var Z = 1 + Math.min(2, Math.floor(loc * 3)), sub = loc * 3 - Math.floor(loc * 3); return { Z: Z, n: sub < 0.35 ? 1 : Infinity, db: false };
  }
  var STG = function () { return [
    ["Bohr model", 'Bohr', "Eₙ = −13.6 eV·Z²/n² · rₙ = 52.9 pm·n²/Z", "<p>The electron travels in <b>circular orbits</b> with angular momentum <b>L = n·ħ</b>. The energies are <b>quantized</b> and negative (bound electron). The radii grow as <b>n²</b> and the energy approaches 0 as n → ∞ (the levels converge). Here the radial scale is compressed.</p>"],
    ["Absorption and emission", "Absorption", '|ΔE| = h·f = h·c/λ', "<p>Moving up a level requires <b>absorbing</b> a photon of exact energy E<sub>n₂</sub> − E<sub>n₁</sub>; moving down releases an equal photon (<b>emission</b>). The photon color corresponds to its wavelength; in the UV and IR it is shown with reference colors.</p>"],
    ["Spectral series", "Series", '1/λ = R·Z²·(1/n₁² − 1/n₂²)', "<p>Transitions ending at n = 1 form the <b>Lyman</b> series (UV), at n = 2 the <b>Balmer</b> series (visible, Hα = 656.5 nm), at n = 3 the <b>Paschen</b> series (IR). The lines converge toward the <b>series limit</b> (n₂ → ∞).</p>"],
    ["de Broglie wave", "De Broglie", '2π·rₙ = n·λ', "<p>If the electron is a wave, the orbit is stable only if a <b>whole number</b> of wavelengths fits (<b>2πr = nλ</b>); otherwise the wave destroys itself by interference. This explains Bohr's <b>quantization</b>. The n standing waves of each orbit are shown.</p>"],
    ["Ionization and hydrogen-like ions", "Ionization", "E(n=1) = −13.6·Z² eV", "<p>To <b>ionize</b> (n → ∞) from n = 1, 13.6 eV is needed (λ ≤ 91.2 nm) in H, <b>54.4 eV</b> in He⁺ and <b>122.4 eV</b> in Li²⁺: the energy scales with <b>Z²</b> and the radii with 1/Z. The model only works for <b>one-electron</b> systems.</p>"]
  ]; };
  var def = {
    key: 'transiciones-electronicas', title: "Electronic Transitions and the Bohr Atom", subtitle: "3D Simulator · quantum", accent: { dark: '#22d3ee', light: '#0e7490' }, stages: STG, nStages: 5, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: "Perspective", pos: [0, 12, 20], target: [0, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 34, 0.1], target: [0, 0, 0] }, { id: 'lat', label: "Side", pos: [32, 1.5, 0], target: [0, 0, 0] }],
    layers: [],
    build: function (ctx) {
      var T = ctx.T, sc = ctx.scene; G.ctx = ctx; G.tex = glowTex(T); sc.add(new T.AmbientLight(0xffffff, 0.9)); var dl = new T.DirectionalLight(0xffffff, 0.6); dl.position.set(8, 14, 10); sc.add(dl);
      G.nuc = new T.Group(); sc.add(G.nuc); buildNuc(ctx); G.rg = new T.Group(); sc.add(G.rg); G.rings = []; labs.r = [];
      for (var n = 1; n <= NMAX; n++) { var r = rad(n), pts = []; for (var i = 0; i <= 128; i++) { var t = i / 128 * Math.PI * 2; pts.push(new T.Vector3(r * Math.cos(t), 0, r * Math.sin(t))); } var l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7c8db5, transparent: true, opacity: 0.55 })); G.rg.add(l); G.rings[n] = l; labs.r[n] = ctx.label('n = ' + n, 'bl-d').pos(r * Math.cos(-0.7), 0.6, r * Math.sin(-0.7)); }
      G.el = new T.Mesh(new T.SphereGeometry(0.32, 20, 20), new T.MeshStandardMaterial({ color: 0x1c7ed6, emissive: 0x1971c2, emissiveIntensity: 0.5, roughness: 0.3 })); sc.add(G.el); G.el.add(glow(T, 0x4dabf7, 1.7, 0.6));
      G.TR = 150; var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(new Float32Array(G.TR * 3), 3)); G.trail = new T.Line(tg, new T.LineBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55 })); G.trail.frustumCulled = false; sc.add(G.trail); G.trInit = false; G.trPts = [];
      var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(new Float32Array(300 * 3), 3)); G.dbL = new T.LineLoop(dg, new T.LineBasicMaterial({ color: 0xe67700 })); G.dbL.frustumCulled = false; G.dbL.visible = false; sc.add(G.dbL);
      A.n = 2; A.r = rad(2); A.om = omOf(2); setRing(2, true); labs.t = ctx.label('', 'bl-lead').pos(0, 8.5, 0); G.tt = 0; G.pi = -1; G.pl = 0;
    },
    frame: function (ctx, f, dt) {
      dt = Math.min(dt, 0.05) * S.spd; var T = ctx.T, i; G.tt += dt;
      if (!ctx.P.manual) {
        var d = desired(f.i, f.local), reset = f.i !== G.pi || f.local < G.pl - 0.02; G.pi = f.i; G.pl = f.local;
        if (d.Z !== S.Z) { S.Z = d.Z; buildNuc(ctx); hardSet(d.n); A.last = null; A.obs = {}; A.hist = []; }
        else if (reset) { S.Z = d.Z; buildNuc(ctx); hardSet(d.n); if (f.i !== G.lastStage) { A.last = null; A.obs = {}; A.hist = []; } }
        else if (d.n !== plannedN()) goto(d.n);
        G.lastStage = f.i; S.db = d.db;
      }
      if (A.jump) { var j = A.jump; j.t += dt; var u = ease(Math.min(1, j.t / j.dur)); A.r = j.rF + (j.rT - j.rF) * u; A.om = j.wF + (j.wT - j.wF) * u; if (j.t >= j.dur) finishJump(); }
      A.th += A.om * dt; var pos = ep(A.r, A.th, T); G.el.position.copy(pos);
      G.trail.visible = S.trail; if (S.trail) { G.trPts.unshift(pos.clone()); if (G.trPts.length > G.TR) G.trPts.pop(); var a = G.trail.geometry.attributes.position.array; for (i = 0; i < G.TR; i++) { var q = G.trPts[Math.min(i, G.trPts.length - 1)]; a[i * 3] = q.x; a[i * 3 + 1] = q.y; a[i * 3 + 2] = q.z; } G.trail.geometry.attributes.position.needsUpdate = true; }
      for (i = G.photons.length - 1; i >= 0; i--) { var p = G.photons[i]; p.age += dt; shapePh(p, G.tt); if (p.kind === 'out') { p.g.position.addScaledVector(p.dir, 9 * dt); var k = Math.max(0, 1 - p.age / 3.2); p.mat.opacity = k; p.spr.material.opacity = 0.7 * k; if (p.age > 3.2) { killPh(ctx, p); G.photons.splice(i, 1); } } else { var w = Math.min(1, p.age / p.T); p.g.position.lerpVectors(p.start, p.tgt, w); if (w >= 1) { var arr = p.arrive; killPh(ctx, p); G.photons.splice(i, 1); arr(); } } }
      for (i = G.flashes.length - 1; i >= 0; i--) { var fl = G.flashes[i]; fl.age += dt; var s = fl.size * (0.3 + fl.age * 1.6); fl.s.scale.set(s, s, 1); fl.s.material.opacity = Math.max(0, 1 - fl.age / 0.7); if (fl.age > 0.7) { ctx.scene.remove(fl.s); fl.s.material.dispose(); G.flashes.splice(i, 1); } }
      var showL = ctx.layer('labels'); labs.r.forEach(function (l, n) { if (l) l.vis(showL); });
      var nn = A.jump ? A.jump.to : A.n;
      if (S.db && nn !== Infinity) { G.dbL.visible = true; var rr = A.r, ph = G.tt * 1.2, ar = G.dbL.geometry.attributes.position.array; for (i = 0; i < 300; i++) { var t2 = i / 300 * 2 * Math.PI, amp = 0.55 * Math.sin(nn * t2) * Math.cos(ph); ar[i * 3] = (rr) * Math.cos(t2); ar[i * 3 + 1] = amp; ar[i * 3 + 2] = (rr) * Math.sin(t2); } G.dbL.geometry.attributes.position.needsUpdate = true; } else G.dbL.visible = false;
      labs.t.set(NUC[S.Z].name + ' · n = ' + nT(nn) + (nn === Infinity ? " (free)" : ' · E = ' + fmt(En(nn), 3) + ' eV'), 'bl-lead').vis(true);
    },
    sync: function (ctx) { if (ui.refresh) ui.refresh(); },
    hud: function () { var n = A.jump ? A.jump.to : A.n, row = function (k, v) { return '<div class="eqline"><small>' + k + '</small>' + v + '</div>'; }, l = A.last;
      return { eq: { chip: 'Eₙ', name: NUC[S.Z].name + ' · Bohr', body: row('n', nT(n)) + row('Eₙ', n === Infinity ? "0.000 eV" : fmt(En(n), 3) + ' eV') + row("Last λ", l ? lamStr(l.lam) : '—') }, legend: [{ label: 'p⁺', color: '#e03131', text: "proton" }, { label: 'n⁰', color: '#868e96', text: "neutron" }, { label: 'e⁻', color: '#1c7ed6', text: "electron" }, { label: 'γ', color: '#e67700', text: "photon / de Broglie wave" }] }; },
    measures: function () { var n = A.jump ? A.jump.to : A.n, l = A.last, out = [["Species", NUC[S.Z].name + ' (Z = ' + S.Z + ')'], ["Level n", nT(n)], ['Eₙ', n === Infinity ? '0 eV' : fmt(En(n), 3) + ' eV'], ['rₙ', n === Infinity ? '—' : fmt(rPm(n), 1) + ' pm'], ['vₙ', n === Infinity ? '—' : sci(vMs(n), 2) + ' m/s'], ["Orbital period", n === Infinity ? '—' : sci(Tper(n), 2) + ' s'], ['L = nħ', n === Infinity ? '—' : n + ' ħ']];
      if (l) out = out.concat([["Process", l.em ? "emission" : (l.to === Infinity ? "ionization" : "absorption")], ["Transition", nT(l.from) + ' → ' + nT(l.to)], ["Photon", fmt(l.E, 3) + ' eV · ' + lamStr(l.lam)], ["Region", regionOf(l.lam)]]); return out; },
    ideas: ["<b>Eₙ = −13.6 eV·Z²/n²</b>; the levels converge as n increases.", "Going up = <b>absorbing</b>; going down = <b>emitting</b> a photon of exact ΔE.", "Balmer (→ 2) falls in the <b>visible</b>; Lyman (→ 1), in the UV.", "<b>2πr = nλ</b>: the stable orbit holds whole waves.", "Ionizing H from n = 1 requires <b>13.6 eV</b> (λ ≤ 91.2 nm)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, c = kit.ui.card("Atom"); el.appendChild(c);
      ui.Z = kit.ui.options({ label: "Species", cols: 3, value: String(S.Z), options: [{ v: '1', label: 'H', sub: 'Z = 1' }, { v: '2', label: 'He⁺', sub: 'Z = 2' }, { v: '3', label: 'Li²⁺', sub: 'Z = 3' }], onChange: function (v) { ctx.goManual(); S.Z = +v; buildNuc(ctx); hardSet(2); A.last = null; A.obs = {}; A.hist = []; } }); c.appendChild(ui.Z);
      ui.n = kit.ui.options({ label: "Move the electron to level…", cols: 4, value: String(A.n), options: [1, 2, 3, 4, 5, 6, '∞'].map(function (n) { return { v: String(n === '∞' ? Infinity : n), label: n === '∞' ? '∞ ion.' : 'n = ' + n }; }), onChange: function (v) { ctx.goManual(); goto(v === 'Infinity' ? Infinity : +v); } }); c.appendChild(ui.n);
      c.appendChild(ctx.btnRow([{ t: "Emission cascade", fn: function () { ctx.goManual(); cascade(); } }, { t: "Reset atom", fn: function () { ctx.goManual(); hardSet(2); A.last = null; A.obs = {}; A.hist = []; } }]));
      var cs = kit.ui.card("Spectral series"); el.appendChild(cs); cs.appendChild(ctx.btnRow([1, 2, 3].map(function (nf) { return { t: SER[nf] + ' (→ ' + nf + ')', fn: function () { ctx.goManual(); series(nf); } }; })));
      cs.appendChild(ctx.btnRow([{ t: "Clear record", fn: function () { A.obs = {}; A.hist = []; A.last = null; } }]));
      var cv = kit.ui.card("Visualization"); el.appendChild(cv);
      ui.spd = kit.ui.slider({ label: "Rate", min: 0.3, max: 3, step: 0.05, value: S.spd, format: function (v) { return fmt(v, 1) + '×'; }, onInput: function (v) { S.spd = v; } }); cv.appendChild(kit.ui.sliders([ui.spd]));
      ui.tr = kit.ui.options({ label: "Trail", cols: 2, value: S.trail ? '1' : '0', options: [{ v: '1', label: "With trail" }, { v: '0', label: "Without trail" }], onChange: function (v) { S.trail = v === '1'; } }); cv.appendChild(ui.tr);
      ui.db = kit.ui.options({ label: "de Broglie wave", cols: 2, value: S.db ? '1' : '0', options: [{ v: '0', label: "Hidden" }, { v: '1', label: 'Visible' }], onChange: function (v) { ctx.goManual(); S.db = v === '1'; } }); cv.appendChild(ui.db);
      ui.mode = kit.ui.options({ label: "Spectrum (graphs)", cols: 2, value: S.mode, options: [{ v: 'emi', label: "Emission" }, { v: 'abs', label: "Absorption from current n" }], onChange: function (v) { S.mode = v; } }); cv.appendChild(ui.mode);
      cv.appendChild(ctx.btnRow([{ t: "Back to the lesson", primary: true, fn: function () { ctx.toLesson(); } }]));
      var lk = ''; ui.refresh = function () { var k = [S.Z, nT(A.jump ? A.jump.to : A.n), S.db, S.mode].join('|'); if (k === lk) return; lk = k; ui.Z.set(String(S.Z)); ui.n.set(String(A.jump ? A.jump.to : A.n)); ui.db.set(S.db ? '1' : '0'); ui.mode.set(S.mode); };
    },
    graphs: [
      { title: "Level diagram", h: 270, note: "Height ∝ 1 − 1/n. Arrows: recent transitions, colored by λ. Dot: current level.", draw: function (cx, w, h, c) {
        var L0 = 74, Tp = 16, B = 14, ph = h - Tp - B, sy = function (n) { return Tp + ph * (1 - (n === Infinity ? 1 : 1 - 1 / n)); }, xr = w - 14;
        cx.font = '10.5px system-ui'; cx.textAlign = 'right'; for (var n = 1; n <= NMAX; n++) { cx.strokeStyle = c.muted; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(L0, sy(n)); cx.lineTo(xr, sy(n)); cx.stroke(); cx.fillStyle = c.muted; cx.fillText('n=' + n + '  ' + fmt(En(n), 2), L0 - 4, sy(n) + 3); }
        cx.setLineDash([4, 3]); cx.beginPath(); cx.moveTo(L0, sy(Infinity)); cx.lineTo(xr, sy(Infinity)); cx.stroke(); cx.setLineDash([]); cx.fillText('∞  0', L0 - 4, sy(Infinity) + 12);
        A.hist.forEach(function (t, i) { var x = L0 + 14 + (i + 0.5) * (xr - L0 - 28) / 14; cx.strokeStyle = lamCss(t.lam); cx.fillStyle = lamCss(t.lam); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, sy(t.hi)); cx.lineTo(x, sy(t.lo) - 5); cx.stroke(); cx.beginPath(); cx.moveTo(x - 4, sy(t.lo) - 6); cx.lineTo(x + 4, sy(t.lo) - 6); cx.lineTo(x, sy(t.lo)); cx.fill(); }); cx.lineWidth = 1;
        var nn = A.jump ? A.jump.to : A.n; cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(L0 + 6, sy(nn), 5, 0, 7); cx.fill(); } },
      { title: "Line spectrum", h: 150, note: "Logarithmic scale of λ (80 nm – 4 μm). Emission: observed transitions; absorption: lines from the current level.", draw: function (cx, w, h, c) {
        var L0 = 10, pw = w - 20, lo = Math.log(80), hi = Math.log(4100), sx = function (l) { return L0 + pw * (Math.log(l) - lo) / (hi - lo); }, i, j;
        cx.fillStyle = S.mode === 'emi' ? '#1b1f2a' : '#f1f3f5'; cx.fillRect(L0, 28, pw, 52);
        if (S.mode === 'abs') { var g = cx.createLinearGradient(sx(380), 0, sx(750), 0); for (i = 0; i <= 12; i++) { var rgb = wl2rgb(380 + 370 * i / 12); g.addColorStop(i / 12, 'rgb(' + rgb.join(',') + ')'); } cx.fillStyle = g; cx.fillRect(sx(380), 28, sx(750) - sx(380), 52); cx.fillStyle = 'rgba(224,49,49,.35)'; cx.fillRect(sx(750), 28, L0 + pw - sx(750), 52); cx.fillStyle = 'rgba(112,72,232,.35)'; cx.fillRect(L0, 28, sx(380) - L0, 52); }
        cx.fillStyle = c.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; [100, 200, 400, 700, 1000, 2000, 4000].forEach(function (l) { cx.fillRect(sx(l), 82, 1, 5); cx.fillText(l >= 1000 ? l / 1000 + ' μm' : l + ' nm', sx(l), 98); });
        if (S.mode === 'emi') { var any = false; Object.keys(A.obs).forEach(function (k) { any = true; var l = A.obs[k]; cx.strokeStyle = lamCss(l); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx(l), 30); cx.lineTo(sx(l), 78); cx.stroke(); }); for (var a = 1; a <= 3; a++) for (var b = a + 1; b <= 8; b++) { var l2 = HC / pE(a, b); if (l2 > 4100) continue; cx.fillStyle = c.muted; cx.fillRect(sx(l2), 12, 1, 8); } cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText(any ? "observed lines" : "no transitions yet (marks: Lyman, Balmer, Paschen)", L0, 120); }
        else { var n0 = A.jump ? A.jump.to : A.n; if (n0 === Infinity) n0 = NMAX; for (var m = n0 + 1; m <= 12; m++) { var l3 = HC / pE(n0, m); if (l3 > 4100) continue; cx.strokeStyle = '#111'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(l3), 30); cx.lineTo(sx(l3), 78); cx.stroke(); } cx.fillStyle = c.muted; cx.textAlign = 'left'; cx.fillText("absorption from n = " + n0, L0, 120); }
        cx.lineWidth = 1; } },
      { title: "Eₙ and rₙ versus n", h: 220, note: "Energy (blue, eV) and radius (orange, pm) of the chosen species; dot = current level.", draw: function (cx, w, h, c) {
        var L0 = 40, Tp = 12, B = 22, pw = w - L0 - 44, ph = h - Tp - B, sx = function (n) { return L0 + pw * (n - 1) / (NMAX - 1); }, sE = function (e) { return Tp + ph * (e / (RINF * 9 * 1.05)) * -1 + ph * 1; };
        cx.font = '10px system-ui'; cx.fillStyle = c.muted; cx.strokeStyle = c.line; cx.textAlign = 'center'; for (var n = 1; n <= NMAX; n++) { cx.beginPath(); cx.moveTo(sx(n), Tp); cx.lineTo(sx(n), Tp + ph); cx.stroke(); cx.fillText(n, sx(n), h - B + 12); } cx.fillText('n', L0 + pw / 2, h - 2);
        var Emax = RINF * S.Z * S.Z, yE = function (e) { return Tp + ph * (-e / Emax); }, yR = function (r) { return Tp + ph * (1 - r / (A0 * NMAX * NMAX / S.Z)); };
        cx.strokeStyle = '#1c7ed6'; cx.lineWidth = 2; cx.beginPath(); for (var k = 1; k <= NMAX; k += 0.1) { var e = -Ry() * S.Z * S.Z / (k * k); if (k === 1) cx.moveTo(sx(k), yE(e)); else cx.lineTo(sx(k), yE(e)); } cx.stroke(); cx.strokeStyle = '#e8590c'; cx.beginPath(); for (var k2 = 1; k2 <= NMAX; k2 += 0.1) { var r2 = A0 * k2 * k2 / S.Z; if (k2 === 1) cx.moveTo(sx(k2), yR(r2)); else cx.lineTo(sx(k2), yR(r2)); } cx.stroke(); cx.lineWidth = 1;
        cx.textAlign = 'right'; cx.fillStyle = '#1c7ed6'; cx.fillText('E₁ = ' + fmt(En(1), 1) + ' eV', L0 + 90, Tp + ph - 4 > Tp + ph * 0.95 ? Tp + ph - 4 : Tp + ph - 4); cx.textAlign = 'left'; cx.fillStyle = '#e8590c'; cx.fillText('r₆ = ' + fmt(rPm(6), 0) + ' pm', sx(NMAX) - 62, yR(rPm(NMAX)) + 12);
        var nn = A.jump ? A.jump.to : A.n; if (nn !== Infinity && nn <= NMAX) { cx.fillStyle = '#e03131'; cx.beginPath(); cx.arc(sx(nn), yE(En(nn)), 5, 0, 7); cx.fill(); cx.beginPath(); cx.arc(sx(nn), yR(rPm(nn)), 5, 0, 7); cx.fill(); } } }
    ],
    calc: function () { var l = A.last, row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, n = A.jump ? A.jump.to : A.n, h = '<div class="card-kicker">' + NUC[S.Z].name + ' · Z = ' + S.Z + ' · R_M = ' + fmt(Ry(), 4) + " eV</div><div class=\"calc-step\">1 · Current state (n = " + nT(n) + ')</div><table class="calc-table">' + row('Eₙ = −R·Z²/n²', n === Infinity ? '0 eV' : fmt(En(n), 3) + ' eV') + row('rₙ = a₀·n²/Z', n === Infinity ? '—' : fmt(rPm(n), 1) + ' pm') + row('vₙ = v₁·Z/n', n === Infinity ? '—' : sci(vMs(n), 2) + ' m/s') + '</table>';
      if (!l) return h + "<p class=\"small\">Move the electron (Lab) to calculate a transition.</p>";
      return h + "<div class=\"calc-step\">2 · Transition " + nT(l.from) + ' → ' + nT(l.to) + '</div><table class="calc-table">' + row('ΔE = R·Z²·|1/n₁² − 1/n₂²|', fmt(l.E, 4) + ' eV') + row("λ = hc/ΔE = 1239.84/ΔE", lamStr(l.lam)) + row('f = ΔE/h', sci(l.E * 2.417989e14) + ' Hz') + row('ν̃ = 1/λ', sci(1e7 / l.lam) + ' cm⁻¹') + row("Molar ΔE", fmt(l.E * KJ, 1) + ' kJ/mol') + row("Region", regionOf(l.lam)) + row("Series", SER[Math.min(l.from, l.to)] || '—') + '</table>'; },
    calcLabel: "Transition",
    quiz: [
      { q: "The energy of the electron in level n of the H atom is…", options: ['−13,6 eV / n²', '−13,6 eV · n²', '+13,6 eV / n', '−13,6 eV / n'], answer: 0, why: "Eₙ = −13.6 eV·Z²/n²: negative and tending to 0 as n → ∞." },
      { q: "An electron goes from n = 3 to n = 2: it…", options: ["emits a red photon (Hα, 656 nm)", "absorbs a red photon", "emits a UV photon", "absorbs a UV photon"], answer: 0, why: "ΔE = 1.89 eV → λ = 656 nm; on dropping a level, a photon is emitted." },
      { q: "The Lyman series corresponds to transitions ending at…", options: ["n = 1 (ultraviolet)", "n = 2 (visible)", "n = 3 (infrared)", 'n = ∞'], answer: 0, why: "Lyman: n → 1, UV region." },
      { q: "The ionization energy of H from the ground state is…", options: ["13.6 eV", "3.4 eV", "1.51 eV", "54.4 eV"], answer: 0, why: "It is |E₁| = 13.6 eV, equivalent to λ ≤ 91.2 nm." },
      { q: "For He⁺ (Z = 2) the ground-state energy is…", options: ["−54.4 eV", "−27.2 eV", "−13.6 eV", "−6.8 eV"], answer: 0, why: "E₁ = −13.6·Z² = −54.4 eV." },
      { q: "The de Broglie condition for a stable orbit is…", options: ['2πr = nλ', 'r = nλ', 'πr = nλ', '2πr = λ/n'], answer: 0, why: "The circumference must contain a whole number of wavelengths." },
      { q: "The radii of the Bohr orbits grow in proportion to…", options: ['n²', 'n', '1/n²', 'n³'], answer: 0, why: 'rₙ = a₀n²/Z.' },
      { q: "The Bohr model correctly describes…", options: ["one-electron systems", "all neutral atoms", "diatomic molecules", "only the ground state"], answer: 0, why: "It works for H, He⁺, Li²⁺; it does not explain many-electron atoms." }
    ],
    help: { intro: "Use “Lab” to move the electron to another level, launch series and cascades, or change species.", items: [["Absorption/emission", "going up a level absorbs a photon; going down emits it."], ["Series", "automatic Lyman, Balmer and Paschen."], ["De Broglie", "standing waves in each orbit."], ["Graphs", "level diagram and line spectrum."], ['Scene', 'p⁺, n⁰ and e⁻ of the atom; γ = photon absorbed or emitted.'], ['Controls', 'species (H, He⁺ or Li²⁺), move the electron to a level, speed, trail, de Broglie wave and emission or absorption spectrum; the emission cascade chains jumps.']], try: ['Drop the electron from n = 3 to n = 2 in H: it emits the red Balmer line (656 nm).', 'Run the Lyman and Balmer series: Lyman falls in the UV and Balmer in the visible.', 'Show the de Broglie wave: each orbit holds n whole wavelengths.'] }
  };
  MSim.create(def);
})();
