/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Si se añade más reactivo a un sistema en equilibrio, la reacción…', 'If more reactant is added to a system at equilibrium, the reaction…'], options: [['se desplaza hacia los reactivos', 'shifts towards the reactants'], ['no cambia', 'does not change'], ['se desplaza hacia los productos', 'shifts towards the products']], answer: 2, why: ['Al añadir reactivo Q baja por debajo de K; el sistema consume parte del exceso formando productos. K no cambia.', 'Adding reactant lowers Q below K; the system uses up part of the excess by forming products. K does not change.'] }
} });

/* Práctica · Equilibrio químico y Le Châtelier. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Kc a partir de concentraciones de equilibrio', 'Kc from equilibrium concentrations'], gen: function (H) {
      var t = H.t, f = H.fmt, a = H.rnd(0.05, 1, 3), b = H.rnd(0.05, 1, 3), c = H.rnd(0.05, 2, 3), K = c * c / (a * b * b * b);
      return { q: t('En el equilibrio N₂ + 3 H₂ ⇌ 2 NH₃ se miden [N₂] = ' + f(a, 3) + ' M, [H₂] = ' + f(b, 3) + ' M y [NH₃] = ' + f(c, 3) + ' M. ¿Cuánto vale K<sub>c</sub>?', 'At equilibrium for N₂ + 3 H₂ ⇌ 2 NH₃, [N₂] = ' + f(a, 3) + ' M, [H₂] = ' + f(b, 3) + ' M and [NH₃] = ' + f(c, 3) + ' M. What is K<sub>c</sub>?'), a: K, unit: '', tol: 0.03,
        sol: 'K<sub>c</sub> = [NH₃]² / ([N₂][H₂]³) = ' + f(c, 3) + '² / (' + f(a, 3) + ' × ' + f(b, 3) + '³) = ' + H.sig(K, 3) };
    } },
    { name: ['Tabla ICE: H₂ + I₂ ⇌ 2 HI', 'ICE table: H₂ + I₂ ⇌ 2 HI'], gen: function (H) {
      var t = H.t, f = H.fmt, K = H.pick([16, 25, 36, 49, 50.5, 64, 100]), c = H.rnd(0.1, 1, 2), s = Math.sqrt(K), x = c * s / (2 + s), HI = 2 * x;
      return { q: t('Se colocan ' + f(c, 2) + ' M de H₂ y ' + f(c, 2) + ' M de I₂ (sin HI). Si K<sub>c</sub> = ' + f(K, 1) + ', ¿cuál es [HI] en el equilibrio?', f(c, 2) + ' M H₂ and ' + f(c, 2) + ' M I₂ are mixed (no HI). If K<sub>c</sub> = ' + f(K, 1) + ', what is [HI] at equilibrium?'), a: HI, unit: 'M',
        sol: 'K = (2x)² / (' + f(c, 2) + ' − x)² → √K = ' + f(s, 3) + ' = 2x / (' + f(c, 2) + ' − x) → x = ' + H.sig(x, 3) + ' M; [HI] = 2x = ' + H.sig(HI, 3) + ' M' };
    } },
    { name: ['Q frente a K: sentido de la reacción', 'Q versus K: direction of reaction'], gen: function (H) {
      var t = H.t, f = H.fmt, a = H.rnd(0.05, 1, 2), b = H.rnd(0.05, 1, 2), c = H.rnd(0.05, 1, 2), Q = c * c / (a * b);
      var k = Math.pow(10, H.rnd(-2, 2, 1)); k = +k.toPrecision(2); if (Math.abs(Math.log(Q / k)) < 0.15) return null;
      return { q: t('Para H₂ + I₂ ⇌ 2 HI (K<sub>c</sub> = ' + H.sig(k, 2) + ') se tiene [H₂] = ' + f(a, 2) + ', [I₂] = ' + f(b, 2) + ' y [HI] = ' + f(c, 2) + ' M. ¿Hacia dónde avanza la reacción?', 'For H₂ + I₂ ⇌ 2 HI (K<sub>c</sub> = ' + H.sig(k, 2) + ') you have [H₂] = ' + f(a, 2) + ', [I₂] = ' + f(b, 2) + ' and [HI] = ' + f(c, 2) + ' M. Which way does the reaction proceed?'),
        options: [t('Hacia los productos (Q < K)', 'Toward products (Q < K)'), t('Hacia los reactivos (Q > K)', 'Toward reactants (Q > K)'), t('Está en equilibrio', 'It is at equilibrium')], answer: Q < k ? 0 : 1,
        sol: 'Q = [HI]² / ([H₂][I₂]) = ' + H.sig(Q, 3) + (Q < k ? ' < ' : ' > ') + 'K = ' + H.sig(k, 2) };
    } },
    { name: ['Kp y Kc', 'Kp and Kc'], gen: function (H) {
      var t = H.t, f = H.fmt, r = H.pick([['N₂ + 3 H₂ ⇌ 2 NH₃', -2], ['2 SO₂ + O₂ ⇌ 2 SO₃', -1], ['PCl₅ ⇌ PCl₃ + Cl₂', 1], ['N₂O₄ ⇌ 2 NO₂', 1], ['CaCO₃(s) ⇌ CaO(s) + CO₂', 1]]), Kc = +(Math.pow(10, H.rnd(-3, 2, 1))).toPrecision(2), T = H.int(300, 900), Kp = Kc * Math.pow(0.08206 * T, r[1]);
      return { q: t('Para ' + r[0] + ' a ' + T + ' K, K<sub>c</sub> = ' + H.sig(Kc, 2) + '. ¿Cuánto vale K<sub>p</sub>? (R = 0,08206 L·atm·mol⁻¹·K⁻¹)', 'For ' + r[0] + ' at ' + T + ' K, K<sub>c</sub> = ' + H.sig(Kc, 2) + '. What is K<sub>p</sub>? (R = 0.08206 L·atm·mol⁻¹·K⁻¹)'), a: Kp, unit: '', tol: 0.03,
        sol: 'Δn(gas) = ' + r[1] + '; K<sub>p</sub> = K<sub>c</sub>(RT)<sup>Δn</sup> = ' + H.sig(Kc, 2) + ' × (' + f(0.08206, 5) + ' × ' + T + ')<sup>' + r[1] + '</sup> = ' + H.sig(Kp, 3) };
    } }
  ]
});
