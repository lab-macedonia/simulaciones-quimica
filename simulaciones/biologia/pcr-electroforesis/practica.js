/* Práctica y predicciones · PCR y electroforesis en gel. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Copias tras n ciclos', 'Copies after n cycles'], gen: function (H) {
      var t = H.t, f = H.fmt, N0 = H.pick([1, 10, 50, 100, 1000]), n = H.int(10, 35), E = H.pick([1, 1, 0.9, 0.95, 0.8]), N = N0 * Math.pow(1 + E, n);
      return { q: t('Una PCR parte de ' + N0 + ' copias del molde y corre ' + n + ' ciclos con eficiencia ' + f(E * 100, 0) + ' %. ¿Cuántas copias hay al final (en notación científica, por ejemplo 1,0e9)?', 'A PCR starts with ' + N0 + ' template copies and runs ' + n + ' cycles at ' + f(E * 100, 0) + ' % efficiency. How many copies are there at the end (in scientific notation, e.g. 1.0e9)?'), a: N, unit: t('copias', 'copies'), tol: 0.03,
        sol: 'N = N₀·(1 + E)ⁿ = ' + N0 + ' × ' + f(1 + E, 2) + '<sup>' + n + '</sup> = ' + H.sig(N, 3) };
    } },
    { name: ['Ciclos necesarios', 'Cycles needed'], gen: function (H) {
      var t = H.t, N0 = H.pick([1, 10, 100, 1000]), target = H.pick([1e6, 1e8, 1e9, 1e10, 1e12]), n = Math.ceil(Math.log2(target / N0));
      return { q: t('Con eficiencia del 100 %, ¿cuántos ciclos se necesitan como mínimo para pasar de ' + N0 + ' a al menos ' + H.sig(target, 1) + ' copias?', 'At 100 % efficiency, what is the minimum number of cycles to go from ' + N0 + ' to at least ' + H.sig(target, 1) + ' copies?'), a: n, unit: t('ciclos', 'cycles'), abs: 0,
        sol: 'n = log₂(N/N₀) = log₂(' + H.sig(target / N0, 2) + ') = ' + H.fmt(Math.log2(target / N0), 2) + t(' → se redondea hacia arriba: ', ' → round up: ') + n, aText: String(n) };
    } },
    { name: ['Temperatura de fusión de un cebador', 'Primer melting temperature'], gen: function (H) {
      var t = H.t, L = H.int(16, 24), s = '', at = 0, gc = 0;
      for (var i = 0; i < L; i++) { var b = 'ATGC'[H.int(0, 3)]; s += b; if (b === 'A' || b === 'T') at++; else gc++; }
      if (gc < 5 || at < 5) return null;
      var Tm = 2 * at + 4 * gc;
      return { q: t('Estima la T<sub>m</sub> del cebador 5′-' + s + '-3′ con la regla de Wallace: T<sub>m</sub> = 2·(A+T) + 4·(G+C).', 'Estimate the T<sub>m</sub> of the primer 5′-' + s + '-3′ with the Wallace rule: T<sub>m</sub> = 2·(A+T) + 4·(G+C).'), a: Tm, unit: '°C', abs: 0,
        sol: 'A+T = ' + at + ', G+C = ' + gc + ' → T<sub>m</sub> = 2 × ' + at + ' + 4 × ' + gc + ' = ' + Tm + ' °C. ' + t('Temperatura de hibridación sugerida ≈ T<sub>m</sub> − 5 = ' + (Tm - 5) + ' °C.', 'Suggested annealing temperature ≈ T<sub>m</sub> − 5 = ' + (Tm - 5) + ' °C.'), aText: String(Tm) };
    } },
    { name: ['Lectura del gel', 'Reading the gel'], gen: function (H) {
      var t = H.t, sizes = H.shuffle([150, 400, 800, 1500, 3000]).slice(0, 3), far = Math.min.apply(null, sizes);
      return { q: t('En un gel de agarosa se cargan fragmentos de ' + sizes.join(', ') + ' pb. ¿Cuál recorre la mayor distancia?', 'Fragments of ' + sizes.join(', ') + ' bp are loaded on an agarose gel. Which travels the farthest?'),
        options: sizes.map(function (x) { return x + t(' pb', ' bp'); }), answer: sizes.indexOf(far),
        sol: t('El ADN (carga negativa) migra hacia el polo +; la malla del gel frena más a los fragmentos grandes, así que el de ' + far + ' pb llega más lejos.', 'DNA (negatively charged) migrates toward the + pole; the gel mesh slows larger fragments more, so the ' + far + ' bp fragment goes farthest.') };
    } }
  ],
  predict: {
    2: { q: ['Partiendo de 1 copia, con eficiencia del 100 %, ¿cuántas copias habrá tras 10 ciclos?', 'Starting from 1 copy at 100 % efficiency, how many copies will there be after 10 cycles?'],
      options: [['1024', '1024'], ['20', '20'], ['100', '100'], ['10', '10']], answer: 0,
      why: ['Cada ciclo duplica el número de copias: 2¹⁰ = 1024. El crecimiento es exponencial, no lineal.', 'Each cycle doubles the number of copies: 2¹⁰ = 1024. Growth is exponential, not linear.'] },
    3: { q: ['Si la temperatura de hibridación es demasiado baja, ¿qué se espera en el gel?', 'If the annealing temperature is too low, what do you expect on the gel?'],
      options: [['Bandas inespecíficas adicionales', 'Extra non-specific bands'], ['Ninguna banda', 'No bands'], ['Una sola banda más intensa', 'A single stronger band'], ['El ADN se degrada', 'The DNA degrades']], answer: 0,
      why: ['A baja temperatura los cebadores toleran desapareamientos y se unen en sitios parecidos: se amplifican productos no deseados.', 'At low temperature the primers tolerate mismatches and bind to similar sites: unwanted products are amplified.'] },
    4: { q: ['En la electroforesis, ¿hacia dónde migra el ADN y qué fragmentos llegan más lejos?', 'In electrophoresis, where does DNA migrate and which fragments go farthest?'],
      options: [['Hacia el polo +; los pequeños llegan más lejos', 'Toward the + pole; small ones go farthest'], ['Hacia el polo −; los grandes llegan más lejos', 'Toward the − pole; large ones go farthest'], ['Hacia el polo +; los grandes llegan más lejos', 'Toward the + pole; large ones go farthest'], ['No migra', 'It does not migrate']], answer: 0,
      why: ['Los fosfatos dan carga negativa al ADN; la carga por longitud es casi constante, así que la separación depende del tamaño: la agarosa frena más a los fragmentos largos.', 'Phosphates give DNA a negative charge; charge per length is almost constant, so separation depends on size: agarose slows long fragments more.'] }
  }
});
