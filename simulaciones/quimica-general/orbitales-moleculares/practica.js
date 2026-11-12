/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["¿Es el O₂ atraído por un imán?", "Is O₂ attracted by a magnet?"], options: [["Sí: tiene dos electrones desapareados en π*", "Yes: it has two unpaired electrons in π*"], ["No: todos sus electrones están apareados", "No: all its electrons are paired"]], answer: 0, why: ["La estructura de Lewis no lo predice; la teoría de OM sí: π*² con espines paralelos.", "The Lewis structure does not predict it; MO theory does: π*² with parallel spins."] } } });

/* Práctica: orden de enlace y magnetismo de diatómicas homonucleares (periodos 1 y 2) y sus iones. */
(function () {
  /* símbolo, electrones de valencia, ordenamiento: 1 = H/He (solo 1s), 'A' = B–N (π2p bajo σ2p), 'B' = O–Ne */
  var EL = [['H', 1, 1], ['He', 2, 1], ['Li', 1, 'A'], ['Be', 2, 'A'], ['B', 3, 'A'], ['C', 4, 'A'], ['N', 5, 'A'], ['O', 6, 'B'], ['F', 7, 'B'], ['Ne', 8, 'B']];
  /* niveles: [etiqueta, capacidad, enlazante?, degenerados] */
  var L1 = [['σ1s', 2, 1, 1], ['σ*1s', 2, 0, 1]];
  var LA = [['σ2s', 2, 1, 1], ['σ*2s', 2, 0, 1], ['π2p', 4, 1, 2], ['σ2p', 2, 1, 1], ['π*2p', 4, 0, 2], ['σ*2p', 2, 0, 1]];
  var LB = [['σ2s', 2, 1, 1], ['σ*2s', 2, 0, 1], ['σ2p', 2, 1, 1], ['π2p', 4, 1, 2], ['π*2p', 4, 0, 2], ['σ*2p', 2, 0, 1]];
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sp(n) { return String(n).replace(/\d/g, function (c) { return SUP[+c]; }); }
  function species(H) {
    for (;;) {
      var e = H.pick(EL), q = H.pick([0, 0, 1, -1]), n = 2 * e[1] - q;
      if (n > 0 && n <= (e[2] === 1 ? 4 : 16) && !(e[0] === 'Li' && q === -1)) return { e: e, q: q, n: n, lev: e[2] === 1 ? L1 : e[2] === 'A' ? LA : LB };
    }
  }
  function fill(s) {
    var left = s.n, b = 0, a = 0, u = 0, txt = [];
    s.lev.forEach(function (l) { if (left <= 0) return; var k = Math.min(l[1], left); left -= k; if (l[2]) b += k; else a += k; u += l[3] === 2 ? (k <= 2 ? k : 4 - k) : (k === 1 ? 1 : 0); txt.push('(' + l[0] + ')' + sp(k)); });
    return { bo: (b - a) / 2, b: b, a: a, u: u, txt: txt.join(' ') };
  }
  function label(s) { return s.e[0] + '₂' + (s.q === 1 ? '⁺' : s.q === -1 ? '⁻' : ''); }
  function fbo(x, H) { return x % 1 ? H.fmt(x, 1) : String(x); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Orden de enlace', 'Bond order'], gen: function (H) {
        var s = species(H), f = fill(s);
        return { q: H.t('¿Cuál es el orden de enlace de <b>' + label(s) + '</b>? (Escribe 0,5 si es fraccionario.)', 'What is the bond order of <b>' + label(s) + '</b>? (Type 0.5 if it is fractional.)'), a: f.bo, abs: 0.01, aText: fbo(f.bo, H),
          sol: s.n + H.t(' electrones de valencia: ', ' valence electrons: ') + f.txt + '. ' + H.t('OE = (enlazantes − antienlazantes) / 2 = (', 'BO = (bonding − antibonding) / 2 = (') + f.b + ' − ' + f.a + ') / 2 = ' + fbo(f.bo, H) + (f.bo === 0 ? H.t('. Con orden 0 la molécula no es estable.', '. With order 0 the molecule is not stable.') : '') };
      } },
      { name: ['Electrones desapareados y magnetismo', 'Unpaired electrons and magnetism'], gen: function (H) {
        var s = species(H), f = fill(s), P = ['Paramagnética', 'Paramagnetic'], D = ['Diamagnética', 'Diamagnetic'];
        return H.mc(H.t('¿<b>' + label(s) + '</b> es paramagnética o diamagnética?', 'Is <b>' + label(s) + '</b> paramagnetic or diamagnetic?'), f.u ? P : D, [P, D],
          f.txt + '. ' + H.t('Electrones desapareados: ', 'Unpaired electrons: ') + f.u + (f.u ? H.t(' → es atraída por un imán.', ' → it is attracted by a magnet.') : H.t(' → todos apareados.', ' → all paired.')) + (s.e[2] === 'A' ? H.t(' Para B, C y N el π2p queda bajo el σ2p (mezcla s–p).', ' For B, C and N the π2p lies below σ2p (s–p mixing).') : ''));
      } }
    ]
  });
})();
