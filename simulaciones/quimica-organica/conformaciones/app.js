/* Conformaciones: Newman y silla — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length; var cat = false; if (el === 'C' && s[i] === '+') { cat = true; i++; }
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, cat: cat, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
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
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - (n.cat ? 1 : 0) - sum); }
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
  var fmt = SimKit.fmt, R = 8.314, SC = 2.1, PI = Math.PI;
  var XS = { H: { t: 'H', A: 0, L: 1.09, c: 0xf2f2f2, r: 0.31, n: 'hidrógeno' }, F: { t: 'F', A: 0.15, L: 1.35, c: 0x7ee08a, r: 0.6, n: 'flúor' }, Cl: { t: 'Cl', A: 0.43, L: 1.77, c: 0x3ddc5a, r: 0.95, n: 'cloro' }, Br: { t: 'Br', A: 0.38, L: 1.94, c: 0xa0522d, r: 1.1, n: 'bromo' }, OH: { t: 'OH', A: 0.87, L: 1.43, c: 0xff4d4d, r: 0.65, n: 'hidroxilo' }, CH3: { t: 'CH₃', A: 1.74, L: 1.53, c: 0x56606b, r: 0.8, n: 'metilo' }, tBu: { t: 'C(CH₃)₃', A: 4.9, L: 1.55, c: 0x3b4450, r: 1.15, n: 'terc-butilo' } };
  var S = { mode: 'ring', phi: 60, T: 298, X: 'CH3', t: 0, tTarget: null, spin: false, but: false, axes: true };
  // ajuste cosenoidal del butano: puntos (φ, E kJ/mol)
  var BC = (function () { var pts = [[0, 19], [60, 3.8], [120, 16], [180, 0]], A = [], y = []; pts.forEach(function (p) { var f = p[0] * PI / 180; A.push([1, Math.cos(f), Math.cos(2 * f), Math.cos(3 * f)]); y.push(p[1]); });
    for (var i = 0; i < 4; i++) { var m = i; for (var r = i + 1; r < 4; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r; var tA = A[i]; A[i] = A[m]; A[m] = tA; var ty = y[i]; y[i] = y[m]; y[m] = ty; for (r = i + 1; r < 4; r++) { var q = A[r][i] / A[i][i]; for (var c = i; c < 4; c++) A[r][c] -= q * A[i][c]; y[r] -= q * y[i]; } }
    var x = [0, 0, 0, 0]; for (i = 3; i >= 0; i--) { var s = y[i]; for (var j = i + 1; j < 4; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x; })();
  function Eeth(p) { return 6 * (1 + Math.cos(3 * p * PI / 180)); }
  function Ebut(p) { var f = p * PI / 180; return Math.max(0, BC[0] + BC[1] * Math.cos(f) + BC[2] * Math.cos(2 * f) + BC[3] * Math.cos(3 * f)); }
  function Ephi(p) { return S.but ? Ebut(p) : Eeth(p); }
  function mod(p) { return ((p % 360) + 360) % 360; }
  function nameConf(p) { p = mod(p); var near = function (a, w) { var d = Math.abs(mod(p - a + 180) - 180); return d < w; };
    if (!S.but) return near(0, 6) || near(120, 6) || near(240, 6) ? 'Eclipsada' : (near(60, 6) || near(180, 6) || near(300, 6) ? 'Escalonada' : 'Intermedia (sesgada)');
    if (near(180, 6)) return 'Anti (escalonada, mínimo global)'; if (near(60, 6) || near(300, 6)) return 'Gauche (escalonada)'; if (near(0, 6)) return 'Eclipsada CH₃/CH₃ (máximo)'; if (near(120, 6) || near(240, 6)) return 'Eclipsada CH₃/H'; return 'Intermedia (sesgada)'; }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function dGring() { return XS[S.X].A * 4.184; }
  function ringEnergy(t) { var kp = [[0, 0], [0.15, 45], [0.3, 23], [0.5, 29], [0.7, 23], [0.85, 45], [1, 0]], i = 0; while (i < kp.length - 2 && t > kp[i + 1][0]) i++; var a = kp[i], b = kp[i + 1], u = (t - a[0]) / (b[0] - a[0]); u = smooth(u); var base = a[1] + (b[1] - a[1]) * u; if (t <= 0.15 || t >= 0.85) base = a[1] + (b[1] - a[1]) * u; return base + dGring() * smooth((t - 0.2) / 0.6); }
  function pctEq() { return 100 / (1 + Math.exp(-dGring() * 1000 / (R * S.T))); }

  var gE = {}, gR, rg = {}, labs = {}, dum;
  function cyl(T, col, rad) { var m = new T.Mesh(new T.CylinderGeometry(rad || 0.09, rad || 0.09, 1, 8), new T.MeshStandardMaterial({ color: col || 0xbfc7d1, roughness: 0.5 })); m.userData.bond = true; return m; }
  function setBond(T, m, p, q) { var d = q.clone().sub(p), L = d.length(); m.scale.set(1, L, 1); m.position.copy(p).add(q).multiplyScalar(0.5); if (L > 1e-6) m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
  function atom(T, g, col, r, p) { var m = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: col, roughness: 0.35 })); m.scale.setScalar(r); if (p) m.position.copy(p); g.add(m); return m; }
  function buildEth(ctx, but) {
    var T = ctx.T, g = new T.Group(), L = 1.54 * SC, front = new T.Group(), rear = new T.Group(); g.add(front); g.add(rear);
    var cF = new T.Vector3(-L / 2, 0, 0), cR = new T.Vector3(L / 2, 0, 0); atom(T, front, 0x56606b, 0.46, cF); atom(T, rear, 0x56606b, 0.46, cR);
    function subs(grp, c0, sign, ang0) {
      for (var i = 0; i < 3; i++) { var a = (ang0 + 120 * i) * PI / 180, dir = new T.Vector3(sign * 0.334, Math.cos(a) * 0.943, Math.sin(a) * 0.943), isM = but && i === 0, len = (isM ? 1.54 : 1.09) * SC, p = c0.clone().add(dir.clone().multiplyScalar(len));
        var b = cyl(T); setBond(T, b, c0, p); grp.add(b);
        if (isM) { atom(T, grp, 0x56606b, 0.46, p); for (var h = 0; h < 3; h++) { var ha = h * 120 * PI / 180, hd = dir.clone().multiplyScalar(0.334 * 0).add(new T.Vector3(sign * 0.334, 0, 0)); var u = dir.clone(), w1 = new T.Vector3(0, 0, 1).cross(u).normalize(), w2 = u.clone().cross(w1).normalize(), d2 = u.clone().multiplyScalar(0.334).add(w1.clone().multiplyScalar(0.943 * Math.cos(ha))).add(w2.clone().multiplyScalar(0.943 * Math.sin(ha))), hp = p.clone().add(d2.multiplyScalar(1.09 * SC)); var hb = cyl(T); setBond(T, hb, p, hp); grp.add(hb); atom(T, grp, 0xf2f2f2, 0.27, hp); } }
        else atom(T, grp, 0xf2f2f2, 0.27, p);
      }
    }
    subs(front, cF, -1, 0); subs(rear, cR, 1, 0);
    var cb = cyl(T, 0x9aa5b1, 0.1); setBond(T, cb, cF, cR); g.add(cb); g.userData.rear = rear; return g;
  }
  function buildRing(ctx) {
    var T = ctx.T, g = new T.Group(); rg.C = []; rg.Cb = []; rg.U = []; rg.D = []; rg.Ub = []; rg.Db = []; rg.dia = [];
    for (var k = 0; k < 6; k++) { rg.C.push(atom(T, g, 0x56606b, 0.48)); var b = cyl(T, 0xbfc7d1, 0.1); g.add(b); rg.Cb.push(b);
      rg.U.push(atom(T, g, 0xf2f2f2, 0.27)); rg.D.push(atom(T, g, 0xf2f2f2, 0.27)); var b1 = cyl(T); g.add(b1); rg.Ub.push(b1); var b2 = cyl(T); g.add(b2); rg.Db.push(b2); }
    rg.X = atom(T, g, 0x56606b, 0.8); rg.Xb = cyl(T, 0xbfc7d1, 0.13); g.add(rg.Xb);
    for (k = 0; k < 2; k++) { var d = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 8), new T.MeshBasicMaterial({ color: 0xff6b3d, transparent: true, opacity: 0.8 })); g.add(d); rg.dia.push(d); }
    return g;
  }
  function ringFrame(ctx) {
    var T = ctx.T, t = S.t, cs = Math.cos(PI * t), sn = Math.sin(PI * t), r = 1.446 * SC, z0 = 0.25 * SC, bump = [1, -0.2, -0.2, 1, -0.2, -0.2], q = smooth(t), P = [], hl = ctx.layer('axes') && S.axes;
    for (var k = 0; k < 6; k++) { var ang = k * PI / 3, sg = k % 2 ? -1 : 1; P.push(new T.Vector3(r * Math.cos(ang), z0 * sg * cs * 1 + 0.55 * SC * sn * bump[k] * 0.45, r * Math.sin(ang))); }
    // ring en plano XZ (eje y vertical)
    for (k = 0; k < 6; k++) {
      var rad = new T.Vector3(Math.cos(k * PI / 3), 0, Math.sin(k * PI / 3)), sg2 = k % 2 ? -1 : 1, up = new T.Vector3(0, 1, 0);
      var ax0 = up.clone().multiplyScalar(sg2), eq0 = rad.clone().multiplyScalar(0.943).add(up.clone().multiplyScalar(-0.334 * sg2));
      var ax1 = up.clone().multiplyScalar(-sg2), eq1 = rad.clone().multiplyScalar(0.943).add(up.clone().multiplyScalar(0.334 * sg2));
      // U (arriba en t=0) pasa de ax0→eq1 si sg2=+1; D pasa de eq0→ax1
      var Us = sg2 > 0 ? ax0 : eq0, Ue = sg2 > 0 ? eq1 : ax1, Ds = sg2 > 0 ? eq0 : ax0, De = sg2 > 0 ? ax1 : eq1;
      var Ud = Us.clone().lerp(Ue, q).normalize(), Dd = Ds.clone().lerp(De, q).normalize();
      var c = P[k]; rg.C[k].position.copy(c); var n = P[(k + 1) % 6]; setBond(T, rg.Cb[k], c, n);
      var xk = k === 0 ? S.X : 'H', xd = k === 0 ? XS[xk] : XS.H;
      // el X está en la posición ecuatorial en t=0 -> es la D (k=0 es par: eq0 = D)
      var Hu = c.clone().add(Ud.clone().multiplyScalar(1.09 * SC)), Hd = c.clone().add(Dd.clone().multiplyScalar(1.09 * SC));
      rg.U[k].position.copy(Hu); setBond(T, rg.Ub[k], c, Hu); rg.D[k].position.copy(Hd); setBond(T, rg.Db[k], c, Hd);
      rg.U[k].material.color.setHex(0xf2f2f2); rg.D[k].material.color.setHex(0xf2f2f2);
      var uAx = Math.abs(Ud.y) > 0.8, dAx = Math.abs(Dd.y) > 0.8;
      if (hl) { if (uAx) rg.U[k].material.color.setHex(0xffa94d); if (dAx) rg.D[k].material.color.setHex(0xffa94d); }
      rg.U[k].visible = true; rg.D[k].visible = !(k === 0 && S.X !== 'H'); rg.Db[k].visible = rg.D[k].visible; if (k === 0) { rg.Dd0 = Dd; }
      rg.Ud = rg.Ud || []; rg.Ud[k] = Ud; rg.Dd = rg.Dd || []; rg.Dd[k] = Dd;
    }
    var X = XS[S.X], c0 = P[0], xp = c0.clone().add(rg.Dd[0].clone().multiplyScalar(X.L * SC)); rg.X.visible = S.X !== 'H'; rg.Xb.visible = rg.X.visible; rg.X.position.copy(xp); rg.X.scale.setScalar(X.r * 0.9); rg.X.material.color.setHex(X.c); setBond(T, rg.Xb, c0, xp);
    var xAx = Math.abs(rg.Dd[0].y) > 0.8 && rg.X.visible, show = xAx && ctx.layer('dia');
    [2, 4].forEach(function (k, i) { var up = rg.Ud[k], dn = rg.Dd[k], useU = Math.sign(rg.Dd[0].y) === Math.sign(up.y) ? true : false, tgt = (useU ? rg.U[k] : rg.D[k]).position; rg.dia[i].visible = show; if (show) setBond(T, rg.dia[i], xp, tgt); });
    rg.xAx = xAx; rg.P = P; rg.Pc = P;
  }
  function stages() {
    return [
      ['Rotación del enlace C–C', 'Rotación', 'Los confórmeros se interconvierten por giro de enlaces sencillos', '<p>Los enlaces σ C–C permiten el <b>giro libre</b>. Las distintas disposiciones espaciales obtenidas al girar se llaman <b>conformaciones</b>. En el etano, el giro de un metilo respecto del otro alterna entre la disposición <b>escalonada</b> (más estable) y la <b>eclipsada</b> (menos estable).</p>'],
      ['Newman y energía', 'Newman', 'Proyección de Newman: eclipsada +12 kJ/mol', '<p>En la <b>proyección de Newman</b> miramos a lo largo del enlace C–C: el carbono delantero es el punto central y el trasero el círculo. La barrera de giro del etano es ≈ <b>12 kJ/mol</b>, atribuida a la <b>repulsión torsional</b> (y a hiperconjugación σC–H→σ*C–H en la escalonada). Se cruza miles de millones de veces por segundo a 25 °C.</p>'],
      ['Butano', 'Butano', 'Anti, gauche y eclipsadas: la tensión estérica', '<p>En el butano (giro del enlace C2–C3) aparecen más mínimos y máximos: <b>anti</b> (CH₃ a 180°, el más estable, 0), <b>gauche</b> (±60°, +3,8 kJ/mol por <b>tensión estérica</b>), eclipsada CH₃/H (≈ +16 kJ/mol) y eclipsada CH₃/CH₃ (≈ +19 kJ/mol, máximo).</p>'],
      ['Ciclohexano: silla', 'Silla', 'La silla sin tensión: posiciones axiales y ecuatoriales', '<p>El ciclohexano adopta la <b>conformación de silla</b>: sin tensión angular (≈ 111°) ni torsional (todo escalonado). Cada carbono tiene un sustituyente <b>axial</b> (paralelo al eje, en naranja) y uno <b>ecuatorial</b> (hacia fuera del anillo). Axiales y ecuatoriales se alternan arriba/abajo.</p>'],
      ['Inversión de la silla', 'Inversión', 'Al invertir la silla, axial ↔ ecuatorial', '<p>La <b>inversión de silla</b> convierte una silla en la otra pasando por semisilla (≈ 45 kJ/mol), bote torcido y bote. Todos los sustituyentes axiales pasan a ecuatoriales y viceversa. A 25 °C ocurre ~10⁵ veces por segundo; la barrera es ≈ 45 kJ/mol.</p>'],
      ['Metilciclohexano', 'A-value', 'Un sustituyente voluminoso prefiere la posición ecuatorial', '<p>Axial, el metilo choca con los H axiales de C3 y C5 (<b>interacciones 1,3-diaxiales</b>, líneas naranja), ≈ <b>7,3 kJ/mol</b> (A = 1,74 kcal/mol). Resultado: en el equilibrio ≈ <b>95 %</b> de las moléculas tienen el metilo ecuatorial (ΔG = −RT ln K).</p>'],
      ['terc-Butilo: anclado', 'Anclaje', 'El grupo terc-butilo «ancla» la conformación', '<p>El A-value del <b>terc-butilo</b> es ≈ 4,9 kcal/mol (≈ 20 kJ/mol): la conformación con t-Bu axial prácticamente no existe (&lt; 0,01 %). El anillo queda <b>bloqueado</b> con t-Bu ecuatorial; se usa como grupo director en estudios de reactividad estereoelectrónica.</p>']
    ];
  }
  var PATHS = [
    { mode: 'eth', but: false, v: 'libre' }, { mode: 'eth', but: false, v: 'newman' }, { mode: 'eth', but: true, v: 'newman' }, { mode: 'ring', X: 'H', t: 0, v: 'ring' }, { mode: 'ring', X: 'H', t: 1, v: 'ring' }, { mode: 'ring', X: 'CH3', t: 1, v: 'ring' }, { mode: 'ring', X: 'tBu', t: 1, v: 'ring' }
  ];
  var def = {
    key: 'conformaciones', title: 'Conformaciones: Newman y silla', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#a3e635', light: '#4d7c0f' },
    stages: stages, nStages: 7, dur: 11, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [9, 5, 12], target: [0, 0, 0] }, { id: 'newman', label: 'Newman (a lo largo de C–C)', pos: [-19, 0, 0], target: [0, 0, 0] }, { id: 'ring', label: 'Anillo', pos: [2, 4, 14], target: [0, 0, 0] }, { id: 'lado', label: 'Lateral', pos: [0, 1, 13], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 15, 3], target: [0, 0, 0] }],
    layers: [{ id: 'axes', label: 'Axiales', icon: '↕' }, { id: 'dia', label: '1,3-diaxial', icon: '⚡' }],
    build: function (ctx) {
      var s = ctx.scene; gE.eth = buildEth(ctx, false); gE.but = buildEth(ctx, true); gR = buildRing(ctx); s.add(gE.eth); s.add(gE.but); s.add(gR);
      labs.a = ctx.label('', 'bl-lead'); labs.b = ctx.label('', 'bl-d'); labs.c = ctx.label('', 'bl-warn');
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var p = PATHS[f.i], u = ctx.ease(f.local); if (S._st !== f.i) { S._st = f.i; S.mode = p.mode; if (p.X) S.X = p.X; S.but = !!p.but; if (p.t != null) S.t = p.t; } if (S.mode === 'eth') S.phi = mod((f.i === 0 ? 360 : 360) * f.local * (f.i === 1 ? 1 : 1)); else if (f.i === 4) S.t = u; else if (f.i === 5 || f.i === 6) S.t = f.local < .5 ? 0 : 1, S.t = smooth((f.local - 0.15) / 0.5); else if (f.i === 3) S.t = 0; }
      else { if (S.spin && S.mode === 'eth') S.phi = mod(S.phi + dt * 40); if (S.tTarget != null) { var d = S.tTarget - S.t; if (Math.abs(d) < 0.01) { S.t = S.tTarget; S.tTarget = null; } else S.t += Math.sign(d) * Math.min(Math.abs(d), dt * 0.45); } }
      var ring = S.mode === 'ring'; gE.eth.visible = !ring && !S.but; gE.but.visible = !ring && S.but; gR.visible = ring;
      if (!ring) { var g = S.but ? gE.but : gE.eth; g.userData.rear.rotation.x = S.phi * PI / 180; var E = Ephi(S.phi), nm = nameConf(S.phi); labs.a.pos(0, 5.2, 0).set(nm, 'bl-lead').vis(true); labs.b.pos(0, -4.8, 0).set('φ = ' + fmt(S.phi, 0) + '° · E = ' + fmt(E, 1) + ' kJ/mol', 'bl-d').vis(true); labs.c.vis(false); }
      else { ringFrame(ctx); var ax = S.t < 0.5, ch = S.t < 0.18 ? 'Silla A' : (S.t > 0.82 ? 'Silla B (invertida)' : 'Inversión (semisilla / bote torcido)'); labs.a.pos(0, 4.6, 0).set(ch, 'bl-lead').vis(true); labs.b.pos(0, -4.4, 0).set(S.X === 'H' ? 'Ciclohexano · E = ' + fmt(ringEnergy(S.t), 1) + ' kJ/mol' : XS[S.X].n + 'ciclohexano · E = ' + fmt(ringEnergy(S.t), 1) + ' kJ/mol · ' + (rg.xAx ? 'sustituyente AXIAL' : 'sustituyente ecuatorial'), 'bl-d').vis(true); labs.c.pos(rg.X.position.x, rg.X.position.y + 1.2, rg.X.position.z).set(XS[S.X].t, 'bl-warn').vis(S.X !== 'H'); }
    },
    onStage: function (i, ctx) { ctx.view(PATHS[i].v); },
    sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual || !u.sphi) return; u.sphi.set(S.phi); u.st.set(S.t * 100); u.mode && u.mode.set(S.mode === 'ring' ? 'ring' : (S.but ? 'but' : 'eth')); u.x && u.x.set(S.X); },
    hud: function () { var ring = S.mode === 'ring'; if (!ring) return { eq: { chip: S.but ? 'Butano' : 'Etano', name: nameConf(S.phi), body: '<div class="eqline"><small>Ángulo diedro φ</small>' + fmt(S.phi, 0) + '°</div><div class="eqline"><small>Energía relativa</small>' + fmt(Ephi(S.phi), 1) + ' kJ/mol</div>' }, legend: [{ label: 'Delantero', color: '#9aa5b1', text: 'C1 (fijo)' }, { label: 'Trasero', color: '#9aa5b1', text: 'C2 (gira φ)' }] };
      return { eq: { chip: 'Silla', name: S.X === 'H' ? 'Ciclohexano' : XS[S.X].n + 'ciclohexano', body: '<div class="eqline"><small>Energía (camino)</small>' + fmt(ringEnergy(S.t), 1) + ' kJ/mol</div><div class="eqline"><small>ΔG axial−ecuat.</small>' + (S.X === 'H' ? '—' : fmt(dGring(), 1) + ' kJ/mol') + '</div><div class="eqline"><small>% ecuatorial (' + S.T + ' K)</small>' + (S.X === 'H' ? '50' : fmt(pctEq(), 2)) + ' %</div>' }, legend: [{ label: 'H axial', color: '#ffa94d', text: 'paralelo al eje' }, { label: 'H ecuat.', color: '#f2f2f2', text: 'hacia fuera' }, { label: '1,3-diaxial', color: '#ff6b3d', text: 'repulsión X···H' }] }; },
    measures: function () { if (S.mode !== 'ring') return [['Molécula', S.but ? 'butano (C2–C3)' : 'etano'], ['φ', fmt(S.phi, 0) + '°'], ['Conformación', nameConf(S.phi)], ['E relativa', fmt(Ephi(S.phi), 1) + ' kJ/mol'], ['Barrera de giro', S.but ? '≈ 19 kJ/mol (anti→eclipsada)' : '12 kJ/mol']];
      return [['Sustituyente', XS[S.X].t], ['A-value', fmt(XS[S.X].A, 2) + ' kcal/mol'], ['ΔG° (ax−eq)', fmt(dGring(), 2) + ' kJ/mol'], ['% ecuatorial', S.X === 'H' ? '50 %' : fmt(pctEq(), 2) + ' %'], ['Posición actual', rg && rg.xAx ? 'axial' : 'ecuatorial'], ['E camino', fmt(ringEnergy(S.t), 1) + ' kJ/mol'], ['Barrera inversión', '≈ 45 kJ/mol']]; },
    ideas: ['<b>Escalonada</b> más estable que <b>eclipsada</b> (etano: 12 kJ/mol).', 'Butano: <b>anti</b> &lt; <b>gauche</b> (+3,8) &lt; eclipsadas (16 y 19 kJ/mol).', '<b>Silla</b>: sin tensión; 6 H axiales y 6 ecuatoriales.', 'Inversión: <b>axial ↔ ecuatorial</b>; barrera ≈ 45 kJ/mol.', '<b>A-value</b>: preferencia ecuatorial por interacciones 1,3-diaxiales.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Panel de control'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Sistema', cols: 3, value: S.mode === 'ring' ? 'ring' : (S.but ? 'but' : 'eth'), options: [{ v: 'eth', label: 'Etano', sub: 'Newman' }, { v: 'but', label: 'Butano', sub: 'Newman' }, { v: 'ring', label: 'Ciclohexano', sub: 'silla' }], onChange: function (v) { ctx.goManual(); S.mode = v === 'ring' ? 'ring' : 'eth'; S.but = v === 'but'; ctx.view(v === 'ring' ? 'ring' : 'libre'); } });
      c.appendChild(ui.mode);
      ui.sphi = kit.ui.slider({ label: 'Ángulo diedro φ', min: 0, max: 359, step: 1, value: S.phi, format: function (v) { return v + '°'; }, onInput: function (v) { ctx.goManual(); S.mode = S.mode === 'ring' ? 'eth' : S.mode; S.phi = +v; S.spin = false; } });
      ui.st = kit.ui.slider({ label: 'Inversión de silla', min: 0, max: 100, step: 1, value: 0, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'ring'; S.t = v / 100; S.tTarget = null; } });
      ui.sT = kit.ui.slider({ label: 'T', min: 200, max: 400, step: 1, value: S.T, format: function (v) { return v + ' K'; }, onInput: function (v) { ctx.goManual(); S.T = +v; } });
      c.appendChild(kit.ui.sliders([ui.sphi, ui.st, ui.sT]));
      ui.x = kit.ui.options({ label: 'Sustituyente en C1 (anillo)', cols: 4, value: S.X, options: Object.keys(XS).map(function (k) { return { v: k, label: XS[k].t, sub: XS[k].A + '' }; }), onChange: function (v) { ctx.goManual(); S.X = v; S.mode = 'ring'; } });
      c.appendChild(ui.x);
      c.appendChild(ctx.btnRow([{ t: 'Girar φ (auto)', fn: function () { ctx.goManual(); S.mode = S.mode === 'ring' ? 'eth' : S.mode; S.spin = !S.spin; } }, { t: 'Vista Newman', fn: function () { ctx.goManual(); if (S.mode === 'ring') S.mode = 'eth'; ctx.view('newman'); } }, { t: 'Invertir silla', primary: true, fn: function () { ctx.goManual(); S.mode = 'ring'; S.tTarget = S.t < 0.5 ? 1 : 0; ctx.view('ring'); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', '<p class="muted small">A-values (kcal/mol): H 0 · F 0,15 · Br 0,38 · Cl 0,43 · OH 0,87 · CH₃ 1,74 · t-Bu ≈ 4,9. ΔG° = A × 4,184 kJ/mol; K = e<sup>ΔG°/RT</sup>.</p>');
    },
    graphs: [{ title: 'Perfil de energía', h: 250, note: 'Etano/butano: E frente al ángulo diedro. Ciclohexano: coordenada de inversión (silla → semisilla → bote torcido → bote → …). El punto marca el estado actual.', draw: function (cx, w, h, c) {
      var L = 46, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, ring = S.mode === 'ring', i, n = 180, mx = ring ? 50 + dGring() : (S.but ? 22 : 14), xs = function (v) { return L + pw * v; }, ys = function (e) { return Tp + ph - ph * e / mx; };
      cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(mx * i / 4, 0), L - 5, y + 3); }
      cx.textAlign = 'center'; cx.fillText(ring ? 'coordenada de inversión' : 'ángulo diedro φ (°)  ·  eje y: E (kJ/mol)', L + pw / 2, h - 3); if (!ring) for (i = 0; i <= 6; i++) cx.fillText(i * 60, xs(i / 6), h - B + 12);
      cx.strokeStyle = '#84cc16'; cx.lineWidth = 2.6; cx.beginPath(); for (i = 0; i <= n; i++) { var v = i / n, e = ring ? ringEnergy(v) : Ephi(v * 360); if (i === 0) cx.moveTo(xs(v), ys(e)); else cx.lineTo(xs(v), ys(e)); } cx.stroke(); cx.lineWidth = 1;
      var vv = ring ? S.t : mod(S.phi) / 360, ee = ring ? ringEnergy(S.t) : Ephi(S.phi); cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(xs(vv), ys(ee), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      if (ring) { cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText('silla', xs(0.02), ys(0) - 8); cx.fillText('silla', xs(0.97), ys(dGring()) - 8); cx.fillText('semisilla', xs(0.15), ys(45) - 6); cx.fillText('bote', xs(0.5), ys(29 + dGring() * 0.5) - 8); } } },
      { title: 'A-values y equilibrio axial/ecuatorial', h: 220, note: 'Barras: A-value (kcal/mol). Resaltado: sustituyente actual; a la derecha % ecuatorial a la T elegida.', draw: function (cx, w, h, c) {
        var ks = Object.keys(XS), L = 8, Tp = 10, B = 14, ph = (h - Tp - B) / ks.length, sc = (w - 190) / 5.2;
        cx.font = '11px system-ui'; ks.forEach(function (k, i) { var y = Tp + i * ph + 2, A = XS[k].A, sel = k === S.X; cx.globalAlpha = sel ? 1 : 0.5; cx.fillStyle = sel ? '#84cc16' : '#9aa7b4'; cx.fillRect(70, y, Math.max(2, A * sc), ph - 6); cx.globalAlpha = 1; cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText(XS[k].t, 64, y + ph / 2 + 1); cx.textAlign = 'left'; cx.fillText(fmt(A, 2) + ' · ' + fmt(100 / (1 + Math.exp(-A * 4184 / (R * S.T))), 1) + ' % eq', 74 + A * sc, y + ph / 2 + 1); }); } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      if (S.mode !== 'ring') return '<div class="calc-step">1 · Energía torsional (φ = ' + fmt(S.phi, 0) + '°)</div><table class="calc-table">' + row(S.but ? 'E(φ) butano' : 'E(φ) = 6(1 + cos 3φ)', '<b>' + fmt(Ephi(S.phi), 2) + ' kJ/mol</b>') + row('Conformación', nameConf(S.phi)) + row('Barrera', S.but ? 'anti → eclipsada CH₃/CH₃: 19 kJ/mol' : 'escalonada → eclipsada: 12 kJ/mol') + row('Población relativa (298 K)', 'e<sup>−E/RT</sup> = ' + MSim.sci(Math.exp(-Ephi(S.phi) * 1000 / (R * 298)), 3)) + '</table>';
      var dG = dGring(), K = Math.exp(dG * 1000 / (R * S.T));
      return '<div class="calc-step">1 · Sustituyente ' + XS[S.X].t + '</div><table class="calc-table">' + row('A-value', fmt(XS[S.X].A, 2) + ' kcal/mol') + row('ΔG° = A × 4,184', '<b>' + fmt(dG, 2) + ' kJ/mol</b>') + '</table><div class="calc-step">2 · Equilibrio a ' + S.T + ' K</div><table class="calc-table">' + row('K = e<sup>ΔG°/RT</sup>', MSim.sci(K, 3) + ' ([ec]/[ax])') + row('% ecuatorial', '<b>' + fmt(100 * K / (1 + K), 3) + ' %</b>') + row('% axial', fmt(100 / (1 + K), 3) + ' %') + '</table><div class="calc-step">3 · Barrera de inversión</div><table class="calc-table">' + row('ΔG‡ ≈ 45 kJ/mol', 'k = (k<sub>B</sub>T/h)·e<sup>−ΔG‡/RT</sup> ≈ ' + MSim.sci(1.38e-23 * S.T / 6.626e-34 * Math.exp(-45000 / (R * S.T)), 2) + ' s⁻¹') + '</table>';
    },
    quiz: [
      { q: '¿Cuál es la conformación más estable del etano?', options: ['Escalonada', 'Eclipsada', 'Ambas igual', 'Bote'], answer: 0, why: 'En la escalonada los enlaces C–H están a 60° (mínima repulsión torsional).' },
      { q: 'La barrera de rotación del etano es aproximadamente…', options: ['12 kJ/mol', '120 kJ/mol', '1,2 kJ/mol', '45 kJ/mol'], answer: 0, why: 'Son ≈ 12 kJ/mol (≈ 3 kcal/mol), fácil de superar a temperatura ambiente.' },
      { q: 'En el butano (C2–C3), el confórmero más estable es…', options: ['Anti', 'Gauche', 'Eclipsado CH₃/H', 'Eclipsado CH₃/CH₃'], answer: 0, why: 'En el anti los grupos metilo están a 180°, sin tensión estérica.' },
      { q: 'El confórmero gauche del butano está a unos… sobre el anti.', options: ['3,8 kJ/mol', '19 kJ/mol', '0 kJ/mol', '45 kJ/mol'], answer: 0, why: 'Tensión estérica entre los CH₃ a 60°: ≈ 0,9 kcal/mol = 3,8 kJ/mol.' },
      { q: '¿Qué conformación del ciclohexano carece de tensión angular y torsional?', options: ['Silla', 'Bote', 'Bote torcido', 'Semisilla'], answer: 0, why: 'La silla tiene ángulos ≈ 111° y todos los enlaces escalonados.' },
      { q: 'Al invertir la silla, un sustituyente ecuatorial pasa a ser…', options: ['axial', 'ecuatorial', 'eclipsado', 'cis'], answer: 0, why: 'La inversión intercambia axial y ecuatorial en todos los carbonos.' },
      { q: 'El metilciclohexano prefiere el metilo ecuatorial porque…', options: ['evita interacciones 1,3-diaxiales con H axiales', 'el metilo es polar', 'el anillo es plano', 'evita el puente de hidrógeno'], answer: 0, why: 'Axial, el CH₃ choca con los H axiales de C3 y C5 (≈ 7,3 kJ/mol).' },
      { q: '¿Qué sustituyente tiene mayor A-value?', options: ['terc-butilo', 'metilo', 'OH', 'Cl'], answer: 0, why: 'El t-Bu (≈ 4,9 kcal/mol) es el más voluminoso: ancla la conformación con él ecuatorial.' }
    ],
    help: { intro: 'Elige etano, butano o ciclohexano en «Lab». Usa «Vista Newman» para mirar a lo largo del enlace C–C.', items: [['φ', 'ángulo diedro entre los grupos del carbono delantero y del trasero.'], ['Naranja', 'H axiales; las líneas naranja son las interacciones 1,3-diaxiales.'], ['Inversión', 'mueve el anillo por semisilla y bote torcido.'], ['Gráficos', 'perfil de energía y A-values.'], ['Controles', '«Sistema» (etano, butano o ciclohexano), «Ángulo diedro φ», «Inversión de silla», T y «Sustituyente en C1»; botones «Girar φ (auto)», «Vista Newman» e «Invertir silla».']], try: ['En el butano gira φ: la conformación anti (180°) es la más estable y la gauche (60°) está 3,8 kJ/mol por encima.', 'En el ciclohexano pon un terc-butilo e invierte la silla: queda casi siempre ecuatorial.', 'Usa la vista Newman en el etano y compara escalonada con eclipsada (12 kJ/mol).'] }
  };
  MSim.create(def);
})();
