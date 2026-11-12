/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['¿Qué ángulo H–C–H tiene el metano?', 'What is the H–C–H angle in methane?'], options: [['90°', '90°'], ['109,5°', '109.5°'], ['120°', '120°']], answer: 1, why: ['Cuatro dominios sin pares libres se separan al máximo en un tetraedro: 109,5°.', 'Four domains with no lone pairs spread as far apart as possible in a tetrahedron: 109.5°.'] },
  3: { q: ['¿Qué forma tiene el XeF₄ (AX₄E₂)?', 'What shape does XeF₄ (AX₄E₂) have?'], options: [['Tetraédrica', 'Tetrahedral'], ['Balancín', 'Seesaw'], ['Plano cuadrada', 'Square planar']], answer: 2, why: ['Seis dominios en octaedro; los dos pares libres se ponen opuestos y los cuatro F quedan en un plano.', 'Six domains in an octahedron; the two lone pairs sit opposite each other and the four F lie in a plane.'] },
  5: { q: ['El CO₂ tiene enlaces C=O polares. La molécula es…', 'CO₂ has polar C=O bonds. The molecule is…'], options: [['apolar', 'nonpolar'], ['polar', 'polar']], answer: 0, why: ['Es lineal: los dos dipolos C=O son iguales y opuestos y su suma es cero.', 'It is linear: the two C=O dipoles are equal and opposite, so they add up to zero.'] }
} });

