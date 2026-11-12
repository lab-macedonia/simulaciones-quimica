/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["¿Puede ser quiral una molécula que tiene un plano de simetría?", "Can a molecule with a mirror plane be chiral?"], options: [["No", "No"], ["Sí", "Yes"], ["Solo si es lineal", "Only if linear"]], answer: 0, why: ["Un plano σ es un eje impropio S₁: la molécula coincide con su imagen especular.", "A σ plane is an improper axis S₁: the molecule matches its mirror image."] } } });

/* Práctica: grupo puntual, centro de inversión y eje principal. */
(function () {
  /* molécula, grupo, ¿i?, eje principal (n; 0 = ninguno, Infinity = ∞), pista */
  var M = [['H₂O', 'C₂ᵥ', 0, 2, ['Un C₂ y dos planos σᵥ.', 'One C₂ and two σᵥ planes.']], ['NH₃', 'C₃ᵥ', 0, 3, ['Un C₃ y tres planos σᵥ.', 'One C₃ and three σᵥ planes.']], ['CH₄', 'T<sub>d</sub>', 0, 3, ['Cuatro C₃, tres C₂ (y S₄), seis σ<sub>d</sub>.', 'Four C₃, three C₂ (and S₄), six σ<sub>d</sub>.']],
    ['BF₃', 'D₃ₕ', 0, 3, ['C₃ con tres C₂ perpendiculares y un σₕ (el plano molecular).', 'C₃ with three perpendicular C₂ and a σₕ (the molecular plane).']], ['SF₆', 'Oₕ', 1, 4, ['Tres C₄, cuatro C₃ y centro de inversión.', 'Three C₄, four C₃ and an inversion center.']],
    ['CO₂', 'D∞ₕ', 1, Infinity, ['Lineal y simétrica: C∞, σₕ e i.', 'Linear and symmetric: C∞, σₕ and i.']], ['HCl', 'C∞ᵥ', 0, Infinity, ['Lineal sin centro de inversión: C∞ e infinitos σᵥ.', 'Linear without an inversion center: C∞ and infinitely many σᵥ.']],
    ['trans-CHCl=CHCl', 'C₂ₕ', 1, 2, ['C₂ perpendicular al plano, σₕ (plano molecular) e i.', 'C₂ perpendicular to the plane, σₕ (molecular plane) and i.']], ['cis-CHCl=CHCl', 'C₂ᵥ', 0, 2, ['Un C₂ en el plano y dos σᵥ.', 'One in-plane C₂ and two σᵥ.']],
    ['C₆H₆ (benceno)', 'D₆ₕ', 1, 6, ['C₆, seis C₂ perpendiculares, σₕ e i.', 'C₆, six perpendicular C₂, σₕ and i.']], ['CHFClBr', 'C₁', 0, 0, ['Solo la identidad E: es quiral.', 'Only the identity E: it is chiral.']],
    ['XeF₄', 'D₄ₕ', 1, 4, ['Plano cuadrado: C₄, cuatro C₂ perpendiculares, σₕ e i.', 'Square planar: C₄, four perpendicular C₂, σₕ and i.']], ['PCl₅', 'D₃ₕ', 0, 3, ['Bipirámide trigonal: C₃, tres C₂ y σₕ.', 'Trigonal bipyramid: C₃, three C₂ and σₕ.']],
    ['CH₂Cl₂', 'C₂ᵥ', 0, 2, ['Un C₂ y dos σᵥ.', 'One C₂ and two σᵥ.']], ['CHCl₃', 'C₃ᵥ', 0, 3, ['Un C₃ y tres σᵥ.', 'One C₃ and three σᵥ.']]];
  function nm(s, H) { return H.EN ? s.replace('(benceno)', '(benzene)') : s; }
  var GR = ['C₁', 'C₂ᵥ', 'C₃ᵥ', 'C₂ₕ', 'D₃ₕ', 'D₄ₕ', 'D₆ₕ', 'T<sub>d</sub>', 'Oₕ', 'C∞ᵥ', 'D∞ₕ'];
  var Y = ['Sí', 'Yes'], N = ['No', 'No'];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Grupo puntual', 'Point group'], gen: function (H) {
        var m = H.pick(M);
        return H.mc(H.t('¿A qué grupo puntual pertenece <b>' + m[0] + '</b>?', 'Which point group does <b>' + nm(m[0], H) + '</b> belong to?'), m[1], GR, H.L(m[4]));
      } },
      { name: ['Centro de inversión', 'Inversion center'], gen: function (H) {
        var m = H.pick(M);
        return H.mc(H.t('¿<b>' + m[0] + '</b> tiene centro de inversión (i)?', 'Does <b>' + nm(m[0], H) + '</b> have an inversion center (i)?'), m[2] ? Y : N, [Y, N],
          H.t('Grupo ', 'Group ') + m[1] + '. ' + H.L(m[4]) + ' ' + H.t('Con i, cada átomo tiene un átomo idéntico en la posición opuesta respecto del centro.', 'With i, every atom has an identical atom at the opposite position through the center.'));
      } },
      { name: ['Orden del eje principal', 'Order of the principal axis'], gen: function (H) {
        var m; do { m = H.pick(M); } while (!isFinite(m[3]) || m[3] === 0);
        return { q: H.t('¿Cuál es el orden n del eje principal C<sub>n</sub> de <b>' + m[0] + '</b>?', 'What is the order n of the principal axis C<sub>n</sub> of <b>' + nm(m[0], H) + '</b>?'), a: m[3], abs: 0, aText: 'C' + m[3],
          sol: H.t('Grupo ', 'Group ') + m[1] + '. ' + H.L(m[4]) };
      } }
    ]
  });
})();
