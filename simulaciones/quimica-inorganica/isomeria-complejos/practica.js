/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['¿Cuál de los isómeros de [Co(NH₃)₄Cl₂]⁺ es polar?', 'Which isomer of [Co(NH₃)₄Cl₂]⁺ is polar?'], options: [['trans', 'trans'], ['cis', 'cis'], ['los dos', 'both']], answer: 1, why: ['En cis los dipolos Co–Cl forman 90° y no se cancelan; en trans son opuestos y se anulan.', 'In cis the Co–Cl dipoles are at 90° and do not cancel; in trans they are opposite and cancel out.'] },
  4: { q: ['¿Existe algún giro que haga coincidir el isómero cis con el trans?', 'Is there any rotation that makes the cis isomer match the trans one?'], options: [['Sí, uno de los 24 giros del octaedro', 'Yes, one of the 24 rotations of the octahedron'], ['No: son compuestos distintos', 'No: they are different compounds']], answer: 1, why: ['Ningún giro cambia el ángulo Cl–Co–Cl (90° frente a 180°): son isómeros, no el mismo compuesto girado.', 'No rotation changes the Cl–Co–Cl angle (90° versus 180°): they are isomers, not the same compound turned around.'] },
  7: { q: ['Un complejo tetraédrico MA₂B₂, ¿tiene isómeros cis y trans?', 'Does a tetrahedral MA₂B₂ complex have cis and trans isomers?'], options: [['Sí', 'Yes'], ['No', 'No']], answer: 1, why: ['En el tetraedro todos los pares de vértices son equivalentes (≈ 109,5°): solo hay una estructura.', 'In a tetrahedron every pair of vertices is equivalent (≈ 109.5°): there is only one structure.'] }
} });

/* Desafío · Isomería en complejos. Un solo archivo para ES y EN (ver kit/aula.js). */
SimAula.register({
  quiz: [
    { q: ['¿Cuántos isómeros geométricos tiene el complejo octaédrico [Co(NH₃)₄Cl₂]⁺?', 'How many geometric isomers does the octahedral complex [Co(NH₃)₄Cl₂]⁺ have?'], options: [['2 (cis y trans)', '2 (cis and trans)'], ['1', '1'], ['3', '3'], ['4', '4']], answer: 0, why: ['Los dos Cl pueden estar adyacentes (90°, cis) u opuestos (180°, trans).', 'The two Cl can be adjacent (90°, cis) or opposite (180°, trans).'] },
    { q: ['¿Qué isómeros presenta [Co(NH₃)₃Cl₃]?', 'Which isomers does [Co(NH₃)₃Cl₃] show?'], options: [['fac y mer', 'fac and mer'], ['cis y trans', 'cis and trans'], ['Δ y Λ', 'Δ and Λ'], ['Ninguno', 'None']], answer: 0, why: ['Los tres Cl ocupan una cara del octaedro (fac) o un meridiano (mer).', 'The three Cl occupy one face of the octahedron (fac) or a meridian (mer).'] },
    { q: ['El cisplatino, un fármaco antitumoral, es el isómero… de [Pt(NH₃)₂Cl₂] (plano cuadrado).', 'Cisplatin, an anticancer drug, is the … isomer of square-planar [Pt(NH₃)₂Cl₂].'], options: [['cis', 'cis'], ['trans', 'trans'], ['fac', 'fac'], ['mer', 'mer']], answer: 0, why: ['Solo el isómero cis se une al ADN formando puentes entre bases vecinas; el trans es mucho menos activo.', 'Only the cis isomer binds DNA by bridging neighboring bases; trans is much less active.'] },
    { q: ['¿Cuántos isómeros geométricos tiene un complejo tetraédrico MA₂B₂?', 'How many geometric isomers does a tetrahedral MA₂B₂ complex have?'], options: [['Ninguno: solo hay una forma', 'None: there is only one form'], ['2', '2'], ['3', '3'], ['4', '4']], answer: 0, why: ['En el tetraedro todas las posiciones son adyacentes entre sí: no existe cis/trans.', 'In a tetrahedron all positions are adjacent to each other: cis/trans does not exist.'] },
    { q: ['Werner propuso la geometría octaédrica porque MA₄B₂ tiene solo 2 isómeros. ¿Cuántos tendría si fuera un hexágono plano?', 'Werner proposed octahedral geometry because MA₄B₂ has only 2 isomers. How many would it have if it were a planar hexagon?'], options: ['3', '2', '1', '6'], answer: 0, why: ['En el hexágono los dos B podrían estar en posiciones 1,2 – 1,3 – 1,4: tres isómeros. El prisma trigonal también da tres.', 'In a hexagon the two B could be at positions 1,2 – 1,3 – 1,4: three isomers. A trigonal prism also gives three.'] },
    { q: ['¿Cuál de estos complejos es quiral?', 'Which of these complexes is chiral?'], options: [['cis-[Co(en)₂Cl₂]⁺', 'cis-[Co(en)₂Cl₂]⁺'], ['trans-[Co(en)₂Cl₂]⁺', 'trans-[Co(en)₂Cl₂]⁺'], ['[Co(NH₃)₆]³⁺', '[Co(NH₃)₆]³⁺'], ['trans-[Co(NH₃)₄Cl₂]⁺', 'trans-[Co(NH₃)₄Cl₂]⁺']], answer: 0, why: ['El isómero cis con dos quelatos no tiene plano de simetría: existe como par Δ/Λ. El trans tiene un plano de simetría.', 'The cis isomer with two chelates has no mirror plane: it exists as a Δ/Λ pair. The trans isomer has a mirror plane.'] },
    { q: ['El NO₂⁻ puede unirse al metal por el N (nitro) o por un O (nitrito). ¿Qué tipo de isomería es?', 'NO₂⁻ can bind the metal through N (nitro) or through O (nitrito). What kind of isomerism is this?'], options: [['De enlace', 'Linkage'], ['Geométrica', 'Geometric'], ['Óptica', 'Optical'], ['De ionización', 'Ionization']], answer: 0, why: ['Ligandos ambidentados como NO₂⁻ o SCN⁻ dan isómeros de enlace, con propiedades (y colores) distintos.', 'Ambidentate ligands such as NO₂⁻ or SCN⁻ give linkage isomers, with different properties (and colors).'] },
    { q: ['En el isómero trans de MA₄B₂, el ángulo B–M–B es…', 'In the trans isomer of MA₄B₂, the B–M–B angle is…'], options: ['180°', '90°', ['109,5°', '109.5°'], '120°'], answer: 0, why: ['Trans significa posiciones opuestas a través del metal.', 'Trans means positions opposite each other across the metal.'] }
  ]
});