/* Recorrido guiado · GeoMol. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['VSEPR: los pares de electrones se repelen', 'VSEPR: electron pairs repel'], sel: '#molCanvas', go: function () { D.tab('explora'); D.set('molSelect', 'CH4'); },
        x: ['Los dominios de electrones (enlaces y pares libres) se alejan lo más posible. Con cuatro dominios, como en el metano, la disposición es tetraédrica (109,5°).', 'Electron domains (bonds and lone pairs) get as far apart as possible. With four domains, as in methane, the arrangement is tetrahedral (109.5°).'] },
      { t: ['Predice: el agua', 'Predict: water'], sel: '#molCanvas', go: function () { D.tab('explora'); D.set('molSelect', 'H2O'); D.set('loneToggle', true); },
        q: ['El agua tiene 4 dominios: 2 enlaces y 2 pares libres. ¿Cuál es su geometría molecular?', 'Water has 4 domains: 2 bonds and 2 lone pairs. What is its molecular geometry?'], x: ['Activa «pares libres» para verlos.', 'Turn on «lone pairs» to see them.'],
        ask: { options: [['Angular', 'Bent'], ['Lineal', 'Linear'], ['Tetraédrica', 'Tetrahedral'], ['Trigonal plana', 'Trigonal planar']], answer: 0, why: ['La disposición de los dominios es tetraédrica, pero la geometría molecular solo describe la posición de los átomos: angular, con 104,5° porque los pares libres ocupan más espacio.', 'The domain arrangement is tetrahedral, but the molecular geometry describes only atom positions: bent, with 104.5° because lone pairs take up more room.'] } },
      { t: ['Construye AXₙEₘ', 'Build AXₙEₘ'], sel: '#xRange', go: function () { D.tab('construye'); },
        q: ['¿Qué geometría tiene una molécula AX₃E, como el NH₃?', 'What is the geometry of an AX₃E molecule, such as NH₃?'], x: ['Mueve los controles de átomos (X) y pares libres (E).', 'Move the atom (X) and lone pair (E) controls.'],
        ask: { options: [['Pirámide trigonal', 'Trigonal pyramidal'], ['Trigonal plana', 'Trigonal planar'], ['Forma de T', 'T-shaped'], ['Tetraédrica', 'Tetrahedral']], answer: 0, why: ['Cuatro dominios en disposición tetraédrica; con un vértice ocupado por el par libre, los tres átomos forman una pirámide (≈ 107°).', 'Four domains in a tetrahedral arrangement; with one corner occupied by the lone pair, the three atoms form a pyramid (≈ 107°).'] } },
      { t: ['Polaridad molecular', 'Molecular polarity'], sel: '#polCanvas', go: function () { D.tab('polaridad'); },
        q: ['¿Por qué el CO₂ es apolar si sus enlaces C=O son polares?', 'Why is CO₂ nonpolar if its C=O bonds are polar?'], x: ['La polaridad de la molécula es la suma vectorial de los dipolos de enlace.', 'The polarity of the molecule is the vector sum of the bond dipoles.'],
        ask: { options: [['Es lineal: los dos dipolos se cancelan', 'It is linear: the two dipoles cancel'], ['El C y el O tienen igual electronegatividad', 'C and O have the same electronegativity'], ['Tiene pares libres en el C', 'It has lone pairs on C'], ['Es un gas', 'It is a gas']], answer: 0, why: ['Los dos dipolos C=O son iguales y opuestos (180°): su suma es cero. En el agua, angular, no se cancelan y la molécula es polar.', 'The two C=O dipoles are equal and opposite (180°): their sum is zero. In bent water they do not cancel and the molecule is polar.'] } },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#quiz', go: function () { D.tab('desafio'); }, x: ['Responde el desafío y pulsa «Revisar».', 'Answer the challenge and press «Check».'] }
    ]
  });
})();

/* Práctica: VSEPR (AXₘEₙ), geometría molecular, pares libres y polaridad. */
(function () {
  var G = { lin: ['Lineal', 'Linear'], tp: ['Trigonal plana', 'Trigonal planar'], ang: ['Angular', 'Bent'], tet: ['Tetraédrica', 'Tetrahedral'], pir: ['Piramidal trigonal', 'Trigonal pyramidal'], btp: ['Bipirámide trigonal', 'Trigonal bipyramidal'], bal: ['Balancín', 'Seesaw'], T: ['Forma de T', 'T-shaped'], oct: ['Octaédrica', 'Octahedral'], pc: ['Pirámide cuadrada', 'Square pyramidal'], cp: ['Cuadrada plana', 'Square planar'] };
  /* fórmula, átomo central, X (enlazados), E (pares libres del central), geometría, polar */
  var M = [['CO₂', 'C', 2, 0, 'lin', 0], ['BeCl₂', 'Be', 2, 0, 'lin', 0], ['HCN', 'C', 2, 0, 'lin', 1], ['BF₃', 'B', 3, 0, 'tp', 0], ['SO₃', 'S', 3, 0, 'tp', 0], ['SO₂', 'S', 2, 1, 'ang', 1], ['O₃', 'O', 2, 1, 'ang', 1],
    ['CH₄', 'C', 4, 0, 'tet', 0], ['CCl₄', 'C', 4, 0, 'tet', 0], ['CH₂Cl₂', 'C', 4, 0, 'tet', 1], ['NH₃', 'N', 3, 1, 'pir', 1], ['PCl₃', 'P', 3, 1, 'pir', 1], ['H₂O', 'O', 2, 2, 'ang', 1], ['H₂S', 'S', 2, 2, 'ang', 1],
    ['PCl₅', 'P', 5, 0, 'btp', 0], ['SF₄', 'S', 4, 1, 'bal', 1], ['ClF₃', 'Cl', 3, 2, 'T', 1], ['XeF₂', 'Xe', 2, 3, 'lin', 0], ['SF₆', 'S', 6, 0, 'oct', 0], ['BrF₅', 'Br', 5, 1, 'pc', 1], ['XeF₄', 'Xe', 4, 2, 'cp', 0]];
  function axe(m) { return 'AX' + (m[2] > 1 ? '<sub>' + m[2] + '</sub>' : '') + (m[3] ? 'E' + (m[3] > 1 ? '<sub>' + m[3] + '</sub>' : '') : ''); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Geometría molecular', 'Molecular geometry'], gen: function (H) {
        var m = H.pick(M), all = Object.keys(G).map(function (k) { return G[k]; });
        return H.mc(H.t('¿Qué geometría molecular tiene <b>' + m[0] + '</b>?', 'What is the molecular geometry of <b>' + m[0] + '</b>?'), G[m[4]], all,
          H.t('El ' + m[1] + ' central tiene ' + m[2] + ' átomos enlazados y ' + m[3] + ' par(es) libre(s): ' + axe(m) + ' (' + (m[2] + m[3]) + ' dominios). Los pares libres ocupan dominios, pero la geometría molecular describe solo la posición de los átomos.', 'The central ' + m[1] + ' has ' + m[2] + ' bonded atoms and ' + m[3] + ' lone pair(s): ' + axe(m) + ' (' + (m[2] + m[3]) + ' domains). Lone pairs occupy domains, but the molecular geometry describes only the atom positions.'));
      } },
      { name: ['Pares libres del átomo central', 'Lone pairs on the central atom'], gen: function (H) {
        var m = H.pick(M);
        return { q: H.t('¿Cuántos pares libres tiene el átomo central (' + m[1] + ') en <b>' + m[0] + '</b>?', 'How many lone pairs are on the central atom (' + m[1] + ') in <b>' + m[0] + '</b>?'), a: m[3], abs: 0, aText: String(m[3]),
          sol: H.t('Tipo VSEPR ', 'VSEPR type ') + axe(m) + ' → ' + H.L(G[m[4]]).toLowerCase() + '.' };
      } },
      { name: ['¿Polar o apolar?', 'Polar or nonpolar?'], gen: function (H) {
        var m = H.pick(M), P = ['Polar (momento dipolar neto ≠ 0)', 'Polar (net dipole moment ≠ 0)'], A = ['Apolar (los dipolos de enlace se anulan)', 'Nonpolar (the bond dipoles cancel)'];
        return H.mc(H.t('¿La molécula <b>' + m[0] + '</b> es polar?', 'Is the <b>' + m[0] + '</b> molecule polar?'), m[5] ? P : A, [P, A],
          H.t('Geometría: ', 'Geometry: ') + H.L(G[m[4]]).toLowerCase() + '. ' + (m[5] ? H.t('Los dipolos de enlace no se compensan por la asimetría (pares libres o átomos distintos).', 'The bond dipoles do not cancel because of the asymmetry (lone pairs or different atoms).') : H.t('La disposición simétrica hace que la suma vectorial de los dipolos sea cero.', 'The symmetric arrangement makes the vector sum of the dipoles zero.')));
      } }
    ]
  });
})();
