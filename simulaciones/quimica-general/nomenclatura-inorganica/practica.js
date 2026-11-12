/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["¿Cómo se llama el ion ClO₃⁻?", "What is the name of the ClO₃⁻ ion?"], options: [["Clorato", "Chlorate"], ["Clorito", "Chlorite"], ["Perclorato", "Perchlorate"], ["Hipoclorito", "Hypochlorite"]], answer: 0, why: ["ClO⁻ hipoclorito, ClO₂⁻ clorito, ClO₃⁻ clorato, ClO₄⁻ perclorato.", "ClO⁻ hypochlorite, ClO₂⁻ chlorite, ClO₃⁻ chlorate, ClO₄⁻ perchlorate."] } } });

/* Práctica: fórmulas y nombres (Stock) de compuestos iónicos generados al azar. */
(function () {
  /* símbolo, carga, nombre es, nombre en, poliatómico, ¿lleva número romano? */
  var CAT = [['Na', 1, 'sodio', 'sodium'], ['K', 1, 'potasio', 'potassium'], ['Ag', 1, 'plata', 'silver'], ['NH₄', 1, 'amonio', 'ammonium', 1], ['Ca', 2, 'calcio', 'calcium'], ['Mg', 2, 'magnesio', 'magnesium'], ['Ba', 2, 'bario', 'barium'], ['Zn', 2, 'zinc', 'zinc'],
    ['Al', 3, 'aluminio', 'aluminum'], ['Fe', 2, 'hierro', 'iron', 0, 1], ['Fe', 3, 'hierro', 'iron', 0, 1], ['Cu', 1, 'cobre', 'copper', 0, 1], ['Cu', 2, 'cobre', 'copper', 0, 1], ['Pb', 2, 'plomo', 'lead', 0, 1], ['Sn', 4, 'estaño', 'tin', 0, 1]];
  var AN = [['Cl', 1, 'cloruro', 'chloride'], ['Br', 1, 'bromuro', 'bromide'], ['I', 1, 'yoduro', 'iodide'], ['F', 1, 'fluoruro', 'fluoride'], ['O', 2, 'óxido', 'oxide'], ['S', 2, 'sulfuro', 'sulfide'], ['N', 3, 'nitruro', 'nitride'],
    ['OH', 1, 'hidróxido', 'hydroxide', 1], ['NO₃', 1, 'nitrato', 'nitrate', 1], ['NO₂', 1, 'nitrito', 'nitrite', 1], ['ClO', 1, 'hipoclorito', 'hypochlorite', 1], ['ClO₃', 1, 'clorato', 'chlorate', 1], ['ClO₄', 1, 'perclorato', 'perchlorate', 1],
    ['SO₄', 2, 'sulfato', 'sulfate', 1], ['SO₃', 2, 'sulfito', 'sulfite', 1], ['CO₃', 2, 'carbonato', 'carbonate', 1], ['PO₄', 3, 'fosfato', 'phosphate', 1]];
  var ROM = ['', 'I', 'II', 'III', 'IV'], SUB = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n) { return n === 1 ? '' : String(n).replace(/\d/g, function (c) { return SUB[+c]; }); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function part(ion, n) { return n > 1 && ion[4] ? '(' + ion[0] + ')' + sub(n) : ion[0] + sub(n); }
  function formula(c, a, nc, na) { return part(c, nc) + part(a, na); }
  function counts(c, a) { var g = gcd(c[1], a[1]); return [a[1] / g, c[1] / g]; }
  function cname(c, en) { return (en ? c[3] : c[2]) + (c[5] ? '(' + ROM[c[1]] + ')' : ''); }
  function name(c, a, en) { return en ? cname(c, 1) + ' ' + a[3] : a[2] + ' de ' + cname(c, 0); }
  function combo(H) { var c = H.pick(CAT), a; do { a = H.pick(AN); } while (c[0] === 'NH₄' && a[0] === 'N'); return [c, a]; }
  function why(c, a, H) { var n = counts(c, a); return H.t('Carga del catión ', 'Cation charge ') + c[0] + ': +' + c[1] + H.t('; carga del anión ', '; anion charge ') + a[0] + ': −' + a[1] + '. ' + H.t('Para que la suma sea cero se necesitan ', 'For the charges to add up to zero you need ') + n[0] + ' ' + c[0] + ' : ' + n[1] + ' ' + a[0] + ' (' + n[0] + ' × ' + c[1] + ' = ' + n[1] + ' × ' + a[1] + ').'; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Del nombre a la fórmula', 'From name to formula'], gen: function (H) {
        var p = combo(H), c = p[0], a = p[1], n = counts(c, a), w = [formula(c, a, 1, 1), formula(c, a, n[1], n[0]), formula(c, a, c[1], a[1]), formula(c, a, n[0] + 1, n[1]), formula(c, a, n[0], n[1] + 1)];
        return H.mc(H.t('¿Cuál es la fórmula del <b>' + name(c, a, 0) + '</b>?', 'What is the formula of <b>' + name(c, a, 1) + '</b>?'), formula(c, a, n[0], n[1]), w, why(c, a, H) + (a[4] && n[1] > 1 ? H.t(' El ion poliatómico va entre paréntesis.', ' The polyatomic ion goes in parentheses.') : ''));
      } },
      { name: ['De la fórmula al nombre', 'From formula to name'], gen: function (H) {
        var p = combo(H), c = p[0], a = p[1], n = counts(c, a), en = H.EN ? 1 : 0, w = [];
        CAT.forEach(function (x) { if (x[0] === c[0] && x !== c) w.push(name(x, a, en)); });
        AN.forEach(function (x) { if (x[0] !== a[0] && x[0].charAt(0) === a[0].charAt(0)) w.push(name(c, x, en)); });
        if (!c[5]) w.push(name([c[0], c[1], c[2], c[3], 0, 1], a, en));
        AN.forEach(function (x) { if (x[1] === a[1] && x !== a) w.push(name(c, x, en)); });
        return H.mc(H.t('¿Cómo se llama <b>' + formula(c, a, n[0], n[1]) + '</b>?', 'What is the name of <b>' + formula(c, a, n[0], n[1]) + '</b>?'), name(c, a, en), w,
          why(c, a, H) + (c[5] ? H.t(' El metal tiene más de una carga posible: se indica con número romano (Stock).', ' The metal has more than one possible charge: it is shown with a Roman numeral (Stock).') : H.t(' Este metal tiene una sola carga habitual: no lleva número romano.', ' This metal has only one common charge: no Roman numeral.')));
      } },
      { name: ['Carga del metal', 'Charge of the metal'], gen: function (H) {
        var c = H.pick(CAT.filter(function (x) { return x[5]; })), a = H.pick(AN), n = counts(c, a);
        return { q: H.t('¿Qué carga (número de oxidación) tiene el ' + c[0] + ' en <b>' + formula(c, a, n[0], n[1]) + '</b>?', 'What charge (oxidation number) does ' + c[0] + ' have in <b>' + formula(c, a, n[0], n[1]) + '</b>?'), a: c[1], abs: 0, aText: '+' + c[1],
          sol: H.t('Carga total del anión: ', 'Total anion charge: ') + n[1] + ' × (−' + a[1] + ') = −' + n[1] * a[1] + '. ' + H.t('Se reparte entre ', 'It is balanced by ') + n[0] + ' ' + c[0] + ' → +' + c[1] + H.t(' cada uno: ', ' each: ') + name(c, a, H.EN ? 1 : 0) + '.' };
      } }
    ]
  });
})();
