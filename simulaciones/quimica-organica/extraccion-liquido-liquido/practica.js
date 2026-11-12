/* Práctica y predicciones · Extracción líquido–líquido. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  problems: [
    { name: ['Una extracción', 'A single extraction'], gen: function (H) {
      var t = H.t, f = H.fmt, K = H.rnd(1, 20, 1), m = H.int(100, 1000), Va = H.pick([50, 100, 150]), Vo = H.pick([25, 50, 75, 100]), q = Va / (Va + K * Vo), ext = m * (1 - q);
      return { q: t('Una disolución acuosa (' + Va + ' mL) contiene ' + m + ' mg de un compuesto con K = [org]/[ac] = ' + f(K, 1) + '. Se extrae una vez con ' + Vo + ' mL de disolvente orgánico. ¿Cuántos mg pasan a la fase orgánica?', 'An aqueous solution (' + Va + ' mL) contains ' + m + ' mg of a compound with K = [org]/[aq] = ' + f(K, 1) + '. It is extracted once with ' + Vo + ' mL of organic solvent. How many mg go into the organic phase?'), a: ext, unit: 'mg',
        sol: t('Fracción que queda en el agua: ', 'Fraction left in water: ') + 'q = V<sub>ac</sub>/(V<sub>ac</sub> + K·V<sub>org</sub>) = ' + Va + '/(' + Va + ' + ' + f(K, 1) + ' × ' + Vo + ') = ' + f(q, 3) + '; ' + t('extraído', 'extracted') + ' = ' + m + ' × (1 − ' + f(q, 3) + ') = ' + H.sig(ext, 3) + ' mg' };
    } },
    { name: ['Extracciones múltiples', 'Multiple extractions'], gen: function (H) {
      var t = H.t, f = H.fmt, K = H.rnd(1, 10, 1), m = H.int(100, 1000), Va = 100, Vt = H.pick([60, 90, 120, 150]), n = H.pick([2, 3]), v = Vt / n, q = Math.pow(Va / (Va + K * v), n), ext = m * (1 - q), one = m * (1 - Va / (Va + K * Vt));
      return { q: t(m + ' mg de un compuesto (K = ' + f(K, 1) + ') están en 100 mL de agua. Se extraen con ' + n + ' porciones de ' + f(v, 0) + ' mL de disolvente orgánico. ¿Cuántos mg se extraen en total?', m + ' mg of a compound (K = ' + f(K, 1) + ') are in 100 mL of water. They are extracted with ' + n + ' portions of ' + f(v, 0) + ' mL of organic solvent. How many mg are extracted in total?'), a: ext, unit: 'mg',
        sol: t('Queda en el agua: ', 'Left in water: ') + m + ' × (100/(100 + ' + f(K, 1) + ' × ' + f(v, 0) + '))<sup>' + n + '</sup> = ' + H.sig(m * q, 3) + ' mg → ' + t('extraído', 'extracted') + ' = ' + H.sig(ext, 3) + ' mg. ' + t('Con una sola porción de ' + Vt + ' mL se extraerían ' + H.sig(one, 3) + ' mg.', 'A single ' + Vt + ' mL portion would extract ' + H.sig(one, 3) + ' mg.') };
    } },
    { name: ['Extracción ácido–base', 'Acid–base extraction'], gen: function (H) {
      var t = H.t, f = H.fmt, a = H.pick([[t('ácido benzoico', 'benzoic acid'), 4.20], [t('ácido acético', 'acetic acid'), 4.76], [t('fenol', 'phenol'), 9.95], [t('ácido salicílico', 'salicylic acid'), 2.97]]), pH = H.pick([1, 2, 3, 4, 5, 6, 7, 8, 10, 12]), fr = 100 / (1 + Math.pow(10, pH - a[1]));
      return { q: t('¿Qué porcentaje del ' + a[0] + ' (pK<sub>a</sub> = ' + f(a[1], 2) + ') está en forma neutra (extraíble al disolvente orgánico) a pH ' + pH + '?', 'What percentage of ' + a[0] + ' (pK<sub>a</sub> = ' + f(a[1], 2) + ') is in the neutral form (extractable into the organic solvent) at pH ' + pH + '?'), a: fr, unit: '%', abs: Math.max(0.05, fr * 0.02),
        sol: '% HA = 100 / (1 + 10<sup>pH − pKa</sup>) = 100 / (1 + 10<sup>' + f(pH - a[1], 2) + '</sup>) = ' + H.sig(fr, 3) + ' %' };
    } }
  ],
  predict: {
    2: { q: ['Con el mismo volumen total de disolvente, ¿qué extrae más soluto?', 'With the same total volume of solvent, what extracts more solute?'],
      options: [['Varias porciones pequeñas', 'Several small portions'], ['Una sola porción grande', 'One large portion'], ['Es igual', 'It is the same'], ['Depende solo de la densidad', 'It depends only on density']], answer: 0,
      why: ['La fracción que queda en el agua tras n extracciones es [V<sub>ac</sub>/(V<sub>ac</sub> + K·V/n)]ⁿ, que disminuye al aumentar n.', 'The fraction left in water after n extractions is [V<sub>aq</sub>/(V<sub>aq</sub> + K·V/n)]ⁿ, which decreases as n grows.'] },
    3: { q: ['Si una disolución orgánica de ácido benzoico se agita con NaOH acuoso, el ácido…', 'If an organic solution of benzoic acid is shaken with aqueous NaOH, the acid…'],
      options: [['Pasa a la fase acuosa como benzoato', 'Moves into the aqueous phase as benzoate'], ['Se queda en la fase orgánica', 'Stays in the organic phase'], ['Precipita en la interfase', 'Precipitates at the interface'], ['Se descompone', 'Decomposes']], answer: 0,
      why: ['A pH ≫ pK<sub>a</sub> el ácido se desprotona; el anión carboxilato es iónico y prefiere el agua. Al acidificar de nuevo vuelve a la forma neutra.', 'At pH ≫ pK<sub>a</sub> the acid is deprotonated; the carboxylate anion is ionic and prefers water. Acidifying again returns it to the neutral form.'] }
  }
});
