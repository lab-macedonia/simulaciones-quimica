/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 1: { q: ["¿De dónde obtiene el PSII los electrones que repone a la P680?", "Where does PSII get the electrons that replace those of P680?"], options: [["Del agua, liberando O₂", "From water, releasing O₂"], ["Del CO₂", "From CO₂"], ["Del NADPH", "From NADPH"], ["De la glucosa", "From glucose"]], answer: 0, why: ["La fotólisis del agua en el complejo que libera oxígeno: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻.", "Water splitting at the oxygen-evolving complex: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻."] } } });

/* Práctica: estequiometría del ciclo de Calvin y localización de las etapas. */
(function () {
  var LOC = [[['Fotólisis del agua', 'Water splitting (photolysis)'], ['Lumen del tilacoide (fotosistema II)', 'Thylakoid lumen (photosystem II)']], [['Ciclo de Calvin', 'Calvin cycle'], ['Estroma', 'Stroma']], [['Síntesis de ATP por la ATP sintasa', 'ATP synthesis by ATP synthase'], ['Membrana del tilacoide', 'Thylakoid membrane']],
    [['Reducción de NADP⁺ a NADPH', 'Reduction of NADP⁺ to NADPH'], ['Cara estromal de la membrana del tilacoide (fotosistema I)', 'Stromal side of the thylakoid membrane (photosystem I)']], [['Fijación de CO₂ por la rubisco', 'CO₂ fixation by rubisco'], ['Estroma', 'Stroma']]];
  var PER = { co2: [6, ['CO₂', 'CO₂']], atp: [18, ['ATP', 'ATP']], nadph: [12, ['NADPH', 'NADPH']], o2: [6, ['O₂ liberado', 'O₂ released']], h2o: [12, ['H₂O oxidada en la fotólisis', 'H₂O split in photolysis']] };
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Balance del ciclo de Calvin', 'Calvin cycle balance'], gen: function (H) {
        var k = H.pick(Object.keys(PER)), n = H.int(1, 6), v = PER[k][0] * n;
        return { q: H.t('¿Cuántas moléculas de ' + PER[k][1][0] + ' se necesitan (o se producen) para sintetizar <b>' + n + '</b> molécula(s) de glucosa?', 'How many molecules of ' + PER[k][1][1] + ' are needed (or produced) to make <b>' + n + '</b> glucose molecule(s)?'), a: v, abs: 0, aText: String(v),
          sol: H.t('Por glucosa: 6 CO₂, 18 ATP y 12 NADPH en el ciclo de Calvin; las reacciones luminosas oxidan 12 H₂O y liberan 6 O₂. ', 'Per glucose: 6 CO₂, 18 ATP and 12 NADPH in the Calvin cycle; the light reactions split 12 H₂O and release 6 O₂. ') + PER[k][0] + ' × ' + n + ' = ' + v + '.' };
      } },
      { name: ['¿Dónde ocurre?', 'Where does it happen?'], gen: function (H) {
        return H.bank(LOC, function (l) { return H.t('¿Dónde ocurre: <b>' + l[0][0] + '</b>?', 'Where does this happen: <b>' + l[0][1] + '</b>?'); }, function (l) { return l[1]; }, function (l) { return H.L(l[0]) + ' → ' + H.L(l[1]) + '.'; });
      } },
      { name: ['Origen del O₂', 'Origin of O₂'], gen: function (H) {
        return H.mc(H.t('En un experimento se usa agua marcada con ¹⁸O y CO₂ normal. ¿Dónde aparece el ¹⁸O?', 'In an experiment, water labeled with ¹⁸O and normal CO₂ are used. Where does the ¹⁸O show up?'), ['En el O₂ liberado', 'In the O₂ released'], [['En la glucosa', 'In the glucose'], ['En el CO₂', 'In the CO₂'], ['En el ATP', 'In the ATP']],
          H.t('El O₂ proviene de la fotólisis del agua en el fotosistema II, no del CO₂.', 'The O₂ comes from splitting water at photosystem II, not from CO₂.'));
      } }
    ]
  });
})();
