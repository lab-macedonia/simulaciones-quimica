/* Práctica · Lípidos y saponificación (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var T = [['triestearina', 'tristearin', 891.5], ['tripalmitina', 'tripalmitin', 807.3], ['trioleína', 'triolein', 885.4], ['trilaurina', 'trilaurin', 639.0]];
  SimAula.register({ problems: [
    { name: ['Índice de saponificación', 'Saponification value'], gen: function (H) {
      var t = H.pick(T), s = 3 * 56.11 * 1000 / t[2];
      return { q: H.t('Calcula el índice de saponificación (mg de KOH por g de grasa) de la ' + t[0] + ' (M = ' + H.fmt(t[2], 1) + ' g/mol).', 'Calculate the saponification value (mg KOH per g of fat) of ' + t[1] + ' (M = ' + H.fmt(t[2], 1) + ' g/mol).'), a: s, unit: 'mg/g', tol: 0.01,
        sol: H.t('Cada triglicérido consume 3 KOH: ', 'Each triglyceride uses 3 KOH: ') + '3 × ' + H.fmt(56.11, 2) + ' × 1000 / ' + H.fmt(t[2], 1) + ' = ' + H.sig(s, 3) + ' mg/g' };
    } },
    { name: ['Masa de NaOH para saponificar', 'NaOH mass to saponify'], gen: function (H) {
      var t = H.pick(T), m = H.rnd(10, 200, 1), x = m / t[2] * 3 * 40.00;
      return { q: H.t('¿Qué masa de NaOH se necesita para saponificar ' + H.fmt(m, 1) + ' g de ' + t[0] + ' (M = ' + H.fmt(t[2], 1) + ' g/mol)?', 'What mass of NaOH is needed to saponify ' + H.fmt(m, 1) + ' g of ' + t[1] + ' (M = ' + H.fmt(t[2], 1) + ' g/mol)?'), a: x, unit: 'g',
        sol: 'n = ' + H.sig(m / t[2], 3) + ' mol × 3 = ' + H.sig(3 * m / t[2], 3) + ' mol NaOH × ' + H.fmt(40, 2) + ' = ' + H.sig(x, 3) + ' g' };
    } },
    { name: ['Saturación y punto de fusión', 'Saturation and melting point'], gen: function (H) {
      return { q: H.t('¿Cuál de estas grasas tiene el punto de fusión más alto?', 'Which of these fats has the highest melting point?'), options: [H.t('Triestearina (saturada, C18:0)', 'Tristearin (saturated, C18:0)'), H.t('Trioleína (C18:1 cis)', 'Triolein (C18:1 cis)'), H.t('Trilinoleína (C18:2 cis)', 'Trilinolein (C18:2 cis)')], answer: 0,
        sol: H.t('Las cadenas saturadas son rectas y se empaquetan mejor; cada doble enlace cis introduce un codo que dificulta el empaquetamiento.', 'Saturated chains are straight and pack better; each cis double bond adds a kink that hinders packing.') };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 3: { q: ["En agua dura, el jabón…", "In hard water, soap…"], options: [["precipita con Ca²⁺ y Mg²⁺ y lava menos", "precipitates with Ca²⁺ and Mg²⁺ and cleans less"], ["lava mejor", "cleans better"], ["se descompone en glicerol", "breaks down into glycerol"]], answer: 0, why: ["Los carboxilatos de Ca y Mg son insolubles: forman la «nata» y retiran jabón de la solución.", "Ca and Mg carboxylates are insoluble: they form scum and remove soap from solution."] } } });
