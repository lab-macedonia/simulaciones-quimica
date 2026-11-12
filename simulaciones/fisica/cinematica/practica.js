/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['El auto avanza a velocidad constante y deja una marca cada segundo. Las marcas quedarán…', 'The car moves at constant velocity and leaves a mark every second. The marks will be…'], options: [['cada vez más separadas', 'further and further apart'], ['igualmente espaciadas', 'evenly spaced'], ['cada vez más juntas', 'closer and closer']], answer: 1, why: ['Con velocidad constante recorre la misma distancia cada segundo (aquí 10 m).', 'At constant velocity it covers the same distance every second (here 10 m).'] },
  3: { q: ['Parte del reposo con a = 2 m/s². ¿Qué distancia habrá recorrido a los 10 s?', 'It starts from rest with a = 2 m/s². How far will it have gone after 10 s?'], options: [['20 m', '20 m'], ['100 m', '100 m'], ['200 m', '200 m']], answer: 1, why: ['x = ½·a·t² = ½·2·10² = 100 m. La velocidad final es 20 m/s, pero la media es solo 10 m/s.', 'x = ½·a·t² = ½·2·10² = 100 m. The final velocity is 20 m/s, but the average is only 10 m/s.'] }
} });

/* Práctica: MRU, MRUA, frenado, encuentro y conversión de unidades. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Usa m, s y m/s salvo que se indique otra unidad.', 'Problems with new values on every attempt. Use m, s and m/s unless another unit is given.'],
  problems: [
    { name: ['MRU: distancia o tiempo', 'Uniform motion: distance or time'], gen: function (H) {
      var v = H.int(4, 30), t = H.int(3, 20);
      if (Math.random() < 0.5) return { q: H.t('Un ciclista se mueve a ' + v + ' m/s constantes durante ' + t + ' s. ¿Qué distancia recorre?', 'A cyclist moves at a constant ' + v + ' m/s for ' + t + ' s. How far does it go?'), a: v * t, unit: 'm', sol: 'd = v·t = ' + v + ' · ' + t + ' = ' + v * t + ' m' };
      var d = v * t; return { q: H.t('Un tren recorre ' + d + ' m a ' + v + ' m/s constantes. ¿Cuánto tarda?', 'A train covers ' + d + ' m at a constant ' + v + ' m/s. How long does it take?'), a: t, unit: 's', sol: 't = d/v = ' + d + ' / ' + v + ' = ' + t + ' s' };
    } },
    { name: ['Conversión km/h ↔ m/s', 'Converting km/h ↔ m/s'], gen: function (H) {
      var k = H.pick([18, 36, 54, 72, 90, 108, 120, 45, 60]);
      if (Math.random() < 0.5) return { q: H.t('Expresa ' + k + ' km/h en m/s.', 'Express ' + k + ' km/h in m/s.'), a: k / 3.6, unit: 'm/s', sol: k + ' km/h ÷ ' + H.fmt(3.6, 1) + ' = ' + H.fmt(k / 3.6, 2) + ' m/s' };
      var m = H.int(5, 35); return { q: H.t('Expresa ' + m + ' m/s en km/h.', 'Express ' + m + ' m/s in km/h.'), a: m * 3.6, unit: 'km/h', sol: m + ' m/s × ' + H.fmt(3.6, 1) + ' = ' + H.fmt(m * 3.6, 1) + ' km/h' };
    } },
    { name: ['MRUA: velocidad y posición', 'Accelerated motion: velocity and position'], gen: function (H) {
      var v0 = H.int(0, 12), a = H.rnd(0.5, 4, 1), t = H.int(2, 10), v = v0 + a * t, x = v0 * t + 0.5 * a * t * t;
      if (Math.random() < 0.5) return { q: H.t('Un auto con v₀ = ' + v0 + ' m/s acelera a ' + H.fmt(a, 1) + ' m/s² durante ' + t + ' s. ¿Qué velocidad alcanza?', 'A car with v₀ = ' + v0 + ' m/s accelerates at ' + H.fmt(a, 1) + ' m/s² for ' + t + ' s. What velocity does it reach?'), a: v, unit: 'm/s', sol: 'v = v₀ + a·t = ' + v0 + ' + ' + H.fmt(a, 1) + '·' + t + ' = ' + H.fmt(v, 1) + ' m/s' };
      return { q: H.t('Un auto con v₀ = ' + v0 + ' m/s acelera a ' + H.fmt(a, 1) + ' m/s² durante ' + t + ' s. ¿Qué distancia recorre?', 'A car with v₀ = ' + v0 + ' m/s accelerates at ' + H.fmt(a, 1) + ' m/s² for ' + t + ' s. How far does it go?'), a: x, unit: 'm', sol: 'Δx = v₀·t + ½·a·t² = ' + v0 + '·' + t + ' + ½·' + H.fmt(a, 1) + '·' + t + '² = ' + H.fmt(x, 1) + ' m' };
    } },
    { name: ['Aceleración a partir de dos velocidades', 'Acceleration from two velocities'], gen: function (H) {
      var v0 = H.int(0, 20), v = v0 + H.int(4, 30), t = H.int(2, 12), a = (v - v0) / t;
      return { q: H.t('Una moto pasa de ' + v0 + ' m/s a ' + v + ' m/s en ' + t + ' s. ¿Cuál es su aceleración media?', 'A motorbike goes from ' + v0 + ' m/s to ' + v + ' m/s in ' + t + ' s. What is its average acceleration?'), a: a, unit: 'm/s²', sol: 'a = Δv/Δt = (' + v + ' − ' + v0 + ') / ' + t + ' = ' + H.fmt(a, 2) + ' m/s²' };
    } },
    { name: ['Distancia de frenado', 'Braking distance'], gen: function (H) {
      var k = H.pick([36, 54, 72, 90, 108]), v = k / 3.6, a = H.pick([4, 5, 6, 7, 8]), d = v * v / (2 * a);
      return { q: H.t('Un auto a ' + k + ' km/h frena con desaceleración constante de ' + a + ' m/s². ¿Qué distancia recorre hasta detenerse?', 'A car at ' + k + ' km/h brakes with a constant deceleration of ' + a + ' m/s². How far does it travel before stopping?'), a: d, unit: 'm', sol: 'v₀ = ' + k + '/' + H.fmt(3.6, 1) + ' = ' + H.fmt(v, 2) + ' m/s · d = v₀²/(2a) = ' + H.fmt(v, 2) + '²/(2·' + a + ') = ' + H.fmt(d, 1) + ' m' };
    } },
    { name: ['Encuentro de dos móviles', 'Two objects meeting'], gen: function (H) {
      var vA = H.int(5, 20), vB = H.int(5, 20), t = H.int(3, 12), D = (vA + vB) * t;
      return { q: H.t('Dos autos están a ' + D + ' m y avanzan uno hacia el otro a ' + vA + ' m/s y ' + vB + ' m/s. ¿Cuánto tardan en encontrarse?', 'Two cars are ' + D + ' m apart and move towards each other at ' + vA + ' m/s and ' + vB + ' m/s. How long until they meet?'), a: t, unit: 's', sol: H.t('Se acercan a ' + (vA + vB) + ' m/s: t = ' + D + ' / ' + (vA + vB) + ' = ' + t + ' s', 'They close in at ' + (vA + vB) + ' m/s: t = ' + D + ' / ' + (vA + vB) + ' = ' + t + ' s') };
    } }
  ]
});
