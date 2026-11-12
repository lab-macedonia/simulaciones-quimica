/* Práctica · Señalización celular (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Respuesta con la ecuación de Hill', 'Response with the Hill equation'], gen: function (H) {
    var E = H.rnd(1, 50, 1), n = H.pick([1, 1.5, 2, 3]), L = H.rnd(0.5, 100, 1), r = Math.pow(L, n) / (Math.pow(L, n) + Math.pow(E, n)) * 100;
    return { q: H.t('Con EC₅₀ = ' + H.fmt(E, 1) + ' nM y coeficiente de Hill n = ' + H.fmt(n, 1) + ', ¿qué porcentaje de la respuesta máxima produce ' + H.fmt(L, 1) + ' nM de ligando?', 'With EC₅₀ = ' + H.fmt(E, 1) + ' nM and Hill coefficient n = ' + H.fmt(n, 1) + ', what percentage of the maximal response does ' + H.fmt(L, 1) + ' nM ligand produce?'), a: r, unit: '%', abs: Math.max(0.2, r * 0.015),
      sol: 'R = Lⁿ/(Lⁿ + EC₅₀ⁿ) = ' + H.sig(r, 3) + ' %' };
  } },
  { name: ['Amplificación de la cascada', 'Cascade amplification'], gen: function (H) {
    var a = H.int(5, 20), b = H.int(50, 300), c = H.int(5, 20), t = a * b * c;
    return { q: H.t('Un receptor activa ' + a + ' proteínas G; cada adenilil ciclasa produce ' + b + ' AMPc y cada PKA activa fosforila ' + c + ' sustratos (1 PKA por cada AMPc, simplificado). ¿Cuántas fosforilaciones genera un ligando?', 'One receptor activates ' + a + ' G proteins; each adenylyl cyclase makes ' + b + ' cAMP and each active PKA phosphorylates ' + c + ' substrates (1 PKA per cAMP, simplified). How many phosphorylations does one ligand produce?'), a: t, tol: 0.001,
      sol: a + ' × ' + b + ' × ' + c + ' = ' + t };
  } },
  { name: ['Efecto de toxinas y fármacos', 'Effect of toxins and drugs'], gen: function (H) {
    var c = H.int(0, 2), Q = [[H.t('La toxina colérica bloquea la hidrólisis del GTP en Gαs. El AMPc…', 'Cholera toxin blocks GTP hydrolysis in Gαs. cAMP…'), [H.t('Se mantiene alto aunque no haya ligando', 'Stays high even without ligand'), H.t('Baja a cero', 'Drops to zero'), H.t('No cambia', 'Does not change')]], [H.t('Un inhibidor de la fosfodiesterasa (cafeína) hace que el AMPc…', 'A phosphodiesterase inhibitor (caffeine) makes cAMP…'), [H.t('Dure más y se acumule', 'Last longer and accumulate'), H.t('Se degrade más rápido', 'Be degraded faster'), H.t('No se forme', 'Not be formed')]], [H.t('Un antagonista ocupa el receptor sin activarlo. La respuesta al agonista…', 'An antagonist occupies the receptor without activating it. The response to the agonist…'), [H.t('Disminuye o requiere más agonista', 'Decreases or needs more agonist'), H.t('Aumenta', 'Increases'), H.t('No cambia', 'Does not change')]]][c];
    return { q: Q[0], options: Q[1], answer: 0, sol: H.t('Compruébalo en la simulación con el control correspondiente.', 'Check it in the simulation with the corresponding control.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 1: { q: ["Un solo ligando unido al receptor produce…", "A single bound ligand produces…"], options: [["muchas moléculas de AMPc (amplificación)", "many cAMP molecules (amplification)"], ["exactamente una molécula de AMPc", "exactly one cAMP molecule"], ["nada sin un segundo ligando", "nothing without a second ligand"]], answer: 0, why: ["Cada etapa activa varias moléculas de la siguiente: la señal se amplifica en cascada.", "Each step activates several molecules of the next: the signal is amplified in a cascade."] } } });
