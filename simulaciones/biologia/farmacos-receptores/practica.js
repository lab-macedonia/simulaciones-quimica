/* Práctica · Fármacos y receptores (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Ocupación del receptor', 'Receptor occupancy'], gen: function (H) {
    var Kd = H.rnd(0.5, 50, 1), L = H.rnd(0.1, 200, 1), f = L / (L + Kd) * 100;
    return { q: H.t('Un fármaco tiene K<sub>d</sub> = ' + H.fmt(Kd, 1) + ' nM. ¿Qué porcentaje de receptores ocupa a ' + H.fmt(L, 1) + ' nM?', 'A drug has K<sub>d</sub> = ' + H.fmt(Kd, 1) + ' nM. What percentage of receptors does it occupy at ' + H.fmt(L, 1) + ' nM?'), a: f, unit: '%', tol: 0.01,
      sol: 'θ = [L]/([L] + K<sub>d</sub>) = ' + H.fmt(L, 1) + ' / ' + H.fmt(L + Kd, 1) + ' = ' + H.sig(f, 3) + ' %' };
  } },
  { name: ['Antagonista competitivo: desplazamiento de la EC₅₀', 'Competitive antagonist: EC₅₀ shift'], gen: function (H) {
    var E = H.rnd(1, 50, 1), B = H.rnd(1, 100, 1), KB = H.rnd(0.5, 20, 1), E2 = E * (1 + B / KB);
    return { q: H.t('Un agonista tiene EC₅₀ = ' + H.fmt(E, 1) + ' nM. Con ' + H.fmt(B, 1) + ' nM de un antagonista competitivo (K<sub>B</sub> = ' + H.fmt(KB, 1) + ' nM), ¿cuál es la nueva EC₅₀?', 'An agonist has EC₅₀ = ' + H.fmt(E, 1) + ' nM. With ' + H.fmt(B, 1) + ' nM of a competitive antagonist (K<sub>B</sub> = ' + H.fmt(KB, 1) + ' nM), what is the new EC₅₀?'), a: E2, unit: 'nM',
      sol: 'EC₅₀′ = EC₅₀ (1 + [B]/K<sub>B</sub>) = ' + H.fmt(E, 1) + ' × ' + H.sig(1 + B / KB, 3) + ' = ' + H.sig(E2, 3) + ' nM' };
  } },
  { name: ['Reglas de Lipinski', 'Lipinski\'s rules'], gen: function (H) {
    var M = H.int(200, 700), logP = H.rnd(-1, 7, 1), don = H.int(0, 7), acc = H.int(2, 13), v = (M > 500) + (logP > 5) + (don > 5) + (acc > 10);
    return { q: H.t('Una molécula tiene M = ' + M + ' g/mol, logP = ' + H.fmt(logP, 1) + ', ' + don + ' donadores y ' + acc + ' aceptores de puente de H. ¿Cuántas reglas de Lipinski incumple?', 'A molecule has M = ' + M + ' g/mol, logP = ' + H.fmt(logP, 1) + ', ' + don + ' H-bond donors and ' + acc + ' acceptors. How many Lipinski rules does it break?'), a: v, abs: 0, aText: String(v),
      sol: H.t('Límites: M ≤ 500, logP ≤ 5, donadores ≤ 5, aceptores ≤ 10. Más de una infracción sugiere mala absorción oral.', 'Limits: M ≤ 500, logP ≤ 5, donors ≤ 5, acceptors ≤ 10. More than one violation suggests poor oral absorption.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 3: { q: ["Con un antagonista competitivo, la curva dosis–respuesta del agonista…", "With a competitive antagonist, the agonist dose–response curve…"], options: [["se desplaza a la derecha con el mismo Emáx", "shifts right with the same Emax"], ["baja su Emáx sin desplazarse", "loses Emax without shifting"], ["no cambia", "does not change"]], answer: 0, why: ["Con más agonista se desplaza al antagonista: se recupera el Emáx, pero la EC₅₀ aumenta.", "More agonist outcompetes the antagonist: Emax is recovered but EC₅₀ increases."] } } });
