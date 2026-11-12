/* Práctica · Radiación electromagnética (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Frecuencia a partir de λ', 'Frequency from λ'], gen: function (H) {
    var r = H.pick([['nm', 1e-9, 200, 900], ['µm', 1e-6, 2, 50], ['cm', 1e-2, 1, 30], ['m', 1, 1, 300]]), l = H.int(r[2], r[3]), nu = 2.998e8 / (l * r[1]);
    return { q: H.t('¿Qué frecuencia tiene una onda electromagnética de ' + l + ' ' + r[0] + '? (escribe por ejemplo 3,0e14)', 'What is the frequency of an electromagnetic wave of ' + l + ' ' + r[0] + '? (write e.g. 3.0e14)'), a: nu, unit: 'Hz',
      sol: 'ν = c/λ = ' + H.sig(2.998e8, 4) + ' / ' + H.sig(l * r[1], 3) + ' = ' + H.sig(nu, 3) + ' Hz' };
  } },
  { name: ['Energía de un fotón', 'Photon energy'], gen: function (H) {
    var l = H.int(100, 1500), E = 1239.84 / l;
    return { q: H.t('¿Cuál es la energía de un fotón de ' + l + ' nm, en eV?', 'What is the energy of a ' + l + ' nm photon, in eV?'), a: E, unit: 'eV',
      sol: 'E = hc/λ = ' + H.fmt(1239.84, 2) + ' eV·nm / ' + l + ' nm = ' + H.sig(E, 3) + ' eV' };
  } },
  { name: ['Región del espectro', 'Region of the spectrum'], gen: function (H) {
    var R = [[H.t('Rayos gamma', 'Gamma rays'), 0.001], [H.t('Rayos X', 'X-rays'), 1], [H.t('Ultravioleta', 'Ultraviolet'), 250], [H.t('Visible', 'Visible'), 550], [H.t('Infrarrojo', 'Infrared'), 10000], [H.t('Microondas', 'Microwaves'), 1e7], [H.t('Radio', 'Radio'), 1e10]], k = H.int(0, 6);
    var ops = [k].concat(H.shuffle([0, 1, 2, 3, 4, 5, 6].filter(function (x) { return x !== k; })).slice(0, 3));
    return { q: H.t('Una radiación tiene λ ≈ ' + H.sig(R[k][1], 1) + ' nm. ¿A qué región pertenece?', 'A radiation has λ ≈ ' + H.sig(R[k][1], 1) + ' nm. Which region does it belong to?'), options: ops.map(function (i) { return R[i][0]; }), answer: 0,
      sol: H.t('De menor a mayor λ: γ, X, UV, visible (400–700 nm), IR, microondas, radio.', 'From shorter to longer λ: γ, X, UV, visible (400–700 nm), IR, microwaves, radio.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 1: { q: ["Si la longitud de onda se duplica, la energía de cada fotón…", "If the wavelength doubles, the energy of each photon…"], options: [["se reduce a la mitad", "halves"], ["se duplica", "doubles"], ["no cambia", "does not change"]], answer: 0, why: ["E = hc/λ: la energía es inversamente proporcional a la longitud de onda.", "E = hc/λ: energy is inversely proportional to wavelength."] } } });
