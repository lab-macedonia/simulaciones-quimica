/* Práctica · Conformaciones y valores A (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var A = [['CH₃', 7.3], ['CH₂CH₃', 7.5], ['CH(CH₃)₂', 9.2], ['C(CH₃)₃', 20], ['OH', 3.9], ['Cl', 2.0], ['Br', 2.0], ['C₆H₅', 11.7]];
  SimAula.register({ problems: [
    { name: ['Porcentaje ecuatorial', 'Percent equatorial'], gen: function (H) {
      var a = H.pick(A), K = Math.exp(a[1] * 1000 / (8.314 * 298)), p = K / (1 + K) * 100;
      return { q: H.t('El valor A del sustituyente ' + a[0] + ' es ' + H.fmt(a[1], 1) + ' kJ/mol. ¿Qué porcentaje del ciclohexano monosustituido tiene el grupo ecuatorial a 298 K?', 'The A value of ' + a[0] + ' is ' + H.fmt(a[1], 1) + ' kJ/mol. What percentage of the monosubstituted cyclohexane has the group equatorial at 298 K?'), a: p, unit: '%', abs: Math.max(0.1, (100 - p) * 0.05),
        sol: 'K = e<sup>ΔG/RT</sup> = e<sup>' + H.fmt(a[1] * 1000 / (8.314 * 298), 2) + '</sup> = ' + H.sig(K, 3) + '; % ' + H.t('ecuatorial', 'equatorial') + ' = K/(1 + K) × 100 = ' + H.sig(p, 4) + ' %' };
    } },
    { name: ['Energía de una conformación del butano', 'Energy of a butane conformation'], gen: function (H) {
      var c = H.pick([[H.t('gauche', 'gauche'), 3.8], [H.t('eclipsada H/CH₃', 'eclipsed H/CH₃'), 16], [H.t('totalmente eclipsada (sin)', 'fully eclipsed (syn)'), 19]]);
      return { q: H.t('Respecto de la conformación anti, ¿qué energía tiene la conformación ' + c[0] + ' del butano (kJ/mol)?', 'Relative to the anti conformation, what is the energy of butane\'s ' + c[0] + ' conformation (kJ/mol)?'), a: c[1], abs: 1, aText: H.fmt(c[1], 1),
        sol: H.t('Valores típicos: anti 0; gauche 3,8; eclipsada H/CH₃ ≈ 16; totalmente eclipsada ≈ 19 kJ/mol.', 'Typical values: anti 0; gauche 3.8; eclipsed H/CH₃ ≈ 16; fully eclipsed ≈ 19 kJ/mol.') };
    } },
    { name: ['Conformación preferida', 'Preferred conformation'], gen: function (H) {
      var a = H.shuffle(A).slice(0, 2); if (Math.abs(a[0][1] - a[1][1]) < 1) return null; var big = a[0][1] > a[1][1] ? 0 : 1;
      return { q: H.t('En un ciclohexano trans-1,4 con ' + a[0][0] + ' y ' + a[1][0] + ', ¿qué silla predomina?', 'In a trans-1,4-cyclohexane with ' + a[0][0] + ' and ' + a[1][0] + ', which chair predominates?'), options: [H.t('Ambos ecuatoriales', 'Both equatorial'), H.t('Ambos axiales', 'Both axial')], answer: 0,
        sol: H.t('En trans-1,4 ambos grupos son ecuatoriales a la vez (o axiales a la vez); la silla diecuatorial evita las interacciones 1,3-diaxiales.', 'In trans-1,4 both groups are equatorial together (or axial together); the diequatorial chair avoids 1,3-diaxial interactions.') };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 5: { q: ["En el metilciclohexano, el metilo prefiere la posición…", "In methylcyclohexane, the methyl prefers the…"], options: [["ecuatorial", "equatorial position"], ["axial", "axial position"], ["ninguna en especial", "neither"]], answer: 0, why: ["En axial sufre interacciones 1,3-diaxiales con los H (≈ 7 kJ/mol): ~95 % ecuatorial.", "Axial suffers 1,3-diaxial interactions with H (≈ 7 kJ/mol): ~95 % equatorial."] } } });
