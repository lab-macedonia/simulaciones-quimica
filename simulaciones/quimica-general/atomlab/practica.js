/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  4: { q: ['¿Cuántos nodos radiales tiene el orbital 3s?', 'How many radial nodes does the 3s orbital have?'], options: [['0', '0'], ['1', '1'], ['2', '2']], answer: 2, why: ['Nodos radiales = n − ℓ − 1 = 3 − 0 − 1 = 2: dos esferas con |ψ|² = 0 y tres zonas de alta probabilidad.', 'Radial nodes = n − ℓ − 1 = 3 − 0 − 1 = 2: two spheres with |ψ|² = 0 and three high-probability regions.'] },
  8: { q: ['Si la carga positiva del átomo estuviera concentrada en un núcleo diminuto, al lanzar partículas α contra una lámina de oro…', 'If the atom’s positive charge were concentrated in a tiny nucleus, firing α particles at a gold foil…'], options: [['todas se desviarían un poco', 'all would be deflected slightly'], ['casi todas atravesarían y unas pocas rebotarían', 'almost all would pass through and a few would bounce back'], ['todas rebotarían', 'all would bounce back']], answer: 1, why: ['El átomo es casi vacío: solo las α que pasan muy cerca del núcleo se desvían mucho. Así lo observaron Geiger y Marsden.', 'The atom is mostly empty: only the α particles passing very close to the nucleus are strongly deflected. That is what Geiger and Marsden observed.'] }
} });

