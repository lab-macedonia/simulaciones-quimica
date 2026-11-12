/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  3: { q: ['¿Alguna de las 24 rotaciones del octaedro hace coincidir Δ con Λ?', 'Does any of the 24 rotations of the octahedron make Δ match Λ?'], options: [['Sí', 'Yes'], ['No', 'No']], answer: 1, why: ['Pueden coincidir los seis N, pero no las conexiones de los quelatos: Δ y Λ son enantiómeros no superponibles.', 'The six N atoms can match, but the chelate connections cannot: Δ and Λ are non-superimposable enantiomers.'] },
  5: { q: ['El [Co(NH₃)₆]³⁺, con las mismas seis posiciones pero ligandos independientes, es…', '[Co(NH₃)₆]³⁺, with the same six positions but independent ligands, is…'], options: [['quiral', 'chiral'], ['aquiral', 'achiral']], answer: 1, why: ['Sin puentes entre los N tiene simetría Oh, con planos de espejo: la quiralidad viene de las conexiones de los quelatos.', 'Without bridges between the N atoms it has Oh symmetry, with mirror planes: chirality comes from the chelate connections.'] }
} });

/* Práctica · Quiralidad en complejos (Δ/Λ). Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var Y = ['Quiral (existe como par Δ/Λ)', 'Chiral (exists as a Δ/Λ pair)'], N = ['Aquiral (tiene un plano de simetría o un centro de inversión)', 'Achiral (has a mirror plane or an inversion center)'];
  /* complejo, quiral?, explicación */
  var K = [['[Co(en)₃]³⁺', 1, ['Tres quelatos en hélice: no hay plano espejo; sus dos formas son Δ y Λ.', 'Three chelates arranged as a helix: no mirror plane; its two forms are Δ and Λ.']],
    ['[Cr(ox)₃]³⁻', 1, ['Tris-quelato octaédrico, igual que [Co(en)₃]³⁺: hélice Δ o Λ.', 'Octahedral tris-chelate, like [Co(en)₃]³⁺: Δ or Λ helix.']],
    ['[Ru(bpy)₃]²⁺', 1, ['Tris-quelato octaédrico: Δ o Λ.', 'Octahedral tris-chelate: Δ or Λ.']],
    ['cis-[Co(en)₂Cl₂]⁺', 1, ['Los dos quelatos forman una hélice parcial; los Cl en cis no generan plano espejo.', 'The two chelates form a partial helix; cis Cl ligands leave no mirror plane.']],
    ['trans-[Co(en)₂Cl₂]⁺', 0, ['Los Cl opuestos y los quelatos en el plano ecuatorial dejan un plano de simetría.', 'Opposite Cl ligands and the chelates in the equatorial plane leave a mirror plane.']],
    ['[Co(NH₃)₆]³⁺', 0, ['Seis ligandos iguales: grupo Oh, con muchos planos de simetría.', 'Six identical ligands: point group Oh, with many mirror planes.']],
    ['cis-[Co(NH₃)₄Cl₂]⁺', 0, ['Solo ligandos monodentados: el plano que contiene ambos Cl es un plano de simetría.', 'Only monodentate ligands: the plane containing both Cl is a mirror plane.']],
    ['fac-[Co(NH₃)₃Cl₃]', 0, ['Tiene planos de simetría (grupo C3v).', 'It has mirror planes (point group C3v).']],
    ['[Pt(NH₃)₂Cl₂] (plano cuadrado)', 0, ['Un complejo plano cuadrado tiene su propio plano molecular como plano de simetría.', 'A square-planar complex has its molecular plane as a mirror plane.']],
    ['[Co(en)(NH₃)₂Cl₂]⁺ con los Cl en trans', 0, ['Los Cl en trans quedan sobre un plano espejo que pasa por el quelato.', 'With trans Cl ligands there is a mirror plane through the chelate.']]];
  function tr(s, H) { return H.EN ? s.replace('(plano cuadrado)', '(square planar)').replace(' con los Cl en trans', ' with trans Cl') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['¿Quiral o aquiral?', 'Chiral or achiral?'], gen: function (H) {
        var k = H.pick(K);
        return H.mc(H.t('¿El complejo <b>' + k[0] + '</b> es quiral?', 'Is the complex <b>' + tr(k[0], H) + '</b> chiral?'), k[1] ? Y : N, [Y, N], k[2]);
      } },
      { name: ['Número de estereoisómeros', 'Number of stereoisomers'], gen: function (H) {
        var Q = [['[M(AA)₃]', 2, ['Δ y Λ (un par de enantiómeros).', 'Δ and Λ (one pair of enantiomers).']], ['[M(AA)₂B₂]', 3, ['trans (aquiral) + cis-Δ + cis-Λ.', 'trans (achiral) + cis-Δ + cis-Λ.']], ['[MA₄B₂]', 2, ['cis y trans, ambos aquirales.', 'cis and trans, both achiral.']], ['[MA₆]', 1, ['Un solo isómero.', 'A single isomer.']], ['[MA₃B₃]', 2, ['fac y mer, ambos aquirales.', 'fac and mer, both achiral.']]];
        var q = H.pick(Q);
        return { q: H.t('¿Cuántos estereoisómeros (contando enantiómeros) tiene un complejo octaédrico <b>' + q[0] + '</b>? (AA = quelato simétrico)', 'How many stereoisomers (counting enantiomers) does an octahedral <b>' + q[0] + '</b> complex have? (AA = symmetric chelate)'), a: q[1], abs: 0, aText: String(q[1]), sol: H.L(q[2]) };
      } }
    ]
  });
})();
