/* Práctica y predicciones · Solubilidad y Kps. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* [fórmula, tipo (1: AB, 2: AB₂, 3: A₂B), Kps a 25 °C, catión, anión] */
  var SALT = [['AgCl', 1, 1.8e-10, 'Ag⁺', 'Cl⁻'], ['AgBr', 1, 5.0e-13, 'Ag⁺', 'Br⁻'], ['BaSO₄', 1, 1.1e-10, 'Ba²⁺', 'SO₄²⁻'], ['CaCO₃', 1, 3.4e-9, 'Ca²⁺', 'CO₃²⁻'],
    ['CaF₂', 2, 3.9e-11, 'Ca²⁺', 'F⁻'], ['PbI₂', 2, 9.8e-9, 'Pb²⁺', 'I⁻'], ['Mg(OH)₂', 2, 5.6e-12, 'Mg²⁺', 'OH⁻'], ['Ag₂CrO₄', 3, 1.1e-12, 'Ag⁺', 'CrO₄²⁻'], ['Ag₂CO₃', 3, 8.5e-12, 'Ag⁺', 'CO₃²⁻']];
  function sFromK(x) { return x[1] === 1 ? Math.sqrt(x[2]) : Math.pow(x[2] / 4, 1 / 3); }
  function expr(x) { return x[1] === 1 ? 'K<sub>ps</sub> = s · s = s²' : 'K<sub>ps</sub> = (2s)² · s = 4s³'; }
  SimAula.register({
    problems: [
      { name: ['Solubilidad molar a partir de Kps', 'Molar solubility from Ksp'], gen: function (H) {
        var t = H.t, x = H.pick(SALT), s = sFromK(x);
        return { q: t('Calcula la solubilidad molar del ' + x[0] + ' en agua pura (K<sub>ps</sub> = ' + H.sig(x[2], 2) + '). Puedes escribir el resultado como 1,3e-5.', 'Calculate the molar solubility of ' + x[0] + ' in pure water (K<sub>ps</sub> = ' + H.sig(x[2], 2) + '). You can write the answer as 1.3e-5.'), a: s, unit: 'mol/L', tol: 0.03,
          sol: expr(x) + ' → s = ' + (x[1] === 1 ? '√K<sub>ps</sub>' : '∛(K<sub>ps</sub>/4)') + ' = ' + H.sig(s, 3) + ' mol/L' };
      } },
      { name: ['Kps a partir de la solubilidad', 'Ksp from solubility'], gen: function (H) {
        var t = H.t, x = H.pick(SALT), s = sFromK(x) * H.rnd(0.8, 1.2, 2), K = x[1] === 1 ? s * s : 4 * s * s * s;
        return { q: t('La solubilidad del ' + x[0] + ' es ' + H.sig(s, 3) + ' mol/L. ¿Cuánto vale su K<sub>ps</sub>?', 'The solubility of ' + x[0] + ' is ' + H.sig(s, 3) + ' mol/L. What is its K<sub>ps</sub>?'), a: K, unit: '', tol: 0.03,
          sol: expr(x) + ' = ' + H.sig(K, 3) };
      } },
      { name: ['Efecto del ion común', 'Common-ion effect'], gen: function (H) {
        var t = H.t, f = H.fmt, x = H.pick(SALT.filter(function (y) { return y[1] === 1 && y[0] !== 'CaCO₃'; })), c = H.pick([0.001, 0.01, 0.05, 0.1, 0.2]), s = x[2] / c;
        return { q: t('¿Cuál es la solubilidad del ' + x[0] + ' (K<sub>ps</sub> = ' + H.sig(x[2], 2) + ') en una disolución que ya contiene ' + f(c, 3) + ' M de ' + x[4] + '?', 'What is the solubility of ' + x[0] + ' (K<sub>ps</sub> = ' + H.sig(x[2], 2) + ') in a solution that already contains ' + f(c, 3) + ' M ' + x[4] + '?'), a: s, unit: 'mol/L', tol: 0.03,
          sol: t('K<sub>ps</sub> = s · (' + f(c, 3) + ' + s) ≈ s · ' + f(c, 3) + ' → s = ' + H.sig(x[2], 2) + ' / ' + f(c, 3) + ' = ' + H.sig(s, 3) + ' mol/L, mucho menor que en agua pura (' + H.sig(sFromK(x), 2) + ').', 'K<sub>ps</sub> = s · (' + f(c, 3) + ' + s) ≈ s · ' + f(c, 3) + ' → s = ' + H.sig(x[2], 2) + ' / ' + f(c, 3) + ' = ' + H.sig(s, 3) + ' mol/L, much lower than in pure water (' + H.sig(sFromK(x), 2) + ').') };
      } },
      { name: ['¿Precipita? Q frente a Kps', 'Will it precipitate? Q versus Ksp'], gen: function (H) {
        var t = H.t, x = H.pick(SALT.filter(function (y) { return y[1] === 1; }));
        var ca = Math.pow(10, H.rnd(-7, -2, 1)), cb = Math.pow(10, H.rnd(-7, -2, 1)); ca = +ca.toPrecision(2); cb = +cb.toPrecision(2); var Q = ca * cb;
        if (Math.abs(Math.log(Q / x[2])) < 0.3) return null;
        var pre = Q > x[2];
        return { q: t('Se mezclan disoluciones de modo que [' + x[3] + '] = ' + H.sig(ca, 2) + ' M y [' + x[4] + '] = ' + H.sig(cb, 2) + ' M. ¿Precipita ' + x[0] + ' (K<sub>ps</sub> = ' + H.sig(x[2], 2) + ')?', 'Solutions are mixed so that [' + x[3] + '] = ' + H.sig(ca, 2) + ' M and [' + x[4] + '] = ' + H.sig(cb, 2) + ' M. Does ' + x[0] + ' precipitate (K<sub>ps</sub> = ' + H.sig(x[2], 2) + ')?'),
          options: [t('Sí, porque Q > K<sub>ps</sub>', 'Yes, because Q > K<sub>ps</sub>'), t('No, porque Q < K<sub>ps</sub>', 'No, because Q < K<sub>ps</sub>')], answer: pre ? 0 : 1,
          sol: 'Q = [' + x[3] + '][' + x[4] + '] = ' + H.sig(ca, 2) + ' × ' + H.sig(cb, 2) + ' = ' + H.sig(Q, 2) + (pre ? ' > ' : ' < ') + 'K<sub>ps</sub>' };
      } }
    ],
    predict: {
      2: { q: ['Se añadirá NaCl a una disolución saturada de AgCl. ¿Qué pasará?', 'NaCl will be added to a saturated AgCl solution. What will happen?'],
        options: [['Precipita AgCl: su solubilidad disminuye', 'AgCl precipitates: its solubility decreases'], ['Se disuelve más AgCl', 'More AgCl dissolves'], ['No cambia nada: el Kps es constante', 'Nothing changes: Ksp is constant'], ['Cambia el valor del Kps', 'The value of Ksp changes']], answer: 0,
        why: ['El Cl⁻ añadido desplaza el equilibrio AgCl(s) ⇌ Ag⁺ + Cl⁻ hacia el sólido (Le Châtelier). El Kps no cambia; lo que baja es la solubilidad.', 'The added Cl⁻ shifts the equilibrium AgCl(s) ⇌ Ag⁺ + Cl⁻ toward the solid (Le Châtelier). Ksp does not change; the solubility drops.'] },
      3: { q: ['¿Qué ocurrirá con la solubilidad del CaF₂ si se acidifica la disolución?', 'What will happen to the solubility of CaF₂ if the solution is acidified?'],
        options: [['Aumenta', 'It increases'], ['Disminuye', 'It decreases'], ['No cambia', 'It does not change'], ['Se vuelve cero', 'It becomes zero']], answer: 0,
        why: ['El F⁻ es una base: el H⁺ lo convierte en HF y retira F⁻ del equilibrio, que se desplaza hacia la disolución del sólido.', 'F⁻ is a base: H⁺ converts it into HF, removing F⁻ from the equilibrium, which shifts toward dissolving the solid.'] },
      5: { q: ['Con I⁻ y Cl⁻ a 0,1 M, se añade Ag⁺ poco a poco. ¿Qué precipita primero?', 'With I⁻ and Cl⁻ at 0.1 M, Ag⁺ is added little by little. What precipitates first?'],
        options: [['AgI', 'AgI'], ['AgCl', 'AgCl'], ['Ambos a la vez', 'Both at once'], ['Ninguno', 'Neither']], answer: 0,
        why: ['El AgI tiene un Kps mucho menor (≈ 8 × 10⁻¹⁷ frente a 1,8 × 10⁻¹⁰): Q supera su Kps con mucho menos Ag⁺.', 'AgI has a much smaller Ksp (≈ 8 × 10⁻¹⁷ vs 1.8 × 10⁻¹⁰): Q exceeds its Ksp with far less Ag⁺.'] }
    }
  });
})();
