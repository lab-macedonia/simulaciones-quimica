/* Extras de Quiralidad: tema, lección guiada, captura y ayuda (kit común). */
(function () {
  "use strict";
  var KEY = 'simkit:quiralidad:theme';
  function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(KEY, t); } catch (e) { /* nada */ } }
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* nada */ }
  setTheme(saved === 'light' ? 'light' : 'dark');
  function toggleTheme() { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  var $$ = function (id) { return document.getElementById(id); };
  function click(id) { var e = $$(id); if (e) e.click(); }
  function setRange(id, v, ev) { var e = $$(id); e.value = v; e.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }

  var stages = [
    { name: "Chelates", title: "Three bidentate ligands",
      text: "<p>In <b>[Co(en)₃]³⁺</b> each band joins the two N of the same ethylenediamine: the two N occupy <b>cis</b> positions (≈90°). That connectivity is the information that gives the complex its chirality.</p>",
      dur: 8, focus: '#grid, .grid, main', apply: function () { setMode('chelate'); S.playing = true; playUI(); } },
    { name: "Isolate ligand", title: "Follow one ligand at a time",
      text: "<p>Ligand 1 is highlighted. The three ligands are identical: the colors only help to follow them in the model.</p>",
      dur: 7, focus: '#chips', apply: function () { setMode('chelate'); S.focus = 0; syncChips(); } },
    { name: "Mirror", title: "Δ and Λ: mirror images",
      text: "<p>The left model is <b>reflected</b> through a mirror plane. At 100 % you get the other enantiomer. The guide helix shows the sense of the twist of the chelates.</p>",
      dur: 10, focus: '#grid, .grid, main', apply: function () { setMode('mirror'); S.sigma = S.sigmaT = 0; setTimeout(function () { click('reflectBtn'); }, 800); } },
    { name: "Superimpose", title: "Rotating is not enough",
      text: "<p>The <b>24 proper rotations</b> of the octahedron are tested. Matching the N is not enough: the connections between them must also match. Δ and Λ never manage to coincide completely.</p>",
      dur: 11, focus: '#hist', apply: function () { setMode('overlap'); setTimeout(function () { if ($$('sweep').getAttribute('aria-pressed') !== 'true') click('sweep'); }, 500); } },
    { name: "Bailar twist", title: "The Δ ⇄ Λ path goes through an achiral prism",
      text: "<p>When the back triangle is twisted from −60° to 0°, a trigonal prism with a σh plane appears: it is <b>achiral</b>. Continuing to +60° gives the mirror image. The helicity plot crosses zero at 0°.</p>",
      dur: 12, focus: '#chi', apply: function () { setMode('twist'); setTimeout(function () { click('tAuto'); }, 500); } },
    { name: "Achiral control", title: "Same positions, different connection",
      text: "<p>[Co(NH₃)₆]³⁺ occupies the same six positions but with independent ligands: it is <b>achiral</b> (Oh). When the N are joined in pairs by bridges, chirality appears (D₃).</p>",
      dur: 9, focus: '#bridgeBtn', apply: function () { setMode('achiral'); setTimeout(function () { var b = $$('bridgeBtn'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); }, 700); } },
    { name: "Your turn", title: "Challenge: Δ or Λ?",
      text: "<p>Hand rule: right thumb along the C₃ axis. If the chelates turn like the right fingers, it is <b>Δ</b>; if not, <b>Λ</b>. Use “Hint: look along the axis” if you need it.</p>",
      dur: 9, focus: '#qD', apply: function () { setMode('quiz'); } }
  ];

  SimKitLite.attach({
    key: 'quiralidad-delta-lambda', title: "Δ/Λ Chirality · 3D Complexes", home: '../../',
    stages: stages, themeToggle: toggleTheme,
    snapshot: function () { return $$('c0'); },
    help: {
      intro: "Drag the models to rotate them, use the wheel to zoom and the numbered buttons (1–6) to change module. The <b>guided lesson</b> (book button, or the L key) goes through the six modules.",
      items: [
        ["Reflect", "converts Δ into Λ with a mirror plane."],
        ["Try orientations", "the 24 proper rotations of the octahedron; the histogram shows how many N coincide."],
        ["Bailar twist", "continuous twist; the helicity plot crosses zero at the achiral prism."],
        ["Challenge", "identify Δ or Λ in random orientations."]
      ]
    },
    extraKeys: [['1 – 6', "Change module"]]
  });
})();
