/* Práctica · Transiciones electrónicas y átomo de Bohr (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Longitud de onda de una transición', 'Wavelength of a transition'], gen: function (H) {
    var sp = H.pick([['H', 1], ['He⁺', 2], ['Li²⁺', 3]]), n1 = H.int(1, 3), n2 = n1 + H.int(1, 4), inv = 1.0968e7 * sp[1] * sp[1] * (1 / (n1 * n1) - 1 / (n2 * n2)), lam = 1e9 / inv;
    return { q: H.t('¿Qué longitud de onda emite el ' + sp[0] + ' (Z = ' + sp[1] + ') cuando el electrón pasa de n = ' + n2 + ' a n = ' + n1 + '?', 'What wavelength does ' + sp[0] + ' (Z = ' + sp[1] + ') emit when the electron drops from n = ' + n2 + ' to n = ' + n1 + '?'), a: lam, unit: 'nm', tol: 0.01,
      sol: '1/λ = R<sub>H</sub>Z²(1/n₁² − 1/n₂²) = ' + H.sig(1.0968e7, 5) + ' × ' + sp[1] * sp[1] + ' × (1/' + n1 * n1 + ' − 1/' + n2 * n2 + ') = ' + H.sig(inv, 4) + ' m⁻¹ → λ = ' + H.sig(lam, 4) + ' nm' };
  } },
  { name: ['Energía de un nivel', 'Energy of a level'], gen: function (H) {
    var sp = H.pick([['H', 1], ['He⁺', 2], ['Li²⁺', 3]]), n = H.int(1, 5), E = -13.6 * sp[1] * sp[1] / (n * n);
    return { q: H.t('¿Cuál es la energía del nivel n = ' + n + ' del ' + sp[0] + '?', 'What is the energy of level n = ' + n + ' of ' + sp[0] + '?'), a: E, unit: 'eV',
      sol: 'Eₙ = −' + H.fmt(13.6, 1) + ' eV · Z²/n² = −' + H.fmt(13.6, 1) + ' × ' + sp[1] * sp[1] + ' / ' + n * n + ' = ' + H.sig(E, 3) + ' eV' };
  } },
  { name: ['Serie espectral', 'Spectral series'], gen: function (H) {
    var k = H.int(0, 2), n1 = k + 1;
    return { q: H.t('Las líneas que terminan en n = ' + n1 + ' en el hidrógeno forman la serie de…', 'Hydrogen lines ending at n = ' + n1 + ' form the … series'), options: ['Lyman', 'Balmer', 'Paschen'], answer: k,
      sol: H.t('Lyman (n = 1, ultravioleta), Balmer (n = 2, visible), Paschen (n = 3, infrarrojo).', 'Lyman (n = 1, ultraviolet), Balmer (n = 2, visible), Paschen (n = 3, infrared).') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 1: { q: ["¿Qué salto del hidrógeno emite el fotón más energético?", "Which hydrogen jump emits the most energetic photon?"], options: [["n = 2 → n = 1", "n = 2 → n = 1"], ["n = 3 → n = 2", "n = 3 → n = 2"], ["n = 4 → n = 3", "n = 4 → n = 3"]], answer: 0, why: ["Los niveles se juntan al subir n: el salto al nivel 1 es el mayor (serie de Lyman, ultravioleta).", "Levels crowd together as n rises: the jump to level 1 is the largest (Lyman series, ultraviolet)."] } } });
