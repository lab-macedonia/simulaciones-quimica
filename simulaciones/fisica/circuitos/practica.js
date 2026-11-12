/* Predicciones de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: {
  2: { q: ['Agregamos una segunda y una tercera ampolleta en serie con la misma pila. Las ampolletas…', 'We add a second and a third bulb in series with the same cell. The bulbs…'], options: [['brillan igual que una sola', 'glow as brightly as a single one'], ['brillan menos', 'glow less brightly'], ['brillan más', 'glow more brightly']], answer: 1, why: ['La resistencia total aumenta, la corriente baja y el voltaje se reparte: cada una recibe menos potencia.', 'Total resistance rises, current falls and the voltage is shared: each gets less power.'] },
  4: { q: ['En el circuito en serie se funde la primera ampolleta. Las otras dos…', 'In the series circuit the first bulb burns out. The other two…'], options: [['siguen encendidas', 'stay on'], ['brillan más', 'glow brighter'], ['se apagan', 'go out']], answer: 2, why: ['En serie hay un solo camino; al cortarse, la corriente se detiene en todo el circuito.', 'In series there is only one path; once it is broken, current stops in the whole circuit.'] }
} });

/* Práctica: ley de Ohm, resistencia equivalente, corriente y potencia. */
SimAula.register({ problemsIntro: ['Problemas con valores nuevos en cada intento.', 'Problems with new values on every attempt.'],
  problems: [
    { name: ['Ley de Ohm', 'Ohm’s law'], gen: function (H) {
      var R = H.int(2, 100), I = H.rnd(0.05, 3, 2), V = R * I, k = H.int(0, 2);
      if (k === 0) return { q: H.t('¿Qué corriente circula por una resistencia de ' + R + ' Ω conectada a ' + H.fmt(V, 2) + ' V?', 'What current flows through a ' + R + ' Ω resistor connected to ' + H.fmt(V, 2) + ' V?'), a: I, unit: 'A', sol: 'I = V/R = ' + H.fmt(V, 2) + '/' + R + ' = ' + H.fmt(I, 2) + ' A' };
      if (k === 1) return { q: H.t('Por una resistencia de ' + R + ' Ω circulan ' + H.fmt(I, 2) + ' A. ¿Qué voltaje tiene entre sus extremos?', 'A current of ' + H.fmt(I, 2) + ' A flows through a ' + R + ' Ω resistor. What is the voltage across it?'), a: V, unit: 'V', sol: 'V = I·R = ' + H.fmt(I, 2) + '·' + R + ' = ' + H.fmt(V, 2) + ' V' };
      return { q: H.t('Con ' + H.fmt(V, 2) + ' V circulan ' + H.fmt(I, 2) + ' A por un receptor. ¿Cuál es su resistencia?', 'With ' + H.fmt(V, 2) + ' V, ' + H.fmt(I, 2) + ' A flows through a load. What is its resistance?'), a: R, unit: 'Ω', sol: 'R = V/I = ' + H.fmt(V, 2) + '/' + H.fmt(I, 2) + ' = ' + R + ' Ω' };
    } },
    { name: ['Resistencias en serie', 'Resistors in series'], gen: function (H) {
      var r = [H.int(2, 50), H.int(2, 50), H.int(2, 50)], V = H.int(3, 24), Re = r[0] + r[1] + r[2];
      return { q: H.t('Tres resistencias de ' + r.join(', ') + ' Ω se conectan en serie a ' + V + ' V. ¿Qué corriente circula?', 'Three resistors of ' + r.join(', ') + ' Ω are connected in series to ' + V + ' V. What current flows?'), a: V / Re, unit: 'A', sol: 'R eq = ' + Re + ' Ω · I = ' + V + '/' + Re + ' = ' + H.fmt(V / Re, 3) + ' A' };
    } },
    { name: ['Resistencias en paralelo', 'Resistors in parallel'], gen: function (H) {
      var a = H.int(2, 60), b = H.int(2, 60), Re = a * b / (a + b);
      return { q: H.t('¿Cuál es la resistencia equivalente de ' + a + ' Ω y ' + b + ' Ω conectadas en paralelo?', 'What is the equivalent resistance of ' + a + ' Ω and ' + b + ' Ω connected in parallel?'), a: Re, unit: 'Ω', sol: 'R = R₁·R₂/(R₁ + R₂) = ' + a * b + '/' + (a + b) + ' = ' + H.fmt(Re, 2) + ' Ω' };
    } },
    { name: ['Corriente total en paralelo', 'Total current in parallel'], gen: function (H) {
      var V = H.pick([6, 9, 12, 24, 220]), R = [H.int(5, 100), H.int(5, 100), H.int(5, 100)], I = V / R[0] + V / R[1] + V / R[2];
      return { q: H.t('Tres receptores de ' + R.join(', ') + ' Ω se conectan en paralelo a ' + V + ' V. ¿Cuál es la corriente total?', 'Three loads of ' + R.join(', ') + ' Ω are connected in parallel to ' + V + ' V. What is the total current?'), a: I, unit: 'A', sol: 'I = ' + R.map(function (x) { return V + '/' + x; }).join(' + ') + ' = ' + H.fmt(I, 3) + ' A' };
    } },
    { name: ['Potencia y consumo', 'Power and energy use'], gen: function (H) {
      var P = H.pick([60, 100, 800, 1200, 2000]), V = 220, h = H.int(1, 8), kWh = P * h / 1000;
      if (Math.random() < 0.5) return { q: H.t('Un artefacto de ' + P + ' W se conecta a 220 V. ¿Qué corriente consume?', 'A ' + P + ' W appliance is connected to 220 V. What current does it draw?'), a: P / V, unit: 'A', sol: 'I = P/V = ' + P + '/220 = ' + H.fmt(P / V, 2) + ' A' };
      return { q: H.t('Un artefacto de ' + P + ' W funciona ' + h + ' h. ¿Cuánta energía consume, en kWh?', 'A ' + P + ' W appliance runs for ' + h + ' h. How much energy does it use, in kWh?'), a: kWh, unit: 'kWh', sol: 'E = P·t = ' + H.fmt(P / 1000, 2) + ' kW · ' + h + ' h = ' + H.fmt(kWh, 2) + ' kWh' };
    } }
  ]
});
