/* Práctica y predicciones · Teoría del campo cristalino. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* Ocupación octaédrica [t2g, eg] para dⁿ en alto y bajo espín */
  function occ(n, low) {
    var t = 0, e = 0, i;
    if (low) { for (i = 0; i < n; i++) { if (t < 6) t++; else e++; } }
    else { for (i = 0; i < n; i++) { if (i < 3) t++; else if (i < 5) e++; else if (i < 8) t++; else e++; } }
    return [t, e];
  }
  function unpaired(t, e) { var ut = t <= 3 ? t : 6 - t, ue = e <= 2 ? e : 4 - e; return ut + ue; }
  var ION = [['Cr³⁺', 3], ['Mn²⁺', 5], ['Fe²⁺', 6], ['Fe³⁺', 5], ['Co²⁺', 7], ['Co³⁺', 6], ['Ni²⁺', 8], ['Cu²⁺', 9], ['Ti³⁺', 1], ['V³⁺', 2], ['Mn³⁺', 4], ['Cr²⁺', 4]];
  var COL = [[400, 435, ['violeta', 'violet'], ['amarillo verdoso', 'yellow-green']], [435, 480, ['azul', 'blue'], ['amarillo', 'yellow']], [480, 490, ['azul verdoso', 'green-blue'], ['naranjo', 'orange']], [490, 500, ['verde azulado', 'blue-green'], ['rojo', 'red']], [500, 560, ['verde', 'green'], ['púrpura', 'purple']], [560, 580, ['amarillo verdoso', 'yellow-green'], ['violeta', 'violet']], [580, 595, ['amarillo', 'yellow'], ['azul', 'blue']], [595, 650, ['naranjo', 'orange'], ['azul verdoso', 'green-blue']], [650, 750, ['rojo', 'red'], ['verde azulado', 'blue-green']]];
  SimAula.register({
    problems: [
      { name: ['EECC de un complejo octaédrico', 'CFSE of an octahedral complex'], gen: function (H) {
        var t = H.t, f = H.fmt, I = H.pick(ION), d = I[1], low = H.pick([true, false]); if ((d < 4 || d > 7) && low) low = false;
        var Do = H.int(100, 400), o = occ(d, low), E = (-0.4 * o[0] + 0.6 * o[1]) * Do;
        return { q: t('Calcula la EECC (sin contar la energía de apareamiento) del complejo octaédrico de ' + I[0] + ' (d' + H.sup(d) + ') ' + (d >= 4 && d <= 7 ? (low ? 'de bajo espín' : 'de alto espín') : '') + ' con Δo = ' + Do + ' kJ/mol.', 'Calculate the CFSE (ignoring pairing energy) of the ' + (d >= 4 && d <= 7 ? (low ? 'low-spin ' : 'high-spin ') : '') + 'octahedral complex of ' + I[0] + ' (d' + H.sup(d) + ') with Δo = ' + Do + ' kJ/mol.'), a: E, unit: 'kJ/mol', abs: Math.max(0.5, Math.abs(E) * 0.01),
          sol: 't₂g' + H.sup(o[0]) + ' e<sub>g</sub>' + H.sup(o[1]) + ': ' + t('EECC', 'CFSE') + ' = (−' + f(0.4, 1) + ' × ' + o[0] + ' + ' + f(0.6, 1) + ' × ' + o[1] + ')·Δo = ' + f(-0.4 * o[0] + 0.6 * o[1], 1) + ' × ' + Do + ' = ' + f(E, 0) + ' kJ/mol', aText: f(E, 0) };
      } },
      { name: ['Electrones desapareados', 'Unpaired electrons'], gen: function (H) {
        var t = H.t, I = H.pick(ION), d = I[1], lig = H.pick([['CN⁻', true], ['CO', true], ['H₂O', false], ['F⁻', false], ['NH₃', null], ['Cl⁻', false]]); var low = lig[1];
        if (low === null) low = (I[0] === 'Co³⁺'); var o = occ(d, low), u = unpaired(o[0], o[1]);
        return { q: t('¿Cuántos electrones desapareados tiene el complejo octaédrico [M(' + lig[0] + ')₆] con M = ' + I[0] + ' (d' + H.sup(d) + ')? ' + (low ? '(' + lig[0] + ': campo fuerte, bajo espín)' : '(' + lig[0] + ': campo débil, alto espín)'), 'How many unpaired electrons does the octahedral complex [M(' + lig[0] + ')₆] with M = ' + I[0] + ' (d' + H.sup(d) + ') have? ' + (low ? '(' + lig[0] + ': strong field, low spin)' : '(' + lig[0] + ': weak field, high spin)')), a: u, unit: '', abs: 0,
          sol: 't₂g' + H.sup(o[0]) + ' e<sub>g</sub>' + H.sup(o[1]) + ' → ' + u + t(' desapareados; μ ≈ √(n(n+2)) = ', ' unpaired; μ ≈ √(n(n+2)) = ') + H.fmt(Math.sqrt(u * (u + 2)), 2) + ' μ<sub>B</sub>', aText: String(u) };
      } },
      { name: ['Δo, longitud de onda y color', 'Δo, wavelength and color'], gen: function (H) {
        var t = H.t, f = H.fmt, lam = H.int(410, 720), D = 1e7 / lam, c = COL.filter(function (x) { return lam >= x[0] && lam < x[1]; })[0] || COL[COL.length - 1];
        var k = H.int(0, 1);
        if (k === 0) return { q: t('Un complejo tiene Δo = ' + f(D, 0) + ' cm⁻¹. ¿A qué longitud de onda absorbe (en nm)?', 'A complex has Δo = ' + f(D, 0) + ' cm⁻¹. At what wavelength does it absorb (in nm)?'), a: lam, unit: 'nm', tol: 0.01,
          sol: 'λ = 10⁷ / Δo(cm⁻¹) = 10⁷ / ' + f(D, 0) + ' = ' + f(lam, 0) + ' nm' };
        var ops = [c[3]].concat(H.shuffle(COL.filter(function (x) { return H.L(x[3]) !== H.L(c[3]); })).slice(0, 3).map(function (x) { return x[3]; }));
        return { q: t('Un complejo absorbe luz de ' + lam + ' nm (' + H.L(c[2]) + '). ¿De qué color se ve la disolución?', 'A complex absorbs light at ' + lam + ' nm (' + H.L(c[2]) + '). What color does the solution look?'), options: ops.map(H.L), answer: 0,
          sol: t('Se ve el color complementario del absorbido (opuesto en la rueda de colores).', 'You see the complementary color of the one absorbed (opposite on the color wheel).') };
      } }
    ],
    predict: {
      3: { q: ['[Fe(CN)₆]⁴⁻ es d⁶ con un ligando de campo fuerte. ¿Cuántos electrones desapareados tendrá?', '[Fe(CN)₆]⁴⁻ is d⁶ with a strong-field ligand. How many unpaired electrons will it have?'],
        options: [['0', '0'], ['4', '4'], ['2', '2'], ['6', '6']], answer: 0,
        why: ['Con Δo mayor que la energía de apareamiento los seis electrones llenan t₂g (t₂g⁶ e<sub>g</sub>⁰): bajo espín y diamagnético.', 'With Δo larger than the pairing energy the six electrons fill t₂g (t₂g⁶ e<sub>g</sub>⁰): low spin and diamagnetic.'] },
      5: { q: ['Si un complejo absorbe luz roja (~650 nm), ¿de qué color se verá?', 'If a complex absorbs red light (~650 nm), what color will it look?'],
        options: [['Verde azulado', 'Blue-green'], ['Rojo', 'Red'], ['Amarillo', 'Yellow'], ['Incoloro', 'Colorless']], answer: 0,
        why: ['El ojo percibe la luz que no se absorbe: el complementario del rojo es el verde azulado.', 'The eye perceives the light that is not absorbed: the complement of red is blue-green.'] },
      2: { q: ['Si se cambia H₂O por CN⁻ en un complejo octaédrico, ¿qué pasa con Δo?', 'If H₂O is replaced by CN⁻ in an octahedral complex, what happens to Δo?'],
        options: [['Aumenta mucho', 'It increases a lot'], ['Disminuye', 'It decreases'], ['No cambia', 'It does not change'], ['Se vuelve cero', 'It becomes zero']], answer: 0,
        why: ['El CN⁻ está al final de la serie espectroquímica (aceptor π): produce un desdoblamiento mucho mayor que el H₂O.', 'CN⁻ is at the top of the spectrochemical series (π acceptor): it produces a much larger splitting than H₂O.'] }
    }
  });
})();
