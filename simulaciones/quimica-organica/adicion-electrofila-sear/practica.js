/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["Al adicionar HBr al propeno, ¿dónde queda el Br?", "When HBr adds to propene, where does the Br end up?"], options: [["En el carbono central (2-bromopropano)", "On the central carbon (2-bromopropane)"], ["En el carbono terminal", "On the terminal carbon"], ["Se reparte por igual", "Split equally"]], answer: 0, why: ["Markovnikov: el H va al carbono con más H y se forma el carbocatión secundario, más estable.", "Markovnikov: H goes to the carbon with more H, forming the more stable secondary carbocation."] } } });

/* Práctica: regioselectividad de Markovnikov y efecto de sustituyentes en la SEAr. */
(function () {
  /* alqueno + reactivo → producto principal, distractores, razón */
  var A = [['CH₂=CH–CH₃ + HBr', '2-bromopropano', '2-bromopropane', [['1-bromopropano', '1-bromopropane'], ['1,2-dibromopropano', '1,2-dibromopropane']], ['El H⁺ se une al C con más H; el carbocatión secundario recibe el Br⁻ (Markovnikov).', 'H⁺ adds to the carbon with more H; the secondary carbocation takes Br⁻ (Markovnikov).']],
    ['(CH₃)₂C=CH₂ + HCl', '2-cloro-2-metilpropano', '2-chloro-2-methylpropane', [['1-cloro-2-metilpropano', '1-chloro-2-methylpropane'], ['2-metilpropano', '2-methylpropane']], ['Se forma el carbocatión terciario, el más estable.', 'The tertiary carbocation, the most stable, forms.']],
    ['CH₂=CH–CH₃ + H₂O (H₂SO₄)', 'propan-2-ol', 'propan-2-ol', [['propan-1-ol', 'propan-1-ol'], ['propanal', 'propanal']], ['Hidratación ácida vía carbocatión secundario: el OH queda en el C más sustituido.', 'Acid-catalyzed hydration via the secondary carbocation: OH ends up on the more substituted carbon.']],
    ['CH₂=CH₂ + Br₂', '1,2-dibromoetano', '1,2-dibromoethane', [['1,1-dibromoetano', '1,1-dibromoethane'], ['bromoetano', 'bromoethane']], ['Ion bromonio cíclico y ataque anti del Br⁻: cada C recibe un Br.', 'Cyclic bromonium ion and anti attack by Br⁻: each carbon gets one Br.']],
    ['ciclohexeno + Br₂', 'trans-1,2-dibromociclohexano', 'trans-1,2-dibromocyclohexane', [['cis-1,2-dibromociclohexano', 'cis-1,2-dibromocyclohexane'], ['bromociclohexano', 'bromocyclohexane']], ['El Br⁻ abre el ion bromonio por la cara opuesta: adición anti.', 'Br⁻ opens the bromonium ion from the opposite face: anti addition.']]];
  /* sustituyente, orientación, activa? */
  var S = [['–OH', 'op', 1], ['–NH₂', 'op', 1], ['–OCH₃', 'op', 1], ['–CH₃', 'op', 1], ['–Cl', 'op', 0], ['–Br', 'op', 0], ['–NO₂', 'm', 0], ['–COOH', 'm', 0], ['–CHO', 'm', 0], ['–CN', 'm', 0], ['–SO₃H', 'm', 0], ['–N(CH₃)₃⁺', 'm', 0]];
  var O = { op1: ['Activante, orto/para', 'Activating, ortho/para'], op0: ['Desactivante, orto/para', 'Deactivating, ortho/para'], m0: ['Desactivante, meta', 'Deactivating, meta'], m1: ['Activante, meta', 'Activating, meta'] };
  function why(s, H) {
    return s[1] === 'm' ? H.t('Atrae electrones del anillo (por resonancia o inducción): el complejo σ menos inestable es el del ataque en meta.', 'It withdraws electrons from the ring (by resonance or induction): the least unstable σ complex is the one from meta attack.')
      : s[2] ? H.t('Dona electrones al anillo y estabiliza el complejo σ de los ataques orto y para.', 'It donates electrons to the ring and stabilizes the σ complex of ortho and para attack.') : H.t('Halógeno: retira electrones por inducción (desactiva) pero dona un par por resonancia (orienta orto/para).', 'Halogen: withdraws electrons inductively (deactivates) but donates a pair by resonance (directs ortho/para).');
  }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Producto de la adición', 'Addition product'], gen: function (H) {
        var a = H.pick(A), es = !H.EN;
        return H.mc(H.t('¿Cuál es el producto principal de <b>' + a[0] + '</b>?', 'What is the main product of <b>' + a[0].replace('ciclohexeno', 'cyclohexene') + '</b>?'), es ? a[1] : a[2], a[3], a[4]);
      } },
      { name: ['Efecto del sustituyente (SEAr)', 'Substituent effect (EAS)'], gen: function (H) {
        var s = H.pick(S);
        return H.mc(H.t('¿Cómo influye el sustituyente <b>' + s[0] + '</b> en la sustitución electrofílica aromática?', 'How does the substituent <b>' + s[0] + '</b> affect electrophilic aromatic substitution?'), O[s[1] + s[2]], [O.op1, O.op0, O.m0, O.m1], why(s, H));
      } }
    ]
  });
})();