/* Recorrido guiado · AtomLab. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['Modelos atómicos en la historia', 'Atomic models through history'], sel: '#timeline', go: function () { D.tab('historia'); },
        x: ['Recorre la línea de tiempo de Dalton a Schrödinger. Cada modelo nació para explicar un experimento que el anterior no podía explicar. Observa el modelo 3D de cada etapa.', 'Go through the timeline from Dalton to Schrödinger. Each model arose to explain an experiment the previous one could not. Look at the 3D model for each stage.'] },
      { t: ['Predice', 'Predict'], sel: '#timeline', go: function () { D.tab('historia'); },
        x: ['Antes de ir a los experimentos, responde:', 'Before going to the experiments, answer:'],
        ask: { options: [['La dispersión de partículas α en una lámina de oro (Rutherford)', 'The scattering of α particles by gold foil (Rutherford)'], ['La gota de aceite de Millikan', 'Millikan\'s oil drop'], ['El espectro del hidrógeno', 'The hydrogen spectrum'], ['La difracción de electrones', 'Electron diffraction']], answer: 0,
          why: ['Algunas partículas α rebotaban casi hacia atrás: la carga positiva y casi toda la masa tenían que estar concentradas en un núcleo diminuto, no repartidas como en el modelo de Thomson.', 'Some α particles bounced almost straight back: the positive charge and nearly all the mass had to be concentrated in a tiny nucleus, not spread out as in Thomson\'s model.'] },
        q: ['¿Qué experimento obligó a abandonar el modelo de Thomson?', 'Which experiment forced the abandonment of Thomson\'s model?'] },
      { t: ['Experimento de Rutherford', 'Rutherford\'s experiment'], sel: '#expCanvas', go: function () { D.tab('experimentos'); D.set('expSelect', 'rutherford'); },
        x: ['Pulsa «Ejecutar». La mayoría de las partículas atraviesa la lámina sin desviarse (el átomo es casi vacío) y unas pocas se desvían mucho (núcleo denso y positivo).', 'Press «Run». Most particles go through the foil undeflected (the atom is mostly empty) and a few are strongly deflected (dense, positive nucleus).'] },
      { t: ['El espectro del hidrógeno', 'The hydrogen spectrum'], sel: '#expCanvas', go: function () { D.tab('experimentos'); D.set('expSelect', 'bohr'); },
        x: ['Ejecuta el espectro del H y observa sus líneas.', 'Run the H spectrum and look at its lines.'],
        ask: { options: [['Porque la energía del electrón está cuantizada en niveles', 'Because the electron\'s energy is quantized in levels'], ['Porque el hidrógeno es un gas', 'Because hydrogen is a gas'], ['Porque el prisma separa mal la luz', 'Because the prism separates light poorly'], ['Porque el núcleo emite luz', 'Because the nucleus emits light']], answer: 0,
          why: ['Cada línea corresponde a un salto entre dos niveles permitidos: ΔE = hν. Solo esas energías (y longitudes de onda) aparecen. Fue la base del modelo de Bohr.', 'Each line corresponds to a jump between two allowed levels: ΔE = hν. Only those energies (and wavelengths) appear. This was the basis of Bohr\'s model.'] },
        q: ['¿Por qué el espectro del hidrógeno tiene líneas y no un arcoíris continuo?', 'Why does the hydrogen spectrum show lines rather than a continuous rainbow?'] },
      { t: ['Orbitales: nube de probabilidad', 'Orbitals: probability cloud'], sel: '#orb3d', go: function () { D.tab('orbitales'); D.set('orbNodes', true); },
        x: ['En el modelo cuántico no hay órbitas: un orbital indica dónde es probable encontrar al electrón (|ψ|²). Activa «Nodos» y cambia de orbital para ver las superficies donde la probabilidad es cero.', 'In the quantum model there are no orbits: an orbital shows where the electron is likely to be found (|ψ|²). Turn on «Nodes» and change orbitals to see the surfaces where the probability is zero.'] },
      { t: ['Predice: nodos', 'Predict: nodes'], sel: '#orbInfo', go: function () { D.tab('orbitales'); },
        q: ['¿Cuántos nodos radiales tiene un orbital 3s?', 'How many radial nodes does a 3s orbital have?'], x: ['Usa n − ℓ − 1 y compruébalo en el visor y en la distribución radial.', 'Use n − ℓ − 1 and check it in the viewer and in the radial distribution.'],
        ask: { options: ['2', '1', '0', '3'], answer: 0, why: ['Nodos radiales = n − ℓ − 1 = 3 − 0 − 1 = 2. En la curva de distribución radial se ven como dos ceros entre tres máximos.', 'Radial nodes = n − ℓ − 1 = 3 − 0 − 1 = 2. In the radial distribution curve they appear as two zeros between three maxima.'] } },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#quiz', go: function () { D.tab('desafio'); },
        x: ['Responde el desafío y pulsa «Revisar». Puedes generar un informe con tus respuestas desde el botón «Aula».', 'Answer the challenge and press «Check». You can create a report with your answers from the «Class» button.'] }
    ]
  });
})();

/* Práctica: partículas subatómicas y nodos de orbitales. */
(function () {
  var E = [['H', 1, 1], ['He', 2, 4], ['Li', 3, 7], ['C', 6, 12], ['N', 7, 14], ['O', 8, 16], ['F', 9, 19], ['Na', 11, 23], ['Mg', 12, 24], ['Al', 13, 27], ['P', 15, 31], ['S', 16, 32], ['Cl', 17, 35], ['K', 19, 39], ['Ca', 20, 40], ['Fe', 26, 56], ['Cu', 29, 63], ['Zn', 30, 65], ['Br', 35, 79], ['Ag', 47, 107], ['I', 53, 127], ['U', 92, 238]];
  var ION = { Na: 1, K: 1, Li: 1, Mg: 2, Ca: 2, Al: 3, Fe: 3, Cu: 2, Zn: 2, Ag: 1, F: -1, Cl: -1, Br: -1, I: -1, O: -2, S: -2, N: -3, P: -3 };
  var LL = ['s', 'p', 'd', 'f'];
  function chg(q) { return q === 0 ? '' : (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−'); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Neutrones de un isótopo', 'Neutrons in an isotope'], gen: function (H) {
        var e = H.pick(E), A = e[2] + H.pick([0, 0, 1, 2]), n = A - e[1];
        return { q: H.t('¿Cuántos neutrones tiene un átomo de <sup>' + A + '</sup>' + e[0] + ' (Z = ' + e[1] + ')?', 'How many neutrons does an atom of <sup>' + A + '</sup>' + e[0] + ' (Z = ' + e[1] + ') have?'), a: n, abs: 0, aText: String(n), unit: '',
          sol: H.t('N = A − Z = ', 'N = A − Z = ') + A + ' − ' + e[1] + ' = ' + n };
      } },
      { name: ['Electrones de un ion', 'Electrons in an ion'], gen: function (H) {
        var e = H.pick(E.filter(function (x) { return ION[x[0]] != null; })), q = ION[e[0]], ne = e[1] - q;
        return { q: H.t('¿Cuántos electrones tiene el ion ' + e[0] + '<sup>' + chg(q) + '</sup> (Z = ' + e[1] + ')?', 'How many electrons does the ion ' + e[0] + '<sup>' + chg(q) + '</sup> (Z = ' + e[1] + ') have?'), a: ne, abs: 0, aText: String(ne),
          sol: H.t('Electrones = Z − carga = ', 'Electrons = Z − charge = ') + e[1] + ' − (' + (q > 0 ? '+' : '−') + Math.abs(q) + ') = ' + ne + H.t('. Un catión pierde electrones; un anión los gana. Los protones no cambian.', '. A cation loses electrons; an anion gains them. The protons do not change.') };
      } },
      { name: ['Nodos de un orbital', 'Nodes of an orbital'], gen: function (H) {
        var n = H.int(1, 5), l = H.int(0, Math.min(n - 1, 3)), kind = H.pick(['rad', 'ang', 'tot']), rad = n - l - 1, v = kind === 'rad' ? rad : kind === 'ang' ? l : n - 1;
        var what = { rad: ['nodos radiales', 'radial nodes'], ang: ['nodos angulares', 'angular nodes'], tot: ['nodos en total', 'nodes in total'] }[kind];
        return { q: H.t('¿Cuántos ' + what[0] + ' tiene un orbital ' + n + LL[l] + '?', 'How many ' + what[1] + ' does a ' + n + LL[l] + ' orbital have?'), a: v, abs: 0, aText: String(v),
          sol: H.t('Para ' + n + LL[l] + ': n = ' + n + ', l = ' + l + '. Nodos radiales = n − l − 1 = ' + rad + '; nodos angulares = l = ' + l + '; total = n − 1 = ' + (n - 1) + '.', 'For ' + n + LL[l] + ': n = ' + n + ', l = ' + l + '. Radial nodes = n − l − 1 = ' + rad + '; angular nodes = l = ' + l + '; total = n − 1 = ' + (n - 1) + '.') };
      } },
      { name: ['Experimento y modelo', 'Experiment and model'], gen: function (H) {
        var B = [[['Lámina de oro de Rutherford (Geiger–Marsden)', 'Rutherford gold foil (Geiger–Marsden)'], ['Núcleo pequeño, denso y positivo', 'A small, dense, positive nucleus']],
          [['Tubo de rayos catódicos de Thomson', 'Thomson cathode-ray tube'], ['Existencia del electrón y su razón carga/masa', 'Existence of the electron and its charge-to-mass ratio']],
          [['Gota de aceite de Millikan', 'Millikan oil drop'], ['La carga del electrón está cuantizada (e = 1,602 × 10⁻¹⁹ C)', 'The electron charge is quantized (e = 1.602 × 10⁻¹⁹ C)']],
          [['Espectro de líneas del hidrógeno', 'Hydrogen line spectrum'], ['Niveles de energía cuantizados (modelo de Bohr)', 'Quantized energy levels (Bohr model)']],
          [['Difracción de electrones de Davisson–Germer', 'Davisson–Germer electron diffraction'], ['Los electrones se comportan como ondas (de Broglie)', 'Electrons behave as waves (de Broglie)']]];
        return H.bank(B, function (b) { return H.t('¿Qué concluyó el experimento: <b>' + H.L(b[0]) + '</b>?', 'What did this experiment show: <b>' + H.L(b[0]) + '</b>?'); }, function (b) { return b[1]; }, function (b) { return H.L(b[0]) + ' → ' + H.L(b[1]) + '.'; });
      } }
    ]
  });
})();
