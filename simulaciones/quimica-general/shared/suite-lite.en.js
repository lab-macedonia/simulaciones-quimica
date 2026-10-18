/* Lección guiada, captura, pantalla completa y ayuda para los módulos de la suite.
   Se carga al final de cada módulo y elige su guion según <body data-module>. Requiere ../../kit/simkit-lite.js */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function tab(id) { var t = document.querySelector('[data-tab="' + id + '"]'); if (t) t.click(); }
  function sel(id, v) { var e = $(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event('change', { bubbles: true })); }
  function rng(id, v) { var e = $(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }
  function clk(id) { var e = $(id); if (e) e.click(); }
  function chk(id, on) { var e = $(id); if (e && e.checked !== on) e.click(); }
  function F(s) { return s; }

  var M = document.body.getAttribute('data-module');
  var CFG = {};

  CFG['atomlab'] = {
    title: 'AtomLab', theme: 'theme', before: function () { tab('experimentos'); },
    stages: [
      { name: 'Dalton', title: "Every model is born from evidence", focus: '#timeline',
        text: "<p>The timeline runs through the atomic models. Each one is presented with the <b>evidence</b> that motivated it, what it <b>explained</b> and what it <b>left open</b>.</p>",
        apply: function () { tab('historia'); showEvent(0); } },
      { name: "Quantum", title: "Up to the quantum description", focus: '.modelview',
        text: "<p>The last milestone on the timeline is the quantum model, in which electrons are described by probability clouds instead of orbits.</p>",
        apply: function () { tab('historia'); showEvent(EVENTS.length - 1); } },
      { name: "1s orbital", title: "Probability cloud", focus: '#orb3d',
        text: "<p>Each dot is a possible electron position sampled from |ψ|². In the <b>1s</b> the cloud is spherical and the densest zone is near the nucleus; the radial graph shows the most probable radius (a₀).</p>",
        apply: function () { tab('orbitales'); if (window.Atom3D && Atom3D.setOrbital) Atom3D.setOrbital('1s', 'cloud'); } },
      { name: "2p orbital", title: "Lobes, phase and nodal plane", focus: '#orb3d',
        text: "<p>The <b>2p</b> has two lobes of opposite sign (red and blue) separated by a <b>nodal plane</b> through the nucleus. The sign is the phase of ψ, not a charge.</p>",
        apply: function () { tab('orbitales'); if (window.Atom3D && Atom3D.setOrbital) Atom3D.setOrbital('2pz', 'both'); } },
      { name: "3s orbital", title: "Radial nodes", focus: '#orb3d',
        text: "<p>The <b>3s</b> has n − ℓ − 1 = 2 <b>radial nodes</b> (spheres where |ψ|² = 0) and three zones of high probability; look at the peaks in the radial graph.</p>",
        apply: function () { tab('orbitales'); if (window.Atom3D && Atom3D.setOrbital) Atom3D.setOrbital('3s', 'cloud'); } },
      { name: "3d orbital", title: "Four lobes and two nodes", focus: '#orb3d',
        text: "<p>The <b>d</b> orbitals have ℓ = 2: two angular nodes. The 3d<sub>xy</sub> has four lobes with alternating signs between the xz and yz nodal planes.</p>",
        apply: function () { tab('orbitales'); if (window.Atom3D && Atom3D.setOrbital) Atom3D.setOrbital('3dxy', 'both'); } },
      { name: 'Thomson', title: "Cathode rays: the electron", focus: '#expCanvas',
        text: "<p>An electric or magnetic field deflects the beam: the particles have <b>negative charge</b> and the same charge-to-mass ratio whatever the gas.</p>",
        apply: function () { tab('experimentos'); sel('expSelect', 'thomson'); clk('runExp'); } },
      { name: 'Millikan', title: "Oil drop: charge is quantized", focus: '#expCanvas',
        text: "<p>The charge of the drops is always an integer multiple of <b>e</b>. Move the experimental control and watch how the falling speed changes.</p>",
        apply: function () { tab('experimentos'); sel('expSelect', 'millikan'); clk('runExp'); } },
      { name: 'Rutherford', title: "Alpha scattering: the nucleus", focus: '#expCanvas',
        text: "<p>Almost all α particles pass through the foil, but a few bounce straight back: the positive charge is concentrated in a tiny <b>nucleus</b>.</p>",
        apply: function () { tab('experimentos'); sel('expSelect', 'rutherford'); clk('runExp'); } },
      { name: 'Bohr', title: "Hydrogen spectrum and levels", focus: '#expCanvas',
        text: "<p>The lines of the spectrum are explained by <b>jumps between energy levels</b>: each line corresponds to a fixed energy difference.</p>",
        apply: function () { tab('experimentos'); sel('expSelect', 'bohr'); clk('runExp'); } },
      { name: 'Davisson–Germer', title: "Electrons diffract", focus: '#expCanvas',
        text: "<p>Electrons show diffraction: they behave like <b>waves</b>, which opens the door to the quantum model (de Broglie).</p>",
        apply: function () { tab('experimentos'); sel('expSelect', 'davisson'); clk('runExp'); } },
      { name: "Compare", title: "What changes and what stays the same", focus: '#compareGrid',
        text: "<p>Compare the models side by side: what object changes (nucleus, electron) and what idea is preserved (matter is discrete).</p>",
        apply: function () { tab('compara'); } },
      { name: "Your turn", title: "Predict before observing", focus: '#quiz',
        text: "<p>Choose your answers and press <b>Review</b>. Predicting before seeing the result is the best way to detect prior ideas.</p>",
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: "Go through the timeline, run the five historical experiments with their control, compare the models and solve the challenge.", items: [["Experiment", "five experiments with a slider and a Run button."], ["History", "each milestone with evidence, explanation and limits."]] }
  };

  CFG['configuracion-electronica'] = {
    title: "Electron Configuration", theme: 'themeToggle', noSnap: true,
    stages: [
      { name: "Carbon", title: "One configuration, three languages", focus: '#configurar',
        text: "<p>For <b>carbon</b> (Z = 6) you have the full notation, the condensed one and the orbital diagram: three ways of saying the same thing. Notice the two unpaired electrons (Hund's rule).</p>",
        apply: function () { tab('configurar'); selectElement(6); } },
      { name: "Iron", title: "Transition metals: 4s before 3d", focus: '#orbitalDiagram',
        text: "<p>In <b>iron</b> (Z = 26) the 4s fills before the 3d. Notice how many electrons remain unpaired: they explain its magnetic behavior.</p>",
        apply: function () { tab('configurar'); selectElement(26); } },
      { name: "Exception", title: "Chromium does not follow the simple scheme", focus: '#exceptionNote',
        text: "<p><b>Chromium</b> (Z = 24) adopts 3d⁵4s¹ and not 3d⁴4s²: the half-filled d subshell is energetically favorable.</p>",
        apply: function () { tab('configurar'); selectElement(24); } },
      { name: 'Aufbau', title: "Step-by-step filling", focus: '#paso',
        text: "<p>Each step adds electrons following the Aufbau order. Watch which rule is applied (Aufbau, Pauli or Hund) in each subshell.</p>",
        apply: function () { tab("step"); rng('stepRange', 3); } },
      { name: "Ions", title: "Ions: the highest-n electrons leave first", focus: '#iones',
        text: "<p>When forming <b>Fe³⁺</b> the 4s electrons are removed first and then the 3d; that is why the ion ends up 3d⁵ (half-filled).</p>",
        apply: function () { tab('iones'); sel('ionElement', 26); sel('ionCharge', 3); clk('ionApply'); } },
      { name: "Rules", title: "Three rules for the diagrams", focus: '#reglas',
        text: "<p>Aufbau (lowest energy first), the Pauli exclusion principle and Hund's rule (one electron in each orbital before pairing).</p>",
        apply: function () { tab('reglas'); } },
      { name: "Your turn", title: "Configuration challenge", focus: '#quiz',
        text: "<p>Answer random questions about notation, unpaired electrons and blocks.</p>",
        apply: function () { tab('quiz'); } }
    ],
    help: { intro: "Choose an element from the list, search or mini table; review the step-by-step filling, the ions and the rules.", items: [["Mini table", "click an element to load it."], ["Ions", "choose an element and load it to see which electrons leave first."]] }
  };

  CFG['propiedades-periodicas'] = {
    title: "Periodic Properties", theme: 'themeToggle',
    before: function () { tab('graficar'); clk('drawChart'); },
    stages: [
      { name: "Electronegativity", title: "A property painted onto the table", focus: '#explorar',
        text: "<p>The color indicates the value of the property. <b>Electronegativity</b> increases upward and to the right: click an element to see its data and the trend arrows.</p>",
        apply: function () { tab("explore"); sel('propertySelect', 'electronegativityPauling'); } },
      { name: "Ionization", title: "Ionization energy", focus: '#periodicTable',
        text: "<p>More energy is needed to remove an electron as you move across the period, because the effective nuclear charge increases.</p>",
        apply: function () { tab("explore"); sel('propertySelect', 'ionizationEnergyKJ'); } },
      { name: "Radii", title: "Atomic radius: the inverse trend", focus: '#periodicTable',
        text: "<p>The radius decreases across the period (more nuclear charge, same level) and increases down the group (more levels).</p>",
        apply: function () { tab("explore"); sel('propertySelect', 'atomicRadiusModelPm'); } },
      { name: "Compare", title: "Sodium versus chlorine", focus: '#comparar',
        text: "<p>Two elements of the same period: chlorine has a much higher electronegativity and electron affinity. Change the property to contrast them.</p>",
        apply: function () { tab("compare"); sel('compareA', 11); sel('compareB', 17); sel('compareProperty', 'electronegativityPauling'); clk('compareButton'); } },
      { name: "Graph", title: "Periodicity versus atomic number", focus: '#graficar',
        text: "<p>The peaks correspond to the noble gases and the minima to the alkali metals: the property repeats with the period.</p>",
        apply: function () { tab('graficar'); sel('chartProperty', 'ionizationEnergyKJ'); clk('drawChart'); } },
      { name: "Your turn", title: "Trends challenge", focus: '#desafio',
        text: "<p>Decide which element has the higher value of the indicated property and check whether your reasoning matches the trend.</p>",
        apply: function () { tab('desafio'); } },
      { name: "Concepts", title: "Nuclear charge, shielding and distance", focus: '#conceptos',
        text: "<p>All the trends arise from the competition between effective nuclear charge, shielding and electron distance.</p>",
        apply: function () { tab('conceptos'); } }
    ],
    help: { intro: "Choose a property, filter by block or search for an element. Compare two elements and graph the property between two atomic numbers.", items: [["“Model” indices", "are comparative, not experimental values."], ["Graph", "choose property and Z range."]] }
  };

  CFG['lewislab'] = {
    title: 'LewisLab', theme: 'theme', before: function () { tab('moleculas'); },
    stages: [
      { name: "Atoms", title: "Lewis symbols", focus: '#atomos',
        text: "<p>The Lewis symbol represents the <b>valence electrons</b>: first one electron on each side and then they pair up.</p>",
        apply: function () { tab('atomos'); } },
      { name: "Water", title: "Guided construction: H₂O", focus: '#moleculas',
        text: "<p>Count electrons, choose the central atom and complete octets. Advance with <b>Next</b>. The O ends up with two lone pairs.</p>",
        apply: function () { tab('moleculas'); selectMol('H2O'); clk('nextStep'); } },
      { name: "Formal charges", title: "Live formal charges", focus: '#molSvg',
        text: "<p>The <b>formal charge</b> measures how far each atom is from its valence count. In CO₂ with double bonds all are zero: it is the best structure.</p>",
        apply: function () { tab('moleculas'); selectMol('CO2'); var b = $('fcToggle'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); } },
      { name: "Polarity", title: "Bond polarity", focus: '#molSvg',
        text: "<p>The electronegativity difference makes the bond polar. It is shown here in water; compare with CO₂, where the dipoles cancel by geometry.</p>",
        apply: function () { tab('moleculas'); selectMol('H2O'); var b = $('polToggle'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); } },
      { name: "Build", title: "Build it yourself", focus: '#construir',
        text: "<p>Adjust the bond orders and press <b>Check</b>: the checker reviews the bond pattern of the contributor.</p>",
        apply: function () { tab("build"); } },
      { name: "Resonance", title: "Resonance: delocalized structure", focus: '#resonancia',
        text: "<p>In <b>ozone</b> there are two equivalent contributors. The real molecule does not alternate between them: it is a hybrid with bonds of equal length.</p>",
        apply: function () { tab("resonance"); sel('resSelect', 'O3'); } },
      { name: "Exceptions", title: "Exceptions to the octet", focus: '#exceptionGrid',
        text: "<p>Radicals (NO₂), incomplete octets (BF₃) and hypervalent species (PCl₅) do not obey the simple octet rule.</p>",
        apply: function () { tab("exceptions"); } },
      { name: "Your turn", title: "Mini-challenge", focus: '#desafio',
        text: "<p>Answer and press <b>Review</b>. Think about formal charges before choosing the most stable structure.</p>",
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: "Choose molecules, step through the construction and turn on the formal charge and polarity layers. Practice in “Build” and “Challenges”.", items: [["Formal charges", "button on the structure bar."], ["Resonance", "switch between contributors with the buttons."]] }
  };

  CFG['geomol'] = {
    title: 'GeoMol', theme: 'theme', before: function () { tab("explore"); },
    stages: [
      { name: "Water", title: "AX₂E₂: bent shape", focus: '#explora',
        text: "<p>Four electron domains (tetrahedral) but only two bonded atoms: the shape is <b>bent</b> and the lone pairs compress the H–O–H angle.</p>",
        apply: function () { tab("explore"); sel('molSelect', 'H2O'); chk('loneToggle', true); chk('dipoleToggle', true); } },
      { name: "Methane", title: "AX₄: perfect tetrahedron", focus: '#explora',
        text: "<p>Four identical bonds, no lone pair: 109.5° angles and dipoles that cancel, a <b>nonpolar</b> molecule.</p>",
        apply: function () { tab("explore"); sel('molSelect', 'CH4'); } },
      { name: "Bipyramid", title: "AX₅ and AX₄E: beyond the octet", focus: '#explora',
        text: "<p>In the trigonal bipyramid there are distinct axial and equatorial positions. Lone pairs prefer the equatorial ones (SF₄, seesaw shape).</p>",
        apply: function () { tab("explore"); sel('molSelect', 'SF4'); } },
      { name: "Octahedron", title: "AX₆ and AX₄E₂", focus: '#explora',
        text: "<p>In the octahedron the lone pairs sit in opposite positions: <b>XeF₄</b> is square planar and nonpolar.</p>",
        apply: function () { tab("explore"); sel('molSelect', 'XeF4'); } },
      { name: "Builder", title: "Build any AXₙEₘ", focus: '#construye',
        text: "<p>Change the bonded atoms and the lone pairs: geometries, angles and hybridization are updated.</p>",
        apply: function () { tab("build"); rng('xRange', 3); rng('eRange', 1); } },
      { name: "Polarity", title: "Vector sum of dipoles", focus: '#polaridad',
        text: "<p>CO₂ has polar bonds but opposite dipoles that cancel: it is nonpolar. Change molecule to compare.</p>",
        apply: function () { tab("polarity"); sel('polSelect', 'CO2'); } },
      { name: "Compare", title: "Geometric families", focus: '#compareGrid',
        text: "<p>Comparison of the geometries by number of domains and lone pairs.</p>",
        apply: function () { tab('compara'); } },
      { name: "Your turn", title: "Mini-challenge", focus: '#desafio',
        text: "<p>Predict the geometry before reviewing: count domains, subtract lone pairs and decide the shape.</p>",
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: "Drag the molecule to rotate it in 3D. Turn lone pairs and dipoles on or off. Export the image with the capture button.", items: [["Practice mode", "hides the answer so you can predict."], ["Builder", "any AXₙEₘ with X between 2 and 6."]] }
  };

  CFG['sigma-pi'] = {
    title: "σ and π Bonds", theme: 'themeToggle', before: function () { tab("simulator"); },
    stages: [
      { name: "Simple", title: "C–C: one sigma bond", focus: '#simulador',
        text: "<p>The single bond is a single <b>σ</b> bond (sp³): it allows free rotation about the axis.</p>",
        apply: function () { tab("simulator"); sel('bondSelect', 'single'); } },
      { name: "Double", title: 'C=C: σ + π', focus: '#simulador',
        text: "<p>The double bond adds a <b>π</b> bond through side-by-side overlap of p orbitals: rotation would break that overlap, which is why cis/trans isomers exist.</p>",
        apply: function () { tab("simulator"); sel('bondSelect', 'double'); chk('orbitalToggle', true); } },
      { name: "Rotation", title: "Rotating breaks the π bond", focus: '#bondCanvas',
        text: "<p>Press <b>Rotate</b>: as the bond twists, the π overlap decreases and the energy rises to a maximum at 90°.</p>",
        apply: function () { tab("simulator"); sel('bondSelect', 'double'); clk('rotateButton'); } },
      { name: 'Triple', title: 'C≡C: σ + 2π', focus: '#simulador',
        text: "<p>The triple bond has one σ and two perpendicular π bonds (sp): the molecule is linear.</p>",
        apply: function () { tab("simulator"); sel('bondSelect', 'triple'); } },
      { name: "Benzene", title: "Aromatic: delocalized π", focus: '#simulador',
        text: "<p>In benzene the six π electrons are spread over the whole ring, above and below the plane.</p>",
        apply: function () { tab("simulator"); sel('bondSelect', 'benzene'); } },
      { name: "Compare", title: "Comparison table", focus: '#comparar',
        text: "<p>Number of σ and π bonds, hybridization, geometry and possibility of rotation for each bond type.</p>",
        apply: function () { tab("compare"); } },
      { name: "Learn", title: "Origin of σ and π", focus: '#aprender',
        text: "<p>σ: head-on overlap, cylindrical symmetry. π: side-by-side overlap, with a nodal plane containing the axis.</p>",
        apply: function () { tab("learn"); } },
      { name: "Your turn", title: "Mini-quiz", focus: '#quiz',
        text: "<p>Answer and press <b>Review</b>.</p>",
        apply: function () { tab('quiz'); } }
    ],
    help: { intro: "Choose the bond type, turn on the orbitals and press Rotate to see the torsional energy.", items: [["Orbitals", "shows σ and π lobes."], ["Rotate", "bond torsion and energy graph."]] }
  };

  var c = CFG[M]; if (!c || !window.SimKitLite) return;
  function findVisual() {
    var p = document.querySelector('.panel.active,.tab-panel.active') || document.body, best = null, area = 0;
    p.querySelectorAll('canvas,svg').forEach(function (e) {
      var r = e.getBoundingClientRect(); var a = r.width * r.height;
      if (r.width > 120 && r.height > 120 && a > area && !e.closest('.sk-root')) { best = e; area = a; }
    });
    return best;
  }
  function snapshotTarget() {
    var t = findVisual();
    if (!t && c.before) { c.before(); t = findVisual(); }   // si la pestaña activa no tiene imagen, ir a la que sí
    return t;
  }
  SimKitLite.attach({
    key: M, title: c.title, home: '../../',
    stages: c.stages, help: c.help,
    themeToggle: c.theme ? function () { clk(c.theme); } : null,
    snapshot: c.noSnap ? false : snapshotTarget
  });
})();
