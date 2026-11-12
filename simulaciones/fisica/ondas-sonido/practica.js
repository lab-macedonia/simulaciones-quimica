/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Si aumentamos la amplitud de la vibración del parlante, el sonido será…', 'If we increase the amplitude of the speaker’s vibration, the sound will be…'], options: [['más agudo', 'higher-pitched'], ['más intenso (fuerte)', 'more intense (louder)'], ['más rápido', 'faster']], answer: 1, why: ['La amplitud determina la energía y la intensidad; el tono depende de la frecuencia y la rapidez del medio.', 'Amplitude sets the energy and intensity; pitch depends on frequency and speed on the medium.'] },
  3: { q: ['El mismo tono de 440 Hz pasa del aire al agua. Su longitud de onda…', 'The same 440 Hz tone passes from air into water. Its wavelength…'], options: [['aumenta', 'increases'], ['disminuye', 'decreases'], ['no cambia', 'does not change']], answer: 0, why: ['La frecuencia la fija la fuente; en el agua v es mayor y λ = v/f crece (de 0,78 m a 3,4 m).', 'The frequency is set by the source; in water v is greater and λ = v/f grows (from 0.78 m to 3.4 m).'] }
} });

/* Práctica: v = λ·f, período, eco y rangos de audición. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa v = 340 m/s en el aire salvo que se indique otro valor.', 'Problems with new values on every attempt. Use v = 340 m/s in air unless another value is given.'],
  problems: [
    { name: ['Longitud de onda', 'Wavelength'], gen: function (H) {
      var M = H.pick([['el aire', 'air', 340], ['el agua', 'water', 1480], ['el acero', 'steel', 5960]]), f = H.pick([50, 100, 256, 440, 880, 1000, 2000, 5000]);
      return { q: H.t('¿Qué longitud de onda tiene un sonido de ' + f + ' Hz en ' + M[0] + ' (v = ' + M[2] + ' m/s)?', 'What is the wavelength of a ' + f + ' Hz sound in ' + M[1] + ' (v = ' + M[2] + ' m/s)?'), a: M[2] / f, unit: 'm', sol: 'λ = v/f = ' + M[2] + '/' + f + ' = ' + H.fmt(M[2] / f, 3) + ' m' };
    } },
    { name: ['Frecuencia y período', 'Frequency and period'], gen: function (H) {
      var f = H.pick([20, 50, 100, 200, 250, 400, 500, 1000]);
      return { q: H.t('Una cuerda vibra ' + f + ' veces por segundo. ¿Cuál es su período, en milisegundos?', 'A string vibrates ' + f + ' times per second. What is its period, in milliseconds?'), a: 1000 / f, unit: 'ms', sol: 'T = 1/f = 1/' + f + ' s = ' + H.fmt(1000 / f, 2) + ' ms' };
    } },
    { name: ['Distancia por eco', 'Distance from an echo'], gen: function (H) {
      var t = H.rnd(0.4, 6, 1), d = 340 * t / 2;
      return { q: H.t('Gritas frente a un cerro y oyes el eco ' + H.fmt(t, 1) + ' s después. ¿A qué distancia está el cerro?', 'You shout at a hill and hear the echo ' + H.fmt(t, 1) + ' s later. How far away is the hill?'), a: d, unit: 'm', sol: 'd = v·t/2 = 340·' + H.fmt(t, 1) + '/2 = ' + H.fmt(d, 0) + ' m' };
    } },
    { name: ['Sonar', 'Sonar'], gen: function (H) {
      var d = H.int(50, 4000), t = 2 * d / 1480;
      return { q: H.t('Un sonar emite un pulso hacia el fondo del mar, a ' + d + ' m. ¿Cuánto tarda el eco en volver? (v agua = 1480 m/s)', 'A sonar sends a pulse to the seabed, ' + d + ' m below. How long until the echo returns? (v in water = 1480 m/s)'), a: t, unit: 's', sol: 't = 2d/v = 2·' + d + '/1480 = ' + H.fmt(t, 2) + ' s' };
    } },
    { name: ['¿Audible?', 'Audible?'], gen: function (H) {
      var f = H.pick([5, 12, 15, 40, 440, 3000, 15000, 25000, 40000, 100000]), r = f < 20 ? ['infrasonido', 'infrasound'] : f > 20000 ? ['ultrasonido', 'ultrasound'] : ['sonido audible', 'audible sound'];
      return H.mc(H.t('Un sonido de ' + f + ' Hz es para el ser humano un…', 'For humans, a ' + f + ' Hz sound is…'), r, [['infrasonido', 'infrasound'], ['ultrasonido', 'ultrasound'], ['sonido audible', 'audible sound']], H.t('El rango humano va de unos 20 Hz a 20 000 Hz.', 'The human range is about 20 Hz to 20,000 Hz.'));
    } }
  ]
});