/* Práctica: contar isómeros geométricos e identificar el tipo de isomería. */
(function () {
  /* tipo, geometría, n.º de isómeros geométricos, explicación */
  var G = [['MA₄B₂', ['octaédrico', 'octahedral'], 2, ['cis (B a 90°) y trans (B a 180°).', 'cis (B at 90°) and trans (B at 180°).']],
    ['MA₃B₃', ['octaédrico', 'octahedral'], 2, ['fac (los tres B en una cara) y mer (los tres B en un meridiano).', 'fac (the three B on one face) and mer (the three B on a meridian).']],
    ['MA₅B', ['octaédrico', 'octahedral'], 1, ['Las seis posiciones son equivalentes: da igual dónde va B.', 'All six positions are equivalent: it does not matter where B goes.']],
    ['MA₆', ['octaédrico', 'octahedral'], 1, ['Todos los ligandos son iguales.', 'All ligands are identical.']],
    ['MA₂B₂', ['plano cuadrado', 'square planar'], 2, ['cis y trans, como en el cisplatino y el transplatino.', 'cis and trans, as in cisplatin and transplatin.']],
    ['MA₂B₂', ['tetraédrico', 'tetrahedral'], 1, ['En el tetraedro todas las posiciones son adyacentes: no hay cis/trans.', 'In a tetrahedron every position is adjacent to every other: no cis/trans.']],
    ['MA₃B', ['plano cuadrado', 'square planar'], 1, ['Un solo B: todas sus posiciones son equivalentes.', 'A single B: all its positions are equivalent.']],
    ['MA₂B₂C₂', ['octaédrico', 'octahedral'], 5, ['Cinco isómeros geométricos (uno de ellos, todo-cis, además es quiral).', 'Five geometric isomers (one of them, all-cis, is also chiral).']]];
  var T = { geo: ['Geométrica (cis/trans, fac/mer)', 'Geometric (cis/trans, fac/mer)'], ion: ['De ionización', 'Ionization'], hid: ['De hidratación', 'Hydration'], enl: ['De enlace', 'Linkage'], coo: ['De coordinación', 'Coordination'] };
  var P = [['[Co(NH₃)₅Br]SO₄ y [Co(NH₃)₅SO₄]Br', 'ion', ['Se intercambia un ligando con el contraión: en disolución liberan iones distintos.', 'A ligand swaps places with the counter-ion: they release different ions in solution.']],
    ['[Cr(H₂O)₆]Cl₃ y [Cr(H₂O)₅Cl]Cl₂·H₂O', 'hid', ['El agua pasa de ligando a agua de cristalización.', 'Water moves from ligand to water of crystallization.']],
    ['[Co(NH₃)₅(NO₂)]²⁺ y [Co(NH₃)₅(ONO)]²⁺', 'enl', ['El nitrito se une por N (nitro) o por O (nitrito): ligando ambidentado.', 'Nitrite binds through N (nitro) or O (nitrito): an ambidentate ligand.']],
    ['[Co(NH₃)₆][Cr(CN)₆] y [Cr(NH₃)₆][Co(CN)₆]', 'coo', ['Los ligandos se reparten de otra forma entre los dos centros metálicos.', 'The ligands are distributed differently between the two metal centers.']],
    ['cis- y trans-[Pt(NH₃)₂Cl₂]', 'geo', ['Mismos enlaces, distinta disposición espacial.', 'Same bonds, different spatial arrangement.']],
    ['fac- y mer-[Co(NH₃)₃Cl₃]', 'geo', ['Mismos enlaces, distinta disposición espacial.', 'Same bonds, different spatial arrangement.']],
    ['[Fe(SCN)(H₂O)₅]²⁺ y [Fe(NCS)(H₂O)₅]²⁺', 'enl', ['El tiocianato se une por S o por N.', 'Thiocyanate binds through S or N.']]];
  function en(s, H) { return H.EN ? s.replace(' y ', ' and ').replace('cis- y trans-', 'cis- and trans-').replace('fac- y mer-', 'fac- and mer-') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Contar isómeros geométricos', 'Count geometric isomers'], gen: function (H) {
        var g = H.pick(G);
        return { q: H.t('¿Cuántos isómeros geométricos tiene un complejo ' + g[1][0] + ' del tipo <b>' + g[0] + '</b>?', 'How many geometric isomers does a ' + g[1][1] + ' complex of type <b>' + g[0] + '</b> have?'), a: g[2], abs: 0, aText: String(g[2]), sol: H.L(g[3]) };
      } },
      { name: ['Tipo de isomería', 'Type of isomerism'], gen: function (H) {
        return H.bank(P, function (p) { return H.t('¿Qué tipo de isomería relaciona a <b>' + p[0] + '</b>?', 'What type of isomerism relates <b>' + en(p[0], H) + '</b>?'); }, function (p) { return T[p[1]]; }, function (p) { return H.L(p[2]); }, [T.geo, T.ion, T.hid, T.enl, T.coo]);
      } },
      { name: ['El argumento de Werner', 'Werner’s argument'], gen: function (H) {
        var opt = [['Octaédrica', 'Octahedral'], ['Hexagonal plana', 'Planar hexagonal'], ['Prisma trigonal', 'Trigonal prism']], k = H.pick([2, 3]);
        return H.mc(H.t('Werner solo encontró <b>dos</b> isómeros de [Co(NH₃)₄Cl₂]⁺. Una geometría hexagonal plana o un prisma trigonal predicen <b>tres</b>. ¿Qué geometría apoya su resultado?', 'Werner found only <b>two</b> isomers of [Co(NH₃)₄Cl₂]⁺. A planar hexagon or a trigonal prism predicts <b>three</b>. Which geometry does his result support?'), opt[0], opt.slice(1),
          H.t('El octaedro es la única de las tres geometrías con solo dos isómeros MA₄B₂ (cis y trans).', 'The octahedron is the only one of the three geometries with just two MA₄B₂ isomers (cis and trans).'));
      } }
    ]
  });
})();
