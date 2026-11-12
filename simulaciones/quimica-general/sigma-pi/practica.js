/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Al torcer 90° un doble enlace C=C, la energía…', 'Twisting a C=C double bond by 90°, the energy…'], options: [['baja', 'drops'], ['no cambia', 'does not change'], ['sube hasta un máximo', 'rises to a maximum']], answer: 2, why: ['A 90° los orbitales p quedan perpendiculares: el solapamiento π desaparece y hay que romper ese enlace.', 'At 90° the p orbitals are perpendicular: π overlap vanishes and that bond has to be broken.'] },
  4: { q: ['Los seis electrones π del benceno están…', 'Benzene’s six π electrons are…'], options: [['deslocalizados sobre todo el anillo', 'delocalized over the whole ring'], ['en tres dobles enlaces fijos', 'in three fixed double bonds'], ['en el plano del anillo', 'in the plane of the ring']], answer: 0, why: ['Forman una nube por encima y por debajo del plano que abarca los seis carbonos; por eso todos los enlaces C–C miden lo mismo.', 'They form a cloud above and below the plane spanning all six carbons; that is why all C–C bonds are the same length.'] }
} });

/* Recorrido guiado · Enlaces sigma y pi. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['El enlace σ', 'The σ bond'], sel: '#bondCanvas', go: function () { D.tab('simulador'); D.set('bondSelect', 'single'); D.set('orbitalToggle', true); },
        x: ['En el etano los orbitales híbridos sp³ se solapan de frente, sobre el eje que une los núcleos: es un enlace σ, con simetría cilíndrica.', 'In ethane the sp³ hybrid orbitals overlap head-on, along the axis joining the nuclei: this is a σ bond, with cylindrical symmetry.'] },
      { t: ['El doble enlace', 'The double bond'], sel: '#bondCanvas', go: function () { D.tab('simulador'); D.set('bondSelect', 'double'); },
        q: ['¿Cuántos enlaces σ y π hay en un doble enlace C=C?', 'How many σ and π bonds are there in a C=C double bond?'], x: ['Observa el eteno: cada carbono es sp² y le queda un orbital p sin hibridar.', 'Look at ethene: each carbon is sp² and keeps one unhybridized p orbital.'],
        ask: { options: [['1 σ y 1 π', '1 σ and 1 π'], ['2 σ', '2 σ'], ['2 π', '2 π'], ['1 σ y 2 π', '1 σ and 2 π']], answer: 0, why: ['Los sp² forman el σ; los dos orbitales p paralelos se solapan de lado, por encima y por debajo del plano, y forman el π.', 'The sp² orbitals form the σ; the two parallel p orbitals overlap sideways, above and below the plane, forming the π.'] } },
      { t: ['Prueba la rotación', 'Try the rotation'], sel: '#rotateButton', go: function () { D.tab('simulador'); D.set('bondSelect', 'double'); },
        q: ['¿Por qué existen isómeros cis y trans en los alquenos?', 'Why do cis and trans isomers exist for alkenes?'], x: ['Pulsa «Probar rotación C–C» con el enlace simple y con el doble.', 'Press «Try C–C rotation» with the single and the double bond.'],
        ask: { options: [['Porque girar rompería el solapamiento π', 'Because rotating would break the π overlap'], ['Porque el enlace σ es más corto', 'Because the σ bond is shorter'], ['Porque los H se repelen', 'Because the H atoms repel'], ['Porque el C es sp³', 'Because the C is sp³']], answer: 0, why: ['El π exige que los orbitales p estén paralelos; al girar 90° el solapamiento se anula. Esa barrera (≈ 260 kJ/mol) impide la rotación libre.', 'The π bond requires the p orbitals to be parallel; a 90° twist destroys the overlap. That barrier (≈ 260 kJ/mol) prevents free rotation.'] } },
      { t: ['El triple enlace', 'The triple bond'], sel: '#bondCanvas', go: function () { D.tab('simulador'); D.set('bondSelect', 'triple'); },
        x: ['En el etino cada carbono es sp: un σ y dos π perpendiculares entre sí. La molécula es lineal (180°) y el enlace es el más corto y fuerte de los tres.', 'In ethyne each carbon is sp: one σ and two π bonds perpendicular to each other. The molecule is linear (180°) and the bond is the shortest and strongest of the three.'] },
      { t: ['Benceno: π deslocalizado', 'Benzene: delocalized π'], sel: '#bondCanvas', go: function () { D.tab('simulador'); D.set('bondSelect', 'benzene'); },
        x: ['Los seis orbitales p del benceno se solapan en un anillo continuo: los seis electrones π no pertenecen a un enlace concreto. Por eso todos los enlaces C–C miden lo mismo.', 'The six p orbitals of benzene overlap in a continuous ring: the six π electrons do not belong to a particular bond. That is why all C–C bonds have the same length.'] },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#quizContainer', go: function () { D.tab('quiz'); }, x: ['Responde el mini-quiz y pulsa «Revisar respuestas».', 'Answer the mini-quiz and press «Check answers».'] }
    ]
  });
})();

/* Práctica: conteo de enlaces σ y π e hibridación. */
(function () {
  /* nombre, fórmula, σ, π, explicación del conteo */
  var M = [[['metano', 'methane'], 'CH₄', 4, 0, '4 C–H'], [['etano', 'ethane'], 'CH₃–CH₃', 7, 0, '6 C–H + 1 C–C'], [['eteno (etileno)', 'ethene (ethylene)'], 'CH₂=CH₂', 5, 1, '4 C–H + C=C (1σ + 1π)'],
    [['etino (acetileno)', 'ethyne (acetylene)'], 'HC≡CH', 3, 2, '2 C–H + C≡C (1σ + 2π)'], [['dióxido de carbono', 'carbon dioxide'], 'O=C=O', 2, 2, '2 C=O (2σ + 2π)'], [['cianuro de hidrógeno', 'hydrogen cyanide'], 'H–C≡N', 2, 2, 'C–H + C≡N (1σ + 2π)'],
    [['nitrógeno', 'nitrogen'], 'N≡N', 1, 2, 'N≡N (1σ + 2π)'], [['metanal (formaldehído)', 'methanal (formaldehyde)'], 'H₂C=O', 3, 1, '2 C–H + C=O (1σ + 1π)'], [['propino', 'propyne'], 'CH₃–C≡CH', 6, 2, '4 C–H + C–C + C≡C (1σ + 2π)'],
    [['acetonitrilo', 'acetonitrile'], 'CH₃–C≡N', 5, 2, '3 C–H + C–C + C≡N (1σ + 2π)'], [['1,3-butadieno', '1,3-butadiene'], 'CH₂=CH–CH=CH₂', 9, 2, '6 C–H + 3 C–C (σ) + 2π'], [['benceno', 'benzene'], 'C₆H₆', 12, 3, '6 C–H + 6 C–C (σ) + 3π'],
    [['ácido acético', 'acetic acid'], 'CH₃COOH', 7, 1, '3 C–H + C–C + C=O + C–O + O–H (σ) + 1π (C=O)'], [['propeno', 'propene'], 'CH₃–CH=CH₂', 8, 1, '6 C–H + 2 C–C (σ) + 1π']];
  /* especie, átomo, hibridación, ángulo aprox. */
  var HY = [['CH₄', 'C', 'sp³', '109,5°'], ['NH₃', 'N', 'sp³', '107°'], ['H₂O', 'O', 'sp³', '104,5°'], ['C₂H₄', 'C', 'sp²', '120°'], ['BF₃', 'B', 'sp²', '120°'], ['H₂C=O', 'C', 'sp²', '120°'],
    ['C₂H₂', 'C', 'sp', '180°'], ['CO₂', 'C', 'sp', '180°'], ['BeCl₂', 'Be', 'sp', '180°'], ['HCN', 'C', 'sp', '180°'], ['C₆H₆', 'C', 'sp²', '120°'], ['CH₃OH', 'C', 'sp³', '109,5°']];
  function ang(s, H) { return H.EN ? s.replace(',', '.') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Enlaces σ', 'σ bonds'], gen: function (H) {
        var m = H.pick(M);
        return { q: H.t('¿Cuántos enlaces σ tiene una molécula de ' + m[0][0] + ' (' + m[1] + ')?', 'How many σ bonds are in a molecule of ' + m[0][1] + ' (' + m[1] + ')?'), a: m[2], abs: 0, aText: String(m[2]),
          sol: m[4] + ' → ' + m[2] + ' σ, ' + m[3] + ' π. ' + H.t('Todo enlace simple es σ; un doble es 1σ + 1π y un triple es 1σ + 2π.', 'Every single bond is σ; a double bond is 1σ + 1π and a triple bond is 1σ + 2π.') };
      } },
      { name: ['Enlaces π', 'π bonds'], gen: function (H) {
        var m = H.pick(M);
        return { q: H.t('¿Cuántos enlaces π tiene una molécula de ' + m[0][0] + ' (' + m[1] + ')?', 'How many π bonds are in a molecule of ' + m[0][1] + ' (' + m[1] + ')?'), a: m[3], abs: 0, aText: String(m[3]),
          sol: m[4] + ' → ' + m[2] + ' σ, ' + m[3] + ' π.' };
      } },
      { name: ['Hibridación', 'Hybridization'], gen: function (H) {
        var x = H.pick(HY);
        return H.mc(H.t('¿Qué hibridación tiene el ' + x[1] + ' en ' + x[0] + '?', 'What is the hybridization of ' + x[1] + ' in ' + x[0] + '?'), x[2], ['sp', 'sp²', 'sp³', 'sp³d'],
          H.t('Cuenta los dominios electrónicos del ' + x[1] + ' (átomos enlazados + pares libres): 2 → sp, 3 → sp², 4 → sp³. Ángulo aproximado: ', 'Count the electron domains on ' + x[1] + ' (bonded atoms + lone pairs): 2 → sp, 3 → sp², 4 → sp³. Approximate angle: ') + ang(x[3], H) + '.');
      } }
    ]
  });
})();
