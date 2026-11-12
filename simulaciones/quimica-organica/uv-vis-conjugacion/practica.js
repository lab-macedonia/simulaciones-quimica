/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Al aumentar el número de dobles enlaces conjugados, λmáx…', 'As the number of conjugated double bonds increases, λmax…'], options: [['disminuye', 'decreases'], ['no cambia', 'does not change'], ['aumenta', 'increases']], answer: 2, why: ['La conjugación acerca HOMO y LUMO: menor gap, fotón de menor energía y mayor longitud de onda (desplazamiento batocrómico).', 'Conjugation brings HOMO and LUMO closer: smaller gap, lower-energy photon and longer wavelength (bathochromic shift).'] },
  3: { q: ['Cada grupo alquilo añadido al cromóforo desplaza λmáx…', 'Each alkyl group added to the chromophore shifts λmax…'], options: [['a mayor longitud de onda (≈ +5 nm)', 'to a longer wavelength (≈ +5 nm)'], ['a menor longitud de onda', 'to a shorter wavelength'], ['nada: no forma parte del sistema π', 'not at all: it is not part of the π system']], answer: 0, why: ['Según las reglas de Woodward–Fieser, cada alquilo sobre un carbono sp² suma unos 5 nm por hiperconjugación.', 'By the Woodward–Fieser rules, each alkyl on an sp² carbon adds about 5 nm through hyperconjugation.'] }
} });

/* Práctica · UV-Vis y conjugación (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Concentración con Beer–Lambert', 'Concentration with Beer–Lambert'], gen: function (H) {
    var c = H.pick([['β-caroteno', 'β-carotene', 139000], ['1,3-butadieno', '1,3-butadiene', 21000], ['licopeno', 'lycopene', 185000], ['hexatrieno', 'hexatriene', 43000]]), A = H.rnd(0.1, 1.2, 3), x = A / c[2];
    return { q: H.t('Una disolución de ' + c[0] + ' (ε = ' + c[2] + ' L·mol⁻¹·cm⁻¹) da A = ' + H.fmt(A, 3) + ' en 1 cm. ¿Cuál es su concentración?', 'A ' + c[1] + ' solution (ε = ' + c[2] + ' L·mol⁻¹·cm⁻¹) gives A = ' + H.fmt(A, 3) + ' in 1 cm. What is its concentration?'), a: x, unit: 'mol/L',
      sol: 'c = A/(ε·b) = ' + H.fmt(A, 3) + ' / ' + c[2] + ' = ' + H.sig(x, 3) + ' mol/L' };
  } },
  { name: ['Energía del gap HOMO–LUMO', 'HOMO–LUMO gap energy'], gen: function (H) {
    var l = H.int(170, 520), E = 1239.84 / l;
    return { q: H.t('Un polieno absorbe con λ<sub>máx</sub> = ' + l + ' nm. ¿Cuál es la energía de la transición π → π*, en eV?', 'A polyene absorbs at λ<sub>max</sub> = ' + l + ' nm. What is the energy of the π → π* transition, in eV?'), a: E, unit: 'eV',
      sol: 'E = ' + H.fmt(1239.84, 2) + ' / λ = ' + H.sig(E, 3) + ' eV' };
  } },
  { name: ['Conjugación y λmáx', 'Conjugation and λmax'], gen: function (H) {
    var k = H.int(0, 1);
    return { q: H.t('Al alargar el sistema conjugado de un polieno, λ<sub>máx</sub>…', 'As a polyene\'s conjugated system gets longer, λ<sub>max</sub>…'), options: [H.t('Aumenta (se corre al rojo) porque el gap disminuye', 'Increases (red shift) because the gap shrinks'), H.t('Disminuye porque el gap aumenta', 'Decreases because the gap grows'), H.t('No cambia', 'Does not change')], answer: 0,
      sol: H.t('Más dobles enlaces conjugados → orbitales π más juntos → menor ΔE → mayor λ. Con unos 8 o más aparece color.', 'More conjugated double bonds → closer π orbitals → smaller ΔE → longer λ. With about 8 or more, color appears.') };
  } }
] });
