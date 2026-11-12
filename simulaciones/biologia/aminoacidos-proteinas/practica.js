/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["A pH 1, ¿qué carga neta tiene la glicina?", "At pH 1, what is the net charge of glycine?"], options: [["+1", "+1"], ["0", "0"], ["−1", "−1"], ["−2", "−2"]], answer: 0, why: ["Ambos grupos están protonados: −NH₃⁺ y −COOH.", "Both groups are protonated: −NH₃⁺ and −COOH."] } } });

/* Práctica: carga neta según pH y pI, enlaces peptídicos y clasificación de cadenas laterales. */
(function () {
  /* nombre es, nombre en, código, pI, clase */
  var AA = [['glicina', 'glycine', 'Gly', 5.97, 'np'], ['alanina', 'alanine', 'Ala', 6.0, 'np'], ['valina', 'valine', 'Val', 5.96, 'np'], ['leucina', 'leucine', 'Leu', 5.98, 'np'], ['fenilalanina', 'phenylalanine', 'Phe', 5.48, 'np'],
    ['serina', 'serine', 'Ser', 5.68, 'po'], ['treonina', 'threonine', 'Thr', 5.6, 'po'], ['asparagina', 'asparagine', 'Asn', 5.41, 'po'], ['glutamina', 'glutamine', 'Gln', 5.65, 'po'],
    ['ácido aspártico', 'aspartic acid', 'Asp', 2.77, 'ac'], ['ácido glutámico', 'glutamic acid', 'Glu', 3.22, 'ac'], ['lisina', 'lysine', 'Lys', 9.74, 'ba'], ['arginina', 'arginine', 'Arg', 10.76, 'ba'], ['histidina', 'histidine', 'His', 7.59, 'ba']];
  var CL = { np: ['Apolar (hidrofóbica)', 'Nonpolar (hydrophobic)'], po: ['Polar sin carga', 'Polar, uncharged'], ac: ['Ácida (carga − a pH 7)', 'Acidic (− charge at pH 7)'], ba: ['Básica (carga + a pH 7)', 'Basic (+ charge at pH 7)'] };
  var POS = ['Positiva (migra al cátodo)', 'Positive (moves to the cathode)'], NEG = ['Negativa (migra al ánodo)', 'Negative (moves to the anode)'], ZER = ['Neutra (no migra)', 'Neutral (does not move)'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Carga neta según el pH', 'Net charge versus pH'], gen: function (H) {
        var a = H.pick(AA), d = H.pick([-3, -2, -1.5, 1.5, 2, 3, 0]), pH = Math.round((a[3] + d) * 10) / 10;
        if (pH < 0.5 || pH > 13.5) pH = Math.round(a[3] * 10) / 10;
        var r = Math.abs(pH - a[3]) < 0.05 ? ZER : pH < a[3] ? POS : NEG;
        return H.mc(H.t('El aminoácido <b>' + a[0] + '</b> (pI = ' + H.fmt(a[3], 2) + ') está en una disolución de pH ' + H.fmt(pH, 1) + '. ¿Qué carga neta tiene en una electroforesis?', '<b>' + a[1].charAt(0).toUpperCase() + a[1].slice(1) + '</b> (pI = ' + H.fmt(a[3], 2) + ') is in a solution at pH ' + H.fmt(pH, 1) + '. What net charge does it have in electrophoresis?'), r, [POS, NEG, ZER],
          H.t('Si pH < pI, predominan los grupos protonados (+); si pH > pI, los desprotonados (−); en el pI la carga neta es cero.', 'If pH < pI, protonated groups dominate (+); if pH > pI, deprotonated groups dominate (−); at the pI the net charge is zero.'));
      } },
      { name: ['Enlaces peptídicos y agua', 'Peptide bonds and water'], gen: function (H) {
        var n = H.int(3, 150), ask = H.pick(['bonds', 'water']);
        return { q: H.t('Un polipéptido lineal tiene <b>' + n + '</b> aminoácidos. ¿Cuántas ' + (ask === 'bonds' ? 'uniones peptídicas tiene' : 'moléculas de agua se liberaron al formarlo') + '?', 'A linear polypeptide has <b>' + n + '</b> amino acids. How many ' + (ask === 'bonds' ? 'peptide bonds does it have' : 'water molecules were released when it formed') + '?'), a: n - 1, abs: 0, aText: String(n - 1),
          sol: H.t('Cada enlace peptídico une dos aminoácidos y libera una molécula de agua (condensación): n − 1 = ', 'Each peptide bond joins two amino acids and releases one water molecule (condensation): n − 1 = ') + (n - 1) + '.' };
      } },
      { name: ['Tipo de cadena lateral', 'Side-chain type'], gen: function (H) {
        return H.bank(AA, function (a) { return H.t('¿Cómo se clasifica la cadena lateral de <b>' + a[0] + '</b> (' + a[2] + ')?', 'How is the side chain of <b>' + a[1] + '</b> (' + a[2] + ') classified?'); }, function (a) { return CL[a[4]]; }, function (a) { return a[2] + ': ' + H.L(CL[a[4]]) + '.'; }, [CL.np, CL.po, CL.ac, CL.ba]);
      } }
    ]
  });
})();
