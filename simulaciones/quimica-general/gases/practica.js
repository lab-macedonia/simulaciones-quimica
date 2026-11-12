/* Práctica y predicciones · Gases ideales y reales. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Ecuación del gas ideal', 'Ideal gas equation'], gen: function (H) {
      var R = 0.08206, t = H.t, f = H.fmt, n = H.rnd(0.2, 3, 2), T = H.int(250, 600), V = H.rnd(2, 25, 1), P = n * R * T / V, k = H.int(0, 2);
      if (k === 0) return { q: t('¿Qué presión ejercen ' + f(n, 2) + ' mol de gas ideal a ' + T + ' K en un recipiente de ' + f(V, 1) + ' L?', 'What pressure do ' + f(n, 2) + ' mol of ideal gas exert at ' + T + ' K in a ' + f(V, 1) + ' L container?'), a: P, unit: 'atm',
        sol: 'P = nRT / V = ' + f(n, 2) + ' × ' + f(0.08206, 5) + ' × ' + T + ' / ' + f(V, 1) + ' = ' + H.sig(P, 3) + ' atm' };
      if (k === 1) return { q: t('¿Qué volumen ocupan ' + f(n, 2) + ' mol de gas ideal a ' + T + ' K y ' + f(P, 2) + ' atm?', 'What volume do ' + f(n, 2) + ' mol of ideal gas occupy at ' + T + ' K and ' + f(P, 2) + ' atm?'), a: V, unit: 'L',
        sol: 'V = nRT / P = ' + f(n, 2) + ' × ' + f(0.08206, 5) + ' × ' + T + ' / ' + f(P, 2) + ' = ' + H.sig(V, 3) + ' L' };
      return { q: t('¿Cuántos moles de gas hay en ' + f(V, 1) + ' L a ' + f(P, 2) + ' atm y ' + T + ' K?', 'How many moles of gas are in ' + f(V, 1) + ' L at ' + f(P, 2) + ' atm and ' + T + ' K?'), a: n, unit: 'mol',
        sol: 'n = PV / RT = ' + f(P, 2) + ' × ' + f(V, 1) + ' / (' + f(0.08206, 5) + ' × ' + T + ') = ' + H.sig(n, 3) + ' mol' };
    } },
    { name: ['Leyes de Boyle, Charles y Gay-Lussac', 'Boyle, Charles and Gay-Lussac laws'], gen: function (H) {
      var t = H.t, f = H.fmt, k = H.int(0, 2);
      if (k === 0) { var P1 = H.rnd(0.8, 3, 2), V1 = H.rnd(2, 12, 1), V2 = H.rnd(0.5, 10, 1); if (Math.abs(V2 - V1) < 0.5) return null; var P2 = P1 * V1 / V2;
        return { q: t('Un gas ocupa ' + f(V1, 1) + ' L a ' + f(P1, 2) + ' atm. Si a temperatura constante su volumen pasa a ' + f(V2, 1) + ' L, ¿cuál es la nueva presión?', 'A gas occupies ' + f(V1, 1) + ' L at ' + f(P1, 2) + ' atm. If at constant temperature its volume changes to ' + f(V2, 1) + ' L, what is the new pressure?'), a: P2, unit: 'atm',
          sol: t('Boyle: P₁V₁ = P₂V₂ → P₂ = ', 'Boyle: P₁V₁ = P₂V₂ → P₂ = ') + f(P1, 2) + ' × ' + f(V1, 1) + ' / ' + f(V2, 1) + ' = ' + H.sig(P2, 3) + ' atm' }; }
      if (k === 1) { var Va = H.rnd(1, 8, 2), Ta = H.int(200, 350), Tc = H.int(10, 60), Tb = Tc + 273.15 + H.int(30, 200); var Tb0 = Math.round(Tb - 273.15); Tb = Tb0 + 273.15; var Vb = Va * Tb / Ta;
        return { q: t('Un gas ocupa ' + f(Va, 2) + ' L a ' + Ta + ' K. A presión constante se calienta hasta ' + Tb0 + ' °C. ¿Qué volumen ocupa?', 'A gas occupies ' + f(Va, 2) + ' L at ' + Ta + ' K. At constant pressure it is heated to ' + Tb0 + ' °C. What volume does it occupy?'), a: Vb, unit: 'L',
          sol: t('Charles (T en kelvin): T₂ = ', 'Charles (T in kelvin): T₂ = ') + Tb0 + ' + ' + f(273.15, 2) + ' = ' + f(Tb, 2) + ' K; V₂ = V₁·T₂/T₁ = ' + f(Va, 2) + ' × ' + f(Tb, 2) + ' / ' + Ta + ' = ' + H.sig(Vb, 3) + ' L',
          hint: t('¿Pasaste la temperatura a kelvin?', 'Did you convert the temperature to kelvin?') }; }
      var Pa = H.rnd(0.8, 2.5, 2), T1 = H.int(250, 320), T2 = H.int(330, 600), P3 = Pa * T2 / T1;
      return { q: t('Un tanque rígido contiene gas a ' + f(Pa, 2) + ' atm y ' + T1 + ' K. Si se calienta a ' + T2 + ' K, ¿qué presión alcanza?', 'A rigid tank holds gas at ' + f(Pa, 2) + ' atm and ' + T1 + ' K. If heated to ' + T2 + ' K, what pressure does it reach?'), a: P3, unit: 'atm',
        sol: t('Gay-Lussac (V constante): P₂ = P₁·T₂/T₁ = ', 'Gay-Lussac (constant V): P₂ = P₁·T₂/T₁ = ') + f(Pa, 2) + ' × ' + T2 + ' / ' + T1 + ' = ' + H.sig(P3, 3) + ' atm' };
    } },
    { name: ['Rapidez cuadrática media', 'Root-mean-square speed'], gen: function (H) {
      var t = H.t, f = H.fmt, gas = H.pick([['He', 4.003], ['N₂', 28.01], ['O₂', 32.00], ['CO₂', 44.01], ['CH₄', 16.04], ['H₂', 2.016], ['Ar', 39.95]]), T = H.int(200, 800), v = Math.sqrt(3 * 8.314 * T / (gas[1] / 1000));
      return { q: t('Calcula la rapidez cuadrática media de las moléculas de ' + gas[0] + ' (M = ' + f(gas[1], 2) + ' g/mol) a ' + T + ' K.', 'Calculate the root-mean-square speed of ' + gas[0] + ' molecules (M = ' + f(gas[1], 2) + ' g/mol) at ' + T + ' K.'), a: v, unit: 'm/s',
        sol: 'v<sub>rms</sub> = √(3RT/M) = √(3 × ' + f(8.314, 3) + ' × ' + T + ' / ' + f(gas[1] / 1000, 5) + ' kg/mol) = ' + H.sig(v, 3) + ' m/s',
        hint: t('La masa molar debe ir en kg/mol.', 'Molar mass must be in kg/mol.') };
    } },
    { name: ['Presiones parciales (Dalton)', 'Partial pressures (Dalton)'], gen: function (H) {
      var t = H.t, f = H.fmt, a = H.rnd(0.5, 4, 1), b = H.rnd(0.5, 4, 1), P = H.rnd(1, 6, 2), p = a / (a + b) * P;
      return { q: t('Una mezcla tiene ' + f(a, 1) + ' mol de N₂ y ' + f(b, 1) + ' mol de O₂ a una presión total de ' + f(P, 2) + ' atm. ¿Cuál es la presión parcial del N₂?', 'A mixture contains ' + f(a, 1) + ' mol of N₂ and ' + f(b, 1) + ' mol of O₂ at a total pressure of ' + f(P, 2) + ' atm. What is the partial pressure of N₂?'), a: p, unit: 'atm',
        sol: 'x(N₂) = ' + f(a, 1) + ' / ' + f(a + b, 1) + ' = ' + f(a / (a + b), 3) + '; p(N₂) = x·P = ' + f(a / (a + b), 3) + ' × ' + f(P, 2) + ' = ' + H.sig(p, 3) + ' atm' };
    } },
    { name: ['Masa molar a partir de la densidad', 'Molar mass from density'], gen: function (H) {
      var t = H.t, f = H.fmt, gas = H.pick([['CO₂', 44.01], ['O₂', 32.00], ['N₂', 28.01], ['SO₂', 64.07], ['NH₃', 17.03], ['Cl₂', 70.90], ['C₃H₈', 44.10]]), T = H.int(273, 400), P = H.rnd(0.8, 2, 2), d = P * gas[1] / (0.08206 * T);
      d = Math.round(d * 1000) / 1000; var M = d * 0.08206 * T / P;
      return { q: t('Un gas desconocido tiene una densidad de ' + f(d, 3) + ' g/L a ' + T + ' K y ' + f(P, 2) + ' atm. ¿Cuál es su masa molar?', 'An unknown gas has a density of ' + f(d, 3) + ' g/L at ' + T + ' K and ' + f(P, 2) + ' atm. What is its molar mass?'), a: M, unit: 'g/mol',
        sol: 'M = dRT / P = ' + f(d, 3) + ' × ' + f(0.08206, 5) + ' × ' + T + ' / ' + f(P, 2) + ' = ' + H.sig(M, 3) + ' g/mol ' + t('(compatible con ', '(consistent with ') + gas[0] + ')' };
    } }
  ],
  predict: {
    1: { q: ['El volumen se reducirá de 10,0 L a 2,5 L a temperatura constante. ¿Qué ocurrirá con la presión?', 'The volume will drop from 10.0 L to 2.5 L at constant temperature. What will happen to the pressure?'],
      options: [['Se multiplicará por 4', 'It will be multiplied by 4'], ['Se multiplicará por 2', 'It will be multiplied by 2'], ['Se mantendrá igual', 'It will stay the same'], ['Bajará a la cuarta parte', 'It will drop to one quarter']], answer: 0,
      why: ['Ley de Boyle: P·V = constante. Con la cuarta parte del volumen, las moléculas chocan con las paredes cuatro veces más a menudo por unidad de área y la presión se cuadruplica.', 'Boyle\'s law: P·V = constant. With a quarter of the volume, molecules hit each unit of wall area four times as often and the pressure quadruples.'] },
    3: { q: ['Con el émbolo libre (P constante) se calentará el gas de 200 K a 500 K. ¿Qué pasará con el volumen?', 'With a free piston (constant P) the gas will be heated from 200 K to 500 K. What will happen to the volume?'],
      options: [['Aumentará 2,5 veces', 'It will grow 2.5 times'], ['Aumentará 300 L', 'It will grow by 300 L'], ['No cambiará, la presión sube', 'It will not change; the pressure rises'], ['Disminuirá', 'It will decrease']], answer: 0,
      why: ['Ley de Charles: V/T es constante a P constante, así que V crece en la misma proporción que T en kelvin: 500/200 = 2,5.', 'Charles\'s law: V/T is constant at constant P, so V grows in the same ratio as T in kelvin: 500/200 = 2.5.'] },
    4: { q: ['Se subirá la temperatura del N₂. ¿Cómo cambiará la distribución de rapideces moleculares?', 'The temperature of N₂ will be raised. How will the distribution of molecular speeds change?'],
      options: [['Se ensancha y su máximo se corre a rapideces mayores', 'It broadens and its peak shifts to higher speeds'], ['Todas las moléculas pasan a tener la misma rapidez', 'All molecules end up with the same speed'], ['Se angosta y se corre a rapideces menores', 'It narrows and shifts to lower speeds'], ['No cambia: depende solo de la masa', 'It does not change: it depends only on mass']], answer: 0,
      why: ['La rapidez más probable √(2RT/M) crece con T y la curva se aplana: hay más moléculas muy rápidas y la dispersión de rapideces aumenta.', 'The most probable speed √(2RT/M) increases with T and the curve flattens: there are more very fast molecules and the spread of speeds grows.'] },
    5: { q: ['Se comprimirá CO₂ a 250 K. Al principio, ¿cómo será la presión real comparada con la del gas ideal?', 'CO₂ will be compressed at 250 K. At first, how will the real pressure compare with the ideal-gas pressure?'],
      options: [['Menor: dominan las atracciones (Z < 1)', 'Lower: attractions dominate (Z < 1)'], ['Mayor: dominan los volúmenes propios (Z > 1)', 'Higher: molecular volumes dominate (Z > 1)'], ['Igual en todo momento', 'Equal at all times'], ['Cero, porque el CO₂ se licúa', 'Zero, because CO₂ liquefies']], answer: 0,
      why: ['A baja temperatura las atracciones entre moléculas de CO₂ (término a·n²/V²) reducen los choques con las paredes; solo a volúmenes muy pequeños domina el volumen propio (término b) y la presión real supera a la ideal.', 'At low temperature the attractions between CO₂ molecules (a·n²/V² term) reduce wall collisions; only at very small volumes does the molecular volume (b term) dominate and the real pressure exceed the ideal one.'] }
  }
});
