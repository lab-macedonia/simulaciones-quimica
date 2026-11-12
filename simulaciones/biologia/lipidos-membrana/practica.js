/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["¿Qué efecto tiene el colesterol sobre la fluidez de la membrana?", "What effect does cholesterol have on membrane fluidity?"], options: [["La amortigua: ordena la fase fluida y desordena la gel", "It buffers it: orders the fluid phase and disorders the gel"], ["Siempre la aumenta", "It always increases it"], ["Siempre la disminuye", "It always decreases it"]], answer: 0, why: ["Su anillo rígido limita el movimiento de las colas a alta T e impide su empaquetamiento a baja T.", "Its rigid ring restricts tail motion at high T and prevents packing at low T."] } } });

/* Práctica: tipo de transporte, bomba Na⁺/K⁺ y fluidez de la membrana. */
(function () {
  var T = { sd: ['Difusión simple', 'Simple diffusion'], fc: ['Difusión facilitada por canal', 'Facilitated diffusion through a channel'], ft: ['Difusión facilitada por transportador', 'Facilitated diffusion by a carrier'], ap: ['Transporte activo primario', 'Primary active transport'], as: ['Transporte activo secundario', 'Secondary active transport'] };
  var C = [[['O₂ y CO₂ atraviesan la bicapa', 'O₂ and CO₂ cross the bilayer'], 'sd'], [['Una hormona esteroidea entra a la célula', 'A steroid hormone enters the cell'], 'sd'], [['K⁺ sale de la neurona a favor de su gradiente', 'K⁺ leaves the neuron down its gradient'], 'fc'], [['El agua entra por acuaporinas', 'Water enters through aquaporins'], 'fc'],
    [['La glucosa entra al eritrocito por GLUT1', 'Glucose enters the red blood cell through GLUT1'], 'ft'], [['La bomba Na⁺/K⁺ expulsa Na⁺ usando ATP', 'The Na⁺/K⁺ pump expels Na⁺ using ATP'], 'ap'], [['La glucosa entra al enterocito junto con Na⁺ (SGLT1), contra su gradiente', 'Glucose enters the enterocyte together with Na⁺ (SGLT1), against its gradient'], 'as']];
  var ALL = Object.keys(T).map(function (k) { return T[k]; });
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Tipo de transporte', 'Type of transport'], gen: function (H) {
        return H.bank(C, function (c) { return H.t('¿Qué tipo de transporte es?: <b>' + c[0][0] + '</b>.', 'What type of transport is this: <b>' + c[0][1] + '</b>?'); }, function (c) { return T[c[1]]; },
          function (c) { return { sd: H.t('Molécula pequeña o apolar: pasa sola por la bicapa a favor del gradiente.', 'Small or nonpolar molecule: it crosses the bilayer on its own, down its gradient.'), fc: H.t('Una proteína canal deja pasar iones o agua a favor del gradiente, sin gasto de energía.', 'A channel protein lets ions or water through down the gradient, with no energy cost.'), ft: H.t('Un transportador cambia de conformación; se satura, pero no gasta energía.', 'A carrier changes conformation; it saturates but uses no energy.'), ap: H.t('Usa ATP directamente para mover iones contra su gradiente.', 'It uses ATP directly to move ions against their gradient.'), as: H.t('Aprovecha el gradiente de Na⁺ creado por la bomba (gasto indirecto de ATP).', 'It uses the Na⁺ gradient made by the pump (indirect ATP cost).') }[c[1]]; }, ALL);
      } },
      { name: ['Bomba Na⁺/K⁺', 'Na⁺/K⁺ pump'], gen: function (H) {
        var n = H.int(2, 60), ask = H.pick(['na', 'k', 'q']), v = ask === 'na' ? 3 * n : ask === 'k' ? 2 * n : n;
        var what = { na: ['iones Na⁺ salen de la célula', 'Na⁺ ions leave the cell'], k: ['iones K⁺ entran a la célula', 'K⁺ ions enter the cell'], q: ['cargas positivas netas salen de la célula', 'net positive charges leave the cell'] }[ask];
        return { q: H.t('La bomba Na⁺/K⁺ hidroliza <b>' + n + '</b> ATP. ¿Cuántos ' + what[0] + '?', 'The Na⁺/K⁺ pump hydrolyzes <b>' + n + '</b> ATP. How many ' + what[1] + '?'), a: v, abs: 0, aText: String(v),
          sol: H.t('Por cada ATP: 3 Na⁺ afuera y 2 K⁺ adentro (1 carga + neta sale: es electrogénica). ', 'Per ATP: 3 Na⁺ out and 2 K⁺ in (1 net + charge leaves: it is electrogenic). ') + v + '.' };
      } },
      { name: ['Fluidez de la membrana', 'Membrane fluidity'], gen: function (H) {
        var Q = [[['¿Qué membrana es más fluida a la misma temperatura?', 'Which membrane is more fluid at the same temperature?'], ['La rica en ácidos grasos insaturados (cis)', 'One rich in (cis) unsaturated fatty acids'], [['La rica en ácidos grasos saturados', 'One rich in saturated fatty acids'], ['Ambas por igual', 'Both equally']], ['Los dobles enlaces cis doblan las colas e impiden que se empaqueten.', 'Cis double bonds kink the tails and prevent packing.']],
          [['¿Qué colas hacen la membrana menos fluida?', 'Which tails make the membrane less fluid?'], ['Colas largas y saturadas', 'Long, saturated tails'], [['Colas cortas e insaturadas', 'Short, unsaturated tails'], ['La longitud no influye', 'Length has no effect']], ['Más largas y rectas → más fuerzas de London entre colas.', 'Longer and straighter → more London forces between tails.']],
          [['Una bacteria pasa de 37 °C a 20 °C. ¿Cómo ajusta sus lípidos para mantener la fluidez?', 'A bacterium moves from 37 °C to 20 °C. How does it adjust its lipids to keep its fluidity?'], ['Aumenta la proporción de ácidos grasos insaturados', 'It increases the proportion of unsaturated fatty acids'], [['Aumenta los saturados', 'It increases saturated ones'], ['Alarga las colas', 'It lengthens the tails']], ['A baja temperatura la membrana tiende a rigidizarse; más insaturaciones lo compensan (adaptación homeoviscosa).', 'At low temperature the membrane tends to stiffen; more unsaturation compensates (homeoviscous adaptation).']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
