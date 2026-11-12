/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Si una célula vegetal se pone en agua pura, su vacuola…', 'If a plant cell is placed in pure water, its vacuole…'], options: [['se llena y aumenta la turgencia', 'fills up and turgor increases'], ['se vacía y la célula se arruga', 'empties and the cell shrinks'], ['no cambia', 'does not change']], answer: 0, why: ['Entra agua por ósmosis, la vacuola empuja el citoplasma contra la pared y sube la presión de turgencia; la pared evita que la célula estalle.', 'Water enters by osmosis, the vacuole pushes the cytoplasm against the wall and turgor pressure rises; the wall keeps the cell from bursting.'] },
  3: { q: ['En una célula vegetal madura, el núcleo suele estar…', 'In a mature plant cell, the nucleus is usually…'], options: [['en el centro de la célula', 'in the centre of the cell'], ['desplazado hacia la pared', 'pushed towards the wall'], ['dentro de la vacuola', 'inside the vacuole']], answer: 1, why: ['La gran vacuola central ocupa casi todo el volumen y empuja el núcleo y el citoplasma hacia la periferia.', 'The large central vacuole fills most of the volume and pushes the nucleus and cytoplasm to the periphery.'] }
} });

/* Práctica · Célula vegetal: estructuras propias y comparación con la célula animal. */
(function () {
  var O = [[['Pared celular', 'Cell wall'], ['Da soporte y resiste la presión de turgencia (celulosa)', 'Provides support and withstands turgor pressure (cellulose)']], [['Vacuola central', 'Central vacuole'], ['Almacena agua e iones y mantiene la turgencia', 'Stores water and ions and maintains turgor']],
    [['Cloroplasto', 'Chloroplast'], ['Realiza la fotosíntesis', 'Carries out photosynthesis']], [['Plasmodesmos', 'Plasmodesmata'], ['Comunican el citoplasma de células vecinas a través de la pared', 'Connect the cytoplasm of neighboring cells through the wall']],
    [['Tonoplasto', 'Tonoplast'], ['Membrana que rodea la vacuola central', 'Membrane surrounding the central vacuole']], [['Amiloplasto', 'Amyloplast'], ['Almacena almidón', 'Stores starch']], [['Mitocondria', 'Mitochondrion'], ['Produce ATP por respiración celular', 'Produces ATP by cellular respiration']]];
  /* estructura, animal, vegetal */
  var CMP = [[['Pared celular de celulosa', 'Cellulose cell wall'], 0, 1], [['Cloroplastos', 'Chloroplasts'], 0, 1], [['Vacuola central grande', 'Large central vacuole'], 0, 1], [['Centriolos', 'Centrioles'], 1, 0], [['Mitocondrias', 'Mitochondria'], 1, 1], [['Lisosomas típicos', 'Typical lysosomes'], 1, 0], [['Núcleo', 'Nucleus'], 1, 1], [['Aparato de Golgi', 'Golgi apparatus'], 1, 1], [['Plasmodesmos', 'Plasmodesmata'], 0, 1]];
  var A = { '10': ['Solo en la célula animal', 'Only in the animal cell'], '01': ['Solo en la célula vegetal', 'Only in the plant cell'], '11': ['En ambas', 'In both'] };
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Función de la estructura', 'Function of the structure'], gen: function (H) {
        return H.bank(O, function (o) { return H.t('¿Cuál es la función de: <b>' + o[0][0] + '</b>?', 'What is the function of: <b>' + o[0][1] + '</b>?'); }, function (o) { return o[1]; }, function (o) { return H.L(o[0]) + ': ' + H.L(o[1]).replace(/^./, function (c) { return c.toLowerCase(); }) + '.'; });
      } },
      { name: ['¿Animal, vegetal o ambas?', 'Animal, plant or both?'], gen: function (H) {
        var c = H.pick(CMP), k = '' + c[1] + c[2];
        return H.mc(H.t('¿Dónde se encuentra: <b>' + c[0][0] + '</b>?', 'Where is this found: <b>' + c[0][1] + '</b>?'), A[k], [A['10'], A['01'], A['11']],
          k === '11' ? H.t('Es común a todas las células eucariontes.', 'It is common to all eukaryotic cells.') : k === '01' ? H.t('Es propia de las células vegetales (y de las algas).', 'It is characteristic of plant (and algal) cells.') : H.t('Las plantas organizan el huso sin centriolos y usan la vacuola para degradar.', 'Plants organize the spindle without centrioles and use the vacuole for breakdown.'));
      } },
      { name: ['Osmosis y turgencia', 'Osmosis and turgor'], gen: function (H) {
        var Q = [[['Una célula vegetal se coloca en agua destilada (medio hipotónico). ¿Qué ocurre?', 'A plant cell is placed in distilled water (hypotonic medium). What happens?'], ['Entra agua y la célula queda turgente; la pared impide que estalle', 'Water enters and the cell becomes turgid; the wall stops it from bursting'], [['La célula estalla (lisis)', 'The cell bursts (lysis)'], ['La membrana se separa de la pared (plasmólisis)', 'The membrane pulls away from the wall (plasmolysis)']]],
          [['Una célula vegetal se coloca en una solución salina concentrada (hipertónica). ¿Qué ocurre?', 'A plant cell is placed in a concentrated salt solution (hypertonic). What happens?'], ['Sale agua y la membrana se separa de la pared (plasmólisis)', 'Water leaves and the membrane pulls away from the wall (plasmolysis)'], [['Entra agua y queda turgente', 'Water enters and it becomes turgid'], ['La célula estalla (lisis)', 'The cell bursts (lysis)']]]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.t('El agua se mueve hacia donde hay más solutos. La pared resiste la presión; una célula animal sin pared sí podría estallar en agua.', 'Water moves toward the side with more solutes. The wall withstands the pressure; an animal cell without a wall could burst in water.'));
      } }
    ]
  });
})();
