/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Entre etanol, éter dimetílico, etanal y propanona, ¿cuál forma puentes de hidrógeno entre sus propias moléculas?', 'Among ethanol, dimethyl ether, ethanal and propanone, which forms hydrogen bonds between its own molecules?'], options: [['Éter dimetílico', 'Dimethyl ether'], ['Etanol', 'Ethanol'], ['Propanona', 'Propanone']], answer: 1, why: ['Solo el alcohol tiene un H unido a O (–OH); éteres, aldehídos y cetonas aceptan puentes de H pero no los donan entre sí. Por eso el etanol hierve mucho más alto.', 'Only the alcohol has an H bonded to O (–OH); ethers, aldehydes and ketones accept hydrogen bonds but cannot donate them to each other. That is why ethanol boils much higher.'] },
  4: { q: ['Un –OH unido directamente a un anillo de benceno forma un…', 'An –OH bonded directly to a benzene ring makes a…'], options: [['alcohol', 'alcohol'], ['éter', 'ether'], ['fenol', 'phenol']], answer: 2, why: ['El OH sobre un carbono aromático es un fenol, más ácido que un alcohol porque el anillo deslocaliza la carga del fenóxido.', 'An OH on an aromatic carbon is a phenol, more acidic than an alcohol because the ring delocalizes the phenoxide charge.'] }
} });

