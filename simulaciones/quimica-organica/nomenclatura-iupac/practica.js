/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Un butano con dos metilos en el mismo carbono se llama…', 'A butane with two methyl groups on the same carbon is named…'], options: [['3,3-dimetilbutano', '3,3-dimethylbutane'], ['2,2-dimetilbutano', '2,2-dimethylbutane'], ['2-dimetilbutano', '2-dimethylbutane']], answer: 1, why: ['Se numera desde el extremo que da los localizadores más bajos: {2,2} y no {3,3}. Cada sustituyente lleva su propio localizador.', 'Number from the end that gives the lowest locants: {2,2}, not {3,3}. Each substituent gets its own locant.'] },
  4: { q: ['Una molécula tiene un grupo –OH y un grupo –CHO. Su nombre termina en…', 'A molecule has an –OH group and a –CHO group. Its name ends in…'], options: [['-ol', '-ol'], ['-ona', '-one'], ['-al', '-al']], answer: 2, why: ['El aldehído tiene más prioridad que el alcohol: da el sufijo -al y el OH se nombra como prefijo hidroxi-.', 'The aldehyde outranks the alcohol: it takes the suffix -al and the OH is named with the prefix hydroxy-.'] }
} });

/* Práctica · Nomenclatura IUPAC orgánica. Un solo archivo para ES y EN (ver kit/aula.js).
   Genera alcanos ramificados y halogenados al azar y calcula su nombre: cadena más larga, localizadores más bajos,
   orden alfabético y prefijos di/tri; el empate de localizadores se resuelve dando el número menor al sustituyente que va primero en el alfabeto. */
