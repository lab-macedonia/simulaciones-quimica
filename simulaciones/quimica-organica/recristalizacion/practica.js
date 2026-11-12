/* Práctica · Recristalización (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Volumen mínimo de disolvente caliente', 'Minimum volume of hot solvent'], gen: function (H) {
    var sh = H.rnd(5, 40, 1), m = H.rnd(1, 10, 1), V = m / sh * 100;
    return { q: H.t('La solubilidad del compuesto en agua hirviendo es ' + H.fmt(sh, 1) + ' g/100 mL. ¿Qué volumen mínimo se necesita para disolver ' + H.fmt(m, 1) + ' g?', 'The compound\'s solubility in boiling water is ' + H.fmt(sh, 1) + ' g/100 mL. What minimum volume dissolves ' + H.fmt(m, 1) + ' g?'), a: V, unit: 'mL',
      sol: 'V = ' + H.fmt(m, 1) + ' g × 100 mL / ' + H.fmt(sh, 1) + ' g = ' + H.sig(V, 3) + ' mL' };
  } },
  { name: ['Rendimiento máximo al enfriar', 'Maximum recovery on cooling'], gen: function (H) {
    var sh = H.rnd(10, 40, 1), sc = H.rnd(0.3, 4, 1), m = H.rnd(2, 10, 1), V = m / sh * 100, rec = m - sc * V / 100, p = rec / m * 100;
    return { q: H.t('Se disuelven ' + H.fmt(m, 1) + ' g en el volumen mínimo de disolvente caliente (solubilidad ' + H.fmt(sh, 1) + ' g/100 mL) y se enfría a 0 °C (solubilidad ' + H.fmt(sc, 1) + ' g/100 mL). ¿Qué porcentaje se recupera como máximo?', H.fmt(m, 1) + ' g are dissolved in the minimum hot solvent (solubility ' + H.fmt(sh, 1) + ' g/100 mL) and cooled to 0 °C (solubility ' + H.fmt(sc, 1) + ' g/100 mL). What is the maximum percent recovery?'), a: p, unit: '%', tol: 0.01,
      sol: 'V = ' + H.sig(V, 3) + ' mL; ' + H.t('queda disuelto', 'stays dissolved') + ' ' + H.fmt(sc, 1) + ' × ' + H.sig(V / 100, 3) + ' = ' + H.sig(sc * V / 100, 3) + ' g; ' + H.t('recuperado', 'recovered') + ' = ' + H.sig(rec, 3) + ' g → ' + H.sig(p, 3) + ' %' };
  } },
  { name: ['Velocidad de enfriamiento', 'Cooling rate'], gen: function (H) {
    return { q: H.t('Para obtener cristales grandes y puros conviene enfriar…', 'To get large, pure crystals you should cool…'), options: [H.t('Lentamente, a temperatura ambiente y luego en hielo', 'Slowly, to room temperature and then in ice'), H.t('Directamente en hielo', 'Directly in ice'), H.t('Agitando con fuerza', 'With vigorous stirring')], answer: 0,
      sol: H.t('El enfriamiento lento deja que las moléculas se ordenen en la red y excluyan impurezas; el rápido atrapa impurezas en cristales pequeños.', 'Slow cooling lets molecules order into the lattice and exclude impurities; fast cooling traps impurities in small crystals.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["Si se usa mucho más disolvente caliente que el mínimo…", "If much more hot solvent than the minimum is used…"], options: [["baja el rendimiento", "the yield drops"], ["sube la pureza sin costo", "purity rises at no cost"], ["no cambia nada", "nothing changes"]], answer: 0, why: ["Al enfriar queda más compuesto disuelto en las aguas madres.", "On cooling, more compound stays dissolved in the mother liquor."] } } });
