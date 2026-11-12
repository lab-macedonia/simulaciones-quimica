/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  /* Las etapas cambian con el modelo elegido: colisiones (col) o estado de transición (ts). */
  var P = {
    col: {
      2: { q: ['Si se sube la energía de activación Ea, la fracción de choques eficaces…', 'If the activation energy Ea is raised, the fraction of effective collisions…'], options: [['aumenta', 'increases'], ['disminuye', 'decreases'], ['no cambia', 'does not change']], answer: 1, why: ['Menos moléculas tienen E ≥ Ea: la fracción ≈ e^(−Ea/RT) cae y la reacción se hace más lenta.', 'Fewer molecules have E ≥ Ea: the fraction ≈ e^(−Ea/RT) drops and the reaction slows down.'] },
      4: { q: ['Al subir la temperatura, la velocidad de reacción…', 'When the temperature rises, the reaction rate…'], options: [['disminuye', 'decreases'], ['no cambia', 'does not change'], ['aumenta', 'increases']], answer: 2, why: ['Hay más choques y, sobre todo, más moléculas con E ≥ Ea (Arrhenius: k = A·e^(−Ea/RT)).', 'There are more collisions and, above all, more molecules with E ≥ Ea (Arrhenius: k = A·e^(−Ea/RT)).'] }
    },
    ts: {
      2: { q: ['En el estado de transición, los enlaces A···B y B···C están…', 'At the transition state, the A···B and B···C bonds are…'], options: [['A–B formado y B–C roto', 'A–B formed and B–C broken'], ['ambos a medio formar o romper', 'both partly formed or broken'], ['ambos completos', 'both complete']], answer: 1, why: ['En la cima de la barrera ambos enlaces son parciales (órdenes cercanos a 0,5): es el complejo activado, no aislable.', 'At the top of the barrier both bonds are partial (orders near 0.5): it is the activated complex, which cannot be isolated.'] },
      4: { q: ['¿Cuál de estas magnitudes depende del camino de reacción?', 'Which of these quantities depends on the reaction pathway?'], options: [['La energía de activación Ea', 'The activation energy Ea'], ['La entalpía de reacción ΔH', 'The reaction enthalpy ΔH'], ['Las dos', 'Both']], answer: 0, why: ['ΔH solo depende de reactivos y productos; la barrera Ea depende del camino, y por eso un catalizador la cambia.', 'ΔH depends only on reactants and products; the barrier Ea depends on the pathway, which is why a catalyst changes it.'] }
    }
  };
  function at(i) { return function (k) { var m = k && k.state && k.state.mode === 'ts' ? 'ts' : 'col'; return P[m][i] || null; }; }
  SimAula.register({ predict: { 2: at(2), 4: at(4) } });
})();

/* Práctica · Colisiones, Arrhenius y catálisis (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Arrhenius: efecto de la temperatura', 'Arrhenius: temperature effect'], gen: function (H) {
    var f = H.fmt, Ea = H.int(30, 120), T1 = H.int(280, 320), T2 = T1 + H.int(10, 60), r = Math.exp(Ea * 1000 / 8.314 * (1 / T1 - 1 / T2));
    return { q: H.t('Una reacción tiene E<sub>a</sub> = ' + Ea + ' kJ/mol. ¿Por cuánto se multiplica k al pasar de ' + T1 + ' K a ' + T2 + ' K?', 'A reaction has E<sub>a</sub> = ' + Ea + ' kJ/mol. By what factor does k increase from ' + T1 + ' K to ' + T2 + ' K?'), a: r, tol: 0.03,
      sol: 'k₂/k₁ = exp[(E<sub>a</sub>/R)(1/T₁ − 1/T₂)] = exp[' + f(Ea * 1000 / 8.314, 0) + ' × (' + H.sig(1 / T1 - 1 / T2, 3) + ')] = ' + H.sig(r, 3) };
  } },
  { name: ['Energía de activación desde dos constantes', 'Activation energy from two rate constants'], gen: function (H) {
    var f = H.fmt, Ea = H.int(30, 120), T1 = H.int(280, 320), T2 = T1 + H.int(15, 50), r = +Math.exp(Ea * 1000 / 8.314 * (1 / T1 - 1 / T2)).toPrecision(3), E = 8.314 * Math.log(r) / (1 / T1 - 1 / T2) / 1000;
    return { q: H.t('La constante de velocidad se multiplica por ' + H.sig(r, 3) + ' al pasar de ' + T1 + ' K a ' + T2 + ' K. ¿Cuál es E<sub>a</sub>?', 'The rate constant is multiplied by ' + H.sig(r, 3) + ' going from ' + T1 + ' K to ' + T2 + ' K. What is E<sub>a</sub>?'), a: E, unit: 'kJ/mol', tol: 0.02,
      sol: 'E<sub>a</sub> = R·ln(k₂/k₁) / (1/T₁ − 1/T₂) = ' + f(8.314, 3) + ' × ' + f(Math.log(r), 3) + ' / ' + H.sig(1 / T1 - 1 / T2, 3) + ' = ' + H.sig(E, 3) + ' kJ/mol' };
  } },
  { name: ['Efecto de un catalizador', 'Effect of a catalyst'], gen: function (H) {
    var f = H.fmt, d = H.int(10, 40), T = H.pick([298, 310, 350]), r = Math.exp(d * 1000 / (8.314 * T));
    return { q: H.t('Un catalizador baja E<sub>a</sub> en ' + d + ' kJ/mol a ' + T + ' K (mismo factor A). ¿Por cuánto se multiplica la velocidad?', 'A catalyst lowers E<sub>a</sub> by ' + d + ' kJ/mol at ' + T + ' K (same A factor). By what factor does the rate increase?'), a: r, tol: 0.03,
      sol: 'k<sub>cat</sub>/k = e<sup>ΔEa/RT</sup> = e<sup>' + f(d * 1000 / (8.314 * T), 2) + '</sup> = ' + H.sig(r, 3) };
  } }
] });
