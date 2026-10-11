/* Extras de Isomería · Laboratorio 3D
   1) Tema claro/oscuro  2) Lección guiada por etapas (kit común)  3) Contador de isómeros de Werner. */
(function () {
  'use strict';
  var KEY = 'simkit:isomeria:theme';
  function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(KEY, t); } catch (e) { /* sin almacenamiento */ } }
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* nada */ }
  setTheme(saved === 'light' ? 'light' : 'dark');
  function toggleTheme() { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }

  /* ---------- Contador de isómeros (argumento de Werner) ---------- */
  function closure(gens, n) {
    var id = []; for (var i = 0; i < n; i++) id.push(i);
    var seen = {}; seen[id.join()] = 1; var q = [id], all = [id];
    while (q.length) {
      var p = q.pop();
      gens.forEach(function (g) { var r = p.map(function (x) { return g[x]; }), k = r.join(); if (!seen[k]) { seen[k] = 1; q.push(r); all.push(r); } });
    }
    return all;
  }
  var GEOS = [
    { id: 'hex', name: 'Hexágono plano', grp: closure([[1, 2, 3, 4, 5, 0], [0, 5, 4, 3, 2, 1]], 6) },
    { id: 'pri', name: 'Prisma trigonal', grp: closure([[1, 2, 0, 4, 5, 3], [3, 5, 4, 0, 2, 1]], 6) },
    { id: 'oct', name: 'Octaedro', grp: GROUP.oct.map(function (g) { return g.p; }) }
  ];
  var COMPS = [{ k: 1, label: 'MA₅B', obs: 1 }, { k: 2, label: 'MA₄B₂', obs: 2 }, { k: 3, label: 'MA₃B₃', obs: 2 }];
  function pop(m) { var c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
  function classes(grp, k) {
    var map = {};
    for (var m = 0; m < 64; m++) {
      if (pop(m) !== k) continue;
      var best = 99;
      grp.forEach(function (p) { var r = 0; for (var j = 0; j < 6; j++) if (m & (1 << j)) r |= (1 << p[j]); if (r < best) best = r; });
      map[best] = (map[best] || 0) + 1;
    }
    return Object.keys(map).map(function (c) { return map[c]; }).sort(function (a, b) { return b - a; });
  }
  var wComp = 1;
  function buildWerner() {
    var host = document.querySelector('.werner'); if (!host) return;
    var box = document.createElement('div'); box.className = 'wcount';
    box.innerHTML = '<h4>Compruébalo tú: ¿cuántos isómeros predice cada geometría?</h4>' +
      '<p>El programa coloca los ligandos B en las seis posiciones de cada geometría y agrupa las colocaciones que un giro rígido hace equivalentes. Cada color de la barra es un isómero distinto; el número es cuántas colocaciones contiene.</p>' +
      '<div class="wseg" role="group" aria-label="Composición"></div><div id="wrows"></div><div class="wverdict" id="wverdict" role="status" aria-live="polite"></div>';
    host.appendChild(box);
    var seg = box.querySelector('.wseg');
    COMPS.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c.label; b.setAttribute('aria-pressed', i === wComp ? 'true' : 'false');
      b.addEventListener('click', function () { wComp = i; seg.querySelectorAll('button').forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); renderW(); });
      seg.appendChild(b);
    });
    renderW();
  }
  function renderW() {
    var c = COMPS[wComp], rows = document.getElementById('wrows'), html = '', ok = [];
    GEOS.forEach(function (g) {
      var cl = classes(g.grp, c.k), match = cl.length === c.obs; if (match) ok.push(g.name);
      html += '<div class="wrow"><div class="nm">' + g.name + '</div><div class="wbar" role="img" aria-label="' + cl.length + ' isómeros con ' + cl.join(' + ') + ' colocaciones">' +
        cl.map(function (n) { return '<span style="flex:' + n + '">' + n + '</span>'; }).join('') + '</div>' +
        '<div class="wres ' + (match ? 'ok' : 'no') + '">' + cl.length + ' isómero' + (cl.length === 1 ? '' : 's') + (match ? ' ✓' : '') + '</div></div>';
    });
    html += '<div class="wrow"><div class="nm">Observado</div><div class="wbar" style="background:transparent"></div><div class="wres">' + c.obs + ' isómero' + (c.obs === 1 ? '' : 's') + '</div></div>';
    rows.innerHTML = html;
    var v = document.getElementById('wverdict');
    v.textContent = ok.length === 1 ? 'Solo el ' + ok[0].toLowerCase() + ' coincide con lo que se observa experimentalmente para ' + c.label + '.' :
      ok.length > 1 ? 'Con ' + c.label + ' coinciden: ' + ok.join(', ') + '. Hace falta otra composición para decidir: por eso Werner usó MA₄B₂ (2 isómeros en vez de 3).' :
      'Ninguna geometría coincide con lo observado.';
  }
  buildWerner();

  /* ---------- Lección guiada ---------- */
  var $$ = function (id) { return document.getElementById(id); };
  function goMode(m) { mode = m; rx = HOME.rx; ry = HOME.ry; if (m === 'build') { chal = -1; bset = [1, 0, 1, 0, 0, 0]; } rebuild(); }
  function clean() {
    $$('dip').checked = false; $$('guide').checked = true; $$('labels').checked = true;
    resetModels(); cards.forEach(function (c) { c.sel = []; c.axIdx = -1; }); refreshText(); playing = true; playUI();
  }
  function selectCl() { cards.forEach(function (c, i) { var idx = []; c.col.forEach(function (v, j) { if (v === 1) idx.push(j); }); c.sel = idx.slice(0, 2); $$('me' + i).textContent = measureText(i); }); }

  var stages = [
    { name: 'Misma fórmula', title: 'Dos compuestos con la misma fórmula',
      text: '<p>Ambos modelos son <b>[Co(NH₃)₄Cl₂]⁺</b>: misma composición y mismos enlaces Co–N y Co–Cl, pero los dos Cl⁻ ocupan posiciones distintas. Eso es <b>isomería geométrica</b>.</p><p>Gira cualquiera de los dos modelos con el mouse: se mueven juntos.</p>',
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); } },
    { name: 'Medir ángulos', title: 'El ángulo Cl–Co–Cl los distingue',
      text: '<p>Se seleccionaron los dos cloruros en cada modelo: en <b>cis</b> forman 90° y en <b>trans</b> 180°. Ninguna rotación del modelo cambia esas medidas.</p><p>Puedes medir cualquier otro par haciendo clic en dos ligandos.</p>',
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); selectCl(); } },
    { name: 'Polaridad', title: 'El vector dipolar: cis polar, trans apolar',
      text: '<p>La flecha naranja suma los vectores M→Cl (modelo cualitativo). En <b>cis</b> no se cancelan: la molécula es <b>polar</b>. En <b>trans</b> son opuestos y se anulan: es <b>apolar</b>.</p><p>La polaridad es una de las propiedades que permite diferenciar isómeros en el laboratorio.</p>',
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); selectCl(); $$('dip').checked = true; } },
    { name: 'Simetría', title: 'Ejes de simetría: la estructura cae sobre sí misma',
      text: '<p>Los ejes violetas son <b>calculados</b> a partir de los giros que conservan los colores. El cis tiene un eje C₂ (grupo C₂ᵥ); el trans tiene un eje C₄ (grupo D₄ₕ).</p><p>Se anima un giro sobre el eje: al terminar, la estructura coincide consigo misma.</p>',
      dur: 10, focus: '#grid', apply: function () { goMode('oct'); clean(); $$('dip').checked = false; cards.forEach(function (c, i) { if (c.axes.length) { c.axIdx = 0; $$('ax' + i).textContent = axisBtnText(c); } }); setTimeout(function () { $$('sp0').click(); $$('sp1').click(); }, 700); } },
    { name: 'Superposición', title: 'La prueba definitiva: intentar superponer',
      text: '<p>El programa prueba <b>los 24 giros rígidos</b> del octaedro y anima el mejor. Si alguno los hiciera coincidir, serían el mismo compuesto.</p><p>Aquí falla: quedan <b>círculos rojos</b> donde el ligando no coincide. Cis y trans son compuestos distintos (violeta y verde).</p>',
      dur: 11, focus: '.super', apply: function () { goMode('oct'); clean(); setTimeout(superpose, 600); } },
    { name: 'Fac / mer', title: 'Con tres ligandos de cada tipo: fac y mer',
      text: '<p>En [Co(NH₃)₃Cl₃] los tres Cl⁻ pueden cubrir una <b>cara</b> del octaedro (fac, todos cis entre sí) o un <b>meridiano</b> (mer, con un par trans y el metal en su plano). La superficie verde lo destaca.</p>',
      dur: 10, focus: '#grid', apply: function () { goMode('fac'); clean(); } },
    { name: 'Cuadrado plano', title: 'Cisplatino y transplatino',
      text: '<p>En un cuadrado plano MA₂B₂ también hay cis y trans. El <b>cisplatino</b> es un fármaco antitumoral; su isómero trans no sirve como tal: la geometría decide la actividad biológica.</p>',
      dur: 9, focus: '#grid', apply: function () { goMode('square'); clean(); } },
    { name: 'Tetraedro', title: 'En el tetraedro no existe el par cis/trans',
      text: '<p>Todos los pares de vértices del tetraedro son equivalentes (≈109,5°). Por eso la prueba de superposición <b>sí tiene éxito</b>: los dos modelos son la misma estructura vista desde otro lado.</p>',
      dur: 11, focus: '.super', apply: function () { goMode('tetra'); clean(); setTimeout(superpose, 600); } },
    { name: 'Werner', title: 'Contar isómeros para deducir la geometría',
      text: '<p>Werner razonó al revés: si se aíslan solo <b>2 isómeros</b> de MA₄B₂, la geometría no puede ser hexagonal ni prismática (ambas predicen 3). Usa el contador para comprobar qué predice cada geometría.</p>',
      dur: 10, focus: '.wcount', apply: function () { goMode('oct'); clean(); wComp = 1; var s = document.querySelector('.wseg'); if (s) s.querySelectorAll('button')[1].click(); } },
    { name: 'Tu turno', title: 'Construye tú el isómero',
      text: '<p>En el <b>Constructor</b> cambias cada posición entre NH₃ y Cl⁻ y el programa identifica el isómero por su geometría, no por cómo lo dibujaste. Prueba el reto: <b>fac-[Co(NH₃)₃Cl₃]</b>.</p>',
      dur: 10, focus: '#builder', apply: function () { goMode('build'); clean(); chal = 2; $$('chal').value = '2'; bset = [0, 0, 0, 0, 0, 0]; rebuild(); } }
  ];

  SimKitLite.attach({
    key: 'isomeria-complejos', title: 'Isomería · Laboratorio 3D', home: '../../',
    stages: stages, themeToggle: toggleTheme,
    snapshot: function () { var cs = [$$('c0'), $$('c1')]; return cs[0]; },
    help: {
      intro: 'Explora los modelos arrastrando para girarlos y haciendo clic en los ligandos para medir ángulos. La <b>lección guiada</b> (botón del libro, o la tecla L) recorre los cinco módulos paso a paso.',
      items: [
        ['Superponer', 'prueba los 24 giros rígidos; si ninguno funciona, son compuestos distintos.'],
        ['Eje de simetría', 'recorre los ejes calculados; “Girar” y “Mirar por el eje” los demuestran.'],
        ['Vector dipolar', 'suma cualitativa de los vectores M→Cl.'],
        ['Contador de Werner', 'al final de la página: isómeros que predice cada geometría.']
      ]
    },
    extraKeys: [['Flechas', 'Girar el modelo con el foco en él']]
  });
})();
