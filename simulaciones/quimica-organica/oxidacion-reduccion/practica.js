/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["Un alcohol terciario tratado con reactivo de Jones…", "A tertiary alcohol treated with Jones reagent…"], options: [["no se oxida", "is not oxidized"], ["da una cetona", "gives a ketone"], ["da un ácido", "gives an acid"]], answer: 0, why: ["No tiene H en el carbono que lleva el OH, que es el que se pierde al oxidar.", "It has no H on the carbinol carbon, which is what is lost on oxidation."] } } });

/* Práctica: estado de oxidación del carbono y productos de oxidantes y reductores. */
(function () {
  /* especie, carbono indicado, EO, cálculo */
  var EO = [['CH₄', '', -4, '4 C–H → −4'], ['CH₃OH', '', -2, '3 C–H (−3) + 1 C–O (+1) = −2'], ['HCHO', '', 0, '2 C–H (−2) + C=O (+2) = 0'], ['HCOOH', '', 2, '1 C–H (−1) + 3 enlaces a O (+3) = +2'], ['CO₂', '', 4, '4 enlaces a O → +4'],
    ['CH₃CH₂OH', ['(C del OH)', '(C bearing OH)'], -1, '2 C–H (−2) + C–O (+1) + C–C (0) = −1'], ['CH₃CHO', ['(C del CHO)', '(CHO carbon)'], 1, '1 C–H (−1) + C=O (+2) + C–C (0) = +1'], ['CH₃COOH', ['(C del COOH)', '(COOH carbon)'], 3, '3 enlaces a O (+3) + C–C (0) = +3'], ['CH₃COCH₃', ['(C del C=O)', '(C=O carbon)'], 2, 'C=O (+2) + 2 C–C (0) = +2'], ['CH₃CH₃', ['(cualquier C)', '(either C)'], -3, '3 C–H (−3) + C–C (0) = −3']];
  function sg(v) { return v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0'; }
  var RX = [['alcohol primario + PCC (CH₂Cl₂)', 'primary alcohol + PCC (CH₂Cl₂)', ['Aldehído', 'Aldehyde'], ['El PCC en medio anhidro se detiene en el aldehído.', 'PCC in anhydrous medium stops at the aldehyde.']],
    ['alcohol primario + reactivo de Jones (CrO₃, H₂SO₄, acuoso)', 'primary alcohol + Jones reagent (CrO₃, H₂SO₄, aqueous)', ['Ácido carboxílico', 'Carboxylic acid'], ['En agua el aldehído se hidrata y vuelve a oxidarse hasta ácido.', 'In water the aldehyde is hydrated and oxidized again to the acid.']],
    ['alcohol secundario + reactivo de Jones', 'secondary alcohol + Jones reagent', ['Cetona', 'Ketone'], ['Solo hay un H en el C carbinólico: la oxidación se detiene en la cetona.', 'There is only one H on the carbinol carbon: oxidation stops at the ketone.']],
    ['alcohol terciario + reactivo de Jones', 'tertiary alcohol + Jones reagent', ['No reacciona', 'No reaction'], ['No hay H en el C carbinólico que pueda eliminarse.', 'There is no H on the carbinol carbon to remove.']],
    ['aldehído + NaBH₄', 'aldehyde + NaBH₄', ['Alcohol primario', 'Primary alcohol'], ['El hidruro reduce aldehídos y cetonas.', 'Hydride reduces aldehydes and ketones.']],
    ['éster + NaBH₄ (etanol, 25 °C)', 'ester + NaBH₄ (ethanol, 25 °C)', ['No reacciona', 'No reaction'], ['El NaBH₄ es un reductor suave: no reduce ésteres en condiciones normales.', 'NaBH₄ is a mild reductant: it does not reduce esters under normal conditions.']],
    ['éster + LiAlH₄, luego H₃O⁺', 'ester + LiAlH₄, then H₃O⁺', ['Dos alcoholes (uno primario del lado acilo)', 'Two alcohols (a primary one from the acyl side)'], ['El LiAlH₄ es más fuerte: reduce ésteres y ácidos a alcoholes primarios.', 'LiAlH₄ is stronger: it reduces esters and acids to primary alcohols.']]];
  var ALL = RX.map(function (r) { return r[2]; });
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Estado de oxidación del carbono', 'Oxidation state of carbon'], gen: function (H) {
        var e = H.pick(EO);
        return { q: H.t('¿Cuál es el estado de oxidación del carbono ' + (e[1] ? e[1][0] + ' ' : '') + 'en <b>' + e[0] + '</b>?', 'What is the oxidation state of the carbon ' + (e[1] ? e[1][1] + ' ' : '') + 'in <b>' + e[0] + '</b>?'), a: e[2], abs: 0, aText: sg(e[2]),
          sol: H.t('Cada enlace a H cuenta −1, cada enlace a O (u otro átomo más electronegativo) +1, y los enlaces C–C 0: ', 'Each bond to H counts −1, each bond to O (or another more electronegative atom) +1, and C–C bonds 0: ') + (H.EN ? e[3].replace(/enlaces a O/g, 'bonds to O') : e[3]) };
      } },
      { name: ['Producto de oxidación o reducción', 'Oxidation or reduction product'], gen: function (H) {
        var r = H.pick(RX);
        return H.mc(H.t('¿Qué se obtiene de <b>' + r[0] + '</b>?', 'What is obtained from <b>' + r[1] + '</b>?'), r[2], ALL, r[3]);
      } }
    ]
  });
})();
