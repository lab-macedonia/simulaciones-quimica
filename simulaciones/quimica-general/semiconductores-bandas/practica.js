/* Práctica · Semiconductores y teoría de bandas (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Color de un LED a partir del gap', 'LED color from the band gap'], gen: function (H) {
    var Eg = H.rnd(1.6, 3.2, 2), l = 1239.84 / Eg;
    return { q: H.t('Un LED tiene E<sub>g</sub> = ' + H.fmt(Eg, 2) + ' eV. ¿Qué longitud de onda emite?', 'An LED has E<sub>g</sub> = ' + H.fmt(Eg, 2) + ' eV. What wavelength does it emit?'), a: l, unit: 'nm',
      sol: 'λ = ' + H.fmt(1239.84, 2) + ' eV·nm / E<sub>g</sub> = ' + H.sig(l, 3) + ' nm' };
  } },
  { name: ['Gap a partir de la absorción', 'Gap from the absorption edge'], gen: function (H) {
    var l = H.int(350, 1800), Eg = 1239.84 / l;
    return { q: H.t('Un semiconductor empieza a absorber luz a ' + l + ' nm. ¿Cuál es su E<sub>g</sub>?', 'A semiconductor starts absorbing light at ' + l + ' nm. What is its E<sub>g</sub>?'), a: Eg, unit: 'eV',
      sol: 'E<sub>g</sub> = ' + H.fmt(1239.84, 2) + ' / ' + l + ' = ' + H.sig(Eg, 3) + ' eV' };
  } },
  { name: ['Tipo de dopaje', 'Type of doping'], gen: function (H) {
    var d = H.pick([['P', 0], ['As', 0], ['Sb', 0], ['B', 1], ['Al', 1], ['Ga', 1]]);
    return { q: H.t('Se dopa silicio con ' + d[0] + '. ¿Qué tipo de semiconductor se obtiene?', 'Silicon is doped with ' + d[0] + '. What type of semiconductor results?'), options: [H.t('Tipo n (electrones extra)', 'n-type (extra electrons)'), H.t('Tipo p (huecos)', 'p-type (holes)')], answer: d[1],
      sol: H.t('Grupo 15 (5 e⁻ de valencia) dona electrones: tipo n. Grupo 13 (3 e⁻) deja huecos: tipo p.', 'Group 15 (5 valence e⁻) donates electrons: n-type. Group 13 (3 e⁻) leaves holes: p-type.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["Al subir la temperatura, la conductividad de un semiconductor…", "As temperature rises, the conductivity of a semiconductor…"], options: [["aumenta", "increases"], ["disminuye, como en un metal", "decreases, as in a metal"], ["no cambia", "does not change"]], answer: 0, why: ["Más electrones saltan la banda prohibida a la banda de conducción (crece como e^(−Eg/2kT)).", "More electrons cross the band gap into the conduction band (grows as e^(−Eg/2kT))."] } } });
