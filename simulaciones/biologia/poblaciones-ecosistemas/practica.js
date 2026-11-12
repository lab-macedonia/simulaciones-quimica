/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Ahora el alimento y el espacio son limitados. ¿Qué pasará con la población de degúes?', 'Now food and space are limited. What will happen to the degu population?'], options: [['crecerá sin parar', 'it will grow without end'], ['crecerá y luego se estabilizará', 'it will grow and then level off'], ['se extinguirá', 'it will die out']], answer: 1, why: ['Al acercarse a la capacidad de carga, la natalidad baja y la mortalidad sube: curva en forma de S.', 'Near the carrying capacity, births fall and deaths rise: an S-shaped curve.'] },
  4: { q: ['Llega el conejo europeo, que come los mismos pastos y se reproduce más rápido. El degú…', 'The European rabbit arrives; it eats the same grasses and breeds faster. The degu…'], options: [['aumenta', 'increases'], ['disminuye y puede desaparecer del lugar', 'decreases and may disappear from the area'], ['no se ve afectado', 'is unaffected']], answer: 1, why: ['Compiten por el mismo recurso; el competidor más eficaz desplaza al otro (exclusión competitiva).', 'They compete for the same resource; the more efficient competitor displaces the other (competitive exclusion).'] }
} });

/* Práctica: crecimiento exponencial, capacidad de carga, tasas y niveles de organización. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento.', 'Problems with new values on every attempt.'],
  problems: [
    { name: ['Crecimiento exponencial', 'Exponential growth'], gen: function (H) {
      var N0 = H.int(5, 50), g = H.int(2, 6);
      return { q: H.t('Una población de ' + N0 + ' bacterias se duplica en cada generación. ¿Cuántas habrá tras ' + g + ' generaciones?', 'A population of ' + N0 + ' bacteria doubles every generation. How many will there be after ' + g + ' generations?'), a: N0 * Math.pow(2, g), unit: '', sol: 'N = ' + N0 + '·2^' + g + ' = ' + N0 * Math.pow(2, g) };
    } },
    { name: ['Tasa de crecimiento', 'Growth rate'], gen: function (H) {
      var N = H.int(100, 2000), b = H.int(5, 40), d = H.int(2, 30), im = H.int(0, 10), em = H.int(0, 10), dN = Math.round(N * (b - d) / 100) + im - em;
      return { q: H.t('Una población de ' + N + ' individuos tiene una natalidad de ' + b + ' % y una mortalidad de ' + d + ' % anual; llegan ' + im + ' y se van ' + em + ' individuos. ¿Cuánto cambia en un año?', 'A population of ' + N + ' has a birth rate of ' + b + ' % and a death rate of ' + d + ' % a year; ' + im + ' individuals arrive and ' + em + ' leave. How much does it change in a year?'), a: dN, abs: 1, unit: H.t('individuos', 'individuals'), sol: N + '·(' + b + ' − ' + d + ')/100 + ' + im + ' − ' + em + ' = ' + dN };
    } },
    { name: ['Crecimiento logístico', 'Logistic growth'], gen: function (H) {
      var K = H.pick([200, 500, 1000]), N = H.int(1, 9) * K / 10, r = H.rnd(0.2, 1, 1), dN = r * N * (1 - N / K);
      return { q: H.t('Con r = ' + H.fmt(r, 1) + ' por año, K = ' + K + ' y N = ' + N + ', ¿cuánto crece la población por año según el modelo logístico?', 'With r = ' + H.fmt(r, 1) + ' per year, K = ' + K + ' and N = ' + N + ', how much does the population grow per year in the logistic model?'), a: dN, unit: H.t('individuos/año', 'individuals/year'), sol: 'r·N·(1 − N/K) = ' + H.fmt(r, 1) + '·' + N + '·(1 − ' + N + '/' + K + ') = ' + H.fmt(dN, 1) };
    } },
    { name: ['Nivel de organización', 'Level of organisation'], gen: function (H) {
      var B = [[['Un zorro culpeo', 'One culpeo fox'], ['individuo', 'individual']], [['Todos los zorros culpeo del Parque La Campana', 'All the culpeo foxes in La Campana National Park'], ['población', 'population']], [['Zorros, degúes, quillayes y pastos del parque', 'Foxes, degus, soapbark trees and grasses of the park'], ['comunidad', 'community']], [['Los seres vivos del parque junto con el suelo, el agua y el clima', 'The park’s living things together with soil, water and climate'], ['ecosistema', 'ecosystem']]];
      return H.bank(B, function (it) { return H.t('«' + it[0][0] + '» corresponde a…', '“' + it[0][1] + '” is…'); }, function (it) { return it[1]; }, null);
    } },
    { name: ['Tipo de interacción', 'Type of interaction'], gen: function (H) {
      var B = [[['El zorro come degúes.', 'The fox eats degus.'], ['depredación', 'predation']], [['El conejo y el degú comen los mismos pastos.', 'The rabbit and the degu eat the same grasses.'], ['competencia', 'competition']], [['La abeja obtiene néctar y poliniza la flor.', 'The bee gets nectar and pollinates the flower.'], ['mutualismo', 'mutualism']], [['Una pulga vive y se alimenta del zorro.', 'A flea lives on and feeds on the fox.'], ['parasitismo', 'parasitism']]];
      return H.bank(B, function (it) { return H.t('«' + it[0][0] + '» ¿Qué interacción es?', '“' + it[0][1] + '” Which interaction is it?'); }, function (it) { return it[1]; }, null);
    } }
  ]
});
