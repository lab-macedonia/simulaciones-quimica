/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["La hidrogenación de un alquino con catalizador de Lindlar da…", "Hydrogenating an alkyne with Lindlar\u0027s catalyst gives…"], options: [["un alqueno cis", "a cis alkene"], ["un alqueno trans", "a trans alkene"], ["un alcano", "an alkane"]], answer: 0, why: ["El catalizador envenenado se detiene en el alqueno y adiciona los dos H por la misma cara.", "The poisoned catalyst stops at the alkene and adds both H on the same face."] } } });

/* Práctica: reactivos y productos de los alquinos; acidez del alquino terminal. */
(function () {
  var R = [['H₂, catalizador de Lindlar', 'H₂, Lindlar catalyst', ['Alqueno cis (Z)', 'cis (Z) alkene'], ['Adición sin de H₂ sobre un catalizador envenenado que se detiene en el alqueno.', 'Syn addition of H₂ on a poisoned catalyst that stops at the alkene.']],
    ['Na en NH₃ líquido', 'Na in liquid NH₃', ['Alqueno trans (E)', 'trans (E) alkene'], ['Reducción por transferencia de electrones: el radical anión adopta la geometría trans, más estable.', 'Dissolving-metal reduction: the radical anion adopts the more stable trans geometry.']],
    ['H₂ (exceso), Pd/C', 'H₂ (excess), Pd/C', ['Alcano', 'Alkane'], ['El catalizador activo reduce el alquino hasta el final.', 'The active catalyst reduces the alkyne all the way.']],
    ['H₂O, H₂SO₄, HgSO₄ (alquino terminal)', 'H₂O, H₂SO₄, HgSO₄ (terminal alkyne)', ['Metilcetona (Markovnikov)', 'Methyl ketone (Markovnikov)'], ['Se forma un enol en el C más sustituido que tautomeriza a cetona.', 'An enol forms on the more substituted carbon and tautomerizes to the ketone.']],
    ['1) R₂BH (disiamilborano) 2) H₂O₂, NaOH (alquino terminal)', '1) R₂BH (disiamylborane) 2) H₂O₂, NaOH (terminal alkyne)', ['Aldehído (anti-Markovnikov)', 'Aldehyde (anti-Markovnikov)'], ['El B se une al C terminal; el enol resultante tautomeriza a aldehído.', 'B adds to the terminal carbon; the resulting enol tautomerizes to the aldehyde.']],
    ['2 HBr', '2 HBr', ['Dihaluro geminal', 'Geminal dihalide'], ['Dos adiciones Markovnikov: ambos Br quedan en el mismo carbono.', 'Two Markovnikov additions: both Br end up on the same carbon.']]];
  var ALL = R.map(function (r) { return r[2]; });
  /* base, pKa del ácido conjugado */
  var B = [['NaNH₂', 'NH₃', 38], ['NaH', 'H₂', 35], ['CH₃CH₂CH₂CH₂Li', 'C₄H₁₀', 50], ['NaOH', 'H₂O', 15.7], ['CH₃CH₂ONa', 'CH₃CH₂OH', 16], ['NaHCO₃', 'H₂CO₃', 6.4]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Producto según el reactivo', 'Product from the reagent'], gen: function (H) {
        var r = H.pick(R);
        return H.mc(H.t('¿Qué se obtiene al tratar un alquino interno o terminal con <b>' + r[0] + '</b>?', 'What is obtained when an internal or terminal alkyne is treated with <b>' + r[1] + '</b>?'), r[2], ALL, r[3]);
      } },
      { name: ['¿Desprotona al alquino terminal?', 'Does it deprotonate a terminal alkyne?'], gen: function (H) {
        var b = H.pick(B), y = b[2] > 25, Y = ['Sí, forma el acetiluro', 'Yes, it forms the acetylide'], N = ['No, el equilibrio queda hacia los reactivos', 'No, the equilibrium lies toward the reactants'];
        return H.mc(H.t('El alquino terminal tiene pK<sub>a</sub> ≈ 25. ¿La base <b>' + b[0] + '</b> (pK<sub>a</sub> de ' + b[1] + ' ≈ ' + H.fmt(b[2], b[2] % 1 ? 1 : 0) + ') lo desprotona por completo?', 'A terminal alkyne has pK<sub>a</sub> ≈ 25. Does the base <b>' + b[0] + '</b> (pK<sub>a</sub> of ' + b[1] + ' ≈ ' + H.fmt(b[2], b[2] % 1 ? 1 : 0) + ') deprotonate it completely?'), y ? Y : N, [Y, N],
          H.t('El equilibrio favorece al ácido más débil: la base sirve si su ácido conjugado tiene pK<sub>a</sub> mayor que 25. El C sp tiene 50 % de carácter s y estabiliza la carga negativa.', 'The equilibrium favors the weaker acid: the base works if its conjugate acid has a pK<sub>a</sub> above 25. The sp carbon has 50 % s character and stabilizes the negative charge.'));
      } }
    ]
  });
})();
