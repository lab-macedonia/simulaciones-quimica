/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['¿Qué planeta tiene el año más corto?', 'Which planet has the shortest year?'], options: [['La Tierra', 'Earth'], ['Marte', 'Mars'], ['Mercurio', 'Mercury']], answer: 2, why: ['Es el más cercano al Sol: recorre una órbita pequeña y más rápido, en 88 días.', 'It is closest to the Sun: it travels a small orbit, faster, in 88 days.'] },
  6: { q: ['¿Dónde se mueve más rápido Mercurio en su órbita?', 'Where does Mercury move fastest in its orbit?'], options: [['Cerca del Sol (perihelio)', 'Close to the Sun (perihelion)'], ['Lejos del Sol (afelio)', 'Far from the Sun (aphelion)'], ['Siempre a la misma rapidez', 'Always at the same speed']], answer: 0, why: ['Segunda ley de Kepler: áreas iguales en tiempos iguales; cerca del Sol el radio es corto, así que debe recorrer más arco.', 'Kepler’s second law: equal areas in equal times; near the Sun the radius is short, so it must sweep more arc.'] }
} });

/* Práctica · Sistema Solar (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var P = [['Mercurio', 'Mercury', 0.387, 0.378], ['Venus', 'Venus', 0.723, 0.907], ['Marte', 'Mars', 1.524, 0.377], ['Júpiter', 'Jupiter', 5.203, 2.36], ['Saturno', 'Saturn', 9.537, 0.916], ['Urano', 'Uranus', 19.19, 0.889], ['Neptuno', 'Neptune', 30.07, 1.12]];
  SimAula.register({ problems: [
    { name: ['Tercera ley de Kepler', 'Kepler\'s third law'], gen: function (H) {
      var p = H.pick(P), T = Math.pow(p[2], 1.5);
      return { q: H.t('Si ' + p[0] + ' orbita a ' + H.fmt(p[2], 3) + ' UA del Sol, ¿cuánto dura su año en años terrestres?', 'If ' + p[1] + ' orbits ' + H.fmt(p[2], 3) + ' AU from the Sun, how long is its year in Earth years?'), a: T, unit: H.t('años', 'years'),
        sol: 'T² = a³ (T ' + H.t('en años', 'in years') + ', a ' + H.t('en UA', 'in AU') + ') → T = ' + H.fmt(p[2], 3) + '<sup>' + H.fmt(1.5, 1) + '</sup> = ' + H.sig(T, 3) };
    } },
    { name: ['Peso en otro planeta', 'Weight on another planet'], gen: function (H) {
      var p = H.pick(P), m = H.int(20, 100), W = m * 9.81 * p[3];
      return { q: H.t('Una persona de ' + m + ' kg está en ' + p[0] + ' (g = ' + H.fmt(p[3], 3) + ' veces la terrestre). ¿Cuál es su peso en newtons?', 'A ' + m + ' kg person is on ' + p[1] + ' (g = ' + H.fmt(p[3], 3) + ' times Earth\'s). What is their weight in newtons?'), a: W, unit: 'N',
        sol: 'P = m·g = ' + m + ' × ' + H.fmt(9.81, 2) + ' × ' + H.fmt(p[3], 3) + ' = ' + H.sig(W, 3) + ' N' };
    } },
    { name: ['Tiempo de viaje de la luz', 'Light travel time'], gen: function (H) {
      var p = H.pick(P), t = p[2] * 1.496e11 / 2.998e8 / 60;
      return { q: H.t('¿Cuántos minutos tarda la luz del Sol en llegar a ' + p[0] + ' (' + H.fmt(p[2], 3) + ' UA; 1 UA = 1,496 × 10¹¹ m)?', 'How many minutes does sunlight take to reach ' + p[1] + ' (' + H.fmt(p[2], 3) + ' AU; 1 AU = 1.496 × 10¹¹ m)?'), a: t, unit: 'min',
        sol: 't = d/c = ' + H.sig(p[2] * 1.496e11, 3) + ' m / ' + H.sig(2.998e8, 4) + ' m/s = ' + H.sig(t * 60, 3) + ' s = ' + H.sig(t, 3) + ' min' };
    } }
  ] });
})();
