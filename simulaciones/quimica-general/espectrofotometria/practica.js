/* Práctica y predicciones · Espectrofotometría y ley de Beer–Lambert. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Absorbancia a partir de %T', 'Absorbance from %T'], gen: function (H) {
      var t = H.t, f = H.fmt, T = H.rnd(3, 95, 1), A = 2 - Math.log10(T);
      return { q: t('Una muestra transmite el ' + f(T, 1) + ' % de la luz. ¿Cuál es su absorbancia?', 'A sample transmits ' + f(T, 1) + ' % of the light. What is its absorbance?'), a: A, unit: '', abs: 0.004,
        sol: 'A = −log T = −log(' + f(T / 100, 3) + ') = ' + f(A, 3), aText: f(A, 3) };
    } },
    { name: ['Concentración con Beer–Lambert', 'Concentration with Beer–Lambert'], gen: function (H) {
      var t = H.t, f = H.fmt, e = H.int(500, 25000), b = H.pick([1, 1, 1, 0.5, 2]), A = H.rnd(0.1, 1.2, 3), c = A / (e * b);
      return { q: t('Una disolución tiene A = ' + f(A, 3) + ' en una cubeta de ' + f(b, 1) + ' cm. Si ε = ' + e + ' L·mol⁻¹·cm⁻¹, ¿cuál es su concentración?', 'A solution has A = ' + f(A, 3) + ' in a ' + f(b, 1) + ' cm cell. If ε = ' + e + ' L·mol⁻¹·cm⁻¹, what is its concentration?'), a: c, unit: 'mol/L',
        sol: 'c = A / (ε·b) = ' + f(A, 3) + ' / (' + e + ' × ' + f(b, 1) + ') = ' + H.sig(c, 3) + ' mol/L' };
    } },
    { name: ['Transmitancia a partir de A', 'Transmittance from A'], gen: function (H) {
      var t = H.t, f = H.fmt, A = H.rnd(0.05, 2, 2), T = Math.pow(10, -A) * 100;
      return { q: t('¿Qué porcentaje de la luz transmite una muestra con A = ' + f(A, 2) + '?', 'What percentage of the light does a sample with A = ' + f(A, 2) + ' transmit?'), a: T, unit: '%',
        sol: '%T = 10<sup>−A</sup> × 100 = 10<sup>−' + f(A, 2) + '</sup> × 100 = ' + H.sig(T, 3) + ' %' };
    } },
    { name: ['Muestra desconocida con curva de calibración', 'Unknown from a calibration curve'], gen: function (H) {
      var t = H.t, f = H.fmt, m = H.rnd(0.05, 0.4, 3), n = H.rnd(-0.01, 0.02, 3), A = H.rnd(0.15, 1.1, 3), c = (A - n) / m;
      return { q: t('La curva de calibración es A = ' + f(m, 3) + '·c ' + (n < 0 ? '− ' : '+ ') + f(Math.abs(n), 3) + ' (c en mg/L). Una muestra da A = ' + f(A, 3) + '. ¿Cuál es su concentración?', 'The calibration curve is A = ' + f(m, 3) + '·c ' + (n < 0 ? '− ' : '+ ') + f(Math.abs(n), 3) + ' (c in mg/L). A sample gives A = ' + f(A, 3) + '. What is its concentration?'), a: c, unit: 'mg/L',
        sol: 'c = (A − n) / m = (' + f(A, 3) + ' − (' + f(n, 3) + ')) / ' + f(m, 3) + ' = ' + H.sig(c, 3) + ' mg/L' };
    } }
  ],
  predict: {
    1: { q: ['Si se duplica la concentración de la muestra, la absorbancia…', 'If the sample concentration is doubled, the absorbance…'],
      options: [['Se duplica', 'Doubles'], ['Se reduce a la mitad', 'Halves'], ['No cambia', 'Does not change'], ['Se eleva al cuadrado', 'Is squared']], answer: 0,
      why: ['A = ε·b·c es lineal en c. Ojo: la transmitancia no se reduce a la mitad, sino que se eleva al cuadrado (T → T²).', 'A = ε·b·c is linear in c. Note that the transmittance does not halve: it is squared (T → T²).'] },
    2: { q: ['¿Qué pasa con la sensibilidad si se mide lejos de la longitud de onda de máxima absorción?', 'What happens to the sensitivity if you measure far from the wavelength of maximum absorption?'],
      options: [['Disminuye: la pendiente de A frente a c es menor', 'It decreases: the slope of A versus c is smaller'], ['Aumenta', 'It increases'], ['No cambia', 'It does not change'], ['La ley de Beer deja de cumplirse siempre', 'Beer\'s law always stops holding']], answer: 0,
      why: ['Lejos de λ<sub>máx</sub> el valor de ε es menor, así que un mismo cambio de concentración produce un cambio de absorbancia más pequeño.', 'Away from λ<sub>max</sub> the value of ε is smaller, so the same change in concentration produces a smaller change in absorbance.'] },
    4: { q: ['Si la muestra desconocida da una absorbancia mayor que el patrón más concentrado, lo correcto es…', 'If the unknown sample gives a higher absorbance than the most concentrated standard, the right thing to do is…'],
      options: [['Diluirla y volver a medir', 'Dilute it and measure again'], ['Extrapolar la recta', 'Extrapolate the line'], ['Usar una cubeta más larga', 'Use a longer cell'], ['Informar el valor máximo de la curva', 'Report the top value of the curve']], answer: 0,
      why: ['Solo se puede interpolar dentro del rango calibrado; fuera de él la linealidad no está comprobada. Se diluye con un factor conocido y se corrige el resultado.', 'You can only interpolate within the calibrated range; outside it linearity is not verified. Dilute by a known factor and correct the result.'] }
  }
});
