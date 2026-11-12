/* Práctica y predicciones · Pilas galvánicas y ecuación de Nernst. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* Pares M²⁺/M con E° de reducción (V, 25 °C): todos intercambian 2 electrones */
  var E = [['Mg', -2.37], ['Zn', -0.76], ['Fe', -0.44], ['Ni', -0.25], ['Sn', -0.14], ['Pb', -0.13], ['Cu', 0.34]];
  function pair(H) { var a = H.pick(E), b = H.pick(E); if (a === b) return null; return a[1] > b[1] ? { cat: a, an: b, E0: a[1] - b[1] } : { cat: b, an: a, E0: b[1] - a[1] }; }
  function cell(p) { return p.an[0] + '(s) | ' + p.an[0] + '²⁺ || ' + p.cat[0] + '²⁺ | ' + p.cat[0] + '(s)'; }
  SimAula.register({
    problems: [
      { name: ['Potencial estándar de la pila', 'Standard cell potential'], gen: function (H) {
        var t = H.t, f = H.fmt, p = pair(H); if (!p) return null;
        return { q: t('Una pila se construye con los pares ' + p.cat[0] + '²⁺/' + p.cat[0] + ' (E° = ' + f(p.cat[1], 2) + ' V) y ' + p.an[0] + '²⁺/' + p.an[0] + ' (E° = ' + f(p.an[1], 2) + ' V). ¿Cuánto vale E°<sub>celda</sub>?', 'A cell is built from the couples ' + p.cat[0] + '²⁺/' + p.cat[0] + ' (E° = ' + f(p.cat[1], 2) + ' V) and ' + p.an[0] + '²⁺/' + p.an[0] + ' (E° = ' + f(p.an[1], 2) + ' V). What is E°<sub>cell</sub>?'), a: p.E0, unit: 'V', abs: 0.005,
          sol: t('El cátodo es el de mayor E° (' + p.cat[0] + '). E°<sub>celda</sub> = E°<sub>cátodo</sub> − E°<sub>ánodo</sub> = ' + f(p.cat[1], 2) + ' − (' + f(p.an[1], 2) + ') = ' + f(p.E0, 2) + ' V. Notación: ' + cell(p), 'The cathode has the higher E° (' + p.cat[0] + '). E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub> = ' + f(p.cat[1], 2) + ' − (' + f(p.an[1], 2) + ') = ' + f(p.E0, 2) + ' V. Notation: ' + cell(p)), aText: f(p.E0, 2),
          hint: t('Resta E°(ánodo) a E°(cátodo), con su signo.', 'Subtract E°(anode) from E°(cathode), keeping the sign.') };
      } },
      { name: ['Energía libre: ΔG° = −nFE°', 'Free energy: ΔG° = −nFE°'], gen: function (H) {
        var t = H.t, f = H.fmt, p = pair(H); if (!p) return null; var G = -2 * 96485 * p.E0 / 1000;
        return { q: t('Para la pila ' + cell(p) + ' (E° = ' + f(p.E0, 2) + ' V, n = 2), calcula ΔG° en kJ.', 'For the cell ' + cell(p) + ' (E° = ' + f(p.E0, 2) + ' V, n = 2), calculate ΔG° in kJ.'), a: G, unit: 'kJ',
          sol: 'ΔG° = −nFE° = −2 × 96 485 × ' + f(p.E0, 2) + ' = ' + H.sig(G * 1000, 3) + ' J = ' + H.sig(G, 3) + ' kJ', hint: t('ΔG° es negativo si la pila es espontánea.', 'ΔG° is negative for a spontaneous cell.') };
      } },
      { name: ['Ecuación de Nernst', 'Nernst equation'], gen: function (H) {
        var t = H.t, f = H.fmt, p = pair(H); if (!p) return null; var ca = H.pick([0.001, 0.01, 0.1, 0.5, 1, 2]), an = H.pick([0.001, 0.01, 0.1, 0.5, 1, 2]); if (ca === an) return null;
        var Q = an / ca, Ec = p.E0 - 0.05916 / 2 * Math.log10(Q);
        return { q: t('Pila ' + cell(p) + ' a 25 °C con E° = ' + f(p.E0, 2) + ' V, [' + p.an[0] + '²⁺] = ' + f(an, 3) + ' M y [' + p.cat[0] + '²⁺] = ' + f(ca, 3) + ' M. ¿Cuál es su potencial?', 'Cell ' + cell(p) + ' at 25 °C with E° = ' + f(p.E0, 2) + ' V, [' + p.an[0] + '²⁺] = ' + f(an, 3) + ' M and [' + p.cat[0] + '²⁺] = ' + f(ca, 3) + ' M. What is its potential?'), a: Ec, unit: 'V', abs: 0.004,
          sol: 'Q = [' + p.an[0] + '²⁺] / [' + p.cat[0] + '²⁺] = ' + H.sig(Q, 3) + '; E = E° − (' + f(0.05916, 5) + '/n)·log Q = ' + f(p.E0, 2) + ' − ' + f(0.02958, 5) + ' × ' + f(Math.log10(Q), 3) + ' = ' + f(Ec, 3) + ' V', aText: f(Ec, 3) };
      } },
      { name: ['Constante de equilibrio desde E°', 'Equilibrium constant from E°'], gen: function (H) {
        var t = H.t, f = H.fmt, p = pair(H); if (!p || p.E0 > 1.2) return null; var lk = 2 * p.E0 / 0.05916;
        return { q: t('Para la pila ' + cell(p) + ' (E° = ' + f(p.E0, 2) + ' V, n = 2) a 25 °C, ¿cuánto vale log K?', 'For the cell ' + cell(p) + ' (E° = ' + f(p.E0, 2) + ' V, n = 2) at 25 °C, what is log K?'), a: lk, unit: '', abs: 0.15,
          sol: 'log K = nE° / ' + f(0.05916, 5) + ' = 2 × ' + f(p.E0, 2) + ' / ' + f(0.05916, 5) + ' = ' + f(lk, 1) + ' → K ≈ 10' + H.sup(Math.round(lk)), aText: f(lk, 1) };
      } }
    ],
    predict: {
      2: { q: ['Al cerrar el circuito de la pila Zn | Cu, ¿qué pasará con la masa de cada electrodo?', 'When the Zn | Cu cell circuit is closed, what will happen to the mass of each electrode?'],
        options: [['El Zn pierde masa y el Cu gana', 'Zn loses mass and Cu gains mass'], ['El Cu pierde masa y el Zn gana', 'Cu loses mass and Zn gains mass'], ['Ninguno cambia: solo circulan electrones', 'Neither changes: only electrons flow'], ['Ambos pierden masa', 'Both lose mass']], answer: 0,
        why: ['En el ánodo el Zn se oxida a Zn²⁺ y pasa a la disolución; en el cátodo el Cu²⁺ se reduce y se deposita como Cu metálico.', 'At the anode Zn is oxidized to Zn²⁺ and goes into solution; at the cathode Cu²⁺ is reduced and deposits as Cu metal.'] },
      3: { q: ['Si se aumenta la concentración de Cu²⁺ (el cátodo), el voltaje de la pila…', 'If the Cu²⁺ concentration (the cathode) is increased, the cell voltage…'],
        options: [['Aumenta', 'Increases'], ['Disminuye', 'Decreases'], ['No cambia: E° es fijo', 'Does not change: E° is fixed'], ['Se invierte', 'Reverses']], answer: 0,
        why: ['Q = [Zn²⁺]/[Cu²⁺] disminuye; en E = E° − (RT/nF)·ln Q el término restado se hace menor (o negativo) y E aumenta.', 'Q = [Zn²⁺]/[Cu²⁺] decreases; in E = E° − (RT/nF)·ln Q the subtracted term becomes smaller (or negative) and E rises.'] },
      4: { q: ['Cuando la pila se agota por completo, ¿qué se cumple?', 'When the cell is completely exhausted, what is true?'],
        options: [['E = 0 y Q = K', 'E = 0 and Q = K'], ['E = E° y Q = 1', 'E = E° and Q = 1'], ['E < 0 y la reacción se invierte sola', 'E < 0 and the reaction reverses by itself'], ['Q = 0', 'Q = 0']], answer: 0,
        why: ['La pila deja de entregar trabajo cuando la reacción llega al equilibrio: ΔG = 0, por lo tanto E = 0 y el cociente Q iguala a K.', 'The cell stops delivering work when the reaction reaches equilibrium: ΔG = 0, so E = 0 and the quotient Q equals K.'] }
    }
  });
})();