/* Práctica · Grupos funcionales. Un solo archivo para ES y EN (ver kit/aula.js). Mismos 15 grupos de la simulación. */
(function () {
  var G = { alc: ['Alcohol', 'Alcohol'], ete: ['Éter', 'Ether'], ald: ['Aldehído', 'Aldehyde'], cet: ['Cetona', 'Ketone'], aci: ['Ácido carboxílico', 'Carboxylic acid'], est: ['Éster', 'Ester'], ami: ['Amida', 'Amide'], amn: ['Amina', 'Amine'],
    nit: ['Nitrilo', 'Nitrile'], no2: ['Nitro', 'Nitro'], tio: ['Tiol', 'Thiol'], alq: ['Alqueno', 'Alkene'], alk: ['Alquino', 'Alkyne'], aro: ['Aromático', 'Aromatic'], hal: ['Haluro de alquilo', 'Alkyl halide'] };
  var M = [['CH₃–CH₂–OH', 'alc'], ['CH₃–CH₂–CH₂–OH', 'alc'], ['CH₃–O–CH₃', 'ete'], ['CH₃–CH₂–O–CH₂–CH₃', 'ete'], ['CH₃–CHO', 'ald'], ['CH₃–CH₂–CHO', 'ald'], ['CH₃–CO–CH₃', 'cet'], ['CH₃–CO–CH₂–CH₃', 'cet'],
    ['CH₃–COOH', 'aci'], ['H–COOH', 'aci'], ['CH₃–COO–CH₂–CH₃', 'est'], ['H–COO–CH₃', 'est'], ['CH₃–CO–NH₂', 'ami'], ['CH₃–CH₂–NH₂', 'amn'], ['(CH₃)₂NH', 'amn'], ['CH₃–C≡N', 'nit'], ['CH₃–NO₂', 'no2'], ['CH₃–CH₂–SH', 'tio'],
    ['CH₂=CH–CH₃', 'alq'], ['HC≡C–CH₃', 'alk'], ['C₆H₅–CH₃', 'aro'], ['CH₃–CH₂–Cl', 'hal'], ['CH₃–Br', 'hal']];
  /* banda IR característica → grupo */
  var IR = [['3200–3550 cm⁻¹, ancha (O–H con puentes de H)', '3200–3550 cm⁻¹, broad (H-bonded O–H)', 'alc'], ['2500–3300 cm⁻¹ muy ancha + 1710 cm⁻¹ (C=O)', '2500–3300 cm⁻¹ very broad + 1710 cm⁻¹ (C=O)', 'aci'], ['≈ 1715 cm⁻¹ (C=O), sin O–H ni C–H de aldehído', '≈ 1715 cm⁻¹ (C=O), no O–H and no aldehyde C–H', 'cet'],
    ['≈ 1730 cm⁻¹ (C=O) + 2720 y 2820 cm⁻¹ (C–H de aldehído)', '≈ 1730 cm⁻¹ (C=O) + 2720 and 2820 cm⁻¹ (aldehyde C–H)', 'ald'], ['≈ 2250 cm⁻¹, aguda (C≡N)', '≈ 2250 cm⁻¹, sharp (C≡N)', 'nit'], ['≈ 3300 cm⁻¹ aguda + ≈ 2120 cm⁻¹ (≡C–H y C≡C)', '≈ 3300 cm⁻¹ sharp + ≈ 2120 cm⁻¹ (≡C–H and C≡C)', 'alk'],
    ['≈ 1740 cm⁻¹ (C=O) + 1050–1300 cm⁻¹ (C–O), sin O–H', '≈ 1740 cm⁻¹ (C=O) + 1050–1300 cm⁻¹ (C–O), no O–H', 'est'], ['≈ 1550 y 1370 cm⁻¹, intensas (N–O)', '≈ 1550 and 1370 cm⁻¹, strong (N–O)', 'no2'], ['≈ 2550 cm⁻¹, débil (S–H)', '≈ 2550 cm⁻¹, weak (S–H)', 'tio']];
  /* prioridad para el sufijo (mayor primero), como en la simulación */
  var PRI = ['aci', 'est', 'ami', 'nit', 'ald', 'cet', 'alc', 'amn', 'tio'];
  var ALL = Object.keys(G).map(function (k) { return G[k]; });
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Identificar el grupo funcional', 'Identify the functional group'], gen: function (H) {
        var m = H.pick(M);
        return H.mc(H.t('¿Qué grupo funcional tiene <b>' + m[0] + '</b>?', 'Which functional group does <b>' + m[0] + '</b> have?'), G[m[1]], ALL, H.t('Busca el átomo o enlace distinto de C–C y C–H: ', 'Look for the atom or bond other than C–C and C–H: ') + H.L(G[m[1]]).toLowerCase() + '.');
      } },
      { name: ['Banda IR característica', 'Characteristic IR band'], gen: function (H) {
        var b = H.pick(IR);
        return H.mc(H.t('Un compuesto muestra en su espectro IR: <b>' + b[0] + '</b>. ¿Qué grupo funcional indica?', 'A compound shows in its IR spectrum: <b>' + b[1] + '</b>. Which functional group does it indicate?'), G[b[2]], IR.map(function (x) { return G[x[2]]; }), H.L(G[b[2]]) + ': ' + H.t(b[0], b[1]) + '.');
      } },
      { name: ['Grupo de mayor prioridad', 'Highest-priority group'], gen: function (H) {
        var a = H.int(0, PRI.length - 2), b = H.int(a + 1, PRI.length - 1), hi = PRI[a], lo = PRI[b], two = H.shuffle([hi, lo]), x = H.L(G[two[0]]).toLowerCase(), y = H.L(G[two[1]]).toLowerCase();
        return H.mc(H.t('Una molécula tiene un grupo <b>' + x + '</b> y uno <b>' + y + '</b>. ¿Cuál da el sufijo del nombre?', 'A molecule has a <b>' + x + '</b> group and a <b>' + y + '</b> group. Which one gives the suffix of the name?'), G[hi], [G[lo]],
          H.t('Orden de prioridad: ácido > éster > amida > nitrilo > aldehído > cetona > alcohol > amina > tiol. El otro grupo se nombra como prefijo.', 'Priority order: acid > ester > amide > nitrile > aldehyde > ketone > alcohol > amine > thiol. The other group is named as a prefix.'));
      } }
    ]
  });
})();
