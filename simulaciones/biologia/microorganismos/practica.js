/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Un virus queda solo en un frasco con agua y nutrientes, sin células. ¿Qué ocurre?', 'A virus is left alone in a flask with water and nutrients, but no cells. What happens?'], options: [['se multiplica como una bacteria', 'it multiplies like a bacterium'], ['no se multiplica', 'it does not multiply'], ['crece y forma una célula', 'it grows into a cell']], answer: 1, why: ['Los virus no tienen metabolismo propio: necesitan la maquinaria de una célula hospedera para fabricar copias.', 'Viruses have no metabolism of their own: they need a host cell’s machinery to make copies.'] },
  4: { q: ['Aplicamos un antibiótico al cultivo. Después de un tiempo, la mayoría de las bacterias que quedan serán…', 'We apply an antibiotic to the culture. After a while, most of the remaining bacteria will be…'], options: [['sensibles', 'sensitive'], ['resistentes', 'resistant'], ['ninguna: mueren todas', 'none: they all die']], answer: 1, why: ['El antibiótico selecciona a las pocas resistentes, que sobreviven y se multiplican.', 'The antibiotic selects the few resistant bacteria, which survive and multiply.'] }
} });

/* Práctica: crecimiento bacteriano, tamaños, fermentación y clasificación. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento.', 'Problems with new values on every attempt.'],
  problems: [
    { name: ['Crecimiento por bipartición', 'Growth by binary fission'], gen: function (H) {
      var td = H.pick([20, 30, 40, 60]), h = H.int(1, 6), n = Math.pow(2, h * 60 / td);
      return { q: H.t('Una bacteria se divide cada ' + td + ' min. Partiendo de una sola, ¿cuántas habrá después de ' + h + ' h (sin límite de recursos)?', 'A bacterium divides every ' + td + ' min. Starting from one, how many will there be after ' + h + ' h (unlimited resources)?'), a: n, unit: H.t('bacterias', 'bacteria'), sol: '2^(' + h * 60 + '/' + td + ') = 2^' + h * 60 / td + ' = ' + H.fmt(n, 0) };
    } },
    { name: ['Tiempo de duplicación', 'Doubling time'], gen: function (H) {
      var g = H.int(3, 12), h = H.int(1, 6), td = h * 60 / g;
      return { q: H.t('Un cultivo pasa de 1000 a ' + (1000 * Math.pow(2, g)) + ' bacterias en ' + h + ' h. ¿Cuál es el tiempo de duplicación, en minutos?', 'A culture goes from 1000 to ' + (1000 * Math.pow(2, g)) + ' bacteria in ' + h + ' h. What is the doubling time, in minutes?'), a: td, unit: 'min', sol: H.t('Aumentó 2^' + g + ' veces: ' + g + ' generaciones en ' + h * 60 + ' min → ' + H.fmt(td, 1) + ' min', 'It grew 2^' + g + ' times: ' + g + ' generations in ' + h * 60 + ' min → ' + H.fmt(td, 1) + ' min') };
    } },
    { name: ['Comparar tamaños', 'Comparing sizes'], gen: function (H) {
      var a = H.pick([[['una levadura (6 μm)', 'a yeast cell (6 μm)'], 6], [['una bacteria (2 μm)', 'a bacterium (2 μm)'], 2]]), v = H.pick([0.05, 0.1, 0.2]);
      return { q: H.t('¿Cuántas veces más larga es ' + a[0][0] + ' que un virus de ' + H.fmt(v, 2) + ' μm?', 'How many times longer is ' + a[0][1] + ' than a ' + H.fmt(v, 2) + ' μm virus?'), a: a[1] / v, unit: H.t('veces', 'times'), sol: a[1] + '/' + H.fmt(v, 2) + ' = ' + H.fmt(a[1] / v, 0) };
    } },
    { name: ['Fermentación', 'Fermentation'], gen: function (H) {
      var g = H.int(18, 540), co2 = g * 88 / 180;
      return { q: H.t('La levadura fermenta ' + g + ' g de glucosa (C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂). ¿Cuántos gramos de CO₂ se producen?', 'Yeast ferments ' + g + ' g of glucose (C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂). How many grams of CO₂ are produced?'), a: co2, unit: 'g', sol: g + '·88/180 = ' + H.fmt(co2, 1) + ' g' };
    } },
    { name: ['¿Bacteria, hongo o virus?', 'Bacterium, fungus or virus?'], gen: function (H) {
      var B = [[['No es una célula y solo se multiplica dentro de otra.', 'It is not a cell and only multiplies inside another.'], ['virus', 'virus']], [['Célula procariota que se divide por bipartición.', 'A prokaryotic cell that divides by binary fission.'], ['bacteria', 'bacterium']], [['Célula eucariota que se reproduce por gemación y fermenta el pan.', 'A eukaryotic cell that reproduces by budding and ferments bread.'], ['hongo (levadura)', 'fungus (yeast)']], [['Produce la penicilina.', 'It produces penicillin.'], ['hongo (moho)', 'fungus (mould)']], [['Libera cobre de los minerales en la biominería.', 'It releases copper from ores in biomining.'], ['bacteria', 'bacterium']]];
      return H.bank(B, function (it) { return H.t('«' + it[0][0] + '» ¿Qué microorganismo es?', '“' + it[0][1] + '” Which microorganism is it?'); }, function (it) { return it[1]; }, null);
    } }
  ]
});
