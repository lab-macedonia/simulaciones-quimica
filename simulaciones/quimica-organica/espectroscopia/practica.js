/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 1: { q: ["Una banda IR intensa cerca de 1715 cm⁻¹ indica…", "A strong IR band near 1715 cm⁻¹ indicates…"], options: [["un C=O", "a C=O"], ["un O–H", "an O–H"], ["un C≡C", "a C≡C"]], answer: 0, why: ["El estiramiento del carbonilo es intenso y aparece entre 1650 y 1800 cm⁻¹.", "Carbonyl stretching is strong and appears between 1650 and 1800 cm⁻¹."] } } });

/* Práctica: regla n + 1, número de señales en RMN ¹H y bandas IR. */
(function () {
  var MUL = ['singulete', 'doblete', 'triplete', 'cuadruplete', 'quintuplete', 'sextuplete', 'septuplete'], MULE = ['singlet', 'doublet', 'triplet', 'quartet', 'quintet', 'sextet', 'septet'];
  /* molécula, H indicados, n vecinos, n.º de señales */
  var M = [['CH₃CH₂Cl', ['CH₃', 'CH₃'], 2], ['CH₃CH₂Cl', ['CH₂', 'CH₂'], 3], ['(CH₃)₂CHBr', ['CH₃', 'CH₃'], 1], ['(CH₃)₂CHBr', ['CH', 'CH'], 6], ['CH₃COCH₂CH₃', ['CH₃ unido al C=O', 'CH₃ attached to C=O'], 0],
    ['CH₃COCH₂CH₃', ['CH₂', 'CH₂'], 3], ['CH₃CH₂OCH₂CH₃', ['CH₃', 'CH₃'], 2], ['ClCH₂CH₂Cl', ['CH₂', 'CH₂'], 0], ['CH₃CH₂CH₂Br', ['CH₂ central', 'central CH₂'], 5], ['(CH₃)₃COH', ['CH₃', 'CH₃'], 0]];
  var SIG = [['CH₃CH₂OH', 3], ['CH₃OCH₃', 1], ['CH₃COCH₃', 1], ['CH₃CH₂CH₃', 2], ['CH₃CH₂CH₂Br', 3], ['(CH₃)₂CHOH', 3], ['C₆H₆ (benceno)', 1], ['CH₃COOCH₂CH₃', 3], ['(CH₃)₃CCl', 1], ['p-CH₃C₆H₄CH₃ (p-xileno)', 2]];
  var IR = [['O–H de alcohol', 'alcohol O–H', '3200–3550 cm⁻¹ (ancha)', '3200–3550 cm⁻¹ (broad)'], ['C=O de cetona', 'ketone C=O', '≈ 1715 cm⁻¹', '≈ 1715 cm⁻¹'], ['C≡N', 'C≡N', '≈ 2250 cm⁻¹', '≈ 2250 cm⁻¹'], ['C–H de alcano (sp³)', 'alkane C–H (sp³)', '2850–2960 cm⁻¹', '2850–2960 cm⁻¹'],
    ['C=C de alqueno', 'alkene C=C', '≈ 1650 cm⁻¹', '≈ 1650 cm⁻¹'], ['O–H de ácido carboxílico', 'carboxylic acid O–H', '2500–3300 cm⁻¹ (muy ancha)', '2500–3300 cm⁻¹ (very broad)'], ['≡C–H de alquino terminal', 'terminal alkyne ≡C–H', '≈ 3300 cm⁻¹ (aguda)', '≈ 3300 cm⁻¹ (sharp)']];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Multiplicidad (regla n + 1)', 'Multiplicity (n + 1 rule)'], gen: function (H) {
        var m = H.pick(M), k = m[2];
        return H.mc(H.t('En el espectro de RMN ¹H de <b>' + m[0] + '</b>, ¿qué multiplicidad tiene la señal de los ' + m[1][0] + '?', 'In the ¹H NMR spectrum of <b>' + m[0] + '</b>, what is the multiplicity of the ' + m[1][1] + ' signal?'), H.EN ? MULE[k] : MUL[k], H.EN ? MULE : MUL,
          H.t('Tiene ' + k + ' H vecinos (en carbonos adyacentes, no equivalentes a ellos): n + 1 = ' + (k + 1) + ' líneas.', 'It has ' + k + ' neighboring H (on adjacent carbons, not equivalent to them): n + 1 = ' + (k + 1) + ' lines.') + (k === 0 ? H.t(' Sin vecinos (o vecinos equivalentes) la señal es un singulete.', ' With no neighbors (or equivalent neighbors) the signal is a singlet.') : ''));
      } },
      { name: ['Número de señales', 'Number of signals'], gen: function (H) {
        var s = H.pick(SIG);
        return { q: H.t('¿Cuántas señales muestra el espectro de RMN ¹H de <b>' + s[0] + '</b>?', 'How many signals does the ¹H NMR spectrum of <b>' + s[0].replace('(benceno)', '(benzene)').replace('(p-xileno)', '(p-xylene)') + '</b> show?'), a: s[1], abs: 0, aText: String(s[1]),
          sol: H.t('Cada grupo de H químicamente equivalentes (por simetría) da una sola señal: ', 'Each set of chemically equivalent H (by symmetry) gives one signal: ') + s[1] + '.' };
      } },
      { name: ['Banda IR', 'IR band'], gen: function (H) {
        var b = H.pick(IR);
        return H.mc(H.t('¿Dónde aparece la banda de tensión del enlace <b>' + b[0] + '</b>?', 'Where does the stretching band of <b>' + b[1] + '</b> appear?'), H.EN ? b[3] : b[2], IR.map(function (x) { return H.EN ? x[3] : x[2]; }),
          H.t('Enlaces más fuertes y átomos más livianos vibran a mayor número de onda; los puentes de hidrógeno ensanchan la banda O–H.', 'Stronger bonds and lighter atoms vibrate at higher wavenumbers; hydrogen bonding broadens the O–H band.'));
      } }
    ]
  });
})();
