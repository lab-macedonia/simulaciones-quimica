/* Práctica y predicciones · Enzimas y cinética enzimática. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Velocidad de Michaelis–Menten', 'Michaelis–Menten rate'], gen: function (H) {
      var t = H.t, f = H.fmt, V = H.int(20, 200), Km = H.rnd(0.5, 20, 1), S = H.rnd(0.2, 50, 1), v = V * S / (Km + S);
      return { q: t('Una enzima tiene V<sub>máx</sub> = ' + V + ' µmol/min y K<sub>m</sub> = ' + f(Km, 1) + ' mM. ¿Cuál es la velocidad con [S] = ' + f(S, 1) + ' mM?', 'An enzyme has V<sub>max</sub> = ' + V + ' µmol/min and K<sub>m</sub> = ' + f(Km, 1) + ' mM. What is the rate at [S] = ' + f(S, 1) + ' mM?'), a: v, unit: 'µmol/min',
        sol: 'v = V<sub>' + t('máx', 'max') + '</sub>[S] / (K<sub>m</sub> + [S]) = ' + V + ' × ' + f(S, 1) + ' / (' + f(Km, 1) + ' + ' + f(S, 1) + ') = ' + H.sig(v, 3) + ' µmol/min' };
    } },
    { name: ['Sustrato para una fracción de Vmáx', 'Substrate for a fraction of Vmax'], gen: function (H) {
      var t = H.t, f = H.fmt, Km = H.rnd(0.5, 15, 1), fr = H.pick([0.25, 0.5, 0.75, 0.8, 0.9, 0.95]), S = Km * fr / (1 - fr);
      return { q: t('¿Qué [S] se necesita para que la enzima trabaje al ' + f(fr * 100, 0) + ' % de V<sub>máx</sub>, si K<sub>m</sub> = ' + f(Km, 1) + ' mM?', 'What [S] is needed for the enzyme to work at ' + f(fr * 100, 0) + ' % of V<sub>max</sub>, if K<sub>m</sub> = ' + f(Km, 1) + ' mM?'), a: S, unit: 'mM',
        sol: 'v/V<sub>' + t('máx', 'max') + '</sub> = [S]/(K<sub>m</sub> + [S]) = ' + f(fr, 2) + ' → [S] = K<sub>m</sub>·f/(1 − f) = ' + f(Km, 1) + ' × ' + f(fr, 2) + ' / ' + f(1 - fr, 2) + ' = ' + H.sig(S, 3) + ' mM' };
    } },
    { name: ['Inhibición competitiva: Km aparente', 'Competitive inhibition: apparent Km'], gen: function (H) {
      var t = H.t, f = H.fmt, Km = H.rnd(0.5, 10, 1), Ki = H.rnd(0.1, 5, 2), I = H.rnd(0.1, 10, 1), Ka = Km * (1 + I / Ki);
      return { q: t('Una enzima (K<sub>m</sub> = ' + f(Km, 1) + ' mM) se mide con ' + f(I, 1) + ' mM de un inhibidor competitivo (K<sub>i</sub> = ' + f(Ki, 2) + ' mM). ¿Cuál es el K<sub>m</sub> aparente?', 'An enzyme (K<sub>m</sub> = ' + f(Km, 1) + ' mM) is assayed with ' + f(I, 1) + ' mM of a competitive inhibitor (K<sub>i</sub> = ' + f(Ki, 2) + ' mM). What is the apparent K<sub>m</sub>?'), a: Ka, unit: 'mM',
        sol: 'K<sub>m,ap</sub> = K<sub>m</sub>(1 + [I]/K<sub>i</sub>) = ' + f(Km, 1) + ' × (1 + ' + f(I, 1) + '/' + f(Ki, 2) + ') = ' + H.sig(Ka, 3) + t(' mM; V<sub>máx</sub> no cambia.', ' mM; V<sub>max</sub> is unchanged.') };
    } },
    { name: ['Lineweaver–Burk', 'Lineweaver–Burk'], gen: function (H) {
      var t = H.t, f = H.fmt, V = H.int(20, 200), Km = H.rnd(0.5, 20, 1), k = H.int(0, 1);
      if (k === 0) return { q: t('En el gráfico de Lineweaver–Burk de una enzima, la recta corta el eje 1/v en ' + H.sig(1 / V, 3) + ' min/µmol. ¿Cuánto vale V<sub>máx</sub>?', 'In an enzyme\'s Lineweaver–Burk plot, the line crosses the 1/v axis at ' + H.sig(1 / V, 3) + ' min/µmol. What is V<sub>max</sub>?'), a: V, unit: 'µmol/min',
        sol: t('Intersección con el eje y = 1/V<sub>máx</sub> → V<sub>máx</sub> = 1 / ', 'y-intercept = 1/V<sub>max</sub> → V<sub>max</sub> = 1 / ') + H.sig(1 / V, 3) + ' = ' + H.sig(V, 3) + ' µmol/min' };
      return { q: t('En el gráfico de Lineweaver–Burk la recta corta el eje 1/[S] en ' + H.sig(-1 / Km, 3) + ' mM⁻¹. ¿Cuánto vale K<sub>m</sub>?', 'In the Lineweaver–Burk plot the line crosses the 1/[S] axis at ' + H.sig(-1 / Km, 3) + ' mM⁻¹. What is K<sub>m</sub>?'), a: Km, unit: 'mM',
        sol: t('Intersección con el eje x = −1/K<sub>m</sub> → K<sub>m</sub> = ', 'x-intercept = −1/K<sub>m</sub> → K<sub>m</sub> = ') + H.sig(Km, 3) + ' mM', hint: t('K<sub>m</sub> es positivo.', 'K<sub>m</sub> is positive.') };
    } }
  ],
  predict: {
    2: { q: ['Al añadir la enzima, ¿qué cambia en el perfil de energía de la reacción?', 'When the enzyme is added, what changes in the reaction energy profile?'],
      options: [['Baja la energía de activación; ΔG no cambia', 'The activation energy drops; ΔG does not change'], ['Cambia el ΔG de la reacción', 'The reaction ΔG changes'], ['Sube la energía de los productos', 'The energy of the products rises'], ['Nada: solo aumenta la temperatura', 'Nothing: it only raises the temperature']], answer: 0,
      why: ['La enzima estabiliza el estado de transición y ofrece otra ruta: acelera la reacción en ambos sentidos sin alterar el equilibrio (ΔG).', 'The enzyme stabilizes the transition state and offers another pathway: it speeds up the reaction in both directions without changing the equilibrium (ΔG).'] },
    3: { q: ['Cuando [S] = K<sub>m</sub>, la velocidad de la enzima es…', 'When [S] = K<sub>m</sub>, the enzyme rate is…'],
      options: [['La mitad de V<sub>máx</sub>', 'Half of V<sub>max</sub>'], ['Igual a V<sub>máx</sub>', 'Equal to V<sub>max</sub>'], ['Un cuarto de V<sub>máx</sub>', 'A quarter of V<sub>max</sub>'], ['Cero', 'Zero']], answer: 0,
      why: ['v = V<sub>máx</sub>·K<sub>m</sub>/(K<sub>m</sub> + K<sub>m</sub>) = V<sub>máx</sub>/2. Esa es la definición operativa de K<sub>m</sub>.', 'v = V<sub>max</sub>·K<sub>m</sub>/(K<sub>m</sub> + K<sub>m</sub>) = V<sub>max</sub>/2. That is the operational definition of K<sub>m</sub>.'] },
    4: { q: ['Con un inhibidor competitivo, ¿qué pasa con V<sub>máx</sub> y K<sub>m</sub>?', 'With a competitive inhibitor, what happens to V<sub>max</sub> and K<sub>m</sub>?'],
      options: [['V<sub>máx</sub> igual, K<sub>m</sub> aumenta', 'V<sub>max</sub> same, K<sub>m</sub> increases'], ['V<sub>máx</sub> baja, K<sub>m</sub> igual', 'V<sub>max</sub> drops, K<sub>m</sub> same'], ['Ambos bajan', 'Both drop'], ['Ninguno cambia', 'Neither changes']], answer: 0,
      why: ['El inhibidor compite por el sitio activo: con suficiente sustrato se desplaza y se alcanza la misma V<sub>máx</sub>, pero hace falta más [S] para llegar a la mitad.', 'The inhibitor competes for the active site: with enough substrate it is displaced and the same V<sub>max</sub> is reached, but more [S] is needed to reach half of it.'] }
  }
});
