/* Práctica · Retrosíntesis y síntesis multipaso (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Rendimiento global lineal', 'Overall linear yield'], gen: function (H) {
    var n = H.int(3, 7), y = []; for (var i = 0; i < n; i++) y.push(H.int(60, 95)); var g = y.reduce(function (a, v) { return a * v / 100; }, 1) * 100;
    return { q: H.t('Una síntesis lineal de ' + n + ' pasos tiene rendimientos de ' + y.join(' %, ') + ' %. ¿Cuál es el rendimiento global?', 'A ' + n + '-step linear synthesis has yields of ' + y.join(' %, ') + ' %. What is the overall yield?'), a: g, unit: '%', tol: 0.01,
      sol: H.t('Se multiplican las fracciones: ', 'Multiply the fractions: ') + y.map(function (v) { return H.fmt(v / 100, 2); }).join(' × ') + ' = ' + H.sig(g, 3) + ' %' };
  } },
  { name: ['Lineal frente a convergente', 'Linear versus convergent'], gen: function (H) {
    var y = H.int(70, 90), lin = Math.pow(y / 100, 6) * 100, conv = Math.pow(y / 100, 4) * 100;
    return { q: H.t('Con un rendimiento de ' + y + ' % por paso, una ruta lineal tiene 6 pasos y una convergente tiene la rama más larga de 3 pasos más 1 acoplamiento. ¿Cuál es el rendimiento global de la convergente?', 'At ' + y + ' % yield per step, a linear route has 6 steps and a convergent one has a longest branch of 3 steps plus 1 coupling. What is the overall yield of the convergent route?'), a: conv, unit: '%', tol: 0.01,
      sol: H.t('Convergente: (', 'Convergent: (') + H.fmt(y / 100, 2) + ')⁴ = ' + H.sig(conv, 3) + ' %; ' + H.t('lineal', 'linear') + ': (' + H.fmt(y / 100, 2) + ')⁶ = ' + H.sig(lin, 3) + ' %' };
  } },
  { name: ['Sintón y equivalente sintético', 'Synthon and synthetic equivalent'], gen: function (H) {
    var c = H.pick([[H.t('un carbono nucleófilo R⁻', 'a nucleophilic carbon R⁻'), [H.t('Un reactivo de Grignard RMgBr', 'A Grignard reagent RMgBr'), H.t('Un haluro de alquilo RBr', 'An alkyl halide RBr'), H.t('Un aldehído', 'An aldehyde')]], [H.t('un carbocatión R⁺ unido a OH (⁺CH–OH)', 'a carbocation R⁺ bearing OH (⁺CH–OH)'), [H.t('Un aldehído', 'An aldehyde'), H.t('Un alcano', 'An alkane'), H.t('Un reactivo de Grignard', 'A Grignard reagent')]], [H.t('el anión acetiluro HC≡C⁻', 'the acetylide anion HC≡C⁻'), [H.t('Acetileno + NaNH₂', 'Acetylene + NaNH₂'), H.t('Etileno + H₂O', 'Ethylene + H₂O'), H.t('Etanol', 'Ethanol')]]]);
    return { q: H.t('¿Qué equivalente sintético corresponde al sintón ', 'Which synthetic equivalent corresponds to the synthon ') + c[0] + '?', options: c[1], answer: 0, sol: H.t('El equivalente sintético es un reactivo real que aporta la polaridad del sintón.', 'The synthetic equivalent is a real reagent that provides the synthon\'s polarity.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 4: { q: ["Tres pasos con 80 % de rendimiento cada uno dan un rendimiento global de…", "Three steps at 80 % each give an overall yield of…"], options: [["≈ 51 %", "≈ 51 %"], ["80 %", "80 %"], ["≈ 40 %", "≈ 40 %"], ["240 %", "240 %"]], answer: 0, why: ["Se multiplican: 0,8³ ≈ 0,51.", "They multiply: 0.8³ ≈ 0.51."] } } });
