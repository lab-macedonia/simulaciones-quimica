/* Práctica · Diagramas de fase y Clausius–Clapeyron (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ problems: [
  { name: ['Presión de vapor (Clausius–Clapeyron)', 'Vapor pressure (Clausius–Clapeyron)'], gen: function (H) {
    var f = H.fmt, s = H.pick([[['agua', 'water'], 40.7, 373.15], [['etanol', 'ethanol'], 38.6, 351.4], [['benceno', 'benzene'], 30.7, 353.2], [['acetona', 'acetone'], 29.1, 329.2]]), T = H.int(290, 340), P = 760 * Math.exp(-s[1] * 1000 / 8.314 * (1 / T - 1 / s[2]));
    return { q: H.t('El ' + H.L(s[0]) + ' hierve a ' + f(s[2], 1) + ' K a 760 mmHg y ΔH<sub>vap</sub> = ' + f(s[1], 1) + ' kJ/mol. Estima su presión de vapor a ' + T + ' K.', H.L(s[0]) + ' boils at ' + f(s[2], 1) + ' K at 760 mmHg and ΔH<sub>vap</sub> = ' + f(s[1], 1) + ' kJ/mol. Estimate its vapor pressure at ' + T + ' K.'), a: P, unit: 'mmHg', tol: 0.03,
      sol: 'ln(P/760) = −(ΔH/R)(1/T − 1/T<sub>eb</sub>) = ' + f(Math.log(P / 760), 3) + ' → P = ' + H.sig(P, 3) + ' mmHg' };
  } },
  { name: ['Punto de ebullición a otra presión', 'Boiling point at another pressure'], gen: function (H) {
    var f = H.fmt, P = H.int(450, 700), Tb = 1 / (1 / 373.15 - 8.314 * Math.log(P / 760) / 40700);
    return { q: H.t('En una montaña la presión es ' + P + ' mmHg. ¿A qué temperatura hierve el agua? (ΔH<sub>vap</sub> = 40,7 kJ/mol; T<sub>eb</sub> = 373,15 K a 760 mmHg)', 'On a mountain the pressure is ' + P + ' mmHg. At what temperature does water boil? (ΔH<sub>vap</sub> = 40.7 kJ/mol; T<sub>b</sub> = 373.15 K at 760 mmHg)'), a: Tb - 273.15, unit: '°C', abs: 0.4,
      sol: '1/T = 1/' + f(373.15, 2) + ' − R·ln(P/760)/ΔH → T = ' + f(Tb, 1) + ' K = ' + f(Tb - 273.15, 1) + ' °C', aText: f(Tb - 273.15, 1) };
  } },
  { name: ['Lectura del diagrama', 'Reading the diagram'], gen: function (H) {
    var c = H.int(0, 3), Q = [[H.t('¿Qué ocurre con el CO₂ sólido a 1 atm al calentarlo?', 'What happens to solid CO₂ at 1 atm when heated?'), [H.t('Sublima: el punto triple está a 5,1 atm', 'It sublimes: the triple point is at 5.1 atm'), H.t('Se funde a −56 °C', 'It melts at −56 °C'), H.t('Hierve a 0 °C', 'It boils at 0 °C'), H.t('No cambia', 'Nothing')]],
      [H.t('¿Por qué el hielo se funde al aplicarle presión?', 'Why does ice melt under pressure?'), [H.t('La curva sólido–líquido del agua tiene pendiente negativa', 'Water\'s solid–liquid line has a negative slope'), H.t('Porque la presión lo calienta mucho', 'Because pressure heats it a lot'), H.t('Por el punto crítico', 'Because of the critical point'), H.t('No se funde', 'It does not melt')]],
      [H.t('Por encima del punto crítico la sustancia es…', 'Above the critical point the substance is…'), [H.t('Un fluido supercrítico', 'A supercritical fluid'), H.t('Un sólido', 'A solid'), H.t('Un gas que se licúa al comprimirlo', 'A gas that liquefies when compressed'), H.t('Un plasma', 'A plasma')]],
      [H.t('En el punto triple coexisten…', 'At the triple point there coexist…'), [H.t('Sólido, líquido y gas', 'Solid, liquid and gas'), H.t('Solo líquido y gas', 'Only liquid and gas'), H.t('Dos sólidos', 'Two solids'), H.t('Ninguna fase', 'No phase')]]][c];
    return { q: Q[0], options: Q[1], answer: 0, sol: H.t('Revísalo en el diagrama P–T de la simulación.', 'Check it on the simulation\'s P–T diagram.') };
  } }
] });
/* Predicción de la lección guiada */
SimAula.register({ predict: { 4: { q: ["Si se aumenta la presión sobre hielo a −1 °C, ¿qué ocurre?", "If pressure on ice at −1 °C is increased, what happens?"], options: [["Puede fundirse", "It can melt"], ["Se vuelve más sólido", "It becomes more solid"], ["Sublima", "It sublimes"]], answer: 0, why: ["La curva sólido–líquido del agua tiene pendiente negativa: el líquido es más denso que el hielo.", "Water\u0027s solid–liquid line has a negative slope: the liquid is denser than ice."] } } });
