/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['¿Qué par de bases se une con más puentes de hidrógeno?', 'Which base pair is held by more hydrogen bonds?'], options: [['A–T', 'A–T'], ['G–C', 'G–C'], ['Los dos tienen los mismos', 'Both have the same number']], answer: 1, why: ['G–C forma 3 puentes de H y A–T solo 2; por eso el ADN rico en G–C es más estable frente al calor.', 'G–C forms 3 hydrogen bonds and A–T only 2; that is why G–C-rich DNA is more heat-stable.'] },
  3: { q: ['Después de replicarse, cada molécula hija de ADN tiene…', 'After replication, each daughter DNA molecule has…'], options: [['dos hebras nuevas', 'two new strands'], ['fragmentos viejos y nuevos mezclados en cada hebra', 'old and new fragments mixed within each strand'], ['una hebra original y una nueva', 'one original strand and one new strand']], answer: 2, why: ['La replicación es semiconservativa: cada hebra original sirve de molde para una nueva (Meselson y Stahl).', 'Replication is semiconservative: each original strand is the template for a new one (Meselson and Stahl).'] }
} });

/* Práctica · ADN: complementariedad, transcripción, traducción y regla de Chargaff (secuencias generadas al azar). */
(function () {
  var COMP = { A: 'T', T: 'A', G: 'C', C: 'G' }, RNA = { A: 'U', T: 'A', G: 'C', C: 'G' };
  var CODE = { UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu', CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu', AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met', GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
    UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser', CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro', ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr', GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
    UAU: 'Tyr', UAC: 'Tyr', UAA: 'Stop', UAG: 'Stop', CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln', AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys', GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
    UGU: 'Cys', UGC: 'Cys', UGA: 'Stop', UGG: 'Trp', CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg', AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg', GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly' };
  function seq(H, n) { var s = ''; for (var i = 0; i < n; i++) s += H.pick('ATGC'.split('')); return s; }
  function map(s, m) { return s.split('').map(function (c) { return m[c]; }).join(''); }
  function rev(s) { return s.split('').reverse().join(''); }
  function mutate(H, s) { var i = H.int(0, s.length - 1), c; do { c = H.pick('ATGCU'.split('').filter(function (x) { return s.indexOf('U') >= 0 ? x !== 'T' : x !== 'U'; })); } while (c === s[i]); return s.slice(0, i) + c + s.slice(i + 1); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Hebra complementaria', 'Complementary strand'], gen: function (H) {
        var s = seq(H, 9), c = map(s, COMP);
        return H.mc(H.t('¿Cuál es la hebra complementaria de 5′-<b>' + s + '</b>-3′, escrita de 3′ a 5′?', 'What is the complementary strand of 5′-<b>' + s + '</b>-3′, written 3′ to 5′?'), "3′-" + c + "-5′", ["3′-" + rev(c) + "-5′", "3′-" + s + "-5′", "3′-" + mutate(H, c) + "-5′", "3′-" + map(s, RNA) + "-5′"],
          H.t('A se aparea con T (2 puentes de H) y G con C (3 puentes de H). Las hebras son antiparalelas.', 'A pairs with T (2 hydrogen bonds) and G with C (3 hydrogen bonds). The strands are antiparallel.'));
      } },
      { name: ['Transcripción', 'Transcription'], gen: function (H) {
        var t = seq(H, 9), m = map(t, RNA);
        return H.mc(H.t('La hebra molde es 3′-<b>' + t + '</b>-5′. ¿Qué ARNm se transcribe (5′ → 3′)?', 'The template strand is 3′-<b>' + t + '</b>-5′. Which mRNA is transcribed (5′ → 3′)?'), "5′-" + m + "-3′", ["5′-" + map(t, COMP) + "-3′", "5′-" + t.replace(/T/g, 'U') + "-3′", "5′-" + mutate(H, m) + "-3′"],
          H.t('El ARNm es complementario a la hebra molde, con U en lugar de T: A→U, T→A, G→C, C→G.', 'The mRNA is complementary to the template, with U instead of T: A→U, T→A, G→C, C→G.'));
      } },
      { name: ['Traducción', 'Translation'], gen: function (H) {
        var cods = Object.keys(CODE).filter(function (k) { return CODE[k] !== 'Stop'; }), m = 'AUG', aa = ['Met'];
        for (var i = 0; i < 3; i++) { var k = H.pick(cods); m += k; aa.push(CODE[k]); }
        var w1 = aa.slice(), w2 = aa.slice(); w1[H.int(1, 3)] = CODE[H.pick(cods)]; w2.reverse();
        return H.mc(H.t('Usando el código genético, ¿qué péptido codifica el ARNm 5′-<b>' + m + '</b>-3′?', 'Using the genetic code, which peptide does the mRNA 5′-<b>' + m + '</b>-3′ encode?'), aa.join('–'), [w1.join('–'), w2.join('–'), aa.slice(1).join('–') + '–Met'],
          H.t('Se lee de 5′ a 3′ en codones de tres bases desde AUG (Met): ', 'Read 5′ to 3′ in three-base codons starting at AUG (Met): ') + m.match(/.../g).join(' ') + '.');
      } },
      { name: ['Regla de Chargaff', 'Chargaff’s rule'], gen: function (H) {
        var given = H.pick(['A', 'G', 'T', 'C']), p = H.int(15, 35), ask = H.pick(['A', 'G', 'T', 'C'].filter(function (x) { return x !== given; })), pair = COMP[given];
        var v = ask === pair ? p : 50 - p;
        return { q: H.t('Un ADN de doble hebra tiene <b>' + p + ' %</b> de ' + given + '. ¿Qué porcentaje de ' + ask + ' tiene?', 'A double-stranded DNA is <b>' + p + ' %</b> ' + given + '. What percentage is ' + ask + '?'), a: v, abs: 0.01, aText: v + ' %',
          sol: H.t('Chargaff: %A = %T y %G = %C, y A + T + G + C = 100 %. ', 'Chargaff: %A = %T and %G = %C, and A + T + G + C = 100 %. ') + given + ' = ' + pair + ' = ' + p + ' % → ' + H.t('los otros dos suman ', 'the other two add up to ') + (100 - 2 * p) + ' % → ' + ask + ' = ' + v + ' %.' };
      } }
    ]
  });
})();
