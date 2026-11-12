/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 1: { q: ["Si el sólido tiene una impureza, su rango de fusión…", "If the solid contains an impurity, its melting range…"], options: [["baja y se ensancha", "drops and broadens"], ["sube", "rises"], ["no cambia", "does not change"]], answer: 0, why: ["La impureza rompe la red cristalina (descenso crioscópico) y la fusión ocurre en un intervalo.", "The impurity disrupts the lattice (freezing-point depression) and melting spans a range."] } } });

/* Práctica: interpretar rangos de fusión y puntos de fusión mixtos (valores generados). */
(function () {
  var C = [['ácido benzoico', 'benzoic acid', 122], ['ácido acetilsalicílico', 'acetylsalicylic acid', 135], ['ácido salicílico', 'salicylic acid', 159], ['acetanilida', 'acetanilide', 114], ['naftaleno', 'naphthalene', 80], ['urea', 'urea', 133], ['benzofenona', 'benzophenone', 48], ['ácido cinámico (trans)', 'cinnamic acid (trans)', 133]];
  var P = ['Pura (rango estrecho y cercano al valor de tabla)', 'Pure (narrow range close to the literature value)'], I = ['Impura (rango ancho y más bajo)', 'Impure (broad, lower range)'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['¿Pura o impura?', 'Pure or impure?'], gen: function (H) {
        var c = H.pick(C), pure = Math.random() < 0.5, lo, hi;
        if (pure) { hi = c[2] + H.pick([0, 0.5, 1]); lo = hi - H.pick([0.5, 1, 1.5]); } else { hi = c[2] - H.int(2, 6); lo = hi - H.int(3, 8); }
        return H.mc(H.t('Una muestra de <b>' + c[0] + '</b> (p.f. de tabla ' + c[2] + ' °C) funde entre <b>' + H.fmt(lo, 1) + ' y ' + H.fmt(hi, 1) + ' °C</b>. La muestra está…', 'A sample of <b>' + c[1] + '</b> (literature m.p. ' + c[2] + ' °C) melts between <b>' + H.fmt(lo, 1) + ' and ' + H.fmt(hi, 1) + ' °C</b>. The sample is…'), pure ? P : I, [P, I],
          H.t('Rango de ', 'Range of ') + H.fmt(hi - lo, 1) + ' °C. ' + H.t('Un sólido puro funde en 1–2 °C cerca del valor de tabla; las impurezas rompen la red, bajan el punto de fusión y ensanchan el rango (depresión crioscópica, eutéctico).', 'A pure solid melts over 1–2 °C near the literature value; impurities disrupt the lattice, lower the melting point and broaden the range (freezing-point depression, eutectic).'));
      } },
      { name: ['Punto de fusión mixto', 'Mixed melting point'], gen: function (H) {
        var c = H.pick(C), same = Math.random() < 0.5, lo = same ? c[2] - 1 : c[2] - H.int(10, 25), hi = same ? c[2] : lo + H.int(4, 8);
        var S = ['Sí, son el mismo compuesto', 'Yes, they are the same compound'], N = ['No, son compuestos distintos', 'No, they are different compounds'];
        return H.mc(H.t('Un sólido desconocido funde a ' + c[2] + ' °C, igual que el <b>' + c[0] + '</b>. Una mezcla 1:1 de ambos funde entre <b>' + lo + ' y ' + hi + ' °C</b>. ¿Es el mismo compuesto?', 'An unknown solid melts at ' + c[2] + ' °C, like <b>' + c[1] + '</b>. A 1:1 mixture of both melts between <b>' + lo + ' and ' + hi + ' °C</b>. Is it the same compound?'), same ? S : N, [S, N],
          same ? H.t('La mezcla funde igual que cada componente: no hay depresión, así que no hay “impureza”.', 'The mixture melts like each component: no depression, so there is no “impurity”.') : H.t('La mezcla funde más bajo y en un rango ancho: cada sólido actúa como impureza del otro.', 'The mixture melts lower and over a broad range: each solid acts as an impurity in the other.'));
      } },
      { name: ['Velocidad de calentamiento', 'Heating rate'], gen: function (H) {
        var opt = [['Más alta que la real', 'Higher than the true value'], ['Más baja que la real', 'Lower than the true value'], ['Igual a la real', 'Equal to the true value']];
        return H.mc(H.t('Si se calienta el capilar demasiado rápido (10 °C/min cerca del punto de fusión), la temperatura leída será…', 'If the capillary is heated too fast (10 °C/min near the melting point), the temperature read will be…'), opt[0], opt.slice(1),
          H.t('El termómetro se retrasa respecto de la muestra: cuando el sólido termina de fundir, el bloque ya está más caliente. Cerca del p.f. se calienta a 1–2 °C/min.', 'The thermometer lags behind the sample: when the solid finishes melting, the block is already hotter. Near the m.p. heat at 1–2 °C/min.'));
      } }
    ]
  });
})();
