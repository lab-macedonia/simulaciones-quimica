/* Práctica y predicciones · Propiedades coligativas. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var SOL = [['C₆H₁₂O₆', ['glucosa', 'glucose'], 180.16, 1], ['C₁₂H₂₂O₁₁', ['sacarosa', 'sucrose'], 342.30, 1], ['NaCl', ['cloruro de sodio', 'sodium chloride'], 58.44, 2], ['CaCl₂', ['cloruro de calcio', 'calcium chloride'], 110.98, 3], ['KBr', ['bromuro de potasio', 'potassium bromide'], 119.00, 2]];
  function setup(H) { var s = H.pick(SOL), m = H.rnd(2, 60, 1), kg = H.pick([0.1, 0.2, 0.25, 0.5, 1]); return { s: s, m: m, kg: kg, mol: m / s[2] / kg }; }
  SimAula.register({
    problems: [
      { name: ['Aumento ebulloscópico', 'Boiling-point elevation'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), dT = d.s[3] * 0.512 * d.mol, Tb = 100 + dT;
        return { q: t('Se disuelven ' + f(d.m, 1) + ' g de ' + H.L(d.s[1]) + ' (' + d.s[0] + ', M = ' + f(d.s[2], 2) + ' g/mol, i = ' + d.s[3] + ') en ' + f(d.kg * 1000, 0) + ' g de agua. ¿A qué temperatura hierve la disolución a 1 atm? (K<sub>b</sub> = 0,512 °C·kg/mol)', f(d.m, 1) + ' g of ' + H.L(d.s[1]) + ' (' + d.s[0] + ', M = ' + f(d.s[2], 2) + ' g/mol, i = ' + d.s[3] + ') are dissolved in ' + f(d.kg * 1000, 0) + ' g of water. At what temperature does the solution boil at 1 atm? (K<sub>b</sub> = 0.512 °C·kg/mol)'), a: Tb, unit: '°C', abs: 0.03,
          sol: 'm = ' + H.sig(d.m / d.s[2], 3) + ' mol / ' + f(d.kg, 2) + ' kg = ' + H.sig(d.mol, 3) + ' mol/kg; ΔT<sub>b</sub> = i·K<sub>b</sub>·m = ' + d.s[3] + ' × ' + f(0.512, 3) + ' × ' + H.sig(d.mol, 3) + ' = ' + f(dT, 2) + ' °C → T<sub>b</sub> = ' + f(Tb, 2) + ' °C', aText: f(Tb, 2) };
      } },
      { name: ['Descenso crioscópico', 'Freezing-point depression'], gen: function (H) {
        var t = H.t, f = H.fmt, d = setup(H), dT = d.s[3] * 1.86 * d.mol;
        return { q: t('¿Cuál es el punto de congelación de una disolución con ' + f(d.m, 1) + ' g de ' + H.L(d.s[1]) + ' (' + d.s[0] + ', M = ' + f(d.s[2], 2) + ' g/mol, i = ' + d.s[3] + ') en ' + f(d.kg * 1000, 0) + ' g de agua? (K<sub>f</sub> = 1,86 °C·kg/mol)', 'What is the freezing point of a solution of ' + f(d.m, 1) + ' g of ' + H.L(d.s[1]) + ' (' + d.s[0] + ', M = ' + f(d.s[2], 2) + ' g/mol, i = ' + d.s[3] + ') in ' + f(d.kg * 1000, 0) + ' g of water? (K<sub>f</sub> = 1.86 °C·kg/mol)'), a: -dT, unit: '°C', abs: Math.max(0.03, dT * 0.02),
          sol: 'm = ' + H.sig(d.mol, 3) + ' mol/kg; ΔT<sub>f</sub> = i·K<sub>f</sub>·m = ' + d.s[3] + ' × ' + f(1.86, 2) + ' × ' + H.sig(d.mol, 3) + ' = ' + f(dT, 2) + ' °C → T<sub>f</sub> = ' + f(-dT, 2) + ' °C', aText: f(-dT, 2),
          hint: t('El punto de congelación baja: el resultado es negativo.', 'The freezing point drops: the result is negative.') };
      } },
      { name: ['Presión osmótica', 'Osmotic pressure'], gen: function (H) {
        var t = H.t, f = H.fmt, s = H.pick(SOL), M = H.pick([0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.3]), T = H.int(278, 310), p = s[3] * M * 0.08206 * T;
        return { q: t('Calcula la presión osmótica de una disolución ' + f(M, 3) + ' M de ' + H.L(s[1]) + ' (i = ' + s[3] + ') a ' + T + ' K.', 'Calculate the osmotic pressure of a ' + f(M, 3) + ' M ' + H.L(s[1]) + ' solution (i = ' + s[3] + ') at ' + T + ' K.'), a: p, unit: 'atm',
          sol: 'π = i·M·R·T = ' + s[3] + ' × ' + f(M, 3) + ' × ' + f(0.08206, 5) + ' × ' + T + ' = ' + H.sig(p, 3) + ' atm' };
      } },
      { name: ['Ley de Raoult', 'Raoult\'s law'], gen: function (H) {
        var t = H.t, f = H.fmt, ms = H.rnd(10, 120, 1), mw = H.pick([100, 150, 200, 250]), ns = ms / 342.30, nw = mw / 18.02, x = nw / (nw + ns), P = x * 23.8;
        return { q: t('Se disuelven ' + f(ms, 1) + ' g de sacarosa (M = 342,30 g/mol) en ' + mw + ' g de agua a 25 °C (P° = 23,8 mmHg). ¿Cuál es la presión de vapor de la disolución?', f(ms, 1) + ' g of sucrose (M = 342.30 g/mol) are dissolved in ' + mw + ' g of water at 25 °C (P° = 23.8 mmHg). What is the vapor pressure of the solution?'), a: P, unit: 'mmHg', tol: 0.004,
          sol: t('n(sacarosa) = ', 'n(sucrose) = ') + H.sig(ns, 3) + ' mol; n(H₂O) = ' + mw + ' / ' + f(18.02, 2) + ' = ' + H.sig(nw, 4) + ' mol; x(H₂O) = ' + f(x, 4) + '; P = x·P° = ' + f(x, 4) + ' × ' + f(23.8, 1) + ' = ' + f(P, 2) + ' mmHg', aText: f(P, 2) };
      } }
    ],
    predict: {
      2: { q: ['A igual molalidad, ¿qué disolución hierve a mayor temperatura: glucosa o NaCl?', 'At the same molality, which solution boils at a higher temperature: glucose or NaCl?'],
        options: [['NaCl: aumenta el punto de ebullición cerca del doble', 'NaCl: it raises the boiling point about twice as much'], ['Glucosa, porque su molécula es más grande', 'Glucose, because its molecule is larger'], ['Las dos igual', 'Both the same'], ['Ninguna cambia el punto de ebullición', 'Neither changes the boiling point']], answer: 0,
        why: ['Las propiedades coligativas dependen del número de partículas disueltas. El NaCl se disocia en Na⁺ y Cl⁻ (i ≈ 2); la glucosa no (i = 1).', 'Colligative properties depend on the number of dissolved particles. NaCl dissociates into Na⁺ and Cl⁻ (i ≈ 2); glucose does not (i = 1).'] },
      3: { q: ['Al disolver un soluto en agua, el punto de congelación…', 'When a solute is dissolved in water, the freezing point…'],
        options: [['Baja', 'Drops'], ['Sube', 'Rises'], ['No cambia', 'Does not change'], ['Sube solo si el soluto es iónico', 'Rises only if the solute is ionic']], answer: 0,
        why: ['El soluto dificulta que el disolvente se ordene en el sólido: hace falta enfriar más, ΔT<sub>f</sub> = i·K<sub>f</sub>·m. Por eso se echa sal en las calles con hielo.', 'The solute hinders the solvent from ordering into the solid: it must be cooled further, ΔT<sub>f</sub> = i·K<sub>f</sub>·m. That is why salt is spread on icy roads.'] },
      4: { q: ['Con agua pura a un lado de una membrana semipermeable y una disolución al otro, el agua…', 'With pure water on one side of a semipermeable membrane and a solution on the other, water…'],
        options: [['Pasa hacia la disolución', 'Moves into the solution'], ['Pasa hacia el agua pura', 'Moves into the pure water'], ['No se mueve', 'Does not move'], ['Se mueve junto con el soluto', 'Moves together with the solute']], answer: 0,
        why: ['El disolvente fluye hacia donde su fracción molar es menor (la disolución) hasta que la presión hidrostática iguala la presión osmótica π = iMRT.', 'The solvent flows to where its mole fraction is lower (the solution) until the hydrostatic pressure equals the osmotic pressure π = iMRT.'] }
    }
  });
})();
