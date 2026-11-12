/* Práctica y predicciones · Radiactividad y química nuclear. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var ISO = [['¹⁴C', 5730, ['años', 'years']], ['¹³¹I', 8.02, ['días', 'days']], ['⁶⁰Co', 5.27, ['años', 'years']], ['³²P', 14.3, ['días', 'days']], ['⁹⁰Sr', 28.8, ['años', 'years']], ['²²²Rn', 3.82, ['días', 'days']], ['⁹⁹ᵐTc', 6.01, ['horas', 'hours']]];
  /* [padre, tipo, hijo correcto, distractores] */
  var DEC = [['²³⁸₉₂U', 'α', '²³⁴₉₀Th', ['²³⁴₉₂U', '²³⁸₉₃Np', '²³⁴₉₁Pa']], ['²²⁶₈₈Ra', 'α', '²²²₈₆Rn', ['²²²₈₈Ra', '²²⁶₈₉Ac', '²²⁴₈₆Rn']], ['²¹⁰₈₄Po', 'α', '²⁰⁶₈₂Pb', ['²⁰⁶₈₄Po', '²¹⁰₈₅At', '²⁰⁸₈₂Pb']],
    ['¹⁴₆C', 'β⁻', '¹⁴₇N', ['¹⁴₅B', '¹³₆C', '¹⁰₄Be']], ['⁶⁰₂₇Co', 'β⁻', '⁶⁰₂₈Ni', ['⁶⁰₂₆Fe', '⁵⁶₂₅Mn', '⁶¹₂₇Co']], ['¹³¹₅₃I', 'β⁻', '¹³¹₅₄Xe', ['¹³¹₅₂Te', '¹²⁷₅₁Sb', '¹³⁰₅₃I']], ['⁹⁰₃₈Sr', 'β⁻', '⁹⁰₃₉Y', ['⁹⁰₃₇Rb', '⁸⁶₃₆Kr', '⁸⁹₃₈Sr']], ['¹⁸₉F', 'β⁺', '¹⁸₈O', ['¹⁸₁₀Ne', '¹⁴₇N', '¹⁷₉F']]];
  SimAula.register({
    problems: [
      { name: ['Cantidad restante tras un tiempo', 'Amount remaining after a time'], gen: function (H) {
        var t = H.t, f = H.fmt, i = H.pick(ISO), m0 = H.int(10, 500), tt = +(i[1] * H.rnd(0.3, 5, 2)).toPrecision(3), m = m0 * Math.pow(2, -tt / i[1]), u = H.L(i[2]);
        return { q: t('Se tienen ' + m0 + ' mg de ' + i[0] + ' (t<sub>½</sub> = ' + f(i[1], i[1] < 100 ? 2 : 0) + ' ' + u + '). ¿Qué masa queda después de ' + H.sig(tt, 3) + ' ' + u + '?', 'You have ' + m0 + ' mg of ' + i[0] + ' (t<sub>½</sub> = ' + f(i[1], i[1] < 100 ? 2 : 0) + ' ' + u + '). What mass remains after ' + H.sig(tt, 3) + ' ' + u + '?'), a: m, unit: 'mg',
          sol: 'm = m₀·2<sup>−t/t½</sup> = ' + m0 + ' × 2<sup>−' + H.sig(tt, 3) + '/' + f(i[1], i[1] < 100 ? 2 : 0) + '</sup> = ' + m0 + ' × ' + H.sig(Math.pow(2, -tt / i[1]), 3) + ' = ' + H.sig(m, 3) + ' mg' };
      } },
      { name: ['Datación con carbono-14', 'Carbon-14 dating'], gen: function (H) {
        var t = H.t, f = H.fmt, pct = H.rnd(5, 92, 1), age = 5730 * Math.log(100 / pct) / Math.LN2;
        return { q: t('Un trozo de madera conserva el ' + f(pct, 1) + ' % del ¹⁴C que tiene la madera viva (t<sub>½</sub> = 5730 años). ¿Qué edad tiene?', 'A piece of wood keeps ' + f(pct, 1) + ' % of the ¹⁴C in living wood (t<sub>½</sub> = 5730 years). How old is it?'), a: age, unit: t('años', 'years'),
          sol: 't = t<sub>½</sub> · log₂(N₀/N) = 5730 × ln(100/' + f(pct, 1) + ') / ln 2 = ' + H.sig(age, 3) + t(' años', ' years') };
      } },
      { name: ['Constante de desintegración y actividad', 'Decay constant and activity'], gen: function (H) {
        var t = H.t, f = H.fmt, i = H.pick(ISO.filter(function (x) { return x[2][0] !== 'años'; })), N = H.rnd(1, 9, 1) * 1e15, sec = { 'días': 86400, 'horas': 3600 }[i[2][0]], lam = Math.LN2 / (i[1] * sec), A = lam * N;
        return { q: t('Una muestra contiene ' + H.sig(N, 2) + ' núcleos de ' + i[0] + ' (t<sub>½</sub> = ' + f(i[1], 2) + ' ' + i[2][0] + '). ¿Cuál es su actividad en becquerel (desintegraciones por segundo)?', 'A sample contains ' + H.sig(N, 2) + ' nuclei of ' + i[0] + ' (t<sub>½</sub> = ' + f(i[1], 2) + ' ' + i[2][1] + '). What is its activity in becquerel (decays per second)?'), a: A, unit: 'Bq', tol: 0.03,
          sol: 'λ = ln 2 / t<sub>½</sub> = ' + f(0.693, 3) + ' / (' + f(i[1], 2) + ' × ' + sec + ' s) = ' + H.sig(lam, 3) + ' s⁻¹; A = λN = ' + H.sig(A, 3) + ' Bq',
          hint: t('Pasa la vida media a segundos.', 'Convert the half-life to seconds.') };
      } },
      { name: ['Producto de una desintegración', 'Product of a decay'], gen: function (H) {
        var t = H.t, d = H.pick(DEC), ops = [d[2]].concat(d[3]);
        return { q: t('¿Qué núcleo se forma cuando ' + d[0] + ' sufre una desintegración ' + d[1] + '?', 'Which nucleus forms when ' + d[0] + ' undergoes ' + d[1] + ' decay?'), options: ops, answer: 0,
          sol: d[1] === 'α' ? t('En la emisión α (⁴₂He) A baja 4 y Z baja 2.', 'In α emission (⁴₂He) A drops by 4 and Z by 2.') : d[1] === 'β⁻' ? t('En la emisión β⁻ un neutrón se convierte en protón: Z sube 1 y A no cambia.', 'In β⁻ emission a neutron turns into a proton: Z rises by 1 and A is unchanged.') : t('En la emisión β⁺ un protón se convierte en neutrón: Z baja 1 y A no cambia.', 'In β⁺ emission a proton turns into a neutron: Z drops by 1 and A is unchanged.') };
      } }
    ],
    predict: {
      2: { q: ['En una desintegración α, ¿cómo cambian el número atómico Z y el número másico A?', 'In α decay, how do the atomic number Z and the mass number A change?'],
        options: [['Z baja 2 y A baja 4', 'Z drops by 2 and A by 4'], ['Z sube 1 y A no cambia', 'Z rises by 1 and A is unchanged'], ['Z baja 4 y A baja 2', 'Z drops by 4 and A by 2'], ['No cambian', 'They do not change']], answer: 0,
        why: ['La partícula α es un núcleo de helio-4: se lleva 2 protones y 2 neutrones.', 'The α particle is a helium-4 nucleus: it carries away 2 protons and 2 neutrons.'] },
      4: { q: ['¿Qué fracción de los núcleos radiactivos queda después de 3 vidas medias?', 'What fraction of the radioactive nuclei remains after 3 half-lives?'],
        options: [['1/8', '1/8'], ['1/3', '1/3'], ['1/6', '1/6'], ['Ninguno', 'None']], answer: 0,
        why: ['Cada vida media deja la mitad: ½ · ½ · ½ = 1/8 (12,5 %). La desintegración es exponencial, nunca llega exactamente a cero.', 'Each half-life leaves half: ½ · ½ · ½ = 1/8 (12.5 %). The decay is exponential and never reaches exactly zero.'] },
      5: { q: ['Una muestra conserva el 25 % del ¹⁴C original. ¿Qué edad aproximada tiene?', 'A sample keeps 25 % of its original ¹⁴C. About how old is it?'],
        options: [['≈ 11 500 años (2 vidas medias)', '≈ 11,500 years (2 half-lives)'], ['≈ 5700 años', '≈ 5,700 years'], ['≈ 23 000 años', '≈ 23,000 years'], ['≈ 1400 años', '≈ 1,400 years']], answer: 0,
        why: ['25 % = (½)² → 2 vidas medias × 5730 años ≈ 11 460 años.', '25 % = (½)² → 2 half-lives × 5730 years ≈ 11,460 years.'] }
    }
  });
})();
