/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["El ciclobutadieno (plano, 4 electrones π) es…", "Cyclobutadiene (planar, 4 π electrons) is…"], options: [["antiaromático", "antiaromatic"], ["aromático", "aromatic"], ["no aromático", "nonaromatic"]], answer: 0, why: ["4n electrones π en un anillo plano conjugado dejan dos electrones desapareados en orbitales no enlazantes.", "4n π electrons in a planar conjugated ring leave two unpaired electrons in nonbonding orbitals."] } } });

/* Práctica: electrones π y regla de Hückel. */
(function () {
  var A = ['Aromático', 'Aromatic'], AA = ['Antiaromático', 'Antiaromatic'], NA = ['No aromático', 'Nonaromatic'];
  /* especie, electrones π, ¿cíclica, plana y totalmente conjugada?, nota */
  var S = [['benceno', 'benzene', 6, 1, ''], ['ciclobutadieno', 'cyclobutadiene', 4, 1, ''], ['anión ciclopentadienilo (C₅H₅⁻)', 'cyclopentadienyl anion (C₅H₅⁻)', 6, 1, ['El CH₂ desprotonado deja un par en un orbital p.', 'The deprotonated CH₂ leaves a pair in a p orbital.']],
    ['catión ciclopentadienilo (C₅H₅⁺)', 'cyclopentadienyl cation (C₅H₅⁺)', 4, 1, ''], ['catión tropilio (C₇H₇⁺)', 'tropylium cation (C₇H₇⁺)', 6, 1, ''], ['catión ciclopropenilo (C₃H₃⁺)', 'cyclopropenyl cation (C₃H₃⁺)', 2, 1, ['n = 0: 4·0 + 2 = 2.', 'n = 0: 4·0 + 2 = 2.']],
    ['ciclopentadieno (C₅H₆)', 'cyclopentadiene (C₅H₆)', 4, 0, ['Su CH₂ sp³ interrumpe la conjugación.', 'Its sp³ CH₂ breaks the conjugation.']], ['ciclooctatetraeno', 'cyclooctatetraene', 8, 0, ['Se pliega en forma de tina para evitar ser antiaromático: no es plano.', 'It folds into a tub shape to avoid antiaromaticity: it is not planar.']],
    ['dianión ciclooctatetraenilo (C₈H₈²⁻)', 'cyclooctatetraenyl dianion (C₈H₈²⁻)', 10, 1, ''], ['naftaleno', 'naphthalene', 10, 1, ''], ['pirrol', 'pyrrole', 6, 1, ['El par del N–H forma parte del sistema π.', 'The N–H lone pair is part of the π system.']],
    ['piridina', 'pyridine', 6, 1, ['El par del N está en el plano (sp²) y no cuenta.', 'The N lone pair lies in the plane (sp²) and does not count.']], ['furano', 'furan', 6, 1, ['Un par del O entra al sistema π; el otro queda en el plano.', 'One O lone pair joins the π system; the other stays in the plane.']], ['[18]anuleno', '[18]annulene', 18, 1, ['n = 4: 4·4 + 2 = 18.', 'n = 4: 4·4 + 2 = 18.']]];
  function cls(s) { return !s[3] ? NA : (s[2] - 2) % 4 === 0 ? A : AA; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Contar electrones π', 'Count π electrons'], gen: function (H) {
        var s = H.pick(S.filter(function (x) { return x[3]; }));
        return { q: H.t('¿Cuántos electrones π hay en el sistema cíclico conjugado de <b>' + s[0] + '</b>?', 'How many π electrons are in the cyclic conjugated system of <b>' + s[1] + '</b>?'), a: s[2], abs: 0, aText: String(s[2]), sol: H.L(s[4]) + ' ' + s[2] + ' e⁻ π → ' + H.L(cls(s)).toLowerCase() + '.' };
      } },
      { name: ['¿Aromático?', 'Aromatic?'], gen: function (H) {
        var s = H.pick(S), c = cls(s);
        return H.mc(H.t('¿Cómo se clasifica <b>' + s[0] + '</b>?', 'How is <b>' + s[1] + '</b> classified?'), c, [A, AA, NA],
          (s[3] ? s[2] + H.t(' electrones π en un anillo plano y totalmente conjugado: ', ' π electrons in a planar, fully conjugated ring: ') + (c === A ? '4n + 2 → ' + H.t('aromático.', 'aromatic.') : '4n → ' + H.t('antiaromático.', 'antiaromatic.')) : H.t('No cumple que sea cíclico, plano y totalmente conjugado.', 'It is not cyclic, planar and fully conjugated.')) + ' ' + H.L(s[4]));
      } },
      { name: ['Regla 4n + 2 (anuleno genérico)', '4n + 2 rule (generic annulene)'], gen: function (H) {
        var e = 2 * H.int(1, 11), arom = (e - 2) % 4 === 0;
        return H.mc(H.t('Un anillo plano y totalmente conjugado tiene <b>' + e + '</b> electrones π. Es…', 'A planar, fully conjugated ring has <b>' + e + '</b> π electrons. It is…'), arom ? A : AA, [A, AA],
          arom ? e + ' = 4·' + (e - 2) / 4 + ' + 2 → ' + H.t('aromático', 'aromatic') : e + ' = 4·' + e / 4 + ' → ' + H.t('antiaromático', 'antiaromatic'));
      } }
    ]
  });
})();
