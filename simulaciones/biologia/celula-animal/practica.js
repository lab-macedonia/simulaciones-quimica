/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Las proteínas que la célula va a secretar se fabrican en…', 'Proteins the cell will secrete are made on…'], options: [['ribosomas libres en el citosol', 'free ribosomes in the cytosol'], ['ribosomas del retículo rugoso', 'ribosomes of the rough ER'], ['el retículo liso', 'the smooth ER']], answer: 1, why: ['Los ribosomas pegados al retículo rugoso introducen la proteína en la vía secretora; los libres hacen las proteínas del citosol.', 'Ribosomes bound to the rough ER feed the protein into the secretory pathway; free ribosomes make cytosolic proteins.'] },
  4: { q: ['¿Qué indicio apoya que las mitocondrias descienden de bacterias?', 'Which clue supports that mitochondria descend from bacteria?'], options: [['Producen ATP', 'They make ATP'], ['Están en el citosol', 'They are in the cytosol'], ['Tienen doble membrana, ADN y ribosomas propios', 'They have a double membrane, their own DNA and ribosomes']], answer: 2, why: ['Doble membrana, ADN circular y ribosomas propios son huellas de la endosimbiosis.', 'A double membrane, circular DNA and their own ribosomes are traces of endosymbiosis.'] }
} });

/* Práctica · Célula animal: orgánulos y funciones. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var O = [[['Núcleo', 'Nucleus'], ['Guarda el ADN y dirige la transcripción', 'Stores DNA and directs transcription']], [['Nucléolo', 'Nucleolus'], ['Sintetiza el ARN ribosomal y ensambla los ribosomas', 'Makes ribosomal RNA and assembles ribosomes']],
    [['Retículo endoplasmático rugoso', 'Rough endoplasmic reticulum'], ['Sintetiza proteínas de membrana y de secreción (tiene ribosomas)', 'Synthesizes membrane and secreted proteins (has ribosomes)']], [['Retículo endoplasmático liso', 'Smooth endoplasmic reticulum'], ['Sintetiza lípidos, detoxifica y almacena Ca²⁺', 'Synthesizes lipids, detoxifies and stores Ca²⁺']],
    [['Aparato de Golgi', 'Golgi apparatus'], ['Modifica, clasifica y empaqueta proteínas en vesículas', 'Modifies, sorts and packages proteins into vesicles']], [['Mitocondria', 'Mitochondrion'], ['Produce la mayor parte del ATP por respiración celular', 'Produces most of the ATP by cellular respiration']],
    [['Lisosoma', 'Lysosome'], ['Digiere macromoléculas con enzimas hidrolíticas a pH ácido', 'Digests macromolecules with hydrolytic enzymes at acidic pH']], [['Peroxisoma', 'Peroxisome'], ['Oxida ácidos grasos y descompone H₂O₂ (catalasa)', 'Oxidizes fatty acids and breaks down H₂O₂ (catalase)']],
    [['Centrosoma', 'Centrosome'], ['Organiza los microtúbulos y el huso mitótico', 'Organizes microtubules and the mitotic spindle']], [['Ribosoma', 'Ribosome'], ['Traduce el ARNm en proteínas', 'Translates mRNA into proteins']],
    [['Membrana plasmática', 'Plasma membrane'], ['Controla el paso de sustancias (permeabilidad selectiva)', 'Controls what passes through (selective permeability)']], [['Citoesqueleto', 'Cytoskeleton'], ['Da forma a la célula y permite el transporte interno y el movimiento', 'Shapes the cell and enables internal transport and movement']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Función del orgánulo', 'Organelle function'], gen: function (H) {
        return H.bank(O, function (o) { return H.t('¿Cuál es la función principal de: <b>' + o[0][0] + '</b>?', 'What is the main function of the <b>' + o[0][1].replace(/^./, function (c) { return c.toLowerCase(); }) + '</b>?'); }, function (o) { return o[1]; }, function (o) { return H.L(o[0]) + ': ' + H.L(o[1]).replace(/^./, function (c) { return c.toLowerCase(); }) + '.'; });
      } },
      { name: ['¿Qué orgánulo es?', 'Which organelle is it?'], gen: function (H) {
        return H.bank(O, function (o) { return H.t('¿Qué estructura <b>' + H.L(o[1]).replace(/^./, function (c) { return c.toLowerCase(); }) + '</b>?', 'Which structure <b>' + H.L(o[1]).replace(/^./, function (c) { return c.toLowerCase(); }) + '</b>?').replace(/<b>(\w)/, function (m, c) { return '<b>' + c; }); }, function (o) { return o[0]; }, function (o) { return H.L(o[0]) + '.'; });
      } },
      { name: ['Ruta de una proteína de secreción', 'Path of a secreted protein'], gen: function (H) {
        var right = ['Ribosoma del RER → RER → Golgi → vesícula → membrana plasmática', 'RER ribosome → RER → Golgi → vesicle → plasma membrane'];
        return H.mc(H.t('¿Qué recorrido sigue una proteína que la célula secreta (por ejemplo, la insulina)?', 'Which path does a protein the cell secretes (for example, insulin) follow?'), right,
          [['Golgi → RER → ribosoma → membrana plasmática', 'Golgi → RER → ribosome → plasma membrane'], ['Ribosoma libre → mitocondria → lisosoma → membrana plasmática', 'Free ribosome → mitochondrion → lysosome → plasma membrane'], ['Núcleo → REL → peroxisoma → membrana plasmática', 'Nucleus → SER → peroxisome → plasma membrane']],
          H.t('Se sintetiza en ribosomas unidos al RER, entra al lumen, viaja al Golgi para su maduración y sale por exocitosis.', 'It is made on RER-bound ribosomes, enters the lumen, travels to the Golgi for processing and leaves by exocytosis.'));
      } }
    ]
  });
})();
