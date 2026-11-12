/* Práctica · Cifras significativas e incertidumbre (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Contar cifras significativas', 'Counting significant figures'], gen: function (H) {
    var c = H.pick([['0,00450', '0.00450', 3], ['12,30', '12.30', 4], ['1005', '1005', 4], ['2,0 × 10³', '2.0 × 10³', 2], ['0,1020', '0.1020', 4], ['300,0', '300.0', 4], ['6,022 × 10²³', '6.022 × 10²³', 4], ['0,07', '0.07', 1]]);
    return { q: H.t('¿Cuántas cifras significativas tiene ' + c[0] + '?', 'How many significant figures does ' + c[1] + ' have?'), a: c[2], abs: 0, aText: String(c[2]),
      sol: H.t('Los ceros a la izquierda no cuentan; los ceros entre dígitos y los finales tras la coma sí.', 'Leading zeros do not count; zeros between digits and trailing zeros after the decimal point do.') };
  } },
  { name: ['Incertidumbre relativa de un producto', 'Relative uncertainty of a product'], gen: function (H) {
    var f = H.fmt, m = H.rnd(5, 50, 2), dm = H.pick([0.01, 0.02, 0.05]), V = H.rnd(5, 25, 2), dV = H.pick([0.02, 0.05, 0.1]), r = Math.sqrt(Math.pow(dm / m, 2) + Math.pow(dV / V, 2)) * 100;
    return { q: H.t('La densidad se calcula como m/V con m = ' + f(m, 2) + ' ± ' + f(dm, 2) + ' g y V = ' + f(V, 2) + ' ± ' + f(dV, 2) + ' mL. ¿Cuál es la incertidumbre relativa de la densidad (en %, suma en cuadratura)?', 'Density is m/V with m = ' + f(m, 2) + ' ± ' + f(dm, 2) + ' g and V = ' + f(V, 2) + ' ± ' + f(dV, 2) + ' mL. What is the relative uncertainty of the density (in %, added in quadrature)?'), a: r, unit: '%', tol: 0.03,
      sol: '√((' + f(dm, 2) + '/' + f(m, 2) + ')² + (' + f(dV, 2) + '/' + f(V, 2) + ')²) × 100 = ' + H.sig(r, 2) + ' %' };
  } },
  { name: ['Promedio y desviación estándar', 'Mean and standard deviation'], gen: function (H) {
    var f = H.fmt, b = H.rnd(9, 11, 2), x = [0, 1, 2, 3].map(function () { return +(b + H.rnd(-0.08, 0.08, 2)).toFixed(2); }), m = x.reduce(function (a, v) { return a + v; }, 0) / 4, s = Math.sqrt(x.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / 3);
    if (s < 0.005) return null;
    return { q: H.t('Cuatro titulaciones gastan ' + x.map(function (v) { return f(v, 2); }).join('; ') + ' mL. ¿Cuál es la desviación estándar?', 'Four titrations use ' + x.map(function (v) { return f(v, 2); }).join('; ') + ' mL. What is the standard deviation?'), a: s, unit: 'mL', tol: 0.04,
      sol: H.t('Promedio = ', 'Mean = ') + f(m, 3) + ' mL; s = √(Σ(x − x̄)²/(n − 1)) = ' + H.sig(s, 2) + ' mL' };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 3: { q: ["¿Cuánto es 12,1 + 3,456 con las cifras correctas?", "What is 12.1 + 3.456 with the correct figures?"], options: [["15,6", "15.6"], ["15,556", "15.556"], ["15,56", "15.56"], ["16", "16"]], answer: 0, why: ["En una suma manda el menor número de decimales (uno, por 12,1).", "In a sum the fewest decimal places rule (one, from 12.1)."] } } });
