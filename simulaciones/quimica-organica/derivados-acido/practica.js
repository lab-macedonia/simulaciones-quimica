/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["¿Qué derivado se hidroliza más rápido?", "Which derivative hydrolyzes fastest?"], options: [["El cloruro de acilo", "The acyl chloride"], ["El éster", "The ester"], ["La amida", "The amide"]], answer: 0, why: ["El Cl⁻ es el mejor grupo saliente y el que menos dona al carbonilo.", "Cl⁻ is the best leaving group and donates least to the carbonyl."] } } });

/* Práctica: reactividad de los derivados de ácido y conversiones posibles. */
(function () {
  var D = [['cloruro de ácido', 'acid chloride', 'RCOCl', 4], ['anhídrido', 'anhydride', '(RCO)₂O', 3], ['éster', 'ester', 'RCOOR′', 2], ['amida', 'amide', 'RCONH₂', 1]];
  function n(d, H) { return H.EN ? d[1] : d[0]; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['¿Cuál es más reactivo?', 'Which is more reactive?'], gen: function (H) {
        var a = H.pick(D), b; do { b = H.pick(D); } while (b === a);
        var hi = a[3] > b[3] ? a : b, lo = hi === a ? b : a;
        return H.mc(H.t('¿Cuál reacciona más rápido en una sustitución nucleófila acílica: ' + a[0] + ' (' + a[2] + ') o ' + b[0] + ' (' + b[2] + ')?', 'Which reacts faster in a nucleophilic acyl substitution: ' + a[1] + ' (' + a[2] + ') or ' + b[1] + ' (' + b[2] + ')?'), n(hi, H) + ' (' + hi[2] + ')', [n(lo, H) + ' (' + lo[2] + ')'],
          H.t('Orden: cloruro > anhídrido > éster > amida. Cuanto mejor grupo saliente (Cl⁻ > RCOO⁻ > RO⁻ > NH₂⁻) y menor la resonancia con el C=O, más reactivo.', 'Order: chloride > anhydride > ester > amide. The better the leaving group (Cl⁻ > RCOO⁻ > RO⁻ > NH₂⁻) and the weaker the resonance with C=O, the more reactive.'));
      } },
      { name: ['¿Es posible la conversión directa?', 'Is the direct conversion possible?'], gen: function (H) {
        var a = H.pick(D), b; do { b = H.pick(D); } while (b === a);
        var ok = a[3] > b[3], Y = ['Sí: va de un derivado más reactivo a uno menos reactivo', 'Yes: it goes from a more reactive to a less reactive derivative'], N = ['No directamente: el producto sería más reactivo', 'Not directly: the product would be more reactive'];
        return H.mc(H.t('¿Se puede transformar directamente un(a) <b>' + a[0] + '</b> en un(a) <b>' + b[0] + '</b> con el nucleófilo adecuado?', 'Can an <b>' + a[1] + '</b> be converted directly into an <b>' + b[1] + '</b> with the right nucleophile?').replace('an <b>acid', 'an <b>acid').replace(/\ban <b>(ester|amide)/g, 'an <b>$1'), ok ? Y : N, [Y, N],
          H.t('La sustitución acílica es favorable “cuesta abajo”: cloruro → anhídrido → éster → amida.', 'Acyl substitution is favorable “downhill”: chloride → anhydride → ester → amide.'));
      } },
      { name: ['Producto de la reacción', 'Reaction product'], gen: function (H) {
        var R = [['CH₃COCl + CH₃CH₂OH', ['Etanoato de etilo + HCl', 'Ethyl ethanoate + HCl']], ['CH₃COCl + 2 NH₃', ['Etanamida + NH₄Cl', 'Ethanamide + NH₄Cl']], ['CH₃COOCH₂CH₃ + NaOH (saponificación)', ['Etanoato de sodio + etanol', 'Sodium ethanoate + ethanol']],
          ['CH₃COOH + CH₃OH (H⁺, calor)', ['Etanoato de metilo + H₂O (esterificación de Fischer)', 'Methyl ethanoate + H₂O (Fischer esterification)']], ['(CH₃CO)₂O + CH₃NH₂', ['N-metiletanamida + ácido acético', 'N-methylethanamide + acetic acid']], ['CH₃CONH₂ + H₃O⁺, calor', ['Ácido etanoico + NH₄⁺', 'Ethanoic acid + NH₄⁺']]];
        return H.bank(R, function (r) { return H.t('¿Qué se forma en <b>' + r[0] + '</b>?', 'What forms in <b>' + r[0].replace('(saponificación)', '(saponification)').replace('calor', 'heat') + '</b>?'); }, function (r) { return r[1]; },
          function () { return H.t('Adición del nucleófilo al C=O → intermediario tetraédrico → sale el grupo saliente (adición–eliminación).', 'Nucleophile adds to C=O → tetrahedral intermediate → the leaving group departs (addition–elimination).'); });
      } }
    ]
  });
})();
