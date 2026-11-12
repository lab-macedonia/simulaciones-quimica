/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  /* Las etapas cambian con el tipo de enlace: iónico (ion), covalente (cov) o metálico (met). */
  var P = {
    ion: {
      1: { q: ['Al transferirse el electrón, ¿qué especie queda más pequeña que su átomo neutro?', 'When the electron is transferred, which species ends up smaller than its neutral atom?'], options: [['El anión', 'The anion'], ['El catión', 'The cation'], ['Ninguna: el tamaño no cambia', 'Neither: the size does not change']], answer: 1, why: ['El catión pierde su capa externa y queda más pequeño; el anión gana electrones, aumenta la repulsión entre ellos y crece.', 'The cation loses its outer shell and shrinks; the anion gains electrons, their repulsion rises and it grows.'] },
      3: { q: ['En un sólido iónico como el NaCl, ¿hay moléculas individuales?', 'In an ionic solid such as NaCl, are there individual molecules?'], options: [['Sí, pares Na–Cl', 'Yes, Na–Cl pairs'], ['No: es una red en que cada ion se rodea de iones opuestos', 'No: it is a lattice in which each ion is surrounded by opposite ions'], ['Sí, cadenas de iones', 'Yes, chains of ions']], answer: 1, why: ['En la red cada ion tiene 6 vecinos de carga opuesta; la fórmula solo indica la proporción de iones.', 'In the lattice each ion has 6 oppositely charged neighbours; the formula only gives the ion ratio.'] }
    },
    cov: {
      1: { q: ['Al acercar los dos átomos, la energía potencial…', 'As the two atoms approach, the potential energy…'], options: [['baja hasta un mínimo y luego sube si se acercan más', 'drops to a minimum, then rises if they get closer'], ['baja siempre', 'keeps dropping'], ['sube siempre', 'keeps rising']], answer: 0, why: ['El solapamiento estabiliza hasta la longitud de enlace; más cerca domina la repulsión entre núcleos (curva de Morse).', 'Overlap lowers the energy down to the bond length; closer than that, nuclear repulsion dominates (Morse curve).'] }
    },
    met: {
      1: { q: ['Al empaquetarse los átomos metálicos, los electrones de valencia…', 'When metal atoms pack together, the valence electrons…'], options: [['pasan a un átomo vecino', 'move to a neighbouring atom'], ['forman pares fijos entre dos átomos', 'form fixed pairs between two atoms'], ['se deslocalizan por todo el cristal', 'become delocalized over the whole crystal']], answer: 2, why: ['Quedan cationes en un «mar» de electrones móviles: un enlace no direccional.', 'Cations remain in a «sea» of mobile electrons: a non-directional bond.'] },
      3: { q: ['Al aplicar un campo eléctrico a un metal sólido, ¿qué se desplaza?', 'When an electric field is applied to a solid metal, what moves?'], options: [['Los cationes', 'The cations'], ['Los electrones, hacia el polo (+)', 'The electrons, towards the (+) pole'], ['Cationes y electrones por igual', 'Cations and electrons alike']], answer: 1, why: ['Los cationes siguen fijos en la red; el mar de electrones deriva hacia el polo positivo y transporta la corriente.', 'The cations stay fixed in the lattice; the electron sea drifts towards the positive pole and carries the current.'] }
    }
  };
  function at(i) { return function (k) { var m = (k && k.state && k.state.mode) || 'ion'; return (P[m] && P[m][i]) || null; }; }
  SimAula.register({ predict: { 1: at(1), 3: at(3) } });
})();

