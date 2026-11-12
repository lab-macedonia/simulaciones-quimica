/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Frotamos un globo de goma con lana. ¿Qué carga queda en la lana?', 'We rub a rubber balloon with wool. What charge is left on the wool?'], options: [['ninguna: solo se carga el globo', 'none: only the balloon is charged'], ['positiva, igual en valor a la del globo', 'positive, equal in amount to the balloon’s'], ['negativa, como el globo', 'negative, like the balloon']], answer: 1, why: ['Los electrones que gana el globo salen de la lana: la carga total se conserva.', 'The electrons gained by the balloon come from the wool: total charge is conserved.'] },
  3: { q: ['Acercamos la barra negativa sin tocar el electroscopio y luego la alejamos. Al final, las láminas…', 'We bring the negative rod close without touching the electroscope and then take it away. In the end, the leaves…'], options: [['quedan abiertas', 'stay open'], ['se cierran', 'close'], ['se funden', 'melt']], answer: 1, why: ['La inducción solo separa las cargas mientras la barra está cerca; el electroscopio nunca dejó de ser neutro.', 'Induction only separates the charges while the rod is near; the electroscope never stopped being neutral.'] }
} });

/* Práctica: carga, conservación, signo por frotamiento y ley de Coulomb. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa k = 9·10⁹ N·m²/C² y e = 1,6·10⁻¹⁹ C.', 'Problems with new values on every attempt. Use k = 9·10⁹ N·m²/C² and e = 1.6·10⁻¹⁹ C.'],
  problems: [
    { name: ['Carga y número de electrones', 'Charge and number of electrons'], gen: function (H) {
      var n = H.int(1, 9), ex = H.int(10, 14), q = n * Math.pow(10, ex) * 1.6e-19;
      return { q: H.t('Un cuerpo gana ' + n + '·10' + H.sup(ex) + ' electrones. ¿Cuál es su carga, en nC?', 'A body gains ' + n + '·10' + H.sup(ex) + ' electrons. What is its charge, in nC?'), a: -q * 1e9, unit: 'nC', sol: 'q = −n·e = −' + n + '·10' + H.sup(ex) + '·' + H.fmt(1.6, 1) + '·10⁻¹⁹ = ' + H.fmt(-q * 1e9, 3) + ' nC' };
    } },
    { name: ['Signo por frotamiento', 'Sign after rubbing'], gen: function (H) {
      var S = [['vidrio', 'glass'], ['pelo', 'hair'], ['lana', 'wool'], ['seda', 'silk'], ['papel', 'paper'], ['goma', 'rubber'], ['PVC', 'PVC']], i = H.int(0, 5), j = H.int(i + 1, 6), a = H.pick([i, j]), b = a === i ? j : i, neg = a > b;
      return H.mc(H.t('En la serie triboeléctrica (de + a −): vidrio, pelo, lana, seda, papel, goma, PVC. Si frotas <b>' + S[a][0] + '</b> con <b>' + S[b][0] + '</b>, el ' + S[a][0] + ' queda…', 'In the triboelectric series (from + to −): glass, hair, wool, silk, paper, rubber, PVC. If you rub <b>' + S[a][1] + '</b> with <b>' + S[b][1] + '</b>, the ' + S[a][1] + ' becomes…'), neg ? ['negativo', 'negative'] : ['positivo', 'positive'], [neg ? ['positivo', 'positive'] : ['negativo', 'negative'], ['neutro', 'neutral']], neg ? H.t('Está más abajo en la serie: gana electrones.', 'It is lower in the series: it gains electrons.') : H.t('Está más arriba en la serie: cede electrones.', 'It is higher in the series: it gives up electrons.'));
    } },
    { name: ['Conservación de la carga', 'Conservation of charge'], gen: function (H) {
      var q1 = H.int(-9, 9), q2 = H.int(-9, 9), f = (q1 + q2) / 2;
      return { q: H.t('Dos esferas metálicas iguales tienen ' + q1 + ' μC y ' + q2 + ' μC. Se tocan y se separan. ¿Qué carga queda en cada una?', 'Two identical metal spheres have ' + q1 + ' μC and ' + q2 + ' μC. They touch and are separated. What charge does each one have?'), a: f, abs: 0.01, unit: 'μC', sol: '(' + q1 + ' + ' + q2 + ')/2 = ' + H.fmt(f, 1) + ' μC' };
    } },
    { name: ['Ley de Coulomb', 'Coulomb’s law'], gen: function (H) {
      var q1 = H.int(1, 9), q2 = H.int(1, 9), r = H.int(5, 50), F = 9e9 * q1 * q2 * 1e-12 / Math.pow(r / 100, 2);
      return { q: H.t('Dos cargas de ' + q1 + ' μC y ' + q2 + ' μC están a ' + r + ' cm. ¿Qué fuerza eléctrica se ejercen?', 'Two charges of ' + q1 + ' μC and ' + q2 + ' μC are ' + r + ' cm apart. What electric force do they exert on each other?'), a: F, unit: 'N', sol: 'F = k·q₁·q₂/r² = 9·10⁹·' + q1 + '·10⁻⁶·' + q2 + '·10⁻⁶/' + H.fmt(r / 100, 2) + '² = ' + H.fmt(F, 2) + ' N' };
    } },
    { name: ['Fuerza y distancia', 'Force and distance'], gen: function (H) {
      var F = H.int(2, 90), k = H.pick([2, 3, 4, 0.5]), Fn = F / (k * k);
      return { q: H.t('Dos cargas se atraen con ' + F + ' N. Si la distancia se multiplica por ' + H.fmt(k, 1) + ', ¿cuál es la nueva fuerza?', 'Two charges attract with ' + F + ' N. If the distance is multiplied by ' + H.fmt(k, 1) + ', what is the new force?'), a: Fn, unit: 'N', sol: 'F′ = F/' + H.fmt(k, 1) + '² = ' + F + '/' + H.fmt(k * k, 2) + ' = ' + H.fmt(Fn, 2) + ' N' };
    } }
  ]
});
