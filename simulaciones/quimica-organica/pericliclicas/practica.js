/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 1: { q: ["La electrociclación térmica de un butadieno (4 electrones π) es…", "The thermal electrocyclization of a butadiene (4 π electrons) is…"], options: [["conrotatoria", "conrotatory"], ["disrotatoria", "disrotatory"], ["no ocurre", "forbidden"]], answer: 0, why: ["Con 4n electrones, el HOMO térmico exige que los extremos giren en el mismo sentido.", "With 4n electrons, the thermal HOMO requires the termini to rotate the same way."] } } });

/* Práctica: reglas de Woodward–Hoffmann para electrociclaciones y sigmatrópicas. */
(function () {
  var CON = ['Conrotatoria', 'Conrotatory'], DIS = ['Disrotatoria', 'Disrotatory'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Modo de rotación', 'Mode of rotation'], gen: function (H) {
        var e = H.pick([4, 6, 8, 10]), hv = Math.random() < 0.4, fourN = e % 4 === 0, con = fourN !== hv;
        return H.mc(H.t('Una electrociclación con <b>' + e + ' electrones π</b> ocurre en condiciones ' + (hv ? '<b>fotoquímicas</b> (luz)' : '<b>térmicas</b> (calor)') + '. ¿Cómo giran los extremos?', 'An electrocyclization with <b>' + e + ' π electrons</b> takes place under ' + (hv ? '<b>photochemical</b> (light)' : '<b>thermal</b> (heat)') + ' conditions. How do the termini rotate?'), con ? CON : DIS, [CON, DIS],
          e + ' = ' + (fourN ? '4n' : '4n + 2') + '. ' + H.t('Térmicas: 4n conrotatoria, 4n + 2 disrotatoria (simetría del HOMO del estado fundamental). La luz promueve un electrón al LUMO y las reglas se invierten.', 'Thermal: 4n conrotatory, 4n + 2 disrotatory (symmetry of the ground-state HOMO). Light promotes an electron to the LUMO and the rules flip.'));
      } },
      { name: ['Estereoquímica del producto', 'Product stereochemistry'], gen: function (H) {
        var Q = [[['(2E,4Z,6E)-octa-2,4,6-trieno se cicla por calor. ¿Cómo quedan los metilos en el ciclohexadieno?', '(2E,4Z,6E)-octa-2,4,6-triene cyclizes on heating. How do the methyl groups end up in the cyclohexadiene?'], ['cis', 'cis'], [['trans', 'trans']], ['6 e⁻ térmico → disrotatorio: los dos metilos “de afuera” giran hacia el mismo lado.', '6 e⁻ thermal → disrotatory: the two “outside” methyls turn to the same side.']],
          [['(2E,4E)-hexa-2,4-dieno se cicla por calor a 3,4-dimetilciclobuteno. ¿Cómo quedan los metilos?', '(2E,4E)-hexa-2,4-diene cyclizes on heating to 3,4-dimethylcyclobutene. How do the methyls end up?'], ['trans', 'trans'], [['cis', 'cis']], ['4 e⁻ térmico → conrotatorio: un metilo sube y el otro baja.', '4 e⁻ thermal → conrotatory: one methyl goes up and the other down.']],
          [['Un reordenamiento de Cope es un desplazamiento sigmatrópico…', 'A Cope rearrangement is a … sigmatropic shift'], ['[3,3]', '[3,3]'], [['[1,5]', '[1,5]'], ['[1,3]', '[1,3]']], ['Se rompe un enlace σ entre C3 y C4 de un 1,5-dieno y se forma otro entre C1 y C6: [3,3].', 'A σ bond between C3 and C4 of a 1,5-diene breaks and a new one forms between C1 and C6: [3,3].']],
          [['¿Qué desplazamiento de H es permitido térmicamente de manera suprafacial?', 'Which hydrogen shift is thermally allowed suprafacially?'], ['[1,5]-H (6 electrones)', '[1,5]-H (6 electrons)'], [['[1,3]-H (4 electrones)', '[1,3]-H (4 electrons)'], ['[1,7]-H (8 electrones)', '[1,7]-H (8 electrons)']], ['Un estado de transición de 6 electrones (4n + 2) es aromático y permitido suprafacial; [1,3] y [1,7] suprafaciales son prohibidos.', 'A 6-electron (4n + 2) transition state is aromatic and suprafacially allowed; suprafacial [1,3] and [1,7] are forbidden.']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
