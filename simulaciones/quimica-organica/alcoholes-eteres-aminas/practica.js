/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["Con masas similares, ¿qué hierve a mayor temperatura?", "With similar masses, which boils highest?"], options: [["Butan-1-ol", "Butan-1-ol"], ["Butilamina", "Butylamine"], ["Éter dietílico", "Diethyl ether"]], answer: 0, why: ["El O–H forma puentes de H más fuertes que el N–H; el éter no tiene H donor.", "O–H forms stronger hydrogen bonds than N–H; the ether has no donor H."] } } });

/* Práctica: clasificación 1°/2°/3°, puntos de ebullición y basicidad. */
(function () {
  var D = { 1: ['Primario (1°)', 'Primary (1°)'], 2: ['Secundario (2°)', 'Secondary (2°)'], 3: ['Terciario (3°)', 'Tertiary (3°)'] };
  /* compuesto, tipo, clase, razón */
  var C = [['CH₃CH₂OH', 'al', 1], ['CH₃CH(OH)CH₃', 'al', 2], ['(CH₃)₃COH', 'al', 3], ['CH₃CH₂CH₂CH₂OH', 'al', 1], ['ciclohexanol', 'al', 2], ['(CH₃)₂C(OH)CH₂CH₃', 'al', 3],
    ['CH₃NH₂', 'am', 1], ['(CH₃)₂NH', 'am', 2], ['(CH₃)₃N', 'am', 3], ['C₆H₅NH₂ (anilina)', 'am', 1], ['(CH₃CH₂)₂NH', 'am', 2], ['(CH₃)₃CNH₂', 'am', 1]];
  function tr(s, H) { return H.EN ? s.replace('ciclohexanol', 'cyclohexanol').replace('(anilina)', '(aniline)') : s; }
  var BP = [['CH₃CH₂OH', 'CH₃OCH₃', ['Misma fórmula C₂H₆O: el alcohol forma enlaces de hidrógeno; el éter no tiene O–H.', 'Same formula C₂H₆O: the alcohol forms hydrogen bonds; the ether has no O–H.']],
    ['CH₃CH₂CH₂NH₂', '(CH₃)₃N', ['Misma fórmula C₃H₉N: la amina primaria tiene N–H; la terciaria no puede donar enlaces de hidrógeno.', 'Same formula C₃H₉N: the primary amine has N–H; the tertiary amine cannot donate hydrogen bonds.']],
    ['CH₃CH₂CH₂OH', 'CH₃CH₂CH₂NH₂', ['El O–H forma enlaces de hidrógeno más fuertes que el N–H (O es más electronegativo).', 'O–H forms stronger hydrogen bonds than N–H (O is more electronegative).']],
    ['HOCH₂CH₂OH', 'CH₃CH₂CH₂OH', ['Dos grupos OH por molécula: más enlaces de hidrógeno.', 'Two OH groups per molecule: more hydrogen bonds.']]];
  var BAS = [['CH₃NH₂', 'C₆H₅NH₂', ['En la anilina el par libre del N se deslocaliza en el anillo: está menos disponible.', 'In aniline the N lone pair is delocalized into the ring: it is less available.']],
    ['CH₃NH₂', 'NH₃', ['El grupo alquilo dona densidad electrónica al N y estabiliza el catión amonio.', 'The alkyl group donates electron density to N and stabilizes the ammonium cation.']],
    ['CH₃CH₂NH₂', 'CH₃CONH₂', ['En la amida el par libre del N está en resonancia con el C=O: casi no es básica.', 'In the amide the N lone pair is in resonance with C=O: it is barely basic.']],
    ['piperidina', 'piridina', ['El N de la piperidina es sp³; el de la piridina es sp² (más carácter s, retiene más su par).', 'Piperidine N is sp³; pyridine N is sp² (more s character, holds its pair more tightly).']]];
  function tb(s, H) { return H.EN ? s.replace('piperidina', 'piperidine').replace('piridina', 'pyridine') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Primario, secundario o terciario', 'Primary, secondary or tertiary'], gen: function (H) {
        var c = H.pick(C);
        return H.mc(H.t('¿Cómo se clasifica ' + (c[1] === 'al' ? 'el alcohol' : 'la amina') + ' <b>' + c[0] + '</b>?', 'How is the ' + (c[1] === 'al' ? 'alcohol' : 'amine') + ' <b>' + tr(c[0], H) + '</b> classified?'), D[c[2]], [D[1], D[2], D[3]],
          c[1] === 'al' ? H.t('En un alcohol se cuenta cuántos C están unidos al carbono que lleva el OH.', 'For an alcohol, count how many carbons are bonded to the carbon bearing the OH.') : H.t('En una amina se cuenta cuántos C están unidos directamente al N.', 'For an amine, count how many carbons are bonded directly to N.') + (c[0].indexOf('(CH₃)₃CNH₂') === 0 ? H.t(' Ojo: la terc-butilamina es una amina primaria (un solo C unido al N).', ' Note: tert-butylamine is a primary amine (only one C on N).') : ''));
      } },
      { name: ['Mayor punto de ebullición', 'Higher boiling point'], gen: function (H) {
        var b = H.pick(BP);
        return H.mc(H.t('¿Cuál tiene mayor punto de ebullición: ' + b[0] + ' o ' + b[1] + '?', 'Which has the higher boiling point: ' + b[0] + ' or ' + b[1] + '?'), b[0], [b[1]], b[2]);
      } },
      { name: ['¿Cuál es más básica?', 'Which is more basic?'], gen: function (H) {
        var b = H.pick(BAS);
        return H.mc(H.t('¿Cuál es la base más fuerte: ' + b[0] + ' o ' + b[1] + '?', 'Which is the stronger base: ' + tb(b[0], H) + ' or ' + tb(b[1], H) + '?'), tb(b[0], H), [tb(b[1], H)], b[2]);
      } }
    ]
  });
})();
