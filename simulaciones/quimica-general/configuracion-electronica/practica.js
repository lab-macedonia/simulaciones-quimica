/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['¿Cuál es la configuración real del cromo (Z = 24)?', 'What is the actual configuration of chromium (Z = 24)?'], options: [['[Ar] 3d⁴ 4s²', '[Ar] 3d⁴ 4s²'], ['[Ar] 3d⁵ 4s¹', '[Ar] 3d⁵ 4s¹'], ['[Ar] 3d⁶', '[Ar] 3d⁶']], answer: 1, why: ['Un electrón 4s pasa al 3d: el subnivel d semilleno (seis electrones desapareados) es más estable.', 'One 4s electron moves to 3d: the half-filled d subshell (six unpaired electrons) is more stable.'] },
  4: { q: ['Al formar Fe³⁺, los primeros electrones que salen son los del…', 'When Fe³⁺ forms, the first electrons removed are the…'], options: [['3d', '3d'], ['4s', '4s'], ['3p', '3p']], answer: 1, why: ['Salen primero los de mayor n (4s) y luego uno 3d: Fe³⁺ queda [Ar] 3d⁵.', 'The highest-n electrons (4s) leave first, then one 3d: Fe³⁺ is [Ar] 3d⁵.'] }
} });

/* Recorrido guiado · Configuración electrónica. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var D = SimAula.dom;
  SimAula.register({
    tour: [
      { t: ['Configura un elemento', 'Configure an element'], sel: '#orbitalDiagram', go: function () { D.tab('configurar'); D.set('elementSelect', 8); },
        x: ['Se eligió el oxígeno (Z = 8). Mira la notación completa, la reducida y el diagrama de orbitales: cada casilla es un orbital y cada flecha un electrón.', 'Oxygen (Z = 8) has been selected. Look at the full and short notation and the orbital diagram: each box is an orbital and each arrow an electron.'] },
      { t: ['Predice: regla de Hund', 'Predict: Hund\'s rule'], sel: '#orbitalDiagram', go: function () { D.tab('configurar'); D.set('elementSelect', 8); },
        q: ['¿Cuántos electrones desapareados tiene el oxígeno (1s² 2s² 2p⁴)?', 'How many unpaired electrons does oxygen (1s² 2s² 2p⁴) have?'], x: ['Piensa cómo se reparten 4 electrones en los tres orbitales 2p.', 'Think about how 4 electrons are spread over the three 2p orbitals.'],
        ask: { options: ['2', '0', '4', '1'], answer: 0, why: ['Regla de Hund: los electrones ocupan primero orbitales vacíos con el mismo espín; el cuarto se aparea. Quedan 2 desapareados (por eso el O₂ es paramagnético, aunque eso lo explica la teoría de OM).', 'Hund\'s rule: electrons first fill empty orbitals with parallel spin; the fourth pairs up. Two remain unpaired.'] } },
      { t: ['Llenado paso a paso', 'Step-by-step filling'], sel: '#aufbauGrid', go: function () { D.tab('paso'); },
        x: ['Añade electrones de uno en uno con «+ 1 e⁻». El orden sigue la regla n + ℓ (principio de Aufbau): primero el subnivel con menor n + ℓ y, si empatan, el de menor n.', 'Add electrons one at a time with «+ 1 e⁻». The order follows the n + ℓ rule (Aufbau principle): first the subshell with the lowest n + ℓ and, if tied, the one with lower n.'] },
      { t: ['Predice: 4s o 3d', 'Predict: 4s or 3d'], sel: '#aufbauGrid', go: function () { D.tab('paso'); },
        q: ['¿Qué subnivel se llena primero, 4s o 3d?', 'Which subshell fills first, 4s or 3d?'], x: ['Calcula n + ℓ para cada uno.', 'Calculate n + ℓ for each.'],
        ask: { options: ['4s', '3d', [ 'Los dos a la vez', 'Both at once'], ['Depende del elemento: siempre 3d en metales', 'It depends: always 3d in metals']], answer: 0, why: ['4s: n + ℓ = 4 + 0 = 4; 3d: 3 + 2 = 5. Se llena antes el 4s (K y Ca), y luego el 3d (Sc a Zn).', '4s: n + ℓ = 4 + 0 = 4; 3d: 3 + 2 = 5. 4s fills first (K and Ca), then 3d (Sc to Zn).'] } },
      { t: ['Excepciones: cromo y cobre', 'Exceptions: chromium and copper'], sel: '#exceptionNote', go: function () { D.tab('configurar'); D.set('elementSelect', 24); },
        x: ['El cromo no es [Ar] 3d⁴ 4s² sino [Ar] 3d⁵ 4s¹: el subnivel d semilleno es más estable. El cobre hace lo mismo con el d lleno ([Ar] 3d¹⁰ 4s¹).', 'Chromium is not [Ar] 3d⁴ 4s² but [Ar] 3d⁵ 4s¹: a half-filled d subshell is more stable. Copper does the same with a full d ([Ar] 3d¹⁰ 4s¹).'] },
      { t: ['Iones de metales de transición', 'Transition-metal ions'], sel: '#ionConfig', go: function () { D.tab('iones'); },
        q: ['El hierro es [Ar] 3d⁶ 4s². ¿Qué electrones pierde al formar Fe²⁺?', 'Iron is [Ar] 3d⁶ 4s². Which electrons does it lose to form Fe²⁺?'], x: ['Compruébalo eligiendo Fe y carga +2.', 'Check it by choosing Fe and charge +2.'],
        ask: { options: [['Los dos 4s → [Ar] 3d⁶', 'The two 4s → [Ar] 3d⁶'], ['Dos 3d → [Ar] 3d⁴ 4s²', 'Two 3d → [Ar] 3d⁴ 4s²'], ['Uno 4s y uno 3d', 'One 4s and one 3d'], ['Ninguno: gana electrones', 'None: it gains electrons']], answer: 0, why: ['En los metales de transición se pierden primero los electrones del nivel más externo (4s), aunque se hayan llenado antes.', 'Transition metals lose the outermost (4s) electrons first, even though they filled first.'] } },
      { t: ['Pon a prueba lo aprendido', 'Test what you learned'], sel: '#quizPrompt', go: function () { D.tab('quiz'); }, x: ['Responde varias preguntas del desafío. Desde «Aula» puedes generar un informe de la sesión.', 'Answer several challenge questions. From «Class» you can create a session report.'] }
    ]
  });
})();

/* Práctica: configuraciones generadas por el principio de Aufbau (Z = 1–36, con las excepciones Cr y Cu). */
(function () {
  var SYM = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
  var ORD = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2], ['3d', 10], ['4p', 6]];
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sp(n) { return String(n).replace(/\d/g, function (c) { return SUP[+c]; }); }
  function conf(Z) {
    var left = Z, out = [];
    ORD.forEach(function (o) { if (left > 0) { var k = Math.min(o[1], left); out.push([o[0], k]); left -= k; } });
    if (Z === 24 || Z === 29) out.forEach(function (o) { if (o[0] === '4s') o[1] = 1; if (o[0] === '3d') o[1] += 1; });
    return out;
  }
  function txt(c) { return c.map(function (o) { return o[0] + sp(o[1]); }).join(' '); }
  function unpaired(c) { return c.reduce(function (s, o) { var cap = { s: 1, p: 3, d: 5 }[o[0][1]], k = o[1]; return s + (k <= cap ? k : 2 * cap - k); }, 0); }
  function aufbauNaive(Z) { var left = Z, out = []; ORD.forEach(function (o) { if (left > 0) { var k = Math.min(o[1], left); out.push([o[0], k]); left -= k; } }); return out; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Configuración de un elemento', 'Configuration of an element'], gen: function (H) {
        var Z = H.int(3, 36), c = conf(Z), right = txt(c), wrong = [];
        wrong.push(txt(conf(Z - 1)) , txt(conf(Z + 1 > 36 ? Z - 2 : Z + 1)));
        if (Z === 24 || Z === 29) wrong.push(txt(aufbauNaive(Z)));
        var sw = c.map(function (o) { return o.slice(); }), last = sw[sw.length - 1];
        if (last[0] === '3d' && sw.length > 1) { var s4 = sw.filter(function (o) { return o[0] === '4s'; })[0]; if (s4 && s4[1] === 2 && last[1] <= 8) { s4[1] = 0; last[1] += 2; wrong.push(txt(sw.filter(function (o) { return o[1] > 0; }))); } }
        return H.mc(H.t('¿Cuál es la configuración electrónica del ' + SYM[Z] + ' (Z = ' + Z + ') en estado fundamental?', 'What is the ground-state electron configuration of ' + SYM[Z] + ' (Z = ' + Z + ')?'), right, wrong,
          H.t('Se llenan los subniveles en orden de energía creciente (1s 2s 2p 3s 3p 4s 3d 4p) hasta sumar ' + Z + ' electrones.', 'Subshells fill in order of increasing energy (1s 2s 2p 3s 3p 4s 3d 4p) until ' + Z + ' electrons are placed.') + (Z === 24 || Z === 29 ? H.t(' El ' + SYM[Z] + ' es una excepción: un electrón pasa de 4s a 3d para lograr una subcapa d semillena o llena, más estable.', ' ' + SYM[Z] + ' is an exception: one electron moves from 4s to 3d to give a half-filled or filled d subshell, which is more stable.') : ''));
      } },
      { name: ['Electrones desapareados', 'Unpaired electrons'], gen: function (H) {
        var Z = H.int(1, 36), c = conf(Z), u = unpaired(c);
        return { q: H.t('¿Cuántos electrones desapareados tiene un átomo de ' + SYM[Z] + ' (Z = ' + Z + ') en estado fundamental?', 'How many unpaired electrons does a ground-state ' + SYM[Z] + ' atom (Z = ' + Z + ') have?'), a: u, abs: 0, aText: String(u),
          sol: txt(c) + H.t('. Por la regla de Hund, los electrones ocupan primero orbitales vacíos del mismo subnivel con espines paralelos: ', '. By Hund’s rule, electrons first occupy empty orbitals of the same subshell with parallel spins: ') + u + H.t(' desapareado(s).', ' unpaired.') };
      } },
      { name: ['Electrones de valencia (grupos principales)', 'Valence electrons (main groups)'], gen: function (H) {
        var Z = H.pick([1, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20, 31, 32, 33, 34, 35]), c = conf(Z), n = Math.max.apply(null, c.map(function (o) { return +o[0][0]; })), v = c.filter(function (o) { return +o[0][0] === n && o[0][1] !== 'd'; }).reduce(function (s, o) { return s + o[1]; }, 0);
        return { q: H.t('¿Cuántos electrones de valencia tiene el ' + SYM[Z] + ' (Z = ' + Z + ')?', 'How many valence electrons does ' + SYM[Z] + ' (Z = ' + Z + ') have?'), a: v, abs: 0, aText: String(v),
          sol: txt(c) + H.t('. Los electrones de valencia son los de la capa más externa (n = ' + n + '): ' + v + '.', '. Valence electrons are those in the outermost shell (n = ' + n + '): ' + v + '.') };
      } }
    ]
  });
})();
