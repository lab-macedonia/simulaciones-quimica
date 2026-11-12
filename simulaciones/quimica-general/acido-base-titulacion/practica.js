/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  1: { q: ['Con las primeras gotas de titulante, el pH…', 'With the first drops of titrant, the pH…'], options: [['salta varias unidades', 'jumps several units'], ['cambia poco', 'changes little'], ['no cambia en absoluto', 'does not change at all']], answer: 1, why: ['Lejos del equivalente aún queda mucho analito que consume el titulante; el salto brusco llega cerca del punto de equivalencia.', 'Far from equivalence plenty of analyte remains to consume the titrant; the sharp jump comes near the equivalence point.'] },
  4: { q: ['Pasado el punto de equivalencia, el pH lo fija…', 'Past the equivalence point, the pH is set by…'], options: [['la especie conjugada del analito', 'the analyte’s conjugate species'], ['el indicador', 'the indicator'], ['el exceso de titulante', 'the excess titrant']], answer: 2, why: ['Ya no queda analito: el titulante sobrante (OH⁻ o H₃O⁺ libre) domina y la curva se aplana.', 'No analyte is left: the leftover titrant (free OH⁻ or H₃O⁺) dominates and the curve levels off.'] }
} });

/* Práctica · Ácido–base, pH y titulación. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var WA = [[t2('ácido acético', 'acetic acid'), 'CH₃COOH', 1.8e-5], [t2('ácido fórmico', 'formic acid'), 'HCOOH', 1.8e-4], [t2('ácido benzoico', 'benzoic acid'), 'C₆H₅COOH', 6.3e-5], [t2('ácido fluorhídrico', 'hydrofluoric acid'), 'HF', 6.8e-4], [t2('ácido hipocloroso', 'hypochlorous acid'), 'HClO', 3.0e-8]];
  function t2(es, en) { return [es, en]; }
  SimAula.register({
    problems: [
      { name: ['pH de un ácido o base fuerte', 'pH of a strong acid or base'], gen: function (H) {
        var t = H.t, f = H.fmt, c = +(Math.pow(10, H.rnd(-4, -0.3, 2))).toPrecision(2), base = H.pick([false, true]), pH = base ? 14 + Math.log10(c) : -Math.log10(c);
        return { q: t('¿Cuál es el pH de una disolución ' + H.sig(c, 2) + ' M de ' + (base ? 'NaOH' : 'HCl') + ' a 25 °C?', 'What is the pH of a ' + H.sig(c, 2) + ' M ' + (base ? 'NaOH' : 'HCl') + ' solution at 25 °C?'), a: pH, unit: '', abs: 0.02,
          sol: base ? 'pOH = −log ' + H.sig(c, 2) + ' = ' + f(-Math.log10(c), 2) + '; pH = 14 − pOH = ' + f(pH, 2) : 'pH = −log[H₃O⁺] = −log ' + H.sig(c, 2) + ' = ' + f(pH, 2), aText: f(pH, 2) };
      } },
      { name: ['pH de un ácido débil', 'pH of a weak acid'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(WA), c = H.pick([0.01, 0.05, 0.1, 0.2, 0.5]), Ka = a[2], x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2, pH = -Math.log10(x);
        return { q: t('Calcula el pH de una disolución ' + f(c, 2) + ' M de ' + H.L(a[0]) + ' (' + a[1] + ', K<sub>a</sub> = ' + H.sig(Ka, 2) + ').', 'Calculate the pH of a ' + f(c, 2) + ' M solution of ' + H.L(a[0]) + ' (' + a[1] + ', K<sub>a</sub> = ' + H.sig(Ka, 2) + ').'), a: pH, unit: '', abs: 0.03,
          sol: 'K<sub>a</sub> = x²/(' + f(c, 2) + ' − x) → x = [H₃O⁺] = ' + H.sig(x, 3) + ' M; pH = ' + f(pH, 2) + t(' (la aproximación √(K<sub>a</sub>·c) da ', ' (the √(K<sub>a</sub>·c) approximation gives ') + f(-Math.log10(Math.sqrt(Ka * c)), 2) + ')', aText: f(pH, 2) };
      } },
      { name: ['Tampón (Henderson–Hasselbalch)', 'Buffer (Henderson–Hasselbalch)'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(WA.slice(0, 3)), pKa = -Math.log10(a[2]), ca = H.rnd(0.05, 0.5, 2), cb = H.rnd(0.05, 0.5, 2), pH = pKa + Math.log10(cb / ca);
        return { q: t('Un tampón contiene ' + f(ca, 2) + ' M de ' + H.L(a[0]) + ' y ' + f(cb, 2) + ' M de su sal sódica (K<sub>a</sub> = ' + H.sig(a[2], 2) + '). ¿Cuál es su pH?', 'A buffer contains ' + f(ca, 2) + ' M ' + H.L(a[0]) + ' and ' + f(cb, 2) + ' M of its sodium salt (K<sub>a</sub> = ' + H.sig(a[2], 2) + '). What is its pH?'), a: pH, unit: '', abs: 0.02,
          sol: 'pH = pK<sub>a</sub> + log([A⁻]/[HA]) = ' + f(pKa, 2) + ' + log(' + f(cb, 2) + '/' + f(ca, 2) + ') = ' + f(pH, 2), aText: f(pH, 2) };
      } },
      { name: ['Volumen de equivalencia', 'Equivalence volume'], gen: function (H) {
        var t = H.t, f = H.fmt, Va = H.pick([10, 20, 25, 50]), ca = H.rnd(0.05, 0.3, 3), cb = H.pick([0.05, 0.1, 0.1, 0.2]), poly = H.pick([1, 1, 2]), Ve = Va * ca * poly / cb, acid = poly === 2 ? 'H₂SO₄' : H.pick(['HCl', 'CH₃COOH', 'HNO₃']);
        return { q: t('Se titulan ' + Va + ' mL de ' + acid + ' ' + f(ca, 3) + ' M con NaOH ' + f(cb, 2) + ' M. ¿Qué volumen de NaOH se necesita para llegar al ' + (poly === 2 ? 'segundo ' : '') + 'punto de equivalencia?', Va + ' mL of ' + f(ca, 3) + ' M ' + acid + ' are titrated with ' + f(cb, 2) + ' M NaOH. What volume of NaOH is needed to reach the ' + (poly === 2 ? 'second ' : '') + 'equivalence point?'), a: Ve, unit: 'mL',
          sol: 'n(H⁺) = ' + poly + ' × ' + f(ca, 3) + ' × ' + Va + ' mL = ' + H.sig(poly * ca * Va, 3) + ' mmol; V = ' + H.sig(poly * ca * Va, 3) + ' / ' + f(cb, 2) + ' = ' + H.sig(Ve, 3) + ' mL' };
      } },
      { name: ['pH en la semiequivalencia', 'pH at half-equivalence'], gen: function (H) {
        var t = H.t, f = H.fmt, a = H.pick(WA), pKa = -Math.log10(a[2]);
        return { q: t('Al titular ' + H.L(a[0]) + ' (K<sub>a</sub> = ' + H.sig(a[2], 2) + ') con NaOH, ¿cuál es el pH en el punto de semiequivalencia?', 'When ' + H.L(a[0]) + ' (K<sub>a</sub> = ' + H.sig(a[2], 2) + ') is titrated with NaOH, what is the pH at the half-equivalence point?'), a: pKa, unit: '', abs: 0.02,
          sol: t('En la semiequivalencia [HA] = [A⁻], así que pH = pK<sub>a</sub> = −log ', 'At half-equivalence [HA] = [A⁻], so pH = pK<sub>a</sub> = −log ') + H.sig(a[2], 2) + ' = ' + f(pKa, 2), aText: f(pKa, 2) };
      } }
    ]
  });
})();
