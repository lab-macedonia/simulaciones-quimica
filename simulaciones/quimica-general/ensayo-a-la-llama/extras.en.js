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
  card.id = 'mystery-card'; card.hidden = true; card.setAttribute('role', 'region'); card.setAttribute('aria-label', "Unknown sample");
  card.innerHTML = "<h3>Unknown sample: which cation is it?</h3>" +
    "<p>Observe the flame color, the measured wavelength and the spectrum lines. The data that reveal the name are hidden.</p>" +
    '<div class="opts" id="myopts"></div><div class="row"><div class="fb" id="myfb" role="status" aria-live="polite"></div>' +
    "<div class=\"tools\"><button type=\"button\" id=\"mynew\">Another sample</button> <button type=\"button\" id=\"myend\">Exit</button></div></div>";
  document.querySelector('main').appendChild(card);
  var opts = $$('myopts');
  KEYS.forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = nm(k) + ' (' + k + ')';
    b.addEventListener('click', function () { answer(k, b); }); opts.appendChild(b);
  });
  function maskInfo() {
    dom.elementTitle.innerHTML = "Unknown sample <span class=\"text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700\">salt?</span>";
    dom.confElectronica.innerText = '?'; dom.transicionTerm.innerText = '?'; dom.elementNote.innerText = "Identify the cation from the wavelength, the color and the spectrum.";
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
      fb.textContent = "Correct! " + d.name + ' (' + d.salt + "): main line at " + String(d.wavelength).replace('.', '.') + ' nm, color ' + (d.flameColorHex) + '. ' + (mys.tries === 1 ? "First try." : "In " + mys.tries + ' intentos.');
      elementsGrid.style.visibility = ''; selectElement(mys.key);
    } else {
      btn.className = 'no'; btn.disabled = true; fb.className = 'fb no';
      var w = ELEMENTS_DATA[k].wavelength, mine = d.wavelength;
      fb.textContent = nm(k) + " emits at " + String(w).replace('.', '.') + " nm; the sample, at " + (mine > w ? "a longer wavelength" : "a shorter wavelength") + ". Try again.";
    }
  }
  $$('mynew').addEventListener('click', function () { startMystery(); });
  $$('myend').addEventListener('click', endMystery);
  var hdr = $$('btn-clean').parentNode, mb = document.createElement('button');
  mb.id = 'btn-mystery'; mb.type = 'button'; mb.innerHTML = "<span>?</span><span class=\"hidden sm:inline\">Unknown sample</span>";
  mb.addEventListener('click', function () { if (mys) endMystery(); else startMystery(); }); hdr.insertBefore(mb, hdr.firstChild);

  /* ---------- Lección ---------- */
  function reset() { if (mys) endMystery(); cobalt(false); setCollar(100); card.hidden = true; }
  var stages = [
    { name: "One salt, one color", title: "Each cation colors the flame in a characteristic way",
      text: "<p>The platinum loop carries <b>LiCl</b> into the flame: the heat excites electrons of Li⁺ and, on returning to the ground level, they emit <b>red</b> light (670.8 nm).</p><p>Try other salts in the left panel.</p>",
      dur: 8, focus: '#elements-grid', apply: function () { reset(); selectElement('Li'); toggleLoopPosition(true); } },
    { name: "The spectrum", title: "The flame is a line (or a doublet) of the spectrum",
      text: "<p>Sodium emits the <b>D doublet</b> near 589 nm: very intense yellow. The bar below shows where each line falls in the visible spectrum.</p>",
      dur: 8, focus: '#spectrum-bar-wrap', apply: function () { reset(); selectElement('Na'); toggleLoopPosition(true); } },
    { name: "Levels", title: "Level diagram: the transition explains the color",
      text: "<p>In the <b>Grotrian</b> diagram the arrow goes from the excited level to the ground level; its energy ΔE = hc/λ sets the color. In the <b>Orbital</b> tab you will see the excitation → emission cycle.</p>",
      dur: 10, focus: '#quantum-panel', apply: function () { reset(); selectElement('K'); toggleLoopPosition(true); setDiagramMode('grotrian'); } },
    { name: "Orbitals", title: "Orbital view",
      text: "<p>Here the electron jumps from one orbital to another on absorbing energy from the flame and returns that energy as a photon of definite wavelength.</p>",
      dur: 9, focus: '#quantum-panel', apply: function () { reset(); selectElement('K'); toggleLoopPosition(true); setDiagramMode('orbital'); } },
    { name: "Cobalt filter", title: "Cobalt glass separates potassium from sodium",
      text: "<p>Sodium contaminates almost any sample with its yellow. <b>Cobalt glass</b> absorbs it and lets the violet of potassium show: that is how K⁺ is distinguished even when traces of Na⁺ are present.</p>",
      dur: 9, focus: '#btn-cobalt', apply: function () { reset(); setDiagramMode('grotrian'); selectElement('K'); toggleLoopPosition(true); cobalt(true); } },
    { name: "Air collar", title: "The flame matters too",
      text: "<p>With the air collar closed the flame is <b>reducing and yellow</b> (soot) and masks weak colors. Open, it is <b>oxidizing and blue</b>, with almost no light of its own: ideal for the test.</p>",
      dur: 8, focus: '#air-collar-slider', apply: function () { reset(); selectElement('Cu'); toggleLoopPosition(true); setCollar(0); } },
    { name: "Clean the loop", title: "Without cleaning, there is contamination",
      text: "<p>Between samples the loop is dipped in <b>HCl</b> and heated until the flame returns to the base blue. Otherwise, residual sodium gives false positives.</p>",
      dur: 7, focus: '#btn-clean', apply: function () { reset(); setCollar(100); $$('btn-clean').click(); } },
    { name: "Your turn", title: "Unknown sample",
      text: "<p>A salt is chosen at random and its <b>name is hidden</b>. Observe the flame color, the wavelength and the spectrum, and decide which cation it is.</p>",
      dur: 10, focus: '#mystery-card', apply: function () { reset(); setCollar(100); startMystery(); } }
  ];

  SimKitLite.attach({
    key: 'ensayo-a-la-llama', title: "Flame test", home: '../../',
    stages: stages,
    snapshot: function () { return renderer.domElement; },
    beforeSnapshot: function () { renderer.render(scene, camera); },
    forceTheme: 'dark',
    help: {
      intro: "Choose a salt in the left panel and insert the loop into the flame. Drag to rotate the scene and use the wheel to zoom. The <b>guided lesson</b> (book, key L) walks through the concepts; <b>Unknown sample</b> asks you to identify the cation.",
      items: [
        ["Quantum diagram", "Grotrian: levels and transition; Orbital: excitation → emission cycle."],
        ["Calibrated spectrum", "places the analyte lines between 380 and 750 nm."],
        ["Cobalt filter", "attenuates the yellow Na⁺ doublet."],
        ["Air collar", "reducing (yellow) or oxidizing (blue) flame."]
      ]
    }
  });
})();
