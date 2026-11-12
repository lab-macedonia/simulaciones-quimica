/* Rocas, estratos y fósiles — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE;
  var LY = [
    { n: 'Sandstone with trilobites', r: 'sandstone', c: 0xd9a066, f: 'trilobite', age: 510, per: 'Cambrian' },
    { n: 'Shale with armoured fish', r: 'shale', c: 0x8d8579, f: 'fish', age: 400, per: 'Devonian' },
    { n: 'Coal with ferns', r: 'coal', c: 0x3b3b3b, f: 'fern', age: 310, per: 'Carboniferous' },
    { n: 'Limestone with ammonites', r: 'limestone', c: 0xe9e3c9, f: 'ammonite', age: 150, per: 'Jurassic' },
    { n: 'K-Pg boundary clay', r: 'clay', c: 0xb07a52, f: null, age: 66, per: 'Cretaceous–Paleogene' },
    { n: 'Conglomerate with mammals', r: 'conglomerate', c: 0xc2a878, f: 'tooth', age: 10, per: 'Neogene' }
  ];
  var ROCK = { ig: { n: 'Igneous (granite)', c: 0xd6c9c9, how: 'magma cools' }, se: { n: 'Sedimentary (sandstone)', c: 0xd9a066, how: 'compacted, cemented sediments' }, me: { n: 'Metamorphic (gneiss)', c: 0x7d7d8a, how: 'heat and pressure without melting' } };
  var S = { mode: 'estratos', dep: 6, intr: false, up: 0, ero: 0, sel: 3, fos: 1, cyc: 0 };
  var G = {}, lab = {}, layers = [], fossils = [], W = 10, TH = 0.8;
  function stages() {
    return [
      ['Three types of rock', 'Types', 'Igneous, sedimentary and metamorphic rocks differ in their origin',
        '<p>Rocks are classified by their <b>origin</b>. <b>Igneous</b> rocks form when magma cools: slowly at depth (granite, with large crystals) or quickly at the surface (basalt). <b>Sedimentary</b> rocks form when sediments are compacted and cemented (sandstone, limestone) and may contain fossils. <b>Metamorphic</b> rocks are transformed by <b>heat and pressure</b> without melting (marble, gneiss).</p>'],
      ['The rock cycle', 'Cycle', 'Any rock can turn into another over time',
        '<p>Rocks change from one type to another in the <b>rock cycle</b>: <b>weathering and erosion</b> break any rock into sediment; sediment is <b>compacted</b> into sedimentary rock; <b>heat and pressure</b> turn it metamorphic; if it <b>melts</b> it forms magma, which <b>cools</b> into igneous rock. It is driven by the Earth’s internal heat (tectonics) and the Sun’s energy (water, wind, ice).</p>'],
      ['Sedimentation and strata', 'Strata', 'Sediments settle in horizontal layers',
        '<p>Rivers, wind and sea carry sediments that settle in <b>horizontal layers</b> at the bottom of lakes and seas. Under the weight of the layers above they are compacted and cemented: <b>strata</b> form. Each stratum records the environment of its time: beach sand, mud from calm waters, plant remains in swamps or shells in warm seas.</p>'],
      ['Fossilisation', 'Fossils', 'Remains or traces of living things preserved in rock',
        '<p>A <b>fossil</b> forms when an organism dies and is <b>buried quickly</b> by sediment, away from oxygen and decomposers. Over time, hard parts (bones, shells, teeth) are <b>replaced by minerals</b> or leave a mould. Footprints, burrows and droppings are fossils too. Most living things are <b>not</b> fossilised: the fossil record is incomplete.</p>'],
      ['Relative dating', 'Dating', 'Superposition: oldest at the bottom; whatever cuts a layer is younger',
        '<p>By the <b>principle of superposition</b>, in undisturbed strata the lower ones are <b>older</b> than those above. A magma <b>intrusion</b> (dyke) is <b>younger</b> than the layers it cuts through. <b>Index fossils</b> (such as trilobites or ammonites), which lived for a short time in many places, allow layers at different sites to be correlated and dated.</p>'],
      ['Uplift and erosion', 'Erosion', 'Internal forces lift the strata and erosion exposes them',
        '<p>Tectonic movements <b>lift</b> and sometimes <b>fold or tilt</b> the strata, which formed on the seabed; that is why marine fossils are found in mountains, even in the Andes. Then <b>erosion</b> by rivers and glaciers carves valleys and canyons that expose the sequence of layers, like a book of Earth’s history.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.intr = false; S.up = 0; S.ero = 0; S.fos = 1;
    if (i === 0) { S.mode = 'ciclo'; S.cyc = -1; }
    else if (i === 1) { S.mode = 'ciclo'; S.cyc = l * 5; }
    else if (i === 2) { S.mode = 'estratos'; S.dep = 0.5 + 5.5 * l; S.fos = 0; }
    else if (i === 3) { S.mode = 'estratos'; S.dep = 6; S.fos = l; S.sel = 3; }
    else if (i === 4) { S.mode = 'estratos'; S.dep = 6; S.intr = l > 0.4; S.sel = Math.min(5, Math.floor(l * 6)); }
    else { S.mode = 'estratos'; S.dep = 6; S.up = clamp(l * 2, 0, 1); S.ero = clamp(l * 2 - 0.6, 0, 1); S.intr = true; }
  }
  function box(w, h, d, c, o) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.95 }, o || {}))); }
  function fossilMesh(kind) {
    var m = new T.MeshStandardMaterial({ color: 0xf1e3c6, roughness: 0.5 }), g;
    if (kind === 'ammonite') { g = new T.Mesh(new T.TorusGeometry(0.22, 0.08, 10, 24, Math.PI * 1.8), m); }
    else if (kind === 'trilobite') { g = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), m); g.scale.set(1, 0.3, 1.5); }
    else if (kind === 'fish') { g = new T.Mesh(new T.ConeGeometry(0.12, 0.6, 8), m); g.rotation.z = Math.PI / 2; }
    else if (kind === 'fern') { g = new T.Mesh(new T.BoxGeometry(0.5, 0.03, 0.18), new T.MeshStandardMaterial({ color: 0x8ce99a })); }
    else { g = new T.Mesh(new T.ConeGeometry(0.08, 0.3, 6), m); }
    return g;
  }
  var def = {
    key: 'rocas-fosiles', title: 'Rocks, strata and fossils', subtitle: '3D simulator · Earth sciences', accent: { dark: '#e9c46a', light: '#8a5a00' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2.5, 6, 15], target: [-2, 2.2, 0] }, { id: 'frente', label: 'Front', pos: [-2, 2.6, 16], target: [-2, 2.4, 0] }],
    layers: [{ id: 'fos', label: 'Fossils', icon: '◎' }, { id: 'age', label: 'Ages', icon: '⏱' }],
    build: function (ctx) {
      var s = ctx.scene; G.st = new T.Group(); s.add(G.st);
      LY.forEach(function (ly, i) { var L = box(W, TH, 3.4, ly.c); L.position.set(0, TH / 2 + i * TH, 0); G.st.add(L); layers.push(L); var f = fossilMesh(ly.f); f.position.set(-3 + (i % 3) * 2.2, TH / 2 + i * TH, 1.75); f.visible = !!ly.f; G.st.add(f); fossils.push(f); });
      G.dike = box(0.6, TH * 6 + 0.6, 3.5, 0xc92a2a, { emissive: 0x3d0000 }); G.dike.position.set(2.6, TH * 3 - 0.3, 0); G.st.add(G.dike);
      G.water = box(W + 0.2, 1.4, 3.5, 0x4dabf7, { transparent: true, opacity: 0.3 }); s.add(G.water);
      G.cut = box(2.4, 1, 3.6, 0xdbe6f1, { transparent: true, opacity: 1 }); G.st.add(G.cut);
      G.org = fossilMesh('ammonite'); G.org.material = new T.MeshStandardMaterial({ color: 0xff922b }); s.add(G.org);
      // ciclo de rocas
      G.cyc = new T.Group(); s.add(G.cyc); G.rk = {};
      [['ig', -1.6, 0], ['se', 3.6, 2.2], ['me', 3.6, -2.2]].forEach(function (q) { var r = new T.Mesh(new T.DodecahedronGeometry(0.9, 0), new T.MeshStandardMaterial({ color: ROCK[q[0]].c, roughness: 0.9, flatShading: true })); r.position.set(q[1] - 1, 1.2, q[2]); G.cyc.add(r); G.rk[q[0]] = r; });
      G.magma = new T.Mesh(new T.SphereGeometry(0.8, 20, 14), new T.MeshStandardMaterial({ color: 0xff6b2b, emissive: 0x8a2a00 })); G.magma.position.set(0.8, -0.6, 0); G.cyc.add(G.magma);
      G.dot = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), new T.MeshBasicMaterial({ color: 0xffd43b })); G.cyc.add(G.dot);
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      var est = S.mode === 'estratos'; G.st.visible = est; G.water.visible = est && S.up < 0.2; G.cyc.visible = !est; G.org.visible = false;
      if (est) {
        var showF = ctx.layer('fos'), showA = ctx.layer('age');
        layers.forEach(function (L, i) { var k = clamp(S.dep - i, 0, 1); L.visible = k > 0; L.scale.y = Math.max(0.01, k); L.position.y = i * TH + TH * k / 2; fossils[i].visible = !!LY[i].f && k >= 1 && showF && (i !== 3 || S.fos > 0.85 || ctx.P.manual || f.i !== 3); });
        var top = Math.min(S.dep, 6) * TH; G.water.position.set(0, top + 0.7, 0); G.water.scale.y = 1;
        G.dike.visible = S.intr; G.st.rotation.z = -0.18 * S.up; G.st.position.y = 1.5 * S.up;
        G.cut.visible = S.ero > 0; G.cut.scale.set(1, Math.max(0.01, S.ero * TH * 4), 1); G.cut.position.set(-1.2, top - S.ero * TH * 2 + 0.02, 0); G.cut.material.color.setHex(ctx.theme === 'dark' ? 0x0e131a : 0xdbe6f1);
        if (f.i === 3 && !ctx.P.manual) { var y0 = 3 * TH + TH, fall = clamp(S.fos * 2.5, 0, 1); G.org.visible = S.fos < 0.85; G.org.position.set(-3 + 2.2 * 0, y0 + 2.5 * (1 - fall), 1.75); lab.g.pos(-3, y0 + 3.2, 1.75).set(S.fos < 0.35 ? 'An ammonite dies and sinks to the bottom' : S.fos < 0.6 ? 'Sediment covers it' : S.fos < 0.85 ? 'Minerals replace the shell' : 'Fossil', 'bl-lead').vis(true); }
        if (showA) LY.forEach(function (ly, i) { if (S.dep - i >= 1) lab[['a', 'b', 'c', 'd', 'e', 'f'][i]].pos(W / 2 + 1.6, i * TH + TH / 2 + 1.5 * S.up - 0.9 * S.up * (i / 6), 0).set(ly.per + ' · ' + fmt(ly.age, 0) + ' Ma', i === S.sel ? 'bl-warn' : 'bl-d').vis(true); });
        if (S.intr) lab.g.pos(2.6, 6 * TH + 1 + 1.5 * S.up, 0).set('Dyke: younger than the layers it cuts', 'bl-pos').vis(true);
        layers.forEach(function (L, i) { L.material.emissive && L.material.emissive.setHex(i === S.sel ? 0x332200 : 0x000000); });
      } else {
        var steps = [['se', 'me', 'Heat and pressure'], ['me', 'magma', 'Melting'], ['magma', 'ig', 'Cooling'], ['ig', 'se', 'Weathering, erosion and compaction'], ['se', 'se', 'Sediment → sedimentary rock']], k2 = Math.floor(S.cyc), u = S.cyc - k2;
        G.dot.visible = S.cyc >= 0; if (S.cyc >= 0) { var st2 = steps[Math.min(4, k2)], a = st2[0] === 'magma' ? G.magma.position : G.rk[st2[0]].position, b = st2[1] === 'magma' ? G.magma.position : G.rk[st2[1]].position; G.dot.position.copy(a).lerp(b, u); G.dot.position.y += 0.6 + Math.sin(u * Math.PI) * 1.2; lab.g.pos(0.8, 4.2, 0).set(st2[2], 'bl-lead').vis(true); }
        Object.keys(G.rk).forEach(function (key, j) { G.rk[key].rotation.y += dt * 0.3; lab[['a', 'b', 'c'][j]].pos(G.rk[key].position.x, 2.6, G.rk[key].position.z).set(ROCK[key].n, 'bl-pos').vis(true); });
        lab.d.pos(0.8, -1.8, 0).set('Magma', 'bl-warn').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.dep && u.dep.set(S.dep); u.up && u.up.set(S.up); } },
    hud: function () { var ly = LY[S.sel]; return { eq: { chip: '⛰', name: S.mode === 'estratos' ? 'Stratum ' + (S.sel + 1) + ': ' + ly.n : 'Rock cycle', body: S.mode === 'estratos' ? '<div class="eqline"><small>Period</small>' + ly.per + '</div><div class="eqline"><small>Approx. age</small>' + fmt(ly.age, 0) + ' million years</div><div class="eqline"><small>Rock</small>' + ly.r + '</div>' : '<div class="eqline"><small>Igneous</small>' + ROCK.ig.how + '</div><div class="eqline"><small>Sedimentary</small>' + ROCK.se.how + '</div><div class="eqline"><small>Metamorphic</small>' + ROCK.me.how + '</div>' }, legend: [{ label: 'Bottom', color: '#d9a066', text: 'oldest strata' }, { label: 'Red', color: '#c92a2a', text: 'igneous intrusion (dyke)' }, { label: 'Cream', color: '#f1e3c6', text: 'fossils' }] }; },
    measures: function () { var ly = LY[S.sel]; return [['Strata deposited', fmt(Math.min(6, S.dep), 1)], ['Selected stratum', (S.sel + 1) + ' · ' + ly.n], ['Age', fmt(ly.age, 0) + ' Ma (' + ly.per + ')'], ['Index fossil', ly.f ? ly.f : '—'], ['Intrusion', S.intr ? 'yes (younger than the layers)' : 'no'], ['Uplift', fmt(S.up * 100, 0) + ' %']]; },
    ideas: ['Igneous: cooled magma; sedimentary: compacted sediment; metamorphic: heat and pressure.', 'Rock cycle: any rock can become another.', 'Strata: horizontal layers of sediment.', 'Fossil: a remain or trace preserved in sedimentary rock.', 'Superposition: oldest at the bottom.', 'Index fossils date and correlate layers.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Scene'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'View', cols: 2, value: S.mode, options: [{ v: 'estratos', label: 'Strata and fossils' }, { v: 'ciclo', label: 'Rock cycle' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.dep = kit.ui.slider({ label: 'Strata deposited', min: 0, max: 6, step: 0.1, value: S.dep, digits: 1, onInput: function (v) { ctx.goManual(); S.mode = 'estratos'; S.dep = v; } });
      ui.up = kit.ui.slider({ label: 'Uplift and erosion', min: 0, max: 1, step: 0.05, value: S.up, digits: 2, onInput: function (v) { ctx.goManual(); S.mode = 'estratos'; S.up = v; S.ero = clamp(v * 1.2 - 0.2, 0, 1); } });
      ui.sel = kit.ui.slider({ label: 'Stratum to examine (1 = lowest)', min: 1, max: 6, step: 1, value: S.sel + 1, digits: 0, onInput: function (v) { ctx.goManual(); S.sel = clamp(Math.round(v), 1, 6) - 1; } });
      c.appendChild(kit.ui.sliders([ui.dep, ui.up, ui.sel]));
      el.appendChild(ctx.btnRow([{ t: 'Intrusion on / off', fn: function () { ctx.goManual(); S.intr = !S.intr; } }, { t: 'Run the cycle', primary: true, fn: function () { ctx.goManual(); S.mode = 'ciclo'; S.cyc = 0; var id = setInterval(function () { S.cyc += 0.05; if (S.cyc >= 5) { S.cyc = 4.99; clearInterval(id); } }, 60); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Stratigraphic column', h: 240, note: 'Each stratum with its approximate age and index fossil. Lower down, older (principle of superposition).', draw: function (cx, w, h, col) {
        var L = 20, Bm = 10, rh = (h - 20) / 6, cw = 90; cx.font = '11px system-ui'; cx.textAlign = 'left';
        LY.forEach(function (ly, i) { var y = h - Bm - (i + 1) * rh; cx.fillStyle = '#' + ('00000' + ly.c.toString(16)).slice(-6); cx.fillRect(L, y, cw, rh - 2); if (i === S.sel) { cx.strokeStyle = '#e8590c'; cx.lineWidth = 3; cx.strokeRect(L, y, cw, rh - 2); cx.lineWidth = 1; } cx.fillStyle = col.ink; cx.fillText(ly.per + ' · ' + fmt(ly.age, 0) + ' Ma', L + cw + 10, y + rh / 2 - 2); cx.fillStyle = col.muted; cx.fillText(ly.n, L + cw + 10, y + rh / 2 + 12); });
      } },
      { title: 'Rock cycle', h: 220, note: 'Processes that turn one type of rock into another.', draw: function (cx, w, h, col) {
        var P2 = { ig: [w * 0.2, h * 0.55], se: [w * 0.75, h * 0.25], me: [w * 0.75, h * 0.8], mg: [w * 0.45, h * 0.9] }, nm = { ig: 'Igneous', se: 'Sedimentary', me: 'Metamorphic', mg: 'Magma' };
        function arr(a, b, t) { var A = P2[a], B = P2[b]; cx.strokeStyle = col.muted; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(A[0], A[1]); cx.lineTo(B[0], B[1]); cx.stroke(); var ang = Math.atan2(B[1] - A[1], B[0] - A[0]), mx = A[0] + (B[0] - A[0]) * 0.62, my = A[1] + (B[1] - A[1]) * 0.62; cx.fillStyle = col.muted; cx.beginPath(); cx.moveTo(mx + 8 * Math.cos(ang), my + 8 * Math.sin(ang)); cx.lineTo(mx - 6 * Math.cos(ang) + 5 * Math.sin(ang), my - 6 * Math.sin(ang) - 5 * Math.cos(ang)); cx.lineTo(mx - 6 * Math.cos(ang) - 5 * Math.sin(ang), my - 6 * Math.sin(ang) + 5 * Math.cos(ang)); cx.fill(); cx.fillStyle = col.ink; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(t, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 6); }
        arr('ig', 'se', 'erosion and compaction'); arr('se', 'me', 'heat and pressure'); arr('me', 'mg', 'melting'); arr('mg', 'ig', 'cooling');
        cx.font = 'bold 12px system-ui'; Object.keys(P2).forEach(function (k) { cx.fillStyle = k === 'mg' ? '#ff6b2b' : '#e9c46a'; cx.beginPath(); cx.arc(P2[k][0], P2[k][1], 6, 0, 7); cx.fill(); cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(nm[k], P2[k][0], P2[k][1] + 20); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, ly = LY[S.sel], below = S.sel > 0 ? LY[S.sel - 1] : null, above = S.sel < 5 ? LY[S.sel + 1] : null;
      return '<div class="card-kicker">Stratum ' + (S.sel + 1) + '</div><table class="calc-table">' + row('Rock', ly.r) + row('Age', '≈ <b>' + fmt(ly.age, 0) + ' million years</b> (' + ly.per + ')') + row('Older than', above ? above.n + ' (' + fmt(above.age, 0) + ' Ma)' : '—') + row('Younger than', below ? below.n + ' (' + fmt(below.age, 0) + ' Ma)' : '—') + row('Time between this one and the one below', below ? fmt(below.age - ly.age, 0) + ' million years' : '—') + row('Dyke (if present)', 'younger than ' + fmt(LY[5].age, 0) + ' Ma: it cuts all the layers') + '</table>';
    },
    quiz: [
      { q: 'Granite, with large crystals, is a … rock', options: ['igneous, cooled slowly at depth', 'sedimentary', 'metamorphic', 'igneous, cooled quickly'], answer: 0, why: 'Slow cooling lets the crystals grow.' },
      { q: 'Fossils are mostly found in … rocks', options: ['sedimentary', 'igneous', 'metamorphic', 'volcanic'], answer: 0, why: 'Organisms are buried in sediment.' },
      { q: 'Marble forms from limestone through…', options: ['heat and pressure', 'cooling of magma', 'erosion', 'evaporation'], answer: 0, why: 'It is a metamorphic rock.' },
      { q: 'According to the principle of superposition, in undisturbed strata…', options: ['the lower ones are older', 'the upper ones are older', 'they are all the same age', 'the thickest are oldest'], answer: 0, why: 'Each layer settles on top of the previous one.' },
      { q: 'An igneous dyke cutting through several strata is…', options: ['younger than those strata', 'older than them', 'the same age', 'impossible to date'], answer: 0, why: 'The layers had to exist for the magma to cut them.' },
      { q: 'A good index fossil must…', options: ['have lived for a short time in many places', 'be very large', 'have lived for many millions of years in one place', 'be from a living species'], answer: 0, why: 'That way it gives a precise age and allows correlation.' },
      { q: 'Marine fossils are found in the Andes because…', options: ['marine strata were lifted by tectonics', 'the sea covered the Andes last year', 'the animals climbed the mountain', 'the wind carried them there'], answer: 0, why: 'Subduction lifted rocks that formed on the seabed.' },
      { q: 'The engine of the rock cycle is…', options: ['the Earth’s internal heat and the Sun’s energy', 'the Moon alone', 'living things alone', 'the magnetic field'], answer: 0, why: 'Tectonics and external agents (water, wind, ice).' }
    ],
    help: { intro: 'In «Lab» deposit strata, add an intrusion, lift and erode the sequence or run through the rock cycle.', items: [['Strata', 'each colour is a layer with its age and index fossil (Ages layer).'], ['Red dyke', 'igneous rock younger than the layers it cuts.'], ['Cycle', 'the yellow dot follows the processes that transform rocks.']], try: ['Deposit the strata one by one: which is the oldest?', 'Turn on the intrusion and order the events from oldest to most recent.', 'Lift and erode: which layers are exposed in the valley?'] }
  };
  MSim.create(def);
})();
