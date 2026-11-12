/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Si al geranil-PP (C₁₀) se le une un IPP (C₅), se obtiene…', 'Adding one IPP (C₅) to geranyl-PP (C₁₀) gives…'], options: [['farnesil-PP (C₁₅)', 'farnesyl-PP (C₁₅)'], ['geranilgeranil-PP (C₂₀)', 'geranylgeranyl-PP (C₂₀)'], ['escualeno (C₃₀)', 'squalene (C₃₀)']], answer: 0, why: ['Cada IPP añade 5 C: C₁₀ + C₅ = C₁₅, el farnesil-PP (precursor de los sesquiterpenos).', 'Each IPP adds 5 C: C₁₀ + C₅ = C₁₅, farnesyl-PP (the sesquiterpene precursor).'] },
  3: { q: ['¿Cuántos anillos fusionados tiene el esqueleto esteroidal?', 'How many fused rings does the steroid skeleton have?'], options: [['Tres de seis miembros', 'Three six-membered rings'], ['Cuatro: tres de seis y uno de cinco', 'Four: three six-membered and one five-membered'], ['Seis', 'Six']], answer: 1, why: ['Anillos A, B y C (ciclohexano) y D (ciclopentano): el núcleo de ciclopentanoperhidrofenantreno, numerado C1–C17.', 'Rings A, B and C (cyclohexane) and D (cyclopentane): the cyclopentanoperhydrophenanthrene nucleus, numbered C1–C17.'] }
} });

/* Práctica · Terpenos y esteroides. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var CL = [[10, ['Monoterpeno', 'Monoterpene']], [15, ['Sesquiterpeno', 'Sesquiterpene']], [20, ['Diterpeno', 'Diterpene']], [30, ['Triterpeno', 'Triterpene']], [40, ['Tetraterpeno', 'Tetraterpene']]];
  var EX = [['limoneno', 'limonene', 10], ['mentol', 'menthol', 10], ['geraniol', 'geraniol', 10], ['farnesol', 'farnesol', 15], ['retinol (vitamina A)', 'retinol (vitamin A)', 20], ['fitol', 'phytol', 20], ['escualeno', 'squalene', 30], ['β-caroteno', 'β-carotene', 40], ['lanosterol', 'lanosterol', 30]];
  function cls(n) { return CL.filter(function (c) { return c[0] === n; })[0][1]; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Unidades de isopreno', 'Isoprene units'], gen: function (H) {
        var e = H.pick(EX), u = e[2] / 5;
        return { q: H.t('¿Cuántas unidades de isopreno (C₅) forman el esqueleto de <b>' + e[0] + '</b> (C<sub>' + e[2] + '</sub>)?', 'How many isoprene (C₅) units make up the skeleton of <b>' + e[1] + '</b> (C<sub>' + e[2] + '</sub>)?'), a: u, abs: 0, aText: String(u),
          sol: e[2] + ' / 5 = ' + u + ' → ' + H.L(cls(e[2])).toLowerCase() + '.' };
      } },
      { name: ['Clase de terpeno', 'Terpene class'], gen: function (H) {
        var e = H.pick(EX);
        return H.mc(H.t('¿A qué clase pertenece <b>' + e[0] + '</b> (C<sub>' + e[2] + '</sub>)?', 'Which class does <b>' + e[1] + '</b> (C<sub>' + e[2] + '</sub>) belong to?'), cls(e[2]), CL.map(function (c) { return c[1]; }),
          H.t('Monoterpeno C₁₀ (2 isoprenos), sesquiterpeno C₁₅ (3), diterpeno C₂₀ (4), triterpeno C₃₀ (6), tetraterpeno C₄₀ (8).', 'Monoterpene C₁₀ (2 isoprenes), sesquiterpene C₁₅ (3), diterpene C₂₀ (4), triterpene C₃₀ (6), tetraterpene C₄₀ (8).') + (e[2] === 30 && e[0] === 'lanosterol' ? H.t(' El lanosterol proviene de la ciclación del escualeno.', ' Lanosterol comes from the cyclization of squalene.') : ''));
      } },
      { name: ['Esqueleto esteroidal', 'Steroid skeleton'], gen: function (H) {
        var Q = [[['¿Cuántos anillos tiene el núcleo esteroidal (ciclopentanoperhidrofenantreno)?', 'How many rings does the steroid nucleus (cyclopentanoperhydrophenanthrene) have?'], ['4: tres de seis miembros (A, B, C) y uno de cinco (D)', '4: three six-membered (A, B, C) and one five-membered (D)'], [['3 de seis miembros', '3 six-membered'], ['4 de seis miembros', '4 six-membered'], ['5: cuatro de seis y uno de cinco', '5: four six-membered and one five-membered']], ['Los anillos A, B y C son ciclohexanos; el D es un ciclopentano.', 'Rings A, B and C are cyclohexanes; D is a cyclopentane.']],
          [['¿En qué carbono lleva el colesterol su grupo OH?', 'On which carbon does cholesterol carry its OH group?'], ['C3 (anillo A)', 'C3 (ring A)'], [['C17 (anillo D)', 'C17 (ring D)'], ['C11 (anillo C)', 'C11 (ring C)'], ['C5 (anillo B)', 'C5 (ring B)']], ['El 3β-OH es el único grupo polar del colesterol: lo orienta hacia la superficie de la membrana.', 'The 3β-OH is cholesterol’s only polar group: it points it toward the membrane surface.']],
          [['¿Qué precursor C₃₀ se cicla para formar el esqueleto esteroidal?', 'Which C₃₀ precursor cyclizes to form the steroid skeleton?'], ['Escualeno (vía 2,3-epoxiescualeno)', 'Squalene (via 2,3-epoxysqualene)'], [['β-caroteno', 'β-carotene'], ['Farnesol', 'Farnesol'], ['Limoneno', 'Limonene']], ['El escualeno (6 isoprenos) se epoxida y se cicla en cascada a lanosterol, precursor del colesterol.', 'Squalene (6 isoprenes) is epoxidized and cyclizes in a cascade to lanosterol, the precursor of cholesterol.']],
          [['¿Cuántos carbonos tiene el colesterol?', 'How many carbons does cholesterol have?'], ['27', '27'], [['30', '30'], ['20', '20'], ['17', '17']], ['El lanosterol (C₃₀) pierde tres metilos en la ruta hacia el colesterol (C₂₇).', 'Lanosterol (C₃₀) loses three methyl groups on the way to cholesterol (C₂₇).']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
