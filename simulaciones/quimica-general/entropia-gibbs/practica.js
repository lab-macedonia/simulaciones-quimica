/* Práctica y predicciones · Entropía y energía libre de Gibbs. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['ΔG = ΔH − TΔS', 'ΔG = ΔH − TΔS'], gen: function (H) {
      var t = H.t, f = H.fmt, dH = H.rnd(-250, 250, 1), dS = H.rnd(-300, 300, 0), T = H.int(250, 1200), G = dH - T * dS / 1000;
      if (Math.abs(dS) < 10) return null;
      return { q: t('Para una reacción ΔH° = ' + f(dH, 1) + ' kJ/mol y ΔS° = ' + f(dS, 0) + ' J·K⁻¹·mol⁻¹. ¿Cuánto vale ΔG° a ' + T + ' K?', 'For a reaction ΔH° = ' + f(dH, 1) + ' kJ/mol and ΔS° = ' + f(dS, 0) + ' J·K⁻¹·mol⁻¹. What is ΔG° at ' + T + ' K?'), a: G, unit: 'kJ/mol', abs: Math.max(0.3, Math.abs(G) * 0.015),
        sol: 'ΔG° = ΔH° − TΔS° = ' + f(dH, 1) + ' − ' + T + ' × (' + f(dS / 1000, 3) + ') = ' + f(G, 1) + ' kJ/mol → ' + (G < 0 ? t('espontánea', 'spontaneous') : t('no espontánea', 'non-spontaneous')), aText: f(G, 1),
        hint: t('ΔS está en J: divídelo por 1000 para trabajar en kJ.', 'ΔS is in J: divide by 1000 to work in kJ.') };
    } },
    { name: ['Temperatura de equilibrio', 'Equilibrium temperature'], gen: function (H) {
      var t = H.t, f = H.fmt, s = H.pick([1, -1]), dH = s * H.rnd(10, 200, 1), dS = s * H.rnd(20, 250, 0), T = dH * 1000 / dS;
      return { q: t('Una reacción tiene ΔH° = ' + f(dH, 1) + ' kJ/mol y ΔS° = ' + f(dS, 0) + ' J·K⁻¹·mol⁻¹. ¿A qué temperatura ΔG° = 0?', 'A reaction has ΔH° = ' + f(dH, 1) + ' kJ/mol and ΔS° = ' + f(dS, 0) + ' J·K⁻¹·mol⁻¹. At what temperature is ΔG° = 0?'), a: T, unit: 'K',
        sol: 'T = ΔH° / ΔS° = ' + f(dH * 1000, 0) + ' J / ' + f(dS, 0) + ' J/K = ' + H.sig(T, 3) + ' K. ' + (s > 0 ? t('Por encima de esa T es espontánea.', 'Above that T it is spontaneous.') : t('Por debajo de esa T es espontánea.', 'Below that T it is spontaneous.')) };
    } },
    { name: ['Constante de equilibrio desde ΔG°', 'Equilibrium constant from ΔG°'], gen: function (H) {
      var t = H.t, f = H.fmt, G = H.rnd(-30, 30, 1), T = H.pick([298, 298, 350, 400, 500]), K = Math.exp(-G * 1000 / (8.314 * T));
      if (Math.abs(G) < 0.5) return null;
      return { q: t('Si ΔG° = ' + f(G, 1) + ' kJ/mol a ' + T + ' K, ¿cuánto vale K?', 'If ΔG° = ' + f(G, 1) + ' kJ/mol at ' + T + ' K, what is K?'), a: K, unit: '', tol: 0.04,
        sol: 'K = e<sup>−ΔG°/RT</sup> = e<sup>−(' + f(G * 1000, 0) + ')/(' + f(8.314, 3) + ' × ' + T + ')</sup> = e<sup>' + f(-G * 1000 / (8.314 * T), 3) + '</sup> = ' + H.sig(K, 3) };
    } },
    { name: ['Expansión isotérmica de un gas', 'Isothermal expansion of a gas'], gen: function (H) {
      var t = H.t, f = H.fmt, n = H.rnd(0.5, 3, 1), r = H.pick([2, 3, 4, 5, 10]), S = n * 8.314 * Math.log(r);
      return { q: t(f(n, 1) + ' mol de gas ideal se expanden a temperatura constante hasta ' + r + ' veces su volumen inicial. ¿Cuánto vale ΔS?', f(n, 1) + ' mol of ideal gas expand at constant temperature to ' + r + ' times the initial volume. What is ΔS?'), a: S, unit: 'J/K',
        sol: 'ΔS = nR ln(V₂/V₁) = ' + f(n, 1) + ' × ' + f(8.314, 3) + ' × ln ' + r + ' = ' + H.sig(S, 3) + ' J/K' };
    } },
    { name: ['Espontaneidad según los signos', 'Spontaneity from the signs'], gen: function (H) {
      var t = H.t, c = H.int(0, 3), sh = ['ΔH < 0, ΔS > 0', 'ΔH > 0, ΔS < 0', 'ΔH < 0, ΔS < 0', 'ΔH > 0, ΔS > 0'][c];
      return { q: t('Una reacción tiene ' + sh + '. ¿Cuándo es espontánea?', 'A reaction has ' + sh + '. When is it spontaneous?'),
        options: [t('A cualquier temperatura', 'At any temperature'), t('Nunca', 'Never'), t('Solo a baja temperatura', 'Only at low temperature'), t('Solo a alta temperatura', 'Only at high temperature')], answer: c,
        sol: t('ΔG = ΔH − TΔS: el término −TΔS pesa más a mayor T. Si ambos favorecen (o ambos se oponen), el signo de ΔG no depende de T.', 'ΔG = ΔH − TΔS: the −TΔS term weighs more at higher T. If both terms favor (or both oppose), the sign of ΔG does not depend on T.') };
    } }
  ],
  predict: {
    2: { q: ['Un gas se expande al vacío hasta ocupar el doble de volumen. ¿Qué signo tiene ΔS del gas?', 'A gas expands into a vacuum to twice its volume. What is the sign of the gas\'s ΔS?'],
      options: [['Positivo: hay más microestados', 'Positive: there are more microstates'], ['Negativo', 'Negative'], ['Cero, porque no hay intercambio de calor', 'Zero, because no heat is exchanged'], ['Depende de la presión exterior', 'It depends on the external pressure']], answer: 0,
      why: ['Cada molécula tiene el doble de posiciones posibles: W crece en un factor 2<sup>N</sup> y ΔS = nR ln 2 > 0, aunque q = 0.', 'Each molecule has twice as many possible positions: W grows by a factor of 2<sup>N</sup> and ΔS = nR ln 2 > 0, even though q = 0.'] },
    3: { q: ['Ordena la entropía molar de una sustancia en sus tres estados.', 'Order the molar entropy of a substance in its three states.'],
      options: [['S(s) < S(l) < S(g)', 'S(s) < S(l) < S(g)'], ['S(g) < S(l) < S(s)', 'S(g) < S(l) < S(s)'], ['S(l) < S(s) < S(g)', 'S(l) < S(s) < S(g)'], ['Son iguales', 'They are equal']], answer: 0,
      why: ['Más libertad de movimiento significa más microestados accesibles; el salto mayor ocurre al pasar a gas.', 'More freedom of motion means more accessible microstates; the biggest jump occurs on going to the gas.'] },
    4: { q: ['Una reacción con ΔH > 0 y ΔS > 0 será espontánea…', 'A reaction with ΔH > 0 and ΔS > 0 will be spontaneous…'],
      options: [['A temperatura alta', 'At high temperature'], ['A temperatura baja', 'At low temperature'], ['Siempre', 'Always'], ['Nunca', 'Never']], answer: 0,
      why: ['ΔG = ΔH − TΔS se hace negativo cuando T > ΔH/ΔS: a alta temperatura el aumento de entropía compensa el costo de entalpía.', 'ΔG = ΔH − TΔS becomes negative when T > ΔH/ΔS: at high temperature the entropy gain outweighs the enthalpy cost.'] }
  }
});
