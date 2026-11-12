/* Práctica · Sólidos cristalinos y celdas unitarias (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var M = [['Po', 'sc', 208.98, 335], ['Fe', 'bcc', 55.85, 287], ['Na', 'bcc', 22.99, 429], ['W', 'bcc', 183.84, 316], ['Cu', 'fcc', 63.55, 361], ['Al', 'fcc', 26.98, 405], ['Au', 'fcc', 196.97, 408], ['Ag', 'fcc', 107.87, 409]];
  var Z = { sc: 1, bcc: 2, fcc: 4 }, NM = { sc: ['cúbica simple', 'simple cubic'], bcc: ['cúbica centrada en el cuerpo', 'body-centered cubic'], fcc: ['cúbica centrada en las caras', 'face-centered cubic'] };
  SimAula.register({ problems: [
    { name: ['Densidad desde la celda', 'Density from the unit cell'], gen: function (H) {
      var m = H.pick(M), a = m[3] * 1e-10, d = Z[m[1]] * m[2] / (6.022e23 * Math.pow(a, 3));
      return { q: H.t('El ' + m[0] + ' cristaliza en red ' + NM[m[1]][0] + ' con a = ' + m[3] + ' pm (M = ' + H.fmt(m[2], 2) + ' g/mol). ¿Cuál es su densidad?', m[0] + ' crystallizes in a ' + NM[m[1]][1] + ' lattice with a = ' + m[3] + ' pm (M = ' + H.fmt(m[2], 2) + ' g/mol). What is its density?'), a: d, unit: 'g/cm³', tol: 0.02,
        sol: 'Z = ' + Z[m[1]] + '; ρ = Z·M/(N<sub>A</sub>·a³) = ' + Z[m[1]] + ' × ' + H.fmt(m[2], 2) + ' / (' + H.sig(6.022e23, 4) + ' × (' + H.sig(a, 3) + ' cm)³) = ' + H.sig(d, 3) + ' g/cm³', hint: H.t('1 pm = 10⁻¹⁰ cm.', '1 pm = 10⁻¹⁰ cm.') };
    } },
    { name: ['Átomos por celda y coordinación', 'Atoms per cell and coordination'], gen: function (H) {
      var k = H.pick(['sc', 'bcc', 'fcc']), w = H.int(0, 1);
      if (w === 0) return { q: H.t('¿Cuántos átomos contiene una celda ' + NM[k][0] + '?', 'How many atoms does a ' + NM[k][1] + ' cell contain?'), a: Z[k], abs: 0, aText: String(Z[k]), sol: H.t('Vértices 8 × 1/8, centro 1, caras 6 × 1/2.', 'Corners 8 × 1/8, body center 1, faces 6 × 1/2.') };
      var cn = { sc: 6, bcc: 8, fcc: 12 }[k];
      return { q: H.t('¿Cuál es el número de coordinación en la red ' + NM[k][0] + '?', 'What is the coordination number in the ' + NM[k][1] + ' lattice?'), a: cn, abs: 0, aText: String(cn), sol: 'sc 6 · bcc 8 · fcc 12' };
    } },
    { name: ['Radio atómico desde la arista', 'Atomic radius from the edge'], gen: function (H) {
      var m = H.pick(M), r = m[1] === 'sc' ? m[3] / 2 : m[1] === 'bcc' ? Math.sqrt(3) * m[3] / 4 : Math.sqrt(2) * m[3] / 4;
      return { q: H.t('Con a = ' + m[3] + ' pm en red ' + NM[m[1]][0] + ', ¿cuál es el radio atómico?', 'With a = ' + m[3] + ' pm in a ' + NM[m[1]][1] + ' lattice, what is the atomic radius?'), a: r, unit: 'pm',
        sol: H.t('Contacto: sc a = 2r; bcc diagonal del cubo √3·a = 4r; fcc diagonal de cara √2·a = 4r → r = ', 'Contact: sc a = 2r; bcc body diagonal √3·a = 4r; fcc face diagonal √2·a = 4r → r = ') + H.sig(r, 3) + ' pm' };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["¿Qué celda aprovecha mejor el espacio?", "Which cell uses space most efficiently?"], options: [["Cúbica centrada en las caras (74 %)", "Face-centered cubic (74 %)"], ["Cúbica centrada en el cuerpo", "Body-centered cubic"], ["Cúbica simple", "Simple cubic"]], answer: 0, why: ["fcc 74 % \u003e bcc 68 % \u003e sc 52 %.", "fcc 74 % \u003e bcc 68 % \u003e sc 52 %."] } } });
