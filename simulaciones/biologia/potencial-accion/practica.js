/* Práctica y predicciones · Potencial de membrana y potencial de acción. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  /* [ion, z, [ext] típico (mM), [int] típico (mM)] — neurona de mamífero a 37 °C */
  var ION = [['K⁺', 1, 5, 140], ['Na⁺', 1, 145, 12], ['Ca²⁺', 2, 2, 0.0001], ['Cl⁻', -1, 110, 10]];
  SimAula.register({
    problems: [
      { name: ['Potencial de equilibrio (Nernst)', 'Equilibrium potential (Nernst)'], gen: function (H) {
        var t = H.t, f = H.fmt, I = H.pick(ION), o = +(I[2] * H.rnd(0.6, 1.5, 2)).toPrecision(3), i = +(I[3] * H.rnd(0.6, 1.5, 2)).toPrecision(3), E = 61.5 / I[1] * Math.log10(o / i);
        return { q: t('Calcula el potencial de equilibrio del ' + I[0] + ' a 37 °C si [' + I[0] + ']<sub>ext</sub> = ' + H.sig(o, 3) + ' mM y [' + I[0] + ']<sub>int</sub> = ' + H.sig(i, 3) + ' mM.', 'Calculate the equilibrium potential of ' + I[0] + ' at 37 °C if [' + I[0] + ']<sub>out</sub> = ' + H.sig(o, 3) + ' mM and [' + I[0] + ']<sub>in</sub> = ' + H.sig(i, 3) + ' mM.'), a: E, unit: 'mV', abs: Math.max(0.6, Math.abs(E) * 0.015),
          sol: 'E = (' + f(61.5, 1) + ' mV / z)·log([ext]/[int]) = (' + f(61.5, 1) + ' / ' + I[1] + ') × log(' + H.sig(o / i, 3) + ') = ' + f(E, 1) + ' mV', aText: f(E, 1),
          hint: t('Recuerda dividir por la carga z, con su signo.', 'Remember to divide by the charge z, with its sign.') };
      } },
      { name: ['Concentración a partir del potencial', 'Concentration from the potential'], gen: function (H) {
        var t = H.t, f = H.fmt, Ek = H.rnd(-100, -70, 1), o = H.rnd(3, 10, 1), i = o / Math.pow(10, Ek / 61.5);
        return { q: t('En una célula E<sub>K</sub> = ' + f(Ek, 1) + ' mV a 37 °C y [K⁺]<sub>ext</sub> = ' + f(o, 1) + ' mM. ¿Cuánto vale [K⁺]<sub>int</sub>?', 'In a cell E<sub>K</sub> = ' + f(Ek, 1) + ' mV at 37 °C and [K⁺]<sub>out</sub> = ' + f(o, 1) + ' mM. What is [K⁺]<sub>in</sub>?'), a: i, unit: 'mM', tol: 0.03,
          sol: '[int] = [ext] / 10<sup>E/' + f(61.5, 1) + '</sup> = ' + f(o, 1) + ' / 10<sup>' + f(Ek / 61.5, 3) + '</sup> = ' + H.sig(i, 3) + ' mM' };
      } },
      { name: ['Efecto de bloqueadores y cambios iónicos', 'Effect of blockers and ionic changes'], gen: function (H) {
        var t = H.t, c = H.int(0, 3);
        var Q = [[t('¿Qué ocurre con el potencial de acción si se aplica tetrodotoxina (TTX)?', 'What happens to the action potential if tetrodotoxin (TTX) is applied?'), [t('No se genera: bloquea los canales de Na⁺', 'It does not occur: it blocks the Na⁺ channels'), t('Se prolonga: bloquea los canales de K⁺', 'It is prolonged: it blocks the K⁺ channels'), t('Aumenta su amplitud', 'Its amplitude increases'), t('No cambia', 'It does not change')], t('La TTX bloquea los canales de Na⁺ dependientes de voltaje: no hay despolarización rápida.', 'TTX blocks voltage-gated Na⁺ channels: there is no fast depolarization.')],
          [t('¿Qué ocurre si se aplica tetraetilamonio (TEA)?', 'What happens if tetraethylammonium (TEA) is applied?'), [t('La repolarización se hace más lenta y el potencial de acción se alarga', 'Repolarization slows and the action potential lengthens'), t('No se genera el potencial de acción', 'No action potential is generated'), t('El potencial de reposo pasa a +60 mV', 'The resting potential becomes +60 mV'), t('No cambia', 'It does not change')], t('El TEA bloquea los canales de K⁺ que repolarizan la membrana.', 'TEA blocks the K⁺ channels that repolarize the membrane.')],
          [t('Si aumenta mucho el K⁺ extracelular, el potencial de reposo…', 'If extracellular K⁺ rises a lot, the resting potential…'), [t('Se despolariza (se hace menos negativo)', 'Depolarizes (becomes less negative)'), t('Se hiperpolariza', 'Hyperpolarizes'), t('No cambia', 'Does not change'), t('Se vuelve igual a E<sub>Na</sub>', 'Becomes equal to E<sub>Na</sub>')], t('E<sub>K</sub> = 61,5·log([K]ext/[K]int) se hace menos negativo, y el reposo depende sobre todo de E<sub>K</sub>.', 'E<sub>K</sub> = 61.5·log([K]out/[K]in) becomes less negative, and rest depends mostly on E<sub>K</sub>.')],
          [t('Justo después de un potencial de acción, un segundo estímulo igual…', 'Right after an action potential, a second identical stimulus…'), [t('No dispara: periodo refractario absoluto', 'Does not fire: absolute refractory period'), t('Dispara un potencial el doble de grande', 'Fires a potential twice as large'), t('Siempre dispara igual', 'Always fires the same'), t('Hiperpolariza para siempre', 'Hyperpolarizes forever')], t('Los canales de Na⁺ quedan inactivados unos milisegundos y no pueden reabrirse.', 'The Na⁺ channels stay inactivated for a few milliseconds and cannot reopen.')]][c];
        return { q: Q[0], options: Q[1], answer: 0, sol: Q[2] };
      } }
    ],
    predict: {
      2: { q: ['Durante la fase de subida (despolarización) del potencial de acción, ¿qué ion entra en la célula?', 'During the rising phase (depolarization) of the action potential, which ion enters the cell?'],
        options: [['Na⁺', 'Na⁺'], ['K⁺', 'K⁺'], ['Cl⁻', 'Cl⁻'], ['Ninguno: lo hace la bomba Na⁺/K⁺', 'None: the Na⁺/K⁺ pump does it']], answer: 0,
        why: ['Se abren los canales de Na⁺ dependientes de voltaje y el Na⁺ entra a favor de su gradiente, llevando V<sub>m</sub> hacia E<sub>Na</sub>. Luego sale K⁺ y la membrana se repolariza.', 'Voltage-gated Na⁺ channels open and Na⁺ flows in down its gradient, driving V<sub>m</sub> toward E<sub>Na</sub>. Then K⁺ leaves and the membrane repolarizes.'] },
      4: { q: ['Si se bloquean los canales de Na⁺ con TTX, al estimular el axón…', 'If the Na⁺ channels are blocked with TTX, when the axon is stimulated…'],
        options: [['No se produce potencial de acción', 'No action potential occurs'], ['El potencial de acción es más largo', 'The action potential is longer'], ['El potencial de acción es más grande', 'The action potential is larger'], ['No cambia nada', 'Nothing changes']], answer: 0,
        why: ['Sin la entrada rápida de Na⁺ no hay retroalimentación positiva: solo se ve una pequeña respuesta pasiva que no se propaga.', 'Without the fast Na⁺ influx there is no positive feedback: only a small passive response that does not propagate.'] }
    }
  });
})();
