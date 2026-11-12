/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["Al calentar el producto aldólico…", "When the aldol product is heated…"], options: [["pierde agua y forma un enal conjugado", "it loses water and forms a conjugated enal"], ["vuelve a los reactivos", "it reverts to reactants"], ["se oxida a ácido", "it oxidizes to an acid"]], answer: 0, why: ["Eliminación E1cB: el doble enlace nuevo queda conjugado con el C=O, lo que favorece la deshidratación.", "E1cB elimination: the new double bond is conjugated with C=O, which drives dehydration."] } } });

/* Práctica: acidez del H α y conteo en la reacción aldólica. */
(function () {
  /* compuesto, pKa aproximado del H α más ácido */
  var P = [['CH₃COCH₃ (acetona)', 19], ['CH₃CHO (etanal)', 17], ['CH₃COOCH₂CH₃ (acetato de etilo)', 25], ['CH₃COCH₂COCH₃ (pentano-2,4-diona)', 9], ['CH₃COCH₂COOCH₂CH₃ (acetoacetato de etilo)', 11], ['CH₂(COOCH₂CH₃)₂ (malonato de dietilo)', 13], ['CH₃CN (acetonitrilo)', 25], ['CH₃NO₂ (nitrometano)', 10]];
  function tr(s, H) { return H.EN ? s.replace('(acetona)', '(acetone)').replace('(etanal)', '(ethanal)').replace('(acetato de etilo)', '(ethyl acetate)').replace('(pentano-2,4-diona)', '(pentane-2,4-dione)').replace('(acetoacetato de etilo)', '(ethyl acetoacetate)').replace('(malonato de dietilo)', '(diethyl malonate)').replace('(acetonitrilo)', '(acetonitrile)').replace('(nitrometano)', '(nitromethane)') : s; }
  var AL = [['etanal', 'ethanal', 2], ['propanal', 'propanal', 3], ['butanal', 'butanal', 4], ['acetona', 'acetone', 3], ['pentanal', 'pentanal', 5]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['H α más ácido', 'More acidic α H'], gen: function (H) {
        var a = H.pick(P), b; do { b = H.pick(P); } while (b[1] === a[1]);
        var hi = a[1] < b[1] ? a : b, lo = hi === a ? b : a;
        return H.mc(H.t('¿Cuál tiene el H α más ácido: ' + a[0] + ' o ' + b[0] + '?', 'Which has the more acidic α H: ' + tr(a[0], H) + ' or ' + tr(b[0], H) + '?'), tr(hi[0], H), [tr(lo[0], H)],
          'pK<sub>a</sub> ≈ ' + hi[1] + ' ' + H.t('frente a', 'versus') + ' ≈ ' + lo[1] + '. ' + H.t('Cuantos más grupos atractores deslocalicen la carga del enolato (dos C=O, NO₂), más ácido es el H α; el éster es menos ácido que la cetona porque su OR dona densidad al C=O.', 'The more withdrawing groups delocalize the enolate charge (two C=O, NO₂), the more acidic the α H; an ester is less acidic than a ketone because its OR donates density to C=O.'));
      } },
      { name: ['Carbonos del producto aldólico', 'Carbons in the aldol product'], gen: function (H) {
        var c = H.pick(AL), n = 2 * c[2];
        return { q: H.t('¿Cuántos carbonos tiene el producto de la adición aldólica de dos moléculas de <b>' + c[0] + '</b>?', 'How many carbons does the aldol addition product of two molecules of <b>' + c[1] + '</b> have?'), a: n, abs: 0, aText: String(n),
          sol: '2 × ' + c[2] + ' = ' + n + ' C. ' + H.t('El enolato de una molécula ataca el carbonilo de la otra: se forma un enlace C–C nuevo entre el C α y el C del carbonilo (β-hidroxicarbonilo).', 'The enolate of one molecule attacks the carbonyl of the other: a new C–C bond forms between the α carbon and the carbonyl carbon (β-hydroxycarbonyl).') };
      } },
      { name: ['Condensación y deshidratación', 'Condensation and dehydration'], gen: function (H) {
        var Q = [[['Al calentar el aldol (β-hidroxicarbonilo) en base, ¿qué se forma?', 'When the aldol (β-hydroxycarbonyl) is heated in base, what forms?'], ['Un carbonilo α,β-insaturado (pierde H₂O por E1cB)', 'An α,β-unsaturated carbonyl (loses H₂O by E1cB)'], [['Un diol', 'A diol'], ['Un ácido carboxílico', 'A carboxylic acid']], ['El H α ácido sale como enolato y luego se expulsa OH⁻: queda un C=C conjugado con el C=O.', 'The acidic α H leaves as an enolate and then OH⁻ is expelled: a C=C conjugated with C=O remains.']],
          [['En una aldólica cruzada (Claisen–Schmidt) entre benzaldehído y acetona, ¿quién aporta el enolato?', 'In a crossed aldol (Claisen–Schmidt) between benzaldehyde and acetone, which one provides the enolate?'], ['La acetona', 'Acetone'], [['El benzaldehído', 'Benzaldehyde'], ['Ambos por igual', 'Both equally']], ['El benzaldehído no tiene H α: solo puede ser el electrófilo.', 'Benzaldehyde has no α H: it can only be the electrophile.']],
          [['¿Qué base forma el enolato de una cetona de manera completa e irreversible?', 'Which base forms a ketone enolate completely and irreversibly?'], ['LDA (pK<sub>a</sub> de su ácido ≈ 36)', 'LDA (conjugate acid pK<sub>a</sub> ≈ 36)'], [['NaOH (pK<sub>a</sub> ≈ 15,7)', 'NaOH (pK<sub>a</sub> ≈ 15.7)'], ['NaHCO₃ (pK<sub>a</sub> ≈ 6,4)', 'NaHCO₃ (pK<sub>a</sub> ≈ 6.4)']], ['La base debe tener un ácido conjugado mucho más débil que la cetona (pK<sub>a</sub> ≈ 19).', 'The base must have a conjugate acid much weaker than the ketone (pK<sub>a</sub> ≈ 19).']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
