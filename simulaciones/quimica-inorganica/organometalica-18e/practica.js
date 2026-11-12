/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['¿Cuántos electrones de valencia tiene V(CO)₆? (V es del grupo 5)', 'How many valence electrons does V(CO)₆ have? (V is in group 5)'], options: [['18', '18'], ['17', '17'], ['16', '16']], answer: 1, why: ['5 + 6 × 2 = 17 e⁻: es un radical que se reduce con facilidad a [V(CO)₆]⁻, de 18 e⁻.', '5 + 6 × 2 = 17 e⁻: it is a radical that is easily reduced to [V(CO)₆]⁻, with 18 e⁻.'] },
  4: { q: ['Un complejo plano de 16 e⁻, como el de Vaska, frente a H₂…', 'A 16 e⁻ square-planar complex, such as Vaska’s, with H₂…'], options: [['no reacciona: ya es estable', 'does not react: it is already stable'], ['pierde ligandos hasta 14 e⁻', 'loses ligands down to 14 e⁻'], ['lo adiciona y pasa a 18 e⁻', 'adds it and reaches 18 e⁻']], answer: 2, why: ['Tiene sitios libres y un orbital vacío: la adición oxidante de H₂ lo lleva a 18 e⁻ (Ir(I) → Ir(III)).', 'It has free sites and an empty orbital: oxidative addition of H₂ takes it to 18 e⁻ (Ir(I) → Ir(III)).'] }
} });

