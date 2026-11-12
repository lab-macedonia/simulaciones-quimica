/* Práctica y predicciones · Termoquímica y calorimetría. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var MET = [[['cobre', 'copper'], 0.385], [['hierro', 'iron'], 0.449], [['aluminio', 'aluminum'], 0.897], [['plomo', 'lead'], 0.129], [['plata', 'silver'], 0.235]];
  /* [combustible, M (g/mol), ΔH°comb (kJ/mol)] calculados con ΔH°f: CO₂ −393,5; H₂O(l) −285,8 */
  var FUEL = [[['metano (CH₄)', 'methane (CH₄)'], 16.04, -890.3], [['propano (C₃H₈)', 'propane (C₃H₈)'], 44.10, -2219.9], [['etanol (C₂H₅OH)', 'ethanol (C₂H₅OH)'], 46.07, -1366.8], [['glucosa (C₆H₁₂O₆)', 'glucose (C₆H₁₂O₆)'], 180.16, -2802.5], [['octano (C₈H₁₈)', 'octane (C₈H₁₈)'], 114.23, -5470.1]];
  /* [ecuación, productos y reactivos con coeficiente × ΔH°f] */
  var RX = [['CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)', [[1, 'CO₂(g)', -393.5], [2, 'H₂O(l)', -285.8]], [[1, 'CH₄(g)', -74.8]]],
    ['C₃H₈(g) + 5 O₂(g) → 3 CO₂(g) + 4 H₂O(l)', [[3, 'CO₂(g)', -393.5], [4, 'H₂O(l)', -285.8]], [[1, 'C₃H₈(g)', -103.8]]],
    ['CaCO₃(s) → CaO(s) + CO₂(g)', [[1, 'CaO(s)', -635.1], [1, 'CO₂(g)', -393.5]], [[1, 'CaCO₃(s)', -1206.9]]],
    ['2 NO(g) + O₂(g) → 2 NO₂(g)', [[2, 'NO₂(g)', 33.2]], [[2, 'NO(g)', 90.3]]],
    ['Fe₂O₃(s) + 3 CO(g) → 2 Fe(s) + 3 CO₂(g)', [[3, 'CO₂(g)', -393.5]], [[1, 'Fe₂O₃(s)', -824.2], [3, 'CO(g)', -110.5]]],
    ['N₂(g) + 3 H₂(g) → 2 NH₃(g)', [[2, 'NH₃(g)', -46.1]], []]];
  function sum(list) { return list.reduce(function (a, x) { return a + x[0] * x[2]; }, 0); }
  SimAula.register({
    problems: [
      { name: ['Calor y cambio de temperatura', 'Heat and temperature change'], gen: function (H) {
        var t = H.t, f = H.fmt, m = H.int(50, 800), T1 = H.int(10, 30), T2 = H.int(35, 95), q = m * 4.184 * (T2 - T1) / 1000;
        return { q: t('¿Cuánto calor se necesita para calentar ' + m + ' g de agua de ' + T1 + ' °C a ' + T2 + ' °C? (c = 4,184 J·g⁻¹·°C⁻¹)', 'How much heat is needed to warm ' + m + ' g of water from ' + T1 + ' °C to ' + T2 + ' °C? (c = 4.184 J·g⁻¹·°C⁻¹)'), a: q, unit: 'kJ',
          sol: 'q = m·c·ΔT = ' + m + ' × ' + f(4.184, 3) + ' × ' + (T2 - T1) + ' = ' + H.sig(q * 1000, 3) + ' J = ' + H.sig(q, 3) + ' kJ', hint: t('¿Pasaste de J a kJ?', 'Did you convert J to kJ?') };
      } },
      { name: ['Temperatura de equilibrio', 'Equilibrium temperature'], gen: function (H) {
        var t = H.t, f = H.fmt, M = H.pick(MET), mm = H.int(20, 300), Tm = H.int(70, 250), mw = H.int(50, 400), Tw = H.int(10, 25), Tf = (mm * M[1] * Tm + mw * 4.184 * Tw) / (mm * M[1] + mw * 4.184);
        return { q: t('Un bloque de ' + mm + ' g de ' + H.L(M[0]) + ' (c = ' + f(M[1], 3) + ' J·g⁻¹·°C⁻¹) a ' + Tm + ' °C se sumerge en ' + mw + ' g de agua a ' + Tw + ' °C. ¿Cuál es la temperatura final (sin pérdidas)?', 'A ' + mm + ' g block of ' + H.L(M[0]) + ' (c = ' + f(M[1], 3) + ' J·g⁻¹·°C⁻¹) at ' + Tm + ' °C is dropped into ' + mw + ' g of water at ' + Tw + ' °C. What is the final temperature (no losses)?'), a: Tf, unit: '°C', abs: 0.15,
          sol: t('Calor cedido = calor absorbido: ', 'Heat lost = heat gained: ') + mm + '·' + f(M[1], 3) + '·(' + Tm + ' − T) = ' + mw + '·' + f(4.184, 3) + '·(T − ' + Tw + ') → T = ' + f(Tf, 1) + ' °C', aText: f(Tf, 1) };
      } },
      { name: ['Calor de combustión', 'Heat of combustion'], gen: function (H) {
        var t = H.t, f = H.fmt, F = H.pick(FUEL), m = H.rnd(1, 50, 1), q = m / F[1] * -F[2];
        return { q: t('¿Cuánto calor libera la combustión completa de ' + f(m, 1) + ' g de ' + H.L(F[0]) + '? (M = ' + f(F[1], 2) + ' g/mol, ΔH°<sub>comb</sub> = ' + f(F[2], 1) + ' kJ/mol)', 'How much heat does the complete combustion of ' + f(m, 1) + ' g of ' + H.L(F[0]) + ' release? (M = ' + f(F[1], 2) + ' g/mol, ΔH°<sub>comb</sub> = ' + f(F[2], 1) + ' kJ/mol)'), a: q, unit: 'kJ',
          sol: 'n = ' + f(m, 1) + ' / ' + f(F[1], 2) + ' = ' + H.sig(m / F[1], 3) + ' mol; q = n·|ΔH| = ' + H.sig(m / F[1], 3) + ' × ' + f(-F[2], 1) + ' = ' + H.sig(q, 3) + t(' kJ liberados', ' kJ released'), hint: t('Da el calor liberado como número positivo.', 'Give the heat released as a positive number.') };
      } },
      { name: ['ΔH° de reacción con entalpías de formación', 'Reaction ΔH° from enthalpies of formation'], gen: function (H) {
        var t = H.t, f = H.fmt, r = H.pick(RX), dH = sum(r[1]) - sum(r[2]);
        var lst = r[1].concat(r[2]).map(function (x) { return 'ΔH°f ' + x[1] + ' = ' + f(x[2], 1); }).join('; ');
        return { q: t('Calcula ΔH° para ' + r[0] + ' (kJ/mol: ' + lst + '; los elementos en su estado estándar valen 0).', 'Calculate ΔH° for ' + r[0] + ' (kJ/mol: ' + lst + '; elements in their standard state are 0).'), a: dH, unit: 'kJ', abs: 0.6,
          sol: 'ΔH° = Σ n·ΔH°f(' + t('productos', 'products') + ') − Σ n·ΔH°f(' + t('reactivos', 'reactants') + ') = (' + f(sum(r[1]), 1) + ') − (' + f(sum(r[2]), 1) + ') = ' + f(dH, 1) + ' kJ', aText: f(dH, 1) };
      } }
    ],
    predict: {
      1: { q: ['Un bloque de metal caliente se sumerge en una masa mayor de agua fría. La temperatura final quedará…', 'A hot metal block is dropped into a larger mass of cold water. The final temperature will be…'],
        options: [['Entre ambas, más cerca de la del agua', 'In between, closer to the water temperature'], ['Justo en el promedio de las dos', 'Exactly the average of the two'], ['Más cerca de la del metal', 'Closer to the metal temperature'], ['Igual a la del metal', 'Equal to the metal temperature']], answer: 0,
        why: ['El agua tiene una capacidad calorífica (m·c) mucho mayor que el metal: con el mismo calor intercambiado su temperatura cambia mucho menos.', 'Water has a much larger heat capacity (m·c) than the metal: for the same heat exchanged its temperature changes much less.'] },
      3: { q: ['En una reacción exotérmica, ¿cómo es la entalpía de los productos respecto de la de los reactivos?', 'In an exothermic reaction, how does the enthalpy of the products compare with that of the reactants?'],
        options: [['Menor (ΔH < 0)', 'Lower (ΔH < 0)'], ['Mayor (ΔH > 0)', 'Higher (ΔH > 0)'], ['Igual', 'Equal'], ['Depende del catalizador', 'It depends on the catalyst']], answer: 0,
        why: ['El sistema libera calor al entorno: los productos quedan en un nivel de entalpía más bajo, ΔH = H<sub>prod</sub> − H<sub>reac</sub> < 0.', 'The system releases heat to the surroundings: the products end at a lower enthalpy level, ΔH = H<sub>prod</sub> − H<sub>reac</sub> < 0.'] },
      4: { q: ['Si una reacción se escribe al revés, ¿qué pasa con su ΔH?', 'If a reaction is written in reverse, what happens to its ΔH?'],
        options: [['Cambia de signo, con el mismo valor', 'It changes sign, same magnitude'], ['No cambia', 'It does not change'], ['Se duplica', 'It doubles'], ['Se vuelve cero', 'It becomes zero']], answer: 0,
        why: ['La entalpía es función de estado: ir de B a A es el camino inverso de A a B, así que ΔH cambia de signo. Es la base de la ley de Hess.', 'Enthalpy is a state function: going from B to A reverses A → B, so ΔH changes sign. This is the basis of Hess\'s law.'] }
    }
  });
})();
