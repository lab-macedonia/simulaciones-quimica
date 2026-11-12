/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["Si intercambias dos sustituyentes de un centro R, obtienes…", "If you swap two substituents on an R center, you get…"], options: [["el centro S", "the S center"], ["el mismo centro R", "the same R center"], ["un compuesto aquiral", "an achiral compound"]], answer: 0, why: ["Un intercambio invierte la configuración; dos intercambios la devuelven.", "One swap inverts the configuration; two swaps restore it."] } } });

/* Práctica: prioridades CIP, asignación R/S generada al azar y número de estereoisómeros. */
(function () {
  /* molécula y sus cuatro grupos en orden de prioridad CIP (1 > 2 > 3 > 4) */
  var SETS = [[['ácido láctico', 'lactic acid'], ['–OH', '–COOH', '–CH₃', '–H']], [['alanina', 'alanine'], ['–NH₂', '–COOH', '–CH₃', '–H']], [['butan-2-ol', 'butan-2-ol'], ['–OH', '–CH₂CH₃', '–CH₃', '–H']],
    [['bromoclorofluorometano', 'bromochlorofluoromethane'], ['–Br', '–Cl', '–F', '–H']], [['2-clorobutano', '2-chlorobutane'], ['–Cl', '–CH₂CH₃', '–CH₃', '–H']], [['gliceraldehído', 'glyceraldehyde'], ['–OH', '–CHO', '–CH₂OH', '–H']],
    [['1-bromoetanol', '1-bromoethanol'], ['–Br', '–OH', '–CH₃', '–H']], [['3-metilhex-1-eno', '3-methylhex-1-ene'], ['–CH=CH₂', '–CH₂CH₂CH₃', '–CH₃', '–H']]];
  var PAIRS = [['–CH₂OH', '–CH(CH₃)₂', ['(O,H,H) gana a (C,C,H): se compara el primer punto de diferencia, O > C.', '(O,H,H) beats (C,C,H): compare at the first point of difference, O > C.']], ['–CHO', '–CH₂OH', ['El C=O se cuenta como (O,O,H) frente a (O,H,H).', 'C=O counts as (O,O,H) versus (O,H,H).']],
    ['–COOH', '–CHO', ['(O,O,O) frente a (O,O,H).', '(O,O,O) versus (O,O,H).']], ['–CH=CH₂', '–CH(CH₃)₂', ['Empatan en (C,C,H); en la siguiente esfera el vinilo tiene (C,H,H) frente a (H,H,H).', 'They tie at (C,C,H); at the next sphere vinyl has (C,H,H) versus (H,H,H).']],
    ['–SH', '–OH', ['Número atómico del primer átomo: S (16) > O (8).', 'Atomic number of the first atom: S (16) > O (8).']], ['–Cl', '–SH', ['Cl (17) > S (16).', 'Cl (17) > S (16).']], ['–CH₂Br', '–CH₂OH', ['(Br,H,H) frente a (O,H,H): Br > O.', '(Br,H,H) versus (O,H,H): Br > O.']],
    ['–CH(CH₃)₂', '–CH₂CH₂CH₃', ['(C,C,H) frente a (C,H,H).', '(C,C,H) versus (C,H,H).']], ['–C₆H₅', '–CH(CH₃)₂', ['El fenilo cuenta (C,C,C) por los enlaces dobles duplicados, frente a (C,C,H).', 'Phenyl counts as (C,C,C) because of duplicated double bonds, versus (C,C,H).']], ['–NH₂', '–CH₃', ['N (7) > C (6).', 'N (7) > C (6).']]];
  var R = ['R', 'R'], S = ['S', 'S'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Asignar R o S', 'Assign R or S'], gen: function (H) {
        var s = H.pick(SETS), g = s[1], front = Math.random() < 0.35, ring = H.shuffle([0, 1, 2]);   /* orden horario de los tres grupos de mayor prioridad */
        var k = ring.indexOf(0), cw = ring[(k + 1) % 3] === 1;   /* ¿1 → 2 → 3 en sentido horario? */
        var conf = (cw !== front) ? 'R' : 'S';
        return H.mc(H.t('En el estereocentro del <b>' + s[0][0] + '</b>, el grupo <b>' + g[3] + '</b> apunta ' + (front ? 'hacia el observador' : 'hacia atrás') + '. Los otros tres, recorridos en sentido horario, son: ' + ring.map(function (i) { return g[i]; }).join(' → ') + '. ¿Cuál es la configuración?',
          'At the stereocenter of <b>' + s[0][1] + '</b>, the <b>' + g[3] + '</b> group points ' + (front ? 'toward the viewer' : 'away from the viewer') + '. The other three, going clockwise, are: ' + ring.map(function (i) { return g[i]; }).join(' → ') + '. What is the configuration?'), conf === 'R' ? R : S, [R, S],
          H.t('Prioridades: ', 'Priorities: ') + g.map(function (x, i) { return (i + 1) + ' ' + x; }).join(', ') + '. ' + H.t('El recorrido 1 → 2 → 3 es ', 'The path 1 → 2 → 3 is ') + (cw ? H.t('horario', 'clockwise') : H.t('antihorario', 'counterclockwise')) + (front ? H.t(', pero el grupo 4 apunta hacia ti: se invierte la lectura → ', ', but group 4 points toward you: reverse the reading → ') : ' → ') + conf + '.');
      } },
      { name: ['Prioridad CIP', 'CIP priority'], gen: function (H) {
        var p = H.pick(PAIRS), two = H.shuffle([p[0], p[1]]);
        return H.mc(H.t('¿Qué grupo tiene mayor prioridad CIP: ' + two[0] + ' o ' + two[1] + '?', 'Which group has the higher CIP priority: ' + two[0] + ' or ' + two[1] + '?'), p[0], [p[1]], p[2]);
      } },
      { name: ['Número de estereoisómeros', 'Number of stereoisomers'], gen: function (H) {
        var n = H.int(1, 5), v = Math.pow(2, n);
        return { q: H.t('Una molécula sin simetría interna tiene <b>' + n + '</b> estereocentro(s). ¿Cuántos estereoisómeros puede tener como máximo?', 'A molecule with no internal symmetry has <b>' + n + '</b> stereocenter(s). What is the maximum number of stereoisomers?'), a: v, abs: 0, aText: String(v),
          sol: '2<sup>' + n + '</sup> = ' + v + H.t('. Si la molécula tuviera simetría interna, algunos serían compuestos meso y el número sería menor.', '. If the molecule had internal symmetry, some would be meso compounds and the number would be smaller.') };
      } }
    ]
  });
})();
