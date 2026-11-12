/* Práctica · Destilación y ley de Raoult (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Composición del vapor', 'Vapor composition'], gen: function (H) {
    var PA = H.int(200, 700), PB = H.int(40, PA - 60), x = H.rnd(0.1, 0.9, 2), P = x * PA + (1 - x) * PB, y = x * PA / P;
    return { q: H.t('Una mezcla ideal tiene x<sub>A</sub> = ' + H.fmt(x, 2) + ' en el líquido, con P°<sub>A</sub> = ' + PA + ' mmHg y P°<sub>B</sub> = ' + PB + ' mmHg. ¿Cuál es la fracción molar de A en el vapor?', 'An ideal mixture has x<sub>A</sub> = ' + H.fmt(x, 2) + ' in the liquid, with P°<sub>A</sub> = ' + PA + ' mmHg and P°<sub>B</sub> = ' + PB + ' mmHg. What is the mole fraction of A in the vapor?'), a: y, abs: 0.006, aText: H.fmt(y, 3),
      sol: 'P = x<sub>A</sub>P°<sub>A</sub> + x<sub>B</sub>P°<sub>B</sub> = ' + H.fmt(P, 1) + ' mmHg; y<sub>A</sub> = x<sub>A</sub>P°<sub>A</sub>/P = ' + H.fmt(y, 3) };
  } },
  { name: ['Presión total de la mezcla', 'Total pressure of the mixture'], gen: function (H) {
    var PA = H.int(200, 700), PB = H.int(40, 200), x = H.rnd(0.1, 0.9, 2), P = x * PA + (1 - x) * PB;
    return { q: H.t('¿Cuál es la presión de vapor total de una mezcla ideal con x<sub>A</sub> = ' + H.fmt(x, 2) + ', P°<sub>A</sub> = ' + PA + ' mmHg y P°<sub>B</sub> = ' + PB + ' mmHg?', 'What is the total vapor pressure of an ideal mixture with x<sub>A</sub> = ' + H.fmt(x, 2) + ', P°<sub>A</sub> = ' + PA + ' mmHg and P°<sub>B</sub> = ' + PB + ' mmHg?'), a: P, unit: 'mmHg', tol: 0.01,
      sol: 'P = ' + H.fmt(x, 2) + ' × ' + PA + ' + ' + H.fmt(1 - x, 2) + ' × ' + PB + ' = ' + H.fmt(P, 1) + ' mmHg' };
  } },
  { name: ['Simple o fraccionada', 'Simple or fractional'], gen: function (H) {
    var d = H.int(5, 80);
    return { q: H.t('Dos líquidos miscibles hierven con una diferencia de ' + d + ' °C. ¿Qué destilación conviene?', 'Two miscible liquids boil ' + d + ' °C apart. Which distillation is appropriate?'), options: [H.t('Simple', 'Simple'), H.t('Fraccionada', 'Fractional')], answer: d >= 25 ? 0 : 1,
      sol: H.t('Con diferencias grandes (≳ 25 °C) basta la simple; si son cercanos se necesitan varios platos teóricos (columna fraccionada).', 'With large differences (≳ 25 °C) simple is enough; close boiling points need several theoretical plates (fractional column).') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["Al agregar platos teóricos a la columna, el destilado…", "Adding theoretical plates to the column makes the distillate…"], options: [["se enriquece en el componente más volátil", "richer in the more volatile component"], ["se empobrece en el volátil", "poorer in the volatile one"], ["no cambia", "unchanged"]], answer: 0, why: ["Cada plato repite el equilibrio líquido–vapor y concentra un poco más al componente volátil.", "Each plate repeats the liquid–vapor equilibrium and concentrates the volatile component a bit more."] } } });
