/* Extras de Isomería · Laboratorio 3D
   1) Tema claro/oscuro  2) Lección guiada por etapas (kit común)  3) Contador de isómeros de Werner. */
(function () {
  "use strict";
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
    { id: 'hex', name: "Planar hexagon", grp: closure([[1, 2, 3, 4, 5, 0], [0, 5, 4, 3, 2, 1]], 6) },
    { id: 'pri', name: "Trigonal prism", grp: closure([[1, 2, 0, 4, 5, 3], [3, 5, 4, 0, 2, 1]], 6) },
    { id: 'oct', name: "Octahedron", grp: GROUP.oct.map(function (g) { return g.p; }) }
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
    box.innerHTML = "<h4>Check it yourself: how many isomers does each geometry predict?</h4>" +
      "<p>The program places the B ligands in the six positions of each geometry and groups the placements that a rigid rotation makes equivalent. Each color of the bar is a different isomer; the number is how many placements it contains.</p>" +
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
      html += '<div class="wrow"><div class="nm">' + g.name + '</div><div class="wbar" role="img" aria-label="' + cl.length + " isomers with " + cl.join(' + ') + " placements\">" +
        cl.map(function (n) { return '<span style="flex:' + n + '">' + n + '</span>'; }).join('') + '</div>' +
        '<div class="wres ' + (match ? 'ok' : 'no') + '">' + cl.length + " isomer" + (cl.length === 1 ? '' : 's') + (match ? ' ✓' : '') + '</div></div>';
    });
    html += "<div class=\"wrow\"><div class=\"nm\">Observed</div><div class=\"wbar\" style=\"background:transparent\"></div><div class=\"wres\">" + c.obs + " isomer" + (c.obs === 1 ? '' : 's') + '</div></div>';
    rows.innerHTML = html;
    var v = document.getElementById('wverdict');
    v.textContent = ok.length === 1 ? "Only the " + ok[0].toLowerCase() + " matches what is observed experimentally for " + c.label + '.' :
      ok.length > 1 ? "With " + c.label + ' coinciden: ' + ok.join(', ') + ". Another composition is needed to decide: that is why Werner used MA₄B₂ (2 isomers instead of 3)." :
      "No geometry matches the observations.";
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
    { name: "Same formula", title: "Two compounds with the same formula",
      text: "<p>Both models are <b>[Co(NH₃)₄Cl₂]⁺</b>: same composition and the same Co–N and Co–Cl bonds, but the two Cl⁻ occupy different positions. That is <b>geometric isomerism</b>.</p><p>Rotate either model with the mouse: they move together.</p>",
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); } },
    { name: "Measure angles", title: "The Cl–Co–Cl angle distinguishes them",
      text: "<p>The two chlorides were selected in each model: in <b>cis</b> they form 90° and in <b>trans</b> 180°. No rotation of the model changes those measurements.</p><p>You can measure any other pair by clicking two ligands.</p>",
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); selectCl(); } },
    { name: "Polarity", title: "The dipole vector: cis polar, trans nonpolar",
      text: "<p>The orange arrow adds up the M→Cl vectors (qualitative model). In <b>cis</b> they do not cancel: the molecule is <b>polar</b>. In <b>trans</b> they are opposite and cancel out: it is <b>nonpolar</b>.</p><p>Polarity is one of the properties that allows isomers to be told apart in the laboratory.</p>",
      dur: 9, focus: '#grid', apply: function () { goMode('oct'); clean(); selectCl(); $$('dip').checked = true; } },
    { name: "Symmetry", title: "Symmetry axes: the structure falls onto itself",
      text: "<p>The violet axes are <b>calculated</b> from the rotations that preserve the colors. Cis has a C₂ axis (group C₂ᵥ); trans has a C₄ axis (group D₄ₕ).</p><p>A rotation about the axis is animated: when it ends, the structure coincides with itself.</p>",
      dur: 10, focus: '#grid', apply: function () { goMode('oct'); clean(); $$('dip').checked = false; cards.forEach(function (c, i) { if (c.axes.length) { c.axIdx = 0; $$('ax' + i).textContent = axisBtnText(c); } }); setTimeout(function () { $$('sp0').click(); $$('sp1').click(); }, 700); } },
    { name: "Superposition", title: "The definitive test: try to superimpose",
      text: "<p>The program tests <b>all 24 rigid rotations</b> of the octahedron and animates the best one. If any made them coincide, they would be the same compound.</p><p>Here it fails: <b>red circles</b> remain where the ligand does not match. Cis and trans are different compounds (violet and green).</p>",
      dur: 11, focus: '.super', apply: function () { goMode('oct'); clean(); setTimeout(superpose, 600); } },
    { name: 'Fac / mer', title: "With three ligands of each type: fac and mer",
      text: "<p>In [Co(NH₃)₃Cl₃] the three Cl⁻ can cover one <b>face</b> of the octahedron (fac, all cis to each other) or one <b>meridian</b> (mer, with a trans pair and the metal in its plane). The green surface highlights it.</p>",
      dur: 10, focus: '#grid', apply: function () { goMode('fac'); clean(); } },
    { name: "Square planar", title: "Cisplatin and transplatin",
      text: "<p>In a square planar MA₂B₂ there are also cis and trans. <b>Cisplatin</b> is an antitumor drug; its trans isomer is no use as such: geometry decides biological activity.</p>",
      dur: 9, focus: '#grid', apply: function () { goMode('square'); clean(); } },
    { name: "Tetrahedron", title: "In the tetrahedron the cis/trans pair does not exist",
      text: "<p>All the pairs of vertices of the tetrahedron are equivalent (≈109.5°). That is why the superposition test <b>does succeed</b>: the two models are the same structure seen from another side.</p>",
      dur: 11, focus: '.super', apply: function () { goMode('tetra'); clean(); setTimeout(superpose, 600); } },
    { name: 'Werner', title: "Counting isomers to deduce the geometry",
      text: "<p>Werner reasoned backwards: if only <b>2 isomers</b> of MA₄B₂ are isolated, the geometry cannot be hexagonal or prismatic (both predict 3). Use the counter to check what each geometry predicts.</p>",
      dur: 10, focus: '.wcount', apply: function () { goMode('oct'); clean(); wComp = 1; var s = document.querySelector('.wseg'); if (s) s.querySelectorAll('button')[1].click(); } },
    { name: "Your turn", title: "Build the isomer yourself",
      text: "<p>In the <b>Builder</b> you switch each position between NH₃ and Cl⁻ and the program identifies the isomer by its geometry, not by how you drew it. Try the challenge: <b>fac-[Co(NH₃)₃Cl₃]</b>.</p>",
      dur: 10, focus: '#builder', apply: function () { goMode('build'); clean(); chal = 2; $$('chal').value = '2'; bset = [0, 0, 0, 0, 0, 0]; rebuild(); } }
  ];

  SimKitLite.attach({
    key: 'isomeria-complejos', title: "Isomerism · 3D Lab", home: '../../',
    stages: stages, themeToggle: toggleTheme,
    snapshot: function () { var cs = [$$('c0'), $$('c1')]; return cs[0]; },
    help: {
      intro: "Explore the models by dragging to rotate them and clicking on the ligands to measure angles. The <b>guided lesson</b> (book button, or the L key) goes through the five modules step by step.",
      items: [
        ["Superimpose", "tests the 24 rigid rotations; if none works, they are different compounds."],
        ["Symmetry axis", "cycles through the calculated axes; “Rotate” and “Look along the axis” demonstrate them."],
        ["Dipole vector", "qualitative sum of the M→Cl vectors."],
        ["Werner counter", "at the bottom of the page: isomers predicted by each geometry."]
      ]
    },
    extraKeys: [["Arrows", "Rotate the model with focus on it"]]
  });
})();
