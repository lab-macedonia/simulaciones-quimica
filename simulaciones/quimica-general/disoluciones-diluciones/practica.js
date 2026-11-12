/* Práctica y predicciones · Disoluciones y diluciones. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var S = [['NaCl', 58.44], ['NaOH', 40.00], ['KMnO₄', 158.03], ['CuSO₄·5H₂O', 249.69], ['C₆H₁₂O₆', 180.16], ['KCl', 74.55], ['K₂Cr₂O₇', 294.18]];
  SimAula.register({
    problems: [
      { name: ['Preparar una disolución', 'Preparing a solution'], gen: function (H) {
        var t = H.t, f = H.fmt, s = H.pick(S), M = H.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 1.0]), V = H.pick([50, 100, 250, 500, 1000]), m = M * V / 1000 * s[1];
        return { q: t('¿Qué masa de ' + s[0] + ' (M = ' + f(s[1], 2) + ' g/mol) se necesita para preparar ' + V + ' mL de disolución ' + f(M, 2) + ' M?', 'What mass of ' + s[0] + ' (M = ' + f(s[1], 2) + ' g/mol) is needed to prepare ' + V + ' mL of ' + f(M, 2) + ' M solution?'), a: m, unit: 'g',
          sol: 'n = M · V = ' + f(M, 2) + ' mol/L × ' + f(V / 1000, 3) + ' L = ' + H.sig(M * V / 1000, 3) + ' mol; m = n · M = ' + H.sig(M * V / 1000, 3) + ' × ' + f(s[1], 2) + ' = ' + H.sig(m, 3) + ' g',
          hint: t('¿Pasaste los mL a L?', 'Did you convert mL to L?') };
      } },
      { name: ['Dilución C₁V₁ = C₂V₂', 'Dilution C₁V₁ = C₂V₂'], gen: function (H) {
        var t = H.t, f = H.fmt, C1 = H.pick([0.5, 1, 2, 3, 6, 12]), C2 = H.pick([0.01, 0.05, 0.1, 0.2, 0.25, 0.5]), V2 = H.pick([100, 250, 500, 1000]); if (C2 >= C1) return null; var V1 = C2 * V2 / C1;
        return { q: t('¿Qué volumen de disolución madre ' + f(C1, 2) + ' M se necesita para preparar ' + V2 + ' mL de disolución ' + f(C2, 3) + ' M?', 'What volume of ' + f(C1, 2) + ' M stock solution is needed to prepare ' + V2 + ' mL of ' + f(C2, 3) + ' M solution?'), a: V1, unit: 'mL',
          sol: 'V₁ = C₂V₂ / C₁ = ' + f(C2, 3) + ' × ' + V2 + ' / ' + f(C1, 2) + ' = ' + H.sig(V1, 3) + ' mL' };
      } },
      { name: ['Mezcla de disoluciones', 'Mixing solutions'], gen: function (H) {
        var t = H.t, f = H.fmt, c1 = H.rnd(0.1, 2, 2), v1 = H.int(5, 30) * 10, c2 = H.rnd(0.05, 1.5, 2), v2 = H.int(5, 30) * 10, c = (c1 * v1 + c2 * v2) / (v1 + v2);
        return { q: t('Se mezclan ' + v1 + ' mL de NaCl ' + f(c1, 2) + ' M con ' + v2 + ' mL de NaCl ' + f(c2, 2) + ' M. ¿Cuál es la concentración final (volúmenes aditivos)?', v1 + ' mL of ' + f(c1, 2) + ' M NaCl are mixed with ' + v2 + ' mL of ' + f(c2, 2) + ' M NaCl. What is the final concentration (additive volumes)?'), a: c, unit: 'M',
          sol: 'c = (c₁V₁ + c₂V₂) / (V₁ + V₂) = (' + f(c1, 2) + ' × ' + v1 + ' + ' + f(c2, 2) + ' × ' + v2 + ') / ' + (v1 + v2) + ' = ' + H.sig(c, 3) + ' M' };
      } },
      { name: ['% m/v a molaridad', '% m/v to molarity'], gen: function (H) {
        var t = H.t, f = H.fmt, s = H.pick(S), p = H.rnd(0.5, 15, 1), M = p * 10 / s[1];
        return { q: t('Una disolución de ' + s[0] + ' tiene ' + f(p, 1) + ' % m/v (g por 100 mL). ¿Cuál es su molaridad? (M = ' + f(s[1], 2) + ' g/mol)', 'A ' + s[0] + ' solution is ' + f(p, 1) + ' % m/v (g per 100 mL). What is its molarity? (M = ' + f(s[1], 2) + ' g/mol)'), a: M, unit: 'M',
          sol: t(f(p, 1) + ' g en 100 mL = ' + f(p * 10, 0) + ' g/L; M = ' + f(p * 10, 0) + ' / ' + f(s[1], 2) + ' = ' + H.sig(M, 3) + ' mol/L', f(p, 1) + ' g in 100 mL = ' + f(p * 10, 0) + ' g/L; M = ' + f(p * 10, 0) + ' / ' + f(s[1], 2) + ' = ' + H.sig(M, 3) + ' mol/L') };
      } }
    ],
    predict: {
      2: { q: ['Se añadirá agua a la disolución hasta aumentar su volumen. ¿Qué ocurrirá con los moles de soluto?', 'Water will be added to the solution to increase its volume. What will happen to the moles of solute?'],
        options: [['No cambian: solo cambia la concentración', 'They do not change: only the concentration changes'], ['Disminuyen en la misma proporción', 'They decrease in the same proportion'], ['Aumentan, porque hay más disolución', 'They increase, because there is more solution'], ['Se pierden al agitar', 'They are lost when stirring']], answer: 0,
        why: ['Al diluir se agrega solo disolvente: los moles (C·V) se conservan, por eso C₁V₁ = C₂V₂ y la concentración baja.', 'Diluting adds only solvent: the moles (C·V) are conserved, which is why C₁V₁ = C₂V₂ and the concentration drops.'] },
      3: { q: ['Si se mezclan volúmenes iguales de una disolución 1,0 M y otra 0,2 M del mismo soluto, la concentración final será…', 'If equal volumes of a 1.0 M and a 0.2 M solution of the same solute are mixed, the final concentration will be…'],
        options: [['0,6 M', '0.6 M'], ['1,2 M', '1.2 M'], ['0,8 M', '0.8 M'], ['0,2 M', '0.2 M']], answer: 0,
        why: ['Moles totales / volumen total: (1,0·V + 0,2·V) / 2V = 0,6 M. Con volúmenes iguales es el promedio de las concentraciones.', 'Total moles / total volume: (1.0·V + 0.2·V) / 2V = 0.6 M. With equal volumes it is the average of the concentrations.'] }
    }
  });
})();
