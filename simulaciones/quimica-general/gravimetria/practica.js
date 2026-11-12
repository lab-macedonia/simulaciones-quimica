/* Práctica y predicciones · Análisis gravimétrico. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* [analito, forma pesada, factor gravimétrico, explicación del factor] */
  var A = [['Cl', 'AgCl', 35.45 / 143.32, 'M(Cl) / M(AgCl) = 35,45 / 143,32'], ['SO₄²⁻', 'BaSO₄', 96.06 / 233.39, 'M(SO₄) / M(BaSO₄) = 96,06 / 233,39'], ['S', 'BaSO₄', 32.06 / 233.39, 'M(S) / M(BaSO₄) = 32,06 / 233,39'],
    ['Fe', 'Fe₂O₃', 2 * 55.845 / 159.69, '2·M(Fe) / M(Fe₂O₃) = 111,69 / 159,69'], ['Ni', 'Ni(C₄H₇N₂O₂)₂', 58.69 / 288.91, 'M(Ni) / M(Ni(DMG)₂) = 58,69 / 288,91'], ['Ca', 'CaO', 40.08 / 56.08, 'M(Ca) / M(CaO) = 40,08 / 56,08']];
  SimAula.register({
    problems: [
      { name: ['Porcentaje del analito', 'Percentage of analyte'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(A), ms = H.rnd(0.2, 1.5, 4), pct = H.rnd(5, 70, 1), mp = ms * pct / 100 / a[2]; mp = Math.round(mp * 10000) / 10000; var p = mp * a[2] / ms * 100;
        return { q: t('Una muestra de ' + f(ms, 4) + ' g se trata y el ' + a[0] + ' se pesa como ' + a[1] + ': se obtienen ' + f(mp, 4) + ' g. ¿Cuál es el % de ' + a[0] + ' en la muestra?', 'A ' + f(ms, 4) + ' g sample is treated and the ' + a[0] + ' is weighed as ' + a[1] + ': ' + f(mp, 4) + ' g are obtained. What is the % of ' + a[0] + ' in the sample?'), a: p, unit: '%', tol: 0.01,
          sol: 'FG = ' + (H.EN ? a[3].replace(/(\d),(\d)/g, '$1.$2') : a[3]) + ' = ' + f(a[2], 4) + '; % = m(' + a[1] + ') · FG / m(' + t('muestra', 'sample') + ') × 100 = ' + f(mp, 4) + ' × ' + f(a[2], 4) + ' / ' + f(ms, 4) + ' × 100 = ' + H.sig(p, 3) + ' %' };
      } },
      { name: ['Masa de precipitado esperada', 'Expected precipitate mass'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(A), ms = H.rnd(0.2, 1.5, 4), pct = H.rnd(5, 60, 1), mp = ms * pct / 100 / a[2];
        return { q: t('Una muestra de ' + f(ms, 4) + ' g contiene ' + f(pct, 1) + ' % de ' + a[0] + '. ¿Qué masa de ' + a[1] + ' se obtendrá?', 'A ' + f(ms, 4) + ' g sample contains ' + f(pct, 1) + ' % ' + a[0] + '. What mass of ' + a[1] + ' will be obtained?'), a: mp, unit: 'g', tol: 0.01,
          sol: 'm(' + a[0] + ') = ' + f(ms, 4) + ' × ' + f(pct / 100, 3) + ' = ' + f(ms * pct / 100, 4) + ' g; m(' + a[1] + ') = m(' + a[0] + ') / FG = ' + f(ms * pct / 100, 4) + ' / ' + f(a[2], 4) + ' = ' + f(mp, 4) + ' g', aText: f(mp, 4) };
      } },
      { name: ['Factor gravimétrico', 'Gravimetric factor'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(A);
        return { q: t('Calcula el factor gravimétrico para determinar ' + a[0] + ' pesándolo como ' + a[1] + '.', 'Calculate the gravimetric factor for determining ' + a[0] + ' weighed as ' + a[1] + '.'), a: a[2], unit: '', abs: 0.0015,
          sol: 'FG = ' + (H.EN ? a[3].replace(/(\d),(\d)/g, '$1.$2') : a[3]) + ' = ' + f(a[2], 4), aText: f(a[2], 4) };
      } }
    ],
    predict: {
      2: { q: ['Si el precipitado se pesa sin secarlo por completo (con humedad), el % de analito calculado será…', 'If the precipitate is weighed before it is completely dry (still damp), the calculated % of analyte will be…'],
        options: [['Mayor que el real', 'Higher than the true value'], ['Menor que el real', 'Lower than the true value'], ['Correcto', 'Correct'], ['Imposible de calcular', 'Impossible to calculate']], answer: 0,
        why: ['El agua retenida se suma a la masa pesada y se interpreta como analito: error por exceso. Por eso se calcina hasta masa constante.', 'The retained water adds to the weighed mass and is counted as analyte: a positive error. That is why it is ignited to constant mass.'] },
      1: { q: ['¿Para qué se deja digerir el precipitado en caliente antes de filtrar?', 'Why is the precipitate digested while hot before filtering?'],
        options: [['Para que crezcan cristales más grandes y puros', 'So that larger, purer crystals grow'], ['Para disolverlo de nuevo', 'To dissolve it again'], ['Para que pese más', 'So that it weighs more'], ['Para cambiar su fórmula', 'To change its formula']], answer: 0,
        why: ['Durante la digestión los cristales pequeños se redisuelven y los grandes crecen (maduración de Ostwald): se filtra mejor y se reduce la coprecipitación.', 'During digestion small crystals redissolve and large ones grow (Ostwald ripening): it filters better and coprecipitation is reduced.'] }
    }
  });
})();
