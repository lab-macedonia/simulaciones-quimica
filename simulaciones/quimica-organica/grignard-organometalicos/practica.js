/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["Si hay agua en el matraz del reactivo de Grignard…", "If there is water in the Grignard flask…"], options: [["el reactivo se destruye y forma un alcano", "the reagent is destroyed, forming an alkane"], ["reacciona igual con la cetona", "it still reacts with the ketone"], ["se forma más alcohol", "more alcohol forms"]], answer: 0, why: ["RMgX es una base muy fuerte: el agua lo protona (R–H) antes de que alcance al carbonilo.", "RMgX is a very strong base: water protonates it (R–H) before it reaches the carbonyl."] } } });

/* Práctica: producto del reactivo de Grignard según el electrófilo y compatibilidad de grupos. */
(function () {
  var P = [['metanal (HCHO)', 'methanal (HCHO)', ['Alcohol primario', 'Primary alcohol'], 1, ['El formaldehído tiene dos H: el C carbinólico queda con R, H, H.', 'Formaldehyde has two H: the carbinol carbon ends up with R, H, H.']],
    ['un aldehído (R′CHO)', 'an aldehyde (R′CHO)', ['Alcohol secundario', 'Secondary alcohol'], 1, ['El C carbinólico queda con R, R′ y H.', 'The carbinol carbon ends up with R, R′ and H.']],
    ['una cetona (R′COR″)', 'a ketone (R′COR″)', ['Alcohol terciario', 'Tertiary alcohol'], 1, ['El C carbinólico queda con R, R′ y R″.', 'The carbinol carbon ends up with R, R′ and R″.']],
    ['un éster (R′COOR″)', 'an ester (R′COOR″)', ['Alcohol terciario con dos grupos R iguales', 'Tertiary alcohol with two identical R groups'], 2, ['La primera adición expulsa R″O⁻ y da una cetona, que reacciona con un segundo equivalente.', 'The first addition expels R″O⁻ and gives a ketone, which reacts with a second equivalent.']],
    ['CO₂ (hielo seco)', 'CO₂ (dry ice)', ['Ácido carboxílico (R–COOH)', 'Carboxylic acid (R–COOH)'], 1, ['El carbanión ataca al CO₂ y forma un carboxilato; el ácido lo protona.', 'The carbanion attacks CO₂ to form a carboxylate; acid protonates it.']],
    ['óxido de etileno (epóxido)', 'ethylene oxide (epoxide)', ['Alcohol primario con dos C más (R–CH₂CH₂OH)', 'Primary alcohol two carbons longer (R–CH₂CH₂OH)'], 1, ['El nucleófilo abre el anillo tensionado por el C menos impedido.', 'The nucleophile opens the strained ring at the less hindered carbon.']],
    ['agua (H₂O)', 'water (H₂O)', ['Alcano R–H (el reactivo se destruye)', 'Alkane R–H (the reagent is destroyed)'], 1, ['El Grignard es una base muy fuerte: toma el H⁺ del agua.', 'The Grignard reagent is a very strong base: it takes H⁺ from water.']]];
  var ALL = P.map(function (p) { return p[2]; });
  var INC = [['–OH', 1], ['–COOH', 1], ['–NH₂', 1], ['–C≡C–H (terminal)', 1], ['–SH', 1], ['–O–CH₃ (éter)', 0], ['–CH₃', 0], ['–Cl en un anillo aromático', 0]];
  var Y = ['Sí: destruye el reactivo', 'Yes: it destroys the reagent'], N = ['No: es compatible', 'No: it is compatible'];
  function tr(s, H) { return H.EN ? s.replace('(éter)', '(ether)').replace('en un anillo aromático', 'on an aromatic ring') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Producto de la adición', 'Addition product'], gen: function (H) {
        var p = H.pick(P);
        return H.mc(H.t('Un reactivo de Grignard (RMgBr) reacciona con <b>' + p[0] + '</b> y luego se trata con H₃O⁺. ¿Qué se obtiene?', 'A Grignard reagent (RMgBr) reacts with <b>' + p[1] + '</b> and is then treated with H₃O⁺. What is obtained?'), p[2], ALL, H.L(p[4]));
      } },
      { name: ['Equivalentes de Grignard', 'Equivalents of Grignard reagent'], gen: function (H) {
        var p = H.pick(P.slice(0, 5));
        return { q: H.t('¿Cuántos equivalentes de RMgBr se consumen por cada mol de <b>' + p[0] + '</b>?', 'How many equivalents of RMgBr are consumed per mole of <b>' + p[1] + '</b>?'), a: p[3], abs: 0, aText: String(p[3]), sol: H.L(p[4]) };
      } },
      { name: ['¿Grupo incompatible?', 'Incompatible group?'], gen: function (H) {
        var g = H.pick(INC);
        return H.mc(H.t('¿Impide preparar o usar un reactivo de Grignard la presencia de un grupo <b>' + g[0] + '</b> en la misma molécula?', 'Does a <b>' + tr(g[0], H) + '</b> group in the same molecule prevent making or using a Grignard reagent?'), g[1] ? Y : N, [Y, N],
          g[1] ? H.t('Tiene un H ácido (O–H, N–H, S–H o ≡C–H): el carbanión lo arranca y se convierte en alcano.', 'It has an acidic H (O–H, N–H, S–H or ≡C–H): the carbanion removes it and becomes an alkane.') : H.t('No tiene H ácidos ni un carbonilo: el éter incluso es el disolvente habitual.', 'It has no acidic H and no carbonyl: ethers are even the usual solvent.'));
      } }
    ]
  });
})();
