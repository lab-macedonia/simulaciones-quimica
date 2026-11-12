/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["¿Cuál es más básico: piridina o pirrol?", "Which is more basic: pyridine or pyrrole?"], options: [["Piridina", "Pyridine"], ["Pirrol", "Pyrrole"], ["Iguales", "Equal"]], answer: 0, why: ["En la piridina el par libre está en el plano (sp²) y disponible; en el pirrol forma parte del sexteto aromático.", "In pyridine the lone pair lies in the plane (sp²) and is available; in pyrrole it is part of the aromatic sextet."] } } });

/* Práctica: par libre del heteroátomo, basicidad y reactividad de heterociclos aromáticos. */
(function () {
  var IN = ['En el sistema π (aporta 2 e⁻ a la aromaticidad)', 'In the π system (contributes 2 e⁻ to aromaticity)'], PL = ['En el plano del anillo (orbital sp², fuera del sistema π)', 'In the ring plane (sp² orbital, outside the π system)'];
  var LP = [['pirrol (N–H)', 'pyrrole (N–H)', 1], ['piridina', 'pyridine', 0], ['el N–H del imidazol', 'the N–H nitrogen of imidazole', 1], ['el N tipo piridina del imidazol', 'the pyridine-like N of imidazole', 0], ['pirimidina (cada N)', 'pyrimidine (each N)', 0], ['furano (uno de los pares del O)', 'furan (one of the O lone pairs)', 1], ['tiofeno (uno de los pares del S)', 'thiophene (one of the S lone pairs)', 1]];
  /* más básico, menos básico, pKa de los ácidos conjugados */
  var B = [['piridina', 'pyridine', 5.2, 'pirrol', 'pyrrole', -3.8], ['imidazol', 'imidazole', 7.0, 'piridina', 'pyridine', 5.2], ['piperidina', 'piperidine', 11.1, 'piridina', 'pyridine', 5.2], ['piridina', 'pyridine', 5.2, 'pirimidina', 'pyrimidine', 1.3]];
  var R = [['pirrol', 'pyrrole', 'benceno', 'benzene', ['Su par libre en el anillo lo enriquece en electrones: SEAr mucho más rápida (en C2).', 'Its lone pair in the ring makes it electron-rich: much faster EAS (at C2).']],
    ['benceno', 'benzene', 'piridina', 'pyridine', ['El N electronegativo empobrece el anillo de la piridina y además se protona en medio ácido.', 'The electronegative N makes pyridine electron-poor, and it is protonated in acid.']],
    ['furano', 'furan', 'benceno', 'benzene', ['El O dona un par al anillo: el furano es mucho más reactivo que el benceno.', 'O donates a pair into the ring: furan is far more reactive than benzene.']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['¿Dónde está el par libre?', 'Where is the lone pair?'], gen: function (H) {
        var l = H.pick(LP);
        return H.mc(H.t('¿Dónde está el par libre del heteroátomo en <b>' + l[0] + '</b>?', 'Where is the heteroatom lone pair in <b>' + l[1] + '</b>?'), l[2] ? IN : PL, [IN, PL],
          l[2] ? H.t('Sin ese par el anillo no tendría 6 electrones π: por eso el par no está disponible para protonarse.', 'Without that pair the ring would not have 6 π electrons: so the pair is not available for protonation.') : H.t('El N ya aporta 1 e⁻ al sistema π con su orbital p; el par queda libre en el plano y es básico.', 'N already contributes 1 e⁻ to the π system through its p orbital; the pair stays free in the plane and is basic.'));
      } },
      { name: ['¿Cuál es más básico?', 'Which is more basic?'], gen: function (H) {
        var b = H.pick(B), e = H.EN ? 1 : 0;
        return H.mc(H.t('¿Cuál es más básico: ' + b[3] + ' o ' + b[0] + '?', 'Which is more basic: ' + b[4] + ' or ' + b[1] + '?'), b[e], [b[3 + e]],
          'pK<sub>a</sub> (BH⁺): ' + b[e] + ' ≈ ' + H.fmt(b[2], 1) + ', ' + b[3 + e] + ' ≈ ' + H.fmt(b[5], 1) + '. ' + H.t('A mayor pK<sub>a</sub> del ácido conjugado, más básica la especie.', 'The higher the pK<sub>a</sub> of the conjugate acid, the more basic the species.'));
      } },
      { name: ['Reactividad en SEAr', 'Reactivity in EAS'], gen: function (H) {
        var r = H.pick(R), e = H.EN ? 1 : 0;
        return H.mc(H.t('¿Cuál reacciona más rápido en una sustitución electrofílica aromática: ' + r[0] + ' o ' + r[2] + '?', 'Which reacts faster in electrophilic aromatic substitution: ' + r[1] + ' or ' + r[3] + '?'), r[e], [r[2 + e]], r[4]);
      } }
    ]
  });
})();
