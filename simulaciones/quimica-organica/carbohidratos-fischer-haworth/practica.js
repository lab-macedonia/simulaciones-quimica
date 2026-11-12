/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['En la serie D, el anómero β tiene el OH anomérico en Haworth hacia…', 'In the D series, the β anomer has the anomeric OH in the Haworth projection pointing…'], options: [['abajo', 'down'], ['arriba', 'up'], ['dentro del plano del anillo', 'in the plane of the ring']], answer: 1, why: ['En β el OH anomérico queda del lado opuesto al O del carbono de referencia: hacia arriba; en α, hacia abajo.', 'In β the anomeric OH lies opposite to the O of the reference carbon: up; in α, down.'] }
} });

/* Práctica · Carbohidratos. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var NC = ['', '', '', 'tri', 'tetr', 'pent', 'hex', 'hept'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Estereocentros y estereoisómeros', 'Stereocenters and stereoisomers'], gen: function (H) {
        var n = H.int(3, 7), keto = n >= 4 && Math.random() < 0.4, sc = keto ? n - 3 : n - 2, ask = H.pick(['sc', 'iso']), v = ask === 'sc' ? sc : Math.pow(2, sc);
        var kind = (keto ? H.t('ceto', 'keto') : H.t('aldo', 'aldo')) + NC[n] + H.t('osa', 'ose');
        return { q: H.t('Una ' + kind + ' de cadena abierta (' + n + ' C). ' + (ask === 'sc' ? '¿Cuántos estereocentros tiene?' : '¿Cuántos estereoisómeros posibles tiene (2<sup>n</sup>)?'), 'An open-chain ' + kind + ' (' + n + ' C). ' + (ask === 'sc' ? 'How many stereocenters does it have?' : 'How many possible stereoisomers does it have (2<sup>n</sup>)?')), a: v, abs: 0, aText: String(v),
          sol: (keto ? H.t('En una cetosa el C1 (CH₂OH), el C2 (C=O) y el último C (CH₂OH) no son estereocentros: n = ' + n + ' − 3 = ' + sc, 'In a ketose C1 (CH₂OH), C2 (C=O) and the last C (CH₂OH) are not stereocenters: n = ' + n + ' − 3 = ' + sc) : H.t('En una aldosa el C1 (CHO) y el último C (CH₂OH) no son estereocentros: n = ' + n + ' − 2 = ' + sc, 'In an aldose C1 (CHO) and the last C (CH₂OH) are not stereocenters: n = ' + n + ' − 2 = ' + sc)) + '. 2<sup>' + sc + '</sup> = ' + Math.pow(2, sc) + H.t(' estereoisómeros (la mitad D y la mitad L).', ' stereoisomers (half D and half L).') };
      } },
      { name: ['Clasificar un azúcar', 'Classify a sugar'], gen: function (H) {
        var S = [['glucosa', 'glucose', ['Aldohexosa', 'Aldohexose']], ['fructosa', 'fructose', ['Cetohexosa', 'Ketohexose']], ['ribosa', 'ribose', ['Aldopentosa', 'Aldopentose']], ['galactosa', 'galactose', ['Aldohexosa', 'Aldohexose']],
          ['desoxirribosa (2-desoxi-D-ribosa)', 'deoxyribose (2-deoxy-D-ribose)', ['Aldopentosa', 'Aldopentose']], ['gliceraldehído', 'glyceraldehyde', ['Aldotriosa', 'Aldotriose']], ['dihidroxiacetona', 'dihydroxyacetone', ['Cetotriosa', 'Ketotriose']], ['ribulosa', 'ribulose', ['Cetopentosa', 'Ketopentose']], ['eritrosa', 'erythrose', ['Aldotetrosa', 'Aldotetrose']]];
        return H.bank(S, function (s) { return H.t('¿Cómo se clasifica la <b>' + s[0] + '</b>?', 'How is <b>' + s[1] + '</b> classified?'); }, function (s) { return s[2]; }, function (s) { return H.t('Aldo/ceto indica si el carbonilo es un aldehído (C1) o una cetona (C2); el sufijo indica el número de carbonos.', 'Aldo/keto tells whether the carbonyl is an aldehyde (C1) or a ketone (C2); the suffix gives the number of carbons.'); }, [['Cetohexosa', 'Ketohexose'], ['Aldohexosa', 'Aldohexose'], ['Aldopentosa', 'Aldopentose']]);
      } },
      { name: ['Fischer, Haworth y anómeros', 'Fischer, Haworth and anomers'], gen: function (H) {
        var Q = [[['En la proyección de Fischer, el OH del estereocentro más alejado del carbonilo está a la derecha. El azúcar es…', 'In the Fischer projection, the OH on the stereocenter farthest from the carbonyl points to the right. The sugar is…'], ['de la serie D', 'a D sugar'], [['de la serie L', 'an L sugar'], ['dextrógiro (+) necesariamente', 'necessarily dextrorotatory (+)']], ['D/L se define por ese último estereocentro y no indica el signo de la rotación óptica.', 'D/L is defined by that last stereocenter and says nothing about the sign of optical rotation.']],
          [['En la proyección de Haworth de la D-glucopiranosa, el OH anomérico (C1) está hacia arriba, del mismo lado que el C6 (CH₂OH). Es el anómero…', 'In the Haworth projection of D-glucopyranose, the anomeric OH (C1) points up, on the same side as C6 (CH₂OH). It is the … anomer'], ['β', 'β'], [['α', 'α'], ['L', 'L']], ['β: OH anomérico del mismo lado (cis) que el CH₂OH terminal; α: del lado opuesto.', 'β: anomeric OH on the same side (cis) as the terminal CH₂OH; α: on the opposite side.']],
          [['Cuando la glucosa se cicla atacando el OH del C5 al C1, el anillo que se forma es…', 'When glucose cyclizes by attack of the C5 OH on C1, the ring formed is…'], ['una piranosa (6 átomos: 5 C + O)', 'a pyranose (6 atoms: 5 C + O)'], [['una furanosa (5 átomos: 4 C + O)', 'a furanose (5 atoms: 4 C + O)'], ['un epóxido (3 átomos)', 'an epoxide (3 atoms)']], ['C1 a C5 más el O del anillo: seis miembros, como el pirano.', 'C1 to C5 plus the ring O: six members, like pyran.']],
          [['Cuando la fructosa se cicla atacando el OH del C5 al C2 (carbonilo), el anillo es…', 'When fructose cyclizes by attack of the C5 OH on C2 (carbonyl), the ring is…'], ['una furanosa (5 átomos: 4 C + O)', 'a furanose (5 atoms: 4 C + O)'], [['una piranosa (6 átomos: 5 C + O)', 'a pyranose (6 atoms: 5 C + O)'], ['un epóxido (3 átomos)', 'an epoxide (3 atoms)']], ['C2 a C5 más el O del anillo: cinco miembros, como el furano.', 'C2 to C5 plus the ring O: five members, like furan.']],
          [['En la silla de la β-D-glucopiranosa, ¿cómo quedan los sustituyentes OH y CH₂OH?', 'In the chair of β-D-glucopyranose, where are the OH and CH₂OH substituents?'], ['Todos ecuatoriales', 'All equatorial'], [['Todos axiales', 'All axial'], ['Alternados axial/ecuatorial', 'Alternating axial/equatorial']], ['Por eso la β-D-glucosa es la aldohexosa más estable y la más abundante en el equilibrio.', 'That is why β-D-glucose is the most stable aldohexose and the most abundant at equilibrium.']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
