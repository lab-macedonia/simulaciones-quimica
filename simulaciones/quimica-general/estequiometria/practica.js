/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['El reactivo limitante es el que…', 'The limiting reactant is the one that…'], options: [['hay en menor número de moléculas', 'has the fewest molecules'], ['alcanza para menos tandas de la receta', 'is enough for the fewest batches of the recipe'], ['tiene mayor masa molar', 'has the highest molar mass']], answer: 1, why: ['Hay que dividir cada cantidad por su coeficiente: el que alcanza para menos tandas se agota primero, aunque haya más moléculas de él.', 'Divide each amount by its coefficient: the one that covers the fewest batches runs out first, even if there are more of its molecules.'] },
  4: { q: ['La cantidad máxima de producto (rendimiento teórico) la fija…', 'The maximum amount of product (theoretical yield) is set by…'], options: [['el reactivo en exceso', 'the excess reactant'], ['la suma de ambos reactivos', 'the sum of both reactants'], ['el reactivo limitante', 'the limiting reactant']], answer: 2, why: ['Cuando se agota el limitante ya no se pueden completar más tandas; lo que sobra del otro reactivo no forma producto.', 'Once the limiting reactant runs out no more batches can be completed; the leftover of the other reactant forms no product.'] }
} });

/* Práctica · Estequiometría y reactivo limitante. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* [ecuación, reactivo A, coef A, M A, reactivo B, coef B, M B, producto, coef P, M P] */
  var RX = [['N₂ + 3 H₂ → 2 NH₃', 'N₂', 1, 28.02, 'H₂', 3, 2.016, 'NH₃', 2, 17.03],
    ['2 H₂ + O₂ → 2 H₂O', 'H₂', 2, 2.016, 'O₂', 1, 32.00, 'H₂O', 2, 18.02],
    ['CH₄ + 2 O₂ → CO₂ + 2 H₂O', 'CH₄', 1, 16.04, 'O₂', 2, 32.00, 'CO₂', 1, 44.01],
    ['4 Fe + 3 O₂ → 2 Fe₂O₃', 'Fe', 4, 55.85, 'O₂', 3, 32.00, 'Fe₂O₃', 2, 159.69],
    ['2 Al + 3 Cl₂ → 2 AlCl₃', 'Al', 2, 26.98, 'Cl₂', 3, 70.90, 'AlCl₃', 2, 133.33],
    ['C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O', 'C₃H₈', 1, 44.10, 'O₂', 5, 32.00, 'CO₂', 3, 44.01],
    ['2 Na + Cl₂ → 2 NaCl', 'Na', 2, 22.99, 'Cl₂', 1, 70.90, 'NaCl', 2, 58.44]];
  function setup(H) { var r = H.pick(RX), mA = H.rnd(2, 60, 1), mB = H.rnd(2, 60, 1), nA = mA / r[3], nB = mB / r[6], xA = nA / r[2], xB = nB / r[5], lim = xA <= xB ? 'A' : 'B', x = Math.min(xA, xB); return { r: r, mA: mA, mB: mB, nA: nA, nB: nB, lim: lim, x: x }; }
  SimAula.register({
    problems: [
      { name: ['Masa de producto (reactivo limitante)', 'Product mass (limiting reactant)'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), r = d.r, mP = d.x * r[8] * r[9];
        return { q: t('Para ' + r[0] + ' se mezclan ' + f(d.mA, 1) + ' g de ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) y ' + f(d.mB, 1) + ' g de ' + r[4] + ' (' + f(r[6], 2) + ' g/mol). ¿Cuántos gramos de ' + r[7] + ' (' + f(r[9], 2) + ' g/mol) se forman como máximo?', 'For ' + r[0] + ', ' + f(d.mA, 1) + ' g of ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) and ' + f(d.mB, 1) + ' g of ' + r[4] + ' (' + f(r[6], 2) + ' g/mol) are mixed. What is the maximum mass of ' + r[7] + ' (' + f(r[9], 2) + ' g/mol) formed?'), a: mP, unit: 'g',
          sol: 'n(' + r[1] + ') = ' + H.sig(d.nA, 3) + ' mol → ÷' + r[2] + ' = ' + H.sig(d.nA / r[2], 3) + '; n(' + r[4] + ') = ' + H.sig(d.nB, 3) + ' mol → ÷' + r[5] + ' = ' + H.sig(d.nB / r[5], 3) + '. ' + t('Limitante', 'Limiting') + ': ' + (d.lim === 'A' ? r[1] : r[4]) + '. m(' + r[7] + ') = ' + H.sig(d.x, 3) + ' × ' + r[8] + ' × ' + f(r[9], 2) + ' = ' + H.sig(mP, 3) + ' g' };
      } },
      { name: ['¿Cuál es el reactivo limitante?', 'Which is the limiting reactant?'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), r = d.r; if (Math.abs(d.nA / r[2] - d.nB / r[5]) / d.x < 0.05) return null;
        return { q: t('Para ' + r[0] + ' se mezclan ' + f(d.mA, 1) + ' g de ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) y ' + f(d.mB, 1) + ' g de ' + r[4] + ' (' + f(r[6], 2) + ' g/mol). ¿Cuál es el reactivo limitante?', 'For ' + r[0] + ', ' + f(d.mA, 1) + ' g of ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) and ' + f(d.mB, 1) + ' g of ' + r[4] + ' (' + f(r[6], 2) + ' g/mol) are mixed. Which is the limiting reactant?'),
          options: [r[1], r[4]], answer: d.lim === 'A' ? 0 : 1,
          sol: t('Divide los moles de cada reactivo por su coeficiente: ', 'Divide the moles of each reactant by its coefficient: ') + r[1] + ' ' + H.sig(d.nA / r[2], 3) + ', ' + r[4] + ' ' + H.sig(d.nB / r[5], 3) + t('. El menor es el limitante.', '. The smaller one is limiting.') };
      } },
      { name: ['Reactivo en exceso que sobra', 'Leftover excess reactant'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), r = d.r, ex = d.lim === 'A' ? 'B' : 'A', left = ex === 'A' ? (d.nA - d.x * r[2]) * r[3] : (d.nB - d.x * r[5]) * r[6], nm = ex === 'A' ? r[1] : r[4];
        if (left < 0.05) return null;
        return { q: t('Para ' + r[0] + ' se mezclan ' + f(d.mA, 1) + ' g de ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) y ' + f(d.mB, 1) + ' g de ' + r[4] + ' (' + f(r[6], 2) + ' g/mol). ¿Qué masa del reactivo en exceso queda sin reaccionar?', 'For ' + r[0] + ', ' + f(d.mA, 1) + ' g of ' + r[1] + ' (' + f(r[3], 2) + ' g/mol) and ' + f(d.mB, 1) + ' g of ' + r[4] + ' (' + f(r[6], 2) + ' g/mol) are mixed. What mass of the excess reactant is left unreacted?'), a: left, unit: 'g', tol: 0.03,
          sol: t('Limitante: ', 'Limiting: ') + (d.lim === 'A' ? r[1] : r[4]) + t('; avance = ', '; extent = ') + H.sig(d.x, 3) + ' mol. ' + t('Sobra de ', 'Leftover ') + nm + ': ' + H.sig(left, 3) + ' g' };
      } },
      { name: ['Rendimiento porcentual', 'Percent yield'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), r = d.r, mP = d.x * r[8] * r[9], real = Math.round(mP * H.rnd(0.5, 0.97, 2) * 100) / 100, p = real / mP * 100;
        return { q: t('Para ' + r[0] + ' el rendimiento teórico de ' + r[7] + ' es ' + H.sig(mP, 3) + ' g y se obtienen ' + f(real, 2) + ' g. ¿Cuál es el rendimiento porcentual?', 'For ' + r[0] + ' the theoretical yield of ' + r[7] + ' is ' + H.sig(mP, 3) + ' g and ' + f(real, 2) + ' g are obtained. What is the percent yield?'), a: p, unit: '%', tol: 0.015,
          sol: '% = ' + f(real, 2) + ' / ' + H.sig(mP, 3) + ' × 100 = ' + H.sig(p, 3) + ' %' };
      } }
    ]
  });
})();
