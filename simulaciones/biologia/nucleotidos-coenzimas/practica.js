/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['La hidrólisis ATP + H₂O → ADP + Pᵢ es…', 'The hydrolysis ATP + H₂O → ADP + Pᵢ is…'], options: [['endergónica: necesita energía', 'endergonic: it needs energy'], ['exergónica: libera energía', 'exergonic: it releases energy'], ['neutra: ΔG ≈ 0', 'neutral: ΔG ≈ 0']], answer: 1, why: ['ΔG°′ ≈ −30,5 kJ/mol (≈ −50 en la célula): repulsión entre fosfatos, mejor solvatación y resonancia del Pᵢ.', 'ΔG°′ ≈ −30.5 kJ/mol (≈ −50 in the cell): phosphate repulsion, better solvation and resonance of Pᵢ.'] },
  3: { q: ['La coenzima A transporta grupos acilo unidos mediante…', 'Coenzyme A carries acyl groups attached through…'], options: [['un enlace peptídico', 'a peptide bond'], ['un puente de hidrógeno', 'a hydrogen bond'], ['un tioéster (–S–CO–R)', 'a thioester (–S–CO–R)']], answer: 2, why: ['El tiol terminal de la CoA forma tioésteres como el acetil-CoA, cuya hidrólisis libera tanta energía como la del ATP: el acilo queda «activado».', 'The terminal thiol of CoA forms thioesters such as acetyl-CoA, whose hydrolysis releases as much energy as ATP: the acyl group is «activated».'] }
} });

/* Práctica · Nucleótidos y coenzimas: vitaminas precursoras, función y energía de hidrólisis del ATP. */
(function () {
  var V = [['NAD⁺', ['Niacina (B3)', 'Niacin (B3)'], ['Acepta un hidruro (2 e⁻ + H⁺) en oxidaciones', 'Accepts a hydride (2 e⁻ + H⁺) in oxidations']], ['FAD', ['Riboflavina (B2)', 'Riboflavin (B2)'], ['Acepta 2 e⁻ y 2 H⁺ (por ejemplo, en la succinato deshidrogenasa)', 'Accepts 2 e⁻ and 2 H⁺ (for example, in succinate dehydrogenase)']],
    ['Coenzima A', ['Ácido pantoténico (B5)', 'Pantothenic acid (B5)'], ['Transporta grupos acilo mediante un tioéster', 'Carries acyl groups as a thioester']], ['Pirofosfato de tiamina (TPP)', ['Tiamina (B1)', 'Thiamine (B1)'], ['Descarboxilación de α-cetoácidos', 'Decarboxylation of α-keto acids']],
    ['Fosfato de piridoxal (PLP)', ['Piridoxina (B6)', 'Pyridoxine (B6)'], ['Transaminación de aminoácidos', 'Amino acid transamination']], ['Tetrahidrofolato', ['Ácido fólico (B9)', 'Folic acid (B9)'], ['Transfiere unidades de un carbono', 'Transfers one-carbon units']]];
  function nm(s, H) { return H.EN ? s.replace('Coenzima A', 'Coenzyme A').replace('Pirofosfato de tiamina', 'Thiamine pyrophosphate').replace('Fosfato de piridoxal', 'Pyridoxal phosphate').replace('Tetrahidrofolato', 'Tetrahydrofolate') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Vitamina precursora', 'Precursor vitamin'], gen: function (H) {
        return H.bank(V, function (v) { return H.t('¿De qué vitamina deriva la coenzima <b>' + v[0] + '</b>?', 'Which vitamin is the coenzyme <b>' + nm(v[0], H) + '</b> derived from?'); }, function (v) { return v[1]; }, function (v) { return nm(v[0], H) + ' ← ' + H.L(v[1]) + '. ' + H.L(v[2]) + '.'; });
      } },
      { name: ['Función de la coenzima', 'Coenzyme function'], gen: function (H) {
        return H.bank(V, function (v) { return H.t('¿Qué función cumple <b>' + v[0] + '</b>?', 'What does <b>' + nm(v[0], H) + '</b> do?'); }, function (v) { return v[2]; }, function (v) { return nm(v[0], H) + ': ' + H.L(v[2]).replace(/^./, function (c) { return c.toLowerCase(); }) + '.'; });
      } },
      { name: ['ΔG real de la hidrólisis del ATP', 'Actual ΔG of ATP hydrolysis'], gen: function (H) {
        var atp = H.rnd(1, 8, 1), adp = H.rnd(0.1, 1.5, 2), pi = H.rnd(1, 10, 1), T = 310, Q = (adp * 1e-3) * (pi * 1e-3) / (atp * 1e-3), dG = -30.5 + 8.314e-3 * T * Math.log(Q);
        return { q: H.t('En una célula a 37 °C: [ATP] = ' + H.fmt(atp, 1) + ' mM, [ADP] = ' + H.fmt(adp, 2) + ' mM, [P<sub>i</sub>] = ' + H.fmt(pi, 1) + ' mM. Con ΔG°′ = −30,5 kJ/mol, ¿cuánto vale ΔG de la hidrólisis del ATP?', 'In a cell at 37 °C: [ATP] = ' + H.fmt(atp, 1) + ' mM, [ADP] = ' + H.fmt(adp, 2) + ' mM, [P<sub>i</sub>] = ' + H.fmt(pi, 1) + ' mM. With ΔG°′ = −30.5 kJ/mol, what is ΔG for ATP hydrolysis?'), a: dG, tol: 0.02, unit: 'kJ/mol',
          sol: 'Q = [ADP][P<sub>i</sub>]/[ATP] = ' + H.sig(Q, 3) + ' M; ΔG = ΔG°′ + RT ln Q = ' + H.t('−30,5 + (8,314 × 10⁻³)(310) ln(', '−30.5 + (8.314 × 10⁻³)(310) ln(') + H.sig(Q, 3) + ') = ' + H.sig(dG, 3) + ' kJ/mol. ' + H.t('Como Q ≪ 1 en la célula, la hidrólisis libera más energía que en condiciones estándar.', 'Because Q ≪ 1 in the cell, hydrolysis releases more energy than under standard conditions.') };
      } }
    ]
  });
})();
