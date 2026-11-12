/* Genética mendeliana y Hardy–Weinberg — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CR = { m1: { n: 'Aa × Aa', a: ['Aa'], b: ['Aa'] }, m2: { n: 'Aa × aa (cruce de prueba)', a: ['Aa'], b: ['aa'] }, m3: { n: 'AA × aa', a: ['AA'], b: ['aa'] }, d1: { n: 'AaBb × AaBb', a: ['Aa', 'Bb'], b: ['Aa', 'Bb'] }, d2: { n: 'AaBb × aabb (cruce de prueba)', a: ['Aa', 'Bb'], b: ['aa', 'bb'] }, d3: { n: 'AABB × aabb', a: ['AA', 'BB'], b: ['aa', 'bb'] } };
  var S = { cr: 'm1', mode: 'cross', n: 160, seed: 1, q0: 0.3, s: 0, N: 500, gen: 0 }, g = null, cells = [], pops = [], lab = [], gSph = null, gOct = null, cache = null;
  function loci(k) { return CR[k].a.length; }
  function gam(p) { var out = ['']; p.forEach(function (l) { var nx = []; out.forEach(function (o) { nx.push(o + l[0]); nx.push(o + l[1]); }); out = nx; }); var u = []; out.forEach(function (x) { if (u.indexOf(x) < 0) u.push(x); }); return CR[S.cr] && p.every(function (l) { return l[0] === l[1]; }) ? [out[0]] : (function () { var r = ['']; p.forEach(function (l) { var nx = []; r.forEach(function (o) { nx.push(o + l[0]); if (l[0] !== l[1]) nx.push(o + l[1]); }); r = nx; }); return r; })(); }
  function geno(g1, g2) { var s = ''; for (var i = 0; i < g1.length; i++) { var a = g1[i], b = g2[i]; s += (a === a.toUpperCase() ? a + b : (b === b.toUpperCase() ? b + a : a + b)); } return s; }
  function grid() { var c = CR[S.cr], g1 = gam(c.a), g2 = gam(c.b), rows = []; g2.forEach(function (y) { g1.forEach(function (x) { rows.push(geno(x, y)); }); }); return { g1: g1, g2: g2, cells: rows }; }
  function cls(gt) { var A = gt[0] === gt[0].toUpperCase() || gt[1] === gt[1].toUpperCase(); var a = (gt.slice(0, 2).toUpperCase() !== gt.slice(0, 2)) || gt.slice(0, 2) === gt.slice(0, 2).toUpperCase() ? (gt.slice(0, 2).toLowerCase() !== gt.slice(0, 2)) : false; var dA = /[A-Z]/.test(gt.slice(0, 2)); if (gt.length === 2) return dA ? 0 : 1; var dB = /[A-Z]/.test(gt.slice(2, 4)); return (dA ? 0 : 2) + (dB ? 0 : 1); }
  function names() { return loci(S.cr) === 1 ? ['Amarillo (dominante)', 'Verde (recesivo)'] : ['Amarillo liso', 'Amarillo rugoso', 'Verde liso', 'Verde rugoso']; }
  function expected() { var G = grid(), k = names().length, e = []; for (var i = 0; i < k; i++) e.push(0); G.cells.forEach(function (c) { e[cls(c)] += 1 / G.cells.length; }); return e; }
  function rng(i) { var x = Math.sin((i + S.seed * 977) * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function observed() { var G = grid(), k = names().length, o = []; for (var i = 0; i < k; i++) o.push(0); for (var j = 0; j < S.n; j++) { var c = G.cells[Math.floor(rng(j) * G.cells.length)]; o[cls(c)]++; } return o; }
  function erfc(x) { var t = 1 / (1 + 0.3275911 * x), y = ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592; return y * t * Math.exp(-x * x); }
  function chi() { var o = observed(), e = expected(), x = 0, df = -1; o.forEach(function (v, i) { if (e[i] > 0) { x += Math.pow(v - e[i] * S.n, 2) / (e[i] * S.n); df++; } }); var p = df === 1 ? erfc(Math.sqrt(x / 2)) : (df === 3 ? erfc(Math.sqrt(x / 2)) + Math.sqrt(2 * x / Math.PI) * Math.exp(-x / 2) : (df === 2 ? Math.exp(-x / 2) : 1)); return { x: x, df: df, p: Math.min(1, p), o: o, e: e }; }
  function traj() { var key = [S.q0, S.s, S.N, S.seed].join('|'); if (cache && cache.k === key) return cache.v; var q = S.q0, v = [q], i; for (i = 1; i <= 40; i++) { q = q * (1 - S.s * q) / (1 - S.s * q * q); if (S.N < 500) { var c = 0; for (var j = 0; j < 2 * S.N; j++) if (rng(i * 1000 + j) < q) c++; q = c / (2 * S.N); } v.push(q); } cache = { k: key, v: v }; return v; }
  function qn() { return traj()[Math.round(S.gen)]; }
  function stages() {
    return [
      ['Cuadro de Punnett monohíbrido', 'Monohíbrido', 'Aa × Aa → 3 dominante : 1 recesivo (1 AA : 2 Aa : 1 aa)',
        '<p>En un <b>cruce monohíbrido</b> cada progenitor Aa produce gametos A y a con igual probabilidad (<b>ley de la segregación</b>). El <b>cuadro de Punnett</b> combina los gametos: <b>1 AA : 2 Aa : 1 aa</b>, es decir <b>3 fenotipo dominante : 1 recesivo</b>. Los guisantes amarillos son dominantes sobre los verdes.</p>'],
      ['Cruce dihíbrido', 'Dihíbrido', 'AaBb × AaBb → 9 : 3 : 3 : 1',
        '<p>Con dos genes que se heredan <b>independientemente</b> (ley de la distribución independiente) cada progenitor AaBb forma cuatro gametos (AB, Ab, aB, ab). El cuadro tiene 16 casillas y da la proporción fenotípica <b>9 : 3 : 3 : 1</b>. Los cruces de prueba con el doble recesivo dan 1 : 1 : 1 : 1.</p>'],
      ['Prueba de χ²', 'χ²', 'Compara lo observado con lo esperado: χ² = Σ(O − E)²/E',
        '<p>Una muestra real nunca coincide exactamente con lo esperado. La prueba de <b>χ²</b> mide si la diferencia puede deberse al azar: <b>χ² = Σ (O − E)² / E</b> con gl = clases − 1. Si <b>p &gt; 0,05</b> los datos son compatibles con la proporción mendeliana. Cambia el tamaño de la muestra y la semilla.</p>'],
      ['Equilibrio de Hardy–Weinberg', 'Hardy–Weinberg', 'p² + 2pq + q² = 1 si no hay selección, deriva, mutación ni migración',
        '<p>En una población grande con apareamiento al azar y sin selección, mutación ni migración, las <b>frecuencias alélicas p y q</b> (p + q = 1) se mantienen y los genotipos siguen <b>p² + 2pq + q² = 1</b> desde la primera generación. Observa que q no cambia con las generaciones.</p>'],
      ['Selección y deriva', 'Selección y deriva', 'La selección cambia q de forma predecible; la deriva al azar, sobre todo en poblaciones pequeñas',
        '<p>Si los homocigotos recesivos tienen menor eficacia (selección <b>s</b>), q disminuye cada generación: <b>q′ = q(1 − s·q)/(1 − s·q²)</b>. En poblaciones <b>pequeñas</b> la <b>deriva genética</b> hace fluctuar q al azar y puede fijar o perder un alelo. Cambia s y el tamaño de la población.</p>']
    ];
  }
  var def = {
    key: 'genetica-mendel', title: 'Genética mendeliana y Hardy–Weinberg', subtitle: 'Simulador 3D · genética', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [22, 6, 24], target: [22, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [22, 0, 28], target: [22, 0, 0] }],
    layers: [{ id: 'pop', label: 'Población', icon: '◉' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i; gSph = new T.SphereGeometry(0.7, 14, 10); gOct = new T.OctahedronGeometry(0.75);
      for (i = 0; i < 16; i++) { var m = new T.Mesh(gSph, new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.5 })); g.add(m); cells.push(m); }
      for (i = 0; i < 50; i++) { var q = new T.Mesh(new T.SphereGeometry(0.25, 10, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(q); pops.push(q); }
      for (i = 0; i < 34; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.cr = 'm1'; S.mode = 'cross'; } if (i === 1) { S.cr = 'd1'; S.mode = 'cross'; } if (i === 2) { S.cr = f.local < 0.5 ? 'm1' : 'd1'; S.mode = 'cross'; S.n = 20 + Math.round(480 * f.local); } if (i === 3) { S.mode = 'hw'; S.s = 0; S.N = 500; S.q0 = 0.3; S.gen = 40 * f.local; } if (i === 4) { S.mode = 'hw'; S.s = f.local < 0.5 ? 0.5 : 0; S.N = f.local < 0.5 ? 500 : 20; S.gen = 40 * ((f.local * 2) % 1); } }
      var cross = S.mode === 'cross', G = grid(), nc = G.cells.length, side = G.g1.length, ncol = side, nrow = G.g2.length, cs = 2.3, x0 = 22, y0 = 5.5, L = 0, th = ctx.now;
      cells.forEach(function (m, j) { m.visible = cross && j < nc; if (!(cross && j < nc)) return; var gt = G.cells[j], c = j % ncol, r = Math.floor(j / ncol); m.position.set(x0 + c * cs, y0 - r * cs, 0); var k = cls(gt), ya = loci(S.cr) === 1 ? k === 0 : k < 2, ro = loci(S.cr) === 1 ? true : k % 2 === 0; m.material.color.setHex(ya ? 0xffd43b : 0x51cf66); m.geometry = ro ? gSph : gOct; m.rotation.y = th * 0.3; });
      var li = 0; function L2(x, y, t, cl) { if (li < lab.length) { lab[li].pos(x, y, 0).set(t, cl || 'bl-d').vis(true); li++; } }
      if (cross) {
        G.g1.forEach(function (x, c) { L2(x0 + c * cs, y0 + 1.5, '♂ ' + x, 'bl-lead'); }); G.g2.forEach(function (y, r) { L2(x0 - 2, y0 - r * cs, '♀ ' + y, 'bl-lead'); });
        G.cells.forEach(function (gt, j) { L2(x0 + (j % ncol) * cs, y0 - Math.floor(j / ncol) * cs - 1.1, gt, 'bl-d'); });
        var e = expected(), nm = names(); L2(26, y0 + 3.2, CR[S.cr].n + ' · ' + nm.map(function (x, k) { return fmt(e[k] * 100, 1) + ' % ' + x.toLowerCase(); }).slice(0, 4).join(' · ').slice(0, 60), 'bl-lead');
      } else { L2(28, 7.2, 'p = ' + fmt(1 - qn(), 3) + ' · q = ' + fmt(qn(), 3) + ' · generación ' + Math.round(S.gen), 'bl-lead'); }
      for (; li < lab.length; li++) lab[li].vis(false);
      var q = cross ? 0.5 : qn(), pp = 1 - q, nAA = Math.round(50 * pp * pp), nAa = Math.round(50 * 2 * pp * q);
      pops.forEach(function (o, j) { o.visible = ctx.layer('pop') && j < 50; var gt = j < nAA ? 0 : (j < nAA + nAa ? 1 : 2); o.material.color.setHex(gt === 0 ? 0x1c7ed6 : (gt === 1 ? 0x74c0fc : 0xffa94d)); o.position.set(21 + (j % 25) * 0.62, -3.8 - Math.floor(j / 25) * 0.7, 0); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cr) u.cr.set(S.cr); ['n', 'seed', 'q0', 's', 'N', 'gen'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var c = chi(), q = qn(), p = 1 - q; return { eq: { chip: S.mode === 'cross' ? 'χ²' : 'q', name: S.mode === 'cross' ? 'Muestra' : 'Población', body: S.mode === 'cross' ? '<div class="eqline"><small>χ²</small>' + fmt(c.x, 2) + '</div><div class="eqline"><small>gl</small>' + c.df + '</div><div class="eqline"><small>p</small>' + fmt(c.p, 3) + '</div>' : '<div class="eqline"><small>p · q</small>' + fmt(p, 3) + ' · ' + fmt(q, 3) + '</div><div class="eqline"><small>AA · Aa · aa</small>' + fmt(p * p, 3) + ' · ' + fmt(2 * p * q, 3) + ' · ' + fmt(q * q, 3) + '</div><div class="eqline"><small>Generación</small>' + Math.round(S.gen) + '</div>' }, legend: [{ label: 'Amarillo / verde', color: '#ffd43b', text: 'color de la semilla (A dominante)' }, { label: 'Esfera / octaedro', color: '#adb5bd', text: 'liso / rugoso (B dominante)' }] }; },
    measures: function () { var c = chi(), q = qn(), p = 1 - q; return [['Cruce', CR[S.cr].n], ['Casillas', String(grid().cells.length)], ['χ² (n = ' + S.n + ')', fmt(c.x, 2)], ['p-valor', fmt(c.p, 3)], ['Frecuencia de q', fmt(q, 3)], ['Genotipos AA · Aa · aa', fmt(p * p, 2) + ' · ' + fmt(2 * p * q, 2) + ' · ' + fmt(q * q, 2)]]; },
    ideas: ['Aa × Aa → 3 : 1.', 'AaBb × AaBb → 9 : 3 : 3 : 1.', 'p > 0,05 → compatible con lo esperado.', 'Hardy–Weinberg: p² + 2pq + q² = 1.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Cruce y muestra'); el.appendChild(c);
      ui.cr = kit.ui.options({ label: 'Cruce', cols: 1, value: S.cr, options: Object.keys(CR).map(function (k) { return { v: k, label: CR[k].n }; }), onChange: function (v) { ctx.goManual(); S.cr = v; S.mode = 'cross'; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; if (k === 'n' || k === 'seed') S.mode = 'cross'; else S.mode = 'hw'; } }); return ui[k]; }
      c.appendChild(ui.cr); c.appendChild(kit.ui.sliders([sl('n', 'Descendientes en la muestra', 10, 800, 10, function (v) { return String(v); }), sl('seed', 'Semilla', 1, 30, 1, function (v) { return String(v); })]));
      var d = kit.ui.card('Hardy–Weinberg'); el.appendChild(d);
      d.appendChild(kit.ui.sliders([sl('q0', 'Frecuencia inicial q (a)', 0.05, 0.95, 0.05, function (v) { return fmt(v, 2); }), sl('s', 'Selección contra aa (s)', 0, 1, 0.05, function (v) { return fmt(v, 2); }), sl('N', 'Tamaño de población (500 = infinito)', 10, 500, 10, function (v) { return v >= 500 ? '∞' : String(v); }), sl('gen', 'Generación', 0, 40, 1, function (v) { return String(Math.round(v)); })]));
      d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Observado frente a esperado', h: 210, note: 'Barras: observado. Marcas: esperado según Mendel.', draw: function (cx, w, h, col) {
      var c = chi(), nm = names(), L = 10, B = 40, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / nm.length, mx = Math.max.apply(0, c.o.concat(c.e.map(function (x) { return x * S.n; }))) * 1.1 || 1; cx.font = '10px system-ui'; cx.textAlign = 'center';
      c.o.forEach(function (v, k) { var hh = ph * v / mx; cx.fillStyle = '#69db7c'; cx.fillRect(L + k * bw + 8, Tp + ph - hh, bw - 16, hh); var ey = Tp + ph * (1 - c.e[k] * S.n / mx); cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L + k * bw + 4, ey); cx.lineTo(L + (k + 1) * bw - 4, ey); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.muted; cx.fillText(String(v), L + k * bw + bw / 2, Tp + ph - hh - 3); cx.fillText(nm[k].replace(' (dominante)', '').replace(' (recesivo)', ''), L + k * bw + bw / 2, h - 18); });
    } }, { title: 'Frecuencia de q por generación', h: 190, note: 'Con selección q baja; con deriva fluctúa al azar.', draw: function (cx, w, h, col) {
      var v = traj(), L = 30, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); v.forEach(function (q, k) { var x = L + pw * k / 40, y = Tp + ph * (1 - q); k ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      var k2 = Math.round(S.gen); cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * k2 / 40, Tp + ph * (1 - v[k2]), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('40 gen.', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('1', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph);
    } }],
    calc: function () { var c = chi(), nm = names(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, q = qn(), p = 1 - q, det = c.o.map(function (v, k) { return nm[k] + ': O = ' + v + ', E = ' + fmt(c.e[k] * S.n, 1); }).join('<br>'); return '<div class="card-kicker">' + CR[S.cr].n + '</div><table class="calc-table">' + row('Clases fenotípicas', det) + row('χ²', '<b>' + fmt(c.x, 2) + '</b> · gl = ' + c.df) + row('p-valor', '<b>' + fmt(c.p, 3) + '</b> → ' + (c.p > 0.05 ? 'compatible con lo esperado' : 'se rechaza lo esperado')) + row('Hardy–Weinberg', 'p = ' + fmt(p, 3) + ' · q = ' + fmt(q, 3) + '<br>p² + 2pq + q² = ' + fmt(p * p, 3) + ' + ' + fmt(2 * p * q, 3) + ' + ' + fmt(q * q, 3) + ' = ' + fmt(p * p + 2 * p * q + q * q, 3)) + '</table>'; },
    quiz: [
      { q: 'El cruce Aa × Aa produce la proporción fenotípica…', options: ['3 : 1', '1 : 1', '9 : 3 : 3 : 1', '1 : 2 : 1'], answer: 0, why: '1 AA : 2 Aa : 1 aa.' },
      { q: 'El cruce AaBb × AaBb (genes independientes) produce…', options: ['9 : 3 : 3 : 1', '3 : 1', '1 : 1 : 1 : 1', '1 : 2 : 1'], answer: 0, why: '16 casillas.' },
      { q: 'Si q = 0,3 en equilibrio, la frecuencia de aa es…', options: ['0,09', '0,30', '0,42', '0,49'], answer: 0, why: 'q² = 0,09.' },
      { q: 'Un valor de p > 0,05 en la prueba de χ² indica que…', options: ['los datos son compatibles con la proporción esperada', 'la proporción es falsa', 'hay selección', 'el rasgo es ligado al sexo'], answer: 0, why: 'La diferencia puede deberse al azar.' },
      { q: 'La deriva genética es más fuerte en…', options: ['poblaciones pequeñas', 'poblaciones grandes', 'poblaciones sin variación', 'ninguna'], answer: 0, why: 'El muestreo de gametos varía más.' },
      { q: 'El cruce de prueba de un dominante usa un individuo…', options: ['homocigoto recesivo', 'heterocigoto', 'homocigoto dominante', 'haploide'], answer: 0, why: 'Revela el genotipo desconocido.' }
    ],
    help: { intro: 'Elige un cruce para ver el cuadro de Punnett con semillas amarillas/verdes y lisas/rugosas. En «Lab» ajusta la muestra para la prueba de χ² y los parámetros de Hardy–Weinberg.', items: [['Cuadro de Punnett', 'la cuadrícula cruza los gametos de ambos progenitores; cada semilla muestra el color (amarillo = A dominante, verde = aa) y la forma (esfera = lisa, B dominante; octaedro = rugosa).'], ['Población', 'las esferas pequeñas son individuos AA, Aa y aa para Hardy–Weinberg (capa «Población»).'], ['«Cruce» y muestra', 'elige el cruce mono- o dihíbrido; «Descendientes en la muestra» y «Semilla» generan los datos observados para la prueba de χ².'], ['Hardy–Weinberg', '«Frecuencia inicial q (a)», «Selección contra aa (s)», «Tamaño de población» y «Generación» muestran cómo cambia q con el tiempo.'], ['Gráficos', '«Observado frente a esperado» (χ²) y «Frecuencia de q por generación».']], try: ['Cruza Aa × Aa y comprueba la proporción 3 : 1; luego el dihíbrido, 9 : 3 : 3 : 1.', 'Reduce los descendientes de la muestra: la proporción observada se aleja más de la esperada.', 'Con selección 0, compara una población de 500 (= infinita) con una pequeña: sólo en la pequeña q fluctúa por deriva.'] }
  };
  MSim.create(def);
})();
