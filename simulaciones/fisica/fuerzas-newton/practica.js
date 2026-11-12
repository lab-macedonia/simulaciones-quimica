/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Llevamos el mismo cuerpo de 5 kg a la Luna. Su peso…', 'We take the same 5 kg body to the Moon. Its weight…'], options: [['no cambia', 'does not change'], ['disminuye', 'decreases'], ['es cero', 'is zero']], answer: 1, why: ['P = m·g y en la Luna g = 1,62 m/s²: pesa 8,1 N en vez de 49 N. Su masa sigue siendo 5 kg.', 'W = m·g and on the Moon g = 1.62 m/s²: it weighs 8.1 N instead of 49 N. Its mass is still 5 kg.'] },
  3: { q: ['Tiras de la caja con una fuerza que crece poco a poco. ¿Qué ocurre al principio?', 'You pull the box with a slowly increasing force. What happens at first?'], options: [['se mueve apenas tiras', 'it moves as soon as you pull'], ['no se mueve: el roce estático iguala tu fuerza', 'it does not move: static friction matches your force'], ['se mueve hacia atrás', 'it moves backwards']], answer: 1, why: ['El roce estático crece con la fuerza aplicada hasta μₛ·N (24,5 N en madera); solo entonces la caja desliza.', 'Static friction grows with the applied force up to μₛ·N (24.5 N on wood); only then does the box slide.'] }
} });

