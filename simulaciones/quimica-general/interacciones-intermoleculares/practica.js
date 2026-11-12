/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["¿Cuál de estas sustancias forma puentes de hidrógeno entre sus moléculas?", "Which of these substances forms hydrogen bonds between its molecules?"], options: [["Etanol", "Ethanol"], ["Éter dietílico", "Diethyl ether"], ["Metano", "Methane"], ["Clorometano", "Chloromethane"]], answer: 0, why: ["Hace falta un H unido a N, O o F (donor) y un par libre (aceptor): el etanol tiene ambos.", "It needs an H bonded to N, O or F (donor) and a lone pair (acceptor): ethanol has both."] } } });

/* Práctica: interacción dominante entre dos especies y comparación de puntos de ebullición. */
(function () {
  var K = { ii: ['Ion–ion', 'Ion–ion'], id: ['Ion–dipolo', 'Ion–dipole'], hb: ['Enlace (puente) de hidrógeno', 'Hydrogen bond'], dd: ['Dipolo–dipolo', 'Dipole–dipole'], lo: ['Fuerzas de London (dispersión)', 'London (dispersion) forces'] };
  var P = [['Na⁺ y Cl⁻', 'ii'], ['Mg²⁺ y O²⁻', 'ii'], ['Na⁺ y H₂O', 'id'], ['K⁺ y H₂O', 'id'], ['Cl⁻ y H₂O', 'id'], ['H₂O y H₂O', 'hb'], ['HF y HF', 'hb'], ['NH₃ y H₂O', 'hb'], ['CH₃OH y H₂O', 'hb'],
    ['HCl y HCl', 'dd'], ['CH₃COCH₃ y CH₃COCH₃ (acetona)', 'dd'], ['CH₃OCH₃ y CH₃OCH₃ (éter dimetílico)', 'dd'], ['H₂S y H₂S', 'dd'], ['CH₄ y CH₄', 'lo'], ['Ar y Ar', 'lo'], ['I₂ y I₂', 'lo'], ['Br₂ y CCl₄', 'lo'], ['C₆H₁₄ y C₆H₁₄ (hexano)', 'lo']];
  function en(s) { return s.replace(' y ', ' and ').replace('(acetona)', '(acetone)').replace('(éter dimetílico)', '(dimethyl ether)').replace('(hexano)', '(hexane)'); }
  /* mayor punto de ebullición, menor, razón */
  var BP = [['HF', 'HCl', ['El HF forma enlaces de hidrógeno (H unido a F).', 'HF forms hydrogen bonds (H bonded to F).']], ['H₂O', 'H₂S', ['El agua forma enlaces de hidrógeno; el H₂S solo dipolo–dipolo y London.', 'Water forms hydrogen bonds; H₂S only dipole–dipole and London.']],
    ['I₂', 'F₂', ['El I₂ tiene muchos más electrones: nube más polarizable, London más intensas.', 'I₂ has many more electrons: a more polarizable cloud, stronger London forces.']], ['C₈H₁₈ (octano)', 'CH₄ (metano)', ['Más electrones y más superficie de contacto → London más intensas.', 'More electrons and more contact surface → stronger London forces.']],
    ['CH₃CH₂OH (etanol)', 'CH₃OCH₃ (éter dimetílico)', ['Misma masa molar, pero el etanol tiene O–H y forma enlaces de hidrógeno.', 'Same molar mass, but ethanol has O–H and forms hydrogen bonds.']], ['n-pentano', 'neopentano (2,2-dimetilpropano)', ['Misma fórmula (C₅H₁₂); la cadena lineal tiene más superficie de contacto que la esférica.', 'Same formula (C₅H₁₂); the linear chain has more contact surface than the spherical one.']],
    ['NaCl', 'HCl', ['El NaCl es un sólido iónico: las atracciones ion–ion son mucho más fuertes.', 'NaCl is an ionic solid: ion–ion attractions are much stronger.']], ['NH₃', 'PH₃', ['El NH₃ forma enlaces de hidrógeno (H unido a N).', 'NH₃ forms hydrogen bonds (H bonded to N).']], ['Br₂', 'Cl₂', ['El Br₂ tiene más electrones: London más intensas.', 'Br₂ has more electrons: stronger London forces.']]];
  function tr(s, H) { return H.EN ? s.replace('(octano)', '(octane)').replace('(metano)', '(methane)').replace('(etanol)', '(ethanol)').replace('(éter dimetílico)', '(dimethyl ether)').replace('n-pentano', 'n-pentane').replace('neopentano', 'neopentane') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Interacción dominante', 'Dominant interaction'], gen: function (H) {
        return H.bank(P, function (p) { return H.t('Las fuerzas de London existen siempre. ¿Qué interacción <b>característica</b> (la más intensa) hay entre <b>' + p[0] + '</b>? Si no hay otra, elige London.', 'London forces are always present. Which <b>characteristic</b> (strongest) interaction acts between <b>' + en(p[0]) + '</b>? If there is no other, choose London.'); }, function (p) { return K[p[1]]; },
          function (p) { return { ii: H.t('Dos iones de carga opuesta: atracción de Coulomb entre cargas completas.', 'Two oppositely charged ions: Coulomb attraction between full charges.'), id: H.t('Un ion orienta hacia sí el extremo de carga opuesta del dipolo del agua (hidratación).', 'An ion attracts the oppositely charged end of the water dipole (hydration).'), hb: H.t('Hay H unido a N, O o F en una especie y un par libre de N, O o F en la otra.', 'There is H bonded to N, O or F on one species and a lone pair on N, O or F on the other.'), dd: H.t('Moléculas polares sin H unido a N, O o F: se alinean sus dipolos permanentes.', 'Polar molecules without H bonded to N, O or F: their permanent dipoles line up.'), lo: H.t('Especies apolares: solo dipolos instantáneos e inducidos.', 'Nonpolar species: only instantaneous and induced dipoles.') }[p[1]]; }, [K.ii, K.id, K.hb, K.dd, K.lo]);
      } },
      { name: ['¿Cuál hierve a mayor temperatura?', 'Which boils at a higher temperature?'], gen: function (H) {
        var b = H.pick(BP);
        return H.mc(H.t('¿Cuál tiene mayor punto de ebullición: ' + b[0] + ' o ' + b[1] + '?', 'Which has the higher boiling point: ' + tr(b[0], H) + ' or ' + tr(b[1], H) + '?'), tr(b[0], H), [tr(b[1], H)], b[2]);
      } }
    ]
  });
})();
