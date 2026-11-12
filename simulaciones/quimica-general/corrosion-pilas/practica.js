/* Práctica · Corrosión y protección del hierro (ES/EN en un archivo, ver kit/aula.js). */
(function () {
  var E = [['Mg', -2.37], ['Zn', -0.76], ['Fe', -0.44], ['Sn', -0.14], ['Cu', 0.34]];
  SimAula.register({ problems: [
    { name: ['¿Qué metal protege al hierro?', 'Which metal protects iron?'], gen: function (H) {
      var m = H.pick(E.filter(function (x) { return x[0] !== 'Fe'; })), prot = m[1] < -0.44;
      return { q: H.t('Si el recubrimiento de ' + m[0] + ' (E° = ' + H.fmt(m[1], 2) + ' V) se raya y queda el Fe (E° = −0,44 V) expuesto, ¿qué metal se oxida?', 'If a ' + m[0] + ' coating (E° = ' + H.fmt(m[1], 2) + ' V) is scratched and Fe (E° = −0.44 V) is exposed, which metal oxidizes?'), options: [m[0], 'Fe'], answer: prot ? 0 : 1,
        sol: H.t('Se oxida el de E° más negativo (ánodo). ', 'The one with the more negative E° (anode) oxidizes. ') + (prot ? H.t('El ' + m[0] + ' actúa como ánodo de sacrificio.', m[0] + ' acts as a sacrificial anode.') : H.t('El ' + m[0] + ' acelera la corrosión del hierro.', m[0] + ' speeds up the corrosion of iron.')) };
    } },
    { name: ['Fuerza de la pila de corrosión', 'Driving force of the corrosion cell'], gen: function (H) {
      var a = H.pick(E), b = H.pick(E); if (a === b) return null; var c = a[1] > b[1] ? a : b, n = a[1] > b[1] ? b : a, e = c[1] - n[1];
      return { q: H.t('¿Cuánto vale E° de una pila formada por ' + a[0] + ' y ' + b[0] + ' en contacto?', 'What is E° of a cell formed by ' + a[0] + ' and ' + b[0] + ' in contact?'), a: e, unit: 'V', abs: 0.005, aText: H.fmt(e, 2),
        sol: 'E° = E°(' + c[0] + ') − E°(' + n[0] + ') = ' + H.fmt(c[1], 2) + ' − (' + H.fmt(n[1], 2) + ') = ' + H.fmt(e, 2) + ' V' };
    } },
    { name: ['Masa de ánodo consumida', 'Anode mass consumed'], gen: function (H) {
      var I = H.rnd(0.01, 0.5, 3), d = H.int(10, 365), m = I * d * 86400 / (2 * 96485) * 24.31;
      return { q: H.t('Un ánodo de Mg protege una tubería con una corriente de ' + H.fmt(I, 3) + ' A. ¿Qué masa de Mg se consume en ' + d + ' días? (Mg → Mg²⁺ + 2e⁻; 24,31 g/mol)', 'A Mg anode protects a pipe with a current of ' + H.fmt(I, 3) + ' A. What mass of Mg is consumed in ' + d + ' days? (Mg → Mg²⁺ + 2e⁻; 24.31 g/mol)'), a: m, unit: 'g',
        sol: 'Q = I·t = ' + H.sig(I * d * 86400, 3) + ' C; n(Mg) = Q/2F = ' + H.sig(I * d * 86400 / 192970, 3) + ' mol; m = ' + H.sig(m, 3) + ' g' };
    } }
  ] });
})();
/* Predicción de la lección guiada */
SimAula.register({ predict: { 2: { q: ["Si se raya un recubrimiento de zinc y queda el hierro expuesto…", "If a zinc coating is scratched and iron is exposed…"], options: [["el zinc se sigue corroyendo y protege al hierro", "zinc keeps corroding and protects the iron"], ["el hierro se corroe más rápido", "iron corrodes faster"], ["no pasa nada", "nothing happens"]], answer: 0, why: ["El Zn tiene E° más negativo que el Fe: actúa como ánodo de sacrificio. El estaño, en cambio, acelera la corrosión al rayarse.", "Zn has a more negative E° than Fe: it is a sacrificial anode. Tin, by contrast, speeds corrosion once scratched."] } } });
