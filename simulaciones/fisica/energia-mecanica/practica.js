/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Si soltamos una esfera del doble de masa desde la misma altura, en el fondo su rapidez será…', 'If we release a ball with twice the mass from the same height, its speed at the bottom will be…'], options: [['el doble', 'twice as large'], ['la misma', 'the same'], ['la mitad', 'half']], answer: 1, why: ['m·g·h = ½·m·v² → v = √(2gh): la masa se cancela. La esfera pesada tiene más energía, pero también más masa que mover.', 'm·g·h = ½·m·v² → v = √(2gh): the mass cancels out. The heavy ball has more energy, but also more mass to move.'] },
  4: { q: ['Ahora la pista tiene roce. En el otro extremo, la esfera llegará…', 'Now the track has friction. On the other side, the ball will reach…'], options: [['a la misma altura', 'the same height'], ['más alto', 'a greater height'], ['más bajo', 'a lower height']], answer: 2, why: ['El roce convierte parte de la energía mecánica en calor: queda menos Ep disponible para subir.', 'Friction turns part of the mechanical energy into heat: less Ep is left for climbing.'] }
} });

/* Práctica: trabajo, energía potencial y cinética, conservación y potencia. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa g = 9,8 m/s².', 'Problems with new values on every attempt. Use g = 9.8 m/s².'],
  problems: [
    { name: ['Trabajo de una fuerza', 'Work done by a force'], gen: function (H) {
      var F = H.int(10, 300), d = H.int(2, 40);
      return { q: H.t('Se arrastra un carro con una fuerza horizontal de ' + F + ' N a lo largo de ' + d + ' m. ¿Qué trabajo realiza la fuerza?', 'A trolley is dragged with a horizontal force of ' + F + ' N over ' + d + ' m. How much work does the force do?'), a: F * d, unit: 'J', sol: 'W = F·d = ' + F + '·' + d + ' = ' + F * d + ' J' };
    } },
    { name: ['Energía potencial', 'Potential energy'], gen: function (H) {
      var m = H.int(1, 80), h = H.rnd(0.5, 30, 1), E = m * 9.8 * h;
      return { q: H.t('¿Qué energía potencial tiene un cuerpo de ' + m + ' kg a ' + H.fmt(h, 1) + ' m de altura?', 'What potential energy does a ' + m + ' kg body have ' + H.fmt(h, 1) + ' m high?'), a: E, unit: 'J', sol: 'Ep = m·g·h = ' + m + '·' + H.fmt(9.8, 1) + '·' + H.fmt(h, 1) + ' = ' + H.fmt(E, 0) + ' J' };
    } },
    { name: ['Energía cinética', 'Kinetic energy'], gen: function (H) {
      var m = H.int(1, 1500), v = H.int(1, 30), E = 0.5 * m * v * v;
      return { q: H.t('¿Qué energía cinética tiene un cuerpo de ' + m + ' kg que se mueve a ' + v + ' m/s?', 'What kinetic energy does a ' + m + ' kg body moving at ' + v + ' m/s have?'), a: E, unit: 'J', sol: 'Ec = ½·m·v² = ½·' + m + '·' + v + '² = ' + H.fmt(E, 0) + ' J' };
    } },
    { name: ['Rapidez por conservación', 'Speed from conservation'], gen: function (H) {
      var h = H.rnd(0.5, 40, 1), v = Math.sqrt(2 * 9.8 * h);
      return { q: H.t('Un objeto cae libremente (sin roce) desde ' + H.fmt(h, 1) + ' m. ¿Con qué rapidez llega al suelo?', 'An object falls freely (no friction) from ' + H.fmt(h, 1) + ' m. How fast does it hit the ground?'), a: v, unit: 'm/s', sol: 'v = √(2·g·h) = √(2·' + H.fmt(9.8, 1) + '·' + H.fmt(h, 1) + ') = ' + H.fmt(v, 2) + ' m/s' };
    } },
    { name: ['Potencia', 'Power'], gen: function (H) {
      var m = H.int(10, 200), h = H.int(2, 20), t = H.int(2, 60), W = m * 9.8 * h;
      return { q: H.t('Un montacargas sube ' + m + ' kg a ' + h + ' m de altura en ' + t + ' s. ¿Qué potencia desarrolla?', 'A hoist lifts ' + m + ' kg to a height of ' + h + ' m in ' + t + ' s. What power does it develop?'), a: W / t, unit: 'W', sol: 'W = m·g·h = ' + H.fmt(W, 0) + ' J · P = W/t = ' + H.fmt(W, 0) + '/' + t + ' = ' + H.fmt(W / t, 1) + ' W' };
    } },
    { name: ['Energía disipada por roce', 'Energy dissipated by friction'], gen: function (H) {
      var m = H.int(1, 20), h = H.int(2, 10), v = H.rnd(1, Math.sqrt(2 * 9.8 * h) * 0.9, 1), Q = m * 9.8 * h - 0.5 * m * v * v;
      return { q: H.t('Un trineo de ' + m + ' kg baja por una ladera de ' + h + ' m de altura partiendo del reposo y llega abajo a ' + H.fmt(v, 1) + ' m/s. ¿Cuánta energía se disipó por roce?', 'A ' + m + ' kg sled slides down a ' + h + ' m slope from rest and reaches the bottom at ' + H.fmt(v, 1) + ' m/s. How much energy was dissipated by friction?'), a: Q, unit: 'J', sol: 'Q = m·g·h − ½·m·v² = ' + H.fmt(m * 9.8 * h, 1) + ' − ' + H.fmt(0.5 * m * v * v, 1) + ' = ' + H.fmt(Q, 1) + ' J' };
    } }
  ]
});
