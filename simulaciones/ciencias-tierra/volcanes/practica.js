/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Ahora el magma tiene mucha sílice y muchos gases. La erupción será…', 'Now the magma has a lot of silica and gas. The eruption will be…'], options: [['efusiva, con coladas tranquilas', 'effusive, with gentle lava flows'], ['explosiva, con una columna de ceniza', 'explosive, with an ash column'], ['no habrá erupción', 'there will be no eruption']], answer: 1, why: ['El magma viscoso atrapa los gases; al bajar la presión se expanden de golpe y fragmentan el magma en ceniza.', 'Viscous magma traps the gases; when the pressure drops they expand suddenly and shatter the magma into ash.'] },
  4: { q: ['Si el SERNAGEOMIN declara alerta técnica roja, significa que…', 'If SERNAGEOMIN declares a red technical alert, it means that…'], options: [['el volcán está apagado', 'the volcano is extinct'], ['hay una erupción en curso o inminente', 'an eruption is under way or imminent'], ['solo hay que observar', 'it only needs watching']], answer: 1, why: ['Verde: actividad normal; amarilla y naranja: aumento de actividad; roja: erupción en curso o inminente, con evacuación de zonas de riesgo.', 'Green: normal activity; yellow and orange: rising activity; red: eruption under way or imminent, with evacuation of risk zones.'] }
} });

/* Práctica: tipo de magma y erupción, peligros y escala de explosividad. */
SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento.', 'Exercises generated at random on each attempt.'],
  problems: [
    { name: ['Tipo de erupción', 'Eruption type'], gen: function (H) {
      var si = H.int(45, 75), ex = (si - 52) / 18 * 0.7, r = ex < 0.15 ? ['efusiva', 'effusive'] : ex < 0.45 ? ['intermedia', 'intermediate'] : ['explosiva', 'explosive'];
      return H.mc(H.t('Un magma tiene ' + si + ' % de sílice y una cantidad normal de gases. ¿Qué tipo de erupción es más probable?', 'A magma has ' + si + ' % silica and a normal gas content. Which type of eruption is most likely?'), r, [['efusiva', 'effusive'], ['intermedia', 'intermediate'], ['explosiva', 'explosive']], H.t('Más sílice → más viscosidad → los gases quedan atrapados → más explosiva.', 'More silica → more viscosity → gases are trapped → more explosive.'));
    } },
    { name: ['Peligros volcánicos', 'Volcanic hazards'], gen: function (H) {
      var B = [[['Aluvión de barro que baja por los ríos al derretirse el glaciar.', 'A mudflow running down rivers when the glacier melts.'], ['lahar', 'lahar']], [['Nube ardiente de gas y fragmentos que baja a gran velocidad.', 'A scorching cloud of gas and fragments that races downhill.'], ['flujo piroclástico', 'pyroclastic flow']], [['Partículas finas que caen a decenas de kilómetros y dañan techos y cultivos.', 'Fine particles that fall tens of kilometres away and damage roofs and crops.'], ['caída de ceniza', 'ash fall']], [['Roca fundida que avanza lentamente por la ladera.', 'Molten rock that advances slowly down the slope.'], ['colada de lava', 'lava flow']]];
      return H.bank(B, function (it) { return H.t('«' + it[0][0] + '» ¿Qué peligro es?', '“' + it[0][1] + '” Which hazard is it?'); }, function (it) { return it[1]; }, null);
    } },
    { name: ['Índice de explosividad', 'Explosivity index'], gen: function (H) {
      var a = H.int(2, 5), b = a + H.int(1, 3), r = Math.pow(10, b - a);
      return { q: H.t('Cada grado del IEV equivale a unas 10 veces más material expulsado. ¿Cuántas veces más material expulsa una erupción de IEV ' + b + ' que una de IEV ' + a + '?', 'Each VEI step means about 10 times more material erupted. How many times more material does a VEI ' + b + ' eruption expel than a VEI ' + a + ' one?'), a: r, unit: H.t('veces', 'times'), sol: '10^(' + b + ' − ' + a + ') = ' + r };
    } },
    { name: ['Distancia de un lahar', 'Lahar distance'], gen: function (H) {
      var v = H.int(20, 60), d = H.int(5, 40), t = d / v * 60;
      return { q: H.t('Un lahar baja por un río a ' + v + ' km/h. ¿En cuántos minutos llega a un pueblo a ' + d + ' km?', 'A lahar flows down a river at ' + v + ' km/h. In how many minutes does it reach a town ' + d + ' km away?'), a: t, unit: 'min', sol: 't = d/v = ' + d + '/' + v + ' h = ' + H.fmt(t, 1) + ' min' };
    } }
  ]
});
