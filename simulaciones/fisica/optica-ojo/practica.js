/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Acercamos el objeto más que el foco. ¿Qué imagen se forma?', 'We bring the object closer than the focus. What image forms?'], options: [['real e invertida', 'real and inverted'], ['virtual, derecha y aumentada', 'virtual, upright and magnified'], ['ninguna', 'none']], answer: 1, why: ['Los rayos salen divergentes; sus prolongaciones se cruzan del mismo lado del objeto: imagen virtual de lupa.', 'The rays leave diverging; their extensions cross on the object’s side: a virtual magnifier image.'] },
  4: { q: ['En un ojo miope, la imagen de un objeto lejano se forma…', 'In a short-sighted eye, the image of a distant object forms…'], options: [['sobre la retina', 'on the retina'], ['delante de la retina', 'in front of the retina'], ['detrás de la retina', 'behind the retina']], answer: 1, why: ['El ojo es más largo de lo normal: los rayos se cruzan antes de llegar a la retina.', 'The eye is longer than normal: the rays cross before reaching the retina.'] }
} });

/* Práctica: ecuación de la lente delgada, aumento, potencia y corrección visual. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento. Las distancias en cm; la potencia en dioptrías (D = 1/f, f en metros).', 'Problems with new values on every attempt. Distances in cm; power in dioptres (D = 1/f, f in metres).'],
  problems: [
    { name: ['Ecuación de la lente', 'Lens equation'], gen: function (H) {
      var f = H.int(5, 25), d = f + H.int(2, 50), di = 1 / (1 / f - 1 / d);
      return { q: H.t('Un objeto está a ' + d + ' cm de una lente convergente de f = ' + f + ' cm. ¿A qué distancia se forma la imagen?', 'An object is ' + d + ' cm from a converging lens with f = ' + f + ' cm. How far away does the image form?'), a: di, unit: 'cm', sol: '1/dᵢ = 1/' + f + ' − 1/' + d + ' → dᵢ = ' + H.fmt(di, 2) + ' cm' };
    } },
    { name: ['Aumento', 'Magnification'], gen: function (H) {
      var f = H.int(5, 20), d = f + H.int(2, 40), di = 1 / (1 / f - 1 / d), m = -di / d;
      return { q: H.t('Con f = ' + f + ' cm y el objeto a ' + d + ' cm, ¿cuál es el aumento m de la imagen?', 'With f = ' + f + ' cm and the object at ' + d + ' cm, what is the magnification m of the image?'), a: m, abs: 0.02, unit: '', sol: 'dᵢ = ' + H.fmt(di, 2) + ' cm · m = −dᵢ/dₒ = ' + H.fmt(m, 3) + H.t(' (negativo: invertida)', ' (negative: inverted)') };
    } },
    { name: ['Potencia de una lente', 'Power of a lens'], gen: function (H) {
      if (Math.random() < 0.5) { var f = H.pick([10, 20, 25, 40, 50, 100, 200]); return { q: H.t('¿Qué potencia tiene una lente convergente de f = ' + f + ' cm?', 'What is the power of a converging lens with f = ' + f + ' cm?'), a: 100 / f, unit: 'D', sol: 'P = 1/f = 1/' + H.fmt(f / 100, 2) + ' m = ' + H.fmt(100 / f, 2) + ' D' }; }
      var P = H.pick([-4, -2.5, -2, -1, 1, 2, 2.5, 4]); return { q: H.t('Una lente tiene ' + H.fmt(P, 1) + ' D. ¿Cuál es su distancia focal, en cm?', 'A lens has ' + H.fmt(P, 1) + ' D. What is its focal length, in cm?'), a: 100 / P, unit: 'cm', sol: 'f = 1/P = 1/' + H.fmt(P, 1) + ' m = ' + H.fmt(100 / P, 1) + ' cm' };
    } },
    { name: ['Tipo de imagen', 'Type of image'], gen: function (H) {
      var f = H.int(8, 20), d = H.pick([0.5, 1.5, 2.5, 3]) * f, r = d < f ? ['virtual, derecha y mayor', 'virtual, upright and larger'] : d < 2 * f ? ['real, invertida y mayor', 'real, inverted and larger'] : ['real, invertida y menor', 'real, inverted and smaller'];
      return H.mc(H.t('Un objeto está a ' + H.fmt(d, 1) + ' cm de una lente de f = ' + f + ' cm. La imagen es…', 'An object is ' + H.fmt(d, 1) + ' cm from a lens with f = ' + f + ' cm. The image is…'), r, [['virtual, derecha y mayor', 'virtual, upright and larger'], ['real, invertida y mayor', 'real, inverted and larger'], ['real, invertida y menor', 'real, inverted and smaller']], H.t('Compara dₒ con f y con 2f.', 'Compare dₒ with f and with 2f.'));
    } },
    { name: ['Corrección de la vista', 'Correcting vision'], gen: function (H) {
      var c = H.pick([[['miopía', 'myopia'], ['divergente (negativa)', 'diverging (negative)']], [['hipermetropía', 'hyperopia'], ['convergente (positiva)', 'converging (positive)']], [['presbicia', 'presbyopia'], ['convergente (positiva)', 'converging (positive)']]]);
      return H.mc(H.t('Para corregir la ' + c[0][0] + ' se usa una lente…', 'To correct ' + c[0][1] + ' you use a … lens'), c[1], [['divergente (negativa)', 'diverging (negative)'], ['convergente (positiva)', 'converging (positive)'], ['plana', 'flat']], H.t('Miopía: el foco queda delante de la retina; hipermetropía y presbicia: detrás o sin poder acomodar.', 'Myopia: the focus falls in front of the retina; hyperopia and presbyopia: behind it or without enough accommodation.'));
    } }
  ]
});
