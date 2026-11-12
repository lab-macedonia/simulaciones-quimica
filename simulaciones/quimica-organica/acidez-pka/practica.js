/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['¿Cuál es el más ácido: etano, eteno o etino?', 'Which is the most acidic: ethane, ethene or ethyne?'], options: [['Etano', 'Ethane'], ['Eteno', 'Ethene'], ['Etino', 'Ethyne']], answer: 2, why: ['El carbono sp (50 % de carácter s) retiene mejor el par del anión: pKa 25 frente a 44 (eteno) y 50 (etano).', 'The sp carbon (50 % s character) holds the anion’s pair best: pKa 25 versus 44 (ethene) and 50 (ethane).'] },
  5: { q: ['Comparado con el ácido acético, el ácido tricloroacético es…', 'Compared with acetic acid, trichloroacetic acid is…'], options: [['mucho más ácido', 'much more acidic'], ['menos ácido', 'less acidic'], ['igual de ácido', 'equally acidic']], answer: 0, why: ['Los tres Cl retiran densidad electrónica por efecto inductivo y estabilizan el carboxilato: pKa 0,65 frente a 4,76.', 'The three Cl atoms withdraw electron density inductively and stabilize the carboxylate: pKa 0.65 versus 4.76.'] }
} });

/* Práctica · Acidez orgánica y pKa (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var A = [[['ácido acético', 'acetic acid'], 4.76], [['fenol', 'phenol'], 10.0], [['ácido trifluoroacético', 'trifluoroacetic acid'], 0.23], [['etanol', 'ethanol'], 16], [['ácido benzoico', 'benzoic acid'], 4.20], [['ion amonio', 'ammonium ion'], 9.25], [['ácido cloroacético', 'chloroacetic acid'], 2.87], [['acetona (H α)', 'acetone (α-H)'], 19.2]];
  SimAula.register({ problems: [
    { name: ['Porcentaje ionizado a un pH', 'Percent ionized at a given pH'], gen: function (H) {
      var a = H.pick(A.slice(0, 7)), pH = H.int(1, 13), p = 100 / (1 + Math.pow(10, a[1] - pH));
      return { q: H.t('¿Qué porcentaje del ' + H.L(a[0]) + ' (pK<sub>a</sub> = ' + H.fmt(a[1], 2) + ') está desprotonado a pH ' + pH + '?', 'What percentage of ' + H.L(a[0]) + ' (pK<sub>a</sub> = ' + H.fmt(a[1], 2) + ') is deprotonated at pH ' + pH + '?'), a: p, unit: '%', abs: Math.max(0.05, p * 0.02),
        sol: '% A⁻ = 100 / (1 + 10<sup>pKa − pH</sup>) = 100 / (1 + 10<sup>' + H.fmt(a[1] - pH, 2) + '</sup>) = ' + H.sig(p, 3) + ' %' };
    } },
    { name: ['Comparar fuerza ácida', 'Comparing acid strength'], gen: function (H) {
      var x = H.shuffle(A).slice(0, 2), d = x[0][1] - x[1][1], r = Math.pow(10, Math.abs(d));
      if (Math.abs(d) < 0.3) return null;
      return { q: H.t('¿Cuántas veces mayor es el K<sub>a</sub> del ' + H.L(d < 0 ? x[0][0] : x[1][0]) + ' que el del ' + H.L(d < 0 ? x[1][0] : x[0][0]) + '? (pK<sub>a</sub> ' + H.fmt(Math.min(x[0][1], x[1][1]), 2) + ' y ' + H.fmt(Math.max(x[0][1], x[1][1]), 2) + ')', 'How many times larger is the K<sub>a</sub> of ' + H.L(d < 0 ? x[0][0] : x[1][0]) + ' than that of ' + H.L(d < 0 ? x[1][0] : x[0][0]) + '? (pK<sub>a</sub> ' + H.fmt(Math.min(x[0][1], x[1][1]), 2) + ' and ' + H.fmt(Math.max(x[0][1], x[1][1]), 2) + ')'), a: r, tol: 0.03,
        sol: 'K<sub>a1</sub>/K<sub>a2</sub> = 10<sup>ΔpKa</sup> = 10<sup>' + H.fmt(Math.abs(d), 2) + '</sup> = ' + H.sig(r, 3) };
    } },
    { name: ['¿Hacia dónde va el equilibrio?', 'Which way does the equilibrium lie?'], gen: function (H) {
      var x = H.shuffle(A).slice(0, 2); if (Math.abs(x[0][1] - x[1][1]) < 1) return null;
      return { q: H.t('En la reacción ácido–base entre ' + H.L(x[0][0]) + ' (pK<sub>a</sub> ' + H.fmt(x[0][1], 2) + ') y la base conjugada del ' + H.L(x[1][0]) + ' (pK<sub>a</sub> ' + H.fmt(x[1][1], 2) + '), el equilibrio favorece…', 'In the acid–base reaction between ' + H.L(x[0][0]) + ' (pK<sub>a</sub> ' + H.fmt(x[0][1], 2) + ') and the conjugate base of ' + H.L(x[1][0]) + ' (pK<sub>a</sub> ' + H.fmt(x[1][1], 2) + '), the equilibrium favors…'),
        options: [H.t('Los productos', 'The products'), H.t('Los reactivos', 'The reactants')], answer: x[0][1] < x[1][1] ? 0 : 1,
        sol: H.t('El equilibrio va hacia el ácido más débil (pK<sub>a</sub> mayor).', 'The equilibrium lies toward the weaker acid (higher pK<sub>a</sub>).') };
    } }
  ] });
})();
