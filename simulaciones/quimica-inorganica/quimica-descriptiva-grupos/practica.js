/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 1: { q: ["¿Qué metal alcalino reacciona con el agua de forma más violenta?", "Which alkali metal reacts most violently with water?"], options: [["Cesio", "Cesium"], ["Litio", "Lithium"], ["Sodio", "Sodium"], ["Potasio", "Potassium"]], answer: 0, why: ["Hacia abajo en el grupo baja la energía de ionización: el electrón de valencia se pierde con más facilidad.", "Down the group the ionization energy falls: the valence electron is lost more easily."] } } });

/* Práctica: carácter de los óxidos del periodo 3, productos de reacción y tendencias de grupo. */
(function () {
  var C = { b: ['Básico', 'Basic'], a: ['Anfótero', 'Amphoteric'], c: ['Ácido', 'Acidic'] };
  var OX = [['Na₂O', 'b', ['Iónico; con agua forma NaOH.', 'Ionic; with water it forms NaOH.']], ['MgO', 'b', ['Iónico; con agua forma Mg(OH)₂ (poco soluble).', 'Ionic; with water it forms Mg(OH)₂ (sparingly soluble).']],
    ['Al₂O₃', 'a', ['Reacciona con ácidos y con bases fuertes (forma [Al(OH)₄]⁻).', 'Reacts with acids and with strong bases (forms [Al(OH)₄]⁻).']], ['SiO₂', 'c', ['Covalente reticular; reacciona con bases fuertes fundidas formando silicatos.', 'Network covalent; reacts with molten strong bases to form silicates.']],
    ['P₄O₁₀', 'c', ['Molecular; con agua forma H₃PO₄.', 'Molecular; with water it forms H₃PO₄.']], ['SO₃', 'c', ['Molecular; con agua forma H₂SO₄.', 'Molecular; with water it forms H₂SO₄.']], ['Cl₂O₇', 'c', ['Molecular; con agua forma HClO₄.', 'Molecular; with water it forms HClO₄.']],
    ['CaO', 'b', ['Cal viva; con agua forma Ca(OH)₂.', 'Quicklime; with water it forms Ca(OH)₂.']], ['CO₂', 'c', ['Con agua forma H₂CO₃.', 'With water it forms H₂CO₃.']], ['ZnO', 'a', ['Se disuelve en ácidos y en bases fuertes.', 'Dissolves in acids and in strong bases.']]];
  /* reacción, producto correcto, distractores */
  var RX = [['2 Na + 2 H₂O →', '2 NaOH + H₂', ['Na₂O + H₂', '2 NaH + O₂', 'NaOH + H₂O₂']], ['2 K + 2 H₂O →', '2 KOH + H₂', ['K₂O + H₂', '2 KH + O₂', 'KOH + O₂']],
    ['Ca + 2 H₂O →', 'Ca(OH)₂ + H₂', ['CaO + H₂', 'CaH₂ + O₂', 'CaO₂ + 2 H₂']], ['Cl₂ + 2 KBr →', '2 KCl + Br₂', ['No hay reacción', 'KCl + KBrCl', '2 KClBr']],
    ['Br₂ + 2 NaI →', '2 NaBr + I₂', ['No hay reacción', 'NaBrI + NaI', '2 NaIBr']], ['I₂ + 2 NaCl →', 'No hay reacción', ['2 NaI + Cl₂', 'NaICl + NaCl', '2 NaClI']],
    ['Cl₂ + H₂O ⇌', 'HCl + HClO', ['2 HCl + O₂', 'HClO₂ + H₂', 'H₂ + Cl₂O']], ['MgO + 2 HCl →', 'MgCl₂ + H₂O', ['Mg + Cl₂ + H₂O', 'MgH₂ + Cl₂O', 'No hay reacción']]];
  var NR = ['No hay reacción', 'No reaction'];
  function en(s, H) { return H.EN && s === NR[0] ? NR[1] : s; }
  var TR = [[['¿Qué metal alcalino reacciona con más violencia con el agua?', 'Which alkali metal reacts most violently with water?'], 'Cs', ['Li', 'Na', 'K'], ['La energía de ionización baja al descender: el Cs pierde su electrón con más facilidad.', 'Ionization energy decreases down the group: Cs loses its electron most easily.']],
    [['¿Qué halógeno es el oxidante más fuerte?', 'Which halogen is the strongest oxidizing agent?'], 'F₂', ['Cl₂', 'Br₂', 'I₂'], ['El flúor es el más electronegativo y capta electrones con mayor facilidad.', 'Fluorine is the most electronegative and gains electrons most easily.']],
    [['¿Qué halógeno es sólido a temperatura ambiente?', 'Which halogen is a solid at room temperature?'], 'I₂', ['F₂', 'Cl₂', 'Br₂'], ['Al bajar aumenta el número de electrones y las fuerzas de London: F₂ y Cl₂ gases, Br₂ líquido, I₂ sólido.', 'Down the group the number of electrons and London forces increase: F₂ and Cl₂ gases, Br₂ liquid, I₂ solid.']],
    [['¿Qué gas noble forma más compuestos (por ejemplo, fluoruros)?', 'Which noble gas forms the most compounds (for example, fluorides)?'], 'Xe', ['He', 'Ne', 'Ar'], ['Su energía de ionización es la más baja de la lista: sus electrones externos se comparten con F u O.', 'It has the lowest ionization energy in the list: its outer electrons can be shared with F or O.']],
    [['¿Qué hidróxido alcalinotérreo es más soluble en agua?', 'Which alkaline-earth hydroxide is most soluble in water?'], 'Ba(OH)₂', ['Mg(OH)₂', 'Ca(OH)₂', 'Be(OH)₂'], ['La solubilidad de los hidróxidos del grupo 2 aumenta al descender.', 'The solubility of group 2 hydroxides increases down the group.']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Carácter ácido–base de un óxido', 'Acid–base character of an oxide'], gen: function (H) {
        return H.bank(OX, function (o) { return H.t('¿Qué carácter ácido–base tiene el óxido <b>' + o[0] + '</b>?', 'What acid–base character does the oxide <b>' + o[0] + '</b> have?'); }, function (o) { return C[o[1]]; },
          function (o) { return H.L(o[2]) + ' ' + H.t('Los óxidos metálicos iónicos son básicos; los de no metales, ácidos; Al y Zn quedan en la frontera.', 'Ionic metal oxides are basic; nonmetal oxides are acidic; Al and Zn lie on the border.'); }, [C.b, C.a, C.c]);
      } },
      { name: ['Productos de reacción', 'Reaction products'], gen: function (H) {
        var r = H.pick(RX);
        return H.mc(H.t('Completa la reacción: <b>' + r[0] + '</b> …', 'Complete the reaction: <b>' + r[0] + '</b> …'), en(r[1], H), r[2].map(function (x) { return en(x, H); }),
          /Br|I|Cl₂ \+ 2 K/.test(r[0]) && /NaI|KBr|NaCl/.test(r[0]) ? H.t('Un halógeno desplaza de sus sales solo a los halógenos que están más abajo en el grupo (poder oxidante F₂ > Cl₂ > Br₂ > I₂).', 'A halogen displaces only the halogens below it in the group (oxidizing power F₂ > Cl₂ > Br₂ > I₂).')
            : /H₂O →/.test(r[0]) ? H.t('Los metales activos reducen el agua: forman el hidróxido y liberan H₂.', 'Active metals reduce water: they form the hydroxide and release H₂.')
            : r[0].indexOf('MgO') === 0 ? H.t('Óxido básico + ácido → sal + agua.', 'Basic oxide + acid → salt + water.') : H.t('El cloro se dismuta en agua: un Cl se reduce (HCl) y otro se oxida (HClO).', 'Chlorine disproportionates in water: one Cl is reduced (HCl) and another oxidized (HClO).'));
      } },
      { name: ['Tendencias de grupo', 'Group trends'], gen: function (H) {
        var x = H.pick(TR);
        return H.mc(H.L(x[0]), x[1], x[2], H.L(x[3]));
      } }
    ]
  });
})();
