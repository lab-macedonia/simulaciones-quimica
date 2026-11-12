/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['A lo largo de un período, de izquierda a derecha, el radio atómico…', 'Across a period, from left to right, the atomic radius…'], options: [['aumenta', 'increases'], ['no cambia', 'does not change'], ['disminuye', 'decreases']], answer: 2, why: ['Aumenta la carga nuclear efectiva y los electrones siguen en el mismo nivel: el núcleo los atrae más y el átomo se contrae.', 'Effective nuclear charge rises while electrons stay in the same shell: the nucleus pulls them in and the atom shrinks.'] },
  4: { q: ['En el gráfico de energía de ionización frente a Z, los picos corresponden a…', 'In the plot of ionization energy against Z, the peaks are the…'], options: [['los gases nobles', 'noble gases'], ['los metales alcalinos', 'alkali metals'], ['los halógenos', 'halogens']], answer: 0, why: ['Los gases nobles tienen la capa completa y es muy difícil arrancarles un electrón; justo después, los alcalinos marcan los mínimos.', 'Noble gases have a full shell and lose an electron with great difficulty; right after them, the alkali metals mark the minima.'] }
} });

/* Recorrido guiado · Propiedades periódicas. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['La tabla como mapa de colores', 'The table as a color map'], sel: '#periodicTable', go: function () { D.tab('explorar'); },
        x: ['Elige una propiedad en el selector: la tabla se colorea según su valor y las flechas indican hacia dónde aumenta. Pulsa un elemento para ver sus datos.', 'Choose a property in the selector: the table is colored by its value and the arrows show the direction in which it increases. Click an element to see its data.'] },
      { t: ['Predice: radio atómico', 'Predict: atomic radius'], sel: '#periodicTable', go: function () { D.tab('explorar'); },
        q: ['¿Cómo cambia el radio atómico al avanzar de izquierda a derecha en un periodo?', 'How does the atomic radius change going from left to right across a period?'], x: ['Luego elige «radio atómico» y compruébalo.', 'Then choose «atomic radius» and check it.'],
        ask: { options: [['Disminuye', 'It decreases'], ['Aumenta', 'It increases'], ['No cambia', 'It does not change'], ['Aumenta y luego disminuye', 'It increases and then decreases']], answer: 0, why: ['A lo largo del periodo aumenta la carga nuclear efectiva y los electrones se agregan al mismo nivel: el núcleo los atrae más y el átomo se contrae.', 'Across the period the effective nuclear charge increases while electrons are added to the same shell: the nucleus pulls them more strongly and the atom shrinks.'] } },
      { t: ['Predice: energía de ionización', 'Predict: ionization energy'], sel: '#periodicTable', go: function () { D.tab('explorar'); },
        q: ['¿Qué elemento tiene la mayor primera energía de ionización?', 'Which element has the highest first ionization energy?'], x: ['Piensa en tamaño y en capas llenas.', 'Think about size and filled shells.'],
        ask: { options: ['He', 'F', 'Cs', 'H'], answer: 0, why: ['El helio es muy pequeño y tiene la capa 1s completa: arrancarle un electrón cuesta 2372 kJ/mol, el máximo de la tabla.', 'Helium is very small and has a complete 1s shell: removing an electron costs 2372 kJ/mol, the highest in the table.'] } },
      { t: ['Compara dos elementos', 'Compare two elements'], sel: '#compareButton', go: function () { D.tab('comparar'); },
        x: ['Elige dos elementos y una propiedad, y pulsa «Comparar». La explicación relaciona la diferencia con la carga nuclear efectiva y el nivel de los electrones de valencia.', 'Choose two elements and a property and press «Compare». The explanation relates the difference to the effective nuclear charge and the shell of the valence electrons.'] },
      { t: ['La periodicidad en un gráfico', 'Periodicity in a graph'], sel: '#drawChart', go: function () { D.tab('graficar'); },
        x: ['Grafica una propiedad frente a Z. En la energía de ionización verás picos en los gases nobles y caídas bruscas en los alcalinos: el patrón se repite en cada periodo.', 'Plot a property against Z. For ionization energy you will see peaks at the noble gases and sharp drops at the alkali metals: the pattern repeats every period.'] },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#challengePrompt', go: function () { D.tab('desafio'); }, x: ['Responde preguntas del desafío; cada una es nueva.', 'Answer challenge questions; each one is new.'] }
    ]
  });
})();

/* Práctica: comparar dos elementos del mismo grupo o periodo (grupos principales). Se omiten los pares con excepciones conocidas. */
(function () {
  /* símbolo, periodo, grupo, electronegatividad de Pauling */
  var E = [['Li', 2, 1, 0.98], ['Be', 2, 2, 1.57], ['B', 2, 13, 2.04], ['C', 2, 14, 2.55], ['N', 2, 15, 3.04], ['O', 2, 16, 3.44], ['F', 2, 17, 3.98],
    ['Na', 3, 1, 0.93], ['Mg', 3, 2, 1.31], ['Al', 3, 13, 1.61], ['Si', 3, 14, 1.90], ['P', 3, 15, 2.19], ['S', 3, 16, 2.58], ['Cl', 3, 17, 3.16],
    ['K', 4, 1, 0.82], ['Ca', 4, 2, 1.00], ['Ga', 4, 13, 1.81], ['Ge', 4, 14, 2.01], ['As', 4, 15, 2.18], ['Se', 4, 16, 2.55], ['Br', 4, 17, 2.96],
    ['Rb', 5, 1, 0.82], ['Sr', 5, 2, 0.95], ['Sb', 5, 15, 2.05], ['Te', 5, 16, 2.10], ['I', 5, 17, 2.66]];
  var PROP = {
    r: [['mayor radio atómico', 'the larger atomic radius'], ['radio atómico', 'atomic radius']],
    ie: [['mayor primera energía de ionización', 'the higher first ionization energy'], ['energía de ionización', 'ionization energy']],
    en: [['mayor electronegatividad', 'the higher electronegativity'], ['electronegatividad', 'electronegativity']]
  };
  function pair(H, prop) {
    for (var k = 0; k < 200; k++) {
      var a = H.pick(E), b = H.pick(E); if (a === b) continue;
      var sameG = a[2] === b[2], sameP = a[1] === b[1]; if (!sameG && !sameP) continue;
      if (prop === 'ie' && sameP && ((a[2] === 2 && b[2] === 13) || (a[2] === 13 && b[2] === 2) || (a[2] === 15 && b[2] === 16) || (a[2] === 16 && b[2] === 15))) continue;   /* Be>B, N>O… */
      if (sameG && (a[2] === 13 || a[2] === 14)) continue;   /* Ga más pequeño que Al, Ge > Si en EN… */
      if (prop === 'en' && a[3] === b[3]) continue;
      return [a, b, sameG];
    }
  }
  function winner(a, b, sameG, prop) {
    if (prop === 'en') return a[3] > b[3] ? a : b;
    if (prop === 'r') return sameG ? (a[1] > b[1] ? a : b) : (a[2] < b[2] ? a : b);
    return sameG ? (a[1] < b[1] ? a : b) : (a[2] > b[2] ? a : b);
  }
  function why(sameG, prop, H) {
    if (prop === 'r') return sameG ? H.t('Al bajar en un grupo se agregan capas: el radio aumenta.', 'Going down a group adds shells: the radius increases.') : H.t('A lo largo de un periodo aumenta la carga nuclear efectiva con la misma capa: el radio disminuye hacia la derecha.', 'Across a period the effective nuclear charge rises with the same shell: the radius decreases to the right.');
    return sameG ? H.t('Al bajar en un grupo los electrones externos están más lejos y más apantallados: la ' + (prop === 'ie' ? 'energía de ionización' : 'electronegatividad') + ' disminuye.', 'Going down a group the outer electrons are farther away and more shielded: ' + (prop === 'ie' ? 'ionization energy' : 'electronegativity') + ' decreases.')
      : H.t('A lo largo de un periodo aumenta la carga nuclear efectiva: la ' + (prop === 'ie' ? 'energía de ionización' : 'electronegatividad') + ' aumenta hacia la derecha.', 'Across a period the effective nuclear charge increases: ' + (prop === 'ie' ? 'ionization energy' : 'electronegativity') + ' increases to the right.');
  }
  function gen(prop) {
    return function (H) {
      var p = pair(H, prop), a = p[0], b = p[1], w = winner(a, b, p[2], prop), l = w === a ? b : a;
      return H.mc(H.t('¿Cuál tiene ' + PROP[prop][0][0] + ': ' + a[0] + ' o ' + b[0] + '?', 'Which has ' + PROP[prop][0][1] + ': ' + a[0] + ' or ' + b[0] + '?'), w[0], [l[0]],
        a[0] + H.t(' (periodo ', ' (period ') + a[1] + H.t(', grupo ', ', group ') + a[2] + '), ' + b[0] + H.t(' (periodo ', ' (period ') + b[1] + H.t(', grupo ', ', group ') + b[2] + '). ' + why(p[2], prop, H) + (prop === 'en' ? ' (' + a[0] + ' ' + H.fmt(a[3], 2) + '; ' + b[0] + ' ' + H.fmt(b[3], 2) + ')' : ''));
    };
  }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Radio atómico', 'Atomic radius'], gen: gen('r') },
      { name: ['Energía de ionización', 'Ionization energy'], gen: gen('ie') },
      { name: ['Electronegatividad', 'Electronegativity'], gen: gen('en') }
    ]
  });
})();
