/* Práctica y predicciones · El mol y la masa molar. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var NA = 6.022e23;
  var C = [['H₂O', 18.02, ['moléculas', 'molecules']], ['CO₂', 44.01, ['moléculas', 'molecules']], ['NH₃', 17.03, ['moléculas', 'molecules']], ['C₆H₁₂O₆', 180.16, ['moléculas', 'molecules']], ['C₂H₅OH', 46.07, ['moléculas', 'molecules']],
    ['NaCl', 58.44, ['unidades fórmula', 'formula units']], ['CaCO₃', 100.09, ['unidades fórmula', 'formula units']], ['H₂SO₄', 98.08, ['moléculas', 'molecules']], ['Fe', 55.85, ['átomos', 'atoms']], ['Cu', 63.55, ['átomos', 'atoms']]];
  var GAS = [['O₂', 32.00], ['N₂', 28.01], ['CO₂', 44.01], ['CH₄', 16.04], ['NH₃', 17.03], ['He', 4.003]];
  var PCT = [['H₂O', 'O', 1, 16.00, 18.02], ['CO₂', 'C', 1, 12.01, 44.01], ['NH₃', 'N', 1, 14.01, 17.03], ['C₆H₁₂O₆', 'C', 6, 12.01, 180.16], ['CaCO₃', 'Ca', 1, 40.08, 100.09], ['H₂SO₄', 'S', 1, 32.07, 98.08], ['Fe₂O₃', 'Fe', 2, 55.85, 159.69], ['NaCl', 'Cl', 1, 35.45, 58.44], ['C₂H₅OH', 'O', 1, 16.00, 46.07]];
  SimAula.register({
    problems: [
      { name: ['Masa → moles', 'Mass → moles'], gen: function (H) {
        var t = H.t, f = H.fmt, c = H.pick(C), m = H.rnd(2, 250, 1), n = m / c[1];
        return { q: t('¿Cuántos moles hay en ' + f(m, 1) + ' g de ' + c[0] + ' (M = ' + f(c[1], 2) + ' g/mol)?', 'How many moles are there in ' + f(m, 1) + ' g of ' + c[0] + ' (M = ' + f(c[1], 2) + ' g/mol)?'), a: n, unit: 'mol',
          sol: 'n = m / M = ' + f(m, 1) + ' g / ' + f(c[1], 2) + ' g/mol = ' + H.sig(n, 3) + ' mol' };
      } },
      { name: ['Masa → número de partículas', 'Mass → number of particles'], gen: function (H) {
        var t = H.t, f = H.fmt, c = H.pick(C), m = H.rnd(1, 100, 1), N = m / c[1] * NA, u = H.L(c[2]);
        return { q: t('¿Qué número de ' + u + ' hay en ' + f(m, 1) + ' g de ' + c[0] + ' (M = ' + f(c[1], 2) + ' g/mol)? Escribe el resultado en notación científica (por ejemplo 3,01e23).', 'How many ' + u + ' are there in ' + f(m, 1) + ' g of ' + c[0] + ' (M = ' + f(c[1], 2) + ' g/mol)? Write the answer in scientific notation (for example 3.01e23).'), a: N, unit: u,
          sol: 'n = ' + f(m, 1) + ' / ' + f(c[1], 2) + ' = ' + H.sig(m / c[1], 3) + ' mol; N = n · N<sub>A</sub> = ' + H.sig(m / c[1], 3) + ' × ' + H.sig(NA, 4) + ' = ' + H.sig(N, 3) };
      } },
      { name: ['Volumen molar de un gas (CNTP)', 'Molar volume of a gas (STP)'], gen: function (H) {
        var t = H.t, f = H.fmt, g = H.pick(GAS), m = H.rnd(1, 80, 1), n = m / g[1], V = n * 22.4;
        return { q: t('¿Qué volumen ocupan ' + f(m, 1) + ' g de ' + g[0] + ' (M = ' + f(g[1], 2) + ' g/mol) en CNTP (0 °C, 1 atm, 22,4 L/mol)?', 'What volume do ' + f(m, 1) + ' g of ' + g[0] + ' (M = ' + f(g[1], 2) + ' g/mol) occupy at STP (0 °C, 1 atm, 22.4 L/mol)?'), a: V, unit: 'L',
          sol: 'n = ' + f(m, 1) + ' / ' + f(g[1], 2) + ' = ' + H.sig(n, 3) + ' mol; V = n × ' + f(22.4, 1) + ' L/mol = ' + H.sig(V, 3) + ' L' };
      } },
      { name: ['Composición porcentual', 'Percent composition'], gen: function (H) {
        var t = H.t, f = H.fmt, p = H.pick(PCT), pc = p[2] * p[3] / p[4] * 100;
        return { q: t('¿Qué porcentaje en masa de ' + p[1] + ' tiene el ' + p[0] + '? (masa atómica de ' + p[1] + ' = ' + f(p[3], 2) + '; M(' + p[0] + ') = ' + f(p[4], 2) + ' g/mol)', 'What is the mass percentage of ' + p[1] + ' in ' + p[0] + '? (atomic mass of ' + p[1] + ' = ' + f(p[3], 2) + '; M(' + p[0] + ') = ' + f(p[4], 2) + ' g/mol)'), a: pc, unit: '%', tol: 0.01,
          sol: '% ' + p[1] + ' = ' + p[2] + ' × ' + f(p[3], 2) + ' / ' + f(p[4], 2) + ' × 100 = ' + H.sig(pc, 3) + ' %' };
      } }
    ],
    predict: {
      1: { q: ['¿Qué contiene más átomos: 1 mol de hierro (56 g) o 1 mol de helio (4 g)?', 'Which contains more atoms: 1 mol of iron (56 g) or 1 mol of helium (4 g)?'],
        options: [['Los dos contienen el mismo número', 'Both contain the same number'], ['El hierro, porque pesa más', 'Iron, because it is heavier'], ['El helio, porque sus átomos son más pequeños', 'Helium, because its atoms are smaller'], ['Depende de la temperatura', 'It depends on the temperature']], answer: 0,
        why: ['Un mol siempre contiene 6,022 × 10²³ entidades, sin importar su masa: la masa molar cambia, el número de partículas no.', 'A mole always contains 6.022 × 10²³ entities regardless of their mass: the molar mass changes, the number of particles does not.'] },
      3: { q: ['En CNTP, ¿qué ocupa más volumen: 1 mol de H₂ o 1 mol de CO₂?', 'At STP, which occupies more volume: 1 mol of H₂ or 1 mol of CO₂?'],
        options: [['Ocupan el mismo volumen (≈ 22,4 L)', 'They occupy the same volume (≈ 22.4 L)'], ['El CO₂, por tener moléculas más grandes', 'CO₂, because its molecules are larger'], ['El H₂, por ser más liviano', 'H₂, because it is lighter'], ['El CO₂, por ser más pesado', 'CO₂, because it is heavier']], answer: 0,
        why: ['En un gas las moléculas están muy separadas: el volumen depende del número de moles (Avogadro), no del tamaño ni de la masa de cada molécula.', 'In a gas the molecules are far apart: the volume depends on the number of moles (Avogadro), not on the size or mass of each molecule.'] },
      4: { q: ['En el agua (H₂O), ¿qué elemento aporta la mayor parte de la masa?', 'In water (H₂O), which element contributes most of the mass?'],
        options: [['El oxígeno (≈ 89 %)', 'Oxygen (≈ 89 %)'], ['El hidrógeno, porque hay dos átomos', 'Hydrogen, because there are two atoms'], ['Los dos por igual', 'Both equally'], ['Depende de la cantidad de agua', 'It depends on the amount of water']], answer: 0,
        why: ['% O = 16,00 / 18,02 × 100 ≈ 88,8 %. Hay más átomos de H, pero cada uno pesa solo 1,008.', '% O = 16.00 / 18.02 × 100 ≈ 88.8 %. There are more H atoms, but each weighs only 1.008.'] }
    }
  });
})();
