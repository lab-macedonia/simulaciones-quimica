/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Agregamos una atmósfera con gases de efecto invernadero. La temperatura media de la superficie…', 'We add an atmosphere with greenhouse gases. The mean surface temperature…'], options: [['baja', 'falls'], ['sube unos 33 °C', 'rises by about 33 °C'], ['no cambia', 'does not change']], answer: 1, why: ['Los gases devuelven parte del infrarrojo hacia la superficie: de −18 °C a ≈ 15 °C.', 'The gases send part of the infrared back to the surface: from −18 °C to ≈ 15 °C.'] },
  4: { q: ['Entre 1960 y 2024 el CO₂ pasó de ≈ 317 a ≈ 424 ppm. La temperatura global en ese período…', 'Between 1960 and 2024 CO₂ went from ≈ 317 to ≈ 424 ppm. Global temperature over that period…'], options: [['subió más de 1 °C', 'rose by more than 1 °C'], ['bajó', 'fell'], ['se mantuvo igual', 'stayed the same']], answer: 0, why: ['Las mediciones muestran un aumento de ≈ 1,3 °C, coherente con el forzamiento del CO₂ y las retroalimentaciones.', 'Measurements show a rise of ≈ 1.3 °C, consistent with the CO₂ forcing and feedbacks.'] }
} });

/* Práctica: balance de energía, forzamiento del CO₂, tasas de cambio y conceptos. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. σ = 5,67·10⁻⁸ W/(m²·K⁴); ΔF = 5,35·ln(C/280); ΔT ≈ 0,8 K por W/m².', 'Problems with new values on every attempt. σ = 5.67·10⁻⁸ W/(m²·K⁴); ΔF = 5.35·ln(C/280); ΔT ≈ 0.8 K per W/m².'],
  problems: [
    { name: ['Forzamiento del CO₂', 'CO₂ forcing'], gen: function (H) {
      var C = H.pick([350, 400, 450, 500, 560, 700, 840]), F = 5.35 * Math.log(C / 280);
      return { q: H.t('¿Qué forzamiento radiativo produce una concentración de CO₂ de ' + C + ' ppm respecto de 280 ppm?', 'What radiative forcing does a CO₂ concentration of ' + C + ' ppm produce relative to 280 ppm?'), a: F, unit: 'W/m²', sol: 'ΔF = ' + H.fmt(5.35, 2) + '·ln(' + C + '/280) = ' + H.fmt(F, 2) + ' W/m²' };
    } },
    { name: ['Calentamiento estimado', 'Estimated warming'], gen: function (H) {
      var C = H.pick([420, 450, 560, 700, 840]), dT = 0.8 * 5.35 * Math.log(C / 280);
      return { q: H.t('Con una sensibilidad de 0,8 K por W/m², ¿cuánto se calentaría la Tierra con ' + C + ' ppm de CO₂ (respecto de 280 ppm)?', 'With a sensitivity of 0.8 K per W/m², how much would the Earth warm with ' + C + ' ppm of CO₂ (relative to 280 ppm)?'), a: dT, unit: '°C', sol: 'ΔT = ' + H.fmt(0.8, 1) + '·' + H.fmt(5.35, 2) + '·ln(' + C + '/280) = ' + H.fmt(dT, 2) + ' °C' };
    } },
    { name: ['Temperatura sin atmósfera', 'Temperature without atmosphere'], gen: function (H) {
      var a = H.pick([0.1, 0.2, 0.3, 0.4, 0.5]), T = Math.pow(1361 / 4 * (1 - a) / 5.67e-8, 0.25);
      return { q: H.t('Si la Tierra no tuviera atmósfera y su albedo fuera ' + H.fmt(a, 1) + ', ¿cuál sería su temperatura de equilibrio, en °C? (S₀ = 1361 W/m²)', 'If the Earth had no atmosphere and its albedo were ' + H.fmt(a, 1) + ', what would its equilibrium temperature be, in °C? (S₀ = 1361 W/m²)'), a: T - 273.15, abs: 1, unit: '°C', sol: 'T = (1361/4·(1 − ' + H.fmt(a, 1) + ')/σ)^¼ = ' + H.fmt(T, 1) + ' K = ' + H.fmt(T - 273.15, 1) + ' °C' };
    } },
    { name: ['Ritmo de aumento del CO₂', 'Rate of CO₂ rise'], gen: function (H) {
      var y1 = H.pick([1960, 1980, 2000]), D = { 1960: 317, 1980: 339, 2000: 370 }, r = (424 - D[y1]) / (2024 - y1);
      return { q: H.t('El CO₂ pasó de ' + D[y1] + ' ppm en ' + y1 + ' a 424 ppm en 2024. ¿Cuál fue el aumento medio por año?', 'CO₂ rose from ' + D[y1] + ' ppm in ' + y1 + ' to 424 ppm in 2024. What was the average rise per year?'), a: r, unit: H.t('ppm/año', 'ppm/year'), sol: '(424 − ' + D[y1] + ')/(' + (2024 - y1) + ') = ' + H.fmt(r, 2) };
    } },
    { name: ['Retroalimentaciones', 'Feedbacks'], gen: function (H) {
      var B = [[['Se derrite hielo y la superficie absorbe más luz.', 'Ice melts and the surface absorbs more light.'], ['positiva (amplifica)', 'positive (amplifies)']], [['El aire más cálido retiene más vapor de agua.', 'Warmer air holds more water vapour.'], ['positiva (amplifica)', 'positive (amplifies)']], [['Una Tierra más caliente emite más infrarrojo al espacio.', 'A warmer Earth emits more infrared to space.'], ['negativa (estabiliza)', 'negative (stabilises)']]];
      return H.bank(B, function (it) { return H.t('«' + it[0][0] + '» Esta retroalimentación es…', '“' + it[0][1] + '” This feedback is…'); }, function (it) { return it[1]; }, null, [['positiva (amplifica)', 'positive (amplifies)'], ['negativa (estabiliza)', 'negative (stabilises)']]);
    } }
  ]
});
