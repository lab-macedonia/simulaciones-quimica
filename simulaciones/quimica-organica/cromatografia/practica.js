/* Práctica y predicciones · Cromatografía en capa fina y en columna. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Cálculo de Rf', 'Calculating Rf'], gen: function (H) {
      var t = H.t, f = H.fmt, df = H.rnd(4, 9, 1), d = H.rnd(0.3, df - 0.2, 1), Rf = d / df;
      return { q: t('En una placa de TLC el frente del disolvente recorre ' + f(df, 1) + ' cm desde la línea de siembra y la mancha ' + f(d, 1) + ' cm. ¿Cuál es el R<sub>f</sub>?', 'On a TLC plate the solvent front travels ' + f(df, 1) + ' cm from the origin and the spot ' + f(d, 1) + ' cm. What is the R<sub>f</sub>?'), a: Rf, unit: '', abs: 0.006,
        sol: 'R<sub>f</sub> = ' + t('distancia de la mancha / distancia del frente', 'spot distance / front distance') + ' = ' + f(d, 1) + ' / ' + f(df, 1) + ' = ' + f(Rf, 2), aText: f(Rf, 2) };
    } },
    { name: ['Distancia a partir del Rf', 'Distance from Rf'], gen: function (H) {
      var t = H.t, f = H.fmt, Rf = H.rnd(0.1, 0.9, 2), df = H.rnd(4, 9, 1), d = Rf * df;
      return { q: t('Un compuesto tiene R<sub>f</sub> = ' + f(Rf, 2) + ' en un eluyente. Si el frente avanza ' + f(df, 1) + ' cm, ¿a qué distancia de la línea de siembra queda la mancha?', 'A compound has R<sub>f</sub> = ' + f(Rf, 2) + ' in an eluent. If the front travels ' + f(df, 1) + ' cm, how far from the origin is the spot?'), a: d, unit: 'cm', abs: 0.06,
        sol: 'd = R<sub>f</sub> × d<sub>' + t('frente', 'front') + '</sub> = ' + f(Rf, 2) + ' × ' + f(df, 1) + ' = ' + f(d, 2) + ' cm', aText: f(d, 2) };
    } },
    { name: ['Polaridad y orden de elución', 'Polarity and elution order'], gen: function (H) {
      var t = H.t, sets = [[[t('hexano', 'hexane'), t('acetato de etilo', 'ethyl acetate'), t('etanol', 'ethanol')]], [[t('naftaleno', 'naphthalene'), t('benzaldehído', 'benzaldehyde'), t('ácido benzoico', 'benzoic acid')]], [[t('tolueno', 'toluene'), t('acetofenona', 'acetophenone'), t('alcohol bencílico', 'benzyl alcohol')]]], s = H.pick(sets)[0], k = H.int(0, 1);
      if (k === 0) return { q: t('En una placa de sílice, ¿cuál de estos compuestos tendrá el R<sub>f</sub> más alto: ' + s.join(', ') + '?', 'On a silica plate, which of these compounds will have the highest R<sub>f</sub>: ' + s.join(', ') + '?'), options: s, answer: 0,
        sol: t('La sílice es polar: retiene más a los compuestos polares. El menos polar (' + s[0] + ') avanza más con el eluyente.', 'Silica is polar: it retains polar compounds more. The least polar (' + s[0] + ') travels farthest with the eluent.') };
      return { q: t('En una columna de sílice con eluyente poco polar, ¿cuál de estos compuestos sale último: ' + s.join(', ') + '?', 'In a silica column with a low-polarity eluent, which of these compounds comes out last: ' + s.join(', ') + '?'), options: s, answer: 2,
        sol: t('El más polar (' + s[2] + ') interactúa más con la sílice y eluye al final.', 'The most polar (' + s[2] + ') interacts most with the silica and elutes last.') };
    } }
  ],
  predict: {
    2: { q: ['Si se usa un eluyente más polar, ¿qué pasa con los R<sub>f</sub> de las manchas?', 'If a more polar eluent is used, what happens to the R<sub>f</sub> values of the spots?'],
      options: [['Aumentan', 'They increase'], ['Disminuyen', 'They decrease'], ['No cambian', 'They do not change'], ['Se invierten', 'They reverse']], answer: 0,
      why: ['Un eluyente más polar compite mejor con los compuestos por los sitios de la sílice y los arrastra más: todas las manchas suben (aunque pueden juntarse).', 'A more polar eluent competes better with the compounds for the silica sites and carries them farther: all spots move up (though they may bunch together).'] },
    3: { q: ['En una columna de sílice, ¿en qué orden salen los compuestos?', 'In a silica column, in what order do the compounds come out?'],
      options: [['Del menos polar al más polar', 'From least polar to most polar'], ['Del más polar al menos polar', 'From most polar to least polar'], ['Por masa molar creciente', 'In order of increasing molar mass'], ['Todos a la vez', 'All at once']], answer: 0,
      why: ['Los compuestos menos polares interactúan poco con la fase estacionaria y avanzan con el eluyente; los polares quedan retenidos más tiempo.', 'Less polar compounds interact little with the stationary phase and move with the eluent; polar ones are held back longer.'] }
  }
});
