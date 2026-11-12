/* Práctica y predicciones · Cinética: órdenes de reacción. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Orden 1: concentración en el tiempo', 'First order: concentration over time'], gen: function (H) {
      var t = H.t, f = H.fmt, A0 = H.rnd(0.2, 2, 2), k = H.rnd(0.005, 0.2, 3), tt = H.int(5, 200), A = A0 * Math.exp(-k * tt);
      if (A < 0.005) return null;
      return { q: t('Una reacción de orden 1 tiene k = ' + f(k, 3) + ' s⁻¹ y [A]₀ = ' + f(A0, 2) + ' M. ¿Cuánto vale [A] a los ' + tt + ' s?', 'A first-order reaction has k = ' + f(k, 3) + ' s⁻¹ and [A]₀ = ' + f(A0, 2) + ' M. What is [A] after ' + tt + ' s?'), a: A, unit: 'M',
        sol: '[A] = [A]₀·e<sup>−kt</sup> = ' + f(A0, 2) + ' × e<sup>−' + f(k, 3) + '×' + tt + '</sup> = ' + H.sig(A, 3) + ' M' };
    } },
    { name: ['Vida media de orden 1', 'First-order half-life'], gen: function (H) {
      var t = H.t, f = H.fmt, k = H.rnd(0.001, 0.5, 3), th = Math.LN2 / k;
      return { q: t('¿Cuál es la vida media de una reacción de orden 1 con k = ' + f(k, 3) + ' s⁻¹?', 'What is the half-life of a first-order reaction with k = ' + f(k, 3) + ' s⁻¹?'), a: th, unit: 's',
        sol: 't<sub>½</sub> = ln 2 / k = ' + f(0.693, 3) + ' / ' + f(k, 3) + ' = ' + H.sig(th, 3) + ' s' };
    } },
    { name: ['Orden 2: concentración en el tiempo', 'Second order: concentration over time'], gen: function (H) {
      var t = H.t, f = H.fmt, A0 = H.rnd(0.1, 1.5, 2), k = H.rnd(0.01, 0.5, 2), tt = H.int(5, 120), A = 1 / (1 / A0 + k * tt);
      return { q: t('Para una reacción de orden 2 con k = ' + f(k, 2) + ' M⁻¹s⁻¹ y [A]₀ = ' + f(A0, 2) + ' M, ¿cuánto vale [A] a los ' + tt + ' s?', 'For a second-order reaction with k = ' + f(k, 2) + ' M⁻¹s⁻¹ and [A]₀ = ' + f(A0, 2) + ' M, what is [A] after ' + tt + ' s?'), a: A, unit: 'M',
        sol: '1/[A] = 1/[A]₀ + kt = ' + H.sig(1 / A0, 3) + ' + ' + f(k, 2) + ' × ' + tt + ' = ' + H.sig(1 / A, 3) + ' M⁻¹ → [A] = ' + H.sig(A, 3) + ' M' };
    } },
    { name: ['Orden 0: tiempo para consumir el reactivo', 'Zero order: time to use up the reactant'], gen: function (H) {
      var t = H.t, f = H.fmt, A0 = H.rnd(0.2, 2, 2), k = H.rnd(0.001, 0.05, 3), tt = A0 / k;
      return { q: t('Una reacción de orden 0 tiene k = ' + f(k, 3) + ' M·s⁻¹. Si [A]₀ = ' + f(A0, 2) + ' M, ¿en cuánto tiempo se consume todo el reactivo?', 'A zero-order reaction has k = ' + f(k, 3) + ' M·s⁻¹. If [A]₀ = ' + f(A0, 2) + ' M, how long does it take to use up all the reactant?'), a: tt, unit: 's',
        sol: '[A] = [A]₀ − kt = 0 → t = [A]₀ / k = ' + f(A0, 2) + ' / ' + f(k, 3) + ' = ' + H.sig(tt, 3) + ' s' };
    } },
    { name: ['Orden a partir de velocidades iniciales', 'Order from initial rates'], gen: function (H) {
      var t = H.t, f = H.fmt, n = H.pick([0, 1, 2]), fac = H.pick([2, 3, 4]), r = Math.pow(fac, n);
      return { q: t('Al multiplicar por ' + fac + ' la concentración inicial de A (lo demás constante), la velocidad inicial se multiplica por ' + r + '. ¿Cuál es el orden respecto de A?', 'When the initial concentration of A is multiplied by ' + fac + ' (everything else constant), the initial rate is multiplied by ' + r + '. What is the order with respect to A?'),
        options: [t('Orden 0', 'Order 0'), t('Orden 1', 'Order 1'), t('Orden 2', 'Order 2'), t('Orden 3', 'Order 3')], answer: n,
        sol: t('v = k[A]ⁿ → ' + r + ' = ' + fac + 'ⁿ → n = ' + n + '.', 'v = k[A]ⁿ → ' + r + ' = ' + fac + 'ⁿ → n = ' + n + '.') };
    } }
  ],
  predict: {
    2: { q: ['En una reacción de orden 0, ¿cómo cambiará [A] con el tiempo?', 'In a zero-order reaction, how will [A] change over time?'],
      options: [['Bajará en línea recta (velocidad constante)', 'It will fall in a straight line (constant rate)'], ['Bajará cada vez más lento, en forma exponencial', 'It will fall more and more slowly, exponentially'], ['Se mantendrá constante', 'It will stay constant'], ['Bajará cada vez más rápido', 'It will fall faster and faster']], answer: 0,
      why: ['En orden 0 la velocidad no depende de [A]: v = k. Por eso [A] = [A]₀ − kt es una recta de pendiente −k.', 'In zero order the rate does not depend on [A]: v = k. So [A] = [A]₀ − kt is a straight line with slope −k.'] },
    3: { q: ['En una reacción de orden 1, ¿qué pasa con la vida media a medida que avanza la reacción?', 'In a first-order reaction, what happens to the half-life as the reaction proceeds?'],
      options: [['Se mantiene constante', 'It stays constant'], ['Se acorta', 'It gets shorter'], ['Se alarga', 'It gets longer'], ['Se hace cero', 'It becomes zero']], answer: 0,
      why: ['t<sub>½</sub> = ln 2 / k no depende de la concentración: cada vida media reduce [A] a la mitad en el mismo tiempo.', 't<sub>½</sub> = ln 2 / k does not depend on concentration: each half-life halves [A] in the same time.'] },
    4: { q: ['En una reacción de orden 2, ¿cómo será la segunda vida media comparada con la primera?', 'In a second-order reaction, how will the second half-life compare with the first?'],
      options: [['El doble de larga', 'Twice as long'], ['Igual', 'The same'], ['La mitad', 'Half as long'], ['Cuatro veces más corta', 'Four times shorter']], answer: 0,
      why: ['t<sub>½</sub> = 1/(k[A]₀): al empezar la segunda vida media [A] es la mitad, así que t<sub>½</sub> se duplica.', 't<sub>½</sub> = 1/(k[A]₀): at the start of the second half-life [A] is halved, so t<sub>½</sub> doubles.'] }
  }
});
