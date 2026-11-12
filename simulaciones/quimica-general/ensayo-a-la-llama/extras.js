/* Extras de Ensayo a la llama: lección guiada, «Muestra problema» (predictor), captura y ayuda. */
(function () {
  'use strict';
  var $$ = function (id) { return document.getElementById(id); };
  var KEYS = Object.keys(ELEMENTS_DATA);
  function nm(k) { return ELEMENTS_DATA[k].name; }
  function setCollar(v) { collarSlider.value = v; collarSlider.dispatchEvent(new Event('input', { bubbles: true })); }
  function cobalt(on) { if (!!isCobaltFilter !== on) btnCobalt.click(); }

  /* ---------- Muestra problema ---------- */
  var mys = null; // {key, tries, done}
  var card = document.createElement('div');
  card.id = 'mystery-card'; card.hidden = true; card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'Muestra problema');
  card.innerHTML = '<h3>Muestra problema: ¿qué catión es?</h3>' +
    '<p>Observa el color de la llama, la longitud de onda medida y las líneas del espectro. Los datos que revelan el nombre están ocultos.</p>' +
    '<div class="opts" id="myopts"></div><div class="row"><div class="fb" id="myfb" role="status" aria-live="polite"></div>' +
    '<div class="tools"><button type="button" id="mynew">Otra muestra</button> <button type="button" id="myend">Salir</button></div></div>';
  document.querySelector('main').appendChild(card);
  var opts = $$('myopts');
  KEYS.forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = nm(k) + ' (' + k + ')';
    b.addEventListener('click', function () { answer(k, b); }); opts.appendChild(b);
  });
  function maskInfo() {
    dom.elementTitle.innerHTML = 'Muestra desconocida <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">¿sal?</span>';
    dom.confElectronica.innerText = '?'; dom.transicionTerm.innerText = '?'; dom.elementNote.innerText = 'Identifica el catión a partir de la longitud de onda, el color y el espectro.';
    elementsGrid.style.visibility = 'hidden';
  }
  function startMystery(keep) {
    var prev = mys && mys.key, k;
    do { k = KEYS[Math.floor(Math.random() * KEYS.length)]; } while (k === prev && KEYS.length > 1);
    mys = { key: k, tries: 0, done: false };
    selectElement(k); toggleLoopPosition(true); maskInfo();
    opts.querySelectorAll('button').forEach(function (b) { b.disabled = false; b.className = ''; });
    $$('myfb').className = 'fb'; $$('myfb').textContent = ''; card.hidden = false;
  }
  function endMystery() {
    card.hidden = true; elementsGrid.style.visibility = ''; var k = mys ? mys.key : currentElementKey; mys = null; selectElement(k);
  }
  function answer(k, btn) {
    if (!mys || mys.done) return;
    var d = ELEMENTS_DATA[mys.key], fb = $$('myfb'); mys.tries++;
    if (k === mys.key) {
      mys.done = true; btn.className = 'ok'; fb.className = 'fb ok';
      fb.textContent = '¡Correcto! ' + d.name + ' (' + d.salt + '): línea principal en ' + String(d.wavelength).replace('.', ',') + ' nm, color ' + (d.flameColorHex) + '. ' + (mys.tries === 1 ? 'A la primera.' : 'En ' + mys.tries + ' intentos.');
      elementsGrid.style.visibility = ''; selectElement(mys.key);
    } else {
      btn.className = 'no'; btn.disabled = true; fb.className = 'fb no';
      var w = ELEMENTS_DATA[k].wavelength, mine = d.wavelength;
      fb.textContent = nm(k) + ' emite en ' + String(w).replace('.', ',') + ' nm; la muestra, en ' + (mine > w ? 'una longitud de onda mayor' : 'una longitud de onda menor') + '. Inténtalo de nuevo.';
    }
  }
  $$('mynew').addEventListener('click', function () { startMystery(); });
  $$('myend').addEventListener('click', endMystery);
  var hdr = $$('btn-clean').parentNode, mb = document.createElement('button');
  mb.id = 'btn-mystery'; mb.type = 'button'; mb.innerHTML = '<span>?</span><span class="hidden sm:inline">Muestra problema</span>';
  mb.addEventListener('click', function () { if (mys) endMystery(); else startMystery(); }); hdr.insertBefore(mb, hdr.firstChild);

  /* ---------- Lección ---------- */
  function reset() { if (mys) endMystery(); cobalt(false); setCollar(100); card.hidden = true; }
  var stages = [
    { name: 'Una sal, un color', title: 'Cada catión colorea la llama de forma característica',
      text: '<p>El asa de platino lleva <b>LiCl</b> a la llama: el calor excita electrones del Li⁺ y, al volver al nivel fundamental, emiten luz <b>roja</b> (670,8 nm).</p><p>Prueba otras sales en el panel izquierdo.</p>',
      dur: 8, focus: '#elements-grid', apply: function () { reset(); selectElement('Li'); toggleLoopPosition(true); } },
    { name: 'El espectro', title: 'La llama es una línea (o un doblete) del espectro',
      text: '<p>El sodio emite el <b>doblete D</b> cerca de 589 nm: amarillo muy intenso. La barra inferior muestra dónde cae cada línea en el espectro visible.</p>',
      dur: 8, focus: '#spectrum-bar-wrap', apply: function () { reset(); selectElement('Na'); toggleLoopPosition(true); } },
    { name: 'Niveles', title: 'Diagrama de niveles: la transición explica el color',
      text: '<p>En el diagrama de <b>Grotrian</b> la flecha va del nivel excitado al fundamental; su energía ΔE = hc/λ fija el color. En la pestaña <b>Orbital</b> verás el ciclo excitación → emisión.</p>',
      dur: 10, focus: '#quantum-panel', apply: function () { reset(); selectElement('K'); toggleLoopPosition(true); setDiagramMode('grotrian'); } },
    { name: 'Orbitales', title: 'Vista de orbitales',
      text: '<p>Aquí el electrón salta de un orbital a otro al absorber energía de la llama y devuelve esa energía como un fotón de longitud de onda definida.</p>',
      dur: 9, focus: '#quantum-panel', apply: function () { reset(); selectElement('K'); toggleLoopPosition(true); setDiagramMode('orbital'); } },
    { name: 'Filtro cobalto', title: 'El vidrio de cobalto separa al potasio del sodio',
      text: '<p>El sodio ensucia casi cualquier muestra con su amarillo. El <b>vidrio de cobalto</b> lo absorbe y deja ver el violeta del potasio: así se distingue K⁺ aunque haya trazas de Na⁺.</p>',
      dur: 9, focus: '#btn-cobalt', apply: function () { reset(); setDiagramMode('grotrian'); selectElement('K'); toggleLoopPosition(true); cobalt(true); } },
    { name: 'Collarín', title: 'La llama también importa',
      text: '<p>Con el collarín de aire cerrado la llama es <b>reductora y amarilla</b> (hollín) y enmascara colores débiles. Abierta, es <b>oxidante y azul</b>, casi sin luz propia: ideal para el ensayo.</p>',
      dur: 8, focus: '#air-collar-slider', apply: function () { reset(); selectElement('Cu'); toggleLoopPosition(true); setCollar(0); } },
    { name: 'Limpiar el asa', title: 'Sin limpiar, hay contaminación',
      text: '<p>Entre muestras se sumerge el asa en <b>HCl</b> y se calcina hasta que la llama vuelva al azul base. Si no, el sodio residual da falsos positivos.</p>',
      dur: 7, focus: '#btn-clean', apply: function () { reset(); setCollar(100); $$('btn-clean').click(); } },
    { name: 'Tu turno', title: 'Muestra problema',
      text: '<p>Se elige una sal al azar y se <b>oculta su nombre</b>. Observa el color de la llama, la longitud de onda y el espectro, y decide qué catión es.</p>',
      dur: 10, focus: '#mystery-card', apply: function () { reset(); setCollar(100); startMystery(); } }
  ];

  /* ---------- Paneles colapsables y vista despejada ---------- */
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var EYE = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>';
  var EYE_OFF = '<path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
  var panels = [
    { el: $$('elements-grid').closest('.absolute'), label: 'Muestras y llama' },
    { el: $$('quantum-panel'), label: 'Análisis cuántico' }
  ];
  function setOpen(p, open) {
    p.el.classList.toggle('k-col', !open);
    p.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    // en pantallas estrechas ambos paneles ocupan el ancho completo: se abre uno a la vez
    if (open && narrow && narrow.matches) panels.forEach(function (q) { if (q !== p) setOpen(q, false); });
  }
  panels.forEach(function (p, i) {
    p.el.id = p.el.id || 'k-panel-' + i;
    p.el.classList.add('k-pan');
    p.btn = document.createElement('button');
    p.btn.className = 'k-tab'; p.btn.setAttribute('aria-controls', p.el.id); p.btn.title = 'Contraer / expandir';
    p.btn.innerHTML = '<span>' + p.label + '</span>' + CHEV;
    p.btn.addEventListener('click', function () { setOpen(p, p.el.classList.contains('k-col')); });
    p.el.insertBefore(p.btn, p.el.firstChild);
  });
  function placePanels() { panels.forEach(function (p) { setOpen(p, !(narrow && narrow.matches)); }); }
  placePanels();
  if (narrow && narrow.addEventListener) narrow.addEventListener('change', placePanels);
  // la lección guiada abre el panel que está señalando
  stages.forEach(function (s) {
    var ap = s.apply;
    s.apply = function () {
      ap.apply(this, arguments);
      panels.forEach(function (p) { var f = s.focus && document.querySelector(s.focus); if (f && p.el.contains(f) && p.el.classList.contains('k-col')) setOpen(p, true); });
    };
  });
  var cleanBtn = document.createElement('button');
  cleanBtn.id = 'k-clean'; cleanBtn.className = 'p-1.5 rounded hover:bg-slate-800 text-slate-300 active:bg-slate-700';
  function setClean(on) {
    document.body.classList.toggle('k-clean', on);
    cleanBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    cleanBtn.title = on ? 'Mostrar los paneles (O o Esc)' : 'Ocultar los paneles para ver toda la simulación (O)';
    cleanBtn.setAttribute('aria-label', on ? 'Mostrar los paneles' : 'Ocultar los paneles');
    cleanBtn.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (on ? EYE : EYE_OFF) + '</svg>';
  }
  setClean(false);
  cleanBtn.addEventListener('click', function () { setClean(!document.body.classList.contains('k-clean')); });
  $$('cam-loop').parentNode.appendChild(cleanBtn);
  $$('spectrum-bar-wrap').parentNode.classList.add('k-spec');
  window.addEventListener('keydown', function (e) {
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' && e.target.type !== 'range' || t === 'TEXTAREA' || t === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'o' || e.key === 'O') setClean(!document.body.classList.contains('k-clean'));
    else if (e.key === 'Escape' && document.body.classList.contains('k-clean')) setClean(false);
  });

  SimKitLite.attach({
    key: 'ensayo-a-la-llama', title: 'Ensayo a la llama', home: '../../',
    stages: stages,
    snapshot: function () { return renderer.domElement; },
    beforeSnapshot: function () { renderer.render(scene, camera); },
    forceTheme: 'dark',
    help: {
      intro: 'Elige una sal en el panel izquierdo y introduce el asa en la llama. Arrastra para girar la escena y usa la rueda para acercar. La <b>lección guiada</b> (libro, tecla L) recorre los conceptos; <b>Muestra problema</b> te pide identificar el catión.',
      items: [
        ['Diagrama cuántico', 'Grotrian: niveles y transición; Orbital: ciclo excitación → emisión.'],
        ['Espectro calibrado', 'ubica las líneas del analito entre 380 y 750 nm.'],
        ['Filtro cobalto', 'atenúa el doblete amarillo del Na⁺.'],
        ['Collarín de aire', 'llama reductora (amarilla) u oxidante (azul).'],
        ['Paneles', 'toca su título para contraerlos; el ojo (tecla O) los oculta todos para ver la llama completa.']
      ]
    },
    extraKeys: [['O', 'Ocultar / mostrar los paneles'], ['Esc', 'Salir de la vista despejada']]
  });
})();