/* Práctica · Regla de los 18 electrones (método neutro). Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* grupo del metal (electrones del metal neutro) */
  var M = { V: 5, Cr: 6, Mo: 6, W: 6, Mn: 7, Re: 7, Fe: 8, Ru: 8, Co: 9, Rh: 9, Ir: 9, Ni: 10, Pd: 10, Pt: 10 };
  /* ligando: electrones aportados por el método neutro */
  var LG = { CO: 2, PR3: 2, PPh3: 2, Cl: 1, H: 1, CH3: 1, Cp: 5, C6H6: 6, C2H4: 2, NO: 3, 'M–M': 1 };
  var LN = { CO: 'CO', PR3: 'PR₃', PPh3: 'PPh₃', Cl: 'Cl', H: 'H', CH3: 'CH₃', Cp: 'η⁵-Cp', C6H6: 'η⁶-C₆H₆', C2H4: 'η²-C₂H₄', NO: 'NO (lineal)', 'M–M': ['enlace M–M', 'M–M bond'] };
  /* fórmula, metal, ligandos {nombre: cantidad}, carga */
  var X = [['Cr(CO)₆', 'Cr', { CO: 6 }, 0], ['Mo(CO)₆', 'Mo', { CO: 6 }, 0], ['Fe(CO)₅', 'Fe', { CO: 5 }, 0], ['Ni(CO)₄', 'Ni', { CO: 4 }, 0], ['V(CO)₆', 'V', { CO: 6 }, 0], ['[V(CO)₆]⁻', 'V', { CO: 6 }, -1],
    ['Fe(η⁵-C₅H₅)₂ (ferroceno)', 'Fe', { Cp: 2 }, 0], ['Co(η⁵-C₅H₅)₂ (cobaltoceno)', 'Co', { Cp: 2 }, 0], ['Cr(η⁶-C₆H₆)₂', 'Cr', { C6H6: 2 }, 0], ['Cr(η⁶-C₆H₆)(CO)₃', 'Cr', { C6H6: 1, CO: 3 }, 0], ['(η⁵-C₅H₅)Mn(CO)₃', 'Mn', { Cp: 1, CO: 3 }, 0],
    ['Mn₂(CO)₁₀ (por Mn)', 'Mn', { CO: 5, 'M–M': 1 }, 0], ['Co₂(CO)₈ (por Co, isómero sin puentes)', 'Co', { CO: 4, 'M–M': 1 }, 0], ['HMn(CO)₅', 'Mn', { H: 1, CO: 5 }, 0], ['CH₃Mn(CO)₅', 'Mn', { CH3: 1, CO: 5 }, 0],
    ['RhCl(PPh₃)₃ (Wilkinson)', 'Rh', { Cl: 1, PPh3: 3 }, 0], ['IrCl(CO)(PPh₃)₂ (Vaska)', 'Ir', { Cl: 1, CO: 1, PPh3: 2 }, 0], ['[PtCl₃(η²-C₂H₄)]⁻ (Zeise)', 'Pt', { Cl: 3, C2H4: 1 }, -1], ['Pd(PPh₃)₄', 'Pd', { PPh3: 4 }, 0], ['Co(CO)₃(NO)', 'Co', { CO: 3, NO: 1 }, 0], ['[Fe(CO)₄]²⁻', 'Fe', { CO: 4 }, -2]];
  function cnt(x) {
    var tot = M[x[1]], parts = [x[1] + ' ' + M[x[1]]];
    for (var k in x[2]) { var n = x[2][k], e = LG[k]; tot += n * e; parts.push((n > 1 ? n + ' × ' : '') + (Array.isArray(LN[k]) ? '{' + k + '}' : LN[k]) + ' ' + e); }
    tot -= x[3]; if (x[3]) parts.push(x[3] < 0 ? '+' + (-x[3]) + ' (carga)' : '−' + x[3] + ' (carga)');
    return { n: tot, txt: parts.join(' + ').replace('+ −', '− ') };
  }
  function tr(s, H) { return s.replace('{M–M}', H.t('enlace M–M', 'M–M bond')).replace(' (carga)', H.t(' (carga)', ' (charge)')).replace('(ferroceno)', H.t('(ferroceno)', '(ferrocene)')).replace('(cobaltoceno)', H.t('(cobaltoceno)', '(cobaltocene)')).replace('(por Mn)', H.t('(por Mn)', '(per Mn)')).replace('(por Co, isómero sin puentes)', H.t('(por Co, isómero sin puentes)', '(per Co, unbridged isomer)')).replace('NO (lineal)', H.t('NO (lineal)', 'NO (linear)')); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Conteo de electrones', 'Electron count'], gen: function (H) {
        var x = H.pick(X), c = cnt(x);
        return { q: H.t('Por el método neutro, ¿cuántos electrones de valencia tiene el metal en <b>' + tr(x[0], H) + '</b>?', 'Using the neutral method, how many valence electrons does the metal have in <b>' + tr(x[0], H) + '</b>?'), a: c.n, abs: 0, aText: String(c.n),
          sol: tr(c.txt, H) + ' = ' + c.n + ' e⁻' + (c.n === 18 ? H.t(' → cumple la regla de 18.', ' → obeys the 18-electron rule.') : c.n === 16 ? H.t(' → 16 e⁻, típico de complejos planos cuadrados d⁸.', ' → 16 e⁻, typical of square-planar d⁸ complexes.') : H.t(' → no cumple la regla de 18.', ' → does not obey the 18-electron rule.')) };
      } },
      { name: ['Carbonilo que cumple 18 e⁻', '18-electron carbonyl'], gen: function (H) {
        var m = H.pick([['Cr', 6], ['Mo', 6], ['W', 6], ['Fe', 8], ['Ru', 8], ['Ni', 10]]), n = (18 - m[1]) / 2;
        return { q: H.t('¿Cuántos ligandos CO necesita el ' + m[0] + ' (grupo ' + m[1] + ') para formar un carbonilo mononuclear neutro M(CO)<sub>n</sub> de 18 electrones?', 'How many CO ligands does ' + m[0] + ' (group ' + m[1] + ') need to form a neutral mononuclear 18-electron M(CO)<sub>n</sub>?'), a: n, abs: 0, aText: String(n),
          sol: m[1] + ' + 2n = 18 → n = ' + n + ' → ' + m[0] + '(CO)<sub>' + n + '</sub>. ' + H.t('Los metales de grupo impar (Mn, Co) no pueden llegar a 18 con solo CO y forman dímeros con enlace M–M.', 'Odd-group metals (Mn, Co) cannot reach 18 with CO alone and form dimers with an M–M bond.') };
      } }
    ]
  });
})();
