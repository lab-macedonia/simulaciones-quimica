/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["¿Qué es más reactivo frente a un nucleófilo?", "Which is more reactive toward a nucleophile?"], options: [["Etanal", "Ethanal"], ["Propanona", "Propanone"], ["Son iguales", "They are equal"]], answer: 0, why: ["Los aldehídos tienen menos impedimento y un carbono más positivo (un solo grupo alquilo donador).", "Aldehydes are less hindered and have a more positive carbon (only one donating alkyl group)."] } } });

/* Práctica: productos de adición nucleófila al carbonilo y reactividad relativa. */
(function () {
  var R = [['CH₃CHO + NaBH₄, luego H₃O⁺', 'CH₃CHO + NaBH₄, then H₃O⁺', ['Alcohol primario (etanol)', 'Primary alcohol (ethanol)'], ['El hidruro se adiciona al C del carbonilo; el alcóxido se protona.', 'Hydride adds to the carbonyl carbon; the alkoxide is protonated.']],
    ['CH₃COCH₃ + NaBH₄, luego H₃O⁺', 'CH₃COCH₃ + NaBH₄, then H₃O⁺', ['Alcohol secundario (propan-2-ol)', 'Secondary alcohol (propan-2-ol)'], ['Una cetona reducida da un alcohol secundario.', 'A reduced ketone gives a secondary alcohol.']],
    ['CH₃CHO + HCN (CN⁻ catalítico)', 'CH₃CHO + HCN (catalytic CN⁻)', ['Cianohidrina', 'Cyanohydrin'], ['El CN⁻ ataca el carbonilo y el alcóxido toma H⁺ del HCN.', 'CN⁻ attacks the carbonyl and the alkoxide takes H⁺ from HCN.']],
    ['CH₃CHO + 1 CH₃OH (H⁺)', 'CH₃CHO + 1 CH₃OH (H⁺)', ['Hemiacetal', 'Hemiacetal'], ['Un equivalente de alcohol da el hemiacetal (C con OH y OR).', 'One equivalent of alcohol gives the hemiacetal (C with OH and OR).']],
    ['CH₃CHO + 2 CH₃OH (H⁺, se retira agua)', 'CH₃CHO + 2 CH₃OH (H⁺, water removed)', ['Acetal', 'Acetal'], ['El hemiacetal pierde agua (ion oxocarbenio) y suma un segundo alcohol.', 'The hemiacetal loses water (oxocarbenium ion) and adds a second alcohol.']],
    ['CH₃COCH₃ + CH₃NH₂ (pH ≈ 5)', 'CH₃COCH₃ + CH₃NH₂ (pH ≈ 5)', ['Imina', 'Imine'], ['Amina primaria + carbonilo → carbinolamina → pierde agua → C=N.', 'Primary amine + carbonyl → carbinolamine → loses water → C=N.']],
    ['CH₃CHO + H₂O', 'CH₃CHO + H₂O', ['Hidrato (diol geminal), en equilibrio', 'Hydrate (geminal diol), at equilibrium'], ['El agua se adiciona reversiblemente; el equilibrio depende de la electrofilia del carbonilo.', 'Water adds reversibly; the equilibrium depends on the carbonyl electrophilicity.']]];
  var ALL = R.map(function (r) { return r[2]; });
  var PAIR = [['HCHO', 'CH₃CHO', ['Sin grupos alquilo que donen densidad ni impedimento estérico.', 'No alkyl groups to donate density and no steric hindrance.']], ['CH₃CHO', 'CH₃COCH₃', ['Los aldehídos tienen un solo alquilo: carbonilo más positivo y menos impedido.', 'Aldehydes have only one alkyl group: a more positive and less hindered carbonyl.']],
    ['Cl₃CCHO', 'CH₃CHO', ['Los Cl atraen electrones y hacen el C=O más electrófilo (el cloral existe casi solo como hidrato).', 'The Cl atoms withdraw electrons and make the C=O more electrophilic (chloral exists almost entirely as the hydrate).']], ['CH₃COCH₃', 'C₆H₅COC₆H₅', ['Los anillos aromáticos estabilizan el C=O por resonancia y lo impiden estéricamente.', 'The aromatic rings stabilize the C=O by resonance and hinder it sterically.']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Producto de la adición', 'Addition product'], gen: function (H) {
        var r = H.pick(R);
        return H.mc(H.t('¿Qué se obtiene en <b>' + r[0] + '</b>?', 'What is obtained in <b>' + r[1] + '</b>?'), r[2], ALL, r[3]);
      } },
      { name: ['¿Cuál es más reactivo?', 'Which is more reactive?'], gen: function (H) {
        var p = H.pick(PAIR);
        return H.mc(H.t('¿Cuál reacciona más rápido con un nucleófilo: ' + p[0] + ' o ' + p[1] + '?', 'Which reacts faster with a nucleophile: ' + p[0] + ' or ' + p[1] + '?'), p[0], [p[1]], p[2]);
      } }
    ]
  });
})();
