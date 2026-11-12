/* Práctica y predicciones · Síntesis de la aspirina. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var MSA = 138.12, MAA = 102.09, MASA = 180.16, DAA = 1.08;
  SimAula.register({
    problems: [
      { name: ['Rendimiento teórico', 'Theoretical yield'], gen: function (H) {
        var t = H.t, f = H.fmt, m = H.rnd(1, 10, 2), y = m / MSA * MASA;
        return { q: t('Se acetilan ' + f(m, 2) + ' g de ácido salicílico (M = 138,12 g/mol) con exceso de anhídrido acético. ¿Cuál es el rendimiento teórico de aspirina (M = 180,16 g/mol)?', f(m, 2) + ' g of salicylic acid (M = 138.12 g/mol) are acetylated with excess acetic anhydride. What is the theoretical yield of aspirin (M = 180.16 g/mol)?'), a: y, unit: 'g',
          sol: 'n = ' + f(m, 2) + ' / ' + f(MSA, 2) + ' = ' + H.sig(m / MSA, 3) + ' mol (1 : 1); m = n × ' + f(MASA, 2) + ' = ' + H.sig(y, 3) + ' g' };
      } },
      { name: ['Reactivo limitante y rendimiento', 'Limiting reagent and yield'], gen: function (H) {
        var t = H.t, f = H.fmt, m = H.rnd(1, 6, 2), V = H.rnd(1, 8, 1), nSA = m / MSA, nAA = V * DAA / MAA, lim = nSA <= nAA, y = Math.min(nSA, nAA) * MASA;
        return { q: t('Se mezclan ' + f(m, 2) + ' g de ácido salicílico (138,12 g/mol) con ' + f(V, 1) + ' mL de anhídrido acético (d = 1,08 g/mL; 102,09 g/mol). ¿Cuántos gramos de aspirina (180,16 g/mol) se pueden obtener como máximo?', f(m, 2) + ' g of salicylic acid (138.12 g/mol) are mixed with ' + f(V, 1) + ' mL of acetic anhydride (d = 1.08 g/mL; 102.09 g/mol). What is the maximum mass of aspirin (180.16 g/mol) that can be obtained?'), a: y, unit: 'g',
          sol: 'n(' + t('ácido salicílico', 'salicylic acid') + ') = ' + H.sig(nSA, 3) + ' mol; n(' + t('anhídrido', 'anhydride') + ') = ' + f(V, 1) + ' × ' + f(DAA, 2) + ' / ' + f(MAA, 2) + ' = ' + H.sig(nAA, 3) + ' mol → ' + t('limitante: ', 'limiting: ') + (lim ? t('ácido salicílico', 'salicylic acid') : t('anhídrido acético', 'acetic anhydride')) + '; m = ' + H.sig(Math.min(nSA, nAA), 3) + ' × ' + f(MASA, 2) + ' = ' + H.sig(y, 3) + ' g' };
      } },
      { name: ['Rendimiento porcentual', 'Percent yield'], gen: function (H) {
        var t = H.t, f = H.fmt, m = H.rnd(1, 8, 2), y = m / MSA * MASA, real = y * H.rnd(0.45, 0.95, 2), real2 = Math.round(real * 100) / 100, p = real2 / y * 100;
        return { q: t('A partir de ' + f(m, 2) + ' g de ácido salicílico (138,12 g/mol) se obtienen ' + f(real2, 2) + ' g de aspirina seca (180,16 g/mol). ¿Cuál es el rendimiento porcentual?', 'From ' + f(m, 2) + ' g of salicylic acid (138.12 g/mol), ' + f(real2, 2) + ' g of dry aspirin (180.16 g/mol) are obtained. What is the percent yield?'), a: p, unit: '%', tol: 0.01,
          sol: t('Teórico = ', 'Theoretical = ') + H.sig(y, 3) + ' g; % = ' + f(real2, 2) + ' / ' + H.sig(y, 3) + ' × 100 = ' + H.sig(p, 3) + ' %' };
      } }
    ],
    predict: {
      3: { q: ['Comparado con el rendimiento teórico, el rendimiento real de la síntesis será…', 'Compared with the theoretical yield, the actual yield of the synthesis will be…'],
        options: [['Menor', 'Lower'], ['Igual', 'Equal'], ['Mayor', 'Higher'], ['Imposible de predecir', 'Impossible to predict']], answer: 0,
        why: ['Siempre se pierde producto: reacción incompleta, pérdidas al filtrar y lavar, y lo que queda disuelto en las aguas madres al recristalizar.', 'Some product is always lost: incomplete reaction, losses during filtering and washing, and what stays dissolved in the mother liquor when recrystallizing.'] },
      5: { q: ['Si a la aspirina obtenida le queda ácido salicílico sin reaccionar, al añadir FeCl₃…', 'If the aspirin obtained still contains unreacted salicylic acid, on adding FeCl₃…'],
        options: [['Aparece un color violeta', 'A violet color appears'], ['No cambia de color', 'The color does not change'], ['Precipita un sólido blanco', 'A white solid precipitates'], ['Se desprende un gas', 'A gas is released']], answer: 0,
        why: ['El Fe³⁺ forma un complejo violeta con el grupo fenol libre del ácido salicílico; en la aspirina ese OH está acetilado.', 'Fe³⁺ forms a violet complex with the free phenol group of salicylic acid; in aspirin that OH is acetylated.'] }
    }
  });
})();
