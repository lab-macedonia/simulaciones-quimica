/* Nomenclatura y fórmulas de complejos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { '+': '⁺', '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴' };
  function sub(n) { return String(n).split('').map(function (c) { return SUB[+c]; }).join(''); }
  var MT = {
    Co: { n: 'cobalto', a: 'cobaltato', c: 0xe64980, ox: [2, 3] }, Fe: { n: 'hierro', a: 'ferrato', c: 0xe8590c, ox: [2, 3] }, Cr: { n: 'cromo', a: 'cromato', c: 0x7048e8, ox: [2, 3] },
    Ni: { n: 'níquel', a: 'niquelato', c: 0x2f9e44, ox: [0, 2] }, Cu: { n: 'cobre', a: 'cuprato', c: 0x1098ad, ox: [1, 2] }, Pt: { n: 'platino', a: 'platinato', c: 0x868e96, ox: [2, 4] },
    Zn: { n: 'cinc', a: 'cincato', c: 0x7d80b0, ox: [2] }, Ag: { n: 'plata', a: 'argentato', c: 0xced4da, ox: [1] }, Mn: { n: 'manganeso', a: 'manganato', c: 0xcc5de8, ox: [2, 3] }
  };
  var LG = {
    h2o: { n: 'acuo', f: 'H₂O', q: 0, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: 'agua' }, nh3: { n: 'amin', f: 'NH₃', q: 0, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: 'amoníaco' },
    cl: { n: 'cloro', f: 'Cl', q: -1, d: 1, a: 'Cl', c: 0x3ddc5a, cx: 0, nm: 'cloruro' }, br: { n: 'bromo', f: 'Br', q: -1, d: 1, a: 'Br', c: 0xa0522d, cx: 0, nm: 'bromuro' },
    f: { n: 'fluoro', f: 'F', q: -1, d: 1, a: 'F', c: 0x7ee08a, cx: 0, nm: 'fluoruro' }, cn: { n: 'ciano', f: 'CN', q: -1, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: 'cianuro' },
    oh: { n: 'hidroxo', f: 'OH', q: -1, d: 1, a: 'O', c: 0xff4d4d, cx: 0, nm: 'hidróxido' }, co: { n: 'carbonil', f: 'CO', q: 0, d: 1, a: 'C', c: 0x56606b, cx: 0, nm: 'monóxido de carbono' },
    no2: { n: 'nitro', f: 'NO₂', q: -1, d: 1, a: 'N', c: 0x4f7cff, cx: 0, nm: 'nitrito (N)' }, scn: { n: 'tiocianato', f: 'SCN', q: -1, d: 1, a: 'S', c: 0xe6c229, cx: 0, nm: 'tiocianato (S)' },
    en: { n: 'etilendiamina', f: 'en', q: 0, d: 2, a: 'N,N', c: 0x4f7cff, cx: 1, nm: 'etano-1,2-diamina' }, ox: { n: 'oxalato', f: 'ox', q: -2, d: 2, a: 'O,O', c: 0xff4d4d, cx: 1, nm: 'oxalato' }
  };
  var PRE = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'], PRX = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis'], ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var PRESETS = [
    { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Fe', ox: 2, A: 'cn', nA: 6, B: 'cl', nB: 0, g: 'oct' }, { m: 'Cu', ox: 2, A: 'nh3', nA: 4, B: 'cl', nB: 0, g: 'sp' },
    { m: 'Pt', ox: 2, A: 'cl', nA: 2, B: 'nh3', nB: 2, g: 'sp' }, { m: 'Cr', ox: 3, A: 'en', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Ni', ox: 0, A: 'co', nA: 4, B: 'cl', nB: 0, g: 'tet' },
    { m: 'Ag', ox: 1, A: 'nh3', nA: 2, B: 'cl', nB: 0, g: 'lin' }, { m: 'Co', ox: 3, A: 'nh3', nA: 5, B: 'cl', nB: 1, g: 'oct' }, { m: 'Fe', ox: 3, A: 'ox', nA: 3, B: 'cl', nB: 0, g: 'oct' }, { m: 'Co', ox: 2, A: 'cl', nA: 4, B: 'cl', nB: 0, g: 'tet' }
  ];
  var S = { m: 'Co', ox: 3, A: 'nh3', nA: 6, B: 'cl', nB: 0, g: 'oct', _st: -1 }, lab = [], gr = null, ligLab = [];
  function cn() { return S.nA * LG[S.A].d + S.nB * LG[S.B].d; }
  function charge() { return S.ox + S.nA * LG[S.A].q + S.nB * LG[S.B].q; }
  function sup(q) { var a = Math.abs(q); return q === 0 ? '' : (a === 1 ? '' : SUP[a]) + (q > 0 ? '⁺' : '⁻'); }
  function parts() {
    var L = []; if (S.nA > 0) L.push({ id: S.A, n: S.nA }); if (S.nB > 0 && S.B !== S.A) L.push({ id: S.B, n: S.nB }); else if (S.nB > 0 && S.B === S.A) L[0].n += S.nB;
    return L;
  }
  function name() {
    var L = parts(), q = charge(), m = MT[S.m], base;
    L.sort(function (a, b) { return LG[a.id].n.localeCompare(LG[b.id].n, 'es'); });
    var ln = L.map(function (l) { var g = LG[l.id], pre = l.n > 1 ? (g.cx ? PRX[l.n] : PRE[l.n]) : ''; return pre + (g.cx ? '(' + g.n + ')' : g.n); }).join('');
    var met = (q < 0 ? m.a : m.n) + '(' + ROM[S.ox] + ')';
    var nm = (ln + met).replace('aa', 'aa');
    if (q > 0) { var an = q === 1 ? 'cloruro' : 'cloruro'; return an + ' de ' + nm; }
    if (q < 0) return nm + ' de potasio';
    return nm;
  }
  function formula() {
    var L = parts(), q = charge();
    L.sort(function (a, b) { var A = LG[a.id], B = LG[b.id]; if (A.q !== B.q) return A.q < B.q ? -1 : 1; return A.f.localeCompare(B.f); });
    var f = S.m + L.map(function (l) { var g = LG[l.id], poly = g.f.replace(/[^A-Z]/g, '').length > 1 || g.f.length > 2 || g.cx; return l.n > 1 ? (poly ? '(' + g.f + ')' : g.f) + sub(l.n) : (poly ? '(' + g.f + ')' : g.f); }).join('');
    var s = '[' + f + ']' + (q === 0 ? '' : '');
    if (q > 0) s += 'Cl' + (q > 1 ? sub(q) : ''); else if (q < 0) s = 'K' + (q < -1 ? sub(-q) : '') + s;
    return s;
  }
  function valid() { var c = cn(); return c === 2 || c === 4 || c === 6; }
  function verts(g, R) {
    if (g === 'lin') return [[R, 0, 0], [-R, 0, 0]];
    if (g === 'tet') { var k = R / Math.sqrt(3); return [[k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]]; }
    if (g === 'sp') return [[R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R]];
    return [[R, 0, 0], [-R, 0, 0], [0, R, 0], [0, -R, 0], [0, 0, R], [0, 0, -R]];
  }
  var PAIRS = { oct: [[0, 2], [1, 4], [3, 5]], tet: [[0, 1], [2, 3]], sp: [[0, 1], [2, 3]] };
  function geomFor() { var c = cn(); return c === 2 ? 'lin' : (c === 6 ? 'oct' : (S.g === 'sp' ? 'sp' : 'tet')); }
  function gname(g) { return { lin: 'lineal', tet: 'tetraédrica', sp: 'plana cuadrada', oct: 'octaédrica' }[g]; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ['Átomo central y ligandos', 'Estructura', 'Un complejo = metal central + ligandos unidos por enlaces coordinados',
        '<p>Un <b>complejo</b> (compuesto de coordinación) tiene un <b>átomo o ion metálico central</b> rodeado de <b>ligandos</b>, que donan un par de electrones al metal (enlace covalente coordinado). El <b>índice de coordinación</b> es el número de átomos donadores unidos al metal: <b>2 (lineal), 4 (tetraédrico o plano cuadrado), 6 (octaédrico)</b>. Los corchetes encierran la esfera de coordinación: <b>[Co(NH₃)₆]³⁺</b>.</p>'],
      ['Tipos de ligandos', 'Ligandos', 'Monodentados (1 átomo donor) y polidentados o quelatos (2 o más)',
        '<p>Un ligando <b>monodentado</b> se une por un solo átomo (H₂O, NH₃, Cl⁻, CN⁻). Un <b>bidentado</b> se une por dos (etilendiamina <b>en</b>: NH₂CH₂CH₂NH₂; oxalato <b>ox</b>: C₂O₄²⁻) y forma un <b>quelato</b> (anillo), más estable. Cuentan para el índice de coordinación según su <b>denticidad</b>: [Cr(en)₃]³⁺ tiene 3 × 2 = 6 donores. Los ligandos pueden ser neutros o aniónicos, y esto afecta la carga total.</p>'],
      ['Carga y número de oxidación', 'Carga', 'Carga del complejo = n.º de oxidación del metal + suma de cargas de los ligandos',
        '<p>La <b>carga del complejo</b> es la suma del <b>número de oxidación del metal</b> y las cargas de los ligandos. Ejemplos: [Co(NH₃)₆]: Co³⁺ + 6·0 = <b>3+</b>; [Fe(CN)₆]: Fe²⁺ + 6·(−1) = <b>4−</b>; [PtCl₂(NH₃)₂]: Pt²⁺ + 2·(−1) + 2·0 = <b>0</b>. Si el complejo es catión se asocia a aniones (Cl⁻); si es anión, a cationes (K⁺) para neutralizar la carga de la sal.</p>'],
      ['Cómo nombrar un complejo', 'Nombrar', 'Ligandos en orden alfabético + metal con n.º de oxidación en romanos',
        '<p>Reglas: (1) primero los <b>ligandos</b>, en <b>orden alfabético</b> (se ignora el prefijo numérico); (2) <b>prefijos di-, tri-, tetra-, penta-, hexa-</b> para ligandos simples y <b>bis-, tris-, tetrakis-</b> (con paréntesis) para ligandos complejos o quelatos; (3) luego el <b>metal</b> con su <b>número de oxidación</b> en romanos entre paréntesis. Ligandos: H₂O = <i>acuo</i>, NH₃ = <i>amin</i>, Cl⁻ = <i>cloro</i>, CN⁻ = <i>ciano</i>, OH⁻ = <i>hidroxo</i>, CO = <i>carbonilo</i>.</p>'],
      ['Complejos aniónicos y sales', 'Aniones y sales', 'Si el complejo es un anión, el metal termina en -ato',
        '<p>Un complejo <b>aniónico</b> se nombra con la terminación <b>-ato</b> en el metal (<b>ferrato, cobaltato, cuprato, niquelato, platinato, argentato…</b>), y el catión se cita después: <b>hexacianoferrato(II) de potasio</b>, K₄[Fe(CN)₆]. Un complejo <b>catiónico</b> mantiene el nombre del metal y el anión se cita primero: <b>cloruro de hexaamincobalto(III)</b>. Los complejos neutros se nombran sin más: tetracarbonilníquel(0).</p>'],
      ['Fórmula y práctica', 'Fórmula', 'Fórmula: metal primero, luego ligandos aniónicos y neutros en orden alfabético',
        '<p>En la fórmula, el símbolo del <b>metal</b> va primero; después los ligandos (aniónicos y luego neutros, cada grupo por orden alfabético), con paréntesis si el ligando es poliatómico. Todo entre corchetes con la carga arriba a la derecha. En «Lab» crea tus propios complejos: si la suma de donores no es 2, 4 o 6 el simulador lo advierte; también puedes cargar los ejemplos clásicos.</p>']
    ];
  }
  var SEGP = [[0, 7, 3], [0, 4, 8], [0, 1, 3], [0, 3, 4, 8], [1, 3, 9, 4], [2, 3, 5, 6]];
  var def = {
    key: 'nomenclatura-complejos', title: 'Nomenclatura de complejos', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 5, 12], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 13], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 13, 1], target: [0, 0, 0] }],
    layers: [{ id: 'lab', label: 'Etiquetas de ligandos', icon: 'L' }, { id: 'bond', label: 'Enlaces', icon: '─' }],
    build: function (ctx) { for (var i = 0; i < 6; i++) ligLab.push(ctx.label('', 'bl-d')); ['t', 'a', 'b'].forEach(function (k) { lab.push(ctx.label('', 'bl-d')); }); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) { var sq = SEGP[f.i], n = sq.length, ix = sq[Math.min(n - 1, Math.floor(f.local * n))], p = PRESETS[ix]; if (S._pi !== ix) { S._pi = ix; Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }
      var key = [S.m, S.A, S.nA, S.B, S.nB, S.g, valid()].join('|'); if (key !== S._k) { S._k = key; rebuild(ctx); }
      if (gr) gr.rotation.y = now * 0.3;
      var q = charge(), nmv = valid() ? name() : '(índice de coordinación no válido: ' + cn() + ')', fv = valid() ? formula() : '—';
      lab[0].pos(0, 5.6, 0).set(nmv, valid() ? 'bl-lead' : 'bl-warn').vis(true); lab[1].pos(0, -5.2, 0).set(fv, 'bl-pos').vis(true);
      lab[2].pos(0, -6.2, 0).set('IC = ' + cn() + ' · ' + (valid() ? gname(geomFor()) : '—') + ' · carga ' + (q > 0 ? '+' : '') + q + ' · n.º de oxidación ' + ROM[S.ox], 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['m', 'A', 'B', 'g'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); ['nA', 'nB', 'ox'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'IC', name: valid() ? formula().replace(/^K\S*?\[/, '[').replace(/\].*$/, ']') + sup(charge()) : 'Complejo no válido', body: '<div class="eqline"><small>Metal</small>' + MT[S.m].n + '</div><div class="eqline"><small>Índice de coordinación</small>' + cn() + '</div><div class="eqline"><small>Geometría</small>' + (valid() ? gname(geomFor()) : '—') + '</div><div class="eqline"><small>Carga</small>' + charge() + '</div>' }, legend: [{ label: 'Esfera central', color: '#' + ('000000' + MT[S.m].c.toString(16)).slice(-6), text: 'ion metálico' }, { label: 'Esferas', color: '#4f7cff', text: 'átomos donores' }] }; },
    measures: function () { return [['Nombre', valid() ? name() : '—'], ['Fórmula', valid() ? formula() : '—'], ['Metal', MT[S.m].n + ' (' + ROM[S.ox] + ')'], ['Ligando A', LG[S.A].nm + ' × ' + S.nA], ['Ligando B', S.nB ? LG[S.B].nm + ' × ' + S.nB : '—'], ['Índice de coordinación', String(cn())], ['Carga del complejo', String(charge())]]; },
    ideas: ['Carga = n.º de oxidación + Σ cargas de ligandos.', 'Ligandos por orden alfabético; di-/tri- (simples), bis-/tris- (complejos).', 'Complejo aniónico: metal en -ato (ferrato, cuprato…).', 'Índice de coordinación = átomos donores (denticidad × n.º de ligandos).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Construir complejo'); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Metal', cols: 5, value: S.m, options: Object.keys(MT).map(function (k) { return { v: k, label: k }; }), onChange: function (v) { ctx.goManual(); S.m = v; if (MT[v].ox.indexOf(S.ox) < 0) S.ox = MT[v].ox[0]; } }); c.appendChild(ui.m);
      ui.ox = kit.ui.slider({ label: 'Número de oxidación', min: 0, max: 4, step: 1, value: S.ox, format: function (v) { return ROM[v]; }, onInput: function (v) { ctx.goManual(); S.ox = v; } });
      ui.A = kit.ui.options({ label: 'Ligando A', cols: 4, value: S.A, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : 'neutro' }; }), onChange: function (v) { ctx.goManual(); S.A = v; } }); c.appendChild(ui.A);
      ui.nA = kit.ui.slider({ label: 'Cantidad de A', min: 0, max: 6, step: 1, value: S.nA, format: function (v) { return v + ' × ' + LG[S.A].f; }, onInput: function (v) { ctx.goManual(); S.nA = v; } });
      ui.B = kit.ui.options({ label: 'Ligando B', cols: 4, value: S.B, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].f, sub: LG[k].q ? LG[k].q + '' : 'neutro' }; }), onChange: function (v) { ctx.goManual(); S.B = v; } }); c.appendChild(ui.B);
      ui.nB = kit.ui.slider({ label: 'Cantidad de B', min: 0, max: 6, step: 1, value: S.nB, format: function (v) { return v + ' × ' + LG[S.B].f; }, onInput: function (v) { ctx.goManual(); S.nB = v; } });
      c.appendChild(kit.ui.sliders([ui.ox, ui.nA, ui.nB]));
      ui.g = kit.ui.options({ label: 'Geometría (IC = 4)', cols: 2, value: S.g, options: [{ v: 'tet', label: 'Tetraédrica' }, { v: 'sp', label: 'Plana cuadrada' }], onChange: function (v) { ctx.goManual(); S.g = v; } }); c.appendChild(ui.g);
      var ex = kit.ui.card('Ejemplos clásicos'); el.appendChild(ex);
      ex.appendChild(ctx.btnRow(PRESETS.map(function (p, i) { return { t: (function () { var o = {}; Object.keys(S).forEach(function (k) { o[k] = S[k]; }); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); var f = formula(); Object.keys(o).forEach(function (k) { S[k] = o[k]; }); return f.replace(/K\S*\[/, '['); })(), fn: function () { ctx.goManual(); Object.keys(p).forEach(function (k) { S[k] = p[k]; }); } }; })));
      el.appendChild(document.createElement('div')); ex.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Ligandos comunes', h: 270, note: 'Nombre en el complejo, carga y denticidad. Los usados aparecen resaltados.', draw: function (cx, w, h, col) {
        var ks = Object.keys(LG), rh = (h - 22) / ks.length; cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText('ligando', 10, 13); cx.fillText('en complejo', 76, 13); cx.textAlign = 'right'; cx.fillText('carga', w - 62, 13); cx.fillText('donores', w - 8, 13);
        ks.forEach(function (k, i) { var g = LG[k], y = 20 + i * rh, on = (k === S.A && S.nA > 0) || (k === S.B && S.nB > 0); if (on) { cx.fillStyle = 'rgba(34,211,238,.22)'; cx.fillRect(4, y, w - 8, rh); } cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(g.f, 10, y + rh / 2 + 3); cx.fillText(g.n, 76, y + rh / 2 + 3); cx.textAlign = 'right'; cx.fillText(g.q, w - 62, y + rh / 2 + 3); cx.fillText(g.d === 1 ? 'mono (' + g.a + ')' : 'bi (' + g.a + ')', w - 8, y + rh / 2 + 3); });
      } },
      { title: 'Geometría según el índice de coordinación', h: 150, note: 'IC 2 lineal · IC 4 tetraédrica o plano-cuadrada · IC 6 octaédrica.', draw: function (cx, w, h, col) {
        var arr = [[2, 'lineal', 'ejemplo: [Ag(NH₃)₂]⁺'], [4, 'tetraédrica / plana', 'ej.: [CoCl₄]²⁻, [PtCl₄]²⁻'], [6, 'octaédrica', 'ej.: [Co(NH₃)₆]³⁺']], rh = h / 3; cx.font = '11px system-ui'; arr.forEach(function (a, i) { var on = a[0] === cn(); cx.fillStyle = on ? 'rgba(34,211,238,.28)' : 'rgba(134,142,150,.15)'; cx.fillRect(6, i * rh + 3, w - 12, rh - 6); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText('IC ' + a[0] + ' · ' + a[1], 14, i * rh + rh / 2 - 2); cx.fillStyle = col.muted; cx.fillText(a[2], 14, i * rh + rh / 2 + 13); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, L = parts(), q = charge();
      var lq = L.map(function (l) { return l.n + ' × (' + LG[l.id].q + ')'; }).join(' + ') || '0';
      return '<div class="card-kicker">' + (valid() ? formula() : 'Complejo') + '</div><div class="calc-step">1 · Índice de coordinación</div><table class="calc-table">' + L.map(function (l) { return row(LG[l.id].f, l.n + ' × ' + LG[l.id].d + ' donor(es) = ' + l.n * LG[l.id].d); }).join('') + row('IC', '<b>' + cn() + '</b> → ' + (valid() ? gname(geomFor()) : 'no válido')) + '</table><div class="calc-step">2 · Carga</div><table class="calc-table">' + row('Metal', '+' + S.ox) + row('Ligandos', lq) + row('Carga total', '<b>' + (q > 0 ? '+' : '') + q + '</b>') + row('Contraión', q > 0 ? q + ' Cl⁻' : (q < 0 ? (-q) + ' K⁺' : 'ninguno')) + '</table><div class="calc-step">3 · Nombre</div><p><b>' + (valid() ? name() : '—') + '</b></p>';
    },
    quiz: [
      { q: 'El nombre de [Co(NH₃)₆]Cl₃ es…', options: ['cloruro de hexaamincobalto(III)', 'hexaamincloruro de cobalto', 'tricloruro de hexaaminco(III)', 'cobaltato(III) de hexaamina'], answer: 0, why: 'Primero el anión (cloruro), luego el complejo catiónico.' },
      { q: 'K₄[Fe(CN)₆] es…', options: ['hexacianoferrato(II) de potasio', 'hexacianohierro(II) de potasio', 'hexacianoferrato(III) de potasio', 'cianuro ferroso potásico'], answer: 0, why: 'Complejo aniónico: -ato; Fe²⁺ porque 4− = x + 6(−1).' },
      { q: 'En [Cr(en)₃]³⁺ el índice de coordinación es…', options: ['6', '3', '4', '9'], answer: 0, why: '3 ligandos bidentados = 6 donores.' },
      { q: 'El prefijo para tres ligandos etilendiamina es…', options: ['tris(etilendiamina)', 'tri-etilendiamina', 'trietilendiamina', 'trisetilendiamina'], answer: 0, why: 'Ligandos complejos usan bis-, tris- con paréntesis.' },
      { q: 'Los ligandos se citan en orden…', options: ['alfabético', 'de carga', 'de tamaño', 'aleatorio'], answer: 0, why: 'Sin tener en cuenta los prefijos numéricos.' },
      { q: 'El ligando CN⁻ se nombra…', options: ['ciano', 'cianuro', 'carbono', 'nitrilo'], answer: 0, why: 'Como ligando: ciano.' },
      { q: 'La carga de [PtCl₂(NH₃)₂] es…', options: ['0', '2+', '2−', '1+'], answer: 0, why: 'Pt²⁺ + 2(−1) = 0.' },
      { q: 'El complejo [Ni(CO)₄] se nombra…', options: ['tetracarbonilníquel(0)', 'niquelato(0) de carbonilo', 'tetracarbonilniquel(IV)', 'níquel tetracarbonato'], answer: 0, why: 'Complejo neutro: sin terminación -ato.' }
    ],
    help: { intro: 'Elige metal, estado de oxidación y ligandos A y B; el simulador comprueba el índice de coordinación, calcula la carga, escribe la fórmula y construye el nombre.', items: [['Complejo 3D', 'la esfera central es el ion metálico y las de color, los átomos donores; la capa de etiquetas nombra cada ligando.'], ['Controles', '«Metal», «Número de oxidación», «Ligando A», «Ligando B» y sus cantidades; con IC = 4 eliges «Tetraédrica» o «Plana cuadrada».'], ['Panel', 'comprueba el índice de coordinación, calcula la carga, escribe la fórmula y construye el nombre; los botones de ejemplo cargan complejos clásicos.'], ['Gráficos', '«Ligandos comunes» y «Geometría según el índice de coordinación».']], try: ['Arma [Co(NH₃)₆]³⁺ y compara con el ejemplo: cloruro de hexaamincobalto(III).', 'Construye un complejo aniónico y fíjate en el sufijo -ato del metal (ferrato, cuprato…).', 'Usa etilendiamina: cada ligando aporta dos átomos donores (bidentado) y se usa tris- en vez de tri-.'] }
  };
  function rebuild(ctx) {
    if (gr) ctx.scene.remove(gr); gr = new T.Group(); ctx.scene.add(gr); ligLab.forEach(function (l) { l.vis(false); });
    if (!valid()) return;
    var g = geomFor(), V = verts(g, 3.2), m = MT[S.m];
    var mc = new T.Mesh(new T.SphereGeometry(0.9, 28, 20), new T.MeshStandardMaterial({ color: m.c, roughness: 0.3, metalness: 0.3 })); gr.add(mc);
    var slots = V.map(function () { return null; }), pairs = (PAIRS[g] || []).slice(), pi = 0;
    var seq = []; if (S.nA > 0) { for (var i = 0; i < S.nA; i++) seq.push(S.A); } if (S.nB > 0) { for (i = 0; i < S.nB; i++) seq.push(S.B); }
    var bi = seq.filter(function (id) { return LG[id].d === 2; }), mo = seq.filter(function (id) { return LG[id].d === 1; });
    var used = {}; bi.forEach(function (id) { var p = pairs[pi++]; if (!p) return; slots[p[0]] = { id: id, mate: p[1] }; slots[p[1]] = { id: id, mate: p[0] }; used[p[0]] = used[p[1]] = true; });
    var free = []; slots.forEach(function (s, i) { if (!s) free.push(i); }); mo.forEach(function (id, k) { if (free[k] != null) slots[free[k]] = { id: id, mate: -1 }; });
    var lblI = 0;
    slots.forEach(function (s, i) {
      if (!s) return; var lg = LG[s.id], v = new T.Vector3(V[i][0], V[i][1], V[i][2]);
      var at = new T.Mesh(new T.SphereGeometry(lg.d === 2 ? 0.52 : 0.6, 20, 14), new T.MeshStandardMaterial({ color: lg.c, roughness: 0.4 })); at.position.copy(v); gr.add(at);
      var bd = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); bd.position.copy(v).multiplyScalar(0.5); bd.scale.y = v.length(); bd.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); gr.add(bd);
      if (lg.d === 1 && (s.id === 'h2o' || s.id === 'nh3')) { var nH = s.id === 'h2o' ? 2 : 3, out = v.clone().normalize(); for (var h = 0; h < nH; h++) { var a = h * 6.283 / nH, perp = new T.Vector3(-out.y, out.x, 0); if (perp.lengthSq() < 0.01) perp.set(0, -out.z, out.y); perp.normalize(); var perp2 = out.clone().cross(perp); var hp = v.clone().addScaledVector(out, 0.55).addScaledVector(perp, Math.cos(a) * 0.65).addScaledVector(perp2, Math.sin(a) * 0.65); var hh = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshStandardMaterial({ color: 0xf2f2f2 })); hh.position.copy(hp); gr.add(hh); } }
      if (lg.d === 2 && s.mate > i) { var w = new T.Vector3(V[s.mate][0], V[s.mate][1], V[s.mate][2]), mid = v.clone().add(w).multiplyScalar(0.5), out2 = mid.clone().normalize(), bb = mid.clone().addScaledVector(out2, 1.1); var bk = new T.Mesh(new T.SphereGeometry(0.34, 12, 9), new T.MeshStandardMaterial({ color: 0x56606b })); bk.position.copy(bb); gr.add(bk);[v, w].forEach(function (e) { var d = bb.clone().sub(e), c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshStandardMaterial({ color: 0xadb5bd })); c.position.copy(e).add(bb).multiplyScalar(0.5); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); gr.add(c); }); }
    });
  }
  MSim.create(def);
})();
