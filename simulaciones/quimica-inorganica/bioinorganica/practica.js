/* Práctica · Química bioinorgánica (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Saturación de la hemoglobina (Hill)', 'Hemoglobin saturation (Hill)'], gen: function (H) {
    var P50 = H.pick([26, 26, 30, 22]), n = 2.8, pO2 = H.int(10, 100), Y = Math.pow(pO2, n) / (Math.pow(pO2, n) + Math.pow(P50, n)) * 100;
    return { q: H.t('Con P₅₀ = ' + P50 + ' mmHg y n = 2,8, ¿qué saturación tiene la hemoglobina a pO₂ = ' + pO2 + ' mmHg?', 'With P₅₀ = ' + P50 + ' mmHg and n = 2.8, what is hemoglobin saturation at pO₂ = ' + pO2 + ' mmHg?'), a: Y, unit: '%', abs: Math.max(0.3, Y * 0.015),
      sol: 'Y = pO₂ⁿ/(pO₂ⁿ + P₅₀ⁿ) = ' + H.sig(Y, 3) + ' %' };
  } },
  { name: ['Mioglobina frente a hemoglobina', 'Myoglobin versus hemoglobin'], gen: function (H) {
    var pO2 = H.int(5, 100), Y = pO2 / (pO2 + 2.8) * 100;
    return { q: H.t('La mioglobina (sin cooperatividad, P₅₀ = 2,8 mmHg), ¿qué saturación tiene a ' + pO2 + ' mmHg?', 'What is the saturation of myoglobin (no cooperativity, P₅₀ = 2.8 mmHg) at ' + pO2 + ' mmHg?'), a: Y, unit: '%', abs: Math.max(0.2, (100 - Y) * 0.05),
      sol: 'Y = pO₂/(pO₂ + P₅₀) = ' + pO2 + '/(' + pO2 + ' + ' + H.fmt(2.8, 1) + ') = ' + H.sig(Y, 4) + ' %' };
  } },
  { name: ['Metal y función', 'Metal and function'], gen: function (H) {
    var c = H.pick([[H.t('anhidrasa carbónica', 'carbonic anhydrase'), 'Zn²⁺'], [H.t('clorofila', 'chlorophyll'), 'Mg²⁺'], [H.t('hemoglobina', 'hemoglobin'), 'Fe²⁺'], [H.t('azurina (transferencia de electrones)', 'azurin (electron transfer)'), 'Cu']]);
    var ops = ['Zn²⁺', 'Mg²⁺', 'Fe²⁺', 'Cu'];
    return { q: H.t('¿Qué metal está en el sitio activo de la ', 'Which metal is in the active site of ') + c[0] + '?', options: ops, answer: ops.indexOf(c[1]), sol: H.t('Revísalo en la pestaña de metaloproteínas.', 'Check it in the metalloproteins tab.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["Si baja el pH de la sangre, la afinidad de la hemoglobina por el O₂…", "If blood pH drops, hemoglobin\u0027s affinity for O₂…"], options: [["disminuye y libera más O₂", "decreases and releases more O₂"], ["aumenta", "increases"], ["no cambia", "does not change"]], answer: 0, why: ["Efecto Bohr: el H⁺ estabiliza la forma T (baja afinidad), útil en los tejidos activos.", "Bohr effect: H⁺ stabilizes the T state (low affinity), useful in active tissues."] } } });
