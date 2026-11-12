/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['En la estructura de Lewis del agua, ¿cuántos pares libres tiene el oxígeno?', 'In the Lewis structure of water, how many lone pairs does oxygen have?'], options: [['Ninguno', 'None'], ['Uno', 'One'], ['Dos', 'Two']], answer: 2, why: ['El O aporta 6 electrones de valencia: 2 van a los enlaces O–H y los 4 restantes forman dos pares libres.', 'O brings 6 valence electrons: 2 go into the O–H bonds and the remaining 4 form two lone pairs.'] },
  5: { q: ['En el ozono (O₃), los dos enlaces O–O…', 'In ozone (O₃), the two O–O bonds…'], options: [['tienen la misma longitud', 'have the same length'], ['son uno doble y uno simple, fijos', 'are one double and one single, fixed'], ['alternan rápidamente entre doble y simple', 'switch rapidly between double and single']], answer: 0, why: ['La molécula real es un híbrido de resonancia: ambos enlaces son iguales, intermedios entre simple y doble.', 'The real molecule is a resonance hybrid: both bonds are equal, between single and double.'] }
} });

/* Recorrido guiado · LewisLab. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['Símbolos de Lewis', 'Lewis symbols'], sel: '#lewisSymbol', go: function () { D.tab('atomos'); },
        x: ['El símbolo de Lewis muestra solo los electrones de valencia como puntos alrededor del símbolo del elemento. Elige distintos átomos y compara.', 'The Lewis symbol shows only the valence electrons as dots around the element symbol. Choose different atoms and compare.'] },
      { t: ['Predice: electrones de valencia', 'Predict: valence electrons'], sel: '#lewisSymbol', go: function () { D.tab('atomos'); },
        q: ['¿Cuántos electrones de valencia tiene el nitrógeno?', 'How many valence electrons does nitrogen have?'], x: ['Usa su grupo en la tabla periódica (grupo 15).', 'Use its group in the periodic table (group 15).'],
        ask: { options: ['5', '3', '7', '2'], answer: 0, why: ['N: 1s² 2s² 2p³ → 5 electrones en la capa de valencia (2s² 2p³). Por eso forma 3 enlaces y conserva un par libre, como en el NH₃.', 'N: 1s² 2s² 2p³ → 5 electrons in the valence shell (2s² 2p³). That is why it forms 3 bonds and keeps one lone pair, as in NH₃.'] } },
      { t: ['Estructura paso a paso', 'Step-by-step structure'], sel: '#steps', go: function () { D.tab('moleculas'); },
        x: ['Elige una molécula y avanza con «Siguiente»: contar electrones de valencia, armar el esqueleto, completar octetos y formar enlaces múltiples si faltan electrones.', 'Choose a molecule and step through with «Next»: count valence electrons, build the skeleton, complete octets and form multiple bonds if electrons are short.'] },
      { t: ['Cargas formales', 'Formal charges'], sel: '#fcToggle', go: function () { D.tab('moleculas'); },
        q: ['En O=C=O, ¿cuál es la carga formal del carbono?', 'In O=C=O, what is the formal charge on carbon?'], x: ['FC = electrones de valencia − electrones no enlazantes − ½ electrones enlazantes. Activa «Mostrar cargas formales».', 'FC = valence electrons − nonbonding electrons − ½ bonding electrons. Turn on «Show formal charges».'],
        ask: { options: ['0', '+1', '−1', '+2'], answer: 0, why: ['C: 4 − 0 − ½·8 = 0. La mejor estructura de Lewis minimiza las cargas formales.', 'C: 4 − 0 − ½·8 = 0. The best Lewis structure minimizes formal charges.'] } },
      { t: ['Resonancia', 'Resonance'], sel: '#resButtons', go: function () { D.tab('resonancia'); },
        q: ['En el ion nitrato (NO₃⁻), ¿cómo son las tres distancias N–O?', 'In the nitrate ion (NO₃⁻), how do the three N–O distances compare?'], x: ['Recorre las estructuras resonantes.', 'Go through the resonance structures.'],
        ask: { options: [['Iguales, intermedias entre simple y doble', 'Equal, between single and double'], ['Una corta y dos largas', 'One short and two long'], ['Cambian con el tiempo', 'They change over time'], ['Todas dobles', 'All double']], answer: 0, why: ['Ninguna estructura resonante existe por separado: el ion es un híbrido con el doble enlace deslocalizado, y los tres enlaces miden lo mismo (orden de enlace 4/3).', 'No single resonance structure exists on its own: the ion is a hybrid with the double bond delocalized, and all three bonds are equal (bond order 4/3).'] } },
      { t: ['Excepciones al octeto', 'Exceptions to the octet'], sel: '#exceptionGrid', go: function () { D.tab('excepciones'); },
        x: ['Octeto incompleto (BF₃), octeto expandido en el periodo 3 o más (SF₆, PCl₅) y moléculas con número impar de electrones (NO).', 'Incomplete octet (BF₃), expanded octet for period 3 and beyond (SF₆, PCl₅) and molecules with an odd number of electrons (NO).'] },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#quiz', go: function () { D.tab('desafio'); }, x: ['Responde los desafíos y pulsa «Revisar».', 'Answer the challenges and press «Check».'] }
    ]
  });
})();

/* Práctica: electrones de valencia totales, carga formal y excepciones al octeto. */
(function () {
  var V = { H: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, P: 5, S: 6, Cl: 7, Xe: 8 };
  /* especie, composición, carga */
  var S = [['H₂O', { H: 2, O: 1 }, 0], ['NH₃', { N: 1, H: 3 }, 0], ['CH₄', { C: 1, H: 4 }, 0], ['CO₂', { C: 1, O: 2 }, 0], ['HCN', { H: 1, C: 1, N: 1 }, 0], ['CH₂O', { C: 1, H: 2, O: 1 }, 0], ['O₃', { O: 3 }, 0], ['SO₂', { S: 1, O: 2 }, 0],
    ['C₂H₄', { C: 2, H: 4 }, 0], ['C₂H₂', { C: 2, H: 2 }, 0], ['NH₄⁺', { N: 1, H: 4 }, 1], ['H₃O⁺', { H: 3, O: 1 }, 1], ['OH⁻', { O: 1, H: 1 }, -1], ['CN⁻', { C: 1, N: 1 }, -1], ['NO₃⁻', { N: 1, O: 3 }, -1], ['NO₂⁻', { N: 1, O: 2 }, -1],
    ['CO₃²⁻', { C: 1, O: 3 }, -2], ['SO₄²⁻', { S: 1, O: 4 }, -2], ['PO₄³⁻', { P: 1, O: 4 }, -3], ['ClO₄⁻', { Cl: 1, O: 4 }, -1], ['BF₄⁻', { B: 1, F: 4 }, -1], ['PCl₅', { P: 1, Cl: 5 }, 0], ['SF₆', { S: 1, F: 6 }, 0], ['XeF₄', { Xe: 1, F: 4 }, 0]];
  /* carga formal: especie, átomo, CF, cálculo (V − no enlazantes − enlaces) */
  var FC = [['CO', ['el C', 'C'], -1, '4 − 2 − 3'], ['CO', ['el O', 'O'], 1, '6 − 2 − 3'], ['NH₄⁺', ['el N', 'N'], 1, '5 − 0 − 4'], ['H₃O⁺', ['el O', 'O'], 1, '6 − 2 − 3'], ['O₃', ['el O central', 'the central O'], 1, '6 − 2 − 3'],
    ['O₃', ['el O con enlace simple', 'the singly bonded O'], -1, '6 − 6 − 1'], ['NO₃⁻', ['el N', 'N'], 1, '5 − 0 − 4'], ['CN⁻', ['el C', 'C'], -1, '4 − 2 − 3'], ['CO₂', ['el C', 'C'], 0, '4 − 0 − 4'], ['OH⁻', ['el O', 'O'], -1, '6 − 6 − 1'], ['BF₄⁻', ['el B', 'B'], -1, '3 − 0 − 4']];
  var EX = [['BF₃', 0], ['BeCl₂', 0], ['PCl₅', 1], ['SF₆', 1], ['XeF₄', 1], ['NO', 2], ['ClO₂', 2], ['NO₂', 2]];
  var EXN = [['Octeto incompleto en el átomo central', 'Incomplete octet on the central atom'], ['Octeto expandido (más de 8 e⁻ en el central)', 'Expanded octet (more than 8 e⁻ on the central atom)'], ['Número impar de electrones (radical)', 'Odd number of electrons (radical)']];
  function sgn(q) { return q > 0 ? '+' + q : q < 0 ? '−' + (-q) : '0'; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Electrones de valencia totales', 'Total valence electrons'], gen: function (H) {
        var s = H.pick(S), parts = [], tot = 0;
        for (var k in s[1]) { tot += V[k] * s[1][k]; parts.push(s[1][k] + ' × ' + V[k] + ' (' + k + ')'); }
        tot -= s[2];
        return { q: H.t('¿Cuántos electrones de valencia hay que repartir en la estructura de Lewis de <b>' + s[0] + '</b>?', 'How many valence electrons must be placed in the Lewis structure of <b>' + s[0] + '</b>?'), a: tot, abs: 0, aText: String(tot),
          sol: parts.join(' + ') + (s[2] ? (s[2] < 0 ? ' + ' + (-s[2]) + H.t(' (carga negativa)', ' (negative charge)') : ' − ' + s[2] + H.t(' (carga positiva)', ' (positive charge)')) : '') + ' = ' + tot };
      } },
      { name: ['Carga formal', 'Formal charge'], gen: function (H) {
        var f = H.pick(FC);
        return { q: H.t('En la mejor estructura de Lewis de <b>' + f[0] + '</b>, ¿cuál es la carga formal de ' + f[1][0] + '?', 'In the best Lewis structure of <b>' + f[0] + '</b>, what is the formal charge on ' + f[1][1] + '?'), a: f[2], abs: 0, aText: sgn(f[2]),
          sol: H.t('CF = electrones de valencia − electrones no enlazantes − enlaces = ', 'FC = valence electrons − nonbonding electrons − bonds = ') + f[3] + ' = ' + sgn(f[2]) };
      } },
      { name: ['Excepciones a la regla del octeto', 'Exceptions to the octet rule'], gen: function (H) {
        return H.bank(EX, function (e) { return H.t('¿Qué excepción a la regla del octeto presenta <b>' + e[0] + '</b>?', 'Which exception to the octet rule does <b>' + e[0] + '</b> show?'); }, function (e) { return EXN[e[1]]; },
          function (e) { return e[1] === 0 ? H.t('El Be y el B quedan con 4 y 6 electrones a su alrededor.', 'Be and B end up with 4 and 6 electrons around them.') : e[1] === 1 ? H.t('Los elementos del periodo 3 o mayores pueden rodearse de 10 o 12 electrones.', 'Elements of period 3 and beyond can hold 10 or 12 electrons around them.') : H.t('El total de electrones de valencia es impar, así que un átomo queda con un electrón desapareado.', 'The total number of valence electrons is odd, so one atom keeps an unpaired electron.'); }, EXN);
      } }
    ]
  });
})();
