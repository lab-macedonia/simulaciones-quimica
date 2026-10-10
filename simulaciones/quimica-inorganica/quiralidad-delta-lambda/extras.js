/* Extras de Quiralidad: tema, lección guiada, captura y ayuda (kit común). */
(function () {
  'use strict';
  var KEY = 'simkit:quiralidad:theme';
  function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(KEY, t); } catch (e) { /* nada */ } }
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* nada */ }
  setTheme(saved === 'light' ? 'light' : 'dark');
  function toggleTheme() { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  var $$ = function (id) { return document.getElementById(id); };
  function click(id) { var e = $$(id); if (e) e.click(); }
  function setRange(id, v, ev) { var e = $$(id); e.value = v; e.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }

  var stages = [
    { name: 'Quelatos', title: 'Tres ligandos bidentados',
      text: '<p>En <b>[Co(en)₃]³⁺</b> cada banda une los dos N de una misma etilendiamina: los dos N ocupan posiciones <b>cis</b> (≈90°). Esa conectividad es la información que da quiralidad al complejo.</p>',
      dur: 8, focus: '#grid, .grid, main', apply: function () { setMode('chelate'); S.playing = true; playUI(); } },
    { name: 'Aislar ligando', title: 'Sigue un ligando a la vez',
      text: '<p>Se resalta el ligando 1. Los tres ligandos son idénticos: los colores solo ayudan a seguirlos en el modelo.</p>',
      dur: 7, focus: '#chips', apply: function () { setMode('chelate'); S.focus = 0; syncChips(); } },
    { name: 'Espejo', title: 'Δ y Λ: imágenes especulares',
      text: '<p>El modelo izquierdo se <b>refleja</b> a través de un plano de espejo. Al llegar al 100 % obtienes el otro enantiómero. La hélice guía muestra el sentido de giro de los quelatos.</p>',
      dur: 10, focus: '#grid, .grid, main', apply: function () { setMode('mirror'); S.sigma = S.sigmaT = 0; setTimeout(function () { click('reflectBtn'); }, 800); } },
    { name: 'Superponer', title: 'Girar no basta',
      text: '<p>Se prueban las <b>24 rotaciones propias</b> del octaedro. Coincidir en los N no basta: deben coincidir también las conexiones entre ellos. Δ y Λ nunca logran coincidir por completo.</p>',
      dur: 11, focus: '#hist', apply: function () { setMode('overlap'); setTimeout(function () { if ($$('sweep').getAttribute('aria-pressed') !== 'true') click('sweep'); }, 500); } },
    { name: 'Giro de Bailar', title: 'El camino Δ ⇄ Λ pasa por un prisma aquiral',
      text: '<p>Al torcer el triángulo trasero de −60° a 0° aparece un prisma trigonal con plano σh: es <b>aquiral</b>. Seguir hasta +60° da la imagen especular. La gráfica de helicidad cruza el cero en 0°.</p>',
      dur: 12, focus: '#chi', apply: function () { setMode('twist'); setTimeout(function () { click('tAuto'); }, 500); } },
    { name: 'Control aquiral', title: 'Mismas posiciones, distinta conexión',
      text: '<p>[Co(NH₃)₆]³⁺ ocupa las mismas seis posiciones pero con ligandos independientes: es <b>aquiral</b> (Oh). Al unir los N por pares con puentes aparece la quiralidad (D₃).</p>',
      dur: 9, focus: '#bridgeBtn', apply: function () { setMode('achiral'); setTimeout(function () { var b = $$('bridgeBtn'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); }, 700); } },
    { name: 'Tu turno', title: 'Reto: ¿Δ o Λ?',
      text: '<p>Regla de la mano: pulgar derecho a lo largo del eje C₃. Si los quelatos giran como los dedos derechos, es <b>Δ</b>; si no, <b>Λ</b>. Usa «Pista: mirar por el eje» si lo necesitas.</p>',
      dur: 9, focus: '#qD', apply: function () { setMode('quiz'); } }
  ];

  SimKitLite.attach({
    key: 'quiralidad-delta-lambda', title: 'Quiralidad Δ/Λ · Complejos 3D', home: '../../',
    stages: stages, themeToggle: toggleTheme,
    snapshot: function () { return $$('c0'); },
    help: {
      intro: 'Arrastra los modelos para girarlos, usa la rueda para acercar y los botones numerados (1–6) para cambiar de módulo. La <b>lección guiada</b> (botón del libro, o la tecla L) recorre los seis módulos.',
      items: [
        ['Reflejar', 'convierte Δ en Λ con un plano de espejo.'],
        ['Probar orientaciones', 'las 24 rotaciones propias del octaedro; el histograma muestra cuántos N coinciden.'],
        ['Giro de Bailar', 'torsión continua; la gráfica de helicidad cruza el cero en el prisma aquiral.'],
        ['Reto', 'identifica Δ o Λ en orientaciones aleatorias.']
      ]
    },
    extraKeys: [['1 – 6', 'Cambiar de módulo']]
  });
})();
