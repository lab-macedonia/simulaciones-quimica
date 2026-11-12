/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 2: { q: ["Si hay lactosa y no hay glucosa, los genes lacZYA…", "With lactose present and no glucose, the lacZYA genes…"], options: [["se transcriben con fuerza", "are strongly transcribed"], ["siguen reprimidos", "stay repressed"], ["se eliminan del ADN", "are removed from the DNA"]], answer: 0, why: ["La alolactosa retira el represor y, con poca glucosa, CAP–AMPc activa el promotor.", "Allolactose removes the repressor and, with low glucose, CAP–cAMP activates the promoter."] } } });

/* Práctica: expresión del operón lac según lactosa, glucosa y mutaciones. */
(function () {
  var E = { off: ['Apagado (casi nula)', 'Off (almost none)'], low: ['Baja', 'Low'], high: ['Alta', 'High'] };
  /* lactosa, glucosa, mutación, resultado, explicación */
  var C = [[0, 1, '', 'off', ['Sin lactosa el represor LacI está unido al operador.', 'Without lactose the LacI repressor is bound to the operator.']], [0, 0, '', 'off', ['Sin lactosa el represor bloquea el operador, aunque haya AMPc–CAP.', 'Without lactose the repressor blocks the operator, even with cAMP–CAP present.']],
    [1, 1, '', 'low', ['La alolactosa libera al represor, pero con glucosa el AMPc está bajo y CAP no activa: transcripción basal.', 'Allolactose releases the repressor, but with glucose cAMP is low and CAP does not activate: basal transcription.']], [1, 0, '', 'high', ['Represor liberado y AMPc–CAP unido al promotor: máxima transcripción.', 'Repressor released and cAMP–CAP bound to the promoter: maximum transcription.']],
    [0, 0, 'lacI⁻', 'high', ['Sin represor funcional, el operón se transcribe siempre (constitutivo).', 'With no functional repressor the operon is always transcribed (constitutive).']], [0, 0, 'lacOᶜ', 'high', ['El operador mutado no une al represor: expresión constitutiva.', 'The mutated operator does not bind the repressor: constitutive expression.']],
    [1, 0, 'lacIˢ', 'off', ['El superrepresor no une alolactosa y queda siempre en el operador.', 'The super-repressor cannot bind allolactose and stays on the operator.']], [1, 0, 'CAP⁻', 'low', ['Sin CAP no hay activación: solo transcripción basal.', 'Without CAP there is no activation: only basal transcription.']]];
  function cond(c, H) { return H.t('lactosa ' + (c[0] ? 'presente' : 'ausente') + ', glucosa ' + (c[1] ? 'presente' : 'ausente') + (c[2] ? ', mutante ' + c[2] : ''), 'lactose ' + (c[0] ? 'present' : 'absent') + ', glucose ' + (c[1] ? 'present' : 'absent') + (c[2] ? ', ' + c[2] + ' mutant' : '')); }
  var G = [['lacZ', ['β-galactosidasa: hidroliza la lactosa (y forma alolactosa)', 'β-galactosidase: hydrolyzes lactose (and makes allolactose)']], ['lacY', ['Permeasa: transporta lactosa al interior', 'Permease: carries lactose into the cell']], ['lacA', ['Transacetilasa', 'Transacetylase']], ['lacI', ['Represor (se une al operador)', 'Repressor (binds the operator)']]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Nivel de expresión', 'Expression level'], gen: function (H) {
        var c = H.pick(C);
        return H.mc(H.t('Condiciones: <b>' + cond(c, H) + '</b>. ¿Cómo es la expresión de lacZYA?', 'Conditions: <b>' + cond(c, H) + '</b>. What is the expression of lacZYA?'), E[c[3]], [E.off, E.low, E.high], H.L(c[4]));
      } },
      { name: ['¿Qué codifica el gen?', 'What does the gene encode?'], gen: function (H) {
        return H.bank(G, function (g) { return H.t('¿Qué codifica el gen <b>' + g[0] + '</b>?', 'What does the <b>' + g[0] + '</b> gene encode?'); }, function (g) { return g[1]; }, function () { return H.t('lacZ, lacY y lacA se transcriben juntos en un ARNm policistrónico; lacI tiene su propio promotor.', 'lacZ, lacY and lacA are transcribed together as one polycistronic mRNA; lacI has its own promoter.'); });
      } }
    ]
  });
})();
