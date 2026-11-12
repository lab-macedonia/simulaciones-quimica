/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['A mitad de la epidemia la población reduce sus contactos en un 60 %. El número de casos…', 'Halfway through the epidemic the population cuts its contacts by 60 %. The number of cases…'], options: [['sigue creciendo igual', 'keeps growing just the same'], ['crece más lento o empieza a bajar', 'grows more slowly or starts to fall'], ['se duplica', 'doubles']], answer: 1, why: ['Menos contactos bajan R; si R efectivo queda bajo 1, los casos disminuyen.', 'Fewer contacts lower R; if the effective R falls below 1, cases decline.'] },
  4: { q: ['Ahora el 40 % de la población está vacunada. Comparado con la epidemia sin vacunas, el máximo de infectados será…', 'Now 40 % of the population is vaccinated. Compared with the epidemic without vaccines, the peak number of infected will be…'], options: [['mayor', 'higher'], ['menor', 'lower'], ['igual', 'the same']], answer: 1, why: ['Los vacunados no se infectan ni contagian: hay menos susceptibles y R efectivo es menor.', 'Vaccinated people are neither infected nor infectious: there are fewer susceptibles and the effective R is lower.'] }
} });

/* Práctica: R₀, umbral de rebaño, cadenas de contagio y defensas del cuerpo. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento.', 'Problems with new values on every attempt.'],
  problems: [
    { name: ['Umbral de inmunidad de rebaño', 'Herd immunity threshold'], gen: function (H) {
      var R0 = H.pick([1.5, 2, 2.5, 3, 4, 5, 6, 8, 12, 15]), th = (1 - 1 / R0) * 100;
      return { q: H.t('Si una enfermedad tiene R₀ = ' + H.fmt(R0, 1) + ', ¿qué porcentaje de la población debe ser inmune para la inmunidad de rebaño?', 'If a disease has R₀ = ' + H.fmt(R0, 1) + ', what percentage of the population must be immune for herd immunity?'), a: th, unit: '%', sol: '1 − 1/' + H.fmt(R0, 1) + ' = ' + H.fmt(th, 1) + ' %' };
    } },
    { name: ['Cadena de contagios', 'Chain of infections'], gen: function (H) {
      var R = H.pick([2, 3, 4]), g = H.int(2, 6), n = Math.pow(R, g);
      return { q: H.t('Si cada infectado contagia a ' + R + ' personas, ¿cuántos casos nuevos habrá en la generación ' + g + ' a partir de 1 caso?', 'If each infected person infects ' + R + ' people, how many new cases will there be in generation ' + g + ' starting from 1 case?'), a: n, unit: H.t('casos', 'cases'), sol: R + '^' + g + ' = ' + n };
    } },
    { name: ['R efectivo', 'Effective R'], gen: function (H) {
      var R0 = H.pick([2, 3, 4, 6]), im = H.int(10, 80), Re = R0 * (1 - im / 100);
      return { q: H.t('Con R₀ = ' + R0 + ' y el ' + im + ' % de la población inmune, ¿cuál es el R efectivo?', 'With R₀ = ' + R0 + ' and ' + im + ' % of the population immune, what is the effective R?'), a: Re, unit: '', sol: 'R = R₀·(1 − ' + H.fmt(im / 100, 2) + ') = ' + H.fmt(Re, 2) + (Re < 1 ? H.t(' → los casos bajan', ' → cases fall') : H.t(' → los casos suben', ' → cases rise')) };
    } },
    { name: ['Defensas del cuerpo', 'Body defences'], gen: function (H) {
      var B = [[['la piel y las mucosas', 'skin and mucous membranes'], ['barrera', 'barrier']], [['la fiebre y la inflamación', 'fever and inflammation'], ['respuesta innata', 'innate response']], [['los anticuerpos', 'antibodies'], ['respuesta adaptativa', 'adaptive response']], [['los fagocitos que engullen bacterias', 'phagocytes that engulf bacteria'], ['respuesta innata', 'innate response']], [['los linfocitos de memoria', 'memory lymphocytes'], ['respuesta adaptativa', 'adaptive response']]];
      return H.bank(B, function (it) { return H.t('¿A qué nivel de defensa pertenecen ' + it[0][0] + '?', 'Which level of defence do ' + it[0][1] + ' belong to?'); }, function (it) { return it[1]; }, null);
    } },
    { name: ['Cobertura con eficacia', 'Coverage and efficacy'], gen: function (H) {
      var R0 = H.pick([3, 4, 5, 6]), e = H.pick([0.8, 0.85, 0.9, 0.95]), c = (1 - 1 / R0) / e * 100;
      return { q: H.t('Con R₀ = ' + R0 + ' y una vacuna de eficacia ' + H.fmt(e * 100, 0) + ' %, ¿qué cobertura mínima de vacunación se necesita?', 'With R₀ = ' + R0 + ' and a vaccine with ' + H.fmt(e * 100, 0) + ' % efficacy, what minimum vaccination coverage is needed?'), a: Math.min(100, c), unit: '%', sol: '(1 − 1/' + R0 + ')/' + H.fmt(e, 2) + ' = ' + H.fmt(c, 1) + ' %' + (c > 100 ? H.t(' (imposible solo con vacunación)', ' (impossible with vaccination alone)') : '') };
    } }
  ]
});
