/* Práctica y predicciones · Genética mendeliana y Hardy–Weinberg. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Portadores en Hardy–Weinberg', 'Carriers under Hardy–Weinberg'], gen: function (H) {
      var t = H.t, f = H.fmt, n = H.pick([100, 400, 900, 1600, 2500, 2000, 10000, 4900]), q = Math.sqrt(1 / n), p = 1 - q, het = 2 * p * q * 100;
      return { q: t('Una enfermedad recesiva afecta a 1 de cada ' + n + ' personas. Si la población está en equilibrio de Hardy–Weinberg, ¿qué porcentaje son portadores heterocigotos?', 'A recessive disease affects 1 in ' + n + ' people. If the population is in Hardy–Weinberg equilibrium, what percentage are heterozygous carriers?'), a: het, unit: '%', tol: 0.015,
        sol: 'q² = 1/' + n + ' → q = ' + f(q, 4) + '; p = 1 − q = ' + f(p, 4) + '; 2pq = ' + f(2 * p * q, 4) + ' = ' + H.sig(het, 3) + ' %' };
    } },
    { name: ['Frecuencias alélicas a partir de genotipos', 'Allele frequencies from genotypes'], gen: function (H) {
      var t = H.t, f = H.fmt, AA = H.int(50, 400), Aa = H.int(50, 400), aa = H.int(10, 200), N = AA + Aa + aa, p = (2 * AA + Aa) / (2 * N);
      return { q: t('En una muestra hay ' + AA + ' AA, ' + Aa + ' Aa y ' + aa + ' aa. ¿Cuál es la frecuencia del alelo A (p)?', 'A sample has ' + AA + ' AA, ' + Aa + ' Aa and ' + aa + ' aa. What is the frequency of allele A (p)?'), a: p, unit: '', abs: 0.004,
        sol: 'p = (2·AA + Aa) / (2N) = (2 × ' + AA + ' + ' + Aa + ') / (2 × ' + N + ') = ' + f(p, 3), aText: f(p, 3) };
    } },
    { name: ['Prueba de χ² para 3 : 1', 'χ² test for 3 : 1'], gen: function (H) {
      var t = H.t, f = H.fmt, N = H.pick([200, 400, 800, 1000]), d = H.int(-40, 40), O1 = Math.round(N * 0.75) + d, O2 = N - O1, E1 = N * 0.75, E2 = N * 0.25, x2 = Math.pow(O1 - E1, 2) / E1 + Math.pow(O2 - E2, 2) / E2;
      return { q: t('De un cruce Aa × Aa se cuentan ' + O1 + ' dominantes y ' + O2 + ' recesivos. Calcula χ² frente a la proporción 3 : 1.', 'An Aa × Aa cross gives ' + O1 + ' dominant and ' + O2 + ' recessive offspring. Calculate χ² against the 3 : 1 ratio.'), a: x2, unit: '', abs: Math.max(0.02, x2 * 0.02),
        sol: 'E = ' + f(E1, 0) + t(' y ', ' and ') + f(E2, 0) + '; χ² = (' + O1 + ' − ' + f(E1, 0) + ')²/' + f(E1, 0) + ' + (' + O2 + ' − ' + f(E2, 0) + ')²/' + f(E2, 0) + ' = ' + f(x2, 2) + '. ' + (x2 < 3.84 ? t('Con 1 grado de libertad, χ² < 3,84 → compatible con 3 : 1 (p > 0,05).', 'With 1 degree of freedom, χ² < 3.84 → consistent with 3 : 1 (p > 0.05).') : t('χ² > 3,84 → se rechaza 3 : 1 (p < 0,05).', 'χ² > 3.84 → 3 : 1 is rejected (p < 0.05).')), aText: f(x2, 2) };
    } },
    { name: ['Probabilidad en un cruce dihíbrido', 'Probability in a dihybrid cross'], gen: function (H) {
      var t = H.t, c = H.int(0, 3), lab = [t('dominante para ambos rasgos (A_B_)', 'dominant for both traits (A_B_)'), t('dominante para A y recesivo para B (A_bb)', 'dominant for A and recessive for B (A_bb)'), t('recesivo para A y dominante para B (aaB_)', 'recessive for A and dominant for B (aaB_)'), t('recesivo para ambos (aabb)', 'recessive for both (aabb)')][c];
      var ans = ['9/16', '3/16', '3/16', '1/16'][c];
      return { q: t('En el cruce AaBb × AaBb (genes independientes, dominancia completa), ¿qué fracción de la descendencia es ' + lab + '?', 'In the cross AaBb × AaBb (independent genes, complete dominance), what fraction of the offspring is ' + lab + '?'),
        options: ['9/16', '3/16', '1/16', '1/4'], answer: ans === '9/16' ? 0 : ans === '3/16' ? 1 : 2,
        sol: t('Cada gen por separado da 3/4 dominante y 1/4 recesivo; por ser independientes se multiplican: ', 'Each gene separately gives 3/4 dominant and 1/4 recessive; being independent, they multiply: ') + ['3/4 × 3/4', '3/4 × 1/4', '1/4 × 3/4', '1/4 × 1/4'][c] + ' = ' + ans };
    } }
  ],
  predict: {
    1: { q: ['En el cruce Aa × Aa, ¿qué proporción fenotípica esperas en la descendencia?', 'In the Aa × Aa cross, what phenotypic ratio do you expect in the offspring?'],
      options: [['3 dominantes : 1 recesivo', '3 dominant : 1 recessive'], ['1 : 1', '1 : 1'], ['1 : 2 : 1 en el fenotipo', '1 : 2 : 1 in phenotype'], ['Todos dominantes', 'All dominant']], answer: 0,
      why: ['Genotipos 1 AA : 2 Aa : 1 aa. Como AA y Aa muestran el mismo fenotipo dominante, el fenotipo queda 3 : 1.', 'Genotypes 1 AA : 2 Aa : 1 aa. Since AA and Aa show the same dominant phenotype, the phenotype is 3 : 1.'] },
    2: { q: ['En el cruce AaBb × AaBb, ¿qué fracción será recesiva para ambos rasgos?', 'In the AaBb × AaBb cross, what fraction will be recessive for both traits?'],
      options: [['1/16', '1/16'], ['1/4', '1/4'], ['3/16', '3/16'], ['1/8', '1/8']], answer: 0,
      why: ['P(aa) = 1/4 y P(bb) = 1/4; con segregación independiente, P(aabb) = 1/4 × 1/4 = 1/16.', 'P(aa) = 1/4 and P(bb) = 1/4; with independent assortment, P(aabb) = 1/4 × 1/4 = 1/16.'] },
    5: { q: ['En una población muy pequeña sin selección, la frecuencia de un alelo a lo largo de las generaciones…', 'In a very small population without selection, the frequency of an allele over the generations…'],
      options: [['Fluctúa al azar y puede fijarse o perderse', 'Fluctuates randomly and may become fixed or lost'], ['Se mantiene exactamente constante', 'Stays exactly constant'], ['Siempre aumenta', 'Always increases'], ['Siempre llega a 0,5', 'Always reaches 0.5']], answer: 0,
      why: ['Es la deriva genética: el muestreo al azar de pocos gametos cambia las frecuencias sin dirección fija; su efecto crece al disminuir el tamaño de la población.', 'This is genetic drift: random sampling of few gametes changes frequencies with no fixed direction; its effect grows as population size shrinks.'] }
  }
});
