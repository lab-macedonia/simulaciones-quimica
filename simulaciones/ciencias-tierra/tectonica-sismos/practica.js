/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Cuando una placa oceánica choca con una continental, ¿cuál se hunde?', 'When an oceanic plate meets a continental one, which one sinks?'], options: [['la continental', 'the continental plate'], ['la oceánica, que es más densa', 'the oceanic plate, which is denser'], ['ninguna: se levantan ambas', 'neither: both rise up']], answer: 1, why: ['La corteza oceánica (basáltica) es más densa que la continental (granítica): se hunde en la subducción, como la placa de Nazca bajo Chile.', 'Oceanic (basaltic) crust is denser than continental (granitic) crust: it sinks in subduction, like the Nazca plate beneath Chile.'] },
  4: { q: ['Ocurre un sismo. ¿Qué onda llega primero a la estación?', 'An earthquake happens. Which wave reaches the station first?'], options: [['la onda S', 'the S wave'], ['la onda P', 'the P wave'], ['llegan juntas', 'they arrive together']], answer: 1, why: ['La onda P (≈ 6 km/s) es más rápida que la S (≈ 3,5 km/s); por eso se llama primaria.', 'The P wave (≈ 6 km/s) is faster than the S wave (≈ 3.5 km/s); that is why it is called primary.'] }
} });

/* Práctica: velocidad de placas, distancia por S − P, energía y tipos de borde. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa vP = 6 km/s y vS = 3,5 km/s.', 'Problems with new values on every attempt. Use vP = 6 km/s and vS = 3.5 km/s.'],
  problems: [
    { name: ['Distancia al epicentro', 'Distance to the epicentre'], gen: function (H) {
      var dt = H.rnd(3, 60, 1), d = dt * 6 * 3.5 / 2.5;
      return { q: H.t('Una estación registra la onda S ' + H.fmt(dt, 1) + ' s después de la P. ¿A qué distancia ocurrió el sismo?', 'A station records the S wave ' + H.fmt(dt, 1) + ' s after the P wave. How far away was the earthquake?'), a: d, unit: 'km', sol: 'd = Δt·vP·vS/(vP − vS) = ' + H.fmt(dt, 1) + '·' + H.fmt(8.4, 1) + ' = ' + H.fmt(d, 0) + ' km' };
    } },
    { name: ['Tiempo de llegada', 'Arrival time'], gen: function (H) {
      var d = H.int(20, 600), w = H.pick([['P', 6], ['S', 3.5]]);
      return { q: H.t('¿Cuánto tarda la onda ' + w[0] + ' en recorrer ' + d + ' km?', 'How long does the ' + w[0] + ' wave take to travel ' + d + ' km?'), a: d / w[1], unit: 's', sol: 't = d/v = ' + d + '/' + H.fmt(w[1], 1) + ' = ' + H.fmt(d / w[1], 1) + ' s' };
    } },
    { name: ['Movimiento de placas', 'Plate motion'], gen: function (H) {
      var v = H.rnd(2, 10, 1), y = H.pick([100, 1000, 10000, 1000000]), d = v * y / 100;
      return { q: H.t('Una placa se mueve ' + H.fmt(v, 1) + ' cm por año. ¿Cuántos metros avanza en ' + y + ' años?', 'A plate moves ' + H.fmt(v, 1) + ' cm a year. How many metres does it move in ' + y + ' years?'), a: d, unit: 'm', sol: H.fmt(v, 1) + H.t(' cm/año · ', ' cm/year · ') + y + H.t(' años = ', ' years = ') + H.fmt(v * y, 0) + ' cm = ' + H.fmt(d, 1) + ' m' };
    } },
    { name: ['Energía y magnitud', 'Energy and magnitude'], gen: function (H) {
      var m1 = H.int(5, 8), dm = H.int(1, 2), r = Math.pow(31.6, dm);
      return { q: H.t('¿Cuántas veces más energía libera un sismo de magnitud ' + (m1 + dm) + ' que uno de magnitud ' + m1 + '?', 'How many times more energy does a magnitude ' + (m1 + dm) + ' earthquake release than a magnitude ' + m1 + ' one?'), a: r, unit: H.t('veces', 'times'), sol: H.fmt(31.6, 1) + '^' + dm + ' ≈ ' + H.fmt(r, 0) };
    } },
    { name: ['Tipo de borde', 'Boundary type'], gen: function (H) {
      var it = H.pick([[['Se forma una fosa oceánica y una cordillera con volcanes.', 'An oceanic trench and a volcanic mountain range form.'], ['convergente', 'convergent']], [['Se crea corteza oceánica nueva en una dorsal.', 'New oceanic crust is created at a ridge.'], ['divergente', 'divergent']], [['Dos placas se deslizan lateralmente y hay sismos, pero no volcanes.', 'Two plates slide sideways and there are earthquakes but no volcanoes.'], ['transformante', 'transform']]]);
      return H.mc(H.t('«' + it[0][0] + '» ¿Qué tipo de borde es?', '“' + it[0][1] + '” What type of boundary is it?'), it[1], [['convergente', 'convergent'], ['divergente', 'divergent'], ['transformante', 'transform']], '');
    } }
  ]
});
