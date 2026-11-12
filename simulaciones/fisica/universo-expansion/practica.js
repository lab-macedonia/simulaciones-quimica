/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Si nos trasladamos a otra galaxia lejana y observamos desde allí, veremos que las demás galaxias…', 'If we move to another distant galaxy and observe from there, we will see the other galaxies…'], options: [['se acercan a nosotros', 'approaching us'], ['se alejan, más rápido las más lejanas', 'moving away, the more distant ones faster'], ['están quietas', 'standing still']], answer: 1, why: ['La expansión es del espacio mismo: cualquier observador ve la misma ley de Hubble. No hay un centro.', 'The expansion is of space itself: any observer sees the same Hubble law. There is no centre.'] },
  4: { q: ['A medida que el universo se expande, su temperatura…', 'As the universe expands, its temperature…'], options: [['disminuye', 'decreases'], ['aumenta', 'increases'], ['se mantiene', 'stays the same']], answer: 0, why: ['La energía se reparte en un volumen cada vez mayor: el universo primitivo, muy caliente, se fue enfriando y así pudieron formarse núcleos, átomos y estrellas.', 'Energy is spread over an ever larger volume: the very hot early universe cooled, allowing nuclei, atoms and stars to form.'] }
} });

/* Práctica: ley de Hubble, corrimiento al rojo, edad y tiempo de viaje de la luz. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. 1 Mpc ≈ 3,26 millones de años luz; c ≈ 300 000 km/s.', 'Problems with new values on every attempt. 1 Mpc ≈ 3.26 million light-years; c ≈ 300,000 km/s.'],
  problems: [
    { name: ['Velocidad de alejamiento', 'Recession velocity'], gen: function (H) {
      var H0 = H.pick([67, 70, 73]), d = H.int(10, 900);
      return { q: H.t('Con H₀ = ' + H0 + ' km/s/Mpc, ¿a qué velocidad se aleja una galaxia a ' + d + ' Mpc?', 'With H₀ = ' + H0 + ' km/s/Mpc, how fast does a galaxy at ' + d + ' Mpc recede?'), a: H0 * d, unit: 'km/s', sol: 'v = H₀·d = ' + H0 + '·' + d + ' = ' + H0 * d + ' km/s' };
    } },
    { name: ['Distancia por la ley de Hubble', 'Distance from Hubble’s law'], gen: function (H) {
      var v = H.int(2, 60) * 1000, H0 = 70;
      return { q: H.t('Una galaxia se aleja a ' + v + ' km/s. Con H₀ = 70 km/s/Mpc, ¿a qué distancia está?', 'A galaxy recedes at ' + v + ' km/s. With H₀ = 70 km/s/Mpc, how far away is it?'), a: v / H0, unit: 'Mpc', sol: 'd = v/H₀ = ' + v + '/70 = ' + H.fmt(v / H0, 1) + ' Mpc' };
    } },
    { name: ['Corrimiento al rojo', 'Redshift'], gen: function (H) {
      var l0 = H.pick([486.1, 656.3, 434.0]), z = H.rnd(0.005, 0.15, 3), l = l0 * (1 + z);
      return { q: H.t('Una línea del hidrógeno de ' + H.fmt(l0, 1) + ' nm se observa en ' + H.fmt(l, 1) + ' nm. ¿Cuál es el corrimiento z?', 'A hydrogen line at ' + H.fmt(l0, 1) + ' nm is observed at ' + H.fmt(l, 1) + ' nm. What is the redshift z?'), a: z, abs: 0.002, unit: '', sol: 'z = Δλ/λ = (' + H.fmt(l, 1) + ' − ' + H.fmt(l0, 1) + ')/' + H.fmt(l0, 1) + ' = ' + H.fmt(z, 3) };
    } },
    { name: ['Edad aproximada del universo', 'Approximate age of the universe'], gen: function (H) {
      var H0 = H.pick([60, 65, 67, 70, 73, 75, 80]), t = 977.8 / H0;
      return { q: H.t('Estima la edad del universo, en miles de millones de años, como 1/H₀ con H₀ = ' + H0 + ' km/s/Mpc (1/H₀ ≈ 977,8/H₀ mil millones de años).', 'Estimate the age of the universe, in billions of years, as 1/H₀ with H₀ = ' + H0 + ' km/s/Mpc (1/H₀ ≈ 977.8/H₀ billion years).'), a: t, unit: H.t('mil millones de años', 'billion years'), sol: 't ≈ ' + H.fmt(977.8, 1) + '/' + H0 + ' = ' + H.fmt(t, 2) };
    } },
    { name: ['Mirar al pasado', 'Looking into the past'], gen: function (H) {
      var d = H.int(1, 500);
      return { q: H.t('Una galaxia está a ' + d + ' Mpc. ¿Hace cuántos millones de años salió la luz que vemos hoy? (1 Mpc ≈ 3,26 millones de años luz)', 'A galaxy is ' + d + ' Mpc away. How many million years ago did the light we see today leave it? (1 Mpc ≈ 3.26 million light-years)'), a: d * 3.26, unit: H.t('millones de años', 'million years'), sol: d + ' · ' + H.fmt(3.26, 2) + ' = ' + H.fmt(d * 3.26, 0) };
    } }
  ]
});
