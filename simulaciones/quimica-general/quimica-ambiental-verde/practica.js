/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Sin gases de efecto invernadero, la temperatura media de la Tierra sería cercana a…', 'Without greenhouse gases, Earth’s mean temperature would be about…'], options: [['+15 °C, como ahora', '+15 °C, as now'], ['−18 °C', '−18 °C'], ['+40 °C', '+40 °C']], answer: 1, why: ['Los gases de efecto invernadero absorben y reemiten el IR terrestre; sin ellos la media bajaría de ≈ +15 °C a ≈ −18 °C.', 'Greenhouse gases absorb and re-emit Earth’s IR; without them the mean would drop from ≈ +15 °C to ≈ −18 °C.'] },
  3: { q: ['¿Qué tipo de reacción tiene una economía atómica del 100 %?', 'Which type of reaction has 100 % atom economy?'], options: [['Una sustitución', 'A substitution'], ['Una eliminación', 'An elimination'], ['Una adición (por ejemplo, Diels–Alder o hidrogenación)', 'An addition (e.g. Diels–Alder or hydrogenation)']], answer: 2, why: ['En una adición todos los átomos de los reactivos terminan en el producto; las sustituciones y eliminaciones generan subproductos.', 'In an addition every reactant atom ends up in the product; substitutions and eliminations produce by-products.'] }
} });

/* Práctica · Química ambiental y verde (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Economía atómica', 'Atom economy'], gen: function (H) {
    var r = H.pick([['C₂H₄ + H₂O → C₂H₅OH', 46.07, 28.05 + 18.02], ['CaCO₃ → CaO + CO₂', 56.08, 100.09], ['C₆H₅OH + (CH₃CO)₂O → C₈H₈O₂ + CH₃COOH', 136.15, 94.11 + 102.09], ['N₂ + 3 H₂ → 2 NH₃', 34.06, 28.02 + 6.05], ['CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O', 88.11, 60.05 + 46.07]]), e = r[1] / r[2] * 100;
    return { q: H.t('Calcula la economía atómica de ' + r[0] + ' (producto deseado: el primero; M = ' + H.fmt(r[1], 2) + ' g/mol; masa de reactivos = ' + H.fmt(r[2], 2) + ' g/mol).', 'Calculate the atom economy of ' + r[0] + ' (desired product: the first; M = ' + H.fmt(r[1], 2) + ' g/mol; reactant mass = ' + H.fmt(r[2], 2) + ' g/mol).'), a: e, unit: '%', tol: 0.01,
      sol: H.t('EA = M(producto) / Σ M(reactivos) × 100 = ', 'AE = M(product) / Σ M(reactants) × 100 = ') + H.sig(e, 3) + ' %' };
  } },
  { name: ['Factor E', 'E-factor'], gen: function (H) {
    var p = H.rnd(1, 100, 1), w = H.rnd(1, 500, 1), E = w / p;
    return { q: H.t('Un proceso produce ' + H.fmt(p, 1) + ' kg de producto y ' + H.fmt(w, 1) + ' kg de residuos. ¿Cuál es su factor E?', 'A process makes ' + H.fmt(p, 1) + ' kg of product and ' + H.fmt(w, 1) + ' kg of waste. What is its E-factor?'), a: E, tol: 0.02,
      sol: 'E = ' + H.t('masa de residuos / masa de producto', 'mass of waste / mass of product') + ' = ' + H.sig(E, 3) };
  } },
  { name: ['pH de la lluvia ácida', 'pH of acid rain'], gen: function (H) {
    var c = +(Math.pow(10, H.rnd(-5.5, -3.5, 2))).toPrecision(2), pH = -Math.log10(2 * c);
    return { q: H.t('El agua de lluvia contiene ' + H.sig(c, 2) + ' M de H₂SO₄ (disociado por completo). ¿Cuál es su pH?', 'Rainwater contains ' + H.sig(c, 2) + ' M H₂SO₄ (fully dissociated). What is its pH?'), a: pH, abs: 0.03, aText: H.fmt(pH, 2),
      sol: '[H⁺] = 2 × ' + H.sig(c, 2) + ' = ' + H.sig(2 * c, 2) + ' M; pH = ' + H.fmt(pH, 2) };
  } }
] });
