/* Práctica · Espectrometría de masas y RMN de ¹³C (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Grados de insaturación', 'Degrees of unsaturation'], gen: function (H) {
    var c = H.int(3, 10), h = 2 * c + 2 - 2 * H.int(0, 4), n = H.pick([0, 0, 1]), x = H.pick([0, 0, 1]), o = H.int(0, 2); h -= x; h += n; if (h < 2) return null; var d = (2 * c + 2 + n - h - x) / 2;
    var f = 'C' + H.sup(c).replace(/[⁰-⁹]/g, function (s) { return '₀₁₂₃₄₅₆₇₈₉'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(s)]; }) + 'H' + String(h).replace(/\d/g, function (s) { return '₀₁₂₃₄₅₆₇₈₉'[+s]; }) + (n ? 'N' : '') + (x ? 'Cl' : '') + (o ? 'O' + (o > 1 ? '₂' : '') : '');
    return { q: H.t('¿Cuántos grados de insaturación tiene ' + f + '?', 'How many degrees of unsaturation does ' + f + ' have?'), a: d, abs: 0, aText: String(d),
      sol: 'GI = (2C + 2 + N − H − X)/2 = (' + (2 * c + 2) + ' + ' + n + ' − ' + h + ' − ' + x + ')/2 = ' + d + H.t(' (el O no cuenta)', ' (O does not count)') };
  } },
  { name: ['Patrón isotópico M+2', 'M+2 isotope pattern'], gen: function (H) {
    var c = H.pick([['Cl', '3 : 1'], ['Br', '1 : 1'], ['S', '≈ 22 : 1'], ['C/H/O', H.t('M+2 casi ausente', 'M+2 nearly absent')]]);
    return { q: H.t('Un ion molecular muestra M y M+2 en proporción ' + c[1] + '. ¿Qué contiene probablemente?', 'A molecular ion shows M and M+2 in a ' + c[1] + ' ratio. What does it probably contain?'), options: [H.t('Un átomo de cloro', 'One chlorine atom'), H.t('Un átomo de bromo', 'One bromine atom'), H.t('Un átomo de azufre', 'One sulfur atom'), H.t('Solo C, H y O', 'Only C, H and O')], answer: ['Cl', 'Br', 'S', 'C/H/O'].indexOf(c[0]),
      sol: '³⁵Cl : ³⁷Cl ≈ 3 : 1; ⁷⁹Br : ⁸¹Br ≈ 1 : 1; ³⁴S ≈ ' + H.fmt(4.4, 1) + ' %.' };
  } },
  { name: ['Señales de ¹³C', '¹³C signals'], gen: function (H) {
    var m = H.pick([['etanol', 'ethanol', 2], ['propan-2-ol', 'propan-2-ol', 2], ['butan-2-ona', 'butan-2-one', 4], ['tolueno', 'toluene', 5], ['ciclohexano', 'cyclohexane', 1], ['p-xileno', 'p-xylene', 3], ['acetato de etilo', 'ethyl acetate', 4], ['pentan-3-ona', 'pentan-3-one', 3]]);
    return { q: H.t('¿Cuántas señales muestra el espectro de RMN de ¹³C del ' + m[0] + '?', 'How many signals does the ¹³C NMR spectrum of ' + m[1] + ' show?'), a: m[2], abs: 0, aText: String(m[2]),
      sol: H.t('Una señal por cada tipo de carbono no equivalente (relacionado por simetría).', 'One signal per set of non-equivalent carbons (related by symmetry).') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 1: { q: ["Un compuesto con un átomo de bromo muestra M y M+2 en proporción…", "A compound with one bromine shows M and M+2 in a ratio of…"], options: [["1 : 1", "1 : 1"], ["3 : 1", "3 : 1"], ["1 : 0", "1 : 0"]], answer: 0, why: ["⁷⁹Br y ⁸¹Br son casi igual de abundantes.", "⁷⁹Br and ⁸¹Br are almost equally abundant."] } } });
