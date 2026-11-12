/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["Con ligandos aceptores π como el CO, Δo será…", "With π-acceptor ligands such as CO, Δo will be…"], options: [["mayor", "larger"], ["menor", "smaller"], ["igual", "the same"]], answer: 0, why: ["La retrodonación baja la energía de los t₂g y aumenta la separación con los e_g*.", "Back-donation lowers the t₂g energy and widens the gap to e_g*."] } } });

/* Práctica: llenado de t2g/eg en complejos octaédricos y tipo de ligando π. */
(function () {
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sp(n) { return String(n).replace(/\d/g, function (c) { return SUP[+c]; }); }
  function fill(d, strong) {
    var t = 0, e = 0;
    if (strong) { t = Math.min(d, 6); e = d - t; } else { var k = d; t = Math.min(k, 3); k -= t; e = Math.min(k, 2); k -= e; t += Math.min(k, 3); k -= Math.min(k, 3); e += k; }
    var u = (t <= 3 ? t : 6 - t) + (e <= 2 ? e : 4 - e);
    return { t: t, e: e, u: u, lfse: -0.4 * t + 0.6 * e };
  }
  /* ion metálico, d^n */
  var ION = [['Ti³⁺', 1], ['V³⁺', 2], ['Cr³⁺', 3], ['Mn³⁺', 4], ['Cr²⁺', 4], ['Mn²⁺', 5], ['Fe³⁺', 5], ['Fe²⁺', 6], ['Co³⁺', 6], ['Co²⁺', 7], ['Ni²⁺', 8], ['Cu²⁺', 9]];
  var LIG = [['F⁻', 0], ['H₂O', 0], ['Cl⁻', 0], ['OH⁻', 0], ['CN⁻', 1], ['CO', 1], ['bipy', 1], ['phen', 1]];
  var K = { d: ['π-donador (disminuye Δo)', 'π-donor (decreases Δo)'], s: ['Solo σ-donador', 'σ-donor only'], a: ['π-aceptor (aumenta Δo)', 'π-acceptor (increases Δo)'] };
  var PL = [['CO', 'a'], ['CN⁻', 'a'], ['PR₃', 'a'], ['NO⁺', 'a'], ['NH₃', 's'], ['H⁻', 's'], ['en', 's'], ['F⁻', 'd'], ['Cl⁻', 'd'], ['OH⁻', 'd'], ['O²⁻', 'd'], ['I⁻', 'd']];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Electrones desapareados', 'Unpaired electrons'], gen: function (H) {
        var m = H.pick(ION), l = H.pick(LIG), d = m[1], f = fill(d, l[1]), amb = d >= 4 && d <= 7;
        return { q: H.t('¿Cuántos electrones desapareados tiene [M(' + l[0] + ')₆] con ' + m[0] + ' (d' + sp(d) + ')? ' + l[0] + ' es un ligando de campo ' + (l[1] ? 'fuerte' : 'débil') + '.', 'How many unpaired electrons does [M(' + l[0] + ')₆] with ' + m[0] + ' (d' + sp(d) + ') have? ' + l[0] + ' is a ' + (l[1] ? 'strong' : 'weak') + '-field ligand.').replace('M', m[0].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺]+$/, '')), a: f.u, abs: 0, aText: String(f.u),
          sol: 't<sub>2g</sub>' + sp(f.t) + ' e<sub>g</sub>' + sp(f.e) + ' → ' + f.u + H.t(' desapareado(s). ', ' unpaired. ') + (amb ? (l[1] ? H.t('Campo fuerte: Δo > energía de apareamiento, se llena t₂g antes que e_g (bajo espín).', 'Strong field: Δo > pairing energy, t₂g fills before e_g (low spin).') : H.t('Campo débil: Δo < energía de apareamiento, se ocupa e_g antes de aparear (alto espín).', 'Weak field: Δo < pairing energy, e_g is occupied before pairing (high spin).')) : H.t('Para d¹–d³ y d⁸–d⁹ el resultado no depende del campo.', 'For d¹–d³ and d⁸–d⁹ the result does not depend on the field.')) };
      } },
      { name: ['Energía de estabilización (EECL)', 'Ligand field stabilization energy (LFSE)'], gen: function (H) {
        var m = H.pick(ION), l = H.pick(LIG), f = fill(m[1], l[1]);
        return { q: H.t('Calcula la EECL de ' + m[0] + ' (d' + sp(m[1]) + ') con seis ' + l[0] + ' (campo ' + (l[1] ? 'fuerte' : 'débil') + '), en unidades de Δo (sin contar la energía de apareamiento). Escribe un número negativo.', 'Calculate the LFSE of ' + m[0] + ' (d' + sp(m[1]) + ') with six ' + l[0] + ' (' + (l[1] ? 'strong' : 'weak') + ' field), in units of Δo (ignoring pairing energy). Type a negative number.'), a: f.lfse, abs: 0.01, aText: H.fmt(f.lfse, 1) + ' Δo',
          sol: H.t('EECL = −0,4·n(t<sub>2g</sub>) + 0,6·n(e<sub>g</sub>) = −0,4 × ', 'LFSE = −0.4·n(t<sub>2g</sub>) + 0.6·n(e<sub>g</sub>) = −0.4 × ') + f.t + H.t(' + 0,6 × ', ' + 0.6 × ') + f.e + ' = ' + H.fmt(f.lfse, 1) + ' Δo' };
      } },
      { name: ['Tipo de ligando π', 'π-ligand type'], gen: function (H) {
        return H.bank(PL, function (p) { return H.t('En la teoría de OM, ¿cómo actúa el ligando <b>' + p[0] + '</b>?', 'In MO theory, how does the ligand <b>' + p[0] + '</b> act?'); }, function (p) { return K[p[1]]; },
          function (p) { return p[1] === 'a' ? H.t('Tiene orbitales π* vacíos que aceptan densidad de los t₂g: los estabiliza y Δo crece (retrodonación).', 'It has empty π* orbitals that accept density from t₂g: they are stabilized and Δo grows (back-bonding).') : p[1] === 'd' ? H.t('Tiene pares p llenos que interactúan con t₂g: los desestabiliza y Δo disminuye.', 'It has filled p pairs that interact with t₂g: they are destabilized and Δo decreases.') : H.t('No tiene orbitales de simetría π adecuados: t₂g queda no enlazante.', 'It has no suitable π-symmetry orbitals: t₂g stays nonbonding.'); }, [K.d, K.s, K.a]);
      } }
    ]
  });
})();
