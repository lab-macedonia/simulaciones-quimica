/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["¿Cuál es el número de oxidación del Co en [Co(NH₃)₅Cl]²⁺?", "What is the oxidation number of Co in [Co(NH₃)₅Cl]²⁺?"], options: [["+3", "+3"], ["+2", "+2"], ["+1", "+1"], ["+5", "+5"]], answer: 0, why: ["x + 5·0 + (−1) = +2 → x = +3.", "x + 5·0 + (−1) = +2 → x = +3."] } } });

/* Práctica: complejos generados al azar con las mismas convenciones de nombre y fórmula de la simulación. */
(function () {
  var MT = { Co: [['cobalto', 'cobaltato'], ['cobalt', 'cobaltate'], [2, 3], 6], Fe: [['hierro', 'ferrato'], ['iron', 'ferrate'], [2, 3], 6], Cr: [['cromo', 'cromato'], ['chromium', 'chromate'], [3], 6], Mn: [['manganeso', 'manganato'], ['manganese', 'manganate'], [2], 6],
    Ni: [['níquel', 'niquelato'], ['nickel', 'nickelate'], [2], 6], Pt: [['platino', 'platinato'], ['platinum', 'platinate'], [2], 4], Cu: [['cobre', 'cuprato'], ['copper', 'cuprate'], [2], 4], Zn: [['cinc', 'cincato'], ['zinc', 'zincate'], [2], 4] };
  /* nombre es, nombre en, fórmula, carga, denticidad */
  var LG = { h2o: ['acuo', 'aqua', 'H₂O', 0, 1], nh3: ['amin', 'ammine', 'NH₃', 0, 1], cl: ['cloro', 'chloro', 'Cl', -1, 1], br: ['bromo', 'bromo', 'Br', -1, 1], cn: ['ciano', 'cyano', 'CN', -1, 1], oh: ['hidroxo', 'hydroxo', 'OH', -1, 1], en: ['etilendiamina', 'ethylenediamine', 'en', 0, 2], ox: ['oxalato', 'oxalate', 'ox', -2, 2] };
  var PRE = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'], PRX = ['', '', 'bis', 'tris', 'tetrakis'], ROM = ['0', 'I', 'II', 'III', 'IV'], SUB = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n) { return n === 1 ? '' : String(n).replace(/\d/g, function (c) { return SUB[+c]; }); }
  function sup(q) { var a = Math.abs(q); return q === 0 ? '' : (a === 1 ? '' : '⁰¹²³⁴⁵⁶'[a]) + (q > 0 ? '⁺' : '⁻'); }
  function make(H) {
    for (;;) {
      var m = H.pick(Object.keys(MT)), M = MT[m], ox = H.pick(M[2]), cn = M[3], keys = Object.keys(LG), A = H.pick(keys), B = H.pick(keys);
      if (A === B) continue;
      var dA = LG[A][4], dB = LG[B][4], nB = H.int(0, 2), rest = cn - nB * dB;
      if (rest <= 0 || rest % dA) continue;
      var L = [{ id: A, n: rest / dA }]; if (nB) L.push({ id: B, n: nB });
      if (cn === 4 && (dA === 2 || dB === 2) && nB) continue;
      var q = ox + L.reduce(function (s, l) { return s + l.n * LG[l.id][3]; }, 0);
      if (Math.abs(q) > 3) continue;
      return { m: m, ox: ox, L: L, q: q, cn: cn };
    }
  }
  /* ox y ato permiten construir distractores (número romano o terminación equivocados) */
  function name(c, en, ox, ato) {
    var M = MT[c.m], L = c.L.slice().sort(function (a, b) { return LG[a.id][en].localeCompare(LG[b.id][en], 'es'); });
    var ln = L.map(function (l) { var g = LG[l.id], cx = g[4] === 2, pre = l.n > 1 ? (cx ? PRX[l.n] : PRE[l.n]) : ''; return pre + (cx ? '(' + g[en] + ')' : g[en]); }).join('');
    if (ato == null) ato = c.q < 0;
    var nm = ln + M[en][ato ? 1 : 0] + '(' + ROM[ox == null ? c.ox : ox] + ')';
    if (c.q > 0) return en ? nm + ' chloride' : 'cloruro de ' + nm;
    if (c.q < 0) return en ? 'potassium ' + nm : nm + ' de potasio';
    return nm;
  }
  function formula(c) {
    var L = c.L.slice().sort(function (a, b) { var A = LG[a.id], B = LG[b.id]; if (A[3] !== B[3]) return A[3] < B[3] ? -1 : 1; return A[2].localeCompare(B[2]); });
    var f = c.m + L.map(function (l) { var g = LG[l.id], poly = g[2].replace(/[^A-Z]/g, '').length > 1 || g[2].length > 2 || g[4] === 2; return (poly ? '(' + g[2] + ')' : g[2]) + sub(l.n); }).join('');
    var s = '[' + f + ']';
    if (c.q > 0) s += 'Cl' + sub(c.q); else if (c.q < 0) s = 'K' + sub(-c.q) + s;
    return s;
  }
  function ion(c) { return '[' + formula(c).replace(/^K[₀-₉]*\[|^\[/, '').replace(/\]Cl[₀-₉]*$|\]$/, '') + ']' + sup(c.q); }
  function why(c, H) {
    var parts = c.L.map(function (l) { return l.n + ' × (' + (LG[l.id][3] ? '−' + (-LG[l.id][3]) : '0') + ')'; }).join(' + ');
    return H.t('Carga del ion complejo ', 'Charge of the complex ion ') + ion(c) + ': ' + (c.q > 0 ? '+' + c.q : c.q < 0 ? '−' + (-c.q) : '0') + H.t(' (la fija el contraión). Número de oxidación del metal: x + ', ' (set by the counter-ion). Metal oxidation number: x + ') + parts + ' = ' + c.q + ' → x = +' + c.ox + '.';
  }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Nombre del compuesto', 'Name of the compound'], gen: function (H) {
        var c = make(H), en = H.EN ? 1 : 0, w = [name(c, en, c.ox + 1), name(c, en, Math.max(0, c.ox - 1)), name(c, en, null, !(c.q < 0)), name(c, en, c.ox + 1, !(c.q < 0))];
        return H.mc(H.t('¿Cuál es el nombre de <b>' + formula(c) + '</b>?', 'What is the name of <b>' + formula(c) + '</b>?'), name(c, en), w,
          why(c, H) + ' ' + H.t('Ligandos en orden alfabético con prefijos (di, tri… o bis, tris para quelatos); el metal termina en -ato solo si el complejo es un anión.', 'Ligands in alphabetical order with prefixes (di, tri… or bis, tris for chelates); the metal ends in -ate only if the complex is an anion.'));
      } },
      { name: ['Número de oxidación del metal', 'Oxidation number of the metal'], gen: function (H) {
        var c = make(H);
        return { q: H.t('¿Cuál es el número de oxidación del ' + c.m + ' en <b>' + formula(c) + '</b>?', 'What is the oxidation number of ' + c.m + ' in <b>' + formula(c) + '</b>?'), a: c.ox, abs: 0, aText: '+' + c.ox, sol: why(c, H) };
      } },
      { name: ['Índice de coordinación', 'Coordination number'], gen: function (H) {
        var c = make(H);
        return { q: H.t('¿Cuál es el índice de coordinación del ' + c.m + ' en <b>' + formula(c) + '</b>?', 'What is the coordination number of ' + c.m + ' in <b>' + formula(c) + '</b>?'), a: c.cn, abs: 0, aText: String(c.cn),
          sol: c.L.map(function (l) { return l.n + ' ' + LG[l.id][2] + ' × ' + LG[l.id][4]; }).join(' + ') + ' = ' + c.cn + H.t(' átomos donadores (en y ox son bidentados).', ' donor atoms (en and ox are bidentate).') };
      } }
    ]
  });
})();
