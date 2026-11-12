/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Un carro choca elásticamente con otro igual que está en reposo. Después del choque…', 'A cart collides elastically with an identical one at rest. After the collision…'], options: [['ambos avanzan a la mitad de la velocidad', 'both move on at half the velocity'], ['el primero se detiene y el segundo sale con su velocidad', 'the first stops and the second leaves with its velocity'], ['el primero rebota', 'the first bounces back']], answer: 1, why: ['Para que se conserven a la vez el momentum y la energía cinética con masas iguales, los carros intercambian velocidades.', 'For momentum and kinetic energy to be conserved at once with equal masses, the carts swap velocities.'] },
  4: { q: ['Un carro de 1 kg choca elásticamente con uno de 4 kg en reposo. El carro liviano…', 'A 1 kg cart collides elastically with a 4 kg cart at rest. The light cart…'], options: [['se detiene', 'stops'], ['sigue hacia adelante más lento', 'keeps going forwards more slowly'], ['rebota hacia atrás', 'bounces back']], answer: 2, why: ['v₁′ = (m₁ − m₂)/(m₁ + m₂)·v₁ = −0,6·v₁: rebota a 1,8 m/s, y el pesado avanza a 1,2 m/s.', 'v₁′ = (m₁ − m₂)/(m₁ + m₂)·v₁ = −0.6·v₁: it bounces back at 1.8 m/s and the heavy one moves on at 1.2 m/s.'] }
} });

/* Práctica: momentum, impulso, choques inelásticos y retroceso. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Indica el signo si la velocidad apunta hacia atrás.', 'Problems with new values on every attempt. Include the sign if the velocity points backwards.'],
  problems: [
    { name: ['Cantidad de movimiento', 'Momentum'], gen: function (H) {
      var m = H.int(1, 2000), v = H.int(1, 40);
      return { q: H.t('¿Qué cantidad de movimiento tiene un cuerpo de ' + m + ' kg que viaja a ' + v + ' m/s?', 'What momentum does a ' + m + ' kg body travelling at ' + v + ' m/s have?'), a: m * v, unit: 'kg·m/s', sol: 'p = m·v = ' + m + '·' + v + ' = ' + m * v + ' kg·m/s' };
    } },
    { name: ['Impulso y fuerza media', 'Impulse and average force'], gen: function (H) {
      var m = H.rnd(0.05, 80, 2), v = H.int(2, 30), dt = H.pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5]), F = m * v / dt;
      return { q: H.t('Un cuerpo de ' + H.fmt(m, 2) + ' kg que va a ' + v + ' m/s se detiene en ' + H.fmt(dt, 2) + ' s. ¿Qué fuerza media lo frena?', 'A ' + H.fmt(m, 2) + ' kg body moving at ' + v + ' m/s stops in ' + H.fmt(dt, 2) + ' s. What average force stops it?'), a: F, unit: 'N', sol: 'F = Δp/Δt = ' + H.fmt(m, 2) + '·' + v + '/' + H.fmt(dt, 2) + ' = ' + H.fmt(F, 1) + ' N' };
    } },
    { name: ['Choque perfectamente inelástico', 'Perfectly inelastic collision'], gen: function (H) {
      var m1 = H.int(1, 10), m2 = H.int(1, 10), v1 = H.int(1, 12), v2 = H.pick([0, 0, -H.int(1, 6), H.int(1, 4)]), v = (m1 * v1 + m2 * v2) / (m1 + m2);
      return { q: H.t('Un carro de ' + m1 + ' kg a ' + v1 + ' m/s choca con otro de ' + m2 + ' kg que va a ' + v2 + ' m/s y quedan unidos. ¿Con qué velocidad se mueven juntos?', 'A ' + m1 + ' kg cart at ' + v1 + ' m/s collides with a ' + m2 + ' kg cart moving at ' + v2 + ' m/s and they stick together. What is their common velocity?'), a: v, abs: 0.02, unit: 'm/s', sol: 'v = (m₁v₁ + m₂v₂)/(m₁ + m₂) = (' + m1 * v1 + ' + ' + m2 * v2 + ')/' + (m1 + m2) + ' = ' + H.fmt(v, 2) + ' m/s' };
    } },
    { name: ['Retroceso', 'Recoil'], gen: function (H) {
      var M = H.int(500, 3000), m = H.rnd(1, 20, 1), v = H.int(100, 800), V = m * v / M;
      return { q: H.t('Un cañón de ' + M + ' kg dispara un proyectil de ' + H.fmt(m, 1) + ' kg a ' + v + ' m/s. ¿Con qué rapidez retrocede el cañón?', 'A ' + M + ' kg cannon fires a ' + H.fmt(m, 1) + ' kg shell at ' + v + ' m/s. How fast does the cannon recoil?'), a: V, unit: 'm/s', sol: 'M·V = m·v → V = ' + H.fmt(m, 1) + '·' + v + '/' + M + ' = ' + H.fmt(V, 2) + ' m/s' };
    } },
    { name: ['Energía perdida en un choque', 'Energy lost in a collision'], gen: function (H) {
      var m = H.int(1, 10), v = H.int(2, 10), vf = v / 2, Ei = 0.5 * m * v * v, Ef = 0.5 * 2 * m * vf * vf;
      return { q: H.t('Dos carros de ' + m + ' kg chocan y quedan unidos; uno iba a ' + v + ' m/s y el otro estaba en reposo. ¿Cuánta energía cinética se pierde?', 'Two ' + m + ' kg carts collide and stick together; one was moving at ' + v + ' m/s and the other at rest. How much kinetic energy is lost?'), a: Ei - Ef, unit: 'J', sol: H.t('v = ' + H.fmt(vf, 2) + ' m/s · Ec antes = ' + H.fmt(Ei, 1) + ' J, después = ' + H.fmt(Ef, 1) + ' J → se pierden ' + H.fmt(Ei - Ef, 1) + ' J (la mitad)', 'v = ' + H.fmt(vf, 2) + ' m/s · Ek before = ' + H.fmt(Ei, 1) + ' J, after = ' + H.fmt(Ef, 1) + ' J → ' + H.fmt(Ei - Ef, 1) + ' J lost (half)') };
    } }
  ]
});
