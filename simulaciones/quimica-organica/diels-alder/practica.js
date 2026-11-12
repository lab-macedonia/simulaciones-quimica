/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 4: { q: ["¿Qué producto se forma de preferencia a baja temperatura?", "Which product forms preferentially at low temperature?"], options: [["El endo", "The endo"], ["El exo", "The exo"], ["Ambos por igual", "Both equally"]], answer: 0, why: ["Las interacciones orbitales secundarias estabilizan el estado de transición endo (control cinético).", "Secondary orbital interactions stabilize the endo transition state (kinetic control)."] } } });

/* Práctica: dienos, dienófilos y producto de Diels–Alder. */
(function () {
  var Y = ['Sí', 'Yes'], N = ['No', 'No'];
  /* dieno, ¿reacciona?, razón */
  var DI = [['1,3-butadieno', '1,3-butadiene', 1, ['Gira libremente hasta la conformación s-cis.', 'It rotates freely into the s-cis conformation.']], ['ciclopentadieno', 'cyclopentadiene', 1, ['Está fijo en s-cis: es un dieno muy reactivo.', 'It is locked s-cis: a very reactive diene.']],
    ['1,4-pentadieno', '1,4-pentadiene', 0, ['Sus dobles enlaces no están conjugados (hay un CH₂ entre ellos).', 'Its double bonds are not conjugated (a CH₂ separates them).']], ['2,3-dimetil-1,3-butadieno', '2,3-dimethyl-1,3-butadiene', 1, ['Conjugado y puede adoptar la conformación s-cis; los metilos donan densidad.', 'Conjugated and can adopt s-cis; the methyl groups donate density.']],
    ['(2Z,4Z)-hexa-2,4-dieno', '(2Z,4Z)-hexa-2,4-diene', 0, ['En s-cis los dos metilos internos chocan: la conformación reactiva casi no se alcanza.', 'In s-cis the two inner methyls clash: the reactive conformation is barely reached.']], ['1,3-ciclohexadieno', '1,3-cyclohexadiene', 1, ['Fijo en s-cis dentro del anillo.', 'Locked s-cis within the ring.']]];
  var DP = [['CH₂=CH–CHO (acroleína)', 'CH₂=CH₂ (eteno)', ['El CHO atrae electrones y baja la energía del LUMO del dienófilo.', 'CHO withdraws electrons and lowers the dienophile LUMO.']], ['anhídrido maleico', 'propeno', ['Dos grupos C=O atractores: LUMO muy bajo.', 'Two electron-withdrawing C=O groups: a very low LUMO.']],
    ['CH₂=CH–CN (acrilonitrilo)', 'CH₂=CH–OCH₃ (metil vinil éter)', ['El CN atrae electrones; el OCH₃ los dona y sube el LUMO.', 'CN withdraws electrons; OCH₃ donates them and raises the LUMO.']], ['NC–CH=CH–CN', 'CH₂=CH₂ (eteno)', ['Dos grupos ciano atractores.', 'Two electron-withdrawing cyano groups.']]];
  function tr(s, H) { return H.EN ? s.replace('(acroleína)', '(acrolein)').replace('(eteno)', '(ethene)').replace('anhídrido maleico', 'maleic anhydride').replace('propeno', 'propene').replace('(acrilonitrilo)', '(acrylonitrile)').replace('(metil vinil éter)', '(methyl vinyl ether)') : s; }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['¿Sirve como dieno?', 'Does it work as a diene?'], gen: function (H) {
        var d = H.pick(DI);
        return H.mc(H.t('¿El <b>' + d[0] + '</b> reacciona fácilmente como dieno en una Diels–Alder?', 'Does <b>' + d[1] + '</b> react readily as a diene in a Diels–Alder reaction?'), d[2] ? Y : N, [Y, N], H.L(d[3]) + ' ' + H.t('El dieno debe estar conjugado y alcanzar la conformación s-cis.', 'The diene must be conjugated and reach the s-cis conformation.'));
      } },
      { name: ['Mejor dienófilo', 'Better dienophile'], gen: function (H) {
        var p = H.pick(DP);
        return H.mc(H.t('¿Qué dienófilo reacciona más rápido con 1,3-butadieno: ' + p[0] + ' o ' + p[1] + '?', 'Which dienophile reacts faster with 1,3-butadiene: ' + tr(p[0], H) + ' or ' + tr(p[1], H) + '?'), tr(p[0], H), [tr(p[1], H)], p[2]);
      } },
      { name: ['Conteo en el producto', 'Counting in the product'], gen: function (H) {
        var k = H.pick(['ring', 'sigma', 'pi']), v = { ring: 6, sigma: 2, pi: 1 }[k];
        var q = { ring: ['¿Cuántos átomos tiene el anillo nuevo formado en una Diels–Alder?', 'How many atoms are in the new ring formed in a Diels–Alder reaction?'], sigma: ['¿Cuántos enlaces σ C–C nuevos se forman en una Diels–Alder?', 'How many new C–C σ bonds form in a Diels–Alder reaction?'], pi: ['¿Cuántos enlaces π quedan en el anillo de ciclohexeno formado (sin contar sustituyentes)?', 'How many π bonds remain in the cyclohexene ring formed (not counting substituents)?'] }[k];
        return { q: H.L(q), a: v, abs: 0, aText: String(v), sol: H.t('[4+2]: 4 C del dieno + 2 C del dienófilo forman un anillo de 6. Se rompen 3 enlaces π y se forman 2 σ nuevos y 1 π nuevo (entre C2 y C3 del dieno).', '[4+2]: 4 diene carbons + 2 dienophile carbons form a 6-membered ring. Three π bonds break; 2 new σ bonds and 1 new π bond (between diene C2 and C3) form.') };
      } }
    ]
  });
})();
