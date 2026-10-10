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
        ['Collarín de aire', 'llama reductora (amarilla) u oxidante (azul).']
      ]
    }
  });
})();
