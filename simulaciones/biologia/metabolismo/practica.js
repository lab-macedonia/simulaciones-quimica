/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['¿Cuál es el rendimiento neto de ATP de la glucólisis por cada glucosa?', 'What is the net ATP yield of glycolysis per glucose?'], options: [['4 ATP', '4 ATP'], ['2 ATP', '2 ATP'], ['≈ 32 ATP', '≈ 32 ATP']], answer: 1, why: ['Se forman 4 ATP, pero la fase de inversión gastó 2: el neto es 2 ATP (más 2 NADH).', 'Four ATP are made, but the investment phase spent 2: the net yield is 2 ATP (plus 2 NADH).'] },
  3: { q: ['Los complejos I, III y IV bombean H⁺ hacia…', 'Complexes I, III and IV pump H⁺ into…'], options: [['el espacio intermembrana', 'the intermembrane space'], ['la matriz mitocondrial', 'the mitochondrial matrix'], ['el citosol a través de la membrana plasmática', 'the cytosol across the plasma membrane']], answer: 0, why: ['Al bombear H⁺ al espacio intermembrana se crea el gradiente; los H⁺ vuelven a la matriz por la ATP sintasa y así se produce ATP.', 'Pumping H⁺ into the intermembrane space builds the gradient; H⁺ flows back into the matrix through ATP synthase, which makes ATP.'] }
} });

/* Práctica · Metabolismo energético: rendimiento de ATP, ubicación de las etapas e inhibidores. */
(function () {
  var LOC = [[['Glucólisis', 'Glycolysis'], ['Citosol', 'Cytosol']], [['Ciclo de Krebs', 'Krebs cycle'], ['Matriz mitocondrial', 'Mitochondrial matrix']], [['Oxidación del piruvato a acetil-CoA', 'Pyruvate oxidation to acetyl-CoA'], ['Matriz mitocondrial', 'Mitochondrial matrix']],
    [['Cadena de transporte de electrones', 'Electron transport chain'], ['Membrana mitocondrial interna', 'Inner mitochondrial membrane']], [['Fermentación láctica', 'Lactic fermentation'], ['Citosol', 'Cytosol']]];
  var INH = [['Rotenona', 'Rotenone', ['Bloquea el complejo I: no se oxida el NADH', 'Blocks complex I: NADH is not oxidized']], ['Cianuro', 'Cyanide', ['Bloquea el complejo IV: el O₂ no recibe electrones', 'Blocks complex IV: O₂ does not receive electrons']],
    ['Oligomicina', 'Oligomycin', ['Bloquea la ATP sintasa: el gradiente de H⁺ no se usa', 'Blocks ATP synthase: the H⁺ gradient is not used']], ['DNP (2,4-dinitrofenol)', 'DNP (2,4-dinitrophenol)', ['Desacopla: deja pasar H⁺ y la energía se libera como calor', 'Uncouples: lets H⁺ through and the energy is released as heat']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['ATP por moles de glucosa', 'ATP from moles of glucose'], gen: function (H) {
        var n = H.int(1, 12), aer = Math.random() < 0.6, y = aer ? 30 : 2, tot = n * y;
        return { q: H.t('¿Cuántos moles de ATP se obtienen como máximo de <b>' + n + ' mol</b> de glucosa por ' + (aer ? 'respiración aeróbica (usa 30 ATP/glucosa)' : 'fermentación') + '?', 'What is the maximum number of moles of ATP from <b>' + n + ' mol</b> of glucose by ' + (aer ? 'aerobic respiration (use 30 ATP/glucose)' : 'fermentation') + '?'), a: tot, abs: 0, aText: String(tot), unit: 'mol ATP',
          sol: n + ' × ' + y + ' = ' + tot + ' mol ATP. ' + (aer ? H.t('Glucólisis 2 + Krebs 2 + fosforilación oxidativa ≈ 26 (con el NADH y el FADH₂).', 'Glycolysis 2 + Krebs 2 + oxidative phosphorylation ≈ 26 (from NADH and FADH₂).') : H.t('Sin O₂ solo la glucólisis rinde ATP neto (2); la fermentación regenera el NAD⁺.', 'Without O₂ only glycolysis yields net ATP (2); fermentation regenerates NAD⁺.')) };
      } },
      { name: ['¿Dónde ocurre?', 'Where does it happen?'], gen: function (H) {
        return H.bank(LOC, function (l) { return H.t('¿En qué lugar de la célula ocurre: <b>' + l[0][0] + '</b>?', 'Where in the cell does this happen: <b>' + l[0][1] + '</b>?'); }, function (l) { return l[1]; }, function (l) { return H.L(l[0]) + ' → ' + H.L(l[1]).replace(/^./, function (c) { return c.toLowerCase(); }) + '.'; }, [['Membrana mitocondrial externa', 'Outer mitochondrial membrane']]);
      } },
      { name: ['Efecto de un inhibidor', 'Effect of an inhibitor'], gen: function (H) {
        return H.bank(INH, function (i) { return H.t('¿Cómo actúa <b>' + i[0] + '</b> sobre la respiración?', 'How does <b>' + i[1] + '</b> act on respiration?'); }, function (i) { return i[2]; }, function () { return H.t('Con cualquiera de ellos cae la síntesis de ATP; solo con DNP el consumo de O₂ sigue (incluso aumenta).', 'With any of them ATP synthesis drops; only with DNP does O₂ consumption continue (it even increases).'); });
      } },
      { name: ['NADH y FADH₂ por glucosa', 'NADH and FADH₂ per glucose'], gen: function (H) {
        var Q = [['NADH', 10, ['2 (glucólisis) + 2 (piruvato → acetil-CoA) + 6 (Krebs) = 10', '2 (glycolysis) + 2 (pyruvate → acetyl-CoA) + 6 (Krebs) = 10']], ['FADH₂', 2, ['1 por vuelta del ciclo de Krebs × 2 vueltas = 2', '1 per turn of the Krebs cycle × 2 turns = 2']], ['CO₂', 6, ['2 (piruvato → acetil-CoA) + 4 (Krebs) = 6', '2 (pyruvate → acetyl-CoA) + 4 (Krebs) = 6']]];
        var q = H.pick(Q), n = H.int(1, 5), v = q[1] * n;
        return { q: H.t('¿Cuántas moléculas de ' + q[0] + ' se producen por la oxidación completa de <b>' + n + '</b> glucosa(s)?', 'How many molecules of ' + q[0] + ' are produced by the complete oxidation of <b>' + n + '</b> glucose molecule(s)?'), a: v, abs: 0, aText: String(v), sol: H.L(q[2]) + H.t(' por glucosa → × ', ' per glucose → × ') + n + ' = ' + v };
      } }
    ]
  });
})();
