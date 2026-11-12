/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['El Ag⁺ (grande, carga +1, muy polarizable) es un ácido…', 'Ag⁺ (large, +1 charge, highly polarizable) is a…'], options: [['duro', 'hard acid'], ['blando', 'soft acid'], ['frontera', 'borderline acid']], answer: 1, why: ['Tamaño grande, carga baja y alta polarizabilidad son los rasgos de un ácido blando, como Hg²⁺ o Cu⁺.', 'Large size, low charge and high polarizability are the marks of a soft acid, like Hg²⁺ or Cu⁺.'] },
  3: { q: ['Con Al³⁺, Hg²⁺, O²⁻ y S²⁻, el intercambio favorece los pares…', 'With Al³⁺, Hg²⁺, O²⁻ and S²⁻, the exchange favours the pairs…'], options: [['Al–S y Hg–O', 'Al–S and Hg–O'], ['Al–O y Hg–S', 'Al–O and Hg–S'], ['da lo mismo: no hay preferencia', 'it makes no difference']], answer: 1, why: ['Duro con duro (Al³⁺–O²⁻) y blando con blando (Hg²⁺–S²⁻): por eso el aluminio aparece como óxido y el mercurio como cinabrio, HgS.', 'Hard with hard (Al³⁺–O²⁻) and soft with soft (Hg²⁺–S²⁻): that is why aluminium occurs as an oxide and mercury as cinnabar, HgS.'] }
} });

/* Práctica · Ácidos y bases duros y blandos (HSAB). Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var C = { d: ['Duro', 'Hard'], f: ['Frontera', 'Borderline'], b: ['Blando', 'Soft'] };
  var AC = [['H⁺', 'd'], ['Li⁺', 'd'], ['Na⁺', 'd'], ['Mg²⁺', 'd'], ['Ca²⁺', 'd'], ['Al³⁺', 'd'], ['Fe³⁺', 'd'], ['Cr³⁺', 'd'], ['Ti⁴⁺', 'd'],
    ['Fe²⁺', 'f'], ['Co²⁺', 'f'], ['Ni²⁺', 'f'], ['Cu²⁺', 'f'], ['Zn²⁺', 'f'], ['Pb²⁺', 'f'], ['Cu⁺', 'b'], ['Ag⁺', 'b'], ['Au⁺', 'b'], ['Hg²⁺', 'b'], ['Cd²⁺', 'b'], ['Pt²⁺', 'b'], ['Pd²⁺', 'b']];
  var BA = [['F⁻', 'd'], ['OH⁻', 'd'], ['H₂O', 'd'], ['NH₃', 'd'], ['Cl⁻', 'd'], ['CO₃²⁻', 'd'], ['SO₄²⁻', 'd'], ['Br⁻', 'f'], ['N₃⁻', 'f'], ['NO₂⁻', 'f'], ['C₅H₅N (piridina)', 'f'],
    ['I⁻', 'b'], ['SCN⁻ (por S)', 'b'], ['CN⁻', 'b'], ['CO', 'b'], ['R₂S', 'b'], ['PR₃', 'b'], ['H⁻', 'b']];
  function en(s) { return s.replace('(piridina)', '(pyridine)').replace('(por S)', '(through S)'); }
  function why(k, base, H) {
    return k === 'd' ? H.t(base ? 'Átomo donador pequeño, muy electronegativo y poco polarizable.' : 'Catión pequeño, de carga alta y poco polarizable.', base ? 'Small, very electronegative, weakly polarizable donor atom.' : 'Small, highly charged, weakly polarizable cation.')
      : k === 'b' ? H.t(base ? 'Átomo donador grande, poco electronegativo y muy polarizable.' : 'Catión grande, de carga baja y muy polarizable (muchos electrones d).', base ? 'Large, weakly electronegative, highly polarizable donor atom.' : 'Large, low-charge, highly polarizable cation (many d electrons).')
      : H.t('Propiedades intermedias entre duro y blando.', 'Properties between hard and soft.');
  }
  /* ácido, base preferida, base que compite */
  var PREF = [['Ag⁺', 'I⁻', 'F⁻'], ['Hg²⁺', 'R₂S', 'H₂O'], ['Al³⁺', 'F⁻', 'I⁻'], ['Ca²⁺', 'CO₃²⁻', 'S²⁻'], ['Mg²⁺', 'OH⁻', 'SH⁻'], ['Pt²⁺', 'PR₃', 'NH₃'], ['Fe³⁺', 'OH⁻', 'I⁻'], ['Au⁺', 'CN⁻', 'F⁻'], ['Cd²⁺', 'S²⁻', 'O²⁻'], ['Li⁺', 'F⁻', 'I⁻']];
  var SOFT = ['I⁻', 'R₂S', 'PR₃', 'CN⁻', 'S²⁻', 'SH⁻'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Clasificar un ácido de Lewis', 'Classify a Lewis acid'], gen: function (H) {
        return H.bank(AC, function (x) { return H.t('Según la teoría HSAB, el catión <b>' + x[0] + '</b> es un ácido…', 'According to HSAB theory, the cation <b>' + x[0] + '</b> is a … acid'); }, function (x) { return C[x[1]]; }, function (x) { return why(x[1], 0, H); }, [C.d, C.f, C.b]);
      } },
      { name: ['Clasificar una base de Lewis', 'Classify a Lewis base'], gen: function (H) {
        return H.bank(BA, function (x) { return H.t('Según la teoría HSAB, <b>' + x[0] + '</b> es una base…', 'According to HSAB theory, <b>' + en(x[0]) + '</b> is a … base'); }, function (x) { return C[x[1]]; }, function (x) { return why(x[1], 1, H); }, [C.d, C.f, C.b]);
      } },
      { name: ['Par preferido', 'Preferred pair'], gen: function (H) {
        var p = H.pick(PREF), soft = SOFT.indexOf(p[1]) >= 0;
        return H.mc(H.t('¿Con qué base forma un enlace más estable <b>' + p[0] + '</b>?', 'Which base forms the more stable bond with <b>' + p[0] + '</b>?'), p[1], [p[2]],
          H.t('Duro con duro y blando con blando: ', 'Hard prefers hard and soft prefers soft: ') + p[0] + H.t(' es ', ' is ') + (soft ? H.t('blando', 'soft') : H.t('duro', 'hard')) + H.t(', igual que ', ', like ') + p[1] + '.');
      } }
    ]
  });
})();
