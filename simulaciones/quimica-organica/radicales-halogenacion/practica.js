/* Práctica · Halogenación radicalaria y selectividad (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var S = [['propano', 'propane', 6, 2, 0], ['butano', 'butane', 6, 4, 0], ['2-metilpropano', '2-methylpropane', 9, 0, 1], ['2-metilbutano', '2-methylbutane', 9, 2, 1]];
  var R = { Cl: [1, 3.8, 5], Br: [1, 82, 1600] };
  SimAula.register({ problems: [
    { name: ['Porcentaje de producto', 'Percent of product'], gen: function (H) {
      var s = H.pick(S), x = H.pick(['Cl', 'Br']), r = R[x], w = [s[2] * r[0], s[3] * r[1], s[4] * r[2]], tot = w[0] + w[1] + w[2], k = s[3] ? 1 : 2, p = w[k] / tot * 100, lab = k === 1 ? H.t('secundario', 'secondary') : H.t('terciario', 'tertiary');
      return { q: H.t('En la ' + (x === 'Cl' ? 'cloración' : 'bromación') + ' del ' + s[0] + ' (reactividad relativa por H: 1° ' + r[0] + ', 2° ' + r[1] + ', 3° ' + r[2] + '), ¿qué porcentaje es el producto ' + lab + '?', 'In the ' + (x === 'Cl' ? 'chlorination' : 'bromination') + ' of ' + s[1] + ' (relative reactivity per H: 1° ' + r[0] + ', 2° ' + r[1] + ', 3° ' + r[2] + '), what percentage is the ' + lab + ' product?'), a: p, unit: '%', tol: 0.01,
        sol: 'H 1°: ' + s[2] + ' × ' + r[0] + ' = ' + w[0] + '; H 2°: ' + s[3] + ' × ' + r[1] + ' = ' + w[1] + '; H 3°: ' + s[4] + ' × ' + r[2] + ' = ' + w[2] + '; % = ' + w[k] + ' / ' + tot + ' × 100 = ' + H.sig(p, 3) + ' %' };
    } },
    { name: ['Etapas de la reacción en cadena', 'Chain reaction steps'], gen: function (H) {
      var c = H.pick([['Cl₂ → 2 Cl·', 0], ['Cl· + CH₄ → HCl + ·CH₃', 1], ['·CH₃ + Cl₂ → CH₃Cl + Cl·', 1], ['·CH₃ + Cl· → CH₃Cl', 2], ['2 ·CH₃ → C₂H₆', 2]]);
      return { q: H.t('¿A qué etapa corresponde ', 'Which step is ') + c[0] + '?', options: [H.t('Iniciación', 'Initiation'), H.t('Propagación', 'Propagation'), H.t('Terminación', 'Termination')], answer: c[1],
        sol: H.t('Iniciación: se forman radicales; propagación: un radical genera otro; terminación: dos radicales se combinan.', 'Initiation: radicals form; propagation: one radical generates another; termination: two radicals combine.') };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 4: { q: ["¿Qué halógeno es más selectivo por el H terciario?", "Which halogen is more selective for tertiary H?"], options: [["Bromo", "Bromine"], ["Cloro", "Chlorine"], ["Iguales", "Equal"]], answer: 0, why: ["La abstracción por Br• es endotérmica y su estado de transición es tardío, parecido al radical (Hammond).", "Abstraction by Br• is endothermic with a late, radical-like transition state (Hammond)."] } } });
