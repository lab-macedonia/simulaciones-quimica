/* Práctica · Polímeros (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var M = [['polietileno', 'polyethylene', 28.05], ['polipropileno', 'polypropylene', 42.08], ['poliestireno', 'polystyrene', 104.15], ['PVC', 'PVC', 62.50]];
  SimAula.register({ problems: [
    { name: ['Grado de polimerización', 'Degree of polymerization'], gen: function (H) {
      var m = H.pick(M), Mn = H.int(20, 500) * 1000, X = Mn / m[2];
      return { q: H.t('Un ' + m[0] + ' tiene M<sub>n</sub> = ' + Mn + ' g/mol y su unidad repetitiva pesa ' + H.fmt(m[2], 2) + ' g/mol. ¿Cuál es su grado de polimerización?', 'A ' + m[1] + ' sample has M<sub>n</sub> = ' + Mn + ' g/mol and its repeat unit weighs ' + H.fmt(m[2], 2) + ' g/mol. What is its degree of polymerization?'), a: X, tol: 0.01,
        sol: 'X<sub>n</sub> = M<sub>n</sub>/M<sub>0</sub> = ' + Mn + ' / ' + H.fmt(m[2], 2) + ' = ' + H.sig(X, 3) };
    } },
    { name: ['Ecuación de Carothers', 'Carothers equation'], gen: function (H) {
      var p = H.pick([0.9, 0.95, 0.98, 0.99, 0.995, 0.999]), X = 1 / (1 - p);
      return { q: H.t('En una policondensación se alcanza una conversión p = ' + H.fmt(p, 3) + '. ¿Cuál es el grado de polimerización promedio?', 'A step-growth polymerization reaches conversion p = ' + H.fmt(p, 3) + '. What is the average degree of polymerization?'), a: X, tol: 0.01,
        sol: 'X<sub>n</sub> = 1/(1 − p) = 1/' + H.fmt(1 - p, 3) + ' = ' + H.sig(X, 3) };
    } },
    { name: ['Dispersidad', 'Dispersity'], gen: function (H) {
      var Mn = H.int(20, 200) * 1000, D = H.rnd(1.05, 3, 2), Mw = Mn * D;
      return { q: H.t('Un polímero tiene M<sub>n</sub> = ' + Mn + ' g/mol y M<sub>w</sub> = ' + Math.round(Mw) + ' g/mol. ¿Cuál es su dispersidad?', 'A polymer has M<sub>n</sub> = ' + Mn + ' g/mol and M<sub>w</sub> = ' + Math.round(Mw) + ' g/mol. What is its dispersity?'), a: Math.round(Mw) / Mn, abs: 0.01, aText: H.fmt(Math.round(Mw) / Mn, 2),
        sol: 'Đ = M<sub>w</sub>/M<sub>n</sub> = ' + H.fmt(Math.round(Mw) / Mn, 2) };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["En la polimerización por condensación, cada enlace nuevo libera…", "In condensation polymerization, each new bond releases…"], options: [["una molécula pequeña (H₂O, HCl…)", "a small molecule (H₂O, HCl…)"], ["un radical", "a radical"], ["nada", "nothing"]], answer: 0, why: ["Por eso la masa del polímero es menor que la suma de los monómeros.", "That is why the polymer mass is less than the sum of the monomers."] } } });