/* Práctica: peso, Hooke, roce, segunda y tercera ley. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa g = 9,8 m/s² salvo que se indique otro valor.', 'Problems with new values on every attempt. Use g = 9.8 m/s² unless another value is given.'],
  problems: [
    { name: ['Peso en distintos astros', 'Weight on different bodies'], gen: function (H) {
      var P = H.pick([['la Tierra', 'Earth', 9.8], ['la Luna', 'the Moon', 1.62], ['Marte', 'Mars', 3.71], ['Júpiter', 'Jupiter', 24.8]]), m = H.int(2, 90);
      return { q: H.t('¿Cuánto pesa un cuerpo de ' + m + ' kg en ' + P[0] + ' (g = ' + H.fmt(P[2], 2) + ' m/s²)?', 'How much does a ' + m + ' kg body weigh on ' + P[1] + ' (g = ' + H.fmt(P[2], 2) + ' m/s²)?'), a: m * P[2], unit: 'N', sol: 'P = m·g = ' + m + ' · ' + H.fmt(P[2], 2) + ' = ' + H.fmt(m * P[2], 1) + ' N' };
    } },
    { name: ['Ley de Hooke', 'Hooke’s law'], gen: function (H) {
      var k = H.int(5, 40) * 10, m = H.rnd(0.2, 3, 1), F = m * 9.8, x = F / k;
      if (Math.random() < 0.5) return { q: H.t('Un resorte de k = ' + k + ' N/m sostiene una masa de ' + H.fmt(m, 1) + ' kg. ¿Cuánto se estira, en cm?', 'A spring with k = ' + k + ' N/m holds a ' + H.fmt(m, 1) + ' kg mass. How much does it stretch, in cm?'), a: x * 100, unit: 'cm', sol: 'x = m·g/k = ' + H.fmt(F, 2) + ' / ' + k + ' = ' + H.fmt(x, 4) + ' m = ' + H.fmt(x * 100, 2) + ' cm' };
      var xc = H.int(2, 20); return { q: H.t('Un resorte se estira ' + xc + ' cm al aplicarle ' + H.fmt(k * xc / 100, 1) + ' N. ¿Cuál es su constante k?', 'A spring stretches ' + xc + ' cm when ' + H.fmt(k * xc / 100, 1) + ' N is applied. What is its constant k?'), a: k, unit: 'N/m', sol: 'k = F/x = ' + H.fmt(k * xc / 100, 1) + ' / ' + H.fmt(xc / 100, 2) + ' = ' + k + ' N/m' };
    } },
    { name: ['Roce estático máximo', 'Maximum static friction'], gen: function (H) {
      var m = H.int(2, 40), mu = H.rnd(0.1, 0.9, 2), f = mu * m * 9.8;
      return { q: H.t('Una caja de ' + m + ' kg descansa sobre el suelo (μₛ = ' + H.fmt(mu, 2) + '). ¿Qué fuerza mínima hay que aplicar para que empiece a deslizar?', 'A ' + m + ' kg box rests on the floor (μₛ = ' + H.fmt(mu, 2) + '). What minimum force must be applied for it to start sliding?'), a: f, unit: 'N', sol: 'f = μₛ·N = μₛ·m·g = ' + H.fmt(mu, 2) + '·' + m + '·' + H.fmt(9.8, 1) + ' = ' + H.fmt(f, 1) + ' N' };
    } },
    { name: ['Segunda ley con roce', 'Second law with friction'], gen: function (H) {
      var m = H.int(2, 20), mu = H.rnd(0.1, 0.5, 2), fk = mu * m * 9.8, F = Math.round(fk + H.int(5, 60)), a = (F - fk) / m;
      return { q: H.t('Se tira de una caja de ' + m + ' kg con ' + F + ' N; el coeficiente de roce cinético es ' + H.fmt(mu, 2) + '. ¿Cuál es su aceleración?', 'A ' + m + ' kg box is pulled with ' + F + ' N; the kinetic friction coefficient is ' + H.fmt(mu, 2) + '. What is its acceleration?'), a: a, unit: 'm/s²', sol: 'f = μ·m·g = ' + H.fmt(fk, 1) + ' N · a = (F − f)/m = (' + F + ' − ' + H.fmt(fk, 1) + ')/' + m + ' = ' + H.fmt(a, 2) + ' m/s²' };
    } },
    { name: ['Fuerza neta y aceleración', 'Net force and acceleration'], gen: function (H) {
      var m = H.int(1, 50), a = H.rnd(0.5, 6, 1);
      if (Math.random() < 0.5) return { q: H.t('¿Qué fuerza neta se necesita para dar a ' + m + ' kg una aceleración de ' + H.fmt(a, 1) + ' m/s²?', 'What net force is needed to give ' + m + ' kg an acceleration of ' + H.fmt(a, 1) + ' m/s²?'), a: m * a, unit: 'N', sol: 'F = m·a = ' + m + '·' + H.fmt(a, 1) + ' = ' + H.fmt(m * a, 1) + ' N' };
      var F = H.int(10, 300); return { q: H.t('Una fuerza neta de ' + F + ' N actúa sobre ' + m + ' kg. ¿Qué aceleración produce?', 'A net force of ' + F + ' N acts on ' + m + ' kg. What acceleration does it produce?'), a: F / m, unit: 'm/s²', sol: 'a = F/m = ' + F + '/' + m + ' = ' + H.fmt(F / m, 2) + ' m/s²' };
    } },
    { name: ['Acción y reacción', 'Action and reaction'], gen: function (H) {
      var m1 = H.int(40, 90), m2 = H.int(20, 80), F = H.int(50, 200);
      return { q: H.t('Dos patinadores (' + m1 + ' kg y ' + m2 + ' kg) se empujan con una fuerza de ' + F + ' N. ¿Qué aceleración adquiere el de ' + m2 + ' kg?', 'Two skaters (' + m1 + ' kg and ' + m2 + ' kg) push each other with a force of ' + F + ' N. What acceleration does the ' + m2 + ' kg skater get?'), a: F / m2, unit: 'm/s²', sol: H.t('Ambos reciben ' + F + ' N (3.ª ley): a = ' + F + '/' + m2 + ' = ' + H.fmt(F / m2, 2) + ' m/s²', 'Both receive ' + F + ' N (3rd law): a = ' + F + '/' + m2 + ' = ' + H.fmt(F / m2, 2) + ' m/s²') };
    } }
  ]
});
