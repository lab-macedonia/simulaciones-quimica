/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Si se aplica menos de 1,23 V a la celda…', 'If less than 1.23 V is applied to the cell…'], options: [['se forma H₂ lentamente', 'H₂ forms slowly'], ['no hay electrólisis apreciable', 'there is no appreciable electrolysis'], ['solo se forma O₂', 'only O₂ forms']], answer: 1, why: ['La descomposición del agua no es espontánea (E° = −1,23 V); además hay que vencer el sobrepotencial, así que bajo ese voltaje no circula corriente apreciable.', 'Water splitting is non-spontaneous (E° = −1.23 V); the overpotential must also be overcome, so below that voltage no appreciable current flows.'] },
  3: { q: ['Por cada 2 volúmenes de H₂, ¿cuántos volúmenes de O₂ se forman?', 'For every 2 volumes of H₂, how many volumes of O₂ form?'], options: [['2', '2'], ['4', '4'], ['1', '1']], answer: 2, why: ['4 e⁻ producen 2 H₂ y 1 O₂; a igual T y P el volumen es proporcional a los moles (Avogadro): 2 : 1.', '4 e⁻ produce 2 H₂ and 1 O₂; at the same T and P volume is proportional to moles (Avogadro): 2 : 1.'] }
} });

/* Práctica · Electrólisis del agua y leyes de Faraday (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Volumen de H₂ producido', 'Volume of H₂ produced'], gen: function (H) {
    var f = H.fmt, I = H.rnd(0.2, 3, 2), min = H.int(5, 120), Q = I * min * 60, n = Q / 96485 / 2, V = n * 24.47;
    return { q: H.t('Se electroliza agua con ' + f(I, 2) + ' A durante ' + min + ' min. ¿Qué volumen de H₂ se obtiene a 25 °C y 1 atm (24,47 L/mol)?', 'Water is electrolyzed at ' + f(I, 2) + ' A for ' + min + ' min. What volume of H₂ is obtained at 25 °C and 1 atm (24.47 L/mol)?'), a: V * 1000, unit: 'mL',
      sol: 'Q = I·t = ' + f(Q, 0) + ' C; n(e⁻) = Q/F = ' + H.sig(Q / 96485, 3) + ' mol; n(H₂) = n(e⁻)/2 = ' + H.sig(n, 3) + ' mol; V = ' + H.sig(V * 1000, 3) + ' mL' };
  } },
  { name: ['Tiempo para una cantidad de O₂', 'Time for an amount of O₂'], gen: function (H) {
    var f = H.fmt, I = H.rnd(0.5, 5, 2), m = H.rnd(0.1, 3, 2), n = m / 32, t = n * 4 * 96485 / I / 60;
    return { q: H.t('¿Cuántos minutos se necesitan para producir ' + f(m, 2) + ' g de O₂ con una corriente de ' + f(I, 2) + ' A?', 'How many minutes are needed to produce ' + f(m, 2) + ' g of O₂ with a current of ' + f(I, 2) + ' A?'), a: t, unit: 'min',
      sol: 'n(O₂) = ' + H.sig(n, 3) + ' mol; 2 H₂O → O₂ + 4 H⁺ + 4 e⁻: n(e⁻) = 4n; t = 4nF/I = ' + H.sig(t * 60, 3) + ' s = ' + H.sig(t, 3) + ' min', hint: H.t('Se necesitan 4 electrones por molécula de O₂.', 'Four electrons are needed per O₂ molecule.') };
  } },
  { name: ['Relación de volúmenes', 'Volume ratio'], gen: function (H) {
    var v = H.rnd(5, 60, 1);
    return { q: H.t('En el ánodo se recogen ' + H.fmt(v, 1) + ' mL de O₂. ¿Qué volumen de H₂ se recoge en el cátodo en las mismas condiciones?', H.fmt(v, 1) + ' mL of O₂ are collected at the anode. What volume of H₂ is collected at the cathode under the same conditions?'), a: 2 * v, unit: 'mL',
      sol: '2 H₂O → 2 H₂ + O₂: ' + H.t('el doble de volumen de H₂ = ', 'twice the volume of H₂ = ') + H.fmt(2 * v, 1) + ' mL' };
  } }
] });
