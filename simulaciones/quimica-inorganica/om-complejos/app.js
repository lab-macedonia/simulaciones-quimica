/* Orbitales moleculares en complejos octaédricos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var LG = {
    br: { n: 'Br⁻', t: 'π-donor', d: 12300, c: 0xa0522d, nm: 'bromuro' }, cl: { n: 'Cl⁻', t: 'π-donor', d: 13600, c: 0x3ddc5a, nm: 'cloruro' }, f: { n: 'F⁻', t: 'π-donor', d: 15060, c: 0x7ee08a, nm: 'fluoruro' },
    h2o: { n: 'H₂O', t: 'σ (π-donor débil)', d: 17400, c: 0xff4d4d, nm: 'agua' }, nh3: { n: 'NH₃', t: 'σ puro', d: 21600, c: 0x4f7cff, nm: 'amoníaco' }, en: { n: 'en', t: 'σ puro', d: 21900, c: 0x4f7cff, nm: 'etilendiamina' },
    cn: { n: 'CN⁻', t: 'π-aceptor', d: 26600, c: 0x56606b, nm: 'cianuro' }, co: { n: 'CO', t: 'π-aceptor fuerte', d: 32200, c: 0x343a40, nm: 'carbonilo' }
  };
  var MF = { m2: { n: 'M²⁺ (3d)', g: 0.75 }, m3: { n: 'M³⁺ (3d)', g: 1.0 }, m4: { n: 'M³⁺ (4d/5d)', g: 1.5 } };
  var S = { L: 'h2o', mf: 'm3', n: 6, P: 21000, sel: 3, _st: -1, spin: 'auto' }, grp = null, orb = null, lv = [], lab = [], key_ = '', okey = '';
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function Do() { return LG[S.L].d * MF[S.mf].g; }
  function high() { return S.spin === 'hs' ? true : (S.spin === 'ls' ? false : Do() < S.P); }
  function dfill() { // devuelve [t2g slots, eg slots] como [arriba, abajo]
    var n = S.n, t = [[0, 0], [0, 0], [0, 0]], e = [[0, 0], [0, 0]], i;
    if (high()) { var order = [t[0], t[1], t[2], e[0], e[1]]; for (i = 0; i < Math.min(n, 5); i++) order[i][0] = 1; var rest = n - 5; for (i = 0; i < Math.min(rest, 5) && rest > 0; i++) order[i][1] = 1; }
    else { var nt = Math.min(n, 6), ne = n - nt; for (i = 0; i < Math.min(nt, 3); i++) t[i][0] = 1; for (i = 0; i < nt - 3; i++) t[i][1] = 1; for (i = 0; i < Math.min(ne, 2); i++) e[i][0] = 1; for (i = 0; i < ne - 2; i++) e[i][1] = 1; }
    return [t, e];
  }
  function stats() { var f = dfill(), un = 0, nt = 0, ne = 0; f[0].forEach(function (s) { nt += s[0] + s[1]; if (s[0] + s[1] === 1) un++; }); f[1].forEach(function (s) { ne += s[0] + s[1]; if (s[0] + s[1] === 1) un++; }); var lfse = (-0.4 * nt + 0.6 * ne) * Do(); return { un: un, nt: nt, ne: ne, lfse: lfse, mu: Math.sqrt(un * (un + 2)) }; }
  function lam() { return 1e7 / Do(); }
  function colorAbs(l) { var t = [[435, 'violeta', 'amarillo-verde'], [480, 'azul', 'amarillo'], [490, 'azul-verde', 'naranja'], [500, 'verde-azul', 'rojo'], [560, 'verde', 'púrpura'], [580, 'amarillo-verde', 'violeta'], [595, 'amarillo', 'azul'], [605, 'naranja', 'azul-verde'], [800, 'rojo', 'verde-azul']]; for (var i = 0; i < t.length; i++) if (l < t[i][0]) return [t[i][1], t[i][2]]; return ['infrarrojo', 'incoloro']; }
  function stages() {
    return [
      ['Orbitales del metal y SALC de ligandos', 'Orbitales', 'Metal: 3d, 4s, 4p · ligandos: 6 orbitales σ → combinaciones de simetría (SALC)',
        '<p>En un complejo octaédrico ML₆ el metal aporta <b>nueve orbitales</b>: <b>4s (a₁g)</b>, <b>4p (t₁u)</b> y <b>3d: e<sub>g</sub> (d<sub>z²</sub>, d<sub>x²−y²</sub>) y t₂g (d<sub>xy</sub>, d<sub>xz</sub>, d<sub>yz</sub>)</b>. Los seis ligandos aportan seis orbitales σ que se combinan en <b>SALC</b> (combinaciones lineales adaptadas por simetría) con simetrías <b>a₁g + e<sub>g</sub> + t₁u</b>. Solo los orbitales de igual simetría se mezclan.</p>'],
      ['Enlace σ y desdoblamiento Δo', 'Enlace σ', 'a₁g, t₁u y e_g enlazantes (12 e⁻ de los ligandos) · t₂g no enlazante · e_g* antienlazante',
        '<p>Los SALC σ se combinan con a₁g, t₁u y <b>e<sub>g</sub></b> del metal y originan MO <b>enlazantes</b> (con 12 e⁻ aportados por los ligandos) y <b>antienlazantes</b> (a₁g*, t₁u*, <b>e<sub>g</sub>*</b>). Los <b>t₂g</b>, sin ligandos que apunten a ellos, quedan <b>no enlazantes</b>. Los electrones d ocupan <b>t₂g</b> y <b>e<sub>g</sub>*</b>, separados por <b>Δ<sub>o</sub></b>: el mismo desdoblamiento de la teoría de campo cristalino, pero con origen en el enlace covalente σ.</p>'],
      ['Llenado: alto y bajo espín', 'Alto/bajo espín', 'Δo < P → alto espín · Δo > P → bajo espín (d⁴ a d⁷)',
        '<p>Para configuraciones <b>d⁴–d⁷</b> hay dos formas de llenar t₂g y e<sub>g</sub>*: <b>alto espín</b> (electrones desapareados repartidos, si <b>Δ<sub>o</sub> &lt; P</b>, la energía de apareamiento) o <b>bajo espín</b> (t₂g completo antes de e<sub>g</sub>*, si <b>Δ<sub>o</sub> &gt; P</b>). Cambia ligandos y metal en «Lab» y observa los electrones desapareados y el momento magnético μ<sub>s</sub> = √[n(n+2)] MB.</p>'],
      ['Ligandos π-donores', 'π-donores', 'Cl⁻, Br⁻, F⁻: sus pares π llenos suben los t₂g → Δo pequeño',
        '<p>Los ligandos con pares libres en orbitales p (<b>Cl⁻, Br⁻, F⁻, OH⁻</b>) pueden interaccionar de forma <b>π</b> con t₂g. Sus orbitales π están llenos y <b>más bajos</b> que t₂g: la interacción empuja el t₂g del metal <b>hacia arriba</b> (se hace π* antienlazante), <b>reduciendo Δ<sub>o</sub></b>. Resultan <b>ligandos de campo débil</b> y complejos de alto espín. Observa los lóbulos de los ligandos en fase opuesta.</p>'],
      ['Ligandos π-aceptores y serie espectroquímica', 'π-aceptores', 'CO, CN⁻: orbitales π* vacíos aceptan densidad de t₂g (retrodonación) → Δo grande',
        '<p>Los ligandos con <b>orbitales π* vacíos</b> (<b>CO, CN⁻</b>, fosfinas) reciben densidad electrónica desde t₂g (<b>retrodonación π</b>): t₂g baja de energía y <b>aumenta Δ<sub>o</sub></b>. Son ligandos de <b>campo fuerte</b> (bajo espín). <b>Serie espectroquímica</b>: <b>I⁻ &lt; Br⁻ &lt; Cl⁻ &lt; F⁻ &lt; OH⁻ &lt; H₂O &lt; NH₃ &lt; en &lt; NO₂⁻ &lt; CN⁻ &lt; CO</b>: de π-donores a σ puro a π-aceptores.</p>'],
      ['Color y magnetismo', 'Color y magnetismo', 'λ absorbida = 10⁷/Δo (nm) · color observado = complementario',
        '<p>La transición <b>t₂g → e<sub>g</sub>*</b> absorbe luz de energía Δ<sub>o</sub>: <b>λ (nm) = 10⁷ / Δ<sub>o</sub> (cm⁻¹)</b>. El complejo se ve del <b>color complementario</b> al absorbido. Ejemplos: [Cr(H₂O)₆]³⁺ (Δ<sub>o</sub> = 17 400 cm⁻¹, λ = 575 nm) es violeta; [Cr(CN)₆]³⁻ (26 600) absorbe en el violeta y es amarillo pálido. El <b>paramagnetismo</b> depende del número de electrones desapareados.</p>']
    ];
  }
  var SEG = [[['h2o', 'm3', 6, 'auto']], [['nh3', 'm3', 3, 'auto']], [['h2o', 'm3', 6, 'hs'], ['cn', 'm3', 6, 'auto'], ['f', 'm3', 5, 'auto'], ['nh3', 'm3', 6, 'auto']], [['cl', 'm3', 3, 'auto'], ['br', 'm3', 3, 'auto'], ['f', 'm3', 3, 'auto']], [['nh3', 'm3', 6, 'auto'], ['cn', 'm3', 6, 'auto'], ['co', 'm3', 6, 'auto']], [['h2o', 'm3', 3, 'auto'], ['nh3', 'm3', 3, 'auto'], ['cn', 'm3', 3, 'auto']]];
  var ORB = ['a1g', 't1u', 'eg', 't2g', 'egs', 'a1gs', 't1us'];
  var LV = function () { var dy = 3.1 * Math.min(1.2, Do() / 30000); return [{ k: 'a1g', nm: 'a₁g (σ)', y: 0.4, d: 1, a: 0 }, { k: 't1u', nm: 't₁u (σ)', y: 1.3, d: 3, a: 0 }, { k: 'eg', nm: 'e_g (σ)', y: 2.2, d: 2, a: 0 }, { k: 't2g', nm: 't₂g (d)', y: 3.8, d: 3, a: 0, nb: 1 }, { k: 'egs', nm: 'e_g* (σ*)', y: 3.8 + dy, d: 2, a: 1 }, { k: 'a1gs', nm: 'a₁g*', y: 8.0, d: 1, a: 1 }, { k: 't1us', nm: 't₁u*', y: 8.9, d: 3, a: 1 }]; };
  function lobe(g, x, y, z, sx, sy, sz, col, axis) { var m = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.62, roughness: 0.4, depthWrite: false })); m.scale.set(sx, sy, sz); m.position.set(x, y, z); if (axis) m.quaternion.setFromUnitVectors(V(0, 0, 1), axis.clone().normalize()); g.add(m); return m; }
  var BL = 0x4dabf7, RD = 0xff6b5e;
  function orbital(k) {
    var g = new T.Group(), ligs = [[3.4, 0, 0], [-3.4, 0, 0], [0, 3.4, 0], [0, -3.4, 0], [0, 0, 3.4], [0, 0, -3.4]], pi = LG[S.L].t.indexOf('donor') >= 0, acc = LG[S.L].t.indexOf('aceptor') >= 0;
    var mc = new T.Mesh(new T.SphereGeometry(0.4, 16, 12), new T.MeshStandardMaterial({ color: 0xffd43b })); g.add(mc);
    ligs.forEach(function (p) { var a = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), new T.MeshStandardMaterial({ color: LG[S.L].c })); a.position.set(p[0], p[1], p[2]); g.add(a); });
    function lig(i, col, sc) { var p = ligs[i], ax = V(p[0], p[1], p[2]); lobe(g, p[0] * 0.78, p[1] * 0.78, p[2] * 0.78, 0.5 * sc, 0.5 * sc, 0.95 * sc, col, ax); }
    var a = k.slice(-1) === 's' && k !== 't1us' ? 1 : (k === 't1us' ? 1 : 0);
    if (k === 'a1g' || k === 'a1gs') { lobe(g, 0, 0, 0, 1.0, 1.0, 1.0, BL); for (var i = 0; i < 6; i++) lig(i, k === 'a1g' ? BL : RD, 1); }
    else if (k === 't1u' || k === 't1us') { lobe(g, 0, 0, 1.3, 0.8, 0.8, 1.4, BL); lobe(g, 0, 0, -1.3, 0.8, 0.8, 1.4, RD); if (k === 't1u') { lig(4, BL, 1); lig(5, RD, 1); } else { lig(4, RD, 1); lig(5, BL, 1); } }
    else if (k === 'eg' || k === 'egs') { lobe(g, 0, 0, 1.4, 0.7, 0.7, 1.5, BL); lobe(g, 0, 0, -1.4, 0.7, 0.7, 1.5, BL); var tor = new T.Mesh(new T.TorusGeometry(1.15, 0.38, 12, 28), new T.MeshStandardMaterial({ color: RD, transparent: true, opacity: 0.6, depthWrite: false })); g.add(tor); var ph = k === 'eg' ? 1 : -1; lig(4, ph > 0 ? BL : RD, 1); lig(5, ph > 0 ? BL : RD, 1); [0, 1, 2, 3].forEach(function (i) { lig(i, ph > 0 ? RD : BL, 0.6); }); }
    else { // t2g (dxy)
      var s = 0.95; [[1, 1, BL], [-1, -1, BL], [1, -1, RD], [-1, 1, RD]].forEach(function (q) { lobe(g, q[0] * 0.95, q[1] * 0.95, 0, 0.55, 0.55, 1.15, q[2], V(q[0], q[1], 0)); });
      if (pi || acc) { var sg = acc ? 1 : -1; [[0, 1], [1, 1], [2, 0], [3, 0]].forEach(function (z) { }); // lóbulos π de los ligandos del plano xy
        [[3.4, 0, 0, 0, 1, 0, 1], [-3.4, 0, 0, 0, 1, 0, -1], [0, 3.4, 0, 1, 0, 0, -1], [0, -3.4, 0, 1, 0, 0, 1]].forEach(function (p) { var col = (p[6] * sg > 0) ? BL : RD, col2 = (p[6] * sg > 0) ? RD : BL; lobe(g, p[0] + p[3] * 0.7, p[1] + p[4] * 0.7, 0, 0.35, 0.35, 0.65, col, V(p[3], p[4], 0)); lobe(g, p[0] - p[3] * 0.7, p[1] - p[4] * 0.7, 0, 0.35, 0.35, 0.65, col2, V(p[3], p[4], 0)); }); }
    }
    return g;
  }
  function build3(ctx) {
    var s = ctx.scene; if (grp) s.remove(grp); grp = new T.Group(); lv = []; var L = LV(), mk = function (x, y, w, c, o) { var b = new T.Mesh(new T.BoxGeometry(w, 0.08, 0.08), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o || 1 })); b.position.set(x, y, 0); grp.add(b); return b; };
    L.forEach(function (l) { var obj = { l: l, ls: [], ar: [] }; for (var s2 = 0; s2 < l.d; s2++) { var x = -6.7 + (l.d === 3 ? (s2 - 1) * 0.9 : (l.d === 2 ? (s2 ? 0.5 : -0.5) : 0)); obj.ls.push(mk(x, l.y, 0.7, l.a ? 0xff8787 : (l.nb ? 0xadb5bd : 0x74c0fc))); for (var k = 0; k < 2; k++) { var cn = new T.Mesh(new T.ConeGeometry(0.14, 0.5, 8), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x665500 })); cn.position.set(x + (k ? 0.17 : -0.17), l.y + 0.3, 0); cn.rotation.z = k ? Math.PI : 0; grp.add(cn); obj.ar.push(cn); } } lv.push(obj); });
    [[-10.4, L[3].y + (L[4].y - L[3].y) * 0.45, '3d'], [-10.4, 6.0, '4s'], [-10.4, 6.9, '4p'], [-3.0, 1.1, 'σ lig.']].forEach(function (a) { mk(a[0], a[1], 1.2, 0x868e96, 0.6); });
    s.add(grp); key_ = [S.L, S.mf].join('|');
  }
  var def = {
    key: 'om-complejos', title: 'OM en complejos octaédricos', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#60a5fa', light: '#1d4ed8' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 4, 22], target: [0, 4, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 4, 23], target: [0, 4, 0] }, { id: 'orb', label: 'Orbital', pos: [7, 6, 10], target: [6, 4, 0] }],
    layers: [{ id: 'orb', label: 'Forma del orbital', icon: '☁' }, { id: 'e', label: 'Electrones', icon: '↑↓' }],
    build: function (ctx) { for (var i = 0; i < 9; i++) lab.push(ctx.label('', 'bl-d')); lab.t = ctx.label('', 'bl-lead'); lab.b = ctx.label('', 'bl-pos'); lab.c = ctx.label('', 'bl-d'); build3(ctx); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local, sq = SEG[i], n = sq.length, ix = Math.min(n - 1, Math.floor(l * n)), c = sq[ix]; S.L = c[0]; S.mf = c[1]; S.n = c[2]; S.spin = c[3];
        S.sel = i === 0 ? [0, 1, 2, 3][Math.min(3, Math.floor(l * 4))] : (i === 1 ? [0, 1, 2, 3, 4][Math.min(4, Math.floor(l * 5))] : (i === 3 || i === 4 ? 3 : 4));
        if (i === 2) S.n = [6, 6, 5, 6][ix];
      }
      if (key_ !== S.L + '|' + S.mf) { build3(ctx); }
      var Ls = LV(); lv.forEach(function (o, i) { o.ls.forEach(function (b) { b.position.y = Ls[i].y; }); o.ar.forEach(function (c, j) { c.position.y = Ls[i].y + 0.3; }); o.l.y = Ls[i].y; });
      var sel = Math.max(0, Math.min(6, S.sel)), okk = ORB[sel] + '|' + S.L; if (okey !== okk) { okey = okk; if (orb) ctx.scene.remove(orb); orb = orbital(ORB[sel]); orb.position.set(6.3, 4, 0); ctx.scene.add(orb); }
      var fi = dfill(), eOn = ctx.layer('e'); lv.forEach(function (o, i) { o.ls.forEach(function (b, s2) { var l = o.l; b.material.color.setHex(i === sel ? 0xffd43b : (l.a ? 0xff8787 : (l.nb ? 0xadb5bd : 0x74c0fc))); b.scale.y = i === sel ? 2.4 : 1; var sl = null; if (i < 3) sl = [1, 1]; else if (l.k === 't2g') sl = fi[0][s2]; else if (l.k === 'egs') sl = fi[1][s2]; else sl = [0, 0]; if (i < 3 && o.l.d === 1) sl = [1, 1]; o.ar[s2 * 2].visible = eOn && !!sl[0]; o.ar[s2 * 2 + 1].visible = eOn && !!sl[1]; }); });
      orb.visible = ctx.layer('orb'); orb.rotation.y = now * 0.35;
      Ls.forEach(function (l, i) { lab[i].pos(-6.7 + (l.d === 3 ? 2.3 : 1.8), l.y, 0).set(l.nm, i === sel ? 'bl-lead' : 'bl-d').vis(true); });
      var st = stats(), Dy = Ls[4].y;
      lab.t.pos(0, 11.2, 0).set('[M(' + LG[S.L].n + ')₆] · d' + S.n + ' · ' + (high() ? 'alto espín' : 'bajo espín'), 'bl-lead').vis(true);
      lab.b.pos(6.3, 8.2, 0).set(Ls[sel].nm + (Ls[sel].a ? ' (antienlazante)' : (Ls[sel].nb ? ' (no enlazante)' : ' (enlazante)')), Ls[sel].a ? 'bl-warn' : 'bl-pos').vis(true);
      lab.c.pos(-6.7, -1.0, 0).set('Δo = ' + fmt(Do(), 0) + ' cm⁻¹ · P = ' + fmt(S.P, 0) + ' cm⁻¹ · ' + st.un + ' e⁻ desapareados', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.L) u.L.set(S.L); if (u.mf) u.mf.set(S.mf); if (u.n) u.n.set(S.n); if (u.sel) u.sel.set(S.sel); if (u.spin) u.spin.set(S.spin); },
    hud: function () { var st = stats(); return { eq: { chip: 'Δo', name: 'ML₆ · ' + LG[S.L].n, body: '<div class="eqline"><small>Δo</small>' + fmt(Do(), 0) + ' cm⁻¹</div><div class="eqline"><small>Configuración</small>t₂g<sup>' + st.nt + '</sup> e_g*<sup>' + st.ne + '</sup></div><div class="eqline"><small>Desapareados</small>' + st.un + '</div><div class="eqline"><small>μ_s</small>' + f2(st.mu) + ' MB</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'fase +' }, { label: 'Rojo', color: '#ff6b5e', text: 'fase −' }, { label: '↑↓', color: '#ffd43b', text: 'electrón' }] }; },
    measures: function () { var st = stats(), l = lam(), c = colorAbs(l); return [['Ligando', LG[S.L].n + ' — ' + LG[S.L].t], ['Metal', MF[S.mf].n], ['Δo', fmt(Do(), 0) + ' cm⁻¹ (' + f1(Do() * 0.01196) + ' kJ/mol)'], ['Electrones d', 'd' + S.n], ['Espín', high() ? 'alto' : 'bajo'], ['e⁻ desapareados', String(st.un)], ['μ_s', f2(st.mu) + ' MB'], ['λ absorbida', fmt(l, 0) + ' nm (' + c[0] + ')'], ['Color observado', c[1]]]; },
    ideas: ['MO: a₁g, t₁u, e_g enlazantes σ · t₂g no enlazante · e_g* antienlazante.', 'Δo = e_g* − t₂g.', 'π-donor ⇒ Δo menor; π-aceptor ⇒ Δo mayor.', 'Δo &gt; P ⇒ bajo espín.', 'λ = 10⁷/Δo; color = complementario.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Complejo ML₆'); el.appendChild(c);
      ui.L = kit.ui.options({ label: 'Ligando', cols: 4, value: S.L, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n, sub: Math.round(LG[k].d / 100) / 10 + ' kK' }; }), onChange: function (v) { ctx.goManual(); S.L = v; } }); c.appendChild(ui.L);
      ui.mf = kit.ui.options({ label: 'Metal', cols: 3, value: S.mf, options: Object.keys(MF).map(function (k) { return { v: k, label: MF[k].n }; }), onChange: function (v) { ctx.goManual(); S.mf = v; } }); c.appendChild(ui.mf);
      ui.n = kit.ui.slider({ label: 'Electrones d', min: 0, max: 10, step: 1, value: S.n, format: function (v) { return 'd' + v; }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.P = kit.ui.slider({ label: 'Energía de apareamiento P (cm⁻¹)', min: 10000, max: 32000, step: 500, value: S.P, format: function (v) { return fmt(v, 0); }, onInput: function (v) { ctx.goManual(); S.P = v; } });
      ui.sel = kit.ui.slider({ label: 'Orbital mostrado', min: 0, max: 6, step: 1, value: S.sel, format: function (v) { return ['a₁g', 't₁u', 'e_g', 't₂g', 'e_g*', 'a₁g*', 't₁u*'][v]; }, onInput: function (v) { ctx.goManual(); S.sel = v; } }); c.appendChild(kit.ui.sliders([ui.n, ui.P, ui.sel]));
      ui.spin = kit.ui.options({ label: 'Espín', cols: 3, value: S.spin, options: [{ v: 'auto', label: 'Automático', sub: 'Δo frente a P' }, { v: 'hs', label: 'Alto' }, { v: 'ls', label: 'Bajo' }], onChange: function (v) { ctx.goManual(); S.spin = v; } }); c.appendChild(ui.spin);
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Serie espectroquímica ([Cr(L)₆]³⁺, cm⁻¹)', h: 230, note: 'π-donores: Δo pequeño · σ puro: medio · π-aceptores: grande.', draw: function (cx, w, h, col) {
        var ks = Object.keys(LG), L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ks.length, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 3; i++) { var y = Tp + ph - ph * i / 3; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i * 10 + 'k', L - 5, y + 3); }
        cx.textAlign = 'center'; ks.forEach(function (k, j) { var hh = ph * LG[k].d / 33000, cur = k === S.L; cx.fillStyle = LG[k].t.indexOf('donor') >= 0 ? '#fa5252' : (LG[k].t.indexOf('aceptor') >= 0 ? '#40c057' : '#4dabf7'); cx.globalAlpha = cur ? 1 : 0.65; cx.fillRect(L + j * bw + 4, Tp + ph - hh, bw - 8, hh); cx.globalAlpha = 1; cx.fillStyle = cur ? col.ink : col.muted; cx.fillText(LG[k].n, L + j * bw + bw / 2, h - B + 13); });
      } },
      { title: 'LFSE frente a nº de electrones d', h: 220, note: 'Estabilización del campo del ligando (en unidades de Δo), alto y bajo espín.', draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (n) { return L + pw * n / 10; }, sy = function (v) { return Tp + ph - ph * (v + 0.2) / 2.6; }, i;
        function lf(n, hs) { var nt, ne; if (hs) { nt = Math.min(n, 3) + Math.max(0, Math.min(n - 5, 3)); ne = Math.min(Math.max(n - 3, 0), 2) + Math.max(0, n - 8); } else { nt = Math.min(n, 6); ne = n - nt; } return 0.4 * nt - 0.6 * ne; }
        cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line; for (i = 0; i <= 2; i += 0.5) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(f1(i) + 'Δ', L - 5, sy(i) + 3); } cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText('d' + i, sx(i), h - B + 13);
        [['alto espín', true, '#fa5252'], ['bajo espín', false, '#4dabf7']].forEach(function (a, k) { cx.strokeStyle = a[2]; cx.lineWidth = (high() === a[1]) ? 3.2 : 1.6; cx.beginPath(); for (var n = 0; n <= 10; n++) { var v = lf(n, a[1]); if (n) cx.lineTo(sx(n), sy(v)); else cx.moveTo(sx(n), sy(v)); } cx.stroke(); cx.fillStyle = a[2]; cx.textAlign = 'left'; cx.fillText('● ' + a[0], L + 6 + k * 74, Tp + 10); }); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(S.n), sy(lf(S.n, high())), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, st = stats(), l = lam(), c = colorAbs(l);
      return '<div class="card-kicker">[M(' + LG[S.L].n + ')₆] · d' + S.n + '</div><div class="calc-step">1 · Desdoblamiento</div><table class="calc-table">' + row('Δo', LG[S.L].d + ' × ' + MF[S.mf].g + ' = <b>' + fmt(Do(), 0) + ' cm⁻¹</b> (' + f1(Do() * 0.01196) + ' kJ/mol)') + row('P', fmt(S.P, 0) + ' cm⁻¹ → ' + (Do() < S.P ? 'Δo &lt; P: alto espín' : 'Δo &gt; P: bajo espín')) + '</table>' +
        '<div class="calc-step">2 · Configuración y magnetismo</div><table class="calc-table">' + row('Configuración', 't₂g<sup>' + st.nt + '</sup> e_g*<sup>' + st.ne + '</sup>') + row('Desapareados', st.un) + row('μ_s', '√[n(n+2)] = <b>' + f2(st.mu) + ' MB</b>') + row('LFSE', f2((-0.4 * st.nt + 0.6 * st.ne)) + ' Δo = ' + fmt(st.lfse, 0) + ' cm⁻¹') + '</table><div class="calc-step">3 · Color</div><table class="calc-table">' + row('λ absorbida', '10⁷/' + fmt(Do(), 0) + ' = <b>' + fmt(l, 0) + ' nm</b> (' + c[0] + ')') + row('Color observado', '<b>' + c[1] + '</b>') + '</table>';
    },
    quiz: [
      { q: 'Los orbitales t₂g de un complejo octaédrico con ligandos sólo σ son…', options: ['no enlazantes', 'antienlazantes', 'enlazantes', 'vacíos'], answer: 0, why: 'Ningún ligando apunta hacia ellos.' },
      { q: 'Un ligando π-aceptor (CO) produce…', options: ['Δo grande', 'Δo pequeño', 'Δo igual', 'ninguna interacción'], answer: 0, why: 'La retrodonación estabiliza t₂g.' },
      { q: 'Un ligando π-donor (Cl⁻) hace que Δo…', options: ['disminuya', 'aumente', 'no cambie', 'se anule'], answer: 0, why: 'El t₂g sube al interaccionar con orbitales π llenos.' },
      { q: 'Si Δo > P, el complejo es…', options: ['de bajo espín', 'de alto espín', 'diamagnético siempre', 'tetraédrico'], answer: 0, why: 'Es más barato aparear que subir a e_g*.' },
      { q: '¿Cuántos electrones desapareados tiene un d⁶ de bajo espín?', options: ['0', '2', '4', '6'], answer: 0, why: 't₂g⁶: todos apareados.' },
      { q: 'La λ absorbida para Δo = 20 000 cm⁻¹ es…', options: ['500 nm', '200 nm', '2000 nm', '50 nm'], answer: 0, why: 'λ = 10⁷/20 000 = 500 nm.' },
      { q: '¿Cuántos electrones aportan los 6 ligandos σ al diagrama?', options: ['12', '6', '18', '10'], answer: 0, why: 'Un par por ligando.' },
      { q: 'Los MO enlazantes σ son…', options: ['a₁g, t₁u y e_g', 't₂g solamente', 'e_g* y t₁u*', 'a₁g* y e_g*'], answer: 0, why: 'Los 3 SALC σ se combinan con a₁g (s), t₁u (p) y e_g (d).' }
    ],
    help: { intro: 'Elige ligando, metal y número de electrones d; mueve «Orbital mostrado» para ver cada MO en 3D. Los lóbulos azul/rojo indican la fase.', items: [['Orbital 3D', 'lóbulos azul y rojo = fases; «Orbital mostrado» recorre los OM por energía.'], ['Escalera', 'a la izquierda, los niveles (a₁g, t₁u, e_g, t₂g, e_g*) con sus electrones; Δo es la separación entre t₂g y e_g*.'], ['Controles', '«Ligando» (π-donor, σ puro o π-aceptor), «Metal», «Electrones d», «Energía de apareamiento P» y «Espín» (automático, alto o bajo).'], ['Gráficos', '«Serie espectroquímica» y «LFSE frente a n.º de electrones d».']], try: ['Con d⁶, cambia de un π-donor a un π-aceptor: Δo crece y el complejo pasa a bajo espín.', 'Sube P por encima de Δo: vuelve a alto espín.', 'Relaciona Δo con el color: λ = 10⁷/Δo y se ve el color complementario.'] }
  };
  MSim.create(def);
})();
