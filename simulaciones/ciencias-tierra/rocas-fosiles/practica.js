/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Se depositan capas de sedimentos durante millones de años. ¿Cuál será la más antigua?', 'Layers of sediment settle for millions of years. Which will be the oldest?'], options: [['la de más arriba', 'the top one'], ['la de más abajo', 'the bottom one'], ['la más gruesa', 'the thickest one']], answer: 1, why: ['Cada capa se deposita sobre la anterior: principio de superposición.', 'Each layer settles on top of the previous one: the principle of superposition.'] },
  4: { q: ['Un dique de magma atraviesa todos los estratos. El dique es…', 'A magma dyke cuts through all the strata. The dyke is…'], options: [['más antiguo que los estratos', 'older than the strata'], ['más joven que los estratos', 'younger than the strata'], ['de la misma edad que el estrato del medio', 'the same age as the middle stratum']], answer: 1, why: ['Para cortar las capas, estas ya tenían que existir: la intrusión es posterior.', 'To cut the layers, they had to exist already: the intrusion came later.'] }
} });

/* Práctica: tipos de roca, ciclo, datación relativa y tasas de sedimentación. */
SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento.', 'Exercises generated at random on each attempt.'],
  problems: [
    { name: ['Tipo de roca', 'Rock type'], gen: function (H) {
      var B = [[['granito', 'granite'], ['ígnea', 'igneous']], [['basalto', 'basalt'], ['ígnea', 'igneous']], [['arenisca', 'sandstone'], ['sedimentaria', 'sedimentary']], [['caliza', 'limestone'], ['sedimentaria', 'sedimentary']], [['mármol', 'marble'], ['metamórfica', 'metamorphic']], [['pizarra', 'slate'], ['metamórfica', 'metamorphic']], [['carbón', 'coal'], ['sedimentaria', 'sedimentary']], [['gneis', 'gneiss'], ['metamórfica', 'metamorphic']]];
      return H.bank(B, function (it) { return H.t('El ' + it[0][0] + ' es una roca…', 'Is ' + it[0][1] + ' igneous, sedimentary or metamorphic?'); }, function (it) { return it[1]; }, null, [['ígnea', 'igneous'], ['sedimentaria', 'sedimentary'], ['metamórfica', 'metamorphic']]);
    } },
    { name: ['Proceso del ciclo', 'Rock-cycle process'], gen: function (H) {
      var B = [[['sedimentaria → metamórfica', 'sedimentary → metamorphic'], ['calor y presión', 'heat and pressure']], [['magma → ígnea', 'magma → igneous'], ['enfriamiento', 'cooling']], [['metamórfica → magma', 'metamorphic → magma'], ['fusión', 'melting']], [['ígnea → sedimentos', 'igneous → sediment'], ['meteorización y erosión', 'weathering and erosion']], [['sedimentos → sedimentaria', 'sediment → sedimentary'], ['compactación y cementación', 'compaction and cementation']]];
      return H.bank(B, function (it) { return H.t('¿Qué proceso transforma ' + it[0][0] + '?', 'Which process turns ' + it[0][1] + '?'); }, function (it) { return it[1]; }, null);
    } },
    { name: ['Tasa de sedimentación', 'Sedimentation rate'], gen: function (H) {
      var r = H.pick([0.5, 1, 2, 5, 10]), h = H.int(1, 50), t = h * 1000 / r / 1000;
      return { q: H.t('En un lago se depositan ' + H.fmt(r, 1) + ' mm de sedimento por año. ¿Cuántos miles de años tarda en formarse un estrato de ' + h + ' m?', 'In a lake ' + H.fmt(r, 1) + ' mm of sediment settles per year. How many thousand years does it take to form a ' + h + ' m stratum?'), a: t, unit: H.t('miles de años', 'thousand years'), sol: h + ' m = ' + h * 1000 + ' mm · ' + h * 1000 + '/' + H.fmt(r, 1) + ' = ' + H.fmt(t * 1000, 0) + H.t(' años', ' years') };
    } },
    { name: ['Ordenar eventos', 'Ordering events'], gen: function (H) {
      return H.mc(H.t('Una secuencia tiene, de abajo hacia arriba, los estratos A, B y C, y un dique D que corta A y B pero no C. ¿Cuál es el orden del más antiguo al más reciente?', 'A sequence has, from bottom to top, strata A, B and C, and a dyke D that cuts A and B but not C. What is the order from oldest to most recent?'), 'A, B, D, C', ['D, A, B, C', 'A, B, C, D', 'C, B, A, D'], H.t('Superposición (A antes que B antes que C) y corte: D es posterior a B pero anterior a C, que lo cubre.', 'Superposition (A before B before C) and cross-cutting: D is later than B but earlier than C, which covers it.'));
    } }
  ]
});
