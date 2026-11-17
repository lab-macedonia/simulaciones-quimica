/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Cuando lleguen los electrones del Zn al ion Cu²⁺, su número de oxidación…', 'When the electrons from Zn reach the Cu²⁺ ion, its oxidation number…'], options: [['disminuye', 'decreases'], ['aumenta', 'increases'], ['no cambia', 'does not change']], answer: 0, why: ['Al ganar electrones el Cu²⁺ se reduce: su número de oxidación baja de +2 a 0.', 'By gaining electrons Cu²⁺ is reduced: its oxidation number falls from +2 to 0.'] },
  3: { q: ['En Zn + Cu²⁺ → Zn²⁺ + Cu, ¿qué especie actúa como agente reductor?', 'In Zn + Cu²⁺ → Zn²⁺ + Cu, which species acts as the reducing agent?'], options: [['Zn', 'Zn'], ['Cu²⁺', 'Cu²⁺']], answer: 0, why: ['El Zn se oxida: cede electrones y, con ello, reduce al Cu²⁺. Por eso es el agente reductor.', 'Zn is oxidized: it gives away electrons and thereby reduces Cu²⁺. That is why it is the reducing agent.'] }
} });

/* Práctica · Oxidación y reducción (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var LOSS = [['Na', 1], ['Mg', 2], ['Al', 3], ['Zn', 2], ['K', 1], ['Ca', 2]];
  var GAIN = [['Cl', 1], ['O', 2], ['Br', 1], ['S', 2], ['F', 1]];
  var RX = [['Zn + Cu²⁺ → Zn²⁺ + Cu', 2], ['Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag', 2], ['2 Na + Cl₂ → 2 NaCl', 2], ['2 Mg + O₂ → 2 MgO', 4], ['2 Al + 3 Cu²⁺ → 2 Al³⁺ + 3 Cu', 6], ['Mg + 2 H⁺ → Mg²⁺ + H₂', 2], ['3 Zn + 2 Au³⁺ → 3 Zn²⁺ + 2 Au', 6]];
  var AG = [['Zn + Cu²⁺ → Zn²⁺ + Cu', 'Zn', 'Cu²⁺'], ['Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag', 'Cu', 'Ag⁺'], ['2 Na + Cl₂ → 2 NaCl', 'Na', 'Cl₂'], ['Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂', 'Br⁻', 'Cl₂'], ['Mg + 2 H⁺ → Mg²⁺ + H₂', 'Mg', 'H⁺'], ['Fe + Cu²⁺ → Fe²⁺ + Cu', 'Fe', 'Cu²⁺']];
  var sg = function (z) { return z > 0 ? '+' + z : '−' + Math.abs(z); };
  SimAula.register({ problems: [
    { name: ['Número de oxidación tras perder o ganar e⁻', 'Oxidation number after losing or gaining e⁻'], gen: function (H) {
      var lose = H.pick([true, false]), x = lose ? H.pick(LOSS) : H.pick(GAIN), z = lose ? x[1] : -x[1];
      return { q: lose ? H.t('Un átomo neutro de ' + x[0] + ' pierde ' + x[1] + ' electrón(es). ¿Cuál es su número de oxidación final?', 'A neutral ' + x[0] + ' atom loses ' + x[1] + ' electron(s). What is its final oxidation number?') : H.t('Un átomo neutro de ' + x[0] + ' gana ' + x[1] + ' electrón(es). ¿Cuál es su número de oxidación final?', 'A neutral ' + x[0] + ' atom gains ' + x[1] + ' electron(s). What is its final oxidation number?'), a: z, abs: 0, aText: sg(z),
        sol: H.t('Perder e⁻ aumenta el número de oxidación (queda positivo); ganar e⁻ lo disminuye (queda negativo). Parte de 0 y suma o resta los electrones.', 'Losing e⁻ raises the oxidation number (it becomes positive); gaining e⁻ lowers it (it becomes negative). Start from 0 and add or subtract the electrons.') };
    } },
    { name: ['Electrones transferidos en total', 'Total electrons transferred'], gen: function (H) {
      var x = H.pick(RX);
      return { q: H.t('En ' + x[0] + ', ¿cuántos electrones se transfieren en total?', 'In ' + x[0] + ', how many electrons are transferred in total?'), a: x[1], abs: 0, aText: String(x[1]),
        sol: H.t('Multiplica los átomos que se oxidan por los electrones que cede cada uno. Debe coincidir con los átomos que se reducen por los electrones que gana cada uno.', 'Multiply the atoms that are oxidized by the electrons each one gives up. It must match the atoms that are reduced times the electrons each one gains.') };
    } },
    { name: ['Agente oxidante o reductor', 'Oxidizing or reducing agent'], gen: function (H) {
      var x = H.pick(AG), asked = H.pick([0, 1]), flip = H.pick([0, 1]), opts = flip ? [x[2], x[1]] : [x[1], x[2]], right = asked === 0 ? x[1] : x[2];
      return { q: asked === 0 ? H.t('En ' + x[0] + ', el agente reductor es…', 'In ' + x[0] + ', the reducing agent is…') : H.t('En ' + x[0] + ', el agente oxidante es…', 'In ' + x[0] + ', the oxidizing agent is…'), options: opts, answer: opts.indexOf(right),
        sol: H.t('El agente reductor es la especie que se oxida (cede e⁻); el agente oxidante es la que se reduce (gana e⁻).', 'The reducing agent is the species that is oxidized (gives up e⁻); the oxidizing agent is the one that is reduced (gains e⁻).') };
    } }
  ] });
})();