(function () {
  var ROOT = [null, ['met', 'meth'], ['et', 'eth'], ['prop', 'prop'], ['but', 'but'], ['pent', 'pent'], ['hex', 'hex'], ['hept', 'hept'], ['oct', 'oct']];
  /* id: [nombre es, nombre en, texto en la fórmula] — el orden de la lista es el alfabético en ambos idiomas */
  var SUBS = { br: ['bromo', 'bromo', 'Br'], cl: ['cloro', 'chloro', 'Cl'], et: ['etil', 'ethyl', 'CH₂CH₃'], me: ['metil', 'methyl', 'CH₃'] };
  var ORDER = ['br', 'cl', 'et', 'me'], MULT = ['', '', 'di', 'tri', 'tetra'];
  function gen(H) {
    for (;;) {
      var n = H.int(4, 7), k = H.int(1, 3), at = [], ok = true, count = {};
      for (var i = 0; i < k; i++) {
        var s = H.pick(ORDER), p;
        if (s === 'me') p = H.int(2, n - 1); else if (s === 'et') { if (n < 5) { ok = false; break; } p = H.int(3, n - 2); } else p = H.int(1, n);
        at.push([s, p]); count[p] = (count[p] || 0) + 1;
        if (count[p] > ((p === 1 || p === n) ? 1 : 2)) ok = false;
      }
      if (ok) return { n: n, at: at };
    }
  }
  function locs(m, rev) { return m.at.map(function (a) { return [a[0], rev ? m.n + 1 - a[1] : a[1]]; }); }
  function better(A, B) {   /* ¿A es mejor numeración que B? */
    var a = A.map(function (x) { return x[1]; }).sort(function (x, y) { return x - y; }), b = B.map(function (x) { return x[1]; }).sort(function (x, y) { return x - y; });
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    for (var j = 0; j < ORDER.length; j++) {   /* empate: primer sustituyente alfabético */
      var la = A.filter(function (x) { return x[0] === ORDER[j]; }).map(function (x) { return x[1]; }).sort(), lb = B.filter(function (x) { return x[0] === ORDER[j]; }).map(function (x) { return x[1]; }).sort();
      for (var q = 0; q < la.length; q++) if (la[q] !== lb[q]) return la[q] < lb[q];
    }
    return true;
  }
  function name(L, n, en, order) {
    var g = {};
    L.forEach(function (x) { (g[x[0]] = g[x[0]] || []).push(x[1]); });
    var parts = (order || ORDER).filter(function (s) { return g[s]; }).map(function (s) { var l = g[s].sort(function (a, b) { return a - b; }); return l.join(',') + '-' + MULT[l.length] + SUBS[s][en]; });
    return parts.join('-') + ROOT[n][en] + (en ? 'ane' : 'ano');
  }
  function formula(m) {
    var out = [];
    for (var c = 1; c <= m.n; c++) {
      var subs = m.at.filter(function (a) { return a[1] === c; }).map(function (a) { return SUBS[a[0]][2]; }), bonds = (c === 1 || c === m.n) ? 1 : 2, h = 4 - bonds - subs.length;
      var core = 'C' + (h ? 'H' + ['', '', '₂', '₃'][h] : '');
      if (c === 1 && subs.length) core = subs[0] + '–' + core;            /* solo halógenos llegan a C1 */
      else if (c === m.n && subs.length) core += subs[0];
      else if (subs.length === 2 && subs[0] === 'CH₃' && subs[1] === 'CH₃') core += '(CH₃)₂';
      else subs.forEach(function (s) { core += '(' + s + ')'; });
      out.push(core);
    }
    return out.join('–');
  }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Nombrar un alcano', 'Name an alkane'], gen: function (H) {
        var m = gen(H), A = locs(m, false), B = locs(m, true), best = better(A, B) ? A : B, worst = best === A ? B : A, en = H.EN ? 1 : 0;
        var right = name(best, m.n, en), w = [name(worst, m.n, en), name(best, m.n, en, ORDER.slice().reverse())];
        best.forEach(function (x, i) { var L2 = best.map(function (y) { return y.slice(); }); if (x[1] < m.n - 1) { L2[i][1]++; w.push(name(L2, m.n, en)); } });
        if (m.at.some(function (a) { return a[0] === 'me' || a[0] === 'et'; })) w.push(name(best, m.n + 1 > 8 ? m.n - 1 : m.n + 1, en));
        return H.mc(H.t('¿Cuál es el nombre IUPAC de <b>' + formula(m) + '</b>?', 'What is the IUPAC name of <b>' + formula(m) + '</b>?'), right, w,
          H.t('Cadena principal: ' + m.n + ' C (' + ROOT[m.n][0] + 'ano). Se numera desde el extremo que da los localizadores más bajos; los sustituyentes van en orden alfabético (sin contar di, tri) con prefijos multiplicativos.', 'Parent chain: ' + m.n + ' C (' + ROOT[m.n][1] + 'ane). Number from the end that gives the lowest locants; substituents go in alphabetical order (ignoring di, tri) with multiplying prefixes.'));
      } },
      { name: ['Grupo funcional y sufijo', 'Functional group and suffix'], gen: function (H) {
        var B = [['CH₃–CH(OH)–CH₃', ['propan-2-ol', 'propan-2-ol']], ['CH₃–CH₂–CH₂–CHO', ['butanal', 'butanal']], ['CH₃–CO–CH₂–CH₃', ['butan-2-ona', 'butan-2-one']], ['CH₃–CH₂–COOH', ['ácido propanoico', 'propanoic acid']],
          ['CH₃–CH=CH–CH₂–CH₃', ['pent-2-eno', 'pent-2-ene']], ['HC≡C–CH₂–CH₃', ['but-1-ino', 'but-1-yne']], ['CH₃–COO–CH₃', ['etanoato de metilo', 'methyl ethanoate']], ['CH₃–CH₂–CH₂–NH₂', ['propan-1-amina', 'propan-1-amine']],
          ['CH₃–C(CH₃)(OH)–CH₃', ['2-metilpropan-2-ol', '2-methylpropan-2-ol']], ['CH₃–CH(CH₃)–CH₂–OH', ['2-metilpropan-1-ol', '2-methylpropan-1-ol']], ['CH₂=CH–CH₂–OH', ['prop-2-en-1-ol', 'prop-2-en-1-ol']], ['CH₃–CH₂–CONH₂', ['propanamida', 'propanamide']]];
        var W = [['butan-1-ol', 'butan-1-ol'], ['propanal', 'propanal'], ['butanona-3', 'butan-3-one'], ['pent-3-eno', 'pent-3-ene'], ['but-3-ino', 'but-3-yne'], ['metanoato de etilo', 'ethyl methanoate'], ['1-propanamida', '1-propanamide'], ['2-metilpropan-1-ol', '2-methylpropan-1-ol'], ['prop-1-en-3-ol', 'prop-1-en-3-ol']];
        return H.bank(B, function (b) { return H.t('¿Cuál es el nombre IUPAC de <b>' + b[0] + '</b>?', 'What is the IUPAC name of <b>' + b[0] + '</b>?'); }, function (b) { return b[1]; },
          function () { return H.t('El grupo de mayor prioridad da el sufijo y recibe el localizador más bajo; los enlaces múltiples se indican con -eno/-ino.', 'The highest-priority group gives the suffix and gets the lowest locant; multiple bonds are shown with -ene/-yne.'); }, W);
      } }
    ]
  });
})();