/* Práctica · Enlace químico. Un solo archivo para ES y EN (ver kit/aula.js). Usa los mismos datos y criterios del predictor de la simulación. */
(function () {
  var EL = [['H', 2.20, 'n'], ['Li', 0.98, 'm'], ['Na', 0.93, 'm'], ['K', 0.82, 'm'], ['Mg', 1.31, 'm'], ['Ca', 1.00, 'm'], ['Al', 1.61, 'm'], ['Fe', 1.83, 'm'], ['Cu', 1.90, 'm'], ['Zn', 1.65, 'm'],
    ['C', 2.55, 'n'], ['N', 3.04, 'n'], ['O', 3.44, 'n'], ['F', 3.98, 'n'], ['Si', 1.90, 'n'], ['P', 2.19, 'n'], ['S', 2.58, 'n'], ['Cl', 3.16, 'n'], ['Br', 2.96, 'n'], ['I', 2.66, 'n']];
  var T = { met: ['Metálico', 'Metallic'], ion: ['Iónico', 'Ionic'], covp: ['Covalente polar', 'Polar covalent'], cova: ['Covalente apolar', 'Nonpolar covalent'] };
  function den(a, b) { return Math.round(Math.abs(a[1] - b[1]) * 100) / 100; }
  function cls(a, b) { var d = den(a, b); if (a[2] === 'm' && b[2] === 'm') return 'met'; if (d >= 1.7) return 'ion'; if (a[2] !== b[2] || d >= 0.4) return 'covp'; return 'cova'; }
  function pair(H) { var a = H.pick(EL), b = H.pick(EL); return [a, b]; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Tipo de enlace', 'Bond type'], gen: function (H) {
        var p = pair(H), a = p[0], b = p[1], c = cls(a, b), d = den(a, b);
        var why = c === 'met' ? H.t('Dos metales: ninguno retiene con fuerza sus electrones de valencia.', 'Two metals: neither holds its valence electrons tightly.')
          : c === 'ion' ? H.t('ΔEN ≥ 1,7: un átomo cede electrones y el otro los capta.', 'ΔEN ≥ 1.7: one atom gives up electrons and the other takes them.')
          : c === 'covp' ? H.t('0,4 ≤ ΔEN < 1,7 (o metal + no metal con ΔEN < 1,7): electrones compartidos de forma desigual.', '0.4 ≤ ΔEN < 1.7 (or metal + nonmetal with ΔEN < 1.7): electrons shared unequally.')
          : H.t('ΔEN < 0,4: la nube se reparte casi por igual.', 'ΔEN < 0.4: the cloud is shared almost equally.');
        return H.mc(H.t('Según la diferencia de electronegatividad, ¿qué tipo de enlace se forma entre <b>' + a[0] + '</b> (EN = ' + H.fmt(a[1], 2) + ') y <b>' + b[0] + '</b> (EN = ' + H.fmt(b[1], 2) + ')?', 'Based on the electronegativity difference, what kind of bond forms between <b>' + a[0] + '</b> (EN = ' + H.fmt(a[1], 2) + ') and <b>' + b[0] + '</b> (EN = ' + H.fmt(b[1], 2) + ')?'),
          T[c], [T.met, T.ion, T.covp, T.cova], 'ΔEN = |' + H.fmt(a[1], 2) + ' − ' + H.fmt(b[1], 2) + '| = ' + H.fmt(d, 2) + '. ' + why);
      } },
      { name: ['Diferencia de electronegatividad', 'Electronegativity difference'], gen: function (H) {
        var a = H.pick(EL), b; do { b = H.pick(EL); } while (b === a);
        var d = den(a, b);
        return { q: H.t('Calcula ΔEN para el enlace ' + a[0] + '–' + b[0] + ' (EN: ' + a[0] + ' = ' + H.fmt(a[1], 2) + ', ' + b[0] + ' = ' + H.fmt(b[1], 2) + ').', 'Calculate ΔEN for the ' + a[0] + '–' + b[0] + ' bond (EN: ' + a[0] + ' = ' + H.fmt(a[1], 2) + ', ' + b[0] + ' = ' + H.fmt(b[1], 2) + ').'), a: d, abs: 0.005, aText: H.fmt(d, 2),
          sol: 'ΔEN = |' + H.fmt(a[1], 2) + ' − ' + H.fmt(b[1], 2) + '| = ' + H.fmt(d, 2) + ' → ' + H.L(T[cls(a, b)]).toLowerCase() };
      } },
      { name: ['Propiedades según el enlace', 'Properties from the bond'], gen: function (H) {
        var B = [[['Conduce la corriente fundido o disuelto, pero no como sólido; es duro y frágil', 'Conducts electricity when molten or dissolved but not as a solid; hard and brittle'], T.ion],
          [['Conduce en estado sólido, es maleable y dúctil', 'Conducts as a solid; malleable and ductile'], T.met],
          [['Gas a 25 °C, no conduce y solo presenta fuerzas de London entre moléculas', 'Gas at 25 °C, does not conduct, only London forces between molecules'], T.cova],
          [['Molecular, con dipolo permanente; sus moléculas se atraen por dipolo–dipolo o enlace de hidrógeno', 'Molecular with a permanent dipole; its molecules attract by dipole–dipole or hydrogen bonding'], T.covp]];
        return H.bank(B, function (b) { return H.t('Una sustancia: ' + H.L(b[0]).toLowerCase() + '. ¿Qué tipo de enlace predomina?', 'A substance: ' + H.L(b[0]).toLowerCase() + '. Which bond type dominates?'); }, function (b) { return b[1]; }, function (b) { return H.L(b[0]) + ' → ' + H.L(b[1]).toLowerCase() + '.'; });
      } }
    ]
  });
})();
