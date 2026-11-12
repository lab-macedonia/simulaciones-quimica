/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['¿Cuántos acetil-CoA se obtienen de la β-oxidación completa del palmitato (C16)?', 'How many acetyl-CoA does the complete β-oxidation of palmitate (C16) give?'], options: [['7', '7'], ['16', '16'], ['8', '8']], answer: 2, why: ['Cada acetil-CoA tiene 2 C: 16 / 2 = 8 acetil-CoA, en 7 ciclos (el último ciclo deja dos acetil-CoA).', 'Each acetyl-CoA has 2 C: 16 / 2 = 8 acetyl-CoA, in 7 cycles (the last cycle leaves two acetyl-CoA).'] },
  4: { q: ['Al degradar un aminoácido, su grupo amino pasa primero a…', 'When an amino acid is broken down, its amino group first goes to…'], options: [['α-cetoglutarato, que se convierte en glutamato', 'α-ketoglutarate, which becomes glutamate'], ['urea, directamente', 'urea, directly'], ['acetil-CoA', 'acetyl-CoA']], answer: 0, why: ['Una aminotransferasa con PLP transfiere el –NH₂ al α-cetoglutarato (transaminación); el glutamato reúne así los grupos amino.', 'A PLP-dependent aminotransferase moves –NH₂ to α-ketoglutarate (transamination); glutamate collects the amino groups.'] }
} });

/* Práctica · β-oxidación y metabolismo de aminoácidos (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Ciclos y productos de la β-oxidación', 'β-oxidation cycles and products'], gen: function (H) {
    var C = H.pick([8, 10, 12, 14, 16, 18, 20]), k = H.int(0, 2), cyc = C / 2 - 1, ac = C / 2, v = [cyc, ac, cyc][k];
    var w = [H.t('ciclos de β-oxidación', 'β-oxidation cycles'), H.t('acetil-CoA', 'acetyl-CoA'), 'FADH₂'][k];
    return { q: H.t('Un ácido graso saturado de ' + C + ' carbonos, ¿cuántos ' + w + ' produce?', 'For a saturated ' + C + '-carbon fatty acid, how many ' + w + ' are produced?'), a: v, abs: 0, aText: String(v),
      sol: H.t('Ciclos = C/2 − 1 = ' + cyc + '; acetil-CoA = C/2 = ' + ac + '; cada ciclo da 1 FADH₂ y 1 NADH.', 'Cycles = C/2 − 1 = ' + cyc + '; acetyl-CoA = C/2 = ' + ac + '; each cycle gives 1 FADH₂ and 1 NADH.') };
  } },
  { name: ['ATP neto de un ácido graso', 'Net ATP from a fatty acid'], gen: function (H) {
    var C = H.pick([8, 10, 12, 14, 16, 18]), cyc = C / 2 - 1, ac = C / 2, atp = cyc * 1.5 + cyc * 2.5 + ac * 10 - 2;
    return { q: H.t('¿Cuántos ATP netos rinde la oxidación completa de un ácido graso saturado de ' + C + ' C? (NADH = 2,5; FADH₂ = 1,5; acetil-CoA = 10; activación = −2)', 'How many net ATP does complete oxidation of a saturated ' + C + '-carbon fatty acid yield? (NADH = 2.5; FADH₂ = 1.5; acetyl-CoA = 10; activation = −2)'), a: atp, abs: 0.01, aText: H.fmt(atp, 0),
      sol: cyc + ' × (' + H.fmt(1.5, 1) + ' + ' + H.fmt(2.5, 1) + ') + ' + ac + ' × 10 − 2 = ' + H.fmt(atp, 0) + ' ATP' };
  } },
  { name: ['Transaminación', 'Transamination'], gen: function (H) {
    var c = H.pick([[H.t('alanina', 'alanine'), H.t('piruvato', 'pyruvate')], [H.t('aspartato', 'aspartate'), H.t('oxalacetato', 'oxaloacetate')], [H.t('glutamato', 'glutamate'), H.t('α-cetoglutarato', 'α-ketoglutarate')]]);
    var ops = [H.t('piruvato', 'pyruvate'), H.t('oxalacetato', 'oxaloacetate'), H.t('α-cetoglutarato', 'α-ketoglutarate')];
    return { q: H.t('Al transaminarse, la ' + c[0] + ' cede su grupo amino y se convierte en…', 'On transamination, ' + c[0] + ' gives up its amino group and becomes…'), options: ops, answer: ops.indexOf(c[1]), sol: H.t('El α-cetoácido correspondiente; la enzima usa PLP como coenzima.', 'The corresponding α-keto acid; the enzyme uses PLP as coenzyme.') };
  } }
] });
