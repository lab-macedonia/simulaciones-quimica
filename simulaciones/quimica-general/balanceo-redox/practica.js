/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['La especie que se oxida actúa como…', 'The species that is oxidized acts as…'], options: [['agente oxidante', 'oxidizing agent'], ['agente reductor', 'reducing agent'], ['catalizador', 'catalyst']], answer: 1, why: ['Al oxidarse cede electrones y así reduce a la otra especie: es el agente reductor.', 'By being oxidized it gives away electrons and thus reduces the other species: it is the reducing agent.'] },
  3: { q: ['En la semirreacción de oxidación, los electrones se escriben…', 'In the oxidation half-reaction, the electrons are written…'], options: [['a la izquierda (reactivos)', 'on the left (reactants)'], ['a la derecha (productos)', 'on the right (products)'], ['a ambos lados', 'on both sides']], answer: 1, why: ['La especie que se oxida pierde electrones: aparecen como producto. En la reducción quedan a la izquierda.', 'The oxidized species loses electrons, so they appear as a product. In the reduction they go on the left.'] }
} });

/* Práctica · Balanceo redox (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var NOX = [['Mn', 'KMnO₄', 7], ['Cr', 'K₂Cr₂O₇', 6], ['S', 'H₂SO₄', 6], ['S', 'SO₂', 4], ['N', 'HNO₃', 5], ['N', 'NH₃', -3], ['N', 'NO₂', 4], ['Cl', 'ClO₄⁻', 7], ['Cl', 'ClO⁻', 1], ['C', 'CO₂', 4], ['C', 'CH₄', -4], ['Fe', 'Fe₂O₃', 3], ['O', 'H₂O₂', -1], ['P', 'H₃PO₄', 5]];
  var HALF = [['MnO₄⁻ → Mn²⁺', 5], ['Cr₂O₇²⁻ → 2 Cr³⁺', 6], ['Fe²⁺ → Fe³⁺', 1], ['NO₃⁻ → NO', 3], ['H₂O₂ → O₂', 2], ['C₂O₄²⁻ → 2 CO₂', 2], ['I⁻ → ½ I₂', 1], ['MnO₄⁻ → MnO₂', 3]];
  SimAula.register({ problems: [
    { name: ['Número de oxidación', 'Oxidation number'], gen: function (H) {
      var x = H.pick(NOX);
      return { q: H.t('¿Cuál es el número de oxidación del ' + x[0] + ' en ' + x[1] + '?', 'What is the oxidation number of ' + x[0] + ' in ' + x[1] + '?'), a: x[2], abs: 0, aText: (x[2] > 0 ? '+' : '') + x[2],
        sol: H.t('Usa O = −2 (salvo peróxidos), H = +1, metales alcalinos = +1 y la suma igual a la carga.', 'Use O = −2 (except peroxides), H = +1, alkali metals = +1 and the sum equal to the charge.') };
    } },
    { name: ['Electrones en una semirreacción', 'Electrons in a half-reaction'], gen: function (H) {
      var x = H.pick(HALF);
      return { q: H.t('¿Cuántos electrones intercambia la semirreacción ' + x[0] + '?', 'How many electrons does the half-reaction ' + x[0] + ' exchange?'), a: x[1], abs: 0, aText: String(x[1]),
        sol: H.t('Diferencia de números de oxidación multiplicada por el número de átomos que cambian.', 'Change in oxidation number times the number of atoms that change.') };
    } },
    { name: ['¿Oxidación o reducción?', 'Oxidation or reduction?'], gen: function (H) {
      var x = H.pick([['Zn → Zn²⁺', 0], ['Cu²⁺ → Cu', 1], ['Cl₂ → 2 Cl⁻', 1], ['Fe²⁺ → Fe³⁺', 0], ['MnO₄⁻ → Mn²⁺', 1], ['SO₃²⁻ → SO₄²⁻', 0]]);
      return { q: H.t('La semirreacción ' + x[0] + ' es una…', 'The half-reaction ' + x[0] + ' is…'), options: [H.t('Oxidación', 'An oxidation'), H.t('Reducción', 'A reduction')], answer: x[1],
        sol: H.t('Oxidación: el número de oxidación aumenta (pierde e⁻). Reducción: disminuye (gana e⁻).', 'Oxidation: the oxidation number rises (loses e⁻). Reduction: it falls (gains e⁻).') };
    } }
  ] });
})();
