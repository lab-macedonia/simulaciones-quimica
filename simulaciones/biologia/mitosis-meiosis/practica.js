/* Predicción de la lección guiada (ES/EN en un archivo, ver kit/aula.js). */
SimAula.register({ predict: { 3: { q: ["En la meiosis I, ¿qué se separa?", "In meiosis I, what separates?"], options: [["Los cromosomas homólogos", "Homologous chromosomes"], ["Las cromátidas hermanas", "Sister chromatids"], ["Nada: solo se replica el ADN", "Nothing: DNA only replicates"]], answer: 0, why: ["Por eso la meiosis I reduce el número de cromosomas (2n → n); las cromátidas se separan en la meiosis II.", "That is why meiosis I halves the chromosome number (2n → n); chromatids separate in meiosis II."] } } });

/* Práctica: cromosomas, cromátidas y contenido de ADN en cada fase (valores generados a partir de 2n). */
(function () {
  var SP = [['humano', 'human', 46], ['perro', 'dog', 78], ['mosca de la fruta', 'fruit fly', 8], ['arveja', 'pea', 14], ['maíz', 'maize', 20], ['gato', 'cat', 38], ['papa', 'potato', 48], ['chimpancé', 'chimpanzee', 48]];
  /* fase, factor de cromosomas, factor de cromátidas, factor de ADN (relativos a n; C = ADN de un juego haploide sin replicar) */
  var PH = [[['G1', 'G1'], 2, 2, 2], [['G2', 'G2'], 2, 4, 4], [['metafase de la mitosis', 'mitotic metaphase'], 2, 4, 4], [['anafase de la mitosis (toda la célula)', 'mitotic anaphase (whole cell)'], 4, 4, 4],
    [['cada célula hija tras la mitosis', 'each daughter cell after mitosis'], 2, 2, 2], [['metafase I de la meiosis', 'meiotic metaphase I'], 2, 4, 4], [['cada célula tras la meiosis I', 'each cell after meiosis I'], 1, 2, 2],
    [['metafase II de la meiosis', 'meiotic metaphase II'], 1, 2, 2], [['cada gameto', 'each gamete'], 1, 1, 1]];
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Número de cromosomas', 'Number of chromosomes'], gen: function (H) {
        var s = H.pick(SP), p = H.pick(PH), n = s[2] / 2, v = p[1] * n;
        return { q: H.t('En el ' + s[0] + ' (2n = ' + s[2] + '), ¿cuántos cromosomas hay en <b>' + p[0][0] + '</b>?', 'In the ' + s[1] + ' (2n = ' + s[2] + '), how many chromosomes are there in <b>' + p[0][1] + '</b>?'), a: v, abs: 0, aText: String(v),
          sol: H.t('Se cuentan los centrómeros: n = ' + n + ' → ' + p[1] + 'n = ' + v + '. ', 'Count centromeres: n = ' + n + ' → ' + p[1] + 'n = ' + v + '. ') + (p[1] === 4 ? H.t('En anafase las cromátidas hermanas ya se separaron y cada una cuenta como cromosoma.', 'In anaphase the sister chromatids have separated and each counts as a chromosome.') : p[2] > p[1] ? H.t('Cada cromosoma tiene dos cromátidas hermanas, pero sigue contando como uno.', 'Each chromosome has two sister chromatids but still counts as one.') : '') };
      } },
      { name: ['Número de cromátidas', 'Number of chromatids'], gen: function (H) {
        var s = H.pick(SP), p = H.pick(PH.filter(function (x) { return x[2] > x[1]; })), n = s[2] / 2, v = p[2] * n;
        return { q: H.t('En el ' + s[0] + ' (2n = ' + s[2] + '), ¿cuántas cromátidas hay en <b>' + p[0][0] + '</b>?', 'In the ' + s[1] + ' (2n = ' + s[2] + '), how many chromatids are there in <b>' + p[0][1] + '</b>?'), a: v, abs: 0, aText: String(v),
          sol: p[1] * n + H.t(' cromosomas replicados × 2 cromátidas = ', ' replicated chromosomes × 2 chromatids = ') + v + '.' };
      } },
      { name: ['Contenido de ADN', 'DNA content'], gen: function (H) {
        var p = H.pick(PH), pg = H.pick([3.5, 6, 7, 10]), v = pg * p[3] / 2;
        return { q: H.t('Una célula diploide en G1 contiene <b>' + H.fmt(pg, 1) + ' pg</b> de ADN. ¿Cuánto ADN hay en <b>' + p[0][0] + '</b>?', 'A diploid cell in G1 contains <b>' + H.fmt(pg, 1) + ' pg</b> of DNA. How much DNA is there in <b>' + p[0][1] + '</b>?'), a: v, tol: 0.01, unit: 'pg', aText: H.fmt(v, v % 1 ? 2 : 0),
          sol: H.t('G1 = 2C = ', 'G1 = 2C = ') + H.fmt(pg, 1) + ' pg → C = ' + H.fmt(pg / 2, 2) + ' pg. ' + H.t('En esta etapa hay ', 'At this stage there is ') + p[3] + 'C = ' + H.fmt(v, 2) + ' pg. ' + H.t('El ADN se duplica en la fase S y se reparte en cada división.', 'DNA doubles in S phase and is divided at each division.') };
      } }
    ]
  });
})();
